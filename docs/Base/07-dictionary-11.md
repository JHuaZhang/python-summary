---
group:
  title: 【07】字典深度剖析
  order: 7
order: 11
title: 字典底层原理哈希表
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 字典为什么这么快

前面学习中有一个结论被反复提及：字典的取值、赋值、`in` 判断都是**平均 O(1)**。无论字典里有 10 个键还是 1000 万个键，`d[key]` 几乎一样快。这不是魔法——它靠的是**哈希表（hash table）**。

哈希表是计算机科学中最经典的数据结构之一。它的核心思想很朴素：**用键的哈希值直接算出存储位置，跳过"逐个比较"的笨办法**。列表查找 `x in lst` 是 O(n)，因为必须从第一个元素扫描到最后一个；字典查找 `key in d` 是 O(1)，因为它直接"算"出目标应该在哪个位置，只比较一两次就能命中。

```python
# 同样是"找某个东西"，字典和列表的代价天差地别
lst = list(range(10_000_000))
d = {i: i for i in range(10_000_000)}

# 列表查找：O(n)，必须遍历
# 5000000 in lst   # 大约需要扫描一半元素

# 字典查找：O(1)，直接定位
# 5000000 in d     # 几乎瞬间完成
```

本篇是系列中唯一的纯"原理"篇——它不教你怎么用字典，而是把前面十篇所有操作（创建、存取、遍历、合并、in 判断）的共同底座——哈希表——彻底拆开。读完你会明白：为什么键必须可哈希、为什么插入顺序能被保留、为什么删除不会让字典"缩回去"、为什么恶意构造的键能让字典退化到 O(n)。

### 1.2 哈希表的核心思想：从"找"到"算"

传统查找的思路是"按位置找"：给你一个数组，要找某个元素，就从第 0 个开始逐个比，直到比中或到头。这在数据量大时非常低效——每多存一个元素，查找就多花一份时间。

哈希表把"找"变成了"算"：**用一个函数（哈希函数）把键映射成数组下标**。存的时候，算出下标、写入；取的时候，同样的函数算出同样的下标、读出。中间的 "算" 是 O(1)——不管数组多大，算一次就够了。

```
传统查找（列表）：
  键 "Alice" → ? → ? → ? → ... → 从第 0 个开始比，直到命中或到末尾

哈希表查找（字典）：
  键 "Alice" → hash("Alice") → 下标 3 → 直接去数组第 3 个位置比较 → 命中！
```

剩下的一切复杂性——哈希冲突、探测序列、负载因子、resize——都围绕一个核心问题展开：**当两个不同的键算出同一个下标时怎么办**。理解了这个问题的各种解法，你就理解了哈希表的全部。

### 1.3 前置知识：哈希值与可哈希性

在深入哈希表之前，必须先理解两个基础概念。

**哈希值（hash value）**：`hash(obj)` 返回一个整数，代表对象的"摘要"。对同一个对象，在同一次进程生命周期内，`hash()` 始终返回相同的值。不同对象可以有相同的哈希值（即哈希冲突），这是正常的。

```python
# 基本类型的哈希值
print(hash("Alice"))     # 输出：某个整数，如 -5819873348768798277
print(hash(42))          # 输出：42  ← 小整数的哈希是其自身
print(hash(3.14))        # 输出：322818021289917443
print(hash((1, 2, 3)))   # 输出：529344067295497451

# 同一个对象，多次调用结果一致
print(hash("Alice") == hash("Alice"))   # 输出：True
```

**可哈希性（hashability）**：一个对象能作字典键的前提是"可哈希"——即它的哈希值在其生命周期内不变，且它能和其他对象比较相等（`__eq__`）。不可变类型（`str`、`int`、`tuple`、`frozenset`）天生可哈希；可变类型（`list`、`dict`、`set`）天生不可哈希。

```python
# 可哈希：值不可变，哈希稳定
print(hash("hello"))          # 没问题

# 不可哈希：值可变，哈希随内容变化，无法稳定定位
# print(hash([1, 2, 3]))     # TypeError: unhashable type: 'list'

# 判断一个对象是否可哈希
from collections.abc import Hashable
print(isinstance("hello", Hashable))   # 输出：True
print(isinstance([1, 2], Hashable))    # 输出：False
```

为什么可哈希对字典如此重要？因为字典要靠哈希值定位存储位置——存进去之后如果哈希值变了，下次就再也找不到这个条目了。所以 Python 直接从语言层面禁止可变对象作键：在 `hash()` 调用时就报错。

## 2. 核心内容

### 2.1 哈希表的基本构造：数组 + 哈希函数 + 冲突处理

一个哈希表由三部分组成：

1. **数组（桶/槽位）**：一个固定大小的数组，每个位置（槽位）可以存放一个"条目"或标记为空。
2. **哈希函数**：输入键，输出一个分布均匀的整数。`hash(key)` 就是这个角色。
3. **冲突处理策略**：当两个不同键哈希到同一槽位时，决定"下一个位置在哪"的规则。

最简化的哈希表逻辑可以用几行代码模拟：

```python
# 最简化的哈希表模型（仅演示思想，不是 CPython 实现）
class SimpleHashTable:
    def __init__(self, size=8):
        self.size = size
        self.table = [None] * size   # 槽位数组，None 表示空

    def _index(self, key):
        return hash(key) % self.size  # 哈希值取模 → 槽位下标

    def put(self, key, value):
        idx = self._index(key)
        self.table[idx] = (key, value)

    def get(self, key):
        idx = self._index(key)
        entry = self.table[idx]
        if entry is not None and entry[0] == key:
            return entry[1]
        raise KeyError(key)

# 使用示例
ht = SimpleHashTable()
ht.put("Alice", 90)
ht.put("Bob", 85)
print(ht.get("Alice"))   # 输出：90
print(ht.get("Bob"))     # 输出：85
```

这个极简版本展示了核心骨架，但它有两个致命缺陷：一是没有处理哈希冲突（两个键算到同一个下标会互相覆盖），二是数组大小固定不会扩容。真实的 CPython 字典在这两个问题上做了大量工程优化，后文逐一拆解。

### 2.2 Python 的 hash() 函数：各类型的行为

Python 内置的 `hash()` 函数是哈希表的入口。不同类型的对象有不同的哈希算法，但都满足两条核心约束：

- **稳定性**：同一进程内，同一对象的 `hash()` 返回值始终相同。
- **相等性一致**：如果 `a == b`，则 `hash(a) == hash(b)`。反之不要求（哈希冲突合法）。

```python
# 整数：小整数的哈希就是其自身（-1 除外）
print(hash(0))       # 输出：0
print(hash(1))       # 输出：1
print(hash(42))      # 输出：42
print(hash(-1))      # 输出：-2   ← 特殊：-1 被保留作错误标记，哈希值改为 -2
print(hash(10**20))  # 输出：某个截断后的整数   ← 大整数取模截断
```

```python
# 浮点数：基于 IEEE 754 二进制表示的哈希
# 关键特性：值相等的浮点数哈希相等
print(hash(1.0) == hash(1))          # 输出：True   ← 1.0 == 1，所以哈希必须相等
print(hash(0.0) == hash(-0.0))       # 输出：True   ← 0.0 == -0.0 为 True
print(hash(float('nan')))            # 输出：0      ← NaN 的哈希固定为 0
```

```python
# 字符串与字节：每次进程启动随机化（PYTHONHASHSEED），防止哈希冲突攻击
print(hash("hello"))      # 输出：每次运行不同，如 2290989912792889526
print(hash(b"hello"))     # 输出：与字符串不同的值

# 相同内容的字符串哈希一定相同
print(hash("hello") == hash("hello"))   # 输出：True
```

