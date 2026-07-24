---
group:
  title: 【19】标准库精讲
  order: 19
order: 1
title: sys 模块：命令行参数与标准流
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 sys 模块

`sys` 是 Python 标准库中最基础的模块之一，它提供了一系列由解释器使用或维护的变量与函数，用来访问与 Python 解释器自身以及运行环境相关的信息。与 `os` 模块聚焦"操作系统交互"不同，`sys` 聚焦的是"解释器自身的状态与行为"——你当前运行的是哪个 Python、从哪里启动、带了哪些命令行参数、输入输出挂在哪个流上、以什么状态退出，这些信息都由 `sys` 暴露。

本篇是「标准库精讲」系列的开篇，聚焦 `sys` 在命令行交互与标准流上的核心用法。绝大多数 Python 程序，不管是命令行小工具、服务脚本，还是被其他程序调用的子进程，都绕不开这两件事：从命令行接收参数、向标准流写入输出。掌握 `sys.argv`、`sys.stdin/stdout/stderr`、`sys.exit` 这几组 API，是写出"能在终端里被正确使用、能在管道里被正确组合"的 Python 程序的前提。

`sys` 模块是内置模块，无需安装，直接 `import sys` 即可使用。它不涉及第三方依赖，也不会因为虚拟环境不同而缺失，是几乎所有 Python 程序都会用到的基础设施。

### 1.2 本篇涉及的核心 API 速览

下表列出本篇会详细讲解的 API，先建立一个整体印象，后面每节会展开。

| API / 属性 | 类型 | 作用 |
|------------|------|------|
| `sys.argv` | 列表 | 命令行参数列表，`argv[0]` 是脚本名 |
| `sys.stdin` | 文本流对象 | 标准输入，默认绑定键盘/管道输入 |
| `sys.stdout` | 文本流对象 | 标准输出，默认绑定终端/管道输出 |
| `sys.stderr` | 文本流对象 | 标准错误输出，默认绑定终端 |
| `sys.exit([code])` | 函数 | 抛出 `SystemExit` 以终止程序并返回退出码 |
| `sys.platform` | 字符串 | 操作系统平台标识，如 `linux`、`win32`、`darwin` |
| `sys.version` | 字符串 | Python 解释器版本信息 |
| `sys.executable` | 字符串 | 当前解释器可执行文件的绝对路径 |
| `sys.path` | 列表 | 模块搜索路径列表 |
| `sys.modules` | 字典 | 已加载模块的缓存字典 |

本篇重点讲前三组（argv、三个标准流、exit），其余属性在核心内容末尾简提。

### 1.3 最小用法示例

先用一个最小程序感受 `sys` 的基本用法。下面这个脚本打印自己的名字、收到的命令行参数、以及正在运行的 Python 版本：

```python
import sys

print("脚本名:", sys.argv[0])
print("参数个数:", len(sys.argv) - 1)
print("参数列表:", sys.argv[1:])
print("Python 版本:", sys.version)
```

把它保存为 `info.py`，在终端执行：

```bash
python info.py apple banana
```

运行结果：

```
# 输出：
# 脚本名: info.py
# 参数个数: 2
# 参数列表: ['apple', 'banana']
# Python 版本: 3.12.0 (main, ...)
```

`sys.argv[0]` 永远是脚本自身的文件名，真正的用户参数从 `argv[1]` 开始。这是后续所有命令行解析的基础。

## 2. 核心内容

### 2.1 sys.argv：命令行参数列表

`sys.argv` 是一个字符串列表，保存了启动当前 Python 脚本时从命令行传入的所有参数。它由解释器在启动阶段自动填充，无需你做任何初始化。

**核心规则**：

- `sys.argv[0]` 是被运行的脚本名（含实际传入的路径形式）。
- `sys.argv[1]` 起才是用户的参数，按命令行上出现的顺序排列。
- 如果用 `python -c "code"` 直接执行一段代码字符串而非脚本文件，`argv[0]` 是 `'-c'`。
- 如果用交互式解释器（REPL），`sys.argv` 通常为 `['']` 或只有空字符串。
- 所有参数都是字符串类型，需要数字要自行转换。

**签名（属性，非函数）**：`sys.argv: list[str]`，可直接读取、切片、遍历，也可以修改（但一般不建议）。

下面是一个命令行小工具的完整示例：实现一个简单的 `repeat` 命令，把指定文本重复打印若干次。

```python
import sys

def main():
    # argv[0] 是脚本名，真正的参数从 1 开始
    if len(sys.argv) < 3:
        # 参数不足时往 stderr 打印用法，并用非零码退出
        sys.stderr.write("用法: python repeat.py <文本> <次数>\n")
        sys.exit(1)

    text = sys.argv[1]
    try:
        count = int(sys.argv[2])
    except ValueError:
        sys.stderr.write(f"次数必须是整数，收到: {sys.argv[2]}\n")
        sys.exit(2)

    for i in range(count):
        # 正常输出走 stdout
        print(f"[{i + 1}] {text}")

main()
```

执行与输出：

```bash
python repeat.py hello 3
# 输出：
# [1] hello
# [2] hello
# [3] hello
```

```bash
python repeat.py hello
# 输出（到 stderr）：
# 用法: python repeat.py <文本> <次数>
# 并以退出码 1 退出
```

**用 `-c` 执行代码字符串时 argv 的表现**：

```bash
python -c "import sys; print(sys.argv)" a b c
# 输出：
# ['-c', 'a', 'b', 'c']
```

可以看到 `argv[0]` 变成了 `'-c'` 这个标记字符串，之后的 `a b c` 仍是用户参数。这一点在编写需要同时支持脚本文件和 `-c` 调用的工具时要注意。

**参数类型转换**：`sys.argv` 里的所有元素都是字符串，哪怕你写的是数字。需要数值时必须显式转换：

```python
import sys

# 所有参数都是 str，需要自己转
if len(sys.argv) >= 2:
    port_str = sys.argv[1]
    port = int(port_str)  # 可能抛 ValueError，要处理
    print(f"监听端口: {port}")
```

**遍历所有参数**：

```python
import sys

# 跳过 argv[0]，遍历真正的用户参数
for idx, arg in enumerate(sys.argv[1:], start=1):
    print(f"参数 {idx}: {arg}")
```

执行 `python show_args.py --host localhost --port 8080 -v`：

```
# 输出：
# 参数 1: --host
# 参数 2: localhost
# 参数 3: --port
# 参数 4: 8080
# 参数 5: -v
```

**argv 与 argparse 的关系**

`sys.argv` 是最底层的命令行参数来源，但它只给你一个原始字符串列表，不解析 `--host=value`、`-v` 这类约定格式。当参数较复杂时，推荐用标准库 `argparse`（它内部也是读 `sys.argv`）。本篇聚焦 `sys.argv` 本身，让你理解参数是怎么进来的；`argparse` 会在后续单独成篇。

