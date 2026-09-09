---
group:
  title: 【03】字符串介绍
  order: 3
order: 23
title: partition 与 rpartition 方法
nav:
  title: Python基础
  order: 1
---

# partition 与 rpartition 方法

## 1. 介绍

### 1.1 知识点定义

`partition` 和 `rpartition` 是 Python 字符串的分割方法，它们将字符串在**指定分隔符处分割为三部分**，返回一个三元组 `tuple[str, str, str]`。

| 方法 | 签名 | 分割方向 |
|------|------|---------|
| `str.partition(sep)` | 返回 `tuple[str, str, str]` | 从左端第一处分隔符 |
| `str.rpartition(sep)` | 返回 `tuple[str, str, str]` | 从右端最后一处分隔符 |

返回的三元组结构为 `(分隔符前的部分, 分隔符本身, 分隔符后的部分)`。

与 `split` 的区别在于：`partition` 总是返回三个元素（包含分隔符本身），且分隔符不存在时有明确的"空字符串"标记——这使得它非常适合"键值对提取""按分隔符解析结构化字符串"等场景，可以安全地解包而无需担心元素数量不匹配。

### 1.2 最简示例

先用最简单的代码直观感受这两个方法：

```python
# partition：从左端第一处分隔符分割
result = "key=value=extra".partition("=")
print(result)
# ('key', '=', 'value=extra')

# rpartition：从右端最后一处分隔符分割
result = "key=value=extra".rpartition("=")
print(result)
# ('key=value', '=', 'extra')
```

运行结果：

```text
('key', '=', 'value=extra')
('key=value', '=', 'extra')
```

使用解包语法优雅地提取三部分：

```python
key, sep, value = "name=Alice".partition("=")
print(f"key={key}, sep={sep!r}, value={value}")
# key=name, sep='=', value=Alice
```

### 1.3 在字符串方法体系中的位置

`partition` 和 `rpartition` 属于"字符串拆分与连接"类操作：

```text
字符串方法体系
├── 查找类：find / rfind / index / count / in
├── 判断类：isalpha / isdigit / isupper / islower ...
├── 拆分与连接类（本篇）：
│   ├── split / rsplit          ← 按分隔符拆分为列表
│   ├── splitlines              ← 按行拆分
│   ├── partition / rpartition   ← 按分隔符拆分为三元组（本篇）
│   └── join                    ← 将列表合并为字符串
├── 替换类：replace / translate / maketrans
├── 大小写转换类：upper / lower / title / capitalize / swapcase / casefold
├── 对齐填充类：ljust / rjust / center / zfill
└── 清洗类：strip / lstrip / rstrip / removeprefix / removesuffix
```

`partition` 的核心特点：

- **返回三元组**——总是三个元素 `(前, 分隔符, 后)`，不多不少
- **包含分隔符本身**——第二个元素就是分隔符字符串，不是去除后的结果
- **分隔符不存在时也不报错**——返回 `(原串, '', '')` 或 `('', '', 原串)`，始终是三个元素
- **解包安全**——因为始终三个元素，`before, sep, after = s.partition(x)` 永远不会报 ValueError
- **只分割一处**——不像 `split` 那样按所有分隔符分割成列表

## 2. 核心内容

### 2.1 str.partition()

#### 2.1.1 方法签名

```python
str.partition(sep) -> tuple[str, str, str]
```

`partition` 接收一个必需参数：

- **sep**：分隔符字符串。可以是单个字符，也可以是多字符字符串。不能为空字符串（会抛出 `ValueError`）

返回值是一个三元组 `(head, sep, tail)`：

- **head**：第一个分隔符之前的部分
- **sep**：分隔符本身（找到时）或空字符串（未找到时）
- **tail**：第一个分隔符之后的部分（包含剩余所有分隔符和内容）

#### 2.1.2 基本分割

```python
s = "key=value"
result = s.partition("=")
print(f"  {s!r}.partition('=') = {result}")
print(f"  类型: {type(result).__name__}")
print(f"  前部分: {result[0]!r}")
print(f"  分隔符: {result[1]!r}")
print(f"  后部分: {result[2]!r}")
```

运行结果：

```text
  'key=value'.partition('=') = ('key', '=', 'value')
  类型: tuple
  前部分: 'key'
  分隔符: '='
  后部分: 'value'
```

**关键点说明**：

