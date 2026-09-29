---
group:
  title: 【03】字符串介绍
  order: 3
order: 22
title: splitlines 按行分割
nav:
  title: Python基础
  order: 1
---

# splitlines 按行分割

## 1. 介绍

### 1.1 知识点定义

`str.splitlines()` 是 Python 字符串的按行分割方法，它将一个包含换行符的字符串按行边界字符切分成多行，返回一个 `list[str]`。

```python
str.splitlines(keepends=False) -> list[str]
```

- **keepends**：布尔值，默认 `False`。设为 `True` 时保留每行末尾的行边界字符

与 `split('\n')` 不同，`splitlines` 能自动识别多种行边界字符——包括 Unix 的 `\n`、Windows 的 `\r\n`、旧 Mac 的 `\r`，以及多个 Unicode 行边界字符（如 `\u2028`、`\u2029`、`\x85` 等）。这使得 `splitlines` 成为处理跨平台文本的首选方法。

### 1.2 最简示例

先用最简单的代码直观感受 `splitlines`：

```python
text = "第一行\n第二行\n第三行"
result = text.splitlines()
print(result)
```

运行结果：

```text
['第一行', '第二行', '第三行']
```

`keepends=True` 时保留换行符：

```python
text = "line1\nline2\r\nline3"
for line in text.splitlines(keepends=True):
    print(f"  {line!r}")
```

运行结果：

```text
  'line1\n'
  'line2\r\n'
  'line3'
```

### 1.3 在字符串方法体系中的位置

`splitlines` 属于"字符串拆分与连接"类操作，专门用于按行分割：

```text
字符串方法体系
├── 查找类：find / rfind / index / count / in
├── 判断类：isalpha / isdigit / isupper / islower ...
├── 拆分与连接类（本篇）：
│   ├── split / rsplit          ← 按指定分隔符拆分为列表
│   ├── splitlines              ← 按行边界拆分为列表（本篇）
│   ├── partition / rpartition   ← 按分隔符拆分为三元组
│   └── join                    ← 将列表合并为字符串
├── 替换类：replace / translate / maketrans
├── 大小写转换类：upper / lower / title / capitalize / swapcase / casefold
├── 对齐填充类：ljust / rjust / center / zfill
└── 清洗类：strip / lstrip / rstrip / removeprefix / removesuffix
```

`splitlines` 的核心特点：

- **自动识别多种行边界**——不需要手动处理 `\n`、`\r\n`、`\r` 的差异
- **末尾换行不产生空字符串**——`"hello\n".splitlines()` 返回 `['hello']` 而非 `['hello', '']`
- **keepends 参数支持重建原字符串**——`keepends=True` 保留换行符，可用 `"".join()` 完美还原
- **不修改原字符串**——返回新列表，原字符串保持不变
- **无 sep 参数**——不支持指定分隔符，只能按行边界分割

## 2. 核心内容

### 2.1 splitlines 基本用法

#### 2.1.1 方法签名

```python
str.splitlines(keepends=False) -> list[str]
```

`splitlines` 只有一个可选参数：

- **keepends**：布尔值，默认 `False`。`False` 时不保留行边界字符，`True` 时保留每行末尾的行边界字符

注意 `splitlines` 没有 `sep` 参数——它只能按行边界字符分割，不能指定自定义分隔符。如果需要按自定义分隔符分割，使用 `split` 或 `rsplit`。

#### 2.1.2 基本分割

```python
text = "第一行\n第二行\n第三行"
result = text.splitlines()
print(f"  {text!r}")
print(f"  splitlines(): {result}")
```

运行结果：

```text
  '第一行\n第二行\n第三行'
  splitlines(): ['第一行', '第二行', '第三行']
```

**关键点说明**：

- 分割后每行不包含换行符（`keepends=False` 的默认行为）
- 返回一个列表，每个元素是一行内容
- 原字符串不被修改

#### 2.1.3 keepends=False（默认行为）

`keepends=False` 是默认行为——分割后每行不包含行边界字符。

```python
text = "line1\r\nline2\nline3\rline4"
result = text.splitlines()
print(f"  原始: {text!r}")
for line in result:
    print(f"    {line!r}")
```

运行结果：

```text
  原始: 'line1\r\nline2\nline3\rline4'
    'line1'
    'line2'
    'line3'
    'line4'
```

**关键点说明**：

- 三种换行符 `\r\n`、`\n`、`\r` 都被正确识别为行边界
- 分割后的每一行都是干净的内容，不包含任何换行符字符
- `\r\n` 被当作一个行边界（而不是两个），不会产生中间的 `\r`

#### 2.1.4 keepends=True 保留换行符

`keepends=True` 保留每行末尾的行边界字符——这使得后续可以用 `"".join()` 完美重建原字符串。

```python
text = "line1\r\nline2\nline3\rline4"
result = text.splitlines(keepends=True)
print(f"  原始: {text!r}")
for line in result:
    print(f"    {line!r}")
```

运行结果：

