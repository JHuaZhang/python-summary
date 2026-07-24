---
group:
  title: 【20】网络请求与外部服务
  order: 20
order: 7
title: redis.asyncio 异步 Redis
nav:
  title: Python
  order: 1
---

## 1. 介绍

### 1.1 什么是 redis.asyncio

`redis.asyncio` 是 redis-py 官方库内置的异步 Redis 客户端，通过 `import redis.asyncio as redis` 导入。它的 API 设计与同步版 `redis.Redis` 几乎完全一致——同样的 `set`/`get`/`hset`/`pipeline`/`pubsub`，只是所有涉及网络 IO 的方法都变成了协程，调用时必须加 `await`。

在 redis-py 4.2 之前，Python 社区广泛使用的是第三方库 `aioredis`。后来 `aioredis` 被官方合并进 redis-py，成为 `redis.asyncio` 子模块，`aioredis` 本身停止维护。因此现在写异步 Redis，应当统一使用 `redis.asyncio`，不要再引入 `aioredis`。

**同步版与异步版的关系**

| 维度 | `redis.Redis`（同步） | `redis.asyncio.Redis`（异步） |
|---|---|---|
| 导入 | `import redis` | `import redis.asyncio as redis` |
| 调用方式 | `client.set(k, v)` 直接返回 | `await client.set(k, v)` |
| IO 模型 | 阻塞 socket，一个请求卡住线程 | 非阻塞 socket + asyncio 事件循环 |
| 并发能力 | 单线程串行，多请求需多线程 | 单线程内协程并发，成百上千请求 |
| 适合场景 | 脚本、CLI、传统同步 Web | asyncio Web（aiohttp/FastAPI/Starlette） |
| RESP 协议 | 相同 | 相同（底层都是 RESP2/RESP3） |

可以这样理解：`redis.asyncio` 不是要把同步版的 API 推翻重来，而是把"等待 Redis 服务器响应"这段时间从"阻塞线程"改成"让出事件循环"。当一个协程在等 Redis 响应时，事件循环可以切换去执行另一个协程，从而在单线程内实现对 Redis 的高并发访问。

### 1.2 基本语法与最小用法

使用 `redis.asyncio` 的标准三步：创建异步客户端 → `await` 调用命令 → 关闭连接。

```python
import asyncio
import redis.asyncio as redis


async def main():
    # 第一步：创建异步客户端（连本地 Redis，默认 6379 端口）
    client = redis.Redis(host="localhost", port=6379, decode_responses=True)

    # 第二步：await 调用命令，API 与同步版一致
    await client.set("greeting", "hello async redis")
    value = await client.get("greeting")
    print(value)  # 输出：hello async redis

    # 第三步：关闭连接，释放底层 socket
    await client.close()


asyncio.run(main())
```

关键点：

- `redis.Redis(...)` 在异步版里不会真正建连，它只是创建一个客户端对象；真正的 TCP 连接发生在第一次 `await` 命令时（惰性连接）。
- 所有命令方法（`set`/`get`/`delete`/`exists`/`expire` 等）都是协程函数，忘记 `await` 会得到一个 coroutine 对象而不是结果，这是新手最常踩的坑。
- `decode_responses=True` 让返回值自动从 `bytes` 解码成 `str`，与同步版用法一致。
- `await client.close()` 必须调用，否则连接不会及时归还/关闭，长时间运行的服务会泄漏连接。

最小可运行示例就这三步。后续章节展开连接池、pipeline、pubsub、与 aiohttp 配合等进阶用法。

## 2. 核心内容

### 2.1 创建异步客户端：Redis 与 from_url

异步客户端有两种创建方式，分别适用于不同场景。

**方式一：`Redis(host, port, ...)` 显式传参**

适合连接参数固定、或需要在代码里明确指定 host/port/db 的场景。

```python
import redis.asyncio as redis

# 单机直连
client = redis.Redis(
    host="localhost",
    port=6379,
    db=0,
    password=None,
    decode_responses=True,
    socket_timeout=5,      # 单次读写超时 5 秒
    socket_connect_timeout=3,  # 建连超时 3 秒
    health_check_interval=30,  # 每 30 秒做一次 PING 健康检查
)
```

参数含义与同步版完全一致，这里不再逐一罗列，重点提几个异步场景下值得关注的：

- `socket_timeout`：异步版同样生效，命令超过这个时间未完成会被取消并抛 `TimeoutError`。在高并发下适当调小可以快速失败，避免协程长时间挂起。
- `health_check_interval`：连接池里的空闲连接会定期自检，避免拿到一个已经被服务端断开的死连接。
- `decode_responses`：建议设 `True`，否则你要到处处理 `bytes`。

**方式二：`await redis.from_url(url)` 用 URL 连接**

适合从环境变量读配置、或需要兼容 Redis Sentinel/Cluster URL 格式的场景。

```python
import os
import redis.asyncio as redis

url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
client = await redis.from_url(url, decode_responses=True)
```

`from_url` 会解析 `redis://[:password@]host:port/db` 这种格式，把参数提取出来。注意 `from_url` 在异步版里是协程——它内部要创建连接池对象，返回前可能涉及异步初始化，所以必须 `await`。

```python
# 连接带密码的 Redis
client = await redis.from_url(
    "redis://:mypassword@redis-host:6379/0",
    decode_responses=True,
)

# rediss:// 表示 TLS 加密连接（Redis 6+）
client = await redis.from_url("rediss://redis-host:6379/0")
```

