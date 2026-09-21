---
group:
  title: 【10】循环结构
  order: 10
order: 12
title: 字典集合推导式与生成器表达式
nav:
  title: Python基础
  order: 1
---

# 字典集合推导式与生成器表达式

## 1. 介绍

### 1.1 本篇讲什么

前两篇介绍了列表推导式的基本语法和进阶过滤/嵌套技巧。本篇聚焦于推导式家族中另外三位成员：**字典推导式**、**集合推导式**和**生成器表达式**。它们共享 `for ... in ...` 的核心语法，但各有独特的输出形态和适用场景。

```python
# 三种推导式的语法速览
list_comp   = [x * 2 for x in range(5)]        # 列表：[0, 2, 4, 6, 8]
dict_comp   = {x: x * 2 for x in range(5)}     # 字典：{0: 0, 1: 2, ...}
set_comp    = {x % 3 for x in range(10)}       # 集合：{0, 1, 2}
gen_expr    = (x * 2 for x in range(5))        # 生成器对象（惰性）
```

本篇的核心任务：深入字典推导式的分组、合并、多源构建等高级模式；掌握集合推导式在多源去重和差异分析中的威力；理解生成器表达式的惰性求值模型，以及它在大数据场景下的内存优势。

### 1.2 四者关系定位

```text
Python 推导式家族

  ├── 列表推导式 [x for x in seq]
  │   └── 立即求值 → 返回完整列表（内存中）
  │
  ├── 字典推导式 {k: v for x in seq}
  │   └── 立即求值 → 返回完整字典（内存中）
  │
  ├── 集合推导式 {x for x in seq}
  │   └── 立即求值 → 返回完整集合（内存中）
  │
  └── 生成器表达式 (x for x in seq)
      └── 惰性求值 → 返回生成器对象（常数内存）
```

前三者（列表、字典、集合推导式）都是「立即求值」——表达式执行完毕时，整个结果已经在内存中。生成器表达式是「惰性求值」——只返回一个生成器对象，元素在迭代时才逐个产生。

---

## 2. 核心内容

### 2.1 字典推导式高级模式

#### 2.1.1 分组统计——用推导式收尾

分组通常需要 `defaultdict` 或循环累积，但收尾时可以用字典推导式做格式化：

```python
from collections import defaultdict

employees = [
    {"name": "张三", "dept": "研发"},
    {"name": "李四", "dept": "市场"},
    {"name": "王五", "dept": "研发"},
    {"name": "赵六", "dept": "运营"},
    {"name": "钱七", "dept": "市场"},
]

# 分组累积
groups = defaultdict(list)
for emp in employees:
    groups[emp["dept"]].append(emp["name"])

# 字典推导式做汇总
summary = {dept: len(names) for dept, names in groups.items()}
print(summary)  # {'研发': 2, '市场': 2, '运营': 1}
```

**分步执行 vs 纯推导式**：分组需要累积（`defaultdict(list)`），这无法直接在推导式中完成，所以通常的做法是：用循环做累积，用推导式做格式化。

#### 2.1.2 多源数据合并为嵌套字典

当多个列表需要「按位置对齐合并」为一个嵌套字典时：

```python
ids = [1, 2, 3]
names = ["Alice", "Bob", "Charlie"]
roles = ["admin", "editor", "viewer"]

nested = {
    uid: {"name": name, "role": role}
    for uid, name, role in zip(ids, names, roles)
}
# {1: {'name': 'Alice', 'role': 'admin'},
#  2: {'name': 'Bob', 'role': 'editor'},
#  3: {'name': 'Charlie', 'role': 'viewer'}}
```

`zip` 负责对齐，推导式负责组装——两者协作，一行完成从多个平铺列表到嵌套字典的转换。

#### 2.1.3 条件键名或条件值类型

键和值都支持表达式，这意味着你可以根据条件动态决定键名和值的内容：

```python
data = [("a", 10), ("b", -5), ("c", 3), ("d", 0)]

tagged = {
    k if v > 0 else f"invalid_{k}": abs(v) if v >= 0 else f"负值({v})"
    for k, v in data
}
# {'a': 10, 'invalid_b': '负值(-5)', 'c': 3, 'invalid_d': 0}
```

这种写法在实际项目中用于数据清洗阶段——把原始数据中的异常值标记出来，同时保留能用的数据。