```text
  原始: 'line1\r\nline2\nline3\rline4'
    'line1\r\n'
    'line2\n'
    'line3\r'
    'line4'
```

**关键点说明**：

- 每行末尾保留了原始的行边界字符——`\r\n`、`\n`、`\r` 各自保留
- 最后一行 `"line4"` 没有行边界字符——因为原字符串末尾没有换行符，`keepends` 不会添加
- 使用 `"".join(result)` 可以完美重建原字符串

**keepends=True 完美重建验证**

```python
text = "line1\nline2\r\nline3\rline4"
lines = text.splitlines(keepends=True)
reconstructed = "".join(lines)
print(f"  原始:       {text!r}")
print(f"  ''.join():  {reconstructed!r}")
print(f"  重建一致:   {text == reconstructed}")
```

运行结果：

```text
  原始:       'line1\nline2\r\nline3\rline4'
  ''.join():  'line1\nline2\r\nline3\rline4'
  重建一致:   True
```

#### 2.1.5 空字符串与单行字符串

```python
cases = [
    "",
    "hello",
    "\n",
    "\n\n",
]
for s in cases:
    result = s.splitlines()
    print(f"  {s!r:>15}.splitlines() = {result}")
```

运行结果：

```text
              ''.splitlines() = []
         'hello'.splitlines() = ['hello']
           '\n'.splitlines() = ['']
         '\n\n'.splitlines() = ['', '']
```

**关键点说明**：

- 空字符串返回空列表 `[]`——与 `split('\n')` 返回 `['']` 不同
- 不含换行符的字符串返回只有一个元素的列表
- 纯换行符 `'\n'` 返回 `['']`——因为 `\n` 前面有一个空字符串
- `'\n\n'` 返回 `['', '']`——两个换行符之间有一个空字符串

#### 2.1.6 末尾换行符的行为

`splitlines` 对末尾换行符的处理是它与 `split('\n')` 最显著的区别之一。

```python
cases = [
    "hello\n",
    "hello\n\n",
    "hello\nworld\n",
    "\nhello",
    "\nhello\n",
]
for s in cases:
    result = s.splitlines()
    print(f"  {s!r:>20}.splitlines() = {result}")
```

运行结果：

```text
       'hello\n'.splitlines() = ['hello']
     'hello\n\n'.splitlines() = ['hello', '']
  'hello\nworld\n'.splitlines() = ['hello', 'world']
        '\nhello'.splitlines() = ['', 'hello']
      '\nhello\n'.splitlines() = ['', 'hello']
```

**关键点说明**：

- `"hello\n".splitlines()` 返回 `['hello']`——末尾换行符不会产生空字符串
- `"hello\n\n".splitlines()` 返回 `['hello', '']`——第二个 `\n` 前有一个空字符串
- `"hello\nworld\n".splitlines()` 返回 `['hello', 'world']`——末尾 `\n` 不产生额外空行
- `"\nhello".splitlines()` 返回 `['', 'hello']`——开头 `\n` 产生一个空字符串

### 2.2 行边界字符详解

#### 2.2.1 三种常见行边界

不同操作系统使用不同的换行符：

| 系统 | 换行符 | 字符 | 典型场景 |
|------|--------|------|---------|
| Unix/Linux/macOS(10+) | LF | `\n` (U+000A) | 现代 Unix 系统 |
| Windows | CRLF | `\r\n` (U+000D U+000A) | Windows 系统 |
| 旧 Mac OS (9 及更早) | CR | `\r` (U+000D) | 旧版 Mac 系统 |

```python
cases = [
    ("Unix 换行",      "a\nb\nc"),
    ("Windows 换行",    "a\r\nb\r\nc"),
    ("旧 Mac 换行",     "a\rb\rc"),
    ("混合换行",        "a\r\nb\nc\rd"),
]
for name, text in cases:
    result = text.splitlines()
    print(f"  {name}: {text!r}")
    print(f"    splitlines() = {result}")
```

运行结果：

```text
  Unix 换行: 'a\nb\nc'
    splitlines() = ['a', 'b', 'c']
  Windows 换行: 'a\r\nb\r\nc'
    splitlines() = ['a', 'b', 'c']
  旧 Mac 换行: 'a\rb\rc'
    splitlines() = ['a', 'b', 'c']
  混合换行: 'a\r\nb\nc\rd'
    splitlines() = ['a', 'b', 'c', 'd']
```

**关键点说明**：

- `splitlines` 自动识别所有三种常见换行符，无需手动替换
- 混合换行符的文本也能正确分割——这是 `splitlines` 相比 `split('\n')` 的核心优势
- 处理跨平台文本时，`splitlines` 是最佳选择

#### 2.2.2 \r\n 被当作单个行边界

`\r\n`（Windows 换行符）被当作**一个**行边界处理，而不是两个——这是一个容易被忽略但很重要的行为。

```python
text = "a\r\nb"
result = text.splitlines()
print(f"  {text!r}.splitlines() = {result}")
print(f"  结果有 {len(result)} 个元素，不是 3 个")
```

