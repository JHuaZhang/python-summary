---
group:
  title: 【19】标准库精讲
  order: 19
order: 19
title: collections 常用工具
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 collections

`collections` 是 Python 标准库中的一个模块，专门提供一批**容器数据类型**（container datatypes），用来弥补内置容器 `dict`、`list`、`set`、`tuple` 在实际编码中力有不逮的场景。内置容器已经足够通用，但"通用"往往意味着"不够顺手"：统计词频要手写字典累加、分组要手写 `setdefault`、队列要手写 `pop(0)`（O(n) 的性能陷阱）、轻量记录要么写成臃肿的类要么靠下标访问不直观的 tuple。`collections` 就是来解决这些"高频但手写麻烦"的需求的。

它在 Python 标准库中的地位非常稳固：从早期的 `deque`、`defaultdict`，到 2.6 引入 `namedtuple`，再到 3.0 后逐步加入 `Counter`、`OrderedDict`、`ChainMap`、`UserDict` 等，这一系列工具经过多年沉淀，几乎是每个 Python 工程师日常编码的标配。掌握 `collections`，能让你少写大量样板代码，写出更可读、更高效、更不易出错的程序。

本篇逐一精讲以下七个常用工具：

| 工具 | 一句话定位 | 典型场景 |
|------|-----------|---------|
| `namedtuple` | 带字段名的不可变元组 | 轻量记录、替代小类、坐标点 |
| `Counter` | 计数器字典 | 词频统计、投票计票、Top N |
| `defaultdict` | 带默认值的字典 | 分组、累加、免 `KeyError` |
| `deque` | 双端队列 | 队列、栈、滑动窗口、限长缓存 |
| `OrderedDict` | 保持插入顺序的字典 | 有序映射、LRU 缓存、有序相等比较 |
| `ChainMap` | 多字典视图合并 | 配置层叠、只读合并 |
| `UserDict` / `UserList` / `UserString` | 自定义容器基类 | 继承扩展容器行为 |

### 1.2 基本导入与最小用法

`collections` 是标准库，无需安装，直接 `import` 即可。下面先给一个最小示例，让你直观感受它的价值——同样的"统计字符出现次数"需求，手写 dict 与用 `Counter` 的对比。

```python
from collections import Counter

# 需求：统计字符串中每个字符出现几次，并取出现最多的前 2 个

# 手写 dict 的写法（啰嗦、易错）
counts = {}
for ch in "aabbcccc":
    counts[ch] = counts.get(ch, 0) + 1
top2手动 = sorted(counts.items(), key=lambda kv: kv[1], reverse=True)[:2]

# 用 Counter 的写法（一行搞定）
top2自动 = Counter("aabbcccc").most_common(2)

print(top2手动)   # 输出：[('c', 4), ('a', 2)]
print(top2自动)   # 输出：[('c', 4), ('a', 2)]
```

`Counter` 把"遍历累加 + 排序取前 N"这套样板压缩成了一个对象的构造与一个方法调用。这就是 `collections` 的设计哲学：**把高频的容器操作模式封装成专用容器类型**，让业务代码专注于逻辑本身。

后续各工具会逐一展开。本篇所有 demo 均可直接复制运行，不依赖任何外部文件。

---

## 2. 核心内容

### 2.1 namedtuple——命名元组

`namedtuple` 是一个**工厂函数**，调用它后会动态生成一个 `tuple` 的子类。这个子类的实例既能像普通 tuple 那样按下标访问，又能像对象那样用属性名访问字段，兼具 tuple 的轻量与对象的的可读性。

**签名**

```python
collections.namedtuple(typename, field_names, *, rename=False,
                       defaults=None, module=None)
```

- `typename`：生成的类名（字符串），如 `"Point"`。
- `field_names`：字段名序列，可以是空格/逗号分隔的字符串 `"x y z"`，也可以是列表 `["x", "y", "z"]`。
- `rename`：为 `True` 时，非法字段名（如 Python 关键字、重复名）自动改名为 `_0`、`_1` 等，避免报错。
- `defaults`：给末尾若干字段指定默认值，如 `defaults=(0, 0)` 表示最后两个字段默认为 0。
- `module`：指定生成的类的 `__module__`，用于 `pickle` 兼容。

**何时用**

当你想表示一个"只有数据、没有行为"的轻量记录时——比如二维坐标 `Point(x, y)`、RGB 颜色 `Color(r, g, b)`、CSV 一行记录——用 `namedtuple` 比写一个完整类省事得多，又比裸 tuple 可读得多。它不可变（继承自 tuple），所以也适合做字典 key 或集合元素。

**最小 demo**

```python
from collections import namedtuple

# 定义一个 Point 类型，有 x、y 两个字段
Point = namedtuple("Point", ["x", "y"])

p = Point(3, 4)
print(p.x, p.y)      # 输出：3 4   ——用属性名访问，可读
print(p[0], p[1])    # 输出：3 4   ——也支持下标访问
print(p)             # 输出：Point(x=3, y=4)  ——repr 自带字段名
```

注意 `Point` 是一个**类**，`namedtuple("Point", ...)` 调用返回的就是这个类本身。之后每次 `Point(...)` 都是在实例化它。

**字段名的几种写法**

`field_names` 支持三种等价写法，看团队风格选用：

```python
# 1. 列表（最显式，推荐）
Color = namedtuple("Color", ["r", "g", "b"])

# 2. 空格分隔字符串
Color = namedtuple("Color", "r g b")

# 3. 逗号分隔字符串
Color = namedtuple("Color", "r,g,b")

# 三者等价，生成的类完全一致
c = Color(255, 128, 0)
print(c.r, c.g, c.b)   # 输出：255 128 0
```

**rename 参数**

当字段名冲突或非法时，`rename=True` 会自动重命名，避免 `ValueError`。这在字段名来自外部数据（如 CSV 表头）时很有用。

```python
from collections import namedtuple

# class 是关键字，abc 是非法（下划线开头虽合法但约定为私有），
# name 重复 —— 这三者原本会让 namedtuple 报错
Bad = namedtuple("Bad", ["class", "abc", "name", "name"], rename=True)
b = Bad(1, 2, 3, 4)
print(b._0, b._1, b._2, b._3)   # 输出：1 2 3 4
print(Bad._fields)              # 输出：('_0', '_1', 'name', '_3')
```

`rename=False`（默认）遇到非法名直接抛 `ValueError`，这是更安全的开发期行为。

**defaults 参数**

`defaults` 是一个**从右往左**匹配的默认值序列：它给字段列表的**末尾**若干个字段设默认值。这个"从末尾匹配"的规则是为了和位置参数从左到右传递的语义对齐——有默认值的必须是靠后的字段。

```python
from collections import namedtuple

# 字段：host, port, timeout, retry
# defaults=(1.0, 3) 给最后两个字段 timeout=1.0、retry=3
Config = namedtuple("Config", ["host", "port", "timeout", "retry"],
                    defaults=(1.0, 3))

cfg = Config("127.0.0.1", 8080)
print(cfg)   # 输出：Config(host='127.0.0.1', port=8080, timeout=1.0, retry=3)

cfg2 = Config("0.0.0.0", 80, 5.0, 10)
print(cfg2)  # 输出：Config(host='0.0.0.0', port=80, timeout=5.0, retry=10)
```

