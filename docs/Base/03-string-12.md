---
group:
  title: 【03】字符串介绍
  order: 3
order: 12
title: 字符串变形与清洗方法
nav:
  title: Python基础
  order: 1
---

# 字符串变形与清洗方法

## 1. 介绍

### 1.1 什么是字符串变形与清洗方法

字符串变形与清洗方法是 Python `str` 类中用于"改变字符串外观"的一组内置方法。它们不改变字符串的内容语义，而是对字符串的字符进行去除、转换或对齐操作——去掉多余的空白、统一大小写、填充对齐到固定宽度。这些方法是数据清洗、格式化输出、用户输入处理中最常用的工具集。

```python
# 清洗：去除首尾空白
raw = "  Hello Python  "
print(raw.strip())  # Hello Python

# 变形：大小写转换
print("hello world".upper())    # HELLO WORLD
print("HELLO WORLD".title())    # Hello World

# 对齐：填充到固定宽度
print("42".zfill(5))            # 00042
print("Python".center(10, "*")) # **Python**
```

变形与清洗方法可以分成三大族：

| 族 | 方法 | 核心用途 | 典型场景 |
|----|------|---------|---------|
| 清洗族 | `strip`、`lstrip`、`rstrip` | 去除首尾指定字符 | 用户输入清洗、文件行处理 |
| 变形族 | `upper`、`lower`、`swapcase`、`capitalize`、`title`、`casefold` | 改变大小写形式 | 不区分大小写比较、格式标准化 |
| 对齐族 | `zfill`、`rjust`、`ljust`、`center` | 填充对齐到固定宽度 | 编号补零、表格输出、标题居中 |

### 1.2 最简示例

```python
# 清洗族：去掉用户输入的首尾空格
user_input = "   alice@example.com   "
print(user_input.strip())  # alice@example.com

# 变形族：统一邮箱为小写
email = "Alice@Example.COM"
print(email.lower())  # alice@example.com

# 对齐族：编号补零
for i in range(3):
    print(f"ORDER-{str(i).zfill(4)}")
# ORDER-0000
# ORDER-0001
# ORDER-0002
```

这三族方法覆盖了日常开发中最高频的字符串外观处理需求——"去掉多余的空白""统一大小写""对齐到固定宽度"。理解每种方法的行为细节和陷阱，能让你在数据清洗、格式化输出、用户输入处理等任务中写出简洁可靠的代码。

## 2. 核心内容

### 2.1 清洗族：`strip()` / `lstrip()` / `rstrip()`

#### 2.1.1 `strip()` 去除首尾空白

`strip()` 是最常用的字符串清洗方法。不带参数时，去除字符串首尾所有空白字符——包括空格、制表符 `\t`、换行符 `\n`、回车符 `\r` 等。

```python
# 去除首尾空格
text = "   Hello Python   "
print(f"'{text.strip()}'")
# 'Hello Python'

# 去除制表符和换行符
messy = "\t  \nHello World\n  \t"
print(f"'{messy.strip()}'")
# 'Hello World'

# 空字符串 strip 后仍然是空串
print(f"'{''.strip()}'")
# ''
```

`strip()` 去除的是**首尾两端**的空白，字符串中间的空白不受影响：

```python
text = "  Hello   World  "
print(f"'{text.strip()}'")
# 'Hello   World'  ← 中间空格保留
```

#### 2.1.2 `strip(chars)` 去除指定字符集合

`strip(chars)` 接收一个字符串参数——但注意，它去除的不是"子串"，而是"字符集合"。`strip` 会从字符串两端逐字符检查，只要当前字符出现在 `chars` 中就去除，直到遇到不在 `chars` 中的字符为止。

```python
# 去除首尾的 'x'
text = "xxxHello Pythonxxx"
print(text.strip("x"))
# Hello Python

# 去除首尾的斜杠
url = "https://www.example.com///"
print(url.strip("/"))
# https://www.example.com
```

`chars` 可以是多个字符的集合——`strip("abc")` 会去除首尾所有 `a`、`b`、`c` 字符，顺序不影响：

```python
text = "xyzzzHello xyz Python yzx"
print(text.strip("xyz"))
# Hello xyz Python
```

注意中间的 `xyz` 没有被去除——`strip` 只作用于两端。这是最容易误解的一点。

#### 2.1.3 `strip` 的"字符集合"陷阱

`strip("abc")` 不是去除子串 `"abc"`，而是去除首尾所有属于 `{a, b, c}` 的字符。这个区别在某些情况下会暴露出来：

