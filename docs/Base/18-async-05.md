---
group:
  title: 【18】异步协程
  order: 18
order: 5
title: asyncio.sleep 模拟异步 IO
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 asyncio.sleep

`asyncio.sleep` 是 Python 标准库 `asyncio` 提供的一个协程函数，用于"暂停"当前协程指定的秒数。它与内置的 `time.sleep` 名字相似，但行为截然不同：`time.sleep` 会阻塞当前线程——整个事件循环都被卡住，其它协程也无法执行；而 `asyncio.sleep` 只会暂停当前这一个协程，同时把 CPU 让出来交给事件循环去运行其它就绪的协程。正因如此，`asyncio.sleep` 是学习和测试异步代码时最常用的"假 IO"——它模拟了一次网络请求或磁盘读写带来的延迟，而不需要真正去做 IO。

在异步编程里，"等待"几乎无处不在：等网络响应、等文件读完、等数据库返回。真实世界里这些等待往往几十毫秒到几秒不等，期间 CPU 其实是闲着的。`asyncio.sleep` 让我们用一行代码制造出同样的延迟，从而把"并发"这件事可视化——多个协程各自 sleep 1 秒，并发执行总耗时约 1 秒，而不是串行的 3 秒。`asyncio.sleep` 返回 `None`，它的价值不在于返回值，而在于它带来的"让出 CPU"这一行为本身。

### 1.2 基本语法与最小用法

`asyncio.sleep` 的签名如下：

```python
await asyncio.sleep(delay, result=None)
```

- `delay`：要暂停的秒数，可以是整数或浮点数（支持亚秒级精度，如 `0.5`）。设为 `0` 时有特殊语义——立即让出一次控制权而不实际等待。
- `result`：可选，作为该协程的返回值传回（默认 `None`）。绝大多数场景用不到这个参数。

它是一个协程函数，必须用 `await` 调用，且只能在 `async def` 协程内部使用。最小可运行示例：

```python
import asyncio

async def main():
    print("开始")
    await asyncio.sleep(1)   # 暂停 1 秒，期间事件循环可以跑别的协程
    print("结束")            # 1 秒后被唤醒，继续执行

asyncio.run(main())
# 输出：
# 开始
# （等待约 1 秒）
# 结束
```

这一段代码展示的就是 `asyncio.sleep` 最基本的用法：把一个协程"挂起"一段时间再恢复。接下来我们会看到，正是这种"挂起而不阻塞别人"的特性，让多个协程得以并发。

---

## 2. 核心内容

### 2.1 asyncio.sleep 的基本用法：模拟一次延迟

`asyncio.sleep` 最直接的用途就是模拟"某件事花了一点时间"。在真实项目里，这个"某件事"通常是网络请求或磁盘 IO；在学习和测试里，我们用 `asyncio.sleep` 代替它，这样既不用真的联网，又能复现"等待"带来的并发效果。

```python
import asyncio

async def fetch_data(name, delay):
    print(f"[{name}] 开始获取数据，预计 {delay} 秒")
    await asyncio.sleep(delay)          # 模拟网络延迟
    print(f"[{name}] 数据获取完成")
    return f"{name}的数据"

async def main():
    result = await fetch_data("服务A", 2)
    print(f"拿到: {result}")

asyncio.run(main())
# 输出：
# [服务A] 开始获取数据，预计 2 秒
# （等待约 2 秒）
# [服务A] 数据获取完成
# 拿到: 服务A的数据
```

这里 `fetch_data` 是一个典型的"模拟异步 IO"函数：它 `await asyncio.sleep(delay)` 来假装自己在等网络。如果将来换成真实的 HTTP 请求，函数结构完全不用改——只要把 `asyncio.sleep` 换成 `await aiohttp.request(...)` 即可。这就是 `asyncio.sleep` 作为"假 IO"的练习价值：它让你在还不掌握真实异步库时，就能把协程的写法、并发模型先练熟。

**delay 支持浮点数**

`delay` 不限于整数，可以传浮点数来模拟更细粒度的延迟，比如 0.2 秒、0.05 秒。这在写单元测试时很有用——你不想让测试真的等 1 秒，但又需要制造出"有多个协程在等"的局面。

```python
import asyncio

async def tiny_task(n):
    await asyncio.sleep(0.1)   # 100 毫秒级的延迟
    print(f"任务 {n} 完成")

async def main():
    await asyncio.gather(tiny_task(1), tiny_task(2), tiny_task(3))

asyncio.run(main())
# 输出：
# 任务 1 完成
# 任务 2 完成
# 任务 3 完成
```

注意：由于操作系统定时器精度限制，非常小的 sleep（如 `0.001`）实际延迟可能略大于设定值，不要用它做纳秒级计时。

### 2.2 asyncio.sleep 与 time.sleep 的本质区别

这是学习异步编程时必须彻底厘清的一点。两者的名字只差一个前缀，行为却天差地别。

**time.sleep：阻塞当前线程**

`time.sleep(n)` 会调用操作系统的 sleep 系统调用，让当前线程进入内核态"睡" n 秒。在这 n 秒里，这个线程什么都不会做——包括事件循环。如果这段代码跑在事件循环所在线程里（通常就是主线程），那么事件循环被卡死，所有其它协程都无法被调度，整个程序在那 n 秒内"冻住"。

**asyncio.sleep：只暂停当前协程**

`await asyncio.sleep(n)` 不会让线程进入内核 sleep。它做的事情是：向事件循环注册一个" n 秒后唤醒我"的定时器，然后当前协程主动让出 CPU（`yield`）。事件循环拿到控制权后，会去看有没有其它就绪的协程可以跑，把它们跑起来。等定时器到期，事件循环再回来恢复这个 sleep 的协程。线程自始至终没有被阻塞。

