---
group:
  title: 【18】异步协程
  order: 18
order: 14
title: 异步代码调用同步代码
nav:
  title: Python
  order: 1
---

## 1. 介绍

### 1.1 什么是"异步代码调用同步代码"

在异步编程里，协程（`async def` 函数）是运行在事件循环单线程之上的轻量任务。协程之所以"轻"、之所以能成百上千地并发，靠的不是多线程，而是一个约定：**协程在遇到等待时主动 `await` 让出控制权**，事件循环借此在协程之间切换，让 CPU 始终忙于"有活干"的那个协程，而不是傻等。

然而现实世界里，你不可能把所有代码都重写成异步的。你手里有成品的同步库——`requests` 做 HTTP、`psycopg2` 连 PostgreSQL、`time.sleep` 做延时、某个同事写的纯计算函数——它们都是阻塞的同步函数。所谓"异步代码调用同步代码"，就是指：**在一个 `async def` 协程里，去调用这些会阻塞线程的同步函数**。

这事本身不可避免，也不该避免——异步不是"消灭同步"，而是"安排同步"。问题在于"怎么调"。调得不对，同步函数一阻塞，事件循环线程就被钉死在那一次系统调用上，所有其它协程无论多紧急都得排队等着，这是异步程序最常见的性能杀手。调得对，把阻塞函数委托到线程池或进程池里跑，当前协程 `await` 让出，事件循环继续服务其它协程，阻塞完毕再回来取结果——这才是异步该有的样子。

本篇讲的就是这条分界线：什么样的同步调用会要命，什么样的委托方式能救命，以及为什么。

### 1.2 核心问题与正确姿势的预览

先把这个知识点最核心的一句话摆在这里，后面所有内容都是对它的展开：

> **在协程里直接调用阻塞同步函数，会阻塞整个事件循环；正确做法是把它委托到线程池或进程池里执行，协程 `await` 这个委托，期间事件循环可继续调度其它协程。**

对应的两个标准 API：

```python
import asyncio
import time

# 一个阻塞的同步函数（不知道也不关心 async 的存在）
def blocking_sleep(seconds):
    time.sleep(seconds)
    return f"睡了 {seconds} 秒"

async def main():
    # 错误：直接调，循环被卡住
    # blocking_sleep(2)

    # 正确（3.9+ 推荐写法）：委托到默认线程池
    result = await asyncio.to_thread(blocking_sleep, 2)
    print(result)

asyncio.run(main())
```

`asyncio.to_thread(func, *args, **kwargs)` 是 Python 3.9 起提供的人性化 API，它的底层就是 `loop.run_in_executor(None, func, *args)`。`None` 表示用事件循环的默认线程池（`concurrent.futures.ThreadPoolExecutor`）。两者等价，选哪个看可读性与版本兼容性。

下面先从"为什么直接调会出事"开始讲透，再逐个讲标准 API 的用法。

## 2. 核心内容

### 2.1 反面教材：协程里直接调阻塞函数

**直接调用的灾难**

要理解正确做法，先看清错误做法为什么错。看下面这个对比例子：一个协程里用 `time.sleep`（同步阻塞），另一个协程里用 `asyncio.sleep`（异步让出）。两者都启动，期望它们并发执行。

```python
import asyncio
import time

async def sync_blocker():
    print("[sync_blocker] 开始，准备直接调 time.sleep(2)")
    # 直接调用同步阻塞函数——事件循环线程在这里被钉死 2 秒
    time.sleep(2)
    print("[sync_blocker] 结束")

async def async_task():
    print("[async_task] 我是另一个协程，我希望和 sync_blocker 并发")
    await asyncio.sleep(1)
    print("[async_task] 我醒了，这一句本应 1 秒后就打印")

async def main():
    start = time.perf_counter()
    # 两个协程一起启动，期望并发
    await asyncio.gather(sync_blocker(), async_task())
    print(f"总耗时: {time.perf_counter() - start:.2f}s")

asyncio.run(main())
```

```python
# 输出：
# [sync_blocker] 开始，准备直接调 time.sleep(2)
# [async_task] 我是另一个协程，我希望和 sync_blocker 并发
# （此处真实停顿约 2 秒——time.sleep 把循环卡住了，asyncio.sleep(1) 根本得不到调度）
# [sync_blocker] 结束
# [async_task] 我醒了，这一句本应 1 秒后就打印
# 总耗时: 2.00s
```

分析这段输出：`async_task` 在启动后立刻打印了第一句，然后 `await asyncio.sleep(1)`——这本该让它 1 秒后醒来。但紧接着事件循环把执行权交给了 `sync_blocker`，后者直接 `time.sleep(2)`。`time.sleep` 是一个 C 层面的系统调用，它不会 `await`、不会让出、不会通知事件循环，它就是把当前线程挂起 2 秒。而事件循环和 `sync_blocker` 跑在同一个线程里，于是整个循环被冻住 2 秒。`asyncio.sleep(1)` 那个 1 秒定时器虽然到期了，却没人来处理它的回调——因为循环线程在睡觉。结果就是 `async_task` 醒来的时间被推迟到 2 秒之后，两个协程实际是串行的。

这就是"阻塞同步函数直接调"的本质危害：**不是它慢，而是它让所有人都跟着慢**。一个 `time.sleep(2)` 卡掉的不只是这 2 秒，是这 2 秒内本该被调度的所有协程的所有工作。

**哪些函数属于"阻塞同步函数"**

判断一个函数会不会阻塞事件循环，标准很简单：**它会不会在执行过程中长时间不归还控制权给调用者**。常见的几类：

- **同步 IO 阻塞**：`time.sleep`、`requests.get`、同步数据库驱动（`psycopg2`、`pymysql`、`sqlite3`）、同步文件 IO（`open().read()` 大文件）、同步网络套接字。这些函数内部最终都会落到 `read`/`write`/`poll` 等系统调用上，线程在系统调用里挂起等待。
- **CPU 密集计算**：大循环、数值计算、正则匹配超长文本、序列化反序列化大对象、图片处理。这些不会"等 IO"，但它霸占 CPU 不放，循环线程算多久，其它协程就等多久。
- **第三方同步库的阻塞调用**：老旧的 SDK、没有异步版本的客户端、某些用了锁或条件变量的同步原语。

