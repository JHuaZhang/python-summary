---
group:
  title: 【05】元组介绍
  order: 5
order: 1
title: 元组概述与基本概念
nav:
  title: Python基础
  order: 1
---

# 元组概述与基本概念

## 1. 介绍

### 1.1 什么是元组

元组（`tuple`）是 Python 中最基础的**不可变序列类型**。它和列表几乎一模一样——有序、允许任意类型、允许重复——唯一的区别是：元组一旦创建，就**不能增、删、改元素**。如果说列表是"可以随时改的万能容器"，那元组就是"写好就锁定的只读容器"。

```python
# 元组可以装任何东西，和列表一样
point = (3, 4)                         # 数字
colors = ("red", "green", "blue")      # 字符串
mixed = (1, "hello", 3.14, True)       # 混合类型
nested = ((1, 2), (3, 4))              # 嵌套元组
empty = ()                             # 空元组

print(type(point))     # <class 'tuple'>
print(type(empty))     # <class 'tuple'>
```

元组的"不可变"意味着你不能就地修改它——不能 `append`、不能 `insert`、不能 `del`、不能通过索引赋值修改元素。任何"修改"操作都是创建一个新元组：

```python
# 元组不可变：修改操作创建新对象，id 变化
t = (1, 2, 3)
print(id(t))        # 地址 A
t = t + (4,)        # 拼接，创建新元组
print(id(t))        # 地址 B（不同，新对象）
print(t)            # (1, 2, 3, 4)

# 对比列表：就地修改，id 不变
lst = [1, 2, 3]
print(id(lst))      # 地址 C
lst.append(4)       # 就地追加
print(id(lst))      # 地址 C（同，就地改）
print(lst)          # [1, 2, 3, 4]
```

理解元组，归根结底是理解它的**不可变性**——不可变到底意味着什么、不可变的边界在哪里、不可变带来了哪些优势。这是本篇的核心。

### 1.2 元组的基本特性

元组有四条核心特性，与列表完全一致，唯独"可变"这一条不同：

```python
t = (3, 1, 4, 1, 5, 9, 2, 6)

# 特性一：有序——元素有固定位置（索引）
print(t[0])     # 3（第一个元素）
print(t[-1])    # 6（最后一个元素）

# 特性二：不可变——不能就地增删改
# t[0] = 99     # TypeError!
# t.append(7)   # AttributeError!

# 特性三：允许任意类型
mixed = (1, "hello", 3.14, True, None, [1, 2])
print(mixed)    # 全部合法

# 特性四：允许重复
dup = (1, 1, 1, "a", "a")
print(dup)      # 重复元素完全合法
```

| 特性 | 说明 | 与列表对比 |
|------|------|-----------|
| 有序 | 元素有固定索引位置 | 相同 |
| 不可变 | 不能就地增删改元素 | 列表可变 |
| 任意类型 | 元素可以是任何对象 | 相同 |
| 允许重复 | 同值可多次出现 | 相同 |

### 1.3 元组与列表/字符串的对比

元组、列表、字符串都是序列类型，但可变性不同，导致行为差异：

```python
# --- 共性：都支持索引、切片、len、in ---

s = "hello"
t = (1, 2, 3)
lst = [4, 5, 6]

print(s[0])       # 'h'
print(t[0])       # 1
print(lst[0])     # 4

print(s[1:3])     # 'el'
print(t[1:3])     # (2, 3)
print(lst[1:3])   # [5, 6]

print(len(s), len(t), len(lst))   # 5 3 3

# --- 差异：可变性 ---

# 列表可就地改
lst[0] = 99
print(lst)        # [99, 5, 6]

# 元组不能就地改
# t[0] = 99       # TypeError: 'tuple' object does not support item assignment

# 字符串不能就地改
# s[0] = "H"      # TypeError: 'str' object does not support item assignment
```

**可变性差异带来的连锁影响**：

| 维度 | list（可变） | tuple / str（不可变） |
|------|-------------|---------------------|
| 就地修改 | 支持（append/del/赋值） | 不支持 |
| 可哈希 | 不可哈希（不能做 dict 键） | 可哈希（可做 dict 键） |
| 修改操作 | 原地改，id 不变 | 返回新对象，id 变 |
| `+=` 行为 | 就地 extend（`__iadd__`） | 创建新对象（`__add__`） |
| 内存占用 | 较大（预分配额外空间） | 较小（无过度分配） |
| 安全性 | 共享引用有风险 | 不可变，共享安全 |

```python
# 可哈希性对比
# d = {[1, 2]: "value"}   # TypeError: unhashable type: 'list'
d = {(1, 2): "value"}     # OK，tuple 可哈希
d = {"key": "value"}      # OK，str 可哈希

# += 行为对比
lst = [1, 2]
print(id(lst))      # 地址 A
lst += [3]           # 就地 extend，id 不变
print(id(lst), lst)  # 地址 A, [1, 2, 3]

t = (1, 2)
print(id(t))         # 地址 B
t += (3,)            # 创建新 tuple，id 变
print(id(t), t)      # 地址 C（不同），(1, 2, 3)
```

