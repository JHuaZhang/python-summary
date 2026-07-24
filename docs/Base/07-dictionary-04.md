---
group:
  title: 【07】字典深度剖析
  order: 7
order: 4
title: defaultdict自动生成默认值
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 defaultdict

`defaultdict` 是 Python 标准库 `collections` 模块提供的一个字典子类。它和普通 `dict` 几乎完全一样，唯一的区别在于：当访问一个**不存在的键**时，普通 `dict` 会抛 `KeyError`，而 `defaultdict` 会先调用一个"默认工厂"（default_factory）函数生成一个默认值，把这个值写入字典，再返回它。也就是说，`defaultdict` 把"键不存在时自动补一个默认值"这件事内置进了字典本身。

```python
from collections import defaultdict

# 创建：传入一个"默认工厂"函数，这里用 list（无参调用 list() 得到空列表）
d = defaultdict(list)

# 访问不存在的键：自动建空列表并返回，不抛 KeyError
d["fruit"].append("apple")
d["fruit"].append("banana")
d["veggie"].append("carrot")

print(d["fruit"])    # 输出：['apple', 'banana']
print(d["veggie"])   # 输出：['carrot']
print(d)             # 输出：defaultdict(<class 'list'>, {'fruit': [...], 'veggie': [...]})
```

注意第三行 `d["fruit"].append("apple")`——这里 `"fruit"` 第一次访问时根本不存在，但 `defaultdict` 自动建了个空列表，让 `append` 能直接接上。与之对比，普通 `dict` 在这一步会先抛 `KeyError`，你得用上一篇的 `setdefault` 或 `if` 判断先把键初始化好。`defaultdict` 把这件事自动化了：你只需在创建字典时声明"缺失时用什么工厂造默认值"，之后所有取值点都自动享受，无需每个地方写 `setdefault`。

### 1.2 为什么需要 defaultdict

上一篇《setdefault》解决了"局部、按需"的默认值问题——在某个具体取值点用 `d.setdefault(k, [])` 保证键存在。但当一个字典在**很多处**取值、且每处都希望"缺失即初始化"时，反复写 `setdefault` 就显得啰嗦，代码里到处是同样的模式。`defaultdict` 把这个重复模式提升为字典的一个属性，一次声明、全局生效。

对比同一个"分组归类"任务，三种写法的演进：

```python
from collections import defaultdict

pairs = [("fruit", "apple"), ("fruit", "banana"), ("veggie", "carrot")]

# 写法一：普通 dict + setdefault（局部，每处都要写默认值）
d1 = {}
for k, v in pairs:
    d1.setdefault(k, []).append(v)

# 写法二：普通 dict + if 判断（最啰嗦）
d2 = {}
for k, v in pairs:
    if k not in d2:
        d2[k] = []
    d2[k].append(v)

# 写法三：defaultdict（全局声明，取值点最干净）
d3 = defaultdict(list)
for k, v in pairs:
    d3[k].append(v)    # ← 连 setdefault 都不用，直接取值追加
```

三者结果完全一样，但 `defaultdict` 版本的循环体最简洁——`d3[k].append(v)` 读起来就像在操作一个"本来就该有列表"的字典，所有"确保键存在"的样板代码都消失了。这正是 `defaultdict` 的核心价值：**它消除了"取值前先初始化"的样板，让代码聚焦于业务逻辑本身**。

### 1.3 关键概念：default_factory

理解 `defaultdict` 的关键是 `default_factory`——那个"默认工厂"。它不是默认值本身，而是一个**无参可调用对象**（通常是函数、类、lambda）。当访问缺失键时，`defaultdict` 会调用 `default_factory()` 来产生默认值。

```python
dd = defaultdict(int)      # 工厂是 int，int() 得到 0
print(dd["x"])             # 输出：0   ← 调用了 int()

dd2 = defaultdict(list)    # 工厂是 list，list() 得到 []
print(dd2["y"])            # 输出：[]  ← 调用了 list()

dd3 = defaultdict(str)     # 工厂是 str，str() 得到 ""
print(dd3["z"])            # 输出：""  ← 调用了 str()

dd4 = defaultdict(set)     # 工厂是 set，set() 得到 set()
print(dd4["w"])            # 输出：set()
```

要点是 `default_factory` 必须能"无参调用"——即 `factory()` 这种形式能跑通。所以能直接当工厂用的是那些"无参构造返回所需初始值"的内置类型：`list`→`[]`、`dict`→`{}`、`set`→`set()`、`int`→`0`、`float`→`0.0`、`str`→`""`、`bool`→`False`。如果默认值不能由"无参调用某个可调用对象"得到（比如想要默认值是 `["pending"]` 这种带初始内容的列表），就得用 `lambda` 自己包一层（见 2.5 节）。

`default_factory` 本身也存为 `defaultdict` 的一个属性，可以读取和修改：

```python
dd = defaultdict(list)
print(dd.default_factory)   # 输出：<class 'list'>
dd.default_factory = int    # 运行时改工厂
print(dd["new"])            # 输出：0   ← 现在用 int() 了
```

把"工厂"理解成一个"按需造默认值的函数"，是掌握 `defaultdict` 的起点。后面所有用法都围绕"选什么工厂"展开。

