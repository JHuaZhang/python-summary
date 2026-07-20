---
group:
  title: 【07】字典深度剖析
  order: 7
order: 7
title: 字典遍历
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是字典遍历

字典遍历就是以某种顺序逐个访问字典中的键（key）、值（value）或键值对（item）。这看起来是最基础的操作——`for k in d` 几行代码而已——但实际上 Python 提供了至少六种遍历路径，每一种在可读性、性能、安全性上都有自己的适用边界。

```python
d = {"a": 1, "b": 2, "c": 3}

# 方式一：直接迭代字典 → 得到键
for k in d:
    print(k, d[k])

# 方式二：迭代 keys()
for k in d.keys():
    print(k, d[k])

# 方式三：迭代 values()
for v in d.values():
    print(v)

# 方式四：迭代 items()
for k, v in d.items():
    print(k, v)

# 方式五：反向迭代
for k in reversed(d):
    print(k, d[k])

# 方式六：按排序键迭代
for k in sorted(d):
    print(k, d[k])
```

既然直接 `for k in d` 就能得到键，为什么还要学这么多？因为不同的遍历方式在"要不要值""要不要同时拿到键和值""要不要按特定顺序""是否需修改字典""大字典的性能"这些维度上有完全不同的取舍。掌握全部遍历方式的意义在于：看到一个具体需求，你能立刻写出最高效、最不易出 bug 的那一种。

### 1.2 Python 3.7+ 字典保序对遍历的影响

从 Python 3.7 起，普通 `dict` 保证**插入顺序**——遍历顺序和键被插入的顺序一致。这是一个重大的语义变更：之前遍历顺序是"任意"的（不可预测、取决于哈希表布局），之后是"确定"的（可预测、和插入过程一致）。

```python
# Python 3.7+
d = {}
d["c"] = 1
d["a"] = 2
d["b"] = 3

# 遍历顺序严格等于插入顺序
for k in d:
    print(k, end=" ")   # 输出：c a b
```

这篇笔记中的所有内容都假设 Python ≥ 3.7，遍历顺序 = 插入顺序。如果你的代码需要兼容 3.6 及更早版本，要用 `OrderedDict` 才能保证遍历顺序。既然我们已经在前一篇讲完了 `OrderedDict`，本篇不再赘述"老 Python 下如何保序遍历"——那已经是 `OrderedDict` 的活。

### 1.3 遍历的底层：视图对象

理解遍历的第一步，是理解 `keys()`、`values()`、`items()` 返回的**不是列表，而是视图对象（view object）**。视图是一个"活的窗口"——它不复制数据，而是直接反映字典的当前状态。字典变了，视图随之变化：

```python
d = {"a": 1, "b": 2}
keys_view = d.keys()

print("a" in keys_view)  # 输出：True

d["c"] = 3               # 修改字典
print("c" in keys_view)  # 输出：True   ← 视图自动反映新增的键

del d["a"]               # 删除键
print("a" in keys_view)  # 输出：False  ← 视图自动反映删除
```

视图对象的三个关键特性贯穿全篇：

1. **零拷贝**：调用 `keys()` / `values()` / `items()` 本身不需要复制任何数据，只是创建了一个指向字典内部结构的"观察口"。
2. **实时反映**：视图看到的永远是字典的"当前状态"，字典变化后视图立刻变化。
3. **支持集合操作**：`keys()` 和 `items()` 的视图支持 `in`、`&`、`|`、`-`、`^` 等集合运算（但 `values()` 通常不支持，因为值可能不唯一）。

```python
d1 = {"a": 1, "b": 2, "c": 3}
d2 = {"b": 20, "c": 30, "d": 40}

# 键视图的集合运算
print(d1.keys() & d2.keys())   # 输出：{'b', 'c'}  ← 交集
print(d1.keys() - d2.keys())   # 输出：{'a'}       ← 差集
print(d1.keys() | d2.keys())   # 输出：{'a', 'b', 'c', 'd'}  ← 并集
```

