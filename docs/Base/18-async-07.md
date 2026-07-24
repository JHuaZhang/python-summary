---
group:
  title: 【18】异步协程
  order: 18
order: 7
title: asyncio.gather 与 asyncio.wait
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是"等待多个任务"

在 asyncio 程序里，单个协程用 `await coro()` 就能驱动；但在真实业务中，我们几乎不会只等一个任务。一个网关接口可能要同时请求三个下游服务，一个爬虫要并发拉取几十个页面，一个批处理要在超时窗口内能拉多少拉多少。这些场景的共同点是：**同时启动一批协程，然后在某个位置一起等它们的结果**。

asyncio 提供了两个用来"批量等待多个任务"的高层工具：`asyncio.gather` 和 `asyncio.wait`。它们都能把多个 awaitable（协程、Task、Future）放在一起并发执行，但在"结果怎么给你""异常怎么处理""多细粒度地控制收尾"这三件事上差别很大。一句话区分：

- `asyncio.gather`：**按输入顺序给你一个结果列表**，默认有任一异常就向上抛，适合"我都要结果，而且要按顺序拿"。
- `asyncio.wait`：**给你两个集合——已完成的和未完成的**，不直接给结果，你得自己从 Task 上取；但能控制"等到第一个完成就停""等到第一个异常就停""带超时让余下任务自生自灭"。适合"谁先好我先用""我要超时控制"。

理解这两个函数的取舍，是写好异步并发代码的基本功。选错函数，要么写出错误的异常处理（一个挂了全军覆没），要么写一堆本可以一行解决的 `asyncio.gather` 逻辑。

### 1.2 基本语法与最小用法

先看两者的最小签名与用法。

**asyncio.gather 的基本形态**

```python
asyncio.gather(*aws, return_exceptions=False)
```

- `*aws`：任意个 awaitable（协程对象、Task、Future），位置参数展开传进来。
- `return_exceptions`：布尔，默认 `False`。`False` 时任一 awaitable 抛异常，整个 gather 立即把该异常向上抛；`True` 时异常不抛，而是作为结果列表的一个元素返回。
- 返回值是一个 Future，`await` 它得到的是**按输入顺序排列的结果列表**。

最小用例：并发跑三个协程，按输入顺序拿结果。

```python
import asyncio

async def fetch(name: str, delay: float) -> str:
    await asyncio.sleep(delay)
    return f"{name} done in {delay}s"

async def main():
    # 注意：完成顺序是 C(0.1) → B(0.2) → A(0.5)，但结果按输入顺序返回
    results = await asyncio.gather(
        fetch("A", 0.5),
        fetch("B", 0.2),
        fetch("C", 0.1),
    )
    print(results)

asyncio.run(main())
# 输出：['A done in 0.5s', 'B done in 0.2s', 'C done in 0.1s']
```

关键点：`C` 最先完成，但 `results[2]` 仍然是 `C` 的结果——**结果顺序锁定为输入顺序**，不会被完成先后打乱。这是 gather 最常被依赖的保证。

**asyncio.wait 的基本形态**

```python
asyncio.wait(aws, *, return_when=ALL_COMPLETED, timeout=None)
```

- `aws`：一个**可迭代对象**（通常是集合或列表），元素是 awaitable。注意它不是 `*aws` 的位置展开，而是接受一个整体可迭代对象。从 3.8 起直接传协程已被废弃，建议传 Task。
- `return_when`：取值 `asyncio.FIRST_COMPLETED` / `asyncio.FIRST_EXCEPTION` / `asyncio.ALL_COMPLETED`（默认）。
- `timeout`：可选超时秒数，到点没满足 `return_when` 条件就返回。
- 返回值是 `(done, pending)` 二元组，两个都是 `set[Task]`，不直接给结果，要自己从 Task 上 `.result()` 取。

最小用例：等所有完成，自己取结果。

```python
import asyncio

async def fetch(name: str, delay: float) -> str:
    await asyncio.sleep(delay)
    return f"{name} done in {delay}s"

async def main():
    tasks = [asyncio.create_task(fetch(n, d)) for n, d in [("A", 0.5), ("B", 0.2), ("C", 0.1)]]
    done, pending = await asyncio.wait(tasks)
    # done 里是已完成的 Task，顺序不保证，自己取结果
    for t in tasks:  # 按输入顺序取，保证可读
        print(t.result())

asyncio.run(main())
# 输出：
# A done in 0.5s
# B done in 0.2s
# C done in 0.1s
```

差别一眼可见：gather 一行就拿到按序列表；wait 给你两个集合，结果要自己捞。代价换来的是更细的控制权，下面逐层展开。

---

## 2. 核心内容

### 2.1 asyncio.gather：按序收集结果

**作用与适用场景**

gather 解决的问题是"我有一批 awaitable，我都要它们的结果，**而且结果要跟我输入的顺序一一对应**"。典型场景：

- 并发请求多个下游接口，拿到后按固定顺序组装成响应。
- 并发跑多个独立计算任务，结果要按编号写入数组。
- 批量入库，要确认每一行的结果。

只要"都要结果"且"顺序有意义"，gather 是首选。

**参数详解**

`asyncio.gather(*aws, return_exceptions=False)`

- `*aws`：位置展开的 awaitable 序列。可以是裸协程（`fetch("A", 0.5)`），也可以是 `Task` 对象（`asyncio.create_task(...)`），也可以是 `Future`。混着传也行。如果传进来的是协程，gather 内部会自动用 `ensure_future` 把它包成 Task——所以裸协程也能跑，但语义上"协程对象传给 gather 时才被包装成 Task 调度"这点要记牢（原理章详述）。
- `return_exceptions`：默认 `False`。
  - `False`：任一 awaitable 抛异常，gather 立即把这个异常向上抛给 `await gather(...)` 的调用方。**注意此时其它还没完成的任务并不会被自动取消**（3.7 及以前的行为；3.8+ 文档强调由调用方负责取消，但默认实现里它们会继续跑完，只是结果不会出现在返回列表里，因为已经抛异常退出了）。这通常是"结果丢失"的坑点。
  - `True`：任何异常都不会向上抛，而是把异常对象本身放在结果列表的对应位置。这样你可以拿到"哪些成功了、哪些失败了"的全貌。

