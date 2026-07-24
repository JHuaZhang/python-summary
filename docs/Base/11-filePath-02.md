---
group:
  title: 【11】文件与路径操作
  order: 11
order: 2
title: 文件读写方法
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是文件读写方法

在 Python 中，`open()` 函数返回一个文件对象（通常是 `io.TextIOWrapper` 或 `io.BufferedRandom` 等具体实现），这个对象上挂载了一系列用于读写数据的方法。我们在《open 函数与 mode 参数》中学会了如何用不同的 mode 打开文件，但真正"把数据搬进搬出"的动作，全靠这些读写方法完成。

文件读写方法大致可以分为四类：

- **读取方法**：`read()`、`readline()`、`readlines()`——把文件内容读入程序内存。
- **写入方法**：`write()`、`writelines()`——把程序中的数据写入文件。
- **状态判断方法**：`readable()`、`writable()`、`seekable()`、`closed`、`fileno()`——查询文件对象当前的能力与状态。
- **迭代与缓冲控制**：`for line in f` 迭代协议、`flush()`、`tell()`、`seek()`——用于大文件惰性读取和缓冲区管理。

理解这些方法的关键在于：文件对象并不只是一个"管道"，它内部维护着**一个文件指针（光标位置）**和**一个缓冲区**，读写方法的行为都围绕这两个内部状态展开。读 methods 从指针位置往后读、读完后指针后移；写 methods 在指针位置写入、并把数据先放进缓冲区、择机刷到磁盘。

```python
# 最小示例：打开文件 → 读取 → 关闭
with open("demo.txt", "w", encoding="utf-8") as f:
    f.write("hello\nworld\n")

with open("demo.txt", "r", encoding="utf-8") as f:
    print(f.read())  # 一次性读全部
# 输出：
# hello
# world
```

上面这个最小示例串起了写和读两条线：先用 `write()` 写入两行文本，再用 `read()` 一次性读回。看起来很简单，但背后涉及指针定位、缓冲刷新、编码解码等多个环节，这正是本篇要深入展开的内容。

### 1.2 文件对象的读写位置指针

几乎所有读写方法都依赖"文件指针"这一概念。文件指针是文件对象内部维护的一个整数，表示**下一次读或写将从文件的哪一个字节（或字符）开始**，可以理解成编辑器里闪烁的光标。

```python
with open("demo.txt", "w", encoding="utf-8") as f:
    f.write("abcdef")  # 写入 6 个字符，指针移动到 6

with open("demo.txt", "r", encoding="utf-8") as f:
    print(f.tell())      # 0，刚打开读模式指针在开头
    print(f.read(3))     # abc，读 3 个字符，指针到 3
    print(f.tell())      # 3
    print(f.read())      # def，从 3 读完剩余
    print(f.tell())      # 6
```

`tell()` 返回当前指针位置（文本模式下是"逻辑字符偏移邀请"，不一定等于字节数；二进制模式下是字节数）。每次 `read` 或 `write` 调用都会把指针向后推移，推移的距离正好等于本次读取/写入的数据量。这一机制决定了：**同一个文件对象上连续调用 `read()` 不会重置到开头，而是接着上次的位置继续**，这是新手最容易忽略的点。

### 1.3 文本模式与二进制模式的方法差异

`open()` 的 mode 参数决定文件以文本模式（默认，含 `'r'`/`'w'`/`'a'` 等）还是二进制模式（带 `'b'`，如 `'rb'`/`'wb'`）打开。这两种模式下，读写方法的**参数类型和返回类型不同**：

| 维度              | 文本模式（如 `'r'`/`'w'`） | 二进制模式（如 `'rb'`/`'wb'`） |
| ----------------- | -------------------------- | ------------------------------ |
| 读 `read()` 返回  | `str`（字符）              | `bytes`（字节序列）            |
| 写 `write()` 接收 | `str`                      | `bytes`                        |
| 换行处理          | 平台换行符自动转换为 `\n`  | 原样读写，不转换               |
| 编码              | 涉及 `encoding` 解码/编码  | 无编码概念，按字节处理         |
| 指针单位          | 字符偏移（逻辑）           | 字节偏移（物理）               |

```python
# 文本模式：返回 str
with open("demo.txt", "wb") as f:
    f.write("中文".encode("utf-8"))  # 写入字节

with open("demo.txt", "r", encoding="utf-8") as f:
    data = f.read()
    print(type(data), data)  # <class 'str'> 中文

# 二进制模式：返回 bytes
with open("demo.txt", "rb") as f:
    data = f.read()
    print(type(data), data)  # <class 'bytes'> b'\xe4\xb8\xad\xe6\x96\x87'
```

本篇讲解每个方法时会同时说明它在两种模式下的表现差异。在实际工程中，处理文本（日志、CSV、配置）用文本模式；处理图片、压缩包、序列化二进制协议用二进制模式——选错模式就会遇到 `TypeError` 或编码乱码。

---

## 2. 核心内容

### 2.1 read()：一次性或分块读取

`read()` 是最基础的读取方法，用于从当前指针位置开始读取数据。

**方法签名**：

```python
file.read(size=-1)
```

- `size`：要读取的字符数（文本模式）或字节数（二进制模式）。默认 `-1` 表示读到文件末尾。
- 返回值：文本模式返回 `str`，二进制模式返回 `bytes`。如果指针已在末尾，返回空字符串 `''` 或空字节 `b''`。

`read()` 的行为随 `size` 传不传而明显不同，这是必须掌握的核心差异：

- **不传 `size`（或传 `-1`）**：把文件从指针到末尾的全部内容一次性读入内存。小文件可以这么做；大文件会瞬间吃满内存，绝对要避免。
- **传正整数 `size`**：只读 `size` 个字符/字节。如果剩余内容不足 `size` 个，则读到文件尾为止，返回比 `size` 短的内容。这种"分块读取"是处理大文件的标准手段。

**demo：对比两种用法**

