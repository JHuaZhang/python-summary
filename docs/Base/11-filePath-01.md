---
group:
  title: 【11】文件与路径操作
  order: 11
order: 1
title: open函数与mode参数
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 open 函数

`open()` 是 Python 的内置函数，也是所有文件读写操作的入口。无论你用 `print` 往屏幕输出、用 `json.load` 读配置、用 `pickle` 存对象，还是自己手写日志——最终都要先 `open` 一个文件，拿到一个"文件对象"（file object），才能对它读或写。

说人话：`open` 就是"打开一个文件，给我一个可操作的句柄"。你可以把它理解成去图书馆借书——`open` 是办理借阅手续，借到手后（拿到文件对象），你才能翻阅（读）或在上面做笔记（写），用完要归还（关闭 `close`）。

`open` 最核心的参数有两个：`file`（文件路径）和 `mode`（打开模式）。`mode` 决定了"打开这个文件到底要干嘛"——只读？只写？追加？读写？文本还是二进制？选错模式，轻则报错，重则覆盖掉珍贵数据。所以 `mode` 是本篇的重中之重。

```python
# 最基本的用法：打开文件，读取内容，关闭文件
f = open("hello.txt", "r", encoding="utf-8")
content = f.read()
print(content)
f.close()
```

这段代码做了三件事：以只读文本模式（`"r"`）打开 `hello.txt`，读取全部内容，关闭文件。`encoding="utf-8"` 指定文本编码——这是读中文文件时最容易踩的坑，后面会详细讲。

### 1.2 基本语法与最小用法

`open` 的完整签名如下（只列关键参数，其余稍后逐节展开）：

```python
open(file, mode='r', encoding=None, errors=None,
     buffering=-1, newline=None, closefd=True, opener=None)
```

- `file`：文件路径（字符串或路径对象），必填。
- `mode`：打开模式，默认 `'r'`（只读文本）。
- `encoding`：文本编码，如 `'utf-8'`、`'gbk'`。仅文本模式有效。
- `errors`：编解码出错时的处理策略，如 `'strict'`、`'ignore'`、`'replace'`。
- `buffering`：缓冲策略，`-1`（默认）表示使用系统默认。
- `newline`：换行符处理，控制 Universal Newlines 行为。
- `closefd`：关闭文件时是否同时关闭底层文件描述符。
- `opener`：自定义打开函数，用于特殊打开方式（如以指定权限打开）。

最小用法——读一个文件的全部内容：

```python
# 假设 config.txt 内容为：
# host=127.0.0.1
# port=8080

f = open("config.txt", "r", encoding="utf-8")
text = f.read()
f.close()

print(text)
# 输出：
# host=127.0.0.1
# port=8080
```

写入一个文件：

```python
f = open("greeting.txt", "w", encoding="utf-8")
f.write("你好，世界！\n")
f.close()
```

这两段代码覆盖了 `open` 最常见的两个场景：读和写。但 `mode` 字符串 `"r"` 和 `"w"` 背后有一整套体系——追加 `"a"`、排他创建 `"x"`、读写组合 `"+"`、二进制后缀 `"b"`——每种模式的语义、行为、陷阱都不同，这正是第 2 章要逐节展开的内容。

### 1.3 mode 参数总览：一张表先看全貌

`mode` 是一个字符串，由"基础模式"和"修饰符"组合而成。基础模式有四种（`r`/`w`/`a`/`x`），修饰符有两个（`+` 可读写、`b` 二进制），它们可以组合出 12 种有效模式。

| 基础模式 | 含义             | 文件不存在时           | 文件存在时               | 文件指针位置 |
| -------- | ---------------- | ---------------------- | ------------------------ | ------------ |
| `r`      | 只读             | 报 `FileNotFoundError` | 正常打开                 | 开头         |
| `w`      | 只写             | 创建新文件             | **清空内容**             | 开头         |
| `a`      | 只写（追加）     | 创建新文件             | 保留内容                 | **末尾**     |
| `x`      | 只写（排他创建） | 创建新文件             | **报 `FileExistsError`** | 开头         |

| 修饰符 | 含义       | 说明                                                             |
| ------ | ---------- | ---------------------------------------------------------------- |
| `+`    | 可读写     | 在基础模式上加上"写"或"读"能力，使文件对象可同时读写             |
| `b`    | 二进制模式 | 以 `bytes` 为单位读写，不经过编解码，`encoding`/`newline` 不生效 |

组合后 12 种模式：

| 模式       | 读    | 写    | 文件不存在 | 文件存在时 | 指针 |
| ---------- | ----- | ----- | ---------- | ---------- | ---- |
| `r`        | ✅    | ❌    | 报错       | 保留       | 开头 |
| `r+`       | ✅    | ✅    | 报错       | 保留       | 开头 |
| `w`        | ❌    | ✅    | 创建       | **清空**   | 开头 |
| `w+`       | ✅    | ✅    | 创建       | **清空**   | 开头 |
| `a`        | ❌    | ✅    | 创建       | 保留       | 末尾 |
| `a+`       | ✅    | ✅    | 创建       | 保留       | 末尾 |
| `x`        | ❌    | ✅    | 创建       | 报错       | 开头 |
| `x+`       | ✅    | ✅    | 创建       | 报错       | 开头 |
| `rb`/`r+b` | ✅    | ❌/✅ | 报错       | 保留       | 开头 |
| `wb`/`w+b` | ❌/✅ | ✅    | 创建       | 清空       | 开头 |
| `ab`/`a+b` | ❌/✅ | ✅    | 创建       | 保留       | 末尾 |
| `xb`/`x+b` | ❌/✅ | ✅    | 创建       | 报错       | 开头 |

这张表是全篇的"地图"——后续每一节都是在展开其中一行的细节。读的时候可以随时回来对照。

### 1.4 文件对象的基本操作

`open` 返回的文件对象支持几个核心方法，它们贯穿全篇示例，这里先建立直觉：

```python
f = open("test.txt", "w", encoding="utf-8")
f.write("第一行\n")        # 写入字符串，返回写入字符数
f.writelines(["第二行\n", "第三行\n"])  # 写入多行（不自动加换行）
f.close()

f = open("test.txt", "r", encoding="utf-8")
print(f.read())            # 读取全部
# 输出：第一行
# 第二行
# 第三行

f.seek(0)                  # 指针移回开头
print(f.readline())        # 读取一行
# 输出：第一行

print(f.readlines())       # 读取剩余所有行，返回列表
# 输出：['第二行\n', '第三行\n']
f.close()
```

- `read()`：读全部（或指定字节数/字符数）。
- `readline()`：读一行（含换行符）。
- `readlines()`：读所有行，返回列表。
- `write(s)`：写一个字符串，返回写入的字符数。
- `writelines(list)`：写一个序列（不自动加换行）。
- `seek(offset)`：移动文件指针。
- `tell()`：返回当前指针位置。
- `close()`：关闭文件。

这些方法在文本模式和二进制模式下行为略有不同（如 `read` 返回 `str` 还是 `bytes`、`seek` 的偏移单位），后续逐节说明。

---

## 2. 核心内容

本章逐节展开 `open` 的各种 `mode`、关键参数（`encoding`、`errors`、`buffering`、`newline`、`closefd`、`opener`），以及文本模式与二进制模式的差异。每节遵循"文字详解 → demo → 运行结果说明 → 陷阱"。

### 2.1 mode='r'：只读模式，文件不存在就报错

`'r'` 是最安全的模式——它只读、不写，绝不会破坏文件内容。文件不存在时抛 `FileNotFoundError`，这是新手最常见的"忘了先创建文件就读"的报错。

```python
# 假设 notes.txt 内容为：
# 学习 Python
# 很有趣

f = open("notes.txt", "r", encoding="utf-8")
print(f.read())
f.close()
# 输出：
# 学习 Python
# 很有趣
```

**文件不存在的报错**：

```python
try:
    f = open("nonexistent.txt", "r")
except FileNotFoundError as e:
    print(e)
# 输出：[Errno 2] No such file or directory: 'nonexistent.txt'
```

`'r'` 模式下尝试 `write` 会抛 `io.UnsupportedOperation: not writable`：

```python
f = open("notes.txt", "r", encoding="utf-8")
try:
    f.write("test")
except io.UnsupportedOperation as e:
    print(e)
# 输出：not writable
f.close()
```

**适合场景**：读取配置文件、解析日志、加载已有数据——任何"只看不动"的场景都应该用 `'r'`，它从机制上杜绝了误写。

```python
# 读取配置文件，解析成字典
config = {}
with open("app.conf", "r", encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if line and "=" in line:
            key, val = line.split("=", 1)
            config[key.strip()] = val.strip()

print(config)
# 输出（假设 app.conf 内容为 host=localhost\nport=8080）：
# {'host': 'localhost', 'port': '8080'}
```