```python
# 误解：以为 strip("abc") 是去子串
text = "abcHelloabcXYZabc"

# 如果是去子串，结果应该是 "HelloabcXYZ"
# 但实际是 "HelloabcXYZ"——因为 strip 从两端逐字符去除
print(text.strip("abc"))
# HelloabcXYZ
```

更明显的例子，展现"字符集合"而非"子串"的行为：

```python
text = "aabccHelloccbbaa"
# 左侧：去掉所有 a、b、c → 停在 'H'
# 右侧：去掉所有 a、b、c → 停在 'o'
# 中间的 cc 不受影响
print(text.strip("abc"))
# Hello
```

如果需要去除的是一个固定子串，应该用 `replace` 或正则表达式，而非 `strip`。

#### 2.1.4 `lstrip()` 和 `rstrip()` 单侧去除

`lstrip()` 只去除左侧（开头）的字符，`rstrip()` 只去除右侧（结尾）的字符。

```python
text = "   Hello Python   "

# 只去左侧
print(f"'{text.lstrip()}'")
# 'Hello Python   '

# 只去右侧
print(f"'{text.rstrip()}'")
# '   Hello Python'
```

**典型应用——去除行尾换行符**：读取文件时每行末尾通常带有 `\n` 或 `\r\n`，用 `rstrip()` 清除：

```python
lines = ["第一行\n', "第二行\r\n", "第三行\n']
for line in lines:
    clean_line = line.rstrip()
    print(f"'{clean_line}'")
# '第一行'
# '第二行'
# '第三行'
```

**指定字符的单侧去除**：

```python
# 去除左侧的 ./（文件路径前缀）
filename = ".../.../report.csv"
print(filename.lstrip("./"))
# report.csv

# 去除右侧的逗号（CSV 尾部空字段）
csv_line = "apple,banana,cherry,,,,"
print(csv_line.rstrip(","))
# apple,banana,cherry
```

#### 2.1.5 实际应用——CSV 数据清洗

```python
raw_csv = """  name , age , email
  Alice , 30 , alice@example.com
  Bob , 25 , bob@example.com  """

rows = raw_csv.strip().split("\n")
for row in rows:
    fields = [f.strip() for f in row.split(",")]
    print(fields)

# 输出:
# ['name', 'age', 'email']
# ['Alice', '30', 'alice@example.com']
# ['Bob', '25', 'bob@example.com']
```

每行先用 `strip()` 去除首尾空白，分割后再对每个字段 `strip()`，确保 CSV 数据干净整齐。

### 2.2 变形族：大小写转换方法

#### 2.2.1 `upper()` 全部转大写

`upper()` 将字符串中所有有大小写属性的字母转换为大写。数字、标点、中文等没有大小写属性的字符不受影响。

```python
print("hello world".upper())
# HELLO WORLD

print("Python 3.12!".upper())
# PYTHON 3.12!

print("你好 Hello".upper())
# 你好 HELLO
```

`upper()` 也能正确处理 Unicode 字符中的大小写对应：

```python
print("straße".upper())  # 德语 ß 的大写
# STRASSE
```

#### 2.2.2 `lower()` 全部转小写

`lower()` 将所有有大小写属性的字母转换为小写，与 `upper()` 对称。

```python
print("HELLO WORLD".lower())
# hello world

print("Python 3.12!".lower())
# python 3.12!
```

`lower()` 能处理带重音符号等 Unicode 字符的大小写转换：

```python
print("CAFÉ".lower())  # É (带锐音符的大写 E) → é
# café
```

#### 2.2.3 `swapcase()` 大小写互换

`swapcase()` 将大写字母转为小写，小写字母转为大写，其他字符不变。

```python
print("Hello World".swapcase())
# hELLO wORLD

print("PyTHON 3".swapcase())
# pYthon 3
```

连续两次 `swapcase` 会回到原文——这是一个可逆操作：

```python
text = "Hello Python"
assert text.swapcase().swapcase() == text
print("swapcase 两次还原:", text)
# swapcase 两次还原: Hello Python
```

#### 2.2.4 `capitalize()` 首字母大写

`capitalize()` 将字符串的第一个字符转大写，**其余所有字符转小写**。注意这一点——它不仅仅是首字母大写，还会把后面的字母全部变成小写。

```python
print("hello world".capitalize())
# Hello world

# 后面的字母也会被转为小写！
print("HELLO WORLD".capitalize())
# Hello world

# 如果第一个字符不是字母，不会触发大写
print("123abc".capitalize())
# 123abc

print(" hello".capitalize())
#  hello  ← 空格不是字母，不触发
```