### 2.2 sys.stdin：标准输入流

`sys.stdin` 是一个预先打开的文本输入流对象（`TextIOWrapper`），默认连到终端的键盘输入；当通过管道或重定向喂入数据时，它连到对应的输入源。它的地位是"程序读取外部输入的默认通道"。

**核心方法**：

- `sys.stdin.read()`：读到 EOF 为止，返回全部内容（一个字符串）。
- `sys.stdin.readline()`：读一行（含换行符），遇到 EOF 返回空字符串 `''`。
- `sys.stdin.readlines()`：读全部行，返回字符串列表。
- 也可直接对 `sys.stdin` 迭代：`for line in sys.stdin:`，逐行读取，内存友好。

**集中读取全部输入**

适合输入量不大、需要整体处理的场景。比如一个把输入文本转大写的小工具：

```python
import sys

# 从 stdin 读取全部内容
content = sys.stdin.read()
print(content.upper())
```

通过管道喂入数据：

```bash
echo "hello world" | python upper.py
# 输出：
# HELLO WORLD
```

**逐行读取**

逐行处理是处理大文件/流的推荐方式，因为它不会一次性把全部内容载入内存。下面是一个统计每行字符数的工具：

```python
import sys

for line in sys.stdin:
    # line 末尾带换行符，用 rstrip 去掉
    text = line.rstrip("\n")
    print(f"长度 {len(text):>4}: {text}")
```

喂入多行数据：

```bash
printf "apple\nbanana\ncherry\n" | python linecount.py
# 输出：
# 长度    5: apple
# 长度    6: banana
# 长度    6: cherry
```

**交互式提示输入**

当 `stdin` 连到终端（而非管道）时，`readline()` 会阻塞等待用户敲回车。可以借此写简单的交互提示：

```python
import sys

print("请输入你的名字（回车结束）:", end=" ", flush=True)
name = sys.stdin.readline().strip()
if not name:
    print("你没有输入任何内容")
else:
    print(f"你好，{name}！")
```

实际在交互场景下，更常用内置函数 `input()`，它本质就是对 `sys.stdin.readline()` 的封装并加了一个提示参数。二者的关键区别在于 `input()` 会在读到 EOF 时抛 `EOFError`，而 `sys.stdin.readline()` 在 EOF 时静默返回空字符串。

```python
import sys

# input() 的等价写法
def my_input(prompt=""):
    sys.stdout.write(prompt)
    sys.stdout.flush()
    line = sys.stdin.readline()
    if line == "":  # EOF
        raise EOFError("EOF when reading a line")
    return line.rstrip("\n")
```

**检测 stdin 是否来自终端**

有些程序在管道模式和交互模式下想表现不同行为（交互时给提示符，管道时静默）。可以用 `sys.stdin.isatty()` 判断：

```python
import sys

if sys.stdin.isatty():
    print("（检测到交互模式）请输入内容:")
else:
    print("（检测到管道/重定向模式）开始处理输入流", file=sys.stderr)

data = sys.stdin.read()
print(f"共收到 {len(data)} 字符")
```

`isatty()` 返回 `True` 表示流连到一个终端设备，返回 `False` 表示来自文件或管道。

### 2.3 sys.stdout：标准输出流

`sys.stdout` 是预先打开的文本输出流，默认连到终端屏幕；通过重定向或管道时可连到文件或下游程序。它是 `print` 函数默认的输出目标——`print(x)` 实际上等价于 `sys.stdout.write(str(x) + "\n")` 加上缓冲管理。

**核心方法**：

- `sys.stdout.write(s)`：写入字符串 `s`，返回写入的字符数。**不会自动加换行符**，需要自己加。
- `sys.stdout.flush()`：强制把缓冲区内容刷到实际输出端。
- `sys.stdout.fileno()`：返回底层文件描述符（stdout 固定为 1）。

**write 与 print 的差别**

`print` 是便利函数，自动做类型转换、分隔符、换行、flush 控制；`sys.stdout.write` 更底层，只写字符串、不加换行、不转类型。需要精确控制输出格式（比如不换行、原样写字节级内容）时用 `write`：

```python
import sys

# 等价于 print("A", "B", "C")
sys.stdout.write("A" + " " + "B" + " " + "C" + "\n")

# print 的优势在于自动拼接与类型转换
print("数量:", 42, "状态:", True)
```

```
# 输出：
# A B C
# 数量: 42 状态: True
```

**不换行输出：进度条场景**

`print` 默认 `end="\n"` 会换行，想做同行刷新的进度条，要么用 `print(..., end="\r", flush=True)`，要么直接用 `sys.stdout.write` 配合 `\r` 与 `flush`：

```python
import sys
import time

for step in range(1, 11):
    # \r 回到行首，不换行
    sys.stdout.write(f"\r处理进度: {step}/10 {'█' * step}{'·' * (10 - step)}")
    sys.stdout.flush()  # 关键：立即刷出，否则可能攒在缓冲里
    time.sleep(0.2)

sys.stdout.write("\n完成\n")
```

```
# 输出（动态刷新同一行）：
# 处理进度: 10/10 ██████████
# 完成
```

这里 `flush()` 是关键。因为 stdout 在终端下通常是行缓冲（遇到换行才刷），而进度条用 `\r` 不换行，不手动 flush 的话整段进度可能一直憋到结束才一次性吐出来，失去"实时感"。

**重定向 stdout 到文件**

最常见的工程需求之一：把程序的正常输出写到日志文件，而不是刷到屏幕。做法是直接把 `sys.stdout` 换成另一个文件对象：

```python
import sys

# 备份原 stdout，以便恢复
original_stdout = sys.stdout

with open("app.log", "w", encoding="utf-8") as f:
    sys.stdout = f  # 临时把 stdout 指向文件
    print("这行会进 app.log，而不是屏幕")
    print("同理，这行也在文件里")
    sys.stdout.flush()

# 恢复原 stdout
sys.stdout = original_stdout
print("这行重新回到屏幕")
```

执行后，`app.log` 内容为：

```
# 输出（app.log）：
# 这行会进 app.log，而不是屏幕
# 同理，这行也在文件里
```

最后那行 `print` 会在终端显示。注意替换 `sys.stdout` 后，所有经由 `print` 的输出（包括第三方库的）都会被重定向，所以要确保在 `finally` 或 `with` 结束时恢复，避免后续输出"消失"。

**更安全的重定向：用 contextlib.redirect_stdout**

`contextlib.redirect_stdout` 把上面的备份/恢复逻辑封装成了上下文管理器，更安全、更易读：

```python
import sys
from contextlib import redirect_stdout

with open("app.log", "w", encoding="utf-8") as f, redirect_stdout(f):
    print("进文件了")
    # 这段范围内所有 print 都写到 app.log

print("回到屏幕")
```

