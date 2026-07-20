---
group:
  title: 【07】字典深度剖析
  order: 7
order: 5
title: OrderedDict有序字典
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 OrderedDict

`OrderedDict` 是 Python 标准库 `collections` 模块提供的一个字典子类，它能**记住键的插入顺序**。从表面上看，它和普通 `dict` 几乎一样——存取、遍历、增删都遵循字典的 API。但它额外提供了几个普通 `dict` 不具备的能力：按插入顺序比较相等性、把任意键移到最前或最后、从两端弹出键值对。

```python
from collections import OrderedDict

od = OrderedDict()
od["c"] = 1
od["a"] = 2
od["b"] = 3

# 遍历严格按插入顺序
for k in od:
    print(k, end=" ")   # 输出：c a b
print()

# 普通 dict（Python 3.7+）也保持插入顺序，但 OrderedDict 提供更多
d = {"c": 1, "a": 2, "b": 3}
for k in d:
    print(k, end=" ")   # 输出：c a b（看起来一样）
```

看到这里你可能会问：既然 Python 3.7 起普通 `dict` 也保证插入顺序，`OrderedDict` 还有什么用？这个问题正是本篇要回答的核心。简单来说：**普通 dict 只"记住"顺序，OrderedDict 能"操作"顺序**——它把顺序提升为字典的一等语义，可以在创建后重新排列键、按顺序比较相等性、从两端高效弹出。

### 1.2 为什么需要 OrderedDict

在 Python 3.6 之前，普通 `dict` **不保证**插入顺序——遍历顺序是任意的，依赖于哈希表的内部布局。如果你需要"先插入的键先遍历"，就只能用 `OrderedDict`。Python 3.6 的 CPython 实现作为细节保留了插入顺序，Python 3.7 起这条行为正式成为语言规范——**所有** Python 实现的 `dict` 都保证插入顺序。

既然 `dict` 现在也保序了，`OrderedDict` 的必要性就从"保序"转移到了"可重排"和"顺序敏感的相等性比较"上。对比同一组数据用两种字典，核心差异总结如下：

| 特性              | `dict`（3.7+）           | `OrderedDict`            |
| ----------------- | ------------------------ | ------------------------ |
| 记住插入顺序      | ✅                       | ✅                       |
| 按顺序比较相等    | ❌（顺序不同仍可 ==）    | ✅（顺序不同则 !=）      |
| 把键移到最前/最后 | ❌                       | ✅ `move_to_end`         |
| 从头部弹出键值对  | ❌                       | ✅ `popitem(last=False)` |
| 反向迭代          | ✅ `reversed(d)`（3.8+） | ✅ `reversed(od)`        |
| 内存开销          | 较小                     | 较大（额外双向链表）     |
| `__eq__` 语义     | 只比内容                 | 比内容 + 顺序            |

```python
# 核心差异：相等性比较
d1 = {"a": 1, "b": 2}
d2 = {"b": 2, "a": 1}
print(d1 == d2)   # 输出：True   ← 普通 dict：内容相同就相等，不顺序

from collections import OrderedDict
od1 = OrderedDict([("a", 1), ("b", 2)])
od2 = OrderedDict([("b", 2), ("a", 1)])
print(od1 == od2)  # 输出：False  ← OrderedDict：内容和顺序都必须一致
```

所以今天 `OrderedDict` 的使用场景已经很精确定位了：当"插入顺序"不仅是被动记录的，而是业务语义的一部分——比如 JSON 配置文件希望解析后保留原始字段顺序、LRU 缓存需要把最近使用的条目移到末尾、或者两个字典需要按顺序比较——这时候用它。如果只是想要"遍历顺序和插入顺序一致"，普通 `dict` 就够。

### 1.3 关键概念：双向链表 + 字典

理解 `OrderedDict` 内部原理的关键在于它的实现结构：**一个普通字典 + 一个双向链表**。字典负责 O(1) 的键值存取（和普通 dict 一样），双向链表负责记住键的先后顺序。链表上每个节点存的是键的引用（不是值，值还是存在字典里），插入时链到尾部，删除时从链上摘除。

```
插入 "c" → 1：
dict: {"c": 1}          链表: [c]
插入 "a" → 2：
dict: {"c": 1, "a": 2}  链表: [c] ↔ [a]
插入 "b" → 3：
dict: {"c": 1, "a": 2, "b": 3}  链表: [c] ↔ [a] ↔ [b]
```

这个双结构设计解释了 `OrderedDict` 两个关键行为：①遍历按链表走，所以永远是插入顺序（即使在中间删过键）；②内存占用比普通 `dict` 大（多了链表节点）。普通 `dict` 的保序靠的是哈希表条目数组本身的有序性——它不需要额外链表，但也不支持任意重排（没法把某个条目"移到最前"而不动其它条目）。