用一个对比实验把差别看得清清楚楚：

```python
import asyncio
import time

async def good_sleep():
    print("good: 用 asyncio.sleep，前")
    await asyncio.sleep(1)
    print("good: 用 asyncio.sleep，后")

async def bad_sleep():
    print("bad: 用 time.sleep，前")
    time.sleep(1)            # 阻塞整个事件循环！
    print("bad: 用 time.sleep，后")

async def main():
    start = time.perf_counter()
    # 两个协程并发启动
    await asyncio.gather(good_sleep(), bad_sleep())
    elapsed = time.perf_counter() - start
    print(f"总耗时: {elapsed:.2f} 秒")

asyncio.run(main())
# 输出：
# good: 用 asyncio.sleep，前
# bad: 用 time.sleep，前
# （这里 time.sleep 阻塞了 1 秒，good 的后半部分也被卡住）
# bad: 用 time.sleep，后
# good: 用 asyncio.sleep，后
# 总耗时: 1.00 秒
```

仔细看这个输出顺序：`good` 先打印"前"，然后让出 CPU；`bad` 接着打印"前"，然后调用 `time.sleep(1)`——这一下整个事件循环冻住了 1 秒，`good` 本来 1 秒后应该被唤醒，但它得等 `bad` 的 `time.sleep` 解除后事件循环才能恢复运转。最终两个协程都恰好在约 1 秒后完成，总耗时 1 秒。

现在把 `bad_sleep` 里的 `time.sleep` 也换成 `asyncio.sleep`：

```python
import asyncio
import time

async def task_a():
    print("A 前")
    await asyncio.sleep(1)
    print("A 后")

async def task_b():
    print("B 前")
    await asyncio.sleep(1)
    print("B 后")

async def main():
    start = time.perf_counter()
    await asyncio.gather(task_a(), task_b())
    elapsed = time.perf_counter() - start
    print(f"总耗时: {elapsed:.2f} 秒")

asyncio.run(main())
# 输出：
# A 前
# B 前
# （两个协程都让出，1 秒后被依次唤醒）
# A 后
# B 后
# 总耗时: 1.00 秒
```

两个各 sleep 1 秒的协程，并发总耗时只有 1 秒，而不是 2 秒。这就是异步并发的威力——前提是等待用的是 `asyncio.sleep` 这种非阻塞的方式。

**误用 time.sleep 的危害**

如果在协程里误用了 `time.sleep`，编译器不会报错（它是个普通同步函数），但后果是整个事件循环被阻塞。在生产代码里，这会导致：
- 服务器在处理某个请求时"卡顿"，其它请求全部排队无法响应。
- 心跳协程停跳，被对端判定为掉线。
- 定时任务整体延后。

这是异步编程最常见的"隐形 bug"之一，务必牢记：协程里所有的"等待"都必须用 `await` 形式（`asyncio.sleep`、`await client.get(...)` 等），绝不能用 `time.sleep` 这种同步阻塞调用。

**一表看懂两者区别**

| 对比维度 | `time.sleep(n)` | `asyncio.sleep(n)` |
| --- | --- | --- |
| 阻塞对象 | 阻塞当前线程（含事件循环） | 只挂起当前协程 |
| 调用方式 | 普通同步函数，直接 `time.sleep(n)` | 协程函数，须 `await asyncio.sleep(n)` |
| 期间线程状态 | 进入内核 sleep，用户态代码不执行 | 线程保持运行，跑事件循环调度其它协程 |
| 其它协程能否执行 | 不能（事件循环被卡） | 能（事件循环照常调度） |
| 并发效果 | 串行，N 个 sleep n 秒 = N*n 秒 | 并发，N 个 sleep n 秒 ≈ n 秒 |
| 实现机制 | 操作系统 sleep 系统调用 | Future + loop.call_later 定时器 |
| 能否被取消 | 不能（线程睡死在内核，无法中断） | 能（抛出 CancelledError，响应及时） |
| 适用场景 | 同步代码里需要"真等一会儿" | 异步协程里需要"非阻塞等待" |

这张表是本篇最值得记住的速查：凡是 `async def` 函数体里的等待，一律选 `asyncio.sleep`；凡是普通同步函数里的等待，才用 `time.sleep`。两者绝不能在 async 语境里混用。

### 2.3 并发演示：多个 sleep 协程同时跑

把 `asyncio.sleep` 和 `asyncio.gather` 组合起来，就能直观看到"并发"的效果。下面这个例子同时启动三个各 sleep 1 秒的协程，总耗时约为 1 秒，而不是 3 秒。

```python
import asyncio
import time

async def worker(name, delay):
    print(f"[{name}] 开始，将等待 {delay} 秒")
    await asyncio.sleep(delay)
    print(f"[{name}] 结束")
    return name

async def main():
    start = time.perf_counter()
    # 三个协程并发：分别等 1 秒
    results = await asyncio.gather(
        worker("甲", 1),
        worker("乙", 1),
        worker("丙", 1),
    )
    elapsed = time.perf_counter() - start
    print(f"全部完成: {results}")
    print(f"并发总耗时: {elapsed:.2f} 秒")

asyncio.run(main())
# 输出：
# [甲] 开始，将等待 1 秒
# [乙] 开始，将等待 1 秒
# [丙] 开始，将等待 1 秒
# （三个协程同时让出，约 1 秒后被依次唤醒）
# [甲] 结束
# [乙] 结束
# [丙] 结束
# 全部完成: ['甲', '乙', '丙']
# 并发总耗时: 1.00 秒
```