**返回值**

`gather(...)` 返回的是一个 `_GatheringFuture`（Future 子类）。`await` 它后得到一个 `list`，长度等于输入 awaitable 的个数，元素按输入顺序排列，每个元素是对应 awaitable 的返回值（或异常对象，当 `return_exceptions=True` 时）。

**demo：并发三请求按序返回**

模拟三个下游接口，延迟不同，看 gather 的顺序保证。

```python
import asyncio

async def fetch_user(uid: int) -> dict:
    await asyncio.sleep(0.3)  # 模拟网络延迟
    return {"id": uid, "name": f"user_{uid}"}

async def fetch_orders(uid: int) -> list:
    await asyncio.sleep(0.2)
    return [f"order_1_of_{uid}", f"order_2_of_{uid}"]

async def fetch_profile(uid: int) -> dict:
    await asyncio.sleep(0.4)
    return {"uid": uid, "level": 7}

async def main():
    uid = 42
    # 三个请求并发;profile 最慢(0.4),但结果顺序仍是 user, orders, profile
    user, orders, profile = await asyncio.gather(
        fetch_user(uid),
        fetch_orders(uid),
        fetch_profile(uid),
    )
    print("user:", user)
    print("orders:", orders)
    print("profile:", profile)

asyncio.run(main())
# 输出：
# user: {'id': 42, 'name': 'user_42'}
# orders: ['order_1_of_42', 'order_2_of_42']
# profile: {'uid': 42, 'level': 7}
```

这里用解包 `user, orders, profile = await gather(...)` 是 gather 的经典写法——因为顺序严格对应输入，你可以放心解包成有名字的变量。

**return_exceptions 的两种异常路径**

这是 gather 最需要讲清的部分。先看默认（`False`）下的异常行为。

```python
import asyncio

async def good(n: int) -> int:
    await asyncio.sleep(0.1)
    return n * 2

async def bad() -> int:
    await asyncio.sleep(0.05)
    raise ValueError("boom")

async def main():
    # bad 抛异常,整个 gather 立即向上抛;good(1)/good(3) 的结果拿不到
    try:
        results = await asyncio.gather(good(1), bad(), good(3))
    except ValueError as e:
        print("捕获到:", e)
    asyncio.run(main())
# 输出：捕获到: boom
```

注意：`bad` 延迟 0.05s 最先完成并抛异常，此时 gather 把异常向上抛，`good(1)` 和 `good(3)` 其实还在跑（它们延迟 0.1s）。调用方拿到异常时，这两个任务**不会被 gather 自动取消**。这在事件循环自然结束前看不出问题，但如果循环继续跑别的逻辑，它们可能还会产生副作用（比如打印日志、写库）。**实际工程里，如果你希望"一个挂了整批作废"，要么自己包 `try/except` 后取消，要么在 3.11+ 用 `asyncio.TaskGroup`**（见最佳实践）。

再看 `return_exceptions=True`：异常变成结果列表里的元素。

```python
import asyncio

async def good(n: int) -> int:
    await asyncio.sleep(0.1)
    return n * 2

async def bad() -> int:
    await asyncio.sleep(0.05)
    raise ValueError("boom")

async def main():
    # return_exceptions=True: 异常作为元素返回,不抛
    results = await asyncio.gather(good(1), bad(), good(3), return_exceptions=True)
    print(results)
    # 逐个处理:区分成功与失败
    for i, r in enumerate(results):
        if isinstance(r, Exception):
            print(f"位置 {i} 失败: {type(r).__name__}: {r}")
        else:
            print(f"位置 {i} 成功: {r}")

asyncio.run(main())
# 输出：
# [2, ValueError('boom'), 6]
# 位置 0 成功: 2
# 位置 1 失败: ValueError: boom
# 位置 2 成功: 6
```

`return_exceptions=True` 是"批处理场景"的正确选择：某一行失败不影响你收集其它行的结果，失败行你可以单独记日志、重试或跳过。顺序也仍在，位置 1 对应输入里的 `bad()`。

**混合 awaitable 与顺序保证**

gather 接受任意 awaitable 混传，结果仍按输入顺序对齐。

```python
import asyncio

async def coro_a():
    await asyncio.sleep(0.1)
    return "A"

async def coro_b():
    await asyncio.sleep(0.05)
    return "B"

async def main():
    t_b = asyncio.create_task(coro_b())  # 提前建 Task
    # 混传:裸协程 coro_a() 和 Task t_b
    results = await asyncio.gather(coro_a(), t_b)
    print(results)  # ['A', 'B'] —— 顺序=输入顺序,不是完成顺序

asyncio.run(main())
# 输出：['A', 'B']
```

即使 `t_b` 提前建立且更早完成，结果列表里 `A` 仍在前。

**取消 gather 的传导**

`gather` 返回的 Future 被 `cancel()` 时，会向所有被它管理的 awaitable 传播取消。

```python
import asyncio

async def slow(n: int) -> int:
    try:
        await asyncio.sleep(10)
        return n
    except asyncio.CancelledError:
        print(f"task {n} 被取消")
        raise

async def main():
    g = asyncio.gather(slow(1), slow(2), slow(3))
    # 1 秒后取消整个 gather
    asyncio.get_event_loop().call_later(1.0, g.cancel)
    try:
        await g
    except asyncio.CancelledError:
        print("gather 被取消")
    # 给被取消的任务一点时间打印
    await asyncio.sleep(0.01)

asyncio.run(main())
# 输出：
# task 1 被取消
# task 2 被取消
# task 3 被取消
# gather 被取消
```

这个传播行为在写"带总超时的批量取消"时很有用：取消 gather 这个聚合 Future，等于广播取消它下面所有任务。

### 2.2 asyncio.wait：分桶与时机控制

**作用与适用场景**

wait 解决的问题是"我要更细地控制等到什么程度就返回"。典型场景：

- 竞速：十几个镜像源，谁先回来用谁，其余取消。
- 超时截断：1 秒内能跑完几个算几个，超时的不管。
- 全部成功才继续，但任何异常都允许"提前止损"。
- 不需要结果列表，只想知道哪些完成了。

**参数详解**

`asyncio.wait(aws, *, return_when=ALL_COMPLETED, timeout=None)`

