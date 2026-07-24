---
group:
  title: 【18】异步协程
  order: 18
order: 13
title: 同步代码调用异步代码
nav:
  title: Python
  order: 1
---

## 1. 介绍

### 1.1 什么是"同步代码调用异步代码"

Python 的 `async def` 协程是一种特殊的对象：调用一个协程函数 `fetch()` 得到的不是结果，而是一个尚未运行的 **coroutine 对象**。它必须被事件循环（event loop）驱动才会真正执行——通过 `await` 让出控制权、被循环调度、直到完成并返回结果。脱离事件循环，协程就只是一段"等待被启动的代码"。

现实工程里常常出现这样的场景：你已经有了一套**同步代码**（普通的 `def` 函数、`if __name__ == "__main__"` 入口、第三方同步回调框架如 tkinter / WSGI 服务器），而你想调用一个已经写好的异步协程（比如 `aiohttp` 的 `fetch`、`asyncio.sleep` 模拟的异步任务、`aiomysql` 的查询）。问题立刻出现：

- **直接 `fetch()` 不行**：这只是创建了一个 coroutine 对象，里面的代码一行都没跑，解释器退出时还会报 `RuntimeWarning: coroutine 'fetch' was never awaited`。
- **直接 `await fetch()` 也不行**：`await` 只能写在 `async def` 函数内部。同步函数没有 `await` 语义，强行写会触发 `SyntaxError: 'await' outside async function`。

所以需要一个**桥接层**：把协程"塞进"一个事件循环，让循环驱动它跑到结束，再把结果交回同步世界。这一篇讲的就是这层桥接——**如何从同步世界进入异步世界**。

Python 标准库 `asyncio` 提供了几种桥接方式，各有适用场景：

| 桥接方式 | 适用场景 | 关键 API |
|---------|---------|---------|
| `asyncio.run(coro)` | 程序顶层、当前线程没有运行的事件循环 | 最常用，3.7+ 推荐 |
| `asyncio.run_coroutine_threadsafe(coro, loop)` | 把协程从同步线程提交到另一个"已运行事件循环"的线程 | 多线程混用 |
| `loop.run_until_complete(coro)` | 旧 API，显式驱动单协程；或在已有未运行的循环上跑 | 3.6 及更早，或特殊控制 |
| `loop.run_in_executor(func, ...)` | 反向：异步代码里调用阻塞同步代码 | 本篇略讲，留第 14 篇详述 |

本篇重点讲前三种"同步 → 异步"方向的桥接，并说清为什么 `asyncio.run` 不能在有运行循环的线程里调用、为什么协程不会"自动跑"。

### 1.2 基础语法与最小用法

先看最常见、最该用的形式：`asyncio.run(coro)`。

```python
import asyncio


async def fetch(url: str) -> str:
    """模拟一个异步 HTTP 请求协程。"""
    print(f"  开始请求 {url}")
    await asyncio.sleep(0.1)          # 模拟网络等待
    print(f"  完成 {url}")
    return f"<响应 {url}>"


def main() -> None:
    """同步主函数：从同步代码里跑一个协程。"""
    print("同步 main 开始")
    # fetch() 只得到 coroutine 对象；asyncio.run 负责驱动它
    result = asyncio.run(fetch("https://example.com"))
    print(f"同步 main 拿到结果: {result}")


if __name__ == "__main__":
    main()
```

运行结果：

```
同步 main 开始
  开始请求 https://example.com
  完成 https://example.com
同步 main 拿到结果: <响应 https://example.com>
```

这里的 `main` 是一个地地道道的**同步函数**（`def`，不是 `async def`），它内部没有任何 `await`。但它通过 `asyncio.run` 完整地拿到了异步协程 `fetch` 的返回值——这就是桥接。`asyncio.run` 做了四件事：

1. 创建一个新的事件循环；
2. 把传入的协程作为顶层任务跑起来；
3. 阻塞当前同步代码，直到协程完成；
4. 关闭循环、清理资源，把协程返回值交给调用方。

记住这一个用法就能应付 80% 的"同步入口调协程"场景。后面几节展开它的边界、替代方案和踩坑点。

---

## 2. 核心内容

### 2.1 asyncio.run(coro)：从无循环环境启动协程

**作用**：在当前线程**没有运行事件循环**的前提下，新建一个临时循环，把协程跑到完成，然后关闭循环。它是 Python 3.7 引入的高层 API，也是官方推荐的"程序入口"写法。

**签名**：

```python
asyncio.run(coro, *, debug=False)
```

- `coro`：一个 coroutine 对象（如 `fetch()` 的返回值），不能传 Task 或 Future，也不能传普通函数。
- `debug`：是否开启调试模式（在协程耗时过长、未捕获异常时打印更详细信息）。
- 返回值：协程的 `return` 结果；协程抛异常则向上抛。

**典型场景**：

- `if __name__ == "__main__"` 入口跑异步程序；
- 同步单元测试里调用异步被测函数；
- 脚本工具里把异步库（aiohttp、aiomysql）对接到同步逻辑。

**一个稍复杂的 demo：在同步入口里并发跑多个协程**

