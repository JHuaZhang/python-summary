---
group:
  title: 【03】字符串介绍
  order: 3
order: 12
title: 前缀与后缀判断
nav:
  title: Python基础
  order: 1
---

# 前缀与后缀判断

## 1. 介绍

### 1.1 什么是前缀与后缀判断

前缀与后缀判断是字符串操作中非常高频的一类需求——检查一个字符串是否以某个特定子串**开头**或**结尾**。Python 提供了两个内置方法来完成这件事：

- `startswith(prefix)`：判断字符串是否以 `prefix` 开头
- `endswith(suffix)`：判断字符串是否以 `suffix` 结尾

这两个方法看起来简单，但在实际开发中几乎无处不在——判断文件扩展名、校验 URL 协议、识别日志级别、过滤文件列表、路由请求路径……大量"分类"和"校验"场景都依赖它们。

```python
# 判断文件类型
filename = "report.pdf"
print(filename.endswith(".pdf"))   # True

# 判断 URL 协议
url = "https://example.com"
print(url.startswith("https://"))  # True
```

**运行结果**：

```text
True
True
```

### 1.2 最简示例

用文件分发场景展示 `startswith` 和 `endswith` 的典型配合使用——前缀判断业务模块，后缀判断文件类型：

```python
files = ["report_q1.json", "user_list.csv", "photo_001.jpg", "script.py"]

for f in files:
    # 用 startswith 判断业务模块
    if f.startswith("report"):
        module = "报表模块"
    elif f.startswith("user"):
        module = "用户模块"
    elif f.startswith("photo"):
        module = "图片模块"
    else:
        module = "通用模块"

    # 用 endswith 判断文件类型
    if f.endswith(".json"):
        ftype = "JSON"
    elif f.endswith(".csv"):
        ftype = "CSV"
    elif f.endswith(".jpg"):
        ftype = "图片"
    elif f.endswith(".py"):
        ftype = "Python"
    else:
        ftype = "未知"

    print(f"{f} → {module}/{ftype}")
```

**运行结果**：

```text
report_q1.json → 报表模块/JSON
user_list.csv → 用户模块/CSV
photo_001.jpg → 图片模块/图片
script.py → 通用模块/Python
```

### 1.3 方法速览

| 方法 | 作用 | 返回值 | 支持多值 | 支持范围参数 |
|------|------|--------|---------|------------|
| `s.startswith(prefix)` | 判断是否以 prefix 开头 | `bool` | 元组 | `start, end` |
| `s.endswith(suffix)` | 判断是否以 suffix 结尾 | `bool` | 元组 | `start, end` |

两个方法的签名完全对称：

```text
s.startswith(prefix[, start[, end]])
s.endswith(suffix[, start[, end]])
```

## 2. 核心内容

### 2.1 startswith()：判断前缀

#### 2.1.1 基本用法

`startswith()` 判断字符串是否以指定子串开头，返回 `True` 或 `False`：

```python
url = "https://www.example.com"
print(f"字符串: {url}")
print(f"以 'https' 开头: {url.startswith('https')}")
print(f"以 'http://' 开头: {url.startswith('http://')}")
print(f"以 'ftp' 开头: {url.startswith('ftp')}")
```

**运行结果**：

```text
字符串: https://www.example.com
以 'https' 开头: True
以 'http://' 开头: False
以 'ftp' 开头: False
```

"https://www.example.com" 以 "https" 开头，但不是以 "http://" 开头——因为 "https://" 中 's' 紧跟在 'http' 后面，不是 '://'。这类细节在实际开发中需要注意。

#### 2.1.2 区分大小写

`startswith()` **区分大小写**：

```python
text = "Python Programming"
print(f"字符串: {text}")
print(f"以 'Python' 开头: {text.startswith('Python')}")
print(f"以 'python' 开头: {text.startswith('python')}")
```

**运行结果**：

```text
字符串: Python Programming
以 'Python' 开头: True
以 'python' 开头: False
```

如果需要不区分大小写，先统一转换为小写再判断：

```python
text = "Python Programming"
print(f"忽略大小写: {text.lower().startswith('python')}")  # True
```

**运行结果**：

```text
忽略大小写: True
```

#### 2.1.3 单字符前缀

前缀可以是单个字符。常见的场景是判断代码行是否是注释、配置行是否是 section 标记等：

