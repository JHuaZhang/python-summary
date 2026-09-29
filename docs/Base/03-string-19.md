---
group:
  title: 【03】字符串介绍
  order: 3
order: 19
title: 大小写转换方法
nav:
  title: Python基础
  order: 1
---

# 大小写转换方法

## 1. 介绍

### 1.1 知识点定义

大小写转换是字符串处理中最基础、最常用的操作之一。Python 提供了六个内置方法用于大小写转换：

| 方法 | 作用 | 返回值 |
|------|------|--------|
| `str.upper()` | 全部字母转大写 | 新字符串 |
| `str.lower()` | 全部字母转小写 | 新字符串 |
| `str.capitalize()` | 首字母大写，其余全小写 | 新字符串 |
| `str.title()` | 每个单词首字母大写，其余小写 | 新字符串 |
| `str.swapcase()` | 大写变小写，小写变大写 | 新字符串 |
| `str.casefold()` | 激进小写（用于大小写不敏感比较） | 新字符串 |

这些方法在实际开发中无处不在——用户名规范化、邮箱地址统一格式、大小写不敏感搜索、URL slug 生成、标题格式化等场景都依赖它们。

### 1.2 最简示例

先用最简单的代码直观感受这六个方法：

```python
s = "hello WORLD"

print(s.upper())        # HELLO WORLD
print(s.lower())        # hello world
print(s.capitalize())   # Hello world
print(s.title())        # Hello World
print(s.swapcase())     # HELLO world
print(s.casefold())     # hello world
```

运行结果：

```text
HELLO WORLD
hello world
Hello world
Hello World
HELLO world
hello world
```

### 1.3 在字符串方法体系中的位置

大小写转换方法属于"字符串修改"类操作的子集。从功能维度来看：

```text
字符串方法体系
├── 查找类：find / rfind / index / count / in
├── 判断类：isalpha / isdigit / isupper / islower / istitle ...
├── 拆分与连接类：split / rsplit / partition / join
├── 替换类：replace / translate / maketrans
├── 大小写转换类（本篇）：
│   ├── upper / lower           ← 基础大小写转换
│   ├── capitalize / title      ← 格式化大小写转换
│   ├── swapcase                ← 大小写互换
│   └── casefold                ← 激进小写（比较专用）
├── 对齐填充类：ljust / rjust / center / zfill
└── 清洗类：strip / lstrip / rstrip / removeprefix / removesuffix
```

大小写转换方法的核心特点：

- **不修改原字符串**——Python 字符串是不可变对象，所有方法都返回新字符串
- **只影响字母字符**——数字、标点、中文等非字母字符保持不变
- **对 Unicode 有效**——不仅处理 ASCII 字母，还处理德语、希腊语等 Unicode 字母
- **无需导入**——都是 `str` 的内置方法，无需 `import` 任何模块

## 2. 核心内容

### 2.1 str.upper() 与 str.lower()

#### 2.1.1 方法签名

```python
str.upper() -> str
str.lower() -> str
```

`upper()` 和 `lower()` 不接收任何参数，分别将字符串中的所有小写字母转为大写、所有大写字母转为小写。

#### 2.1.2 基本用法

**示例**

```python
print("=== upper() ===")
cases = [
    "hello world",       # 全小写
    "Hello World",       # 混合大小写
    "HELLO WORLD",       # 全大写 -> 不变
    "hello123",          # 小写 + 数字
    "café",              # 含重音字母
    "Straße",            # 德语 ß -> SS
    "你好",              # 中文（无大小写概念）
    "",                  # 空字符串
    "123!@#",           # 无字母
]
for s in cases:
    print(f"  {s!r:>15}.upper() = {s.upper()!r}")

print("\n=== lower() ===")
cases = [
    "HELLO WORLD",
    "Hello World",
    "hello world",
    "HELLO123",
    "CAFÉ",             # 含重音大写
    "STRAẞE",           # 德语大写 ß (ẞ) -> ß
    "你好",
    "",
    "123!@#",
]
for s in cases:
    print(f"  {s!r:>15}.lower() = {s.lower()!r}")
```

运行结果：

```text
=== upper() ===
    'hello world'.upper() = 'HELLO WORLD'
    'Hello World'.upper() = 'HELLO WORLD'
    'HELLO WORLD'.upper() = 'HELLO WORLD'
       'hello123'.upper() = 'HELLO123'
           'café'.upper() = 'CAFÉ'
         'Straße'.upper() = 'STRASSE'
             '你好'.upper() = '你好'
               ''.upper() = ''
         '123!@#'.upper() = '123!@#'

=== lower() ===
    'HELLO WORLD'.lower() = 'hello world'
    'Hello World'.lower() = 'hello world'
    'hello world'.lower() = 'hello world'
       'HELLO123'.lower() = 'hello123'
           'CAFÉ'.lower() = 'café'
         'STRAẞE'.lower() = 'straße'
             '你好'.lower() = '你好'
               ''.lower() = ''
         '123!@#'.lower() = '123!@#'
```

**关键点说明**：

- 已经是目标大小写的字母不会变化——`"HELLO".upper()` 返回 `"HELLO"`
- 数字、标点、中文等非字母字符不受影响
- 空字符串返回空字符串
- 德语 `ß` 的 `upper()` 结果是 `"SS"`（两个字符），因为德语没有大写 ß 的传统形式（Unicode 中虽然存在大写 ẞ 即 U+1E9E，但 `upper()` 仍然使用经典的 SS 转换）

#### 2.1.3 不可变性验证

`upper()` 和 `lower()` 返回新字符串，原字符串不会被修改。

**示例**

