---
group:
  title: 【10】循环结构
  order: 10
order: 11
title: 推导式进阶：过滤、条件与嵌套
nav:
  title: Python基础
  order: 1
---

# 推导式进阶：过滤、条件与嵌套

## 1. 介绍

### 1.1 本篇讲什么

列表推导式远不止 `[x for x in seq]`。在实际开发中，你会频繁遇到这些需求：多个条件同时过滤、根据条件分支输出不同的值、展平多层嵌套数据、构建字典而非列表、对元素去重。这些都属于推导式的「进阶」用法。

```python
# 基础：你已经会写的
evens = [x for x in nums if x % 2 == 0]

# 进阶：本篇要掌握的
# 多条件过滤 + 分支变换 + 嵌套展平
result = [
    "优秀" if score >= 90 else "良好" if score >= 80 else "及格"
    for student in students
    for score in [student["score"]]
    if student["active"] and score is not None
]
```

本篇聚焦推导式的四个进阶维度：**多条件过滤策略**、**条件分支与变换**、**嵌套结构处理**、以及 **字典推导式和集合推导式**。

### 1.2 进阶知识在推导式体系中的位置

```text
推导式体系

  ├── 列表推导式 ── [x for x in seq]
  │   ├── 基础：简单映射与过滤            ← 入门
  │   ├── 进阶：多条件过滤、分支变换        ← 本篇
  │   └── 嵌套：二维展平、矩阵操作          ← 本篇
  │
  ├── 字典推导式 ── {k: v for ...}        ← 本篇
  │   ├── 从列表构建字典
  │   ├── 字典的过滤与变换
  │   └── 键值互换
  │
  ├── 集合推导式 ── {x for x in seq}      ← 本篇
  │   ├── 去重提取
  │   └── 集合运算
  │
  └── 生成器表达式 ── (x for x in seq)
      └── 惰性求值、内存友好
```

---

## 2. 核心内容

### 2.1 多条件过滤策略

列表推导式支持多种方式组合过滤条件，每种方式有不同的适用场景。

#### 2.1.1 多个 if 子句（链式过滤）

推导式中可以写多个 `if` 子句，每个子句依次过滤——等价于用 `and` 连接，但分层更清晰：

```python
nums = list(range(1, 31))

# 写法 1：多个 if 子句
result = [n for n in nums if n % 2 == 0 if n % 3 == 0 if n > 10]
print(result)  # [12, 18, 24, 30]

# 写法 2：等价于 and 连接
result2 = [n for n in nums if n % 2 == 0 and n % 3 == 0 and n > 10]
print(result2)  # [12, 18, 24, 30]
```

**什么时候用多个 if 而不是 and**：当过滤条件在语义上分层时（如"先过滤类型，再过滤范围，最后过滤业务规则"），多 `if` 子句能清晰表达过滤的层层递进：

```python
records = [...]  # 混合类型的数据

# 层层过滤：类型 → 状态 → 数值
valid = [
    r for r in records
    if isinstance(r, dict)          # 第一层：类型检查
    if r.get("active")              # 第二层：状态检查
    if r.get("score", 0) >= 60      # 第三层：数值检查
]
```

每个 `if` 在 `for` 后的执行流程：

```text
遍历每个元素：
  n=12: if n%2==0 (True) → if n%3==0 (True) → if n>10 (True) → append
  n=15: if n%2==0 (False) → 跳过（后续 if 不判断）
  n=6:  if n%2==0 (True) → if n%3==0 (True) → if n>10 (False) → 跳过
```

前面的 `if` 不满足时，后面的 `if` 不会执行——这是短路行为。

#### 2.1.2 复杂布尔表达式组合

当过滤条件之间有逻辑关系（不只是简单的 and），用布尔表达式：

```python
words = ["apple", "banana", "AI", "cat", "elephant", "go", "house"]

# 长度 > 3 且不以元音结尾
vowels = "aeiou"
filtered = [
    w for w in words
    if len(w) > 3 and w[-1].lower() not in vowels
]
print(filtered)  # ['elephant']
```

