---
group:
  title: 【20】网络请求与外部服务
  order: 20
order: 6
title: redis-py 同步 Redis
nav:
  title: Python
  order: 1
---

## 1. 介绍

### 1.1 什么是 redis-py

Redis 是一个基于内存的键值对（key-value）数据库，凭借极高的读写性能和丰富的数据结构（String/Hash/List/Set/ZSet 等），被广泛用作缓存、计数器、分布式锁、排行榜、消息队列等场景。它本身就是用 C 写的独立服务，和 Python 没有直接关系——Python 程序要通过一个客户端库去和 Redis server 通信，`redis-py`（`pip install redis`）就是 Redis 官方推荐的 Python 客户端。

`redis-py` 封装了 Redis 的通信协议（RESP），把每一条 Redis 命令包装成一个 Python 方法：你在 Python 里调用 `r.set("name", "tom")`，库底层会把它翻译成 `SET name tom` 这条命令文本，通过 TCP 发给 Redis server，再把返回结果解析成 Python 对象还给你。它的 API 命名和 Redis 原生命令几乎一一对应——会写 Redis 命令就基本会用 `redis-py`，这是它学习成本低的重要原因。

`redis-py` 同时提供同步客户端（`redis.Redis`）和异步客户端（`redis.asyncio.Redis`）。本篇只讲同步部分，这是绝大多数 Web 后端（Django/Flask FastAPI 的同步路由、普通脚本、定时任务）日常使用的形态；异步客户端留到另一篇专题。

### 1.2 安装与第一个连接

安装很简单，包名就是 `redis`：

```bash
pip install redis
```

注意：旧版本（4.x 之前）的包名也叫 `redis`，但同步和异步 API 有较大变化。本篇以当前主流的 5.x 行为为准，5.x 的 API 已经非常稳定。安装后不需要额外装驱动，它自带纯 Python 实现的 socket 通信层。

最小可运行示例——连接本机 Redis 并做一次读写：

```python
import redis

# 连接本机 6379 端口的 Redis，db=0 库
r = redis.Redis(host="127.0.0.1", port=6379, db=0, decode_responses=True)

r.set("hello", "world")            # 写入
value = r.get("hello")             # 读取
print(value)
# 输出：world

# ping 用来测试连接是否正常，返回 True 说明连通
print(r.ping())
# 输出：True
```

这段代码假设你本机已经跑了一个 Redis server（`redis-server` 启动即可）。`redis.Redis(...)` 是最核心的入口，它本质上建立了一个到 Redis server 的长连接句柄（真实连接由连接池按需创建），所有后续命令都通过这个对象发出。后面整篇都会围绕它展开。

**`decode_responses` 参数**

这是初学者最容易踩的参数。默认情况下 `redis-py` 返回的值是 `bytes`（因为 Redis 协议本身就是字节流）：

```python
r = redis.Redis(host="127.0.0.1", port=6379, db=0)  # 不传 decode_responses
r.set("k", "v")
print(r.get("k"))
# 输出：b'v'      <- bytes 而不是 str
```

传 `decode_responses=True` 后，库会自动把返回的 bytes 解码成 `str`（用 UTF-8），数字类的也会转成 `int`/`float`，用起来更顺手。如果你的数据全都是文本/数字，强烈建议一开始就开 `decode_responses=True`；只有当你要存取二进制图片、pickle 对象等非文本数据时，才需要保持默认的 bytes 模式或单独处理。本篇后续 demo 默认都开 `decode_responses=True`。

## 2. 核心内容

### 2.1 建立连接：redis.Redis 的全部常用参数

`redis.Redis(...)` 不只是 host/port 两件事，它控制着从网络到行为的方方面面。掌握这些参数才能在生产环境正确配置客户端。

**生产环境常用参数**

| 参数 | 默认值 | 作用 |
|------|--------|------|
| `host` | `localhost` | Redis server 的地址 |
| `port` | `6379` | Redis server 的端口 |
| `db` | `0` | 选中哪个库（Redis 默认有 16 个逻辑库 0-15） |
| `password` | `None` | 认证密码（Redis 的 `requirepass`） |
| `decode_responses` | `False` | 是否把返回值自动从 bytes 解码成 str |
| `socket_timeout` | `None` | 单次操作 socket 读超时（秒），防止单命令卡死 |
| `socket_connect_timeout` | `None` | 建立 TCP 连接的超时（秒） |
| `health_check_interval` | `0` | 每隔多少秒做一次 `PING` 健康检查，长连接保活用 |
| `max_connections` | `2**31` | 连接池最大连接数上限 |
| `username` | `None` | Redis 6+ 的 ACL 用户名（配合 password） |
| `ssl` | `False` | 是否用 SSL/TLS 加密连接（云 Redis 常用） |

**连接示例**

```python
import redis

# 典型生产配置：带密码、带超时、开健康检查
r = redis.Redis(
    host="10.0.0.5",
    port=6379,
    db=0,
    password="s3cret-pass",
    decode_responses=True,
    socket_timeout=2,             # 单条命令最多等 2 秒
    socket_connect_timeout=2,     # 建立连接最多等 2 秒
    health_check_interval=30,     # 每 30 秒自动 PING 保活
)

r.set("prod:key", "ok")
print(r.get("prod:key"))
# 输出：ok
```

解释几个容易忽略的点：

- `socket_timeout` 在生产环境必须设。如果某条命令把 Redis 卡住（比如一个写错了的 `KEYS *` 扫描全库），没有超时就会让整个进程的这条连接一直挂着，连不到别的请求。
- `health_check_interval` 用于长连接场景。Redis server 默认不会有心跳，连接闲置过久可能被中间的防火墙/NAT 断掉；库每隔 N 秒发一个 `PING`，既保活又能在连接失效时尽早发现。
- `db` 是逻辑库编号，不是物理库。Redis 把同一个实例的数据分成 16 个命名空间，用 `SELECT n` 切换。不同业务可以用不同 db 做软隔离，但官方更推荐用一台 Redis 对应一个业务，靠 key 前缀区分，生产环境多 db 混用会互相影响。
- Redis 6 引入了 ACL，传统只用 `password`（相当于默认用户 `default`）；如果 server 配置了具名用户，就要同时传 `username` 和 `password`。

**用 URL 连接**

`redis-py` 也支持用 URL 字符串一次性表达所有连接信息，方便从环境变量读取：

```python
import redis

# redis://[username:password@]host:port/db
r = redis.Redis.from_url("redis://:s3cret@127.0.0.1:6379/0", decode_responses=True)
print(r.ping())
# 输出：True

# SSL 连接用 rediss://（多一个 s）
r_ssl = redis.Redis.from_url("rediss://:pass@redis.example.com:6379/0")
```

`from_url` 在部署到不同环境（dev/staging/prod）时特别有用——把整个连接串塞进环境变量，代码里只读 `REDIS_URL`，无需逐字段拼装。

### 2.2 String 类型操作

String 是 Redis 最基础的数据类型，一个 key 对应一个值。虽然叫 String，但它的值可以是普通文本、数字（自增自减）、甚至序列化后的 JSON/二进制——Redis 不关心内容含义，只看到一串 bytes。