- `aws`：一个**可迭代对象**（不是位置展开）。元素应为 Task/Future。从 3.8 起，直接传协程被标记废弃（DeprecationWarning），3.12 起进一步收紧。推荐写法是用 `asyncio.create_task` 先包成 Task 再传。原因是：wait 不会把协程自动管理成"可被外部取消"的 Task 句柄，传 Task 才能拿到 pending 集合后做取消。
- `return_when`：三个常量之一。
  - `asyncio.ALL_COMPLETED`（默认）：所有 awaitable 都完成（含异常完成）才返回。等价于"全等"。
  - `asyncio.FIRST_COMPLETED`：任一 awaitable 完成就立即返回。剩余的在 `pending` 里。
  - `asyncio.FIRST_EXCEPTION`：任一 awaitable 抛异常就立即返回；如果没有异常，则等全部完成。适合"出错就停"。
- `timeout`：`float | None`。最多等这么多秒；到点还没满足 `return_when` 条件就返回，此时 `done` 里有已完成的、`pending` 里有没完成的。`timeout=None` 表示不限时。

**返回值**

`(done, pending)`：两个 `set[Task]`。
- `done`：已完成的 Task 集合。
- `pending`：尚未完成的 Task 集合。

注意 wait **不会直接给你结果**，也不会按输入顺序排列——集合是无序的。要结果自己 `task.result()`，要顺序自己按原始 Task 列表遍历。异常也不会被 wait 抛出——Task 上的异常会在你调 `.result()` 时抛，或在事件循环回收时告警（如果一直不取）。

**demo：FIRST_COMPLETED 竞速取最先完成**

三个镜像源，谁先返回用谁，其余取消。

```python
import asyncio

async def mirror(name: str, delay: float) -> str:
    await asyncio.sleep(delay)
    return f"{name}: {delay}s"

async def main():
    tasks = [
        asyncio.create_task(mirror("cn", 0.5)),
        asyncio.create_task(mirror("us", 0.2)),
        asyncio.create_task(mirror("eu", 0.8)),
    ]
    done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
    # done 里只有最先完成的那个(us)
    winner = done.pop().result()
    print("最快:", winner)
    # 其余取消,避免协程泄漏
    for t in pending:
        t.cancel()
    # 等被取消的任务结束,避免回收告警
    await asyncio.gather(*pending, return_exceptions=True)

asyncio.run(main())
# 输出：最快: us: 0.2s
```

这里几个细节值得强调：第一，`done.pop().result()` 取结果——因为 wait 不给结果，必须自己从 Task 上捞。第二，**自己取消 pending 是工程必须**，否则那些任务还在事件循环里跑着，协程泄漏。第三，取消后 `await asyncio.gather(*pending, return_exceptions=True)` 等它们处理完 `CancelledError`，避免"Task was destroyed but it is pending"的告警。

**demo：FIRST_EXCEPTION 出错即停**

三个任务，其中 `b` 会抛异常。希望 `b` 一抛就返回，剩下的留在 pending 里待决策。

```python
import asyncio

async def a():
    await asyncio.sleep(0.3)
    return "a ok"

async def b():
    await asyncio.sleep(0.1)
    raise RuntimeError("b 失败")

async def c():
    await asyncio.sleep(0.5)
    return "c ok"

async def main():
    tasks = [asyncio.create_task(a()), asyncio.create_task(b()), asyncio.create_task(c())]
    done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_EXCEPTION)
    print("done 数量:", len(done))
    # 检查 done 里是否有异常
    for t in done:
        if t.exception() is not None:
            print("出错的任务:", t.get_name(), "->", t.exception())
    # 决策:取消余下
    for t in pending:
        t.cancel()
    await asyncio.gather(*pending, return_exceptions=True)

asyncio.run(main())
# 输出：
# done 数量: 1
# 出错的任务: Task-2 -> b 失败
```

`FIRST_EXCEPTION` 在 `b` 抛异常那一刻返回，此时 `a` 和 `c` 还没完成，在 `pending` 里。注意：如果所有任务都成功，`FIRST_EXCEPTION` 会一直等到全部完成（因为没有异常触发提前返回），这时 `pending` 为空，行为退化为 `ALL_COMPLETED`。

**demo：timeout 超时截断**

1 秒内能完成几个算几个，其余取消。

```python
import asyncio

async def job(n: int, delay: float) -> int:
    await asyncio.sleep(delay)
    return n

async def main():
    tasks = [
        asyncio.create_task(job(1, 0.3)),
        asyncio.create_task(job(2, 0.8)),
        asyncio.create_task(job(3, 1.5)),  # 超时
        asyncio.create_task(job(4, 2.0)),  # 超时
    ]
    done, pending = await asyncio.wait(tasks, timeout=1.0, return_when=asyncio.ALL_COMPLETED)
    print(f"完成 {len(done)} 个:", sorted(t.result() for t in done))
    print(f"超时 {len(pending)} 个:", sorted(t.get_name() for t in pending))
    for t in pending:
        t.cancel()
    await asyncio.gather(*pending, return_exceptions=True)

asyncio.run(main())
# 输出：
# 完成 2 个: [1, 2]
# 超时 2 个: ['Task-3', 'Task-4']
```

`timeout` 触发后立即返回，`done` 里是 1 秒内完成的、`pending` 里是没完成的。后续处理与竞速一致：取消并等待收尾。注意超时这类场景，`return_when=ALL_COMPLETED` 配合 `timeout` 是"尽力而为全等、超时即截断"的语义；如果换成 `FIRST_COMPLETED`，则语义变成"有任意一个完成或超时就返回"。

### 2.3 两者对比

把前面的差异集中成一张表，便于查阅。