```python
code = "# This is a comment"
print(f"以 '#' 开头: {code.startswith('#')}")

config = "[database]"
print(f"以 '[' 开头: {config.startswith('[')}")
```

**运行结果**：

```text
以 '#' 开头: True
以 '[' 开头: True
```

#### 2.1.4 空前缀与超长前缀

空字符串 `""` 作为前缀时，**永远返回 True**——因为任何字符串都可以视为以空字符串开头：

```python
print(f"'hello' 以 '' 开头: {'hello'.startswith('')}")  # True
print(f"'' 以 '' 开头: {('').startswith('')}")          # True
```

**运行结果**：

```text
'hello' 以 '' 开头: True
'' 以 '' 开头: True
```

如果前缀比字符串还长，直接返回 False：

```python
short = "Hi"
print(f"'Hi' 以 'Hello' 开头: {short.startswith('Hello')}")  # False
```

**运行结果**：

```text
'Hi' 以 'Hello' 开头: False
```

### 2.2 startswith() 的元组多值判断

#### 2.2.1 基本用法

`startswith()` 的第一个参数可以是一个**元组**，包含多个候选前缀。只要匹配任意一个就返回 `True`：

```python
url = "ftp://files.server.com"
print(url.startswith(("http://", "https://", "ftp://")))
```

**运行结果**：

```text
True
```

这比用多个 `or` 连接简洁得多：

```python
# 不推荐：多个 or
if url.startswith("http://") or url.startswith("https://") or url.startswith("ftp://"):
    print("是网络协议 URL")

# 推荐：元组一次判断
if url.startswith(("http://", "https://", "ftp://")):
    print("是网络协议 URL")
```

**运行结果**：

```text
是网络协议 URL
是网络协议 URL
```

#### 2.2.2 文件分发场景

元组多值判断在文件分发中特别实用——按前缀把文件路由到不同处理器：

```python
filenames = ["report_q1.pdf", "photo_vacation.jpg", "data_users.csv", "script_backup.py"]

for f in filenames:
    if f.startswith(("report", "data")):
        print(f"  {f} → 业务数据文件")
    elif f.startswith(("photo", "image")):
        print(f"  {f} → 图片文件")
    elif f.startswith("script"):
        print(f"  {f} → 脚本文件")
    else:
        print(f"  {f} → 其他文件")
```

**运行结果**：

```text
  report_q1.pdf → 业务数据文件
  photo_vacation.jpg → 图片文件
  data_users.csv → 业务数据文件
  script_backup.py → 脚本文件
```

#### 2.2.3 URL 协议批量判断

一次判断 URL 属于哪种协议：

```python
urls = [
    "https://example.com",
    "http://localhost:8000",
    "ftp://files.server.com",
    "file:///home/user/doc.txt",
    "ws://chat.example.com",
]

for url in urls:
    if url.startswith(("http://", "https://")):
        print(f"  {url} → HTTP/HTTPS")
    elif url.startswith(("ftp://", "sftp://")):
        print(f"  {url} → FTP")
    elif url.startswith("file://"):
        print(f"  {url} → 本地文件")
    elif url.startswith(("ws://", "wss://")):
        print(f"  {url} → WebSocket")
    else:
        print(f"  {url} → 未知协议")
```

**运行结果**：

```text
  https://example.com → HTTP/HTTPS
  http://localhost:8000 → HTTP/HTTPS
  ftp://files.server.com → FTP
  file:///home/user/doc.txt → 本地文件
  ws://chat.example.com → WebSocket
```

#### 2.2.4 注意：参数必须是元组，不能是列表

`startswith()` 只接受 `str` 或 `tuple of str`，传列表会报 `TypeError`：

```python
try:
    "test.py".startswith(["test", "config"])
except TypeError as e:
    print(f"列表参数报错: {e}")
```

**运行结果**：

```text
列表参数报错: startswith first arg must be str or a tuple of str, not list
```

正确做法是使用元组——加个括号逗号即可：

```python
# 正确：元组
"test.py".startswith(("test", "config"))  # True

# 错误：列表
# "test.py".startswith(["test", "config"])  # TypeError
```

**记住**：元组的标志是逗号，不是括号。但 `startswith(("test",))` 中的括号不能省——不写括号会被解析为多个参数。

### 2.3 startswith() 的范围参数

#### 2.3.1 start 参数：跳过开头部分

