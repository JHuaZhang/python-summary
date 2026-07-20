---
group:
  title: 【07】字典深度剖析
  order: 7
order: 1
title: 字典创建方式
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是字典

字典（dict）是 Python 中用于存储"键值对"（key-value pair）的内置容器。它通过键（key）来索引对应的值（value），而不是像列表那样通过位置下标索引。给定一个键，字典能在平均 O(1) 的时间内找到对应的值——这是它最核心的能力，底层由哈希表实现。字典在 Python 里的地位极高：对象的属性表 `__dict__`、函数的关键字参数 `kwargs`、模块的全局命名空间，本质上都是字典。

```python
# 最基础的字典：键 → 值
user = {"name": "Alice", "age": 30, "city": "Beijing"}

# 用键取值，而不是用下标
print(user["name"])   # 输出：Alice
print(user["age"])    # 输出：30
```

本篇聚焦于字典的"创建"环节。听起来"创建字典"似乎只是写一对花括号的事，但 Python 提供了多达十余种创建字典的途径，每一种在不同的场景下有各自的可读性、性能、适用边界。掌握全部创建方式的意义不在于炫技，而在于：拿到一个具体需求（从两个列表配对、从 JSON、从带默认值的循环、从已有映射……），你能立刻选出最贴切、最不易出错的那一种，而不是只会 `{}` 一种写法、遇到别的场景就手忙脚乱地拼接。

### 1.2 键的约束：可哈希性

在进入各种创建方式之前，必须先讲清楚一个贯穿全部内容的前置约束——字典的键必须是**可哈希**（hashable）的对象。这是哈希表能工作的前提：键的哈希值必须在其生命周期内稳定，且键之间能判断相等。

```python
# 可哈希类型可作键：str / int / float / frozenset / 元组(元素均可哈希) / None / bool
d = {"name": "a", 1: "b", (0, 0): "origin", None: "nil", True: "yes"}
print(d[(0, 0)])   # 输出：origin

# 不可哈希类型不可作键：list / dict / set
# bad = {[1, 2]: "x"}      # TypeError: unhashable type: 'list'
# bad = {{1: 2}: "x"}      # TypeError: unhashable type: 'dict'
# bad = {frozenset({1}): "ok"} 是合法的，因为 frozenset 可哈希
```

理解这一点能解释后文很多看似奇怪的现象：为什么用 `list` 当键会报错、为什么含列表的元组也不能当键、为什么自定义对象默认可作键（默认 `__hash__` 基于对象身份）。所有创建方式都绕不开这条规则，所以把它放在最前面。

### 1.3 最小用法：字面量与构造函数

最常见的两种创建方式先给出最小示例，作为对照基线。

```python
# 方式一：字面量（花括号）
scores = {"Alice": 90, "Bob": 85, "Carol": 92}
print(scores)   # 输出：{'Alice': 90, 'Bob': 85, 'Carol': 92}

# 方式二：dict() 构造函数 + 关键字参数
scores2 = dict(Alice=90, Bob=85, Carol=92)
print(scores2)  # 输出：{'Alice': 90, 'Bob': 85, 'Carol': 92}

# 两者结果等价
print(scores == scores2)   # 输出：True
```

这两种写法覆盖了日常 80% 的场景，但它们各有局限：关键字参数的键必须是合法的 Python 标识符（不能是数字、带空格的字符串、保留字）；字面量在键值很多时也显得冗长。下面第 2 章会逐一展开所有创建方式及其适用边界。

## 2. 核心内容

### 2.1 字面量创建：花括号语法

最直接也最常用的创建方式。一对花括号内，用 `键: 值` 配对，多对之间用逗号分隔。键可以是任何可哈希对象（不一定非得是字符串），值可以是任意对象。

```python
# 字符串键
config = {"host": "localhost", "port": 8080, "debug": True}

# 非字符串键：整数、元组、浮点（虽然不推荐浮点当键，见最佳实践）
matrix = {(0, 0): 1, (0, 1): 2, (1, 0): 3, (1, 1): 4}
print(matrix[(1, 0)])   # 输出：3

# 空字典就是一对空花括号
empty = {}
print(type(empty))      # 输出：<class 'dict'>
```

一个常见混淆点：`{}` 是空字典，不是空集合——空集合必须用 `set()`。这是 Python 历史遗留的语法占用：花括号优先表示字典，集合字面量要用 `{1, 2, 3}` 这种"有元素"的形式。

```python
print(type({}))         # 输出：<class 'dict'>   ← 空花括号是字典
print(type(set()))      # 输出：<class 'set'>    ← 空集合要这样
print(type({1, 2}))     # 输出：<class 'set'>    ← 非空花括号里有元素无冒号是集合
```

### 2.2 dict() 构造函数：关键字参数

`dict()` 可以接收关键字参数，每个关键字名成为键、对应值成为值。它的好处是写起来像在调用函数，键在等号左边无需引号，相对简洁。

```python
user = dict(name="Alice", age=30, role="admin")
print(user)   # 输出：{'name': 'Alice', 'age': 30, 'role': 'admin'}
```