理解了这个双结构，后面所有高级操作——`move_to_end`（链表操作 O(1)）、`popitem(last=False)`（从链表头部摘除 O(1)）——就一目了然了。

## 2. 核心内容

### 2.1 创建 OrderedDict

`OrderedDict` 的创建方式比普通 `dict` 更多样，但都围绕"在创建时指定初始顺序"这个目的。

```python
from collections import OrderedDict

# 方式一：空 OrderedDict，后续逐个插入
od1 = OrderedDict()
od1["first"] = 1
od1["second"] = 2

# 方式二：从键值对列表创建（最常用，显式控制顺序）
od2 = OrderedDict([("c", 3), ("a", 1), ("b", 2)])
print(list(od2.keys()))  # 输出：['c', 'a', 'b']  ← 严格按列表顺序

# 方式三：从另一个映射创建（顺序 = 源映射的迭代顺序）
od3 = OrderedDict({"z": 26, "a": 1, "m": 13})
print(list(od3.keys()))  # 输出：['z', 'a', 'm']  ← 按普通 dict 的插入顺序

# 方式四：关键字参数（注意：关键字参数的顺序在 Python 3.7+ 才有保证）
od4 = OrderedDict(x=10, y=20, z=30)
print(list(od4.keys()))  # 输出：['x', 'y', 'z']

# 方式五：从可迭代的键值对直接传
od5 = OrderedDict((k, k.upper()) for k in "abc")
print(list(od5.items()))  # 输出：[('a', 'A'), ('b', 'B'), ('c', 'C')]
```

有一个容易踩坑的细节：`OrderedDict` 构造时接收关键字参数，但**关键字参数的顺序依赖 Python 版本**（3.6 为 CPython 实现细节，3.7+ 才保证）。如果你的代码需要跑在较老 Python 上或要绝对确保顺序，用键值对列表是最稳妥的方式——顺序完全由你控制，不依赖任何语言版本细节。

### 2.2 基础操作：存取删遍历

`OrderedDict` 作为 `dict` 子类，所有普通字典操作行为一致，只是多了"保序"的前提：

```python
from collections import OrderedDict

od = OrderedDict([("a", 1), ("b", 2), ("c", 3)])

# 取值
print(od["a"])          # 输出：1
print(od.get("z", 0))   # 输出：0  ← 缺失返回默认值

# 赋值（覆盖已有键：值更新但位置不变；新键：追加到末尾）
od["b"] = 20            # 更新已有键，顺序不变
od["d"] = 4             # 新键，追加到末尾
print(list(od.items())) # 输出：[('a', 1), ('b', 20), ('c', 3), ('d', 4)]

# 删除
del od["b"]             # 删除后，后续遍历跳过它，其余顺序不变
print(list(od.items())) # 输出：[('a', 1), ('c', 3), ('d', 4)]

# 再插入被删的键——追加到末尾
od["b"] = 99
print(list(od.items())) # 输出：[('a', 1), ('c', 3), ('d', 4), ('b', 99)]  ← b 到了末尾
```

**关键行为**：覆盖已有键时，键的**位置不变**——这和直觉一致，因为"覆盖"不等于"重新插入"。只有**删除再重新插入**才会让键移到末尾。理解这点对后面 `move_to_end` 的用途很重要：如果你想在更新值的同时把它移到末尾（典型 LRU 行为），需要手工"删了再插"或组合 `move_to_end` 和赋值。

遍历相关的方法全部保持插入顺序：

```python
od = OrderedDict([("a", 1), ("b", 2), ("c", 3)])

print(list(od.keys()))      # 输出：['a', 'b', 'c']
print(list(od.values()))    # 输出：[1, 2, 3]
print(list(od.items()))     # 输出：[('a', 1), ('b', 2), ('c', 3)]

# 反向迭代（Python 3.8+ 普通 dict 也支持）
for k in reversed(od):
    print(k, end=" ")       # 输出：c b a
```

### 2.3 move_to_end：把键移到两端

`move_to_end(key, last=True)` 是 `OrderedDict` 最具标志性的方法——也是普通 `dict` 不具备的核心能力。它把指定键移到最末尾（`last=True`，默认）或最开头（`last=False`）。

```python
from collections import OrderedDict

od = OrderedDict([("a", 1), ("b", 2), ("c", 3), ("d", 4)])
print(list(od.keys()))  # 输出：['a', 'b', 'c', 'd']

# 把 "b" 移到末尾
od.move_to_end("b")
print(list(od.keys()))  # 输出：['a', 'c', 'd', 'b']

# 把 "d" 移到开头
od.move_to_end("d", last=False)
print(list(od.keys()))  # 输出：['d', 'a', 'c', 'b']
```

