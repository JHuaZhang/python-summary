---
group:
  title: 【18】异步协程
  order: 18
order: 12
title: asyncio.Lock 异步锁
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 asyncio.Lock

`asyncio.Lock` 是 Python `asyncio` 标准库提供的异步锁，是 asyncio 同步原语家族中最基础的一个。它的外在用法和 `threading.Lock` 几乎一模一样——加锁进入临界区、解锁退出——但内在运行机制完全不同：`threading.Lock` 阻塞的是线程，而 `asyncio.Lock` 阻塞的是协程，前者会让线程原地空转（或睡眠），后者则通过 `await` 把控制权让回事件循环，让循环继续跑别的协程。

很多人第一次接触 `asyncio.Lock` 时都会产生一个直觉上的疑问：**asyncio 跑在单线程事件循环里，协程之间又不是真的并行执行，既然没有真正的并发，为什么还需要锁？** 这个疑问非常关键，因为它直接关系到"什么时候该加锁、什么时候不必加锁"的判断。一句话回答：单线程事件循环确实消除了抢占式并行的竞态，但协程之间的 `await` 点构成"协作式切换点"，如果一个协程在访问共享资源的过程中 `await` 让出了控制权，另一个协程就可能中途插入、踩到前一个协程还没完成的"读-改-写"序列，造成数据错乱——这就是所谓的**协议级竞态**。`asyncio.Lock` 的作用正是把跨 `await` 的临界区保护起来，保证同一时刻只有一个协程在里面。

`asyncio.Lock` 的核心 API 一共就几个：

- `async with lock:` —— 最推荐的用法，上下文管理器自动 acquire / release。
- `await lock.acquire()` / `lock.release()` —— 手动配对使用。
- `lock.locked()` —— 查询当前是否被持有。
- `await lock.acquire()` 内部若竞争失败会挂起当前协程，排进等待队列，`release()` 时唤醒队首。

除了 `Lock`，`asyncio` 还提供了一整套同步原语：`Semaphore`（信号量，限制并发数）、`Event`（事件通知）、`Condition`（条件变量）。本篇会以 `Lock` 为主，把其余三个一并讲透。

### 1.2 基础语法与最小用法

`asyncio.Lock` 必须在事件循环内创建和使用（从 Python 3.10 起不再要求显式绑定 loop，但底层仍依赖运行中的循环）。最基础、也是最常见的用法是配合 `async with`：

```python
import asyncio

async def worker(lock, name):
    async with lock:
        # 临界区：同一时刻只有一个协程能进入这里
        print(f"[{name}] 进入临界区")
        await asyncio.sleep(0.1)   # 即便在这里 await 让出，别的协程也进不来
        print(f"[{name}] 离开临界区")

async def main():
    lock = asyncio.Lock()
    await asyncio.gather(worker(lock, "A"), worker(lock, "B"))

asyncio.run(main())
# 输出：
# [A] 进入临界区
# [A] 离开临界区
# [B] 进入临界区
# [B] 离开临界区
```

上面这段代码体现了两点：第一，`async with lock:` 确保了 A 没离开临界区之前 B 无法进入，两个协程严格串行地访问临界区；第二，即便 A 在临界区内 `await asyncio.sleep(0.1)` 触发了协程切换，B 也拿不到锁、只能原地等待——这正是 `asyncio.Lock` 想要的效果。

如果不用 `async with`，手动 `acquire` / `release` 也是等价的，但要自己处理异常时的释放：

```python
lock = asyncio.Lock()

await lock.acquire()
try:
    # 临界区
    ...
finally:
    lock.release()
```

`async with` 的好处就是 `finally` 的事它替你做了。

**手动配对忘记释放的后果**

手动 `acquire/release` 最容易出的坑就是中间抛异常导致锁永远不释放，所有后续等待者集体死等：

```python
import asyncio

async def leaky(lock):
    await lock.acquire()
    # 假设这里出异常了，比如除零、键错、网络错
    x = 1 / 0
    lock.release()            # 永远到不了

async def waiter(lock, name):
    await lock.acquire()      # 永远拿不到
    print(f"{name} 拿到锁")

async def main():
    lock = asyncio.Lock()
    # leaky 抛 ZeroDivisionError 后锁没释放，waiter 永久阻塞
    await asyncio.gather(leaky(lock), waiter(lock, "B"), return_exceptions=True)
    print("main 结束，但 B 还在死等")

asyncio.run(main())
# 输出：
# main 结束，但 B 还在死等
```

把 `acquire/release` 换成 `async with lock:` 即可彻底杜绝这类泄漏——`__aexit__` 在异常路径上也会执行 `release`。

---

## 2. 核心内容

### 2.1 为什么单线程协程也需要锁：协议级竞态

在讲 `asyncio.Lock` 的具体 API 之前，先把这个最根本的问题讲透——不理解它，后面所有用法都是空中楼阁。

**线程模型下的竞态**