`startswith(prefix, start)` 从 `start` 索引位置开始检查前缀，相当于先切片再判断：

```python
text = "Version: 2.0.1-beta"
print(f"字符串: {text}")
print(f"从位置0检查 '2': {text.startswith('2')}")
print(f"从位置9检查 '2': {text.startswith('2', 9)}")
```

**运行结果**：

```text
字符串: Version: 2.0.1-beta
从位置0检查 '2': False
从位置9检查 '2': True
```

`startswith('2', 9)` 等价于 `text[9:].startswith('2')`——从索引 9 开始（跳过了 "Version: "），检查是否以 "2" 开头。

#### 2.3.2 start + end 参数：限定检查范围

`startswith(prefix, start, end)` 在 `[start, end)` 范围内检查前缀，等价于 `s[start:end].startswith(prefix)`：

```python
s = "ABCDEFGH"
print(f"字符串: {s}")
print(f"s.startswith('CD', 2): {s.startswith('CD', 2)}")       # s[2:]="CDEFGH"
print(f"s.startswith('CD', 2, 4): {s.startswith('CD', 2, 4)}")  # s[2:4]="CD"
print(f"s.startswith('CDE', 2, 4): {s.startswith('CDE', 2, 4)}")  # s[2:4]="CD"
```

**运行结果**：

```text
字符串: ABCDEFGH
s.startswith('CD', 2): True
s.startswith('CD', 2, 4): True
s.startswith('CDE', 2, 4): False
```

`s.startswith('CDE', 2, 4)` 检查 `s[2:4]`（即 "CD"）是否以 "CDE" 开头——"CD" 只有 2 个字符，而 "CDE" 有 3 个字符，长度不够，返回 False。

#### 2.3.3 范围参数的切片语义

理解范围参数的关键是——`startswith(prefix, start, end)` 与切片 `s[start:end]` 的语义完全一致：

```text
s.startswith(prefix, start, end)
    ↓ 等价于
s[start:end].startswith(prefix)
```

切片 `s[start:end]` 包含 `start` 但不包含 `end`，`startswith` 的范围参数也是如此。

```python
log_line = "[2024-01-15] INFO Server started"
print(f"日志行: {log_line}")
# 检查从索引1开始、到索引12为止是否以 "2024" 开头
# 等价于 log_line[1:12].startswith("2024")
# log_line[1:12] = "2024-01-15"
print(f"位置1..12 检查 '2024': {log_line.startswith('2024', 1, 12)}")
```

**运行结果**：

```text
日志行: [2024-01-15] INFO Server started
位置1..12 检查 '2024': True
```

#### 2.3.4 完整参数速查

`startswith()` 完整签名：

```text
s.startswith(prefix[, start[, end]])
```

| 参数 | 含义 | 默认值 | 说明 |
|------|------|--------|------|
| `prefix` | 要检查的前缀 | 必填 | 字符串或字符串元组 |
| `start` | 检查起始位置 | 0 | 从该索引开始检查 |
| `end` | 检查结束位置（不含） | `len(s)` | 到该索引为止（不含） |

### 2.4 endswith()：判断后缀

#### 2.4.1 基本用法

`endswith()` 判断字符串是否以指定子串结尾，与 `startswith()` 完全对称：

```python
filename = "report.pdf"
print(f"文件名: {filename}")
print(f"以 '.pdf' 结尾: {filename.endswith('.pdf')}")
print(f"以 '.doc' 结尾: {filename.endswith('.doc')}")
```

**运行结果**：

```text
文件名: report.pdf
以 '.pdf' 结尾: True
以 '.doc' 结尾: False
```

#### 2.4.2 区分大小写

与 `startswith` 一样，`endswith` 也区分大小写：

```python
text = "Hello.PY"
print(f"以 '.py' 结尾: {text.endswith('.py')}")    # False
print(f"以 '.PY' 结尾: {text.endswith('.PY')}")    # True
```

**运行结果**：

```text
以 '.py' 结尾: False
以 '.PY' 结尾: True
```

实际开发中，如果文件扩展名大小写不确定，建议先转换为小写再判断：

```python
filename = "Report.PDF"
print(filename.lower().endswith(".pdf"))  # True
```

**运行结果**：

```text
True
```

#### 2.4.3 空后缀与超长后缀

空字符串作为后缀时永远返回 True（与 `startswith` 行为一致）：

