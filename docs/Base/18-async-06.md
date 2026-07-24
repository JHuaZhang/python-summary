---
group:
  title: 【18】异步协程
  order: 18
order: 6
title: asyncio.create_task 并发执行
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 asyncio.create_task

在 asyncio 的世界里，`async def` 定义的函数被调用后得到的是一个**协程对象（coroutine）**，它本身并不会自动运行——你必须用 `await` 驱动它，或者把它交给事件循环调度。如果你只是连续写两个 `await coro1()` `await coro2()`，那么第二个协程要等第一个彻底跑完才会开始，它们并不是"并发"的，只是"异步串行"。

`asyncio.create_task(coro)` 就是解决这个问题的关键 API：它把一个协程对象包装成一个 **Task** 对象，并**立即把这个 Task 注册到当前运行的事件循环中排队调度**。换句话说，Task 一旦创建，协程就开始"在后台"跑了，不等你在当前代码行 `await` 它。这样你就可以同时创建多个 Task，让它们真正并发执行，再在需要结果的时候统一 `await`。

`asyncio.create_task` 是 Python 3.7 引入的推荐写法，取代了早期版本中 `asyncio.ensure_future` 的角色（后者仍保留，但新代码应优先用 `create_task`）。它的签名非常简单：

```python
asyncio.create_task(coro, *, name=None, context=None)
```

- `coro`：一个协程对象，即调用 `async def` 函数的返回值（如 `fetch("url")`）。
- `name`（可选）：给任务起个名字，便于调试和日志（3.8+）。
- `context`（可选）：`contextvars.Context`，让任务运行在独立的上下文中（3.11+）。
- 返回值：一个 `asyncio.Task` 对象，它本身也是 awaitable，可以 `await task` 拿到协程的返回值。

理解 `create_task` 的核心地位：它和 `asyncio.gather`、`asyncio.wait` 等并发工具一起构成了 asyncio 并发编程的基础。其中 `gather` 内部其实就是先把协程包成 Task 再统一等待，所以搞懂 `create_task` 也就理解了 asyncio 并发的底层脉络。

### 1.2 基本语法与最小用法

先看一个最小的例子，体会"创建即开始运行"这一关键行为。

```python
import asyncio

async def say(msg, delay):
    await asyncio.sleep(delay)
    print(msg)
    return delay

async def main():
    # create_task 立即把协程注册进事件循环，开始后台运行
    task = asyncio.create_task(say("hello", 0.5))
    print("task 已创建，但还没 await 它")
    # 这里 task 并未在当前行等待，它已经在后台被调度了
    result = await task   # 等它完成，取回返回值
    print("task 结果：", result)

asyncio.run(main())
```

```
# 输出：
# task 已创建，但还没 await 它
# hello
# task 结果：0.5
```

注意输出顺序：`task 已创建` 这一行先打印，说明 `create_task` 并没有阻塞当前代码；随后 `await task` 才真正等待。如果我把 `say` 的 `delay` 调大，你会更明显地看到 task 在 `await task` 之前就已经在"跑"了——只是它内部的 `sleep` 还没结束，所以没有输出。

这就是 `create_task` 与直接 `await coro()` 最大的区别：

- `await coro()`：当前行立即进入协程，跑完才回来，其它协程没机会插进来。
- `asyncio.create_task(coro)`：先把协程变成 Task 注册到循环，当前行立刻继续往下走；协程在后台由循环驱动，等你 `await task` 时再等它完成。

后续章节会展开它的所有用法、状态管理、回调机制，以及背后的原理。

## 2. 核心内容

### 2.1 create_task 的完整签名与参数

```python
asyncio.create_task(coro, *, name=None, context=None)
```

**参数说明**

| 参数 | 说明 | 版本 |
|------|------|------|
| `coro` | 协程对象。必须是 `async def` 函数调用后的返回值，不能是普通函数或 future | — |
| `name` | 任务名，字符串，可通过 `task.get_name()` 读取，在调试输出和日志中可见 | 3.8+ |
| `context` | 任务运行时使用的 `contextvars.Context`，默认继承当前上下文；传入后任务的上下文变量独立 | 3.11+ |

**返回值**：`asyncio.Task` 对象。Task 是 Future 的子类，同时也是 awaitable。它可以被 `await`、被 `cancel`、被查询状态、被附加回调。

**强制关键字参数**：`name` 和 `context` 只能用关键字方式传，不能按位置传，例如 `asyncio.create_task(fet(), "t1")` 是错的，必须写成 `asyncio.create_task(fet(), name="t1")`。

**调用前提**：`create_task` 必须在一个正在运行的事件循环里调用。在 `asyncio.run()` 管理的协程内部、或在 `loop.run_until_complete` 启动的协程内部调用都是没问题的。但如果在没有任何循环运行时（比如模块顶层直接调）就会抛 `RuntimeError: no running event loop`。

**demo：name 的作用**

```python
import asyncio

async def worker(n):
    await asyncio.sleep(0.1)
    return n * 2

async def main():
    tasks = []
    for i in range(3):
        # 给每个任务取名，方便在调试时区分
        t = asyncio.create_task(worker(i), name=f"worker-{i}")
        tasks.append(t)
    # 任务名可在循环日志 / asyncio 调试输出中看到
    for t in tasks:
        print(t.get_name(), "->", await t)

asyncio.run(main())
```

```
# 输出：
# worker-0 -> 0
# worker-1 -> 2
# worker-2 -> 4
```

任务名不会影响执行逻辑，但当你在 `asyncio.all_tasks()` 里排查"哪个任务卡住了"，或用 `logging` 输出任务信息时，`name` 能极大提升可读性。

**demo：context 隔离上下文变量**

```python
import asyncio
import contextvars

request_id = contextvars.ContextVar("request_id")

async def child():
    # 读取当前任务绑定的上下文变量
    print("child 看到 request_id =", request_id.get())
    await asyncio.sleep(0.01)

async def main():
    request_id.set("main-007")
    # 默认继承当前上下文：任务里能读到 main-007
    t1 = asyncio.create_task(child(), name="inherit")
    # 传入一个独立 context，在其中设置不同的值
    ctx = contextvars.copy_context()
    ctx.run(request_id.set, "isolated-999")
    t2 = asyncio.create_task(child(), name="isolated", context=ctx)
    await asyncio.gather(t1, t2)

asyncio.run(main())
```