```python
with open("demo.txt", "w", encoding="utf-8") as f:
    f.write("Python文件读写\n方法详解\n")

# 用法一：不传 size，一次读完
with open("demo.txt", "r", encoding="utf-8") as f:
    content = f.read()
    print(repr(content))
# 输出：'Python文件读写\n方法详解\n'

# 用法二：传 size，分块读
with open("demo.txt", "w", encoding="utf-8") as f:
    f.write("Python文件读写方法详解")  # 14 个字符：6 ASCII + 8 中文

with open("demo.txt", "r", encoding="utf-8") as f:
    chunk1 = f.read(6)   # 读 6 个字符
    chunk2 = f.read(6)   # 接着读 6 个字符
    chunk3 = f.read(6)   # 剩余 2 个字符，不足 6 个，读到末尾
    print(repr(chunk1), repr(chunk2), repr(chunk3))
# 输出：'Python' '文件读写方法' '详解'
```

注意第二次 `read(6)` 读到的 `'文件读写\n'` 只有 6 个字符（每个汉字算一个字符，`\n` 也算一个），而不是 6 个字节——这是文本模式的关键特征。如果换成二进制模式 `f.read(6)`，则读到的是前 6 个字节。

**真实场景：分块读取大日志文件计算行数**

```python
def count_newlines(path, chunk_size=8192):
    """分块读取大文件，统计换行符个数以近似行数。"""
    total = 0
    with open(path, "rb") as f:  # 二进制模式，按字节读，效率高
        while True:
            chunk = f.read(chunk_size)
            if not chunk:        # 读到空 bytes，说明文件结束
                break
            total += chunk.count(b"\n")
    return total

# 假设 access.log 有数百万行
# print(count_newlines("access.log"))
```

这个 demo 展示了 `read(size)` 的典型用法：用一个固定大小的缓冲（这里是 8192 字节，即 8KB）循环读取，每次只把一小段数据加载进内存，从而处理任意大的文件。循环退出条件是 `read()` 返回空 `bytes`——这是判断文件读到末尾的标准信号。

**参数为 0 的特殊情况**

```python
with open("demo.txt", "r", encoding="utf-8") as f:
    data = f.read(0)
    print(repr(data))  # ''，读 0 个字符总是返回空字符串，不动指针
```

传 `0` 不会报错，总是返回空字符串/空字节，指针位置也不变。实际编程中极少这么用，了解即可。

### 2.2 readline()：逐行读取

`readline()` 每次调用读取一行，读到换行符为止（包括换行符本身）。这是按行处理文本文件最直接的方法。

**方法签名**：

```python
file.readline(size=-1)
```

- `size`：可选，本次最多读取的字符/字节数。即使没遇到换行，读到 `size` 个字符也会停下。
- 返回值：一行文本（含末尾换行符），若指针已到文件末尾则返回空字符串 `''`。

`readline()` 与 `read()` 的本质区别在于"停止条件"：`read()` 只在文件末尾或读满 `size` 时停，而 `readline()` 遇到换行符就停——哪怕一行只有几个字符。这使得它天然适合"按行解析"的文本格式（CSV、JSONL、INI、日志）。

**demo：逐行读取配置文件**

```python
# 先准备一个模拟的配置文件
config_text = """host=127.0.0.1
port=8080
debug=true
"""

with open("config.ini", "w", encoding="utf-8") as f:
    f.write(config_text)

with open("config.ini", "r", encoding="utf-8") as f:
    while True:
        line = f.readline()
        if not line:          # 空字符串 => 文件结束
            break
        key, value = line.strip().split("=")
        print(f"配置项: {key} => {value}")
# 输出：
# 配置项: host => 127.0.0.1
# 配置项: port => 8080
# 配置项: debug => true
```

注意三个细节：第一，`readline()` 返回的字符串包含行尾的 `\n`，所以上面用 `strip()` 去掉；第二，判断文件读完的标准是返回空字符串 `''`，而不是只含换行符的 `'\n'`（后者是空行，仍然算一行内容）；第三，最后一行如果是 `debug=true` 但没有结尾换行，`readline()` 依然能正确返回它，不会丢失。

**size 参数的行为**

```python
with open("demo.txt", "w", encoding="utf-8") as f:
    f.write("Python编程\n文件读写")

with open("demo.txt", "r", encoding="utf-8") as f:
    print(repr(f.readline(4)))   # 'Pyth'，限制读取 4 个字符
    print(repr(f.readline()))    # 'on编程\n'，读到本行结束
    print(repr(f.readline()))    # '文件读写'，第二行无换行符也能读到
    print(repr(f.readline()))    # ''，已到末尾
```

`readline(size)` 的语义是"读到换行符或 `size` 个字符，谁先到就停"。它不会跨行读取，即使 `size` 比一行还长，最多也只读到本行末尾。

### 2.3 readlines()：读取所有行到列表

`readlines()` 一次性读取整个文件，按行切分，返回一个列表，每个元素是文件的一行（含换行符）。

**方法签名**：

```python
file.readlines(hint=-1)
```

- `hint`：可选，读取到累计字符数达到 `hint` 后停止（实际会多读到当前行末尾）。默认 `-1` 读全部。
- 返回值：`list[str]`（文本模式）或 `list[bytes]`（二进制模式）。

`readlines()` 看起来方便，但它有一个尖锐的副作用：**整个文件会被读入内存**。一个 5GB 的日志文件 `readlines()` 出来，就是几百万个字符串的列表，内存瞬间爆炸。所以 `readlines()` 只适合小文件或已知行数可控的场景。

**demo：批量处理 CSV 表头与数据行**

```python
csv_text = """id,name,score
1,张三,92
2,李四,85
3,王五,78
"""

with open("students.csv", "w", encoding="utf-8") as f:
    f.write(csv_text)

with open("students.csv", "r", encoding="utf-8") as f:
    lines = f.readlines()       # 一次性读成列表
    header = lines[0].strip().split(",")
    print(header)               # ['id', 'name', 'score']
    for line in lines[1:]:
        sid, name, score = line.strip().split(",")
        print(f"{name} 同学分数：{score}")
# 输出：
# ['id', 'name', 'score']
# 张三 同学分数：92
# 李四 同学分数：85
# 王五 同学分数：78
```

这里利用 `readlines()` 把所有行切成列表后，用索引 `lines[0]` 拿表头、`lines[1:]` 遍历数据行，这是小文件 CSV 处理的典型写法。注意每行末尾都有 `\n`，如果不 `strip()`，`split(",")` 的最后一个字段会带上换行符，导致后续比较出错。

**hint 参数的实际用途**