`capitalize` 和 `upper + 手动处理` 的区别在于一次调用完成"首字母大写 + 其余小写"的操作。在只需要句子首字母大写的场景中很有用。

#### 2.2.5 `title()` 标题格式

`title()` 将字符串转换为"标题格式"——每个单词的首字母大写，其余字母小写。`title` 的"单词"定义是：非字母字符后的第一个字母。

```python
print("hello world".title())
# Hello World

print("python programming language".title())
# Python Programming Language

# 非字母字符后的首字母也会大写
print("hello-python-world".title())
# Hello-Python-World

print("hello_world".title())
# Hello_World

print("hello123world".title())
# Hello123World
```

**`title()` 的撇号陷阱**：`title()` 对含撇号（`'`）的字符串处理不符合预期——撇号后的字母也会被大写：

```python
print("it's a test".title())
# It'S A Test  ← 撇号后的 s 被大写了！

print("don't stop".title())
# Don'T Stop  ← 同样的问题
```

这是因为 `title` 将撇号视为"非字母字符"，其后的字母视为新单词的首字母。如果需要正确处理英文撇号，需要用正则或其他方式替代。

#### 2.2.6 大小写变换方法对比

```python
cases = [
    ("hello world", "原始小写"),
    ("HELLO WORLD", "原始大写"),
    ("Hello World", "原始标题"),
    ("hELLO wORLD", "反标题"),
]

print(f"{'原始':<16} {'upper':<16} {'lower':<16} {'swapcase':<16} {'capitalize':<16} {'title'}")
print("-" * 96)
for text, desc in cases:
    print(f"{text:<16} {text.upper():<16} {text.lower():<16} {text.swapcase():<16} {text.capitalize():<16} {text.title()}")
```

**运行结果**：

```text
原始             upper            lower            swapcase         capitalize       title
------------------------------------------------------------------------------------------------
hello world     HELLO WORLD      hello world      HELLO WORLD      Hello world      Hello World
HELLO WORLD     HELLO WORLD      hello world      hello world      Hello world      Hello World
Hello World     HELLO WORLD      hello world      hELLO wORLD      Hello world      Hello World
hELLO wORLD     HELLO WORLD      hello world      Hello World      Hello world      Hello World
```

可以看到，`capitalize` 和 `title` 的区别：`capitalize` 只大写第一个字母，`title` 大写每个单词的首字母。而 `upper` 和 `lower` 是全量转换，`swapcase` 是翻转。

### 2.3 `casefold()` — 比 lower() 更激进的折叠

#### 2.3.1 casefold 的基本行为

`casefold()` 是 Python 3.3 引入的方法，设计目标只有一个——**不区分大小写的字符串比较**。对于 ASCII 字符，`casefold` 和 `lower` 行为完全一致：

```python
text = "HELLO PYTHON"
print(f"lower():    {text.lower()}")
print(f"casefold(): {text.casefold()}")
# lower():    hello python
# casefold(): hello python
```

#### 2.3.2 casefold 和 lower 的核心差异：德语 ß

`casefold` 存在的意义在于处理某些 Unicode 字符的特殊大小写规则。最经典的例子是德语中的 ß（Eszett）——它没有大写形式，`lower()` 不会改变它，但 `casefold()` 会将它扩展为 `"ss"`：

```python
german_word = "STRAßE"  # 德语"街道"

print(german_word.lower())
# straße  ← ß 不变

print(german_word.casefold())
# strasse  ← ß → ss
```

这意味着，当需要和大写的 `"STRASSE"` 做不区分大小写比较时，`lower()` 做不到（`straße != strasse`），而 `casefold()` 可以（`strasse == strasse`）：

```python
word1 = "Straße"
word2 = "STRASSE"

# lower() 比较：失败
print(word1.lower() == word2.lower())
# False

# casefold() 比较：成功
print(word1.casefold() == word2.casefold())
# True
```

#### 2.3.3 casefold 的适用场景

`casefold` 适用于所有需要"不区分大小写比较"的场景——尤其是处理国际化文本、多语言数据时：

```python
# 不区分大小写的子串查找
def contains_ci(haystack, needle):
    """真正不区分大小写的子串查找（含 Unicode 特殊字符）"""
    return needle.casefold() in haystack.casefold()

text = "Münchener Straße"
target = "STRASSE"

# 用 lower：失败
print(target.lower() in text.lower())
# False

# 用 casefold：成功
print(contains_ci(text, target))
# True
```