但关键字参数方式有两个硬性限制：

```python
# 限制一：键必须是合法标识符，不能是数字或带特殊字符的字符串
# bad = dict(1="a")              # SyntaxError：数字不能作关键字名
# bad = dict("full name"="a")    # SyntaxError：键不能含空格

# 限制二：键不能是 Python 保留字
# bad = dict(class="A", for="x") # SyntaxError：保留字不能作关键字名

# 凡是键不是合法标识符时，就只能退回字面量或 dict([(...)]) 方式
d = {"class": "A", "for": "x", "1": "num"}   # 字面量无此限制
print(d)   # 输出：{'class': 'A', 'for': 'x', '1': 'num'}
```

正因为这两个限制，`dict(**kwargs)` 方式最适合"键都是普通英文标识符"的配置类场景；一旦键来自外部数据（可能含数字、空格、保留字），就不能用它。

### 2.3 dict() 接收键值对序列

`dict()` 的第二种接收方式：传入一个"可迭代的二元序列"，每个二元序列的第一个元素为键、第二个为值。这是处理"动态数据"时最灵活的创建方式之一。

```python
# 传入列表的列表
pairs = [["Alice", 90], ["Bob", 85], ["Carol", 92]]
d1 = dict(pairs)
print(d1)   # 输出：{'Alice': 90, 'Bob': 85, 'Carol': 92}

# 传入元组的列表
d2 = dict([("Alice", 90), ("Bob", 85)])
print(d2)   # 输出：{'Alice': 90, 'Bob': 85}

# 传入元组的元组
d3 = dict((("a", 1), ("b", 2)))
print(d3)   # 输出：{'a': 1, 'b': 2}

# 甚至传入"每次产生二元序列"的生成器
d4 = dict((name, len(name)) for name in ["Alice", "Bob"])
print(d4)   # 输出：{'Alice': 5, 'Bob': 3}
```

这种方式的真正价值在于：当键值对已经以"配对序列"形式存在（比如从 CSV、数据库查询、zip 配对而来），你能一行直接转成字典，而无需循环拼接。它与字面量的分工很清晰——字面量用于"静态、写死的内容"，`dict(序列)` 用于"动态、来自别处的配对数据"。

注意每个子序列必须恰好有两个元素，多了少了都会报错：

```python
# dict([("a", 1, 2)])   # ValueError: dictionary update sequence element #0 has length 3; 2 is required
# dict([("a",)])        # ValueError: ... has length 1; 2 is required
```

### 2.4 zip 配对创建

当键和值分别存在于两个等长序列里时，`zip()` 配合 `dict()` 是最地道的写法。`zip` 把多个序列"按位置拉链"成一个个元组，`dict` 直接把这些二元元组转成键值对。

```python
names = ["Alice", "Bob", "Carol"]
ages = [30, 25, 28]

# zip 拉链成 ("Alice",30), ("Bob",25), ("Carol",28)，再 dict 转换
user_age = dict(zip(names, ages))
print(user_age)   # 输出：{'Alice': 30, 'Bob': 25, 'Carol': 28}
```

`zip` 以最短序列为准截断，这在两序列长度不一致时是个需要留意的特性——要么确保等长，要么显式处理：

```python
# 长度不一致：zip 默认截断到最短
a = ["x", "y", "z"]
b = [1, 2]
print(dict(zip(a, b)))   # 输出：{'x': 1, 'y': 2}  ← "z" 被丢弃

# 若想用缺失值填充到最长，用 itertools.zip_longest
from itertools import zip_longest
print(dict(zip_longest(a, b, fillvalue=0)))  # 输出：{'x': 1, 'y': 2, 'z': 0}
```

zip 方式在数据清洗、ETL 场景极为常用，例如把"表头列表"和"一行数据列表"配对成一条记录字典：

```python
headers = ["id", "name", "age", "city"]
row = [1001, "Alice", 30, "Beijing"]

record = dict(zip(headers, row))
print(record)
# 输出：{'id': 1001, 'name': 'Alice', 'age': 30, 'city': 'Beijing'}
```

### 2.5 字典推导式

推导式（comprehension）是从一个可迭代对象"筛选/变换"出字典的紧凑写法，语法是 `{键表达式: 值表达式 for 项 in 可迭代对象 if 条件}`。它兼具可读性与性能（底层是专门优化的字节码 `BUILD_MAP`），是处理转换类创建的首选。

```python
# 基础：把列表转成"元素→长度"的字典
words = ["apple", "banana", "cherry"]
word_len = {w: len(w) for w in words}
print(word_len)   # 输出：{'apple': 5, 'banana': 6, 'cherry': 6}

# 带 if 条件：只保留长度大于 5 的
long_words = {w: len(w) for w in words if len(w) > 5}
print(long_words)   # 输出：{'banana': 6, 'cherry': 6}

# 双变量迭代：配合 enumerate 或 zip
enum_dict = {i: w for i, w in enumerate(words)}
print(enum_dict)   # 输出：{0: 'apple', 1: 'banana', 2: 'cherry'}
```

