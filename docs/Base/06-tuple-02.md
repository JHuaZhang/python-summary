---
group:
  title: 【06】元组深度剖析
  order: 6
order: 2
title: 元组不可变性的边界
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是元组的不可变性

元组（Tuple）在 Python 中被定义为不可变序列类型，这意味着元组一旦创建后，就不能添加、删除或修改其中的元素。但 "不可变性" 这个概念在 Python 中远比表面看起来复杂。许多初学者会误以为元组中的元素 "完全不能改变"，而实际上元组的不可变性有其边界和特殊情况。

```python
# 基本的不可变性
point = (10, 20)
# point[0] = 15  # TypeError: 'tuple' object does not support item assignment

# 但元组中如果包含可变对象，这些可变对象却可以修改
mixed = (1, 2, [3, 4])
mixed[2].append(5)
print(mixed)  # 输出：(1, 2, [3, 4, 5]) —— 列表被修改了！
```

这种 "表面不可变，实际有变化" 的行为，正是本篇要深入探讨的内容。理解元组不可变性的边界，对于编写健壮的 Python 代码、避免潜在的 bug 至关重要。

### 1.2 理解不可变性的不同层次

Python 中的不可变性可以从三个层次来理解：

| 层次 | 含义 | 示例 |
|-----|------|------|
| 引用不可变 | 不能改变元素指向的对象 | `t[0] = 100` 报错 |
| 内容不可变 | 元素引用的对象本身不可变 | `t = (1, 2, 3)` 确实不能改 |
| 浅层不可变 | 仅第一层引用不可变 | `t = (1, [], {})` 元组本身不能改，但内部可变 |

```python
# 引用不可变示例
t = (1, 2, 3)
# t[0] = 100  # 报错，不能改变 t[0] 的引用

# 内容不可变示例（不可变对象）
t = (1, "hello", (2, 3))
# t[1] = "world"  # 报错，不能改变引用
# t[2][0] = 200  # 报错，不能修改元组中的元组

# 浅层不可变示例（包含可变对象）
t = (1, [2, 3], {"a": 1})
t[1].append(4)  # 可以！列表是可变的
print(t)  # 输出：(1, [2, 3, 4], {'a': 1})
```

### 1.3 理解边界的重要性

知道元组不可变性的边界，对于以下场景至关重要：

- **字典键使用**：只有完全不可变的元素才能作为字典键
- **集合成员**：只有可哈希的对象才能放入集合
- **函数参数传递**：不可变参数可以安全共享，可变参数需要拷贝
- **缓存与哈希**：不可变对象可以作为缓存键

```python
# 作为字典键
location = (37.7749, -122.4194)  # 经纬度
places = {location: "San Francisco", (40.7128, -74.0060): "New York"}

# 作为集合成员
unique_points = {(0, 0), (1, 1), (2, 2)}

# 包含列表的元组不能作为字典键
# bad_key = ([1, 2], [3, 4])  # TypeError: unhashable type: 'list'
```

## 2. 核心内容

### 2.1 元组不可变的正确理解

#### 2.1.1 什么是真正的不可变

元组的不可变性指的是：元组对象的引用数组不能被修改。具体来说：

- 不能通过索引赋值来改变元素
- 不能添加或删除元素
- 不能修改元素之间的顺序

```python
# 这些操作都不允许
t = (1, 2, 3, 4, 5)

# ❌ 不能通过索引修改
# t[0] = 100  # TypeError

# ❌ 不能添加元素
# t.append(6)  # AttributeError: 'tuple' object has no attribute 'append'

# ❌ 不能删除元素
# t.remove(1)  # AttributeError

# ❌ 不能插入元素
# t.insert(0, 0)  # AttributeError
```

#### 2.1.2 不可变意味着什么

元组的不可变性带来以下特性：

