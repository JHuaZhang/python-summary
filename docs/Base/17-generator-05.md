---
group:
  title: 【17】生成器与迭代器
  order: 17
order: 5
title: yield from 委托 —— 把生成器的"产出"与"交互"整体转发
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 yield from

在 Python 3.3 引入的 PEP 380 中，`yield from` 是一个专门为"生成器委托"设计的语法。它的字面意思很直白：把当前生成器的产出工作**委托**给另一个可迭代对象（子生成器）。外层生成器遇到 `yield from subgen` 时，不再亲自一个个 yield，而是让 `subgen` 全盘接管产出，自己只充当一个"转发层"。

最直观的对照是这样：很多生成器内部会出现"遍历另一个可迭代对象、逐个 yield"的写法，也就是经典的 `for x in iterable: yield x` 模式。`yield from iterable` 在产出值这件事上与之等价，但它做的远不止于此——它还会**双向转发 `send` / `throw` / `close`**，并把子生成器的 `return` 返回值回传给外层。这使得 `yield from` 不仅仅是一个"语法糖"，而是建立了一条外层生成器与子生成器之间的**透明通道**。

理解 `yield from` 的关键在于"委托"二字：外层生成器把自己对协议方法的调用权（`next`、`send`、`throw`、`close`）临时移交给了子生成器，直到子生成器耗尽（抛 `StopIteration`）后才收回控制权。在委托期间，外层生成器对调用方而言几乎是"隐身"的——调用方 `next()` 外层生成器，实际拿到的是子生成器 yield 出来的值；调用方 `send()` 给外层生成器，实际传入的是子生成器在 yield 处挂起的表达式结果。这种"透明转发"正是 `yield from` 区别于手写 `for-yield` 循环的根本所在。

在协程演进史上，`yield from` 也扮演过重要角色。在 `async` / `await` 关键字出现之前（Python 3.5 之前），`yield from` 曾被用作基于生成器的协程之间委托调用的标准手段：一个协程用 `yield from` 把控制权交给另一个协程，形成一条调用链。`await` 的语义在很大程度上就是 `yield from` 的协程化版本。本篇会在最后一章简要提及这段历史关联，协程的完整讨论放在第 08 篇。

### 1.2 基本语法与最小示例

**语法形式**

```python
yield from <可迭代对象>
```

`<可迭代对象>` 可以是任何可迭代的对象：列表、字符串、range、生成器、生成器表达式、自定义可迭代对象等。当它是一个生成器（即具有 `send` / `throw` / `close` 协议方法）时，`yield from` 还会额外转发这些交互操作；当它只是一个普通可迭代对象（如列表）时，`yield from` 退化为纯粹的"逐个产出"。

`yield from` 是一个**表达式**，它的值是子生成器结束时（通过 `return` 返回）的值。如果子可迭代对象没有 `return` 值（普通可迭代对象），则表达式结果为 `None`。因此可以写成 `result = yield from subgen()` 来接收子生成器的返回值。

**最小示例：与 for-yield 等价的产出行为**

```python
# 两种写法在"产出值"这件事上完全等价
def for_yield_gen():
    for x in [1, 2, 3]:
        yield x

def yield_from_gen():
    yield from [1, 2, 3]

print(list(for_yield_gen()))    # 输出：[1, 2, 3]
print(list(yield_from_gen()))   # 输出：[1, 2, 3]
```

两个生成器对外暴露的产出序列一模一样。从这个角度看，`yield from` 像是 `for-yield` 的简写。但接下来的章节会展示，一旦涉及 `send`、`throw`、`close` 或子生成器的 `return` 值，两者就会出现本质差异。

**最小示例：委托给另一个生成器**

```python
# 子生成器：产出一组数据
def sub_numbers():
    yield 10
    yield 20
    yield 30
    return "子生成器结束"  # return 值会回传给 yield from 表达式

# 外层生成器：把产出委托给子生成器
def outer():
    result = yield from sub_numbers()
    print(f"收到子生成器返回值: {result}")
    yield "外层自己的收尾值"

gen = outer()
print(next(gen))  # 输出：10  （实际来自子生成器）
print(next(gen))  # 输出：20
print(next(gen))  # 输出：30
print(next(gen))  # 触发子生成器 return，打印：收到子生成器返回值: 子生成器结束
                  # 然后外层 yield "外层自己的收尾值"
                  # 输出：外层自己的收尾值
```

注意上例中 `next(gen)` 第三次返回 `30` 后，第四次调用 `next` 时子生成器执行到 `return`，`yield from` 表达式拿到返回值 `"子生成器结束"`，外层生成器继续执行到 `yield "外层自己的收尾值"`。整个过程里，调用方完全感知不到"中间还隔着一层子生成器"——这正是委托的威力。

## 2. 核心内容

### 2.1 yield from 的产出转发：把子可迭代对象的值逐个送出

`yield from` 最基础的功能是产出转发。当外层生成器执行到 `yield from iterable` 时，它会进入一个"委托循环"：不断对 `iterable` 调用 `next()`，把每次得到的值 yield 给外层调用方，直到 `iterable` 耗尽抛出 `StopIteration` 为止。

**委托给列表等普通可迭代对象**

```python
# 把多个数据源"拼接"成一个生成器，每个源用 yield from 委托进来
def chained_data():
    yield from [1, 2, 3]          # 委托列表
    yield from range(4, 7)        # 委托 range
    yield from "ab"               # 委托字符串
    yield from (x * x for x in [4, 5])  # 委托生成器表达式

print(list(chained_data()))
# 输出：[1, 2, 3, 4, 5, 6, 'a', 'b', 16, 25]
```

这里 `yield from` 起到了"扁平化拼接"的作用：四个互不相关的可迭代对象被串成了一条单一的产出流。如果用 `for-yield` 写成等价代码，每个 `yield from` 都要展开成一个循环，可读性会明显下降。

**用 yield from 重构嵌套 yield 循环**

```python
# 重构前：手写 for-yield，三层循环堆叠，意图被循环结构淹没
def flat_before(nested):
    for row in nested:
        for item in row:
            yield item

# 重构后：用 yield from 表达"把这一层委托出去"的意图
def flat_after(nested):
    for row in nested:
        yield from row  # "这一行整体委托出去"，语义更清晰

data = [[1, 2], [3, 4], [5, 6]]
print(list(flat_before(data)))  # 输出：[1, 2, 3, 4, 5, 6]
print(list(flat_after(data)))   # 输出：[1, 2, 3, 4, 5, 6]
```

当嵌套层数增加时，`yield from` 的优势会更突出——它能把"遍历并产出"这个重复模式压缩成一行，让生成器的主干逻辑浮出来。

**与 itertools.chain 的对比**

`itertools.chain` 也能把多个可迭代对象拼接成一个迭代器，功能上与连续的 `yield from` 类似：

