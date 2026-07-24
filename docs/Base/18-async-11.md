---
group:
  title: 【18】异步协程
  order: 18
order: 11
title: asyncio.Queue 异步队列
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 asyncio.Queue

在异步编程中，协程是并发运行的基本单位。多个协程并发执行时，不可避免地需要在它们之间传递数据：一个协程负责生产数据（比如从网络抓取页面），另一个协程负责消费数据（比如解析并入库）。如果让生产者直接调用消费者的函数，两者就被耦合在一起，无法独立并发；如果用普通 list 当缓冲，又很难做到"满了让生产者等一等、空了让消费者等一等"的协调。

`asyncio.Queue` 就是 asyncio 提供的、用于协程间安全传递数据的异步队列。它实现了经典的"生产者-消费者"通道：

- 生产者协程用 `await q.put(item)` 把数据放进队列；
- 消费者协程用 `await q.get()` 从队列取出数据；
- 当队列满了，`put` 会挂起当前协程，直到有空间；
- 当队列空了，`get` 会挂起当前协程，直到有数据；
- 还可以用 `q.task_done()` 配合 `q.join()` 跟踪"所有入队任务是否都被处理完毕"。

和标准库的 `queue.Queue`（线程队列）相比，`asyncio.Queue` 的本质区别在于"等待的方式"：`queue.Queue` 用阻塞线程来等待（`put`/`get` 会卡住整个线程），而 `asyncio.Queue` 用 `await` 来让出事件循环（`put`/`get` 满或空时挂起的是协程，事件循环可以切去跑别的协程，不会卡住整个程序）。因为 asyncio 的事件循环是单线程的，所有协程都在同一个线程里交替执行，访问队列内部数据结构时不会有真正的并发写冲突，所以 `asyncio.Queue` 内部不需要像 `queue.Queue` 那样加锁。

简单说，`asyncio.Queue` 回答了一个核心问题：**协程之间如何安全、协调地传递数据**。它是构建异步流水线、生产者-消费者模型、任务池的基石。

### 1.2 基本语法与最小用法

`asyncio.Queue` 的构造函数签名：

```python
asyncio.Queue(maxsize=0)
```

- `maxsize`：队列容量上限。默认 `0` 表示无上限（队列可以无限增长，直到内存耗尽）。设为正整数时，队列里同时最多容纳 `maxsize` 个未取走的元素，超过则 `put` 会等待。

核心方法一览（`q` 是一个 `Queue` 实例）：

| 方法 | 作用 | 是否协程方法 |
| --- | --- | --- |
| `await q.put(item)` | 入队，满则等待 | 是 |
| `await q.get()` | 出队，空则等待 | 是 |
| `q.put_nowait(item)` | 立即入队，满则抛 `QueueFull` | 否 |
| `q.get_nowait()` | 立即出队，空则抛 `QueueEmpty` | 否 |
| `q.qsize()` | 当前队列内元素数 | 否 |
| `q.empty()` | 是否为空 | 否 |
| `q.full()` | 是否已满（受 maxsize 限制） | 否 |
| `q.task_done()` | 标记一个已取出的任务处理完毕 | 否 |
| `await q.join()` | 阻塞直到所有入队任务都被 task_done | 是 |

先看一个最小可运行的例子，感受"生产者-消费者"最简单的形态：

```python
import asyncio


async def producer(q: asyncio.Queue):
    """生产者：往队列里放 3 条数据，然后放一个结束信号。"""
    for i in range(3):
        await q.put(f"任务-{i}")
        print(f"[生产者] put 任务-{i}")
    await q.put(None)  # None 作为结束哨兵
    print("[生产者] put 结束信号，退出")


async def consumer(q: asyncio.Queue):
    """消费者：不断取数据处理，遇到 None 结束。"""
    while True:
        item = await q.get()
        if item is None:
            print("[消费者] 收到结束信号，退出")
            q.task_done()
            break
        print(f"[消费者] 处理 {item}")
        await asyncio.sleep(0.1)  # 模拟处理耗时
        q.task_done()


async def main():
    q = asyncio.Queue()
    await asyncio.gather(producer(q), consumer(q))


asyncio.run(main())
```

```
# 输出：
# [生产者] put 任务-0
# [生产者] put 任务-1
# [生产者] put 任务-2
# [生产者] put 结束信号，退出
# [消费者] 处理 任务-0
# [消费者] 处理 任务-1
# [消费者] 处理 任务-2
# [消费者] 收到结束信号，退出
```

这个例子里，生产者和消费者是两个协程，通过同一个 `Queue` 传递数据。即便生产者一口气把 3 条数据都放进队列，消费者也能从容地一条条取。由于这里 `maxsize=0`（无上限），生产者不会因为"队列满"而等待。下一节我们会看到设置 `maxsize` 后产生的"背压"效果。

## 2. 核心内容

### 2.1 创建队列：asyncio.Queue(maxsize=0)

构造一个队列时，最重要的参数就是 `maxsize`。它决定了队列的容量，进而决定了是否会产生"背压"——即生产者是否会被迫等待。

**maxsize=0（默认，无上限）**

不传或传 `0`，队列没有容量限制。生产者 `put` 永远不会因为"队列满"而等待，只要内存够，想放多少放多少。这种模式适合消费者速度稳定、生产者产出可控的场景，但要警惕：如果生产速度远超消费速度，队列会无限堆积，最终可能耗尽内存。

**maxsize=N（正整数，有上限）**

设置一个上限后，当队列里已有 `N` 个未取走的元素时，下一次 `put` 就会挂起当前协程，直到消费者取走至少一个元素腾出空间。这就是"背压"（backpressure）：消费者的处理速度反过来"压迫"生产者，让它慢下来。这能有效防止内存爆掉，是处理"生产快、消费慢"场景的标准手段。

需要注意 `full()` 方法的判断：当 `qsize() >= maxsize` 时 `full()` 返回 `True`。但即便 `full()` 为 `True`，如果你用 `put_nowait()` 仍会抛异常，而用 `await put()` 会正确等待——两者的区别稍后详述。

```python
import asyncio


async def main():
    # 无上限队列
    q_unbounded = asyncio.Queue()
    await q_unbounded.put("a")
    await q_unbounded.put("b")
    print("无上限队列 qsize:", q_unbounded.qsize(), "full:", q_unbounded.full())
    # 输出：无上限队列 qsize: 2 full: False

    # 有上限队列
    q_bounded = asyncio.Queue(maxsize=2)
    await q_bounded.put("a")
    await q_bounded.put("b")
    print("有上限队列 qsize:", q_bounded.qsize(), "full:", q_bounded.full())
    # 输出：有上限队列 qsize: 2 full: True


asyncio.run(main())
```

**容量语义的一个细节**

`maxsize` 限制的是"当前在队列里、还没被取走的元素数量"。一个元素被 `get()` 取走后，即使消费者还没调用 `task_done()`，队列里的计数也已经减一，生产者可以继续 `put`。也就是说，`maxsize` 管的是"队列缓冲区容量"，而 `task_done`/`join` 管的是"任务处理进度跟踪"，两者是独立的机制，后面会分开讲。

### 2.2 入队：await q.put(item) 与 put_nowait

`put` 把一个元素放进队列。它有两种形式：

- `await q.put(item)`：协程方法。如果队列未满，立即放入并返回；如果已满，挂起当前协程，直到有空位再放入。
- `q.put_nowait(item)`：同步方法。如果队列未满，立即放入；如果已满，抛出 `asyncio.QueueFull` 异常，不会等待。

**为何 put 是协程方法**