## 2. 核心内容

### 2.1 创建 defaultdict

`defaultdict` 的构造签名是 `defaultdict(default_factory=None, /, [...])`。第一个参数是默认工厂（位置参数），后面可以像 `dict()` 一样传初始键值对或映射。

```python
from collections import defaultdict

# 方式一：只传工厂，得到空 defaultdict
d1 = defaultdict(list)

# 方式二：传工厂 + 初始键值对（类似 dict([...])）
d2 = defaultdict(int, [("a", 1), ("b", 2)])
print(d2["a"])         # 输出：1   ← 初始键正常取
print(d2["c"])         # 输出：0   ← 缺失键自动用 int() 补

# 方式三：传工厂 + 关键字参数
d3 = defaultdict(list, x=[1, 2], y=[3])
print(d3["x"])         # 输出：[1, 2]
print(d3["z"])         # 输出：[]
```

注意初始化时已有的键，访问时返回已有值（不走工厂）；只有访问**缺失**键时才触发工厂。这和 `setdefault`"键存在返回原值、不存在才补"的语义一致——区别只在 `defaultdict` 是"取值时自动触发"，`setdefault` 是"显式调用触发"。

### 2.2 工厂为 None：退化为普通 dict

如果 `default_factory` 是 `None`（也是不传第一参数时的默认值），`defaultdict` 在访问缺失键时就**不再自动补默认值**，而是像普通 `dict` 一样抛 `KeyError`。这是 `defaultdict` 一个容易被忽略的"退化"行为。

```python
from collections import defaultdict

d = defaultdict()          # 等价于 defaultdict(None)，没有工厂
d["a"] = 1
print(d["a"])              # 输出：1
# print(d["b"])            # KeyError: 'b'   ← 工厂为 None，不自动补

# 显式设为 None 同理
d.default_factory = None
# print(d["c"])            # KeyError
```

这个"工厂为 None"的退化看似没用，实际有两个用途：一是当你想中途"关闭"自动默认行为（设 `default_factory = None`），让后续访问恢复成严格抛错；二是一些库内部用 `defaultdict` 既能享自动默认、又能随时退回普通行为。但对日常使用，记住一条：**不传工厂的 `defaultdict()` 等于普通 dict，自动默认能力没开启**——别误以为"只要是 defaultdict 就一定自动补默认"。

### 2.3 等价于 setdefault 的手动实现

要真正理解 `defaultdict` 在做什么，看一个等价的"手动实现"——给普通 `dict` 子类化，重写 `__missing__` 钩子：

```python
class MyDefaultDict(dict):
    def __init__(self, factory):
        super().__init__()
        self.default_factory = factory

    def __missing__(self, key):
        # 键缺失时由 __getitem__ 触发
        if self.default_factory is None:
            raise KeyError(key)        # 工厂为 None：维持普通 dict 行为
        value = self.default_factory()  # 调用工厂造默认值
        self[key] = value               # 写入字典
        return value

d = MyDefaultDict(list)
d["x"].append(1)
print(d["x"])   # 输出：[1]
```

标准库的 `defaultdict` 本质就是这个 `MyDefaultDict`。核心机制是 `__missing__`：`dict.__getitem__` 在找不到键时，会检查类型是否定义了 `__missing__`，定义了就调用它。`defaultdict` 的 `__missing__` 干了三件事——调用工厂、写入字典、返回值。理解了这个等价实现，前面所有疑问（"它怎么知道用空列表"、"为什么写到字典里了"）都迎刃而解。

### 2.4 经典范式一：分组归类

`defaultdict(list)` 是最常见的用法——按某关键字分组，每组用一个列表累积元素。和上一篇 `setdefault` 范式对照，这里循环体最干净。

```python
from collections import defaultdict

# 按部门分组员工
employees = [
    ("Alice", "Engineering"),
    ("Bob", "Sales"),
    ("Carol", "Engineering"),
    ("Dave", "HR"),
    ("Eve", "Sales"),
]

by_dept = defaultdict(list)
for name, dept in employees:
    by_dept[dept].append(name)    # 任何 dept 首次访问都自动建空列表

print(dict(by_dept))
# 输出：{'Engineering': ['Alice', 'Carol'], 'Sales': ['Bob', 'Eve'], 'HR': ['Dave']}

# 直接遍历使用
for dept, members in by_dept.items():
    print(f"{dept}: {len(members)} 人")
# 输出：
# Engineering: 2 人
# Sales: 2 人
# HR: 1 人
```

末尾 `dict(by_dept)` 是个常用小技巧——`defaultdict` 在多数场合能当普通 dict 用，但若要把结果传给"只接受 dict、不认识 defaultdict"的代码（或想消除"意外触发自动创建"的风险），转成普通 dict 更稳妥。注意这个转换是浅拷贝，键值引用共享。

### 2.5 工厂为 lambda：自定义默认值

内置类型能覆盖 `0`、`[]`、`{}`、`""` 这些"中性初始值"，但默认值若需要带初始内容或更复杂的逻辑，就得用 `lambda` 包一层。

