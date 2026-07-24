---
group:
  title: 【17】生成器与迭代器
  order: 17
order: 4
title: 生成器 send 方法
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是生成器的 send 方法

在前面几篇笔记中，我们已经知道生成器是一种"边迭代边产出"的惰性序列：用 `yield` 吐出一个值，调 `next(gen)` 再吐下一个，周而复始。但这个方向始终是单向的——生成器只负责"产"，调用者只能"取"。

`send` 方法打破了这个单向限制。它是生成器对象上除 `next` 之外另一个用来恢复执行的方法，签名是：

```
gen.send(value)
```

`next(gen)` 与 `gen.send(value)` 做的第一件事相同：把挂起在 `yield` 处的生成器唤醒，让它继续往下执行。区别在于送回去的东西不同：

- `next(gen)` 等价于 `gen.send(None)`，不向生成器内部传任何业务值。
- `gen.send(value)` 在唤醒生成器的同时，会把 `value` 作为挂起处那条 `yield` 表达式的"结果"送回生成器内部。

换句话说，`yield` 不只是"产出值"的关键字，它本身还是一个**表达式**，能接住外部 `send` 进来的值。`send` 让生成器从"只产出"升级为"可双向通信"：每次 `yield` 既向调用方吐出一个值，又能在下一次被唤醒时接收调用方送回的一个新值。

理解 `send` 之后，生成器就不再只是一个惰性序列，而是一个可以带状态、能和调用方反复交互的"协程雏形"。本篇会先把 `send` 的语法、语义、典型用法讲透，最后在原理章拆解它在帧层面的运作方式，并简提 `throw` / `close` 这两个相关方法，为后面协程篇打基础。

### 1.2 基础语法与最小用法

最小能体现 `send` 双向通信的例子是这样的：

```python
def echo():
    while True:
        received = yield        # yield 作为表达式，接住 send 进来的值
        print("收到:", received)

gen = echo()
next(gen)                       # 预热：必须先 next 到第一个 yield 处挂起
gen.send("hello")               # 唤醒并把 "hello" 送回，赋给 received
gen.send(123)                   # 再送一个值
gen.send([1, 2, 3])             # 什么类型的值都能送
```

运行结果：

```
# 输出：
# 收到: hello
# 收到: 123
# 收到: [1, 2, 3]
```

这里有几个第一次接触 `send` 时必须记住的点：

1. **`yield` 是表达式**。`received = yield` 这一行把 `yield` 当表达式用，骨子里和 `received = (yield)` 等价，只不过括号可省。
2. **首次必须用 `next(gen)` 或 `gen.send(None)` 启动**。因为生成器刚创建时还没执行到任何 `yield`，"无处接收"传入的值；此时第一个 `yield` 还没发生，给它 `send` 一个非 `None` 的值会直接抛 `TypeError`。
3. **`send` 会推动生成器执行到下一个 `yield`**，并返回那个 `yield` 产出的值；如果没有下一个 `yield` 了（生成器结束），则抛 `StopIteration`。

再来看一个能同时体现"产出"和"接收"两条数据流的版本，作为后续所有例子的语义模型：

```python
def model():
    received = yield "第一次产出"      # 在这里挂起
    print("  生成器内收到:", received)
    received = yield "第二次产出"      # 第二次挂起
    print("  生成器内收到:", received)
    yield "第三次产出"                  # 第三次挂起

gen = model()
print("调用方取到:", next(gen))                 # 启动，取到第一个 yield 的产出
print("调用方取到:", gen.send("值A"))           # 送 "值A" 进去，取到第二个 yield 的产出
print("调用方取到:", gen.send("值B"))           # 送 "值B" 进去，取到第三个 yield 的产出
print("调用方取到:", gen.send("值C"))           # 送 "值C"，但后面没有 yield 了 -> StopIteration
```

运行结果：

```
# 输出：
# 调用方取到: 第一次产出
#   生成器内收到: 值A
# 调用方取到: 第二次产出
#   生成器内收到: 值B
# 调用方取到: 第三次产出
# Traceback (most recent call last):
#   ...
# StopIteration
```

把这个例子看懂，`send` 的全部核心语义就掌握了：`yield` 一句话同时干两件事——向调用方产出值、为下一次 `send` 预留一个接收入口。两个方向的数据流通过同一个 `yield` 点交织在一起。

## 2. 核心内容

### 2.1 send 方法的签名与语义

完整签名：

```
gen.send(value)
```

- `value`：要送回生成器内部的值，作为当前挂起处 `yield` 表达式的结果。可以是任意类型的 Python 对象，包括 `None`。
- 返回值：生成器继续执行到下一个 `yield` 时，该 `yield` 产出的值；若生成器正常结束（执行到 `return` 或函数末尾），则抛 `StopIteration`（如果函数有 `return value`，该值存在 `StopIteration.value` 里）。
- 特殊规则：生成器处于"刚创建、尚未启动"状态时，调用 `gen.send(value)` 且 `value` 不是 `None`，会抛 `TypeError: can't send non-None value to a just-started generator`。