**两种方式的选择**

- 简单单机、参数少：`Redis(host, port)` 更直观。
- 配置外置（环境变量/配置文件）：`from_url` 更方便，URL 一个字符串搞定。
- 无论哪种，最终拿到的都是 `redis.asyncio.Redis` 实例，后续用法完全相同。

### 2.2 基础命令：set / get / hset 等异步方法

异步版的命令方法名、参数、返回值与同步版几乎一一对应，区别仅在"需要 `await`"。下面按数据类型分组演示。

**字符串：set / get / delete / exists / expire**

```python
import asyncio
import redis.asyncio as redis


async def main():
    client = redis.Redis(host="localhost", port=6379, decode_responses=True)

    # set：支持 ex 过期、nx 仅当不存在时写入
    await client.set("user:1:name", "alice", ex=60)  # 60 秒后自动过期
    ok = await client.set("lock:job1", "worker-a", nx=True, ex=30)
    print(ok)  # 输出：True（首次写入成功）；若已存在则输出 None

    # get：不存在返回 None
    name = await client.get("user:1:name")
    print(name)  # 输出：alice

    # exists：返回存在的 key 数量
    count = await client.exists("user:1:name", "lock:job1")
    print(count)  # 输出：2

    # expire：给已有 key 续期
    await client.expire("user:1:name", 120)

    # delete
    await client.delete("lock:job1")

    await client.close()


asyncio.run(main())
```

注意 `set` 的 `nx=True` 配合 `ex` 实现的就是分布式锁的"加锁"语义：只有 key 不存在时才写入成功，并设置过期防死锁。这在异步任务队列里非常常见。

**哈希：hset / hget / hgetall / hincrby**

```python
async def hash_demo(client: redis.Redis):
    # hset：一次写多个字段（mapping 接收字典）
    await client.hset(
        "user:1",
        mapping={"name": "alice", "age": 30, "city": "hangzhou"},
    )

    # hget：取单个字段
    city = await client.hget("user:1", "city")
    print(city)  # 输出：hangzhou

    # hgetall：取全部字段，返回 dict
    info = await client.hgetall("user:1")
    print(info)  # 输出：{'name': 'alice', 'age': '30', 'city': 'hangzhou'}

    # hincrby：原子自增（注意 age 是字符串，hincrby 会按整数处理）
    await client.hincrby("user:1", "age", 1)
    print(await client.hget("user:1", "age"))  # 输出：31
```

**列表与集合：lpush/rpop/sadd/smembers**

```python
async def list_and_set_demo(client: redis.Redis):
    # 列表：lpush 入队、rpop 出队（先进先出）
    await client.lpush("task_queue", "task-a", "task-b", "task-c")
    task = await client.rpop("task_queue")
    print(task)  # 输出：task-a

    # 集合：sadd 添加、smembers 取全部
    await client.sadd("online_users", "u1", "u2", "u3")
    members = await client.smembers("online_users")
    print(members)  # 输出：{'u1', 'u2', 'u3'}（顺序不确定）

    # 判断成员是否存在
    is_online = await client.sismember("online_users", "u2")
    print(is_online)  # 输出：True
```

**忘记 await 的典型错误**

```python
# 错误：漏写 await，拿到的是协程对象而非结果
value = client.get("user:1:name")
print(value)  # 输出：<coroutine object Redis.get at 0x...>

# 运行结束时还会报警告：coroutine was never awaited
```

这是异步 Redis 最常见的低级错误。排查方法：凡是调用 client 上的命令方法，一律加 `await`。类型检查器（mypy/pyright）配合 `redis.asyncio` 的类型存根也能检测出"协程未被 await"。

### 2.3 连接管理：close / aclose 与 async with

异步客户端持有底层连接池，用完必须释放，否则会泄漏 socket。有三种管理方式。

**方式一：手动 close**

```python
client = redis.Redis(host="localhost", port=6379, decode_responses=True)
try:
    await client.set("k", "v")
finally:
    await client.close()
```

`client.close()` 会关闭连接池里所有连接。异步版早期只有 `close`，后来为了与 `asyncio` 的命名约定（`aclose`）对齐，也支持 `await client.aclose()`，两者等价。建议统一用 `close()`，可读性更好。

**方式二：async with 上下文管理器**

```python
async def main():
    async with redis.Redis(host="localhost", port=6379, decode_responses=True) as client:
        await client.set("k", "v")
        print(await client.get("k"))  # 输出：v
    # 退出 with 块时自动调用 close，无需手动释放
```

`async with` 会在退出块时自动 `await client.close()`，是最推荐的写法——不会因为异常导致连接泄漏。注意：`async with` 管理的是"客户端生命周期"，不是"单次连接的借还"（那是连接池内部的事）。

**方式三：显式连接池 + close**

当你需要自定义连接池参数（如 `max_connections`）时，先建池再传给客户端：

```python
async def main():
    pool = redis.ConnectionPool(
        host="localhost", port=6379, max_connections=20, decode_responses=True
    )
    client = redis.Redis(connection_pool=pool)
    try:
        await client.set("k", "v")
    finally:
        await client.close()  # 会关闭池中连接
        await pool.disconnect()  # 显式断开池（可选，双保险）
```