为什么是 1 秒而不是 3 秒？因为三个协程几乎同时在 `t=0` 各自注册了"1 秒后唤醒"的定时器然后让出。事件循环在 `t=0` 到 `t=1` 之间其实没事可做（没有其它就绪协程），就等着定时器到期。到 `t=1`，三个定时器同时到期，事件循环依次唤醒三个协程，它们各自打印"结束"并返回。总耗时等于最长那个任务（1 秒），而非三者之和。

作为对照，如果写成串行 `await`：

```python
import asyncio
import time

async def worker(name, delay):
    print(f"[{name}] 开始")
    await asyncio.sleep(delay)
    print(f"[{name}] 结束")
    return name

async def main():
    start = time.perf_counter()
    # 串行：一个接一个
    r1 = await worker("甲", 1)
    r2 = await worker("乙", 1)
    r3 = await worker("丙", 1)
    elapsed = time.perf_counter() - start
    print(f"串行总耗时: {elapsed:.2f} 秒")

asyncio.run(main())
# 输出：
# [甲] 开始
# （1 秒）
# [甲] 结束
# [乙] 开始
# （1 秒）
# [乙] 结束
# [丙] 开始
# （1 秒）
# [丙] 结束
# 串行总耗时: 3.00 秒
```

串行写法里，第二个协程必须等第一个完全结束（sleep 完 1 秒并返回）才会启动，所以总耗时就老老实实是 3 秒。同样是 `asyncio.sleep`、同样是非阻塞，写成串行就失去了并发意义。这说明一个关键点：并发不是 `asyncio.sleep` 本身带来的，而是"非阻塞 + 同时启动多个协程"共同带来的；`asyncio.sleep` 只是提供了"非阻塞等待"这一基础能力。

**错峰不同 delay 看完成顺序**

给三个协程不同的延迟，可以更清楚地看到事件循环是按"谁先到期谁先醒"来调度的：

```python
import asyncio

async def worker(name, delay):
    await asyncio.sleep(delay)
    print(f"[{name}] 醒了，等了 {delay} 秒")

async def main():
    await asyncio.gather(
        worker("长", 1.0),
        worker("中", 0.5),
        worker("短", 0.1),
    )
    print("全部完成")

asyncio.run(main())
# 输出：
# [短] 醒了，等了 0.1 秒
# [中] 醒了，等了 0.5 秒
# [长] 醒了，等了 1.0 秒
# 全部完成
```

三个协程同时启动，但 sleep 时间不同。事件循环按定时器到期顺序依次唤醒它们：0.1 秒的先醒，0.5 秒的次之，1 秒的最后。这正是事件循环"就绪队列 + 定时器队列"调度的直观体现——谁先到期谁先被放回就绪队列执行。

### 2.4 asyncio.sleep(0)：让出一次控制权

`asyncio.sleep(0)` 是一个特殊用法：它不产生任何实际延迟，但会让当前协程主动让出一次 CPU，把控制权交还给事件循环，让其它就绪协程有机会跑一轮，然后再回到当前协程继续。

**为什么需要 sleep(0)**

事件循环是"协作式"调度的：一个协程一旦开始跑，只要不遇到 `await` 让出，它就会一直占着 CPU，其它协程只能等着。这跟"抢占式"调度的线程不同——线程会被操作系统强行切换。如果一个协程里有大量 CPU 计算又没有 `await`，它就会"饿死"其它协程。在这种情况下，适当插入 `await asyncio.sleep(0)` 就是一种"喘口气"的手段：让出一次，让事件循环去处理一下别的协程、IO 回调，再回来。

```python
import asyncio

async def cpu_heavy():
    for i in range(5):
        # 模拟一段 CPU 计算
        total = sum(j * j for j in range(100_000))
        print(f"计算第 {i} 轮，部分结果={total}")
        await asyncio.sleep(0)   # 让出一次，给其它协程机会
    print("计算全部完成")

async def heartbeat():
    for i in range(5):
        print(f"  心跳 {i}")
        await asyncio.sleep(0.0001)
    print("  心跳结束")

async def main():
    await asyncio.gather(cpu_heavy(), heartbeat())

asyncio.run(main())
# 输出（每次运行顺序可能略有不同，但两协程会交替）：
# 计算第 0 轮，部分结果=...
#   心跳 0
# 计算第 1 轮，部分结果=...
#   心跳 1
# 计算第 2 轮，部分结果=...
#   心跳 2
# 计算第 3 轮，部分结果=...
#   心跳 3
# 计算第 4 轮，部分结果=...
#   心跳 4
# 计算全部完成
#   心跳结束
```

如果没有 `await asyncio.sleep(0)`，`cpu_heavy` 会一口气把 5 轮计算跑完，`heartbeat` 根本没机会打印——它只能在 `cpu_heavy` 完全结束后才被调度。加入 `sleep(0)` 后，每轮计算之间都有一次让出，`heartbeat` 得到执行机会，两者交替进行。

**用 sleep(0) 验证调度顺序**

`sleep(0)` 也常用于演示事件循环的"就绪队列"行为——让出后，事件循环会把当前协程排到就绪队列尾部，先处理队列前面的任务：

```python
import asyncio

async def task(name):
    for i in range(3):
        print(f"[{name}] 第 {i} 次")
        await asyncio.sleep(0)   # 让出，自己被排到队尾

async def main():
    await asyncio.gather(task("A"), task("B"))

asyncio.run(main())
# 输出：
# [A] 第 0 次
# [B] 第 0 次
# [A] 第 1 次
# [B] 第 1 次
# [A] 第 2 次
# [B] 第 2 次
```

可以看到 `A` 和 `B` 严格交替：每次某个协程 `sleep(0)` 让出后，事件循环会先去跑另一个就绪协程，而不是立刻回来继续跑它自己。这就是"让出后被排到队尾"的效果。这种交替只有在 `sleep(0)` 这种"纯让出、不等待"的操作下才会如此干净地呈现。

**sleep(0) 不是"零延迟等待"**

