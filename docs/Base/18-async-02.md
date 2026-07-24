---
group:
  title: 【18】异步协程
  order: 18
order: 2
title: 协程概念与调度
nav:
  title: Python
  order: 1
---

## 1. 介绍

### 1.1 什么是协程

协程（coroutine）是一种"用户态的可暂停、可恢复的函数"。普通函数被调用后从头执行到末尾，一次跑完、遇到 `return` 或函数体结束就返回，调用者无法在执行过程中插入其它逻辑；协程则不同——它可以在执行到某个位置时主动"暂停"（suspend），把控制权交还给调用者或其他调度者，等条件满足后再从暂停处"恢复"（resume）继续执行。暂停与恢复完全发生在用户态，不涉及操作系统内核的线程切换或进程切换。

这个"暂停-恢复"的能力，本质上是 Python 生成器机制的延伸。上一章我们讲过生成器：含有 `yield` 的函数被调用时不会立即执行，而是返回一个生成器对象，调用者通过 `next()` 驱动它执行到下一个 `yield` 处暂停。`async def` 定义的协程函数沿用了同样的"帧挂起"思路——协程函数被调用时不直接运行，而是返回一个 coroutine 对象，由事件循环驱动它一段一段地执行，遇到 `await` 就暂停、把控制权让给循环。

在 Python 中，"协程"一词指代的对象是明确的：用 `async def` 定义的是"协程函数"（coroutine function），调用它得到的返回值是"协程对象"（coroutine object）。协程对象本身不会自动运行，必须被事件循环调度（通常包装成 `Task`）才会真正执行。

**同步函数与协程的执行模型对比**

普通同步函数的执行是"一气呵成"的：

```python
def sync_demo():
    print("步骤一")
    print("步骤二")
    print("步骤三")

sync_demo()
# 输出：
# 步骤一
# 步骤二
# 步骤三
```

调用 `sync_demo()` 后，解释器在同一个函数帧里从头跑到尾，中间无法被外部"暂停"去做别的事（除非抛异常）。如果 `步骤二` 是一个耗时的网络请求，整个线程都会阻塞在那里干等。

协程函数则可以把耗时操作拆成"发起 → 让出 → 等完成 → 恢复"：

```python
import asyncio

async def coro_demo():
    print("步骤一")
    await asyncio.sleep(0.1)   # 模拟异步IO：在这里让出控制权
    print("步骤二：IO完成后恢复")
    await asyncio.sleep(0.1)   # 再次让出
    print("步骤三")

asyncio.run(coro_demo())
# 输出：
# 步骤一
# 步骤二：IO完成后恢复
# 步骤三
```

`await asyncio.sleep(0.1)` 是一个"暂停点"——协程在这里告诉事件循环："我要等一个 IO 完成（这里是等 0.1 秒），这段时间你先去执行别的协程吧。"等睡完，循环再把该协程恢复，从 `await` 之后继续执行。

### 1.2 协程函数的基本语法与最小用法

定义协程函数只需在 `def` 前加 `async`：

```python
async def 函数名(参数):
    ...
    await 某个可等待对象
    ...
```

几个要点：

- `async def` 定义的函数，调用它得到的是 coroutine 对象，而不是函数的执行结果。这一点和普通函数截然不同，也是初学者最容易困惑的地方。
- 在协程函数体内，可以用 `await` 暂停等待另一个可等待对象（awaitable）。可等待对象包括：协程对象、Task 对象、Future 对象，以及实现了 `__await__` 方法的对象。
- coroutine 对象必须交给事件循环调度才会运行。最简单的方式是 `asyncio.run(coro)`。

**最小可运行示例**

```python
import asyncio

async def greet(name):
    print(f"开始打招呼：{name}")
    await asyncio.sleep(0)   # 主动让出一次控制权（不真正等待）
    print(f"你好，{name}！")

# 直接调用协程函数，得到的是 coroutine 对象，并不会执行
coro = greet("小张")
print(type(coro))
# 输出：<class 'coroutine'>

# 交给事件循环运行
asyncio.run(coro)
# 输出：
# 开始打招呼：小张
# 你好，小张！
```

注意 `asyncio.run(coro)` 会创建一个新的事件循环、运行协程到完成、然后关闭循环。在上面的代码里如果只写 `greet("小张")` 而不 `run`，终端会打印一条 `RuntimeWarning: coroutine 'greet' was never awaited` 的警告——因为这表示协程对象创建后被丢弃、从未被调度执行。

> **`asyncio.sleep(0)` 的含义**：它让协程让出控制权一次、但立即就绪，相当于"主动让别的协程先跑一步"。这在演示调度顺序时非常有用，后面会反复用到。

### 1.3 协程在 Python 中的地位

从 Python 3.5 起，`async`/`await` 语法正式引入，协程从"基于 `yield` 的生成器协程"升级为语言层面的一等公民。在此之前，Python 用 `@asyncio.coroutine` 装饰器配合 `yield from` 来写协程，写法和心智负担都比较重；`async`/`await` 把"协程函数"和"普通函数"在语法上彻底分开，也让 `await` 成为显式的暂停点——一眼就能看出函数在哪里可能让出控制权。

协程是 Python 异步编程的基石：`asyncio`、`aiohttp`、`aiofiles`、`asyncpg` 等异步库都建立在 `async def` + `await` 之上。理解协程的运作模型（暂停-恢复、事件循环调度、协作式让出），是掌握后续所有异步库的前提。

## 2. 核心内容

### 2.1 协程函数与协程对象

协程函数和普通函数在"调用"这一步上的行为差异，是理解协程的第一个关键。

调用普通函数，解释器立即分配栈帧、执行函数体、返回结果。调用协程函数，解释器只是构造一个 coroutine 对象并返回，函数体的代码一行都没执行——要等到事件循环"驱动"它时才开始跑。

```python
import asyncio

async def fetch_data():
    print("开始抓取数据...")
    await asyncio.sleep(0.1)
    print("数据抓取完成")
    return {"id": 1, "value": 42}

# 调用协程函数 -> 得到 coroutine 对象，函数体尚未执行
coro = fetch_data()
print(f"刚调用完，类型：{type(coro)}")
# 输出：刚调用完，类型：<class 'coroutine'>

# 注意：上面并没有打印 "开始抓取数据..."，说明函数体还没跑

# 用 asyncio.run 驱动它执行
result = asyncio.run(coro)
print(f"返回值：{result}")
# 输出：
# 开始抓取数据...
# 数据抓取完成
# 返回值：{'id': 1, 'value': 42}
```

