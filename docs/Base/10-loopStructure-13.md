---
group:
  title: 【10】循环结构
  order: 10
order: 13
title: 循环惯用法与技巧
nav:
  title: Python基础
  order: 1
---

# 循环惯用法与技巧

## 1. 介绍

### 1.1 什么是循环惯用法

循环惯用法（Loop Idioms）是指在 Python 中被广泛认可的高效、可读的循环写法。它们不是新的语法特性，而是对已有语法——`for`、`reversed`、`zip`、`itertools`、推导式——的**模式化运用**。掌握这些惯用法意味着你不需要每次遇到循环问题都从零开始设计，而是能直接套用已知的、经过验证的模式。

```python
# 一个负面案例：写了 10 行代码做一件一行就能完成的事
found = False
result = None
for item in items:
    if condition(item):
        found = True
        result = item
        break
if found:
    print(f"找到: {result}")

# 惯用法：生成器表达式 + next() 两行搞定
result = next((item for item in items if condition(item)), None)
if result:
    print(f"找到: {result}")
```

本篇不是再介绍一个新语法点，而是对前面所有循环知识的**综合串讲**——把零散的技巧串联成一套工具箱。

### 1.2 本篇的知识地图

```text
循环惯用法工具箱

  ├── 遍历方向
  │   ├── reversed() —— 反向迭代器（不复制）
  │   ├── [::-1]切片 —— 反向复制（有内存开销）
  │   └── range(n, 0, -1) —— 反向计数
  │
  ├── 遍历范围
  │   ├── [::step]切片步长 —— 跳步取子序列
  │   ├── islice() —— 惰性截取前 N 个
  │   └── [start:end:step] —— 任意子区间
  │
  ├── 循环控制
  │   ├── 提前退出（break / return）
  │   ├── 哨兵值模式（sentinel）
  │   ├── for-else —— 标注"未找到"
  │   └── any/all —— 条件判断的声明式写法
  │
  ├── 累积与聚合
  │   ├── sum/max/min 内置函数
  │   ├── join() 替代 += 字符串拼接
  │   └── defaultdict 分组累积
  │
  ├── 迭代器工具
  │   ├── chain —— 拼接多个可迭代对象
  │   ├── product —— 笛卡尔积
  │   ├── combinations —— 组合选取
  │   └── tee —— 复制迭代器
  │
  └── 循环体设计原则
      ├── 循环不变式外提
      ├── 早退出（fail fast）
      └── 避免循环中重复计算
```

---

## 2. 核心内容

### 2.1 反向遍历与切片技巧

#### 2.1.1 reversed()：最推荐的反向遍历

`reversed(seq)` 返回一个**反向迭代器**，不复制原数据，内存开销为 O(1)：

```python
items = ["a", "b", "c", "d", "e"]

for item in reversed(items):
    print(item, end=" ")  # e d c b a

print(type(reversed(items)))  # <class 'list_reverseiterator'>
```

**与 `[::-1]` 的对比**：

```python
# reversed：迭代器，不复制
for x in reversed(big_list):   # O(1) 内存
    ...

# [::-1]：创建新列表，复制全部数据
for x in big_list[::-1]:       # O(n) 内存
    ...
```

| 方式 | 创建新对象 | 内存 | 适用场景 |
|------|----------|------|---------|
| `reversed(seq)` | 迭代器 | O(1) | 只需遍历，不需要保留反向列表 |
| `seq[::-1]` | 新列表 | O(n) | 需要保留反向副本或多次使用 |
| `range(n, 0, -1)` | range 对象 | O(1) | 纯数字反向计数 |

**选择标准**：如果只是遍历一次，永远用 `reversed()`。如果需要反向列表本身（存入变量后续使用），才用切片。

#### 2.1.2 range 反向计数

```python
# 从 5 倒数到 1
for i in range(5, 0, -1):
    print(i, end=" ")  # 5 4 3 2 1
```