```python
# 1. 可以作为字典的键
point = (10, 20)
d = {point: "origin"}
print(d)  # 输出：{(10, 20): 'origin'}

# 2. 可以放入集合
s = {(1, 2), (3, 4), (5, 6)}
print(s)  # 输出：{(1, 2), (3, 4), (5, 6)}

# 3. 可以被哈希
h = hash((1, 2, 3))
print(h)  # 输出：hash 值

# 4. 可以安全共享引用
def process(data):
    # 函数内部无法修改传入的元组
    # data[0] = 100  # TypeError
    return data

t = (1, 2, 3)
result = process(t)
print(f"原始元组: {t}")  # 输出：(1, 2, 3)
print(f"返回值相同: {result is t}")  # 输出：True
```

### 2.2 包含可变元素的元组

#### 2.2.1 元组中可以包含可变对象

最常见的边界情况是：元组本身不可变，但它的元素可以是可变对象（列表、字典、集合）：

```python
# 常见的陷阱：元组包含列表
t = (1, 2, [3, 4])
print(f"原始元组: {t}")  # 输出：(1, 2, [3, 4])

# 修改列表元素
t[2][0] = 30
print(f"修改列表元素后: {t}")  # 输出：(1, 2, [30, 4])

# 向列表添加元素
t[2].append(5)
print(f"追加元素后: {t}")  # 输出：(1, 2, [30, 4, 5])

# 修改字典
t2 = (1, {"name": "Alice"}, [10, 20])
t2[1]["age"] = 30
print(f"修改字典后: {t2}")  # 输出：(1, {'name': 'Alice', 'age': 30}, [10, 20])
```

#### 2.2.2 为什么允许包含可变对象

这实际上是 Python 设计上的一个权衡。严格来说，如果要求元组中所有元素都必须是完全不可变的，会大大限制元组的实用性：

```python
# 场景：存储用户信息，部分字段需要灵活变化
user = ("user123", ["reading", "swimming"], {"last_login": "2024-01-01"})
# 用户可以有多个爱好（列表），需要增删
# 用户的属性可能需要更新（字典）

# 如果元组要求所有元素都不可变，很多实用场景就无法实现

# 正确的理解：
# - 元组本身不可变（不能用 t[0] = x 来修改引用）
# - 但可以修改元组元素内部引用的可变对象
# - 前提是：你知道你在做什么
```

#### 2.2.3 这是一个设计权衡

Python 选择了实用主义而非严格不可变：

```python
# 严格不可变的要求下，这些都会报错：
# t = (1, [2, 3])  # 包含列表，违反"完全不可变"
# t = (1, {2: 3})  # 包含字典，违反"完全不可变"

# Python 选择了更灵活的方式：
# 元组的不可变性 = 元组引用的数组不可变
# 元组元素的可变性 = 元素自己的属性，不归元组管
```

### 2.3 不可哈希的情况

#### 2.3.1 什么是哈希

哈希（Hash）是 Python 中用于快速查找的机制。可哈希的对象具有稳定的哈希值，可以作为字典键或放入集合中：

```python
# 可哈希的对象
print(hash(1))           # 整数可哈希
print(hash("hello"))     # 字符串可哈希
print(hash((1, 2, 3)))   # 元组可哈希（前提是所有元素都可哈希）

# 不可哈希的对象
# print(hash([1, 2, 3]))  # 列表不可哈希
# print(hash({1: 2}))     # 字典不可哈希
# print(hash({1, 2, 3}))  # 集合不可哈希
```

#### 2.3.2 包含可变元素的元组不可哈希

这是元组不可变性边界的另一个重要表现：

```python
# 可哈希的元组
t1 = (1, 2, 3)
print(hash(t1))  # 输出：529344067295497451

# 包含列表的元组不可哈希
t2 = (1, 2, [3, 4])
# hash(t2)  # TypeError: unhashable type: 'list'

# 包含字典的元组不可哈希
t3 = (1, {"a": 1})
# hash(t3)  # TypeError: unhashable type: 'dict'

# 包含集合的元组不可哈希
t4 = (1, {2, 3})
# hash(t4)  # TypeError: unhashable type: 'set'
```

