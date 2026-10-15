---
group:
  title: 【03】字符串介绍
  order: 3
order: 24
title: upper 与 lower 与 casefold 方法
nav:
  title: Python基础
  order: 1
---

# upper 与 lower 与 casefold 方法

## 1. 介绍

### 1.1 知识点定义

`str.upper()` / `str.lower()` / `str.casefold()` 是字符串的**大小写转换方法**：三者都作用于整串、都无参数、都返回转换后的新串。`upper` 把所有有对应大写的字符升成大写，`lower` 降成小写——这两个是最直觉的"转换"。第三个 `casefold` 面世于 Python 3.3，做的是**大小写折叠**（case folding）：一种比 lower 更彻底的归一化操作，**专为"忽略大小写的比较"而设计**——官方文档把它明确定义为"删除字符串中的所有大小写区分"。

| 维度 | `upper()` | `lower()` | `casefold()` |
|------|------|------|------|
| 所属 | `str` 的内置实例方法 | 同左 | 同左 |
| 语法 | `s.upper()` | `s.lower()` | `s.casefold()` |
| 参数 | 无——传参抛 `TypeError` | 同左 | 同左 |
| 方向 | 全部转大写 | 全部转小写 | 折叠为"大小写中性形态" |
| 典型用途 | 展示排版（标题、工牌、告警横幅） | 展示排版（正文小写化） | **比较**（判等、查找、归一化键） |
| 特殊行为 | 部分字符一对多（`ß` → `SS`） | 对 `ß` 无计可施 | 对 `ß` 折成 `ss`、三 sigma 统一 |
| 引入版本 | Python 3.0 起 | 同左 | Python 3.3 |

先摆出本篇最重要的一句认知：**`casefold` 不是"更狠的 lower"，它是另一件工具**。`lower` 的目的是"写出正确的小写形态"——它要忠于拼写规则，德语 `ß` 本身就是合法小写，所以 `lower` 不动它；`casefold` 的目的是"让两个同一词的不同写法折叠成一致"——拼写规则在这里让位于归一化，`ß` 被强制摊平成 `ss`。一个是**书写工具**，一个是**比较工具**——用途不同，才是它们并存的理由。这个分歧在德语 `straße` 与 `STRASSE` 的判等实验中会正面爆炸（2.3 节），也是全篇的高潮。

这对方法解决的核心问题是：**"处理大小写不定的外部输入"**。用户表单里大小写随机的邮箱与用户名、来源混杂的日志分级、多语言数据里的检索与去重——凡是"大小写不该影响结果"的地方，都要靠这一族方法把文本拉回同一个形态再处理。

### 1.2 最简示例

一串混着大小写与数字的文本，三个方法各转一次：

```python
s = "Hello World 123"

print(f"原串:     {s!r}")
print(f"upper:    {s.upper()!r}")
print(f"lower:    {s.lower()!r}")
print(f"casefold: {s.casefold()!r}")
```

运行结果：

```text
原串:     'Hello World 123'
upper:    'HELLO WORLD 123'
lower:    'hello world 123'
casefold: 'hello world 123'
```

纯 ASCII 文本上，`casefold` 与 `lower` 的结果完全一致——数字与标点这类"没有大小写"的字符原样通过，`Hello` 里的 `H` 各自归位。三者的分歧只藏在特殊字符里：`ß`、希腊字母、连字——这些是 2.3 与 2.5 节的内容。日常英文数据上你会感觉不到 `casefold` 的存在，**但它正是为那些"你感觉不到却真实存在"的多语言场景准备的保险**。

### 1.3 大小写工具体系中的定位

字符串里与"大小写"相关的方法分三路，本篇聚焦"转换"这一路：

```text
字符串大小写方法体系
│
├── 整串转换 —— upper / lower / casefold (本篇)
│     ├── upper / lower: 大小写形态转换(书写工具)
│     └── casefold: 大小写折叠归一(比较工具)
│
├── 形态判定 —— isupper / islower
│     └── 回答"当前串是什么大小写形态"
│
└── 单词级转换 —— capitalize / title / swapcase
      └── 首字母、词首、大小写对调等更细粒度的操作
```

三路工具一问一答：判定方法回答"现在是什么形态"，转换方法回答"把它变成什么形态"，单词级方法处理整串转换覆盖不到的细粒度需求。本篇的三剑客是其中最常用的部分——**几乎所有"归一化后比较"的代码路径都从它们起步**。

## 2. 核心内容

### 2.1 三方法的基本行为

#### 2.1.1 签名与转换方向

三个方法共享完全相同的签名形状——无参数、返回新串：

```python
s = "Hello World 123"

print(f"upper:    {s.upper()!r}")
print(f"lower:    {s.lower()!r}")
print(f"casefold: {s.casefold()!r}")
```

运行结果：

```text
upper:    'HELLO WORLD 123'
lower:    'hello world 123'
casefold: 'hello world 123'
```

转换方向是方法名即语义：`upper` 升、`lower` 降、`casefold` 折。没有区间参数、没有开关选项——**要转换局部，自己做切片**；这是整串方法的共同纪律。

#### 2.1.2 参数纪律：不收任何参数

