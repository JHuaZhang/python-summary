---
group:
  title: 【11】文件与路径操作
  order: 11
order: 5
title: os模块基础操作
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 os 模块

`os` 是 Python 标准库中最核心的模块之一，它提供了一组**与操作系统交互**的函数。名字 "os" 就是 "operating system"（操作系统）的缩写。当你需要创建目录、删除文件、列出文件夹内容、获取文件大小、判断路径是否存在、切换工作目录时，都要用到 `os` 模块。

`os` 模块与《open 函数与 mode 参数》中讲到的 `open()` 的区别在于：`open()` 负责**读写文件内容**（把文件当作数据流来处理），而 `os` 模块负责**管理文件和目录本身**（把文件和目录当作文件系统中的对象来操作）。也就是说，`open()` 回答的是"这个文件里写了什么"，`os` 回答的是"这个文件在哪里、有多大、是不是目录、能不能删除"。

```python
import os

# 最小示例：判断文件是否存在，再获取大小
path = "/Users/demo/test.txt"
if os.path.exists(path):
    print(f"文件大小: {os.path.getsize(path)} 字节")
else:
    print("文件不存在")
# 输出：文件不存在（假设该路径不存在）
```

`os` 模块的设计哲学是"薄封装"——它把操作系统的系统调用（system call）直接暴露给 Python，所以不同操作系统上同一个函数的行为可能略有差异。例如路径分隔符在 Windows 上是 `\`、在 Linux/macOS 上是 `/`，`os` 模块通过 `os.sep` 和 `os.path` 子模块把这些差异封装成统一接口。这是 `os` 模块最重要的设计理念，也是本篇会反复强调的核心。

`os` 模块功能庞杂，涵盖文件系统、进程管理、环境变量、用户权限等多个领域。本篇聚焦**文件与目录操作**这条主线，即 `os.path`（路径处理）、`os.mkdir`/`os.listdir`/`os.remove` 等目录文件操作函数。`os.walk` 递归遍历因内容较多，留到下一篇《os.walk 递归遍历目录》单独讲解；环境变量、进程管理只做轻量提及。

### 1.2 os 模块的基本用法

要使用 `os` 模块，第一步永远是导入它：

```python
import os
```

导入后，你会接触到两个层面：

- **`os` 模块本身的函数**：如 `os.getcwd()`（当前工作目录）、`os.mkdir()`（创建目录）、`os.listdir()`（列出目录内容）、`os.remove()`（删除文件）。
- **`os.path` 子模块**：专门处理路径字符串，如 `os.path.join()`（拼接路径）、`os.path.exists()`（判断路径是否存在）、`os.path.basename()`（取文件名）。

```python
import os

# os 模块本身的函数
print(os.getcwd())              # 获取当前工作目录
# 输出：/Users/demo/project（取决于你运行代码的位置）

# os.path 子模块：处理路径字符串
filename = os.path.basename("/Users/demo/test.txt")
print(filename)                 # 输出：test.txt
```

**关键区分**：`os` 模块的操作大多会**真正改动文件系统**（创建、删除、重命名），而 `os.path` 的操作大多只是**字符串处理**（拼接、拆分、判断），不会触碰磁盘。理解这一点很重要——`os.path.join("a", "b")` 只是拼出一个字符串 `"a/b"`，并不会在磁盘上创建任何东西。

**最小的真实场景**：下面这段代码展示了 `os` 模块的典型使用流程——先检查目录是否存在，不存在则创建，再拼接路径写文件。

```python
import os

# 场景：确保日志目录存在，再写日志文件
log_dir = "/tmp/myapp/logs"
if not os.path.exists(log_dir):
    os.makedirs(log_dir)        # 递归创建目录（含父目录）
    print(f"已创建目录: {log_dir}")

log_path = os.path.join(log_dir, "app.log")  # 拼接路径，跨平台安全
with open(log_path, "w") as f:
    f.write("服务启动\n")
print(f"日志已写入: {log_path}")
# 输出：
# 已创建目录: /tmp/myapp/logs
# 日志已写入: /tmp/myapp/logs/app.log
```

这段代码用到了 `os.path.exists`（判断）、`os.makedirs`（创建）、`os.path.join`（拼接）三个最常用的函数，它们是 `os` 模块日常使用的基石，后续会逐一详解。

---

## 2. 核心内容

本章按功能分四条线展开：路径操作（`os.path`）、目录操作、文件操作、文件信息与权限。每条线内的函数逐一讲解，配合场景化 demo，并点明易混函数的区别。

### 2.1 路径分隔符与跨平台基础：os.sep、os.altsep、os.linesep

在讲 `os.path.join` 之前，先理解 `os` 模块中的几个分隔符常量。它们是跨平台路径处理的根基。

**`os.sep`**：当前操作系统的路径分隔符。Windows 上是 `\\`（反斜杠），Linux/macOS 上是 `/`（正斜杠）。

```python
import os
print(os.sep)
# Windows 输出：\
# Linux/macOS 输出：/
```

**`os.altsep`**：备选路径分隔符。Windows 上是 `/`（因为 Windows 也接受正斜杠），Linux/macOS 上是 `None`（只有一种分隔符）。

```python
import os
print(os.altsep)
# Windows 输出：/
# Linux/macOS 输出：None
```

**`os.linesep`**：当前操作系统的行分隔符。Windows 用 `\r\n`，Linux/macOS 用 `\n`。

```python
import os
print(repr(os.linesep))
# Windows 输出：'\r\n'
# Linux/macOS 输出：'\n'
```

**为什么强调跨平台**：如果你在 Windows 上硬编码 `"C:\\Users\\demo\\test.txt"`，这段代码拿到 Linux 上就跑不了。反过来，在 Linux 上写 `"/tmp/test.txt"` 在 Windows 上也不对。`os.sep` 让你能写出不依赖特定平台的代码。但实际开发中，更推荐用 `os.path.join()` 来拼接路径（见 §2.2），而不是手动用 `os.sep` 拼，因为前者更简洁且处理了更多边界情况。

```python
import os
# 不推荐：手动拼分隔符，容易漏或多
path = "mydir" + os.sep + "file.txt"     # 能用但啰嗦

# 推荐：用 os.path.join
path = os.path.join("mydir", "file.txt")  # 简洁、跨平台
print(path)
# Windows 输出：mydir\file.txt
# Linux/macOS 输出：mydir/file.txt
```

### 2.2 os.path.join：跨平台路径拼接

`os.path.join(*path_segments)` 把多个路径片段拼成一个完整路径，自动插入正确的分隔符。它是日常路径拼接的首选函数。

**签名**：`os.path.join(path1, path2, ..., pathN)`

**参数**：接受任意多个字符串参数，每个是一段路径。

**返回**：拼接后的路径字符串。

**关键规则**：如果某个参数是**绝对路径**（以分隔符开头，或 Windows 上以盘符开头如 `C:\`），则该参数之前的所有拼接结果会被**丢弃**，从该绝对路径重新开始拼接。

```python
import os

# 基本拼接：自动插入分隔符
p1 = os.path.join("/home", "demo", "file.txt")
print(p1)
# Linux/macOS 输出：/home/demo/file.txt

# 如果中间段是绝对路径，之前的部分被丢弃
p2 = os.path.join("/home", "/demo", "file.txt")
print(p2)
# Linux/macOS 输出：/demo/file.txt（/demo 是绝对路径，/home 被丢弃）

# Windows 盘符的绝对路径
p3 = os.path.join("C:\\Users", "demo", "file.txt")
print(p3)
# Windows 输出：C:\Users\demo\file.txt
```

**这里要特别说明"绝对路径丢弃前面段"的规则**：这不是 bug，是有意设计。`os.path.join` 假设传入的每段是"相对路径片段"，当遇到绝对路径时，意味着用户想从一个全新的起点开始构造路径，之前累积的片段就无意义了。

**典型场景**：构造日志目录、缓存目录、配置文件路径。

```python
import os

# 场景：根据项目根目录，构造各子目录路径
project_root = "/opt/myapp"
log_dir = os.path.join(project_root, "logs")        # /opt/myapp/logs
cache_dir = os.path.join(project_root, "cache")     # /opt/myapp/cache
config_path = os.path.join(project_root, "conf", "app.cfg")  # /opt/myapp/conf/app.cfg
print(log_dir)
print(cache_dir)
print(config_path)
# 输出：
# /opt/myapp/logs
# /opt/myapp/cache
# /opt/myapp/conf/app.cfg
```

**为什么不推荐直接字符串拼接 `+`**：因为容易在拼接处多出或少分隔符。

```python
import os
# 不推荐：手写拼接，易出错
dir_path = "/opt/myapp/"
file_path = dir_path + "/file.txt"   # 多了一个 /，变成 /opt/myapp//file.txt
print(file_path)
# 输出：/opt/myapp//file.txt（虽多数系统容忍，但不规范）

