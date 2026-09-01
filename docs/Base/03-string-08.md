---
group:
  title: 【03】字符串深度剖析
  order: 3
order: 8
title: 字符串分割方法
nav:
  title: Python基础
  order: 1
---

# 字符串分割方法

## 1. 介绍

### 1.1 什么是字符串分割方法

字符串分割方法是 Python `str` 类中用于"将一个字符串拆成多段"的一组内置方法。它们根据指定的分隔符或行边界，将字符串拆分成列表或元组，是文本解析、数据提取、格式转换中最基础也最常用的工具。

```python
# split 按分隔符拆成列表
print("a,b,c,d".split(","))
# ['a', 'b', 'c', 'd']

# splitlines 按行拆成列表
print("第一行\n第二行".splitlines())
# ['第一行', '第二行']

# partition 拆成三元素元组
print("key=value".partition("="))
# ('key', '=', 'value')
```

Python 的字符串分割方法可以分成三类：

| 类 | 方法 | 返回值 | 核心特点 |
|----|------|--------|---------|
| `split` 族 | `split`、`rsplit` | 列表 | 按分隔符拆分，可控制分割次数 |
| 按行分割 | `splitlines` | 列表 | 按通用换行符拆分，跨平台安全 |
| `partition` 族 | `partition`、`rpartition` | 三元组 | 固定返回三元素，找不到分隔符不报错 |

### 1.2 最简示例

```python
# split：解析 CSV 行
csv = "apple,banana,cherry"
print(csv.split(","))
# ['apple', 'banana', 'cherry']

# rsplit + maxsplit：从右提取文件扩展名
name, ext = "report.tar.gz".rsplit(".", 1)
print(f"文件名: {name}, 扩展名: {ext}")
# 文件名: report.tar, 扩展名: gz

# splitlines：安全处理多行文本
text = "line1\r\nline2\nline3"
print(text.splitlines())
# ['line1', 'line2', 'line3']

# partition：安全解析键值对
key, _, value = "host=localhost".partition("=")
print(f"key={key}, value={value}")
# key=host, value=localhost
```

这三类方法覆盖了文本分割的核心需求——"按某分隔符拆成 N 段""按行拆分""拆成前后两部分"。理解每种方法的行为细节和适用场景，能让你在日志解析、配置读取、CSV 处理等任务中写出简洁健壮的代码。

## 2. 核心内容

### 2.1 `split()` 按分隔符分割

#### 2.1.1 不带参数：按空白字符分割

`split()` 不带任何参数时，以任意空白字符（空格、制表符 `\t`、换行符 `\n`、回车 `\r` 等）为分隔符。最大的特点：**连续空白自动合并，首尾空白自动忽略**。

```python
# 连续空白合并为单个分隔符
text = "  Hello   Python   World  "
print(text.split())
# ['Hello', 'Python', 'World']

# 混合空白也自动处理
text2 = "Python\tJava\nGo\r\nRust"
print(text2.split())
# ['Python', 'Java', 'Go', 'Rust']

# 空字符串返回空列表
print("".split())
# []
```

这个行为非常有用——处理用户输入时，不需要关心用户输入了多少空格，`split()` 会自动归一化。

#### 2.1.2 指定分隔符

`split(sep)` 按指定分隔符 `sep` 分割字符串，返回列表。分隔符可以是单个字符，也可以是多字符的子串。

```python
# 单字符分隔符
csv_line = "apple,banana,cherry,date"
print(csv_line.split(","))
# ['apple', 'banana', 'cherry', 'date']

# 多字符分隔符
log = "2024-01-15|INFO|System started"
print(log.split("|"))
# ['2024-01-15', 'INFO', 'System started']

# 分隔符不存在时，返回单元素列表
print("hello".split(","))
# ['hello']
```

#### 2.1.3 `maxsplit` 参数：限制分割次数

`maxsplit` 控制最多分割几刀——分割后的列表最多有 `maxsplit + 1` 个元素。剩余部分作为最后一个元素，不再继续分割。

```python
text = "a-b-c-d-e"

# 不限制：全部分割
print(text.split("-"))
# ['a', 'b', 'c', 'd', 'e']

# 最多 1 刀 → 2 个元素
print(text.split("-", 1))
# ['a', 'b-c-d-e']

# 最多 2 刀 → 3 个元素
print(text.split("-", 2))
# ['a', 'b', 'c-d-e']

# 最多 3 刀
print(text.split("-", 3))
# ['a', 'b', 'c', 'd-e']
```

