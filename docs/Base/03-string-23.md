---
group:
  title: 【03】字符串介绍
  order: 3
order: 23
title: removeprefix 与 removesuffix 方法
nav:
  title: Python基础
  order: 1
---

# removeprefix 与 removesuffix 方法

## 1. 介绍

### 1.1 知识点定义

`str.removeprefix()` 与 `str.removesuffix()` 是 Python 3.9 新增的**字面前后缀剥离方法**：给定一段字符串参数，如果它恰好出现在字符串的开头（`removeprefix`）或结尾（`removesuffix`），就把这段剥掉并返回剩余部分；**如果不匹配，原样返回，不报错、不截断、不做任何猜测**。"恰好是这段、恰好剥一次、不匹配就不动"——三句话概完两个方法的全部性格。

| 维度 | `removeprefix()` | `removesuffix()` |
|------|------|------|
| 所属 | `str` 的内置实例方法 | `str` 的内置实例方法 |
| 语法 | `s.removeprefix(prefix)` | `s.removesuffix(suffix)` |
| 参数 | 一个字符串（字面前缀，大小写敏感） | 一个字符串（字面后缀，大小写敏感） |
| 方向 | 只检查开头 | 只检查结尾 |
| 匹配规则 | 整段字面匹配，命中才动手 | 同左 |
| 剥离次数 | **恰好一次**，绝不重复 | 同左 |
| 不匹配时 | **原样返回**（无异常、无哨兵值） | 同左 |
| 引入版本 | Python 3.9（PEP 616） | 同左 |

这两个方法要解决的核心问题只有一个：**"把字符串开头/结尾的那段已知装饰字面去掉，且只去掉它"**。文件名去掉扩展名、URL 去掉协议头、版本号去掉 `-beta` 标记、备份文件去掉 `.bak`——需求都是"剥掉那段已知字面"，而不是"剥掉某类字符"。在这两个方法出现之前（Python 3.8 及以前），这个看似简单的需求只有两类写法可选：`strip(chars)` 的**字符集合**语义会误伤正文，而 `startswith` 检查加切片的手工写法又长出了一个流传多年的经典空串陷阱（2.5 节重演全程）。Python 3.9 用两个语义自明的方法把这件事画上句号——**方法的名字就是它的全部语义，恰好做一件事**。

### 1.2 最简示例

五行代码看全两个方法的基本性格：

```python
s = "https://example.com/"

print(f"原串:      {s!r}")
print(f"去协议头:  {s.removeprefix('https://')!r}")
print(f"去尾斜杠:  {s.removesuffix('/')!r}")
print(f"双端联手:  {s.removeprefix('https://').removesuffix('/')!r}")
print(f"不命中:    {'ftp://example.com'.removeprefix('https://')!r}")
```

运行结果：

```text
原串:      'https://example.com/'
去协议头:  'example.com/'
去尾斜杠:  'https://example.com'
双端联手:  'example.com'
不命中:    'ftp://example.com'
```

前四行是命中的走向：开头恰好是 `https://` 就剥掉、结尾恰好是 `/` 就剥掉、两个方法链起来双端干净。最后一行是不命中的走向：开头是 `ftp://`，参数对不上，**原样返回**——没有异常、没有 -1、没有报错，拿回来的还是原来的串。这个"不命中即原样"的性格是两个方法最实用的设计，批量处理时不需要任何前置判断。

### 1.3 字符串裁剪工具体系中的定位

字符串"去掉一些内容"的方法分几路，两个新方法占据"按字面剥前后缀"的生态位：

```text
字符串"去掉一些内容"的几种方式
│
├── 按集合剥两端 —— strip / lstrip / rstrip
│     └── 剥什么由"字符集合"决定: 端点是集合成员就剥, 遇非成员即停
│
├── 按字面剥前后缀 —— removeprefix / removesuffix (本篇, Python 3.9+)
│     └── 剥什么由"一段字面字符串"决定: 端点整段对上才剥, 剥恰好一次
│
├── 全局替换 —— replace
│     └── 不分位置, 中间的也照换, 而且默认全部换
│
└── 切割 —— split / partition
      └── 不是"去掉", 是"切开成几段"
```

最容易混淆的依旧是与 strip 家族的边界：同样处理"去掉扩展名"这个需求，`s.strip('.txt')` 的语义是"把两端凡是 `.`、`t`、`x` 的字符统统剥掉"——正文里以这些字符开头或结尾的部分会被误伤；`s.removesuffix('.txt')` 的语义才是"结尾恰好是 `.txt` 这一段才剥"。两类语义的分岔在 2.4 节正面展开，判断口诀先行奉上：**要剥的是"一类字符"找 strip，要剥的是"一段字面"找 removeprefix/removesuffix**。

## 2. 核心内容

### 2.1 语义总纲：命中剥一次，不命中原样返回

#### 2.1.1 命中与不命中：两条基本走向

两个方法的世界只有两条走向。开头（或结尾）恰好是参数这一段——命中，剥掉返回剩余；否则——不命中，原样返回：

```python
prefix_cases = [
    ("prefix_data", "prefix_"),   # 命中: 开头恰好是 prefix_
    ("interesting", "prefix_"),   # 不命中: 开头不是
    ("v2_data", "V2_"),           # 大小写不同 -> 不匹配 -> 不命中
]

for s, p in prefix_cases:
    print(f"{s!r}.removeprefix({p!r}) -> {s.removeprefix(p)!r}")

suffix_cases = [
    ("report.txt.bak", ".bak"),   # 命中: 结尾恰好是 .bak
    ("report", ".bak"),           # 不命中: 结尾不是
]

for s, q in suffix_cases:
    print(f"{s!r}.removesuffix({q!r}) -> {s.removesuffix(q)!r}")
```

