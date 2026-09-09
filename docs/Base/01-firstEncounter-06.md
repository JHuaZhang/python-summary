---
group:
  title: 【01】初识python
  order: 1
order: 6
title: print输出详解
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 print

`print` 是 Python 最重要的内置函数之一，也是绝大多数人接触 Python 时写下的第一个函数——经典的 `print("Hello, World!")`。它的作用是把对象转换成文本形式并输出到**标准输出流**（默认是控制台终端）。从分类上看，`print` 属于"输出"类工具，与 `input`（输入）相对，是程序与使用者之间最基础的交互通道。

在实际开发中，`print` 的用途远不止"打印一句话"：

- **调试**：在排错时快速查看变量的值与程序执行到哪一步，是 Python 开发者最高频的临时调试手段。
- **结果展示**：把程序计算的最终结果呈现给用户，尤其是脚本类工具、命令行程序。
- **日志辅助**：在没有引入正式日志框架的小脚本里，用 `print` 输出运行信息（生产代码建议用 `logging`）。
- **进度反馈**：长任务执行时打印进度条或百分比，让用户知道程序没卡死。

需要先厘清一个常见误解：`print` **不是**关键字（keyword），而是一个**内置函数**（built-in function）。关键字有 `if`、`for`、`def`、`class` 等，不能被重新赋值；而 `print` 理论上可以被重新绑定到别的名字（虽然强烈不建议这样做）。也正因为它本质是函数调用，使用时**必须加括号**——这是 Python 3 相对 Python 2 一个明显的变化，Python 2 中 `print` 是语句，`print "hello"` 合法；Python 3 中必须写 `print("hello")`。

### 1.2 基本语法与最小用法

`print` 的完整函数签名如下：

```python
print(*objects, sep=' ', end='\n', file=None, flush=False)
```

一个一个看签名里的部分：

- `*objects`：星号表示**可变位置参数**，即你可以传任意多个对象给 `print`，它会依次把它们转为字符串后输出。
- `sep=' '`：多个对象之间的分隔符，默认是一个空格。
- `end='\n'`：所有对象输出完毕后追加的结尾符，默认是换行符。
- `file=None`：输出目标，默认 `None` 表示使用 `sys.stdout`（标准输出）。
- `flush=False`：是否立即刷新输出缓冲，默认 `False`。

最小用法就是只传一个对象：

```python
print("Hello, World!")   # 输出：Hello, World!
```

这一行背后其实发生了：把字符串 `"Hello, World!"` 输出到 `sys.stdout`，没有别的对象所以 `sep` 不起作用，结尾加一个换行。下面看一组基础用法：

```python
# 1. 最简单的用法：输出一个字符串
print("Hello, World!")

# 2. 输出一个数字（int / float 同样可直接传入）
print(42)
print(3.14)

# 3. 输出一个变量
name = "Python"
print(name)

# 4. 多个参数：默认用空格连接
print("姓名:", "张三", "年龄:", 18)

# 5. print 的返回值是 None
result = print("这一行会被打印")
print("上一行 print 的返回值是:", result)
```

运行结果：

```
Hello, World!
42
3.14
Python
姓名: 张三 年龄: 18
这一行会被打印
上一行 print 的返回值是: None
```

这里有几个要点值得强调：

1. `print` 能直接接受 `int`、`float`、`str` 甚至更复杂的对象，因为它内部会对每个对象调用 `str()` 转成字符串。
2. 多个参数之间**默认加空格**，这是 `sep=' '` 的效果——很多人第一次写 `print("姓名:", "张三")` 看到 `姓名: 张三` 中间有个空格时会觉得奇怪，根源就在这里。
3. `print` 的返回值永远是 `None`，它只负责"副作用"（输出），不返回打印的内容。所以 `x = print("hi")` 得到的 `x` 是 `None`，不能用 `print(print(x))` 这种方式去"拼接"输出——内层 `print` 会先打印 `x`，再把 `None` 传给外层 `print` 打印出来。

### 1.3 print 是如何把对象变成文本的

理解 `print` 的输出，需要知道它对每个传入对象调用了 `str()` 进行字符串化。不同类型的对象 `str()` 的行为不同：

- `int`、`float`：转成其数值的十进制文本表示。
- `str`：照原样输出，不加引号。
- `list`、`dict`、`tuple` 等容器：调用其 `__str__`，形如 `[1, 2, 3]`、`{'a': 1}`。
- 自定义类：默认输出形如 `<ClassName object at 0x...>`，除非该类定义了 `__str__` 方法。

```python
class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y

p = Point(3, 4)
print(p)              # 默认：<Point object at 0x...>，地址每次不同
print(str(p))         # 同上
```

这就是为什么直接 `print` 一个自定义对象时往往看不到有用信息——它走的是默认 `__str__`。要让 `print` 输出自定义类的可读形式，需要在该类里实现 `__str__`：

