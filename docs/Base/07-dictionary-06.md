---
group:
  title: 【07】字典深度剖析
  order: 7
order: 6
title: Counter计数器
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 Counter

`Counter` 是 Python 标准库 `collections` 模块提供的一个字典子类，专门用于**计数**。它的设计目标非常专一：统计可哈希对象的出现次数。你可以把它理解为一个"频次字典"——键是要统计的对象，值是它出现的次数。

```python
from collections import Counter

# 从可迭代对象一键建计数
words = ["apple", "banana", "apple", "orange", "banana", "apple"]
c = Counter(words)
print(c)  # 输出：Counter({'apple': 3, 'banana': 2, 'orange': 1})

# Counter 是 dict 子类，所有 dict 操作都可用
print(c["apple"])    # 输出：3
print(c["grape"])    # 输出：0  ← 和 defaultdict(int) 一样，缺失返回 0（不抛 KeyError）
print(list(c))       # 输出：['apple', 'banana', 'orange']  ← 按频次降序迭代
```

`Counter` 相对前几篇的 `defaultdict(int)` 或手写 `setdefault` 计数逻辑，多了三个关键能力：①缺失键返回 0 而非抛 KeyError；②自带 `most_common()` 快速查 Top-N；③支持 `+` `-` `&` `|` 等集合式运算，可以对多个计数器做加减、取交、取并。

如果把字典家族按"专用程度"排个序：`dict` 最通用 → `defaultdict` 加了自动默认 → `Counter` 专为计数而生，API 全部围绕"频次统计"展开。你当然可以用 `defaultdict(int)` 完成同样的计数逻辑（上一篇文章就是这么写的），但 `Counter` 内置的一行 `most_common()`、一行多计数器运算，能让计数代码短两到三倍。

### 1.2 为什么需要 Counter

计数是编程里最常见的需求之一：统计词频、统计字符出现次数、统计事件类型分布、统计用户行为……在没有 `Counter` 的时候，实现方式五花八门：

```python
words = ["apple", "banana", "apple", "orange", "banana", "apple"]

# 写法一：普通 dict + get/setdefault
d1 = {}
for w in words:
    d1[w] = d1.get(w, 0) + 1

# 写法二：defaultdict(int)
from collections import defaultdict
d2 = defaultdict(int)
for w in words:
    d2[w] += 1

# 写法三：Counter —— 一行搞定
from collections import Counter
c = Counter(words)
```

`Counter(words)` 一行替代了整个循环体。更重要的是，`Counter` 打开了一整套"频次操作"的 API：

- **查 Top-N**：`c.most_common(3)` — 传统写法需要 `sorted(c.items(), key=lambda x: x[1], reverse=True)[:3]`
- **多源合并**：`c1 + c2` 把两个计数相加，`c1 - c2` 做差
- **过滤低频**：通过 `+` `-` `&` 运算一行剔除出现次数太少的项
- **缺失安全**：访问不存在的键返回 0，不会干扰计数逻辑

所以 `Counter` 的核心价值不只是"少写几行代码"，而是**把频次统计从"过程"变成了"类型"**——Counter 实例本身就是一个可求和、可比较、可查 Top-N 的频次对象，不再需要你手写辅助逻辑。

### 1.3 关键概念：multiset（多重集）

数学和计算机科学中用 **multiset（多重集）** 来描述"元素可以重复出现的集合"，`Counter` 本质上就是 Python 对 multiset 的实现：

- 键 = 集合中的元素
- 值 = 元素的**重数**（multiplicity，出现次数）
- 值为 0 的元素自动视为"不在集合中"
- 值为负的元素：multiset 允许（但 `Counter` 的部分方法会忽略负值元素）

```python
from collections import Counter

# Counter 就像一个能装重复元素的袋子
bag = Counter("abracadabra")
print(bag)            # Counter({'a': 5, 'b': 2, 'r': 2, 'c': 1, 'd': 1})

# "a 在这个袋子里的重数是 5"
print(bag["a"])       # 输出：5

# multiset 运算：取交（取每个元素在两个集合中的最小重数）
bag2 = Counter("abc")
print(bag & bag2)     # Counter({'a': 1, 'b': 1, 'c': 1})
```

把 `Counter` 理解成 multiset 之后，它的 `+` `-` `&` `|` 运算就很好理解了：

- `+`：重数相加（并集，两个袋子倒一起）
- `-`：重数相减（差集，结果 ≤ 0 的元素被忽略）
- `&`：取每元素的最小重数（交集，"两个袋子都有的元素，取少的那个数量"）
- `|`：取每元素的最大重数（并集，"两个袋子都有的元素，取多的那个数量"）

这个 multiset 视角是全篇的基础，后面所有运算都围绕它展开。

## 2. 核心内容

### 2.1 创建 Counter

`Counter` 的创建方式很灵活——只要数据源能解析为"元素 → 频次"的映射就行：