```python
# 元组：基于元素的哈希混合计算
print(hash((1, 2, 3)))    # 输出：529344067295497451

# 含不可哈希元素的元组也不能哈希
# print(hash((1, [2])))   # TypeError: unhashable type: 'list'

# 自定义对象：默认基于 id()（内存地址）计算哈希
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

p1 = Point(3, 4)
p2 = Point(3, 4)
print(hash(p1) == hash(p2))    # 输出：False   ← 默认按身份哈希，两个不同对象哈希不同
print(p1 == p2)                # 输出：False   ← 默认 __eq__ 也是比身份
```

自定义对象要正确用作字典键，必须同时实现 `__hash__` 和 `__eq__`，且"相等即同哈希"：

```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __eq__(self, other):
        if not isinstance(other, Point):
            return NotImplemented
        return self.x == other.x and self.y == other.y

    def __hash__(self):
        return hash((self.x, self.y))   # 用元组的哈希，保证相等→同哈希

p1 = Point(3, 4)
p2 = Point(3, 4)
d = {p1: "origin"}
print(d[p2])   # 输出：origin   ← p2 虽然不同对象，但 __eq__ 判等、__hash__ 同值，所以能命中
```

### 2.3 哈希值到槽位的映射：取模与掩码

`hash(key)` 返回的是一个可能很大的整数（Python int 无上限），而哈希表数组的大小是有限的（比如 8、16、32）。所以需要把哈希值"压缩"到数组下标的范围。

CPython 的实际做法是用**位掩码（bitmask）**代替取模——前提是数组大小为 2 的幂：

```
# 概念等价（CPython 用位运算）：下标 = hash(key) % table_size
# 实际实现：下标 = hash(key) & (table_size - 1)   [当 table_size 是 2 的幂时等价]
```

位运算比取模快一个数量级，这正是 CPython 字典数组大小总是 2 的幂（8、16、32、64...）的原因。

```python
# 模拟哈希值到槽位下标的映射
def hash_index(key, table_size):
    """模拟 CPython 的哈希值到数组下标的映射"""
    h = hash(key)
    return h & (table_size - 1)   # 位掩码，等价于 h % table_size（table_size 为 2 的幂时）

# 不同键可能落在同一槽位——这就是哈希冲突
print(hash_index("Alice", 8))    # 输出：某个 0~7 的值
print(hash_index("Bob", 8))      # 输出：某个 0~7 的值
# 如果两个输出相同 → 哈希冲突
```

当 `table_size` 为 8 时，掩码是 `7`（二进制 `0b111`），取哈希值的低 3 位。这引出一个关键设计：**哈希函数的高位随机性通过扰动公式混合进低位**，否则高位信息被掩码丢弃会导致冲突率飙升。

### 2.4 哈希冲突：当两个键争同一个槽位

哈希冲突是哈希表设计中不可避免的问题——键的空间远比槽位数组大，根据鸽巢原理，不同键必然有概率算到同一槽位。Python 字典使用**开放寻址（open addressing）**策略解决冲突：

```
当目标槽位已被占用时，按"探测公式"找下一个槽位，直到找到空位或匹配的键。
```

```python
# 模拟开放寻址的插入过程
class OpenAddrDict:
    """演示开放寻址的最简实现"""
    def __init__(self, size=8):
        self.size = size
        self.table = [None] * size

    def _probe(self, key):
        """返回槽位下标，若被占则线性探测下一个"""
        idx = hash(key) & (self.size - 1)
        original = idx
        while self.table[idx] is not None:
            existing_key, _ = self.table[idx]
            if existing_key == key:
                return idx   # 键已存在，返回该槽位（更新场景）
            idx = (idx + 1) % self.size   # 线性探测：去下一个槽位
            if idx == original:
                raise Exception("哈希表满了！")
        return idx

    def __setitem__(self, key, value):
        idx = self._probe(key)
        self.table[idx] = (key, value)

    def __getitem__(self, key):
        idx = hash(key) & (self.size - 1)
        original = idx
        while self.table[idx] is not None:
            existing_key, value = self.table[idx]
            if existing_key == key:
                return value
            idx = (idx + 1) % self.size
            if idx == original:
                break
        raise KeyError(key)

# 演示哈希冲突：两个不同键落同一槽位
d = OpenAddrDict(8)
d["a"] = 1
d["b"] = 2
# 如果 "a" 和某键冲突，"b" 会被存入探测链的下一个槽位
print(d["a"])   # 输出：1
print(d["b"])   # 输出：2
```

上面的线性探测（`idx + 1`）是最简单的策略，但它会导致**主聚类（primary clustering）**——连续冲突时，槽位会形成长串连续被占的区域，恶化性能。CPython 实际使用更精妙的扰动公式。

### 2.5 探测序列：CPython 的扰动公式

CPython 字典的探测不是简单的 `idx = (idx + 1) % size`，而是用哈希值的高位比特反复扰动，生成一个"伪随机"的探测序列。核心代码等价于：

```python
# CPython 探测算法简化示意（实际实现更精细）
def probe_sequence(hash_value, mask):
    """生成开放寻址的探测序列"""
    perturb = hash_value          # 扰动变量，初始为完整哈希值
    idx = hash_value & mask       # 初始槽位
    while True:
        yield idx
        # 扰动公式：perturb >>= 5, idx = (idx * 5 + 1 + perturb) & mask
        perturb >>= 5
        idx = (idx * 5 + 1 + perturb) & mask
```

其中 `perturb >>= 5` 每次右移 5 位，让哈希值的高位信息逐步混入低位。`idx * 5 + 1` 提供基础步进。这个公式的精妙之处在于：

- **高位参与**：即使初始下标只用了哈希值的低几位，高位信息通过 `perturb` 逐渐影响探测路径。
- **伪随机性**：探测序列比线性探测更分散，避免连续聚集。
- **确定性**：相同哈希值的探测序列完全相同，保证"按同一路径找一定能命中"。

```python
# 可视化探测序列（不同键的路径不同，避免扎堆）
def show_probe(hash_val, size=16, steps=5):
    mask = size - 1
    perturb = hash_val
    idx = hash_val & mask
    indices = []
    for _ in range(steps):
        indices.append(idx)
        perturb >>= 5
        idx = (idx * 5 + 1 + perturb) & mask
    return indices

# 两个冲突的键，探测路径分叉
print(show_probe(hash("aaa")))   # 输出：如 [10, 12, 8, 1, 11]
print(show_probe(hash("bbb")))   # 输出：如 [3, 13, 15, 1, 4]   ← 即使初始槽相同，路径也会分叉
```

这个算法是 Python 字典性能的基石——它让哈希表在高负载下仍能保持接近 O(1) 的查找效率，而不会像简单的线性探测那样退化成 O(n)。

### 2.6 负载因子与动态扩容（Resize）

哈希表的容量不是无限的。当槽位被大量占用时，冲突概率激增，探测链变长，性能退化。为此，哈希表在"装得足够满"时自动扩大。

**负载因子（load factor）** = 已占用槽位 / 总槽位数。CPython 字典的扩容阈值约为 **2/3**——即当条目数达到槽位数的 2/3 时触发 resize。具体来说，每个字典维护一个 `usable` 计数器，初始值为 `size * 2/3`（精确值是 `floor(size * 2/3)`），每插入一个新键就减 1，减到 0 时触发扩容。