`send` 与 `next` 的关系非常清晰，一句话可以概括：

> `next(gen)` 等价于 `gen.send(None)`，都是"给生成器一个不带业务值的信号，让它往下走，直到下一个 `yield`，返回产出值"。

记住这条等价关系，后面很多行为都能直接推出来。比如，任何可以用 `next` 启动的生成器，也可以用 `gen.send(None)` 启动；反过来，如果你只是想"继续走一步、不要送业务值"，用 `send(None)` 和 `next` 完全一样。

`yield` 在表达式语境下的完整写法有两种常见形态：

```python
result = yield value          # 产出 value，挂起；下次被 send 唤醒，result 接住送来的值
received = yield              # 等价于 received = (yield None)，产出 None，挂起，接住送来的值
```

第二种 `yield` 不写产出值时，对外吐出的就是 `None`。这条容易被忽略：`gen.send(x)` 的返回值取决于生成器内部下一个 `yield` 写了什么，如果写的是裸 `yield`，返回的就是 `None`，而不是你 `send` 进去的 `x`。`send` 进去的值和 `send` 拿回来的值是两回事——前者走"入流"，后者走"出流"。

下面这个例子用来验证这两条流是否真的独立：

```python
def two_streams():
    incoming = yield "出流-A"
    print("  入流收到:", incoming)
    incoming = yield "出流-B"
    print("  入流收到:", incoming)

gen = two_streams()
out1 = next(gen)                      # 出流：拿到 "出流-A"；此时入流无人接收
out2 = gen.send("入流-1")             # 入流送 "入流-1"，出流拿到 "出流-B"
out3 = gen.send("入流-2")             # 入流送 "入流-2"，生成器结束 -> StopIteration
print("出流结果:", out1, out2)
```

运行结果：

```
# 输出：
#   入流收到: 入流-1
#   入流收到: 入流-2
# 出流结果: 出流-A 出流-B
```

可以看到：`out1`、`out2` 是从生成器里 `yield` 出来的字符串（出流），而 `gen.send("入流-1")` 送进去的 `"入流-1"` 被生成器内部的 `incoming` 接住（入流），并被打印出来。两条流各自独立，只是共用同一个 `yield` 挂起点。

### 2.2 yield 作为表达式：received = yield x

很多人初学 `yield` 时记得的是"产出值"，把它当成带返回值的 `return` 来用，像 `yield x` 这样写在最后。但只要 `send` 登场，`yield` 就必须被理解为**表达式**，它有一个"值"，这个值由下一次 `send` 提供。

四种典型写法对比：

```python
# 写法一：只产出，不接收（纯产出，用 next 驱动就够）
yield x

# 写法二：既产出又接收（最常见，send 场景的主力）
result = yield x

# 写法三：只接收不产出（send 返回 None，但仍在挂起）
received = yield

# 写法四：孤立 yield 表达式（等价写法三，产出 None）
yield
```

关键提醒：写法一里那个 `yield x`，从语法上它也是一个表达式，只是"它的值被丢弃了"。如果你用 `send` 来驱动写法一这种生成器，送进去的值会被无声无息地扔掉，不会触发任何效果。`yield` 能否接收值不取决于你写没写 `= yield`，而是取决于你有没有用一个变量去接住它。`send` 总是会把值"塞"给挂起处的 `yield` 表达式，至于这个值去哪（被变量接收 / 被丢弃），由生成器内部代码决定。

下面这个 demo 把四种写法放在一起，用 `send` 驱动，观察入流和出流：

```python
def show_yield_forms():
    yield "A"                       # 写法一：只产出，send 的值被丢弃
    r = yield "B"                   # 写法二：产出 B，接住下一个 send 的值
    print("  B 处收到:", r)
    r = yield                       # 写法三：产出 None，接住下一个 send 的值
    print("  C 处收到:", r)

gen = show_yield_forms()
print("取:", next(gen))             # 启动 -> 取 "A"
print("取:", gen.send("将被丢弃"))  # 送的值无人接收 -> 取 "B"
print("取:", gen.send("值B"))       # B 处接住 "值B" -> 取 None
print("取:", gen.send("值C"))       # C 处接住 "值C" -> 生成器结束 -> StopIteration
```

运行结果：

```
# 输出：
# 取: A
# 取: B
#   B 处收到: 值B
# 取: None
#   C 处收到: 值C
# Traceback (most recent call last):
#   ...
# StopIteration
```

两次"丢弃"或"None"现象值得注意：

