---
group:
  title: 【07】字典深度剖析
  order: 7
order: 10
title: 字典的in操作时间复杂度
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是字典的 in 操作

`key in d` 是 Python 中最常用的成员检查操作——判断一个键是否存在于字典中。它看起来朴实无华，却是 Python 字典高性能承诺的核心支柱：**平均时间复杂度 O(1)**，无论字典里有 10 个键还是 1000 万个键，检查一个键是否存在几乎一样快。

```python
d = {"a": 1, "b": 2, "c": 3}

print("a" in d)    # 输出：True
print("z" in d)    # 输出：False
```

`key in d` 的底层调用的是 `dict.__contains__(key)` 方法，它通过哈希表定位目标键，整个过程不需要遍历任何元素。本篇从 `in` 操作切入，逐层剖析其 O(1) 的成立条件、退化边界、与其他查找方法的性能对比，以及它对代码设计的实际影响。

### 1.2 为什么 in 是 O(1)：哈希表的功劳

`in` 之所以能做到"不随字典大小线性增长"，靠的是字典的底层哈希表结构。整个查找过程只做三步：

1. **计算哈希值**：对键调用 `hash(key)`，得到一个整数。对大多数内置类型（`str`、`int`、`tuple` 等），这一步是 O(1)。
2. **定位槽位**：用哈希值模数组大小，直接跳到哈希表条目数组的对应位置——不需要遍历。
3. **比对键**：在目标槽位及可能的少量相邻槽位中，逐个比较"键是否相等"（用 `==`）。正常情况下只有 1~2 次比较。

```python
# in 操作底层等价于：
def contains(d, key):
    h = hash(key)                          # 步骤 1：计算哈希
    index = h % len(d._entries)            # 步骤 2：定位槽位
    while d._entries[index] is not EMPTY:  # 步骤 3：探查比对
        if d._entries[index].key == key:
            return True
        index = (index + 1) % len(d._entries)
    return False
```

整个过程的核心在于**步骤 2 的 O(1) 直接跳转**——它让你不需要扫描全部条目就能找到目标。这和列表的 `x in lst`（O(n)，必须从头遍历）形成了本质区别。

### 1.3 关键概念：哈希值、槽位、探测链

理解 `in` 操作的三个核心概念：

**哈希值**：`hash(key)` 返回一个固定大小的整数（Python 3 中通常是 64 位）。同一个键在同一个程序运行期间哈希值不变；不同的键可能产生相同的哈希值（哈希碰撞）。

**槽位（slot）**：哈希表内部的条目数组 `entries` 中的每一个位置。哈希值经过取模运算后指向一个初始槽位。

**探测链（probe chain）**：如果初始槽位被其他键占了（哈希碰撞），字典按"线性探测"规则逐个检查下一个槽位，直到找到目标键或遇到空位。这组连续的检查位置就是探测链。

```
哈希表条目数组示意：
索引:  0      1      2      3      4      5      6      7
     [空]  ["a":1] ["b":2] [空]  [空]  [空]  [空]  ["c":3]

检查 "c" 是否在字典中：
hash("c") % 8 = 7 → 直接跳到索引 7 → 键匹配 → True  (1 步)
检查 "z" 是否在字典中：
hash("z") % 8 = 2 → 跳到索引 2 → 键是 "b" 不匹配 → 索引 3 是空 → False  (2 步)
```

正常运行的字典中，探测链的长度通常只有 1~3 步。正是在这种"近乎一步到位"的场景下，`in` 的实际表现非常接近理论的 O(1)。

## 2. 核心内容

### 2.1 in 操作的正确用法

```python
# ✅ 键存在性检查
if "user_id" in request_data:
    user_id = request_data["user_id"]

# ✅ 配合 not in 做缺失保护
if "token" not in config:
    raise ValueError("token is required")

# ✅ 三元表达式
value = d[key] if key in d else default
```

`in` 只检查键，**不检查值**：

