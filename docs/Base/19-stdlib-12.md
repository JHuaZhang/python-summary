---
group:
  title: 【19】标准库精讲
  order: 19
order: 12
title: time.sleep 与时间戳
nav:
  title: Python
  order: 1
---

## 1. 介绍

### 1.1 什么是 time 模块

`time` 是 Python 标准库中最基础的时间处理模块，它直接封装了操作系统提供的时间相关系统调用。它与 `datetime`、`calendar` 的定位不同：`datetime` 面向"人类可读的年月日时分秒"，而 `time` 模块更贴近底层，直接操作"机器视角的时间"——时间戳、单调时钟、CPU 时钟、线程睡眠。

在日常开发里，`time` 模块最常被用到的几个能力是：

- 获取当前时间的 Unix 时间戳（`time.time()`、`time.time_ns()`）。
- 让程序暂停一段时间（`time.sleep()`）。
- 高精度测量代码执行耗时（`time.perf_counter()`、`time.monotonic()`）。
- 把时间戳转成人类可读字符串（`time.ctime()`、`time.strftime()`）。

本篇聚焦于 `sleep` 与时间戳这条主线，把围绕"取时间、测时间、等时间"的核心 API 一次讲透。

**time 模块的两层时间观**

`time` 模块里的函数看似繁多，但所有函数都围绕两种"时钟"展开，理解这一点能避免 90% 的误用：

- **壁钟（Wall Clock）**：即真实的物理世界时间，反映当前是几点几分。它的值来自操作系统的实时时钟（RTC），可以被 NTP 服务、用户手动调整、夏令时切换所改变。`time.time()` 取的就是壁钟。
- **单调时钟（Monotonic Clock）**：一个永远只增不减、不受任何人为调整影响的计时器。它不告诉你"现在是几点"，只告诉你"从某个起点到现在过去了多久"。`time.perf_counter()`、`time.monotonic()` 取的是这类时钟。

记住一条铁律：**测耗时用单调时钟，记录"现在几点"用壁钟**。这条规则会在第 4 章原理部分详细解释为什么。

### 1.2 基础语法与最小用法

先看三个最基本、最高频的调用，建立直觉：

```python
import time

# 1) 当前 Unix 时间戳（自 1970-01-01 00:00:00 UTC 起经过的秒数，浮点数）
now = time.time()
print(now)
# 输出：1719700000.123456   （示例值，实际随运行时刻变化）

# 2) 程序睡眠（阻塞当前线程 1.5 秒）
time.sleep(1.5)

# 3) 高精度计时（测量这段代码耗时）
start = time.perf_counter()
total = sum(range(1_000_000))
end = time.perf_counter()
print(f"求和耗时 {end - start:.6f} 秒")
# 输出：求和耗时 0.018234 秒
```

这三个调用覆盖了 `time` 模块使用的三大场景：**取时间戳、暂停执行、测耗时**。后面的章节会逐一展开每个 API 的细节、参数、适用场景和底层差异。

---

## 2. 核心内容

### 2.1 time.time() —— 当前 Unix 时间戳

`time.time()` 返回当前时刻的 Unix 时间戳，即自 1970-01-01 00:00:00 UTC 起经过的秒数，类型是 `float`。

```python
import time

ts = time.time()
print(ts)          # 1719700000.123456
print(type(ts))    # <class 'float'>
```

**返回值是浮点数，小数部分表示秒以下的精度**。在大多数 64 位平台下，`time.time()` 的分辨率能达到微秒级（约 1e-6 秒），但这取决于操作系统和硬件时钟的精度，不能假定它在所有平台上都有同样的细粒度。

**典型用途**

- 生成日志中的时间戳字段、记录事件发生时刻。
- 作为数据库记录的 `created_at` 字段（存浮点秒或整数毫秒）。
- 生成文件名、缓存 key 唯一标识（如 `f"snapshot_{int(time.time())}.json"`）。
- 计算两个事件之间的"日历间隔"（如判断 token 是否过期：`time.time() - issued_at > 3600`）。

**生成唯一时间戳标识**

一个常见场景是给临时文件或缓存对象起一个"大概率唯一"的名字。`time.time()` 的精度是微秒级，在单线程短时间内的连续调用可能返回相同值，因此配合计数器或随机值更稳妥：

```python
import time
import random
import string

def make_token() -> str:
    """生成一个带时间戳的短标识，用于临时缓存 key。"""
    ts = int(time.time() * 1000)          # 毫秒整数，比纯秒更不易碰撞
    suffix = ''.join(random.choices(string.ascii_lowercase, k=4))
    return f"tk_{ts}_{suffix}"

for _ in range(3):
    print(make_token())
    time.sleep(0.001)
# 输出：
# tk_1719700000123_abcd
# tk_1719700000156_efgh
# tk_1719700000189_ijkl
```

**过期判断场景**

用 `time.time()` 判断某个带时效的数据是否过期是最自然的写法：

```python
import time

class Cache:
    def __init__(self):
        self._store: dict[str, tuple[float, str]] = {}

    def set(self, key: str, value: str, ttl: float) -> None:
        """写入缓存，ttl 秒后过期。"""
        expire_at = time.time() + ttl
        self._store[key] = (expire_at, value)

    def get(self, key: str) -> str | None:
        if key not in self._store:
            return None
        expire_at, value = self._store[key]
        if time.time() > expire_at:
            del self._store[key]          # 惰性删除
            return None
        return value

cache = Cache()
cache.set("user:1", "Alice", ttl=0.5)
print(cache.get("user:1"))    # 输出：Alice
time.sleep(0.6)
print(cache.get("user:1"))    # 输出：None
```