**为什么调用协程函数不直接执行？**

因为协程的设计目标就是"可以暂停、可以恢复"。如果一调用就立即执行，那就和普通函数没区别了。把"创建协程对象"和"调度执行"分开，才能让事件循环拿到协程对象后自由安排执行时机——可以立刻跑，也可以先排队、等其它任务让出后再跑。这种"构造与执行分离"的模式，和上一章生成器完全一致：`gen = my_gen()` 也不执行函数体，要 `next(gen)` 才驱动。

**一个常见错误：忘记调度**

```python
async def say_hello():
    print("hello")

# 错误写法：只调用、不调度
say_hello()
# 不会有 "hello" 输出，只会在运行结束时收到警告：
# RuntimeWarning: coroutine 'say_hello' was never awaited
```

这个警告的意思是：你创建了一个协程对象却从未让事件循环运行它。解决办法是用 `asyncio.run()`、或在已运行的循环里 `await` 它、或用 `asyncio.create_task()` 把它包装成 Task。

### 2.2 事件循环的角色

事件循环（event loop）是协程的"调度者"。协程自己不会主动跑起来，它需要循环不断驱动。可以把事件循环理解为一个不停地重复以下步骤的"消息泵"：

1. 从就绪队列里取出一个就绪的任务（协程）。
2. 驱动它执行——从上一次暂停处继续往下跑。
3. 协程遇到 `await` 一个未完成的 IO 操作时，主动让出控制权，循环把它登记为"等待中"，并记录它在等什么。
4. 循环回去继续取下一个就绪任务执行（步骤 1）。
5. 当某个 IO 操作完成（比如 socket 有数据可读、定时器到期），循环把对应的协程重新放回就绪队列。
6. 如此往复，直到所有协程都完成。

这个模型的关键在于：**事件循环是单线程的"交通指挥"。** 它在自己的线程里跑，串行地驱动协程——同一时刻只有一个协程在真正执行 Python 代码。多个协程之所以"看起来并发"，是因为它们在各自的 IO 等待期间让出了 CPU，循环把 CPU 交错分配给了不同的协程。

**用两个协程交错打印来观察调度**

这是一个经典的演示：两个协程各自打印几次、中间 `await asyncio.sleep(0)` 主动让出，观察事件循环如何在它们之间交错调度。

```python
import asyncio

async def worker(name, times):
    for i in range(times):
        print(f"[{name}] 第 {i + 1} 次执行")
        await asyncio.sleep(0)   # 主动让出控制权，等待下次被调度

async def main():
    # 同时启动两个协程，它们会交错执行
    await asyncio.gather(worker("A", 3), worker("B", 3))

asyncio.run(main())
# 输出：
# [A] 第 1 次执行
# [B] 第 1 次执行
# [A] 第 2 次执行
# [B] 第 2 次执行
# [A] 第 3 次执行
# [B] 第 3 次执行
```

**为什么会交错？** `asyncio.gather` 把两个协程都交给事件循环并发调度。循环先驱动 A，A 打印一次后 `await asyncio.sleep(0)` 让出；循环立刻调度 B，B 也打印一次后让出；循环再回到 A……如此往复。`sleep(0)` 表示"我不需要真的等待，只是主动让出一次"，所以让出后立刻又进入就绪队列。

如果不加 `await` 让出，情况就完全不同：

```python
import asyncio

async def greedy_worker(name, times):
    for i in range(times):
        print(f"[{name}] 第 {i + 1} 次执行")
        # 没有 await，不会让出控制权
    print(f"[{name}] 全部做完")

async def main():
    await asyncio.gather(greedy_worker("A", 3), greedy_worker("B", 3))

asyncio.run(main())
# 输出：
# [A] 第 1 次执行
# [A] 第 2 次执行
# [A] 第 3 次执行
# [A] 全部做完
# [B] 第 1 次执行
# [B] 第 2 次执行
# [B] 第 3 次执行
# [B] 全部做完
```

A 一口气跑完整个循环才让出（函数结束自然返回控制权），B 才有机会开始。这就是"协作式调度"的典型表现：协程必须主动 `await` 才会交出 CPU，否则就会独占事件循环，其它协程只能干等。这一点后面原理章会详述。

### 2.3 协程 vs 线程 vs 进程

理解协程，最好的方式是把它和线程、进程放在一起对比。三者都能实现"并发"，但调度方、开销、适用场景差别很大。

| 维度 | 进程 | 线程 | 协程 |
|------|------|------|------|
| 调度方 | 操作系统内核 | 操作系统内核 | 用户态（事件循环） |
| 切换方式 | 内核切换，需陷入内核态 | 内核切换，需陷入内核态 | 用户态切换，无内核参与 |
| 切换开销 | 大（换页表、TLB 刷新等） | 中（换栈帧、寄存器） | 极小（只保存/恢复协程帧） |
| 并发数 | 几十~几百 | 几百~几千 | 几万~几十万 |
| 内存占用 | MB 级 | MB 级（栈空间） | KB 级 |
| 数据共享 | 需 IPC（管道、共享内存等） | 直接共享内存，需加锁 | 单线程内共享，无需锁 |
| 是否可被抢占 | 是（OS 抢占） | 是（OS 抢占） | 否（协作式，需主动 await） |
| 适合场景 | CPU 密集、需隔离 | CPU 密集或阻塞 IO | IO 密集、高并发 |
| 并发安全 | 天然隔离 | 需锁 | 单线程无竞态 |

**调度方与切换开销**

进程和线程的调度权在操作系统内核。内核通过时钟中断等机制，在任何时刻都可能"抢占"当前线程、切到另一个线程。切换时要保存/恢复寄存器、切换栈、甚至刷新 TLB，这些都要在内核态完成，开销在微秒级。

协程的调度权在用户态的事件循环。协程的"切换"其实就是——当前协程 `await` 让出后，循环从就绪队列取另一个协程的帧继续执行。整个过程纯用户态、无系统调用、无内核参与，开销在纳秒级，且没有 cache 污染。这也就是协程能支撑几万并发的原因：切的是轻量的"帧"，不是沉重的"线程"。