三个方法传任何参数都被直接拒绝：

```python
for method in ["upper", "lower", "casefold"]:
    try:
        getattr("a", method)("x")
    except TypeError as e:
        print(f"{method:>9} 带参数 -> TypeError: {e}")
```

运行结果：

```text
    upper 带参数 -> TypeError: str.upper() takes no arguments (1 given)
    lower 带参数 -> TypeError: str.lower() takes no arguments (1 given)
 casefold 带参数 -> TypeError: str.casefold() takes no arguments (1 given)
```

同一个"takes no arguments"模板——三个方法在签名纪律上完全对齐，从调用错误的角度看它们就是同一个家族的三胞胎。

#### 2.1.3 返回新串：原串不变，忘记接收等于白忙

字符串不可变，转换的结果必然是一个新串，**原串从头到尾保持原样**：

```python
raw = "Alice Error 500"

print(f"raw 原串:      {raw!r}")
print(f"raw.upper():   {raw.upper()!r}")

raw.upper()          # 反面教材: 结果被丢弃
print(f"不接收后 raw:  {raw!r}")
```

运行结果：

```text
raw 原串:      'Alice Error 500'
raw.upper():   'ALICE ERROR 500'
不接收后 raw:  'Alice Error 500'
```

第二行的 `raw.upper()` 确实执行了转换、确实造出了 `'ALICE ERROR 500'`——但这个新串无人接收，当场蒸发，`raw` 原封不动。**"调用了大小写转换但数据没变"的 bug，第一嫌疑人永远是忘记接收返回值**——这与剥壳方法家族的坑一模一样，都是"新串落空"的同一种事故。

#### 2.1.4 对象细节：无变化也新建对象

一个与剥壳家族不同的实现细节，实测为证：

```python
s1, s2 = "ABC", "abc"

print(f"'ABC'.upper() is 原串: {s1.upper() is s1}")
print(f"'abc'.lower() is 原串: {s2.lower() is s2}")
```

运行结果：

```text
'ABC'.upper() is 原串: False
'abc'.lower() is 原串: False
```

`'ABC'.upper()` 的内容毫无变化，但 `is` 显示它**还是新建了对象**——长大写串转大写、纯中文串做转换，结果串都是新造的。这与"剥无可剥时 CPython 返回原对象"的 strip 家族行为相反。实践启示很简单：**判断"是否发生转换"用内容比较（`s.upper() == s`），不要用对象身份（`is`）**——后者在这个家族里没有兑现过任何承诺。

### 2.2 中性字符：转换的无人区

#### 2.2.1 没有大小写体系的文字一律原样通过

"大小写转换"只对**存在大小写对应**的字符生效。汉字、假名、数字、标点、emoji——这些文字体系里根本没有"大小写"的概念，三个方法对它们一律原样放行：

```python
neutrals = ["中文", "日本語", "123", "!@#", "🚀"]

for s in neutrals:
    unchanged = (s.upper() == s) and (s.lower() == s)
    print(f"  {s!r}: upper/lower 均不变 -> {unchanged}")
```

运行结果：

```text
  '中文': upper/lower 均不变 -> True
  '日本語': upper/lower 均不变 -> True
  '123': upper/lower 均不变 -> True
  '!@#': upper/lower 均不变 -> True
  '🚀': upper/lower 均不变 -> True
```

五个样本全部纹丝不动。**"中文做 upper 怎么没反应"不是 bug**——汉字没有大写形态，转换从技术上无从下手。判断一个字符会不会被转换，标准不是"中文还是英文"，而是"**这个字符有没有大小写对应**"。

#### 2.2.2 有大小写体系的文字照常参与

用希腊字母验证上面那条标准——希腊字母有一套完整的大小写体系，所以它照常参与转换：

```python
greek = "αβγ"
print(f"{greek!r}: lower 不变(已是小写) -> {greek.lower() == greek}")
print(f"{greek!r}: upper 会变 -> {greek.upper()!r}")
```

运行结果：

```text
'αβγ': lower 不变(已是小写) -> True
'αβγ': upper 会变 -> 'ΑΒΓ'
```

`αβγ` 已是合法小写所以 `lower` 不动它，`upper` 把它升成 `ΑΒΓ`——与英文字母的行为完全同构。**转换的参与资格由 Unicode 字符属性决定，每个字符独立裁决、与语种无关**。

#### 2.2.3 混合文本：逐字符独立裁决

真实数据几乎永远是混合体。转换对**每个字符独立判断**——该转的转、不该转的原样保留，两种字符互不干扰：

```python
samples = ["状态码 200 OK", "第3版 Version.3"]

for s in samples:
    print(f"  原串: {s!r}")
    print(f"  upper: {s.upper()!r}")
    print(f"  lower: {s.lower()!r}")
```

运行结果：

```text
  原串: '状态码 200 OK'
  upper: '状态码 200 OK'
  lower: '状态码 200 ok'
  原串: '第3版 Version.3'
  upper: '第3版 VERSION.3'
  lower: '第3版 version.3'
```