**实用建议**：对于纯 ASCII 文本，`lower()` 足够；对于可能包含非 ASCII 字符（如德语、法语、土耳其语等）的文本，始终使用 `casefold()` 做不区分大小写比较。

#### 2.3.4 更多 Unicode casefold 示例

```python
specials = [
    ("STRASSE", "SS 大写"),
    ("Straße", "普通德语"),
    ("CAFÉ", "法语É"),
    ("İSTANBUL", "土耳其İ"),
]

for word, desc in specials:
    print(f"  {desc:<12} {word!r:<12} lower={word.lower()!r:<14} casefold={word.casefold()!r}")

# 输出:
#   SS 大写       'STRASSE'    lower='strasse'     casefold='strasse'
#   普通德语      'Straße'     lower='straße'      casefold='strasse'
#   法语É        'CAFÉ'       lower='café'        casefold='café'
#   土耳其İ      'İSTANBUL'   lower='i̇stanbul'    casefold='i̇stanbul'
```

德语 ß 是 `casefold` 与 `lower` 行为不同的最典型例子。可以看到 `"Straße".lower()` 得到 `"straße"`（仍含 ß），而 `"Straße".casefold()` 得到 `"strasse"`（ß 被展开为 ss），后者能够与 `"STRASSE"` 正确匹配。

```text
casefold vs lower 对比：

  场景                         lower()          casefold()
  ---------------------------------------------------------
  ASCII 字符                    ✓ 正确            ✓ 正确
  德语 ß → ss                   ✗ 不转换           ✓ 转为 ss
  不区分大小写比较 (ASCII)        ✓ 可用            ✓ 可用
  不区分大小写比较 (Unicode)     ✗ 可能失败         ✓ 推荐
```

### 2.4 对齐族：`zfill()` 零填充

#### 2.4.1 `zfill(width)` 基本用法

`zfill(width)` 在字符串左侧填充 `'0'` 直到达到指定宽度。如果字符串长度已达到或超过 `width`，原样返回不截断。

```python
print("'42'.zfill(5)")
# 输出: 00042

print("'7'.zfill(4)")
# 输出: 0007

# 宽度已够，不截断
print("'123456'.zfill(4)")
# 输出: 123456
```

#### 2.4.2 `zfill` 对符号字符的特殊处理

`zfill` 对正负号有特殊处理——`0` 填在符号之后而非之前。这是 `zfill` 与手动 `rjust('0')` 的关键区别：

```python
print("-42".zfill(6))
# -00042  ← 0 在负号之后

print("+42".zfill(6))
# +00042  ← 0 在正号之后

# 对比：rjust 不会识别符号
print("-42".rjust(6, '0'))
# 00-42  ← 0 填在最前面，符号被推到中间
```

这个特性使得 `zfill` 特别适合处理有符号数值的补零场景——数字的符号保持在前，数值部分被 `0` 填充。

#### 2.4.3 实际应用：编号补零与日期格式化

```python
# 订单编号补零
order_ids = [1, 23, 456, 7890]
for oid in order_ids:
    print(f"ORDER-{str(oid).zfill(6)}")
# ORDER-000001
# ORDER-000023
# ORDER-000456
# ORDER-007890

# 日期时间格式化
month = 3
day = 5
print(f"2024-{str(month).zfill(2)}-{str(day).zfill(2)}")
# 2024-03-05

# 文件名补零对齐
for i in range(5):
    print(f"data_{str(i).zfill(3)}.txt")
# data_000.txt
# data_001.txt
# data_002.txt
# data_003.txt
# data_004.txt
```

### 2.5 对齐族：`ljust()` / `rjust()` / `center()`

#### 2.5.1 `ljust(width, fillchar)` 左对齐

`ljust(width, fillchar)` 将字符串左对齐，右侧用 `fillchar` 填充到 `width` 宽度。`fillchar` 默认为空格，必须是单个字符。

```python
print(f"'{'hello'.ljust(10)}'")
# 'hello     '

print(f"'{'hello'.ljust(10, '.')}'")
# 'hello.....'

# 宽度已够，原样返回
print(f"'{'hello'.ljust(3)}'")
# 'hello'
```

#### 2.5.2 `rjust(width, fillchar)` 右对齐

`rjust(width, fillchar)` 将字符串右对齐，左侧用 `fillchar` 填充。

```python
print(f"'{'hello'.rjust(10)}'")
# '     hello'

print(f"'{'hello'.rjust(10, '.')}'")
# '.....hello'
```

#### 2.5.3 `center(width, fillchar)` 居中对齐