因为"队列满"时它需要让出事件循环。如果用阻塞方式等待，整个线程（包括事件循环和其他协程）都会卡死，这就违背了 asyncio 的设计初衷。用 `await` 等待则不同：当前协程被挂起，事件循环可以切到消费者协程去取数据，腾出空间后再唤醒生产者继续 `put`。

**put_nowait 的适用场景**

当你不想等待、想"要么立刻放入、要么直接放弃/报错"时用 `put_nowait`。比如批量投递任务时，如果队列满了就跳过或记录到日志，不想阻塞投递流程：

```python
import asyncio


async def main():
    q = asyncio.Queue(maxsize=2)

    # 先放两个，把队列填满
    q.put_nowait("a")
    q.put_nowait("b")
    print("填满后 full:", q.full())  # 输出：填满后 full: True

    # 再用 put_nowait 放第三个，会抛 QueueFull
    try:
        q.put_nowait("c")
    except asyncio.QueueFull:
        print("队列满了，put_nowait 抛 QueueFull")

    # 用 await put 则会等待：先取走一个腾出空间
    async def drainer():
        await asyncio.sleep(0.01)
        item = await q.get()
        print(f"取走了 {item}，腾出空间")

    await asyncio.gather(
        q.put("c"),   # 这个 put 会等待，直到 drainer 取走一个
        drainer(),
    )
    print("put 完成，当前 qsize:", q.qsize())  # 输出：put 完成，当前 qsize: 2


asyncio.run(main())
```

```
# 输出：
# 填满后 full: True
# 队列满了，put_nowait 抛 QueueFull
# 取走了 a，腾出空间
# put 完成，当前 qsize: 2
```

这个例子把 `put_nowait` 和 `await put` 的差异展示得很清楚：前者满了立刻报错，后者满了耐心等待。实际使用时，如果队列是异步流水线的一部分，绝大多数情况应该用 `await put`，让事件循环自动协调生产消费节奏；只在"非阻塞投递"这种特殊需求下才用 `put_nowait`。

### 2.3 出队：await q.get() 与 get_nowait

`get` 从队列取出一个元素。同样有两种形式：

- `await q.get()`：协程方法。队列非空时立即取出并返回；队列为空时挂起当前协程，直到有生产者放入数据。
- `q.get_nowait()`：同步方法。队列非空时立即取出并返回；队列为空时抛出 `asyncio.QueueEmpty` 异常。

**为何 get 是协程方法**

和 `put` 同理：队列为空时需要等待，而等待不能阻塞事件循环。`await get` 在空队列上挂起当前协程，让事件循环切到生产者协程去放数据，有数据后再唤醒消费者继续取。

**get 的返回值与多次 get**

`await q.get()` 每次返回队列里的一个元素（按入队顺序，先进先出）。多次调用 `get` 会依次拿到不同元素。队列空了再 `await get`，消费者就会"停"在那里等。

```python
import asyncio


async def main():
    q = asyncio.Queue()
    await q.put("第一条")
    await q.put("第二条")

    print("第一次 get:", await q.get())  # 输出：第一次 get: 第一条
    print("第二次 get:", await q.get())  # 输出：第二次 get: 第二条
    print("现在 empty:", q.empty())       # 输出：现在 empty: True

    # 空队列用 get_nowait 抛 QueueEmpty
    try:
        q.get_nowait()
    except asyncio.QueueEmpty:
        print("空队列，get_nowait 抛 QueueEmpty")

    # 用 await get 会等待，直到有生产者放入数据
    async def filler():
        await asyncio.sleep(0.01)
        await q.put("迟来的第三条")
        print("生产者放入第三条")

    await asyncio.gather(
        q.get(),    # 这个 get 会等待，直到 filler 放入数据
        filler(),
    )
    print("等待后取到了数据")


asyncio.run(main())
```

```
# 输出：
# 第一次 get: 第一条
# 第二次 get: 第二条
# 现在 empty: True
# 空队列，get_nowait 抛 QueueEmpty
# 生产者放入第三条
# 等待后取到了数据
```

**get 的一个关键习惯：配合 task_done**

`get` 取走元素后，队列的 `qsize` 会减一，但 `asyncio.Queue` 内部还有一个"未完成任务计数器"不会自动减——你必须在处理完这个元素后手动调用 `q.task_done()` 告诉队列"这个任务我搞定了"。这个计数器是 `q.join()` 的依据，后面专门讲。

### 2.4 状态查询：qsize / empty / full

这三个是同步方法（不需要 `await`），用于查询队列当前状态：

| 方法 | 返回 | 说明 |
| --- | --- | --- |
| `q.qsize()` | `int` | 队列里当前未取走的元素数量 |
| `q.empty()` | `bool` | `qsize() == 0` 时为 `True` |
| `q.full()` | `bool` | `maxsize > 0` 且 `qsize() >= maxsize` 时为 `True`；`maxsize <= 0`（无上限）时永远 `False` |

**一个重要提醒：单线程下这些值是"近似"的**

在 asyncio 单线程事件循环里，`qsize()` 的值在你调用它那一刻是精确的，但等你拿到值做判断时，可能已经有其他协程执行过 `put`/`get` 改变了队列——因为 `await` 会让出循环，别的协程有机会插入执行。所以"先 `if not q.empty()` 再 `q.get_nowait()`"这种写法在多协程并发下并非原子操作，仍可能出现"判断时非空、取时空了"的情况。如果你需要"有就取、没有就算了"的语义，最稳妥的做法是直接用 `get_nowait()` 配合异常处理：

```python
import asyncio


async def main():
    q = asyncio.Queue()
    await q.put("x")

    # 不推荐的写法：empty/full 判断与 get 不是原子操作
    if not q.empty():
        # 这里如果有别的消费者协程抢先取走，下面的 get_nowait 就会抛异常
        try:
            print(await q.get())
        except asyncio.QueueEmpty:
            print("被别人抢先取走了")

    # 推荐写法：直接用 get_nowait 处理异常
    try:
        item = q.get_nowait()
        print("取到：", item)
    except asyncio.QueueEmpty:
        print("没取到，队列空")


asyncio.run(main())
```

**full() 与 put 的关系**

类似地，`q.full()` 为 `True` 并不意味着 `await put` 一定会等待——因为在 `full()` 返回 `True` 之后、`put` 真正执行之前，可能有消费者 `get` 走一个元素腾出空间。所以 `full()` 更多是"当前是否达到容量上限"的查询，不能用来可靠预判 `put` 会不会阻塞。需要"能放就放、不能放就算了"的语义时，直接用 `put_nowait()` 配合异常处理更可靠。

### 2.5 task_done 与 join：跟踪任务完成

这是 `asyncio.Queue` 里最容易被初学者忽略、却又非常实用的一组 API。它们解决的问题是：**如何知道队列里所有入队的任务都已经被消费者处理完了？**

**未完成任务计数器**

`Queue` 内部维护一个整数 `_unfinished_tasks`。每当 `put` 放入一个元素，这个计数器加一；每当消费者调用 `task_done()`，这个计数器减一。当计数器归零时，意味着"所有入队的东西都已被 task_done"，此时正在 `await q.join()` 等待的协程会被唤醒。

**task_done 的语义**

`task_done()` 每调用一次，表示"我之前 `get` 到的那个任务，现在已经处理完了"。所以严格的使用模式是：`get` 一次、处理好、`task_done` 一次，一一对应。如果调用 `task_done()` 的次数超过了实际 `put` 的次数（计数器本来是 0 还要减），会抛 `ValueError`。

**join 的语义**