**常用方法**

`namedtuple` 生成的类除了继承 tuple 的方法外，还额外提供几个实用方法：

| 方法 | 作用 |
|------|------|
| `._make(iterable)` | 从一个可迭代对象构造实例，等价 `cls(*iterable)` |
| `._asdict()` | 转成 `dict`（字段名→值），3.8+ 返回普通 dict |
| `._replace(**kwargs)` | 返回一个新实例，替换指定字段（因为不可变，所以"改"要新建） |
| `._fields` | 字段名元组 |
| `._field_defaults` | 默认值字典（3.8+） |

```python
from collections import namedtuple

Point = namedtuple("Point", ["x", "y"])
p = Point(1, 2)

# _make：从已有序列批量构造
coords = [(1, 2), (3, 4), (5, 6)]
points = [Point._make(c) for c in coords]
print(points)  # 输出：[Point(x=1, y=2), Point(x=3, y=4), Point(x=5, y=6)]

# _asdict：转字典
print(p._asdict())  # 输出：{'x': 1, 'y': 2}

# _replace：不可变对象"修改"字段的方式
p2 = p._replace(x=10)
print(p, p2)   # 输出：Point(x=1, y=2) Point(x=10, y=2)   ——p 不变

# _fields：拿到字段名
print(Point._fields)  # 输出：('x', 'y')

# 用 * 解包 _fields 来快速定义新 namedtuple
Point3D = namedtuple("Point3D", Point._fields + ("z",))
print(Point3D(1, 2, 3))  # 输出：Point3D(x=1, y=2, z=3)
```

注意这些方法都以**下划线开头**。早期版本是因为防止和用户定义的字段名冲突（你完全可能有个字段叫 `make`），后来这成为约定，但并不意味着它们是私有的——它们就是公开 API，下划线只是命名避让。

**场景：替代手写小类**

当你需要一个"数据载体"但不想写一整个 `class` 时，`namedtuple` 是最轻量的选择。

```python
from collections import namedtuple

# 场景：处理员工记录，每条记录有姓名、工号、部门
Employee = namedtuple("Employee", ["name", "eid", "dept"])

# 从 CSV/数据库读出来的每行都是元组，用 _make 直接转成有字段名的对象
rows = [
    ("张三", "E001", "研发"),
    ("李四", "E002", "产品"),
    ("王五", "E003", "研发"),
]
employees = [Employee._make(row) for row in rows]

for emp in employees:
    if emp.dept == "研发":
        print(f"{emp.eid} {emp.name}")   # 输出：E001 张三 \n E003 王五
```

如果用裸 tuple，访问时写 `emp[2]` 谁也不知道是什么；如果写完整 class，光 `__init__`、`__repr__` 就一堆样板。`namedtuple` 恰好取中间：可读、轻量、不可变。

### 2.2 Counter——计数器

`Counter` 是 `dict` 的子类，专门用于**计数**：它的 key 是被计数的元素，value 是该元素出现的次数。你可以用一个可迭代对象或字典来构造它，构造过程就自动完成了"遍历并累加"的工作。

**签名**

```python
collections.Counter(iterable=None, /, **kwds)
```

- `iterable`：任意可迭代对象，元素会被逐一计数。
- `**kwds`：也可以用关键字参数直接指定 `Counter(a=2, b=3)`。

**何时用**

只要需求是"统计各元素出现多少次"，第一反应就应该是 `Counter`。典型场景：词频统计、投票计票、日志分析统计各类别出现次数、求 Top N 高频项、计算两个计数器的差集/并集。

**构造与基本访问**

```python
from collections import Counter

# 从字符串构造：每个字符是一个元素
c = Counter("aabbcccc")
print(c)            # 输出：Counter({'c': 4, 'a': 2, 'b': 2})
print(c["a"])       # 输出：2
print(c["z"])       # 输出：0   ——不存在的 key 返回 0，不报 KeyError
```

`Counter` 最重要的特性之一：**访问不存在的 key 返回 0 而非抛 `KeyError`**。这是因为它的 `__missing__` 方法被重写为返回 0。这一点在做"某个元素出现了没"的判断时非常方便，省去了 `get(key, 0)` 的写法。

**从不同数据源构造**

```python
from collections import Counter

# 从列表构造
words = ["apple", "banana", "apple", "cherry", "banana", "apple"]
wc = Counter(words)
print(wc)   # 输出：Counter({'apple': 3, 'banana': 2, 'cherry': 1})

# 从字典构造（直接给定计数）
c1 = Counter({"猫": 5, "狗": 3, "鸟": 7})
print(c1)   # 输出：Counter({'鸟': 7, '猫': 5, '狗': 3})

# 用关键字参数构造
c2 = Counter(cats=5, dogs=3, birds=7)
print(c2)   # 输出：Counter({'birds': 7, 'cats': 5, 'dogs': 3})
```

**most_common(n)——取前 N 高频**

这是 `Counter` 用得最多的方法，返回出现次数最多的 n 个元素及其计数，按次数降序排列。不传 `n` 则返回全部。

```python
from collections import Counter

text = "the quick brown fox jumps over the lazy dog the the"
words = text.split()
wc = Counter(words)

# 出现最多的 3 个词
print(wc.most_common(3))
# 输出：[('the', 4), ('quick', 1), ('brown', 1)]

# 不传 n，返回全部，按次数降序（次数相同按首次出现顺序）
print(wc.most_common())
# 输出：[('the', 4), ('quick', 1), ('brown', 1), ('fox', 1), ('jumps', 1), ('over', 1), ('lazy', 1), ('dog', 1)]
```

`most_common` 内部用 `heapq.nlargest` 实现，在只取前几个时不必对全部数据排序，性能优于 `sorted(...)[-n:]`。

**elements()——按计数展开元素**

返回一个迭代器，把每个元素按其计数重复展开。计数 ≤0 的元素会被跳过。顺序按元素首次出现排列。

```python
from collections import Counter

c = Counter(a=3, b=2, c=0, d=-1)
print(sorted(c.elements()))
# 输出：['a', 'a', 'a', 'b', 'b']

# c 和 d 因为计数 ≤ 0 被忽略
```

典型用途：从压缩的计数表示还原原始序列（不考虑原始顺序时），或用于按权重生成测试数据。

**update()——追加计数**

`Counter.update` 与 `dict.update` 不同：它不是覆盖，而是**累加**。可以传入可迭代对象或另一个 `Counter`/`dict`。

```python
from collections import Counter

c = Counter("aabb")   # {'a': 2, 'b': 2}

# 从可迭代对象追加
c.update("aab")       # 再加 a a b
print(c)              # 输出：Counter({'a': 4, 'b': 3})

# 从另一个 Counter 追加
c.update(Counter(a=1, c=5))
print(c)              # 输出：Counter({'c': 5, 'a': 5, 'b': 3})
```

**subtract()——减去计数**

与 `update` 对应，`subtract` 是**递减**计数，结果可能为负数。

```python
from collections import Counter

sold = Counter(apple=5, banana=3, cherry=2)
restock = Counter(apple=2, banana=1)
sold.subtract(restock)
print(sold)
# 输出：Counter({'apple': 3, 'banana': 2, 'cherry': 2})

# 减到不够会出现负数
sold.subtract(Counter(apple=10))
print(sold)
# 输出：Counter({'banana': 2, 'cherry': 2, 'apple': -7})
```

