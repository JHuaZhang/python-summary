---
group:
  title: 【03】字符串介绍
  order: 3
order: 24
title: replace 方法
nav:
  title: Python基础
  order: 1
---

# replace 方法

## 1. 介绍

### 1.1 知识点定义

`str.replace()` 是 Python 字符串的替换方法，它将字符串中所有匹配的子串 `old` 替换为 `new`，返回一个新字符串。原字符串不会被修改（字符串是不可变对象）。

方法签名：

```python
str.replace(old, new, count=-1) -> str
```

参数说明：

- **old**：要被替换的子串。可以是单个字符，也可以是多字符字符串。不能省略
- **new**：替换为的新子串。可以是任意字符串，包括空字符串（此时效果为删除子串）
- **count**：最大替换次数（可选，默认 `-1` 表示替换全部）。替换从左端开始，达到 `count` 次后停止

`replace` 是 Python 中最常用的字符串替换方法，应用场景包括：敏感词过滤、模板占位符替换、文本规范化（统一换行符/引号）、数据脱敏、HTML 标签清理等。

### 1.2 最简示例

先用最简单的代码直观感受 `replace` 的行为：

```python
# 基本替换：将所有 "world" 替换为 "Python"
result = "hello world".replace("world", "Python")
print(result)
# hello Python

# 替换所有匹配项
result = "a-b-c-d-e".replace("-", "+")
print(result)
# a+b+c+d+e

# 限制替换次数：只替换前 2 个
result = "a-b-c-d-e".replace("-", "+", 2)
print(result)
# a+b+c-d-e

# 替换为空字符串 = 删除子串
result = "remove all spaces".replace(" ", "")
print(result)
# removeallspaces
```

运行结果：

```text
hello Python
a+b+c+d+e
a+b+c-d-e
removeallspaces
```

### 1.3 在字符串方法体系中的位置

`replace` 属于"替换类"字符串操作：

```text
字符串方法体系
├── 查找类：find / rfind / index / count / in
├── 判断类：isalpha / isdigit / isupper / islower ...
├── 拆分与连接类：split / rsplit / splitlines / partition / join
├── 替换类（本篇）：
│   ├── replace          ← 子串替换（本篇）
│   └── translate / maketrans  ← 单字符映射替换
├── 大小写转换类：upper / lower / title / capitalize / swapcase / casefold
├── 对齐填充类：ljust / rjust / center / zfill
└── 清洗类：strip / lstrip / rstrip / removeprefix / removesuffix
```

`replace` 的核心特点：

- **子串替换**——`old` 可以是任意长度的字符串，不只是单字符
- **全部替换**——默认替换所有匹配项，可用 `count` 限制次数
- **不修改原串**——返回新字符串，原字符串不变
- **大小写敏感**——精确匹配，`"Hello"` 和 `"hello"` 被视为不同的子串
- **不使用正则**——纯文本匹配，不需要转义特殊字符

## 2. 核心内容

### 2.1 基本替换

#### 2.1.1 old 与 new 参数

`replace` 的前两个参数 `old` 和 `new` 都是必需的：

```python
# 单字符替换
print("'a-b-c'.replace('-', '+') =", 'a-b-c'.replace('-', '+'))

# 多字符替换
print("'hello world'.replace('world', 'Python') =", 'hello world'.replace('world', 'Python'))

# URL 协议替换
print("'https://example.com'.replace('https://', 'http://') =", 'https://example.com'.replace('https://', 'http://'))

# 替换为更长的字符串
print("'a.b.c'.replace('.', ' -> ') =", 'a.b.c'.replace('.', ' -> '))
```

运行结果：

```text
'a-b-c'.replace('-', '+') = a+b+c
'hello world'.replace('world', 'Python') = hello Python
'https://example.com'.replace('https://', 'http://') = http://example.com
'a.b.c'.replace('.', ' -> ') = a -> b -> c
```

#### 2.1.2 替换所有匹配项

默认情况下，`replace` 会替换字符串中**所有**匹配的子串：

```python
s = "I like cats and cats are cute"
result = s.replace("cats", "dogs")
print(f"  原始: {s}")
print(f"  替换: {result}")
```