推导式的一个高频用法是"翻转字典"——把原字典的值当键、键当值。注意前提是值唯一且可哈希，否则后出现的会覆盖先出现的：

```python
original = {"Alice": 90, "Bob": 85, "Carol": 92}
# 值→键的翻转
flipped = {v: k for k, v in original.items()}
print(flipped)   # 输出：{90: 'Alice', 85: 'Bob', 92: 'Carol'}

# 若有重复值，后者覆盖前者
dup = {"a": 1, "b": 1, "c": 2}
flipped_dup = {v: k for k, v in dup.items()}
print(flipped_dup)   # 输出：{1: 'b', 2: 'c'}   ← 1 对应的 "a" 被 "b" 覆盖
```

推导式还能做"过滤并重建"，这在清洗数据时很实用：

```python
# 从一个原始字典中只保留值为正数的项
raw = {"a": 10, "b": -3, "c": 0, "d": 7}
positive = {k: v for k, v in raw.items() if v > 0}
print(positive)   # 输出：{'a': 10, 'd': 7}
```

### 2.6 dict.fromkeys()：批量同值初始化

当需要"一批键 + 同一个默认值"时，`dict.fromkeys(键序列, 值)` 是最直接的写法。它对每个键设置同一个值，常用于初始化计数器、占位结构。

```python
# 所有学生成绩初始化为 0
students = ["Alice", "Bob", "Carol"]
scores = dict.fromkeys(students, 0)
print(scores)   # 输出：{'Alice': 0, 'Bob': 0, 'Carol': 0}

# 值默认为 None（不传第二参数）
empty_vals = dict.fromkeys(students)
print(empty_vals)   # 输出：{'Alice': None, 'Bob': None, 'Carol': None}
```

这里有一个经典陷阱：当默认值是**可变对象**（如空列表、空字典）时，所有键共享同一个对象，改一个全都变。这和"可变默认参数"陷阱同源，都是可变对象被多处引用导致。

```python
# 陷阱：可变默认值被所有键共享
scores_list = dict.fromkeys(students, [])
print(scores_list)   # 输出：{'Alice': [], 'Bob': [], 'Carol': []}

scores_list["Alice"].append(90)
print(scores_list)
# 输出：{'Alice': [90], 'Bob': [90], 'Carol': [90]}  ← 全成了 [90]！
# 因为三个键引用的是同一个 list 对象
print(scores_list["Alice"] is scores_list["Bob"])   # 输出：True

# 正确做法：用推导式为每个键单独创建 list
scores_list_ok = {s: [] for s in students}
scores_list_ok["Alice"].append(90)
print(scores_list_ok)   # 输出：{'Alice': [90], 'Bob': [], 'Carol': []}
```

记住这条经验法则：`fromkeys` 的第二参数只用不可变默认值（`0`、`""`、`None`、`False`）；一旦需要"每个键独立的可变容器"，立刻改用推导式。

### 2.7 字典合并（dict.update / \*\*解包 / | 运算符）

创建字典时常常需要"合并多个来源"。Python 提供了几种合并方式，行为都是"后者覆盖前者"——相同键以靠后出现的值为准。

**`update()` 方法：就地合并**

```python
base = {"host": "localhost", "port": 8080}
override = {"port": 9090, "debug": True}

base.update(override)        # 就地修改 base，返回 None
print(base)
# 输出：{'host': 'localhost', 'port': 9090, 'debug': True}  ← port 被覆盖
```

**`**` 解包：创建新字典\*\*

```python
base = {"host": "localhost", "port": 8080}
override = {"port": 9090, "debug": True}

merged = {**base, **override}    # 产生新字典，不改 base
print(merged)
# 输出：{'host': 'localhost', 'port': 9090, 'debug': True}
print(base)   # 输出：{'host': 'localhost', 'port': 8080}  ← base 未变
```

**`|` 运算符（Python 3.9+）：合并表达式**

```python
base = {"host": "localhost", "port": 8080}
override = {"port": 9090, "debug": True}

merged = base | override     # 产生新字典
print(merged)
# 输出：{'host': 'localhost', 'port': 9090, 'debug': True}

base |= override             # 就地合并，等价于 update
print(base)
# 输出：{'host': 'localhost', 'port': 9090, 'debug': True}
```

三者选用建议：需要"产生新对象而不动原字典"时，用 `{**a, **b}`（3.9 以下通吃）或 `a | b`（3.9+ 更直观）；需要"在原字典上累积"时，用 `update()` 或 `|=`。`|` 的优势是能链式表达 `a | b | c`，而 `**` 解包在表达式里也能链式 `{**a, **b, **c}`，两者均可。

### 2.8 copy() 浅拷贝创建

创建一个字典的"副本"也是一种创建场景。`copy()` 方法产生浅拷贝——新字典对象，但键值仍是原对象的引用。对不可变值无影响，对可变值则共享。