```python
import sys

# 观察字典随条目增长的扩容行为
d = {}
prev_size = sys.getsizeof(d)
resize_points = []

for i in range(1, 100):
    d[i] = i
    cur_size = sys.getsizeof(d)
    if cur_size != prev_size:
        resize_points.append((len(d), cur_size))
        prev_size = cur_size

# 打印每次扩容的时机和大小
for count, mem in resize_points:
    print(f"条目数={count:<4} 内存大小={mem:>6} bytes")
```

扩容的步骤是：分配一个更大的新数组（通常为原大小的 2 倍或 4 倍，视当前条目数而定），然后把旧数组中的所有条目重新哈希、逐个插入新数组。这个过程是 O(n)，但由于每次扩容触发间隔随字典增大而拉长，**均摊到每次插入仍是 O(1)**。

```python
# 扩容的核心操作示意
def dict_resize(old_table):
    new_size = old_table.size * 2    # 简化模型，实际 CPython 有更精细的增长策略
    new_table = [None] * new_size
    for entry in old_table:
        if entry is not None and entry is not DUMMY:
            # 重新用新的 mask 计算槽位并插入
            idx = entry.hash & (new_size - 1)
            # ... 冲突探测，最终放入 new_table[idx]
            new_table[final_idx] = entry
    return new_table
```

有一点值得注意：**删除键不会触发缩容（shrink）**。字典只会变大，不会自动变小。这是设计取舍——多数场景下字典要么持续增长，要么增长到稳定规模后不变，频繁缩容的收益远小于复杂度。

### 2.7 条目结构：hash-key-value 三元组

CPython 字典的每个槽位存储的不是简单的键值对，而是一个**三元组**：`(hash, key, value)`。预先缓存哈希值的意义在于——查找时只需要比较哈希值，只有哈希相等时才做完整的 `==` 比较。这是性能优化的经典手法：

```python
# 查找时先比哈希，哈希不等直接跳过——省掉 __eq__ 调用
# 伪代码：
def dict_lookup(table, key):
    target_hash = hash(key)
    idx = target_hash & table.mask
    while True:
        entry = table[idx]
        if entry is EMPTY:
            raise KeyError(key)
        if entry.hash == target_hash and entry.key == key:   # 先比哈希，哈希不等跳过 __eq__
            return entry.value
        idx = probe_next(idx, target_hash, table.mask)
```

这种设计在"键比较昂贵"的场景（如长字符串、嵌套元组）收益最大——先比较一个快速整数，能过滤掉绝大多数候选槽位。

```python
# 演示 hash-key-value 三元组的存储方式
class DictEntry:
    __slots__ = ('hash_val', 'key', 'value')
    def __init__(self, hash_val, key, value):
        self.hash_val = hash_val
        self.key = key
        self.value = value

# 实际存储示例
entries = [
    DictEntry(hash("Alice"), "Alice", 90),
    DictEntry(hash("Bob"),   "Bob",   85),
]
# 查找 "Bob" 时：比较 entries[1].hash_val == hash("Bob") → True → 再比 key == "Bob" → 命中
```

条目中的 `hash_val` 还有另一个用途——在探测过程中，每个槽位不管是否被占、都可以用哈希值比较快速跳过不匹配的条目。这比每次 `__eq__` 调用高效得多。

### 2.8 删除与 DUMMY 标记

字典删除一个键（`del d[key]`）时，不能简单地把那个槽位设为空——如果设为空，就会"切断"探测链，让通过探测链放在后面槽位的条目再也找不到。

```
槽位: [0]    [1]    [2]    [3]
       K1     K2     K3     (空)

K1 哈希到槽 0，直接放入
K2 哈希到槽 0（冲突！）→ 探测到槽 1，槽 1 空 → 放入
K3 哈希到槽 1（冲突！）→ 探测到槽 2，槽 2 空 → 放入

现在删掉 K2，如果 [1] 变成"空"：
查 K3 → 哈希到槽 1 → 看到 [1] 是空 → 以为不存在！KeyError!
```

解决方案是引入 **DUMMY（墓碑）标记**：删除时不把槽位改成"空"，而是改成"已删除（DUMMY）"标记。查找时遇到 DUMMY 继续探测（不停下），插入时遇到 DUMMY 可以复用（覆盖）。

```python
# 槽位的三种状态
EMPTY = 0    # 从未使用过
DUMMY = 1    # 曾用过但已被删除（墓碑）
# 其他 = 有效条目

# 查找时：
#   EMPTY  → 确定不存在，停止探测
#   DUMMY  → 不确定，继续探测
#   条目   → 比较 key，匹配则命中，不匹配继续探测

# 插入时：
#   EMPTY  → 可以放入（新键）
#   DUMMY  → 可以放入（复用这个槽位）
#   条目   → 比较 key，相同则更新值，不同则继续探测
```

DUMMY 的存在意味着：删除不会释放槽位，字典只增不减。大量删除后 DUMMY 堆积过多会降低查找效率（探测链上遇到太多墓碑），CPython 的处理策略是在 resize 时一次性清理所有 DUMMY——扩容时不会把 DUMMY 条目拷贝到新表。

```python
# 模拟 DUMMY 标记的插入/删除/查找
class DictWithDummy:
    EMPTY = object()
    DUMMY = object()

    def __init__(self, size=8):
        self.size = size
        self.mask = size - 1
        self.table = [self.EMPTY] * size
        self.used = 0     # 有效条目数
        self.dummy = 0    # DUMMY 数量

    def _lookup(self, key):
        """查找 key，返回 (found_idx, is_found)"""
        h = hash(key)
        idx = h & self.mask
        perturb = h
        first_dummy = -1   # 记录第一个遇到的 DUMMY 位置，插入时可复用

        while self.table[idx] is not self.EMPTY:
            if self.table[idx] is self.DUMMY:
                if first_dummy == -1:
                    first_dummy = idx
            else:
                entry_hash, entry_key, _ = self.table[idx]
                if entry_hash == h and entry_key == key:
                    return (idx, True)   # 找到了
            perturb >>= 5
            idx = (idx * 5 + 1 + perturb) & self.mask

        # 没找到，返回第一个可用的空位或 DUMMY 位
        insert_idx = first_dummy if first_dummy != -1 else idx
        return (insert_idx, False)

    def __setitem__(self, key, value):
        h = hash(key)
        idx, found = self._lookup(key)
        if found:
            _, _, _ = self.table[idx]
            self.table[idx] = (h, key, value)    # 更新已有键
        else:
            if self.table[idx] is self.DUMMY:
                self.dummy -= 1
            self.table[idx] = (h, key, value)    # 新增键
            self.used += 1

    def __delitem__(self, key):
        idx, found = self._lookup(key)
        if not found:
            raise KeyError(key)
        self.table[idx] = self.DUMMY   # 打上墓碑标记，不释放槽位
        self.used -= 1
        self.dummy += 1

# 演示 DUMMY 行为
d = DictWithDummy(8)
d["a"] = 1
d["b"] = 2
del d["a"]              # "a" 的槽位变成 DUMMY
d["c"] = 3              # 可以复用 "a" 的 DUMMY 槽位
print(d["c"])           # 输出：3
# print(d["a"])         # KeyError: 'a' — 插入 "c" 时复用了 DUMMY 槽，但 "a" 确实已删除
```

### 2.9 从 Python 3.6 到 3.7：紧凑字典与有序性的实现

Python 3.6 引入了一个重大重构——**紧凑字典（compact dict）**，并在 3.7 正式确认"字典保留插入顺序"为语言特性。核心变化是把原来"一个稀疏大数组"拆成两个数组：