运行结果：

```text
  原始: I like cats and cats are cute
  替换: I like dogs and dogs are cute
```

两个 `cats` 都被替换为 `dogs`——这是 `replace` 的默认行为。

#### 2.1.3 大小写敏感

`replace` 是大小写敏感的——只替换精确匹配的子串：

```python
s = "Hello hello HELLO HeLLo"
print(f"  原始: {s!r}")
print(f"  replace('hello', 'X'):  {s.replace('hello', 'X')!r}")
print(f"  replace('Hello', 'X'):  {s.replace('Hello', 'X')!r}")
print(f"  replace('HELLO', 'X'):  {s.replace('HELLO', 'X')!r}")
```

运行结果：

```text
  原始: 'Hello hello HELLO HeLLo'
  replace('hello', 'X'):  'Hello X HELLO HeLLo'
  replace('Hello', 'X'):  'X hello HELLO HeLLo'
  replace('HELLO', 'X'):  'Hello hello X HeLLo'
```

每次只替换大小写完全匹配的那一个——`replace` 不做大小写不敏感匹配。如果需要忽略大小写替换，可以使用正则表达式的 `re.sub` 配合 `re.IGNORECASE`。

#### 2.1.4 多字符 old 参数

`old` 可以是任意长度的字符串——这是 `replace` 比 `translate` 更灵活的地方（`translate` 只支持单字符映射）：

```python
cases = [
    ("hello world", "world", "Python"),
    ("https://example.com", "https://", "http://"),
    ("color: red; background: red;", "red", "blue"),
    ("2024-01-15", "-", "/"),
    ("item1,item2,item3", ",", " | "),
]
for s, old, new in cases:
    result = s.replace(old, new)
    print(f"  {s!r}.replace({old!r}, {new!r}) = {result!r}")
```

运行结果：

```text
  'hello world'.replace('world', 'Python') = 'hello Python'
  'https://example.com'.replace('https://', 'http://') = 'http://example.com'
  'color: red; background: red;'.replace('red', 'blue') = 'color: blue; background: blue;'
  '2024-01-15'.replace('-', '/') = '2024/01/15'
  'item1,item2,item3'.replace(',', ' | ') = 'item1 | item2 | item3'
```

#### 2.1.5 不可变性

`replace` 不会修改原字符串——它创建并返回一个新字符串：

```python
original = "hello world"
replaced = original.replace("world", "Python")
print(f"  原始: {original!r}")
print(f"  替换后: {replaced!r}")
print(f"  原始未被修改: {original == 'hello world'}")
print(f"  是不同对象: {original is not replaced}")
```

运行结果：

```text
  原始: 'hello world'
  替换后: 'hello Python'
  原始未被修改: True
  是不同对象: True
```

字符串在 Python 中是不可变对象——所有修改操作都返回新字符串，原字符串始终不变。

### 2.2 count 参数

#### 2.2.1 限制替换次数

`count` 参数限制最大替换次数。替换从左端开始，达到 `count` 次后停止：

```python
s = "a-b-c-d-e"
for count in [1, 2, 3, 10]:
    result = s.replace("-", "+", count)
    print(f"  {s!r}.replace('-', '+', {count}) = {result!r}")
```

运行结果：

```text
  'a-b-c-d-e'.replace('-', '+', 1) = 'a+b-c-d-e'
  'a-b-c-d-e'.replace('-', '+', 2) = 'a+b+c-d-e'
  'a-b-c-d-e'.replace('-', '+', 3) = 'a+b+c+d-e'
  'a-b-c-d-e'.replace('-', '+', 10) = 'a+b+c+d+e'
```

**关键点说明**：

- `count=1`：只替换第一个 `-`（从左端开始）
- `count=2`：只替换前两个 `-`
- `count=10`：超过实际匹配数量，等同于替换全部
- 替换方向始终从左端开始——没有"从右端开始"的 `rreplace` 方法

#### 2.2.2 从左端开始替换

`count` 限制的替换始终从左端开始：

```python
s = "word word word word"
print(f"  原始: {s!r}")
print(f"  count=1: {s.replace('word', 'X', 1)!r}")
print(f"  count=2: {s.replace('word', 'X', 2)!r}")
print(f"  count=3: {s.replace('word', 'X', 3)!r}")
```