#### 2.3.3 为什么可变对象不可哈希

可变对象的哈希值会随着内容变化，这会破坏哈希表的一致性：

```python
# 如果列表可哈希，会发生什么
d = {}
d[[1, 2]] = "value"  # 假设允许

# 修改列表
lst = [1, 2]
d[lst] = "first"
lst.append(3)

# 现在 d[lst] 应该找哪个位置？
# 哈希值已经变了，原来存的位置找不到了！
# 这就是为什么可变对象不可哈希

# 元组同理
t = (1, [2, 3])
hash(t)  # 如果允许，修改列表后哈希值就变了
```

#### 2.3.4 实践中的影响

```python
# 作为字典键
# ✅ 正确：所有元素都可哈希
location = (37.7749, -122.4194)
d = {location: "San Francisco"}

# ❌ 错误：包含不可哈希元素
# bad_location = (37.7749, [1, 2])
# d[bad_location] = "error"  # TypeError

# 作为集合成员
# ✅ 正确
s = {(1, 2), (3, 4)}
s.add((5, 6))

# ❌ 错误
# s.add((1, [2, 3]))  # TypeError

# 使用 in 检查
tup = (1, [2, 3])
# if tup in some_set:  # TypeError if some_set contains this tuple
```

### 2.4 元组的 "修改" 方式

#### 2.4.1 重新赋值而非修改

虽然不能修改元组本身，但可以通过重新赋值来 "改变"：

```python
# 不能修改元组，但可以创建新的元组
point = (10, 20)
print(f"原始: {point}")  # 输出：(10, 20)

# 重新赋值
point = (15, 25)
print(f"重新赋值后: {point}")  # 输出：(15, 25)

# 注意：这是创建了新的元组对象，原始元组不变
# 原来的 (10, 20) 如果没有被引用，会被垃圾回收
```

#### 2.4.2 通过操作创建新元组

利用元组的方法创建新元组：

```python
# 使用 + 连接运算符
t1 = (1, 2, 3)
t2 = (4, 5, 6)
t3 = t1 + t2  # 创建新元组
print(t3)  # 输出：(1, 2, 3, 4, 5, 6)

# 使用 * 重复运算符
t4 = (1, 2) * 3
print(t4)  # 输出：(1, 2, 1, 2, 1, 2)

# 使用切片创建新元组
t5 = (1, 2, 3, 4, 5)
t6 = t5[1:4]  # 切片返回新元组
print(t6)  # 输出：(2, 3, 4)

# 使用 tuple() 转换
t7 = tuple(x * 2 for x in range(5))
print(t7)  # 输出：(0, 2, 4, 6, 8)
```

#### 2.4.3 修改元组中的可变元素

```python
# 场景：修改元组中的列表元素
data = (1, [2, 3], 4)
print(f"原始: {data}")  # 输出：(1, [2, 3], 4)

# 修改列表内容
data[1][0] = 200
print(f"修改后: {data}")  # 输出：(1, [200, 3], 4)

# 替换整个列表
data = (1, [2, 3], 4)
data = (1, [100, 200], 4)  # 这是创建新元组，不是修改原元组
print(f"替换后: {data}")  # 输出：(1, [100, 200], 4)
```

### 2.5 嵌套元组的不可变性

#### 2.5.1 嵌套元组的层次结构

元组可以嵌套，嵌套的每一层都有其不可变性：

```python
# 多层嵌套
nested = (1, (2, (3, (4, 5))))
print(nested)  # 输出：(1, (2, (3, (4, 5))))

# 不能修改任何一层
# nested[0] = 100          # 报错：第一层
# nested[1][0] = 200       # 报错：第二层
# nested[1][1][0] = 300   # 报错：第三层
```

#### 2.5.2 嵌套元组中的可变对象

嵌套元组中可以包含列表，这些列表仍然可以修改：