```python
import asyncio
import time


async def fetch(url: str) -> str:
    await asyncio.sleep(0.3)
    return f"<{url}>"


async def fetch_all(urls: list[str]) -> list[str]:
    """并发抓取一组 URL。"""
    tasks = [asyncio.create_task(fetch(u)) for u in urls]
    return await asyncio.gather(*tasks)


def main() -> None:
    start = time.monotonic()
    # 同步入口里跑一个"并发聚合"协程
    results = asyncio.run(fetch_all(["a", "b", "c"]))
    elapsed = time.monotonic() - start
    print(f"结果: {results}")
    print(f"耗时: {elapsed:.2f}s（并发，应接近 0.3s 而非 0.9s）")


if __name__ == "__main__":
    main()
```

```
# 输出：
# 结果: ['<a>', '<b>', '<c>']
# 耗时: 0.30s（并发，应接近 0.3s 而非 0.9s）
```

注意：`asyncio.run` 接收的是**一个**协程。要并发多个任务，就先把它们聚合成一个协程（`fetch_all` 内部 `gather`），再交给 `asyncio.run`。`asyncio.run` 永远只驱动"顶层那一个"协程，由它去创建子任务。

**`asyncio.run` 的资源语义**

`asyncio.run` 在结束时会做完整的清理：

- 取消所有尚未完成的子任务；
- 等待取消传播（让各任务收到 `CancelledError` 并退出）；
- 关闭异步生成器（`async gen` 的 `aclose`）；
- 关闭事件循环本身。

这意味着它适合做"一次性、自包含"的运行。如果你想在循环里反复跑协程、或与已存在的循环共存，就不该用它（见 2.4）。

**不能传什么**

```python
# 错误：传了普通函数
asyncio.run(print)            # TypeError: ... expected a coroutine

# 错误：传了已 await 完的协程对象（其实没问题，但常被误解）
# fetch() 被 await 后就不再可复用，但传"新的 coroutine 对象"是对的
asyncio.run(fetch("x"))       # 正确：每次调用 fetch 得到新协程对象
```

### 2.2 asyncio.run_coroutine_threadsafe：跨线程提交协程

**作用**：当一个线程里**已经有一个正在运行的事件循环**（通常是主线程跑 `loop.run_forever()` 或 GUI 的事件循环），另一个同步线程想把协程交给它执行、并取回结果时，用这个函数。名字很长但意图很准——把协程**线程安全地**提交到指定循环。

**签名**：

```python
concurrent.futures.Future = asyncio.run_coroutine_threadsafe(coro, loop)
```

- `coro`：要执行的协程对象。
- `loop`：目标线程里那个**正在运行**的事件循环（`loop.is_running() == True`）。
- 返回值：一个 `concurrent.futures.Future`（注意不是 asyncio 的 Future！）——它是**跨越同步线程**的同步 Future，调用方在同步线程里 `.result()` 阻塞等待结果。

**为什么需要它**

asyncio 的事件循环**不是线程安全**的：你不能在工作线程里直接 `loop.create_task(coro)` 或 `await coro`。唯一安全地"从别的线程往运行中的循环塞任务"的官方 API 就是 `run_coroutine_threadsafe`。它的内部把协程包成 Task 并用 `loop.call_soon_threadsafe` 安排到目标循环里执行，结果通过线程安全的 Future 传回。

**场景一：主线程跑事件循环，工作线程提交协程**

这是一个典型结构：主线程启动一个常驻事件循环（比如 GUI 或服务端），工作线程需要触发一个异步操作。

```python
import asyncio
import threading


async def db_query(sql: str) -> str:
    print(f"  [loop 线程] 执行查询: {sql}")
    await asyncio.sleep(0.2)
    return f"结果({sql})"


def worker(loop: asyncio.AbstractEventLoop) -> None:
    """同步工作线程：把协程提交到主线程的 loop。"""
    print("[工作线程] 准备提交协程")
    future = asyncio.run_coroutine_threadsafe(db_query("SELECT 1"), loop)
    # 在同步线程里阻塞等待结果
    result = future.result(timeout=5)
    print(f"[工作线程] 拿到: {result}")


def main() -> None:
    loop = asyncio.new_event_loop()
    # 主线程启动循环（用 run_forever 让它常驻）
    t_loop = threading.Thread(target=loop.run_forever, daemon=True)
    t_loop.start()

    # 同步主逻辑里，开工作线程去跑异步任务
    t = threading.Thread(target=worker, args=(loop,))
    t.start()
    t.join()

    # 收尾
    loop.call_soon_threadsafe(loop.stop)
    t_loop.join()
    loop.close()


if __name__ == "__main__":
    main()
```

```
# 输出：
# [工作线程] 准备提交协程
#   [loop 线程] 执行查询: SELECT 1
# [工作线程] 拿到: 结果(SELECT 1)
```

注意几个关键点：

- `db_query` 实际上在 **loop 所在的线程**执行，不是工作线程；工作线程只是提交并等待。
- `future.result()` 是阻塞调用，在同步线程里用是安全的；它不是 `await`。
- `future` 是 `concurrent.futures.Future`，带 `timeout` 参数，超时会抛 `TimeoutError`。

