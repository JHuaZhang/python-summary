---
group:
  title: 【18】异步协程
  order: 18
order: 4
title: asyncio.run 启动事件循环
nav:
  title: Python
  order: 1
---

## 1. 介绍

### 1.1 什么是 asyncio.run

asyncio 是 Python 的异步编程标准库，它的核心是一个"事件循环（event loop）"——一个不断轮询、调度协程和回调的运行时引擎。写了 `async def` 协程只是定义了"要做什么"，真正把协程跑起来，需要一个入口去启动事件循环。`asyncio.run()` 就是 Python 3.7 引入的、官方推荐的"启动入口"。

`asyncio.run(main_coro)` 接收一个协程对象（通常是 `main()` 协程），做三件事：创建一个新的事件循环、把 main 协程跑完、关闭循环。它是程序顶层的调度器，负责让整个异步程序从"静态定义"变成"真正执行"。

在 `asyncio.run` 出现之前，开发者要手动 `loop = asyncio.get_event_loop()`、`loop.run_until_complete(coro)`、`loop.close()`，容易遗漏清理步骤，也容易在一个线程里复用旧循环导致状态混乱。`asyncio.run` 把这套流程封装成一个不漏清理的入口函数，是现代 asyncio 程序的标准起手式。

### 1.2 基本语法与最小用法

签名非常简单：

```python
asyncio.run(coro, *, debug=False)
```

- `coro`：一个协程对象。注意传的是 `main()`（调用后的协程对象），不是 `main`（函数本身）。
- `debug`：是否开启调试模式，默认 `False`，详见 2.4 节。
- 返回值：main 协程的返回值。

最小可运行示例：

```python
import asyncio

async def main():
    print("hello asyncio")

# 传入 main() 协程对象，而非 main 函数本身
asyncio.run(main())
# 输出：
# hello asyncio
```

这就是最标准的"async def main 与 asyncio.run(main())"模式：把程序逻辑写在 `main` 协程里，顶层用 `asyncio.run` 启动。能把协程跑起来，就这一行。

---

## 2. 核心内容

### 2.1 asyncio.run 的标准模式：跑多个协程

真实的异步程序不会只有一个 `print`，`main` 通常作为"调度者"用 `asyncio.gather` / `asyncio.create_task` 编排多个子协程。`asyncio.run` 只负责启动这个总调度者，子协程的并发由 `main` 内部组织。

```python
import asyncio
import time

async def fetch_user(user_id):
    await asyncio.sleep(0.3)  # 模拟网络 I/O
    return {"id": user_id, "name": f"用户{user_id}"}

async def fetch_order(order_id):
    await asyncio.sleep(0.4)  # 模拟网络 I/O
    return {"order_id": order_id, "amount": 99.0}

async def main():
    # 在 main 内部并发调度两个子协程
    start = time.perf_counter()
    user, order = await asyncio.gather(
        fetch_user(1),
        fetch_order(101),
    )
    elapsed = time.perf_counter() - start
    print(f"用户信息: {user}")
    print(f"订单信息: {order}")
    print(f"总耗时: {elapsed:.2f}s")  # 并发执行应接近 0.4s 而非 0.7s
    return "done"

# 顶层入口：main 协程结束后，run 会自动关闭循环
result = asyncio.run(main())
print(f"返回值: {result}")
# 输出：
# 用户信息: {'id': 1, 'name': '用户1'}
# 订单信息: {'order_id': 101, 'amount': 99.0}
# 总耗时: 0.40s
# 返回值: done
```

这里要理解一个关键分工：`asyncio.run` 只管"启动循环、跑完 main、关闭循环"这一层；真正编排并发的是 `main` 内部的 `asyncio.gather`。一个程序通常只有一个 `asyncio.run` 调用，位于脚本最顶层；它内部可以派生成任意复杂的协程树。

**为什么总耗时是 0.4s 而不是 0.7s**

`asyncio.gather` 会把两个协程交给事件循环并发调度。当 `fetch_user` 执行到 `await asyncio.sleep(0.3)` 挂起时，循环立刻切到 `fetch_order` 去执行；两个 sleep 是并发的，所以总耗时取较长的那个约 0.4s。这正是 `asyncio.run` 跑起来的事件循环在干的事：不断在就绪的协程之间切换。

**并发 vs 串行的对比**

如果把上面 `gather` 改成顺序 `await`，总耗时就是累加：

```python
import asyncio
import time

async def fetch_user(user_id):
    await asyncio.sleep(0.3)
    return {"id": user_id, "name": f"用户{user_id}"}

async def fetch_order(order_id):
    await asyncio.sleep(0.4)
    return {"order_id": order_id, "amount": 99.0}

async def main():
    start = time.perf_counter()
    # 串行：先 user 后 order，耗时累加
    user = await fetch_user(1)
    order = await fetch_order(101)
    elapsed = time.perf_counter() - start
    print(f"串行总耗时: {elapsed:.2f}s")  # 接近 0.7s

asyncio.run(main())
# 输出：
# 串行总耗时: 0.70s
```

同样是 `asyncio.run` 启动，串行和并发的差别完全由 main 内部组织方式决定。`asyncio.run` 只提供一个能并发调度的循环，用不用并发取决于你在 main 里怎么写。

**用 create_task 自己调度**

除了 `gather`，也可以用 `asyncio.create_task` 手动派发任务，更灵活地控制何时收集结果：

```python
import asyncio
import time

async def fetch_user(user_id):
    await asyncio.sleep(0.3)
    return {"id": user_id, "name": f"用户{user_id}"}

async def fetch_order(order_id):
    await asyncio.sleep(0.4)
    return {"order_id": order_id, "amount": 99.0}

async def main():
    start = time.perf_counter()
    # 先把协程包装成 Task 提交到循环，立刻拿到 Task 对象
    t_user = asyncio.create_task(fetch_user(1))
    t_order = asyncio.create_task(fetch_order(101))
    # 此处两个 Task 已在循环里并发跑，主协程可以做别的事
    # 最后等它们完成
    user = await t_user
    order = await t_order
    elapsed = time.perf_counter() - start
    print(f"create_task 并发耗时: {elapsed:.2f}s")
    print(user, order)

asyncio.run(main())
# 输出：
# create_task 并发耗时: 0.40s
# {'id': 1, 'name': '用户1'} {'order_id': 101, 'amount': 99.0}
```

