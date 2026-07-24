---
group:
  title: 【19】标准库精讲
  order: 19
order: 14
title: uuid 生成唯一 ID
nav:
  title: Python
  order: 1
---

## 1. 介绍

### 1.1 什么是 UUID

UUID（Universally Unique Identifier，通用唯一识别码）是一串 128 位的标识符，标准格式形如 `123e4567-e89b-12d3-a456-426614174000`——由五段十六进制数字用连字符 `-` 拼接而成，段长依次为 8-4-4-4-12，总共 32 个十六进制字符（代表 128 位）。

UUID 的核心价值在于"唯一"二字：在理想条件下，两次独立调用生成的 UUID 几乎不可能相同。这种"无需中央协调就能保证全局唯一"的特性，使 UUID 成为分布式系统、数据库主键、会话 ID、文件名防冲突等场景的常客。

Python 的 `uuid` 模块是标准库成员，无需安装第三方包即可使用。它提供了生成 UUID 的四个变体函数——`uuid1()`、`uuid3()`、`uuid4()`、`uuid5()`——以及表示 UUID 对象的 `UUID` 类，分别对应 RFC 4122 规定的四个版本。日常开发中，绝大多数人只用 `uuid4()`：它基于系统随机数源生成，无序、不可预测、无隐私泄露风险，一行代码就能拿到一个全局几乎不重复的 ID。

**UUID 格式速览**

```
123e4567-e89b-12d3-a456-426614174000
^^^^^^^^ ^^^^ ^^^^ ^^^^ ^^^^^^^^^^^^
   8     4    4    4       12        ← 各段十六进制位数
                ^    ^
              版本位  变体位（标识 RFC 4122）
```

注意第三段开头的数字：它就是 UUID 的版本号。`x` 开头表示版本 `x`。例如上面的 `12d3` 第三段以 `1` 开头，说明这是一个 version 1 的 UUID；`uuid4()` 生成的 ID 第三段总是以 `4` 开头。第四段的最高有效位则标识变体（variant），RFC 4122 规定该段以 `8`、`9`、`a`、`b` 开头。

### 1.2 基本语法与最小用法

`uuid` 模块的使用极其简单，最小代码如下：

```python
import uuid

# 生成一个随机 UUID（version 4），这是最常用的用法
u = uuid.uuid4()
print(u)            # 输出：6b14d3a8-5e2c-4f7a-9b1d-3c8e1d2a4f50（每次运行都不同）
print(type(u))      # 输出：<class 'uuid.UUID'>
```

`uuid.uuid4()` 返回的是一个 `UUID` 对象（不是普通字符串），但它实现了 `__str__`，所以 `print` 出来就是标准的 8-4-4-4-12 格式。要拿到字符串，直接 `str(u)` 即可。

如果想用其他版本生成 UUID，函数名直观对应版本号：

```python
import uuid

# version 1：基于时间戳 + MAC 地址，有序、可追溯
print(uuid.uuid1())        # 输出：a3b...（第三段以 1 开头）

# version 3：基于命名空间 + 名字的 MD5 哈希，可复现
NAMESPACE_DNS = uuid.NAMESPACE_DNS
print(uuid.uuid3(NAMESPACE_DNS, "example.com"))   # 输出：907692...（同一输入永远同一输出）

# version 5：基于命名空间 + 名字的 SHA-1 哈希，可复现（比 v3 更推荐）
print(uuid.uuid5(NAMESPACE_DNS, "example.com"))   # 输出：cfbff0...（同一输入永远同一输出）
```

以上四个函数就是 `uuid` 模块的"四件套"。本篇后续会逐个展开讲解，但核心要记住一句话：**默认用 `uuid4()`，需要可复现用 `uuid5()`，需要有序追溯用 `uuid1()`，`uuid3()` 几乎已被 `uuid5()` 取代。**

---

## 2. 核心内容

### 2.1 uuid4()——最常用的随机 UUID

`uuid4()` 是日常开发中用得最多的 UUID 生成函数。它的语义是：用高质量的随机数源生成 122 位随机数据，再嵌入版本位（4）和变体位（RFC 4122），得到一个 version 4 的 UUID。

**函数签名与行为**

```
uuid.uuid4()
```

无参数。返回一个 `UUID` 对象。每次调用产生的值都几乎不会重复（碰撞概率见原理章）。

**为什么默认选 uuid4**

- 无序：连续生成的两个 UUID 之间没有顺序关系，不会泄露"谁先谁后"的信息，隐私友好。
- 不可预测：基于系统级随机数源（`os.urandom`），攻击者无法从前一个 UUID 推断下一个，适合做会话 token、追踪 ID 等安全敏感场景。
- 无依赖：不依赖网络、不依赖机器的 MAC 地址、不依赖时钟同步，任何环境下都能生成，非常适合多机分布式部署。

**场景：生成会话 ID（session id）**

Web 服务中，用户登录后通常要分配一个会话 ID，用于在后续请求中标识该用户。这个 ID 需要：全局唯一（不能和别人撞）、不可猜测（防止会话劫持）、无外部依赖（服务重启或扩容不受影响）。`uuid4()` 完美匹配：

```python
import uuid

def create_session(user_id: int) -> dict:
    """用户登录成功后创建会话记录"""
    session = {
        "user_id": user_id,
        # uuid4 生成的 session_id 不可预测，难以被暴力枚举
        "session_id": str(uuid.uuid4()),
        "created_at": "2026-07-23T10:00:00Z",
    }
    return session

session = create_session(1001)
print(session["session_id"])
# 输出：d4e7a1f3-2b6c-4a8e-9f1d-7c3b5e2a8d40（每次运行都不同）
```