**场景二：GUI（tkinter）同步回调里跑协程**

GUI 框架的回调都是普通同步函数，且回调所在的线程就是 GUI 主线程。如果你想让 GUI 主线程同时承载 asyncio 事件循环（比如配合 `loop.run_forever` 嵌进 tkinter 主循环），回调里就不能 `asyncio.run`（会再开循环并阻塞 GUI），正确做法是用 `run_coroutine_threadsafe` 把协程提交给那个已在运行的循环。

下面是一个简化模型（用一个后台线程跑 loop，模拟 tkinter 集成）：

```python
import asyncio
import threading


async def download(url: str) -> bytes:
    await asyncio.sleep(0.3)
    return f"{url} 的内容".encode()


# 主线程的"循环引用"，回调要用
LOOP: asyncio.AbstractEventLoop | None = None


def on_button_click() -> None:
    """tkinter 按钮回调：同步函数，里面要跑协程。"""
    # 绝不能 asyncio.run(download(...))，会阻塞 GUI 主线程并报 already running
    assert LOOP is not None
    fut = asyncio.run_coroutine_threadsafe(download("https://x"), LOOP)
    data = fut.result(timeout=5)
    print(f"按钮回调拿到: {data!r}")


def main() -> None:
    global LOOP
    loop = asyncio.new_event_loop()
    LOOP = loop
    t = threading.Thread(target=loop.run_forever, daemon=True)
    t.start()

    # 模拟按钮被点
    on_button_click()
    on_button_click()

    loop.call_soon_threadsafe(loop.stop)
    t.join()
    loop.close()


if __name__ == "__main__":
    main()
```

```
# 输出：
# 按钮回调拿到: b'https://x 的内容'
# 按钮回调拿到: b'https://x 的内容'
```

真实集成会把 asyncio 循环跑在主线程、用 `loop.run_forever` 与 tkinter 的 `mainloop` 协调，或更常见的把阻塞操作放到工作线程。但无论哪种，核心模式都是一致的：**同步回调里用 `run_coroutine_threadsafe` 把协程交给运行中的循环**。

**Future 的取消与异常**

`run_coroutine_threadsafe` 返回的 `concurrent.futures.Future` 支持 `cancel()` 和异常传播：

```python
async def boom() -> None:
    raise ValueError("炸了")


def worker(loop):
    fut = asyncio.run_coroutine_threadsafe(boom(), loop)
    try:
        fut.result(timeout=5)
    except ValueError as e:
        print(f"捕获到协程异常: {e}")
```

```
# 输出：
# 捕获到协程异常: 炸了
```

协程内的异常会原样冒泡到调用线程的 `future.result()` 调用处，便于同步侧统一处理。

### 2.3 loop.run_until_complete：旧式显式驱动

**作用**：在一个事件循环上显式地跑单个协程（或 Future/Task），阻塞直到完成，返回结果。这是 `asyncio.run` 出现之前（Python 3.6 及更早）的官方入口写法，现在大多被 `asyncio.run` 取代，但在某些受控场景仍有用。

**签名**：

```python
result = loop.run_until_complete(future)
```

- `future`：可以是协程对象、Task 或 Future。若是协程，会先被包成 Task。
- 返回值：协程/Future 的结果。
- 前提：该 loop **当前没在运行**（`loop.is_running()` 为 False），否则抛 `RuntimeError`。

**典型用法：手动获取/复用循环**

```python
import asyncio


async def fetch(url: str) -> str:
    await asyncio.sleep(0.1)
    return f"<{url}>"


def main() -> None:
    loop = asyncio.new_event_loop()
    try:
        # 显式驱动一个协程
        r1 = loop.run_until_complete(fetch("a"))
        print(r1)
        # 同一个循环可再次用来跑另一个协程（不像 run 每次都新建/关闭）
        r2 = loop.run_until_complete(fetch("b"))
        print(r2)
    finally:
        loop.close()


if __name__ == "__main__":
    main()
```

```
# 输出：
# <a>
# <b>
```

**`run_until_complete` 与 `asyncio.run` 的差异**

| 维度 | `asyncio.run` | `loop.run_until_complete` |
|-----|--------------|--------------------------|
| 循环管理 | 自建自关，外部看不到循环 | 需手动 `new_event_loop()`/`get_event_loop()` 与 `close()` |
| 多次调用 | 每次都新建并关闭循环，开销略大 | 可在同一循环上多次调用，复用循环 |
| 清理 | 自动取消遗留任务、关闭异步生成器 | 不清理遗留任务，需要手动处理 |
| 写法简洁度 | 一行 | 三段（建循环、跑、关） |
| 推荐度 | 3.7+ 优先 | 旧代码或需精细控制循环生命周期时 |

**何时仍用 `run_until_complete`**

- 你需要**复用同一个循环**跑多个不相关的协程，且不想反复建/关循环（如某些测试夹具、嵌入式宿主）。
- 你需要**先 `run_forever` 让循环常驻**，等外部条件触发后 `stop()`，再 `run_until_complete` 收尾（少见但合法）。
- 维护 3.6 及更早代码库。