第二组里 `'第3版 Version.3'` 的汉字与数字全程不变，英文部分整段参与大小写切换——**转换边界精确到字符级**。这也解释了中文数据管道的常见现象："整个字段做了 upper，怎么只有英文变了？"——因为能变的从来只有英文字母这一部分。

### 2.3 德语 eszett：三方法的正面对决

#### 2.3.1 ß 过三关：长度不守恒

德语的 sharp s（eszett，写作 `ß`）是大小写世界里最著名的特殊字符——它**本身是小写形状，却没有对应的"单字符大写"**：官方规定它的大写就是两个字母的 `SS`。让 `ß` 分别过三个方法：

```python
print(f"  'ß'.lower()    -> {'ß'.lower()!r} (长度 {len('ß'.lower())})   <- 已是小写, 不变")
print(f"  'ß'.casefold() -> {'ß'.casefold()!r} (长度 {len('ß'.casefold())})   <- 折叠成 ss")
print(f"  'ß'.upper()    -> {'ß'.upper()!r} (长度 {len('ß'.upper())})   <- 大写成 SS")
```

运行结果：

```text
  'ß'.lower()    -> 'ß' (长度 1)   <- 已是小写, 不变
  'ß'.casefold() -> 'ss' (长度 2)   <- 折叠成 ss
  'ß'.upper()    -> 'SS' (长度 2)   <- 大写成 SS
```

三条结果呈三种姿态：`lower` 看到 `ß` 时承认"它已经是合法小写"所以不再动；`upper` 按拼写规则把它升成两个字母的 `SS`；`casefold` 把它摊平为两个小写 `ss`。**一个字符转出两个字符——大小写转换不保证长度守恒**，这是第一个重要观察，后面反复出现。

#### 2.3.2 straße vs STRASSE：三种比较的结果分岔

`straße`（小写整词）与 `STRASSE`（大写整词）是**同一个德语词的两种合法写法**。人眼一看便知它们相同，让三个方法分别主持判等：

```python
a, b = "straße", "STRASSE"

print(f"  lower 比较:    {a.lower() == b.lower()}")
print(f"    -> {a.lower()!r} vs {b.lower()!r}")
print(f"  upper 比较:    {a.upper() == b.upper()}")
print(f"    -> {a.upper()!r} vs {b.upper()!r}")
print(f"  casefold 比较: {a.casefold() == b.casefold()}")
print(f"    -> {a.casefold()!r} vs {b.casefold()!r}")
```

运行结果：

```text
  lower 比较:    False
    -> 'straße' vs 'strasse'
  upper 比较:    True
    -> 'STRASSE' vs 'STRASSE'
  casefold 比较: True
    -> 'strasse' vs 'strasse'
```

三种比较的判决书：

- **lower 判不等**——`'straße'` 与 `'strasse'`：lower 不敢动 `ß`，两边的折叠形态分歧留在原地。
- **upper 判相等**——`'STRASSE'` 与 `'STRASSE'`：看起来正确，但机制是 **`ß`.upper() 恰好产出 `SS`**，两个 `s` 的拼写恰好与对方大写的 `SS` 逐字符撞上——**这一次的成功靠的是运气**：不是所有一对多折叠都能在大写形态上对齐，换一个词未必成立。
- **casefold 判相等**——`'strasse'` 与 `'strasse'`：两边的 `ß` 与 `SS` 被折叠到同一个形态，**这是语义保证的相等**，不靠任何巧合。

一次判等实验，三个方法给出了"错、碰巧对、必然对"三种答案——**这就是"书写工具"与"比较工具"的分野现场**。比较场景下唯一的规范答案是 `casefold`。

#### 2.3.3 长度漂移：依赖长度的算法会翻车

`ß` 的折叠还引出一个工程细节——**casefold 前后长度可以不同**：

```python
low = "straße"
print(f"  原串:     {low!r} (len={len(low)})")
print(f"  casefold: {low.casefold()!r} (len={len(low.casefold())})")
```

运行结果：

```text
  原串:     'straße' (len=6)
  casefold: 'strasse' (len=7)
```

6 成 7。任何**隐含"折叠后长度不变"假设**的代码都会在这类输入上翻车：按索引逐位对齐的算法、假设 `len(s) == len(s.casefold())` 的断言、字符数组等长替换——全部要为长度漂移付出代价。处理多语言数据，转换后的长度必须实测，不能预判。

### 2.4 希腊 sigma：归一化的本职

#### 2.4.1 sigma 三姐妹：一对大小写，三个成员

希腊字母 sigma 是大小写世界里另一个经典角色——它有**三个成员**：大写 `Σ`、词中小写 `σ`、词尾小写 `ς`（final form，词尾专用形）：

```python
print(f"  'Σ'.lower() -> {'Σ'.lower()!r}    <- 大写降为词中形式")
print(f"  'σ'.upper() -> {'σ'.upper()!r}")
print(f"  'ς'.upper() -> {'ς'.upper()!r}    <- 词尾形式升回同一个大写")
```

运行结果：

```text
  'Σ'.lower() -> 'σ'    <- 大写降为词中形式
  'σ'.upper() -> 'Σ'
  'ς'.upper() -> 'Σ'    <- 词尾形式升回同一个大写
```

