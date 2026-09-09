---
group:
  title: 【03】字符串介绍
  order: 3
order: 14
title: 子串计数方法
nav:
  title: Python基础
  order: 1
---

# 子串计数方法

## 1. 介绍

### 1.1 什么是子串计数

子串计数，就是统计一个子串在字符串中出现了多少次。这是文本处理中的基础操作——统计日志中某个错误出现的次数、分析文本中关键词的频率、校验 CSV 行的字段数、检查代码中括号是否配对……这些场景都需要"数一数某个子串出现了几次"。

Python 提供了一个内置方法来完成这件事：

- `count(sub)`：统计子串 `sub` 在字符串中出现的次数，不存在时返回 `0`

```python
text = "Hello, World! Hello, Python!"
print(text.count("Hello"))   # 2
print(text.count("o"))       # 4
print(text.count("Java"))    # 0
```

**运行结果**：

```text
2
4
0
```

### 1.2 最简示例

用一个日志分析的场景展示 `count` 的典型使用——统计不同级别日志出现的次数：

```python
logs = """
[INFO] Server started
[ERROR] Database connection failed
[ERROR] Query timeout
[WARN] Cache hit rate dropped
[INFO] User logged in
[ERROR] Disk full
"""

for level in ["INFO", "ERROR", "WARN", "DEBUG"]:
    count = logs.count(f"[{level}]")
    print(f"{level}: {count} 条")

# 计算错误率
total = logs.count("[")
print(f"\n错误率: {logs.count('[ERROR]') / total * 100:.1f}%")
```

**运行结果**：

```text
INFO: 2 条
ERROR: 3 条
WARN: 1 条
DEBUG: 0 条

错误率: 50.0%
```

### 1.3 方法速览

| 方法 | 作用 | 返回值 | 支持范围参数 |
|------|------|--------|------------|
| `s.count(sub)` | 统计子串出现次数 | `int`（非负整数） | `start, end` |

方法签名：

```text
s.count(sub[, start[, end]])
```

| 参数 | 含义 | 默认值 | 说明 |
|------|------|--------|------|
| `sub` | 要计数的子串 | 必填 | 字符串 |
| `start` | 计数起始位置 | 0 | 从该索引开始计数 |
| `end` | 计数结束位置（不含） | `len(s)` | 到该索引为止（不含） |

## 2. 核心内容

### 2.1 count()：基本用法

#### 2.1.1 统计子串出现次数

`count()` 返回子串在字符串中**非重叠出现**的次数。如果子串不存在，返回 `0`：

```python
text = "Hello, World! Hello, Python!"
print(f"字符串: {text!r}")
print(f"count('Hello'):  {text.count('Hello')}")   # 2
print(f"count('o'):      {text.count('o')}")       # 4
print(f"count('l'):      {text.count('l')}")       # 5
print(f"count(', '):     {text.count(', ')}")       # 2
print(f"count('Java'):   {text.count('Java')}")    # 0（未找到）
```

**运行结果**：

```text
字符串: 'Hello, World! Hello, Python!'
count('Hello'):  2
count('o'):      4
count('l'):      5
count(', '):     2
count('Java'):   0
```

`count` 返回的是非重叠出现的次数——找到一次匹配后，跳过整个匹配长度，从下一个字符继续搜索。这个行为在后面会详细讲解。

#### 2.1.2 区分大小写

`count` **区分大小写**——`"Python"` 和 `"python"` 是不同的子串：

```python
text = "Python python PYTHON"
print(f"字符串: {text!r}")
print(f"count('Python'): {text.count('Python')}")   # 1
print(f"count('python'): {text.count('python')}")   # 1
print(f"count('PYTHON'): {text.count('PYTHON')}")   # 1

# 忽略大小写：先转小写再计数
print(f"忽略大小写: {text.lower().count('python')}")  # 3
```

**运行结果**：

```text
字符串: 'Python python PYTHON'
count('Python'): 1
count('python'): 1
count('PYTHON'): 1
忽略大小写: 3
```

如果需要忽略大小写统计，标准做法是 `text.lower().count(sub.lower())`——将原字符串和子串都转为小写后再计数。

#### 2.1.3 子串比字符串长

当子串比字符串还长时，`count` 直接返回 `0`，不会报错：