```python
from collections import Counter

# 方式一：从可迭代对象创建（最常用）
c1 = Counter("abracadabra")
print(c1)  # Counter({'a': 5, 'b': 2, 'r': 2, 'c': 1, 'd': 1})

c2 = Counter(["apple", "banana", "apple", "orange", "banana", "apple"])
print(c2)  # Counter({'apple': 3, 'banana': 2, 'orange': 1})

# 方式二：从字典 / 映射创建
c3 = Counter({"a": 3, "b": 1, "c": 2})
print(c3)  # Counter({'a': 3, 'c': 2, 'b': 1})

# 方式三：关键字参数
c4 = Counter(a=3, b=1, c=2)
print(c4)  # Counter({'a': 3, 'c': 2, 'b': 1})

# 方式四：空 Counter，后续手动填入
c5 = Counter()
c5["x"] += 1   # 缺失默认 0，加 1 后变成 1
print(c5)      # Counter({'x': 1})
```

"从可迭代对象创建"是最高频的用法——传入字符串、列表、生成器，`Counter` 自动遍历并统计每个元素的出现次数。传入字典或关键字参数时，值直接作为频次（不会再加总）。

一个容易混淆的点：**关键字参数的顺序在 Python 3.7+ 才保证，且 Counter 本身不按插入顺序遍历，而是按频次降序**。所以创建时的顺序对 Counter 的遍历顺序没有影响——这是它和 `OrderedDict` 的显著区别。

### 2.2 基础操作：存取删

`Counter` 是 `dict` 子类，支持普通字典的全部操作，但在"访问缺失键"时有自己的语义：

```python
from collections import Counter

c = Counter("abracadabra")
print(c)  # Counter({'a': 5, 'b': 2, 'r': 2, 'c': 1, 'd': 1})

# 取值：存在的键返回频次
print(c["a"])     # 输出：5

# 取值：缺失的键返回 0，不抛 KeyError
print(c["z"])     # 输出：0
print("z" in c)   # 输出：False  ← 返回 0 不等于"键存在"

# 更新计数
c["z"] += 1       # 缺失键默认 0，+1 后 = 1，自动建键
print(c["z"])     # 输出：1

c["a"] += 1       # 已有键正常累加
print(c["a"])     # 输出：6

# 删除计数（设为 0 = 相当于删除）
c["z"] = 0
print("z" in c)   # 输出：False  ← Counter 把值为 0 的键视为"不存在"

# 删除整个键
del c["a"]        # 彻底移除
print(c["a"])     # 输出：0  ← 删除后回到缺失状态，返回 0
```

几个容易混淆的行为要特别注意：

1. **`c["z"]` 返回 0，但 `"z" in c` 是 `False`**。这和 `defaultdict(int)` 不同——`defaultdict(int)` 的取值会**写入**键，而 `Counter` 取值缺失时只返回 0、不建键。这条特性让 `Counter` 更适合"探查而不污染"的场景。
2. **值为 0 的键被视同不存在**：设置 `c[k] = 0` 后，该键在 `in`、遍历中都会消失。这是 `Counter` 对 multiset 语义的忠实实现——重数为 0 意味着不在集合中。
3. **Counter 允许值为负数**，但 `in` 检查仍然只看是否 > 0？不——`in` 检查是按照"键是否在字典中"，而 `c[k] = 0` 本质是 `del` 了键。负数则不同——键还在，`in` 返回 True。后面 2.5 节会展开讲负值的处理。

### 2.3 most_common(n)：拉取 Top-N

`most_common(n)` 是 `Counter` 最具代表性的方法——返回频次最高的 n 个元素及其计数，按频次从高到低排列。不传 `n` 则返回全部元素（相当于降序排序）。

```python
from collections import Counter

c = Counter("abracadabra")
print(c.most_common(2))   # 输出：[('a', 5), ('b', 2)]
print(c.most_common())    # 输出：[('a', 5), ('b', 2), ('r', 2), ('c', 1), ('d', 1)]

# 频次相同时，顺序不做保证（取决于 Counter 内部顺序）
# 如果需要同级频次稳定排序，额外用 sorted
```

如果没有 `Counter`，查 Top-N 的典型写法是 `sorted(c.items(), key=lambda x: x[1], reverse=True)[:n]`——即先排序再切片，时间复杂度 O(m log m)（m 为不同元素数）。而 `most_common(n)` 内部用了堆（heapq），时间复杂度是 O(m log n)——当 n 远小于 m 时，效率显著更高。

```python
# Counter.most_common(n) 等价于：
import heapq
def manual_most_common(c, n=None):
    if n is None:
        return sorted(c.items(), key=lambda x: x[1], reverse=True)
    return heapq.nlargest(n, c.items(), key=lambda x: x[1])
```

### 2.4 elements()：按重数展开元素