- 返回类型是 `tuple`（不是 `list`），三元组结构固定
- 第二个元素是分隔符本身 `'='`，不是被去除后的结果
- 第三个元素 `'value'` 是分隔符后方的完整内容

#### 2.1.3 多个分隔符时只分割第一个

`partition` 只在**第一个**分隔符处分割，后续的分隔符保留在后部分中。

```python
cases = [
    ("a=b=c", "="),
    ("2024-01-15", "-"),
    ("path/to/file/name.txt", "/"),
    ("hello world foo bar", " "),
]
for s, sep in cases:
    result = s.partition(sep)
    print(f"  {s!r}.partition({sep!r}) = {result}")
```

运行结果：

```text
  'a=b=c'.partition('=') = ('a', '=', 'b=c')
  '2024-01-15'.partition('-') = ('2024', '-', '01-15')
  'path/to/file/name.txt'.partition('/') = ('path', '/', 'to/file/name.txt')
  'hello world foo bar'.partition(' ') = ('hello', ' ', 'world foo bar')
```

**关键点说明**：

- `"a=b=c".partition("=")` 只分割第一个 `=`——后部分 `'b=c'` 中的 `=` 保留原样
- 这与 `split("=", maxsplit=1)` 的分割位置相同，但 `partition` 额外包含了分隔符本身

#### 2.1.4 解包语法

`partition` 的三元组结构非常适合用解包语法提取三部分：

```python
cases = [
    ("name=Alice", "="),
    ("host:8080", ":"),
    ("C:\\Users\\admin", "\\"),
]
for s, sep in cases:
    before, sep_char, after = s.partition(sep)
    print(f"  {s!r}: before={before!r}, sep={sep_char!r}, after={after!r}")
```

运行结果：

```text
  'name=Alice': before='name', sep='=', after='Alice'
  'host:8080': before='host', sep=':', after='8080'
  'C:\\Users\\admin': before='C:', sep='\\', after='Users\\admin'
```

解包语法的好处在于代码简洁——一行就提取了三部分，无需用索引访问。

#### 2.1.5 多字符分隔符

`partition` 的 `sep` 参数可以是任意长度的字符串：

```python
cases = [
    ("start==>end", "==>"),
    ("key::value", "::"),
    ("name: Alice, age: 30", ": "),
]
for s, sep in cases:
    result = s.partition(sep)
    print(f"  {s!r}.partition({sep!r}) = {result}")
```

运行结果：

```text
  'start==>end'.partition('==>') = ('start', '==>', 'end')
  'key::value'.partition('::') = ('key', '::', 'value')
  'name: Alice, age: 30'.partition(': ') = ('name', ': ', 'Alice, age: 30')
```

#### 2.1.6 空字符串分隔符报错

`sep` 不能是空字符串——因为空字符串无法确定分割位置：

```python
try:
    "hello".partition("")
except ValueError as e:
    print(f"  'hello'.partition('') -> ValueError: {e}")
```

运行结果：

```text
  'hello'.partition('') -> ValueError: empty separator
```

#### 2.1.7 分隔符不存在时的行为

当字符串中不包含分隔符时，`partition` 返回 `(原串, '', '')`——原串放在第一个位置，后两个元素为空字符串：

```python
cases = [
    ("hello", "="),
    ("no space here", ","),
    ("12345", "-"),
]
for s, sep in cases:
    result = s.partition(sep)
    print(f"  {s!r}.partition({sep!r}) = {result}")
```

运行结果：

```text
  'hello'.partition('=') = ('hello', '', '')
  'no space here'.partition(',') = ('no space here', '', '')
  '12345'.partition('-') = ('12345', '', '')
```

**关键点说明**：

- 分隔符不存在时，`partition` 始终返回三个元素——不会报错，不会减少元素数量
- 原串放在第一个位置（`head`），`sep` 和 `tail` 都为空字符串
- 这使得 `before, sep, after = s.partition(x)` 解包永远安全——即使分隔符不存在也不会 ValueError

### 2.2 str.rpartition()

#### 2.2.1 方法签名

```python
str.rpartition(sep) -> tuple[str, str, str]
```

`rpartition` 的参数与 `partition` 完全相同。唯一区别是：`rpartition` 在**最后一个**分隔符处分割，而 `partition` 在**第一个**分隔符处分割。

#### 2.2.2 从右端分割