**重定向到 StringIO（捕获输出做测试）**

在单元测试里经常需要"捕获"被测函数的 print 输出做断言。可以用 `io.StringIO` 作为 stdout 的替身：

```python
import sys
import io
from contextlib import redirect_stdout

def greet():
    print("hello, sys")

buffer = io.StringIO()
with redirect_stdout(buffer):
    greet()

captured = buffer.getvalue()
print(f"捕获到: {captured!r}")
```

```
# 输出：
# 捕获到: 'hello, sys\n'
```

`getvalue()` 返回 StringIO 缓冲的全部字符串。这是替换真实 stdout 做输出测试的标准手法。

### 2.4 sys.stderr：标准错误输出流

`sys.stderr` 是预先打开的文本输出流，专门用于输出错误、警告、诊断信息。它和 `sys.stdout` 在 API 上几乎一样（都是 `TextIOWrapper`，都有 `write/flush`），但二者绑定到不同的底层文件描述符：stdout 是 fd 1，stderr 是 fd 2。这个"分属不同 fd"的差别，是它们能在重定向时各自独立的关键。

**为什么要分两个输出流**

考虑这个场景：你写了一个数据处理脚本 `process.py`，正常处理结果走 stdout，过程中产生的警告/错误走 stderr。当用户这样调用时：

```bash
python process.py input.txt > result.txt
```

`>` 只重定向 stdout（fd 1）到 `result.txt`，stderr 仍然连到终端。于是：

- 正常结果安静地进了 `result.txt`，可以被下游继续处理。
- 错误信息仍在终端实时显示，用户立刻能看到问题。

如果错误也走 stdout，就会混进 `result.txt`，污染数据；如果错误完全不输出，用户又看不到问题。stderr 的独立存在完美解决了这个矛盾。

**示例：分离正常输出与错误信息**

```python
import sys

def process(data):
    if not data:
        # 错误信息走 stderr
        sys.stderr.write("错误: 输入数据为空，无法处理\n")
        return False
    # 正常结果走 stdout（print 默认）
    print(f"处理完成: {data}")
    return True

process("hello")
process("")
```

直接运行（两个流都到终端，看起来混在一起）：

```bash
python process.py
# 输出：
# 处理完成: hello
# 错误: 输入数据为空，无法处理
```

但重定向 stdout 后，差别就显现了：

```bash
python process.py > out.txt
# 终端显示：
# 错误: 输入数据为空，无法处理
# out.txt 内容：
# 处理完成: hello
```

错误信息没被 `>` 吞掉，留在了终端。这正是 stderr 的价值。

**print 也能写到 stderr**

`print` 函数有个 `file` 参数，默认 `sys.stdout`，传 `file=sys.stderr` 即可让这行 print 走 stderr：

```python
import sys

print("正常信息")
print("警告: 磁盘空间不足", file=sys.stderr)
print("错误: 连接失败", file=sys.stderr)
```

推荐在日常代码里用 `print(..., file=sys.stderr)` 写简单错误信息，比 `sys.stderr.write(...)` 更简洁（自动换行、自动类型转换），而且语义清晰。

**分别重定向 stdout 与 stderr**

在 shell 里：

- `> file` 只重定向 stdout。
- `2> file` 只重定向 stderr（`2` 就是 fd 2）。
- `> out.txt 2> err.txt` 分别重定向到两个文件。
- `2>&1` 把 stderr 并入 stdout（常用于想合并捕获全部输出的场景）。

```bash
python process.py > out.txt 2> err.txt
# out.txt 收正常输出，err.txt 收错误输出
```

```bash
python process.py > all.txt 2>&1
# stdout 和 stderr 都进 all.txt
```

理解 `2>&1` 的顺序很重要：它表示"把 fd 2 复制到 fd 1 当前的目标"。所以要先 `> all.txt` 再 `2>&1`，顺序反了会让 stderr 指向终端而 stdout 指向文件。

**isatty 同样适用于 stderr**

```python
import sys

if sys.stderr.isatty():
    # 终端模式下加颜色提示
    sys.stderr.write("\033[31m错误\033[0m: 连接失败\n")
else:
    # 非终端（被重定向到文件）时输出纯文本，避免ANSI码污染日志
    sys.stderr.write("错误: 连接失败\n")
```

这种"终端上色、文件纯文本"的判断在日志库里很常见，避免转义码写进日志文件后变成乱码。

### 2.5 stdout 与 stderr 的缓冲与 flush

缓冲是流式 IO 的核心机制。Python 的文本流默认带缓冲：写入的数据先攒在内存缓冲区，攒够一定量或遇到特定时机才真正写到底层 fd。这能减少系统调用次数、提升性能，但也带来"输出不立即出现"的副作用。

**三种缓冲模式**

| 模式 | 触发刷出的条件 | 典型对象 |
|------|----------------|----------|
| 行缓冲（line-buffered） | 遇到换行符 `\n` | 终端下的 `sys.stdout` |
| 块缓冲（block-buffered） | 缓冲区满（默认 8KB 左右） | 重定向到文件/管道时的 `sys.stdout`、`sys.stderr`（部分实现） |
| 无缓冲（unbuffered） | 每次写立即刷出 | 二进制流 `sys.stdout.buffer.raw` |

**关键点**：stdin/stdout 的缓冲行为会根据"是否连终端"自动切换。连终端时行缓冲（你每写一行就看到），被重定向到文件或管道时变块缓冲（攒一大块才输出）。stderr 通常无缓冲或行缓冲——这是为了让错误信息尽快可见。

**flush 的作用**

`sys.stdout.flush()` 强制把当前缓冲区内容立即写到目标，不等触发条件。在以下场景必须手动 flush：

- 进度条、动态同行刷新（用 `\r`，没有换行符触发刷出）。
- 长时间运行程序里想立刻看到"已处理到第 N 条"的日志。
- 程序可能崩溃/被 kill，崩溃前缓冲区里没刷出的日志会丢失。
- 与其他进程/管道交互，需要对方及时收到数据。

**对比 demo：不 flush vs flush**

```python
import sys
import time

print("开始", flush=True)
for i in range(3):
    # 不加 flush，被管道接收时可能要等循环结束才一次性看到
    print(f"计数 {i}", flush=True)
    time.sleep(0.5)
print("结束", flush=True)
```

当直接在终端运行时，行缓冲模式下你几乎逐条看到输出；但当 `python demo.py | cat` 通过管道运行且不加 `flush=True` 时，三条 `计数` 可能要等程序结束才一起冒出来——因为管道让 stdout 变成了块缓冲。加 `flush=True` 后，无论是否管道都能逐条看到。

**print 的 flush 参数**

```python
import sys
import time

# print 的 flush 参数等价于写完后调用一次 sys.stdout.flush()
for i in range(5):
    print(f"\r{i * 20}%", end="", flush=True)
    time.sleep(0.3)
print("\n完成")
```