在多线程模型里，多个线程真正并行跑在多个 CPU 核上（或被操作系统抢占式调度），两个线程可能同时读到同一个旧值、各自加一、各自写回，结果丢了一次更新。这种竞态是抢占式并行带来的，`threading.Lock` 通过阻塞线程来互斥。

**asyncio 模型下没有真正并行**

asyncio 跑在单线程事件循环里，任何时刻只有一个协程在真正执行 Python 代码。协程之间的切换不是操作系统抢占，而是协程自己主动 `await` 时让出控制权。所以"两个协程同时执行同一条语句"这种事永远不会发生。

**那为什么还有竞态？**

问题出在"读-改-写"这样的非原子序列跨越了 `await`。看一个最典型的例子——共享计数器自增：

```python
import asyncio

counter = 0

async def increment(n):
    global counter
    for _ in range(n):
        cur = counter            # 1. 读
        await asyncio.sleep(0)   #    ← 这里切换了！cur 还是旧值
        counter = cur + 1        # 2. 写：基于旧值写回，别的协程的更新被覆盖

async def main():
    global counter
    counter = 0
    # 两个协程各做 1000 次自增，正确结果应是 2000
    await asyncio.gather(increment(1000), increment(1000))
    print(f"最终计数: {counter}")
    # 期望 2000，实际经常小于 2000（如 1000、1234 等）

asyncio.run(main())
# 输出：
# 最终计数: 1000   （具体数字不确定，但几乎总是小于 2000）
```

这里的罪魁不是"两个协程同时写"，而是：协程 A 读到 `cur=5`，然后 `await asyncio.sleep(0)` 让出；协程 B 也读到 `cur=5`，算出 `6` 写回；控制权回到 A，A 还拿着旧值 `cur=5`，算出 `6` 写回——B 的更新被覆盖了，丢了一次自增。

整个过程没有任何一秒钟两个协程是"同时"执行的，但在 `await` 点发生的上下文切换让它们的操作交错穿插，产生了和真正并发一样的后果。这就是**协议级竞态**：危险不来自并行，而来自协程间操作序列在 `await` 点的交错。

**判断准则**

是否需要加锁，看的是"一段访问共享资源的代码是不是跨越了 `await`"。如果整个读写都在一条语句、一个不 `await` 的函数里完成（比如 `counter += 1` 这种纯同步代码），单线程下它是原子的，不需要锁；一旦中间夹了 `await`，你就处在一个可以被任意打断的窗口里，就需要锁。

### 2.2 asyncio.Lock 的基本用法：async with 与 acquire/release

**`async with lock:`**

这是最推荐、最常见的用法。`async with` 会先 `await lock.acquire()`，拿到锁后执行代码块，无论代码块正常结束还是抛异常，都会在退出时自动 `lock.release()`。

```python
import asyncio

async def task(lock, tid):
    async with lock:
        print(f"任务 {tid} 拿到锁，开始工作")
        await asyncio.sleep(0.05)
        print(f"任务 {tid} 完成工作，释放锁")

async def main():
    lock = asyncio.Lock()
    await asyncio.gather(*(task(lock, i) for i in range(3)))

asyncio.run(main())
# 输出：
# 任务 0 拿到锁，开始工作
# 任务 0 完成工作，释放锁
# 任务 1 拿到锁，开始工作
# 任务 1 完成工作，释放锁
# 任务 2 拿到锁，开始工作
# 任务 2 完成工作，释放锁
```

注意输出顺序：0、1、2 严格串行。三个协程被 `gather` 一起启动，但谁先抢到锁谁先跑——通常按 gather 的顺序，但调度实现不保证这个顺序，业务代码不能依赖顺序，只能依赖互斥。

**`await lock.acquire()` + `lock.release()`**

手动配对的写法。和 `async with` 等价，但更适合需要在拿到锁之后、释放之前做一些其它 `await`、或者锁的持有边界和某个复杂控制流绑定的场景。要点是必须配对，且建议 `try/finally`：

```python
import asyncio

async def transfer(account_from, account_to, amount, lock):
    await lock.acquire()
    try:
        # 跨越多个 await 的转账逻辑，整段都是临界区
        balance_from = await account_from.get_balance()
        if balance_from < amount:
            raise ValueError("余额不足")
        await account_from.debit(amount)        # await：扣款
        await account_to.credit(amount)         # await：到账
    finally:
        lock.release()
```

这里把"查余额-扣款-到账"这串跨多个 `await` 的操作整体包在锁里，保证转账过程中两个账户不会被别的协程同时改动。如果不用 `finally`，一旦 `debit` 抛异常，锁就永远释放不了，其它协程全部死等——这正是 `async with` 要替你解决的事，所以能用 `async with` 就别手动配对。

**`lock.locked()`**

非协程方法，返回当前锁是否被持有。一般用于诊断、日志、或者"拿不到就跳过"的快速尝试：

```python
import asyncio

async def main():
    lock = asyncio.Lock()
    print(lock.locked())   # False

    async with lock:
        print(lock.locked())   # True
    # 退出后
    print(lock.locked())   # False

asyncio.run(main())
# 输出：
# False
# True
# False
```