- **索引数组（indices）**：稀疏数组，存的是"条目数组的下标"。大小为 2 的幂，有 EMPTY/DUMMY 标记。
- **条目数组（entries）**：紧凑数组，按插入顺序追加。每个条目是 `(hash, key, value)`。

```
旧版字典（Python 3.5 及以前）：
  槽位 0: (hash, key, value)  ← 可能有很多空位
  槽位 1: (hash, key, value)
  槽位 2: EMPTY               ← 浪费空间
  槽位 3: (hash, key, value)
  ...

新版紧凑字典（Python 3.6+）：
  索引数组: [2, EMPTY, 0, 1, EMPTY, EMPTY, EMPTY, 3]   ← 存条目数组的下标
  条目数组: [(h,k,v), (h,k,v), (h,k,v), (h,k,v)]        ← 按插入顺序紧密排列
```

这个设计的精妙之处在于：

1. **内存更紧凑**：索引数组每个元素很小（1 字节或 2 字节），条目数组无空位。
2. **插入顺序天然被保留**：条目按插入顺序追加到条目数组末尾。遍历时直接按条目数组顺序输出，无需额外记录顺序。
3. **删除仍是逻辑删除**：删一个条目时，索引数组中对应位置标为 DUMMY（不回收），条目数组中的条目可以标记为空或用最后一个条目填充（具体策略视实现版本而定）。

```python
# 演示紧凑字典的"插入顺序被保留"特性
d = {}
d["z"] = 3
d["a"] = 1
d["m"] = 2
print(list(d.keys()))   # 输出：['z', 'a', 'm']   ← 按插入顺序

# 删除再重新插入会排到末尾
del d["a"]
d["a"] = 100
print(list(d.keys()))   # 输出：['z', 'm', 'a']   ← "a" 排到末尾

# 更新已有键的值不改变顺序（key 不变，entry 位置不变）
d["z"] = 999
print(list(d.keys()))   # 输出：['z', 'm', 'a']   ← 顺序未变
```

紧凑字典带来的有序性让 `dict` 在大多数场景下可以直接替代 `OrderedDict`。但两者并非完全等价——`OrderedDict` 独有的能力（如 `move_to_end`、相等性比较时考虑顺序）在普通 `dict` 中并不存在。如果只需要"记住写入顺序"，3.7+ 的普通 `dict` 就够了。

### 2.10 字符串哈希随机化与 PYTHONHASHSEED

从 Python 3.3 开始，字符串和字节的哈希值默认**每次进程启动时随机化**。这意味着同一段代码在不同进程运行时，`hash("hello")` 可能返回不同的值。这不是 bug，而是安全特性——防止**哈希冲突攻击（Hash DoS）**。

```python
# 同一进程内哈希稳定，不同进程可能不同
print(hash("hello"))   # 本次运行：6844735578768050408
print(hash("hello"))   # 本次运行：6844735578768050408（相同）
# 重启进程后再运行，结果可能不同
```

可以通过环境变量 `PYTHONHASHSEED` 手动固定随机种子（用于调试或需要确定性哈希的场景）：

```bash
# 命令行示例（非代码块，仅示意）：
# PYTHONHASHSEED=0 python -c "print(hash('hello'))"   # 固定种子 0
# PYTHONHASHSEED=42 python -c "print(hash('hello'))"  # 固定种子 42
# PYTHONHASHSEED=random python -c "print(hash('hello'))"  # 随机（默认行为）
```

```python
import os
import sys

# 检查是否开启了哈希随机化
print(sys.flags.hash_randomization)   # 输出：1（开启）或 0（关闭）

# 查看当前有效的随机种子
print(os.environ.get("PYTHONHASHSEED", "random（默认）"))
```

哈希随机化只影响 `str`、`bytes` 和 `datetime` 类型的哈希值。整数、浮点数、元组等的哈希算法不受影响——它们是确定的，因为其哈希基于值本身而非随机种子。

### 2.11 哈希冲突攻击：原理与防御

哈希冲突攻击（Hash DoS，即拒绝服务攻击）是哈希表在安全敏感场景下的一类经典威胁。攻击者构造大量"哈希相同或相近"的键，一次性插入字典，使字典的探测链变得极长、性能退化到 O(n)，从而耗尽目标服务器的 CPU。

```
正常字典：
  插入 10000 个随机键 → 10000 * O(1) ≈ 几毫秒

受攻击的字典（大量冲突键）：
  插入 10000 个精心构造的键 → O(n²) → 可能耗费数秒甚至数分钟
```

攻击原理基于哈希函数的可预测性。如果攻击者知道哈希算法，就可以离线计算出一组大量冲突的键，然后通过网络请求（如 HTTP 头、JSON 键、查询参数）提交给服务器——因为 Web 框架底层常用字典存储请求数据。

```python
# 演示：构造大量哈希冲突的键
# 以下是一种简化的"找冲突"思路（Python 3.3+ 已随机化，无法真正找到）

# 如果能找到 N 个哈希值相同的字符串：
# bad_keys = [k1, k2, k3, ..., kN]   # 全部 hash(k) 相等
# d = {}
# for k in bad_keys:
#     d[k] = 1   # 每次插入都要走超长探测链，插入 N 个键耗时 O(n²)
```

Python 3.3 引入的字符串哈希随机化正是为了解决这个问题——既然攻击者无法预测每次进程启动的随机种子，就无法预先计算冲突键。结合探测公式中的扰动因子（每次迭代都改变探测方向，而非简单线性步进），Python 字典对抗冲突攻击的能力很强。

```python
# 验证：即使哈希相同，字典仍能正确区分键（但性能退化）
class HashClash:
    """所有实例哈希相同但互不相等——最极端的冲突场景"""
    def __init__(self, name):
        self.name = name
    def __hash__(self):
        return 1   # 全部哈希为 1
    def __eq__(self, other):
        return self.name == other.name

import time

# 构造 1000 个哈希全为 1 的键
keys = [HashClash(f"key-{i}") for i in range(1000)]
d = {}

start = time.perf_counter()
for k in keys:
    d[k] = k.name
elapsed = time.perf_counter() - start
print(f"插入 1000 个极端冲突键耗时: {elapsed:.4f}s")
# 输出示例：0.0150s（远比正常场景慢，但函数仍正确）
# 正常场景下 1000 个不同哈希的键约需 0.0002s

# 验证正确性
print(d[keys[500]])   # 输出：key-500   ← 虽然慢，但结果正确
```

这种极端冲突在实际中几乎不会出现（正常键的哈希分布均匀），但理解它有助于理解"为什么平均 O(1) 说的是平均"——退化确实存在，只是 Python 的工程实践让它极不可能发生。

## 3. 最佳实践

### 3.1 键的选择：用内置不可变类型

内置的 `str`、`int`、`tuple` 等类型经过了高度优化的哈希算法，分布均匀、计算高效。除非有充分的理由，不要自创键类型。

```python
# ✅ 推荐：用内置不可变类型当键
users = {
    "alice@example.com": {"name": "Alice", "role": "admin"},
    1001: {"name": "Bob", "role": "user"},
    ("US", "CA"): {"tax_rate": 0.0725},
}

# ❌ 不推荐：用自定义对象当键（除非确实需要）
# 自定义对象的哈希计算和比较都可能更慢，且需要正确实现 __hash__ 和 __eq__
```