# 推荐：os.path.join 自动处理分隔符
file_path = os.path.join("/opt/myapp/", "file.txt")  # /opt/myapp/file.txt
print(file_path)
# 输出：/opt/myapp/file.txt
```

### 2.3 os.path.exists 与 os.path.lexists：判断路径是否存在

`os.path.exists(path)` 判断路径（文件或目录）是否存在，存在返回 `True`，不存在返回 `False`。

**签名**：`os.path.exists(path)` -> `bool`

```python
import os

# 判断文件是否存在，再决定是否读取
config_path = "/etc/myapp.conf"
if os.path.exists(config_path):
    print("配置文件存在，开始读取")
else:
    print("配置文件不存在，使用默认配置")
# 输出（假设文件不存在）：配置文件不存在，使用默认配置
```

**`os.path.lexists` 与 `exists` 的区别**：当路径是一个**符号链接**（symbolic link）时，`exists` 会跟随链接检查目标是否存在；如果链接指向的目标已失效（悬空链接），`exists` 返回 `False`。而 `lexists` 只检查链接本身是否存在，不管目标是否有效，只要链接文件在就返回 `True`。

```python
import os

# 假设 /tmp/broken_link 是一个指向已删除文件的符号链接
# os.path.exists("/tmp/broken_link")   # False（跟随链接，目标不存在）
# os.path.lexists("/tmp/broken_link")  # True（链接本身存在）

# 正常链接
# os.path.exists("/tmp/normal_link")   # True（跟随链接，目标存在）
# os.path.lexists("/tmp/normal_link")  # True
```

日常大多数场景用 `os.path.exists` 就够了，只有在需要检测"链接本身"是否存在时才用 `os.path.lexists`。

### 2.4 os.path.isfile 与 os.path.isdir：判断类型

`os.path.isfile(path)` 判断路径是否为一个**已存在的文件**；`os.path.isdir(path)` 判断路径是否为一个**已存在的目录**。两者都要求路径存在，不存在则返回 `False`。

```python
import os

p = "/Users/demo"
print(os.path.isfile(p))   # False（demo 是目录）
print(os.path.isdir(p))    # True（demo 是目录）

p2 = "/Users/demo/test.txt"
if os.path.exists(p2):
    print(os.path.isfile(p2))  # True（如果存在且是文件）
```

**`isfile`/`isdir` 与 `exists` 的配合**：`exists` 只告诉你"路径存在"，但不区分是文件还是目录。如果你需要"存在且是文件"就用 `isfile`，需要"存在且是目录"就用 `isdir`。两者内部都隐含了 exists 检查，所以不需要写 `if os.path.exists(p) and os.path.isfile(p)`，直接 `if os.path.isfile(p)` 即可。

```python
import os

# 场景：删除文件前确认是文件不是目录
target = "/tmp/some_path"
if os.path.isfile(target):
    os.remove(target)          # 是文件，可以删
    print(f"已删除文件: {target}")
elif os.path.isdir(target):
    print(f"{target} 是目录，不能用 os.remove 删除")
else:
    print(f"{target} 不存在")
```

**注意符号链接**：`isfile` 和 `isdir` 会跟随符号链接。一个指向文件的链接，`isfile` 返回 `True`；一个指向目录的链接，`isdir` 返回 `True`。如果想判断链接本身（不跟随），用 `os.path.islink`。

```python
import os
# os.path.islink("/tmp/normal_link")  # True（是符号链接）
# os.path.isfile("/tmp/normal_link")  # 取决于指向的目标
```

### 2.5 os.path.abspath：转绝对路径

`os.path.abspath(path)` 把一个相对路径转换为**绝对路径**。如果传入的已经是绝对路径，则原样返回（会规范化大小写等，但不会解析符号链接）。

**签名**：`os.path.abspath(path)` -> `str`

**关键点**：转换基准是**当前工作目录**（`os.getcwd()` 的返回值）。所以同一个相对路径在不同工作目录下，`abspath` 的结果不同。

```python
import os

# 当前工作目录是 /Users/demo/project
print(os.getcwd())                      # /Users/demo/project
print(os.path.abspath("data.txt"))      # /Users/demo/project/data.txt
print(os.path.abspath("./config/app.cfg"))  # /Users/demo/project/config/app.cfg
print(os.path.abspath("/etc/hosts"))    # /etc/hosts（已是绝对路径，原样返回）
```

**`abspath` 不会解析符号链接，也不会验证路径是否存在**：它只是字符串层面的转换，把相对路径加上当前工作目录前缀。如果要解析符号链接得到真实物理路径，用 `os.path.realpath`。

```python
import os

# abspath 不验证路径是否存在
print(os.path.abspath("not_exist.txt"))  # /Users/demo/project/not_exist.txt（哪怕文件不存在也返回）
# 它只做了: 当前目录 + "/" + 传入路径 的字符串拼接
```

**典型场景**：日志记录、配置中用相对路径，运行时转绝对路径便于排错。

```python
import os

# 场景：配置里写相对路径，运行时记录绝对路径方便排查
log_file = "logs/app.log"
abs_log = os.path.abspath(log_file)
print(f"日志写入位置: {abs_log}")
# 输出：日志写入位置: /Users/demo/project/logs/app.log
```

### 2.6 os.path.realpath 与 os.path.abspath 对比

`os.path.realpath(path)` 返回路径的**规范绝对路径**，不仅转成绝对路径，还会解析路径中的所有符号链接，并处理 `.`（当前目录）和 `..`（上级目录）。

**`abspath` vs `realpath` 对比**：

| 特性          | `os.path.abspath`           | `os.path.realpath`           |
| ------------- | --------------------------- | ---------------------------- |
| 转绝对路径    | 是                          | 是                           |
| 解析符号链接  | 否                          | 是                           |
| 处理 `.`/`..` | 处理 `.`/`..`（normalizes） | 处理 `.`/`..`                |
| 验证路径存在  | 否                          | 否（但不存在的部分原样保留） |

```python
import os

# 假设 /tmp/link 是一个指向 /var/data 的符号链接
# os.path.abspath("/tmp/link/file.txt")   # /tmp/link/file.txt（不解析链接）
# os.path.realpath("/tmp/link/file.txt")  # /var/data/file.txt（解析链接）
```

日常大多数场景 `abspath` 够用；只有在需要穿透符号链接拿到真实物理路径时才用 `realpath`，比如排查"这个文件到底在哪个物理目录"。

### 2.7 os.path.split 与 os.path.splitext：拆分路径（易混点）

这两个函数都做拆分，但拆分的维度不同，是新手最易混淆的一对。

**`os.path.split(path)`**：把路径拆成 `(目录部分, 文件名部分)` 的元组。它在最后一个分隔符处切开——分隔符之前是目录，之后是文件名。

```python
import os

p = "/home/demo/test.txt"
print(os.path.split(p))   # ('/home/demo', 'test.txt')

p2 = "/home/demo/"
print(os.path.split(p2))  # ('/home/demo', '')（末尾分隔符，文件名为空）

p3 = "test.txt"
print(os.path.split(p3))  # ('', 'test.txt')（无目录部分）
```

**`os.path.splitext(path)`**：把路径拆成 `(主名, 扩展名)` 的元组。它在最后一个 `.` 处切开——`.txt` 这种扩展名会被分离出来。

```python
import os

p = "/home/demo/test.txt"
print(os.path.splitext(p))   # ('/home/demo/test', '.txt')

p2 = "/home/demo/archive.tar.gz"
print(os.path.splitext(p2))  # ('/home/demo/archive.tar', '.gz')（只切最后一个点）

p3 = "/home/demo/Makefile"
print(os.path.splitext(p3))  # ('/home/demo/Makefile', '')（无扩展名）
```

**两者的区别一句话总结**：

- `os.path.split` 切的是**目录与文件名**（按路径分隔符切）。
- `os.path.splitext` 切的是**主名与扩展名**（按 `.` 切）。

**示例对照**：

```python
import os
p = "/data/report/2024_q1.csv"

# split：拆目录和文件名
dir_part, file_part = os.path.split(p)
print(f"目录: {dir_part}, 文件名: {file_part}")
# 输出：目录: /data/report, 文件名: 2024_q1.csv