```python
class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y
    def __str__(self):
        return f"Point({self.x}, {self.y})"

p = Point(3, 4)
print(p)              # 现在输出：Point(3, 4)
```

这条线索会在第 4 章「原理」里再次提到——它关系到 `print` 调用链上 `str()` 与 `__str__` 的关系。

---

## 2. 核心内容

本章讲解 `print` 的每个参数、容易混淆的行为，以及配合字符串格式化的实战用法。

### 2.1 多参数与 sep 分隔符

`print` 接受任意多个位置参数，默认用**空格**连接它们。`sep` 就是用来改变这个分隔符的。

**`sep` 的关键点**：

- 默认值是 `' '`（一个空格）。
- `sep` 是字符串，会插在**每两个相邻对象之间**，所以 N 个对象会插入 N−1 个 `sep`。
- `sep` 可以是空字符串 `''`（无分隔直接拼接）、单字符、多字符，甚至包含换行 `\n`、制表符 `\t` 的字符串。
- `sep` 只在"有多个对象"时生效，只传一个对象时 `sep` 无任何作用。

不同 `sep` 带来的行为差异：

| sep 取值 | 多参数输出效果 | 典型场景 |
|----------|----------------|----------|
| `' '`（默认） | 用空格连接 | 调试输出变量值 |
| `''` | 无分隔直接拼接 | 单词/字符串拼接 |
| `'-'` | 用连字符连接 | 日期、版本号 |
| `'\n'` | 每个对象独占一行 | 逐行输出列表元素 |
| `'\t'` | 用制表符分隔 | 简易表格对齐 |
| `' \| '` | 用多字符分隔 | 日志字段拆分 |

下面逐个演示 sep 的不同取值：

```python
# sep 默认是空格：多参数之间用空格连接
print("2026", "07", "06")          # 输出：2026 07 06

# 自定义分隔符：把日期用 - 连接
print("2026", "07", "06", sep="-")  # 输出：2026-07-06

# 用空字符串做分隔符：拼成连续字符串
print("py", "thon", sep="")         # 输出：python

# 用换行做分隔符：每个参数独占一行
print("第一行", "第二行", "第三行", sep="\n")

# 用多字符分隔符：日志字段之间用 " | " 拆分
print("INFO", "auth", "login success", sep=" | ")
```

运行结果：

```
2026 07 06
2026-07-06
python
第一行
第二行
第三行
INFO | auth | login success
```

**为什么需要 sep**：如果不传 `sep`，又想要自定义分隔符，常见的笨办法是手动用 `+` 或 f-string 拼接：

```python
# 笨办法：手动拼接
print("2026-" + "07-" + "06")      # 丑陋，且要自己加分隔符
```

`sep` 让你不用管拼接逻辑，把"对象列表"和"分隔符"分开表达，意图清晰。尤其在对象数量不固定时（比如来自一个列表），`sep` 比手动循环拼接方便得多。

**sep 与 * 解包的黄金组合**：当对象在一个可迭代容器里时，可用 `*` 解包配合 `sep` 一次性输出，这往往比手动 `join` 更省事（见 2.6 节）。

### 2.2 end 结尾符

`end` 控制所有对象输出完毕后**追加的字符**。默认是换行符 `'\n'`，所以每次 `print` 之后光标会移到下一行。

**`end` 的关键点**：

- 默认值 `'\n'`，即"打印完换行"。
- `end` 是在**所有对象和 sep 之后**追加的，且只追加一次。
- 覆盖 `end` 可实现"同行追加输出"或"自定义结尾标记"。
- 把 `end` 设为 `''` 可以让多次 `print` 输出拼在同一行。

不同 `end` 的效果对比：

```python
print("第一行")
print("第二行")
# 两次各占一行，因为 end 默认 \n

print("加载中", end="")
print("...完成")
# 输出：加载中...完成（同行，因为第一次 end 为空）
```

`end` 最经典的实战是**进度条/百分比同行刷新**：用 `\r`（回车，光标回到行首）配合 `end=""`，每次输出覆盖当前行：

```python
import time
for i in range(5):
    print(f"\r进度: {(i+1)*20}%", end="")
    time.sleep(0.2)
print()   # 最后补一个换行，避免后续输出挤进进度行
```

运行时你会看到同一行的百分比从 `20%` 滚到 `100%`，而不是打印 5 行。这里有几个细节值得注意：

1. `\r` 让光标回到行首，`end=""` 保证不换行，于是下一次 `print` 覆盖了上一行内容。
2. 最后那个单独的 `print()` 很关键：它用默认 `end='\n'` 补一个换行，让后续正常输出另起一行，否则进度行会和后面的内容粘在一起。
3. 这种"裸 print 进度条"在重定向到文件时会失效（文件里不会回退覆盖），生产环境进度展示建议用 `tqdm` 等库。

