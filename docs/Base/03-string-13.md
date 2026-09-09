---
group:
  title: 【03】字符串介绍
  order: 3
order: 13
title: 子串位置查找
nav:
  title: Python基础
  order: 1
---

# 子串位置查找

## 1. 介绍

### 1.1 什么是子串位置查找

子串位置查找，就是在字符串中搜索某个子串，返回它出现的位置索引。这是字符串操作中最基础也最高频的需求之一——解析日志、提取路径信息、定位关键词、分割字段……几乎所有涉及文本处理的场景都离不开它。

Python 提供了四个内置方法来完成子串位置查找：

- `find(sub)`：从左到右查找子串首次出现的位置，找不到返回 `-1`
- `rfind(sub)`：从右到左查找子串最后一次出现的位置，找不到返回 `-1`
- `index(sub)`：与 `find` 类似，但找不到时抛出 `ValueError`
- `rindex(sub)`：与 `rfind` 类似，但找不到时抛出 `ValueError`

```python
text = "Hello, World! Hello, Python!"

# find 返回第一次出现的位置
print(text.find("Hello"))    # 0

# rfind 返回最后一次出现的位置
print(text.rfind("Hello"))   # 14

# index 和 find 行为相同，但找不到时报错
print(text.index("World"))   # 7
```

**运行结果**：

```text
0
14
7
```

### 1.2 最简示例

用一个日志解析的场景来展示这四个方法的典型使用——`find` 从左找时间戳起始位置，`rfind` 从右找最后一个分隔符：

```python
log = "[2024-01-15] INFO Server started on port 8080"

# 用 find 找到时间戳的起始和结束
ts_start = log.find("[")
ts_end = log.find("]")
print(f"时间戳: {log[ts_start+1:ts_end]}")

# 用 find 找到日志级别
level_start = ts_end + 2
level_end = log.find(" ", level_start)
print(f"日志级别: {log[level_start:level_end]}")

# 用 rfind 找到最后一个空格，提取端口号
last_space = log.rfind(" ")
print(f"端口号: {log[last_space+1:]}")
```

**运行结果**：

```text
时间戳: 2024-01-15
日志级别: INFO
端口号: 8080
```

### 1.3 方法速览

| 方法 | 查找方向 | 找不到时 | 支持范围参数 |
|------|---------|---------|------------|
| `s.find(sub)` | 从左到右 | 返回 `-1` | `start, end` |
| `s.rfind(sub)` | 从右到左 | 返回 `-1` | `start, end` |
| `s.index(sub)` | 从左到右 | 抛出 `ValueError` | `start, end` |
| `s.rindex(sub)` | 从右到左 | 抛出 `ValueError` | `start, end` |

四个方法的签名完全对称：

```text
s.find(sub[, start[, end]])
s.rfind(sub[, start[, end]])
s.index(sub[, start[, end]])
s.rindex(sub[, start[, end]])
```

## 2. 核心内容

### 2.1 find()：查找子串首次出现的位置

#### 2.1.1 基本用法

`find()` 从字符串左侧开始搜索，返回子串**第一次出现**的索引位置。如果子串不存在，返回 `-1`：

```python
text = "Hello, World! Hello, Python!"
print(f"字符串: {text!r}")
print(f"find('Hello'):  {text.find('Hello')}")   # 0（第一次出现）
print(f"find('World'):  {text.find('World')}")   # 7
print(f"find('Python'): {text.find('Python')}")  # 21
print(f"find('Java'):   {text.find('Java')}")    # -1（未找到）
print(f"find('o'):      {text.find('o')}")       # 4（第一个 'o'）
```

**运行结果**：

```text
字符串: 'Hello, World! Hello, Python!'
find('Hello'):  0
find('World'):  7
find('Python'): 21
find('Java'):   -1
find('o'):      4
```

注意 `find('o')` 返回的是 `4`，即字符串中第一个 `'o'` 的位置——`find` 只返回**首次出现**的位置，不会告诉你后面还有多少个 `'o'`。

#### 2.1.2 找不到时返回 -1

`find` 最大的特点是找不到子串时返回 `-1` 而**不会报错**。这让 `find` 非常适合"不确定子串是否存在"的场景：

```python
text = "abcdefg"
print(f"find('xyz'): {text.find('xyz')}")  # -1

# 通常配合条件判断使用
pos = text.find("cd")
if pos != -1:
    print(f"找到了，在位置 {pos}")
else:
    print("没找到")
```