两个小写升上去汇合到同一个大写 `Σ`——**一对大小写对应关系却有三个成员**。`upper` 在这里没有歧义（小写们共享一个大写），但 `lower` 从大写降下来时要"挑"一种小写，怎么挑？

#### 2.4.2 lower 的位置依赖：final form

`lower` 从大写 `Σ` 降下来时的挑选依据是**位置**——词尾用 `ς`，词中用 `σ`：

```python
print(f"  'ΑΣ'.lower()  -> {'ΑΣ'.lower()!r}   <- 词尾 sigma 用 final form ς")
print(f"  'ΑΣΑ'.lower() -> {'ΑΣΑ'.lower()!r}  <- 同一个字母, 词中还原 σ")
```

运行结果：

```text
  'ΑΣ'.lower()  -> 'ας'   <- 词尾 sigma 用 final form ς
  'ΑΣΑ'.lower() -> 'ασα'  <- 同一个字母, 词中还原 σ
```

`'ΑΣ'` 与 `'ΑΣΑ'` 是同一个大写词根，仅尾部多了一个 `Α`，`lower` 的产出就不同——**lower 忠实于拼写规则**（希腊文字规范确实要求词尾写 ς），但这种"忠于拼写"对比较场景是灾难：同一个词根的两种合法小写形态在判等时互相为敌。

#### 2.4.3 casefold 统一三姐妹

`casefold` 对 sigma 的处理方式：**三个成员统一折叠为 `σ`**，位置信息一律抹掉：

```python
family = "Σςσ"
folded = [c.casefold() for c in family]
print(f"  逐字符 casefold: {[c for c in family]!r} -> {folded}")
print(f"  'Σς'.casefold() == 'σσ'.casefold(): {'Σς'.casefold() == 'σσ'.casefold()}")
print(f"  'ΑΣ'.casefold(): {'ΑΣ'.casefold()!r}   <- 尾部不再变 ς, 统一 σ")
```

运行结果：

```text
  逐字符 casefold: ['Σ', 'ς', 'σ'] -> ['σ', 'σ', 'σ']
  'Σς'.casefold() == 'σσ'.casefold(): True
  'ΑΣ'.casefold(): 'ασ'   <- 尾部不再变 ς, 统一 σ
```

三姐妹全部归一到 `σ`——大写、词尾、词中的形态差异被折叠抹平。**归一化是 casefold 的本职**：比较只关心"是不是同一个字母"，不关心它在句子里穿什么形态的衣服。lower 的"位置依赖"在书写上是优点（排版正确），在比较上是缺陷——这正是 casefold 存在的第二重理由。

### 2.5 一对多折叠清单

#### 2.5.1 连字家族：一个字形，两个字母

排印用的**连字**（ligature）把两个字母合铸成一个字形——`fi` 连字 `ﬁ`、`fl` 连字 `ﬂ` 等。视觉上是一个字符，语义上是两个字母，casefold 把它们摊回普通拼写：

```python
ligatures = [
    ("ﬁ", "fi"),    # fi 连字
    ("ﬂ", "fl"),    # fl 连字
    ("ﬀ", "ff"),    # ff 连字
    ("ﬃ", "ffi"),    # ffi 连字
    ("ﬄ", "ffl"),    # ffl 连字
]

for lig, plain in ligatures:
    print(f"  U+{ord(lig):04X} {lig!r}: upper -> {lig.upper()!r}, "
          f"casefold -> {lig.casefold()!r}, 还原为 {plain}: {lig.casefold() == plain}")
```

运行结果：

```text
  U+FB01 'ﬁ': upper -> 'FI', casefold -> 'fi', 还原为 fi: True
  U+FB02 'ﬂ': upper -> 'FL', casefold -> 'fl', 还原为 fl: True
  U+FB00 'ﬀ': upper -> 'FF', casefold -> 'ff', 还原为 ff: True
  U+FB03 'ﬃ': upper -> 'FFI', casefold -> 'ffi', 还原为 ffi: True
  U+FB04 'ﬄ': upper -> 'FFL', casefold -> 'ffl', 还原为 ffl: True
```

五个连字全部被 casefold 还原成对应的普通拼写（`ﬁ` → `fi`，判等 True）。**从 PDF 复制文本、从排版精美的文档提取数据时，连字是常客**——搜索 "define" 匹配不上 "deﬁne" 的怪事，根源就在 `ﬁ` 这个字形；casefold 是对这类事故事件的标准处理。

#### 2.5.2 带点大写 İ：折叠也能"分解"出两个字符

土耳其语的带点大写 I（`İ`，U+0130）展示了折叠的另一种形态——**分解**成一个普通字母 + 一个组合符号：

```python
idot = "İ"
combined = "i̇"     # 'i' + U+0307 组合点

print(f"  'İ'.upper():    {idot.upper()!r}   <- 已是大写, 不变")
print(f"  'İ'.casefold(): {idot.casefold()!r} (len={len(idot.casefold())})")
print(f"  分解轨迹: {[f'U+{ord(c):04X}' for c in idot.casefold()]}")
print(f"  与 'i'+组合点 相等: {idot.casefold() == combined}")
print(f"  与裸 'i' 相等:      {idot.casefold() == 'i'}")
```