运行结果：

```text
  'a\r\nb'.splitlines() = ['a', 'b']
  结果有 2 个元素，不是 3 个
```

如果 `\r` 和 `\n` 被分别当作行边界，结果应该是 `['a', '', 'b']`（三个元素）。但 `splitlines` 将 `\r\n` 当作一个整体行边界，所以结果只有两个元素。

#### 2.2.3 Unicode 行边界字符

除了 `\n`、`\r`、`\r\n` 外，Python 的 `splitlines` 还识别以下 Unicode 行边界字符：

| 字符 | 名称 | Unicode 码点 |
|------|------|-------------|
| `\v` / `\x0b` | 垂直制表符 (VT) | U+000B |
| `\f` / `\x0c` | 换页符 (FF) | U+000C |
| `\x1c` | 文件分隔符 (FS) | U+001C |
| `\x1d` | 组分隔符 (GS) | U+001D |
| `\x1e` | 记录分隔符 (RS) | U+001E |
| `\x85` | 下一行 (NEL) | U+0085 |
| `\u2028` | 行分隔符 (LS) | U+2028 |
| `\u2029` | 段分隔符 (PS) | U+2029 |

加上 `\n`、`\r`、`\r\n`，`splitlines` 共识别 **8 种**行边界（`\r\n` 算一种）。

```python
cases = [
    ("\\x0b 垂直制表符",      "a\x0bb\x0bc"),
    ("\\x0c 换页符",          "a\x0cb\x0cc"),
    ("\\x1c 文件分隔符",      "a\x1cb\x1cc"),
    ("\\x1d 组分隔符",        "a\x1db\x1dc"),
    ("\\x1e 记录分隔符",      "a\x1eb\x1ec"),
    ("\\x85 下一行(NEL)",     "a\x85b\x85c"),
    ("\\u2028 行分隔符",      "a\u2028b\u2028c"),
    ("\\u2029 段分隔符",      "a\u2029b\u2029c"),
]
for name, text in cases:
    result = text.splitlines()
    print(f"  {name}: {text!r}")
    print(f"    splitlines() = {result}")
```

运行结果：

```text
  \x0b 垂直制表符: 'a\x0bb\x0bc'
    splitlines() = ['a', 'b', 'c']
  \x0c 换页符: 'a\x0cb\x0cc'
    splitlines() = ['a', 'b', 'c']
  \x1c 文件分隔符: 'a\x1cb\x1cc'
    splitlines() = ['a', 'b', 'c']
  \x1d 组分隔符: 'a\x1db\x1dc'
    splitlines() = ['a', 'b', 'c']
  \x1e 记录分隔符: 'a\x1eb\x1ec'
    splitlines() = ['a', 'b', 'c']
  \x85 下一行(NEL): 'a\x85b\x85c'
    splitlines() = ['a', 'b', 'c']
  \u2028 行分隔符: 'a\u2028b\u2028c'
    splitlines() = ['a', 'b', 'c']
  \u2029 段分隔符: 'a\u2029b\u2029c'
    splitlines() = ['a', 'b', 'c']
```

**关键点说明**：

- Python 的 `splitlines` 对 Unicode 行边界字符的支持是 `split('\n')` 完全不具备的能力
- 在处理包含 Unicode 行边界字符的文本时（如某些国际化文档），`splitlines` 是唯一正确的方法
- `\v`（垂直制表符）和 `\f`（换页符）也被识别为行边界——这在某些文本处理场景中需要特别注意

#### 2.2.4 splitlines vs split('\n') 在 Unicode 行边界上的差异

```python
text = "line1\u2028line2\x85line3\u2029line4"
sl = text.splitlines()
sp = text.split("\n")
print(f"  原始: {text!r}")
print(f"  splitlines()  = {sl}")
print(f"  split('\\n')   = {sp}")
```

运行结果：

```text
  原始: 'line1\u2028line2\x85line3\u2029line4'
  splitlines()  = ['line1', 'line2', 'line3', 'line4']
  split('\n')   = ['line1\u2028line2\x85line3\u2029line4']
```

`split('\n')` 完全不识别 Unicode 行边界字符，整个字符串被当作一行。而 `splitlines` 正确识别了 `\u2028`、`\x85`、`\u2029` 三种 Unicode 行边界。

#### 2.2.5 连续行边界产生空字符串

连续的行边界字符会产生空字符串元素——这与 `split('\n')` 的行为一致。

```python
cases = [
    ("a\n\nb",       "两个连续 \\n"),
    ("a\r\n\r\nb",   "两个连续 \\r\\n"),
    ("a\u2028\u2028b", "两个连续 U+2028"),
    ("\na",          "开头 \\n"),
    ("a\n",          "结尾 \\n"),
]
for text, desc in cases:
    result = text.splitlines()
    print(f"  {desc}: {text!r} -> {result}")
```

运行结果：