`maxsplit` 的典型场景是"只提取前几个部分，剩余部分保持整体"。例如解析配置行时，值中可能包含等号，只需要在第一个等号处分割：

```python
# 值中可能包含 = 号，只在第一个 = 处分割
config_line = "path=/home/user/test=a=b"
key, value = config_line.split("=", 1)
print(f"key={key}, value={value}")
# key=path, value=/home/user/test=a=b
```

#### 2.1.4 指定分隔符 vs 不带参数的关键差异

指定分隔符和不带参数的 `split()` 行为完全不同——这是最容易混淆的地方：

```python
text = "  a   b  "

# 不带参数：连续空白合并，首尾空白忽略
print(text.split())
# ['a', 'b']

# 指定空格为分隔符：每个空格都是独立分隔符
print(text.split(" "))
# ['', '', 'a', '', '', 'b', '', '']
```

指定分隔符后，连续的分隔符会产生**空字符串**元素，首尾的分隔符也会产生空串：

```python
# 连续分隔符产生空串
print("a,,b,,,c".split(","))
# ['a', '', 'b', '', '', 'c']

# 首尾分隔符产生空串
print(",a,b,".split(","))
# ['', 'a', 'b', '']
```

#### 2.1.5 分隔符为空字符串的特殊行为

`split("")` 会抛出 `ValueError`：

```python
try:
    "hello".split("")
except ValueError as e:
    print(f"split('') 报错: {e}")
# split('') 报错: empty separator
```

如果需要将字符串拆成单个字符的列表，应该用 `list()`：

```python
print(list("hello"))
# ['h', 'e', 'l', 'l', 'o']
```

#### 2.1.6 实际应用——路径解析

```python
path = "/home/user/projects/myapp/src/main.py"

# 提取路径各部分
parts = path.split("/")
print(parts)
# ['', 'home', 'user', 'projects', 'myapp', 'src', 'main.py']

# 提取文件名（最后一部分）
filename = path.split("/")[-1]
print(f"文件名: {filename}")
# 文件名: main.py

# 提取目录路径（除最后一部分）
dir_path = "/".join(path.split("/")[:-1])
print(f"目录: {dir_path}")
# 目录: /home/user/projects/myapp/src
```

### 2.2 `rsplit()` 从右向左分割

#### 2.2.1 `rsplit` 不带 `maxsplit` 时与 `split` 完全相同

当不限制分割次数时，`rsplit` 和 `split` 的结果完全一样——都是从左到右全部拆分：

```python
text = "a-b-c-d-e"
print(text.split("-"))
# ['a', 'b', 'c', 'd', 'e']

print(text.rsplit("-"))
# ['a', 'b', 'c', 'd', 'e']  ← 结果相同
```

#### 2.2.2 `rsplit` 的 `maxsplit` 从右向左计数

`rsplit` 的核心价值在于配合 `maxsplit` 使用——分割方向从右向左：

```python
text = "a-b-c-d-e"

# split 从左限制 2 刀
print(text.split("-", 2))
# ['a', 'b', 'c-d-e']

# rsplit 从右限制 2 刀
print(text.rsplit("-", 2))
# ['a-b-c', 'd', 'e']
```

**注意 `maxsplit` 的值仍然代表"分割几刀"**，所以 `rsplit("-", 2)` 返回 3 个元素——从右切 2 刀，得到左边整体 + 右边 2 个元素。

#### 2.2.3 `split` vs `rsplit` 的 `maxsplit` 对比

```python
text = "1,2,3,4,5,6,7,8,9,10"

for n in [1, 2, 3]:
    print(f"split({n}):   {text.split(',', n)}")
    print(f"rsplit({n}):  {text.rsplit(',', n)}")
    print()

# 输出:
# split(1):   ['1', '2,3,4,5,6,7,8,9,10']
# rsplit(1):  ['1,2,3,4,5,6,7,8,9', '10']
#
# split(2):   ['1', '2', '3,4,5,6,7,8,9,10']
# rsplit(2):  ['1,2,3,4,5,6,7,8', '9', '10']
#
# split(3):   ['1', '2', '3', '4,5,6,7,8,9,10']
# rsplit(3):  ['1,2,3,4,5,6,7', '8', '9', '10']
```

#### 2.2.4 实际应用——从路径提取扩展名