**运行结果**：

```text
find('xyz'): -1
找到了，在位置 2
```

#### 2.1.3 空字符串的查找

空字符串 `""` 作为子串时，`find` 返回 `0`——因为空字符串可以被视为在字符串的任何位置"出现"，`find` 返回的是第一个位置：

```python
print(f"'hello'.find(''): {'hello'.find('')}")  # 0
print(f"''.find(''):     {('').find('')}")      # 0
```

**运行结果**：

```text
'hello'.find(''): 0
''.find(''):      0
```

### 2.2 find() 的范围参数

#### 2.2.1 start 参数：从指定位置开始查找

`find(sub, start)` 从 `start` 索引位置开始搜索，跳过 `start` 之前的内容。这在需要查找子串的**后续出现位置**时特别有用：

```python
text = "apple, banana, apple, cherry"
print(f"字符串: {text!r}")

# 第一次出现
pos1 = text.find("apple")
print(f"第一次 find('apple'): {pos1}")  # 0

# 从 pos1 + 1 开始继续找下一次出现
pos2 = text.find("apple", pos1 + 1)
print(f"从位置 {pos1+1} 再 find('apple'): {pos2}")  # 15

# 从 pos2 + 1 之后没有更多 apple 了
pos3 = text.find("apple", pos2 + 1)
print(f"从位置 {pos2+1} 再 find('apple'): {pos3}")  # -1
```

**运行结果**：

```text
字符串: 'apple, banana, apple, cherry'
第一次 find('apple'): 0
从位置 1 再 find('apple'): 15
从位置 16 再 find('apple'): -1
```

#### 2.2.2 start + end 参数：限定查找范围

`find(sub, start, end)` 在 `[start, end)` 范围内查找，等价于 `s[start:end].find(sub)`：

```python
text = "2024-01-15.log.2024-01-16.log"
print(f"字符串: {text!r}")

# 在整个字符串中查找 "log"
print(f"find('log'):         {text.find('log')}")          # 11
# 只在 [0, 15) 范围内查找
print(f"find('log', 0, 15):  {text.find('log', 0, 15)}")   # 11
# 只在 [15, 30) 范围内查找
print(f"find('log', 15):     {text.find('log', 15)}")     # 26
# 范围内找不到返回 -1
print(f"find('log', 0, 10):  {text.find('log', 0, 10)}")  # -1
```

**运行结果**：

```text
字符串: '2024-01-15.log.2024-01-16.log'
find('log'):         11
find('log', 0, 15):  11
find('log', 15):     26
find('log', 0, 10):  -1
```

#### 2.2.3 范围参数的切片语义

理解范围参数的关键——`find(sub, start, end)` 与切片 `s[start:end]` 的语义完全一致：

```text
s.find(sub, start, end)
    ↓ 等价于
s[start:end].find(sub)
```

切片 `s[start:end]` 包含 `start` 但不包含 `end`，`find` 的范围参数也是如此。

```python
s = "ABCDEFGH"
print(f"字符串: {s}")
print(f"find('CD', 2):    {s.find('CD', 2)}")      # 2（s[2:] 开头就是 CD）
print(f"find('CD', 2, 5): {s.find('CD', 2, 5)}")    # 2（s[2:5]="CDE" 包含 CD）
print(f"find('CD', 3):    {s.find('CD', 3)}")      # -1（s[3:]="DEFGH"，没有 CD）
```

**运行结果**：

```text
字符串: ABCDEFGH
find('CD', 2):    2
find('CD', 2, 5): 2
find('CD', 3):    -1
```

#### 2.2.4 完整参数速查

| 参数 | 含义 | 默认值 | 说明 |
|------|------|--------|------|
| `sub` | 要查找的子串 | 必填 | 字符串 |
| `start` | 查找起始位置 | 0 | 从该索引开始查找 |
| `end` | 查找结束位置（不含） | `len(s)` | 到该索引为止（不含） |

### 2.3 find() 的实战：找出所有出现位置

`find` 只返回第一次出现的位置，要找出所有出现位置，需要配合循环：

```python
text = "abracadabra"
target = "abra"
print(f"字符串: {text!r}, 目标: {target!r}")

positions = []
start = 0
while True:
    pos = text.find(target, start)
    if pos == -1:
        break
    positions.append(pos)
    start = pos + 1  # 从下一个位置继续找

print(f"所有出现位置: {positions}")  # [0, 7]
print(f"出现次数: {len(positions)}")
```

