---
group:
  title: 【18】异步协程
  order: 18
order: 8
title: 任务取消与超时控制
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是任务取消与超时控制

在 asyncio 协程模型里，并发单位是 **Task**（任务）。一个 Task 包裹着一个协程，由事件循环调度推进。在实际服务中，我们经常需要"中途喊停"一个正在跑的 Task——比如用户关闭连接、上游调用方主动放弃结果、或者某个任务跑得太久需要兜底。这就引出两大需求：

- **任务取消（cancellation）**：从外部中止一个尚未完成的 Task，让它提前结束。
- **超时控制（timeout）**：给一个协程设定最长执行时间，超时自动结束。

asyncio 的取消机制是 **协作式（cooperative）** 的，而不是"强杀线程"那种抢占式。当你调用 `task.cancel()` 时，并不是立刻把协程从内存里抹掉，而是给这个 Task 打一个"待取消"标记，等到协程执行到下一个 `await` 挂起点时，事件循环才把一个特殊的异常 `CancelledError` 注入进去，从而中断协程的执行流。

理解这个"协作"本质，是避免踩坑的前提：一段从不 `await` 的 CPU 密集协程，无论你调多少次 `cancel()`，它都不会被中断——因为根本没有挂起点可供注入。

`CancelledError` 在 Python 3.8+ 被调整为 `BaseException` 的直接子类（而不是 `Exception` 的子类）。这是为了防止被宽泛的 `except Exception:` 误吞，导致取消请求被悄悄吞掉、任务继续运行。下面的笔记会反复回到这条规则上。

### 1.2 基础语法与最小用法

最简的取消场景：起一个长任务，主动 `cancel()` 它。

```python
import asyncio

async def long_work():
    print("开始干活")
    await asyncio.sleep(10)  # 模拟一个耗时的异步操作
    print("干完了")  # 被取消时这行不会执行

async def main():
    task = asyncio.create_task(long_work())
    await asyncio.sleep(0.1)   # 让任务先启动
    task.cancel()               # 请求取消
    try:
        await task              # 等待任务结束，会抛 CancelledError
    except asyncio.CancelledError:
        print("任务已被取消")

asyncio.run(main())
# 输出：
# 开始干活
# 任务已被取消
```

几个要点先记在心里：

- `task.cancel()` 只是"请求"取消，不保证立即完成。
- `await task` 在任务被取消时会抛 `CancelledError`，需用 `except asyncio.CancelledError` 捕获。
- `CancelledError` 来自 `asyncio` 命名空间，也可从 `asyncio.exceptions` 获取；它本质是 `concurrent.futures.CancelledError` 的别称（3.8+ 统一）。

超时控制的最小写法，用 `asyncio.wait_for`：

```python
import asyncio

async def slow():
    await asyncio.sleep(5)
    return "ok"

async def main():
    try:
        result = await asyncio.wait_for(slow(), timeout=1.0)
    except asyncio.TimeoutError:
        print("超时了")
    else:
        print("结果：", result)

asyncio.run(main())
# 输出：
# 超时了
```

`wait_for` 超时后会自动取消内部协程，并抛出 `TimeoutError`（3.11+ 即 `asyncio.TimeoutError`，它是内置 `TimeoutError` 的别名）。这是后续会展开的重点 API 之一。

## 2. 核心内容

### 2.1 Task.cancel()：请求取消一个任务

**作用**：向事件循环声明"这个 Task 应该被取消"。事件循环会在该 Task 下次被推进（`Task.__step`）时，把 `CancelledError` 抛进协程挂起的地方。

**签名**：

```python
Task.cancel(msg=None) -> bool
```

- `msg`（3.9+）：可选的取消消息，会作为 `CancelledError` 的参数。主要用于调试/日志，不应依赖其做控制流。
- 返回值：`True` 表示取消请求已成功排队；`False` 表示任务已经结束（完成或已取消过），无法再排队取消请求。

**关键行为**：

1. `cancel()` 不会立刻中断协程，只标记"请求待处理"。
2. 如果任务正在 `await` 某个 future，那个 future 也会被取消（取消会传播）。
3. 如果任务已经 `done()`，`cancel()` 返回 `False`，不会再改变其状态。
4. 对一个已经请求过取消但尚未真正抛 `CancelledError` 的任务再次 `cancel()`，会再次标记（幂等），不会出错。
5. 取消请求在协程恢复执行时生效——也就是说，在 `await` 点注入 `CancelledError`。

**何时用**：

- 用户主动放弃：浏览器关掉页面后，后端取消还在跑的请求。
- 父任务失败：父协程抛异常，需要顺带取消它派生的子任务。
- 批量兜底：超时后清理一批还在跑的并发任务。

**demo：cancel() 的返回值与已结束任务**

```python
import asyncio

async def quick():
    return 42

async def main():
    task = asyncio.create_task(quick())
    await task               # 任务先跑完
    ok = task.cancel()       # 试图取消一个已完成任务
    print("cancel 返回：", ok)
    print("任务状态 done：", task.done())
    print("任务结果：", task.result())

asyncio.run(main())
# 输出：
# cancel 返回： False
# 任务状态 done： True
# 任务结果： 42
```

**demo：长 sleep 任务被取消**

```python
import asyncio

async def download(url):
    print(f"[{url}] 开始下载")
    try:
        await asyncio.sleep(30)   # 模拟慢速 IO
        return f"{url} 的内容"
    except asyncio.CancelledError:
        print(f"[{url}] 被取消，停止下载")
        raise                      # 通常应再次抛出

async def main():
    task = asyncio.create_task(download("https://example.com/big"))
    await asyncio.sleep(0.2)
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        print("main 捕获到取消")

asyncio.run(main())
# 输出：
# [https://example.com/big] 开始下载
# [https://example.com/big] 被取消，停止下载
# main 捕获到取消
```