`gather` 和 `create_task + await` 在简单场景等价，区别在于 `create_task` 让你能在"提交任务"和"等待结果"之间插入其他逻辑（比如再起一个任务、做一段同步计算），调度更细粒度。无论哪种，都离不开 `asyncio.run` 提供的运行循环。

### 2.2 asyncio.run 的"创建-运行-关闭"一体化流程

`asyncio.run` 不是简单调用一下，它内部有严格的清理流程，保证每次调用后不留残余状态。理解这个流程能解释它的一大堆"为什么不能这样用"的规则。

完整流程是：

1. 在当前线程获取"主循环策略"，创建一个全新的 `SelectorEventLoop`（或 `ProactorEventLoop`，视平台而定）。
2. 把这个新循环设为当前线程的"当前循环"（通过 `events.set_event_loop`）。
3. 调用 `loop.run_until_complete(main)`，驱动 main 协程直到它返回或抛异常。
4. 无论 main 正常返回还是抛异常，进入清理阶段：调用 `loop.run_until_complete(loop.shutdown_asyncgens())` 关闭残留的异步生成器；调用 `loop.run_until_complete(loop.shutdown_default_executor())` 关闭默认线程池执行器。
5. 调用 `loop.close()` 关闭循环，释放底层资源（selector、管道等）。
6. 把当前线程的当前循环设回 `None`（`events.set_event_loop(None)`），避免后续误用已关闭的循环。

这个流程意味着：

- 每次 `asyncio.run` 都**新建并最终关闭**一个循环，不留可复用的循环对象。
- 清理是**无条件**的——即使 main 抛异常，循环也会被关闭，不会泄漏。

对比旧的"手动三连"写法就能看到价值：

```python
import asyncio

# 旧写法：手动创建、运行、关闭，容易漏 close 或漏 shutdown
async def main():
    await asyncio.sleep(0.1)
    return "ok"

loop = asyncio.new_event_loop()
try:
    result = loop.run_until_complete(main())
finally:
    loop.close()
print(result)
# 输出：
# ok
```

这种旧写法在简单场景能用，但一旦 main 里创建了异步生成器或用了 `run_in_executor`，漏掉 `shutdown_asyncgens` / `shutdown_default_executor` 就会留下"Task was destroyed but it is pending!"之类的告警。`asyncio.run` 把这些清理步骤都包进去了，这是它作为推荐入口的核心价值之一。

### 2.3 不能在已有事件循环内调用 asyncio.run

这是 `asyncio.run` 最重要的使用约束，也是初学者最常踩的坑。

**规则**：`asyncio.run` 必须在没有事件循环运行的线程里调用。如果当前线程已经有一个正在运行的事件循环，调 `asyncio.run` 会直接抛 `RuntimeError: asyncio.run() cannot be called from a running event loop`。

原因在原理章详述，这里先记住结论：`asyncio.run` 自己要创建并启动一个循环，而一个线程同一时刻只能有一个循环在跑，所以它不能"套"在已有循环里。

典型踩坑场景是 Jupyter Notebook。Jupyter 内核（IPython）本身就跑在一个事件循环里，所以在 Notebook 的 cell 里直接写 `asyncio.run(main())` 必然报错：

```python
# 在 Jupyter Notebook / IPython 里执行
import asyncio

async def main():
    await asyncio.sleep(0.1)
    return "hello"

asyncio.run(main())
# 输出：
# RuntimeError: asyncio.run() cannot be called from a running event loop
```

**应对方式一：在 Jupyter 里直接 await**

Jupyter 顶层已经支持 `await`，根本不需要 `asyncio.run`，直接 await 协程即可：

```python
# Jupyter cell
import asyncio

async def main():
    await asyncio.sleep(0.1)
    return "hello"

# 不用 asyncio.run，直接 await
result = await main()
print(result)
# 输出：
# hello
```

**应对方式二：把同步框架的入口和异步代码隔离开**

如果是 Web 框架（FastAPI/Quart 等）本身就在循环里跑，异步逻辑应该写成 `async def` 由框架调度，绝不要在请求处理里调 `asyncio.run`。

**应对方式三：确实需要在已有循环的线程里跑独立循环**

这是少见但存在的场景（例如测试代码里）。`asyncio.run` 不支持，需要用 `asyncio.run_coroutine_threadsafe` 把协程丢到另一个线程的循环里执行，而不是嵌套调 `run`。这个属于进阶用法，日常开发应该优先调整结构避免这种需求。

```python
import asyncio
import threading

# 场景：主线程已有循环（比如 Jupyter），想把协程交给独立的循环跑
# 这里用一个后台线程演示 run_coroutine_threadsafe 的用法
def run_in_background_loop():
    """在一个独立线程里建循环并跑协程。"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_forever()

async def background_work(x):
    await asyncio.sleep(0.2)
    return x * 2

# 启动后台循环线程
t = threading.Thread(target=run_in_background_loop, daemon=True)
t.start()

# 拿到后台线程的循环（实际应用里通常在循环线程内自己暴露）
# 这里用全局变量简化演示
bg_loop = None
# 省略获取 bg_loop 的具体方式，主旨是说明用 run_coroutine_threadsafe 提交协程
# future = asyncio.run_coroutine_threadsafe(background_work(21), bg_loop)
# result = future.result(timeout=2)
# print(result)  # 会输出 42
```

上面的示例省略了部分胶水代码，核心是想说明：遇到"已有循环、又想跑独立协程"时，正解是跨线程提交，而不是在当前线程嵌套 `asyncio.run`。绝大多数初学者踩这个坑，其实都不需要这么干——把协程 `await` 进当前循环就够了。

### 2.4 debug 参数：开启调试模式

`asyncio.run(main(), debug=True)` 会在循环上启用调试模式，主要影响：