**运行结果**：

```text
字符串: 'abracadabra', 目标: 'abra'
所有出现位置: [0, 7]
出现次数: 2
```

**注意**：`start = pos + 1` 而非 `pos + len(target)`。两者有微妙差别：

- `pos + 1`：允许重叠匹配。比如在 `"aaa"` 中找 `"aa"`，会找到位置 0 和 1
- `pos + len(target)`：不允许重叠。在 `"aaa"` 中找 `"aa"` 只找到位置 0

```python
text = "aaa"
target = "aa"

# 允许重叠
pos1 = []
start = 0
while True:
    p = text.find(target, start)
    if p == -1:
        break
    pos1.append(p)
    start = p + 1

# 不允许重叠
pos2 = []
start = 0
while True:
    p = text.find(target, start)
    if p == -1:
        break
    pos2.append(p)
    start = p + len(target)

print(f"允许重叠: {pos1}")  # [0, 1]
print(f"不允许重叠: {pos2}")  # [0]
```

**运行结果**：

```text
允许重叠: [0, 1]
不允许重叠: [0]
```

### 2.4 rfind()：从右侧查找子串位置

#### 2.4.1 基本用法

`rfind()` 从字符串右侧开始搜索，返回子串**最后一次出现**的索引位置。与 `find` 方向相反，但返回值仍是**从头数的索引**：

```python
text = "Hello, World! Hello, Python!"
print(f"字符串: {text!r}")
print(f"find('Hello'):    {text.find('Hello')}")    # 0（从左找第一个）
print(f"rfind('Hello'):   {text.rfind('Hello')}")   # 14（从右找最后一个）
print(f"rfind('o'):       {text.rfind('o')}")       # 25（最后一个 'o'）
```

**运行结果**：

```text
字符串: 'Hello, World! Hello, Python!'
find('Hello'):    0
rfind('Hello'):   14
rfind('o'):       25
```

`rfind` 返回的索引仍然是相对于字符串开头的位置——它只是搜索方向从右往左，返回的是最后一个匹配子串的起始索引。

#### 2.4.2 find 与 rfind 的配合使用

`find` 和 `rfind` 配合使用时最常见的场景是**路径和文件名解析**——用 `rfind` 找最后一个分隔符，从分隔符处切分出文件名和目录名：

```python
path = "/home/user/documents/report.pdf"
print(f"路径: {path!r}")

# 用 rfind 找最后一个斜杠
last_slash = path.rfind("/")
print(f"最后一个斜杠位置: {last_slash}")

# 提取文件名 = 最后一个斜杠之后的部分
filename = path[last_slash + 1:]
print(f"文件名: {filename!r}")  # 'report.pdf'

# 提取目录名 = 最后一个斜杠之前的部分
dirname = path[:last_slash]
print(f"目录名: {dirname!r}")  # '/home/user/documents'
```

**运行结果**：

```text
路径: '/home/user/documents/report.pdf'
最后一个斜杠位置: 20
文件名: 'report.pdf'
目录名: '/home/user/documents'
```

这里用 `rfind` 而非 `find` 的原因——路径中可能有多个斜杠，我们要的是最后一个，这样才能正确提取文件名。

#### 2.4.3 rfind 的范围参数

`rfind` 同样支持 `start` 和 `end` 参数，语义与 `find` 对称——在 `[start, end)` 范围内从右侧查找：

```python
text = "error.log.2024.error.log.2025"
print(f"字符串: {text!r}")

# 在整个字符串中找最后一个 "error"
print(f"rfind('error'):             {text.rfind('error')}")           # 15
# 只在 [0, 10) 范围内找
print(f"rfind('error', 0, 10):      {text.rfind('error', 0, 10)}")    # 0
# 只在 [10, 27) 范围内找
print(f"rfind('error', 10):         {text.rfind('error', 10)}")      # 15
```

**运行结果**：

```text
字符串: 'error.log.2024.error.log.2025'
rfind('error'):             15
rfind('error', 0, 10):      0
rfind('error', 10):         15
```

#### 2.4.4 空字符串与找不到的情况

空字符串作为子串时，`rfind` 返回 `len(s)`——因为空字符串可以视为在字符串末尾"之后"出现：