```python
original = {"name": "Alice", "scores": [90, 85]}
shallow = original.copy()

# 新字典是独立对象
print(shallow is original)        # 输出：False

# 但内层可变对象共享
print(shallow["scores"] is original["scores"])   # 输出：True
shallow["scores"].append(92)
print(original["scores"])         # 输出：[90, 85, 92]  ← 原字典也被改了
```

需要完全独立（连内层可变对象也复制）时，用 `copy.deepcopy`：

```python
import copy
original = {"name": "Alice", "scores": [90, 85]}
deep = copy.deepcopy(original)
deep["scores"].append(92)
print(original["scores"])         # 输出：[90, 85]  ← 原字典不受影响
```

浅拷贝也可用 `dict(original)` 或 `{**original}` 达到同样效果，三者等价：

```python
d = {"a": 1}
print(d.copy() == dict(d) == {**d})   # 输出：True
```

### 2.9 从 JSON 与外部数据创建

实际项目里，字典常来自外部：JSON、配置文件、HTTP 响应。标准库 `json.loads` 会把 JSON 对象直接解析成 dict，这是从字符串创建字典的标准途径。

```python
import json

# JSON 字符串 → 字典
json_str = '{"name": "Alice", "age": 30, "tags": ["admin", "dev"]}'
data = json.loads(json_str)
print(type(data))      # 输出：<class 'dict'>
print(data["tags"])    # 输出：['admin', 'dev']

# 字典 → JSON 字符串（反过来）
back = json.dumps(data, ensure_ascii=False)
print(back)            # 输出：{"name": "Alice", "age": 30, "tags": ["admin", "dev"]}
```

注意 JSON 键只能是字符串，所以从 JSON 来的字典键全是 `str`，即使原意是数字：

```python
# JSON 里写 {"1": "a"}，解析后键是字符串 "1" 而非整数 1
d = json.loads('{"1": "a", "2": "b"}')
print(list(d.keys()))         # 输出：['1', '2']   ← 是字符串
print(d[1])                   # KeyError: 1        ← 用整数 1 取不到
print(d["1"])                 # 输出：a            ← 必须用字符串 "1"

# 若需要整数键，转换时显式处理
d_int = {int(k): v for k, v in d.items()}
print(d_int[1])               # 输出：a
```

### 2.10 用 isinstance 和类型创建：避免误用

有一个易错点值得单独点出：`dict(some_dict)` 会复制一份新字典，但很多人误以为它能"过滤"或"转换"，实际它只是浅拷贝。如果意图是筛选，要用推导式而非 `dict()`。

```python
raw = {"a": 1, "b": 2, "c": 3}

# 误用：以为 dict(raw) 能筛选 —— 其实只是浅拷贝
copy_only = dict(raw)
print(copy_only)   # 输出：{'a': 1, 'b': 2, 'c': 3}  ← 没筛掉任何东西

# 正确筛选：用推导式
filtered = {k: v for k, v in raw.items() if v > 1}
print(filtered)    # 输出：{'b': 2, 'c': 3}
```

### 2.11 用类属性与对象 **dict** 创建映射

字典不仅是一种容器，还是 Python 对象模型的底座。每个普通对象的实例属性就存在一个名为 `__dict__` 的字典里。反过来，你也能用字典的创建方式去读写字典属性。理解这一层联系，有助于明白"为什么字典如此核心"。

```python
# 普通对象的实例属性本质是一个字典
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

p = Point(3, 4)
print(p.__dict__)        # 输出：{'x': 3, 'y': 4}   ← 属性即字典

# 可以像操作字典一样操作属性表
p.__dict__["z"] = 0      # 直接给对象"加属性"
print(p.z)               # 输出：0
print(p.__dict__)        # 输出：{'x': 3, 'y': 4, 'z': 0}

# 也能用一个已有字典去"批量"设置属性
p.__dict__.update({"x": 30, "color": "red"})
print(p.x, p.color)      # 输出：30 red
```

需要强调：直接改 `__dict__` 属于进阶用法，日常编码应通过正常赋值 `p.x = 30` 操作属性，而非绕道字典。这里展示它的意义在于——让你看到字典创建方式（`update`、字面量）与对象机制是同一套东西。

### 2.12 创建方式的横向对照

把本节主要创建方式汇总成一张速查表，便于按场景反查：

| 创建方式      | 语法示例               | 适用场景             | 局限/注意                  |
| ------------- | ---------------------- | -------------------- | -------------------------- |
| 字面量        | `{"a": 1}`             | 静态、写死的内容     | 键值多时冗长               |
| 关键字参数    | `dict(a=1)`            | 键是合法标识符的配置 | 键不能是数字/保留字/含空格 |
| 键值对序列    | `dict([("a",1)])`      | 动态配对数据         | 子序列必须恰好 2 元素      |
| zip 配对      | `dict(zip(k, v))`      | 两等长序列配对       | 以最短截断                 |
| 推导式        | `{k: v for ...}`       | 筛选/变换/翻转       | 值不唯一时翻转会覆盖       |
| fromkeys      | `dict.fromkeys(ks, v)` | 批量同默认值         | 可变默认值会被共享         |
| \*\*合并      | `{**a, **b}`           | 合并产生新字典       | 后者覆盖前者               |
| \| 合并(3.9+) | `a \| b`               | 链式合并表达式       | 需 Python 3.9+             |
| update        | `d.update(other)`      | 就地累积合并         | 改原对象，返回 None        |
| 浅拷贝        | `d.copy()` / `{**d}`   | 复制独立外壳         | 内层可变对象仍共享         |
| JSON          | `json.loads(s)`        | 从外部字符串         | 键均为字符串               |

