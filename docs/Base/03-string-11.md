---
group:
  title: 【03】字符串介绍
  order: 3
order: 11
title: 字符串查询与判断方法
nav:
  title: Python基础
  order: 1
---

# 字符串查询与判断方法

## 1. 介绍

### 1.1 什么是字符串查询与判断方法

字符串查询与判断方法是 Python `str` 类中用于"检查字符串特征"的一组内置方法。它们不修改字符串内容，而是返回关于字符串的某种信息——查询方法返回位置或数量，判断方法返回布尔值。这些方法是日常开发中最常使用的字符串工具，从输入校验到日志分析，随处可见。

```python
# 查询方法：返回位置或数量
text = "Hello Python World"
print(text.find("Python"))    # 6（位置）
print(text.count("o"))        # 3（次数）

# 判断方法：返回布尔值
print("123".isdigit())        # True
print("hello".isalpha())      # True
```

查询与判断方法可以分成两大族：

| 族 | 方法 | 返回值 | 典型用途 |
|----|------|--------|---------|
| 查询族 | `len`、`in`、`find`、`rfind`、`index`、`rindex`、`count` | int / bool | 定位子串、统计次数 |
| 判断族 | `isalpha`、`isdigit`、`isalnum`、`isspace`、`isupper`、`islower`、`istitle`、`isidentifier`、`isprintable`、`isascii` | bool | 校验字符串类型 |

### 1.2 最简示例

```python
# 查询族：用 in 判断子串是否存在
sentence = "Python is powerful"
print("powerful" in sentence)  # True
print("Java" in sentence)       # False

# 查询族：用 find 定位子串位置
pos = sentence.find("is")
print(pos)  # 7

# 判断族：用 isalpha 判断是否纯字母
print("hello".isalpha())    # True
print("hello123".isalpha()) # False
```

这两个方法族覆盖了开发中最常见的字符串检查需求——"这段文字中包含某段子串吗？""这段文字是纯数字吗？""这段文字以特定前缀开头吗？"理解每种方法的行为细节和适用场景，能让你在数据校验、文本处理、日志分析等任务中游刃有余。

## 2. 核心内容

### 2.1 `len()` 与成员运算符 `in`

#### 2.1.1 `len()` 获取字符串长度

`len()` 是 Python 内置函数，返回字符串中的 Unicode 字符个数。

```python
name = "Python编程"
print(len(name))  # 8（6 个 ASCII + 2 个中文 = 8 个字符）
```

`len()` 计算的是 Unicode 字符数，而不是字节数。对于包含中文、emoji 等多字节字符的字符串，`len()` 返回的是"人类感知到的字符个数"。

```python
# 中文字符
s = "你好"
print(len(s))                       # 2
print(len(s.encode('utf-8')))        # 6（UTF-8 编码后的字节数）

# 包含转义字符：按实际字符计算
text = "hello\nworld"
print(len(text))  # 11（\n 是单个字符，不是两个）
```

**空字符串的长度为 0**：

```python
print(len(""))  # 0
```

#### 2.1.2 `in` / `not in` 成员判断

`in` 运算符判断子串是否存在于字符串中，返回布尔值。`not in` 判断子串不存在。

```python
sentence = "Python is a powerful programming language"

# 子串存在判断
print("Python" in sentence)      # True
print("Java" in sentence)        # False
print("power" in sentence)       # True（部分匹配也算）

# not in 判断不存在
print("Ruby" not in sentence)    # True

# in 是大小写敏感的
print("python" in sentence)      # False（大小写不同）
```

`in` 判断的是**子串**，不是单词——"power" 能匹配到 "powerful" 中的部分，这是一种"包含"关系：

```python
text = "hello world"
print("lo wo" in text)  # True（"lo wo" 是 "hello world" 的子串）
```

这与列表的 `in` 判断有本质区别——列表的 `in` 判断的是完整元素：

```python
words = ["hello", "world"]
print("hello" in words)   # True（完整元素匹配）
print("lo wo" in words)   # False（"lo wo" 不是列表中的任何元素）
```

**实际应用——敏感词过滤**：

```python
content = "这里有一些不适当的内容"
sensitive_words = ["暴力", "色情", "不适当"]
found = [w for w in sensitive_words if w in content]
if found:
    print(f"检测到敏感词: {found}")  # 检测到敏感词: ['不适当']
else:
    print("内容安全")
```

### 2.2 前缀与后缀判断：`startswith()` 与 `endswith()`

#### 2.2.1 `startswith()` 基本用法

`startswith(prefix)` 判断字符串是否以指定前缀开头，返回布尔值。

```python
filename = "report_2024.csv"
print(filename.startswith("report"))  # True
print(filename.startswith("csv"))     # False
```

`startswith()` 支持 `start` 和 `end` 参数，用于限定检查范围：

```python
url = "https://www.example.com/api/v1"

# 检查前 5 个字符是否为 "https"
print(url.startswith("https", 0, 5))  # True

# 从索引 8 开始检查是否为 "www"
print(url.startswith("www", 8))       # True
```

#### 2.2.2 `startswith()` 支持元组多值匹配

`startswith()` 的参数可以是元组——只要匹配其中任意一个前缀就返回 `True`。这是批量判断多个前缀的简洁写法：