### 1.4 元组在 Python 中的地位和常见用途

元组是 Python 中使用频率极高的数据结构。尽管它看起来像"不能改的列表"，但它的不可变性赋予了它独特的角色——**固定数据的载体**。

```python
# 1. 函数多返回值（Python 函数返回多个值时，自动打包成元组）
def min_max(numbers):
    return (min(numbers), max(numbers))

scores = [85, 92, 78, 90]
low, high = min_max(scores)   # 元组解包
print(f"最低: {low}, 最高: {high}")  # 最低: 78, 最高: 92

# 2. 坐标点（固定结构，不应被修改）
origin = (0, 0)
point_a = (3, 4)
print(f"原点: {origin}, 点A: {point_a}")

# 3. RGB 颜色值
red = (255, 0, 0)
white = (255, 255, 255)
print(f"红色: {red}, 白色: {white}")

# 4. 元组做字典键（列表不能）
city_grid = {
    (0, 0): "北京",
    (1, 0): "上海",
    (0, 1): "广州",
}
print(city_grid[(0, 0)])   # 北京

# 5. 数据库记录 / CSV 行（每条记录字段固定）
student = ("张三", 20, "计算机科学", 90.5)
name, age, major, score = student
print(f"{name}, {age}岁, {major}, {score}分")

# 6. 交换变量（元组解包的经典用法）
a, b = 10, 20
a, b = b, a   # 右侧打包成 (20, 10)，再解包给 a, b
print(f"a={a}, b={b}")  # a=20, b=10

# 7. 字符串格式化的 % 运算符
info = "姓名: %s, 年龄: %d" % ("Alice", 30)
print(info)   # 姓名: Alice, 年龄: 30
```

每当数据"创建后不应被修改"时，元组就是比列表更好的选择——它从语言层面防止了意外修改，并且可以作为字典键使用。

---

## 2. 核心内容

### 2.1 元组的基本操作速览

先一览元组最常用的操作，建立全局认识：

```python
# ========== 创建 ==========
t1 = (1, 2, 3)                # 字面量
t2 = tuple(range(5))          # tuple() 构造
t3 = 1, 2, 3                  # 不用括号（逗号决定元组）
t4 = ()                       # 空元组
t5 = (42,)                    # 单元素元组（必须加逗号）

# ========== 索引 ==========
print(t1[0])                  # 1（正向索引）
print(t1[-1])                 # 3（负索引）

# ========== 切片 ==========
print(t1[0:2])               # (1, 2)（左闭右开）
print(t1[::2])               # (1, 3)（步长 2）
print(t1[::-1])              # (3, 2, 1)（反转）

# ========== 拼接与重复 ==========
print((1, 2) + (3, 4))       # (1, 2, 3, 4)（+ 创建新元组）
print((1, 2) * 2)            # (1, 2, 1, 2)（* 重复创建新元组）

# ========== 查询 ==========
print(len(t1))               # 3（长度）
print(2 in t1)               # True（成员判断）
print(t1.count(1))           # 1（计数）
print(t1.index(2))           # 1（首次出现的索引）

# ========== 解包 ==========
a, b, c = t1                 # 基本解包
first, *rest = (1, 2, 3, 4)  # 星号解包
```

**元组操作时间复杂度速览**：

| 操作 | 时间复杂度 | 说明 |
|------|-----------|------|
| 索引 `t[i]` | O(1) | 直接数组偏移访问 |
| 切片 `t[a:b]` | O(k) | k 为切片长度，创建新元组 |
| `len(t)` | O(1) | 直接读取 ob_size 字段 |
| `x in t` | O(n) | 线性扫描 |
| `t1 + t2` | O(n+m) | 创建新元组，复制两个的元素 |
| `t * n` | O(n×k) | 创建新元组，复制 n 次 |
| `t.count(x)` | O(n) | 线性扫描 |
| `t.index(x)` | O(n) | 线性扫描直到找到 |

### 2.2 元组的创建方式详解

元组有多种创建方式，其中有一个经典陷阱需要特别注意。

**字面量创建（最常用）**

用圆括号 `()` 把元素括起来，逗号分隔：

```python
# 标准创建
point = (3, 4)
colors = ("red", "green", "blue")

# 空元组
empty = ()

# 嵌套元组
matrix = ((1, 2, 3), (4, 5, 6), (7, 8, 9))
```

**不加括号也能创建**

Python 中**逗号才是元组的标志**，圆括号在很多情况下只是为了视觉清晰：