注意 `locked()` 只能告诉你"此刻是否被持有"，不能用来"判断后安全地拿锁"——因为判断完和 `acquire` 之间可能发生切换，存在 TOCTOU（check-then-act）问题。需要无阻塞地尝试获取，要么用 `acquire` 配合超时（见下），要么用 `asyncio.wait_for`。

### 2.3 用 asyncio.Lock 修复共享计数器竞态

把 2.1 里那个丢更新的例子用 `asyncio.Lock` 包起来，看看效果：

```python
import asyncio

counter = 0

async def increment(lock, n):
    global counter
    for _ in range(n):
        async with lock:
            cur = counter
            await asyncio.sleep(0)   # 即便这里切换，别的协程也进不来临界区
            counter = cur + 1

async def main():
    global counter
    counter = 0
    lock = asyncio.Lock()
    await asyncio.gather(increment(lock, 1000), increment(lock, 1000))
    print(f"最终计数: {counter}")

asyncio.run(main())
# 输出：
# 最终计数: 2000
```

加了锁之后结果稳定为 2000。原理是：协程 A 进入临界区后即便 `await` 让出，协程 B 在 `async with lock` 处也拿不到锁（`acquire` 会把它挂起、排进等待队列），只能等 A `release` 之后被唤醒。所以"读-改-写"序列不再被打断。

**一个重要权衡**

注意上面这个例子其实在业务上是过度使用锁的——`await asyncio.sleep(0)` 只是为了人为制造切换点。如果真实代码里只是 `counter += 1` 这种不跨 `await` 的纯同步操作，它在单线程下本来就是原子的，根本不需要锁。把锁加在本来就不需要的地方，只会白白增加协程串行化、损失并发性能。判断准则始终是：**临界区是否跨越 `await`、是否会被别的协程踩到**。

### 2.4 acquire 的超时与取消

`await lock.acquire()` 如果拿不到锁会一直挂起，和所有 `await` 一样可以被取消（`task.cancel()`）。想"等一段时间拿不到就放弃"，标准做法是用 `asyncio.wait_for`：

```python
import asyncio

async def holder(lock):
    async with lock:
        await asyncio.sleep(2)
        print("持有者释放锁")

async def impatient(lock):
    try:
        await asyncio.wait_for(lock.acquire(), timeout=0.5)
    except asyncio.TimeoutError:
        print("等了 0.5 秒还是拿不到，放弃")
        return
    try:
        print("不耐烦协程拿到锁，干活")
    finally:
        lock.release()

async def main():
    lock = asyncio.Lock()
    await asyncio.gather(holder(lock), impatient(lock))

asyncio.run(main())
# 输出：
# 等了 0.5 秒还是拿不到，放弃
# 持有者释放锁
```

`asyncio.wait_for` 在超时时会给内部 `acquire` 协程发 `CancelledError`，`acquire` 内部会保证把自己从等待队列里摘掉，不会留下"幽灵等待者"。这点是手动实现超时时要特别注意的——永远别用裸 `asyncio.sleep` + 标志位去模拟超时锁，`asyncio.wait_for` 已经把取消时的队列清理做对了。

### 2.5 asyncio.Lock 与 threading.Lock 的区别

这一节是理解 `asyncio.Lock` 的关键。表面看两者都是"互斥锁"，但运行模型截然不同。

**阻塞对象不同**

`threading.Lock.acquire()` 阻塞的是**线程**：调用线程被操作系统挂起，不消耗 CPU，但也不干别的，直到 `release` 唤醒它。在 asyncio 单线程环境里，线程就是事件循环本身——如果线程阻塞了，整个事件循环就卡死，所有协程全部无法推进。这是为什么**绝不能在 asyncio 代码里用 `threading.Lock`**：

```python
import asyncio
import threading

lock = threading.Lock()

async def bad():
    lock.acquire()                 # 同步阻塞：事件循环被卡住
    await asyncio.sleep(0.1)       # 此时别的协程全部动不了
    lock.release()

async def main():
    # 即便以为加了锁"安全"，实际上整个循环在 acquire 处可能被冻结
    await asyncio.gather(bad(), bad())

asyncio.run(main())
# 这个例子不会立刻出错，但一旦某协程持锁等待、另一协程也想 acquire，
# 第二个 acquire 调用会阻塞事件循环线程本身——所有协程停摆，形成死锁态。
```

`asyncio.Lock.acquire()` 是协程方法，拿不到锁时通过 `await` 把控制权让回事件循环，循环继续跑别的协程，等待者只是被挂在等待队列里、状态机置为挂起，不占用线程。所以 `asyncio.Lock` "等"的过程是让出、不是阻塞。

**不跨线程**

`asyncio.Lock` 设计于单线程事件循环环境，不保证跨线程安全。如果多个线程各自跑事件循环、都需要操作某个共享状态，应该用 `threading.Lock`（或 `asyncio` 的 `loop.run_in_executor` 桥接），而不是把 `asyncio.Lock` 传到多线程里用。

**对比表**