```python
url = "ftp://files.example.com/data"
protocols = ("http://", "https://", "ftp://", "file://")

if url.startswith(protocols):
    print(f"支持的协议: {url.split('://')[0]}")  # 支持的协议: ftp
else:
    print("不支持的协议")
```

不用写多个 `or` 条件，一行代码就能完成多前缀判断。

#### 2.2.3 `endswith()` 基本用法

`endswith(suffix)` 判断字符串是否以指定后缀结尾，返回布尔值。同样支持元组多值匹配和 `start`/`end` 参数。

```python
filename = "report_2024.csv"
print(filename.endswith(".csv"))  # True
print(filename.endswith(".txt")) # False
```

**典型应用——文件类型判断**：

```python
def get_file_type(filename):
    if filename.endswith((".jpg", ".jpeg", ".png", ".gif", ".bmp")):
        return "图片"
    elif filename.endswith((".mp4", ".avi", ".mov", ".mkv")):
        return "视频"
    elif filename.endswith((".mp3", ".wav", ".flac", ".aac")):
        return "音频"
    elif filename.endswith((".py", ".java", ".c", ".go", ".rs")):
        return "代码"
    else:
        return "其他"

files = ["photo.jpg", "movie.mp4", "song.mp3", "main.py", "data.bin"]
for f in files:
    print(f"  {f:15s} -> {get_file_type(f)}")

# 输出:
#   photo.jpg       -> 图片
#   movie.mp4       -> 视频
#   song.mp3        -> 音频
#   main.py         -> 代码
#   data.bin        -> 其他
```

#### 2.2.4 空字符串的边界行为

空字符串作为前缀或后缀时，总是返回 `True`——因为任何字符串都可以视为"以空串开头"或"以空串结尾"。

```python
print("hello".startswith(""))  # True
print("hello".endswith(""))    # True

# 空字符串只有以空串开头/结尾时才返回 True
print("".startswith("hello"))  # False
print("".startswith(""))       # True
```

### 2.3 子串位置查找：`find()` / `rfind()` / `index()` / `rindex()`

#### 2.3.1 `find()` 查找子串位置

`find(sub)` 返回子串**第一次出现**的索引位置。找不到时返回 `-1`。它支持 `start` 和 `end` 参数限定查找范围。

```python
text = "Hello, welcome to Python world!"
pos = text.find("welcome")
print(pos)  # 7

pos = text.find("Java")
print(pos)  # -1（未找到）
```

**带 `start`/`end` 参数的查找**：

```python
text = "apple, banana, apple, cherry"
pos1 = text.find("apple")              # 0（第一次出现）
pos2 = text.find("apple", pos1 + 1)    # 15（第二次出现，从上次位置+1继续）
```

这个模式可以用来循环查找子串的所有出现位置：

```python
def find_all(text, sub):
    """用 find 循环找到子串的所有出现位置"""
    positions = []
    start = 0
    while True:
        pos = text.find(sub, start)
        if pos == -1:
            break
        positions.append(pos)
        start = pos + 1  # +1 可以找到重叠的子串
    return positions

print(find_all("ababa", "aba"))  # [0, 2]（+1 步进会找到重叠的）
```

#### 2.3.2 `rfind()` 从右向左查找

`rfind(sub)` 返回子串**最后一次出现**的索引位置，找不到返回 `-1`。同样支持 `start`/`end` 参数。

```python
text = "apple, banana, apple, cherry"
last_pos = text.rfind("apple")
print(last_pos)  # 15（最后一个 "apple"）

# find 和 rfind 的区别
text = "ABCABC"
print(text.find("B"))    # 1（从左数第一个）
print(text.rfind("B"))   # 4（从右数第一个）
```

#### 2.3.3 `index()` 与 `find()` 的区别

`index()` 和 `find()` 功能完全相同，区别在于**找不到子串时的行为**：

| 方法 | 找到时 | 找不到时 |
|------|--------|---------|
| `find()` | 返回索引 | 返回 `-1` |
| `index()` | 返回索引 | 抛出 `ValueError` 异常 |

```python
text = "Hello Python"

print(text.find("Python"))    # 6
print(text.index("Python"))  # 6

# 找不到时
print(text.find("Java"))     # -1（静默返回 -1）

try:
    text.index("Java")
except ValueError as e:
    print(f"index 抛出异常: {e}")  # index 抛出异常: substring not found
```

**选择原则**：当你确定子串一定存在，或者希望在不存在时得到异常提示（而非静默忽略），用 `index()`；当你不确定子串是否存在，且不想处理异常，用 `find()`。

`rindex()` 是 `rfind()` 的异常版——从右向左查找，找不到时抛出 `ValueError`。

```python
text = "ABCABC"
print(text.rindex("B"))  # 4

try:
    text.rindex("XYZ")
except ValueError as e:
    print(f"rindex 抛出异常: {e}")  # rindex 抛出异常: substring not found
```

#### 2.3.4 四种查找方法对比

```text
方法        方向    找不到时的行为
────────────────────────────────────
find()      从左    返回 -1
rfind()     从右    返回 -1
index()     从左    抛出 ValueError
rindex()    从右    抛出 ValueError
```

