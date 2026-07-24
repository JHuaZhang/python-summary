---
group:
  title: 【07】字典深度剖析
  order: 7
order: 2
title: 键值存取
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是字典的键值存取

字典的"键值存取"指的是对字典里键值对（key-value pair）的读取与写入操作：给定一个键，取出对应的值；给定一个键和值，把这对关系写进字典或更新已有值。这是字典作为"键控映射"最基本、最高频的使用方式，几乎所有字典交互都围绕它展开。

```python
# 写入（存）：创建或更新键值对
user = {"name": "Alice", "age": 30}
user["city"] = "Beijing"      # 新增一个键
user["age"] = 31              # 更新已有键

# 读取（取）：用键取值
print(user["name"])           # 输出：Alice
print(user["age"])            # 输出：31
```

本篇聚焦于存取操作本身——`d[key]` 取值、`d[key] = value` 赋值、`get()` 安全取值、`keys/values/items` 视图，以及键不存在时的各种处理策略。它和创建篇衔接：上一篇讲"字典怎么生出来"，这一篇讲"字典生出来之后，如何安全、高效地读写它"。这里刻意不展开 `setdefault` 和 `defaultdict` 的深入用法——它们是"键不存在时自动补默认值"的专门扩展，留到第 03、04 篇专门讲；本篇只把"键不存在"作为一个核心问题，引出几种基础应对方式，把自动补默认值的优雅写法留给后续。

### 1.2 核心矛盾：键不存在怎么办

字典存取的几乎所有陷阱，都围绕一个问题：**取一个不存在的键会怎样**。`d[key]` 在键不存在时直接抛 `KeyError`，这是很多人踩的第一个坑。围绕这个问题，Python 提供了多种应对方式，各有取舍：

```python
d = {"a": 1, "b": 2}

# 方式一：直接 []，键不存在抛 KeyError
print(d["a"])           # 输出：1
# print(d["c"])         # KeyError: 'c'

# 方式二：get()，键不存在返回 None 或指定默认值
print(d.get("c"))         # 输出：None
print(d.get("c", 0))      # 输出：0

# 方式三：用 in 先判断再取
if "c" in d:
    print(d["c"])
else:
    print("不存在")        # 输出：不存在

# 方式四：try/except 捕获 KeyError
try:
    print(d["c"])
except KeyError:
    print("不存在")        # 输出：不存在
```

这四种写法在语义上都能"取值或处理不存在"，但性能、可读性、场景适配各不相同。本篇会逐一拆解它们的最佳适用场景，并给出选择判据。

### 1.3 最小对照：存与取

在展开之前，用最小例子把"存"和"取"两套操作的关系固定下来。

```python
scores = {"Alice": 90, "Bob": 85}

# 取：读取已有的键
print(scores["Alice"])    # 输出：90

# 存：写入新的键值对（键不存在则新增）
scores["Carol"] = 92
print(scores)             # 输出：{'Alice': 90, 'Bob': 85, 'Carol': 92}

# 存：写入已有键（覆盖更新）
scores["Alice"] = 95
print(scores["Alice"])    # 输出：95
```

"取"只读取不修改字典；"存"会改字典——新增键或更新已有键。这点对称性看起来简单，却是后续性能讨论的基础：`d[k] = v` 涉及哈希定位 + 可能的写入，而 `d[k]` 只涉及哈希定位 + 读取。

## 2. 核心内容

### 2.1 d[key]：直接取值与写入

`d[key]` 是最直接的存取语法。取值时返回键对应的值；赋值时新增或更新键值对。它基于 `__getitem__` / `__setitem__` 协议，底层走哈希表定位，平均 O(1)。

**取值：键必须存在，否则 KeyError**

```python
config = {"host": "localhost", "port": 8080}

# 键存在，直接取
print(config["host"])   # 输出：localhost
print(config["port"])   # 输出：8080

# 键不存在，抛 KeyError
# print(config["user"])   # KeyError: 'user'
```

`KeyError` 是 `LookupError` 的子类，属于"查询类异常"。它的特点是把"缺失的键"作为异常参数打印，这在调试时很有用：

```python
d = {"a": 1}
try:
    d["missing"]
except KeyError as e:
    print(f"键不存在: {e!r}")   # 输出：键不存在: 'missing'
```

**写入：新增或更新**