| 维度 | `threading.Lock` | `asyncio.Lock` |
|---|---|---|
| 阻塞对象 | 线程 | 协程（不阻塞线程） |
| 获取方式 | `lock.acquire()`（同步） | `await lock.acquire()`（协程） |
| 等待时行为 | 线程挂起、空转或睡眠 | 协程让出控制权、事件循环继续跑别的协程 |
| 适用场景 | 多线程互斥 | 单线程多协程互斥 |
| 能否在 async 里用 | 否（会阻塞事件循环） | 是 |
| 能否跨线程共享 | 是 | 否（设计上单线程） |
| 上下文管理器 | `with lock:` | `async with lock:` |

记住一句话：**asyncio 世界里一切阻塞都应当通过 `await` 让出，而不是让线程原地卡住。** `threading.Lock` 违反这条原则，所以在 asyncio 里禁用。

### 2.6 asyncio.Semaphore：限制并发数

`asyncio.Semaphore` 是信号量，内部维护一个计数器，初始值代表"最多同时允许多少个协程持有"。`acquire` 时计数减一、用完 `release` 加一；计数到 0 时再 `acquire` 会被挂起、排队等待。

**典型场景：限制并发请求数**

爬虫、批量 API 调用最常见的限制就是"同时最多 N 个请求"，多了会被对方限流或扛不住自己机器资源。

```python
import asyncio
import random

async def fetch(sem, url):
    async with sem:                        # 同时最多 3 个协程能进到这里
        print(f"开始抓取 {url}")
        await asyncio.sleep(random.uniform(0.2, 0.6))   # 模拟网络
        print(f"完成抓取 {url}")
        return f"内容-{url}"

async def main():
    sem = asyncio.Semaphore(3)             # 并发上限 3
    urls = [f"url-{i}" for i in range(10)]
    results = await asyncio.gather(*(fetch(sem, u) for u in urls))
    print(f"全部完成，共 {len(results)} 条")

asyncio.run(main())
# 输出：前 3 个几乎同时开始，每完成一个再放下一个进来，全程同时在跑的不超过 3 个
# 开始抓取 url-0
# 开始抓取 url-1
# 开始抓取 url-2
# 完成抓取 url-1
# 开始抓取 url-3
# ...
# 全部完成，共 10 条
```

和 `Lock` 的区别：`Lock` 是 `Semaphore(1)` 的特例，只允许 1 个进入；`Semaphore(N)` 允许 N 个并发。你可以把 Semaphore 想象成"有 N 个名额的候客厅"。

**Semaphore 不等于 Lock**

不要为了"限制并发"误用 `Lock`：`Lock` 是一次性单名额，效果是把并发完全串行化（≈并发 1）；想要并发 N 就用 `Semaphore(N)`。反过来，`Semaphore(1)` 虽然行为上等价于 `Lock`，但语义是信号量，读代码的人看到 `Semaphore` 会预期"允许多个并发"，看到 `Lock` 会预期"互斥单进"，所以需要互斥就用 `Lock`，需要限流就用 `Semaphore`，不是 N=1 就图省事用 Semaphore。

**复用同一把信号量**

信号量通常在批任务开始时创建、在整个任务批次内复用，不要每次 fetch 里 new 一把新信号量——那样每把信号量都是满的，起不到任何限制作用：

```python
# 错误：每协程各自一把 Semaphore，名额互不影响，等于没限流
async def fetch_bad(url):
    sem = asyncio.Semaphore(3)   # ← 每次都是全新的 3 个名额
    async with sem:
        ...

# 正确：共享一把
async def fetch_good(sem, url):
    async with sem:
        ...
```

### 2.7 asyncio.Event：事件通知

`asyncio.Event` 是一个"一次性事件门"：内部维护一个标志位，`set()` 把标志置位、所有正在 `await event.wait()` 的协程被唤醒；`clear()` 复位。和 `Lock` 处理互斥不同，`Event` 处理"等待某个条件发生"。

**典型场景：协调协程启动**

比如一组 worker 必须等初始化完成（数据库连接、配置加载）之后才能开始干活：

```python
import asyncio

ready = asyncio.Event()

async def worker(name):
    print(f"{name} 等待就绪信号")
    await ready.wait()                # 阻塞直到有人 event.set()
    print(f"{name} 收到信号，开始干活")

async def bootstrap():
    print("开始初始化...")
    await asyncio.sleep(0.5)          # 模拟加载配置、连数据库
    print("初始化完成，发送就绪信号")
    ready.set()                       # 一次性唤醒所有等在 wait() 的协程

async def main():
    await asyncio.gather(
        worker("A"), worker("B"), worker("C"), bootstrap()
    )

asyncio.run(main())
# 输出：
# A 等待就绪信号
# B 等待就绪信号
# C 等待就绪信号
# 开始初始化...
# 初始化完成，发送就绪信号
# A 收到信号，开始干活
# B 收到信号，开始干活
# C 收到信号，开始干活
```

Event 是"广播唤醒"：一次 `set()` 把所有等待者都唤醒。`wait()` 在 set 之后会立即返回（标志位仍为真）。如果想反复用，需要 `clear()` 复位再 `set`。