`move_to_end` 的时间复杂度是 O(1)——它只是操作双向链表（从当前位置摘除节点，插到头部或尾部），不动哈希表本身。如果键不存在，抛出 `KeyError`。

这个方法最常见的用途是实现 **LRU（Least Recently Used）缓存**：每次访问一个键就把它移到末尾，这样最久未使用的键始终在开头，淘汰时从开头弹出即可（见 2.7 节实战）。

### 2.4 popitem：从两端弹出

`popitem(last=True)` 弹出并返回一个键值对，默认从末尾弹出（LIFO），传 `last=False` 则从开头弹出（FIFO）。这也是普通 `dict` 不具备的能力——普通 `dict` 的 `popitem()` 只能从末尾弹出（3.7+ 是 LIFO）。

```python
from collections import OrderedDict

od = OrderedDict([("a", 1), ("b", 2), ("c", 3)])

# 从末尾弹出（默认，类似栈）
kv = od.popitem()           # 等价于 od.popitem(last=True)
print(kv)                   # 输出：('c', 3)
print(list(od.keys()))      # 输出：['a', 'b']

# 从开头弹出（FIFO，类似队列）
kv = od.popitem(last=False)
print(kv)                   # 输出：('a', 1)
print(list(od.keys()))      # 输出：['b']
```

当字典为空时调用 `popitem()` 会抛 `KeyError`。`popitem(last=False)` 是 O(1) 的——直接从双向链表头部摘除节点，然后去字典里删对应条目。

这两个操作——`move_to_end` 和 `popitem(last=False)`——合在一起就构成了 LRU 缓存的基础原语："访问 → `move_to_end`；淘汰 → `popitem(last=False)`"。

### 2.5 顺序敏感的相等性比较

这是 `OrderedDict` 和普通 `dict` 最重要的语义差异。`OrderedDict.__eq__` 不仅比较键值对的内容，还比较它们的**顺序**。内容相同但顺序不同，结果就是不相等。

```python
from collections import OrderedDict

od1 = OrderedDict([("a", 1), ("b", 2)])
od2 = OrderedDict([("b", 2), ("a", 1)])
od3 = OrderedDict([("a", 1), ("b", 2)])

print(od1 == od2)  # 输出：False   ← 内容相同、顺序不同
print(od1 == od3)  # 输出：True    ← 内容和顺序都相同

# 与普通 dict 比较：OrderedDict == dict 也要求顺序一致
d = {"a": 1, "b": 2}
print(od1 == d)    # 输出：True    ← 普通 dict 的迭代顺序刚好和 od1 一致
print(od2 == d)    # 输出：False   ← od2 顺序是 b→a，dict 是 a→b
```

注意 `OrderedDict` 和普通 `dict` 比较时，普通 `dict` 的迭代顺序被当作"它的顺序"来参与比较。如果普通 `dict` 恰好和 `OrderedDict` 顺序不同，即使内容相同也不相等。

这个特性的实际价值在于：当你把顺序当作配置语义的一部分时（比如 JSON 配置文件希望两个文件不仅字段相同、字段顺序也相同才算等价），`OrderedDict` 的相等性比较天然匹配这个需求。

### 2.6 重排操作综合对比

把 `OrderedDict` 中改变顺序的操作整理在一起对照，方便快速查找：

| 操作                            | 效果                         | 时间复杂度 |
| ------------------------------- | ---------------------------- | ---------- |
| `od[k] = v`（新键）             | 追加到末尾                   | O(1)       |
| `od[k] = v`（已有键）           | 值更新，位置不变             | O(1)       |
| `del od[k]`                     | 删除，后续键位置不变         | O(1)       |
| `od.move_to_end(k)`             | 移到末尾                     | O(1)       |
| `od.move_to_end(k, last=False)` | 移到开头                     | O(1)       |
| `od.popitem()`                  | 弹出末尾                     | O(1)       |
| `od.popitem(last=False)`        | 弹出开头                     | O(1)       |
| 重新插入已删的键                | 追加到末尾                   | O(1)       |
| `od.update(...)`                | 新键追加末尾，已有键原位更新 | O(n_new)   |

所有操作都是 O(1)（除了 `update` 按新增键数量线性），这是双向链表结构带来的保证。普通 `dict` 即使保序也无法做到 `move_to_end` 和 `popitem(last=False)`，因为它的条目数组只能从尾部增删，不能随意移动中间元素。