一个常见的误判：有人觉得"我这个函数只阻塞 50 毫秒，无所谓"。单个 50 毫秒确实不长，但如果你在一个高频处理的协程里每次都调，或者同时有十个协程都在等它让出，累计影响就很可观。异步程序的延迟敏感度通常比同步程序高——你追求的是 ms 级响应，50ms 的卡顿就是 5% 的退化。

### 2.2 `asyncio.to_thread` —— 3.9+ 的人性化 API

**`to_thread` 的作用与签名**

`asyncio.to_thread(func, /, *args, **kwargs)` 是 Python 3.9 引入的便捷函数，它把一个同步函数提交到默认线程池执行，并返回一个可 `await` 的协程，`await` 拿到的就是同步函数的返回值。

签名要点：

- `func`：任意可调用的同步函数（普通 `def` 函数、`lambda`、绑定的方法都行）。
- `*args`：位置参数，原样传给 `func`。
- `**kwargs`：关键字参数，原样传给 `func`。
- 返回值：协程，`await` 后得到 `func()` 的返回值；`func` 抛异常时，异常会透传到 `await` 处。

它等价于 `await loop.run_in_executor(None, functools.partial(func, *args, **kwargs))`，只是写法更短、更符合直觉。

**基本用法：用 `to_thread` 包装 `time.sleep`**

把 2.1 节那个反面教材改对：

```python
import asyncio
import time

async def sync_blocker_fixed():
    print("[sync_blocker_fixed] 开始，用 to_thread 包装 time.sleep(2)")
    # time.sleep 在线程池里跑，当前协程 await 让出
    await asyncio.to_thread(time.sleep, 2)
    print("[sync_blocker_fixed] 结束")

async def async_task():
    print("[async_task] 我是另一个协程")
    await asyncio.sleep(1)
    print("[async_task] 我醒了，1 秒刚到就打印")

async def main():
    start = time.perf_counter()
    await asyncio.gather(sync_blocker_fixed(), async_task())
    print(f"总耗时: {time.perf_counter() - start:.2f}s")

asyncio.run(main())
```

```python
# 输出：
# [sync_blocker_fixed] 开始，用 to_thread 包装 time.sleep(2)
# [async_task] 我是另一个协程
# [async_task] 我醒了，1 秒刚到就打印
# （sync_blocker_fixed 在线程池里睡满 2 秒）
# [sync_blocker_fixed] 结束
# 总耗时: 2.00s
```

关键变化：`async_task` 这次在 1 秒整就打印了醒来，没有被推迟。因为 `time.sleep(2)` 跑在另一个线程里，事件循环线程没有被阻塞，它可以正常处理 `asyncio.sleep(1)` 的到期回调。总耗时仍是 2 秒（那是 `sync_blocker_fixed` 本身的 sleeps 时间），但两个协程现在是真正并发的。

**带参数和返回值**

```python
import asyncio

def add(a, b, *, label):
    """一个普通同步函数，带位置参数和关键字参数"""
    result = a + b
    return f"[{label}] {a} + {b} = {result}"

async def main():
    # 位置参数和关键字参数都原样透传
    msg = await asyncio.to_thread(add, 3, 4, label="求和")
    print(msg)

asyncio.run(main())
```

```python
# 输出：
# [求和] 3 + 4 = 7
```

`to_thread` 对参数的处理是透明的——你传什么，`func` 就收到什么。返回值也原样回来。这让它在包装已有同步函数时几乎零成本。

**异常透传**

```python
import asyncio

def risky(n):
    if n < 0:
        raise ValueError("不接受负数")
    return n * 2

async def main():
    try:
        # 同步函数在线程里抛的异常，会被 to_thread 透传到 await 处
        await asyncio.to_thread(risky, -5)
    except ValueError as e:
        print(f"捕获到: {e}")
    # 正常路径
    print(await asyncio.to_thread(risky, 10))

asyncio.run(main())
```

```python
# 输出：
# 捕获到: 不接受负数
# 20
```

这一点很重要：你不需要为了让异常能被捕获而做任何特殊处理，`to_thread` 会把线程里抛的异常原封不动地重新抛到 `await` 的地方，`try/except` 照常写。

### 2.3 `loop.run_in_executor` —— 底层通用 API

**`run_in_executor` 的作用与签名**

`asyncio.to_thread` 是糖，底下真正干活的是 `AbstractEventLoop.run_in_executor(executor, func, *args)`。这个 API 更通用，体现在三方面：

1. 可以指定**自定义的 `Executor`**——线程池或进程池都可以传，而 `to_thread` 只能用默认线程池。
2. 可以拿到 `concurrent.futures.Future`（在 Python 3.8+ 它已经是 `Future`-like，`await` 即可），方便和 `concurrent.futures` 生态对接。
3. 兼容 3.9 以下版本——老项目没 `to_thread` 可用时，它是唯一选择。

签名要点：

- `executor`：`concurrent.futures.Executor` 实例，传 `None` 表示用默认线程池。
- `func`：要执行的同步函数。
- `*args`：位置参数。注意：`run_in_executor` **不支持**关键字参数，要传 kwargs 得用 `functools.partial` 包一层。
- 返回值：可 `await` 的 Future，`await` 得到 `func(*args)` 的结果。

**默认线程池用法**

```python
import asyncio
import time

def blocking_work(seconds, tag):
    time.sleep(seconds)
    return f"[{tag}] 完成，耗时 {seconds}s"

async def main():
    loop = asyncio.get_running_loop()
    # None = 默认线程池
    result = await loop.run_in_executor(None, blocking_work, 1, "A")
    print(result)

asyncio.run(main())
```

```python
# 输出：
# [A] 完成，耗时 1s
```

**传关键字参数要用 `partial`**

```python
import asyncio
import functools

def greet(name, *, polite=True):
    prefix = "您好" if polite else "嘿"
    return f"{prefix}, {name}"

async def main():
    loop = asyncio.get_running_loop()
    # run_in_executor 不收 kwargs，用 partial 固化关键字参数
    msg = await loop.run_in_executor(None, functools.partial(greet, "张三", polite=False))
    print(msg)

asyncio.run(main())
```

