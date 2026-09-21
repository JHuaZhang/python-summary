---
group:
  title: 【10】循环结构
  order: 10
order: 8
title: enumerate 与 zip
nav:
  title: Python基础
  order: 1
---

# enumerate 与 zip

## 1. 介绍

### 1.1 什么是 enumerate 与 zip

`enumerate` 和 `zip` 是 Python 内置的两个函数，它们本身不是循环结构，却是循环中使用频率最高的**辅助工具**。它们解决的是两个不同的核心问题：

- **`enumerate`**：为可迭代对象中的每个元素**附加一个序号**。当你需要"第几个"这个信息时，`enumerate` 让序号自动生成。
- **`zip`**：将多个可迭代对象**按位置一一配对**。当你有"姓名列表 + 成绩列表"这样关联的多组数据时，`zip` 把它们压成一对一对的。

两个函数返回的都是**迭代器**，不提前生成全部数据，内存开销极小。下面是最简示例：

```python
# enumerate：自动加序号
fruits = ["苹果", "香蕉", "橘子"]
for idx, fruit in enumerate(fruits, start=1):
    print(f"{idx}. {fruit}")

# 输出：
# 1. 苹果
# 2. 香蕉
# 3. 橘子
```

```python
# zip：多列表并行遍历
names = ["张三", "李四", "王五"]
scores = [85, 92, 78]
for name, score in zip(names, scores):
    print(f"{name}: {score}分")

# 输出：
# 张三: 85分
# 李四: 92分
# 王五: 78分
```

### 1.2 enumerate 与 zip 在 Python 中的定位

`enumerate` 和 `zip` 属于 Python 的**内置迭代器工具**。它们和 `range` 在同一层——都不是循环本身，但极大地增强了循环的表达能力。

```text
Python 循环辅助工具

  ├── 数值控制
  │   └── range(start, stop, step) ——— 生成等差数列
  │
  ├── 序号增强
  │   └── enumerate(iterable, start) —— 自动附加索引/序号
  │
  ├── 并行压缩
  │   ├── zip(*iterables) ——————————— 按位置一一配对
  │   └── zip_longest(*iterables) ——— 按最长补齐配对
  │
  └── 组合使用
      └── enumerate + zip ———————— 序号 + 多数据并行
```

### 1.3 为什么需要 enumerate 和 zip

在没有 `enumerate` 之前，给列表加序号需要手动维护计数器：

```python
# 不好的写法
i = 0
for item in items:
    print(f"{i}: {item}")
    i += 1
```

在没有 `zip` 之前，并行遍历多个列表需要靠索引：

```python
# 不好的写法
for i in range(len(names)):
    print(f"{names[i]}: {scores[i]}分")
```

这两种写法的问题在于：**变量多、易出错、语义不清晰**。`enumerate` 和 `zip` 用一行代码解决了这些问题——序号自动生成、对齐自动处理。

---

## 2. 核心内容

### 2.1 enumerate 基础用法

#### 2.1.1 基本语法与返回值

`enumerate(iterable, start=0)` 接收一个可迭代对象和一个起始索引，返回一个 `enumerate` 迭代器对象。每次迭代产出 `(index, element)` 二元组：

```python
fruits = ["苹果", "香蕉", "橘子"]

result = enumerate(fruits)
print(type(result))    # <class 'enumerate'>
print(list(result))    # [(0, '苹果'), (1, '香蕉'), (2, '橘子')]
```

在 `for` 循环中直接解包最为常见：

```python
for idx, fruit in enumerate(fruits):
    print(f"[{idx}] = {fruit}")

# 输出：
# [0] = 苹果
# [1] = 香蕉
# [2] = 橘子
```

**`enumerate` 不是列表**——它是一个惰性迭代器，每次迭代时实时生成 `(序号, 元素)` 元组，不提前占用内存。这意味着即使是百万级数据的可迭代对象，`enumerate` 也是 O(1) 的内存开销。

#### 2.1.2 start 参数：控制起始序号

`start` 参数默认为 0，但很多场景需要从 1 开始：

```python
students = ["张三", "李四", "王五"]

# 场景 1：排名输出（从 1 开始）
for rank, name in enumerate(students, start=1):
    print(f"第{rank}名: {name}")

# 场景 2：命令行菜单
menu = ["新建", "打开", "保存", "退出"]
for idx, option in enumerate(menu, start=1):
    print(f"[{idx}] {option}")

# 场景 3：代码行号
code = [
    "def hello(name):",
    "    return f'Hello, {name}'",
]
for lineno, line in enumerate(code, start=1):
    print(f"{lineno:>3} | {line}")
```

