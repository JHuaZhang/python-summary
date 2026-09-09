---
group:
  title: 【03】字符串介绍
  order: 3
order: 20
title: 字符串对齐填充
nav:
  title: Python基础
  order: 1
---

# 字符串对齐填充

## 1. 介绍

### 1.1 知识点定义

字符串对齐填充是指将字符串在指定宽度内对齐，并用填充字符补足空位。Python 提供了三种专门的对齐方法和一种格式规范对齐方式：

| 方法 | 作用 | 填充方向 | 对齐方式 |
|------|------|---------|---------|
| `str.ljust(width, fillchar)` | 左对齐 | 右侧填充 | 左对齐 |
| `str.rjust(width, fillchar)` | 右对齐 | 左侧填充 | 右对齐 |
| `str.center(width, fillchar)` | 居中对齐 | 两侧填充 | 居中 |
| `str.zfill(width)` | 零填充 | 左侧补零 | 数字右对齐 |
| f-string `:<`, `:>`, `:^`, `:=` | 格式规范对齐 | 可选 | 四种对齐 |

这些方法在 CLI 输出格式化、表格打印、日志排版、进度条、发票打印等场景中广泛使用。

### 1.2 最简示例

先用最简单的代码直观感受这些方法：

```python
s = "hello"

print(s.ljust(10))      # 'hello     '   左对齐
print(s.rjust(10))      # '     hello'   右对齐
print(s.center(10))     # '  hello   '   居中对齐
print("42".zfill(5))    # '00042'       零填充

# f-string 格式规范
print(f"{s:<10}")        # 'hello     '   左对齐
print(f"{s:>10}")        # '     hello'   右对齐
print(f"{s:^10}")        # '  hello   '   居中对齐
```

运行结果：

```text
hello     
     hello
  hello   
00042
hello     
     hello
  hello   
```

### 1.3 在字符串方法体系中的位置

对齐填充方法属于"字符串格式化"类操作的子集。从功能维度来看：

```text
字符串方法体系
├── 查找类：find / rfind / index / count / in
├── 判断类：isalpha / isdigit / isupper / islower ...
├── 拆分与连接类：split / rsplit / partition / join
├── 替换类：replace / translate / maketrans
├── 大小写转换类：upper / lower / title / capitalize / swapcase / casefold
├── 对齐填充类（本篇）：
│   ├── ljust / rjust / center    ← 方法调用式对齐
│   ├── zfill                     ← 数字专用零填充
│   └── f-string < > ^ =         ← 格式规范对齐操作符
├── 对齐填充类：ljust / rjust / center / zfill
└── 清洗类：strip / lstrip / rstrip / removeprefix / removesuffix
```

对齐填充方法的核心特点：

- **不修改原字符串**——Python 字符串是不可变对象，所有方法都返回新字符串
- **width 是字符数，不是显示宽度**——对于中文、emoji 等 Unicode 字符，终端中可能占两个列位，但 Python 的 `len()` 按字符数计算
- **width < len 时原样返回**——所有对齐方法都不会截断字符串
- **fillchar 必须是单个字符**——`ljust`、`rjust`、`center` 的 `fillchar` 参数必须是长度为 1 的字符串

## 2. 核心内容

### 2.1 str.ljust()

#### 2.1.1 方法签名

```python
str.ljust(width, fillchar=' ') -> str
```

`ljust()` 接收两个参数：

- **width**：目标总宽度。如果 `width` 大于字符串长度，右侧填充 `fillchar` 使其达到 `width`；如果 `width` 小于等于字符串长度，原样返回
- **fillchar**：填充字符，默认为空格 `' '`。必须是长度为 1 的字符串

#### 2.1.2 基本用法

**示例**

```python
print("=== ljust() 左对齐 ===")
cases = [
    ("hello", 10),       # 基本左对齐
    ("world", 8),
    ("Python", 12),
    ("abc", 3),          # width == len，不填充
    ("abc", 2),          # width < len，不截断，原样返回
    ("", 5),             # 空串
]
for s, w in cases:
    result = s.ljust(w)
    print(f"  {s!r}.ljust({w}) = {result!r} (len={len(result)})")
```

运行结果：

```text
=== ljust() 左对齐 ===
  'hello'.ljust(10) = 'hello     ' (len=10)
  'world'.ljust(8) = 'world   ' (len=8)
  'Python'.ljust(12) = 'Python      ' (len=12)
  'abc'.ljust(3) = 'abc' (len=3)
  'abc'.ljust(2) = 'abc' (len=3)
  ''.ljust(5) = '     ' (len=5)
```

**关键点说明**：

- `"abc".ljust(3)` 中 `width == len(s)`，不需要填充，结果与原字符串相同
- `"abc".ljust(2)` 中 `width < len(s)`，不截断，原样返回 `"abc"`
- `"".ljust(5)` 空字符串的 `ljust` 返回 5 个空格

#### 2.1.3 指定填充字符

**示例**

```python
fill_cases = [
    ("hello", 10, "-"),    # 用 - 填充
    ("hello", 10, "*"),    # 用 * 填充
    ("hello", 10, "."),    # 用 . 填充
    ("127.0.0.1", 15, "0"),  # 补零
]
for s, w, fill in fill_cases:
    result = s.ljust(w, fill)
    print(f"  {s!r}.ljust({w}, {fill!r}) = {result!r}")
```