```python
d = {}
d["x"] = 1          # 新增
d["y"] = 2          # 新增
d["x"] = 100        # 更新（覆盖）
print(d)            # 输出：{'x': 100, 'y': 2}
```

`d[key] = value` 不区分"新增"还是"更新"——它在哈希表里定位到 key（无论是否存在），存在则覆盖值，不存在则插入新条目。这意味着你无法仅凭这个操作知道"刚才到底是新增了还是覆盖了"。如果业务上需要区分，得用 `in` 先判断，或用 `setdefault`（第 03 篇专题）。

**写入时键必须可哈希**

写入和读取一样要求键可哈希。不可哈希对象作键直接报错：

```python
d = {}
# d[[1, 2]] = "x"     # TypeError: unhashable type: 'list'（列表不可哈希）
d[(1, 2)] = "point"   # 元组可哈希，合法
print(d[(1, 2)])      # 输出：point
```

### 2.2 d.get(key, default)：安全取值

`get()` 是处理"键可能不存在"最优雅的取值方式。它从不抛 `KeyError`——键存在返回对应值，不存在返回第二参数 `default`（不传则默认 `None`）。

```python
d = {"a": 1, "b": 2}

# 键存在：返回值
print(d.get("a"))        # 输出：1

# 键不存在：返回 None（默认）
print(d.get("c"))        # 输出：None

# 键不存在：返回指定默认值
print(d.get("c", 0))     # 输出：0
print(d.get("c", "N/A")) # 输出：N/A
```

`get()` 的方法签名是 `d.get(key, default=None)`，返回值。它**绝不修改字典**——即使键不存在，也不会自动把默认值写进去。这是它与 `setdefault` 的关键区别，记住这一点能避免一类常见误用：

```python
d = {"a": 1}

# get 不会写入
print(d.get("c", 0))    # 输出：0
print(d)                # 输出：{'a': 1}   ← 字典没变，"c" 没被加进去

# setdefault 会写入（第 03 篇详解）
print(d.setdefault("c", 0))   # 输出：0
print(d)                      # 输出：{'a': 1, 'c': 0}   ← "c" 被写进去了
```

**get 的典型场景：读取配置，提供回退值**

```python
config = {"host": "localhost", "port": 8080}

# 未设置 debug 就用 False，"设置了就取它"——一行表达清楚
debug = config.get("debug", False)
timeout = config.get("timeout", 30)
print(debug, timeout)    # 输出：False 30
```

对比用 `try/except` 写同样逻辑，`get` 一行搞定，意图也最清晰：

```python
# 等价但啰嗦
try:
    debug = config["debug"]
except KeyError:
    debug = False
```

**何时不要用 get**

`get()` 适合"键不存在是合理情况、有合理默认值"的场景。但如果"键不存在是错误、应该让程序停下来"，那直接用 `d[key]` 抛 KeyError 反而更合适——快速失败胜过静默用默认值掩盖问题。

```python
# 配置里必须有 "host"，缺失就是部署错误，应该炸出来
host = config["host"]      # 缺失立即 KeyError，暴露问题
# 而不是 host = config.get("host", "localhost")  ← 静默回退，掩盖配置缺失
```

### 2.3 in 操作符：成员判断

`in` 判断一个键是否在字典里，返回 bool。它只看**键**，不看值——这是字典区别于"在序列里找元素"的一个要点：列表的 `in` 找元素，字典的 `in` 找键。

```python
d = {"name": "Alice", "age": 30}

# 判断键是否存在
print("name" in d)      # 输出：True
print("Alice" in d)     # 输出：False   ← "Alice" 是值不是键，in 不看值
print("city" in d)      # 输出：False
```

`in` 在字典上是平均 O(1)——靠哈希表直接定位，不像列表那样 O(n) 线性扫描。这一点让"先 in 再取"成为可行的安全写法，不像在列表里那样低效。

**`in` + `[]` 的两步取值模式**

```python
d = {"a": 1, "b": 2}

if "c" in d:
    v = d["c"]
else:
    v = "默认"
print(v)   # 输出：默认
```

这种写法的问题在于：当键存在时，要查两次哈希表——一次 `in`、一次 `d["c"]`。对性能敏感的热路径，这不如 `get()`（一次哈希查找就拿到值或默认值）高效。所以"两步模式"更适合**取值的同时要根据存在性走分支逻辑**的场景，而非仅仅"取值或默认值"。

```python
# 适合 in 的场景：存在性驱动分支，而不只是取值
if "admin" in user_roles:
    grant_access()
else:
    deny_access()
```