**sep 与 end 的关系（容易混）**：`sep` 管"对象之间"，`end` 管"全部结束后"。一个 4 参数 `print("a","b","c")` 的输出结构是：

```
a<sep>b<sep>c<end>
```

即 `a` 和 `b` 之间、`b` 和 `c` 之间各一个 `sep`（共 2 个），最末尾一个 `end`。理解这个结构，就能预测任意 `sep`/`end` 组合的输出。

### 2.3 file 输出目标

`file` 指定 `print` 把内容写到哪个"文件类对象"。默认 `None`，等价于 `sys.stdout`（标准输出，通常就是终端）。

**`file` 的关键点**：

- 任何实现了 `write(str)` 方法的对象都能作为 `file`，这是 Python 的鸭子类型体现——`print` 不关心你是不是真的文件，只要有 `write` 方法即可。
- `file=sys.stdout`（默认）输出到标准输出；`file=sys.stderr` 输出到标准错误。
- 传一个用 `open()` 打开的文件对象，就能把 `print` 的内容写进文件，省去手动 `f.write(...)` 加换行的繁琐。

**stdout 与 stderr 的区别**：这是 `file` 参数背后最重要的概念。操作系统给每个进程提供三个标准流：

- `stdin`（标准输入，fd=0）：程序读输入的地方。
- `stdout`（标准输出，fd=1）：程序写正常输出的地方。
- `stderr`（标准错误，fd=2）：程序写错误/诊断信息的地方。

`print` 默认写到 `stdout`。把错误信息写到 `stderr` 的好处是：当用户用 `>` 重定向时，正常结果进文件，错误信息仍留在屏幕——两者分流，互不干扰。

```python
# 错误信息走 stderr，便于与正常输出分流
print("这条到 stdout")
print("这条是错误信息", file=sys.stderr)
```

在命令行可以这样验证分流：

```bash
python demo.py > result.txt 2> error.txt
# stdout 内容进 result.txt，stderr 内容进 error.txt
```

**写文件场景**：把日志/结果直接 `print` 到文件：

```python
with open("output_demo.txt", "w", encoding="utf-8") as f:
    print("写入文件的第一行", file=f)
    print("写入文件的第二行", file=f)
```

这里 `print(..., file=f)` 相比 `f.write("写入文件的第一行\n")` 的好处是：`print` 会自动处理换行（通过 `end`）和对象的字符串化，你只管传对象即可。下面演示写文件后读取验证：

```python
import sys

# file 默认是 sys.stdout
print("这条到 stdout")

# 输出到 stderr
print("这条是错误信息", file=sys.stderr)

# 输出到文件对象
with open("output_demo.txt", "w", encoding="utf-8") as f:
    print("写入文件的第一行", file=f)
    print("写入文件的第二行", file=f)
with open("output_demo.txt", encoding="utf-8") as f:
    print("文件内容如下:")
    print(f.read(), end="")
```

运行结果：

```
这条到 stdout
这条是错误信息
文件内容如下:
写入文件的第一行
写入文件的第二行
```

（注意 stderr 那行的显示顺序在不同终端可能略有差异，因为它和 stdout 是两个独立流。）

**与 redirect_stdout 配合**：除了每次显式传 `file`，还可以用 `contextlib.redirect_stdout` 临时把**整个** `sys.stdout` 重定向，这样代码块里所有未指定 `file` 的 `print` 都会写到目标：

```python
from contextlib import redirect_stdout

with open("redirect_demo.txt", "w", encoding="utf-8") as f:
    with redirect_stdout(f):
        print("通过 redirect_stdout 写入")   # 不到控制台，写进 f
        print("这里看不到控制台输出")
print("重定向结束，恢复到控制台输出")          # 出了 with 块，恢复正常
```

`redirect_stdout` 适合"调用了一大堆第三方函数、不想逐个改它们的 print"的场景——整体把输出抽走。但要注意它改的是 `sys.stdout` 这个全局对象，在多线程环境里需谨慎。

### 2.4 flush 缓冲刷新

`flush` 控制 `print` 是否在输出后**立即刷新缓冲区**，默认 `False`。

**`flush` 的关键点**：

- 输出到终端时，`sys.stdout` 通常是**行缓冲**（line-buffered）：每遇到一个 `\n` 就把缓冲区内容刷出去，所以默认情况下终端里 `print` 看起来是"立即出现"的。
- 输出被重定向到文件或管道时，`stdout` 通常是**全缓冲**（block-buffered）：要攒够一大块才刷新。这时 `print` 的内容可能迟迟不落盘。
- `flush=True` 强制立刻刷新，保证内容立即送达目标。

**什么时候需要 `flush=True`**：

