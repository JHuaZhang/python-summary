---
group:
  title: 【05】元组介绍
  order: 5
order: 11
title: 元组解包与星号表达式
nav:
  title: Python基础
  order: 1
---

# 元组解包与星号表达式

## 1. 介绍

### 1.1 什么是元组解包

元组解包（unpacking）是 Python 中将元组（或任何可迭代对象）的元素一次性赋值给多个变量的语法。它是 Python 最优雅、最常用的特性之一：

```python
point = (3, 4)
x, y = point          # 解包：x=3, y=4

a, b = 1, 2
a, b = b, a           # 交换变量：a=2, b=1
```

解包让多变量赋值、多返回值接收、变量交换等操作变得简洁直观。没有解包，你需要写 `x = point[0]; y = point[1]`——啰嗦且容易索引出错。

### 1.2 解包的两种形式

| 形式 | 语法 | 说明 |
|------|------|------|
| 基本解包 | `a, b, c = t` | 变量数量必须等于元素数量 |
| 星号解包 | `a, *b, c = t` | `*b` 捕获剩余元素为一个列表 |

### 1.3 核心注意事项

**第一：基本解包的变量数量必须与元素数量完全匹配。**

```python
a, b = (1, 2, 3)  # ValueError: too many values to unpack
a, b, c = (1, 2)  # ValueError: not enough values to unpack
```

不匹配时会抛 `ValueError`。如果数量不确定，用星号表达式。

**第二：星号变量捕获的结果是列表，不是元组。**

```python
first, *rest = (1, 2, 3, 4)
print(type(rest))  # <class 'list'>, 不是 tuple
```

这是一个常见的"意外"——虽然解包的是元组，但 `*rest` 的类型是 `list`。

**第三：一个解包语句中最多只能有一个星号变量。**

```python
# a, *b, *c = (1, 2, 3, 4)  # SyntaxError: two starred expressions
```

多个星号会引发歧义——Python 不确定如何分配剩余元素，所以直接禁止。

---

## 2. 核心内容

### 2.1 基本解包

基本解包将元组的每个元素分别赋给一个变量，变量数量必须与元素数量完全匹配：

```python
point = (3, 4)
x, y = point
print(f"x = {x}, y = {y}")   # x=3, y=4

rgb = (255, 128, 0)
r, g, b = rgb
print(f"r={r}, g={g}, b={b}")  # r=255, g=128, b=0
```

**运行结果**：

```text
x = 3, y = 4
r=255, g=128, b=0
```

变量数量不匹配时会抛 `ValueError`：

```python
try:
    a, b = (1, 2, 3)  # 3 个元素，2 个变量
except ValueError as e:
    print(f"ValueError: {e}")

try:
    a, b, c = (1, 2)  # 2 个元素，3 个变量
except ValueError as e:
    print(f"ValueError: {e}")
```

**运行结果**：

```text
ValueError: too many values to unpack (expected 2)
ValueError: not enough values to unpack (expected 3, got 2)
```

### 2.2 单元素元组解包

解包单元素元组时，左边的变量名后必须加逗号——与创建单元素元组的语法一致：

```python
single = (42,)
(val,) = single
print(f"val = {val}")   # 42

# 如果不加逗号，只是普通赋值
val2 = single
print(f"val2 = {val2}, type = {type(val2)}")  # (42,), tuple
```

**运行结果**：

```text
val = 42
val2 = (42,), type = <class 'tuple'>
```

### 2.3 解包不限于元组

任何可迭代对象都可以被解包——列表、字符串、`range` 等：

```python
a, b, c = [10, 20, 30]   # 列表
a, b, c = "xyz"           # 字符串
a, b, c = range(3)        # range
```

解包的实质是"将可迭代对象的元素逐一取出赋给变量"，不关心源对象的类型。

### 2.4 变量交换

Python 最经典的解包应用——无需临时变量交换两个值：

```python
a, b = 1, 2
a, b = b, a   # 交换！
print(f"a={a}, b={b}")  # a=2, b=1
```

**运行结果**：

```text
a=2, b=1
```

原理：右边 `b, a` 先被打包成元组 `(2, 1)`，然后解包给左边的 `a, b`。整个过程不涉及临时变量（在 Python 层面），简洁且高效。

