---
group:
  title: 【10】循环结构
  order: 10
order: 7
title: 字典遍历与多变量解包
nav:
  title: Python基础
  order: 1
---

# 字典遍历与多变量解包

## 1. 介绍

### 1.1 什么是字典遍历与多变量解包

字典（`dict`）是 Python 中最常用的数据结构之一，它以键值对（key-value）形式存储数据。遍历字典是指按一定顺序访问字典中的每一个键值对。多变量解包（Unpacking）是指将可迭代对象（元组、列表等）中的元素**一次性赋值给多个变量**的技术。

当字典遍历与多变量解包结合起来，会让代码变得非常简洁和可读。下面是一个最直观的例子：

```python
student_scores = {"张三": 85, "李四": 92, "王五": 78}

for name, score in student_scores.items():
    print(f"{name}: {score}分")
# 输出：
# 张三: 85分
# 李四: 92分
# 王五: 78分
```

就这短短两行，做到了"逐个取出键和值"——这背后是 `.items()` 与解包语法的协作结果。理解这个协作机制，是掌握本主题的关键。

### 1.2 解包在 Python 中的位置

解包是 Python 循环体系中的重要工具。它不像 `for`/`while` 那样控制循环逻辑，也不像 `break`/`continue` 那样控制流程跳转；它**在循环体内部**改变数据的获取方式——让你一次循环同时拿到多个关联的信息。

```text
Python 循环体系

  ├── 循环结构
  │   ├── for 循环 ─── 遍历可迭代对象
  │   ├── while 循环 ── 基于条件循环
  │   └── 嵌套循环 ─── 多层循环组合
  │
  ├── 流程控制
  │   ├── break ────── 跳出当前循环
  │   ├── continue ─── 跳过本次迭代
  │   └── else 子句 ─── 循环正常结束时执行
  │
  └── 数据获取增强 ← 解包在这里
      ├── 元组解包 ──── a, b = (1, 2)
      ├── 列表解包 ──── a, b = [1, 2]
      └── 字典解包 ──── for k, v in d.items()
```

### 1.3 最简示例：一个完整的遍历流程

把字典的遍历方式从头到尾快速看一遍，建立一个全局印象：

```python
config = {"host": "localhost", "port": 8080, "debug": True}

# 方式 1：遍历键（默认行为）
for key in config:
    print(key)

# 方式 2：只遍历值
for value in config.values():
    print(value)

# 方式 3：同时拿到键和值（items + 解包）
for key, value in config.items():
    print(f"{key} = {value}")
```

这三种方式覆盖了字典遍历的绝大多数场景。接下来的章节会逐一深入。

## 2. 核心内容

### 2.1 字典的三种视图方法

字典提供了三个返回"视图"（view）的方法：`keys()`、`values()` 和 `items()`。它们是理解字典遍历的起点。

**视图不是列表**——视图会**实时反映字典的变化**，且不支持索引访问。

```python
d = {"a": 1, "b": 2}

print(type(d.keys()))    # <class 'dict_keys'>
print(type(d.values()))  # <class 'dict_values'>
print(type(d.items()))   # <class 'dict_items'>
```

**示例**：三种视图的对比

```python
d = {"a": 1, "b": 2}

keys_view = d.keys()
values_view = d.values()
items_view = d.items()

print(f"keys  : {keys_view}")
print(f"values: {values_view}")
print(f"items : {items_view}")

# 实时反映字典修改
d["c"] = 3
print(f"\n添加 c 后 keys: {keys_view}")  # dict_keys(['a', 'b', 'c'])
```

**运行结果**：

```text
keys  : dict_keys(['a', 'b'])
values: dict_values([1, 2])
items : dict_items([('a', 1), ('b', 2)])

添加 c 后 keys: dict_keys(['a', 'b', 'c'])
```

**关键点**：

- `dict_keys` 是键的视图，可迭代、可检查成员（`"a" in keys_view`），不可索引。
- `dict_values` 是值的视图，同样可迭代。注意值可能重复，所以没有"唯一性"保证。
- `dict_items` 是键值对元组的视图，`('a', 1)` 这样的二元组。这是遍历中最常用的视图。
- 所有视图都是**动态的**——修改原字典后视图自动更新。但如果想在遍历的同时修改字典，这个特性会让你踩坑（详见 2.7 节）。