实际工程里，长驻服务（如 aiohttp 应用）通常在启动时建池、退出时断池，客户端对象可以复用同一个池，这部分在 2.4 节展开。

### 2.4 异步连接池：from_url + max_connections

在高并发场景下，每次请求都新建 TCP 连接代价太大（三次握手 + AUTH + SELECT）。连接池的作用是复用已建立的连接：协程从池里"借"一条连接发命令，用完归还，避免反复建连。

**用 from_url 带连接池**

```python
import asyncio
import redis.asyncio as redis


async def main():
    client = await redis.from_url(
        "redis://localhost:6379/0",
        max_connections=50,        # 池最多 50 条连接
        decode_responses=True,
        socket_keepalive=True,     # 开启 TCP keepalive，防止空闲连接被中间设备断开
    )
    # client 内部自动持有一个 ConnectionPool

    async with client:
        await client.set("pool:k", "pool-v")
        print(await client.get("pool:k"))  # 输出：pool-v
    # 退出 async with 自动关闭池


asyncio.run(main())
```

`max_connections` 的含义：池中同时存在的"已建立连接"上限。当并发协程数超过这个值时，多余的协程会等待（await）直到有连接归还——这是异步版的自然背压机制，不会像同步版那样直接报错。

**显式建池并共享给多个客户端**

在 Web 服务里，通常全局只建一个池，所有请求处理协程共享：

```python
import aiohttp.web
import redis.asyncio as redis

# 全局连接池（应用启动时创建）
redis_pool: redis.ConnectionPool


async def init_redis(app: aiohttp.web.Application):
    global redis_pool
    redis_pool = redis.ConnectionPool(
        host="localhost", port=6379, max_connections=100, decode_responses=True
    )
    app["redis"] = redis.Redis(connection_pool=redis_pool)


async def close_redis(app: aiohttp.web.Application):
    await app["redis"].close()
    await redis_pool.disconnect()


app = aiohttp.web.Application()
app.on_startup.append(init_redis)
app.on_cleanup.append(close_redis)
```

这样设计的好处：

- 池子在整个应用生命周期内复用，请求之间不重复建连。
- `max_connections` 限制了对 Redis 的最大并发连接数，防止突发流量打爆 Redis。
- 每个请求 handler 从 `app["redis"]` 拿到的是同一个客户端对象（底层共享池），无需自己管理。

**连接池为什么是异步的**

同步版的连接池在借出连接时，如果池空了，调用线程会阻塞等待——但这会卡住整个线程。异步版的池在"无可用连接"时，会返回一个 `await` 点：当前协程挂起，事件循环去调度其他协程，等有连接归还时再唤醒挂起的协程。这就是为什么异步池能在单线程内优雅地处理"连接数赶不上并发量"的情况——它把"等待连接"也变成了非阻塞的。

### 2.5 pipeline 异步批量

当需要一次发多条命令时，逐条 `await` 会产生多次网络往返（每条命令一个 RTT）。pipeline 把多条命令打包一次发出，服务端按序执行后一次性返回所有结果，显著降低总耗时。

**基础 pipeline**

```python
import asyncio
import redis.asyncio as redis


async def main():
    client = redis.Redis(host="localhost", port=6379, decode_responses=True)

    # 创建管道对象（此时命令还未发出）
    async with client.pipeline(transaction=True) as pipe:
        pipe.set("counter", "0")
        pipe.incr("counter")
        pipe.incr("counter")
        pipe.get("counter")
        # execute 才真正把 4 条命令一起发出
        results = await pipe.execute()

    print(results)
    # 输出：[True, 1, 2, '2']
    # 依次对应 set 返回、第一次 incr、第二次 incr、最后 get 的值

    await client.close()


asyncio.run(main())
```

`transaction=True`（默认）表示这批命令会被包进 `MULTI/EXEC` 事务，保证原子执行。如果不需要原子性、只想要批量减少 RTT，可以 `pipeline(transaction=False)`。

**为什么 pipeline 在高并发下收益更大**

在同步版里，pipeline 节省的是"多次 RTT 的等待时间"。在异步版里，它的收益更进一步：

- 单个协程用 pipeline：一次 `await execute()` 只让出一次事件循环，而非每条命令让出一次，减少了协程切换开销。
- 多个协程各自 pipeline：事件循环可以交错调度，Redis 服务端可能在处理 A 的 pipeline 中间就穿插处理 B 的命令，整体吞吐更高。

**场景：批量写入用户画像**

```python
async def batch_set_profiles(client: redis.Redis, profiles: dict):
    """批量写多个用户哈希，一次 RTT 搞定"""
    async with client.pipeline() as pipe:
        for user_id, fields in profiles.items():
            pipe.hset(f"user:{user_id}", mapping=fields)
        await pipe.execute()


# 调用
profiles = {
    "1": {"name": "alice", "age": "30"},
    "2": {"name": "bob", "age": "25"},
    "3": {"name": "carol", "age": "28"},
}
await batch_set_profiles(client, profiles)
```

如果没有 pipeline，3 个用户的写入是 3 次 RTT；用 pipeline 后变成 1 次。当 `profiles` 有几百上千条时，差距非常明显。

### 2.6 pubsub 异步订阅

Redis 的发布订阅（pub/sub）适合做实时消息推送、事件广播。异步版通过 `client.pubsub()` 创建订阅对象，用 `await pubsub.get_message()` 接收消息。