#### 2.3.5 实际应用——用 `find` 提取子串

`find` 定位后配合切片可以提取字符串中的特定内容：

```python
# 从日志中提取时间戳
log_line = '[2024-01-15 10:30:45] ERROR: Database connection failed'
start = log_line.find('[')
end = log_line.find(']')
if start != -1 and end != -1:
    timestamp = log_line[start+1:end]
    print(f"提取的时间戳: {timestamp}")  # 2024-01-15 10:30:45

# 提取邮箱域名
email = "user@example.com"
at_pos = email.find("@")
if at_pos != -1:
    domain = email[at_pos+1:]
    print(f"邮箱域名: {domain}")  # example.com
```

### 2.4 计数方法：`count()`

#### 2.4.1 基本用法

`count(sub)` 返回子串在字符串中出现的**非重叠**次数，找不到返回 `0`。支持 `start`/`end` 参数。

```python
text = "Python is great. Python is powerful. Python is fun."
print(text.count("Python"))  # 3

# 非重叠计数
text2 = "aaaa"
print(text2.count("aa"))  # 2（索引 0-1 和 2-3，不重叠）
```

**带 `start`/`end` 参数**：

```python
text = "apple, banana, apple, cherry, apple"
print(text.count("apple"))              # 3（全文）
print(text.count("apple", 10))          # 2（索引 10 之后）
print(text.count("apple", 0, 15))       # 1（索引 0~15 之间）
```

#### 2.4.2 `count()` 的性能优势

`count()` 是 CPython 的内置方法，底层用 C 实现。和用 `find()` 循环计数相比，性能优势可达上百倍——在处理大文本时差异显著。

```python
import time

text = "ab" * 500000  # 100 万字符

# count() 方式
start = time.perf_counter()
c1 = text.count("ab")
time_count = time.perf_counter() - start

# find 循环方式
start = time.perf_counter()
c2 = 0
pos = 0
while True:
    pos = text.find("ab", pos)
    if pos == -1:
        break
    c2 += 1
    pos += 1
time_find = time.perf_counter() - start

print(f"count() 计数: {c1}, 耗时: {time_count:.6f}s")
print(f"find循环 计数: {c2}, 耗时: {time_find:.6f}s")
print(f"count 比 find 快: {time_find / time_count:.1f} 倍")

# 运行结果:
# count() 计数: 500000, 耗时: 0.000533s
# find循环 计数: 500000, 耗时: 0.062277s
# count 比 find 快: 116.9 倍
```

#### 2.4.3 空子串的特殊行为

`count("")` 返回 `len(str) + 1`——因为空串可以匹配字符串每个间隙位置。

```python
text = "abc"
print(text.count(""))  # 4（位置 0, 1, 2, 3 各有一个空串）
print(len(text) + 1)    # 4
```

#### 2.4.4 实际应用

```python
# 统计文件内容中的换行数
content = "line1\nline2\nline3\nline4\n"
print(content.count("\n"))  # 4

# 统计单词频率
article = "Python Python Java Go Python Rust Java"
word_count = {}
for w in article.split():
    word_count[w] = article.count(w)
print(word_count)  # {'Python': 3, 'Java': 2, 'Go': 1, 'Rust': 1}
```

### 2.5 字符类型判断方法

字符类型判断方法是判断族中数量最多、用法最丰富的一组。它们判断字符串中字符的类型构成，大多以 `is` 开头，返回布尔值。

#### 2.5.1 `isalpha()` 判断全为字母

判断字符串是否只包含字母（含中文等 Unicode 字母），且至少有一个字符。

```python
print("hello".isalpha())     # True
print("Hello".isalpha())     # True
print("hello123".isalpha())  # False（含数字）
print("你好".isalpha())      # True（中文也是 Unicode 字母）
print("".isalpha())          # False（空串不满足"至少一个字符"）
print("hello world".isalpha())  # False（含空格）
```

#### 2.5.2 `isdigit()` 判断全为数字

判断字符串是否只包含数字字符（0-9 及部分 Unicode 数字），至少一个字符。

```python
print("123".isdigit())       # True
print("123abc".isdigit())   # False
print("12.5".isdigit())      # False（含小数点）
print("-5".isdigit())        # False（含负号）
print("".isdigit())          # False
```

#### 2.5.3 `isdecimal()` vs `isdigit()` vs `isnumeric()` 的区别

这三个方法有细微但重要的递进关系——从严格到宽泛：

```python
test_cases = [
    ("123", "ASCII数字"),          # 三个都 True
    ("\u00b2", "上标2 (²)"),       # isdigit 和 isnumeric True
    ("\u00bc", "分数1/4 (¼)"),     # 只有 isnumeric True
    ("\u2460", "圆圈数字 (①)"),     # isdigit 和 isnumeric True
    ("\uff11", "全角数字 (１)"),    # 三个都 True
    ("一二三", "中文数字"),          # 只有 isnumeric True
    ("Ⅳ", "罗马数字"),              # 只有 isnumeric True
]

print(f"{'字符串':<12} {'描述':<16} {'isdecimal':>10} {'isdigit':>10} {'isnumeric':>10}")
print("-" * 62)
for s, desc in test_cases:
    print(f"{repr(s):<12} {desc:<16} {str(s.isdecimal()):>10} {str(s.isdigit()):>10} {str(s.isnumeric()):>10}")
```