`elements()` 返回一个迭代器，把 Counter 中每个元素按它的重数重复展开——就像"把袋子倒出来，每个元素出现和它的计数一样多次"：

```python
from collections import Counter

c = Counter(a=3, b=2, c=1)
print(list(c.elements()))
# 输出：['a', 'a', 'a', 'b', 'b', 'c']

# 应用：重建原始序列（忽略顺序）
text = "abracadabra"
c = Counter(text)
reconstructed = "".join(c.elements())
print(sorted(reconstructed))  # 排序后和 sorted(text) 一致
# 输出：['a', 'a', 'a', 'a', 'a', 'b', 'b', 'c', 'd', 'r', 'r']
```

几点细节：

- `elements()` 只展开**计数 > 0**的元素，值为 0 或负数的不产出。
- 元素的产生顺序不做保证（取决于 Counter 内部迭代顺序）。
- 返回的是迭代器而非列表，适合"还原后继续遍历"的流式场景。

### 2.5 update 与 subtract：增减计数

`Counter` 提供了两种修改计数的方式——`update`（加计）和 `subtract`（减计）：

```python
from collections import Counter

c = Counter("abc")
print(c)  # Counter({'a': 1, 'b': 1, 'c': 1})

# update：从另一个可迭代对象或映射"加计"
c.update("aab")            # 把 "aab" 的元素频次加到当前计数上
print(c)  # Counter({'a': 3, 'b': 2, 'c': 1})   ← a 从 1 变成 3, b 从 1 变成 2

c.update({"x": 5, "y": 2}) # 字典/映射也可以
print(c)  # Counter({'x': 5, 'a': 3, 'b': 2, 'y': 2, 'c': 1})

# subtract：从另一个可迭代对象或映射"减计"——允许负值！
c.subtract("aaxx")
print(c)  # Counter({'x': 3, 'a': 1, 'b': 2, 'y': 2, 'c': 1})
```

`update` 和 `subtract` 的核心区别，直接看行为表：

| 操作                   | 效果                               | 允许负值                            |
| ---------------------- | ---------------------------------- | ----------------------------------- |
| `c.update(iterable)`   | 对 iterable 中每个元素 `c[e] += 1` | 不会出现（只加）                    |
| `c.update(mapping)`    | 对 mapping 中每个键 `c[k] += v`    | 不会出现（除非 mapping 的值是负的） |
| `c.subtract(iterable)` | 对 iterable 中每个元素 `c[e] -= 1` | **是**，结果可以 < 0                |
| `c.subtract(mapping)`  | 对 mapping 中每个键 `c[k] -= v`    | **是**，结果可以 < 0                |

重点：**`subtract` 允许计数变为负数**。这和 `Counter` 的 `+` `-` 运算不同——后者会丢弃非正数结果（见 2.6 节）。`subtract` 的设计保留了"亏欠"的信息，适合"正在操作但还没清理"的中间状态：

```python
from collections import Counter

pos = Counter(a=3, b=2)
neg = Counter(a=4, b=1)
pos.subtract(neg)
print(pos)  # Counter({'b': 1, 'a': -1})  ← a 是 -1，键还在

# 清理负数，只保留正数计数
pos = +pos  # 单目 + 运算会去掉非正数（见 2.6 节）
print(pos)  # Counter({'b': 1})  ← a 被去掉了
```

### 2.6 算术运算：+ - & |

`Counter` 支持四个集合式运算符，这是它区别于 `defaultdict(int)` 的最强能力——对多个计数源做合并、求差、取交集、取并集，一行代码完成。

```python
from collections import Counter

c1 = Counter(a=3, b=1, c=2)
c2 = Counter(a=1, b=2, d=4)

# +：对应元素频次相加（并集，两个袋子倒一起）
print(c1 + c2)
# 输出：Counter({'a': 4, 'd': 4, 'c': 2, 'b': 3})

# -：对应元素频次相减（差集），结果 ≤ 0 的元素被丢弃
print(c1 - c2)
# 输出：Counter({'a': 2, 'c': 2})  ← b: 1-2=-1(丢弃), d: 0-4=-4(丢弃)

# &：对应元素取最小频次（交集）
print(c1 & c2)
# 输出：Counter({'a': 1, 'b': 1})  ← 只有两边都有的键，取 min 频次

# |：对应元素取最大频次（并集）
print(c1 | c2)
# 输出：Counter({'a': 3, 'd': 4, 'b': 2, 'c': 2})  ← 两边键的并集，取 max 频次
```

**四个运算符的精确语义**：