`hint` 设计的初衷是"只读前面一部分行就够"的场景，能避免把整个文件读进内存——但实现上是"读够 `hint` 个字符就返回"，并不能精确控制行数。

```python
with open("students.csv", "r", encoding="utf-8") as f:
    # hint=15：累计读到约 15 个字符就停，实际会多读到当前行末尾
    first_few = f.readlines(15)
    print(first_few)
# 输出（取决于实际字符数）：
# ['id,name,score\n']
```

日常编程几乎用不到 `hint`，了解其调用语义即可。

### 2.4 三种读取方法的对比与选择

`read()`、`readline()`、`readlines()` 三者各有所长，选择哪一个取决于文件大小和处理需求：

| 方法            | 返回类型             | 内存占用 | 典型场景                              |
| --------------- | -------------------- | -------- | ------------------------------------- |
| `read()`        | 整个内容的 str/bytes | 整个文件 | 小文件一次性处理、二进制内容          |
| `readline()`    | 一行的 str/bytes     | 一行     | 逐行解析、不需要索引访问              |
| `readlines()`   | list[str/bytes]      | 整个文件 | 小文件需要随机访问某行、表头/数据分离 |
| `for line in f` | 每次一行             | 一行     | 大文件惰性逐行处理（推荐默认写法）    |

```python
# 同一个文件，四种读取方式对比
import io

content = "line1\nline2\nline3\n"
f = io.StringIO(content)

# 方式一：read() 一次读完
print("read():", repr(f.read()))

f.seek(0)
# 方式二：readline() 循环
print("readline():", repr(f.readline()), repr(f.readline()), repr(f.readline()))

f.seek(0)
# 方式三：readlines() 一次读成列表
print("readlines():", f.readlines())

f.seek(0)
# 方式四：for 迭代（推荐）
print("迭代:", [repr(line) for line in f])
```

对一个几百 MB 甚至更大的日志文件，绝不要用 `read()` 或 `readlines()`，而要用 `for line in f` 这种迭代方式——下面 2.5 节会详细展开。

### 2.5 for line in f：文件对象的迭代器协议

在 Python 中，文件对象本身就是可迭代的——对它执行 `for line in f`，会**每次惰性地读取一行**，内存里始终只保留当前这一行。这是处理大文件最 Pythonic、最省内存的写法。

**demo：统计大日志文件中 ERROR 出现的行**

```python
# 模拟一个大日志文件（这里用小文件示例逻辑是一样的）
log_text = """INFO  服务启动
WARN  内存使用率偏高
ERROR 数据库连接失败
INFO  正在重试
ERROR 重试失败，退出
"""

with open("app.log", "w", encoding="utf-8") as f:
    f.write(log_text)

errors = []
with open("app.log", "r", encoding="utf-8") as f:
    for line in f:                      # 文件对象可迭代，逐行读
        if line.startswith("ERROR"):
            errors.append(line.strip())
print(f"找到 {len(errors)} 条错误：")
for e in errors:
    print(" -", e)
# 输出：
# 找到 2 条错误：
#  - ERROR 数据库连接失败
#  - ERROR 重试失败，退出
```

即使 `app.log` 有几十 GB，这段代码的内存占用也恒定在"一行文本"的量级，因为文件迭代器是惰性的——每次只调用一次内部的 `readline()`，把上一行丢弃，再读下一行。

**迭代器协议的底层含义**

文件对象实现了 `__iter__()` 和 `__next__()` 两个协议方法：`__iter__()` 返回文件对象自身（所以它就是自己的迭代器），`__next__()` 调用一次内部的 `readline()`。当 `readline()` 返回空字符串（文件结束），`__next__()` 抛出 `StopIteration`，`for` 循环捕获后正常退出。

```python
with open("app.log", "r", encoding="utf-8") as f:
    print(iter(f) is f)   # True，文件对象是自身的迭代器
    print(next(f))        # 等价于 f.readline()
    print(next(f))        # 再读一行
# 输出：
# True
# INFO  服务启动
#
# WARN  内存使用率偏高
#
```

这意味着 `next(f)` 和 `f.readline()` 效果几乎一样，区别在于文件结束时 `readline()` 返回 `''` 而 `next(f)` 抛 `StopIteration`。理解这一点有助于理解 `for line in f` 为什么既简洁又安全。

**重要提醒：迭代会消费文件指针**

```python
with open("app.log", "r", encoding="utf-8") as f:
    for line in f:
        print(line, end="")
    # 在同一个文件对象上再迭代一次
    for line in f:        # 不会进入循环！指针已到末尾
        print("再读:", line)
# 输出：第一遍正常，第二遍什么也不打印
```

因为迭代器协议是"一次性消费"的，迭代结束后指针停在文件末尾，第二次 `for` 直接拿到 `StopIteration`。如果要重新遍历，要么重新 `open()`，要么用 `f.seek(0)` 把指针拨回开头。

### 2.6 write()：写入字符串或字节串

`write()` 把一段数据写入文件，是和 `read()` 对应的最基础写入方法。

**方法签名**：

```python
file.write(s)
```

- `s`：要写入的内容。文本模式接收 `str`，二进制模式接收 `bytes`。类型传错会直接 `TypeError`。
- 返回值：实际写入的字符数（文本模式）或字节数（二进制模式）。注意这不是 `None`，很多新手会忽略这个返回值。

`write()` 有几个关键点容易被忽略：

1. **它不会自动加换行符**。和 `print()` 不同，`write("a"); write("b")` 写出来的是 `ab` 而不是 `a\nb`。需要换行必须自己拼 `\n`。
2. **返回值是真实的写入量**。文本模式下由于编码，字符数和字节数可能不等。
3. **写入的数据先进入缓冲区**，不一定立刻落到磁盘，需要 `flush()` 或关闭文件、缓冲区满才落盘。

**demo：批量写入 CSV 数据**

```python
records = [
    ("张三", 92, "数学"),
    ("李四", 85, "物理"),
    ("王五", 78, "化学"),
]

with open("scores.csv", "w", encoding="utf-8") as f:
    f.write("name,score,subject\n")          # 手动写表头
    for name, score, subject in records:
        line = f"{name},{score},{subject}\n"
        n = f.write(line)                    # 返回写入的字符数
        print(f"写入了 {n} 个字符：{line!r}")
# 输出：
# 写入了 9 个字符：'张三,92,数学\n'
# 写入了 9 个字符：'李四,85,物理\n'
# 写入了 9 个字符：'王五,78,化学\n'
```