- 第一次 `send("将被丢弃")`：那句话对应的 `yield` 是写法一的 `yield "A"`，没有变量接它，值被丢弃，完全不影响后续。
- `gen.send("值B")` 返回 `None`：因为下一个 `yield` 是写法三的裸 `yield`，对外产出为 `None`，与入流的 `"值B"` 无关。

### 2.3 send 的返回值与 StopIteration

`gen.send(value)` 的返回值就是生成器继续执行后碰到的下一个 `yield` 表达式产出的那个值。如果走到底没有下一个 `yield`，就抛 `StopIteration`。

这一点和 `next` 完全一致：`next` 也是"走到下一个 `yield` 返回产出值，走完则 `StopIteration`"。`send` 只是多塞了一个入流值而已。

`StopIteration` 还能携带"最终返回值"——当生成器函数通过 `return value` 显式结束时，这个 `value` 会挂在异常对象的 `.value` 属性上，可以用来把最后一次的"汇总结果"传给调用方，常用于累加器、聚合器这类场景。

```python
def summer():
    total = 0
    while True:
        x = yield total             # 每次把当前累计 total 产出，并接住下一个 send 进来的数
        if x is None:
            return total            # 收到 None 作为结束信号，最终汇总值由 StopIteration.value 带出
        total += x

gen = summer()
print(gen.send(None))               # 启动，取到初始 total=0
print(gen.send(10))                 # 送 10 进去：total=10，产出 10
print(gen.send(20))                 # 送 20 进去：total=30，产出 30
print(gen.send(5))                  # 送 5 进去：total=35，产出 35
try:
    gen.send(None)                  # 送 None 当结束信号
except StopIteration as e:
    print("最终累计:", e.value)     # 从 StopIteration.value 取最终结果
```

运行结果：

```
# 输出：
# 0
# 10
# 30
# 35
# 最终累计: 35
```

这是一个非常实用的模式：中间每次 `send` 返回当前累计值（便于调用方实时观察进度），最终再用 `send(None)` 触发结束，并通过 `StopIteration.value` 把"一次性最终结果"取出来。把"中间态"和"终态"分别用不同机制传出，是生成器写聚合逻辑时很自然的做法。

### 2.4 场景一：累加器 accumulator

累加器是 `send` 最经典的入门例子，它完美展现了"每次送一个值，生成器内部维护状态、给出最新累计"的双向通信模式。

```python
def accumulator():
    total = 0
    while True:
        value = yield total        # 产出当前 total，并接住下一个 send 进来的增量
        total += value

acc = accumulator()
print(next(acc))                   # 启动并取初始累计值 0
print(acc.send(1))                 # 累加 1 -> 1
print(acc.send(2))                 # 累加 2 -> 3
print(acc.send(10))                # 累加 10 -> 13
print(acc.send(100))               # 累加 100 -> 113
```

运行结果：

```
# 输出：
# 0
# 1
# 3
# 13
# 113
```

这个例子把 `send` 的价值体现得最直接：

- 如果只用 `next`，生成器内部状态（`total`）只能按写死的方式变化，调用方无法影响它。
- 有了 `send`，调用方每次"喂"一个增量进去，`total` 被外部输入驱动着变，状态却始终由生成器自己保管，调用方不需要也不应该去碰这个变量。

这正是协程式的编程模型——生成器像一个小服务进程，调用方像客户端，双方通过 `yield`/`send` 来回"传消息"。

稍微变体一下，把"送 None 表示结束、最终结果用 StopIteration 带出"加进来，就是一个实用的小工具：

```python
def accumulator_final():
    total = 0
    while True:
        value = yield total
        if value is None:
            break                  # 退出循环，函数结束 -> 抛 StopIteration
        total += value
    return total                   # 放到 StopIteration.value 里带出

acc = accumulator_final()
acc.send(None)                     # 启动，返回 0
acc.send(1)
acc.send(2)
acc.send(10)
try:
    acc.send(None)                 # 结束信号
except StopIteration as e:
    print("累计:", e.value)        # 取最终累计
```

运行结果：

```
# 输出：
# 累计: 13
```

### 2.5 场景二：echo 协程回显

echo（回显）协程做的事很简单：收到什么就打印什么。它几乎不产出有意义的值（`yield` 对外吐 `None`），主要是用来演示"入流"这一侧——`send` 把外部输入一路送到生成器内部。

```python
def echo():
    while True:
        received = yield          # 不产出业务值，只接住 send 的输入
        if received is None:
            break
        print(f"[echo] {received}")

e = echo()
next(e)                           # 启动到第一个 yield
e.send("ping")
e.send("pong")
e.send("hello generator")
e.send(None)                      # 结束信号
```

运行结果：

```
# 输出：
# [echo] ping
# [echo] pong
# [echo] hello generator
```