```python
# 输出：
# 嘿, 张三
```

这是 `run_in_executor` 比 `to_thread` 麻烦的地方：`to_thread` 直接收 `**kwargs`，而 `run_in_executor` 的签名只收 `*args`。要传关键字参数，用 `functools.partial(func, *args, **kwargs)` 生成一个已经绑定了参数的新可调用对象，再传给 `run_in_executor`。

**自定义线程池**

默认线程池的线程数是 `min(32, os.cpu_count() + 4)`（Python 3.8+ 默认值）。大多数 IO 阻塞场景够用，但如果你想精确控制并发度——比如限制对外部 API 的并发连接数——可以建自己的线程池：

```python
import asyncio
import time
from concurrent.futures import ThreadPoolExecutor

def fetch(url):
    # 模拟一个阻塞的网络请求
    time.sleep(1)
    return f"来自 {url} 的响应"

async def main():
    # 自定义线程池：最多 2 个线程并发
    # 这能间接限制对外部服务的并发请求数，避免压垮对方
    with ThreadPoolExecutor(max_workers=2) as pool:
        loop = asyncio.get_running_loop()
        tasks = [
            loop.run_in_executor(pool, fetch, f"url_{i}")
            for i in range(5)
        ]
        results = await asyncio.gather(*tasks)
        for r in results:
            print(r)

asyncio.run(main())
```

```python
# 输出：
# 来自 url_0 的响应
# 来自 url_1 的响应
# 来自 url_2 的响应
# 来自 url_3 的响应
# 来自 url_4 的响应
```

5 个请求、池子最多 2 线程，总耗时约 3 秒（2+2+1）。自定义池子让你能对"放进线程池的并发量"做硬上限，这在保护下游服务时很有用。

**`to_thread` 与 `run_in_executor` 怎么选**

| 维度 | `asyncio.to_thread` | `loop.run_in_executor` |
|---|---|---|
| 版本要求 | 3.9+ | 3.5+（老项目只能用它） |
| 默认池 | 只能用默认线程池 | 可传自定义线程池/进程池 |
| 参数传递 | 直接收 `*args, **kwargs` | 只收 `*args`，kwargs 要 `partial` |
| 可读性 | 高，像在调普通函数 | 中，显式但啰嗦 |
| 拿 Future | 否（直接返回协程） | 返回 Future，可与 `concurrent.futures` 对接 |

原则：**能用 `to_thread` 就用 `to_thread`**，它短、直观、够用。需要进程池、自定义线程池、或兼容老版本时，才退回 `run_in_executor`。

### 2.4 用 `to_thread` 包装 `requests` —— 过渡方案

**为什么不直接换 `aiohttp`**

`aiohttp` 是成熟的异步 HTTP 客户端，理想情况下异步项目里发请求就该用它。但现实里换库有成本：

- 老项目已经用 `requests` 写了几百处调用，逐个改 `aiohttp` 是大工程。
- `requests` 的 Session、认证、钩子、cookie 持久化等用法团队已经熟，换一套要重新踩坑。
- 某些基于 `requests` 的二次封装库（如 `requests-toolbelt`）没有异步对应物。

这时候，用 `to_thread` 把 `requests` 包一下，是个务实的过渡方案：**不改库、不改调用形式，只是把那一行 `requests.get(...)` 塞进线程池**。

**`requests.get` 的 `to_thread` 包装**

```python
import asyncio
import time
import requests  # 需安装：pip install requests

def fetch_sync(url):
    """同步阻塞的 requests 调用，会被线程池接走"""
    resp = requests.get(url, timeout=5)
    resp.raise_for_status()
    return resp.text

async def fetch(url):
    # 在协程里调同步库，用 to_thread 委托线程池
    return await asyncio.to_thread(fetch_sync, url)

async def main():
    urls = [
        "https://httpbin.org/delay/1",
        "https://httpbin.org/delay/1",
        "https://httpbin.org/delay/1",
    ]
    start = time.perf_counter()
    # 三个请求并发，各自占一个线程池线程
    results = await asyncio.gather(*(fetch(u) for u in urls))
    print(f"拿到 {len(results)} 个响应，总耗时 {time.perf_counter() - start:.2f}s")

asyncio.run(main())
```

```python
# 输出（实际 URL 响应有网络波动）：
# 拿到 3 个响应，总耗时 1.45s
```

三个各延时 1 秒的请求，总耗时约 1.4 秒而不是 3 秒——因为线程池里有多个线程同时发请求，每个线程自己阻塞自己的，事件循环在 `await` 期间空出来。这就是过渡方案的价值：**没换库，却拿到了并发收益**。

**封装成可复用的异步包装器**

如果项目里要包的同步函数多，可以写一个小工具把任意同步函数变成"可 await 的异步函数"，避免到处写 `to_thread`：

```python
import asyncio
import functools
import requests

def asyncify(func):
    """把同步函数装饰为'调用时返回协程'的异步函数"""
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        return await asyncio.to_thread(func, *args, **kwargs)
    return wrapper

# 用装饰器把 requests.Session 的方法包成异步的
class AsyncRequests:
    def __init__(self):
        self._session = requests.Session()

    @asyncify
    def get(self, url, **kwargs):
        return self._session.get(url, **kwargs)

    @asyncify
    def post(self, url, **kwargs):
        return self._session.post(url, **kwargs)

async def main():
    client = AsyncRequests()
    # 用起来像异步客户端，底下还是 requests + 线程池
    resp = await client.get("https://httpbin.org/get")
    print(f"状态码: {resp.status_code}")

asyncio.run(main())
```

```python
# 输出（实际响应有网络波动）：
# 状态码: 200
```

这种 `asyncify` 模式是"渐进式异步化"的常见手段：**先让接口长得像异步的，内部实现先靠线程池顶着**，等以后有空了再把 `requests` 换成 `aiohttp`，调用方代码几乎不用改。

**过渡方案的边界**