这里刻意捕获 `write()` 的返回值，可以看到它返回的是字符数（`'张三,92,数学\n'` 算 12 个字符）。如果换成二进制模式写入字节，返回值就是字节数。

**write 返回值在二进制模式下的差异**

```python
with open("binary.bin", "wb") as f:
    n = f.write("中文".encode("utf-8"))
    print(n)  # 6，因为"中文"的 UTF-8 编码是 6 个字节

with open("binary.bin", "rb") as f:
    data = f.read()
    print(data, len(data))  # b'\xe4\xb8\xad\xe6\x96\x87' 6
```

二进制模式下 `write()` 返回字节数，和传入的 `bytes` 长度一致。文本模式下返回字符数，某些多字节编码（如中文用 UTF-8 编码）字符数和字节数是不等的，这一点在做磁盘占用计算时要留意。

**文本模式与二进制模式的类型要求**

```python
# 文本模式写 bytes 会报错
try:
    with open("a.txt", "w", encoding="utf-8") as f:
        f.write(b"hello")   # TypeError
except TypeError as e:
    print("文本模式写 bytes 报错：", e)

# 二进制模式写 str 会报错
try:
    with open("a.bin", "wb") as f:
        f.write("hello")    # TypeError
except TypeError as e:
    print("二进制模式写 str 报错：", e)
# 输出：
# 文本模式写 bytes 报错： write argument must be str, not bytes
# 二进制模式写 str 报错： a bytes-like object is required, not 'str'
```

这个 TypeError 是初学者最常遇到的文件读写错误。口诀：**文本模式配 `str`，二进制模式配 `bytes`**，两者不能混。

### 2.7 writelines()：批量写入多行

`writelines()` 接收一个可迭代对象，依次把每个元素写入文件。名字容易让人误以为它会"按行写"并自动加换行，但实际上**它不会自动补换行符**——每个元素原样拼接写入，和连续调用 `write()` 效果一样。

**方法签名**：

```python
file.writelines(lines)
```

- `lines`：一个可迭代对象（列表、元组、生成器都行），每个元素是 `str`（文本模式）或 `bytes`（二进制模式）。
- 返回值：`None`。和 `write()` 不同，`writelines()` 不返回写入数量。

**demo：用 writelines 批量生成 HTML 页面**

```python
# 成绩单数据
rows = [
    ("张三", 92),
    ("李四", 85),
    ("王五", 78),
]

lines = ["<table>\n"]
for name, score in rows:
    lines.append(f"  <tr><td>{name}</td><td>{score}</td></tr>\n")
lines.append("</table>\n")

with open("report.html", "w", encoding="utf-8") as f:
    f.writelines(lines)

# 读取验证
with open("report.html", "r", encoding="utf-8") as f:
    print(f.read())
# 输出：
# <table>
#   <tr><td>张三</td><td>92</td></tr>
#   <tr><td>李四</td><td>85</td></tr>
#   <tr><td>王五</td><td>78</td></tr>
# </table>
```

这里每个元素都手动带了 `\n`，这正是 `writelines()` 正确用法的关键——它不在元素之间插入任何分隔符，所以换行得你自己加。

**和 write 循环的等价性**

```python
# 下面两种写法效果完全一致
lines = ["a\n", "b\n", "c\n"]

# 写法一：writelines
with open("t1.txt", "w") as f:
    f.writelines(lines)

# 写法二：for + write
with open("t2.txt", "w") as f:
    for line in lines:
        f.write(line)
```

`writelines()` 相比 `for + write` 的优势只在于"少一次 Python 层循环"，性能略有提升。但它丢失了能拿到每次写入返回值的机会，且更适合"所有行已经准备好"的场合。

**writelines 接收生成器：大批量写不占内存**

```python
def log_lines(n):
    """生成 n 行模拟日志，不一次性放入内存。"""
    for i in range(n):
        yield f"[{i:06d}] INFO heartbeat ok\n"

with open("big.log", "w", encoding="utf-8") as f:
    f.writelines(log_lines(1_000_000))  # 写 100 万行，内存恒定
```

这是一个高级用法：`writelines()` 接收生成器，一边生成一边写入，即使生成上亿行也不会爆内存。是 `writelines()` 比 `readlines()` 更有价值的场景之一。

### 2.8 readable() / writable() / seekable()：能力判断

这三个方法返回布尔值，用于在运行时检查当前文件对象"能不能读、能不能写、能不能 seek"。它们没有参数。

**方法签名**：

```python
file.readable()    -> bool
file.writable()    -> bool
file.seekable()    -> bool
```

- `readable()`：文件是否可读。只写模式（`'w'`/`'x'`/`'a'`）打开的文件返回 `False`。
- `writable()`：文件是否可写。只读模式（`'r'`）打开的文件返回 `False`。
- `seekable()`：文件指针是否可移动。普通磁盘文件返回 `True`；终端、管道、套接字这类流返回 `False`。

**demo：根据能力做防御性编程**

```python
def safe_read(f, n=10):
    """只有可读的文件才读，否则返回空。"""
    if not f.readable():
        print("警告：文件不可读")
        return ""
    return f.read(n)

def safe_write(f, text):
    """只有可写的文件才写。"""
    if not f.writable():
        print("警告：文件不可写")
        return 0
    return f.write(text)

# 只写模式打开，尝试读
with open("demo.txt", "w", encoding="utf-8") as f:
    print(f.readable())     # False
    print(f.writable())     # True
    safe_read(f)

# 只读模式打开，尝试写
with open("demo.txt", "r", encoding="utf-8") as f:
    print(f.readable())     # True
    print(f.writable())     # False
    safe_write(f, "hello")
# 输出（节选）：
# False
# True
# 警告：文件不可读
```

如果不做 `readable()`/`writable()` 判断而直接对只写文件调用 `read()`，会抛 `io.UnsupportedOperation: not readable`。这在写通用工具、封装文件处理函数时是一个有用的防御性检查。

**seekable() 在管道场景的典型作用**