```
# 输出：
# child 看到 request_id = main-007
# child 看到 request_id = isolated-999
```

这个特性在做请求级隔离（如 Web 框架里每个请求一个 `request_id`、一个用户身份）时很有用。不过日常并发多数用不到 `context`，传 `coro` 和可选的 `name` 就够了。

### 2.2 await task：等待完成并取结果

`create_task` 返回的 Task 对象本身是 awaitable，`await task` 的行为是：

- 如果 task 已完成：立即返回协程的返回值（或重新抛出协程里发生的异常）。
- 如果 task 还在跑：挂起当前协程，让出控制权给事件循环，直到 task 完成，再恢复并返回结果。
- 如果 task 被取消：`await task` 会抛 `asyncio.CancelledError`。

**demo：await 已完成 vs 未完成的 task**

```python
import asyncio

async def compute(x):
    await asyncio.sleep(0.2)
    return x + 100

async def main():
    t = asyncio.create_task(compute(5))
    # 此时还没 await，但 task 已经在后台跑
    # 我们先干点别的事
    await asyncio.sleep(0.3)   # 比任务耗时更长
    # 到这里 task 基本已跑完
    if t.done():
        print("任务已完成，result =", t.result())
    r = await t   # 已完成则立即返回，不再等待
    print("await 拿到：", r)

asyncio.run(main())
```

```
# 输出：
# 任务已完成，result = 105
# await 拿到：105
```

**异常如何传播**：如果协程内部抛了异常（且没被协程自己捕获），这个异常会被存进 task，等你 `await task` 时重新抛出。也就是说，你不 `await` 这个 task，异常就像"憋在"task 里，不会立刻炸出来。这一点后面会专门讲。

```python
import asyncio

async def boom():
    await asyncio.sleep(0.1)
    raise ValueError("炸了")

async def main():
    t = asyncio.create_task(boom())
    try:
        await t
    except ValueError as e:
        print("捕获到 task 的异常：", e)

asyncio.run(main())
```

```
# 输出：
# 捕获到 task 的异常：炸了
```

如果你创建了 task 却从不 `await` 它（也不 `gather`/`wait`），一旦它内部出错，Python 会在 task 被 GC 时打印一条警告 `"Task was destroyed but it is pending!"` 或 `"Task exception was never retrieved"`，这是非常常见的坑，后面最佳实践会详细讲。

### 2.3 并发 vs 串行：为什么必须用 create_task

这是初学 asyncio 最容易忽略的一点：**只写 `await coro()` 不会并发**。看下面这个经典对比。

**串行写法（错误地以为会并发）**

```python
import asyncio
import time

async def fetch(url, seconds):
    print(f"开始 {url}")
    await asyncio.sleep(seconds)
    print(f"完成 {url}")
    return f"{url} 的数据"

async def main():
    start = time.perf_counter()
    # 三个 await 串行：第二个等第一个跑完才开始
    r1 = await fetch("url-A", 1)
    r2 = await fetch("url-B", 1)
    r3 = await fetch("url-C", 1)
    print("耗时：", round(time.perf_counter() - start, 2), "s")

asyncio.run(main())
```

```
# 输出：
# 开始 url-A
# 完成 url-A
# 开始 url-B
# 完成 url-B
# 开始 url-C
# 完成 url-C
# 耗时：3.0 s
```

总耗时是三个 sleep 之和（约 3 秒）。因为 `await` 是"等当前协程跑完再继续"，三个 await 是挨个执行的，每次都让出了控制权，但循环里没有别的 task 准备好，所以等于逐个等待。

**并发写法（create_task + gather）**

```python
import asyncio
import time

async def fetch(url, seconds):
    print(f"开始 {url}")
    await asyncio.sleep(seconds)
    print(f"完成 {url}")
    return f"{url} 的数据"

async def main():
    start = time.perf_counter()
    # 先用 create_task 把三个协程都注册进循环，它们立刻开始后台运行
    t1 = asyncio.create_task(fetch("url-A", 1))
    t2 = asyncio.create_task(fetch("url-B", 1))
    t3 = asyncio.create_task(fetch("url-C", 1))
    # 再统一等待三个任务完成
    results = await asyncio.gather(t1, t2, t3)
    print("结果：", results)
    print("耗时：", round(time.perf_counter() - start, 2), "s")

asyncio.run(main())
```

```
# 输出：
# 开始 url-A
# 开始 url-B
# 开始 url-C
# 完成 url-A
# 完成 url-B
# 完成 url-C
# 结果：['url-A 的数据', 'url-B 的数据', 'url-C 的数据']
# 耗时：1.0 s
```

总耗时约 1 秒（三个任务里最长的那个），而非 3 秒。这就是并发：三个任务在同一个事件循环里交替推进，`asyncio.sleep` 期间循环去跑别的任务。

**为什么 `gather` 写法也能并发**：`asyncio.gather(t1, t2, t3)` 内部做的事情，本质就是把传入的协程/Task 都转成 Task 并等待全部完成。所以你直接 `await asyncio.gather(fetch(...), fetch(...), fetch(...))` 也能并发。但理解 `create_task` 是把握底层的关键——后续你要精细控制（取消某个任务、加回调、限制并发数）时，手里握着 Task 对象才有操作空间。

**不等长耗时的并发**

```python
import asyncio
import time

async def fetch(url, seconds):
    await asyncio.sleep(seconds)
    return f"{url}({seconds}s)"

async def main():
    start = time.perf_counter()
    # 三个任务耗时分别是 0.3、0.8、0.5
    tasks = [
        asyncio.create_task(fetch("A", 0.3)),
        asyncio.create_task(fetch("B", 0.8)),
        asyncio.create_task(fetch("C", 0.5)),
    ]
    results = await asyncio.gather(*tasks)
    print("结果：", results)
    print("耗时：", round(time.perf_counter() - start, 2), "s")
    # 并发后总耗时 ≈ max(0.3, 0.8, 0.5) = 0.8，而不是 sum = 1.6

asyncio.run(main())
```