- 当协程未被 `await` 就被丢弃时（"coroutine was never awaited"），立即告警而非静默忽略。
- `asyncio.sleep` 等回调如果延迟超过 100ms，会打印 `I/O operation took too long` 警告，帮助发现阻塞事件循环的慢调用。
- 把 `loop.slow_callback_duration` 设为 0.1 秒，超过该阈值的回调会告警。

```python
import asyncio
import time

async def slow_task():
    # 同步阻塞 0.5s，debug 模式下会告警"took too long"
    time.sleep(0.5)
    return "done"

async def main():
    await slow_task()

# 开启 debug 模式
asyncio.run(main(), debug=True)
# 输出（含告警，具体行随版本略有差异）：
# <django-like warning> Executing <Task ...> took 0.50 seconds
# done
```

调试模式有性能开销（每个回调都要计时），生产环境不要开，开发排查"为什么我的异步程序卡住"时很有用。

### 2.5 同一线程不应多次调用 asyncio.run

`asyncio.run` 每次 call 都会新建并关闭循环。技术上同一线程连续调用多次是允许的（因为前一次结束时已把当前循环设回 None），但这是反模式：

```python
import asyncio

async def task_a():
    return "a"

async def task_b():
    return "b"

# 连续两次 run：可行但不推荐
r1 = asyncio.run(task_a())
r2 = asyncio.run(task_b())
print(r1, r2)
# 输出：
# a b
```

这种写法为什么不好：两次 `run` 之间无法共享任何异步状态（事件循环、任务、锁都是循环内的资源，循环一关全没了）。如果你的 task_a 创建了一个 `asyncio.Lock` 想给 task_b 用，第二次 run 里那个锁已经失效了。正确做法是把需要协作的协程放进同一个 `main`、在同一个循环里一起跑。

但有一个合法的"多次 run"场景：先后执行两个完全独立的异步任务，且第一个的返回值作为第二个的输入。即便如此，通常也更适合合并成一个 `main` 协程顺序 `await`。

### 2.6 返回值与异常传播

`asyncio.run` 会把 main 协程的返回值原样返回给调用者，main 里未捕获的异常会沿调用栈冒泡到 `asyncio.run` 的调用处（循环仍会被正确关闭）。

```python
import asyncio

async def main():
    await asyncio.sleep(0.01)
    return {"status": "success"}

result = asyncio.run(main())
assert result == {"status": "success"}
print("main 返回值透传:", result)
# 输出：
# main 返回值透传: {'status': 'success'}
```

异常传播：

```python
import asyncio

async def boom():
    await asyncio.sleep(0.01)
    raise ValueError("something went wrong")

async def main():
    await boom()

try:
    asyncio.run(main())
except ValueError as e:
    print(f"捕获到 main 抛出的异常: {e}")
# 输出：
# 捕获到 main 抛出的异常: something went wrong
```

注意：即使 main 抛异常，`asyncio.run` 内部的清理流程（`shutdown_asyncgens`、`close`）依然会执行，不会留下未关闭的循环。这是它比手动 `run_until_complete` 安全的地方。

### 2.7 旧 API 对比：get_event_loop 与 run_until_complete 的历史

在 `asyncio.run` 出现前，启动协程靠 `get_event_loop` + `run_until_complete`。理解旧 API 的坑，能明白为什么官方现在推荐 `asyncio.run`。

**旧 API 的典型写法**：

```python
import asyncio

async def main():
    await asyncio.sleep(0.1)
    return "legacy"

# 旧写法：获取循环、运行、关闭
loop = asyncio.get_event_loop()
try:
    result = loop.run_until_complete(main())
finally:
    loop.close()
print(result)
# 输出：
# legacy
```

**`get_event_loop` 的历史问题**

`asyncio.get_event_loop()` 的行为在不同版本里有微妙变化，是混乱的根源：

- Python 3.10 之前：如果当前线程没有事件循环，`get_event_loop()` 会**自动创建一个新循环**并设为当前循环。这养成了"调一下就有循环"的依赖。
- Python 3.10+：在主线程中，当没有运行中的循环时，`get_event_loop()` 会发出 `DeprecationWarning`，提示未来版本将不再自动创建循环，应改用 `asyncio.run` 或显式 `new_event_loop`。
- Python 3.12+：弃用进一步收紧，没有运行循环时调 `get_event_loop` 在更多场景下直接报错而非默默创建。

这导致大量旧代码升级 Python 版本后突然冒出 `DeprecationWarning: There is no current event loop` 或 `RuntimeError: There is no current event loop in thread 'MainThread'`。

**`get_running_loop` 与 `get_event_loop` 的区别**

这是迁移时必须分清的一对 API：

- `asyncio.get_event_loop()`：获取"当前线程的当前循环"，没有就（旧版本）创建 /（新版本）报错。它既可能在循环运行时调用，也可能在循环没跑时调用，语义模糊。
- `asyncio.get_running_loop()`：只返回**当前正在运行的循环**，如果当前线程没有循环在跑，直接抛 `RuntimeError`。它只能在协程内部（即循环正在运行时）调用，语义明确。

```python
import asyncio

async def main():
    # 在协程内部，循环正在运行
    loop = asyncio.get_running_loop()
    print(f"正在运行的循环: {loop}")
    return loop

# 在协程外部，循环已关闭，get_running_loop 会报错
try:
    asyncio.get_running_loop()
except RuntimeError as e:
    print(f"无运行循环时: {e}")

asyncio.run(main())
# 输出：
# 无运行循环时: no running event loop
# 正在运行的循环: <_UnixSelectorEventLoop ...>
```

迁移原则：在协程内部要拿当前循环，一律用 `get_running_loop`；在顶层要启动协程，一律用 `asyncio.run`。不要再依赖 `get_event_loop` 的自动创建行为。

**`loop.run_until_complete` 仍然有用**

虽然 `asyncio.run` 内部就是用 `run_until_complete` 驱动协程，但 `run_until_complete` 本身在循环已显式创建的场景下（例如测试、嵌套调度）仍是合法 API，没有被弃用。被弃用的是"靠 `get_event_loop` 偷懒拿循环"这套用法，不是 `run_until_complete` 本身。