**单线程无竞态**

这是协程一个常被忽略但极重要的优势。进程和线程的调度是抢占式的——内核随时可能切走当前线程，如果两个线程共享数据，就必须用锁保护，否则会出现"读到半新半旧的值"这类竞态。

协程跑在单线程事件循环里，同一时刻只有一个协程在执行。协程之间的"切换"只发生在 `await` 点——在两个 `await` 之间的代码段是一个"原子执行块"，不会被其它协程打断。因此只要你的操作不跨 `await`，就不需要加锁。

```python
import asyncio

shared_counter = 0

async def increment_unsafe():
    """演示：不跨 await 的操作天然安全"""
    global shared_counter
    for _ in range(100000):
        # 整个自增没有 await，不会被其它协程打断
        shared_counter += 1
        # 如果中间没有 await，这段代码对单线程事件循环是原子的
    # 但注意：下面这种写法就会引入竞态
    # temp = shared_counter
    # await asyncio.sleep(0)  # 让出后别的协程可能改了 shared_counter
    # shared_counter = temp + 1  # 覆盖了别人的修改
```

注意"单线程无竞态"的前提是"操作不跨 `await`"。一旦操作跨越了一个 `await` 让出点，在 `await` 期间其它协程可能修改共享状态，这时就需要 `asyncio.Lock` 之类的同步原语——这属于后续章节的内容。

**并发数对比演示**

下面的演示用协程同时"开"几万个任务，感受协程的轻量。实际请求用一个极短的 sleep 模拟，避免真的发起网络连接。

```python
import asyncio
import time

async def tiny_task(n):
    await asyncio.sleep(0.01)   # 模拟一次 IO 等待
    return n * 2

async def main():
    start = time.perf_counter()
    # 同时发起 10000 个协程任务
    results = await asyncio.gather(*[tiny_task(i) for i in range(10000)])
    elapsed = time.perf_counter() - start
    print(f"10000 个协程并发完成，耗时 {elapsed:.3f}s")
    print(f"前 5 个结果：{results[:5]}")

asyncio.run(main())
# 输出：
# 10000 个协程并发完成，耗时 0.011s
# 前 5 个结果：[0, 2, 4, 6, 8]
```

10000 个协程并发，0.01s 内全部完成——因为所有协程都在等同一个 sleep，事件循环只需登记等待、到点唤醒，开销比同规模线程小几个数量级（光是 10000 个线程的栈空间就要几十 GB）。

### 2.4 协作式调度与抢占式调度

调度模型分两种：

- **抢占式调度**（preemptive）：调度者（操作系统）随时可以强行切走当前执行单元（线程/进程），无论它愿不愿意。线程被 OS 抢占，你无法预知何时被切。
- **协作式调度**（cooperative）：执行单元必须主动"让出"（yield）控制权，调度者才能切到下一个。协程就是协作式——只有协程执行 `await` 时，事件循环才有机会调度别的协程。

协作式调度的好处是：切换时机完全可控、开销低、无竞态；代价是：如果一个协程不主动让出，它就会"霸占"事件循环，让其它协程饿死。

**CPU 密集协程阻塞事件循环的演示**

这是协作式调度最大的坑：协程里如果跑了一段纯 CPU 计算而中间没有 `await`，整个事件循环会被卡住——不仅其它协程跑不了，连循环本身的 IO 监听都会停摆。

```python
import asyncio
import time

async def cpu_hog():
    """纯 CPU 密集计算，没有任何 await 让出"""
    print("开始烧 CPU...")
    total = 0
    for i in range(50_000_000):
        total += i
    print(f"烧完 CPU，结果：{total}")

async def ping():
    """每隔 0.1s 打印一次，用来观察循环是否还能响应"""
    for i in range(5):
        await asyncio.sleep(0.1)
        print(f"ping {i + 1}")

async def main():
    start = time.perf_counter()
    # ping 和 cpu_hog 并发，但 cpu_hog 不让出
    await asyncio.gather(ping(), cpu_hog())
    elapsed = time.perf_counter() - start
    print(f"总耗时 {elapsed:.3f}s")

asyncio.run(main())
```

预期行为：`cpu_hog` 一旦开始就独占循环跑计算，期间 `ping` 协程虽然 sleep 到期了、但循环正被 `cpu_hog` 占着无法调度它，只能等 `cpu_hog` 跑完才有机会执行。实际输出类似：

```
# 输出：
# ping 1
# 开始烧 CPU...
# 烧完 CPU，结果：1249999997500000000
# ping 2
# ping 3
# ping 4
# ping 5
# 总耗时 0.5xx s
```

（精确的交错取决于 CPU 速度，但关键是：ping 1 在 cpu_hog 开始前发出，cpu_hog 占用期间 ping 不响应，cpu_hog 结束后剩余 ping 连续发出。）

这就是为什么说"协程不适合 CPU 密集任务"。如果非要在异步代码里跑 CPU 密集计算，正确做法是用 `asyncio.to_thread()` 或 `run_in_executor()` 把它丢到线程池/进程池里，让事件循环保持响应：

```python
import asyncio
import time

def cpu_hog_sync():
    """同步的 CPU 密集函数"""
    total = 0
    for i in range(50_000_000):
        total += i
    return total

async def ping():
    for i in range(5):
        await asyncio.sleep(0.1)
        print(f"ping {i + 1}")

async def main():
    start = time.perf_counter()
    # 把 CPU 密集任务丢到线程池，事件循环就能继续响应 ping
    cpu_task = asyncio.to_thread(cpu_hog_sync)
    await asyncio.gather(ping(), cpu_task)
    elapsed = time.perf_counter() - start
    print(f"总耗时 {elapsed:.3f}s")

asyncio.run(main())
# 输出：
# ping 1
# ping 2
# ping 3
# ping 4
# ping 5
# 总耗时 0.5xx s
```

现在 ping 能按 0.1s 间隔稳定打印了——因为 cpu_hog 在另一个线程里跑，事件循环不会被它卡住。这属于"异步代码调用同步代码"的话题，后续章节会专门讲。

### 2.5 协程的三种状态

协程对象在其生命周期里有明确的状态。理解这些状态有助于调试"协程为什么没执行""协程卡在哪"之类的问题。