```text
  两个连续 \n: 'a\n\nb' -> ['a', '', 'b']
  两个连续 \r\n: 'a\r\n\r\nb' -> ['a', '', 'b']
  两个连续 U+2028: 'a\u2028\u2028b' -> ['a', '', 'b']
  开头 \n: '\na' -> ['', 'a']
  结尾 \n: 'a\n' -> ['a']
```

**关键点说明**：

- 两个连续行边界之间会产生空字符串——因为两个行边界中间确实有一行空行
- 开头有行边界时产生首部空字符串
- 结尾有行边界时**不产生**末尾空字符串——这是 `splitlines` 与 `split('\n')` 的关键差异

### 2.3 splitlines 与 split 对比

#### 2.3.1 splitlines() vs split('\n')

`splitlines()` 和 `split('\n')` 是最常见的混淆对象。两者的行为在以下场景中不同：

```python
cases = [
    "hello\nworld",
    "hello\r\nworld",
    "hello\nworld\n",
    "hello\rworld",
    "hello\u2028world",
    "",
    "\n",
]
for text in cases:
    sl = text.splitlines()
    sp = text.split("\n")
    match = "相同" if sl == sp else "不同"
    print(f"  {text!r:>25}")
    print(f"    splitlines() = {sl}")
    print(f"    split('\\n')  = {sp}  [{match}]")
```

运行结果：

```text
         'hello\nworld'
    splitlines() = ['hello', 'world']
    split('\n')  = ['hello', 'world']  [相同]
       'hello\r\nworld'
    splitlines() = ['hello', 'world']
    split('\n')  = ['hello\r', 'world']  [不同]
       'hello\nworld\n'
    splitlines() = ['hello', 'world']
    split('\n')  = ['hello', 'world', '']  [不同]
         'hello\rworld'
    splitlines() = ['hello', 'world']
    split('\n')  = ['hello\rworld']  [不同]
       'hello\u2028world'
    splitlines() = ['hello', 'world']
    split('\n')  = ['hello\u2028world']  [不同]
                         ''
    splitlines() = []
    split('\n')  = ['']  [不同]
                           '\n'
    splitlines() = ['']
    split('\n')  = ['', '']  [不同]
```

**核心差异汇总**：

| 场景 | `splitlines()` | `split('\n')` |
|------|----------------|--------------|
| 纯 `\n` 换行 | 正确分割 | 正确分割 |
| `\r\n` 换行 | 识别为单个行边界 | `\r` 留在行内容中 |
| `\r` 换行 | 正确分割 | 不识别 |
| Unicode 行边界 | 正确分割 | 不识别 |
| 末尾换行符 | 不产生空字符串 | 产生空字符串 |
| 空字符串 | 返回 `[]` | 返回 `['']` |

#### 2.3.2 splitlines() vs split()

`splitlines` 按行边界分割，`split()` 按任意空白字符分割——两者的分割粒度完全不同。

```python
cases = [
    "hello world\nfoo bar",
    "hello\tworld",
    "hello\nworld\tfoo",
    "  hello  \nworld",
]
for text in cases:
    sl = text.splitlines()
    sp = text.split()
    print(f"  {text!r:>30}")
    print(f"    splitlines() = {sl}")
    print(f"    split()     = {sp}")
```

运行结果：

```text
         'hello world\nfoo bar'
    splitlines() = ['hello world', 'foo bar']
    split()     = ['hello', 'world', 'foo', 'bar']
              'hello\tworld'
    splitlines() = ['hello\tworld']
    split()     = ['hello', 'world']
           'hello\nworld\tfoo'
    splitlines() = ['hello', 'world\tfoo']
    split()     = ['hello', 'world', 'foo']
            '  hello  \nworld'
    splitlines() = ['  hello  ', 'world']
    split()     = ['hello', 'world']
```

**关键点说明**：

- `splitlines` 只按行边界分割——同一行内的空格、制表符不分割
- `split()` 按任意空白分割——行边界也包含在空白中，但不保留行结构
- `splitlines` 保留行内的空白字符——`"  hello  "` 不会被去除首尾空格
- `split()` 忽略首尾空白、合并连续空白——`"  hello  "` 变成 `"hello"`

#### 2.3.3 末尾换行符的关键差异

末尾换行符的处理是 `splitlines` 和 `split('\n')` 最常见的差异来源。

```python
text = "line1\nline2\n"
sl = text.splitlines()
sp = text.split("\n")
print(f"  原始: {text!r}")
print(f"  splitlines(): {sl}")
print(f"  split('\\n'):   {sp}")
```

运行结果：

```text
  原始: 'line1\nline2\n'
  splitlines(): ['line1', 'line2']
  split('\\n'):   ['line1', 'line2', '']
```

- `splitlines()` 不产生末尾空字符串——因为它把末尾换行符当作"行结束标记"而非"分隔符"
- `split('\n')` 产生末尾空字符串——因为它把末尾的 `\n` 当作分隔符，`\n` 后面有一个空字符串

这种差异在实际开发中非常重要——从文件中读取的文本通常以 `\n` 结尾，用 `splitlines` 处理可以直接获得干净的行列表，而 `split('\n')` 则会产生一个多余的空字符串。