## 3. 最佳实践

### 3.1 推荐写法 vs 不推荐写法

**动态数据用 zip / 推导式，而非循环拼接**

```python
names = ["Alice", "Bob", "Carol"]
ages = [30, 25, 28]

# ✅ 推荐：zip 一行完成
user_age = dict(zip(names, ages))

# ❌ 不推荐：手动循环拼接
user_age_bad = {}
for i in range(len(names)):
    user_age_bad[names[i]] = ages[i]
```

**批量默认值用 fromkeys（不可变默认）或推导式（可变默认）**

```python
keys = ["a", "b", "c"]

# ✅ 推荐：不可变默认值用 fromkeys，简洁
counts = dict.fromkeys(keys, 0)

# ✅ 推荐：可变默认值用推导式，每个键独立
buckets = {k: [] for k in keys}

# ❌ 不推荐：可变默认值用 fromkeys，导致共享
# buckets_bad = dict.fromkeys(keys, [])   # 所有键共享同一个 list
```

**合并配置用 ** 解包或 | 运算符，而非多层 update\*\*

```python
defaults = {"host": "localhost", "port": 8080, "timeout": 30}
user_cfg = {"port": 9090}
env_cfg = {"debug": True}

# ✅ 推荐：链式合并，一次性产生新字典
final = {**defaults, **user_cfg, **env_cfg}
# 或（3.9+）：final = defaults | user_cfg | env_cfg

# ❌ 不推荐：先复制再多重 update，啰嗦
final_bad = defaults.copy()
final_bad.update(user_cfg)
final_bad.update(env_cfg)
```

### 3.2 键的选择：优先用不可变、有意义的类型

键的选用直接影响字典的正确性与可读性。

```python
# ✅ 推荐：字符串键，语义清晰
user = {"name": "Alice", "age": 30}

# ✅ 推荐：元组键表示复合坐标，合法且有意义
grid = {(x, y): f"cell-{x}-{y}" for x in range(3) for y in range(3)}
print(grid[(1, 2)])   # 输出：cell-1-2

# ❌ 不推荐：浮点数当键。浮点相等比较不可靠，1.0 与 1 可能不等价
# d = {1.0: "a"}
# d[1]         # 行为依赖哈希实现，易出 bug

# ❌ 不推荐：用可变对象或含可变对象的元组当键
# bad = {([1], 2): "x"}    # TypeError: unhashable type: 'list'
```

一个常被忽视的点：`True` 和 `False` 在 Python 里等于 `1` 和 `0`，且哈希相同。把它们与整数混作键会互相覆盖：

```python
d = {1: "int-one", True: "bool-true"}
print(d)   # 输出：{1: 'bool-true'}   ← True 覆盖了 1，因为 1 == True
# 两者哈希相同且判定相等，所以是同一个键
```

如果业务上需要同时区分 `1` 和 `True`，字典这条路走不通，应改用其它结构或显式编码键（如 `("int", 1)` vs `("bool", True)`）。

### 3.3 空字典的创建与判断

```python
# ✅ 推荐：空字典用 {}
empty = {}

# 判断字典是否为空，直接用真值测试，不要用 len()==0
if not empty:
    print("空字典")   # 输出：空字典

# ❌ 不推荐
# if len(empty) == 0: ...
# if empty == {}: ...
```

Python 容器的真值测试是惯用法，既快又清晰——空容器为假、非空为真。养成这个习惯能避免大量啰嗦的 `len(d) == 0`。

### 3.4 创建时避免键重复

字典在创建时若出现重复键，后者覆盖前者，且不会报错。这在手写字面量时容易埋下静默 bug：

```python
# 重复键：后者覆盖前者，无警告
d = {"a": 1, "b": 2, "a": 3}
print(d)   # 输出：{'a': 3, 'b': 2}   ← 第一个 "a":1 被默默覆盖

# 这在很长的字面量里尤其危险，难以察觉
config = {
    "host": "localhost",
    "port": 8080,
    # ... 很多个键 ...
    "port": 9090,      # 不小心又写了一次 port
}
print(config["port"])   # 输出：9090，但 8080 那条无声丢失
```

防范：对长字面量，建议把键按字母排序、或借助 IDE/linter 静态检查重复键。Python 3.12+ 的解释器会对字面量里重复的键发出 `SyntaxWarning`，及时升级能尽早暴露这类问题。

### 3.5 推导式 vs 循环：何时该用哪种

推导式紧凑但"一行只做一件事"才清晰。一旦转换逻辑需要多步、需要异常处理、需要副作用（如打印、写文件），就应改用显式循环——可读性优先于紧凑。