**不适合用 time.time() 的场景**

不要用 `time.time()` 来测量代码执行耗时。壁钟会被系统 NTP 同步、用户手动改时间、闰秒插入等操作影响，可能出现"时间倒退"或"突然跳变"。如果在这期间用 `end - start` 算耗时，结果可能是负数或严重失真。测耗时应当用 `time.perf_counter()`（见 2.4）。

### 2.2 time.time_ns() —— 纳秒精度时间戳

`time.time_ns()` 与 `time.time()` 语义相同，区别在于返回值是整数纳秒，类型 `int`，而非浮点秒。

```python
import time

ns = time.time_ns()
print(ns)           # 1719700000123456789
print(type(ns))     # <class 'int'>
print(time.time_ns() / 1e9 == time.time())   # 近似相等，但不保证严格相等
```

**为什么要单独提供 ns 版本**

浮点数 `float` 在 Python 中是 IEEE 754 双精度（53 位尾数），能精确表示的整数范围约到 2^53 ≈ 9.0e15。当前 Unix 时间戳以秒为单位约 1.7e9，看似远小于 2^53，但**小数部分**的精度会随整数部分增大而下降。到 21 世纪，`time.time()` 的浮点数只能可靠区分到微秒（1e-6）级别，更细的纳秒位会被浮点误差吞掉。

而 `time.time_ns()` 返回整数纳秒（当前约 1.7e18），这个值远超 2^53，用 `float` 已经无法精确表示。因此 Python 选择把它作为 `int` 返回，整数运算不存在精度丢失，能保留完整的纳秒信息。

**何时用 time_ns 而非 time**

- 需要纳秒级时间戳的唯一性时（如高并发事件排序、分布式日志对齐）。
- 需要把时间戳参与精确整数运算、哈希、位运算时。
- 在做性能基准测试时，与 `perf_counter_ns()` 配合记录起止点。

```python
import time

# 用纳秒时间戳给事件打标，便于后续按时间精确排序
events = []
for i in range(5):
    events.append((time.time_ns(), f"event-{i}"))
    time.sleep(0.0001)

events.sort()
for ts, name in events:
    print(ts, name)
# 输出（纳秒时间戳单调递增）：
# 1719700000123456789 event-0
# 1719700000124567890 event-1
# 1719700000125678901 event-2
# 1719700000126789012 event-3
# 1719700000127890123 event-4
```

**注意：time_ns 仍然是壁钟**

`time_ns()` 取的是同一个壁钟源，同样可能被 NTP 调整。它解决了"精度"问题，没有解决"单调性"问题。需要单调性仍要用 `perf_counter_ns()`。

### 2.3 time.sleep() —— 阻塞当前线程

`time.sleep(secs)` 让当前线程暂停执行 `secs` 秒。`secs` 是浮点数，可以传小于 1 的值实现毫秒级延迟；传 0 或负数则立即返回（相当于让出一次调度，行为接近 `time.sleep(0)`）。

```python
import time

print("start")
time.sleep(2)
print("end")          # 约 2 秒后打印
# 输出：
# start
# （间隔约 2 秒）
# end
```

**这是同步阻塞，不是异步等待**

`time.sleep()` 会让当前线程在内核层面进入睡眠状态，线程让出 CPU，直到超时后被内核唤醒。在此期间该线程无法做任何事。这一点在多线程和异步编程中尤其重要：

- **在多线程程序里**，`time.sleep()` 只阻塞调用它的那一个线程，其他线程仍正常执行。
- **在 asyncio 协程里**，`time.sleep()` 会阻塞整个事件循环线程，导致所有其他协程一起卡住。这是从同步代码迁到异步代码时最常见的坑。

```python
import asyncio
import time

async def bad_coroutine():
    # 错误：time.sleep 阻塞事件循环，其他协程无法推进
    time.sleep(2)

async def good_coroutine():
    # 正确：asyncio.sleep 让出控制权给事件循环
    await asyncio.sleep(2)
```

关于 asyncio 中 `time.sleep` 为什么会卡住事件循环、以及 `asyncio.sleep` 的非阻塞原理，详见【18】异步协程相关笔记，这里只强调结论：**在 `async def` 函数里永远不要直接调用 `time.sleep()`**。

**参数行为细节**

- `secs` 可以是浮点：`time.sleep(0.05)` 暂停 50 毫秒。
- `secs=0`：并不"什么也不做"，而是触发一次线程调度让出，可用来主动让出 CPU 给其他线程（在协作式场景偶尔有用）。
- `secs<0`：在 CPython 实现中会抛 `ValueError`（不同版本/实现行为略有差异，不要依赖）。
- **实际暂停时长可能略长于请求**：操作系统调度有粒度（通常 1~10 毫秒量级），线程被唤醒后还要等调度器分配 CPU，因此 `time.sleep(0.001)` 实际可能睡 1~15 毫秒。不要把 `sleep` 当成精确延时。

**退避重试场景**

`sleep` 最经典的工程用途是"失败后退避重试"——请求失败后睡一会儿再试，避免雪崩式重试压垮下游：