运行结果：

```text
  'hello'.ljust(10, '-') = 'hello-----'
  'hello'.ljust(10, '*') = 'hello*****'
  'hello'.ljust(10, '.') = 'hello.....'
  '127.0.0.1'.ljust(15, '0') = '127.0.0.100000'
```

**关键点说明**：

- `fillchar` 可以是任意字符——不仅限于空格
- `fillchar` 会重复填充在字符串右侧，直到达到 `width` 长度

### 2.2 str.rjust()

#### 2.2.1 方法签名

```python
str.rjust(width, fillchar=' ') -> str
```

`rjust()` 的参数与 `ljust()` 相同，但填充方向相反——在字符串**左侧**填充字符，使字符串在总宽度内**右对齐**。

#### 2.2.2 基本用法

**示例**

```python
print("=== rjust() 右对齐 ===")
cases = [
    ("hello", 10),
    ("42", 5),
    ("3.14", 8),
    ("abc", 3),
    ("abc", 2),
    ("", 5),
]
for s, w in cases:
    result = s.rjust(w)
    print(f"  {s!r}.rjust({w}) = {result!r} (len={len(result)})")
```

运行结果：

```text
=== rjust() 右对齐 ===
  'hello'.rjust(10) = '     hello' (len=10)
  '42'.rjust(5) = '   42' (len=5)
  '3.14'.rjust(8) = '    3.14' (len=8)
  'abc'.rjust(3) = 'abc' (len=3)
  'abc'.rjust(2) = 'abc' (len=3)
  ''.rjust(5) = '     ' (len=5)
```

#### 2.2.3 指定填充字符

**示例**

```python
fill_cases = [
    ("hello", 10, "-"),
    ("42", 5, "0"),      # 常用：数字补零
    ("3.14", 8, "0"),
    ("pass", 8, "*"),
]
for s, w, fill in fill_cases:
    result = s.rjust(w, fill)
    print(f"  {s!r}.rjust({w}, {fill!r}) = {result!r}")
```

运行结果：

```text
  'hello'.rjust(10, '-') = '-----hello'
  '42'.rjust(5, '0') = '00042'
  '3.14'.rjust(8, '0') = '0003.14'
  'pass'.rjust(8, '*') = '****pass'
```

**关键点说明**：

- `rjust(width, '0')` 是数字补零的常见用法，但它不区分正负号——`"-42".rjust(6, '0')` 的结果是 `"00-42"`（0 在符号前面）。如果需要正确处理符号，应该用 `zfill()`

### 2.3 str.center()

#### 2.3.1 方法签名

```python
str.center(width, fillchar=' ') -> str
```

`center()` 将字符串居中放置在 `width` 宽度内，两侧用 `fillchar` 填充。

#### 2.3.2 基本用法

**示例**

```python
print("=== center() 居中对齐 ===")
cases = [
    ("hello", 11),
    ("title", 10),
    ("=center=", 12),
    ("abc", 3),
    ("abc", 2),
    ("", 5),
]
for s, w in cases:
    result = s.center(w)
    print(f"  {s!r}.center({w}) = {result!r} (len={len(result)})")
```

运行结果：

```text
=== center() 居中对齐 ===
  'hello'.center(11) = '   hello   ' (len=11)
  'title'.center(10) = '  title   ' (len=10)
  '=center='.center(12) = '  =center=  ' (len=12)
  'abc'.center(3) = 'abc' (len=3)
  'abc'.center(2) = 'abc' (len=3)
  ''.center(5) = '     ' (len=5)
```

#### 2.3.3 指定填充字符

**示例**

```python
fill_cases = [
    ("hello", 11, "-"),
    ("TITLE", 20, "="),
    ("menu", 12, "."),
    ("OK", 6, "*"),
]
for s, w, fill in fill_cases:
    result = s.center(w, fill)
    print(f"  {s!r}.center({w}, {fill!r}) = {result!r}")
```

运行结果：

```text
  'hello'.center(11, '-') = '---hello---'
  'TITLE'.center(20, '=') = '=======TITLE========'
  'menu'.center(12, '.') = '....menu....'
  'OK'.center(6, '*') = '**OK**'
```

#### 2.3.4 奇偶宽度分配规则

当 `(width - len(s))` 为奇数时，左右两侧的填充字符数量不相等——**右侧多一个填充字符**。

**示例**

```python
cases = [
    ("ab", 5),    # 5-2=3，左1右2
    ("ab", 6),    # 6-2=4，左2右2
    ("ab", 7),    # 7-2=5，左2右3
    ("ab", 8),    # 8-2=6，左3右3
    ("abc", 7),   # 7-3=4，左2右2
    ("abc", 8),   # 8-3=5，左2右3
]
for s, w in cases:
    result = s.center(w, ".")
    left = result.index(s)
    right = w - left - len(s)
    print(f"  {s!r}.center({w}, '.') = {result!r}  (左{left}右{right})")
print("  规则：空位为奇数时，右侧多一个填充字符")
```

运行结果：