这里用了 `with` 语句（上下文管理器），它会在代码块结束时自动 `close`，是处理文件的推荐写法——后面"最佳实践"会专门讲。`'r'` 模式下文件指针在开头，读完一次后指针到了末尾，再 `read` 返回空字符串：

```python
with open("notes.txt", "r", encoding="utf-8") as f:
    print(f.read())            # 全部内容
    print(repr(f.read()))     # 再读一次
# 输出：
# 学习 Python
# 很有趣
# ''
```

### 2.2 mode='w'：只写模式，文件存在就清空

`'w'` 是"只写"模式。它的行为很直接：打开时如果文件已存在，**立即清空内容**（截断为 0 字节）；如果不存在，创建新文件。文件指针在开头。

**清空行为是静默的、即时的**——`open("data.txt", "w")` 执行的那一刻，原文件内容就没了。这是 `'w'` 模式最大的危险点：如果你本来想追加却用了 `'w'`，原始数据瞬间丢失。

```python
# 第一次写：文件不存在，创建并写入
with open("log.txt", "w", encoding="utf-8") as f:
    f.write("第一条日志\n")

# 读出来看看
with open("log.txt", "r", encoding="utf-8") as f:
    print(f.read())
# 输出：第一条日志

# 第二次写：文件存在，会被清空！
with open("log.txt", "w", encoding="utf-8") as f:
    f.write("第二条日志\n")

# 原来的"第一条日志"没了
with open("log.txt", "r", encoding="utf-8") as f:
    print(f.read())
# 输出：第二条日志
```

**`'w'` 模式下尝试 `read` 会报错**：

```python
with open("log.txt", "w", encoding="utf-8") as f:
    try:
        f.read()
    except io.UnsupportedOperation as e:
        print(e)
# 输出：not readable
```

**适合场景**：生成报告、覆写配置、创建新文件且不在乎旧内容。当你明确"要重新生成整个文件"时用 `'w'`，它的清空行为反而是一种简洁的保障。

```python
# 生成一份 CSV 报表，每次完全重写
import csv

with open("report.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["姓名", "成绩"])
    writer.writerow(["张三", 95])
    writer.writerow(["李四", 88])

with open("report.csv", "r", encoding="utf-8") as f:
    print(f.read())
# 输出：
# 姓名,成绩
# 张三,95
# 李四,88
```

这里的 `newline=""` 是 `csv` 模块的要求——`csv.writer` 自己处理换行，需要让 `open` 不做换行符转换，否则 Windows 上会出现空行。详见 2.12 节 `newline` 参数。

### 2.3 mode='a'：追加模式，在文件末尾写

`'a'` 是"追加"模式。文件存在时保留原内容，文件指针定位在**末尾**——所有写入都追加到文件尾部。文件不存在时创建新文件。

`'a'` 和 `'w'` 的关键区别：`'a'` 不清空，`'w'` 清空。如果你要"往日志文件不断追加新记录"，必须用 `'a'`，用 `'w'` 会把历史日志全部抹掉。

```python
# 模拟日志追加：每次运行都往日志文件加一条
import time

with open("app.log", "a", encoding="utf-8") as f:
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    f.write(f"[{timestamp}] 服务启动\n")

# 多运行几次，日志会不断累积
with open("app.log", "r", encoding="utf-8") as f:
    print(f.read())
# 输出（假设运行了 3 次）：
# [2026-07-23 10:00:01] 服务启动
# [2026-07-23 10:00:30] 服务启动
# [2026-07-23 10:01:15] 服务启动
```

**`'a'` 模式的指针行为**：即使你 `seek(0)` 把指针移到开头，写入时仍然追加到末尾——这是 `'a'` 的硬性语义，操作系统层面保证。

```python
with open("app.log", "a", encoding="utf-8") as f:
    f.seek(0)                    # 指针移到开头（但写不受影响）
    f.write("这条还是在末尾\n")

with open("app.log", "r", encoding="utf-8") as f:
    print(f.read())
# 输出：新内容确实在文件末尾，seek(0) 对写无效
```

这意味着追加模式下你无法通过 `seek` 在文件中间插入内容——文件只从尾部增长。如果要在中间修改，需要用 `'r+'` 或读取后整体重写。

**`'a'` 模式下尝试 `read` 也报错**（因为没有 `+`）：

```python
with open("app.log", "a", encoding="utf-8") as f:
    try:
        f.read()
    except io.UnsupportedOperation as e:
        print(e)
# 输出：not readable
```

**适合场景**：日志记录、数据采集追加、定期归档——任何"只增不改、保留历史"的场景。

### 2.4 mode='x'：排他创建，文件已存在就报错

`'x'` 是 Python 3 引入的"排他创建"模式。它的语义是"我确定要创建一个新文件，如果文件已存在就说明出问题了，必须报错"。文件不存在时创建并打开（只写），文件存在时抛 `FileExistsError`。

`'x'` 解决的问题是：用 `'w'` 创建文件时，如果文件已存在会被静默清空——这在某些场景下是危险的（比如写多个进程同时创建同一个临时文件，你不想互相覆盖）。`'x'` 提供了"创建保证"——要么创建成功，要么明确失败，绝不会覆盖已有文件。

```python
# 第一次创建：成功
with open("lock.tmp", "x", encoding="utf-8") as f:
    f.write("进程 A 占用\n")
print("创建成功")
# 输出：创建成功

# 第二次创建同一个文件：报错
try:
    with open("lock.tmp", "x", encoding="utf-8") as f:
        f.write("进程 B 占用\n")
except FileExistsError as e:
    print(e)
# 输出：[Errno 17] File exists: 'lock.tmp'
```

**适合场景**：文件锁、临时文件防覆盖、并发创建时的互斥保证。当你想"确保我创建的是一个全新文件"时，`'x'` 比 `'w'` 安全得多。

```python
# 多个进程同时生成唯一临时文件
import os

def acquire_lock(name):
    """尝试创建锁文件，成功说明拿到锁"""
    try:
        fd = open(name, "x", encoding="utf-8")
        fd.write(str(os.getpid()))
        fd.close()
        return True
    except FileExistsError:
        return False

print(acquire_lock("worker.lock"))   # True（首次）
print(acquire_lock("worker.lock"))   # False（已存在）
```

`'x'` 在 Linux/macOS 底层对应 `open(O_CREAT | O_EXCL)`，是原子操作——检查存在性和创建是一步完成的，不存在"两个进程同时看到文件不存在、然后都创建"的竞态条件。这让 `'x'` 成为实现简单文件锁的正确方式。

### 2.5 修饰符 +：可读写组合

`+` 修饰符把基础模式从"只读"或"只写"升级为"可读写"。它必须和 `r`/`w`/`a`/`x` 之一组合：`r+`、`w+`、`a+`、`x+`。

**关键理解：`+` 不改变基础模式的文件处理行为（是否清空、是否报错、指针位置），只增加"可读可写"能力**。即：

- `r+`：文件不存在报错、文件存在保留、指针在开头——和 `r` 一样，但可写。
- `w+`：文件不存在创建、文件存在清空、指针在开头——和 `w` 一样，但可读。
- `a+`：文件不存在创建、文件存在保留、指针在末尾——和 `a` 一样，但可读。
- `x+`：文件不存在创建、文件存在报错——和 `x` 一样，但可读。

**`r+`：既读又写，不清空，最常用的"修改文件"模式**：

```python
# 先准备一个文件
with open("counter.txt", "w", encoding="utf-8") as f:
    f.write("100")

# 用 r+ 打开，读取当前值，修改后写回
with open("counter.txt", "r+", encoding="utf-8") as f:
    val = int(f.read())        # 读：指针在开头，读到 "100"
    f.seek(0)                  # 确保指针在开头
    f.write(str(val + 1))      # 写：覆盖写入 "101"
    f.truncate()               # 截断多余内容（防止旧数据残留）

with open("counter.txt", "r", encoding="utf-8") as f:
    print(f.read())
# 输出：101
```

这里 `truncate()` 很关键——如果新内容比旧内容短（比如从 `1000` 改成 `101`），不 truncate 会残留旧字符。`r+` 是从开头覆盖写，不自动清空，这是它和 `w+` 的核心区别。

**`w+`：清空后可读写，适合"先写后读"场景**：

```python
# w+：打开即清空，写入后再读
with open("cache.txt", "w+", encoding="utf-8") as f:
    f.write("cached data")
    f.seek(0)                  # 写完后指针在末尾，要读必须 seek 回开头
    print(f.read())
# 输出：cached data

# 文件被清空重写了
with open("cache.txt", "r", encoding="utf-8") as f:
    print(f.read())
# 输出：cached data
```