运行结果：

```text
'prefix_data'.removeprefix('prefix_') -> 'data'
'interesting'.removeprefix('prefix_') -> 'interesting'
'v2_data'.removeprefix('V2_') -> 'v2_data'
'report.txt.bak'.removesuffix('.bak') -> 'report.txt'
'report'.removesuffix('.bak') -> 'report'
```

五条结果里藏着三条判读：

- 命中后返回的是**剩余部分**——`'data'`，不带任何标记说明"剥掉过东西"；
- 不命中返回的是**与原串内容一致的串**——肉眼分不出"命中剥过"还是"本来就这样"，这既是这两个方法最被称道的安全性（批量处理无需预判），也意味着**剥离操作天然幂等**（3.3 节展开）；
- 匹配**大小写敏感**——`'V2_'` 对不上 `'v2_'`，一个字母的大小写差异就是不命中。

#### 2.1.2 方向各管一端：联手使用

两个方法方向分工严明：`removeprefix` 只看开头，`removesuffix` 只看结尾。联手使用是常规姿势——以 URL 清理为例：

```python
urls = [
    "https://example.com/",
    "example.com",
]

for url in urls:
    host = url.removeprefix("https://").removesuffix("/")
    print(f"{url!r} -> {host!r}")
```

运行结果：

```text
'https://example.com/' -> 'example.com'
'example.com' -> 'example.com'
```

第二个 URL 本来就没有协议头也没有尾斜杠，两个方法接力依次"不命中"两回，原样穿过——管线代码对两种输入完全一致，**不需要给"已清理过的数据"开小灶**。

#### 2.1.3 整段匹配才算命中：中间出现不算

参数必须**整段出现在端点**才算命中——出现在中间、出现在另一端，都不算：

```python
cases = [
    ("a.b.c", ".b", "结尾是 .c, .b 在中间 -> 不剥"),
    ("data.tar.gz", "data", "data 在开头, 但 removesuffix 只看结尾 -> 不剥"),
    ("data.tar.gz", ".tar.gz", "结尾恰好是 .tar.gz -> 剥"),
]

for s, q, verdict in cases:
    print(f"{s!r}.removesuffix({q!r}) -> {s.removesuffix(q)!r}   ({verdict})")
```

运行结果：

```text
'a.b.c'.removesuffix('.b') -> 'a.b.c'   (结尾是 .c, .b 在中间 -> 不剥)
'data.tar.gz'.removesuffix('data') -> 'data.tar.gz'   (data 在开头, 但 removesuffix 只看结尾 -> 不剥)
'data.tar.gz'.removesuffix('.tar.gz') -> 'data'   (结尾恰好是 .tar.gz -> 剥)
```

第一行与第二行共同说明：**"包含这段字面"不等于"命中"**——`'a.b.c'` 里确实有 `.b`，但不在结尾；`'data'` 确实在 `data.tar.gz` 里，但 `removesuffix` 不看开头。第三行命中：结尾的 `.tar.gz` 整段被剥掉，剩下 `'data'`。**判断单位是"一段"**——要么整段在端点上（整段全剥），要么整段不在（整段全不动），不存在"剥一半"的中间状态。

### 2.2 单次剥离：命中也只剥一次

#### 2.2.1 一种需求，三种工具

"把 `'aaa'` 剥掉**开头的那个** `a`"——这个精确的需求把三种工具的性格差一口气照全：

```python
s = "aaa"

print(f"removeprefix 思路: {s.removeprefix('a')!r}   <- 恰好一次")
print(f"lstrip 思路:       {s.lstrip('a')!r}        <- 连续成员全剥光")
print(f"replace 思路:      {s.replace('a', '', 1)!r} <- 手工限定换一次才能对")
```

运行结果：

```text
removeprefix 思路: 'aa'   <- 恰好一次
lstrip 思路:       ''        <- 连续成员全剥光
replace 思路:      'aa' <- 手工限定换一次才能对
```

三种结果两种答案：`removeprefix` 与"手动限额"的 `replace` 拿到 `'aa'`，`lstrip('a')` 因为 `a` 是集合成员而一路剥到空。**"恰好一次"是 removeprefix/removesuffix 与 strip 家族最本质的行为分水岭**——strip 的扫描是"遇非成员即停"，连续成员就连续剥；而这两个方法满足于一次命中，命中即收工，剩下的交给调用方。

#### 2.2.2 重复模式与链式重复剥离

连续重复的模式最能暴露"单次"定位——`'ababab'` 只剥掉开头的一次：

```python
s = "ababab"
print(f"{s!r}.removeprefix('ab') -> {s.removeprefix('ab')!r}")
```

运行结果：

```text
'ababab'.removeprefix('ab') -> 'abab'
```

剩下的 `'abab'` 原样保留。**想剥几次就调用几次**——"要几层、写几行"的直白逻辑：

```python
print(f"剥一次: {'prepre_fixed'.removeprefix('pre')!r}")
print(f"剥两次: {'prepre_fixed'.removeprefix('pre').removeprefix('pre')!r}")
print(f"双剥后缀: {'data.log.log'.removesuffix('.log').removesuffix('.log')!r}")
```