`center(width, fillchar)` 将字符串居中，两侧用 `fillchar` 填充。当左右不对称时，右侧多一个字符：

```python
print(f"'{'hello'.center(10)}'")
# '  hello   '

print(f"'{'hello'.center(10, '*')}'")
# '**hello***'

# 不对称时右侧多一个填充字符
print(f"'{'Hi'.center(5, '-')}'")
# '--Hi-'  ← 左2右1，右侧多一个
```

#### 2.5.4 三种对齐方法对比

```python
word = "Python"
width = 12
fill = "."

print(f"{'方法':<22} {'结果'}")
print("-" * 40)
print(f"{'ljust(12, .)':<22} '{word.ljust(width, fill)}'")
print(f"{'rjust(12, .)':<22} '{word.rjust(width, fill)}'")
print(f"{'center(12, .)':<22} '{word.center(width, fill)}'")
```

**运行结果**：

```text
方法                   结果
----------------------------------------
ljust(12, .)           'Python......'
rjust(12, .)           '......Python'
center(12, .)          '...Python...'
```

#### 2.5.5 实际应用——终端表格输出

对齐方法在终端表格输出中极为常用——`ljust` 对齐文本列，`rjust` 对齐数字列，`center` 对齐标题：

```python
# 商品价格表
print("=" * 50)
print(f"{'商品名称':<12} {'单价':>8} {'数量':>6} {'小计':>10}")
print("-" * 50)

items = [
    ("苹果", 5.5, 3),
    ("香蕉", 3.8, 6),
    ("西瓜", 25.0, 1),
    ("芒果", 12.9, 4),
]
total = 0
for name, price, qty in items:
    subtotal = price * qty
    total += subtotal
    print(f"{name:<12} {price:>8.1f} {qty:>6d} {subtotal:>10.1f}")

print("-" * 50)
print(f"{'合计':<12} {'':>8} {'':>6} {total:>10.1f}")
```

**运行结果**：

```text
==================================================
商品名称         单价     数量       小计
--------------------------------------------------
苹果               5.5      3       16.5
香蕉               3.8      6       22.8
西瓜              25.0      1       25.0
芒果              12.9      4       51.6
--------------------------------------------------
合计                                116.0
```

**居中标题**：

```python
print("=" * 40)
print(f"{'数据报表'.center(40, '=')}")
print("=" * 40)
print(f"{'生成时间: 2024-01-15'.center(40)}")
print("=" * 40)
```

**运行结果**：

```text
========================================
================数据报表================
========================================
           生成时间: 2024-01-15
========================================
```

### 2.6 综合实战

#### 2.6.1 文本清洗流水线

多个变形清洗方法链式组合，构成完整的清洗流水线：

```python
def clean_text(text):
    """清洗用户输入：去除首尾空白、合并连续空格"""
    text = text.strip()
    while "  " in text:
        text = text.replace("  ", " ")
    return text

raw = "  Hello   Python   World  \n  "
print(f"清洗前: '{raw}'")
print(f"清洗后: '{clean_text(raw)}'")
# 清洗前: '  Hello   Python   World
#   '
# 清洗后: 'Hello Python World'
```

#### 2.6.2 数据标准化工具

综合使用 `strip`、`casefold`、`isdigit` 等方法标准化用户数据：

```python
def standardize_email(raw_email):
    """标准化邮箱：去空白 + 转小写"""
    return raw_email.strip().casefold()

def standardize_phone(raw_phone):
    """标准化手机号：去空白 + 只保留数字"""
    phone = raw_phone.strip()
    return "".join(c for c in phone if c.isdigit())

def standardize_username(raw_name):
    """标准化用户名：去空白 + 转小写 + 去首尾特殊符号"""
    return raw_name.strip().lower().strip("._-")

test_data = [
    {"email": "  Alice@Example.COM ", "phone": " 138-1234-5678 ", "name": "  Alice_  "},
    {"email": "BOB@test.org", "phone": "021-8765 4321", "name": ".bob."},
    {"email": "  charlie@mail.net  ", "phone": "  186 9999 8888  ", "name": "_Charlie_"},
]

print("数据标准化结果：")
for row in test_data:
    e = standardize_email(row["email"])
    p = standardize_phone(row["phone"])
    n = standardize_username(row["name"])
    print(f"  邮箱: {e:<25} 手机: {p:<15} 用户名: {n}")

# 输出:
#   邮箱: alice@example.com      手机: 13812345678     用户名: alice
#   邮箱: bob@test.org           手机: 02187654321     用户名: bob
#   邮箱: charlie@mail.net       手机: 18699998888    用户名: charlie
```