注意 `download` 内部 `try/except CancelledError` 做了清理日志，然后 `raise` 再次抛出。这是推荐写法——捕获是为了清理资源，清理完仍要让取消信号传出去。绝对不要在 `except CancelledError` 里 `return` 一个普通值把取消"吃掉"。

### 2.2 CancelledError 的继承链与捕获陷阱

`CancelledError` 是 asyncio 取消机制的载体。在 3.8 之前它是 `concurrent.futures.CancelledError` 且继承自 `Exception`，3.8 起改为继承 `BaseException`（与 `KeyboardInterrupt`、`SystemExit` 同级）。

**为什么改继承**：`asyncio` 的取消需要穿透用户写的 `except Exception`。早期因为继承 `Exception`，一段这样的代码会把取消彻底吞掉：

```python
# 反例：3.8 之前的坑
try:
    await something()
except Exception:   # 把 CancelledError 也吞了
    pass
```

任务被取消的信号被吞后，调用方再用 `await task` 永远等不到 `CancelledError`，可能导致整条取消链断裂，任务"假死"。3.8+ 改成 `BaseException` 子类后，`except Exception` 不再捕获它，取消信号得以正常传播。

**捕获规则速查**：

| 你想做什么 | 推荐写法 |
|---|---|
| 做清理后继续取消 | `try: ... except CancelledError: <cleanup>; raise` |
| 做清理且必须保证执行 | `try: ... finally: <cleanup>` |
| 捕获普通业务异常 | `except ValueError` / `except Exception`（天然不吞 CancelledError） |
| 同时捕业务异常并区分取消 | `except CancelledError: ...; except ValueError: ...`（先取消后业务） |

**demo：except Exception 吃不掉 CancelledError（3.8+）**

```python
import asyncio

async def risky():
    await asyncio.sleep(0.5)
    return "done"

async def swallower():
    try:
        await risky()
    except Exception:
        # 想拦住一切错误，但拦不住 CancelledError
        print("swallower: 捕到 Exception")
        return "swallowed"

async def main():
    t = asyncio.create_task(swallower())
    await asyncio.sleep(0.1)
    t.cancel()
    try:
        res = await t
        print("main 拿到结果：", res)
    except asyncio.CancelledError:
        print("main 拿到取消")

asyncio.run(main())
# 输出：
# main 拿到取消
```

如果 `CancelledError` 还是 `Exception` 的子类（3.7 及以前），上面会打印 `swallower: 捕到 Exception` 并返回 `swallowed`，取消就被吃掉了。3.8+ 后那个 `except Exception` 形同虚设，取消正常传播到 `main`。

**demo：对比 except 与 except BaseException**

```python
import asyncio

async def task_a():
    try:
        await asyncio.sleep(5)
    except asyncio.CancelledError:
        print("task_a: except CancelledError 捕到，做清理")
        raise
    # 注意：若写 except BaseException 则会吞掉 CancelledError

async def task_b():
    try:
        await asyncio.sleep(5)
    except BaseException as e:   # 能捕到 CancelledError，演示用，别在生产里这么写
        print(f"task_b: except BaseException 捕到 {type(e).__name__}")
        # 不 raise —— 取消被吞
        return "b 假装完成"

async def main():
    ta = asyncio.create_task(task_a())
    tb = asyncio.create_task(task_b())
    await asyncio.sleep(0.1)
    ta.cancel(); tb.cancel()
    for name, t in [("a", ta), ("b", tb)]:
        try:
            print(name, "->", await t)
        except asyncio.CancelledError:
            print(name, "-> 被取消")

asyncio.run(main())
# 输出：
# task_a: except CancelledError 捕到，做清理
# task_b: except BaseException 捕到 CancelledError
# a -> 被取消
# b -> 假装完成
```

`task_b` 用 `except BaseException` 吞掉了取消并返回了一个普通值——这是反例，仅用于演示。生产代码绝不这么写：要么 `raise`，要么不要捕获。

### 2.3 协作式取消与 await 点

取消是协作式的，这意味着取消请求只能在协程 **挂起（await 一个未就绪的 future）** 时被注入。一个从不 `await`、纯做 CPU 运算的协程，事件循环根本没有机会推进它，更没有机会注入异常。

**demo：无 await 的 CPU 密集协程无法被及时取消**

```python
import asyncio
import time

async def cpu_hog():
    print("hog: 开始死循环")
    end = time.time() + 3
    while time.time() < end:
        pass           # 纯 CPU，无 await
    print("hog: 跑完了 3 秒")
    return "hog done"

async def main():
    t = asyncio.create_task(cpu_hog())
    await asyncio.sleep(0.1)
    t.cancel()          # 请求取消
    print("main: 已 cancel，等待任务结束")
    start = time.time()
    try:
        await t
    except asyncio.CancelledError:
        print("main: 取消生效，耗时", round(time.time() - start, 1), "s")

asyncio.run(main())
# 输出：
# hog: 开始死循环
# main: 已 cancel，等待任务结束
# hog: 跑完了 3 秒
# main: 取消生效，耗时 2.9 s
```

可以看到 `cancel()` 立刻返回了，但任务并没被中断，仍把 3 秒 CPU 跑完。因为协程从未 `await`，事件循环在它跑完前没有任何机会注入 `CancelledError`。取消请求直到协程自然结束后才"兑现"——但此时任务已 `done`，`await t` 直接拿到的是已取消状态。