运行结果：

```text
剥一次: 'pre_fixed'
剥两次: '_fixed'
双剥后缀: 'data'
```

链式调用每一环剥一层：剥一次 `'pre'` 得 `'pre_fixed'`，再剥一次得 `'_fixed'`；`'data.log.log'` 两刀下去只剩 `'data'`。相比"自动剥光"的 strip，这里的**剥几层完全由代码结构决定**——读者数一遍调用次数，就知道剥掉了几层。

#### 2.2.3 端点保护：中间与另一端分毫不动

单次剥离的精确性还体现在"边界感"上——方法只对命中端点的那一段动手，**中间出现的相同内容与另一端受绝对保护**：

```python
cases = [
    ("a.txta", "a"),            # 结尾的 a 被剥, 开头的 a 分毫不动
    ("env.config.env", ".env"),  # 结尾的 .env 被剥, 开头的 env 分毫不动
]

for s, q in cases:
    print(f"{s!r}.removesuffix({q!r}) -> {s.removesuffix(q)!r}")
```

运行结果：

```text
'a.txta'.removesuffix('a') -> 'a.txt'
'env.config.env'.removesuffix('.env') -> 'env.config'
```

`removesuffix` 只看右端：`'a.txta'` 剥掉**结尾的** `a`，开头的 `a` 虽是同一个字面却毫发无损；`'env.config.env'` 剥掉结尾的 `.env`，开头的 `env`（连点号都不带）安然无恙。**方向就是边界**——不存在"顺手把另一端也处理了"的黑箱行为，行为可以完全从方法名推导出来。

### 2.3 边界行为四件套

#### 2.3.1 空串参数：剥掉"零个字符"

空串参数被定义为"永远命中、剥掉零个字符"——效果上等于什么都没发生：

```python
s = "hello"

r1 = s.removeprefix("")
r2 = s.removesuffix("")

print(f"{s!r}.removeprefix('') -> {r1!r}, is 同一对象: {r1 is s}")
print(f"{s!r}.removesuffix('') -> {r2!r}, is 同一对象: {r2 is s}")
```

运行结果：

```text
'hello'.removeprefix('') -> 'hello', is 同一对象: True
'hello'.removesuffix('') -> 'hello', is 同一对象: True
```

两个值得留意的细节：其一，`removeprefix("")` 语义上"命中"（开头"确实"是空串）但剥掉零个字符——**参数来自变量且恰为空串时无需特判**；其二，`is` 的 `True` 说明 CPython 在这种情况下直接返回原串对象、不做拷贝——这只是实现优化，语义上把它理解为"得到一个相等的串"就足够，**别在代码里依赖原对象身份**。

#### 2.3.2 不命中返回：最平和的失败形式

"不命中"是这两个方法唯一的"失败"，而它的表达方式是**原样返回**——同样是 CPython 直接返回原对象引用：

```python
s = "hello"
r = s.removeprefix("xyz")

print(f"{s!r}.removeprefix('xyz') -> {r!r}, is 同一对象: {r is s}")
```

运行结果：

```text
'hello'.removeprefix('xyz') -> 'hello', is 同一对象: True
```

把字符串方法家族的失败表达方式排成光谱，`removeprefix`/`removesuffix` 的选择位于最温和的一端：

| 方法族 | 目标不成立时的表达 | 面向场景 |
|------|------|------|
| `index` / `rindex` | 抛 `ValueError` | 分隔符缺失即数据错误，要求当场暴露 |
| `find` / `rfind` | 返回 `-1` | 缺失是正常状态，调用方自判 |
| `removeprefix` / `removesuffix` | **原样返回** | 没有可剥的就等于"已经干净"，结果即答案 |

`-1` 还需要调用方处理一个特殊返回值；抛异常需要一个 `try` 接住；而**"原样返回"让失败路径与成功路径无缝合流**——处理一批文件名，有的带 `.tmp` 有的不带，一行 `removesuffix('.tmp')` 对两类输入都直接给出正确结果，无需任何分支预判。

#### 2.3.3 空串自身

空串没有端点，任何非空参数都匹配不上，剥完还是空串：

```python
print(f"''.removeprefix('abc')  -> {''.removeprefix('abc')!r}")
print(f"''.removesuffix('.txt') -> {''.removesuffix('.txt')!r}")
```

运行结果：

```text
''.removeprefix('abc')  -> ''
''.removesuffix('.txt') -> ''
```

"没有端点"与"端点不匹配"殊途同归——都走原样返回。空串在这个方法的语义里没有任何特殊情况，不需要单独记忆。

#### 2.3.4 参数个数纪律

两个方法都要求**恰好一个**参数——不给或多给都直接 `TypeError`：

```python
try:
    "a".removeprefix()
except TypeError as e:
    print(f"无参数: TypeError: {e}")

try:
    "a".removesuffix(".txt", ".json")
except TypeError as e:
    print(f"多参数: TypeError: {e}")
```

运行结果：

```text
无参数: TypeError: str.removeprefix() takes exactly one argument (0 given)
多参数: TypeError: str.removesuffix() takes exactly one argument (2 given)
```

没有默认值、没有变长参数——**要剥的东西必须由调用方亲手给出**，方法自己不做任何默认假设。这条纪律与 strip 家族的"可选 chars"参数形成对照：strip 允许省略参数（默认剥空白），而字面剥离没有"默认要剥的字面"可言——语法形状本身就体现了两个家族的语义差异。