```python
filepath = "/home/user/docs/report.csv"

# rsplit 从右切 1 刀，提取扩展名
name, ext = filepath.rsplit(".", 1)
print(f"文件名: {name}")
print(f"扩展名: {ext}")
# 文件名: /home/user/docs/report
# 扩展名: csv

# 从右切 1 刀，提取纯文件名
dir_part, filename = filepath.rsplit("/", 1)
print(f"目录: {dir_part}")
print(f"文件名: {filename}")
# 目录: /home/user/docs
# 文件名: report.csv
```

#### 2.2.5 实际应用——从多层域名提取顶级域名

```python
domain = "mail.example.co.uk"

# split 从左：拿第一段
print(domain.split(".", 1))
# ['mail', 'example.co.uk']

# rsplit 从右：拿最后一段（顶级域名）
print(domain.rsplit(".", 1))
# ['mail.example', 'co.uk']
```

### 2.3 `splitlines()` 按行分割

#### 2.3.1 `splitlines` 基本用法

`splitlines()` 按通用换行符分割字符串。与 `split("\n")` 不同，`splitlines` 能正确处理所有平台的所有换行形式——`\n`、`\r\n`、`\r` 以及 Unicode 行分隔符。

```python
text = "第一行\n第二行\n第三行"
print(text.splitlines())
# ['第一行', '第二行', '第三行']

# 混合换行符也能正确处理
text2 = "Windows行\r\nUnix行\n旧Mac行\r"
print(text2.splitlines())
# ['Windows行', 'Unix行', '旧Mac行']
```

#### 2.3.2 `splitlines` vs `split("\n")` 的关键差异

这是处理多行文本时最容易踩坑的地方：

```python
text_mixed = "line1\r\nline2\nline3"

# split("\n") 不能处理 \r\n：\r 会残留
print(text_mixed.split("\n"))
# ['line1\r', 'line2', 'line3']  ← \r 残留

# splitlines() 正确处理所有换行符
print(text_mixed.splitlines())
# ['line1', 'line2', 'line3']  ← 干净
```

末尾换行符的处理也不同：

```python
text_trailing = "line1\nline2\n"

# split("\n") 末尾会产生空串
print(text_trailing.split("\n"))
# ['line1', 'line2', '']  ← 末尾多一个空串

# splitlines() 末尾换行不会产生空串
print(text_trailing.splitlines())
# ['line1', 'line2']  ← 干净
```

#### 2.3.3 `keepends` 参数：保留换行符

`splitlines(keepends=True)` 保留每行末尾的换行符，可以用于精确重组原字符串：

```python
text = "第一行\n第二行\r\n第三行\r"

print("keepends=False（默认）:")
for line in text.splitlines():
    print(f"  '{line}'")

print("keepends=True:")
for line in text.splitlines(keepends=True):
    print(f"  '{line}'")
```

**运行结果**：

```text
keepends=False（默认）:
  '第一行'
  '第二行'
  '第三行'
keepends=True:
  '第一行\n'
  '第二行\r\n'
  '第三行\r'
```

`keepends=True` 的实际用途——需要精确重组原字符串时：

```python
original = "line1\nline2\r\nline3"
parts = original.splitlines(keepends=True)
restored = "".join(parts)
print(f"重组后与原字符串相同: {restored == original}")
# 重组后与原字符串相同: True
```

#### 2.3.4 `splitlines` 支持的行边界

`splitlines` 不仅能处理 `\n`、`\r\n`、`\r`，还支持 Unicode 标准定义的其他行边界：

```python
# Unicode 行分隔符 U+2028、段分隔符 U+2029
text_unicode = "行1\u2028行2\u2029行3"
print(text_unicode.splitlines())
# ['行1', '行2', '行3']

# 文件分隔符 \x1c、组分隔符 \x1d、记录分隔符 \x1e
text_special = "A\x1cB\x1dC\x1eD"
print(text_special.splitlines())
# ['A', 'B', 'C', 'D']
```

**`splitlines` 支持的行边界一览**：

| 字符 | 说明 |
|------|------|
| `\n` | 换行符（Unix/Linux） |
| `\r` | 回车符（旧 Mac） |
| `\r\n` | 回车+换行（Windows） |
| `\v` / `\f` | 垂直制表符 / 换页符 |
| `\x1c` | 文件分隔符 |
| `\x1d` | 组分隔符 |
| `\x1e` | 记录分隔符 |
| `\x85` | 下一行（Next Line, NEL） |
| `\u2028` | 行分隔符（Line Separator） |
| `\u2029` | 段分隔符（Paragraph Separator） |

#### 2.3.5 实际应用——解析多行配置