#### 2.1.1 视图的集合操作

`dict_keys` 和 `dict_items` 支持部分集合操作，因为它们中的键是唯一的：

```python
a = {"x": 1, "y": 2, "z": 3}
b = {"y": 20, "z": 30, "w": 40}

# 找公共键（交集）
common = a.keys() & b.keys()
print(f"公共键: {common}")  # {'y', 'z'}

# 只在 a 中的键（差集）
only_in_a = a.keys() - b.keys()
print(f"只在 a 中: {only_in_a}")  # {'x'}

# 所有键的并集
all_keys = a.keys() | b.keys()
print(f"所有键: {all_keys}")  # {'x', 'y', 'z', 'w'}
```

**注意**：`dict_values` 不支持集合操作，因为值可能重复且可能不可哈希。

### 2.2 遍历字典的四种方式

#### 2.2.1 遍历键：`for key in dict`

直接对字典进行 `for` 循环，**默认迭代的是键**：

```python
user = {"name": "张三", "age": 25, "role": "工程师"}

for key in user:
    print(f"{key}: {user[key]}")
# 输出：
# name: 张三
# age: 25
# role: 工程师
```

这是最简洁的写法，等价于 `for key in user.keys()`。如果你只需要键名，这种写法最推荐。

#### 2.2.2 遍历键：`.keys()`

显式调用 `keys()` 也可以达到同样效果，而且代码意图更明确：

```python
for key in user.keys():
    print(key)
```

**何时用 `.keys()` 而非默认遍历**：

- 需要向读者强调"遍历键"这个意图时。
- 需要对键视图做集合操作（如 `user.keys() & admin_keys`）。

#### 2.2.3 遍历值：`.values()`

当你只关心值、不关心对应的键时，用 `.values()`：

```python
scores = {"张三": 85, "李四": 92, "王五": 78}

total = 0
for score in scores.values():
    total += score
    average = total / len(scores)

print(f"总分: {total}, 平均分: {average:.1f}")
# 输出：总分: 255, 平均分: 85.0
```

#### 2.2.4 遍历键值对：`.items()`

这是最常用的方式——同时拿到键和值。常用索引访问方式：

```python
for pair in user.items():
    print(f"键: {pair[0]}, 值: {pair[1]}")
# 输出：
# 键: name, 值: 张三
# 键: age, 值: 25
# 键: role, 值: 工程师
```

但这种写法中 `pair[0]`、`pair[1]` 语义不清晰，容易混淆，而使用解包语法会让键值对的获取方式变得清晰很多。

### 2.3 多变量解包基础

解包（Unpacking）是 Python 的语法特性，允许将可迭代对象的元素一次性赋值给多个变量。

#### 2.3.1 基本解包

```python
# 元组解包
point = (10, 20)
x, y = point
print(f"x={x}, y={y}")  # x=10, y=20

# 列表解包
rgb = [255, 128, 64]
r, g, b = rgb
print(f"R={r}, G={g}, B={b}")  # R=255, G=128, B=64

# 函数返回多值（本质是返回元组）
def get_info():
    return "张三", 25, "杭州"

name, age, city = get_info()
print(f"{name}, {age}岁, {city}")  # 张三, 25岁, 杭州
```

**关键点**：变量数量必须与元素数量匹配，否则抛出 `ValueError`。

```python
a, b = (1, 2, 3)  # ValueError: too many values to unpack (expected 2)
a, b, c = (1, 2)  # ValueError: not enough values to unpack (expected 3, got 2)
```

#### 2.3.2 星号表达式：收集剩余元素

当元素数量不确定或你只想关注"一头一尾"，用 `*` 运算符收集剩余部分：

```python
# 收集中间部分
first, *middle, last = [1, 2, 3, 4, 5]
print(f"第一个: {first}, 中间: {middle}, 最后一个: {last}")
# 第一个: 1, 中间: [2, 3, 4], 最后一个: 5

# 只关注开头
*head, tail = "Python"
print(f"前面: {head}, 最后: {tail}")
# 前面: ['P', 'y', 't', 'h', 'o'], 最后: n

# 只关注结尾
first, *rest = [10, 20, 30, 40]
print(f"第一个: {first}, 剩余: {rest}")
# 第一个: 10, 剩余: [20, 30, 40]
```