视图的零拷贝特性是大字典遍历的关键——你不需要 `list(d.keys())` 来拿到键，直接迭代视图就足够且更高效。只有当你真的需要一个独立快照（比如遍历过程中要修改字典）时，才需要显式 `list()` 拷贝一份。

## 2. 核心内容

### 2.1 遍历键：for k in d vs for k in d.keys()

直接迭代字典对象（`for k in d`）和迭代 `d.keys()` 在行为上完全等价——两者都遍历键的视图，按插入顺序迭代：

```python
d = {"c": 3, "a": 1, "b": 2}

# 方式一：直接迭代字典
for k in d:
    print(k, end=" ")   # 输出：c a b

# 方式二：迭代 keys() 视图
for k in d.keys():
    print(k, end=" ")   # 输出：c a b
```

二者几乎一样，但有细微差异：

|          | `for k in d`           | `for k in d.keys()`            |
| -------- | ---------------------- | ------------------------------ |
| 可读性   | 更简洁                 | 意图更明确（"我在显式操作键"） |
| 性能     | 略快（少一次属性访问） | 略慢                           |
| 传参     | 传的是 dict 对象       | 传的是键视图                   |
| 何时推荐 | 大多数场合             | 需要把键集合传给别的函数时     |

**推荐原则**：遍历取值只用 `for k in d`；如果要把键的集合传给别的函数做集合运算，用 `d.keys()` 而不是 `set(d)`——前者是 O(1) 的视图引用，后者是 O(n) 的全量拷贝。

```python
d1 = {"a": 1, "b": 2}
d2 = {"b": 3, "c": 4}

# ✅ 推荐：keys() 视图做集合运算，零拷贝
common = d1.keys() & d2.keys()
print(common)  # 输出：{'b'}

# ❌ 不推荐：转成 set 再做集合运算，有拷贝开销
# common = set(d1) & set(d2)
```

### 2.2 遍历值：for v in d.values()

`d.values()` 返回值的视图，按插入顺序（对应键的顺序）迭代：

```python
d = {"c": 3, "a": 1, "b": 2}

for v in d.values():
    print(v, end=" ")   # 输出：3 1 2
```

值的视图和键的视图有一个关键区别：**值可能重复，所以不支持集合运算**（`&` `|` `-` ^ 都不行），但支持 `in` 成员检查：

```python
d = {"a": 1, "b": 2, "c": 1}

print(1 in d.values())  # 输出：True

# 集合运算不可用（值可能重复，无法保证集合语义）
# d.values() & {1, 2}  # TypeError: unsupported operand type(s) for &: 'dict_values' and 'set'
```

遍历值的高频场景是"不关心键是谁，只关心值有什么"——比如统计数值分布、求最大最小值：

```python
scores = {"Alice": 85, "Bob": 92, "Carol": 78, "Dave": 92}

# 最高分
print(max(scores.values()))   # 输出：92

# 平均分
print(sum(scores.values()) / len(scores))  # 输出：86.75
```

### 2.3 遍历键值对：for k, v in d.items()

`d.items()` 返回 `(key, value)` 元组的视图，按插入顺序迭代：

```python
d = {"c": 3, "a": 1, "b": 2}

for k, v in d.items():
    print(f"{k}: {v}")
# 输出：
# c: 3
# a: 1
# b: 2
```

这是最常用的遍历方式——当你同时需要键和值时，`items()` 一次迭代同时拿到两者，不需要额外一次 `d[k]` 取值：

```python
# ✅ 推荐：items() 直接拿键和值
for k, v in d.items():
    process(k, v)

# ❌ 不推荐：先拿键再取值（对不需要取值的场景无所谓，但需要取值时多一次哈希查找）
# for k in d:
#     process(k, d[k])
```

对于大字典，`items()` 避免在循环体内做二次哈希查找，虽然它是微优化，但代码意图也更清晰——读代码的人一眼就知道这段代码同时需要键和值。

`items()` 视图也支持 `in` 成员检查（检查键值对元组是否在视图中），但不常使用：

```python
d = {"a": 1, "b": 2}
print(("a", 1) in d.items())  # 输出：True
print(("a", 2) in d.items())  # 输出：False
```

