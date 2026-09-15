---
group:
  title: 【05】元组介绍
  order: 6
order: 9
title: 元组的可哈希性与 hash 方法
nav:
  title: Python基础
  order: 1
---

# 元组的可哈希性与 hash 方法

## 1. 介绍

### 1.1 什么是可哈希性

在 Python 中，**可哈希**（hashable）是指一个对象能够被 `hash()` 函数处理并返回一个整数。这个整数叫做**哈希值**，用于字典（`dict`）和集合（`set`）的快速查找。

一个对象要可哈希，必须满足两个条件：

1. **实现 `__hash__` 方法**：`hash(obj)` 能返回一个整数，且该值在对象生命周期内不变。
2. **实现 `__eq__` 方法**：能与另一个对象比较是否相等，且"相等的对象必须有相同的哈希值"。

```python
# 元组是可哈希的
t = (1, 2, 3)
print(hash(t))               # 一个整数
print(type(hash(t)))          # <class 'int'>

# 列表不可哈希
# hash([1, 2, 3])  # TypeError: unhashable type: 'list'
```

元组之所以可哈希，是因为它是**不可变**的——内容不会改变，哈希值自然也不会变。列表是可变的，如果允许哈希，修改内容后哈希值就会变，导致字典和集合的查找逻辑崩溃。

### 1.2 可哈希性的实际意义

可哈希性不是抽象概念——它直接决定了对象能否做字典的键或集合的元素：

| 能力 | 可哈希对象 | 不可哈希对象 |
|------|-----------|-------------|
| 做 `dict` 的键 | 可以 | 不行，`TypeError` |
| 做 `set` 的元素 | 可以 | 不行，`TypeError` |
| `frozenset` 的元素 | 可以 | 不行 |

```python
# 元组做字典键 — 可以
coords = {(0, 0): "原点", (1, 1): "右上"}

# 列表做字典键 — 不行
# {[1, 2]: "value"}  # TypeError: unhashable type: 'list'
```

### 1.3 常见类型的可哈希性

| 类型 | 可哈希 | 原因 |
|------|--------|------|
| `int`, `float`, `bool` | 可哈希 | 不可变 |
| `str` | 可哈希 | 不可变 |
| `tuple` | 可哈希（元素都可哈希时） | 不可变 |
| `frozenset` | 可哈希 | 不可变 |
| `None` | 可哈希 | 不可变 |
| `list` | 不可哈希 | 可变 |
| `dict` | 不可哈希 | 可变 |
| `set` | 不可哈希 | 可变 |

### 1.4 核心注意事项

**第一：元组可哈希的前提是所有元素都可哈希。**

```python
hash((1, 2, 3))       # OK — 元素都是 int
# hash((1, [2, 3]))   # TypeError — 列表不可哈希
```

元组虽然自身不可变，但如果它包含可变元素（如列表），`hash()` 会在计算时发现"里面有不可哈希的东西"并抛 `TypeError`。

**第二：相等的对象必有相同的哈希值。**

```python
t1 = (1, 2, 3)
t2 = (1, 2, 3)
print(t1 == t2)                  # True
print(hash(t1) == hash(t2))      # True
```

这是哈希的"一致性"要求——如果两个相等的对象哈希值不同，字典查找就会找不到目标。

**第三：哈希值在同一进程内确定，跨进程可能不同。**

Python 3.3+ 默认开启**哈希随机化**（`PYTHONHASHSEED=random`），字符串和元组的哈希值在不同 Python 进程中可能不同。这是一种安全措施，防止哈希碰撞攻击。

---

## 2. 核心内容

### 2.1 可哈希性基础

`hash()` 是 Python 内置函数，接受一个可哈希对象，返回一个整数：

```python
t = (1, 2, 3)
print(hash(t))               # 一个整数
print(type(hash(t)))          # <class 'int'>
```

**运行结果**：

```text
529344067295497451
<class 'int'>
```

常见可哈希类型都可以直接 `hash()`：

```python
print(hash(42))           # 42 — int 的 hash 通常等于自身
print(hash(3.14))         # 一个整数
print(hash("hello"))      # 一个整数
print(hash(True))         # 1 — True == 1，hash 也等于 hash(1)
print(hash(None))         # 一个整数
```

**运行结果**：

```text
42
322818021289917443
9017191242227491336
1
4238894112
```