要清醒认识到：`to_thread` 包 `requests` 不是"真正的异步 HTTP"。它本质上是用线程池模拟并发，每个并发请求占一个 OS 线程。线程是重资源（默认栈 8MB、调度开销大），并发到几百个就开始吃力，到上千个就基本不可行。而原生异步（`aiohttp`）一个线程能扛上万并发连接。所以：

- 并发量小（几十、上百）：过渡方案完全够用，性价比极高。
- 并发量大（上千、上万）：必须上原生异步库，线程池方案顶不住。

过渡方案是"先用起来"，不是"长期方案"。

### 2.5 桥接阻塞 IO 库驱动

除了 `requests`，另一类常见的同步阻塞是**数据库驱动**。`psycopg2`（PostgreSQL）、`pymysql`（MySQL）、`sqlite3`（标准库）都是同步的，调用时线程阻塞在 socket read 上。在异步项目里用它们，同样要靠 `run_in_executor` 桥接。

**`sqlite3` 的桥接示例**

```python
import asyncio
import sqlite3
from pathlib import Path

def query_db(db_path, sql):
    """同步的 sqlite3 查询，放进线程池跑"""
    conn = sqlite3.connect(db_path)
    try:
        cur = conn.execute(sql)
        rows = cur.fetchall()
        return rows
    finally:
        conn.close()

async def main():
    db = Path("demo.db")
    # 先建表插点数据（略，假设已有）
    loop = asyncio.get_running_loop()
    # 同步 DB 调用委托线程池
    rows = await loop.run_in_executor(
        None, query_db, str(db), "SELECT name FROM users LIMIT 3"
    )
    for name, in rows:
        print(f"用户: {name}")

asyncio.run(main())
```

```python
# 输出（取决于 demo.db 内容）：
# 用户: 张三
# 用户: 李四
# 用户: 王五
```

**连接池的注意事项**

桥接数据库驱动时有个陷阱：**同步驱动自己的连接池，跑在线程池里时，连接被哪个线程拿到是随机的**。有些驱动的连接对象不是线程安全的（一个连接不能被多线程并发用），需要在 `query_db` 这类函数内部每次自己 `connect`、用完 `close`，或者用线程局部变量（`threading.local()`）给每个线程绑定独立连接。

成熟的做法是用异步原生驱动：PostgreSQL 用 `asyncpg`、MySQL 用 `aiomysql`、SQLite 用 `aiosqlite`。它们内部就是异步的，不需要桥接。`run_in_executor` 桥接是"没有原生异步驱动时的兜底"，不是首选。

### 2.6 CPU 密集任务用 `ProcessPoolExecutor`

**线程池对 CPU 密集无能为力**

前面所有例子都是 IO 阻塞——`time.sleep`、`requests`、数据库。这类任务放到线程池里有效，是因为 Python 的 GIL 在**IO 阻塞时会释放**：线程卡在系统调用上不占 CPU，其它线程能拿 GIL 干活。

但 CPU 密集任务不一样。纯 Python 的计算循环不主动让出 GIL（只在每 100 条字节码指令检查一次，且只在有其它线程等待时才让），即使你把它丢进线程池，多个 CPU 密集线程还是共享一把 GIL，**同一时刻只有一个线程在真正跑 Python 代码**。多核优势完全用不上，反而多了线程切换开销。

```python
import asyncio
import time
import hashlib

def hash_many(n):
    """CPU 密集：算 n 次 sha256"""
    h = hashlib.sha256()
    for i in range(n):
        h.update(b"x")
    return h.hexdigest()

async def main():
    loop = asyncio.get_running_loop()
    start = time.perf_counter()
    # 两个 CPU 密集任务，放默认线程池
    await asyncio.gather(
        loop.run_in_executor(None, hash_many, 2_000_000),
        loop.run_in_executor(None, hash_many, 2_000_000),
    )
    print(f"线程池耗时: {time.perf_counter() - start:.2f}s")

asyncio.run(main())
```

```python
# 输出（大致量级，单核机器看不出差异；多核机器你会发现线程池没比单跑快多少）：
# 线程池耗时: 1.20s
```

这个 1.2 秒里两个任务并没能真正并行——它们在抢同一把 GIL。

**`ProcessPoolExecutor` 跨进程绕开 GIL**

`concurrent.futures.ProcessPoolExecutor` 起的是独立进程，每个进程有自己的 GIL、自己的解释器、自己的内存空间。CPU 密集任务丢进去，每个进程独占一个核，真正的多核并行。

```python
import asyncio
import time
import hashlib
from concurrent.futures import ProcessPoolExecutor

def hash_many(n):
    """同样的 CPU 密集函数，但在子进程里跑"""
    h = hashlib.sha256()
    for i in range(n):
        h.update(b"x")
    return h.hexdigest()

async def main():
    loop = asyncio.get_running_loop()
    start = time.perf_counter()
    # 用进程池：每个任务一个进程，绕过 GIL，真并行
    with ProcessPoolExecutor() as pool:
        results = await asyncio.gather(
            loop.run_in_executor(pool, hash_many, 2_000_000),
            loop.run_in_executor(pool, hash_many, 2_000_000),
        )
    print(f"进程池耗时: {time.perf_counter() - start:.2f}s")
    print(f"结果长度: {len(results[0])}, {len(results[1])}")

asyncio.run(main())
```

```python
# 输出（多核机器上，进程池通常明显快于线程池）：
# 进程池耗时: 0.65s
# 结果长度: 64, 64
```

同样的计算量，进程池在多核机器上大约能快接近一倍（两个核真并行 vs 一个核串行）。具体加速比取决于核数和任务切分，但至少能用到多核。

**`ProcessPoolExecutor` 的代价**

进程池不是银弹，它有不容忽视的代价：

- **启动开销大**：进程比线程重得多，创建一个进程池要 fork/spawn 子进程，首次任务有几十到几百毫秒的启动延迟。
- **数据要序列化**：父进程把参数 pickle 后通过管道发给子进程，子进程把结果 pickle 发回。大对象、不可 pickle 的对象都不能用。
- **子进程异常孤立**：子进程崩了不影响主进程，但调试更麻烦（栈跟踪要跨进程）。
- **全局状态不共享**：子进程拿到的是父进程 fork 时的快照，之后各自修改各自的，内存对账要靠返回值。

