---
group:
  title: 【03】字符串介绍
  order: 3
order: 21
title: split 与 rsplit 方法
nav:
  title: Python基础
  order: 1
---

# split 与 rsplit 方法

## 1. 介绍

### 1.1 知识点定义

字符串拆分是指将一个字符串按指定的分隔符切分成多个子字符串，返回一个列表。Python 提供了两个拆分方法：

| 方法 | 签名 | 分割方向 |
|------|------|---------|
| `str.split(sep=None, maxsplit=-1)` | 返回 `list[str]` | 从左到右 |
| `str.rsplit(sep=None, maxsplit=-1)` | 返回 `list[str]` | 从右到左 |

这两个方法在实际开发中使用频率极高——解析 CSV 行、提取日志字段、切分 URL 路径、处理配置键值对、句子分词等场景都依赖它们。`split` 和 `rsplit` 在不传 `maxsplit` 时行为完全相同，区别仅在于有 `maxsplit` 限制时的分割方向。

### 1.2 最简示例

先用最简单的代码直观感受这两个方法：

```python
# split 基本用法
print("hello world".split())          # ['hello', 'world']
print("a,b,c,d".split(","))           # ['a', 'b', 'c', 'd']
print("a,b,c,d".split(",", maxsplit=2))  # ['a', 'b', 'c,d']

# rsplit 从右端分割
print("a,b,c,d".rsplit(",", maxsplit=1))  # ['a,b,c', 'd']
```

运行结果：

```text
['hello', 'world']
['a', 'b', 'c', 'd']
['a', 'b', 'c,d']
['a,b,c', 'd']
```

### 1.3 在字符串方法体系中的位置

拆分方法属于"字符串拆分与连接"类操作的子集。从功能维度来看：

```text
字符串方法体系
├── 查找类：find / rfind / index / count / in
├── 判断类：isalpha / isdigit / isupper / islower ...
├── 拆分与连接类（本篇）：
│   ├── split / rsplit          ← 按分隔符拆分为列表
│   ├── splitlines              ← 按行拆分
│   ├── partition / rpartition   ← 按分隔符拆分为三元组
│   └── join                    ← 将列表合并为字符串
├── 替换类：replace / translate / maketrans
├── 大小写转换类：upper / lower / title / capitalize / swapcase / casefold
├── 对齐填充类：ljust / rjust / center / zfill
└── 清洗类：strip / lstrip / rstrip / removeprefix / removesuffix
```

拆分方法的核心特点：

- **返回列表**——`split` 和 `rsplit` 都返回 `list[str]`，不是字符串
- **不修改原字符串**——Python 字符串是不可变对象，拆分后原字符串保持不变
- **sep=None vs sep=str 行为完全不同**——`sep=None` 按任意空白分割并忽略首尾连续空白，`sep=str` 精确匹配分隔符
- **maxsplit 限制分割次数**——最多分割 N 次，产生 N+1 个元素，剩余部分作为最后一个元素保留原样

## 2. 核心内容

### 2.1 str.split()

#### 2.1.1 方法签名

```python
str.split(sep=None, maxsplit=-1) -> list[str]
```

`split()` 接收两个可选参数：

- **sep**：分隔符。`sep=None`（默认）时按任意空白字符（空格、制表符 `\t`、换行符 `\n` 等）分割，连续空白视为一个分隔符，首尾空白被忽略。`sep=str` 时按指定字符串精确匹配分割
- **maxsplit**：最大分割次数。默认 `-1` 表示无限制。设为 N 时最多分割 N 次，产生 N+1 个元素，剩余部分作为最后一个元素保留原样

#### 2.1.2 sep=None：按空白分割

当 `sep=None` 时，`split()` 的行为有三个特殊规则：

1. **所有空白类型一视同仁**——空格、制表符 `\t`、换行符 `\n`、回车符 `\r` 等都作为分隔符
2. **连续空白合并为一个分隔符**——不会产生空字符串
3. **首尾空白被忽略**——不会产生首尾的空字符串

**示例**

```python
print("=== split() 不传参 ===")
cases = [
    "hello world",
    "  hello   world  ",
    "hello\tworld\tfoo",
    "hello\nworld\n\nfoo",
    "one  two\tthree\nfour",
    "",
    "   ",
    "a\x20\x20b\x20c",  # 含连续空格
]
for s in cases:
    result = s.split()
    print(f"  {s!r:>30}.split() = {result}")
```

运行结果：