```python
s = "key=value=extra"
result = s.rpartition("=")
print(f"  {s!r}.rpartition('=') = {result}")
print(f"  前部分: {result[0]!r}")
print(f"  分隔符: {result[1]!r}")
print(f"  后部分: {result[2]!r}")
```

运行结果：

```text
  'key=value=extra'.rpartition('=') = ('key=value', '=', 'extra')
  前部分: 'key=value'
  分隔符: '='
  后部分: 'extra'
```

**关键点说明**：

- `rpartition` 从右端找到最后一个 `=` 进行分割
- 前部分 `'key=value'` 保留了前面所有的 `=`
- 后部分 `'extra'` 是最后一个 `=` 之后的内容

#### 2.2.3 在最后一个分隔符处分割

```python
cases = [
    ("key=value=extra", "="),
    ("2024-01-15 10:30:45", ":"),
    ("path/to/file/name.txt", "/"),
    ("a.b.c.d.txt", "."),
    ("hello world foo bar", " "),
]
for s, sep in cases:
    result = s.rpartition(sep)
    print(f"  {s!r}.rpartition({sep!r}) = {result}")
```

运行结果：

```text
  'key=value=extra'.rpartition('=') = ('key=value', '=', 'extra')
  '2024-01-15 10:30:45'.rpartition(':') = ('2024-01-15 10:30', ':', '45')
  'path/to/file/name.txt'.rpartition('/') = ('path/to/file', '/', 'name.txt')
  'a.b.c.d.txt'.rpartition('.') = ('a.b.c.d', '.', 'txt')
  'hello world foo bar'.rpartition(' ') = ('hello world foo', ' ', 'bar')
```

#### 2.2.4 分隔符不存在时的行为

当字符串中不包含分隔符时，`rpartition` 返回 `('', '', 原串)`——原串放在**第三个**位置（`tail`），前两个元素为空字符串：

```python
cases = [
    ("hello", "="),
    ("no space here", ","),
    ("12345", "-"),
]
for s, sep in cases:
    result = s.rpartition(sep)
    print(f"  {s!r}.rpartition({sep!r}) = {result}")
```

运行结果：

```text
  'hello'.rpartition('=') = ('', '', 'hello')
  'no space here'.rpartition(',') = ('', '', 'no space here')
  '12345'.rpartition('-') = ('', '', '12345')
```

**关键点说明**：

- `rpartition` 分隔符不存在时，原串放在**第三个位置**（`tail`）
- 这与 `partition` 的 `(原串, '', '')`（原串在 `head`）方向相反
- 设计逻辑：`partition` 从左端开始找，找不到时原串在左端；`rpartition` 从右端开始找，找不到时原串在右端

### 2.3 partition 与 rpartition 的方向差异

#### 2.3.1 分割方向对比

当字符串中有多个分隔符时，`partition` 和 `rpartition` 的分割位置不同：

```python
cases = [
    ("key=value=extra", "="),
    ("a/b/c/d", "/"),
    ("2024-01-15", "-"),
    ("hello world foo bar", " "),
]
for s, sep in cases:
    p = s.partition(sep)
    r = s.rpartition(sep)
    match = "相同" if p == r else "不同"
    print(f"  {s!r}, sep={sep!r}:")
    print(f"    partition()  = {p}  <- 从左端第一处分割")
    print(f"    rpartition() = {r}  <- 从右端最后一处分割")
    print(f"    [{match}]")
```

运行结果：

```text
  'key=value=extra', sep='=':
    partition()  = ('key', '=', 'value=extra')  <- 从左端第一处分割
    rpartition() = ('key=value', '=', 'extra')  <- 从右端最后一处分割
    [不同]
  'a/b/c/d', sep='/':
    partition()  = ('a', '/', 'b/c/d')  <- 从左端第一处分割
    rpartition() = ('a/b/c', '/', 'd')  <- 从右端最后一处分割
    [不同]
  '2024-01-15', sep='-':
    partition()  = ('2024', '-', '01-15')  <- 从左端第一处分割
    rpartition() = ('2024-01', '-', '15')  <- 从右端最后一处分割
    [不同]
  'hello world foo bar', sep=' ':
    partition()  = ('hello', ' ', 'world foo bar')  <- 从左端第一处分割
    rpartition() = ('hello world foo', ' ', 'bar')  <- 从右端最后一处分割
    [不同]
```

#### 2.3.2 分割方向图解