```python
from collections import defaultdict

# 默认值是带初始项的列表
dd = defaultdict(lambda: ["pending"])
print(dd["task1"])    # 输出：['pending']
dd["task1"].append("running")
print(dd["task1"])    # 输出：['pending', 'running']
print(dd["task2"])    # 输出：['pending']   ← 新键又是全新的 ["pending"]
```

注意这里 `lambda` 的关键作用：每次缺失都用 `lambda` 产生**新的** `["pending"]`，所以每个键拿到独立列表，不会共享。如果误写成 `defaultdict(["pending"])`——把列表直接当工厂——会立刻报错，因为 `["pending"]` 不是可调用对象：

```python
# ❌ 错误：list 是可调用的（无参得到 []），但 ["pending"] 这个列表实例不可调用
# dd = defaultdict(["pending"])   # TypeError: first argument must be callable or None
```

`lambda` 的另一个高频场景是嵌套 `defaultdict`，用于构建任意深度的自动初始化树（见 2.8 节）。

### 2.6 经典范式二：计数

`defaultdict(int)` 把缺失键默认成 0，正好适合计数——不需要像 `setdefault` 那样"取值+1 再赋回"，直接 `d[k] += 1` 一步到位。

```python
from collections import defaultdict

text = "the quick brown fox the lazy dog the cat"
words = text.split()

counts = defaultdict(int)
for w in words:
    counts[w] += 1          # 缺失键默认 0，+1 后写回

print(dict(counts))
# 输出：{'the': 3, 'quick': 1, 'brown': 1, 'fox': 1, 'lazy': 1, 'dog': 1, 'cat': 1}

# 找出现最多的词
top = max(counts, key=counts.get)
print(top)    # 输出：the
```

不过要诚实地说：如果就是单纯的计数，`collections.Counter` 比 `defaultdict(int)` 更贴切——`Counter` 是专门为计数设计的，一行 `Counter(words)` 就完成，还自带 `most_common` 等便捷方法。

```python
from collections import Counter
c = Counter(words)
print(c.most_common(2))    # 输出：[('the', 3), ('quick', 1)]
```

所以计数场景的优先级是：**`Counter` > `defaultdict(int)` > `setdefault`**。`defaultdict(int)` 适合"计数只是过程中的一步、还需要其它字典操作"的场合；纯计数直接用 `Counter`。

### 2.7 经典范式三：邻接表与去重集合

`defaultdict(set)` 适合"关系收集 + 自动去重"的场景，比如建图的邻接表：每条边加入一个集合，自动去除重复边。

```python
from collections import defaultdict

edges = [("A", "B"), ("A", "C"), ("B", "C"), ("A", "B")]   # A-B 重复
graph = defaultdict(set)
for a, b in edges:
    graph[a].add(b)     # set 自动去重

print(dict(graph))
# 输出：{'A': {'B', 'C'}, 'B': {'C'}}   ← 重复的 A-B 只存一次
```

`defaultdict(set)` 比 `defaultdict(list)` 多了"自动去重"的语义，适合"收集关系/分类、且同一项不应重复出现"的需求。要权衡的是 `set` 的成员判断 O(1) 但无序，若你需要保留插入顺序又去重，得用别的结构（如 Python 3.7+ dict 当有序集合用）。

### 2.8 嵌套 defaultdict：任意深度自动初始化

`lambda` 工厂能返回另一个 `defaultdict`，从而构建"任意层缺失都自动初始化"的嵌套字典，这是 `defaultdict` 相对 `setdefault` 的杀手级优势——`setdefault` 超过两层就难读，而嵌套 `defaultdict` 写起来很自然。

```python
from collections import defaultdict

# 两级：地区 → 城市 → 人口列表
pop = defaultdict(lambda: defaultdict(list))
records = [("华北", "北京", 2170), ("华北", "天津", 1560),
           ("华东", "上海", 2487), ("华北", "北京", 2180)]

for region, city, p in records:
    pop[region][city].append(p)    # 任一层缺失都自动补

print(pop["华北"]["北京"])    # 输出：[2170, 2180]
print(pop["华东"]["上海"])    # 输出：[2487]
print(pop["华南"]["广州"])    # 输出：[]   ← 华南/广州 都不存在，自动建两级空容器
```

`pop[region][city].append(p)` 这一行，三处取值每处都可能在缺失时自动初始化：`pop[region]` 缺失则建内层 `defaultdict(list)`，`[city]` 缺失则建空列表，最后 `append`。整段代码无需任何 `if`/`setdefault`，读起来就是"顺着路径写"。换 `setdefault` 写同样逻辑会变成 `pop.setdefault(region, {}).setdefault(city, []).append(p)`——能跑但视觉负担重。

三层以上同样可行，但要注意一个经典陷阱：用 `defaultdict(lambda: defaultdict(...))` 时，最外层和内层共享同一个 `lambda` 闭包要小心工厂的写法。更稳妥的多层工厂见 5.2 节。

### 2.9 默认值是写入即持久化的副作用

`defaultdict` 一个必须牢记的特性：**自动产生的默认值会被写入字典、持久保留**。这和 `get`（不写入）截然不同，比 `setdefault`（也是写入）一致。这也带来一个副作用——**任何"探查式"访问都会污染字典**。