**Event 与 Lock 的语义差异**

- `Lock`：保护一段临界区，"只能一个进"。
- `Event`：通知一个条件已成立，"等都等到"。

混用目的不同：要的是"互斥"就别用 Event 凑数，要的是"等信号"就别用 Lock。

### 2.8 asyncio.Condition：条件变量

`asyncio.Condition` 把 Lock 和 Event 的能力合起来：它内部自带一把锁，同时提供 `notify` / `notify_all` / `wait`。典型用法是"拿到锁、检查条件、条件不满足就 `wait`（会自动释放锁并挂起；被 `notify` 唤醒后重新拿锁继续）"。

**典型场景：生产者-消费者**

```python
import asyncio

queue = []
MAX = 3
cond = asyncio.Condition()

async def producer():
    for i in range(6):
        async with cond:
            while len(queue) >= MAX:
                await cond.wait()           # 满了就等，自动释放锁
            queue.append(i)
            print(f"生产 {i}，队列={queue}")
            cond.notify_all()               # 通知消费者
        await asyncio.sleep(0.1)

async def consumer(name):
    while True:
        async with cond:
            while not queue:
                await cond.wait()           # 空了就等
            item = queue.pop(0)
            print(f"  {name} 消费 {item}，队列={queue}")
            cond.notify_all()               # 通知生产者（可能空出位置了）
        await asyncio.sleep(0.15)

async def main():
    await asyncio.gather(producer(), consumer("C1"), consumer("C2"))

asyncio.run(main())
# 输出：生产与消费交错，队列长度始终在 0~3 之间波动
# 生产 0，队列=[0]
#   C1 消费 0，队列=[]
# 生产 1，队列=[1]
#   C2 消费 1，队列=[]
# 生产 2，队列=[2]
# 生产 3，队列=[2, 3]
#   C1 消费 2，队列=[3]
# 生产 4，队列=[3, 4]
#   C2 消费 3，队列=[4]
# 生产 5，队列=[4, 5]
#   C1 消费 4，队列=[5]
#   C2 消费 5，队列=[]
```

关键点：`await cond.wait()` 必须在 `async with cond` 内调用，且要用 `while` 循环重新检查条件（不能 `if`），因为被唤醒时别人可能已经把队列又抢空了——这就是"条件变量经典用法"，在 asyncio 里完全一致。

### 2.9 四种同步原语速查对比

| 原语 | 核心状态 | 典型场景 | 关键 API |
|---|---|---|---|
| `Lock` | 持有 / 未持有 | 临界区互斥（一次一个） | `async with lock` / `acquire` / `release` |
| `Semaphore` | 计数器（初始 N） | 限制并发数（同时 N 个） | `async with sem` / `acquire` / `release` |
| `Event` | 标志位 | "等就绪信号"广播 | `set` / `clear` / `wait` |
| `Condition` | 锁 + 标志 | 生产-消费者、条件等待 | `async with` / `wait` / `notify` / `notify_all` |

选择口诀：**互斥用 Lock，限流用 Semaphore，等信号用 Event，等条件用 Condition。**

### 2.10 综合示例：带限流与互斥的批量抓取

把 Lock、Semaphore、Event 三者组合起来，看一个接近真实工程的场景：启动前等配置就绪（Event）、并发上限 3（Semaphore）、对共享的"已抓取计数"加锁更新（Lock）。

```python
import asyncio
import random

ready = asyncio.Event()
sem = asyncio.Semaphore(3)
counter_lock = asyncio.Lock()
fetched = 0

async def init():
    print("加载配置中...")
    await asyncio.sleep(0.3)
    print("配置就绪，通知所有 worker")
    ready.set()

async def fetch(url):
    global fetched
    await ready.wait()                       # 等就绪信号
    async with sem:                          # 限流：最多 3 个并发
        print(f"  抓取 {url}")
        await asyncio.sleep(random.uniform(0.1, 0.4))
        async with counter_lock:             # 互斥更新共享计数
            fetched += 1
            print(f"  完成 {url}，累计={fetched}")

async def main():
    urls = [f"url-{i}" for i in range(8)]
    await asyncio.gather(init(), *(fetch(u) for u in urls))
    print(f"全部结束，共抓取 {fetched} 个")

asyncio.run(main())
# 输出：
# 加载配置中...
# 配置就绪，通知所有 worker
#   抓取 url-0
#   抓取 url-1
#   抓取 url-2
#   完成 url-1，累计=1
#   抓取 url-3
#   完成 url-0，累计=2
#   抓取 url-4
#   完成 url-2，累计=3
#   抓取 url-5
#   完成 url-3，累计=4
#   抓取 url-6
#   完成 url-5，累计=5
#   抓取 url-7
#   完成 url-4，累计=6
#   完成 url-6，累计=7
#   完成 url-7，累计=8
# 全部结束，共抓取 8 个
```

这个例子里三种原语各司其职：