#### 2.1.4 词频统计——字典推导式 + set 配合

```python
words = ["apple", "banana", "apple", "cherry", "banana", "apple", "date"]

# 用 set(words) 拿到唯一词，再逐个计数
word_count = {w: words.count(w) for w in set(words)}
print(word_count)
# {'apple': 3, 'banana': 2, 'cherry': 1, 'date': 1}
```

**注意性能**：`words.count(w)` 对每个唯一词遍历一次原列表，总复杂度 O(n × m)，n 是原列表长度，m 是唯一词数量。对于大数据集，应改用 `collections.Counter`：

```python
from collections import Counter
word_count = dict(Counter(words))  # O(n)，优于上面的写法
```

推导式写法适合小数据集（几百条以内），大数据集用 `Counter`。

#### 2.1.5 字典合并与运算符配合

Python 3.5+ 的 `**` 解包运算符可以直接合并字典：

```python
defaults = {"host": "localhost", "port": 8080, "timeout": 30}
overrides = {"port": 9000, "timeout": 60, "debug": True}

merged = {**defaults, **overrides}
# {'host': 'localhost', 'port': 9000, 'timeout': 60, 'debug': True}
```

后面的键覆盖前面的同名字段。这与字典推导式配合使用的典型模式：

```python
# 只合并覆盖了默认值的字段
changed = {k: v for k, v in overrides.items() if v != defaults.get(k)}
print(changed)  # {'port': 9000, 'timeout': 60, 'debug': True}
```

### 2.2 集合推导式高级模式

集合推导式的外壳是 `{}`，但内容没有冒号——这是与字典推导式的核心区分。

#### 2.2.1 多源数据合并去重

```python
source_a = ["Python", "Java", "Go", "Rust"]
source_b = ["Java", "C++", "Python", "Swift"]
source_c = ["Go", "Kotlin", "Rust", "Dart"]

all_langs = {lang for src in [source_a, source_b, source_c] for lang in src}
print(sorted(all_langs))
# ['C++', 'Dart', 'Go', 'Java', 'Kotlin', 'Python', 'Rust', 'Swift']
```

嵌套 `for` 在集合推导式中同样适用——先展开所有源，再放入集合自动去重。

#### 2.2.2 利用集合运算做差异分析

集合推导式可以直接配合 `set` 的运算符做差集、交集：

```python
db_a = {"user1", "user2", "user3", "user4", "user5"}
db_b = {"user3", "user4", "user6", "user7", "user8"}

only_a = db_a - db_b                 # 只在 A 中
only_b = db_b - db_a                 # 只在 B 中
common = db_a & db_b                 # 公共
all_users = db_a | db_b              # 全部

print(f"A独有: {only_a}")  # {'user1', 'user2', 'user5'}
print(f"B独有: {only_b}")  # {'user6', 'user7', 'user8'}
print(f"交集: {common}")   # {'user3', 'user4'}
```

如果想在推导式的过滤条件中使用这些集合运算，也可以用 `if x not in other_set` 的写法：

```python
user_actions = [("user1", "login"), ("user2", "view"), ("user5", "edit")]
admin_set = {"user1", "user3"}

# 非管理员的动作
non_admin = [
    (u, a) for u, a in user_actions
    if u not in admin_set
]
```

#### 2.2.3 从嵌套结构批量提取唯一值

这是集合推导式 + 嵌套 for 的最常见组合：

```python
articles = [
    {"title": "Python入门", "tags": ["python", "基础"]},
    {"title": "Django实战", "tags": ["python", "web", "django"]},
    {"title": "机器学习", "tags": ["python", "AI"]},
]

all_tags = {tag for a in articles for tag in a["tags"]}
print(all_tags)  # {'web', 'python', '基础', 'AI', 'django'}
```

两层 for 在集合推导式中同样遵循「外→内」的书写顺序：先遍历 `articles`，再遍历每个 article 的 `tags`。

#### 2.2.4 字符集分析

集合推导式天生适合做「收集所有出现过的某类字符」这类分析：

```python
import string

passwords = ["P@ss123", "admin!", "S3cur3#", "Hello", "123456"]

# 收集所有特殊字符
special = {c for p in passwords for c in p if c in string.punctuation}
print(special)  # {'@', '!', '#'}
```

#### 2.2.5 重复数据检测