**运行结果**：

```text
字符串        描述              isdecimal    isdigit  isnumeric
--------------------------------------------------------------
'123'       ASCII数字            True       True       True
'²'         上标2 (²)           False       True       True
'¼'         分数1/4 (¼)          False      False       True
'①'         圆圈数字 (①)          False       True       True
'１'         全角数字 (１)          True       True       True
'一二三'     中文数字              False      False       True
'Ⅳ'         罗马数字             False      False       True
```

**规律总结**：

| 方法 | 判断范围 | 严格程度 | 典型适用 |
|------|---------|---------|---------|
| `isdecimal()` | 十进制数字字符 | 最严格 | 数值转换前校验（`int()` 只接受 decimal） |
| `isdigit()` | 数字形式字符 | 中等 | 显示用数字校验（接受上标、全角等） |
| `isnumeric()` | 数值字符 | 最宽泛 | 泛数字校验（接受分数、中文数字、罗马数字等） |

**实用建议**：需要将其转为 `int` 进行计算时用 `isdecimal()`；仅校验"看起来像数字"用 `isdigit()`；校验"表示一个数值"用 `isnumeric()`。

#### 2.5.4 `isalnum()` 判断字母或数字

判断字符串是否只包含字母或数字，至少一个字符。等价于 `isalpha()` 或 `isdigit()` 的组合。

```python
print("hello".isalnum())      # True
print("123".isalnum())        # True
print("hello123".isalnum())   # True
print("hello 123".isalnum())  # False（含空格）
print("12.5".isalnum())       # False（含小数点）
print("你好123".isalnum())     # True
```

#### 2.5.5 `isspace()` 判断全为空白

判断字符串是否只包含空白字符（空格、制表符 `\t`、换行符 `\n`、回车 `\r` 等），至少一个字符。

```python
print(" ".isspace())          # True
print("\t".isspace())         # True
print("\n".isspace())         # True
print("\r\n".isspace())       # True
print("  \t\n ".isspace())   # True（混合空白）
print("".isspace())           # False（空串）
print(" a ".isspace())        # False（含非空白字符）
```

### 2.6 大小写与格式判断方法

#### 2.6.1 `isupper()` 判断大写

`isupper()` 判断是否"所有具有大小写属性的字母都是大写，且至少有一个具有大小写属性的字母"。数字和标点不受影响——它们没有大小写属性，不参与判断。

```python
print("HELLO".isupper())      # True
print("HELLO123".isupper())   # True（数字不影响判断）
print("Hello".isupper())      # False（有小写字母）
print("123".isupper())        # False（没有大小写属性的字母 → 不满足"至少一个"）
print("".isupper())           # False
print("ABC!@#".isupper())     # True（标点不影响判断）
```

**关键理解**：`isupper()` 不是"所有字符都是大写"，而是"所有有大小写的字符都是大写，且至少有一个"。所以 `"123".isupper()` 返回 `False`——因为数字没有大小写属性，而 `"至少一个有大小写的字符"这个条件不满足。

#### 2.6.2 `islower()` 判断小写

与 `isupper()` 对称，判断"所有有大小写属性的字母都是小写，且至少一个"。

```python
print("hello".islower())      # True
print("hello123".islower())   # True
print("Hello".islower())      # False
print("123".islower())        # False
print("hello!@#".islower())   # True
```

**对比表**：

```python
test_cases = ["ABC", "abc", "ABC123", "abc123", "123", "!@#$%", "AbC"]

print(f"{'字符串':<12} {'isupper':>8} {'islower':>8}")
print("-" * 30)
for s in test_cases:
    print(f"{repr(s):<12} {str(s.isupper()):>8} {str(s.islower()):>8}")

# 输出:
# 'ABC'            True    False
# 'abc'           False     True
# 'ABC123'         True    False
# 'abc123'        False     True
# '123'           False    False  ← 无大小写字符
# '!@#$%'         False    False  ← 无大小写字符
# 'AbC'           False    False  ← 大小写混合
```

#### 2.6.3 `istitle()` 判断标题格式

`istitle()` 判断字符串是否为"标题格式"——每个单词的首字母大写，其余字母小写。

```python
print("Hello World".istitle())    # True
print("Hello world".istitle())    # False（"world" 的 w 未大写）
print("HELLO WORLD".istitle())    # False（全大写不是标题格式）
print("Hello".istitle())          # True
print("".istitle())               # False
```

`istitle()` 有一些微妙的判断规则——每个"单词"中，紧跟在非字母字符后的第一个字母必须大写，其余字母必须小写：

```python
tricky = ["Hello World", "Hello123 World", "Hello_World", "Hello-World", "hello world", "HELLO WORLD"]

for s in tricky:
    print(f"  {repr(s):<20} istitle={s.istitle()}")