### 2.4 try/except KeyError：EAFP 风格

Python 文化推崇 EAFP（Easier to Ask Forgiveness than Permission：先做再说，出错再处理）风格。对字典取值，就是直接 `d[key]` 然后捕获 `KeyError`。

```python
d = {"a": 1, "b": 2}

try:
    v = d["c"]
except KeyError:
    v = "默认"
print(v)   # 输出：默认
```

EAFP 与 LBYL（Look Before You Leap：先 `in` 检查再操作）的取舍，在字典场景有一个性能维度的经验法则：**当"键通常存在"时，try/except 比 in 判断更快**——因为它只做一次哈希查找（成功路径无异常开销）；而当"键通常不存在"时，try/except 会频繁抛异常，比 in 慢。异常处理在 Python 里并非零成本，命中 except 分支的代价高于一次 `in` 检查。

```python
# 场景：键大概率存在 → EAFP 更快
def get_ea(d, k):
    try:
        return d[k]
    except KeyError:
        return None

# 场景：键大概率不存在 → LBYL 更快
def get_lb(d, k):
    if k in d:
        return d[k]
    return None

# 两者都对，选择依据是"命中率"
```

实务中这个差异通常很小，更应按可读性选择。但当字典查询处于每秒百万次的性能热点时，这条经验值得参考——用 `timeit` 实测后再定。

### 2.5 keys() / values() / items()：三类视图

这三个方法返回字典的"视图对象"（view object），分别是键视图、值视图、键值对视图。它们在 Python 3 中不再是列表，而是动态反映字典当前状态的轻量视图。

```python
d = {"a": 1, "b": 2, "c": 3}

keys = d.keys()
vals = d.values()
items = d.items()

print(type(keys))    # 输出：<class 'dict_keys'>
print(type(vals))    # 输出：<class 'dict_values'>
print(type(items))   # 输出：<class 'dict_items'>

# 都可迭代
print(list(keys))    # 输出：['a', 'b', 'c']
print(list(vals))    # 输出：[1, 2, 3]
print(list(items))   # 输出：[('a', 1), ('b', 2), ('c', 3)]
```

**视图是动态的——这是它和 Python 2 时代返回列表的最大区别**

视图不复制数据，而是指向字典的内部结构。字典变化时，视图"实时反映"：

```python
d = {"a": 1, "b": 2}
keys = d.keys()
print(list(keys))     # 输出：['a', 'b']

d["c"] = 3            # 字典新增键
print(list(keys))     # 输出：['a', 'b', 'c']   ← 视图自动更新，没重新调用 keys()
```

这种"动态反映"是视图的核心特性，省去每次查询都复制一份列表的开销。但这也带来一个易错点：**在迭代视图时修改字典会抛 RuntimeError**——迭代器检测到字典大小变了就拒绝继续。

```python
d = {"a": 1, "b": 2, "c": 3}

# 想删除所有值为奇数的项——错误写法
# for k, v in d.items():
#     if v % 2 == 1:
#         del d[k]      # RuntimeError: dictionary changed size during iteration

# 正确写法一：先收集要删的键，再统一删
to_delete = [k for k, v in d.items() if v % 2 == 1]
for k in to_delete:
    del d[k]
print(d)               # 输出：{'b': 2}

# 正确写法二：用字典推导式重建
d = {"a": 1, "b": 2, "c": 3}
d = {k: v for k, v in d.items() if v % 2 == 0}
print(d)               # 输出：{'b': 2}
```

### 2.6 视图的集合运算

`keys()` 视图有一个独特能力：它支持集合运算（并、交、差、对称差），因为键天然可哈希、本质就是一个集合。这让"两个字典的键做集合操作"变得很简洁。注意 `values()` 视图**不支持**集合运算（值不一定可哈希、可能有重复），`items()` 视图在"值都可哈希"时支持。

```python
d1 = {"a": 1, "b": 2, "c": 3}
d2 = {"b": 20, "c": 30, "d": 40}

# 键的并集
print(d1.keys() | d2.keys())    # 输出：{'a', 'b', 'c', 'd'}

# 键的交集：两字典共有的键
print(d1.keys() & d2.keys())    # 输出：{'b', 'c'}

# 键的差集：d1 有而 d2 没有的键
print(d1.keys() - d2.keys())    # 输出：{'a'}

# 应用：找两字典都有的键，并比较值是否一致
common = d1.keys() & d2.keys()
for k in common:
    print(f"{k}: {d1[k]} vs {d2[k]}")
# 输出：
# b: 2 vs 20
# c: 3 vs 30
```