```python
import time
import random

def fetch_with_retry(url: str, max_retries: int = 4) -> str:
    """带指数退避的请求重试。"""
    for attempt in range(1, max_retries + 1):
        try:
            # 假装发起请求（这里用随机模拟成功/失败）
            if random.random() < 0.7:
                raise ConnectionError(f"连接 {url} 失败")
            return f"OK from {url}"
        except ConnectionError as e:
            if attempt == max_retries:
                raise
            wait = 2 ** (attempt - 1)      # 1, 2, 4 秒指数退避
            print(f"第 {attempt} 次失败：{e}，{wait}s 后重试")
            time.sleep(wait)
    raise RuntimeError("不应到达")

random.seed(1)
print(fetch_with_retry("https://api.example.com"))
# 输出：
# 第 1 次失败：连接 https://api.example.com 失败，1s 后重试
# 第 2 次失败：连接 https://api.example.com 失败，2s 后重试
# OK from https://api.example.com
```

**轮询等待条件**

另一个高频场景是"轮询等待某个条件成立"，比如等文件出现、等任务完成：

```python
import time
import os

def wait_for_file(path: str, timeout: float = 10.0, interval: float = 0.3) -> bool:
    """轮询等待文件出现，最长等 timeout 秒。"""
    deadline = time.monotonic() + timeout     # 用单调时钟算截止时间
    while time.monotonic() < deadline:
        if os.path.exists(path):
            return True
        time.sleep(interval)                  # 每轮间隔，避免空转烧 CPU
    return False

# 假设另一进程会在稍后生成文件
ok = wait_for_file("/tmp/ready.flag", timeout=5, interval=0.5)
print("文件就绪" if ok else "超时未出现")
# 输出：超时未出现   （若文件未生成）/ 文件就绪
```

**进度条/节流场景**

`sleep` 也常用于把快速产生的输出节流到合理节奏，例如简易进度刷新：

```python
import time

def long_task(steps: int) -> None:
    for i in range(steps):
        # ... 实际工作 ...
        time.sleep(0.01)                     # 模拟每步耗时
        if i % 10 == 0:
            print(f"\r进度：{i}/{steps}", end="", flush=True)
    print("\r完成")

long_task(50)
# 输出：进度：0/50 ... 完成
```

### 2.4 time.perf_counter() —— 高精度单调时钟

`time.perf_counter()` 返回一个高精度的单调时钟值（浮点秒）。它是 Python 中**测量代码执行耗时的首选时钟**。

"单调"意味着这个时钟的值只会增长、不会回退，不受 NTP 调整、用户改系统时间、夏令时切换的影响。"高精度"意味着它的分辨率通常是当前平台能达到的最精细级别——在大多数现代系统上是纳秒级。

```python
import time

def slow_function(n: int) -> int:
    return sum(i * i for i in range(n))

start = time.perf_counter()
result = slow_function(1_000_000)
end = time.perf_counter()
elapsed = end - start
print(f"结果={result}，耗时 {elapsed:.6f} 秒")
# 输出：结果=333332833333500000，耗时 0.042183 秒
```

**为什么用 perf_counter 而非 time.time 测耗时**

- `time.time()` 是壁钟，会被 NTP 同步调整。如果 NTP 在你测量的中途把时钟拨慢了 0.5 秒，`end - start` 就会虚高 0.5 秒；如果拨快了，耗时甚至会变负。
- `perf_counter()` 是单调的，永远只增不减，保证 `end - start >= 0` 永远成立。
- `perf_counter()` 的分辨率通常比 `time.time()` 更高，专为基准测试设计。

**perf_counter 的"起点"无意义**

`perf_counter()` 返回的具体数值本身没有日历含义——它不是"自 1970 年起的秒数"，也不是"自开机起的秒数"，只是一个内部计数值，起点由实现决定（可能是机器启动后的某时刻）。因此**只能用两次调用的差值来算耗时，单次返回值不能当时间戳用**。

**perf_counter_ns()**

`time.perf_counter_ns()` 返回整数纳秒，语义同 `perf_counter()`，适合需要纳秒整数运算、避免浮点误差的精密基准测试：

```python
import time

start = time.perf_counter_ns()
total = sum(range(1_000_000))
end = time.perf_counter_ns()
print(f"耗时 {(end - start)} 纳秒 = {(end - start) / 1e6:.3f} 毫秒")
# 输出：耗时 18345000 纳秒 = 18.345 毫秒
```

**对比微小耗时时多次取样**

测一个非常快的操作（如一次函数调用只花几微秒），单次测量会被系统噪声主导。应该循环执行多次取总耗时再平均：

```python
import time

def measure(func, args=(), repeat: int = 1_000_000) -> float:
    """对极快操作做多次取样，返回平均每次耗时（秒）。"""
    start = time.perf_counter()
    for _ in range(repeat):
        func(*args)
    total = time.perf_counter() - start
    return total / repeat

print(f"abs(-5) 平均耗时：{measure(abs, (-5,)) * 1e9:.1f} 纳秒")
# 输出：abs(-5) 平均耗时：35.4 纳秒
```

### 2.5 time.monotonic() —— 单调时钟

`time.monotonic()` 返回一个单调时钟值（浮点秒），与 `perf_counter()` 类似也不受系统时间调整影响。区别在于 `monotonic` 不保证是最高精度的，它的设计目标是"稳定可移植的单调性"，而不像 `perf_counter` 那样追求极致分辨率。