```text
  'ab'.center(5, '.') = '.ab..'  (左1右2)
  'ab'.center(6, '.') = '..ab..'  (左2右2)
  'ab'.center(7, '.') = '..ab...'  (左2右3)
  'ab'.center(8, '.') = '...ab...'  (左3右3)
  'abc'.center(7, '.') = '..abc..'  (左2右2)
  'abc'.center(8, '.') = '..abc...'  (左2右3)
  规则：空位为奇数时，右侧多一个填充字符
```

**关键点说明**：

- 当空位数为偶数时，左右对称分配
- 当空位数为奇数时，**右侧多一个**填充字符——这是 CPython 的实现约定，其他语言（如 Java）可能左侧多一个

### 2.4 fillchar 规则

`ljust()`、`rjust()`、`center()` 的 `fillchar` 参数必须满足以下规则：

1. **必须是字符串类型**——不能是整数或其他类型
2. **长度必须为 1**——不能是空字符串 `""`，也不能是多字符字符串 `"ab"`
3. **默认值为空格** `' '`——不传 `fillchar` 时用空格填充

**示例**

```python
print("=== fillchar 规则 ===")
# fillchar 必须是长度为 1 的字符串
try:
    "hello".ljust(10, "ab")  # 两个字符 -> 报错
except TypeError as e:
    print(f"  ljust(10, 'ab') -> TypeError: {e}")

try:
    "hello".center(10, "")   # 空字符串 -> 报错
except TypeError as e:
    print(f"  center(10, '') -> TypeError: {e}")

# fillchar 可以是任意字符（包括空格）
print(f"  'hi'.ljust(5, ' ')  = {'hi'.ljust(5, ' ')!r}")
print(f"  'hi'.rjust(5, ' ')  = {'hi'.rjust(5, ' ')!r}")
print(f"  'hi'.center(6, ' ') = {'hi'.center(6, ' ')!r}")
```

运行结果：

```text
=== fillchar 规则 ===
  ljust(10, 'ab') -> TypeError: The fill character must be exactly one character long
  center(10, '') -> TypeError: The fill character must be exactly one character long
  'hi'.ljust(5, ' ')  = 'hi   '
  'hi'.rjust(5, ' ')  = '   hi'
  'hi'.center(6, ' ') = '  hi  '
```

### 2.5 str.zfill()

#### 2.5.1 方法签名

```python
str.zfill(width) -> str
```

`zfill()` 在字符串左侧填充 `'0'`，使长度达到 `width`。与 `rjust(width, '0')` 的核心区别是：`zfill()` 会**正确处理符号前缀**（`+` / `-`）——在符号后面补零，而不是在符号前面补零。

#### 2.5.2 基本用法

**示例**

```python
print("=== zfill() 基本用法 ===")
cases = [
    ("42", 5),       # 普通数字
    ("3.14", 8),     # 浮点数字
    ("123", 3),      # width == len
    ("12345", 3),    # width < len，原样返回
    ("", 5),         # 空串
    ("abc", 6),      # 非数字字符串也可以
]
for s, w in cases:
    result = s.zfill(w)
    print(f"  {s!r}.zfill({w}) = {result!r} (len={len(result)})")
```

运行结果：

```text
=== zfill() 基本用法 ===
  '42'.zfill(5) = '00042' (len=5)
  '3.14'.zfill(8) = '00003.14' (len=8)
  '123'.zfill(3) = '123' (len=3)
  '12345'.zfill(3) = '12345' (len=5)
  ''.zfill(5) = '00000' (len=5)
  'abc'.zfill(6) = '000abc' (len=6)
```

#### 2.5.3 处理符号前缀（核心特性）

`zfill()` 会检测字符串开头的 `+` 或 `-` 符号，并将 `0` 填充在符号之后。

**示例**

```python
print("=== zfill() 处理符号前缀 ===")
cases = [
    ("+42", 6),      # +42 -> +00042
    ("-42", 6),      # -42 -> -00042
    ("+3.14", 8),    # +3.14 -> +003.14
    ("-3.14", 8),    # -3.14 -> -003.14
    ("42", 5),       # 无符号 -> 00042
]
for s, w in cases:
    result = s.zfill(w)
    print(f"  {s!r}.zfill({w}) = {result!r}")
```

运行结果：

```text
=== zfill() 处理符号前缀 ===
  '+42'.zfill(6) = '+00042'
  '-42'.zfill(6) = '-00042'
  '+3.14'.zfill(8) = '+003.14'
  '-3.14'.zfill(8) = '-003.14'
  '42'.zfill(5) = '00042'
```

#### 2.5.4 zfill() vs rjust(width, '0')

**示例**

```python
print("=== zfill() vs rjust(width, '0') ===")
cases = [
    ("+42", 6),
    ("-42", 6),
    ("-3.14", 8),
    ("42", 5),
]
print(f"  {'字符串':>10} | {'zfill':>10} | {'rjust(0)':>10} | 相同?")
print(f"  {'-'*10}-+-{'-'*10}-+-{'-'*10}-+------")
for s, w in cases:
    zf = s.zfill(w)
    rj = s.rjust(w, "0")
    same = "是" if zf == rj else "否"
    print(f"  {s!r:>10} | {zf!r:>10} | {rj!r:>10} | {same}")

print("\n  关键差异：rjust 在符号前面补 0，zfill 在符号后面补 0")
print("  '-42'.zfill(6)  = '-00042'  <- 符号在前，0 在后")
print("  '-42'.rjust(6, '0') = '00-42'  <- 0 在前，符号被推右")
```