```python
from collections import defaultdict

d = defaultdict(int)

# 只是想知道某键在不在、值是多少——但这会建键
print(d["x"])          # 输出：0
print("x" in d)        # 输出：True   ← 糟了，"x" 被自动加进去了
print(len(d))          # 输出：1

# 对比：如果只想探查不创建，要么用 in（不触发工厂），要么用 get
print("y" in d)        # 输出：False   ← in 不创建
print(d.get("y"))      # 输出：None    ← get 不创建
print("y" in d)        # 输出：False   ← 仍未创建
```

这条特性是 `defaultdict` 与 `setdefault`/`get` 的关键分水岭：前者"访问即建"，后两者可控。在"不想因为查询而改变字典"的场景（如检查配置项、序列化前清理），`defaultdict` 的自动建键会带来意外——字典里凭空多出很多 `0`/`[]`/`{}` 的键。这也是为什么 2.4 节末尾建议"结果转成普通 dict 再传出"——既能消除后续的意外建键，又能让接口更清晰。

### 2.10 defaultdict 与 setdefault 的对照

把上一篇的主角和这一篇的主角放一起对照，二者的边界会非常清晰：

| 维度       | `defaultdict`                  | `setdefault`                   |
| ---------- | ------------------------------ | ------------------------------ |
| 触发方式   | 取值（`d[k]`）时自动触发       | 显式调用方法时触发             |
| 范围       | 全局——所有取值点都生效         | 局部——只在调用处生效           |
| 默认值来源 | 创建时声明的工厂函数           | 每次调用显式传入的参数         |
| 惰性       | 是——工厂仅在缺失时调用         | 否——default 参数即时求值       |
| 探查式访问 | 会建键（有副作用）             | 不建键（用 get/in 时无副作用） |
| 适用场景   | 全程都要自动默认               | 少数几处需要默认               |
| 代价       | 创建时多一行声明、可能意外建键 | 每处都要写默认值               |

一句话总结：**全程都要自动默认用 `defaultdict`，局部按需默认用 `setdefault`**。两者互补，不是替代关系——同一个项目里完全可能有的字典用 `defaultdict`、有的地方用 `setdefault`，按"自动默认的范围"选。

## 3. 最佳实践

### 3.1 推荐写法 vs 不推荐写法

**分组归类用 defaultdict(list)，循环体最干净**

```python
from collections import defaultdict
pairs = [("a", 1), ("a", 2), ("b", 3)]

# ✅ 推荐：defaultdict，循环体只有业务逻辑
d = defaultdict(list)
for k, v in pairs:
    d[k].append(v)

# ❌ 不推荐（相对啰嗦）：每个取值点都 setdefault
d2 = {}
for k, v in pairs:
    d2.setdefault(k, []).append(v)
```

**探查用 in / get，避免 defaultdict 意外建键**

```python
d = defaultdict(list)

# ✅ 推荐：判断键存在用 in（不触发工厂）
if "x" in d:
    process(d["x"])

# ❌ 不推荐：用 d["x"] 探查会建键
# if d["x"]:        # 糟了，"x" 被建成了 []
#     ...

# ✅ 推荐：只读取默认用 get（不写入）
fallback = d.get("missing", [])
```

**传给外部前转回普通 dict**

```python
# ✅ 推荐：结果转 dict，避免下游意外建键
def group_items(pairs):
    d = defaultdict(list)
    for k, v in pairs:
        d[k].append(v)
    return dict(d)      # 转普通 dict 再返回

# ❌ 不推荐：直接返回 defaultdict，调用方可能误触建键
# return d
```

### 3.2 工厂必须无参可调用

`default_factory` 必须能 `factory()` 无参调用。常见的可作工厂的：`list`、`dict`、`set`、`int`、`float`、`str`、`bool`，或自己写的无参 `lambda`/函数。不能当工厂的是：非可调用对象（如 `[]`、`{}`、`0` 这些实例）、需要参数的可调用对象。

```python
from collections import defaultdict

# ✅ 都是"无参调用得到所需初始值"的类型
defaultdict(list)    # []
defaultdict(dict)    # {}
defaultdict(int)     # 0
defaultdict(str)     # ""

# ✅ 自定义无参 lambda
defaultdict(lambda: {"count": 0, "items": []})

# ❌ 非可调用对象
# defaultdict([])       # TypeError: first argument must be callable or None
# defaultdict(0)        # TypeError

# ❌ 需要参数的可调用对象
# defaultdict(lambda x: x)   # 运行时会 TypeError: <lambda>() missing 1 argument
```

### 3.3 不要让工厂返回共享的可变默认值

`lambda` 工厂每次调用都执行函数体，所以 `lambda: []` 每次产生**新**列表，键之间不共享——这点 `defaultdict` 是安全的，没有 `fromkeys`/默认参数那种共享陷阱。但仍要避免一种写法：把一个**预先建好的可变对象**塞进工厂返回，导致所有键共享它。

```python
from collections import defaultdict

# ❌ 反模式：工厂返回同一个预先建好的列表，所有键共享
shared = []
d = defaultdict(lambda: shared)
d["a"].append(1)
d["b"].append(2)
print(d["a"])          # 输出：[1, 2]   ← a 被污染了！
print(d["a"] is d["b"])  # 输出：True

# ✅ 正确：工厂内部新建，每次独立
d2 = defaultdict(list)            # list() 每次新建
d3 = defaultdict(lambda: [])      # lambda 内 [] 每次新建，等价
d3["a"].append(1)
d3["b"].append(2)
print(d3["a"])         # 输出：[1]
```