```text
=== split() 不传参 ===
                   'hello world'.split() = ['hello', 'world']
             '  hello   world  '.split() = ['hello', 'world']
             'hello\tworld\tfoo'.split() = ['hello', 'world', 'foo']
           'hello\nworld\n\nfoo'.split() = ['hello', 'world', 'foo']
         'one  two\tthree\nfour'.split() = ['one', 'two', 'three', 'four']
                                ''.split() = []
                           '   '.split() = []
                        'a\x20\x20b\x20c'.split() = ['a', 'b', 'c']
```

**关键点说明**：

- `"  hello   world  ".split()` 返回 `['hello', 'world']`——首尾空格被忽略，连续空格合并为一个分隔符
- `"".split()` 返回 `[]`——空字符串拆分得到空列表
- `"   ".split()` 返回 `[]`——纯空白字符串拆分也是空列表
- `"hello\nworld\n\nfoo".split()` 返回 `['hello', 'world', 'foo']`——连续换行符合并为一个分隔符

#### 2.1.3 sep=str：按指定分隔符分割

当指定 `sep` 为具体字符串时，`split()` 进行精确匹配——分隔符可以是一个字符，也可以是多字符字符串。

**示例**

```python
cases = [
    ("a,b,c,d", ","),
    ("2024-01-15", "-"),
    ("hello world", " "),
    ("a::b::c", "::"),
    ("apple|banana|cherry", "|"),
    ("key=value", "="),
    ("one,two,,four", ","),  # 连续逗号产生空字符串
]
for s, sep in cases:
    result = s.split(sep)
    print(f"  {s!r}.split({sep!r}) = {result}")
```

运行结果：

```text
  'a,b,c,d'.split(',') = ['a', 'b', 'c', 'd']
  '2024-01-15'.split('-') = ['2024', '01', '15']
  'hello world'.split(' ') = ['hello', 'world']
  'a::b::c'.split('::') = ['a', 'b', 'c']
  'apple|banana|cherry'.split('|') = ['apple', 'banana', 'cherry']
  'key=value'.split('=') = ['key', 'value']
  'one,two,,four'.split(',') = ['one', 'two', '', 'four']
```

**关键点说明**：

- 分隔符可以是多字符字符串——`"a::b::c".split("::")` 正确分割为 `['a', 'b', 'c']`
- 连续分隔符会产生空字符串——`"one,two,,four".split(",")` 中两个连续逗号之间产生了 `''`
- 指定 `sep` 后不再自动处理空白——`"hello world".split(" ")` 只按空格分割，不处理制表符或换行符

#### 2.1.4 split() vs split(' ') 的关键差异

`sep=None` 和 `sep=' '` 的行为完全不同——这是 `split` 最常见的陷阱。

**示例**

```python
cases = [
    "hello   world",    # 多个空格
    "  hello  ",        # 首尾空格
    "hello\tworld",     # 制表符
    "",                 # 空串
    "   ",              # 纯空白
]
for s in cases:
    none_result = s.split()
    space_result = s.split(" ")
    print(f"  {s!r:>20}")
    print(f"    split()    = {none_result}")
    print(f"    split(' ') = {space_result}")
```

运行结果：

```text
       'hello   world'
    split()    = ['hello', 'world']
    split(' ') = ['hello', '', '', 'world']
           '  hello  '
    split()    = ['hello']
    split(' ') = ['', '', 'hello', '', '']
        'hello\tworld'
    split()    = ['hello', 'world']
    split(' ') = ['hello\tworld']
                    ''
    split()    = []
    split(' ') = ['']
                 '   '
    split()    = []
    split(' ') = ['', '', '', '']
```

**关键点说明**：

| 行为 | `split()`（sep=None） | `split(' ')`（sep=' '） |
|------|----------------------|----------------------|
| 连续空格 | 合并为一个分隔符 | 每个空格都分割，产生空字符串 |
| 首尾空格 | 忽略 | 产生首尾空字符串 |
| 制表符/换行 | 作为分隔符 | 不作为分隔符（保持原样） |
| 空字符串 | 返回 `[]` | 返回 `['']` |
| 纯空白 | 返回 `[]` | 返回多个空字符串 |

#### 2.1.5 sep='' 报错

`sep` 不能是空字符串——因为空字符串无法确定分隔方式，每个字符之间都可以分割。

**示例**

```python
try:
    "hello".split("")
except ValueError as e:
    print(f"  'hello'.split('') -> ValueError: {e}")
```

运行结果：

```text
  'hello'.split('') -> ValueError: empty separator
```

#### 2.1.6 多字符分隔符

`split` 的 `sep` 参数可以是任意长度的字符串。

**示例**

```python
cases = [
    ("hello world foo bar", " "),
    ("2024-01-15 10:30:45", " "),
    ("a--b--c--d", "--"),
    ("key1=val1&key2=val2&key3=val3", "&"),
    ("start==>middle<==end", "==>"),
]
for s, sep in cases:
    result = s.split(sep)
    print(f"  {s!r}.split({sep!r}) = {result}")
```