# splitext：拆主名和扩展名
name_part, ext_part = os.path.splitext(p)
print(f"主名: {name_part}, 扩展名: {ext_part}")
# 输出：主名: /data/report/2024_q1, 扩展名: .csv
```

**结合使用**：拿到一个文件路径，先 split 出文件名，再 splitext 出扩展名，是文件处理的常见流程。

```python
import os

p = "/data/report/2024_q1.csv"
filename = os.path.split(p)[1]        # 2024_q1.csv
name, ext = os.path.splitext(filename)  # ('2024_q1', '.csv')
print(f"文件名: {filename}, 纯名: {name}, 后缀: {ext}")
# 输出：文件名: 2024_q1.csv, 纯名: 2024_q1, 后缀: .csv
```

### 2.8 os.path.basename 与 os.path.dirname：取文件名和目录名

`os.path.basename(path)` 返回路径的**文件名部分**（split 的第二个元素）；`os.path.dirname(path)` 返回路径的**目录部分**（split 的第一个元素）。它们就是 `os.path.split` 的拆开版本，方便只取一半的场景。

```python
import os

p = "/home/demo/test.txt"
print(os.path.basename(p))   # test.txt
print(os.path.dirname(p))    # /home/demo

p2 = "/home/demo/"           # 末尾有分隔符
print(os.path.basename(p2))  # ''（末尾分隔符后无文件名）
print(os.path.dirname(p2))   # /home/demo

p3 = "test.txt"              # 纯文件名
print(os.path.basename(p3))  # test.txt
print(os.path.dirname(p3))   # ''（无目录部分）
```

**何时用 `basename`/`dirname` 而不是 `split`**：当你只需要一半时，用 `basename`/`dirname` 更直观表达意图。`split` 适合"两个都要"的场景。

```python
import os

# 场景一：只取文件名
log_files = ["/var/log/app.log", "/var/log/error.log", "/var/log/debug.log"]
for f in log_files:
    print(os.path.basename(f))      # 只关心文件名
# 输出：app.log / error.log / debug.log

# 场景二：只取目录名
file_path = "/data/config/app.conf"
target_dir = os.path.dirname(file_path)
print(f"需要先创建目录: {target_dir}")
# 输出：需要先创建目录: /data/config

# 场景三：两者都要
dir_part, file_part = os.path.split(file_path)
print(f"目录: {dir_part}, 文件: {file_part}")
# 输出：目录: /data/config, 文件: app.conf
```

### 2.9 os.path.getsize：获取文件大小

`os.path.getsize(path)` 返回文件的**字节大小**（int）。只对文件有效，对目录会返回目录项本身的大小（不是目录内容的总大小，目录大小依赖文件系统实现，通常很小）。

```python
import os

size = os.path.getsize("/etc/hosts")
print(f"hosts 文件大小: {size} 字节")
# 输出（示例）：hosts 文件大小: 312 字节

# 转成 KB/MB 便于阅读
size_kb = size / 1024
print(f"{size_kb:.2f} KB")
# 输出：0.30 KB
```

**场景：扫描目录统计文件总大小**

```python
import os

dir_path = "/var/log"
total = 0
for name in os.listdir(dir_path):
    full = os.path.join(dir_path, name)
    if os.path.isfile(full):      # 只统计文件，跳过子目录
        total += os.path.getsize(full)
print(f"日志目录文件总大小: {total / 1024 / 1024:.2f} MB")
# 输出（示例）：日志目录文件总大小: 45.20 MB
```

**注意**：`getsize` 要求文件存在，否则抛 `FileNotFoundError`。对大小敏感的操作要先判断存在性，或用 try/except 处理。

```python
import os

path = "/tmp/maybe_exist.txt"
if os.path.exists(path):
    print(os.path.getsize(path))
else:
    print("文件不存在，无法获取大小")
```

### 2.10 os.getcwd 与 os.chdir：工作目录

`os.getcwd()` 返回当前工作目录（Current Working Directory）的绝对路径字符串。`os.chdir(path)` 切换当前工作目录到 `path`。

```python
import os

print(os.getcwd())             # 获取当前工作目录
# 输出（示例）：/Users/demo/project

os.chdir("/tmp")               # 切换到 /tmp
print(os.getcwd())             # 输出：/tmp

os.chdir("/var/log")           # 切换到 /var/log
print(os.getcwd())             # 输出：/var/log
```

**工作目录的意义**：所有相对路径都是基于工作目录解析的。`open("data.txt")` 读的是 `os.getcwd()/data.txt`，`os.path.abspath("data.txt")` 也是基于 `os.getcwd()`。

```python
import os

os.chdir("/tmp")
with open("test_cwd.txt", "w") as f:   # 写到 /tmp/test_cwd.txt
    f.write("hello")
print(os.path.abspath("test_cwd.txt"))  # /tmp/test_cwd.txt
```

**场景：临时切换到某目录执行操作后再切回**

```python
import os

original_dir = os.getcwd()      # 保存原工作目录
try:
    os.chdir("/data/build")     # 切换到构建目录
    # 在该目录下执行操作，相对路径都基于 /data/build
    for name in os.listdir("."):  # "." 表示当前目录
        print(name)
finally:
    os.chdir(original_dir)      # 无论是否异常，都切回原目录
    print(f"已切回: {os.getcwd()}")
```

**`os.chdir` 要求目标目录存在且可访问**，不存在会抛 `FileNotFoundError`，无权限抛 `PermissionError`。用 `try/finally` 保证切回原目录，避免工作目录被"遗弃"在临时位置影响后续逻辑。

### 2.11 os.mkdir 与 os.makedirs：创建目录（易混点）

这是另一对新手极易混淆的函数：

**`os.mkdir(path, mode=0o777)`**：创建**单层**目录。如果父目录不存在，会抛 `FileNotFoundError`。如果目录已存在，抛 `FileExistsError`。

**`os.makedirs(path, mode=0o777, exist_ok=False)`**：**递归**创建多层目录，会自动创建路径中所有还不存在的父目录。

```python
import os

# 单层目录：父目录 /tmp 已存在，OK
os.mkdir("/tmp/single_dir")
print("单层目录创建成功")

# 单层目录：父目录不存在，报错
# os.mkdir("/tmp/not_exist_parent/sub_dir")
# FileNotFoundError: [Errno 2] No such file or directory: '/tmp/not_exist_parent/sub_dir'

# 递归目录：自动创建所有缺失的父目录
os.makedirs("/tmp/parent/child/grandchild")
print("递归目录创建成功")
```

**两者的区别一句话**：`mkdir` 只能创建一层（要求父目录必须已存在），`makedirs` 能一次创建多层（自动补齐父目录）。

**对照表**：

| 场景                       | `os.mkdir` | `os.makedirs`                |
| -------------------------- | ---------- | ---------------------------- |
| 创建单层目录，父目录已存在 | 成功       | 成功                         |
| 创建单层目录，父目录不存在 | 报错       | 成功（自动创建父目录）       |
| 创建多层嵌套目录           | 要多次调用 | 一次调用搞定                 |
| 目录已存在                 | 报错       | 报错（除非 `exist_ok=True`） |

**`exist_ok` 参数**：`makedirs` 特有的参数，默认 `False`（目录已存在则报错）。设为 `True` 时，目录已存在也不报错，直接跳过。

```python
import os

# exist_ok=False（默认）：目录已存在会报错
os.makedirs("/tmp/mydir")
# os.makedirs("/tmp/mydir")  # 再次创建：FileExistsError

# exist_ok=True：目录已存在也不报错，幂等创建
os.makedirs("/tmp/mydir", exist_ok=True)   # 不报错
os.makedirs("/tmp/mydir", exist_ok=True)   # 再调也不报错
print("幂等创建成功")
```

**典型场景**：脚本启动时确保必要目录存在。用 `makedirs(exist_ok=True)` 是最简洁的写法——一行搞定"不存在就创建，存在就跳过"。

```python
import os

# 场景：确保应用的各类目录存在
dirs = ["logs", "cache", "data/raw", "data/processed", "conf"]
for d in dirs:
    os.makedirs(d, exist_ok=True)   # 幂等创建，无论是否存在都不报错
    print(f"目录就绪: {d}")