要理解 `sleep(0)` 与 `sleep(0.0001)` 的区别。`sleep(0.0001)` 会注册一个真实的定时器（0.1 毫秒后唤醒），协程会真的被挂起一段时间；而 `sleep(0)` 根本不注册定时器，它只是立即把协程标记为"让出"并重新排队，事件循环在当前这一轮结束后会马上再次调度它（如果它排到了队首）。所以 `sleep(0)` 几乎不产生时间延迟，它的全部意义在于"调度顺序"的调整。

### 2.5 result 参数：给 sleep 一个返回值

`asyncio.sleep` 的第二个参数 `result` 很少用到，但它存在。如果传了 `result`，`await asyncio.sleep(delay, result)` 会把这个值作为整个表达式的返回值返回。默认是 `None`，所以平时 `await asyncio.sleep(...)` 拿到的是 `None`。

```python
import asyncio

async def main():
    # sleep 0.1 秒，并带一个返回值
    value = await asyncio.sleep(0.1, result="醒来啦")
    print(f"sleep 返回: {value!r}")

asyncio.run(main())
# 输出：
# sleep 返回: '醒来啦'
```

这个参数主要用于一些教学或测试场景——你想让"模拟 IO"函数带一个返回值，又不想再单独写 return。在真实代码里，大家更习惯在 `sleep` 之后单独 `return` 数据，所以 `result` 参数存在感较低。但了解它有助于理解 `asyncio.sleep` 的签名完整性，也方便在 mock 异步函数时直接用 `sleep` 顶替带返回值的协程。

### 2.6 返回值与取消行为

**返回 None**

`asyncio.sleep` 正常完成后返回 `None`（不传 `result` 时）。它本身不携带任何"等到的东西"——它要做的就是"等一会儿"这件事，等完就结束。所以你不会写 `data = await asyncio.sleep(1)` 然后期望 `data` 有意义；真正的数据得从真实的异步 IO 操作里来。

**被取消时的行为**

如果一个协程正在 `await asyncio.sleep(10)`，而外界通过 `task.cancel()` 取消了它，`asyncio.sleep` 会抛出 `asyncio.CancelledError`。这是异步编程里"取消长等待"的常见手段：

```python
import asyncio

async def long_wait():
    try:
        print("开始长等待")
        await asyncio.sleep(10)
        print("等待完成（正常情况下）")
    except asyncio.CancelledError:
        print("等待被取消了！")
        raise   # 推荐重新抛出，让取消语义向上传递

async def main():
    task = asyncio.create_task(long_wait())
    await asyncio.sleep(0.5)   # 让 long_wait 先进入 sleep(10)
    task.cancel()              # 取消它
    try:
        await task
    except asyncio.CancelledError:
        print("主协程感知到任务被取消")

asyncio.run(main())
# 输出：
# 开始长等待
# 等待被取消了！
# 主协程感知到任务被取消
```

`asyncio.sleep` 对取消友好——它会在被取消时及时抛出 `CancelledError`，不会赖着不走。这也使得它非常适合用来模拟"可以被中断的长时间 IO"。

### 2.7 用 asyncio.sleep 模拟真实异步 IO 的结构

真实项目里，一个异步 IO 函数的典型结构是：发起 IO → 等待完成 → 处理结果。用 `asyncio.sleep` 模拟时，结构完全一致，只是把"等待真实 IO"换成了"等待固定时间"。

```python
import asyncio
import random

async def fake_request(url, max_delay=2.0):
    """模拟一次异步 HTTP 请求：等待随机延迟后返回伪响应。"""
    delay = random.uniform(0.3, max_delay)
    await asyncio.sleep(delay)          # 这一行就是"假 IO"
    if delay > 1.5:
        raise RuntimeError(f"{url} 超时（模拟）")
    return {"url": url, "latency": delay, "status": 200}

async def main():
    urls = ["/api/users", "/api/orders", "/api/items"]
    # 并发请求
    tasks = [fake_request(u) for u in urls]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    for r in results:
        if isinstance(r, Exception):
            print(f"失败: {r}")
        else:
            print(f"成功: {r}")

asyncio.run(main())
# 输出（每次延迟随机，内容会变）：
# 成功: {'url': '/api/users', 'latency': 0.71, 'status': 200}
# 成功: {'url': '/api/orders', 'latency': 1.12, 'status': 200}
# 失败: RuntimeError('/api/items 超时（模拟））
```

这个 `fake_request` 函数和真实异步 HTTP 客户端的写法在结构上几乎一样：都是 `await` 一个非阻塞操作、都可能抛异常、都可以被 `gather` 并发。把 `await asyncio.sleep(delay)` 换成 `await aiohttp.get(url)`，业务代码一行都不用改。这就是用 `sleep` 练习异步编程的价值——你可以不依赖任何外部网络，就把并发、取消、异常处理、超时这些模式全练熟。

### 2.8 asyncio.sleep 与 asyncio.wait_for 配合实现超时

`asyncio.sleep` 经常和 `asyncio.wait_for` 一起用来演示"超时控制"。`wait_for(aw, timeout)` 会在 `timeout` 秒内等待 `aw` 完成，超时则取消它。

```python
import asyncio

async def slow():
    await asyncio.sleep(5)     # 假装是个很慢的 IO
    return "慢动作完成"

async def main():
    try:
        # 最多等 1 秒，超时就取消
        result = await asyncio.wait_for(slow(), timeout=1.0)
        print(f"结果: {result}")
    except asyncio.TimeoutError:
        print("超时！任务被取消")

asyncio.run(main())
# 输出：
# 超时！任务被取消
```