| 维度 | `asyncio.gather` | `asyncio.wait` |
|---|---|---|
| 参数形式 | `*aws` 位置展开 | `aws` 单个可迭代对象 |
| 参数类型 | 协程/Task/Future 均可，协程自动包 Task | 推荐 Task；传协程已废弃 |
| 返回值 | Future，`await` 得 `list`，按输入顺序 | `(done, pending)` 两个 `set[Task]` |
| 结果获取 | 直接给，元素是返回值 | 不给，自己 `task.result()` |
| 顺序保证 | 严格按输入顺序（核心特性） | 无，集合无序 |
| 异常处理（默认） | 任一异常立即向上抛，结果列表丢失 | 不抛异常，异常存在 Task 上，`return_when=FIRST_EXCEPTION` 控制返回时机 |
| 容错选项 | `return_exceptions=True` 把异常当结果元素 | 无对应开关，配合 `FIRST_EXCEPTION` 或自己遍历 `done` 取异常 |
| 完成时机控制 | 仅"全部完成" | `ALL_COMPLETED` / `FIRST_COMPLETED` / `FIRST_EXCEPTION` |
| 超时 | 无原生 timeout 参数（3.11+ 可包 `asyncio.timeout`） | 原生 `timeout` 参数 |
| 取消传播 | 取消聚合 Future 传播给所有子任务 | 不传播；需自己取消 `pending` |
| 典型场景 | 都要结果、按序组装 | 竞速、超时截断、出错即停 |

**怎么选**

一句话决策：

- "我都要结果，按输入顺序给我" → `gather`。
- "我只要最快的 / 我要超时 / 出错就停" → `wait`。
- "我要批量跑，但允许个别失败不影响收尾" → `gather(..., return_exceptions=True)`。
- "我要在事件循环级统一超时" → 3.11+ 用 `asyncio.timeout` 包 `gather`，比手写 `wait + timeout + 取消` 更省心。

**容易踩的点：把 wait 当 gather 用**

```python
# 反例:用 wait 却想要顺序结果,但又没自己取
async def main():
    coros = [fetch("A", 0.5), fetch("B", 0.2)]
    done, pending = await asyncio.wait(coros)  # 协程直接传,会有 DeprecationWarning
    print(done)  # 一堆 Task 对象,不是结果
```

这里 `done` 是 Task 集合，不是结果字符串。要结果得 `.result()`，要顺序得自己按原始列表取。如果你的诉求就是"按序结果"，直接用 gather，别绕路。

### 2.4 gather 与 wait 的常见组合

把 gather 和 wait 拼起来能解决一些单独用都不顺手的需求。

**组合一：wait 做超时，gather 收结果**

需要"带超时的批量请求，超时后取消所有，已完成的按序收结果"。3.11+ 直接 `asyncio.timeout` 包 gather 最简；旧版本可用 wait 做超时，再对完成集 gather 取结果。

```python
import asyncio

async def fetch(name: str, delay: float) -> str:
    await asyncio.sleep(delay)
    return f"{name}"

async def main():
    tasks = [asyncio.create_task(fetch(n, d)) for n, d in [("a", 0.3), ("b", 0.8), ("c", 1.5)]]
    done, pending = await asyncio.wait(tasks, timeout=1.0)
    # 对完成的按原始顺序取结果(保证顺序)
    done_results = [t.result() for t in tasks if t in done]
    print("完成结果:", done_results)
    for t in pending:
        t.cancel()
    await asyncio.gather(*pending, return_exceptions=True)

asyncio.run(main())
# 输出：完成结果: ['a', 'b']
```

`[t.result() for t in tasks if t in done]` 这一行是关键——按原始 `tasks` 列表遍历，再过滤出在 `done` 集合里的，保留了输入顺序。这是 wait 场景下"想要顺序结果"的通用 patch。注意 `t in done` 是集合查找，O(1)，不会因为量大而退化。

**组合二：gather 收集 + try/except 提前止损**

不想要 `return_exceptions`（想一个挂了立刻停），但又想自己捕获并取消其余——手动包 try/except，对返回的 gather Future 做取消。

```python
import asyncio

async def job(n: int) -> int:
    await asyncio.sleep(0.1 * n)
    if n == 2:
        raise ValueError(f"bad {n}")
    return n

async def main():
    g = asyncio.gather(job(1), job(2), job(3))
    try:
        results = await g
    except ValueError as e:
        print("提前止损:", e)
        g.cancel()  # 取消整个聚合,传播给子任务
        return
    print(results)

asyncio.run(main())
# 输出：提前止损: bad 2
```

`g.cancel()` 在 except 里触发聚合 Future 取消，传播给子 Task。这是 3.11 前"想要 TaskGroup 那种异常即取消"语义的手写版本。注意 3.11+ 直接用 TaskGroup 更省心，且异常以 `ExceptionGroup` 包装，处理更规整。

**组合三：分批 gather 控内存**

awaitable 数量极大时，一次性 gather 全部会把所有结果攒在内存里。可以分批跑，每批 gather 后立即处理并释放。

```python
import asyncio

async def process(item: int) -> int:
    await asyncio.sleep(0.01)
    return item * item

async def main():
    items = list(range(50))
    batch = 10
    total = 0
    for i in range(0, len(items), batch):
        chunk = items[i:i + batch]
        # 每批 gather,结果处理完就释放,不堆积
        results = await asyncio.gather(*[process(x) for x in chunk])
        total += sum(results)
    print("总和:", total)

asyncio.run(main())
# 输出：总和: 40425
```

分批 gather 牺牲了一点总耗时（每批内部并发，批次间串行），换来稳定的内存占用。对"万级任务、单结果小"的场景很实用。如果单任务结果很大，还要结合 Semaphore 限制并发，避免批内瞬时资源峰值。

### 2.5 与 asyncio.TaskGroup 的关系（3.11+）

3.11 引入了 `asyncio.TaskGroup`，它不是 gather/wait 的替代，而是"结构化并发"的补充。

```python
import asyncio

async def fetch(name: str, delay: float) -> str:
    await asyncio.sleep(delay)
    return f"{name}@{delay}s"

async def main():
    async with asyncio.TaskGroup() as tg:
        t1 = tg.create_task(fetch("A", 0.5))
        t2 = tg.create_task(fetch("B", 0.2))
        t3 = tg.create_task(fetch("C", 0.1))
    # 离开 with 块时保证三个都完成;任一异常会取消其余并向上抛 ExceptionGroup
    print(t1.result(), t2.result(), t3.result())

asyncio.run(main())
# 输出：A@0.5s B@0.2s C@0.1s
```

TaskGroup 的语义是：进入块里建任务，离开块时**保证全部完成**；任一任务抛异常，会**自动取消其余**并抛出一个 `ExceptionGroup`。它解决了 gather 默认模式"一个挂了其余还在跑"的泄漏痛点，但代价是异常以 `ExceptionGroup` 形式抛（需要 `except*` 语法或解包处理）。