### 2.5 函数调用中解包

用 `*` 可以在函数调用时将元组解包为位置参数：

```python
def add(a, b, c):
    return a + b + c

args = (1, 2, 3)
result = add(*args)  # 等价于 add(1, 2, 3)
print(result)   # 6
```

**运行结果**：

```text
6
```

---

### 2.6 星号表达式

星号表达式用 `*变量名` 捕获剩余元素，解决了"元素太多，只想取头尾几个"的问题。

#### 2.6.1 取头部和尾部

```python
t = (1, 2, 3, 4, 5)

first, *rest = t
print(f"first={first}, rest={rest}")     # first=1, rest=[2, 3, 4, 5]

*init, last = t
print(f"init={init}, last={last}")       # init=[1, 2, 3, 4], last=5

first, *middle, last = t
print(f"first={first}, middle={middle}, last={last}")  # first=1, middle=[2, 3, 4], last=5
```

**运行结果**：

```text
first=1, rest=[2, 3, 4, 5]
init=[1, 2, 3, 4], last=5
first=1, middle=[2, 3, 4], last=5
```

#### 2.6.2 星号变量始终是列表

```python
# 多个剩余元素
a, *b = (1, 2, 3, 4)
print(f"b={b}, type={type(b)}")   # b=[2, 3, 4], list

# 只有一个剩余元素
a, *b = (1, 2)
print(f"b={b}, type={type(b)}")   # b=[2], list

# 没有剩余元素
a, *b = (1,)
print(f"b={b}, type={type(b)}")   # b=[], list
```

**运行结果**：

```text
b=[2, 3, 4], type=<class 'list'>
b=[2], type=<class 'list'>
b=[], type=<class 'list'>
```

无论剩余多少个元素（甚至 0 个），`*b` 的类型永远是 `list`。这是 Python 的设计选择——列表比元组更灵活（可增删改），在后续处理中更方便。

#### 2.6.3 忽略元素

用 `_` 或 `*_` 作为"丢弃变量"表示"我不关心这部分"：

```python
t = (1, 2, 3, 4, 5)

first, *_, last = t
print(f"first={first}, last={last}")  # first=1, last=5（中间被丢弃）
```

**运行结果**：

```text
first=1, last=5
```

#### 2.6.4 实际应用场景

```python
# 分割路径
path = ("home", "user", "documents", "file.txt")
*folders, filename = path
print(f"folders={folders}, filename={filename}")

# 分割版本号
version = (3, 12, 1, "beta")
major, minor, *rest = version
print(f"major={major}, minor={minor}, rest={rest}")
```

**运行结果**：

```text
folders=['home', 'user', 'documents'], filename=file.txt
major=3, minor=12, rest=[1, 'beta']
```

---

### 2.7 函数中的解包

#### 2.7.1 函数返回值解包

函数返回元组后直接解包接收——这是 Python 多返回值的惯用模式：

```python
def get_user_info():
    return ("张三", 25, "工程师", "北京")

name, age, job, city = get_user_info()
print(f"姓名={name}, 年龄={age}, 职位={job}, 城市={city}")

# 只取前两个
name, age, *_ = get_user_info()
print(f"只取前两个: 姓名={name}, 年龄={age}")
```

**运行结果**：

```text
姓名=张三, 年龄=25, 职位=工程师, 城市=北京
只取前两个: 姓名=张三, 年龄=25
```

#### 2.7.2 *args 收集参数

函数定义中的 `*args` 将所有位置参数收集为一个元组：

```python
def sum_all(*args):
    print(f"  args 类型: {type(args)}, 值: {args}")
    return sum(args)

print(sum_all(1, 2, 3))       # args=(1, 2, 3)
print(sum_all(1, 2, 3, 4, 5)) # args=(1, 2, 3, 4, 5)
print(sum_all())               # args=()
```

**运行结果**：

```text
  args 类型: <class 'tuple'>, 值: (1, 2, 3)
6
  args 类型: <class 'tuple'>, 值: (1, 2, 3, 4, 5)
15
  args 类型: <class 'tuple'>, 值: ()
0
```