- **创建（CORO_CREATED）**：协程函数刚被调用、得到 coroutine 对象，尚未开始执行。此时等事件循环驱动它。
- **挂起（CORO_SUSPENDED）**：协程正在执行中遇到 `await` 一个未完成的操作，暂停等待。控制权已交还事件循环，等条件满足后恢复。
- **完成（CORO_CLOSED / CORO_FINISHED）**：协程执行完毕（正常返回或抛异常），结果/异常已被记录，无法再恢复。

可以用 `inspect.getcoroutinestate()` 查看协程对象当前状态：

```python
import asyncio
import inspect

async def demo():
    print("协程开始执行")
    await asyncio.sleep(0.1)
    print("协程即将完成")

async def main():
    coro = demo()
    print(f"创建后状态：{inspect.getcoroutinestate(coro)}")
    # 输出：创建后状态：CORO_CREATED

    # 把它包装成 Task 交循环调度
    task = asyncio.create_task(coro)
    await asyncio.sleep(0)   # 让循环有机会开始执行 task
    print(f"执行中状态：{inspect.getcoroutinestate(coro)}")
    # 输出：执行中状态：CORO_SUSPENDED

    await task   # 等它跑完
    print(f"完成后状态：{inspect.getcoroutinestate(coro)}")
    # 输出：完成后状态：CORO_CLOSED

asyncio.run(main())
# 完整输出：
# 创建后状态：CORO_CREATED
# 协程开始执行
# 执行中状态：CORO_SUSPENDED
# 协程即将完成
# 完成后状态：CORO_CLOSED
```

注意这里出现了一个新角色 `Task`：协程对象本身只是"一段可暂停执行的代码"，不能直接被事件循环高效调度（循环需要知道协程的状态、等待关系、完成回调等）。`asyncio.create_task(coro)` 把协程包装成 `Task` 对象——Task 是"被循环调度的协程包装"，循环实际驱动的是 Task，Task 内部再驱动协程。这个关系后面原理章会详述。

### 2.6 asyncio 的事件循环默认行为

`asyncio` 提供了事件循环的默认实现。大多数情况下你不需要手动创建循环，`asyncio.run()` 会自动帮你处理。了解它的默认行为有助于理解协程的运行环境。

**`asyncio.run()` 的行为**

```python
import asyncio

async def main():
    print("主协程运行中")
    await asyncio.sleep(0.1)
    print("主协程完成")

# asyncio.run 做了这些事：
# 1. 创建一个新的事件循环
# 2. 用这个循环运行 main() 协程，直到它完成
# 3. 取消所有尚未完成的任务（防止泄漏）
# 4. 关闭循环
asyncio.run(main())
# 输出：
# 主协程运行中
# 主协程完成
```

关键点：

- `asyncio.run()` 应作为异步程序的入口，通常在程序最外层调用一次。在 `run` 之外的代码是同步世界，`run` 之内的代码是异步世界。
- 一个线程内同一时刻只能有一个运行中的事件循环。如果在已有循环的线程里再调 `asyncio.run()`，会抛 `RuntimeError`。
- `asyncio.run()` 会等传入的顶层协程完成，然后清理未完成的子任务，再关闭循环。所以顶层协程里通常要用 `await asyncio.gather(...)` 或 `await task` 把所有要并发的工作"收拢"住，否则未完成的任务会被取消。

**`asyncio.create_task()` 的行为**

在已经运行的循环里，要把一个协程"并发"地调度起来（不等它完成就继续往下走），用 `asyncio.create_task()`：

```python
import asyncio

async def background_job():
    print("后台任务开始")
    await asyncio.sleep(0.3)
    print("后台任务完成")

async def main():
    # create_task 立即返回 Task 对象，协程在后台被调度
    task = asyncio.create_task(background_job())
    print("创建任务后，main 没有等待，继续往下")
    await asyncio.sleep(0.1)
    print("main 中间做点别的事")
    # 等后台任务完成
    await task
    print("main 结束")

asyncio.run(main())
# 输出：
# 创建任务后，main 没有等待，继续往下
# 后台任务开始
# main 中间做点别的事
# 后台任务完成
# main 结束
```

`create_task` 把协程包装成 Task 并注册到事件循环的就绪队列，循环会在下一个调度点开始驱动它。调用者拿到 Task 对象后可以继续执行自己的逻辑，需要时再 `await task` 等待结果。

**为什么不能在 `asyncio.run()` 外面用 `create_task`？**

```python
import asyncio

async def some_coro():
    await asyncio.sleep(0.1)

# 错误：当前线程没有运行中事件循环
# task = asyncio.create_task(some_coro())
# RuntimeError: no running event loop
```

`create_task` 必须在"有运行中事件循环"的上下文里调用，也就是在 `asyncio.run()` 包装的协程内部、或被它调用的协程内部。

### 2.7 await 的语义

`await` 是协程里的暂停点，也是让出控制权的唯一显式语法。它的完整语义是：

1. 对右边的可等待对象（awaitable）求值。
2. 如果该对象"还没完成"（比如协程没返回、Future 未就绪、sleep 没到期），当前协程暂停，把控制权交还事件循环。
3. 事件循环趁机执行其它就绪的协程。
4. 等到该对象"完成"后，循环把当前协程恢复，从 `await` 之后继续执行。`await` 表达式的值是该对象的返回值。

如果 `await` 的对象其实已经完成（比如 `await` 一个已结束的协程），则不会真正让出，直接拿到结果继续往下。

```python
import asyncio

async def step_one():
    print("步骤一")
    return "一完成"

async def step_two():
    print("步骤二：开始")
    await asyncio.sleep(0.05)   # 真正让出
    print("步骤二：结束")
    return "二完成"

async def main():
    # await 一个已能立即返回的协程：不真正让出
    r1 = await step_one()
    print(f"拿到 {r1}")
    # await 一个需要等待的协程：会让出，等它完成
    r2 = await step_two()
    print(f"拿到 {r2}")

asyncio.run(main())
# 输出：
# 步骤一
# 拿到 一完成
# 步骤二：开始
# 步骤二：结束
# 拿到 二完成
```

**`await` 的对象必须是可等待对象**