### 2.7 实战一：用 OrderedDict 手工实现 LRU 缓存

LRU 缓存的核心语义是：容量满时淘汰**最久未使用**的条目。用 `OrderedDict` 实现非常自然——每次访问把条目移到末尾，淘汰时从开头弹出：

```python
from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = OrderedDict()

    def get(self, key):
        """访问一个键，存在则返回值并标记为最近使用，不存在返回 -1"""
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)          # 移到末尾 = 标记最近使用
        return self.cache[key]

    def put(self, key, value):
        """写入一个键值对，容量满时淘汰最久未使用的"""
        if key in self.cache:
            self.cache.move_to_end(key)       # 已有键：更新位置
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)    # 从开头弹出 = 淘汰最久未使用

# 示例
cache = LRUCache(2)
cache.put(1, "A")
cache.put(2, "B")
print(cache.get(1))       # 输出：A  ← 访问了 1，1 变成最近使用
cache.put(3, "C")         # 容量超了，淘汰最久未使用的（键 2）
print(cache.get(2))       # 输出：-1  ← 2 已被淘汰
print(cache.get(3))       # 输出：C
print(cache.get(1))       # 输出：A
print(list(cache.cache.keys()))  # 输出：[3, 1]  ← 3 先插入，1 最近访问
```

注意 `get` 方法中 `move_to_end` 和取值分了两步——顺序关键：先 `move_to_end` 再取值，或者先取值再 `move_to_end` 都可以，但必须确保键存在才调用。如果把 `move_to_end` 放在 `return` 那一行，会先执行 `move_to_end`（返回 `None`），导致 `return None`——这是个常见的小错误。

值得提的是，Python 标准库已经提供了 `functools.lru_cache` 装饰器和 `functools.lru_cache` 的底层 `OrderedDict` 手工版，实际项目中优先用标准库。但理解自己写的 LRU Cache 能帮你吃透 `OrderedDict` 的两个核心方法如何配合工作。

### 2.8 实战二：保持 JSON/YAML 配置的字段顺序

配置文件通常希望保持字段顺序——不仅为了人类可读，有时字段顺序本身就是语义（比如依次执行的 pipeline stages、依次挂载的 volume）。`json.load` 可以通过 `object_pairs_hook` 参数用 `OrderedDict` 来保留顺序：

```python
import json
from collections import OrderedDict

config_json = '''
{
    "name": "my-app",
    "version": "1.0",
    "stages": ["build", "test", "deploy"],
    "resources": {"cpu": "2", "memory": "4Gi"}
}
'''

# 默认解析为普通 dict——保序但顺序无额外语义
d = json.loads(config_json)

# 用 OrderedDict 显式保留顺序
od = json.loads(config_json, object_pairs_hook=OrderedDict)
print(list(od.keys()))
# 输出：['name', 'version', 'stages', 'resources']  ← 严格按 JSON 中书写顺序

# 重新序列化时也保序
print(json.dumps(od, indent=2))
```

`object_pairs_hook=OrderedDict` 告诉 JSON 解析器：每碰到一个 JSON 对象（`{}`），就用 `OrderedDict` 来存，且传入的键值对列表已经是 JSON 中的书写顺序。这样整个 JSON 树各级对象都变成 `OrderedDict`，顺序语义贯穿解析和序列化全过程。

对于 YAML，`ruamel.yaml` 库默认就保留顺序（因为它内部用了类似的数据结构），而 `PyYAML` 需要显式配置。这点在处理 CI/CD 配置、Kubernetes manifest 等保留原始书写顺序很重要的场景中尤为实用。

### 2.9 OrderedDict 与 dict 的子类关系

`OrderedDict` 是 `dict` 的子类：

```python
from collections import OrderedDict

od = OrderedDict([("a", 1)])
print(isinstance(od, dict))   # 输出：True
print(issubclass(OrderedDict, dict))  # 输出：True
```

这意味着所有接受 `dict` 参数的函数、方法、类型注解都能接收 `OrderedDict`。但也意味着一个容易被忽视的问题：如果你把 `OrderedDict` 传给一个"内部转为普通 dict 再处理"的函数（如某些序列化库），顺序可能丢失：

```python
# 传给期望 dict 的函数没问题
def process(mapping: dict):
    for k, v in mapping.items():
        print(k, v)
process(od)   # 遍历按插入顺序，OK

# 但如果函数内部做了 dict(od)，顺序转化为普通 dict 的插入顺序（通常一致但语义弱化）
# 如果函数依赖 OrderedDict 的相等性判断，转成 dict 后顺序语义会丢失
```