运行结果：

```text
  'hello world foo bar'.split(' ') = ['hello', 'world', 'foo', 'bar']
  '2024-01-15 10:30:45'.split(' ') = ['2024-01-15', '10:30:45']
  'a--b--c--d'.split('--') = ['a', 'b', 'c', 'd']
  'key1=val1&key2=val2&key3=val3'.split('&') = ['key1=val1', 'key2=val2', 'key3=val3']
  'start==>middle<==end'.split('==>') = ['start', 'middle<==end']
```

**关键点说明**：

- `"start==>middle<==end".split("==>")` 的结果是 `['start', 'middle<==end']`——只匹配了第一个 `==>`，`<==` 中的 `==` 不匹配 `==>`
- `split` 只做精确字符串匹配，不支持正则表达式——如果需要正则分割，使用 `re.split()`

### 2.2 maxsplit 参数

#### 2.2.1 maxsplit 基本用法

`maxsplit` 限制分割次数——设为 N 时最多分割 N 次，产生 N+1 个元素，剩余部分作为最后一个元素保留原样（包含所有未分割的分隔符）。

**示例**

```python
s = "a,b,c,d,e"
for n in [0, 1, 2, 3, 4, 10]:
    result = s.split(",", maxsplit=n)
    print(f"  {s!r}.split(',', maxsplit={n}) = {result}")
```

运行结果：

```text
  'a,b,c,d,e'.split(',', maxsplit=0) = ['a,b,c,d,e']
  'a,b,c,d,e'.split(',', maxsplit=1) = ['a', 'b,c,d,e']
  'a,b,c,d,e'.split(',', maxsplit=2) = ['a', 'b', 'c,d,e']
  'a,b,c,d,e'.split(',', maxsplit=3) = ['a', 'b', 'c', 'd,e']
  'a,b,c,d,e'.split(',', maxsplit=4) = ['a', 'b', 'c', 'd', 'e']
  'a,b,c,d,e'.split(',', maxsplit=10) = ['a', 'b', 'c', 'd', 'e']
```

**关键点说明**：

- `maxsplit=0` 表示不分割，返回只有一个元素的列表（原字符串本身）
- `maxsplit=N` 产生 N+1 个元素，第 N+1 个元素是剩余的完整内容
- `maxsplit` 超过分隔符数量时，等同于无限制分割

#### 2.2.2 sep=None + maxsplit 的组合

`sep=None`（按空白分割）和 `maxsplit` 可以组合使用。

**示例**

```python
cases = [
    ("hello world foo bar baz", 1),
    ("hello world foo bar baz", 2),
    ("hello world foo bar baz", 0),
    ("  hello   world  foo  ", 1),
    ("  hello   world  foo  ", 2),
]
for s, n in cases:
    result = s.split(maxsplit=n)
    print(f"  {s!r}.split(maxsplit={n}) = {result}")
```

运行结果：

```text
  'hello world foo bar baz'.split(maxsplit=1) = ['hello', 'world foo bar baz']
  'hello world foo bar baz'.split(maxsplit=2) = ['hello', 'world', 'foo bar baz']
  'hello world foo bar baz'.split(maxsplit=0) = ['hello world foo bar baz']
  '  hello   world  foo  '.split(maxsplit=1) = ['hello', 'world  foo  ']
  '  hello   world  foo  '.split(maxsplit=2) = ['hello', 'world', 'foo  ']
```

**关键点说明**：

- `sep=None + maxsplit` 时，首尾空白仍然被忽略，连续空白仍然合并
- 但分割 N 次后，剩余部分保留原样——包括其中的空白字符

#### 2.2.3 maxsplit 实战场景

**场景一：路径分割 — 只分割第一层**

```python
paths = ["/usr/local/bin/python3", "/home/user/docs/report.txt"]
for path in paths:
    parts = path.split("/", maxsplit=1)
    print(f"    {path!r}.split('/', maxsplit=1) = {parts}")
```

运行结果：

```text
    '/usr/local/bin/python3'.split('/', maxsplit=1) = ['', 'usr/local/bin/python3']
    '/home/user/docs/report.txt'.split('/', maxsplit=1) = ['', 'home/user/docs/report.txt']
```

**场景二：只取日志前两列**

```python
log_lines = [
    "INFO 2024-01-15 Server started on port 8080",
    "ERROR 2024-01-15 Connection timeout to database host",
]
for line in log_lines:
    parts = line.split(maxsplit=2)
    level, timestamp, message = parts
    print(f"    级别={level}, 时间={timestamp}, 消息={message!r}")
```