运行结果：

```text
  原始: 'word word word word'
  count=1: 'X word word word'
  count=2: 'X X word word'
  count=3: 'X X X word'
```

#### 2.2.3 count=0

`count=0` 时不替换任何匹配——返回原串的副本（实际上 CPython 对 `count=0` 做了优化，直接返回原字符串对象）：

```python
s = "hello world"
result = s.replace("o", "0", 0)
print(f"  {s!r}.replace('o', '0', 0) = {result!r}")
print(f"  原串和返回值内容相同: {s == result}")
print(f"  原串和返回值是同一对象: {s is result}")
```

运行结果：

```text
  'hello world'.replace('o', '0', 0) = 'hello world'
  原串和返回值内容相同: True
  原串和返回值是同一对象: True
```

**关键点说明**：

- `count=0` 时，`replace` 直接返回原字符串对象（`is` 判断为 `True`）
- 这是 CPython 的优化——既然不需要替换，就没有必要创建新字符串

#### 2.2.4 默认 count 与负数 count

不传 `count` 等同于 `count=-1`（替换全部）。所有负数 `count` 都等同于 `-1`：

```python
s = "a.b.c.d"
print(f"  不传 count:  {s.replace('.', '-')!r}")
print(f"  count=-1:   {s.replace('.', '-', -1)!r}")
print(f"  两者相同: {s.replace('.', '-') == s.replace('.', '-', -1)}")
```

运行结果：

```text
  不传 count:  'a-b-c-d'
  count=-1:   'a-b-c-d'
  两者相同: True
```

```python
s = "aaa"
print(f"  {s!r}.replace('a', 'b', -1)   = {s.replace('a', 'b', -1)!r}")
print(f"  {s!r}.replace('a', 'b', -5)   = {s.replace('a', 'b', -5)!r}")
print(f"  {s!r}.replace('a', 'b', -100) = {s.replace('a', 'b', -100)!r}")
```

运行结果：

```text
  'aaa'.replace('a', 'b', -1)   = 'bbb'
  'aaa'.replace('a', 'b', -5)   = 'bbb'
  'aaa'.replace('a', 'b', -100) = 'bbb'
```

#### 2.2.5 实战：只替换第一个匹配项

```python
# 场景：日志中只替换第一个时间戳
log = "[ERROR] 2024-01-15 10:30:45 - 2024-01-15 10:31:22 - Connection timeout"
fixed = log.replace("2024-01-15", "2025-06-01", 1)
print(f"  原始: {log}")
print(f"  替换1个: {fixed}")
```

运行结果：

```text
  原始: [ERROR] 2024-01-15 10:30:45 - 2024-01-15 10:31:22 - Connection timeout
  替换1个: [ERROR] 2025-06-01 10:30:45 - 2024-01-15 10:31:22 - Connection timeout
```

`count=1` 只替换了第一个 `2024-01-15`，第二个保持不变。

### 2.3 替换为空字符串（删除子串）

#### 2.3.1 用 replace 删除子串

当 `new` 为空字符串时，`replace` 的效果是删除所有匹配的 `old`：

```python
cases = [
    ("hello world", "world"),
    ("remove all spaces", " "),
    ("a.b.c.d", "."),
    ("prefix_name_suffix", "prefix_"),
    ("  trim spaces  ", "  "),
    ("aaa", "a"),
]
for s, old in cases:
    result = s.replace(old, "")
    print(f"  {s!r}.replace({old!r}, '') = {result!r}")
```

运行结果：

```text
  'hello world'.replace('world', '') = 'hello '
  'remove all spaces'.replace(' ', '') = 'removeallspaces'
  'a.b.c.d'.replace('.', '') = 'abcd'
  'prefix_name_suffix'.replace('prefix_', '') = 'name_suffix'
  '  trim spaces  '.replace('  ', '') = 'trim spaces'
  'aaa'.replace('a', '') = ''
```

#### 2.3.2 replace 删除 vs strip 删除

`replace(old, '')` 删除**所有位置**的 `old`，而 `strip(chars)` 只删除**首尾**的字符：