如果确实需要自定义类型作键，务必同时实现 `__hash__` 和 `__eq__`，并遵循"相等即同哈希"约束。实现 `__hash__` 时最好的做法是委托给 `hash(tuple(...))`：

```python
# ✅ 推荐：委托给内置类型的哈希
class GeoPoint:
    def __init__(self, lat, lon):
        self._lat = lat
        self._lon = lon

    # 定义为不可变（用 property 只读）
    @property
    def lat(self):
        return self._lat

    @property
    def lon(self):
        return self._lon

    def __eq__(self, other):
        if not isinstance(other, GeoPoint):
            return NotImplemented
        return self.lat == other.lat and self.lon == other.lon

    def __hash__(self):
        return hash((self.lat, self.lon))   # 委托给 tuple 的哈希
```

小心：`__hash__` 返回的值必须在对象生命周期内不变。如果 `__hash__` 依赖可变属性，就是 bug——存进字典后属性变化、哈希值变化、永远找不到。

### 3.2 预分配大小：减少 resize 开销

当你能预知字典大致会存多少条目时，在创建时传递预期大小可以减少（甚至消除）扩容次数。但注意：预分配的不是条目数，而是**槽位数**，它会被调整为 2 的幂。

```python
# ✅ 推荐：预知大小时预分配
# 要从数据库加载 ~10000 条记录
records = {}
# 如果没有预分配，插入过程中会经历多次 resize（8→16→32→...→16384），每次 resize 都要重新哈希全部已有条目

# 有预分配：一次到位
# records = dict.fromkeys(...) 没有直接指定容量的参数
# 但推导式等创建方式也没有这个参数
# Python 没有暴露 dict(capacity=N) 的公开 API
# 最佳实践：用 {} 或推导式创建即可，CPython 的扩容策略已经足够高效
```

老实说，CPython 没有暴露"指定初始容量"的公开 API。上面的"预分配"建议在实际中通常不需要——字典的自动扩容策略已经被调优到"在绝大多数场景下均摊代价可忽略"。只有当你用 profiling 确认"字典 resize 是性能瓶颈"时，才需要考虑绕道方案（如 CPython 内部 API `PyDict_NewPresized`，但不是可移植的公共 API）。

换句话说：**别过早优化**。字典的 resize 对 99.9% 的场景不是瓶颈。当你需要为一个 10 万元素的字典做微优化时，你用 `dict(zip(...))` 而非循环插入就已经足够。

### 3.3 避免用浮点数当键

浮点数作键在语法上合法，但极易因精度问题导致"觉得自己存了但取不到"的 bug：

```python
# ❌ 不推荐：浮点数作键
d = {}
d[0.1 + 0.2] = "result"
# print(d[0.3])   # KeyError: 0.3   ← 0.1 + 0.2 != 0.3 因为 IEEE 754 精度问题
print(0.1 + 0.2)  # 输出：0.30000000000000004   ← 不是 0.3！

# ✅ 推荐：用 Decimal("0.3") 或整数（如 0.3 × 100 = 30）代替
d2 = {}
from decimal import Decimal
d2[Decimal("0.1") + Decimal("0.2")] = "result"
print(d2[Decimal("0.3")])   # 输出：result
```

`Decimal` 的等价性判断比 `float` 可靠，因为它是精确十进制运算。但注意 `Decimal` 的哈希实现也有微妙之处（`Decimal(1) == Decimal('1.0')` 为 True，哈希相等），使用前确保理解。

### 3.4 不要依赖字典的"不缩容"特性

字典删除键后 sizeof 不会变小——这部分内存被保留备用。如果程序的生命周期中有一个阶段"创建大字典、大量删除、不再添加"，被删掉的内存不会被还给操作系统。

```python
import sys

d = {i: i for i in range(100000)}
size_before = sys.getsizeof(d)

# 大量删除
for i in range(100000):
    del d[i]
size_after = sys.getsizeof(d)

print(f"删除前: {size_before} bytes")    # 输出：删除前: 4194536 bytes（具体值视版本而定）
print(f"删除后: {size_after} bytes")     # 输出：删除后: 4194536 bytes   ← 没变！
```

应对：如果你的场景确实是"建一个大字典、用完就大部分删除、后续不再增长"，用完直接 `d = {}` 或 `del d` 释放整个对象，让 GC 回收。或者使用 `dict.clear()`——它会重置内部数组、确实释放内存。

```python
import sys

d = {i: i for i in range(100000)}
size_before = sys.getsizeof(d)
d.clear()
size_after = sys.getsizeof(d)

print(f"清空前: {size_before} bytes")     # 输出：4194536 bytes
print(f"清空后: {size_after} bytes")      # 输出：72 bytes   ← clear() 确实缩容
```

`clear()` 和逐个 `del` 的行为差异源于 CPython 实现：`clear()` 是一次性操作，直接重建内部数组；逐个 `del` 只是把槽位标为 DUMMY，不改变数组大小。

### 3.5 理解 **eq** 在哈希查找中的角色

哈希值只是定位的"起点"，最终键匹配靠的是 `__eq__`。当一个槽位的哈希值匹配、但 `__eq__` 判定不等时，探测继续。这意味着：

```python
# 哈希相同但 __eq__ 不等的键，可以合法共存（虽然查找变慢）
class MultiKey:
    def __init__(self, id_):
        self.id = id_
    def __hash__(self):
        return 1       # 所有实例哈希相同
    def __eq__(self, other):
        return self.id == other.id

d = {MultiKey(1): "a", MultiKey(2): "b", MultiKey(3): "c"}
print(len(d))          # 输出：3  ← 三个键都能存，因为 __eq__ 区分了它们
print(d[MultiKey(2)])  # 输出：b   ← 但查找会遍历冲突链
```

设计自定义键类型时，让哈希分布均匀远比让 **eq** 逻辑精巧更重要——因为哈希冲突意味着每次查找都要比 **eq**，而哈希均匀意味着极少需要比 **eq**。

## 4. 原理

### 4.1 CPython 字典源码结构概览

CPython 中字典的实现主要在 `Objects/dictobject.c` 中。核心数据结构是两层的：

- **`PyDictObject`**：字典对象本身，持有指向键对象的指针、条目数组、元信息。
- **`PyDictKeysObject`**：持有索引数组（`dk_indices`）和元数据（条目数、可用槽位、版本号）。

```
PyDictObject
├── PyDictKeysObject *ma_keys    ← 索引数组 + 元数据
│   ├── dk_refcnt                ← 引用计数（视图对象引用此结构）
│   ├── dk_size                  ← 哈希表大小（2 的幂）
│   ├── dk_usable                ← 还可容纳的条目数
│   ├── dk_nentries              ← 当前条目数
│   ├── dk_indices               ← 索引数组（int8 / int16 / int32 / int64 之一）
└── PyObject **ma_values         ← 值数组指针（仅 split table 时非空，普通字典为 NULL）
```

```python
# 用 Python 代码模拟 CPython 的字典内部结构（简化版）
from collections import namedtuple

DictEntry = namedtuple('DictEntry', ['hash_val', 'key', 'value'])

class SimDict:
    def __init__(self):
        self._indices = [-1] * 8      # 索引数组，-1 表示空，-2 表示 DUMMY
        self._entries = []             # 条目数组，按插入顺序排列
        self._mask = 7                # len(self._indices) - 1

    def _lookup_index(self, key):
        """在索引数组中查找 key 对应的条目下标"""
        h = hash(key)
        idx = h & self._mask
        perturb = h
        while self._indices[idx] != -1:   # -1 是 EMPTY
            entry_idx = self._indices[idx]
            if entry_idx != -2:           # -2 是 DUMMY，跳过
                entry = self._entries[entry_idx]
                if entry.hash_val == h and entry.key == key:
                    return entry_idx       # 找到了，返回条目数组的下标
            perturb >>= 5
            idx = (idx * 5 + 1 + perturb) & self._mask
        return -1   # 未找到
```