`await q.join()` 会阻塞（挂起协程），直到 `_unfinished_tasks` 归零。它通常用在"生产者已经把所有任务都 put 完了，想等所有消费者都处理完再继续"的场景。

**完整范例：生产者投递 5 个任务，等所有处理完成**

```python
import asyncio


async def worker(name: str, q: asyncio.Queue):
    """消费者协程：循环取任务、处理、回报 task_done。"""
    while True:
        task = await q.get()
        try:
            print(f"[{name}] 开始处理 {task}")
            await asyncio.sleep(0.05)  # 模拟处理耗时
            print(f"[{name}] 完成 {task}")
        finally:
            # 无论处理是否成功，都要 task_done，否则 join 会永远等下去
            q.task_done()


async def main():
    q = asyncio.Queue()

    # 启动 2 个消费者
    workers = [asyncio.create_task(worker(f"消费者-{i}", q)) for i in range(2)]

    # 生产者投递 5 个任务
    for i in range(5):
        await q.put(f"任务-{i}")
        print(f"[生产者] 投递 任务-{i}")

    # 等所有任务被处理完
    await q.join()
    print("[主] 所有任务处理完毕")

    # 取消消费者（它们还在 while True 里等下一个任务）
    for w in workers:
        w.cancel()
    await asyncio.gather(*workers, return_exceptions=True)


asyncio.run(main())
```

```
# 输出（消费者间并发顺序可能略有不同）：
# [生产者] 投递 任务-0
# [生产者] 投递 任务-1
# [生产者] 投递 任务-2
# [生产者] 投递 任务-3
# [生产者] 投递 任务-4
# [消费者-0] 开始处理 任务-0
# [消费者-1] 开始处理 任务-1
# [消费者-0] 完成 任务-0
# [消费者-0] 开始处理 任务-2
# [消费者-1] 完成 任务-1
# [消费者-1] 开始处理 任务-3
# [消费者-0] 完成 任务-2
# [消费者-0] 开始处理 任务-4
# [消费者-1] 完成 任务-3
# [消费者-0] 完成 任务-4
# [主] 所有任务处理完毕
```

**忘记 task_done 的后果**

如果消费者 `get` 了任务但忘了调用 `task_done()`，`_unfinished_tasks` 永远不会归零，`await q.join()` 就会永远等下去，整个程序卡死。这是用 `Queue` 时最常见的 bug 之一。推荐用 `try/finally` 确保 `task_done` 一定被调用，即便处理过程中抛了异常。

### 2.6 典型场景：生产者-消费者模式

`asyncio.Queue` 最经典的应用就是生产者-消费者模式。前面已经看过单生产者单消费者、单生产者多消费者的例子，这里再看一个"多生产者多消费者"的完整模型，更贴近真实场景。

场景设定：有 3 个爬虫协程并发抓取页面 URL，把抓到的内容放进队列；有 2 个解析协程从队列取内容解析。抓取速度和解析速度不同，队列充当缓冲。

```python
import asyncio
import random


async def crawler(name: str, urls: list[str], q: asyncio.Queue):
    """生产者：抓取一批 URL，把结果放进队列。"""
    for url in urls:
        await asyncio.sleep(random.uniform(0.02, 0.08))  # 模拟网络耗时
        content = f"<html>{url} 的内容</html>"
        await q.put((name, url, content))
        print(f"[{name}] 抓取完成 {url}，已入队")


async def parser(name: str, q: asyncio.Queue):
    """消费者：从队列取内容解析。"""
    while True:
        producer, url, content = await q.get()
        try:
            await asyncio.sleep(random.uniform(0.03, 0.1))  # 模拟解析耗时
            print(f"[{name}] 解析 {url}：{content[:25]}...")
        finally:
            q.task_done()


async def main():
    q = asyncio.Queue(maxsize=10)  # 限制缓冲区大小，形成背压

    # 3 个生产者，各负责一组 URL
    url_groups = [
        [f"http://a.com/{i}" for i in range(3)],
        [f"http://b.com/{i}" for i in range(3)],
        [f"http://c.com/{i}" for i in range(3)],
    ]
    producers = [
        asyncio.create_task(crawler(f"爬虫-{i}", urls, q))
        for i, urls in enumerate(url_groups)
    ]

    # 2 个消费者
    consumers = [
        asyncio.create_task(parser(f"解析器-{i}", q)) for i in range(2)
    ]

    # 等所有生产者抓完
    await asyncio.gather(*producers)
    print("[主] 所有生产者抓取完毕")

    # 等所有任务被解析完
    await q.join()
    print("[主] 所有内容解析完毕")

    # 关闭消费者
    for c in consumers:
        c.cancel()
    await asyncio.gather(*consumers, return_exceptions=True)


asyncio.run(main())
```

```
# 输出（顺序因随机耗时而异）：
# [爬虫-1] 抓取完成 http://b.com/0，已入队
# [爬虫-0] 抓取完成 http://a.com/0，已入队
# [解析器-0] 解析 http://b.com/0：<html>http://b.com/0 的内容...
# [解析器-1] 解析 http://a.com/0：<html>http://a.com/0 的内容...
# [爬虫-2] 抓取完成 http://c.com/0，已入队
# ...
# [主] 所有生产者抓取完毕
# [主] 所有内容解析完毕
```

这个模型的关键点：

1. **生产者消费者解耦**：爬虫和解析器互不调用，只通过队列连接。爬虫慢了不会拖累解析器（解析器会等队列有数据），解析器慢了不会拖累爬虫（爬虫的数据先进队列缓冲，队列满了才让爬虫等）。
2. **maxsize 背压**：设 `maxsize=10`，如果爬虫抓得太快、解析跟不上，队列填满 10 个后爬虫的 `put` 就会等待，避免内存无限增长。
3. **join 同步点**：`await q.join()` 确保"所有内容都解析完"才进入下一步，这是关闭消费者之前的关键同步点。

### 2.7 maxsize 背压：限制内存膨胀

前面多次提到"背压"，这里用一个对照实验直观展示它的作用。我们让生产者极速产出、消费者慢速处理，分别看不设 `maxsize` 和设 `maxsize` 的差异。

**不设 maxsize：队列无限堆积**

```python
import asyncio


async def fast_producer(q: asyncio.Queue, n: int):
    for i in range(n):
        await q.put(i)  # 无上限，put 立刻成功
    print(f"[生产者] 已投递 {n} 项")

async def slow_consumer(q: asyncio.Queue, n: int):
    count = 0
    while count < n:
        item = await q.get()
        await asyncio.sleep(0.01)  # 慢速处理
        q.task_done()
        count += 1
    print(f"[消费者] 已处理 {count} 项")

async def main():
    q = asyncio.Queue()  # 无上限
    n = 1000
    await asyncio.gather(fast_producer(q, n), slow_consumer(q, n))
    print(f"[主] 结束，队列最终 qsize={q.qsize()}")


asyncio.run(main())
```

```
# 输出：
# [生产者] 已投递 1000 项
# [消费者] 已处理 1000 项
# [主] 结束，队列最终 qsize=0
```

注意 `[生产者] 已投递 1000 项` 几乎瞬间就打印了——因为无上限队列不阻塞 `put`，1000 项全部立刻塞进队列，等消费者慢慢处理。如果 `n` 是 100 万，这 100 万项会同时驻留内存，可能造成内存尖峰。

**设 maxsize=50：生产者被迫等待**