```python
s = "###hello###"
print(f"  原始: {s!r}")
print(f"  replace('#', '')  = {s.replace('#', '')!r}   <- 删除所有 #")
print(f"  strip('#')        = {s.strip('#')!r}   <- 只删除首尾 #")
```

运行结果：

```text
  原始: '###hello###'
  replace('#', '')  = 'hello'   <- 删除所有 #
  strip('#')        = 'hello'   <- 只删除首尾 #
```

本例中两者碰巧结果相同（因为 `#` 只在首尾），但如果字符串中间也有 `#`，行为就不同了：

```python
s = "a#b#c"
print(f"  {s!r}")
print(f"  replace('#', '')  = {s.replace('#', '')!r}   <- 删除所有 #")
print(f"  strip('#')        = {s.strip('#')!r}   <- 首尾没有 #，不做任何操作")
```

运行结果：

```text
  'a#b#c'
  replace('#', '')  = 'abc'   <- 删除所有 #
  strip('#')        = 'a#b#c'   <- 首尾没有 #，不做任何操作
```

#### 2.3.3 链式 replace 删除多种字符

通过链式调用 `replace`，可以依次删除多种不同的字符：

```python
s = "Hello, World! How are you?"
cleaned = s.replace(",", "").replace("!", "").replace("?", "")
print(f"  原始: {s!r}")
print(f"  链式删除标点: {cleaned!r}")
```

运行结果：

```text
  原始: 'Hello, World! How are you?'
  链式删除标点: 'Hello World How are you'
```

### 2.4 空字符串 old 的边界行为

#### 2.4.1 old='' 在字符间插入

当 `old` 为空字符串时，`replace` 会在每两个字符之间（包括首尾）插入 `new`：

```python
cases = [
    ("abc", "X"),
    ("", "X"),
    ("a", "X"),
    ("ab", ""),
]
for s, new in cases:
    result = s.replace("", new)
    print(f"  {s!r}.replace('', {new!r}) = {result!r}")
```

运行结果：

```text
  'abc'.replace('', 'X') = 'XaXbXcX'
  ''.replace('', 'X') = 'X'
  'a'.replace('', 'X') = 'XaX'
  'ab'.replace('', '') = 'ab'
```

**关键点说明**：

- `"abc".replace("", "X")` -> `"XaXbXcX"`：在 `a` 前、`a` 与 `b` 之间、`b` 与 `c` 之间、`c` 后各插入一个 `X`
- `"".replace("", "X")` -> `"X"`：空字符串被视为"有一个空位置"
- `"ab".replace("", "")` -> `"ab"`：插入空字符串等于没变

#### 2.4.2 old='' 配合 count

`old=''` 也可以配合 `count` 参数使用：

```python
s = "abc"
for count in [1, 3, 5]:
    result = s.replace("", "-", count)
    print(f"  {s!r}.replace('', '-', {count}) = {result!r}")
```

运行结果：

```text
  'abc'.replace('', '-', 1) = '-abc'
  'abc'.replace('', '-', 3) = '-a-b-c'
  'abc'.replace('', '-', 5) = '-a-b-c-'
```

### 2.5 链式 replace

#### 2.5.1 连续多步替换

`replace` 返回新字符串，可以链式调用完成多步替换：

```python
s = "The quick brown fox"
result = s.replace("quick", "slow").replace("fox", "dog")
print(f"  原始: {s!r}")
print(f"  两步替换: {result!r}")
```

运行结果：

```text
  原始: 'The quick brown fox'
  两步替换: 'The slow brown dog'
```

#### 2.5.2 链式替换的连锁问题

链式 `replace` 有一个容易踩的坑——后续的 `replace` 可能替换掉前面步骤产生的结果：

```python
s = "abc"
# 期望：a->b, b->c，结果应该是 "bcc"
result = s.replace("a", "b").replace("b", "c")
print(f"  原始: {s!r}")
print(f"  replace('a','b').replace('b','c') = {result!r}")
print("  期望 'bcc'，实际 'ccc'")
```

运行结果：

