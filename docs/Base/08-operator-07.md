---
group:
  title: 【08】运算符和表达式
  order: 8
order: 7
title: 成员运算符
nav:
  title: Python基础
  order: 1
---

# 成员运算符

## 1. 介绍

### 1.1 什么是成员运算符

成员运算符用来判断一个元素是否属于某个容器（或可迭代对象）。它回答的是一个很常见的问题："这个东西在这些数据里吗？" Python 提供两个成员运算符：

| 运算符 | 含义 | 返回值 |
|--------|------|--------|
| `in` | 元素在容器中 | `True` / `False` |
| `not in` | 元素不在容器中 | `True` / `False` |

`in` 是最常用的判断手段之一，远远不止"在不在列表里"那么简单。它的实际行为取决于右侧对象的类型：对列表是逐个比对、对字典是查键、对字符串是子串匹配、对集合是哈希查找。同一句 `x in y`，因 `y` 类型不同，性能和行为可能差几个数量级。这也正是本篇要讲清楚的核心——**成员运算符的语义会随容器类型变化**。

### 1.2 在运算符体系中的定位

成员运算符位于 Python 运算符体系中"判断类"运算符这一层。和它地位相近的是比较运算符（`==`、`!=`）和身份运算符（`is`）：比较运算符关心两个值是否相等，身份运算符关心两个引用是否指向同一对象，而成员运算符关心一个对象是否是另一个集合的组成部分。它们的结果都是布尔值，常用于条件分支和循环控制。

### 1.3 最简示例

先用一个最小例子感受成员运算符的用法：

```python
fruits = ["apple", "banana", "cherry"]

print("apple" in fruits)      # True
print("grape" in fruits)      # False
print("grape" not in fruits)  # True
```

运行结果：

```text
True
False
True
```

`in` 直接返回一个布尔值，可以原样用在 `if` 条件里。下面逐个讲透它的用法和不同容器上的行为差异。

---

## 2. 核心内容

本章先讲两个运算符本身的基本用法，再深入它们在不同容器上的行为差异、性能特点，以及如何让自己的类支持 `in` 判断。

### 2.1 `in` 运算符

`in` 的语法是 `元素 in 容器`，当元素存在于容器中时返回 `True`，否则返回 `False`。它是一个二元运算符，左侧是被查找的元素，右侧是容器或可迭代对象。

`in` 最直接的使用场景就是条件判断：把一个值塞进一组候选里看是否命中。

**示例**

```python
# 1. 在列表里判断元素是否存在
fruits = ["apple", "banana", "cherry"]
print(f"'apple' in fruits -> {'apple' in fruits}")   # True
print(f"'grape' in fruits  -> {'grape' in fruits}")  # False

# 2. 返回值就是 bool
result = "banana" in fruits
print(f"result = {result}, type = {type(result).__name__}")

# 3. 用在 if 分支里：判断身份角色
role = "admin"
if role in ("admin", "superadmin"):
    print(f"{role} 拥有管理权限")
else:
    print(f"{role} 无管理权限")
```

运行结果：

```text
'apple' in fruits -> True
'grape' in fruits  -> False
result = True, type = bool
admin 拥有管理权限
```

**关键点**

- `in` 总是返回布尔值，且不会有"找不到就报错"的副作用——这是它和 `dict[key]` 取值最大的区别。需要"判断存在"用 `in`，需要"取出值"用 `[]` 或 `.get()`。
- 左侧的元素可以是任意类型，只要和容器里的元素能做相等比较（基于 `==`）。`[1, 2] in [[1, 2], [3, 4]]` 是合法的，因为列表之间可以比较相等。

### 2.2 `not in` 运算符

`not in` 就是 `in` 的逻辑取反，等价于 `not (x in y)`。当元素不在容器中时返回 `True`。它的存在不只是语法糖，而是让"不在"这种语义读起来更顺、避免和 `not` 的优先级混在一起。

**示例**