**正确做法**：长 CPU 段里周期性 `await asyncio.sleep(0)` 提供挂起点，让循环有机会调度别的任务、也机会注入取消。

```python
import asyncio
import time

async def cpu_hog_cooperative():
    print("hog: 开始干活")
    end = time.time() + 3
    while time.time() < end:
        # 一小段 CPU 后主动让出
        await asyncio.sleep(0)
    print("hog: 跑完了")
    return "hog done"

async def main():
    t = asyncio.create_task(cpu_hog_cooperative())
    await asyncio.sleep(0.1)
    t.cancel()
    try:
        await t
    except asyncio.CancelledError:
        print("main: 成功取消")

asyncio.run(main())
# 输出：
# hog: 开始干活
# main: 成功取消
```

加了 `await asyncio.sleep(0)` 之后，取消得以在 0.1 秒后立即生效——因为现在有了挂起点。

**协作式取消的含义再强调**：

- 取消不是强制中断，是"请求对方在下一个合适时机停下来"。
- 协程作者有责任在长任务里安排 `await` 点。
- 对接外部不可中断资源（如同步阻塞 socket、第三方 C 库）时要意识到：取消请求到达被 await 的 future，但 future 背后的同步操作能否真正中止取决于底层实现。

### 2.4 try/except/finally 中的清理

被取消的协程通常应做资源清理：关连接、回滚事务、释放锁。清理代码有两种写法：

**写法 A：except CancelledError 做清理后 raise**

```python
async def with_connection(self):
    conn = await acquire()
    try:
        await do_work(conn)
    except asyncio.CancelledError:
        await conn.close()
        raise
    except Exception:
        await conn.close()
        raise
```

但这里有重复的 `conn.close()`。

**写法 B：finally 做清理（推荐）**

```python
async def with_connection(self):
    conn = await acquire()
    try:
        await do_work(conn)
    finally:
        await conn.close()
```

`finally` 无论是正常返回、业务异常还是 `CancelledError` 都会执行，干净统一。但 `finally` 里若再 `await`，有微妙陷阱，见 2.6 节。

**demo：finally 保证清理**

```python
import asyncio

async def worker(tag):
    print(f"[{tag}] 工作中")
    try:
        await asyncio.sleep(5)
        print(f"[{tag}] 完成")
    finally:
        print(f"[{tag}] finally 清理")
        # 假设这里有同步的关闭操作

async def main():
    t = asyncio.create_task(worker("A"))
    await asyncio.sleep(0.1)
    t.cancel()
    try:
        await t
    except asyncio.CancelledError:
        print("main: 已取消")

asyncio.run(main())
# 输出：
# [A] 工作中
# [A] finally 清理
# main: 已取消
```

`finally` 在取消时仍然执行——这是它优于单独 `except CancelledError` 的地方。

### 2.5 asyncio.wait_for：超时自动取消

**作用**：等待一个协程或 future 完成，若超过 `timeout` 秒未完成，自动取消它并抛 `TimeoutError`。

**签名**：

```python
asyncio.wait_for(aw, timeout) -> Any
```

- `aw`：awaitable（协程、Task、Future）。
- `timeout`：秒数（float）。`None` 表示不限时，等价于直接 `await`。
- 返回值：`aw` 的结果。
- 超时抛：`asyncio.TimeoutError`（3.11+ 与内置 `TimeoutError` 同一类型）。

**行为细节**：

1. 超时触发时，`wait_for` 先取消内部 awaitable（调 `inner.cancel()`）。
2. 然后等待内部真正终止（无论是 `CancelledError` 还是它屏蔽取消后自然结束）。
3. 内部终止后，`wait_for` 才抛 `TimeoutError`。
4. 内部协程若屏蔽了取消（吞 `CancelledError` 并返回），`wait_for` 会等它真的跑完，再抛 `TimeoutError`——这意味着实际耗时可能超过 `timeout`。

**demo：wait_for 超时抓 TimeoutError**

```python
import asyncio

async def slow_call():
    print("slow_call: 开始")
    await asyncio.sleep(10)
    return "ok"

async def main():
    try:
        await asyncio.wait_for(slow_call(), timeout=1.0)
    except asyncio.TimeoutError:
        print("main: 超时")
    except asyncio.CancelledError:
        print("main: 被取消")

asyncio.run(main())
# 输出：
# slow_call: 开始
# main: 超时
```

**demo：内部屏蔽取消导致 wait_for 实际等更久**

```python
import asyncio
import time

async def stubborn():
    print("stubborn: 开始")
    try:
        await asyncio.sleep(10)
    except asyncio.CancelledError:
        print("stubborn: 收到取消，但我硬要跑完")
        # 不 raise，继续往下做一段工作
        await asyncio.sleep(2)
        return "stubborn done"

async def main():
    start = time.time()
    try:
        await asyncio.wait_for(stubborn(), timeout=1.0)
    except asyncio.TimeoutError:
        elapsed = round(time.time() - start, 1)
        print(f"main: 超时，实际耗时 {elapsed}s")

asyncio.run(main())
# 输出：
# stubborn: 开始
# stubborn: 收到取消，但我硬要跑完
# main: 超时，实际耗时 3.0s
```

超时设的是 1 秒，但因为 `stubborn` 吞掉了取消又跑了 2 秒，`wait_for` 等它真的结束后才抛 `TimeoutError`，最终耗时 3 秒。这是"协作式"的另一面：调用方无法强杀，超时只是"最早的可能中断点"，不是"硬截止"。