echo 协程的意义在于：它不再把生成器当作"序列"来用，而是当作一个"持续等待输入、对每次输入做出反应"的小服务。这种视角的转变是理解协程的起点。注意它 `yield` 不带产出值，对外返回 `None`，所以调用方一般不关心 `send` 的返回值，只关心"把值送进去会触发什么副作用"。

把 echo 协程再扩展一点，让它对接收到的数据做处理（如转换为大写、加时间戳）就变成一个朴素的"数据处理管道"：

```python
def upper_filter():
    while True:
        received = yield
        if received is None:
            break
        print("过滤后:", received.upper())

f = upper_filter()
next(f)
f.send("hello")
f.send("world")
f.send(None)
```

运行结果：

```
# 输出：
# 过滤后: HELLO
# 过滤后: WORLD
```

### 2.6 场景三：移动平均器

如果每次 `send` 送进来一个数据点，生成器内部维护"到目前为止的平均值"，对外返回当前平均，这就是一个移动平均器。它比累加器更能体现"生成器 = 有状态的数据处理器"这一抽象。

```python
def moving_average():
    count = 0
    total = 0.0
    average = 0.0
    while True:
        value = yield average   # 对外返回当前平均，接住下一个数据点
        if value is None:
            break
        count += 1
        total += value
        average = total / count
    return average              # 最终平均作为 StopIteration.value 带出

ma = moving_average()
print(ma.send(None))            # 启动，返回初始平均 0.0
print(ma.send(10))              # 平均 10.0
print(ma.send(20))              # 平均 15.0
print(ma.send(30))              # 平均 20.0
print(ma.send(40))              # 平均 25.0
try:
    ma.send(None)
except StopIteration as e:
    print("最终平均:", e.value)
```

运行结果：

```
# 输出：
# 0.0
# 10.0
# 15.0
# 20.0
# 25.0
# 最终平均: 25.0
```

这个例子把 `send` 的双向通信用得很充分：

- 出流：每次 `yield average` 把"当前平均"交给调用方，调用方无需自己算。
- 入流：调用方 `send` 一个新数据点，进入生成器内部，参与 `total` / `count` 的更新。
- 结束语义：`send(None)` 触发 `break`，最后的平均值通过 `return` + `StopIteration.value` 传回。

把数据流的"中间态"和"终态"分清楚，是写这类协程的关键。

### 2.7 场景四：状态机式生成器

`send` 让生成器可以保留状态、根据外部输入决定下一步动作，这天然适合做"状态机"。下面这个例子用生成器写一个朴素的红绿灯状态机：每次 `send` 一个"tick"信号，状态在红、绿、黄之间循环；`send("reset")` 重置回红；`send(None)` 退出。

```python
def traffic_light():
    states = ["红", "绿", "黄"]
    idx = 0
    while True:
        current = states[idx]
        action = yield current          # 对外返回当前灯色，接住下一个动作
        if action is None:
            break
        if action == "reset":
            idx = 0
        elif action == "tick":
            idx = (idx + 1) % len(states)

tl = traffic_light()
print(tl.send(None))                    # 启动：红
print(tl.send("tick"))                  # 红 -> 绿
print(tl.send("tick"))                  # 绿 -> 黄
print(tl.send("tick"))                  # 黄 -> 红
print(tl.send("tick"))                  # 红 -> 绿
print(tl.send("reset"))                 # 重置：红
print(tl.send("tick"))                  # 红 -> 绿
tl.send(None)                           # 结束
```

运行结果：

```
# 输出：
# 红
# 绿
# 黄
# 红
# 绿
# 红
# 绿
```

这个状态机的"状态"就藏在 `idx` 里，由生成器自己保管，调用方只发"动作"指令，不用也不需要知道当前状态，状态机和调用方之间通过 `yield` 上的两个方向交换信息：出流给状态，入流给动作。

### 2.8 send 与 next 的关系对照

把 `send` 和 `next` 放一起做一次系统对照，便于彻底分清两者：

| 维度 | `next(gen)` | `gen.send(value)` |
|---|---|---|
| 是否唤醒生成器 | 是 | 是 |
| 是否带业务入流 | 否 | 是（`value` 作为挂起处 `yield` 表达式的结果） |
| 返回值 | 下一个 `yield` 的产出值 | 下一个 `yield` 的产出值 |
| 生成器结束时 | 抛 `StopIteration` | 抛 `StopIteration` |
| 首次启动是否允许 | 允许 | 仅当 `value is None` 时允许；非 None 抛 `TypeError` |
| 等价关系 | `next(gen)` ≡ `gen.send(None)` | 用 `None` 调用时与 `next` 完全一致 |

一个直观的小测试：把同一个生成器，一半用 `next`、一半用 `send(None)` 交替驱动，行为应该完全一致。