# 输出：
# 目录就绪: logs
# 目录就绪: cache
# 目录就绪: data/raw
# 目录就绪: data/processed
# 目录就绪: conf
```

**`mode` 参数**：设置目录权限（八进制，如 `0o755`）。注意 `mode` 受到当前进程的 umask 影响——实际权限是 `mode & ~umask`。所以即使你传 `0o777`，实际创建的目录权限通常也是 `0o755`（因默认 umask 是 `0o022`）。这个细节在 §4 原理中简述。

### 2.12 os.rmdir 与 os.removedirs：删除目录（易混点）

与创建对应，删除也有一对：

**`os.rmdir(path)`**：删除**单层**目录。只在该目录为空时才能删除，非空会抛 `OSError`（目录不为空）。

**`os.removedirs(path)`**：**递归**删除目录。从最深层开始删，删完一层后如果父目录也空了，就继续删父目录，直到某层非空或已删到根。

```python
import os

# 单层删除：目录必须为空
os.mkdir("/tmp/empty_dir")
os.rmdir("/tmp/empty_dir")
print("空目录删除成功")

# 目录非空，报错
# os.mkdir("/tmp/non_empty")
# open("/tmp/non_empty/file.txt", "w").close()  # 往里放个文件
# os.rmdir("/tmp/non_empty")
# OSError: [Errno 39] Directory not empty: '/tmp/non_empty'

# 递归删除：删完子目录后，如果父目录也空了，继续删
os.makedirs("/tmp/a/b/c")          # 创建 /tmp/a/b/c
os.removedirs("/tmp/a/b/c")        # 删 c，然后 b 空，删 b，然后 a 空，删 a
print("递归删除成功")
```

**两者的区别**：

| 场景                     | `os.rmdir` | `os.removedirs`    |
| ------------------------ | ---------- | ------------------ |
| 删除单个空目录           | 成功       | 成功               |
| 删除空目录后是否删父目录 | 否         | 是（若父目录也空） |
| 目录非空                 | 报错       | 报错               |

**重要提醒**：`os.removedirs` 只删**空目录**，不是删目录及其内容。如果目录里有文件，要先删文件再删目录。要一键删除非空目录树，用 `shutil.rmtree`（标准库另一个模块），而不是在 `os` 里找。

```python
import os
import shutil

# 删除非空目录树：用 shutil.rmtree
# shutil.rmtree("/tmp/non_empty_tree")  # 连同里面所有文件子目录一起删
```

### 2.13 os.listdir：列出目录内容

`os.listdir(path='.')` 返回目录中所有条目的名字列表。返回的是**文件名/目录名字符串列表**，不是完整路径。不保证顺序，且不包含 `.` 和 `..` 这两个特殊条目。

**签名**：`os.listdir(path='.')` -> `list[str]`

```python
import os

entries = os.listdir("/tmp")
print(entries[:5])   # 看前 5 个（输出顺序不保证）
# 输出（示例）：['some_file', 'another_dir', '.hidden', ...]

print(len(entries))  # 总条目数
# 输出（示例）：42
```

**注意返回的是名字，不是路径**：`os.listdir("/tmp")` 返回 `["file.txt", "sub", ...]`，不是 `["/tmp/file.txt", "/tmp/sub", ...]`。要拿到完整路径，需手动 `os.path.join`。

```python
import os

# 场景：列出目录并构造完整路径
dir_path = "/var/log"
for name in os.listdir(dir_path):
    full_path = os.path.join(dir_path, name)   # 拼成完整路径
    if os.path.isfile(full_path):
        print(f"文件: {name}")
    elif os.path.isdir(full_path):
        print(f"目录: {name}")
# 输出（示例）：
# 文件: app.log
# 文件: error.log
# 目录: archive
```

**只列出文件或只列出目录**：

```python
import os

dir_path = "/var/log"
all_entries = os.listdir(dir_path)

files = [e for e in all_entries if os.path.isfile(os.path.join(dir_path, e))]
dirs = [e for e in all_entries if os.path.isdir(os.path.join(dir_path, e))]
print(f"文件: {files}")
print(f"目录: {dirs}")
# 输出（示例）：
# 文件: ['app.log', 'error.log', 'debug.log']
# 目录: ['archive', 'old']
```

**按扩展名过滤**：

```python
import os

# 场景：只列出所有 .log 文件
dir_path = "/var/log"
log_files = [
    e for e in os.listdir(dir_path)
    if e.endswith(".log") and os.path.isfile(os.path.join(dir_path, e))
]
print(f"日志文件: {log_files}")
# 输出（示例）：日志文件: ['app.log', 'error.log', 'debug.log']
```

**`.endswith` 与 `os.path.splitext` 的选择**：判断扩展名可以用字符串的 `.endswith(".log")` 或 `os.path.splitext(e)[1] == ".log"`。最简单的是 `pathlib` 模块的 `.suffix`（见《pathlib 面向对象路径》），`os` 场景下 `.endswith` 足够。

### 2.14 os.rename：重命名与移动

`os.rename(src, dst)` 把文件或目录从 `src` 重命名为 `dst`。在同一个文件系统内，重命名是原子操作（要么成功要么不变）。跨文件系统时可能报错（不同系统行为不同）。

**签名**：`os.rename(src, dst)`

```python
import os

# 重命名文件
with open("/tmp/old.txt", "w") as f:
    f.write("hello")
os.rename("/tmp/old.txt", "/tmp/new.txt")
print(os.path.exists("/tmp/old.txt"))   # False
print(os.path.exists("/tmp/new.txt"))   # True
```

**重命名目录**：

```python
import os

os.makedirs("/tmp/old_dir/sub")
os.rename("/tmp/old_dir", "/tmp/new_dir")
print(os.path.isdir("/tmp/new_dir/sub"))  # True（整个目录树都过来了）
```

**`os.rename` 的行为差异**：

- 在 Unix/Linux/macOS 上：如果 `dst` 已存在且是文件，会被**覆盖**；如果是目录且非空，报错。
- 在 Windows 上：如果 `dst` 已存在，**报错**（不会覆盖）。

跨平台代码要谨慎处理 `dst` 已存在的情况。Python 3.3+ 提供了 `os.replace(src, dst)`，它在所有平台上都会替换已存在的目标（跨平台一致的覆盖语义），需要覆盖语义时优先用 `os.replace`。

```python
import os

# 跨平台一致的覆盖语义：用 os.replace
with open("/tmp/dst.txt", "w") as f:
    f.write("旧内容")
with open("/tmp/src.txt", "w") as f:
    f.write("新内容")
os.replace("/tmp/src.txt", "/tmp/dst.txt")   # 覆盖 dst.txt
with open("/tmp/dst.txt") as f:
    print(f.read())   # 输出：新内容
```

### 2.15 os.remove：删除文件

`os.remove(path)` 删除一个**文件**。只能删文件，不能删目录（删目录用 `os.rmdir` 或 `os.removedirs`）。

**签名**：`os.remove(path)`

```python
import os

# 创建再删除
with open("/tmp/trash.txt", "w") as f:
    f.write("to be deleted")
os.remove("/tmp/trash.txt")
print(os.path.exists("/tmp/trash.txt"))   # False
```

**对目录使用 `os.remove` 会报错**：

```python
import os

os.mkdir("/tmp/a_dir")
# os.remove("/tmp/a_dir")
# IsADirectoryError: [Errno 21] Is a directory: '/tmp/a_dir'
# 删目录要用 os.rmdir
```

**`os.remove` 和 `os.unlink` 完全等价**：两者是同一个函数的不同名字，功能一模一样，用哪个都可以。`unlink` 是 Unix 传统叫法（"解除链接"，文件系统术语），`remove` 更通俗易懂。推荐用 `os.remove`，名字更直白。

**场景：清理一批临时文件**

```python
import os

# 场景：清理 /tmp 下所有 .tmp 临时文件
tmp_dir = "/tmp"
removed = 0
for name in os.listdir(tmp_dir):
    if name.endswith(".tmp"):
        full_path = os.path.join(tmp_dir, name)
        if os.path.isfile(full_path):
            os.remove(full_path)
            removed += 1
print(f"清理了 {removed} 个临时文件")
# 输出（示例）：清理了 12 个临时文件
```

### 2.16 os.stat：获取文件详细信息

`os.stat(path)` 返回一个 `os.stat_result` 对象，包含文件的丰富元信息：大小、权限、时间戳、inode 等。当 `os.path.getsize` 不够用、需要更多信息时，用 `os.stat`。

**签名**：`os.stat(path, *, dir_fd=None, follow_symlinks=True)` -> `os.stat_result`

```python
import os