运行结果：

```text
  'İ'.upper():    'İ'   <- 已是大写, 不变
  'İ'.casefold(): 'i̇' (len=2)
  分解轨迹: ['U+0069', 'U+0307']
  与 'i'+组合点 相等: True
  与裸 'i' 相等:      False
```

`İ` 折叠成 `i` + U+0307 组合下点记号（长度 2）——**土耳其语的字母体系里"大写带点"与"小写带点"成对**，折叠把点保下来体现体系忠实，但这也意味着 `'İ'` 与 `'i'` 在 casefold 后**并不相等**（一个带组合点、一个不带）。处理土耳其语数据时这是已知的坑：真需要"面向土耳其语"的比较要认真设计，Python 的 str 方法不感知语言环境。

#### 2.5.3 casefold 与 lower 的分歧统计

lower 与 casefold 到底差多少？在拉丁区、希腊区、扩展区、连字区、符号区的 2000 多个码点上做个抽查统计：

```python
same = 0
diff = 0
diffs = []
ranges = [range(0x20, 0x600), range(0x1E00, 0x2000),
          range(0xFB00, 0xFB20), range(0x2100, 0x2150)]

for rng in ranges:
    for code in rng:
        ch = chr(code)
        if ch.casefold() == ch.lower():
            same += 1
        else:
            diff += 1
            diffs.append((code, ch))

print(f"  抽查范围约 {same + diff} 个码点: {same} 个行为相同, {diff} 个不同")
for code, ch in diffs[:6]:
    print(f"    U+{code:04X} {ch!r}: lower()={ch.lower()!r}, casefold()={ch.casefold()!r}")
```

运行结果：

```text
  抽查范围约 2128 个码点: 2012 个行为相同, 116 个不同
    U+00B5 'µ': lower()='µ', casefold()='μ'
    U+00DF 'ß': lower()='ß', casefold()='ss'
    U+0149 'ŉ': lower()='ŉ', casefold()='ʼn'
    U+017F 'ſ': lower()='ſ', casefold()='s'
    U+01F0 'ǰ': lower()='ǰ', casefold()='ǰ'
    U+0345 'ͅ': lower()='ͅ', casefold()='ι'
```

**约 5% 的字符在两个方法上行为不同**——这 5% 里包括：微符号 `µ`（折叠后与希腊 mu `μ` 互通）、eszett、长 s `ſ`（历史字形折叠为普通 s）……95% 的日常字符上 casefold 与 lower 毫无区别，**但正是这 5% 保证了剩下 95% 场景的可信度**——你无法预知哪天哪条数据撞上这 5%，所以才把 casefold 定为比较场景的统一姿势，而不是逐字符判断后混用。

### 2.6 往返不对称

#### 2.6.1 ß 的一去不返

直觉认为"转过去再转回来应该得到原串"（`s.upper().lower() == s`）。`ß` 直接打破这条直觉：

```python
s = "ß"
print(f"  原串:               {s!r}")
print(f"  'ß'.upper():        {s.upper()!r}   <- 一个变两个")
print(f"  'ß'.upper().lower(): {s.upper().lower()!r}   <- 回不去了")
print(f"  往返不对称: {s.upper().lower() != s}")
```

运行结果：

```text
  原串:               'ß'
  'ß'.upper():        'SS'   <- 一个变两个
  'ß'.upper().lower(): 'ss'   <- 回不去了
  往返不对称: True
```

`ß`.upper() 变成 `SS` 的那一刻，"这是一整个 eszett"的信息就丢了——再 lower 回来是两个普普通通的 `ss`，**普通的两个 s 顶替了原来的 ß，而它们并不等价**（德语里 `ss` 与 `ß` 有微妙但真实的区分）。

#### 2.6.2 往返账本：谁回得去、谁回不去

把几个代表性字符送一圈再接回来，账本记录在案：

```python
ledger = [
    ("a", "普通小写字母", "往返对称: lower 时不变, 升再降能还原"),
    ("ä", "带分音符小写", "往返对称: 小写原串升大写再降回小写"),
    ("ß", "eszett", "往返不对称: 一个变两个, 回来是 ss"),
    ("İ", "带点大写 I", "往返不对称: lower 带出组合点, 带不回去"),
    ("ﬁ", "fi 连字", "往返不对称: upper 变 FI, lower 回来是 fi"),
]

for ch, label, verdict in ledger:
    status = "回不去" if ch.upper().lower() != ch else "回得去"
    print(f"  {ch!r} ({label}): {ch.upper().lower()!r} -> {status}")
```

运行结果：

```text
  'a' (普通小写字母): 'a' -> 回得去
  'ä' (带分音符小写): 'ä' -> 回得去
  'ß' (eszett): 'ss' -> 回不去
  'İ' (带点大写 I): 'i̇' -> 回不去
  'ﬁ' (fi 连字): 'fi' -> 回不去
```

账本一清二楚：**一对一且大小写对称的字符往返无恙**（`a`、`ä`），**涉及"一对多"或"分解"的字符全部一去不返**（`ß`、`İ`、`ﬁ`）。判定规律与 2.5 节完全吻合——**折叠是把信息摊平的操作**，摊平容易、复原不可能。