```python
d = {"a": 0, "b": None, "c": False}

print("a" in d)  # True  ← 值 0 是假值，但键存在
print("b" in d)  # True  ← 值 None 是假值，但键存在
print("c" in d)  # True  ← 同上
print("z" in d)  # False ← 只有键不存在才 False
```

一个频繁踩的坑：不要用 `d.get(key)` 的真假值来判断键存在性。`get` 返回 `None` 时自带歧义——可能是键不存在，也可能是值就是 `None`：

```python
config = {"debug": None}

# ❌ 错误：debug 键存在，但值是 None，if 分支不会进入
# if config.get("debug"):
#     enable_debug()

# ✅ 正确：用 in 精准判断
if "debug" in config and config["debug"] is not None:
    enable_debug()
```

### 2.2 in vs get vs d[key] vs try/except 的对比

这是字典成员检查的四种常见写法，选择哪一种取决于"键不存在时该怎么办"：

```python
d = {"a": 1, "b": 2}

# 方式一：in——预先检查，然后安全取值
if "z" in d:
    v = d["z"]             # 确认存在再取，最安全
else:
    v = None

# 方式二：get——取值并带默认
v = d.get("z", None)       # 一行搞定，适合有默认值的情况

# 方式三：d[key]——不检查直接取，键缺失即抛错
try:
    v = d["z"]              # 如果 z 确实存在且期望存在，最快
except KeyError:
    v = None

# 方式四：try/except——先取再说，错了再回退（EAFP 风格）
# 见 2.3 小节
```

| 方式                  | 使用场景                 | 键缺失时      | 性能                    | 备注               |
| --------------------- | ------------------------ | ------------- | ----------------------- | ------------------ |
| `key in d`            | 只需要判断是否存在       | False，不取值 | O(1)                    | 不创建异常         |
| `d.get(key, default)` | 取值 + 键缺失给默认      | 返回默认值    | O(1)                    | 最简洁             |
| `d[key]`              | 键一定存在，不存在即 bug | 抛 KeyError   | O(1)                    | 期望不存在时不推荐 |
| `try/except KeyError` | 期望键通常存在           | 抛异常后回退  | O(1) 正常/moderate 异常 | EAFP 风格，见 2.3  |

### 2.3 EAFP vs LBYL：in 背后的编程哲学

Python 社区有两条著名的编程哲学——**EAFP**（Easier to Ask for Forgiveness than Permission，先做再求原谅）和 **LBYL**（Look Before You Leap，先看再跳）。

```python
# LBYL 风格：先用 in 检查，再取值（看清楚了再跳）
if "name" in d:
    name = d["name"]
else:
    name = "unknown"

# EAFP 风格：直接取值，失败了再处理（先跳再说）
try:
    name = d["name"]
except KeyError:
    name = "unknown"
```

两种风格在 Python 中都合法，选哪一个取决于**键缺失的概率和后果**：

- **键几乎总是存在** → EAFP（`try/except` 只花一次 `try` 成本，不用每次都做 `in` 检查）
- **键缺失是常见情况** → LBYL（`in` 检查成本小 + if/else 路径明确，且不需要抛异常）
- **只需要判断存在性、不需要取值** → `in`（LBYL）
- **取值的代码在多处使用** → 用 `get()` 或一个专门的函数封装

```python
# 真实场景示例
# 场景一：配置读取——缺失率 30%，LBYL 可读性好
if "timeout" in config:
    timeout = config["timeout"]

# 场景二：HTTP 请求头解析——缺失率 < 1%，EAFP 路径最短
try:
    content_type = headers["content-type"]
except KeyError:
    content_type = "text/plain"
```

一个常见的微优化误区：在**同一段代码中两次使用 `in` + `d[key]`**（先检查再取值）。这对字典做了两次哈希查找——`in` 和 `d[key]` 各自触发一次。如果键几乎肯定存在，改写成 `try/except` 或 `get()` 只用一次查找：