#### 2.3.4 keepends=True 重建原字符串

`keepends=True` 的最大用途是保留原始的换行符信息，使得后续可以用 `"".join()` 完美重建原字符串。

```python
text = "line1\nline2\r\nline3\rline4"
lines = text.splitlines(keepends=True)
reconstructed = "".join(lines)
print(f"  原始:          {text!r}")
print(f"  keepends=True: {lines}")
print(f"  ''.join():     {reconstructed!r}")
print(f"  重建一致:      {text == reconstructed}")
```

运行结果：

```text
  原始:          'line1\nline2\r\nline3\rline4'
  keepends=True: ['line1\n', 'line2\r\n', 'line3\r', 'line4']
  ''.join():     'line1\nline2\r\nline3\rline4'
  重建一致:      True
```

如果使用 `keepends=False`（默认）再用 `'\n'.join()` 重建，会丢失原始的换行类型：

```python
text = "line1\r\nline2\r\nline3"
lines = text.splitlines()
rejoined = "\n".join(lines)
print(f"  原始:       {text!r}")
print(f"  '\\n'.join:  {rejoined!r}")
print(f"  重建一致:   {text == rejoined}")
```

运行结果：

```text
  原始:       'line1\r\nline2\r\nline3'
  '\n'.join:  'line1\nline2\nline3'
  重建一致:   False
```

**关键点说明**：

- `keepends=False` + `'\n'.join` 重建时，所有换行符都变成了 `\n`——原始的 `\r\n` 被丢失
- `keepends=True` + `"".join` 重建时，原始的换行符被完美保留
- 如果需要保留原始文本的完整性（如文本编辑器处理），始终使用 `keepends=True`

#### 2.3.5 三种方法对比表

| 维度 | `splitlines()` | `split(sep)` | `split()` |
|------|----------------|-------------|-----------|
| 按什么分割 | 行边界字符 | 指定分隔符 | 任意空白字符 |
| 识别的行边界 | `\n` `\r` `\r\n` 等 8 种 | 仅指定的 sep | 空格/制表符/换行 |
| 末尾换行处理 | 不产生空字符串 | 产生空字符串 | 不产生空字符串 |
| keepends 选项 | 有 | 无 | 无 |
| sep='' 是否报错 | 不适用 | 报 ValueError | 不适用 |
| 返回值类型 | `list[str]` | `list[str]` | `list[str]` |
| 典型场景 | 读取文件按行处理 | CSV/键值对/路径 | 按空白分词 |

### 2.4 边界行为汇总

#### 2.4.1 空字符串

```python
print(f"  ''.splitlines() = {''.splitlines()!r}")
print(f"  ''.split('\\n') = {''.split(chr(10))!r}")
```

运行结果：

```text
  ''.splitlines() = []
  ''.split('\n') = ['']
```

- `splitlines` 返回空列表 `[]`
- `split('\n')` 返回 `['']`（一个包含空字符串的列表）

#### 2.4.2 纯换行符

```python
print(f"  '\\n'.splitlines()     = {chr(10).splitlines()!r}")
print(f"  '\\n\\n'.splitlines()   = {(chr(10)+chr(10)).splitlines()!r}")
print(f"  '\\r\\n'.splitlines()   = {(chr(13)+chr(10)).splitlines()!r}")
print(f"  '\\n\\r\\n'.splitlines() = {(chr(10)+chr(13)+chr(10)).splitlines()!r}")
```

运行结果：

```text
  '\n'.splitlines()     = ['']
  '\n\n'.splitlines()   = ['', '']
  '\r\n'.splitlines()   = ['']
  '\n\r\n'.splitlines() = ['', '']
```

**关键点说明**：

- `'\n'.splitlines()` 返回 `['']`——因为 `\n` 前面有一个空字符串（行边界前的内容）
- `'\n\n'.splitlines()` 返回 `['', '']`——第一个 `\n` 前有空字符串，两个 `\n` 之间也有空字符串
- `'\r\n'.splitlines()` 返回 `['']`——`\r\n` 被当作一个行边界（不是两个）

#### 2.4.3 纯空白不含换行符

```python
print(f"  '   '.splitlines() = {'   '.splitlines()!r}")
```

运行结果：

```text
  '   '.splitlines() = ['   ']
```

**关键点说明**：

- `splitlines` 只识别行边界字符，不识别普通的空白字符（空格、制表符）
- `"   ".splitlines()` 返回 `['   ']`——三个空格被当作一行内容
- 这与 `split()` 完全不同——`split()` 会把空白当作分隔符

#### 2.4.4 keepends 的边界情况

```python
print(f"  ''.splitlines(keepends=True) = {''.splitlines(keepends=True)!r}")
print(f"  '\\n'.splitlines(keepends=True) = {chr(10).splitlines(keepends=True)!r}")
print(f"  'hello'.splitlines(keepends=True) = {'hello'.splitlines(keepends=True)!r}")
```