```python
import asyncio

async def main():
    # 合法：协程对象
    await asyncio.sleep(0)
    # 合法：Task 对象
    task = asyncio.create_task(asyncio.sleep(0))
    await task
    # 合法：Future 对象（asyncio 内部用）
    fut = asyncio.Future()
    fut.set_result("ok")
    await fut
    # 非法：普通整数不是可等待对象
    # await 123  # TypeError: object int can't be used in 'await' expression

asyncio.run(main())
```

### 2.8 一个综合示例：并发抓取

把前面的概念串起来。模拟"同时抓取多个 URL"——这是协程最典型的应用场景。用 `asyncio.sleep` 模拟网络延迟，重点看并发如何缩短总耗时。

```python
import asyncio
import time

async def fetch(url, delay):
    """模拟抓取一个 URL，delay 秒后返回"""
    print(f"  开始抓取 {url}")
    await asyncio.sleep(delay)   # 模拟网络等待：这里协程让出
    result = f"<{url} 的内容>"
    print(f"  完成 {url}（耗时 {delay}s）")
    return result

async def main():
    start = time.perf_counter()
    # 5 个抓取任务，各自延时不同
    tasks = [
        fetch("/api/users", 0.3),
        fetch("/api/posts", 0.5),
        fetch("/api/comments", 0.2),
        fetch("/api/likes", 0.4),
        fetch("/api/shares", 0.1),
    ]
    # 并发执行：所有 fetch 同时发起、交错等待
    results = await asyncio.gather(*tasks)
    elapsed = time.perf_counter() - start
    print(f"\n全部完成，总耗时 {elapsed:.3f}s（并发优于串行的 {0.3+0.5+0.2+0.4+0.1:.1f}s）")
    print(f"结果数：{len(results)}")

asyncio.run(main())
# 输出：
#   开始抓取 /api/users
#   开始抓取 /api/posts
#   开始抓取 /api/comments
#   开始抓取 /api/likes
#   开始抓取 /api/shares
#   完成 /api/shares（耗时 0.1s）
#   完成 /api/comments（耗时 0.2s）
#   完成 /api/users（耗时 0.3s）
#   完成 /api/likes（耗时 0.4s）
#   完成 /api/posts（耗时 0.5s）
#
# 全部完成，总耗时 0.50x s（并发优于串行的 1.5s）
# 结果数：5
```

总耗时约 0.5s（最慢的那个任务），而不是 1.5s（串行累加）。这就是协程并发的价值：在 IO 等待期间让出 CPU 给其它协程，把原本串行的等待时间重叠起来。注意"开始抓取"是按发起顺序打印的——因为 `gather` 把所有 Task 注册到循环后，循环按顺序驱动每个协程到第一个 `await` 让出，然后才开始执行下一个。

## 3. 最佳实践

### 3.1 始终让顶层入口收拢所有任务

不推荐：在 `main` 里 `create_task` 后不 await 就结束——任务会被 `asyncio.run` 取消，行为不可预测。

```python
# 不推荐：后台任务可能被取消，结果丢失
async def main():
    asyncio.create_task(background())   # 没有持有引用、也没 await
    # 函数随即结束，asyncio.run 会取消尚未完成的任务
```

推荐：显式持有 Task 引用并 await，或用 `gather` 收拢。

```python
# 推荐：显式等待
async def main():
    task = asyncio.create_task(background())
    # ... 做别的事
    await task   # 确保它完成
```

```python
# 推荐：用 gather 一次收拢多个并发任务
async def main():
    results = await asyncio.gather(task_a(), task_b(), task_c())
```

原因：协程是协作式调度，只有顶层协程显式 await 才能保证子任务有机会跑到完成。`asyncio.run()` 结束时会取消所有未完成任务，不留引用的 Task 还可能被垃圾回收提前取消（Python 3.12 有 `task group` 的更安全方案，后续章节会讲）。

### 3.2 不要在协程里跑长 CPU 计算而不让出

不推荐：

```python
# 不推荐：纯 CPU 循环卡死事件循环
async def process():
    total = 0
    for i in range(100_000_000):
        total += i
    return total
```

推荐方案一：CPU 密集工作丢线程/进程池。

```python
# 推荐：用 to_thread 交给线程池，循环保持响应
async def process():
    return await asyncio.to_thread(heavy_cpu_work)
```

推荐方案二：如果非要在协程里跑，定期 `await asyncio.sleep(0)` 让出，给其它协程喘息机会（治标不治本，CPU 还是被占着，但至少循环能调度）。

```python
# 折中：分块处理，每块之间让出
async def process():
    total = 0
    for i in range(100_000_000):
        total += i
        if i % 1_000_000 == 0:
            await asyncio.sleep(0)   # 每 100 万次让出一次
    return total
```

原因：协作式调度下，不让出就等于独占循环，其它协程和 IO 监测全停摆。

### 3.3 不要忘记 await 协程

最经典的错误：调用协程函数却忘了 `await`，得到一个 coroutine 对象而不是结果，且协程没执行。

```python
# 错误：忘了 await
async def fetch_user(uid):
    ...
    return user

user = fetch_user(1)   # user 是 coroutine 对象，不是 user 字典！
print(user["name"])    # TypeError: 'coroutine' object is not subscriptable
# 还会有 RuntimeWarning: coroutine 'fetch_user' was never awaited
```

推荐：

```python
# 正确
user = await fetch_user(1)
```

Python 会让这种错误尽量可见——运行结束时会警告"coroutine was never awaited"。但更好的办法是借助静态类型检查（如 mypy）或 IDE 提示，在写代码时就发现。

### 3.4 注意跨 await 的共享状态竞态

前面强调过"单线程无竞态"——但前提是操作不跨 `await`。一旦操作中间有 `await` 让出，让出期间其它协程可能改了共享数据。

不推荐：

```python
# 不推荐：读-改-写跨了 await，存在竞态
shared_counter = 0

async def unsafe_increment():
    global shared_counter
    current = shared_counter
    await asyncio.sleep(0)   # 让出！别的协程可能在这里也读了 shared_counter
    shared_counter = current + 1   # 覆盖了别人的修改
```

推荐：用 `asyncio.Lock` 保护跨 await 的临界区，或者把"读-改-写"压成不跨 await 的原子段。

```python
# 推荐：用锁保护
lock = asyncio.Lock()
shared_counter = 0

async def safe_increment():
    global shared_counter
    async with lock:   # 拿锁后别的协程进不来
        current = shared_counter
        await asyncio.sleep(0)   # 即使让出，锁还被持有
        shared_counter = current + 1
```