```
# 输出：
# 结果：['A(0.3s)', 'B(0.8s)', 'C(0.5s)']
# 耗时：0.8 s
```

并发场景下，总耗时由"最慢的那个任务"决定，这就是为什么并发能显著缩短等待密集型任务的总体时间。

### 2.4 Task 与 coroutine 的区别

把 `create_task` 用对，必须分清"协程对象（coroutine）"和"Task 对象"的本质差异。

| 维度 | coroutine 对象 | Task 对象 |
|------|----------------|-----------|
| 来源 | 调用 `async def` 函数返回 | `asyncio.create_task(coro)` 包装得到 |
| 是否被调度 | 否，不放进循环就不会跑 | 是，构造时即注册进当前循环，下次循环迭代开始执行 |
| 状态 | 只有"未启动"和"已执行完"（被 await 驱动到底） | 有 pending / done / cancelled 等丰富状态 |
| 取消 | 无法直接取消（还没进循环） | 可 `task.cancel()` |
| 回调 | 不支持 | 可 `task.add_done_callback(fn)` |
| 结果 | 只能 `await coro` 拿返回值 | 可 `task.result()` 在完成后直接拿，或 `await task` |
| GC 行为 | 短生命周期，await 完即结束 | 在循环的弱引用表中，若无强引用可能被回收 |

**demo：协程不创建 task 就不会跑**

```python
import asyncio

async def work():
    print("我开始跑了")
    await asyncio.sleep(0.1)
    print("我跑完了")

async def main():
    coro = work()            # 只是得到协程对象，没跑
    print("只调用协程，未 await 也未 create_task")
    await asyncio.sleep(0.3) # 干别的事
    # 这里 work 的 print 不会出现，因为它根本没被调度
    # 最后必须 await 或 close 它，否则 Python 会警告 "coroutine was never awaited"
    coro.close()             # 显式关闭，避免警告

asyncio.run(main())
```

```
# 输出：
# 只调用协程，未 await 也未 create_task
```

可以看到，`work()` 的两行 print 都没出现，因为协程对象不会被自动驱动。只有 `await coro` 或 `create_task(coro)` 才能让它真正执行。

**demo：Task 一创建就开始跑**

```python
import asyncio

async def work(label):
    print(f"[{label}] 第1步")
    await asyncio.sleep(0.1)
    print(f"[{label}] 第2步")

async def main():
    t = asyncio.create_task(work("T"))
    print("create_task 之后，主协程继续")
    await asyncio.sleep(0.05)   # 让出控制权，task 得到执行机会
    print("主协程恢复")
    await t                     # 等 task 完成

asyncio.run(main())
```

```
# 输出：
# create_task 之后，主协程继续
# [T] 第1步
# 主协程恢复
# [T] 第2步
```

注意：`create_task` 之后并不是"立刻同步执行协程到第一个 await"——它只是把 Task 标记为就绪，真正执行要等到当前协程主动让出（`await` 让出）控制权时，事件循环才会调度它。所以输出里 `[T] 第1步` 出现在"主协程继续"之后、在主协程 `await asyncio.sleep(0.05)` 让出时才被调度。理解这个调度时机，对后面排查"为什么我的 task 没及时跑"很重要。

### 2.5 保存 Task 强引用：避免被 GC 的陷阱

这是 `create_task` 最隐蔽、也最常被忽视的陷阱。看下面这个"看似正常"的代码：

**错误示范：不保存 task 引用**

```python
import asyncio

async def background_work(n):
    await asyncio.sleep(0.5)
    print(f"任务 {n} 完成")

async def main():
    # 创建任务但没把返回的 Task 存进任何变量
    asyncio.create_task(background_work(1))
    asyncio.create_task(background_work(2))
    print("任务已创建")
    await asyncio.sleep(0.2)   # 等一小会
    # 期间没有任何强引用指向这两个 task
    print("main 结束")

asyncio.run(main())
```

```
# 输出（行为不确定，可能）：
# 任务已创建
# main 结束
# （两个任务的"完成"可能根本不打印，因为 task 被垃圾回收了）
```

**为什么会这样**？CPython 的 asyncio 内部只用**弱引用（weakref）**跟踪所有 Task。如果你在用户代码里不保留对 Task 的强引用，CPython 的引用计数 / 分代 GC 可能在任意时刻回收这个 Task 对象，导致协程中途被悄无声息地丢弃，既不完成也不报错。是否触发取决于 GC 时机，所以这类 bug 经常时灵时不灵，极难排查。

官方文档明确警告：*Save a reference to the result of this function, to avoid a task disappearing mid-execution.*

**正确写法：把 task 存起来**

```python
import asyncio

async def background_work(n):
    await asyncio.sleep(0.5)
    print(f"任务 {n} 完成")

async def main():
    tasks = []
    # 用列表保存强引用
    tasks.append(asyncio.create_task(background_work(1)))
    tasks.append(asyncio.create_task(background_work(2)))
    print("任务已创建，强引用保存在 tasks 列表")
    await asyncio.gather(*tasks)   # 同时也就保存了引用并等待
    print("main 结束")

asyncio.run(main())
```

```
# 输出：
# 任务已创建，强引用保存在 tasks 列表
# 任务 1 完成
# 任务 2 完成
# main 结束
```

**对比总结**

| 写法 | 问题 |
|------|------|
| `asyncio.create_task(f())`（不接返回值） | task 无强引用，可能被 GC 回收消失 |
| `_ = asyncio.create_task(f())` | 单变量持有尚可，但容易在重新赋值时丢失引用 |
| `tasks = [asyncio.create_task(f()) ...]; await gather(*tasks)` | 推荐：引用稳定 + 统一等待 |

**一个更隐蔽的变体**：有时你把 task 传给了 `gather`，但 `gather` 返回的 future 又没被 await 或保存，这种链式丢失同样会导致任务被回收。原则是：**从 task 创建到它完成的整段时间里，必须始终有至少一个强引用可达**。

**demo：用 set 维护后台任务集合的常见模式**

