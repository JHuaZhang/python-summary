---
group:
  title: 【17】生成器与迭代器
  order: 17
order: 8
title: 生成器与协程关系
nav:
  title: Python
  order: 1
---

## 1. 介绍

### 1.1 从"可暂停的迭代器"到"可暂停的函数"

生成器在 Python 中最初的设计目标是"惰性产出的迭代器"——用 `yield` 把一个函数变成可暂停、可恢复的数据生产器。这是绝大多数初学者对生成器的第一印象：它是一个"能一边算一边吐值"的迭代器，省内存、可迭代。

但如果只把生成器理解为迭代器，就只看到了它的一半。`yield` 这个关键字的本质不是"产出值"，而是"暂停执行并交还控制权"——它把一个普通函数从"一调到底、一气呵成"变成了"可中断、可恢复、可在中断点接收外部输入"的状态机。这种"暂停-恢复-双向通信"的能力，恰恰是协程（coroutine）的核心语义。

协程这个概念比线程更早被提出：它是一个"可主动让出控制权、稍后从让出点继续执行"的函数。生成器的 `yield` 天然提供了"让出控制权"的机制，因此 Python 的生成器经过几次增量演进（PEP 342、PEP 380），逐渐被"打扮"成了协程，并在 Python 3.4 的 `asyncio` 中以 `@asyncio.coroutine + yield from` 的形态写并发协程。直到 Python 3.5 引入 `async/await`，协程才与生成器正式分家，成为独立的概念。

本篇作为生成器系列的收官篇，要把生成器从"迭代器"延伸到"协程"的认知闭环讲清楚：生成器是怎么一步步演变成协程的、为什么它天然适合做协程、以及现代 Python 中生成器与协程各自担当什么角色。

### 1.2 两个视角下的 `yield`

理解生成器与协程的关系，首先要建立两个看 `yield` 的视角：

**迭代器视角**：`yield` 是"产出值"的语句。调用方用 `next(gen)` 取一个值，生成器在 `yield` 处暂停，产出的值流回调用方。这是一个单向的"生产者 → 消费者"数据流，生成器是生产者，`for` 循环是消费者。

**协程视角**：`yield` 是"挂起并等待输入"的表达式。调用方不仅可以用 `next(gen)` 唤醒它，还可以用 `gen.send(value)` 把一个值送回挂起点，生成器在 `yield` 处收到的就是这个值。此时 `yield` 不再只是"吐值"，而是"交换消息"——生成器既是生产者也是消费者，和调用方形成双向通信。

同一个 `yield`，从迭代器视角看是"产出"，从协程视角看是"暂停并接收"。这两种视角并不矛盾，而是同一机制的不同用法。协程的演化，本质上就是 Python 逐步给生成器补上了"接收输入""抛异常""委托他人""被事件循环调度"这些能力，让"协程视角"真正可用。

### 1.3 最小示例：同一个生成器的两种用法

下面这段代码定义一个生成器函数，用两种方式驱动它，直观感受"迭代器用法"与"协程用法"的区别。

```python
def echo():
    """一个最简单的生成器，也是协程的雏形。"""
    print("启动")
    while True:
        # yield 既是"产出 None"，也是"挂起，等待接收"
        received = yield
        print(f"收到: {received}")


# ---- 迭代器视角：用 next 驱动，只关心它"执行了" ----
gen = echo()
next(gen)        # 预激：执行到 yield 处暂停，打印"启动"
# 输出：启动

# ---- 协程视角：用 send 驱动，把值送回挂起点 ----
gen.send("hello")
# 输出：收到: hello

gen.send(42)
# 输出：收到: 42

gen.close()      # 关闭协程
```

这个例子揭示了关键点：`received = yield` 这一行，在 `next` 驱动时 `received` 拿到的是 `None`（因为没人 send 值进来），在 `send` 驱动时 `received` 拿到的正是调用方送进来的值。生成器从"单向吐值"变成了"双向对话"，这就是协程的雏形。

后续章节会逐步展开：`send`/`throw`/`close` 如何赋予生成器协程语义（2.1）、`yield from` 如何让协程可组合（2.2）、早期 `asyncio` 如何用生成器写协程（2.3）、`async/await` 如何让协程与生成器分家（2.4）、以及在原理章（4）里从字节码与帧调度的层面讲清这套机制为什么成立。

---

## 2. 核心内容

### 2.1 PEP 342：send / throw / close 让生成器"会听话"

PEP 342（Python 2.5）是生成器迈向协程的第一步。在它之前，调用方只能用 `next(gen)` 单向地"从生成器取值"，生成器无法接收调用方的任何反馈。PEP 342 给生成器加了三个能力：

1. `send(value)`：把一个值送回生成器的挂起点，作为 `yield` 表达式的返回值，并恢复执行到下一个 `yield`。
2. `throw(type[, value[, traceback]])`：在生成器挂起点抛出一个异常，由生成器内部决定捕获还是传播。
3. `close()`：在挂起点抛出 `GeneratorExit`，要求生成器退出，并最终清理。

有了这三个方法，生成器就不再只是"被动的数据生产者"，而是"可以接收输入、可以被告知出错、可以被要求停止"的主动体——这正是协程的语义。

#### 2.1.1 send：把值送回挂起点

`send(value)` 的关键是：它让 `yield` 从"语句"变成"表达式"。在协程式生成器里，通常写成 `value = yield` 或 `value = yield produced`，其中 `yield` 表达式的值就是调用方 `send` 进来的东西。

这里有一个容易被忽略的细节：`send` 会恢复生成器执行到下一个 `yield`，并返回那个 `yield` 产出的值——也就是说 `send` 同时完成了"送入值"和"取出值"两件事，是双向通信的核心。

需要注意"预激"（priming）问题：一个新创建的生成器，第一次必须用 `next(gen)` 或 `gen.send(None)` 启动，让它执行到第一个 `yield` 处暂停。如果直接 `gen.send(非None值)`，会抛 `TypeError: can't send non-None value to a just-started generator`，因为启动时 `yield` 表达式还没被求值，无处接收这个值。