```python
original = "Hello World"
upper_result = original.upper()
lower_result = original.lower()
print(f"  原始:   {original!r}")
print(f"  upper(): {upper_result!r}")
print(f"  lower(): {lower_result!r}")
print(f"  原始未被修改: {original == 'Hello World'}")
```

运行结果：

```text
  原始:   'Hello World'
  upper(): 'HELLO WORLD'
  lower(): 'hello world'
  原始未被修改: True
```

#### 2.1.4 大小写不敏感比较

`lower()` 最常见的用途是实现大小写不敏感比较。

**示例**

```python
user_input = "ALICE@EXAMPLE.COM"
expected = "alice@example.com"
if user_input.lower() == expected.lower():
    print(f"  '{user_input}' 匹配 '{expected}'（不区分大小写）")
else:
    print(f"  不匹配")
```

运行结果：

```text
  'ALICE@EXAMPLE.COM' 匹配 'alice@example.com'（不区分大小写）
```

> **注意**：对于支持多语言（尤其是德语）的场景，应使用 `casefold()` 而非 `lower()` 进行比较。2.3 节将详细说明。

#### 2.1.5 Unicode 特殊转换

`upper()` 和 `lower()` 不仅能处理 ASCII 字母，还能正确处理 Unicode 字母的重音符号德语特殊字母、希腊字母等。

**示例**

```python
# 德语 ß 的大写是 SS（两个字符）
print(f"  'Straße'.upper() = {'Straße'.upper()!r}")
# 大写 ẞ (U+1E9E) 的小写是 ß
print(f"  'STRASSE'.lower() = {'STRASSE'.lower()!r}")
print(f"  'STRAẞE'.lower() = {'STRAẞE'.lower()!r}")

# 重音字母
print(f"  'café'.upper() = {'café'.upper()!r}")
print(f"  'CAFÉ'.lower() = {'CAFÉ'.lower()!r}")

# 希腊字母
print(f"  'αβγ'.upper() = {'αβγ'.upper()!r}")
print(f"  'ΑΒΓ'.lower() = {'ΑΒΓ'.lower()!r}")
```

运行结果：

```text
  'Straße'.upper() = 'STRASSE'
  'STRASSE'.lower() = 'strasse'
  'STRAẞE'.lower() = 'straße'
  'café'.upper() = 'CAFÉ'
  'CAFÉ'.lower() = 'café'
  'αβγ'.upper() = 'ΑΒΓ'
  'ΑΒΓ'.lower() = 'αβγ'
```

**关键点说明**：

- `Straße` 的 `upper()` 结果是 `STRASSE`——德语 `ß` 的大写形式为 `SS`（两个字符）。这意味着一个字符可以转换成两个字符，转换前后的字符串长度可能不同
- `STRAẞE`（含大写 ẞ）的 `lower()` 结果是 `straße`——大写 ẞ 的小写为 ß
- 中文 `你好` 的 `upper()` / `lower()` 结果不变——中文没有大小写概念，非字母字符不受影响

### 2.2 str.capitalize() 与 str.title() 与 str.swapcase()

#### 2.2.1 方法签名

```python
str.capitalize() -> str
str.title()      -> str
str.swapcase()   -> str
```

- `capitalize()`：将字符串的首字母大写，其余字母全部小写
- `title()`：将字符串中每个"单词"的首字母大写，其余小写。单词以**非字母字符**作为分隔
- `swapcase()`：将大写字母转为小写，小写字母转为大写（互换）

#### 2.2.2 capitalize() 基本用法

**示例**

```python
print("=== capitalize() ===")
cases = [
    "hello world",       # -> Hello world
    "HELLO WORLD",       # -> Hello world（其余强制小写）
    "hELLO wORLD",      # -> Hello world
    "hello",             # -> Hello
    "123abc",            # -> 123abc（首字符是数字，不变）
    "  hello",           # ->   hello（首字符是空格，不变）
    "",                  # -> ""
]
for s in cases:
    print(f"  {s!r:>15}.capitalize() = {s.capitalize()!r}")
```

运行结果：

```text
=== capitalize() ===
    'hello world'.capitalize() = 'Hello world'
    'HELLO WORLD'.capitalize() = 'Hello world'
    'hELLO wORLD'.capitalize() = 'Hello world'
          'hello'.capitalize() = 'Hello'
         '123abc'.capitalize() = '123abc'
        '  hello'.capitalize() = '  hello'
               ''.capitalize() = ''
```

**关键点说明**：

- `capitalize()` 只处理字符串的**第一个字符**——如果首字符是字母就大写，其余所有字母强制小写
- 如果首字符不是字母（如数字、空格），则首字符不变，但从第二个字符开始仍然会被强制小写
- `"hELLO wORLD".capitalize()` 的结果是 `"Hello world"`——注意 `wORLD` 被强制变为 `world`

#### 2.2.3 title() 基本用法

**示例**

```python
print("\n=== title() ===")
cases = [
    "hello world",       # -> Hello World
    "HELLO WORLD",       # -> Hello World
    "hello, world!",     # -> Hello, World!
    "the quick brown fox",# -> The Quick Brown Fox
    "hello-world",       # -> Hello-World（连字符也分词）
    "hello_world",       # -> Hello_World（下划线也分词）
    "don't stop",        # -> Don'T Stop（注意撇号！）
    "item1 item2",       # -> Item1 Item2
    "",                  # -> ""
]
for s in cases:
    print(f"  {s!r:>20}.title() = {s.title()!r}")
```

运行结果：

```text
=== title() ===
         'hello world'.title() = 'Hello World'
         'HELLO WORLD'.title() = 'Hello World'
       'hello, world!'.title() = 'Hello, World!'
  'the quick brown fox'.title() = 'The Quick Brown Fox'
         'hello-world'.title() = 'Hello-World'
         'hello_world'.title() = 'Hello_World'
          "don't stop".title() = "Don'T Stop"
         'item1 item2'.title() = 'Item1 Item2'
                    ''.title() = ''
```