**用键的集合运算做批量筛选**

```python
# 只要 d1 中那些键也在白名单里的项
whitelist = {"a", "c"}
filtered = {k: d1[k] for k in (d1.keys() & whitelist)}
print(filtered)    # 输出：{'a': 1, 'c': 3}
```

`items()` 视图也能做集合运算，但要求值都可哈希：

```python
d1 = {"a": 1, "b": 2}
d2 = {"a": 1, "b": 99}

# 键值对完全相同的项
print(d1.items() & d2.items())   # 输出：{('a', 1)}   ← 只有 ('a',1) 相同
```

这能用来"比对两份配置字典中哪些项完全一致"。

### 2.7 嵌套字典的存取

实际数据常是多层的，如从 JSON 来的嵌套字典。访问内层要用连续的 `[]`，每一层都要处理"键不存在"的风险，否则任一层缺失都会抛 KeyError 或 TypeError。

```python
data = {
    "user": {
        "name": "Alice",
        "profile": {"age": 30, "city": "Beijing"}
    }
}

# 连续 [] 访问深层字段
print(data["user"]["profile"]["city"])   # 输出：Beijing

# 任一层缺失就炸
# print(data["user"]["address"]["city"])       # KeyError: 'address'
# print(data["missing"]["profile"]["city"])    # KeyError: 'missing'
```

**逐层 get 的笨重写法**

```python
# 一层一层 get，可读性急剧下降
city = data.get("user", {}).get("profile", {}).get("city", "未知")
print(city)   # 输出：Beijing

# 当中间层缺失时返回默认值，不抛错
city2 = data.get("user", {}).get("address", {}).get("city", "未知")
print(city2)  # 输出：未知
```

这种"每层 `{}.get(...)`"的写法能运行，但层数一多就很难读，且每一层 `get` 都要返回一个空 dict 作占位。对深层嵌套，更合适的是用专门的"深度取值"工具或 `try/except`：

```python
# try/except 处理任意层缺失
try:
    city = data["user"]["profile"]["city"]
except (KeyError, TypeError):
    city = "未知"
print(city)   # 输出：Beijing
```

`TypeError` 也捕获是为了处理"某一层取出来不是 dict、无法再 `[]`"的情况（比如某层是 `None`）。Python 3.x 提供的更优雅方案是借助第三方库的虚拟字典或 `glom`；标准库内最干净的仍是上面这种"窄化的 try/except"。

### 2.8 赋值的细节：值是引用

`d[key] = value` 只是把 value 的引用存进字典，不会复制 value。这意味着存入可变对象后，字典里的引用和外部变量指向同一个对象，改其中一个，另一个能看见。

```python
shared_list = [1, 2]
d = {"items": shared_list}

print(d["items"] is shared_list)   # 输出：True  ← 同一个 list 对象

shared_list.append(3)
print(d["items"])                  # 输出：[1, 2, 3]  ← 字典里也变了

d["items"].append(4)              # 通过字典引用改
print(shared_list)                 # 输出：[1, 2, 3, 4]  ← 外部变量也变了
```

这是 Python 一致的引用语义，不是字典特有的坑，但在字典场景尤其常见（因为常把可变对象当值存）。若希望字典持有独立副本，需在存入时显式复制：

```python
import copy
d = {"items": copy.copy(shared_list)}       # 浅拷贝独立
# 或对列表用 list(shared_list) / shared_list[:]
```

### 2.9 del 与 pop：删除也是一种存取变体

虽然本篇主线是读和写，但删除键本质是"写"的一种（修改字典结构）。`del d[key]` 删除键值对，键不存在抛 KeyError；`d.pop(key)` 删除并返回被删的值。

```python
d = {"a": 1, "b": 2, "c": 3}

# del：删除指定键，不存在则 KeyError
del d["a"]
print(d)                # 输出：{'b': 2, 'c': 3}
# del d["x"]            # KeyError: 'x'

# pop：删除并返回值
v = d.pop("b")
print(v)                # 输出：2
print(d)                # 输出：{'c': 3}

# pop 带默认值：键不存在不抛错，返回默认值
print(d.pop("x", None)) # 输出：None
print(d.pop("x", 0))    # 输出：0
```