普通入口脚本请优先用 `asyncio.run`，避免手动管理循环。

### 2.4 不能在已有运行循环的线程里 asyncio.run

这是**最常见的报错之一**。理解它的关键是 asyncio 的一个约束：**每个线程同一时刻最多有一个正在运行的事件循环**。

```python
import asyncio


async def outer() -> None:
    # outer 本身就跑在某个运行中的循环里
    print("outer 里尝试 asyncio.run...")
    # RuntimeError: asyncio.run() cannot be called from a running event loop
    asyncio.run(asyncio.sleep(0.1))


asyncio.run(outer())
```

```
# 输出：
# outer 里尝试 asyncio.run...
# RuntimeError: asyncio.run() cannot be called from a running event loop
```

原因：

1. `asyncio.run` 的开头会检查 `events._get_running_loop()`，若当前线程已有一个运行循环，直接抛 `RuntimeError`。
2. 即便它不检查，强行启动新循环也会阻塞当前协程所在的循环——协程就再也没机会被调度回来，整个程序死锁。

**那"在协程里想跑另一个协程"该怎么办**

直接 `await` 它们。协程里跑协程天经地义，根本不需要 `asyncio.run`：

```python
async def inner() -> str:
    await asyncio.sleep(0.1)
    return "inner done"


async def outer() -> None:
    print(await inner())            # 正确：直接 await
    print(await asyncio.gather(inner(), inner()))  # 并发也可以
```

```
# 输出：
# inner done
# ['inner done', 'inner done']
```

**`asyncio.run` 也不能嵌套**

```python
# 伪代码示意：
def main():
    asyncio.run(asyncio.run(coro))  # 荒谬：内层 run 在外层 run 创建的循环里被调用
```

外层 `asyncio.run` 一旦启动，本线程就有了运行循环；内层 `asyncio.run` 检测到后立刻抛错。结论：**一个同步函数链里，入口处 `asyncio.run` 只调用一次**，内部需要并发就 `gather`/`create_task`，需要嵌套就 `await`。

### 2.5 阻塞同步代码不要直接 await 托管

讲一个"反向误用"。有时你拿到一个**阻塞的同步函数**（比如 `requests.get`、`time.sleep`、CPU 密集计算），想让它和异步任务一起"跑"。初学者常这样写：

```python
# 错误示范
async def bad():
    # requests.get 是阻塞的，await 一个普通函数会报错；
    # 退一步，即便包装成协程，阻塞调用仍会卡死整个循环
    import requests
    resp = requests.get("https://example.com")   # 阻塞！
    return resp.status_code
```

问题在于 `requests.get` 是纯同步阻塞调用，它执行时**整个事件循环都被挂住**，其他协程都无法推进。这不是"同步调异步"的问题，而是"异步里调阻塞同步"，属于反向桥接——正确做法是用 `loop.run_in_executor` 把阻塞函数扔到线程池：

```python
import asyncio
import requests


async def good(url: str) -> int:
    loop = asyncio.get_running_loop()
    # 把阻塞的同步函数交给默认线程池执行，await 的是 Executor 返回的 Future
    resp = await loop.run_in_executor(None, requests.get, url)
    return resp.status_code


asyncio.run(good("https://example.com"))
```

这一条留到第 14 篇详讲，这里只是提醒：`asyncio.run` / `run_coroutine_threadsafe` 解决的是"驱动协程"的问题，**不能**让阻塞同步代码"变异步"。阻塞同步代码只能靠 `run_in_executor` 隔离到线程/进程池，或干脆重写成真正的异步实现。

### 2.6 桥接 API 速查与选择

把四种涉及同步/异步边界的 API 放一起对比，便于选型：

| API | 方向 | 前提 | 返回 | 典型场景 |
|-----|-----|-----|-----|---------|
| `asyncio.run(coro)` | 同步 → 异步 | 当前线程无运行循环 | 协程结果 | 程序入口、一次性运行 |
| `run_coroutine_threadsafe(coro, loop)` | 同步线程 → 异步线程 | 目标 loop 在另一线程运行中 | `concurrent.futures.Future` | 多线程混用、GUI 回调 |
| `loop.run_until_complete(coro)` | 同步 → 异步 | 该 loop 未运行 | 协程结果 | 旧 API、循环复用 |
| `loop.run_in_executor(executor, func, ...)` | 异步 → 同步 | 在协程内，持有运行循环 | asyncio Future | 让阻塞同步函数不卡循环 |

选择口诀：

- **在同步入口跑一个协程**：`asyncio.run`。
- **在异步里调阻塞同步**：`run_in_executor`（第 14 篇）。
- **在同步线程里把协程丢给另一线程的循环**：`run_coroutine_threadsafe`。
- **旧代码 / 需要复用循环**：`run_until_complete`。

---

## 3. 最佳实践

### 3.1 入口只用一次 asyncio.run

**推荐**：`asyncio.run` 放在 `main()` 顶层调用一次，内部所有异步逻辑通过 `await` / `gather` / `create_task` 编排。