**算术与集合运算**

`Counter` 重载了 `+`、`-`、`&`、`|` 四个运算符，语义非常贴合"计数"这一场景：

| 运算 | 语义 |
|------|------|
| `c + d` | 计数相加（出现次数之和），但负数项会被丢弃 |
| `c - d` | 计数相减，结果 ≤0 的项被丢弃（保留正数） |
| `c & d` | 交集：取两边都有的 key，次数取较小值 |
| `c \| d` | 并集：所有 key，次数取较大值 |

```python
from collections import Counter

c1 = Counter(a=3, b=2, c=1)
c2 = Counter(a=1, b=5, d=4)

# 加：次数求和（c1 丢了 d，c2 丢了 c）
print(c1 + c2)   # 输出：Counter({'b': 7, 'a': 4, 'd': 4, 'c': 1})

# 减：c1 - c2，正数保留，≤0 丢弃
print(c1 - c2)   # 输出：Counter({'c': 1})   a:2, b:-3 丢弃

# 交：取 min
print(c1 & c2)   # 输出：Counter({'a': 1, 'b': 2})

# 并：取 max
print(c1 | c2)   # 输出：Counter({'b': 5, 'a': 3, 'd': 4, 'c': 1})
```

这套运算在做"两个统计结果合并/对比"时极为顺手：比如本周和上周的搜索词统计做并集看总量、做差集看增量。

**场景：词频统计与 Top N**

```python
from collections import Counter

# 场景：分析一篇文章的高频词，输出出现 ≥3 次的前 5 个词
article = """
python is great python is powerful python is easy to learn
python has many libraries python is popular python runs everywhere
developers love python python python python
""".split()

word_counts = Counter(article)
top5 = word_counts.most_common(5)
for word, n in top5:
    print(f"{word}: {n}")
# 输出：
# python: 9
# is: 4
# many: 1
# libraries: 1   （次数相同的按首次出现顺序，所以 "many" 排前）
# popular: 1
```

这比手写 `dict` + `sorted` + `lambda` 简洁太多，且更不容易写错。

**场景：投票计票**

```python
from collections import Counter

votes = ["Alice", "Bob", "Alice", "Carol", "Alice", "Bob", "Bob", "Alice"]
tally = Counter(votes)

print("各候选人得票：", dict(tally))
# 输出：各候选人得票： {'Alice': 4, 'Bob': 3, 'Carol': 1}

winner, votes_w = tally.most_common(1)[0]
print(f"胜者：{winner}（{votes_w} 票）")
# 输出：胜者：Alice（4 票）
```

### 2.3 defaultdict——带默认值的字典

`defaultdict` 是 `dict` 的子类，它在构造时接收一个**工厂函数** `default_factory`。当访问一个不存在的 key 时，它会自动调用这个工厂函数生成一个默认值、存入字典并返回，而不是抛 `KeyError`。这一行为帮你省掉所有 `setdefault` 或 `if key not in d` 的样板代码。

**签名**

```python
collections.defaultdict(default_factory=None, /, [...])
```

- `default_factory`：一个无参可调用对象，被调用后返回默认值。传 `None`（默认）时退化为普通 `dict`，访问缺失 key 仍会抛 `KeyError`。

**何时用**

- **分组**：把一堆数据按某 key 归类，每个 key 对应一个列表——`defaultdict(list)` 是经典写法。
- **累加计数**：`defaultdict(int)` 在未知 key 出现时自动给 0，省去初始化。
- **集合去重分组**：`defaultdict(set)` 按 key 归类并自动去重。
- **多层嵌套**：配合递归或 `defaultdict` 嵌套，构建树形结构。

**基本用法对比**

先看手写 dict 与 `defaultdict` 的对比，体会便利：

```python
# 需求：按部门分组员工
records = [("研发", "张三"), ("产品", "李四"), ("研发", "王五"), ("产品", "赵六")]

# 写法一：手写 dict + setdefault（啰嗦）
groups1 = {}
for dept, name in records:
    groups1.setdefault(dept, []).append(name)

# 写法二：手写 dict + if 判断（更啰嗦）
groups2 = {}
for dept, name in records:
    if dept not in groups2:
        groups2[dept] = []
    groups2[dept].append(name)

# 写法三：defaultdict（干净）
from collections import defaultdict
groups3 = defaultdict(list)
for dept, name in records:
    groups3[dept].append(name)   # 缺 key 时自动建空 list

print(groups1)  # 输出：{'研发': ['张三', '王五'], '产品': ['李四', '赵六']}
print(groups2)  # 输出：{'研发': ['张三', '王五'], '产品': ['李四', '赵六']}
print(dict(groups3))  # 输出：{'研发': ['张三', '王五'], '产品': ['李四', '赵六']}
```

三种写法结果一致，但 `defaultdict(list)` 让代码只剩"核心逻辑"——遍历并 append，没有一句样板。这是它最大的价值。

**defaultdict(list)——分组**

最经典的搭配。工厂函数 `list` 被调用返回一个新空列表。

```python
from collections import defaultdict

# 场景：把一组（城市, 人名）记录按城市分组
pairs = [
    ("北京", "张三"), ("上海", "李四"),
    ("北京", "王五"), ("广州", "赵六"),
    ("上海", "钱七"), ("北京", "孙八"),
]

by_city = defaultdict(list)
for city, name in pairs:
    by_city[city].append(name)

for city, names in by_city.items():
    print(f"{city}: {names}")
# 输出：
# 北京: ['张三', '王五', '孙八']
# 上海: ['李四', '钱七']
# 广州: ['赵六']
```

**defaultdict(int)——累加计数**

`int()` 返回 0，所以 `defaultdict(int)` 天然适合做计数器（虽然 `Counter` 更专一，但 `defaultdict(int)` 有时更灵活，比如累加的是浮点数或需要自定义逻辑时）。

```python
from collections import defaultdict

# 场景：统计每种水果的总销量（多笔交易累加）
transactions = [
    ("apple", 3), ("banana", 2), ("apple", 5),
    ("cherry", 1), ("banana", 4), ("apple", 2),
]

sales = defaultdict(int)
for fruit, qty in transactions:
    sales[fruit] += qty   # 缺 key 自动给 0，直接 +=

print(dict(sales))
# 输出：{'apple': 10, 'banana': 6, 'cherry': 1}
```

**defaultdict(set)——去重分组**

`set()` 返回空集合，适合"按 key 归类但自动去重"。

```python
from collections import defaultdict

# 场景：每个学生选了哪些课，去重
enrollments = [
    ("Alice", "Math"), ("Bob", "English"),
    ("Alice", "Math"),   # 重复选课，需去重
    ("Bob", "Math"), ("Alice", "Physics"),
]

courses = defaultdict(set)
for student, course in enrollments:
    courses[student].add(course)

for student, cs in courses.items():
    print(f"{student}: {cs}")
# 输出：
# Alice: {'Math', 'Physics'}
# Bob: {'English', 'Math'}
```

**default_factory=None 时退化为普通 dict**

```python
from collections import defaultdict

d = defaultdict()   # 不传工厂，等价于 None
try:
    d["missing"]
except KeyError as e:
    print(f"仍会抛 KeyError: {e}")
# 输出：仍会抛 KeyError: 'missing'
```