第三个参数 `-1` 是步长，负数表示递减。

#### 2.1.3 enumerate + reversed 组合

反向遍历但同时需要序号：

```python
scores = [85, 92, 78, 88, 95]
names = ["张三", "李四", "王五", "赵六", "钱七"]

# 倒序显示（从最后一名开始）
for rank, (name, score) in enumerate(
    reversed(list(zip(names, scores))), start=1
):
    print(f"倒数第{rank}名: {name} ({score}分)")
```

**注意**：`reversed()` 不接受 `zip` 对象（`zip` 不是序列），所以需要先 `list()` 转换。

#### 2.1.4 切片步长：跳步取子序列

`seq[start:end:step]` 中的 `step` 参数可以跳过元素：

```python
data = list(range(1, 21))

# 每隔 3 个取一个
print(data[::3])   # [1, 4, 7, 10, 13, 16, 19]

# 取偶数位（索引 0, 2, 4...）
print(data[::2])   # [1, 3, 5, 7, 9, 11, 13, 15, 17, 19]

# 取奇数位（索引 1, 3, 5...）
print(data[1::2])  # [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]

# 反向跳步
print(data[::-2])  # [20, 18, 16, 14, 12, 10, 8, 6, 4, 2]
```

**注意**：切片会创建**新列表**（浅拷贝），大列表时注意内存。如果只是遍历，用 `itertools.islice`：

```python
from itertools import islice
for val in islice(data, 0, None, 3):  # 每隔3个
    process(val)  # 惰性，不创建新列表
```

### 2.2 循环控制技巧

#### 2.2.1 哨兵值模式（Sentinel Pattern）

用特殊值标记"到此为止"，处理变长输入：

```python
def read_until_sentinel(data, sentinel=-1):
    """读取数据直到遇到哨兵值"""
    result = []
    for val in data:
        if val == sentinel:
            break       # 遇到哨兵，停止
        result.append(val)
    return result

nums = [10, 20, 30, -1, 40, 50]
print(read_until_sentinel(nums))  # [10, 20, 30]
# -1 之后的数据被忽略
```

这个模式适用于文件读取（读到空行停止）、网络流处理（读到 EOF 标记）、用户输入交互等场景。

#### 2.2.2 any / all 替代显式循环

`any()` 和 `all()` 配合生成器表达式，可以替代很多手动写判断循环的场景：

```python
values = [10, 25, 30, 45, 50]

# 不推荐：手动写循环判断
has_big = False
for v in values:
    if v > 40:
        has_big = True
        break

# 推荐：any + 生成器表达式（一行、惰性、短路）
has_big = any(v > 40 for v in values)
```

| 函数 | 含义 | 短路行为 |
|------|------|---------|
| `any(iterable)` | 是否有任意一个元素为真 | 遇到第一个 True 就停止迭代 |
| `all(iterable)` | 是否所有元素都为真 | 遇到第一个 False 就停止迭代 |

`any` 在语义上等价于「是否存在」，`all` 等价于「是否全部」。

```python
# 检查是否全部有效
all_valid = all(item.get("status") == "ok" for item in response)

# 检查是否存在错误日志
has_error = any("ERROR" in line for line in log_lines)
```

#### 2.2.3 提前退出——next + 生成器

需要「找到第一个满足条件的元素」时，`next()` 配合生成器是最简洁的写法：

```python
records = [
    {"name": "张三", "status": "pending"},
    {"name": "李四", "status": "pending"},
    {"name": "王五", "status": "approved"},
    {"name": "赵六", "status": "pending"},
]

# 找到第一个 approved
first = next((r for r in records if r["status"] == "approved"), None)
print(first["name"])  # 王五
```

`next(gen, default)` 的第二个参数是**默认值**——如果生成器为空（没找到），返回这个值而不是抛出 `StopIteration`。

#### 2.2.4 for-else：优雅地标注"未找到"

当遍历是做「查找」操作时，`else` 子句可以在循环正常结束（没 break）时执行：