```python
config_text = """
# 数据库配置
host=localhost
port=8080

# 缓存配置
cache_host=redis
cache_port=6379
"""

config = {}
for line in config_text.splitlines():
    line = line.strip()
    if not line or line.startswith("#"):
        continue
    if "=" in line:
        key, value = line.split("=", 1)
        config[key] = value

print("解析结果:")
for k, v in config.items():
    print(f"  {k} = {v}")

# 输出:
# 解析结果:
#   host = localhost
#   port = 8080
#   cache_host = redis
#   cache_port = 6379
```

### 2.4 `partition()` / `rpartition()` 三元素分割

#### 2.4.1 `partition` 基本用法

`partition(sep)` 将字符串在**第一个**匹配的分隔符处分成三部分，返回一个三元组 `(分隔符前, 分隔符本身, 分隔符后)`。它**总是返回三个元素**，不会报错。

```python
text = "Hello World Python"
result = text.partition(" ")
print(result)
# ('Hello', ' ', 'World Python')

# 用三元组解包
before, sep, after = text.partition(" ")
print(f"前: '{before}', 分隔: '{sep}', 后: '{after}'")
# 前: 'Hello', 分隔: ' ', 后: 'World Python'
```

#### 2.4.2 分隔符不存在时的安全行为

`partition` 最大的优势——分隔符不存在时不会报错，返回 `(原字符串, "", "")`：

```python
text = "HelloWorld"
result = text.partition(" ")
print(result)
# ('HelloWorld', '', '')

# 这使得 partition 比 split 更安全
print(text.split(" "))
# ['HelloWorld']  ← 返回单元素列表，需要检查长度

# partition 总是三元素，解包不会出错
before, sep, after = "no-space-here".partition(" ")
print(f"有分隔符吗: {bool(sep)}")
# 有分隔符吗: False
```

#### 2.4.3 `rpartition` 从右侧查找分隔符

`rpartition(sep)` 从右向左查找第一个匹配的分隔符：

```python
text = "a=1&b=2&c=3"

# partition 从左找到第一个 "="
key, _, value = text.partition("=")
print(f"左: key={key}, value={value}")
# 左: key=a, value=1&b=2&c=3

# rpartition 从右找到最后一个 "="
key, _, value = text.rpartition("=")
print(f"右: key={key}, value={value}")
# 右: key=a=1&b=2&c, value=3
```

#### 2.4.4 `partition` vs `rpartition` 方向对比

```python
text = "2024-01-15-10-30"

# partition 从左找到第一个 "-"
left = text.partition("-")
print(f"partition: {left}")
# ('2024', '-', '01-15-10-30')

# rpartition 从右找到最后一个 "-"
right = text.rpartition("-")
print(f"rpartition: {right}")
# ('2024-01-15-10', '-', '30')
```

#### 2.4.5 `partition` vs `split` 的安全性对比

`partition` 比带 `maxsplit=1` 的 `split` 更安全——后者返回列表，长度不确定，需要额外检查；前者固定返回三元素，解包天然安全。

```python
# split 模式：需要检查列表长度
def parse_key_value_split(text):
    parts = text.split("=", 1)
    if len(parts) == 2:
        return parts[0], parts[1]
    else:
        return parts[0], None

# partition 模式：天然安全，不用检查长度
def parse_key_value_partition(text):
    key, sep, value = text.partition("=")
    if sep:
        return key, value
    return key, None

test_cases = [
    "host=localhost",
    "port=8080",
    "invalid",           # 没有 = 号
    "path=/a=b=c",       # 多个 = 号
]

for text in test_cases:
    r1 = parse_key_value_split(text)
    r2 = parse_key_value_partition(text)
    print(f"  '{text}' → split: {r1}, partition: {r2}")

# 'host=localhost' → split: ('host', 'localhost'), partition: ('host', 'localhost')
# 'port=8080' → split: ('port', '8080'), partition: ('port', '8080')
# 'invalid' → split: ('invalid', None), partition: ('invalid', None)
# 'path=/a=b=c' → split: ('path', '/a=b=c'), partition: ('path', '/a=b=c')
```

#### 2.4.6 实际应用——解析 URL

`partition` 在链式解析结构化文本时非常优雅——不需要检查分隔符是否存在，直接解包：