```python
import time

deadline = time.monotonic() + 3.0    # 3 秒后截止
while time.monotonic() < deadline:
    # 做一些周期性工作
    time.sleep(0.5)
    print("tick")
# 输出：
# tick
# tick
# tick
# tick
# tick
# tick
```

**monotonic 与 perf_counter 的区别**

两者都单调、都不受 NTP 影响，但在 CPython 实现里：

- `perf_counter()` 优先选择分辨率最高的时钟（如 Linux 上是 `clock_gettime(CLOCK_MONOTONIC)`，Windows 上是 `QueryPerformanceCounter`），分辨率可达纳秒，适合基准测试。
- `monotonic()` 使用 `clock_gettime(CLOCK_MONOTONIC)` 等保证单调且不受调整的时钟，但分辨率可能略低，适合做"超时控制""轮询截止时间"这类只需毫秒级精度的场景。

实践上两者经常可以互换，但语义上的分工是：**精度优先选 perf_counter，可移植单调性优先选 monotonic**。对应还有 `time.monotonic_ns()` 返回整数纳秒。

**超时控制场景**

`monotonic` 是写超时循环的可靠选择，因为它保证不会因系统时钟倒退而无限循环：

```python
import time

def run_with_timeout(task, timeout: float) -> bool:
    """运行 task 直到它返回 True 或超时。task 是个无参可调用。"""
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if task():
            return True
        time.sleep(0.1)
    return False

def fake_task():
    # 模拟任务：第 3 次调用才成功
    fake_task.calls += 1
    return fake_task.calls >= 3
fake_task.calls = 0

ok = run_with_timeout(fake_task, timeout=2.0)
print("任务完成" if ok else "超时")
# 输出：任务完成
```

### 2.6 time.process_time() —— 进程 CPU 时间

`time.process_time()` 返回当前进程的 CPU 时间（浮点秒），即 CPU 真正花在本进程上的时间总和，**不包含线程睡眠、等待 I/O 等进程未占用 CPU 的时间**。

```python
import time

# CPU 密集：CPU 时间与壁钟时间接近
start = time.process_time()
total = sum(i * i for i in range(5_000_000))
cpu_time = time.process_time() - start
print(f"CPU 密集：CPU 时间 {cpu_time:.3f}s")
# 输出：CPU 密集：CPU 时间 0.310s

# I/O 等待：sleep 不占 CPU，process_time 几乎不增长
start = time.process_time()
time.sleep(0.5)
cpu_time = time.process_time() - start
print(f"sleep 期间：CPU 时间 {cpu_time:.6f}s")
# 输出：sleep 期间：CPU 时间 0.000012s
```

可以看到 `time.sleep(0.5)` 让壁钟前进了 0.5 秒，但 `process_time()` 几乎没动——睡眠期间进程没有占用 CPU。

**用途**

- 评估算法的"纯计算开销"，排除 I/O 等待干扰。
- 限定计算型任务的 CPU 配额（如限制 profiler 运行时间）。

`time.thread_time()` 是其姊妹函数，返回当前线程的 CPU 时间，在多线程程序里可用于单线程耗时分析（不跨线程累加）。两者都有对应的 `_ns()` 整数版本。

### 2.7 各类时钟对比

Python 的 `time` 模块提供了多种时钟函数，初学者常困惑该选哪个。下表做系统对照：

| 函数 | 时钟性质 | 是否单调 | 受 NTP/手动调时影响 | 受 sleep 影响 | 典型用途 | 精度 |
|------|---------|---------|-------------------|--------------|---------|------|
| `time.time()` | 壁钟 | 否 | 是 | 否（壁钟继续走） | 当前 Unix 时间戳 | 微秒级 |
| `time.time_ns()` | 壁钟（整数 ns） | 否 | 是 | 否 | 高精度时间戳 | 纳秒 |
| `time.perf_counter()` | 高精度单调时钟 | 是 | 否 | 否（不占 CPU 但计时不暂停） | 测代码耗时 | 最高（纳秒级） |
| `time.monotonic()` | 单调时钟 | 是 | 否 | 否 | 超时控制、轮询截止 | 高（微秒~纳秒） |
| `time.process_time()` | 进程 CPU 时间 | 是* | 否 | 是（sleep 不计 CPU） | 算法纯计算开销 | 微秒级 |
| `time.thread_time()` | 线程 CPU 时间 | 是* | 否 | 是 | 单线程 CPU 分析 | 微秒级 |

`*` CPU 时间在逻辑上单调增长，但它衡量的是"占用 CPU 的时长"而非"墙钟流逝"，与壁钟单调性的含义略有不同。

**选择口诀**

- 想"知道现在是几点几分"→ `time.time()` / `time.time_ns()`。
- 想"测一段代码跑了多久"→ `time.perf_counter()`。
- 想"设一个 N 秒后超时的截止点"→ `time.monotonic()`（也能用 `perf_counter`，但 `monotonic` 更明确表达意图）。
- 想"衡量 CPU 真正花了多少"→ `time.process_time()`。

### 2.8 time.ctime() —— 时间戳转可读字符串

`time.ctime([secs])` 把一个 Unix 时间戳转成 `Wed Jul  3 10:00:00 2024` 这种可读字符串。不传参数时等价于 `time.ctime(time.time())`，即当前本地时间的字符串表示。