```python
import itertools

def with_chain():
    return itertools.chain([1, 2], range(3, 5), "ab")

def with_yield_from():
    yield from [1, 2]
    yield from range(3, 5)
    yield from "ab"

print(list(with_chain()))        # 输出：[1, 2, 3, 4, 'a', 'b']
print(list(with_yield_from()))   # 输出：[1, 2, 3, 4, 'a', 'b']
```

两者的产出结果一致。区别在于：`itertools.chain` 返回的是一个独立的迭代器对象，而 `yield from` 是在一个生成器内部进行委托，外层生成器可以在多个 `yield from` 之间穿插自己的逻辑（比如打印日志、加工数据、条件分支）。换言之，`yield from` 适合"由生成器主导、需要中间穿插加工"的场景，`itertools.chain` 适合"纯拼接、无中间逻辑"的场景。

### 2.2 yield from 的返回值：接收子生成器的 return

Python 的生成器支持 `return` 语句，`return` 的值会被装进 `StopIteration` 异常的 `value` 属性中（`StopIteration.value`）。`yield from` 会捕获这个异常，把 `value` 取出来作为 `yield from` 表达式的求值结果。这是 `for-yield` 循环无法做到的：手写 `for x in subgen: yield x` 会在循环结束时让 `StopIteration` 静默消失，`return` 值根本拿不到。

**接收子生成器的 return 值**

```python
# 子生成器：累加一段数据，并通过 return 把汇总值带回
def accumulate_and_return(data):
    total = 0
    for x in data:
        total += x
        yield x          # 逐个产出原始数据
    return total         # 汇总值通过 return 回传

def consumer(data):
    print("开始消费数据...")
    # yield from 一边把子生成器产出的值转发出去，
    # 一边在子生成器结束时把它的 return 值赋给 summary
    summary = yield from accumulate_and_return(data)
    print(f"汇总值（来自子生成器 return）: {summary}")

gen = consumer([10, 20, 30])
print(next(gen))  # 输出：10
                  # （同时打印：开始消费数据...）
print(next(gen))  # 输出：20
print(next(gen))  # 输出：30
print(next(gen))  # 子生成器 return，外层拿到 summary
                  # 打印：汇总值（来自子生成器 return）: 60
                  # 然后外层生成器自己也耗尽，抛 StopIteration
```

这个模式非常实用：子生成器负责"流式产出"原始数据，并通过 `return` 返回一个汇总结果；外层生成器既把数据流转发给调用方，又能在委托结束后拿到汇总结果继续处理。一条 `yield from` 同时承担了"转发流"和"接收结果"两件事。

**返回值为 None 的情况**

```python
# 普通可迭代对象（列表）没有 return 值，yield from 表达式结果为 None
def delegate_list():
    result = yield from [1, 2, 3]
    print(f"result is: {result!r}")  # result is: None

gen = delegate_list()
print(next(gen))  # 输出：1
print(next(gen))  # 输出：2
print(next(gen))  # 输出：3
try:
    next(gen)
except StopIteration:
    pass
# 上面第三次 next 之后，列表耗尽，打印：result is: None
```

当委托对象是列表、range、字符串等"非生成器"的可迭代对象时，它们没有 `return` 机制，`yield from` 表达式的值就是 `None`。只有当委托对象本身是生成器（或协程）且显式 `return` 了某个值时，`yield from` 才能拿到非 `None` 的结果。

### 2.3 yield from 的双向转发：send / throw / close

这是 `yield from` 真正区别于 `for-yield` 的地方。当委托对象是一个生成器时，`yield from` 会在外层生成器与子生成器之间建立一条**双向通道**：

- **`next` / `send` 的转发**：调用方对 外层生成器 调用 `next()` 或 `send(value)`，这个调用会被直接转发给子生成器当前挂起的 yield 表达式。子生成器 yield 出来的值会经外层生成器原样送回给调用方。
- **`throw` 的转发**：调用方对外层生成器调用 `throw(exc)`，异常会被注入到子生成器当前挂起的 yield 处，由子生成器决定如何处理。
- **`close` 的转发**：调用方对外层生成器调用 `close()`，会触发子生成器的 `close()`，进而执行子生成器中的 `finally` 块。

在委托期间，外层生成器对调用方而言是"透明"的：调用方感觉自己像在直接操作子生成器。

**send 的双向转发演示**

```python
# 子生成器：一个简化版的"累加器协程"，每次接收一个增量并 yield 当前累计值
def accumulator(start=0):
    total = start
    while True:
        # yield 把 total 送出，同时挂起等待 send 传入增量
        increment = yield total
        if increment is None:
            break
        total += increment
    return total  # 最终累计值通过 return 回传

# 外层生成器：用 yield from 委托给 accumulator
def delegated_accumulator():
    print("外层：即将委托")
    final = yield from accumulator(100)   # 委托开始
    print(f"外层：子生成器返回了 {final}")
    yield "外层收尾"

gen = delegated_accumulator()
# 第一次 next 启动外层，进而启动子生成器，子生成器 yield 出初始 total
print(next(gen))      # 输出：100
                      # （先打印：外层：即将委托）

# 现在 send 的值会穿透外层，直接送进子生成器的 yield 表达式
print(gen.send(10))   # 输出：110  （子生成器 total=100+10）
print(gen.send(25))   # 输出：135  （子生成器 total=110+25）
print(gen.send(-5))   # 输出：130  （子生成器 total=135-5）

# send(None) 等价于 next，让子生成器收到 None 增量而 break
gen.send(None)
# 子生成器执行 return total（130），yield from 拿到 130
# 打印：外层：子生成器返回了 130
# 然后外层 yield "外层收尾"，外层挂起
```

重点在于 `gen.send(10)` 这一行：调用方是对**外层生成器** `gen` 调用的 `send`，但接收这个 `10` 的是**子生成器** `accumulator` 中挂起的 `yield total` 表达式。外层生成器全程没有写任何处理 `send` 的代码，但 `send` 的值却精准地穿过去了——这就是 `yield from` 双向转发的效果。如果换成 `for x in subgen: yield x`，`send` 的值只会进入外层生成器挂起处的 yield，根本到不了子生成器。

**throw 的转发演示**

```python
# 子生成器：在 yield 处可能被注入异常，用 try/except 捕获
def resilient_sub():
    while True:
        try:
            value = yield
        except ValueError as e:
            print(f"  子生成器捕获到 ValueError: {e}")
            continue       # 捕获后继续循环，不结束
        except RuntimeError:
            print("  子生成器遇到 RuntimeError，准备退出")
            break
        print(f"  子生成器收到值: {value}")
    return "子生成器正常退出"

def outer_delegate():
    result = yield from resilient_sub()
    print(f"外层拿到返回值: {result}")

gen = outer_delegate()
next(gen)                # 启动
gen.send("hello")        # 输出：  子生成器收到值: hello
gen.throw(ValueError, "故意抛一个 ValueError")
# 输出：  子生成器捕获到 ValueError: 故意抛一个 ValueError
# 子生成器 continue，继续等待
gen.send("world")        # 输出：  子生成器收到值: world
gen.throw(RuntimeError, "要求退出")
# 输出：  子生成器遇到 RuntimeError，准备退出
# 子生成器 break -> return，yield from 拿到返回值
# 输出：外层拿到返回值: 子生成器正常退出
```