```text
原始：'1-2-3-4-5'

partition 从左端第一处分割：
  ('1', '-', '2-3-4-5')
  ← 保留右侧所有内容

rpartition 从右端最后一处分割：
  ('1-2-3-4', '-', '5')
              → 保留左侧所有内容

只有一个分隔符时：
  '1-2'
  partition  → ('1', '-', '2')
  rpartition → ('1', '-', '2')   ← 结果相同
```

#### 2.3.3 只有一个分隔符时两者相同

当字符串中只有一个分隔符时，`partition` 和 `rpartition` 的结果完全相同——因为第一个和最后一个分隔符是同一个：

```python
cases = [
    ("key=value", "="),
    ("a/b", "/"),
    ("hello world", " "),
]
for s, sep in cases:
    p = s.partition(sep)
    r = s.rpartition(sep)
    print(f"  {s!r}: partition={p}, rpartition={r}, 相同={p == r}")
```

运行结果：

```text
  'key=value': partition=('key', '=', 'value'), rpartition=('key', '=', 'value'), 相同=True
  'a/b': partition=('a', '/', 'b'), rpartition=('a', '/', 'b'), 相同=True
  'hello world': partition=('hello', ' ', 'world'), rpartition=('hello', ' ', 'world'), 相同=True
```

### 2.4 边界行为汇总

#### 2.4.1 分隔符不存在时的方向差异

```python
s = "hello"
sep = "="
p = s.partition(sep)
r = s.rpartition(sep)
print(f"  原始: {s!r}, 分隔符: {sep!r}")
print(f"  partition():  {p}  <- ('hello', '', '')  原串在左侧")
print(f"  rpartition(): {r}  <- ('', '', 'hello')  原串在右侧")
```

运行结果：

```text
  原始: 'hello', 分隔符: '='
  partition():  ('hello', '', '')  <- ('hello', '', '')  原串在左侧
  rpartition(): ('', '', 'hello')  <- ('', '', 'hello')  原串在右侧
```

| 分隔符不存在 | head | sep | tail | 说明 |
|-------------|------|-----|------|------|
| `partition(sep)` | 原串 | `''` | `''` | 原串在前面（因为没有找到分隔符，前面所有内容就是原串） |
| `rpartition(sep)` | `''` | `''` | 原串 | 原串在后面（因为没有找到分隔符，后面所有内容就是原串） |

#### 2.4.2 空字符串

```python
p = "".partition("=")
r = "".rpartition("=")
print(f"  ''.partition('=')   = {p}")
print(f"  ''.rpartition('=')  = {r}")
```

运行结果：

```text
  ''.partition('=')   = ('', '', '')
  ''.rpartition('=')  = ('', '', '')
```

两者都返回 `('', '', '')`——空字符串不包含任何分隔符，三个元素都为空。

#### 2.4.3 分隔符在开头

```python
cases = [
    ("=value", "="),
    (",Alice,30", ","),
    ("/usr/local", "/"),
]
for s, sep in cases:
    p = s.partition(sep)
    r = s.rpartition(sep)
    print(f"  {s!r}.partition({sep!r})  = {p}")
    print(f"  {s!r}.rpartition({sep!r}) = {r}")
```

运行结果：

```text
  '=value'.partition('=')  = ('', '=', 'value')
  '=value'.rpartition('=') = ('', '=', 'value')
  ',Alice,30'.partition(',')  = ('', ',', 'Alice,30')
  ',Alice,30'.rpartition(',') = (',Alice', ',', '30')
  '/usr/local'.partition('/')  = ('', '/', 'usr/local')
  '/usr/local'.rpartition('/') = ('/usr', '/', 'local')
```

**关键点说明**：

- 分隔符在开头时，`partition` 的 `head` 为空字符串
- 如果只有一个分隔符（如 `"=value"`），两者结果相同
- 如果有多个分隔符（如 `",Alice,30"`），结果不同

#### 2.4.4 分隔符在末尾

```python
cases = [
    ("value=", "="),
    ("Alice,", ","),
    ("path/to/", "/"),
]
for s, sep in cases:
    p = s.partition(sep)
    r = s.rpartition(sep)
    print(f"  {s!r}.partition({sep!r})  = {p}")
    print(f"  {s!r}.rpartition({sep!r}) = {r}")
```

运行结果：