**关键点说明**：

- `title()` 以"非字母"字符作为单词分隔符——空格、逗号、连字符 `-`、下划线 `_`、撇号 `'` 都会被视为单词边界
- `"don't stop".title()` 的结果是 `"Don'T Stop"`——撇号 `'` 被视为单词边界，导致 `t` 被大写为 `T`。这是 `title()` 最常见的坑

#### 2.2.4 title() 的撇号问题

`title()` 将撇号 `'` 视为单词边界，导致英文缩写词（如 `don't`、`it's`、`can't`）中的字母被错误大写。

**示例**

```python
print("\n=== title() 撇号问题 ===")
phrases = [
    "don't",
    "it's",
    "can't",
    "o'clock",
    "they're",
]
for p in phrases:
    print(f"  {p!r:>10}.title() = {p.title()!r}")
```

运行结果：

```text
=== title() 撇号问题 ===
     "don't".title() = "Don'T"
      "it's".title() = "It'S"
     "can't".title() = "Can'T"
   "o'clock".title() = "O'Clock"
   "they're".title() = "They'Re"
```

**解决方案**：使用 `string.capwords()` 替代 `title()`。

#### 2.2.5 string.capwords() 替代方案

`string.capwords(s)` 的实现逻辑是先用 `split()` 分割（只按空格分词），再对每个单词做 `capitalize()`，最后用 `join()` 拼接。`capwords()` 只以空格作为分隔符，不会因撇号或连字符而错误分词。

**示例**

```python
import string

print("\n=== string.capwords() ===")
phrases = [
    "don't stop",
    "it's a test",
    "can't don't won't",
]
for p in phrases:
    title_result = p.title()
    capwords_result = string.capwords(p)
    print(f"  {p!r:>20}")
    print(f"    title():    {title_result!r}")
    print(f"    capwords(): {capwords_result!r}")
```

运行结果：

```text
=== string.capwords() ===
          "don't stop"
    title():    "Don'T Stop"
    capwords(): "Don't Stop"
         "it's a test"
    title():    "It'S A Test"
    capwords(): "It's A Test"
   "can't don't won't"
    title():    "Can'T Don'T Won'T"
    capwords(): "Can't Don't Won't"
```

`capwords()` 的分词规则是固定的 `split()`（按空格分割），所以对于需要按其他分隔符处理的场景，`capwords()` 可能不完全适用——但它正确处理了撇号问题。

#### 2.2.6 swapcase() 基本用法

**示例**

```python
print("\n=== swapcase() ===")
cases = [
    "Hello World",       # -> hELLO wORLD
    "hello world",       # -> HELLO WORLD
    "HELLO WORLD",       # -> hello world
    "HeLLo WoRLD",      # -> hEllO wOrld
    "Hello123World",    # -> hELLO123wORLD
    "café",              # -> CAFÉ
    "αβΓ",               # -> ΑΒγ
    "",                  # -> ""
]
for s in cases:
    print(f"  {s!r:>15}.swapcase() = {s.swapcase()!r}")
```

运行结果：

```text
=== swapcase() ===
    'Hello World'.swapcase() = 'hELLO wORLD'
    'hello world'.swapcase() = 'HELLO WORLD'
    'HELLO WORLD'.swapcase() = 'hello world'
    'HeLLo WoRLD'.swapcase() = 'hEllO wOrld'
  'Hello123World'.swapcase() = 'hELLO123wORLD'
           'café'.swapcase() = 'CAFÉ'
            'αβΓ'.swapcase() = 'ΑΒγ'
               ''.swapcase() = ''
```

**关键点说明**：

- `swapcase()` 对每个字符逐个处理——大写变小写，小写变大写，非字母不变
- `swapcase()` 两次操作不一定还原原字符串——`"Straße".swapcase().swapcase()` 的结果是 `"Strasse"` 而非 `"Straße"`，因为 `ß` 的大写是 `SS`，而 `SS` 的小写是 `ss`，无法还原

#### 2.2.7 swapcase 不是对合操作

"对合操作"指 `f(f(x)) == x`。`swapcase` 对纯 ASCII 字母是对合的，但对 Unicode 字符不一定。

**示例**

```python
test = [
    ("Hello",   True),    # 纯 ASCII，可还原
    ("HELLO",   True),
    ("Straße",  False),   # ß -> SS -> ss（不还原）
    ("café",    True),    # 重音字母可还原
]
for s, reversible in test:
    double = s.swapcase().swapcase()
    same = double == s
    print(f"  {s!r:>10}.swapcase().swapcase() = {double!r}, 还原={same}")
```

运行结果：

```text
     'Hello'.swapcase().swapcase() = 'Hello', 还原=True
     'HELLO'.swapcase().swapcase() = 'HELLO', 还原=True
    'Straße'.swapcase().swapcase() = 'Strasse', 还原=False
      'café'.swapcase().swapcase() = 'café', 还原=True
```

**原因分析**：

- `Straße` -> `swapcase` -> `sTRASSE` -> `swapcase` -> `Strasse`
- 因为 `ß` 的 `swapcase` 是 `SS`（两个字符），而 `SS` 的 `swapcase` 分别是 `ss`（小写），无法合并回 `ß`

### 2.3 str.casefold()

#### 2.3.1 方法签名

```python
str.casefold() -> str
```

`casefold()` 是 Python 3 新增的方法，专为"大小写不敏感比较"设计。它比 `lower()` 更激进——将所有大写字符转换为小写形式，包括一些 `lower()` 不处理的特殊 Unicode 字符。

#### 2.3.2 casefold() vs lower() 的核心区别