`*` 收集的元素总是以**列表**形式呈现，即使只有一个元素。

#### 2.3.3 用下划线忽略不需要的值

如果解包时有几个值不需要，用下划线 `_` 作为"占位符"——这是一种 Python 社区的约定：

```python
# 只关心年份和省份
data = ("张三", 2026, "杭州", "浙江省")
#         ↑ 忽略    ↑ 要     ↑ 忽略    ↑ 要
_, year, _, province = data
print(f"{year}年, {province}")  # 2026年, 浙江省
```

### 2.4 字典遍历中的解包：`for key, value in d.items()`

这是本主题最核心的组合——将 `.items()` 返回的每个键值对元组，在 `for` 循环头部直接解包为两个变量：

```python
student_scores = {"张三": 85, "李四": 92, "王五": 78, "赵六": 88}

for name, score in student_scores.items():
    if score >= 90:
        level = "优秀"
    elif score >= 80:
        level = "良好"
    else:
        level = "一般"
    print(f"{name}: {score}分 ({level})")
# 输出：
# 张三: 85分 (良好)
# 李四: 92分 (优秀)
# 王五: 78分 (一般)
# 赵六: 88分 (良好)
```

**为什么这种写法是推荐的**：

- 索引访问方式 `item[0]`、`item[1]` 没有语义——代码读者需要记住谁是键、谁是值。
- 解包方式 `for name, score in ...` 变量名自说明，一眼看出循环变量分别是什么。

#### 2.4.1 结合 enumerate 加排名

如果遍历时需要序号，把 `enumerate()` 与解包嵌套使用：

```python
# 先按分数排序
sorted_scores = sorted(student_scores.items(), key=lambda x: x[1], reverse=True)

for rank, (name, score) in enumerate(sorted_scores, start=1):
    print(f"第{rank}名: {name} ({score}分)")
# 输出：
# 第1名: 李四 (92分)
# 第2名: 赵六 (88分)
# 第3名: 张三 (85分)
# 第4名: 王五 (78分)
```

注意 `(name, score)` 的括号——`enumerate()` 返回 `(序号, 键值对元组)`，所以最内层需要再解包一层。

### 2.5 嵌套结构的解包遍历

#### 2.5.1 字典的值是元组

当字典存储的是"多个属性打包在一起"的数据时，值本身是元组。解包时需要嵌套写：

```python
# 员工信息：ID → (姓名, 部门, 薪资)
employees = {
    "E001": ("张三", "研发部", 15000),
    "E002": ("李四", "市场部", 12000),
    "E003": ("王五", "研发部", 18000),
}

for emp_id, (name, dept, salary) in employees.items():
    print(f"{emp_id}: {name}/{dept}/¥{salary}")
# 输出：
# E001: 张三/研发部/¥15000
# E002: 李四/市场部/¥12000
# E003: 王五/研发部/¥18000
```

**语法要点**：`for emp_id, (name, dept, salary) in employees.items()` 中，外层解包分离了键与值，内层解包把值（元组）拆成三个变量。

#### 2.5.2 字典的值是字典

更常见的情况是 JSON 风格的数据——值也是字典：

```python
catalog = {
    1001: {"name": "机械键盘", "price": 299, "stock": 50},
    1002: {"name": "鼠标",      "price": 89,  "stock": 120},
    1003: {"name": "显示器",    "price": 1299, "stock": 30},
}

for pid, info in catalog.items():
    print(f"商品{pid}: {info['name']}, ¥{info['price']}, 库存:{info['stock']}")
# 输出：
# 商品1001: 机械键盘, ¥299, 库存:50
# 商品1002: 鼠标, ¥89, 库存:120
# 商品1003: 显示器, ¥1299, 库存:30
```

内层值是一个字典，没有"对齐的字段顺序"可以解包，所以用键访问 `info['name']` 更合适。

#### 2.5.3 列表包含字典

处理多条记录时，列表中每个元素是一个字典：