记住原则：工厂函数体里应"产生"新对象，而非"返回"固定对象。`lambda: []` 与 `list` 都满足，安全；`lambda: shared` 不满足，危险。

### 3.4 计数用 Counter，别勉强 defaultdict

```python
from collections import Counter, defaultdict
words = ["a", "b", "a", "c", "a"]

# ✅ 推荐：纯计数用 Counter
c = Counter(words)
print(c.most_common(1))   # 输出：[('a', 3)]

# ⚠️ 仅当计数混在其它字典操作中、或不想引入 Counter 时用 defaultdict(int)
counts = defaultdict(int)
for w in words:
    counts[w] += 1
```

`Counter` 还提供 `+`/`-`/`&`/`|` 等集合式运算和 `most_common`，纯计数场景它就是为这设计的。`defaultdict(int)` 的优势在于"它本质还是 dict，能和其它 dict 操作无缝混用"，适合计数只是副产品的场合。

### 3.5 中途关闭自动默认

```python
from collections import defaultdict

d = defaultdict(int)
d["a"] += 1
d["b"] += 1

# 构建阶段结束后，想让它"只读不建"
d.default_factory = None
# d["c"]            # 现在 KeyError: 'c'，恢复成普通 dict 严格行为
print(dict(d))      # 输出：{'a': 1, 'b': 1}
```

这个技巧适合"先用 defaultdict 方便地构建、再锁定成只读"的两阶段用法。设置 `default_factory = None` 后，`defaultdict` 在缺失键上和普通 dict 表现一致。需要时还能再设回来恢复自动默认。

### 3.6 defaultdict 不是并发安全容器

和普通 dict 一样，`defaultdict` 的"读取或写入"不是原子操作。虽然单次 `d[k] += 1` 看似一步，实际是"读取（可能触发工厂建键）→ 加 1 → 写回"的复合操作，多线程下会丢更新。需要并发安全要用 `threading.Lock` 或专门的并发结构，不要因为 `defaultdict` 能自动建键就误以为它线程安全。

```python
# 多线程下这种"计数"会丢更新
# counts = defaultdict(int)
# def worker(items):
#     for w in items:
#         counts[w] += 1     # 非原子，并发下计数偏小
```

值得展开一点：`defaultdict` 在多线程下还有一个"建键竞争"的边界。当两个线程同时访问同一个缺失键时，理论上 `__missing__` 可能被各调用一次、各造一个默认值、后写的覆盖先写的。对"分组追加"这类场景，丢失的是一次"建键"动作而非数据（因为两个线程都会得到一个列表，问题是其中一个列表会被丢弃，导致该线程的 append 丢失）。所以并发分组归类必须加锁，不能依赖 `defaultdict` 的自动建键。这条边界和上一篇 `setdefault` 的并发讨论呼应——凡涉及"判断后写入"的复合语义，字典都不是并发安全的，自动默认机制也救不了。

### 3.7 序列化与可pickle性

`defaultdict` 能被 `pickle` 序列化，这对缓存、进程间传递很关键。它的 `default_factory` 必须本身可 pickle——内置类型（`list`/`int`/...）都满足，但用 `lambda` 当工厂会有坑：`lambda` 在标准 pickle 下**不可序列化**，会导致序列化失败。

```python
import pickle
from collections import defaultdict

# ✅ 内置类型工厂：可 pickle
d1 = defaultdict(list)
d1["a"].append(1)
data = pickle.dumps(d1)            # 正常
d1_back = pickle.loads(data)
print(d1_back["a"])                # 输出：[1]

# ❌ lambda 工厂：pickle 失败
d2 = defaultdict(lambda: ["pending"])
# pickle.dumps(d2)   # AttributeError: Can't pickle <lambda> ...
```

需要序列化又必须用自定义默认值时，用一个**模块级具名函数**替代 `lambda`——具名函数可 pickle：

```python
import pickle
from collections import defaultdict

# 模块级具名函数（不是 lambda），可 pickle
def _pending_list():
    return ["pending"]

d = defaultdict(_pending_list)
d["t1"].append("run")
data = pickle.dumps(d)             # 正常
d_back = pickle.loads(data)
print(d_back["t1"])                # 输出：['pending', 'run']
print(d_back["t2"])                # 输出：['pending']   ← 工厂也恢复了
```

命名要点：工厂函数最好定义在模块顶层（而非闭包内），且不要是 `lambda`，这样才能安全序列化。如果数据要在多进程/缓存/Redis 里流转，这点是硬约束。

## 4. 原理

### 4.1 **missing** 钩子：自动默认的核心

`defaultdict` 的全部魔法集中在一个钩子方法 `__missing__` 上。`dict.__getitem__`（即 `d[key]` 的底层）在哈希表里找不到键时，会检查"当前字典类型是否定义了 `__missing__`"——如果定义了，就调用 `__missing__(key)` 让它补救，而不是直接抛 `KeyError`。普通 `dict` 没有 `__missing__`，所以缺键直接抛错；`defaultdict` 重写了它，在缺键时调用工厂造默认值。