```python
print(f"'hello' 以 '' 结尾: {'hello'.endswith('')}")  # True
```

**运行结果**：

```text
'hello' 以 '' 结尾: True
```

后缀比字符串长时返回 False：

```python
print(f"'.py' 以 'script.py' 结尾: {'.py'.endswith('script.py')}")  # False
```

**运行结果**：

```text
'.py' 以 'script.py' 结尾: False
```

### 2.5 endswith() 的元组多值判断

#### 2.5.1 文件类型分类

`endswith()` 同样支持元组参数，这在文件类型分类中极其常用：

```python
files = ["main.py", "report.pdf", "photo.jpg", "data.csv", "video.mp4", "music.mp3"]

for f in files:
    if f.endswith((".py", ".sh")):
        category = "脚本"
    elif f.endswith((".pdf", ".docx", ".doc")):
        category = "文档"
    elif f.endswith((".jpg", ".png", ".gif", ".bmp")):
        category = "图片"
    elif f.endswith((".mp4", ".avi", ".mkv")):
        category = "视频"
    elif f.endswith((".mp3", ".wav", ".flac")):
        category = "音频"
    elif f.endswith((".csv", ".xlsx", ".json")):
        category = "数据"
    else:
        category = "其他"
    print(f"  {f:15s} → {category}")
```

**运行结果**：

```text
  main.py         → 脚本
  report.pdf      → 文档
  photo.jpg       → 图片
  data.csv        → 数据
  video.mp4       → 视频
  music.mp3       → 音频
```

#### 2.5.2 多后缀判断 vs 多个 or

对比两种写法的简洁度：

```python
filename = "archive.tar.gz"

# 不推荐：多个 or 连接
if filename.endswith(".zip") or filename.endswith(".tar.gz") or filename.endswith(".rar"):
    print("是压缩文件")

# 推荐：元组一次判断
if filename.endswith((".zip", ".tar.gz", ".rar")):
    print("是压缩文件")
```

**运行结果**：

```text
是压缩文件
是压缩文件
```

元组写法不仅更简洁，而且当候选后缀很多时（如十几种图片格式），优势更明显。

#### 2.5.3 注意：元组元素必须是字符串

元组中的每个元素都必须是字符串，混入非字符串类型会报错：

```python
try:
    "test123".endswith(("test", 123))
except TypeError as e:
    print(f"混入非字符串报错: {e}")
```

**运行结果**：

```text
混入非字符串报错: endswith first arg must be str or a tuple of str, not tuple
```

### 2.6 endswith() 的范围参数

#### 2.6.1 start 参数

`endswith(suffix, start)` 从 `start` 位置开始检查后缀，等价于 `s[start:].endswith(suffix)`：

```python
path = "/home/user/report.backup.pdf"
print(f"路径: {path}")
# 从位置6开始检查（跳过 "/home/"）
# s[6:] = "user/report.backup.pdf"
print(f"从位置6开始以 'report' 结尾: {path.endswith('report', 6)}")
```

**运行结果**：

```text
路径: /home/user/report.backup.pdf
从位置6开始以 'report' 结尾: False
```

`path[6:]` 是 `"user/report.backup.pdf"`，它不以 "report" 结尾（以 ".pdf" 结尾），所以返回 False。

#### 2.6.2 start + end 参数：去掉扩展名后判断

`endswith(suffix, start, end)` 在 `[start, end)` 范围内检查后缀，最有用的场景是"去掉扩展名后判断"：

```python
path = "/home/user/report.backup.pdf"
dot_pos = path.rfind(".")
print(f"最后一个点位置: {dot_pos}")
# 检查 path[0:dot_pos]（去掉扩展名后的部分）是否以 ".backup" 结尾
# path[0:24] = "/home/user/report.backup"
print(f"去掉扩展名后以 '.backup' 结尾: {path.endswith('.backup', 0, dot_pos)}")
```

**运行结果**：

```text
最后一个点位置: 24
去掉扩展名后以 '.backup' 结尾: True
```

`path[0:24]` 是 `"/home/user/report.backup"`，以 ".backup" 结尾，返回 True。这种用法在处理有多个点的文件名（如 `report.backup.pdf`）时特别有用。

#### 2.6.3 范围参数语义对比

与 `startswith` 一样，`endswith(suffix, start, end)` 等价于 `s[start:end].endswith(suffix)`：