不可哈希类型调用 `hash()` 会抛 `TypeError`：

```python
try:
    hash([1, 2, 3])
except TypeError as e:
    print(f"TypeError: {e}")

try:
    hash({"a": 1})
except TypeError as e:
    print(f"TypeError: {e}")

try:
    hash({1, 2, 3})
except TypeError as e:
    print(f"TypeError: {e}")
```

**运行结果**：

```text
TypeError: unhashable type: 'list'
TypeError: unhashable type: 'dict'
TypeError: unhashable type: 'set'
```

### 2.2 哈希一致性

哈希的核心规则：**相等的对象必须有相同的哈希值**。

```python
t1 = (1, 2, 3)
t2 = (1, 2, 3)

print(t1 == t2)                  # True
print(hash(t1) == hash(t2))      # True — 相等的对象哈希值相同
```

**运行结果**：

```text
True
True
```

这个规则也适用于跨类型：

```python
print(1 == 1.0)              # True
print(hash(1) == hash(1.0))  # True — int 和 float 相等时哈希也相同

print(True == 1)             # True
print(hash(True) == hash(1)) # True
```

**运行结果**：

```text
True
True
True
True
```

反过来不成立——哈希值相同不代表对象相等（哈希冲突），但哈希值不同则对象一定不相等。

### 2.3 空元组与单元素元组的哈希

```python
print(f"hash(())     = {hash(())}")       # 一个固定整数
print(f"hash((42,))  = {hash((42,))}")    # 一个整数
```

**运行结果**：

```text
hash(())     = 5740354900026072187
hash((42,))  = -3075770106605038476
```

空元组的哈希值在同一进程中是固定的。单元素元组的哈希值基于元素本身，但不是简单的 `hash(element)`——CPython 使用多项式计算来避免 `(1,)` 和 `1` 拥有相同哈希值的问题。

---

### 2.4 元组作为字典键

元组可哈希最直接的用途就是做字典的键。这在处理多维数据时非常常见：

```python
# 坐标 → 地名
coordinates = {
    (0, 0): "原点",
    (1, 0): "右",
    (0, 1): "上",
    (1, 1): "右上",
}
print(coordinates[(0, 0)])   # 原点
print(coordinates[(1, 1)])   # 右上

# 添加新坐标
coordinates[(2, 3)] = "新位置"
```

**运行结果**：

```text
原点
右上
```

字符串元组做键——模拟数据库行或复合记录：

```python
users = {
    ("张三", 25): "工程师",
    ("李四", 30): "设计师",
    ("王五", 28): "产品经理",
}
print(users[("张三", 25)])   # 工程师
```

**运行结果**：

```text
工程师
```

嵌套元组也能做键——只要所有层级的元素都可哈希：

```python
nested_dict = {((1, 2), (3, 4)): "网格区域"}
print(nested_dict[((1, 2), (3, 4))])   # 网格区域
```

**运行结果**：

```text
网格区域
```

### 2.5 元组作为集合元素

集合同样要求元素可哈希。元组做集合元素可以实现坐标集合、去重等操作：

```python
point_set = {(0, 0), (1, 0), (0, 1), (1, 1)}
print((0, 0) in point_set)   # True
print((2, 2) in point_set)   # False
```

**运行结果**：

```text
True
False
```

利用集合 + 元组去重：

```python
duplicates = (1, 2, 3, 1, 2, 1, 4, 5)
unique = tuple(set(duplicates))
print(unique)   # (1, 2, 3, 4, 5)（顺序不保证）
```

**运行结果**：

```text
(1, 2, 3, 4, 5)
```

列表不能做字典键和集合元素：

```python
try:
    {[1, 2]: "value"}
except TypeError as e:
    print(f"TypeError: {e}")

try:
    {[1, 2], [3, 4]}
except TypeError as e:
    print(f"TypeError: {e}")
```

**运行结果**：

```text
TypeError: unhashable type: 'list'
TypeError: unhashable type: 'list'
```

---

### 2.6 含不可哈希元素的元组

元组自身可哈希，但**只有当所有元素都可哈希时**，`hash()` 才能成功。如果元组包含列表、字典或集合等不可哈希元素，调用 `hash()` 会抛 `TypeError`。

#### 2.6.1 纯不可变元素 → 可哈希