```python
import sys
# 从 stdin 读时，stdin 通常不可 seek
print("stdin seekable:", sys.stdin.seekable())
# 读取管道输入时不能 seek(0) 回到开头
```

当处理的是 `sys.stdin`、网络流、或 `subprocess` 管道生成的文件类对象时，`seekable()` 返回 `False`，此时调 `seek()` 会抛异常——先用 `seekable()` 判断能避免这类运行时错误。

### 2.9 flush()：主动刷新缓冲区

`flush()` 把文件对象内部缓冲区中尚未写入磁盘的数据强制刷新到底层操作系统文件描述符。它不带参数，返回 `None`。

**方法签名**：

```python
file.flush()
```

`flush()` 解决的核心问题是"我希望立刻看到写入结果"：写了数据后，在缓冲区没有填满或文件没有关闭前，数据可能还在内存里；调用 `flush()` 可以强制把它推到操作系统层（但注意 OS 自己可能还有一层缓冲，真正落盘需要 `os.fsync()`，这是另一回事）。

**demo：长时间运行的程序实时写日志**

```python
import time

with open("process.log", "w", encoding="utf-8") as f:
    for i in range(3):
        f.write(f"步骤 {i} 完成\n")
        f.flush()              # 立刻把这一行刷到磁盘
        # 此时在另一个终端 tail -f process.log 能看到这一行
        time.sleep(1)
print("处理结束")
```

如果不调用 `flush()`，这三行可能等程序结束、文件关闭时才一起写盘——那"在另一个终端实时看日志"就实现不了。很多后台程序、守护进程的日志写入都会显式 `flush()`，这是实时观测程序状态的常用手段。

**flush 与 print 的 flush 参数的关系**

```python
# 等价的两段代码——都是"立即把输出推到终端"
print("hello", flush=True)

# 等价于
import sys
sys.stdout.write("hello\n")
sys.stdout.flush()
```

`print(..., flush=True)` 的本质就是先输出再调用 `sys.stdout.flush()`。理解这点后，对 `flush()` 的使用场景就非常明确了。

### 2.10 tell()：查询当前指针位置

`tell()` 返回文件指针当前的位置，不带参数。

**方法签名**：

```python
file.tell() -> int
```

- 二进制模式：返回的是真实的字节偏移量，含义直观。
- 文本模式：返回的整数在不同 Python 版本和编码下既可能是字节偏移，也可能是一个不透明的"逻辑 cookie"——尤其涉及多字节编码时不要假设它等于字符数或字节数。最安全的用法是把它当作一个"原样回传给 `seek()` 即可还原位置"的票根，不解读其内部含义。

**demo：观察读写过程中指针的变化**

```python
with open("demo.txt", "w", encoding="utf-8") as f:
    f.write("Python")            # 纯 ASCII，6 个字符 = 6 字节
    print("写完后的位置：", f.tell())   # 6

with open("demo.txt", "r", encoding="utf-8") as f:
    print("打开读时：", f.tell())        # 0
    f.read(2)
    print("读了 2 字符后：", f.tell())    # 2
```

上面这个例子刻意用纯 ASCII，让文本模式的 `tell()` 退化为字节偏移，观察起来更直观。如果写入的字符串里包含中文等多字节字符，`tell()` 的具体数值就会随编码而变化，不必去记它什么时候等于几——把它当 cookie 用即可。

`tell()` 通常和 `seek()` 成对出现：先 `tell()` 记住位置，做完其他操作后 `seek()` 回到这个位置，实现"在文件中穿插读写"的需求。

### 2.11 seek()：移动文件指针

`seek()` 主动把文件指针移到指定位置，实现随机访问。

**方法签名**：

```python
file.seek(offset, whence=0)
```

- `offset`：要移动到的位置。二进制模式下是字节数；文本模式下只能是从 ` whence=0` 的绝对位置，或 `seek(0, 1)`/`seek(0, 2)` 相对当前位置/末尾，不能任意传非零的相对偏移。
- `whence`：参考点。`0`（默认）= 文件开头；`1` = 当前位置；`2` = 文件末尾。
- 返回值：移动后的新绝对位置（整数）。

**demo：从文件中间位置重新读取**

```python
with open("demo.txt", "w", encoding="utf-8") as f:
    f.write("AAAABBBBCCCC")

with open("demo.txt", "r", encoding="utf-8") as f:
    print(f.read(4))       # AAAA
    print(f.tell())        # 4
    # 想跳过中间 4 个字符，直接读 CCCC
    f.seek(8)              # 移到第 8 个字符位置
    print(f.read(4))       # CCCC
# 输出：
# AAAA
# 4
# CCCC
```

`seek(8)` 把指针从位置 4 直接搬到了位置 8（中间的 BBBB 被跳过没读）。这种"随机访问"在二进制文件解析（如图像文件头、数据库页）中非常常见。

**三种 whence 的区别**

```python
import io

f = io.StringIO("0123456789")
f.read(4)                  # 读到 "0123"，指针在 4

f.seek(0)                  # whence=0，回到开头
print(f.read(1))           # 0
f.seek(-3, 2)              # 二进制模式才支持负偏移

# 文本模式只支持 whence=0 的非零 offset
f.seek(0)
f.seek(5, 0)               # OK，移动到第 5 个字符
# f.seek(2, 1)             # 文本模式会报错（非零 whence+非零 offset）
print(f.read(3))           # 567
```

文本模式的限制来自多字节编码：由于一个字符可能占 1~4 个字节，从中间位置开始读需要确保落在字符边界上，所以 Python 对文本模式的 `seek` 做了限制——只有 `whence=0`（从开头，必定是字符边界）能传任意 `offset`，其它情况只能传 `0`。

**二进制模式的 seek 更自由**

```python
with open("data.bin", "wb") as f:
    f.write(b"0123456789")

with open("data.bin", "rb") as f:
    f.read(4)              # 指针在 4
    f.seek(-3, 2)          # 从末尾往前 3 字节，到位置 7
    print(f.read())        # b'789'
```

二进制模式可以任意传 `offset`（正负皆可）和任意 `whence`，因为字节边界不存在歧义。

### 2.12 truncate()：截断文件

`truncate()` 把文件截断到指定长度，比这长的部分丢弃，比这短的部分（理论上）补零字节。

**方法签名**：

```python
file.truncate(size=None)
```