**常见组合模式**：

| 模式 | 写法示例 | 适用场景 |
|------|---------|---------|
| 包含检查 | `if "/api/" in url and "/admin/" not in url` | URL 路由过滤 |
| 类型检查 | `if isinstance(item, str) and item` | 混合类型列表清洗 |
| 后缀/前缀 | `if f.endswith(".py") and not f.startswith("test_")` | 文件过滤 |
| 值域范围 | `if 0 <= score <= 100` | 数据校验 |
| 正则匹配 | `if re.match(pattern, s)` | 模式匹配过滤 |

#### 2.1.3 利用 Python 真值特性做简洁过滤

Python 中 `None`、空字符串 `""`、`0`、空列表 `[]` 等都是假值（falsy），可以直接用作过滤条件：

```python
data = ["hello", "", "world", None, "python", 0, "code"]

# 简洁写法：利用真值特性
cleaned = [item for item in data if item]
print(cleaned)  # ['hello', 'world', 'python', 'code']
```

**注意 `0` 的陷阱**：`0` 也是假值，如果 `0` 是合法数据（如成绩为 0 分），需要显式区分：

```python
# 危险：0 也会被过滤
scores = [85, 0, 92, 0, 78]
filtered = [s for s in scores if s]  # [85, 92, 78] —— 丢失了 0！

# 正确：显式判断
filtered = [s for s in scores if s is not None]  # 保留 0
```

### 2.2 条件分支与变换进阶

#### 2.2.1 多层三元表达式的缩进技巧

当 `if-else` 超过两层时，用换行和缩进保持可读性：

```python
scores = [92, 78, 65, 88, 55, 95]

# 好：带缩进的多层三元
grades = [
    "优秀" if s >= 90 else
    "良好" if s >= 80 else
    "及格" if s >= 60 else
    "不及格"
    for s in scores
]
print(grades)
# ['优秀', '及格', '及格', '良好', '不及格', '优秀']
```

**什么时候该把分支逻辑抽成函数**：分支超过 3 层，或分支内有复杂计算时，单独定义函数更清晰：

```python
def classify_age(age):
    if age < 18:
        return "未成年"
    elif age < 35:
        return "青年"
    elif age < 60:
        return "中年"
    else:
        return "老年"

labels = [classify_age(a) for a in ages]
```

这样做的好处：函数可以单独测试、可以在多处复用、推导式这一行保持简洁。

#### 2.2.2 先过滤再变换：两步分离

将「筛选数据」和「转换数据」拆成两步——用嵌套推导式或在推导式的不同位置处理：

```python
records = [
    ("张三", 92),
    ("李四", -1),     # 无效
    ("王五", 78),
    (None, 85),      # 无效
    ("赵六", 88),
]

# 一步完成：过滤 + 分级变换
valid = [
    (name, score, "优秀" if score >= 90 else "良好" if score >= 80 else "及格")
    for name, score in records
    if name is not None and 0 <= score <= 100
]
# [('张三', 92, '优秀'), ('王五', 78, '及格'), ('赵六', 88, '良好')]
```

**执行顺序**：`for` → `if`（过滤）→ 表达式（变换）。即先确定哪些元素进入结果，再决定每个元素的输出形态。

#### 2.2.3 不同分支输出不同格式

三元表达式的一个强大用法是根据条件输出完全不同格式的数据：

```python
transactions = [
    ("收入", 5000),
    ("支出", 200),
    ("转账", 1000),
    ("收入", 3000),
]

processed = [
    f"+¥{amount}" if t == "收入" else
    f"-¥{amount}" if t == "支出" else
    f"→¥{amount}({t})"
    for t, amount in transactions
]
print(processed)
# ['+¥5000', '-¥200', '→¥1000(转账)', '+¥3000']
```