```python
url = "https://www.example.com:8080/api/v1?query=1"

# 分离协议
protocol, _, rest = url.partition("://")
print(f"协议: {protocol}")
# 协议: https

# 分离域名和路径
domain, _, path = rest.partition("/")
print(f"域名: {domain}")
print(f"路径: {path}")
# 域名: www.example.com:8080
# 路径: api/v1?query=1

# 分离端口
host, sep, port = domain.partition(":")
print(f"主机: {host}")
print(f"端口: {port if sep else '(默认)'}")
# 主机: www.example.com
# 端口: 8080

# 分离路径和查询参数
path_part, _, query = path.partition("?")
print(f"路径: /{path_part}")
print(f"参数: {query}")
# 路径: /api/v1
# 参数: query=1
```

#### 2.4.7 分隔符不存在时 `partition` vs `rpartition` 的差异

分隔符不存在时，`partition` 把原字符串放在第一个位置，而 `rpartition` 把原字符串放在最后一个位置——这是两者的关键差异：

```python
text = "no-separator-here"  # 这里没有逗号

# partition: 分隔符不存在 → (原字符串, "", "")
print(text.partition(","))
# ('no-separator-here', '', '')

# rpartition: 分隔符不存在 → ("", "", 原字符串)
print(text.rpartition(","))
# ('', '', 'no-separator-here')
```

这个差异在实际使用中很重要：`rpartition` 在分隔符不存在时把内容放在最后一个元素，这意味着如果你需要的是"分隔符后的内容"，用 `rpartition` 时分隔符不存在会得到空串而非原字符串。反过来，如果你需要的是"分隔符前的内容"，用 `partition` 更合适。

### 2.5 综合实战

#### 2.5.1 CSV 解析器

综合使用 `splitlines` + `split` 实现简易 CSV 解析：

```python
def parse_csv_line(line, delimiter=","):
    """解析单行 CSV"""
    line = line.rstrip("\n\r")
    return [f.strip() for f in line.split(delimiter)]

def parse_csv(csv_text):
    """解析 CSV 文本，返回表头和数据行"""
    lines = csv_text.strip().splitlines()
    if not lines:
        return [], []
    headers = parse_csv_line(lines[0])
    data = [parse_csv_line(line) for line in lines[1:] if line.strip()]
    return headers, data

csv_data = """姓名,年龄,邮箱,部门
张三,30,zhangsan@example.com,技术部
李四,25,lisi@example.com,市场部
王五,35,wangwu@example.com,管理部
"""

headers, rows = parse_csv(csv_data)
print(f"表头: {headers}")
for row in rows:
    print(f"  {row}")

# 输出:
# 表头: ['姓名', '年龄', '邮箱', '部门']
#   ['张三', '30', 'zhangsan@example.com', '技术部']
#   ['李四', '25', 'lisi@example.com', '市场部']
#   ['王五', '35', 'wangwu@example.com', '管理部']
```

#### 2.5.2 日志解析器

综合使用 `partition` + `splitlines` 解析结构化日志：

```python
def parse_log_line(log_line):
    """解析日志行：[时间戳] 级别: 消息"""
    line = log_line.strip()
    if not line:
        return None

    # 用 partition 安全提取时间戳
    after_bracket, _, rest = line.partition("]")
    if not _:
        return None
    timestamp = after_bracket[1:]  # 去掉开头的 '['

    # 用 partition 安全提取级别和消息
    level, _, message = rest.strip().partition(": ")
    if not _:
        return None

    return {"timestamp": timestamp, "level": level, "message": message.strip()}

log_content = """[2024-01-15 08:30:00] INFO: System started
[2024-01-15 08:32:45] WARN: Cache hit rate below 60%
[2024-01-15 08:33:10] ERROR: Database connection timeout
[2024-01-15 08:35:20] ERROR: Authentication failed"""

for line in log_content.strip().splitlines():
    parsed = parse_log_line(line)
    if parsed:
        print(f"  [{parsed['level']:5s}] {parsed['timestamp']} → {parsed['message']}")

# 输出:
#   [INFO ] 2024-01-15 08:30:00 → System started
#   [WARN ] 2024-01-15 08:32:45 → Cache hit rate below 60%
#   [ERROR] 2024-01-15 08:33:10 → Database connection timeout
#   [ERROR] 2024-01-15 08:35:20 → Authentication failed
```

#### 2.5.3 URL 解析器

综合使用 `partition` / `rpartition` / `split` 链式解析 URL：