```text
s.endswith(suffix, start, end)
    ↓ 等价于
s[start:end].endswith(suffix)
```

| 调用形式 | 等价切片 | 含义 |
|---------|---------|------|
| `s.endswith(x)` | `s[0:].endswith(x)` | 整个字符串 |
| `s.endswith(x, 5)` | `s[5:].endswith(x)` | 从位置5到末尾 |
| `s.endswith(x, 5, 10)` | `s[5:10].endswith(x)` | 从位置5到10（不含） |

#### 2.6.4 完整参数速查

`endswith()` 完整签名：

```text
s.endswith(suffix[, start[, end]])
```

| 参数 | 含义 | 默认值 | 说明 |
|------|------|--------|------|
| `suffix` | 要检查的后缀 | 必填 | 字符串或字符串元组 |
| `start` | 检查起始位置 | 0 | 从该索引开始检查 |
| `end` | 检查结束位置（不含） | `len(s)` | 到该索引为止（不含） |

### 2.7 startswith 与 endswith 完整对比

两个方法在行为上完全对称，掌握一个就能举一反三：

| 维度 | `startswith()` | `endswith()` |
|------|---------------|-------------|
| 判断方向 | 从字符串**开头**检查 | 从字符串**末尾**检查 |
| 返回值 | `bool` | `bool` |
| 区分大小写 | 是 | 是 |
| 空前缀/后缀 | 永远 True | 永远 True |
| 前缀/后缀比字符串长 | 返回 False | 返回 False |
| 元组多值 | 支持，匹配任意一个 | 支持，匹配任意一个 |
| 范围参数 `start, end` | 支持 | 支持 |
| 参数类型要求 | `str` 或 `tuple of str` | `str` 或 `tuple of str` |
| 等价切片语义 | `s[start:end].startswith(x)` | `s[start:end].endswith(x)` |

### 2.8 startswith / endswith 与其他方法的对比

字符串中做"判断"的方法有好几个，它们的适用场景不同：

| 方法 | 判断什么 | 典型场景 |
|------|---------|---------|
| `startswith(prefix)` | 是否以 prefix **开头** | URL 协议、日志级别、文件名前缀 |
| `endswith(suffix)` | 是否以 suffix **结尾** | 文件扩展名、域名后缀、数据行格式 |
| `in` | 子串是否**存在**（任意位置） | 关键词过滤、简单搜索 |
| `find()` | 子串**首次出现位置** | 需要知道位置时 |
| `==` | 是否**完全相等** | 精确匹配 |
| `startswith` + 元组 | 是否以**任意一个**候选开头 | 多协议/多前缀分发 |
| `endswith` + 元组 | 是否以**任意一个**候选结尾 | 多扩展名/多后缀分类 |

**选择决策**：

```text
你需要判断什么？
    ├── 只关心开头
    │       → startswith()
    ├── 只关心结尾
    │       → endswith()
    ├── 子串在任意位置
    │       → in
    ├── 需要知道具体位置
    │       → find() / index()
    └── 需要完全匹配
            → ==
```

**`startswith` vs `in` 的关键区别**——`in` 只判断"是否包含"，不关心出现位置：

```python
filename = "backup.script.py"

# in 不关心位置，可能在中间
print(f"'.py' in filename: {'.py' in filename}")              # True（但可能在中间）

# endswith 只看结尾
print(f"filename.endswith('.py'): {filename.endswith('.py')}")  # True（确实在结尾）

# 如果文件名中间有 .py 但结尾不是
filename2 = "script.py.bak"
print(f"'.py' in filename2: {'.py' in filename2}")            # True（在中间出现）
print(f"filename2.endswith('.py'): {filename2.endswith('.py')}")  # False（结尾是 .bak）
```

**运行结果**：

```text
'.py' in filename: True
filename.endswith('.py'): True
'.py' in filename2: True
filename2.endswith('.py'): False
```

这就是判断文件类型必须用 `endswith` 而非 `in` 的原因——`in` 可能将 `script.py.bak` 误判为 Python 文件。

## 3. 最佳实践

### 3.1 推荐 vs 不推荐写法