```python
# 逗号决定元组
t = 1, 2, 3
print(t)            # (1, 2, 3)
print(type(t))      # <class 'tuple'>

# 函数返回值不用加括号
def get_info():
    return "Alice", 30, 95.5   # 返回元组，不需要括号

info = get_info()
print(info)          # ('Alice', 30, 95.5)
print(type(info))    # <class 'tuple'>
```

**单元素元组陷阱**

这是元组最常见的坑——**单元素元组必须加逗号**，否则 Python 把圆括号当作数学分组符号：

```python
# 正确：单元素元组
single = (42,)
print(type(single))    # <class 'tuple'>
print(single)          # (42,)

# 错误：这只是整数 42，不是元组
not_tuple = (42)
print(type(not_tuple)) # <class 'int'>
print(not_tuple)       # 42

# 对比：列表不需要逗号
single_list = [42]
print(type(single_list))  # <class 'list'>
```

原因：`(42)` 在 Python 中等同于数学表达式 `42` 外加括号，和 `3 * (4 + 5)` 中的括号一样。加上逗号 `(42,)` 才明确告诉 Python "这是一个元组"。

**tuple() 函数从可迭代对象创建**

`tuple()` 接收任何可迭代对象，逐个取出元素放入新元组：

```python
# 从字符串创建
chars = tuple("hello")
print(chars)    # ('h', 'e', 'l', 'l', 'o')

# 从列表创建
from_list = tuple([1, 2, 3])
print(from_list)  # (1, 2, 3)

# 从 range 创建
from_range = tuple(range(5))
print(from_range)  # (0, 1, 2, 3, 4)

# 从字典创建（默认取键）
from_dict = tuple({"a": 1, "b": 2})
print(from_dict)  # ('a', 'b')

# 空元组
empty = tuple()
print(empty)     # ()
```

### 2.3 元组的有序性：索引与切片

元组是有序序列，支持完整的索引和切片操作，行为与列表完全一致。

**索引访问**

```python
colors = ("red", "green", "blue", "yellow", "purple")

# 正向索引（从 0 开始）
print(colors[0])     # red
print(colors[2])     # blue

# 负索引（从 -1 开始，-1 是最后一个）
print(colors[-1])    # purple
print(colors[-2])    # yellow

# 索引越界会报错
# print(colors[10])  # IndexError: tuple index out of range
```

**切片操作**

```python
colors = ("red", "green", "blue", "yellow", "purple")

# 基本切片：左闭右开
print(colors[0:3])    # ('red', 'green', 'blue')

# 省略起始 / 结束
print(colors[:2])     # ('red', 'green')
print(colors[2:])     # ('blue', 'yellow', 'purple')

# 步长
print(colors[::2])    # ('red', 'blue', 'purple')
print(colors[1::2])   # ('green', 'yellow')

# 负步长（反转）
print(colors[::-1])   # ('purple', 'yellow', 'blue', 'green', 'red')

# 切片不会越界报错，超出范围自动截断
print(colors[0:100])  # ('red', 'green', 'blue', 'yellow', 'purple')
```

切片操作总是返回一个**新元组**，不会修改原元组。

**嵌套元组的访问**

```python
# 二维坐标元组
grid = ((1, 2, 3), (4, 5, 6), (7, 8, 9))

# 先取行，再取列
print(grid[0])        # (1, 2, 3)（第一行）
print(grid[0][0])     # 1（第一行第一列）
print(grid[1][2])     # 6（第二行第三列）

# 对行切片
print(grid[0:2])      # ((1, 2, 3), (4, 5, 6))（前两行）
```

### 2.4 元组的不可变性：定义与边界

不可变性是元组最重要的特性，但"不可变"这三个字需要精确理解——它指的是**元组本身的引用结构不可变**，而不是"元组里所有东西都不能变"。

**不可变的直接表现**

```python
t = (10, 20, 30)

# 不能通过索引修改元素
try:
    t[0] = 99
except TypeError as e:
    print(f"t[0] = 99 → {e}")
    # 'tuple' object does not support item assignment

# 不能追加元素（没有 append/extend/insert 方法）
try:
    t.append(40)
except AttributeError as e:
    print(f"t.append(40) → {e}")
    # 'tuple' object has no attribute 'append'

# 不能删除元素
try:
    del t[0]
except TypeError as e:
    print(f"del t[0] → {e}")
    # 'tuple' object doesn't support item deletion
```

**不可变的边界：可变元素陷阱**

元组本身的引用结构不可变，但如果元素是可变对象（list/dict/set），元素**内部**是可以修改的——元组只是持有引用，引用指向的对象自己怎么变，元组管不了：