这里用 `str(uuid.uuid4())` 把 UUID 对象转成字符串再存入字典，是因为大多数 Web 框架、Redis、数据库存储会话时都按字符串处理。直接存 `UUID` 对象反而在序列化时会报错（`json.dumps` 不认识 `UUID` 类型）。

**场景：文件名防冲突**

当系统允许用户上传大量文件时，用原始文件名存储极易冲突（两个用户都传了 `avatar.png`）。用 UUID 做文件名可以从根本上消除冲突：

```python
import uuid

def save_upload(original_name: str, content: bytes) -> str:
    """保存用户上传的文件，用 UUID 做存储文件名防冲突"""
    # 取原始扩展名，拼到 UUID 后面
    ext = original_name.rsplit(".", 1)[-1] if "." in original_name else "bin"
    stored_name = f"{uuid.uuid4().hex}.{ext}"
    # 这里把 content 写入 stored_name 文件……（省略实际写盘）
    print(f"原文件名: {original_name}  ->  存储名: {stored_name}")
    return stored_name

save_upload("avatar.png", b"fake-content")
# 输出：原文件名: avatar.png  ->  存储名: 7f3e1d2a4b5c6d7e8f9a0b1c2d3e4f5a.png

save_upload("avatar.png", b"another-fake")
# 输出：原文件名: avatar.png  ->  存储名: 2a8b3c4d5e6f7a8b9c0d1e2f3a4b5c6d.png
```

注意这里用的是 `.hex` 属性而不是 `str(u)`：`.hex` 返回不带连字符的 32 位十六进制串（如 `7f3e1d2a...`），在文件名、URL 路径中更干净，避免连字符带来额外的转义麻烦。

**uuid4 的小限制**

`uuid4()` 依赖 `os.urandom()` 提供随机数。在极少数被严格沙箱化的环境下（如某些容器安全策略禁用了 `/dev/urandom`），`os.urandom` 可能不可用，这时 `uuid4()` 会抛 `OSError`。但这种情况在实践中极为罕见，大多数 Linux/macOS/Windows 环境都能正常工作。

### 2.2 uuid1()——基于时间戳和 MAC 地址的 UUID

`uuid1()` 的生成依据是"这台机器、这个时刻"，因此它生成出来的 UUID 是**有序的**（时间越晚，UUID 越大），并且**携带了生成机器的网络地址信息**，可追溯。

**函数签名**

```
uuid.uuid1(node=None, clock_seq=None)
```

- `node`：48 位的节点 ID（通常是 MAC 地址）。不传则自动从系统获取。可以传一个自定义的整数来覆盖 MAC（保护隐私或做测试）。
- `clock_seq`：14 位的时钟序列。不传则随机生成。当时钟回拨（系统时间被往回调）时，时钟序列会自增以避免重复。

**有序性演示**

连续调用 `uuid1()`，可以看出后面的 UUID 比前面的大（在时间维度上递增）。这对于需要"按生成时间排序"的场景很有用。

```python
import uuid

ids = [uuid.uuid1() for _ in range(3)]
for i in ids:
    print(i)
# 输出（示例，第三段都以 1 开头，且整体递增）：
# a3b1c2d0-2e3f-11ee-a8b3-3c4d5e6f7a8b
# a3b1c2d1-2e3f-11ee-a8b3-3c4d5e6f7a8b
# a3b1c2d2-2e3f-11ee-a8b3-3c4d5e6f7a8b

# 验证有序性：后面的 UUID 大于前面的
print(ids[0] < ids[1] < ids[2])   # 输出：True
```

这个"有序"特性是 `uuid1()` 相对于 `uuid4()` 的主要卖点。在数据库中，如果你用 UUID 作主键并且希望聚簇索引尽可能按插入顺序排列，`uuid1()` 的有序性可以让新插入的行集中在索引末尾，减少页分裂。

**隐私问题：UUID 暴露 MAC 地址**

`uuid1()` 生成的 UUID 末尾 12 位就是生成机器的 MAC 地址。这会泄露硬件信息，存在隐私风险。

```python
import uuid

u = uuid.uuid1()
print(u)                         # 输出：xxxx-...-3c4d5e6f7a8b
# 最后一段 12 位十六进制 = MAC 地址
mac_hex = u.bytes[-6:].hex(":")
print("MAC:", mac_hex)           # 输出：MAC: 3c:4d:5e:6f:7a:8b（示例，疑似本机网卡）
```

如果把这种 UUID 直接暴露给前端或第三方，对方就能提取出服务器网卡的物理地址。因此在面向外部的系统中，`uuid1()` 的使用要谨慎；如果只是内部使用且需要有序性，可以用 `node` 参数传一个伪造值：

```python
import uuid

# 传一个固定的 node 值，避免泄露真实 MAC
SAFE_NODE = 0x010203040506
print(uuid.uuid1(node=SAFE_NODE))
# 输出：xxxx-...-010203040506（末尾是伪造的 node，不是真实 MAC）
```

**何时选 uuid1**

- 需要按生成时间近似排序的场景（如某些时序数据库、日志追踪）。
- 需要从 UUID 反查生成机器的场景（排障时定位是哪台节点产生的）。
- 内部系统、不对外暴露 UUID 时，无需顾虑 MAC 泄露。

### 2.3 uuid3() 与 uuid5()——可复现的命名 UUID

`uuid3()` 和 `uuid5()` 解决的是一个不同的问题：**给定相同的输入，生成相同的 UUID**。它们的生成逻辑是：把"命名空间 + 名字"一起做哈希（MD5 或 SHA-1），用哈希结果填满 128 位，再置入版本位和变体位。