| 运算符       | 结果       | 包含哪些键         | 值的计算            | 丢弃条件 |
| ------------ | ---------- | ------------------ | ------------------- | -------- |
| `c1 + c2`    | 求和       | 两边所有键         | `c1[k] + c2[k]`     | 和 ≤ 0   |
| `c1 - c2`    | 求差       | 两边所有键         | `c1[k] - c2[k]`     | 差 ≤ 0   |
| `c1 & c2`    | 交集       | 只在两边都存在的键 | `min(c1[k], c2[k])` | 结果 ≤ 0 |
| `c1 \| c2`   | 并集       | 两边所有键         | `max(c1[k], c2[k])` | 结果 ≤ 0 |
| `+c`（单目） | 去掉非正数 | 原 Counter 的键    | `c[k]`（不变）      | 值 ≤ 0   |

关键行为：

- **所有运算符的结果都会丢弃 ≤ 0 的元素**——保持 multiset 语义（重数不为正 = 不在集合中）。
- **`c1 - c2` 对仅在 c2 中存在的键的处理**：`c1[k]` 默认为 0，`0 - c2[k]` ≤ 0，所以这些键不会出现在结果中。
- 这些运算返回的是**新的 Counter 对象**，不会修改原来的。

`+` `-` 和 `update`/`subtract` 的区别在于：前者是"生成新对象、丢弃非正"，后者是"原地修改、保留负数"。选哪个取决于你是否需要保留"亏欠"信息。

### 2.7 total()：获取总计数（Python 3.10+）

Python 3.10 为 `Counter` 新增了 `total()` 方法，返回所有计数的总和：

```python
from collections import Counter

c = Counter(a=3, b=2, c=5)
print(c.total())         # 输出：10

# 等价于 sum(c.values())，但更语义化
print(sum(c.values()))   # 输出：10
```

在 Python 3.10 之前，用 `sum(c.values())` 达到同样效果。`total()` 的优势是意图书写更清晰——读代码的人一眼就知道在"求总数"。

### 2.8 经典范式一：词频统计

```python
from collections import Counter

text = "the quick brown fox jumps over the lazy dog the fox"
words = text.lower().split()

c = Counter(words)
print(c)
# Counter({'the': 3, 'fox': 2, 'quick': 1, 'brown': 1, 'jumps': 1, 'over': 1, 'lazy': 1, 'dog': 1})

# Top-3 高频词
for word, count in c.most_common(3):
    print(f"{word}: {count}")
# 输出：
# the: 3
# fox: 2
# quick: 1
```

如果你的文本里有标点、大小写等干扰，配合正则预处理：

```python
import re
from collections import Counter

text = "Hello, world! Hello, Python. Python is great."
words = re.findall(r"\w+", text.lower())
c = Counter(words)
print(c.most_common(2))  # 输出：[('hello', 2), ('python', 2)]
```

### 2.9 经典范式二：字符频次统计

```python
from collections import Counter

s = "abracadabra"
c = Counter(s)
print(c)  # Counter({'a': 5, 'b': 2, 'r': 2, 'c': 1, 'd': 1})

# 出现次数最多的字符
print(c.most_common(1))  # 输出：[('a', 5)]

# 出现次数 ≥ 2 的字符
print([ch for ch, cnt in c.items() if cnt >= 2])  # 输出：['a', 'b', 'r']
```

### 2.10 经典范式三：多源计数的合并与对比

```python
from collections import Counter

# 两个服务器的请求方法分布
server_a = Counter(["GET", "GET", "POST", "GET", "DELETE", "POST"])
server_b = Counter(["GET", "POST", "POST", "PUT", "GET"])

# 总请求分布（求和）
total = server_a + server_b
print(total)
# Counter({'GET': 5, 'POST': 4, 'DELETE': 1, 'PUT': 1})

# 两服务器共有的请求方法（交集）
print(server_a & server_b)
# Counter({'GET': 2, 'POST': 1})  ← GET 两者都至少有 2 次, POST 都至少有 1 次

# server_a 比 server_b 多出的请求（差集）
print(server_a - server_b)
# Counter({'GET': 1, 'DELETE': 1})  ← a 比 b 多 1 个 GET, 多 1 个 DELETE

# 两者合并的最大值（并集）
print(server_a | server_b)
# Counter({'GET': 3, 'POST': 2, 'DELETE': 1, 'PUT': 1})
```

### 2.11 经典范式四：去掉低频项

```python
from collections import Counter

c = Counter("aaaabbbccde")
print(c)  # Counter({'a': 4, 'b': 3, 'c': 2, 'd': 1, 'e': 1})

# 只保留出现 ≥ 2 次的元素
c_filtered = Counter({k: v for k, v in c.items() if v >= 2})
print(c_filtered)  # Counter({'a': 4, 'b': 3, 'c': 2})

# 或者用 +c 配合减法运算
low_freq = Counter({k: v for k, v in c.items() if v < 2})
c_filtered2 = c - low_freq  # 减法运算：去掉低频项
print(c_filtered2)  # Counter({'a': 4, 'b': 3, 'c': 2})
```

### 2.12 Counter 的迭代顺序