```python
import time

print(time.ctime())                 # 当前时间
# 输出：Tue Jul 23 14:30:00 2024

print(time.ctime(0))                # Unix 纪元
# 输出：Thu Jan  1 08:00:00 1970   （东八区显示，UTC 下是 00:00:00）
```

**返回值是本地时区字符串**

`ctime` 返回的是按本地时区格式化的字符串。时间戳 0 对应 UTC 1970-01-01 00:00:00，在 UTC+8 时区显示为 `08:00:00`。时区由系统环境变量（`TZ`、`/etc/localtime`）决定。

**格式固定，不可定制**

`ctime` 的输出格式固定为 `Www Mmm dd HH:MM:SS yyyy`（24 字符），无法自定义。若需要自定义格式，用 `time.strftime()` 配合 `time.localtime()`：

```python
import time

ts = time.time()
struct = time.localtime(ts)         # 本地时间的 struct_time
formatted = time.strftime("%Y-%m-%d %H:%M:%S", struct)
print(formatted)
# 输出：2024-07-23 14:30:00
```

### 2.9 time.localtime() / gmtime() —— 时间戳转结构化时间

`time.localtime([secs])` 把时间戳转成本地时区的 `struct_time`；`time.gmtime([secs])` 转成 UTC 时区的 `struct_time`。不传参数默认取当前时间。

```python
import time

ts = time.time()

local = time.localtime(ts)
print(local)
# 输出：time.struct_time(tm_year=2024, tm_mon=7, tm_mday=23, tm_hour=14,
#       tm_min=30, tm_sec=0, tm_wday=1, tm_yday=205, tm_isdst=0)

utc = time.gmtime(ts)
print(utc)
# 输出：time.struct_time(tm_year=2024, tm_mon=7, tm_mday=23, tm_hour=6,
#       tm_min=30, tm_sec=0, tm_wday=1, tm_yday=205, tm_isdst=0)
```

`struct_time` 是一个命名元组，字段含义：

| 字段 | 含义 | 取值范围 |
|------|------|---------|
| `tm_year` | 年 | 如 2024 |
| `tm_mon` | 月 | 1~12 |
| `tm_mday` | 日 | 1~31 |
| `tm_hour` | 时 | 0~23 |
| `tm_min` | 分 | 0~59 |
| `tm_sec` | 秒 | 0~61（含闰秒） |
| `tm_wday` | 星期 | 0~6（0=周一） |
| `tm_yday` | 年内日序 | 1~366 |
| `tm_isdst` | 夏令时 | 0/1/-1（-1 表示未知） |

**反向转换：mktime**

`time.mktime(struct_time)` 把本地 `struct_time` 转回时间戳；`time.calendar_timegm(struct_time)` 把 UTC `struct_time` 转回时间戳（`calendar` 模块）。

```python
import time

# 构造一个具体时刻
st = time.struct_time((2024, 7, 23, 14, 30, 0, 1, 205, 0))
ts = time.mktime(st)
print(ts)                  # 1721707800.0
print(time.ctime(ts))      # Tue Jul 23 14:30:00 2024
```

**时间戳与 datetime 互转**

`datetime` 模块与 `time` 模块的时间戳可以双向转换，这是实际开发中常见需求：

```python
import time
from datetime import datetime, timezone

# 时间戳 → datetime（感知 UTC）
ts = time.time()
dt_utc = datetime.fromtimestamp(ts, tz=timezone.utc)
print(dt_utc)
# 输出：2024-07-23 06:30:00.123456+00:00

# 时间戳 → datetime（本地时区）
dt_local = datetime.fromtimestamp(ts)
print(dt_local)
# 输出：2024-07-23 14:30:00.123456

# datetime → 时间戳
ts_back = dt_utc.timestamp()
print(ts_back)             # 1721707800.123456   与原 ts 近似相等
```

**要点**：`datetime.fromtimestamp(ts)` 不传 `tz` 时返回本地时区 naive datetime；传 `tz=timezone.utc` 返回感知 UTC datetime，跨时区处理更稳妥。逆向 `dt.timestamp()` 只对感知 datetime 有明确语义，对 naive datetime 会按本地时区解释。

### 2.10 时间戳精度限制与格式化

**sleep 的精度上限**

`time.sleep(n)` 的实际暂停时长受操作系统调度粒度限制，不等于 `n`。常见平台的最小调度粒度：

- Linux：默认时钟中断 1 毫秒（CONFIG_HZ=1000 内核）或 4 毫秒（250 Hz）。
- Windows：约 15.6 毫秒（受系统计时器分辨率影响，可调）。
- macOS：约 1 毫秒量级。

因此 `time.sleep(0.001)` 在 Linux 上可能实际睡 1~3 毫秒，在 Windows 上可能睡 15 毫秒以上。对延迟敏感的应用（如高频定时任务）不能依赖 `sleep` 的精确性，应结合 `perf_counter` 做补偿：

```python
import time

def precise_sleep(seconds: float) -> None:
    """略精确的睡眠：长时用 sleep，短时用忙等补偿。"""
    deadline = time.perf_counter() + seconds
    # 大部分时间交给 sleep，让出 CPU
    while True:
        remaining = deadline - time.perf_counter()
        if remaining <= 0:
            return
        if remaining > 0.002:
            time.sleep(remaining / 2)      # 睡剩余一半，留余量
        # 剩余极短时忙等，避免被调度粒度拖累
```

