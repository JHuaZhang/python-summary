---
group:
  title: 【03】字符串介绍
  order: 3
order: 18
title: isdecimal 与 isdigit 与 isnumeric 方法
nav:
  title: Python基础
  order: 1
---

# isdecimal 与 isdigit 与 isnumeric 方法

## 1. 介绍

### 1.1 什么是数字判断三方法

`isdecimal()`、`isdigit()`、`isnumeric()` 是 Python 字符串内置的三个"数字判断"方法。它们的签名完全一样——不带参数、返回一个布尔值，用来回答同一个问题的三个不同版本：

> 这串字符是不是"数字"？

问题只有一个，但"数字"这个词的口径有三层。做手机号校验时你可能只想认 0-9；处理排版文本时要认长着数字样子的上标字符 `²`；分析中文文案时还要认"三"、"五"这类汉字数字。三个方法分别对应这三种口径，一层比一层宽：

| 方法 | 判断口径 | 一句话定位 | 典型放行样例 |
|------|---------|-----------|-------------|
| `isdecimal()` | 十进制数码 | 最严格：每个字符都能作十进制数位使用 | `123`、`１２３`、`٠١٢` |
| `isdigit()` | 数字外形 | 中间层：比 isdecimal 多放行上标、下标、圆圈数字 | 在左边基础上多放行 `²`、`₂`、`①` |
| `isnumeric()` | 数值含义 | 最宽松：凡有数值含义的字符都放行 | 在左边基础上多放行 `½`、`一`、`Ⅲ` |

这三个方法在表单校验、数据清洗、文本分析中出现频率极高，同时也是最容易混淆的一组 API——三个名字都带 is、返回值都是布尔值、中文直译都是"数字判断"，但放行范围一环套一环，选错一层就可能放行危险输入或拒绝合法输入。

本篇的实测环境是 Python 3.12。这三个方法的判断依据都来自 Python 内置的 Unicode 字符数据库，个别字符的归属会随版本演进而变化，所以本篇给出的每一层结论都经过真实运行验证，文中所有运行结果都能用对应代码原样复现。

### 1.2 最简示例：四个字符串看分层

先用四个代表性字符串，把三个方法各跑一遍，四行输出就能看出三层口径的差别：

```python
samples = [
    ("123", "半角数字"),
    ("１２３", "全角数字"),
    ("²", "上标数字"),
    ("一二三", "中文数字"),
]

print(f"{'字符串':<10}{'说明':<10}{'isdecimal':<12}{'isdigit':<10}{'isnumeric'}")
for text, label in samples:
    print(f"{text:<10}{label:<10}"
          f"{str(text.isdecimal()):<12}{str(text.isdigit()):<10}{text.isnumeric()}")
```

**运行结果**：

```text
字符串       说明        isdecimal   isdigit   isnumeric
123       半角数字      True        True      True
１２３       全角数字      True        True      True
²         上标数字      False       True      True
一二三       中文数字      False       False     True
```

四行结果正好对应三种命运：

- 半角 `123` 和全角 `１２３`：三层全过。
- 上标 `²`：被 isdecimal 拒绝，被 isdigit 和 isnumeric 放行。
- 中文数字 `一二三`：只有 isnumeric 放行。

三个方法对同一批字符串给出三种不同的答案，这正是它们的价值所在——先想清楚你的业务口径在哪一层，再选方法。

### 1.3 三层包容层级总览

三个方法的放行范围不是并列关系，而是严格的包含关系：isdecimal 通过的，isdigit 一定通过；isdigit 通过的，isnumeric 一定通过。反过来则不成立。

```text
isdecimal ⊂ isdigit ⊂ isnumeric

  680 个十进制数码
  ⊂ 808 个数字外形字符
  ⊂ 1912 个数值含义字符
```

把每一层的"常客"画成阶梯，就是下面这棵树（外层包含内层）：

```text
数字判断的三层口径（外层包含内层，一层比一层宽松）

isnumeric —— 有数值含义（最宽）
├── 分数：½ ¼ ¾
├── 汉字数字：一 三 十 百 万 亿
├── 罗马数字：Ⅰ Ⅱ Ⅲ
└── isdigit —— 数字外形
    ├── 上标数字：¹ ² ³
    ├── 下标数字：₁ ₂ ₃
    ├── 圆圈/带圈数字：① ⑦
    ├── 特殊地区数字：፩（埃塞俄比亚文）
    └── isdecimal —— 十进制数码（最严）
        ├── ASCII 数字：0 1 2 … 9
        ├── 全角数字：０ １ ２ … ９
        └── 多语言十进制数码：٠ ١ ٢（阿拉伯）、० १ २（天城文）
```

再用符号压缩成一张分布图（T = 通过，· = 拒绝）：

```text
同一批样例在三层的真假分布

样例                isdecimal   isdigit   isnumeric
"123"  "１２３"      T           T         T        ← 三层全过
"²"    "₂"   "①"    ·           T         T        ← 从 isdigit 这层起通过
"½"    "一"  "Ⅲ"     ·           ·         T        ← 只有 isnumeric 放行
"3.14" "-1"  "1 2"   ·           ·         ·        ← 三层全拒
""                   ·           ·         ·        ← 空字符串一并拒绝
```

最小圈里的 `123` 三层全过，最大圈独有的 `一二三` 只被 isnumeric 放行——这张分布图就是三个方法的全部性格。

### 1.4 共同行为规则

三个方法除了口径不同，行为规则完全一致，掌握这一张表可以省去很多单独记忆：

| 规则 | 具体表现 |
|------|---------|
| 签名一致 | 都是无参数方法 `s.isxxx()`，返回 `bool` |
| 整串判断 | 字符串中全部字符都满足口径才返回 True，任何字符不满足即整体 False |
| 空字符串 | 三个方法都返回 False，等价于"没有字符满足条件" |
| 混入杂质 | 空格、小数点、正负号、逗号任何之一出现，三个方法全部 False |
| 判断字符不判断数值 | `"-1"`、`"3.14"` 在数学上是数，但作为字符串一律三层全拒 |
| 基于 Unicode 数据 | 口径由 Python 内置的 Unicode 字符数据库决定，个别字符归属以实测为准 |

特别注意第二条"整串判断"——`"12a3"` 里只有一个非数字字符 `a`，三个方法都会整体返回 False。它们不是"含有数字就 True"的存在判断，而是"整串是否全为某类数字字符"的构成判断。

## 2. 核心内容

### 2.1 isdecimal()：只认十进制数码（最严格）

`isdecimal()` 判断字符串是否全部由"十进制数码"组成。十进制数码指的是能充当十进制数中一个数位的字符——ASCII 的 0-9 是最典型的一批，但它远不止这一批：全角数字、阿拉伯-印度数码、天城文数码，只要 Unicode 把它归为"十进制数码"，`isdecimal()` 都放行。

它是三个方法中最严格的一层，也是唯一与 `int()` / `float()` 直接兼容的一层。

#### 2.1.1 基本用法：哪些字符串能通过

拿一组有代表性的字符串实测：