```text
  原始: 'abc'
  replace('a','b').replace('b','c') = 'ccc'
  期望 'bcc'，实际 'ccc'
```

**关键点说明**：

- 第一步 `"abc".replace("a", "b")` 得到 `"bbc"`
- 第二步 `"bbc".replace("b", "c")` 把所有 `b`（包括第一步产生的）都替换为 `c`，得到 `"ccc"`
- 这是链式 `replace` 的"连锁替换"问题——如果多次替换的 `old` 和 `new` 有交叉，就会产生意外结果

解决方法是使用 `translate` ——它一次性对所有字符做映射，不会连锁：

```python
s = "abc"
table = str.maketrans("ab", "bc")
result = s.translate(table)
print(f"  translate('a->b', 'b->c') = {result!r}")
```

运行结果：

```text
  translate('a->b', 'b->c') = 'bcc'
```

### 2.6 replace vs translate 对比

#### 2.6.1 多字符替换的问题

当需要同时替换多个字符时，`replace` 需要链式调用：

```python
s = "abcabc"
result = s.replace("a", "1").replace("b", "2").replace("c", "3")
print(f"  原始: {s!r}")
print(f"  三步 replace: {result!r}")
```

运行结果：

```text
  原始: 'abcabc'
  三步 replace: '123123'
```

每步 `replace` 创建一个新字符串，三步共创建 3 个中间对象。

#### 2.6.2 translate 一次性完成

`translate` 用一个映射表一次性完成所有字符替换：

```python
s = "abcabc"
table = str.maketrans("abc", "123")
result = s.translate(table)
print(f"  原始: {s!r}")
print(f"  translate: {result!r}")
```

运行结果：

```text
  原始: 'abcabc'
  translate: '123123'
```

#### 2.6.3 完整对比表

| 维度 | `replace` | `translate` |
|------|-----------|-------------|
| 替换类型 | 子串替换（old 可以多字符） | 单字符映射替换 |
| 参数 | `old, new, count` | `translation_table` |
| 多字符替换 | 链式调用多次 | 一次调用完成 |
| 连锁替换 | 可能产生连锁问题 | 不会连锁（一次性映射） |
| 替换次数限制 | 支持 `count` 参数 | 不支持 |
| 多字符 old | 支持 | 不支持（只支持单字符） |
| 空 old 行为 | 在字符间插入 | 报错 |
| 性能（多字符替换） | 较差（多次创建新串） | 更好（一次遍历） |

**选择建议**：

- 替换单个子串（如 `"world"` -> `"Python"`）→ 用 `replace`
- 限制替换次数 → 用 `replace`（`count` 参数）
- 同时替换多个单字符（如 `a->1, b->2, c->3`）→ 用 `translate`
- 担心连锁替换问题 → 用 `translate`

## 3. 最佳实践

### 3.1 推荐 vs 不推荐写法

| 场景 | 不推荐 | 推荐 | 原因 |
|------|--------|------|------|
| 删除子串 | `s.replace(old, "")` 多次 | `s.replace(old, "")` 按需 | `replace` 是删除子串的正确方式 |
| 只替换第一个 | `s.split(old, 1)` + `new.join()` | `s.replace(old, new, 1)` | `count=1` 更简洁直观 |
| 多字符映射 | `s.replace("a","1").replace("b","2")` | `s.translate(str.maketrans("ab","12"))` | 避免连锁替换，性能更好 |
| 大小写不敏感替换 | `s.replace("hello", "X")` | `re.sub("hello", "X", s, flags=re.I)` | `replace` 是大小写敏感的 |
| 删除首尾字符 | `s.replace("#", "")` | `s.strip("#")` | `strip` 只删首尾更精确 |

### 3.2 常见错误模式

**错误1：忽视链式替换的连锁问题**

```python
# 想把 a->b, b->c，但产生了连锁替换
s = "abc"
result = s.replace("a", "b").replace("b", "c")
print(result)  # 'ccc' 而非 'bcc'

# 正确做法：用 translate
table = str.maketrans("ab", "bc")
print(s.translate(table))  # 'bcc'
```

**错误2：以为 replace 是大小写不敏感的**