# 输出:
#   'Hello World'         istitle=True
#   'Hello123 World'      istitle=True
#   'Hello_World'         istitle=True   ← 下划线后的 W 大写
#   'Hello-World'         istitle=True   ← 连字符后的 W 大写
#   'hello world'         istitle=False
#   'HELLO WORLD'         istitle=False
```

### 2.7 标识符与其他判断方法

#### 2.7.1 `isidentifier()` 判断合法标识符

`isidentifier()` 判断字符串是否是 Python 中合法的标识符——可以用作变量名、函数名等的命名。

```python
print("my_var".isidentifier())    # True
print("_private".isidentifier())  # True
print("myVar2".isidentifier())    # True
print("2var".isidentifier())      # False（数字开头）
print("my-var".isidentifier())    # False（含连字符）
print("my var".isidentifier())    # False（含空格）
print("".isidentifier())         # False（空串）
```

**注意**：Python 关键字（如 `class`、`if`、`for`）在格式上是合法标识符，但不能用作变量名：

```python
import keyword
print("class".isidentifier())          # True（格式合法）
print(keyword.iskeyword("class"))      # True（但是关键字）
print(keyword.iskeyword("my_var"))     # False
```

Python 3 支持中文等 Unicode 标识符：

```python
print("变量名".isidentifier())   # True
print("计数2".isidentifier())    # True
```

**实际应用——动态属性名校验**：

```python
def safe_getattr(obj, attr_name):
    if not attr_name.isidentifier():
        raise ValueError(f"'{attr_name}' 不是合法的标识符")
    if keyword.iskeyword(attr_name):
        raise ValueError(f"'{attr_name}' 是 Python 关键字")
    return getattr(obj, attr_name)

class Config:
    host = "localhost"
    port = 8080

config = Config()
print(safe_getattr(config, "host"))  # localhost
print(safe_getattr(config, "port"))  # 8080
# safe_getattr(config, "168")   → ValueError: '168' 不是合法的标识符
# safe_getattr(config, "class") → ValueError: 'class' 是 Python 关键字
```

#### 2.7.2 `isprintable()` 判断全为可打印字符

`isprintable()` 判断字符串是否只包含可打印字符。空格是可打印的，但制表符 `\t`、换行符 `\n` 等控制字符不可打印。

```python
print("Hello World".isprintable())   # True
print("Hello\tWorld".isprintable())  # False（\t 不可打印）
print("Hello\nWorld".isprintable())  # False（\n 不可打印）
print("123!@#".isprintable())       # True
print("".isprintable())              # True（空串是可打印的）
```

**注意**：与 `isalpha`、`isdigit` 等不同，空字符串的 `isprintable()` 返回 `True`。

#### 2.7.3 `isascii()` 判断全为 ASCII 字符

`isascii()`（Python 3.7+）判断字符串是否只包含 ASCII 字符（U+0000~U+007F）。

```python
print("Hello".isascii())       # True
print("123".isascii())         # True
print("Hello!@#".isascii())   # True
print("你好".isascii())        # False（中文非 ASCII）
print("café".isascii())       # False（é 非 ASCII）
print("".isascii())            # True（空串也被视为 ASCII）
```

#### 2.7.4 判断方法综合对比

以下是所有 `is*` 判断方法在不同字符串上的行为对比：

```python
test_strings = [
    ("hello", "纯小写字母"),
    ("WORLD", "纯大写字母"),
    ("Hello World", "标题格式"),
    ("12345", "纯数字"),
    ("你好", "中文"),
    ("\t\n", "空白字符"),
    ("abc123", "字母+数字"),
    ("", "空字符串"),
]

methods = ["isalpha", "isdigit", "isalnum", "isspace", "isupper", "islower", "istitle", "isascii"]

print(f"{'字符串':<14} {'描述':<12}", end="")
for m in methods:
    print(f" {m:>10}", end="")
print()
print("-" * 112)
for s, desc in test_strings:
    print(f"{repr(s):<14} {desc:<12}", end="")
    for m in methods:
        result = getattr(s, m)()
        print(f" {str(result):>10}", end="")
    print()
```

**运行结果**：

```text
字符串        描述          isalpha    isdigit    isalnum    isspace    isupper    islower    istitle    isascii
----------------------------------------------------------------------------------------------------------------
'hello'       纯小写字母      True      False       True      False      False       True      False       True
'WORLD'       纯大写字母      True      False       True      False       True      False      False       True
'Hello World' 标题格式       False      False      False      False      False      False       True       True
'12345'       纯数字         False       True       True      False      False      False      False       True
'你好'         中文           True      False       True      False      False      False      False      False
'\t\n'        空白字符       False      False      False       True      False      False      False       True
'abc123'      字母+数字      False      False       True      False      False       True      False       True
''            空字符串       False      False      False      False      False      False      False       True
```

### 2.8 综合实战

#### 2.8.1 日志分析器

综合使用 `find`、`count`、`startswith` 等方法解析日志，统计各类日志数量并提取关键信息。

```python
log_content = """[2024-01-15 08:30:00] INFO: System started
[2024-01-15 08:32:45] WARN: Cache hit rate below 60%
[2024-01-15 08:33:10] ERROR: Database connection timeout
[2024-01-15 08:35:20] ERROR: Authentication failed for user guest
[2024-01-15 08:36:00] INFO: Database connection restored"""