下面用一个"累加器"协程演示 `send` 的双向通信：它不断接收数值，并返回当前累计值。

```python
def accumulator():
    """一个用生成器实现的累加器协程：接收数值，返回累计值。"""
    total = 0
    while True:
        # yield 产出当前的 total，同时挂起等待下一个输入
        value = yield total
        if value is None:
            break
        total += value


acc = accumulator()
next(acc)           # 预激：执行到第一个 yield，返回 total=0
# 此时协程在 yield 处挂起，等待 send

print(acc.send(10)) # 送入 10，total 变为 10，执行到下一个 yield 返回 10
# 输出：10

print(acc.send(20)) # 送入 20，total 变为 30，返回 30
# 输出：30

print(acc.send(5))  # 送入 5，total 变为 35，返回 35
# 输出：35

acc.close()         # 关闭协程
```

这段代码里，`yield total` 同时做了两件事：把当前累计值 `total` 产给调用方（迭代器视角），并在挂起点等待调用方 `send` 一个新值进来（协程视角）。`send(10)` 送入 10 让 `value` 拿到 10，协程执行 `total += 10`，到达下一个 `yield total` 时把新的 `total=10` 产回给调用方。一次 `send` 完成了一次完整的"输入→处理→输出"往返，这正是协程的典型交互模式。

#### 2.1.2 throw：在挂起点注入异常

`throw` 让调用方可以在生成器挂起的地方抛出一个异常。生成器可以 `try/except` 捕获它并作出响应，也可以让它传播出去。这在协程模型里很有用：调用方可以告知协程"外部出了个错，你处理一下"。

一个典型场景是把协程当作"可受控的状态机"，调用方通过 `send` 喂数据、通过 `throw` 报告异常，协程内部统一处理。

```python
def robust_parser():
    """模拟一个鲁棒的解析协程：正常接收数据，异常时重置状态。"""
    buffer = ""
    while True:
        try:
            data = yield buffer
            if data is None:
                return
            buffer += data
        except ValueError as e:
            # 收到非法数据，清空缓冲区并报错，但不退出协程
            print(f"  [解析器] 收到异常: {e}，已清空缓冲区")
            buffer = ""


parser = robust_parser()
next(parser)              # 预激

print(parser.send("abc"))
# 输出：abc

print(parser.send("def"))
# 输出：abcdef

# 调用方发现某段数据有问题，向协程注入异常
parser.throw(ValueError, "非法字符")
# 输出：  [解析器] 收到异常: 非法字符，已清空缓冲区
# 注意：throw 之后协程恢复执行到下一个 yield，返回当前 buffer（空串）

print(parser.send("xyz"))  # 协程继续正常工作
# 输出：xyz

parser.close()
```

`throw` 的语义是：在生成器当前挂起的 `yield` 处抛出指定异常。如果生成器内部捕获了它，生成器恢复执行到下一个 `yield`，`throw` 调用返回那个 `yield` 的值；如果没捕获，异常传播到调用方，生成器被关闭。这让协程不仅能被"喂数据"，还能被"报告错误"，是一个完整的双向、可容错通道。

#### 2.1.3 close：优雅终止协程

`close()` 在生成器挂起点抛出 `GeneratorExit` 异常。生成器可以捕获它做清理（比如关闭文件、释放资源），但必须（直接或间接地）让生成器退出，不能再 `yield` 一个值出来——如果在 `GeneratorExit` 的 `except` 里又 `yield`，会抛 `RuntimeError: generator ignored GeneratorExit`。

`close()` 对应协程的"停止"语义。在一个用生成器搭的事件循环里，用 `close()` 通知协程清理并退出。

```python
def resource_worker():
    """模拟一个持有资源的协程，关闭时做清理。"""
    print("[worker] 启动，打开资源")
    try:
        while True:
            task = yield
            print(f"[worker] 处理任务: {task}")
    finally:
        # 无论正常结束、抛异常还是 close，都会进入这里
        print("[worker] 关闭资源，退出")


worker = resource_worker()
next(worker)              # 预激
worker.send("任务A")
# 输出：[worker] 处理任务: 任务A
worker.send("任务B")
# 输出：[worker] 处理任务: 任务B

worker.close()            # 触发 GeneratorExit，进入 finally
# 输出：[worker] 关闭资源，退出
```

`send`/`throw`/`close` 三件套的意义在于：生成器不再只是"被 `for` 拉取的迭代器"，而是"被调用方主动驱动、可输入可报错可停止的协程"。PEP 342 之后，Python 文档里开始出现"生成器可以被用作简单的协程"这样的表述——协程的种子已经埋下。

### 2.2 PEP 380：yield from 让协程可组合

PEP 342 让生成器有了协程的"能力"，但写出来的协程很难"组合"——一个协程想调用另一个协程，要手动写一段繁琐的 `send`/`throw` 转发样板代码。PEP 380（Python 3.3）引入 `yield from`，解决了协程的"委托"问题。

`yield from subgen` 的语义是：把当前生成器（协程）的控制权委托给子生成器 `subgen`，调用方与当前协程的所有交互（`send` 的值、`throw` 的异常、`close`）都透传给 `subgen`，直到 `subgen` 结束，它的返回值作为 `yield from` 表达式的值返回给当前协程。

这使得协程可以像普通函数调用那样嵌套、组合：外层协程 `yield from` 内层协程，调用方仍然直接与最外层交互，数据流和异常流自动穿透整条委托链。

#### 2.2.1 yield from 做迭代委托：扁平化嵌套迭代

`yield from` 最直观的用法是迭代委托——把一个子迭代器的所有元素"原样转吐"出去，省去手写 `for + yield` 的样板。

```python
def flatten(nested):
    """展平任意层嵌套的可迭代对象。"""
    for item in nested:
        if isinstance(item, (list, tuple)):
            # 把子序列的元素委托给当前生成器产出
            yield from flatten(item)
        else:
            yield item


data = [1, [2, 3, [4, 5]], 6, [7]]
print(list(flatten(data)))
# 输出：[1, 2, 3, 4, 5, 6, 7]
```