`w+` 的使用场景较少——既然要清空，通常不需要立刻再读。大多数"先写后读"可以分两次 `open`（`w` 写完，`r` 读）。

**`a+`：追加并可读，适合"追加后回看"**：

```python
# a+：追加模式，可读
with open("events.log", "a+", encoding="utf-8") as f:
    f.write("event_001\n")
    f.write("event_002\n")
    f.seek(0)                  # 指针移到开头才能读
    print(f.read())
# 输出：
# event_001
# event_002
```

`a+` 的读需要 `seek(0)`——因为打开时指针在末尾，直接 `read` 会读到空。

**`+` 模式的指针陷阱**：`r+`/`w+`/`x+` 打开时指针在开头，`a+` 在末尾。读写切换时通常需要手动 `seek`，这是 `+` 模式最容易出错的地方。

### 2.6 修饰符 b：二进制模式

`b` 修饰符把文件视为二进制数据处理，读写单位是 `bytes` 而非 `str`。`b` 和基础模式组合：`rb`、`wb`、`ab`、`xb`，也可再加 `+`：`r+b`、`w+b`、`a+b`、`x+b`。

二进制模式下，`encoding`、`errors`、`newline` 参数全部失效——因为没有编解码过程，直接读写原始字节。

```python
# 文本模式：读出来是 str
with open("text.txt", "w", encoding="utf-8") as f:
    f.write("你好")

with open("text.txt", "r", encoding="utf-8") as f:
    data = f.read()
    print(type(data), data)
# 输出：<class 'str'> 你好

# 二进制模式：读出来是 bytes
with open("text.txt", "wb") as f:
    f.write("你好".encode("utf-8"))

with open("text.txt", "rb") as f:
    data = f.read()
    print(type(data), data)
# 输出：<class 'bytes'> b'\xe4\xbd\xa0\xe5\xa5\xbd'
```

**二进制模式下 `write` 必须传 `bytes`**：

```python
with open("data.bin", "wb") as f:
    # f.write("hello")   # ❌ TypeError: a bytes-like object is required
    f.write(b"hello")     # ✅ 传 bytes
    f.write(b"\x00\xff")  # ✅ 写入原始字节

with open("data.bin", "rb") as f:
    print(f.read())
# 输出：b'hello\x00\xff'
```

**适合场景**：图片、音频、视频、压缩包、PDF——任何"非文本"文件都必须用 `b` 模式。用文本模式处理二进制会破坏数据（编解码会篡改字节）。

```python
# 二进制图片复制
with open("photo.jpg", "rb") as src, open("photo_copy.jpg", "wb") as dst:
    while True:
        chunk = src.read(4096)     # 每次读 4096 字节
        if not chunk:
            break
        dst.write(chunk)           # 分块读写，避免一次性加载大文件

print("复制完成")
```

**二进制模式没有换行符转换**：文本模式在 Windows 上会把 `\n` 转成 `\r\n`（写入）或 `\r\n` 转成 `\n`（读取），二进制模式完全不做转换。这对处理二进制数据至关重要——你写进去的每个字节都原样保存。

```python
# Windows 上的换行差异演示
with open("test.txt", "w") as f:     # 文本模式
    f.write("a\nb")                  # 写 \n，Windows 上存为 a\r\nb

with open("test.txt", "rb") as f:    # 二进制读出看真实字节
    print(f.read())
# 在 Windows 上输出：b'a\r\nb'
# 在 Linux/macOS 上输出：b'a\nb'

with open("test2.txt", "wb") as f:   # 二进制写
    f.write(b"a\nb")                 # 原样写入，不做转换

with open("test2.txt", "rb") as f:
    print(f.read())
# 所有平台都输出：b'a\nb'
```

### 2.7 文本模式与二进制模式的完整对比

这是全篇最需要"彻底理解"的区别，专门一节展开。

| 维度            | 文本模式（如 `r`/`w`/`a`）           | 二进制模式（如 `rb`/`wb`/`ab`）   |
| --------------- | ------------------------------------ | --------------------------------- |
| 数据类型        | `str`                                | `bytes`                           |
| 编解码          | 经过 `encoding` 编解码               | 不编解码，原样读写                |
| 换行符          | 平台相关转换（Windows: `\r\n`↔`\n`） | 不转换                            |
| `encoding` 参数 | 生效                                 | 忽略                              |
| `errors` 参数   | 生效                                 | 忽略                              |
| `newline` 参数  | 生效                                 | 忽略                              |
| `seek` 单位     | 字符（但部分位置不支持）             | 字节（可精确 seek）               |
| `read(n)` 的 n  | 字符数                               | 字节数                            |
| 适用对象        | 文本文件（.txt/.csv/.json/.md）      | 二进制文件（.jpg/.mp3/.zip/.pdf） |

**`read(n)` 的单位差异**：

```python
# 准备一个含中文的文件（UTF-8 中每个中文 3 字节）
with open("cn.txt", "w", encoding="utf-8") as f:
    f.write("你好世界")

# 文本模式读 2：2 个字符
with open("cn.txt", "r", encoding="utf-8") as f:
    print(f.read(2))
# 输出：你好

# 二进制模式读 2：2 个字节（不够一个完整中文）
with open("cn.txt", "rb") as f:
    print(f.read(2))
# 输出：b'\xe4\xbd'  （"你"的前两个字节）
```

文本模式按字符读，能正确处理多字节编码；二进制模式按字节读，可能把一个多字节字符拆开（得到不完整的字节序列）。

**`seek` 的限制差异**：

```python
# 文本模式 seek 只能到开头或 tell 记录的位置
with open("cn.txt", "r", encoding="utf-8") as f:
    f.read(2)                # 读 2 个字符（6 字节）
    pos = f.tell()           # 记录当前位置
    f.seek(0)                # 回开头，OK
    f.seek(3)                # ❌ 可能报错：can't do nonzero cur-relative seeks
    # 因为 3 不是字符边界，文本模式 seek 必须落在字符边界

# 二进制模式 seek 可到任意字节位置
with open("cn.txt", "rb") as f:
    f.seek(3)                # 跳到第 3 字节，OK
    print(f.read(3))         # 读 3 字节，正好是"好"
# 输出：b'\xe5\xa5\xbd'  （"好"的 UTF-8 编码）
```

二进制模式 `seek` 自由，因为任何字节位置都是有效的；文本模式 `seek` 受字符边界约束——如果 seek 到多字节字符的中间，解码会出乱码，所以 Python 限制文本模式只能 `seek(0)` 或 seek 到之前 `tell()` 记录的位置（某些平台除外）。

**选择原则**：文本文件用文本模式（有编解码、有换行转换、按字符操作），二进制文件用二进制模式（原样字节、无转换、按字节操作）。用错模式——比如用文本模式打开图片——会因编解码破坏数据。

### 2.8 encoding 参数：指定文本编码

`encoding` 只在文本模式下生效，指定文件的字符编码。不传时使用平台默认（`locale.getpreferredencoding()`）——Windows 上通常是 `gbk`/`cp936`，Linux/macOS 上通常是 `utf-8`。

**不指定 encoding 是中文环境下最大的乱码来源**：

```python
# 在 Windows（默认 gbk）上写文件
with open("cn_text.txt", "w") as f:     # 没传 encoding，用 gbk
    f.write("你好")

# 在 Linux（默认 utf-8）上读同一个文件
with open("cn_text.txt", "r") as f:     # 没传 encoding，用 utf-8
    print(f.read())
# 输出：???  （乱码！gbk 编码的字节用 utf-8 解码失败或出错）
```

因为编码不一致，跨平台传文件时极易乱码。**推荐做法：凡是处理文本文件，永远显式传 `encoding="utf-8"`**，不依赖平台默认。

```python
# ✅ 显式指定 encoding，跨平台一致
with open("data.txt", "w", encoding="utf-8") as f:
    f.write("你好，世界")

with open("data.txt", "r", encoding="utf-8") as f:
    print(f.read())
# 输出：你好，世界
```

**常见编码**：

| 编码           | 说明                   | 典型场景                    |
| -------------- | ---------------------- | --------------------------- |
| `utf-8`        | 全球通用，1-4 字节变长 | 首选，跨平台                |
| `gbk`/`gb2312` | 中文 Windows 默认      | 老旧系统、某些 Windows 软件 |
| `utf-16`       | 双字节，带 BOM         | Windows 记事本某些选项      |
| `ascii`        | 纯英文                 | 仅 ASCII 字符               |
| `latin-1`      | 单字节，0-255 全映射   | 兼容任意字节不报错          |

**读取未知编码文件**：可以尝试 `utf-8`，失败再 fallback：

