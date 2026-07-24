---
group:
  title: 【19】标准库精讲
  order: 19
order: 18
title: argparse 命令行参数解析
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是命令行参数解析

写一个能在终端用 `python tool.py` 运行的脚本时，我们常常需要让用户通过命令行传入一些控制信息：要处理的文件路径、输出目录、运行模式、是否显示详细日志等。这些跟在命令后面的附加信息就是**命令行参数**。例如：

```
python tool.py --input data.csv --output result.csv --mode strict --verbose
```

上面这一行里，`tool.py` 是脚本本身，而 `--input data.csv`、`--output result.csv`、`--mode strict`、`--verbose` 都是命令行参数。脚本需要把这些参数"读进来"并理解它们的含义，才能按用户意图执行。把这一过程——读取、识别、转换类型、校验合法性、最终交给业务代码使用——称为**命令行参数解析**。

最朴素的做法是直接从 `sys.argv` 这个列表里按位置取值。`sys.argv[0]` 是脚本名，`sys.argv[1]` 是第一个参数，依此类推。但当参数多了以后，手写 `sys.argv` 解析会变得非常痛苦：你得自己判断哪个是 `--input` 的值、哪个是开关、怎么把字符串转成数字、怎么打印帮助信息、怎么处理用户漏传参数的情况。这些逻辑写到后面，解析代码比业务代码还长，而且每个脚本都要重写一遍。

`argparse` 就是 Python 标准库里专门解决这个问题的一站式模块。它属于标准库（`import argparse` 直接用，无需安装），其核心思路是**声明式**：你先用一组 API 把"我这个工具接受哪些参数、各自叫什么名字、是什么类型、有没有默认值、允不允许缺省"这个参数规格描述清楚，然后调用一次 `parse_args()`，它就自动帮你完成从字符串到目标类型的转换、合法性校验、必填检查、帮助信息生成，最后把所有参数打包成一个 `Namespace` 对象交给你。用户传错了参数，它还可以自动打印帮助并退出，不需要你写一句错误处理。

`argparse` 在 Python 标准库中的定位是"命令行接口的默认地基"。事实上，第三方的 Click、Typer 等更现代的 CLI 库，概念模型也大量借鉴了 argparse；`pip`、`django-admin` 等工具的命令行入口都用 argparse 或基于它的模块构建。掌握 argparse，等于掌握了 Python 命令行工具的通用语言。

### 1.2 基本语法与最小用法

argparse 的使用三步走：创建解析器 → 添加参数声明 → 解析并取值。

```python
import argparse

# 第一步：创建解析器，描述这个工具是干什么的
parser = argparse.ArgumentParser(
    prog="greet",               # 程序名，显示在帮助中
    description="一个最简单的打招呼工具",  # 工具描述
)

# 第二步：声明一个位置参数 name（不带 -- 前缀的是位置参数）
parser.add_argument("name", help="要打招呼的对象名字")

# 第三步：解析，得到 Namespace 对象
args = parser.parse_args()
print(f"你好，{args.name}！")
```

把它保存为 `greet.py`，在终端运行：

```
$ python greet.py 世界
你好，世界！
```

`argparse` 会**自动生成 `-h/--help` 帮助**，不需要你写一行帮助代码：

```
$ python greet.py -h
usage: greet [-h] name

一个最简单的打招呼工具

positional arguments:
  name        要打招呼的对象名字

options:
  -h, --help  show this help message and exit
```

用户漏传参数时，argparse 也会自动报错并提示用法：

```
$ python greet.py
usage: greet [-h] name
greet: error: the following arguments are required: name
```

这就是 argparse 最核心的价值：你只声明"name 是一个必填的位置参数，帮助文案是xxx"，剩下的错误提示、帮助生成、退出码全都自动完成。对照手写 `sys.argv` 的版本，你能明显感受到声明式解析的省心。

**最小可运行心法**。任何 argparse 程序都逃不出这三步。后续的 `add_argument` 各种参数（`type`、`default`、`choices`、`action` 等）只是让你把"参数长什么样"描述得更精细，而 `parse_args()` 拿到的 `Namespace` 则是业务逻辑取值的统一入口。把这三步记住，剩下的只是丰富参数声明而已。

## 2. 核心内容

### 2.1 创建解析器：ArgumentParser

`ArgumentParser` 是整个解析过程的容器与入口。它本身不解析参数，而是承载参数声明，并在你调用 `parse_args()` 时统一执行解析。创建解析器时传入的关键字参数，主要影响**帮助信息的呈现**和**错误提示的措辞**，基本不影响解析逻辑本身。

签名（常用部分）：

```python
ArgumentParser(
    prog=None,                # 程序名，默认取 sys.argv[0]
    description=None,         # 顶部一段描述，出现在 usage 之后
    epilog=None,              # 帮助末尾的一段文字
    add_help=True,            # 是否自动添加 -h/--help
    allow_abbrev=True,        # 是否允许前缀简写，如 --ver 匹配 --version
    formatter_class=HelpFormatter,  # 帮助格式化器
)
```

逐个看常用项的实际效果。

**prog：程序名**。帮助里第一行 `usage:` 后面跟着的名字默认来自 `sys.argv[0]`，也就是你运行脚本时写的命令。这在打包成命令行工具时往往不准确（用户可能通过软链接、子命令等形式调用），所以推荐显式指定 `prog`。

```python
import argparse

parser = argparse.ArgumentParser(
    prog="mytool",
    description="演示 prog 的作用",
)
parser.parse_args(["-h"])
```

```
# 输出：
usage: mytool [-h]

options:
  -h, --help  show this help message and exit
```

如果不写 `prog="mytool"`，而你的脚本叫 `demo.py`，那么 usage 行会变成 `usage: demo.py [-h]`。显式 prog 让帮助与你对外发布的命令名一致。

**description 与 epilog**。`description` 是 usage 行之后、参数列表之前的一段说明，通常是一两句话概括工具用途；`epilog` 是参数列表之后的一段补充，常用于示例或版权声明。

```python
import argparse

parser = argparse.ArgumentParser(
    prog="imgconv",
    description="把图片在各种格式之间转换",
    epilog="示例：imgconv input.png output.jpg --quality 90",
)
parser.parse_args(["-h"])
```

```
# 输出：
usage: imgconv [-h]

把图片在各种格式之间转换

options:
  -h, --help  show this help message and exit

示例：imgconv input.png output.jpg --quality 90
```

**formatter_class：选择帮助格式化器**。默认 `HelpFormatter` 对长文本做了较激进的截断与换行处理，如果你写了很长的 `description`，可能被压成一行。常用替代：

- `argparse.RawDescriptionHelpFormatter`：保留 `description` / `epilog` 中的原始换行，适合放多行示例。
- `argparse.ArgumentDefaultsHelpFormatter`：在每个参数帮助后自动追加 `(default: xxx)`，让用户一眼看到默认值。

```python
import argparse

parser = argparse.ArgumentParser(
    prog="cleanup",
    description="清理临时文件\n  按修改时间过滤\n  支持递归子目录",
    formatter_class=argparse.RawDescriptionHelpFormatter,
)
parser.add_argument("--days", type=int, default=7, help="清理多少天前的文件")
parser.parse_args(["-h"])
```