- `Event` 保证所有 worker 在配置就绪后才开跑，避免空抓。
- `Semaphore` 把真实并发压到 3，保护目标站点与自己机器。
- `Lock` 保护跨 `await` 的 `fetched += 1`——注意它是"读 `fetched`、算 +1、写回"跨越了 `await asyncio.sleep`，正是协议级竞态的典型形态，不加锁会丢更新。

---

## 3. 最佳实践

**只在临界区跨 await 时才加锁**

单线程事件循环里，不跨越 `await` 的纯同步代码块天然是原子的，没必要加锁。给本来就安全的地方加锁只会让协程串行化、拖慢并发。判断准则：找临界区里有没有 `await`——有，评估是否需要锁；没有，基本不需要。

```python
# 推荐：counter += 1 不跨 await，单线程下原子，无需锁
counter += 1

# 推荐：跨多个 await 的"读-改-写"才上锁
async with lock:
    cur = await db.get()
    cur += 1
    await db.set(cur)
```

**锁的粒度尽量小**

锁包住的代码越少、里面 `await` 越短，其它协程等的时间越短，并发性能越好。不要把"获取锁-干一大堆活-释放"无脑放大。

```python
# 不推荐：锁住一大段、里头还 await 网络、磁盘，把别人堵死
async with lock:
    data = await fetch()       # 慢操作放锁内
    result = process(data)
    await save(result)         # 慢操作放锁内

# 推荐：锁只保护真正需要互斥的"改共享状态"那一段
data = await fetch()           # 慢操作在锁外
result = process(data)
async with lock:
    shared.append(result)      # 只锁真正必要的临界区
await save(result)             # 慢操作在锁外
```

当然，如果共享状态本身就是 `fetch` / `save` 的目标（如共享的数据库连接对象），那必须把整段放锁内，由不得你缩粒度——粒度小是原则，具体仍看临界区的实际边界。

**永远用 async with，少用手动 acquire/release**

`async with` 保证 `release`，手动 `acquire/release` 一旦中间抛异常就死锁。除非有非常特殊的控制流需求，否则一律 `async with`。

**不要把 threading.Lock 用进 asyncio**

这是新手最容易犯的错——上手 asyncio 还带着线程思考习惯，直接 `import threading; lock = threading.Lock()`，然后 `with lock:` 包一段 async 代码。问题在于 `threading.Lock.acquire()` 是同步阻塞调用，它会卡住事件循环线程本身，所有协程全部停摆，等于把整个 asyncio 并发模型废掉了。在 asyncio 代码里，所有可能"等"的操作都必须是 `await` 形式，锁也必须用 `asyncio.Lock`。

**别在协程之间共享可变状态**

能用任务隔离就别共享、能传递参数别用全局、能用 `queue` 就别手动加锁。锁是最后手段，先试着把架构改成"协程之间靠消息传递、各自持有私有状态"。`asyncio.Lock` 保护共享状态是必要的，但能减少共享就减少共享。

**复用同一把锁/信号量，别每次现 new**

锁和信号量的意义在于"多个协程共享同一把"。在循环里 new 新锁起不到任何同步作用。

```python
# 错误：每次 new 新锁，等于没锁
for url in urls:
    lock = asyncio.Lock()
    async with lock:
        ...

# 正确：循环外创建一把共享锁
lock = asyncio.Lock()
for url in urls:
    async with lock:
        ...
```

**避免持锁等待太久 / 注意死锁**

不要在持有一把锁的同时去 `await` 另一把可能会被对方持有的锁——这是 asyncio 死锁的典型形态，和线程死锁形态一致：

```python
# 危险：A 拿 lock1 后想要 lock2，B 拿 lock2 后想要 lock1，双方互等
async def a(l1, l2):
    async with l1:
        await asyncio.sleep(0)
        async with l2:   # ← B 此刻可能正握着 l2 等 l1
            ...

async def b(l1, l2):
    async with l2:
        await asyncio.sleep(0)
        async with l1:   # ← 死锁
            ...
```

规避手段和线程一致：给多把锁规定统一的获取顺序；或尽量只用一把锁。

**超时拿锁用 asyncio.wait_for，别自己造轮子**

想"等一会儿拿不到就放弃"必须用 `asyncio.wait_for(lock.acquire(), timeout=x)`。它在超时取消时会正确地把你从锁的等待队列里摘掉，自己造的 `sleep + locked()` 判断既不安全也容易把等待者遗留下来。

---

## 4. 原理

### 4.1 asyncio.Lock 的内部结构

`asyncio.Lock` 的实现远比 `threading.Lock` 简单（因为它不用碰操作系统），核心就是两个字段：一个 `_locked` 布尔位，一个 `_waiters` 等待队列（`collections.deque`，存放的是 `asyncio.Future` 对象）。

```python
# 概念性伪代码（省略取消处理等细节）
class Lock:
    def __init__(self):
        self._locked = False
        self._waiters = deque()
```

关键点：等待队列里存的是 **Future**，不是协程对象本身。每个 `acquire` 失败的协程会创建一个新 Future 挂在队列末尾，然后 `await` 这个 Future，于是当前协程挂起、控制权回到事件循环。