```python
# 所有元素都是不可变类型
t1 = (1, "hello", 3.14, True, None)
print(hash(t1))   # OK

# 嵌套可哈希元组
t2 = ((1, 2), (3, 4), (5, 6))
print(hash(t2))   # OK
```

**运行结果**：

```text
5747261333378206176
683845631297459348
```

#### 2.6.2 含列表 → 不可哈希

```python
t = (1, [2, 3], 4)
try:
    hash(t)
except TypeError as e:
    print(f"TypeError: {e}")
```

**运行结果**：

```text
TypeError: unhashable type: 'list'
```

含列表的元组也不能做字典键和集合元素：

```python
t = (1, [2, 3], 4)
try:
    {t: "value"}
except TypeError as e:
    print(f"TypeError: {e}")

try:
    {t}
except TypeError as e:
    print(f"TypeError: {e}")
```

**运行结果**：

```text
TypeError: unhashable type: 'list'
TypeError: unhashable type: 'list'
```

#### 2.6.3 含字典或集合 → 不可哈希

```python
try:
    hash((1, {"a": 1}, 3))  # 含字典
except TypeError as e:
    print(f"TypeError: {e}")

try:
    hash((1, {2, 3}, 4))    # 含集合
except TypeError as e:
    print(f"TypeError: {e}")
```

**运行结果**：

```text
TypeError: unhashable type: 'dict'
TypeError: unhashable type: 'set'
```

#### 2.6.4 深层嵌套中的不可哈希元素

即使外层都是元组，只要最深层的某个元素不可哈希，整个元组就不可哈希：

```python
t = ((1, [2, 3]), (4, 5))  # 内层元组 (1, [2,3]) 含列表
try:
    hash(t)
except TypeError as e:
    print(f"TypeError: {e}")
```

**运行结果**：

```text
TypeError: unhashable type: 'list'
```

`hash()` 会递归检查每个元素的哈希值。当它尝试 `hash((1, [2, 3]))` 时发现 `[2, 3]` 不可哈希，于是整个调用链失败。

#### 2.6.5 解决方案：将可变元素转为不可变

需要用元组做字典键，但数据中有列表时，应先将列表转为元组：

```python
# 错误做法
try:
    cache = {}
    cache[("user", [1, 2, 3])] = "数据"  # TypeError
except TypeError as e:
    print(f"TypeError: {e}")

# 正确做法：列表转元组
cache = {}
cache[("user", (1, 2, 3))] = "数据"
print(cache[("user", (1, 2, 3))])   # 数据
```

**运行结果**：

```text
TypeError: unhashable type: 'list'
数据
```

#### 2.6.6 检查元组是否可哈希

```python
def is_hashable(obj):
    """检查对象是否可哈希"""
    try:
        hash(obj)
        return True
    except TypeError:
        return False

test_cases = [
    ("纯整数元组", (1, 2, 3)),
    ("含列表元组", (1, [2], 3)),
    ("嵌套可哈希", ((1, 2), (3, 4))),
    ("嵌套含列表", ((1, [2]), (3, 4))),
    ("空元组", ()),
    ("字符串元组", ("a", "b")),
]
for name, tc in test_cases:
    print(f"  {name}: {is_hashable(tc)}")
```

**运行结果**：

```text
  纯整数元组: True
  含列表元组: False
  嵌套可哈希: True
  嵌套含列表: False
  空元组: True
  字符串元组: True
```

---

### 2.7 hash 函数的工作原理

#### 2.7.1 哈希一致性验证

"相等的对象必有相同的哈希值"是哈希函数的核心契约：

```python
pairs = [
    (1, 1.0),           # int 和 float
    (True, 1),          # bool 和 int
    (False, 0),         # bool 和 int
    ((1, 2), (1, 2)),   # 两个相等的元组
]
for a, b in pairs:
    print(f"  {a!r} == {b!r} → {a == b}, hash_eq={hash(a) == hash(b)}")
```

**运行结果**：

```text
  1 == 1.0 → True, hash_eq=True
  True == 1 → True, hash_eq=True
  False == 0 → True, hash_eq=True
  (1, 2) == (1, 2) → True, hash_eq=True
```

#### 2.7.2 元组 hash 的计算方式

CPython 中元组的 `hash` 不是简单地把元素 `hash` 加起来——那样 `(1, 2)` 和 `(2, 1)` 就会有相同的哈希值，导致大量冲突。实际使用的是**多项式哈希**：