- `size`：截断后的文件大小。默认 `None` 表示截断到当前指针位置。
- 返回值：截断后的文件大小。

```python
with open("demo.txt", "w", encoding="utf-8") as f:
    f.write("0123456789")

with open("demo.txt", "r+", encoding="utf-8") as f:
    f.seek(5)              # 把指针移到第 5 个字符
    f.truncate()           # 不传 size => 截断到指针位置
    print(f.read())

with open("demo.txt", "r", encoding="utf-8") as f:
    print(f.read())        # 01234
```

`truncate()` 较少使用，主要用于：日志文件"重置而不删除"、固定长度记录文件的覆盖写。它不移动指针，只改变文件大小。

### 2.13 closed / fileno() / name / mode：文件对象的属性

这些不是方法，而是文件对象的常用属性，用于查询状态：

- `f.closed`：布尔值，文件是否已关闭。
- `f.name`：打开时传给 `open()` 的文件名（可能不是真实路径，比如是 `'<stdin>'`）。
- `f.mode`：打开文件时使用的 mode 字符串。
- `f.fileno()`：方法，返回底层操作系统文件描述符（整数），用于和 `os` 模块、`select` 等底层 API 交互。
- `f.encoding`（文本模式才有）：文件所用编码名。

**demo：观察文件对象属性**

```python
f = open("demo.txt", "w", encoding="utf-8")
print("name :", f.name)
print("mode :", f.mode)
print("closed:", f.closed)
print("encoding:", f.encoding)
print("fileno:", f.fileno())     # 通常 > 2
f.close()
print("closed:", f.closed)
# 输出（节选）：
# name : demo.txt
# mode : w
# closed: False
# encoding: utf-8
# fileno: 3
# closed: True
```

`fileno()` 在做异步 IO（如 `select.select`）时会用到；在普通脚本中，知道文件对象其实封装了一个整数 fd 即可。

### 2.14 文本模式的换行处理（newline）

`open()` 的 `newline` 参数控制换行符的读写转换行为。这是一个容易被忽略却极重要的参数。

| newline 取值   | 读时行为                                | 写时行为                                           |
| -------------- | --------------------------------------- | -------------------------------------------------- |
| `None`（默认） | 任意换行（`\n`/`\r`/`\r\n`）都转成 `\n` | 任何 `\n` 写成 `os.linesep`（Windows 上是 `\r\n`） |
| `''`           | 识别换行但不转换，保留原样              | `\n` 原样写，不转换                                |
| `'\n'`         | 只识别 `\n`                             | `\n` 原样写                                        |
| `'\r'`         | 只识别 `\r`                             | `\n` 写成 `\r`                                     |
| `'\r\n'`       | 只识别 `\r\n`                           | `\n` 写成 `\r\n`                                   |

**demo：默认 newline 在 Windows 上的写差异**

```python
# 假设这段代码在 Windows 上运行
with open("data.txt", "w", encoding="utf-8") as f:
    f.write("line1\nline2\n")

# 在 Windows 上用二进制查看，会发现写入的是 "line1\r\nline2\r\n"
# 因为默认 newline=None 会把 \n 转换成 os.linesep(\r\n)
```

这在不同平台间拷贝文本文件时容易出问题：在 Windows 上写出来的文件每行都是 `\r\n`，在 Linux 上某些工具会把 `\r` 当成普通字符。一个常见的解法是显式传 `newline=''`：

```python
with open("data.txt", "w", encoding="utf-8", newline="") as f:
    f.write("line1\nline2\n")   # 原样写 \n，不做任何转换
```

CSV 模块的标准做法就是 `open(..., newline='')`，让 `csv` 自己处理换行，避免和默认 `newline` 产生冲突。

### 2.15 二进制模式的逐块读写

二进制模式下所有读写方法按字节处理，方法签名和文本模式一致，只是类型不同。分块二进制读取是处理图片、视频、压缩包的标准模式。

**demo：复制文件，用 8KB 块逐块读写**

```python
def copy_file(src_path, dst_path, chunk_size=8192):
    """二进制分块复制，适用于任意大小文件。"""
    with open(src_path, "rb") as src, open(dst_path, "wb") as dst:
        while True:
            chunk = src.read(chunk_size)
            if not chunk:
                break
            dst.write(chunk)

# 模拟一个 1MB 文件然后复制
with open("source.bin", "wb") as f:
    f.write(b"\xff" * (1024 * 1024))   # 写 1MB 全 0xFF

copy_file("source.bin", "copy.bin")

# 验证大小一致
import os
print(os.path.getsize("source.bin"), os.path.getsize("copy.bin"))
# 输出：1048576 1048576
```

这份"逐块读写"模板是文件复制工具的核心逻辑。`shutil.copyfile` 内部做的也是类似事情，只是它用了更大的缓冲和更底层的 API。

**保留指针位置的分块读**

```python
def read_chunks(path, chunk_size=4096):
    """生成器：每次 yield 一块，保留指针状态。"""
    with open(path, "rb") as f:
        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                break
            yield chunk

# 用法：边读边做哈希校验
import hashlib
sha = hashlib.sha256()
for chunk in read_chunks("source.bin"):
    sha.update(chunk)
print(sha.hexdigest()[:16], "...")
```

把 `read(chunk_size)` 封装成生成器后，任何流式处理（哈希、上传、转发）都能用统一的 `for chunk in ...` 写法表达。

---

## 3. 最佳实践

### 3.1 用 with 管理文件，避免忘记关闭

文件对象必须关闭，否则不仅可能丢数据（缓冲区没刷新），还会泄露文件描述符。Linux 上一个进程能同时打开的文件数有上限（可用 `ulimit -n` 查看），泄露久了会触发 `Too many open files` 错误。

```python
# 不推荐：容易忘记 close，或因异常跳过 close
f = open("demo.txt", "r", encoding="utf-8")
try:
    data = f.read()
finally:
    f.close()

# 推荐：with 自动保证 close，异常路径也安全
with open("demo.txt", "r", encoding="utf-8") as f:
    data = f.read()
```

绝大多数场景下 `with` 都是最优解。关于 `with` 的底层上下文管理器协议，详见《with 上下文管理器》。

### 3.2 默认用迭代而非 readlines

处理行式文件时，默认写法应该是 `for line in f`，而不是 `f.readlines()`。