### 3.5 用 asyncio.run 作为程序入口，不要手动创建循环

旧代码里常见这种写法：

```python
# 旧写法（不推荐）
loop = asyncio.get_event_loop()
loop.run_until_complete(main())
loop.close()
```

`get_event_loop()` 在 Python 3.10+ 已被弱化，3.12+ 在没有运行循环时还会报错。推荐统一用 `asyncio.run()`，它封装了创建-运行-清理的完整流程，更安全。

```python
# 推荐写法
asyncio.run(main())
```

### 3.6 给并发任务数量设上限

协程虽轻，但"同时发起几万个真实网络请求"会打爆对方服务器、撑爆本地 socket。实际项目中应限制并发数，比如用 `asyncio.Semaphore`。

不推荐：

```python
# 不推荐：一次性发起全部请求，可能把服务端打挂
await asyncio.gather(*[fetch(u) for u in urls])   # urls 有 10 万个
```

推荐：

```python
# 推荐：用信号量限制并发
sem = asyncio.Semaphore(100)

async def limited_fetch(url):
    async with sem:
        return await fetch(url)

await asyncio.gather(*[limited_fetch(u) for u in urls])
```

虽然协程对象本身几万个无压力，但底层资源（socket、文件描述符、对方服务承载）是有限的。并发上限要根据对方服务和本地资源来定。

## 4. 原理

### 4.1 协程基于生成器帧的暂停-恢复机制

协程"可暂停、可恢复"的能力，底层来自生成器相同的"帧挂起"机制。回顾上一章：生成器函数被调用时不执行函数体，而是返回一个生成器对象，该对象持有一个"挂起的栈帧"。`next(gen)` 驱动帧执行到下一个 `yield`，帧在那里挂起、`next` 返回；再次 `next` 又从挂起点恢复。

`async def` 协程在 CPython 实现层面走的是同一套"可挂起帧"机制，但有自己的类型和驱动协议：

- 协程对象的 C 层结构里挂着一个 `cr_frame`——一个可挂起的帧。协程被驱动时，解释器从这个帧的"最后暂停位置"继续执行字节码。
- 协程的驱动入口是 `send(value)`（沿用生成器协议）。事件循环驱动协程本质上就是调用 `coro.send(None)`，让它执行到下一个 `await` 挂起点或函数结束。
- `await` 在字节码层面编译为 `GET_AWAITABLE` + `YIELD_VALUE` 的组合——把被 await 的对象交给驱动者（事件循环），协程帧在这里挂起。等循环把结果 `send` 回来，帧从挂起点恢复继续执行。

可以把协程的执行想象成这样的事件序列：

1. 事件循环调用 `coro.send(None)` 驱动协程。
2. 协程帧从起始位置执行字节码，直到遇到 `await`。
3. `await` 把被等待对象（一个 Future / 协程）作为 `send` 的返回值"吐"给循环，协程帧挂起。
4. 循环拿到这个被等待对象，登记"协程 X 正在等 Y"。
5. 等 Y 完成后，循环再次调用 `coro.send(Y 的结果)`。
6. 协程帧恢复，`await` 表达式拿到结果，继续往下执行……
7. 直到协程返回（`RETURN_VALUE`），`send` 抛 `StopIteration`，协程结束。

**用最简化的伪代码示意这个驱动过程**

下面是一个极简的"手写事件循环"，只处理 sleep，用来展示"循环通过 send 驱动协程、协程通过 await 让出"的协作本质。真实 asyncio 比这复杂得多，但核心骨架一致。

```python
import time

# 一个极简 awaitable：表示"等到 moment 时刻再恢复"
class Sleep:
    def __init__(self, until):
        self.until = until
    def __await__(self):
        # __await__ 本质是一个生成器：yield 把控制权交还循环
        yield self   # 把自己交给循环，循环据此登记等待时间
        # 被循环 send 恢复后，从这里继续（无返回值）

def simple_sleep(seconds):
    return Sleep(time.perf_counter() + seconds)

def run(coro):
    """极简事件循环：驱动单个协程到完成"""
    prev = None
    while True:
        try:
            # 驱动协程：send 会执行到下一个 yield（即下一个 await）
            awaitable = coro.send(prev)
        except StopIteration as e:
            # 协程 return 触发 StopIteration，value 是返回值
            return e.value
        # awaitable 是 Sleep 对象，循环负责"等待"
        # 真实循环会用 epoll 等多路复用同时等很多 IO，这里简化为直接睡
        now = time.perf_counter()
        if awaitable.until > now:
            time.sleep(awaitable.until - now)
        prev = None   # sleep 完成，send(None) 恢复协程

async def demo():
    print("开始")
    await simple_sleep(0.1)   # 让出，等 0.1s
    print("中间")
    await simple_sleep(0.1)   # 再次让出
    print("结束")
    return "done"

result = run(demo())
print(f"返回：{result}")
# 输出：
# 开始
# （停顿 0.1s）
# 中间
# （停顿 0.1s）
# 结束
# 返回：done
```

这段代码揭示了协程调度的本质：**循环和协程通过 `send`/`yield`（`await`）互相抛接控制权。** 协程遇到 `await` 就"吐"出一个等待对象并挂起；循环拿到后负责真正的等待（sleep、IO 监听）；等待完成后循环再 `send` 把协程唤醒。这个"你跑一段、我跑一段"的协作，就是协作式调度的底层面貌。

### 4.2 事件循环用 epoll/kqueue/IOCP 监听 IO 就绪

前面说"循环负责真正的等待"。那循环怎么能同时等待成千上万个 IO 操作、谁好了就唤醒谁？答案是操作系统提供的"IO 多路复用"机制：

- Linux：`epoll`
- macOS / BSD：`kqueue`
- Windows：`IOCP`（I/O Completion Ports）

这些机制允许一个线程把"一堆文件描述符（socket、管道等）"注册给内核，然后阻塞等待；内核在任一描述符就绪（可读/可写/出错）时唤醒该线程，并告诉它"哪几个就绪了"。这样单线程就能高效管理海量 IO。

asyncio 的 `BaseEventLoop` 在 `_run_once` 里大致做这些事：