#### 2.6.3 实践含义：单向变形

把结论推到整词层面：

```python
word = "straße"
print(f"  原串: {word!r}")
print(f"  upper().lower() 往返: {word.upper().lower()!r}")
print(f"  内容已被改写: {word.upper().lower() != word}")
```

运行结果：

```text
  原串: 'straße'
  upper().lower() 往返: 'strasse'
  内容已被改写: True
```

`'straße'` 变成了 `'strasse'`——内容已经永久改变。实践里要从这条不对称里带走一条纪律：**upper / lower / casefold 都是"单向变形"**——它们服务于"变成目标形态"，不承诺"原样恢复"：

- 原串要留就自己留一份，别指望转换逆向还原；
- 需要比较时**每次都从原字符串出发重新折叠**，别把折叠结果当"可还原的中间状态"存储;
- 任何"转过去再转回来"的等值断言，都是没过 ß 这一关的假设。

## 3. 最佳实践

### 3.1 大小写不敏感比较：casefold 是标准答案

"忽略大小写判断两个字符串是否相等"是本族方法的最高频需求。官方文档给了明确答案：**先对两个串做 casefold、再比较**。这不是风格建议，是规范钦定的写法：

```python
pairs = [
    ("Python", "PYTHON"),
    ("Straße", "STRASSE"),     # 德语: 需要折叠
    ("JOSE", "José"),
]

for a, b in pairs:
    print(f"  {a!r} == {b!r} (忽略大小写): {a.casefold() == b.casefold()}")
    print(f"    折叠后: {a.casefold()!r} vs {b.casefold()!r}")
```

运行结果：

```text
  'Python' == 'PYTHON' (忽略大小写): True
    折叠后: 'python' vs 'python'
  'Straße' == 'STRASSE' (忽略大小写): True
    折叠后: 'strasse' vs 'strasse'
  'JOSE' == 'José' (忽略大小写): False
    折叠后: 'jose' vs 'josé'
```

三组样本三个层次：第一组常规通过；第二组靠 casefold 的折叠语义通过（lower 在这里会给出错误答案，见 2.3.2 的完整分析）；第三组**结果是 False——这不是 casefold 的失败**：`José` 的 `é` 与 `e` 在西班牙语里是不同的字母，**casefold 折叠大小写、不折叠音调**——音调携带真实语义，保留才是正确行为。

写法选型的对照表：

| 写法 | 评价 |
|------|------|
| `a.casefold() == b.casefold()` | 推荐：规范钦点，`ß`、sigma、连字全体归一 |
| `a.lower() == b.lower()` | 不推荐：5% 特殊字符上判等失真（116 个分歧案例） |
| `a.upper() == b.upper()` | 更不推荐：部分案例"碰巧正确"靠运气（2.3.2 的 upper 判等） |
| 手写逐字符映射 | 不推荐：重造轮子且几乎必然遗漏一对多折叠 |

选择逻辑一句话：**比较 = casefold**。它比 lower 慢不到哪去（4.3 节实测）、覆盖更全、有官方背书——找了不选它的理由才奇怪。

### 3.2 casefold 配合 startswith 与 in：查找模板

比较之外，"大小写不敏感地找"是第二高频需求。两个模板直接可用：

**模板一：大小写不敏感的前缀判断**——协议头、URL scheme 这类"大小写不定"的头部识别：

```python
url = "HTTPS://Example.COM"

print(f"  原串: {url!r}")
print(f"  直接 startswith('https://'): {url.startswith('https://')}")
print(f"  折叠后 startswith('https://'): {url.casefold().startswith('https://')}")
```

运行结果：

```text
  原串: 'HTTPS://Example.COM'
  直接 startswith('https://'): False
  折叠后 startswith('https://'): True
```

**模板二：大小写不敏感的包含查找**——日志分级、关键字扫描：

```python
log_line = "ERROR: Connection Timeout while calling db"

print(f"  'error' in log:                {'error' in log_line}")
print(f"  'error' in log.casefold():     {'error' in log_line.casefold()}")
print(f"  'timeout' in log.casefold():   {'timeout' in log_line.casefold()}")
```

运行结果：

```text
  'error' in log:                False
  'error' in log.casefold():     True
  'timeout' in log.casefold():   True
```

两个模板的核心动作一致：**把"被检串"折叠一次，再与全小写的字面量匹配**。注意方向性——`in log.casefold()` 的左边写小写字面量；两边都折叠（`needle.casefold() in log.casefold()`）更稳，特别是字面量也来自外部输入时。

### 3.3 归一化键模板：去重与计数

"同一事物的多种大小写写法折叠为同一个键"是 casefold 的应用主场。标签去重的完整模板：

```python
raw_tags = ["Python", "PYTHON", "web", "Web", "WEB", "python3", "Python3", "Django"]

counted = {}
for tag in raw_tags:
    key = tag.casefold()
    counted[key] = counted.get(key, 0) + 1

print(f"  原始标签: {raw_tags}")
print(f"  折叠键统计: {counted}")
print(f"  唯一标签数: {len(counted)} (原始 {len(raw_tags)} 个)")
```