def analyze_log(log_text):
    lines = log_text.strip().split("\n")
    stats = {"INFO": 0, "WARN": 0, "ERROR": 0}
    errors = []

    for line in lines:
        for level in stats:
            if f"] {level}:" in line:
                stats[level] += 1
                if level == "ERROR":
                    ts_start = line.find("[") + 1
                    ts_end = line.find("]")
                    timestamp = line[ts_start:ts_end]
                    msg_start = line.find("ERROR:") + 6
                    error_msg = line[msg_start:].strip()
                    errors.append((timestamp, error_msg))
                break

    return stats, errors

stats, errors = analyze_log(log_content)
print(f"日志级别统计: {stats}")
print("错误详情:")
for ts, msg in errors:
    print(f"  [{ts}] {msg}")

# 输出:
# 日志级别统计: {'INFO': 2, 'WARN': 1, 'ERROR': 2}
# 错误详情:
#   [2024-01-15 08:33:10] Database connection timeout
#   [2024-01-15 08:35:20] Authentication failed for user guest
```

#### 2.8.2 表单验证器

综合使用 `isalnum`、`isdigit`、`isupper`、`islower`、`len`、`count`、`startswith`、`endswith` 等方法进行表单字段校验。

```python
def validate_form(form_data):
    results = {}

    # 用户名: 字母数字，3~20 字符
    username = form_data.get("username", "")
    if not username:
        results["username"] = "不能为空"
    elif not username.isalnum():
        results["username"] = "只能包含字母和数字"
    elif len(username) < 3 or len(username) > 20:
        results["username"] = "长度必须3~20字符"
    else:
        results["username"] = "有效"

    # 密码: 至少8位，包含大小写字母和数字
    password = form_data.get("password", "")
    if not password:
        results["password"] = "不能为空"
    elif len(password) < 8:
        results["password"] = "至少8位"
    elif not (any(c.isupper() for c in password) and
             any(c.islower() for c in password) and
             any(c.isdigit() for c in password)):
        results["password"] = "必须包含大小写字母和数字"
    else:
        results["password"] = "有效"

    # 手机号: 纯数字，11位，以1开头
    phone = form_data.get("phone", "")
    if not phone:
        results["phone"] = "不能为空"
    elif not phone.isdigit():
        results["phone"] = "只能包含数字"
    elif len(phone) != 11:
        results["phone"] = "必须是11位"
    elif not phone.startswith("1"):
        results["phone"] = "必须以1开头"
    else:
        results["phone"] = "有效"

    return results

form = {"username": "alice", "password": "Pass1234", "phone": "13812345678"}
results = validate_form(form)
for field, result in results.items():
    print(f"  {field:10s}: {result}")

# 输出:
#   username  : 有效
#   password  : 有效
#   phone     : 有效
```

#### 2.8.3 文本分析工具

综合使用 `len`、`isalpha`、`isdigit`、`isspace`、`isupper`、`islower` 等方法分析文本特征。

```python
def analyze_text(text):
    total = len(text)
    letters = sum(1 for c in text if c.isalpha())
    digits = sum(1 for c in text if c.isdigit())
    spaces = sum(1 for c in text if c.isspace())
    upper = sum(1 for c in text if c.isupper())
    lower = sum(1 for c in text if c.islower())
    other = total - letters - digits - spaces
    words = len(text.split())

    return {
        "总字符数": total, "字母数": letters, "数字数": digits,
        "空格数": spaces, "大写字母": upper, "小写字母": lower,
        "其他字符": other, "单词数": words,
    }

sample = "Python 3.12 was released on Oct 25, 2023."
analysis = analyze_text(sample)
for key, value in analysis.items():
    print(f"  {key}: {value}")

# 输出:
#   总字符数: 46
#   字母数: 27
#   数字数: 7
#   空格数: 8
#   大写字母: 2
#   小写字母: 25
#   其他字符: 4
#   单词数: 9
```

## 3. 最佳实践

### 3.1 选择正确的查找方法

| 需求 | 推荐方法 | 原因 |
|------|---------|------|
| 只需知道子串是否存在 | `in` 运算符 | 最简洁，返回布尔值 |
| 需要知道子串位置 | `find()` | 返回索引，找不到返回 -1 |
| 确定子串一定存在 | `index()` | 找不到时异常提示有助调试 |
| 需要子串出现次数 | `count()` | C 实现，比循环 find 快百倍 |
| 判断前缀 | `startswith()` | 支持元组多值匹配 |
| 判断后缀 | `endswith()` | 支持元组多值匹配，文件类型判断利器 |

### 3.2 推荐 vs 不推荐写法

```python
# ---- 判断子串是否存在 ----

# 推荐：in 运算符，简洁直观
if "error" in log_line:
    handle_error(log_line)

# 不推荐：用 find 比较 -1，啰嗦
if log_line.find("error") != -1:
    handle_error(log_line)

# ---- 查找子串位置 ----

# 推荐：find + -1 检查（不确定是否存在时）
pos = text.find("target")
if pos != -1:
    result = text[pos:]

# 推荐：index + try/except（确定应该存在时）
try:
    pos = text.index("target")
    result = text[pos:]
except ValueError:
    result = None