```python
# ❌ 两次哈希查找（in + d[key]）
if key in d:
    value = d[key]    # 又做了一次哈希查找

# ✅ 一次哈希查找（get）
value = d.get(key)
if value is not None:
    ...

# ✅ 一次哈希查找（EAFP）
try:
    value = d[key]
except KeyError:
    value = None
```

这个差异在日常代码中绝大多数可以忽略（一次哈希查找的额外开销是纳秒级别的），但在"字典很大（几千万键）"且"检查/取值高频"的场合，少做一次哈希查找不是白费的。

### 2.4 O(1) 的前提：键必须可哈希

`in` 操作的 O(1) 建立在**键是可哈希对象**这个前提之上。如果键不可哈希，连 `hash()` 都调不了，自然也就谈不上 O(1) 了：

```python
# ✅ 可哈希类型：str、int、float、frozenset、包含可哈希元素的 tuple
d = {"name": "Alice", 42: "answer", (1, 2): "point"}

print("name" in d)    # True
print(42 in d)         # True
print((1, 2) in d)     # True

# ❌ 不可哈希类型：list、dict、set
# d2 = {[1, 2]: "value"}        # TypeError: unhashable type: 'list'
# d3 = {{"nested": 1}: "value"}  # TypeError: unhashable type: 'dict'
```

此外，`hash()` 的结果必须在键的生命周期内**恒定不变**。如果键是可变对象，且其内容在插入字典后发生了变化，它的哈希值可能改变，从而导致 `key in d` 返回 `False` 即使键的实际数据仍在字典里——这是最难以排查的 bug 之一。

### 2.5 哈希碰撞如何让 O(1) 退化为 O(n)

O(1) 是平均情况。当哈希碰撞严重时，探测链变长，`in` 操作会退化。极端情况下——所有键的哈希值撞到同一个槽位——探测链长度 = 字典中的键数，`in` 退化为 O(n)：

```python
# 构造哈希碰撞：自定义类的 __hash__ 故意返回相同的值
class Collider:
    def __init__(self, val):
        self.val = val
    def __hash__(self):
        return 1                        # 所有实例的哈希值都是 1
    def __eq__(self, other):
        return self.val == other.val

d = {}
for i in range(10000):
    d[Collider(i)] = i

# in 操作的探测链非常长，接近 O(n)
# Collider(9999) in d   — 需要遍历很长的探测链
```

这种退化在真实代码中极少发生——Python 内置类型的 `hash()` 函数经过精心设计，哈希值分布均匀。但**人为构造恶意碰撞是真实的安全威胁**（见 3.6 节），也是为什么 Python 从 3.3 开始引入了哈希随机化。

### 2.6 Python 3.3+ 的哈希随机化

为了防止攻击者构造"所有键都碰撞到一个槽位"的恶意数据，Python 3.3 起默认开启了**哈希随机化**（hash randomization）。每次启动 Python 解释器时，`str`、`bytes`、`datetime` 等类型的哈希函数会使用一个随机的种子值，使得同一个字符串在不同进程中的哈希值不同。

```python
# 同一字符串在同一个进程内哈希值稳定
print(hash("hello"))  # 某个值

# 但不同进程启动时，哈希值大概率不同
# 进程 1：hash("hello") → -5238471203984723
# 进程 2：hash("hello") →  8917236401293847
```

对 `in` 操作的实际影响：

- **正面**：攻击者无法在不同进程间复用碰撞数据。
- **微小代价**：`hash()` 计算时多了一步和种子值的位运算，对性能的影响可以忽略不计。
- **注意**：不再依赖跨进程的哈希稳定性。如果你之前写代码用了 `hash(s)` 做持久化存储或跨进程通信，这种做法在 3.3+ 不再可靠。

```python
# ❌ 跨进程依赖哈希稳定性（3.3+ 不允许）
# 不要把 hash(s) 存入 DB 或文件
# 用 hashlib.sha256(s.encode()).hexdigest() 获取稳定的哈希摘要
```