```python
# 元组中包含可变的 list
t = (1, [2, 3], "hello")
print(t)    # (1, [2, 3], 'hello')

# 修改元组内的 list → 合法！
t[1].append(99)
print(t)    # (1, [2, 3, 99], 'hello')

# 元组本身的引用没变，变的是引用指向的 list 内部
# t[1] 仍然指向同一个 list 对象，只是 list 的内容变了
```

用内存图直观理解：

```text
元组 t = (1, [2, 3], "hello")

元组对象 t
├─ 槽位 0 → int 1            （不可变，安全）
├─ 槽位 1 → list [2, 3]      （可变！内部可改）
└─ 槽位 2 → str "hello"      （不可变，安全）

执行 t[1].append(99) 后：
├─ 槽位 0 → int 1            （没变）
├─ 槽位 1 → list [2, 3, 99]  （同一个 list 对象，但内部多了 99）
└─ 槽位 2 → str "hello"      （没变）

元组的"不可变"是指：槽位里存的引用不能换。
但引用指向的对象如果能变，那就阻止不了。
```

**判断规则**：

| 元素类型 | 元组内是否可"变" | 原因 |
|---------|-----------------|------|
| int/float/bool | 不可变 | 不可变对象，无法就地修改 |
| str | 不可变 | 不可变对象 |
| tuple（内部全不可变） | 不可变 | 递归不可变 |
| list | **可变** | 可变对象，内部可增删改 |
| dict | **可变** | 可变对象 |
| set | **可变** | 可变对象 |
| tuple（内部含可变） | **可变** | 外层不可变但内层可改 |

### 2.5 元组的拼接与重复

元组虽然不可变，但可以通过 `+` 和 `*` 运算符创建新元组。

**拼接：`+` 运算符**

```python
a = (1, 2, 3)
b = (4, 5, 6)

# + 创建新元组，不修改原来的
c = a + b
print(c)        # (1, 2, 3, 4, 5, 6)
print(a)        # (1, 2, 3)  原元组不变
print(b)        # (4, 5, 6)  原元组不变

# 拼接必须两边都是元组
# a + [4, 5]    # TypeError: can only concatenate tuple (not "list") to tuple
```

**重复：`*` 运算符**

```python
# 重复 n 次
base = (0,)
print(base * 5)     # (0, 0, 0, 0, 0)

pattern = (1, 2)
print(pattern * 3)  # (1, 2, 1, 2, 1, 2)

# * 0 得到空元组
print((1, 2) * 0)   # ()
```

**`+=` 的行为**

```python
# 元组的 += 创建新元组（不是就地修改）
t = (1, 2)
print(id(t))        # 地址 A
t += (3,)
print(id(t), t)      # 地址 B（不同！）, (1, 2, 3)

# 对比列表的 += 就地修改
lst = [1, 2]
print(id(lst))       # 地址 C
lst += [3]
print(id(lst), lst)  # 地址 C（相同！）, [1, 2, 3]
```

元组的 `+=` 本质是 `t = t + (3,)`——先创建新元组 `t + (3,)`，再把变量 `t` 重新指向新对象。列表的 `+=` 是调用 `__iadd__` 就地 extend，id 不变。

### 2.6 元组的成员判断与比较

**成员判断：`in` / `not in`**

```python
t = ("apple", "banana", "cherry")

print("banana" in t)     # True
print("grape" in t)      # False
print("grape" not in t)  # True

# in 对嵌套元组只判断外层
nested = ((1, 2), (3, 4))
print((1, 2) in nested)  # True（(1,2) 是外层的一个元素）
print(1 in nested)       # False（1 不是外层的元素，外层元素是元组）
```

**比较运算**

元组支持 `==`、`!=`、`<`、`>`、`<=`、`>=` 比较运算，规则是**逐元素比较**（lexicographic order，字典序）：

```python
# 相等比较：逐元素比对
print((1, 2, 3) == (1, 2, 3))   # True
print((1, 2, 3) == (1, 2, 4))   # False
print((1, 2) == (1, 2, 3))      # False（长度不同）

# 大小比较：从左到右逐个比较，遇到不同就定胜负
print((1, 2, 3) < (1, 2, 4))    # True（第三个元素 3 < 4）
print((1, 2) < (1, 2, 3))       # True（前两个相同，短的更小）
print((1, 3) < (1, 2, 0))       # False（第二个元素 3 > 2，直接判定）
print((2,) > (1, 9, 9))         # True（第一个元素 2 > 1，直接判定）

# 混合类型比较可能报错
# (1, "a") < (1, 2)  # TypeError: '<' not supported between 'str' and 'int'
```

### 2.7 元组的两个公开方法：count 和 index

元组只有两个公开方法——`count()` 和 `index()`。列表有 11 个公开方法，元组只有这 2 个，因为所有涉及修改的方法（append/extend/insert/pop/remove/sort/reverse/clear/copy）对不可变的元组都没有意义。

**count(x)：统计元素出现次数**