```python
print(f"'hello'.rfind(''): {'hello'.rfind('')}")  # 5
print(f"''.rfind(''):      {('').rfind('')}")     # 0
print(f"'hello'.rfind('x'): {'hello'.rfind('x')}")  # -1
```

**运行结果**：

```text
'hello'.rfind(''): 5
''.rfind(''):      0
'hello'.rfind('x'): -1
```

这与 `find` 返回 `0` 不同——`find('')` 返回字符串开头位置 `0`，`rfind('')` 返回字符串末尾位置 `len(s)`。空字符串被视为"出现在每一个位置上"，`find` 返回最左边（0），`rfind` 返回最右边（`len(s)`）。

#### 2.4.5 实战：提取文件扩展名

```python
files = ["report.pdf", "photo.tar.gz", "script.py", "README", "data.csv.bak"]
print("提取文件扩展名：")
for f in files:
    dot_pos = f.rfind(".")
    if dot_pos == -1:
        print(f"  {f:20s} -> 无扩展名")
    else:
        ext = f[dot_pos + 1:]
        name = f[:dot_pos]
        print(f"  {f:20s} -> 文件名: {name!r}, 扩展名: {ext!r}")
```

**运行结果**：

```text
提取文件扩展名：
  report.pdf           -> 文件名: 'report', 扩展名: 'pdf'
  photo.tar.gz         -> 文件名: 'photo.tar', 扩展名: 'gz'
  script.py            -> 文件名: 'script', 扩展名: 'py'
  README               -> 无扩展名
  data.csv.bak         -> 文件名: 'data.csv', 扩展名: 'bak'
```

用 `rfind` 而非 `find` 找 `.`——因为文件名可能有多个点（如 `photo.tar.gz`），`rfind` 找最后一个点才能正确提取出真正的扩展名。

### 2.5 index() 与 rindex()：查找失败时抛出异常

#### 2.5.1 基本用法

`index()` 和 `rindex()` 的行为与 `find()` 和 `rfind()` 完全相同，唯一区别是——**当查找失败时，不返回 `-1`，而是抛出 `ValueError`**：

```python
text = "Hello, World!"
print(f"index('Hello'): {text.index('Hello')}")  # 0
print(f"index('World'): {text.index('World')}")  # 7
print(f"index('o'):     {text.index('o')}")     # 4
```

**运行结果**：

```text
index('Hello'): 0
index('World'): 7
index('o'): 4
```

`rindex` 从右侧查找：

```python
text = "Hello, World! Hello, Python!"
print(f"index('Hello'):   {text.index('Hello')}")    # 0
print(f"rindex('Hello'):  {text.rindex('Hello')}")   # 14
print(f"rindex('o'):      {text.rindex('o')}")      # 25
```

**运行结果**：

```text
index('Hello'):   0
rindex('Hello'):  14
rindex('o'):      25
```

#### 2.5.2 找不到时抛出 ValueError

这是 `index` 与 `find` 的核心区别：

```python
text = "abcdefg"

# find 找不到返回 -1，不报错
print(f"find('xyz'):  {text.find('xyz')}")  # -1

# index 找不到抛出 ValueError
try:
    text.index("xyz")
except ValueError as e:
    print(f"index('xyz') 抛出: ValueError: {e}")

# rindex 同理
try:
    text.rindex("xyz")
except ValueError as e:
    print(f"rindex('xyz') 抛出: ValueError: {e}")
```

**运行结果**：

```text
find('xyz'):  -1
index('xyz') 抛出: ValueError: substring not found
rindex('xyz') 抛出: ValueError: substring not found
```

#### 2.5.3 index 也支持范围参数

`index` 和 `rindex` 同样支持 `start` 和 `end` 参数，语义与 `find`/`rfind` 完全一致：

```python
text = "2024-01-15.2024-06-20"
print(f"字符串: {text!r}")
print(f"index('2024'):        {text.index('2024')}")         # 0
print(f"index('2024', 5):     {text.index('2024', 5)}")     # 11
print(f"index('-', 0, 12):    {text.index('-', 0, 12)}")    # 4
```

**运行结果**：

```text
字符串: '2024-01-15.2024-06-20'
index('2024'):        0
index('2024', 5):     11
index('-', 0, 12):    4
```

#### 2.5.4 安全使用 index 的模式