**运行结果**：

```text
第1名: 张三
第2名: 李四
第3名: 王五
[1] 新建
[2] 打开
[3] 保存
[4] 退出
  1 | def hello(name):
  2 |     return f'Hello, {name}'
```

`start` 可以是任意整数，不只是 1。例如某些编号系统从 10 开始，直接传 `start=10` 即可。

#### 2.1.3 enumerate 与 range(len) 的对比

`enumerate` 是 `range(len())` 的升级替代方案。两者的对比：

```python
items = ["a", "b", "c"]

# 方式 1：range(len) —— 不推荐
for i in range(len(items)):
    print(f"[{i}] = {items[i]}")

# 方式 2：enumerate —— 推荐
for i, item in enumerate(items):
    print(f"[{i}] = {item}")
```

| 维度 | `range(len(seq))` | `enumerate(seq)` |
|------|-------------------|-------------------|
| 代码行数 | 访问元素需要 `seq[i]` | 一步拿到索引和元素 |
| 可读性 | 看到 `range(len)` 需要思考意图 | 看到 `enumerate` 立刻知道意图 |
| 适用范围 | 只能用于支持索引的序列 | 适用于所有可迭代对象（生成器、文件等） |
| 性能 | 每次访问 `seq[i]` 有一次索引查找 | 直接从迭代器取出，无额外查找 |

一个关键差异：`enumerate` 可以用于**非序列的可迭代对象**（如生成器、文件对象），而 `range(len)` 不可以：

```python
# enumerate 可以遍历生成器
def gen():
    yield "A"
    yield "B"
    yield "C"

for idx, val in enumerate(gen()):
    print(f"{idx}: {val}")

# range(len) 对生成器不可用——len(gen()) 报错！
```

---

### 2.2 zip 基础用法

#### 2.2.1 基本语法与行为

`zip(*iterables)` 接收多个可迭代对象，按位置将它们"压缩"成一个迭代器，每次迭代产出一个元组，元组的第 N 个元素来自第 N 个可迭代对象：

```python
names = ["张三", "李四", "王五"]
scores = [85, 92, 78]

zipped = zip(names, scores)
print(type(zipped))     # <class 'zip'>
print(list(zipped))     # [('张三', 85), ('李四', 92), ('王五', 78)]
```

在 `for` 循环中解包使用：

```python
for name, score in zip(names, scores):
    print(f"{name}: {score}分")

# 输出：
# 张三: 85分
# 李四: 92分
# 王五: 78分
```

`zip` 可以接收**任意数量**的可迭代对象，不只限于两个：

```python
products = ["键盘", "鼠标", "显示器"]
prices = [299, 89, 1299]
stocks = [50, 120, 30]

for name, price, qty in zip(products, prices, stocks):
    print(f"{name}: ¥{price} × {qty} = ¥{price * qty}")

# 输出：
# 键盘: ¥299 × 50 = ¥14950
# 鼠标: ¥89 × 120 = ¥10680
# 显示器: ¥1299 × 30 = ¥38970
```

#### 2.2.2 不等长列表的默认行为——取最短

这是 `zip` 最容易踩的坑。当多个可迭代对象长度不同时，`zip` **以最短的为准**，多余的元素被**静默丢弃**，不报任何错：

```python
short = [1, 2]
long = ["a", "b", "c", "d"]

result = list(zip(short, long))
print(result)  # [(1, 'a'), (2, 'b')]
# "c" 和 "d" 被静默丢弃了！
```

这种行为在某些场景下是设计意图（"就取共同的长度"），但更多时候是数据不一致导致的**隐蔽 bug**——你以为代码在处理全部数据，实际上后半截根本没被处理。

#### 2.2.3 strict 参数：长度不匹配时显式报错

Python 3.10 引入了 `strict` 参数。设置 `strict=True` 后，任意两个可迭代对象长度不一致时抛出 `ValueError`：

```python
a = [1, 2, 3, 4]
b = ["a", "b"]

try:
    list(zip(a, b, strict=True))
except ValueError as e:
    print(f"报错: {e}")
    # 报错: zip() argument 2 is shorter than argument 1
```

这是一个**防御性编程**的好习惯——当你的代码逻辑要求数据等长时，用 `strict=True` 尽早暴露问题：