实际编码中，如果 `OrderedDict` 只需要在创建/构建阶段保序、传给下游后不再关心顺序，转成 `dict` 反而能省内存（少了链表开销）；如果顺序是持久语义的一部分，就保持 `OrderedDict` 不要转。

### 2.10 反向迭代

`OrderedDict` 支持 `reversed()` 反向迭代，按插入顺序的逆序遍历：

```python
from collections import OrderedDict

od = OrderedDict([("a", 1), ("b", 2), ("c", 3)])

for k in reversed(od):
    print(k, end=" ")   # 输出：c b a

# 也支持 reversed(od.keys())、reversed(od.items()) 等
for k, v in reversed(od.items()):
    print(f"{k}:{v}", end=" ")  # 输出：c:3 b:2 a:1
```

Python 3.8 起普通 `dict` 也支持 `reversed()`，所以"反向迭代"不再是 `OrderedDict` 独有的能力；但如果你需要兼容更老的 Python 版本，只有 `OrderedDict` 能做到。

## 3. 最佳实践

### 3.1 OrderedDict vs dict：什么时候用哪个

这是 `OrderedDict` 相关最常被问到的问题。Python 3.7+ 普通 `dict` 已保序，选择判据从"要不要顺序"变成了"要不要操作顺序"：

```python
from collections import OrderedDict

# ✅ 只需遍历顺序 = 插入顺序 → 普通 dict
user = {"name": "Alice", "age": 30, "city": "Beijing"}
for k, v in user.items():
    print(k, v)  # 按插入顺序输出，dict 足够

# ✅ 需要经常重排键 → OrderedDict
task_queue = OrderedDict()
task_queue["task3"] = "low"
task_queue["task1"] = "high"
task_queue["task2"] = "medium"
task_queue.move_to_end("task1", last=False)  # 高优先级移到前面

# ✅ 顺序是相等性的一部分 → OrderedDict
od1 = OrderedDict([("a", 1), ("b", 2)])
od2 = OrderedDict([("b", 2), ("a", 1)])
assert od1 != od2  # 业务上这就是两个不同的配置

# ✅ 需要从头部弹出（FIFO 队列语义） → OrderedDict
od = OrderedDict([(1, "a"), (2, "b"), (3, "c")])
first = od.popitem(last=False)  # 弹出最早插入的
```

一个实用判据：问自己"如果两个映射内容相同但键的顺序不同，它们在业务上是不是同一个东西？" —— 是 → `dict`；不是 → `OrderedDict`。

### 3.2 不要依赖关键字参数的顺序

```python
from collections import OrderedDict

# ❌ 不推荐：依赖关键字参数的顺序（Python 版本依赖）
od1 = OrderedDict(c=3, a=1, b=2)

# ✅ 推荐：用键值对列表显式控制顺序
od2 = OrderedDict([("c", 3), ("a", 1), ("b", 2)])
```

虽然 Python 3.7+ 关键字参数也保序，但：① 它依赖于函数调用时的参数传递顺序（容易因代码重构而变）；② 不能跨版本保证（3.6 及之前是 CPython 实现细节）；③ 可读性差——读者需要知道 `OrderedDict` 的关键字参数保留了顺序。始终用键值对列表是最稳妥的。

### 3.3 move_to_end 前一定先确认键存在

```python
from collections import OrderedDict

od = OrderedDict([("a", 1)])

# ❌ 可能抛 KeyError
# od.move_to_end("b")  # KeyError: 'b'

# ✅ 先检查或捕获
if "b" in od:
    od.move_to_end("b")

# ✅ 或在访问模式中使用 get + move_to_end 的 LRU 模式
def access(od, key):
    if key in od:
        od.move_to_end(key)
    return od.get(key)
```

### 3.4 不要忘记 OrderedDict 的相等性语义

当你把函数参数设计为接受 `dict` 类型，但内部使用了相等性比较时，要注意传入 `OrderedDict` 后行为会变：

```python
from collections import OrderedDict

def config_equal(a: dict, b: dict) -> bool:
    return a == b

# 两个普通 dict，内容相同 → 相等
print(config_equal({"a": 1, "b": 2}, {"b": 2, "a": 1}))  # 输出：True

# 两个 OrderedDict，内容相同顺序不同 → 不相等
print(config_equal(
    OrderedDict([("a", 1), ("b", 2)]),
    OrderedDict([("b", 2), ("a", 1)])
))  # 输出：False   ← 行为变了！
```

如果你的函数期望 `dict` 那种"顺序无关"的相等判断，而调用方可能传 `OrderedDict`，需要在比较前统一转成普通 `dict`：

```python
def config_equal_safe(a, b):
    return dict(a) == dict(b)  # 统一转成 dict，只比内容
```