```python
t_a = (1, 2)
t_b = (2, 1)
print(hash(t_a) == hash(t_b))   # False — 顺序不同，哈希不同
```

**运行结果**：

```text
False
```

多项式哈希的核心思想是：`hash = hash(e0) ⊕ (mult × hash(e1)) ⊕ (mult² × hash(e2)) ⊕ ...`，其中 `mult` 是一个常数。这样元素的**位置**会影响最终的哈希值，`(1, 2)` 和 `(2, 1)` 就能产生不同的哈希。

#### 2.7.3 哈希冲突

不同的对象可能有相同的哈希值——这叫**哈希冲突**。哈希表（dict、set）通过 `__eq__` 来区分冲突的对象：先比较哈希值（快速筛选），哈希值相同时再用 `==` 精确比较。

```python
# 在小整数范围内查找哈希冲突
conflicts = {}
for i in range(10000):
    h = hash(i)
    if h in conflicts:
        print(f"冲突! hash({i}) == hash({conflicts[h]}) == {h}")
    else:
        conflicts[h] = i
else:
    print("10000 以内的整数无哈希冲突")
```

**运行结果**：

```text
10000 以内的整数无哈希冲突
```

小整数通常不会有哈希冲突——因为 `hash(n) == n` 对小整数成立。但随着值范围扩大或对象类型变化，冲突是可能发生的。

#### 2.7.4 哈希值的范围与算法

```python
import sys
print(f"hash 位数: {sys.hash_info.width} bits")
print(f"hash 模数: {sys.hash_info.modulus}")
print(f"hash 算法: {sys.hash_info.algorithm}")
```

**运行结果**：

```text
hash 位数: 64 bits
hash 模数: 2305843009213693951
hash 算法: siphash13
```

Python 3.4+ 使用 SipHash 算法计算字符串和字节串的哈希值。对于整数，`hash(n)` 等于 `n % modulus`（模数是梅森素数 `2^61 - 1`）。

#### 2.7.5 哈希随机化

Python 3.3+ 默认开启**哈希随机化**——每个 Python 进程启动时生成一个随机种子（`PYTHONHASHSEED`），字符串和元组的哈希值会因种子不同而变化：

```python
# 在不同 Python 进程中运行，hash("Python") 的值可能不同
print(hash("Python"))  # 本进程的值，其他进程可能不同
```

这是安全措施——如果没有随机化，攻击者可以构造大量哈希值相同的字符串，导致字典查找退化为 O(n)，形成**哈希碰撞拒绝服务攻击**。

---

### 2.8 综合场景实战

#### 2.8.1 坐标网格映射

```python
grid = {}
for x in range(3):
    for y in range(3):
        grid[(x, y)] = f"区域({x},{y})"

print(grid[(1, 2)])   # 区域(1,2)
print(grid[(0, 0)])   # 区域(0,0)
```

**运行结果**：

```text
区域(1,2)
区域(0,0)
```

用元组坐标做键，O(1) 查找任意位置——比用二维列表 `grid[x][y]` 更灵活（支持稀疏网格）。

#### 2.8.2 多字段复合键去重

```python
orders = (
    ("ORD001", "SKU-A", "2024-01-15"),
    ("ORD002", "SKU-B", "2024-01-15"),
    ("ORD001", "SKU-A", "2024-01-15"),  # 重复
    ("ORD003", "SKU-C", "2024-01-16"),
    ("ORD002", "SKU-B", "2024-01-15"),  # 重复
)
unique_orders = tuple(set(orders))
print(f"原始: {len(orders)}, 去重: {len(unique_orders)}")
```

**运行结果**：

```text
原始: 5, 去重: 3
```

元组天然适合做复合键——多个字段打包成一个不可变的整体，`set` 去重利用哈希快速判断"这条记录是否已存在"。

#### 2.8.3 缓存系统

```python
_cache = {}

def expensive_compute(a, b, c):
    key = (a, b, c)  # 参数打包成元组做缓存键
    if key in _cache:
        print(f"  缓存命中: {key}")
        return _cache[key]
    print(f"  计算新值: {key}")
    result = a * b + c
    _cache[key] = result
    return result

print(expensive_compute(2, 3, 4))  # 计算新值
print(expensive_compute(2, 3, 4))  # 缓存命中
print(expensive_compute(3, 4, 5))  # 计算新值
```

**运行结果**：