利用集合推导式 + `seen` 辅助集合的技巧检测重复：

```python
ids = [101, 102, 101, 103, 102, 104, 105, 103]
seen = set()
duplicates = {x for x in ids if x in seen or seen.add(x)}
print(duplicates)  # {101, 102, 103}
```

**技巧解析**：`or` 短路求值——当 `x in seen` 为 `True` 时（即遇到重复），`or` 右边不执行，元素被加入结果集；当 `x in seen` 为 `False` 时，执行 `seen.add(x)` 把新元素记入 `seen`，`add()` 返回 `None`（假值），整体条件为假，元素不加入结果。

**注意**：这个技巧虽然简洁，但可读性一般。在生产代码中，更推荐写成更直白的形式：

```python
from collections import Counter
duplicates = {x for x, count in Counter(ids).items() if count > 1}
```

### 2.3 生成器表达式基础

#### 2.3.1 语法：用圆括号替代方括号

生成器表达式的语法与列表推导式几乎一样，唯一的区别是**用圆括号**：

```python
# 列表推导式
squares_list = [x ** 2 for x in range(5)]      # list: [0, 1, 4, 9, 16]

# 生成器表达式
squares_gen = (x ** 2 for x in range(5))        # generator 对象
print(type(squares_gen))  # <class 'generator'>
```

但外表只是表象，本质区别在于**求值时机**：

```python
# 列表推导式：代码执行到这一行，5 个值已经全部算好存在内存中
nums = [x for x in range(5)]

# 生成器表达式：代码执行到这一行，生成器对象创建了，但 5 个值一个还没算
gen = (x for x in range(5))
print(next(gen))  # 0  ← 这时候才算第一个
print(next(gen))  # 1  ← 这时候才算第二个
```

#### 2.3.2 惰性求值的含义和好处

「惰性求值」的意思是：**声明时不计算，消费时才产生**。这带来了两个核心优势：

1. **内存常数级**：生成器对象本身只占约 200 bytes，不管数据量是一百条还是一千万条。
2. **可以表示无穷序列**：生成器表达式配合 `itertools.count()` 可以处理「无限流」。

内存对比验证：

```python
import sys

big_list = [i for i in range(1_000_000)]
list_size = sys.getsizeof(big_list)      # ~8.4 MB

big_gen = (i for i in range(1_000_000))
gen_size = sys.getsizeof(big_gen)        # ~200 bytes

print(f"内存比: {list_size / gen_size:.0f}x")  # ~40,000x
```

**代价**：生成器只能消费一次。消费完后它就空了，不能回头。

```python
gen = (x for x in range(3))
print(list(gen))  # [0, 1, 2]
print(list(gen))  # [] —— 第二次是空的
```

#### 2.3.3 作为函数唯一参数时省略外层括号

当生成器表达式作为**函数的唯一参数**时，可以省略外层的圆括号：

```python
# 完整写法
total = sum((x ** 2 for x in range(1, 6)))

# 简写（推荐）
total = sum(x ** 2 for x in range(1, 6))
```

这适用于 `sum()`、`max()`、`min()`、`any()`、`all()` 等所有接收可迭代对象的函数：

```python
max_len = max(len(w) for w in words)     # 最长单词的长度
has_big = any(n > 100 for n in nums)     # 是否存在 >100 的数
all_positive = all(n > 0 for n in nums)  # 是否全部为正
```

#### 2.3.4 消费生成器的三种方式

```python
gen = (f"item-{i}" for i in range(3))

# 方式 1：next() —— 逐个取
print(next(gen))  # item-0
print(next(gen))  # item-1

# 方式 2：for 循环 —— 逐个迭代
for item in gen:
    print(item)   # item-2  （从上次停止的地方继续）

# 方式 3：list() / tuple() / set() —— 一次性全部消费
gen = (i * 10 for i in range(3))
print(list(gen))  # [0, 10, 20]
```

### 2.4 生成器 vs 列表推导式——场景选择

#### 2.4.1 用列表推导式：需要多次遍历

如果结果需要被遍历多次、或需要随机访问（索引、切片），用列表推导式：

```python
scores = [s ** 2 for s in range(10)]
print(scores[3])      # 索引访问
print(scores[:5])     # 切片
print(len(scores))    # 取长度
for _ in range(3):    # 多次遍历
    print(sum(scores))
```