当你使用 `index` 但不确定子串是否存在时，需要用 `try/except` 捕获异常：

```python
log_lines = [
    "[INFO] Server started",
    "[ERROR] Connection refused",
    "Server running normally",
    "[WARN] High memory usage",
]

print("提取日志级别：")
for line in log_lines:
    try:
        bracket_start = line.index("[")
        bracket_end = line.index("]", bracket_start)
        level = line[bracket_start + 1 : bracket_end]
        print(f"  {line!r} -> 级别: {level}")
    except ValueError:
        print(f"  {line!r} -> 无日志级别标记")
```

**运行结果**：

```text
提取日志级别：
  '[INFO] Server started' -> 级别: INFO
  '[ERROR] Connection refused' -> 级别: ERROR
  'Server running normally' -> 无日志级别标记
  '[WARN] High memory usage' -> 级别: WARN
```

### 2.6 四个方法的完整对比

#### 2.6.1 行为对比表

| 维度 | `find()` | `rfind()` | `index()` | `rindex()` |
|------|----------|-----------|-----------|------------|
| 查找方向 | 从左到右 | 从右到左 | 从左到右 | 从右到左 |
| 返回值 | 首次出现索引 | 最后出现索引 | 首次出现索引 | 最后出现索引 |
| 找不到时 | 返回 `-1` | 返回 `-1` | 抛出 `ValueError` | 抛出 `ValueError` |
| 范围参数 | `start, end` | `start, end` | `start, end` | `start, end` |
| 空字符串返回 | `0` | `len(s)` | `0` | `len(s)` |

#### 2.6.2 find/rfind 与 index/rindex 的等价关系

```python
text = "abcdabcd"

# 找到时：find 和 index 返回值相同
print(f"find('a'):   {text.find('a')}")    # 0
print(f"index('a'):  {text.index('a')}")   # 0

# 找到时：rfind 和 rindex 返回值相同
print(f"rfind('a'):  {text.rfind('a')}")   # 4
print(f"rindex('a'): {text.rindex('a')}")  # 4
```

**运行结果**：

```text
find('a'):   0
index('a'):  0
rfind('a'):  4
rindex('a'): 4
```

唯一差异在于找不到时的行为：

```python
text = "abcdabcd"
print(f"find('z'):    {text.find('z')}")    # -1
print(f"rfind('z'):   {text.rfind('z')}")   # -1
# text.index('z')   → ValueError
# text.rindex('z')  → ValueError
```

**运行结果**：

```text
find('z'):    -1
rfind('z'):   -1
```

#### 2.6.3 与 in 运算符的对比

当你**只需要判断子串是否存在**而不需要位置信息时，`in` 运算符是最简洁的选择：

```python
text = "Hello, World!"
target = "World"

# in 只返回是否存在，不返回位置
print(f"'{target}' in text: {target in text}")  # True

# find 返回位置，-1 表示不存在
print(f"find('{target}'): {text.find(target)}")  # 7

# index 返回位置，不存在则报错
print(f"index('{target}'): {text.index(target)}")  # 7
```

**运行结果**：

```text
'World' in text: True
find('World'): 7
index('World'): 7
```

### 2.7 与其他查找方法的对比

`find`/`rfind`/`index`/`rindex` 是"查找位置"的方法，Python 字符串还有其他相关的查找方法，它们的适用场景不同：

| 方法 | 返回什么 | 找不到时 | 典型场景 |
|------|---------|---------|---------|
| `find(sub)` | 首次出现位置 | `-1` | 需要位置，不确定是否存在 |
| `rfind(sub)` | 最后出现位置 | `-1` | 需要最后位置（如最后一个分隔符） |
| `index(sub)` | 首次出现位置 | `ValueError` | 需要位置，确信一定存在 |
| `rindex(sub)` | 最后出现位置 | `ValueError` | 需要最后位置，确信一定存在 |
| `in` | `True/False` | `False` | 只判断是否存在，不关心位置 |
| `count(sub)` | 出现次数 | `0` | 统计出现次数 |
| `split(sep)` | 分割后的列表 | 返回整个字符串 | 需要按分隔符切割 |

**选择决策**：

```text
你需要什么？
    ├── 只判断是否存在
    │       → in（最清晰）
    ├── 需要位置 + 不确定存在
    │       → find() / rfind()（返回 -1 不报错）
    ├── 需要位置 + 确信存在
    │       → index() / rindex()（不存在即报错，暴露 bug）
    ├── 统计出现次数
    │       → count()
    └── 按分隔符切割
            → split()
```