#### 2.6.3 格式化报表生成器

综合使用 `zfill`、`ljust`、`rjust`、`center` 生成对齐的报表：

```python
def generate_price_table(data, title="商品价格表"):
    """用 zfill/ljust/rjust/center 生成对齐的价格表"""
    width = 44
    lines = []
    lines.append("=" * width)
    lines.append(title.center(width))
    lines.append("=" * width)
    lines.append(f"{'编号':<6} {'商品名称':<12} {'单价':>8} {'库存':>8}")
    lines.append("-" * width)

    total_value = 0
    for i, (name, price, stock) in enumerate(data, 1):
        id_str = str(i).zfill(3)               # 编号补零
        name_str = name.ljust(12)               # 名称左对齐
        price_str = f"¥{price:.2f}".rjust(8)     # 价格右对齐
        stock_str = str(stock).rjust(8)          # 库存右对齐
        lines.append(f"{id_str:<6} {name_str} {price_str} {stock_str}")
        total_value += price * stock

    lines.append("-" * width)
    lines.append(f"{'合计金额':<20} {'¥' + f'{total_value:.2f}':>20}")
    lines.append("=" * width)
    return "\n".join(lines)

products = [
    ("苹果", 5.50, 100),
    ("香蕉", 3.80, 200),
    ("西瓜", 25.00, 50),
    ("芒果", 12.90, 80),
    ("葡萄", 8.50, 120),
]
print(generate_price_table(products))
```

**运行结果**：

```text
============================================
                商品价格表
============================================
编号   商品名称          单价       库存
--------------------------------------------
001    苹果            ¥5.50      100
002    香蕉            ¥3.80      200
003    西瓜           ¥25.00       50
004    芒果           ¥12.90       80
005    葡萄            ¥8.50      120
--------------------------------------------
合计金额                       ¥8238.00
============================================
```

#### 2.6.4 链式变形

多个变形方法可以链式调用，实现复杂的变换流程：

```python
raw_title = "  python-STRING-methods: A COMPLETE Guide!  "

result = (
    raw_title
    .strip()          # "python-STRING-methods: A COMPLETE Guide!"
    .lower()          # "python-string-methods: a complete guide!"
    .title()          # "Python-String-Methods: A Complete Guide"
    .rstrip("!")     # "Python-String-Methods: A Complete Guide"
)
print(f"链式处理: '{result}'")
# 链式处理: 'Python-String-Methods: A Complete Guide'
```

#### 2.6.5 命名风格转换

利用 `capitalize`、`title`、`lower` 等方法实现驼峰命名和蛇形命名的互转：

```python
def snake_to_camel(snake_str):
    """snake_case → CamelCase"""
    parts = snake_str.split("_")
    return "".join(p.capitalize() for p in parts)

def camel_to_snake(camel_str):
    """CamelCase → snake_case"""
    result = []
    for ch in camel_str:
        if ch.isupper() and result:
            result.append("_")
        result.append(ch.lower())
    return "".join(result)

print(snake_to_camel("user_first_name"))     # UserFirstName
print(snake_to_camel("http_response_code"))  # HttpResponseCode
print(camel_to_snake("UserFirstName"))       # user_first_name
print(camel_to_snake("HttpResponseCode"))    # http_response_code
```

## 3. 最佳实践

### 3.1 选择正确的方法

| 需求 | 推荐方法 | 原因 |
|------|---------|------|
| 去除首尾空白 | `strip()` | 一行搞定，默认处理所有空白字符 |
| 只去左侧空白 | `lstrip()` | 不影响右侧内容 |
| 只去右侧换行 | `rstrip()` | 读文件行处理的标准做法 |
| 去除首尾指定字符 | `strip(chars)` | 字符集合方式，一次去除多种字符 |
| 全部转大写 | `upper()` | 简单直接 |
| 全部转小写 | `lower()` | ASCII 场景足够 |
| 不区分大小写比较 | `casefold()` | 处理 Unicode 比 lower 更激进 |
| 首字母大写 | `capitalize()` | 首字母大写 + 其余小写 |
| 标题格式 | `title()` | 每个单词首字母大写 |
| 编号补零 | `zfill()` | 自动处理符号字符 |
| 文本左对齐 | `ljust(width, char)` | 右侧填充 |
| 数字右对齐 | `rjust(width, char)` | 左侧填充 |
| 标题居中 | `center(width, char)` | 两侧填充 |

### 3.2 推荐 vs 不推荐写法