**3.12 行为变化简提**：在 3.12 中，如果被取消的内部 Task 屏蔽取消（即不抛 `CancelledError` 而继续跑），`wait_for` 仍会抛 `TimeoutError`，但语义上更明确——它等待内部任务结束以保证资源清理。3.11 及之前的行为类似，但具体的等待时序细节在 3.12 做了整理。实践结论不变：**不要在协程里吞 `CancelledError`**，否则会破坏所有依赖超时的调用方。

**wait_for 取消自身**

如果在 `wait_for` 等待期间，外层任务自己也被取消，`wait_for` 会把取消传播给内部 awaitable 再抛 `CancelledError`。即取消可级联：外层 task.cancel → wait_for 内部 task.cancel → 内部协程收到 CancelledError。

### 2.6 asyncio.wait：返回 (done, pending) 手动收尾

**作用**：并发等待多个 awaitable，等"满足条件"就返回，把控制权交还调用方自行决定未完成任务的命运。

**签名**：

```python
asyncio.wait(aws, *, timeout=None, return_when=ALL_COMPLETED)
-> (done: set, pending: set)
```

- `aws`：可迭代的 awaitable（协程、Task、Future）。3.8+ 不再直接传协程，应先 `create_task`。
- `timeout`：最多等这么久；到点返回，`pending` 里是还没完成的。
- `return_when`：`FIRST_COMPLETED` / `FIRST_EXCEPTION` / `ALL_COMPLETED`（默认）。

`wait` 与 `wait_for` 的关键差异：**`wait` 不会自动 cancel pending 的任务**——它只是告诉你"时间到了/条件够了，这批完成了，那批还在跑"。未完成的你自己决定。

**demo：wait 超时后手动 cancel**

```python
import asyncio

async def work(i):
    await asyncio.sleep(i)
    return i

async def main():
    tasks = [asyncio.create_task(work(i)) for i in (1, 2, 3, 4)]
    done, pending = await asyncio.wait(tasks, timeout=2.0)
    print(f"完成 {len(done)} 个，未完成 {len(pending)} 个")
    for t in pending:
        t.cancel()
    # 等待被取消的任务真正结束，避免"Task was destroyed but it is pending"告警
    await asyncio.gather(*pending, return_exceptions=True)

asyncio.run(main())
# 输出：
# 完成 2 个，未完成 2 个
```

`work(1)`、`work(2)` 在 2 秒内完成，其余两个被手动 cancel 并 gather 收尾。注意 `gather(..., return_exceptions=True)` 收尾是良好习惯——它让被取消任务的 `CancelledError` 被"消费"掉，不会污染日志。

### 2.7 asyncio.timeout：上下文管理器方式（3.11+）

**作用**：用一个上下文管理器划定"取消作用域"，进入 `async with` 块后，若超时则取消块内正在 `await` 的协程，块内 `TimeoutError` 抛出。

**签名**：

```python
asyncio.timeout(delay) -> _TimeoutContextManager
# 用法：
async with asyncio.timeout(2.5):
    await something()
```

- `delay`：秒。`None` 表示不限时（可用于条件性地关闭超时）。
- 超时后在块内抛 `TimeoutError`（同 `wait_for` 的）。
- `asyncio.timeout_at(when)` 用绝对单调时间点替代相对延迟，底层同一机制。

**它比 `wait_for`好在哪**：

- 作用域内可以有多个 `await`，超时统一作用于整段。
- 不需要把整段逻辑塞进一个协程再传给 `wait_for`，结构更自然。
- 可嵌套：内层 `timeout` 先触发时只取消内层。

**demo：asyncio.timeout 超时**

```python
import asyncio

async def stage(tag, t):
    print(f"[{tag}] 等待 {t}s")
    await asyncio.sleep(t)
    print(f"[{tag}] 完成")

async def main():
    try:
        async with asyncio.timeout(1.0):
            await stage("A", 0.5)
            await stage("B", 0.5)
            await stage("C", 0.5)   # 累计 1.5s，超时
    except TimeoutError:
        print("main: 整段超时")

asyncio.run(main())
# 输出：
# [A] 等待 0.5s
# [A] 完成
# [B] 等待 0.5s
# [B] 完成
# [C] 等待 0.5s
# main: 整段超时
```

A、B 顺利，C 开始等 0.5s 但还没到点就因总时间到 1s 被取消，整段抛 `TimeoutError`。

**demo：timeout 仍可被外部取消**

```python
import asyncio

async def main():
    try:
        async with asyncio.timeout(10):
            await asyncio.sleep(5)
    except TimeoutError:
        print("内部超时")
    except asyncio.CancelledError:
        print("外部取消")

async def runner():
    t = asyncio.create_task(main())
    await asyncio.sleep(0.2)
    t.cancel()
    await t

asyncio.run(runner())
# 输出：
# 外部取消
```

`timeout` 是"最迟到点取消"的上限，不阻止外部对当前任务的取消——两者都通过 CancelledError 机制实现。

### 2.8 取消的级联：父 Task 取消会传播到子

当一个 Task A `await` 另一个 Task B（或通过 `gather` 包含 B），取消 A 时会把 A 当前 await 的 B 也取消。这是取消的"级联传播"。

**demo：父取消传播到内层 await 的子任务**

```python
import asyncio

async def child(name, t):
    print(f"[{name}] 启动")
    try:
        await asyncio.sleep(t)
        print(f"[{name}] 完成")
    except asyncio.CancelledError:
        print(f"[{name}] 被取消")
        raise

async def parent():
    print("[parent] 启动")
    await child("c1", 1)
    await child("c2", 1)
    print("[parent] 完成")

async def main():
    t = asyncio.create_task(parent())
    await asyncio.sleep(0.2)
    t.cancel()
    try:
        await t
    except asyncio.CancelledError:
        print("main: parent 被取消")

asyncio.run(main())
# 输出：
# [parent] 启动
# [c1] 启动
# [c1] 被取消
# main: parent 被取消
```