**迁移对照表**

| 场景 | 旧写法（已不推荐） | 新写法（3.7+） |
|------|-------------------|----------------|
| 顶层启动 main 协程 | `loop = get_event_loop(); loop.run_until_complete(main()); loop.close()` | `asyncio.run(main())` |
| 协程内部拿当前循环 | `asyncio.get_event_loop()` | `asyncio.get_running_loop()` |
| 显式手动创建循环 | `loop = asyncio.new_event_loop(); asyncio.set_event_loop(loop)` | 仍可显式用，但顶层入口优先 `asyncio.run` |
| 在已有循环里跑协程 | `run_until_complete(coro)`（会报错） | `await coro` 或 `asyncio.create_task(coro)` |

### 2.8 一个完整的实战示例：并发抓取多个 URL

把前面几个点合起来，给一个贴近真实场景的 demo——并发请求多个 URL 并汇总。这个例子集中体现 `asyncio.run` 作为入口、`main` 作为调度者、`gather` 并发、异常处理这一整套标准模式。

```python
import asyncio

# 模拟一个异步 HTTP 客户端（真实场景用 aiohttp / httpx）
async def fetch_one(url, delay):
    await asyncio.sleep(delay)  # 模拟网络耗时
    if delay > 0.5:
        raise TimeoutError(f"{url} 超时")
    return f"<html from {url}>"

async def fetch_all(urls):
    # return_exceptions=True：某个抓取失败时 gather 不整体抛
    # 而是把异常对象作为对应位置的结果返回，便于逐个处理
    results = await asyncio.gather(
        *(fetch_one(url, d) for url, d in urls),
        return_exceptions=True,
    )
    ok, fail = [], []
    for (url, d), r in zip(urls, results):
        if isinstance(r, Exception):
            fail.append((url, r))
        else:
            ok.append((url, r))
    return ok, fail

async def main():
    urls = [
        ("https://a.example.com", 0.2),
        ("https://b.example.com", 0.3),
        ("https://c.example.com", 0.6),  # 这条会超时
    ]
    ok, fail = await fetch_all(urls)
    print(f"成功 {len(ok)} 条:")
    for url, body in ok:
        print(f"  {url} -> {body}")
    print(f"失败 {len(fail)} 条:")
    for url, err in fail:
        print(f"  {url} -> {type(err).__name__}: {err}")
    return {"ok": len(ok), "fail": len(fail)}

summary = asyncio.run(main())
print(f"汇总: {summary}")
# 输出：
# 成功 2 条:
#   https://a.example.com -> <html from https://a.example.com>
#   https://b.example.com -> <html from https://b.example.com>
# 失败 1 条:
#   https://c.example.com -> TimeoutError: https://c.example.com 超时
# 汇总: {'ok': 2, 'fail': 1}
```

这个例子值得注意的几点：

- 顶层只有一次 `asyncio.run(main())`，main 内部负责所有调度和汇总，符合"一个脚本一个 run"的原则。
- `gather(..., return_exceptions=True)` 让单个抓取失败不会拖垮整个 group，main 统一做成功/失败分流。这是并发抓取的常见健壮性写法。
- 整个 main 的结果（汇总字典）通过 `asyncio.run` 透传到外层 `summary`，体现返回值透传。
- 如果哪天要把这段搬到 Jupyter 里跑，只把最后一行 `asyncio.run(main())` 改成 `summary = await main()` 即可，主体逻辑一行不动——因为所有异步逻辑都在 main 内部，入口切换无成本。这也是"run 只做入口"设计的好处。

## 3. 最佳实践

**顶层只用一次 asyncio.run**

整个脚本的入口处调一次 `asyncio.run(main())`，所有异步逻辑挂在这个 `main` 下面。不要在脚本的不同位置分别 `asyncio.run`，那意味着你把本该协作的协程拆到了互相隔离的循环里，无法共享异步状态。

推荐：

```python
import asyncio

async def fetch(x): ...
async def save(x): ...

async def main():
    data = await fetch(1)
    await save(data)

if __name__ == "__main__":
    asyncio.run(main())
```

不推荐：

```python
# 两次 run，fetch 和 save 在不同循环里，无法共享连接池等异步资源
data = asyncio.run(fetch(1))
asyncio.run(save(data))
```

**用 if __name__ == "__main__" 包裹入口**

把 `asyncio.run(main())` 放在 `if __name__ == "__main__":` 里，避免模块被 import 时自动启动事件循环。这是 Python 异步脚本的标准骨架。

**不要在异步函数里调 asyncio.run**

`asyncio.run` 是同步入口，它会阻塞当前线程直到 main 完成。在 `async def` 函数里调它一方面会报"already running event loop"错误，另一方面即使能调通也会阻塞循环。异步函数里要并发就用 `asyncio.create_task` 或 `asyncio.gather`，不要用 `run`。

**传协程对象，不要传函数**

`asyncio.run(main())` 而非 `asyncio.run(main)`。前者传的是调用 `main()` 后产生的协程对象，后者传的是函数本身，会报 `TypeError: ... was never got int ...` 之类的错误。这是个低级但高频的错误。

**异常在顶层捕获，循环内用 try 兜底**

`asyncio.run` 会把 main 的异常原样抛出。在脚本顶层用 try/except 处理"全局失败"是合理的；但不要在 main 里到处裸 `raise` 让循环一关了之，关键的资源清理（关闭连接、落盘）应该在协程内部的 try/finally 里做，因为循环关闭后这些异步清理就再没机会执行了。

**Jupyter/IPython 里不要写 asyncio.run**

Jupyter 内核已经在事件循环里运行，直接 `await coro()` 即可，不需要也不应该用 `asyncio.run`。如果一段代码既要在脚本里跑又要在 Notebook 里跑，可以做个适配：