```python
target = "钱七"
for r in records:
    if r["name"] == target:
        print(f"找到 {target}")
        break
else:
    print(f"未找到 {target}")

# 输出：未找到 钱七
```

**for-else 的执行规则**：
- 循环被 `break` 打断 → `else` **不执行**
- 循环正常结束（遍历完所有元素） → `else` **执行**

这个语法的名字容易让人误解（以为是"循环后的必然执行"），但实际上它是「循环未被 break 时才执行」。你可以把它读作 `for ... then ... else nobreak`。

#### 2.2.5 用 islice 只遍历前 N 个

当只需要处理可迭代对象的前几个元素时：

```python
from itertools import islice

large_data = range(1_000_000)

# 只处理前 5 个，后面的完全不访问
for i, val in enumerate(islice(large_data, 5)):
    print(f"[{i}] = {val}")
```

与切片 `large_data[:5]` 的区别：`islice` 是惰性的，不创建新列表。

### 2.3 累积与聚合——用内置函数替代手动循环

#### 2.3.1 sum / max / min 替代手动累加/极值

这是最基本的惯用法，但很多人还是在写手动循环：

```python
data = [15, 8, 23, 42, 4, 16]

# 不推荐：手动循环
total = 0
for x in data:
    total += x
max_val = data[0]
for x in data:
    if x > max_val:
        max_val = x

# 推荐：内置函数
total = sum(data)
max_val = max(data)
min_val = min(data)
```

内置函数不仅是代码更短——它们是用 C 实现的，比 Python 层面的 for 循环快一个数量级。

**条件聚合**：`sum` + 生成器表达式 = 带条件的求和：

```python
# 只计算 > 20 的元素之和
big_sum = sum(x for x in data if x > 20)
print(big_sum)  # 65
```

#### 2.3.2 join 替代字符串 += 拼接

在循环中做字符串拼接时，**绝对不要用 `+=`**——它每次拼接都创建新的字符串对象，复杂度是 O(n²)：

```python
words = ["Python", "循环", "惯用法", "技巧"]

# 不推荐：+= 每次创建新字符串
result = ""
for w in words:
    result += w + " "   # 每次循环都分配新内存

# 推荐：join 一次性拼接
result = " ".join(words)
```

**原理**：`join` 内部先计算总长度、预分配内存，再一次性填充——整个操作是 O(n)。

#### 2.3.3 一次遍历做多项统计

如果需要同时计算 count、sum、max、min，没必要遍历四次：

```python
data = [10, 20, 30, 40, 50]

count = total = max_val = 0
min_val = float("inf")

for x in data:
    count += 1
    total += x
    if x > max_val:
        max_val = x
    if x < min_val:
        min_val = x

avg = total / count
print(f"count={count}, sum={total}, max={max_val}, min={min_val}, avg={avg:.1f}")
```

对于需要 **count、sum、min、max 同时获取**的情况，也可以分开调用内置函数（遍历 4 次），但一次遍历更高效。

#### 2.3.4 defaultdict 做分组累积

```python
from collections import defaultdict

items = [
    ("水果", "苹果"), ("蔬菜", "白菜"),
    ("水果", "香蕉"), ("蔬菜", "萝卜"), ("水果", "橘子"),
]

groups = defaultdict(list)
for cat, item in items:
    groups[cat].append(item)

print(dict(groups))
# {'水果': ['苹果', '香蕉', '橘子'], '蔬菜': ['白菜', '萝卜']}
```

`defaultdict` 不需要手动检查键是否存在——第一次访问不存在的键时，自动调用工厂函数创建默认值。

### 2.4 itertools 常用工具

`itertools` 模块提供了一系列高效的迭代器构建块。以下是循环中最常用的几个。

#### 2.4.1 chain：优雅拼接多个可迭代对象

```python
from itertools import chain

a = [1, 2, 3]
b = ["a", "b"]
c = [True, False]

for item in chain(a, b, c):
    print(item, end=" ")  # 1 2 3 a b True False
```