判断标准：**IO 阻塞用线程池，CPU 密集用进程池**。这条区分线几乎不会错。

### 2.7 一次性提交多个任务的模式

实际项目里经常需要"把一批同步调用一起丢进线程池并发跑"。有两种写法。

**写法一：`gather` + 多个 `run_in_executor`**

```python
import asyncio
import time

def process_item(item_id):
    time.sleep(0.5)  # 模拟阻塞处理
    return f"item_{item_id} 已处理"

async def main():
    loop = asyncio.get_running_loop()
    start = time.perf_counter()
    # 一行一个，用 gather 聚合
    results = await asyncio.gather(*[
        loop.run_in_executor(None, process_item, i)
        for i in range(6)
    ])
    print(f"耗时 {time.perf_counter() - start:.2f}s, 结果数 {len(results)}")

asyncio.run(main())
```

```python
# 输出：
# 耗时 0.51s, 结果数 6
```

6 个各 0.5 秒的任务，总耗时 0.5 秒——默认线程池有多个线程，6 个任务并发跑完。注意默认线程池线程数可能少于 6，这种短任务会被分批调度，但只要单任务时间够短，总体仍是并发的。

**写法二：配合自定义池限流**

当任务数远大于线程数，又想精确控制并发度时，用自定义池 + `gather`：

```python
import asyncio
import time
from concurrent.futures import ThreadPoolExecutor

def process_item(item_id):
    time.sleep(0.5)
    return f"item_{item_id} 已处理"

async def main():
    # 限制最多 3 个线程并发
    with ThreadPoolExecutor(max_workers=3) as pool:
        loop = asyncio.get_running_loop()
        start = time.perf_counter()
        results = await asyncio.gather(*[
            loop.run_in_executor(pool, process_item, i)
            for i in range(6)
        ])
        print(f"耗时 {time.perf_counter() - start:.2f}s")
    # 6 个任务 / 3 线程 = 2 批，每批 0.5 秒

asyncio.run(main())
```

```python
# 输出：
# 耗时 1.01s
```

3 线程跑 6 个各 0.5 秒的任务，分两批，总耗时约 1 秒。自定义池给了你对并发的硬控制——这对保护外部资源（数据库、第三方 API）至关重要。

### 2.8 `run_in_executor` 返回的 Future 与回调

`loop.run_in_executor` 返回的是 `asyncconcurrent.futures.Future` 的 awaitable 包装。除了 `await`，你还可以给它挂"完成回调"，适合那种"不必等结果、做完通知一声就行"的场景。

```python
import asyncio
import time
import functools

def slow_compute(n):
    time.sleep(1)
    return n * n

def on_done(fut, label):
    # 回调在线程池线程或循环线程里被调用，取决于是哪种 Future
    try:
        value = fut.result()
    except Exception as e:
        print(f"[{label}] 失败: {e}")
    else:
        print(f"[{label}] 完成: {value}")

async def main():
    loop = asyncio.get_running_loop()
    fut = loop.run_in_executor(None, slow_compute, 7)
    # 挂回调（partial 固化 label 参数）
    fut.add_done_callback(functools.partial(on_done, label="平方任务"))
    # 不 await，继续干别的
    print("主协程继续干别的，等回调通知")
    await asyncio.sleep(2)  # 给回调留时间
    print("主协程收尾")

asyncio.run(main())
```

```python
# 输出：
# 主协程继续干别的，等回调通知
# [平方任务] 完成: 49
# 主协程收尾
```

实际项目里更常见的是直接 `await` 拿结果，回调模式适合"fire and forget"的后台任务。但要小心：**回调里别做重活**，它在事件循环线程上执行时会阻塞循环（对于 asyncio Future 的回调而言）。重活留给线程池，回调只做"记录结果、触发下一步"的轻量动作。

## 3. 最佳实践

**认清"async 包裹"不等于真异步**

最常见的误区：以为给一个函数加 `async`、里面调同步阻塞代码，就"异步化"了。

```python
import asyncio
import time

# 不推荐：以为加了 async 就异步了，其实 time.sleep 一样卡死循环
async def fake_async_work():
    time.sleep(2)  # 这一行直接阻塞循环线程
    return "done"

# 推荐：要么换异步原生（asyncio.sleep），要么委托线程池
async def real_async_work():
    await asyncio.to_thread(time.sleep, 2)
    return "done"
```

`async def` 只是声明"这个函数是协程、可以被 await"，它不会自动让你调用的同步函数变成非阻塞的。内部只要有一次直接调阻塞函数，循环就会被卡。判断一个 `async def` 是不是"真异步"，看它内部有没有 `await` 让出点——没有让出点的 `async def` 比同步函数还糟（多了协程包装开销却没拿到并发收益）。

**按阻塞类型选池子**

- IO 阻塞（`sleep`、`requests`、同步 DB 驱动、同步文件读写）：线程池（`to_thread` 或 `run_in_executor(None, ...)`）。
- CPU 密集（纯计算、哈希、压缩、图像处理）：进程池（`ProcessPoolExecutor`）。
- 不确定时，先问"它卡在哪"：卡在 `read/write` 系统调用上是 IO 阻塞，卡在 Python 字节码循环上是 CPU 密集。

**控制并发量，别无限往池子里塞**

```python
# 不推荐：1000 个任务一起提交，线程池爆满、下游服务被打挂
await asyncio.gather(*[loop.run_in_executor(None, fetch, u) for u in urls])

# 推荐：用 Semaphore 限制同时在飞的请求数
sem = asyncio.Semaphore(10)
async def fetch_one(u):
    async with sem:
        return await asyncio.to_thread(fetch, u)
await asyncio.gather(*[fetch_one(u) for u in urls])
```

`to_thread` 用的是默认线程池，线程数有限（默认 `min(32, cpu+4)`），但提交的任务数没有上限——任务远多于线程时它们会排队，看着像"都提交了"，其实并发度还是池子的线程数。但对外部服务来说，"排队的任务"意味着"未来会发的请求"，总归会发出去，给下游的压力不一定小。用 `Semaphore` 在异步层限流，比依赖池子更可控。