```python
import asyncio

async def main():
    ...

def run_main():
    try:
        # Notebook/已有循环环境：直接 await
        loop = asyncio.get_running_loop()
    except RuntimeError:
        # 脚本环境：无运行循环，用 asyncio.run
        asyncio.run(main())
    else:
        # 有运行循环（Notebook），把 main 作为 task 交给它
        # 在 Notebook 顶层可直接 await main()，这里用 ensure_future 兼容
        asyncio.ensure_future(main())
```

不过这种"两栖"封装只是权宜之计，更干净的做法是脚本里用 `asyncio.run(main())`、Notebook 里直接 `await main()`，两边各写一行入口，主体逻辑共用。

**debug 开发期开，生产期关**

`debug=True` 帮你发现慢回调和未 await 的协程，但有性能开销。开发排查时开，上线关掉。也可以通过设环境变量 `PYTHONASYNCIODEBUG=1` 全局开启，避免改代码。

**不要依赖 asyncio.run 之外的隐式循环**

有些老库会在 import 时调 `get_event_loop` 拿循环，在新 Python 里可能拿到 None 或报错。遇到这类库，要么在 `asyncio.run` 的 main 里先用 `get_running_loop` 确认循环可用再调，要么给这类库显式传一个 loop（如果它支持）。根本上，尽量用不依赖"全局循环"的新版库。

**测试代码里的循环管理**

写异步函数的单元测试时，常见需求是"每个用例跑在一个干净循环上"。不要在每个测试里 `asyncio.run`（虽然能跑），更适合用 `asyncio.IsolatedAsyncioTestCase`（unittest 自带）或 pytest-asyncio 的 `@pytest.mark.asyncio`，它们在底层也是用类似 `asyncio.run` 的机制为每个测试建/拆循环，但接入了测试框架的用例生命周期。手写 `asyncio.run` 做测试入口容易和测试框架的循环管理打架。

```python
import asyncio
import unittest

def add(x, y):
    return x + y  # 纯同步函数，无需异步

async def async_add(x, y):
    await asyncio.sleep(0.01)
    return x + y

class TestCalc(unittest.IsolatedAsyncioTestCase):
    def test_sync_add(self):
        self.assertEqual(add(2, 3), 5)

    # 异步用例：框架自动提供循环，这里直接 await
    async def test_async_add(self):
        result = await async_add(2, 3)
        self.assertEqual(result, 5)

# 不需要自己写 asyncio.run，框架处理循环生命周期
```

**不要用 asyncio.run 跑长时间不退出的服务**

`asyncio.run` 设计为"跑完 main 就关循环"。如果你写的是 Web 服务器、消息队列消费者这类"长期运行不退出"的程序，main 协程会一直 await 下去（例如 `await server.serve_forever()`）。这本身能用，但要清楚：main 不返回，`asyncio.run` 就不会进入清理阶段，循环也不会被关闭——程序的退出靠信号处理让 main 返回，然后 run 才走清理流程。对这类长服务，更常见的是用框架自带的入口（uvicorn、hypercorn 等），它们内部管理循环，你不要在外层再套 `asyncio.run`。

**协程必须被 await 或交给 run，否则只是定义**

一个常见错误是写了 `async def` 函数却忘了 `await` 或 `create_task`，结果只是得到一个没被驱动的协程对象，里面一行代码都没执行，还触发 `RuntimeWarning: coroutine '...' was never awaited`。`asyncio.run(main())` 里，main 被驱动；但 main 内部如果写了 `fetch_user(1)`（漏 await）而不是 `await fetch_user(1)`，那个子协程就成孤儿了。debug 模式能帮你抓这类问题。

```python
import asyncio

async def work():
    print("work 执行了")
    return 42

async def main():
    # 错误：漏 await，work 协程从未被驱动
    work()  # RuntimeWarning: coroutine 'work' was never awaited
    return "main 结束"

asyncio.run(main(), debug=True)
# 输出：
# RuntimeWarning: coroutine 'work' was never awaited
# main 结束
# （注意 "work 执行了" 不会打印，因为协程没被驱动）
```

## 4. 原理

这一章详述 `asyncio.run` 内部如何创建、驱动、关闭事件循环，以及它为什么不能嵌套调用。理解这些能让你在遇到"为什么这里报 already running"时给出准确解释，而不是把它当成玄学规则背诵。

### 4.1 事件循环是什么：一个轮询调度器

在讲 `asyncio.run` 之前，先明确事件循环的本质。事件循环（event loop）是一个不断执行下面循环的对象：

1. 查看所有就绪的回调/任务（I/O 完成、定时器到期、Future 完成）。
2. 依次执行这些就绪回调（每个回调通常对应把某个挂起的协程恢复执行一步）。
3. 等待下一次 I/O 就绪或定时器到期（用 selector/epoll/select 等系统调用阻塞等待）。
4. 回到第 1 步。

协程本身不能自己往下走——它执行到 `await` 就挂起返回控制权给调用者。是事件循环在反复"恢复协程执行一步、它又 await 挂起、循环去恢复下一个就绪协程"，从而让多个协程看起来在并发推进。没有事件循环，`async def` 协程对象只是个能被 `send` 驱动的生成器，不会自己跑。

`asyncio.run` 的职责就是：把这个轮询调度器创建出来、让它跑起来去驱动 main 协程、main 结束后把它关掉。它本身不参与协程调度逻辑，调度逻辑在循环对象的方法里。

### 4.2 asyncio.run 的内部执行步骤拆解

`asyncio.run` 的实现（CPython `Lib/asyncio/runners.py`）大致等价于下面这段伪代码，理解它就理解了 `run` 的全部行为：