运行结果：

```text
  原始标签: ['Python', 'PYTHON', 'web', 'Web', 'WEB', 'python3', 'Python3', 'Django']
  折叠键统计: {'python': 2, 'web': 3, 'python3': 2, 'django': 1}
  唯一标签数: 4 (原始 8 个)
```

8 个原始标签折叠成 4 个键——`Python` 与 `PYTHON` 归并、三个 `web` 变体计数 3。**字典的键承担"身份"职能，身份判定必须走归一化**——直接用原串做键，大小写变体会各占一格，统计与去重全部失真。同理适用于集合（`{t.casefold() for t in tags}`）、数据库唯一索引的预处理层。

### 3.4 展示与比较分离：两个层次两种工具

一个容易混用的分层：**展示**（给用户看的那种转换）与**比较**（给机器判等的那种转换）各用各的工具：

```python
users = ["alice chen", "Bob Li", "CAROL WU"]

# 比较层: 折叠键判断"是否同一个人"
roster = {"alice chen", "bob li"}
for u in users:
    print(f"    {u!r} 在册? {u.casefold() in roster}")

# 展示层: 输出排版用 upper
for u in users:
    print(f"    工牌: {u.upper()!r}")
```

运行结果：

```text
    'alice chen' 在册? True
    'Bob Li' 在册? True
    'CAROL WU' 在册? False
    工牌: 'ALICE CHEN'
    工牌: 'BOB LI'
    工牌: 'CAROL WU'
```

分层的纪律：**比较永远回来 casefold，展示用 upper/lower 自由发挥**——工牌要全大写、文案要小写清新，展示层随业务审美走；而判等那把尺子从头到尾只有一把。反过来的混用（拿 upper 的结果去判等）就回到 2.3.2 的"运气模式"。

### 3.5 方法选择决策速查表

| 需求 | 首选写法 |
|------|------|
| 忽略大小写判断两串相等 | `a.casefold() == b.casefold()` |
| 大小写不敏感的前缀/包含查找 | `s.casefold().startswith(...)`（被检串折叠、字面量小写） |
| 去重、计数的归一化键 | `key = s.casefold()` |
| 展示层全大写（工牌、告警、标题） | `s.upper()` |
| 展示层全小写（正文统一） | `s.lower()` |
| 判断串本身的大小写形态 | 换 `isupper` / `islower`，不是转换家族的业务 |
| 单词首字母、词首大小写 | 换 capitalize / title，它们处理"局部" |
| 判断转换是否发生过变化 | 内容比较 `s.upper() == s`，别用 `is` |

使用心法一句话：**给机器比较用 casefold，给人眼睛看用 upper/lower——受众不同，工具不同**。

## 4. 原理

### 4.1 实现：Unicode 大小写映射查表

三个方法在 CPython 里都是 C 级实现，工作模式一致：**逐字符查询 Unicode 字符数据库中预设的大小写信息，构建结果串返回**。它们的差异不在实现方式，而在**查的是哪份表**：

- `upper` / `lower` 查的是**大小写映射**（case mapping）——它的职责是"写出正确的目标形态"，所以映射忠于书写规则。两个实测证据支撑这条定位：其一，`'İ'.lower()` 产出两字符的 `'i̇'`——映射本身允许"一对多"，只为拼得正确；其二，`'ΑΣ'.lower()` 在词尾降出 final form `ς`——映射表连**上下文条款**都带，位置不同产出不同。
- `casefold` 查的是**大小写折叠**（case folding）表——它的职责不是"拼写正确"而是"归一化一致"：`ß` 摊平成 `ss`、三个 sigma 统一成 `σ`、连字还原成普通拼写——凡"同一个词的多种合法形态"，折叠表都想办法让它们落进同一个格子里。

查表成本与字符个数成正比（O(n)），逐字符一次表查询即可定夺——正因为只是查表，'İ' 分解出组合点、ß 变两个字符这类"展开"都是表里预先写好的映射目标，运行时不需要任何"计算"。

### 4.2 两份表、两种哲学

把 lower 与 casefold 的设计分歧并排成档案，"书写工具 vs 比较工具"的定位一目了然：

| 维度 | `lower`（大小写映射） | `casefold`（大小写折叠） |
|------|------|------|
| 设计目标 | 写出正确的书写小写 | 让同一词的不同写法折叠一致 |
| 位置依赖 | 有——`'ΑΣ'` 词尾降出 `ς` | 无——三种 sigma 统一 `σ` |
| 对 `ß` | 不动（它已是合法小写） | 摊平为 `ss` |
| 对连字 `ﬁ` | 保留字形（`lower('ﬁ')` = `'ﬁ'`） | 还原为 `fi` |
| 一对多展开 | 允许（`'İ'` lower 出两字符） | 允许且更激进（116 个分歧点） |
| 典型误区 | 拿来做忽略大小写比较 | 指望它做展示排版（没人这么干，但它不迁就书写规则） |