**Split Table（分离表）**是另一个优化：当字典的所有键都是字符串且字典作为对象的 `__dict__` 使用时，键被共享给多个实例（因为同类的实例属性名相同），只有值是独立的。此时 `ma_values` 指针指向独立的值数组，同一个 `PyDictKeysObject` 被多个字典共享。这大幅减少了同类型大量实例的内存占用。

### 4.2 哈希函数实现详解

不同类型的 `hash()` 实现分布在 CPython 源码的各类型定义中：

- **`int`**：对于小整数（`-2^61` 到 `2^61-1` 范围，实际取决于平台），哈希值就是整数本身（`-1` 映射为 `-2`）。超出范围的取模截断。
- **`float`**：基于 IEEE 754 双精度二进制的位模式计算。`hash(nan) == 0`，`hash(0.0) == hash(-0.0)`。
- **`str/bytes`**：使用 SipHash 算法（Python 3.4+），结合 `PYTHONHASHSEED` 随机种子。SipHash 是一种快速的伪随机函数（PRF），设计目标就是抗碰撞——攻击者即使知道算法也难以构造冲突键。
- **`tuple`**：基于元素的哈希值进行混合计算，混合公式大致为 `h = (h * mult) ^ hash(elem)`，其中 `mult` 是一个大素数。这使得不同排列的元组产生极不相同的哈希。
- **`frozenset`**：基于元素的哈希值 XOR 组合，因为集合无序，XOR 具有交换性。

```python
# 各类型哈希值的分布测试（看均匀性）
import statistics

def hash_distribution(keys, num_buckets=16):
    """统计一组键在给定桶数下的分布"""
    buckets = [0] * num_buckets
    for k in keys:
        buckets[hash(k) & (num_buckets - 1)] += 1
    return buckets

# 随机字符串的分布接近均匀
import string, random
random_keys = [''.join(random.choices(string.ascii_letters, k=8)) for _ in range(10000)]
dist = hash_distribution(random_keys, 16)
print(f"各桶分布: {dist}")
print(f"均值: {statistics.mean(dist):.0f}, 标准差: {statistics.stdev(dist):.1f}")
# 标准差越小说明分布越均匀
```

### 4.3 插入的完整流程

字典插入 `d[key] = value` 的完整流程（CPython 层面）：

1. **计算哈希**：`h = hash(key)`
2. **定位索引槽位**：`idx = h & mask`
3. **探测**：循环执行——
   - 若槽位为 EMPTY：找到空位，跳步骤 4。
   - 若槽位为 DUMMY：记录为候选（但不是确定位置，继续探测）。
   - 若槽位存有条目下标 → 去条目数组取出条目 → 比较 `entry.hash == h and entry.key == key`：
     - 相同：这是更新操作，修改 `entry.value`，返回。
     - 不同：继续探测。
4. **插入**：
   - 若槽位为 DUMMY：复用，减少 `dk_usable` 不变（不是真正的新占用）。
   - 若槽位为 EMPTY：`dk_usable -= 1`。
   - 在条目数组末尾追加新条目，记录其下标到索引槽位。
   - 若 `dk_usable == 0`：触发 resize。

```python
# 模拟完整插入流程
def dict_insert(d, key, value):
    h = hash(key)
    idx = h & d.mask
    perturb = h
    first_dummy_idx = None

    while True:
        slot = d.indices[idx]
        if slot == -1:   # EMPTY
            insert_at = first_dummy_idx if first_dummy_idx is not None else idx
            break
        if slot == -2:   # DUMMY
            if first_dummy_idx is None:
                first_dummy_idx = idx
        else:
            entry = d.entries[slot]
            if entry.hash == h and entry.key == key:
                # 更新已有键
                d.entries[slot] = (h, key, value)
                return
        perturb >>= 5
        idx = (idx * 5 + 1 + perturb) & d.mask

    # 新增键
    entry_idx = len(d.entries)
    d.entries.append((h, key, value))
    d.indices[insert_at] = entry_idx
    d.usable -= 1

    if d.usable <= 0:
        dict_resize(d)   # 触发扩容
```

### 4.4 查找的完整流程

查找 `v = d[key]` 与插入的前半段几乎一致：

1. 计算哈希 → 定位索引槽位 → 探测。
2. 遇到 EMPTY：确定键不存在，抛 `KeyError`。
3. 遇到 DUMMY：继续探测（不能断定不存在）。
4. 遇到条目 → 先比 `hash`，相等再比 `key ==`。

```python
def dict_lookup(d, key):
    h = hash(key)
    idx = h & d.mask
    perturb = h

    while True:
        slot = d.indices[idx]
        if slot == -1:   # EMPTY
            raise KeyError(key)   # 确定不存在
        if slot == -2:   # DUMMY
            pass          # 不能确定，继续
        else:
            entry = d.entries[slot]
            if entry.hash == h and entry.key == key:
                return entry.value   # 命中！
        perturb >>= 5
        idx = (idx * 5 + 1 + perturb) & d.mask
```

`get()` 的实现与此完全相同，只是"键不存在"时返回 default 而不是抛异常。`in` 同理，只是返回 bool 而非值。

### 4.5 删除的完整流程与 DUMMY 堆积

删除 `del d[key]` 的流程：

1. 执行与查找完全相同的探测过程。
2. 找到键 → 把索引数组中对应该键的槽位标记为 DUMMY（`-2`）。
3. 条目数组中该条目标记为"空"（或把最后一个条目移到该位置以保持紧凑——CPython 3.6+ 的做法）。
4. `dk_nentries -= 1`。

```python
def dict_delete(d, key):
    h = hash(key)
    idx = h & d.mask
    perturb = h

    while True:
        slot = d.indices[idx]
        if slot == -1:
            raise KeyError(key)
        if slot == -2:
            pass
        else:
            entry = d.entries[slot]
            if entry.hash == h and entry.key == key:
                # 找到！执行删除
                d.indices[idx] = -2   # DUMMY
                d.entries[slot] = None  # 条目清空（实际实现可能用最后条目填补）
                d.nentries -= 1
                return
        perturb >>= 5
        idx = (idx * 5 + 1 + perturb) & d.mask
```

DUMMY 堆积问题：大量删除后索引数组中会积攒大量 `-2`。查找时遇到 DUMMY 要跳过（不能停），导致探测链变长。CPython 的应对：**resize 时不拷贝 DUMMY 槽位**——新表的索引数组中只有有效的条目索引，所有 DUMMY 被彻底清除。这也解释了为什么字典"只会在插入时 resize，不会在删除时 resize"：deletion 不会触发缩容，但下次插入触发扩容时顺手清掉所有 DUMMY。

### 4.6 Resize 的决策：USABLE_FRACTION 与增长策略

Resize 由两个因素触发：

1. **条目数达到阈值**：`dk_usable` 从 `dk_size * 2/3` 开始递减，到 0 时 resize。
2. **DUMMY 过多**（3.6+ 新增）：如果 DUMMY 槽位多到影响查找效率（具体阈值是当条目数小于 `dk_size / 2` 且有大量 DUMMY 时），即使未达条目阈值也会触发 resize——让新表把 DUMMY 清掉。