```python
# defaultdict.__missing__ 的等价实现
def __missing__(self, key):
    if self.default_factory is None:
        raise KeyError(key)          # 工厂为 None：维持普通 dict 行为
    value = self.default_factory()   # 调用工厂造默认值
    self[key] = value                # 写入，所以后续访问能命中
    return value
```

这三步——造值、写入、返回——解释了 2.9 节那个"访问即持久化"的特性：因为 `__missing__` 把默认值 `self[key] = value` 写进了字典，下次访问就直接命中，不再调工厂。这也解释了为什么 `defaultdict` 的自动默认"只发生一次"——首次缺失时写入，此后该键就和普通键无异。

### 4.2 工厂的调用时机：惰性求值

`default_factory` 的调用是**惰性**的——只有在真正取值且键缺失时才调用，这与 `setdefault` 的 `default` 参数"即时求值"形成鲜明对比（上一篇 4.2 节）。这个惰性是 `defaultdict` 在"默认值构造昂贵"场景胜过 `setdefault` 的根本原因。

```python
def expensive():
    print("造默认值（昂贵）")
    return []

from collections import defaultdict
d = defaultdict(expensive)

# 只读已有键，不触发工厂
d["a"] = [1]
print(d["a"])      # 输出：[1]   ← 不打印"造默认值"，工厂没被调用

# 访问缺失键才触发
print(d["b"])      # 输出：造默认值（昂贵） / []
# 再次访问同一键，工厂不再调用（已写入）
print(d["b"])      # 输出：[]   ← 不打印"造默认值"
```

对比 `setdefault`：`d.setdefault("a", expensive())` 中 `expensive()` 在调用 `setdefault` 前就执行了，即使 `"a"` 已存在也白跑。`defaultdict` 的惰性让"昂贵默认值"也能毫无代价地使用——这是它相对 `setdefault` 的结构性优势，不是小优化。

### 4.3 **missing** 只被 d[key] 触发，不被其它方法触发

一个重要的细节：`__missing__` 只由 `__getitem__`（`d[key]` 取值）触发，**不被** `__contains__`（`in`）、`get`、`__eq__`（== 比较）等触发。这就解释了为什么 3.1 节说"探查用 in/get 不会建键"——它们绕开了 `__missing__`。

```python
from collections import defaultdict
d = defaultdict(list)

# 这些都不触发 __missing__，不建键
print("x" in d)       # 输出：False   ← __contains__，不建
print(d.get("x"))     # 输出：None    ← get，不建
print(d == {"x": []}) # 输出：False   ← 比较，不建
print(len(d))         # 输出：0       ← 没建

# 只有 [] 取值才建键
print(d["x"])         # 输出：[]
print("x" in d)       # 输出：True    ← 现在有了
```

记住这条："只有 `d[key]` 形式的取值会自动建键，`in`/`get`/比较/遍历都不会"。它既是 `defaultdict` 行为的精确刻画，也给了你"想探查又不建键"的可靠手段——用 `in` 或 `get`。

### 4.4 defaultdict 是 dict 的子类

`defaultdict` 继承自 `dict`，所以它拥有 `dict` 的全部方法（`keys`、`values`、`items`、`update`、`pop`、`copy` 等），行为与普通 dict 一致，只是多了 `default_factory` 属性和 `__missing__` 行为。这意味着：

```python
from collections import defaultdict
d = defaultdict(list)
d["a"].append(1)

# 普通 dict 的方法都能用
print(d.keys())          # 输出：dict_keys(['a'])
print(d.get("b", "缺"))  # 输出：缺   ← get 不触发工厂
d.update({"c": [3]})     # update 正常工作
print(isinstance(d, dict))  # 输出：True   ← 是 dict 子类
```

`isinstance(d, dict)` 为 `True`，所以凡接受 `dict` 的函数/类型注解都接受 `defaultdict`——这点对和现有代码集成很重要。`d.copy()` 会复制出一个新的 `defaultdict`，且保留同一个 `default_factory`（注意是同一个工厂引用，但工厂本身每次调用仍产生新对象，所以拷贝是安全的）。

### 4.5 工厂异常时不会部分写入

如果工厂函数自己抛异常，`defaultdict` 会怎样？答案是异常正常向上抛，且字典**不会被部分写入**——因为 `__missing__` 是"先造值成功，再写入"，造值阶段就抛了，写不到 `self[key] = value` 那一步，键不会被创建。

```python
from collections import defaultdict

def broken():
    raise ValueError("工厂坏了")

d = defaultdict(broken)
try:
    d["x"]            # 工厂抛 ValueError
except ValueError as e:
    print(e)          # 输出：工厂坏了
print("x" in d)       # 输出：False   ← 键没被建，字典保持原状
print(len(d))         # 输出：0
```

这个"原子性"很有用：工厂失败不会留下半成品键。但要注意，如果工厂返回后、写入前发生异常（极少见，如内存错误），则另当别论。正常使用中，工厂抛错即"什么都没发生"，可以安全重试或回退。

## 5. 总结

### 5.1 defaultdict 速查