```python
print(f"'Hi'.count('Hello'): {'Hi'.count('Hello')}")  # 0
```

**运行结果**：

```text
'Hi'.count('Hello'): 0
```

### 2.2 count() 的特殊行为

#### 2.2.1 空字符串的计数

空字符串 `""` 作为子串时，`count` 的返回值是 `len(s) + 1`——因为空字符串被视为出现在字符串的**每一个字符间隙**（包括首尾）：

```python
text = "hello"
print(f"字符串: {text!r}")
print(f"len(s):       {len(text)}")
print(f"count(''):    {text.count('')}")  # 6 (= len + 1)
```

**运行结果**：

```text
字符串: 'hello'
len(s):       5
count(''):    6
```

理解这个行为的关键——把空字符串想象成"插入点"：

```text
h e l l o
^ ^ ^ ^ ^ ^
0 1 2 3 4 5  ← 6 个插入点 = count('') 的返回值
```

空字符串在空字符串中的计数：

```python
print(f"''.count(''): {(''.count(''))}")  # 1
```

**运行结果**：

```text
''.count(''): 1
```

空字符串 `""` 的长度为 `0`，`len + 1 = 1`，所以 `"".count("")` 返回 `1`。

#### 2.2.2 不支持重叠匹配

这是 `count` 最容易被忽视的行为——**`count` 不统计重叠匹配**。找到一次匹配后，跳过整个匹配长度，从下一个字符继续搜索：

```python
text = "aaaa"
target = "aa"
print(f"字符串: {text!r}, 目标: {target!r}")
print(f"count('aa'): {text.count('aa')}")  # 2（不是 3！）
```

**运行结果**：

```text
字符串: 'aaaa', 目标: 'aa'
count('aa'): 2
```

匹配过程可视化：

```text
aaaa
^^      → 位置 0 匹配 "aa"，跳到位置 2
  ^^    → 位置 2 匹配 "aa"，跳到位置 4
         → 结束，共 2 次

（如果重叠匹配，位置 1 的 "aa" 也会算上 → 3 次）
```

另一个更直观的例子：

```python
text = "abcabcabc"
target = "abcabc"
print(f"字符串: {text!r}, 目标: {target!r}")
print(f"count('abcabc'): {text.count('abcabc')}")  # 1（不是 2！）
```

**运行结果**：

```text
字符串: 'abcabcabc', 目标: 'abcabc'
count('abcabc'): 1
```

```text
abcabcabc
^^^^^^      → 位置 0 匹配 "abcabc"，跳到位置 6
      abc   → 位置 6 开始只有 "abc"，不够 6 个字符
              → 结束，共 1 次
```

如果需要统计重叠匹配，需要手动实现——用循环逐位置检查：

```python
text = "aaaa"
target = "aa"

overlap_count = 0
for i in range(len(text) - len(target) + 1):
    if text[i:i + len(target)] == target:
        overlap_count += 1

print(f"重叠匹配次数: {overlap_count}")  # 3
```

**运行结果**：

```text
重叠匹配次数: 3
```

### 2.3 count() 的范围参数

#### 2.3.1 start 参数：从指定位置开始计数

`count(sub, start)` 从 `start` 索引位置开始统计，忽略 `start` 之前的内容：

```python
text = "apple, banana, apple, cherry, apple"
print(f"字符串: {text!r}")
print(f"count('apple'):          {text.count('apple')}")       # 3
print(f"count('apple', 10):     {text.count('apple', 10)}")    # 2（跳过第一个）
print(f"count('apple', 20):     {text.count('apple', 20)}")    # 1（跳过前两个）
print(f"count('apple', 30):     {text.count('apple', 30)}")    # 0（全部跳过）
```

**运行结果**：

```text
字符串: 'apple, banana, apple, cherry, apple'
count('apple'):          3
count('apple', 10):     2
count('apple', 20):     1
count('apple', 30):     0
```

#### 2.3.2 start + end 参数：限定计数范围

`count(sub, start, end)` 在 `[start, end)` 范围内统计，等价于 `s[start:end].count(sub)`：