### 2.4 与 strip 家族的正面对照

#### 2.4.1 字面语义 vs 集合语义：三组对照

同样一段参数，两个家族读出两种完全不同的语义。三组典型输入把分岔从"有差异"到"灾难"的完整光谱展示出来：

```python
matchups = [
    ("xxyyxx", "xx"),            # 重复模式: strip 从右端继续剥 yy
    ("www.example.com", "www."),  # 碰巧一致: 机制完全不同
    ("data_v2.txt", "data_"),      # 惨案: strip 误伤正文尾部
]

for s, arg in matchups:
    print(f"输入: {s!r}, 参数: {arg!r}")
    print(f"  removeprefix -> {s.removeprefix(arg)!r}")
    print(f"  strip        -> {s.strip(arg)!r}")
    print()
```

运行结果：

```text
输入: 'xxyyxx', 参数: 'xx'
  removeprefix -> 'yyxx'
  strip        -> 'yy'

输入: 'www.example.com', 参数: 'www.'
  removeprefix -> 'example.com'
  strip        -> 'example.com'

输入: 'data_v2.txt', 参数: 'data_'
  removeprefix -> 'v2.txt'
  strip        -> 'v2.tx'
```

三组判读：

- **第一组（行为分岔）**：`removeprefix('xx')` 剥恰好一次得 `'yyxx'`；`strip('xx')` 的集合是 `{x}`，从左剥两刀后**又从右端把右边的 `xx` 也剥了**，得 `'yy'`。需求若是"只去开头一段"，strip 直接越界。
- **第二组（碰巧一致）**：`'www.example.com'` 两个结果看似相同，机制却是两回事——`removeprefix` 整段剥掉 `www.`；strip 从左剥 `wwww.` 中在集合的字符、又从右剥掉 `com` 的 `c`、`o`、`m`（全在集合 `{w, ., c, o, m, z}`……本例传的是 `'www.'`，集合只有 `{w, .}`，右端的 `m` 不在集合所以停）。**碰巧一致的结果是最危险的榜样**——换个数据、结局立刻改写。
- **第三组（惨案）**：`'data_v2.txt'` 的正确答案是 `'v2.txt'`，strip 却给出 `'v2.tx'`——**正文尾部的 `t` 被削走了**，文件名损坏。下一小节拆解。

#### 2.4.2 惨案拆解：data_v2.txt

```python
s = "data_v2.txt"
arg = "data_"

print(f"strip('data_') 的集合成员: {sorted(set(arg))}")
print(f"removeprefix 的正确结果: {s.removeprefix(arg)!r}")
print(f"strip 的实际结果:        {s.strip(arg)!r}")
```

运行结果：

```text
strip('data_') 的集合成员: ['_', 'a', 'd', 't']
removeprefix 的正确结果: 'v2.txt'
strip 的实际结果:        'v2.tx'
```

两条扫描线的轨迹还原：

```text
s = 'data_v2.txt',   strip('data_') 的集合 = {d, a, t, _}

左端: d(在) a(在) t(在) a(在) _(在) -> v 不在集合, 停   <- 前缀部分碰巧剥对了
右端: t(在!) -> 剥掉, x 不在集合, 停                  <- '.txt' 被削成 '.tx'

removeprefix('data_'): 只看开头, 整段 'data_' 命中 -> 'v2.txt'
                       尾部? 它连看都不看
```

惨案的根源在于**参数字符与正文端点的重叠**：`'data_'` 里的 `t` 恰好也是 `'.txt'` 的成员，strip 的右扫描线一视同仁地把正文尾部的 `t` 剥掉。而 `removeprefix` 的判定单位是"整段"——参数这段字面在开头对不上就完事，**连右端看都不看**。一字之差，安全与危险就此分野：

| 维度 | `removeprefix('data_')` | `strip('data_')` |
|------|------|------|
| 判定单位 | 整段字面 | 单个字符 |
| 扫描范围 | 只看开头一端 | 两端各一条扫描线 |
| 误伤可能 | 无——正文受绝对保护 | 参数字符入正文端点即误伤 |
| 结果正确性 | 由语义保证 | 由数据运气决定 |

#### 2.4.3 需求分岔判定

选型问题最终归结为一个判定："要剥的东西，在语义上是**一段特定的字面**，还是**一类没有确定排列的字符**？"

| 需求语义 | 前缀/后缀是什么 | 正确工具 |
|------|------|------|
| 去扩展名 `.txt`、去协议头 `https://`、去标记 `-beta` | 一段确定的字面 | `removesuffix` / `removeprefix` |
| 去两端空白、去零填充、剥装饰字符集合 | 一类字符 | `strip` 家族 |
| 去中间或全局的某段 | 无位置约束 | `replace` |

**先回答"一段还是一类"，工具名自动浮现**——这也是这两个方法加入标准库的意义：让"一段"这个此前没有专用工具的需求，从此拥有不会答错的方法名。

### 2.5 历史填坑：3.9 之前的写法与空串陷阱

#### 2.5.1 旧写法：检查 + 切片

在 3.9 之前，字面前后缀剥离只能"检查 + 切片"手工拼装：