```python
def main() -> None:
    data = asyncio.run(load_config())
    asyncio.run(process(data))   # 不推荐：第二次 run
```

```python
def main() -> None:
    data = asyncio.run(async_main())   # 推荐：一个顶层协程把 load + process 串起来

async def async_main() -> None:
    data = await load_config()
    await process(data)
```

**原因**：每次 `asyncio.run` 都会新建并关闭循环、创建新线程局部状态，频繁调用既有开销，也可能让跨调用的 Task/Queue（它们绑定循环）失效。

### 3.2 别在有运行循环的线程里 asyncio.run

判断准则：如果你这段同步代码是**被某个 async 函数直接或间接调用**的（比如在协程里调用了一个同步工具函数），那它所在线程已经有运行循环，不能再 `asyncio.run`。如果是从 `if __name__ == "__main__"`、普通同步回调、普通线程入口进来的，通常无运行循环，可以用。

### 3.3 跨线程提交务必用 run_coroutine_threadsafe

**错误**：直接 `loop.create_task(coro)` 或 `asyncio.run(coro)` 从工作线程访问主线程的循环。前者非线程安全，行为未定义；后者会在工作线程另开循环，与主循环隔离，协程内创建的资源无法共享。

**正确**：`asyncio.run_coroutine_threadsafe(coro, loop)` + `future.result(timeout=...)`。

### 3.4 给 future.result 设超时

跨线程桥接时，目标循环可能因为死锁、任务取消或异常而永远不返回结果。`future.result(timeout=N)` 会在超时后抛 `TimeoutError`，让同步侧有机会清理而不是永久挂住。养成"凡是跨线程等待都带超时"的习惯。

### 3.5 不要把阻塞调用塞进协程再 run

把 `time.sleep(5)` 包进 `async def` 然后用 `asyncio.run` 跑，看似"异步"，实则会阻塞唯一的循环线程 5 秒。协程只有真正 `await`（让出控制权）才有意义。阻塞同步代码请走 `run_in_executor`。

### 3.6 关闭循环前取消遗留任务

用 `run_until_complete` 手动管理循环时，循环里可能残留未完成的 Task。直接 `loop.close()` 会丢失这些任务。推荐收尾：

```python
import asyncio


async def main() -> None:
    asyncio.create_task(asyncio.sleep(10))   # 故意遗留
    await asyncio.sleep(0.1)


loop = asyncio.new_event_loop()
loop.run_until_complete(main())

# 收尾：取消所有未完成任务
pending = asyncio.all_tasks(loop)
for task in pending:
    task.cancel()
if pending:
    loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))
loop.close()
```

`asyncio.run` 会自动做这一步，这也是它比手动 `run_until_complete` 更安全的原因之一。

### 3.7 单元测试里调协程

测试函数是同步的，调被测协程最简单就是 `asyncio.run(coro())`。若用 `pytest-asyncio`，则用 `@pytest.mark.asyncio` 把测试函数标成 async，框架提供循环驱动——不要在 async 测试里再 `asyncio.run`。

### 3.8 旧 WSGI / 同步框架桥接

WSGI 处理函数是同步签名 `def app(environ, start_response)`，里面不能 `await`。若想调用异步库，方式：

- 用 `asyncio.run(coro())` 在每次请求里新建循环——简单但循环不共享，开销大。
- 在 worker 进程里常驻一个循环线程，请求处理中用 `run_coroutine_threadsafe` 提交——推荐，循环可复用、可共享连接池。

```python
import asyncio
import threading


LOOP: asyncio.AbstractEventLoop | None = None


def start_loop() -> None:
    global LOOP
    LOOP = asyncio.new_event_loop()
    threading.Thread(target=LOOP.run_forever, daemon=True).start()


async def async_query(sql: str) -> list:
    await asyncio.sleep(0.01)
    return [sql]


def app(environ, start_response):
    """WSGI 同步处理函数，内部桥接到异步查询。"""
    assert LOOP is not None
    sql = environ.get("QUERY_STRING", "")
    fut = asyncio.run_coroutine_threadsafe(async_query(sql), LOOP)
    rows = fut.result(timeout=5)
    start_response("200 OK", [("Content-Type", "text/plain")])
    return [f"{rows}".encode()]


start_loop()
# 假装一个请求
print(list(app({"QUERY_STRING": "SELECT 1"}, lambda s, h: None)))
```

```
# 输出：
# [b"['SELECT 1']"]
```

### 3.9 常见错误清单

| 错误 | 原因 | 解决 |
|-----|-----|-----|
| `RuntimeWarning: coroutine '...' was never awaited` | 只调用了协程函数，没驱动 | 用 `asyncio.run` / `await` |
| `RuntimeError: asyncio.run() cannot be called from a running event loop` | 在已有运行循环里 `asyncio.run` | 改用 `await` 或 `run_coroutine_threadsafe` |
| `RuntimeError: This event loop is already running` | 旧版 nest_asyncio 相关，或嵌套 run | 同上 |
| `RuntimeError: There is no current event loop in thread '...'` | 工作线程里直接 `asyncio.run` 前未设置循环 | 用 `asyncio.run` 即可（它会自建）；若用旧 API 需 `asyncio.set_event_loop` |
| 挂住不返回 | 阻塞调用卡循环 / Future 无超时 | `run_in_executor` / `.result(timeout=)` |
| `TypeError: ... expected a coroutine` | 给 `asyncio.run` 传普通函数而非协程对象 | 传 `func(...)` 的返回值（协程对象） |