```python
text = "2024-01-15.log.2024-01-16.log.2024-01-17.log"
print(f"字符串: {text!r}")
print(f"len:                  {len(text)}")

print(f"count('log'):         {text.count('log')}")          # 3
print(f"count('log', 0, 15):  {text.count('log', 0, 15)}")   # 1（只统计前 15 个字符）
print(f"count('log', 15, 30): {text.count('log', 15, 30)}") # 1（只统计 15-30 之间）
print(f"count('log', 30):     {text.count('log', 30)}")     # 1（只统计 30 之后）
```

**运行结果**：

```text
字符串: '2024-01-15.log.2024-01-16.log.2024-01-17.log'
len:                  44
count('log'):         3
count('log', 0, 15):  1
count('log', 15, 30): 1
count('log', 30):     1
```

#### 2.3.3 范围参数的切片语义

`count(sub, start, end)` 与切片 `s[start:end]` 的语义完全一致：

```text
s.count(sub, start, end)
    ↓ 等价于
s[start:end].count(sub)
```

```python
text = "error.log.2024.error.log.2025"
print(f"字符串: {text!r}")

result1 = text.count("error", 0, 10)
result2 = text[:10].count("error")

print(f"count('error', 0, 10):     {result1}")    # 1
print(f"text[:10].count('error'):  {result2}")    # 1
print(f"等价: {result1 == result2}")              # True
```

**运行结果**：

```text
字符串: 'error.log.2024.error.log.2025'
count('error', 0, 10):     1
text[:10].count('error'):  1
等价: True
```

#### 2.3.4 负数范围参数

`count` 支持负数 `start` 和 `end`，语义与切片一致——负数表示从末尾倒数：

```python
text = "Hello, World! Hello, Python!"
print(f"字符串: {text!r}")
print(f"len: {len(text)}")

# -10 → 实际从 len(s)-10 = 17 开始
print(f"count('Hello', -10):    {text.count('Hello', -10)}")     # 1
print(f"count('Hello', 0, -10): {text.count('Hello', 0, -10)}")   # 1
print(f"count('o', -10):        {text.count('o', -10)}")         # 2
```

**运行结果**：

```text
字符串: 'Hello, World! Hello, Python!'
len: 28
count('Hello', -10):    1
count('Hello', 0, -10): 1
count('o', -10):        2
```

### 2.4 count() 实战：统计单个字符

统计某个字符在字符串中出现多少次，是 `count` 最常见的使用场景之一——判断括号配对、统计空格数、分析字符频率：

```python
# 统计代码中的括号配对
code = "def func(a, b): return [a, b] if (a > 0) else {b}"
print(f"代码: {code!r}")

brackets = {'(': ')', '[': ']', '{': '}'}
print("括号配对检查:")
for left, right in brackets.items():
    left_count = code.count(left)
    right_count = code.count(right)
    status = "OK" if left_count == right_count else "MISMATCH"
    print(f"  '{left}'/'{right}': {left_count}/{right_count} -> {status}")
```

**运行结果**：

```text
代码: 'def func(a, b): return [a, b] if (a > 0) else {b}'
括号配对检查:
  '('/')': 2/2 -> OK
  '['/']': 1/1 -> OK
  '{'/'}': 1/1 -> OK
```

用 `count` 统计空格数可以间接得到单词数（空格数 + 1 = 单词数）：

```python
text = "the quick brown fox jumps over the lazy dog"
space_count = text.count(" ")
word_count = space_count + 1
print(f"文本: {text!r}")
print(f"空格数: {space_count}")
print(f"单词数: {word_count}")
```

**运行结果**：

```text
文本: 'the quick brown fox jumps over the lazy dog'
空格数: 8
单词数: 9
```

### 2.5 count() 实战：统计多字符子串

```python
# 统计 URL 中某个域名出现的次数
html = """
<a href="https://www.example.com/page1">Link 1</a>
<a href="https://www.example.com/page2">Link 2</a>
<a href="https://www.example.com/page3">Link 3</a>
<a href="http://other.com/page4">Link 4</a>
"""

domain = "www.example.com"
count = html.count(domain)
print(f"域名 '{domain}' 出现次数: {count}")  # 3

# 区分协议统计
http_count = html.count("http://")
https_count = html.count("https://")
print(f"http:// 出现次数: {http_count}")    # 1
print(f"https:// 出现次数: {https_count}")  # 3
```