```
创建：
- defaultdict(factory)            工厂无参可调用：list/dict/set/int/float/str/bool/lambda
- defaultdict(factory, 初始项)    带初始键值对
- defaultdict()                   工厂为 None，退化为普通 dict

行为：
- d[key] 取值，缺失时调用 factory() 造值、写入、返回
- in / get / 遍历 / 比较  不触发工厂，不建键
- default_factory = None         中途关闭自动默认，恢复 KeyError
- 工厂抛异常                      不写入，字典保持原状

经典工厂：
- list    分组归类：d[k].append(v)
- int     计数：d[k] += 1      （纯计数优先 Counter）
- set     邻接表/去重收集：d[k].add(v)
- lambda  自定义默认值/嵌套结构

判据：
- 全程自动默认 → defaultdict；局部按需 → setdefault；只读不建 → get/in
- 默认值廉价或昂贵均可（工厂惰性，优于 setdefault 的即时求值）
- 单纯计数 → Counter；计数混在 dict 操作中 → defaultdict(int)
- 传给外部前转 dict(d)，消除下游意外建键风险
```

### 5.2 嵌套工厂的稳妥写法

> 本节先给出一个典型陷阱，再给出已知层级与动态层级两种稳妥写法，务必连同代码注释一起理解——这是 `defaultdict` 最容易写错的地方。

多层嵌套的根本难点在于：**每一层的工厂返回值类型决定了下一层能做什么操作**。中间层必须是 dict（才能再 `[]`），叶子层必须是你要操作的容器（list 才能 append、set 才能 add、int 才能 `+=`）。把这两件事用不同工厂表达清楚，嵌套就不会出错。

判断层级的简易办法：从最外层往里数 `[]` 的层数，每多一层 `[]` 就多一层 `defaultdict(...)`，只有最里一层换成你要操作的实际容器工厂。

多层嵌套 `defaultdict` 有一个经典陷阱：直接链式 `lambda` 时，内层和外层的工厂要写对，避免共享。稳妥的多层工厂用函数递归式定义，每层独立。

```python
from collections import defaultdict

# 稳妥的两级：地区 → 城市 → 数值列表
def tree():
    return defaultdict(tree)          # 递归：任意层缺失都建下一级 tree()

pop = tree()
pop["华北"]["北京"].append(2170)      # 注意：叶子要自己保证是 list？
# 上面这行其实有问题：tree() 返回的是 defaultdict，不是 list，不能 append
```

上面这个例子暴露了一个真实陷阱：`defaultdict(tree)` 让每一层都是 `defaultdict`，叶子节点也是 `defaultdict` 而非列表，无法直接 `append`。所以"任意深度 + 叶子是容器"需要更精细的工厂设计——通常只在已知层级时用固定深度的 `lambda` 嵌套：

```python
# 已知两级的正确写法
pop = defaultdict(lambda: defaultdict(list))   # 外层 dict，内层 list
pop["华北"]["北京"].append(2170)               # 内层是 list，能 append
print(pop["华北"]["北京"])   # 输出：[2170]

# 已知三级
deep = defaultdict(lambda: defaultdict(lambda: defaultdict(int)))
deep["a"]["b"]["c"] += 1
print(deep["a"]["b"]["c"])   # 输出：1
```

经验法则：**嵌套 `defaultdict` 只在层级已知时用对应深度的 `lambda` 链；层级动态时改用递归工厂 + 显式处理叶子**，不要指望一个 `tree()` 函数同时搞定"中间层是 dict、叶子是 list"。

### 5.3 核心要点回顾

- `defaultdict` 是 `dict` 子类，访问缺失键时调用 `default_factory()` 造默认值、写入并返回。
- 核心机制是 `__missing__` 钩子，只由 `d[key]` 取值触发，`in`/`get`/遍历/比较都不触发、不建键。
- 工厂必须无参可调用（`list/int/set/str` 等类型或 `lambda`）；自定义默认值用 `lambda` 包一层。
- 工厂惰性求值——仅在缺失时调用，这是它胜过 `setdefault`（即时求值）的关键。
- 经典范式：`list` 分组、`int` 计数（纯计数用 `Counter`）、`set` 去重收集、`lambda` 嵌套自动初始化。
- 自动建键有副作用（探查式访问会污染字典）；传外部前 `dict(d)` 转普通 dict 更稳妥。
- `default_factory=None` 可中途关闭自动默认，恢复 `KeyError`；工厂异常时不部分写入。
- `defaultdict` 不是并发安全容器，复合操作仍需加锁。

### 5.4 读完应能掌握

- 能说清 `defaultdict`、`setdefault`、`get`/`in` 的边界，按"自动默认的范围 + 是否要写入"正确选用。
- 能为分组、计数、邻接表、嵌套字典场景写出对应的工厂，并解释为什么这样选工厂。
- 能识别并规避"探查式访问意外建键""工厂返回共享可变对象""嵌套工厂叶子类型不对"等陷阱。
- 能从 `__missing__` 钩子和惰性求值的原理，解释 `defaultdict` 为何自动建键、为何惰性优于 `setdefault`。
- 能在实际代码中判断何时该用 `defaultdict`、何时该退回 `setdefault`/`Counter`/普通 `dict`。

### 5.5 常见面试问题

**问题一：`defaultdict` 和普通 `dict` 的区别？**