### 4.2 acquire：拿不到就排队挂起

`acquire` 的逻辑可以概括为：

1. 如果锁未被持有（`_locked == False`）：置 `_locked = True`，立即返回（拿到锁）。
2. 如果锁已被持有：创建一个 `Future`，`append` 到 `_waiters` 队列末尾，`await` 这个 Future——这一步让出控制权，当前协程挂起、事件循环去跑别的协程。
3. 当某天这个 Future 被 `set_result`（由 `release` 触发），协程从 `await` 处被唤醒。被唤醒后协程是队首那个等待者，它从队列中移除自己，置 `_locked = True`，返回。

```python
# 概念性伪代码
async def acquire(self):
    if not self._locked and not self._waiters:
        # 没人持锁也没人排队，直接拿
        self._locked = True
        return True
    # 否则排队
    fut = asyncio.get_event_loop().create_future()
    self._waiters.append(fut)
    try:
        await fut            # 挂起，等待 release 唤醒
    except CancelledError:
        # 被取消：把自己从队列摘掉
        self._waiters.remove(fut)
        raise
    self._locked = True
    return True
```

注意第 1 步里的 `not self._waiters` 条件：如果锁当前未被持有但队列里有等待者（比如刚 `release` 还没轮到被唤醒者真正醒来），新来的 `acquire` 不会"插队"——它会老老实实排到队尾。这是 asyncio.Lock 的公平性设计：先到先得，避免新来者饿死老等待者。

### 4.3 release：唤醒队首

`release` 把 `_locked` 置 `False`，然后看等待队列：

- 队列空：无事可做，锁保持未持有状态，下一个 `acquire` 直接拿走。
- 队列非空：取队首 Future，`set_result(None)` 把它唤醒。被唤醒的那个协程会在自己的 `acquire` 里把 `_locked` 重新置 `True`，从而"接力"持有锁。

```python
# 概念性伪代码
def release(self):
    if not self._locked:
        raise RuntimeError("Lock is not acquired")
    self._locked = False
    if self._waiters:
        # 唤醒队首
        fut = self._waiters.popleft()
        if not fut.done():   # 可能已被取消
            fut.set_result(None)
            # 注意：此时 _locked 还是 False，等被唤醒协程自己来置 True
```

这里有个细节：`release` 把锁标记为"未持有"并唤醒一个等待者，但**没立即把锁判给那个等待者**——`_locked` 到 `True` 的翻转发生在被唤醒协程真正从 `await` 处恢复执行、走到 `acquire` 代码里那句 `self._locked = True`。在 `release` 与被唤醒协程恢复之间这段窗口里，`_locked` 是 `False`。这也就是为什么前面说新来的 `acquire` 要看 `_waiters` 是否为空——如果不看、只看 `_locked`，就可能在这个窗口里插队抢到锁，破坏公平性。

### 4.4 为什么单线程还需要锁：await 切换点即竞态点

把 2.1 的协议级竞态用"事件循环调度"的视角再讲一遍，这是理解 asyncio 锁的命门。

事件循环的本质是一个无限循环：从就绪队列里取一个任务、跑到它 `await` 挂起、或者它执行完毕，再取下一个。协程之间的"并发"完全来自 `await` 点的协作式切换。所以当协程 A 在临界区里的某行 `await` 时，控制权会立刻回到事件循环，循环可能调度协程 B 进来跑——这时 B 看到的共享状态，正是 A 还没改完的中间状态。

**这就是单线程也需要锁的根本原因**：危险不在"两个协程同时执行同一条字节码"（这不可能），而在"两个协程的操作序列在 `await` 处交错穿插，互相踩到对方未完成的读改写"。锁的作用是把"读-改-写"整体串行化，确保一个协程没做完之前，另一个连读都不行。

换句话说，`await` 点把一个协程的执行切成若干不可打断的"原子片段"，但片段与片段之间的缝隙是开放的。锁的作用是为跨片段的序列额外建一道屏障，让这道屏障以内的多个片段对别的协程表现为一个不可穿插的整体。

**与 threading.Lock 阻塞线程的本质区别**

- `threading.Lock` 拿不到锁时，调用方是**线程**，线程被操作系统挂起、不占 CPU 但也不推进，`release` 唤醒它继续。线程被挂起期间，这个 CPU 核可以去跑别的线程（真并行可能）。
- `asyncio.Lock` 拿不到锁时，调用方是**协程**，协程通过 `await Future` 让控制权回到事件循环，事件循环去跑别的协程；线程本身没被挂起，依然在循环里干活，只是当前协程被挂起在等待队列里。整个事件循环始终跑在同一条线程上、从不停摆。

这就是为什么 `asyncio.Lock` 在 asyncio 里是安全的、而 `threading.Lock` 会卡死整个事件循环：前者让出的是协程、后者挂起的是线程（= 事件循环本身）。

### 4.5 Semaphore：计数器 + 等待队列

`asyncio.Semaphore` 的原理和 `Lock` 几乎一样，只是把布尔位 `_locked` 换成整数 `_value`：

