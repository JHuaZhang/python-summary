---
group:
  title: 【07】字典深度剖析
  order: 7
order: 3
title: setdefault设置默认值
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 setdefault

`dict.setdefault(key, default=None)` 是字典的一个内置方法，它把"取值"和"写入默认值"两个动作合并成一次原子操作：如果键存在，返回对应值且**不做任何修改**；如果键不存在，则把 `default` 写入字典并返回 `default`。换句话说，它保证了"调用之后，这个键一定在字典里、且能拿到一个值"。

```python
d = {"a": 1, "b": 2}

# 键存在：返回已有值，字典不变
print(d.setdefault("a", 99))   # 输出：1
print(d)                       # 输出：{'a': 1, 'b': 2}   ← 没被改

# 键不存在：写入默认值并返回它
print(d.setdefault("c", 99))   # 输出：99
print(d)                       # 输出：{'a': 1, 'b': 2, 'c': 99}   ← "c" 被加了进来
```

`setdefault` 解决的是上篇《键值存取》里那个"四象限"中"安全 + 写入"那一格——当你不仅想"取到值或默认值"，还想"把这个默认值固化进字典、以便后续复用"时，`get` 不够用了（`get` 不写入），而 `setdefault` 正是为这个场景而生。

### 1.2 为什么需要 setdefault：对比 get 的不足

理解 `setdefault` 的价值，最好的方式是先看 `get` 在哪类需求上力不从心。考虑一个典型场景：按某关键字把一批数据"分组"装进字典，每个关键字对应一个列表，把元素追加进去。

```python
pairs = [("fruit", "apple"), ("fruit", "banana"), ("veggie", "carrot")]

# 用 get 写：键不存在时 get 不写入，下次还得再判断
groups = {}
for category, name in pairs:
    bucket = groups.get(category)
    if bucket is None:
        bucket = []
        groups[category] = bucket
    bucket.append(name)
print(groups)   # 输出：{'fruit': ['apple', 'banana'], 'veggie': ['carrot']}
```

这段代码能跑，但有个啰嗦的"判断 + 赋值 + 追加"三段式。问题根源在于 `get` 不写入——每次遇到新键都要手动 `groups[category] = []`。而 `setdefault` 把这三步缩成一行：

```python
groups = {}
for category, name in pairs:
    groups.setdefault(category, []).append(name)
print(groups)   # 输出：{'fruit': ['apple', 'banana'], 'veggie': ['carrot']}
```

`groups.setdefault(category, [])` 这一行的含义是："确保 `category` 这个键存在、值为一个列表（不存在就放个空列表），然后返回那个列表"。拿到列表后直接 `append`，无论是新键还是已有键都一视同仁。这就是 `setdefault` 的核心价值：**用一行代码完成取值或初始化，并保证键一定存在**。

### 1.3 方法签名与返回值

`setdefault` 的签名是 `d.setdefault(key, default=None)`：

- 第一参数 `key` 是要查询/设置的键，必须是可哈希对象（和所有字典键一样的约束）。
- 第二参数 `default` 可省略，默认 `None`。键不存在时它既是"写入字典的值"，也是"方法的返回值"。
- **返回值**：键存在返回已有值；键不存在返回 `default`（同时把它写进字典）。这一返回值特性是它区别于单纯赋值的关键——既能拿到值，又顺手完成了初始化。

```python
d = {}
# 不传 default：默认 None
print(d.setdefault("x"))   # 输出：None
print(d)                   # 输出：{'x': None}

# 传 default：写入并返回它
print(d.setdefault("y", []))   # 输出：[]
print(d)                       # 输出：{'x': None, 'y': []}
```

注意一个容易混淆的点：`setdefault` 的名字常被误读为"设置一个默认值备用"。更准确的理解是"取值；如果键不存在，则**设置**这个**默认**值并返回它"——它首先是一个取值操作，设置默认值只是"键不存在时的副作用"。先把这点咬准，后面所有用法都会很自然。

## 2. 核心内容

### 2.1 基本语义：键存在 vs 键不存在

`setdefault` 的行为完全由"键是否存在"分两支，需要把这两支都看清楚。

**键存在：返回已有值，字典不变**

```python
d = {"host": "localhost", "port": 8080}

# 键存在：返回已有值，绝不覆盖
print(d.setdefault("host", "0.0.0.0"))   # 输出：localhost   ← 仍是原值
print(d.setdefault("port", 9999))        # 输出：8080
print(d)                                 # 输出：{'host': 'localhost', 'port': 8080}
```

这一支最容易踩的坑是误以为 `setdefault` 会"用默认值覆盖原值"——它不会。一旦键已存在，`default` 参数完全被忽略，原值原样保留。如果你真的想"键不存在才设、存在就覆盖"，那不是 `setdefault`，而是 `d[key] = value`（无条件赋值）。两者语义相反，别用混。

**键不存在：写入默认值并返回它**

```python
d = {}
print(d.setdefault("timeout", 30))   # 输出：30    ← 写入并返回
print(d)                             # 输出：{'timeout': 30}
print(d["timeout"])                  # 输出：30    ← 确实写进了字典
```

这一支是 `setdefault` 真正的用武之地：调用之后，键一定以 `default` 为值存在于字典里，后续可以直接用 `d[key]` 取，不需要再判断。