```
# 输出：
usage: cleanup [-h] [--days DAYS]

清理临时文件
  按修改时间过滤
  支持递归子目录

options:
  -h, --help   show this help message and exit
  --days DAYS  清理多少天前的文件
```

看到 `description` 里的换行被原样保留了。如果用默认格式化器，这三行会被拼成一行。

**add_help：是否自动加 -h/--help**。默认 `True`，绝大多数情况保持默认即可。只有当你想自定义帮助触发逻辑（比如用一个子命令统一管理多个工具的帮助）时才会设 `False`。

**allow_abbrev：前缀简写**。默认 `True`，允许用户只写一个能唯一匹配的长选项前缀。例如声明了 `--verbose`，用户可以写 `--ver` 甚至 `--v`（只要不歧义）。

```python
import argparse

parser = argparse.ArgumentParser(prog="demo", allow_abbrev=True)
parser.add_argument("--verbose", action="store_true")
args = parser.parse_args(["--ver"])
print(args)
```

```
# 输出：
Namespace(verbose=True)
```

这个特性在没有歧义时很方便，但当代码里同时存在 `--version` 和 `--verbose` 时，`--ver` 就成了歧义前缀，argparse 会报错。如果担心隐患，可以设 `allow_abbrev=False` 强制全名匹配。

### 2.2 添加参数：add_argument 全参数详解

`add_argument` 是 argparse 的主战场。每次调用声明一个参数，所有声明的集合构成这个工具的"参数规格"。它的完整签名（按使用频率简化）：

```python
add_argument(
    name_or_flags,        # 参数名或选项标识，如 "input" 或 "-v", "--verbose"
    action="store",       # 参数被解析后如何保存
    type=str,             # 类型转换函数
    dest=None,            # 结果属性名（默认从名字推导）
    default=None,         # 缺省值
    required=False,       # 是否必填（仅对可选参数有意义）
    choices=None,         # 枚举限制
    nargs=None,           # 消耗的参数个数
    help=None,            # 帮助文案
    metavar=None,         # 帮助中占位显示名
    const=None,           # 配合 store_const / nargs='?' 使用的常量
)
```

下面逐个拆解。先看最基本的"参数名"。

#### 2.2.1 位置参数 vs 可选参数

`add_argument` 第一个位置传的是参数名标识，有两种风格，决定了参数类别：

- **位置参数**：传一个不带 `-` 前缀的字符串，如 `add_argument("input")`。用户必须按位置顺序提供，没有名字前缀，**默认就是必填**。
- **可选参数**：传一个或多个以 `-`（短选项，单字符）或 `--`（长选项，多字符）开头的字符串，如 `add_argument("-v", "--verbose")`。用户用 `--verbose` 或 `-v` 显式启用，**默认非必填**（除非设 `required=True`）。

```python
import argparse

parser = argparse.ArgumentParser(prog="copytool")
parser.add_argument("src", help="源文件")              # 位置参数
parser.add_argument("dst", help="目标文件")              # 位置参数
parser.add_argument("--force", action="store_true", help="覆盖已存在目标")

args = parser.parse_args(["a.txt", "b.txt", "--force"])
print(args)
```

```
# 输出：
Namespace(src='a.txt', dst='b.txt', force=True)
```

用户调用时 `a.txt b.txt` 按声明顺序赋给 `src`、`dst`，`--force` 是开关。位置参数不能乱序：先 `src` 后 `dst` 的顺序在声明和调用里必须一致。

**何时用位置参数、何时用可选参数**。经验法则：必填的核心输入用位置参数（如 `cp src dst` 里的两个路径）；可调节的开关、选项用可选参数（如 `--force`、`--verbose`）。位置参数多一点会让命令更紧凑，但超过 3 个就容易让用户记不住顺序，这时可选项更友好。

注意短选项和长选项可以同时声明并视为同一个参数：`add_argument("-v", "--verbose")` 表示用户写 `-v` 或 `--verbose` 都能触发它，等价。

#### 2.2.2 type：类型转换

命令行传进来的所有东西本质上都是字符串。`type` 参数接受一个可调用对象（函数），argparse 会把它作用在原始字符串上做类型转换。最常用的是内置的 `int`、`float`、`str`，也可以传自定义函数甚至标准库函数。

```python
import argparse

parser = argparse.ArgumentParser(prog="calc")
parser.add_argument("--count", type=int, default=1, help="循环次数")
parser.add_argument("--rate", type=float, default=0.5, help="折扣率")
args = parser.parse_args(["--count", "3", "--rate", "0.8"])
print(args)
print(type(args.count), type(args.rate))
```

```
# 输出：
Namespace(count=3, rate=0.8)
<class 'int'> <class 'float'>
```

如果用户传了一个无法转换的字符串，argparse 会自动报错：

```
$ python calc.py --count abc
usage: calc [-h] [--count COUNT] [--rate RATE]
calc: error: argument --count: invalid int value: 'abc'
```

这个错误信息比你手写 `int(sys.argv[i])` 捕获 `ValueError` 要省事得多。

**用标准库函数做类型转换**是一个很有用的技巧。比如 `type=argparse.FileType('r')` 把参数直接转成已打开的文件对象；`type=pathlib.Path` 把字符串转成 `Path` 对象，后续操作更面向对象。

```python
import argparse
from pathlib import Path

parser = argparse.ArgumentParser(prog="filetool")
parser.add_argument("--input", type=Path, help="输入文件路径")
args = parser.parse_args(["--input", "/tmp/data.txt"])
print(args.input, type(args.input))
print(args.input.suffix)   # 直接用 Path 的方法
```

```
# 输出：
/tmp/data.txt <class 'pathlib.PosixPath'>
.txt
```

`FileType` 则更进一步，直接返回可读写的文件句柄，工具退出时 argparse 还会帮你关闭：

```python
import argparse

parser = argparse.ArgumentParser(prog="wc-lite")
parser.add_argument("--input", type=argparse.FileType('r'), help="要统计的文件")
args = parser.parse_args(["--input", "/etc/hostname"])
text = args.input.read()
print(f"字符数: {len(text)}")
```

```
# 输出：
字符数: 13
```

**自定义类型转换函数**。只要写一个接收字符串、返回目标值的函数，传给 `type` 即可。常用于"字符串→枚举对象""路径校验后返回 Path"等场景。

```python
import argparse
from pathlib import Path

def existing_file(value):
    p = Path(value)
    if not p.is_file():
        raise argparse.ArgumentTypeError(f"文件不存在: {value}")
    return p

parser = argparse.ArgumentParser(prog="must_exist")
parser.add_argument("--config", type=existing_file, help="配置文件（必须存在）")
args = parser.parse_args(["--config", "/etc/hostname"])
print(args.config)
```

```
# 输出：
/etc/hostname
```

传一个不存在的路径，argparse 会用 `ArgumentTypeError` 里的消息自动报错。这比在业务代码里 `if not exists: sys.exit(...)` 要规范——校验在解析阶段就完成，业务函数拿到的参数一定是合法的。

#### 2.2.3 default：默认值

`default` 指定参数未被用户提供时的取值。对可选参数尤其重要：大多数情况下用户只关心几个关键选项，其余按默认走。