**保持同步函数纯净**

委托给线程池的同步函数应该是"自包含"的：参数都从入参来、结果都从返回值出、不在内部修改全局可变状态。原因有二：

1. 线程安全：同步函数在线程池里跑，它碰的全局变量可能被多线程并发访问，容易出竞态。
2. 调试性：自包含的函数好测、好复现；依赖外部状态的函数在线程池里出了问题很难查。

如果同步函数必须操作共享资源（比如同一个连接、同一个文件），用 `threading.Lock` 在同步函数内部保护，或干脆每个线程一份独立资源（`threading.local`）。

**`to_thread` 包 `requests` 是过渡，不是终点**

过渡方案能让你今天就把项目跑起来并发，但它的天花板在"线程数"。等项目流量上来、需要上百上千并发时，咬咬牙换成 `aiohttp`。技术上这是把"线程池里阻塞的 `requests.get`"换成"事件循环里异步的 `aiohttp.get`"，一个协程一个并发，不再吃线程资源。过渡期用 `asyncify` 装饰器把接口做成异步样子的好处就在这——换实现时调用方不用改。

**别在协程里 `time.sleep`**

这是最低级的错误，但也是最常见的。`time.sleep` 没有任何理由出现在 `async def` 里——要等就用 `await asyncio.sleep`。如果确实需要在一个已经写好的同步工具函数里延时，而那个函数又要被协程调，把它整体丢线程池即可，里面的 `time.sleep` 在线程池里阻塞的是工作线程，不是循环线程。

**CPU 密集即便 `to_thread` 也受 GIL**

第二常见的误解：以为 `to_thread` 能让 CPU 密集任务并行。不能。`to_thread` 用线程池，线程池里的 Python 代码受 GIL 约束，同一时刻只跑一个。CPU 密集要并行，只有进程池一条路。`asyncio.to_thread` 是 IO 阻塞的解决方案，不是 CPU 密集的解决方案。

**异常要原样捕获**

`to_thread` / `run_in_executor` 会把同步函数抛的异常透传到 `await` 处。捕获时按同步函数的异常类型来写 `except`，不需要额外的中间异常类型：

```python
import asyncio
import requests

async def fetch(url):
    try:
        return await asyncio.to_thread(requests.get, url, timeout=3)
    except requests.ConnectionError:
        # 直接捕 requests 的异常，不会被包成别的
        return None
    except requests.Timeout:
        return None
```

别因为是在异步里调，就以为要捕 `asyncio.*` 的异常——只有循环本身的错误（如 `CancelledError`）才是 `asyncio` 抛的，函数本身的异常保持原样。

**池子要管理生命周期**

自定义的 `ThreadPoolExecutor` / `ProcessPoolExecutor` 是显式资源，用完要关（`with` 语句最稳）。进程池尤其不能忘关——子进程不退出会变成僵尸进程，长期运行的服务会资源泄漏。默认线程池由事件循环管理，`asyncio.run` 退出时会自动清理，不用你操心。

**优先用原生异步库，桥接是兜底**

总的优先级：

1. 有原生异步库就用原生异步库（`aiohttp`、`asyncpg`、`aiomysql`、`aiosqlite`、`aiofiles`）。
2. 没有或换不了，用 `to_thread` / `run_in_executor` 桥接同步库。
3. CPU 密集，用 `ProcessPoolExecutor`。

桥接方案的存在是为了让你"先用起来"，不是让你"一直凑合"。能用原生的就别桥接，原生异步省线程、省内存、可扩展性高一档。

## 4. 原理

### 4.1 事件循环的单线程模型

要理解"为什么直接调阻塞函数会卡死所有协程"、"为什么委托线程池就不卡"，必须先讲清事件循环是怎么跑的。

事件循环本质上是**一个单线程的调度器**。它维护几个关键数据结构：

- **就绪队列**：存"已经可以执行"的协程——要么是新创建的、要么是被某个事件唤醒的。
- **定时器堆**：存"到某个时间点才该执行"的回调，比如 `asyncio.sleep(1)` 注册的定时器。
- **IO 多路复用器**：`epoll`（Linux）/ `kqueue`（macOS）/ `IOCP`（Windows），监听一堆文件描述符，哪个 fd 有事件了就通知循环。

循环的主循环（伪代码）大致是这样：

```python
while not should_stop:
    # 1. 算出离最近定时器还有多久
    timeout = compute_timeout()
    # 2. 阻塞等待 IO 事件，最多等 timeout
    events = epoll.poll(timeout)
    # 3. 把就绪的 IO 事件对应的回调塞进就绪队列
    ready_queue.extend(callbacks_for(events))
    # 4. 把到期的定时器回调塞进就绪队列
    ready_queue.extend(expired_timers())
    # 5. 依次执行就绪队列里的所有回调（每个回调驱动一个协程前进一步）
    for cb in ready_queue.drain():
        cb()
```

关键的点：**第 5 步是单线程串行执行的**。一个回调开始执行，它就独占这个线程，直到它主动返回控制权（协程 `await` 一个未就绪的 Future 时，控制权回到循环）。循环不会"中断"正在执行的回调。这就是协程的"协作式调度"——任务自己决定什么时候让出，循环只是提供一个让出的机制。

`asyncio.sleep(1)` 的实现就是：注册一个 1 秒后的定时器，然后 `await` 一个未就绪的 Future。协程在这一步挂起，控制权回到循环，循环继续跑第 1-5 步。1 秒后定时器到期，回调把 Future 标记为就绪，协程被重新放进就绪队列，下一轮第 5 步恢复执行。

### 4.2 直接调阻塞函数时发生了什么

现在看直接调 `time.sleep(2)` 会怎样。`time.sleep` 是 C 实现，它直接调系统调用 `nanosleep`（或类似），把**当前线程**挂起 2 秒。它不知道 asyncio 的存在，不会注册定时器、不会 `await`、不会让出控制权。

执行过程：