---

## 4. 原理

### 4.1 为什么协程不能在同步函数里直接 call 或 await

`async def` 函数调用的返回值是一个 `coroutine` 对象，它是"未启动的执行体"。CPython 解析 `async def` 后，函数体被编译成带有 `SEND`/`RESUME` 等字节码的特殊代码对象，调用时只是构造一个 coroutine frame 挂起，**不会执行任何 `await` 点之前的逻辑除非被驱动**。

驱动协程有两种合法路径：

1. **`await coro`**：在另一个 `async def` 里，让出控制权给事件循环，循环在适当时机 `SEND(None)` 给协程，协程执行到下一个 `await` 或结束。
2. **事件循环的 Task 包装**：循环把协程包成 Task，在调度时驱动它。

同步函数没有第一条路径（`await` 是语法关键字，仅 `async def` 内可用），也没有第二条路径（没有事件循环在运行）。所以：

- `fetch()` → 得到一个冷协程对象，无人驱动 → `RuntimeWarning: was never awaited`。
- `await fetch()` → `SyntaxError`。

这背后的根本约束是：**协程的执行依赖事件循环这一运行时上下文**。事件循环负责在协程 `await` 时切到别的任务、在 I/O 就绪时切回来。同步函数没有这个上下文，自然无法承担驱动职责。

### 4.2 asyncio.run 如何自建循环驱动单协程

`asyncio.run` 的实质（简化版）如下：

```python
# 伪代码，非 CPython 真实实现
def run(main, *, debug=False):
    if events._get_running_loop() is not None:
        raise RuntimeError("asyncio.run() cannot be called from a running event loop")

    loop = events.new_event_loop()
    try:
        events.set_event_loop(loop)
        loop.set_debug(debug)
        # 把主协程包成 Task 并跑到底
        return loop.run_until_complete(main)
    finally:
        # 取消遗留任务
        try:
            _cancel_all_tasks(loop)
            loop.run_until_complete(loop.shutdown_asyncgens())
        finally:
            events.set_event_loop(None)
            loop.close()
```

关键步骤：

1. **检查无运行循环**：`_get_running_loop()` 返回当前线程绑定到"正在运行"状态的循环。若有，拒绝。这就是"每线程一个运行循环"的约束点。
2. **新建并设置循环**：`new_event_loop()` 创建一个裸循环，`set_event_loop(loop)` 把它设为当前线程的"当前循环"（`get_event_loop()` 能拿到的那个）。
3. **`run_until_complete(main)`**：把主协程包成 Task，进入循环的 `_run_once` 循环，反复执行就绪回调直到 Task 完成，返回其结果。
4. **清理**：取消所有未完成的 Task（发 `CancelledError`，让它们有机会 `finally` 清理）、等待取消传播、关闭异步生成器。
5. **拆循环**：把当前线程的循环设回 None，`loop.close()` 释放 selector、管道等资源。

因此 `asyncio.run` 是一个"自包含、线程局部、一次性"的入口。它既创建了循环，又设置了线程局部绑定，又驱动了协程——这就是为什么在它"内部"（同一调用栈、协程被驱动期间）不能再 `asyncio.run`：线程已经开始运行循环了。

### 4.3 run_coroutine_threadsafe 如何跨线程提交

这是最值得理解的一段机制。`run_coroutine_threadsafe(coro, loop)` 的目标：**调用方在 A 线程，循环在 B 线程运行中**，把协程安全地交给 B 执行，结果回传 A。

核心步骤（简化）：

```python
def run_coroutine_threadsafe(coro, loop):
    # 1. 创建一个"跨线程"的 Future（concurrent.futures.Future，线程安全）
    future = concurrent.futures.Future()

    # 2. 定义一个回调：在 loop 线程里把 coro 包成 Task 并把结果/异常写回 future
    def callback():
        try:
            # task 是 asyncio.Task，绑定在 loop 上
            task = loop.create_task(coro)
            def _done(t):
                if t.cancelled():
                    future.cancel()
                elif t.exception() is not None:
                    future.set_exception(t.exception())
                else:
                    future.set_result(t.result())
            task.add_done_callback(_done)
        except Exception as e:
            # 包成 task 失败（coro 不合法等）
            future.set_exception(e)

    # 3. 用 call_soon_threadsafe 把 callback 排进 loop 的就绪队列
    loop.call_soon_threadsafe(callback)

    return future
```

几个关键点：