```python
s = "prefix_data"
t = "report.txt"

old_prefix = s[len("prefix_"):] if s.startswith("prefix_") else s
old_suffix = t[: -len(".txt")] if t.endswith(".txt") else t

print(f"前缀写法: {old_prefix!r}")
print(f"后缀写法: {old_suffix!r}")
```

运行结果：

```text
前缀写法: 'data'
后缀写法: 'report'
```

两个样例都得到了正确结果，但这段代码的问题藏在**每一次调用里**：条件表达式要写对（`startswith` 还是 `in`）、切片方向要写对（`s[len(p):]` 还是 `s[: len(p)]`）、空参量情况要想到——三个细节每一个都出过真实事故。更糟的是这种写法**没有方法名**——code review 时，`s[len(x):] if s.startswith(x) else s` 需要读者逐字解析才能确认意图。

#### 2.5.2 空串后缀陷阱重演

旧后缀写法 `s[:-len(suffix)]` 埋着一颗著名的雷——**suffix 恰好是空串**时，`len('')` 是 `0`，`-0` 是 `0`，切片 `s[:0]` 截取的是"开头空段"而不是"去掉结尾"：

```python
s = "data.txt"
suffix = ""       # 假设后缀来自外部变量, 恰好为空串

if s.endswith(suffix):              # endswith('') 恒为 True, 条件被"骗过"
    old_way = s[: -len(suffix)]      # s[:-0] == s[:0]
    print(f"旧写法: {old_way!r}")

print(f"新方法: {s.removesuffix(suffix)!r}")
```

运行结果：

```text
旧写法: ''
新方法: 'data.txt'
```

两行输出一个天上一个地下：旧写法**整串被切没**（返回空串）——`endswith('')` 恒为 `True`，条件防线形同虚设；切片又因为 `-0 == 0` 静默失败——两层防线同时塌方；新方法 `removesuffix('')` 按"剥掉零个字符"的语义原样返回，什么都没发生。**参数是变量的真实代码里，这颗雷的引信无限长**——平时都好，某天后缀变量恰好为空串，数据无声损坏。

#### 2.5.3 陷阱根源：-0 == 0

把雷拆开看，根源在于**"从右往左数"的负数索引体系里，没有 `0` 的位置**：

```python
s = "abc"

print(f"len('')      -> {len('')}")
print(f" -len('')    -> {-len('')}")
print(f" s[:-len('')] -> {s[:-len('')]!r}   <- == s[:0], 开头空段")
print(f" s[:-1]       -> {s[:-1]!r}    <- 正常的从右数一位")
```

运行结果：

```text
len('')      -> 0
 -len('')    -> 0
 s[:-len('')] -> ''   <- == s[:0], 开头空段
 s[:-1]       -> 'ab'    <- 正常的从右数一位
```

`-1`、`-2` 这些负数索引在切片里表达"从右数"，但 `0` **不是负数**——`-0` 在整数运算里就是 `0`，`s[:-0]` 于是变成 `s[:0]`，语义从"从右端剥零个字符"意外变成"取开头零个字符"。**手工切片表达"去后缀"在数学上就有这个结构性缺陷**，这不是粗心能防住的——只有换掉表达方式才除根。

#### 2.5.4 兼容 fallback：把陷阱一起修掉的版本

3.9 之前的运行环境需要保留旧写法时，用这份"陷阱修复版"fallback：

```python
def removeprefix_compat(s, prefix):
    return s[len(prefix):] if s.startswith(prefix) else s

def removesuffix_compat(s, suffix):
    # 关键: suffix 为空串时直接原样返回, 绕开 s[: -0] 切片陷阱
    return s[: len(s) - len(suffix)] if suffix and s.endswith(suffix) else s

cases = [
    ("prefix_data", "prefix_", ".bak"),
    ("data.txt", "", ".txt"),
    ("x", "prefix_", ""),
]

for s, p, q in cases:
    print(f"({s!r}: 前缀={p!r} -> {removeprefix_compat(s, p)!r}, "
          f"后缀={q!r} -> {removesuffix_compat(s, q)!r})")
```

运行结果：

```text
('prefix_data': 前缀='prefix_' -> 'data', 后缀='.bak' -> 'prefix_data')
('data.txt': 前缀='' -> 'data.txt', 后缀='.txt' -> 'data')
('x': 前缀='prefix_' -> 'x', 后缀='' -> 'x')
```

两个修复点值得记住：其一，后缀写法改为 `s[: len(s) - len(suffix)]`——**用正数从左算**，从根上避开负数索引；其二，`suffix and s.endswith(suffix)` 里让空串短路走原样返回，双保险。三组样例包含空串参数、空串后缀两组地雷位，fallback 全部给出与新方法一致的结果。**能升级就升级，必须兼容时用这份修复版**——千万别把 `s[:-len(suffix)]` 的原样写法复制进新代码。

## 3. 最佳实践

### 3.1 字面前后缀的默认选择：不是 strip

需求沉底成一句话："把开头/结尾的**那段已知字面**去掉"。写法选型的对照直接落到代码上：

```python
filename = "data_v2.txt"

# 不推荐: strip('data_') —— 参数被拆成字符集合 {d, a, t, _}
#          尾部的 't' 恰在集合中, 结果 'v2.tx', 文件名损坏
mangled = filename.strip("data_")

# 推荐: removeprefix('data_') —— 整段字面命中才剥, 尾部连看都不看
correct = filename.removeprefix("data_")

print(f"strip:        {mangled!r}")
print(f"removeprefix: {correct!r}")
```

运行结果：