```python
fruits = ["apple", "banana", "cherry"]
print(f"'grape' not in fruits -> {'grape' not in fruits}")   # True
print(f"'apple' not in fruits -> {'apple' not in fruits}")   # False

# 两种写法等价：not in 和 not (in)
print(f"not ('root' in fruits) -> {not ('root' in fruits)}")    # True
print(f"'root' not in fruits    -> {'root' not in fruits}")    # True
```

运行结果：

```text
'grape' not in fruits -> True
'apple' not in fruits -> False
not ('root' in fruits) -> True
'root' not in fruits    -> True
```

**关键点**

- 推荐用 `not in` 而不是 `not (... in ...)`。前者语义直接、优先级清晰；后者要靠括号，写漏了括号语义就可能变。
- 优先级上，`not` 的优先级低于 `in`，所以 `not x in y` 实际等价于 `not (x in y)`，意外地也是对的——但这容易让人怀疑是写错了，仍建议直接写 `x not in y` 更明确。

### 2.3 不同容器中的成员判断

`in` 的行为会随右侧容器类型变化。同一个 `in`，在不同容器上语义不同，这是本节要重点掌握的内容。

**列表和元组：逐个元素比对**

列表、元组的 `in` 是把容器里的每个元素拿出来和目标做 `==` 比较，命中即返回 `True`，全部扫完没命中才返回 `False`。性能是线性时间 `O(n)`，元素越多越慢。

```python
nums = [10, 20, 30]
print(f"20 in {nums} -> {20 in nums}")     # True
print(f"25 in {nums} -> {25 in nums}")     # False

t = (1, 2, 3)
print(f"2 in {t} -> {2 in t}")             # True
```

运行结果：

```text
20 in [10, 20, 30] -> True
25 in [10, 20, 30] -> False
2 in (1, 2, 3) -> True
```

**字典：`in` 判断的是键，不是值**

这是最常见的坑。对字典做 `x in d`，判断的是 `x` 是不是字典的**键**，而不是值。想查值是否存在要用 `x in d.values()`。

```python
user = {"name": "Tom", "age": 18}
print(f"'name' in user -> {'name' in user}")          # True（键）
print(f"'Tom' in user  -> {'Tom' in user}")            # False（值不是键）
print(f"'Tom' in user.values() -> {'Tom' in user.values()}")  # True（查值）
```

运行结果：

```text
'name' in user -> True
'Tom' in user  -> False
'Tom' in user.values() -> True
```

记住一条规则：**字典的 `in` 永远是查键**。这条规则让字典的 `in` 性能和集合一样是 `O(1)`（基于哈希），而不是像列表那样逐个对比。

**集合：最高效的成员判断**

集合（set）的 `in` 是基于哈希表查找，平均时间 `O(1)`，几乎不随元素数量增长而变慢。需要频繁做存在性判断时，集合是首选。

```python
tags = {"python", "java", "go"}
print(f"'python' in tags -> {'python' in tags}")   # True
print(f"'rust' in tags   -> {'rust' in tags}")     # False
```

运行结果：

```text
'python' in tags -> True
'rust' in tags   -> False
```

**range：按数学区间判断，不逐个扫描**

`range` 也支持 `in`，但它不是把所有数生成出来逐个比对，而是按数学区间判断（`start <= x < stop` 且步长对得上），所以即便 `range` 范围极大，判断也几乎瞬间完成。

```python
r = range(0, 100)
print(f"50 in range(0,100) -> {50 in r}")           # True
print(f"100 in range(0,100) -> {100 in r}")          # False（不含右端点）
print(f"99999999 in range(0,100000000) -> {99999999 in range(0, 100000000)}")  # 很快
```

运行结果：

```text
50 in range(0,100) -> True
100 in range(0,100) -> False
99999999 in range(0,100000000) -> True
```

**嵌套结构：`in` 只判断第一层**

`in` 不会递归进入嵌套结构查找，只比对容器第一层元素。想在嵌套结构里找值，需要自己展开。