### 2.8 实战：配合 count() 先判断再查找

```python
text = "apple, banana, apple, cherry, apple"
target = "apple"

count = text.count(target)
print(f"字符串: {text!r}")
print(f"count('{target}'): {count}")

if count == 0:
    print("未找到")
elif count == 1:
    print(f"只出现一次，位置: {text.find(target)}")
else:
    print(f"出现 {count} 次，所有位置：")
    start = 0
    for i in range(count):
        pos = text.find(target, start)
        print(f"  第 {i + 1} 次: 位置 {pos}")
        start = pos + 1
```

**运行结果**：

```text
字符串: 'apple, banana, apple, cherry, apple'
count('apple'): 3
出现 3 次，所有位置：
  第 1 次: 位置 0
  第 2 次: 位置 15
  第 3 次: 位置 30
```

### 2.9 实战：URL 解析

用 `find` 和 `rfind` 配合解析 URL 中的协议、域名和路径：

```python
urls = [
    "https://www.example.com/products/electronics/iphone",
    "http://localhost:8080/api/v1/users",
    "https://docs.python.org/3/library/string.html",
]

print("用 find / rfind 解析 URL：")
for url in urls:
    # 协议：找 "://" 的位置
    scheme_end = url.find("://")
    scheme = url[:scheme_end]

    # 域名：从 "://" 后到第一个 "/"
    host_start = scheme_end + 3
    host_end = url.find("/", host_start)
    if host_end == -1:
        host = url[host_start:]
        path = "/"
    else:
        host = url[host_start:host_end]
        path = url[host_end:]

    # 最后一个路径段：用 rfind 找最后一个 "/"
    last_slash = url.rfind("/")
    last_segment = url[last_slash + 1:]

    print(f"  URL:  {url}")
    print(f"    协议: {scheme}, 域名: {host}")
    print(f"    路径: {path}")
    print(f"    最后一段: {last_segment}")
```

**运行结果**：

```text
用 find / rfind 解析 URL：
  URL:  https://www.example.com/products/electronics/iphone
    协议: https, 域名: www.example.com
    路径: /products/electronics/iphone
    最后一段: iphone
  URL:  http://localhost:8080/api/v1/users
    协议: http, 域名: localhost:8080
    路径: /api/v1/users
    最后一段: users
  URL:  https://docs.python.org/3/library/string.html
    协议: https, 域名: docs.python.org
    路径: /3/library/string.html
    最后一段: string.html
```

## 3. 最佳实践

### 3.1 推荐 vs 不推荐写法

| 场景 | 不推荐 | 推荐 | 原因 |
|------|--------|------|------|
| 只判断是否存在 | `s.find(x) != -1` | `x in s` | `in` 语义更清晰 |
| 需要位置 + 不确定存在 | `s.index(x)` | `s.find(x)` | `index` 找不到会抛异常 |
| 需要位置 + 确信存在 | `s.find(x); if != -1` | `s.index(x)` | `index` 在异常时暴露 bug |
| 找最后一个分隔符 | `s[::-1].find(x)` | `s.rfind(x)` | `rfind` 直接从右找，无需反转 |
| 找所有出现位置 | 多次 `find` 手动判断 | 循环 + `find` + `pos+1` | 循环结构更清晰 |
| 忽略大小写查找 | `s.find('ABC')` | `s.lower().find('abc')` | 先转小写再查找 |

### 3.2 常见错误模式

**错误1：用 index 处理不确定存在的子串**

```python
text = "配置文件中可能没有这个字段"

# 不推荐：index 找不到会抛 ValueError，如果没捕获会中断程序
try:
    pos = text.index("端口号")
except ValueError:
    pos = -1

# 推荐：直接用 find，返回 -1 不报错
pos = text.find("端口号")
```

**错误2：用 find 判断存在性时忘记判断 -1**

```python
text = "Hello, World!"

# 错误：直接使用 find 返回值，忘记 -1 的场景
pos = text.find("Java")
if pos:  # -1 是 truthy，这会进入 if！
    print(f"找到了，在位置 {pos}")  # 误判！

# 正确：必须显式判断 != -1
if pos != -1:
    print(f"找到了，在位置 {pos}")
else:
    print("没找到")
```