**set / get：最基本的读写**

`set(key, value)` 写入，`get(key)` 读取，`exists(key)` 判断是否存在，`delete(key)` 删除。这是 Redis 用得最多的四个操作。

```python
import redis

r = redis.Redis(host="127.0.0.1", port=6379, db=0, decode_responses=True)

# 基本读写
r.set("user:1:name", "alice")
print(r.get("user:1:name"))
# 输出：alice

# 不存在的 key，get 返回 None
print(r.get("user:999:name"))
# 输出：None

# exists 返回 1（存在）或 0（不存在）
print(r.exists("user:1:name"))
# 输出：1
print(r.exists("user:999:name"))
# 输出：0

# delete 返回成功删除的 key 数量
print(r.delete("user:1:name"))
# 输出：1
print(r.get("user:1:name"))
# 输出：None
```

**set 的重要可选参数**

`set` 不只是简单写入，它带几个关键可选参数，覆盖了缓存场景最常见的需求：

| 参数 | 含义 |
|------|------|
| `ex` | 过期时间（秒），到期自动删除，做缓存 TTL 最常用 |
| `px` | 过期时间（毫秒），需要更精细 TTL 时用 |
| `nx` | `True` 时只在 key 不存在才写入（not exists），分布式锁核心 |
| `xx` | `True` 时只在 key 已存在才写入 |
| `exat`/`pxat` | 绝对过期时间戳（秒/毫秒），到期再删 |

```python
# 带过期时间写入：5 秒后自动消失
r.set("token:abc", "valid", ex=5)
print(r.get("token:abc"))
# 输出：valid

# 也可以单独用 expire 给已有 key 设过期
r.expire("token:abc", 10)   # 改成 10 秒
print(r.ttl("token:abc"))   # ttl 返回剩余秒数（-1 永久，-2 不存在）
# 输出：10

# nx 演示：模拟抢锁
ok = r.set("lock:order:1001", "holder-A", nx=True, ex=10)
print(ok)
# 输出：True   <- A 抢到了

ok = r.set("lock:order:1001", "holder-B", nx=True, ex=10)
print(ok)
# 输出：None   <- B 抢失败，key 已存在
```

`nx=True` 配合 `ex` 就是简化版分布式锁的核心实现，原理与陷阱在第 4 章详述。

**incr / decr：原子计数**

`incr(key)` 把 key 的值当整数加 1，`decr(key)` 减 1，`incrby(key, amount)` 按指定增量加。这些操作是原子的——即使有 100 个客户端同时 `incr` 同一个 key，Redis 也能保证每次都正确加 1，不会丢更新。这是 Redis 做计数器、限流的核心能力。

```python
# 文章阅读量计数
r.set("article:42:views", 0)
r.incr("article:42:views")           # +1
r.incr("article:42:views")           # +1
r.incrby("article:42:views", 5)      # +5
print(r.get("article:42:views"))
# 输出：7

r.decr("article:42:views")            # -1
print(r.get("article:42:views"))
# 输出：6

# incr 对不存在的 key 直接从 0 开始加
r.delete("counter:new")
r.incr("counter:new")
print(r.get("counter:new"))
# 输出：1

# 浮点数用 incrbyfloat
r.set("score:x", "10.5")
r.incrbyfloat("score:x", 0.3)
print(r.get("score:x"))
# 输出：10.8
```

注意 `incr` 只能对整数字符串操作，对 `10.5` 这种值会抛 `redis.exceptions.ResponseError`。浮点数要专门用 `incrbyfloat`。

**expire / persist / ttl：过期管理**

```python
r.set("temp:k", "1", ex=100)
print(r.ttl("temp:k"))   # 剩余秒数
# 输出：100

r.persist("temp:k")      # 移除过期，变成永久
print(r.ttl("temp:k"))
# 输出：-1              # -1 表示永久存在

print(r.ttl("not:exist"))
# 输出：-2              # -2 表示 key 根本不存在
```

`ttl` 返回值要区分三种情况：正数=剩余秒数，-1=永久有效，-2=不存在。初学者很容易把 -1 和 -2 搞混。

**mget / mset：批量读写**

一次操作多个 key，比循环调用 `get` 快得多（只有一次网络往返）：

```python
r.mset({"a": "1", "b": "2", "c": "3"})
print(r.mget("a", "b", "c", "nope"))
# 输出：['1', '2', '3', None]
```

`mget` 对不存在的 key 对应位置返回 `None`，顺序和传入的 key 一一对应。

### 2.3 Hash 类型操作

Hash 适合存"一个对象的多字段"。比如一个用户有 `name`/`age`/`city` 字段，比起把整个对象 JSON 序列化成 String，用 Hash 存的好处是：可以单独改某个字段而不需要读出整个对象、改完再整体写回。

**hset / hget / hgetall / hdel**

```python
import redis

r = redis.Redis(host="127.0.0.1", port=6379, db=0, decode_responses=True)

# hset 一次写一个或多个 field
r.hset("user:1001", mapping={
    "name": "alice",
    "age": "28",
    "city": "hangzhou",
})

# hget 读单字段
print(r.hget("user:1001", "name"))
# 输出：alice

# hgetall 读全部字段，返回 dict
print(r.hgetall("user:1001"))
# 输出：{'name': 'alice', 'age': '28', 'city': 'hangzhou'}

# hdel 删除指定字段
r.hdel("user:1001", "city")
print(r.hgetall("user:1001"))
# 输出：{'name': 'alice', 'age': '28'}

# hexists 判断字段是否存在
print(r.hexists("user:1001", "age"))
# 输出：True
```

注意 Hash 里所有 value 都是字符串，即使你写 `28`（int），存进去也是 `"28"`，取出来要自己转类型。这和 Redis 协议里所有值都是字节流的本质一致。

**hset 写单字段 vs 写多字段**

`hset` 有两种传参：

```python
# 单字段
r.hset("user:1002", "name", "bob")

# 多字段（用 mapping）
r.hset("user:1002", mapping={"age": "30", "city": "beijing"})
```

两者可以混用——同一个 key 可以先单字段写、再多字段写，每次 `hset` 只更新传入的字段，不影响其他字段。

**hincrby：Hash 字段自增**

和 String 的 `incr` 类似，但作用在 Hash 的某个字段上：

```python
# 文章被点赞次数存在 Hash 的 likes 字段
r.hset("article:42", "likes", "0")
r.hincrby("article:42", "likes", 1)
r.hincrby("article:42", "likes", 1)
r.hincrby("article:42", "likes", 10)
print(r.hget("article:42", "likes"))
# 输出：12
```

**hkeys / hvals / hlen**

```python
r.hset("product:7", mapping={"name": "phone", "price": "999", "stock": "50"})
print(r.hkeys("product:7"))   # 所有字段名
# 输出：['name', 'price', 'stock']

print(r.hvals("product:7"))   # 所有字段值
# 输出：['phone', '999', '50']

print(r.hlen("product:7"))    # 字段数
# 输出：3
```