```python
def seq():
    x = 0
    while True:
        x += 1
        received = yield x          # 产出递增的 x，并接住下一个 send 的值

g = seq()
print(next(g))                      # 1
print(g.send(None))                 # 2（等价 next）
print(g.send(None))                 # 3（等价 next）
print(next(g))                      # 4（next 和 send(None) 自由混用）
print(g.send(None))                 # 5
```

运行结果：

```
# 输出：
# 1
# 2
# 3
# 4
# 5
```

混用 `next` 与 `send(None)` 没有任何问题，因为它们本质是同一个操作。只要 `send` 带——

啊，注意：一且 `send` 带了非 None 的值，前提是生成器已经处于"挂起在某个 `yield` 处"的状态，否则就会触发前面多次提到的 `TypeError`。

### 2.9 首次启动生成器的正确姿势

第一次启动生成器（把它从"刚创建"状态推到"挂起在第一个 `yield` 处"状态）有两种等价写法：

```python
gen = some_generator()

# 写法一：next
next(gen)

# 写法二：send(None)
gen.send(None)
```

两种写法的效果完全一样：生成器从头开始执行，到第一个 `yield` 处挂起，`next`/`send(None)` 的返回值是该 `yield` 产出的值。

为什么第一次只能传 `None`？因为此时生成器还没有"挂起的 `yield` 表达式"可以接收值——第一条 `yield` 还没执行到。`send` 的语义是"把 value 作为挂起处的 `yield` 表达式的结果送回生成器内部"，而启动时根本不存在"挂起处"，所以非 None 的值无处可去，Python 直接拒绝，抛出：

```
TypeError: can't send non-None value to a just-started generator
```

把首次启动和后续驱动区分开，是写 `send` 协程代码时最容易踩的第一个坑。可用一个小小的"预热"习惯来避免：拿到生成器先 `next(gen)` 一下，再进入正常的 `send` 循环。这一点在原理章会从帧执行的角度详细解释其必然性。

### 2.10 throw 与 close 方法（简提）

`send`、`throw`、`close` 是生成器作为"协程"时常常配套使用的三个方法，本篇只做简要介绍，深入留到协程篇。

- `gen.throw(exc_type, exc_value=None, tb=None)`：在生成器当前挂起的 `yield` 处抛出一个异常，生成器内部可以选择 `try/except` 捕获、处理后继续 `yield`，也可以让异常传播出去从而结束生成器。这是"向生成器发异常"的唯一通道，常用于通知协程"出错了，请你处理"。
- `gen.close()`：在挂起的 `yield` 处抛出 `GeneratorExit`，用于强制关闭生成器。生成器内部可以捕获 `GeneratorExit` 做清理，但不应再次 `yield`（否则会抛 `RuntimeError`）。`close` 通常由垃圾回收或显式清理触发。

这三个方法共同构成"调用方与生成器之间的控制信号"：`send` 传值、`throw` 传异常、`close` 传"终止"意图。理解它们就理解了 Python 早期"基于生成器的协程"的全部控制接口，也为后面用 `async`/`await` 写原生协程打下基础。

## 3. 最佳实践

**预热启动是铁律**

任何要靠 `send` 双向通信的生成器，第一件事必须是 `next(gen)` 或 `gen.send(None)` 预热。不要图省事直接对刚创建的生成器调 `gen.send(value)`，否则必然抛 `TypeError`。推荐写一个统一的小封装：

```python
def primed(gen):
    next(gen)          # 预热到第一个 yield
    return gen

# 推荐
acc = primed(accumulator())
acc.send(1)

# 不推荐：直接 send 非 None 启动，必报错
acc2 = accumulator()
acc2.send(1)           # TypeError
```

**结束信号要约定清楚**

用 `send(None)` 作为"结束信号"是一个常见的约定，但要注意：你的生成器内部必须显式检查并处理这个 `None`，否则 `None` 会被当成数据点参与运算（如累加 `None` 会抛 `TypeError`）。另一种更明确的结束方式是 `gen.close()`。不要让"结束"这件事悄悄发生——一定要在协议里写清楚哪个值表示结束。

```python
# 推荐：显式检查结束信号
def safe_accumulator():
    total = 0
    while True:
        value = yield total
        if value is None:          # 明确处理结束
            break
        if not isinstance(value, (int, float)):
            raise TypeError(f"不支持的类型: {type(value)}")
        total += value
    return total

# 不推荐：不检查 None，直接参与运算，调用方误送 None 会出错
def unsafe_accumulator():
    total = 0
    while True:
        value = yield total
        total += value             # value 是 None 时直接 TypeError，错误信息不友好
```

**入流与出流不要混为一谈**

一个常见误解是"`gen.send(x)` 返回的就是 `x`"。不是。`send` 送进去的值走"入流"，被挂起处的 `yield` 表达式接住；`send` 的返回值走"出流"，来自下一个 `yield` 产出的值。两条流由两个不同的 `yield`（甚至同一个 `yield` 的两个不同阶段）分别负责，千万不要在脑子里把它们当成同一个值。