**运行结果**：

```text
域名 'www.example.com' 出现次数: 3
http:// 出现次数: 1
https:// 出现次数: 3
```

### 2.6 count() 实战：CSV 字段数校验

用 `count` 统计分隔符数量，可以快速校验 CSV 行的字段数是否正确：

```python
csv_line = "张三,25,北京,程序员,Python"
expected_fields = 5

# 逗号数 + 1 = 字段数
field_count = csv_line.count(",") + 1
print(f"CSV 行: {csv_line!r}")
print(f"字段数: {field_count}")

if field_count == expected_fields:
    print("校验: OK")
else:
    print(f"校验: FAIL (期望 {expected_fields}, 实际 {field_count})")
```

**运行结果**：

```text
CSV 行: '张三,25,北京,程序员,Python'
字段数: 5
校验: OK
```

### 2.7 count() 与其他方法的对比

`count` 是"统计次数"的方法，Python 字符串还有其他相关方法，它们的适用场景不同：

| 方法 | 返回什么 | 典型场景 |
|------|---------|---------|
| `count(sub)` | 出现次数 | 统计固定子串出现多少次 |
| `in` | `True/False` | 只判断是否存在，不关心次数 |
| `find(sub)` | 首次出现位置 | 需要知道子串在哪 |
| `split(sep)` | 分割后的列表 | 需要按分隔符切割字段 |
| `len(s)` | 字符串长度 | 统计字符总数 |

**选择决策**：

```text
你需要什么？
    ├── 统计出现次数
    │       → count()
    ├── 只判断是否存在
    │       → in（不需要 count > 0）
    ├── 需要知道首次出现位置
    │       → find() / index()
    ├── 按分隔符切割字段
    │       → split()
    └── 统计字符串总长度
            → len()
```

#### 2.7.1 count 与 in 的对比

当你只需要**判断子串是否存在**时，`in` 比 `count > 0` 更清晰：

```python
text = "Hello, World!"

# 不推荐：用 count 判断存在性
if text.count("Hello") > 0:
    print("找到了")

# 推荐：用 in，语义更清晰
if "Hello" in text:
    print("找到了")
```

**运行结果**：

```text
找到了
找到了
```

`in` 只返回布尔值，不计算具体次数，在只需要判断存在性时性能也更好。

#### 2.7.2 count 与 split-1 的对比

`count(sep)` 和 `len(s.split(sep)) - 1` 在统计分隔符数量时结果一致：

```python
text = "apple,banana,apple,cherry,apple"

# count 方式
print(f"count(','):     {text.count(',')}")       # 4

# split 方式
print(f"split 数量-1:   {len(text.split(',')) - 1}") # 4
```

**运行结果**：

```text
count(','):     4
split 数量-1:   4
```

`count` 更简洁高效——`split` 会创建一个列表对象，`count` 不会。但如果已经用 `split` 分割了字段，直接用 `len(列表) - 1` 更自然，不需要再调一次 `count`。

#### 2.7.3 count 与正则表达式的对比

`count` 只能统计**固定字符串**的出现次数。如果需要统计**模式**（如所有日期、所有邮箱），要用正则表达式：

```python
import re

text = "2024-01-15 error 2024-01-16 error 2024-01-17 INFO"

# count 只能统计固定字符串
print(f"count('error'): {text.count('error')}")  # 2

# 正则可以统计模式
dates = re.findall(r"\d{4}-\d{2}-\d{2}", text)
print(f"正则统计日期: {len(dates)} -> {dates}")  # 3
```

**运行结果**：

```text
count('error'): 2
正则统计日期: 3 -> ['2024-01-15', '2024-01-16', '2024-01-17']
```

## 3. 最佳实践

### 3.1 推荐 vs 不推荐写法

| 场景 | 不推荐 | 推荐 | 原因 |
|------|--------|------|------|
| 只判断是否存在 | `s.count(x) > 0` | `x in s` | `in` 语义更清晰且高效 |
| 统计固定子串 | `len(re.findall('abc', s))` | `s.count('abc')` | `count` 更简洁高效 |
| 统计模式（正则） | `s.count('error')` | `len(re.findall(pattern, s))` | `count` 搞不定模式匹配 |
| 忽略大小写 | `s.count('Hello') + s.count('hello') + s.count('HELLO')` | `s.lower().count('hello')` | 先转小写更可靠 |
| 统计单词数 | 手动数空格 | `s.count(' ') + 1` | `count` 更简洁 |
| 需要重叠匹配 | `s.count('aa')` | 手动循环逐位置检查 | `count` 不支持重叠 |
| 限定范围统计 | `s[start:end].count(sub)` | `s.count(sub, start, end)` | 范围参数不创建副本 |