### 2.4 反向遍历：reversed(d)

Python 3.8 起，`reversed(d)` 可以按插入顺序的**逆序**遍历字典的键：

```python
d = {"c": 3, "a": 1, "b": 2}

for k in reversed(d):
    print(k, end=" ")   # 输出：b a c
```

也支持 `reversed(d.keys())`、`reversed(d.values())`、`reversed(d.items())`（均 Python 3.8+）：

```python
# 反向遍历键值对
for k, v in reversed(d.items()):
    print(f"{k}: {v}", end="  ")
# 输出：b: 2  a: 1  c: 3
```

对于 Python 3.7，普通 `dict` 不支持 `reversed()`，需要改用 `OrderedDict`（它一直支持反向迭代，见前一篇 2.10 节）。

### 2.5 排序遍历：sorted(d)

按键排序遍历——在不需要插入顺序、而是需要"字母序""数值序"等自定义排序时使用：

```python
d = {"banana": 3, "apple": 5, "cherry": 2}

# 按键的字母序遍历
for k in sorted(d):
    print(f"{k}: {d[k]}")
# 输出：
# apple: 5
# banana: 3
# cherry: 2

# 按值的升序遍历
for k in sorted(d, key=d.get):
    print(f"{k}: {d[k]}")
# 输出：
# cherry: 2
# banana: 3
# apple: 5

# 按值降序
for k in sorted(d, key=d.get, reverse=True):
    print(f"{k}: {d[k]}")
# 输出：
# apple: 5
# banana: 3
# cherry: 2
```

也可以对 `items()` 排序：

```python
# 按值排序，同时拿到键和值
for k, v in sorted(d.items(), key=lambda item: item[1]):
    print(f"{k}: {v}")
```

注意 `sorted(d)` 返回一个列表，会**拷贝全部键**，所以对大字典（几百万键），`sorted(d)` 会有 O(n) 的时间和空间开销。如果不关心顺序，直接用 `for k in d` 迭代即可，避免排序开销。

### 2.6 遍历过程中的正向修改

**在遍历字典的过程中修改字典结构（增/删键）是 Python 中最常见的 RuntimeError 来源之一**。Python 显式禁止这种行为——一旦检测到遍历过程中字典大小变了，立刻抛 `RuntimeError: dictionary changed size during iteration`。

```python
d = {"a": 1, "b": 2, "c": 3}

# ❌ 遍历中删除——直接抛错
# for k in d:
#     if k == "b":
#         del d[k]       # RuntimeError: dictionary changed size during iteration
```

为什么会抛错？因为字典的迭代器内部维护了一个版本标记——当遍历开始时，"字典版本号"被记录；每次执行 `next(iter)` 时都会检查当前字典的版本号和记录是否一致。如果增删了键，版本号改变，迭代器检测到变化就抛错。

**解决方案一：遍历拷贝，修改原字典（最常用）**

```python
d = {"a": 1, "b": 2, "c": 3, "d": 4}

# 删除值为偶数的键
for k in list(d.keys()):    # ← list() 创建键的快照（独立于字典）
    if d[k] % 2 == 0:
        del d[k]
print(d)  # 输出：{'a': 1, 'c': 3}
```

`list(d.keys())` 创建一个键的**快照列表**——内存中多了一个独立列表，遍历它而修改字典就不会冲突。也可以用 `list(d)` 代替 `list(d.keys())`，效果一样。

**解决方案二：收集要删的键，遍历完后统一删除**

```python
d = {"a": 1, "b": 2, "c": 3, "d": 4}

to_delete = [k for k, v in d.items() if v % 2 == 0]
for k in to_delete:
    del d[k]
print(d)  # 输出：{'a': 1, 'c': 3}
```

**解决方案三：字典推导创建新字典（推荐：无副作用）**

```python
d = {"a": 1, "b": 2, "c": 3, "d": 4}

# 过滤掉偶数值的键，创建新字典
d = {k: v for k, v in d.items() if v % 2 != 0}
print(d)  # 输出：{'a': 1, 'c': 3}
```