运行结果：

```text
=== zfill() vs rjust(width, '0') ===
         字符串 |      zfill |   rjust(0) | 相同?
  -----------+------------+------------+------
       '+42' |   '+00042' |   '000+42' | 否
       '-42' |   '-00042' |   '000-42' | 否
     '-3.14' | '-0003.14' | '000-3.14' | 否
        '42' |    '00042' |    '00042' | 是

  关键差异：rjust 在符号前面补 0，zfill 在符号后面补 0
  '-42'.zfill(6)  = '-00042'  <- 符号在前，0 在后
  '-42'.rjust(6, '0') = '00-42'  <- 0 在前，符号被推右
```

**关键点说明**：

- 无符号字符串：`zfill` 和 `rjust(w, '0')` 结果相同
- 有符号字符串：`zfill` 在符号后面补零，`rjust(w, '0')` 在符号前面补零
- 处理金额、负数等带符号的数字时，应使用 `zfill()` 而非 `rjust(w, '0')`

### 2.6 f-string 格式规范对齐

#### 2.6.1 四种对齐操作符

在 f-string 的格式规范中，用 `<`、`>`、`^`、`=` 四个字符控制对齐方式：

| 操作符 | 对齐方式 | 填充方向 | 等价方法 |
|--------|---------|---------|---------|
| `<` | 左对齐 | 右侧填充 | `ljust()` |
| `>` | 右对齐 | 左侧填充 | `rjust()` |
| `^` | 居中对齐 | 两侧填充 | `center()` |
| `=` | 符号后填充 | 数字专用 | `zfill()`（类似） |

格式规范的语法为 `{:填充字符 对齐操作符 总宽度}`。

**示例**

```python
s = "hello"

# 默认（无对齐操作符）：字符串左对齐，数字右对齐
print(f"  默认字符串：  '{s:8}'")
print(f"  默认数字：    '{42:8}'")

# 左对齐 <
print(f"  左对齐 <：    '{s:<8}'")
# 右对齐 >
print(f"  右对齐 >：    '{s:>8}'")
# 居中对齐 ^
print(f"  居中对齐 ^：  '{s:^8}'")
```

运行结果：

```text
  默认字符串：  'hello   '
  默认数字：    '      42'
  左对齐 <：    'hello   '
  右对齐 >：    '   hello'
  居中对齐 ^：  ' hello  '
```

**关键点说明**：

- 不指定对齐操作符时，**字符串默认左对齐，数字默认右对齐**
- 这与 `ljust` / `rjust` 的默认行为一致

#### 2.6.2 指定填充字符

填充字符放在对齐操作符的**前面**。

**示例**

```python
s = "hello"
n = "-42"

print(f"  左对齐 *：  '{s:*<10}'")
print(f"  右对齐 *：  '{s:*>10}'")
print(f"  居中 *：    '{s:*^11}'")

print(f"  右对齐 0：  '{n:0>8}'")
print(f"  右对齐 -：  '{s:->10}'")
print(f"  居中 .：    '{s:.^11}'")
```

运行结果：

```text
  左对齐 *：  'hello*****'
  右对齐 *：  '*****hello'
  居中 *：    '***hello***'
  右对齐 0：  '00000-42'
  右对齐 -：  '-----hello'
  居中 .：    '...hello...'
```

#### 2.6.3 = 操作符（符号后填充）

`=` 操作符用于数字格式化——在符号（如果有）和数字之间填充指定字符。

**示例**

```python
nums = [42, -42, +42, 3.14, -3.14, +3.14]
for n in nums:
    print(f"  {n!r:>8}: '{n:0=8}'")

print("\n  对比：")
print(f"  '42':  >对齐 '{42:0>5}'  vs  =对齐 '{42:0=5}'")
print(f"  '-42': >对齐 '{-42:0>5}'  vs  =对齐 '{-42:0=5}'")
print("  = 操作符在符号后面补 0，> 操作符在符号前面补 0")
```

运行结果：

```text
  42: '00000042'
      -42: '0-000042'
    +42: '0+000042'
    3.14: '00003.14'
   -3.14: '0-003.14'
   +3.14: '0+003.14'

  对比：
  '42':  >对齐 '00042'  vs  =对齐 '00042'
  '-42': >对齐 '00-42'  vs  =对齐 '-0042'
  = 操作符在符号后面补 0，> 操作符在符号前面补 0
```

**关键点说明**：

- `=` 操作符将填充字符放在符号和数字之间，类似 `zfill()` 的行为
- 无符号时 `=` 和 `>` 的效果相同
- 有符号时 `=` 在符号后填充，`>` 在符号前填充

#### 2.6.4 浮点数对齐与精度组合

f-string 格式规范可以在一步内同时设置对齐、宽度和精度。

**示例**

```python
values = [3.14159, 2.71828, 1.41421, 0.57721]
for v in values:
    # 右对齐，宽度8，保留2位小数
    print(f"  '{v:8.2f}'")

print("\n  右对齐 + 前导0 + 精度：")
for v in values:
    print(f"  '{v:0=8.2f}'")
```

运行结果：

```text
  '    3.14'
  '    2.72'
  '    1.41'
  '    0.58'

  右对齐 + 前导0 + 精度：
  '00003.14'
  '00002.72'
  '00001.41'
  '00000.58'
```