### 2.2 经典范式一：分组归类（group by）

`setdefault` 最经典的用途，是把一串记录按某字段分组，每组用一个可变容器（通常是列表）累积元素。这种"分组归类"模式在数据聚合场景极为常见。

```python
# 按城市分组员工
employees = [
    ("Alice", "Beijing"),
    ("Bob", "Shanghai"),
    ("Carol", "Beijing"),
    ("Dave", "Shenzhen"),
    ("Eve", "Shanghai"),
]

by_city = {}
for name, city in employees:
    by_city.setdefault(city, []).append(name)

print(by_city)
# 输出：{'Beijing': ['Alice', 'Carol'], 'Shanghai': ['Bob', 'Eve'], 'Shenzhen': ['Dave']}
```

`by_city.setdefault(city, []).append(name)` 这一行的执行逻辑：先检查 `city` 是否在字典里——在则返回现成的列表，不在则放入一个 `[]` 再返回它；无论是哪种情况，拿到的都是一个列表，直接 `append(name)`。新城市自动建空列表、老城市沿用已有的列表，代码无需区分这两种情况。

对比用 `get` 或 `if` 的写法，`setdefault` 版本最短、也最直白地表达了"每个城市对应一个名字列表"的分组意图。

如果没有 `setdefault`，等价写法是什么样？通常是下面这两种之一，都不如 `setdefault` 简洁：

```python
# 写法一：if 判断（LBYL）
by_city = {}
for name, city in employees:
    if city not in by_city:
        by_city[city] = []
    by_city[city].append(name)

# 写法二：try/except（EAFP）
by_city = {}
for name, city in employees:
    try:
        by_city[city].append(name)
    except KeyError:
        by_city[city] = [name]
```

三种写法等价，但 `setdefault` 版本行数最少、意图最聚焦。

### 2.3 经典范式二：计数（count）

`setdefault` 也可以做计数，配合 `+=` 操作。虽然没有 `Counter` 优雅，但在不能用或不想引入 `Counter` 的简单场景里很实用。

```python
words = "the quick brown fox the lazy dog the cat".split()

counts = {}
for w in words:
    counts[w] = counts.setdefault(w, 0) + 1

print(counts)
# 输出：{'the': 3, 'quick': 1, 'brown': 1, 'fox': 1, 'lazy': 1, 'dog': 1, 'cat': 1}
```

这块 `counts.setdefault(w, 0) + 1` 的含义：取出 `w` 的当前计数（不存在则取 0），加 1，再赋回去。它和分组模式的区别在于这里值的类型是整数（不可变），所以需要"取值 → 运算 → 赋值"三步；而分组模式里值是列表（可变），直接拿到引用就能 `append`，无需重新赋值。这个区别决定了两种模式写法略不同：

- **可变值（list/dict/set）**：`d.setdefault(k, 默认空容器).mutate(...)`，一行完成。
- **不可变值（int/float/str）**：`d[k] = d.setdefault(k, 初始值) + 增量`，因为要重新赋值。

不可变值场景如果频繁出现，更推荐第 04 篇的 `defaultdict` 或 `Counter`，能写得更顺。

### 2.4 可变默认值的性能陷阱

`setdefault` 有一个和函数默认参数相似的坑，但方向正好相反，需要特别区分。先看 `setdefault` 自身：

```python
d = {}
# 每次调用 setdefault("k", []) 的 [] 都是"调用时"新建的，不会在多次调用间共享
# 所以 setdefault 不存在 fromkeys 那种"所有键共享同一可变默认值"的问题
d.setdefault("a", []).append(1)
d.setdefault("b", []).append(2)
print(d["a"] is d["b"])   # 输出：False   ← 两个不同的列表，没共享
```

这点上 `setdefault` 是安全的——`default` 表达式（如 `[]`）在每次方法调用时都会求值一次，所以不存在"一个空列表被多个键共享"。**真正要小心的性能问题在另一个方向**：当键已经存在时，`default` 参数虽然不会被写入，但它仍然会被求值（计算出来）。

```python
d = {"a": [1, 2]}

# 键 "a" 已存在，setdefault 返回 [1,2]，不会把新列表写入
# 但传给 default 的 [] 仍然被创建了一个空列表对象，只是立刻被丢弃
result = d.setdefault("a", [])
print(result)             # 输出：[1, 2]
print(d["a"] is result)   # 输出：True
# 被丢弃的那个 [] 只是浪费了一次内存分配
```

在绝大多数场景，这个"被丢弃的 default"开销可忽略。但有一个反模式：把一个**昂贵的默认值表达式**放在 `setdefault` 的第二参数里，调用次数极多时，即使键几乎都存在，每次都要白算一遍这个昂贵表达式。

```python
# 反模式：default 参数里放昂贵的构造
d = {}
for k in huge_keys:
    # 假设 build_expensive_default() 很慢，而 k 大多已存在
    d.setdefault(k, build_expensive_default())   # 即使 k 存在，build_... 也会被调用！
```

这种"默认值构造昂贵、且键大多已存在"的场景，`setdefault` 反而不合适——因为它的 `default` 是即时求值的，没法"只在需要时才构造"。此时应改回 `if k not in d` 的写法，把昂贵构造放进 `if` 分支里，做到"按需构造"：