`pop` 和 `get` 一样有"安全模式"（带第二参数），行为对称：`get` 是"取值，不改字典"，`pop` 是"取值并删除该键"。这两对（`[]` / `get`、`del` / `pop`）构成了字典存取的完整四象限：

| 操作       |  不安全（键不存在抛错）  |      安全（键不存在有默认值）       |
| ---------- | :----------------------: | :---------------------------------: |
| 读取不删除 |         `d[key]`         |        `d.get(key, default)`        |
| 读取并删除 | `del d[key]`（无返回值） | `d.pop(key, default)`（返回被删值） |

记住这个四象限，字典的存取操作就算全了。

## 3. 最佳实践

### 3.1 推荐写法 vs 不推荐写法

**取值该用哪种方式**

```python
d = {"a": 1, "b": 2}

# ✅ 推荐：取值 + 有合理默认 → get
port = config.get("port", 8080)

# ✅ 推荐：键缺失是错误、应快速失败 → 直接 []
host = config["host"]

# ✅ 推荐：存在性驱动分支 → in
if "admin" in roles:
    grant_access()

# ❌ 不推荐：用 get 检查键是否存在
if d.get("key") is not None:   # 值恰好是 None 时误判
    ...
# 应改用 if "key" in d:

# ❌ 不推荐：先 in 再 []（除非要分支逻辑）
if "x" in d:
    v = d["x"]          # 两次哈希查找
# 若只需"取值或默认值"，用 get 一次哈希即可
```

**`get` 与 `None` 值的陷阱**

```python
d = {"x": None}

# 陷阱：用 get 判断键是否存在，但值本身就是 None
print(d.get("x") is None)    # 输出：True，但键其实存在！
# get("x") 返回 None 既可能因为键不存在，也可能因为值就是 None，无法区分

# 正确判断键是否存在，用 in
print("x" in d)              # 输出：True
```

这是 `get` 一个真实陷阱：当值合法地是 `None` 时，不能用 `get(key) is None` 判断键是否存在，得用 `in`。反过来，`get(key, default)` 在"键存在但值是 None"与"键不存在"时返回不同（前者返回 None，后者返回 default），对需要区分这两者的逻辑要小心。

**避免用可变默认值当 get 的第二参数**

```python
# ❌ 不推荐：每次调用都新建可变默认值（虽不共享，但浪费且意图不清）
# v = d.get("list", [])
```

实际上 `get(key, [])` 的可变默认每次调用都新建，不像 `fromkeys`/默认参数那样共享，所以技术上不 bug。但它仍不推荐——因为 `get` 不写入，拿到空列表后想"改它并希望同步回字典"是做不到的。若意图是"键不存在就初始化一个可变容器并写入字典"，那是 `setdefault` 的活儿，本篇不展开（见第 03 篇）。

### 3.2 遍历字典的正确姿势

```python
d = {"a": 1, "b": 2, "c": 3}

# ✅ 推荐：直接遍历字典，得到的是键
for k in d:
    print(k, d[k])

# ✅ 推荐：需要键和值，用 items()，避免重复查找
for k, v in d.items():
    print(k, v)

# ✅ 推荐：只需要键或值，用对应的视图
for k in d.keys():
    ...
for v in d.values():
    ...

# ❌ 不推荐：只用键时遍历 items 浪费
for k, v in d.items():
    print(k)        # v 根本没用上，应改 for k in d

# ❌ 不推荐：用 keys() 取下标访问，啰嗦
for k in d.keys():
    print(d[k])     # 直接 for k in d 更简洁，但取值场景 items() 更佳
```

一个性能细节：遍历时只取值、不取键是极少见的反模式（你不知道值属于哪个键），通常都是用 `items()` 成对取。而 `values()` 视图适合"只关心所有值、不关心键"的场景，如求和、统计：

```python
scores = {"Alice": 90, "Bob": 85, "Carol": 92}
total = sum(scores.values())
avg = total / len(scores)
print(f"平均: {avg:.1f}")    # 输出：平均: 89.0
```

### 3.3 迭代时修改字典的正确做法