选择上：

- 需要结构化、自动取消、强一致错误处理 → TaskGroup。
- 需要按序结果列表、容错（`return_exceptions`）→ gather。
- 需要竞速/超时 → wait 或 `asyncio.timeout + gather`。

---

## 3. 最佳实践

**先建 Task 再 gather，避免协程对象提前被忘记**

`gather` 虽然接受裸协程并自动包 Task，但在需要"外部引用某个子任务以便单独取消/查询"时，应显式 `create_task`。

```python
# 推荐:需要单独控制某任务时,显式建 Task
t_c = asyncio.create_task(fetch("C", 0.1))
results = await asyncio.gather(fetch("A", 0.5), fetch("B", 0.2), t_c)
# 后续可单独查 t_c 是否完成/取消
```

不推荐写法：把一堆裸协程散在 gather 里，事后想取消其中一个是拿不到句柄的。

**gather 的异常默认会丢结果，批处理场景用 return_exceptions=True**

```python
# 不推荐:批处理用默认 return_exceptions=False,一行失败全批结果丢失
results = await asyncio.gather(*[process(row) for row in rows])

# 推荐:批处理场景用 return_exceptions=True,失败行单独处理
results = await asyncio.gather(*[process(row) for row in rows], return_exceptions=True)
for row, r in zip(rows, results):
    if isinstance(r, Exception):
        log.error("处理 %s 失败: %r", row, r)
        continue
    write(row, r)
```

原因：批处理的核心诉求是"尽可能多成功"，个别失败不应让整批结果不可见。`return_exceptions=True` 让你拿到全貌（成功值与异常混在列表里，按输入顺序），失败行可重试/记错/跳过。

**wait 一定要处理 pending，否则协程泄漏**

```python
# 反例:不取消 pending,循环里留下一堆跑着的任务
done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
use(done)

# 推荐:取消 pending 并等它们收尾
done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
use(done)
for t in pending:
    t.cancel()
await asyncio.gather(*pending, return_exceptions=True)  # 等取消传播完成
```

不取消的后果：那些 Task 还在事件循环的调度队列里，完成时若抛异常还会产生"Task exception was never retrieved"告警；更严重的是它们的副作用（写库、发请求）会继续发生。`gather(*pending, return_exceptions=True)` 这一行的作用是让每个被取消的 Task 有机会跑完 `except CancelledError` 分支，避免告警。

**用 Task.get_name() 给任务命名，方便排查**

```python
# 推荐:命名任务,异常日志里能直接看到是哪个
tasks = [asyncio.create_task(fetch(url), name=f"fetch-{url}") for url in urls]
done, pending = await asyncio.wait(tasks, timeout=5.0)
for t in pending:
    log.warning("超时未完成: %s", t.get_name())
    t.cancel()
```

不命名时日志只能看到 `Task-7`，排查要在脑子里对应回是哪个 URL。

**超时场景：3.11+ 优先用 asyncio.timeout 包 gather**

```python
# 推荐(3.11+):原超时统一用 asyncio.timeout,语义清晰且自动取消
async with asyncio.timeout(1.0):
    results = await asyncio.gather(*tasks)

# 旧写法:wait + timeout + 手动取消,代码更长且容易漏取消
done, pending = await asyncio.wait(tasks, timeout=1.0)
for t in pending:
    t.cancel()
await asyncio.gather(*pending, return_exceptions=True)
```

`asyncio.timeout` 会在超时时把当前任务取消，gather 收到取消会传播给所有子任务——行为上等于统一超时+自动取消，比手写 wait 收尾更不容易出错。但如果你要的不是"全部超时"而是"谁先完成/谁先异常"，wait 的 `FIRST_COMPLETED` / `FIRST_EXCEPTION` 仍是更直接的工具。

**用 Semaphore 限制 gather 的并发数**

gather 会把所有 awaitable 一次性提交给事件循环，如果 awaitable 数量极大（比如 10000 个并发 HTTP 请求），会瞬间打爆下游或耗尽内存/连接池。用 `asyncio.Semaphore` 包装每个任务，限制真正在跑的数量。

```python
import asyncio

async def fetch(url: str) -> str:
    await asyncio.sleep(0.1)  # 模拟 IO
    return f"ok:{url}"

async def bounded_fetch(sem: asyncio.Semaphore, url: str) -> str:
    async with sem:  # 同时最多 N 个进入
        return await fetch(url)

async def main():
    urls = [f"u{i}" for i in range(100)]
    sem = asyncio.Semaphore(10)  # 限并发 10
    # 100 个任务,gather 一口气建全部 Task,但真跑同时只有 10 个
    results = await asyncio.gather(*[bounded_fetch(sem, u) for u in urls])
    print("完成数:", len(results), "首个:", results[0])

asyncio.run(main())
# 输出：完成数: 100 首个: ok:u0
```

不推荐写法：直接 `gather(*[fetch(u) for u in urls])`，100 个任务同时打出去，可能触发下游限流或把本地连接池耗尽。Semaphore 是"批 submit、控并发"的标准手段，配合 gather 能在保留顺序保证的同时控制资源压力。

**避免在 gather 里混用"我想要顺序"和"我想要容错"的歧义**

```python
# 歧义:return_exceptions=True 时,异常作为元素进列表
results = await asyncio.gather(a(), b(), c(), return_exceptions=True)
# 这里 results[1] 可能是值,也可能是异常对象;下游必须 isinstance 判断
x, y, z = results  # 直接解包是危险的,y 可能是 ValueError
```

解包前必须判断，否则下游拿一个异常对象当值用会再炸一次。

**wait 的 ALL_COMPLETED 不等于"忽略异常"**

```python
# 误区:以为 wait(ALL_COMPLETED) 会吞异常
done, pending = await asyncio.wait(tasks)  # ALL_COMPLETED
# 如果某个 Task 抛了异常,异常留在 Task 上,wait 不抛,但:
for t in done:
    t.result()  # 这里会抛!
```