**访问缺失 key 的副作用**

`defaultdict` 在访问缺失 key 时会**真正写入**默认值，这在某些情况下需要注意：

```python
from collections import defaultdict

d = defaultdict(list)
_ = d["never_used"]   # 只是读一下，却已经创建了空 list
print("never_used" in d)   # 输出：True
print(d)   # 输出：defaultdict(<class 'list'>, {'never_used': []})
```

如果你只想"读时给默认、但不写入"，应该用 `dict.get(key, default)` 或普通 `dict` 配合 `__missing__` 自定义，而不是 `defaultdict`。

### 2.4 deque——双端队列

`deque`（发音 "deck"，全称 double-ended queue）是一个**双端队列**，支持在两端高效地追加和弹出元素，时间复杂度都是 O(1)。这正好弥补了列表 `list` 的短板：`list.pop(0)` 或 `list.insert(0, x)` 是 O(n)，因为要把后面所有元素整体移动。

**签名**

```python
collections.deque(iterable=None, maxlen=None)
```

- `iterable`：初始化用的可迭代对象，元素从左到右填入。
- `maxlen`：可选的最大长度。设定后，当一端追加导致超长时，另一端会自动弹出元素丢弃，形成"固定长度的滑动容器"。

**何时用**

- **队列（FIFO）**：先进先出，用 `append` 入队、`popleft` 出队。
- **栈（LIFO）**：后进先出，用 `append`/`pop`（其实 list 也行，但 deque 语义更明确）。
- **滑动窗口**：维护最近 N 个元素，`maxlen` 自动淘汰旧数据。
- **限长缓存/历史记录**：比如只保留最近 100 条操作日志。
- **BFS 广度优先搜索**：用 deque 当待访问队列，比 list 的 `pop(0)` 快得多。

**两端操作**

```python
from collections import deque

d = deque([1, 2, 3])

# 右端操作（和 list 一致）
d.append(4)        # 右端追加
print(d)           # 输出：deque([1, 2, 3, 4])
d.pop()            # 右端弹出
print(d)           # 输出：deque([1, 2, 3])

# 左端操作（deque 的强项，O(1)）
d.appendleft(0)    # 左端追加
print(d)           # 输出：deque([0, 1, 2, 3])
d.popleft()        # 左端弹出
print(d)           # 输出：deque([1, 2, 3])
```

`appendleft`/`popleft` 是 deque 区别于 list 的核心能力。在 list 上做等价操作是 O(n)。

**rotate(n)——旋转**

`rotate` 把 deque 整体"旋转" n 步：n>0 时右旋（右端元素挪到左端），n<0 时左旋。原地修改，不返回新对象。

```python
from collections import deque

d = deque([1, 2, 3, 4, 5])

d.rotate(2)        # 右旋 2：末尾 2 个挪到前面
print(d)           # 输出：deque([4, 5, 1, 2, 3])

d.rotate(-1)       # 左旋 1：开头 1 个挪到末尾
print(d)           # 输出：deque([5, 1, 2, 3, 4])
```

一个典型场景：轮询调度。一组任务轮流执行，每轮把队首挪到队尾，用 `rotate(-1)` 一句话完成。

**maxlen——自动限长**

设定 `maxlen` 后，deque 变成一个"固定容量"的容器：当一端已满再追加时，另一端自动弹出一个最老的元素。这使得它天然适合做滑动窗口、限长历史记录。

```python
from collections import deque

# 只保留最近 3 个访问记录
history = deque(maxlen=3)
for page in ["首页", "商品页", "购物车", "支付页", "完成页"]:
    history.append(page)
    print(list(history))
# 输出：
# ['首页']
# ['首页', '商品页']
# ['首页', '商品页', '购物车']
# ['商品页', '购物车', '支付页']      —— '首页' 被挤出
# ['购物车', '支付页', '完成页']      —— '商品页' 被挤出
```

当 `maxlen` 已满时 `append` 不报错也不扩容，而是静默丢弃另一端——这是约定行为。注意一旦设定了 `maxlen` 就不能再改。

**场景：队列（FIFO）**

```python
from collections import deque

# 场景：模拟任务调度，先到先处理
tasks = deque()
tasks.append("任务A")
tasks.append("任务B")
tasks.append("任务C")

while tasks:
    current = tasks.popleft()   # 取最早的
    print(f"处理：{current}")
# 输出：
# 处理：任务A
# 处理：任务B
# 处理：任务C
```

对比 `list.pop(0)`：在 10 万元素的列表上 `pop(0)` 要移动 10 万元素，而 `deque.popleft()` 只需 O(1)。

**场景：滑动窗口求平均值**

```python
from collections import deque

# 场景：实时数据流，维护最近 window_size 个采样的平均值
def make_moving_average(window_size):
    window = deque(maxlen=window_size)
    def update(value):
        window.append(value)
        # 窗口未满时按当前元素数算平均
        return sum(window) / len(window)
    return update

ma = make_moving_average(3)
for v in [10, 20, 30, 40, 50]:
    print(f"输入 {v}，移动平均 {ma(v):.2f}")
# 输出：
# 输入 10，移动平均 10.00
# 输入 20，移动平均 15.00
# 输入 30，移动平均 20.00
# 输入 40，移动平均 30.00   （窗口 [20,30,40]）
# 输入 50，移动平均 40.00   （窗口 [30,40,50]）
```

`maxlen=3` 让旧数据自动出队，省去了手动判断长度和 `pop`。

**其他常用方法**

```python
from collections import deque

d = deque([1, 2, 2, 3, 2])
d.remove(2)        # 移除第一个出现的 2，O(n)
print(d)           # 输出：deque([1, 2, 3, 2])

d.extend([4, 5])   # 右端批量追加
d.extendleft([0])  # 左端批量追加（注意顺序会反过来）
print(d)           # 输出：deque([0, 1, 2, 3, 2, 4, 5])

d.clear()          # 清空
print(d)           # 输出：deque([])

print(d.maxlen)    # 输出：None   （未设上限）
```

`extendleft` 容易踩坑：它是把元素**逐个** `appendleft`，所以 `extendleft([1,2,3])` 的结果是 `[3,2,1,...]`，顺序与传入相反。

**deque 与 list 的取舍**

| 特性 | list | deque |
|------|------|-------|
| 末尾 append/pop | O(1) | O(1) |
| 头部 insert(0)/pop(0) | O(n) | O(1) `appendleft`/`popleft` |
| 中间随机访问 `d[i]` | O(1) | O(n)（链式结构） |
| 切片 `d[a:b]` | 支持 | 不支持（需转 list） |
| maxlen 自动限长 | 不支持 | 支持 |
| 内存 | 连续数组，紧凑 | 分块，稍多开销 |

经验法则：**只在两端操作就选 deque；需要频繁按下标随机访问或切片就选 list。**

### 2.5 OrderedDict——有序字典

`OrderedDict` 是 `dict` 的子类，会**记住键的插入顺序**。在 Python 3.7+，普通 `dict` 已经保证插入有序了，所以"保持顺序"不再是 `OrderedDict` 的独有优势。但它仍然提供几个普通 dict 没有的能力，在特定场景下不可替代。

**何时用（3.7+ 仍然有意义的场景）**