```python
cases = ["123", "007", "０", "１２３", "12.3", "-5", "1 2", "²", "½", "一", ""]

print(f"{'字符串':<10}{'isdecimal'}")
for text in cases:
    display = text if text else "(空字符串)"
    print(f"{display:<10}{text.isdecimal()}")
```

**运行结果**：

```text
字符串       isdecimal
123       True
007       True
０         True
１２３       True
12.3      False
-5        False
1 2       False
²         False
½         False
一         False
(空字符串)    False
```

从结果可以归纳出 isdecimal 的两条放行原则：

- **只认"数码"本身**：`12.3` 的小数点、`-5` 的负号、`1 2` 的空格、空串，全部拒绝。isdecimal 判断的是"字符构成"，不是"数学上是不是数"。
- **上标、分数、汉字数字一律拒绝**：`²`、`½`、`一` 都不在这个范畴内——它们虽有数值含义，但不能当一个十进制数位来用。

#### 2.1.2 全角数字与多语言数码都在十进制范畴内

最容易出乎意料的一点：全角数字 `０-９` 通过 isdecimal，而且 `int()` 能直接转换；世界上几十种文字的十进制数码（阿拉伯-印度、天城文等）同样通过：

```python
fullwidth = "０１２３"

print(f"全角数字 '{fullwidth}':")
print(f"  isdecimal={fullwidth.isdecimal()}, isdigit={fullwidth.isdigit()}, "
      f"isnumeric={fullwidth.isnumeric()}")
print(f"  int('{fullwidth}') -> {int(fullwidth)}")

for text, label in [("٠١٢", "阿拉伯-印度数码"), ("०१२", "天城文数码")]:
    print(f"{label} '{text}': isdecimal={text.isdecimal()}, int() -> {int(text)}")
```

**运行结果**：

```text
全角数字 '０１２３':
  isdecimal=True, isdigit=True, isnumeric=True
  int('０１２３') -> 123
阿拉伯-印度数码 '٠١٢': isdecimal=True, int() -> 12
天城文数码 '०१२': isdecimal=True, int() -> 12
```

实测统计，Unicode 里被标为十进制数码的字符共有 680 个，覆盖全球几十种文字。日常开发用不上大部分，但要知道 isdecimal 的"全球视野"：它不是"判断 0-9"的快捷方式，而是"判断十进制数码"的世界标准口径。

#### 2.1.3 与 int()/float() 直接兼容：isdecimal 是安全转换的充分条件

isdecimal 最核心的实用价值在这里：只要它返回 True，`int()` 和 `float()` 就一定能转换成功。用一次全量扫描验证——把 0 到 0x10FFFF 全部 1114112 个码点逐个转成单字符字符串，凡是 isdecimal 通过的都喂给 `int()` 计数失败次数：

```python
failed = []
for cp in range(0x110000):
    ch = chr(cp)
    if ch.isdecimal():
        try:
            int(ch)
        except ValueError:
            failed.append(hex(cp))

print(f"isdecimal 为 True 的字符中，int() 失败的数量: {len(failed)}")
```

**运行结果**：

```text
isdecimal 为 True 的字符中，int() 失败的数量: 0
```

680 个十进制数码字符全部转换成功，无一例外。所以 `isdecimal()` 是 `int()` 安全转换的**充分条件**——转换前用它做前置检查，检查通过后调用 `int()` 不必再担心异常。

不过要注意"充分"不等于"必要"：`int(" 12 ")`、`int("+5")` 都能成功，但它们三方法全 False，转换器有自己的一套语法规则，这部分落差在四象限实测里展开。

### 2.2 isdigit()：放宽到"数字外形"

`isdigit()` 判断的是"这串字符是否全部长得像数字"——在十进制数码的基础上，它额外放行上标、下标、圆圈数字这类"数字外形"字符。它是三层结构的中间层。

#### 2.2.1 基本用法：哪里开始与 isdecimal 分岔

拿同一组字符串实测 isdigit，与 isdecimal 的结果只差一行：

```python
cases = ["123", "007", "１２３", "12.3", "-5", "1 2", "²", "½", "一", ""]

print(f"{'字符串':<10}{'isdigit'}")
for text in cases:
    display = text if text else "(空字符串)"
    print(f"{display:<10}{text.isdigit()}")
```

**运行结果**：

```text
字符串       isdigit
123       True
007       True
１２３       True
12.3      False
-5        False
1 2       False
²         True
½         False
一         False
(空字符串)    False
```

对照 isdecimal 的结果，唯一的变化就是 `²`：isdecimal 拒绝、isdigit 放行。杂质类（小数点、负号、空格、空串）两个方法仍然全部拒绝——isdigit 放宽的是"数码范围"，不是"语法规则"。

#### 2.2.2 放宽进来的字符：上标、下标、圆圈数字

isdecimal 与 isdigit 之间的差集，实测有 128 个字符。它们的共同点是：有"数字外形"、在 Unicode 里登记了 digit 数值，但不是十进制数码。代表成员如下：

```python
specials = [
    ("²", "上标 2"),
    ("³", "上标 3"),
    ("₂", "下标 2"),
    ("①", "圆圈数字 1"),
    ("⑦", "带圈数字 7"),
    ("፩", "埃塞俄比亚数字 1"),
]

for ch, label in specials:
    print(f"'{ch}'（{label}）: isdecimal={ch.isdecimal()}, "
          f"isdigit={ch.isdigit()}, isnumeric={ch.isnumeric()}")
```

**运行结果**：

```text
'²'（上标 2）: isdecimal=False, isdigit=True, isnumeric=True
'³'（上标 3）: isdecimal=False, isdigit=True, isnumeric=True
'₂'（下标 2）: isdecimal=False, isdigit=True, isnumeric=True
'①'（圆圈数字 1）: isdecimal=False, isdigit=True, isnumeric=True
'⑦'（带圈数字 7）: isdecimal=False, isdigit=True, isnumeric=True
'፩'（埃塞俄比亚数字 1）: isdecimal=False, isdigit=True, isnumeric=True
```

这 128 个"数字外形"字符来自世界各地：数学排版的上标下标、带圈序号、罕见文字的记数符号。它们与 680 个十进制数码合起来，就是 isdigit 的全部放行范围——实测 808 个字符。

#### 2.2.3 危险落差：isdigit 放行，int() 报错

正是这 128 个放宽进来的字符，制造了三个方法身上最著名的事故现场：`isdigit()` 返回 True，`int()` 却当场抛异常。

```python
text = "²"
print(f"'{text}'.isdigit() -> {text.isdigit()}")

if text.isdigit():
    try:
        int(text)
    except ValueError as exc:
        print(f"int('{text}') 崩溃: ValueError: {exc}")
```

**运行结果**：

```text
'²'.isdigit() -> True
int('²') 崩溃: ValueError: invalid literal for int() with base 10: '²'
```

污染数据里的上标字符并不罕见——从 PDF、网页复制出来的 `4²`、`注①` 都带着这类字符。一旦形成"isdigit 通过就 int()"的思维惯性，这些输入就会在运行期炸出 ValueError。