```python
t = (1, 2, 3, 2, 2, 4, 2)

print(t.count(2))    # 4（2 出现了 4 次）
print(t.count(5))    # 0（5 不存在，返回 0）
print(t.count(1))    # 1
```

参数和返回值：

| 参数 | 类型 | 说明 |
|------|------|------|
| `x` | 任意 | 要统计的元素值 |

| 返回值 | 说明 |
|--------|------|
| `int` | 元素在元组中出现的次数，不存在则返回 0 |

**index(x, start, stop)：查找元素首次出现的索引**

```python
t = ("a", "b", "c", "b", "d")

# 基本用法：找第一个匹配的位置
print(t.index("b"))      # 1（"b" 第一次出现在索引 1）

# 指定搜索范围
print(t.index("b", 2))   # 3（从索引 2 开始找，"b" 在索引 3）
print(t.index("b", 0, 2)) # 1（在 [0, 2) 范围内找，"b" 在索引 1）

# 元素不存在会报错
try:
    t.index("z")
except ValueError as e:
    print(f"t.index('z') → {e}")
    # tuple.index(x): x not in tuple
```

参数和返回值：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `x` | 任意 | 无（必传） | 要查找的元素值 |
| `start` | int | 0 | 搜索起始位置 |
| `stop` | int | len(tuple) | 搜索结束位置（不包含） |

| 返回值 | 说明 |
|--------|------|
| `int` | 元素首次出现的索引；不存在则抛出 `ValueError` |

**count 与 index 对比**

| 特性 | `count(x)` | `index(x)` |
|------|-----------|-----------|
| 返回 | 出现次数 | 首次出现的位置 |
| 元素不存在 | 返回 0 | 抛出 `ValueError` |
| 支持范围限定 | 不支持 | 支持（start, stop） |
| 时间复杂度 | O(n) | O(n)（找到即停） |

### 2.8 元组的可哈希性

可哈希性是元组区别于列表的一个关键特性——**元组可以被哈希，可以用作字典的键或集合的元素**。

**什么是可哈希**

一个对象"可哈希"意味着它实现了 `__hash__` 方法，能通过 `hash()` 函数计算出一个固定整数。可哈希对象必须满足：**生命周期内哈希值不变**，这与"不可变"天然对应。

```python
# 元组可哈希
print(hash((1, 2, 3)))     # 一个整数，如 529344067295497451

# 字符串可哈希
print(hash("hello"))       # 一个整数

# 列表不可哈希
try:
    hash([1, 2, 3])
except TypeError as e:
    print(f"hash([1,2,3]) → {e}")
    # unhashable type: 'list'
```

**元组做字典键**

```python
# 用坐标作为字典键
locations = {
    (0, 0): "原点",
    (3, 4): "点A",
    (6, 8): "点B",
}

print(locations[(3, 4)])   # 点A

# 添加新坐标
locations[(10, 10)] = "点C"
print(locations)           # {(0, 0): '原点', (3, 4): '点A', (6, 8): '点B', (10, 10): '点C'}
```

**元组做集合元素**

```python
# 集合中存坐标点
points = {(0, 0), (1, 1), (2, 2), (1, 1)}
print(points)   # {(0, 0), (1, 1), (2, 2)}  —— 自动去重
```

**含可变元素的元组不可哈希**

```python
# 元组本身不可变，但如果元素是可变对象，整个元组就不可哈希
try:
    hash((1, [2, 3]))
except TypeError as e:
    print(f"hash((1, [2, 3])) → {e}")
    # unhashable type: 'list'

# 含 list 的元组不能做字典键
try:
    d = {(1, [2, 3]): "value"}
except TypeError as e:
    print(f"字典键含 list → {e}")
    # unhashable type: 'list'
```

**可哈希性规则**：

| 对象 | 可哈希 | 条件 |
|------|--------|------|
| int/float/bool | 是 | 始终可哈希 |
| str | 是 | 始终可哈希 |
| tuple | **取决于元素** | 元素全部可哈希时，元组可哈希 |
| list | 否 | 不可变对象才可哈希 |
| dict | 否 | 不可变对象才可哈希 |
| set | 否 | 不可变对象才可哈希 |
| frozenset | 是 | 不可变集合，始终可哈希 |

### 2.9 元组的解包

元组解包（unpacking）是 Python 中最优雅的语法之一——把元组的元素一次性赋值给多个变量。

**基本解包**

```python
# 一一对应解包
t = ("Alice", 30, 95.5)
name, age, score = t
print(name)   # Alice
print(age)    # 30
print(score)  # 95.5

# 变量数量必须匹配
# a, b = (1, 2, 3)   # ValueError: too many values to unpack
# a, b, c, d = (1, 2, 3)  # ValueError: not enough values to unpack
```

**星号解包（`*` 收集剩余）**