```python
# ✅ 推荐：简单转换用推导式
lengths = {w: len(w) for w in ["apple", "banana"]}

# ✅ 推荐：复杂逻辑/异常处理用循环
result = {}
for w in ["apple", "banana", "", "cherry"]:
    try:
        result[w] = 1 / len(w)    # 空串会 ZeroDivisionError
    except ZeroDivisionError:
        result[w] = 0
print(result)   # 输出：{'apple': 0.2, 'banana': 0.166..., '': 0, 'cherry': 0.142...}

# ❌ 不推荐：把异常处理塞进推导式，难读
# result_bad = {w: (1/len(w) if len(w) else 0) for w in [...]}
```

## 4. 原理

### 4.1 字典底层：哈希表与稀疏数组

字典能实现平均 O(1) 的查找，靠的是底层的哈希表。CPython 的字典用一个"稀疏数组"（sparse array）存储条目，每个条目记录 `hash、key、value`。给定一个键，过程是：计算键的哈希值 → 用哈希值映射到数组某个下标 → 比较该位置的键是否相等 → 命中则取值，冲突则按探测策略找下一个位置。

```python
# 观察键的哈希值与字典内部存储位置的关系（不直接暴露下标，但可看哈希）
print(hash("Alice"))   # 某个整数，如 -581... （每次运行可能不同，受 PYTHONHASHSEED 影响）
print(hash(1))         # 输出：1   ← int 的哈希通常是其自身（除 -1）

# 两个"相等"的对象哈希相同 → 在字典里被视为同一个键
print(hash(1) == hash(1.0))      # 输出：True
d = {1: "int", 1.0: "float"}     # 1 和 1.0 被当作同一个键
print(d)                         # 输出：{1: 'float'}   ← 后者覆盖
```

这解释了为什么字典键必须可哈希：哈希表依赖"哈希值稳定"来定位条目。若键可变、哈希会变，存进去之后就再也定位不到了，所以 Python 直接禁止可变对象作键。

### 4.2 哈希冲突的处理：开放寻址

两个不同键的哈希值可能映射到同一个下标，这叫哈希冲突。CPython 字典用"开放寻址"（open addressing）解决冲突：发生冲突时，按一个扰动公式跳到下一个候选位置，直到找到空位或匹配的键。这也是为什么字典操作是"平均 O(1)"——在冲突很少时接近 O(1)，极端情况下（大量冲突）会退化，但 Python 的哈希函数和扰动策略让这种情况极罕见。

```python
# 模拟理解：相同哈希的键会"挤"在一起，但字典仍能区分它们
# 整数 n 的哈希是 n 本身，构造一组容易冲突的键来体会（实际冲突由取模决定）
# 这里只是说明：键的相等性最终由 __eq__ 决定，哈希只是定位的"起点"
class Bad:
    """所有实例哈希相同，但互不相等 —— 极端冲突场景"""
    def __hash__(self):
        return 1          # 所有实例哈希都为 1
    def __eq__(self, other):
        return self is other   # 仅同一对象才相等

d = {}
a, b, c = Bad(), Bad(), Bad()   # 三个不同对象，哈希全为 1
d[a] = "A"; d[b] = "B"; d[c] = "C"   # 全部存入，靠 __eq__ 区分
print(len(d), d[a], d[b], d[c])   # 输出：3 A B C   ← 没有互相覆盖
# 但这种字典查找会因为冲突链很长而变慢，是反模式
```

这个例子说明一个微妙但重要的规则：自定义对象要正确作键，必须同时实现 `__hash__` 和 `__eq__`，且保证"相等的对象哈希必须相同"（反之不要求）。只实现一个会出问题：若 `__eq__` 判定相等但哈希不同，字典会把"本应是一个键"当成两个键存进去。

### 4.3 插入顺序的保留（Python 3.7+ 起）

从 Python 3.7 起（3.6 是 CPython 实现细节），字典**保留插入顺序**：遍历时按"先插入的键先出现"。这是通过维护两个数组实现的——一个稀疏的哈希索引数组、一个紧凑的键值条目数组，新条目总是追加到紧凑数组末尾，因此天然记录了插入顺序。

```python
d = {}
d["banana"] = 2
d["apple"] = 1
d["cherry"] = 3
print(list(d.keys()))   # 输出：['banana', 'apple', 'cherry']   ← 按插入顺序

# 删除再重新插入，会排到末尾（不是原来的位置）
del d["apple"]
d["apple"] = 1
print(list(d.keys()))   # 输出：['banana', 'cherry', 'apple']
```

这一特性的意义不止"遍历有序"，它还让 `dict` 在很多场景能直接取代 `OrderedDict`：如果你只是需要"记住写入顺序"，3.7+ 的普通 dict 就够了。但 `OrderedDict` 仍有其独特能力（如 `move_to_end`、按相等性比较时考虑顺序），这些是普通 dict 没有的，所以两者并非完全可互换。

### 4.4 字典的内存结构与扩容