危险区的规模实测如下：isdigit 放行的 808 个字符里，只有 680 个能被 `int()` 接受，剩下 128 个全部报错——每 6 个"数字字符串"里就潜伏着 1 个转换炸弹。所以判断"能不能安全转 int"时，isdecimal 是充分条件，isdigit 恰恰不满足。

### 2.3 isnumeric()：最宽的"数值含义"

`isnumeric()` 的口径最宽：只要字符在 Unicode 里登记了数值属性——不管它是数码、汉字、分数还是罗马数字——isnumeric 都放行。它回答的问题是"这串字符有没有数值含义"，而不是"这串字符是不是数字"。

#### 2.3.1 基本用法：汉字数字、分数、罗马数字都算

```python
cases = ["123", "１２３", "½", "²", "一", "壹贰叁", "Ⅲ", "12.3", "-5", ""]

print(f"{'字符串':<10}{'isnumeric'}")
for text in cases:
    display = text if text else "(空字符串)"
    print(f"{display:<10}{text.isnumeric()}")
```

**运行结果**：

```text
字符串       isnumeric
123       True
１２３       True
½         True
²         True
一         True
壹贰叁       True
Ⅲ         True
12.3      False
-5        False
(空字符串)    False
```

isnumeric 把 isdigit 放行的全部照收，又额外收编了三类"只有数值含义"的字符：分数（`½`）、汉字数字（`一`、`壹`）、罗马数字（`Ⅲ`）。它是三层里唯一放行汉字数字的方法，这是它的独特价值。

同样注意：杂质（小数点、负号、空格）在 isnumeric 这里也照样全拒——三层方法对"语法符号一律不认"的态度完全一致。

#### 2.3.2 识别不等于可转换

isnumeric 的名字容易让人产生"isnumeric 为 True 就能转数值"的联想。实测会把这个联想击得粉碎：

```python
cases = ["一", "一二三", "五", "½", "Ⅲ"]
for text in cases:
    try:
        int_result = f"成功 -> {int(text)}"
    except ValueError:
        int_result = "ValueError"
    try:
        float_result = f"成功 -> {float(text)}"
    except ValueError:
        float_result = "ValueError"
    print(f"'{text}': isnumeric={text.isnumeric()}, int() {int_result}, "
          f"float() {float_result}")
```

**运行结果**：

```text
'一': isnumeric=True, int() ValueError, float() ValueError
'一二三': isnumeric=True, int() ValueError, float() ValueError
'五': isnumeric=True, int() ValueError, float() ValueError
'½': isnumeric=True, int() ValueError, float() ValueError
'Ⅲ': isnumeric=True, int() ValueError, float() ValueError
```

isnumeric 通过的这些字符串，`int()` 和 `float()` **全部失败**。原因很好理解：`int("一二三")` 应该得到多少？123？3？没有定义。isnumeric 只负责"识别"——告诉你这串字符有数值含义；而"转换"需要明确的数制规则，那是另一件事。

数值本身是能查到的，用 `unicodedata.numeric()` 可以读取字符的数值属性：`unicodedata.numeric("一")` 得到 1.0、`unicodedata.numeric("½")` 得到 0.5。查询是对字符属性的读取，不是对字符串的转换，两者的边界在原理部分展开。

#### 2.3.3 覆盖面有边界：同为汉字，"五"认"两"不认

isnumeric 的"数值含义"来自 Unicode 数据库的登记，并不是按中文语感划定的。实测一批常用汉字：

```python
checks = ["一二三四五六七八九十", "壹贰叁肆伍陆柒捌玖拾", "百千万亿", "两", "廿", "卅", "零", "〇"]
for text in checks:
    print(f"'{text}': isnumeric={text.isnumeric()}")
```

**运行结果**：

```text
'一二三四五六七八九十': isnumeric=True
'壹贰叁肆伍陆柒捌玖拾': isnumeric=True
'百千万亿': isnumeric=True
'两': isnumeric=False
'廿': isnumeric=True
'卅': isnumeric=True
'零': isnumeric=True
'〇': isnumeric=True
```

三个值得划重点的实测结论：

- 大小写数字、进位单位（百千万亿）全数通过，连冷门的"廿"（二十）、"卅"（三十）都通过。
- **"两"不通过**——日常使用频率很高的"两"没有登记数值属性，isnumeric 对它返回 False。
- "零"和"〇"都通过，但"〇"和 isdecimal 无缘，它走的是 isnumeric 这一层的放行。

所以把 isnumeric 当"中文数字识别器"用时要清醒：它的覆盖面由 Unicode 数据库决定，版本不同结论可能有差异（比如"五"在较老的 Unicode 数据中未被收录数值属性，Python 3.12 内置数据中已登记，实测通过）。拿它做识别辅助没问题，做严格校验就会误伤。

### 2.4 阶梯样例串全对照

把三个方法对一组阶梯样例串的判断结果放在同一张表里，全程实跑。样例按"从三层全过到三层全拒"排好序：

```python
LADDER = [
    ("0123456789", "ASCII 数字 0-9"),
    ("１２３", "全角数字"),
    ("٠١٢", "阿拉伯-印度数码"),
    ("०१٢", "天城文数码"),
    ("²", "上标 2"),
    ("³", "上标 3"),
    ("₂", "下标 2"),
    ("①", "圆圈数字 1"),
    ("⑦", "带圈数字 7"),
    ("½", "分数 1/2"),
    ("¼", "分数 1/4"),
    ("一", "中文数字一"),
    ("一二三", "中文数字串"),
    ("壹", "中文大写壹"),
    ("十", "汉字十（数值 10）"),
    ("Ⅲ", "罗马数字 3"),
    ("", "空字符串"),
    ("3.14", "混入小数点"),
    ("-1", "混入负号"),
    ("1 2", "混入空格"),
]

print(f"{'样例':<12}{'说明':<20}{'isdecimal':<11}{'isdigit':<9}{'isnumeric'}")
for text, label in LADDER:
    display = text if text else "(空)"
    print(f"{display:<12}{label:<20}"
          f"{str(text.isdecimal()):<11}{str(text.isdigit()):<9}{text.isnumeric()}")
```

**运行结果**：

```text
样例          说明                  isdecimal  isdigit  isnumeric
0123456789  ASCII 数字 0-9        True       True     True
１２３         全角数字                True       True     True
٠١٢         阿拉伯-印度数码            True       True     True
०१٢         天城文数码               True       True     True
²           上标 2                False      True     True
³           上标 3                False      True     True
₂           下标 2                False      True     True
①           圆圈数字 1              False      True     True
⑦           带圈数字 7              False      True     True
½           分数 1/2              False      False    True
¼           分数 1/4              False      False    True
一           中文数字一               False      False    True
一二三         中文数字串               False      False    True
壹           中文大写壹               False      False    True
十           汉字十（数值 10）          False      False    True
Ⅲ           罗马数字 3              False      False    True
(空)         空字符串                False      False    False
3.14        混入小数点               False      False    False
-1          混入负号                False      False    False
1 2         混入空格                False      False    False
```