这里的 `asyncio.sleep(5)` 模拟了一个"会卡很久的 IO"，而 `wait_for` 给它套了一层 1 秒的超时。到 1 秒时 `slow` 还没完成，`wait_for` 就会取消它——`slow` 里的 `await asyncio.sleep(5)` 收到取消信号抛出 `CancelledError`，整个 `slow` 被终止，`wait_for` 把它转成 `TimeoutError` 抛给主协程。这种"用 sleep 模拟慢 IO + wait_for 限超时"的组合在测试里极其常见。

### 2.9 用 sleep 演示协程调度的时间线

把 `asyncio.sleep` 和时间戳打印结合起来，能把协程调度的时间线看得非常清楚——谁在什么时刻启动、让出、被唤醒，一目了然。这对理解"并发"非常有帮助。

```python
import asyncio
import time

async def task(name, delay):
    t0 = time.perf_counter()
    print(f"[{perf():.2f}] {name} 启动，将等 {delay}s")
    await asyncio.sleep(delay)
    print(f"[{perf():.2f}] {name} 醒了，实际让出 {time.perf_counter()-t0:.2f}s")
    return name

def perf():
    return time.perf_counter() - START

START = 0.0
async def main():
    global START
    START = time.perf_counter()
    await asyncio.gather(
        task("甲", 1.0),
        task("乙", 0.5),
        task("丙", 0.1),
    )
    print(f"[{perf():.2f}] 全部完成")

asyncio.run(main())
# 输出（时间戳为相对秒数，每次运行略有差异）：
# [0.00] 甲 启动，将等 1.0s
# [0.00] 乙 启动，将等 0.5s
# [0.00] 丙 启动，将等 0.1s
# [0.10] 丙 醒了，实际让出 0.10s
# [0.50] 乙 醒了，实际让出 0.50s
# [1.00] 甲 醒了，实际让出 1.00s
# [1.00] 全部完成
```

从时间线可以清楚看到：三个协程在 `0.00` 同时启动并让出，然后按各自 sleep 的时长依次醒来——丙 0.1 秒、乙 0.5 秒、甲 1.0 秒。全部完成时刻就是最长那个（甲）的醒来时刻 1.00 秒。如果把 `task` 里的 `asyncio.sleep` 换成 `time.sleep`，输出会变成三个协程各自"启动→醒来"的时间戳相距很远（因为线程被睡死，下一个协程根本启动不了），总耗时变成 1.6 秒。这个对比是判断"你写的是真并发还是假并发"最直观的方式：看总耗时是约等于最长任务，还是约等于所有任务之和。

**按固定顺序看 gather 的启动顺序**

`gather` 会按传入顺序依次创建协程并启动，但它们第一次让出后，调度顺序就由事件循环的就绪队列和定时器决定，不再保证"甲先乙后"。用 `sleep(0)` 可以放大这种"启动顺序 vs 调度顺序"的差异：

```python
import asyncio

async def task(name):
    print(f"[{name}] 启动")
    await asyncio.sleep(0)   # 启动后立即让出
    print(f"[{name}] 恢复")

async def main():
    await asyncio.gather(task("甲"), task("乙"), task("丙"))

asyncio.run(main())
# 输出：
# [甲] 启动
# [乙] 启动
# [丙] 启动
# [甲] 恢复
# [乙] 恢复
# [丙] 恢复
```

启动顺序是甲乙丙（gather 传入顺序），恢复顺序也是甲乙丙——因为三个协程 `sleep(0)` 让出后被依次排入就绪队列尾部，事件循环按队列顺序依次恢复。如果它们让出的是不同时长的 `sleep`，恢复顺序就由定时器到期顺序决定（见 2.3 的错峰 demo），与启动顺序无关。

---

## 3. 最佳实践

### 3.1 协程里永远不要用 time.sleep

这是异步编程的头号红线。`time.sleep` 会阻塞整个事件循环线程，让所有协程在它睡眠期间都无法被调度。即便是"我觉得这里只睡 0.1 秒，影响不大"也不行——0.1 秒足够让一个高并发服务错过几十个请求的响应窗口。

**不推荐**

```python
import time

async def handle_request():
    # 错误：阻塞事件循环
    time.sleep(1)
    return "done"
```

**推荐**

```python
import asyncio

async def handle_request():
    # 正确：让出 CPU，其它协程可继续跑
    await asyncio.sleep(1)
    return "done"
```

判断标准很简单：只要你在 `async def` 函数体里，任何"等待"都必须是 `await` 形式。如果某个第三方库只提供同步阻塞接口（如 `requests.get`），要么换异步库（`aiohttp`、`httpx` 的 async 模式），要么用 `asyncio.to_thread` 把它丢到线程池里跑，绝不能直接 `await` 不了就同步调用。

### 3.2 用 `asyncio.sleep` 替代真实 IO 来做并发测试

写异步代码时，建议先用 `asyncio.sleep` 把并发结构跑通，再接入真实 IO 库。这样能在不依赖网络、数据库的环境下验证并发逻辑是否正确（比如并发后总耗时是否如预期、异常是否被正确收集、取消是否能生效）。

**推荐写法**

```python
async def fetch(url):
    await asyncio.sleep(0.2)   # 先用 sleep 占位，验证并发结构
    return {"url": url}

async def main():
    results = await asyncio.gather(*(fetch(u) for u in range(10)))
    # 验证并发：10 个各 0.2 秒，总耗时应约 0.2 秒而非 2 秒
```

等并发结构验证通过后，再把 `asyncio.sleep` 替换成 `await async_client.get(url)`，业务代码几乎不用动。这种"先 sleep 后替换"的练习方式，比一上来就接真实 IO 要省心得多——真实 IO 有网络抖动、连接失败等干扰因素，不利于先确认"并发模型本身写对了"。

### 3.3 测试里用小延迟，别让 CI 慢