### 3.5 内存敏感的场合避免不必要的 OrderedDict

`OrderedDict` 的双向链表比普通 `dict` 多消耗约 2-3 倍内存（每个键多两个指针 + 一个链表节点对象）。在构建大量小字典的场合（如处理百万条记录、每条记录是一个 `OrderedDict`），累积的内存差异会很显著：

```python
# 内存开销对比（粗略，实际受 Python 版本和对象大小影响）
# dict: ~72 bytes per key-value pair（包括哈希表开销）
# OrderedDict: ~160+ bytes per key-value pair（加上链表节点和指针）
```

如果你的场景只是"构建时保序、构建后只读"，一个策略是：用 `OrderedDict` 构建，序列化/传出去前转成普通 `dict`（`dict(od)`），既享受了构建期的重排能力，又避免了长期内存开销和下游的相等性语义偏差。

### 3.6 OrderedDict 的拷贝

`copy()` 返回一个新的 `OrderedDict`，内容和顺序与原对象一致（浅拷贝，值引用共享）：

```python
from collections import OrderedDict

od = OrderedDict([("a", [1, 2]), ("b", [3, 4])])
od_copy = od.copy()

# 顺序一致
print(list(od_copy.keys()))  # 输出：['a', 'b']

# 浅拷贝：值引用共享
od_copy["a"].append(99)
print(od["a"])               # 输出：[1, 2, 99]  ← 原对象也被影响了
```

需要深拷贝时用 `copy.deepcopy()`，行为和普通 `dict` 一致。

### 3.7 OrderedDict 的序列化兼容

`OrderedDict` 支持 `pickle` 序列化：

```python
import pickle
from collections import OrderedDict

od = OrderedDict([("a", 1), ("b", 2)])
data = pickle.dumps(od)
od_restored = pickle.loads(data)
print(list(od_restored.items()))  # 输出：[('a', 1), ('b', 2)]
print(type(od_restored))          # 输出：<class 'collections.OrderedDict'>
```

JSON 序列化时 `OrderedDict` 被当成普通 `dict` 处理（因为它是 `dict` 子类），顺序在 JSON 输出中自然保留（因为序列化按迭代顺序走），但反序列化回来如果不指定 `object_pairs_hook=OrderedDict`，会变成普通 `dict`。

## 4. 原理

### 4.1 内部结构：双向链表 + 字典

`OrderedDict` 的 CPython 实现由两部分组成：

1. **字典**（基于哈希表）：存储键值对，提供 O(1) 存取。
2. **双向循环链表**：存储键的顺序。每个链表节点包含 `prev` 和 `next` 指针，形成一个环。链表头部是一个哨兵节点（sentinel/dummy node），简化边界处理。

```
┌─────────────────────────────────────────────────┐
│  OrderedDict                                     │
│                                                  │
│  Hash Table (dict)           Doubly-Linked List  │
│  ┌──────┬──────┐            ┌────┐┌────┐┌────┐  │
│  │ "a"  │  1   │──┐         │sent││node││node│  │
│  ├──────┼──────┤  │         │inel│↔│ a  │↔│ b  │  │
│  │ "b"  │  2   │──┤         └────┘└────┘└────┘  │
│  └──────┴──────┘  │              ↑              │
│                   └──────────────┘              │
│               每个节点存键引用，值在哈希表里        │
└─────────────────────────────────────────────────┘
```

每次插入新键：①在哈希表中建条目；②在链表尾部（哨兵前）插入新节点。删除键：①从哈希表中移除；②从链表中摘除对应节点。链表只存键的引用，不存值——值始终在哈希表里，避免了数据重复。

### 4.2 为什么要用双向链表而不是数组

如果用数组（类似 list）来记录顺序，`move_to_end` 需要找到元素位置再移动整个后续数组，时间复杂度为 O(n)。双向链表让摘除和插入都是 O(1)（只改前后节点的指针），代价是每个键多一个节点对象和两个指针的开销。这个取舍是 `OrderedDict` 设计的核心权衡——用空间换时间。

### 4.3 普通 dict 保序的内部机制（对比）

普通 `dict`（3.6+）靠的是哈希表条目数组的有序性：条目以插入顺序追加到数组中，哈希冲突用开放寻址解决，删除不缩容只标记"空位"。遍历时直接按数组顺序输出非空条目——这就是它"天然保序"的原因，没有额外链表成本。

但这种设计不支持重排：没法"把某个条目移到数组头部"而不移动其他条目——这需要所有后续条目整体偏移，O(n)。所以普通 `dict` 的保序是"被动、不可操的"；`OrderedDict` 的保序是"主动、可操作的"。二者本质区别就在这里。