运行结果：

```text
    级别=INFO, 时间=2024-01-15, 消息='Server started on port 8080'
    级别=ERROR, 时间=2024-01-15, 消息='Connection timeout to database host'
```

**场景三：键值对分割（值中可能含等号）**

```python
pairs = ["name=Alice", "formula=y=mx+b", "key=val=ue=test"]
for pair in pairs:
    key, value = pair.split("=", maxsplit=1)
    print(f"    {pair!r} -> key={key!r}, value={value!r}")
```

运行结果：

```text
    'name=Alice' -> key='name', value='Alice'
    'formula=y=mx+b' -> key='formula', value='y=mx+b'
    'key=val=ue=test' -> key='key', value='val=ue=test'
```

**关键点说明**：

- `maxsplit=1` 是处理"键值对"的经典写法——只分割第一个分隔符，值中可以包含分隔符本身
- `"formula=y=mx+b".split("=", maxsplit=1)` 正确得到 `key='formula'`, `value='y=mx+b'`

#### 2.2.4 maxsplit=-1（默认值）

`maxsplit=-1` 表示无限制分割，与不传 `maxsplit` 效果相同。任何负值都表示无限制。

**示例**

```python
s = "a,b,c,d,e"
print(f"  {s!r}.split(',')           = {s.split(',')}")
print(f"  {s!r}.split(',', maxsplit=-1)  = {s.split(',', maxsplit=-1)}")
print(f"  {s!r}.split(',', maxsplit=-100) = {s.split(',', maxsplit=-100)}")
```

运行结果：

```text
  'a,b,c,d,e'.split(',')           = ['a', 'b', 'c', 'd', 'e']
  'a,b,c,d,e'.split(',', maxsplit=-1)  = ['a', 'b', 'c', 'd', 'e']
  'a,b,c,d,e'.split(',', maxsplit=-100) = ['a', 'b', 'c', 'd', 'e']
```

### 2.3 str.rsplit()

#### 2.3.1 方法签名

```python
str.rsplit(sep=None, maxsplit=-1) -> list[str]
```

`rsplit()` 的参数与 `split()` 完全相同。唯一区别是：当指定 `maxsplit` 时，`rsplit` 从字符串右端开始分割，而 `split` 从左端开始分割。

#### 2.3.2 无 maxsplit 时 rsplit == split

不传 `maxsplit`（或 `maxsplit=-1`）时，`rsplit` 和 `split` 的结果完全相同——两者都是完整分割，方向不影响结果。

**示例**

```python
cases = [
    ("a,b,c,d", ","),
    ("hello world foo", None),
    ("2024-01-15", "-"),
    ("one--two--three", "--"),
]
for s, sep in cases:
    if sep is None:
        sp = s.split()
        rs = s.rsplit()
    else:
        sp = s.split(sep)
        rs = s.rsplit(sep)
    match = "相同" if sp == rs else "不同"
    print(f"  {s!r:>25}  split={sp}  rsplit={rs}  {match}")
```

运行结果：

```text
                  'a,b,c,d'  split=['a', 'b', 'c', 'd']  rsplit=['a', 'b', 'c', 'd']  相同
              'hello world foo'  split=['hello', 'world', 'foo']  rsplit=['hello', 'world', 'foo']  相同
                  '2024-01-15'  split=['2024', '01', '15']  rsplit=['2024', '01', '15']  相同
              'one--two--three'  split=['one', 'two', 'three']  rsplit=['one', 'two', 'three']  相同
```

#### 2.3.3 有 maxsplit 时 rsplit 从右端分割

当指定 `maxsplit` 时，`rsplit` 从右端开始分割——保留的是左侧剩余部分。

**示例**

```python
s = "a,b,c,d,e"
for n in [1, 2, 3]:
    sp = s.split(",", maxsplit=n)
    rs = s.rsplit(",", maxsplit=n)
    print(f"  {s!r} maxsplit={n}:")
    print(f"    split()  = {sp}  <- 从左端分割")
    print(f"    rsplit() = {rs}  <- 从右端分割")
```

运行结果：

```text
  'a,b,c,d,e' maxsplit=1:
    split()  = ['a', 'b,c,d,e']  <- 从左端分割
    rsplit() = ['a,b,c,d', 'e']  <- 从右端分割
  'a,b,c,d,e' maxsplit=2:
    split()  = ['a', 'b', 'c,d,e']  <- 从左端分割
    rsplit() = ['a,b,c', 'd', 'e']  <- 从右端分割
  'a,b,c,d,e' maxsplit=3:
    split()  = ['a', 'b', 'c', 'd,e']  <- 从左端分割
    rsplit() = ['a,b', 'c', 'd', 'e']  <- 从右端分割
```