```python
# 正确：昂贵默认值用 if 延迟到真正需要时
for k in huge_keys:
    if k not in d:
        d[k] = build_expensive_default()   # 只在键不存在时才构造
```

记住这条判据：**`setdefault` 适合"默认值构造廉价"的场景**（空列表、空字典、空字符串、0、None）；一旦默认值构造昂贵、且键大多已存在，就该退回 `if not in` 的延迟构造写法。

### 2.5 setdefault vs get：何时用谁

`setdefault` 和 `get` 都能处理"键不存在"，都带 `default` 参数，但有一个根本区别：**`get` 只读不写，`setdefault` 在键不存在时写入**。这个差异决定了它们完全不同的适用场景。

**用 `get` 的场景：只想"取值或拿默认值"，不希望因为这次查询而改变字典**

```python
config = {"host": "localhost"}
# 读配置：调试模式没配就当 False，但绝不能因为"我查了一下"就把 debug=False 写进配置
debug = config.get("debug", False)    # ✅ 合适：查询是只读的副作用
```

如果上面误用 `setdefault`，会悄悄把 `debug=False` 写进 config，污染了配置对象：

```python
config = {"host": "localhost"}
config.setdefault("debug", False)     # ❌ 副作用：把 "debug":False 写进了 config
print(config)   # 输出：{'host': 'localhost', 'debug': False}   ← 被改了
```

**用 `setdefault` 的场景：希望"键不存在就初始化、之后能直接复用"**

```python
# 分组：每个键要初始化一个可变容器，并持续往里追加 → 必须写入
groups = {}
for k, v in pairs:
    groups.setdefault(k, []).append(v)   # ✅ 合适：要初始化并累积
```

判据很简单：**问自己"调用之后字典该不该因为这个键而变化"**。该变 → `setdefault`；不该变 → `get`。这条判据比记"哪个 API 干嘛"更可靠，因为它从意图出发。

### 2.6 setdefault vs defaultdict：概览

提到 `setdefault`，就不得不提第 04 篇的 `defaultdict`——两者解决同一类问题（键不存在时自动补默认值），但在写法风格和适用面上有别。这里先给一个对照概览，深入留给第 04 篇。

```python
from collections import defaultdict

pairs = [("fruit", "apple"), ("fruit", "banana"), ("veggie", "carrot")]

# setdefault 写法：每次取值都要写默认值
d1 = {}
for category, name in pairs:
    d1.setdefault(category, []).append(name)

# defaultdict 写法：创建时声明默认工厂，取值时无需写默认
d2 = defaultdict(list)
for category, name in pairs:
    d2[category].append(name)    # ← 注意：连 setdefault 都不用，直接 d2[category]
```

差别一眼可见：`defaultdict` 在创建时声明"缺失时自动建 list"，之后所有取值都像普通字典一样直接 `d[k]`，无需每次写 `setdefault(k, [])`。这对"同一份字典大量取值"的循环尤其清爽。

但 `defaultdict` 也有代价：它会在**任何**键缺失时自动建默认值，包括"我只是想探查一下某键在不在、并不想创建它"的场合——而这正是 `get`/`in` 的领地。也就是说：

- 全程都希望"缺失即初始化"→ `defaultdict` 最省事。
- 只在少数几处希望"缺失即初始化"→ `setdefault` 局部用，更精准、不污染其它查询。
- 只想探查、绝不希望自动创建 → `get` 或 `in`。

`setdefault` 是"按需、局部"的默认值手段；`defaultdict` 是"全局约定"的默认值手段。两者互补，不冲突，按"自动创建默认值的范围"来选。

### 2.7 嵌套字典的初始化

`setdefault` 还常用于初始化嵌套字典的某一层，避免逐层 `if` 判断。比如构建一棵"二级分类 → 三级列表"的结构：

```python
tree = {}
records = [("province", "city", "Beijing"), ("province", "city", "Shanghai"),
           ("province", "town", "village")]

for path1, path2, leaf in records:
    # 先确保 path1 这层存在（值是个 dict），再在它里面确保 path2 存在（值是个 list）
    tree.setdefault(path1, {}).setdefault(path2, []).append(leaf)

print(tree)
# 输出：{'province': {'city': ['Beijing', 'Shanghai'], 'town': ['village']}}
```

`tree.setdefault(path1, {}).setdefault(path2, []).append(leaf)` 这一行连用了两次 `setdefault`：外层确保第一级键存在且值为字典，内层在那个字典上确保第二级键存在且值为列表，最后追加叶子节点。相比"两层 if 判断再赋值"，这种链式 `setdefault` 把所有"确保存在"的逻辑压成一行，可读性反而更高——只要读习惯了 `setdefault` 的语义。

注意链式 `setdefault` 不要滥用到过深的层级，超过两层时链式调用的可读性会急剧下降，那种深度更推荐 `defaultdict` 的嵌套工厂或显式的辅助函数。

### 2.8 何时不要用 setdefault

`setdefault` 并非万能，以下场景应换用别的工具，强行使用反而表错意或埋下隐患。