# 不推荐：find 后不检查 -1 就使用
pos = text.find("target")
# pos 可能是 -1，text[-1:] 是最后一个字符，不是期望行为！
result = text[pos:]

# ---- 判断纯数字 ----

# 推荐：isdigit() 或 isdecimal()
if phone.isdigit():
    process_phone(phone)

# 不推荐：手动遍历检查每个字符
if all(c in "0123456789" for c in phone):
    process_phone(phone)

# ---- 判断多种文件后缀 ----

# 推荐：元组多值匹配，简洁
if filename.endswith((".jpg", ".png", ".gif")):
    process_image(filename)

# 不推荐：多个 or 条件，啰嗦
if filename.endswith(".jpg") or filename.endswith(".png") or filename.endswith(".gif"):
    process_image(filename)

# ---- 数值转换前校验 ----

# 推荐：先校验再转换，避免异常
if s.isdecimal():
    num = int(s)
else:
    print("不是有效数字")

# 不推荐：直接 try int 而不校验类型
try:
    num = int(s)
except ValueError:
    print("不是有效数字")
# 虽然也能工作，但用 isdecimal 前置校验更清晰
# 而且能区分"消极负号""小数点"等不同情况
```

### 3.3 综合推荐 vs 不推荐对照表

| 场景 | 推荐写法 | 不推荐写法 | 原因 |
|------|---------|-----------|------|
| 判断子串存在 | `"abc" in text` | `text.find("abc") != -1` | `in` 更简洁 |
| 查找位置 | `text.find("abc")` | 用 `in` 后再 `index` | 一步到位 |
| 找所有位置 | `find` 循环 + -1 检查 | `index` 循环 + try/except | 避免异常开销 |
| 统计次数 | `text.count("abc")` | 循环 find 逐个计数 | count 快百倍 |
| 判断后缀 | `endswith((".jpg", ".png"))` | 多个 `or endswith` | 元组更简洁 |
| 验证整数 | `s.isdecimal()` | `try int(s)` | 前置校验更清晰 |
| 验证字母 | `s.isalpha()` | `all(c.isalpha() for c in s)` | 方法直接判断整串 |
| 密码强度 | `any(c.isupper() for c in pwd)` | 手动遍历字符码范围 | 语义清晰 |

### 3.4 空字符串的边界行为总结

所有判断方法对空字符串的返回值不一致，值得特别记忆：

| 方法 | 空串返回值 | 原因 |
|------|-----------|------|
| `isalpha()` | `False` | 要求至少一个字母 |
| `isdigit()` | `False` | 要求至少一个数字 |
| `isalnum()` | `False` | 要求至少一个字母或数字 |
| `isspace()` | `False` | 要求至少一个空白字符 |
| `isupper()` | `False` | 要求至少一个有大小写的字母 |
| `islower()` | `False` | 要求至少一个有大小写的字母 |
| `istitle()` | `False` | 要求至少一个字符 |
| `isidentifier()` | `False` | 空串不是合法标识符 |
| `isprintable()` | `True` | 空串中没有不可打印字符 |
| `isascii()` | `True` | 空串中没有非 ASCII 字符 |
| `startswith("")` | `True` | 任何串都"以空串开头" |
| `endswith("")` | `True` | 任何串都"以空串结尾" |
| `count("")` | `len + 1` | 空串匹配每个间隙 |

### 3.5 常见注意事项

**`isupper`/`islower` 不是"所有字符都是大写/小写"**

```python
# "123" 不含字母，isupper 和 islower 都返回 False
print("123".isupper())  # False
print("123".islower())  # False
# 原因：没有大小写属性的字符不参与判断，但"至少一个"的条件不满足
```

**`isdigit` vs `isdecimal`——数值转换的陷阱**

```python
s = "123"
print(s.isdigit())    # True
print(s.isdecimal())   # True
print(int(s))          # 123（正常）

s2 = "\u00b2"  # 上标 ²
print(s2.isdigit())    # True
print(s2.isdecimal())  # False
# int(s2) 会抛出 ValueError！
# 所以转换前应该用 isdecimal() 而非 isdigit()
```

**`istitle` 对非字母字符的处理**

```python
# "123abc" 的 istitle 是 False
# 因为 "abc" 紧跟数字（非字母），首字母 a 应该大写才算 title
print("123abc".istitle())  # False
print("123Abc".istitle())  # True
```

## 4. 原理

### 4.1 判断方法的 Unicode 分类机制

Python 的 `is*` 判断方法在底层是通过查阅 Unicode 字符属性数据库来实现的。每个 Unicode 字符都有若干属性标记，Python 根据这些标记来判断字符类型。

```text
Unicode 字符属性与 Python 判断方法的映射：

字符 'A' (U+0041):
  ├─ General_Category = Lu (Letter, uppercase) → isalpha=True, isupper=True
  ├─ Numeric_Type = None                       → isdigit=False
  └─ ASCII = True                              → isascii=True

字符 '5' (U+0035):
  ├─ General_Category = Nd (Number, decimal)   → isdigit=True, isdecimal=True
  ├─ Numeric_Type = Decimal                    → isnumeric=True
  └─ ASCII = True                              → isascii=True