```python
import argparse

parser = argparse.ArgumentParser(prog="server")
parser.add_argument("--host", default="127.0.0.1", help="监听地址")
parser.add_argument("--port", type=int, default=8000, help="监听端口")
parser.add_argument("--debug", action="store_true", help="调试模式")
args = parser.parse_args([])   # 不传任何参数
print(args)
```

```
# 输出：
Namespace(host='127.0.0.1', port=8000, debug=False)
```

注意 `--debug` 没有写 `default`，但用了 `action="store_true"`，它的默认值隐式为 `False`。`store_true` / `store_false` 这种开关型 action 自带默认值，不用再写 `default`。

**一个常被忽略的细节**：如果 `default` 本身是某个可变对象（比如列表），多个解析调用之间会共享同一个对象。一般推荐用 `None` 做默认值，业务里再判断；需要列表时配合 `action="append"` 并让 argparse 自己初始化。

#### 2.2.4 required：是否必填

可选参数默认是可选的。但如果某个可选参数业务上必须有，可以用 `required=True` 强制。注意位置参数本身就是必填的，`required` 只对 `--` 选项有意义。

```python
import argparse

parser = argparse.ArgumentParser(prog="upload")
parser.add_argument("--token", required=True, help="鉴权 token（必填）")
args = parser.parse_args(["--token", "abc123"])
print(args)
```

```
# 输出：
Namespace(token='abc123')
```

```
$ python upload.py
usage: upload [-h] --token TOKEN
upload: error: the following arguments are required: --token
```

**何时用 `required=True` 而不是直接做成位置参数**。如果某个值语义上是"配置项"而不是"主输入"，用 `--token` 这种带名字的可选项更清晰，配合 `required=True` 保证不漏传；而如果是工具要操作的核心对象（如要上传的文件），用位置参数更自然。

#### 2.2.5 choices：枚举限制

`choices` 是一个可迭代对象，限定参数只能取其中的值。用户传了不在列表里的值，argparse 自动报错。常用于"运行模式""日志级别""输出格式"这类取值有限的场景。

```python
import argparse

parser = argparse.ArgumentParser(prog="convert")
parser.add_argument("--format", choices=["json", "yaml", "toml"], default="json", help="输出格式")
args = parser.parse_args(["--format", "yaml"])
print(args)
```

```
# 输出：
Namespace(format='yaml')
```

```
$ python convert.py --format xml
usage: convert [-h] [--format {json,yaml,toml}]
convert: error: argument --format: invalid choice: 'xml' (choose from 'json', 'yaml', 'toml')
```

帮助里会自动列出可选值 `{json,yaml,toml}`，省去你单独说明。配合 `default` 时要保证默认值也在 `choices` 中，否则 argparse 在处理默认值时不会校验，但语义上会让人困惑。

#### 2.2.6 action：参数保存方式

`action` 决定 argparse 拿到这个参数后"怎么存"。这是 `add_argument` 里语义最丰富的一个参数，掌握几种常用 action 基本够用。

**store（默认）**：取下一个 token 作为值，按 `type` 转换后存入。前面所有带值的例子都是这个 action。

**store_true / store_false**：开关型，不消耗额外 token。`--verbose` 出现则 `args.verbose=True`，不出现则 `False`（`store_false` 相反）。这是写 `--debug`、`--dry-run` 等开关的标准方式。

```python
import argparse

parser = argparse.ArgumentParser(prog="deploy")
parser.add_argument("--dry-run", action="store_true", help="只打印不真正执行")
parser.add_argument("--no-cache", action="store_false", dest="use_cache", help="禁用缓存")
args = parser.parse_args(["--dry-run", "--no-cache"])
print(args)
```

```
# 输出：
Namespace(dry_run=True, use_cache=False)
```

注意 `--no-cache` 用了 `dest="use_cache"` 把属性名翻转过来——`store_false` 出现表示"禁用"，所以属性叫 `use_cache` 更符合直觉（出现时为 `False`，不出现时为 `True`）。

**append**：同名选项可多次出现，每次的值追加到列表。常用于"多次指定输入文件"。

```python
import argparse

parser = argparse.ArgumentParser(prog="cat-tool")
parser.add_argument("--file", action="append", help="输入文件，可多次指定")
args = parser.parse_args(["--file", "a.txt", "--file", "b.txt"])
print(args)
```

```
# 输出：
Namespace(file=['a.txt', 'b.txt'])
```

**count**：统计某个选项出现的次数，常配合 `-v` 做日志级别。

```python
import argparse

parser = argparse.ArgumentParser(prog="svc")
parser.add_argument("-v", "--verbose", action="count", default=0, help="详细程度，-v 一级，-vv 两级")
args = parser.parse_args(["-vvv"])
print(args)
```

```
# 输出：
Namespace(verbose=3)
```

用户写 `-vvv` 等价于 `-v -v -v`，得到 `verbose=3`，业务代码据此调整日志级别。`default=0` 表示不写 `-v` 时是最低详细度。

**store_const**：选项出现时不消耗额外 token，把 `const` 指定的常量存入。一般配合 `const` 使用。

```python
import argparse

parser = argparse.ArgumentParser(prog="mode-tool")
parser.add_argument("--safe", action="store_const", const="safe", dest="mode", help="安全模式")
parser.add_argument("--fast", action="store_const", const="fast", dest="mode", help="快速模式")
args = parser.parse_args(["--fast"])
print(args)
```

```
# 输出：
Namespace(mode='fast')
```

两个选项都写到同一个 `dest="mode"`，用户选其一。这种写法在做"互斥模式选择"时能看到，不过更规范的做法是用后面要讲的互斥组。

**version**：打印版本号后退出。需要配合 `version="..."`。

```python
import argparse

parser = argparse.ArgumentParser(prog="mytool")
parser.add_argument("--version", action="version", version="mytool 1.2.3")
parser.parse_args(["--version"])
```

```
# 输出：
mytool 1.2.3
```

#### 2.2.7 nargs：参数消耗个数

`nargs` 决定一个参数"吃掉"几个后续 token。取值有 `N`（整数）、`?`、`*`、`+`、`argparse.REMAINDER`。

**N（整数）**：固定消耗 N 个，结果是一个长度为 N 的列表。

```python
import argparse

parser = argparse.ArgumentParser(prog="rect")
parser.add_argument("--size", nargs=2, type=int, metavar=("W", "H"), help="宽 高")
args = parser.parse_args(["--size", "100", "200"])
print(args)
```

```
# 输出：
Namespace(size=[100, 200])
```

**?**：消耗零个或一个 token。常配合 `default` 和 `const`：选项不出现取 `default`；选项出现但后面没值取 `const`；选项出现且后面有值取那个值。

```python
import argparse

parser = argparse.ArgumentParser(prog="optional-value")
parser.add_argument("--mode", nargs="?", const="auto", default="manual", help="不传=manual，传但不带值=auto，传带值=该值")
args = parser.parse_args([])            # 不传
print("不传:", args)
args = parser.parse_args(["--mode"])    # 传但不带值
print("带选项不带值:", args)
args = parser.parse_args(["--mode", "strict"])  # 传且带值
print("带选项带值:", args)
```

```
# 输出：
不传: Namespace(mode='manual')
带选项不带值: Namespace(mode='auto')
带选项带值: Namespace(mode='strict')
```

`nargs='?'` 这种"三态"在写 `--output [FILE]`（默认输出到 stdout，写了 `--output` 不带值输出到默认文件，带了值输出到指定文件）时很有用。