**只想覆盖、不在乎原值时**：用 `d[key] = value`，无条件赋值比 `setdefault` 更直接。`setdefault` 在键存在时绝不覆盖，若你的意图是"更新就该盖掉旧的"，用它等于南辕北辙。

```python
config = {"port": 8080}

# ✅ 直接赋值：更新就该覆盖
config["port"] = 9090
print(config["port"])   # 输出：9090

# ❌ 用 setdefault 表错了意：它绝不覆盖
config.setdefault("port", 9999)   # port 已存在，这行啥也没改
print(config["port"])   # 输出：9090   ← 仍是 9090，有人会以为被设成了 9999
```

**默认值构造昂贵且键多已存在时**：如 2.4 节所述，`default` 即时求值会让昂贵构造在键已存在时也白跑，改用 `if not in` 延迟构造。

**只是查询、不应有副作用时**：用 `get` 或 `in`，`setdefault` 的写入副作用是多余的，会污染原本"只读"的语义。

**计数场景**：能用但啰嗦，优先 `Counter` 或 `defaultdict(int)`，见 3.4 节。

**全程都要自动默认时**：用 `defaultdict` 更省事，不必每个取值点都写 `setdefault`。

把 `setdefault` 用在该用的地方——"局部、按需、默认值廉价"的初始化——它才能发挥最大的简洁优势，用错了场景反而比 `if`/`get` 更绕。

## 3. 最佳实践

### 3.1 推荐写法 vs 不推荐写法

**分组归类用 setdefault 一行完成**

```python
pairs = [("a", 1), ("a", 2), ("b", 3)]

# ✅ 推荐：setdefault 一行
groups = {}
for k, v in pairs:
    groups.setdefault(k, []).append(v)

# ❌ 不推荐：get + 手动判断赋值
groups_bad = {}
for k, v in pairs:
    bucket = groups_bad.get(k)
    if bucket is None:
        bucket = []
        groups_bad[k] = bucket
    bucket.append(v)
```

**只读查询不要误用 setdefault**

```python
config = {"host": "localhost"}

# ✅ 推荐：只读查询用 get，不污染字典
debug = config.get("debug", False)

# ❌ 不推荐：setdefault 把默认值写进了字典
config.setdefault("debug", False)   # config 被悄悄加了 "debug":False
```

**昂贵默认值用 if 延迟构造**

```python
# 反模式示意（build_... 假设很慢，且键多已存在）
# for k in keys:
#     d.setdefault(k, build_expensive())   # 即使 k 存在也白调用 build_

# ✅ 推荐：仅当键不存在才构造
for k in keys:
    if k not in d:
        d[k] = build_expensive()
```

### 3.2 可变默认值不会共享，但语义要写对

如 2.4 节强调，`setdefault("k", [])` 的 `[]` 每次调用都新建，不会在多个键之间共享。这点是安全的，不要被 `fromkeys`/默认参数的坑误导而不敢用。但语义上要确保"默认值确实是每个键独立想要的初始状态"：

```python
# ✅ 每个键独立空列表，安全
d = {}
d.setdefault("a", []).append(1)
d.setdefault("b", []).append(2)
print(d)   # 输出：{'a': [1], 'b': [2]}

# 注意：若默认值是 dict，同样每次独立
d2 = {}
d2.setdefault("x", {})["k"] = 1
d2.setdefault("y", {})["k"] = 2
print(d2)   # 输出：{'x': {'k': 1}, 'y': {'k': 2}}   ← 两个独立空 dict
```

### 3.3 链式 setdefault 最多两层

```python
# ✅ 两层以内可读性尚可
tree.setdefault(level1, {}).setdefault(level2, []).append(leaf)

# ❌ 三层以上难读，换 defaultdict 嵌套工厂
# tree.setdefault(a, {}).setdefault(b, {}).setdefault(c, []).append(x)
```

三层以上的嵌套初始化，更清晰的写法是用嵌套 `defaultdict` 或显式辅助函数：

```python
from collections import defaultdict
# 嵌套工厂：每层缺失自动建下一级
tree = defaultdict(lambda: defaultdict(list))
tree[a][b].append(leaf)   # 任意层缺失都自动补，无需 setdefault
```

### 3.4 计数场景优先 Counter / defaultdict

```python
words = ["a", "b", "a", "c", "a"]

# ✅ 推荐：Counter 最直白
from collections import Counter
print(Counter(words))   # 输出：Counter({'a': 3, 'b': 1, 'c': 1})

# ✅ 可接受：defaultdict 写计数
from collections import defaultdict
counts = defaultdict(int)
for w in words:
    counts[w] += 1

# ⚠️ 能用但啰嗦：setdefault 写计数
counts2 = {}
for w in words:
    counts2[w] = counts2.setdefault(w, 0) + 1
```

如果只是为了计数，`Counter` 语义最贴切、还自带 `most_common` 等便捷方法；`setdefault` 计数能跑但不是它的强项。`setdefault` 真正的强项是分组（值的可变容器初始化），那里它比 `defaultdict` 写法更直接对应"一次性临时分组"的场景。

### 3.5 性能实证：setdefault vs get+赋值 vs defaultdict

把三种子段写法放在一起跑微基准，直观对比分组场景下的性能差异。基准用 10 万条记录、1000 个分组键，比的是"完成分组归类"的总耗时。