### 2.3 嵌套推导式进阶

#### 2.3.1 二维展平 + 多层过滤的组合

在实际开发中，展平和过滤经常同时出现：

```python
matrix = [
    [15, -3, 28, 0],
    [-7, 42, 11, -19],
    [33, -5, 0, -22],
    [8, -14, 50, -1],
]

# 展平所有正偶数
result = [v for row in matrix for v in row if v > 0 and v % 2 == 0]
print(result)  # [28, 42, 8, 50]
```

**过滤可以分别放在外层或内层**：

```python
data = [[1, -2, 3], [], [-4, 5], [], [6, -7, 8]]

# 外层过滤：跳过空行（if row）
result1 = [v for row in data if row for v in row]
# [1, -2, 3, -4, 5, 6, -7, 8]

# 内层过滤：只保留正数
result2 = [v for row in data if row for v in row if v > 0]
# [1, 3, 5, 6, 8]
```

外层 `if` 和外层 `for` 在一起，内层 `if` 和内层 `for` 在一起——这个对应关系是理解嵌套推导式的关键。

#### 2.3.2 用嵌套推导式做矩阵操作

**矩阵转置**：内层推导式遍历行，外层构建列：

```python
m = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]

transposed = [[row[i] for row in m] for i in range(len(m[0]))]
print(transposed)
# [[1, 4, 7], [2, 5, 8], [3, 6, 9]]
```

**棋盘模式**：用条件表达式 + 嵌套推导式一行生成：

```python
board = [
    ["●" if (i + j) % 2 == 0 else "○" for j in range(8)]
    for i in range(8)
]
# 输出：
# ● ○ ● ○ ● ○ ● ○
# ○ ● ○ ● ○ ● ○ ●
# ...
```

**三维展平**：每增加一个维度，多加一层 `for`：

```python
cube = [[[1, 2], [3, 4]], [[5, 6], [7, 8]], [[9, 10], [11, 12]]]

flat = [v for layer in cube for row in layer for v in row]
print(flat)  # [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
```

**理解技巧**：将推导式中的 `for` 子句按从左到右的顺序「翻译」为从外到内的嵌套 for 循环。`for layer` 是外层，`for row` 是中层，`for v` 是内层。

#### 2.3.3 推导式中的笛卡尔积过滤

往往我们需要的不是完整的笛卡尔积，而是排除了某些组合后的结果：

```python
products = ["A", "B", "C"]
regions = ["华北", "华东", "华南"]

# 完整笛卡尔积是 3×3 = 9 种组合
# 排除 "A" 在 "华南" 的组合
valid = [
    f"{p}-{r}"
    for p in products
    for r in regions
    if not (p == "A" and r == "华南")
]
print(valid)
# ['A-华北', 'A-华东', 'B-华北', 'B-华东', 'B-华南',
#  'C-华北', 'C-华东', 'C-华南']
```

### 2.4 字典推导式

字典推导式的语法是 `{key_expr: value_expr for var in iterable}`，可以附带 `if` 过滤条件。

#### 2.4.1 从两个列表构建字典

`zip` + 字典推导式是最快的方式：

```python
keys = ["name", "age", "city"]
values = ["张三", 25, "杭州"]
d = {k: v for k, v in zip(keys, values)}
print(d)  # {'name': '张三', 'age': 25, 'city': '杭州'}
```

**`dict(zip(keys, values))` 的等价写法就是 `{k: v for k, v in zip(keys, values)}`**。如果需要对键或值做变换，推导式更好：

```python
# 键做大写变换
d = {k.upper(): v for k, v in zip(keys, values)}
print(d)  # {'NAME': '张三', 'AGE': 25, 'CITY': '杭州'}
```

#### 2.4.2 对已有字典做过滤和变换

这是字典推导式最实用的场景——拿出一个已有字典，过滤掉不符合条件的键值对，同时对值做变换：