### 2.7 in 对视图对象的适用性

前面字典遍历篇讲过 `keys()`、`values()`、`items()` 返回视图对象。视图同样支持 `in` 操作，但时间复杂度不同：

```python
d = {"a": 1, "b": 2, "c": 3}

# keys() 视图的 in：O(1) — 就是字典的 __contains__
print("a" in d.keys())      # True，O(1)

# values() 视图的 in：O(n) — 必须遍历所有值
print(1 in d.values())      # True，O(n)  ← 注意！不是 O(1)

# items() 视图的 in：O(1) — 先 O(1) 找键，再 O(1) 比较值
print(("a", 1) in d.items())  # True，O(1)
```

关键差异在于 `d.values()`：

```python
# ❌ 不要在大字典上频繁用 values() 做成员检查
# if target_value in huge_dict.values():   — O(n)，每个值都要比较

# ✅ 如果经常需要按值查找，构建反向字典
reverse = {v: k for k, v in huge_dict.items()}
if target_value in reverse:   # O(1)
    key = reverse[target_value]
```

`keys()` 视图的 `in` 等同于字典本身的 `__contains__`，是 O(1)。`items()` 视图的 `in` 利用哈希表先定位键（O(1)），再比值（O(1)），所以整体也是 O(1)。只有 `values()` 视图没有哈希索引可用，必须 O(n) 线性扫描。

### 2.8 in 操作与 dict 变体

`collections` 模块中的字典变体对 `in` 操作有不同的行为：

```python
from collections import defaultdict, OrderedDict, Counter

# defaultdict：in 行为 = 普通 dict，O(1)，不触发 default_factory
dd = defaultdict(int)
print("z" in dd)     # False，不建键

dd["z"]              # 取值触发了 default_factory
print("z" in dd)     # True  ← 建了键

# Counter：in 行为 = 普通 dict，O(1)，不触发 __missing__
c = Counter(a=3, b=0)
print("a" in c)      # True
print("b" in c)      # True  ← 值是 0，但键物理存在
print("z" in c)      # False ← 缺失键返回 0，但 in 是 False

# OrderedDict：in = 普通 dict，O(1)
od = OrderedDict([("a", 1)])
print("a" in od)     # True
```

### 2.9 性能基准：in 在大字典上的实际表现

```python
import timeit

small = {i: i for i in range(100)}
large = {i: i for i in range(10_000_000)}

# 对小字典和大字典做 in 操作的性能差异非常小
# 以下是用 timeit 估算的数值（实际因 CPU 而异）
# small: in 检查 ~ 40 ns
# large: in 检查 ~ 45 ns
# 差异 5 ns = 0.000005 ms
# 这个微小差异主要来自：CPU 缓存 Miss（大哈希表冷数据）
```

关键结论：**字典大小对 in 操作的性能影响在纳秒级别**——因为不管字典多大，in 只需要哈希计算 + 取模 + 至多几次探测。真正的性能差异来自别处：键对象的 `hash()` 是否昂贵（比如对长字符串做 hash）、CPU 缓存是否命中（大哈希表条目更多、缓存 Miss 率更高）——但这些也只影响纳秒到几十纳秒的级别。

## 3. 最佳实践

### 3.1 推荐写法 vs 不推荐写法

**键存在性检查用 in，不靠 get 的返回值真假**

```python
d = {"value": 0}

# ✅ 推荐：in 精确判断存在性
if "value" in d:
    process(d["value"])

# ❌ 不推荐：0/None/False 都是假值，误判为"不存在"
# if d.get("value"):
#     process(d["value"])   # 值为 0 时不会进入！
```

**高频取值 + 键存在的用 try/except，缺失常见的用 in**