```python
def asyncio_run(main, *, debug=False):
    # 1. 入参校验：必须是协程对象
    if not asyncio.iscoroutine(main):
        raise ValueError(f"a coroutine was expected, got {main!r}")

    # 2. 获取当前事件循环策略
    events = asyncio.get_event_loop_policy()

    # 3. 安全校验：当前线程不能已有运行中的循环
    with asyncio.RunnerLocalGuard():
        running_loop = asyncio.get_event_loop_policy().get_running_loop() \
            if hasattr(events, 'get_running_loop') else None
    # 实际实现里通过 events._get_running_loop() 检查
    if asyncio._get_running_loop() is not None:
        raise RuntimeError(
            "asyncio.run() cannot be called from a running event loop"
        )

    # 4. 创建新循环
    loop = events.new_event_loop()

    # 5. 关键：用 try/finally 保证无论 main 是否异常都清理
    try:
        # 6. 把新循环设为当前线程的当前循环
        events.set_event_loop(loop)
        if debug:
            loop.set_debug(True)

        # 7. 运行 main 协程至完成
        return loop.run_until_complete(main)
    finally:
        # 8. 清理：关闭异步生成器
        try:
            _cancel_all_tasks(loop)
            loop.run_until_complete(loop.shutdown_asyncgens())
            loop.run_until_complete(loop.shutdown_default_executor())
        finally:
            # 9. 关闭循环，并把它从当前线程移除
            events.set_event_loop(None)
            loop.close()
```

各步骤的关键点：

**步骤 1 的入参校验** 解释了为什么 `asyncio.run(main)` 传函数会报错——它要求传入的是 `iscoroutine` 为真的协程对象，函数本身不满足。

**步骤 3 的运行循环检查** 是"不能嵌套调"的直接来源。`asyncio._get_running_loop()` 返回当前线程绑定的"正在运行"的循环对象，如果它不是 None，说明这个线程已经有一个循环在 `run_until_complete` 里驱动着，再开一个新循环去 run 就会冲突，所以直接 raise。

**步骤 4-6** 创建新循环并 install。注意 `set_event_loop(loop)` 把新循环设为"当前循环"，这是为了让 main 内部通过 `get_running_loop` / `get_event_loop` 能拿到正确的循环。但真正绑定"运行中"状态是 `run_until_complete` 开始时做的。

**步骤 7** 是真正驱动协程的地方。`loop.run_until_complete(main)` 内部把 main 包成一个 Task，然后进入循环的 `run_forever` 循环，直到这个 Task 完成。main 的返回值就是 `run_until_complete` 的返回值，再由 `asyncio.run` 透传出来。

**步骤 8 的清理** 保证了即使 main 里创建了异步生成器（`async def` + `yield`）、或用 `loop.run_in_executor` 起了线程池任务，它们都会被有序关闭。`_cancel_all_tasks` 还会取消所有残留的 Task，避免"Task was destroyed but it is pending"告警。

**步骤 9** 把当前循环设回 None 并 close，这是"每次 run 之后不留循环"的实现。下一次再调 `asyncio.run`，因为它找不到运行循环（已设回 None），就能正常创建新循环。这也解释了 2.5 节"同一线程连续多次 run 技术上可行"的原因：上一次 run 结束时已经把当前循环清空了。

### 4.3 为什么不能在已有循环内调用 asyncio.run

把 4.2 的步骤 3 和"一个线程同一时刻只能有一个循环运行"的事实合起来，就得到了完整解释。

事件循环的"运行"状态是线程局部的：CPython 在内部用一个线程局部变量 `_running_loop` 记录"当前线程正在跑哪个循环"。当 `loop.run_until_complete`（或 `run_forever`）开始时，它把 `_running_loop` 设为自身；结束时设回 None。这个变量保证一个线程同一时刻只有一个循环处于"运行"状态。

当你在协程内部（也就是某个循环正在运行的上下文里）调 `asyncio.run(other)`，`asyncio.run` 第一步检查 `_get_running_loop()`，发现它非 None（正是当前正在跑 main 的那个循环），立刻 raise `RuntimeError: asyncio.run() cannot be called from a running event loop`。这是"主动失败"而非"默默创建第二个循环"，因为同时跑两个循环会破坏线程局部状态、导致回调在错误的循环上调度。

那么"一个线程不能同时跑两个循环"是技术限制还是设计限制？主要是设计限制：asyncio 的回调、Task、Future 都绑定到具体循环，如果一个线程有两个循环在跑，`get_running_loop()` 该返回谁就语义不清。官方选择"一刀切禁止嵌套 run"，引导开发者用 `await` / `create_task` 在同一个循环内组织并发，而不是开新循环。

**这如何解释 Jupyter 的报错**

Jupyter/IPython 内核启动时会在主线程跑一个事件循环（用于处理 cell 的 `await` 和内核通信）。当你在 cell 里写 `asyncio.run(main())`，当前主线程的 `_running_loop` 正是 Jupyter 那个循环，于是 `asyncio.run` 的步骤 3 直接 raise。应对就是不要 run，直接 await——await 不创建新循环，只是把你的协程交给 Jupyter 的循环去跑。

### 4.4 run_until_complete 如何驱动一个协程

`asyncio.run` 把"驱动协程"的脏活儿都委托给了 `loop.run_until_complete`。理解这一步能看清协程是怎么"动起来"的。

`loop.run_until_complete(future_or_coro)` 的内部逻辑大致是：

1. 如果传进来的是协程（`iscoroutine` 为真），用 `asyncio.ensure_future` 把它包成一个 Task（Task 是 Future 的子类，内部持有一个对协程的引用，并注册到循环的任务调度里）。
2. 把这个 Task 加到一个内部"待完成"集合。
3. 调用 `self.run_forever()` 进入循环主体。
4. 当 Task 完成（协程 return 或 raise），通过回调把结果/异常存到 Task 上，`run_forever` 检测到唯一待完成 Task 已完成，退出循环。
5. 返回 Task 的结果（或重新抛出协程的异常）。

`run_forever` 的核心是一个 `while True`：每一次迭代，调用 selector 等待 I/O 就绪（带超时，超时由最近的定时器决定），就绪后把就绪回调收集起来，依次执行。执行某个回调时，可能就是"恢复某个挂起协程一步"——例如一个 `asyncio.sleep` 的定时器到期，它的回调会调用 `task.__step`，`task.__step` 内部对协程调 `coro.send(None)`，协程就从上次 `await` 处继续执行，直到下一个 `await` 又挂起返回。