写生成器协程时，建议为入流变量和出流值起不同的名字，让代码自解释：

```python
# 推荐：命名清晰，入流/出流分得开
def moving_average():
    total = 0.0
    count = 0
    average = 0.0
    while True:
        new_sample = yield average      # 出流：average；入流：new_sample
        if new_sample is None:
            break
        total += new_sample
        count += 1
        average = total / count
    return average
```

**`send` 场景慎用"只产出不接收"的 yield**

如果你的生成器本质上要和调用方双向通信（即要用 `send` 驱动），那么 `yield` 最好写成 `received = yield value` 的形式，即使暂时不使用 `received`，至少语义上保留了入流入口，方便后续扩展。反过来，如果你的生成器只是纯序列（只用 `next` 驱动），就不要写 `received = yield` 这种假装要接收值的写法，徒增阅读负担。

**不要过度依赖 `StopIteration.value` 传最终结果**

通过 `return` + `StopIteration.value` 把最终结果传出来是一个有效模式，但它依赖异常机制来传值，调用方必须用 `try/except StopIteration` 接住，可读性比不上正常的返回值。如果最终结果很重要，考虑用更显式的方式（比如通过共享变量、对象属性、或生成器外部维护一个状态对象），把"正常返回"和"迭代结束"分开。不要让"函数的最终结果"这种核心信息埋在异常对象里，导致调用链难以追踪。

**send 之外的控制方法要配套使用**

在协程式代码里，`send` 往往不是孤立使用的。当调用方需要告诉生成器"出错了"，用 `throw`；需要强制终止，用 `close`。这三者构成了对协程的完整控制接口。当你开始用 `send` 写复杂协程时，记得配套处理 `throw`/`close`（比如用 `try/finally` 做清理），否则协程在被异常关闭时可能留下未释放的资源。

```python
def robust_coro():
    try:
        while True:
            value = yield
            # 处理 value
            print("处理:", value)
    finally:
        print("清理资源")         # 无论正常结束、被 close、还是被 throw，都会执行

g = robust_coro()
next(g)
g.send("a")
g.send("b")
g.close()                         # 触发 GeneratorExit -> 进入 finally
```

运行结果：

```
# 输出：
# 处理: a
# 处理: b
# 清理资源
```

**用装饰器自动预热**

如果你写了大量需要 `send` 的生成器协程，可以用一个装饰器自动完成"创建并预热"的两步，省去每次手动 `next`：

```python
def primed_gen(func):
    def wrapper(*args, **kwargs):
        gen = func(*args, **kwargs)
        next(gen)                 # 自动预热
        return gen
    return wrapper

@primed_gen
def accumulator():
    total = 0
    while True:
        value = yield total
        if value is None:
            break
        total += value
    return total

acc = accumulator()                # 已经预热，可直接 send
print(acc.send(1))                 # 不需要先 next
print(acc.send(2))
```

运行结果：

```
# 输出：
# 1
# 3
```

这种"预热的生成器"在早期协程库（如 `asyncio` 的 `@coroutine`）里是标配，它把"启动协程"这件事从调用方挪到构造阶段，让协程的使用更接近普通函数。

## 4. 原理

### 4.1 生成器帧的挂起与恢复

要真正理解 `send`，必须从生成器的执行帧入手。普通函数调用时，Python 会为它创建一个栈帧（frame），函数执行完返回时帧被销毁。生成器函数不同：调用 `some_gen()` 不会执行函数体，而是创建一个生成器对象，该对象内部保留着对应函数的帧、局部变量、指令指针（`f_lasti`），但帧处于"未启动"状态。

当 `next(gen)` 或 `gen.send(None)` 第一次唤醒生成器时：

1. 字节码解释器取出生成器保存的帧，恢复执行。
2. 函数体从第一条指令开始执行，直到碰到 `YIELD_VALUE` 字节码（`yield` 对应的指令）。
3. 执行到 `YIELD_VALUE` 时，当前栈顶的值（`yield` 表达式中要产出的那个值，即 `yield x` 的 `x`）被作为"本次唤醒的返回值"交给调用方。
4. 生成器帧的指令指针停在 `YIELD_VALUE` 处，帧连同局部变量、执行位置一并保留在生成器对象里，函数"挂起"。

关键在于：挂起时帧并没有销毁，所有局部变量、执行现场原封不动留着。再次唤醒时直接从挂起处继续，这就是生成器能"边走边停"的根本原因。

### 4.2 send(value) 怎样把值送回挂起处

现在看 `gen.send(value)` 在恢复执行时多做了什么。先固定一个心智模型：