与 `a + b + c` 的区别：`chain` 不创建新列表，只返回迭代器。三个百万级列表用 `chain` 是 O(1) 内存，用 `+` 是 O(n) 内存。

**展平嵌套列表**——`chain.from_iterable`：

```python
nested = [[1, 2], [3, 4, 5], [6]]
flat = list(chain.from_iterable(nested))
print(flat)  # [1, 2, 3, 4, 5, 6]
```

#### 2.4.2 product：替代多层嵌套 for

```python
from itertools import product

sizes = ["S", "M"]
colors = ["红", "蓝"]

for size, color in product(sizes, colors):
    print(f"{size}-{color}")

# 输出：
# S-红
# S-蓝
# M-红
# M-蓝
```

`product` 等价于多层嵌套 `for`，但只用一层就表达了笛卡尔积的语义。三层及以上的嵌套时，`product` 的可读性优势尤其明显。

#### 2.4.3 cycle + islice：循环取固定个数

```python
from itertools import cycle, islice

colors = ["红", "绿", "蓝"]

# 取前 8 个，循环使用颜色列表
for i, color in enumerate(islice(cycle(colors), 8), 1):
    print(f"第{i}个: {color}")

# 第1个: 红 → 第2个: 绿 → 第3个: 蓝 → 第4个: 红 → ...
```

适用于轮询分配（负载均衡）、循环背景色、表格行交替着色等场景。

#### 2.4.4 combinations / permutations：组合与排列

```python
from itertools import combinations, permutations

items = ["A", "B", "C", "D"]

# 组合（顺序无关）：从 4 个中选 2 个
for combo in combinations(items, 2):
    print(combo, end=" ")
# ('A', 'B') ('A', 'C') ('A', 'D') ('B', 'C') ('B', 'D') ('C', 'D')

# 排列（顺序有关）：从 4 个中选 2 个排列
for perm in permutations(items, 2):
    print(perm, end=" ")
# ('A', 'B') ('A', 'C') ... ('D', 'C') 共 12 种
```

组合用于"从 N 个候选者中选 K 个"的场景（如选两人组队），排列用于"顺序敏感的选取"（如安排演讲顺序）。

#### 2.4.5 tee：复制迭代器

当同一个数据源需要被多处消费时，用 `tee` 创建独立副本：

```python
from itertools import tee

gen = (x for x in range(5))
gen1, gen2 = tee(gen, 2)

print(list(gen1))  # [0, 1, 2, 3, 4]
print(list(gen2))  # [0, 1, 2, 3, 4]
```

**注意**：`tee` 内部会缓存数据。如果两个副本的消费进度差距很大（如 gen1 消费了 10000 条但 gen2 才 100 条），未消费的 9900 条会被缓存占用内存。大数据场景下这个开销不可忽略。

### 2.5 循环体设计原则

#### 2.5.1 循环不变式外提

**循环不变式**是指循环体中值不发生变化的表达式。把它们提到循环外面，减少重复计算：

```python
import math

items = [1.0, 2.0, 3.0, 4.0, 5.0]

# 不推荐：每次循环重新计算 sqrt(2)
results = [x * math.sqrt(2) for x in items]

# 推荐：提到循环外
SQRT2 = math.sqrt(2)
results = [x * SQRT2 for x in items]
```

同样的原则适用于属性查找：

```python
# 不推荐：每次循环重新查 config["timeout"]
for _ in range(1000):
    timeout = config["timeout"]

# 推荐：提到外面
timeout = config["timeout"]
for _ in range(1000):
    use(timeout)
```

#### 2.5.2 早退出（Fail Fast）

能早退出的场景就早退出——避免不必要的计算：

```python
def find_first_negative(numbers):
    """找到第一个负数就返回，不继续遍历"""
    for n in numbers:
        if n < 0:
            return n         # ← 立即返回
    return None
```