运行结果：

```text
  ''.splitlines(keepends=True) = []
  '\n'.splitlines(keepends=True) = ['\n']
  'hello'.splitlines(keepends=True) = ['hello']
```

**关键点说明**：

- 空字符串 + `keepends=True` 仍然返回空列表
- `'\n'.splitlines(keepends=True)` 返回 `['\n']`——空行末尾的 `\n` 被保留
- 不含换行符的字符串 + `keepends=True` 返回原字符串本身——`keepends` 不会添加换行符

#### 2.4.5 不可变性验证

```python
original = "hello\nworld\nfoo"
result = original.splitlines()
print(f"  原始: {original!r}")
print(f"  splitlines(): {result}")
print(f"  原始未被修改: {original == 'hello' + chr(10) + 'world' + chr(10) + 'foo'}")
print(f"  返回类型: {type(result).__name__}")
print(f"  元素类型: {[type(x).__name__ for x in result]}")
```

运行结果：

```text
  原始: 'hello\nworld\nfoo'
  splitlines(): ['hello', 'world', 'foo']
  原始未被修改: True
  返回类型: list
  元素类型: ['str', 'str', 'str']
```

`splitlines` 不修改原字符串，返回一个新的列表对象。这与所有字符串方法一致——Python 字符串是不可变对象。

## 3. 最佳实践

### 3.1 读取文件内容按行处理

**推荐写法**

```python
# 推荐：splitlines 自动处理跨平台换行
content = "line1\r\nline2\nline3\rline4"
lines = content.splitlines()
# ['line1', 'line2', 'line3', 'line4']
```

**不推荐写法**

```python
# 不推荐：split('\n') 不处理 \r\n 和 \r
content = "line1\r\nline2\nline3\rline4"
lines = content.split("\n")
# ['line1\r', 'line2', 'line3\rline4']  <- \r 残留在行内容中
```

### 3.2 保留换行符用于后续重建

**推荐写法**

```python
# 推荐：keepends=True 保留原始换行符，后续可完美重建
text = "line1\r\nline2\nline3"
lines = text.splitlines(keepends=True)
# ['line1\r\n', 'line2\n', 'line3']
reconstructed = "".join(lines)
# 完美还原原始字符串
```

**不推荐写法**

```python
# 不推荐：keepends=False 后用 '\n'.join 重建会丢失原始换行类型
text = "line1\r\nline2\r\nline3"
lines = text.splitlines()
reconstructed = "\n".join(lines)
# 'line1\nline2\nline3'  <- \r\n 丢失了
```

### 3.3 过滤日志中的特定级别

**推荐写法**

```python
# 推荐：splitlines 按行分割后过滤
log = (
    "INFO Server started\n"
    "ERROR Database connection failed\n"
    "DEBUG Loading config\n"
)
errors = [line for line in log.splitlines() if line.startswith("ERROR")]
# ['ERROR Database connection failed']
```

**不推荐写法**

```python
# 不推荐：split('\n') 末尾换行会产生空字符串
log = "INFO Server started\nERROR Connection failed\n"
lines = log.split("\n")
errors = [line for line in lines if line.startswith("ERROR")]
# 虽然结果正确，但 lines 多了一个末尾空字符串
```

### 3.4 解析 INI 配置文件

```python
config_text = (
    "[database]\n"
    "host = localhost\n"
    "port = 5432\n"
    "\n"
    "[cache]\n"
    "host = 127.0.0.1\n"
    "port = 6379\n"
)
config = {}
current_section = None
for line in config_text.splitlines():
    stripped = line.strip()
    if not stripped or stripped.startswith("#"):
        continue
    if stripped.startswith("[") and stripped.endswith("]"):
        current_section = stripped[1:-1]
        config[current_section] = {}
    elif "=" in stripped and current_section:
        key, value = stripped.split("=", maxsplit=1)
        config[current_section][key.strip()] = value.strip()
```

运行结果：

```text
{'database': {'host': 'localhost', 'port': '5432'}, 'cache': {'host': '127.0.0.1', 'port': '6379'}}
```

### 3.5 提取 Markdown 标题

```python
md_text = (
    "# Python 教程\n"
    "## 1. 介绍\n"
    "### 1.1 背景\n"
    "## 2. 核心内容\n"
    "## 3. 总结\n"
)
headings = [
    line for line in md_text.splitlines()
    if line.strip().startswith("#")
]
for h in headings:
    level = h.count("#")
    title = h.lstrip("#").strip()
    indent = "  " * (level - 1)
    print(f"{indent}{title}  (H{level})")
```

运行结果：

```text
Python 教程  (H1)
  1. 介绍  (H2)
    1.1 背景  (H3)
  2. 核心内容  (H2)
  3. 总结  (H2)
```

### 3.6 方法选择决策表