```python
# 嵌套结构中包含列表
complex_nested = (
    (1, 2, 3),
    [4, 5, 6],
    {"a": 1, "b": 2}
)

print(f"原始: {complex_nested}")
# 输出：((1, 2, 3), [4, 5, 6], {'a': 1, 'b': 2})

# 修改列表（可以）
complex_nested[1][0] = 40
print(f"修改列表后: {complex_nested}")
# 输出：((1, 2, 3), [40, 5, 6], {'a': 1, 'b': 2})

# 修改字典（可以）
complex_nested[2]["c"] = 3
print(f"修改字典后: {complex_nested}")
# 输出：((1, 2, 3), [40, 5, 6], {'a': 1, 'b': 2, 'c': 3})

# 但不能替换元组中的任何元素
# complex_nested[0] = (100, 200, 300)  # 报错
```

### 2.6 元组不可变性的实际应用

#### 2.6.1 作为字典键

```python
# 坐标作为键
city_coords = {
    (39.9042, 116.4074): "北京",
    (31.2304, 121.4737): "上海",
    (22.5431, 114.0579): "深圳",
}

# 查询
print(city_coords[(39.9042, 116.4074)])  # 输出：北京
```

#### 2.6.2 在集合中去除重复

```python
# 使用元组去重
items = [(1, 2), (3, 4), (1, 2), (5, 6)]
unique = set(items)
print(unique)  # 输出：{(1, 2), (3, 4), (5, 6)}

# 列表无法去重
items_list = [[1, 2], [3, 4], [1, 2]]
# unique_list = set(items_list)  # TypeError: unhashable type: 'list'
```

#### 2.6.3 作为函数返回值

```python
# 函数返回多个值（实际返回元组）
def get_stats(numbers):
    return min(numbers), max(numbers), sum(numbers) / len(numbers)

min_val, max_val, avg_val = get_stats([1, 2, 3, 4, 5])
print(f"最小: {min_val}, 最大: {max_val}, 平均: {avg_val}")
# 输出：最小: 1, 最大: 5, 平均: 3.0
```

#### 2.6.4 多线程共享

```python
import threading

# 元组可以安全在线程间共享
shared_data = (1, 2, 3)

def worker():
    # 只读访问，完全安全
    print(f"线程读取: {shared_data}")

threads = [threading.Thread(target=worker) for _ in range(3)]
for t in threads:
    t.start()
```

## 3. 最佳实践

### 3.1 使用不可变数据结构的场景

**场景一：字典键**

```python
# ✅ 推荐：使用元组作为字典键
def lookup_city(cities, lat, lon):
    key = (round(lat, 2), round(lon, 2))
    return cities.get(key, "未知")

cities = {
    (39.90, 116.41): "北京",
    (31.23, 121.47): "上海",
}
print(lookup_city(cities, 39.904, 116.407))  # 输出：北京
```

**场景二：集合成员**

```python
# ✅ 推荐：使用元组作为集合成员
def find_unique_points(points):
    return set(points)

points = [(0, 0), (1, 1), (0, 0), (2, 2)]
print(find_unique_points(points))  # 输出：{(0, 0), (1, 1), (2, 2)}
```

**场景三：函数参数**

```python
# ✅ 推荐：使用元组作为不可变参数
def process_config(host, port, debug):
    print(f"配置: {host}:{port}, debug={debug}")

config = ("localhost", 8080, True)
process_config(*config)  # 解包传递
# 输出：配置: localhost:8080, debug=True
```

### 3.2 避免可变元素问题

**原则：尽量避免在元组中放入可变对象**

```python
# ❌ 不推荐：元组中包含列表
data = (1, [2, 3], 4)

# ✅ 推荐：使用元组，但不修改可变元素
data = (1, 2, 3, 4)

# ✅ 或者：如果确实需要存储可变对象，明确注释
# data = (ids, items, metadata)
# # 注意：data[1] 是列表，可以修改，但不应依赖此行为
```