1. **进度条/实时刷新**：前文的 `\r` 进度条如果输出被缓冲，可能要等循环结束才一次性刷出来，体验很差。加 `flush=True` 确保每次都立即显示。
2. **长任务中间日志**：脚本跑很久，希望中途的 `print` 立刻写到日志文件，便于实时 `tail -f` 观察，而不是等缓冲区满。
3. **管道/重定向场景**：`python demo.py | grep xxx` 时管道是全缓冲的，不加 flush 可能看不到中间输出。

对比演示：

```python
import time

# 不 flush：重定向到文件时可能攒一批才写
# python demo.py > log.txt  后 tail -f 看不到实时输出
for i in range(3):
    print(f"步骤 {i+1}")
    time.sleep(1)

# 加 flush：每步立即刷出
for i in range(3):
    print(f"步骤 {i+1}", flush=True)
    time.sleep(1)
```

**flush 与 file 的微妙关系**：`flush=True` 本质是调用 `file.flush()`。所以只有当 `file` 对象支持 `flush()` 且确有缓冲时，`flush` 才有意义。对终端输出，行缓冲已经够用，多数场景不需要显式 `flush`；但对文件/管道输出，关键实时信息记得加。

**缓冲小结**：

| 输出目标 | 默认缓冲策略 | 是否需要显式 flush |
|----------|--------------|--------------------|
| 终端（TTY） | 行缓冲 | 一般不需要 |
| 普通文件 | 全缓冲 | 实时要求高时需要 |
| 管道（\|） | 全缓冲 | 需要 |
| stderr | 无缓冲（通常） | 不需要 |

### 2.5 与字符串格式化配合

`print` 本身不负责"美化"内容，真正控制输出文本形态的是**字符串格式化**。`print` 负责把格式化好的字符串送出去。Python 有三种主流格式化方式，下面对比讲解。

#### 2.5.1 f-string（推荐）

f-string 是 Python 3.6+ 引入的格式化方式，语法 `f"..."`，在字符串前加 `f`，花括号 `{}` 内可写变量名或表达式。它是当前最推荐的写法，因为可读性最好、性能也最好。

```python
name = "张三"
age = 28
score = 95.5
print(f"姓名:{name}, 年龄:{age}, 成绩:{score}")
# 输出：姓名:张三, 年龄:28, 成绩:95.5
```

f-string 的花括号内支持**格式说明符**，用冒号 `:` 分隔变量与格式：

- `{score:.2f}`：保留 2 位小数 → `95.50`。
- `{score:>10.2f}`：宽度 10，右对齐，2 位小数。
- `{score:<10.2f}`：左对齐。
- `{score:^10.2f}`：居中。
- `{n:08d}`：整数宽度 8，前补零。

```python
print(f"成绩保留 2 位: {score:.2f}")     # 成绩保留 2 位: 95.50
print(f"[{score:>10.2f}]")              # [     95.50]
print(f"[{score:<10.2f}]")              # [95.50     ]
print(f"[{score:^10.2f}]")              # [  95.50   ]
print(f"三年后年龄: {age + 3}")          # 三年后年龄: 31（可直接写表达式）
```

f-string 的优势：

1. **可读性**：变量直接嵌在文本里，一眼看清楚最终结构，不像 `%` 那样要把占位符和后面的元组对位。
2. **可写表达式**：`{age + 3}`、`{len(name)}` 都行，不必先算好再插值。
3. **性能**：f-string 在编译期解析，运行时比 `%` 和 `.format()` 都快。

#### 2.5.2 str.format()

`str.format()` 是 Python 3 早期引入的方式，用 `{}` 占位，再由 `.format(...)` 填充。在 f-string 出现前是主流，现在新代码建议优先用 f-string，但读老代码、写模板字符串时仍需了解。

```python
print("姓名:{}, 年龄:{}".format(name, age))               # 按位置填
print("姓名:{n}, 年龄:{a}".format(n=name, a=age))          # 按名称填
print("进度: {}/{}".format(3, 5))                          # 进度: 3/5
```

`{}` 内同样支持格式说明符（`{:.2f}` 等），语法与 f-string 一致。`.format()` 相对 f-string 的唯一优势是：**模板字符串可以预先存为变量**，运行时再填充，适合国际化、配置化场景。

```python
template = "用户 {uid} 于 {time} 执行了 {action}"
print(template.format(uid=1024, time="10:00", action="登录"))
```

#### 2.5.3 百分号 % （老式）

`%` 是 Python 最早期的格式化方式，借鉴自 C 语言的 `printf`。语法 `"...%s..." % (值,)`。现在一般不推荐新写，但老代码、某些日志库（如 `logging` 的 `%`-style）里仍常见，需要能读懂。

```python
print("姓名:%s, 年龄:%d, 成绩:%.1f" % (name, age, score))
# 输出：姓名:张三, 年龄:28, 成绩:95.5
```