**hmget：批量读多个字段**

```python
print(r.hmget("product:7", "name", "price", "nope"))
# 输出：['phone', '999', None]
```

对不存在的字段返回 `None`，顺序和传入参数一致。

### 2.4 List 类型操作

List 是一个有序字符串列表，支持从两端插入/弹出，天然适合做队列、最新列表、消息流。它的底层在元素少时是 ziplist、多时是 quicklist，但这些对使用者透明。

**lpush / rpush：左右插入**

`lpush` 从左端（头部）插入，`rpush` 从右端（尾部）插入：

```python
import redis

r = redis.Redis(host="127.0.0.1", port=6379, db=0, decode_responses=True)

# 先清空，避免和上一轮残留数据混
r.delete("messages")

# 从右端依次插入
r.rpush("messages", "m1", "m2", "m3")
print(r.lrange("messages", 0, -1))   # 0 到 -1 表示全部
# 输出：['m1', 'm2', 'm3']

# 从左端插入
r.lpush("messages", "m0")
print(r.lrange("messages", 0, -1))
# 输出：['m0', 'm1', 'm2', 'm3']
```

`lrange(key, start, stop)` 按下标范围取元素，下标支持负数（-1 是最后一个）。`lrange(key, 0, -1)` 是最常用的"取整个列表"写法。

**lpop / rpop：左右弹出**

```python
r.delete("queue")

r.rpush("queue", "job1", "job2", "job3")
print(r.lrange("queue", 0, -1))
# 输出：['job1', 'job2', 'job3']

# 左端弹出一个（先进先出 → 队列模式）
print(r.lpop("queue"))
# 输出：job1

# 右端弹出一个
print(r.rpop("queue"))
# 输出：job3

print(r.lrange("queue", 0, -1))
# 输出：['job2']
```

`lpush` 配合 `rpop`（或 `rpush` 配合 `lpop`）就是 FIFO 队列；`lpush` 配合 `lpop` 就是栈（LIFO）。同一组原语，靠不同搭配表达两种语义。

**llen：长度**

```python
r.delete("queue")
r.rpush("queue", "a", "b", "c")
print(r.llen("queue"))
# 输出：3
```

**lindex：按下标取值**

```python
print(r.lindex("queue", 0))   # 最左
# 输出：a
print(r.lindex("queue", -1))  # 最右
# 输出：c
```

`lindex` 是 O(N) 操作（在 quicklist 上要遍历），不要在长列表上频繁随机访问，那是 List 不擅长的场景（应该用 ZSet 或 Hash+列表索引）。

**典型场景：最近访问列表**

List 最经典的用法之一是维护"最新 N 条"——比如最近访问的 10 个商品。`lpush` 入队后用 `ltrim` 裁剪只保留前 N 个：

```python
r.delete("recent:goods:user:1")

for gid in [101, 102, 103, 104, 105]:
    r.lpush("recent:goods:user:1", gid)
    r.ltrim("recent:goods:user:1", 0, 2)   # 只保留前 3 条

print(r.lrange("recent:goods:user:1", 0, -1))
# 输出：['105', '104', '103']
```

`ltrim(key, start, stop)` 把列表裁剪成指定范围，其他元素被删除。配合 `lpush` 每次先插入到头部、再 `ltrim` 砍到固定长度，就实现了定长最新列表。

### 2.5 Set 类型操作

Set 是无序、去重的字符串集合，适合存"标签""参与某活动的用户""共同好友"这类需要去重和集合运算（交集/并集/差集）的数据。

**sadd / smembers / sismember / srem**

```python
import redis

r = redis.Redis(host="127.0.0.1", port=6379, db=0, decode_responses=True)

r.delete("tags:article:1")

# sadd 一次添加多个元素（重复的自动忽略）
r.sadd("tags:article:1", "python", "redis", "cache")
r.sadd("tags:article:1", "python")  # 重复添加，无效果

# smembers 返回所有元素（无序）
print(r.smembers("tags:article:1"))
# 输出：{'python', 'redis', 'cache'}   # 顺序可能不同

# sismember 判断是否在集合中，返回 bool
print(r.sismember("tags:article:1", "redis"))
# 输出：True
print(r.sismember("tags:article:1", "java"))
# 输出：False

# srem 移除元素
r.srem("tags:article:1", "cache")
print(r.smembers("tags:article:1"))
# 输出：{'python', 'redis'}

# scard 返回集合大小
print(r.scard("tags:article:1"))
# 输出：2
```

**集合运算：sinter / sunion / sdiff**

Set 真正的威力在集合运算。以"共同关注"举例：

```python
r.delete("follows:alice", "follows:bob")
r.sadd("follows:alice", "u1", "u2", "u3", "u4")
r.sadd("follows:bob", "u3", "u4", "u5")

# 交集：共同关注的人
print(r.sinter("follows:alice", "follows:bob"))
# 输出：{'u3', 'u4'}

# 并集：两人关注的所有人
print(r.sunion("follows:alice", "follows:bob"))
# 输出：{'u1', 'u2', 'u3', 'u4', 'u5'}

# 差集：alice 关注但 bob 没关注
print(r.sdiff("follows:alice", "follows:bob"))
# 输出：{'u1', 'u2'}
```

`sinter` 是 O(N) 但 N 是最小集合大小，对中小规模集合非常快。Redis 7+ 还提供 `SINTERCARD` 只返回交集大小不求具体元素，更省带宽。

### 2.6 ZSet（Sorted Set）类型操作

ZSet 是 Redis 最有特色的数据结构：和 Set 一样去重，但每个元素带一个 score（分数），元素按 score 排序。排行榜、延时队列、范围查找都靠它。

**zadd / zrange / zrevrange**

```python
import redis

r = redis.Redis(host="127.0.0.1", port=6379, db=0, decode_responses=True)

r.delete("rank:game")

# zadd 用 {member: score} 的 mapping
r.zadd("rank:game", {"alice": 100, "bob": 80, "carol": 150, "dave": 120})

# zrange 默认按 score 升序，返回 member
print(r.zrange("rank:game", 0, -1))
# 输出：['bob', 'alice', 'dave', 'carol']

# 带 withscores=True 同时返回分数
print(r.zrange("rank:game", 0, -1, withscores=True))
# 输出：[('bob', 80.0), ('alice', 100.0), ('dave', 120.0), ('carol', 150.0)]

# zrevrange 降序（高分在前）
print(r.zrevrange("rank:game", 0, 2, withscores=True))
# 输出：[('carol', 150.0), ('dave', 120.0), ('alice', 100.0)]   # top 3
```

**zincrby：分数自增**

这是排行榜实时更新的核心操作。玩家得分后调用 `zincrby` 给自己的 score 加分：

```python
# bob 完成 30 分的任务
r.zincrby("rank:game", 30, "bob")
print(r.zscore("rank:game", "bob"))
# 输出：110.0
```

`zscore(key, member)` 取单个元素的当前分数，不存在返回 `None`。

**zrank / zrevrank：获取排名**