### 4.4 **eq** 的实现差异

普通 `dict.__eq__` 等价于 `len(a) == len(b) and all(a.get(k, _sentinel) == b[k] for k in a)`——只比较键值对集合，不管顺序。`OrderedDict.__eq__` 在此基础上加了顺序检查：`len(a) == len(b) and all(a_k == b_k and a[k] == b[k] for a_k, b_k in zip(a, b))`——先压缩两边的键迭代器，逐对比较键和值是否都一致。

这个差异的根源在于：普通 `dict` 把"映射"定位为"关联集合"，顺序是副产品；`OrderedDict` 把顺序定位为"一等语义"，会影响相等性。

### 4.5 时间复杂度总表

| 操作                  | OrderedDict       | dict（3.7+） |
| --------------------- | ----------------- | ------------ |
| `d[k]` 取值           | O(1)              | O(1)         |
| `d[k] = v` 赋值       | O(1)              | O(1)         |
| `del d[k]`            | O(1)              | O(1)         |
| `k in d`              | O(1)              | O(1)         |
| 遍历                  | O(n)              | O(n)         |
| `move_to_end`         | O(1)              | 不支持       |
| `popitem(last=False)` | O(1)              | 不支持       |
| `reversed(d)`         | O(n)（遍历）      | O(n)（遍历） |
| `==` 比较             | O(n)（顺序 + 值） | O(n)（仅值） |
| 内存/键值对           | ~160+ bytes       | ~72 bytes    |

### 4.6 `from collections` 导入的正确姿势

```python
from collections import OrderedDict  # ✅ 推荐：直接导入类名

# 不推荐
# import collections
# collections.OrderedDict(...)  # 啰嗦，没有额外好处
```

`OrderedDict` 来自 `collections` 模块，和 `defaultdict`、`Counter`、`deque`、`namedtuple` 等是邻居。直接 `from collections import OrderedDict` 是标准写法。

## 5. 总结

### 5.1 OrderedDict 速查

```
创建：
- OrderedDict()                          空
- OrderedDict([(k,v), ...])             从键值对列表（推荐，显式控制顺序）
- OrderedDict(mapping)                   从另一个映射
- OrderedDict(**kwargs)                  关键字参数（不推荐：顺序依赖版本）

核心方法：
- od.move_to_end(key, last=True)        把键移到末尾（O(1)）
- od.move_to_end(key, last=False)       把键移到开头（O(1)）
- od.popitem(last=True)                 从末尾弹出（O(1)）
- od.popitem(last=False)                从开头弹出（O(1)）

行为：
- 遍历保序：keys()/values()/items() 严格按插入顺序
- 覆盖已有键：值更新、位置不变
- 删后重插：追加到末尾
- == 比较：内容 + 顺序都必须一致
- reversed(od)：按插入顺序逆序遍历

判据：
- 只需保序遍历 → dict（3.7+）
- 需要重排键 → OrderedDict
- 顺序是语义一部分（相等性） → OrderedDict
- LRU/FIFO → OrderedDict
```

### 5.2 核心要点回顾

- `OrderedDict` 是 `dict` 子类，记住插入顺序并支持重排（`move_to_end`、`popitem`）。
- 内部实现 = 字典（O(1) 存取）+ 双向链表（O(1) 顺序操作），内存开销比 dict 大约 2-3 倍。
- Python 3.7+ 普通 `dict` 也保序，但：不能重排、不能从头部弹出、相等性比较不关心顺序。
- `move_to_end` + `popitem(last=False)` 是实现 LRU 缓存的原语。
- `__eq__` 比较内容和顺序，是两者最关键的语义差异。
- 构建时用键值对列表控制顺序（不用关键字参数），传出前可视需要转 `dict` 省内存。

### 5.3 读完应能掌握

- 能说清 `OrderedDict` 和普通 `dict`（3.7+）的能力边界：dict 能做什么、不能做什么、OrderedDict 多了什么。
- 能用 `move_to_end` 和 `popitem(last=False)` 写出 LRU 缓存、任务队列等模式。
- 能识别并规避"依赖关键字参数顺序""忘记相等性语义""不必要地全局使用致内存浪费"等陷阱。
- 能解释 OrderedDict 的双结构（字典 + 链表）设计，以及为什么重排操作是 O(1)。
- 能在实际代码中判断何时该用 `OrderedDict`、何时该用普通 `dict`、判据是什么。

### 5.4 常见面试问题

**问题一：Python 3.7+ 的 dict 已经保序了，为什么还需要 OrderedDict？**