```text
  计算新值: (2, 3, 4)
10
  缓存命中: (2, 3, 4)
10
  计算新值: (3, 4, 5)
17
```

将函数参数打包成元组做缓存键——这是 `functools.lru_cache` 装饰器的核心原理。

#### 2.8.4 矩阵稀疏存储

```python
# 大型稀疏矩阵——大部分元素为 0，只存非零元素
sparse_matrix = {
    (0, 2): 3.14,
    (1, 0): 2.71,
    (3, 4): 1.41,
    (4, 1): 0.58,
}

def get_element(matrix, row, col, default=0.0):
    return matrix.get((row, col), default)

print(get_element(sparse_matrix, 0, 2))   # 3.14
print(get_element(sparse_matrix, 1, 1))   # 0.0（默认值）
print(f"非零元素数量: {len(sparse_matrix)}")
```

**运行结果**：

```text
3.14
0.0
非零元素数量: 4
```

稀疏矩阵用 `(行, 列)` 元组做键，只存非零元素——对于一个 1000×1000 但只有 50 个非零元素的矩阵，内存从 100 万元组降到 50 条字典记录。

---

## 3. 最佳实践

### 3.1 推荐写法 vs 不推荐写法

**需要做字典键或集合元素时，用元组而非列表**

```python
# 推荐：元组可哈希
coords = {(0, 0): "origin", (1, 1): "corner"}

# 不推荐：列表不可哈希，会报错
# coords = {[0, 0]: "origin"}  # TypeError
```

**元组中有列表需要做键时，先转换为元组**

```python
# 推荐：先转元组
data = [1, 2, 3]
key = tuple(data)
cache[key] = "result"

# 不推荐：直接用含列表的元组
# cache[("data", [1, 2, 3])] = "result"  # TypeError
```

**判断可哈希性用 try-except 而非 type 检查**

```python
# 推荐：鸭子类型
def is_hashable(obj):
    try:
        hash(obj)
        return True
    except TypeError:
        return False

# 不推荐：硬编码类型列表
# def is_hashable(obj):
#     return isinstance(obj, (int, str, tuple, frozenset, ...))
```

原因：自定义对象也可能可哈希，硬编码类型列表会遗漏。

### 3.2 常见错误模式

**错误模式1：以为元组一定可哈希**

```python
t = (1, [2, 3], 4)
# hash(t)  # TypeError — 列表不可哈希
```

修正：元组可哈希的前提是所有元素都可哈希。

**错误模式2：修改"可哈希"对象的内部 mutable 元素后做字典键**

```python
t = (1, [2, 3])
d = {}
# d[t] = "value"  # TypeError — t 本身就不可哈希

# 即使 t 可哈希，也不应该修改其内部可变元素再用作键
# 因为哈希值不会因可变元素的修改而更新
```

**错误模式3：依赖跨进程的哈希值**

```python
# 进程 A 中
# hash("test") = 123456

# 进程 B 中
# hash("test") = 789012  # 不同！
```

修正：不要将哈希值持久化存储或跨进程传递。如果需要稳定指纹，用 `hashlib`（如 `hashlib.sha256`）。

### 3.3 性能与安全建议

| 建议 | 原因 |
|------|------|
| 做字典键用元组 | 可哈希，O(1) 查找 |
| 复合键用元组而非字符串拼接 | 更直观，避免分隔符歧义 |
| 跨进程不用 `hash()` | 哈希随机化导致不同进程值不同 |
| 持久化用 `hashlib` | 哈希值可复现，不受 `PYTHONHASHSEED` 影响 |
| 稀疏数据用元组键字典 | 节省内存，只存非零/有效项 |

---

## 4. 原理

### 4.1 哈希表的工作原理

字典和集合底层都是**哈希表**。哈希表的核心思想是：用哈希值直接计算存储位置，实现 O(1) 查找。

**查找过程**：

```text
1. 计算 hash(key) → 得到一个整数 h
2. 用 h 对表大小取模 → 得到存储槽位 index
3. 检查槽位 index 处的元素：
   a. 如果槽位为空 → key 不存在
   b. 如果槽位有元素且 hash 相同且 == 相等 → 找到了
   c. 如果槽位有元素但 hash 不同或 == 不等 → 哈希冲突，探测下一个槽位
```