```python
# zrank 升序排名（0 开始），分数最低排第 0
print(r.zrank("rank:game", "carol"))
# 输出：3    # carol 分数最高，升序排第 3

# zrevrank 降序排名，分数最高排第 0（即"第 1 名"）
print(r.zrevrank("rank:game", "carol"))
# 输出：0    # 冠军
```

**zrangebyscore：按分数范围查**

```python
# 分数在 [100, 130] 之间的玩家
print(r.zrangebyscore("rank:game", 100, 130, withscores=True))
# 输出：[('alice', 100.0), ('bob', 110.0), ('dave', 120.0)]
```

Redis 6.2+ 推荐用更通用的 `zrange(..., byscore=True)`，但 `zrangebyscore` 仍然兼容且语义更直观。

**zrem / zcard**

```python
r.zrem("rank:game", "dave")
print(r.zcard("rank:game"))   # 剩余元素数
# 输出：3
```

**典型场景：游戏积分排行榜**

完整的小场景——玩家上线、得分、查 Top3、查自己排名：

```python
r.delete("leaderboard")

# 初始分数
r.zadd("leaderboard", {"alice": 0, "bob": 0, "carol": 0})

# 多轮比赛后实时加分
r.zincrby("leaderboard", 120, "alice")
r.zincrby("leaderboard", 95, "bob")
r.zincrby("leaderboard", 150, "carol")
r.zincrby("leaderboard", 30, "alice")   # alice 再加 30

# 查 Top3（降序）
top3 = r.zrevrange("leaderboard", 0, 2, withscores=True)
print("Top3:", top3)
# 输出：Top3: [('carol', 150.0), ('alice', 150.0), ('bob', 95.0)]

# 查 alice 当前排名（第几名，从 0 计）
print("alice 排名:", r.zrevrank("leaderboard", "alice"))
# 输出：alice 排名: 1   # 并列第 1，按字典序 alice 在 carol 前
```

注意 ZSet 对同分元素按 member 字典序排序——`alice` 和 `carol` 都是 150 分，`alice` 字典序在前所以排第 0。

### 2.7 通用键操作

不局限于某一种数据类型，对所有 key 都适用的命令。

**keys：按模式查找所有匹配的 key**

```python
r.delete("user:1", "user:2", "order:1")
r.set("user:1", "a")
r.set("user:2", "b")
r.set("order:1", "c")

# 匹配以 user: 开头的 key
print(r.keys("user:*"))
# 输出：['user:1', 'user:2']   # 顺序不保证
```

**生产环境慎用 keys**：`keys` 会扫描整个 keyspace，在百万级 key 的生产库上调用 `KEYS *` 会让 Redis 卡顿数百毫秒甚至几秒，期间所有其他命令都得排队。生产环境需要按模式扫描要用 `scan`（游标式增量扫描，不阻塞）：

```python
# scan 分批扫描，每次返回一个游标和这批 key
cursor = 0
result_keys = []
while True:
    cursor, batch = r.scan(cursor=cursor, match="user:*", count=100)
    result_keys.extend(batch)
    if cursor == 0:
        break

print(result_keys)
# 输出：['user:1', 'user:2']
```

`count` 只是提示，不保证每批正好返回这么多，但总体上比 `keys` 安全得多，是生产扫描 key 的正确姿势。

**type：查看 key 的数据类型**

```python
r.delete("k1", "k2")
r.set("k1", "v")
r.lpush("k2", "a", "b")

print(r.type("k1"))
# 输出：string
print(r.type("k2"))
# 输出：list
print(r.type("not:exist"))
# 输出：none
```

`type` 返回的是字符串：`string`/`list`/`set`/`zset`/`hash`/`stream`/`none`。用错了类型操作会抛 `redis.exceptions.ResponseError`（比如对一个 list 调用 `get`）。

**exists：批量判断存在性**

```python
r.set("a", "1")
r.set("b", "2")
print(r.exists("a", "b", "nope"))
# 输出：2   # 返回存在的 key 数量
```

传多个 key 时返回的是总共存在的 key 数（不是逐个 bool），这点和单参数版本含义要区分。

**expire / persist / ttl / expireat**

```python
r.set("k", "v", ex=60)
print(r.ttl("k"))        # 剩余秒
# 输出：60

r.expire("k", 120)        # 改成 120 秒
print(r.ttl("k"))
# 输出：120

r.persist("k")            # 移除过期
print(r.ttl("k"))
# 输出：-1

# expireat 设绝对过期时间戳
import time
r.set("k2", "v")
r.expireat("k2", int(time.time()) + 3600)   # 1 小时后过期
print(r.ttl("k2"))
# 输出：3600
```

**delete 批量删除**

```python
r.set("d1", "1")
r.set("d2", "2")
r.set("d3", "3")
print(r.delete("d1", "d2", "d3"))
# 输出：3
```

`delete` 支持一次传多个 key，比循环删除快。要注意大 key（比如几万元素的 Hash）删除仍会阻塞 Redis，生产环境可用 `unlink`（异步删除）。

**info：查看 server 状态**

```python
info = r.info()
print(info["redis_version"])
print(info["connected_clients"])
print(info["used_memory_human"])
# 输出示例：
# 7.2.5
# 3
# 1.10M
```

`info()` 返回一个大字典，包含版本、内存、客户端数、命中率等关键指标，是排查 Redis 问题时的第一手数据来源。

### 2.8 pipeline：批量命令减少往返

每条命令都是一次"客户端发请求 → 等服务端返回"的网络往返（RTT）。要连续执行 1000 条 `set`，循环调用就是 1000 次 RTT，在 1ms 的内网也是 1 秒。`pipeline` 把多条命令打包，一次性发出去、一次性收回来，只需要 1 次 RTT，性能提升通常是一个数量级以上。

```python
import redis

r = redis.Redis(host="127.0.0.1", port=6379, db=0, decode_responses=True)

# 不用 pipeline：1000 次 set = 1000 次 RTT
# for i in range(1000):
#     r.set(f"k{i}", i)

# 用 pipeline：1000 次 set = 1 次 RTT
pipe = r.pipeline()
for i in range(1000):
    pipe.set(f"pipe:k{i}", i)
results = pipe.execute()   # 一次性发送并接收所有结果
print(len(results))
# 输出：1000

# pipeline 也支持链式写法
pipe = r.pipeline()
pipe.set("p:a", "1").set("p:b", "2").get("p:a").get("p:b")
print(pipe.execute())
# 输出：[True, True, '1', '2']
```

`pipeline` 把命令缓冲在客户端，调用 `execute()` 才真正发出。返回值是一个列表，顺序和命令一一对应。

**pipeline 的两种语义**

要特别强调一个常见误解：redis-py 的 `pipeline` **默认不保证原子性**，它只是"打包发送"。在打包过程中，其他客户端的命令可能插进来执行。如果你需要"这批命令要么全部连续执行、要么不执行"的原子性，要用事务（`MULTI/EXEC`，下节讲）。这一点初学者常常把 pipeline 当事务用，结果在并发下踩坑。