`*args` 收集的结果是**元组**类型——这可能是 Python 中"解包收集"唯一返回元组而非列表的地方。

#### 2.7.3 for 循环中的解包

遍历元组对时直接解包，不用索引访问：

```python
students = (("张三", 90), ("李四", 85), ("王五", 92))
for name, score in students:
    print(f"  {name}: {score}分")
```

**运行结果**：

```text
  张三: 90分
  李四: 85分
  王五: 92分
```

`for name, score in students` 每次迭代从 `students` 取出一个元组元素 `(name, score)` 并解包——比 `for item in students: print(item[0], item[1])` 更清晰。

#### 2.7.4 enumerate 和 zip

```python
colors = ("red", "green", "blue")
for index, color in enumerate(colors):
    print(f"  {index}: {color}")

names = ("Alice", "Bob", "Charlie")
ages = (25, 30, 35)
for name, age in zip(names, ages):
    print(f"  {name} is {age}")
```

**运行结果**：

```text
  0: red
  1: green
  2: blue
  Alice is 25
  Bob is 30
  Charlie is 35
```

`enumerate` 返回 `(index, value)` 元组对，`zip` 返回配对后的元组——两者都天然适合解包。

---

### 2.8 嵌套解包

当元组中嵌套了可迭代对象时，可以在解包时进一步拆解内层结构：

#### 2.8.1 基本嵌套解包

```python
t = (1, (2, 3), 4)
a, (b, c), d = t
print(f"a={a}, b={b}, c={c}, d={d}")   # a=1, b=2, c=3, d=4
```

**运行结果**：

```text
a=1, b=2, c=3, d=4
```

左边变量的结构必须与右边元组的嵌套结构完全对应——`(b, c)` 对应内层元组 `(2, 3)`。

#### 2.8.2 三层嵌套

```python
t = (1, (2, (3, 4), 5), 6)
a, (b, (c, d), e), f = t
print(f"a={a}, b={b}, c={c}, d={d}, e={e}, f={f}")
```

**运行结果**：

```text
a=1, b=2, c=3, d=4, e=5, f=6
```

#### 2.8.3 嵌套 + 星号

```python
t = (1, (2, 3, 4, 5), 6)
a, (b, *c), d = t
print(f"a={a}, b={b}, c={c}, d={d}")   # a=1, b=2, c=[3, 4, 5], d=6
```

**运行结果**：

```text
a=1, b=2, c=[3, 4, 5], d=6
```

星号可以在任何嵌套层级使用——但整个语句中最多一个星号。

#### 2.8.4 解包日志结构

```python
log_entry = (
    "2024-01-15 10:30:00",
    ("ERROR", "数据库连接失败"),
    ("db.py", 42),
)
timestamp, (level, message), (file, line) = log_entry
print(f"时间: {timestamp}")
print(f"级别: {level}, 消息: {message}")
print(f"位置: {file}:{line}")
```

**运行结果**：

```text
时间: 2024-01-15 10:30:00
级别: ERROR, 消息: 数据库连接失败
位置: db.py:42
```

嵌套解包让处理结构化数据变得非常 intuitive——变量的结构与数据的结构一一对应，不需要写逐层索引访问。

#### 2.8.5 忽略不需要的嵌套元素

```python
log_entries = (
    ("10:30", ("ERROR", "连接失败"), ("db.py", 42)),
    ("10:31", ("WARN", "内存80%"), ("monitor.py", 15)),
    ("10:32", ("INFO", "启动完成"), ("main.py", 8)),
)
for _, (level, message), _ in log_entries:
    print(f"  [{level}] {message}")
```

**运行结果**：

```text
  [ERROR] 连接失败
  [WARN] 内存80%
  [INFO] 启动完成
```

用 `_` 忽略时间戳和位置信息，只提取级别和消息——解包让"选择性提取"变得优雅。

---

### 2.9 综合场景实战

#### 2.9.1 冒泡排序中的交换

```python
def bubble_sort(arr):
    arr = list(arr)
    n = len(arr)
    for i in range(n - 1):
        for j in range(n - 1 - i):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]  # 元组解包交换
    return tuple(arr)

data = (64, 34, 25, 12, 22, 11, 90)
print(f"排序后: {bubble_sort(data)}")
```