**示例**

```python
print("=== casefold() vs lower() ===")
cases = [
    # (描述, 字符串, lower 结果, casefold 结果)
    ("普通 ASCII",  "HELLO",     "hello",  "hello"),
    ("德语 ß",      "Straße",    "straße", "strasse"),
    ("德语大写 ß",  "STRAẞE",    "straße", "strasse"),
    ("重音字母",    "CAFÉ",      "café",   "café"),
    ("希腊大写",    "ΑΒΓ",       "αβγ",    "αβγ"),
]

print(f"  {'描述':>12} | {'lower()':>12} | {'casefold()':>12} | 相同?")
print(f"  {'-'*12}-+-{'-'*12}-+-{'-'*12}-+------")
for desc, s, low, cf in cases:
    same = "是" if s.lower() == s.casefold() else "否"
    print(f"  {desc:>12} | {s.lower()!r:>12} | {s.casefold()!r:>12} | {same}")

print("\n  关键差异：德语 ß 的 lower() -> ß, casefold() -> ss")
print("  这使得 'Straße' 和 'STRASSE' 的 casefold 比较为 True")
```

运行结果：

```text
=== casefold() vs lower() ===
            描述 |      lower() |   casefold() | 相同?
  -------------+--------------+--------------+------
      普通 ASCII |      'hello' |      'hello' | 是
          德语 ß |     'straße' |    'strasse' | 否
        德语大写 ß |     'straße' |    'strasse' | 否
          重音字母 |       'café' |       'café' | 是
          希腊大写 |        'αβγ' |        'αβγ' | 是

  关键差异：德语 ß 的 lower() -> ß, casefold() -> ss
  这使得 'Straße' 和 'STRASSE' 的 casefold 比较为 True
```

**关键点说明**：

- 对于 ASCII 和多数 Unicode 字符，`casefold()` 和 `lower()` 的结果相同
- 核心差异在于德语 `ß`：`lower()` 转为 `ß`（保持不变），`casefold()` 转为 `ss`（两个字符）
- 这导致 `"Straße".lower()` 不等于 `"STRASSE".lower()`，但 `"Straße".casefold()` 等于 `"STRASSE".casefold()`
- `casefold()` 的设计目标是"消除大小写差异"，而 `lower()` 的目标是"转为小写形式"——两者在大多数场景下等价，但在需要严格大小写不敏感比较时，`casefold()` 更正确

#### 2.3.3 大小写不敏感搜索

**示例**

```python
print("\n=== 大小写不敏感搜索 ===")
text = "The Quick Brown Fox jumps over the Lazy Dog"
keyword = "fox"

# 方法一：lower 比较
found_lower = keyword.lower() in text.lower()
# 方法二：casefold 比较（更严格）
found_casefold = keyword.casefold() in text.casefold()

print(f"  文本: {text!r}")
print(f"  关键词: {keyword!r}")
print(f"  lower() 搜索:    {found_lower}")
print(f"  casefold() 搜索: {found_casefold}")
```

运行结果：

```text
=== 大小写不敏感搜索 ===
  文本: 'The Quick Brown Fox jumps over the Lazy Dog'
  关键词: 'fox'
  lower() 搜索:    True
  casefold() 搜索: True
```

#### 2.3.4 大小写不敏感字典

使用 `casefold()` 作为字典 key，实现大小写不敏感查找。

**示例**

```python
print("\n=== 大小写不敏感字典 ===")
config = {
    "host": "localhost",
    "port": "8080",
    "debug": "true",
}

# 预处理：存储时用 casefold
casefold_config = {k.casefold(): v for k, v in config.items()}

# 查询时也用 casefold
queries = ["HOST", "Port", "DEBUG", "timeout"]
for q in queries:
    value = casefold_config.get(q.casefold(), "未找到")
    print(f"  查询 {q!r:>8} -> {value!r}")
```

运行结果：

```text
=== 大小写不敏感字典 ===
  查询   'HOST' -> 'localhost'
  查询   'Port' -> '8080'
  查询  'DEBUG' -> 'true'
  查询 'timeout' -> '未找到'
```

#### 2.3.5 大小写不敏感排序

**示例**

```python
print("\n=== 大小写不敏感排序 ===")
words = ["apple", "Banana", "cherry", "Apple", "banana"]

# 普通排序：大写排在小写前面
normal_sorted = sorted(words)
print(f"  普通排序:   {normal_sorted}")

# lower 排序
lower_sorted = sorted(words, key=str.lower)
print(f"  lower 排序:  {lower_sorted}")

# casefold 排序
cf_sorted = sorted(words, key=str.casefold)
print(f"  casefold 排序: {cf_sorted}")

# 含 Unicode 的排序
german_words = ["straße", "Strauss", "STRASSE", "Strand"]
print(f"\n  德语单词: {german_words}")
print(f"  lower 排序:  {sorted(german_words, key=str.lower)}")
print(f"  casefold 排序: {sorted(german_words, key=str.casefold)}")
```

运行结果：

```text
=== 大小写不敏感排序 ===
  普通排序:   ['Apple', 'Banana', 'apple', 'banana', 'cherry']
  lower 排序:  ['apple', 'Apple', 'Banana', 'banana', 'cherry']
  casefold 排序: ['apple', 'Apple', 'Banana', 'banana', 'cherry']

  德语单词: ['straße', 'Strauss', 'STRASSE', 'Strand']
  lower 排序:  ['Strand', 'STRASSE', 'Strauss', 'straße']
  casefold 排序: ['Strand', 'straße', 'STRASSE', 'Strauss']
```

**关键点说明**：