元组之所以能做键，是因为它的哈希值在生命周期内不变——如果允许用列表做键，列表修改后哈希值就变了，原来的槽位找不到它了，数据就"丢失"了。

### 4.2 元组 hash 的多项式计算

CPython 中元组的 `hash` 使用**多项式哈希**（参见 CPython 源码 `tuplehash`）：

```text
hash(tuple) = hash(e0) ⊕ (MULT × hash(e1)) ⊕ (MULT² × hash(e2)) ⊕ ...
```

其中 `MULT` 是一个基于元组长度的混合常数，`⊕` 是异或操作。

这种设计的优势：

1. **顺序敏感**：`(1, 2)` 和 `(2, 1)` 哈希值不同——因为元素位置参与了计算。
2. **抗碰撞**：多项式混合比简单求和更分散，减少冲突率。
3. **递归友好**：嵌套元组的哈希值可以递归计算——`hash((1, (2, 3)))` 会先 `hash((2, 3))` 得到一个整数，再把它当成普通元素参与外层多项式。

### 4.3 为什么不可哈希对象不实现 __hash__

列表、字典、集合都是可变对象。如果它们实现 `__hash__`，哈希值就必须在内容修改后更新——但哈希表不支持"更新键的哈希值"操作。

你可能会想"那就在每次 `hash()` 调用时实时计算不就行了吗？"——问题在于，当你把一个列表作为字典键存进去时，哈希表用当时的哈希值决定存储位置。之后你修改了列表内容，再调用 `hash()` 得到新值，但哈希表里记录的还是旧哈希值——你永远找不到这个键了。

所以 Python 的设计是：**可变对象的 `__hash__` 设为 `None`**，直接禁止哈希。这是"防止误用"的设计——与其让你在运行时遇到诡异的数据丢失 bug，不如在 `hash()` 调用时就报错。

### 4.4 哈希随机化的安全意义

在没有哈希随机化的时代，攻击者可以构造大量哈希值相同的字符串发送给 Web 服务器。服务器将这些字符串存入字典时，所有键都映射到同一个槽位，哈希表退化为链表，查找从 O(1) 变成 O(n)。发送几 MB 的恶意数据就能让服务器 CPU 飙升——这叫**哈希碰撞 DoS 攻击**。

Python 3.3+ 默认开启 `PYTHONHASHSEED=random`，每次进程启动使用不同的种子，攻击者无法预测哈希值，也就无法构造恶意输入。

---

## 5. 总结

本文围绕元组的可哈希性与 `hash` 方法展开，主要介绍了以下内容：

- **可哈希性基础**：可哈希对象能用 `hash()` 返回一个整数。元组是可哈希的因为它是不可变的——哈希值在生命周期内不变。列表、字典、集合不可哈希因为它们是可变的。`hash()` 返回 `int` 类型。

- **哈希一致性**：相等的对象必有相同的哈希值。`1` 和 `1.0` 哈希相同，`True` 和 `1` 哈希相同。哈希值相同不代表对象相等（哈希冲突），但哈希值不同则对象一定不相等。

- **元组作为字典键和集合元素**：元组可哈希的直接用途——做字典键（坐标映射、复合键、嵌套键）、做集合元素（坐标集合、去重）。列表不能做键或集合元素。利用 `set` + 元组可以快速去重。

- **含不可哈希元素的元组**：元组可哈希的前提是所有元素都可哈希。含列表、字典、集合的元组不可哈希。深层嵌套中只要有一个不可哈希元素，整个元组就不可哈希。解决方案是将可变元素转为不可变版本（如 `list` → `tuple`）。

- **hash 函数原理**：元组使用多项式哈希（顺序敏感，`(1,2)` 和 `(2,1)` 哈希不同）。哈希冲突存在但罕见，哈希表用 `==` 精确区分冲突。Python 3.4+ 使用 SipHash 算法。哈希随机化（`PYTHONHASHSEED`）是安全措施，跨进程哈希值可能不同。

- **最佳实践**：做字典键用元组不用列表；含可变元素先转元组；判断可哈希性用 `try-except` 而非类型硬编码；跨进程不用 `hash()`，持久化用 `hashlib`。

- **底层原理**：哈希表用哈希值计算存储槽位实现 O(1) 查找。可变对象不实现 `__hash__` 是"防止误用"——避免修改内容后哈希值变化导致数据"丢失"。哈希随机化防止哈希碰撞 DoS 攻击。