调用方对外层生成器调用 `throw`，异常被精确地注入到子生成器当前的 yield 处。子生成器用 `try/except` 接住了 `ValueError` 并继续运行，对外层而言完全透明。这种"异常穿透委托层"的行为是手写 `for-yield` 无法提供的——手写循环中，`throw` 注入的是外层生成器的 yield，子生成器根本感知不到。

**close 的转发演示**

```python
# 子生成器：带有 finally 块，用于演示 close 的清理效果
def sub_with_cleanup():
    try:
        yield "first"
        yield "second"
    finally:
        print("  子生成器的 finally 块执行了（清理资源）")

def outer_with_delegate():
    yield from sub_with_cleanup()

gen = outer_with_delegate()
print(next(gen))   # 输出：first
gen.close()
# 外层 close 被转发给子生成器，触发子生成器的 GeneratorExit -> finally
# 输出：  子生成器的 finally 块执行了（清理资源）
```

调用 `gen.close()` 时，子生成器收到 `GeneratorExit` 异常，其 `finally` 块被执行。外层生成器没有写任何清理代码，但清理仍然发生了——因为 `yield from` 把 `close` 转发下去了。

### 2.4 典型用途一：扁平化嵌套结构

`yield from` 最直观的用途是扁平化嵌套的可迭代结构。只要每一层都把下一层"委托出去"，就能把任意深度的嵌套压平成一条线性产出流。

**递归展平嵌套列表**

```python
def flatten(nested):
    """递归地把任意深度的嵌套列表展平成一条流。"""
    for item in nested:
        if isinstance(item, list):
            # item 还是列表 -> 递归委托给 flatten(item)
            # 子生成器产出的每个值都会经 yield from 透传到外层
            yield from flatten(item)
        else:
            # item 是叶子 -> 直接产出
            yield item

data = [1, [2, [3, 4], 5], [6, [7, [8, 9]]], 10]
print(list(flatten(data)))
# 输出：[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
```

这里 `yield from flatten(item)` 做了两件事：一是递归调用 `flatten` 得到一个子生成器；二是把这个子生成器的产出原样转发给当前层的生成器。因为每一层都用了 `yield from`，所以无论嵌套多深，最内层的叶子值都能毫无损耗地到达最外层调用方——中间层全部"隐身"。

如果不用 `yield from`，等价的递归写法会复杂得多：

```python
def flatten_no_yf(nested):
    for item in nested:
        if isinstance(item, list):
            # 没有 yield from，只能手动遍历子生成器逐个 yield
            for sub_item in flatten_no_yf(item):
                yield sub_item
        else:
            yield item

print(list(flatten_no_yf(data)))
# 输出：[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
```

两种写法在纯产出上等价，但 `flatten_no_yf` 多了一层显式的 `for sub_item in ...: yield sub_item` 噪音。当递归逻辑本身已经有分支判断时，这种噪音会进一步拉低可读性。

**处理混合类型与自定义可迭代对象**

```python
def deep_flatten(items):
    """支持列表、元组、集合、生成器等多种可迭代容器。"""
    for item in items:
        # 字符串虽然是可迭代的，但我们不想把它拆成字符
        if isinstance(item, (list, tuple, set, frozenset)):
            yield from deep_flatten(item)
        elif hasattr(item, "__iter__") and not isinstance(item, (str, bytes)):
            # 其他可迭代对象（如生成器、自定义可迭代类）也递归展平
            yield from deep_flatten(item)
        else:
            yield item

mixed = [1, ("a", "b"), {2, 3}, [4, [5, 6]], "str保持完整"]
print(list(deep_flatten(mixed)))
# 输出（集合无序，2/3 顺序可能不同）：[1, 'a', 'b', 2, 3, 4, 5, 6, 'str保持完整']
```

注意对字符串的特殊处理：字符串虽然可迭代，但通常希望它作为一个整体被产出而不是被拆成字符。这种"分支判断 + yield from 递归"的写法是处理异构嵌套结构的常见模式。

### 2.5 典型用途二：树结构的深度优先遍历

`yield from` 配合递归非常适合树形结构的深度优先遍历。每个节点把自己的子节点递归委托出去，就能得到一条按深度优先顺序排列的节点流。

**二叉树的前序遍历**

```python
class TreeNode:
    def __init__(self, value, left=None, right=None):
        self.value = value
        self.left = left
        self.right = right

def preorder(node):
    """前序遍历：根 -> 左 -> 右，用 yield from 递归委托子树。"""
    if node is None:
        return
    yield node.value            # 先产出根节点
    if node.left:
        yield from preorder(node.left)   # 把整个左子树委托出去
    if node.right:
        yield from preorder(node.right)  # 把整个右子树委托出去

# 构造一棵二叉树
#         1
#        / \
#       2   3
#      / \   \
#     4   5   6
#        /
#       7
tree = TreeNode(1,
        TreeNode(2,
            TreeNode(4),
            TreeNode(5, TreeNode(7))),
        TreeNode(3, None, TreeNode(6)))

print(list(preorder(tree)))
# 输出：[1, 2, 4, 5, 7, 3, 6]
```

`yield from preorder(node.left)` 的含义是"把左子树的全部前序遍历结果委托给当前生成器转发"。因为前序遍历本身是递归定义的，`yield from` 让代码与递归定义几乎一一对应，极其自然。

**后序与中序遍历**

```python
def inorder(node):
    """中序：左 -> 根 -> 右"""
    if node is None:
        return
    if node.left:
        yield from inorder(node.left)
    yield node.value
    if node.right:
        yield from inorder(node.right)

def postorder(node):
    """后序：左 -> 右 -> 根"""
    if node is None:
        return
    if node.left:
        yield from postorder(node.left)
    if node.right:
        yield from postorder(node.right)
    yield node.value

print("中序:", list(inorder(tree)))    # 输出：中序: [4, 2, 7, 5, 1, 3, 6]
print("后序:", list(postorder(tree)))  # 输出：后序: [4, 7, 5, 2, 6, 3, 1]
```

三种遍历只是 yield 根节点和 yield from 子树的**顺序**不同，结构完全一致。`yield from` 让递归遍历的代码避免了"手动遍历子生成器再逐个 yield"的冗余，三种遍历的差异点一目了然。

**文件系统目录树的深度遍历**

```python
import os

def walk_files(root):
    """深度优先遍历目录，yield 所有文件的完整路径。"""
    for entry in sorted(os.listdir(root)):
        full = os.path.join(root, entry)
        if os.path.isdir(full):
            # 子目录 -> 递归委托，把子目录里的文件流接进来
            yield from walk_files(full)
        else:
            yield full

# 用法（示例路径，实际运行需真实目录）
# for path in walk_files("/some/project"):
#     print(path)
```