```python
import asyncio


async def fast_producer(q: asyncio.Queue, n: int):
    for i in range(n):
        await q.put(i)  # 队列满时会在这里等待
        if i % 100 == 0:
            print(f"[生产者] 已投递到第 {i} 项，qsize={q.qsize()}")
    print(f"[生产者] 全部投递完成")

async def slow_consumer(q: asyncio.Queue, n: int):
    count = 0
    while count < n:
        item = await q.get()
        await asyncio.sleep(0.01)
        q.task_done()
        count += 1
    print(f"[消费者] 已处理 {count} 项")

async def main():
    q = asyncio.Queue(maxsize=50)  # 上限 50
    n = 1000
    await asyncio.gather(fast_producer(q, n), slow_consumer(q, n))
    print(f"[主] 结束，队列最终 qsize={q.qsize()}")


asyncio.run(main())
```

```
# 输出（节选）：
# [生产者] 已投递到第 0 项，qsize=1
# [生产者] 已投递到第 100 项，qsize=45
# [生产者] 已投递到第 200 项，qsize=48
# ...
# [生产者] 全部投递完成
# [消费者] 已处理 1000 项
# [主] 结束，队列最终 qsize=0
```

这次 `[生产者] 全部投递完成` 要等到最后才打印——因为队列一旦到 50，`put` 就会挂起，等消费者取走几个再继续。整个过程中队列 `qsize` 始终在 50 上下波动，内存占用稳定。这就是背压的价值：**让生产者适应消费者的节奏，避免缓冲区无限膨胀**。

**背压与"批次投递"的取舍**

有时候生产者手里一批数据需要一次性投递，但队列 maxsize 限制让它只能慢慢挤进去。这种场景下，可以考虑：

- 用 `put_nowait` + 异常处理，满了就跳过或暂存到本地，下次再试；
- 或者干脆 `await put` 让它慢慢挤，接受"投递被节流"的事实。

具体选哪种取决于业务语义：数据不能丢就必须 `await put` 或本地暂存；数据可以丢（比如采样指标）就可以 `put_nowait` 跳过溢出部分。

### 2.8 变体：PriorityQueue 与 LifoQueue

`asyncio` 除了基础的 `Queue`（先进先出 FIFO），还提供了两个语义不同的变体：

**asyncio.PriorityQueue：优先级队列**

`PriorityQueue` 按元素的优先级出队，优先级低的先出（Python 的 `heapq` 是小顶堆，所以"最小"的元素先出）。元素通常是 `(priority, item)` 这样的元组，比较时先比 `priority`，相同再比 `item`（如果 `item` 不可比较会报错，所以 `priority` 最好能唯一确定顺序，或让 `item` 也可比较）。

```python
import asyncio


async def main():
    pq: asyncio.PriorityQueue = asyncio.PriorityQueue()
    # 投递不同优先级的任务（数字越小优先级越高）
    await pq.put((3, "低优先级任务"))
    await pq.put((1, "高优先级任务"))
    await pq.put((2, "中优先级任务"))

    print(await pq.get())  # 输出：(1, '高优先级任务')
    print(await pq.get())  # 输出：(2, '中优先级任务')
    print(await pq.get())  # 输出：(3, '低优先级任务')


asyncio.run(main())
```

**优先级相同时的坑**

如果两个元素 `priority` 相同，`heapq` 会去比元组的第二个元素（`item`）。如果 `item` 是字符串、数字这类可比较类型没问题，但如果是字典这种不可比较对象就会抛 `TypeError`。解决方法是加一个自增计数器作为第二项，保证元组永远能比较：

```python
import asyncio
import itertools


async def main():
    pq: asyncio.PriorityQueue = asyncio.PriorityQueue()
    counter = itertools.count()  # 自增计数器

    # 同优先级的两个任务，用 counter 保证可比较
    await pq.put((1, next(counter), "任务A"))
    await pq.put((1, next(counter), "任务B"))  # 同优先级，后入队的 B

    print(await pq.get())  # 输出：(1, 0, '任务A')   ← counter 小的先出
    print(await pq.get())  # 输出：(1, 1, '任务B')


asyncio.run(main())
```

**PriorityQueue 实战：按紧急程度处理告警**

```python
import asyncio
import itertools


async def alerter(q: asyncio.PriorityQueue):
    """消费者：不断取最高优先级告警处理。"""
    while True:
        priority, _, alert = await q.get()
        try:
            await asyncio.sleep(0.05)
            print(f"处理告警 [优先级 {priority}]：{alert}")
        finally:
            q.task_done()


async def main():
    q: asyncio.PriorityQueue = asyncio.PriorityQueue()
    counter = itertools.count()

    # 启动消费者
    task = asyncio.create_task(alerter(q))

    # 投递若干告警
    await q.put((2, next(counter), "磁盘使用率 80%"))
    await q.put((1, next(counter), "主库连接失败"))   # 最高优先级
    await q.put((3, next(counter), "日志文件偏大"))
    await q.put((1, next(counter), "备库同步延迟"))   # 与主库同优先级，后处理

    await q.join()
    task.cancel()
    await asyncio.gather(task, return_exceptions=True)


asyncio.run(main())
```

```
# 输出（优先级 1 的两个最先处理，同优先级按入队顺序）：
# 处理告警 [优先级 1]：主库连接失败
# 处理告警 [优先级 1]：备库同步延迟
# 处理告警 [优先级 2]：磁盘使用率 80%
# 处理告警 [优先级 3]：日志文件偏大
```

**asyncio.LifoQueue：后进先出队列**

`LifoQueue` 是栈语义，后入队的先出。适合"最新数据优先处理"的场景，比如消息列表里总想先看最新一条。

```python
import asyncio


async def main():
    lq: asyncio.LifoQueue = asyncio.LifoQueue()
    await lq.put("第一条")
    await lq.put("第二条")
    await lq.put("第三条")

    print(await lq.get())  # 输出：第三条（后入先出）
    print(await lq.get())  # 输出：第二条
    print(await lq.get())  # 输出：第一条


asyncio.run(main())
```

**三种队列的出队顺序对比**

| 队列类型 | 出队顺序 | 典型场景 |
| --- | --- | --- |
| `Queue` | 先进先出（FIFO） | 任务队列、消息缓冲，最常用 |
| `PriorityQueue` | 按 priority 从小到大 | 紧急任务优先、调度 |
| `LifoQueue` | 后进先出（LIFO） | 最新数据优先、深度优先遍历 |

不管哪种变体，`put`/`get`/`task_done`/`join`/`qsize`/`empty`/`full` 这些 API 都完全一致，只是内部"取下一个元素"的规则不同。

### 2.9 多消费者并发处理任务池

前面已经出现过多次"多个消费者协程共享一个队列"的模式，这里把它抽象成一个通用的"任务池"模式，并讲清几个细节。

**任务池模式骨架**

```python
import asyncio


async def worker(name: str, q: asyncio.Queue):
    """通用工作协程：循环取任务处理。"""
    while True:
        task = await q.get()
        try:
            print(f"[{name}] 处理 {task}")
            await asyncio.sleep(0.05)  # 模拟处理
        except Exception as e:
            print(f"[{name}] 处理 {task} 出错：{e}")
        finally:
            q.task_done()


async def run_pool(n_workers: int, tasks: list):
    q = asyncio.Queue()
    workers = [asyncio.create_task(worker(f"W-{i}", q)) for i in range(n_workers)]

    for t in tasks:
        await q.put(t)

    await q.join()  # 等所有任务处理完

    for w in workers:
        w.cancel()
    await asyncio.gather(*workers, return_exceptions=True)
    print("[主] 任务池关闭")


async def main():
    await run_pool(n_workers=3, tasks=[f"任务-{i}" for i in range(10)])


asyncio.run(main())
```