```python
orders = [
    {"id": "A001", "item": "键盘", "qty": 2, "price": 299},
    {"id": "A002", "item": "鼠标", "qty": 1, "price": 89},
    {"id": "A003", "item": "显示器", "qty": 1, "price": 1299},
]

total = 0
for order in orders:
    amount = order["qty"] * order["price"]
    total += amount
    print(f"订单 {order['id']}: {order['item']} × {order['qty']} = ¥{amount}")
print(f"总金额: ¥{total}")
# 输出：
# 订单 A001: 键盘 × 2 = ¥598
# 订单 A002: 鼠标 × 1 = ¥89
# 订单 A003: 显示器 × 1 = ¥1299
# 总金额: ¥1986
```

### 2.6 zip 并行遍历与解包

`zip()` 函数可以将多个序列"压缩"到一起，配合解包能实现非常优雅的并行遍历：

```python
names = ["产品A", "产品B", "产品C"]
prices = [99, 199, 299]
stocks = [100, 50, 200]

for name, price, stock in zip(names, prices, stocks):
    value = price * stock
    print(f"{name}: ¥{price} × {stock} 件 = ¥{value}")
# 输出：
# 产品A: ¥99 × 100 件 = ¥9900
# 产品B: ¥199 × 50 件 = ¥9950
# 产品C: ¥299 × 200 件 = ¥59800
```

`zip()` 也可以用于两个字典的对比遍历：

```python
stock_db = {"键盘": 50, "鼠标": 120, "显示器": 30}
sold_db = {"键盘": 12, "鼠标": 45, "显示器": 8}

for item, stock in stock_db.items():
    sold = sold_db.get(item, 0)
    print(f"{item}: 库存{stock}, 已售{sold}, 剩余{stock - sold}")
# 输出：
# 键盘: 库存50, 已售12, 剩余38
# 鼠标: 库存120, 已售45, 剩余75
# 显示器: 库存30, 已售8, 剩余22
```

### 2.7 遍历时修改字典的安全策略

这是字典遍历中最容易踩的坑：**在遍历字典的同时删除或新增键**会引发 `RuntimeError`。

```python
d = {"a": 1, "b": 0, "c": 3, "d": 0}

# 错误做法
for key in d:
    if d[key] == 0:
        del d[key]
# RuntimeError: dictionary changed size during iteration
```

**原因**：视图对象是动态的，删除键会同时改变字典和视图，导致迭代器检测到字典大小变化后报错。

#### 2.7.1 安全方案一：拷贝键列表

复制一份键的独立列表，在这个列表上迭代：

```python
d = {"a": 1, "b": 0, "c": 3, "d": 0}

for key in list(d.keys()):
    if d[key] == 0:
        del d[key]
print(d)  # {'a': 1, 'c': 3}
```

`list(d.keys())` 创建了一份静态副本，迭代这个副本不会受原字典变化的影响。

#### 2.7.2 安全方案二：字典推导式（最优雅）

当你需要"按条件过滤"时，字典推导式是最简洁的解决方案：

```python
original = {"a": 1, "b": 0, "c": 3, "d": 0}

filtered = {k: v for k, v in original.items() if v != 0}
print(filtered)  # {'a': 1, 'c': 3}
```

这一行做了三件事：遍历原字典 → 过滤 → 构建新字典。代码意图清晰，而且不会修改原字典。

#### 2.7.3 安全方案三：收集后批量删除

当删除规则较复杂、不适合推导式时，分别收集要删除的键：

```python
scores = {"a": 10, "b": -5, "c": 3, "d": -1, "e": 7}

to_delete = [k for k, v in scores.items() if v < 0]
for key in to_delete:
    del scores[key]
print(scores)  # {'a': 10, 'c': 3, 'e': 7}
```

#### 2.7.4 安全操作：修改值（不增删键）

如果你只修改值、不增删键，遍历本身是安全的：

```python
inventory = {"苹果": 10, "香蕉": 20, "橘子": 15}

for fruit, count in inventory.items():
    inventory[fruit] = count * 2  # 翻倍库存

print(inventory)  # {'苹果': 20, '香蕉': 40, '橘子': 30}
```

这是因为修改已有键的值不会改变字典的大小（键数量不变），所以不会触发 `RuntimeError`。

#### 2.7.5 运行时新增键——用新字典收集

如果遍历时想新增键，最安全的做法是创建新字典：

```python
grades = {"张三": 85, "李四": 92, "王五": 78}
expanded = {}

for name, score in grades.items():
    expanded[name] = score
    expanded[f"{name}_等级"] = "优秀" if score >= 90 else "及格"

print(expanded)
# {'张三': 85, '张三_等级': '及格', '李四': 92, '李四_等级': '优秀', '王五': 78, '王五_等级': '及格'}
```