```python
# key 缺失率 < 1%：用 try/except（只抛少量异常）
def get_almost_always(d, key):
    try:
        return d[key]
    except KeyError:
        return None

# key 缺失率 > 10%：用 get 或 in
def get_config(d, key, default=None):
    return d.get(key, default)
```

**不要在大字典上对 values() 频繁做成员检查**

```python
# ❌ O(n) 扫描，大字典不可接受
# if target in huge_dict.values(): ...

# ✅ 提前构建反向映射
lookup = {v: k for k, v in huge_dict.items() if condition(v)}
if target in lookup:        # O(1)
    ...
```

### 3.2 一行代码的"存在即取值"模式

```python
# ✅ 简洁：get() + 默认值（只需要值、不需要处理不存在的情况）
timeout = config.get("timeout", 30)

# ✅ 有额外逻辑时用 in
if "callback" in config:
    register(config["callback"])
```

### 3.3 尽量复用哈希值的热代码

如果在同一段代码中反复用同一个 key 做多次 `in` 或 `d[key]` 操作，把它缓存到局部变量：

```python
# ✅ 一次哈希查找，后续直接用局部变量
if "user" in session:
    user = session["user"]   # 第二次哈希查找
    # 后续使用 user 不需要再查字典

# ✅ 更好：get() 一次哈希查找
user = session.get("user")
if user is not None:
    ...
```

### 3.4 字典 vs 集合做 in：选择正确的容器

当你只需要"成员检查"、不需要"键 → 值映射"时，用 `set` 而不是 `dict`：

```python
# ✅ 只需要检查存在性：用 set
valid_ids = {101, 102, 103}
if request_id in valid_ids:  # O(1)，没有值的开销
    ...

# ❌ 不需要值，但用了 dict（值纯浪费）
# valid_ids = {101: True, 102: True, 103: True}
```

`set` 底层也是哈希表，但每条条目只存键不存值，内存占用更小。`in` 的性能和字典完全一样（O(1)）。

### 3.5 避免用 in 做"探测式"循环

```python
d = {...}

# ❌ 反复对字典做 in → 需要 N 次哈希查找
# for item in items:
#     if item in d:
#         process(d[item])

# ✅ 要取多个键 → 先用 get 或 try/except 收集需要的键
found = {k: d[k] for k in keys if k in d}
# 或者
found = {k: v for k, v in d.items() if k in target_set}
```

### 3.6 安全提示：不要信任用户输入作为大量键的来源

如果 web 服务器的请求参数被用作字典的键，一个恶意用户可以通过传递大量**精心设计的键名**来制造哈希碰撞。Python 3.3+ 的哈希随机化基本解决了这个问题，但作为防御深度：

```python
# 如果请求体非常大（如用户 POST 一个 500MB JSON），
# 解析成 dict 本身就有 CPU 和内存风险
# 建议添加请求体大小限制和字典大小上限

# import sys
# MAX_DICT_SIZE = 100_000
# if len(request_dict) > MAX_DICT_SIZE:
#     raise ValueError("Too many keys")
```

### 3.7 列表 in vs 字典 in：选对容器

```python
# ❌ 用 list 做频繁的 in——O(n) 不可接受
items = [1, 2, 3, ..., 1000000]
# if target in items:   — 每次 O(n)

# ✅ 转成 set/dict——O(1)
items_set = set(items)
if target in items_set:
    ...
```

这条规则可以这样记：**超过 100 条条目的容器，需要多次做 `in` 的，一律用 `set` 或 `dict` 的键来存**。

## 4. 原理

### 4.1 `__contains__` 方法：in 的底层入口

`key in d` 在 Python 解释器中转换为 `dict.__contains__(d, key)`。`__contains__` 的实现完全依赖于哈希表：