```python
import timeit
from collections import defaultdict

pairs = [(str(i % 1000), i) for i in range(100000)]

# 写法一：setdefault
def by_setdefault():
    d = {}
    for k, v in pairs:
        d.setdefault(k, []).append(v)
    return d

# 写法二：get + 手动赋值（两次哈希查找）
def by_get():
    d = {}
    for k, v in pairs:
        bucket = d.get(k)
        if bucket is None:
            bucket = []
            d[k] = bucket
        bucket.append(v)
    return d

# 写法三：defaultdict
def by_defaultdict():
    d = defaultdict(list)
    for k, v in pairs:
        d[k].append(v)
    return d

n = 5
print(f"setdefault  : {timeit.timeit(by_setdefault, number=n):.3f}s")
print(f"get+赋值    : {timeit.timeit(by_get, number=n):.3f}s")
print(f"defaultdict : {timeit.timeit(by_defaultdict, number=n):.3f}s")
```

典型趋势：`defaultdict` 最快，`setdefault` 紧随其后（差距很小），`get + 赋值` 最慢——印证了 4.1 节"setdefault 比 get+赋值少一次哈希查找"。但三者的绝对差距在 10 万条规模下通常只有毫秒级，可见**性能几乎从不是选择 setdefault 的理由**，可读性和意图匹配才是。只有当分组发生在每秒百万次的热路径里，"改用 defaultdict"才值得作为优化项。

### 3.6 setdefault 在并发下的安全性边界

`setdefault` 是一次方法调用、内部一次哈希查找 + 必要时一次插入。在 CPython 单条方法调用层面，由于 GIL 的存在，这次"查找或插入"组合通常不会被打断，因此在"建立分组字典"这类用法里，比手写的"先 get 判断再赋值"在多线程下更不容易出现"两个线程都判断为不存在、然后都建空列表互相覆盖"的丢更新。

```python
# 手写 get+赋值在多线程下的丢更新示意
# d = {}
# def worker(items):
#     for k, v in items:
#         bucket = d.get(k)
#         if bucket is None:      # 线程 A 执行到此
#             bucket = []         # 线程 B 也判断为 None，建了另一个 []
#             d[k] = bucket       # 两边都赋值，后到的覆盖先到的，元素丢失
#         bucket.append(v)
```

但要说清楚边界：`setdefault` 的"调用层面原子"并不意味着整个分组建过程线程安全。`d.setdefault(k, []).append(v)` 这一行里，`setdefault` 返回列表后、到 `append` 之间仍然可能被其它线程插入，若另一个线程也在对同一个键 append，两个 append 本身通常不冲突（append 是独立的），但任何"读-改-写"复合逻辑（如先看长度再决定是否 append）仍非原子。**结论：setdefault 比 get+赋值略安全，但字典整体不是并发安全容器**，真正的并发安全要靠 `threading.Lock` 或并发原语，不能依赖 setdefault。这条边界经常被误解，值得铭记。

### 3.7 用可调用对象做"工厂式"默认值

虽然 `setdefault` 的 `default` 不是工厂（它即时求值），但你可以传一个**每次都产出新对象的可调用结果**来模拟"按需造"的语义。最常见的还是 `[]`、`{}`、`set()` 这类字面量。一个稍进阶的用法是默认值本身需要带初始内容：

```python
# 默认值带初始项：每个新键起步就是 ["pending"]
tasks = {}
for job_id in ["j1", "j2", "j1"]:
    tasks.setdefault(job_id, ["pending"]).append(job_id + "-step")
print(tasks)
# 输出：{'j1': ['pending', 'j1-step'], 'j2': ['pending', 'j2-step']}
# 注意 "j1" 第二次出现时，setdefault 返回已有列表（含 pending 和上一次的 step），不再用 ["pending"]
```

这里有个细节要当心：默认值 `["pending"]` 只在键**首次**缺失时被写入，之后该键的取值一律返回已累积的列表，不会再和 `["pending"]` 沾边。所以"初始项 + 后续追加"这种模式工作得很好。但若你的意图是"每次取值都重置成 pending"，那就完全错用了——那不是 setdefault，应改用直接赋值 `d[k] = ["pending"]`。理解"默认值仅在首次缺失时介入"这一时序，是用对 `setdefault` 的关键。

### 3.8 setdefault 与 dict 合并的边界

还有一个容易和"合并"混淆的用法要厘清。`setdefault` 只对"单个键缺失时补默认"，它不像 `update` / `|` 那样做"多个键的批量合并覆盖"。如果你想把一批键值对"在缺失时补进去、存在则保留原值"——也就是"批量 setdefault"——并没有现成的一个方法，需要手动循环：

```python
defaults = {"host": "localhost", "port": 8080, "timeout": 30}
current = {"port": 9090, "debug": True}

# 意图：用 defaults 填充 current 中缺失的键，已存在的键保留
for k, v in defaults.items():
    current.setdefault(k, v)        # 已存在的（如 port）不动，缺失的填入
print(current)
# 输出：{'port': 9090, 'debug': True, 'host': 'localhost', 'timeout': 30}
# port 仍是 9090（保留），host/timeout 被填入
```