这种特性叫"可复现"（reproducible）：同一台机器、不同时间、用同样的命名空间和名字，永远得到同一个 UUID。这非常适合需要"基于内容派生 ID"的场景——两个独立系统对同一个名字派生出同一个 UUID，无需通信就能"对上号"。

**函数签名**

```
uuid.uuid3(namespace, name)
uuid.uuid5(namespace, name)
```

- `namespace`：一个 `UUID` 对象，作为命名空间。`uuid` 模块预置了以下几个常用命名空间常量：
  - `uuid.NAMESPACE_DNS`：用于 DNS 域名（如 `"example.com"`）。
  - `uuid.NAMESPACE_URL`：用于 URL。
  - `uuid.NAMESPACE_OID`：用于 ISO OID。
  - `uuid.NAMESPACE_X500`：用于 X.500 DN。
- `name`：要哈希的名字字符串。

**uuid3 与 uuid5 的区别**

| 维度 | `uuid3` | `uuid5` |
|------|---------|---------|
| 哈希算法 | MD5 | SHA-1 |
| 速度 | 略快 | 略慢（实际几乎无感） |
| 安全性 | MD5 已不推荐用于安全场景 | SHA-1 同样被弱化，但比 MD5 强 |
| 推荐度 | 旧、少用 | **更现代、更常用** |

两者在功能上完全等价（都是可复现），区别只是哈希算法。新项目应优先用 `uuid5()`。

**场景：可复现的产品 ID**

假设你的电商系统里，不同部门（库存、订单、营销）都需要通过商品 SKU 编码来关联数据。如果各自生成 UUID，三个部门之间无法匹配。用 `uuid5()` 基于 SKU 编码派生 UUID，所有部门拿到同一 SKU 编码都能算出同一个 UUID：

```python
import uuid

SKU_NAMESPACE = uuid.uuid5(uuid.NAMESPACE_DNS, "mycompany.com")  # 自定义命名空间

def product_id_for_sku(sku: str) -> str:
    """根据 SKU 编码生成可复现的产品 UUID"""
    return str(uuid.uuid5(SKU_NAMESPACE, sku))

# 不同部门、不同时间、不同代码里，只要 SKU 一样，就算出同一个 ID
print(product_id_for_sku("SKU-1001"))   # 输出：7d3f...（永远不变）
print(product_id_for_sku("SKU-1001"))   # 输出：7d3f...（同一个值）

print(product_id_for_sku("SKU-1002"))   # 输出：9a1c...（不同 SKU 不同值）
```

这种"内容寻址"的能力让 `uuid5()` 在去重、缓存键、跨系统关联等场景中独树一帜。

**复现性测试**

```python
import uuid

NS = uuid.NAMESPACE_DNS
name = "example.com"

u1 = uuid.uuid5(NS, name)
u2 = uuid.uuid5(NS, name)
print(u1 == u2)        # 输出：True —— 同输入永远同输出
print(u1)              # 输出：cfbff0d1-9375-5685-968c-48ddf957...（固定值）

# 换个命名空间，同样的 name 也会得到不同的 UUID
print(uuid.uuid5(uuid.NAMESPACE_URL, name))
# 输出：xxxx-...（与上面不同，因为命名空间变了）
```

### 2.4 UUID 对象的多种表示形式

`uuid.uuid4()` 等函数返回的是 `UUID` 对象，而非裸字符串。`UUID` 对象提供了多种格式的属性，方便在不同场景下取用：

- `str(u)`：标准 8-4-4-4-12 带连字符的字符串，如 `123e4567-e89b-12d3-a456-426614174000`。
- `u.hex`：32 位纯十六进制，不带连字符，如 `123e4567e89b12d3a456426614174000`。
- `u.int`：128 位整数（Python 的 `int` 无大小限制，可直接表示）。
- `u.bytes`：16 字节的 `bytes`（大端序），适合存进二进制存储。
- `u.bytes_le`：16 字节的 `bytes`（小端序前三段 + 大端序后两段，RFC 4122 字节序）。
- `u.urn`：URN 形式，如 `urn:uuid:123e4567-...`。

```python
import uuid

u = uuid.UUID("123e4567-e89b-12d3-a456-426614174000")

print(str(u))           # 输出：123e4567-e89b-12d3-a456-426614174000
print(u.hex)            # 输出：123e4567e89b12d3a456426614174000
print(u.int)            # 输出：241978571620117156830528306329445085440
print(u.bytes.hex())    # 输出：123e4567e89b12d3a456426614174000
print(u.urn)            # 输出：urn:uuid:123e4567-e89b-12d3-a456426614174000
```

**不同表示的适用场景**

| 表示 | 典型场景 |
|------|----------|
| `str` | 数据库 VARCHAR 字段、JSON 字段、前端传参、日志打印 |
| `hex` | 文件名、短 URL、Redis key（无连字符更省心） |
| `int` | 数值运算、位运算、与雪花 ID 之类整数 ID 体系互转 |
| `bytes` | 二进制存储（如数据库 BINARY(16)）、网络协议紧凑传输 |
| `urn` | 需要 URN 标识的 XML / RDF 场景 |

`bytes` 形式尤其值得注意：BINARY(16) 比 VARCHAR(36) 省一半空间，在千万级以上的表中这点空间和索引效率会明显体现出来。

### 2.5 从字符串、字节构造 UUID 对象

除了用四个 `uuidX()` 函数"现生成"，还可以从已有的表示把 UUID �"还原"成 `UUID` 对象。构造函数 `UUID()` 接受多种输入：