*****：零个或多个，结果是列表（可能为空）。

```python
import argparse

parser = argparse.ArgumentParser(prog="gather")
parser.add_argument("files", nargs="*", help="任意数量的输入文件")
args = parser.parse_args(["a.txt", "b.txt", "c.txt"])
print(args)
args = parser.parse_args([])
print(args)
```

```
# 输出：
Namespace(files=['a.txt', 'b.txt', 'c.txt'])
Namespace(files=[])
```

**+**：一个或多个，至少要有一个，否则报错。

```python
import argparse

parser = argparse.ArgumentParser(prog="merge")
parser.add_argument("files", nargs="+", help="至少一个输入文件")
args = parser.parse_args(["a.txt"])
print(args)
```

```
$ python merge.py
usage: merge [-h] files [files ...]
merge: error: the following arguments are required: files
```

`*` 和 `+` 在收集"不定数量的文件"时很常用，区别只在是否允许为空。

#### 2.2.8 dest 与 metavar

**dest：属性名映射**。默认情况下，位置参数的属性名就是参数名本身，可选参数的属性名是长选项去掉 `--` 并把 `-` 替换成 `_`（如 `--output-dir` → `output_dir`）。`dest` 允许你显式覆盖。

```python
import argparse

parser = argparse.ArgumentParser(prog="web")
parser.add_argument("--output-dir", dest="output_dir", help="输出目录")
args = parser.parse_args(["--output-dir", "/tmp/out"])
print(args)
```

```
# 输出：
Namespace(output_dir='/tmp/out')
```

`--output-dir` 本身就会映射成 `output_dir`，这里写 `dest` 是显式强调，更多时候用于短选项写法时让属性名更可读：

```python
parser.add_argument("-n", "--dry-run", dest="dry_run", action="store_true")
```

**metavar：帮助中的占位名**。默认情况下，帮助里 `--count COUNT` 的 `COUNT` 是参数名大写。`metavar` 让你自定义这个占位显示，常用于让帮助更表达意图。

```python
import argparse

parser = argparse.ArgumentParser(prog="fetch")
parser.add_argument("--url", metavar="URL", help="要请求的地址")
parser.add_argument("--retry", type=int, metavar="TIMES", help="重试次数")
parser.parse_args(["-h"])
```

```
# 输出：
usage: fetch [-h] [--url URL] [--retry TIMES]

options:
  -h, --help     show this help message and exit
  --url URL      要请求的地址
  --retry TIMES  重试次数
```

`metavar` 只影响帮助显示，不影响 `dest`，也不影响实际取值方式。配合 `nargs=2` 时可以传元组 `(W, H)` 让占位分别显示。

### 2.3 解析与取值：parse_args 与 Namespace

声明完参数后，`parse_args()` 一步完成解析。它默认从 `sys.argv[1:]` 读取，也支持显式传一个字符串列表（这在测试或被其他代码调用时很有用）。

```python
import argparse

parser = argparse.ArgumentParser(prog="demo")
parser.add_argument("--name", default="匿名")
parser.add_argument("--age", type=int, default=0)

# 显式传参解析（不依赖命令行），便于测试
args = parser.parse_args(["--name", "小明", "--age", "18"])
print(args)
print(args.name, args.age)
```

```
# 输出：
Namespace(age=18, name='匿名' 即被覆盖为 '小明')
Namespace(age=18, name='小明')
小明 18
```

**Namespace 是什么**。`parse_args()` 返回一个 `argparse.Namespace` 对象，它本质上是一个简单的属性容器。你可以用 `args.属性名` 访问，也可以用 `vars(args)` 转成字典批量处理。

```python
import argparse

parser = argparse.ArgumentParser(prog="dump")
parser.add_argument("--host", default="localhost")
parser.add_argument("--port", type=int, default=8080)
args = parser.parse_args(["--host", "1.2.3.4", "--port", "9000"])

print(args.host)
print(args.port)
print(vars(args))   # 转字典，便于遍历或日志记录
```

```
# 输出：
1.2.3.4
9000
{'host': '1.2.3.4', 'port': 9000}
```

**解析失败的退出码**。用户传错参数时，argparse 会打印 usage 和错误信息到 stderr，然后调用 `sys.exit(2)`。`2` 是 POSIX 约定的"命令行用法错误"退出码。这意味着在交互式环境里调用 `parse_args(["--bad"])` 会直接抛 `SystemExit`，这是测试时需要注意的点。

**parse_known_args**。有时你想允许"未知参数"透传给下游工具（类似 wrapper 脚本），用 `parse_known_args()`：它返回 `(args, extras)`，未知部分放进 `extras` 列表而不报错。

```python
import argparse

parser = argparse.ArgumentParser(prog="wrapper")
parser.add_argument("--verbose", action="store_true")
args, extras = parser.parse_known_args(["--verbose", "--unknown", "x"])
print("已知:", args)
print("未知:", extras)
```

```
# 输出：
已知: Namespace(verbose=True)
未知: ['--unknown', 'x']
```

### 2.4 自动帮助：-h/--help

argparse 自动添加 `-h` / `--help` 选项，调用时打印帮助并以退出码 0 退出。帮助内容来自你在 `ArgumentParser` 和每个 `add_argument` 里写的 `description`、`help`、`choices`、`default` 等信息，无需手动维护。

```python
import argparse

parser = argparse.ArgumentParser(
    prog="mytool",
    description="一个演示自动帮助的玩具工具",
)
parser.add_argument("input", help="输入文件路径")
parser.add_argument("-o", "--output", default="out.txt", help="输出文件路径")
parser.add_argument("-f", "--format", choices=["json", "csv"], default="json", help="输出格式")
parser.add_argument("-v", "--verbose", action="store_true", help="打印详细日志")
parser.parse_args(["-h"])
```

```
# 输出：
usage: mytool [-h] [-o OUTPUT] [-f {json,csv}] [-v] input

一个演示自动帮助的玩具工具

positional arguments:
  input                 输入文件路径

options:
  -h, --help            show this help message and exit
  -o OUTPUT, --output OUTPUT
                        输出文件路径
  -f {json,csv}, --format {json,csv}
                        输出格式
  -v, --verbose         打印详细日志
```

注意帮助里 `[-o OUTPUT]` 用方括号表示可选，`input` 没方括号表示必填；`{json,csv}` 自动从 `choices` 推导。这些约定都是 argparse 帮你做好的。

**让 help 更好用的小技巧**。

一是用 `%(default)s` 在 help 文案里引用默认值，避免文案和代码不一致：

```python
parser.add_argument("--port", type=int, default=8000, help="监听端口（默认 %(default)s）")
```

```
# 输出（节选）：
  --port PORT  监听端口（默认 8000）
```

二是用 `%(choices)s` 引用 choices 列表：

```python
parser.add_argument("--format", choices=["json", "csv"], help="输出格式（可选 %(choices)s）")
```

### 2.5 子命令：add_subparsers

像 `git clone`、`git commit`、`git push` 这样"主命令后跟一个子命令，每个子命令有自己的参数"，是 CLI 工具的常见形态。argparse 用 `add_subparsers()` 支持这种结构。