```text
  'value='.partition('=')  = ('value', '=', '')
  'value='.rpartition('=') = ('value', '=', '')
  'Alice,'.partition(',')  = ('Alice', ',', '')
  'Alice,'.rpartition(',') = ('Alice', ',', '')
  'path/to/'.partition('/')  = ('path', '/', 'to/')
  'path/to/'.rpartition('/') = ('path/to', '/', '')
```

**关键点说明**：

- 分隔符在末尾时，`tail` 为空字符串
- 如果只有一个分隔符（如 `"value="`），两者结果相同
- 如果有多个分隔符（如 `"path/to/"`），`rpartition` 的 `head` 包含了前面的所有分隔符

#### 2.4.5 连续分隔符

```python
cases = [
    ("a==b", "="),
    ("a,,b", ","),
    ("a==b==c", "=="),
]
for s, sep in cases:
    p = s.partition(sep)
    r = s.rpartition(sep)
    print(f"  {s!r}.partition({sep!r})  = {p}")
    print(f"  {s!r}.rpartition({sep!r}) = {r}")
```

运行结果：

```text
  'a==b'.partition('=')  = ('a', '=', '=b')
  'a==b'.rpartition('=') = ('a=', '=', 'b')
  'a,,b'.partition(',')  = ('a', ',', ',b')
  'a,,b'.rpartition(',') = ('a,', ',', 'b')
  'a==b==c'.partition('==')  = ('a', '==', 'b==c')
  'a==b==c'.rpartition('==') = ('a==b', '==', 'c')
```

**关键点说明**：

- `partition` 从左端找到第一个分隔符，后面保留
- `rpartition` 从右端找到最后一个分隔符，前面保留
- 连续分隔符的行为方向差异在这里体现得很明显

### 2.5 partition vs split 对比

#### 2.5.1 返回类型差异

```python
s = "key=value=extra"
sep = "="
p = s.partition(sep)
sp = s.split(sep, maxsplit=1)
print(f"  {s!r}, sep={sep!r}:")
print(f"    partition()           = {p}   类型={type(p).__name__}")
print(f"    split(maxsplit=1)      = {sp}  类型={type(sp).__name__}")
```

运行结果：

```text
  'key=value=extra', sep='=':
    partition()           = ('key', '=', 'value=extra')   类型=tuple
    split(maxsplit=1)      = ['key', 'value=extra']  类型=list
```

| 维度 | `partition(sep)` | `split(sep, maxsplit=1)` |
|------|-----------------|------------------------|
| 返回类型 | `tuple` | `list` |
| 元素数量 | 3 | 1 或 2 |
| 包含分隔符 | 是（第 2 个元素） | 否 |
| 不存在时 | `(原串, '', '')` | `[原串]` |

#### 2.5.2 解包安全性的关键差异

`partition` 始终返回三个元素，解包永远安全。`split(sep, maxsplit=1)` 在分隔符不存在时只返回一个元素，解包会报错：

```python
pairs = ["name=Alice", "no_separator", "formula=y=mx+b"]
sep = "="

print("  partition 解包（始终安全）:")
for pair in pairs:
    before, mid, after = pair.partition(sep)
    print(f"    {pair!r}: before={before!r}, mid={mid!r}, after={after!r}")

print()
print("  split 解包（分隔符不存在时报错）:")
for pair in pairs:
    try:
        before, after = pair.split(sep, maxsplit=1)
        print(f"    {pair!r}: before={before!r}, after={after!r}")
    except ValueError as e:
        print(f"    {pair!r}: ValueError - {e}")
```

运行结果：

```text
  partition 解包（始终安全）:
    'name=Alice': before='name', mid='=', after='Alice'
    'no_separator': before='no_separator', mid='', after=''
    'formula=y=mx+b': before='formula', mid='=', after='y=mx+b'

  split 解包（分隔符不存在时报错）:
    'name=Alice': before='name', after='Alice'
    'no_separator': ValueError - not enough values to unpack (expected 2, got 1)
    'formula=y=mx+b': before='formula', after='y=mx+b'
```

**关键点说明**：

- `partition` 解包时即使分隔符不存在也不会报错——`before` 是原串，`mid` 和 `after` 是空字符串
- `split(sep, maxsplit=1)` 解包时分隔符不存在会 ValueError——因为列表只有一个元素，无法解包成两个变量
- 这是 `partition` 在"键值对解析"场景下比 `split` 更安全的核心原因