```text
strip:        'v2.tx'
removeprefix: 'v2.txt'
```

两条写法的差距在 2.4.2 节已完整拆解。这里把推荐规则压缩成选型口诀：**参数在语义上是"一段"，用 removeprefix/removesuffix；是"一类"，用 strip**。`strip('www.')` 偶尔给出正确答案（正文恰好不与集合重叠时），但那靠的是数据运气——运气不属于工程保证。

### 3.2 批量处理模板：候选表逐个尝试

真实数据的"装饰"往往不止一种：前缀可能来自多个编号方案，后缀可能是 `.tmp` 也可能是 `.draft`。**候选表 + 逐个尝试**是标准管线结构：

```python
CANDIDATE_PREFIXES = ("01_", "02_", "99_")
CANDIDATE_SUFFIXES = (".tmp", ".draft")


def normalize_name(name, prefixes=CANDIDATE_PREFIXES, suffixes=CANDIDATE_SUFFIXES):
    """按候选表逐个剥离; 不命中的候选自动跳过。"""
    for prefix in prefixes:
        name = name.removeprefix(prefix)
    for suffix in suffixes:
        name = name.removesuffix(suffix)
    return name


raw_names = [
    "01_intro.tmp",
    "02_chapter_one",
    "99_appendix.draft",
    "user_notes",       # 没有候选命中的文件
]

for name in raw_names:
    print(f"{name!r} -> {normalize_name(name)!r}")
```

运行结果：

```text
'01_intro.tmp' -> 'intro'
'02_chapter_one' -> 'chapter_one'
'99_appendix.draft' -> 'appendix'
'user_notes' -> 'user_notes'
```

模板的力量在于**"不命中自动跳过"让循环无需任何 if**：`'01_intro.tmp'` 在 `'01_'` 这一轮命中、其余轮次原样穿过；`'user_notes'` 全程没有任何命中，照样原样走到终点。六条线并行处理四种格式，管线代码完全平直。追踪单个文件在候选表里走一遭（`'99_appendix.draft'`）更直观：

```text
尝试 removeprefix('01_') (跳过): '99_appendix.draft'
尝试 removeprefix('02_') (跳过): '99_appendix.draft'
尝试 removeprefix('99_') (命中): 'appendix.draft'
尝试 removesuffix('.tmp')  (跳过): 'appendix.draft'
尝试 removesuffix('.draft')  (命中): 'appendix'
终态: 'appendix'
```

每一步要么命中剥一段、要么原样跳过去——**步骤结果永远是合法文件名**，中途观察（日志、断点）都安全。

### 3.3 幂等安全：重复处理不再变化

"不命中即原样"的另一个直接馈赠：**管线天然幂等**。把 3.2 的候选表逻辑收进一个单轮函数，对同一份数据跑两遍：

```python
def one_pass(name):
    """单轮规范化: 逐个尝试候选序号前缀与临时后缀。"""
    for prefix in ("01_", "02_", "99_"):
        name = name.removeprefix(prefix)
    for suffix in (".tmp", ".draft"):
        name = name.removesuffix(suffix)
    return name


for name in ["01_intro.tmp", "99_appendix.draft", "user_notes"]:
    once = one_pass(name)
    twice = one_pass(once)
    verdict = "不变" if once == twice else "变了!"
    print(f"{name!r}: 一轮 -> {once!r}, 二轮 -> {twice!r} ({verdict})")
```

运行结果：

```text
'01_intro.tmp': 一轮 -> 'intro', 二轮 -> 'intro' (不变)
'99_appendix.draft': 一轮 -> 'appendix', 二轮 -> 'appendix' (不变)
'user_notes': 一轮 -> 'user_notes', 二轮 -> 'user_notes' (不变)
```

第一轮把该剥的剥干净，第二轮面对的已经是"没有可剥装饰"的干净输入——全部不命中、全部原样、结果纹丝不动。**调用方无须关心这份数据被处理过没有**：重复执行同一管线永不产生额外损耗。数据流水线里最常见的"重复消费、二次清洗"事故（同一份数据被两个入口各处理一遍导致内容被切两次），在这两个方法的语义下先天免疫。

### 3.4 大小写不敏感剥离的正确姿势

两个方法**大小写敏感**——`'HTTPS://example.com'` 配 `'https://'` 不命中。要处理"协议头大小写不定"的外部输入，推荐姿势是 **casefold 预检 + 按原长度切片**：

```python
def removeprefix_casefold(s, prefix):
    """大小写不敏感地去前缀, 保留正文原始大小写。"""
    if s.casefold().startswith(prefix.casefold()):
        return s[len(prefix):]
    return s


for url, prefix in [
    ("HTTPS://Example.com", "https://"),   # 全大写协议头, 正文也带大写
    ("Https://example.com", "https://"),   # 混合大小写
    ("ftp://example.com", "https://"),      # 协议真不同
]:
    print(f"{url!r}:")
    print(f"  普通 removeprefix    -> {url.removeprefix(prefix)!r}")
    print(f"  大小写不敏感辅助函数 -> {removeprefix_casefold(url, prefix)!r}")
```

运行结果：

```text
'HTTPS://Example.com':
  普通 removeprefix    -> 'HTTPS://Example.com'
  大小写不敏感辅助函数 -> 'Example.com'
'Https://example.com':
  普通 removeprefix    -> 'Https://example.com'
  大小写不敏感辅助函数 -> 'example.com'
'ftp://example.com':
  普通 removeprefix    -> 'ftp://example.com'
  大小写不敏感辅助函数 -> 'ftp://example.com'
```