**订阅者：监听频道**

```python
import asyncio
import redis.asyncio as redis


async def subscriber():
    client = redis.Redis(host="localhost", port=6379, decode_responses=True)
    pubsub = client.pubsub()
    await pubsub.subscribe("news", "alerts")  # 订阅两个频道

    print("等待消息...")
    while True:
        message = await pubsub.get_message(timeout=1.0)
        if message and message["type"] == "message":
            print(f"[{message['channel']}] {message['data']}")
            # 输出示例：[news] breaking: redis.asyncio is great
        # timeout 内无消息则返回 None，循环继续

    # （实际使用时需在收到结束信号后 break）
    await pubsub.unsubscribe()
    await pubsub.close()
    await client.close()


asyncio.run(subscriber())
```

`get_message(timeout=1.0)` 的行为：

- 有消息时立即返回 dict，`type` 可能是 `subscribe`（订阅确认）、`message`（正常消息）、`unsubscribe` 等。
- `timeout` 内无消息，返回 `None`。设 `timeout=None` 则无限等待（不推荐，会让协程无法响应取消信号）。
- 设一个合理的 timeout（如 1 秒）既能及时取消息，又能在循环里周期性检查是否该退出。

**发布者：往频道发消息**

```python
async def publisher():
    client = redis.Redis(host="localhost", port=6379, decode_responses=True)
    await client.publish("news", "breaking: redis.asyncio is great")
    await client.publish("alerts", "cpu usage > 90%")
    await client.close()
```

`publish` 返回的是"收到该消息的订阅者数量"，广播性质——没有订阅者时返回 0。

**订阅者与发布者并发跑**

下面这个 demo 用 `asyncio.gather` 同时启动一个订阅者和一个延迟发布的发布者，展示异步并发：

```python
import asyncio
import redis.asyncio as redis


async def subscriber(client: redis.Redis):
    pubsub = client.pubsub()
    await pubsub.subscribe("chat")
    received = []
    # 只收 3 条然后退出
    while len(received) < 3:
        msg = await pubsub.get_message(timeout=1.0)
        if msg and msg["type"] == "message":
            received.append(msg["data"])
    await pubsub.unsubscribe("chat")
    await pubsub.close()
    return received


async def publisher(client: redis.Redis):
    # 先等订阅者就绪
    await asyncio.sleep(0.5)
    for text in ["hello", "how are you", "bye"]:
        await client.publish("chat", text)
        await asyncio.sleep(0.1)


async def main():
    client = redis.Redis(host="localhost", port=6379, decode_responses=True)
    # 同一个 client 既订阅又发布会相互干扰，这里用两个 client 共享连接池
    # 简单起见用两个独立 client
    sub_client = redis.Redis(host="localhost", port=6379, decode_responses=True)
    pub_client = redis.Redis(host="localhost", port=6379, decode_responses=True)

    results = await asyncio.gather(subscriber(sub_client), publisher(pub_client))
    print("订阅者收到:", results[0])
    # 输出：订阅者收到: ['hello', 'how are you', 'bye']

    await sub_client.close()
    await pub_client.close()


asyncio.run(main())
```

**为什么 pubsub 必须异步**

同步版 `pubsub.get_message()` 在没有消息时会阻塞调用线程，如果你想同时做别的事（比如处理 HTTP 请求）就得开一个专门的线程跑订阅。异步版只要 `await get_message()`，当前协程挂起等消息时，事件循环照样能去跑 aiohttp 的请求处理——订阅和 Web 服务在同一线程内和平共处。

### 2.7 在 asyncio.run 中驱动

所有 `redis.asyncio` 的操作都必须在事件循环内执行。`asyncio.run(main())` 是最常用的入口，它会创建事件循环、运行 `main()` 协程、结束后自动关闭循环。

**并发执行多个 Redis 命令**

asyncio 的优势在于"同时"做多件事。下面用 `asyncio.gather` 并发发起多个 set/get，对比串行与并发的耗时：

```python
import asyncio
import time
import redis.asyncio as redis


async def set_get(client: redis.Redis, i: int):
    await client.set(f"k{i}", f"v{i}")
    return await client.get(f"k{i}")


async def main():
    client = redis.Redis(host="localhost", port=6379, decode_responses=True)

    # 串行：10 次操作
    start = time.perf_counter()
    for i in range(10):
        await set_get(client, i)
    serial_time = time.perf_counter() - start

    # 并发：10 次操作用 gather 一起发
    start = time.perf_counter()
    await asyncio.gather(*(set_get(client, i) for i in range(10, 20)))
    concurrent_time = time.perf_counter() - start

    print(f"串行 10 次: {serial_time:.3f}s")
    print(f"并发 10 次: {concurrent_time:.3f}s")
    # 输出示例：
    # 串行 10 次: 0.031s
    # 并发 10 次: 0.008s

    await client.close()


asyncio.run(main())
```

并发版快的原因：串行时每个 `set_get` 要等上一个完成才发下一个，等于 10 个 RTT 串起来；并发时 `gather` 把 10 个协程同时交给事件循环，它们各自的 `await client.set` 在让出循环后，事件循环会立刻调度下一个协程发起请求——于是 10 个请求几乎同时发出，总耗时接近 1 个 RTT（取决于 Redis 处理速度）。

**在已有事件循环里用**