```python
# 尝试用 utf-8 读，失败则用 gbk
def read_text(path):
    for enc in ("utf-8", "gbk", "latin-1"):
        try:
            with open(path, "r", encoding=enc) as f:
                return f.read()
        except UnicodeDecodeError:
            continue
    raise ValueError("无法识别编码")

print(read_text("unknown.txt"))
```

`latin-1` 是"兜底编码"——它对 0-255 每个字节都有映射，永远不会 `UnicodeDecodeError`，但非 ASCII 内容会显示成乱码。在你只想"读出点东西看看"而不在乎准确度时有用。

### 2.9 errors 参数：编解码出错怎么办

`errors` 控制文本模式下编解码遇到错误时的处理策略。默认 `'strict'`——遇到无法编解码的字符就抛 `UnicodeDecodeError`。

| 值                    | 行为                         |
| --------------------- | ---------------------------- |
| `'strict'`            | 抛异常（默认）               |
| `'ignore'`            | 跳过错误字符                 |
| `'replace'`           | 用 `�` 替换错误字符          |
| `'backslashreplace'`  | 用 `\xNN` 等转义序列替换     |
| `'namereplace'`       | 用 `\N{字符名}` 替换         |
| `'surrogateescape'`   | 保留原始字节用于日后还原     |
| `'xmlcharrefreplace'` | 用 XML 字符引用 `&#NN;` 替换 |

```python
# 准备一个 gbk 编码的文件
with open("mixed.txt", "wb") as f:
    f.write("你好".encode("gbk"))
    f.write(b"\xff\xfe")           # 故意写入两个非法 utf-8 字节

# strict：直接报错
try:
    with open("mixed.txt", "r", encoding="utf-8") as f:
        print(f.read())
except UnicodeDecodeError as e:
    print(f"strict 模式报错：{e}")
# 输出：strict 模式报错：'utf-8' codec can't decode byte 0xff ...

# ignore：跳过非法字节
with open("mixed.txt", "r", encoding="utf-8", errors="ignore") as f:
    print(f.read())
# 输出：你好（非法字节被丢弃）

# replace：用 � 替换
with open("mixed.txt", "r", encoding="utf-8", errors="replace") as f:
    print(f.read())
# 输出：你好锘（非法字节变成了替换符）

# backslashreplace：用转义序列
with open("mixed.txt", "r", encoding="utf-8", errors="backslashreplace") as f:
    print(f.read())
# 输出：你好\xff fe（非法字节变成 \xff 等转义）
```

**适合场景**：

- 读取用户上传的、编码不确定的文本：`errors="replace"` 保证不崩，虽然内容有损。
- 日志处理、数据清洗容忍少量乱码：`errors="ignore"`。
- 需要无损往返（读出再写回还原原始字节）：`surrogateescape`。

```python
# 读取编码不纯的日志，容忍乱码
with open("messy.log", "r", encoding="utf-8", errors="replace") as f:
    for line in f:
        process(line.strip())       # 即使有乱码也不中断
```

**写入时的 errors**：写入时如果遇到无法用目标编码表示的字符，`errors` 同样生效：

```python
# gbk 无法表示某些特殊符号（如 emoji）
with open("out.txt", "w", encoding="gbk", errors="replace") as f:
    f.write("测试 \U0001f600 结束")   # emoji 会被替换
# 文件内容：测试 ？ 结束
```

### 2.10 buffering 参数：控制缓冲策略

`buffering` 控制文件的缓冲行为，影响"写操作何时真正落盘"。默认 `-1`（使用系统默认缓冲）。

| 值   | 行为                                                                            |
| ---- | ------------------------------------------------------------------------------- |
| `-1` | 默认缓冲（二进制用 `io.DEFAULT_BUFFER_SIZE`，文本用行缓冲 if isatty，否则默认） |
| `0`  | 关闭缓冲（仅二进制模式可用）                                                    |
| `1`  | 行缓冲（仅文本模式可用，遇到 `\n` 就 flush）                                    |
| `>1` | 使用指定大小（字节）的缓冲区                                                    |

**缓冲的作用**：每次 `write` 不直接写磁盘，而是先写到内存缓冲区，缓冲区满了或 `close`/`flush` 时才真正写盘——减少系统调用，提升性能。

```python
# 默认缓冲：写入后 close 才落盘
import os

f = open("buf.txt", "w", encoding="utf-8", buffering=-1)  # 默认缓冲
f.write("hello")
# 此时文件可能还是空的（数据在缓冲区）
# os.path.getsize("buf.txt") 可能返回 0

f.close()                  # close 触发 flush + 落盘
print(os.path.getsize("buf.txt"))
# 输出：5
```

**行缓冲（buffering=1）**：文本模式下，遇到换行符就 flush：

```python
# 行缓冲：每写一行就落盘
with open("linebuf.log", "w", encoding="utf-8", buffering=1) as f:
    f.write("line 1\n")    # 遇到 \n，立即落盘
    # 此时文件里已有 "line 1\n"
    f.write("line 2")      # 没有 \n，不落盘
    # 此时文件里还只有 "line 1\n"
    # 直到 close 或再写 \n 才落盘 line 2
```

行缓冲适合日志——你希望"每行写完立刻能在文件里看到"，这样即使程序崩溃，已写的日志不会丢。

**无缓冲（buffering=0）**：仅二进制模式可用，每次 `write` 直接系统调用写盘：

```python
# 无缓冲：写一个字节立刻落盘
with open("raw.bin", "wb", buffering=0) as f:
    f.write(b"A")
    # 此刻文件里已有 b"A"，立即生效
```

**手动 flush**：任何模式下都可以 `f.flush()` 主动把缓冲区写盘，不必等 close：

```python
f = open("progress.log", "w", encoding="utf-8")
for i in range(3):
    f.write(f"step {i} done\n")
    f.flush()              # 每步立即落盘，防止崩溃丢日志
f.close()
```

`flush` 只是把数据交给操作系统，不一定立刻物理写盘（OS 自己也有缓冲），但对同一进程后续读、对其他进程读，数据已可见。要确保物理落盘用 `os.fsync(f.fileno())`。

### 2.11 newline 参数：控制换行符转换

`newline` 只在文本模式下生效，控制换行符的读写转换。换行符在不同平台不同：Linux 用 `\n`，Windows 用 `\r\n`，老 Mac 用 `\r`。Python 的文本模式默认会做转换，`newline` 参数让你精细控制。

| `newline` 值   | 写入时                 | 读取时                                 |
| -------------- | ---------------------- | -------------------------------------- |
| `None`（默认） | `\n` 转成 `os.linesep` | 通用换行：`\r\n`/`\r`/`\n` 都转成 `\n` |
| `""`           | 不转换                 | 通用换行（同上）                       |
| `"\n"`         | 不转换                 | 不转换                                 |
| `"\r\n"`       | `\n` 转成 `\r\n`       | `\r\n` 转成 `\n`                       |
| `"\r"`         | `\n` 转成 `\r`         | `\r` 转成 `\n`                         |

**默认行为（newline=None）**：写入时把 `\n` 转成平台换行符（Windows 上变 `\r\n`），读取时把任何换行符都归一成 `\n`。

```python
# 默认 newline=None，在 Windows 上
with open("nl.txt", "w", encoding="utf-8") as f:
    f.write("a\nb\n")

with open("nl.txt", "rb") as f:     # 二进制看真实字节
    print(f.read())
# 在 Windows 上输出：b'a\r\nb\r\n'（\n 被转成 \r\n）
# 在 Linux 上输出：b'a\nb\n'（不变）
```

**newline="" 不转换写入换行符**：这是写 CSV 时的标准用法：

```python
import csv

# ✅ csv 写入时 newline=""，让 csv 模块自己处理换行
with open("data.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["a", "b"])
    writer.writerow(["c", "d"])

with open("data.csv", "rb") as f:
    print(f.read())
# 输出（所有平台一致）：b'a,b\r\nc,d\r\n'
```

`csv.writer` 自己写入 `\r\n` 作为行尾。如果 `open` 用默认 `newline=None`，在 Windows 上会把 `\n` 再转成 `\r\n`，变成 `\r\r\n`——多出一个 `\r`，文件出现空行。所以 `csv` 文档明确要求 `open` 时传 `newline=""`。

**读取时的通用换行**：默认 `newline=None`，读取时 `\r\n`、`\r`、`\n` 都被归一成 `\n`，让代码跨平台一致：

```python
# 准备一个含 \r\n 的文件（Windows 风格）
with open("win.txt", "wb") as f:
    f.write(b"line1\r\nline2\r\n")

# 默认 newline=None：读取时 \r\n 归一成 \n
with open("win.txt", "r", encoding="utf-8") as f:
    lines = f.readlines()
print(lines)
# 输出：['line1\n', 'line2\n']   （\r\n 变成了 \n）

# newline="\n"：不做转换，原样读
with open("win.txt", "r", encoding="utf-8", newline="\n") as f:
    lines = f.readlines()
print(lines)
# 输出：['line1\r\n', 'line2\r\n']   （保留了 \r\n）
```