1. 计算最近一个定时器（`call_later` 注册的）还有多久到期，作为 `epoll_wait` 的超时。
2. 调用 `epoll_wait`（或 `kqueue`/`IOCP` 等价物）阻塞等待 IO 就绪或超时。
3. 内核返回就绪的描述符列表 + 到期的定时器列表。
4. 把"就绪的 IO 对应的协程"和"到期的定时器对应的协程"放回就绪队列。
5. 依次驱动就绪队列里的协程（`coro.send`）执行。
6. 协程执行中可能又 `await` 新的 IO、注册新的等待——回到步骤 1。

**关键点**：真正阻塞等待 IO 的是 `epoll_wait` 这一次系统调用，它在内核里一次性watch所有 fd；而不是每个协程各自阻塞在 `recv`/`accept` 上。所以并发几万个连接只需要一个线程、一次 `epoll_wait`，开销极低。

**简化示意**

```python
# 伪代码：事件循环单次迭代的核心（省略大量细节）
def _run_once(self):
    # 1. 算出最近定时器的超时时间
    timeout = self._compute_timeout()

    # 2. 调用 IO 多路复用阻塞等待
    #    epoll_wait 会阻塞到：有 fd 就绪，或 timeout 到期
    events = self._selector.select(timeout)

    # 3. 处理就绪的 IO：把对应的 Future 标记为完成
    #    Future 完成会触发其绑定的协程重新进入就绪队列
    for fd, mask in events:
        self._process_io_event(fd, mask)

    # 4. 处理到期的定时器
    self._process_expired_timers()

    # 5. 依次执行就绪队列里的回调（驱动协程 send）
    ntodo = len(self._ready)
    for _ in range(ntodo):
        handle = self._ready.popleft()
        handle._run()
```

这就是为什么"IO 密集"适合协程：协程发起 IO 后让出，循环用 `epoll` 一次性等所有 IO，谁好了唤醒谁，整个线程没有任何"干等一个连接"的阻塞。而 CPU 密集任务不涉及 IO、不会触发 `epoll`，循环没有唤醒它的契机，只能靠协程主动让出——这就是 CPU 密集会"霸占"循环的根因。

### 4.3 协作式调度：协程必须主动 await 让出，否则饿死其它任务

抢占式调度下，调度者（OS）靠时钟中断强行打断线程——线程不用"配合"，调度也能保证公平。协作式调度没有这种强制机制：协程不让出，循环就没机会切。

这意味着协程代码作者负有"让出"的责任——在合适的时机 `await`，让循环能调度其它任务。如果你写了一个 `while True` 不带 `await` 的协程，它会无限循环、永远不让出，整个事件循环就冻在这个协程上，其它任务（包括重要的 IO 响应、心跳、超时）全部饿死。

这解释了第 2.4 节 CPU 密集协程的演示：`cpu_hog` 里的纯计算循环没有 `await`，循环无法打断它，只能等它自己跑完。这也是为什么"长任务必须丢线程池"——把 CPU 工作挪到另一个 OS 线程，主线程的事件循环就不再被它阻塞、能正常调度其它协程。

**让出的本质：让循环有机会跑 `_run_once`**

事件循环的"一轮迭代"（取就绪任务、调 epoll、分发事件）只能在"当前没有协程在执行"时进行。协程 `await` 让出后，控制权回到循环，循环才有机会跑下一轮 `_run_once`——检查 epoll、唤醒到期任务。所以"不让出"的直接后果不仅是别的协程得不到执行，连循环自己的 IO 监听都停了——所有协程的 IO 完成都无法被感知，直到当前协程让出。

### 4.4 单线程事件循环无竞态：为何无需锁

多线程里竞态的根源是"抢占"+"共享内存"：线程 A 读 `x` 后、写 `x` 前，被 OS 抢占切到线程 B，B 也读写了 `x`，A 恢复后基于过期的值写入，覆盖了 B 的修改。所以需要锁把"读-改-写"包成不可分割的临界区。

协程跑在单线程事件循环里，调度是协作式的——协程只在 `await` 让出，两个 `await` 之间的代码段不会被其它协程打断。因此：

- 不跨 `await` 的"读-改-写"天然原子，无需锁。
- 跨 `await` 的操作才可能竞态（`await` 期间别的协程可能改了共享状态），这时才需要 `asyncio.Lock`。

**物理本质**：单线程同一时刻只能执行一条字节码指令，不存在两个协程"同时"访问同一变量。"并发"是假的——是"交错"的，而交错点（`await`）是你自己写的、可控的。这就是协程比线程"容易写对并发"的深层原因：不确定性被你攥在手里，而不是交给 OS 时钟中断的随机时机。

**代价**：这种"安全"以"协作让出"为前提。如果你在一个协程里跑长 CPU 计算不让出，虽然没竞态问题，但响应性没了——所有"并发"都退化成串行。也就是第 4.3 节说的饿死问题。

### 4.5 协程对象与 Task 的关系：Task 是被循环调度的协程包装

协程对象（coroutine）和 Task 是两个不同的东西，理解它们的分工是理解 asyncio 的关键。

- **协程对象**：`async def` 函数调用后的返回值。它是"一段可暂停执行的代码"，持有一个挂起的帧。但协程对象本身不知道自己"什么时候该被驱动"、"等待的是什么"、"完成后要通知谁"——它只是个被动的"可执行体"。
- **Task**：`asyncio.create_task(coro)` 返回的对象。Task 是"协程的调度包装"——它把协程注册到事件循环，记录协程的状态、结果、异常、完成回调，并在循环每轮迭代中驱动协程 `send`。Task 实现了 `Future` 接口，可以被 `await`。

可以这样理解：协程对象是"剧本"，Task 是"正在演这场戏的剧组"——剧组要排进剧院（事件循环）的演出安排里，按节奏（调度）一段段演，演完了通知观众（回调/await 者）。同一个剧本可以同时被多个剧组演（同一个协程函数可以创建多个 Task 并发跑）。

**为什么循环需要 Task 这个中间层？**

直接驱动协程对象（`coro.send`）理论上可行，但循环要管理大量协程，需要统一回答这些问题：这个协程现在什么状态？它在等什么？完成后要把结果给谁？出异常了谁处理？要不要支持取消？……协程对象本身不提供这些管理能力。Task 包装协程后，把这些"调度管理"职责揽了过来：