`parent` 此刻在 `await child("c1", 1)`，取消 `parent` 会取消它正在 await 的那个 future/child 任务，于是 `c1` 也收到 `CancelledError`。`c2` 因为还没开始 await，自然不会跑。

**gather 中的级联**

`asyncio.gather(*tasks)` 会把每个传入的协程包成 Task。默认情况下，当 `gather` 自身被外部取消，会取消它包含的所有子任务；任一子任务抛异常时，其他子任务也会被取消（默认 `return_exceptions=False`）。

**demo：gather 整体被外层取消**

```python
import asyncio

async def work(i):
    try:
        await asyncio.sleep(i * 2)
        return i
    except asyncio.CancelledError:
        print(f"work({i}) 被取消")
        raise

async def main():
    g = asyncio.gather(work(1), work(2), work(3))
    g_task = asyncio.create_task(_await_gather(g))
    await asyncio.sleep(0.5)
    g_task.cancel()
    try:
        await g_task
    except asyncio.CancelledError:
        print("main: gather 任务的宿主被取消")

async def _await_gather(g):
    return await g

asyncio.run(main())
# 输出：
# work(1) 被取消
# work(2) 被取消
# work(3) 被取消
# main: gather 任务的宿主被取消
```

外层对宿主 task 的取消传播给了 gather，gather 又把所有子任务取消掉。

### 2.9 finally 中 await 的陷阱与 asyncio.shield

**陷阱**：当一个协程正在执行 `finally` 块，说明它已经收到一次 `CancelledError`。如果在 `finally` 里又 `await` 一个 awaitable，事件循环在挂起点会 **再次注入** `CancelledError`，除非你显式保护这个 awaitable。

典型场景：取消时要在 `finally` 里通知服务器"我退出了"，这个网络请求本身需要 await。

**demo：finally 中的 await 被再次注入取消**

```python
import asyncio

async def notify():
    print("notify: 发起通知")
    await asyncio.sleep(0.3)
    print("notify: 完成")

async def worker():
    try:
        await asyncio.sleep(5)
    finally:
        print("worker: finally 开始")
        await notify()   # 危险：会被再次取消
        print("worker: finally 结束")

async def main():
    t = asyncio.create_task(worker())
    await asyncio.sleep(0.1)
    t.cancel()
    try:
        await t
    except asyncio.CancelledError:
        print("main: worker 被取消")

asyncio.run(main())
# 输出：
# worker: finally 开始
# notify: 发起通知
# main: worker 被取消
```

可以看到 `notify()` 进入 `await asyncio.sleep(0.3)` 后立刻被再次取消，`notify: 完成` 和 `worker: finally 结束` 都没执行。

**asyncio.shield(aw)**：保护 `aw` 不被外层取消传播——即使当前任务被取消，`aw` 内部不会收到 `CancelledError`，外层的取消会被"挡住"直到 `aw` 完成（或外层先抛 `CancelledError`）。注意 `shield` 不取消 `aw`，它只是不让取消传到 `aw` 身上。

**demo：用 shield 保护 finally 中的通知**

```python
import asyncio

async def notify():
    print("notify: 发起通知")
    await asyncio.sleep(0.3)
    print("notify: 完成")

async def worker():
    try:
        await asyncio.sleep(5)
    finally:
        print("worker: finally 开始")
        try:
            await asyncio.shield(notify())   # 被保护
        except asyncio.CancelledError:
            print("worker: 外层取消仍在等，但 notify 已被保护继续跑")
            raise
        print("worker: finally 结束")

async def main():
    t = asyncio.create_task(worker())
    await asyncio.sleep(0.1)
    t.cancel()
    try:
        await t
    except asyncio.CancelledError:
        print("main: worker 被取消")
    # 给被 shield 保护的任务一点时间收尾
    await asyncio.sleep(0.5)

asyncio.run(main())
# 输出：
# worker: finally 开始
# notify: 发起通知
# notify: 完成
# worker: finally 结束
# main: worker 被取消
```

`shield` 让 `notify()` 完整执行完。实践上更工程化的做法是把清理工作另起一个独立 Task 并 `await shield`，或使用 `asyncio.TaskGroup`（3.11+）+ `CancelledError` 捕获 + 显式等待，避免依赖 `shield` 的微妙时序。但 `shield` 解决"cancel 期间的 await"这个具体问题仍然是最直接的方式。

### 2.10 批量取消未完成任务

服务端并发跑一批请求，到点后"谁还没回就 cancel 谁"是常见清理动作。两种写法：

**写法一：配合 asyncio.wait + 手动 cancel（前面已演示）**

```python
done, pending = await asyncio.wait(tasks, timeout=5)
for t in pending:
    t.cancel()
await asyncio.gather(*pending, return_exceptions=True)
```

**写法二：TaskGroup + timeout（3.11+，推荐）`

`asyncio.TaskGroup` 在 `async with` 块退出时会自动等所有子任务结束；若块内抛异常或被取消，会取消全部子任务。配合 `asyncio.timeout` 可优雅实现"全或弃"。

```python
import asyncio

async def fetch(i):
    await asyncio.sleep(i * 2)
    return f"data{i}"