```python
def parse_url(url):
    """将 URL 解析为各组成部分"""
    result = {}
    protocol, _, rest = url.partition("://")
    if _:
        result["protocol"] = protocol
    else:
        rest = protocol
        result["protocol"] = ""

    host_port, _, path = rest.partition("/")
    if _:
        result["path"] = "/" + path
    else:
        host_port = rest
        result["path"] = ""

    host, sep, port = host_port.partition(":")
    result["host"] = host
    result["port"] = port if sep else ""

    path_part, _, query = result["path"].partition("?")
    result["path"] = path_part
    result["params"] = {}
    if _:
        for pair in query.split("&"):
            k, s, v = pair.partition("=")
            if s:
                result["params"][k] = v
            else:
                result["params"][k] = ""
    return result

url = "https://www.example.com:8080/api/v1?id=1&name=alice"
parsed = parse_url(url)
print(f"协议: {parsed['protocol']}")
print(f"主机: {parsed['host']}")
print(f"端口: {parsed['port']}")
print(f"路径: {parsed['path']}")
print(f"参数: {parsed['params']}")

# 输出:
# 协议: https
# 主机: www.example.com
# 端口: 8080
# 路径: /api/v1
# 参数: {'id': '1', 'name': 'alice'}
```

#### 2.5.4 代码行统计工具

综合使用 `splitlines` + `split` 统计 Python 代码行信息：

```python
def analyze_code(code_text):
    """分析 Python 代码行统计信息"""
    lines = code_text.splitlines()
    stats = {
        "总行数": len(lines),
        "代码行": 0,
        "注释行": 0,
        "空行": 0,
        "函数定义": 0,
        "类定义": 0,
    }
    for line in lines:
        stripped = line.strip()
        if not stripped:
            stats["空行"] += 1
        elif stripped.startswith("#"):
            stats["注释行"] += 1
        else:
            stats["代码行"] += 1
            if stripped.startswith("def "):
                stats["函数定义"] += 1
            elif stripped.startswith("class "):
                stats["类定义"] += 1
    return stats

sample_code = """class Calculator:
    def add(self, a, b):
        return a + b

    def subtract(self, a, b):
        # 减法运算
        return a - b

# 使用示例
calc = Calculator()
result = calc.add(10, 5)"""

stats = analyze_code(sample_code)
for key, value in stats.items():
    print(f"  {key}: {value}")

# 输出:
#   总行数: 10
#   代码行: 6
#   注释行: 2
#   空行: 2
#   函数定义: 2
#   类定义: 1
```

#### 2.5.5 四种分割方法对比一览

```python
text = "name=alice&age=30&city=beijing"

print(f"原始: '{text}'")
print()

# split() 不带参数
print(f"split():               {text.split()}")
# ['name=alice&age=30&city=beijing']

# split 指定分隔符
print(f"split('&'):            {text.split('&')}")
# ['name=alice', 'age=30', 'city=beijing']

# rsplit 从右限 1 刀
print(f"rsplit('&', 1):        {text.rsplit('&', 1)}")
# ['name=alice&age=30', 'city=beijing']

# partition 拆第一个 =
before, _, after = text.partition("=")
print(f"partition('='):        ('{before}', '{after}')")
# ('name', 'alice&age=30&city=beijing')

# rpartition 拆最后一个 =
before, _, after = text.rpartition("=")
print(f"rpartition('='):       ('{before}', '{after}')")
# ('name=alice&age=30&city', 'beijing')
```

## 3. 最佳实践

### 3.1 选择正确的分割方法

| 需求 | 推荐方法 | 原因 |
|------|---------|------|
| 按空白拆分（自动合并） | `split()` | 不带参数，连续空白自动合并 |
| 按固定分隔符全量拆分 | `split(sep)` | 简单直接，返回列表 |
| 只拆前 N 段（保留剩余整体） | `split(sep, N)` | `maxsplit` 限制分割次数 |
| 只拆后 N 段 | `rsplit(sep, N)` | 从右限制分割次数 |
| 按行拆分（跨平台安全） | `splitlines()` | 正确处理 `\n`、`\r\n`、`\r` |
| 拆键值对（前后两部分） | `partition(sep)` | 固定返回三元素，不报错 |
| 从右找分隔符拆两部分 | `rpartition(sep)` | 如提取文件扩展名 |
| 多行文本逐行处理 | `splitlines()` | 末尾换行不产生空串 |

### 3.2 推荐 vs 不推荐写法