```python
# * 收集剩余元素为一个列表
first, *rest = (1, 2, 3, 4, 5)
print(first)   # 1
print(rest)    # [2, 3, 4, 5]  —— 注意是 list，不是 tuple

# 星号在中间
first, *middle, last = (1, 2, 3, 4, 5)
print(first)   # 1
print(middle)  # [2, 3, 4]
print(last)    # 5

# 只要最后一个
*all_but_last, last = (1, 2, 3, 4, 5)
print(all_but_last)  # [1, 2, 3, 4]
print(last)          # 5
```

**用 `_` 忽略不需要的值**

```python
# 只需要第一个和第三个
t = ("Alice", 30, 95.5, "CS")
name, _, score, _ = t
print(name)   # Alice
print(score)  # 95.5
```

**交换变量**

```python
# 元组解包的经典应用：交换两个变量
a, b = 10, 20
a, b = b, a
print(f"a={a}, b={b}")   # a=20, b=10

# 交换三个变量
a, b, c = 1, 2, 3
a, b, c = c, a, b
print(f"a={a}, b={b}, c={c}")  # a=3, b=1, c=2
```

交换变量的原理：右侧 `b, a` 先打包成元组 `(20, 10)`，然后解包赋值给左侧的 `a, b`。

### 2.10 元组与列表的内存对比

元组的不可变性让它比列表更节省内存——不需要预留额外空间给未来的 `append`，也不需要维护 `allocated` 字段。

```python
import sys

# 空容器对比
print(f"空元组 (): {sys.getsizeof(())} 字节")      # 40 字节
print(f"空列表 []: {sys.getsizeof([])} 字节")      # 56 字节

# 相同元素对比
print(f"3元素元组: {sys.getsizeof((1, 2, 3))} 字节")  # 64 字节
print(f"3元素列表: {sys.getsizeof([1, 2, 3])} 字节")  # 88 字节
```

差距的来源：

| 维度 | tuple | list |
|------|-------|------|
| 过度分配 | 无（恰好分配） | 有（预分配额外槽位） |
| allocated 字段 | 无 | 有（记录容量） |
| 对象头 | 较小 | 较大（多维护字段） |
| GC 追踪 | 无需追踪（不可变） | 需追踪（可能含循环引用） |

列表的 `sys.getsizeof` 包含了预分配的空槽位（过度分配），元组恰好分配——这也是元组比列表轻量的原因之一。

---

## 3. 最佳实践

### 3.1 什么时候用元组，什么时候用列表

| 场景 | 推荐 | 原因 |
|------|------|------|
| 数据创建后不应被修改 | 元组 | 不可变性提供保护 |
| 需要频繁增删改元素 | 列表 | 元组不支持修改 |
| 需要做字典键 / 集合元素 | 元组 | 元组可哈希，列表不可 |
| 函数多返回值 | 元组 | 惯例，简洁 |
| 坐标、颜色、记录等固定结构 | 元组 | 语义清晰，防止意外修改 |
| 需要动态收集数据 | 列表 | append/extend 灵活 |
| 数据流式到来，大小未知 | 列表 | 逐步 append |

```python
# 好：固定结构用元组
RGB_RED = (255, 0, 0)
ORIGIN = (0, 0)

# 好：需要修改用列表
shopping_cart = []
shopping_cart.append("苹果")
shopping_cart.append("香蕉")

# 好：元组做字典键
distances = {
    (0, 0): 0,
    (3, 4): 5,
    (6, 8): 10,
}

# 坏：用列表存固定不变的坐标（应该用元组）
origin = [0, 0]   # 可变，可能被意外修改
```

### 3.2 单元素元组的陷阱

```python
# 坏：忘记加逗号
x = (42)        # 这是 int 42，不是元组！
print(type(x))  # <class 'int'>

# 好：加逗号
x = (42,)       # 这是单元素元组
print(type(x))  # <class 'tuple'>

# 好习惯：即使不加括号，逗号也能保证
x = 42,         # 不加括号但有逗号，也是元组
print(type(x))  # <class 'tuple'>
```

### 3.3 不要试图修改元组内的可变元素

```python
# 坏：虽然能改元组内的 list，但破坏了元组的"不可变"语义
t = (1, [2, 3], "hello")
t[1].append(99)   # 合法但容易让人困惑

# 好：如果需要可变，就用列表
lst = [1, [2, 3], "hello"]
lst[1].append(99)  # 语义一致，列表本就可变

# 好：如果确实需要"不可变"的序列，用全不可变元素
t = (1, (2, 3), "hello")   # 内层也用元组
# t[1].append(99)          # AttributeError，无法修改
```

### 3.4 元组解包优于索引访问