如果你已经在 asyncio 应用里（比如 aiohttp handler、FastAPI 路由），不要再调 `asyncio.run`，直接 `await` 即可——事件循环已经在跑了。

```python
# FastAPI 示例
from fastapi import FastAPI
import redis.asyncio as redis

app = FastAPI()
redis_client = redis.Redis(host="localhost", port=6379, decode_responses=True)


@app.get("/user/{user_id}")
async def get_user(user_id: str):
    # 直接 await，FastAPI 的事件循环会驱动
    name = await redis_client.get(f"user:{user_id}:name")
    return {"user_id": user_id, "name": name}
```

### 2.8 与 aiohttp 配合：异步 Web 并发查缓存

这是 `redis.asyncio` 最典型的应用场景：一个异步 Web 服务，每个请求先查 Redis 缓存，未命中再查数据库。由于请求处理是协程，当某个请求在等 Redis 响应时，事件循环可以同时处理其他请求——真正做到单进程高并发。

```python
import asyncio
import aiohttp.web
import redis.asyncio as redis


async def init_redis(app: aiohttp.web.Application):
    pool = redis.ConnectionPool(
        host="localhost", port=6379, max_connections=50, decode_responses=True
    )
    app["redis"] = redis.Redis(connection_pool=pool)
    app.on_cleanup.append(lambda app: asyncio.create_task(app["redis"].close()))


async def get_product(request: aiohttp.web.Request) -> aiohttp.web.Response:
    """查询商品信息，先查 Redis 缓存，未命中返回 fallback"""
    product_id = request.match_info["product_id"]
    client: redis.Redis = request.app["redis"]

    cache_key = f"product:{product_id}"
    cached = await client.get(cache_key)
    if cached:
        return aiohttp.web.json_response(
            {"source": "cache", "data": cached}
        )

    # 缓存未命中：这里简化为直接返回，实际应查数据库
    data = f"product-{product_id}-from-db"
    await client.set(cache_key, data, ex=60)  # 缓存 60 秒
    return aiohttp.web.json_response({"source": "db", "data": data})


async def batch_products(request: aiohttp.web.Request) -> aiohttp.web.Response:
    """批量查询多个商品——利用 asyncio.gather 并发查 Redis"""
    ids = request.query.getall("id", [])
    client: redis.Redis = request.app["redis"]

    # 并发查 N 个 key，比串行快得多
    values = await asyncio.gather(
        *(client.get(f"product:{pid}") for pid in ids)
    )
    return aiohttp.web.json_response(
        [{"id": pid, "data": v} for pid, v in zip(ids, values)]
    )


def make_app():
    app = aiohttp.web.Application()
    app.on_startup.append(init_redis)
    app.router.add_get("/product/{product_id}", get_product)
    app.router.add_get("/products", batch_products)
    return app


if __name__ == "__main__":
    aiohttp.web.run_app(make_app(), port=8080)
```

这个例子体现了异步 Redis 的核心价值：

- `/product/{id}` 处理协程在 `await client.get` 时让出循环，aiohttp 可以立刻去处理别的请求。
- `/products` 用 `gather` 把多个 Redis 查询并发发出，10 个 key 的查询耗时接近 1 个 RTT 而非 10 个。
- 整个服务单进程单线程，没有线程切换开销，却能在 Redis 响应延迟的间隙处理大量并发请求。

如果是同步版 `redis.Redis`，每个 `client.get` 都会阻塞当前线程。在 aiohttp 这种单线程异步框架里，一旦调用同步 Redis，整个事件循环就卡住了——所有其他请求都得等这次 Redis 查询完成。这就是异步 Web 必须配异步 Redis 的根本原因。

### 2.9 异步队列：List 实现任务分发

Redis 的 List（`lpush`/`brpop`）常被用作轻量任务队列。异步版用 `brpop` 阻塞式弹出，能在有任务时立即返回、无任务时挂起等待，非常适合 asyncio 里的"消费者协程"。

```python
import asyncio
import redis.asyncio as redis


async def producer(client: redis.Redis):
    """生产者：往队列塞任务"""
    for i in range(5):
        await client.lpush("task_queue", f"task-{i}")
        print(f"produced task-{i}")
        await asyncio.sleep(0.2)


async def worker(client: redis.Redis, name: str):
    """消费者：阻塞等待任务"""
    while True:
        # brpop 阻塞直到有数据或超时；返回 (队列名, 值) 或 None
        result = await client.brpop("task_queue", timeout=5)
        if result is None:
            print(f"[{name}] 超时无任务，退出")
            break
        queue_name, task = result
        print(f"[{name}] processing {task}")
        await asyncio.sleep(0.3)  # 模拟处理耗时


async def main():
    client = redis.Redis(host="localhost", port=6379, decode_responses=True)
    # 一个生产者 + 两个消费者并发
    await asyncio.gather(
        producer(client),
        worker(client, "worker-1"),
        worker(client, "worker-2"),
    )
    await client.close()


asyncio.run(main())
# 输出示例：
# produced task-0
# [worker-1] processing task-0
# produced task-1
# [worker-2] processing task-1
# produced task-2
# [worker-1] processing task-2
# ...
```

`brpop` 的 `timeout=5` 表示最多等 5 秒，期间协程挂起不占 CPU；超时返回 `None`，消费者据此判断是否该退出。如果用同步版 `brpop`，这个线程在等待期间什么都做不了；异步版则能在等待任务的同时，让事件循环去处理其他协程（比如另一个 worker、或 HTTP 请求）。