`print(..., flush=True)` 是最便捷的强制刷新方式，内部等价于：

```python
sys.stdout.write(...)
sys.stdout.flush()
```

**强制全局无缓冲：python -u**

如果整个程序都不想被缓冲影响（调试、管道交互），启动时加 `-u` 参数：

```bash
python -u script.py | tee log.txt
```

`-u` 让 stdout/stderr 强制无缓冲（实际是块大小为 1），等同于全程自动 flush。也可设环境变量 `PYTHONUNBUFFERED=1` 达到同样效果。

### 2.6 sys.exit：退出程序并返回退出码

`sys.exit([code])` 用来结束当前 Python 进程，并向操作系统返回一个退出码。它是写命令行工具时控制"程序成功还是失败、以什么状态结束"的标准手段。

**签名**：`sys.exit(arg=None)`

- 不传或传 `None`：退出码为 0（表示成功）。
- 传整数：该整数作为退出码（0 成功，非零失败，约定 1 表示一般错误，2 表示用法错误）。
- 传字符串：字符串会被写到 stderr，退出码为 1（相当于"报个错再退出"）。
- 传其他对象：该对象的字符串表示写到 stderr，退出码为 1。

**基本退出**

```python
import sys

# 正常结束，退出码 0
sys.exit(0)
```

**出错退出**

```python
import sys

if len(sys.argv) < 2:
    sys.stderr.write("用法: python tool.py <文件>\n")
    sys.exit(2)  # 用法错误约定用 2
```

```bash
python tool.py
# 终端（stderr）：
# 用法: python tool.py <文件>
echo $?
# 输出：
# 2
```

`echo $?` 显示上一个命令的退出码。shell 脚本和 CI 系统正是靠这个码判断程序成功还是失败。

**传字符串的简写**

```python
import sys

if len(sys.argv) < 2:
    # 字符串版本：自动写到 stderr，退出码 1
    sys.exit("错误: 缺少必要参数")
```

等价于：

```python
sys.stderr.write("错误: 缺少必要参数\n")
sys.exit(1)
```

注意传字符串时 `sys.exit` 不会自动加换行，实际行为依实现而定，建议显式用前一种"先 write 再 exit(整数)"的形式，控制更精确。

**sys.exit 与 SystemExit 的关系**

`sys.exit` 不是直接终止进程，而是抛出一个 `SystemExit` 异常。这个异常可以被 `try/except` 捕获（虽然一般不该捕获）。如果异常一路冒到解释器顶层没被捕获，解释器主循环捕获它，把 `code` 作为进程退出码传给操作系统。这意味着 `finally` 块和上下文管理器的 `__exit__` 仍会执行，资源能被正确清理：

```python
import sys

try:
    print("做事中...")
    sys.exit(1)  # 抛 SystemExit
except SystemExit:
    print("捕获到了 SystemExit（一般不推荐这样做）")
    raise  # 重新抛出，让程序真的退出
finally:
    print("finally 始终执行，可清理资源")
```

```
# 输出：
# 做事中...
# 捕获到了 SystemExit（一般不推荐这样做）
# finally 始终执行，可清理资源
```

**sys.exit vs os._exit vs exit() vs quit()**

| 方式 | 行为 | 推荐场景 |
|------|------|----------|
| `sys.exit(code)` | 抛 `SystemExit`，清理后退出 | 正常程序退出，绝大多数场景 |
| `os._exit(code)` | 立即终止，不抛异常、不清理、不 flush | fork 出的子进程内退出，避免重复清理父进程资源 |
| `exit()` / `quit()` | 交互式 REPL 专用便利函数，底层也是抛 `SystemExit` | 只在 REPL 里用，不要写进脚本 |
| `raise SystemExit(code)` | 直接抛异常，等价 `sys.exit` | 想明确表达"异常式退出"时 |

在脚本和正式代码里统一用 `sys.exit(code)`，不要用 `exit()`/`quit()`，后者是给交互式环境准备的，部分环境可能未定义。

### 2.7 其他常用 sys 属性速览

除命令行参数与标准流外，`sys` 还有几个高频属性，日常调试与跨平台代码会用到。

**sys.platform：平台标识**

返回当前操作系统的短标识字符串，常用于跨平台分支：

```python
import sys

print(sys.platform)
# 在 Linux: 'linux'
# 在 Windows: 'win32'
# 在 macOS: 'darwin'
```

典型用法：

```python
import sys

if sys.platform == "win32":
    PATH_SEP = ";"
    NEWLINE = "\r\n"
elif sys.platform == "darwin":
    PATH_SEP = ":"
    NEWLINE = "\n"
else:  # linux 等
    PATH_SEP = ":"
    NEWLINE = "\n"
```

**sys.version：版本字符串**

返回包含主版本号、次版本号、补丁号、编译信息的长字符串：

```python
import sys

print(sys.version)
# 输出：
# 3.12.0 (main, Oct  2 2023, 10:00:00) [GCC 11.4.0]

# 只想要简洁的版本号
print(sys.version_info)
# 输出：
# sys.version_info(major=3, minor=12, micro=0, releaselevel='final', serial=0)

if sys.version_info < (3, 10):
    sys.exit("需要 Python 3.10+")
```

`sys.version_info` 是具名元组，支持元组比较，写版本判断非常方便。

**sys.executable：解释器路径**

返回当前正在运行的 Python 解释器的绝对路径。在多版本环境、虚拟环境里定位"到底用的是哪个 Python"很有用：

```python
import sys

print(sys.executable)
# 输出（venv 内）：
# /Users/you/project/.venv/bin/python
# 输出（系统 python）：
# /usr/bin/python3
```

启动子进程时想用同一个解释器：

```python
import sys
import subprocess

# 用当前解释器跑另一个脚本，避免硬编码 'python'
subprocess.run([sys.executable, "other_script.py"])
```

**sys.path：模块搜索路径**

`sys.path` 是一个列表，控制 `import` 时查找模块的目录顺序。在脚本里动态插入自定义搜索路径时会改它：

```python
import sys

# 在最前面加一个目录，让这里的模块优先被找到
sys.path.insert(0, "/data/libs")
import my_custom_lib  # 会到 /data/libs 找
```

注意 `sys.path` 在程序运行期间修改只在当前进程有效，不会写回环境。需要持久化配置搜索路径应使用 `PYTHONPATH` 环境变量或 `.pth` 文件。

**sys.modules：已加载模块缓存**

`sys.modules` 是一个字典，记录当前进程里所有已加载的模块名到模块对象的映射。`import` 一个模块时，解释器先查这里，命中就直接返回，不再重新加载。这是 Python 模块缓存机制的核心。

```python
import sys

print(len(sys.modules))  # 当前已加载多少个模块
# 输出（大致）：
# 180

print("json" in sys.modules)  # 看 json 是否已加载
# 输出：
# False
import json
print("json" in sys.modules)
# 输出：
# True
```