**strftime 自定义格式**

把 `struct_time` 按 format 格式化字符串，常用占位符：

| 占位符 | 含义 | 示例 |
|--------|------|------|
| `%Y` | 四位年 | 2024 |
| `%m` | 两位月 | 07 |
| `%d` | 两位日 | 23 |
| `%H` | 两位时（24h） | 14 |
| `%M` | 两位分 | 30 |
| `%S` | 两位秒 | 00 |
| `%s` | Unix 时间戳 | 1721707800 |
| `%z` | 时区偏移 | +0800 |
| `%F` | 等价 `%Y-%m-%d` | 2024-07-23 |
| `%T` | 等价 `%H:%M:%S` | 14:30:00 |

```python
import time

ts = time.time()
st = time.localtime(ts)

# 生成日志时间戳前缀
log_prefix = time.strftime("%Y-%m-%d %H:%M:%S", st)
print(f"[{log_prefix}] 服务启动")
# 输出：[2024-07-23 14:30:00] 服务启动

# 生成文件名
filename = time.strftime("dump_%Y%m%d_%H%M%S.log", st)
print(filename)
# 输出：dump_20240723_143000.log
```

**strptime 反向解析**

`time.strptime(string, format)` 把字符串解析回 `struct_time`：

```python
import time

s = "2024-07-23 14:30:00"
st = time.strptime(s, "%Y-%m-%d %H:%M:%S")
ts = time.mktime(st)
print(ts, time.ctime(ts))
# 输出：1721707800.0 Tue Jul 23 14:30:00 2024
```

---

## 3. 最佳实践

### 3.1 测耗时永远用 perf_counter，不用 time.time

**推荐写法**

```python
import time

start = time.perf_counter()
do_work()
elapsed = time.perf_counter() - start
```

**不推荐写法**

```python
import time

start = time.time()       # 壁钟，可能被 NTP 调整
do_work()
elapsed = time.time() - start   # 可能失真甚至为负
```

原因：`time.time()` 是壁钟，可被 NTP 同步、用户手动改时间、夏令时影响，出现时钟跳变或倒退。`perf_counter` 单调且高精度，专为基准测试设计。

### 3.2 超时循环用 monotonic，不用 time.time

写"最长等 N 秒就放弃"的循环时，用 `monotonic` 算截止时间最稳：

```python
import time

deadline = time.monotonic() + 5.0
while time.monotonic() < deadline:
    if condition_met():
        break
    time.sleep(0.2)
```

若用 `time.time()`，系统在循环中途被调快/调慢都会让超时不准；`monotonic` 不受这些影响。

### 3.3 不要用 sleep 做精确同步

`time.sleep(0.001)` 不保证恰好睡 1 毫秒，实际可能远长于请求。需要严格时序时：
- 用 `perf_counter` 监控实际经过时间并补偿（参考 2.10 的 `precise_sleep`）。
- 用专门的定时调度（如 `sched` 模块、操作系统定时器）。

### 3.4 在 asyncio 里不要调 time.sleep

`time.sleep` 是同步阻塞调用，会卡住整个事件循环。在 `async def` 内必须用 `await asyncio.sleep(n)`。更一般地，在异步代码里所有可能阻塞的操作都应走异步版本。这一点和【18】异步协程笔记中"事件循环单线程"的本质紧密相关。

```python
# 错误（在协程里）
async def task():
    time.sleep(2)        # 整个事件循环卡 2 秒

# 正确
async def task():
    await asyncio.sleep(2)
```

### 3.5 时间戳存储用整数避免浮点精度问题

存数据库或跨服务传递时，优先用整数毫秒/秒，而非浮点秒：

```python
import time

# 推荐：整数毫秒，便于存储与比较
ts_ms = time.time_ns() // 1_000_000

# 也可：整数秒
ts_s = int(time.time())
```

浮点秒在序列化（JSON）和跨语言传递时可能丢失精度，整数更可靠。

### 3.6 高并发唯一标识不要只靠 time.time

`time.time()` 在同一微秒内可能返回相同值。需要唯一性应配合计数器、随机值或 UUID：

```python
import time
import uuid

# 推荐
token = f"evt_{int(time.time()*1000)}_{uuid.uuid4().hex[:8]}"
```

### 3.7 时区敏感场景用 datetime 而非 time

`time` 模块对时区的支持较弱（依赖系统本地时区）。需要显式时区运算时用 `datetime` 配合 `zoneinfo`：感知 datetime 的 `astimezone`、UTC 存储本地展示等模式更可控。

### 3.8 避免忙等空转烧 CPU

轮询等待时务必带 `sleep` 间隔，不要写纯 `while True: if ready: break` 的空循环，否则会让一个 CPU 核跑满：

```python
# 不推荐：CPU 100% 空转
while not ready():
    pass

# 推荐：带间隔，让出 CPU
while not ready():
    time.sleep(0.1)
```

---

## 4. 原理

### 4.1 壁钟与系统实时时钟

`time.time()` 取的是操作系统提供的"实时时钟"（Real-Time Clock，RTC）。RTC 是主板上的一块硬件（或虚拟化平台模拟的设备），即使在机器关机时也靠电池维持走时，开机后操作系统读取它来初始化当前时间。操作系统在运行期间还会通过 NTP（网络时间协议）守护进程定期与外部时间源对时，把系统时钟往标准时间校准。