这与 `os.walk` 的广度优先遍历不同，是严格的深度优先：进入一个目录后先一路深入到最底层文件，再回溯。`yield from walk_files(full)` 把子目录的文件流无缝拼接到当前目录的产出中。这种写法比传统的 `os.walk` + 列表拼接更节省内存——它不会一次性把所有路径收集到内存，而是按需 yield。

### 2.6 典型用途三：把子生成器委托给外层生成器

当生成器逻辑变得复杂时，把不同阶段拆成多个子生成器、再用 `yield from` 串联，是保持代码清晰的有效手法。每个子生成器只负责一个阶段，外层生成器负责编排（orchestration）。

**多阶段数据流水线**

```python
# 阶段一：读取并产出原始行
def read_lines(lines):
    for line in lines:
        yield line.strip()
    return len(lines)  # 返回总行数

# 阶段二：过滤掉空行和注释
def filter_lines(line_gen):
    count = 0
    for line in line_gen:
        if not line or line.startswith("#"):
            continue
        count += 1
        yield line
    return count  # 返回有效行数

# 阶段三：把每行解析成键值对
def parse_lines(line_gen):
    for line in line_gen:
        if "=" in line:
            key, _, value = line.partition("=")
            yield (key.strip(), value.strip())

# 外层编排生成器：用 yield from 串联三个阶段
def pipeline(raw_lines):
    total = yield from read_lines(raw_lines)      # 委托阶段一
    valid = yield from filter_lines(???           # 这里需要衔接…
    # 由于阶段间有数据依赖，需要用变量传递子生成器
    # 见下方修正写法
    pass
```

上面的草稿暴露了一个问题：`filter_lines` 需要接收上一阶段的生成器作为输入，而 `yield from` 委托的是一个"已经在产出"的子生成器。正确的多阶段衔接应该这样写：

```python
def pipeline(raw_lines):
    # 阶段一：读原始行，同时拿到总行数
    stage1 = read_lines(raw_lines)
    total = yield from stage1

    # 阶段二：以阶段一的产出为输入做过滤
    # 注意：阶段一已经耗尽，需要重新构造一个并复用原始数据
    stage1_again = read_lines(raw_lines)
    stage2 = filter_lines(stage1_again)
    valid = yield from stage2

    # 阶段三：解析
    stage1_once_more = read_lines(raw_lines)
    stage2_once_more = filter_lines(stage1_once_more)
    stage3 = parse_lines(stage2_once_more)
    yield from stage3

    print(f"总行数={total}, 有效行数={valid}")

raw = [
    "host = 127.0.0.1\n",
    "# 这是注释\n",
    "\n",
    "port = 8080\n",
    "debug = true\n",
]
for kv in pipeline(raw):
    print(kv)
# 输出：
# ('host', '127.0.0.1')
# ('port', '8080')
# ('debug', 'true')
# 总行数=5, 有效行数=3
```

这个例子说明 `yield from` 委托的是"一个具体的子生成器实例"，阶段之间的数据流需要开发者显式用变量衔接。更优雅的做法是让每个子生成器之间形成"生产者—消费者"链条，用 `yield from` 把消费端的产出委托出去：

```python
def pipeline_clean(raw_lines):
    # 构造一条流水线：read -> filter -> parse
    # 每一层都是生成器，前一层作为后一层的输入
    reader = read_lines(raw_lines)
    filtered = filter_lines(reader)       # filter 消费 reader 的产出
    parsed = parse_lines(filtered)        # parse 消费 filtered 的产出

    # 外层只需委托最末端（parse），中间层的 yield 会被 yield from
    # 逐层透传上来——因为 filtered 内部是 `for line in reader: yield`，
    # 它的 yield 会把 reader 的值也带出来
    yield from parsed
```

注意这里有一个细节：`filter_lines` 内部写的是 `for line in line_gen: ... yield line`，它 yield 的值既来自 `line_gen`（即 `reader`），所以 `parse_lines` 看到的是过滤后的值，而最终外层 `yield from parsed` 转发的是解析后的键值对。整条链路中只有最末端的产出被外层转发，中间层不直接对外。这种"链式生成器 + 末端 yield from"的模式在数据处理中非常常见。

**把功能子生成器嵌入主生成器**

```python
# 子生成器：专门负责产出分页数据
def fetch_page(api, page):
    data = api(page)
    yield from data["items"]
    return data["has_next"]

# 主生成器：协调多个分页源
def merge_pages(api_a, api_b, max_pages):
    for page in range(1, max_pages + 1):
        # 委托 fetch_page，把它的 items 透明转发，同时接收是否还有下一页
        has_next_a = yield from fetch_page(api_a, page)
        has_next_b = yield from fetch_page(api_b, page)
        if not (has_next_a or has_next_b):
            break

# 模拟 API（演示用）
def mock_api(tag):
    def _call(page):
        return {
            "items": [f"{tag}-p{page}-1", f"{tag}-p{page}-2"],
            "has_next": page < 3,
        }
    return _call

def merged_items():
    yield from merge_pages(mock_api("A"), mock_api("B"), 5)

print(list(merged_items()))
# 输出：
# ['A-p1-1', 'A-p1-2', 'B-p1-1', 'B-p1-2',
#  'A-p2-1', 'A-p2-2', 'B-p2-1', 'B-p2-2',
#  'A-p3-1', 'A-p3-2', 'B-p3-1', 'B-p3-2']
# （第 3 页后 has_next 为 False，break）
```

`fetch_page` 既产出数据又返回分页状态，`merge_pages` 用 `result = yield from ...` 同时拿到数据流和返回值，把"分页拉取 + 数据合并 + 终止判断"三件事融合在委托调用里。这种写法让主生成器只关心编排策略，细节交给子生成器。

### 2.7 yield from vs 手写 for-yield：关键差异对照

这是理解 `yield from` 价值的核心一节。下表系统对比两者的差异。

| 维度 | `for x in sub: yield x` | `yield from sub` |
|------|------------------------|------------------|
| 产出值 | 逐个 yield，等价 | 逐个转发，等价 |
| `send(value)` 转发 | 不转发：value 进入外层 yield 处，子生成器感知不到 | 转发：value 直接进入子生成器当前挂起的 yield 表达式 |
| `throw(exc)` 转发 | 不转发：异常注入外层 yield，子生成器无感 | 转发：异常注入子生成器当前 yield 处 |
| `close()` 转发 | 不转发：子生成器不会被 close | 转发：子生成器收到 GeneratorExit，finally 执行 |
| 子生成器 `return` 值 | 无法获取，StopIteration 被循环吞掉 | 可通过 `result = yield from sub` 接收 |
| 异常透传 | 子生成器未捕获的异常会冒泡到外层 | 子生成器未捕获的异常同样冒泡，但 StopIteration 被处理 |
| 语义表达 | "我手动遍历并逐个产出" | "我把产出与交互整体委托出去" |

**send 差异的可观测演示**