```python
scores = {"张三": 85, "李四": 92, "王五": 78, "赵六": 88, "钱七": 95}

# 只保留 >= 80 的，分数上调 5%
adjusted = {
    name: round(score * 1.05)
    for name, score in scores.items()
    if score >= 80
}
print(adjusted)
# {'张三': 89, '李四': 97, '赵六': 92, '钱七': 100}
```

**条件可以分别作用于键、值、或同时**：

```python
# 过滤键：保留名字以"赵"开头的
{zhao: {k: v for k, v in d.items() if k.startswith("赵")}}

# 过滤值：保留分数 > 80 的
{k: v for k, v in d.items() if v > 80}

# 同时过滤键和值
{k: v for k, v in d.items() if len(k) == 2 and v > 80}
```

#### 2.4.3 键值互换

当值唯一时，字典推导式可以一键互换键和值：

```python
code_to_name = {"CN": "中国", "US": "美国", "JP": "日本", "KR": "韩国"}
name_to_code = {v: k for k, v in code_to_name.items()}
print(name_to_code)  # {'中国': 'CN', '美国': 'US', '日本': 'JP', '韩国': 'KR'}
```

**注意**：如果有重复的值，后面的会覆盖前面的。此时应当考虑用 `defaultdict(list)` 而不是字典推导式。

#### 2.4.4 从对象列表构建索引字典

这是一个非常高频的模式——有一组包含唯一 ID 的对象，需要构建 ID → 对象的快速查找映射：

```python
users = [
    {"id": 101, "name": "Alice", "dept": "研发"},
    {"id": 102, "name": "Bob", "dept": "市场"},
    {"id": 103, "name": "Charlie", "dept": "研发"},
]

id_map = {u["id"]: u["name"] for u in users}
print(id_map)  # {101: 'Alice', 102: 'Bob', 103: 'Charlie'}
```

### 2.5 集合推导式

集合推导式的语法是 `{expr for var in iterable}`——与字典推导式不同，没有冒号。外表和字典推导式一样用花括号，但内容是单个表达式而非键值对。

#### 2.5.1 去重提取

集合推导式最常见的用途：从含重复元素的序列中提取唯一值：

```python
data = [1, 2, 2, 3, 3, 3, 4, 5, 5]
unique = {x for x in data}
print(sorted(unique))  # [1, 2, 3, 4, 5]
```

也可以对变换后的结果去重：

```python
text = "hello world python"
unique_chars = {c for c in text if c != " "}
print(sorted(unique_chars))
# ['d', 'e', 'h', 'l', 'n', 'o', 'p', 'r', 't', 'w', 'y']
```

#### 2.5.2 从嵌套结构中提取唯一值

用嵌套 for 的集合推导式从多维数据中提取唯一值：

```python
records = [
    ("张三", "Python", "Django"),
    ("李四", "Java", "Spring"),
    ("王五", "Python", "Flask"),
    ("赵六", "Go", "Django"),
]

# 所有编程语言（去重）
languages = {lang for _, lang, _ in records}
print(languages)  # {'Python', 'Java', 'Go'}
```

更常见的场景——从文章列表收集所有标签：

```python
articles = [
    {"title": "Python入门", "tags": ["python", "基础"]},
    {"title": "Django实战", "tags": ["python", "web", "django"]},
    {"title": "机器学习", "tags": ["python", "AI"]},
]

all_tags = {tag for a in articles for tag in a["tags"]}
print(all_tags)  # {'python', '基础', 'web', 'django', 'AI'}
```

#### 2.5.3 集合推导式做集合运算

集合推导式可以直接实现差集、交集等运算，无需显式使用集合方法：

```python
a = [1, 2, 3, 4, 5, 6]
b = [4, 5, 6, 7, 8, 9]

# 差集：a 中独有的
only_in_a = {x for x in a if x not in b}
print(only_in_a)  # {1, 2, 3}

# 交集
common = {x for x in a if x in b}
print(common)  # {4, 5, 6}
```