wait 永远不主动抛子任务异常。异常要么你主动 `t.exception()` / `t.result()` 触发，要么循环在回收 Task 时打印 "Task exception was never retrieved"。所以 `ALL_COMPLETED` 后必须遍历 `done` 取异常，否则就是埋雷。

**gather 不要传协程又传同一个 Task 两次**

```python
# 反例:同一个 Task 被两次 gather,gather 内部会建两个引用,行为混乱
t = asyncio.create_task(worker())
await asyncio.gather(t, t)
```

Task 是有状态对象，重复传给 gather 不是"跑两次"，而是"等同一个 Task 两次"，虽然能返回但语义混乱且容易在取消时出意外。要"跑两次"请建两个 Task。

**wait 的 aws 必须是非空**

```python
# 反例:空集合传给 wait 会报错
await asyncio.wait([])  # ValueError: No awaitables given
```

gather 传空则返回空列表 `[]`，wait 直接 ValueError。批量动态构造任务列表时要先判空。

---

## 4. 原理

这一章讲 gather 与 wait 在事件循环里到底怎么把多个 awaitable 聚合成一个可 `await` 的整体，以及为什么它们的"结果顺序""异常处理""完成时机"会呈现前文看到的差异。两者在底层都依赖事件循环对 Task 的调度与回调机制，差异主要在"聚合 Future 怎么组装结果"和"按什么条件 resolve"这两条路径上。

### 4.1 事件循环里的 Task 与回调

先统一前提。asyncio 的并发执行单位是 Task。一个协程被 `asyncio.create_task(coro)` 或 `asyncio.ensure_future(coro)` 包装后，就成为 Task，被事件循环调度。Task 本身是 Future 的子类，具有：

- `_result`：完成后存结果。
- `_exception`：完成后存异常（若有）。
- `_callbacks`：完成回调列表。Task 完成时（无论正常返回还是抛异常），事件循环会在稍后的回调轮次里调用这些回调，把 Task 自身作为参数传给回调。

`Future.add_done_callback(fn)` 用来注册"我完成时调 fn"。这是 gather/wait 聚合的基础：**它们给每个子 awaitable 注册一个完成回调，子任务一完成就通知聚合方**。

### 4.2 gather 的内部机制

`asyncio.gather(*aws, return_exceptions=False)` 的实现（CPython `Lib/asyncio/tasks.py` 里的 `_gather` 相关逻辑）大致是：

1. 建一个聚合 Future，类型是 `_GatheringFuture`（Future 子类）。这个 Future 就是 `gather(...)` 的返回值，也是你 `await` 的对象。
2. 把每个传入的 awaitable 用 `ensure_future` 包装成 Task/Future。如果传入的是裸协程，`ensure_future` 内部调用 `create_task` 把它变成 Task；如果是已是 Task/Future，直接用。这一步解释了"gather 接受裸协程并能跑"的现象——协程是在 gather 内部被包装成 Task 才被调度的。
3. 为每个子 Task 注册一个完成回调 `_done_callback(index, task)`。`index` 是这个 Task 在输入列表里的位置。回调里做两件事：把 `task` 的结果/异常按 `index` 存进聚合方维护的结果数组；判断"是否所有都完成或满足异常条件"，满足就 resolve 聚合 Future。
4. 维护一个计数器 `nfinished`，每有一个子 Task 完成就 +1。

**结果按输入顺序的来源**

聚合方有一个固定大小的结果数组 `_results`，长度等于输入 awaitable 个数。回调 `_done_callback(index, task)` 拿到的 `index` 是**输入时的位置**，存结果时写 `self._results[index] = task.result()`。所以无论哪个先完成，写到的都是它当初的位置——这保证了返回列表的顺序严格等于输入顺序。`nfinished == ntasks` 时，把这个有序数组作为结果 `set_result` 到聚合 Future 上，`await gather(...)` 醒来拿到这个列表。

**异常路径一：return_exceptions=False（默认）**

任一子 Task 抛异常时，回调检测到 `task` 有 `_exception`，且 `return_exceptions` 为 `False`，会直接把该异常 `set_exception` 到聚合 Future 上并标记完成。聚合 Future 一旦有异常，`await` 立即抛出该异常——这就是"任一异常立即向上抛"的来源。

此时其它子 Task **没有被 gather 主动取消**（这是历史行为）。它们仍在事件循环里跑，跑完的结果无人在乎（聚合 Future 已经 resolve 异常，不会再组装）。它们的回调照常被调用，但聚合方已经"完成"，回调里的检查会被 bypass。所以默认模式下一个异常会让"其它任务的结果"从外部看丢失；而任务本身可能继续完成并产生副作用。理解这一点就能解释为什么批处理要 `return_exceptions=True`，以及为什么 3.11 的 TaskGroup 要引入"异常即取消其余"的强约束。

**异常路径二：return_exceptions=True**

回调检测到 `task` 有异常时，不 `set_exception`，而是把异常对象本身作为结果存到 `_results[index]`。计数器照常 +1。只有当所有子 Task 都完成（`nfinished == ntasks`），才把含有异常对象的 `_results` 数组 `set_result` 到聚合 Future。`await` 拿到的是一个"值和异常混排、按输入顺序"的列表。这解释了为什么 `return_exceptions=True` 时"异常不抛、作为元素返回、位置准确"。

**取消传播**

聚合 Future 被 `cancel()` 时，`_GatheringFuture` 重写了 cancel 行为：遍历所有子 Task，对每个还没完成的调 `cancel()`。子 Task 收到取消会抛 `CancelledError`，回调照常触发，但因为聚合方自己已被取消，不再组装结果。这是"取消 gather 等于广播取消子任务"的实现来源。

**为什么 gather 返回的是 Future 而不是直接是 list**

因为 gather 是"非阻塞"构造——你调 `gather(...)` 时它立刻返回一个 Future 句柄，子 Task 才开始被调度并发跑。只有 `await` 那个 Future 才会挂起当前协程直到聚合完成。如果把"启动+收集"做成同步返回 list，就没法并发了——必须一次性返回一个"将来会有结果"的句柄，也就是 Future。

### 4.3 wait 的内部机制

`asyncio.wait(aws, *, return_when, timeout)` 的实现大致是：