```python
# dict.__contains__ 的 CPython 等价实现（简化）
def __contains__(self, key):
    h = hash(key)                              # 步骤 1：哈希
    index = h & (len(self._entries) - 1)       # 步骤 2：定位（& 是位与，等价于取模）
    while True:
        entry = self._entries[index]
        if entry is EMPTY:
            return False                       # 遇到空位 → 不存在
        if entry is not DUMMY and entry.hash == h and entry.key == key:
            return True                        # 找到 → True
        index = (index + 1) & (len(self._entries) - 1)  # 线性探测
```

这段等价实现说明了几个关键行为：

1. **检查分两级**：先比哈希值（`entry.hash == h`），一致后再比值（`entry.key == key`）。哈希值的比较是整数 `==`，极快；键的比较可能涉及 `obj.__eq__`，相对慢。两级检查让不匹配的键快速跳过。
2. **循环终止条件**：遇到 `EMPTY` 标记（槽位从未被使用过）→ 键不存在。遇到 `DUMMY`（被删除的标记）不终止，继续探测。
3. **取模用了位与**：`len(entries)` 总是 2 的幂次（3、6、12、24、...），所以 `h & (len - 1)` 等同于 `h % len`，但比取模快 2~3 倍。

### 4.2 为什么是 O(1) 平均、O(n) 最坏

O(1) 平均的原因：哈希函数通常将键均匀分布在哈希表条目数组中，所以探测长度保持在 1~3。字典的**装载因子**（load factor）在 2/3 左右时自动扩容（resize），进一步保证探测链始终很短。

O(n) 最坏的原因：如果所有 N 个键的哈希值都相等（极端碰撞），探测链长度 = N，每次 `in` 都相当于线性扫描整个数组。在 CPython 中，由于开放寻址使用线性探测，探测链在极端碰撞下会导致连续的"检查 → 下一个 → 检查"，性能剧烈退化。

### 4.3 哈希值、槽位和探测的精确模型

```
哈希表条目数组大小 = 2^k（如 8、16、32、64、...）
初始槽位 = hash(key) & (size - 1)   ← 位与 = 取模，快速定位

如果初始槽位被其他键占据（碰撞）：
下一个 = (初始 + 1) & (size - 1)     ← 线性探测
再下一个 = (初始 + 2) & (size - 1)
...
直到找到目标键或遇到 EMPTY。

示例（size = 8）：
键     hash % 8    实际存放槽位（假设按顺序插入）
"a"     hash→3      slot 3
"b"     hash→3      slot 3 被 a 占 → slot 4
"c"     hash→3      slot 3 被 a 占 → slot 4 被 b 占 → slot 5

三个键都 hash 到 slot 3，形成长度为 3 的探测链。
但这种情况在正常分布下极其罕见。
```

### 4.4 开放寻址 vs 分离链表

Python 字典使用**开放寻址**（open addressing）来解决哈希碰撞——所有键值对都放在同一个条目数组中，用探测链来处理碰撞。另一种常见的碰撞解决方式是**分离链表**（separate chaining）——每个槽位存一个链表头，碰撞的条目挂到链表上。

Python 选开放寻址的原因：

- 缓存友好：条目在内存中是连续的，CPU 缓存命中率高。
- 不需要额外的链表节点内存开销。
- 现代 CPU 的缓存行（64 bytes）能同时容纳几个条目，探测链遍历时大概率全在缓存里。

代价：

- 对哈希碰撞更敏感（碰撞直接增加探测长度）。
- 删除不能真正"清空"，只能标记 `DUMMY`（否则会断探测链）。

### 4.5 删除键如何在探测链中留"墓碑"

```python
d = {"a": 1, "b": 2, "c": 3}
del d["b"]

# 探测链在 b 被删除后的样子：
# slot 0: ["c":3]
# slot 1: DUMMY    ← 原来 "b":2 的位置，不能清空
# slot 2: ["a":1]
#
# 如果 slot 1 被清空成 EMPTY：
# hash("a") → slot 2 但探测要检查 slot 1
# 遇到 EMPTY → 直接返回 False → "a" 就被误判为不存在！
```