```python
# replace 精确匹配大小写
s = "Hello World"
print(s.replace("hello", "X"))   # 'Hello World'（没替换）

# 需要：用 re.sub 配合 re.IGNORECASE
import re
print(re.sub("hello", "X", s, flags=re.IGNORECASE))  # 'X World'
```

**错误3：用 replace 替代 strip 去首尾字符**

```python
# 中间也有 # 时，replace 会全部删除
s = "a#b#c"
print(s.replace("#", ""))  # 'abc'（中间的也被删了）

# 只删首尾用 strip
print(s.strip("#"))  # 'a#b#c'（中间不变）
```

**错误4：忽视 count=0 返回原对象**

```python
s = "hello"
result = s.replace("o", "0", 0)
# count=0 时 result is s（同一对象），但不应依赖此行为
# 应该在逻辑上明确区分"不需要替换"的情况
```

### 3.3 性能注意事项

`replace` 的时间复杂度为 **O(n)**（n 为字符串长度）。但由于 CPython 用 C 实现，实际性能很高。

当需要多次 `replace` 替换不同子串时，链式调用会产生多个中间字符串对象：

```python
# 5 次链式 replace：创建 5 个中间字符串
result = (
    s.replace("a", "1")
     .replace("b", "2")
     .replace("c", "3")
     .replace("d", "4")
     .replace("e", "5")
)
```

如果只是单字符到单字符的映射，用 `translate` 更高效——只需一次遍历：

```python
table = str.maketrans("abcde", "12345")
result = s.translate(table)
```

但如果 `old` 是多字符子串（如 `"->"` 替换为 `"->->"`），则只能用 `replace`，`translate` 无法处理这种场景。

### 3.4 方法选择决策

```text
你需要替换什么？
  ├── 替换一个子串为新子串？
  │     → replace(old, new)
  │     （old 可以是多字符，全部替换）
  │
  ├── 只替换前 N 个匹配？
  │     → replace(old, new, count=N)
  │     （从左端开始计数）
  │
  ├── 删除一个子串？
  │     → replace(old, "")
  │     （删除所有匹配项）
  │
  ├── 同时替换多个单字符？
  │     → translate(str.maketrans(old_chars, new_chars))
  │     （一次调用，避免连锁替换）
  │
  ├── 大小写不敏感替换？
  │     → re.sub(pattern, repl, s, flags=re.IGNORECASE)
  │
  └── 只删除首尾字符？
        → strip(chars) / lstrip / rstrip
```

## 4. 原理

### 4.1 replace 的查找与替换逻辑

`replace` 的内部实现基于字符串搜索。CPython 中 `str.replace` 的核心流程如下：

```text
函数 replace(s, old, new, count):
    if count == 0:
        return s                    # 优化：count=0 直接返回原串
    if old == '':
        # 特殊处理：在每两个字符之间插入 new
        return new.join(s) + new    # 实际上更复杂，但效果类似

    result = []                     # 结果是一个可变列表
    pos = 0                         # 当前搜索位置
    replaced = 0                    # 已替换次数

    while pos < len(s):
        # 在 s[pos:] 中查找 old
        found = s.find(old, pos)
        if found == -1:
            break                   # 没有更多匹配
        if count >= 0 and replaced >= count:
            break                   # 达到次数限制

        # 添加 old 之前的部分和 new
        result.append(s[pos:found])
        result.append(new)
        pos = found + len(old)      # 跳过 old
        replaced += 1

    # 添加剩余部分
    result.append(s[pos:])
    return ''.join(result)          # 合并为新字符串
```

核心要点：

1. `replace` 内部使用 `find` 在字符串中搜索 `old` 的位置
2. 找到后，将 `old` 之前的部分和 `new` 拼入结果
3. 搜索位置跳过 `old` 的长度，避免重叠匹配
4. 不会修改原字符串——使用可变列表构建结果，最后合并为新字符串

### 4.2 count=0 的优化

当 `count=0` 时，`replace` 直接返回原字符串对象——不创建新字符串：

```python
s = "hello"
result = s.replace("o", "0", 0)
print(f"  s is result: {s is result}")  # True
```

运行结果：

```text
  s is result: True
```