```python
matrix = [[1, 2], [3, 4], [5, 6]]
print(f"[1,2] in matrix -> {[1, 2] in matrix}")     # True（子列表作为元素）
print(f"3 in matrix    -> {3 in matrix}")           # False（3 不在第一层）
print(f"3 in any row: {any(3 in row for row in matrix)}")   # True（手动展开）
```

运行结果：

```text
[1,2] in matrix -> True
3 in matrix    -> False
3 in any row: True
```

**关键点**

理解"同一种语法、不同实现"是掌握 `in` 的关键。下表把几种容器的 `in` 行为做了对比：

| 容器类型 | `in` 判断的内容 | 时间复杂度 | 特殊行为 |
|---------|---------------|-----------|---------|
| list 列表 | 元素是否在其中 | O(n) | 逐个 `==` 比对 |
| tuple 元组 | 元素是否在其中 | O(n) | 同列表 |
| dict 字典 | 键是否在其中 | O(1) | 不查值，查键 |
| set 集合 | 元素是否在其中 | O(1) | 哈希查找 |
| str 字符串 | 子串是否出现 | O(n) | 子串匹配 |
| range 范围 | 数是否在区间 | O(1) | 数学区间判断 |

### 2.4 字符串的子串匹配

字符串的 `in` 行为特殊，值得单独讲。它不是判断"某个字符是否在字符串里"，而是判断**子串是否出现**——左侧可以是任意长度的字符串。

**示例**

```python
s = "hello python"
print(f"'python' in s -> {'python' in s}")     # True（多字符子串）
print(f"'py' in s     -> {'py' in s}")          # True
print(f"'java' in s   -> {'java' in s}")        # False
print(f"'h' in s      -> {'h' in s}")            # True（单字符也是子串）
```

运行结果：

```text
'python' in s -> True
'py' in s     -> True
'java' in s   -> False
'h' in s      -> True
```

**几个细节**

- **大小写敏感**：`'Hello' in 'hello python'` 是 `False`，需要忽略大小写要先统一转小写。
- **空串永远在**：`'' in s` 永远是 `True`，空字符串是任何字符串的子串。
- **是字面量匹配，不是正则**：`in` 只做纯字符串匹配，没有模式、没有通配符。需要正则要用 `re` 模块。

```python
text = "hello World"
print(f"'Hello' in text -> {'Hello' in text}")           # False（大小写）
print(f"'Hello'.lower() in text.lower() -> {'Hello'.lower() in text.lower()}")  # True
print(f"'' in text -> {'' in text}")                      # True（空串）
print(f"'.' in 'a.b.c' -> {'.' in 'a.b.c'}")             # True（字面量点）
```

运行结果：

```text
'Hello' in text -> False
'Hello'.lower() in text.lower() -> True
'' in text -> True
'.' in 'a.b.c' -> True
```

**实际用途：关键词过滤**

字符串的 `in` 在过滤、文案判断里特别常用，比如筛出包含某关键词的日志、留言：

```python
messages = ["价格：99元", "库存充足", "价格：199元", "已售罄"]
price_msgs = [m for m in messages if "价格" in m]
print(f"提到价格的有: {price_msgs}")
```

运行结果：

```text
提到价格的有: ['价格：99元', '价格：199元']
```

### 2.5 性能差异：列表 vs 集合

这是一个在实操中极其重要的点：同样一句 `x in 容器`，容器是列表还是集合，性能可能差上万倍。下面用一个直观的对比说明。

**示例**

对一个 200 万规模的数据集，分别查找末尾元素（列表的最坏情况）：

```python
import time

n = 2_000_000
big_list = list(range(n))
big_set = set(range(n))
needle = n - 1

start = time.perf_counter()
found = needle in big_list
t_list = time.perf_counter() - start
print(f"list  -> 耗时 {t_list*1000:.2f} ms（O(n)）")

start = time.perf_counter()
found = needle in big_set
t_set = time.perf_counter() - start
print(f"set   -> 耗时 {t_set*1000:.4f} ms（O(1)）")

print(f"list / set ≈ {t_list / max(t_set, 1e-9):.0f} 倍")
```