调试"模块被谁提前导入了""明明改了源码却没生效"这类问题时，看一眼 `sys.modules` 常能找到线索。

**sys.maxsize：整数上限**

Python 3 的 `int` 理论上无限大，但底层容器（列表、字符串）的长度受 `sys.maxsize` 限制：

```python
import sys

print(sys.maxsize)
# 输出（64 位系统）：
# 9223372036854775807
# 输出（32 位系统）：
# 2147483647
```

可借此判断当前是不是 64 位 Python：`sys.maxsize > 2**32` 为真则是 64 位。

### 2.8 综合场景：一个完整的命令行小工具

把前面讲的 argv、stdin、stdout/stderr、exit、flush 组合起来，写一个有真实场景感的小工具 `wc2.py`——它模仿 `wc` 统计行数/词数/字符数，从 stdin 或文件读取，结果走 stdout，错误走 stderr，并用退出码区分成功与失败。

```python
import sys

def count_stats(text):
    lines = text.count("\n") + (0 if text.endswith("\n") or text == "" else 1)
    words = len(text.split())
    chars = len(text)
    return lines, words, chars

def main():
    # 支持两种输入：从文件读，或无参数时从 stdin 读
    if len(sys.argv) > 2:
        sys.stderr.write("用法: python wc2.py [文件]\n")
        sys.exit(2)

    if len(sys.argv) == 2:
        filename = sys.argv[1]
        try:
            with open(filename, "r", encoding="utf-8") as f:
                content = f.read()
        except OSError as e:
            sys.stderr.write(f"无法读取 {filename}: {e}\n")
            sys.exit(1)
    else:
        # 无参数，从 stdin 读
        content = sys.stdin.read()

    lines, words, chars = count_stats(content)
    # 正常结果走 stdout
    print(f"行 {lines}  词 {words}  字符 {chars}")

main()
```

从文件读：

```bash
python wc2.py wc2.py
# 输出：
# 行 34  词 120  字符 980
```

从 stdin 读（管道）：

```bash
printf "one two three\nfour five\n" | python wc2.py
# 输出：
# 行 2  词 5  字符 23
```

参数错误：

```bash
python wc2.py a.txt b.txt
# 输出（stderr）：
# 用法: python wc2.py [文件]
# 退出码 2
```

读取失败：

```bash
python wc2.py not_exist.txt
# 输出（stderr）：
# 无法读取 not_exist.txt: [Errno 2] No such file or directory: 'not_exist.txt'
# 退出码 1
```

这个工具完整体现了"stdout 出结果、stderr 出错误、退出码表状态、stdin 接管道"这套命令行程序的通用契约，后续你写任何 CLI 工具都可以套这个骨架。

## 3. 最佳实践

**用 `sys.argv` 还是 `argparse`**

`sys.argv` 适合参数极简（一两个位置参数）的小脚本；一旦涉及可选参数（`--host`、`-v`）、参数类型校验、帮助文本、子命令，就应转用 `argparse`。硬啃 `sys.argv` 做复杂解析会出现大量重复的字符串拆分与错误处理代码，既易错又难维护。判断标准：如果你开始写 `if arg == "--port": port = sys.argv[i+1]` 这类循环，就该换 `argparse` 了。

**推荐**：简单工具直接读 argv：

```python
import sys

if len(sys.argv) != 3:
    sys.exit("用法: python copy.py <源> <目标>")
src, dst = sys.argv[1], sys.argv[2]
```

**不推荐**：手写复杂选项解析：

```python
# 反例：手撸 --key=value 解析，容易出错
import sys
for i, arg in enumerate(sys.argv):
    if arg.startswith("--port="):
        port = int(arg.split("=", 1)[1])
    elif arg == "--verbose":
        verbose = True
    # ... 很快就会失控
```

**stdout 只放"结果数据"，stderr 放"人读的信息"**

这是命令行工具的铁律。把正常输出（要被下游管道消费的数据）严格走 stdout，把任意人读的提示、进度、警告、诊断走 stderr。这样你的工具被 `|` 串起来时，下游能拿到干净的数据，人也能在终端看到过程信息。

推荐：

```python
import sys

print(",".join(result))            # 结果数据走 stdout
print("已处理 1000 行", file=sys.stderr)  # 进度信息走 stderr
```

不推荐：把进度信息也 print 到 stdout，下游 `python tool.py | sort` 会把"已处理 1000 行"也当成数据排序。

**长跑程序务必 flush 关键日志**

被重定向或管道时 stdout 变块缓冲，长跑程序若不 flush，日志可能很久都不落盘；一旦进程崩溃，缓冲区里的日志直接丢失，定位问题会很痛。关键节点用 `print(..., flush=True)` 或 `sys.stdout.flush()`。对日志量大的程序，推荐用 `logging` 模块并配置好 handler 的 flush 策略，而不是依赖裸 print。

**退出码语义要稳定**

约定俗成：0 成功，1 一般错误，2 用法错误（参数不对）。让你的工具遵守这个约定，shell 脚本和 CI 才能正确判断状态。不要随便用 `sys.exit(3)`、`sys.exit(99)` 这种没有文档说明的码；如果需要区分多种错误，要么在文档里列清每个码的含义，要么统一用非零码并在 stderr 写清楚错误类型。

推荐：

```python
import sys

if not data:
    sys.stderr.write("错误: 数据为空\n")
    sys.exit(1)
```

不推荐：

```python
sys.exit("失败了")  # 字符串退出码含义模糊，且退出码固定为 1，不便细分
```

**替换 stdout 后一定要恢复**

`sys.stdout = f` 会影响全进程的所有 print（包括第三方库）。如果不恢复，程序后续部分的所有输出都会"消失"到那个文件里，排查极难。用 `contextlib.redirect_stdout` 或 `try/finally` 保证恢复：

推荐：

```python
import sys
from contextlib import redirect_stdout

with open("log.txt", "w") as f, redirect_stdout(f):
    do_work()
# 离开 with 自动恢复，安全
```

不推荐：

```python
sys.stdout = open("log.txt", "w")
do_work()
# 忘了恢复，后续 print 全失踪
sys.stdout = sys.__stdout__  # 还要记得手动恢复，且文件句柄没关
```

`sys.__stdout__` 保存的是初始的 stdout 对象，可用作恢复，但不如上下文管理器省心。

**不要捕获 SystemExit 来"阻止退出"**

`sys.exit` 抛 `SystemExit` 是为了让 `finally` 和 `__exit__` 清理资源，不是为了让你拦截退出。捕获 `SystemExit` 并吞掉会让程序继续跑，但状态已经不一致（调用方期望程序已结束）。如果只是想在退出前做清理，用 `try/finally` 或 `atexit` 注册钩子，不要 `except SystemExit: pass`。