```python
import asyncio

background_tasks: set[asyncio.Task] = set()

def spawn(coro):
    task = asyncio.create_task(coro)
    # 加入集合，保证强引用
    background_tasks.add(task)
    # 任务完成后自动从集合移除，避免集合无限增长
    task.add_done_callback(background_tasks.discard)
    return task

async def heartbeat(n):
    while True:
        await asyncio.sleep(0.3)
        print(f"心跳 {n}")

async def main():
    spawn(heartbeat(1))
    spawn(heartbeat(2))
    await asyncio.sleep(1.0)
    print("main 结束（心跳任务仍在后台跑，随主循环退出而取消）")

asyncio.run(main())
```

```
# 输出：
# 心跳 1
# 心跳 2
# 心跳 1
# 心跳 2
# 心跳 1
# 心跳 2
# main 结束（心跳任务仍在后台跑，随主循环退出而取消）
```

上面 `spawn` + 全局 `set` + `discard` 回调是处理"fire and forget"后台任务的经典写法，既保证强引用，又能让已完成的任务被清理。

### 2.6 任务的状态：pending / done / cancelled

一个 Task 从创建到结束，会经历若干状态。掌握状态查询方法对调试和编排非常关键。

| 状态 | 含义 | 查询方法 |
|------|------|----------|
| pending | 已创建但未完成，仍在循环中等待执行或运行中 | `not task.done() and not task.cancelled()` |
| done | 正常完成、抛异常或被取消后的"已结束"态 | `task.done()` 返回 True |
| cancelled | 被取消，属于 done 的一个子情况 | `task.cancelled()` 返回 True |

**关键方法**

- `task.done()`：任务结束时返回 True。无论是正常返回、抛异常、还是被取消，都算 done。
- `task.cancelled()`：仅当任务被取消（且取消成功）时返回 True。
- `task.cancel(msg=None)`：请求取消任务。它会在任务下一次被调度时向其抛入 `CancelledError`。返回 True 表示取消请求已发出（不保证已完成）。
- `task.running()`：在较新版本中已不常用，且语义有限；一般用 `not done()` 判断"还在跑"。

**demo：观察状态变化**

```python
import asyncio

async def work():
    await asyncio.sleep(0.5)
    return 42

async def main():
    t = asyncio.create_task(work())
    print("刚创建：done =", t.done(), "cancelled =", t.cancelled())
    await asyncio.sleep(0.1)
    print("跑了一会儿：done =", t.done())
    r = await t
    print("完成后：done =", t.done(), "result =", r)

asyncio.run(main())
```

```
# 输出：
# 刚创建：done = False cancelled = False
# 跑了一会儿：done = False
# 完成后：done = True result = 42
```

**demo：取消一个任务**

```python
import asyncio

async def long_work():
    try:
        print("开始长任务")
        await asyncio.sleep(10)
        print("这行不会执行")
    except asyncio.CancelledError:
        print("被取消了，做点清理")
        raise   # 重要：取消异常通常应向上抛出，让 task 进入 cancelled 状态

async def main():
    t = asyncio.create_task(long_work())
    await asyncio.sleep(0.1)
    t.cancel()              # 发出取消请求
    try:
        await t
    except asyncio.CancelledError:
        print("main 捕获：任务被取消")
    print("cancelled =", t.cancelled(), "done =", t.done())

asyncio.run(main())
```

```
# 输出：
# 开始长任务
# 被取消了，做点清理
# main 捕获：任务被取消
# cancelled = True done = True
```

取消机制要点：

1. `cancel()` 只是"请求"取消，它把一个 `CancelledError` 安排进任务的下次执行。如果任务此刻正 `await` 在某个 future 上，这个 future 会被取消，从而把 `CancelledError` 抛回任务。
2. 在任务内部捕获 `CancelledError` 后可以做清理，但**通常应该重新 `raise`**，否则 task 会被认为"正常完成"，调用方的 `await task` 也就不会抛 `CancelledError`，状态会变成 done 而非 cancelled，这会破坏取消语义。
3. `cancel()` 返回 True 不代表任务已取消完成，只是请求已发出；要等 `await t` 抛 `CancelledError` 后，`t.cancelled()` 才会是 True。

### 2.7 task.result() 与 task.exception()

除了 `await task`，Task 还提供直接访问结果/异常的方法，适合"任务已经做完，我顺手取一下"的场景。

- `task.result()`：如果已完成且正常返回，返回协程的返回值；如果协程抛了异常，重新抛该异常；如果被取消，抛 `CancelledError`；如果尚未完成，抛 `InvalidStateError`。
- `task.exception()`：如果协程抛了异常，返回该异常对象（不抛出）；如果正常完成，返回 None；如果尚未完成或被取消，抛 `InvalidStateError`（取消时抛 `CancelledError`）。

**demo：result / exception 的取值规则**

```python
import asyncio

async def ok():
    await asyncio.sleep(0.05)
    return "OK"

async def fail():
    await asyncio.sleep(0.05)
    raise RuntimeError("出错了")

async def main():
    t1 = asyncio.create_task(ok())
    t2 = asyncio.create_task(fail())
    await asyncio.sleep(0.2)   # 确保两个任务都已结束

    # 已完成 → 直接拿结果
    print("t1.result() =", t1.result())
    # 抛过异常 → result() 重新抛
    try:
        t2.result()
    except RuntimeError as e:
        print("t2.result() 抛：", e)
    # exception() 返回异常对象本身
    print("t2.exception() =", t2.exception())
    print("t1.exception() =", t1.exception())   # 正常完成 → None

asyncio.run(main())
```

```
# 输出：
# t1.result() = OK
# t2.result() 抛：出错了
# t2.exception() = 出错了
# t1.exception() = None
```

**未完成时调用 result 会报错**

```python
import asyncio

async def work():
    await asyncio.sleep(1)

async def main():
    t = asyncio.create_task(work())
    try:
        t.result()
    except asyncio.InvalidStateError as e:
        print("任务还没完成，不能取结果：", e.__class__.__name__)
    await t

asyncio.run(main())
```