#### 2.4.2 用生成器表达式：数据量巨大

数据量大到不适合全部载入内存时，生成器表达式是唯一的合理选择：

```python
# 不推荐：一次性创建 500 万个平方数的列表（~40 MB）
total = sum([x ** 2 for x in range(5_000_000)])

# 推荐：生成器逐个产生，内存占用常数级
total = sum(x ** 2 for x in range(5_000_000))
```

#### 2.4.3 用生成器表达式：作为管道中间层

当数据处理是一个多步流程时，每一步都可以用生成器表达式——数据像水流一样逐级通过，每一步都惰性：

```python
data = range(100)

# 管道：过滤 → 变换 → 再过滤 → 再变换 → 收集
step1 = (x for x in data if x % 2 == 0)       # 取偶数
step2 = (x ** 2 for x in step1)                # 平方
step3 = (f"#{v}" for v in step2 if v > 500)    # 格式化 + 过滤
result = list(step3)  # ← 到这一步才真正开始计算
```

**关键洞察**：`step1`、`step2`、`step3` 三个变量的赋值没有触发任何计算——它们只是声明了「打算怎么处理数据」。直到 `list(step3)` 调用，整条管道才开始运转。每个元素一气呵成地通过所有步骤，然后下一个元素开始。

#### 2.4.4 场景选择速查表

| 场景 | 用生成器表达式 | 用列表推导式 |
|------|-------------|------------|
| 数据量大（>10万条） | ✅ | ❌ 内存压力 |
| 需要多次遍历 | ❌ 只能消费一次 | ✅ |
| 需要 len/索引/切片 | ❌ 不支持 | ✅ |
| 传给 sum/max/min 等 | ✅ 推荐 | ❌ 浪费内存 |
| 作为管道中间层 | ✅ 完美 | ❌ 提前物化 |
| 调试时需要看中间值 | ❌ 未消费时看不到 | ✅ 可以 print |
| 数据量小（<1000条） | ⚠️ 开销略大 | ✅ 更直观 |

### 2.5 生成器管道——数据处理流水线

#### 2.5.1 管道模式的核心思想

把数据处理拆分为多个小步骤，每步是一个生成器表达式。数据从源头流入，逐级经过每道工序，最后在终点（`list()` 或 `sum()` 等）被消费：

```text
raw_data → (清洗) → (解析) → (过滤) → (变换) → result
   ↑        gen1       gen2      gen3      gen4       ↑
  惰性声明                                        最终消费
```

示例——日志行处理：

```python
raw_lines = [
    "INFO user=admin action=login",
    "",
    "   ERROR code=500  ",
    None,
    "INFO user=admin action=upload",
]

# 管道中的每一步都是生成器表达式
cleaned = (line.strip() for line in raw_lines if line is not None)
non_empty = (line for line in cleaned if line)
errors = (line for line in non_empty if line.startswith("ERROR"))

# 最终消费
for error in errors:
    print(error)  # "ERROR code=500"
```

**管道模式的好处**：
- 每步职责单一，易于理解和测试
- 全管道惰性，内存可控
- 可以在不修改上游步骤的情况下插入新步骤

#### 2.5.2 生成器管道 vs 一次性 for 循环

对比同一需求两种写法：

```python
# 写法 1：一次性 for 循环（所有逻辑混在一起）
result = []
for line in raw_lines:
    if line is None:
        continue
    line = line.strip()
    if not line:
        continue
    if not line.startswith("ERROR"):
        continue
    result.append(line)

# 写法 2：生成器管道（每步独立）
cleaned = (l.strip() for l in raw_lines if l)
errors = (l for l in cleaned if l.startswith("ERROR"))
result = list(errors)
```

两种写法的结果相同。管道写法的优势在于：每个步骤可以被独立复用、修改步骤顺序或插新步骤不需要重写整个循环。

#### 2.5.3 管道 + 推导式收尾

管道中间用生成器表达式（惰性），最后用列表/字典/集合推导式（立即求值）收尾——这是最实用的模式：

```python
from itertools import groupby

data = [(1, "a"), (2, "b"), (1, "c"), (3, "d"), (2, "e")]

# 管道：排序 → 分组
sorted_data = sorted(data, key=lambda x: x[0])
groups = groupby(sorted_data, key=lambda x: x[0])

# 字典推导式收尾
result = {key: [v for _, v in group] for key, group in groups}
print(result)  # {1: ['a', 'c'], 2: ['b', 'e'], 3: ['d']}
```