推荐：

```python
import sys
import atexit

atexit.register(cleanup)  # 退出前自动调用，无论正常结束还是 sys.exit
```

不推荐：

```python
try:
    do_something()
    sys.exit(0)
except SystemExit:
    pass  # 程序本该停，却被强行续命，状态混乱
```

**跨平台用 sys.platform 做分支，不要猜路径分隔符**

写 `if sys.platform == "win32"` 比硬编码 `"\\"` 更稳；但处理路径本身时优先用 `os.path` 或 `pathlib`，它们自动适配当前平台，不必你手动判断。`sys.platform` 更适合处理平台特有行为（如调用不同的系统命令、处理换行符）。

**检查 Python 版本要早**

想要求最低 Python 版本，把检查放在模块最顶部，早于任何依赖新版本语法的代码：

```python
import sys

if sys.version_info < (3, 10):
    sys.exit("需要 Python 3.10+，当前 " + sys.version)
# 后续可放心用 3.10+ 的语法
```

如果检查放在用了新语法的代码之后，旧版本会在 import 阶段直接语法错误，根本到不了你的检查。

## 4. 原理

本章解释 `sys` 在命令行与标准流上的几个关键机制：`sys.argv` 是怎么被填进去的、三个标准流为什么是"预打开"的、stdout/stderr 为什么能独立重定向、`sys.exit` 怎么把退出码传给操作系统、缓冲模式如何切换。

### 4.1 sys.argv 的来源：解释器启动时的 C 层收集

`sys.argv` 看起来就是个普通列表，但它并不是 Python 代码主动初始化的，而是由 CPython 解释器在启动阶段从 C 层填入。

**启动流程**：当你执行 `python script.py arg1 arg2`，操作系统的 shell 先把整条命令拆成一个字符串数组（`argv` 数组），通过 `exec` 系统调用传给 Python 解释器进程。CPython 的入口是 C 函数 `main`（位于 `Modules/main.c`），它收到这个 `argv` 数组后，做以下处理：

1. `argv[0]` 被设为实际运行的目标——如果是脚本文件就是脚本路径（形式按你命令行写的来，可能是相对路径也可能是绝对路径）；如果是 `-c`，`argv[0]` 被特殊地设为字符串 `"-c"`；如果是交互模式或 `-m`，对应不同的 `argv[0]` 约定。
2. 剩余元素就是用户参数，按原顺序排列。
3. 解释器初始化 `sys` 模块时，把这个 C 层的 `argv` 数组转成 Python 字符串列表，赋给 `sys.argv`。

这一切在执行你的脚本第一行代码之前就已完成。所以你在脚本任何位置 `import sys; print(sys.argv)` 都能拿到完整的参数列表，无需任何"初始化"调用。

这也解释了几个现象：

- `sys.argv` 的元素类型始终是 `str`（Python 3），即便命令行写的是数字。因为它们本来就是从 C 字符串数组逐个转成的 Python 字符串。
- `argv[0]` 的"形式"依赖启动方式：你写 `python ./tool.py` 时 `argv[0]` 是 `"./tool.py"`；写 `python /abs/path/tool.py` 时是绝对路径；用 `-c` 时是 `"-c"`。
- Windows 上由于系统调用的编码差异，旧版本 Python 在非 ASCII 参数上可能出问题；Python 3.6+ 用 UTF-16 版本的 `wmain` 接收参数，已能正确处理 Unicode 文件名参数。

**`argv` 可变但无意义**：`sys.argv` 是真实可变的 Python 列表，你可以 `sys.argv.append("x")` 或 `sys.argv[1] = "y"`，但这不会改变已传入程序的原始参数，只会影响后续读取 `sys.argv` 的代码。`argparse` 这类库默认在解析时读取当前 `sys.argv`，所以某些测试会通过临时改写 `sys.argv` 来注入参数。

### 4.2 标准流的本质：预打开的 TextIOWrapper 绑定到 fd 0/1/2

`sys.stdin`、`sys.stdout`、`sys.stderr` 这三个对象并非你的代码打开的，而是解释器在启动时预打开并放进 `sys` 模块的。它们是 `io.TextIOWrapper` 实例，包裹在缓冲层和原始层之上，最终绑定到操作系统分配给进程的三个标准文件描述符。

**操作系统层：fd 0/1/2**

当一个进程被创建（`fork`+`exec`）时，操作系统默认为它打开三个文件描述符（file descriptor，fd）：

- fd 0：标准输入（stdin）
- fd 1：标准输出（stdout）
- fd 2：标准错误（stderr）

这三个 fd 在进程启动时就已打开，分别连接到"输入源"和"输出目标"——具体连什么，取决于启动它的 shell 怎么配置。在终端直接运行时，三个 fd 都连到同一个终端设备；用 `> file` 重定向时，shell 在 `exec` 前把 fd 1 改成指向 `file`；用 `|` 管道时，shell 把上游的 fd 1 和下游的 fd 0 用一个管道连起来。

**Python 层：层层包裹的 IO 对象**

CPython 在 `sys` 模块初始化时（`Python/pylifecycle.c` 的 `_PySys_SetInitEncoding` 等流程），对 fd 0/1/2 各自构造一套 IO 对象栈：

```
sys.stdout  (TextIOWrapper，文本层，处理编码/换行/缓冲)
    └── BufferedWriter (缓冲层)
            └── FileIO (原始层，对应 fd 1)
```

- 最底层 `FileIO` 直接持有 fd（`stdout.fileno() == 1`），对 `read`/`write`系统调用做最小封装。
- 中间 `BufferedWriter`/`BufferedReader` 负责缓冲，减少系统调用次数。
- 最外层 `TextIOWrapper` 把字节流转成文本流，处理编码（默认用 `locale.getpreferredencoding()`，通常是 UTF-8）、统一换行符（`\n` 与平台换行的转换）、以及行缓冲逻辑。

`sys.stdout.buffer` 是中间的缓冲字节流，`sys.stdout.buffer.raw` 是最底层的 `FileIO`。要写原始字节（比如已编码好的字节串）可以 `sys.stdout.buffer.write(b"...")`，绕过文本编码层。

**预打开的意义**

这三个流在程序一启动就可用，无需 `open`。这对应"一个进程默认就有 stdin/stdout/stderr"这一操作系统约定。Python 把它们包装成高级文本流对象，既保留了"开箱即用"，又提供了编码、缓冲、行迭代等便利。

**`sys.__stdin__`/`sys.__stdout__`/`sys.__stderr__`**

`sys` 还保存了 `__stdin__`、`__stdout__`、`__stderr__` 三个"初始版本"，它们在解释器启动时记录原始流对象。当你在代码里把 `sys.stdout` 换成别的文件对象后，可以用 `sys.__stdout__` 找回最初的 stdout。但要注意：如果你的程序是被 `python -u` 启动或被(shell)重定向过，`__stdout__` 记录的也是当时的初始 stdout，不一定就是"终端"。