运行结果：

```text
list  -> 耗时 23.91 ms（O(n)）
set   -> 耗时 0.0013 ms（O(1)）
list / set ≈ 18505 倍
```

差距来源是时间复杂度：列表要逐个比对，最坏要把全部元素扫一遍（`O(n)`）；集合基于哈希表，平均一次查询就能定位（`O(1)`）。这种差距在大数据量、高频查询的场景会被放大到令人难以忽视。

**关键点**

- **惯用法**：如果一个列表要做多次 `in` 判断，先把它转成集合，再反复查询。
- **注意空间换时间**：转集合要额外开辟哈希表空间，且要求元素可哈希（列表里的元素也必须可哈希）。如果元素本身是列表、字典等不可哈希类型，就不能直接转集合。
- **查找不存在元素也同理**：列表找不存在的元素要扫完全部，集合一次哈希就能判定不存在，差距同样巨大。

```python
# 惯用法：多次判断前转集合
sku_list = ["SKU001", "SKU002", "SKU003", "SKU004"]
sku_set = set(sku_list)
test_skus = ["SKU002", "SKU999", "SKU003", "SKU123"]
available = [s for s in test_skus if s in sku_set]
print(f"在架商品: {available}")
```

运行结果：

```text
在架商品: ['SKU002', 'SKU003']
```

### 2.6 自定义对象与 `__contains__`

`in` 不仅能用在内置容器上，还能作用在你自己写的类上。这背后是一套协议查找机制：解释器会优先调用类的 `__contains__` 方法，没有则退回到迭代（`__iter__` 或 `__getitem__`）逐个比对。

**默认情况：不支持会报错**

普通自定义类不实现任何协议时，实例是不能用 `in` 的：

```python
class Plain:
    pass
p = Plain()
try:
    print(1 in p)
except TypeError as e:
    print(f"TypeError: {e}")
```

运行结果：

```text
TypeError: argument of type 'Plain' is not iterable
```

**实现 `__contains__`：自定义判断逻辑**

`__contains__` 接收一个参数（被查找的元素），返回布尔值。定义了它，`in` / `not in` 都会走它。

```python
class TagBag:
    def __init__(self, tags):
        self.tags = tags
    def __contains__(self, item):
        # 自定义规则：忽略大小写判断
        low_tags = [t.lower() for t in self.tags]
        return item.lower() in low_tags

bag = TagBag(["Python", "Java", "Go"])
print(f"'python' in bag -> {'python' in bag}")   # True（忽略大小写）
print(f"'JAVA' in bag   -> {'JAVA' in bag}")     # True
print(f"'rust' in bag   -> {'rust' in bag}")     # False
print(f"'rust' not in bag -> {'rust' not in bag}")  # not in 也走 __contains__
```

运行结果：

```text
'python' in bag -> True
'JAVA' in bag   -> True
'rust' in bag   -> False
'rust' not in bag -> True
```

**只实现 `__iter__`：退而求其次**

如果没实现 `__contains__` 但实现了 `__iter__`，`in` 会逐个迭代比对，相当于线性扫描。正确地实现迭代器协议，`in` 也能工作。

```python
class OnlyIterable:
    def __init__(self, data):
        self.data = data
    def __iter__(self):
        return iter(self.data)

oi = OnlyIterable([10, 20, 30])
print(f"20 in oi -> {20 in oi}")   # True，靠迭代比对
print(f"25 in oi -> {25 in oi}")   # False
```

运行结果：

```text
20 in oi -> True
25 in oi -> False
```

**关键点**

- `__contains__` 优先级最高。当一个类同时定义了 `__contains__` 和 `__iter__` 时，`in` 只会调用 `__contains__`，迭代方式不会被触发。
- 自定义 `__contains__` 能让 `in` 拥有业务语义，比如"年龄在区间内""权限满足条件"，而不仅仅是字面相等。

### 2.7 运算符优先级与结合性