**什么时候用 break vs return**：
- 如果查找逻辑在函数内 → 用 `return`（最简洁）
- 如果查找逻辑在 `main` 或不想写函数 → 用 `break` + 变量

#### 2.5.3 短循环体

如果循环体超过约 5 行，考虑把循环体内的逻辑提取为独立函数：

```python
# 不推荐：循环体太长，逻辑杂糅
result = []
for user in users:
    # ... 8 行验证逻辑 ...
    # ... 6 行转换逻辑 ...
    result.append(...)

# 推荐：提取函数
def is_valid_user(user):
    return user["age"] >= 18 and user["score"] >= 80

qualified = [u["name"] for u in users if is_valid_user(u)]
```

短循环体的好处：循环意图一目了然，可以改用推导式，函数可独立测试。

#### 2.5.4 避免在循环中修改正在遍历的集合

这是 Python 循环中最常见的坑之一。安全做法是**收集→再操作**：

```python
# 安全：收集待删除的键，循环结束后再删
data = {"a": 1, "b": 0, "c": 3, "d": 0, "e": 5}

to_delete = [k for k, v in data.items() if v == 0]
for k in to_delete:
    del data[k]

print(data)  # {'a': 1, 'c': 3, 'e': 5}
```

或者直接**构建新字典**（推荐）：

```python
data = {k: v for k, v in data.items() if v != 0}
```

### 2.6 惯用法速查表

| 需求 | 惯用法 | 替代的手动写法 |
|------|--------|-------------|
| 反向遍历（不复制） | `reversed(seq)` | `for i in range(len(seq)-1, -1, -1)` |
| 反向计数 | `range(n, 0, -1)` | — |
| 跳步遍历 | `seq[::step]`（小数据）/ `islice(seq, 0, None, step)`（大数据） | 手动维护计数器 |
| 找到第一个匹配项 | `next((x for x in seq if cond), None)` | 手动 for + break + 变量 |
| 是否存在满足条件 | `any(cond for x in seq)` | 手动 for + break + bool |
| 是否全部满足条件 | `all(cond for x in seq)` | 手动 for + break + bool |
| 拼接多个序列 | `chain(a, b, c)` | `a + b + c`（创建新列表） |
| 笛卡尔积 | `product(a, b)` | 嵌套 for 循环 |
| 组合选取 | `combinations(items, k)` | 手动嵌套 + 去重 |
| 求和 + 条件 | `sum(x for x in seq if cond)` | 手动 for + if + += |
| 字符串拼接 | `" ".join(words)` | `+=` 循环拼接 |
| 分组累积 | `defaultdict(list)` | 手动 `if key not in d: d[key]=[]` |

---

## 3. 最佳实践

### 3.1 推荐 vs 不推荐写法对比

| 场景 | 不推荐 | 推荐 | 原因 |
|------|--------|------|------|
| 反向遍历 | `for x in seq[::-1]:`（大数据） | `for x in reversed(seq):` | reversed 不复制 |
| 求和 | 手动 `total = 0; for x in seq: total += x` | `sum(seq)` | C 实现，更快 |
| 找第一个匹配 | 手动 for + break + flag | `next((x for x...), None)` | 一行表达完整意图 |
| 字符串拼接 | `result += item + " "` | `" ".join(items)` | O(n) vs O(n²) |
| 存在性检查 | 手动 for + break + bool | `any(cond for x in seq)` | 声明式，短路求值 |
| 多层笛卡尔积 | 三层嵌套 for | `product(a, b, c)` | 语义清晰 |
| 循环体中常量计算 | 在循环内计算 | 提取到循环外 | 减少重复计算 |

### 3.2 常见错误模式及修正

**错误一：对大数据用切片 `[::-1]`**

```python
# 不推荐：百万级列表，[::-1] 创建 100 万元素的副本
for x in big_list[::-1]:
    process(x)
```

修正——用 `reversed`：

```python
for x in reversed(big_list):
    process(x)
```