**适合场景**：

- 写 CSV：`newline=""`。
- 跨平台处理文本：用默认 `newline=None`，让 Python 归一换行符。
- 需要保留原始换行符：`newline="\n"` 不转换。

### 2.12 closefd 参数：关闭时是否关闭底层描述符

`closefd` 控制文件对象 `close` 时是否同时关闭底层文件描述符（file descriptor）。默认 `True`。

当 `file` 传的是文件路径字符串时，`closefd` 只能是 `True`——文件对象自己创建了描述符，关闭时自然要关。`closefd` 有意义的场景是 `file` 传文件描述符（整数）时：

```python
import os

# 通过 os.open 拿到文件描述符（整数）
fd = os.open("fd_test.txt", os.O_RDWR | os.O_CREAT)

# 用 open 包装这个 fd，closefd=False 表示 close 时不关 fd
f = open(fd, "r+", closefd=False)
f.write("hello")
f.close()                  # 不会关闭 fd

# fd 仍然有效，可以再用
print(os.read(fd, 100))    # 能读到内容（但注意指针位置）
os.close(fd)               # 手动关闭 fd
```

`closefd=False` 让你能"借用"一个描述符给 `open` 包装，而不让 `open` 的 `close` 把原描述符关掉。这在"外部管理文件描述符生命周期、只想借用 open 的便利接口"时有用。

```python
# closefd=True（默认）：close 时也关 fd
fd = os.open("test.txt", os.O_RDONLY)
f = open(fd, "r", closefd=True)
f.close()
# fd 已被关闭，再 os.read(fd, ..) 会报错：Bad file descriptor
```

**日常用法几乎不会动 `closefd`**——99% 的场景传文件路径，`closefd` 保持默认 `True`。只在"从文件描述符构造、且不想让 close 关掉它"时才设 `False`。

### 2.13 opener 参数：自定义打开方式

`opener` 是一个可调用对象，用于替代默认的 `os.open` 来打开文件。它接收 `(path, flags)` 两个参数，返回一个文件描述符。这让 `open` 能对接自定义的打开逻辑。

```python
import os

# 自定义 opener：以指定权限 0o600 创建文件
def my_opener(path, flags):
    return os.open(path, flags, 0o600)   # 文件权限 600（只有所有者可读写）

# 用自定义 opener 打开
with open("secret.txt", "w", encoding="utf-8", opener=my_opener) as f:
    f.write("top secret")

# 文件权限是 600
print(oct(os.stat("secret.txt").st_mode & 0o777))
# 输出：0o600
```

默认 `open` 在 Linux 上创建文件的权限是 `0o666 & ~umask`（通常 `0o644`）。用自定义 `opener` 可以精确控制权限，比如创建只读文件、隐私文件等。

**适合场景**：

- 安全敏感场景：设置严格文件权限（如 `0o600`）。
- 特殊打开方式：使用 `O_NOFOLLOW`（不跟随符号链接）、`O_TMPFILE`（匿名临时文件）等。

```python
# 用 O_NOFOLLOW 防 symlink 攻击
def safe_opener(path, flags):
    return os.open(path, flags | os.O_NOFOLLOW)

try:
    with open("link.txt", "r", opener=safe_opener) as f:
        print(f.read())
except OSError as e:
    print(f"拒绝打开符号链接：{e}")
```

`opener` 是高阶参数，日常开发很少用到，但在安全、系统编程领域很有价值。

### 2.14 with 语句：自动关闭文件

`with` 语句是处理文件的推荐方式——它在代码块结束时自动调用 `close`，即使中间抛异常也能保证关闭。

```python
# ✅ with：自动 close，即使中间报错
with open("data.txt", "w", encoding="utf-8") as f:
    f.write("hello")
    raise ValueError("出错！")
    # 即使这里报错，文件也会被正确关闭

# ❌ 不用 with：忘记 close 或异常导致未 close
f = open("data.txt", "w", encoding="utf-8")
f.write("hello")
# 如果这里抛异常，close 永远不会被调用，文件可能残留或损坏
f.close()
```

`with` 之所以能自动关闭，是因为文件对象实现了上下文管理器协议（`__enter__`/`__exit__`），详见第 4 章原理。

**同时打开多个文件**：

```python
# 同时打开多个文件：用逗号分隔
with open("input.txt", "r", encoding="utf-8") as fin, \
     open("output.txt", "w", encoding="utf-8") as fout:
    for line in fin:
        fout.write(line.upper())
```

Python 3.10+ 支持括号写法，更清晰：

```python
# Python 3.10+：括号包裹多文件
with (
    open("input.txt", "r", encoding="utf-8") as fin,
    open("output.txt", "w", encoding="utf-8") as fout,
):
    for line in fin:
        fout.write(line.upper())
```

**`with` 的文件对象作用域**：`with` 块结束后文件已关闭，但变量 `f` 仍然存在（指向已关闭的文件对象）：

```python
with open("data.txt", "w", encoding="utf-8") as f:
    f.write("hello")
print(f.closed)          # True —— 已关闭
# f.read()               # ❌ ValueError: I/O operation on closed file
```

`with` 是最佳实践，后续所有示例默认使用这种写法。

### 2.15 实战场景一：写日志文件

日志追加是最常见的文件操作之一。用 `'a'` 模式追加，每条日志带时间戳：

```python
import time

def log(msg, file="app.log"):
    """写一条日志，追加到文件末尾"""
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    with open(file, "a", encoding="utf-8") as f:
        f.write(f"[{timestamp}] {msg}\n")

log("服务启动")
time.sleep(1)
log("处理请求 #1")
time.sleep(1)
log("服务停止")

with open("app.log", "r", encoding="utf-8") as f:
    print(f.read())
# 输出：
# [2026-07-23 10:00:00] 服务启动
# [2026-07-23 10:00:01] 处理请求 #1
# [2026-07-23 10:00:02] 服务停止
```

用 `'a'` 而非 `'w'`——`'w'` 会清空历史日志，`'a'` 保留。每次 `open`/`close` 开销不大，但不适合超高频日志（高频应该用一个常驻的文件对象或日志库）。

### 2.16 实战场景二：读取配置文件

配置文件通常是文本，用 `'r'` 模式逐行读取并解析：

```python
def load_conf(path):
    """读取 key=value 格式的配置文件"""
    config = {}
    with open(path, "r", encoding="utf-8") as f:
        for lineno, line in enumerate(f, start=1):
            line = line.strip()
            # 跳过空行和注释
            if not line or line.startswith("#"):
                continue
            if "=" not in line:
                print(f"第 {lineno} 行格式错误：{line}")
                continue
            key, val = line.split("=", 1)
            config[key.strip()] = val.strip()
    return config

# 假设 app.conf 内容：
# # 数据库配置
# host = 127.0.0.1
# port = 5432
# user = admin

conf = load_conf("app.conf")
print(conf)
# 输出：{'host': '127.0.0.1', 'port': '5432', 'user': 'admin'}
```

用 `'r'` 而非 `'r+'`——只读不会误改配置，安全。`for line in f` 逐行读，内存友好，大配置文件也能处理。

### 2.17 实战场景三：二进制图片处理

处理图片、视频等二进制文件必须用 `'b'` 模式：

```python
# 读取图片信息（前几个字节是文件头）
def image_format(path):
    """通过文件头判断图片格式"""
    with open(path, "rb") as f:
        header = f.read(8)           # 读前 8 字节
        if header.startswith(b"\xff\xd8"):
            return "JPEG"
        if header.startswith(b"\x89PNG"):
            return "PNG"
        if header.startswith(b"GIF8"):
            return "GIF"
        return "未知"

# 假设有个 JPEG 文件
print(image_format("photo.jpg"))
# 输出：JPEG
```

二进制模式下 `read` 返回 `bytes`，用 `startswith(b"...")` 判断文件头——这是判断文件类型的常见技巧（比看扩展名可靠）。

**大文件分块复制**：

```python
def copy_large(src_path, dst_path, chunk_size=64 * 1024):
    """分块复制大文件，避免一次性加载到内存"""
    with open(src_path, "rb") as src, open(dst_path, "wb") as dst:
        while True:
            chunk = src.read(chunk_size)
            if not chunk:
                break
            dst.write(chunk)
    print(f"复制完成：{src_path} -> {dst_path}")

copy_large("big_video.mp4", "backup.mp4")
# 输出：复制完成：big_video.mp4 -> backup.mp4
```