#### 2.6.5 动态宽度

f-string 支持在格式规范中使用嵌套表达式实现动态宽度。

**示例**

```python
width = 12
s = "dynamic"
print(f"  width={width}, s={s!r}")
print(f"  f'{s}:<{width}' = '{s:<{width}}'")
print(f"  f'{s}:>{width}' = '{s:>{width}}'")
print(f"  f'{s}:^{width}' = '{s:^{width}}'")

# 动态填充字符 + 动态宽度
print("\n  动态填充 + 动态宽度：")
fill = "-"
print(f"  f'{s}:{fill}^{width}' = '{s:{fill}^{width}}'")
```

运行结果：

```text
  width=12, s='dynamic'
  f'{s}:<12' = 'dynamic      '
  f'{s}:>12' = '      dynamic'
  f'{s}:^12' = '   dynamic   '

  动态填充 + 动态宽度：
  f'{s}:-^12' = '---dynamic---'
```

#### 2.6.6 f-string 对齐 vs 字符串方法

f-string 对齐操作符与字符串方法完全等价——底层调用的是同一套格式化逻辑。

**示例**

```python
s = "hello"
pairs = [
    (f"{s:<10}", s.ljust(10)),
    (f"{s:>10}", s.rjust(10)),
    (f"{s:^11}", s.center(11)),
    (f"{s:*<10}", s.ljust(10, "*")),
    (f"{s:*>10}", s.rjust(10, "*")),
    (f"{s:*^11}", s.center(11, "*")),
]
for fstr, method in pairs:
    match = "等价" if fstr == method else "不等!"
    print(f"  f-string={fstr!r:<15}  方法={method!r:<15}  {match}")
print("  结论：f-string 对齐与字符串方法完全等价")
```

运行结果：

```text
  f-string='hello     '   方法='hello     '   等价
  f-string='     hello'   方法='     hello'   等价
  f-string='  hello   '   方法='  hello   '   等价
  f-string='hello*****'   方法='hello*****'   等价
  f-string='*****hello'   方法='*****hello'   等价
  f-string='***hello***'   方法='***hello***'   等价
  结论：f-string 对齐与字符串方法完全等价
```

### 2.7 方法总览与对比

#### 2.7.1 方法签名总览

```text
  ljust()      str.ljust(width, fillchar=' ') -> str      左对齐，右侧填充
  rjust()      str.rjust(width, fillchar=' ') -> str      右对齐，左侧填充
  center()     str.center(width, fillchar=' ') -> str      居中对齐，两侧填充
  zfill()      str.zfill(width) -> str                    左补零（处理符号前缀）
  f-string     f'{val:<width}' / f'{val:>width}' ...       格式规范对齐操作符
```

#### 2.7.2 同一字符串效果对比

**示例**

```python
test_strings = [
    ("hello", 10),
    ("42", 5),
    ("-42", 6),
    ("", 6),
    ("12345", 3),  # width < len
]
for s, w in test_strings:
    print(f"  {s!r:>8} (w={w:2}):")
    if len(s) > w:
        print(f"    (width < len，所有方法都原样返回)")
        continue
    print(f"    ljust:   {s.ljust(w)!r}")
    print(f"    rjust:   {s.rjust(w)!r}")
    print(f"    center:  {s.center(w)!r}")
    print(f"    zfill:   {s.zfill(w)!r}")
    print(f"    f'{{:<{w}}}': '{s:<{w}}'")
    print(f"    f'{{:>{w}}}': '{s:>{w}}'")
    print(f"    f'{{:^{w}}}': '{s:^{w}}'")
```

运行结果：

```text
   'hello' (w=10):
    ljust:   'hello     '
    rjust:   '     hello'
    center:  '  hello   '
    zfill:   '00000hello'
    f'{:<10}': 'hello     '
    f'{:>10}': '     hello'
    f'{:^10}': '  hello   '
      '42' (w= 5):
    ljust:   '42   '
    rjust:   '   42'
    center:  ' 42  '
    zfill:   '00042'
    f'{:<5}': '42   '
    f'{:>5}': '   42'
    f'{:^5}': ' 42  '
     '-42' (w= 6):
    ljust:   '-42   '
    rjust:   '   -42'
    center:  ' -42  '
    zfill:   '-00042'
    f'{:<6}': '-42   '
    f'{:>6}': '   -42'
    f'{:^6}': ' -42  '
        '' (w= 6):
    ljust:   '      '
    rjust:   '      '
    center:  '      '
    zfill:   '000000'
    f'{:<6}': '      '
    f'{:>6}': '      '
    f'{:^6}': '      '
   '12345' (w= 3):
    (width < len，所有方法都原样返回)
```

#### 2.7.3 非字符串类型对齐

字符串方法（`ljust` / `rjust` / `center` / `zfill`）只能对字符串调用，数字需要先 `str()` 转换。f-string 则自动转换。

**示例**

```python
values = [42, 3.14, -100, 255, 0.5]
print("  方法（需先 str()）：")
for v in values:
    s = str(v)
    print(f"    {v!r:>8} -> str: {s.rjust(10)!r}")

print("\n  f-string（自动转换）：")
for v in values:
    print(f"    {v!r:>8} -> f-string: '{v:>10}'")
```