```python
# 不推荐：行数多时会爆内存
with open("big.log", "r", encoding="utf-8") as f:
    for line in f.readlines():   # 全部读入 list 才循环
        process(line)

# 推荐：逐行迭代，内存恒定
with open("big.log", "r", encoding="utf-8") as f:
    for line in f:               # 每次只读一行
        process(line)
```

什么时候 `readlines()` 是合理的？只有当你确实需要随机访问某一行（按索引取）或需要先把所有行排进内存里做整体变换时，才用它。否则都用迭代。

### 3.3 写文件时显式指定编码

文本模式读写如果不指定编码，会用平台默认编码（Windows 上常是 `gbk`，Linux/macOS 上是 `utf-8`）。同一份代码在不同平台跑会出现乱码。

```python
# 不推荐：依赖平台默认编码
with open("data.txt", "w") as f:
    f.write("中文")

# 推荐：显式指定 utf-8
with open("data.txt", "w", encoding="utf-8") as f:
    f.write("中文")
```

工程上几乎所有的文本文件都应该用 `utf-8`，这是一条可以默认遵守的规则。

### 3.4 read 时先想文件多大再选方法

读文件之前心中要有"文件多大"的概念——即便不精确，也要知道是 KB、MB 还是 GB 级别。根据大小选方法：

```python
# 小文件（< 10MB）：一次读 OK
content = open("small.txt", encoding="utf-8").read()

# 中等文件：用迭代逐行处理
with open("medium.log", encoding="utf-8") as f:
    for line in f:
        ...

# 大文件：用 read(chunk_size) 分块
with open("big.bin", "rb") as f:
    while chunk := f.read(8192):
        process(chunk)
```

`chunk := f.read(8192)` 用了海象运算符（Python 3.8+），把"读"和"判空"合并到一行，是分块读取的简洁写法。

### 3.5 write 后别依赖缓冲立刻可见

写了数据但没关闭文件时，数据可能还在缓冲区里。如果你在其他进程/终端需要立即看到，要主动 `flush()`：

```python
# 不推荐：守护进程不 flush，日志迟迟不落盘
def log(msg):
    with open("daemon.log", "a") as f:
        f.write(msg + "\n")   # 程序长期运行，缓冲可能很久才满

# 推荐：重要日志立即 flush
def log(msg):
    with open("daemon.log", "a") as f:
        f.write(msg + "\n")
        f.flush()
```

但不要为了"立刻落盘"到处加 `flush()`——频繁 flush 会显著降低写入吞吐量。只在确实需要实时可见的场景（日志、进度）加，普通文件写完全依赖 `with` 关闭时的自动 flush 即可。

### 3.6 writelines 别忘了加换行

```python
# 不推荐：写出来的文件只有一行
with open("bad.txt", "w") as f:
    f.writelines(["a", "b", "c"])   # 写出来是 "abc"

# 推荐：元素自己带换行
with open("good.txt", "w") as f:
    f.writelines(["a\n", "b\n", "c\n"])
```

`writelines` 不会在元素间插任何分隔符。如果数据源本身不带换行，可以用生成器表达式补上：

```python
lines = ["a", "b", "c"]
with open("good.txt", "w") as f:
    f.writelines(f"{line}\n" for line in lines)
```

### 3.7 不要在文本模式用负数 seek

```python
# 不推荐：文本模式下用负 offset 或 whence 非 0 的非 0 offset
with open("demo.txt", "r") as f:
    # f.seek(-3, 2)   # 会报错：can't do nonzero cur-relative seeks
    f.read(4)          # 退而求其次，只往前读

# 推荐：文本模式要随机访问，用 tell()/seek(0) 或转成二进制
with open("demo.txt", "r") as f:
    pos = f.tell()
    f.read(4)          # 先读 4 个字符
    f.seek(pos)        # 用记录的绝对位置回到原处
    print(f.read(4))   # 再读一次同样的内容
```

需要做复杂的随机定位时，考虑改用二进制模式打开，自己解码——这样 seek 自由度最高。

### 3.8 flush 不等于落盘

`flush()` 只是把 Python 内部缓冲推到操作系统，操作系统自己的页缓存可能还没真正写到磁盘。程序崩溃但操作系统正常时，flush 过的数据大概率安全；但如果是断电，操作系统页缓存里的数据也会丢。要确保落盘需用 `os.fsync(f.fileno())`：

```python
import os
with open("critical.data", "w") as f:
    f.write("重要数据")
    f.flush()
    os.fsync(f.fileno())   # 强制 OS 把页缓存刷到磁盘
```

数据库写日志、关键配置保存时才有这种需求，普通应用用 `flush()` 已经足够。

---

## 4. 原理

### 4.1 文件对象的继承结构与 io 模块

Python 的文件对象并不是一个"扁平"的类，而是从 `io` 模块多层继承的结果。理解这层结构，能解释为什么不同打开方式下方法行为不同。

```
io.IOBase                <- 所有 IO 对象的根基类，定义 close/seek/tell 等通用方法
├── io.RawIOBase         <- 无缓冲的字节流，readinto/write 直接到 OS
├── io.BufferedIOBase    <- 带缓冲的字节流，readinto/read/write/read1
└── io.TextIOBase        <- 文本流，read/readline/write，含编码、换行处理
```

`open()` 返回的具体类型：

- 文本模式：`io.TextIOWrapper`（继承 `TextIOBase`）
- 二进制带缓冲模式：`io.BufferedReader` / `io.BufferedWriter` / `io.BufferedRandom`（继承 `BufferedIOBase`）
- 二进制 raw 模式（`mode='rb'` 带 buffering=0）：`io.FileIO`（继承 `RawIOBase`）

这就是为什么 `f.read()` 在不同模式下返回类型不同——因为它们调用的其实是**各自类中重写的不同方法实现**，对外暴露统一的方法名。

### 4.2 缓冲机制：为什么写完没立刻落盘

文本模式 `TextIOWrapper` 内部维护一个编码缓冲区，二进制模式 `BufferedWriter` 维护一个字节缓冲区。写入的数据先进入这个缓冲区，缓冲区满或文件关闭时才调用底层 `FileIO.write` 把数据交给操作系统。