info = os.stat("/etc/hosts")
print(type(info))          # <class 'os.stat_result'>
print(info.st_size)        # 文件大小（字节），等价于 os.path.getsize
print(info.st_mode)        # 文件类型和权限（八进制）
print(info.st_mtime)       # 最后修改时间（时间戳，秒）
print(info.st_atime)       # 最后访问时间（时间戳，秒）
print(info.st_ctime)       # 创建时间(Windows)/最后元数据修改时间(Unix)
print(info.st_ino)         # inode 号（Unix）
print(info.st_uid)         # 所有者用户 ID（Unix）
print(info.st_gid)         # 所属组 ID（Unix）
# 输出（示例，数值取决于实际文件）：
# <class 'os.stat_result'>
# 312
# 33188
# 1689876543.0
# 1690000000.0
# 16777216.0
# 1234567
# 0
# 0
```

**常用字段表**：

| 字段       | 含义                                      |
| ---------- | ----------------------------------------- |
| `st_size`  | 文件大小（字节）                          |
| `st_mode`  | 文件类型和权限位                          |
| `st_mtime` | 最后修改时间（时间戳，秒）                |
| `st_atime` | 最后访问时间（时间戳，秒）                |
| `st_ctime` | Windows:创建时间; Unix:元数据最后修改时间 |
| `st_ino`   | inode 号(Unix)或文件索引(Windows)         |
| `st_uid`   | 所有者用户 ID(Unix)                       |
| `st_gid`   | 所属组 ID(Unix)                           |
| `st_nlink` | 硬链接数                                  |

**时间戳解读**：`st_mtime`/`st_atime`/`st_ctime` 都是**浮点秒数时间戳**（从 1970-01-01 00:00:00 UTC 起）。要转成可读时间用 `time.localtime` 或 `datetime.datetime.fromtimestamp`。

```python
import os
import time
from datetime import datetime

info = os.stat("/etc/hosts")

# 用 time 模块转可读
readable_mtime = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(info.st_mtime))
print(f"最后修改: {readable_mtime}")
# 输出（示例）：最后修改: 2023-07-20 15:42:23

# 用 datetime 转可读
dt = datetime.fromtimestamp(info.st_mtime)
print(f"最后修改: {dt}")
# 输出（示例）：最后修改: 2023-07-20 15:42:23
```

**三个时间的区别**：

- `st_atime`(access time):文件被读取/访问的时间。注意很多系统为性能挂载时用 `noatime` 选项,此时 atime 不更新。
- `st_mtime`(modify time):文件**内容**被修改的时间。写文件会更新它。
- `st_ctime`(change time):
  - Unix/Linux:文件**元数据**(metadata)最后修改时间。改权限(`chmod`)、改属主(`chown`)、重命名等会更新它,不涉及内容修改。
  - Windows:文件**创建**时间。

```python
import os
import time

info = os.stat("/etc/hosts")
print(f"atime: {time.ctime(info.st_atime)}")   # 最后访问
print(f"mtime: {time.ctime(info.st_mtime)}")   # 内容最后修改
print(f"ctime: {time.ctime(info.st_ctime)}")   # Unix:元数据修改; Windows:创建
# 输出（示例）：
# atime: Thu Jul 20 16:00:00 2023
# mtime: Thu Jul 20 15:42:23 2023
# ctime: Mon Jul 10 12:00:00 2023
```

**`os.stat` 与 `os.path.getsize`/`getmtime` 的关系**：`os.path.getsize` 内部就是 `os.stat(path).st_size`，`os.path.getmtime` 就是 `os.stat(path).st_mtime`。如果只需要单个信息，用 `os.path.getsize` 更直观；需要多个信息时，调用一次 `os.stat` 比分别调用多次 `os.path.getXXX` 更高效（只做一次系统调用）。

```python
import os

# 需要多个信息时，一次 stat 比多次 path.getXXX 高效
info = os.stat("/etc/hosts")
print(f"大小: {info.st_size}, 修改时间: {info.st_mtime}, inode: {info.st_ino}")

# 等价但低效：三次系统调用
# size = os.path.getsize("/etc/hosts")
# mtime = os.path.getmtime("/etc/hosts")
# inode = os.stat("/etc/hosts").st_ino
```

### 2.17 os.chmod：修改文件权限

`os.chmod(path, mode)` 修改文件或目录的权限位。`mode` 是八进制数字。

**签名**：`os.chmod(path, mode)`

**权限位含义**(Unix)：

| 八进制  | 字符            | 含义       |
| ------- | --------------- | ---------- |
| `0o400` | r-- ----- ----- | 所有者读   |
| `0o200` | -w- ----- ----- | 所有者写   |
| `0o100` | --x ----- ----- | 所有者执行 |
| `0o040` | --- r-- -----   | 组读       |
| `0o020` | --- -w- -----   | 组写       |
| `0o010` | --- --x -----   | 组执行     |
| `0o004` | --- --- r--     | 其他人读   |
| `0o002` | --- --- -w-     | 其他人写   |
| `0o001` | --- --- --x     | 其他人执行 |

常用组合：`0o755`(rwxr-xr-x,目录/可执行文件常用)、`0o644`(rw-r--r--,普通文件常用)、`0o600`(rw-------,私密文件)。

```python
import os

# 创建一个文件，设置权限为 600（仅所有者可读写）
path = "/tmp/secret.txt"
with open(path, "w") as f:
    f.write("sensitive data")

os.chmod(path, 0o600)   # rw-------
print(oct(os.stat(path).st_mode & 0o777))   # 输出：0o600

# 改成 644（所有者读写，其他人只读）
os.chmod(path, 0o644)
print(oct(os.stat(path).st_mode & 0o777))   # 输出：0o644

# 改成 755（所有者全部，其他人读+执行）
os.chmod(path, 0o755)
print(oct(os.stat(path).st_mode & 0o777))   # 输出：0o755
```

**`st_mode & 0o777` 的原因**：`st_mode` 高位包含文件类型位（如普通文件、目录、链接的标识），低 9 位才是权限位，用 `& 0o777` 取出权限部分。

**Windows 上的 `chmod`**：Windows 只支持有限的权限控制——主要只控制"只读"位。`os.chmod` 在 Windows 上把文件设为只读（清除写位）或可写（设置写位），详细的用户/组权限控制需用 Windows ACL API（本篇不展开）。

**`os.chown`(可选)**：Unix 下 `os.chown(path, uid, gid)` 修改文件所有者用户 ID 和组 ID。需要 root 权限才能修改。日常很少直接用，了解即可。

```python
import os
# os.chown("/tmp/file.txt", 1000, 1000)  # 改 uid=1000, gid=1000，需 root
# 通常用 shell 的 chown 命令，Python 里很少直接调
```

### 2.18 os.environ：环境变量（轻量提及）

`os.environ` 是一个表示环境变量的映射对象（类似字典）。读取它拿当前进程的所有环境变量，修改它会同步到操作系统层面（影响子进程能读到的环境变量）。

```python
import os

# 读取环境变量
print(os.environ.get("HOME"))      # 用户主目录
print(os.environ.get("PATH"))      # 可执行文件搜索路径
print(os.environ.get("NOT_SET", "默认值"))   # 不存在时返回默认值
# 输出（示例）：
# /Users/demo
# /usr/bin:/bin:/usr/sbin:...
# 默认值

# 设置环境变量（影响当前进程及子进程）
os.environ["MY_APP_MODE"] = "debug"
print(os.environ.get("MY_APP_MODE"))   # debug

# 删除环境变量
del os.environ["MY_APP_MODE"]
print(os.environ.get("MY_APP_MODE"))   # None
```

**`os.environ` 与 `os.getenv` 的关系**：`os.getenv(key, default=None)` 是读取环境变量的便捷函数，等价于 `os.environ.get(key, default)`，但不支持设置。

```python
import os

# 推荐：os.getenv 读，简洁
db_host = os.getenv("DB_HOST", "localhost")
db_port = os.getenv("DB_PORT", "5432")
print(f"数据库: {db_host}:{db_port}")
# 输出（示例）：数据库: localhost:5432
```

环境变量和文件操作关联不大，但在"从环境变量读取路径配置"的场景常用，所以这里做轻量提及。

### 2.19 os.walk：递归遍历的衔接（简提）

`os.walk(top, topdown=True)` 是递归遍历目录树的生成器，每次产出一个 `(当前目录, 子目录列表, 文件列表)` 元组。它是处理"整个目录树"的首选工具。

本篇只做衔接性简提，因为 `os.walk` 内容较多，单独成篇见《os.walk 递归遍历目录》。这里只给一个最小示例，展示它与 `os.listdir` 的关系：

```python
import os

# os.listdir 只列出单层
print("单层列出:")
for name in os.listdir("/tmp"):
    print(f"  {name}")