**运行结果**：

```text
找到了，在位置 -1  # 误判！-1 是 truthy
没找到
```

这是一个极易踩的坑——`find` 返回 `-1` 表示未找到，而 `-1` 在布尔上下文中是 `True`（只有 `0` 是 `False`）。所以 `if pos:` 对 `-1` 会判断为 `True`，产生误判。必须用 `if pos != -1:` 或 `if pos >= 0:`。

**错误3：用切片+find 代替范围参数**

```python
text = "Hello, World! Hello, Python!"

# 不推荐：先切片再 find，多创建了一个字符串对象
pos = text[7:].find("Hello")

# 推荐：直接用范围参数，不创建中间字符串
pos = text.find("Hello", 7)
```

**错误4：混淆 find 和 split 的场景**

```python
csv_line = "张三,25,北京"

# 不推荐：用 find 手动找分隔符，代码冗长
pos1 = csv_line.find(",")
name = csv_line[:pos1]
pos2 = csv_line.find(",", pos1 + 1)
age = csv_line[pos1+1:pos2]
city = csv_line[pos2+1:]

# 推荐：需要分割时直接用 split
name, age, city = csv_line.split(",")
```

### 3.3 性能注意事项

**时间复杂度**：`find` 和 `rfind` 的时间复杂度在最坏情况下是 **O(n×m)**（n 是字符串长度，m 是子串长度），因为底层使用的是高效的字符串搜索算法。对于大多数实际场景（子串较短），性能近似 O(n)。

**范围参数比先切片更高效**——`find(sub, start, end)` 不会创建中间字符串对象：

```python
text = "a" * 10_000_000 + "target"

# 更高效：直接用范围参数
pos = text.find("target", 5)  # 在原字符串上偏移计算

# 较低效：先切片再查找
pos = text[5:].find("target")  # 创建了一个新的字符串副本
```

**find 与 in 的性能对比**：当你只需要判断"是否存在"时，`in` 运算符通常比 `find != -1` 更快，因为 `in` 只需要返回布尔值，不需要计算具体位置：

```python
# 判断是否存在，in 更快
if "target" in text:
    ...

# 如果同时需要位置信息，用 find
pos = text.find("target")
if pos != -1:
    ...
```

### 3.4 find vs index 的选择策略

什么时候用 `find`，什么时候用 `index`？核心判断标准是——**子串是否存在是"正常情况"还是"异常情况"**：

**子串应该存在，不存在即异常 → 用 `index`**

```python
# 模板中确信有占位符，找不到说明模板被改错了
template = "Dear {name}, your order {order_id} is confirmed."
name_pos = template.index("{name}")   # 找不到立即暴露问题
order_pos = template.index("{order_id}")
```

**子串可能存在也可能不存在 → 用 `find`**

```python
# 配置文件中某个选项可能存在也可能不存在
config = "port=8080\nhost=localhost\n"
port_pos = config.find("port=")
if port_pos != -1:
    # 提取端口号
    value_start = port_pos + len("port=")
    value_end = config.find("\n", value_start)
    port = config[value_start:value_end]
    print(f"端口: {port}")
else:
    print("未配置端口")
```

**运行结果**：

```text
端口: 8080
```

## 4. 原理

### 4.1 find / rfind 的底层实现

`find` 和 `rfind` 在 CPython 中由 C 实现，底层使用高效的字符串搜索算法。核心流程：

```text
s.find(sub)
    ↓
1. 参数校验：检查 sub 类型（必须是 str）
2. 处理 start/end 参数：
     → 将负索引转换为正索引
     → 将 end 截断到 len(s)
     → 确定 [start, end) 搜索范围
3. 特殊情况快速返回：
     → sub 为空字符串：返回 start
     → sub 长度 > 搜索范围长度：返回 -1
4. 在 s[start:end] 中搜索 sub：
     → 使用 C 层面的字符串匹配算法
     → 找到则返回起始索引
     → 找不到返回 -1
```

`rfind` 的流程完全对称，只是搜索方向从右往左：

```text
s.rfind(sub)
    ↓
1. 参数校验 + 范围处理（同 find）
2. 特殊情况：
     → sub 为空字符串：返回 end（即范围终止位置）
3. 在 s[start:end] 中从右往左搜索 sub：
     → 返回最后一次出现的起始索引
     → 找不到返回 -1
```