`Counter` 继承自 `dict`，所以遍历顺序遵循"插入顺序 + 覆盖不改变位置"的规则。但因为 Counter 在创建时会按**频次降序**插入键（从 `most_common` 的顺序反过来理解），实际遍历通常也是高频在前：

```python
from collections import Counter

c = Counter("abracadabra")
# 内部插入顺序：a(最先插入) → r → b → c → d（构造时按频次降序填入）
print(list(c))  # 输出可能是 ['a', 'b', 'r', 'c', 'd'] 或按频次排列

# 但这是实现细节！不要依赖 Counter 的迭代顺序
# 如果需要稳定排序，显式用 most_common 或 sorted
```

**原则**：不要依赖 `Counter` 的迭代顺序——它来源于构造过程，不是 API 规范保证的。要稳定排序就用 `most_common()` 或 `sorted(c.items(), key=lambda x: x[1], reverse=True)`。

## 3. 最佳实践

### 3.1 推荐写法 vs 不推荐写法

**计数直接用 Counter，不手写 defaultdict / setdefault**

```python
from collections import Counter

items = ["a", "b", "a", "c", "a", "b"]

# ✅ 推荐：Counter 一行
c = Counter(items)

# ❌ 不推荐：手写 defaultdict 循环（没额外好处时）
# from collections import defaultdict
# d = defaultdict(int)
# for item in items:
#     d[item] += 1
```

**查 Top-N 用 most_common，不自己排序**

```python
# ✅ 推荐
top3 = c.most_common(3)

# ❌ 不推荐：自己排序切片
# top3 = sorted(c.items(), key=lambda x: x[1], reverse=True)[:3]
```

**多源合并用运算符，不自己循环**

```python
c1 = Counter("abc")
c2 = Counter("bcd")

# ✅ 推荐
merged = c1 + c2

# ❌ 不推荐
# merged = c1.copy()
# merged.update(c2)
```

### 3.2 不要依赖 Counter 的迭代顺序

```python
from collections import Counter

c = Counter("abcabc")
# ❌ 不要假设 list(c) 的顺序
# 要稳定输出，显式排序：
for item, count in c.most_common():
    print(item, count)
# 或者按字母序：
for item in sorted(c):
    print(item, c[item])
```

### 3.3 缺失返回 0 ≠ 键存在

```python
from collections import Counter

c = Counter(a=3, b=2)
print(c["z"])     # 输出：0
print("z" in c)   # 输出：False  ← 这两个不矛盾但容易误判

# ✅ 正确：判断是否存在用 in
if "z" in c:
    print(f"z 出现了 {c['z']} 次")

# ❌ 错误：用 c["z"] 的真假判断存在性（0 是假值，但缺失也返回 0）
# if c["z"]:
#     ...
```

`Counter` 缺失返回 0 的实现依赖 `__missing__`（和前一篇 `defaultdict` 机制相同），但它不做写入——只是返回 0 而不建键。如果把它当 `defaultdict(int)` 用，要记住：访问缺失键不会让 `len(c)` 增长，也不会让 `in` 变 True。

### 3.4 Counter 是 dict 子类，但传给期望 dict 的函数时注意语义

```python
from collections import Counter

c = Counter(a=3, b=2)

# ✅ 可以传给接受 dict 的函数
def process(mapping: dict):
    for k, v in mapping.items():
        print(k, v)
process(c)  # OK

# ⚠️ 但要注意：有些操作会丢失 Counter 的特殊行为
d = dict(c)  # 变成普通 dict，缺失键会抛 KeyError
# d["z"]     # KeyError   ← Counter 返回 0，dict 抛错
```

`isinstance(c, dict)` 是 `True`，所以任何接受 `dict` 的地方都能传 `Counter`。但转为普通 `dict` 后，缺失键返回 0 的特性就没了。如果下游代码依赖这个特性，保持 `Counter` 类型。

### 3.5 算术运算返回新对象，update/subtract 原地修改

```python
from collections import Counter

c1 = Counter(a=3, b=2)
c2 = Counter(a=1, b=2)

# ✅ 只要结果、不改原数据：用运算符
result = c1 + c2     # c1 和 c2 不变
print(result)        # Counter({'a': 4, 'b': 4})

# ✅ 需要积累到某个计数器上：用 update
c1.update(c2)        # c1 被修改
print(c1)            # Counter({'a': 4, 'b': 4})
```

值得注意的差异：`c1 + c2` 会丢弃非正数结果，而 `c1.subtract(c2)` 保留负数。所以在"找两个计数的差异"时，如果想要完整的差值（包括负数），用 `subtract`；如果只要正数差值，用 `-` 运算符即可。

### 3.6 elements() 的谨慎使用