```python
import uuid

# 从标准字符串构造
u1 = uuid.UUID("123e4567-e89b-12d3-a456-426614174000")
print(u1)                    # 输出：123e4567-e89b-12d3-a456-426614174000

# 从 hex 字符串构造（不带连字符）
u2 = uuid.UUID("123e4567e89b12d3a456426614174000")
print(u2 == u1)              # 输出：True

# 从 int 构造
u3 = uuid.UUID(int=u1.int)
print(u3 == u1)              # 输出：True

# 从 16 字节 bytes 构造
u4 = uuid.UUID(bytes=u1.bytes)
print(u4 == u1)              # 输出：True
```

从数据库或外部 API 拿到的 UUID 通常是字符串，用 `uuid.UUID(s)` 还原成对象后，就可以用 `.version`、`.bytes`、比较运算等方便功能。

**uafer：构造时的容错**

`uuid.UUID("not-a-uuid")` 会抛 `ValueError`。如果输入来自不可信来源（用户传参、爬虫数据），应包一层校验：

```python
import uuid

def safe_parse_uuid(s: str):
    try:
        return uuid.UUID(str(s))
    except (ValueError, AttributeError, TypeError):
        return None

print(safe_parse_uuid("123e4567-e89b-12d3-a456-426614174000"))  # 输出：123e4567-...
print(safe_parse_uuid("garbage"))                               # 输出：None
```

### 2.6 UUID 的版本号与变体字段

每个 `UUID` 对象都有 `.version` 属性，表示它的版本号（1/3/4/5）。这是从 UUID 内部的"版本位"读出来的，不是凭空给的：

```python
import uuid

print(uuid.uuid1().version)   # 输出：1
print(uuid.uuid3(uuid.NAMESPACE_DNS, "x").version)   # 输出：3
print(uuid.uuid4().version)   # 输出：4
print(uuid.uuid5(uuid.NAMESPACE_DNS, "x").version)   # 输出：5
```

UUID 还有一个 `.variant` 属性，表示它的"变体"（RFC 4122 变体、微软变体、保留变体等）。RFC 4122 规范的 UUID，`.variant` 返回 `RESERVED_NCS` 之外的值，绝大多数情况是 `RFC_4122`。

```python
import uuid

u = uuid.uuid4()
print(u.variant)              # 输出：RESERVED_FUTURE 或 RFC_4122（取决于具体实现，python 中常为 RFC_4122）
```

`.variant` 在实际开发中极少主动检查，了解即可。版本号则偶尔用于调试：如果某个 UUID 本应是 v4 却出现 v1 的特征，可能是来源被串了。

### 2.7 UUID 作数据库主键的取舍

UUID 作主键是高频使用场景，但它不是银弹，需要看清取舍。

**UUID 主键 vs 自增主键**

| 维度 | 自增整数主键 | UUID 主键 |
|------|--------------|-----------|
| 全局唯一性 | 仅本表唯一，跨表/跨库需额外方案 | 天然全局唯一 |
| 大小 | 4/8 字节 | 16 字节（BINARY(16)）或 36 字节（VARCHAR(36)） |
| 聚簇索引性能 | 顺序写入，极少页分裂 | uuid4 无序，随机写入，页分裂多；uuid1 有序则好得多 |
| 可预测性 | 可被猜（爬虫可枚举） | uuid4 不可猜测 |
| 多机写入前置 | 需要中央分配器或步长分配 | 无需协调，各机独立生成 |
| 外键关联体积 | 小 | 大（每个外键也 16 字节） |
| 可读性 | 简洁 | 一长串，调试不便 |

**场景：uuid4 主键对比自增主键（模拟写入分布）**

下面这个 demo 用 `int` 模拟主键的"大小"，直观展示两类 ID 在数值范围上的差异——自增主键的"插入顺序"集中在一个递增区间内，而 uuid4 主键完全散布在 128 位空间里。

```python
import uuid

# 模拟连续插入 5 条记录，对比两类主键的分布
print("自增主键:")
for i in range(1, 6):
    print(f"  id={i:010d}")        # 输出：id=0000000001 ... 0000000005（连续）

print("uuid4 主键:")
for _ in range(5):
    u = uuid.uuid4()
    print(f"  id={u.int:039d}")    # 输出：散布在 0 ~ 2^128 之间的随机值
# 输出示例（完全无序、不可预测）：
#   id=287...e3
#   id=012...f1
#   id=993...a7
#   id=451...22
#   id=706...88
```

自增主键的连续性让数据库的 B+ 树聚簇索引能高效写入（新值总在末尾），而 uuid4 的随机性会让每次插入落在索引的任意位置，导致频繁的页分裂和随机 I/O。这是 uuid4 主键在超高写入量场景下的主要痛点。

缓解方案有几种：

1. 用 `uuid1()` 替代 `uuid4()`，换取有序性（牺牲隐私）。
2. 用"UUID + 自增"双字段：自增做聚簇主键，UUID 做业务唯一标识。
3. 用 reorder 之后的 UUID（如把时间戳高位提前的 ulid）。
4. 用雪花算法（Snowflake）——见下一节。

### 2.8 UUID vs 雪花算法（Snowflake）

雪花算法是 Twitter 提出的另一种分布式唯一 ID 方案，和 UUID 经常被拿来做对比。简要了解两者的差异，有助于在架构选型时做决定。

| 维度 | UUID（uuid4） | 雪花算法 |
|------|---------------|----------|
| 长度 | 128 位 | 64 位（8 字节） |
| 结构 | 随机（uuid4）/ 时间+MAC（uuid1） | 时间戳 + 机器ID + 序列号 |
| 有序性 | uuid4 无序，uuid1 有序 | 时间高位在前，整体递增（趋势递增） |
| 全局唯一性 | 概率上唯一 | 需要分配机器 ID，严格唯一 |
| 依赖 | 无（uuid4） | 需要机器 ID 分配机制，依赖时钟（时钟回拨会出错） |
| 存储 | 16/36 字节 | 8 字节 |
| 可读性 | 一长串十六进制 | 一个长整型 |
| 生成速度 | 系统随机数源 | 本地计算，极快 |