### 4.3 stdout/stderr 的独立重定向：fd 1 与 fd 2 的分离

为什么 `> file` 只重定向 stdout，stderr 仍能留在终端？根本原因在于 stdout 和 stderr 分属不同的文件描述符——fd 1 与 fd 2。操作系统的重定向是按 fd 独立操作的。

**shell 重定向的 fd 语义**

- `> file`：等价于 `1> file`，把 fd 1 指向 `file`。
- `2> file`：把 fd 2 指向 `file`。
- `2>&1`：把 fd 2 复制为 fd 1 当前所指的目标。注意这是"复制 fd 当前指向"，所以 `> file 2>&1` 能合并（先让 fd 1 指向 file，再让 fd 2 复制成同一目标），而 `2>&1 > file` 不能合并（先让 fd 2 指向 fd 1 原来的终端，再让 fd 1 指向 file，二者最终不同）。
- `|` 管道：shell 创建一个管道，把上游进程的 fd 1 连到管道写端，下游进程的 fd 0 连到管道读端。fd 2 不受影响，仍连终端。

**在 Python 层的表现**

因为 `sys.stdout` 绑定 fd 1，`sys.stderr` 绑定 fd 2，shell 重定向 fd 1 时，`sys.stdout.write` 的数据会顺着 fd 1 流向新目标（文件或管道），而 `sys.stderr.write` 仍顺着 fd 2 流向原终端。这就是分离的来源——不是 Python 特意做什么，而是操作系统把两个 fd 独立安排，Python 只是忠实反映。

**混用的后果**

一旦你在 Python 里把本该走 stderr 的内容错误地 print 到 stdout：

```python
import sys

# 错误：错误信息进了 stdout
print("ERROR: bad input", file=sys.stdout)
```

那么 `python tool.py > result.txt` 时，这行错误信息会混进 `result.txt`，污染正常数据。下游 `sort result.txt` 时这条错误也会被当数据排序。这就是为什么要严格区分——fd 1 与 fd 2 的独立是操作系统给的便利，你要主动配合才能发挥它的价值。

**手动混合：`2>&1` 的用途**

有时你确实想合并捕获全部输出（比如日志完整留档），这时 shell 的 `2>&1` 派上用场：

```bash
python tool.py > all.log 2>&1
```

它让 fd 2 也指向 `all.log`，于是 stdout 和 stderr 都进同一个文件。Python 代码什么也不用改——这就是 fd 机制的灵活之处：分离是默认，合并是可选，全在 shell 层控制。

### 4.4 sys.exit 的机制：SystemExit 与解释器主循环

`sys.exit(code)` 看起来是"让程序停下来"，但它并不直接调用操作系统的退出系统调用，而是走了一条异常驱动的路径。

**抛出 SystemExit**

`sys.exit(arg)` 的实现（`Python/sysmodule.c` 中的 `sys_exit`）核心等价于：

```c
// 简化伪代码
void sys_exit(PyObject *arg) {
    if (arg == NULL || arg == Py_None) {
        PyErr_SetObject(PyExc_SystemExit, Py_None);  // 退出码 0
    } else if (PyLong_Check(arg)) {
        PyErr_SetObject(PyExc_SystemExit, arg);  // 退出码 = 整数
    } else {
        // 字符串/其他：写到 stderr，退出码 1
        if (arg is str) sys_stderr_write(arg);
        PyErr_SetObject(PyExc_SystemExit, PyLong_FromLong(1));
    }
    // 什么都不做，只是设置异常
}
```

关键是：它只是"设置一个 `SystemExit` 异常"，然后让 C 层的异常处理机制接管。`SystemExit` 继承自 `BaseException`（不是 `Exception`），所以普通的 `except Exception:` 不会误捕它——这是刻意设计，避免业务异常处理把退出信号吞掉。

**解释器主循环的捕获**

CPython 的主执行循环（`PyEval_EvalFrameEx` 及其上层）在每次字节码执行前后都会检查是否有异常待处理。当 `SystemExit` 被抛出且一路冒泡到顶层（脚本最外层、REPL 单条语句顶层）仍未被捕获时，解释器的顶层异常处理逻辑（`Py_FatalError`/`handle_system_exit`）接管：

1. 取出 `SystemExit` 携带的 `code` 参数。
2. 如果 `code` 是整数，把它作为退出码调用 `Py_Exit(code)`——最终调用 C 的 `exit(code)` 把码传给操作系统。
3. 如果 `code` 是字符串或其它对象，先把它写到 stderr，再以退出码 1 调用 `exit(1)`。
4. 调用已注册的 `atexit` 钩子和 Python 级清理（但这不是 `SystemExit` 的职责，而是 `exit()` 流程的一部分）。

**为什么用异常而非直接 exit**

用异常机制有几个好处：

- **资源清理**：异常传播过程中，所有 `try/finally` 的 `finally` 块、`with` 语句的 `__exit__` 都会正常执行。文件会被关闭、锁会被释放。如果直接调 C 的 `exit()`，这些清理全部跳过，可能留下脏数据或未释放的资源。
- **可被捕获（虽不推荐）**：测试框架有时需要"假装退出但不真退出"，可以捕获 `SystemExit` 拿到退出码做断言。
- **统一路径**：无论 `sys.exit`、`raise SystemExit`、还是解释器自身检测到致命错误，都走同一条"抛 SystemExit → 主循环处理"的路径，行为一致。

**os._exit 的对比**

`os._exit(code)` 直接调用操作系统的 `_exit` 系统调用，立即终止进程，不抛异常、不清理、不 flush 缓冲。它的存在主要是为了 `os.fork()` 后的子进程使用：fork 后子进程继承了父进程的内存和文件描述符，如果子进程用 `sys.exit` 退出，会触发父进程注册的 `atexit` 钩子和 `__exit__`，可能造成混乱（比如父进程的日志 handler 被子进程关闭）。所以在 fork 子进程内退出应使用 `os._exit`。普通脚本里永远用 `sys.exit`。

**退出码的走向**

最终 `exit(code)` 把退出码交给操作系统。在 POSIX 系统上，退出码被截断到 0~255 的范围（`code & 0xFF`）。shell 用 `$?` 读取这个码。这就是为什么你 `sys.exit(300)` 后 `echo $?` 显示的是 `44`（300 & 0xFF）。约定俗成的几个码：0 成功、1 一般错误、2 用法错误、126 无权限执行、127 命令未找到——后两者主要由 shell 产生。

### 4.5 缓冲机制：line-buffered 与 block-buffered

为什么同样的 `print` 在终端里实时显示，被重定向到文件后却"攒一堆才输出"？根源在于文本流的缓冲模式会根据底层 fd 是否是终端设备自动切换。