**关键点说明**：

- `split(maxsplit=1)` 从左端找到第一个分隔符分割——保留的是右侧剩余部分
- `rsplit(maxsplit=1)` 从右端找到最后一个分隔符分割——保留的是左侧剩余部分
- `maxsplit=4` 时分割次数已经足够完整分割，两者结果相同

#### 2.3.4 分割方向差异图解

```text
原始：'1-2-3-4-5'

maxsplit=1:
  split  →  ['1', '2-3-4-5']      ← 从左侧切第 1 刀，右侧保留
  rsplit →  ['1-2-3-4', '5']      ← 从右侧切第 1 刀，左侧保留

maxsplit=2:
  split  →  ['1', '2', '3-4-5']   ← 从左侧切 2 刀
  rsplit →  ['1-2-3', '4', '5']   ← 从右侧切 2 刀

maxsplit=3:
  split  →  ['1', '2', '3', '4-5']
  rsplit →  ['1-2', '3', '4', '5']

maxsplit=4 (完整分割):
  split  →  ['1', '2', '3', '4', '5']
  rsplit →  ['1', '2', '3', '4', '5']   ← 结果相同
```

#### 2.3.5 rsplit 实战场景

**场景一：取文件扩展名（从右端分割）**

```python
files = ["report.tar.gz", "photo.jpg", "archive.zip", "no_extension"]
for f in files:
    parts = f.rsplit(".", maxsplit=1)
    if len(parts) == 2:
        name, ext = parts
        print(f"    {f!r} -> name={name!r}, ext={ext!r}")
    else:
        print(f"    {f!r} -> 无扩展名")
```

运行结果：

```text
    'report.tar.gz' -> name='report.tar', ext='gz'
    'photo.jpg' -> name='photo', ext='jpg'
    'archive.zip' -> name='archive', ext='zip'
    'no_extension' -> 无扩展名
```

**场景二：取路径最后一段**

```python
paths = ["/usr/local/bin/python3", "/home/user/docs/report.txt", "/var/log/nginx/access.log"]
for path in paths:
    parts = path.rsplit("/", maxsplit=1)
    parent, name = parts if len(parts) == 2 else ("", parts[0])
    print(f"    {path!r} -> parent={parent!r}, name={name!r}")
```

运行结果：

```text
    '/usr/local/bin/python3' -> parent='/usr/local/bin', name='python3'
    '/home/user/docs/report.txt' -> parent='/home/user/docs', name='report.txt'
    '/var/log/nginx/access.log' -> parent='/var/log/nginx', name='access.log'
```

**场景三：取域名后缀**

```python
domains = ["www.example.com", "mail.google.com", "api.v1.staging.example.co.uk"]
for domain in domains:
    parts = domain.rsplit(".", maxsplit=2)
    print(f"    {domain!r} -> {parts}")
```

运行结果：

```text
    'www.example.com' -> ['www', 'example', 'com']
    'mail.google.com' -> ['mail', 'google', 'com']
    'api.v1.staging.example.co.uk' -> ['api.v1.staging.example', 'co', 'uk']
```

### 2.4 边界行为汇总

#### 2.4.1 空字符串

```python
print(f"  ''.split()       = {''.split()!r}")
print(f"  ''.split(',')    = {''.split(',')!r}")
print(f"  ''.rsplit(',')   = {''.rsplit(',')!r}")
```

运行结果：

```text
  ''.split()       = []
  ''.split(',')    = ['']
  ''.rsplit(',')   = ['']
```

**关键点说明**：

- `sep=None` 时空字符串返回 `[]`
- `sep=str` 时空字符串返回 `['']`（一个包含空字符串的列表）

#### 2.4.2 分隔符不存在

```python
print(f"  'hello'.split(',')  = {'hello'.split(',')!r}")
print(f"  'hello'.split('x')  = {'hello'.split('x')!r}")
```

运行结果：

```text
  'hello'.split(',')  = ['hello']
  'hello'.split('x')  = ['hello']
```

分隔符不存在时返回只有一个元素的列表（原字符串本身）。

#### 2.4.3 连续分隔符

```python
print(f"  'a,,b,,c'.split(',')  = {'a,,b,,c'.split(',')!r}")
print(f"  'a---b'.split('-')    = {'a---b'.split('-')!r}")
```

运行结果：

```text
  'a,,b,,c'.split(',')  = ['a', '', 'b', '', 'c']
  'a---b'.split('-')    = ['a', '', '', 'b']
```

`sep=str` 时连续分隔符之间会产生空字符串元素。