- **`loop.call_soon_threadsafe`** 是 asyncio 循环里**唯一**可以安全地从其他线程调用的方法。它内部会通过线程安全的通知机制（通常是一个自管道/锁）唤醒目标循环的 `_run_once`，把 callback 加入就绪队列。普通的 `loop.call_soon` **不是**线程安全的。
- **协程始终在 B 线程执行**：`callback` 在 B 线程被调度，它创建的 Task 也在 B 线程被驱动。A 线程只是持有一个 `concurrent.futures.Future` 在等。
- **结果回传**：Task 完成后 `_done` 把结果/异常 `set_result`/`set_exception` 到 `concurrent.futures.Future`。这个 Future 的实现保证：一旦 set，在任意线程调用 `.result()` 会立刻返回（或抛异常），未 set 则阻塞调用线程。
- **A 线程 `.result(timeout)` 阻塞**：`concurrent.futures.Future.result` 内部用条件变量 `Condition` 等待结果或超时。这点和 asyncio Future 不同——asyncio Future 的 `.result()` 非阻塞且不传 timeout。

### 4.4 为什么每线程只能有一个运行循环

asyncio 用一个**线程局部变量** `_local` 存当前线程的"运行循环"（running loop）。`events._set_running_loop(loop)` / `_get_running_loop()` 操作的就是它。一个循环进入 `run_forever`/`run_until_complete` 时会把自己设为当前线程的 running loop，退出时清除。

这个约束的逻辑：

- 事件循环的核心是 `selector.select(timeout)` 阻塞等待 I/O 就绪，然后跑就绪 callback。一个线程同一时刻只能有一个这样的阻塞点在跑——否则调度就乱了（谁该 select？谁处理回调？）。
- 协程的 `await` 隐式依赖"当前线程的 running loop"来安排恢复：`asyncio.get_running_loop()` 在 `await` 链路里被频繁调用。如果同一线程有两个循环都在运行，`get_running_loop()` 就无法确定该返回哪个。

所以在已运行循环的线程里 `asyncio.run`（它试图把新循环设为 running）会冲突，被 `_get_running_loop() is not None` 直接拒绝。跨线程时另当别论——A 线程没有运行循环，B 线程有，A 想驱动协程就借 B 的循环（`run_coroutine_threadsafe`），或者自己在 A 里新建一个（`asyncio.run`，前提 A 确实无运行循环）。

### 4.5 loop.run_until_complete 的驱动循环

`run_until_complete` 比 `run_forever` 简单：它把传入协程包成 Task，注册一个 `done_callback` 在 Task 完成时调用 `loop.stop()`，然后调用 `run_forever`。`run_forever` 内部是 `while True: _run_once()`，`_run_once` 一次循环：

1. 计算超时（最近就绪定时器距离现在的时间）；
2. `selector.select(timeout)` 阻塞等就绪 I/O；
3. 把就绪 I/O 回调 + `call_soon` 排队的回调加入就绪队列；
4. 逐个执行就绪回调（这里会驱动 Task 的 `__step`，让协程 `SEND` 一次）。

当 Task 完成，`stop()` 被调用，`run_forever` 退出 `while`，`run_until_complete` 返回 Task 的结果。因为不检查 `_get_running_loop()`（它假设调用者保证循环没在跑），如果误在运行中循环调用会抛 `RuntimeError: This event loop is already running`。

### 4.6 concurrent.futures.Future 与 asyncio.Future 的区别

桥接时容易混淆这两种 Future，梳理一下：

| 维度 | `asyncio.Future` | `concurrent.futures.Future` |
|-----|------------------|----------------------------|
| 所属 | asyncio，绑定循环 | concurrent.futures，线程安全 |
| 结果等待 | `await fut`（不能 `.result(timeout)` 阻塞） | `fut.result(timeout)` 阻塞 |
| 回调 | `add_done_callback`，在循环线程调 | `add_done_callback`，立即在线程池调 |
| 取消 | `cancel()` 由循环处理 | `cancel()` 语义弱 |
| 用途 | 协程内部 | 跨线程/同步侧 |

`run_coroutine_threadsafe` 故意返回 `concurrent.futures.Future`，正是为了让同步线程能用 `.result(timeout)` 阻塞等待。若把 asyncio Future 暴露给同步线程，`await` 不可用、`.result()` 又不阻塞，阻塞等待无法实现。

### 4.7 桥接中的异常传播路径

理解异常如何从协程传到同步侧，能帮你在出错时定位责任点。

- **`asyncio.run(coro)`**：协程内未捕获的异常会沿 `run_until_complete → asyncio.run` 原样抛回调用同步函数的栈。例如 `asyncio.run(boom())` 在 `boom` 内 `raise ValueError`，`ValueError` 直接出现在 `asyncio.run` 调用处。这与"协程被循环驱动时的异常"行为一致：循环不会吞异常，只是把它存到 Task 上再由 `run_until_complete` 取出重抛。
- **`run_coroutine_threadsafe(coro, loop)`**：协程异常被 Task 的 `exception()` 取出，经 `future.set_exception(e)` 写入 `concurrent.futures.Future`，最终在调用线程的 `fut.result()` 处抛出。若调用方不调 `result()`（fire-and-forget），异常会被 Future 内部记录但不传播——这是"静默丢失"的常见坑，建议永远 `result()` 或加 `add_done_callback` 兜底。
- **`CancelledError`**：若 Task 被取消，`concurrent.futures.Future` 也会被 `cancel()`，调用方 `result()` 抛 `CancelledError`。这与 asyncio Future 语义一致，只是类型来自 `concurrent.futures`。