```python
from collections import Counter

# ✅ 计数全为正时，elements() 语义清晰
c = Counter(a=3, b=2)
print(list(c.elements()))  # ['a', 'a', 'a', 'b', 'b']

# ⚠️ 有负数时，负数元素不会被产出
c_neg = Counter(a=3, b=-1)
print(list(c.elements()))  # ['a', 'a', 'a']  ← b 不出现

# ⚠️ 不要依赖 elements() 的产出顺序
# 如需稳定顺序，配合 sorted
c2 = Counter(b=2, a=3)
print(sorted(c2.elements()))  # ['a', 'a', 'a', 'b', 'b']
```

`elements()` 的语义是"把值为正的键按重数展开"。值为 0 或负的键不产出。这个忽略是符合 multiset 直觉的——但如果你在调试负值场景，可能因为 `elements()` 看不到负值而困惑。排查负值用 `{k: v for k, v in c.items() if v < 0}`。

### 3.7 计数为 0 的键会被自动清理吗？

不会"自动"清理，但在很多操作中会被"视为不存在"。具体行为：

```python
from collections import Counter

c = Counter(a=3, b=0)
print("b" in c)    # 输出：True   ← 0 值键仍然存在！
print(c["b"])      # 输出：0

# 但 most_common 不包含 0 值键
print(c.most_common())  # 输出：[('a', 3)]  ← b 不出现

# elements() 也不包含 0 值键
print(list(c.elements()))  # 输出：['a', 'a', 'a']

# 运算符操作后会清理非正数键
c2 = Counter(b=1)
result = c - c2           # b: 0-1=-1 → 丢弃
print(result)             # Counter({'a': 3})
```

所以 0 值键在一些 API 中"被忽略"、在另一些 API 中"仍存在"。如果你想确保 Counter 里没有 0 值或负值键，明确清理：

```python
# 清理：只保留正数计数
c = +Counter(a=3, b=0, c=-1)
print(c)  # Counter({'a': 3})  ← b 和 c 被去掉了
```

`+c`（单目正号）是最简洁的清理写法——它内部会创建一个新 Counter，丢弃所有 ≤ 0 的条目。

### 3.8 性能注意：Counter 对大流量的适用性

`Counter` 底层仍是字典，对元素去重字典 O(1) 操作很高效。它在面对百万级元素时可以顺畅工作，但要注意：

- `most_common(n)` 当 n 很大时（接近全部元素数），退化为全排序 O(m log m)。
- `elements()` 是生成器，但展开大量元素时内存峰值可能很高（如果马上 `list()` 的话）。
- 对于"只需要频次、不需要元素本身"的高吞吐场景（如日志采样），考虑近似算法（如 Count-Min Sketch）而非精确计数。

## 4. 原理

### 4.1 Counter 是 dict 的子类

```python
from collections import Counter
c = Counter(a=3, b=2)
print(isinstance(c, dict))          # 输出：True
print(issubclass(Counter, dict))    # 输出：True
```

`Counter` 继承自 `dict`，只是重写了 `__missing__`（缺失返回 0）、`__repr__`（友好显示），以及新增了 `most_common`、`elements`、`subtract`、`total` 和运算符重载。

### 4.2 **missing** 钩子：缺失返回 0 的实现

和 `defaultdict` 一样，`Counter` 也依赖 `__missing__` 钩子，但行为不同——`Counter.__missing__` 只返回 0，不写入字典：

```python
# Counter.__missing__ 的等价实现
def __missing__(self, key):
    return 0  # 只返回 0，不 self[key] = 0（不建键！）
```

对比 `defaultdict.__missing__`：

|        | `defaultdict.__missing__`    | `Counter.__missing__` |
| ------ | ---------------------------- | --------------------- |
| 动作   | 调用工厂 → 写入字典 → 返回值 | 直接返回 0            |
| 建键   | ✅ 写入 `self[key] = value`  | ❌ 不写入             |
| 副作用 | `len(d)` 增长、`in` 变 True  | 无副作用              |

这种"读而不写"的设计让 `Counter` 在计数场景恰到好处：`c[k] += 1` 时，缺失键返回 0 → 加 1 → 写回 1，恰好完成"首次出现、计数为 1"的语义；而 `c[k]` 单纯探查时不会留下痕迹，避免像 `defaultdict(int)` 那样越探查字典越大。

### 4.3 运算符重载的内部逻辑

`Counter` 的 `+` `-` `&` `|` 运算符通过对应的魔术方法实现：

```python
# Counter.__add__ 等价实现（简化版）
def __add__(self, other):
    if not isinstance(other, Counter):
        return NotImplemented
    result = Counter()
    for elem in set(self) | set(other):
        newcount = self[elem] + other[elem]
        if newcount > 0:
            result[elem] = newcount
    return result
```

所有四个运算符都遵循相同的模式：

1. 遍历两个 Counter 的键的并集
2. 对每个键应用对应的运算（加/减/min/max）
3. 结果 > 0 才保留（符合 multiset 语义）

全程创建新对象、不修改原 Counter——这是不可变风格的算子。

### 4.4 most_common 的实现：堆 vs 排序