这里的 `yield from flatten(item)` 等价于"把 `flatten(item)` 这个生成器的产出逐个透传给我的调用方"，但底层做的远不止 `for + yield`：它还透传 `send`、`throw`、`close`，并接收子生成器的返回值。这层语义在协程场景下至关重要。

#### 2.2.2 yield from 做协程委托：让协程可嵌套组合

真正体现 `yield from` 协程价值的是"协程委托"：一个外层协程把一段工作委托给一个内层协程，内层协程可以直接和最外层的调用方双向通信，外层协程只负责"把话传过去"。

下面这个例子展示用 `yield from` 组合两个协程：一个"接收器"协程负责收集数据并返回均值，一个"代理器"协程用 `yield from` 把调用方的数据委托给接收器。

```python
def averager():
    """内层协程：接收数值，结束时返回均值。"""
    total = 0
    count = 0
    while True:
        value = yield
        if value is None:
            return total / count if count else 0   # 协程的"返回值"
        total += value
        count += 1


def delegator():
    """外层协程：委托给 averager，并在收尾时报告结果。"""
    # yield from 把调用方的 send/异常透传给 averager，
    # 并把 averager 的 return 值作为此表达式的值
    result = yield from averager()
    print(f"[代理器] 内层协程返回均值: {result}")


d = delegator()
next(d)                 # 预激（会一路透传到 averager 的第一个 yield）
d.send(10)
d.send(20)
d.send(30)
d.send(None)            # 触发 averager 的 return
# 输出：[代理器] 内层协程返回均值: 20.0
```

关键点在于：调用方只和 `delegator` 打交道，但 `send(10)` 这个值实际是被 `averager` 接收的；`averager` return 的均值，经由 `yield from` 流回 `delegator` 并被打印。整条委托链上的数据流、控制流、返回值是自动穿透的，不用写任何转发样板代码。

如果没有 `yield from`，要做同样的委托，得手写类似这样的样板：

```python
def delegator_manual():
    avg = averager()
    next(avg)                       # 预激子协程
    try:
        while True:
            value = yield           # 从调用方收值
            avg.send(value)         # 转发给子协程
    except StopIteration as e:
        result = e.value            # 取子协程的返回值
        print(f"[手动委托] 均值: {result}")
```

`yield from` 把这段几行的样板变成一个关键字，让"协程调用协程"像"函数调用函数"一样自然。这是协程从"玩具"走向"可写复杂逻辑"的关键一跃。

**`yield from` 的完整语义清单**（理解这几点才算掌握它）：

- 调用方 `send(v)` 的值，透传给子生成器当前挂起的 `yield`。
- 子生成器产出的值，透传给调用方（外层生成器不"消费"这些值）。
- 子生成器 return 的值，作为 `yield from` 表达式的值赋给外层生成器。
- 调用方 `throw` 的异常，透传给子生成器挂起点，由子生成器处理或传播。
- 调用方 `close` 透传给子生成器，触发其 `GeneratorExit` 清理。
- 只有子生成器结束时，外层生成器才恢复执行 `yield from` 之后的代码。

这套语义在协程场景下意味着"协程可以像普通函数一样被组合、嵌套、复用"，为后续把生成器当作异步协程来写打下了语法基础。

### 2.3 早期 asyncio：用 yield from 写协程

有了 PEP 342 和 PEP 380，生成器已经具备完整的协程能力。Python 3.4 的 `asyncio`（PEP 3156）顺势用生成器实现了第一套官方异步协程框架：用 `@asyncio.coroutine` 装饰一个生成器函数，里面用 `yield from` 等待 Future/Task，从而写出非阻塞的并发代码。

这个时期写异步协程的典型形态是这样的（下面用 `asyncio` 的旧式写法演示，Python 3.11+ 已废弃 `@asyncio.coroutine`，这里仅做历史演示）：

```python
# 注意：以下为 Python 3.4 时代的协程写法，新版本已废弃，仅用于理解演进
import asyncio
import types

# 用 types.coroutine 把一个生成器函数标记为协程，模拟旧式 @asyncio.coroutine
@types.coroutine
def old_style_coroutine():
    print("[旧式协程] 开始")
    # 用 yield from 等待一个 Future，把控制权交还给事件循环
    yield from asyncio.sleep(0.01)   # 这里的 sleep 返回一个 Future
    print("[旧式协程] 恢复，结束")
    return "done"


async def main_modern():
    # 现代的 await 仍然能驱动旧式协程，因为它们都遵循 awaitable 协议
    result = await old_style_coroutine()
    print(f"[main] 收到结果: {result}")


# asyncio.run(main_modern())
# 输出：
# [旧式协程] 开始
# [旧式协程] 恢复，结束
# [main] 收到结果: done
```

这段代码的历史意义在于：一个用 `yield from` 写的生成器函数，被装饰成协程后，能被 `asyncio` 的事件循环调度、可以和真正的异步 I/O（`asyncio.sleep` 底层是定时器 Future）配合工作。也就是说，Python 的第一套协程方案，完全是"在生成器身上"实现的。

**为什么生成器能当协程用？** 因为 `yield from` 把协程的"等待-恢复"建模成了"生成器的挂起-恢复"：

- 协程说我现在要等待一个 I/O 结果 → 对应生成器 `yield from future`，把控制权交还给事件循环；
- 事件循环拿到 I/O 结果后 → 调用 `future.set_result(value)`，再 `task.send(value)` 唤醒协程；
- 协程从 `yield from` 处拿到结果，继续执行 → 对应生成器从挂起点恢复。

事件循环和协程之间，就是靠 `send`/`yield from` 这套生成器机制驱动的。生成器的"暂停-恢复"与协程的"等待-唤醒"在此刻合二为一。

但用生成器写协程有两个问题：一是"协程"和"生成器"在类型上不分家，一个函数到底是协程还是迭代器，只能靠装饰器和约定来区分，容易混淆；二是 `yield from` 既能委托迭代器又能委托协程，语义过载。这直接催生了下一节要讲的 `async/await`。