```python
# ---- 去除首尾空白 ----

# 推荐：strip() 一步到位
clean = user_input.strip()

# 不推荐：手动循环去除
while user_input.startswith(" ") or user_input.startswith("\t"):
    user_input = user_input[1:]
while user_input.endswith(" ") or user_input.endswith("\n"):
    user_input = user_input[:-1]

# ---- 不区分大小写比较 ----

# 推荐：casefold() 处理 Unicode
if word1.casefold() == word2.casefold():
    print("匹配")

# 不推荐：lower() 可能遗漏 Unicode 特殊字符（如德语 ß）
if word1.lower() == word2.lower():
    print("可能不匹配")

# ---- 去除首尾指定字符 ----

# 推荐：strip(chars) 简洁
url = "https://example.com///"
clean_url = url.strip("/")

# 不推荐：手动判断
if url.endswith("/"):
    url = url.rstrip("/")
if url.startswith("/"):
    url = url.lstrip("/")

# ---- 编号补零 ----

# 推荐：zfill() 自动处理符号
order_id = "-42".zfill(6)  # -00042

# 不推荐：rjust 不识别符号
order_id = "-42".rjust(6, "0")  # 00-42（错误！）

# ---- capitalize vs title ----

# 推荐：capitalize 用于句子首字母大写
sentence = "hello world".capitalize()  # Hello world

# 推荐：title 用于标题格式
title = "python guide".title()  # Python Guide

# 不推荐：用 title 做句子首字母大写
sentence = "hello world".title()  # Hello World（多了一个大写）
```

### 3.3 综合推荐 vs 不推荐对照表

| 场景 | 推荐写法 | 不推荐写法 | 原因 |
|------|---------|-----------|------|
| 去空白 | `s.strip()` | 手动循环去除 | `strip` 一步到位 |
| 去换行 | `line.rstrip()` | `line[:-1]` | `rstrip` 安全处理 `\r\n` |
| 去字符集 | `s.strip("abc")` | `s.strip("a").strip("b").strip("c")` | `strip` 接受字符集合 |
| 大小写比较 | `s1.casefold() == s2.casefold()` | `s1.lower() == s2.lower()` | `casefold` 处理 Unicode |
| 编号补零 | `str(n).zfill(4)` | `str(n).rjust(4, "0")` | `zfill` 处理负号 |
| 表格对齐 | `f"{'名称':<10} {price:>8}"` | 手动拼接空格 | 格式化字符串内置对齐 |
| 邮箱标准化 | `email.strip().casefold()` | `email.strip().lower()` | `casefold` 更安全 |

### 3.4 常见错误与注意事项

**误解 `strip` 是去子串**

```python
# 错误理解：以为 strip("abc") 去除子串 "abc"
text = "abcHelloabc"
print(text.strip("abc"))  # 实际输出: Hello（不是 abcHello 的去子串结果）

# 如果需要去除子串，用 replace 或正则
print(text.replace("abc", ""))  # Hello
```

**`capitalize` 会把后面字母全变小写**

```python
# 注意：capitalize 不仅仅是首字母大写
print("HELLO WORLD".capitalize())
# Hello world ← 后面的字母全变小写了

# 如果只想首字母大写、其他不变，需要手动处理
s = "HELLO WORLD"
result = s[0].upper() + s[1:]  # HELLO WORLD（本身第一个已是大写）
```

**`title` 对撇号处理不符合预期**

```python
print("it's a test".title())
# It'S A Test  ← 撇号后 s 被大写

# 正确处理英文撇号需要正则
import re
def smart_title(s):
    return re.sub(
        r"[A-Za-z]+(?:'[A-Za-z]+)?",
        lambda m: m.group().capitalize(),
        s
    )
print(smart_title("it's a test"))
# It's A Test
```

**`zfill` 与 `rjust` 对负号的处理差异**

```python
# zfill 正确处理符号
print("-42".zfill(6))  # -00042

# rjust 不识别符号，0 填到符号前面
print("-42".rjust(6, "0"))  # 00-42
```

## 4. 原理

### 4.1 字符串不可变性与变形方法

Python 字符串是不可变对象（immutable）。所有变形与清洗方法——`strip`、`upper`、`lower`、`zfill` 等——都不会修改原字符串，而是返回一个**新的字符串对象**。

```python
text = "hello"
new_text = text.upper()

print(text is new_text)     # False（不同对象）
print(text)                  # hello（原字符串不变）
print(new_text)              # HELLO
```

这意味着链式调用每次都会创建中间字符串对象。在大量数据处理时需要注意性能：