# os.walk 递归遍历所有层级
print("递归遍历:")
for root, dirs, files in os.walk("/tmp"):
    for f in files:
        print(f"  {os.path.join(root, f)}")
```

**一句话区分**：`os.listdir` 看一层，`os.walk` 看整棵树。需要递归处理目录树（如统计整个项目代码行数、备份整个目录）时用 `os.walk`，详见下一篇。

### 2.20 综合示例：批量重命名与目录清理

下面用一个综合场景把前面讲到的多个 API 串起来——这是真实运维/数据处理中常见的任务。

**场景一：批量给日志文件加上日期前缀**

```python
import os

# 模拟一批日志文件
log_dir = "/tmp/demo_logs"
os.makedirs(log_dir, exist_ok=True)
for name in ["app.log", "error.log", "access.log"]:
    with open(os.path.join(log_dir, name), "w") as f:
        f.write("log content")

# 批量重命名：给每个 .log 文件加日期前缀
date_prefix = "20260723"
for name in os.listdir(log_dir):
    if name.endswith(".log"):
        old_path = os.path.join(log_dir, name)
        # 分离主名和扩展名，在主名前加日期
        base, ext = os.path.splitext(name)
        new_name = f"{date_prefix}_{base}{ext}"
        new_path = os.path.join(log_dir, new_name)
        os.rename(old_path, new_path)
        print(f"重命名: {name} -> {new_name}")

# 验证结果
print("重命名后:")
for name in os.listdir(log_dir):
    print(f"  {name}")
# 输出：
# 重命名: app.log -> 20260723_app.log
# 重命名: error.log -> 20260723_error.log
# 重命名: access.log -> 20260723_access.log
# 重命名后:
#   20260723_app.log
#   20260723_error.log
#   20260723_access.log
```

**场景二：统计目录下各类文件的大小分布**

```python
import os

def file_stats(dir_path):
    """统计目录下各扩展名的文件数量和总大小"""
    stats = {}   # {扩展名: [文件数, 总字节数]}
    for name in os.listdir(dir_path):
        full = os.path.join(dir_path, name)
        if os.path.isfile(full):
            ext = os.path.splitext(name)[1].lower() or "(无扩展名)"
            size = os.path.getsize(full)
            if ext not in stats:
                stats[ext] = [0, 0]
            stats[ext][0] += 1
            stats[ext][1] += size
    return stats

# 用前面创建的目录测试
stats = file_stats("/tmp/demo_logs")
for ext, (count, total) in stats.items():
    print(f"{ext}: {count} 个文件, 共 {total} 字节")
# 输出（示例）：
# .log: 3 个文件, 共 33 字节
```

**场景三：清空目录下的临时文件（保留子目录）**

```python
import os

def clean_temp_files(dir_path):
    """删除目录下所有 .tmp 文件，保留子目录和其他文件"""
    removed = 0
    for name in os.listdir(dir_path):
        full = os.path.join(dir_path, name)
        if os.path.isfile(full) and name.endswith(".tmp"):
            os.remove(full)
            removed += 1
    return removed

# 准备测试数据
test_dir = "/tmp/clean_test"
os.makedirs(test_dir, exist_ok=True)
for name in ["a.tmp", "b.tmp", "keep.txt"]:
    with open(os.path.join(test_dir, name), "w") as f:
        f.write("x")
os.makedirs(os.path.join(test_dir, "subdir"), exist_ok=True)

n = clean_temp_files(test_dir)
print(f"删除了 {n} 个临时文件")
print(f"剩余: {os.listdir(test_dir)}")
# 输出：
# 删除了 2 个临时文件
# 剩余: ['keep.txt', 'subdir']
```

这三个场景分别用到了 `os.listdir`+`os.path.splitext`+`os.rename`（批量重命名）、`os.path.getsize`+`os.path.splitext`（大小统计）、`os.listdir`+`os.path.isfile`+`os.remove`（清理文件），是 `os` 模块日常使用的典型组合。

---

## 3. 最佳实践

### 3.1 路径拼接永远用 os.path.join，不要手写分隔符

```python
import os

# 推荐：os.path.join，跨平台、自动处理分隔符
path = os.path.join(base_dir, "logs", "app.log")

# 不推荐：手写拼接，平台依赖、易出错
# path = base_dir + "/logs/app.log"    # Windows 上 / 不规范
# path = base_dir + "\\logs\\app.log"  # Linux 上 \\ 是错的
# path = base_dir + os.sep + "logs" + os.sep + "app.log"  # 啰嗦
```

手写拼接要么平台依赖（硬编码 `/` 或 `\`），要么啰嗦（手动 `os.sep`）。`os.path.join` 一行解决，自动用正确分隔符，还能处理末尾分隔符的重复问题。这是跨平台路径处理的第一条铁则。

更新一代的 `pathlib` 模块(见《pathlib 面向对象路径》)用 `/` 运算符拼接路径(`Path(base) / "logs" / "app.log"`),语义更直观,新项目可考虑用 `pathlib` 替代 `os.path`。

### 3.2 创建目录用 makedirs(exist_ok=True)，避免"已存在"报错

```python
import os

# 推荐：幂等创建，不存在则建，存在则跳过
os.makedirs(log_dir, exist_ok=True)

# 不推荐：先判断再建，有竞态条件
# if not os.path.exists(log_dir):
#     os.makedirs(log_dir)
#     # 如果在 exists 和 makedirs 之间另一个进程创建了目录，这里会报错
```

`exist_ok=True` 是更简洁、更安全（避免竞态条件）的写法。`os.path.exists` + `os.makedirs` 的"先检查再创建"在多进程/多线程下存在竞态——两个进程同时检查都发现不存在，一起创建，后创建的那个会报 `FileExistsError`。`exist_ok=True` 把"检查+创建"交给底层一次完成，规避了竞态。

### 3.3 删除前先判断存在性或用 try/except

```python
import os

# 推荐：用 try/except 处理"文件不存在"的常见情况
try:
    os.remove(config_path)
    print("配置文件已删除")
except FileNotFoundError:
    print("配置文件本就不存在，无需删除")

# 或先判断存在性（单线程场景足够）
if os.path.exists(config_path):
    os.remove(config_path)
```

`os.remove` 在文件不存在时会抛 `FileNotFoundError`。两种处理方式：先 `os.path.exists` 判断（单线程场景足够），或用 try/except 捕获（更 Pythonic，且能处理检查后文件被其他进程删除的竞态）。"请求宽恕比请求许可容易"(EAFP 风格)在 Python 中常被推荐。

### 3.4 os.rmdir 只删空目录，删非空目录树用 shutil.rmtree

```python
import os
import shutil

# os.rmdir：只删空目录
# os.rmdir("/tmp/full_dir")   # 目录非空则报错

# 删非空目录树：用 shutil.rmtree
shutil.rmtree("/tmp/full_dir")   # 连同所有内容和子目录一起删
```

`os` 模块没有"删除非空目录"的函数，这是有意为之——删除非空目录树涉及递归删除文件，风险较高，交给 `shutil.rmtree` 负责。不要自己写循环遍历删除（容易漏、易错），直接用 `shutil.rmtree`。

### 3.5 os.path.isfile/isdir 已隐含存在检查，不要叠加 exists

```python
import os

# 推荐：直接用 isfile/isdir，它们在路径不存在时返回 False
if os.path.isfile(path):
    ...

# 不推荐：冗余检查
# if os.path.exists(path) and os.path.isfile(path):   # exists 多余
#     ...
```

`os.path.isfile` 在路径不存在时返回 `False`（不会报错），所以不需要先 `exists` 再 `isfile`。`isfile(p)` 等价于 `exists(p) and 是文件`，`isdir(p)` 等价于 `exists(p) and 是目录`。叠加 `exists` 是冗余。

### 3.6 路径不要用字符串方法替代 os.path

```python
import os

# 推荐：os.path.split/splitext/basename/dirname 正确处理路径
name = os.path.basename("/home/demo/test.txt")  # test.txt
ext = os.path.splitext("/home/demo/test.txt")[1]  # .txt

# 不推荐：用字符串 split("/")，平台依赖且边界处理差
# parts = "/home/demo/test.txt".split("/")
# name = parts[-1]   # 多数情况对，但 Windows 路径 C:\... 会错
# ext = name.split(".")[-1]  # .tar.gz 只取到 gz，且无扩展名时取到整个名
```

字符串方法 `split("/")` 在 Windows 上处理 `C:\Users\...` 会错；`split(".")[-1]` 对 `.tar.gz` 这类多扩展名只取到最后一段，且无扩展名时会把整个文件名当扩展名。`os.path` 的函数处理了这些边界情况，且跨平台。详见《pathlib 面向对象路径》的对比。

### 3.7 stat 一次拿多信息，比多次 os.path.getXXX 高效

```python
import os