前四行三层全过——十进制数码走到哪层都通行。上标、下标、带圈数字从 isdecimal 掉队、被 isdigit 接住；从分数 `½` 开始 isdigit 也弃权，只剩 isnumeric 兜底；最后四行三层全拒，是混入杂质的语法残骸。三级台阶齐齐整整。

最后把"包含关系"做成一次彻底实测——扫描全部 1114112 个 Unicode 码点，统计三层各放行多少字符、数一数有没有反例：

```python
counts = {"isdecimal": 0, "isdigit": 0, "isnumeric": 0}
dec_but_not_dig = 0
dig_but_not_num = 0

for cp in range(0x110000):
    ch = chr(cp)
    if ch.isdecimal():
        counts["isdecimal"] += 1
        if not ch.isdigit():
            dec_but_not_dig += 1
    if ch.isdigit():
        counts["isdigit"] += 1
        if not ch.isnumeric():
            dig_but_not_num += 1
    if ch.isnumeric():
        counts["isnumeric"] += 1

print(f"isdecimal True: {counts['isdecimal']} 个")
print(f"isdigit   True: {counts['isdigit']} 个")
print(f"isnumeric True: {counts['isnumeric']} 个")
print(f"反例（decimal 通过但 digit 不通过）: {dec_but_not_dig}")
print(f"反例（digit 通过但 numeric 不通过）: {dig_but_not_num}")
```

**运行结果**：

```text
isdecimal True: 680 个
isdigit   True: 808 个
isnumeric True: 1912 个
反例（decimal 通过但 digit 不通过）: 0
反例（digit 通过但 numeric 不通过）: 0
```

全码点实测零反例：isdecimal ⊆ isdigit ⊆ isnumeric 成立。三个数字也值得记住——680、808、1912，口径一层比一层宽。

### 2.5 与 int()/float() 转换的四象限落差

三层判断是对"字符层"的裁决；int()/float() 是对"字符串"的十进制解析。两者并不完全对齐——把判断结果与转换结果交叉对照，会得到一张规则的"落差地图"：

```text
四象限落差地图（括号中为实测代表样例）

  象限 1  isdecimal 通过（'123' '１２３' '०१२'）
          → int() 成功，float() 成功
          判定：识别即转换，最安全的一层

  象限 2  仅 isdigit 通过（'²' '②' '፩'）
          → int() 报错，float() 报错
          判定：有数字外形、无十进位权——识别与转换在此分家

  象限 3  仅 isnumeric 通过（'一' '½' 'Ⅲ'）
          → int() 报错，float() 报错
          判定：只有数值含义、没有进制结构——不可转换

  象限 4  三方法全拒（' 12 ' '+5' '-1' '1_000' '3.14'）
          → int() 多数成功，float() 连 '3.14' 都能收
          判定：空白/正负号/下划线/小数点属于转换器的语法层
```

用一段代码把四个象限各抽几个实测：

```python
quadrants = [
    ("象限 1：isdecimal 通过", ["123", "１２３", "०१२"]),
    ("象限 2：仅 isdigit 通过", ["²", "②", "፩"]),
    ("象限 3：仅 isnumeric 通过", ["一", "½", "Ⅲ"]),
    ("象限 4：三方法全拒", [" 12 ", "+5", "-1", "1_000", "3.14"]),
]

for quad, cases in quadrants:
    print(f"=== {quad} ===")
    for text in cases:
        three = (text.isdecimal(), text.isdigit(), text.isnumeric())
        try:
            int_r = f"成功 -> {int(text)}"
        except ValueError:
            int_r = "报错"
        try:
            float_r = f"成功 -> {float(text)}"
        except ValueError:
            float_r = "报错"
        print(f"  {text!r}: 三法={three}, int() {int_r}, float() {float_r}")
```

**运行结果**：

```text
=== 象限 1：isdecimal 通过 ===
  '123': 三法=(True, True, True), int() 成功 -> 123, float() 成功 -> 123.0
  '１２３': 三法=(True, True, True), int() 成功 -> 123, float() 成功 -> 123.0
  '०१२': 三法=(True, True, True), int() 成功 -> 12, float() 成功 -> 12.0
=== 象限 2：仅 isdigit 通过 ===
  '²': 三法=(False, True, True), int() 报错, float() 报错
  '②': 三法=(False, True, True), int() 报错, float() 报错
  '፩': 三法=(False, True, True), int() 报错, float() 报错
=== 象限 3：仅 isnumeric 通过 ===
  '一': 三法=(False, False, True), int() 报错, float() 报错
  '½': 三法=(False, False, True), int() 报错, float() 报错
  'Ⅲ': 三法=(False, False, True), int() 报错, float() 报错
=== 象限 4：三方法全拒 ===
  ' 12 ': 三法=(False, False, False), int() 成功 -> 12, float() 成功 -> 12.0
  '+5': 三法=(False, False, False), int() 成功 -> 5, float() 成功 -> 5.0
  '-1': 三法=(False, False, False), int() 成功 -> -1, float() 成功 -> -1.0
  '1_000': 三法=(False, False, False), int() 成功 -> 1000, float() 成功 -> 1000.0
  '3.14': 三法=(False, False, False), int() 报错, float() 成功 -> 3.14
```

象限 1 是方法与转换器完全重合的安全区——也是 isdecimal 能放心做"int() 前置检查"的实测根据。象限 2 是三个方法身上最出名的危险落差：isdigit 放行的 128 个非数码字符，int() 一律当场报错。象限 3 说明"数值含义"救不了转换——数据库登记了数值属性不等于有十进制结构，int()/float() 一律报错。象限 4 是反向落差：三方法全拒时 int() 却常常成功，转换器的语法层（空白、正负号、下划线）根本不在字符层判断的管辖之内，float() 还额外兜下了 '3.14'。

一句话记忆：**判断看字符层，转换看语法层——两层规则不同，落差里全是事故现场。**

### 2.6 共性边界：空串与杂质一律全拒

三层方法口径差得再大，对"语法符号"的态度完全一致——小数点、正负号、空格、逗号谁也不认，空字符串更是三法齐拒。实测一批被污染的输入：

```python
polluted = ["1 2", " 12\t", "1.5", "3.14", "-1", "+5", "1,000"]

print(f"{'输入':<12}{'isdecimal':<11}{'isdigit':<9}{'isnumeric':<11}{'int()'}")
for text in polluted:
    try:
        int_r = str(int(text))
    except ValueError:
        int_r = "报错"
    print(f"{text!r:<12}{str(text.isdecimal()):<11}{str(text.isdigit()):<9}"
          f"{str(text.isnumeric()):<11}{int_r}")

empty = ""
print(f"空字符串: isdecimal={empty.isdecimal()}, "
      f"isdigit={empty.isdigit()}, isnumeric={empty.isnumeric()}")
```

**运行结果**：