```python
import argparse

parser = argparse.ArgumentParser(prog="mygit", description="一个仿 git 的玩具工具")
sub = parser.add_subparsers(dest="command", help="子命令")

# 子命令：clone
p_clone = sub.add_parser("clone", help="克隆仓库")
p_clone.add_argument("url", help="仓库地址")
p_clone.add_argument("--depth", type=int, help="浅克隆深度")

# 子命令：commit
p_commit = sub.add_parser("commit", help="提交更改")
p_commit.add_argument("-m", "--message", required=True, help="提交信息")

args = parser.parse_args(["clone", "https://example.com/repo.git", "--depth", "1"])
print(args)
args = parser.parse_args(["commit", "-m", "fix bug"])
print(args)
```

```
# 输出：
Namespace(command='clone', url='https://example.com/repo.git', depth=1)
Namespace(command='commit', message='fix bug')
```

**子命令的工作机制**。`add_subparsers(dest="command")` 创建一个"子命令分发器"，`dest` 指定一个属性（这里是 `command`）来记录用户选了哪个子命令。每个 `sub.add_parser("name")` 返回一个独立的 `ArgumentParser`，你可以像配置主解析器一样给它添加参数。`parse_args` 时，argparse 先识别第一个位置 token 是哪个子命令名，然后把后续参数交给对应子解析器处理。

**典型的子命令分发结构**。实际工程里常把每个子命令的处理逻辑写成函数，按 `command` 路由：

```python
import argparse

def cmd_clone(args):
    print(f"克隆 {args.url}，深度 {args.depth}")

def cmd_commit(args):
    print(f"提交：{args.message}")

parser = argparse.ArgumentParser(prog="mygit")
sub = parser.add_subparsers(dest="command", required=True)

p_clone = sub.add_parser("clone")
p_clone.add_argument("url")
p_clone.add_argument("--depth", type=int, default=1)
p_clone.set_defaults(func=cmd_clone)   # 绑定处理函数

p_commit = sub.add_parser("commit")
p_commit.add_argument("-m", "--message", required=True)
p_commit.set_defaults(func=cmd_commit)

args = parser.parse_args(["clone", "https://x", "--depth", "2"])
args.func(args)   # 直接调对应处理函数
```

```
# 输出：
克隆 https://x，深度 2
```

`set_defaults(func=...)` 把处理函数挂到子命令解析器的默认值上，这样无论用户选了哪个子命令，`args.func` 都是对应的处理函数，调用一句 `args.func(args)` 就完成分发。这是 argparse 社区最经典的子命令写法。

`add_subparsers(required=True)`（Python 3.7+）强制必须选一个子命令，否则报错：

```
$ python mygit.py
usage: mygit [-h] {clone,commit} ...
mygit.py: error: the following arguments are required: command
```

### 2.6 互斥参数：add_mutually_exclusive_group

某些参数在语义上不能同时出现，比如 `--verbose` 和 `--quiet` 只能选一个日志级别。`add_mutually_exclusive_group()` 把它们绑成一个互斥组。

```python
import argparse

parser = argparse.ArgumentParser(prog="logtool")
group = parser.add_mutually_exclusive_group()
group.add_argument("--verbose", action="store_true", help="详细输出")
group.add_argument("--quiet", action="store_true", help="安静输出")

args = parser.parse_args(["--verbose"])
print(args)
```

```
# 输出：
Namespace(verbose=True, quiet=False)
```

```
$ python logtool.py --verbose --quiet
usage: logtool [-h] [--verbose | --quiet]
logtool.py: error: argument --quiet: not allowed with argument --verbose
```

帮助里互斥参数用 `|` 分隔：`[--verbose | --quiet]`，一眼能看出二选一。

`add_mutually_exclusive_group(required=True)` 可以要求组内必须选一个：

```python
group = parser.add_mutually_exclusive_group(required=True)
group.add_argument("--json", action="store_true")
group.add_argument("--yaml", action="store_true")
```

这样用户必须指定 `--json` 或 `--yaml` 之一，不能都不选，也不能都选。

### 2.7 一个完整的文件处理 CLI

把前面讲的单点拼到一个有场景感的工具里。这个 `filetool` 接受一个输入文件、一个输出路径、一个处理模式，支持 verbose/quiet 互斥开关和 dry-run，参数齐全且贴近真实。

```python
import argparse
from pathlib import Path

def process(input_path, output_path, mode, verbose, dry_run):
    """演示用的处理函数：按模式把输入内容写到输出。"""
    text = input_path.read_text(encoding="utf-8")

    if mode == "upper":
        result = text.upper()
    elif mode == "lower":
        result = text.lower()
    elif mode == "reverse":
        result = text[::-1]
    else:
        result = text  # raw

    if verbose:
        print(f"[INFO] 读取 {len(text)} 字符，模式={mode}")
        print(f"[INFO] 将写入 {output_path}")

    if dry_run:
        print("[DRY-RUN] 跳过实际写入")
        return

    output_path.write_text(result, encoding="utf-8")
    if verbose:
        print(f"[INFO] 写入完成，共 {len(result)} 字符")

def build_parser():
    parser = argparse.ArgumentParser(
        prog="filetool",
        description="按指定模式转换文件内容",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("input", type=Path, help="输入文件路径")
    parser.add_argument("-o", "--output", type=Path, default=Path("out.txt"), help="输出文件路径")
    parser.add_argument("-m", "--mode",
                        choices=["upper", "lower", "reverse", "raw"],
                        default="raw",
                        help="处理模式")

    mq = parser.add_mutually_exclusive_group()
    mq.add_argument("-v", "--verbose", action="store_true", help="详细日志")
    mq.add_argument("-q", "--quiet", action="store_true", help="静默模式")

    parser.add_argument("--dry-run", action="store_true", help="只打印不写入")
    return parser

def main():
    parser = build_parser()
    args = parser.parse_args()
    process(args.input, args.output, args.mode, args.verbose or not args.quiet, args.dry_run)

if __name__ == "__main__":
    main()
```

运行示例（准备一个内容为 `Hello` 的 `input.txt`）：

```
$ python filetool.py input.txt -o out.txt -m upper -v
[INFO] 读取 5 字符，模式=upper
[INFO] 将写入 out.txt
[INFO] 写入完成，共 5 字符
```

```
$ cat out.txt
HELLO
```

```
$ python filetool.py input.txt -m reverse
$ cat out.txt
olleH
```

```
$ python filetool.py input.txt -m upper --dry-run -v
[INFO] 读取 5 字符，模式=upper
[INFO] 将写入 out.txt
[DRY-RUN] 跳过实际写入
```

```
$ python filetool.py input.txt -m bad
usage: filetool [-h] [-o OUTPUT] [-m {upper,lower,reverse,raw}] [-v | -q] [--dry-run] input
filetool: error: argument -m/--mode: invalid choice: 'bad' (choose from 'upper', 'lower', 'reverse', 'raw')
```

```
$ python filetool.py input.txt -v -q
usage: filetool [-h] [-o OUTPUT] [-m {upper,lower,reverse,raw}] [-v | -q] [--dry-run] input
filetool.py: error: argument -q/--quiet: not allowed with argument -v/--verbose
```