# 推荐：一次 stat 拿多个字段
info = os.stat(path)
size, mtime, inode = info.st_size, info.st_mtime, info.st_ino

# 不推荐：多次系统调用
# size = os.path.getsize(path)
# mtime = os.path.getmtime(path)
# inode = os.stat(path).st_ino   # 这里又调了一次 stat
```

每个 `os.path.getsize`/`getmtime` 内部都是一次 `os.stat` 系统调用（见 §4 原理）。需要多个字段时，调一次 `os.stat` 缓存结果，比多次调 `os.path.getXXX` 高效（省了系统调用的往返开销）。

### 3.8 改工作目录后务必切回，用 try/finally

```python
import os

# 推荐：try/finally 保证切回
original = os.getcwd()
try:
    os.chdir(target_dir)
    # 在 target_dir 下操作
finally:
    os.chdir(original)

# 不推荐：忘了切回，影响后续逻辑
# os.chdir(target_dir)
# ... 操作 ...
# 忘了切回，后续相对路径全乱
```

`os.chdir` 改的是进程级的当前工作目录，改完不切回会污染整个进程后续的相对路径解析。用 `try/finally` 保证无论是否异常都切回原目录。新项目也可考虑用 `contextlib.contextmanager` 封装成上下文管理器。

### 3.9 跨平台覆盖重命名用 os.replace，不用 os.rename

```python
import os

# 推荐：os.replace 跨平台一致的覆盖语义
os.replace("/tmp/src.txt", "/tmp/dst.txt")   # dst 已存在则覆盖

# 风险：os.rename 在 Windows 上 dst 已存在会报错，行为与 Unix 不一致
# os.rename("/tmp/src.txt", "/tmp/dst.txt")  # Windows 上可能失败
```

`os.rename` 在目标已存在时的行为因平台而异（Unix 覆盖文件、报错目录；Windows 直接报错）。`os.replace` 在所有平台上都执行覆盖语义（目标存在则替换），行为一致。需要覆盖语义时优先用 `os.replace`。

### 3.10 时间戳用 datetime/time 转可读，别裸打印

```python
import os
from datetime import datetime

mtime = os.stat("/etc/hosts").st_mtime

# 推荐：转可读格式
print(datetime.fromtimestamp(mtime).strftime("%Y-%m-%d %H:%M:%S"))
# 输出（示例）：2023-07-20 15:42:23

# 不推荐：裸打印时间戳，人看不懂
# print(mtime)   # 1689876543.0
```

时间戳是浮点秒数，直接打印是一串数字，人眼看不出是何时。用 `time.localtime` + `strftime` 或 `datetime.fromtimestamp` 转成可读字符串。

---

## 4. 原理

`os` 模块的本质是"操作系统系统调用的薄封装"。理解这一点，就能解释它的跨平台差异、性能特征和边界行为。

### 4.1 os 模块是对操作系统系统调用的薄封装

`os` 模块里的绝大多数函数并不做复杂计算，它们直接调用对应操作系统的系统调用（syscall）：

- `os.mkdir` → Unix 的 `mkdir(2)` 系统调用，Windows 的 `CreateDirectory`。
- `os.remove`/`os.unlink` → Unix 的 `unlink(2)`，Windows 的 `DeleteFile`。
- `os.rename` → Unix 的 `rename(2)`，Windows 的 `MoveFile`。
- `os.stat` → Unix 的 `stat(2)`/`lstat(2)`，Windows 的 `GetFileAttributesEx`。
- `os.listdir` → Unix 的 `getdents(2)`/`readdir(3)`，Windows 的 `FindFirstFile`/`FindNextFile`。

CPython 的 `os` 模块实现（在 `Modules/posixmodule.c`）就是把 Python 参数转成 C 参数、调用对应系统调用、把返回值包装成 Python 对象。所以 `os` 模块函数的行为几乎完全由底层操作系统决定——系统调用返回什么，Python 函数就返回什么；系统调用报什么错，Python 函数就抛什么异常。

这解释了为什么 `os` 模块函数能抛出 `FileNotFoundError`、`PermissionError`、`OSError` 等——这些异常就是系统调用错误号的 Python 化封装。例如 `os.remove` 删一个不存在的文件，底层 `unlink` 系统调用返回 `ENOENT`，CPython 把它包装成 `FileNotFoundError`。

```python
import os

# os.remove 删除不存在文件，抛 FileNotFoundError（对应系统的 ENOENT）
try:
    os.remove("/tmp/definitely_not_exist_xxx.txt")
except FileNotFoundError as e:
    print(f"系统调用失败: {e}")
# 输出：系统调用失败: [Errno 2] No such file or directory: '/tmp/definitely_not_exist_xxx.txt'
```

`[Errno 2]` 就是底层 `errno` 的值（`ENOENT`），`No such file or directory` 是它的标准描述——`os` 模块只做了薄薄一层翻译。

### 4.2 跨平台差异的来源

`os` 模块在不同操作系统上行为有差异，根源在于**底层系统调用的语义不同**。几处典型差异：

**路径分隔符**：Unix 用 `/`，Windows 用 `\`。这是历史原因——Unix 从一开始用 `/`，DOS/Windows 早期用 `/` 作为命令选项前缀（如 `dir /w`），为避免冲突改用 `\`。`os.path.join` 根据平台选用正确分隔符。

**`os.rename` 覆盖语义**：Unix 的 `rename(2)` 在目标已存在且是文件时覆盖，是目录时报错；Windows 的 `MoveFile` 在目标已存在时报错（不覆盖）。这就是 §3.9 提到用 `os.replace` 的原因——`os.replace` 调用的是 `ReplaceFile` 或加上了强制覆盖逻辑，保证跨平台一致。

**`os.stat` 的 `st_ctime`**：Unix 的 `stat` 结构有 `st_ctime`（元数据修改时间），Windows 的没有"元数据修改时间"但有"创建时间"。CPython 在 Windows 上把 `st_ctime` 映射为创建时间，在 Unix 上映射为元数据修改时间——同一个字段名，不同平台语义不同。这是 §2.16 强调"st_ctime 因平台而异"的根源。

**权限模型**：Unix 有完整的 owner/group/other + rwx 权限位，`os.chmod` 完整支持；Windows 的权限模型基于 ACL，`os.chmod` 只支持有限的"只读"位控制。这是 §2.17 提到 Windows chmod 受限的原因。

**行分隔符 `os.linesep`**：Unix 用 `\n`，Windows 用 `\r\n`（源于打字机时代的回车+换行两步操作）。文本文件读写时要注意——但 Python 的 `open()` 在文本模式下会自动转换 `\n` 和平台默认行分隔符，所以大多数时候你不需要手动用 `os.linesep`。

### 4.3 os.path 是纯字符串处理

`os.path` 子模块与 `os` 模块的其他部分有一个本质区别：**`os.path` 的函数大多是纯字符串操作，不碰文件系统**。

- `os.path.join("a", "b")` 只是字符串拼接，不创建任何目录。
- `os.path.split("/home/demo/test.txt")` 只是字符串切分，不查询文件系统。
- `os.path.splitext("file.txt")` 只是找 `.` 切分，不读磁盘。

少数例外是 `os.path.exists`、`os.path.isfile`、`os.path.isdir`、`os.path.getsize`、`os.path.getmtime` 等——它们会真正查询文件系统（内部调 `os.stat`）。

```python
import os

# os.path.join：纯字符串，不碰磁盘
p = os.path.join("/nonexistent", "path", "file.txt")  # 不报错，因为没有访问磁盘
print(p)   # /nonexistent/path/file.txt

# os.path.exists：查询文件系统
print(os.path.exists(p))   # False（真的去查了磁盘）
```

理解这一点有助于调试：`os.path.join` 出了错，问题在字符串拼接逻辑；`os.path.exists` 出了错或慢，问题在文件系统访问（权限、网络挂载、慢盘）。

### 4.4 os.path.getsize/getmtime 与 os.stat 的关系

前面提到 `os.path.getsize(path)` 等价于 `os.stat(path).st_size`。具体来说，CPython 中 `os.path.getsize` 的实现大致是：

```python
# os.path.getsize 的概念实现（简化）
def getsize(path):
    return os.stat(path).st_size

# os.path.getmtime 同理
def getmtime(path):
    return os.stat(path).st_mtime