在单元测试里用 `asyncio.sleep` 模拟延迟时，延迟值尽量小（如 `0.01` 秒），只要能制造出"多个协程在等"的局面即可，没必要真睡 1 秒。CI 上跑几十个这样的测试，每个省 0.99 秒就是几十秒。

**不推荐**

```python
async def test_concurrent():
    await asyncio.gather(worker(1), worker(1))   # worker 内部 sleep(1)
    # 测试要等 1 秒
```

**推荐**

```python
async def test_concurrent():
    await asyncio.gather(worker(0.01), worker(0.01))   # sleep(0.01) 足够
    # 测试只等 0.01 秒，逻辑验证效果一样
```

但也要注意：延迟太小（如 `0.0001`）时，定时器精度和事件循环调度开销会干扰观察到的并发行为顺序，用来做"顺序验证"的 demo 不宜过小。

### 3.4 CPU 密集型协程要主动让出

如果一个协程要做大量 CPU 计算（比如大列表处理、数值运算），且它和其它协程跑在同一个事件循环里，应该在计算过程中周期性插入 `await asyncio.sleep(0)`，避免长时间独占 CPU 饿死其它协程。

**推荐写法**

```python
async def batch_process(items):
    results = []
    for i, item in enumerate(items):
        results.append(heavy_compute(item))
        if i % 100 == 0:
            await asyncio.sleep(0)   # 每 100 个让出一次
    return results
```

更彻底的做法是把 CPU 密集任务丢到进程池（`asyncio.get_running_loop().run_in_executor(None, func, ...)`）里跑，这样根本不占事件循环线程。`sleep(0)` 适合那种"改动小、就想让协程别太霸道"的场景。

### 3.5 不要依赖 sleep 的精确时序

`asyncio.sleep(delay)` 的实际唤醒时刻通常略晚于 `delay`——事件循环需要处理完当前正在执行的协程才会回来唤醒定时器到期的协程。如果事件循环繁忙（有大量协程在跑），延误会更明显。因此：

- 不要用 `asyncio.sleep` 做精确计时或节奏控制（如"每 0.5 秒精确播一帧"）。
- 用它做"大致延迟"和"并发演示"完全没问题。
- 需要稳定周期调度的场景，用专门的循环（`while True: await asyncio.sleep(interval)`）并补偿漂移，或用 `loop.call_later`。

### 3.6 sleep(0) 不是万金油，必要时上线程/进程池

`await asyncio.sleep(0)` 只能让出给"同事件循环里的其它协程"，它不会让出给"别的线程"或"别的进程"。如果一段计算真的非常重（比如几十秒的纯 CPU），光靠 `sleep(0)` 让出是无济于事的——其它协程虽然能跑，但整体吞吐还是被这段计算拖住，因为它毕竟占着事件循环线程。这种情况下应该用 `run_in_executor` 把重计算挪到线程池或进程池里，事件循环线程保持轻量。`sleep(0)` 适合"几百毫秒级别的计算片段"，不适合"几秒以上的重活"。

### 3.7 在 mock/桩函数里用 sleep 顶替真实异步 IO

写测试时，常需要 mock 掉真实的异步 IO 函数（比如 `async_client.get`）。最简单的桩就是"sleep 一会儿然后返回固定值"——既制造了 `await` 让出行为，又能控制返回值和延迟。

```python
async def fake_get(url):
    await asyncio.sleep(0.05)      # 模拟网络往返
    return {"url": url, "status": 200, "body": b"ok"}

async def test_handler():
    resp = await fake_get("/api/x")
    assert resp["status"] == 200
```

这种桩比真连网络快、稳、可复现，也比你手写一个自定义 Future 再 `set_result` 要简洁得多——`asyncio.sleep` 把"让出 + 延迟 + 恢复"全包了。需要模拟失败时，在 sleep 后 `raise` 即可；需要模拟超时时，配合 `wait_for` 给桩套一层更短的超时。`result` 参数在这种场景下也有用武之地：`await asyncio.sleep(0.05, result={"status": 200})` 一行就同时制造了延迟和返回值。

### 3.8 区分"并发"与"并行"

`asyncio.sleep` 演示的是"并发"（concurrency），不是"并行"（parallelism）：多个协程在同一时间窗口内推进，但同一时刻只有一个协程在 CPU 上执行（因为 asyncio 默认单线程、单事件循环）。sleep 期间多个协程"同时等待"是并发；真正多个协程同时在 CPU 上跑代码（用多进程或多线程）才是并行。asyncio 擅长的是 IO 密集型并发——大量等待、少量计算；CPU 密集型并行得靠 `multiprocessing` 或 `run_in_executor`。用 sleep 练 async 时，心里要清楚你练的是"让出/调度"这回事，不是"多核并行"。

**常见误用速查**

| 误用 | 后果 | 正确做法 |
| --- | --- | --- |
| 协程里 `time.sleep(n)` | 事件循环阻塞 n 秒，所有协程冻住 | `await asyncio.sleep(n)` |
| 把 `asyncio.sleep` 当 `await asyncio.sleep(n)` 漏写 `await` | 拿到的是协程对象而非执行结果，没真正等待 | 务必写 `await` |
| 串行 `await task1(); await task2()` 却期望并发 | 实际是串行，总耗时为各任务之和 | 用 `asyncio.gather` 或 `create_task` 并发启动 |
| 用 `sleep(0.001)` 做精确计时 | 受事件循环调度影响，误差大 | 用 `time.perf_counter` 或专门的计时手段 |
| 对 CPU 密集协程不加任何 `sleep(0)` | 其它协程被饿死 | 周期性 `await asyncio.sleep(0)` 让出 |

---

## 4. 原理

### 4.1 asyncio.sleep 的内部实现