#### 2.4.4 首尾分隔符

```python
print(f"  ',a,b,'.split(',')   = {',a,b,'.split(',')!r}")
print(f"  ' hello '.split(' ') = {' hello '.split(' ')!r}")
print(f"  ' hello '.split()    = {' hello '.split()!r}")
```

运行结果：

```text
  ',a,b,'.split(',')   = ['', 'a', 'b', '']
  ' hello '.split(' ') = ['', 'hello', '']
  ' hello '.split()    = ['hello']
```

- `sep=str` 时首尾分隔符产生空字符串元素
- `sep=None` 时首尾空白被忽略

#### 2.4.5 分隔符是整个字符串

```python
print(f"  '...'.split('.')    = {'...'.split('.')!r}")
print(f"  '   '.split()       = {'   '.split()!r}")
print(f"  '   '.split(' ')    = {'   '.split(' ')!r}")
```

运行结果：

```text
  '...'.split('.')    = ['', '', '', '']
  '   '.split()       = []
  '   '.split(' ')    = ['', '', '', '']
```

- `"...".split(".")` 三个点产生四个空字符串
- `"   ".split()` 纯空白返回 `[]`
- `"   ".split(" ")` 三个空格产生四个空字符串

### 2.5 split vs partition

`split` 和 `partition` 都能做"按分隔符拆分"的操作，但返回类型和行为不同。

**示例**

```python
s = "key=value=extra"
split_result = s.split("=", maxsplit=1)
print(f"  {s!r}.split('=', maxsplit=1) = {split_result}  (返回 list)")

partition_result = s.partition("=")
print(f"  {s!r}.partition('=')       = {partition_result}  (返回 tuple)")
```

运行结果：

```text
  'key=value=extra'.split('=', maxsplit=1) = ['key', 'value=extra']  (返回 list)
  'key=value=extra'.partition('=')       = ('key', '=', 'value=extra')  (返回 tuple)
```

**对比表**：

| 维度 | `split(sep, maxsplit=1)` | `partition(sep)` |
|------|------------------------|------------------|
| 返回类型 | `list[str]` | `tuple[str, str, str]` |
| 元素数量 | 2 | 3（包含分隔符本身） |
| 无分隔符时 | `[原串]` | `(原串, '', '')` |
| 典型场景 | 键值对提取 | 解析结构化字符串 |

## 3. 最佳实践

### 3.1 按空白分词的正确写法

**推荐写法**

```python
# 推荐：split() 自动处理所有空白类型
words = "hello   world\tfoo\nbar".split()
# ['hello', 'world', 'foo', 'bar']
```

**不推荐写法**

```python
# 不推荐：split(' ') 不处理制表符/换行，连续空格产生空字符串
words = "hello   world\tfoo\nbar".split(" ")
# ['hello', '', '', 'world\tfoo\nbar']
```

### 3.2 键值对分割

**推荐写法**

```python
# 推荐：maxsplit=1 确保值中可以包含分隔符
key, value = "formula=y=mx+b".split("=", maxsplit=1)
# key='formula', value='y=mx+b'
```

**不推荐写法**

```python
# 不推荐：不限制分割次数，值中的 = 也会被分割
parts = "formula=y=mx+b".split("=")
# ['formula', 'y', 'mx', 'b'] <- 值被错误拆分
```

### 3.3 取文件扩展名

**推荐写法**

```python
# 推荐：rsplit('.', 1) 从右端分割，处理多 . 的文件名
name, ext = "report.tar.gz".rsplit(".", maxsplit=1)
# name='report.tar', ext='gz'
```

**不推荐写法**

```python
# 不推荐：split('.', 1) 从左端分割，取到的是中间部分
parts = "report.tar.gz".split(".", maxsplit=1)
# ['report', 'tar.gz'] <- 不是期望的文件名和扩展名
```

### 3.4 日志行解析

**推荐写法**

```python
# 推荐：split(maxsplit=2) 按空白分割前两列，剩余作为消息
line = "ERROR 2024-01-15 Connection timeout to database host"
level, timestamp, message = line.split(maxsplit=2)
# level='ERROR', timestamp='2024-01-15', message='Connection timeout to...'
```

**不推荐写法**

```python
# 不推荐：split(' ', 2) 不处理连续空格
parts = "ERROR  2024-01-15  Connection timeout".split(" ", maxsplit=2)
# ['ERROR', '', '2024-01-15  Connection timeout'] <- 多了个空字符串
```

### 3.5 CSV 行解析的局限

`split` 适合简单的 CSV 解析，但无法处理带引号的字段。

**推荐写法（简单场景）**