分块读写是处理大二进制文件的标准模式——`chunk_size` 取 64KB-1MB 之间通常性能最佳。`read(chunk_size)` 每次最多读这么多，内存占用恒定。

### 2.18 实战场景四：读写 JSON 文件

JSON 是文本数据交换的常见格式，用 `json` 模块配合 `open`：

```python
import json

# 写 JSON
data = {"name": "张三", "age": 30, "scores": [90, 85, 95]}
with open("profile.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

with open("profile.json", "r", encoding="utf-8") as f:
    print(f.read())
# 输出：
# {
#   "name": "张三",
#   "age": 30,
#   "scores": [90, 85, 95]
# }

# 读 JSON
with open("profile.json", "r", encoding="utf-8") as f:
    loaded = json.load(f)
print(loaded["name"])
# 输出：张三
```

`ensure_ascii=False` 让中文原样写入（否则会变成 `张三`），`indent=2` 让输出带缩进、可读性好。`json.dump`/`json.load` 的第二参数就是 `open` 返回的文件对象——`json` 模块内部调用文件对象的 `write`/`read` 方法。

### 2.19 实战场景五：用 r+ 原地修改文件内容

当需要修改文件中的少量内容且不希望重写整个文件时，`r+` 配合 `seek`/`write`/`truncate` 可以"原地"操作：

```python
# 把文件里的 "STATUS=pending" 改成 "STATUS=running"
with open("task.state", "w", encoding="utf-8") as f:
    f.write("STATUS=pending\nDATA=ready\n")

with open("task.state", "r+", encoding="utf-8") as f:
    content = f.read()
    new_content = content.replace("pending", "running")
    f.seek(0)                  # 回开头
    f.write(new_content)       # 覆盖写入（"running" 比 "pending" 多 1 字符）
    f.truncate()               # 截断到当前指针位置，防止残留

with open("task.state", "r", encoding="utf-8") as f:
    print(f.read())
# 输出：
# STATUS=running
# DATA=ready
```

`r+` 从开头覆盖写，`truncate()` 截断到指针位置——如果新内容更长或等长，这种原地改写可行。但如果要在中间插入内容（使后续内容后移），原地改写做不到——文件的字节是连续的，中间插入需要把后面所有内容后移，通常还是重写整个文件更简单。

### 2.20 常见搭配速查

把前面各节串起来，看几组常见搭配：

**读写文本**：`r`（读）、`w`（覆写）、`a`（追加）、`r+`（改）、`x`（新建）+ `encoding="utf-8"`。

**处理 CSV**：`w`/`r` + `encoding="utf-8"` + `newline=""`。

**读写二进制**：`rb`/`wb`/`ab`（+ `b` 后缀），不传 `encoding`。

**安全创建文件**：`x` 防覆盖。

**大文件处理**：分块 `read(chunk)` + `write(chunk)`。

**高并发日志**：`a` + `buffering=1`（行缓冲）或手动 `flush`。

**跨平台文本**：默认 `newline=None` 让 Python 归一换行符。

这些搭配覆盖了 90% 的文件操作场景，记住它们，遇到需求时对号入座即可。

---

## 3. 最佳实践

### 3.1 永远用 with 语句，不要手动 close

```python
# ✅ with：自动 close，异常安全
with open("data.txt", "r", encoding="utf-8") as f:
    content = f.read()

# ❌ 手动 close：忘记 close 或异常时不会关闭
f = open("data.txt", "r", encoding="utf-8")
try:
    content = f.read()
finally:
    f.close()

# ❌ 最危险：无 try 无 close
f = open("data.txt", "r", encoding="utf-8")
content = f.read()
# 如果上面这行报错，f 永远不会 close
f.close()
```

`with` 是处理文件的唯一推荐方式。它在代码块结束时（无论正常结束还是异常）自动 `close`，杜绝"忘记关闭"和"异常未关闭"两大类资源泄漏。

### 3.2 处理文本文件永远显式指定 encoding

```python
# ✅ 显式 encoding，跨平台一致
with open("data.txt", "r", encoding="utf-8") as f:
    ...

# ❌ 依赖平台默认，Windows 用 gbk、Linux 用 utf-8，跨平台乱码
with open("data.txt", "r") as f:
    ...
```

不指定 `encoding` 会用 `locale.getpreferredencoding()`，不同平台不同——在同一台机器上写的文件换台机器读就乱码。养成"文本文件必传 `encoding`"的习惯，首选 `utf-8`。

### 3.3 只读场景永远用 r，不要用 r+

```python
# ✅ 只读用 r：从机制上杜绝误写
with open("config.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# ❌ 只读用 r+：允许写，万一误调 write 会破坏文件
with open("config.json", "r+", encoding="utf-8") as f:
    data = json.load(f)
```

`'r+'` 允许写，一旦代码里误调 `write` 就会修改文件。只读场景用 `'r'`，`write` 会直接抛 `not writable`——这种"机制层面的保护"比"靠自觉"可靠。

### 3.4 追加用 a 不要用 w，用错会丢数据

```python
# ✅ 追加日志：a 保留历史
with open("app.log", "a", encoding="utf-8") as f:
    f.write(log_line)

# ❌ 追加误用 w：每次清空，历史日志全丢
with open("app.log", "w", encoding="utf-8") as f:
    f.write(log_line)
```

`'w'` 打开瞬间清空文件——这种破坏是静默的、即时的、不可恢复的。追加场景务必用 `'a'`。区分标准："要不要保留原内容"，要保留用 `'a'`，不要保留用 `'w'`。

### 3.5 二进制文件必须用 b 模式

```python
# ✅ 图片用 rb/wb：原样字节，不编解码
with open("photo.jpg", "rb") as f:
    data = f.read()

# ❌ 图片用 r/w：编解码会破坏二进制数据
with open("photo.jpg", "r") as f:      # 可能 UnicodeDecodeError
    data = f.read()
```

文本模式会尝试用 `encoding` 解码字节——二进制文件不是合法文本，解码要么报错要么篡改数据。任何非文本文件（图片、音频、视频、压缩包、可执行文件）都必须用 `'b'` 模式。

### 3.6 写 CSV 时传 newline=""

```python
# ✅ CSV 写入：newline="" 让 csv 模块自己处理换行
with open("data.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(...)

# ❌ 不传 newline：Windows 上 \n 被转成 \r\n，写出 \r\r\n 出现空行
with open("data.csv", "w", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(...)
```

`csv.writer` 自己写入 `\r\n` 作为行尾，如果 `open` 用默认 `newline=None`，Windows 上 `\n` 会被再转成 `\r\n`，变成 `\r\r\n`——文件里每行之间多一个空行。这是 CSV 写入最经典的坑。

### 3.7 大文件分块读写，不要一次性 read()

```python
# ✅ 分块读写：内存恒定
with open("big.bin", "rb") as f:
    while True:
        chunk = f.read(64 * 1024)      # 64KB
        if not chunk:
            break
        process(chunk)

# ❌ 一次性读取：大文件撑爆内存
with open("big.bin", "rb") as f:
    data = f.read()                    # 整个 10GB 文件塞进内存
```

`read()` 无参数时读取整个文件到内存。几 GB 的大文件会直接撑爆内存。分块 `read(chunk_size)` 让内存占用恒定为 chunk_size，是处理大文件的标准模式。如果逐行处理文本，用 `for line in f` 更自然。

### 3.8 逐行读文本用 for line in f，不要 readlines()

```python
# ✅ 逐行读：内存友好
with open("huge.log", "r", encoding="utf-8") as f:
    for line in f:
        process(line)

# ❌ readlines：整文件读成列表，大文件撑爆内存
with open("huge.log", "r", encoding="utf-8") as f:
    for line in f.readlines():         # 整个文件变成 list[str]
        process(line)
```

`for line in f` 是迭代器模式，逐行产出，内存只占一行。`readlines()` 一次性把所有行加载成列表——对大文件是灾难。小文件两者都行，但养成 `for line in f` 的习惯更安全。

### 3.9 写入后需要立即生效就 flush，不要依赖 close

```python
# ✅ 高频日志每条 flush：即使程序崩溃也不丢日志
with open("app.log", "a", encoding="utf-8") as f:
    for item in items:
        f.write(f"{item}\n")
        f.flush()                      # 立即落盘
        process(item)                  # 如果这里崩溃，日志还在

# ❌ 只靠 close：中间崩溃丢缓冲区里未写的数据
with open("app.log", "a", encoding="utf-8") as f:
    for item in items:
        f.write(f"{item}\n")
        process(item)                  # 崩溃时缓冲区数据丢失
```