```python
d = {"a": 1, "b": 2, "c": 3, "d": 4}

# ❌ 不推荐：迭代时直接删除 → RuntimeError
# for k in d:
#     if d[k] % 2:
#         del d[k]

# ✅ 推荐：先收集要删的键
to_del = [k for k, v in d.items() if v % 2]
for k in to_del:
    del d[k]
print(d)   # 输出：{'b': 2, 'd': 4}

# ✅ 推荐：或用推导式重建（最简洁）
d = {"a": 1, "b": 2, "c": 3, "d": 4}
d = {k: v for k, v in d.items() if v % 2 == 0}
print(d)   # 输出：{'b': 2, 'd': 4}
```

注意一个微妙点：Python 对"迭代时修改字典"的检测基于"字典大小是否变化"。如果你在迭代时**修改已有键的值但不增删键**（`d[k] = newv`），字典大小不变，不会抛错——但这仍是危险的，因为视图可能看到中间状态。 safest practice 是绝不在迭代视图中修改字典结构，值更新也要等迭代结束。

### 3.4 EAFP 还是 LBYL：按命中率和可读性选

```python
# 键大概率存在（如查缓存命中）→ EAFP
cache = {}
def get_cache(key):
    try:
        return cache[key]          # 命中时一次查找，无额外开销
    except KeyError:
        return None

# 键大概率不存在（如检查黑名单）→ in
blacklist = {"spam", "scam"}
if user_name in blacklist:         # 一次 in 查找，命中直接走分支
    reject()
```

这条经验法则不要绝对化。Python 抛异常的开销在现代版本已比早期小很多，对绝大多数代码"可读性"才是决定因素：若"键不存在是异常情况"，用 try/except 表达"这是异常路径"更清楚；若"键不存在和存在一样常见、都是正常分支"，用 `in` 或 `get` 表达分支更自然。

### 3.5 不要在并发场景裸用字典

字典的读写不是原子的。多线程下"一个线程读、一个线程写、同时还有线程迭代"会出现各种撕裂状态（迭代器看到一半被改、读到正在被写入的不一致状态）。CPython 的 GIL 让**单条字节码级别**的简单操作通常不会崩，但"读-判断-写"复合操作（如 `if k not in d: d[k] = v`）不是原子的，多线程下会丢更新。

```python
# 多线程下这种"判断后再写"会丢更新
# if "key" not in d:
#     d["key"] = compute()
```

线程安全的字典操作需要加锁（`threading.Lock`），或改用 `queue`、`concurrent.futures` 等并发原语。这是字典存取一个常被忽视的边界，记住"字典不是并发安全容器"即可，具体方案属于并发主题。

## 4. 原理

### 4.1 [] 操作的字节码与协议

`d[key]` 和 `d[key] = value` 在底层分别调用 `dict.__getitem__` 和 `dict.__setitem__`，对应字节码 `BINARY_SUBSCR` 和 `STORE_SUBSCR`。`get`、`keys`、`values`、`items` 则是普通的方法调用。理解这点能解释一个性能事实：`d[key]` 比 `d.get(key)` 略快，因为它走的是专门的字节码而非方法调用查找。但这个差距极小，绝不应作为选择依据。

```python
import dis
dis.dis(compile("d['a']", "<s>", "eval"))      # BINARY_SUBSCR
dis.dis(compile("d.get('a')", "<s>", "eval"))  # LOAD_ATTR get + CALL
```

### 4.2 get 的内部实现：一次哈希查找

`get(key, default)` 的实现逻辑等价于：先在哈希表里查 key，找到就返回值，找不到就返回 default。它**只做一次哈希查找**——这正是它比"先 in 再 []"（两次查找）快的根源。

```python
# get 的等价实现（伪代码）
def get(self, key, default=None):
    # 一次哈希查找定位
    entry = self._find(key)   # 返回条目或 None
    if entry is not None:
        return entry.value
    return default            # 不写入，不抛错
```

对比 `d[key]` 的等价实现：找到返回值，找不到**抛 KeyError**，没有 default 概念。`get` 与 `[]` 共享同一次哈希查找的底层，区别只在"未命中时的行为"——这是为什么两者定位代价相同、只是返回方式不同。

### 4.3 视图为什么不复制数据

`keys()`/`values()`/`items()` 返回的视图对象，内部只持有一个指向字典的"弱引用式"链接（不是真正的弱引用，但类似——它不复制键值数据，只引用字典的内部数组）。视图迭代时，实时遍历字典当前的内部条目数组。这就解释了两个现象：

1. **视图动态反映字典状态**——因为它读的是字典的实时内部结构，不是一份快照。
2. **迭代时改字典会 RuntimeError**——视图迭代器维护一个"预期大小"签名，发现字典尺寸变化就抛错，避免迭代器看到被破坏的中间状态。