1. 循环在第 5 步执行某个协程的回调，这个回调驱动协程跑到 `time.sleep(2)` 这一行。
2. `time.sleep(2)` 被调用，线程进入内核态、挂起。
3. 这 2 秒里，循环的第 1-5 步**一个都跑不了**——因为循环和这个协程在同一个线程，线程被 `nanosleep` 钉死了。
4. 这期间 `epoll.poll` 不被调用，所以其它 fd 的 IO 事件没人处理；定时器堆没人检查，所以 `asyncio.sleep(1)` 的定时器即使到期了也没人把它转成就绪回调。
5. 2 秒后 `nanosleep` 返回，`time.sleep` 返回，协程继续往下跑、跑完这一段、`await` 让出，循环才重新接管。
6. 循环这时才去检查"2 秒里积压了什么"——其它协程的定时器可能早就到期了，但它们的回调现在才能被执行，于是它们"醒来"的时间被推迟了整整 2 秒。

所以"直接调阻塞函数卡死所有协程"的本质是：**阻塞函数在系统调用层占住了循环线程，循环的调度机制（epoll + 定时器 + 就绪队列）整个停滞**。不是协程"不想跑"，是调度器"没空跑它们"。

CPU 密集的情况类似，只是不卡在系统调用上，而是卡在 Python 字节码循环里。一个 `for i in range(10**8)` 跑 5 秒，这 5 秒里循环线程在执行字节码，没回到事件循环主循环，效果和 `time.sleep(5)` 一样——其它协程全等。

### 4.3 `run_in_executor` / `to_thread` 的委托机制

`loop.run_in_executor(executor, func, *args)` 做了什么，能让阻塞函数不再卡循环？

**第一步：把函数提交给 Executor**

`executor`（线程池或进程池）有自己的工作线程/进程。`run_in_executor` 调用 `executor.submit(func, *args)`，这会立刻返回一个 `concurrent.futures.Future`，表示"这个任务已经在池子里了，将来会有结果"。`submit` 本身是非阻塞的，它只是把任务塞进池子的内部队列、立刻返回。

**第二步：把 `concurrent.futures.Future` 包成 asyncio Future**

`concurrent.futures.Future` 和 `asyncio.Future` 是两种 Future：前者是线程池/进程池的"将来有结果"承诺，后者是事件循环的"将来有结果"承诺。两者不能直接 `await`——asyncio 的 `await` 只认 asyncio Future 或协程。`run_in_executor` 内部用一个适配器（`futures.wrap_future`）把前者包成后者：它给 `concurrent.futures.Future` 挂一个完成回调，回调里把 asyncio Future 标记为就绪。

**第三步：当前协程 await 这个 asyncio Future，让出**

当前协程 `await` 这个 asyncio Future。Future 还没就绪（线程池还没跑完），所以协程挂起，控制权回到事件循环。**这是关键的一步**——协程让出了，循环线程空出来了，可以继续跑第 1-5 步，服务其它协程。

**第四步：线程池在工作线程里执行 `func`**

池子的某个工作线程从内部队列取出 `func(*args)`，开始执行。这个执行发生在另一个线程，它阻塞也好、算 CPU 也好，都是工作线程的事，和事件循环线程无关。`time.sleep(2)` 在工作线程里挂起 2 秒，循环线程该干嘛干嘛。

**第五步：完成后回调唤醒协程**

`func` 执行完毕（或抛异常），工作线程把结果/异常 `set_result`/`set_exception` 到 `concurrent.futures.Future` 上。这触发了第二步挂的完成回调。回调通过线程安全的方式（`loop.call_soon_threadsafe`）向事件循环投递一个"把这个 asyncio Future 标记为就绪"的任务。

> `call_soon_threadsafe` 是必要的——因为回调是在工作线程里触发的，而 asyncio Future 的状态修改必须在事件循环线程里做（asyncio 不是线程安全的）。`call_soon_threadsafe` 通过向循环的自管道（self-pipe）写一个字节来唤醒可能正阻塞在 `epoll.poll` 里的循环线程，然后把真正的回调放进就绪队列。

**第六步：循环在下一轮调度中恢复协程**

事件循环线程被自管道唤醒，从就绪队列取出"标记 asyncio Future 就绪"的任务执行，Future 变成就绪状态。原来 `await` 它的协程被重新放进就绪队列，下一轮第 5 步恢复执行，`await` 表达式返回 `func` 的结果（或抛出 `func` 的异常）。

整个流程的精髓：**阻塞发生在工作线程，让出发生在事件循环线程，两者解耦**。协程 `await` 让循环能继续服务别人，工作线程在后台慢慢跑阻塞函数，跑完了用线程安全的方式通知循环，循环再把协程唤回来。这就是"委托"的全部含义。

`asyncio.to_thread(func, *args, **kwargs)` 的实现就是把这些步骤打包：它拿到运行中的循环，调 `loop.run_in_executor(None, functools.partial(func, *args, **kwargs))`，返回那个可 await 的 asyncio Future。糖归糖，机制完全一样。

### 4.4 为什么线程池对 IO 阻塞有效、对 CPU 密集无效

**IO 阻塞时 GIL 会释放**

CPython 的 GIL 不是"一把锁锁死所有 C 调用"。它在 IO 系统调用（`read`/`write`/`select`/`sleep` 等）前会主动释放。所以 `time.sleep`、`requests.get`（内部 socket recv）、`sqlite3` 查询这些 IO 阻塞函数，在工作线程里执行时，GIL 是放开的——事件循环线程能拿到 GIL 继续跑协程。这就是 IO 阻塞适合线程池的原因：**阻塞的线程不占 GIL，循环线程能干活**。

**CPU 密集时 GIL 不释放**

纯 Python 的计算循环（`for i in range(n): x += i`）不触发任何 IO 系统调用，GIL 不释放。CPython 的 GIL 调度是"每 100 个字节码指令检查一次是否该让出"，但只在"有其它线程在等 GIL"时才让，而且让出是有成本的（线程切换）。实际效果是：多个 CPU 密集线程在抢 GIL，同一时刻只有一个在真跑 Python 代码，多核 CPU 的其它核闲着。所以 CPU 密集放线程池里，**并发度约等于 1**，没有多核加速。

**`ProcessPoolExecutor` 为什么能**