三个设计细节支撑这份写法：

- **用 `casefold` 判命中**（而不是 `lower`）——它对德语 `ß` 等特殊大小写对的处理更完整；
- **切片长度用 `len(prefix)`**——命中标准与剥掉长度同源，参数怎么写结果就对；
- **保留正文原样大小写**——`HTTPS://` 剥掉后正文 `'Example.com'` 原封不动，开头的 `E` 大写原样保留。反面教材是"先 `s.lower()` 再 removeprefix"：正文大小写被整串殃及，`'Example.com'` 变 `'example.com'`，剥离之外引入了新损伤。

### 3.5 版本兼容策略

`removeprefix`/`removesuffix` 是 **Python 3.9+** 的方法。兼容决策三步走：

| 环境情况 | 建议 |
|------|------|
| 全部环境 ≥ 3.9 | 直接用方法本体，无所顾虑 |
| 需要支持 3.8 及以下 | 引入带陷阱修复的 fallback 函数（2.5.4 节版本） |
| fallback 只能抄一句话 | 抄 `s[len(prefix):] if s.startswith(prefix) else s`；后缀版**必须**带空串短路，禁止 `s[:-len(suffix)]` 裸写 |

多数 3.8 环境如今已退役；fallback 这段代码的现实意义更多是**读旧代码**——在遗留仓库里看到 `if s.endswith(x): s = s[:-len(x)]` 的模式时，你能立刻认出它的意图（等价于 removesuffix）并警觉它的空串陷阱。

### 3.6 方法选择决策速查表

| 需求 | 首选写法 |
|------|------|
| 去掉开头的固定字面（协议头、编号前缀、货币符号） | `s.removeprefix('...')` |
| 去掉结尾的固定字面（扩展名、`.bak`、行尾斜杠） | `s.removesuffix('...')` |
| 剥掉恰好一层（一层缩进、一个换行） | 这两个方法；"剥光同类"才是 strip 的业务 |
| 多种候选装饰逐一尝试 | 候选表 + 循环调用（3.2 模板） |
| 剥空白或某类字符 | `strip` / `lstrip` / `rstrip` |
| 内容在中间或全局出现 | 换 `replace`，这两个方法只认端点 |
| 大小写不敏感地剥前缀 | casefold 辅助函数（3.4 模板） |
| 3.9 以下环境 | 2.5.4 的修复版 fallback |

使用心法一句话：**端点、一段、一次——三个关键词同时对上号，才是这两个方法的用武之地；差一个，就该换工具了**。

## 4. 原理

### 4.1 实现机制：一次比较 + 一刀切片

两个方法在 CPython 中是 C 级实现，工作流程极简——**一次定位，一刀切片**：

```text
s.removeprefix(p) 的两步:

第一步: 端点整段比较(一条 memcmp)
        先比长度, 再逐字符核对开头(结尾)是否恰好等于参数
        'https://example.com' + 'https://'  -> 相等, 命中

第二步: 命中 -> s[len(p):] 一次切片返回剩余部分
        不命中 -> 直接返回原串(连切片都不做, 引用原对象)

对照 strip: 两端各一条扫描线逐字符向内推进, 遇非成员停——两条线的推进次数取决于端点有多少"可剥"字符
对照 removeprefix: 单端一次定位——比较要么整段相等, 要么不等, 没有"推进"过程
```

机制差异带来实测差距——内建方法与"等价"的手工函数在百万次调用下对照：

```python
import timeit

s = "https://example.com/data/report.txt"
prefix = "https://"
n = 1000000

t_builtin = timeit.timeit(lambda: s.removeprefix(prefix), number=n)

def manual(s, p):
    return s[len(p):] if s.startswith(p) else s

t_manual = timeit.timeit(lambda: manual(s, prefix), number=n)

print(f"removeprefix          跑 {n} 次: {t_builtin:.4f}s")
print(f"手工 startswith+切片  跑 {n} 次: {t_manual:.4f}s")
```

运行结果：

```text
removeprefix          跑 1000000 次: 0.0331s
手工 startswith+切片  跑 1000000 次: 0.0952s
```

同一逻辑，内建约快 3 倍（耗时绝对值随机器浮动，倍数与量级稳定）——差距全部来自语言层：手工版每次都要执行一次 Python 函数调用、一次 `startswith` 方法分派、一次条件表达式、一次切片构造；内建版一步到位。更微妙的是命中与不命中的耗时分岔（实测约 0.033s 对 0.020s）：**不命中反而更快**——它的第二步是"直接返回原对象引用"，连切片都省了。这也解释了 2.3 节所有 `is 同一对象: True` 的实测现象。

### 4.2 PEP 616：这两个方法为什么会诞生

`removeprefix` 与 `removesuffix` 由 PEP 616 提案、Python 3.9 正式落地。它的动机在本篇前面各章已经"反着"展示过——三个长期的痛点：

| 痛点 | 之前的状况 | 本篇的证据 |
|------|------|------|
| strip 长期被误用为"去前后缀" | 字符集合语义刺伤正文，事故的量级大到进 PEP 的讨论 | 2.4.2 的 `data_v2.txt` 惨案 |
| 手工写法难写难读 | `s[len(p):] if s.startswith(p) else s` 不构成方法名，语义要靠自己解析 | 2.5.1 的旧写法 |
| 手工写法暗藏空串陷阱 | `s[:-len(suffix)]` 的 `-0 == 0` 缺陷屡屡引发静默损坏 | 2.5.2 的陷阱重演 |