```
# 输出：
# 任务还没完成，不能取结果：InvalidStateError
```

所以 `result()` 不能当作"等待并取结果"用——它不阻塞。要"等并取"请用 `await task`。`result()` 适合你已经在别处等待过、或任务自然结束时使用。

**异常未被 retrieve 的警告**

如果一个抛了异常的 task 从未被 `await`、`result()` 或 `exception()` 访问过，asyncio 在销毁该 task 时会打印：`Task exception was never retrieved`。这提醒你：异常被吞掉了，可能是个 bug。所以即便你只关心"任务跑没跑完"，也建议用 `await` 或 `gather` 收一下异常。

### 2.8 add_done_callback：任务完成回调

有时你不想阻塞等待一个任务，而是希望"它一完成就通知我/做点什么"。`add_done_callback` 就是为此设计。

```python
task.add_done_callback(callback, *, context=None)
task.remove_done_callback(callback)   # 移除（按引用相等）
```

回调签名是 `callback(task)`——`task` 是那个完成的 Task 对象。回调在事件循环线程中同步执行，且在 task 完成**之后**立即被调度。回调里通常用 `task.result()` 取结果（注意异常处理，因为如果有异常 `result()` 会抛），或者只是发个信号。

**demo：回调取结果**

```python
import asyncio

async def fetch(url, sec):
    await asyncio.sleep(sec)
    return f"{url} 数据"

def on_done(task):
    # 回调里要处理异常，否则异常会丢到循环里
    if task.cancelled():
        print("回调：任务被取消")
        return
    exc = task.exception()
    if exc:
        print("回调：任务出错 ->", exc)
        return
    print("回调：任务完成 ->", task.result())

async def main():
    t1 = asyncio.create_task(fetch("url-A", 0.2))
    t2 = asyncio.create_task(fetch("url-B", 0.4))
    t1.add_done_callback(on_done)
    t2.add_done_callback(on_done)
    # 主协程不阻塞等待，干别的事
    await asyncio.sleep(0.6)
    print("main 结束")

asyncio.run(main())
```

```
# 输出：
# 回调：任务完成 -> url-A 数据
# 回调：任务完成 -> url-B 数据
# main 结束
```

可以看到 t1 先完成、它的回调先触发；t2 后完成、回调后触发。回调触发的时机正是任务完成的时刻，而不是你 await 它的时刻。

**回调里要注意的坑**

1. 回调是同步函数，不能 `await`。如果要在回调里跑协程，得用 `asyncio.create_task` 再起一个。
2. 回调里调用 `task.result()` 时，若 task 抛过异常，会重新抛出，务必 `try/except` 或先查 `task.exception()`。
3. 回调执行是"一次性的"，任务完成后只会调一次。如果你 add 多个回调，按添加顺序依次调用。
4. 不要在回调里做耗时操作，它会阻塞事件循环线程。

**demo：回调里再起协程**

```python
import asyncio

async def save_to_db(result):
    await asyncio.sleep(0.1)
    print(f"已写入数据库：{result}")

async def fetch(url):
    await asyncio.sleep(0.2)
    return f"{url} 数据"

def on_fetched(task):
    data = task.result()
    # 在回调里不能 await，但可以再 create_task 把后续异步工作丢给循环
    asyncio.create_task(save_to_db(data))

async def main():
    t = asyncio.create_task(fetch("url-X"))
    t.add_done_callback(on_fetched)
    # 给回调里新起的 save_to_db 留时间完成
    await asyncio.sleep(0.5)
    print("main 结束")

asyncio.run(main())
```

```
# 输出：
# 已写入数据库：url-X 数据
# main 结束
```

注意这里回调里 `create_task` 又踩到了"必须保存强引用"的坑：`save_to_db` 这个新 task 没有被任何变量持有，理论上可能被回收。但由于 `await asyncio.sleep(0.5)` 期间主协程持有循环引用链，多数情况能跑完。生产代码里应把回调里新起的 task 也加入强引用集合。

### 2.9 create_task 必须在运行的事件循环内调用

`create_task` 内部要调用 `asyncio.get_running_loop()`，拿到"当前线程正在跑的那个循环"，然后把 task 注册进去。如果你在没有任何循环运行时调它，就会报错。

**错误示范**

```python
import asyncio

# 模块顶层，没有循环在跑
async def hello():
    return "hi"

# asyncio.create_task(hello())  # RuntimeError: no running event loop
```

正确做法是把 `create_task` 调用放在一个 `async def` 协程内部，再通过 `asyncio.run` 启动这个协程——`asyncio.run` 会建立并运行事件循环，协程体内 `get_running_loop()` 才能拿到它。

**demo：把 create_task 放进协程里就对了**

```python
import asyncio

async def hello():
    return "hi"

async def main():
    t = asyncio.create_task(hello())   # 在协程里，循环正在运行
    print(await t)

asyncio.run(main())
```

```
# 输出：
# hi
```

**线程边界注意**：`create_task` 只能注册到**当前线程**的运行循环。如果你在另一个线程里（比如回调线程、工作线程）想往主循环里加任务，不能直接 `create_task`，而要用 `asyncio.run_coroutine_threadsafe(coro, loop)`，它会把任务安全地提交到指定循环。

### 2.10 与 ensure_future 的关系

`asyncio.ensure_future(coro)` 是 3.7 之前的通用写法，它更"通用"也更"混乱"：

- 传入协程 → 包成 Task（等价于 `create_task`）。
- 传入 Future / Task → 原样返回。
- 传入 awaitable（自定义 `__await__`）→ 包成一个 Future。

官方现在推荐新代码统一用 `create_task` 来"把协程变 Task"，语义更明确：`create_task` 只接受协程，传别的会 `TypeError`，不会出现 `ensure_future` 那种"什么都能传"的模糊行为。`ensure_future` 主要保留给库作者处理多态输入。

**一句话**：业务代码里把协程并发起来，认准 `asyncio.create_task`。

### 2.11 典型并发模式

这里汇总几种最常见的"把多个协程用 create_task 跑起来"的写法。

**模式一：列表推导 + gather**