```python
# 安全实践：成绩配对
students = ["张三", "李四", "王五", "赵六", "钱七"]
exam_scores = [85, 92, 78]  # 少了两个！

for name, score in zip(students, exam_scores, strict=True):
    print(f"{name}: {score}")
# ValueError → 立刻发现数据不对齐
```

**注意**：`strict` 参数仅在 Python 3.10+ 可用。在旧版本中，需要手动检查长度或使用 `zip_longest`。

#### 2.2.4 zip_longest：按最长的补齐

`itertools.zip_longest(*iterables, fillvalue=None)` 以**最长的可迭代对象**为准，短的部分用 `fillvalue` 填充：

```python
from itertools import zip_longest

a = [1, 2]
b = ["a", "b", "c", "d"]

for x, y in zip_longest(a, b):
    print(f"{x} → {y}")

# 输出：
# 1 → a
# 2 → b
# None → c
# None → d
```

可以自定义填充值：

```python
products = ["键盘", "鼠标"]
prices = [299, 89, 1299, 49]

for product, price in zip_longest(products, prices, fillvalue="未知商品"):
    print(f"{product}: ¥{price}")

# 输出：
# 键盘: ¥299
# 鼠标: ¥89
# 未知商品: ¥1299
# 未知商品: ¥49
```

| 对比 | `zip()` | `zip(..., strict=True)` | `zip_longest()` |
|------|---------|------------------------|-----------------|
| 不等长行为 | 静默截断到最短 | 抛 `ValueError` | 补全到最长，缺位填 `fillvalue` |
| Python 版本 | 全版本 | 3.10+ | `itertools` 模块（全版本） |
| 适用场景 | 明确知道等长且允许截断 | 数据必须等长，不一致即 bug | 允许缺失值，需要知道缺了什么 |

---

### 2.3 zip(*) 解压与矩阵转置

#### 2.3.1 zip(*) 解压——逆向操作

`zip(*zipped)` 将 `zip` 压缩后的结果"解压"回原来的序列。这个操作在数学上等价于矩阵转置：

```python
names = ["张三", "李四", "王五"]
scores = [85, 92, 78]

paired = list(zip(names, scores))     # 压缩
print(paired)  # [('张三', 85), ('李四', 92), ('王五', 78)]

unzipped_names, unzipped_scores = zip(*paired)  # 解压
print(unzipped_names)   # ('张三', '李四', '王五')
print(unzipped_scores)  # (85, 92, 78)
```

**理解 `zip(*)` 的机制**：`*paired` 把列表 `paired` 里的每个元组拆成独立参数传给 `zip`，等价于 `zip(('张三', 85), ('李四', 92), ('王五', 78))`。`zip` 再把每个元组中相同位置的元素聚拢到一起——第 0 个位置全是姓名，第 1 个位置全是分数。

#### 2.3.2 矩阵转置——经典应用

```python
matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
]

# zip(*matrix) 将行变成列，列变成行
transposed = list(zip(*matrix))
# 结果：[(1, 4, 7), (2, 5, 8), (3, 6, 9)]
```

原矩阵的第一列 `[1, 4, 7]` 变成了转置矩阵的第一行，这就是 `zip(*)` 的效果。

#### 2.3.3 数据行列旋转

`zip(*)` 也适用于表格数据的行列交换：

```python
# 每条记录：（姓名, 科目, 分数）
records = [
    ("张三", "语文", 85),
    ("张三", "数学", 92),
    ("李四", "语文", 90),
    ("李四", "数学", 88),
]

# 行列旋转后，按列提取
columns = list(zip(*records))
print(columns[0])  # ('张三', '张三', '李四', '李四')  姓名列
print(columns[1])  # ('语文', '数学', '语文', '数学')  科目列
print(columns[2])  # (85, 92, 90, 88)                 成绩列
```

---

### 2.4 zip 的进阶用法

#### 2.4.1 相邻元素配对

`zip(seq, seq[1:])` 是一种常用技巧，将列表中相邻的元素两两配对：

```python
values = [10, 15, 12, 18, 14]

for prev, curr in zip(values, values[1:]):
    change = curr - prev
    trend = "↑" if change > 0 else ("↓" if change < 0 else "→")
    print(f"{prev} → {curr}  {trend} ({change:+d})")

# 输出：
# 10 → 15  ↑ (+5)
# 15 → 12  ↓ (-3)
# 12 → 18  ↑ (+6)
# 18 → 14  ↓ (-4)
```