常用占位符：`%s`（字符串）、`%d`（整数）、`%f`（浮点）、`%x`（十六进制）、`%%`（输出百分号本身）。`%` 的缺点是占位符和参数要严格一一对应，多了少了都会报错，可读性差。

#### 2.5.4 三种方式对比

| 方式 | 示例 | 可读性 | 性能 | 推荐场景 |
|------|------|--------|------|----------|
| f-string | `f"{n}"` | 最好 | 最好 | 新代码首选 |
| `.format()` | `"{}".format(n)` | 较好 | 一般 | 模板需动态填充时 |
| `%` | `"%s" % n` | 差 | 一般 | 读老代码/logging |

#### 2.5.5 逗号拼接 vs 格式化拼接

初学者常这样"拼接"变量与文本：

```python
score = 95.5
print("成绩:", score)        # 输出：成绩: 95.5
```

注意这里 `成绩:` 和 `95.5` 之间有一个**空格**（`sep` 默认值），且 `score` 按默认 `str()` 输出成 `95.5`。如果要求"成绩:95.50"（无空格、2 位小数），逗号写法做不到，必须用格式化：

```python
print(f"成绩: {score:.2f}")  # 输出：成绩: 95.50
```

**结论**：需要精细控制格式（小数位、对齐、补零）时，永远用 f-string 而非逗号拼接；逗号拼接只适合快速调试。

### 2.6 用 * 解包替代手动 join

当要输出的多个对象已经在一个可迭代容器（列表、元组）里时，配合 `sep` 有一个非常优雅的写法：用 `*` 解包。

**`*` 解包的核心用法**：

```python
fruits = ["apple", "banana", "cherry"]
print(*fruits, sep=", ")        # 输出：apple, banana, cherry
```

`print(*fruits, sep=", ")` 等价于 `print("apple", "banana", "cherry", sep=", ")`——星号把列表里的元素逐个"摊开"成位置参数。这与手动用 `str.join` 拼接的效果一样，但有几个关键差异：

**对比 `join`**：

```python
# join 写法
print(", ".join(fruits))        # 输出：apple, banana, cherry
```

`join` 的限制是：**元素必须全部是字符串**。如果列表里有数字，`join` 会报 `TypeError`：

```python
nums = [1, 2, 3, 4]
# ", ".join(nums)  # 报错！join 要求 str
print(", ".join(map(str, nums)))   # 要先 map(str, ...) 转换
```

而 `print(*nums, sep=", ")` 不需要，因为 `print` 内部会自动对每个对象调 `str()`：

```python
print(*nums, sep="-")           # 输出：1-2-3-4
```

**实战场景一：打印 CSV 行**

```python
row = ["1024", "张三", "登录成功", "2026-07-06 10:00:00"]
print(*row, sep=",")
# 输出：1024,张三,登录成功,2026-07-06 10:00:00
```

**实战场景二：表格输出**

```python
headers = ["ID", "姓名", "状态"]
print(*headers, sep="\t")
print("-" * 20)
for r in [["1", "张三", "在线"], ["2", "李四", "离线"]]:
    print(*r, sep="\t")
```

运行结果：

```
ID  姓名  状态
--------------------
1   张三  在线
2   李四  离线
```

**`*` 解包 vs `join` 选取原则**：

- 只是要 `print` 出来 → 用 `*` 解包 + `sep`，省去 `map(str, ...)`。
- 需要得到拼接后的**字符串**（比如还要存变量、写文件、传给别的函数）→ 用 `join`，因为 `print` 不返回拼接结果。

### 2.7 特殊字符与转义

`print` 输出的字符串里常涉及转义字符，了解它们能让 `end`、`sep` 用得更自如。常用转义：

| 转义 | 含义 | 在 print 中的典型用途 |
|------|------|------------------------|
| `\n` | 换行 | 默认 `end`，sep 分行 |
| `\t` | 制表符 | 表格对齐、sep 分列 |
| `\r` | 回车（回行首） | 进度条覆盖同行 |
| `\\` | 反斜杠本身 | 输出路径 |
| `\"` `\'` | 引号 | 字符串内含引号 |
| `\xhh` | 十六进制字符 | 特殊符号 |

```python
print("第一行\n第二行")        # \n 换行
print("列1\t列2\t列3")        # \t 制表对齐
print("路径: C:\\Users\\name") # \\ 输出一个反斜杠
```

当不希望反斜杠被解释为转义时（如正则、Windows 路径），可用**原始字符串** `r"..."`：

```python
print(r"路径: C:\Users\name")  # 原样输出反斜杠，不转义
```

**多行字符串**：用三引号 `"""..."""` 可跨行，`print` 会保留换行：

```python
print("""第一行
第二行
第三行""")
```

### 2.8 print 不能做的事