增长策略不是简单的 "×2"：

```
原大小 < 50000：新大小 = used * 2（条目数的 2 倍后取 2 的幂）
原大小 >= 50000：新大小 = used * 2（同上，但增长速度放缓）
```

注意新大小是**条目数的 2 倍，再向上取 2 的幂**，而非原大小的 2 倍。例如：

```python
# 模拟扩容大小计算
def next_dict_size(current_used):
    """根据当前条目数计算扩容后的索引数组大小"""
    if current_used == 0:
        return 8    # 最小字典大小
    new_estimate = current_used * 2
    # 向上取 2 的幂
    size = 8
    while size < new_estimate:
        size <<= 1   # size *= 2
    return size

# 示例
print(next_dict_size(5))    # 输出：16   ← 5*2=10，向上取 2 的幂是 16
print(next_dict_size(6))    # 输出：16   ← 6*2=12，向上取 2 的幂是 16
print(next_dict_size(100))  # 输出：256  ← 100*2=200，向上取 2 的幂是 256
```

### 4.7 紧凑字典的内存布局与内存节省

紧凑字典（3.6+）相比旧版字典的最大变化是"索引数组"与"条目数组"分离。旧版字典一个大数组中每个槽位存完整的 `(hash, key, value)`，大量空槽位浪费空间；新版的索引数组只存整数下标，条目数组紧密排列无空位。

更精细的优化：索引数组的元素类型根据字典大小动态选择：

- 条目数 < 2^8：索引元素为 `int8_t`（1 字节）
- 条目数 < 2^16：索引元素为 `int16_t`（2 字节）
- 条目数 < 2^32：索引元素为 `int32_t`（4 字节）
- 否则：`int64_t`（8 字节）

```python
# 不同大小字典的索引数组元素尺寸示意
d_small = {i: i for i in range(100)}
d_medium = {i: i for i in range(10000)}
d_large = {i: i for i in range(1000000)}

import sys
print(f"100 条: {sys.getsizeof(d_small)} bytes")      # 输出：约 4.7 KB
print(f"10000 条: {sys.getsizeof(d_medium)} bytes")   # 输出：约 392 KB
print(f"1000000 条: {sys.getsizeof(d_large)} bytes")  # 输出：约 40 MB
# 注意：getsizeof 只算字典结构本身，不算键和值对象的内存
```

另一个内存优化是**共享键（shared keys）**：当字典用于存储对象属性（`obj.__dict__`）时，如果多个实例属于同一个类，它们的键集合相同（都是类的属性名），CPython 会让它们共享同一个 `PyDictKeysObject`（索引数组 + 键），只给每个实例独立的 `ma_values` 数组。这在面向对象编程中大量存在时节省显著内存。

```python
# 共享键的触发条件（CPython 自动判断，无需用户干预）
class User:
    __slots__ = ()   # 不用 __slots__ 才能用共享键
    def __init__(self, name, age, city):
        self.name = name
        self.age = age
        self.city = city

# 10000 个 User 实例：共享同一套键索引（name, age, city），只各自存值
users = [User(f"user-{i}", i, "Beijing") for i in range(10000)]
# 内存节省 = 10000 * (3 个键对象的引用) ≈ 240KB（在 64 位系统上）
```

## 5. 总结

### 5.1 哈希表核心概念速查

```
概念模型：
  hash(key) → mask → slot_idx → 探测链 → 命中或未命中

核心组件：
  - 哈希函数      hash(key) — 不同类型的实现不同，必须稳定且均匀
  - 索引数组      稀疏数组，存条目数组下标或 EMPTY/DUMMY
  - 条目数组      紧凑数组，(hash, key, value) 三元组，按插入顺序
  - 位掩码        table_size - 1，用 & 代替 % 加速槽位映射
  - 扰动因子      perturb，每次右移 5 位混合高位信息

关键参数：
  - 初始大小      8
  - 负载因子      约 2/3（usable = size * 2/3 取 floor）
  - 扩容触发      usable 减到 0 或 DUMMY 过多
  - 新大小        used * 2 向上取 2 的幂
  - 缩容          不自动缩容（clear() 除外）

三种槽位状态：
  - EMPTY (-1)    从未使用，确定不存在，停止探测
  - DUMMY (-2)    已删除，不确定，继续探测
  - 条目下标        指向 entries[n]，先比 hash 再比 ==

有序性（3.7+）：
  条目按插入顺序追加到 entries 末尾，遍历时按 entries 顺序输出

安全特性：
  - 字符串哈希随机化（PYTHONHASHSEED），每次进程启动不同
  - SipHash 算法抗碰撞
  - 扰动公式让探测路径不可预测
```

### 5.2 核心要点回顾

- 字典 O(1) 的性能根基是哈希表：用键的哈希值计算出存储位置，跳过线性查找。
- 键必须可哈希（hashable），哈希值在其生命周期内不变，且 `a == b ⇒ hash(a) == hash(b)`。
- 哈希冲突由开放寻址处理：冲突时按扰动公式跳到下一候选槽位，直到找到空位或匹配键。
- 条目缓存哈希值（hash-key-value 三元组），查找时先比 hash 再比 `==`，大幅减少昂贵比较。
- Python 3.6+ 的紧凑字典将索引数组与条目数组分离，带来内存节省和天然插入顺序保留。
- 字典只扩容不缩容（`clear()` 除外），删除标记 DUMMY 不回收——resize 时统一清理。
- 字符串哈希随机化（3.3+）和 SipHash 算法共同防御哈希冲突攻击。
- 负载因子约 2/3 时触发 resize，均摊每次插入仍为 O(1)。
- 自定义对象作键必须同时正确实现 `__hash__` 和 `__eq__`，保证相等→同哈希。
- 浮点数、含可变元素的元组、只有 `__eq__` 没 `__hash__` 的对象不能当键。

### 5.3 读完应能掌握

- 能画出哈希表的结构框图（索引数组 + 条目数组），解释每个组件的作用。
- 能解释为什么字典查找是平均 O(1)，以及在什么条件下会退化。
- 能说出哈希冲突的解决策略（开放寻址 + 扰动公式），与链地址法做对比。
- 能说明 DUMMY 标记的必要性——为什么删除不能直接清空槽位。
- 能解释 Python 3.6+ 紧凑字典的设计如何同时实现"有序"和"省内存"。
- 能理解 `PYTHONHASHSEED` 的作用及哈希冲突攻击的原理与防御。
- 能说出负载因子的概念、CPython 的扩容阈值（~2/3）及触发条件。
- 能在面试中正确回答"字典底层是如何实现的"及其变体问题。

### 5.4 常见面试问题

**问题一：Python 字典为什么这么快？底层是怎么实现的？**

字典底层是哈希表。核心流程：`hash(key)` 计算哈希值 → 位掩码映射到索引数组槽位 → 条目数组定位 → 比较 `hash` 和 `==`。查找是 O(1) 因为整个过程不依赖元素数量——不管字典多大，都是一次哈希 + 一两次比较。CPython 3.6+ 采用紧凑字典设计（索引数组 + 条目数组分两），索引数组节省内存，条目数组按插入顺序排列从而实现有序遍历。

**问题二：哈希冲突是什么？Python 怎么处理？**

两个不同键算出相同哈希值或映射到相同槽位叫哈希冲突。Python 用**开放寻址**处理：冲突时按扰动公式 `(idx * 5 + 1 + perturb) & mask` 跳转到下一个候选槽位，直到找到空位或匹配键。扰动变量 `perturb` 不断右移 5 位，让高位信息逐步混合进探测路径，避免简单线性探测的主聚类问题。