### 2.4 PEP 492：async/await 让协程与生成器分家

Python 3.5 的 PEP 492 引入 `async def` 和 `await`，把"协程"提升为一等公民，与生成器正式分家。这是协程演进史上最重要的一次切割。

核心变化有三点：

1. **语法层面**：用 `async def` 定义原生协程函数，调用它返回的是 `coroutine` 对象而不是 `generator` 对象；在协程内部用 `await expr` 等待一个 awaitable，取代 `yield from`。
2. **类型层面**：`async def` 定义的函数，其返回对象的类型是 `types.CoroutineType`，而生成器是 `types.GeneratorType`——两者在底层是不同的标志位区分的（见原理章 4.4）。
3. **语义层面**：`await` 只能用于 `async def` 内部，且 `await` 的对象必须是 awaitable（实现了 `__await__` 的对象，或 `coroutine`/`Future`/`Task` 等）。它不再像 `yield from` 那样能委托任意迭代器。

**`yield from` 协程与 `async/await` 的等价对照**：

下面的例子用两种写法实现同一个"等待后取结果"的协程，直观感受它们的等价性和 `async/await` 的清晰度。

```python
import asyncio
import types


# ---- 写法一：旧式 yield from 协程 ----
@types.coroutine
def fetch_with_yield():
    print("[yield 式] 等待中...")
    # 旧式：用 yield from 把控制权交给事件循环（这里用 sleep 模拟 I/O）
    result = yield from asyncio.sleep(0.01, result="data_from_io")
    print(f"[yield 式] 拿到: {result}")
    return result.upper()


# ---- 写法二：现代 async/await 协程 ----
async def fetch_with_await():
    print("[await 式] 等待中...")
    # 现代：用 await 等待一个 awaitable
    result = await asyncio.sleep(0.01, result="data_from_io")
    print(f"[await 式] 拿到: {result}")
    return result.upper()


async def main():
    r1 = await fetch_with_yield()
    r2 = await fetch_with_await()
    print(f"两种写法结果一致: {r1} == {r2}")


# asyncio.run(main())
# 输出：
# [yield 式] 等待中...
# [yield 式] 拿到: data_from_io
# [await 式] 等待中...
# [await 式] 拿到: data_from_io
# 两种写法结果一致: DATA_FROM_IO == DATA_FROM_IO
```

两种写法做的事情完全一样：都是"挂起协程、把控制权给事件循环、等 I/O 结果、恢复执行"。区别在于 `async/await` 用专门的语法和类型，把"这是协程"这件事声明得清清楚楚，不再借用生成器的壳。

**`async/await` 相对 `yield from` 协程的优势**：

- **概念清晰**：`async def` 一眼看出这是协程不是迭代器，`await` 一眼看出是在等待而不是产出。
- **类型分离**：协程对象有独立的 `COROUTINE` 标志，不会和生成器混用，可以静态检查出"在协程里 `yield` 当迭代器"这类错误。
- **禁止误用**：原生协程里不能 `yield` 产出值给 `next()`，否则直接报错；而旧式协程因为是生成器，仍能被 `next` 错误驱动。
- **可组合性更强**：`await` 基于 awaitable 协议（`__await__`），任何实现该协议的对象都能被 `await`，扩展性比 `yield from` 好。

从 Python 3.5 起，写异步协程的标准方式就是 `async/await`，`@asyncio.coroutine` 在 3.8 被标记废弃、3.11 移除。但理解生成器协程这条路仍然重要——因为 `async/await` 在字节码层面（见 4.4）和事件循环调度层面（见 4.5）依然继承了生成器协程的内核。

### 2.5 现代 Python 的分工：生成器做迭代，async 做并发

`async/await` 分家之后，现代 Python 里生成器和协程有了清晰的分工：

| 维度 | 生成器（generator） | 协程（async def coroutine） |
|------|---------------------|------------------------------|
| 定义 | `def` + `yield` | `async def`（可含 `await`） |
| 驱动方式 | `next`/`send`/`yield from` | `await`/事件循环调度 |
| 核心用途 | 惰性迭代、数据流生产 | 异步 I/O、并发任务 |
| 暂停语义 | 在 `yield` 处暂停、可被 `next` 恢复 | 在 `await` 处挂起、交还事件循环 |
| 是否需要事件循环 | 不需要 | 需要（`asyncio.run` 等） |
| 类型 | `types.GeneratorType` | `types.CoroutineType` |
| 能否用于 `for` | 能（是迭代器） | 不能（不是迭代器） |

简言之：**需要"产数据"用生成器，需要"等 I/O"用协程**。生成器回到它最初的定位——可暂停的迭代器；协程接管并发的职责——可暂停的异步函数。两者都依赖"暂停-恢复"这个共同的底层机制，但用途和驱动方式分道扬镳。

下面这个例子把两者放在一起对比，清楚展示"生成器被 `for` 拉数据"与"协程被 `await` + 事件循环驱动"的区别。

```python
import asyncio


# 生成器：惰性产出数据，用 for 驱动
def number_stream(n):
    """产出一串数字，用于迭代消费。"""
    for i in range(n):
        yield i


# 协程：异步等待，用 await + 事件循环驱动
async def fetch_item(i):
    """模拟一次异步 I/O（如网络请求），返回结果。"""
    await asyncio.sleep(0.001)     # 让出控制权给事件循环
    return f"item_{i}"


async def main():
    # 用生成器产出要处理的编号序列
    for idx in number_stream(3):
        # 用协程异步获取每一项
        result = await fetch_item(idx)
        print(result)


# asyncio.run(main())
# 输出：
# item_0
# item_1
# item_2
```

生成器负责"产出编号"，协程负责"异步取数据"，各司其职。这种"生成器做迭代、async 做并发"的分工，是 `async/await` 分家后 Python 推荐的清晰写法。

---

## 3. 最佳实践