- 普通排序中，大写字母的 ASCII 码小于小写字母，所以 `"Apple"` 排在 `"apple"` 前面
- `lower` 排序和 `casefold` 排序对于纯 ASCII 字符结果相同
- 对于德语单词：`lower` 排序中 `straße`（小写 ß）和 `STRASSE`（大写 SS）不等价，排序结果分开；`casefold` 排序中两者等价，排序更合理

#### 2.3.6 casefold() 处理边缘情况

`casefold()` 还能处理一些 `lower()` 无法正确处理的 Unicode 边缘情况。

**示例**

```python
print("\n=== casefold() 处理边缘情况 ===")
special_chars = [
    ("\u0390", "希腊语 iota 变音升调"),
    ("\u03B0", "希腊语 upsilon 变音升调"),
]

for char, desc in special_chars:
    low = char.lower()
    cf = char.casefold()
    same = "相同" if low == cf else "不同"
    low_code = f"U+{ord(low):04X}" if len(low) == 1 else f"({len(low)} chars)"
    cf_code = f"U+{ord(cf):04X}" if len(cf) == 1 else f"({len(cf)} chars)"
    print(f"  {desc}:")
    print(f"    lower()={low!r} ({low_code})")
    print(f"    casefold()={cf!r} ({cf_code}) -> {same}")
```

运行结果：

```text
=== casefold() 处理边缘情况 ===
  希腊语 iota 变音升调:
    lower()='ΐ' (U+0390)
    casefold()='ΐ' ((3 chars))
    不相同
  希腊语 upsilon 变音升调:
    lower()='ΰ' (U+03B0)
    casefold()='ΰ' ((3 chars))
    不相同
```

这些字符在 `casefold()` 中会被分解为多个字符的组合形式，而 `lower()` 保持原样。这说明 `casefold()` 在 Unicode 规范化方面比 `lower()` 更彻底。

### 2.4 方法总览与对比

#### 2.4.1 方法签名总览

```python
str.upper()      -> str  # 全大写
str.lower()      -> str  # 全小写
str.capitalize() -> str  # 首字母大写，其余小写
str.title()      -> str  # 每个单词首字母大写
str.swapcase()   -> str  # 大小写互换
str.casefold()   -> str  # 激进小写（比较用）
```

所有方法都不接收参数，都返回新字符串，都不修改原字符串。

#### 2.4.2 同一字符串效果对比

**示例**

```python
print("\n=== 同一字符串效果对比 ===")
test_strings = [
    "hello world",
    "HELLO WORLD",
    "Hello World",
    "hELLO wORLD",
    "hello, world!",
    "don't stop",
    "café",
    "Straße",
    "123abc",
    "",
]
for s in test_strings:
    print(f"  {s!r:>18}:")
    print(f"    upper():      {s.upper()!r}")
    print(f"    lower():      {s.lower()!r}")
    print(f"    capitalize(): {s.capitalize()!r}")
    print(f"    title():      {s.title()!r}")
    print(f"    swapcase():   {s.swapcase()!r}")
    print(f"    casefold():   {s.casefold()!r}")
```

运行结果：

```text
=== 同一字符串效果对比 ===
       'hello world':
    upper():      'HELLO WORLD'
    lower():      'hello world'
    capitalize(): 'Hello world'
    title():      'Hello World'
    swapcase():   'HELLO WORLD'
    casefold():   'hello world'
       'HELLO WORLD':
    upper():      'HELLO WORLD'
    lower():      'hello world'
    capitalize(): 'Hello world'
    title():      'Hello World'
    swapcase():   'hello world'
    casefold():   'hello world'
       'Hello World':
    upper():      'HELLO WORLD'
    lower():      'hello world'
    capitalize(): 'Hello world'
    title():      'Hello World'
    swapcase():   'hELLO wORLD'
    casefold():   'hello world'
       'hELLO wORLD':
    upper():      'HELLO WORLD'
    lower():      'hello world'
    capitalize(): 'Hello world'
    title():      'Hello World'
    swapcase():   'Hello World'
    casefold():   'hello world'
     'hello, world!':
    upper():      'HELLO, WORLD!'
    lower():      'hello, world!'
    capitalize(): 'Hello, world!'
    title():      'Hello, World!'
    swapcase():   'HELLO, WORLD!'
    casefold():   'hello, world!'
        "don't stop":
    upper():      "DON'T STOP"
    lower():      "don't stop"
    capitalize(): "Don't stop"
    title():      "Don'T Stop"
    swapcase():   "DON'T STOP"
    casefold():   "don't stop"
              'café':
    upper():      'CAFÉ'
    lower():      'café'
    capitalize(): 'Café'
    title():      'Café'
    swapcase():   'CAFÉ'
    casefold():   'café'
            'Straße':
    upper():      'STRASSE'
    lower():      'straße'
    capitalize(): 'Straße'
    title():      'Straße'
    swapcase():   'sTRASSE'
    casefold():   'strasse'
            '123abc':
    upper():      '123ABC'
    lower():      '123abc'
    capitalize(): '123abc'
    title():      '123Abc'
    swapcase():   '123ABC'
    casefold():   '123abc'
                  '':
    upper():      ''
    lower():      ''
    capitalize(): ''
    title():      ''
    swapcase():   ''
    casefold():   ''
```

#### 2.4.3 非字母字符行为

**示例**

```python
print("\n=== 非字母字符行为 ===")
cases = [
    "12345",           # 纯数字
    "!@#$%",           # 纯符号
    "你好世界",         # 中文
    "hello123world",   # 混合字母数字
    "  hello  ",       # 含空白
]
for s in cases:
    print(f"  {s!r:>15}.lower() = {s.lower()!r}, .upper() = {s.upper()!r}")
print("  非字母字符不受大小写转换影响")
```

运行结果：