两份表没有优劣，只有分工：**书写工具让文字正确，比较工具让判等可靠**。官方文档把 casefold 明文定为"删除字符串中所有大小写区分"的操作、并把 `a.casefold() == b.casefold()` 列为忽略大小写比较的标准写法——理由全在本篇的实测里：lower 在 ß 上判等失真（2.3.2）、在 sigma 上位置敏感（2.4.2）、在连字上不还原（2.5.1）；这些场景 casefold 全部给出一致判定。

### 4.3 性能：三者同量级，选型无关性能

最后一个常见疑虑："casefold 更彻底，是不是更慢？"实测在同一串（1700 字符、含德语字符）上跑三种转换：

```python
import timeit

text = "Straße Fusion Case" * 100
n = 50000
print(f"upper:    {timeit.timeit(lambda: text.upper(), number=n):.4f}s")
print(f"lower:    {timeit.timeit(lambda: text.lower(), number=n):.4f}s")
print(f"casefold: {timeit.timeit(lambda: text.casefold(), number=n):.4f}s")
```

运行结果：

```text
upper:    0.2016s
lower:    0.1698s
casefold: 0.1979s
```

三个方法都在同一量级上小幅浮动（耗时绝对值随机器浮动，量级与相对结论稳定）——casefold 的"更彻底"没有转化成"更慢"：反正都是逐字符查表，查简单的表与查彻底的表，成本相差无几。

**选型自始至终与性能无关**：比较场景用 casefold 不需要付出性能代价，展示场景用 lower 也从来不是因为它比 casefold 快。让你的决定回退到唯一有效的判据——语义：**要比较，casefold；要展示，upper/lower**。

## 5. 总结

本文围绕 `upper`、`lower`、`casefold` 三个方法展开，主要介绍了以下内容：

- 三个方法都是整串转换：无参数（传参抛 `takes no arguments` 的 TypeError）、返回新串、原串不变；与剥壳家族不同，即使内容毫无变化也新建对象——判断"是否发生转换"用内容比较 `s.upper() == s`，别用 `is`
- 转换只作用于**存在大小写对应**的字符：汉字、数字、标点、emoji 原样通过（"中文转大写没反应"是字符体系的客观事实，不是 bug）；判定标准是字符属性而非"中文还是英文"——希腊字母照常参与（`αβγ`.upper() 得 `ΑΒΓ`）；混合文本逐字符独立裁决
- **casefold 不是"更狠的 lower"，是宗旨不同的另一件工具**：upper/lower 忠于书写规则（排版正确），casefold 面向比较归一（判等一致）——`ß` 在 lower 里保留（它已是合法小写）、在 casefold 里摊平为 `ss`
- 德语 eszett 是三方法的正面对决现场：`'ß'.lower()` 不变、`'ß'.casefold()` 得 `'ss'`、`'ß'.upper()` 得 `'SS'`——一个字符转出两个字符，**大小写转换不保证长度守恒**；`straße` vs `STRASSE` 判等实验三种方法给出"错、碰巧对、必然对"三种答案——lower 判不等，upper 靠 `ß.upper()` 恰好产出 `SS` 的运气判等，只有 casefold 是语义保证
- 希腊 sigma 三姐妹（`Σ`/`σ`/`ς`）：lower 带位置依赖——`'ΑΣ'.lower()` 词尾降出 final form `ς`，`'ΑΣΑ'` 词中还原 `σ`；casefold 把三个成员统一折叠为 `σ`，抹平形态差异——**归一化是 casefold 的本职**
- 一对多折叠清单：连字家族（`ﬁ`→`fi` 等）被 casefold 还原为普通拼写（PDF 复制文本搜索不中的根源）；`İ` 分解为 `i` + 组合点（长度 2，且与裸 `'i'` 不等——Python 不感知语言环境）；抽查统计约 5% 的字符在 lower 与 casefold 上行为不同——这 5% 正是比较场景翻车的 100% 来源
- casefold 折叠大小写、**不折叠音调**：`'JOSE'.casefold() != 'José'.casefold()`（`'jose'` vs `'josé'`）是正确行为——é 与 e 是不同字母，音调携带真实语义
- 往返不对称：`'ß'`.upper().lower() 得 `'ss'` 一去不返；`'İ'`、`'ﬁ'` 同样回不去，只有 `a`、`ä` 这类大小写对称的字符往返无恙——三个方法都是**单向变形**，需要比较时每次从原串重新折叠，别把折叠产物当可还原的中间状态
- 最佳实践核心：**忽略大小写判等的规范写法是 `a.casefold() == b.casefold()`**；查找模板把被检串折叠、字面量保持小写（`s.casefold().startswith(...)`、`'error' in log.casefold()`）；归一化键用 `key = s.casefold()`（8 个标签折叠为 4 个键）；展示与比较分离——工牌排版用 upper，判等永远回 casefold
- 原理上：三个方法都是 C 级查表实现——upper/lower 查"大小写映射"表（忠于书写、带位置条款、允许一对多），casefold 查"大小写折叠"表（面向归一、无位置依赖）；性能实测三者同量级，"更彻底"不等于"更慢"——**选型的唯一判据是语义：给机器比较用 casefold，给人眼睛看用 upper/lower**