```python
d = {"a": 1, "b": 2}
view = d.items()
print(dict.__repr__(view))   # 简化示意，实际无此 repr
# view 迭代时，每访问一项都会校验 d 的内部签名是否还匹配
```

### 4.4 keys() 支持集合运算、values() 不支持的原因

`keys()` 视图实现了集合协议（`__and__`、`__or__`、`__sub__` 等），因为**键天然满足集合的约束**：键互不相同（字典本身就保证了键唯一）且都可哈希。所以键视图可以直接当集合用。

`values()` 视图则**不实现**集合协议，原因有二：第一，值可以重复（两个键可以有相同的值），违反集合"元素唯一"的约束；第二，值不要求可哈希（可以是 list、dict 等不可哈希对象），无法放进集合。所以对值做"集合式"操作会直接 `TypeError`。

```python
d = {"a": 1, "b": 2, "c": 1}
# d.values() & {1}    # TypeError: unsupported operand type(s) for &: 'dict_values' and 'set'
# 若确需要对"值的集合"，转换一下：
print(set(d.values()))   # 输出：{1, 2}   ← 此时去重了
```

`items()` 在"值都可哈希"时支持集合运算，因为键值对此时可哈希且唯一（键唯一保证了条目唯一）。

### 4.5 哈希查找为何平均 O(1)：与本系列主题的关系

字典所有存取操作（`[]`、`get`、`in`、`pop`、视图迭代）的时间复杂度，都根植于一件事：**哈希表查找平均 O(1)**。给定键 → 算哈希 → 映射到数组下标 → 比较键是否相等 → 命中或冲突探测。这套机制的完整剖析（哈希函数、冲突、resize、负载因子）属于《字典底层原理哈希表》一专题，本篇只需记住结论：正常负载下，存取都是 O(1)；极端冲突下退化，但 Python 的随机化哈希让这种情况在正常使用中几乎不出现。

这个 O(1) 是字典相对于列表的核心优势——列表按值查找是 O(n)，按位置才是 O(1)；字典按"键"（语义上的"值"）查找就是 O(1)。理解了这点，才能在"我需要按某标识频繁查某对象"时本能地选字典而非列表。

## 5. 总结

### 5.1 存取方式速查

```
读取：
- d[key]              键存在返回值，不存在抛 KeyError
- d.get(key, default) 键存在返回值，不存在返回 default(默认 None)，不改字典
- d[key] 配合 try/except  EAFP 风格，键大概率存在时高效

判断：
- key in d            键是否存在，O(1)，只看键不看值

写入：
- d[key] = value      新增或更新（无法区分两者）

视角：
- d.keys()            键视图，支持集合运算，动态反映字典
- d.values()          值视图，不支持集合运算，可重复
- d.items()           键值对视图，值可哈希时支持集合运算

删除：
- del d[key]          删除，不存在抛 KeyError
- d.pop(key, default) 删除并返回值，不存在返回 default

四象限：
              不删除          删除
  抛错        d[key]          del d[key]
  安全默认    d.get(key,d)    d.pop(key,d)
```

### 5.2 核心要点回顾

- `d[key]` 取值键不存在抛 `KeyError`；`d.get(key, default)` 安全取值且不写字典。
- `in` 只判断键、平均 O(1)，值不参与；判断键存在性优先 `in` 而非 `get() is None`（值可能恰为 None）。
- `keys/values/items` 是动态视图，不复制数据、实时反映字典状态；迭代时改字典会 `RuntimeError`。
- 键视图支持集合运算，值视图不支持；items 视图在值可哈希时支持。
- 嵌套字典逐层访问要处理每层缺失；深层用窄化的 `try/except (KeyError, TypeError)`。
- 存入的是引用，存可变对象后内外共享同一对象，需独立副本时显式 `copy`。
- `get`/`pop` 带 default 是安全版，`[]`/`del` 是不安全版——构成存取四象限。
- EAFP（try/except）适合键常存在，LBYL（in/get）适合键常缺失，但以可读性为先。

### 5.3 读完应能掌握