运行结果：

```text
  方法（需先 str()）：
         42 -> str: '        42'
       3.14 -> str: '      3.14'
       -100 -> str: '      -100'
        255 -> str: '       255'
        0.5 -> str: '       0.5'

  f-string（自动转换）：
         42 -> f-string: '        42'
       3.14 -> f-string: '      3.14'
       -100 -> f-string: '      -100'
        255 -> f-string: '       255'
        0.5 -> f-string: '       0.5'
```

#### 2.7.4 width < len 的行为

**示例**

```python
s = "hello world"
print(f"  原始: {s!r} (len={len(s)})")
print(f"  ljust(5):  {s.ljust(5)!r}  (原样返回)")
print(f"  rjust(5):  {s.rjust(5)!r}  (原样返回)")
print(f"  center(5): {s.center(5)!r}  (原样返回)")
print(f"  zfill(5):  {s.zfill(5)!r}  (原样返回)")
print(f"  f'{{s:<5}}':  '{s:<5}'  (原样返回)")
print("  规则：width < len 时，所有方法原样返回，不截断")
```

运行结果：

```text
  原始: 'hello world' (len=11)
  ljust(5):  'hello world'  (原样返回)
  rjust(5):  'hello world'  (原样返回)
  center(5): 'hello world'  (原样返回)
  zfill(5):  'hello world'  (原样返回)
  f'{s:<5}':  'hello world'  (原样返回)
  规则：width < len 时，所有方法原样返回，不截断
```

#### 2.7.5 空字符串行为

**示例**

```python
print(f"  ''.ljust(5)  = {''.ljust(5)!r}  (5 个空格)")
print(f"  ''.rjust(5)  = {''.rjust(5)!r}  (5 个空格)")
print(f"  ''.center(5) = {''.center(5)!r}  (5 个空格)")
print(f"  ''.zfill(5)  = {''.zfill(5)!r}  (5 个零)")
print(f"  f'{{:<5}}'    = '{'':<5}'  (5 个空格)")
print("  zfill 用 0 填充空串，其他方法用空格填充")
```

运行结果：

```text
  ''.ljust(5)  = '     '  (5 个空格)
  ''.rjust(5)  = '     '  (5 个空格)
  ''.center(5) = '     '  (5 个空格)
  ''.zfill(5)  = '00000'  (5 个零)
  f'{:<5}'    = '     '  (5 个空格)
  zfill 用 0 填充空串，其他方法用空格填充
```

#### 2.7.6 Unicode 宽度问题

Python 的 `len()` 按字符数计算，但某些 Unicode 字符（如中文、emoji）在终端中显示为两列宽。

**示例**

```python
unicode_strs = ["你好", "café", "αβγ", "🐍"]
for s in unicode_strs:
    print(f"  {s!r} (len={len(s)}): {s.ljust(8)!r}  (实际显示宽度可能不同)")
```

运行结果：

```text
  '你好' (len=2): '你好      '  (实际显示宽度可能不同)
  'café' (len=4): 'café    '  (实际显示宽度可能不同)
  'αβγ' (len=3): 'αβγ     '  (实际显示宽度可能不同)
  '🐍' (len=1): '🐍       '  (实际显示宽度可能不同)
```

**关键点说明**：

- `len("你好")` 返回 `2`（两个字符），但在终端中显示占 4 列
- `len("🐍")` 返回 `1`（一个字符），但在终端中显示占 2 列
- 所有对齐方法的 `width` 参数是字符数，不是显示宽度
- 如需按显示宽度对齐，需要使用 `wcwidth` 等第三方库

## 3. 最佳实践

### 3.1 表格列对齐

CLI 表格是最常见的对齐场景——名称左对齐，数字右对齐。

**推荐写法**

```python
data = [
    ("Alice", 95),
    ("Bob", 87),
    ("Charlie", 72),
    ("Diana", 100),
]
# 左对齐姓名，右对齐分数
print(f"  {'Name':<10} {'Score':>6}")
print(f"  {'-'*10} {'-'*6}")
for name, score in data:
    name_col = name.ljust(10)
    score_col = str(score).rjust(6)
    print(f"  {name_col} {score_col}")
```

运行结果：

```text
  Name       Score
  ---------- ------
  Alice         95
  Bob           87
  Charlie       72
  Diana        100
```

### 3.2 服务器监控表格

多列混合对齐——文本左对齐、数字右对齐、状态居中。

**推荐写法**

```python
headers = ["Server", "IP", "CPU%", "Memory%", "Status"]
rows = [
    ("web-01", "10.0.1.10", 23.5, 45.2, "RUNNING"),
    ("db-01", "10.0.2.10", 67.8, 82.1, "RUNNING"),
    ("db-02", "10.0.2.11", 91.2, 95.4, "WARNING"),
]

header_fmt = f"  {{:<10}} {{:<14}} {{:>6}} {{:>9}} {{:^10}}"
row_fmt = f"  {{:<10}} {{:<14}} {{:>6.1f}} {{:>9.1f}} {{:^10}}"

print(header_fmt.format(*headers))
print(f"  {'-'*10} {'-'*14} {'-'*6} {'-'*9} {'-'*10}")
for row in rows:
    print(row_fmt.format(*row))
```

运行结果：