**简提取舍**

- 数据量中等、跨表唯一性要求不强、追求简单 → 自增主键即可。
- 需要全局唯一、不介意 16 字节 → `uuid4()` 最省心。
- 需要全局唯一、又需要趋势递增、存储敏感 → 雪花算法或 `uuid1()`。
- 高并发、需要严格唯一 + 严格递增 + 紧凑 → 雪花算法（配合机器 ID 分配和时钟回拨处理）。

UUID 的优势在于"无需协调"，雪花算法的优势在于"紧凑且趋势递增"。两者并非互斥，很多系统会混用：业务对外用 UUID，内部关联用雪花。

### 2.9 UUID 在 URL 与路径中的使用

UUID 经常出现在 URL 路径里，如 `/api/orders/d4e7a1f3-2b6c-4a8e-9f1d-7c3b5e2a8d40`。这里有两个细节值得注意。

第一，连字符版本（36 字符）和 hex 版本（32 字符）都能做路径，但 hex 更短、更干净，不涉及连字符在不同框架下的转义问题。如果 URL 由后端自己生成并消费，优先用 `.hex`：

```python
import uuid

order_id = uuid.uuid4().hex
url = f"https://api.example.com/orders/{order_id}"
print(url)
# 输出：https://api.example.com/orders/d4e7a1f32b6c4a8e9f1d7c3b5e2a8d40
```

第二，用 UUID 做 URL 路径参数天然防爬虫：`uuid4()` 不可预测，攻击者无法像枚举自增 ID 那样遍历资源。但要注意，这并不替代权限校验——拿到合法 UUID 仍需校验调用方是否有权访问该资源。

```python
import uuid

def get_order(order_id_str: str, current_user_id: int) -> dict:
    """按订单 ID 查询订单，校验归属"""
    try:
        oid = uuid.UUID(str(order_id_str))
    except (ValueError, TypeError):
        return {"error": "非法订单 ID"}      # 输出：非法 ID 时的兜底
    order = fetch_order(oid)                  # 伪代码
    if order is None or order["user_id"] != current_user_id:
        return {"error": "无权访问"}
    return order
```

### 2.10 UUID 与 JSON 序列化

`json.dumps` 默认不认识 `UUID` 类型，直接序列化会抛 `TypeError`。有三种处理方式。

最常见的是在生成时就转成字符串：

```python
import json
import uuid

payload = {"session_id": str(uuid.uuid4()), "user_id": 1001}
print(json.dumps(payload))
# 输出：{"session_id": "d4e7a1f3-2b6c-4a8e-9f1d-7c3b5e2a8d40", "user_id": 1001}
```

如果数据结构里已经塞了 `UUID` 对象，用 `default` 钩子统一处理：

```python
import json
import uuid
from datetime import datetime

def json_default(o):
    if isinstance(o, uuid.UUID):
        return str(o)
    if isinstance(o, datetime):
        return o.isoformat()
    raise TypeError(f"不可序列化: {type(o)}")

data = {"id": uuid.uuid4(), "ts": datetime.now()}
print(json.dumps(data, default=json_default))
# 输出：{"id": "...", "ts": "2026-07-23T..."}
```

第三种方式是自定义 `JSONEncoder` 子类，适合整个项目统一行为。无论哪种方式，核心都是"把 UUID 转成字符串"——JSON 没有原生 128 位整数类型，直接塞 `int` 在前端 JS 里会丢精度（JS Number 只有 53 位安全整数）。

---

## 3. 最佳实践

### 3.1 默认选 uuid4，不要自己造随机 UUID

很多人喜欢用 `random.random()` 之类生成十六进制再拼成 UUID 形式的字符串，这是反模式。`random` 模块用的是梅森旋转算法，是伪随机数，可预测、不安全。`uuid.uuid4()` 内部用 `os.urandom()`，是密码学安全的随机源，更适合做会话 token、API key 这类不能被猜的标识。

**推荐**

```python
import uuid

token = str(uuid.uuid4())
```

**不推荐**

```python
import random

# 不要这么干——random 不安全，且可能不填版本位/变体位，产出的不是合法 UUID
bad = "%016x" % random.getrandbits(128)
```

### 3.2 对外暴露时优先用 uuid4，避免 uuid1

`uuid1()` 末尾携带 MAC 地址。一旦把 `uuid1()` 生成的 ID 直接返回给前端或写进对外可见的 URL，服务器网卡的物理地址就泄露了。如果确实需要 `uuid1()` 的有序性，至少用 `node=` 参数传一个不暴露真实地址的值。

### 3.3 数据库存储用 BINARY(16)，不要用 VARCHAR(36)

UUID 存成字符串（36 字节）比二进制（16 字节）多占一倍空间，而且每个二级索引、外键都会放一份这个 ID，放大效应明显。百万级以上数据量时，VARCHAR(36) 的磁盘和内存占用会显著高于 BINARY(16)。多数 ORM 都支持把 `UUID` 字段映射成原生二进制类型。

**推荐**

```python
import uuid

# 给 SQL 参数传 bytes，对应 BINARY(16)
new_id = uuid.uuid4()
sql = "INSERT INTO sessions (id, user_id) VALUES (%s, %s)"
params = (new_id.bytes, 1001)
# execute(sql, params)  ——伪代码，实际依赖驱动
```