### 3.3 安全处理包含可变元素的元组

如果必须使用包含可变元素的元组，采用安全的方式：

```python
# 防御性拷贝
def safe_copy_tuple(t):
    """安全拷贝元组，深度拷贝可变元素"""
    result = []
    for item in t:
        if isinstance(item, list):
            result.append(item.copy())
        elif isinstance(item, dict):
            result.append(item.copy())
        elif isinstance(item, set):
            result.copy(item)
        else:
            result.append(item)
    return tuple(result)

# 测试
original = (1, [2, 3], {"a": 4})
copied = safe_copy_tuple(original)

copied[1].append(999)
print(f"original: {original}")  # 输出：(1, [2, 3], {'a': 4})
print(f"copied: {copied}")  # 输出：(1, [2, 3, 999], {'a': 4})
```

### 3.4 类型注解中的元组

使用类型注解明确元组的不可变性期望：

```python
from typing import Tuple, List, Dict

# 固定类型和长度的元组
point: Tuple[int, int] = (10, 20)

# 可变长度的元组
coords: Tuple[int, ...] = (1, 2, 3, 4, 5)

# 混合类型
mixed: Tuple[int, str, bool] = (1, "hello", True)

# 注意：类型注解不能阻止运行时修改
# 但可以借助 mypy 等静态检查工具发现潜在问题
```

## 4. 原理

### 4.1 CPython 中元组的实现

元组在 CPython 中是固定大小的对象：

```c
// 简化版的元组对象结构
typedef struct {
    PyObject_VAR_HEAD      // 包含引用计数和类型指针
    PyObject *ob_item[1];  // 元素指针数组
} PyTupleObject;
```

关键点：
- `ob_item` 是指向元素对象的指针数组
- 一旦创建，数组大小就固定了
- 没有 `append`、`insert` 等方法来修改数组大小
- 这就是元组 "不可变" 的底层实现

### 4.2 哈希的实现机制

对象的哈希值是在创建时计算的，并存储在对象头中：

```python
# 可哈希对象的特征
t = (1, 2, 3)
print(f"哈希值: {hash(t)}")

# 多次哈希同一对象，返回相同值
print(f"再次哈希: {hash(t)}")
print(f"相同: {hash(t) == hash(t)}")  # 输出：True
```

当对象包含可变元素时，哈希值会变化，这违反了哈希表的契约：

```python
# 如果元组可哈希但包含可变元素
t = (1, [2, 3])
h1 = hash(t)  # 假设哈希值是 X

t[1].append(4)  # 修改列表

# 如果允许哈希，现在哈希值应该是 Y
# 但字典/集合 仍然用 X 来查找，就找不到了！
# 所以必须禁止这种元组被哈希
```

### 4.3 内存布局

```python
import sys

# 元组 vs 列表的内存对比
t = (1, 2, 3, 4, 5)
l = [1, 2, 3, 4, 5]

print(f"元组大小: {sys.getsizeof(t)} bytes")
print(f"列表大小: {sys.getsizeof(l)} bytes")

# 元组更小，因为它不需要额外的空间来支持动态增长
# 列表预分配了一些空间，以优化 append 操作
```

元组为什么更小：
- 精确分配内存，不预留空间
- 没有 `ob_size` 以外的额外字段
- 没有用于动态增长的缓冲区

## 5. 总结

### 5.1 核心要点回顾

本文深入剖析了元组不可变性的边界：

1. **元组不可变的含义**：引用数组不可变，而非"所有内容完全不能动"
2. **包含可变元素**：元组可以包含列表、字典等可变对象，这些对象的内部可以修改
3. **不可哈希问题**：包含可变元素的元组不能作为字典键或放入集合
4. **正确修改方式**：通过创建新元组来实现"修改"，而非原地修改
5. **实际应用**：字典键、集合成员、线程安全、多值返回

### 5.2 不可变性边界速查表