```text
  Server     IP               CPU%   Memory%   Status
  ---------- -------------- ------ --------- ----------
  web-01     10.0.1.10        23.5      45.2  RUNNING
  db-01      10.0.2.10        67.8      82.1  RUNNING
  db-02      10.0.2.11        91.2      95.4  WARNING
```

### 3.3 数字补零的正确选择

**推荐写法**

```python
# 带符号的数字补零 -> 用 zfill()
print(f"  {'-50'.zfill(6)}")   # -00050
print(f"  {'+42'.zfill(6)}")   # +00042
```

**不推荐写法**

```python
# 不推荐：rjust 不处理符号
print(f"  {'-50'.rjust(6, '0')}")  # 00-50 <- 符号被推到中间，不符合预期
```

运行结果：

```text
  -00050
  +00042

  00-50
```

### 3.4 文本横幅

**推荐写法**

```python
messages = ["WELCOME", "SYSTEM STARTED", "DAILY REPORT"]
for msg in messages:
    # 方法一：center()
    banner = msg.center(40, "=")
    print(f"  {banner}")

print()
for msg in messages:
    # 方法二：f-string 等价写法
    print(f"  {msg:=^40}")
```

运行结果：

```text
  ================WELCOME=================
  =============SYSTEM STARTED=============
  =============DAILY REPORT=============

  ================WELCOME=================
  =============SYSTEM STARTED=============
  =============DAILY REPORT=============
```

### 3.5 进度条

**推荐写法**

```python
total = 20
for step in [1, 5, 10, 15, 20]:
    filled = step
    empty = total - filled
    bar = "#" * filled + "." * empty
    percent = step / total * 100
    print(f"  [{bar}] {percent:>5.1f}%")
```

运行结果：

```text
  [#...................]   5.0%
  [####...............]  25.0%
  [##########..........]  50.0%
  [###############.....]  75.0%
  [####################] 100.0%
```

### 3.6 日志格式化

**推荐写法**

```python
logs = [
    ("INFO", "2024-01-15 10:23:45", "Server started on port 8080"),
    ("WARNING", "2024-01-15 10:24:01", "High memory usage: 85.2%"),
    ("ERROR", "2024-01-15 10:24:30", "Connection timeout to database"),
]
for level, timestamp, message in logs:
    level_col = level.center(9)
    print(f"  {timestamp} | {level_col} | {message}")
```

运行结果：

```text
  2024-01-15 10:23:45 |   INFO   | Server started on port 8080
  2024-01-15 10:24:01 | WARNING  | High memory usage: 85.2%
  2024-01-15 10:24:30 |  ERROR   | Connection timeout to database
```

### 3.7 方法选择决策表

```text
  需求               推荐方法                   说明
  ----             --------               ----
  左对齐文本            s.ljust(w)             直观、链式调用
  右对齐文本            s.rjust(w)             直观、链式调用
  居中对齐文本           s.center(w)            直观、链式调用
  数字补零             s.zfill(w)             正确处理 +/- 符号
  带符号数字补零          s.zfill(w)             0 在符号后面
  格式化混合对齐          f-string < > ^         一次格式化多列
  浮点数对齐+精度         f-string >.2f          对齐和精度一步到位
  动态宽度             f-string 嵌套表达式         f'{s:<{w}}'
  CLI 表格输出         f-string 格式规范          多列混合对齐
  进度条              f-string ^ 对齐          居中显示百分比
```

## 4. 原理

### 4.1 ljust / rjust / center 的内部实现

三个对齐方法的内部逻辑可以用以下伪代码描述：

```text
函数 ljust(s, width, fillchar):
    if width <= len(s):
        return s                    # 不需要填充
    pad_count = width - len(s)
    return s + fillchar * pad_count   # 右侧拼接填充字符

函数 rjust(s, width, fillchar):
    if width <= len(s):
        return s
    pad_count = width - len(s)
    return fillchar * pad_count + s   # 左侧拼接填充字符

函数 center(s, width, fillchar):
    if width <= len(s):
        return s
    total_pad = width - len(s)
    left_pad = total_pad // 2
    right_pad = total_pad - left_pad    # 奇数时右侧多一个
    return fillchar * left_pad + s + fillchar * right_pad
```

核心要点：

1. 所有方法都先检查 `width <= len(s)`——如果是，直接返回原字符串，不填充也不截断
2. `ljust` 在右侧拼接、`rjust` 在左侧拼接、`center` 两侧拼接
3. `center` 的空位分配：`left_pad = total_pad // 2`，`right_pad = total_pad - left_pad`——当 `total_pad` 为奇数时，`right_pad` 比 `left_pad` 多 1
4. `fillchar` 通过 `*` 重复操作生成填充字符串，再与原字符串拼接

### 4.2 zfill 的符号处理逻辑

`zfill` 的内部逻辑比 `rjust(width, '0')` 多了一步符号检测：

```text
函数 zfill(s, width):
    if width <= len(s):
        return s

    # 检测首字符是否为符号
    if s 开头是 '+' 或 '-':
        sign = s[0]
        digits = s[1:]
        pad_count = width - len(s)
        return sign + '0' * pad_count + digits   # 在符号后面补零
    else:
        pad_count = width - len(s)
        return '0' * pad_count + s                # 在左侧补零
```

核心要点：