成员运算符的优先级相对较低，和一些常见组合使用时要特别留意。大致优先级关系是：比较运算符（`<`、`>`、`==` 等）和 `in`、`not in` 处在同一优先级层次，且都低于算术和位运算，高于布尔逻辑（`and`、`or`）。

几个容易踩的点：

```python
nums = [1, 2, 3]

# 1. in 返回的是布尔值，可以再参与比较
print(2 in nums == True)   # 连续比较：等价 (2 in nums) and (nums == True)
print((2 in nums) == True)  # 这才是“判断 2 在不在，再和 True 比”
```

运行结果：

```text
False
True
```

第一个 `2 in nums == True` 是 Python 的连续比较特性，会被解释成 `(2 in nums) and (nums == True)`，因为 `nums == True` 是 `False`，整体就是 `False`。最常见的写法是直接用 `if 2 in nums:`，不要画蛇添足加 `== True`。

`not in` 比 `not` 结合得更紧，写 `not in` 时不用额外加括号；而混用 `in`、`and`、`or` 做复合判断时，建议用括号明确意图：

```python
status = "404"
handled = ["200", "301"]
# 推荐：用括号明确
if (status in handled) or (status == "404"):
    print("已处理或需要特殊关注")
```

运行结果：

```text
已处理或需要特殊关注
```

养成习惯：成员判断和其他条件混用时，一律显式加括号，避免依赖"谁先算"的隐式规则。

---

## 3. 最佳实践

### 3.1 多值等值判断用 `in` 元组代替一串 `or`

判断一个值是否等于多个候选之一，用 `in` 元组比堆 `or` 清晰得多。

| 场景 | 推荐写法 | 不推荐写法 | 原因 |
|------|---------|-----------|------|
| 多值等值 | `x in ("a", "b", "c")` | `x == "a" or x == "b" or x == "c"` | 冗长且易漏写 |
| 字典取值前判存在 | `if k in d:` | `try: d[k] except KeyError` | `in` 更直观 |
| 多次成员判断 | 先 `set()` 再 `in` | 反复对 list 做 `in` | 性能差万倍 |
| 判 True | `if x in nums:` | `if x in nums == True:` | 连续比较会误判 |
| 大小写无关 | `kw.lower() in s.lower()` | 期望 `in` 自己忽略大小写 | `in` 大小写敏感 |
| 未初始化容器 | `if data and x in data:` | `x in data`（data 可能 None） | 会 TypeError |

```python
status = "404"
# 不推荐：堆 or
if status == "200" or status == "404" or status == "500":
    print("HTTP 状态码")
# 推荐：in 元组
if status in ("200", "404", "500"):
    print("HTTP 状态码（用 in）")
```

运行结果：

```text
HTTP 状态码
HTTP 状态码（用 in）
```

### 3.2 字典判断优先用 `in` 或 `.get`，少用异常

判断键是否存在要先用 `in`，取值配合 `.get()` 带默认值，避免 `KeyError`，也比 `try/except` 更直白：

```python
config = {"port": 8080}

# 用 in 先判断再取值
if "host" in config:
    print(config["host"])
else:
    host = config.get("host", "0.0.0.0")
    print(f"host 默认值 -> {host}")
```

运行结果：

```text
host 默认值 -> 0.0.0.0
```

直接用 `config["host"]` 会抛 `KeyError`，靠捕获异常处理存在性既慢又难读，是典型的反模式。

### 3.3 频繁判断先转集合

这是性能优化的头号手段。如果一个列表要做两次以上 `in` 判断，转成集合后查询快几个数量级：

```python
# 从配置拿到的列表，要做 N 次判断 -> 先转 set
codes = ["A1", "B2", "C3", "D4"]
codes_set = set(codes)
for c in ["A1", "Z9", "C3"]:
    print(f"'{c}' 有效？ -> {c in codes_set}")
```

运行结果：

```text
'A1' 有效？ -> True
'Z9' 有效？ -> False
'C3' 有效？ -> True
```

注意代价：转集合要消耗额外内存，且元素必须可哈希。如果元素是字典、列表等不可哈希对象，转集合会直接报 `TypeError`，这时只能退回用列表逐个判断，或把这些元素改成可哈希的元组。