### 3.2 常见错误模式

**错误1：用 count 判断存在性**

```python
text = "Hello, World!"

# 不推荐：count + 比较，冗余
if text.count("Java") > 0:
    print("找到了")

# 推荐：直接用 in
if "Java" in text:
    print("找到了")
```

**错误2：忽视不重叠行为**

```python
text = "aaaa"

# 误以为 count 统计所有重叠出现
# 期望 3 次，实际只有 2 次
print(text.count("aa"))  # 2，不是 3！

# 如果需要重叠匹配，要手动实现
count = sum(1 for i in range(len(text) - 1) if text[i:i+2] == "aa")
print(count)  # 3
```

**运行结果**：

```text
2
3
```

**错误3：用切片代替范围参数**

```python
text = "apple, banana, apple, cherry, apple"

# 不推荐：先切片再 count，多创建字符串对象
result = text[10:].count("apple")

# 推荐：直接用范围参数
result = text.count("apple", 10)
```

**错误4：混淆 count 统计的是"子串"还是"字符"**

```python
text = "a,b,c,a,b,c"

# count(',') 统计的是逗号字符出现的次数，不是字段数
comma_count = text.count(",")
print(f"逗号数: {comma_count}")  # 5

# 字段数 = 逗号数 + 1
field_count = comma_count + 1
print(f"字段数: {field_count}")  # 6
```

**运行结果**：

```text
逗号数: 5
字段数: 6
```

### 3.3 性能注意事项

**时间复杂度**：`count` 的时间复杂度是 **O(n)**（n 是字符串长度），因为它需要扫描整个字符串。对于固定子串的计数，`count` 是最优选择——比 `split` + `len` 更快，因为不创建中间列表。

```python
# 更高效：count 直接扫描，不创建中间对象
result = text.count("error")

# 较低效：split 创建列表对象，再取 len
result = len(text.split("error")) - 1

# 最慢：正则表达式，除非需要模式匹配
import re
result = len(re.findall("error", text))
```

**范围参数比先切片更高效**——`count(sub, start, end)` 不会创建中间字符串：

```python
# 更高效：直接用范围参数
result = text.count("error", 0, 100)

# 较低效：先切片再 count
result = text[:100].count("error")
```

### 3.4 count 与 find 循环的选择

`count` 只返回次数，不返回位置。如果**同时需要位置信息**，用 `find` + 循环更合适：

```python
text = "apple, banana, apple, cherry, apple"
target = "apple"

# 只需要次数 → count
print(f"count: {text.count(target)}")  # 3

# 需要每次出现的位置 → find 循环
positions = []
start = 0
while True:
    pos = text.find(target, start)
    if pos == -1:
        break
    positions.append(pos)
    start = pos + len(target)
print(f"位置: {positions}")  # [0, 15, 30]
print(f"次数: {len(positions)}")  # 3
```

**运行结果**：

```text
count: 3
位置: [0, 15, 30]
次数: 3
```

注意 `start = pos + len(target)` 确保不重叠——这和 `count` 的行为一致。如果需要重叠匹配，改为 `start = pos + 1`。

## 4. 原理

### 4.1 count() 的底层实现

`count` 在 CPython 中由 C 实现，底层使用高效的字符串匹配算法。核心流程：

```text
s.count(sub)
    ↓
1. 参数校验：检查 sub 类型（必须是 str）
2. 处理 start/end 参数：
     → 将负索引转换为正索引
     → 将 end 截断到 len(s)
     → 确定 [start, end) 搜索范围
3. 特殊情况快速返回：
     → sub 为空字符串：返回 end - start + 1
     → sub 长度 > 搜索范围长度：返回 0
4. 在 s[start:end] 中非重叠搜索 sub：
     → 找到一次匹配 → 计数 +1，指针跳过 len(sub) 个字符
     → 未找到 → 指针前进 1 个字符
     → 扫描完毕 → 返回总计数
```