```
# 输出（顺序因并发而异）：
# [W-0] 处理 任务-0
# [W-1] 处理 任务-1
# [W-2] 处理 任务-2
# [W-0] 处理 任务-3
# ...
# [主] 任务池关闭
```

**为什么用 while True + cancel 关闭**

工作协程不知道什么时候没有新任务了，所以用 `while True` 一直等。主协程通过 `q.join()` 知道"所有已投递任务处理完"的时机，这时工作协程还卡在 `await q.get()` 等下一个任务，所以主协程用 `cancel()` 取消它们。被取消的 `get` 会抛 `CancelledError`，`gather(..., return_exceptions=True)` 把它吃掉，避免污染日志。

**优雅关闭的替代方案：哨兵**

除了 `cancel`，也可以用"哨兵"通知工作协程退出：每个工作协程收到一个约定的结束标志（比如 `None`）就退出循环。多少个工作协程就投递多少个哨兵：

```python
import asyncio


SENTINEL = None


async def worker(name: str, q: asyncio.Queue):
    while True:
        task = await q.get()
        if task is SENTINEL:
            q.task_done()
            print(f"[{name}] 收到哨兵，退出")
            return
        try:
            print(f"[{name}] 处理 {task}")
            await asyncio.sleep(0.05)
        finally:
            q.task_done()


async def main():
    q = asyncio.Queue()
    n_workers = 3
    workers = [asyncio.create_task(worker(f"W-{i}", q)) for i in range(n_workers)]

    for i in range(10):
        await q.put(f"任务-{i}")

    # 投递 n_workers 个哨兵，让每个 worker 都能退出
    for _ in range(n_workers):
        await q.put(SENTINEL)

    await asyncio.gather(*workers)  # 所有 worker 退出后返回
    print("[主] 所有 worker 已退出")


asyncio.run(main())
```

```
# 输出（顺序因并发而异）：
# [W-0] 处理 任务-0
# [W-1] 处理 任务-1
# [W-2] 处理 任务-2
# ...
# [W-0] 收到哨兵，退出
# [W-1] 收到哨兵，退出
# [W-2] 收到哨兵，退出
# [主] 所有 worker 已退出
```

哨兵方式的优点是不依赖 `cancel`，工作协程能优雅地走完收尾逻辑；缺点是需要精确投递与工作协程数量相同的哨兵，且哨兵本身也算一次 `get`/`task_done`。

### 2.10 Queue 与 create_task 构建异步流水线

当数据处理分成多个阶段时，可以用多个 `Queue` 把它们串成流水线：每个阶段是一个协程，从前一个队列取数据、处理、放进下一个队列。这样各阶段可以并发推进。

场景：下载 -> 解析 -> 入库 三个阶段，用两个队列连接。

```python
import asyncio
import random


async def downloader(url: str, q_out: asyncio.Queue):
    """阶段1：下载。"""
    await asyncio.sleep(random.uniform(0.02, 0.06))
    content = f"<html>{url}</html>"
    await q_out.put((url, content))


async def parser(q_in: asyncio.Queue, q_out: asyncio.Queue):
    """阶段2：从下载队列取，解析后放进入库队列。"""
    while True:
        item = await q_in.get()
        try:
            url, content = item
            await asyncio.sleep(0.02)
            data = {"url": url, "title": content[6:20]}
            await q_out.put(data)
        finally:
            q_in.task_done()


async def saver(q_in: asyncio.Queue, n_total: int):
    """阶段3：入库。"""
    count = 0
    while count < n_total:
        data = await q_in.get()
        try:
            await asyncio.sleep(0.02)
            print(f"[入库] 保存 {data}")
            count += 1
        finally:
            q_in.task_done()
    print(f"[入库] 共保存 {count} 条")


async def main():
    q_download = asyncio.Queue(maxsize=5)
    q_save = asyncio.Queue(maxsize=5)

    urls = [f"http://x.com/{i}" for i in range(6)]

    # 阶段1：多个下载协程并发
    downloaders = [asyncio.create_task(downloader(u, q_download)) for u in urls]
    # 阶段2：2 个解析协程
    parsers = [asyncio.create_task(parser(q_download, q_save)) for _ in range(2)]
    # 阶段3：1 个入库协程，知道总共有 6 条
    saver_task = asyncio.create_task(saver(q_save, len(urls)))

    # 等下载完
    await asyncio.gather(*downloaders)
    # 等解析完
    await q_download.join()
    # 关闭解析协程
    for p in parsers:
        p.cancel()
    await asyncio.gather(*parsers, return_exceptions=True)
    # 等入库完
    await saver_task


asyncio.run(main())
```

```
# 输出（顺序因并发而异）：
# [入库] 保存 {'url': 'http://x.com/0', 'title': '<html>http://x.com/0</htm'}
# [入库] 保存 {'url': 'http://x.com/1', 'title': '<html>http://x.com/1</htm'}
# ...
# [入库] 共保存 6 条
```

**流水线的并发性**

流水线里每个阶段都是并发的：下载协程在抓第 3 个时，解析协程可能已经在解析第 1 个，入库协程在存第 0 个。三个阶段通过两个队列解耦，互不阻塞（除非某个阶段太快把下游队列填满，这时 maxsize 背压会让上游等一等）。

**流水线与"一次 gather 全部任务"的区别**

如果把所有阶段塞进一个 `gather`，每个任务自己干完下载+解析+入库三件事，那不同 URL 之间是并发的，但同一 URL 的三个阶段是串行的。用流水线则可以让"URL A 的解析"与"URL B 的下载"同时进行，各阶段独立并发，吞吐量通常更高。这正是 `Queue` 在异步编程里的高阶价值。

### 2.11 与 queue.Queue 的对比

`asyncio.Queue` 和标准库 `queue.Queue` 的 API 非常像（都有 `put`/`get`/`put_nowait`/`get_nowait`/`task_done`/`join`/`qsize`/`empty`/`full`），但两者面向的并发模型完全不同，不能混用。

| 维度 | `queue.Queue`（线程队列） | `asyncio.Queue`（协程队列） |
| --- | --- | --- |
| 并发模型 | 多线程 | 单线程事件循环 + 协程 |
| 等待方式 | `put`/`get` 阻塞当前线程 | `await put`/`await get` 挂起当前协程，让出事件循环 |
| 内部同步 | 用 `threading.Lock`/`Condition` 加锁 | 无锁（单线程访问，无竞态） |
| 任务计数 | `task_done`/`join` 基于线程安全计数器 | 相同语义，但计数器在事件循环里单线程修改 |
| 典型搭配 | `threading.Thread`、`concurrent.futures` | `asyncio.create_task`、`asyncio.gather` |
| 能否跨模型用 | 不能给 asyncio 用（会阻塞事件循环） | 不能给多线程用（不是线程安全） |

**绝对不要在 asyncio 里用 queue.Queue**

`queue.Queue` 的 `put`/`get` 在满/空时会阻塞线程。在 asyncio 里，事件循环跑在主线程上，一旦阻塞主线程，所有协程都无法推进，整个程序卡死。即便用 `put_nowait`/`get_nowait` 不阻塞，`queue.Queue` 也不是为协程设计的，它没有"挂起协程、让出循环"的能力。所以 asyncio 程序里数据传递一律用 `asyncio.Queue`。

反过来，多线程程序里也不要用 `asyncio.Queue`——它的 `put`/`get` 是协程方法，需要事件循环驱动，线程里没法直接 `await`。两边各用各的队列。