```python
# 简单 CSV（字段中不含逗号）
fields = "Alice,30,Beijing,alice@example.com".split(",")
# ['Alice', '30', 'Beijing', 'alice@example.com']
```

**推荐写法（复杂场景）**

```python
# 带引号的 CSV 应使用 csv 模块
import csv
import io

row = 'Alice,"New York, NY",30,alice@example.com'
reader = csv.reader(io.StringIO(row))
fields = next(reader)
# ['Alice', 'New York, NY', '30', 'alice@example.com']
```

**不推荐写法**

```python
# 不推荐：split 无法处理引号内的逗号
fields = 'Alice,"New York, NY",30'.split(",")
# ['Alice', '"New York', ' NY"', '30'] <- 引号内的逗号被错误分割
```

### 3.6 方法选择决策表

```text
  需求                推荐写法                   说明
  ----                --------                   ----
  按空白分词           s.split()                 自动处理各种空白、忽略首尾
  按指定字符分割       s.split(sep)               精确匹配分隔符
  限制分割次数         s.split(sep, maxsplit=N)   前 N 次分割，剩余保留
  从右端分割           s.rsplit(sep, maxsplit=N)  取文件名/扩展名等
  取文件扩展名         s.rsplit('.', 1)           处理多 . 的文件名
  键值对分割           s.split('=', 1)            值中可能含 = 号
  路径分割             s.split('/') 或 rsplit      按方向选择
  CSV 行              s.split(',')              简单场景；复杂用 csv 模块
  日志行              s.split(maxsplit=N)        取前几列
```

## 4. 原理

### 4.1 split 的扫描与分割逻辑

`split` 的内部逻辑取决于 `sep` 是否为 `None`：

**sep=None 时的逻辑**：

```text
函数 split_none(s, maxsplit):
    result = []
    i = 0
    count = 0
    while i < len(s) and count < maxsplit:
        # 跳过前导空白
        while i < len(s) and s[i] 是空白:
            i += 1
        if i >= len(s):
            break
        # 找到非空白片段的起始
        start = i
        while i < len(s) and s[i] 不是空白:
            i += 1
        result.append(s[start:i])
        count += 1
    # 如果还有剩余且未达到 maxsplit
    if i < len(s) and count < maxsplit:
        跳过空白，把剩余非空白加入
    elif i < len(s):
        # 剩余部分作为一个整体
        剩余 = s[i:].strip()  # 注意：仍然去除前导空白
        if 剩余:
            result.append(剩余)
    return result
```

**sep=str 时的逻辑**：

```text
函数 split_sep(s, sep, maxsplit):
    result = []
    start = 0
    count = 0
    while count < maxsplit:
        pos = s.find(sep, start)  # 从 start 开始查找 sep
        if pos == -1:
            break
        result.append(s[start:pos])
        start = pos + len(sep)
        count += 1
    result.append(s[start:])  # 剩余部分
    return result
```

核心要点：

1. `sep=None` 时逐字符扫描，检查每个字符是否为空白——连续空白被跳过
2. `sep=str` 时使用 `find` 查找分隔符——精确字符串匹配
3. `maxsplit` 通过计数器 `count` 控制分割次数
4. 最后一步总是将剩余部分加入结果列表

### 4.2 rsplit 的反向扫描逻辑

`rsplit` 的 `sep=str` 模式使用 `rfind` 从右端查找分隔符：

```text
函数 rsplit_sep(s, sep, maxsplit):
    result = []
    end = len(s)
    count = 0
    while count < maxsplit:
        pos = s.rfind(sep, 0, end)  # 从右端查找 sep
        if pos == -1:
            break
        result.insert(0, s[pos + len(sep):end])
        end = pos
        count += 1
    result.insert(0, s[0:end])  # 左侧剩余部分
    return result
```

核心要点：

1. `rsplit` 使用 `rfind` 从右端查找分隔符
2. 每次找到分隔符后，将右侧部分插入结果列表的头部
3. 分割完成后，左侧剩余部分插入结果列表的头部
4. `sep=None` 时，`rsplit` 的行为与 `split` 相同——因为按空白分割时方向不影响结果（连续空白合并后没有方向差异）

### 4.3 为什么 sep=None 和 sep=str 行为不同

`sep=None` 的设计目标是"按词分割"——适用于自然语言处理、日志解析等场景。在这些场景中，你不关心具体是哪种空白字符（空格、制表符、换行），只需要把"词"提取出来。因此 `sep=None` 会：

1. 合并连续空白——避免产生无意义的空字符串
2. 忽略首尾空白——避免产生首尾的空字符串
3. 处理所有空白类型——不仅限于空格