**问题三：为什么字典的键必须是不可变的？**

因为字典用 `hash(key)` 定位——如果键可变，哈希值会在字典不知情的情况下改变，导致之前存入的条目的存储位置与新的哈希值不匹配，再也找不到。Python 从语言层面禁止可变类型实现 `__hash__`——`list.__hash__` 是 `None`，调用就抛 `TypeError`。

**问题四：字典删除键后，为什么 sizeof 不变？clear() 为什么能变小？**

`del d[key]` 把索引数组中的对应槽位标为 DUMMY 而非 EMPTY（否则会切断探测链影响其他条目的查找），内存不释放。多次删除后 DUMMY 堆积，只在下次 resize 时集中清理。`d.clear()` 是直接销毁并重建内部数组，所以内存立即释放（回到初始的 72 bytes 左右）。

**问题五：Python 3.7 的字典为什么能保留插入顺序？**

紧凑字典设计中，条目数组（entries）按插入顺序追加。遍历字典时，按条目数组的顺序输出，天然反映插入顺序。这不是"额外记录的"，而是数据结构本身的副产品。这也是为什么紧凑字典比旧版字典更省内存——条目数组紧密排列、没有空位。

**问题六：什么是哈希冲突攻击？Python 如何防御？**

攻击者构造大量哈希相同或相近的键提交给服务器（如通过 HTTP 头、JSON 键），使字典插入退化为 O(n²)，耗尽 CPU。Python 从 3.3 起默认启用字符串哈希随机化（`PYTHONHASHSEED`），每次进程启动随机生成种子，攻击者无法预知具体哈希值从而无法构造冲突键。3.4+ 改用 SipHash 算法，进一步增强抗碰撞性。

### 5.5 实战串讲：用 Python 从零实现一个迷你哈希表

把本篇涉及的核心概念——哈希、探测、DUMMY、resize——串成一个可运行的简易实现。这个实现有意保持简洁，不追求与 CPython 1:1 对应，但所有核心机制都在：

```python
import sys


class MiniDict:
    """从零实现的迷你哈希表，展示核心机制"""
    EMPTY = -1
    DUMMY = -2

    def __init__(self):
        self.indices = [self.EMPTY] * 8   # 索引数组
        self.entries = []                  # 条目数组：(hash, key, value)
        self.mask = 7
        self.used = 0
        self.usable = 8 * 2 // 3           # 约等于 5

    def _probe(self, key_hash):
        """给定哈希值，返回 (槽位下标, 条目下标或-1表示未找到, 是否找到)"""
        idx = key_hash & self.mask
        perturb = key_hash
        first_dummy = -1

        while self.indices[idx] != self.EMPTY:
            slot = self.indices[idx]
            if slot == self.DUMMY:
                if first_dummy == -1:
                    first_dummy = idx
            else:
                entry_hash, entry_key, _ = self.entries[slot]
                if entry_hash == key_hash and entry_key is not self.DUMMY:
                    return (idx, slot, True)   # 已存在
            perturb >>= 5
            idx = (idx * 5 + 1 + perturb) & self.mask

        if first_dummy != -1:
            return (first_dummy, -1, False)
        return (idx, -1, False)

    def _resize(self):
        """扩容并重新哈希所有有效条目"""
        new_size = max(8, self.used * 2)
        # 向上取 2 的幂
        sz = 8
        while sz < new_size:
            sz <<= 1

        old_entries = [(h, k, v) for h, k, v in self.entries
                       if k is not None]

        self.indices = [self.EMPTY] * sz
        self.mask = sz - 1
        self.entries = []
        self.used = 0
        self.usable = sz * 2 // 3

        for h, k, v in old_entries:
            self._insert(h, k, v)

    def _insert(self, key_hash, key, value):
        """内部插入（不做 resize 判断）"""
        idx, _, found = self._probe(key_hash)
        if found:
            # 更新（不会走到这里，因为 _resize 前已处理过）
            pass
        else:
            entry_idx = len(self.entries)
            self.entries.append((key_hash, key, value))
            self.indices[idx] = entry_idx
            self.used += 1
            self.usable -= 1

    def __setitem__(self, key, value):
        h = hash(key)
        idx, slot, found = self._probe(h)

        if found:
            self.entries[slot] = (h, key, value)
            return

        if self.usable <= 0:
            self._resize()
            # resize 后重新定位
            idx, _, _ = self._probe(h)

        entry_idx = len(self.entries)
        self.entries.append((h, key, value))
        self.indices[idx] = entry_idx
        self.used += 1
        self.usable -= 1

    def __getitem__(self, key):
        h = hash(key)
        _, slot, found = self._probe(h)
        if not found:
            raise KeyError(key)
        return self.entries[slot][2]

    def __delitem__(self, key):
        h = hash(key)
        idx, slot, found = self._probe(h)
        if not found:
            raise KeyError(key)
        self.indices[idx] = self.DUMMY
        self.entries[slot] = (0, None, None)   # 标记为空
        self.used -= 1

    def __contains__(self, key):
        h = hash(key)
        _, _, found = self._probe(h)
        return found

    def __len__(self):
        return self.used

    def keys(self):
        return [k for _, k, _ in self.entries if k is not None]

    def __repr__(self):
        items = ", ".join(f"{k!r}: {v!r}"
                          for _, k, v in self.entries if k is not None)
        return "{" + items + "}"


# 验证核心功能
md = MiniDict()
md["a"] = 1
md["b"] = 2
md["c"] = 3
print(md)                     # 输出：{'a': 1, 'b': 2, 'c': 3}
print(md["b"])                # 输出：2
print("c" in md)              # 输出：True
print("z" in md)              # 输出：False

# 验证删除
del md["b"]
print(md)                     # 输出：{'a': 1, 'c': 3}
# print(md["b"])              # KeyError

# 验证删除后仍能插入（DUMMY 复用）
md["d"] = 4
print(md)                     # 输出：{'a': 1, 'd': 4, 'c': 3} ← "d" 复用了 "b" 的 DUMMY 槽

# 验证插入顺序保留（条目按插入顺序排在 entries 中）
print(md.keys())              # 输出：['a', 'c', 'd']   ← "c" 在 "d" 前面（删除 "b" 后此处行为取决于实现）
```

这个实现大约 100 行，涵盖了哈希表的全部核心机制。把它和 CPython 的 `Objects/dictobject.c`（约 5000 行）放到一起看，就能理解那 5000 行在做什么——大部分是在处理边界条件、类型特化、内存优化、线程安全、GC 集成等工程细节。核心思想，不过就是上面这 100 行。

### 5.6 延伸

本篇把哈希表从概念到实现完整拆了一遍：

- **为什么 `zip(d.keys(), d.values())` 安全？** 因为 3.7+ 插入顺序确定 → `keys()` 和 `values()` 的迭代顺序严格对应。
- **为什么 `OrderedDict` 还有用？** 虽然普通 `dict` 有序，但 `OrderedDict` 提供 `move_to_end`、等值比较时考虑顺序等附加能力，且它用双向链表实现（而非紧凑字典的条目数组），在"频繁重排"场景更高效。
- **为什么集合（set）也要求元素可哈希？** 因为 `set` 底层同样用哈希表——它本质上是一个"只有键没有值"的字典。集合的哈希冲突策略、resize、DUMMY 标记与字典同源。
- **`frozenset` 为什么可哈希？** 因为它的内容不可变，哈希值基于元素 XOR 组合，与元素顺序无关。