字典推导创建新字典是"遍历修改"问题的最优雅解——它天然不可变风格，不产生迭代冲突，代码也最简洁。如果需要保留原字典对象（因为别处有引用），则回到方案一或方案二。

### 2.7 遍历过程中修改值的特例

**修改已存在键的值**（不增删键）是**安全的**——因为字典大小没变，版本号不变：

```python
d = {"a": 1, "b": 2, "c": 3}

# ✅ 安全：修改已有键的值，不改变字典大小
for k in d:
    d[k] = d[k] * 2
print(d)  # 输出：{'a': 2, 'b': 4, 'c': 6}
```

但要小心：如果你在 `for k in d` 中 `d[new_key] = v` 新增键，遍历长度变了就会抛错。所以这条规则可以精炼为：**只要字典的大小（`len(d)`）不变，遍历就是安全的**。

不过需要注意的是**新增键在遍历过程中的可见性是不确定的**：在当前实现中，新增的键可能出现在当前迭代的后面、也可能不会出现在当前迭代中——这种行为没有明确定义，不应依赖。

### 2.8 enumerate 与字典遍历

字典遍历配合 `enumerate` 可以同时拿到索引和键（或键值对）：

```python
d = {"c": 3, "a": 1, "b": 2}

# 索引 + 键
for i, k in enumerate(d):
    print(f"{i}: {k} = {d[k]}")
# 输出：
# 0: c = 3
# 1: a = 1
# 2: b = 2

# 索引 + 键 + 值
for i, (k, v) in enumerate(d.items()):
    print(f"{i}: {k} = {v}")
```

`enumerate` + 字典遍历的实用场景：给有序输出加行号、对遍历中筛选出的元素记录它在原始顺序中的位置、配合条件判断做"前 N 个满足条件的元素"等。

### 2.9 条件遍历：break 和提前退出

字典遍历中 `break` 完全安全——此时迭代器被释放，不会产生后续冲突：

```python
d = {"a": 1, "b": 2, "c": 3}

# ✅ 安全：找到就 break
for k, v in d.items():
    if v == 2:
        print(f"找到了：{k}")
        break
```

`break` 后对字典的修改操作也没有任何限制——因为迭代器已经结束了：

```python
for k, v in d.items():
    if v == 2:
        break

# break 后迭代器已结束，可以安全修改
d["d"] = 4      # ✅ 安全
del d["a"]      # ✅ 安全
print(d)        # 输出：{'c': 3, 'b': 2, 'd': 4}（顺序取决于插入 和删除历史）
```

### 2.10 性能对比：六种遍历方式的耗时金字塔

不同遍历方式的性能差异主要来自两方面：是否做额外的 `d[k]` 取值（一次哈希查找），是否做 `items()` 元组解包。来看一个粗略的性能排序（最快的在前）：

```python
# 快 → 慢（宏观排序，实际差异在微秒级）
# 1. for k in d                       只迭代键，不取值
# 2. for k in d.keys()                同上 + 一次属性访问
# 3. for v in d.values()              迭代值视图
# 4. for k, v in d.items()            迭代键值对元组（一次解包）
# 5. for k in d: v = d[k]             迭代键 + 每次循环体做 d[k] 哈希查找
```

关键是第 4 和第 5 的对比：`for k, v in d.items()` 把键和值同时产出（内部做了一次解包），而 `for k in d: v = d[k]` 每次都做一次完整的哈希查找 `d[k]`。对大多数字典来说，这个差异在微秒级别，不需要纠结；但在性能敏感的循环体内，优先用 `items()`——省一次查找、而且代码更干净。

但这个性能金字塔有一个例外：如果你循环体内不一定需要值，只在某些条件下才取，那么 `for k in d` + 条件 `d[k]` 可能比 `for k, v in d.items()`（每次都解包）更快——因为你跳过了不需要取值的那些迭代。但这种"选择性取 v"的场景很少。

## 3. 最佳实践

### 3.1 推荐写法 vs 不推荐写法

**需要键和值 → items()，不要 for k in d: v = d[k]**