```python
from collections import defaultdict
d = defaultdict(list)
print(d["x"])        # 输出：[]   ← 缺失自动建空列表
# 普通 dict: print({}["x"]) → KeyError
# 机制：defaultdict 重写 __missing__，缺失时调 factory() 造值、写入、返回。
```

**问题二：`defaultdict(list)` 和 `setdefault` 各在什么时候用？**

```python
# defaultdict：全程都要自动默认时，取值点最干净
d = defaultdict(list)
for k, v in pairs:
    d[k].append(v)

# setdefault：只在少数几处需要默认时，局部精准
bucket = d.setdefault(k, [])
# 判据：自动默认的范围。全局→defaultdict，局部→setdefault。
```

**问题三：为什么 `d["x"]` 会建键，但 `"x" in d` 不会？**

```python
from collections import defaultdict
d = defaultdict(int)
d["a"]               # 触发 __missing__，建键
# __missing__ 只由 __getitem__(d[key]) 触发；
# in 走 __contains__、get 不走 __getitem__ 的未命中分支，都不调 __missing__，故不建键。
print("b" in d)      # 输出：False，未建
print(d.get("b"))    # 输出：None，未建
```

**问题四：怎么实现一个默认值是 `["pending"]` 的 defaultdict？**

```python
from collections import defaultdict
# 不能直接 defaultdict(["pending"])——列表实例不可调用
# 用 lambda 包一层，每次产生全新列表
d = defaultdict(lambda: ["pending"])
print(d["t1"])       # 输出：['pending']
d["t1"].append("run")
print(d["t1"])       # 输出：['pending', 'run']
print(d["t2"])       # 输出：['pending']   ← 新键全新列表，不共享
```

### 5.6 实战串讲：倒排索引

把本篇用法串在一个贴近真实的场景——构建一个简单的"倒排索引"（inverted index）：给定一批文档，建立"词 → 出现该词的文档集合"的映射，要求自动去重、统计词频。

```python
from collections import defaultdict, Counter

docs = {
    "doc1": "the quick brown fox",
    "doc2": "the lazy dog",
    "doc3": "the quick dog",
}

# 倒排索引：词 → 出现的文档集合（去重）
index = defaultdict(set)
# 词频统计：词 → 总出现次数
freq = defaultdict(int)

for doc_id, text in docs.items():
    for word in text.split():
        index[word].add(doc_id)    # set 自动去重，每词每文档只记一次
        freq[word] += 1            # 计每次出现

# 查询：哪些文档包含 "quick"
print(index["quick"])   # 输出：{'doc1', 'doc3'}

# 查询：包含 "the" 的文档（高频词）
print(sorted(index["the"]))   # 输出：['doc1', 'doc2', 'doc3']

# 词频
print(dict(freq))       # 输出：{'the': 3, 'quick': 2, 'brown': 1, 'fox': 1, 'lazy': 1, 'dog': 2}

# 注意：查询一个没出现过的词，不会建键之外还安全吗？
# index["missing"] 会建一个空 set！探查应用 in 或 get
print("missing" in index)   # 输出：False   ← 安全，未建
```

这段代码同时用到了 `defaultdict(set)`（去重收集）和 `defaultdict(int)`（计数），并在末尾提醒了"探查用 in 避免建键"的细节。每一处工厂都对应了它的语义——`set` 表达"关系去重"、`int` 表达"计数累加"。能写出这样"工厂选择贴合业务语义、并清楚边界"的代码，本篇的目标就达成了。

值得对比的是：若把 `freq` 换成 `Counter`，纯计数部分会更简洁（`Counter(text.split())`），但这里 `freq` 混在遍历循环里、和 `index` 一起构建，`defaultdict(int)` 与 `defaultdict(set)` 写法对称、可读性反而更好。这也是 3.4 节"计数混在 dict 操作中可用 defaultdict"的一个实例。

### 5.7 延伸

`defaultdict` 和上一篇的 `setdefault` 共同覆盖了"键缺失时自动补默认值"的全部需求——前者管全局、后者管局部。再往后，字典家族还有几个成员值得了解：`Counter` 是"计数专用字典"，提供 `most_common` 和集合式运算；`OrderedDict` 在需要 `move_to_end`、按相等性比较时考虑顺序等独特能力时仍有用（尽管 3.7+ 普通 dict 已保留插入顺序）；以及《字典底层原理哈希表》对 `__missing__`、哈希表、resize 的更底层剖析。理解了 `defaultdict` 的"工厂惰性 + `__missing__` 自动触发"，你就掌握了字典家族中"主动补默认"这一支的全部要点，剩下的是在不同专用字典间按需选择。

最后给出一条贯穿本系列三篇（setdefault / defaultdict / Counter）的总判据，作为收束：面对"键可能缺失"的需求，先问**三个问题**——①取值后字典该不该变？（不变→`get`/`in`；变→`setdefault`/`defaultdict`）②自动默认的范围是全局还是局部？（全局→`defaultdict`；局部→`setdefault`）③需求是否专一？（纯计数→`Counter`）。三个问题答完，工具基本就定了。这条判据能帮你从一长串候选 API 里快速收敛到正确那一个，而不必在 `get`/`setdefault`/`defaultdict`/`Counter` 之间反复比较。