这意味着 `time.time()` 拿到的壁钟值有两个特点：

- **可被调整**：NTP 会小幅校准（通常每次几毫秒到几十毫秒），用户手动改时间会大幅跳变，闰秒插入会让时钟停滞或回退一秒。
- **反映"日历时间"**：它的值有明确含义——从 1970-01-01 UTC 起经过的真实秒数，可以转成"几点几分"。

在 CPython 中，Unix 平台 `time.time()` 的底层调用通常是 `clock_gettime(CLOCK_REALTIME, &tp)`，Windows 上是 `GetSystemTimePreciseAsFileTime`。`CLOCK_REALTIME` 就是 POSIX 定义的"可调整实时时钟"，NTP 修改的正是它。

**为什么壁钟不适合测耗时**：假设你在测量某段代码耗时，中途 NTP 把系统时钟拨慢了 50 毫秒，那么 `end - start` 会虚高 50 毫秒；若 NTP 把时钟往回拨（历史上发生过），`end - start` 还会变负。壁钟的"可调整"属性与"测耗时要求单调递增"直接冲突。

### 4.2 单调时钟的硬件来源

`time.perf_counter()` 与 `time.monotonic()` 取的是"单调时钟"。在 Unix 平台，底层通常是 `clock_gettime(CLOCK_MONOTONIC, &tp)`；`CLOCK_MONOTONIC` 是 POSIX 定义的一种特殊时钟，它的起点由实现定义（通常是系统启动时刻），**保证永远不会被 NTP 或用户操作回退**，只可能被 NTP 微调频率（不会跳变），因而 `end - start` 永远非负。

在硬件层面，单调时钟通常取自 CPU 的 Time Stamp Counter（TSC，时间戳计数器）或高精度事件定时器（HPET）。TSC 是 x86 处理器内部的一个 64 位计数器，每个时钟周期自增一次，频率可达几 GHz，因此分辨率能达到纳秒甚至亚纳秒级。操作系统把它换算成秒浮点返回。

`perf_counter` 与 `monotonic` 的底层来源在多数平台相同（都是 `CLOCK_MONOTONIC`），但 CPython 在选择时钟时会区分侧重点：

- `perf_counter` 优先选择"分辨率最高"的时钟，必要时使用与 `monotonic` 不同的高精度源。
- `monotonic` 优先选择"保证单调且可移植"的时钟，分辨率是次要考量。

Windows 上 `perf_counter` 用 `QueryPerformanceCounter`（QPC），这是 Windows 提供的高精度计数器，分辨率同样可达纳秒级，且不受系统时间调整影响。

**为什么单调时钟的具体值没有日历含义**：TSC 的起点是"上电后的某个时刻"，`CLOCK_MONOTONIC` 的起点是"系统启动后的某个时刻"，它们和"1970-01-01"这类日历锚点无关。所以 `perf_counter()` 的单次返回值不能当时间戳用，只能用差值表示"经过了多久"。

### 4.3 sleep 的系统调用实现

`time.sleep(n)` 并不是 Python 自己实现的"忙等循环"，它直接把睡眠请求交给操作系统内核。在 CPython 的 C 实现里，`time_sleep` 函数会调用平台相应的睡眠系统调用：

- **Linux/macOS**：`nanosleep(const struct timespec *req, struct timespec *rem)`。`nanosleep` 让当前线程进入 `TASK_INTERRUPTIBLE` 状态（Linux）或类似睡眠状态，内核把它挂到定时器队列，直到超时由时钟中断唤醒。`rem` 参数返回"剩余未睡时间"，若被信号中断可据此继续睡。
- **Windows**：`SleepEx(dwMilliseconds, FALSE)`，让出当前时间片并阻塞，直到超时。

线程进入睡眠后让出 CPU，调度器把这个 CPU 核分配给其他线程，因此 `sleep` 期间不会空转烧 CPU（区别于忙等）。但这同时意味着：**醒来取决于内核何时把它重新加入可运行队列**。

**为什么 sleep 实际可能睡得更久**

操作系统调度是"时钟中断驱动的"。CPU 每隔一个调度粒度（Linux 上 1ms 或 4ms，Windows 上约 15.6ms）触发一次中断，调度器才有机会检查"该线程的睡眠超时了吗"。假设你请求 `sleep(0.001)`：

1. 线程进入睡眠，T=0。
2. T=1ms 时时钟中断触发，内核发现超时，把线程标记为"可运行"。
3. 但此时 CPU 可能正在执行别的线程，要等调度器下次调度点才把 CPU 分配给你。
4. 实际醒来可能 T=1.2ms、T=4ms，甚至更长。

因此 `sleep(0.001)` 实际可能睡 1~15 毫秒，`sleep(0.0001)` 几乎不可能精确睡 100 微秒。请求的 sleep 越短，相对误差越大。

**被信号中断的 sleep**

在 Unix 上，若线程被信号（如 `SIGINT`）中断，`nanosleep` 会提前返回并设置 `EINTR`，CPython 会检查剩余时间并重新调用 `nanosleep` 继续睡完，保证总时长近似请求值（但不保证精确）。

### 4.4 time_ns 的纳秒来源

`time.time_ns()` 与 `time.time()` 走的是同一个壁钟源（`CLOCK_REALTIME`），区别仅在于返回的数据类型和换算方式：