这和"合并"的标准写法 `{**defaults, **current}`（后者覆盖前者）方向相反：合并是"新值优先"，批量 setdefault 是"原值优先、缺了才补"。两者都用得上，看你想要哪种优先级。如果发现自己写了上面的循环且键很多，停下来想想意图——是不是其实想要 `|=` 合并，只是优先级写反了。把"批量 setdefault（原值优先）"和"合并（新值优先）"区分清楚，能避免一类隐性配置 bug。

## 4. 原理

### 4.1 setdefault 为什么是原子的分组利器

`setdefault` 之所以能把"判断 + 赋值 + 取值"三步缩成一行，关键在于它是一次**方法调用内的原子操作**。在 CPython 实现里，`setdefault` 在 C 层面一次性完成"查键 → 不存在则插入 → 返回值"，整个过程中字典不会处于"键已被部分处理但还没建好"的中间状态。

```python
# setdefault 内部等价逻辑（伪代码，实际是 C 实现）
def setdefault(self, key, default=None):
    # 一次哈希查找
    entry = self._find(key)
    if entry is not None:
        return entry.value           # 命中：直接返回，不碰 default
    self._insert(key, default)       # 未命中：插入，然后返回
    return default
```

关键点是"一次哈希查找"。对比用 `get` + 赋值的写法：

```python
# get 版本：两次哈希查找（一次 get、一次 d[k]=）
bucket = d.get(k)
if bucket is None:
    d[k] = []          # ← 这里又查一次哈希定位 k
    bucket = []
```

`get` 命中时一次查找、未命中时还得再查找一次用来写入；而 `setdefault` 无论命中与否都是一次查找。对分组这种"大量键、每个键处理多次"的循环，`setdefault` 比手写 `get + 赋值` 少一次哈希查找，性能略优。不过这个差距很小，`setdefault` 的主要价值仍在"代码简洁、意图聚焦"，性能是附带的。

### 4.2 default 表达式的求值时机

`setdefault` 的 `default` 参数是**普通的 Python 参数**，在方法被调用时按常规参数求值规则求值——也就是"调用前就先算好 default 表达式，再把结果传进方法"。这与函数默认参数（在定义时求值一次）不同，也与惰性求值不同。

```python
def show():
    print("构造默认值")
    return []

d = {"a": [1]}
# 即使 "a" 已存在，show() 仍被调用一次——default 表达式先求值
d.setdefault("a", show())
# 输出：构造默认值   ← 但返回的 [1] 不会被 [] 覆盖
print(d["a"])   # 输出：[1]
```

这验证了 2.4 节那个性能反模式的底层原因：`default` 是即时求值的普通参数，无法做到"只在需要时才构造"。这是 `setdefault` 相对 `if not in` 的一个固有限制——`if not in` 把构造放进了条件分支，真正做到按需。

`defaultdict` 则走的是另一条路：它的默认值由一个"工厂函数"产生，工厂只在真正取值且键缺失时才被调用，是惰性的。这就是为什么"默认值构造昂贵"时 `defaultdict`/`if not in` 比 `setdefault` 更合适——它们具备惰性，`setdefault` 不具备。

### 4.3 setdefault 的返回值为何重要

很多方法设计成"返回 None 表示这个方法就是来改对象的"（比如 `list.append`、`list.sort`）。但 `setdefault` 故意返回值——它返回的是"键对应的值（无论是否新建）"。这个设计并非随意，而是为了让它能链式或紧接着做后续操作：

```python
# 因为 setdefault 返回列表，才能紧接着 append
d.setdefault(k, []).append(v)

# 类比：如果 setdefault 返回 None，就只能拆成两步
# lst = d.setdefault(k, [])   # 假设它返回列表
# lst.append(v)
# 或者更糟，返回 None 时根本拿不到引用
```

返回值是 `setdefault` 能"一行完成分组"的关键。这也提醒一个使用要点：**不要忽略它的返回值**。如果你写了 `d.setdefault(k, [])` 却不用返回值、之后又用 `d[k]` 去取，那等于多做了一次哈希查找，抹平了 `setdefault` 相对 `get` 的性能优势：

```python
# ⚠️ 没利用返回值，多一次查找
d.setdefault(k, [])
d[k].append(v)         # 这里又查一次

# ✅ 利用返回值，一次查找搞定
d.setdefault(k, []).append(v)
```

### 4.4 与 dict.**missing** 的关系

`defaultdict` 的自动默认机制依赖一个钩子方法 `__missing__`：当 `d[key]` 找不到键时，如果字典类型定义了 `__missing__`，就会调用它来"补救"（在 `defaultdict` 里就是调用工厂函数建默认值并存入）。普通 `dict` 没有 `__missing__`，所以 `d[key]` 缺键直接抛 `KeyError`。

`setdefault` 与 `__missing__` 是两条独立的路径：

- `__missing__` 路径：由 `d[key]`（`__getitem__`）在未命中时触发，`defaultdict` 用它实现自动默认。
- `setdefault` 路径：是一个普通方法，自己内部处理"未命中则插入"，不经过 `__missing__`。