1. **`move_to_end`**：把某个 key 移到最前或最后，O(1)。做 LRU 缓存、调整优先级时极方便，普通 dict 做不到（要先删再插，且语义不含"移到末尾"）。
2. **有序的相等比较**：`OrderedDict == OrderedDict` 会比较顺序，`dict == dict` 不比较。当你需要"顺序不同即视为不同"时，只能用 `OrderedDict`。
3. **显式表达"顺序敏感"的意图**：用 `OrderedDict` 是一种文档化的代码自解释——告诉读者"这里的顺序很重要"。
4. **兼容旧版本**：需要跑在 3.6 及更早环境时，普通 dict 无序，必须用 `OrderedDict`。

**基本用法**

```python
from collections import OrderedDict

od = OrderedDict()
od["first"] = 1
od["second"] = 2
od["third"] = 3

print(list(od.keys()))   # 输出：['first', 'second', 'third']   按插入顺序
```

**move_to_end——移动到端**

```python
from collections import OrderedDict

od = OrderedDict([("a", 1), ("b", 2), ("c", 3)])

od.move_to_end("a")        # 默认移到末尾
print(list(od))            # 输出：['b', 'c', 'a']

od.move_to_end("c", last=False)   # last=False 移到开头
print(list(od))            # 输出：['c', 'b', 'a']
```

**有序相等比较**

```python
from collections import OrderedDict

# 普通 dict 不比顺序
d1 = {"a": 1, "b": 2}
d2 = {"b": 2, "a": 1}
print(d1 == d2)   # 输出：True   顺序无关

# OrderedDict 比顺序
od1 = OrderedDict([("a", 1), ("b", 2)])
od2 = OrderedDict([("b", 2), ("a", 1)])
print(od1 == od2)   # 输出：False   顺序不同即不等

# OrderedDict 与普通 dict 比较时仍不比顺序（混用降级为 dict 语义）
print(od1 == d1)   # 输出：True
```

**场景：实现简易 LRU 缓存**

`OrderedDict` 的 `move_to_end` 和 `popitem(last=False)` 天然组合成 LRU（Least Recently Used）缓存的核心操作：访问就移到末尾（最新），容量超限就从头弹出（最旧）。

```python
from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.store = OrderedDict()

    def get(self, key):
        if key not in self.store:
            return None
        # 命中：移到末尾表示"刚用过"
        self.store.move_to_end(key)
        return self.store[key]

    def put(self, key, value):
        if key in self.store:
            self.store.move_to_end(key)
        self.store[key] = value
        if len(self.store) > self.capacity:
            # 弹出最旧的一个（ đầu 端）
            self.store.popitem(last=False)

cache = LRUCache(2)
cache.put("a", 1)
cache.put("b", 2)
print(cache.get("a"))   # 输出：1   a 变成最新
cache.put("c", 3)       # 容量超限，淘汰最旧的 b
print(cache.get("b"))   # 输出：None   b 已被淘汰
print(cache.get("c"))   # 输出：3
```

`popitem(last=False)` 弹出"最早插入"的那个，`last=True`（默认）弹出"最晚插入"的那个。配合 `move_to_end` 就是完整的 LRU 机制。

### 2.6 ChainMap——多字典视图合并

`ChainMap` 把多个映射（通常是 dict）"逻辑上"串成一个视图，查找时按从左到右的顺序依次在各映射中找，第一个命中即返回。它与 `dict.update` 的区别在于：**它不合并成新 dict，而是持有各原 dict 的引用**——原 dict 修改了，ChainMap 看到的内容也跟着变；写入也只作用于第一个 dict。

**签名**

```python
collections.ChainMap(*maps)
```

- `maps`：多个映射，从左到右查找。不传则为 `[{}]`。

**何时用**

- **配置层叠**：命令行参数 > 环境变量 > 配置文件 > 默认值，多层优先级合并查找，但不破坏各层独立性。
- **只读合并**：想"看起来像一个大 dict"但实际上不复制数据，节省内存与同步成本。
- **上下文叠加**：作用域链、变量查找链。

**基本查找**

```python
from collections import ChainMap

defaults = {"host": "localhost", "port": 8080, "debug": False}
user_cfg = {"port": 9000, "debug": True}
cli_args = {"debug": False}   # 命令行最优先

cfg = ChainMap(cli_args, user_cfg, defaults)
print(cfg["host"])    # 输出：localhost   （只有 defaults 有）
print(cfg["port"])    # 输出：9000        （user_cfg 覆盖 defaults）
print(cfg["debug"])   # 输出：False       （cli_args 最优先）
```

查找顺序：`cli_args → user_cfg → defaults`，第一个有就返回。这正是"配置层叠"的标准模型。

** 写入只作用第一个**

```python
from collections import ChainMap

m1 = {"a": 1}
m2 = {"b": 2}
cm = ChainMap(m1, m2)

cm["c"] = 3       # 写入只进第一个 map
print(m1)         # 输出：{'a': 1, 'c': 3}
print(m2)         # 输出：{'b': 2}   没被动

cm["b"] = 20      # 改 b：也只写进 m1，不会改 m2
print(m1)         # 输出：{'a': 1, 'c': 3, 'b': 20}
print(m2)         # 输出：{'b': 2}
print(cm["b"])    # 输出：20   m1 现在有 b，遮蔽了 m2 的 b
```

**new_child——添加临时层**

`new_child(m)` 返回一个新的 ChainMap，在前面加一层 `m`，原 ChainMap 不变。适合临时加一层覆盖而不污染原配置。

```python
from collections import ChainMap

base = ChainMap({"a": 1, "b": 2})
overlay = base.new_child({"a": 99})
print(overlay["a"])   # 输出：99   新层覆盖
print(base["a"])      # 输出：1    原层未变

# 取出所有映射
print(overlay.maps)   # 输出：[{'a': 99}, {'a': 1, 'b': 2}]
```

**parents——去掉第一层**

`parents` 返回去掉最前面一层后的 ChainMap。

```python
from collections import ChainMap

cm = ChainMap({"a": 1}, {"b": 2}, {"c": 3})
print(cm.parents.maps)   # 输出：[{'b': 2}, {'c': 3}]
```

**ChainMap vs dict.update 的取舍**

| 特性 | dict.update（合并成新 dict） | ChainMap（视图） |
|------|---------------------------|-----------------|
| 是否复制数据 | 是 | 否，引用原 dict |
| 原 dict 修改后是否同步 | 否（已合并） | 是（实时反映） |
| 写入影响 | 写新 dict | 只写第一个 |
| 内存 | 多一份 | 几乎无开销 |

"一次性合并、之后不再变"用 `update`；"要实时反映各层最新状态"用 `ChainMap`。

### 2.7 UserDict / UserList / UserString——自定义容器基类

这三个类是**给开发者继承用的容器基类**。你可能会问：想自定义一个字典行为，直接继承 `dict` 不就行了吗？为什么要有 `UserDict`？

关键原因：**直接继承 `dict` 时，重写 `__getitem__` 等方法后，`dict` 自身的其他方法（如 `get`、`update`、`keys`）内部是通过 C 实现绕过你重写的方法的**，导致行为不一致。而 `UserDict` 内部用一个普通 dict（`self.data`）存数据，所有方法都通过 `self.data` 的标准 Python 接口走，你重写的方法会**一致地**被所有路径调用。