CPython 字典内部维护一个固定大小的"索引数组"和一个随条目数增长的"条目数组"。当条目数达到容量阈值（通常约 2/3 负载因子）时，字典会 resizing——分配更大的索引数组并把所有条目重新散列到新位置。这个 resizing 是 O(n)，但均摊到每次插入仍是 O(1)。

```python
import sys

# 观察字典随条目增长的内存变化（resize 是跳跃式的）
d = {}
prev = 0
for i in range(1, 20):
    d[i] = i
    size = sys.getsizeof(d)
    if size != prev:
        print(f"条目数={len(d):<3} getsizeof={size} bytes")
        prev = size
```

典型输出会显示 `getsizeof` 在某些插入处突然变大——那就是 resize 点。这也解释了为什么"预先知道大致容量时，一次性塞入比频繁小量插入更高效"：能减少 resize 次数。不过对绝大多数应用，字典 resize 的开销可以忽略，不必过度优化。

### 4.5 字面量与构造函数的字节码差异

不同创建方式在底层生成的字节码不同，这直接影响性能。字面量 `{...}` 和推导式使用专门的 `BUILD_MAP` / 字典专用指令，而 `dict(...)` 是一次函数调用 + 参数构造。

```python
import dis

# 字面量：BUILD_CONST_KEY_MAP 等专用指令，较快
dis.dis(compile("{'a': 1, 'b': 2}", "<s>", "eval"))

# 构造函数：先 LOAD_NAME dict 再 CALL，多一次函数调用开销
dis.dis(compile("dict(a=1, b=2)", "<s>", "eval"))
```

实证：在创建等量内容时，字面量通常比 `dict(**kwargs)` 略快，因为省去了函数调用和参数解析。但这个差距在绝大多数场景可忽略，不应以此作为选择依据——可读性和语义匹配才是首要，性能只在"百万次级热路径"里才需要计较。

## 5. 总结

### 5.1 创建方式选择速查

```
需要创建字典时，按下表反查：
- 内容静态、写死 ..................... 字面量 {"a": 1}
- 键是合法标识符的配置 ............... dict(a=1)
- 键值对已组成配对序列 ............... dict(pairs)
- 两等长序列按位置配对 ............... dict(zip(keys, vals))
- 需要从已有数据筛选/变换 ............ 推导式 {k: v for ...}
- 翻转字典(值唯一且可哈希) ........... {v: k for k,v in d.items()}
- 批量同默认值(不可变) ............... dict.fromkeys(ks, v)
- 批量同默认值(可变，每键独立) ....... {k: [] for k in ks}
- 合并多源产生新字典 ................. {**a, **b} 或 a | b (3.9+)
- 就地累积合并 ....................... d.update(other) 或 d |= other
- 复制外壳 .......................... d.copy() / {**d} / dict(d)
- 完全独立深拷贝 ..................... copy.deepcopy(d)
- 从 JSON 字符串 ..................... json.loads(s)
```

### 5.2 核心要点回顾

- 字典键必须**可哈希**，这一约束贯穿所有创建方式；可变对象（list/dict/set）作键直接报错。
- 字面量 `{"a":1}` 与 `dict(a=1)` 覆盖多数静态场景；后者要求键是合法标识符。
- 动态数据归 `dict(配对序列)` 与 `dict(zip(...))`；筛选/变换归推导式；批量同值归 `fromkeys`（注意可变默认值共享陷阱）。
- 合并用 `**` 解包或 `|`（产生新对象）、`update`/`|=`（就地）；语义均为"后者覆盖前者"。
- `copy()` 是浅拷贝，内层可变对象仍共享，需完全独立时用 `copy.deepcopy`。
- 从 JSON 来的字典键全是字符串，需注意与整数键的区分。
- 3.7+ 字典保留插入顺序，普通 dict 在多数场景可取代 `OrderedDict`。

### 5.3 读完应能掌握

- 能列出至少 8 种字典创建方式，并说明每种的关键参数与适用场景。
- 能为"两列表配对、批量默认值、合并配置、翻转字典、从 JSON"等典型场景立刻选出最贴切的写法。
- 能解释键的可哈希性要求，并识别 `fromkeys` 可变默认值共享、JSON 键为字符串、`1` 与 `True` 互相覆盖等陷阱。
- 能区分浅拷贝与深拷贝，知道何时必须用 `copy.deepcopy`。
- 能从哈希表原理层面解释字典为何要求键可哈希、为何平均 O(1)、为何 3.7+ 有序。

### 5.4 常见面试问题

**问题一：创建字典有哪些方式？**

```python
# 至少答出这些：
d1 = {"a": 1}                      # 字面量
d2 = dict(a=1)                     # 关键字参数
d3 = dict([("a", 1)])              # 键值对序列
d4 = dict(zip(["a"], [1]))         # zip 配对
d5 = {k: v for k, v in [("a", 1)]} # 推导式
d6 = dict.fromkeys(["a"], 1)       # fromkeys
d7 = {**{"a": 1}}                  # 解包
d8 = json.loads('{"a": 1}')        # JSON（import json）
```