```python
from collections import OrderedDict

# 三个核心答案：
# 1. 重排能力：普通 dict 不能把键移到两端
od = OrderedDict([("a", 1), ("b", 2), ("c", 3)])
od.move_to_end("a")  # O(1) 移到末尾，dict 做不到

# 2. 从头部弹出：普通 dict 的 popitem() 只能弹末尾
od.popitem(last=False)  # FIFO 语义，dict 做不到

# 3. 顺序敏感的相等性：dict == dict 不管顺序，OrderedDict 管
print(OrderedDict([("a",1),("b",2)]) == OrderedDict([("b",2),("a",1)]))  # False
# dict 版：{"a":1,"b":2} == {"b":2,"a":1} → True
```

**问题二：OrderedDict 内部如何实现 O(1) 的 move_to_end？**

答案：双向链表。每个键对应一个链表节点（存 `prev`/`next` 指针），`move_to_end` 只是从当前位置摘除节点再插到目标位置——只改指针，O(1)。如果用数组存顺序，移动操作需要整体偏移，O(n)。这种"用空间（额外链表节点）换时间"的设计是 `OrderedDict` 的核心权衡。

**问题三：OrderedDict 和 dict 做相等性比较有什么不同？**

```python
from collections import OrderedDict

d1 = {"a": 1, "b": 2}
d2 = {"b": 2, "a": 1}
print(d1 == d2)  # True  ← dict：只比键值对集合

od1 = OrderedDict([("a", 1), ("b", 2)])
od2 = OrderedDict([("b", 2), ("a", 1)])
print(od1 == od2)  # False  ← OrderedDict：先比顺序，再比值
```

### 5.5 实战串讲：JSON 配置保留顺序 + LRU 缓存

把本篇的两个核心场景串在一起——读取 JSON 配置（保留字段顺序），同时为资源访问做 LRU 缓存：

```python
import json
from collections import OrderedDict

# 一段模拟的 CI 配置 JSON
config_json = '''
{
    "pipeline": {
        "stages": ["checkout", "build", "test", "deploy"],
        "timeout": 3600,
        "retries": 3
    },
    "resources": {
        "cpu": "4",
        "memory": "8Gi",
        "disk": "100Gi"
    }
}
'''

# 用 OrderedDict 保留各级 JSON 对象的字段顺序
config = json.loads(config_json, object_pairs_hook=OrderedDict)

# 各级配置都是 OrderedDict，保序
print("Pipeline keys:", list(config["pipeline"].keys()))
# 输出：Pipeline keys: ['stages', 'timeout', 'retries']
print("Resource keys:", list(config["resources"].keys()))
# 输出：Resource keys: ['cpu', 'memory', 'disk']

# 为 stages 做 LRU 执行顺序缓存（最近执行的 stage 在末尾）
stage_cache = OrderedDict()
for stage in config["pipeline"]["stages"]:
    stage_cache[stage] = "pending"

# 模拟执行 checkout 和 build
stage_cache.move_to_end("checkout")     # checkout 刚执行，移到末尾
stage_cache.move_to_end("build")        # build 执行，移到末尾
print(list(stage_cache.keys()))
# 输出：['test', 'deploy', 'checkout', 'build']
#       test 排在第一个 → 最久未执行 → 如果缓存淘汰它第一个出去

# 如果想按执行顺序反向列出（最后一个执行的在前）
for stage in reversed(stage_cache):
    print(stage, end=" ")   # 输出：build checkout deploy test
```

这个场景完整体现了 `OrderedDict` 的两个核心用途：①`object_pairs_hook=OrderedDict` 在反序列化时保留字段顺序；②`move_to_end` 实现 LRU 语义。

### 5.6 延伸

`OrderedDict` 是字典家族里"顺序一等公民"的代表。理解它之后，你可以根据自己的场景在不同字典类型间做精确选择：

- 只是"遍历时顺序和插入一致" → **普通 dict**（3.7+），零额外开销。
- 需要重排、从头部弹出、顺序敏感的相等性 → **OrderedDict**。
- 需要"键缺失自动补默认值" → 上一篇的 **defaultdict**，或再上一篇的 **setdefault**（局部按需）。
- 纯计数场景 → **Counter**，自带 `most_common` 和集合运算。
- 想从源码层面理解字典的保序机制 → 最后一篇 **字典底层原理哈希表**，会深入哈希表、开放寻址、条目数组的结构。

最后，把本系列的字典选择判据串联起来：面对一个字典需求，先问**要不要重排/顺序比较**（要→`OrderedDict`），再问**键缺失时要不要自动补默认**（全局→`defaultdict`，局部→`setdefault`，不补→`dict`），最后问**是否专一计数**（是→`Counter`）。这条链走完，九成以上的字典选型都收敛到了正确工具上。