```python
class MyDict(dict):
    def __missing__(self, key):
        print(f"missing: {key}")
        return "DEFAULT"

d = MyDict()
print(d["x"])   # 输出：missing: x / DEFAULT   ← __missing__ 被触发
# 但 setdefault 不触发 __missing__，它自己处理
d.setdefault("y", "DEF")   # 不打印 missing
```

理解这条区别有助于厘清一个困惑点："'键不存在时自动补默认'这件事，普通 `dict` 靠 `setdefault` 手动实现，`defaultdict` 靠 `__missing__` 自动实现，两者机制不同但目的相同"。`setdefault` 是"按调用点手动触发"，`__missing__` 是"按访问自动触发"。

### 4.5 一次哈希查找的实现细节

把 `setdefault` 在 CPython 里的实现思路再具体化一层，能帮助理解它何以"一次查找搞定"。普通字典内部，每个条目记录着 `hash、key、value` 三元组；哈希表查找定位到候选槽位后，会比较 `hash` 与 `key`：

```python
# setdefault 的 C 实现等价逻辑（简化）
def setdefault(self, key, default=None):
    h = hash(key)
    idx = self._lookup(key, h)        # 一次哈希查找，返回槽位索引
    if idx >= 0:                       # 命中：槽位已存在
        return self.entries[idx].value
    # 未命中：idx 是一个负数编码的空槽位
    self._insert_at(~idx, h, key, default)   # 在同一槽位插入，无需再次查找
    return default
```

关键在于 `_lookup` 不只返回"找没找到"，还一同返回了"未命中时应插入的空槽位位置"。于是插入能直接落在这个位置，不再做第二次哈希映射。这和 `d[k] = v`（无条件赋值，先查后写）的方向一致，但与 `get + d[k] = []` 的"先查一次只读、再查一次写入"不同——后者浪费了一次查找。这也是 3.5 节基准里 `setdefault` 略快于 `get+赋值` 的根因。

不过要再次强调，这个"少一次查找"是常数级优化，在大 O 上两者都是 O(1)。它只有在"分组循环处理百万条数据"这种规模下才可能被测量出来。所以理解原理的价值更多在于"知道为什么 setdefault 写法更简洁的同时没有性能代价"，而不是"为了这点性能去用 setdefault"。

### 4.6 为什么 setdefault 不覆盖已有值

回到一个看似简单的设计问题：为什么 `setdefault` 在键存在时选择"保留原值、忽略 default"，而不是"用 default 覆盖"？答案是它的语义定位——"set **default**"，即"设定**默认**值"。默认值的语义本就是"在还没有值时垫一个"，一旦已有值，就不再是"默认"的范畴，自然不该被覆盖。这与"设置值"（`d[k] = v`，无条件设）是两种不同意图。

```python
# 两种意图，两个 API
d = {"port": 8080}

# 意图 A："port 没设过的话，给个默认 80"  → setdefault
d.setdefault("port", 80)      # 已有 8080，保留，不动
print(d["port"])              # 输出：8080

# 意图 B："port 无论如何重置成 9090"  → 直接赋值
d["port"] = 9090
print(d["port"])              # 输出：9090
```

把"默认值"和"赋值"的语义区分开，是 `setdefault` 命名的本意。理解了这层命名意图，就不会把 `setdefault` 误当作"条件赋值"，也不会在需要"条件赋值"时错用到它。这个名字本身就是最好的使用文档。

## 5. 总结

### 5.1 setdefault 速查

```
语义：
- d.setdefault(k)            键存在返回原值；不存在写入 None 并返回 None
- d.setdefault(k, default)   键存在返回原值；不存在写入 default 并返回 default

判据：
- 取值后字典该不该变？该变 → setdefault；不变 → get
- 默认值构造廉价？是 → setdefault 合适；否(昂贵 & 键多已存在) → 用 if not in 延迟构造
- 全程都要自动默认？是 → defaultdict 更省事
- 只想覆盖不管原值？是 → d[k] = v 无条件赋值
- 只探查不改字典？是 → in / get

强项：
- 分组归类：d.setdefault(k, []).append(v)
- 局部、按需的默认值初始化
- 嵌套字典最多两层初始化

注意：
- default 是即时求值，不会惰性
- 键存在时 default 仍被求值（昂贵默认值的坑）
- 不要忽略返回值，否则丢掉性能优势
```

### 5.2 核心要点回顾

- `setdefault(key, default=None)`：键存在返回原值不改字典；键不存在写入 default 并返回它。
- 它填补"安全 + 写入"那一格，是 `get`（不写入）做不到的"取值并初始化"。
- 经典范式一：分组 `d.setdefault(k, []).append(v)`；经典范式二：计数 `d[k] = d.setdefault(k, 0) + 1`。
- `default` 即时求值、键存在也会求值 → 昂贵默认值应改用 `if not in` 延迟构造。
- 可变默认值每次调用独立新建，不会在键间共享（区别于 `fromkeys`/默认参数的坑）。
- 只读查询用 `get`（别让 setdefault 的写入副作用污染字典），覆盖赋值用 `d[k]=v`。
- 全程自动默认用 `defaultdict`，局部按需默认用 `setdefault`——按"自动创建默认值的范围"选。
- 链式 `setdefault` 最多两层；三层以上用嵌套 `defaultdict` 或辅助函数。

### 5.3 读完应能掌握