这种模式在数据分析中非常有用——计算环比变化、检测趋势拐点、分析时间序列等。

**注意**：`values[1:]` 会创建一个新列表（浅拷贝），对大数据集合有内存开销。如果需要极致的内存效率，可以用 `itertools.tee` 创建两个独立迭代器来实现类似的相邻配对，但通常 `zip(seq, seq[1:])` 已足够高效。

#### 2.4.2 隔位配对——键值交替列表

当数据以 `[key1, val1, key2, val2, ...]` 的平铺格式存储时，可以用步长切片 + `zip` 快速配对：

```python
flat_data = ["name", "张三", "age", 25, "city", "杭州"]

# data[::2] 取偶数位（键），data[1::2] 取奇数位（值）
for key, val in zip(flat_data[::2], flat_data[1::2]):
    print(f"{key} = {val}")

# 也可以一步构建字典
d = dict(zip(flat_data[::2], flat_data[1::2]))
print(d)  # {'name': '张三', 'age': 25, 'city': '杭州'}
```

#### 2.4.3 zip 构建字典

`zip` + `dict()` 是最快的"双列表 → 字典"转换方式：

```python
keys = ["name", "age", "city"]
values = ["张三", 25, "杭州"]

# 一行构建字典
info = dict(zip(keys, values))
print(info)  # {'name': '张三', 'age': 25, 'city': '杭州'}
```

---

### 2.5 enumerate 与 zip 的组合实战

两个工具经常组合使用，实现"序号 + 多数据并行遍历"：

```python
names = ["张三", "李四", "王五", "赵六", "钱七"]
scores = [85, 92, 78, 88, 95]

# 先按分数排序，再用 enumerate 加排名
ranked = sorted(zip(scores, names), reverse=True)

for rank, (score, name) in enumerate(ranked, start=1):
    print(f"第{rank}名: {name} ({score}分)")

# 输出：
# 第1名: 钱七 (95分)
# 第2名: 李四 (92分)
# 第3名: 赵六 (88分)
# 第4名: 张三 (85分)
# 第5名: 王五 (78分)
```

**嵌套解包解析**：`for rank, (score, name) in enumerate(ranked, start=1)` — 外层 `enumerate` 输出 `(rank, 元组)`，内层 `(score, name)` 把元组进一步拆开。

再来一个成绩表输出的综合示例：

```python
headers = ["序号", "姓名", "语文", "数学", "英语", "总分"]
data = [
    ("张三", 85, 92, 88),
    ("李四", 90, 88, 95),
    ("王五", 78, 85, 80),
]

print("  " + " | ".join(f"{h:^4}" for h in headers))
for idx, (name, *scores) in enumerate(data, start=1):
    total = sum(scores)
    print(f"  {idx:^4} | {name:^4} | {scores[0]:^4} | {scores[1]:^4} | {scores[2]:^4} | {total:^4}")
```

**运行结果**：

```text
   序号  |  姓名  |  语文  |  数学  |  英语  |  总分
    1   |  张三  |  85   |  92   |  88   |  265
    2   |  李四  |  90   |  88   |  95   |  273
    3   |  王五  |  78   |  85   |  80   |  243
```

**另一个常见组合**：多表数据合并

```python
ids = [101, 102, 103]
names = ["键盘", "鼠标", "显示器"]
prices = [299, 89, 1299]
warehouses = ["A仓", "B仓", "C仓"]

for pid, name, price, wh in zip(ids, names, prices, warehouses):
    print(f"编号{pid}: {name} / ¥{price} / {wh}")

# 输出：
# 编号101: 键盘 / ¥299 / A仓
# 编号102: 鼠标 / ¥89 / B仓
# 编号103: 显示器 / ¥1299 / C仓
```

---

## 3. 最佳实践

### 3.1 推荐 vs 不推荐写法对比