## 3. 最佳实践

**始终用 async with 或 try/finally 管理连接**

不推荐：手动创建客户端却忘记关闭。

```python
# 不推荐：异常时连接泄漏
client = redis.Redis(host="localhost", port=6379)
await client.set("k", "v")
# 忘记 close，或上面的 set 抛异常时直接跳过 close
```

推荐：

```python
# 推荐：async with 保证释放
async with redis.Redis(host="localhost", port=6379, decode_responses=True) as client:
    await client.set("k", "v")
```

长驻服务用全局池 + startup/cleanup 钩子，不要在每个请求里新建客户端——那样既慢又容易泄漏。

**不要在异步代码里混用同步 redis-py**

```python
# 不推荐：在 async handler 里用同步 Redis
import redis
sync_client = redis.Redis(host="localhost")

async def handler(request):
    value = sync_client.get("k")  # 阻塞整个事件循环！
    ...
```

同步 `get` 会在等 Redis 响应时卡住当前线程，而当前线程正是事件循环所在线程——结果就是所有其他协程都被冻住，异步框架的高并发能力瞬间归零。在异步代码里，务必全程使用 `redis.asyncio`。

如果实在必须调用阻塞操作（比如某个第三方库只有同步版），应该用 `asyncio.to_thread` 把它丢到线程池：

```python
value = await asyncio.to_thread(sync_client.get, "k")
```

但这会让出事件循环的代价高于直接用异步 API，且要管理线程池资源，属于不得已的兜底手段。

**合理设置 max_connections**

`max_connections` 不是越大越好。设太大：连接数打爆 Redis（Redis 单实例能扛几万连接，但每条连接都占内存）；设太小：并发协程排队等连接，反而降低吞吐。经验值：

- 小型服务（几百 QPS）：20-50。
- 中大型（几千 QPS）：100-200。
- 配合连接池的 `health_check_interval` 和 `socket_keepalive` 保证连接健康。

**用 decode_responses=True 减少 bytes 处理**

Redis 存储的是字节，默认返回 `bytes`。在大多数业务代码里，你要的是 `str`。设 `decode_responses=True` 后框架自动解码，省去到处 `.decode()`。只有在需要存取二进制数据（如图片字节）时才保留默认的 `bytes` 模式。

**pipeline 用于批量，不要用于单条**

```python
# 不推荐：单条命令还包一层 pipeline，徒增开销
async with client.pipeline() as pipe:
    pipe.get("k")
    result = await pipe.execute()

# 推荐：单条直接 await
result = await client.get("k")
```

pipeline 本身有创建对象、打包、解包的固定开销，单条命令时反而比直接调用慢。只在有 3 条以上命令需要一起发时用 pipeline。

**pubsub 要设 timeout，不要无限阻塞**

```python
# 不推荐：timeout=None 无限等待，协程无法响应取消信号
msg = await pubsub.get_message(timeout=None)

# 推荐：设合理 timeout，周期性检查是否该退出
while running:
    msg = await pubsub.get_message(timeout=1.0)
    ...
```

`timeout=None` 会让协程彻底卡在等待里，外部 `task.cancel()` 无法中断（在旧版本里可能要等下一条消息才能退出）。设 1 秒左右的 timeout，循环里检查退出标志，是更稳妥的模式。

**用 transaction=False 时注意原子性**

`pipeline(transaction=False)` 只做批量发送，不保证原子性——中间穿插其他客户端的命令。如果你依赖"这批命令连续执行"（如先读后写、判断后操作），要么用默认的 `transaction=True`（MULTI/EXEC），要么用 Lua 脚本（`eval`）保证原子。

**异常处理：网络抖动与重试**

异步 Redis 调用可能抛 `ConnectionError`、`TimeoutError`。在关键路径上应有重试逻辑：

```python
import asyncio
from redis.exceptions import ConnectionError, TimeoutError


async def safe_get(client: redis.Redis, key: str, retries: int = 3):
    for attempt in range(retries):
        try:
            return await client.get(key)
        except (ConnectionError, TimeoutError):
            if attempt == retries - 1:
                raise
            await asyncio.sleep(0.1 * (attempt + 1))  # 简单退避
```

连接池本身会在拿到死连接后自动重试一次（`retry_on_timeout` 可配），但应用层仍建议对关键操作加一层兜底。

## 4. 原理

### 4.1 非阻塞 socket + asyncio 事件循环

理解 `redis.asyncio` 的关键，在于看清它和同步版在 IO 层面的分叉：两者用同样的 RESP 协议跟 Redis 服务器通信，但同步版用"阻塞 socket"，异步版用"非阻塞 socket + 事件循环"。

**同步版的 IO 模型**

当你调用同步 `client.set("k", "v")` 时，底层发生这些事：

1. 从连接池借一条 socket。
2. 把 `SET k v\r\n` 这串 RESP 字节写进 socket 的发送缓冲区。
3. 调用 `recv()` 等服务器回复——这个 `recv` 是阻塞的：当前线程会被操作系统挂起，直到 socket 上有数据可读。
4. 读到 `+OK\r\n`，解析返回，归还连接。

第 3 步就是阻塞点。线程被挂起期间，它什么也干不了。如果你在 aiohttp 的事件循环线程里干这事，整个事件循环就停了。