- Task 持有协程引用，循环驱动的是 Task，Task 内部 `coro.send` 驱动协程。
- 协程返回时 `send` 抛 `StopIteration`，Task 捕获它、把返回值存入自己的 Future、触发完成回调、通知所有 `await` 它的协程。
- 协程抛异常时，Task 捕获异常、存入 Future、同样触发回调。
- Task 支持 `cancel()`——向协程在下一个 `await` 点抛 `CancelledError`，实现"协作式取消"。

**简化示意 Task 的核心驱动逻辑**

```python
# 伪代码：Task 驱动协程的核心步骤（省略异常/取消等细节）
class Task:
    def __init__(self, coro, loop):
        self._coro = coro
        self._loop = loop
        self._done = False
        self._result = None
        self._callbacks = []
        loop.call_soon(self._step)   # 把第一次驱动排进就绪队列

    def _step(self, exc=None):
        try:
            if exc is None:
                # 驱动协程执行到下一个 await
                result = self._coro.send(None)
            else:
                result = self._coro.throw(exc)
        except StopIteration as e:
            # 协程正常返回
            self._done = True
            self._result = e.value
            self._schedule_callbacks()
        except Exception as e:
            # 协程抛异常
            self._done = True
            self._result = e   # 异常存进 Future
            self._schedule_callbacks()
        else:
            # 协程让出、result 是它 await 的对象（Future 等）
            # 给该对象加回调：它完成时再 _step 一次
            result.add_done_callback(self._wakeup)
    
    def _wakeup(self, fut):
        # 被 await 的 Future 完成，恢复协程
        self._step()
```

这就是"循环通过 Task 驱动协程"的骨架：Task 在循环的就绪队列里排队、被循环调度时 `coro.send` 推进一步、协程让出后 Task 给被等待对象挂回调、对象完成时回调再次把 Task 排进就绪队列继续 `send`，直到协程返回或抛异常。Task 是协程和事件循环之间的"适配层"，让循环能以统一的方式管理所有协程。

### 4.6 从生成器到协程：一脉相承的"可暂停函数"

把上一章的生成器和本章的协程放在一起，能看清 Python"可暂停函数"的演进脉络：

1. **生成器（`yield`）**：为"惰性产生数据"设计。`yield` 暂停执行并产出一个值，调用者 `next` 恢复执行。暂停点固定在 `yield`。
2. **生成器协程（`yield from` + `@asyncio.coroutine`）**：旧 asyncio 利用生成器的暂停能力写异步——`yield from` 一个 Future 暂停、Future 完成后 `send` 恢复。底层就是 4.1 节描述的 send/yield 协作。但这套写法把"产数据"和"等异步"两种语义混在 `yield` 上，容易混淆。
3. **原生协程（`async def` + `await`）**：Python 3.5 引入专用语法。`async def` 明确标记"这是协程不是普通函数"，`await` 明确标记"这里是在等异步结果而不是产数据"。语义分离、清晰可读，但底层暂停-恢复机制与生成器同源——都是可挂起的帧 + send 驱动。

所以理解协程，本质上是在理解"可暂停的函数帧如何被驱动"。上一章你已经见过生成器帧的挂起与恢复，本章只是把驱动者从"调用者的 `next`"换成了"事件循环的 `send`"，并加上了 IO 多路复用和 Task 管理这一整套调度基础设施。两者是同一个机制的两种应用面。

## 5. 总结

### 5.1 本文内容要点

- 协程是"用户态可暂停可恢复的函数"。`async def` 定义协程函数，调用它得到 coroutine 对象（不会立即执行），需事件循环调度才运行。
- 事件循环是协程的调度者：单线程消息泵，不断从就绪队列取协程驱动、遇 `await` 让出、IO 完成后唤醒，往复直到所有协程完成。
- 协程 vs 线程 vs 进程：调度方分别为用户态循环 / OS / OS，切换开销极小 / 中 / 大，并发数可达几万 / 几千 / 几百。协程适合 IO 密集，不适合 CPU 密集。
- 协作式调度：协程必须主动 `await` 让出，否则独占循环饿死其它任务。抢占式调度（线程）由 OS 强制切换，无需配合但需加锁。
- 单线程事件循环无竞态：不跨 `await` 的操作天然原子，无需锁；跨 `await` 的共享状态才需要 `asyncio.Lock`。
- 协程状态：创建（CORO_CREATED）→ 挂起（CORO_SUSPENDED）→ 完成（CORO_CLOSED），可用 `inspect.getcoroutinestate` 查看。
- Task 是被循环调度的协程包装：协程对象是被动脚本，Task 把它注册到循环、管理状态/结果/回调/取消。`asyncio.create_task` 包装、`asyncio.run` 作入口。
- `await` 是协程的暂停点：对未完成对象暂停让出、完成后恢复拿到返回值。`await` 的对象必须是可等待对象（协程/Task/Future/实现 `__await__` 的对象）。
- 原理上：协程基于生成器帧的挂起-恢复（`send`/`yield` 即 `await`）；循环用 epoll/kqueue/IOCP 一次 watch 所有 IO；协作式调度下长任务必须丢线程池；Task 是协程与循环间的适配层。

### 5.2 读完本文你应能掌握

- 准确说出协程、线程、进程在调度方、切换开销、并发数、竞态、适用场景上的区别，并能据此为给定任务选型。
- 解释事件循环的工作流程：就绪队列取任务、驱动到 `await` 让出、epoll 监听 IO 就绪、唤醒对应协程，并说明为什么单线程能并发处理海量 IO。
- 说明协作式调度与抢占式调度的差异，并能解释"为什么协程里跑纯 CPU 循环会卡死循环、以及如何用 `asyncio.to_thread` 解决"。
- 阐述"单线程事件循环无竞态"的条件，明确区分"不跨 await 的原子操作"和"跨 await 的竞态操作"，知道何时需要 `asyncio.Lock`。
- 理解协程对象与 Task 的关系：为什么需要 Task 作为调度包装层、`create_task` 与直接 `await` 协程在调度时机上的差别。
- 用 `inspect.getcoroutinestate` 查看协程状态，并能根据状态诊断"协程没执行""协程卡住"等问题。
- 从原理层面说明协程与生成器的同源关系：都是"可挂起帧 + send 驱动"，`async`/`await` 是 `yield from` 时代语义分离后的专用语法。