所以协程不是"自己跑"，而是被循环通过 `coro.send` 一步一步推进的。每次 `send` 让协程执行到下一个 `await`（挂起点），控制权回到循环，循环再挑下一个就绪的 Task 去 send。这就是"事件循环驱动协程"的本质。

`asyncio.run` 的角色就是：把这样一个循环创建出来，调一次 `run_until_complete(main)` 让它从 main 开始跑，main 一完成就关掉它。它是"一次性驱动器"。

### 4.5 main 完成后的清理：为什么 shutdown_asyncgens 和 shutdown_default_executor 必不可少

4.2 的步骤 8 里，`asyncio.run` 在 main 返回后还要做两次 `run_until_complete`（关异步生成器、关默认执行器），然后再 `loop.close()`。这两步看起来多余——main 不是已经返回了吗？为什么还要继续跑循环？

因为 main 返回不等于循环里所有异步资源都已释放。有两类资源会"残留"：

**异步生成器（async generator）**

如果 main 里用了 `async def` + `yield` 产生的异步生成器，且没被 `aclose()` 就丢弃，它内部可能还挂着未执行的 `finally` 块或未完成的 I/O。直接 `loop.close()` 会触发"Task was destroyed but it is pending"或更隐蔽的资源泄漏。

`loop.shutdown_asyncgens()` 会找出循环里所有待关闭的异步生成器，逐个调 `aclose()` 让它们干净退出。这需要"再跑一会儿循环"——因为 `aclose()` 本身是协程，要靠循环驱动。

**默认线程池执行器**

如果 main 里用了 `await loop.run_in_executor(None, blocking_func)`（包括 `asyncio.to_thread`），循环会维护一个默认的线程池。main 返回后这个线程池还在，里面的工作线程没被回收。`loop.shutdown_default_executor()` 会等待线程池里所有挂起任务完成并关闭线程池，避免线程泄漏。

这两步是 `asyncio.run` 相对"手动三连"的关键优势。旧代码 `loop = get_event_loop(); loop.run_until_complete(main()); loop.close()` 漏掉了这两步，所以遇到异步生成器或线程池场景就会告警或泄漏。`asyncio.run` 把它们做成了标准流程，这就是"为什么不推荐旧 API"的实质理由——不是因为旧 API 功能不够，而是因为它把清理责任留给了开发者，而开发者经常忘。

### 4.6 循环的生命周期：一次 run 的完整轨迹

把前几节合起来，画一次 `asyncio.run(main())` 的完整生命周期轨迹：

1. 调用前：当前线程无运行循环，`_running_loop` 为 None，`_current_event_loop`（策略层）可能为 None 或某个旧循环。
2. `asyncio.run` 开始：校验入参、检查无运行循环、`new_event_loop()` 创建循环 L。
3. `set_event_loop(L)`：L 成为当前线程的"当前循环"。
4. `loop.run_until_complete(main)`：
   - L 进入"运行"状态，`_running_loop = L`。
   - main 被包成 Task T，L 进入 `run_forever` 循环。
   - L 反复驱动 T 和其他子 Task，直到 T 完成。
   - T 完成，`_running_loop = None`，退出 `run_forever`。
   - 返回 T 的结果。
5. 清理：`_cancel_all_tasks(L)`、`shutdown_asyncgens`、`shutdown_default_executor`（每步都再短暂进入运行态驱动相应协程）。
6. `set_event_loop(None)`：当前线程的当前循环清空。
7. `loop.close()`：释放 L 的底层 selector 等资源。
8. `asyncio.run` 返回 main 的结果给调用者。

这个轨迹里最关键的两个状态变量是 `_running_loop`（标记"有没有循环在跑"）和当前线程策略里的 `_current_event_loop`（标记"当前循环是谁"）。`asyncio.run` 的所有"不能这样用"规则都可以从这两个变量的变化推出来：

- 主线程调一次 run：结束时 `_current_event_loop` 被设回 None，`_running_loop` 也为 None，下次 run 能正常开始。
- 在循环内调 run：`_running_loop` 非 None，步骤 2 的检查直接拦住。
- 连续两次 run：第一次结束时已清空，第二次能正常建新循环，但两次间的异步状态无法共享。

### 4.7 get_event_loop / get_running_loop / set_event_loop 的角色

理解 `asyncio.run` 还需要明白它依赖的"循环策略（event loop policy）"机制。策略是一个单例对象，负责管理"每个线程的当前循环"。

- `get_event_loop()`：读"当前线程的当前循环"；如果当前线程没设置过且在主线程，旧行为会创建一个。这是被弃用的模糊 API。
- `set_event_loop(loop)`：把"当前线程的当前循环"设为给定循环（或 None）。`asyncio.run` 用它来 install 新循环、最后再设回 None。
- `get_running_loop()`：读线程局部的"正在运行"循环，没有就 raise。这是协程内部拿循环的正确方式。
- `new_event_loop()`：无条件创建一个新循环，不 install。`asyncio.run` 内部用它创建循环，再自己 `set_event_loop`。

`asyncio.run` 的整个流程可以理解为"用 `new_event_loop` 建循环、用 `set_event_loop` install、用 `run_until_complete` 驱动、用 `set_event_loop(None)` + `close` 拆除"的一套托管操作。它把策略层这几个 API 的正确组合固化成一个函数，开发者不再需要手写这套组合，也就不再容易写错。

这也是为什么官方强烈推荐 `asyncio.run`：它不是"另一个启动方式"，而是"把正确做法做成默认"的封装。旧的手动写法每一次都要开发者自己组合 `new_event_loop` / `set_event_loop` / `run_until_complete` / `shutdown_*` / `close`，任何一个环节漏掉或顺序错都会留下隐患。`asyncio.run` 把整套正确流程封装好，这才是它的价值。

### 4.8 用一段可运行的最小实现印证流程

把 4.2 的伪代码落到一个真的能跑的简化版 `run` 上，对照输出，能直观看到"创建-运行-清理-关闭"四个阶段。这个 demo 不是要替代官方实现（它省略了 `_cancel_all_tasks` 等细节），而是帮你把前面讲的原理和可观察行为挂钩。