#### 2.5.3 结果重建原字符串

`partition` 的结果可以直接拼接重建原字符串——因为分隔符被保留在第二个元素中：

```python
cases = [
    ("key=value", "="),
    ("a/b/c", "/"),
    ("no_sep", ":"),
]
for s, sep in cases:
    before, mid, after = s.partition(sep)
    reconstructed = before + mid + after
    print(f"  {s!r}.partition({sep!r}) = ({before!r}, {mid!r}, {after!r})")
    print(f"    重建: {reconstructed!r}, 一致: {s == reconstructed}")
```

运行结果：

```text
  'key=value'.partition('=') = ('key', '=', 'value')
    重建: 'key=value', 一致: True
  'a/b/c'.partition('/') = ('a', '/', 'b/c')
    重建: 'a/b/c', 一致: True
  'no_sep'.partition(':') = ('no_sep', '', '')
    重建: 'no_sep', 一致: True
```

**关键点说明**：

- `before + mid + after` 始终等于原字符串——无论分隔符是否存在
- 因为 `partition` 保留了分隔符本身，拼接时自然还原
- `split` 的结果不包含分隔符，无法直接拼接还原

#### 2.5.4 完整对比表

| 维度 | `partition(sep)` | `rpartition(sep)` | `split(sep, maxsplit=1)` |
|------|-----------------|------------------|------------------------|
| 返回类型 | `tuple[str,str,str]` | `tuple[str,str,str]` | `list[str]` |
| 元素数量 | 3 | 3 | 1 或 2 |
| 分割方向 | 从左端第一处 | 从右端最后一处 | 从左端第一处 |
| 包含分隔符 | 是（第 2 个元素） | 是（第 2 个元素） | 否 |
| 不存在时 | `(原串, '', '')` | `('', '', 原串)` | `[原串]` |
| 可解包 | 始终安全（3 元素） | 始终安全（3 元素） | 可能报错（1 元素） |
| 空 sep | 报 `ValueError` | 报 `ValueError` | 报 `ValueError` |
| 结果可重建 | `before+mid+after` | `head+mid+tail` | 不可以（丢失分隔符） |

## 3. 最佳实践

### 3.1 键值对提取

**推荐写法**

```python
# 推荐：partition 安全解包，值中可含分隔符
key, sep, value = "formula=y=mx+b".partition("=")
if sep:
    print(f"key={key}, value={value}")
```

运行结果：

```text
key=formula, value=y=mx+b
```

**不推荐写法**

```python
# 不推荐：split 解包在分隔符不存在时报错
key, value = "formula=y=mx+b".split("=", maxsplit=1)  # 可能有 ValueError
```

### 3.2 取文件扩展名

**推荐写法**

```python
# 推荐：rpartition('.') 从右端分割，处理多 . 文件名
name, dot, ext = "report.tar.gz".rpartition(".")
if dot:
    print(f"name={name}, ext={dot + ext}")
# name=report.tar, ext=.gz
```

**不推荐写法**

```python
# 不推荐：split('.', 1) 从左端分割，取到的是中间部分
parts = "report.tar.gz".split(".", maxsplit=1)
# ['report', 'tar.gz']  <- 不是期望的文件名和扩展名
```

### 3.3 取路径最后一段

**推荐写法**

```python
# 推荐：rpartition('/') 从右端分割
parent, slash, name = "/usr/local/bin/python3".rpartition("/")
print(f"目录={parent}, 文件名={name}")
# 目录=/usr/local/bin, 文件名=python3
```

### 3.4 URL 协议提取

```python
# 用 partition 提取 URL 协议
urls = [
    "https://example.com/page",
    "http://localhost:8080/api",
    "no-scheme-url",
]
for url in urls:
    scheme, sep, rest = url.partition("://")
    if sep:
        print(f"  {url} -> 协议={scheme}, 路径={rest}")
    else:
        print(f"  {url} -> 无协议")
```

运行结果：

```text
  https://example.com/page -> 协议=https, 路径=example.com/page
  http://localhost:8080/api -> 协议=http, 路径=localhost:8080/api
  no-scheme-url -> 无协议
```

### 3.5 邮箱地址解析

```python
emails = ["alice@example.com", "user.name+tag@mail.example.co.uk", "invalid"]
for email in emails:
    local, at, domain = email.partition("@")
    if at:
        print(f"  {email} -> local={local}, domain={domain}")
    else:
        print(f"  {email} -> 无 @（不合法邮箱）")
```