**不推荐**

```python
# 36 字节的字符串
params = (str(uuid.uuid4()), 1001)
```

如果为了调试方便一定要用字符串，至少考虑用 `u.hex`（32 字符）替代 `str(u)`（36 字符），略省空间。

### 3.4 需要可复现时用 uuid5，不用 uuid3

`uuid3()` 用 MD5，`uuid5()` 用 SHA-1。两者都"可复现"，但 SHA-1 抗碰撞性远好于 MD5，新项目应一律选 `uuid5()`。`uuid3()` 只在维护老系统、需要兼容历史数据时才用。

### 3.5 比较和判等直接用对象，不必先转字符串

两个 `UUID` 对象可以直接用 `==` 比较，内部就是 128 位整数比较，比逐字符比字符串快：

```python
import uuid

a = uuid.uuid4()
b = uuid.UUID(str(a))    # 从字符串还原
print(a == b)            # 输出：True（对象判等）
```

不要写成 `str(a) == str(b)`——多两步转换，没有好处。

### 3.6 自定义命名空间时记下它，否则不可复现

用 `uuid5()` 时，命名空间本身就是个 UUID。很多人习惯随手 `NS = uuid.uuid5(uuid.NAMESPACE_DNS, "myapp")` 算一个自定义命名空间，但如果这个 `NS` 值没记下来、下次重新算了一个新的，那么"同一个 name 在两次运行中"算出的 UUID 就会不同——可复现性就丢了。

**推荐**：把项目用的命名空间写死成常量，写进配置或常量文件。

```python
import uuid

# 写死在常量里，所有地方都用这个值
PRODUCT_NAMESPACE = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")  # 示例

def product_id(sku: str) -> str:
    return str(uuid.uuid5(PRODUCT_NAMESPACE, sku))
```

### 3.7 别把 UUID 当成完全不会重复的"绝对保证"

`uuid4()` 的碰撞概率极低，但不是零。理论上 2^61 次生成后才有 50% 概率出现一次碰撞（见原理章）。在工程实践中，这个概率可以当作零处理，但仍要：

- 数据库主键 / 唯一索引上加 `UNIQUE` 约束，万一碰撞也有兜底（INSERT 会报错而不是静默覆盖）。
- 关键业务里处理一下"插入失败重试一次"的逻辑，碰撞时重新生成。

### 3.8 批量生成时注意一次性调用

需要批量生成 UUID 时，直接列表推导即可，`uuid4()` 本身很快：

```python
import uuid

batch = [str(uuid.uuid4()) for _ in range(10000)]
print(len(batch))          # 输出：10000
print(len(set(batch)))     # 输出：10000（实际中重复数为 0）
```

`set` 去重后仍是 10000，直观印证了"几乎不重复"。如果在极端高并发下成批生成上百万个，可以考虑用线程池并行，但通常没必要——`os.urandom` 本身是系统调用，单线程也能在毫秒级生成上万个。

---

## 4. 原理

### 4.1 UUID 的 128 位结构

UUID 是 128 位（16 字节）的标识符，RFC 4122 把它分成若干字段。以 version 4 的 UUID 为例，16 字节的布局如下：

```
字段名        位数      说明
time_low       32      时间戳低 32 位（v1）/ 随机（v4）
time_mid       16      时间戳中 16 位（v1）/ 随机（v4）
version         4      版本号（v1=0001, v3=0011, v4=0100, v5=0101）
time_hi       12      时间戳高 12 位（v1）/ 随机（v4）
variant        2      变体标识（RFC 4122 用 10）
clock_seq_hi    6      时钟序列高 6 位（v1）/ 随机（v4）
clock_seq_low   8      时钟序列低 8 位（v1）/ 随机（v4）
node           48      节点 ID（v1 通常是 MAC）/ 随机（v4）
```

其中 `version` 占 4 位，固定放在第三段（`time_hi_and_version`）的最高 4 位，表现为第三段十六进制的第一个字符。变体字段占 2~3 位，放在第四段（`clock_seq_hi_and_reserved`）的最高有效位，RFC 4122 规定该两位是 `10`，所以第四段以 `8`、`9`、`a`、`b` 开头。

**版本号如何体现**

观察一个 uuid4 输出：

```
d4e7a1f3-2b6c-4a8e-9f1d-7c3b5e2a8d40
              ^
              第三段第一个字符是 4 → version 4
                    ^
                    第四段第一个字符是 9（属于 8/9/a/b）→ variant RFC_4122
```

剩余的 122 位（128 - 4 version - 2 variant = 122）在 uuid4 中全部是随机位，这就是为什么说"uuid4 有 122 位随机性"。

### 4.2 uuid4 用 os.urandom 生成 122 位随机

`uuid.uuid4()` 的实现非常简洁，核心就两步：

1. 用 `os.urandom(16)` 生成 16 字节的密码学安全随机数。
2. 按位把版本位（`0100`）和变体位（`10`）设进去，覆盖对应位置。

`os.urandom` 在 Linux 上读 `/dev/urandom`，在 macOS 上调用 `getrandom`/`SecRandomCopyBytes`，在 Windows 上调用 `CryptGenRandom`，都是内核提供的、不可预测的随机源。这与 `random` 模块的伪随机（基于种子的确定性算法）有本质区别：即使攻击者拿到了前 10000 个 UUID，也无法据此推断第 10001 个。

简单还原一下生成逻辑（这只是伪代码示意，帮助理解，实际 CPython 中实现细节略有不同）：