- 能在取值时正确选用 `[]`、`get`、`in`、`try/except`，并说清各自的适用场景与性能方向。
- 能避免 `get() is None` 判键、迭代时改字典、嵌套访问逐层缺失等常见坑。
- 能用 `keys()` 视图的集合运算做两字典键的并交差，理解为何 `values()` 不支持。
- 能区分动态视图与列表的本质差异，知道为何迭代时改字典会 RuntimeError。
- 能从哈希查找 O(1) 的原理层面，解释字典所有存取操作为何高效。

### 5.4 常见面试问题

**问题一：`d.get(key)` 和 `d[key]` 的区别？**

```python
d = {"a": 1}
print(d["a"])        # 输出：1
# print(d["b"])      # KeyError
print(d.get("b"))    # 输出：None
print(d.get("b", 0)) # 输出：0
# d[key] 缺键抛错；get 缺键返回默认值，且绝不修改字典。
```

**问题二：如何判断键是否存在？`in` 还是 `get`？**

```python
d = {"x": None}
# 陷阱：值是 None 时，get() is None 误判
print(d.get("x") is None)   # True，但键其实存在
print("x" in d)             # True，正确判键
# 结论：判断键存在性用 in；取值或默认值用 get。
```

**问题三：遍历字典时修改字典会怎样？怎么办？**

```python
d = {"a": 1, "b": 2}
# for k in d: del d[k]   # RuntimeError: dictionary changed size during iteration
# 正确：先收集键再删，或用推导式重建
d = {k: v for k, v in d.items() if v > 0}
```

**问题四：`keys()` 视图支持哪些 `values()` 不支持的操作？**

```python
d1 = {"a": 1, "b": 2}
d2 = {"b": 3, "c": 4}
print(d1.keys() & d2.keys())   # {'b'}  ← 键视图支持集合运算
# d1.values() & d2.values()    # TypeError：值视图不支持
# 原因：键唯一且可哈希（满足集合约束），值可重复且不必可哈希。
```

### 5.5 延伸

本篇解决了"键不存在时如何取值"的基础问题，用的是 `get`、`in`、`try/except` 这些显式手段。但有一类高频场景没覆盖——"键不存在时不仅想返回默认值、还想把默认值写进字典以便后续复用"，这正是第 03 篇 `setdefault` 和第 04 篇 `defaultdict` 的主战场。顺着本篇的"四象限"往下，`setdefault` 就是填补"安全且写入"那一格的专门工具。再往后，《字典遍历》《字典合并》《字典底层原理哈希表》会在存取的基础上继续展开字典的全套用法与底层机制。

### 5.6 实战串讲：一次请求头解析

把本篇多种存取手法串在一个贴近真实的小场景里，巩固选择直觉。假设要解析一段 HTTP 请求头，提取若干字段并为缺失项给出合理默认，同时处理"相同请求头出现多次取最后一个"的需求。

```python
raw_headers = [
    ("Host", "api.example.com"),
    ("Accept", "application/json"),
    ("X-Trace-Id", "abc123"),
    ("Accept", "text/html"),     # 重复头，按最后一个为准
]

# 1) 把请求头列表收成字典：重复键后者覆盖，正是 d[k]=v 的天然行为
headers = {}
for k, v in raw_headers:
    headers[k] = v
print(headers)
# 输出：{'Host': 'api.example.com', 'Accept': 'text/html', 'X-Trace-Id': 'abc123'}

# 2) 取必有字段：缺失即配置错误，用 [] 快速失败
host = headers["Host"]

# 3) 取可选字段：有合理默认，用 get
accept = headers.get("Accept", "*/*")
trace_id = headers.get("X-Trace-Id", "")

# 4) 取一个"可选且需要分支处理"的字段
if "Authorization" in headers:
    token = parse_token(headers["Authorization"])   # 存在时才解析
    authed = True
else:
    token = None
    authed = False

print(f"host={host}, accept={accept}, trace={trace_id}, authed={authed}")
# 输出：host=api.example.com, accept=text/html, trace=abc123, authed=False
```

这段不到 30 行的代码，用到了 `d[k]=v` 覆盖、`[]` 快速失败、`get` 安全默认、`in` 存在性分支四种手法，每一种都正好对应它最合适的场景。能写出这样"每一处存取都选得有道理"的代码，就达到了本篇的目标。

可以再思考一个变体：如果上面 `Authorization` 不只是"解析"而是"缺失时需要初始化一个空 token 并写回 headers"，那就从本篇的 `in` 模式跨到第 03 篇的 `setdefault` 模式了。这个跨越点，正是下一篇要解决的问题。