### 2.6 推导式家族的逐个对比

| 特性 | 列表 `[]` | 字典 `{k:v}` | 集合 `{x}` | 生成器 `()` |
|------|----------|------------|----------|-----------|
| 输出类型 | `list` | `dict` | `set` | `generator` |
| 求值时机 | 立即 | 立即 | 立即 | 惰性 |
| 内存占用 | 元素数 × 单元素大小 | 键值对数 × 条目大小 | 唯一元素数 × 单元素大小 | 常数 (~200 bytes) |
| 可变性 | 可变 | 可变 | 可变 | 不可变（只能迭代） |
| 支持索引 | ✅ | ✅（键索引） | ❌（无序） | ❌ |
| 支持 len | ✅ | ✅ | ✅ | ❌ |
| 多次遍历 | ✅ | ✅ | ✅ | ❌（一次性） |
| 去重 | ❌ | 键自动去重 | ✅ | ❌ |
| 适合场景 | 通用 | 需要键值映射 | 需唯一集合 | 大数据/管道 |

---

## 3. 最佳实践

### 3.1 推荐 vs 不推荐写法对比

| 场景 | 不推荐 | 推荐 | 原因 |
|------|--------|------|------|
| 多源去重 | 多个列表 extend + 最后 set | 集合推导式 `{x for src in sources for x in src}` | 一行完成 |
| 构建索引字典 | `for obj in seq: d[obj.id]=obj` | `{obj.id: obj for obj in seq}` | 一行表达完整意图 |
| 大数据聚合 | `sum([f(x) for x in seq])` | `sum(f(x) for x in seq)` | 少一个中间列表 |
| 分组 | 纯字典推导式（做不到） | `defaultdict` 累积 + 推导式格式化 | 分组需要累积状态 |
| 大数据词频 | `{w: words.count(w) for w in set(words)}` | `Counter(words)` | O(n) vs O(n²) |
| 生成器遍历 | `list((x for x in seq))` | `[x for x in seq]` | 直接用列表推导式，少一层转换 |

#### 3.1.1 典型对比

**构建 ID → 姓名 映射**

不推荐——四行 for 循环：

```python
id_map = {}
for user in users:
    id_map[user["id"]] = user["name"]
```

推荐——字典推导式一行：

```python
id_map = {u["id"]: u["name"] for u in users}
```

**sum 聚合时避免中间列表**

不推荐——先创建完整的临时列表：

```python
total = sum([x ** 2 for x in range(1_000_000)])  # ~8 MB 临时内存
```

推荐——生成器表达式直接传给 sum：

```python
total = sum(x ** 2 for x in range(1_000_000))    # 常数内存
```

### 3.2 常见错误模式及修正

**错误一：试图对生成器做 len/索引**

```python
gen = (x for x in range(10))
print(len(gen))     # TypeError: object of type 'generator' has no len()
print(gen[3])       # TypeError: 'generator' object is not subscriptable
```

修正——先转列表（如果数据量允许）或改用列表推导式：

```python
gen_list = list(gen)
print(len(gen_list))  # 10
```

**错误二：字典推导式少写了冒号**

```python
# 错误：没有 k: v 的冒号，变成了集合推导式
d = {k, v for k, v in zip(keys, values)}  # 合成一个集合（含元组）
```

修正——字典推导式必须有 `k: v` 结构：

```python
d = {k: v for k, v in zip(keys, values)}  # 正确
```

**错误三：生成器作为参数时多加了括号**

```python
# 不推荐：多了一对括号
total = sum((x ** 2 for x in range(10)))  # 能运行，但括号多余
```

修正——生成器表达式是唯一参数时可以省略外层括号：

```python
total = sum(x ** 2 for x in range(10))    # 更简洁
```

**注意**：如果 `sum()` 有多个参数，则不能省略括号：

```python
total = sum((x ** 2 for x in range(10)), 100)  # 必须有括号，100 是初始值
```

**错误四：对大数据集用词频推导式**

```python
# 性能陷阱：words.count(w) 对每个唯一词遍历整个列表
word_count = {w: words.count(w) for w in set(words)}  # O(n × m)
```

修正——用 `Counter`：