```python
import os

def my_uuid4():
    raw = bytearray(os.urandom(16))
    # 第三段最高 4 位设为 0100（version 4）
    raw[6] = (raw[6] & 0x0F) | 0x40
    # 第四段最高 2 位设为 10（variant RFC 4122）
    raw[8] = (raw[8] & 0x3F) | 0x80
    import uuid
    return uuid.UUID(bytes=bytes(raw))

print(my_uuid4())
# 输出：随机 UUID，第三段第一个字符必为 4，第四段第一个字符必为 8/9/a/b
```

这段代码每一步都对应原理：`& 0x0F` 清零高 4 位，`| 0x40` 把它置成 `0100`；`& 0x3F` 清零最高 2 位，`| 0x80` 把它置成 `10`。剩下的 122 位原封不动来自 `os.urandom`，保留了全部随机性。

### 4.3 uuid4 的碰撞概率——为什么"几乎不重复"

UUID v4 有 122 位随机性，理论上可表示 `2^122 ≈ 5.3 × 10^36` 个不同值。碰撞概率用"生日悖论"计算：在 `n` 次生成中至少出现一次碰撞的概率约为

```
P ≈ 1 - exp(-n² / (2 × 2^122))
```

要达到 50% 碰撞概率，需要生成约 `2^61 ≈ 2.3 × 10^18` 个 UUID。这是什么量级？假设你每秒生成 10 亿个 UUID（`10^9/s`），要连续生成约 73 年才能跨过 50% 碰撞线。换句话说，在正常的工程实践中，uuid4 碰撞可以当作零处理。

对比一下，v4 在百万级（`10^6`）规模下的碰撞概率大约是 `10^-24` 量级——比硬盘自然翻转一个位的概率还低得多。这就是为什么说"uuid4 几乎不会重复"不是经验之谈，而是有数学保证的。

需要注意一点：上面的概率基于"随机源真的随机"。`uuid4()` 用的是 `os.urandom`，在主流操作系统上是达标的。如果某一天换成 `random.random()` 之类，碰撞概率会完全不同（且不可预测、不安全）。

### 4.4 uuid1 的结构：60 位时间戳 + 14 位时钟序列 + 48 位 MAC

`uuid1()` 的 128 位布局与 v4 截然不同，它编码的是"时间 + 机器 + 序列"：

```
60 位时间戳（UUID 时间从 1582-10-15 起算的 100 纳秒数）
 14 位时钟序列（含变体位）
 48 位节点 ID（通常是 MAC 地址）
```

**60 位时间戳**

UUID 时间的起点是 1582-10-15 00:00:00 UTC（格里高利历改革日），精度是 100 纳秒。也就是说，UUID 时间是一个"从 1582 年开始数到现在的、以 100ns 为单位的整数"。60 位能表示约 `2^60 × 100ns ≈ 3653` 年，足够用到公元 5236 年。

时间戳在 UUID 字节中的排列有点"反直觉"：它被拆成 low/mid/high 三段，分别放在 UUID 的前两段半里，低 32 位在最前面。这就是为什么 `uuid1()` 连续生成的 UUID 看起来"前两段在变"——因为时间在递增，时间戳的低位被频繁更新。

```python
import uuid

# 连续生成 uuid1，观察前两段的变化
for _ in range(3):
    print(uuid.uuid1())
# 输出示例：
#   1f2e3d4c-2e30-11ee-...  <- 注意第二段 2e30
#   1f2e3d50-2e30-11ee-...  <- 第二段几乎不变（时间高位变化慢）
#   1f2e3d52-2e30-11ee-...  <- 第一段在快速增加（时间低位）
```

**48 位节点 ID**

默认情况下 `uuid1()` 会查询本机的某个网络接口 MAC 地址作为节点 ID，放在 UUID 最后一段（12 个十六进制字符）。这就是 MAC 泄露的根源。`node` 参数可以覆盖这一行为。

**14 位时钟序列**

时钟序列的作用是处理"时间回拨"：如果系统时间被往回调（NTP 校时、手动改时间），单纯用时间戳会造成 UUID 重复。时钟序列在检测到时间回拨时自增，从而保证即使时间戳"倒退"也不会重复。14 位能容纳 16384 种值，足够多次回拨。

### 4.5 uuid3 与 uuid5：哈希命名空间 + 名字

`uuid3` 和 `uuid5` 的生成逻辑可以概括为：

```
hash_input = namespace.bytes + name.encode("utf-8")
digest = md5(hash_input)   # uuid3
# 或
digest = sha1(hash_input)  # uuid5

# 取 hash 摘要的前 16 字节，按 v3/v5 的版本位、RFC 4122 变体位填好
uuid_bytes = digest[:16]
uuid_bytes[6] = (uuid_bytes[6] & 0x0F) | version  # version=3 或 5
uuid_bytes[8] = (uuid_bytes[8] & 0x3F) | 0x80     # variant=RFC_4122

return UUID(bytes=uuid_bytes)
```

关键点：

- 命名空间本身是个 UUID，它用 `.bytes`（16 字节）参与哈希，相当于一个"作用域前缀"，避免不同命名空间下同名 name 撞车。
- name 总会用 UTF-8 编码成字节再哈希。
- 哈希摘要是固定的，所以同一输入永远得到同一输出——**这就是可复现性的来源**。
- 哈希输出的 16 字节里有 6 位被版本/变体覆盖，所以严格的"信息量"是 122 位哈希——对 MD5/SHA-1 来说这点裁剪不影响安全。

MD5 输出 128 位正好 16 字节，SHA-1 输出 160 位取前 128 位。理论上 SHA-1 也只是 128 位信息进 UUID，所以两个算法的"碰撞强度"都受限于 128 位 UUID 容量。但 MD5 已被证明存在实际的碰撞攻击，不应用在安全相关场景；SHA-1 也有理论弱化，但用于"派生 ID"的语境下仍是当前更好的选择。