缓冲区的数据在 `close` 之前不会落盘——程序意外退出（崩溃、kill）会丢数据。对"绝不能丢"的日志，每次写后 `flush`。或者用 `buffering=1`（行缓冲），每行自动 flush。

### 3.10 不要用文件对象的可读性来判断是否可写

```python
# r+ 打开后，不要假设"能读就能写"——读写切换要 seek
with open("data.txt", "r+", encoding="utf-8") as f:
    f.read()                  # 读完后指针在末尾
    f.write("x")              # 写在末尾！不是开头
    # 想"读后从头写"必须 f.seek(0)

# ✅ 明确 seek 后再写
with open("data.txt", "r+", encoding="utf-8") as f:
    content = f.read()
    f.seek(0)
    f.write("new content")
    f.truncate()
```

`+` 模式下读写共享一个文件指针——读会推进指针，写也在指针位置。读完后写的位置是"读到的末尾"，不是文件开头。读写切换时务必显式 `seek`，避免写错位置。

### 3.11 跨平台路径用 pathlib，不要拼字符串

```python
# ✅ pathlib：跨平台、面向对象
from pathlib import Path
p = Path("data") / "config.json"
with p.open("r", encoding="utf-8") as f:
    ...

# ❌ 字符串拼接：平台分隔符不同，易错
import os
p = os.path.join("data", "config.json")
with open(p, "r", encoding="utf-8") as f:
    ...
```

`pathlib.Path` 的 `open` 方法等价于内置 `open`，但路径处理更优雅、跨平台更安全。现代 Python 推荐用 `pathlib` 管理路径（详见《pathlib 路径操作》）。

---

## 4. 原理

### 4.1 open 的返回类型：TextIOWrapper vs BufferedReader

`open` 在文本模式和二进制模式下返回不同类型的对象，它们位于不同的 I/O 层：

```python
# 文本模式：返回 TextIOWrapper
f = open("test.txt", "r", encoding="utf-8")
print(type(f))
# <class '_io.TextIOWrapper'>

# 二进制模式：返回 BufferedReader（读）或 BufferedWriter（写）
fb = open("test.txt", "rb")
print(type(fb))
# <class '_io.BufferedReader'>
```

这源于 Python 的 I/O 分层架构：

```
 TextIOWrapper   ← 文本模式的最外层（编解码 + 换行转换）
      ↑
BufferedReader / BufferedWriter  ← 二进制模式的缓冲层
      ↑
FileIO   ← 最底层：直接系统调用 read/write
```

- `FileIO`：直接调用操作系统的 `read`/`write`，处理原始字节。
- `BufferedReader`/`BufferedWriter`：在 `FileIO` 上加缓冲，减少系统调用。
- `TextIOWrapper`：在 `BufferedIOBase` 上加编解码和换行转换。

`open("file", "r")` 实际返回的是一个 `TextIOWrapper`，它内部包了一个 `BufferedReader`，后者又包了一个 `FileIO`。文本模式的 `encoding`/`errors`/`newline` 都由 `TextIOWrapper` 处理——这就是为什么二进制模式下这些参数不生效（没有 `TextIOWrapper` 这一层）。

```python
# 验证层级关系
f = open("test.txt", "r", encoding="utf-8")
print(type(f))                          # TextIOWrapper
print(type(f.buffer))                   # BufferedReader
print(type(f.buffer.raw))               # FileIO
```

### 4.2 mode 到系统调用 flags 的映射

`open` 的 `mode` 字符串最终要映射到底层操作系统的 `open(flags)` 系统调用。CPython 的映射大致如下：

| mode | 底层 flags（Linux）               | 含义               |
| ---- | --------------------------------- | ------------------ |
| `r`  | `O_RDONLY`                        | 只读               |
| `w`  | `O_WRONLY \| O_CREAT \| O_TRUNC`  | 只写 + 创建 + 截断 |
| `a`  | `O_WRONLY \| O_CREAT \| O_APPEND` | 只写 + 创建 + 追加 |
| `x`  | `O_WRONLY \| O_CREAT \| O_EXCL`   | 只写 + 创建 + 排他 |
| `r+` | `O_RDWR`                          | 读写               |
| `w+` | `O_RDWR \| O_CREAT \| O_TRUNC`    | 读写 + 创建 + 截断 |
| `a+` | `O_RDWR \| O_CREAT \| O_APPEND`   | 读写 + 创建 + 追加 |
| `x+` | `O_RDWR \| O_CREAT \| O_EXCL`     | 读写 + 创建 + 排他 |

几个关键 flags 的语义：

- `O_CREAT`：文件不存在时创建。
- `O_TRUNC`：文件存在时截断为 0（`w`/`w+` 的清空行为由此而来）。
- `O_APPEND`：每次写都定位到文件末尾（`a`/`a+` 的追加行为由此而来）。
- `O_EXCL`：与 `O_CREAT` 组合时，文件已存在则失败（`x`/`x+` 的排他行为由此而来）。

**`O_APPEND` 解释了 a 模式 seek 无效**：

```python
# a 模式下即使 seek(0)，写仍在末尾
with open("log.txt", "a", encoding="utf-8") as f:
    f.seek(0)
    f.write("仍在末尾")
```

因为 `O_APPEND` 保证"每次 write 前操作系统自动把指针移到末尾"——这是内核层面的原子操作，`seek` 改变的是用户态指针，但 `write` 系统调用时内核会重置指针到末尾。所以 `a` 模式下 `seek` 对写无效。

**`O_TRUNC` 解释了 w 模式立即清空**：

```python
# w 模式打开瞬间，O_TRUNC 立即截断文件
f = open("data.txt", "w", encoding="utf-8")
# 此刻 data.txt 已经是 0 字节，即使还没 write
f.write("new")
f.close()
```

`O_TRUNC` 在系统调用 `open` 返回时就被内核执行——文件截断发生在 `open` 返回之前，早于任何 `write`。这就是"打开即清空"的底层原因。

### 4.3 文本模式的换行转换机制

`TextIOWrapper` 在读写时会做换行符转换。这一机制涉及"通用换行"（Universal Newlines）概念。

**写入转换**：当 `newline` 是 `None`（默认）时，写入的 `\n` 会被替换成 `os.linesep`（Windows 上是 `\r\n`）。这是为了让"代码里统一用 `\n`"在不同平台写出符合该平台惯例的文件。

```python
# Windows 上，newline=None
f.write("a\nb")     # 实际写入磁盘的是 a\r\nb
```

底层流程：

1. `TextIOWrapper.write("a\nb")` 接收字符串。
2. 检测到 `\n`，转成 `\r\n`（Windows 上 `os.linesep`）。
3. 编码成字节，交给 `BufferedWriter`。

**读取转换**：当 `newline` 是 `None` 或 `""` 时，读取时 `\r\n`、`\r`、`\n` 都被归一成 `\n`。这是"通用换行"——无论文件用哪种换行符，读出来都是 `\n`，代码跨平台一致。

```python
# 读取时通用换行
content = f.read()   # 文件里的 \r\n、\r、\n 都变成 \n
```

底层流程：

1. `BufferedReader` 读入原始字节。
2. `TextIOWrapper` 解码成字符串。
3. 扫描换行符：`\r\n`、`\r`、`\n` 统一替换成 `\n`（当 `newline` 是 `None`/`""` 时）。

**`newline=""` 的特殊之处**：写入不转换，但读取仍做通用换行。这是 CSV 写入要求 `newline=""` 的原因——`csv.writer` 自己写 `\r\n`，不需要 `open` 再转换；但读 CSV 时通用换行仍把 `\r\n` 归一成 `\n` 不影响。

### 4.4 缓冲机制：为什么 close 前数据可能没落盘

`BufferedWriter` 维护一个内存缓冲区，`write` 先写缓冲区，缓冲区满或 `flush`/`close` 时才真正调用底层 `FileIO.write` 写盘。这个机制减少系统调用次数——每次 `write` 不必都陷入内核。

```
 write("a")  →  写入内存缓冲区
 write("b")  →  写入内存缓冲区
 ... 缓冲区满 ...
               →  一次系统调用写入磁盘（批量）
 close()     →  flush 剩余缓冲区 → 写入磁盘
```

**缓冲区大小**：默认 `io.DEFAULT_BUFFER_SIZE`（通常 4096 或 8192 字节）。`buffering` 参数控制：`-1` 用默认，`0` 关闭（仅二进制），`1` 行缓冲（仅文本），`>1` 自定义大小。

**行缓冲（buffering=1）的实现**：`TextIOWrapper` 检测到写入内容含 `\n` 时，自动 `flush`。这让"每行日志立即落盘"成为可能——即使不手动 flush，行缓冲也会在换行符时 flush。