```python
# ✅ 推荐：items() 一次拿到键和值
for k, v in d.items():
    print(f"{k}: {v}")

# ❌ 不推荐：先拿键再取值（多一次哈希查找 + 代码啰嗦）
# for k in d:
#     print(f"{k}: {d[k]}")
```

**只需要键 → for k in d**

```python
# ✅ 推荐：简洁
for k in d:
    process_key(k)

# ✅ 也 OK：需要把键集传给函数时用 keys()
process_keys(d.keys())
```

**只需要值 → for v in d.values()**

```python
# ✅ 推荐：意图清晰
for v in d.values():
    process_value(v)

# ❌ 不推荐：for k in d: v = d[k]，额外拿了不需要的键
```

**遍历中修改字典 → list() 快照或字典推导**

```python
# ✅ 推荐：字典推导（创建新字典）
d = {k: v for k, v in d.items() if condition(v)}

# ✅ 也 OK：遍历快照修改原字典（当原字典需要原地修改时）
for k in list(d):
    if condition(d[k]):
        del d[k]
```

### 3.2 不要混用遍历方式和修改

```python
d = {"a": 1, "b": 2, "c": 3}

# ❌ 危险：items() 遍历中修改
# for k, v in d.items():
#     if v > 1:
#         del d[k]            # RuntimeError

# ✅ 安全：遍历 list() 快照
for k, v in list(d.items()):
    if v > 1:
        del d[k]
```

### 3.3 sorted(d, key=d.get) 按值排序是大字典的性能陷阱

```python
# ⚠️ sorted(d) 对每个元素调用一次 key 函数（d.get → 一次哈希查找），
#    加上排序本身的 O(n log n)，大字典会很慢。
#    百万键的字典：sorted 约几十毫秒到上百毫秒，可以接受但不要滥用。
top_keys = sorted(d, key=d.get, reverse=True)[:10]
```

对于"只需 Top-N"的需求，`heapq.nlargest(n, d, key=d.get)` 比完整排序更高效——不过差异只在百万级键时才明显。

### 3.4 视图是活的——不要"存下来等会儿用"

```python
d = {"a": 1, "b": 2}
keys = d.keys()          # keys 是视图，指向 d 的键结构

d["c"] = 3               # 字典变了
print(list(keys))        # 输出：['a', 'b', 'c']  ← 视图也变了！

# ✅ 如果需要固定快照，显式 list()
keys_snapshot = list(d.keys())
d["d"] = 4
print(keys_snapshot)     # 输出：['a', 'b', 'c']  ← 快照是固定的
```

视图是"活的"这个特性是把双刃剑：好处是不需要拷贝内存，坏处是你存下来的视图可能在后续代码中意外反映字典的变化。简单原则：**如果你要"保存一份键的清单以后用"，用 `list(d)` 而不是 `d.keys()`**；如果只是"当下遍历一下"，直接用视图即可。

### 3.5 遍历顺序 = 插入顺序，但不要滥用

Python 3.7+ 遍历 = 插入顺序，这让一些代码可以"依赖隐式顺序"：

```python
# 构建某些配置类时，隐式依赖插入顺序
config = {}
config["name"] = "my-app"
config["version"] = "1.0"
config["port"] = 8080

# 遍历按插入顺序
for k, v in config.items():
    write_config_line(k, v)
```

这种"隐式依赖插入顺序"在原型和小型脚本中没问题，但在大中型项目中，插入顺序可能分散在代码的不同位置，不易追踪——有经验的维护者很难一眼看出哪些键在何时插入。如果顺序是业务语义的一部分（如 pipeline stages），优先用 `OrderedDict`（前一篇讲过）或显式用一个 `config_keys_order` 列表——这两种方式都让"顺序很重要"这个意图在代码中显式可见。

### 3.6 大字典视图操作的内存意识

```python
# views 是 O(1) 内存，safe
for k in huge_dict:
    ...

# list(huge_dict.keys()) 会创建一个包含所有键的列表，O(n) 内存
# 只在需要"遍历过程中修改字典"时才用
keys_snapshot = list(huge_dict.keys())
```