`sep=str` 的设计目标是"按精确分隔符分割"——适用于 CSV、配置文件等结构化数据。在这些场景中，分隔符是明确的，连续分隔符之间的空字符串可能是有意义的（如 CSV 中的空字段）。因此 `sep=str` 会：

1. 每个分隔符都分割一次——连续分隔符产生空字符串
2. 首尾分隔符也分割——产生首尾空字符串
3. 只匹配指定分隔符——不处理其他空白类型

### 4.4 不可变性与返回新对象

Python 字符串是不可变对象。`split` 和 `rsplit` 都不会修改原字符串，而是创建并返回一个新的列表对象。

**示例**

```python
original = "hello world"
result = original.split()
print(f"  原始: {original!r}")
print(f"  split(): {result}")
print(f"  原始未被修改: {original == 'hello world'}")
print(f"  返回类型: {type(result).__name__}")
```

运行结果：

```text
  原始: 'hello world'
  split(): ['hello', 'world']
  原始未被修改: True
  返回类型: list
```

`split` 返回的列表是全新的对象——对返回列表的修改不会影响原字符串（也无法影响，因为字符串不可变）。同时，列表中的每个字符串元素也是新创建的切片对象。

### 4.5 maxsplit 的性能意义

当只需要前几段结果时，`maxsplit` 不仅是语义上的限制，也有性能意义——它可以避免不必要的扫描和分割。

**示例**

```python
import time

big_text = ",".join(str(i) for i in range(10000))

# split() 无 maxsplit
start = time.perf_counter()
for _ in range(1000):
    big_text.split(",")
t1 = (time.perf_counter() - start) * 1000

# split() 有 maxsplit
start = time.perf_counter()
for _ in range(1000):
    big_text.split(",", maxsplit=1)
t2 = (time.perf_counter() - start) * 1000

print(f"  10000 元素 split(',') x1000: {t1:.1f} ms")
print(f"  10000 元素 split(',', 1) x1000: {t2:.1f} ms")
print("  如果只需要前几段，加 maxsplit 可避免不必要的分割")
```

运行结果：

```text
  10000 元素 split(',') x1000: {t1} ms
  10000 元素 split(',', 1) x1000: {t2} ms
  如果只需要前几段，加 maxsplit 可避免不必要的分割
```

**关键点说明**：

- 无 `maxsplit` 时，`split` 需要扫描整个字符串并创建所有子字符串
- 有 `maxsplit=1` 时，`split` 只需要找到第一个分隔符就停止
- 对于很长的字符串且只需要前几段时，`maxsplit` 可以显著减少开销

## 5. 总结

本文围绕"split 与 rsplit 方法"展开，主要介绍了以下内容：

- `str.split(sep=None, maxsplit=-1)`：从左到右按分隔符拆分字符串，返回 `list[str]`
- `sep=None` vs `sep=str` 的核心差异：`sep=None` 按任意空白分割、合并连续空白、忽略首尾空白；`sep=str` 精确匹配分隔符、连续分隔符产生空字符串、首尾分隔符也分割
- `sep=''` 会触发 `ValueError`——空字符串不能作为分隔符
- `maxsplit` 参数：限制最大分割次数，设为 N 时产生 N+1 个元素，剩余部分作为最后一个元素保留原样；`maxsplit=-1`（默认）表示无限制
- `sep=None + maxsplit` 的组合：首尾空白仍然忽略，但剩余部分中的空白保留原样
- `str.rsplit(sep=None, maxsplit=-1)`：从右到左分割，无 `maxsplit` 时与 `split` 结果完全相同，有 `maxsplit` 时从右端开始分割
- `rsplit` 实战场景：取文件扩展名用 `rsplit('.', 1)`、取路径最后一段用 `rsplit('/', 1)`、取域名后缀用 `rsplit('.', 2)`
- 边界行为：空字符串 `sep=None` 返回 `[]`、`sep=str` 返回 `['']`；分隔符不存在返回 `[原串]`；连续分隔符产生空字符串；首尾分隔符产生首尾空字符串
- `split` vs `partition`：`split` 返回 `list`（不含分隔符），`partition` 返回 3-tuple（含分隔符），无分隔符时行为不同
- 最佳实践：按空白分词用 `split()`、键值对用 `split('=', 1)`、文件扩展名用 `rsplit('.', 1)`、日志前几列用 `split(maxsplit=N)`、带引号 CSV 用 `csv` 模块
- 原理：`sep=None` 逐字符扫描空白、`sep=str` 用 `find` 查找分隔符、`rsplit` 用 `rfind` 从右端查找、`maxsplit` 通过计数器控制分割次数、字符串不可变所以返回新列表
- 性能提示：只需要前几段时加 `maxsplit` 可避免不必要的扫描和分割