```text
=== 非字母字符行为 ===
          '12345'.lower() = '12345', .upper() = '12345'
          '!@#$%'.lower() = '!@#$%', .upper() = '!@#$%'
           '你好世界'.lower() = '你好世界', .upper() = '你好世界'
  'hello123world'.lower() = 'hello123world', .upper() = 'HELLO123WORLD'
      '  hello  '.lower() = '  hello  ', .upper() = '  HELLO  '
  非字母字符不受大小写转换影响
```

#### 2.4.4 空字符串行为

**示例**

```python
print("\n=== 空字符串行为 ===")
methods = ["upper", "lower", "capitalize", "title", "swapcase", "casefold"]
for m in methods:
    result = getattr("", m)()
    print(f"  ''.{m}() = {result!r}")
print("  所有方法对空字符串都安全返回空字符串")
```

运行结果：

```text
=== 空字符串行为 ===
  ''.upper() = ''
  ''.lower() = ''
  ''.capitalize() = ''
  ''.title() = ''
  ''.swapcase() = ''
  ''.casefold() = ''
  所有方法对空字符串都安全返回空字符串
```

#### 2.4.5 方法选择决策表

```text
  需求                              推荐方法
  ----                              --------
  全部转大写                         upper()
  全部转小写                         lower()
  首字母大写、其余小写              capitalize()
  每个单词首字母大写                 title() 或 capwords()
  大小写互换                         swapcase()
  大小写不敏感比较                   casefold()
  德语 ß 的正确处理                  casefold()
  用户输入规范化                     strip().lower()
  邮箱地址规范化                     strip().lower()
  文章标题格式化                     capwords()
  URL slug 生成                      lower().replace(' ', '-')
  驼峰转蛇形                         逐字符检查 isupper + lower
```

### 2.5 链式调用

所有大小写转换方法都返回新字符串，可以链式串联其他字符串方法。

**示例**

```python
print("\n=== 链式调用 ===")
# strip + lower
raw = "  Hello World  "
print(f"  {raw!r}.strip().lower() = {raw.strip().lower()!r}")

# lower + split + join
s = "Hello,World,Test"
parts = s.lower().split(",")
print(f"  {s!r}.lower().split(',') = {parts}")

# capitalize + removeprefix
s2 = "prefix_hello"
result = s2.removeprefix("prefix_").capitalize()
print(f"  {s2!r}.removeprefix('prefix_').capitalize() = {result!r}")

# casefold + replace
s3 = "Straße"
result = s3.casefold().replace("ss", "SS")
print(f"  {s3!r}.casefold().replace('ss', 'SS') = {result!r}")
```

运行结果：

```text
=== 链式调用 ===
  '  Hello World  '.strip().lower() = 'hello world'
  'Hello,World,Test'.lower().split(',') = ['hello', 'world', 'test']
  'prefix_hello'.removeprefix('prefix_').capitalize() = 'Hello'
  'Straße'.casefold().replace('ss', 'SS') = 'straSSe'
```

## 3. 最佳实践

### 3.1 用户名规范化

用户注册时统一用户名格式——去空白、转小写、过滤非法字符。

**推荐写法**

```python
def normalize_username(username):
    """用户名规范化：去空白、转小写、去除非法字符。"""
    cleaned = username.strip().casefold()
    # 只保留字母、数字、下划线
    cleaned = "".join(ch for ch in cleaned if ch.isalnum() or ch == "_")
    return cleaned

raw_usernames = [
    "  AliceSmith  ",
    "BOB_JONES",
    "  Charlie123  ",
    "DAVE@EXAMPLE",
    "Eve_Smith",
    "  Frank.OHara  ",
]
for raw in raw_usernames:
    normalized = normalize_username(raw)
    print(f"  {raw!r:>22} -> {normalized!r}")
```

运行结果：

```text
        '  AliceSmith  ' -> 'alicesmith'
             'BOB_JONES' -> 'bob_jones'
        '  Charlie123  ' -> 'charlie123'
          'DAVE@EXAMPLE' -> 'daveexample'
             'Eve_Smith' -> 'eve_smith'
       '  Frank.OHara  ' -> 'frankohara'
```

这里使用 `casefold()` 而非 `lower()`，因为用户名可能包含 Unicode 字符，`casefold()` 在不敏感比较方面更彻底。

### 3.2 标题规范化

文章标题需要每个单词首字母大写，但 `title()` 会对撇号后的字母错误大写。使用 `string.capwords()` 替代。

**推荐写法**

```python
import string

def normalize_title(text):
    """标题规范化：用 capwords 替代 title 避免撇号问题。"""
    return string.capwords(text.strip())

raw_titles = [
    "the lord of the rings",
    "it's a wonderful life",
    "don't look up",
    "  ready player one  ",
    "THE MATRIX RELOADED",
    "to kill a mockingbird",
]
for raw in raw_titles:
    normalized = normalize_title(raw)
    title_result = raw.strip().title()
    print(f"  {raw!r:>28} -> {normalized!r}")
    if title_result != normalized:
        print(f"    (title() 会得到: {title_result!r})")
```

运行结果：

```text
       'the lord of the rings' -> 'The Lord Of The Rings'
       "it's a wonderful life" -> "It's A Wonderful Life"
    (title() 会得到: "It'S A Wonderful Life")
               "don't look up" -> "Don't Look Up"
    (title() 会得到: "Don'T Look Up")
        '  ready player one  ' -> 'Ready Player One'
         'THE MATRIX RELOADED' -> 'The Matrix Reloaded'
       'to kill a mockingbird' -> 'To Kill A Mockingbird'
```

### 3.3 邮箱地址规范化

邮箱地址的域名部分不区分大小写，需要统一转为小写。

**推荐写法**