async def main():
    try:
        async with asyncio.timeout(3.0):
            async with asyncio.TaskGroup() as tg:
                tasks = [tg.create_task(fetch(i)) for i in range(1, 5)]
        # 正常走到这里说明全部在 3s 内完成
        print([t.result() for t in tasks])
    except* TimeoutError:
        print("整体超时，子任务已被 TaskGroup 自动取消")
    except* asyncio.CancelledError:
        print("外部取消")

asyncio.run(main())
# 输出：
# 整体超时，子任务已被 TaskGroup 自动取消
```

`fetch(1)`(2s) 与 `fetch(2)`(4s) 等，3s 超时触发后 `timeout` 抛 `TimeoutError`，`TaskGroup` 在异常退出时取消所有未完成子任务，并用 `except*`（3.11+ 的异常组语法）分别捕获。

### 2.11 取消消息 msg（3.9+）

`task.cancel(msg="reason")` 可附带消息，3.11+ 也允许 `future.cancel(msg=None)`。消息会作为 `CancelledError(msg)` 的参数。用途主要是日志和调试，不建议用它来传递控制流——一旦某个中间层吞掉并重新 raise，消息容易丢失。

**demo：cancel 带消息**

```python
import asyncio

async def worker():
    try:
        await asyncio.sleep(5)
    except asyncio.CancelledError as e:
        print("worker 收到取消，msg =", e.args)
        raise

async def main():
    t = asyncio.create_task(worker())
    await asyncio.sleep(0.1)
    t.cancel("上游连接断开")
    try:
        await t
    except asyncio.CancelledError as e:
        print("main 收到取消，msg =", e.args)

asyncio.run(main())
# 输出：
# worker 收到取消，msg = ('上游连接断开',)
# main 收到取消，msg = ('上游连接断开',)
```

消息作为 `CancelledError` 的参数一路传到调用方，前提是协程没把它吃掉。

### 2.12 uncancel 与取消状态查询（3.11+）

`Task.uncancel()` 是 3.11 引入的方法，用来"撤销一次待处理的取消请求"。它主要用于实现取消作用域（`asyncio.timeout` 内部就用了它），普通业务代码很少直接调用。

与之配套的状态查询：

- `task.cancelling()`：返回待处理的取消请求计数（3.11+）。
- `task.cancelled()`：任务是否因取消而结束（仅在 `done()` 后有意义）。

**demo：uncancel 把正在取消的请求撤回**

```python
import asyncio

async def worker():
    try:
        await asyncio.sleep(5)
    except asyncio.CancelledError:
        print("worker: 收到取消")
        # 假设我们决定忽略这次取消（生产里慎用）
        count = asyncio.current_task().cancelling()
        print(f"  待处理取消计数 {count}")
        asyncio.current_task().uncancel()
        print(f"  uncancel 后计数 {asyncio.current_task().cancelling()}")
        return "worker 仍在"

async def main():
    t = asyncio.create_task(worker())
    await asyncio.sleep(0.1)
    t.cancel()
    print("最后结果：", await t)

asyncio.run(main())
# 输出：
# worker: 收到取消
#   待处理取消计数 1
#   uncancel 后计数 0
# 最后结果：worker 仍在
```

`uncancel` 把"待处理取消"清零，从而允许协程继续活下去并返回正常值。这种写法等于"主动拒绝取消"，应仅在实现自己的超时作用域等底层场景使用——业务协程里这样做会破坏调用方的取消语义。

> 注意：`uncancel` 只是清计数，不能复活已经因 `CancelledError` 终止的任务——它作用在"异常正在被处理、任务尚未 done"的阶段。

## 3. 最佳实践

**不要在 except CancelledError 里 return 普通值**

这是头号大坑。任何 `except asyncio.CancelledError:` 之后 `return`，都把取消请求悄无声息地吞掉，调用方再也等不到 `CancelledError`，只会拿到一个看似正常的结果。这会让所有依赖取消传播的上层（包括 `wait_for` 与 `timeout`）行为错乱。

```python
# 不推荐
try:
    await job()
except asyncio.CancelledError:
    return None      # 取消被吞，上层拿不到取消信号

# 推荐
try:
    await job()
except asyncio.CancelledError:
    cleanup()
    raise