`DUMMY` 就是"墓碑"——告诉探测函数"继续往前看，后面的条目还是有效的"。只有遇到 `EMPTY` 才停止探测。

`DUMMY` 不会永久占用——当字典扩容（resize）时，会重建条目数组，新数组中所有 `DUMMY` 都会被丢弃。也就是说，字典扩容回收了这些墓碑槽位。

### 4.6 时间复杂度总表

| 操作                  | 平均 | 最坏 | 条件           |
| --------------------- | ---- | ---- | -------------- |
| `key in d`            | O(1) | O(n) | 极端碰撞       |
| `d[key]`              | O(1) | O(n) | 同上           |
| `d.get(key)`          | O(1) | O(n) | 同上           |
| `in d.values()`       | O(n) | O(n) | 始终线性扫描   |
| `(k, v) in d.items()` | O(1) | O(n) | 先定位键再比值 |
| `in list`             | O(n) | —    | 没有哈希加速   |
| `in set`              | O(1) | O(n) | 和 dict 同级   |

## 5. 总结

### 5.1 字典 in 速查

```
in 行为：
- "key" in d          平均 O(1)——哈希定位，不遍历
- "key" in d.keys()   同字典 O(1)——视图代理 __contains__
- val in d.values()   O(n)——线性扫描全部值
- (k,v) in d.items()  O(1)——哈希定位 k + 比值

键缺失时：
- "key" in d      → False，不抛错
- d["key"]        → KeyError
- d.get("key")    → None（或自定义默认值），不抛错

编程哲学：
- LBYL：if key in d: v = d[key]  "先看再跳"
- EAFP：try: v = d[key]; except KeyError  "先跳再求原谅"
- 选哪种看键缺失概率和代码团队风格

性能：
- 100 键的 dict vs 10M 键的 dict → in 差异 < 50ns（纳秒级）
- 同一个 key 在同一段代码中多次 in/d[key] → 会重复做哈希（一般可忽略）
- 极端碰撞退化到 O(n)——Python 3.3+ 哈希随机化基本防止了这个

特殊容器：
- defaultdict 的 in = dict，不触发工厂
- Counter 的 in = dict，0 值键依然 True
- OrderedDict 的 in = dict，O(1)
```

### 5.2 核心要点回顾

- `key in d` 是 O(1) 平均、O(n) 最坏。日常使用它就是 O(1)。
- O(1) 成立的前提：键可哈希、哈希函数分布均匀、字典装载因子保持在 ~2/3、有哈希随机化防碰撞。
- `d.values()` 的 in 是 O(n)——不要在大字典上频繁使用。
- `d.items()` 的 in 是 O(1)——先定位键再比值。
- LBYL（`if key in d`）和 EAFP（`try/except KeyError`）两种 Python 编程哲学对 in 有不同的选择权重。
- `in` 检查不触发 `defaultdict` 工厂、`Counter.__missing__` 等副作用——记住这一点避免意外建键。

### 5.3 读完应能掌握

- 能解释 `key in d` 为什么是 O(1)，知道 O(n) 退化的条件。
- 能在"键缺失率"场景中在 LBYL / EAFP / get() 三者间选对方式。
- 能区分 `keys()`/`values()`/`items()` 视图的 in 时间复杂度，避免 O(n) 陷阱。
- 能用 `in` 而不是 `get()` 的真假值来做精准的存在性判断。
- 能从 `__contains__` 等价的 CPython 实现中理解探测链和 `DUMMY` 标记。

### 5.4 常见面试问题

**问题一：`key in d` 的时间复杂度是多少？和 `key in list` 有什么区别？**

```python
d = {i: i for i in range(10_000_000)}
lst = list(range(10_000_000))

# key in d：O(1) 平均——哈希表直接定位
# key in list：O(n) 最坏——必须线性扫描直到找到或结束

# 100 vs 10M：
# dict in：差距 < 50ns
# list in：差距 = 100x（百万级别 → 差距上百毫秒）
```