**何时用**

- 想给字典/列表/字符串加自定义行为（大小写不敏感的字典、自动转字符串的列表、受限删改的字符串等）。
- 需要保证重写的方法被一致调用（这是与直接继承内置类型的核心区别）。

**自定义大小写不敏感的字典**

```python
from collections import UserDict

class CaseInsensitiveDict(UserDict):
    def __setitem__(self, key, value):
        # 存入前把 key 转小写，保证查找一致
        super().__setitem__(key.lower(), value)

    def __getitem__(self, key):
        return super().__getitem__(key.lower())

    def __contains__(self, key):
        return super().__contains__(key.lower())

    def __delitem__(self, key):
        super().__delitem__(key.lower())

cid = CaseInsensitiveDict()
cid["Host"] = "localhost"
print(cid["host"])    # 输出：localhost
print(cid["HOST"])    # 输出：localhost
print("HOST" in cid)  # 输出：True
```

如果直接继承 `dict`，`cid["HOST"]` 会找不到（因为 `__getitem__` 可能被绕过），行为难以预测。用 `UserDict` 则一切自洽。

**为什么直接继承 dict 有坑**

```python
# 直接继承 dict 的陷阱演示
class MyDict(dict):
    def __setitem__(self, key, value):
        print(f"  调用 __setitem__: {key}={value}")
        super().__setitem__(key, value)

d = MyDict()
d["a"] = 1            # 输出：  调用 __setitem__: a=1   （直接赋值会走 __setitem__）
d.update({"b": 2})    # 无输出！update 是 C 实现，绕过了你重写的 __setitem__
print(d)              # 输出：{'a': 1, 'b': 2}
```

`update` 走了 C 层快路径，没有调用你重写的 `__setitem__`，导致自定义逻辑被"跳过"。`UserDict` 不存在这个问题——它的 `update` 是用 Python 写的，会走 `__setitem__`。这个差异在需要审计每次写入的场景（如日志、校验）非常关键。

**UserList 限制元素类型**

```python
from collections import UserList

class IntList(UserList):
    def __setitem__(self, index, value):
        if not isinstance(value, int):
            raise TypeError(f"只允许 int，收到 {type(value).__name__}")
        super().__setitem__(index, value)

    def append(self, value):
        if not isinstance(value, int):
            raise TypeError(f"只允许 int，收到 {type(value).__name__}")
        super().append(value)

nums = IntList([1, 2, 3])
nums.append(4)
print(nums)   # 输出：[1, 2, 3, 4]
try:
    nums.append("5")
except TypeError as e:
    print(e)   # 输出：只允许 int，收到 str
```

**UserString**

`UserString` 封装一个字符串到 `self.data`，方便在不改原 str 不可变语义的前提下加方法。

```python
from collections import UserString

class ReversibleString(UserString):
    def reversed(self):
        return ReversibleString(self.data[::-1])

s = ReversibleString("hello")
print(s.reversed())   # 输出：olleh
print(s.upper())      # 输出：HELLO   ——继承自 UserString 的方法仍可用
```

---

## 3. 最佳实践

**选对工具，而不是"我会哪个就用哪个"**

`collections` 里多个工具看似都能解决同一问题，但专物专用才能写出最干净的代码：

- 统计计数 → `Counter`（而不是 `defaultdict(int)`，Counter 有 `most_common`、`elements` 等计数专用 API）。
- 分组 → `defaultdict(list)`（而不是手写 `setdefault`）。
- 队列/栈/滑动窗口 → `deque`（而不是 `list`，避免 `pop(0)` 的 O(n) 陷阱）。
- 轻量记录 → `namedtuple`（而不是 4 字段的裸 tuple 或光秃秃的 class）。
- 多层配置 → `ChainMap`（而不是多次 `update` 成一个巨型 dict）。
- 自定义容器 → `UserDict`/`UserList`（而不是直接继承 `dict`/`list`）。

**Counter 的 0 与负数**

`Counter` 允许 value 为 0 甚至负数，但 `most_common`、`elements`、`+` 运算会自动忽略非正计数。如果你用 `subtract` 后想看"现在哪些还有剩余"，要先过滤：

```python
from collections import Counter

stock = Counter(apple=5, banana=3)
sold = Counter(apple=6, banana=1)
remaining = stock - sold   # Counter 减法会丢掉 ≤0 的项
print(remaining)           # 输出：Counter({'banana': 2})   apple 被丢了

# 如果想知道 apple 缺货多少（保留负数），用 subtract
stock2 = Counter(apple=5, banana=3)
stock2.subtract(sold)
print(stock2)              # 输出：Counter({'banana': 2, 'apple': -1})
```

**defaultdict 的"读即写"副作用**

`defaultdict` 访问缺失 key 会真正插入默认值。遍历时若用 `d[k]` 而非 `d.get(k)`，会意外膨胀字典。推荐：**仅在确需自动初始化的写入路径用 defaultdict，查询用 `.get(k)` 或先判断 `in`**。

**deque 不要随机访问**

`deque[i]` 是 O(n)，比 `list[i]` 慢得多。不要把 deque 当 list 用下标遍历。需要随机访问就转 list 或直接用 list。

**namedtuple 不是万能的**

`namedtuple` 适合纯数据记录。一旦你的对象需要：
- 可变字段 → 用 `dataclass`（3.7+）更合适。
- 有行为方法、继承体系 → 写完整 `class`。
- 需要类型提示与校验 → 用 `dataclass` 或 `pydantic.BaseModel`。

`namedtuple` 的不可变性在需要频繁"改"字段时反而碍事（每次都要 `_replace` 新建）。

**OrderedDict 在 3.7+ 仍有价值**

不要因为"dict 也有序了"就完全弃用 `OrderedDict`。当需要 `move_to_end`、`popitem(last=False)`、有序相等比较，或要明确表达"顺序敏感"时，它仍是首选。普通 dict 没有这两个方法。

**ChainMap 的写入要小心**

`ChainMap` 的写入只作用于第一个 map。如果你的"默认值层"被放到了第一位，写入会污染默认值。**约定：最具体的层（命令行、用户配置）放前面，最通用的默认层放后面。**

**UserDict vs dataclass vs直接继承**

- 需要完整自定义容器行为、保证方法一致调用 → `UserDict`/`UserList`。
- 只是想要一个带字段名的数据对象 → `dataclass`（namedtuple 的现代替代）。
- 想给 dict 加一两个小行为、不在意 update 是否调用 `__setitem__` → 直接继承 `dict` 也能用，但建议至少知道这个坑。

---

## 4. 原理

### 4.1 namedtuple：动态生成 tuple 子类

`namedtuple` 是一个**工厂函数**，它的核心工作是"运行时动态造一个类"。调用 `namedtuple("Point", ["x", "y"])` 时，内部大致经历以下步骤：

1. **校验字段名**：检查每个字段名是否合法（合法标识符、非关键字、非下划线开头除非 rename）。`rename=True` 时把非法名改为 `_0`、`_1`。
2. **拼装类体**：用 `exec` 执行一段模板字符串，定义出新类的 `__init__`、`__repr__`、`_asdict`、`_replace` 等方法。这些方法在源码里是预写好的模板，字段名通过 `%` 格式化填入。
3. **继承 tuple**：用 `exec` 生成的类定义里写 `class Point(tuple)`，再通过 `exec` 的 namespace 拿到这个类对象返回。