```python
# 明确开启事务模式（pipeline(transaction=True) 等价于 MULTI...EXEC）
pipe = r.pipeline(transaction=True)
pipe.set("tx:a", "1")
pipe.incr("tx:a")
print(pipe.execute())
# 输出：[True, 2]
```

`pipeline()` 默认 `transaction=True`，所以默认其实是带事务的——这是 redis-py 一个容易让人困惑的设计：名字叫 pipeline 但默认行为是事务队列。如果你要纯 pipeline（不事务、不要 MULTI/EXEC 开销），传 `transaction=False`。大多数场景默认事务模式没问题，但要知道区别。

### 2.9 事务与 watch：MULTI/EXEC 与乐观锁

Redis 的事务和关系数据库的事务不同——它没有回滚，所谓事务其实是"把多条命令打包，按顺序连续执行，中间不会被其他客户端打断"。`MULTI` 开启事务，之后所有命令只是入队不执行，直到 `EXEC` 才一次性按顺序执行。

`watch(key)` 提供乐观锁（CAS）：在 `MULTI` 之前 `watch` 一个或多个 key，如果在 `EXEC` 之前这些 key 被其他客户端改了，整个事务会被取消（`EXEC` 返回 `None`）。这是实现"先读后写"并发安全的关键原语。

**watch 实现 CAS 转账**

经典场景：从 A 账户转 100 到 B 账户。要先读 A 余额、判断够不够、再扣减。如果中间 A 的余额被别人改了，我们的判断就失效了。用 `watch` 可以在执行前发现这种冲突，重试即可：

```python
import redis

r = redis.Redis(host="127.0.0.1", port=6379, db=0, decode_responses=True)

r.set("balance:A", "500")
r.set("balance:B", "300")


def transfer(from_key, to_key, amount):
    """带乐观锁的转账：被别人打断就重试。"""
    with r.pipeline() as pipe:
        while True:
            try:
                # 先 watch 两个余额，任何一方被改都会让事务失败
                pipe.watch(from_key, to_key)
                bal_from = int(pipe.get(from_key))
                if bal_from < amount:
                    pipe.unwatch()
                    return False, "余额不足"

                # 开启事务
                pipe.multi()
                pipe.decrby(from_key, amount)
                pipe.incrby(to_key, amount)
                result = pipe.execute()   # 若 watch 的 key 被改，这里抛 WatchedMutexError
                return True, result
            except redis.WatchedError:
                # 余额在 watch 之后、EXEC 之前被改了，重试
                continue


print(transfer("balance:A", "balance:B", 100))
# 输出：(True, [400, 400])

print(r.get("balance:A"), r.get("balance:B"))
# 输出：400 400
```

`with r.pipeline() as pipe` 会自动在退出时 `reset()`（包含 `unwatch`），但显式 `pipe.unwatch()` 在提前 return 的分支里更清晰。`WatchedError` 是 redis-py 在检测到 watch 失效时抛的异常，循环捕获就是 CAS 重试。

### 2.10 发布订阅：pubsub

Redis 的 Pub/Sub 是简单的消息广播模型：发布者把消息发到某个 channel，所有订阅该 channel 的客户端同时收到。特点是消息发出去就没了（不持久化），错过订阅期就收不到，适合实时通知、IM 在线推送，不适合靠谱的消息队列（那要用 Stream 或专业 MQ）。

**基础 pubsub**

```python
import redis
import threading
import time

r = redis.Redis(host="127.0.0.1", port=6379, db=0, decode_responses=True)


def subscriber():
    sub = r.pubsub()
    sub.subscribe("chat:room:1")              # 订阅频道
    for msg in sub.listen():                  # 阻塞监听
        if msg["type"] == "message":          # 真正的消息才处理
            print(f"[订阅端收到] {msg['data']}")
            if msg["data"] == "STOP":
                sub.unsubscribe("chat:room:1")
                break


# 开线程模拟订阅端
t = threading.Thread(target=subscriber, daemon=True)
t.start()
time.sleep(0.3)

# 主线程做发布端
r.publish("chat:room:1", "hello everyone")
r.publish("chat:room:1", "how are you")
r.publish("chat:room:1", "STOP")
t.join(timeout=1)

# 输出：
# [订阅端收到] hello everyone
# [订阅端收到] how are you
# [订阅端收到] STOP
```

几个要点：

- `pubsub()` 返回一个 `PubSub` 对象，调用 `subscribe(channel)` 订阅。`listen()` 是阻塞迭代器，没消息就一直挂着。
- 收到的每条消息是个字典：`type` 可能是 `subscribe`（订阅确认）、`message`（真消息）、`unsubscribe` 等，处理时要过滤 `type == "message"`。
- 发布端就是普通的 `publish(channel, message)`，返回值是"收到这条消息的订阅者数量"。
- 一个 Redis 实例既能订阅也能发布，没特殊限制。
- `listen()` 会阻塞当前线程，所以在 Web 服务里通常要单开一个线程或在异步框架里用 `redis.asyncio`。

**psubscribe：模式订阅**

```python
sub = r.pubsub()
sub.psubscribe("chat:room:*")   # 匹配以 chat:room: 开头的所有频道
```

`psubscribe` 用通配符订阅一类频道，`punsubscribe` 取消。

### 2.11 应用场景总览

把前面这些 API 串起来，看看真实业务里 Redis 怎么用。

**缓存：查库前先查 Redis**

最典型的用法。接口被频繁访问、底层数据不常变，就把查询结果按 key 缓存一段时间，命中直接返回，未命中再查库并回填缓存。

```python
import redis
import json
import time

r = redis.Redis(host="127.0.0.1", port=6379, db=0, decode_responses=True)

# 模拟一个"较慢"的数据库查询
def query_user_from_db(user_id):
    time.sleep(0.05)   # 假装查库耗时 50ms
    return {"id": user_id, "name": f"user_{user_id}", "age": 20 + user_id % 30}


def get_user(user_id):
    cache_key = f"user:cache:{user_id}"
    cached = r.get(cache_key)
    if cached is not None:
        return json.loads(cached), "cache hit"

    user = query_user_from_db(user_id)
    # 缓存 60 秒，避免热点数据过期后穿透叠加
    r.set(cache_key, json.dumps(user), ex=60)
    return user, "cache miss"


print(get_user(101))
# 输出：({'id': 101, 'name': 'user_101', 'age': 21}, 'cache miss')

print(get_user(101))
# 输出：({'id': 101, 'name': 'user_101', 'age': 21}, 'cache hit')
```

**计数器：incr 防并发丢更新**

用 Redis 计数的好处是原子自增，多进程多线程并发 `incr` 都不会丢数。下面统计 API 调用次数：

```python
r.delete("api:call:count")

def call_api(api_name):
    # 每次调用给对应 key +1，按 天 维度统计可拼日期
    today = "20260723"
    key = f"api:call:{api_name}:{today}"
    r.incr(key)
    r.expire(key, 86400 * 7)   # 保留 7 天

call_api("search")
call_api("search")
call_api("search")
print(r.get("api:call:search:20260723"))
# 输出：3
```