这是 CPython 的优化逻辑——既然不需要替换任何内容，就没有必要创建新字符串。但不应在代码中依赖此行为（`is` 判断），因为这只是 CPython 的实现优化，其他 Python 实现可能不保证。

### 4.3 old='' 的实现逻辑

当 `old` 为空字符串时，`replace` 不能用 `find` 搜索（空字符串匹配任何位置）。CPython 对此做了特殊处理：

```text
old='' 时，replace 的逻辑：
1. 遍历字符串的每个位置（包括首尾）
2. 在每个位置插入 new
3. 结果 = new + s[0] + new + s[1] + new + ... + new
```

这就是为什么 `"abc".replace("", "X")` 得到 `"XaXbXcX"` ——在每个字符前后都插入了 `X`。

### 4.4 不可变性与性能

字符串在 Python 中是不可变对象。`replace` 的实现要点：

1. **不修改原字符串**——原字符串的内存内容是只读的
2. **使用可变列表构建结果**——在构建过程中使用 `list` 收集各段，避免频繁创建中间字符串
3. **最后合并**——用 `''.join(result)` 一次性创建新字符串
4. **短路优化**——如果 `count=0` 或字符串为空，直接返回不创建新对象

```python
# 验证 replace 创建新对象
s = "hello"
result = s.replace("o", "0")
print(f"  原串 id: {id(s)}")
print(f"  结果 id: {id(result)}")
print(f"  不同对象: {s is not result}")
```

运行结果：

```text
  原串 id: 4301234560
  结果 id: 4301234672
  不同对象: True
```

### 4.5 不支持重叠匹配

`replace` 不支持重叠匹配——找到匹配后，搜索位置会跳过整个 `old`：

```python
s = "aaa"
result = s.replace("aa", "X")
print(f"  {s!r}.replace('aa', 'X') = {result!r}")
```

运行结果：

```text
  'aaa'.replace('aa', 'X') = 'Xa'
```

**关键点说明**：

- `"aaa"` 中 `aa` 的匹配位置是 0（`aa`），替换后字符串变 `Xa`
- 搜索位置跳过 `aa` 的长度（2），只剩下 `a`，不再匹配
- 不会出现 `aXa` 这种重叠替换结果

## 5. 总结

本文围绕 `str.replace()` 方法展开，主要介绍了以下内容：

- `str.replace(old, new, count=-1)`：将字符串中所有匹配的 `old` 替换为 `new`，返回新字符串，原串不变
- `old` 可以是单字符或多字符字符串，这是 `replace` 比 `translate` 更灵活的地方
- `new` 可以是任意字符串，包括空字符串（此时效果为删除子串）
- `count` 参数限制最大替换次数（从左端开始计数），默认 `-1` 表示替换全部，`count=0` 不替换（返回原串）
- 所有负数 `count` 等同于 `-1`（替换全部），`count=0` 时 CPython 优化为直接返回原对象
- `replace` 是大小写敏感的——只替换精确匹配的子串，需要大小写不敏感替换时用 `re.sub` 配合 `re.IGNORECASE`
- `new=""` 时等价于删除子串——`replace(old, "")` 删除所有位置的 `old`，与 `strip` 只删首尾不同
- `old=""` 是边界行为——在每两个字符之间（包括首尾）插入 `new`，如 `"abc".replace("", "X")` 得到 `"XaXbXcX"`
- 链式 `replace` 可能产生连锁替换问题——后续步骤可能替换掉前面步骤产生的结果，需要用 `translate` 避免
- `replace` vs `translate`：`replace` 支持多字符子串替换和次数限制，`translate` 支持一次性多字符映射替换且不会连锁
- 替换单个子串用 `replace`，同时替换多个单字符用 `translate`，限制替换次数用 `replace` 的 `count` 参数
- `replace` 不支持重叠匹配——找到匹配后搜索位置跳过整个 `old` 的长度
- 最佳实践：只替换第一个用 `count=1`、删除子串用 `new=""`、多字符映射用 `translate`、大小写不敏感用 `re.sub`
- `replace` 在 CPython 中由 C 实现，使用可变列表构建结果后一次性合并为新字符串，性能高效但链式调用会产生多个中间对象