```python
def normalize_email(email):
    """邮箱规范化：去空白、转小写。"""
    cleaned = email.strip().lower()
    # 移除可能的 mailto: 前缀
    cleaned = cleaned.removeprefix("mailto:")
    return cleaned

raw_emails = [
    "  Alice@Example.COM  ",
    "BOB@COMPANY.COM",
    "  mailto:Charlie@Server.org  ",
    "Dave@Example.com",
]
for raw in raw_emails:
    normalized = normalize_email(raw)
    print(f"  {raw!r:>30} -> {normalized!r}")
```

运行结果：

```text
         '  Alice@Example.COM  ' -> 'alice@example.com'
               'BOB@COMPANY.COM' -> 'bob@company.com'
  '  mailto:Charlie@Server.org  ' -> 'charlie@server.org'
              'Dave@Example.com' -> 'dave@example.com'
```

### 3.4 URL Slug 生成

将文章标题转为 URL 友好的 slug 格式——小写、空格转连字符、去除特殊字符。

**推荐写法**

```python
def generate_slug(title):
    """URL slug 生成：标题转 URL 友好格式。"""
    # 转小写
    slug = title.lower().strip()
    # 空格替换为连字符
    slug = slug.replace(" ", "-")
    # 去除非字母数字和连字符
    slug = "".join(ch for ch in slug if ch.isalnum() or ch == "-")
    # 合并连续连字符
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug

raw_titles = [
    "Hello World",
    "The Quick Brown Fox!",
    "Python 3.12 New Features",
    "It's a Wonderful Life",
    "  Don't Look Up  ",
    "API Design Best Practices",
]
for raw in raw_titles:
    slug = generate_slug(raw)
    print(f"  {raw!r:>30} -> /{slug}")
```

运行结果：

```text
                   'Hello World' -> /hello-world
          'The Quick Brown Fox!' -> /the-quick-brown-fox
      'Python 3.12 New Features' -> /python-312-new-features
         "It's a Wonderful Life" -> /its-a-wonderful-life
             "  Don't Look Up  " -> /dont-look-up
     'API Design Best Practices' -> /api-design-best-practices
```

### 3.5 命名规范转换

驼峰命名与蛇形命名的转换是大小写转换方法的典型应用。

**推荐写法**

```python
def camel_to_snake(name):
    """驼峰命名转蛇形命名。"""
    result = ""
    for i, ch in enumerate(name):
        if ch.isupper() and i > 0:
            result += "_"
        result += ch.lower()
    return result

def snake_to_camel(name):
    """蛇形命名转驼峰命名。"""
    parts = name.split("_")
    return parts[0].lower() + "".join(p.capitalize() for p in parts[1:])

print("  驼峰 -> 蛇形:")
names = ["userName", "getConfigValue", "HttpRequestTimeout", "userId", "APIKey"]
for name in names:
    snake = camel_to_snake(name)
    print(f"    {name:>25} -> {snake}")

print("\n  蛇形 -> 驼峰:")
snake_names = ["user_name", "get_config_value", "http_request_timeout", "user_id", "api_key"]
for name in snake_names:
    camel = snake_to_camel(name)
    print(f"    {name:>25} -> {camel}")
```

运行结果：

```text
  驼峰 -> 蛇形:
                     userName -> user_name
               getConfigValue -> get_config_value
           HttpRequestTimeout -> http_request_timeout
                       userId -> user_id
                       APIKey -> a_p_i_key

  蛇形 -> 驼峰:
                    user_name -> userName
             get_config_value -> getConfigValue
         http_request_timeout -> httpRequestTimeout
                      user_id -> userId
                      api_key -> apiKey
```

> **注意**：`APIKey` 转为蛇形时结果为 `a_p_i_key`（每个大写字母都被拆分），这在实际开发中可能不是期望行为。更完善的驼峰转蛇形需要结合上下文判断连续大写字母的处理，但这超出了大小写转换方法本身的范围。

### 3.6 大小写不敏感比较的正确选择

**推荐写法**

```python
# 推荐：使用 casefold() 进行大小写不敏感比较
if s1.casefold() == s2.casefold():
    print("匹配")
```

**不推荐写法**

```python
# 不推荐：lower() 对德语 ß 不正确
if s1.lower() == s2.lower():
    print("匹配")

# 在德语场景中：
# "Straße".lower() = "straße"
# "STRASSE".lower() = "strasse"
# "straße" != "strasse"  -> 比较失败！

# 而 casefold() 可以正确处理：
# "Straße".casefold() = "strasse"
# "STRASSE".casefold() = "strasse"
# "strasse" == "strasse" -> 比较成功
```

## 4. 原理

### 4.1 upper() / lower() 的内部实现

`upper()` 和 `lower()` 的核心是根据 Unicode 数据库中的大小写映射表逐字符转换。

```text
函数 upper(s):
    result = ""
    for ch in s:
        # 查找 Unicode 大小写映射表
        if ch 在映射表中小写->大写项:
            result += 映射后的字符（可能是一对多）
        else:
            result += ch
    return result
```

核心要点：

1. 逐字符处理——每个字符独立转换，不考虑上下文
2. 查找 Unicode 标准映射表——Python 内部使用 `unicodedata` 模块的映射数据
3. 一对多转换——某些字符的大写/小写形式会变成多个字符，例如德语 `ß` 的大写是 `SS`
4. 无参数、无副作用——不接收参数，不修改原字符串，只返回新字符串

### 4.2 capitalize() 与 title() 的分词规则差异

`capitalize()` 和 `title()` 的核心差异在于"分词"方式：