理解 `asyncio.sleep` 的原理，关键是看它如何做到"暂停协程而不阻塞线程"。它的核心实现可以简化为下面这几步（以 CPython 实现为蓝本）：

1. 创建一个 `asyncio.Future` 对象（未完成状态）。
2. 调用事件循环的 `loop.call_later(delay, future.set_result, result)`，注册一个" `delay` 秒后把 `future` 标记为完成"的定时器。
3. `await` 这个 `future`——当前协程挂起，控制权交还事件循环。
4. 事件循环在 `delay` 秒到期后，执行 `future.set_result(result)`，这会让 `future` 进入完成状态，并把等待它的协程重新放回就绪队列。
5. 事件循环调度到该协程，从 `await` 处恢复继续执行。

用伪代码表示大致是这样：

```python
async def sleep(delay, result=None):
    if delay <= 0:
        await __sleep0()         # sleep(0) 的特殊路径，见 4.3
        return result

    loop = asyncio.get_running_loop()
    future = loop.create_future()
    # 注册定时器：delay 秒后把 future 设为完成
    handle = loop.call_later(delay, future.set_result, result)
    try:
        await future             # 挂起当前协程，等 future 完成
    finally:
        handle.cancel()          # 若被提前取消，撤销定时器
    return result
```

可以看到，`asyncio.sleep` 本身没有任何"真的让操作系统去睡"的成分——它不调用 `time.sleep`、不调用内核 sleep 系统调用。它做的事情纯粹是"注册一个定时器 + 等待一个 Future"。真正"等待"的那段时间里，事件循环线程是醒着的，它在忙着跑其它协程、处理其它 IO 回调。这就是它和 `time.sleep` 的本质分野。

### 4.2 Future + loop.call_later 如何协作

把上面那段拆开，来看每个对象各自做了什么、怎么协作完成"非阻塞等待"。

**Future 是什么**

`asyncio.Future` 是一个"一次性的结果容器"：它一开始是未完成状态，可以被 `set_result(value)` 或 `set_exception(exc)` 标记为完成；`await future` 会让当前协程挂起，直到 future 被设为完成。Future 是 asyncio 里所有"等待某事"的底层抽象——你 `await` 的任何东西，最终都会被包装成对某个 future 或类似对象的等待。

**loop.call_later 做什么**

`loop.call_later(delay, callback, *args)` 是事件循环提供的定时器接口：它告诉事件循环" `delay` 秒之后，请帮我调用 `callback(*args)`"。事件循环内部会维护一个按到期时间排序的定时器队列（通常用最小堆实现）。注册后，事件循环每跑一轮都会检查"最早到期的定时器有没有到期"，到期了就执行对应回调。

**两者如何配合**

`asyncio.sleep` 把这两者串起来了：
- `loop.call_later(delay, future.set_result, result)` —— `delay` 秒后，事件循环会调用 `future.set_result(result)`，future 变成完成状态。
- `await future` —— 当前协程挂起在 future 上。

于是"等待 delay 秒"这件事被拆成了"定时器到期驱动 future 完成"+"协程等待 future 完成"两步，中间事件循环完全自由，可以去跑别的协程。等到定时器到期、future 完成，事件循环把挂起的协程放回就绪队列，稍后调度恢复它。

**被取消时的清理**

如果协程在 `await future` 期间被外部 `cancel()`，`asyncio.sleep` 的 `finally` 块会调用 `handle.cancel()` 撤销定时器（免得到期后还去 `set_result` 一个已经废弃的 future），并让 `CancelledError` 向上抛出。这就是为什么 `asyncio.sleep` 对取消响应及时——它没有"睡死在内核里"，只是挂在一个 future 上，取消信号一来就能抛出。

### 4.3 与 time.sleep 阻塞系统调用的本质区别

`time.sleep(n)` 在 CPython 里最终会调用操作系统的 sleep（在 Unix 上是 `nanosleep`，Windows 上是 `Sleep`）。这是一个系统调用：当前线程从用户态进入内核态，内核把该线程标记为"睡眠中"并从 CPU 上撤下，直到 n 秒后才重新标记为就绪、等待被调度。在这 n 秒里，这个线程什么用户态代码都执行不了——如果这个线程恰好就是跑事件循环的线程（通常是主线程），那么事件循环也被冻住，所有协程都动弹不得。

`asyncio.sleep(n)` 完全不碰内核 sleep。它只是注册一个定时器回调、然后 `await` 一个 future。从操作系统视角看，这个线程从头到尾都是"运行中"的——它要么在跑用户协程代码，要么在跑事件循环的调度逻辑，要么在检查定时器队列。它没有"进入内核睡 n 秒"这一步。这也就是为什么 `asyncio.sleep` 叫"非阻塞等待"——阻塞的是这一个协程，而不是整个线程。

用一个比喻：`time.sleep` 像是让整个办公室断电 n 秒，所有人都干不了活；`asyncio.sleep` 像是某个人说"我 n 秒后再回来"，把工位让出来，这 n 秒里别人可以用他的工位办公，到点了他再回来。

### 4.4 asyncio.sleep(0) 如何实现一次让出

`sleep(0)` 走的是和 `sleep(delay>0)` 不同的路径。当 `delay <= 0` 时，`asyncio.sleep` 不会去注册 `loop.call_later`（没有延迟可等），而是走一个特殊的 `__sleep0()` 路径。

`__sleep0()` 的核心是利用 await 的让出语义：它 `await` 一个会立即让出的对象（在 CPython 实现里通常是通过 `await __sleep0()` 触发一次底层的 yield，把控制权交还事件循环）。这次 yield 的效果是：当前协程被排到就绪队列尾部，事件循环去处理队列前面的就绪协程或 IO 回调，等这一轮处理完，再回到这个协程从 `await` 处恢复继续。

用伪代码理解：