### 4.2 为什么空字符串返回值不同

`find('')` 返回 `0`，`rfind('')` 返回 `len(s)`——这是因为空字符串被视为出现在字符串的**每一个位置**（包括首尾）：

```text
s = "hello"  (长度 5)
空串可出现的位置: 0 1 2 3 4 5（共 6 个位置）

find('')  → 返回最左边的位置 → 0
rfind('') → 返回最右边的位置 → 5 (= len(s))
```

```python
s = "hello"
print(f"find(''):   {s.find('')}")     # 0
print(f"rfind(''):  {s.rfind('')}")    # 5

# 范围参数同样影响空字符串的返回值
print(f"find('', 2):   {s.find('', 2)}")     # 2
print(f"rfind('', 2):  {s.rfind('', 2)}")    # 5
print(f"find('', 2, 4):  {s.find('', 2, 4)}")  # 2
print(f"rfind('', 2, 4): {s.rfind('', 2, 4)}")  # 4
```

**运行结果**：

```text
find(''):   0
rfind(''):  5
find('', 2):   2
rfind('', 2):  5
find('', 2, 4):  2
rfind('', 2, 4): 4
```

### 4.3 范围参数不创建切片副本

与 `startswith`/`endswith` 一样，`find(sub, start, end)` 虽然语义上等价于 `s[start:end].find(sub)`，但底层**不会真的创建切片副本**——而是直接在原字符串的内存上偏移计算：

```text
直接调用（高效，无副本）:
    s.find("abc", 5, 20)
    → 在 s 的内存上，从偏移 5 搜索到偏移 20
    → 不创建新字符串

先切片再调用（低效，创建副本）:
    s[5:20].find("abc")
    → 先创建一个长度 15 的新字符串对象
    → 再在新字符串上调用 find
```

所以，如果需要在字符串的某个范围内查找子串，**直接用范围参数**比先切片更高效：

```python
text = "Hello, World!"

# 推荐：直接用范围参数
pos = text.find("World", 7)  # 高效

# 不推荐：先切片再查找
pos = text[7:].find("World")  # 多创建了一个字符串对象
```

### 4.4 find 返回 -1 而非抛异常的设计原因

Python 选择让 `find` 返回 `-1` 而非抛异常，是为了**效率**——在大量查找场景中，"找不到"是正常情况而非异常。如果每次都要 try/except，代码会变得冗长且性能下降：

```python
# find 的模式：简洁高效
pos = text.find("keyword")
if pos != -1:
    process(text[pos:])

# 如果 find 也抛异常，代码变为：
try:
    pos = text.find("keyword")
    process(text[pos:])
except ValueError:
    pass  # 找不到就跳过
```

而 `index` 的存在是为了另一种场景——当"找不到"是一种**不应该发生的错误**时，用 `index` 让异常自然抛出，立即暴露问题而非静默返回 `-1`。两种方法服务于不同的编程风格：防御式编程用 `find`，断言式编程用 `index`。

## 5. 总结

本文围绕子串位置查找展开，主要介绍了以下内容：

- `find(sub)` 从左到右查找子串首次出现的位置，`rfind(sub)` 从右到左查找最后一次出现的位置，找不到时均返回 `-1`
- `index(sub)` 和 `rindex(sub)` 与 `find`/`rfind` 行为相同，但找不到时抛出 `ValueError` 而非返回 `-1`
- 四个方法都支持 `start` 和 `end` 范围参数，语义等价于 `s[start:end].find(sub)`，但不创建切片副本
- `find('')` 返回 `0`，`rfind('')` 返回 `len(s)`——空字符串被视为出现在每一个位置上
- `find` 返回 `-1` 在布尔判断中是 `True`，判断存在性时必须用 `!= -1` 而非 `if pos:`
- `find` 和 `rfind` 配合循环可以找出所有出现位置，注意 `pos + 1` 允许重叠匹配，`pos + len(sub)` 不允许
- 只判断子串是否存在时用 `in` 运算符最清晰；需要位置信息时用 `find`/`rfind`；确信一定存在时用 `index`/`rindex`
- 子串应该存在、不存在即异常时用 `index`；子串可能存在也可能不存在时用 `find`
- 范围参数比先切片再查找更高效，因为不创建中间字符串对象
- `rfind` 常用于路径解析——找最后一个分隔符提取文件名和目录名