**`flush` 与 `close` 的关系**：`close` 内部会先 `flush`——所以正常 `close` 后数据一定落盘。但异常退出（如 `os._exit`、段错误）不会执行 `close`，缓冲区数据丢失。这是"日志要 flush"的底层原因。

**`flush` 不等于物理落盘**：`flush` 只把数据交给操作系统内核缓冲，内核何时写磁盘由 OS 决定。要确保物理落盘，用 `os.fsync(f.fileno())`：

```python
with open("critical.data", "w", encoding="utf-8") as f:
    f.write("important")
    f.flush()                       # 交给 OS
    os.fsync(f.fileno())            # 强制 OS 写盘
```

### 4.5 with 语句与上下文管理器协议

`open` 返回的文件对象实现了上下文管理器协议（`__enter__`/`__exit__`），这正是 `with` 能自动 `close` 的原理。

```python
# with 的等价展开
with open("data.txt", "r") as f:
    content = f.read()

# 等价于：
f = open("data.txt", "r")
f.__enter__()                # 返回 f 自身（文件对象）
try:
    content = f.read()
finally:
    f.__exit__(...)          # 内部调用 f.close()
```

文件对象的 `__enter__` 返回 `self`（自己），`__exit__` 调用 `close()`：

```python
# 简化的文件对象 __enter__ / __exit__
class File:
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()         # 无论是否异常，都关闭
        return False         # 不抑制异常
```

`__exit__` 在 `with` 块结束时被调用——无论是正常结束还是抛异常（异常信息通过 `exc_type`/`exc_val`/`exc_tb` 传入）。`__exit__` 返回 `False` 表示不抑制异常，原始异常继续往上抛。

**这就是 with 的"异常安全"保证**：

```python
# 即使 with 块内抛异常，__exit__ 也会被调用，文件被关闭
with open("data.txt", "w") as f:
    f.write("partial")
    raise ValueError("出错")   # __exit__ 被调用，f.close() 执行
```

没有 `with`，你需要手写 `try/finally` 才能达到同样效果——`with` 把这种样板简化成一行语法。

### 4.6 r+ 和 w+ 的本质差异：O_TRUNC

`r+` 和 `w+` 都是可读写，区别在于"是否截断文件"——底层差一个 `O_TRUNC` flag。

| 模式 | 底层 flags                     | 截断？         |
| ---- | ------------------------------ | -------------- |
| `r+` | `O_RDWR`                       | 否（保留内容） |
| `w+` | `O_RDWR \| O_CREAT \| O_TRUNC` | 是（清空）     |

```python
# r+：不截断，读出原内容
with open("test.txt", "w") as f:
    f.write("original")

with open("test.txt", "r+", encoding="utf-8") as f:
    print(f.read())           # original（保留）

# w+：截断，文件被清空
with open("test.txt", "w+", encoding="utf-8") as f:
    print(f.read())           # ''（已清空）
```

`r+` 只打开、不清空——你想"读出来、改一改、写回去"用 `r+`。`w+` 打开即清空——你想"从零写一个新文件、写完顺便读"用 `w+`。底层就差一个 `O_TRUNC`，但语义天差地别。

同样，`a+` 底层有 `O_APPEND`——即使加了 `+` 可读，写仍追加末尾，与 `r+`（写从指针位置覆盖）行为不同。`mode` 字符串的每一个字符都对应一个底层 flag，组合起来决定了完整行为。

---

## 5. 总结

### 5.1 本文内容回顾

- **open 是文件操作入口**：`open(file, mode, encoding, errors, buffering, newline, closefd, opener)` 返回文件对象，所有读写都通过它进行。`mode` 决定"怎么打开"，是最核心也最易错的参数。

- **四种基础模式**：`r` 只读（文件不存在报错）、`w` 只写（清空）、`a` 追加（末尾写）、`x` 排他创建（已存在报错）。每种模式对"文件不存在"和"文件存在"的行为不同，选错会导致数据丢失或意外报错。

- **两个修饰符**：`+` 加可读写能力（不改变基础模式的截断/报错/指针行为）、`b` 切换二进制模式（读写 `bytes`、不编解码、不转换换行）。组合出 12 种有效模式。

- **文本 vs 二进制**：文本模式经编解码、做换行转换、按字符操作、需 `encoding`；二进制模式原样字节、无转换、按字节操作、`encoding`/`errors`/`newline` 不生效。文本文件用文本模式，二进制文件用二进制模式，用错会坏数据。

- **encoding 跨平台**：不指定 `encoding` 用平台默认（Windows gbk、Linux utf-8），跨平台乱码。文本文件永远显式传 `encoding="utf-8"`。

- **errors 策略**：`strict`（报错，默认）、`ignore`（跳过）、`replace`（替换符）、`backslashreplace`（转义）。读取编码不确定的文件时按需选择，容忍乱码用 `replace`/`ignore`。

- **buffering 缓冲**：`-1` 默认、`0` 无缓冲（仅二进制）、`1` 行缓冲（仅文本）、`>1` 自定义大小。缓冲减少系统调用，但 `close` 前数据可能未落盘；需立即生效用 `flush` 或行缓冲。

- **newline 换行转换**：默认 `None` 写入转平台换行符、读取归一成 `\n`；写 CSV 用 `newline=""` 不转换；保留原始换行符用 `newline="\n"`。

- **closefd / opener**：`closefd=False` 让 close 不关底层 fd（高级用法）；`opener` 自定义打开函数，可控制文件权限或使用特殊 flag（如 `O_NOFOLLOW`）。

- **with 语句**：推荐写法，代码块结束自动 `close`，异常安全。基于文件对象实现的上下文管理器协议（`__enter__`/`__exit__`）。

- **实战场景**：写日志用 `a`、读配置用 `r`、改文件用 `r+`、新建文件用 `x`、二进制用 `b`、CSV 用 `newline=""`、大文件分块读写。

### 5.2 读完本文你应能掌握

- 说出 `r`/`w`/`a`/`x` 四种基础模式在"文件不存在"和"文件存在"时的行为差异，并据此正确选型（只读用 `r`、覆写用 `w`、追加用 `a`、安全新建用 `x`）。

- 解释 `+` 和 `b` 两个修饰符的作用，说出 `r+` 与 `w+`、`a+` 与 `r+` 的区别（`+` 不改基础行为，只加读写能力；`w+` 截断而 `r+` 不截断；`a+` 写仍追加末尾）。

- 说明文本模式与二进制模式在数据类型、编解码、换行转换、`seek` 单位、`read(n)` 单位上的差异，并据此选择正确模式（文本文件用文本模式，二进制文件用 `b` 模式）。

- 说明为何处理文本文件要显式传 `encoding="utf-8"`（平台默认不一致导致跨平台乱码），并说出 `errors` 各取值（`strict`/`ignore`/`replace`）的适用场景。

- 解释 `buffering` 参数各值的含义，说明为何 `close` 前数据可能未落盘，并知道用 `flush` 或行缓冲保证日志即时写入。

- 说明 `newline` 参数的换行转换机制，并解释为何写 CSV 要传 `newline=""`（避免 Windows 上 `\n` 被再转成 `\r\n` 导致空行）。

- 用 `with` 语句正确打开和关闭文件，并解释其异常安全原理（基于上下文管理器协议，`__exit__` 调用 `close`）。

- 写出常见场景的文件操作代码：写日志（`a`）、读配置（`r` 逐行）、改文件（`r+` + `seek` + `truncate`）、二进制复制（`rb`/`wb` 分块）、读写 JSON（`json.dump`/`load` + `open`）。

- 说明 `mode` 字符串如何映射到底层系统调用 flags（`O_TRUNC`/`O_APPEND`/`O_EXCL`），并据此解释 `w` 的立即清空、`a` 的 `seek` 无效、`x` 的防覆盖行为。

### 5.3 延伸方向

- **pathlib 路径操作**：`Path.open()` 等价于内置 `open` 但路径处理更优雅，跨平台更安全，见《pathlib 路径操作》。

- **with 语句与上下文管理器**：`with` 的完整语法、`__enter__`/`__exit__` 协议、自定义上下文管理器，见《with 语句与上下文管理器》。

- **json 模块**：`json.dump`/`load` 与文件对象的配合，处理 JSON 配置和数据交换，见《json 模块》。

- **csv 模块**：`csv.writer`/`reader` 与 `open` + `newline=""` 的标准搭配，见《csv 模块》。

- **pickle 序列化**：用二进制模式 `wb`/`rb` 读写 pickle 对象，见《pickle 序列化》。

- **os 模块文件操作**：`os.open`/`os.read`/`os.write` 底层文件描述符操作，`os.fsync` 物理落盘，见《os 模块文件操作》。

- **io 模块**：`StringIO`/`BytesIO` 内存文件对象，与真实文件对象接口一致但操作内存，见《io 模块》。