- `time.time()` 把内核返回的 `struct timespec`（秒 + 纳秒）换算成 `double` 浮点秒返回。
- `time.time_ns()` 直接把 `秒 * 1_000_000_000 + 纳秒` 作为整数返回。

`struct timespec` 在现代 Unix 上由 `clock_gettime` 填充，其 `tv_nsec` 字段就是硬件时钟提供的纳秒计数。之所以额外提供 `_ns` 接口，是因为浮点秒无法同时容纳"秒以上的大整数"和"纳秒级小数"——53 位尾数只能精确到 2^53 ≈ 9e15，而当前时间戳的纳秒值约 1.7e18，远超此范围。整数 `int` 在 Python 里是任意精度，所以 `time_ns` 能无损保留完整纳秒信息。

同理，`perf_counter_ns`、`monotonic_ns`、`process_time_ns`、`thread_time_ns` 都是各自时钟的整数纳秒版本，目的相同：避免浮点精度损失。

### 4.5 各类时钟的底层来源差异汇总

| Python 函数 | Unix 底层 | Windows 底层 | 时钟性质 |
|-------------|----------|-------------|---------|
| `time.time` | `clock_gettime(CLOCK_REALTIME)` | `GetSystemTimePreciseAsFileTime` | 实时可调壁钟 |
| `time.perf_counter` | `clock_gettime(CLOCK_MONOTONIC)` 或更高精度源 | `QueryPerformanceCounter` | 高精度单调 |
| `time.monotonic` | `clock_gettime(CLOCK_MONOTONIC)` | `QueryPerformanceCounter` | 单调 |
| `time.process_time` | `clock_gettime(CLOCK_PROCESS_CPUTIME_ID)` | `GetProcessTimes` | 进程 CPU 时间 |
| `time.thread_time` | `clock_gettime(CLOCK_THREAD_CPUTIME_ID)` | `GetThreadTimes` | 线程 CPU 时间 |
| `time.sleep` | `nanosleep` | `SleepEx` | 阻塞当前线程 |

`CLOCK_PROCESS_CPUTIME_ID` 和 `CLOCK_THREAD_CPUTIME_ID` 是 POSIX 定义的"CPU 时间时钟"，它们衡量的是"CPU 在该进程/线程上实际执行的累计时长"，不包括睡眠、I/O 等待等未占用 CPU 的时间。这就是为什么 `process_time` 在 `time.sleep` 期间几乎不增长。

### 4.6 GIL 与 sleep 的交互

`time.sleep()` 释放 GIL 后才进入内核睡眠，睡眠期间持不持有 GIL 都不影响——线程已经不运行。这和其他线程能正常执行是一致的：睡眠线程让出 CPU 让出 GIL，其他 Python 线程可以正常获取 GIL 并运行。所以多线程程序里一个线程 `sleep` 不会阻塞其他线程。

但在 asyncio 单线程事件循环里，整个循环跑在一个线程上。协程里调 `time.sleep` 会阻塞这个唯一线程，循环无法切换到其他协程，于是表现为"所有人一起卡住"。`asyncio.sleep` 的实现不用 `time.sleep`，而是把回调注册到事件循环的定时器队列并 `yield` 出去，让循环可以继续处理其他协程，到点再唤回这个协程。这是 asyncio 中两者本质差异所在。

---

## 5. 总结

### 本文内容要点

- `time.time()` 返回当前 Unix 时间戳（浮点秒，自 1970-01-01 UTC），用于"记录现在是几点"；`time.time_ns()` 返回整数纳秒，避免浮点精度损失。
- `time.sleep(n)` 阻塞当前线程 n 秒，用于暂停、退避重试、轮询间隔；在 asyncio 协程里禁用，应改用 `asyncio.sleep`。
- `time.perf_counter()` 是高精度单调时钟，测代码耗时的首选；`time.monotonic()` 适合超时控制；两者都不受 NTP 调整影响。
- `time.process_time()` / `thread_time()` 衡量 CPU 实际占用时长，不含睡眠与 I/O 等待。
- `time.ctime()` 把时间戳转固定格式可读字符串；`time.localtime()` / `gmtime()` 转结构化时间，配合 `strftime` 自定义格式。
- 时间戳与 `datetime` 可通过 `datetime.fromtimestamp` / `dt.timestamp` 双向互转。
- `time.time` 是壁钟可被 NTP 调整，不适合测耗时；`perf_counter` / `monotonic` 取自硬件单调时钟，保证 `end - start >= 0`。
- `sleep` 通过 `nanosleep` / `SleepEx` 让线程进入内核等待，实际暂停时长受调度粒度限制，可能略长于请求。

### 读完应能掌握

- 能在"取时间戳""测耗时""设超时""算 CPU 开销"四种场景下正确选用 `time.time`、`perf_counter`、`monotonic`、`process_time`，并说出选与不选的理由。
- 能写出一个带指数退避的请求重试函数，正确用 `time.sleep` 控制重试间隔。
- 能用 `perf_counter` 写出多取样的微小耗时基准测试，避免单次噪声。
- 能解释为什么在 `async def` 里不能调 `time.sleep`，以及它与 `asyncio.sleep` 的本质差异（关联【18】）。
- 能完成时间戳与 `datetime`、`struct_time`、`strftime` 字符串之间的相互转换。
- 能解释 `sleep(0.001)` 为什么实际可能睡十几毫秒、`time.time()` 为什么不能用来测耗时。