了解 `print` 的边界，能避免误用：

1. **不能直接输出二进制数据**：`print` 是面向文本的，强行 `print(b'\x00\x01')` 会得到 `b'\x00\x01'` 这样的字面表示，而不是把原始字节写进文件。写二进制要用 `f.write(bytes)` 而非 `print(..., file=f)`。
2. **不返回内容**：`print` 返回 `None`，无法用它"捕获"输出。要捕获输出到字符串，需借助 `io.StringIO` + `redirect_stdout`。
3. **不能控制对齐之外的高级排版**：复杂表格、颜色、分页等，`print` 无能为力，需要 `tabulate`、`rich`、`colorama` 等库。
4. **不适合做生产日志**：`print` 没有时间戳、级别、文件名等结构化字段，生产环境请用 `logging`。

**捕获 print 输出到字符串**（一个常用技巧）：

```python
import io
from contextlib import redirect_stdout

buf = io.StringIO()
with redirect_stdout(buf):
    print("被捕获的内容")
    print("第二行")
captured = buf.getvalue()
print("捕获到:", captured)     # 捕获到: 被捕获的内容\n第二行\n
```

这个技巧在写单元测试、需要断言程序输出内容时非常有用。

### 2.9 不同运行环境下的输出差异

同一段 `print` 代码，在不同环境下表现会有差异，了解这些差异能避免"在我机器上好好的"式困惑。

**终端 vs 重定向 vs IDE**：

- 在真正的终端（TTY）里运行，`stdout` 是行缓冲，`print` 几乎即时出现，`\r` 进度条能正常刷新。
- 用 `>` 重定向到文件，或通过管道 `|` 传给下个命令，`stdout` 变全缓冲，`print` 可能攒一批才落盘，`\r` 进度条在文件里会变成一长串覆盖文本。
- 在某些 IDE（如 PyCharm 的运行窗）里，输出窗口不是真正的 TTY，缓冲行为接近全缓冲，进度条可能不刷新——这时 `flush=True` 尤其重要。

```python
import sys
# 判断当前 stdout 是不是真终端
print("是否 TTY:", sys.stdout.isatty())
```

`sys.stdout.isatty()` 返回 `True` 表示连着终端，`False` 表示被重定向/管道。脚本可据此决定是否启用进度条或 ANSI 颜色，避免在非终端环境输出一堆控制字符。

**编码差异**：`print` 输出中文等非 ASCII 字符时，依赖 `stdout` 的编码。在 Windows 旧版控制台默认 GBK 下，偶尔会遇到 `UnicodeEncodeError`；Python 3.7+ 可用 `PYTHONUTF8=1` 或 `sys.stdout.reconfigure(encoding="utf-8")` 统一为 UTF-8：

```python
import sys
sys.stdout.reconfigure(encoding="utf-8")   # 强制 UTF-8 输出，规避编码报错
print("中文输出安全")
```

**Jupyter / 交互式环境**：在 Jupyter Notebook 里，最后一个表达式的值会自动显示（相当于隐式 `repr`），不必显式 `print`；但中间步骤若想看到，仍需 `print`。例如：

```python
"隐式显示"        # Jupyter 会自动显示这行结果
print("显式输出")  # 显式打印
```

这在普通 `.py` 脚本里不会自动显示，只有 `print` 才有输出——从 Jupyter 拷代码到脚本时要注意补 `print`。

---

## 3. 最佳实践

### 3.1 调试用 print：用完即删，或用 logging

`print` 是最快的临时调试手段，但生产代码里残留 `print("这里执行了")` 会污染输出。建议：

- **临时调试 print 加明显标记**，便于全局搜索清除：`print("DEBUG>>", x)`，调完用编辑器全局搜 `DEBUG>>` 删干净。
- **正式日志用 `logging`**，它有级别（DEBUG/INFO/WARN/ERROR）、时间戳、可配置输出位置，比 `print` 适合维护。

```python
# 不推荐：生产代码里散落调试 print
def process(data):
    print("开始处理")          # 残留调试
    result = transform(data)
    print("result=", result)   # 残留调试
    return result

# 推荐：用 logging
import logging
logging.basicConfig(level=logging.INFO)
def process(data):
    logging.info("开始处理")
    result = transform(data)
    logging.debug("result=%s", result)
    return result
```

### 3.2 错误信息走 stderr

报错、警告类信息应写到 `sys.stderr`，与正常 stdout 输出分流，便于 `> file.txt` 时仍能在屏幕看到错误：

```python
import sys

def load_config(path):
    try:
        with open(path) as f:
            return f.read()
    except FileNotFoundError:
        print(f"配置文件不存在: {path}", file=sys.stderr)
        return None
```

### 3.3 实时输出记得 flush

长任务写日志、进度条、管道场景，关键输出加 `flush=True`，避免被缓冲延迟：