`most_common(n)` 的内部实现根据 n 选择策略：

- **n 为 None 或 ≥ 总元素数**：直接用 `sorted(self.items(), key=..., reverse=True)`，O(m log m)
- **n < 总元素数**：用 `heapq.nlargest(n, self.items(), key=...)`，O(m log n)

其中 m 是 Counter 中不同键的数量。两个算法的区别在 n 很小、m 很大时尤为明显——用堆只需维护一个大小为 n 的最小堆，遍历一次即可。

这也是 3.1 节建议"用 `most_common(n)` 而非手写排序"的深层原因：`most_common` 比你更知道怎么高效地做。

### 4.5 时间复杂度总表

| 操作                   | 时间复杂度 | 说明                  |
| ---------------------- | ---------- | --------------------- |
| `c[k]` 取值            | O(1)       | dict 查找             |
| `c[k] += 1`            | O(1)       | 查找 + 写入           |
| `c.most_common(n)`     | O(m log n) | m = 不同的键数        |
| `c.most_common()`      | O(m log m) | 全排序                |
| `c.elements()`         | O(total)   | total = 所有频次之和  |
| `c.update(iterable)`   | O(n)       | n = iterable 元素数   |
| `c.subtract(iterable)` | O(n)       | 同上                  |
| `c1 + c2`              | O(m1 + m2) | 两个 Counter 的键并集 |
| `c1 - c2`              | O(m1 + m2) | 同上                  |
| `c1 & c2`              | O(m1 + m2) | 同上                  |
| `c1 \| c2`             | O(m1 + m2) | 同上                  |

### 4.6 from collections 导入的正确姿势

```python
from collections import Counter  # ✅ 推荐：直接导入类名
```

`Counter` 和 `defaultdict`、`OrderedDict`、`deque`、`namedtuple` 等都在 `collections` 模块中。

## 5. 总结

### 5.1 Counter 速查

```
创建：
- Counter(iterable)               从可迭代对象自动计数
- Counter(mapping)                从映射（值 = 频次）
- Counter(**kwargs)               关键字参数
- Counter()                       空，后续 c[k] += 1 逐步构建

核心方法：
- c[k]                           取值，缺失返回 0（不建键）
- c.most_common(n)                Top-N 频次，降序
- c.most_common()                 全部按频次降序
- c.elements()                   按重数展开为迭代器（忽略 ≤ 0）
- c.update(iterable|mapping)     加计（原地修改）
- c.subtract(iterable|mapping)   减计（原地修改，保留负数）
- c.total()                      总计数（3.10+，等价于 sum(c.values())）

运算符（返回新 Counter，丢弃 ≤ 0）：
- c1 + c2                        频次相加（并集）
- c1 - c2                        频次相减（差集）
- c1 & c2                        取最小频次（交集）
- c1 | c2                        取最大频次（并集）
- +c                             去掉非正数键，只保留 > 0 的

判据：
- 纯计数需求 → Counter（一行构造 + most_common + 集合运算）
- 计数混在其他 dict 操作中 → defaultdict(int)
- 只在一两处需要默认 → setdefault
```

### 5.2 Counter vs defaultdict(int) vs setdefault 对照

| 维度     | Counter                  | defaultdict(int)          | setdefault                |
| -------- | ------------------------ | ------------------------- | ------------------------- |
| 创建     | `Counter(iterable)` 一行 | `defaultdict(int)` + 循环 | `{}` + `setdefault(k, 0)` |
| 缺失取值 | 返回 0，不建键           | 返回 0，建键              | 抛 KeyError               |
| Top-N    | `c.most_common(n)`       | 手写排序                  | 手写排序                  |
| 多源合并 | `c1 + c2`                | 手写循环                  | 手写循环                  |
| 集合运算 | `& \| -` 支持            | 不支持                    | 不支持                    |
| 负数计数 | 支持（subtract）         | 可以但没语义              | 可以但没语义              |
| 适用场景 | 专一计数                 | 自动默认 + 可能计数       | 局部少量默认              |

### 5.3 核心要点回顾

- `Counter` 是 `dict` 子类，专为计数设计——本质是 Python 对 multiset 的实现。
- 缺失键返回 0 不建键（`__missing__` 只返回 0，不写入），探查无副作用。
- `most_common(n)` 用堆实现，O(m log n)；全部排序时 O(m log m)。
- `+ - & |` 四个运算符提供 multiset 语义的集合运算，结果丢弃 ≤ 0 的条目。
- `update`/`subtract` 原地修改；运算符返回新对象。
- `subtract` 允许负值计数，`elements()` 和运算结果忽略 ≤ 0 的条目。
- 值为 0 的键在 `most_common`、`elements`、运算结果中会被忽略，但 `in` 检查可能仍返回 True（取决于该键是否物理存在于字典中）。

### 5.4 读完应能掌握