> `yield` 是一个**表达式**，它在运行到 `YIELD_VALUE` 时把要产出的值交出去；当生成器被 `send`/`next` 再次唤醒时，`YIELD_VALUE` 之后的"恢复指令"会决定 `yield` 作为表达式的值是什么。

在 CPython 的实现里，唤醒生成器时执行的字节码序列大致是：

1. 调用方调用 `gen.send(value)`，运行时系统检查生成器状态。
2. 如果生成器未启动且 `value` 不是 `None`，直接抛 `TypeError`（"无处接收"的根因，下一节详述）。
3. 否则，把 `value` 放在生成器帧的栈顶（或对应的"恢复值"槽位），把帧交回字节码解释器。
4. 解释器从上次挂起的 `YIELD_VALUE` 下一条指令继续执行，其后的代码（通常是 `result = ...` 的赋值）会把栈顶那个 `value` 当作 `yield` 表达式的结果取走。
5. 函数继续执行到下一个 `YIELD_VALUE`，再次挂起并把新产出值交给调用方，作为 `gen.send(value)` 的返回值。
6. 如果一路执行到 `return` 或函数末尾，没有再碰到 `YIELD_VALUE`，就抛 `StopIteration`，`return` 的值挂在 `StopIteration.value` 上。

简单说，`send` 的工作分两步：**第一步先把传入的 `value` "塞"到挂起的 `yield` 表达式的结果位置上，第二步才恢复执行**。所以当 `yield` 被 `result = yield x` 这样的赋值接住时，`result` 拿到的正是 `send` 送来的 `value`。如果生成器里写的是裸 `yield x`（没有变量接住），那这个 `value` 已经放在了表达式结果位置，但没人取走，直接被丢弃。

这一机制决定了 `send` 和 `next` 的字节码层是同源的：

- `next(gen)` 在 C 层等价于把 `value=None` 传给生成器的恢复流程，再取回下一次 `YIELD_VALUE` 的产出。
- `gen.send(value)` 走的是同一条恢复路径，只是 `value` 不必是 `None`。

从 CPython 3.11 开始，普通 `for` 循环和生成器之间专门用 `GEN_START`、`SEND`、`GET_YIELD_FROM_ITER` 等字段码来处理生成器的启动/发送/委托，`yield` 的双向语义在字节码层有专门指令承载，这也是为什么 `next` 与 `send(None)` 在行为上完全一致——它们最终调用的都是生成器内部的"恢复并取下一个产出"那套逻辑。

### 4.3 为什么首次 send 非 None 会报 TypeError

`TypeError: can't send non-None value to a just-started generator` 是 `send` 最经典的报错。从帧执行的角度看它一点也不神秘：

- 生成器**刚创建时还没执行过任何 `YIELD_VALUE`**，根本不存在"挂起的 `yield` 表达式"。
- `send(value)` 的语义是"在挂起处的 `yield` 表达式位置塞入 `value`"，而启动瞬间没有这样的挂起位置，"无处可塞"。
- 因此 CPython 在 `gen.send(value)` 入口处做了一个显式检查：如果生成器处于"未启动"状态且 `value is not None`，立刻抛 `TypeError`，拒绝执行。

为什么 `value is None` 时允许？因为 `None` 被约定为"不带业务值的纯恢复信号"，发送 `None` 与 `next` 等价，只要把生成器从第一条指令开始执行即可，不需要塞给任何挂起的 `yield`。这和"有挂起的 `yield`、但调用方选择不带值"是两种不同情形，却共用 `None` 这个信号值——对未启动生成器，`None` 自然而然地被当作"开始执行"的信号；对已挂起的生成器，`None` 则被当作"不传业务值"的信号。

记住这个等价链：

```
未启动生成器 + send(None) ≡ 未启动生成器 + next() ≡ 启动并执行到第一个 yield
未启动生成器 + send(非 None) ≡ TypeError
已挂起生成器 + send(value) ≡ 把 value 塞入挂起点，继续执行到下一个 yield
已挂起生成器 + next() ≡ send(None)，value 为 None
```

### 4.4 双向通信的状态机本质

把前面所有细节合在一起，`send` 驱动下的生成器其实就是一台显式状态机：

- **状态**：生成器帧里保留的全部局部变量 + 指令指针（停在哪个 `yield`）。每次 `yield` 挂起，状态被冻结；每次 `send`/`next` 唤醒，状态被解冻继续。
- **转移**：每次 `send(value)` 触发一次状态转移——把 `value` 作为输入注入当前挂起处，状态机执行到下一个 `yield` 或结束，期间局部变量按代码逻辑更新。
- **观察**：转移过程中"对外吐出"的那个值（下一个 `yield` 产出的值）就是状态机的"输出"。
- **终止**：没有下一个 `yield` 时，状态机进入终态，抛 `StopIteration`，可携带最终输出（`return` 的值）。