**异步版的 IO 模型**

`await client.set("k", "v")` 的底层流程则完全不同：

1. 从异步连接池借一条 socket（或新建）。
2. 把 socket 设为非阻塞模式（`setblocking(False)`）。
3. 把 `SET k v\r\n` 写进 socket。如果写缓冲区满了，写不完的部分要记下来稍后继续。
4. 不阻塞 `recv`，而是向事件循环注册："这个 socket 可读时叫我"。
5. 当前协程在这里 `yield`（让出控制权），事件循环去跑别的协程。
6. 某个时刻 Redis 服务器回了 `+OK\r\n`，操作系统通知事件循环"这个 socket 就绪了"（通过 epoll/kqueue）。
7. 事件循环唤醒刚才挂起的协程，协程 `recv` 拿到数据，解析，返回结果。

核心区别在第 4-5 步：异步版不等数据，而是"登记兴趣 + 让出"。等待期间事件循环能处理其他协程，这就是单线程并发的来源。这部分机制由 asyncio 的事件循环（epoll/kqueue）+ redis-py 内部的 `asyncio` 适配层共同实现，使用者只需 `await`。

### 4.2 await 让出循环：协程如何"挂起"

`await client.set(...)` 看起来像一次函数调用，但它内部有一个"挂起点"。简化来看，`redis.asyncio` 的命令方法大致这样工作：

```python
# 伪代码，简化说明原理
async def execute_command(self, *args):
    conn = await self.connection_pool.get_connection()  # 借连接（可能也 await）
    await conn.send_command(*args)   # 写入 socket（非阻塞写，可能 await）
    result = await conn.read_response()  # 等 Redis 回复（关键 await 点）
    self.connection_pool.release(conn)
    return result
```

`await conn.read_response()` 是最关键的让出点。它的内部大致是：

```python
# 伪代码
async def read_response(self):
    while True:
        try:
            return self._parser.read()  # 尝试从已读缓冲区解析
        except NeedMoreData:
            # 缓冲区不全，需要更多数据
            await self._wait_for_readable()  # 让出，等 socket 可读
```

`self._wait_for_readable()` 会用 `asyncio.Future` 把当前协程挂起，并向事件循环注册 socket 的可读事件。当 socket 可读、事件循环唤醒这个 Future 时，协程从 `await` 处恢复，继续读数据。

从使用者的视角看，就是"await 一下，结果就回来了"。但在这短短的 await 期间，事件循环可能已经切换处理了几十个其他协程的 Redis 请求——这正是异步高并发的本质。

### 4.3 为什么不阻塞循环线程故能并发

事件循环是单线程的，它在一个时刻只执行一个协程。那它怎么"并发"？答案在于：协程在"等待"时会主动让出，事件循环立刻切到下一个就绪的协程。

具体到 Redis 操作：

- 协程 A 发了 `await client.set("k1", "v1")`，在等 Redis 回复时让出。
- 事件循环立刻调度协程 B，B 发了 `await client.set("k2", "v2")`，也让出。
- 协程 C、D、E……同样让出。
- Redis 服务器回复了 k1 的结果，事件循环唤醒 A，A 拿到结果继续执行。

整个过程在一个线程内。线程从未被"阻塞等待 IO"——它要么在执行协程代码，要么在 epoll 等"任意一个 socket 就绪"。只要有协程的 IO 就绪，线程就有事干，不会闲着。这就是为什么单线程的 asyncio 能扛住成百上千的并发 Redis 请求：它不靠多线程并行，靠的是"IO 等待时不浪费时间"。

对比同步版：同步 `set` 让线程在 `recv` 上挂起，这段时间线程不能处理任何其他请求。要并发就只能开多线程，而线程有上下文切换开销、GIL 限制（CPU 密集场景）、内存开销（每线程栈空间），扩展性远不如协程。

### 4.4 异步连接池的复用机制

异步连接池做的事和同步池类似——维护一组复用的连接——但"借/还"的语义是异步的。

**借连接**

当协程需要发命令时，向池请求一条连接：

- 池里有空闲连接：直接返回（同步操作，无需 await 等待）。
- 池里没有空闲但未达 `max_connections`：新建一条（非阻塞建连，可能 await 等 TCP 握手完成）。
- 已达 `max_connections`：当前协程 await 挂起，等别人归还连接。

第三种情况是异步池的精髓：它不阻塞线程，而是让协程排队。事件循环在协程等待期间可以去跑其他协程，等有连接归还再唤醒排队的协程。

**还连接**

命令执行完，连接归还池。归还时通常会检查：

- 连接是否出错（出错则丢弃，不归还）。
- 是否到了健康检查时间（到了就发个 `PING` 自检）。

**为什么复用很重要**

TCP 连接建立有成本：三次握手 +（如果有密码）AUTH +（如果非 0 库）SELECT。对 Redis 这种低延迟服务，这些开销可能比命令本身还大。复用连接后，每个命令只有一个 RTT 的成本。在高并发下，复用带来的吞吐提升是数量级的。

### 4.5 与同步版共享 RESP 协议

Redis 客户端与服务器之间的通信协议叫 RESP（REdis Serialization Protocol）。无论同步还是异步版，发的字节流是一样的：

```
SET greeting "hello async redis"   # 用户视角
*3\r\n$3\r\nSET\r\n$8\r\ngreeting\r\n$18\r\nhello async redis\r\n   # RESP 字节流
```