PEP 616 的立场用一句话概括：**一个高频、明确、出错代价高的操作，理应拥有一个自带正确实现的专用方法名**。评估阶段反对者最大的顾虑之一是"两个方法做的事，用现有工具的组合也能做到"——但"能拼出来"与"拼不错"是两种境界，`removesuffix('.bak')` 与 `s[:-len('.bak')] if s.endswith('.bak') else s` 的差距，恰恰是标准库存在的意义：**把最容易出错的细节固化进方法里，让调用方只表达意图**。

### 4.3 失败语义的设计：不命中为什么不抛异常

"不命中"是完全可能的输入状态，这两个方法没选抛异常、也没选哨兵值，而是**原样返回**——这是深思熟虑的失败语义设计。三种失败表达方式的光谱在 2.3.2 节已列出，这里从设计视角再看一层：

| 设计选项 | 后果 | 判定 |
|------|------|------|
| 抛异常（index 路线） | 强迫每个调用方包一层 try/except——而"没带这个前缀"根本不是错误 | 与需求语义冲突 |
| 返回特殊值（find 路线） | 调用方必须记得检查哨兵后再自行切片，代码回到手工时代 | 复杂度原地踏步 |
| 原样返回（实际选择） | **失败路径与成功路径合流，结果即答案** | 唯一与"尝试性剥离"语义匹配的选项 |

"原样返回"的深层含义在于：**对剥离操作而言，"没有什么可剥的"本身就是一种成功**——数据已经是目标状态。设计上这叫 fail-soft：目标不成立时不制造事故，安静地承认"无事可做"。它的红利贯穿本篇：

- 批量处理无需分支预判（3.2 模板的直管线）；
- 重复调用天然幂等（3.3 的双轮验证）；
- 空串参数、空串输入都不需要特判（2.3 的边界四件套）。

一层语义设计，消掉调用方一层防御代码——**好的失败语义不在于失败时说什么，而在于失败时还需要你说什么**。

## 5. 总结

本文围绕 `removeprefix` 与 `removesuffix` 方法展开，主要介绍了以下内容：

- 两个方法是 Python 3.9（PEP 616）新增的**字面前后缀剥离方法**：`removeprefix` 管开头、`removesuffix` 管结尾；核心语法三件套——**整段字面匹配**（参数必须整段出现在端点才算命中，大小写敏感、特殊符号无正则意义）、**恰好剥离一次**（命中后立即收工，连续重复模式只剥第一段）、**不命中原样返回**（无异常、无哨兵值，CPython 直接返回原对象引用）
- 命中返回剩余部分、不命中返回原样——两条走向合流出两个特性：批量处理无需预判格式（一行 `removesuffix('.tmp')` 对带后缀与不带后缀的输入都给出正确答案）、管线天然幂等（重复执行结果纹丝不动，重复消费事故先天免疫）
- 单次剥离是与 strip 家族最本质的行为分水岭：`'aaa'.removeprefix('a')` 得 `'aa'`（恰好一次），`lstrip('a')` 得空串（连续成员剥光）；想剥几层就链式调用几次，剥离次数由代码结构显式表达；中间与另一端的同名内容受绝对保护
- 边界四件套：空串参数等于"剥零个字符"原样返回；不命中同样返回原对象（`is` 实测为 True，但别依赖对象身份）；空串输入永远不命中；参数必须恰好一个，`takes exactly one argument` 的 `TypeError`——与 strip 可选 chars 参数的语法形状对照体现两个家族的语义差异
- 与 strip 的正面对照：字面语义 vs 集合语义——`'xxyyxx'.strip('xx')` 连右端 `xx` 一起剥得 `'yy'`；`'www.example.com'` 两边碰巧同结果的机制完全不同（最危险的榜样）；`'data_v2.txt'.strip('data_')` 因 `t` 入集合把尾部削成 `'.tx'`——**参数字符与正文端点重叠时，strip 的正确性由运气决定，removeprefix 由语义保证**
- 3.9 之前的手工写法 `s[len(p):] if s.startswith(p) else s` 可用但难读；后缀写法 `s[:-len(suffix)]` 埋着经典空串陷阱——`endswith('')` 恒真骗过条件、`-0 == 0` 让 `s[:-0]` 切成 `s[:0]` 返回空串，两层防线同时塌方；兼容环境用"正数从左算 + 空串短路"的修复版 fallback
- 最佳实践模板四件：字面前后缀默认选这两个方法（不选 strip）；多候选装饰用候选表 + 循环尝试的批量管线（不命中自动跳过，无需 if）；大小写不敏感剥离用 casefold 预检 + 按原长度切片的辅助函数（保留正文原样大小写，别先 lower 整串）；3.9 以下环境用修复版 fallback
- 原理上：C 实现走"一次整段比较 + 一刀切片"，命中切片、不命中直接返回引用（不命中反而更快）；百万次调用比手工 startswith+切片快约 3 倍；PEP 616 的动机是让高频、明确、易错的操作拥有自带正确实现的专用方法名；"原样返回"的 fail-soft 失败语义让失败路径与成功路径合流——**好的失败语义，让调用方在失败时无须多说一句**