这个示例里几乎用到了前面所有核心点：位置参数 `input`、`type=Path` 类型转换、`-o/--output` 带默认值、`-m/--mode` 用 `choices` 枚举、`-v/-q` 互斥组、`--dry-run` 开关、`ArgumentDefaultsHelpFormatter` 显示默认值、错误的自动提示。把它读懂，argparse 的日常用法就基本掌握了。

### 2.8 典型 CLI 工具结构

把上面 `filetool` 的结构抽象一下，一个规范的 argparse CLI 工具几乎都长这样：

```python
import argparse
import sys

def build_parser():
    """构造并返回解析器。把声明集中在一处，便于测试与维护。"""
    parser = argparse.ArgumentParser(prog="mytool", description="工具说明")
    # ...各种 add_argument...
    return parser

def run(args):
    """业务逻辑，接收已解析的 Namespace。便于单测时直接构造 Namespace 传入。"""
    # 真正干活
    return 0   # 退出码

def main(argv=None):
    """入口：解析参数并调用 run。argv 默认取 sys.argv[1:]。"""
    parser = build_parser()
    args = parser.parse_args(argv)
    return run(args)

if __name__ == "__main__":
    sys.exit(main())
```

几个关键点：

- `build_parser` 单独成函数，测试时可以构造解析器但不解析，也可以对帮助文本做断言。
- `run(args)` 只接收 `Namespace`，不直接依赖 `sys.argv`，单元测试时可以直接 `run(Namespace(...))` 构造参数跑业务逻辑，完全绕开命令行。
- `main(argv=None)` 默认从 `sys.argv` 读，但允许传入字符串列表，便于在测试或被其他代码调用时控制参数。
- `if __name__ == "__main__":` 里用 `sys.exit(main())`，把 `run` 返回的退出码交给系统；`parse_args` 出错时 argparse 自己会 `sys.exit(2)`，不需要你处理。

这样拆分出来的工具既是一个可执行脚本，也是一个可导入的模块，业务逻辑可测可复用——这是写命令行工具的标准姿势。

## 3. 最佳实践

**帮助文案要写给"不熟悉工具的人"看**。`help` 不是给自己看的备忘录，而是面向第一次用这个工具的用户。与其写 `help="输入文件"`，不如写 `help="要转换的源文件路径，支持相对路径"`。把歧义、默认行为、单位等一次性讲清，能少很多支持成本。配合 `%(default)s`、`%(choices)s` 让文案和实际默认值同步，避免"文档说默认 8000，代码其实改成 9000"这类不一致。

**用 `type=Path` 而不是裸字符串**。涉及文件/目录的参数，坚持用 `type=pathlib.Path`（或在需要严格校验时用自定义函数返回 `Path`）。这样业务代码拿到的就是 `Path` 对象，可以直接 `.read_text()`、`.parent`、`.suffix`，不必到处 `Path(args.input)`。如果文件必须存在，写一个 `existing_file` 校验函数（见 2.2.2），把"存在性检查"也放进解析阶段。

**推荐：解析阶段完成全部校验**。`type`、`choices`、`required`、互斥组这些机制的目的，就是让"参数是否合法"在 `parse_args()` 返回前就判定完。`run(args)` 拿到的是"已校验"的参数，不应该再写 `if args.port < 0: raise ...`。如果需要数值范围校验，写一个自定义 type 函数：

```python
def port_number(value):
    p = int(value)
    if not (0 < p < 65536):
        raise argparse.ArgumentTypeError(f"端口越界: {p}")
    return p

parser.add_argument("--port", type=port_number, default=8000)
```

这样越界端口在解析阶段就被拒掉，错误信息统一走 argparse 的 usage + error 通道。

**保持位置参数不超过 3 个**。位置参数多了用户记不住顺序，帮助里也会挤成一坨。超过 3 个时考虑改用 `--xxx` 可选参数，或者拆成子命令。`cp src dst` 这种语义清晰的双位置参数是合理上限。

**子命令工具的统一分发**。用 `set_defaults(func=handler)` 把每个子命令的处理函数挂上，主流程只写 `args.func(args)`。新增子命令时只在 `build_parser` 里加一个 `add_parser` 并写一个 handler 函数，主入口完全不改动。这种"注册式"结构让工具可扩展性大大提升。

**别用手拼 `sys.argv`**。即便你的工具只有一两个参数，也用 `argparse`。手拼的代价是：没有帮助、没有校验、`--help` 不工作、扩展一个参数要改一堆 `if`。argparse 的样板代码（`ArgumentParser` + 几个 `add_argument`）通常不超过 20 行，远远小于手拼一个像样的解析逻辑。

**测试时用 `parse_args(["--xxx", ...])` 传列表**。不要在测试里去 mock `sys.argv`，直接给 `parse_args` 传一个字符串列表更清晰、更安全，也不会因为 `sys.exit(2)` 影响测试进程。要测试"缺少必填参数会报错"这类场景，用 `pytest.raises(SystemExit)` 捕获退出。

**`allow_abbrev` 慎用**。前缀简写方便但容易引入隐患：今天 `--ver` 匹配 `--verbose`，明天加了一个 `--version`，老用户的 `--ver` 就开始报歧义错误。如果你的工具会长久演进、参数会持续增加，建议一开始就 `allow_abbrev=False`，强制全名。

**互斥组用 `required=True` 要谨慎**。互斥组设必填后，用户必须二选一，不能都不选。这在"必须指定输出格式"场景合理，但在"可选的 verbose/quiet"场景就不对——后者应该让用户什么都不写走默认。想清楚再设。

**长帮助用 epilog + RawDescriptionHelpFormatter**。如果工具有多个使用示例，写在 `epilog` 里并用 `argparse.RawDescriptionHelpFormatter`，可以保留换行，比堆在 `description` 里被压成一行强得多。

```python
parser = argparse.ArgumentParser(
    prog="mytool",
    description="做某件事",
    epilog="""示例：
  mytool a.txt                 # 用默认模式处理
  mytool a.txt -m upper -v     # 大写并显示日志
  mytool clone url --depth 1   # 克隆（子命令）
""",
    formatter_class=argparse.RawDescriptionHelpFormatter,
)
```

**退出码约定**。`0` 表示成功，`2` 是 argparse 在用法错误时自动用的码，业务错误建议用 `1` 或其他自定义非零码。在 `run(args)` 里 `return 0/1`，`main` 里 `sys.exit(main())`，保持这套约定一致。

## 4. 原理

### 4.1 声明式参数规格：内部数据结构

理解 argparse 的原理，先要看清它"声明式"的本质。当你调用 `add_argument(...)` 时，argparse 并不立刻解析任何东西，它只是把这次调用描述的参数规格，组装成一个 `_StoreAction`（或对应 action 类型的）对象，存进解析器内部的几个注册表里。这些注册表大致包括：

- **位置参数列表 `_positionals`**：按声明顺序存位置参数对应的 action。
- **选项字符串映射 `_option_string_actions`**：把每一个 `-x` / `--xxx` 字符串映射到对应 action。一个 action 如果同时声明了短长选项，会有两个键指向它。
- **互斥组、子命令解析器**等元信息也挂在解析器对象上。

每个 action 对象里记录了这个参数的全部"怎么处理"信息：`dest`（结果属性名）、`type`（类型转换）、`default`、`nargs`、`choices`、`required`、`const` 等。换句话说，`add_argument` 阶段是在构造一张"参数规格表"，parse 阶段才知道怎么消费输入。