**错误二：`reversed` 给了非序列对象**

```python
# 错误：zip 对象不是序列
for a, b in reversed(zip(list_a, list_b)):
    ...
# TypeError: 'zip' object is not reversible
```

修正——先转列表：

```python
for a, b in reversed(list(zip(list_a, list_b))):
    ...
```

**错误三：any/all 忘记用生成器表达式**

```python
# 不推荐：any 需要可迭代对象，直接传 False 无意义
if any([x > 10 for x in data]):  # 创建了整个列表再检查
```

修正——用生成器表达式（惰性求值 + 短路）：

```python
if any(x > 10 for x in data):    # 生成器，遇到第一个 True 就停
```

**错误四：循环体越长越不想拆**

```python
# 15 行的循环体，改了又改，后面的人完全不敢动
for record in data:
    # step 1
    # step 2
    # ...
    # step 8
```

修正——每个步骤一个函数，循环体只负责串联：`for r in data: process(transform(validate(r)))`

---

## 4. 原理

### 4.1 reversed 为什么不复制数据

`reversed(seq)` 依赖目标对象的 `__reversed__()` 方法。对于内置序列类型（list、tuple、str、range），这个方法返回一个反向迭代器——只记录原序列的引用和一个指针，不复制数据：

```text
reversed([1, 2, 3]) 的内部结构：

  原序列引用 → [1, 2, 3]
  当前位置指针 → 从末尾开始

  next() 第1次：返回 [2] → 3，指针前移
  next() 第2次：返回 [1] → 2，指针前移
  next() 第3次：返回 [0] → 1，指针前移
  next() 第4次：抛出 StopIteration
```

### 4.2 any/all 的短路机制

`any()` 和 `all()` 内部用 C 实现，遇到能确定结果的值后立即停止迭代：

```text
any(gen):
  next(gen) → False → 继续
  next(gen) → False → 继续
  next(gen) → True  → 返回 True（停止！gen 后面的元素不再计算）

all(gen):
  next(gen) → True  → 继续
  next(gen) → False → 返回 False（停止！gen 后面的元素不再计算）
```

这就是为什么传给 `any/all` 的应该是**生成器表达式**而不是列表推导式——生成器表达式让后面的元素根本不会被计算。

### 4.3 join 为什么比 += 快那么多

```python
# += 方式：每次拼接都分配新字符串
result = ""
for w in ["a", "b", "c"]:
    result += w
# 内存分配："a" → "ab" → "abc"  ← 每次都是新对象

# join 方式：先计算总长度，一次性分配
result = "".join(["a", "b", "c"])
# 内存分配：计算长度 = 3 → 分配 3 字节 → 填充
```

在大数据量下，`join` 是 O(n)，`+=` 是 O(n²)——这个差异从可忽略变成致命。一万个短字符串用 `join` 是毫秒级，用 `+=` 是秒级。

---

## 5. 总结

本文围绕 Python 循环惯用法与技巧，主要介绍了以下内容：

- 反向遍历用 `reversed()`（不复制），而不是 `[::-1]`（创建新列表）或手动索引
- 切片步长 `[::step]` 做跳步遍历，大数据场景下用 `islice` 替代避免内存开销
- 哨兵值模式用特殊标记做提前停止，适用于变长输入场景
- `any()` 和 `all()` 配合生成器表达式替代显式判断循环，声明式语义 + 短路求值
- `next((x for x in seq if cond), default)` 是"找第一个匹配"的最简洁写法
- `sum()`/`max()`/`min()`/`join()` 等内置函数比手动循环更快，应优先使用
- `itertools.chain` 拼接多序列不创建新列表，`product` 替代多层嵌套 for
- 循环不变式外提：不随循环变化的值提到循环外，减少重复计算
- 早退出原则：找到结果立刻 `return` 或 `break`，不做无用功
- 短循环体：超过 5 行考虑提取函数，循环职能单一、便于理解