`redis.asyncio` 和同步 `redis.Redis` 共用同一套 RESP 解析器（`HiredisParser` 或 `PythonParser`）。区别只在"怎么读 socket"：

- 同步版：阻塞 `socket.recv()`。
- 异步版：非阻塞 socket + 事件循环注册可读事件 + await。

这意味着：你在同步版学到的 Redis 命令、数据类型、协议行为，在异步版完全适用——唯一要改的是"加 await"和"用 asyncio.run 驱动"。这也解释了为什么 `aioredis` 能被合并进 redis-py：协议解析逻辑本来就该共享，只是 IO 层不同。

### 4.6 为何高并发 Web 场景显著优于同步版

把上面的原理合起来看一个具体场景：一个 aiohttp Web 服务，每个请求查一次 Redis。

**同步 Redis 在异步框架里的灾难**

假设你错误地用了同步 `redis.Redis`：

```python
async def handler(request):
    value = sync_client.get("k")  # 阻塞 ~1ms
    return web.json_response({"v": value})
```

这 1ms 内，事件循环线程被 `recv` 钉死。aiohttp 的所有其他请求——无论是等 Redis、等数据库、还是已经在处理——全部停在原处不动。1000 并发请求时，同步 Redis 的 1ms × 串行处理 = 1 秒延迟，事件循环的并发能力归零。

**异步 Redis 的正确做法**

```python
async def handler(request):
    value = await async_client.get("k")  # 让出 ~0.001ms 后被其他协程使用
    return web.json_response({"v": value})
```

`await` 让出后，事件循环立刻去处理下一个请求。1000 并发请求几乎同时各自发出 Redis 查询，Redis 服务端能在几毫秒内全部处理完，总延迟接近单次 RTT。这就是异步 Redis 的价值所在——它让"等 Redis"这段时间不再独占线程，从而支撑单进程的高并发。

**量化对比（示意）**

| 场景 | 同步 Redis（在异步框架里） | 异步 Redis |
|---|---|---|
| 1000 并发请求 × 1ms Redis | ~1s（事件循环被串行阻塞） | ~1-2ms（并发发出） |
| CPU 占用 | 低（但都在等） | 低（真正的并发处理） |
| 能否同时处理多请求 | 否 | 是 |
| 连接复用 | 需多线程 + 每线程一池 | 单池协程共享 |

关键不是异步版"单次更快"——单次命令两者 RTT 相近。异步版赢在"等待时不占线程"，让单进程能同时放手处理大量并发 IO，这是高并发 Web 场景的核心诉求。

## 5. 总结

### 5.1 本文内容要点

- `redis.asyncio` 是 redis-py 官方的异步 Redis 客户端，旧名 `aioredis` 已合并进来，统一用 `import redis.asyncio as redis` 导入。
- 创建客户端两种方式：`redis.Redis(host, port)` 显式传参、`await redis.from_url(url)` 用 URL 解析。两者 API 一致。
- 命令方法（`set`/`get`/`hset`/`lpush`/`sadd` 等）与同步版同名同参，但都是协程，必须 `await`。忘记 await 是最常见错误。
- 连接管理：`async with redis.Redis(...) as client` 自动 close，或手动 `await client.close()`。长驻服务用全局连接池 + 应用 startup/cleanup 钩子。
- 异步连接池：`from_url(..., max_connections=N)` 或显式 `ConnectionPool`。池在无可用连接时让协程排队等待（背压），不阻塞线程。
- pipeline：`async with client.pipeline() as pipe` 打包多条命令一次发出，减少 RTT，`transaction=True`（默认）保证原子。
- pubsub：`client.pubsub()` 订阅、`await get_message(timeout=1.0)` 接收、`publish` 发布。订阅要设 timeout 以便响应退出信号。
- 驱动方式：独立脚本用 `asyncio.run(main())`；已有事件循环内（aiohttp/FastAPI）直接 `await`。
- 与 aiohttp 配合：请求 handler 里 `await client.get` 让出循环，事件循环并发处理多请求；`asyncio.gather` 并发查多个 key。
- List + `brpop` 实现异步任务队列：生产者 `lpush`、消费者 `await brpop`，多 worker 并发消费。

### 5.2 读完应能掌握

- 能正确导入 `redis.asyncio` 并用 `Redis` / `from_url` 创建异步客户端，知道何时该 `await`。
- 能用 `async with` 或 `try/finally + close` 管理异步客户端生命周期，不泄漏连接。
- 能为长驻服务配置全局连接池（`max_connections`/`socket_keepalive`/`health_check_interval`），并在 startup/cleanup 中初始化与释放。
- 能用 pipeline 批量发命令，区分 `transaction=True/False` 的原子性差异。
- 能编写 pubsub 订阅者与发布者，用合理的 `timeout` 保证协程可退出。
- 能在 aiohttp/FastAPI 的请求处理中用 `await` 调用 Redis，并用 `asyncio.gather` 并发查多个 key。
- 能说清"异步版为何不阻塞事件循环"：非阻塞 socket + 事件循环 epoll + await 让出，等待 Redis 响应期间线程可处理其他协程。
- 能说清同步 Redis 在异步框架里的危害：一次阻塞 `recv` 卡住整个事件循环，高并发能力归零。
- 能基于 Redis List + `brpop` 搭建 asyncio 生产者-消费者任务队列。