**三种缓冲策略**

CPython 的 `TextIOWrapper` 在创建时会从底层 `BufferedWriter`/`BufferedReader` 继承缓冲策略，而缓冲层的策略取决于 `FileIO` 所在 fd 的类型：

- **行缓冲（line-buffered）**：当目标 fd 是终端（`isatty() == True`）时，stdout 采用行缓冲。每写入一个换行符 `\n`，缓冲区就立即 flush 到底层 fd。所以你在终端里 `print("x")` 立刻看到——因为 print 默认 `end="\n"`，触发了行缓冲的刷出条件。
- **块缓冲（block-buffered）**：当目标 fd 不是终端（文件、管道）时，stdout 切换为块缓冲。数据攒在内存里，直到达到块大小（通常 8KB 左右，由 `io.DEFAULT_BUFFER_SIZE` 决定）或显式 flush 才写到底层。这能大幅减少系统调用次数，对大量输出性能有利，但代价是"看不到实时输出"。
- **无缓冲（unbuffered）**：`python -u` 或 `PYTHONUNBUFFERED=1` 时，stdout/stderr 的缓冲层被绕过，每次写直接到 fd。stderr 默认就接近无缓冲（各实现略有差异，但其设计意图是让错误尽快可见）。

**为什么终端用行缓冲**

终端是交互设备，人等着看输出。行缓冲保证每行一写即现，体验流畅；同时仍把"同行内的多次小写"合并成一次系统调用，兼顾性能。例如 `print("a", "b", "c")` 实际是 `write("a b c\n")` 一次，行缓冲触发一次刷出，既实时又高效。

**为什么文件/管道用块缓冲**

文件和管道的写入成本（系统调用 + 磁盘/管道传输）远高于终端内存写入，攒成大块一次性写能显著降低成本。对管道尤其重要——管道有容量上限，频繁小写入可能让上下游频繁切换，块缓冲使吞吐最大化。副作用就是"看不到实时进度"，需要手动 flush 弥补。

**stderr 为什么特殊**

`sys.stderr` 在多数 CPython 实现中是不缓冲或行缓冲的。原因是：错误信息往往意味着程序状态异常，应当尽快可见，以便用户或日志系统及时感知。如果 stderr 也块缓冲，程序崩溃前缓冲区里的错误信息会随进程消亡丢失，排错极难。Python 让 stderr 默认不缓冲（或行缓冲），保证"写了就出来"。

**手动 flush 的真实效果**

`sys.stdout.flush()` 调用缓冲层的 `flush`，把当前缓冲区所有内容立即写到底层 fd，并清空缓冲区。它不改变缓冲模式——下次写入仍按原模式攒数据。所以对长跑程序，你需要在每个"想看到进度"的节点都 flush，而不是只 flush 一次。

**`python -u` 的实现**

`-u` 标志让解释器在创建 stdout/stderr 的 `FileIO` 时，强制使用 unbuffered 模式（实际是让缓冲层块大小为 1，近似无缓冲）。这等价于"每次写都 flush"，代价是显著增加系统调用次数，对输出量大的程序有性能影响。所以 `-u` 适合调试和管道交互场景，正式部署的大输出服务一般不开。

**编码层与缓冲层的关系**

`TextIOWrapper` 自身也有一层缓冲（用于编码累积，比如多字节字符跨 write 的分割）。`flush` 会同时刷 TextIOWrapper 的编码缓冲和下层 BufferedWriter 的字节缓冲。所以一次 `sys.stdout.flush()` 足以保证数据真正出到 fd，无需分别处理两层。但 `write` 返回后数据可能还在两层缓冲里——这也是为什么"write 后立刻崩溃"仍可能丢数据，必须显式 flush 或保证程序正常退出时自动 flush。

## 5. 总结

### 5.1 本文内容要点

- `sys` 模块提供与解释器及运行环境相关的变量与函数，是 Python 程序命令行交互与标准流操作的基础设施。
- `sys.argv` 是命令行参数列表，`argv[0]` 是脚本名（或 `-c` 标记），`argv[1]` 起是用户参数，全部为字符串类型，需要数字要自行转换；复杂参数解析应转用 `argparse`。
- `sys.stdin` 是标准输入流，支持 `read`/`readline`/迭代，来自终端时阻塞等待键盘，来自管道时读上游输出；`isatty()` 可判断来源。
- `sys.stdout` 是标准输出流，`print` 默认写到这里；`write` 不加换行需手动加；重定向可替换为文件或 `StringIO`，推荐用 `contextlib.redirect_stdout` 安全替换。
- `sys.stderr` 是标准错误流，与 stdout 分属 fd 1 和 fd 2，重定向时彼此独立；错误/警告/诊断信息应走 stderr 以免污染管道数据。
- 缓冲模式分行缓冲（终端）、块缓冲（文件/管道）、无缓冲（`-u`/stderr）；`print(..., flush=True)` 或 `sys.stdout.flush()` 用于强制刷出，进度条与长跑程序的关键日志必须 flush。
- `sys.exit(code)` 抛 `SystemExit` 由解释器主循环捕获，退码 0 表成功、非零表失败；`finally` 与 `__exit__` 仍会执行，资源能清理；fork 子进程退出应用 `os._exit`。
- `sys.platform`、`sys.version`/`sys.version_info`、`sys.executable`、`sys.path`、`sys.modules`、`sys.maxsize` 等属性用于跨平台分支、版本检查、定位解释器、模块搜索与缓存。
- 命令行工具的通用契约：stdout 出结果数据、stderr 出人读信息、退出码表状态、stdin 接管道输入。

### 5.2 读完应能掌握

- 说明 `sys.argv` 的结构（`argv[0]` 是什么、参数类型为何都是字符串）并能写出从 argv 取参、做类型转换、处理参数错误的命令行小工具。
- 用 `sys.stdin` 的 `read`/`readline`/迭代三种方式读取输入，并能用 `isatty()` 区分交互与管道模式以表现不同行为。
- 用 `sys.stdout.write` 与 `print` 控制输出，会用 `flush` 让进度条/长跑程序日志实时可见，能用 `redirect_stdout` 或直接替换把 stdout 重定向到文件或 `StringIO`。
- 说明 stdout 与 stderr 分属 fd 1/2 这一机制如何让二者在 `>`、`2>`、`2>&1`、`|` 下各自独立或合并，并据此正确选择把信息写往哪个流。
- 说明 `sys.exit` 抛 `SystemExit`、由解释器主循环捕获并设退出码的完整路径，解释为何 `finally` 仍执行、为何子进程该用 `os._exit`。
- 说明缓冲模式（行缓冲/块缓冲/无缓冲）的切换条件及对"实时输出"的影响，能判断何时必须 flush。
- 用 `sys.platform`、`sys.version_info`、`sys.executable`、`sys.path` 写跨平台与版本兼容代码。