```text
输入          isdecimal  isdigit  isnumeric  int()
'1 2'       False      False    False      报错
' 12\t'     False      False    False      12
'1.5'       False      False    False      报错
'3.14'      False      False    False      报错
'-1'        False      False    False      -1
'+5'        False      False    False      5
'1,000'     False      False    False      报错
空字符串: isdecimal=False, isdigit=False, isnumeric=False
```

| 输入特征 | 代表输入 | 三方法 | int() 实测 | 说明 |
|---|---|---|---|---|
| 空格混在数字中间 | `'1 2'` | 全 False | 报错 | 两段数字被隔断 |
| 空白只包在两边 | `' 12\t'` | 全 False | 成功得到 12 | 空白是语法层符号 |
| 小数点 | `'3.14'` | 全 False | int() 报错 | float() 能收 |
| 正负号 | `'-1'`、`'+5'` | 全 False | 成功 | 符号是语法层符号 |
| 千分位逗号 | `'1,000'` | 全 False | 报错 | 谁也不认，须自清洗 |
| 空字符串 | `''` | 全 False | 报错 | 三法天然筛掉空值 |

两条结论浮出水面：

- 字符层判断对"杂质"零容忍：小数点、正负号、逗号一层都不认——这不是缺陷，正是"纯数字判断"的语义所在。
- 转换器却额外认空白和正负号：`' 12 '`、`'-1'` 都能被 int() 静默收下。所以"三方法全拒"不等于"转换必失败"，校验前要想清楚要的是字符层的纯粹，还是转换层的宽松。

空字符串被三法齐拒这一点顺带帮了大忙：一层 isdecimal 等价于"非空 + 纯十进制数码"两重检查，空值处理可以省一半笔墨。

### 2.7 场景对照：三类业务怎么选口径

#### 2.7.1 口径选择决策树

三个方法分别对应三档业务语义。把选择逻辑画成决策树：

```text
输入字符串，业务要什么？

  ├─ 交互输入校验（手机号 / 验证码 / 订单号）
  │    只肯收 0-9、还要定长定开头
  │    → isdecimal() 叠加 isascii() 白名单
  │      放行后 int() 必然成功，转换零风险
  │
  ├─ 数量 / 金额输入（排版页面复制来的全角数字常见）
  │    要变通全角、但拒绝一切"不能转 int()"的外形数字
  │    → isdecimal()（全角数码本就放行，上标小数全挡下）
  │
  ├─ 数字外形核对（标注、序号、上标是否出现在位）
  │    只关心"长得像数字"，不打算转换
  │    → isdigit()，仅识别、不做 int() 前置
  │
  └─ 自然语言计数识别（中文数字、分数、罗马数字）
       只识别"有数值含义"的片段，转换另想办法
       → isnumeric() 扫描片段，识别≠转换
```

顺着树走一遍就是三句话：要转换安全就用 isdecimal（可再叠 isascii 白名单）；只识别外形用 isdigit；文本里捞数值含义用 isnumeric 且别指望它能装进 int()。下面把三类业务各写成一段可以直接抄走的校验代码。

#### 2.7.2 场景一：手机号校验（最窄口径叠加白名单）

手机号业务上只认 0-9 共 11 位、1 开头。isdecimal 承担"纯十进制"的判断，isascii 叠加"仅 ASCII 数字"的白名单——全角数字虽然是十进制数码，也要挡在门外：

```python
def validate_phone(phone):
    """手机号：只接受 ASCII 十进制数字，11 位，1 开头"""
    if not phone:
        return False, "手机号不能为空"
    if not (phone.isdecimal() and phone.isascii()):
        return False, "只能包含数字 0-9（全角数字也拒绝）"
    if len(phone) != 11:
        return False, f"须为 11 位，当前 {len(phone)} 位"
    if not phone.startswith("1"):
        return False, "须以 1 开头"
    return True, "合法"


phones = ["13800138000", "１３８００１３８０００", "13800abc8000", "238001380001"]
for phone in phones:
    ok, msg = validate_phone(phone)
    print(f"  [{'v' if ok else 'x'}] '{phone}': {msg}")
```

**运行结果**：

```text
  [v] '13800138000': 合法
  [x] '１３８００１３８０００': 只能包含数字 0-9（全角数字也拒绝）
  [x] '13800abc8000': 只能包含数字 0-9（全角数字也拒绝）
  [x] '238001380001': 须为 11 位，当前 12 位
```

第二行是活注脚：`'１３８００１３８００１'` 通过了 isdecimal（它确实是十进制数码），却拦在 isascii 这道白名单上——两个方法各司其职，"是数字"归 isdecimal 管，"是哪国数字"归 isascii 管。这条校验链里没有任何 try/except：isdecimal 放行之后 int() 必然成功，检查和转换天然同口径。

#### 2.7.3 场景二：商品数量（接受全角，拒绝一切不可转换）

数量输入常来自排版页面，全角数字常见；上标、小数、负数则不该被收下。这正好是 isdecimal 的辖区——全角数码放行、其余数字外形全拒：

```python
def validate_quantity(text):
    """购买数量：接受全角数字（变通友好输入），但必须是可转 int 的十进制"""
    if not text:
        return False, "数量不能为空"
    if not text.isdecimal():
        return False, "必须是十进制数字"
    quantity = int(text)
    if quantity <= 0:
        return False, "数量须为正整数"
    return True, f"合法：{quantity} 件"


quantities = ["5", "１０", "²", "3.5", "-1", ""]
for text in quantities:
    ok, msg = validate_quantity(text)
    print(f"  [{'v' if ok else 'x'}] '{text}': {msg}")
```

**运行结果**：

```text
  [v] '5': 合法：5 件
  [v] '１０': 合法：10 件
  [x] '²': 必须是十进制数字
  [x] '3.5': 必须是十进制数字
  [x] '-1': 必须是十进制数字
  [x] '': 数量不能为空
```

全角 `'１０'` 顺利转成 10——isdecimal 放行的字符恰好就是 int() 全收的字符，校验通过后转换没有任何悬念。`'²'` 则在门外就被挡下；倘若当初用 isdigit 做前置检查，'²' 会先混过检查、再在 int() 那一行炸出 ValueError——四象限里的"危险落差"在业务代码里就是这样引爆的。

#### 2.7.4 场景三：文本计数识别（isnumeric 的本职）

从自然语言里把数值片段捞出来，isnumeric 最合适——只有它认汉字数字。只识别、不转换：

```python
def recognize_numeric_tokens(text):
    """文本数值识别：找出具有数值含义的字符段（含中文数字），只识别不转换"""
    tokens = []
    current = []
    for ch in text:
        if ch.isnumeric():
            current.append(ch)
        else:
            if current:
                tokens.append("".join(current))
                current = []
    if current:
        tokens.append("".join(current))
    return tokens


sentences = [
    "买了3件礼品",
    "共三件商品，每件五元",
    "来了两个人，坐了两小时",
]
for sentence in sentences:
    tokens = recognize_numeric_tokens(sentence)
    print(f"  '{sentence}'")
    print(f"    isnumeric 识别出的数值片段: {tokens if tokens else '(无)'}")
```