```python
import asyncio

async def fetch(url):
    await asyncio.sleep(0.2)
    return f"{url} ok"

async def main():
    urls = ["a", "b", "c", "d"]
    # 一次性把所有协程变成 task 并加入循环
    tasks = [asyncio.create_task(fetch(u)) for u in urls]
    # 统一等待，结果顺序与 tasks 顺序一致
    results = await asyncio.gather(*tasks)
    print(results)

asyncio.run(main())
```

```
# 输出：
# ['a ok', 'b ok', 'c ok', 'd ok']
```

**模式二：gather 直接传协程**

```python
import asyncio

async def fetch(url):
    await asyncio.sleep(0.2)
    return f"{url} ok"

async def main():
    urls = ["a", "b", "c"]
    # gather 内部会把协程包成 task，效果等价
    results = await asyncio.gather(*(fetch(u) for u in urls))
    print(results)

asyncio.run(main())
```

```
# 输出：
# ['a ok', 'b ok', 'c ok']
```

两种写法并发效果一致。差别在于：用 `create_task` 显式包后你手里有 Task 对象，可以单独取消、加回调；直接传协程给 gather 则把控制权交给 gather，外部拿不到单独的 task。

**模式三：完成后逐个处理（as_completed）**

如果你希望"谁先完成先处理谁"，而不是等全部完成，用 `asyncio.as_completed`：

```python
import asyncio
import time

async def fetch(url, sec):
    await asyncio.sleep(sec)
    return f"{url}({sec}s)"

async def main():
    start = time.perf_counter()
    jobs = [
        asyncio.create_task(fetch("A", 0.5)),
        asyncio.create_task(fetch("B", 0.2)),
        asyncio.create_task(fetch("C", 0.4)),
    ]
    # as_completed 返回一个迭代器，谁先完成谁先出现
    for coro in asyncio.as_completed(jobs):
        r = await coro
        print(f"[{round(time.perf_counter()-start, 2)}s] 收到：", r)

asyncio.run(main())
```

```
# 输出：
# [0.2s] 收到： B(0.2s)
# [0.4s] 收到： C(0.4s)
# [0.5s] 收到： A(0.5s)
```

**模式四：限制并发数（信号量）**

一次性 `create_task` 几万个协程会爆内存/打爆下游。常用 `asyncio.Semaphore` 限制同时进行数：

```python
import asyncio

sem = asyncio.Semaphore(3)   # 同时最多 3 个

async def fetch(url):
    async with sem:
        print(f"开始 {url}")
        await asyncio.sleep(0.3)
        return f"{url} ok"

async def main():
    urls = [f"u{i}" for i in range(10)]
    tasks = [asyncio.create_task(fetch(u)) for u in urls]
    results = await asyncio.gather(*tasks)
    print("结果数：", len(results))

asyncio.run(main())
```

```
# 输出（每批 3 个）：
# 开始 u0
# 开始 u1
# 开始 u2
# 开始 u3
# 开始 u4
# 开始 u5
# 开始 u6
# 开始 u7
# 开始 u8
# 开始 u9
# 结果数：10
```

虽然 10 个 task 都立刻创建了，但 `Semaphore` 让真正进入 `fetch` 体的只有 3 个，其它在 `acquire` 处排队，等前面的释放。这是控制并发量最简洁的写法。

**模式五：gather 的异常处理**

`asyncio.gather` 默认在某个任务抛异常时，把异常作为结果返回到对应位置，同时取消其它任务（first exception 策略）。可用 `return_exceptions=True` 让它不取消、把异常对象直接放进结果列表：

```python
import asyncio

async def ok(x):
    await asyncio.sleep(0.1)
    return x

async def boom():
    await asyncio.sleep(0.2)
    raise ValueError("炸了")

async def main():
    tasks = [asyncio.create_task(ok(1)),
             asyncio.create_task(boom()),
             asyncio.create_task(ok(3))]
    # return_exceptions=True：异常不抛出，作为结果元素
    results = await asyncio.gather(*tasks, return_exceptions=True)
    for i, r in enumerate(results):
        if isinstance(r, Exception):
            print(f"任务 {i} 失败：{r}")
        else:
            print(f"任务 {i} 成功：{r}")

asyncio.run(main())
```

```
# 输出：
# 任务 0 成功：1
# 任务 1 失败：炸了
# 任务 2 成功：3
```

这种方式很适合"批量请求，部分失败也要继续"的场景。

## 3. 最佳实践

**始终保存 task 的强引用**

最常见的坑就是创建了 task 却不保存引用，导致任务被 GC 回收后莫名消失。推荐用列表或集合收集：`tasks = [asyncio.create_task(f(u)) for u in urls]`，再 `await asyncio.gather(*tasks)`。对"fire and forget"的后台任务，用全局 `set` + `add_done_callback(set.discard)` 模式。

**优先 gather/wait 而不是裸 await 多个 task**

虽然你可以写 `await t1; await t2; await t3`，但这样它们其实仍是并发的（因为已经被 `create_task` 注册），只是取结果的顺序固定。更可读、更不容易出错的是 `await asyncio.gather(t1, t2, t3)`。如果你需要"全部完成"或"第一个完成就返回"这类语义，用 `gather` / `wait` 表达更清晰。

**不要在回调里做重活**

`add_done_callback` 的回调在事件循环线程里同步执行，做耗时操作会卡住整个循环。回调里只做轻量动作（取结果、发信号、`create_task` 再起一个异步工作）。凡是 `await` 的事都不能写在回调里，必须新起 task。

**取消任务时让 CancelledError 传播**

在任务内部捕获 `CancelledError` 做清理后，通常应重新 `raise`，保持取消语义完整。如果你吞掉了 `CancelledError`，调用方 `await t` 会拿到协程的返回值，`t.cancelled()` 是 False，这在 `gather`、`wait` 等编排里会造成意外行为。

**比较下面两种写法**

```python
# 不推荐：吞掉取消异常
async def bad():
    try:
        await asyncio.sleep(10)
    except asyncio.CancelledError:
        print("清理后假装正常完成")
        return "done"   # 调用方会以为任务正常完成

# 推荐：清理后重新抛出
async def good():
    try:
        await asyncio.sleep(10)
    except asyncio.CancelledError:
        print("清理中")
        raise
```