`list(d.keys())` 和 `list(d)` 对大字典（百万键）的内存影响：每个键是一个对象引用（8 bytes）+ Python 对象头，粗略估算就是几十 MB。只在确需时拷贝，日常遍历直接用视图。

### 3.7 遍历时的"首次匹配"用 next + 生成器

```python
d = {"a": 1, "b": 2, "c": 3}

# ✅ 找第一个值为偶数的键，一行 next 搞定，短路不会遍历全部
first_even = next((k for k, v in d.items() if v % 2 == 0), None)
print(first_even)  # 输出：b

# ❌ 不推荐：for 循环 + break（功能等价但啰嗦）
# for k, v in d.items():
#     if v % 2 == 0:
#         first_even = k
#         break
```

## 4. 原理

### 4.1 字典迭代器的内部机制

字典的迭代器本质上是在遍历字典的**哈希表条目数组**。Python 3.6+ 的 dict 实现中，条目以插入顺序存储在 `entries` 数组中。迭代器维护一个当前索引，每次 `next()` 时找到下一个非空的条目，返回其键。

```python
# 字典迭代器的简化等价实现
class DictIterator:
    def __init__(self, d):
        self._entries = d._entries      # 条目数组（按插入顺序）
        self._index = 0                 # 当前位置
        self._version = d._version      # 当前字典版本号

    def __next__(self):
        # 检查字典是否被修改
        if self._version != dict._version:
            raise RuntimeError("dictionary changed size during iteration")
        # 跳过空条目，找到下一个非空条目
        while self._index < len(self._entries):
            entry = self._entries[self._index]
            self._index += 1
            if entry is not EMPTY:
                return entry.key
        raise StopIteration
```

这个等价实现解释了几个关键行为：

1. **版本号检查**：每条 `next` 都检查 `self._version` 是否和当前字典一致。增删键会改变版本号，所以抛 `RuntimeError`。
2. **按条目数组顺序迭代**：条目数组以插入顺序排列，所以遍历 = 插入顺序。
3. **跳过空条目**：被删除的条目标记为空（dummy），迭代器跳过它们——这就是为什么删了键再继续遍历不抛错（只要没有新增或再删除）。但要小心：**在迭代器内 `del d[k]` 也会改版本号**，依然抛 RuntimeError——原因是删除会改变字典大小（`len(d)`），触发了版本检查。

### 4.2 keys() / values() / items() 返回视图而非列表

Python 3 中，`keys()` / `values()` / `items()` 返回视图对象（`dict_keys` / `dict_values` / `dict_items`），而不是 Python 2 中的列表。这个改变的核心动机是**零拷贝**：调用这些方法不需要分配新内存，适合大字典场景。

```python
d = {"a": 1, "b": 2}

# Python 3：视图对象，零拷贝
print(type(d.keys()))    # 输出：<class 'dict_keys'>
print(type(d.values()))  # 输出：<class 'dict_values'>
print(type(d.items()))   # 输出：<class 'dict_items'>

# 如果需要 Python 2 式的列表行为，显式转换
key_list = list(d.keys())  # 拷贝一份
```

这个"零拷贝 + 实时反映"的设计是 Python 3 字典遍历性能提升的重要原因——百万键的字典 `d.keys()` 不再需要分配百万个元素。

### 4.3 为什么 values() 视图不支持集合运算

`d.keys()` 支持 `& | - ^` 集合运算，但 `d.values()` 不支持。原因很简单：值可能重复。

```python
d = {"a": 1, "b": 1, "c": 2}

# 键唯一 → keys() 可以实现集合操作
print(d.keys() & {"a", "b"})   # OK

# 值可能重复 → values() 无法保证集合语义
# d.values() & {1, 2}          # TypeError

# 如果需要对值做集合操作，明确转为 set
print(set(d.values()) & {1, 2})  # OK，但 O(n) 拷贝
```

### 4.4 items() 视图的 in 检查为什么是 O(1)

`d.items()` 视图的 `in` 检查（如 `("a", 1) in d.items()`）为什么是 O(1) 而非 O(n)？

```python
d = {"a": 1, "b": 2}
# 这个检查是 O(1)，不是遍历全部条目！
print(("a", 1) in d.items())   # 输出：True
```