**运行结果**：

```text
  '买了3件礼品'
    isnumeric 识别出的数值片段: ['3']
  '共三件商品，每件五元'
    isnumeric 识别出的数值片段: ['三', '五']
  '来了两个人，坐了两小时'
    isnumeric 识别出的数值片段: (无)
```

第三句是活生生的覆盖面教训："两"不在 Unicode 的数值登记册里，识别结果为空。自然语言字段的 isnumeric 识别召回率做不到百分之百，识别环节可以认怂，转换环节必须另配汉字数字映射表或人工复核——识别与转换，一个都不能省。

三个场景连成一条主线：业务越要"能安全转换"，口径就要选得越窄；业务越只要"有数值含义"，口径才可以放宽。

## 3. 最佳实践

### 3.1 口径选择速查表

| 业务诉求 | 推荐口径 | 实测依据 |
|---|---|---|
| 手机号 / 验证码 / 订单号 | `isdecimal()` 叠加 `isascii()` | 十进制数码 + 白名单排除全角与外文字符 |
| 数量 / 金额（接受全角输入） | `isdecimal()` | 放行即 int() 可转换——充分条件实测零反例 |
| 数字外形展示 / 标注核对 | `isdigit()`，仅识别不转换 | 覆盖上标、带圈字符，转换必报错 |
| 自然文本中的计数识别 | `isnumeric()` 只识别不转换 | 唯一放行汉字数字、分数、罗马数字的层 |
| 判断"能不能安全转 int()" | `isdecimal()` 或 `try int()` | 检查口径不得宽于转换口径 |

统一的纪律只有三条：

- 检查与转换同口径：用 isdecimal 检查就敢 int()，用 isdigit 检查就别 int()。
- isnumeric 一律不当"可转换"的前置条件——它的放行与 int() 的失败在象限图上是同一格。
- 小数点、正负号、空白、下划线是转换器的语法层，三方法全拒——处理它们要么用 try int()/float()，要么写显式白名单。

### 3.2 LBYL 与 EAFP：检查口径必须等于转换口径

判断并转换数字有两种风格。LBYL（Look Before You Leap，先检查后转换）的关键是检查口径不能比转换口径宽；EAFP（Easier to Ask Forgiveness than Permission，先转换、异常兜底）把口径问题直接交给转换器裁决。两种风格对同一批输入的表现：

```python
def safe_int_lbyl(value):
    """LBYL：先检查再转换，检查必须落到 isdecimal 这一层"""
    if value.isdecimal():
        return int(value)
    return None

def safe_int_eafp(value):
    """EAFP：直接转换，靠异常兜底"""
    try:
        return int(value)
    except (ValueError, TypeError):
        return None

for text in ["123", "１０", "²", "一", " 12 "]:
    print(f"  {text!r:<8} LBYL -> {str(safe_int_lbyl(text)):<5} "
          f"EAFP -> {safe_int_eafp(text)}")
```

**运行结果**：

```text
  '123'    LBYL -> 123   EAFP -> 123
  '１０'     LBYL -> 10    EAFP -> 10
  '²'      LBYL -> None  EAFP -> None
  '一'      LBYL -> None  EAFP -> None
  ' 12 '   LBYL -> None  EAFP -> 12
```

三条对比结论：

- LBYL 的检查必须落在 isdecimal：换成 isdigit 就会在 `'²'` 上"检查放行、转换崩溃"，检查形同虚设。
- EAFP 天然与转换器口径一致，`' 12 '` 这种三方法全拒但 int() 能收的空白输入也被妥善处理。
- 两者的分岔只在边界输入上：要求"纯十进制数码才收"就用 LBYL + isdecimal；要求"转换器收得下就算数"就用 EAFP。

### 3.3 常见错误模式与修正

三个方法的雷区高度集中在两件事上："识别"与"转换"的错位、空值处理。下面五个模式全部实测复现、逐个修正。

#### 3.3.1 用 isdigit 做 int() 的前置检查

检查口径比转换口径宽，检查放行的字符转换器却收不下，事故就发生在这一格落差里：

```python
text = "²"
if text.isdigit():
    try:
        int(text)
    except ValueError as exc:
        print(f"前置检查放行了，int() 却抛异常: {exc}")
```

**运行结果**：

```text
前置检查放行了，int() 却抛异常: invalid literal for int() with base 10: '²'
```

修正：安全转换的前置检查换成 isdecimal——它的放行范围与 int() 的接受范围实测完全重合，检查放行即可直接转换：

```python
text = "²"
if text.isdecimal():
    value = int(text)
else:
    print(f"'{text}' 不是十进制数码，拒绝转换")
```

**运行结果**：

```text
'²' 不是十进制数码，拒绝转换
```

#### 3.3.2 把 isnumeric 当"可转数字"的前置条件

isnumeric 放行的字符串，int() 大概率失败——用它做转换前置等于埋雷：

```python
text = "一二三"
print(f"'{text}'.isnumeric() -> {text.isnumeric()}")
try:
    int(text)
except ValueError as exc:
    print(f"int('{text}') 抛 ValueError: {exc}")
```

**运行结果**：

```text
'一二三'.isnumeric() -> True
int('一二三') 抛 ValueError: invalid literal for int() with base 10: '一二三'
```

修正：要读单个字符的数值，用 `unicodedata.numeric()` 查属性表，而不是硬转换：

```python
import unicodedata

text = "三"
if len(text) == 1 and text.isnumeric():
    print(f"'{text}' 的数值属性: {unicodedata.numeric(text)}")
```

**运行结果**：

```text
'三' 的数值属性: 3.0
```

#### 3.3.3 以为"三方法全拒"就转换必失败

反方向的误判同样致命——以为全 False 就能挡住 int()，实际上转换器有自己的语法层：

```python
payload = " 1200 "
print(f"三方法返回: isdecimal={payload.isdecimal()}, "
      f"isdigit={payload.isdigit()}, isnumeric={payload.isnumeric()}")
print(f"但 int() 静默成功: {int(payload)}")
```

**运行结果**：

```text
三方法返回: isdecimal=False, isdigit=False, isnumeric=False
但 int() 静默成功: 1200
```

修正：要控制字符集就写显式白名单，空白、符号一律不宽恕：

```python
payload = " 1200 "
if payload.isdecimal() and payload.isascii():
    print("通过白名单校验")
else:
    print("拒绝：含空白或非 ASCII 数字")
```

**运行结果**：

```text
拒绝：含空白或非 ASCII 数字
```

#### 3.3.4 把 isnumeric 当中文数字解析器

isnumeric 的覆盖面照抄 Unicode 登记册，不照抄中文语感——高频字"两"就漏在外面：

```python
count_text = "两"
print(f"'{count_text}'.isnumeric() -> {count_text.isnumeric()}")
```

**运行结果**：

```text
'两'.isnumeric() -> False
```

修正：抽汉字数字值，维护显式映射表，或走人工复核——登记册覆盖不了的字靠自己的清单兜底：