- 能用 `Counter` 一行完成词频/字符频/事件分布统计，并用 `most_common` 快速查 Top-N。
- 能理解 multiset 视角下的 `+ - & |` 语义，灵活做多源计数的合并、取交、求差。
- 能区分 `update`/`subtract`（原地修改、保留负数）和运算符（新对象、丢弃非正）。
- 能识别 `Counter` 缺失返回 0 但不建键的特性，不会混淆 `c["z"] == 0` 和 `"z" in c == False`。
- 能在 `Counter` / `defaultdict(int)` / `setdefault` 之间按场景正确选型。

### 5.5 常见面试问题

**问题一：Counter 和 defaultdict(int) 在计数上有什么不同？**

```python
from collections import Counter, defaultdict

items = ["a", "b", "a"]

# Counter：一行创建，缺失返回 0 不建键
c = Counter(items)
print(c["z"])     # 输出：0
print("z" in c)   # 输出：False

# defaultdict(int)：需要循环手动填充，缺失返回 0 并建键
d = defaultdict(int)
for item in items:
    d[item] += 1
print(d["z"])     # 输出：0
print("z" in d)   # 输出：True   ← 建键了！

# 此外 Counter 提供 most_common、集合运算，defaultdict 没有
```

**问题二：Counter 的 `+` 和 `-` 运算符做了什么？和 update/subtract 有什么区别？**

```python
from collections import Counter

c1 = Counter(a=3, b=1)
c2 = Counter(a=1, b=2)

# 运算符：创建新对象，丢弃 ≤ 0 的结果
print(c1 - c2)  # Counter({'a': 2})  ← b: 1-2=-1，丢弃

# subtract：原地修改，保留负数
c1.subtract(c2)
print(c1)  # Counter({'a': 2, 'b': -1})  ← b 的 -1 被保留
```

**问题三：如何用 Counter 找出两个字符串的公共字符（考虑出现次数）？**

```python
from collections import Counter
# 公共字符 = Counter 的交集 &
common = Counter("aabbc") & Counter("abcc")
print(common)        # Counter({'a': 1, 'b': 1, 'c': 1})
print(list(common.elements()))  # ['a', 'b', 'c']
```

### 5.6 实战串讲：用户行为分析

把本篇的核心用法串进一个完整场景——电商用户行为日志分析：

```python
import re
from collections import Counter

# 模拟一批用户行为日志
logs = [
    "view:home, click:product, view:detail, add:cart, view:home",
    "view:home, search:shoes, view:detail, view:detail",
    "view:home, click:product, add:cart, buy:shoes",
]

# 1. 解析所有行为，统计总量
actions = []
for log in logs:
    actions.extend(re.findall(r"(\w+):\w+", log))
total = Counter(actions)
print("行为总量:", total)
# Counter({'view': 7, 'click': 2, 'add': 2, 'search': 1, 'buy': 1})

# 2. Top-3 高频行为
print("Top-3:", total.most_common(3))
# [('view', 7), ('click', 2), ('add', 2)]

# 3. 按用户分别统计
user_counters = [Counter(re.findall(r"(\w+):\w+", log)) for log in logs]

# 4. 所有用户都做过的行为（交集）
common_actions = user_counters[0]
for uc in user_counters[1:]:
    common_actions &= uc
print("共有行为:", common_actions)  # Counter({'view': 2})

# 5. 总行为量（所有用户行为加起来）
all_actions = sum(user_counters, Counter())
print("总行为:", all_actions)  # 和 total 一致

# 6. 过滤掉只出现 1 次的行为（噪音）
significant = +Counter({k: v for k, v in total.items() if v >= 2})
print("显著行为:", significant)
```

这个场景完整用到了：`Counter(iterable)` 创建、`most_common` 查 Top-N、`&` 取交集、字典推导过滤低频。每一处运算的语义都和业务需求直接对应——`Counter` 把"频次分析"变成了"声明式操作"。

### 5.7 延伸

`Counter` 是字典家族中专一度最高的成员——它只做一件事（计数），但做到了极致。理解它之后，整个"键缺失自动默认"和"计数"的选择矩阵就很清晰了：

- 纯计数，要 Top-N 和集合运算 → **Counter**
- 计数混在字典操作里，不需要 Top-N → **defaultdict(int)**
- 不是计数，只是某些键需要默认值 → **setdefault**（局部）、**defaultdict**（全局）
- 需要重排键、顺序比较、从头部弹出 → 上一篇的 **OrderedDict**
- 想从底层理解 `__missing__` 钩子 → 倒数第二篇 **字典底层原理哈希表**

`Counter` 完结之后，字典家族中"默认值"和"计数"两大分支都已经讲透。下一站进入字典的日常操作遍历——`【07】字典遍历`，聚焦 `items()`/`keys()`/`values()` 的性能差异、遍历中修改字典的安全方式、以及各种遍历模式的选择边界。