原因：`items()` 视图的 `__contains__` 内部分两步——①用哈希表查 `d["a"]`（O(1)）；②比较 `d["a"] == 1`。它不需要遍历全部条目，而是利用字典自身的哈希索引直接定位键。

### 4.5 时间复杂度总表

| 操作                    | 时间复杂度 | 说明               |
| ----------------------- | ---------- | ------------------ |
| `for k in d`            | O(n)       | 遍历所有键         |
| `for v in d.values()`   | O(n)       | 遍历所有值         |
| `for k, v in d.items()` | O(n)       | 遍历所有键值对     |
| `k in d`                | O(1)       | 成员检查，哈希查找 |
| `(k, v) in d.items()`   | O(1)       | 定位键 + 比较值    |
| `len(d)`                | O(1)       | 字典维护了大小     |
| `sorted(d)`             | O(n log n) | 排序全部键         |
| `list(d.keys())`        | O(n)       | 拷贝全部键到列表   |
| `reversed(d)` (3.8+)    | O(n)       | 反向遍历全部键     |

## 5. 总结

### 5.1 字典遍历速查

```
遍历方式选择：
- 只遍历键               for k in d                    # 最简洁
- 只遍历值               for v in d.values()           # 不需要键时
- 同时需要键和值          for k, v in d.items()         # 最常用，避免循环内 d[k]
- 按键排序遍历            for k in sorted(d)            # 需要字母序/数值序
- 按值排序遍历            sorted(d, key=d.get)          # sorted 返回列表
- 反向遍历               for k in reversed(d)          # 3.8+，逆插入顺序
- 带索引遍历             for i, (k,v) in enumerate(d.items())  # 需要行号时
- 首次匹配短路            next((k for k,v in d.items() if cond), None)

遍历中修改字典：
- 增删键         ❌ 直接抛 RuntimeError
- 修改已存在值     ✅ 安全（大小不变）
- 需要增删键       ✅ list(d) 遍历快照 / 字典推导新建 / 收集键后统一删

视图对象：
- d.keys()       → dict_keys 视图（支持集合运算 & | - ^）
- d.values()     → dict_values 视图（只支持 in）
- d.items()      → dict_items 视图（支持 in）
- 视图是活的：字典变 → 视图变
- 需要快照：list(d) / list(d.items())
```

### 5.2 核心要点回顾

- Python 3.7+ dict 遍历顺序 = 插入顺序；需要重排用 `OrderedDict`（前一篇）。
- `keys()` / `values()` / `items()` 返回**视图对象**——零拷贝、实时反映字典变化。
- `for k, v in d.items()` 是同时需要键和值的最优写法——避免循环体内 `d[k]` 哈希查找。
- 遍历中修改字典**大小**（增删键）抛 `RuntimeError`；修改已有**值**安全。
- 需要增删键时三种方案：`list(d)` 遍历快照、收集键后统一删、字典推导新建（最优雅）。
- `d.keys()` 支持集合运算（`& | - ^`），零拷贝直接使用；`d.values()` 不支持（值可能重复）。
- `sorted(d)` 会拷贝全部键，大字典避免频繁排序。

### 5.3 读完应能掌握

- 能根据"需要键/需要值/两者都要/需要特定顺序/需要修改字典"快速选出正确的遍历方式。
- 能识别并规避"遍历中增删键"的 RuntimeError，知道三种安全修改方案及其适用场景。
- 能利用视图对象的零拷贝和实时特性写出高效遍历代码，同时不踩"存视图当快照"的坑。
- 能解释视图对象为何支持/不支持集合运算，以及 `items()` 的 `in` 为何是 O(1) 而非 O(n)。
- 能用 `next()` + 生成器一行写出"首次匹配短路"的优雅遍历。

### 5.4 常见面试问题

**问题一：遍历字典时删除某些键会怎样？如何安全实现？**