```python
HAN_DIGITS = {"零": 0, "一": 1, "二": 2, "三": 3, "四": 4,
              "五": 5, "六": 6, "七": 7, "八": 8, "九": 9}

text = "三"
if text in HAN_DIGITS:
    print(f"映射表得到: {HAN_DIGITS[text]}")
```

**运行结果**：

```text
映射表得到: 3
```

#### 3.3.5 空字符串漏判

三方法对空串一律返回 False，但空串的业务语义是"没填"，不是"格式不对"——漏判空值会把"用户没输入"报成"输入非法"：

```python
for text in ["", "123"]:
    print(f"{text!r}: isdecimal={text.isdecimal()}, isdigit={text.isdigit()}")
```

**运行结果**：

```text
'': isdecimal=False, isdigit=False
'123': isdecimal=True, isdigit=True
```

修正：空值先单判，再谈口径：

```python
text = ""
if not text:
    print("输入为空，请填写内容")
elif not text.isdecimal():
    print("只能包含数字")
else:
    print(f"通过校验，准备转换: {int(text)}")
```

**运行结果**：

```text
输入为空，请填写内容
```

### 3.4 性能与复杂度

三个方法在 CPython 里都是 C 层实现，对长度为 n 的字符串做一次线性扫描，时间复杂度 O(n)，且带短路优化——第一个字符不满足口径就立即返回 False，不扫完剩余部分。

判断"是不是纯数字"时，不要用 `ord()` 或比较运算手写循环——内置方法和手写循环之间有一个数量级以上的差距。实测：

```python
import timeit

text = "1" * 10000

builtin = timeit.timeit(lambda: text.isdecimal(), number=2000)
manual = timeit.timeit(
    lambda: all("0" <= ch <= "9" for ch in text), number=2000
)
print(f"内置 isdecimal(): {builtin:.4f}s")
print(f"手动逐字符比较:  {manual:.4f}s")
print(f"差约 {manual / builtin:.1f} 倍")
```

**运行结果**：

```text
内置 isdecimal(): 0.0081s
手动逐字符比较:  0.6952s
差约 86.0 倍
```

一万字符的串扫两千次，内置方法 0.008 秒，手写循环 0.7 秒，差 86 倍（计时数字随机器性能与每次运行浮动，量级差异稳定）。手写循环除了慢，还容易写成 ASCII 比较的伪数字判断——把全角拒了、或把杂质漏了，语义和性能双输。结论就一条：能用内置判断就用内置判断，判断的"口径选择"才是真正需要动脑子的地方。

## 4. 原理

### 4.1 三层对应三组 Unicode 数值属性

三个方法的差异，根源在于它们各自查询的 Unicode 属性集合不同。Unicode 给字符登记数值信息用两套字段：

- **通用类别 General_Category**：字符的主分类。与数字相关的主要有三类——Nd（十进制数码）、No（其他数字）、Nl（字母式数字）；此外 Lo（普通表意文字）里也有一批登记了数值的汉字。
- **数值类型 Numeric_Type**：字符"数值性"的精确分级，从内到外三层——Decimal（十进制）、Digit（数位型）、Numeric（数值型）。

三个方法查询的 Numeric_Type 集合一层层扩大，这正是包容关系的来源：

| 方法 | 放行条件（Numeric_Type） | 对照通用类别 | 实测放行字符数 |
|------|--------------------------|--------------|---------------|
| `isdecimal()` | 仅 Decimal | 全部落在 Nd | 680 |
| `isdigit()` | Decimal 或 Digit | Nd，加上一部分 No | 808 |
| `isnumeric()` | Decimal、Digit 或 Numeric | Nd + No + Nl + 有数值登记的 Lo | 1912 |

拿三个代表字符各画一张"属性档案卡"，裁决规则一目了然。

上标 `²`，isdigit 层的代表：

```text
字符 ²（上标 2）在 Unicode 数据库中的档案

  通用类别 General_Category : No（Other_Number，其他数字）
  数值类型 Numeric_Type     : Digit
  数值     Numeric_Value     : 2

  isdecimal()  只认 Decimal               → ² 是 Digit，不放行
  isdigit()    认 Decimal 和 Digit        → 匹配 Digit，放行
  isnumeric()  认 Decimal、Digit、Numeric  → 匹配 Digit，放行
```

分数 `½`，isnumeric 层的代表：

```text
字符 ½（二分之一）的档案

  通用类别 General_Category : No（Other_Number）
  数值类型 Numeric_Type     : Numeric
  数值     Numeric_Value     : 0.25

  isdecimal()  不放行（不是 Decimal）
  isdigit()    不放行（只是长得像分数，没有 Digit 类型）
  isnumeric()  放行（Numeric 正中靶心）
```

汉字数字"一"，汉字数字的代表：

```text
字符 一 的档案

  通用类别 General_Category : Lo（普通表意文字）
  数值类型 Numeric_Type     : Numeric
  数值     Numeric_Value     : 1.0

  isdecimal()  不放行（没有十进位权）
  isdigit()    不放行（没有数位形态）
  isnumeric()  放行（有数值登记）
```

三张卡片对齐看：三个方法的实现逻辑一模一样——都是"逐字符查表 + 检查 Numeric_Type 是否落在集合内"，唯一的差别是集合取多大。

### 4.2 用 unicodedata 实测底层属性

Python 标准库的 `unicodedata` 模块直接暴露了 Unicode 字符数据库，可以亲眼验证属性档案。`unicodedata.decimal()/digit()/numeric()` 三个查询函数分别对应三层数值字段，查不到会抛 ValueError：

```python
import unicodedata

chars = [
    ("5", "ASCII 数字"),
    ("５", "全角数字"),
    ("²", "上标 2"),
    ("①", "圆圈数字 1"),
    ("½", "分数 1/2"),
    ("一", "中文数字一"),
    ("Ⅲ", "罗马数字 3"),
]

print(f"  {'字符':<6}{'说明':<14}{'category':<10}{'decimal':<9}{'digit':<7}{'numeric'}")
for ch, label in chars:
    try:
        dec = unicodedata.decimal(ch)
    except ValueError:
        dec = "-"
    try:
        dig = unicodedata.digit(ch)
    except ValueError:
        dig = "-"
    try:
        num = unicodedata.numeric(ch)
    except ValueError:
        num = "-"
    print(f"  {ch:<6}{label:<14}{unicodedata.category(ch):<10}"
          f"{str(dec):<9}{str(dig):<7}{num}")
```

**运行结果**：

```text
  字符    说明            category  decimal  digit  numeric
  5     ASCII 数字      Nd        5        5      5.0
  ５     全角数字          Nd        5        5      5.0
  ²     上标 2          No        -        2      2.0
  ①     圆圈数字 1        No        -        1      1.0
  ½     分数 1/2        No        -        -      0.5
  一     中文数字一         Lo        -        -      1.0
  Ⅲ     罗马数字 3        Nl        -        -      3.0
```

属性与三方法的裁决完全对得上：