```python
# ---- 按行分割 ----

# 推荐：splitlines() 跨平台安全
for line in text.splitlines():
    process(line)

# 不推荐：split("\n") 不能处理 \r\n，末尾产生空串
for line in text.split("\n"):
    if line:  # 需要额外过滤空串
        process(line)

# ---- 解析键值对 ----

# 推荐：partition 天然安全，总返回三元素
key, sep, value = line.partition("=")
if sep:
    print(f"{key}={value}")

# 不推荐：split 需要检查列表长度
parts = line.split("=", 1)
if len(parts) == 2:
    key, value = parts
else:
    key = parts[0]
    value = None

# ---- 提取文件扩展名 ----

# 推荐：rsplit(".", 1) 一行搞定
name, ext = "report.tar.gz".rsplit(".", 1)

# 不推荐：split(".") + 取最后一个，不够直观
parts = "report.tar.gz".split(".")
ext = parts[-1]
name = ".".join(parts[:-1])

# ---- 限制分割次数 ----

# 推荐：用 maxsplit 只拆第一刀
key, value = config_line.split("=", 1)

# 不推荐：不用 maxsplit，值中的 = 被错误拆分
key, value = config_line.split("=")  # 如果值中有 = 就多了

# ---- 读取文件行 ----

# 推荐：rstrip 去掉行尾换行
with open("data.txt") as f:
    for line in f:
        line = line.rstrip("\n")
        process(line)

# 也可以：splitlines 统一处理
with open("data.txt") as f:
    for line in f.read().splitlines():
        process(line)

# 不推荐：切片去换行，\r\n 会有残留
for line in f:
    line = line[:-1]  # 如果行尾是 \r\n，\r 会残留
```

### 3.3 综合推荐 vs 不推荐对照表

| 场景 | 推荐写法 | 不推荐写法 | 原因 |
|------|---------|-----------|------|
| 按行拆分 | `text.splitlines()` | `text.split("\n")` | `splitlines` 跨平台安全 |
| 键值对解析 | `s.partition("=")` | `s.split("=", 1)` + 检查长度 | `partition` 天然三元素 |
| 提取扩展名 | `s.rsplit(".", 1)` | `s.split(".")[-1]` | `rsplit` 更直观 |
| 只拆前 N 段 | `s.split(sep, N)` | 全拆后取前 N 个 | `maxsplit` 更高效 |
| 按空白拆分 | `s.split()` | `s.split(" ")` | 不带参数自动合并空白 |
| 文件行处理 | `line.rstrip()` | `line[:-1]` | `rstrip` 安全处理换行 |

### 3.4 常见错误与注意事项

**`split()` 不带参数和 `split(" ")` 完全不同**

```python
text = "  a   b  "

# 不带参数：空白自动合并
print(text.split())
# ['a', 'b']

# 指定空格：每个空格都是独立分隔符
print(text.split(" "))
# ['', '', 'a', '', '', 'b', '', '']
```

**`split("\n")` 不能正确处理 Windows 换行**

```python
# Windows 换行 \r\n
text = "line1\r\nline2"

# split("\n") 会留下 \r
print(text.split("\n"))
# ['line1\r', 'line2']  ← \r 残留

# 用 splitlines() 或 rstrip
print(text.splitlines())
# ['line1', 'line2']
```

**`partition` 分隔符不存在时的方向差异**

```python
text = "no-separator"

# partition: 内容在第一个位置
print(text.partition(","))
# ('no-separator', '', '')

# rpartition: 内容在最后一个位置
print(text.rpartition(","))
# ('', '', 'no-separator')
```

**`split` 的 `maxsplit` 与结果元素数量的关系**

```python
# maxsplit=2 意味着切 2 刀，得到 3 个元素
print("a-b-c-d".split("-", 2))
# ['a', 'b', 'c-d']  ← 3 个元素

# maxsplit 不是"分成几个元素"，而是"切几刀"
# 如果想要 2 个元素，maxsplit 应该设为 1
print("a-b-c-d".split("-", 1))
# ['a', 'b-c-d']  ← 2 个元素
```

## 4. 原理

### 4.1 `split` 的两种模式的底层差异

`split` 不带参数和带参数在 CPython 内部走的是完全不同的代码路径：

```text
split() 不带参数:
  ├─ 调用 split_whitespace() 专用路径
  ├─ 使用 PyUnicode_ISSPACE() 判断空白字符
  ├─ 连续空白自动跳过（循环跳过空白找到下一个非空白起点）
  └─ 首尾空白自动跳过

split(sep) 带参数:
  ├─ 调用 split_char() 或 split() 通用路径
  ├─ 逐个字符与 sep 比较
  ├─ 每个匹配位置都是分割点
  └─ 连续分隔符产生空字符串元素
```