1. 把 `aws` 里的每个 awaitable 用 `ensure_future` 包装成 Task/Future（与 gather 同样的包装）。历史上 wait 也接受裸协程，但 3.8+ 不推荐，因为 wait 不会把协程对象的生命周期管理交给调用方，容易泄漏；传 Task 才能在外部持有句柄用于取消。
2. 建一个内部 Future（`outer`），作为 `await wait(...)` 实际等待的对象。
3. 为每个子 Task 注册回调 `_on_completion(t)`。回调里维护一个 `counter`（已完成数）和 `dirty` 标志。
4. 根据 `return_when` 在回调里判断"是否该 resolve outer"：
   - `ALL_COMPLETED`：`counter == len(aws)` 时 resolve。
   - `FIRST_COMPLETED`：第一个完成（即 `counter == 1`）就 resolve。
   - `FIRST_EXCEPTION`：第一个抛异常就 resolve；若全部成功，退化为 `ALL_COMPLETED`。
5. resolve 时，把当前已完成的 Task 收集到 `done` 集合，未完成的收集到 `pending` 集合，把 `(done, pending)` 作为 outer 的结果 `set_result`。
6. `timeout` 通过 `call_later` 注册一个定时器：到点即 resolve outer（不管 `return_when` 条件是否达成）。此时 `done`/`pending` 是"超时那一刻的快照"。定时器在 outer 提前完成时（条件先满足）会被取消，避免悬挂。

**为什么 wait 给集合而不给结果**

`done`/`pending` 是 `set[Task]`，无序。wait 的设计意图是"我告诉你哪些完成了、哪些没，至于结果你自己取"——这样调用方能灵活决定：取结果用 `.result()`，自己判断异常用 `.exception()`，取消未完成的用 `.cancel()`。如果 wait 像 gather 那样直接给列表，就丧失了"对 pending 做处理"的能力（列表里塞异常/未完成占位会让语义混乱）。集合+自己取是更底层的接口形态，代价是调用方要写更多代码。

**return_when 的判断时机**

`FIRST_COMPLETED` 在第一个子 Task 完成的回调里立即 resolve outer，所以 `pending` 里包含所有其余（不管它们跑得多快）。`FIRST_EXCEPTION` 在每个完成回调里检查"这次完成是因为异常吗"，是就立即 resolve，否则继续等。`ALL_COMPLETED` 必须 counter 达到总数才 resolve。这解释了为什么 `FIRST_EXCEPTION` 在"全部成功"时与 `ALL_COMPLETED` 行为一致——没有异常触发提前 resolve，只能等全部完成。

**timeout 的实现**

`loop.call_later(timeout, _on_timeout)` 注册定时器回调。`_on_timeout` 触发时，把当前的 done/pending 快照作为结果 resolve outer，并清理子 Task 的回调（避免后续完成还触发已经无用的回调）。如果 outer 在 timeout 之前已 resolve（`return_when` 先满足），定时器会被 `timer.cancel()`。timeout 不会自动取消 pending 里的任务——它只是让 `await wait(...)` 醒来。**取消 pending 是调用方的责任**，这是 wait 与"超时即取消"直觉的落差点，也是最佳实践里反复强调的原因。

### 4.4 两者的同与异

**相同**

- 都通过 `ensure_future` 把 awaitable 包装成 Task，本质都依赖事件循环对 Task 的调度。
- 都通过给子 Task 注册完成回调来感知完成，都用一个内部/聚合 Future 作为 `await` 的对象。
- 都不"自己跑"协程——协程的执行始终由事件循环驱动，gather/wait 只做"等待与聚合"。

**差异**

- **结果组装**：gather 维护有序数组，按 index 存，最终给列表；wait 只分桶，给集合。
- **异常路径**：gather 默认把首个异常立即 `set_exception` 到聚合 Future（向上抛），`return_exceptions=True` 改为把异常存数组；wait 永不主动抛子任务异常，异常留在 Task 上，靠 `return_when=FIRST_EXCEPTION` 控制返回时机。
- **完成时机**：gather 只有"全部完成"（或首个异常）一种；wait 有三种 `return_when`。
- **超时**：gather 无原生 timeout（需外部 `asyncio.timeout`）；wait 有原生 timeout，由 `call_later` 实现。
- **取消责任**：gather 默认异常模式下不取消其余子 Task（历史行为）；wait 完全不碰 pending 的取消，交给调用方。两者"取消其余"都需要调用方主动做，但 gather 的聚合 Future 被 cancel 时会传播，wait 不会。
- **输出形式**：gather 给值列表（可直接用）；wait 给 Task 集合（必须二次 `.result()`）。

理解了这六点差异，就能在任何场景下判断该用哪个：要"按序值列表"用 gather；要"任意时机控制+集合分桶"用 wait；要"统一超时自动取消"用 `asyncio.timeout` 包 gather（3.11+）；要"强一致结构化并发"用 TaskGroup。

### 4.5 一个完整的回调链路示例

把前几节串起来，看一个"3 个任务并发用 gather，其中一个抛异常"的完整回调流向，帮助建立"gather 在循环里到底发生了什么"的直观图景。

```python
import asyncio

async def good_a():
    await asyncio.sleep(0.3)
    return "A"

async def good_b():
    await asyncio.sleep(0.2)
    return "B"

async def bad_c():
    await asyncio.sleep(0.1)
    raise RuntimeError("C 失败")

async def main():
    try:
        await asyncio.gather(good_a(), good_b(), bad_c())
    except RuntimeError as e:
        print("收到:", e)

asyncio.run(main())
# 输出：收到: C 失败
```

按时间线分解（return_exceptions=False 默认）：