关键设计：**生成的类仍是 tuple 的子类**，这意味着 namedtuple 实例在内存布局上就是 tuple——连续的指针数组，没有 `__dict__`。它通过设置 `__slots__ = ()`（空元组）来禁止动态属性，从而省掉每个实例的 `__dict__` 和 `__weakref__` 开销。这就是 namedtuple"和 tuple 一样省内存"的根本原因。

```python
from collections import namedtuple
Point = namedtuple("Point", ["x", "y"])
p = Point(1, 2)

print(Point.__bases__)    # 输出：(<class 'tuple'>,)   是 tuple 子类
print(Point.__slots__)    # 输出：()   空 slots，没有实例字典
print(hasattr(p, "__dict__"))  # 输出：False   没有 __dict__

# 字段名访问的真相：property 装饰的描述符
print(type(Point.x))     # 输出：<class 'property'>   x 是 property
```

`p.x` 之所以能拿到第一个元素，是因为生成类时为每个字段装了一个 `property`，其 getter 就是 `tuple.__getitem__(self, 0)`。属性访问本质上是带名字的下标访问，所以和 `p[0]` 完全等价。

也正因仍是 tuple，namedtuple 实例可以做 dict key、可被 pickle、可与普通 tuple 互操作——这些能力是"继承自 tuple"白来的，不需要额外实现。

### 4.2 Counter：继承 dict 把值当整数累加

`Counter` 是 `dict` 的子类，它没有重新发明存储，而是**复用 dict 的哈希表**，只在语义层做"值是整数计数"的约定。

构造时 `Counter(iterable)` 做的事就是：

```
对 iterable 中每个元素 elem：
    self[elem] = self.get(elem, 0) + 1
```

但因为 Counter 重写了 `__missing__` 返回 0，实际上可以直接写 `self[elem] += 1`——访问缺失 key 时 `__missing__` 返回 0，加 1 后通过 `__setitem__` 存回。这就是为什么 `Counter` 访问不存在的 key 不抛 `KeyError` 而返回 0。

`most_common(n)` 的实现：当 n 较小（小于元素总数一半）时用 `heapq.nlargest`，只维护一个大小为 n 的堆，复杂度 O(N log n)；当 n 较大或未指定时退化为 `sorted` 全排序。

`elements()` 返回迭代器而非 list，按 key 重复 yield，计数 ≤0 的跳过——这样大数据量下不会一次性占用完整展开的内存。

`+`/`-`/`&`/`|` 运算符通过重写 `__add__`、`__sub__`、`__and__`、`__or__` 实现，语义在 4.2 节已列。注意 `+` 和 `-` 会丢弃非正计数，这是为了保持"计数器里只保留有意义（正数）的项"这一不变量。

### 4.3 defaultdict：缺 key 时调 default_factory

`defaultdict` 的核心机制是重写 `dict.__missing__`。普通 dict 在 `__getitem__` 找不到 key 时直接抛 `KeyError`；而 `defaultdict` 的 `__missing__` 做了如下处理：

```
def __missing__(self, key):
    if self.default_factory is None:
        raise KeyError(key)        # 工厂为 None 时退化为普通 dict 行为
    value = self.default_factory() # 调用工厂，如 list() 返回 []
    self[key] = value              # 存入字典（这就是"读即写"副作用来源）
    return value
```

几个要点：

- **`default_factory` 必须是无参可调用**：`list`、`int`、`set`、`dict` 这些内置类型调用时不传参返回空值，所以常用作工厂。如果工厂需要参数，得用 `functools.partial` 或 lambda 包一层。
- **副作用写入**：`__missing__` 把生成的默认值**存进了字典**，所以下次访问同一 key 不再触发工厂。这也是 `len(d)` 会因为读操作而增大的原因。
- **`default_factory=None` 时退化为普通 dict**：`__missing__` 直接抛 `KeyError`，与 dict 无异。
- **只影响 `__getitem__` 路径**：`d[k]`（即 `__getitem__`）会触发 `__missing__`，但 `d.get(k)`、`k in d` 不会——`get` 和 `__contains__` 不调用 `__missing__`。所以 `in` 判断不会创建默认值。

注意最后一个点：这也是为什么 `get` 和 `[]` 行为不一致——`d.get("missing")` 返回 `None` 且不写入，而 `d["missing"]` 会调用工厂并写入。

### 4.4 deque：分块双向结构两端 O(1)

CPython 的 `deque` 底层不是链表（链表节点散落内存、缓存不友好），也不是单一连续数组（首部插入要整体搬移），而是**分块数组**（block array）：一个双向链表，每个节点是一个固定大小的数组（64 个 PyObject 指针）。

```
结构示意：

   blocks:  [block0] <-> [block1] <-> [block2] <-> ...
              ^                                   ^
           leftidx                            rightidx
              |                                   |
           (左端元素)                         (右端元素)
```

- 每个 block 是 64 槽的数组，元素在 block 内连续存储。
- 整体是一个双向链表，block 之间用前后指针连接。

**为什么两端 O(1)**：

- `append`：当前最右 block 还有空槽就直接写入 `rightidx+1`；满了就申请一个新 block 挂到链表尾部。无论如何都是常数步。
- `appendleft`：对称地在最左 block 找空槽或新建 block 挂头部。
- `pop`/`popleft`：减少索引，若 block 空了就从链表摘除并释放。

对比 `list`：`list` 是单一连续数组，`append` 均摊 O(1)（偶尔 realloc 复制），但 `insert(0, x)` 要把所有元素后移一格，O(n)。`deque` 的分块结构让两端操作都不涉及大量元素搬移。

**为什么 `deque[i]` 随机访问是 O(n)**：要拿到第 i 个元素，得从某一端出发遍历若干个 block，定位到具体槽位，无法像 `list` 那样用"基地址 + 步长"一步算出地址。这就是 deque 不适合按下标访问的根本原因。

**`maxlen` 的实现**：当设定 `maxlen` 且 `append` 后长度超出，`deque` 会在同一操作里自动从另一端弹出一个元素。整个 append + 丢弃是一个原子步骤，长度恒等于 `maxlen`（一旦首次填满后）。

**`rotate` 的实现**：不是逐个 `appendleft`/`pop`，而是通过调整内部 block 的索引边界批量完成，避免 n 次单元素操作的开销。

### 4.5 OrderedDict：维护插入顺序的双向链表

Python 3.7+ 的普通 dict 已经维护插入顺序，其原理是在 dict 的哈希表之外，额外维护一个"插入顺序链表"（实际上是 entries 数组按插入顺序排列）。`OrderedDict` 在此基础上**额外维护一个显式的双向链表**，节点记录 key，从而支持 O(1) 的 `move_to_end` 和 `popitem(last=False)`——这是普通 dict 做不到的。

```
结构示意：

   哈希表（dict）           双向链表（按插入顺序）
   key -> value             head <-> A <-> B <-> C <-> tail
                              ^                  ^
                           最旧                最新
```