### 3.1 不要在新代码里用生成器写协程

**推荐**：异步协程一律用 `async def` + `await`。

**不推荐**：用 `@types.coroutine` + `yield from` 写协程。

原因：`@asyncio.coroutine` 在 3.11 已被移除，`@types.coroutine` 虽然 API 还在，但仅用于"把底层生成器包成 awaitable"这类高级场景，不应作为日常协程写法。用生成器写协程会丢失类型清晰度和静态检查能力，还会让其他开发者困惑这是迭代器还是协程。

只有在"需要与遗留 `yield from` 协程代码互操作"或"实现自定义 awaitable 底层"时，才考虑用 `types.coroutine` 装饰生成器，且应在注释里说明它是 awaitable 而非迭代器。

### 3.2 区分"协程式生成器"与"迭代器式生成器"避免误用

如果你确实要用 `send` 双向通信把生成器当协程式状态机（比如写一个数据管道协程），请把它和"纯迭代器式生成器"在心智上分开，并在命名与注释上标注用途：

```python
# 建议：协程式生成器命名上体现"会接收输入"
def pipe_coroutine():          # 名字带 coroutine 暗示它要被 send 驱动
    """协程式生成器：用 send 喂数据，用 close 收尾。"""
    while True:
        data = yield
        process(data)
```

而纯迭代器式生成器只关心产出，命名和注释应体现"供迭代消费"：

```python
# 纯迭代器式：只产出，不接收输入
def page_iterator(pages):
    """迭代器：逐页产出内容。"""
    for p in pages:
        yield p.content
```

混用会带来坑：比如把一个协程式生成器（预期被 `send`）误丢进 `for` 循环，第一次 `next` 后它收到的全是 `None`，行为错乱却不易察觉。明确区分用途、在文档里写清驱动方式，能避免这类隐蔽 bug。

### 3.3 用 `yield from` 做迭代委托仍然现代且安全

虽然 `yield from` 做"协程委托"已被 `await` 取代，但 `yield from` 做"迭代委托"（把子生成器的元素透传出来）仍然是现代、惯用的写法，被 PEP 380 定义且无废弃风险。

```python
# 推荐：用 yield from 扁平化/组合迭代器，简洁且语义清晰
def chained(*iterables):
    for it in iterables:
        yield from it
```

不要因为"`yield from` 在协程里过时了"就连带在迭代场景也回避它——两种场景的推荐度是分开的。迭代委托用 `yield from` 是好实践，协程等待用 `await` 才是正道。

### 3.4 使用生成器协程时务必预激

如果你需要用到 `send` 驱动的协程式生成器，记住：**创建后第一次必须 `next(gen)` 或 `gen.send(None)` 预激**，否则直接 `send(非None)` 会抛 `TypeError`。

一个减少这个坑的办法是用装饰器自动预激，但 Python 标准库没有提供，需要自己写。更推荐的做法是：新代码里的"协程"需求直接用 `async def`，它不需要手动预激（`await` 自然处理恢复），从根上规避这个问题。

```python
# 容易踩的坑：忘记预激
def co():
    x = yield
    print(x)

c = co()
# c.send("hi")   # TypeError: can't send non-None value to a just-started generator
next(c)           # 先预激
c.send("hi")      # 输出：hi
```

### 3.5 生成器协程里慎用 `return` 值

在生成器里 `return value` 的语义是"结束生成器并把 `value` 作为 `StopIteration.value`"。`yield from` 能接收这个值，但用 `next` 驱动的人拿到的是 `StopIteration` 异常，容易忽略里面的值。

```python
def gen_with_return():
    yield 1
    yield 2
    return "结束标志"     # 这个值藏在 StopIteration.value 里

g = gen_with_return()
print(next(g))  # 1
print(next(g))  # 2
try:
    next(g)
except StopIteration as e:
    print(e.value)   # 结束标志 —— 不主动 catch 就拿不到
# 输出：结束标志
```

如果协程的返回值需要被调用方使用，明确用 `yield from` 接收或改用 `async def`（`await` 能直接拿到协程的 return 值）。别依赖调用方记得去读 `StopIteration.value`。

### 3.6 事件循环里别阻塞：生成器与协程的"暂停"语义不同

生成器的"暂停"是同步的——它只是把控制权在调用栈里上下传递，整个线程并没有在做别的事。协程的"暂停"配合事件循环才是异步——挂起后事件循环可以去调度其他协程、处理 I/O。

一个常见错误是把耗时同步操作放在协程里，以为 `await` 会让它不阻塞。实际上 `await` 只在等待 awaitable 时才交还控制权，纯粹的 CPU 计算或同步阻塞调用（如 `time.sleep`、同步 `requests.get`）放在 `async def` 里照样阻塞整个事件循环。

```python
import asyncio
import time

# 错误：time.sleep 是同步阻塞，会卡住事件循环
async def bad():
    time.sleep(1)          # 阻塞！其他协程全卡住
    return "done"

# 正确：用 asyncio.sleep，它会交还控制权
async def good():
    await asyncio.sleep(1) # 不阻塞，事件循环可调度其他协程
    return "done"

# 纯 CPU 密集任务应放到 executor：
async def cpu_task():
    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(None, heavy_compute)
    return result
```

记住：协程的并发能力来自"挂起时事件循环能去干别的"，一旦你不挂起（不 `await`）或挂起在同步阻塞调用上，并发就失效了。生成器的"暂停"不涉及事件循环，两者别混淆。

---

## 4. 原理

本章从字节码与帧调度的层面，讲清生成器为何能演变成协程、`send`/`yield from`/`async`/`await`/事件循环各自的底层机制，以及它们如何对应。

### 4.1 生成器帧的暂停-恢复机制：协程的物理基础

普通函数的调用栈帧是"一次性"的——函数执行完，帧就被销毁。生成器的关键不同在于：**它的帧在 `yield` 时不被销毁，而是被冻结挂起**，下次 `next`/`send` 时在原帧上从挂起点恢复执行。