**运行结果**：

```text
排序后: (11, 12, 22, 25, 34, 64, 90)
```

`arr[j], arr[j + 1] = arr[j + 1], arr[j]` 是 Python 中最优雅的交换写法——一行替代传统语言的三行（临时变量交换）。

#### 2.9.2 CSV 行解析

```python
csv_rows = (
    ("张三", "25", "工程师", "北京"),
    ("李四", "30", "设计师", "上海"),
    ("王五", "28", "产品经理", "广州"),
)
for name, age, position, city in csv_rows:
    print(f"{name:<6} {age:<4} {position:<10} {city:<6}")
```

**运行结果**：

```text
张三     25   工程师        北京
李四     30   设计师        上海
王五     28   产品经理       广州
```

每行是一个四元素元组，解包为 `name, age, position, city`——比索引访问 `row[0], row[1], row[2], row[3]` 更可读。

#### 2.9.3 一元二次方程求解

```python
import math

def solve_quadratic(a, b, c):
    discriminant = b**2 - 4*a*c
    if discriminant < 0:
        return None
    sqrt_d = math.sqrt(discriminant)
    x1 = (-b + sqrt_d) / (2 * a)
    x2 = (-b - sqrt_d) / (2 * a)
    return (x1, x2)

result = solve_quadratic(1, -5, 6)
if result:
    x1, x2 = result
    print(f"x1={x1}, x2={x2}")
```

**运行结果**：

```text
x1=3.0, x2=2.0
```

函数返回 `(x1, x2)` 元组，调用方直接解包接收——清晰的输入输出对应关系。

#### 2.9.4 简单模式匹配

Python 3.10+ 的 `match-case` 配合解包可以实现优雅的模式匹配：

```python
def handle_request(method, path):
    match (method, path):
        case ("GET", "/"):
            return "首页"
        case ("GET", "/users"):
            return "用户列表"
        case ("POST", "/users"):
            return "创建用户"
        case ("GET", _):
            return f"GET {path}"
        case _:
            return "未知请求"

requests = (("GET", "/"), ("GET", "/users"), ("POST", "/users"), ("DELETE", "/users/1"))
for method, path in requests:
    print(f"  {method} {path} → {handle_request(method, path)}")
```

**运行结果**：

```text
  GET / → 首页
  GET /users → 用户列表
  POST /users → 创建用户
  DELETE /users/1 → 未知请求
```

`match (method, path)` 将请求方法和路径打包成元组，然后与不同的元组模式匹配——解包让"基于结构的分支"变得自然。

---

## 3. 最佳实践

### 3.1 推荐写法 vs 不推荐写法

**交换变量用解包，不用临时变量**

```python
# 推荐：一行搞定
a, b = b, a

# 不推荐：临时变量
# temp = a
# a = b
# b = temp
```

**接收多返回值用解包，不用索引**

```python
# 推荐
name, age, job = get_user_info()

# 不推荐
# info = get_user_info()
# name = info[0]
# age = info[1]
# job = info[2]
```

**遍历元组对用解包，不用索引**

```python
# 推荐
for name, score in students:
    print(name, score)

# 不推荐
# for item in students:
#     print(item[0], item[1])
```

**数量不确定时用星号表达式**

```python
# 推荐
first, *rest = data

# 不推荐：先判断长度再分支
# if len(data) == 1:
#     first = data[0]
#     rest = []
# elif len(data) > 1:
#     first = data[0]
#     rest = list(data[1:])
```

### 3.2 常见错误模式

**错误模式1：变量数量不匹配**

```python
a, b = (1, 2, 3)  # ValueError: too many values to unpack
```

修正：用星号表达式 `a, *b = (1, 2, 3)`。

**错误模式2：忘记星号变量是列表**

```python
first, *rest = (1, 2, 3)
# rest 是 [2, 3]，不是 (2, 3)
# 如果后续代码期望 rest 是元组，会出问题
```

修正：如果需要元组，转换 `rest = tuple(rest)`。

**错误模式3：多个星号**

```python
# a, *b, *c = (1, 2, 3, 4)  # SyntaxError
```

修正：一个解包语句最多一个星号。