| 场景 | 不推荐 | 推荐 | 原因 |
|------|--------|------|------|
| 加序号 | `i = 0; for x in seq: ... i += 1` | `for i, x in enumerate(seq):` | 自动维护序号，减少出错 |
| 索引遍历 | `for i in range(len(seq)):` | `for i, x in enumerate(seq):` | enumerate 语义更清晰，支持非序列 |
| 多列表并行 | `for i in range(len(a)): a[i], b[i]` | `for x, y in zip(a, b):` | zip 一行完成，不依赖索引 |
| 数据对齐检查 | `zip(a, b)` 无检查 | `zip(a, b, strict=True)` | 尽早发现长度不一致的 bug |
| 键值配对 | `for i in range(len(keys)): d[keys[i]] = values[i]` | `dict(zip(keys, values))` | 一行构建字典，代码意图明确 |
| 相邻元素 | `for i in range(len(seq)-1): prev, curr = seq[i], seq[i+1]` | `for prev, curr in zip(seq, seq[1:]):` | zip 写法无需手动索引和边界检查 |

#### 3.1.1 典型对比示例

**示例一：加序号**

不推荐——手动维护计数器，易出边界错误：

```python
i = 0
for item in items:
    print(f"{i}. {item}")
    i += 1
```

推荐——序号由 enumerate 自动管理：

```python
for i, item in enumerate(items, start=1):
    print(f"{i}. {item}")
```

**示例二：多列表并行**

不推荐——依赖索引，且 `range(len)` 限制了只能用于序列：

```python
for i in range(len(names)):
    name = names[i]
    score = scores[i]
    print(f"{name}: {score}")
```

推荐——zip 多变量解包，变量名自说明：

```python
for name, score in zip(names, scores):
    print(f"{name}: {score}")
```

### 3.2 常见错误模式及修正

**错误一：zip 不等长列表导致静默丢数据**

```python
# 错误：zip 静默截断，后面两个学生成绩被丢弃
students = ["张三", "李四", "王五", "赵六", "钱七"]
scores = [85, 92, 78]
for name, score in zip(students, scores):
    process(name, score)
```

修正方式——用 `strict=True` 或提前检验长度：

```python
# 修正 1：strict=True（Python 3.10+）
for name, score in zip(students, scores, strict=True):
    process(name, score)

# 修正 2：手动检查（兼容旧版本）
assert len(students) == len(scores), \
    f"长度不一致: students={len(students)}, scores={len(scores)}"
```

**错误二：把 enumerate 返回值当成列表**

```python
# 错误：enumerate 返回迭代器，只能消费一次
enum = enumerate(["a", "b", "c"])
print(list(enum))   # [(0, 'a'), (1, 'b'), (2, 'c')]
print(list(enum))   # [] —— 迭代器已耗尽！
```

修正方式——如果需要多次使用，先转成列表：

```python
enum = list(enumerate(["a", "b", "c"]))
print(enum)  # [(0, 'a'), (1, 'b'), (2, 'c')]
print(enum)  # 仍可用
```

**错误三：enumerate 变量顺序弄反**

```python
# 错误：fruit 拿到了索引，idx 拿到了值
for fruit, idx in enumerate(["苹果", "香蕉"]):
    print(f"{fruit}: {idx}")
    # 输出：0: 苹果  ← 变量名与实际内容不匹配！
```

修正方式——记住顺序：`enumerate` 返回 `(index, element)`，索引在前：

```python
for idx, fruit in enumerate(["苹果", "香蕉"]):
    print(f"{idx}: {fruit}")  # 0: 苹果  ← 正确
```

**错误四：对 zip 结果做随机访问**

```python
# 错误：zip 迭代器不支持索引
zipped = zip(a, b)
print(zipped[0])  # TypeError: 'zip' object is not subscriptable
```

修正方式——如果确实需要随机访问，先转 list：

```python
zipped = list(zip(a, b))
print(zipped[0])  # 正常
```

### 3.3 可读性、性能取舍建议

**`strict=True` 是默认应该开启的好习惯**：如果你的代码逻辑要求数据等长，就加上 `strict=True`。它让 bug 在第一时间暴露，而不是沉默地处理部分数据后产生更难排查的业务错误。

**`enumerate` 优于 `range(len)` 不只在可读性上**：`enumerate` 少了一次索引查找 `seq[i]`，对大型列表有微小的性能优势。更重要的是它适用于所有可迭代对象，让你的代码更通用。

**`zip` 是惰性的**：`zip(a, b)` 不会预先创建包含所有配对结果的列表，每次迭代时才生成一个元组。处理百万级数据时，这和预计算一个完整列表有本质差异。

**链式组合时注意可读性**：`enumerate(zip(a, b))` 嵌套后变量名要清晰：

```python
# 不太清晰
for i, (x, y) in enumerate(zip(a, b)):
    ...

# 更清晰——用有语义的变量名
for rank, (name, score) in enumerate(zip(names, scores), start=1):
    ...
```