这套设计的好处是"规格"与"执行"分离：你可以多次 `parse_args`（虽然不常见）、可以把解析器传给别的代码、可以在测试里检视 action 的属性。它和"手写 if-else 链直接处理 `sys.argv`"的根本差别就在这里——手拼是命令式的、解析逻辑与参数认知耦合在一起，argparse 是声明式的、参数规格被显式物化成可检视的数据结构。

#### 4.1.1 参数声明的物化过程

具体一点，当你写：

```python
parser.add_argument("--port", type=int, default=8000, help="监听端口")
```

argparse 大致做这些事：

1. 识别 `--port` 是一个可选选项，推导 `dest="port"`。
2. `action` 不写，默认 `"store"`，于是实例化一个 `_StoreAction`。
3. 把 `type=int`、`default=8000`、`help="监听端口"` 等存进这个 action 的属性。
4. 在 `_option_string_actions` 里登记 `"--port" → 这个action`。
5. 因为没有短选项，只登记一个键。

到这一步，解析器已经"知道"自己有一个叫 `port` 的可选参数，但还没真正读到任何命令行输入。所有 `add_argument` 调用完成后，这张规格表就完整了。

### 4.2 parse_args 的 token 匹配流程

`parse_args()` 拿到 `sys.argv[1:]`（或显式传入的列表）后，开始一趟从左到右的扫描。核心是一个循环，每一步根据当前 token 选择处理策略。

#### 4.2.1 大循环

伪代码（简化版）：

```
 positionals: 一个未填充的位置参数队列
 optionals : 当前识别出可能匹配的候选 action

 while 还有 token:
     token = 取下一个
     if token == "--":           # 显式结束选项，后面全是位置
         后续全部当作位置参数塞进去
         break
     if token 以 "--" 开头:      # 长选项
         用 "=" 分割名/值，或从下一个 token 取值
         在 _option_string_actions 查找 action
         按 action 的 nargs 决定吃几个 token
         转换、校验、存入 namespace
     elif token 以 "-" 开头且长度>1:  # 短选项，可能是多个合并如 -vvv
         逐字符匹配短选项
         store_true/count 类不取值；store 类从剩余 token 或 "=" 取值
     else:                        # 位置参数
         匹配下一个未填充的位置参数 action
         按 nargs 决定吃几个
         转换、校验、存入 namespace

 循环结束后：
 对每个 action，如果用户没提供且有 default，写入 default
 检查所有 required 参数（包括位置参数和 required=True 的可选）
 检查互斥组约束
 返回 namespace
```

关键点是"按 nargs 决定吃几个 token"以及"短选项合并"。

#### 4.2.2 短选项合并

用户写 `-vvv`，argparse 会把它拆成 `v`、`v`、`v` 三个短选项逐个处理。如果 `v` 是 `count` action，就累加 3 次；如果其中某个 `v` 是 `store` 类型，它会"吃掉"剩下的字符 `vv` 当作值——这就是为什么 `-oresult.txt` 也能等价于 `-o result.txt`。理解这一点能解释一些看似奇怪的报错：比如 `-vfoo` 在 `v` 是 `store_true` 时会把 `foo` 当成新短选项解析而报错。

#### 4.2.3 type 与 choices 的转换校验

对每个被识别、需要带值的 action，argparse 调用它声明的 `type` 函数把字符串转成目标类型。如果 `type` 抛 `ValueError` 或 `TypeError`，argparse 捕获后包成 `ArgumentTypeError`，再向用户输出形如 `argument --port: invalid int value: 'abc'` 的错误并退出（退出码 2）。如果 `type` 是自定义函数显式抛 `ArgumentTypeError`，argparse 用你提供的消息。

转换成功后，若声明了 `choices`，argparse 检查转换后的值是否在 `choices` 中，否则报 `invalid choice` 错误。注意这是在类型转换之后做的，所以 `choices=[1, 2, 3]` 配合 `type=int` 是 OK 的——字符串先变成 int 再比较。如果 `type=str`（默认）但 `choices=[1,2,3]`，会出现用户传 `"1"` 但不在 `['1']` 中的坑，写代码时要保持 type 与 choices 元素类型一致。

#### 4.2.4 action 的存储

不同 action 决定了"转换后的值怎么进 namespace"：

- `store`：直接 `setattr(namespace, dest, value)`。
- `store_true`：若选项出现，`setattr(namespace, dest, True)`；不出现时在循环结束后写 `False`（除非显式给了 `default`）。
- `store_false`：对称相反。
- `append`：`getattr` 取出当前列表（没有则初始化为空），`append(value)`，再 `setattr` 回去，所以多次出现会累积。
- `count`：类似 append，不过是 `+1`。
- `store_const`：`setattr(namespace, dest, const)`，不消耗值。

这套机制让"一个参数怎么存"完全由 action 对象自己负责，主循环只负责识别和调度，职责清晰。

#### 4.2.5 缺失与必填检查

主循环走完后，argparse 遍历所有 action：

- 若用户没提供这个参数且有 `default`，写入 default。
- 若是位置参数或 `required=True` 的可选参数且没提供，报 `the following arguments are required: ...` 并退出。
- 若属于某个互斥组，检查组内是否同时出现了多个成员，是则报 `not allowed with argument` 错误。
- 若互斥组设了 `required=True`，检查组内是否一个都没出现。

这些检查都集中在最后，而不是每次循环里即时判断，这解释了为什么有时"`--verbose --quiet`"两个都识别成功后才报互斥错。

#### 4.2.6 错误退出

任何解析错误（未知选项、类型转换失败、choices 不匹配、必填缺失、互斥违反）都会走 `parser.error(msg)`：它把 usage 和错误信息打印到 stderr，然后 `sys.exit(2)`。`2` 是 POSIX 约定的命令行用法错误码。这个统一出口意味着你不需要在业务代码里处理这些错误——它们根本到不了 `run(args)`。

### 4.3 帮助信息的自动生成

`-h/--help` 的内容完全来自你声明时的元数据。argparse 的 `HelpFormatter` 在被调用时遍历解析器内所有 action，按位置参数、可选参数、子命令分组，逐个输出 `dest`、`help`、`metavar`、`choices`、`default` 等。

- `usage:` 行根据所有 action 的必填/可选、nargs 推导出来：必填位置参数直接写名字，可选参数加方括号，互斥组用 `|` 连接，`nargs='*'` 写成 `[name ...]`。
- 参数列表里每个 action 一行，名字列宽度按最长者对齐，`help` 文案在右侧。长 help 会被换行处理。
- `ArgumentDefaultsHelpFormatter` 会在每行 help 末尾追加 `(default: xxx)`，这一步只是格式化时拼字符串，不需要你再写文案。

理解这套生成机制后，你会明白为什么 `help=` 文案写得好、`metavar=` 用得准，帮助质量就自动提升——信息本来就是从这些字段里拼出来的，你写什么它显示什么。

### 4.4 subparsers 的路由机制

`add_subparsers()` 往主解析器里塞了一个特殊的 action（`_SubParsersAction`），它内部维护一个 `name → 子parser` 的映射。主循环扫描时，如果遇到的位置 token 命中某个子命令名，就把"剩余的 token 列表"整体交给对应子解析器的 `parse_args`，再把子解析器返回的 Namespace 与主解析器的 Namespace 合并。