**问题二：`d.get("key")` 和 `"key" in d` 在性能上有什么区别？**

都做了一次哈希查找，O(1)。`in` 只返回 True/False；`get` 返回值或默认值。`get` 等于 `in` + `d[key]` 合在一起但只做一次哈希查找。选 `get` 当需要"返回值 + 默认"时，选 `in` 当只需要"判断存在性"时。

**问题三：`in d.values()` 为什么是 O(n)？**

值的视图没有哈希索引——值可能重复、可能不是可哈希对象，哈希表没法建立"值 → 位置"的映射。所以 `values()` 必须遍历全部值才能回答"这个值存在吗"。

### 5.5 实战串讲：缓存系统 + in 的表现分析

用一个简单的缓存系统把本篇的核心点串起来——展示 O(1) 的 in 检查如何让缓存读写高效：

```python
import time

class SimpleCache:
    def __init__(self):
        self._store = {}

    def get(self, key: str, default=None):
        """in + get 一次哈希查找（不是两次，get 内部就是一次 O(1)）"""
        return self._store.get(key, default)

    def set(self, key: str, value):
        """插入或更新"""
        self._store[key] = value

    def __contains__(self, key: str) -> bool:
        """成员检查——O(1)"""
        return key in self._store

    def invalidate(self, key: str):
        """删除键——O(1)"""
        self._store.pop(key, None)

# 使用缓存
cache = SimpleCache()
cache.set("user:1001", {"name": "Alice", "age": 30})

# 检查是否存在——O(1)
if "user:1001" in cache:                       # in 检查（O(1)）
    data = cache.get("user:1001")              # get（O(1)）
    print(data)

# 模拟多线程并发下的"存在即取"模式
def fetch_with_cache(cache, key, fetch_fn):
    if key in cache:                            # LBYL：先检查
        return cache.get(key)
    value = fetch_fn(key)                       # 回源
    cache.set(key, value)                       # 写入缓存
    return value

# 演示不同规模的缓存对 in 的影响（几乎为零）
print("Testing O(1) in for different cache sizes...")
for size in [100, 10000, 100000]:
    d = {f"key_{i}": i for i in range(size)}
    t0 = time.perf_counter()
    for _ in range(10000):
        _ = "key_0" in d          # 检查第一个存在的键
    elapsed = time.perf_counter() - t0
    print(f"  size={size:>8}: in avg={(elapsed/10000)*1e9:.0f}ns")

# 输出示例：
#   size=     100: in avg=35ns
#   size=   10000: in avg=38ns
#   size=  100000: in avg=40ns
# 字典大了 1000x，in 只慢了 ~5ns —— O(1) 特性的直观表现
```

### 5.6 延伸

本篇作为字典时间复杂度系列的入口，聚焦于 `in` 这一个操作。顺着它往下走：

- **O(1) 的更多字典操作**：`d[key]` 取值、`d[key] = v` 赋值、`del d[k]` 删除、`len(d)` 长度——全是 O(1)。
- **字典扩容（resize）**：当装载因子超过 2/3 时，Python 会分配一个**两倍大小**的新条目数组，把所有元素重新哈希（rehash）到新数组中。这是一个 O(n) 的摊还操作——单个 insert 在 resize 时那一次是 O(n)，但长期平摊下来还是 O(1)。
- **理解 O(1) 的极限**：`in` 只在"查找步数"上没有看到 O(n) 的退化。但哈希函数本身对长键（几百 KB 的字符串）是 O(len)，取模是 O(1)，键比较（`key == entry.key`）对长字符串或嵌套结构也可能是 O(len)。所以在极端长键或不规范 `__eq__` 的实现下，`in` 的单次调用可能比"平均 40ns"慢几个数量级。

最终记住关于 `in` 的一句话：**O(1) 不是魔法，是哈希表赋予的底层保证——它在你日常写 `if key in d` 的每一行背后默默生效**。