### 3.4 对可能为 `None` 或未初始化的容器先判空

直接对 `None` 做 `in` 会抛 `TypeError`。出现"容器可能是 None"的情况时，先判空再 `in`：

```python
data = None
# 直接 'x' in None 会 TypeError
if data is not None and "x" in data:
    print("命中")
else:
    print("data 为 None，跳过 in 判断，避免 TypeError")
```

运行结果：

```text
data 为 None，跳过 in 判断，避免 TypeError
```

`data is not None and "x" in data` 利用短路求值，`data` 为 `None` 时不会执行后半段，安全避开错误。

### 3.5 常见错误模式

**错误一：以为字典的 `in` 查的是值**

```python
user = {"name": "Tom"}
# 错：以为 'Tom' in user 是查值
print("'Tom' in user ->", 'Tom' in user)          # False
# 对：查值用 .values()
print("'Tom' in user.values() ->", 'Tom' in user.values())  # True
```

运行结果：

```text
'Tom' in user -> False
'Tom' in user.values() -> True
```

**错误二：用 `in` 当正则用**

```python
s = "a.b.c"
# 期望匹配"任意字符"——但 in 只做字面量匹配
print("'.' in s ->", '.' in s)   # True，是因为字符串里真的有 '.'
# 想要做"数字序列匹配"得用 re
import re
print(re.findall(r"\d+", "a1b22c333"))
```

运行结果：

```text
'.' in s -> True
['1', '22', '333']
```

**错误三：给 `in` 加多余的 `== True`**

```python
nums = [1, 2, 3]
# 不推荐：== True 和连续比较冲突
if 2 in nums == True:
    print("命中")
# 推荐：直接用结果
if 2 in nums:
    print("命中（正确写法）")
```

运行结果：

```text
命中（正确写法）
```

`2 in nums == True` 因为连续比较被解释成 `(2 in nums) and (nums == True)`，永远为假，是经典的坑。

---

## 4. 原理：成员判断的协议查找机制

`x in y` 这个表达式，在 Python 内部并不是固定步骤完成的——它会按一套"协议查找"机制，在 `y` 上找一个能用的方法来执行判断。理解这套机制，就理解了为什么不同容器行为不同、自定义类怎么支持 `in`。

### 4.1 查找顺序：`__contains__` → `__iter__` → `__getitem__`

当解释器执行 `x in y` 时，会按下面的顺序在 `y` 的类型上找方法：

```text
x in y
  │
  ▼
y 是否有 __contains__(self, x)？  ──有──▶ 调用它，返回布尔值（最高优先级）
  │没有
  ▼
y 是否可迭代（定义了 __iter__）？  ──有──▶ 逐个迭代做 == 比对，命中即 True
  │没有
  ▼
y 是否定义了 __getitem__？       ──有──▶ 按下标从 0 开始取，逐个比对
  │没有
  ▼
抛出 TypeError: argument of type ... is not iterable
```

这套顺序解释了几个关键事实：

- 自定义类只要实现 `__contains__`，`in` 就走它，性能和语义你完全可控。
- 没有 `__contains__` 但可迭代的对象，`in` 退回成线性扫描。
- 既不可迭代又没有 `__contains__` 的对象，`in` 直接报 `TypeError`。

用代码验证 `__contains__` 的最高优先级：

```python
class Both:
    def __contains__(self, item):
        print("  -> 调用的是 __contains__")
        return item == 42
    def __iter__(self):
        # 即使可迭代，in 也不会走这里
        for v in [1, 2, 3]:
            yield v

b = Both()
print("42 in b:")
print(f"  结果 = {42 in b}")
print("1 in b:")
print(f"  结果 = {1 in b}")
```

运行结果：

```text
42 in b:
  -> 调用的是 __contains__
  结果 = True
1 in b:
  -> 调用的是 __contains__
  结果 = False
```