```python
d = {"a": 1, "b": 2, "c": 3}

# ❌ 直接删除：RuntimeError
# for k in d:
#     if d[k] % 2 == 0:
#         del d[k]

# ✅ 方案一：遍历 list() 快照
for k in list(d):
    if d[k] % 2 == 0:
        del d[k]

# ✅ 方案二：字典推导新建（最优雅）
d = {k: v for k, v in d.items() if v % 2 != 0}
```

**问题二：Python 3 中 d.keys() 返回什么？和 Python 2 有什么区别？**

Python 3 返回**视图对象（dict_keys）**——零拷贝、实时反映字典变化、支持集合运算。Python 2 返回**列表**——每次调用都拷贝一份键的内存、字典变化后列表不变。Python 3 的设计大幅减少了遍历的内存开销。

**问题三：for k in d 和 for k in d.keys() 有什么区别？**

行为完全相同，都遍历键的视图。细微差异：`for k in d` 更简洁、略快（少一次 `.keys()` 属性访问）；`d.keys()` 需要传给函数做集合运算时使用（`d1.keys() & d2.keys()`），零拷贝。

### 5.5 实战串讲：配置文件校验 + 报表生成

把本篇的遍历范式串进一个实际场景——读取配置字典、校验字段、生成报表：

```python
# 模拟一份应用配置
config = {
    "host": "0.0.0.0",
    "port": 8080,
    "debug": True,
    "max_connections": 100,
    "timeout": 30,
    "secret_key": "abc123def",
    "log_level": "INFO",
}

# 1. 校验配置：遍历所有键值对，检查关键字段
errors = []
for k, v in config.items():                         # items() 同时拿键和值
    if k == "port" and not (1024 <= v <= 65535):
        errors.append(f"端口 {v} 不在 1024-65535 范围")
    elif k == "max_connections" and v <= 0:
        errors.append("max_connections 必须为正数")

print("校验错误:", errors)

# 2. 脱敏输出：只显示非敏感字段的值
SENSITIVE = {"secret_key"}
for k in config:                                     # 只遍历键
    if k in SENSITIVE:
        print(f"{k}: ***")
    else:
        print(f"{k}: {config[k]}")

# 3. 按键排序生成报表
print("\n=== 配置报表（按键排序） ===")
for k in sorted(config):                             # sorted 按字母序
    v = config[k]
    if k in SENSITIVE:
        v = "***"
    print(f"  {k:20s} = {v}")

# 4. 按值类型分组统计
from collections import defaultdict
by_type = defaultdict(list)
for k, v in config.items():                          # items() 拿键和值
    by_type[type(v).__name__].append(k)

print("\n=== 按类型统计 ===")
for type_name, keys in by_type.items():
    print(f"  {type_name}: {keys}")

# 5. 找出所有值为 True 的开关
switches = [k for k, v in config.items() if isinstance(v, bool) and v]
print(f"\n开启的开关: {switches}")  # ['debug']
```

这个场景中用到了 `items()`（同时需要键和值）、`for k in d`（只需要键、值通过 `config[k]` 取）、`sorted(d)`（排序遍历）、字典推导（提取数据）。每一种遍历方式都和"这段代码实际需要什么"一一对应。

### 5.6 延伸

字典遍历是字典操作的日常入口——几乎所有字典操作都从一次遍历开始。理解了本篇的视图对象和遍历安全边界后，下一站进入字典操作的另一高频领域：**字典合并**——`{**d1, **d2}`、`d1 | d2`（Python 3.9+）、`update()`、`ChainMap` 分别在不同场景下承担不同的语义（最后一个覆盖 / 合并冲突 / 链式查找），并对性能和内存有不同取舍。

如果你还在回顾前面的内容：

- 遍历顺序的事 → **OrderedDict** 那一篇（顺序敏感的比较、重排能力）
- 遍历中自动默认值 → **defaultdict** 那一篇（`for k, v in pairs: d[k].append(v)` 背后是自动建键）
- `Counter` 的 `elements()` 按重数展开遍历 → **Counter** 那一篇

最终，字典家族的遍历范式可以浓缩为一句话：**视图迭代、items() 优先、修改先知快照、排序知成本**。记住这四条，日常字典遍历的所有场景都在掌控之中。