```python
import asyncio
import threading


async def boom() -> None:
    raise ValueError("协程内异常")


def main() -> None:
    loop = asyncio.new_event_loop()
    t = threading.Thread(target=loop.run_forever, daemon=True)
    t.start()

    fut = asyncio.run_coroutine_threadsafe(boom(), loop)
    try:
        fut.result(timeout=5)
    except ValueError as e:
        print(f"同步侧捕获: {e}")

    loop.call_soon_threadsafe(loop.stop)
    t.join()
    loop.close()


if __name__ == "__main__":
    main()
```

```
# 输出：
# 同步侧捕获: 协程内异常
```

### 4.8 嵌套调用的边界

把整套机制串起来看边界：

- **同步函数 A** → 想跑协程 → 用 `asyncio.run(coro)` 自建循环（A 线程此时无运行循环）。
- **协程 B**（在 A 的循环里跑）→ 想跑另一个协程 C → 直接 `await C()`（不能 `asyncio.run`，会报 already running）。
- **协程 B** → 想调阻塞同步函数 D → `await loop.run_in_executor(None, D, ...)`（不能直接 `D()`，会卡循环）。
- **同步线程 E** → 想把协程交给 A 线程循环（A 的循环在运行） → `run_coroutine_threadsafe(coro, loop)` + `fut.result()`。
- **同步线程 E** → 自己没有可借的循环 → 直接 `asyncio.run(coro)`（E 线程无运行循环）。

记住"每线程一个运行循环"和"协程必须由循环驱动"两条铁律，所有桥接选择都由此推出。

---

## 5. 总结

**本文内容要点**

- 协程对象不会自动执行；同步函数既不能直接 call 协程驱动它，也不能 `await`（语法限制）。从同步世界进入异步世界需要桥接层。
- `asyncio.run(coro)` 是 3.7+ 推荐入口：自建循环、驱动单协程、清理资源、返回结果。要求当前线程无运行循环。
- `asyncio.run_coroutine_threadsafe(coro, loop)` 用于跨线程：把协程通过 `call_soon_threadsafe` 提交到另一线程正在运行的循环，返回 `concurrent.futures.Future`，调用线程 `.result(timeout)` 阻塞等待。多线程混用、GUI/WSGI 桥接的标配。
- `loop.run_until_complete(coro)` 是旧式显式驱动，需手动管理循环；适合循环复用或维护旧代码。
- 在已有运行循环的线程里再调 `asyncio.run` 会抛 `RuntimeError: cannot be called from a running event loop`；`asyncio.run` 不能嵌套。协程里跑协程直接 `await`。
- 阻塞同步代码不应靠"包成协程再 run"假装异步，它仍会卡死循环；正确做法是 `loop.run_in_executor` 隔离到线程池（留第 14 篇详讲）。
- 选择口诀：同步入口一次性 → `asyncio.run`；同步线程借另一线程循环 → `run_coroutine_threadsafe`；循环复用/旧码 → `run_until_complete`；异步里调阻塞同步 → `run_in_executor`。

**原理侧要点**

- 协程执行依赖事件循环这一运行时上下文；同步函数没有该上下文，故不能 `await`。
- `asyncio.run` 检查无运行循环 → 新建并设置循环 → `run_until_complete` 驱动主协程 → 取消遗留任务、关闭异步生成器 → 拆循环。
- `run_coroutine_threadsafe` 用 `call_soon_threadsafe` 把"包 Task + 写回 Future"的 callback 排进目标循环；协程在目标线程执行，结果通过线程安全的 `concurrent.futures.Future` 回传。
- 每线程最多一个运行循环（线程局部变量 + select 阻塞点唯一性）；这是 `asyncio.run` 不可在有运行循环的线程调用的根因。
- `concurrent.futures.Future` 与 `asyncio.Future` 不同：前者跨线程、支持 `.result(timeout)` 阻塞；后者绑定循环、用 `await`。

**读完本文你应能掌握**

- 说清"协程为什么不能在同步函数里直接 call 或 await"的根本原因。
- 针对"程序入口同步函数跑协程""工作线程把协程提交到主线程循环""GUI 同步回调里跑异步任务""旧代码复用循环"等场景，正确选择 `asyncio.run` / `run_coroutine_threadsafe` / `run_until_complete`。
- 解释 `asyncio.run` 为什么不能在已有运行循环的线程调用、不能嵌套，并给出"协程里跑协程用 `await`"的正确替代。
- 写出跨线程桥接的最小骨架：`run_coroutine_threadsafe(coro, loop)` + `fut.result(timeout=)`，并说明协程实际在哪个线程执行、结果如何回传。
- 区分 `concurrent.futures.Future` 与 `asyncio.Future`，说明为何 `run_coroutine_threadsafe` 返回前者。
- 判断"阻塞同步代码不能直接塞进协程"的错误并指出应使用 `run_in_executor`。