```python
import asyncio

async def main():
    print("  [main] 开始")
    await asyncio.sleep(0.05)
    print("  [main] 结束")
    return "main-result"

def my_run(coro):
    """简化版 asyncio.run，演示创建-运行-清理-关闭四阶段。"""
    # 阶段 1：校验 + 检查无运行循环
    if not asyncio.iscoroutine(coro):
        raise ValueError("需要协程对象")
    if asyncio._get_running_loop() is not None:
        raise RuntimeError("已有运行循环")

    # 阶段 2：创建新循环并 install
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    print(f"[my_run] 创建循环: {loop}")

    try:
        # 阶段 3：驱动 main
        print("[my_run] run_until_complete 开始")
        result = loop.run_until_complete(coro)
        print(f"[my_run] run_until_complete 返回: {result}")

        # 阶段 4：清理异步生成器（演示用，省略 default_executor）
        loop.run_until_complete(loop.shutdown_asyncgens())
        return result
    finally:
        print("[my_run] 关闭循环")
        asyncio.set_event_loop(None)
        loop.close()

result = my_run(main())
print(f"最终返回: {result}")
# 输出：
# [my_run] 创建循环: <_UnixSelectorEventLoop ...>
# [my_run] run_until_complete 开始
#   [main] 开始
#   [main] 结束
# [my_run] run_until_complete 返回: main-result
# [my_run] 关闭循环
# 最终返回: main-result
```

从输出顺序可以清楚看到四个阶段：创建循环 → `run_until_complete` 驱动 main（main 的 print 在这期间执行）→ main 返回后进入 finally → 关闭循环并把当前循环设回 None。官方 `asyncio.run` 的步骤更多（还有 `_cancel_all_tasks`、`shutdown_default_executor`、debug 设置），但骨架完全一致。

**用一个 probe 观察循环生命周期**

再给一个更细的 probe，在 main 内部和 main 返回后分别用 `get_running_loop` / `get_event_loop` 观察"当前循环"的状态变化，印证 4.6 节的轨迹描述：

```python
import asyncio

async def main():
    # 协程内部：循环正在运行
    running = asyncio.get_running_loop()
    print(f"[main 内] running_loop = {id(running)}")
    # get_event_loop 在循环运行时应返回同一个循环
    cur = asyncio.get_event_loop()
    print(f"[main 内] get_event_loop = {id(cur)}，与 running 相同: {cur is running}")
    return "ok"

# 调 run 前：无运行循环
try:
    asyncio.get_running_loop()
except RuntimeError as e:
    print(f"[run 前] get_running_loop: {e}")

asyncio.run(main())

# 调 run 后：循环已关闭并被设回 None
try:
    asyncio.get_running_loop()
except RuntimeError as e:
    print(f"[run 后] get_running_loop: {e}")
# 输出：
# [run 前] get_running_loop: no running event loop
# [main 内] running_loop = 4319...（某个 id）
# [main 内] get_event_loop = 4319...，与 running 相同: True
# [run 后] get_running_loop: no running event loop
```

这个 probe 印证了两件事：一是 `get_running_loop` 在 run 前后都报"no running event loop"（因为 run 结束时把 `_running_loop` 设回了 None），二是 main 内部 `get_event_loop` 和 `get_running_loop` 返回同一个循环（这是 4.2 步骤 6 `set_event_loop` + 步骤 7 `run_until_complete` 共同保证的）。把这两点和 4.3 的"嵌套 run 会失败"放在一起，整个 `asyncio.run` 的行为模型就完整了。

## 5. 总结

### 5.1 本文内容要点

- `asyncio.run(main_coro, *, debug=False)` 是 Python 3.7+ 官方推荐的启动协程入口：创建新事件循环、跑完 main 协程、关闭循环，三步一体。
- 标准模式是 `async def main` 写逻辑、`asyncio.run(main())` 在脚本顶层启动，整个脚本只调一次 run。
- main 内部用 `asyncio.gather` / `create_task` 组织并发，run 只负责启动循环，不参与子协程调度。
- `asyncio.run` 不能在已有事件循环运行时调用，会抛 `RuntimeError: cannot be called from a running event loop`；Jupyter/已有循环环境里应直接 `await coro()`，不要 run。
- `debug=True` 开启调试模式，会在慢回调和未 await 协程时告警，开发期开、生产期关。
- 旧 API `get_event_loop` + `run_until_complete` + `close` 在 3.10+ 被逐步弃用（尤其是无循环时自动创建的行为），应迁移到 `asyncio.run`；协程内部拿循环应改用 `get_running_loop`。
- `asyncio.run` 内部做了完整清理：取消残留 Task、`shutdown_asyncgens`、`shutdown_default_executor`、`close`，保证不泄漏异步生成器和线程池资源——这是它优于手动三连的核心。
- 返回值透传 main 的返回值，异常原样抛出，但循环仍被正确关闭。

### 5.2 读完应能掌握

- 能写出标准的 `async def main` + `asyncio.run(main())` 异步脚本骨架，且只调一次 run。
- 能复用 `asyncio.run` 跑多个子协程（`gather`），并解释为什么总耗时取最长的子协程而非累加。
- 遇到 `RuntimeError: asyncio.run() cannot be called from a running event loop` 能说明原因（当前线程已有运行循环），并给出正确改法（Notebook 里直接 await；脚本里把逻辑放进 main 再 run）。
- 能区分 `get_event_loop`、`get_running_loop`、`new_event_loop`、`set_event_loop` 的语义，解释为什么 `get_event_loop` 被弃用、迁移时改用哪个。
- 能说清 `asyncio.run` 内部"创建循环→set_event_loop→run_until_complete→shutdown_asyncgens→shutdown_default_executor→close→set_event_loop(None)"的完整流程，以及为什么这个流程保证不留残余状态。
- 能判断什么场景该用 `asyncio.run`（程序顶层入口、无运行循环）、什么场景不该用（已有循环内、需要跨协程共享异步状态时拆成多个 run），并能给出替代方案。