从这个角度看，`send` 之所以能让生成器从"只产出"变成"可双向通信"，本质上是因为它把"输入"这条通道接进了状态机的转移过程。普通 `next` 只给状态机一个"走一步"的无参信号；`send` 则给了一个带参信号，状态机在转移时能拿到这个参数、据此决定下一步怎么走。

这也是生成器被视为"协程雏形"的原因：协程正是"能被外部反复驱动、每次接收一个输入并做出反应、内部保留状态"的执行单元。`send` 提供了"接收输入"的入口，`yield` 提供了"产出 + 挂起"的出口，`throw`/`close` 提供了"异常 + 终止"的控制信号，四者合起来就是一套完整的协程控制接口。Python 早期的 `@asyncio.coroutine` + `yield from` 协程，正是直接建立在 `send` 这套机制上的；后来的 `async`/`await` 原生协程虽然在语法上换了皮，底层事件循环驱动协程的方式依然保留了 `send` 式的双向通信理念。关于协程的完整关系，留到第 08 篇展开。

### 4.5 send 与 yield from 的关系（补充）

`yield from` 是 Python 3.3 引入的语法，用于把一个生成器的产出/输入"原样转发"给外层生成器，它是 `send` 双向通信在"委托"场景下的标准化形式。理解 `yield from` 对深入 `send` 也有帮助。

```python
def inner():
    r = yield "内层产出"
    print("内层收到:", r)
    yield "内层再产出"

def outer():
    result = yield from inner()      # 委托给 inner()，内外双向透明转发
    print("内层最终值:", result)

g = outer()
print(next(g))                       # 驱动 outer -> 透传到 inner -> "内层产出"
print(g.send("外层送的值"))          # 透传给 inner 的 yield，取 "内层再产出"
g.close()                            # 结束
```

运行结果：

```
# 输出：
# 内层产出
# 内层收到: 外层送的值
# 内层再产出
```

`yield from` 在背后做的事情，正是把外层调用方的 `send` 透明地转发给内层生成器：外层 `send` 的值直接进入内层挂起的 `yield`，内层产出的值又直接作为外层 `send` 的返回值。这就把"双向通信"扩展到了"跨生成器双向通信"，是协程链式调用的技术基础。

把 `send`、`yield` 表达式、`yield from`、`throw`/`close` 这几样放在一起，你就掌握了生成器作为协程的全部语言层接口，剩下的只是如何组织状态、如何与事件循环配合的问题——这正是协程篇要讲的内容。

## 5. 总结

- `gen.send(value)` 是生成器除 `next` 之外另一个恢复执行的方法，它把 `value` 作为当前挂起处 `yield` 表达式的结果送回生成器内部，并返回下一个 `yield` 产出的值。
- `yield` 是表达式，`received = yield x` 是"既产出 `x`、又接住下一次 `send` 的值"的标准写法；入流（`send` 进去）与出流（`yield` 出来）是两条独立的通道，不要混淆。
- 首次启动生成器必须用 `next(gen)` 或 `gen.send(None)`，不能用 `gen.send(非 None)`，否则抛 `TypeError`，根因是未启动的生成器没有挂起的 `yield` 可以接收值。
- `next(gen)` 与 `gen.send(None)` 完全等价；生成器结束时 `send` 与 `next` 都抛 `StopIteration`，最终 `return` 值挂在 `StopIteration.value` 上。
- 典型场景：累加器（每次 send 一个增量）、echo 协程（回显输入）、移动平均器（带状态聚合）、状态机（如红绿灯）。
- `send` 让生成器从"只产出"升级为"可双向通信"，是协程雏形的核心机制；`throw`/`close` 提供"异常"和"终止"两种控制信号，与 `send` 共同构成生成器协程的控制接口。
- 从原理看，`send` 的工作分两步：先把 `value` 塞到挂起的 `yield` 表达式位置，再恢复执行到下一个 `yield` 或结束；首次 `send` 非 None 报错是因为启动瞬间不存在挂起的 `yield`，无处接收。
- `yield from` 是 `send` 双向通信在"委托给另一个生成器"场景下的标准化形式，内外层的 `send`/产出通过它透明转发。

读完本文你应能掌握：

- 能说明 `gen.send(value)` 的语义、返回值、与 `next(gen)` 的等价关系。
- 能正确启动一个需要 `send` 双向通信的生成器，并解释首次必须 `send(None)` 的原因。
- 能手写累加器、echo、移动平均器、状态机等典型 `send` 驱动的生成器，并正确处理结束语义与 `StopIteration.value`。
- 能从生成器帧的挂起/恢复角度解释 `send` 如何把值送回挂起处、为什么首次 send 非 None 会报 `TypeError`。
- 能区分入流与出流、`send` 与 `throw`/`close` 的职责，并知道这些接口如何共同构成协程雏形的控制面，为学习 `yield from` 与原生协程打下基础。