| 场景 | 不推荐 | 推荐 | 原因 |
|------|--------|------|------|
| 判断多个前缀 | `s.startswith('a') or s.startswith('b')` | `s.startswith(('a', 'b'))` | 元组写法更简洁，一次调用 |
| 判断文件类型 | `'.py' in filename` | `filename.endswith('.py')` | `in` 可能匹配中间部分 |
| 忽略大小写 | `s.startswith('HTTP') or s.startswith('http')` | `s.lower().startswith('http')` | 先转小写更可靠 |
| 多扩展名 | 多个 `endswith` 用 `or` 连接 | `endswith(('.py', '.sh', '.rb'))` | 元组写法避免重复调用 |
| 获取扩展名 | `filename[-3:]`（硬编码长度） | `filename.endswith('.py')` 或用 `os.path.splitext` | 硬编码长度容易出错 |
| 传列表当参数 | `s.startswith(['a', 'b'])` | `s.startswith(('a', 'b'))` | 列表会报 TypeError |
| 元组只有一个元素 | `s.startswith(('a',))` | `s.startswith('a')` | 单元素直接传字符串更简洁 |
| 判断 URL 协议 | `url[:8] == 'https://'` | `url.startswith('https://')` | 切片硬编码长度容易出错 |

### 3.2 常见错误模式

**错误1：用列表代替元组**

```python
# 错误：列表会报 TypeError
# "test.py".startswith(["test", "config"])

# 正确：使用元组
"test.py".startswith(("test", "config"))
```

**错误2：用 `in` 判断文件扩展名**

```python
filename = "my_script.py.bak"

# 错误：'.py' 在中间也会匹配
if ".py" in filename:
    print("Python 文件")  # 误判！

# 正确：用 endswith 只看结尾
if filename.endswith(".py"):
    print("Python 文件")
```

**运行结果**：

```text
Python 文件  # in 误判
（endswith 不会误判）
```

**错误3：切片硬编码长度判断前缀**

```python
url = "https://example.com"

# 不推荐：硬编码长度，容易算错
if url[:8] == "https://":
    print("HTTPS")

# 推荐：startswith 不需要算长度
if url.startswith("https://"):
    print("HTTPS")
```

**运行结果**：

```text
HTTPS
HTTPS
```

**错误4：忽略大小写问题**

```python
# 实际文件可能扩展名大小写不一
files = ["photo.JPG", "image.Png", "pic.jpeg"]

# 不推荐：只判断小写，会漏掉大写扩展名
for f in files:
    if f.endswith((".jpg", ".png")):
        print(f"  {f} 是图片")  # 全部漏掉

# 推荐：先转小写再判断
for f in files:
    if f.lower().endswith((".jpg", ".png", ".jpeg")):
        print(f"  {f} 是图片")
```

**运行结果**：

```text
  photo.JPG 是图片
  image.Png 是图片
  pic.jpeg 是图片
```

### 3.3 性能注意事项

**元组多值 vs 多次调用**：元组参数比多次 `or` 调用更高效，因为 `startswith` 内部对元组做一次遍历，而多次 `or` 会多次调用方法：

```python
# 更高效：一次调用
filename.startswith(("report", "data", "user", "config", "test"))

# 较低效：多次调用
filename.startswith("report") or filename.startswith("data") or filename.startswith("user") or ...

# 最慢：正则
import re
bool(re.match(r"^(report|data|user|config|test)", filename))
```

**时间复杂度**：`startswith` 和 `endswith` 的时间复杂度是 **O(k)**，其中 k 是前缀/后缀的长度，与字符串总长度无关。它们不需要扫描整个字符串——`startswith` 只比较头部 k 个字符，`endswith` 只比较尾部 k 个字符：

```python
# 即使字符串很长，判断前缀也很快
long_text = "https://" + "a" * 10_000_000 + ".com"
print(long_text.startswith("https://"))  # 只比较前 8 个字符，O(8)
print(long_text.endswith(".com"))        # 只比较后 4 个字符，O(4)
```

**运行结果**：

```text
True
True
```

## 4. 原理

### 4.1 startswith / endswith 的底层实现

`startswith` 和 `endswith` 在 CPython 中由 C 实现，核心逻辑是**内存比较**（`memcmp`），不需要逐字符遍历 Python 层面的字符串对象。

`startswith` 的核心流程：