**一个易混的"跨线程调用协程队列"场景**

有时候你会遇到"主线程跑 asyncio，子线程想往队列里塞数据"的情况。这时子线程不能直接操作 `asyncio.Queue`（它的事件循环在主线程），而应该用 `asyncio.run_coroutine_threadsafe(q.put(item), loop)` 把协程提交到主线程的事件循环执行。这属于"同步代码调用异步代码"的范畴，本篇不展开。

## 3. 最佳实践

### 3.1 消费者务必调用 task_done，推荐 try/finally

`task_done` 是 `q.join()` 能正常工作的唯一信号。漏调一次，`join` 就永远等不到。推荐固定写法：`get` 之后立刻 `try`，处理逻辑放 `try` 里，`task_done` 放 `finally`。

```python
# 不推荐：task_done 可能因为异常被跳过
item = await q.get()
result = process(item)   # 这里抛异常，下面 task_done 不会执行
q.task_done()

# 推荐：try/finally 保证 task_done 一定执行
item = await q.get()
try:
    result = await process(item)
except Exception as e:
    print(f"处理出错：{e}")
finally:
    q.task_done()
```

**task_done 不要调用超过 put 次数**

每 `put` 一次计数器加一，每 `task_done` 一次减一。如果你对同一个 `get` 调了两次 `task_done`，计数器会减成负数并抛 `ValueError: task_done() called too many times`。确保"一进一出"的严格对应。

### 3.2 关闭消费者：优先用哨兵而非 cancel

`cancel()` 会打断协程，如果协程正持有资源（比如打开的数据库连接），可能来不及释放。哨兵方式让协程自然走到退出点，更安全。只有当无法预知投递多少哨兵、或需要强制中断时才用 `cancel`。

```python
# 推荐：哨兵关闭
SHUTDOWN = object()
for _ in range(n_workers):
    await q.put(SHUTDOWN)
await asyncio.gather(*workers)

# 次选：cancel（确保 worker 内资源已用 try/finally 释放）
for w in workers:
    w.cancel()
await asyncio.gather(*workers, return_exceptions=True)
```

### 3.3 设置合理的 maxsize 形成背压

无上限队列在"生产远快于消费"时会让内存爆掉。除非你能保证生产消费速率基本平衡，否则给队列设一个 `maxsize`。大小怎么定？一个粗略原则：设成"消费者在合理时间内能消化掉的量"，比如消费者 0.1 秒处理一个，设 `maxsize=100` 意味着最多缓存 10 秒的处理量，超过就让生产者等。具体数值要看业务允许的延迟和内存预算。

**不要把 maxsize 设得太小**

太小（比如 1）会让生产者和消费者频繁切换、降低吞吐。要给队列留够缓冲空间，让快慢波动能被吸收，而不是一声咳嗽就触发背压。

### 3.4 不要用 empty/full 判断后再 put/get

前面提过，`empty()`/`full()` 的返回值在你拿到之后可能就过期了。需要"有就取、没有就算"或"能放就放、不能就算"的语义时，直接用 `get_nowait`/`put_nowait` 配异常：

```python
# 不推荐
if not q.empty():
    item = q.get_nowait()   # 可能在这一行抛 QueueEmpty

# 推荐
try:
    item = q.get_nowait()
except asyncio.QueueEmpty:
    item = None
```

### 3.5 队列元素用不可变结构，避免跨协程共享可变对象

队列传递的是对象引用，不是拷贝。如果生产者 put 一个 list，消费者拿到后修改它，而生产者手里还留着这个 list 的引用，两边会互相干扰（虽然单线程下不会"同时"改，但逻辑上仍易错）。推荐队列元素用 tuple、dataclass（冻结版）等不可变结构，或明确"put 出去后原持有方不再碰它"。

```python
# 不推荐：共享可变 list
data = [1, 2, 3]
await q.put(data)
data.append(4)   # 消费者拿到的 list 也变成了 [1,2,3,4]，容易混乱

# 推荐：用 tuple 或拷贝
await q.put((1, 2, 3))
# 或
await q.put([1, 2, 3].copy())
```

### 3.6 单生产者单消费者别过度设计

如果只有一个生产者、一个消费者，且消费速度稳定，有时不需要 `Queue`——直接让生产者 `await` 调用消费者的处理协程即可。`Queue` 的价值在于"多个生产者/消费者解耦"和"缓冲+背压"，不要为了用而用。

## 4. 原理

### 4.1 asyncio.Queue 的内部结构：deque + 两个等待者队列

`asyncio.Queue` 的内部实现其实很简洁，核心是三个数据结构：

- `self._queue`：一个 `collections.deque`，真正存放数据的双端队列。FIFO 语义由 `deque.append`（入队，放右端）和 `deque.popleft`（出队，取左端）实现。`PriorityQueue` 把 `deque` 换成 `heap`，`LifoQueue` 用 `deque.pop()`（取右端）代替 `popleft`，除此之外机制完全相同。
- `self._getters`：一个 `collections.deque`，存放"正在等待取数据的协程"对应的 `Future` 对象。当队列为空、有协程 `await q.get()` 时，会创建一个 `Future` 挂到这里，协程 `await` 这个 `Future` 而挂起。
- `self._putters`：一个 `collections.deque`，存放"正在等待放数据的协程"对应的 `Future` 对象。当队列已满、有协程 `await q.put(item)` 时，会创建一个 `Future` 挂到这里，协程 `await` 这个 `Future` 而挂起，待消费者取走数据腾出空间后被唤醒。

另外还有两个计数相关字段：

- `self._maxsize`：容量上限。
- `self._unfinished_tasks`：未完成任务计数器，初始 0。`put` 放入元素时加一，`task_done` 调用时减一，归零时唤醒所有 `join` 的等待者。
- `self._finished`：一个 `Event`，`_unfinished_tasks` 归零时 `set`，`join` 就是 `await` 这个 `Event`。

**几个结构的关系**

用一张表概括：

| 结构 | 类型 | 作用 |
| --- | --- | --- |
| `_queue` | `deque` | 真正存数据 |
| `_getters` | `deque[Future]` | 等待取数据的协程队列 |
| `_putters` | `deque[Future]` | 等待放数据的协程队列 |
| `_unfinished_tasks` | `int` | 未完成任务计数 |
| `_finished` | `Event` | join 的等待事件 |
| `_maxsize` | `int` | 容量上限 |

理解了这几个结构，`put`/`get`/`task_done`/`join` 的行为就都能推导出来。

### 4.2 put 的内部流程：满则挂起、否则放入并唤醒等待的 getter

当协程执行 `await q.put(item)` 时，`Queue.put` 内部大致经历以下步骤：

1. 如果当前队列未满（`qsize() < maxsize` 或 `maxsize <= 0`）：
   - 把 `item` `append` 到 `self._queue`。
   - 调用 `self._wakeup_next(self._getters)`：从 `_getters` 里取出第一个等待的 getter Future，`set_result(None)` 唤醒它——告知"有数据可取了"。
   - `_unfinished_tasks` 加一（注意：是放入 `_queue` 时加一，不是被 get 时加一）。
   - 立即返回（不挂起）。
2. 如果当前队列已满：
   - 创建一个新 `Future`，`append` 到 `self._putters`。
   - `await` 这个 `Future`，当前协程挂起，让出事件循环。
   - 等到被唤醒（消费者取走数据后调用 `_wakeup_next(self._putters)` 把这个 Future `set_result(None)`），协程恢复执行。
   - 恢复后，由于挂起期间队列状态可能变化，会重新判断是否仍能放入，循环直到成功放入。