### 2.8 字典视图的迭代顺序

Python 3.7 起，字典**保证**迭代顺序与插入顺序一致。这是从 Python 3.6 的 CPython 实现细节升级为语言规范的。

```python
d = {}
d["c"] = 3
d["a"] = 1
d["b"] = 2

for key in d:
    print(key, end=" ")  # c a b  （按插入顺序，不是按字母顺序）
```

这意味着你可以安全地依赖字典的插入顺序。需要排序时使用 `sorted()`：

```python
for key in sorted(d):
    print(f"{key}: {d[key]}")  # a: 1, b: 2, c: 3（字母序）
```

## 3. 最佳实践

### 3.1 推荐 vs 不推荐写法对比

| 场景 | 不推荐 | 推荐 | 原因 |
|------|--------|------|------|
| 遍历键值对 | `for item in d.items():` 然后 `item[0]`、`item[1]` | `for k, v in d.items():` | 解包使变量语义清晰 |
| 判断键是否存在 | `for k in d:` 然后检查 `k == target` | `if target in d:` | 直接检查比遍历高效 |
| 过滤删除 | `for k in d:` 然后 `del d[k]` | 字典推导式或 `list(d.keys())` | 避免 RuntimeError |
| 遍历纯值 | `for k in d:` 然后访问 `d[k]` | `for v in d.values():` | 意图清晰，少一次键查找 |
| 嵌套结构遍历 | `for k, v in d.items():` 然后 `v[0]`、`v[1]` | `for k, (a, b) in d.items():` | 嵌套解包一步到位 |

#### 3.1.1 典型对比示例

**不推荐写法**：索引访问，语义模糊

```python
for item in user.items():
    key = item[0]
    value = item[1]
    print(f"{key}: {value}")
```

**推荐写法**：解包，一目了然

```python
for key, value in user.items():
    print(f"{key}: {value}")
```

两者功能相同，但推荐写法节省了 40% 的代码行数，且变量名直接表达了含义。

### 3.2 常见错误模式及修正

**错误一：在遍历中直接删除键**

```python
# 错误：RuntimeError 运行时异常
for key in data:
    if is_expired(data[key]):
        del data[key]
```

修正方式——用推导式：

```python
data = {k: v for k, v in data.items() if not is_expired(v)}
```

**错误二：解包数量不匹配**

```python
# 错误：某个键值对的值是三元组，忘了解包内层
for emp_id, name, dept, salary in employees.items():
    # TypeError: cannot unpack non-iterable ...
```

修正方式——检查值类型，用嵌套解包：

```python
for emp_id, (name, dept, salary) in employees.items():
```

**错误三：解包变量名遮蔽外层变量**

```python
name = "管理员"

for name, score in students.items():  # 内层 name 遮蔽了外层的 name
    print(f"{name}: {score}")

print(name)  # 这里是循环中最后一个 name，不是"管理员"
```

修正方式——用不冲突的变量名：

```python
admin_name = "管理员"

for student_name, score in students.items():
    print(f"{student_name}: {score}")
```

**错误四：假设字典有序用于排序**

```python
# 不可靠：字典迭代顺序是插入顺序，不是排序顺序
for name, score in students.items():
    print(f"{name}: {score}")  # 不是按分数排序的
```

修正方式——显式排序：

```python
for name, score in sorted(students.items(), key=lambda x: x[1], reverse=True):
    print(f"{name}: {score}")
```

### 3.3 可读性、性能取舍建议

**解包变量命名**：变量名应该足够描述性，但不必过长。用场景语义命名：

```python
# 好：语义清晰
for product_id, (name, price, stock) in catalog.items():
    ...

# 差：过短或无意义
for i, (j, k, l) in catalog.items():        # i, j, k, l 不知道是什么
for pid, (n, p, s) in catalog.items():       # 每个变量都要靠猜
```

**`keys()` 是否显式调用**：默认 `for key in d` 更简洁；但如果代码中有 `.values()` 或 `.items()` 调用，为了一致性，可以统一显式写 `for key in d.keys()`。

**大字典遍历性能**：视图对象是 O(1) 创建的，不会复制整个字典的数据。`for k, v in d.items()` 每个键值对元组临时创建，对性能几乎没有影响。