```python
# 推荐：长任务实时刷日志
for i in range(100):
    do_step(i)
    print(f"完成 {i+1}/100", flush=True)
```

### 3.4 拼接优先 f-string，而非 + 或逗号

```python
# 不推荐：用 + 拼接，易出错还低效
print("姓名:" + name + ",年龄:" + str(age))

# 不推荐：逗号拼接无法控制格式且多空格
print("姓名:", name, "年龄:", age)

# 推荐：f-string
print(f"姓名:{name},年龄:{age}")
```

### 3.5 批量元素输出用 * 解包 + sep

```python
# 不推荐：循环逐个 print，每行一个，难控制分隔
for x in items:
    print(x)

# 推荐：一行用 sep 控制
print(*items, sep=", ")
```

### 3.6 不要重定义 print

虽然 `print` 可被重新绑定（它是内置函数名），但千万别在自己的代码里写 `print = my_logger`，这会让后续所有 `print` 行为异常，排查极痛苦。需要定制输出请另起名字。

### 3.7 注意 sep/end 默认值带来的"隐性空格和换行"

很多初学者困惑的输出形态都源于没意识到默认值：

- `print("a:", "b")` 中间的空格来自 `sep=' '`，要消掉用 `sep=""`。
- 两次 `print` 之间换行来自 `end='\n'`，要同行追加用 `end=""`。

牢记"N 个对象插 N−1 个 sep，末尾一个 end"这个结构，即可预测任意输出。

---

## 4. 原理

### 4.1 print 的执行链路（底层支持，简略）

`print` 是内置函数，由 CPython 的 C 代码实现。对使用者而言，它的完整行为可以用一段等价的纯 Python 模型描述：

```python
def my_print(*objects, sep=" ", end="\n", file=None, flush=False):
    import sys
    out = file if file is not None else sys.stdout
    text = sep.join(str(o) for o in objects) + end
    out.write(text)
    if flush:
        out.flush()
```

核心就是 `sep.join(...)` 把每个对象 `str()` 后用 `sep` 拼起、末尾加 `end`，再一次性 `write`。底层 C 实现细节不必深究，记住这个模型即可预测任意参数组合的输出。

### 4.2 str() 与 __str__ 协议的调用链（需手动实现，详述）

`print` 能把任意对象变文本，关键在对每个对象调用了 `str()`。而 `str(obj)` 最终走的是对象的**双下划线协议方法** `__str__` / `__repr__`——这正是开发者需要自己实现、且必须理解其调用顺序才能正确控制输出的地方。

**完整查找链**：当 `print` 调用 `str(obj)` 时，Python 按以下顺序决定输出什么文本：

1. 查找类型上的 `__str__` 方法。若定义了，调用 `obj.__str__()`，返回值即为输出文本。
2. 若类型未定义 `__str__`，回退查找 `__repr__`，用其返回值。
3. 若两者都未定义，使用 `object` 基类的默认实现，输出形如 `<ClassName object at 0x7f...>`（含内存地址，每次运行不同）。

注意第 2 步的回退方向：`str()` 找不到 `__str__` 时会**自动用 `__repr__` 顶上**，但反过来不行——`repr()` 找不到 `__repr__` 时不会用 `__str__`。这就引出一个常见坑：只实现了 `__str__` 而没实现 `__repr__` 的类，在交互式终端、调试器、容器里仍显示难看的默认表示（因为那些场景走的是 `repr`）。

用一个例子完整验证这条链：

```python
class A:
    """两个方法都不实现"""
    pass

class B:
    """只实现 __repr__"""
    def __repr__(self):
        return "B(via repr)"

class C:
    """只实现 __str__"""
    def __str__(self):
        return "C(via str)"

class D:
    """同时实现两者"""
    def __str__(self):
        return "D(via str)"
    def __repr__(self):
        return "D(via repr)"

# print 走 str()：有 __str__ 用 __str__，否则回退 __repr__，否则默认
print(A())    # <A object at 0x...>（两者都无，默认）
print(B())    # B(via repr)（无 __str__，回退 __repr__）
print(C())    # C(via str)（有 __str__）
print(D())    # D(via str)（有 __str__，优先）

# 放进容器：列表/字典对元素用 repr()，不是 str()
print([C(), D()])   # [<C object at 0x...>, D(via repr)]
# 注意 C 在 print 里单独显示 "C(via str)"，但在列表里却显示默认地址——
# 因为容器对元素调用的是 repr()，而 C 没实现 __repr__
```

上面 `print([C(), D()])` 的输出最能说明问题：`C` 单独 `print` 时是可读的 `"C(via str)"`，但放进列表却变成 `<C object at 0x...>`——这正是 `repr` 回退缺失导致的。**结论**：自定义类通常应**同时**实现 `__str__`（给人看的简洁描述）和 `__repr__`（给开发者看的、最好能重建对象的可信表示），否则在容器、调试、日志等 `repr` 场景下会暴露难看的默认值。