```text
  场景                         推荐方法                    说明
  ----                         --------                    ----
  读取文件按行处理              splitlines()               自动处理跨平台换行
  保留换行符用于重建             splitlines(keepends=True)  后续可用 "".join() 完美重建
  解析 CSV 一行                 split(',')                 按逗号精确分割
  按空白分词                     split()                    忽略首尾空白、合并连续空白
  只按 \n 分割                  split('\n')                不处理 \r\n 和其他行边界
  跨平台文本统一                 splitlines()               处理所有行边界字符
  处理 Unicode 超行              splitlines()               识别 U+2028 U+2029 等
  键值对分割                    split('=', maxsplit=1)     值中可能含 = 号
  取文件扩展名                  rsplit('.', maxsplit=1)    从右端分割
```

## 4. 原理

### 4.1 splitlines 的扫描逻辑

`splitlines` 的内部扫描逻辑比 `split` 更复杂——因为它需要识别多种行边界字符，且 `\r\n` 要被当作一个整体处理。

```text
函数 splitlines(s, keepends):
    result = []
    start = 0          # 当前行的起始位置
    i = 0              # 扫描指针
    while i < len(s):
        ch = s[i]
        判断 ch 是否为行边界字符:
            if ch == '\n':          # U+000A LF
                添加 s[start:i] 到 result
                如果 keepends: 末尾加上 '\n'
                start = i + 1
                i += 1
            elif ch == '\r':        # U+000D CR
                如果下一个字符是 '\n':  # \r\n 组合
                    添加 s[start:i] 到 result
                    如果 keepends: 末尾加上 '\r\n'
                    start = i + 2
                    i += 2
                else:               # 单独的 \r
                    添加 s[start:i] 到 result
                    如果 keepends: 末尾加上 '\r'
                    start = i + 1
                    i += 1
            elif ch == '\v' or ch == '\f' or ch == '\x1c' or ...
                # 其他 Unicode 行边界字符
                添加 s[start:i] 到 result
                如果 keepends: 末尾加上对应的行边界字符
                start = i + 1
                i += 1
            else:
                i += 1
    # 处理最后一行
    if start < len(s):
        添加 s[start:] 到 result
    return result
```

核心要点：

1. `splitlines` 逐字符扫描，检查每个字符是否为行边界字符
2. 当遇到 `\r` 时，会检查下一个字符是否为 `\n`——如果是，则 `\r\n` 被当作一个行边界
3. `keepends=True` 时，行边界字符被附加到当前行的末尾（而非下一行的开头）
4. 最后一行如果末尾没有行边界字符，仍然被添加到结果中——这与 `split('\n')` 不同

### 4.2 为什么末尾换行不产生空字符串

`splitlines` 把行边界字符当作"行结束标记"而非"分隔符"——这个设计决定导致末尾换行符不产生空字符串。

对比两种理解方式：

```text
splitlines 的理解（行结束标记）：
  "a\nb\n" → "a" + 结束 + "b" + 结束 → ['a', 'b']
  末尾 \n 是最后一行的结束标记，后面没有更多的行

split('\n') 的理解（分隔符）：
  "a\nb\n" → "a" + 分隔 + "b" + 分隔 + "" → ['a', 'b', '']
  末尾 \n 是分隔符，后面有一个空字符串
```

这个差异的来源在于：

1. `splitlines` 扫描到行边界字符时，把"行边界之前的内容"作为一行——行边界字符标志着这一行的结束
2. `split(sep)` 扫描到分隔符时，把"前一个分隔符到当前分隔符之间的内容"作为一段——分隔符意味着"这一段结束了，开始下一段"
3. 因此 `splitlines` 最后一个行边界后面如果没有内容，就不会多出一个元素
4. 而 `split(sep)` 最后一个分隔符后面即使没有内容，也会产生一个空字符串（分隔符"开始"了一段新内容，即使为空）

### 4.3 \r\n 的组合识别

`splitlines` 在遇到 `\r` 时会预读下一个字符——如果下一个是 `\n`，则把 `\r\n` 当作一个行边界处理，而非两个。

```python
# 验证 \r\n 只算一个行边界
text = "a\r\nb"
result = text.splitlines()
print(f"  {text!r}.splitlines() = {result}")
# ['a', 'b']  <- 2个元素，不是3个

# 对比：\r 后面不是 \n，\r 单独作为行边界
text2 = "a\rb"
result2 = text2.splitlines()
print(f"  {text2!r}.splitlines() = {result2}")
# ['a', 'b']  <- 也是2个元素

# \r 后面跟非 \n 字符
text3 = "a\ra"
result3 = text3.splitlines()
print(f"  {text3!r}.splitlines() = {result3}")
# ['a', 'a']
```

运行结果：

```text
  'a\r\nb'.splitlines() = ['a', 'b']
  'a\rb'.splitlines() = ['a', 'b']
  'a\ra'.splitlines() = ['a', 'a']
```

**关键点说明**：

- `\r\n` 被当作一个行边界——`\r` 后面的 `\n` 不会被再次当作行边界
- `\r` 单独出现时也被当作一个行边界
- 这种前瞻逻辑使得 Windows 换行符 `\r\n` 不会产生中间的空字符串