**分布式锁：set nx**

简化版分布式锁——保证同一时刻只有一个进程能处理某个资源（比如定时任务去重、订单处理互斥）：

```python
import time
import uuid

def acquire_lock(r, lock_key, ttl=10):
    """尝试获取锁，返回 token（成功）或 None（失败）。"""
    token = uuid.uuid4().hex
    # nx + ex 原子地"抢锁并设过期"，防死锁
    ok = r.set(lock_key, token, nx=True, ex=ttl)
    return token if ok else None


def release_lock(r, lock_key, token):
    """释放锁：必须比对 token，避免误删别人的锁。"""
    # 用 Lua 脚本保证"判 token + del"两步原子执行
    lua = """
    if redis.call('GET', KEYS[1]) == ARGV[1] then
        return redis.call('DEL', KEYS[1])
    else
        return 0
    end
    """
    return r.eval(lua, 1, lock_key, token)


# 使用
lock_key = "lock:task:cleanup"
token = acquire_lock(r, lock_key, ttl=10)
if token is None:
    print("锁已被别人持有，跳过")
else:
    try:
        print("拿到锁，开始干活")
        # do work ...
    finally:
        release_lock(r, lock_key, token)
        print("已释放锁")
# 输出：
# 拿到锁，开始干活
# 已释放锁
```

为什么释放锁要用 Lua？因为"判断 token 是不是自己" 和 "删除 key"这两步如果不是原子的，就可能：A 超时被自动释放 → B 拿到锁 → A 这时才执行 del 把 B 的锁删了。Lua 脚本在 Redis 里单线程执行，天然原子。

**排行榜：ZSet**

在 2.6 节已演示，这里简化重申模式：

```python
r.delete("rank:score")
# 入榜
r.zadd("rank:score", {"a": 10, "b": 20, "c": 15})
# 实时加分
r.zincrby("rank:score", 5, "a")
# 查 top3
print(r.zrevrange("rank:score", 0, 2, withscores=True))
# 输出：[('b', 20.0), ('a', 15.0), ('c', 15.0)]
```

**消息队列：List**

简易队列，生产者 `lpush` 入队，消费者 `brpop` 阻塞弹出：

```python
import threading

def consumer():
    while True:
        # brpop 阻塞 10 秒，超时返回 None
        item = r.brpop("mq:tasks", timeout=10)
        if item is None:
            print("队列空，退出")
            break
        _, task = item
        print(f"处理任务: {task}")
        if task == "END":
            break

t = threading.Thread(target=consumer, daemon=True)
t.start()

r.lpush("mq:tasks", "task1", "task2", "END")
t.join(timeout=2)
# 输出：
# 处理任务: END
# 处理任务: task2
# 处理任务: task1
```

`brpop` 阻塞式弹出，避免消费者空轮询消耗 CPU。注意 `brpop` 返回的是 `(key, value)` 元组，不是单值。这个简易队列的缺陷是没有 ACK 机制——弹出后消费者崩溃任务就丢了，生产级要用 Redis Stream 或专业 MQ。

## 3. 最佳实践

这一章讲实际编码中容易踩的坑和推荐写法，偏工程经验。

**连接复用：必须用连接池或单例客户端**

错误做法：每次请求都 `redis.Redis(...)` 新建一个客户端。每次新建都会走 TCP 三次握手 + AUTH，开销大且会快速堆积连接数。

正确做法：整个进程共享一个 `redis.Redis` 实例（它内部带 `ConnectionPool` 自动复用连接），或显式建一个 `ConnectionPool` 给所有客户端共用：

```python
import redis

# 进程级单例池
pool = redis.ConnectionPool(
    host="127.0.0.1",
    port=6379,
    db=0,
    password="xxx",
    decode_responses=True,
    max_connections=50,
    health_check_interval=30,
)

# 不同地方都从同一个池取连接
r1 = redis.Redis(connection_pool=pool)
r2 = redis.Redis(connection_pool=pool)
```

`ConnectionPool` 内部维护一个连接的 LIFO 栈，每次命令借一个、用完还回去；连接断了会自动重建。`max_connections` 设上限防止连接暴涨。

**生产环境必须设超时**

```python
# 推荐：每个命令读超时 + 建连超时都设
r = redis.Redis(
    host="...",
    socket_timeout=2,          # 单条命令最多阻塞 2 秒
    socket_connect_timeout=2,  # 建连最多阻塞 2 秒
    socket_keepalive=True,     # 开 TCP keepalive
    health_check_interval=30,
)
```

没设超时是常见线上事故源——某条慢命令或网络抖动让连接一直挂着，进程假死。

**大 key 警惕**

避免在一个 key 里堆积几十万元素（巨型 Hash/List/Set），Redis 单线程处理大 key 会阻塞所有其他命令：

- 不推荐：一个 `timeline:global` List 放几百万条消息。
- 推荐：分桶（`timeline:global:bucket:0`、`bucket:1`），或用 ZSet+分页。
- 删除大 key 用 `UNLINK`（`r.unlink(key)`）而不是 `DEL`，前者异步删除不阻塞。
- 批量删多个 key 也建议用 `scan` + 小批 `unlink`，而不是一次 `delete(*huge_list)`。

**`keys` 永远不要在生产打得过密**

`keys *` 在百万级 key 上是 P0 事故级别操作。要按模式找 key 永远用 `scan`，并控制 `count`、分批处理。

**`decode_responses` 的取舍**

- 数据几乎都是文本/数字 → 开 `decode_responses=True` 最方便。
- 要存二进制（图、pickle、msgpack）→ 保持默认 bytes，或单独用一个未开 `decode_responses` 的客户端实例处理二进制 key，避免和文本客户端混用同一个对象。
- 混合策略：开 `decode_responses` 的客户端用于业务文本，另起一个 `redis.Redis(connection_pool=raw_pool)` 不开解码用于存取 bytes。

**pipeline 与事务要分清**

需要"批量发减少 RTT" → `r.pipeline(transaction=False)`。
需要"连续执行不被打断" → `r.pipeline()` 默认就是事务（`MULTI/EXEC`）。
需要"先读后写并发安全" → `watch` + `multi` + 循环重试。

不要把 `pipeline(transaction=False)` 当成原子事务用——并发下会出错。

**锁的正确姿势**

- 永远 `set nx ex`，不要先 `setnx` 再单独 `expire`（两步非原子，进程崩溃可能留下无过期锁）。
- 释放锁必须比对 token（Lua 脚本），不能无脑 `del`。
- 长任务要考虑锁续期（后台线程定时 `expire` 续期），否则 TTL 到了别人能拿到锁、自己还在跑就双持。
- 高可靠场景用 Redisson 风格的 Redlock 或直接上 Zookeeper/etcd，单节点 Redis 锁在主从切换时可能丢锁。

**scan 的 count 误区**

`scan(count=100)` 不保证每次返回 100 条，`count` 只是给 Redis 的"建议"值。循环时要靠 `cursor == 0` 判断结束，不要靠累计条数。