```python
# 不推荐：用索引逐个取
point = (3, 4)
x = point[0]
y = point[1]
print(f"x={x}, y={y}")

# 推荐：直接解包
x, y = (3, 4)
print(f"x={x}, y={y}")

# 不推荐：函数返回值用索引
def get_user():
    return ("Alice", 30)
name = get_user()[0]
age = get_user()[1]

# 推荐：解包
name, age = get_user()
```

### 3.5 用元组保护常量数据

```python
# 好：用元组定义不可变常量
DIRECTIONS = (
    (0, 1),    # 北
    (1, 0),    # 东
    (0, -1),   # 南
    (-1, 0),   # 西
)
# DIRECTIONS[0] = (1, 1)  # TypeError，无法意外修改

# 好：用元组定义不可变配置
DATABASE_CONFIG = ("localhost", 5432, "mydb", "admin")
host, port, dbname, user = DATABASE_CONFIG
```

---

## 4. 原理

### 4.1 PyTupleObject 结构详解

CPython 中元组由 `PyTupleObject` 结构体实现。与列表的 `PyListObject` 相比，元组的结构更简单——没有 `allocated` 字段，因为没有扩容需求。

```c
// 简化的 PyTupleObject 结构
typedef struct {
    PyObject_VAR_HEAD          // 包含 ob_refcnt, ob_type, ob_size
    PyObject *ob_item[1];      // 指向 PyObject* 数组的指针（变长数组）
} PyTupleObject;
```

逐字段解释：

```c
// PyObject_VAR_HEAD 展开后
Py_ssize_t ob_refcnt;      // 引用计数
PyTypeObject *ob_type;     // 类型对象指针（指向 tuple 类型）
Py_ssize_t ob_size;        // 元素数量（len() 返回此值）

PyObject **ob_item;        // 指向数组的指针
// ob_item[0], ob_item[1], ..., ob_item[ob_size - 1] 是有效元素
```

与列表的对比：

| 字段 | PyTupleObject | PyListObject |
|------|---------------|--------------|
| ob_size | 有 | 有 |
| ob_item | 有 | 有 |
| allocated | **无** | 有 |

元组没有 `allocated` 字段，因为元组在创建时一次性分配恰好等于元素数量的空间，之后不扩容、不缩容。

**空元组的优化**

空元组 `()` 是一个单例——CPython 全局只创建一个空元组对象，所有 `()` 和 `tuple()` 都返回同一个对象：

```python
a = ()
b = ()
print(a is b)   # True！同一个对象

c = tuple()
print(a is c)   # True！也是同一个对象
```

这与空列表不同（空列表每次都创建新对象）：

```python
x = []
y = []
print(x is y)   # False，不同对象
```

### 4.2 元组创建的内存分配

元组创建时，一次性分配恰好容纳所有元素的指针数组，没有过度分配：

```python
import sys

# 元组恰好分配
for n in range(1, 6):
    t = tuple(range(n))
    print(f"元组 len={n}: {sys.getsizeof(t)} 字节")

# 列表有过度分配
for n in range(1, 6):
    lst = list(range(n))
    print(f"列表 len={n}: {sys.getsizeof(lst)} 字节")
```

运行结果示例：

```text
元组 len=1: 48 字节
元组 len=2: 56 字节
元组 len=3: 64 字节
元组 len=4: 72 字节
元组 len=5: 80 字节

列表 len=1: 88 字节
列表 len=2: 88 字节
列表 len=3: 88 字节
列表 len=4: 88 字节
列表 len=5: 88 字节
```

元组每增加一个元素增加 8 字节（一个指针），而列表初始就分配了较多空间。

**元组创建的字节码**

```python
import dis

code = compile("(1, 2, 3)", "<test>", "eval")
dis.dis(code)
#   0 LOAD_CONST               0 (1)
#   2 LOAD_CONST               1 (2)
#   4 LOAD_CONST               2 (3)
#   6 BUILD_TUPLE              3    ← 构建 tuple，直接分配 3 个槽
#   8 RETURN_VALUE
```

`BUILD_TUPLE n` 指令从栈顶弹出 n 个元素，创建一个 `ob_size == n` 的元组——恰好分配，无浪费。

### 4.3 元组不可变性的底层保障

元组的不可变性在 C 层面由两个机制保障：

**没有修改方法**

`PyTupleObject` 的类型定义中，不注册 `__setitem__`、`__delitem__` 等修改方法。Python 解释器在执行 `t[0] = x` 时会检查对象的 `tp_as_mapping->mp_ass_subscript`，元组的该字段为 `NULL`，因此直接抛出 `TypeError`。

**没有扩容函数**

列表有 `list_resize`、`list_append` 等函数用于动态调整大小，元组没有任何此类函数。元组的 `ob_item` 数组在创建时一次性分配，之后大小固定不变。