### 4.4 keepends 的实现方式

`keepends=True` 时，行边界字符被附加到**当前行**的末尾，而非下一行的开头。

```python
text = "line1\r\nline2\nline3"
# keepends=False: ['line1', 'line2', 'line3']
# keepends=True:  ['line1\r\n', 'line2\n', 'line3']

# 如果附加到下一行开头，结果会变成:
#                 ['', '\nline2', '\nline3']  <- 不对
```

这个设计使得 `"".join(splitlines(keepends=True))` 可以完美重建原字符串——因为每个行边界字符恰好在它原始的位置上。

### 4.5 splitlines 与 join 的关系

`splitlines` 和 `join` 是互逆操作，但只有在 `keepends=True` 时才是真正的完美互逆。

```python
# keepends=True: 完美互逆
text = "line1\r\nline2\nline3\r"
lines = text.splitlines(keepends=True)
reconstructed = "".join(lines)
print(f"  完美互逆: {text == reconstructed}")  # True

# keepends=False: 不完美互逆（丢失换行类型）
text2 = "line1\r\nline2\r\nline3"
lines2 = text2.splitlines()
rejoined = "\n".join(lines2)
print(f"  统一换行: {rejoined!r}")  # 'line1\nline2\nline3'  <- 全变成 \n
```

运行结果：

```text
  完美互逆: True
  统一换行: 'line1\nline2\nline3'
```

**关键点说明**：

- `keepends=True` + `"".join()` = 完美重建原字符串
- `keepends=False` + `"\n".join()` = 将所有换行统一为 `\n`（丢失原始的 `\r\n` 和 `\r`）
- 如果只需要统一换行格式，`keepends=False` + `"\n".join()` 正好可以实现这个目的

### 4.6 splitlines 的 Unicode 行边界支持

Python 的 `splitlines` 支持全部 Unicode 行边界字符，这源于 Python 字符串的 Unicode 本质。Python 3 的字符串本身就是 Unicode 字符串，因此对所有 Unicode 行边界字符的原生支持是自然的设计选择。

这与 `split('\n')` 形成鲜明对比——`split('\n')` 只做精确的 `\n` 字符匹配，完全不识别其他任何行边界字符。

```python
# splitlines 识别所有 Unicode 行边界
text = "a\u2028b\u2029c\x85d"
print(f"  splitlines(): {text.splitlines()}")
# ['a', 'b', 'c', 'd']

# split('\n') 只识别 \n
print(f"  split('\\n'):  {text.split(chr(10))}")
# ['a\u2028b\u2029c\x85d']  <- 整个字符串未被分割
```

运行结果：

```text
  splitlines(): ['a', 'b', 'c', 'd']
  split('\n'):  ['a\u2028b\u2029c\x85d']
```

需要特别注意的是，`\v`（垂直制表符 `\x0b`）和 `\f`（换页符 `\x0c`）也被 `splitlines` 识别为行边界——这在从其他系统导入数据时可能产生意外行为。如果你不希望这些字符被当作行边界，需要在调用 `splitlines` 前先执行替换。

## 5. 总结

本文围绕 `str.splitlines()` 方法展开，主要介绍了以下内容：

- `str.splitlines(keepends=False)`：按行边界字符分割字符串，返回 `list[str]`；`keepends=True` 时保留每行末尾的行边界字符
- `keepends=False`（默认）：分割后每行是干净的内容，不包含任何换行符；`keepends=True`：保留原始行边界字符，可用 `"".join()` 完美重建原字符串
- 行边界字符：`splitlines` 识别 8 种行边界——`\n`、`\r`、`\r\n`（算一种）、`\v`(`\x0b`)、`\f`(`\x0c`)、`\x1c`、`\x1d`、`\x1e`、`\x85`、`\u2028`、`\u2029`
- `\r\n` 被当作一个行边界——不会产生中间的空字符串；这是通过前瞻下一个字符实现的
- `splitlines` vs `split('\n')` 的核心差异：`splitlines` 识别所有行边界字符、末尾换行不产生空字符串、空字符串返回空列表；`split('\n')` 只识别 `\n`、末尾换行产生空字符串、空字符串返回 `['']`
- `splitlines` vs `split()` 的核心差异：`splitlines` 只按行边界分割、保留行内空白；`split()` 按任意空白分割、忽略首尾空白、合并连续空白
- 边界行为：空字符串返回 `[]`、纯换行符返回空字符串列表、纯空白不含换行返回单元素列表、末尾换行不产生空字符串
- 最佳实践：读取文件按行处理用 `splitlines()`、保留换行用 `splitlines(keepends=True)`、CSV 用 `split(',')`、分词用 `split()`、跨平台文本用 `splitlines()`
- 原理：`splitlines` 把行边界字符当作"行结束标记"而非"分隔符"——这导致末尾换行不产生空字符串；`\r\n` 通过前瞻逻辑被当作一个整体行边界；`keepends=True` 将行边界附加到当前行末尾使得 `"".join()` 可完美重建