**TTL 单位**

Redis TTL 单位是秒或毫秒，`redis-py` 的 `ex` 是秒、`px` 是毫秒。`ttl()` 返回秒、`pttl()` 返回毫秒。混用容易差 1000 倍。

**关闭 pubsub 与连接**

`PubSub` 对象持有自己的连接，不再用时要 `close()`，否则会泄露连接：

```python
sub = r.pubsub()
sub.subscribe(...)
# ... 用完
sub.close()
```

在长跑进程里这点尤其重要。

**异常分类处理**

`redis-py` 的常见异常都在 `redis.exceptions` 下：

- `ConnectionError`：连接不上、断了 → 通常是网络或 server 挂了，可重试。
- `TimeoutError`：命令超时 → 可能是慢命令或拥堵，重试前应限流。
- `ResponseError`：服务端返回错误（类型用错、语法错）→ 不会自愈，是代码 bug。
- `WatchedError`：watch 的事务被取消 → 业务层重试。
- `DataError`：数据格式无效（如 `incr` 一个非数字）。

对网络类错误做有限重试是合理的，对 `ResponseError` 直接抛出——重试没用。

## 4. 原理

这一章讲机制：redis-py 与 Redis server 之间到底怎么通信，连接池怎么复用，pipeline 怎么省 RTT，事务怎么保证原子，watch 怎么实现 CAS，分布式锁的陷阱在哪，pub/sub 的 channel 模型如何运作。

### 4.1 RESP 协议：客户端与服务端的对话语言

Redis 客户端和服务端之间用一种叫 RESP（REdis Serialization Protocol）的文本协议通信。它非常简单——每条数据前面加一个字符标识类型，用 `\r\n` 结尾：

- `+OK\r\n`：简单字符串（状态回复），如 `SET` 成功返回的 `OK`。
- `-ERR ...\r\n`：错误回复。
- `:1000\r\n`：整数，如 `INCR` 的返回值。
- `$5\r\nhello\r\n`：定长字符串，`$` 后是长度，然后是内容。
- `*3\r\n$3\r\nSET\r\n$3\r\nkey\r\n$5\r\nhello\r\n`：数组，`*` 后是元素数，每个元素是上面任一类型。

当你在 Python 里调用 `r.set("key", "hello")`，redis-py 做的事情是：

1. 把方法名和参数拼成 RESP 数组：`*3\r\n$3\r\nSET\r\n$3\r\nkey\r\n$5\r\nhello\r\n`。
2. 通过 TCP socket 把这串字节发给 Redis server。
3. 阻塞读取服务端响应，按 RESP 规则解析，把 `+OK\r\n` 解析成 Python 的 `True`（`set` 成功）。

所以每条命令的网络成本 = 一次 socket 写 + 一次 socket 读 + 服务端处理。在内网这通常亚毫秒级，但跨可用区或公网就会显著。

RESP 在 Redis 6 引入了 RESP3（支持更多类型如 map、set、double），但 redis-py 默认仍用 RESP2（兼容性最好），够用就行。

### 4.2 ConnectionPool：连接复用的内部机制

`redis-py` 的每个 `Redis` 实例内部有一个 `ConnectionPool`。它的工作机制：

1. 命令要执行时，从池里"借"一个 `Connection` 对象（封装了 TCP socket + 读写缓冲）。
2. 如果池里有空闲连接（LIFO 栈顶），直接复用；没有且未达 `max_connections`，新建一个（TCP 三次握手 + `AUTH` + `SELECT db`）；已达上限，阻塞等待或抛 `ConnectionError`。
3. 命令通过这个 `Connection` 发出、读回结果。
4. 把 `Connection` 还回池顶，供下次复用。
5. 如果某次命令发现连接已断（`ConnectionError`），池会丢弃这条坏连接、新建一条重试（限定次数）。

为什么 LIFO 而不是 FIFO？因为刚用过的连接大概率还没被中间网络设备（NAT、防火墙）回收，复用它健康度最高；同时 LIFO 让"多余的连接"自然沉在栈底被闲置，方便回收。

`health_check_interval` 的作用：一个连接闲置超过这个间隔，下次被借出前先发一个 `PING`，如果 server 不响应就丢弃重建。这避免了"借到一条已经死了的连接"导致命令失败。

整个机制对用户透明：你只管 `r.set(...)`，池自动管连接。这就是为什么进程级共享一个 `Redis` 实例就够——池会按并发量自动扩缩连接数。

### 4.3 pipeline：把多条命令打包一次发送

普通模式下，redis-py 严格遵循"请求-响应"模型：每条命令发出后必须读完响应才能发下一条。这是因为要拿到返回值给调用者。这导致 N 条命令 = N 次 RTT。

pipeline 的做法：把 N 条命令的 RESP 报文全部缓冲在客户端，到 `execute()` 时一次性 `socket.sendall` 发出去（一个 TCP 包或少数几个大包），然后一次性读取所有响应。这样网络往返次数从 N 降到 1，在 1ms 内网节省可能不明显，但在跨机房或公网就是几十倍提速。

同时 pipeline 还省了 Redis server 的"读 socket → 解析 → 执行 → 写 socket"的循环开销——server 一次读到一个长报文，连续解析连续执行，比 N 次单独读处理效率高。

但 pipeline 不等于事务：默认 `transaction=False` 时，server 收到这批命令只是"尽快连续执行"，中间仍可能被其他客户端命令插队。要真正原子连续执行必须靠 `MULTI/EXEC`。

### 4.4 MULTI/EXEC：事务的原子执行

Redis 事务的流程：

1. 客户端发 `MULTI`，server 进入"事务模式"，之后客户端发的命令不入库执行，而是入事务队列，返回 `QUEUED`。
2. 客户端发 `EXEC`，server 把队列里的命令按顺序连续执行，把所有结果一次性返回。
3. `DISCARD` 可以取消事务（清空队列、退出事务模式）。

关键点：**server 在执行 `EXEC` 队列里的命令时不会被其他客户端打断**——Redis 单线程模型保证了这一点。这就是 Redis 事务的"原子性"：要么全部连续执行，要么（如果被 watch 取消）都不执行。

但 Redis 事务**没有回滚**：如果队列里的某条命令执行时出错（比如对字符串 `INCR`），后续命令仍会继续执行，已执行的不会回滚。这是和关系数据库事务最大的不同，写代码时要保证队列里的命令本身是正确的，别指望出错回滚。

redis-py 的 `pipeline(transaction=True)`（默认）就是把命令缓冲到客户端，`execute()` 时先发 `MULTI`、再发所有命令、最后发 `EXEC`，一次往返完成。

### 4.5 WATCH：乐观锁的 CAS 机制

`WATCH key [key ...]` 是在 `MULTI` 之前执行的，作用是给 server 打个标记："在接下来的事务 `EXEC` 之前，这些 key 一旦被任何客户端（包括自己非事务命令）修改，整个事务就作废"。