```python
# 子生成器：依赖 send 传值
def echo_coroutine():
    received = yield "准备就绪"
    yield f"我收到了: {received}"

# 写法 A：手写 for-yield（不转发 send）
def manual_wrap(sub):
    for x in sub:
        yield x

# 写法 B：yield from（转发 send）
def delegate_wrap(sub):
    yield from sub

sub_a = echo_coroutine()
gen_a = manual_wrap(sub_a)
print(next(gen_a))      # 输出：准备就绪
# 尝试 send 一个值
try:
    print(gen_a.send("hello-A"))
except AttributeError as e:
    print(f"manual_wrap 报错: {e}")
# 因为 manual_wrap 的 yield 不接收 send 的值，
# "hello-A" 被丢进外层的 yield（没有变量接），子生成器收不到
# 实际行为：外层 yield x 不接收 send，send 退化类似 next
# 具体：send 的值赋给 manual_wrap 内部 for 循环的 yield 表达式，
# 但该 yield 没有 lvalue，值被丢弃，下一轮 next 从子生成器取下一个值

sub_b = echo_coroutine()
gen_b = delegate_wrap(sub_b)
print(next(gen_b))              # 输出：准备就绪
print(gen_b.send("hello-B"))    # 输出：我收到了: hello-B
# send 的值穿透 yield from，进入子生成器的 yield "准备就绪" 表达式，
# 被赋给 received，子生成器继续 yield 出 "我收到了: hello-B"
```

这段对比直接揭示了差异：`delegate_wrap` 中 `send("hello-B")` 的值正确到达了子生成器；`manual_wrap` 中 `send` 的值被外层 yield 吞掉了，子生成器完全收不到。

**return 值差异的可观测演示**

```python
def subgen_with_return():
    yield 1
    yield 2
    return "SECRET_RETURN_VALUE"

def manual_consumer():
    for x in subgen_with_return():
        yield x
    # 这里拿不到 "SECRET_RETURN_VALUE"，
    # 因为 for 循环把 StopIteration 吞掉了

def yield_from_consumer():
    result = yield from subgen_with_return()
    yield f"捕获到返回值: {result}"

print(list(manual_consumer()))
# 输出：[1, 2]  （返回值丢失）

print(list(yield_from_consumer()))
# 输出：[1, 2, '捕获到返回值: SECRET_RETURN_VALUE']
```

`yield from_consumer` 多产出了一个元素，正是因为它接住了子生成器的 `return` 值并在外层继续 yield。这个能力让"子生成器做计算、外层拿结果"成为可能。

### 2.8 yield from 用于递归生成器：模式总结

前几节已经展示了递归 + `yield from` 的多个实例（嵌套列表、树遍历、目录树）。这里总结递归生成器中 `yield from` 的典型模式，帮助举一反三。

**模式一：自相似结构的递归展平**

当一个结构满足"元素要么是叶子、要么是同结构的子容器"时，递归 + `yield from` 是最自然的遍历方式。

```python
def walk_similar(node):
    if is_leaf(node):
        yield node_to_value(node)
    else:
        for child in children(node):
            yield from walk_similar(child)  # 子结构委托
```

**模式二：分治 yielding**

把一个大任务分成若干子任务，每个子任务用子生成器处理，外层用 `yield from` 汇总。

```python
def process_segment(segment):
    """子生成器：处理一个片段，产出中间结果，返回汇总。"""
    ...
    return summary

def process_all(segments):
    total = 0
    for seg in segments:
        # 每个片段的产出被透传，返回值被累加
        sub_summary = yield from process_segment(seg)
        total += sub_summary
    yield ("TOTAL", total)
```

**模式三：带状态传递的递归委托**

```python
def search(node, target, path=()):
    """在树中搜索目标，用 yield from 递归委托，并维护当前路径。"""
    current_path = path + (node.value,)
    if node.value == target:
        yield current_path          # 找到，产出路径
    for child in node.children:
        yield from search(child, target, current_path)  # 带路径递归
```

`path` 参数随递归向下传递，`yield from` 把子搜索的命中结果透传到顶层调用方。这种"递归 + yield from + 状态参数"在树上做搜索、收集满足条件的路径时非常顺手。

### 2.9 yield from 与 await 的历史关系

在 Python 3.5 引入 `async` / `await` 之前，基于生成器的协程（generator-based coroutine）是 Python 异步编程的主流方案。`yield from` 在其中扮演了"协程委托"的关键角色：一个协程用 `yield from` 把控制权交给另一个协程，等待后者完成后再继续。

**基于 yield from 的协程委托（历史写法，仅作理解）**

```python
# Python 3.4 风格的协程（已过时，仅用于理解 yield from 的协程用途）
import asyncio

@asyncio.coroutine
def fetch_data():
    # 假设这是一个异步 IO 操作
    yield from asyncio.sleep(0.1)   # 委托给 asyncio.sleep
    return {"data": 42}

@asyncio.coroutine
def main():
    result = yield from fetch_data()   # 委托给另一个协程
    print(result)
```

这段代码中 `yield from asyncio.sleep(0.1)` 把当前协程挂起，把控制权交还给事件循环，等 `sleep` 完成后再恢复——这与今天 `await asyncio.sleep(0.1)` 的语义完全一致。`yield from fetch_data()` 则是把一个协程委托给另一个协程，等价于今天的 `result = await fetch_data()`。

Python 3.5 引入 `await` 后，`await x` 在语义上等价于 `yield from x`，但 `await` 只接受 **awaitable** 对象（实现了 `__await__` 的对象，如原生协程、Future、Task），而 `yield from` 接受任意可迭代对象。`await` 的引入让协程与普通生成器在语法上明确区分开：协程用 `async def` + `await`，普通生成器用 `yield` / `yield from`，避免了两者的混淆。

关于 `yield from` 与协程的完整讨论（包括事件循环、Future、协程调度等）放在第 08 篇「生成器与协程关系」中展开。本篇只需记住一个要点：**`await` 在语义上是 `yield from` 的协程特化版本**，`yield from` 建立的"双向转发 + 返回值接收"机制正是 `await` 语义的前身。

## 3. 最佳实践

**用 yield from 表达"整体委托"，用 for-yield 表达"加工后再产出"**

判断是否该用 `yield from` 的一个简单标准：如果你只是把子可迭代对象的值原封不动地送出去，用 `yield from`；如果你需要对每个值做加工、过滤、变换后再 yield，用 `for-yield`。

```python
# 推荐：原样转发用 yield from，意图清晰
def raw_stream(source):
    yield from source

# 推荐：需要加工时用 for-yield，加工逻辑显式可见
def upper_stream(source):
    for item in source:
        yield item.upper()

# 不推荐：明明要加工却套一层 yield from，反而绕
def upper_stream_bad(source):
    yield from (item.upper() for item in source)  # 等价但多一层生成器表达式
```

后者虽能工作，但生成器表达式藏起了加工逻辑，可读性不如直接的 `for-yield`。`yield from` 的优势在于"把一个完整的子生成器整体接进来"，而不是"在每一项上偷偷加工"。

**递归展平时务必处理递归终止与类型边界**