```

**优先用 finally 做清理**

资源清理放 `finally`，而不是 `except CancelledError + except Exception` 重复写。`finally` 不论取消还是异常都执行，最不容易写错。但记住 `finally` 里 `await` 要用 `shield`，否则会被再次取消。

**捕获业务异常时不要用 except Exception 一把抓**

3.8+ 之后 `except Exception` 不再捕获 `CancelledError`，这是好事。但如果你写 `except BaseException`，仍会把取消吞掉。除非你确实要拦所有东西（几乎不需要），否则别用 `BaseException`。

**长 CPU 任务里安排 await 点**

协作式取消依赖 await。CPU 密集协程每隔一小段 `await asyncio.sleep(0)` 让出控制，既让事件循环响应取消，也避免阻塞其他任务。

**批量收尾用 return_exceptions=True**

`asyncio.gather(*tasks, return_exceptions=True)` 会在某些任务被取消时把 `CancelledError` 当作返回值收回来，避免未处理异常告警。取消后收尾的标准动作：cancel → gather(return_exceptions=True)。

**超时时优先估计清理耗时**

`wait_for` 设 2 秒超时，不代表实际 2 秒就一定抛 `TimeoutError`——若被取消的协程在 `finally` 里还 `await shield` 干了 1 秒清理，那 `wait_for` 会等到它真结束才抛 TimeoutError。在 SLA 敏感的场景要把清理时间也算进去。

**新版代码优先用 asyncio.timeout + TaskGroup**

3.11+ 推荐用 `async with asyncio.timeout(...)` 配合 `TaskGroup` 替代手写 cancel 循环，结构更清晰、子任务取消更可靠。老的 `wait_for` 与手动 `cancel` 仍有用，但新代码不必再从它们起步。

**取消后仍要 await 任务**

`task.cancel()` 之后必须 `await task`（用 `try/except CancelledError` 或 `gather(return_exceptions=True)`）。否则任务对象可能还在内存里跑清理，事件循环关闭时会出现 "Task was destroyed but it is pending!" 告警。

**判断是否取消要区分 cancelled() 与 cancelling()**

- `cancelled()`：任务是否已因 CancelledError 终止，仅在 `done()` 后查。
- `cancelling()`（3.11+）：当前挂起了多少次取消请求，可在任务存活期间查。

**不要用 msg 做控制流**

`cancel(msg=...)` 是给日志和调试用的。一条协程链里中间层若重抛，msg 容易丢或被改。要做带原因的取消，宁可自定义日志或上下文变量。

## 4. 原理

### 4.1 cancel() 的内部状态机

asyncio 的 `Task` 内部维护一个状态：`_must_cancel` 标志位与一个被挂起的 future（`_fut_waiter`）。

当你调 `task.cancel(msg)`：

1. 若 `task.done()`：直接返回 `False`，无法取消已结束的任务。
2. 否则：
   - 若 `_fut_waiter` 不为 `None`（任务正 await 一个 future）：调 `_fut_waiter.cancel(msg)`，让那个 future 先收到取消。被挂起的 future 取消后，事件循环下次推进 Task 时会抛 `CancelledError`。
   - 若 `_fut_waiter` 为 `None`（任务正在 CPU 跑、不在 await 点）：置 `_must_cancel = True` 并保存 msg。下次 `__step` 推进时，因 `_must_cancel` 为真，会直接往协程注入 `CancelledError`。

`_must_cancel` 这个标志就是"等下次推进时补一发取消"的记号。它解释了 2.3 节 CPU 密集协程为何总要等协程回到 await 点才能兑现取消——`_must_cancel` 一直挂着，直到协程让出 CPU、事件循环得到调度权。

### 4.2 __step 与 CancelledError 的注入

`Task.__step` 是事件循环驱动 Task 向前推进的核心方法（部分版本叫 `__step`/`__step_compat`）。简化流程：

1. 事件循环调度到该 Task，调用 `__step`。
2. `__step` 取出协程当前挂起时记录的 future 结果（或异常），通过 `coro.send(result)` 或 `coro.throw(type, value)` 恢复协程。
3. 若有 `_must_cancel`：改为 `coro.throw(CancelledError, ...)`——把取消异常从挂起点抛进协程。
4. 协程或正常 `return`（任务 done，设结果）、或再次 `await` 一个新 future（记录为 `_fut_waiter`，挂起等下次调度）、或抛异常（任务 done，设异常）。

`CancelledError` 就这样被"注入"到协程的 `await` 表达式处——在协程看来，那个 `await something()` 抛了 `CancelledError`，自然被外层 try 接住。

### 4.3 CancelledError 继承 BaseException 的设计

3.8 之前 `CancelledError` 继承 `Exception`，导致业务里常见的 `except Exception as e:` 会把取消一并捕获。这造成两类问题：

- 取消信号被吞，调用方的 `await task` 拿不到 `CancelledError`，以为任务正常结束（或挂起不返回）。
- `wait_for` 的超时取消被吞后，内部任务继续跑，`wait_for` 行为不可预期。

3.8+ 改继承 `BaseException`，与 `KeyboardInterrupt`、`SystemExit` 同级。这保证了：

- `except Exception` 自然不捕取消，业务代码的容错 block 默认是"取消透明"的。
- 想专门处理取消，必须显式 `except CancelledError`，意图更明确。
- `BaseException` 的兜底 `except BaseException` 仍能捕——这是开发者责任，不是默认行为。

设计上，"取消"被视为一种类似中断的全局控制信号，而非普通错误，所以归入 `BaseException` 层级。

### 4.4 wait_for 的取消传播时序

`asyncio.wait_for(fut, timeout)` 内部维护自己的 future 包装与定时器：

1. 进入 `wait_for`，把传入的 `aw` 包装成 future（必要时 `ensure_future`）。
2. 起 `loop.call_later(timeout, _on_timeout, waiter)` 定时器。
3. `await` 一个内部 waiter future。
4. 若 `aw` 先完成：取消定时器，把结果传给 waiter，`wait_for` 返回结果。
5. 若定时器先到：调 `fut.cancel()` 取消内部 awaitable。然后 `wait_for` 不会立刻抛 TimeoutError——它要等内部 future 真正进入 done 状态（不论是被 cancel 后抛 CancelledError，还是协程吞掉取消后自己 return）。
6. 内部 future done 后：取消定时器（已触发）、抛 `TimeoutError` 给调用方。

第 5 步解释了 2.5 节"被屏蔽取消导致耗时超出 timeout"的行为——`wait_for` 必须等内部终止才抛异常，因为它要保证"内部 awaitable 不再运行"这个不变量。如果它不等就抛，内部协程可能还在跑、还在未提交更改状态，调用方无法清理。

> 3.12 对这里时序做了整理：若内部任务屏蔽取消继续运行，`wait_for` 仍会等到它结束再抛 `TimeoutError`，但内部 task 的状态会被正确标记为完成而非取消，便于上层观测。3.11 及之前行为基本一致，只是标记细节有差异。

### 4.5 asyncio.timeout 的 cancellation scope

`asyncio.timeout`（3.11+）在机制上是 `Task.cancel + Task.uncancel` 的组合，外加一个定时器。它实现了一个"取消作用域（cancellation scope）"：

1. 进入 `async with asyncio.timeout(delay)`：记录当前 Task、起 `call_later(delay, _on_timeout)`。
2. 块内任意 `await` 都在该作用域保护下。
3. 定时器触发：调 `task.cancel()`，把 `CancelledError` 注入当前 await 点。同时记录"这次取消是我发起的"。
4. 块内 `CancelledError` 抛出：`__aexit__` 检测到这是本作用域发起的取消 + 已超时，把它转换为 `TimeoutError` 抛给块外。
5. 若不是本作用域发起的取消（外层调 cancel）：不转换，原样传播 `CancelledError`。
6. 退出作用域：`task.uncancel()` 把本作用域加的取消计数清掉，避免影响后续。

这里的关键是 `uncancel`：它让作用域"干净地"完成一次超时取消，不留计数残留。`asyncio.timeout_at` 用绝对时刻替代相对延迟，底层共用同一机制。

### 4.6 shield 的实现与限制

`asyncio.shield(aw)` 的实现思路：

- 把 `aw` 包成一个 future（如需）。
- 起 **另一个** Task 跑 `aw`（或直接复用 aw 如果已是 Task）。
- 返回一个外层 future，与内层 future 通过回调联动。

当外层 Task 被取消时，取消请求只会作用于"外层 future"，不会传到内层 Task——因为内层 Task 是一个独立的调度单位，与当前 Task 的 await 关系被 shield 的外层 future 隔断。内层继续跑，完成或抛异常后通过回调把结果传给外层 future。如果外层此时已被取消，外层就抛 `CancelledError`，内层照样跑完。

限制：

- `shield` 不是"创建不可取消的任务"，它只是把"外层的这次取消"挡在内层之外。内层被别人直接 `cancel` 仍会取消。
- `shield` 在 3.9 及之前返回的是一个自定义 future，3.10+ 简化为 `ensure_future` 包装，行为一致但实现更轻。
- 若内层无限挂起，shield 会让外层一直等不到——shield 不提供超时，需自己配 `wait_for` 或 `timeout`。

### 4.7 协作式取消与 GIL 的关系

协程取消是协作式的，与线程的"协作式取消"同源——都需要被取消方在某个点主动让出（协程 via `await`、线程 via 检查标志）。asyncio 的 `_must_cancel` 标志类比于线程的"取消请求标志"，但协程的"让出点"是 `await` 而非显式检查。

GIL 不直接影响协程取消——协程在同一线程内由事件循环切换，不存在竞态。但 CPU 密集协程在 `await sleep(0)` 让出时，事件循环只是短暂获得控制权注入取消，之后协程若不 `raise` 而继续 CPU，循环也无可奈何，只能等下一个 await 点。这与 2.3 节的现象对应。

## 5. 总结

**本文内容要点**：

- `task.cancel()` 是"请求取消"而非"强杀"：标记 `_must_cancel` 或取消其当前 `_fut_waiter`，等下一次 `__step` 推进时把 `CancelledError` 注入协程 await 点。
- `CancelledError` 在 3.8+ 继承 `BaseException`，`except Exception` 无法吞掉；要显式 `except CancelledError`，清理后仍应 `raise`。
- 取消是协作式的：无 await 点的纯 CPU 协程无法被及时取消；长 CPU 段需周期性 `await asyncio.sleep(0)` 让出。
- `asyncio.wait_for(coro, timeout)` 超时后 cancel 内部 awaitable 并等其真终止再抛 `TimeoutError`；内部若屏蔽取消，实际耗时会超过 timeout。
- `asyncio.wait(..., timeout)` 返回 `(done, pending)`，不自动 cancel，需手动收尾并 `gather(..., return_exceptions=True)`。
- `asyncio.timeout(delay)`（3.11+）是上下文管理器式的作用域超时，配合 `TaskGroup` 是新代码首选。
- 取消会级联：取消父 Task 会传播到它正在 await 的子任务；`gather` 被取消会取消其所有子任务。
- `finally` 里的 `await` 会被再次注入 `CancelledError`，需 `asyncio.shield` 保护关键清理。
- `uncancel`/`cancelling`（3.11+）调节待处理取消计数，主要服务于取消作用域机制；`cancel(msg)` 附带消息仅用于诊断。

**读完本文你应能掌握**：

- 正确调用 `task.cancel()` 并通过 `await task` 收尾，能解释 `cancel()` 返回值与"已 done 任务不可取消"的原因。
- 区分 `CancelledError` 在 3.7 与 3.8+ 的继承差异，写出既不吞取消又能清理资源的 `try/except/finally` 代码。
- 说明协作式取消依赖 await 点，能给一段 CPU 密集协程补充挂起点使其可被及时取消。
- 用 `wait_for` 给协程限时并处理 `TimeoutError`，能解释为何屏蔽取消的协程会导致实际耗时大于 timeout。
- 用 `asyncio.wait` 配合手动 `cancel` + `gather(return_exceptions=True)` 做批量未完成任务的清理。
- 用 `asyncio.timeout` + `TaskGroup`（3.11+）实现结构化并发超时，并说明 `uncancel` 在作用域机制中的角色。
- 用 `asyncio.shield` 保护"取消期间 finally 中的关键 await"，并知道它的限制（不能阻止内层被直接取消、不提供超时）。
- 判断一段取消相关代码的正确性，识别"吞取消"、"取消后不 await"、"except BaseException 滥捕"等典型陷阱。