`_wakeup_next` 是一个内部方法，它的逻辑是从传入的等待者 `deque` 里 `popleft` 出第一个 Future，调用其 `set_result(None)`（不传实际数据，只是"唤醒"信号）。被唤醒的协程从 `await` 处恢复，重新检查队列状态。

**为什么唤醒时要重新判断**

被唤醒不等于"现在一定能放入"——因为挂起期间可能有别的协程抢先。所以 `put` 的实现是一个循环：尝试放、放不进就 await Future、被唤醒后再尝试放，直到成功。这种"检查-等待-再检查"的循环是异步协调的标准模式，避免了"唤醒时条件已变"导致的竞态。

### 4.3 get 的内部流程：空则挂起、否则取出并唤醒等待的 putter

`await q.get()` 的流程与 `put` 对称：

1. 如果当前队列非空（`qsize() > 0`）：
   - 从 `self._queue` `popleft` 取出第一个元素。
   - 调用 `self._wakeup_next(self._putters)`：如果有生产者正因"队列满"而等待，唤醒第一个 putter——告知"有空间了"。
   - 返回取出的元素。
2. 如果当前队列为空：
   - 创建一个新 `Future`，`append` 到 `self._getters`。
   - `await` 这个 `Future`，当前协程挂起。
   - 等到被唤醒（生产者 `put` 后调用 `_wakeup_next(self._getters)` 唤醒），协程恢复。
   - 恢复后重新判断，可能直接取到数据，也可能仍空（多个 getter 被同时唤醒时的竞争），循环直到成功取到。

**get 不直接给被唤醒者传数据**

注意 `_wakeup_next` 只是 `set_result(None)`，并没有把"放入的元素"直接塞给 getter。被唤醒的 getter 恢复后，自己去 `_queue` 里 `popleft` 取数据。这种设计避免了"数据穿过 Future 传递"的复杂性，Future 只负责"叫醒你"，取数据仍由协程自己从 `_queue` 做——而这是单线程顺序执行，不会有竞态。

### 4.4 单线程事件循环为何无竞态、无需锁

`asyncio.Queue` 内部没有任何 `threading.Lock`。这不是疏忽，而是因为**asyncio 的事件循环是单线程的**。

在单线程事件循环里，协程的执行是"协作式"的：一个协程在执行同步代码段（不 `await`）时，不会被其他协程打断。只有当它 `await` 让出控制权时，事件循环才会切到别的协程。所以：

- `put` 里"判断未满 → append 到 `_queue` → 唤醒 getter → `_unfinished_tasks += 1`"这一串操作，中间没有 `await`，是原子的，不会被其他协程插入。
- `get` 里"判断非空 → popleft → 唤醒 putter → 返回"同样原子。
- 唯一会"让出"的点是"队列满/空时 await Future 挂起"，但挂起前已经把等待者加进了 `_putters`/`_getters`，挂起期间其他协程的操作会正确地唤醒它。

对比 `queue.Queue`：它面向多线程，多个线程可能"同时"访问队列内部数据，必须用 `Lock`/`Condition` 保护每一个操作。而 asyncio 单线程下，"同时"只发生在 `await` 点，只要在每个"不 await 的代码段"内保持一致性，就不需要锁。

**一个推论：不要在 asyncio.Queue 的操作里混入阻塞调用**

如果你在"判断队列状态"和"操作队列"之间插入了 `time.sleep(0.01)` 这种同步阻塞，虽然不会引入竞态（仍是单线程），但会阻塞事件循环、让其他协程无法推进，破坏异步模型。而如果你插入了 `await asyncio.sleep(0.01)`，那就是让出了事件循环，其他协程可能插入执行——但只要你的操作符合"检查-等待-再检查"的循环模式，仍能正确工作。`asyncio.Queue` 内部就是这么设计的。

### 4.5 task_done 与 join 的计数器机制

`_unfinished_tasks` 计数器的生命周期：

- `Queue.__init__` 时为 0。
- 每次 `put` 成功放入一个元素，`_unfinished_tasks += 1`。
- 每次 `task_done()` 被调用，`_unfinished_tasks -= 1`；如果减到 0，`set` 内部的 `_finished` 事件，唤醒所有 `await q.join()` 的协程。
- 如果 `task_done` 调用次数超过实际 `put` 次数（计数器已经是 0 还要减），抛 `ValueError`。

`join` 的实现非常简单：`await self._finished.wait()`。`_finished` 是一个 `asyncio.Event`，初始未 set，`_unfinished_tasks` 归零时 set。`Event.wait()` 在未 set 时挂起协程、set 后唤醒，所以 `join` 就是"等到计数器归零"。

**为什么 put 时加一、而不是 get 时加一**

关键在于"任务"的定义：一个元素从被 `put` 入队那一刻起，就是一个"待处理任务"，直到被消费者 `task_done` 才算"已处理"。`get` 只是把元素从队列里取走，不代表"处理完了"——消费者可能还要花时间处理。所以计数器在 `put` 时加一（标记任务产生），在 `task_done` 时减一（标记任务完成），与 `get` 无关。这样设计允许"取出后花任意时间处理，处理完再 task_done"，而 `join` 等待的是"真正处理完"而非"取走"。

**一个具体的数据流**

用一个小例子跟踪计数器变化：

```python
import asyncio


async def main():
    q = asyncio.Queue()
    print("初始 _unfinished_tasks:", q._unfinished_tasks)  # 0

    await q.put("a")
    print("put a 后:", q._unfinished_tasks)  # 1
    await q.put("b")
    print("put b 后:", q._unfinished_tasks)  # 2

    item1 = await q.get()
    print("get 出 a 后（未 task_done）:", q._unfinished_tasks)  # 2，get 不改计数
    q.task_done()
    print("task_done a 后:", q._unfinished_tasks)  # 1

    item2 = await q.get()
    q.task_done()
    print("task_done b 后:", q._unfinished_tasks)  # 0，归零会 set _finished


asyncio.run(main())
```

```
# 输出：
# 初始 _unfinished_tasks: 0
# put a 后: 1
# put b 后: 2
# get 出 a 后（未 task_done）: 2
# task_done a 后: 1
# task_done b 后: 0
```

（注：`_unfinished_tasks` 是内部属性，这里为演示原理直接访问；生产代码不要依赖内部属性，用 `qsize`/`empty`/`full`/`join` 等公开 API 即可。）

### 4.6 _wakeup_next：唤醒对端等待者

`_wakeup_next(commons)` 是 `asyncio.Queue` 的核心协调方法。它的实现很短：

```python
def _wakeup_next(self, waiters):
    # 唤醒等待者队列里的第一个，若空则什么都不做
    while waiters:
        waiter = waiters.popleft()
        if not waiter.done():
            waiter.set_result(None)
            break
```

关键点：

- 从 `waiters`（`_getters` 或 `_putters`）左端取出第一个 Future。
- 如果它已经被取消（`done()` 返回 `True`），跳过取下一个——因为等待它的协程可能已经被 `cancel`，唤醒它没意义。
- 找到未完成的 Future，`set_result(None)` 唤醒它，然后 `break`——每次只唤醒一个，不广播。这是合理的：`put` 放入一个元素只够满足一个 getter，唤醒多个反而产生无效竞争。

**put 唤醒 getter、get 唤醒 putter**

- 生产者 `put` 成功放入后，调用 `_wakeup_next(self._getters)`——告诉等待取数据的消费者"有新数据了"。
- 消费者 `get` 成功取出后，调用 `_wakeup_next(self._putters)`——告诉等待放数据的生产者"有空位了"。