递归 `yield from` 最容易出的错是忘记区分"叶子"和"子结构"，导致无限递归或错误拆分。

```python
# 不推荐：没有类型边界判断，字符串会被拆成字符，无限递归风险
def flatten_dangerous(items):
    for item in items:
        if hasattr(item, "__iter__"):
            yield from flatten_dangerous(item)  # 字符串也会进这里！
        else:
            yield item

print(list(flatten_dangerous(["abc"])))
# 输出：['a', 'b', 'c']  —— 通常不是想要的

# 推荐：显式排除字符串/字节串等"叶子型可迭代对象"
def flatten_safe(items):
    for item in items:
        if isinstance(item, (list, tuple)):
            yield from flatten_safe(item)
        elif isinstance(item, (str, bytes)):
            yield item   # 字符串作为叶子整体产出
        elif hasattr(item, "__iter__"):
            yield from item  # 普通可迭代对象展平一层
        else:
            yield item
```

**注意 yield from 的返回值需要子生成器是生成器**

只有当委托对象是生成器（或协程）时，`return` 值才有意义。委托给列表、range 时 `yield from` 表达式的值永远是 `None`，写 `result = yield from [1,2,3]` 拿到的只能是 `None`。

```python
# 误用：期待从列表委托拿到返回值
def misuse():
    result = yield from [1, 2, 3]
    print(result)  # 永远是 None，列表没有 return

# 正确：需要返回值时委托给生成器，并由生成器 return
def subgen():
    yield 1
    yield 2
    return "done"

def correct():
    result = yield from subgen()
    print(result)  # done
```

**委托期间不要在外层生成器做额外 yield**

`yield from` 建立的委托通道依赖"调用方的每次 next/send 都能精准转发到子生成器"。如果在 `yield from` 之前或之间穿插外层自己的 yield，会打乱这种转发节奏，让 send/throw 的目标变得难以预测。

```python
# 不推荐：在委托过程中穿插外层 yield，send 转发会错位
def interleaved(sub):
    yield "外层预告"      # 调用方第一次 next 拿到这个，而非子生成器的值
    yield from sub        # 之后才进入委托
    yield "外层收尾"      # 委托结束后的额外 yield

# 调用方需要知道"前几步步是外层、中间是子生成器"，send 的时机难以掌握
```

并非绝对禁止——合法的需求（如委托前后的日志、收尾 yield）是合理的，但要意识到穿插 yield 会改变 send/throw 的对齐关系，调用方需相应调整调用顺序。

**避免对同一个已耗尽的子生成器重复 yield from**

生成器是一次性的：耗尽后再 `yield from` 不会产出任何东西。如果需要多次消费同一数据源，要么用 `list` 缓存，要么重新构造生成器。

```python
def subgen():
    yield 1
    yield 2

g = subgen()
print(list(g))   # [1, 2]

# g 已耗尽
def outer():
    yield from g  # 不会产出任何东西，g 已经空了
print(list(outer()))  # []
```

**不要用 yield from 替代 itertools.chain 处理大列表拼接**

对于纯粹的"多个列表拼成一个迭代器"需求，`itertools.chain` 在 C 层实现，性能优于生成器内的 `yield from` 循环。`yield from` 的真正价值在"需要生成器语义"（send/throw/close/return、穿插加工、递归）的场景。

```python
# 纯拼接、无加工、量大：优先 itertools.chain
import itertools
big = itertools.chain(range(1000000), range(1000000), range(1000000))

# 需要生成器语义（递归、返回值、穿插逻辑）：用 yield from
def flatten(nested):
    for item in nested:
        if isinstance(item, list):
            yield from flatten(item)
        else:
            yield item
```

**调试 yield from 时跟踪执行流**

`yield from` 的"透明转发"会让调试变难：异常的抛出栈中可能出现多个生成器层，且 send/throw 的实际目标不直观。建议在复杂委托链中给子生成器加日志，或在 `yield from` 前后打印边界信息。

```python
def traced_sub():
    print("  [sub] 启动")
    try:
        x = yield "sub-value"
        print(f"  [sub] 收到 send: {x}")
    finally:
        print("  [sub] 结束")
    return "sub-return"

def traced_outer():
    print("[outer] 委托开始")
    r = yield from traced_sub()
    print(f"[outer] 委托结束，返回值={r}")

gen = traced_outer()
print(next(gen))   # 打印 [outer] 委托开始 / [sub] 启动，输出 sub-value
print(gen.send(99)) # 打印 [sub] 收到 send: 99 / [sub] 结束 / [outer] 委托结束…，输出 sub-return(经 StopIteration)
```

## 4. 原理

### 4.1 yield from 在字节码层面建立了什么

`yield from` 不是一个简单的语法糖——它在字节码层面对应专门的指令 `YIELD_FROM`（Python 3.11 起被 `SEND` 与相关指令重构，但语义不变）。理解它做了什么，关键在于理解生成器的"帧挂起/恢复"模型。

普通生成器执行到 `yield x` 时，会把当前栈帧的状态（指令指针、局部变量、操作数栈）冻结，把 `x` 返回给调用方，然后挂起。调用方再次 `next` 或 `send` 时，生成器从上次挂起处恢复执行，`yield` 表达式的值就是 `send` 传入的值（或 `None`）。

`yield from sub` 在这之上增加了一层"代理"。当外层生成器执行到 `yield from sub` 时，发生的事情大致是：

1. **求值子表达式**：对 `yield from` 后面的表达式求值，得到子可迭代对象（设为 `sub`）。如果 `sub` 是生成器，则直接使用其帧；如果 `sub` 是普通可迭代对象，则通过 `iter(sub)` 获取迭代器。
2. **进入委托循环**：外层生成器进入一个由解释器内部驱动的循环，循环体大致等价于"对 `sub` 调用 `next` / `send`，把结果 `yield` 给外层调用方，把外层调用方的 `send` / `throw` 值再传回 `sub`"。
3. **挂起时记住委托目标**：当 `sub` yield 出一个值时，外层生成器把这个值转发给调用方并挂起。关键是：挂起状态中不仅记录外层生成器自己的指令位置，还隐式持有着对 `sub` 的引用以及 `sub` 当前的挂起状态。
4. **恢复时转发调用**：调用方再次调用 `next` / `send` / `throw` 时，解释器识别到外层生成器正处于 `yield from` 委托中，于是把这些调用**直接转发给 `sub`**，而不是外层生成器自己的代码。`sub` 产出的下一个值又被转发给调用方。
5. **StopIteration 捕获与返回值提取**：当 `sub` 耗尽抛出 `StopIteration` 时，解释器捕获它，取出 `StopIteration.value`（即 `sub` 的 `return` 值），把这个值作为 `yield from` 表达式的求值结果赋给外层生成器，外层生成器从 `yield from` 处继续往下执行。

整个过程里，外层生成器的代码"停在 `yield from` 这一行"，但实际的 next/send/throw 操作被路由到了 `sub`。这就是"委托"在字节码层面的实现——一条由解释器维护的透明转发通道。