```python
# 链式调用：每一步都创建新对象
result = (
    raw_text
    .strip()      # 新对象
    .lower()      # 新对象
    .title()      # 新对象
)
# 3 次方法调用 → 3 次内存分配
```

对于小字符串，开销可忽略。处理大文本时，如果性能敏感，可以考虑用 `str.translate` 或正则表达式一次性完成多个变换。

### 4.2 `strip` 的字符匹配机制

`strip(chars)` 的底层实现是从字符串两端逐字符扫描，对每个字符检查其是否在 `chars` 集合中。一旦遇到不在集合中的字符，立即停止该方向的扫描。

```text
strip("abc") 处理 "aabccHelloccbbaa" 的过程：

  左侧扫描:  a (在集合中) → 去除
            a (在集合中) → 去除
            b (在集合中) → 去除
            c (在集合中) → 去除
            c (在集合中) → 去除
            H (不在集合中) → 停止左侧扫描

  右侧扫描:  a (在集合中) → 去除
            a (在集合中) → 去除
            b (在集合中) → 去除
            b (在集合中) → 去除
            c (在集合中) → 去除
            c (在集合中) → 去除
            o (不在集合中) → 停止右侧扫描

  结果: "Hello"
```

这就解释了为什么 `strip` 是"字符集合"操作而非"子串"操作——它逐个字符判断，而非寻找匹配的子串。`chars` 参数在底层会被转换为集合或查找表，以实现 O(1) 的字符查找。

### 4.3 `casefold` 与 `lower` 的 Unicode 差异

`lower()` 和 `casefold()` 在底层都依赖 Unicode 字符数据库中的大小写映射表。区别在于映射表的策略不同：

- `lower()` 使用 Unicode 的"简单大小写映射"——一对一的字符替换
- `casefold()` 使用 Unicode 的"大小写折叠"映射——可以是一对多的扩展

```text
字符 ß (U+00DF, 德语 Eszett) 的映射：

  lower() 映射:
    ß → ß  (无变化，因为 ß 已经是"小写形式")

  casefold() 映射:
    ß → ss  (展开为两个字符，因为 ß 的大写形式是 SS)
```

这种"折叠"设计是为了让不区分大小写比较更加可靠。Unicode 标准定义了一套完整的 casefold 规则，覆盖了德语 ß、希腊字母、土耳其字母等所有特殊情况。

### 4.4 `zfill` 的符号处理原理

`zfill` 在填充 `0` 之前会检查字符串的第一个字符是否为 `+` 或 `-`：

```python
# 简化的底层逻辑
def zfill(self, width):
    if len(self) >= width:
        return self

    fill_count = width - len(self)
    # 检查第一个字符是否为符号
    if self[0] in ('+', '-'):
        return self[0] + '0' * fill_count + self[1:]
    else:
        return '0' * fill_count + self
```

这就是为什么 `"-42".zfill(6)` 返回 `"-00042"` 而非 `"00-42"`——符号字符被保留在最前面，`0` 填在符号和数字之间。而 `rjust` 没有这个逻辑，直接在左侧填充，所以 `"-42".rjust(6, "0")` 返回 `"00-42"`。

## 5. 总结

本文围绕 Python 字符串的变形与清洗方法展开，主要介绍了以下内容：

- **清洗族方法**：`strip()` 去除首尾空白或指定字符集合（注意不是去子串）；`lstrip()` / `rstrip()` 分别只处理左侧和右侧；`strip(chars)` 的核心是"字符集合"而非"子串"匹配
- **大小写变换方法**：`upper()` / `lower()` 全量转换大写/小写；`swapcase()` 大小写互换；`capitalize()` 首字母大写且其余全小写；`title()` 每个单词首字母大写（撇号后有陷阱）
- **casefold()**：比 `lower()` 更激进的大小写折叠，能处理德语 ß → ss 等 Unicode 特殊字符；做不区分大小写比较时应优先使用 `casefold()`
- **对齐填充方法**：`zfill(width)` 左侧补零且自动处理正负号；`ljust()` / `rjust()` / `center()` 分别实现左对齐、右对齐、居中对齐，支持自定义填充字符
- **最佳实践**：去空白用 `strip`，去换行用 `rstrip`，不区分大小写比较用 `casefold`，编号补零用 `zfill`，表格对齐用 `ljust` / `rjust` / `center`
- **底层原理**：字符串不可变，所有变形方法返回新对象；`strip` 逐字符匹配字符集合；`casefold` 使用 Unicode 大小写折叠映射（可一对多展开）；`zfill` 对符号字符有特殊处理逻辑