1. `zfill` 只检测首字符——如果以 `+` 或 `-` 开头，将符号提到最前面，在符号后补零
2. 无符号时，`zfill` 的行为与 `rjust(width, '0')` 完全相同
3. 有符号时，`zfill` 把零放在符号和数字之间——这符合数学格式约定（如 `-00042`）

### 4.3 f-string 格式规范的解析

f-string 的对齐操作符由 Python 的格式规范迷你语言（Format Specification Mini-Language）解析。当写 `f"{s:*<10}"` 时，解析过程如下：

```text
"s:*<10"
  |  |  |
  |  |  +-- width = 10
  |  +------- align = '<' (左对齐)
  +-------- fill = '*' (填充字符)

解析结果：在总宽度 10 内，左对齐 s，右侧用 * 填充
等价于：s.ljust(10, '*')
```

对于 `=` 操作符，处理逻辑与 `zfill` 类似：

```text
"-42:0=8"
  |  |  |
  |  |  +-- width = 8
  |  +----- align = '=' (符号后填充)
  +-------- fill = '0' (填充字符)

解析结果：在总宽度 8 内，符号后用 0 填充，使 -42 变为 -0000042
```

核心要点：

1. 格式规范的顺序是 `fill` → `align` → `width` → `.precision` → `type`
2. 不指定 `fill` 时默认用空格，不指定 `align` 时字符串默认 `<`、数字默认 `>`
3. `=` 操作符只对数字有效——字符串没有符号概念

### 4.4 不可变性与返回新字符串

Python 字符串是不可变对象。所有对齐填充方法——包括 `ljust`、`rjust`、`center`、`zfill` 和 f-string 格式化——都不会修改原字符串，而是创建并返回一个新的字符串对象。

**示例**

```python
original = "hello"
lj = original.ljust(10)
rj = original.rjust(10)
ct = original.center(11)
print(f"  原始:       {original!r}")
print(f"  ljust(10):  {lj!r}")
print(f"  rjust(10):  {rj!r}")
print(f"  center(11): {ct!r}")
print(f"  原始未被修改: {original == 'hello'}")
```

运行结果：

```text
  原始:       'hello'
  ljust(10):  'hello     '
  rjust(10):  '     hello'
  center(11): '  hello   '
  原始未被修改: True
```

这意味着：

```python
s = "hello"
s.ljust(10)  # 这行代码什么都没改变
print(s)      # 仍然是 "hello"

s = s.ljust(10)  # 必须用 s 接收返回值
print(s)         # 现在是 "hello     "
```

不可变性的好处是安全性——你不需要担心 `ljust` 会意外修改其他引用同一字符串的变量。缺点是每次操作都会创建新对象，但在实际开发中开销很小，CPython 对短字符串有驻留优化。

## 5. 总结

本文围绕"字符串对齐填充"展开，主要介绍了以下内容：

- `str.ljust(width, fillchar)` / `rjust(width, fillchar)` / `center(width, fillchar)`：三种基础对齐方法，分别实现左对齐、右对齐、居中对齐，`fillchar` 默认为空格、必须为单个字符
- `center()` 的奇偶分配规则：当空位数为奇数时，右侧多一个填充字符
- `fillchar` 的限制：必须是长度为 1 的字符串，否则触发 `TypeError`
- `str.zfill(width)`：零填充方法，核心特性是正确处理 `+` / `-` 符号前缀——在符号后面补零而非符号前面
- `zfill()` vs `rjust(width, '0')` 的区别：无符号时两者等价，有符号时 `zfill` 在符号后补零、`rjust` 在符号前补零
- f-string 格式规范对齐：`<` 左对齐、`>` 右对齐、`^` 居中对齐、`=` 符号后填充，语法为 `{:填充字符 对齐操作符 总宽度}`
- 填充字符放在对齐操作符前面：`f"{s:*<10}"` 用 `*` 填充，不是 `f"{s:<*10}"`
- `=` 操作符只对数字有效——在符号和数字之间填充，类似 `zfill()` 的行为
- f-string 对齐与字符串方法完全等价——底层调用同一套格式化逻辑，选择哪种取决于代码风格和场景
- 动态宽度：f-string 支持嵌套表达式 `f"{s:<{width}}"` 实现动态宽度
- 浮点数对齐与精度组合：f-string 可以一步完成对齐和精度设置，如 `f"{v:8.2f}"`
- 所有方法的 `width` 参数是字符数不是显示宽度——中文、emoji 等 Unicode 字符在终端中可能占两列，但 `len()` 按字符数计算
- `width < len(s)` 时所有方法原样返回，不截断
- 最佳实践：表格列对齐用 `ljust` + `rjust` 或 f-string `<` + `>`，带符号数字补零用 `zfill` 而非 `rjust(w, '0')`，进度条用 f-string 混合格式化，日志格式化用 `center` 居中对齐日志级别
- 方法选择决策表：根据需求选择——文本对齐用方法调用式，混合多列用 f-string，数字补零用 `zfill`，浮点数对齐+精度用 f-string `>.2f`
- 原理：`ljust`/`rjust`/`center` 通过字符重复 `*` 和字符串拼接实现填充，`center` 的奇偶分配源于整数除法 `// 2`，`zfill` 多一步符号检测，f-string 格式规范由 Format Specification Mini-Language 解析