这种"操作完唤醒对端"的模式，保证了等待者不会错过信号：只要发生了对端期待的事件（有数据/有空位），就一定有人被唤醒。而"唤醒后重新检查"的循环保证了被唤醒者不会因为"信号过期"而误操作。

### 4.7 PriorityQueue 与 LifoQueue 的内部差异

`PriorityQueue` 和 `LifoQueue` 都是 `Queue` 的子类，只覆盖了"存取数据"的方式，等待者/计数器机制完全继承自 `Queue`。

**PriorityQueue**

`PriorityQueue` 把 `self._queue` 从 `deque` 换成 `list`，用 `heapq` 维护小顶堆：

- `put` 时 `heapq.heappush(self._queue, item)`，按元素大小维护堆序。
- `get` 时 `heapq.heappop(self._queue)`，取出最小的元素。

所以"优先级低（小）的先出"。等待者机制不变：满则挂 putter、空则挂 getter。

**LifoQueue**

`LifoQueue` 仍用 `deque`，但 `get` 时用 `deque.pop()`（取右端）代替 `Queue` 的 `popleft()`（取左端）。这样最后放入的元素最先被取出，即后进先出。等待者机制同样不变。

**为什么变体这么容易实现**

因为 `asyncio.Queue` 的"协调"逻辑（等待者管理、背压、task_done/join）与"存取顺序"是解耦的：前者由基类 `Queue` 统一处理，后者只需覆盖 `put`/`get` 里"怎么把数据放进 `_queue`/怎么从 `_queue` 取出"这一小段。这是好的抽象分层：协调机制复用，存取策略可变。

### 4.8 异步流水线的协程调度视角

把"Queue + 多个 create_task"的整体运转从事件循环调度角度梳理一遍，有助于理解"协程是怎么通过队列协作的"。

假设有 1 个生产者、2 个消费者共享一个 `Queue(maxsize=2)`，事件循环里大致这样推进：

1. 三个协程都被 `create_task` 加入事件循环就绪队列。
2. 事件循环挑生产者跑：它 `await q.put(item0)`，队列空、未满，立即放入，唤醒 `_getters`（此刻空，无操作），返回。生产者继续 `put(item1)`，放入，返回。生产者 `put(item2)`，队列已满（maxsize=2），创建 Future 挂到 `_putters`，`await` 它，让出事件循环。
3. 事件循环挑消费者 A 跑：`await q.get()`，队列非空，取出 item0，唤醒 `_putters`（生产者的 Future 被 set_result），返回 item0。消费者 A 处理 item0，遇到 `await asyncio.sleep` 让出。
4. 事件循环回到生产者：它的 `await Future` 已被 set，恢复执行，重新判断队列，发现仍满（item1 还在、item0 取走后又 put 了 item2），于是 item2 已放入……整个过程在"让出-恢复-判断-操作"中循环推进。

从这个视角能看到几个要点：

- **队列不是"推送"数据，而是"协调"协程**：数据始终在 `_queue` 里被动等取，协程通过"挂起/唤醒"主动来取或放。
- **背压是"挂起生产者"实现的**：不是队列主动拒绝，而是生产者 `await Future` 让出循环，等消费者腾空间后才恢复。
- **多消费者天然负载均衡**：哪个消费者先 `get` 到就先处理，事件循环按就绪顺序调度，不需要额外分配逻辑。

### 4.9 原理小结：协程协调的本质

把第 4 章所有机制浓缩成一句话：**`asyncio.Queue` 用一个 deque 存数据、用两个 Future 等待者队列协调生产者和消费者的节奏、用一个计数器跟踪任务完成，全部在单线程事件循环里协作执行，无需锁。**

- 存数据：`_queue`（deque/heap），存取规则决定 FIFO/优先级/LIFO。
- 协调节奏：`_getters`（空则等）、`_putters`（满则等），`_wakeup_next` 在对端操作后唤醒一个等待者，等待者恢复后重新检查。
- 跟踪完成：`_unfinished_tasks`（put 加一、task_done 减一），归零时 `_finished` 事件 set，唤醒 `join`。
- 无锁：单线程事件循环里，不 `await` 的代码段原子执行，天然无竞态。

理解了这套机制，你就能准确预判 `asyncio.Queue` 在各种场景下的行为：为什么满时 put 会等、为什么空时 get 会等、为什么漏 task_done 会让 join 卡死、为什么单消费者也可能与生产者并发——这些都是上述机制的直接推论。

## 5. 总结

### 5.1 本文内容要点

- `asyncio.Queue(maxsize=0)` 是协程间安全传递数据的异步队列，是构建生产者-消费者模型、任务池、异步流水线的基石。`maxsize=0` 无上限、`maxsize=N` 限制容量产生背压。
- `await q.put(item)` 入队，满则挂起协程让出事件循环；`await q.get()` 出队，空则挂起等待。对应有 `put_nowait`/`get_nowait` 的非阻塞版本，满/空时抛 `QueueFull`/`QueueEmpty`。
- `qsize`/`empty`/`full` 查询当前状态，但在多协程并发下并非原子判断，需要"有就取/能放就放"语义时优先用 `nowait` 版本配异常处理。
- `q.task_done()` 配合 `await q.join()` 跟踪任务处理进度：put 时内部计数器加一、task_done 时减一、归零时唤醒 join。漏调 task_done 会让 join 永远等待，推荐 try/finally 保证调用。
- 典型模式：单/多生产者 put、多消费者 get 并发处理；maxsize 形成背压防止内存爆；PriorityQueue 按优先级出队、LifoQueue 后进先出；Queue + create_task 串联多个阶段构建异步流水线。
- 与 `queue.Queue` 的本质区别：后者阻塞线程、内部加锁，面向多线程；前者用 await 让出事件循环、单线程无锁，面向协程。两者不能混用，asyncio 程序里一律用 `asyncio.Queue`。
- 原理上，`asyncio.Queue` 内部用一个 deque 存数据、两个 Future 等待者队列（getters/putters）协调节奏、一个计数器 + Event 跟踪任务完成。put 满则挂 putter、get 空则挂 getter，对端操作后用 `_wakeup_next` 唤醒一个等待者，等待者恢复后重新检查。单线程事件循环下不 await 的代码段原子执行，故无需锁。PriorityQueue/LifoQueue 只覆盖存取方式，协调机制完全继承自 Queue。

### 5.2 读完应能掌握

- 能用 `asyncio.Queue` 搭建单/多生产者、多消费者的生产者-消费者模型，正确使用 `await put`/`await get`/`task_done`/`join`，并知道漏调 `task_done` 的后果。
- 能根据业务速率选择是否设置 `maxsize` 及其大小，解释背压如何防止内存膨胀，能用 `put_nowait`/`get_nowait` 处理"非阻塞投递/取走"的语义。
- 能用 `PriorityQueue` 按优先级处理任务（含同优先级用计数器避坑），用 `LifoQueue` 实现"最新优先"语义，并说明三者的出队顺序差异。
- 能用 Queue + create_task 构建多阶段异步流水线（下载-解析-入库等），让各阶段并发推进，并正确关闭消费者（哨兵或 cancel）。
- 能解释 `asyncio.Queue` 与 `queue.Queue` 在并发模型、等待方式、是否加锁上的根本区别，说明为何不能在 asyncio 里用 `queue.Queue`。
- 能描述 `asyncio.Queue` 的内部结构（deque + getters + putters + 未完成计数器 + Event），说清 put/get/task_done/join 各自如何操作这些结构、为何单线程无需锁。