```python
class Semaphore:
    def __init__(self, value):
        self._value = value
        self._waiters = deque()
```

`acquire`：如果 `_value > 0`，`_value -= 1` 立即返回；否则排队 `await` 一个 Future。`release`：`_value += 1`，如果有等待者就唤醒队首（不再减回 `_value`，相当于把名额直接交给被唤醒者）。所以 `Semaphore(N)` 在语义上就是"N 个名额的候客厅"，进一个减一、出一个加一，到 0 等待。

`Lock` 其实就是 `Semaphore(1)` 的特例——但 asyncio 把它们实现成两个独立类，主要是语义清晰：`Lock` 表达互斥、`Semaphore` 表达限流。

### 4.6 Event / Condition 的 Future 唤醒机制

**Event**

`asyncio.Event` 内部一个 `_value` 布尔 + 一个 `_waiters` 集合（`set`）。`wait()` 逻辑：如果 `_value` 为真，立刻返回；否则创建 Future 加入 `_waiters`，`await`。`set()`：置 `_value = True`，遍历 `_waiters` 里所有 Future `set_result(None)`——一次性广播唤醒所有等待者。`clear()`：置 `_value = False`，下一次 `wait()` 又会等待。注意 Event 没有"名额"概念，`set` 后所有 `wait` 都会立刻通过，直到被 `clear`。

**Condition**

`asyncio.Condition` 内部持有一把 `Lock`（用来保护共享状态的检查与修改）并在此之上提供 `wait` / `notify`。`wait()` 的步骤特别关键：

1. 释放内部锁（`release`）——否则别的协程拿不到锁、没法 `notify`。
2. 创建 Future，加入等待集合，`await`——挂起。
3. 被 `notify` 唤醒后，重新 `acquire` 内部锁——所以 `wait` 返回时调用方仍持有锁，可以继续检查 / 修改共享状态。

`notify(n)` 取 n 个等待 Future `set_result`；`notify_all()` 全部唤醒。`notify` 必须在持锁状态下调用（API 会检查），因为它要安全地操作内部等待集合。

这套机制和 `threading.Condition` 几乎同构，只是把"阻塞线程"换成"`await` 挂起协程"。

### 4.7 取消（CancelledError）对等待队列的处理

`asyncio.wait_for` 超时、`task.cancel()` 都会给处于 `await lock.acquire()` / `await event.wait()` 的协程发 `CancelledError`。所有同步原语内部对此都有处理：把对应的 Future 从等待队列里移除，然后重新抛出 `CancelledError`。这是为什么"超时拿锁"是安全的——你不会留下一个幽灵等待者让 `release` 浪费唤醒次数。自己手写超时如果省了这一步，会导致锁在不持有者的情况下仍然记账、把 `release` 的唤醒发到一个没人接的 Future 上。

---

## 5. 总结

### 5.1 本文内容要点

- `asyncio.Lock` 是 asyncio 的异步互斥锁，核心用法 `async with lock:` 保护临界区，`acquire` / `release` 手动配对，`locked()` 查询状态。
- 单线程事件循环没有真正并行，但 `await` 切换点构成**协议级竞态**：跨 `await` 的"读-改-写"序列会被别的协程踩到，所以仍然需要锁。
- `asyncio.Lock` 拿不到锁时通过 `await Future` 让出控制权、不阻塞线程，与 `threading.Lock` 阻塞线程的本质不同——这就是为什么 asyncio 里必须用 `asyncio.Lock`、绝不能用 `threading.Lock`。
- `asyncio.Semaphore` 用计数器限制并发数，典型场景爬虫/API 批量调用限流；`asyncio.Event` 用标志位广播"就绪信号"；`asyncio.Condition` 把锁与通知组合，用于生产-消费者等条件等待。
- 原理上四个原语都靠"Future 等待队列 + 让出事件循环"实现：`acquire` 失败排队挂起、`release`/`set`/`notify` 唤醒；`Lock` 是 `Semaphore(1)` 的语义特例。
- 实践：只在临界区跨 `await` 时加锁；锁粒度尽量小；一律用 `async with`；复用同一把锁；超时用 `asyncio.wait_for`；避免多锁交叉等待造成死锁。

### 5.2 读完应能掌握

- 能说清"单线程 asyncio 为什么还需要锁"——协议级竞态来自 `await` 切换点，不是真并行。
- 能用 `async with lock:` 正确保护跨 `await` 的共享资源，并解释为什么纯同步代码不需要锁。
- 能区分 `Lock`、`Semaphore`、`Event`、`Condition` 各自适用场景，并选择正确的原语。
- 能解释 `asyncio.Lock` 与 `threading.Lock` 的本质区别，以及为什么不能在 asyncio 代码里用 `threading.Lock`。
- 能用 `Semaphore` 实现并发数限制（如爬虫限流 10）、用 `Event` 实现启动协调、用 `Condition` 实现生产-消费者。
- 能描述 `asyncio.Lock` 的内部实现：`_locked` + `_waiters` 队列 + Future 挂起与唤醒，以及公平性（先到先得）的设计。