```python
# 验证：元组没有任何修改方法
print([m for m in dir(tuple) if not m.startswith('_')])
# ['count', 'index']  —— 只有查询方法
```

### 4.4 元组与列表的方法对比

元组只有 2 个公开方法，列表有 11 个：

```python
tup_methods = [m for m in dir(tuple) if not m.startswith('_')]
lst_methods = [m for m in dir(list) if not m.startswith('_')]

print(f"元组方法: {tup_methods}")  # ['count', 'index']
print(f"列表方法: {lst_methods}")
# ['append', 'clear', 'copy', 'count', 'extend', 'index', 'insert', 'pop', 'remove', 'reverse', 'sort']

# 列表比元组多的方法
extra = set(lst_methods) - set(tup_methods)
print(f"列表独有: {sorted(extra)}")
# ['append', 'clear', 'copy', 'extend', 'insert', 'pop', 'remove', 'reverse', 'sort']
```

列表多出的 9 个方法全部涉及修改操作。元组作为不可变序列，这些方法对它没有意义。

| 方法 | list | tuple | 说明 |
|------|------|-------|------|
| count | 有 | 有 | 查询：统计出现次数 |
| index | 有 | 有 | 查询：查找首次出现位置 |
| append | 有 | 无 | 修改：尾部追加 |
| extend | 有 | 无 | 修改：批量追加 |
| insert | 有 | 无 | 修改：指定位置插入 |
| pop | 有 | 无 | 修改：弹出元素 |
| remove | 有 | 无 | 修改：按值删除 |
| clear | 有 | 无 | 修改：清空 |
| sort | 有 | 无 | 修改：就地排序 |
| reverse | 有 | 无 | 修改：就地反转 |
| copy | 有 | 无 | 查询：浅拷贝（元组不需要，因为不可变） |

元组没有 `copy` 方法是因为不需要——不可变对象可以直接共享同一个对象，不需要拷贝来防止意外修改。

### 4.5 元组的 GC 行为

元组是可变容器还是不可变容器，在 GC 层面有区别——纯不可变元素的元组可能不被 GC 追踪：

```python
import gc

# 纯 int 元组：可能不被 GC 追踪（无循环引用风险）
t1 = (1, 2, 3)
print(gc.is_tracked(t1))   # False（纯不可变元素，无需追踪）

# 含可变元素的元组：被 GC 追踪（可能通过 list 形成循环引用）
t2 = (1, [2, 3])
print(gc.is_tracked(t2))   # True（含可变元素，需追踪）

# 对比列表：始终被 GC 追踪
lst = [1, 2, 3]
print(gc.is_tracked(lst))  # True
```

纯不可变元素的元组不会被 GC 追踪，因为不可变对象不会形成循环引用。含可变元素的元组需要被追踪，因为可变元素（如 list）可能引用回元组，形成循环引用。

---

## 5. 总结

本文围绕"元组概述与基本概念"展开，核心内容如下：

- **元组定义**：Python 最基础的不可变序列类型，有序、不可变、允许任意类型、允许重复。与列表的唯一区别是不可变——不能就地增删改元素，任何"修改"操作都创建新元组，id 变化。

- **基本操作**：创建（字面量 `()` / `tuple()` / 逗号 / 单元素陷阱）、索引（O(1)）、切片、拼接（`+` 创建新元组）、重复（`*`）、查询（`in` O(n) / `count` / `index`）、解包（基本解包 / 星号解包 / `_` 忽略）。

- **不可变性**：元组本身的引用结构不可变——不能通过索引赋值、不能 append/del。但"不可变"不等于"内容不能变"：如果元素是可变对象（list/dict），元素内部可以修改。元组只是持引用，管不了引用指向的对象自己的变化。纯不可变元素的元组才是真正"完全不可变"的。

- **可哈希性**：元组实现了 `__hash__`，可被 `hash()` 计算，可用作字典键和集合元素。前提是元素全部可哈希——含可变元素的元组（如 `(1, [2, 3])`）不可哈希。列表不可哈希，不能做字典键。

- **两个公开方法**：`count(x)` 统计出现次数（不存在返回 0）、`index(x, start, stop)` 查找首次出现的索引（不存在抛 ValueError）。列表有 11 个公开方法，元组只有 2 个，缺少的 9 个全涉及修改操作。

- **内存模型**：元组是 `PyTupleObject`，核心是 `ob_item`（指向 `PyObject*` 数组的指针），无 `allocated` 字段（不需要扩容）。元组恰好分配——创建时一次性分配等于元素数量的空间，无过度分配，比列表更省内存。空元组 `()` 是全局单例。

- **最佳实践**：固定数据用元组、需修改用列表；单元素元组必须加逗号 `(42,)`；不要修改元组内的可变元素（破坏不可变语义）；解包优于索引访问；用元组保护常量数据；需要做字典键时用元组不用列表。