**str 与 repr 的分工**：

- `str()` → 调 `__str__`，面向**终端用户**的可读文本，如 `"张三 (28岁)"`。
- `repr()` → 调 `__repr__`，面向**开发者**的明确表示，理想情况下 `eval(repr(obj))` 能重建该对象，如 `"Person(name='张三', age=28)"`。
- `print` 显式走 `str()`；交互式终端直接敲变量名、`%r`/`!r` 格式化、容器内元素展示走 `repr()`。

理解这条调用链后，你就能精准控制对象在各种场景的输出形态，而不是"明明写了 `__str__` 却不生效"地困惑。

### 4.3 缓冲机制（底层支持，简略）

`stdout` 的缓冲策略由底层 C 标准库决定，CPython 启动时按输出目标是否为 TTY 选择策略：终端走行缓冲（遇 `\n` 即刷），文件/管道走全缓冲（攒满一块才刷）。这解释了 2.4 节"重定向到文件时 print 变慢"——缓冲策略变了。`flush=True` 主动调用底层 `fflush` 绕过缓冲立即落盘；`stderr` 通常无缓冲，故错误信息总能即时出现。底层细节无需深究，记住"终端即时、重定向延迟、flush 强刷"即可。

### 4.4 print 是函数带来的灵活性

`print` 是函数而非语句，因此能接受关键字参数 `sep`/`end`/`file`/`flush`、把输出目标 `file` 作为参数动态传入、甚至被赋值或包装（如 `logging` 内部可改写其行为）。这是 Python 3 把 `print` 从语句改为函数的核心收益。

---

## 5. 总结

### 5.1 本文内容回顾

本文系统讲解了 Python 内置函数 `print`，覆盖：

- **概念定位**：`print` 是面向文本输出的内置函数，不是关键字，必须加括号；它通过对每个对象调 `str()` 字符串化后输出到默认的 `sys.stdout`。
- **完整签名**：`print(*objects, sep=' ', end='\n', file=None, flush=False)`，五个参数各司其职。
- **sep**：控制多对象间分隔符，默认空格，支持空串、换行、制表符等，N 个对象插 N−1 个 sep。
- **end**：控制输出结尾符，默认换行，设为空串可同行追加，配合 `\r` 实现进度条。
- **file**：指定输出目标，默认 `sys.stdout`，可传 `sys.stderr` 分流错误、传文件对象写文件、配合 `redirect_stdout` 整体重定向。
- **flush**：强制刷新缓冲，重定向/长任务/管道实时输出时需要。
- **格式化配合**：f-string（推荐）、`.format()`、`%` 三种方式对比，逗号拼接 vs 格式化拼接的差异。
- **`*` 解包 + sep**：优雅替代手动 `join` 批量输出，且能自动处理非字符串元素。
- **转义字符**：`\n`/`\t`/`\r`/`\\` 等在 sep/end 中的应用，原始字符串 `r"..."`。
- **边界**：print 不写二进制、不返回内容、不做高级排版、不当生产日志。
- **最佳实践**：调试 print 用完即删或换 logging、错误走 stderr、实时输出 flush、用 f-string 拼接、批量用 `*` 解包、勿重定义 print、牢记 sep/end 结构。
- **原理**：`sep.join + end` 的一次 write 模型、`str()`/`__str__`/`__repr__` 关系、TTY 决定的缓冲策略、函数化带来的灵活性。

### 5.2 读完本文你应能掌握

- 说出 `print` 全部五个参数的作用与默认值，并解释"N 个对象插 N−1 个 sep、末尾一个 end"的输出结构。
- 根据场景正确选用 `sep`、`end`：日期用 `sep="-"`、逐行输出用 `sep="\n"`、同行追加用 `end=""`、进度条用 `\r`+`end=""`+`flush`。
- 区分 `stdout` 与 `stderr`，会用 `file=sys.stderr`/`file=f`/`redirect_stdout` 控制输出目标。
- 说明何时需要 `flush=True` 及背后缓冲机制（行缓冲 vs 全缓冲，TTY 判定）。
- 在 f-string / `.format()` / `%` 三者间做出合理选择，并用 f-string 格式说明符控制小数位、对齐、补零。
- 用 `print(*iterable, sep=...)` 替代手动 `join` 批量输出，并说明两者差异与各自适用场景。
- 让自定义类通过 `__str__` 控制 `print` 输出形态，区分 `str` 与 `repr`。
- 用 `io.StringIO` + `redirect_stdout` 捕获 `print` 输出到字符串（用于测试）。
- 在工程上正确使用 `print`：调试不留残、错误走 stderr、实时输出 flush、不重定义 print、生产日志用 logging。