```python
from collections import Counter
word_count = dict(Counter(words))  # O(n)
```

### 3.3 推导式选择流程

用一张决策流程图表达选哪种推导式：

```text
你需要生成什么？
  │
  ├── 列表
  │   │
  │   ├── 数据量大 → 生成器表达式 (...)
  │   └── 数据量小 → 列表推导式 [...]
  │
  ├── 键值映射 → 字典推导式 {k: v ...}
  │
  ├── 唯一集合 → 集合推导式 {x ...}
  │
  └── 传给 sum/max/min/any/all → 生成器表达式 (...)（省略外层括号）
```

一个容易忽略的原则：**如果你只需要把结果传给 sum/max 等聚合函数，根本不需要中间的列表或集合——直接用生成器表达式**。

---

## 4. 原理

### 4.1 生成器表达式的内部机制

生成器表达式本质上是**创建了一个生成器函数的实例**。当你写：

```python
gen = (x * 2 for x in range(3))
```

Python 内部等价于做了一个生成器函数调用：

```python
def _gen():
    for x in range(3):
        yield x * 2

gen = _gen()
```

**每次迭代发生了什么**：

```text
next(gen) 调用：
  1. 生成器恢复执行（或首次启动）
  2. 从 range(3) 取 x=0，计算 0*2，yield 0
  3. 生成器暂停，保留 x 的值和程序计数器位置

next(gen) 再次调用：
  1. 从上次暂停处恢复
  2. 从 range(3) 取 x=1，计算 1*2，yield 2
  3. 生成器再次暂停

...
直到 range(3) 耗尽，生成器抛出 StopIteration
```

这就是为什么生成器只能消费一次——它内部的状态（`x` 的当前值、range 迭代器的位置）在消费过程中被消耗了，无法回退。

### 4.2 为什么管道模式内存高效

生成器管道中的每个元素是**一个接一个**地流经所有步骤的，不是一批一批：

```text
管道：data → step1 → step2 → step3 → result

  data[0] → step1[0] → step2[0] → step3[0] → result.append(...)
  data[1] → step1[1] → step2[1] → step3[1] → result.append(...)
  data[2] → step1[2] → step2[2] → step3[2] → result.append(...)
```

这是关键区别——不是「先算完整个 step1，再算 step2」，而是**一口气把一个元素推到管道的尽头，再处理下一个**。内存中同一时刻只有一个元素在流动。

### 4.3 字典推导式与集合推导式的哈希依赖

字典和集合都基于哈希表。它们的推导式在构建过程中同样依赖 `__hash__` 方法：

- **字典推导式**：键必须是可哈希的（`hashable`），值没有限制。
- **集合推导式**：所有元素都必须是可哈希的。

```python
# 错误：列表不可哈希
{["a", "b"]: 1 for _ in range(3)}   # TypeError: unhashable type: 'list'
{[1, 2, 3] for _ in range(3)}       # TypeError: unhashable type: 'list'

# 正确：元组可哈希
{("a", "b"): 1 for _ in range(3)}
{(1, 2, 3) for _ in range(3)}
```

---

## 5. 总结

本文围绕字典推导式、集合推导式和生成器表达式，主要介绍了以下内容：

- 字典推导式 `{k: v for ...}` 用于构建索引映射、过滤变换字典、键值互换、条件键名
- 分组统计通常用 `defaultdict` 累积 + 字典推导式格式化收尾，纯推导式无法完成需要状态累积的分组
- 集合推导式 `{x for ...}` 用于多源去重、嵌套结构唯一值提取、字符集分析、重复检测
- 利用 `seen.add(x)` 的短路技巧可以在集合推导式中检测重复，但生产环境推荐 `Counter`
- 生成器表达式 `(...)` 是**惰性求值**的——声明时不计算，消费时才逐个产生，内存常数级
- 生成器只能消费一次，不支持 len/索引/切片/多次遍历
- 传给 `sum()`/`max()`/`min()`/`any()`/`all()` 时，省略生成器表达式的外层括号
- 生成器管道：每一步是一个生成器表达式，数据逐元素流经整条管道，直到终点才触发计算
- 管道 + 推导式收尾是最实用的组合——中间用生成器（惰性、省内存），最后用推导式（物化为需要的数据结构）
- 选择推导式类型：看输出形态（列表/字典/集合）和内存约束（大数据→生成器）