### 4.6 版本位与变体位的位运算细节

上面几节都提到了"用位运算设置版本位和变体位"，这里把位运算的含义说透。

**版本位**

版本号放在第三段（也就是第 7 个字节，索引 6）的最高 4 位：

```
字节索引 6 的 8 位：[ v v v v | x x x x ]
                      ^^^^^^^^
                      高 4 位是版本号（0001 / 0011 / 0100 / 0101）
                      低 4 位保留为随机或时间高位

# 设置版本号（version=4 为例）：
raw[6] = (raw[6] & 0x0F) | 0x40
#        |- 清零高 4 位 -|  |- 写入 0100 -|
```

`0x0F` 二进制是 `00001111`，与原字节 `&` 后清零高 4 位，保留低 4 位。`0x40` 是 `01000000`，与上一步结果 `|`，把高 4 位置成 `0100`。最终第三段第一个十六进制字符就是 `4`。

**变体位**

变体字段放在第四段（字节索引 8）的最高 2~3 位：

```
字节索引 8 的 8 位：[ v v | x x x x x x ]
                      ^ ^
                      最高 2 位是变体（RFC 4122 用 10）

# 设置变体位（RFC 4122）：
raw[8] = (raw[8] & 0x3F) | 0x80
#        |- 清零最高 2 位 -| |- 写入 10 -|
```

`0x3F` 是 `00111111`，`&` 后清零最高 2 位。`0x80` 是 `10000000`，`|` 后最高 2 位变成 `10`。所以第四段第一个十六进制字符只会是 `8`（`1000`）、`9`（`1001`）、`a`（`1010`）、`b`（`1011`）中的一个。

这两段位运算的本质都是"先清零再覆盖"，确保无论原字节如何，版本位和变体位都符合规范。理解这一点，就不难明白为什么 uuid4 的第三段总是 4 开头、第四段总是 8/9/a/b 开头。

### 4.7 各版本适用场景的原理依据

把原理串起来，就能看出每个版本适用场景的"为什么"：

- **uuid4**：122 位真随机 → 无序、不可预测、无依赖 → 适合安全敏感的会话 ID、对外暴露的唯一标识、不需要排序的场景。缺点是无序导致数据库索引效率差。
- **uuid1**：时间戳在前 + MAC 在后 → 有序、可追溯 → 适合需要按时间近似排序、需要反查生成机器的内部场景。缺点是泄露 MAC。
- **uuid5**：哈希(命名空间+名字) → 可复现 → 适合"内容寻址"派生 ID，跨系统对同一名字派生同一 UUID。缺点是一旦命名空间写错或 name 变了，ID 就变了，不能用于"想改就改"的动态实体。
- **uuid3**：同 uuid5 但用 MD5 → 历史兼容场景才用，新项目用 uuid5。

原理决定取舍：选哪个版本，本质上是在选"随机 / 有序 / 可复现"这三种特性中的哪一种。

---

## 5. 总结

### 5.1 本文要点

- UUID 是 128 位全局唯一标识符，标准格式为 8-4-4-4-12 的十六进制串，128 位里含 4 位版本位和 2 位变体位。
- `uuid.uuid4()`：基于 `os.urandom` 的随机 UUID，无序、不可预测、无依赖，是默认首选。122 位随机性使碰撞概率在工程上为零。
- `uuid.uuid1(node, clock_seq)`：基于 60 位时间戳 + 14 位时钟序列 + 48 位 MAC，有序、可追溯，但泄露 MAC，对外慎用。
- `uuid.uuid3(namespace, name)` / `uuid.uuid5(namespace, name)`：基于命名空间 + 名字的哈希（MD5 / SHA-1），可复现，适合内容寻址。新项目用 `uuid5`。
- `UUID` 对象提供 `str`、`hex`、`int`、`bytes`、`urn` 等多种表示，分别对应不同存储 / 传输场景。
- 从字符串 / hex / int / bytes 都能用 `uuid.UUID()` 构造还原对象，判等和比较直接用对象。
- UUID 作主键：全局唯一、无协调，但 uuid4 无序会拖慢聚簇索引；可用 uuid1、雪花算法或双字段方案缓解。
- UUID vs 雪花：UUID 强在无需协调，雪花强在紧凑 + 趋势递增，按业务取舍。

### 5.2 读完应能掌握

- 能说出 `uuid1`、`uuid3`、`uuid4`、`uuid5` 四个函数各自的生成依据、特点和适用场景，并正确选用默认的 `uuid4()`。
- 能用 `uuid4()` 生成会话 ID、文件名防冲突 ID，知道何时用 `str`、何时用 `hex`、何时用 `bytes`。
- 能用 `uuid5()` 做可复现的派生 ID，并理解命名空间在整个机制中的作用（写死命名空间常量、避免运行时临时生成）。
- 能解释 UUID 的 128 位结构（时间戳 / 时钟序列 / 节点 / 版本位 / 变体位），并能说明为什么 uuid4 的第三段总是 4 开头、第四段总是 8/9/a/b 开头。
- 能计算 uuid4 的碰撞概率量级（`2^61` 次生成才有 50% 碰撞），判断"几乎不重复"的工程合理性。
- 能对比 uuid4 主键、自增主键、雪花算法在大小、有序性、唯一性、性能上的差异，给出合理的 ID 方案选型。
- 知道不要用 `random` 模块自制 UUID，对外暴露时避免 `uuid1`，存储优先 BINARY(16)，可复现优先 `uuid5` 而非 `uuid3`。