## 4. 原理

### 4.1 为什么 `for k, v in d.items()` 能解包

这个解包机制依赖 Python 的两个核心概念：**迭代器协议**和**元组解包的赋值语法**。

来看 `.items()` 到底返回了什么：

```python
d = {"a": 1, "b": 2}

# 首先，items() 返回一个视图
items_view = d.items()

# 其次，迭代这个视图时，每次产出一个二元组
for item in items_view:
    print(type(item), item)

# 输出：
# <class 'tuple'> ('a', 1)
# <class 'tuple'> ('b', 1)
```

现在，Python 的赋值解包可以拆任何可迭代对象：

```python
key, value = ('a', 1)   # 元组解包
print(key, value)        # a 1
```

把这两步合并——在 `for` 循环头部直接做解包：

```python
for key, value in d.items():
    # 等价于两步：
    # item = d.items().__next__()  得到 ('a', 1)
    # key, value = item            解包成两个变量
```

**所以 `for key, value in d.items()` 完全等价于**：

```python
for item in d.items():
    key, value = item
```

只是在循环头部写解包更简洁、更符合 Python 风格罢了。

### 4.2 解包赋值的内部执行顺序

解包时，Python 先计算等号右侧的值，再按从左到右的顺序赋值。这一点对理解交换变量的原理很有帮助：

```python
a, b = b, a  # 先计算右侧 (b, a) 生成临时元组，再赋值给左侧 a, b
```

在 `for` 循环中也一样：

```python
for name, score in sorted_scores:  # 先获取当前迭代的元素，再解包
    print(name, score)
```

每次迭代的流程：

```text
sorted_scores.__next__() → ("张三", 85)
name, score = ("张三", 85)  → name="张三", score=85
... 循环体执行 ...
sorted_scores.__next__() → ("李四", 92)
name, score = ("李四", 92)  → name="李四", score=92
... 循环体执行 ...
...
```

### 4.3 为什么遍历中不能直接修改字典大小

遍历字典本质上是使用**迭代器**。迭代器内部持有一个状态（当前读取位置），当字典大小变化时，迭代器检测到不一致就抛出 `RuntimeError`：

```python
d = {"a": 1, "b": 2, "c": 3}

for key in d:
    if key == "a":
        del d["b"]   # 删了另一个键，迭代器状态失效
        # RuntimeError: dictionary changed size during iteration
```

迭代器的工作原理：

```text
字典初始状态: {"a": 1, "b": 2, "c": 3}
迭代器位置: → a → b → c

第 1 次迭代: 读到 a
  del d["b"] 后字典: {"a": 1, "c": 3}
  迭代器期望下一次读 "b"，但 "b" 已经不存在 → RuntimeError
```

两种安全策略的底层原理：

- **`list(d.keys())` 创建快照**：把键复制到一个独立的列表里，迭代这个静态列表。原字典怎么改都不会影响列表。
- **字典推导式创建新字典**：不修改原字典，遍历原字典的每一项，把符合条件的写到新字典里。

---

## 5. 总结

本文围绕字典遍历与多变量解包，主要介绍了以下内容：

- 字典有三种视图方法：`keys()`、`values()`、`items()`，它们返回动态视图，实时反映字典变化
- `for key in d` 默认遍历键；`for v in d.values()` 最适合同计/聚合值；`for k, v in d.items()` 是遍历键值对的标准方式
- 多变量解包（`a, b = (1, 2)`）能消除 `item[0]` / `item[1]` 这类无语义的索引访问，让变量名自说明含义
- `for k, v in d.items()` 把遍历与解包结合，是处理键值对场景最推荐的写法
- 嵌套结构（字典值为元组/字典、列表含字典）用嵌套解包 `for k, (a, b) in d.items()` 可以一步拆到底
- 星号表达式（`*middle`）收集剩余元素，下划线（`_`）忽略不需要的值
- `zip()` 实现并行遍历多序列，配合解包更简洁
- 遍历中直接删键会引发 `RuntimeError`，安全的做法是拷贝键列表、使用字典推导式、或收集后批量删除
- 解包依赖 Python 的迭代器协议和元组解包赋值语法，每次迭代先把 `.items()` 返回的二元组解包成两个变量