**用 gather 的 return_exceptions 处理批量失败**

批量并发请求时，个别失败不应让整批崩溃。用 `await asyncio.gather(*tasks, return_exceptions=True)`，然后遍历结果按 `isinstance(r, Exception)` 分类处理。这样你能拿到全部结果（含失败），便于统计和重试。

**给任务命名便于调试**

`asyncio.create_task(coro, name="fetch-user-123")` 几乎零成本却能大幅提升可调试性。在 `asyncio.all_tasks()` 排查、日志输出、异常追踪时都能看到名字。

**在协程内部调用 create_task，别在顶层调**

`create_task` 依赖"当前运行中的循环"。养成习惯：在 `async def` 函数体内调它，顶层只负责 `asyncio.run(main())`。跨线程提交任务用 `run_coroutine_threadsafe`。

**留意"fire and forget"任务的异常**

如果任务出错但你从不 `await`/`result`/`exception`，会被打印 `Task exception was never retrieved` 警告。即便不关心结果，也建议加个 `add_done_callback` 检查 `task.exception()` 并记录日志，避免异常被悄悄吞掉。

**控制并发量，别一次性 create_task 几万个**

每个 task 都是一个对象、占内存，且全都注册进循环。对大批量耗时任务，配合 `Semaphore` 或分批 `gather` 限制并发。常见模式：`async with sem: ...` 控制真正执行的并发数。

**await 之前先检查 done**

某些场景你已经在别处等待过任务，再次需要其结果时可以先 `if task.done(): return task.result()`，避免无意义的 `await`（虽然已完成的 task 的 await 是立即返回，但显式检查能让意图更清晰）。

## 4. 原理

### 4.1 create_task 内部：把协程包装成 Task

`asyncio.create_task(coro)` 的实现非常薄，核心就两步：

1. 调用 `asyncio.get_running_loop()` 拿到当前线程的事件循环。如果没循环在跑，直接 `RuntimeError`。
2. 调用 `loop.create_task(coro)`，它等价于 `Task(coro, loop=loop)`。

所以我们真正要理解的是 `Task` 的构造：`Task.__init__` 做了什么，让一个协程"活"起来。

**Task 构造时做了什么**：

- 把传入的协程对象保存在 `self._coro`。
- 调用 `loop.call_soon(self.__step, context=self._context)`，把 Task 自己的 `__step` 方法排进循环的"就绪队列"。
- 把自己加入循环的弱引用任务集合（`loop._all_tasks` 或等价结构），用于 `asyncio.all_tasks()` 等查询。

关键点：`call_soon(self.__step)` 就是"在事件循环下次迭代时执行一次 `self.__step()`"。这意味着 Task **在构造完成的瞬间就已经被排进就绪队列**——只要当前协程让出控制权，循环就会立刻来驱动它。这就是"创建即开始调度"的来源。

注意"开始调度"不等于"立刻同步执行"。`call_soon` 只是把回调放进队列，当前 Python 调用栈还在 `create_task` 的调用方继续往下走；要等当前协程 `await` 让出、循环回到事件循环主循环（`loop.run_forever` 的迭代），才会从就绪队列取出 `__step` 执行。

### 4.2 Task.__step：驱动协程到 await 让出

`Task.__step` 是整个 asyncio 协程调度的心脏，它的逻辑大致是：

1. 检查 task 是否已被取消，若是，向协程注入 `CancelledError`（通过 `coro.throw`）。
2. 否则，调用 `coro.send(None)`，驱动协程执行到下一个 `await` 表达式。
3. `coro.send` 可能返回：
   - 一个 future（或 awaitable 解包后的 future）：说明协程在等这个 future 完成。Task 把自己注册为该 future 的回调（`future.add_done_callback(self.__wakeup)`），然后**返回**——协程挂起，控制权交还事件循环。这就是"让出"。
   - 抛 `StopIteration`：协程执行完毕。`StopIteration.value` 就是协程的返回值。Task 调用 `self.set_result(value)` 标记完成，并触发所有 `done_callback`。
   - 抛其它异常：Task 调用 `self.set_exception(exc)` 标记完成（异常存入 task），触发回调。

当协程 await 的那个 future 完成（比如 `asyncio.sleep` 到期、socket 可读）时，事件循环会调用 `Task.__wakeup`，它再调用 `__step`，继续 `coro.send`……如此循环，直到协程结束。

**串行 await coro 为什么不并发**？当你写 `await coro1()`，实际上是在当前协程里直接 `coro1.send(None)` 驱动 coro1，coro1 内部又 `await` 别的 future，于是当前协程也跟着挂起在那个 future 上。整个过程只有一条协程链，没有"第二个 task"在循环里排队。所以三个 `await coro()` 是一条链做完再做下一条，累计耗时。

**create_task 为什么能并发**？因为 `create_task` 把每个协程都包成独立 Task、各自 `call_soon(__step)` 排进就绪队列。主协程 `await asyncio.gather(...)` 时挂起在 gather 的 future 上，让出循环；循环从就绪队列取出各 Task 的 `__step` 依次执行，每个 Task 跑到自己的 `await asyncio.sleep` 时又各自挂起在自己的 future 上。sleep 到期时循环唤醒对应 Task 的 `__wakeup`，继续推进。于是多个 Task 在同一循环里交替执行——这就是并发。

### 4.3 完成与结果存储

当协程 `return value` 时，`coro.send` 抛 `StopIteration(value)`。Task 在 `__step` 里捕获它，调用 `Future.set_result(value)`（Task 继承自 Future）。`set_result` 做的事：

1. 把 `value` 存入 `self._result`。
2. 标记 `self._state = "done"`。
3. 调用所有通过 `add_done_callback` 注册的回调。
4. 唤醒所有正在 `await self` 的协程（通过 future 完成机制）。

此后 `task.result()` 直接返回 `self._result`；`await task` 因为 task 已 done 会立即返回结果。如果协程抛异常，则 `set_exception` 把异常存入 `self._exception`，`task.result()` 重新抛出，`task.exception()` 返回异常对象。