进程池起的是独立进程，每个进程有自己的 GIL。两个进程跑两个 CPU 密集任务，是两个独立 GIL、两个独立解释器、两个独立核——真并行。代价是进程间通信要 pickle，参数和返回值都得可序列化。但对 CPU 密集任务来说，这点序列化开销相对计算本身通常可以接受。

### 4.5 为什么"async 包裹阻塞代码"不算真异步

把一个同步函数外面套一层 `async def`，不会改变任何事：

```python
import time

def blocking():
    time.sleep(2)
    return "done"

# 这个 async 版本和 blocking 在阻塞行为上完全一样
async def fake_async():
    return blocking()  # 内部直接调，没有 await 让出点
```

`fake_async` 是协程，但它内部 `blocking()` 不 `await` 任何东西，执行流从 `blocking()` 进入、到 `time.sleep` 阻塞、到返回，全程没有一次让出。`await fake_async()` 时，事件循环把这个协程跑起来，协程一口气跑到 `time.sleep` 就把循环线程钉死了。

`async def` 只是给函数加了 `CO_COROUTINE` 标志、让它返回协程对象而不是直接执行。它不会给函数内部的调用注入任何"让出"行为。让出只能由 `await` 显式触发，而 `await` 只能作用在"未就绪的 awaitable"上（Future、协程、特定协议对象）。直接调用的同步函数不是 awaitable，不会触发让出。

所以判断一个 `async def` 是不是"真异步"，看它有没有真正的让出点：`await asyncio.*`、`await some_coroutine()`、`await loop.run_in_executor(...)`、`await asyncio.to_thread(...)`。如果整个函数体里没有一个有效的 `await`，它就是"披着异步皮的同步函数"，比明写同步还坑——调用者以为它是异步的、会和其它协程并发，实际上它会卡住所有协程。

这也解释了为什么 `asyncio.to_thread` 是"真异步"：它内部 `await` 了一个 asyncio Future（由 `run_in_executor` 创建），这个 Future 在线程池完成前是未就绪的，`await` 它会真正让出控制权。让出 → 循环跑别的 → 线程池在后台跑 → 完成回调唤醒 → 协程恢复，这才是异步的完整链条。

### 4.6 线程池的默认大小与线程安全

Python 3.8+ 的默认线程池（`asyncio` 在第一次需要时懒加载的 `ThreadPoolExecutor`）线程数是 `min(32, os.cpu_count() + 4)`。这个数字的来历：

- `cpu_count() + 4`：保证 IO 密集场景下有足够线程吸收阻塞，多出来的 4 个给非 IO 的同步调用留余量。
- 上限 32：避免在高端机器上起太多线程（线程是重资源，32 个线程的栈就 256MB 了）。

默认值对大多数场景够用，但有两个场景要自定义：

- **需要严格限流**：比如调外部 API 限并发 5，用 `max_workers=5` 的自定义池比用 Semaphore 直观。
- **任务异常多且短**：默认 32 线程可能不够，适当调大（但别超过几百）。

线程安全方面：`to_thread` 提交的同步函数在池子里的多个线程上可能并发执行。如果它操作共享可变状态（全局变量、闭包里的可变对象、文件、同一个 DB 连接），必须自己保证线程安全——用 `threading.Lock`、用不可变数据、或让每个线程有独立副本。asyncio 不会替你做这件事，`to_thread` 只负责"把函数丢到另一个线程跑"，不负责"保证多个线程跑同一个函数时是安全的"。

## 5. 总结

本文核心结论可以浓缩成一句话：**异步里调同步阻塞代码，直接调会卡死事件循环，委托到线程池（IO 阻塞）或进程池（CPU 密集）才安全**。围绕这条主线，本篇讲了：

- 直接在协程里调 `time.sleep`、`requests.get`、同步 DB 驱动、CPU 密集计算等阻塞函数，会钉死事件循环单线程，所有其它协程被冻住，这是异步最常见的性能杀手。
- `asyncio.to_thread(func, *args, **kwargs)`（3.9+）是包装同步函数的人性化 API，底层等价于 `loop.run_in_executor(None, func, *args)`，把函数丢进默认线程池，当前协程 `await` 让出，期间循环可继续调度其它协程。
- `loop.run_in_executor(executor, func, *args)` 是更通用的底层 API，支持自定义线程池、进程池，兼容 3.9 以下版本；不支持 kwargs，要传关键字参数用 `functools.partial`。
- IO 阻塞（`sleep`、`requests`、同步 DB、同步文件读写）用线程池——GIL 在 IO 系统调用时释放，循环线程能继续跑；CPU 密集用 `ProcessPoolExecutor`——GIL 不释放，线程池里多线程无法真并行，只有跨进程才能用上多核。
- `to_thread` 包 `requests` 是实用的过渡方案：不换库、不改调用形式、立刻拿到并发收益，适合老项目渐进异步化；但并发量上千时必须换原生异步库（`aiohttp` 等）。
- 常见陷阱：以为加 `async` 就异步了（内部仍直接调阻塞函数无济于事）、以为 `to_thread` 能解决 CPU 密集（受 GIL 仍串行）、自定义池子用完不关（进程池会泄漏子进程）。

读完本文你应能掌握：

- 能判断一个同步函数是否会阻塞事件循环，并说明阻塞时事件循环内部发生了什么。
- 能正确使用 `asyncio.to_thread` 和 `loop.run_in_executor` 把同步阻塞调用委托到线程池，写出 `await` 期间不卡住其它协程的代码。
- 能在 IO 阻塞与 CPU 密集之间正确选择线程池还是进程池，并说出为什么线程池对 CPU 密集无效（GIL）。
- 能用 `asyncify` 装饰器把 `requests` 等同步库包装成异步可用的形式，作为渐进式异步化的过渡手段。
- 能识别"假异步"（`async def` 内部无让出点直接调阻塞函数）并改写为真正的异步委托。
- 能说清 `run_in_executor` 的完整流程：提交 Executor → 适配成 asyncio Future → 协程 await 让出 → 工作线程执行 → 完成回调 `call_soon_threadsafe` 唤醒循环 → 协程恢复取结果。