### 4.2 双向转发的语义细节

`yield from` 的双向转发有几条值得深究的语义规则。

**关于 send 的转发**

当调用方对处于 `yield from` 委托中的外层生成器调用 `send(value)`：

- 如果这是委托期间的第一次 `send`（即 `sub` 刚启动，还没 yield 过），解释器抛出 `TypeError`，因为"启动生成器"只能用 `next`，不能 `send` 非 `None` 值——这与普通生成器一致。
- 如果 `sub` 已经 yield 过一次处于挂起态，`send(value)` 的 `value` 被传入 `sub` 当前挂起的 yield 表达式，作为其求值结果。`sub` 继续执行，产出的下一个值经外层转发给调用方。

关键点：`send` 的值**不会进入外层生成器**的任何 yield 表达式，因为外层此刻并没有在 yield 处挂起——它停在 `yield from`。解释器把 send 路由到 `sub`，而非外层。

**关于 throw 的转发**

调用方对外层生成器调用 `throw(exc_type, exc_val, exc_tb)`：

- 解释器把异常注入到 `sub` 当前挂起的 yield 处。
- 如果 `sub` 在该 yield 处被 `try/except` 包裹并捕获了异常，`sub` 继续正常执行，产出的下一个值经外层转发。
- 如果 `sub` 没捕获，异常会从 `sub` 冒泡，经 `yield from` 冒泡到外层生成器，再到调用方。冒泡过程中 `yield from` 表达式的求值被异常打断，不会拿到返回值。
- 如果异常导致 `sub` 结束（捕获后 break/return 或未捕获而终止），`yield from` 按正常流程结束或向上抛异常。

**关于 close 的转发**

调用方对外层生成器调用 `close()`：

- 解释器在 `sub` 当前挂起的 yield 处注入 `GeneratorExit` 异常。
- `sub` 的 `finally` 块（如果有）被执行。
- 如果 `sub` 捕获了 `GeneratorExit` 并 yield 了新值（这是不允许的），解释器抛 `RuntimeError`。
- `sub` 正常关闭后，外层生成器也从 `yield from` 处被关闭（同样注入 GeneratorExit，执行外层的 finally）。

**StopIteration 的特殊处理**

普通生成器在 `next` 耗尽时抛 `StopIteration`，这是迭代器协议的信号。但对于 `yield from`，子生成器的 `StopIteration` 不是"异常"而是"正常结束信号"——解释器捕获它，取 `value`，赋给 `yield from` 表达式，外层生成器继续。唯一例外是：如果 `sub` 内部显式 `raise StopIteration(value)`（而不是用 `return value`），在 Python 3.7+ 这会变成 `RuntimeError`（PEP 479 的改动），但在 `yield from` 语义下 `return value` 仍是传递返回值的标准方式。

### 4.3 手写 for-yield 为何无法实现双向转发

理解了 `yield from` 的转发机制后，就能看清为什么 `for x in sub: yield x` 做不到同样的事。

手写 `for-yield` 的执行模型是这样的：外层生成器在循环中调用 `next(sub)` 拿到 `x`，然后执行 `yield x` 把 `x` 送出并挂起。挂起时，外层生成器停在**自己的 `yield x`** 处，而非 `sub` 的内部状态。

当调用方 `send(value)` 时，`value` 进入的是外层生成器 `yield x` 这个表达式的求值结果（通常没有 lvalue 接收，值被丢弃）。下一轮循环，外层再次 `next(sub)`——注意是 `next(sub)`，不是 `sub.send(value)`——`sub` 产出的下一个值被 yield 出去。`sub` 全程只收到 `next` 调用，`send` 的 `value` 根本到不了 `sub`。

`throw` 同理：调用方对外层 `throw(exc)`，异常注入的是外层 `yield x` 处。如果外层没有 `try/except`，异常会让外层生成器终止，`sub` 则被遗弃（最终被 GC 时才可能收到 close，但不会有正常的 finally 执行流）。

`close` 也是：外层 `close()` 触发外层自己的 `GeneratorExit`，`sub` 不会收到 `close`，其 `finally` 不会按预期执行（除非 GC 兜底）。

根本原因在于：`for-yield` 中外层生成器与 `sub` 的关系是"消费者-生产者"——外层主动 `next(sub)` 拉取；而 `yield from` 中两者的关系是"代理-目标"——外层把调用方的调用透传给 `sub`。两种关系下控制流走向完全不同，这就是手写循环无法模拟委托的原因。

### 4.4 为何 yield from 能实现协程委托

把前面的转发机制叠加起来，就能看出 `yield from` 恰好提供了协程委托所需的全部要素：

- **控制权移交**：`yield from sub` 把外层协程挂起，把 `sub` 暴露给调度器（事件循环）作为新的"当前协程"。
- **值的双向传递**：`sub` yield 出的值（如"等待这个 Future 完成"）经外层透传给调度器；调度器 `send` / `throw` 的结果（如"Future 完成了，结果是 X"）经外层透传回 `sub`。外层协程在委托期间不参与值的处理，纯当管道。
- **完成信号与返回值**：`sub` 通过 `return value`（即 `StopIteration.value`）表示"我完成了，结果是这个"，`yield from` 把这个值取出来赋给外层，外层协程恢复执行，拿到子协程的结果。

这正好对应异步编程中"调用一个子协程并等待其完成"的需求：外层协程说"我要等 `sub` 完成，期间调度器你直接跟 `sub` 对话"，`yield from` 就是这句话的语法表达。`await` 关键字出现后，这套语义被保留下来，只是限定了 `await` 的操作数必须是 awaitable（协程语义更严格），而 `yield from` 仍可用于普通生成器间的委托。

**简化等价模型（帮助理解，非精确实现）**

下面这段伪代码近似刻画了 `yield from sub` 在解释器层面的行为，帮助对比手写循环为何做不到：

```python
# 伪代码：yield from sub 的概念性展开（仅帮助理解，不是真实实现）
def _yield_from_conceptual(outer_frame, sub):
    _i = iter(sub)
    # 启动子生成器（第一次必须用 next / send(None)）
    try:
        _y = next(_i)
    except StopIteration as _e:
        _r = _e.value       # 子生成器立即结束，返回值
        return _r           # yield from 表达式结果就是 _r

    while True:
        # 把 _y 转发给外层调用方，并挂起外层生成器
        # 调用方恢复时带来的值（send 的 value / throw 的异常）记为 _s
        try:
            _s = outer_frame.yield_and_suspend(_y)
        except GeneratorExit:
            # 调用方调了 close() -> 转发给子生成器
            _i.close()
            raise
        except BaseException as _exc:
            # 调用方调了 throw() -> 转发给子生成器
            try:
                _y = _i.throw(_exc)
            except StopIteration as _e:
                _r = _e.value
                return _r
            continue

        # 普通的 send(_s) -> 把 _s 传进子生成器
        try:
            _y = _i.send(_s)
        except StopIteration as _e:
            _r = _e.value
            return _r   # 子生成器结束，yield from 表达式取值为 _r
```