```text
s.startswith(prefix)
    ↓
1. 检查 prefix 类型（str 或 tuple of str）
2. 如果是 str：
     比较 s 的前 len(prefix) 个字符与 prefix
     → memcmp(s_data, prefix_data, len(prefix))
3. 如果是 tuple：
     遍历元组中每个候选 prefix
     → 对每个候选执行步骤 2
     → 任一匹配则返回 True
4. 处理 start/end 参数：
     → 等价于先切片 s[start:end] 再比较
```

`endswith` 的流程完全对称，只是从字符串末尾比较：

```text
s.endswith(suffix)
    ↓
1. 检查 suffix 类型
2. 如果是 str：
     比较 s 的末尾 len(suffix) 个字符与 suffix
     → memcmp(s_data + len(s) - len(suffix), suffix_data, len(suffix))
3. 如果是 tuple：
     遍历元组中每个候选 suffix
     → 任一匹配则返回 True
4. 处理 start/end 参数：
     → 等价于先切片 s[start:end] 再比较
```

### 4.2 为什么元组比多次 or 更高效

当传入元组时，`startswith` 在 C 层面遍历候选列表，一次调用完成所有比较。而 `or` 连接的多次调用每次都要经历 Python 函数调用开销：

```text
元组方式（一次 C 调用）:
    startswith(("a", "b", "c"))
    → C 层面遍历 3 个候选
    → 每个候选做一次 memcmp
    → 总共 1 次方法调用

or 方式（3 次方法调用）:
    startswith("a") or startswith("b") or startswith("c")
    → 3 次方法调用（每次有 Python/C 边界开销）
    → 短路求值可能减少比较次数
```

当候选数量较少时（2-3 个），差异不大。但候选数量多时（如 10+ 种文件扩展名），元组方式明显更快。

### 4.3 范围参数不创建新字符串

`startswith(prefix, start, end)` 虽然等价于 `s[start:end].startswith(prefix)`，但它在底层**不会真的创建切片副本**——而是直接在原字符串的内存上偏移计算：

```text
直接调用（高效，无副本）:
    s.startswith("abc", 5, 20)
    → 在 s 的内存上，从偏移 5 开始，比较到偏移 20
    → 不创建新字符串

先切片再调用（低效，创建副本）:
    s[5:20].startswith("abc")
    → 先创建一个长度 15 的新字符串对象
    → 再在新字符串上调用 startswith
```

所以，如果需要在字符串的某个范围内判断前缀，**直接用范围参数**比先切片更高效：

```python
text = "Hello, World!"

# 推荐：直接用范围参数
text.startswith("World", 7)  # 高效

# 不推荐：先切片再判断
text[7:].startswith("World")  # 多创建了一个字符串对象
```

### 4.4 空前缀/后缀返回 True 的原因

`"".startswith("")` 和 `"hello".startswith("")` 都返回 True。这是因为 `startswith` 的底层逻辑是——比较字符串的前 `len(prefix)` 个字符与 `prefix`：

```text
s = "hello", prefix = ""
len(prefix) = 0
→ 比较前 0 个字符
→ memcmp(s_data, "", 0)
→ 长度为 0 的内存比较，永远相等
→ 返回 True
```

同样的逻辑适用于 `endswith`——比较末尾 0 个字符，永远相等。

## 5. 总结

本文围绕字符串前缀与后缀判断展开，主要介绍了以下内容：

- `startswith(prefix)` 判断字符串是否以指定前缀开头，`endswith(suffix)` 判断是否以指定后缀结尾，均返回 `bool`
- 两个方法都**区分大小写**，需要忽略大小写时先 `lower()` 再判断
- 空字符串作为前缀/后缀时永远返回 True；前缀/后缀比字符串长时返回 False
- 两个方法都支持**元组多值判断**——传入元组时匹配任意一个即返回 True，比多次 `or` 更简洁高效
- 元组参数必须是 `tuple` 类型，传 `list` 会报 `TypeError`
- 两个方法都支持 `start` / `end` 范围参数，语义等价于 `s[start:end].startswith(x)`，但不创建切片副本
- 范围参数的切片语义：包含 `start`，不包含 `end`
- 判断文件类型必须用 `endswith()` 而非 `in`——`in` 会匹配字符串中间的部分导致误判
- `startswith` / `endswith` 的时间复杂度为 O(k)（k 为前缀/后缀长度），与字符串总长度无关
- 元组多值判断比多次 `or` 连接更高效，因为只经历一次方法调用
- 范围参数比先切片再判断更高效，因为不创建中间字符串对象