---

## 4. 原理

### 4.1 enumerate 的迭代过程

`enumerate` 本质上是一个**包装迭代器**——它内部持有对原可迭代对象的引用，每次被要求产出时：先从原迭代器取下一个元素、再用一个内部计数器组合成 `(counter, element)` 元组：

```text
enumerate(["A", "B", "C"], start=0) 的内部运作：

  创建时: counter = 0
  迭代 1: 从列表迭代器取 "A" → 产出 (0, "A") → counter += 1
  迭代 2: 从列表迭代器取 "B" → 产出 (1, "B") → counter += 1
  迭代 3: 从列表迭代器取 "C" → 产出 (2, "C") → counter += 1
  迭代 4: 列表迭代器抛出 StopIteration → enumerate 停止
```

用纯 Python 可以近似模拟 `enumerate` 的核心逻辑：

```python
def my_enumerate(iterable, start=0):
    counter = start
    for element in iterable:
        yield (counter, element)
        counter += 1
```

这个实现和内置 `enumerate` 的关键行为一致：惰性、每次迭代实时计算、计数器与元素都来自同一个迭代源。

### 4.2 zip 的迭代过程

`zip` 稍复杂一些——它需要同时推进多个迭代器，每一步从每个迭代器取一个元素、打包成元组。当任意一个迭代器耗尽时，`zip` 停止：

```text
zip([1,2,3], ["a","b","c"]) 的内部运作：

  创建时: 为每个可迭代对象创建迭代器 → iter([1,2,3]) → iter(["a","b","c"])
  迭代 1: iter1 取 1, iter2 取 "a" → 产出 (1, "a")
  迭代 2: iter1 取 2, iter2 取 "b" → 产出 (2, "b")
  迭代 3: iter1 取 3, iter2 取 "c" → 产出 (3, "c")
  迭代 4: iter1 抛出 StopIteration → zip 停止
```

用纯 Python 模拟 `zip` 的核心逻辑：

```python
def my_zip(*iterables):
    iterators = [iter(it) for it in iterables]
    while True:
        try:
            # 从每个迭代器取下一个元素
            values = [next(it) for it in iterators]
            yield tuple(values)
        except StopIteration:
            return  # 任意迭代器耗尽，zip 结束
```

这就是为什么默认 `zip` 以最短的为准——任意一个迭代器先耗尽，`zip` 就捕获 `StopIteration` 然后退出。`strict=True` 版本则会在退出前检查：如果某个迭代器提前耗尽而其他迭代器还有元素，就抛出 `ValueError`。

### 4.3 为什么 enumerate 和 zip 返回迭代器而不是列表

这和 Python 迭代器生态的设计哲学一致——**惰性求值**。返回迭代器有三大优势：

1. **内存友好**：`zip(range(10_000_000), range(10_000_000))` 不会创建包含一千万个元组的列表，内存占用始终是常数量级。
2. **可组合**：迭代器可以串联——`zip(enumerate(seq1), seq2)` 这样的组合不会创建中间列表，每一层都是惰性的。
3. **可部分消费**：你不需要一次性处理完所有数据。例如只需要前 5 个配对结果时，迭代 5 次就停止，后续数据根本不会被处理。

---

## 5. 总结

本文围绕 `enumerate` 与 `zip` 两个内置函数展开，主要介绍了以下内容：

- `enumerate(iterable, start)` 为可迭代对象每个元素自动附加序号，返回值是惰性迭代器
- `start` 参数控制起始编号，支持从任意整数开始，最常见的是 `start=1` 用于排名/菜单
- `enumerate` 替代 `range(len())`，在可读性、适用范围和性能上均有优势
- `zip(*iterables)` 将多个可迭代对象按位置一一配对，以最短的为准
- `strict=True`（Python 3.10+）让不等长的 zip 抛出 `ValueError`，是防御性编程的好习惯
- `itertools.zip_longest()` 按最长补齐，缺失位用 `fillvalue` 填充
- `zip(*zipped)` 实现解压/矩阵转置——行变列、列变行
- `zip(seq, seq[1:])` 实现相邻元素配对，常用于趋势分析和变值计算
- `enumerate` 与 `zip` 组合使用，实现"序号 + 多数据并行"的表达力，配合多层解包一步到位
- 两个函数返回的是惰性迭代器而非列表，内存占用常数级、支持链式组合和部分消费