运行结果：

```text
  alice@example.com -> local=alice, domain=example.com
  user.name+tag@mail.example.co.uk -> local=user.name+tag, domain=mail.example.co.uk
  invalid -> 无 @（不合法邮箱）
```

### 3.6 方法选择决策表

| 场景 | 推荐方法 | 说明 |
|------|---------|------|
| 键值对提取（分隔符在前） | `partition('=')` | 值中可能含 `=` |
| 取文件扩展名 | `rpartition('.')` | 处理多 `.` 文件名 |
| 取路径最后一段 | `rpartition('/')` | 从右端分割 |
| 取 URL 协议 | `partition('://')` | 只分割第一个 `://` |
| 解析邮箱 | `partition('@')` | `local@domain` |
| 需要分隔符本身 | `partition` | `split` 不保留分隔符 |
| 分隔符可能不存在 | `partition` | 始终返回 3 元素，安全解包 |
| 按分隔符分割为多条 | `split(sep)` | 需要多段时用 `split` |
| 按空白分词 | `split()` | 不适用 `partition` |

## 4. 原理

### 4.1 partition 的查找与分割逻辑

`partition` 的内部实现基于 `find` 方法：

```text
函数 partition(s, sep):
    if sep == '':
        raise ValueError("empty separator")
    pos = s.find(sep)        # 从左端查找第一个 sep 的位置
    if pos == -1:
        # 未找到分隔符：原串在 head
        return (s, '', '')
    else:
        head = s[:pos]
        tail_pos = pos + len(sep)
        tail = s[tail_pos:]
        return (head, sep, tail)
```

核心要点：

1. `partition` 内部调用 `find` 从左端查找分隔符
2. 找到后，`head` 是分隔符前的切片，`tail` 是分隔符后的切片
3. 二元素 `sep` 被原样保留在三元组的中间位置
4. 未找到时返回 `(s, '', '')`——原串放在 `head`

### 4.2 rpartition 的反向查找逻辑

`rpartition` 的内部实现基于 `rfind` 方法：

```text
函数 rpartition(s, sep):
    if sep == '':
        raise ValueError("empty separator")
    pos = s.rfind(sep)       # 从右端查找最后一个 sep 的位置
    if pos == -1:
        # 未找到分隔符：原串在 tail
        return ('', '', s)
    else:
        head = s[:pos]
        tail_pos = pos + len(sep)
        tail = s[tail_pos:]
        return (head, sep, tail)
```

核心要点：

1. `rpartition` 内部调用 `rfind` 从右端查找分隔符
2. 找到后的切片逻辑与 `partition` 相同
3. 未找到时返回 `('', '', s)`——原串放在 `tail`（因为 `rfind` 是从右端查找的，找不到时语义上是"右侧所有内容即原串"）

### 4.3 为什么 partition 返回三元组

`partition` 的设计目标是"结构化拆分"——将字符串分成"前部分 + 分隔符 + 后部分"三个有意义的部分。

与 `split(sep, maxsplit=1)` 返回的 2 元素列表相比，三元组有三个优势：

1. **始终三个元素**——解包永远安全，不需要 `try-except` 处理元素数量不匹配
2. **包含分隔符**——拼接 `head + sep + tail` 即可重建原字符串
3. **分隔符不存在时有明确的空标记**——`sep` 为空字符串表示"没有找到分隔符"

这种设计使得 `partition` 在"解析键值对""提取协议/路径/文件名"等场景中比 `split` 更安全和方便。

### 4.4 为什么分隔符不存在时方向不同

`partition` 找不到分隔符时返回 `(原串, '', '')`，`rpartition` 找不到分隔符时返回 `('', '', 原串)`——这个差异源于它们的查找方向。

**`partition` 的逻辑**：从左端开始找，方法是 `find`。`find` 找不到时返回 `-1`，意味着"没有从头找到分隔符"。因此，整个字符串就是"分隔符之前的内容"（`head`），分隔符之后没有内容（`tail` 为空）。

**`rpartition` 的逻辑**：从右端开始找，方法是 `rfind`。`rfind` 找不到时返回 `-1`，意味着"没有从尾找到分隔符"。因此，整个字符串就是"分隔符之后的内容"（`tail`），分隔符之前没有内容（`head` 为空）。