字符 '²' (U+00B2, 上标2):
  ├─ General_Category = No (Number, other)    → isdigit=True (数字形式), isdecimal=False
  ├─ Numeric_Type = Digit                      → isnumeric=True
  └─ ASCII = True                              → isascii=True

字符 '一二三' (U+4E00 等, 中文数字):
  ├─ General_Category = Lo (Letter, other)    → isalpha=True
  ├─ Numeric_Type = Numeric                    → isnumeric=True, isdigit=False
  └─ ASCII = False                             → isascii=False
```

这就解释了为什么 `isdecimal` < `isdigit` < `isnumeric` 在严格程度上递减——它们检查的 Unicode 属性范围依次扩大。

```python
# 验证 Unicode 属性差异
chars = ['5', '\u00b2', '\u00bc', '\u2460']

for c in chars:
    print(f"{repr(c):>8} decimal={c.isdecimal():<6} digit={c.isdigit():<6} numeric={c.isnumeric()}")

# 输出:
#      '5'  decimal=True    digit=True    numeric=True
#      '²'  decimal=False   digit=True    numeric=True   ← 上标: 是 digit 不是 decimal
#      '¼'  decimal=False   digit=False   numeric=True   ← 分数: 只能 numeric
#      '①'  decimal=False   digit=True    numeric=True   ← 圆圈: 是 digit 不是 decimal
```

### 4.2 `find` 与 `index` 的底层实现

`find` 和 `index` 在 CPython 中都由 C 层面的字符串搜索算法实现。对于短字符串，使用简单的逐字节比较；对于较长字符串，CPython 会使用更高效的字符串搜索算法（如 Two-Way 算法）。

两者的核心逻辑完全相同——搜索子串并返回位置索引。区别仅在搜索失败时的处理：

```python
# CPython 层面的伪逻辑（简化版）

def find(self, sub, start=0, end=-1):
    # 搜索 sub 在 self[start:end] 中的位置
    pos = _string_search(self, sub, start, end)
    if pos == NOT_FOUND:
        return -1       # find: 返回 -1
    return pos

def index(self, sub, start=0, end=-1):
    # 搜索 sub 在 self[start:end] 中的位置
    pos = _string_search(self, sub, start, end)
    if pos == NOT_FOUND:
        raise ValueError("substring not found")  # index: 抛出异常
    return pos
```

`count` 的底层实现也是一个 C 层面的搜索算法，但它在一次扫描中完成所有计数，不需要 Python 层面的循环，所以比 `find` 循环快百倍。

### 4.3 `startswith`/`endswith` 元组匹配的内部机制

`startswith` 和 `endswith` 在收到元组参数时，会逐个尝试元组中的每个前缀/后缀。只要任何一个匹配成功就立即返回 `True`，无需全部检查。

```text
text.startswith(("http://", "https://", "ftp://"))

内部执行流程:
  1. 尝试匹配 "http://" → 不匹配 → 继续
  2. 尝试匹配 "https://" → 不匹配 → 继续
  3. 尝试匹配 "ftp://" → 匹配成功 → 立即返回 True
  
如果全部不匹配 → 返回 False
```

这种"短路匹配"机制使得元组匹配比手动 `or` 条件更高效——在 Python 字节码层面，元组匹配只需要一次方法调用，而多个 `or` 条件需要多次方法调用和条件跳转。

## 5. 总结

本文围绕 Python 字符串的查询与判断方法展开，主要介绍了以下内容：

- **查询族方法**：`len()` 返回字符数（不是字节数）；`in`/`not in` 判断子串存在（大小写敏感，判断子串而非单词）；`find()`/`rfind()` 返回子串位置（找不到返回 -1）；`index()`/`rindex()` 功能相同但找不到时抛出 `ValueError`；`count()` 统计非重叠出现次数（C 实现，比循环快百倍）
- **前缀后缀判断**：`startswith()`/`endswith()` 支持元组多值匹配，是文件类型判断和 URL 协议检查的利器；支持 `start`/`end` 范围限定；空前缀/后缀总返回 `True`
- **字符类型判断**：`isalpha`（含中文）、`isdigit`（含 Unicode 数字形式）、`isalnum`（字母或数字）、`isspace`（空白字符）；`isdecimal` < `isdigit` < `isnumeric` 严格度递减，数值转换前用 `isdecimal()`
- **大小写与格式判断**：`isupper`/`islower` 判断"所有有大小写属性的字符都是大/小写"（数字标点不参与）；`istitle` 判断标题格式（每个单词首字母大写）
- **标识符与其他判断**：`isidentifier` 判断合法标识符（含中文标识符），需配合 `keyword.iskeyword` 排除关键字；`isprintable` 判断可打印字符（空串返回 `True`）；`isascii` 判断 ASCII 范围
- **最佳实践**：存在判断用 `in`，位置查找用 `find`，计数用 `count`，多后缀判断用元组匹配 `endswith`，数值转换前用 `isdecimal` 校验；注意空字符串各方法返回值不一致
- **底层原理**：判断方法基于 Unicode 字符属性数据库，`isdecimal`/`isdigit`/`isnumeric` 差异源于检查的 Unicode 属性范围不同；`find` 与 `index` 搜索算法相同仅返回值不同；`startswith`/`endswith` 元组匹配采用短路机制