### 2.6 推导式类型速查

| 推导式类型 | 语法 | 输出类型 | 典型用途 |
|-----------|------|---------|---------|
| 列表推导式 | `[expr for x in seq]` | `list` | 映射、过滤、展平 |
| 字典推导式 | `{k: v for x in seq}` | `dict` | 构建索引、键值变换 |
| 集合推导式 | `{expr for x in seq}` | `set` | 去重、唯一值提取 |
| 生成器表达式 | `(expr for x in seq)` | `generator` | 惰性求值、大数据流 |

---

## 3. 最佳实践

### 3.1 推荐 vs 不推荐写法对比

| 场景 | 不推荐 | 推荐 | 原因 |
|------|--------|------|------|
| 多条件过滤 | `if a and b and c`（一长串） | 多 `if` 子句分层写 | 分层清晰地表达层层过滤 |
| 复杂分支变换 | 推导式内嵌 4 层三元 | 抽成函数再调用 | 函数可测试、可复用 |
| 列表去重 | `list(set(seq))`（无序） | `sorted({x for x in seq})` | 集合推导式 + sorted 可控序 |
| 构建索引字典 | for 循环 + 逐条 `d[id] = obj` | `{obj["id"]: obj for obj in seq}` | 一行完成 |
| 字典键值互换 | for + 临时列表 | `{v: k for k, v in d.items()}` | 一行完成 |
| 三维展平 | 三层嵌套 for + append | 嵌套推导式（最多三层 for） | 但超过三层仍建议用 for |

#### 3.1.1 典型对比

**字典过滤与变换**

不推荐——多行 for 循环做简单的过滤变换：

```python
adjusted = {}
for name, score in scores.items():
    if score >= 80:
        adjusted[name] = round(score * 1.05)
```

推荐——字典推导式一行完成：

```python
adjusted = {n: round(s * 1.05) for n, s in scores.items() if s >= 80}
```

**从嵌套结构收集唯一值**

不推荐——手动维护 set：

```python
tags = set()
for article in articles:
    for tag in article["tags"]:
        tags.add(tag)
```

推荐——集合推导式一行：

```python
tags = {tag for a in articles for tag in a["tags"]}
```

### 3.2 常见错误模式及修正

**错误一：字典推导式写成了集合推导式**

```python
# 错误：少了冒号，变成了集合推导式
d = {k, v for k, v in zip(keys, values)}  # 语法错误或生成元素为元组的集合
```

修正——字典推导式必须有 `k: v` 的冒号：

```python
d = {k: v for k, v in zip(keys, values)}  # 正确
```

**错误二：嵌套 for 顺序写反**

```python
# 错误：误以为先写内层 for
result = [val for val in row for row in matrix]  # NameError: row 未定义
```

修正——for 顺序与嵌套循环的外→内顺序一致：

```python
result = [val for row in matrix for val in row]  # 先 row（外），后 val（内）
```

**错误三：键值互换时值有重复**

```python
# 危险：重复的值导致后面的覆盖前面的
employees = {"E001": "张三", "E002": "张三"}  # 两个张三
swapped = {v: k for k, v in employees.items()}
print(swapped)  # {'张三': 'E002'} —— E001 丢失了！
```

修正——值不唯一时，使用 `defaultdict` 收集：

```python
from collections import defaultdict
swapped = defaultdict(list)
for k, v in employees.items():
    swapped[v].append(k)
print(dict(swapped))  # {'张三': ['E001', 'E002']}
```

**错误四：推导式太长却不拆函数**

```python
# 可读性极差
result = [
    normalize(extract(parse(line))) if valid(line) else None
    for line in data
    if line and not line.startswith("#") and len(line.split()) > 2
]
```

修正——逻辑拆成函数：

```python
def should_process(line):
    return line and not line.startswith("#") and len(line.split()) > 2

def process(line):
    return normalize(extract(parse(line))) if valid(line) else None

result = [process(line) for line in data if should_process(line)]
```