### 3.3 使用建议

| 场景 | 推荐写法 | 原因 |
|------|---------|------|
| 交换变量 | `a, b = b, a` | 一行替代三行 |
| 多返回值 | `return (x, y)` + `x, y = func()` | 惯用模式 |
| 遍历键值对 | `for k, v in items` | 比索引清晰 |
| 取头尾 | `first, *_, last = t` | 优雅且语义化 |
| 忽略元素 | `_, (a, b), _ = t` | 明确表示"不关心" |
| 函数可变参数 | `def f(*args)` | 收集为元组 |

---

## 4. 原理

### 4.1 解包的执行过程

`a, b, c = t` 的执行过程：

1. Python 识别左边是一个"目标元组"（target list），右边是一个可迭代对象。
2. 对右边调用 `iter(t)` 得到迭代器。
3. 依次 `next()` 取出元素，按顺序赋给左边的变量。
4. 如果元素太多（`next()` 还有值但变量已用完）→ `ValueError: too many values to unpack`。
5. 如果元素太少（`next()` 抛 `StopIteration` 但变量还有剩余）→ `ValueError: not enough values to unpack`。

### 4.2 星号表达式的实现

`a, *b, c = t` 的执行过程：

1. Python 识别左边有固定变量（`a`, `c`）和一个星号变量（`*b`）。
2. 先确定固定变量的数量（前 1 个 + 后 1 个 = 2 个）。
3. 迭代右边，前 1 个元素赋给 `a`，后 1 个元素赋给 `c`。
4. 中间所有剩余元素收集为一个**列表**赋给 `b`。
5. 如果元素不足以分配固定变量 → `ValueError`。

星号变量是列表而非元组的原因：列表可变，方便后续追加或修改。如果需要元组，可以用 `tuple(b)` 转换。

### 4.3 函数 *args 为什么收集为元组而非列表

函数定义中 `def f(*args)` 的 `args` 是元组类型，这与解包中星号变量是列表不同。原因：

1. **不可变性安全**：函数参数是调用者传入的数据快照，不应该被函数内部修改。元组不可变，保证参数不会被意外篡改。
2. **一致性**：`*args` 在语义上是"收集一组位置参数"，这组参数天然是不可变的——你不应该在函数内部往 `args` 里增删元素。
3. **与 **kwargs 对称**：`**kwargs` 收集为字典（可变），但 `*args` 选择元组（不可变）——参数收集后的"只读"语义更安全。

---

## 5. 总结

本文围绕元组解包与星号表达式展开，主要介绍了以下内容：

- **基本解包**：`a, b, c = t` 将元组元素逐一赋值给变量。变量数量必须与元素数量完全匹配，否则抛 `ValueError`。单元素解包左边需要逗号 `(val,) = t`。解包不限于元组——列表、字符串、`range` 等任何可迭代对象都可以解包。

- **变量交换**：`a, b = b, a` 是 Python 最优雅的交换语法——右边先打包成元组再解包给左边，无需临时变量。

- **星号表达式**：`a, *b, c = t` 用 `*b` 捕获剩余元素。星号变量始终是 **list** 类型（即使没有剩余元素也是空列表）。一个解包语句最多一个星号。可以用 `_` 忽略不需要的部分。

- **函数中的解包**：函数返回元组后直接解包接收是多返回值惯用模式。`def f(*args)` 收集位置参数为元组。`f(*args)` 在调用时将元组解包为位置参数。`for` 循环中解包元组对比索引访问更清晰。`enumerate` 和 `zip` 天然适合解包。

- **嵌套解包**：`a, (b, c), d = t` 可以拆解多层嵌套结构。变量结构与数据结构一一对应。嵌套中也可以使用星号。用 `_` 忽略不需要的嵌套层级。

- **最佳实践**：交换用解包不用临时变量；多返回值用解包不用索引；数量不确定用星号；遍历元组对用解包。注意星号变量是列表不是元组，一个语句最多一个星号。

- **底层原理**：解包通过迭代器协议逐元素赋值。星号表达式将剩余元素收集为列表（可变，方便后续处理）。函数 `*args` 收集为元组（不可变，保证参数安全），与解包中星号收集为列表的设计考量不同。