具体过程大致是：

1. 主解析器扫描到位置 token（比如 `clone`）。
2. 在 `_SubParsersAction` 的映射表里查 `clone`，拿到子解析器 `p_clone`。
3. 主解析器把 `dest="command"` 写成 `clone`，再把剩余 token 交给 `p_clone.parse_args`。
4. `p_clone` 自己跑一遍上述 parse 流程，返回的 Namespace 字段被合并进主 Namespace。

这就是为什么子命令的参数和主命令的参数会"和平共处"地出现在同一个 `Namespace` 里——其实是两次解析的合并结果。`set_defaults(func=handler)` 的原理也因此清晰：它在子解析器的 defaults 里挂了 `func`，合并时这个默认值被带上，所以 `args.func` 一直可用。

### 4.5 为什么 argparse 比 sys.argv 手拼强

把两种方式的本质差异梳理一下，能更深刻地理解 argparse 的价值。

#### 4.5.1 声明式 vs 命令式

手拼 `sys.argv` 是命令式的：你在代码里写"如果 `argv[1] == '--input'`，那就把 `argv[2]` 当输入"。每多一个参数，就多一段 if-else，参数之间的顺序、类型、默认值、互斥关系全都散落在流程代码里，没有任何中心化的"参数规格"。

argparse 是声明式的：你把参数规格集中在一处（一组 `add_argument` 调用），规格本身是数据（action 对象）。解析流程由 argparse 统一实现，你的业务代码只消费结果。这意味着：

- 规格与流程解耦。改参数声明不动业务逻辑；改业务逻辑不动参数声明。
- 规格可检视。`parser._actions` 列出所有参数信息，可以做自动化（生成文档、生成配置文件 schema 等）。
- 规格可复用。同一个解析器可以在多处调用 `parse_args`，子解析器也可以被多个主解析器引用。

#### 4.5.2 自带校验与类型转换

手拼时，"端口是整数""模式必须是 json/yaml/csv""--verbose 和 --quiet 不能同时出现"这些校验全要你写。每条校验都是几行 if 加上错误提示与退出，写得稍不规范就让用户看不懂错在哪。argparse 把这些做成内置能力：`type=int` 自动转，`choices=[...]` 自动限，互斥组自动查，错误信息自动按统一格式打印。你只需要声明，不需要实现校验。

更关键的是，这些校验在"进入业务函数之前"就完成。`run(args)` 拿到的一定是合法的、类型正确的参数。手拼往往是"边用边校验"，到代码深处才发现某个参数不合法，错误处理分散且容易漏。

#### 4.5.3 自带帮助生成

手拼要自己写一段"打印用法"的代码，并且要和参数声明的任何改动保持同步——改了参数忘了改帮助是经典 bug。argparse 的帮助完全从声明元数据自动生成，参数增删改后帮助自动更新，`-h` 一定准确。仅这一项就能省下大量维护成本，也让工具对用户更友好。

#### 4.5.4 错误处理与退出码统一

argparse 任何解析错误都走 `parser.error → sys.exit(2)`，退出码符合 POSIX 习惯，用户和脚本可以靠退出码判断是否用法错误。手拼的退出码全靠你自己约定，不同脚本不一致，shell 脚本里 `if mytool ...; then` 的判断就不可靠。

#### 4.5.5 子命令与互斥等高级结构天然支持

用 argparse 写一个 git 风格的多子命令工具，结构清晰、扩展容易（见 2.5）。手拼实现子命令要自己搞"第一个 token 是命令名，分发到不同处理函数"的路由，还要各自处理子命令参数，复杂度随子命令数线性增长且重复严重。互斥组手拼更是要维护"哪些标志不能同时为真"的状态，argparse 一个 `add_mutually_exclusive_group()` 搞定。

综合来说，argparse 把命令行参数解析从"每个人都要重造的轮子"标准化成"一组声明 + 一次调用"，省下的代码量、避免的 bug、提升的用户体验，是任何稍微正式一点的 CLI 工具都不应放弃的。

## 5. 总结

### 5.1 本文内容要点

- **argparse 的定位**：Python 标准库的命令行参数解析模块，声明式三步走——创建解析器、添加参数声明、`parse_args` 解析得到 `Namespace`。
- **ArgumentParser**：解析器容器，`prog`/`description`/`epilog`/`formatter_class` 等主要影响帮助呈现，`add_help` 默认提供 `-h/--help`，`allow_abbrev` 控制前缀简写。
- **add_argument 参数体系**：
  - 位置参数（无 `-` 前缀）按顺序必填；可选参数（`-x`/`--xxx`）显式启用默认非必填。
  - `type` 做类型转换，可传内置函数、`argparse.FileType`、`pathlib.Path`、自定义校验函数。
  - `default` 设默认值，`required` 强制必填，`choices` 枚举限制。
  - `action` 决定保存方式：`store`/`store_true`/`store_false`/`append`/`count`/`store_const`/`version`。
  - `nargs` 控制消耗 token 数：`N`/`?`/`*`/`+`。
  - `dest` 映射属性名，`metavar` 控制帮助占位显示。
- **parse_args 与 Namespace**：默认读 `sys.argv[1:]`，可传列表测试；`Namespace` 用属性或 `vars()` 取值；`parse_known_args` 容忍未知参数。
- **自动帮助**：`-h/--help` 自动生成，内容来自声明元数据，`%(default)s`/`%(choices)s` 可在 help 文案里引用。
- **子命令**：`add_subparsers` + `set_defaults(func=handler)` 实现 git 风格子命令分发。
- **互斥参数**：`add_mutually_exclusive_group` 让 `--verbose`/`--quiet` 这类参数二选一。
- **典型 CLI 结构**：`build_parser` / `run(args)` / `main(argv=None)` 三段式，业务与解析分离、可测可复用。
- **原理**：`add_argument` 把参数物化为 action 对象存入解析器内部注册表；`parse_args` 从左到右扫描 token，识别长短选项与位置参数，按 `type`/`choices`/`action` 转换校验存入 Namespace；缺必填或非法自动走 `parser.error → sys.exit(2)`；帮助从 action 元数据自动拼装；subparsers 通过"命中子命令名后移交剩余 token"实现路由。声明式 + 自带校验 + 自带帮助 + 统一错误退出，使它远胜手拼 `sys.argv`。

### 5.2 读完本文你应能掌握

- 用 `ArgumentParser` + 多个 `add_argument` 搭建一个有完整帮助、类型校验、默认值、枚举限制的命令行工具。
- 区分位置参数与可选参数，根据语义选用；正确使用 `type`、`default`、`required`、`choices`、`action`、`nargs`、`dest`、`metavar`。
- 用 `store_true`/`store_false` 写开关，用 `append`/`count` 处理重复选项，用 `nargs='?'/'*'/'+'` 处理不定数量参数。
- 用 `add_subparsers` + `set_defaults(func=...)` 实现多子命令工具的分发，用 `add_mutually_exclusive_group` 做互斥选项。
- 按 `build_parser / run / main` 三段式组织 CLI 代码，使业务逻辑可被单元测试直接调用。
- 说明 `parse_args` 从 token 扫描到类型转换、校验、缺省填充、必填检查的全流程，以及为何 argparse 比手拼 `sys.argv` 更规范、更可维护。