### 4.2 为什么空字符串返回 len(s) + 1

`count('')` 返回 `len(s) + 1`，原因是空字符串被视为出现在字符串的每一个"间隙"中：

```text
s = "hello" (长度 5)
间隙位置: _h_e_l_l_o_ 共 6 个间隙
         0 1 2 3 4 5 6 = len(s) + 1 = 6

count('') → 6
```

```python
for s in ["", "a", "ab", "hello"]:
    print(f"'{s}'.count('') = {s.count('')}  (len={len(s)}, len+1={len(s)+1})")
```

**运行结果**：

```text
''.count('') = 1  (len=0, len+1=1)
'a'.count('') = 2  (len=1, len+1=2)
'ab'.count('') = 3  (len=2, len+1=3)
'hello'.count('') = 6  (len=5, len+1=6)
```

### 4.3 不重叠匹配的实现逻辑

`count` 的非重叠行为源于底层实现——找到匹配后，搜索指针跳过整个匹配长度：

```text
s = "aaaa", sub = "aa"

步骤1: 从位置 0 开始，s[0:2] = "aa" 匹配 → count = 1, 指针跳到 2
步骤2: 从位置 2 开始，s[2:4] = "aa" 匹配 → count = 2, 指针跳到 4
步骤3: 位置 4 >= len(s) = 4, 结束
结果: 2
```

对比重叠匹配（手动实现）：

```text
s = "aaaa", sub = "aa"

步骤1: 位置 0, s[0:2] = "aa" 匹配 → count = 1, 指针前进 1 到位置 1
步骤2: 位置 1, s[1:3] = "aa" 匹配 → count = 2, 指针前进 1 到位置 2
步骤3: 位置 2, s[2:4] = "aa" 匹配 → count = 3, 指针前进 1 到位置 3
步骤4: 位置 3, s[3:5] 越界, 结束
结果: 3
```

`count` 选择非重叠策略是为了性能——跳过匹配长度可以减少比较次数，在大多数实际场景中更高效。重叠匹配的需求较少，因此需要时手动实现即可。

### 4.4 范围参数不创建切片副本

与 `find`/`rfind` 一样，`count(sub, start, end)` 虽然语义上等价于 `s[start:end].count(sub)`，但底层不会创建切片副本——直接在原字符串的内存上偏移计算：

```text
直接调用（高效，无副本）:
    s.count("abc", 5, 20)
    → 在 s 的内存上，从偏移 5 计数到偏移 20
    → 不创建新字符串

先切片再调用（低效，创建副本）:
    s[5:20].count("abc")
    → 先创建一个长度 15 的新字符串对象
    → 再在新字符串上调用 count
```

所以需要限定范围统计时，**直接用范围参数**比先切片更高效。

## 5. 总结

本文围绕子串计数方法展开，主要介绍了以下内容：

- `count(sub)` 统计子串在字符串中**非重叠出现**的次数，找不到时返回 `0`
- `count` **区分大小写**，需要忽略大小写时用 `text.lower().count(sub.lower())`
- 空字符串作为子串时返回 `len(s) + 1`——空字符串被视为出现在每个字符间隙中
- `count` **不支持重叠匹配**——找到匹配后跳过整个匹配长度，`"aaaa".count("aa")` 返回 `2` 而非 `3`
- 需要重叠匹配时，手动用 `for` 循环逐位置检查 `text[i:i+len(sub)] == sub`
- `count` 支持 `start` 和 `end` 范围参数，语义等价于 `s[start:end].count(sub)`，但不创建切片副本
- 只判断子串是否存在时用 `in` 比 `count > 0` 更清晰高效
- 统计固定子串用 `count`，统计模式（如日期、邮箱）用正则表达式 `re.findall`
- 统计分隔符数量可以用 `count(sep)`，字段数 = 分隔符数 + 1
- 如果同时需要每次出现的位置信息，用 `find` + 循环而非 `count`
- `count` 的时间复杂度为 O(n)，比 `split` + `len` 更高效，因为不创建中间列表
- 范围参数比先切片再 `count` 更高效，因为不创建中间字符串对象