- ASCII `5` 与全角 `５`：category 是 Nd、decimal 有值——凡是 decimal 查得到的字符，三个方法都放行。Unicode 规定 Nd 类别与 Numeric_Type=Decimal 一一对应，所以 Nd 字符就是 isdecimal 的全部领地。
- `²` 与 `①`：category 是 No、digit 有值但 decimal 没有——所以 isdecimal 拒绝、isdigit 放行。
- `½`：category 是 No、只有 numeric 有值——digit 都查不到，isdigit 也拒绝，只有 isnumeric 放行。
- `一`：category 是 Lo、有数值登记——外表是文字，数值含义是数字，仅 isnumeric 放行。
- `Ⅲ`：category 是 Nl（字母式数字）、同样只有 numeric 有值——与汉字数字走同一条放行通道。

### 4.3 int() 只认十进制数码的位权原因

为什么 `int()` 能收全角数字、却坚决不收有 digit 值的 `²`？关键在于十进制转换依赖"位权"。

`int()` 解析字符串时按"数码值 × 位权"展开求和，每个字符必须占住一个明确的数位：

```text
int("１２３") 为什么成功？

  组成串的每个字符都是十进制数码，各自占据明确的数位：
      １ → 数码值 1，站在百位
      ２ → 数码值 2，站在十位
      ３ → 数码值 3，站在个位
  按"数码值 × 位权"展开求和：
      1×100 + 2×10 + 3×1 = 123   ✓

int("²") 为什么失败？

  ² 虽然登记了 digit 数值 2，但它没有十进位权——
  int() 无法判断"这个 2 站在哪一位上"：
      位权公式无从代入 → 直接抛出 ValueError   ✗
```

这样就彻底说清了四象限里的四个区段：

- isdecimal 层的字符全部有十进位权（Numeric_Type=Decimal 的定义就是"能当十进制数位用"），所以 isdecimal 是 int() 成功的充分条件。
- isdigit 层多出来的字符（`²` 等）有"数位外形"无数值地位——写成上标就是明证：它是"别人肩膀上的注释"，不占数位。
- isnumeric 层的汉字数字、分数、罗马数字，连"按位排列"的形式都没有（"三十"要读出 30 得靠乘法合并规则），int() 无从下手。
- 三方法全拒但 int() 成功的空白、正负号、下划线，属于转换器的"语法层"——它们描述"数怎么写"而不是"字符串里有什么字符"，与三方法管辖的"字符层"互不干涉。

`unicodedata.numeric()` 与 `int()` 的区别也因此清晰：前者是查表——读出数据库给字符登记的数值（`numeric("十")` 得 10.0）；后者是解析——对字符串执行十进制文法运算。查表不需要数位结构，解析需要，所以"a 数值属性是 10"和"int() 认它是 10"是两回事。

### 4.4 版本差异说明与自行实测

三个方法的裁决标准全部来自 Python 内置的 Unicode 字符数据库（`unicodedata` 模块背后的数据），它**随 Python 版本更新而更新**。每次 Unicode 标准升级都会新增一批数值字符，个别既有字符也可能被补登数值属性——"五"就是活例子：较老的教材里流传着"isnumeric 不认'五'"的实验记录，那在当时的数据版本里是事实；而较新的数据已经给"五"补登了数值属性 5.0，实测结果随之翻转。

这带来两条实打实的工作建议：

- 写代码时，不要把"某个具体字符三层过不过"固化成跨版本的假设。校验逻辑要落在"口径"上（三层任意一层的放行规则），而不是"字符清单"上。
- 结论以本机实测为准。一个字符的裁决有疑议时，三行代码就能问出真相：

```python
text = "五"
print(f"本机 '{text}' 的实测结果:")
print(f"  isdecimal={text.isdecimal()}, isdigit={text.isdigit()}, "
      f"isnumeric={text.isnumeric()}")
```

**运行结果**：

```text
本机 '五' 的实测结果:
  isdecimal=False, isdigit=False, isnumeric=True
```

同一段代码在不同 Python 小版本上跑出不同的 isnumeric 结果是完全可能的——这不是 bug，而是 Unicode 数据演进的正常现象。这也是把"业务金额、ID 校验"锚定在 isdecimal（或 isascii 白名单）这种窄口径上的另一个理由：窄口径离日常字符集最近，受数据演进的影响最小。

## 5. 总结

本文围绕字符串的三个数字判断方法展开，主要介绍了以下内容：

- 三个方法回答同一个问题的三层口径：isdecimal 只认十进制数码（最严格），isdigit 放宽到数字外形字符（中间层），isnumeric 放宽到一切有数值含义的字符（最宽）
- 层级关系经过全码点实测验证：isdecimal ⊆ isdigit ⊆ isnumeric 成立，1114112 个码点扫描零反例；三层放行字符数分别是 680、808、1912
- isdecimal 的放行范围是"十进制数码"的世界口径：除了 ASCII 0-9，还包括全角数字与几十种文字的数码，且是 int()/float() 安全转换的充分条件（实测 680 个数码字符 int() 全部成功）
- isdigit 比 isdecimal 多放行 128 个数字外形字符（上标 ²、下标 ₂、圆圈 ①、埃塞俄比亚 ፩ 等），制造了"判断通过、int() 报错"的危险区——808 个 isdigit 字符里约六分之一转不成 int
- isnumeric 额外放行分数 ½、汉字数字一二三、罗马数字 Ⅲ 等数值含义字符，但识别不等于可转换：isnumeric 通过的这些字符串 int()/float() 全部失败
- 汉字数字的识别覆盖面由 Unicode 数据登记决定："廿"、"卅"都通过，高频字"两"却不通过；把 isnumeric 当中文数字解析器必踩坑
- 三方法判断"字符构成"，int()/float() 解析"数字语法"，是两套规则：三方法全 False 的 " 12 "、"+5"、"1_000" 会被 int() 照常转换成功
- 共性边界：空字符串三层全 False；空格、小数点、正负号、逗号混入任何一个字符，三层全部 False
- 场景决策：手机号/验证码用 isdecimal + isascii 挡住全角；数量输入用 isdecimal 顺带转 int；文本数值识别用 isnumeric 且只当识别线索；只想知道能否转换时直接 try/except int()
- 最佳实践中把"保护 int() 转换"的哨兵固定在 isdecimal 这一层，安全校验选 LBYL（isdecimal 前置检查），解析清洗选 EAFP（try/except 直接转）
- 原理上，三层方法对应三组 Unicode 数值属性集合（Numeric_Type 的 Decimal / Decimal+Digit / Decimal+Digit+Numeric），通用类别 Nd/No/Nl/Lo 与三层的归属一一对照；int() 只认十进制数码是因为位权展开需要每个字符占据明确数位
- 性能上三个方法都是 C 实现的 O(n) 扫描带短路优化，实测比手写逐字符判断快 86 倍，与三方法相关的判断一律用内置方法
- Unicode 字符数据库随 Python 版本演进，"五"等字符的 isnumeric 归属可能翻转，跨版本的校验逻辑要锚定口径而非字符清单，有疑议时用三行代码本机实测