### 4.4 为什么必须强引用：弱引用表的陷阱

为什么 asyncio 不强引用所有 task，而要用弱引用？官方的解释是避免循环泄漏：Task 内部持有协程，协程闭包可能又引用 Task，如果循环强引用 Task，这条循环链会让某些对象无法被正常回收。作为折中，asyncio 用 `weakref` 跟踪 task，用于 `all_tasks()` 这类查询，但**不承担保活责任**。

后果就是：如果你在用户代码里也不持有强引用，task 的引用计数可能降为 0，CPython 立即回收它。这时 task 还没完成，协程中途被销毁，既不触发 done_callback，也不抛异常，只是默默消失。CPython 的 GC 时机不可预测，这类 bug 表现为"偶尔任务没跑完"，极难复现。

这也是为什么 asyncio 提供 `loop.create_task` 但所有教程都强调"save the reference"。前文 `set + discard` 模式就是工程上最常见的解法：用集合持有强引用，任务完成后通过回调从集合移除，既保活又不泄漏。

### 4.5 与直接 await coroutine 的根本差异

把两种方式的执行流并排对比，差异一目了然：

**`await coro()`**

- 当前协程用 `coro.send(None)` 直接驱动 coro。
- coro 内部 await 的 future，就是当前协程 await 的 future——两者绑在同一条挂起链上。
- 整条链做完，当前协程才恢复，才能继续下一条 `await coro2()`。
- 不会有"另一个 task"在循环里排队，所以是串行。

**`asyncio.create_task(coro)`**

- Task 构造时 `call_soon(__step)` 把自己排进就绪队列。
- Task 第一次被 `__step` 驱动时，它的挂起/恢复与主协程**完全独立**——Task await 的是它自己的 future，主协程 await 的是 gather/自己的 future。
- 多个 Task 各有独立的 `__step` 链，循环公平调度，于是并发。

换句话说，要让协程真正并发，必须让每个协程有"独立的被驱动入口"，而 Task 正是这个入口。`await coro` 把 coro 并入当前协程的驱动链，无法并发；`create_task` 把 coro 变成独立 Task，才有并发的可能。

### 4.6 取消的内部机制

`task.cancel()` 的实现大致是：

1. 如果 task 已 done，返回 False（无法取消已完成的任务）。
2. 把 `self._must_cancel = True`，或直接向 task 当前 await 的 future 调 `future.cancel()`。
3. 返回 True。

真正"取消"发生在 task 下次被 `__step` 驱动时：`__step` 检查 `self._must_cancel`，若为 True，则 `coro.throw(CancelledError)` 而非 `coro.send(None)`。协程在 `await` 处收到 `CancelledError`，可清理后重新抛出。如果协程吞掉异常继续 return，task 进入 done 态而非 cancelled 态；如果异常传播出协程，task 进入 cancelled 态。

这也解释了"为什么 cancel 后还要 await t"：`cancel()` 只是排定了"下次抛 CancelledError"，真正抛入和传播需要循环再跑一次 `__step`，所以调用方要 `await t`（捕获 `CancelledError`）让这个传播发生，task 状态才会落到 cancelled。

## 5. 总结

**本文内容要点**

- `asyncio.create_task(coro)` 把协程包装为 Task 并立即注册进当前事件循环的就绪队列，协程随之开始后台调度执行；返回的 Task 对象是 awaitable。
- `await task` 等任务完成并取结果；已完成则立即返回，被取消则抛 `CancelledError`，协程内部异常会在 await 时重新抛出。
- 直接连续 `await coro()` 是串行执行（耗时累加）；用 `create_task` 把协程先变 Task 再 `gather`，才是真正并发（总耗时 ≈ 最慢任务）。
- Task 与 coroutine 的区别：coroutine 不被驱动不执行、无状态无回调；Task 一创建即进循环就绪、有 pending/done/cancelled 状态、可取消可加回调。
- 必须保存 Task 的强引用：asyncio 内部只用弱引用跟踪 Task，无强引用的任务可能被 GC 回收而中途消失。
- 任务状态查询：`done()`、`cancelled()`；`result()` 取结果（不阻塞、未完成抛 `InvalidStateError`、被取消抛 `CancelledError`）；`exception()` 取异常对象。
- `add_done_callback` 注册完成回调，回调在循环线程同步执行，不能 `await`，重活应再起 task。
- `create_task` 必须在运行的事件循环内调用（即写在协程体内）；跨线程用 `run_coroutine_threadsafe`。
- 早期 `ensure_future` 仍可用但新代码应优先 `create_task`；典型并发模式为 `tasks=[create_task(f(u)) for u in ...]; await gather(*tasks)`。
- 原理：Task 构造时 `call_soon(__step)` 排进就绪队列；`__step` 用 `coro.send` 驱动协程到 await 让出，await 的 future 完成时 `__wakeup` 再次 `__step`；协程 return 抛 `StopIteration(value)`，Task `set_result` 完成；多个 Task 各有独立 `__step` 链被循环公平调度，这就是并发；弱引用表导致无强引用时 task 可能被回收。

**读完本文你应能掌握**

- 能说明 `asyncio.create_task` 的作用、签名与 `name`/`context` 参数，并正确调用。
- 能区分"串行 await 协程"与"create_task + gather 并发"在耗时上的差别，并写出让多个协程真正并发的代码。
- 能解释 Task 与 coroutine 在调度、状态、回调、GC 上的差异，避免"协程没跑起来"的误区。
- 能说出"必须保存 task 强引用"的原因，并用列表/`set + discard` 模式保活后台任务。
- 能用 `done()`/`cancelled()`/`result()`/`exception()` 正确查询任务状态与结果，处理未完成、异常、取消三种情况。
- 能用 `add_done_callback` 写完成回调，并在回调里正确处理异常、避免阻塞循环。
- 能用 `Semaphore` 限制并发、用 `gather(return_exceptions=True)` 处理批量失败，写出健壮的并发编排。
- 能从原理上说明 Task 的 `__step`/`__wakeup` 驱动机制、与直接 `await coro` 串行的根本差异、以及弱引用导致 GC 陷阱的成因。