- 能说清 `setdefault` 与 `get`、`d[k]=v`、`defaultdict` 的语义边界，并为给定场景选出正确的那个。
- 能用一行 `setdefault` 写出分组归类和计数，并知道计数场景何时该让位给 `Counter`/`defaultdict`。
- 能识别并规避"昂贵默认值即求值"陷阱，改用 `if not in` 延迟构造。
- 能避免误用 `setdefault` 做只读查询、无条件覆盖、过深嵌套初始化。
- 能从"单次哈希查找 + 即时求值 + 不经 **missing**"的原理层面解释 `setdefault` 的性能与机制。

### 5.4 常见面试问题

**问题一：`setdefault` 和 `get` 的区别？**

```python
d = {"a": 1}
print(d.get("b", 0))         # 输出：0；d 不变 → {'a': 1}
print(d.setdefault("b", 0))  # 输出：0；d 变了 → {'a': 1, 'b': 0}
# get 只读不写；setdefault 在键不存在时写入默认值。
# 判据：调用后字典该不该变。
```

**问题二：用 setdefault 实现分组**

```python
pairs = [("x", 1), ("x", 2), ("y", 3)]
d = {}
for k, v in pairs:
    d.setdefault(k, []).append(v)
print(d)   # 输出：{'x': [1, 2], 'y': [3]}
# setdefault 在键不存在时放入空列表并返回它，已有键返回原列表，append 都能直接接上。
```

**问题三：`setdefault("k", [])` 会不会让多个键共享同一个列表？**

```python
d = {}
d.setdefault("a", []).append(1)
d.setdefault("b", []).append(2)
print(d["a"] is d["b"])   # 输出：False
# 不会。[] 是方法调用时才求值的普通参数，每次调用 new 一个新列表，
# 不像 fromkeys/默认参数在定义期只建一次。但键存在时 default 仍会被求值（开销较小，可忽略）。
```

**问题四：为什么说 setdefault 不适合"昂贵默认值"？**

```python
def build(): print("build"); return []
d = {"a": []}
# "a" 已存在，但 build() 仍被调用——default 即时求值
d.setdefault("a", build())   # 输出：build
# 改用 if 延迟到真正需要时：
# if "a" not in d: d["a"] = build()
# 只在键不存在时才构造，避免无谓开销。
```

### 5.5 实战串讲：日志按级别与模块归类

把本篇多种用法串在一个贴近真实的小场景里，巩固选择直觉。假设要把一批日志按"级别 → 模块"两级归类，每个叶子节点累积消息列表，同时统计每条日志到达时该级别的累计计数。

```python
logs = [
    ("ERROR", "db",   "connection lost"),
    ("INFO",  "db",   "pool ready"),
    ("ERROR", "db",   "retry failed"),
    ("WARN",  "cache", "evicting key"),
    ("INFO",  "cache", "hit ratio 0.9"),
]

# 两级嵌套：级别 → 模块 → 消息列表
by_level = {}
# 顺便统计每个级别的计数（不可变值计数）
counts = {}

for level, module, msg in logs:
    # 分组：链式 setdefault 两层建嵌套结构，append 消息
    by_level.setdefault(level, {}).setdefault(module, []).append(msg)
    # 计数：不可变值，取值+1 后赋回
    counts[level] = counts.setdefault(level, 0) + 1

print(by_level)
# 输出：
# {'ERROR': {'db': ['connection lost', 'retry failed']},
#  'INFO':  {'db': ['pool ready'], 'cache': ['hit ratio 0.9']},
#  'WARN':  {'cache': ['evicting key']}}

print(counts)
# 输出：{'ERROR': 2, 'INFO': 2, 'WARN': 1}
```

这段代码同时演示了本篇三个要点：① 分组（可变值，`setdefault(..., []).append`）；② 链式嵌套初始化（两层，刚好在 3.3 节"最多两层"的舒适区内）；③ 计数（不可变值，`setdefault` 取值再赋回）。每一处 `setdefault` 都落在了它"廉价默认值 + 需要写入"的适用区里，没有误用到昂贵默认值、无条件覆盖或只读查询上。

可以再思考两个变体来检验掌握程度：一是如果上面分组的默认值换成"带初始标签的列表"（如 `["---log start---"]`），效果如何？答案是首条日志进新键时列表含初始标签、后续追加，正好符合"默认值仅在首次缺失时介入"的时序。二是如果同一份数据要在几十处取值且都想"缺失即空列表"，那 `setdefault` 就显得重复——这正是把 `by_level` 换成 `defaultdict(lambda: defaultdict(list))` 的时机，也是下一篇的主题。

### 5.6 延伸

`setdefault` 是"局部、按需"的默认值手段。当同一个字典在多处都需要"缺失即初始化"，反复写 `setdefault` 就显得啰嗦——这时第 04 篇的 `defaultdict` 登场，它把"默认值策略"提到字典创建时一次性声明，之后所有取值点都自动享受，写法大幅简化。再往后，《OrderedDict》《Counter》《字典底层原理哈希表》会展开字典家族的其它成员与底层机制。理解了 `setdefault` 的"即时求值 + 不经 `__missing__`"，也就为理解 `defaultdict` 的"工厂惰性 + 经 `__missing__`"铺好了对照基础。