对照这段伪代码可以看出：每一次外层调用方的 `next` / `send` / `throw` / `close`，都被路由到对 `_i`（子迭代器）的相应调用，而外层生成器自身的代码全程停在 `yield from` 这一行。`for x in sub: yield x` 没有这种"路由"：它只是循环 `next(sub)` + `yield x`，`sub` 永远只被 `next` 调用。这就是结构性的差异。

### 4.5 yield from 的异常传播路径

`yield from` 期间，异常有几种来源与去向，理清它们有助于调试协程栈。

| 异常来源 | 在子生成器内的表现 | 是否经外层传播 |
|---------|------------------|--------------|
| 调用方 `throw` 注入 | 在子生成器当前 yield 处抛出 | 子未捕获则冒泡到外层再到调用方 |
| 子生成器内 `raise` | 子自身抛出 | 冒泡到外层 `yield from` 处，再到调用方 |
| 外层 `yield from` 前后代码 `raise` | 不涉及子生成器 | 直接从外层抛出 |
| `GeneratorExit`（close 触发） | 注入子生成器当前 yield | 子 finally 执行后，继续注入外层 |
| `StopIteration`（子正常结束） | 被解释器捕获 | 不传播，转为 `yield from` 表达式值 |

关键规则：子生成器未捕获的普通异常会"穿透" `yield from` 让外层生成器也终止——这与 `for-yield` 中子生成器异常冒泡的行为一致。差异在于 `StopIteration` 的处理：`for-yield` 中 `StopIteration` 被 `for` 循环捕获为结束信号；`yield from` 中 `StopIteration` 同样被捕获，但额外提取了 `.value` 作为表达式结果。

**异常穿透演示**

```python
def sub_raises():
    yield 1
    raise ValueError("子生成器内部出错")

def outer_delegate():
    yield "外层-前"
    yield from sub_raises()   # 子生成器抛 ValueError，会穿透到这里
    yield "外层-后"           # 不会执行

gen = outer_delegate()
print(next(gen))  # 输出：外层-前
print(next(gen))  # 输出：1
try:
    next(gen)
except ValueError as e:
    print(f"捕获到穿透的异常: {e}")
# 输出：捕获到穿透的异常: 子生成器内部出错
```

`sub_raises` 抛出的 `ValueError` 经 `yield from` 穿透外层生成器到达调用方。外层的 `yield "外层-后"` 没机会执行——异常让外层也终止了。这与直觉一致：委托期间子生成器的异常就是外层的异常。

### 4.6 StopIteration.value 与 return 的等价性

Python 中生成器 `return value` 与 `raise StopIteration(value)` 在效果上等价——解释器在生成器函数返回时，会自动抛出 `StopIteration`，`return` 的值成为 `StopIteration.value`。`yield from` 正是利用这一机制来传递返回值。

```python
def returns_42():
    yield 1
    return 42

# 手动观察 StopIteration.value
gen = returns_42()
next(gen)  # 1
try:
    next(gen)
except StopIteration as e:
    print(f"StopIteration.value = {e.value}")  # 输出：StopIteration.value = 42

# yield from 把 value 取出来作为表达式结果
def consumer():
    r = yield from returns_42()
    print(f"yield from 拿到: {r}")

list(consumer())
# 输出：yield from 拿到: 42
```

了解这一点有两个意义：第一，解释了为什么 `return` 能在生成器里"传值"——本质是 `StopIteration.value`；第二，理解了 PEP 479（Python 3.7+ 默认启用）的影响——在生成器内部显式 `raise StopIteration` 会被转为 `RuntimeError`，所以传递返回值必须用 `return`，不能用 `raise StopIteration(value)`。`yield from` 的返回值机制不受 PEP 479 影响，因为它捕获的是生成器自然结束时产生的 `StopIteration`。

## 5. 总结

### 5.1 本文内容要点

- **`yield from` 是生成器委托语法**（PEP 380，Python 3.3+）：把外层生成器对可迭代对象的"产出"整体委托给子可迭代对象，等价于 `for-yield` 的产出行为，但功能更强。
- **产出转发**：`yield from iterable` 会把 `iterable` 的每个值逐个经外层生成器送出，实现扁平化拼接、嵌套展平。
- **返回值接收**：`yield from` 是表达式，其值是子生成器 `return` 的返回值，可用 `result = yield from subgen()` 接收。普通可迭代对象无 return，结果为 `None`。
- **双向转发 send/throw/close**：当子对象是生成器时，`yield from` 把调用方对 外层生成器的 `next` / `send` / `throw` / `close` 直接转发给子生成器，外层在委托期间对调用方透明。
- **与手写 for-yield 的核心差异**：for-yield 只转发产出，不转发 send/throw/close，也拿不到子生成器 return 值；yield from 是完整的双向委托通道。
- **典型用途**：扁平化嵌套列表、树结构深度优先遍历、多阶段数据流水线委托、递归生成器（自相似结构展平、分治 yielding、带状态递归）。
- **与 await 的关系**：`await` 在语义上是 `yield from` 的协程特化版本，Python 3.5 前 `yield from` 用于协程委托，协程完整讨论见第 08 篇。
- **原理**：`yield from` 在字节码层面建立委托循环，外层生成器停在 `yield from` 行，调用方的每次 next/send/throw/close 被路由到子生成器；子生成器 `StopIteration.value` 被捕获作为 `yield from` 表达式结果；手写 for-yield 没有"路由"，只能 `next(sub)` 拉取，故无法转发交互。
- **最佳实践**：原样转发用 `yield from`、加工产出用 `for-yield`；递归展平务必处理类型边界（字符串不应拆分）；委托期间避免穿插 yield 打乱 send 对齐；纯大列表拼接优先 `itertools.chain`。

### 5.2 读完本文你应能掌握

- 能说明 `yield from` 与 `for-yield` 在产出转发、send/throw/close 转发、return 值接收三方面的本质差异，并据此选择正确写法。
- 能用 `yield from` 实现嵌套列表递归展平、二叉树前/中/后序遍历、目录树深度优先遍历，并解释递归委托为何能让中间层"透明"。
- 能用 `result = yield from subgen()` 接收子生成器的 return 值，并知道何时该值是 `None`（委托普通可迭代对象时）。
- 能编写基于 `yield from` 的多阶段生成器流水线，正确衔接阶段之间的数据流与返回值。
- 能解释 `yield from` 在字节码/解释器层面如何建立委托循环、如何路由 next/send/throw/close、如何捕获 `StopIteration.value`，以及手写 `for-yield` 为何无法实现同样的转发。
- 能简述 `yield from` 在协程演进史中的角色及其与 `await` 的语义对应关系，并能指出何时该查第 08 篇深入理解协程。
- 能识别递归 `yield from` 中的类型边界陷阱（字符串被拆分）、已耗尽生成器重复委托、委托期间穿插 yield 导致 send 错位等常见坑并规避。