在 CPython 实现层面，调用一个生成器函数返回的是一个生成器对象，它内部持有一个 `gi_frame`（生成器帧）。这个帧保存了：

- 指向当前执行到哪的字节码指令指针（`gi_frame.f_lasti`）；
- 所有局部变量的值；
- 计算栈（evaluation stack）的当前状态；
- 异常状态等。

当 `yield` 执行时，CPython 把当前帧的 `f_lasti` 指向 `YIELD_VALUE` 指令之后的位置，把生成器对象的状态设为暂停，然后把 `yield` 的值返回给调用方——但帧本身不释放。下次 `next`/`send` 时，CPython 重新进入这个帧，从 `f_lasti` 记录的位置继续执行字节码，就好像函数从未被打断过一样。

这套"冻结帧-恢复帧"的机制，物理上就是协程所需要的："在某个点暂停、保留全部上下文、之后从那个点继续"。普通函数做不到，线程能做但代价大（独立栈、内核调度），而生成器帧以极低的代价实现了"可暂停的函数"。这就是为什么生成器能演变成协程——它天然就是协程的载体。

可以亲眼看一下生成器帧的可观察特征：

```python
def demo():
    x = 1
    y = yield x      # 挂起在这里
    z = yield x + y  # 第二个挂起点
    return z

g = demo()
print(gi_frame := g.gi_frame)         # 生成器挂起前已有帧对象
# 输出：<frame at 0x...>

next(g)                                # 执行到第一个 yield，返回 1
print(g.gi_frame.f_lasti)             # 指向当前挂起的字节码指令位置
# 输出：（某个整数，如 14）

g.send(10)                            # y = 10，执行到第二个 yield，返回 11
print(g.gi_frame.f_locals)            # 局部变量被保留
# 输出：{'x': 1, 'y': 10}
```

`f_lasti` 记录了"执行到哪里"，`f_locals` 记录了"上下文是什么"。这两者在暂停期间被冻结，在恢复时被原样启用。协程的"暂停-恢复"在物理上就建立在这套帧机制之上。

### 4.2 send 如何把外部值送回挂起点：协程的输入通道

理解了帧的暂停-恢复，再来看 `send` 的底层是如何把值"送回挂起点"的。

关键在于 `yield` 在字节码上是一条 `YIELD_VALUE` 指令，而 `send`/`next` 续执行时会先让生成器帧恢复，然后把送入的值压到生成器的计算栈顶——这样 `yield` 表达式的求值结果就是这个值。

具体流程（简化）：

1. 调用 `gen.send(v)`（或 `next(gen)`，等价于 `send(None)`）；
2. CPython 把 `v` 准备好，作为生成器恢复后的"输入"；
3. 重新进入 `gen.gi_frame`，从 `f_lasti` 处继续执行；
4. 在生成器内部，`yield` 表达式的值被设为 `v`（`next` 时为 `None`）；
5. 生成器继续执行到下一个 `YIELD_VALUE`，把产出值返回给 `gen.send` 的调用方，再次冻结帧；
6. 如果生成器执行到 `return`，抛出 `StopIteration(value)`，帧销毁。

`next` 和 `send(None)` 行为完全一致——这也是"必须先预激"的根源：生成器刚创建时还没执行到任何 `YIELD_VALUE`，没有一个挂起点能接收 `send` 的值，所以第一条 `send` 必须是 `None`（即 `next`），先让生成器跑到第一个 `yield` 挂起，之后才有"挂起点"可被 send。

`value = yield produced` 这种写法，对应"先产出 `produced`（执行 `YIELD_VALUE` 把它返回），挂起；之后被 `send(v)` 唤醒时，`v` 作为 `yield` 表达式的值赋给 `value`"。一次 `send` 既送入值（成为 `value`）又取回值（下一个 `yield` 产出的东西），双向通道由此建立。

`throw` 的机制类似，区别是它不在栈顶压值，而是在生成器帧恢复后，在当前 `YIELD_VALUE` 处抛出指定异常，让生成器的 `try/except` 去接。`close` 则是抛 `GeneratorExit`，且要求生成器退出。这三者构成了"值输入-异常输入-终止信号"的完整控制指令集，使生成器帧成为一个"可被外部精细操控的状态机"，即协程。

### 4.3 yield from 委托的帧级实现：协程可嵌套组合的机制

`yield from subgen` 在字节码层面展开为一组 `GET_YIELD_FROM_ITER` + `YIELD_VALUE` 指令的组合，外加对子生成器的状态管理。可把它理解为：外层生成器进入一个"委托模式"，在这个模式里它自己不再产出值，而是做子生成器和调用方之间的"透明代理"。

委托模式的运作规则（对应 2.2.2 的语义清单）：

- 调用方 `send(v)` 到外层生成器 → 外层把它原样 `send(v)` 给子生成器当前挂起点；
- 子生成器产出值 `w` → 外层把这个 `w` `yield` 给调用方（外层不消费它）；
- 子生成器 `return r` → 抛 `StopIteration(r)` 被外层的 `yield from` 机制捕获，`r` 成为 `yield from` 表达式的值，外层恢复执行后续代码；
- 调用方 `throw(exc)` → 外层把 `exc` `throw` 给子生成器，由其处理或传播；
- 调用方 `close()` → 外层对子生成器调用 `close()`，再可能处理自己的清理。

这套转发规则由 CPython 在字节码层用一条 `YIELD_VALUE` 配合 `gi_yieldfrom` 指针实现：外层生成器的 `gi_yieldfrom` 字段指向子生成器，事件循环/调用方看到 `gi_yieldfrom` 非空时，自动把 `send`/`throw`/`close` 转发给它。这就是为什么"外层写一个 `yield from`，调用方直接和最内层通信"能成立——帧调度的转发是自动的。

`gi_yieldfrom` 这个字段是理解 `yield from` 委托的关键观察点：