| 场景 | 是否允许 | 说明 |
|-----|---------|------|
| `t[0] = x` | ❌ 报错 | 不能修改元素引用 |
| `t.append(x)` | ❌ 报错 | 元组没有此方法 |
| `t[1].append(x)` | ✅ 允许 | 列表是可变对象 |
| `hash(t)` | ❌ 报错 | 元组所有元素必须可哈希 |
| `d[t] = value` | ❌ 报错 | t 不可哈希 |
| `t = t + (x,)` | ✅ 创建新元组 | 原有元组不变 |
| `(1, [2])[1].clear()` | ✅ 允许 | 但可能导致意外行为 |

### 3.3 读完应能掌握

- 能区分"元组引用不可变"和"元组元素内容不可变"
- 能说明为什么包含列表的元组仍然可以作为元组使用
- 能解释为什么包含可变元素的元组不可哈希
- 能在实际编程中正确选择使用元组还是列表
- 能避免因元组不可变性边界不清晰导致的 bug

### 5.5 常见面试问题

**问题一：元组和列表的区别是什么**

这是 Python 基础面试必答题：

```python
# 主要区别
list1 = [1, 2, 3]   # 列表用方括号，可变
tuple1 = (1, 2, 3)  # 元组用圆括号，不可变

# 元组的方法更少
print(dir(list1))  # 更多方法：append, insert, remove, pop...
print(dir(tuple1)) # 只有：count, index

# 元组可以作为字典键
d = {(1, 2): "value"}
# d = {[1, 2]: "value"}  # 报错：列表不可哈希

# 元组通常更轻量，性能更好
import sys
print(f"列表: {sys.getsizeof([1,2,3])}")  # 更大
print(f"元组: {sys.getsizeof((1,2,3)))}")  # 更小
```

**问题二：下面的代码有什么问题**

```python
# 面试题：这段代码输出什么？为什么？
t = (1, [2, 3])
t[1].append(4)
print(t)  # 输出：(1, [2, 3, 4]) —— 元组元素引用未变，但列表内容变了
```

```python
# 扩展：可以这样修改元组吗？
t = (1, [2, 3])
# t[1] = [2, 3, 4]  # TypeError！不能修改元组元素的引用

# 但可以通过创建新元组实现"修改"
t = (1, [2, 3])
t = (1, [2, 3, 4])  # 创建新元组，原来的被回收
print(t)  # 输出：(1, [2, 3, 4])
```

**问题三：如何判断一个元组是否可哈希**

```python
def is_hashable(obj):
    """判断对象是否可哈希"""
    try:
        hash(obj)
        return True
    except TypeError:
        return False

# 测试
print(is_hashable((1, 2, 3)))  # True
print(is_hashable((1, [2, 3])))  # False：包含列表
print(is_hashable((1, {"a": 1})))  # False：包含字典
print(is_hashable([1, 2, 3]))  # False：列表不可哈希
```

### 5.6 实际项目中的使用案例

**案例一：配置管理中的不可变数据**

```python
# 使用元组存储系统配置
DatabaseConfig = tuple
class Config:
    # 数据库配置（元组：主机，端口，数据库名）
    DB_CONFIG: Tuple[str, int, str] = ("localhost", 5432, "myapp")
    
    # Redis 配置
    REDIS_CONFIG: Tuple[str, int] = ("localhost", 6379)
    
    # 应用配置
    APP_CONFIG: Tuple[str, int, str, bool] = (
        "0.0.0.0", 8080, "production", True
    )

# 访问配置
print(Config.DB_CONFIG)
# 输出：('localhost', 5432, 'myapp')

# 配置不可变的好处：
# 1. 可以作为字典键
# 2. 可以安全在线程间传递
# 3. 不会意外被修改
```

**案例二：坐标系统**