```

每个 `os.path.getsize`/`getmtime`/`getatime`/`getctime` 都调用一次 `os.stat`。所以当需要多个字段时，多次调 `os.path.getXXX` 会触发多次系统调用，而一次 `os.stat` 只需一次系统调用。这就是 §3.7 的性能建议的原理来源——减少系统调用次数。

```python
import os

# 三次系统调用
size = os.path.getsize(path)
mtime = os.path.getmtime(path)
atime = os.path.getatime(path)

# 一次系统调用
info = os.stat(path)
size, mtime, atime = info.st_size, info.st_mtime, info.st_atime
```

### 4.5 umask 对 mkdir 权限的影响

`os.mkdir(path, mode=0o777)` 传入的 `mode` 并不是最终目录的权限——最终权限是 `mode & ~umask`。`umask` 是进程的权限屏蔽字（由 shell 的 `umask` 命令或 `os.umask()` 设置），它会屏蔽掉某些权限位。

例如默认 umask 是 `0o022`（屏蔽其他人的写权限）：

```
传入 mode: 0o777 (rwxrwxrwx)
umask:     0o022 (----w--w-)
~umask:    0o755 (rwxr-xr-x)
最终权限 = mode & ~umask = 0o777 & 0o755 = 0o755
```

所以传 `0o777` 创建出来的目录通常权限是 `0o755`——被 umask 屏蔽了。要创建真正 `0o777` 的目录，需要先 `os.umask(0)` 清零 umask，或创建后用 `os.chmod` 强制设置。

```python
import os

# 默认 umask 下，mkdir(0o777) 实际得到 0o755
os.mkdir("/tmp/test_umask", 0o777)
print(oct(os.stat("/tmp/test_umask").st_mode & 0o777))   # 0o755（被 umask 屏蔽）

# 要真正 0o777，os.chmod 强制设置
os.chmod("/tmp/test_umask", 0o777)
print(oct(os.stat("/tmp/test_umask").st_mode & 0o777))   # 0o777
```

这是 `mkdir`/`makedirs` 的 `mode` 参数"看起来不生效"的常见原因——不是没生效，而是被 umask 屏蔽了。理解 umask 有助于调试权限相关的"预期与实际不符"问题。

---

## 5. 总结

### 5.1 本文内容回顾

- **什么是 os 模块**：Python 标准库中与操作系统交互的模块，管文件和目录本身（区别于 `open` 管文件内容）；是系统调用的薄封装，跨平台行为因底层系统调用语义而异。
- **路径分隔符**：`os.sep`（当前系统分隔符）、`os.altsep`（备选）、`os.linesep`（行分隔符），跨平台基础。
- **os.path.join**：跨平台路径拼接首选函数，自动处理分隔符，遇到绝对路径段会丢弃前面累积的部分。
- **os.path.exists/lexists/isfile/isdir**：判断路径存在性及类型；`isfile`/`isdir` 已隐含存在检查；`lexists` 只看链接本身不跟随。
- **os.path.abspath/realpath**：转绝对路径，`abspath` 不解析符号链接，`realpath` 解析符号链接得真实物理路径。
- **os.path.split/splitext（易混）**：`split` 拆目录+文件名（按分隔符切），`splitext` 拆主名+扩展名（按 `.` 切）。
- **os.path.basename/dirname**：分别取文件名和目录部分，是 `split` 的拆开版本。
- **os.path.getsize**：获取文件字节大小；需要多字段时用 `os.stat` 更高效。
- **os.getcwd/chdir**：获取/切换工作目录；`chdir` 后务必 `try/finally` 切回。
- **os.mkdir/makedirs（易混）**：`mkdir` 创建单层（要求父目录存在），`makedirs` 递归创建多层；`exist_ok=True` 幂等创建。
- **os.rmdir/removedirs（易混）**：`rmdir` 删单层空目录，`removedirs` 删空目录并尝试删空父目录；都只删空目录，非空用 `shutil.rmtree`。
- **os.listdir**：列目录条目，返回名字列表（不是完整路径），需手动 join 拼路径。
- **os.rename/replace**：重命名/移动；`replace` 跨平台一致的覆盖语义，需覆盖时优先用。
- **os.remove/unlink**：删除文件（两者等价），不能删目录。
- **os.stat**：获取文件详细元信息（大小、权限、时间戳、inode 等）；`st_mtime`/`st_atime`/`st_ctime` 三个时间戳含义（尤其 `st_ctime` 在 Unix/Windows 语义不同）。
- **os.chmod**：修改权限位（Unix 完整支持，Windows 仅只读位）；受 umask 影响。
- **os.environ/os.getenv**：环境变量读写（轻量提及）。
- **os.walk**：递归遍历目录树，简提衔接，详见《os.walk 递归遍历目录》。
- **最佳实践**：join 拼路径、makedirs 幂等创建、删除前判断或 try/except、删非空树用 rmtree、isfile 已隐含 exists 不叠加、路径用 os.path 不用字符串方法、stat 一次拿多字段、chdir 用 try/finally、覆盖重命名用 os.replace、时间戳转可读。
- **原理**：os 是系统调用的薄封装（异常即系统错误号的翻译）；跨平台差异源于底层系统调用语义不同（路径分隔符、rename 覆盖、st_ctime 含义、权限模型、行分隔符）；os.path 多为纯字符串处理，少数查询文件系统；os.path.getsize 等内部调 os.stat，多次调用不如一次 stat；mkdir 的 mode 受 umask 屏蔽。

### 5.2 读完本文你应能掌握

- 说明 `os` 模块与 `open` 函数的分工（管文件/目录本身 vs 读文件内容），指出 `os` 是系统调用薄封装。
- 用 `os.path.join` 跨平台拼接路径，说明硬编码分隔符的问题。
- 用 `os.path.exists`/`isfile`/`isdir` 判断路径存在性和类型，说明 `isfile`/`isdir` 已隐含存在检查。
- 用 `os.path.abspath`/`realpath` 转绝对路径，指出两者对符号链接处理的差异。
- 区分 `os.path.split`（拆目录+文件名）与 `os.path.splitext`（拆主名+扩展名），正确选用。
- 用 `os.path.basename`/`dirname`/`getsize` 获取文件名、目录名、大小。
- 用 `os.getcwd`/`chdir` 获取和切换工作目录，用 `try/finally` 保证切回。
- 区分 `os.mkdir`（单层）与 `os.makedirs`（递归），说明 `exist_ok=True` 的作用与竞态规避。
- 区分 `os.rmdir`（删空目录）与 `os.removedirs`（递归删空目录），指出删非空目录树用 `shutil.rmtree`。
- 用 `os.listdir` 列目录并用 `os.path.join` 拼完整路径，结合 `isfile`/`isdir` 过滤文件和目录。
- 用 `os.rename`/`os.replace` 重命名文件，指出跨平台覆盖语义差异，优先用 `os.replace`。
- 用 `os.remove` 删文件，说明它不能删目录、与 `os.unlink` 等价。
- 用 `os.stat` 获取文件元信息，解读 `st_size`/`st_mtime`/`st_atime`/`st_ctime` 的含义（含 `st_ctime` 在 Unix/Windows 的差异），把时间戳转可读时间。
- 用 `os.chmod` 修改文件权限（常用模式 `0o755`/`0o644`/`0o600`），说明 umask 对最终权限的影响。
- 用 `os.environ`/`os.getenv` 读写环境变量。
- 说明 os 模块跨平台差异的来源（底层系统调用语义）、`os.path` 的纯字符串 vs 文件系统查询之分、`os.path.getsize` 与 `os.stat` 的关系。

### 5.3 延伸方向

- **os.walk 递归遍历目录**：本篇简提了 `os.walk`，递归遍历目录树的完整讲解见下一篇《os.walk 递归遍历目录》。
- **pathlib 面向对象路径**：`pathlib` 用面向对象方式封装路径操作（`Path` 对象），比 `os.path` 更现代直观，新项目推荐。见《pathlib 面向对象路径》。
- **shutil 高级文件操作**：`shutil` 模块提供 `copy`/`copytree`/`rmtree`/`move` 等高级文件操作，`os` 模块只做底层单步操作，复杂操作靠 `shutil`。
- **open 函数与文件读写**：`os` 管文件/目录本身，`open` 管文件内容读写，见《open 函数与 mode 参数》《文件读写方法》。
- **with 上下文管理器**：文件读写推荐用 `with` 自动管理资源，见《with 上下文管理器》。
- **tempfile 临时文件**：`tempfile` 模块创建临时文件和目录，常与 `os` 操作配合，见《tempfile 临时文件与目录》。