```python
def inner():
    yield 1
    yield 2
    return "inner_done"

def outer():
    result = yield from inner()
    print(f"outer 拿到 inner 的返回值: {result}")

o = outer()
next(o)                          # 预激：outer 进入 yield from，委托给 inner
print(o.gi_yieldfrom)            # 非空，指向 inner 生成器对象
# 输出：<generator object inner at 0x...>

print(next(o))                   # 实际驱动的是 inner
# 输出：2

try:
    next(o)
except StopIteration:
    pass
# 输出：outer 拿到 inner 的返回值: inner_done
print(o.gi_yieldfrom)            # inner 结束后，委托指针清空
# 输出：None
```

`gi_yieldfrom` 在委托进行时指向子生成器、结束时回到 `None`，正是这套自动转发机制的可见证据。协程的"可组合"正是建立在它之上——任意层级嵌套的 `yield from`，最终都把调用方的指令逐层转发到最内层协程，并把内层的返回值逐层回送。这是 `yield from` 协程能写复杂异步逻辑的底层支柱。

### 4.4 async def 编译为 COROUTINE 标志：与 generator 的区分

Python 3.5 把 `async def` 和 `await` 加入语法后，"协程"和"生成器"在编译期就分道扬镳。一个 `async def` 函数被编译时，其代码对象上会被打上 `CO_COROUTINE` 标志（`inspect.CO_COROUTINE`）；而普通 `def` + `yield` 的代码对象打的是 `CO_GENERATOR` 标志（`inspect.CO_GENERATOR`）。调用函数时，CPython 根据这个标志创建不同类型的对象：原生协程（`coroutine`）或生成器（`generator`）。

虽然底层两者都基于"可暂停的帧"，但类型不同：

- 原生协程对象没有 `__next__` 方法，不能被 `next()` 驱动（会抛 `TypeError: object coroutine can't be used in 'await' expression` 之外的错误）；
- 原生协程没有 `send`/`throw`（这些方法虽然在对象上可见但被设为不可用）；
- `await` 只能在 `async def` 内部出现，编译器会拒绝在普通函数里用 `await`；
- 原生协程里若出现裸 `yield`（不是 `yield from`），会被标记为"异步生成器"（`async def` + `yield` = `async generator`，又是一种独立类型），而不是协程。

可以从代码对象的标志位直接观察这种区分：

```python
import inspect

def gen_func():
    yield 1

async def coro_func():
    return 1

print(gen_func.__code__.co_flags & inspect.CO_GENERATOR)   # 非 0
# 输出：32（CO_GENERATOR 标志位）

print(coro_func.__code__.co_flags & inspect.CO_COROUTINE)  # 非 0
# 输出：128（CO_COROUTINE 标志位）

print(gen_func.__code__.co_flags & inspect.CO_COROUTINE)   # 0
# 输出：0

print(coro_func.__code__.co_flags & inspect.CO_GENERATOR)  # 0
# 输出：0
```

`CO_GENERATOR`（位 32）与 `CO_COROUTINE`（位 128）互不重叠——这就是"分家"的物理证据。一个函数要么是生成器、要么是协程，编译期就已确定，运行期不可混淆。

### 4.5 await 的字节码：对应 await 表达式而非 yield

`await expr` 在字节码上不是简单的 `YIELD_VALUE`，而是 `GET_AWAITABLE` + `SEND`（Python 3.11+）或 `GET_AWAITABLE` + `YIELD_VALUE`（早期版本）的组合。其语义是：

1. `GET_AWAITABLE`：把 `await` 的对象转换为 awaitable。如果它已经是协程/Future/实现了 `__await__` 的对象，直接用；如果是个生成器（用于兼容旧式），也包装成 awaitable。
2. 对这个 awaitable 的 `__await__()` 返回的迭代器，驱动它直到完成（等价于 `yield from`，但带 awaitable 转换）。
3. 当 awaitable 表示"未就绪、需要等待"时，通过 `YIELD_VALUE` 把控制权交还给事件循环；当事件循环就绪后，用 `send` 唤醒协程继续。

也就是说，`await` 在底层依然用了"yield 暂停 + send 恢复"这套机制（这是它的生成器血脉），但它多了"awaitable 协议"这一层：只有实现了 `__await__` 的对象才能被 `await`，普通迭代器不行。这层协议把"协程暂停"和"迭代器产出"在类型层面切开，避免 `yield from` 的语义过载。

可以从字节码层面看 `await` 与 `yield` 的不同：

```python
import dis

async def with_await():
    x = await some()
    return x

def with_yield():
    x = yield
    return x

dis.dis(with_await)
# 关键指令：GET_AWAITABLE、SEND/YIELD_VALUE、RESUME 等
# 没有 GEN_START 那种纯生成器指令，而是 RESUME + GET_AWAITABLE

dis.dis(with_yield)
# 关键指令：GEN_START、YIELD_VALUE
# 路径与协程不同
```

`await` 和 `yield` / `yield from` 在字节码上各自走不同的指令序列，但它们的核心"把帧挂起、把控制权交出、之后被 send 恢复"的帧调度是一致的——协程继承了生成器的暂停-恢复内核，只是加上了 awaitable 协议和独立的类型标志。

### 4.6 事件循环调度协程与生成器 next 驱动的对应

异步协程要能并发，离不开事件循环。事件循环与协程的关系，本质上是"调用方驱动协程"的规模化——和生成器被 `next`/`send` 驱动同构。

回顾生成器协程时代的驱动模型：调用方写一个循环，对每个协程 `send` 一个值，协程 `yield` 让出，调用方再选下一个协程 `send`。这就是一个最朴素的事件循环。

```python
# 一个极简的"生成器协程事件循环"演示，揭示事件循环的本质
def task(name, steps):
    for i in range(steps):
        print(f"  [{name}] 第 {i} 步，让出")
        yield                      # 把控制权交还"循环"
    print(f"  [{name}] 完成")

def simple_loop(tasks):
    # 预激所有协程
    for t in tasks:
        next(t)
    # 轮流驱动直到全部结束
    while tasks:
        for t in list(tasks):
            try:
                next(t)            # 驱动一步
            except StopIteration:
                tasks.remove(t)

simple_loop([task("A", 2), task("B", 3)])
# 输出（交替执行）：
#   [A] 第 0 步，让出
#   [B] 第 0 步，让出
#   [A] 第 1 步，让出
#   [B] 第 1 步，让出
#   [A] 完成
#   [B] 第 2 步，让出
#   [B] 完成
```