```text
capitalize(s):
    if s 为空:
        return ""
    return s[0].upper() + s[1:].lower()

title(s):
    result = ""
    prev_is_alpha = False
    for ch in s:
        if not ch.isalpha():
            result += ch.lower()  # 非字母直接保留
            prev_is_alpha = False
        elif not prev_is_alpha:
            result += ch.upper()  # 单词首字母大写
            prev_is_alpha = True
        else:
            result += ch.lower()  # 单词内部小写
            prev_is_alpha = True
    return result
```

核心要点：

1. `capitalize()` 只关心字符串的第一个字符——首字符大写，其余全部小写
2. `title()` 以"非字母字符"作为单词边界——每遇到一个非字母字符，下一个字母字符就被视为新单词的首字母
3. `title()` 的分词规则过于宽泛——空格、标点、撇号 `'` 都被视为单词边界，导致 `don't` 变为 `Don'T`
4. `string.capwords()` 只以空格作为分隔符——先 `split()`（按空格分词），再对每个词 `capitalize()`，最后 `join()`

### 4.3 casefold() 的设计动机

`casefold()` 是 Python 3 引入的新方法。Python 2 中不存在此方法。PEP 3131（Python 3 中的 Unicode 支持）推动了 `casefold()` 的引入。

`casefold()` 的设计动机来源于 Unicode 标准（Unicode Standard Annex #15）对"大小写折叠"（Case Folding）的定义：

```text
Case Folding：将字符串消除大小写差异，用于不区分大小写的比较。

lower()：将字符串转为小写形式，用于显示或存储。
casefold()：将字符串转为"无大小写"形式，用于比较。
```

核心区别：

1. `lower()` 的目标是"转为小写形式"——某些字符的小写形式仍然可能与其他字符的大写形式不同（如德语 `ß` 的小写仍然是 `ß`，与 `SS` 的小写 `ss` 不同）
2. `casefold()` 的目标是"消除所有大小写差异"——它会将 `ß` 展开为 `ss`，将希腊语带重音的字符分解为基本字符加重音符号的组合形式
3. 在大多数场景下两者结果相同，但在需要跨语言的大小写不敏感比较时，`casefold()` 是正确选择

### 4.4 swapcase() 不是对合操作的原因

"对合操作"（involution）指 `f(f(x)) == x`。`swapcase()` 对纯 ASCII 字母是对合的，但对一些 Unicode 字符不是对合的。

原因在于 Unicode 大小写映射中的"一对多"转换：

```text
Straße 的 swapcase 过程：
  第一步：Straße -> sTRASSE    （ß 的大写是 SS，一个字符变两个）
  第二步：sTRASSE -> Strasse   （SS 的小写是 ss，无法合并回 ß）
  结果：Strasse != Straße     （不还原）
```

这是因为大小写转换不是双射函数——某些大写字符对应两个小写字符的合并形式（如 `SS` 和 `ß`），反之亦然。在第二次 `swapcase` 时，`ss` 被分别转换为 `SS` 再转为 `ss`，无法知道它原本来自 `ß`。

### 4.5 不可变性与返回新字符串

Python 字符串是不可变对象（immutable）。所有大小写转换方法——包括 `upper()`、`lower()`、`capitalize()`、`title()`、`swapcase()`、`casefold()`——都不会修改原字符串，而是创建并返回一个新的字符串对象。

这意味着：

```python
s = "Hello World"
s.upper()  # 这行代码什么都没改变
print(s)   # 仍然是 "Hello World"

s = s.upper()  # 必须用 s 接收返回值
print(s)       # 现在是 "HELLO WORLD"
```

不可变性的好处是安全性——你不需要担心 `upper()` 会意外修改其他引用同一字符串的变量。缺点是每次操作都会创建新对象，在极端性能场景下可能有开销（但 CPython 对短字符串有驻留优化，实际开销很小）。

## 5. 总结

本文围绕"大小写转换方法"展开，主要介绍了以下内容：

- `str.upper()` / `str.lower()`：将所有字母转为大写/小写，非字母字符不受影响，对 Unicode 字母有效（包括德语 `ß`、重音字母、希腊字母等）
- `str.capitalize()`：首字母大写，其余全部小写——行为简单，只处理字符串的第一个字符
- `str.title()`：每个单词首字母大写，以"非字母字符"作为单词分隔——但同时也会因撇号、连字符等导致 `don't` 变为 `Don'T`，实际使用中推荐 `string.capwords()` 替代
- `str.swapcase()`：大小写互换，对纯 ASCII 是对合操作，但对 Unicode 中存在一对多转换的字符（如德语 `ß` 不还原
- `str.casefold()`：专为大小写不敏感比较设计，比 `lower()` 更激进——将德语 `ß` 展开为 `ss`，将希腊语带重音字符分解，确保不同大小写形式的字符串能正确匹配
- `casefold()` vs `lower()` 的核心区别：`lower()` 转为小写形式（`ß` 还是 `ß`），`casefold()` 消除大小写差异（`ß` 变为 `ss`）——大小写不敏感比较应使用 `casefold()`
- 方法选择决策表：全大写用 `upper()`、全小写用 `lower()`、首字母大写用 `capitalize()`、每个单词首字母大写用 `capwords()`、大小写互换用 `swapcase()`、不敏感比较用 `casefold()`
- 最佳实践：用户名规范化用 `strip().casefold()`、邮箱规范化用 `strip().lower()`、标题格式化用 `capwords()`、URL slug 用 `lower()` + 替换、驼峰蛇形转换用 `isupper()` + `lower()` / `capitalize()`
- 原理：`upper`/`lower` 基于 Unicode 大小写映射表逐字符转换（可能一对多），`capitalize` 只处理首字符，`title` 以非字母字符分词，`casefold` 基于 Unicode Case Folding 标准，`swapcase` 非对合是因为一对多转换不可逆
- 字符串不可变性：所有大小写转换方法返回新字符串，原字符串不会被修改