**问题二：`dict.fromkeys(["a","b"], [])` 有什么问题？**

```python
d = dict.fromkeys(["a", "b"], [])
print(d["a"] is d["b"])   # 输出：True ← 两个键共享同一个 list
d["a"].append(1)
print(d)                  # 输出：{'a': [1], 'b': [1]} ← 全被污染
# 原因：可变默认值被多处引用；正确做法 {k: [] for k in ["a","b"]}
```

**问题三：为什么字典的键必须是可哈希的？**

```python
# 字典靠哈希表定位：hash(key) → 数组下标 → 比较相等性
# 哈希值必须稳定，否则存进去后无法再定位
# list 可变 → 哈希会变 → 不可哈希 → 不能作键
# { [1,2]: "x" }  → TypeError: unhashable type: 'list'
# 元组因不可变可哈希，但含可变元素的元组也不可哈希：
# { (1, [2]): "x" }  → TypeError: unhashable type: 'list'
```

**问题四：合并两个字典，相同键如何处理？**

```python
a = {"x": 1, "y": 2}
b = {"y": 99, "z": 3}
print({**a, **b})   # 输出：{'x': 1, 'y': 99, 'z': 3} ← y 取后者
print(a | b)        # 输出：{'x': 1, 'y': 99, 'z': 3} ← 同上(3.9+)
a.update(b)
print(a)            # 输出：{'x': 1, 'y': 99, 'z': 3} ← 就地，y 取后者
# 三者都遵循"后者覆盖前者"。
```

### 5.6 性能对比实证

把主要创建方式放在一起跑微基准，能直观看到它们的性能差异方向。注意微基准受机器与版本影响，这里看的是相对趋势而非绝对数值。

无论选哪种方式，都不要忘记一条贯穿全篇的根本约束：**键必须可哈希**。这是所有创建方式的共同前提，也是面试与实战中最常考、最常错的知识点。下面用一段极简回顾收束本节。

```python
import timeit

keys = [str(i) for i in range(100)]
vals = list(range(100))
pairs = list(zip(keys, vals))

# 方式一：字面量（用 eval 模拟静态字面量，仅作对比口径）
literal = timeit.timeit(lambda: {**dict(zip(keys, vals))}, number=100000)

# 方式二：zip 配对
t_zip = timeit.timeit(lambda: dict(zip(keys, vals)), number=100000)

# 方式三：推导式
t_comp = timeit.timeit(lambda: {k: v for k, v in pairs}, number=100000)

# 方式四：键值对序列
t_seq = timeit.timeit(lambda: dict(pairs), number=100000)

# 方式五：循环
def by_loop():
    d = {}
    for k, v in pairs:
        d[k] = v
    return d
t_loop = timeit.timeit(by_loop, number=100000)

print(f"zip 配对 : {t_zip:.3f}s")
print(f"推导式   : {t_comp:.3f}s")
print(f"序列构造 : {t_seq:.3f}s")
print(f"循环     : {t_loop:.3f}s")
```

典型趋势：`dict(zip(...))` 与 `dict(序列)` 最快，推导式次之，显式循环最慢。原因在于 `dict()` 接收可迭代对象是 C 层直接构建，而循环每次 `d[k] = v` 都要经过一次 Python 层的字典赋值协议。

但这恰恰是最容易过度优化的地方——**这些差异在单次创建几十上百个键值对时是完全无感的**，只有当创建发生在每秒百万次的热路径里才值得计较。所以经验法则是：先按可读性和语义选方式，只在 profiling 发现"字典创建是瓶颈"时，再考虑从循环/推导式换到 `dict(zip())`。

### 5.7 延伸

掌握字典的创建后，下一步可顺着本系列深入：`setdefault` 与 `defaultdict` 解决"取值时键不存在"的优雅写法；`OrderedDict` 在需要 `move_to_end` 等顺序操作时的独特能力；`Counter` 作为计数专用字典；以及《字典底层原理哈希表》一节对哈希表更深入的剖析（负载因子、resize、冲突攻击防范）。这些都建立在"理解字典如何创建、键如何约束"的基础之上。

最后留一个值得思考的延伸问题：当键的来源不可信（可能是用户输入、可能是恶意构造），字典创建和查找还潜藏哪些风险？答案是**哈希冲突攻击**——攻击者构造大量哈希相同或相邻的键，迫使字典退化成线性查找，耗尽 CPU。Python 从 3.3 起默认开启哈希随机化（`PYTHONHASHSEED`），使字符串/字节的哈希每次进程启动都不同，从而让攻击者难以预测冲突键。这正说明了"字典创建"远不止写法选择，背后还有安全维度的考量——这条线在《字典底层原理哈希表》一节会展开。

把"创建"和后续的"存取/合并/遍历"放回整个系列看：创建决定了字典的初始形态，而后续章节在此基础上展开各种操作。理解了创建方式的多样性及其底层约束，你就能在面对任意需求时从容地选择最贴切的写法，也为深入哈希表原理打下了基础。