### 3.3 推导式选择指南

**什么时候用哪种推导式**：

```text
你需要一个列表 → 列表推导式 [x for x in seq]
你需要一个字典 → 字典推导式 {k: v for x in seq}
你需要去重     → 集合推导式 {x for x in seq}
你数据量巨大   → 生成器表达式 (x for x in seq)
```

**可读性的黄金规则**：如果一个推导式自己 3 秒内没看懂，就改成普通 for 循环。推导式是为了让代码更清晰，不是为了炫技。

---

## 4. 原理

### 4.1 字典推导式与 dict() 构造函数的性能差异

`{k: v for k, v in zip(keys, values)}` 和 `dict(zip(keys, values))` 功能相同，但性能有微小差异：

```text
dict(zip(...)):
  1. zip(keys, values) —— 创建 zip 迭代器
  2. dict(...) —— 内部 C 循环遍历 zip，逐对插入

{k: v for k, v in zip(...)}:
  1. zip(keys, values) —— 创建 zip 迭代器
  2. Python 层面的 for 循环遍历
  3. Python 层面的字典插入
```

`dict(zip(...))` 通常略快，因为字典构建在 C 层面完成。但 `{k: v for ...}` 的优势在于可以在遍历过程中对键值做变换或过滤——这是 `dict(zip(...))` 做不到的。

**选择标准**：不需要变换或过滤时用 `dict(zip(...))`，需要变换或过滤时用字典推导式。

### 4.2 集合推导式的去重时机

集合推导式在构建时**实时去重**，不是先构建列表再转集合：

```python
# 集合推导式
unique = {x**2 for x in range(-5, 6)}
# 过程：
#   x=-5→25, 集合={25}
#   x=-4→16, 集合={25,16}
#   ...
#   x=5→25, 已有25，跳过
# 最终集合={0,1,4,9,16,25}
```

因为集合基于哈希表，每次 `add` 操作 O(1) 检查重复。`set()` 构造函数的行为也一样——但集合推导式在构建过程中可以附带过滤和变换。

### 4.3 嵌套推导式的内存模型

嵌套推导式是一次性构建完成的，临时表达式的结果不会额外占用空间：

```python
# 展平矩阵
flat = [v for row in matrix for v in row]
```

内部过程：

```text
1. 创建空列表 result = []
2. for row in matrix:
       for v in row:
           result.append(v)    # C 层面的 LIST_APPEND
3. 返回 result
```

矩阵中的 `row` 是原数据的引用，`v` 是 `int` 值（不可变），没有额外的中间列表被创建。但要注意：如果表达式部分是复杂对象（如 `dict`），每个元素都是新创建的，总内存 = 元素数量 × 单个元素内存。

---

## 5. 总结

本文围绕推导式的进阶用法，主要介绍了以下内容：

- 多条件过滤策略：多个 `if` 子句（链式过滤）、复杂布尔表达式、真值特性过滤
- 条件分支与变换：多层三元表达式、先过滤再变换的执行顺序、不同分支输出不同格式
- 分支逻辑超过 3 层时应抽成独立函数，保持推导式的简洁性
- 嵌套推导式：二维展平 + 过滤组合、矩阵转置、三维展平、笛卡尔积过滤
- 嵌套推导式中 `for` 子句的外→内顺序与嵌套循环一致，`if` 紧跟所属的 `for`
- 字典推导式 `{k: v for ...}`：构建、过滤、变换、键值互换（注意值唯一性）
- 集合推导式 `{x for ...}`：去重提取、嵌套唯一值收集、集合运算
- 四种推导式速查：列表 `[]` / 字典 `{k:v}` / 集合 `{}` / 生成器 `()`
- 可读性原则：3 秒内看不明白就改用普通 for 循环
- `dict(zip(...))` 适合不做变换的字典构建，字典推导式适合带变换和过滤的场景