```python
# 验证方向差异
s = "hello"
sep = "="
print(f"  partition:  {s.partition(sep)}   <- find 找不到，原串在 head")
print(f"  rpartition: {s.rpartition(sep)}  <- rfind 找不到，原串在 tail")
```

运行结果：

```text
  partition:  ('hello', '', '')   <- find 找不到，原串在 head
  rpartition: ('', '', 'hello')  <- rfind 找不到，原串在 tail
```

### 4.5 不可变性与返回新对象

`partition` 和 `rpartition` 都不会修改原字符串，而是创建并返回一个新的 `tuple` 对象：

```python
original = "key=value"
result = original.partition("=")
print(f"  原始: {original!r}")
print(f"  partition(): {result}")
print(f"  原始未被修改: {original == 'key=value'}")
print(f"  返回类型: {type(result).__name__}")
```

运行结果：

```text
  原始: 'key=value'
  partition(): ('key', '=', 'value')
  原始未被修改: True
  返回类型: tuple
```

`partition` 返回的 `tuple` 和其中的每个 `str` 元素都是新创建的切片对象——对返回值的修改不会影响原字符串（也无法影响，因为字符串和元组都不可变）。

### 4.6 结果重建原字符串

`partition` 的结果 `head + sep + tail` 始终等于原字符串——这使得 `partition` 可以用于"分割 -> 修改 -> 拼接"的流程中：

```python
# 分割 -> 修改 head -> 拼接重建
s = "prefix_middle_suffix"
head, mid, tail = s.partition("_")
# head='prefix', mid='_', tail='middle_suffix'
modified = "NEW" + mid + tail
# 'NEW_middle_suffix'
print(f"  修改后: {modified!r}")
```

运行结果：

```text
  修改后: 'NEW_middle_suffix'
```

这种"分割 -> 修改 -> 拼接"的流程在实际开发中很常见——例如替换字符串的第一个匹配项：

```python
def replace_first(s, old, new):
    head, sep, tail = s.partition(old)
    if sep:
        return head + new + tail
    return s

print(replace_first("hello world world", "world", "Python"))
```

运行结果：

```text
hello Python world
```

## 5. 总结

本文围绕 `str.partition()` 和 `str.rpartition()` 方法展开，主要介绍了以下内容：

- `str.partition(sep)`：在第一个分隔符处将字符串分割为三元组 `(head, sep, tail)`，返回 `tuple[str, str, str]`；分隔符不存在时返回 `(原串, '', '')`
- `str.rpartition(sep)`：在最后一个分隔符处将字符串分割为三元组 `(head, sep, tail)`，返回 `tuple[str, str, str]`；分隔符不存在时返回 `('', '', 原串)`
- 多个分隔符时 `partition` 只分割第一处（从左端），`rpartition` 只分割最后一处（从右端）；只有一个分隔符时两者结果相同
- 分隔符不存在时的方向差异：`partition` 把原串放在 `head`（因为 `find` 找不到时字符串全在分隔符之前），`rpartition` 把原串放在 `tail`（因为 `rfind` 找不到时字符串全在分隔符之后）
- 空 `sep` 会触发 `ValueError`——空字符串不能作为分隔符
- 边界行为：空字符串返回 `('', '', '')`、分隔符在开头 `head` 为空、分隔符在末尾 `tail` 为空、连续分隔符按方向分割
- `partition` vs `split(sep, maxsplit=1)` 的核心差异：`partition` 返回 `tuple`（3 元素含分隔符，始终可解包），`split` 返回 `list`（1-2 元素不含分隔符，解包可能报错）
- `partition` 的解包优势：`before, sep, after = s.partition(x)` 永远安全，无需 `try-except`；`split` 解包在分隔符不存在时会 `ValueError`
- `partition` 结果可重建原字符串：`head + sep + tail == 原串`；`split` 结果不包含分隔符，无法直接重建
- 最佳实践：键值对用 `partition('=')`、文件扩展名用 `rpartition('.')`、路径最后一段用 `rpartition('/')`、URL 协议用 `partition('://')`、邮箱解析用 `partition('@')`、需要多段分割用 `split(sep)`
- 原理：`partition` 基于 `find` 从左端查找、`rpartition` 基于 `rfind` 从右端查找；分隔符不存在时原串位置不同是因为查找方向不同；返回三元组的设计使得解包始终安全且结果可重建