```python
# 使用 (x, y) 元组表示坐标
class MapSystem:
    def __init__(self):
        self.buildings = {}
    
    def add_building(self, name: str, coords: Tuple[float, float]):
        """添加建筑物及其坐标"""
        # 坐标作为字典键，必须可哈希
        # (float, float) 是可哈希的，因为浮点数不可变
        self.buildings[coords] = name
    
    def find_nearest(self, target: Tuple[float, float]) -> str:
        """查找最近的建筑物"""
        min_dist = float('inf')
        nearest = None
        
        for coords, name in self.buildings.items():
            dist = ((coords[0] - target[0])**2 + 
                   (coords[1] - target[1])**2) ** 0.5
            if dist < min_dist:
                min_dist = dist
                nearest = name
        
        return nearest

# 使用
map_system = MapSystem()
map_system.add_building("商场", (10.0, 20.0))
map_system.add_building("医院", (15.0, 25.0))
map_system.add_building("学校", (5.0, 10.0))

print(map_system.find_nearest((12.0, 22.0)))  # 输出：商场
```

**案例三：状态机**

```python
# 使用不可变元组定义状态转换
class OrderState:
    """订单状态机"""
    # 状态定义：(状态名, 是否可支付, 是否可发货, 是否可完成)
    PENDING = ("待支付", True, False, False)
    PAID = ("已支付", False, True, False)
    SHIPPED = ("已发货", False, False, True)
    COMPLETED = ("已完成", False, False, False)
    CANCELLED = ("已取消", False, False, False)

def get_available_actions(state: Tuple[str, bool, bool, bool]) -> list:
    """获取当前状态可用的动作"""
    name, can_pay, can_ship, can_complete = state
    
    actions = []
    if can_pay:
        actions.append("支付")
    if can_ship:
        actions.append("发货")
    if can_complete:
        actions.append("完成")
    
    return actions

# 测试
print(get_available_actions(OrderState.PENDING))
# 输出：['支付']

print(get_available_actions(OrderState.PAID))
# 输出：['发货']
```

**案例四：数据记录**

```python
# 使用不可变元组作为数据记录
from datetime import datetime
from typing import Tuple

# 定义记录类型
LogRecord = Tuple[str, str, datetime, str]  # (级别, 消息, 时间, 来源)

def create_log(level: str, message: str, source: str) -> LogRecord:
    """创建日志记录"""
    return (level, message, datetime.now(), source)

# 记录日志
logs = []
logs.append(create_log("INFO", "服务启动", "main"))
logs.append(create_log("ERROR", "连接失败", "db"))
logs.append(create_log("WARNING", "内存使用率高", "monitor"))

# 查询特定级别的日志
error_logs = [log for log in logs if log[0] == "ERROR"]
for log in error_logs:
    print(f"[{log[0]}] {log[1]} - 来源: {log[3]}")
# 输出：[ERROR] 连接失败 - 来源: db
```

### 5.7 总结：元组不可变性要点

理解元组不可变性需要把握以下几个关键点：

1. **理解"不可变"的含义**：元组的不可变是指元组对象中引用数组不可变，而不是里面的元素内容完全不能改变。

2. **区分可变与不可变对象**：数字、字符串、元组是不可变对象；列表、字典、集合是可变对象。

3. **哈希与可哈希**：只有完全不可变的对象（及其嵌套内容）才是可哈希的，才能作为字典键或放入集合。

4. **实际使用场景**：
   - 需要作为字典键时使用元组
   - 需要在集合中去重时使用元组
   - 需要在线程间安全共享时使用元组
   - 需要返回多个值时使用元组

5. **避免的陷阱**：
   - 不要在元组中放入可变对象，除非你明确知道需要这个特性
   - 不要依赖修改元组中可变元素的行为
   - 注意包含可变元素的元组不可哈希

### 5.8 延伸学习

- **frozenset**：完全不可变的集合
- **immutable.js**：函数式编程中的不可变数据结构
- **dataclasses + frozen=True**：Python 3.7+ 的不可变数据类
- **pyrsistent**：Python 不可变数据结构库