1. t=0：`gather` 调用。内部 `ensure_future` 把三个裸协程包成三个 Task，它们进入事件循环调度。聚合 Future `_G` 被创建并返回。`_results = [None, None, None]`，`nfinished = 0`。
2. t=0：给每个 Task 注册 `_done_callback(index, task)`。三个回调各持自己的 index（0、1、2）。
3. t=0.1：`bad_c`（index=2）完成，抛 RuntimeError。事件循环在下一个回调轮次调用 `_done_callback(2, task_c)`。回调检测到 `return_exceptions=False` 且 task_c 有异常，直接 `self._outer.set_exception(RuntimeError(...))`——聚合 Future `_G` 被标记为异常完成。此时 `nfinished` 仍是 0（异常路径不走"正常计数"），`_results` 没被填。
4. t=0.1：`await asyncio.gather(...)` 在 `main` 里因 `_G` 有异常而醒来，抛 RuntimeError，被 `except` 捕获。`good_a`、`good_b` 仍在跑（它们的 sleep 还没到）。
5. t=0.2：`good_b` 完成。它的 `_done_callback(1, task_b)` 被调用。但此时聚合 Future `_G` 已经 done（异常完成），回调里的判断 `if self._outer.done(): return` 会短路返回——`_results` 根本不写入，结果 "B" 被丢弃。这就是"异常后其余结果丢失"的实现层面。
6. t=0.3：`good_a` 完成同理，结果 "A" 被丢弃。
7. 事件循环结束。`good_a`、`good_b` 这两个 Task 已经正常完成，没有异常，所以不会产生 "Task exception was never retrieved" 告警——但它们的结果对外部不可见。

换 `return_exceptions=True` 后，t=0.1 那一步不同：回调检测到 `return_exceptions=True`，把 `RuntimeError` 对象写进 `_results[2]`，`nfinished` 变 1，不 set_exception。t=0.2 写 `_results[1] = "B"`，nfinished=2。t=0.3 写 `_results[0] = "A"`，nfinished=3==ntasks，`_G.set_result(["A", "B", RuntimeError])`。`main` 拿到列表，不抛。两条路径的差异完全在回调分支上。

这个时间线解释了三个关键现象：为什么异常模式下其余结果"丢失"（回调短路）、为什么 `return_exceptions=True` 下顺序与位置准确（按 index 写数组）、以及为什么"其余任务还在跑"（它们不在 gather 的管辖下被取消，只是结果无人收集）。

### 4.6 wait 回调链路的一瞥

同样 t=0.1 抛异常的三个任务，用 `wait(return_when=FIRST_EXCEPTION)` 看流向。

```python
import asyncio

async def main():
    tasks = [asyncio.create_task(c) for c in (good_a(), good_b(), bad_c())]
    done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_EXCEPTION)
    print("done:", len(done), "pending:", len(pending))

asyncio.run(main())
```

1. t=0：三个 Task 已建（外部 create_task）。wait 不再 ensure_future（已是 Task）。建内部 `outer` Future，给每个 Task 注册 `_on_completion`。`counter = 0`，`return_when = FIRST_EXCEPTION`。
2. t=0.1：`bad_c` 完成，抛异常。`_on_completion` 被调用：检测到 task 有异常且 `return_when == FIRST_EXCEPTION`，立即 resolve outer。把已完成的 `{task_c}` 存入 done，其余 `{task_a, task_b}` 存入 pending。`set_result((done, pending))`。
3. t=0.1：`await wait(...)` 醒来，拿到二元组。此时 `good_a`、`good_b` 在 pending，**没有异常留在它们身上**（它们还没完成）。wait 不取消它们，循环继续直到它们完成。如果 main 不主动取消，它们会跑到 t=0.2、t=0.3 各自完成，结果无人取——但因为不是异常完成，不会有告警。

对比 gather：wait 的异常**不抛给调用方**，而是通过"提前 resolve"+"把异常 Task 放进 done 让你自己 `.exception()` 取"的方式暴露。这条路径解释了为什么 wait 永不主动抛、为什么调用方必须自己处理 done 里的异常、以及为什么 pending 一定要手动取消（否则会继续跑完，虽然不报错但浪费资源）。

理解了这些底层链路，在排查"gather 为什么结果对不上""wait 为什么不抛异常却有余下任务在跑""超时后为什么还有日志在打"这类问题时，就能直接定位到"回调分支""outer 何时 set_result""是否调用了 cancel"这几个环节，而不会停在"asyncio 行为诡异"的表象。

---

## 5. 总结

**本文内容要点**

- `asyncio.gather(*aws, return_exceptions=False)`：并发跑多个 awaitable，返回 Future，`await` 得按输入顺序的结果列表；协程会被自动包装为 Task。
- gather 默认下任一异常立即向上抛，其余子任务不会被自动取消、结果丢失；`return_exceptions=True` 把异常作为列表元素返回，适合批处理容错。
- gather 的顺序保证来自内部按输入 index 存结果的有序数组，与完成先后无关。
- 取消 gather 的聚合 Future 会传播取消给所有子任务。
- `asyncio.wait(aws, *, return_when=ALL_COMPLETED, timeout=None)`：返回 `(done, pending)` 两个 Task 集合，不直接给结果。
- `return_when` 三档：`FIRST_COMPLETED`（竞速）、`FIRST_EXCEPTION`（出错即停）、`ALL_COMPLETED`（全等，默认）。
- `timeout` 让 wait 在指定秒数返回快照，但不自动取消 pending——取消是调用方责任，需配合 `cancel()` + `gather(*pending, return_exceptions=True)` 收尾。
- wait 永不主动抛子任务异常，异常留在 Task 上，需自己 `result()`/`exception()` 取，否则有回收告警。
- 3.11+ 的 `asyncio.timeout` 可以包 gather 实现统一超时+自动取消，比手写 wait+timeout 更简洁；`TaskGroup` 提供结构化并发与"异常即取消其余"的强约束。
- gather 适合"都要结果按序"，wait 适合"谁先好/超时控制/出错即停"。

**读完本文你应能掌握**

- 能说明 `gather` 的 `return_exceptions` 两种取值下异常处理路径的差异，并正确为批处理场景选择 `return_exceptions=True`。
- 能说明 `gather` 结果顺序保证的来源（按输入 index 存的有序数组），并在解包 `a, b, c = await gather(...)` 时确信顺序。
- 能用 `wait` 的 `FIRST_COMPLETED` 实现竞速、用 `timeout` 实现超时截断、用 `FIRST_EXCEPTION` 实现出错即停，并正确取消 pending、等待收尾避免协程泄漏。
- 能逐条解释 gather 与 wait 在结果组装、异常路径、完成时机、超时、取消责任、输出形式六个维度上的差异，并据此为给定场景选型。
- 能用 `asyncio.timeout`（3.11+）和 `TaskGroup` 替代部分手写 wait 逻辑，写出更简洁、更不易泄漏的并发代码。