server 端的实现：每个被 watch 的 key 在 server 的 `watched_keys` 字典里记录"哪些客户端在 watch 它"。当任意命令修改这个 key 时，server 遍历这条 key 上所有 watch 的客户端，把它们标记为 `dirty`。等某个客户端发 `EXEC` 时，server 检查它是不是 `dirty`，是的话直接返回 `nil`、不执行队列；不是的话正常执行。

这就实现了 CAS（Compare-And-Swap）语义：你"看了一眼"某个值，然后想基于这个值做更新；如果在你执行更新前这个值被别人改了，你的更新就失败、可以重试。

前面转账示例的 `while True` 重试循环就是典型的 CAS 自旋：`watch` → 读 → 判断 → `multi` → 写 → `exec`；只要 `exec` 不抛 `WatchedError` 就说明没被打断、更新成功；抛了就重新读、重新判断。

注意 `WATCH` 必须在 `MULTI` 之前，且事务结束（`EXEC` 或 `DISCARD`）后自动 `UNWATCH`。redis-py 的 `pipeline` 在 `execute()` 后会重置 watch 状态。

### 4.6 set NX EX：分布式锁的原理与陷阱

**基本原理**

`SET key value NX EX ttl` 是一条原子命令（Redis 单命令总是原子的），它做了两件事：只在 key 不存在时写入（`NX`）、并设过期时间（`EX`）。这是分布式锁的标准获取姿势：

- `NX` 保证只有一个客户端能抢到锁。
- `EX ttl` 保证持锁进程崩溃后锁会自动释放，不会死锁。
- `value` 存一个唯一 token（如 `uuid4().hex`），释放时用来判断锁是不是自己的。

**陷阱一：两步获取锁（错误写法）**

```python
# 错误：setnx 和 expire 是两条命令，中间进程崩溃会留下无过期锁
ok = r.setnx("lock", "token")
if ok:
    r.expire("lock", 10)   # 如果在这一行之前进程崩了，锁永不释放
```

正确写法是 `r.set("lock", token, nx=True, ex=10)` 一步完成。

**陷阱二：误释放别人的锁**

```python
# 错误：无脑 del
r.delete("lock")   # 可能此时自己锁已超时、别人已拿到新锁，这里把别人的锁删了
```

正确写法是释放时用 Lua 脚本"判断 token + 删除"两步原子化：

```python
lua = """
if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
else
    return 0
end
"""
r.eval(lua, 1, "lock", token)
```

**陷阱三：锁续期**

任务执行时间超过 TTL，锁自动释放，别的进程拿到锁，自己还在跑 → "双持"。解决办法是开一个后台线程，在持锁期间定时 `expire` 续期（拉长 TTL），任务结束才停续期。Redis 官方的 Redlock 客户端（Redisson）就内置了这种 watchdog 机制。

**陷阱四：单节点锁在故障转移时丢失**

主节点宕机、从节点提升为主，但锁还没同步到从节点 → 新主上锁丢了，别的进程能拿到相同的锁。这是单机 Redis 锁的根本局限。对正确性要求高的场景要用 Redlock（向多个独立 Redis 节点同时抢锁，多数成功才算成功）或上 Zookeeper/etcd。

### 4.7 发布订阅的 channel 模型

Redis Pub/Sub 的工作方式：

- server 内存里维护一个 `pubsub_channels` 字典：`channel -> 订阅客户端集合`。
- `SUBSCRIBE channel` 把当前连接加入这个 channel 的订阅者集合。
- `PUBLISH channel message` 遍历集合，把消息按 RESP 格式推给每个订阅者的连接。
- 订阅者不需要主动请求，server 主动推送（在 `listen()` 阻塞读 socket 时收到）。

关键特性与局限：

1. **不持久化**：消息发出去就删，订阅者不在线时发的消息收不到。这和 Stream、Kafka 的消费位点持久化截然不同。
2. **消息payload 是 fire-and-forget**：没 ACK、没重试，订阅者崩了期间消息全丢。
3. **性能很好**：server 只需遍历内存集合推送，不做持久化，吞吐高、延迟低。
4. **`PSUBSCRIBE pattern`** 用模式匹配订阅多个 channel，server 额外维护 `pubsub_patterns` 列表做匹配。

所以 Pub/Sub 适合"实时广播、丢得起"的场景（聊天室在线消息、实时行情推送、配置变更通知），不适合"不能丢一条"的业务消息队列。后者要用 Redis Stream（`XADD/XREAD/XACK`，带持久化与消费组）或专业 MQ。

### 4.8 单线程模型的含义

理解 Redis 的机制绕不开"单线程"：核心命令处理（解析、执行、写回）在一个主线程里串行完成。这带来两个关键推论：

1. **单命令天然原子**：`INCR`、`SET NX`、`ZADD` 这些命令不会被其他命令打断，所以可以用作并发原语（计数器、锁）。
2. **慢命令拖累全局**：一条 `KEYS *` 扫几百万 key 会阻塞所有其他客户端的命令。这就是为什么生产禁用 `KEYS`、慎用大 key 操作。

Redis 6 用 I/O 多线程加速网络读写（socket read/write 并行），但命令执行仍是单线程，原子性语义不变。

## 5. 总结

- 本文系统讲解了 redis-py 同步客户端：从安装、连接参数，到 String/Hash/List/Set/ZSet 五大数据结构的全部常用 API，再到通用键操作、pipeline、事务与 watch、发布订阅，最后串起缓存/计数器/分布式锁/排行榜/消息队列等典型应用。
- 连接方面：`redis.Redis(...)` 进程级共享 + `ConnectionPool` 复用是正确姿势；生产必须设 `socket_timeout` 和 `health_check_interval`。
- 性能方面：`pipeline` 把多条命令打包一次发送减少 RTT；`scan` 替代 `keys`；大 key 用 `unlink` 异步删。
- 原子性方面：单命令天然原子；`MULTI/EXEC` 保证命令连续执行；`WATCH` 实现乐观锁 CAS；`SET NX EX` 做分布式锁要配 token + Lua 释放。
- 原理层面：RESP 协议定义客户端-服务端对话格式；ConnectionPool 用 LIFO 栈复用 TCP 连接；pipeline 省的是 RTT、不等于事务；Redis 单线程模型带来单命令原子性也带来慢命令全局阻塞风险。

读完本文你应能掌握：

- 用 `redis.Redis` 正确配置连接（含超时、密码、连接池、URL 方式）并理解各参数含义。
- 对 String/Hash/List/Set/ZSet 分别写出增删改查的代码，知道 `incr`/`hincrby`/`zincrby`/`lpush+rpop` 等原子或队列操作的适用场景。
- 用 `pipeline` 批量执行命令、用 `transaction`+`watch` 写并发安全的"先读后写"、用 `set nx ex`+Lua 写正确的分布式锁。
- 用 `keys`/`scan`/`type`/`ttl`/`expire` 管理与排查 key，知道生产环境为什么不能用 `keys`。
- 解释 RESP 协议、ConnectionPool 复用机制、pipeline 为何省 RTT 但不等于事务、WATCH 的 CAS 原理、单节点分布式锁的陷阱与 Redlock 的必要性。