这就是事件循环的最小内核：一个调度器轮流 `send`/`next` 一组协程，协程在 `yield` 处让出、调度器切换到下一个。真实的 `asyncio` 事件循环复杂得多（要处理 I/O 多路复用、定时器、回调、Future 就绪通知等），但内核一致：

- 协程 `await future` → 等价于在 `future` 未就绪时挂起协程，把控制权交还事件循环；
- 事件循环登记"等这个 future 就绪后，唤醒该协程"；
- Future 就绪 → 事件循环调用 `coro.send(result)`（或 `task.__step()`），协程从 `await` 处恢复；
- `coro` 执行到下一个 `await` 再挂起，循环往复；
- `coro` `return` → 事件循环收到 `StopIteration`，标记任务完成，回调其依赖者。

换句话说，`asyncio` 事件循环就是"对大量协程做 `send` 调度的调度器"，和手写一个对生成器 `next` 的调度器是同一回事，只是多了"等 I/O/定时器就绪才 send"这一层 I/O 驱动。这也是为什么生成器能演变成协程——"调度器轮流驱动可暂停函数"这个模型在生成器时代就已经成立了，`async/await` 只是把它的语法、类型、协议规范化。

**几个机制对应关系总结**：

| 概念 | 生成器协程 | 现代 async 协程 |
|------|-----------|-----------------|
| 暂停点 | `yield` / `yield from` | `await` |
| 驱动方 | 调用方 `next`/`send` | 事件循环 `task.__step` → `coro.send` |
| 唤醒输入 | `send(value)` | `future` 就绪后 `send(result)` |
| 终止 | `StopIteration` | `StopIteration`（事件循环检测） |
| 异常注入 | `throw` | 事件循环 `coro.throw`（如取消） |
| 类型标志 | `CO_GENERATOR` | `CO_COROUTINE` |
| 协议 | 迭代器协议 | awaitable 协议（`__await__`） |
| 组合 | `yield from` | `await` |

两边一一对应，差别只在类型与协议的封装。生成器协程是这条机制链的"原型"，现代协程是它的"规范化和工程化"。本篇作为生成器系列的收官，把这一脉讲透，就完成了从"生成器是迭代器"到"生成器孕育了协程"的认知闭环。

---

## 5. 总结

### 5.1 本文内容要点

- 生成器最初定位是"可暂停的迭代器"，但 `yield` 的本质是"暂停执行并交还控制权"，这天然就是协程所需的"可暂停的函数"。
- PEP 342（Python 2.5）给生成器加上 `send`/`throw`/`close`，让调用方与生成器双向通信，赋予生成器协程语义：`send` 把值送回挂起点实现输入，`throw` 在挂起点注入异常，`close` 触发终止清理。生成器从此可以被当作"可输入、可报错、可停止"的简单协程。
- PEP 380（Python 3.3）引入 `yield from`，实现生成器委托：把调用方与子生成器的所有交互（值、异常、close）和返回值自动转发，使协程可以像普通函数调用那样嵌套组合，`gi_yieldfrom` 指针在帧层提供了透明转发机制。
- Python 3.4 的 `asyncio` 用 `@asyncio.coroutine` + `yield from` 写出第一套官方异步协程，把"协程的等待-恢复"建模为"生成器的挂起-恢复"，事件循环通过 `send` 驱动协程。
- Python 3.5 的 PEP 492 引入 `async def`/`await`，协程与生成器正式分家：`CO_COROUTINE` 标志与 `CO_GENERATOR` 标志在编译期区分，`await` 走 `GET_AWAITABLE` + `SEND/YIELD_VALUE` 指令序列，基于 awaitable 协议而非迭代器协议。
- 生成器能演变成协程的根本原因：帧的"冻结-恢复"机制物理上就是"可暂停的函数"，加上 `send` 的双向通信与 `yield from` 的可组合性，构成了协程的暂停-恢复-消息-组合四要素。
- 现代 Python 的分工：生成器做迭代（产数据、惰性序列、数据管道），协程做并发（异步 I/O、事件循环调度），两者共享"暂停-恢复"内核但用途分道扬镳。

### 5.2 读完本文你应能掌握

- 说清 `yield` 的两种视角（迭代器视角的"产出"与协程视角的"暂停并接收"），并能解释为什么同一个 `yield` 能支撑这两种用法。
- 正确使用 `send`/`throw`/`close` 驱动协程式生成器，理解预激的必要性，并能用一个 `send` 双向通信的协程式状态机解决"有状态的对话式处理"问题。
- 用 `yield from` 实现协程委托与迭代委托，说清它对 `send`/`throw`/`close`/返回值的转发语义，并解释 `gi_yieldfrom` 在帧层的作用。
- 对照写出"早期 `yield from` 协程"与"现代 `async/await` 协程"的等价代码，说清两者在语义、类型、字节码上的区别与联系。
- 给出"生成器帧的冻结-恢复为何可复用为协程调度"的原理解释：包含 `gi_frame`/`f_lasti`/`f_locals` 的作用、`send` 如何把值压回挂起点、`CO_COROUTINE` 与 `CO_GENERATOR` 的标志区分、`await` 的 `GET_AWAITABLE`+`YIELD_VALUE` 指令、以及事件循环 `send` 驱动与生成器 `next` 驱动的同构对应。
- 在新代码中正确取舍：异步并发用 `async/await`、惰性迭代用生成器、迭代委托用 `yield from`；避免用生成器写协程、避免在协程里做同步阻塞调用、避免忘记预激生成器协程。
- 把本篇与本系列前面的"生成器基础""yield 表达式""yield from 委托""生成器原理"等篇贯通，形成"生成器从迭代器延伸到协程、协程最终分家独立"的完整认知闭环。