- **`move_to_end(key)`**：从哈希表 O(1) 找到节点，从链表中 O(1) 摘除，再 O(1) 接到 tail（或 head）。全程 O(1)。
- **`popitem(last=False)`**：摘除 head 节点，同时从哈希表删除对应 key，O(1)。
- **有序相等比较**：`OrderedDict.__eq__` 在比较双方都是 `OrderedDict` 时，不仅比较 key/value，还比较顺序（按键的迭代顺序逐一对比）。普通 dict 的 `__eq__` 无序，只要 key/value 全相等即返回 True。

普通 dict 虽然内部也有顺序，但它的顺序信息是"插入序"的副产品，没有暴露 `move_to_end` 这种 API——如果你想重排某个 key 到末尾，普通 dict 得先 `del d[k]` 再 `d[k] = v`，语义上不表达"移动"，且每次操作要先删后插。`OrderedDict` 的链表让"移动"成为一等操作。

### 4.6 ChainMap：持有多个 dict 引用按序查找

`ChainMap` 的实现极其简洁：它**不存任何数据**，只持有一个 `maps` 列表（各 dict 的引用）。几乎所有操作都是"按顺序遍历 maps，第一个命中即返回"。

```
结构示意：

   maps: [dict_A, dict_B, dict_C]

   查找 key=k：
       for m in maps:
           if k in m:
               return m[k]
       raise KeyError(k)
```

要点：

- **查找是 O(M) × O(1)**，M 是层数。层数通常很少（3~5 层），所以等同于 O(1)。
- **写入只作用于 `maps[0]`**：`__setitem__`、`__delitem__` 都直接操作第一个 dict。这一设计让 ChainMap 的"默认值层"永远不会被污染——只要默认层不在 `maps[0]` 位置。
- **原 dict 修改实时反映**：因为持有的是引用，外部对任一 dict 的增删改都会立刻在 ChainMap 中体现。这是它与 `update` 合并的根本区别。
- **`new_child(m)`**：返回 `ChainMap(m, *self.maps)`，原 ChainMap 不变，实现层级叠加的不可变式操作。
- **`parents`**：返回 `ChainMap(*self.maps[1:])`，去掉最前一层。
- **迭代与 `len`**：`keys()`、`values()`、`items()` 会去重（后出现的 key 被前面的遮蔽，只算第一次出现的），`len` 也按去重后的 key 数计算——所以 `len(cm)` 可能小于各层 size 之和。

```python
from collections import ChainMap
cm = ChainMap({"a": 1}, {"a": 2, "b": 3})
print(list(cm.keys()))   # 输出：['a', 'b']   第二个 a 被遮蔽，只算一次
print(len(cm))           # 输出：2
```

### 4.7 UserDict/UserList/UserString：基于 data 属性的代理

这三个基类的实现思路一致：用一个名为 `data` 的属性持有真正的内置容器实例，所有方法都**通过 `data` 的标准 Python 接口**去操作。这样你重写的 `__setitem__` 等方法会被所有路径一致调用。

以 `UserDict` 为例，其核心结构近似：

```
class UserDict(MutableMapping):
    def __init__(self, dict=None, /, **kwargs):
        self.data = {}
        if dict is not None:
            self.data.update(dict)
        self.data.update(kwargs)

    def __getitem__(self, key):
        return self.data[key]        # 走 Python 层，会触发 __missing__ 等

    def __setitem__(self, key, value):
        self.data[key] = value

    def __delitem__(self, key):
        del self.data[key]

    def __contains__(self, key):
        return key in self.data

    def update(self, other):         # update 是 Python 实现
        for k, v in other.items():
            self[k] = v             # 注意：走 self.__setitem__，会调用你的重写！
    ...
```

关键点：**`UserDict.update` 的实现里写的是 `self[k] = v`，会调用你子类重写的 `__setitem__`**。而直接继承 `dict` 时，`dict.update` 是 C 实现，直接操作底层哈希表，绕过你重写的 `__setitem__`。这就是两者在"方法一致性"上的根本差异。

`UserList` 同理：`self.data` 是一个 list，`append`、`extend`、`insert` 都是 Python 层实现。`UserString` 的 `self.data` 是一个 str，所有操作返回新的 `UserString` 子类实例以保持类型。

**继承体系**：`UserDict` 继承自 `collections.abc.MutableMapping`，`UserList` 继承自 `MutableSequence`，`UserString` 继承自 `Sequence`。它们都满足对应的抽象基类协议，所以可以直接传给任何期望该协议的函数。

---

## 5. 总结

**本文内容要点**

- `namedtuple(typename, fields)`：动态生成 tuple 子类，字段名通过 property 暴露为属性；不可变、省内存（无 `__dict__`、`__slots__=()`）、仍是 tuple 可做 key。适合轻量数据记录。
- `Counter(iterable)`：dict 子类，自动计数；`most_common(n)` 取 Top N、`elements()` 展开、`update`/`subtract` 累加递减、`+ - & |` 集合运算；访问缺失 key 返回 0。
- `defaultdict(default_factory)`：dict 子类，重写 `__missing__` 在缺 key 时调用工厂生成默认值并写入；`list`/`int`/`set` 工厂分别对应分组、累加、去重分组；注意"读即写"副作用。
- `deque(iterable, maxlen)`：分块双向结构，两端 `append`/`appendleft`/`pop`/`popleft` 均 O(1)；`rotate` 旋转、`maxlen` 自动限长；不适合按下标随机访问（O(n)）。
- `OrderedDict`：3.7+ dict 已有序，但 `move_to_end`、`popitem(last=False)`、有序相等比较仍是其独有能力；基于显式双向链表实现 O(1) 移动与弹出；LRU 缓存的经典实现。
- `ChainMap(*maps)`：持有多个 dict 引用，按序查找、不复制数据；写入仅作用于第一层；`new_child`/`parents` 叠加层级；适合配置层叠、只读合并。
- `UserDict`/`UserList`/`UserString`：自定义容器基类，`data` 属性代理内置类型，保证重写方法被所有路径一致调用；直接继承 `dict`/`list` 时 C 实现方法会绕过重写，这是两者核心区别。

**读完本文你应能掌握**

- 在"统计计数、Top N、词频"场景下，立即写出 `Counter(...).most_common(n)` 而非手写字典累加。
- 在"分组、归类、免 KeyError 累加"场景下，正确选用 `defaultdict(list/int/set)` 并解释其写入副作用。
- 在"队列、栈、滑动窗口、限长历史"场景下，选用 `deque` 并说明为何不用 `list`（两端 O(1) vs O(n)），知道 `deque[i]` 为 O(n) 的原因。
- 用 `namedtuple` 定义轻量记录类型，使用 `_make`/`_asdict`/`_replace`/`_fields`，并理解它"是 tuple 子类、省内存"的原理。
- 说出 `OrderedDict` 在 3.7+ 仍有价值的具体场景（`move_to_end`、`popitem(last=False)`、有序相等）并用它实现一个 LRU 缓存。
- 用 `ChainMap` 表达多层配置优先级，写出查找逻辑并解释"视图合并 vs update 合并"的差异。
- 区分 `UserDict` 与直接继承 `dict` 的行为差异（方法一致性），在需要自定义容器时做出正确选型。
- 能对每个工具说明其底层原理：namedtuple 的工厂+property、Counter 的 dict 继承与 `__missing__`、defaultdict 的 `__missing__` 与写入副作用、deque 的分块双向结构、OrderedDict 的双向链表、ChainMap 的引用链查找、UserDict 的 `data` 代理。