```python
@types.coroutine
def __sleep0():
    yield   # 直接向事件循环 yield 一次，不绑定任何 future/定时器

async def sleep(delay, result=None):
    if delay <= 0:
        await __sleep0()
        return result
    # ... delay > 0 的路径见 4.1
```

关键点：`__sleep0` 里这个 `yield` 不附带任何"等待什么"的语义——它不    等 future、不等定时器、不等 IO。它纯粹是"我让出一下，你先把别的就绪任务跑一轮，再回来"。所以 `sleep(0)` 几乎不产生时间延迟，它的全部效果就是"调整调度顺序"：让当前协程从"队列头部"挪到"队列尾部"，给排在前面的就绪任务一次执行机会。

这也是为什么 `sleep(0)` 能用来做协作式调度——它就是 asyncio 里最轻量的"让出"原语。相比 `sleep(0.0001)` 那种"真的注册一个定时器再让出"的方式，`sleep(0)` 更纯粹、开销更小，专门服务于"让出一次"这个目的。

### 4.5 事件循环如何把"三个 sleep 1 并发"压成 1 秒

把 4.1~4.4 串起来，回头看 2.3 里"三个各 sleep 1 秒的协程并发，总耗时 1 秒"这个现象，就能从原理上说清楚为什么：

1. `gather` 在 `t=0` 依次启动三个协程甲、乙、丙。
2. 甲执行到 `await asyncio.sleep(1)`：创建 future_甲，`loop.call_later(1, future_甲.set_result)` 注册一个 1 秒后到期的定时器，然后 `await future_甲` 让出，甲被挂起。
3. 乙、丙同样：各自创建 future、注册 1 秒定时器、await 让出、挂起。此时三个定时器都定在 `t=1` 到期。
4. 事件循环发现当前没有其它就绪协程可跑（甲乙丙都挂起了），就阻塞在 selector 上等待 IO 或定时器到期。
5. 到 `t=1`，三个定时器同时到期：事件循环依次执行 `future_甲.set_result`、`future_乙.set_result`、`future_丙.set_result`，三个 future 完成，对应协程被放回就绪队列。
6. 事件循环依次调度甲、乙、丙从各自 `await` 处恢复，打印"结束"并返回。

总耗时 = 最早到期定时器的时间（`t=1`），而不是三个定时器时间之和。这正    是非阻塞等待带来的并发：三个"1 秒等待"在时间轴上是重叠的，而非首尾相接。

如果是 `time.sleep(1)` 串成三个，每个都让线程进内核睡 1 秒，三个就是首尾相接的 3 秒——因为线程在睡的时候没法去启动下一个协程。

### 4.6 定时器精度与唤醒延迟

`asyncio.sleep(1)` 的实际唤醒时刻通常略微晚于 1.000 秒，原因有二：

- 事件循环不是"时钟中断驱动"的，它是在每一轮循环里主动检查定时器队列。如果某一轮循环正在跑一个耗时协程（哪怕是别的协程），到期定时器的回调就得等那一轮跑完才能被处理，产生"唤醒延迟"。
- 操作系统本身的定时器精度有限（通常几毫秒），非常小的延迟会被向上取整。

所以 `asyncio.sleep` 的 `delay` 是"至少等这么久"，不是"精确等这么久"。这也是为什么前面最佳实践里说"不要拿它做精确计时"——它的精度受事件循环繁忙程度和 OS 定时器粒度共同影响，不稳定。

---

## 5. 总结

- `asyncio.sleep(delay)` 暂停当前协程 `delay` 秒并向事件循环让出 CPU，是非阻塞等待；`time.sleep` 阻塞整个线程、连带卡死事件循环，两者行为截然不同。
- 它是学习/测试异步代码最常用的"假 IO"：用一行 `await asyncio.sleep(n)` 模拟网络/磁盘延迟，无需真做 IO，结构却能直接平移到真实异步库。
- 多个各 sleep 1 秒的协程用 `gather` 并发，总耗时约 1 秒（取最长延迟而非求和），这把"并发"可视化；写成串行 `await` 则是 3 秒，说明并发来自"非阻塞 + 同时启动多个协程"。
- `asyncio.sleep(0)` 不产生实际延迟，只让出一次控制权，把当前协程排到就绪队列尾部，用于协作式调度、避免 CPU 密集协程饿死其它任务、验证调度顺序。
- `result` 参数给 sleep 一个返回值（默认 `None`）；sleep 正常返回 None，被取消时抛 `CancelledError`，对取消友好。
- 原理上，`asyncio.sleep` 用 `Future + loop.call_lather` 实现：注册定时器、await future 让出，定时器到期后 `future.set_result` 驱动协程恢复，全程不进内核 sleep；`sleep(0)` 走特殊路径，用纯 `yield` 让出一次，不注册定时器。
- 协程里禁止使用 `time.sleep`；测试中的延迟尽量小以省 CI 时间；CPU 密集协程要周期性 `sleep(0)` 让出或丢到线程/进程池；不要依赖 sleep 的精确时序做计时。

读完本文你应能：
- 说明 `asyncio.sleep` 与 `time.sleep` 的本质区别，并能在协程中正确选用（只用前者）。
- 用 `asyncio.sleep + gather` 写出多协程并发 demo，并解释为何总耗时等于最长任务而非求和。
- 说出 `asyncio.sleep(0)` 的特殊语义和典型用途（让出、协作式调度、调度顺序验证）。
- 用 `asyncio.sleep` 模拟可取消的长等待、带超时的 IO（配合 `wait_for`），并解释取消时的异常传递。
- 讲清 `asyncio.sleep` 的内部实现（Future + loop.call_later + await 挂起 + 定时器到期唤醒），以及 `sleep(0)` 如何用纯 yield 实现一次让出。