可以看到，即使 `Both` 同时定义了 `__iter__`，`in` 也只调用 `__contains__`。这就是为什么给类实现 `__contains__` 能带来性能收益——你不必让 `in` 去线性遍历。

### 4.2 不同容器的实现差异决定了性能

为什么列表的 `in` 时 `O(n)`、集合是 `O(1)`？根源在于各自类型提供的底层方法不同：

| 容器 | 内部存储 | `in` 走的途径 | 时间复杂度 |
|------|---------|--------------|-----------|
| list | 动态数组 | `__iter__` 逐个比对 | O(n) |
| tuple | 不可变数组 | `__iter__` 逐个比对 | O(n) |
| dict | 哈希表 | `__contains__` 查键 | O(1) |
| set/frozenset | 哈希表 | `__contains__` 查哈希 | O(1) |
| str | 字符数组 | `__contains__` 子串查找 | O(n) |
| range | 区间参数 | `__contains__` 区间计算 | O(1) |

dict 和 set 的成员判断之所以快，是它们在底层实现了基于哈希的 `__contains__`，一次定位就够；list 和 tuple 没有自定义 `__contains__`，只能走迭代的回退路径，所以是线性的。range 妙在没有存储所有数，只存起止和步长参数，`__contains__` 用数学计算就能判断，所以查询是 `O(1)`。

### 4.3 元素相等基于 `==`，可哈希性决定能否入集合

`in` 命中与否，最终是靠 `==` 判断的。这决定了几个细节：

- 元素和容器里的项类型不必相同，只要 `==` 成立就算命中：`1 in [1.0, 2.0]` 是 `True`，因为 `1 == 1.0`。
- 自定义对象要正确实现 `__eq__` 才能被准确判断存在性，否则用默认的标识比较很难命中。

```python
# 不同类型但 == 相等，in 也能命中
print(f"1 in [1.0, 2.0, 3.0] -> {1 in [1.0, 2.0, 3.0]}")  # True
print(f"1 == 1.0 -> {1 == 1.0}")                # True
```

运行结果：

```text
1 in [1.0, 2.0, 3.0] -> True
1 == 1.0 -> True
```

而集合能提供 `O(1)` 查询的前提是元素**可哈希**（实现了 `__hash__` 且 `__eq__` 与哈希一致）。列表、字典等可变对象不可哈希，所以不能放进集合，也就不能用"转集合"这个加速手段：

```python
try:
    s = set([[1, 2], [3, 4]])   # 列表不可哈希
except TypeError as e:
    print(f"TypeError: {e}")
# 元组可哈希，可以放进集合
print(f"set([(1,2),(3,4)]) -> {set([(1, 2), (3, 4)])}")
```

运行结果：

```text
TypeError: unhashable type: 'list'
set([(1,2),(3,4)]) -> {(1, 2), (3, 4)}
```

这条特性解释了一个实操约束：当你想"用转集合加速成员判断"时，元素必须是可哈希的不可变类型（int、str、tuple 等），否则这条路走不通。

---

## 5. 总结

本文围绕成员运算符展开，主要介绍了以下内容：

- 成员运算符只有 `in` 和 `not in` 两个，用于判断元素是否属于容器，返回布尔值
- `in` 的行为随容器类型变化：列表/元组是逐个比对、字典是查键、集合是查哈希、字符串是查子串、range 是区间计算
- 字典的 `in` 判断的是键不是值，查值要用 `.values()`；字符串的 `in` 是子串匹配、区分大小写、不是正则
- 性能差异巨大：列表 `O(n)`、集合 `O(1)`，频繁判断时先把列表转集合，但元素必须可哈希
- 自定义类通过实现 `__contains__` 支持 `in`，`__contains__` 优先级最高，没定义则退回迭代
- 查找顺序是 `__contains__` → `__iter__` → `__getitem__`，都不可用则抛 `TypeError`
- 最佳实践：多值判断用 `in` 元组代替一串 `or`，字典取值前用 `in` 或 `.get` 判存在，混合条件一律加括号，不要给 `in` 加多余的 `== True`