默认缓冲大小由 `io.DEFAULT_BUFFER_SIZE` 决定（通常是 8192 或 4096 字节）。`open()` 的 `buffering` 参数能控制缓冲策略：

- `buffering=-1`（默认）：使用默认缓冲大小。
- `buffering=0`：关闭缓冲（只对二进制模式有效；文本模式必带缓冲）。
- `buffering=1`：行缓冲，每遇到换行就 flush。
- `buffering>1`：使用指定大小的缓冲区。

```python
# 行缓冲：每写一行就 flush，适合实时日志
with open("log.txt", "w", encoding="utf-8", buffering=1) as f:
    f.write("line1\n")   # 立刻 flush 到 OS
    f.write("line2\n")

# 自定义 4KB 缓冲
with open("data.bin", "wb", buffering=4096) as f:
    f.write(b"x" * 1000)   # 还没满 4KB，可能没 flush
```

行缓冲（`buffering=1`）只能在文本模式下用，它使得"每写完一行"就触发一次 flush，相当于 `print(..., flush=True)` 的等价机制。

### 4.3 文件迭代器的实现

`for line in f` 之所以惰性、省内存，根因在文件对象实现了迭代器协议。`io.IOBase` 基类中定义了 `__iter__` 返回自身，`__next__` 调用 `readline()`。伪代码如下：

```python
class IOBase:
    def __iter__(self):
        return self          # 文件对象就是自己的迭代器

    def __next__(self):
        line = self.readline()
        if line == "":       # 文件结束的标志是空字符串
            raise StopIteration
        return line
```

所以 `for line in f` 在底层就是反复调用 `readline()`，每次只读一行进内存。文件迭代是一次性的——迭代到底后指针停在末尾，再 `for` 一次直接拿到 `StopIteration`。要重新迭代必须 `seek(0)` 或重新 `open()`。

### 4.4 文本模式 read(size) 的字符语义

文本模式下 `f.read(6)` 读的是 6 个字符，不是 6 个字节。但磁盘是按字节存储的，`TextIOWrapper` 内部需要：

1. 调用底层 `BufferedReader.read` 读取若干字节；
2. 用 `incrementaldecoder` 解码这些字节成字符；
3. 如果读到的字符不够 `size` 个，再回去读更多字节（可能跨多字节字符边界）；
4. 如果多读了字节作为下一个字符的前半段，把它们缓存在解码器内部状态里，下次 `read` 时接着用。

这就是为什么文本模式下 `tell()` 的返回值"不直观"——它返回的是一个透明的 cookie 值（不是简单字节数），保证 `seek()` 能正确恢复解码器状态。二进制模式没有这层解码，`tell()` 直接返回字节偏移，`read(6)` 直接读 6 字节。

### 4.5 二进制模式下的 readinto 内存优化

二进制流（`BufferedIOBase`）还提供一个 `readinto(b)` 方法，把数据读到预先分配好的 `bytearray` 中，避免创建新的 bytes 对象。这是高吞吐场景下的优化手段：

```python
with open("data.bin", "rb") as f:
    buf = bytearray(8192)    # 预先分配 8KB 内存
    while True:
        n = f.readinto(buf)  # 返回实际读到的字节数
        if n == 0:
            break
        process(buf[:n])     # 只处理有效部分
```

`readinto` 复用同一个 `buf`，每次循环不分配新对象，GC 压力小，适合做大批量字节处理（如磁盘 hashing、流式转发）。

### 4.6 read/write 共享同一个指针

读写方法共享同一个文件指针，这意味着在 `'r+'`/`'w+'`/`'a+'` 这种可读可写模式下读写切换时要特别小心。C 标准库规定：读写切换之间必须有一次 `seek` 或 `flush`，Python 的 IO 层大致遵守这条规则——在不同实现版本上表现略有差异。

```python
with open("demo.txt", "r+", encoding="utf-8") as f:
    f.write("AAAA")      # 写 4 字符，指针在 4
    # 在不 seek 的情况下直接读，行为不一定符合预期
    # 推荐：读之前先 seek 到明确位置
    f.seek(0)
    print(f.read(4))     # AAAA
```

养成"读之前 seek、写之前 seek"的习惯，避免被这种"状态机切换"的隐性规则坑到。

---

## 5. 总结

### 5.1 本文要点回顾

- 文件对象的读写方法围绕"指针"和"缓冲"两个内部状态展开，理解这两个状态就能预测任何方法的运行结果。
- 读方法三剑客：`read()`（一次性或分块）、`readline()`（按行）、`readlines()`（全部行成列表）。大文件用 `for line in f` 迭代器协议，内存恒定。
- 写方法二件套：`write()`（写一段，返回写入量）、`writelines()`（写可迭代对象，不自动加换行），都不会自动 flush。
- 状态判断：`readable()`/`writable()`/`seekable()` 返回布尔，用于防御性编程；`tell()`/`seek()` 控制 `指针`。
- 缓冲机制：`flush()` 把 Python 缓冲推到操作系统，`os.fsync()` 再把它推到磁盘；行缓冲用 `buffering=1`。
- 文本模式按"字符"读写并做换行转换、编码处理，二进制模式按"字节"读写，方法签名一致但类型不同。
- `truncate()` 截断文件，`name`/`mode`/`encoding`/`closed`/`fileno()` 是常用属性。

### 5.2 读完本文你应能掌握

- 能根据文件大小和处理需求，在 `read`、`readline`、`readlines`、`for line in f` 之间正确选择，并说明内存影响。
- 能说明 `write()` 的返回值含义、`writelines()` 不加换行这一坑点，并正确处理换行。
- 能用 `read(chunk_size)` 写出处理任意大文件的分块读写模板。
- 能说明 `flush()` 与 `os.fsync()` 的区别，以及行缓冲（`buffering=1`）的适用场景。
- 能用 `tell()`/`seek()` 实现简单的随机读写，并理解文本模式与二进制模式 seek 的能力差异。
- 能用 `readable()`/`writable()`/`seekable()` 做防御性检查，避免 `io.UnsupportedOperation` 异常。
- 能说出文本模式 `read(size)` 的"字符语义"和 `tell()` 返回非字节偏移的原因。
- 能说出文件对象迭代器协议的实现（`__iter__`/`__next__` 调用 `readline`），解释为什么迭代是一次性的。