这就解释了为什么两种模式的行为差异如此之大——它们是不同的实现逻辑，而非简单地去掉了"合并空白"的功能。

### 4.2 `splitlines` 的行边界检测

`splitlines` 在 CPython 底层使用 Unicode 标准的行边界检测。Python 的 C 层面有一个 `Py_UNICODE_ISLINEBREAK` 宏来判断一个字符是否是行边界：

```text
被识别为行边界的字符：

  \n   (U+000A) 换行
  \r   (U+000D) 回车
  \r\n        回车+换行（作为一对处理）
  \v   (U+000B) 垂直制表符
  \f   (U+000C) 换页符
  \x1C (U+001C) 文件分隔符
  \x1D (U+001D) 组分隔符
  \x1E (U+001E) 记录分隔符
  \x85 (U+0085) 下一行
  \u2028      行分隔符
  \u2029      段分隔符
```

`\r\n` 被视为一个行边界而非两个——这就是为什么 `"a\r\nb".splitlines()` 返回 `['a', 'b']` 而非 `['a', '', 'b']`。

### 4.3 `partition` 的设计哲学

`partition` 在 Python 2.5 中引入（PEP 358），设计目标是为"键值对解析"这类场景提供一种比 `split` 更安全的方式。

`split` 的核心问题在于返回值类型——它返回列表，列表长度可变。调用者必须检查 `len(result)` 来确定分割是否成功：

```python
# split 方式：需要检查列表长度
parts = "key=value".split("=", 1)
# parts 可能是 ['key', 'value']（长度 2）
# 也可能是 ['novalue']（长度 1），需要 if len(parts) == 2 来判断
```

`partition` 通过固定返回三元组解决了这个问题——无论分隔符是否存在，总是返回三个元素：

```python
# partition 方式：总返回三个元素，解包天然安全
before, sep, after = "key=value".partition("=")
# before='key', sep='=', after='value'

before, sep, after = "novalue".partition("=")
# before='novalue', sep='', after=''
# 通过 sep 是否为空即可判断是否分割成功
```

这种设计让代码更简洁、更不易出错——尤其在链式解析（如 URL）时，每一步解包都不需要条件检查。

### 4.4 `maxsplit` 的工作原理

`maxsplit` 在底层控制的是"分割计数器"——每次找到分隔符并完成一次分割后，计数器递减。当计数器归零时，剩余部分不再扫描，直接作为最后一个元素：

```text
split("-", 2) 处理 "a-b-c-d-e" 的过程：

  扫描到 '-' (位置 1) → 分割: ['a']  计数: 1/2
  扫描到 '-' (位置 3) → 分割: ['a', 'b']  计数: 2/2
  计数归零 → 剩余 "c-d-e" 作为最后一个元素
  结果: ['a', 'b', 'c-d-e']
```

`rsplit` 的 `maxsplit` 逻辑相同，但扫描方向从右向左——先定位最后一个分隔符，再往左找倒数第二个，以此类推。

## 5. 总结

本文围绕 Python 字符串的分割方法展开，主要介绍了以下内容：

- **`split()` 方法**：不带参数时按任意空白字符分割（连续空白自动合并、首尾空白忽略）；指定 `sep` 时按分隔符逐个分割（连续分隔符产生空串）；`maxsplit` 参数控制最大分割次数（切几刀就多一个元素）
- **`rsplit()` 方法**：不带 `maxsplit` 时与 `split` 完全相同；带 `maxsplit` 时从右向左计数，适合从右提取少量元素（如文件扩展名、顶级域名）
- **`splitlines()` 方法**：按通用换行符分割，正确处理 `\n`、`\r\n`、`\r` 及 Unicode 行分隔符；末尾换行不产生空串；`keepends=True` 可保留换行符用于精确重组
- **`partition()` / `rpartition()` 方法**：固定返回三元素三元组，分隔符不存在时不报错（`partition` 内容在第一个位置，`rpartition` 在最后一个）；比 `split` + 长度检查更安全，适合键值对解析和链式结构化文本解析
- **最佳实践**：按行拆分用 `splitlines`，键值对解析用 `partition`，提取后缀用 `rsplit`，限制分割次数用 `maxsplit`，按空白拆分用不带参数的 `split()`
- **底层原理**：`split` 不带参数和带参数走不同的 CPython 代码路径；`splitlines` 使用 Unicode 行边界检测；`partition` 通过固定三元素返回值设计解决了 `split` 返回列表长度不确定的安全性问题
