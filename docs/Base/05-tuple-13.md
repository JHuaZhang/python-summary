---
group:
  title: 【05】元组介绍
  order: 6
order: 13
title: 命名元组 namedtuple
nav:
  title: Python基础
  order: 1
---

# 命名元组 namedtuple

## 1. 介绍

### 1.1 什么是命名元组

命名元组（namedtuple）是 Python 标准库 `collections` 模块提供的一个工厂函数，用于创建一种**带字段名称的元组子类**。普通元组只能通过索引访问元素（`t[0]`、`t[1]`），而命名元组允许通过属性名访问（`p.x`、`p.y`），同时完全兼容普通元组的所有操作。

打个比方：普通元组就像一排没有标签的储物柜——你知道第 3 个格子里有东西，但不知道里面存的是什么。命名元组就是给每个格子贴上了标签——`name`、`age`、`gpa`——一眼就知道哪个格子放什么。东西还是那些东西，柜子还是那个柜子，只是有了标签，取用更方便。

### 1.2 解决什么问题

在 Python 中，当你需要表示一组相关的数据时，常见有几种选择：

```python
# 方式一：普通元组——轻量但可读性差
student_tuple = ("张三", 20, "计算机科学", 3.8)
# 过一个月再来看代码，谁知道 student_tuple[2] 是什么？

# 方式二：字典——可读性好但内存开销大
student_dict = {"name": "张三", "age": 20, "major": "计算机科学", "gpa": 3.8}
# 每次访问都要写 student_dict["name"]，而且字典可变、不可哈希

# 方式三：命名元组——两全其美
from collections import namedtuple
Student = namedtuple("Student", ["name", "age", "major", "gpa"])
student = Student("张三", 20, "计算机科学", 3.8)
# student.name、student.age 一目了然，且内存占用和普通元组一样小
```

命名元组的定位是"轻量级不可变数据容器"——当你需要比普通元组更好的可读性，又不需要字典的可变性或自定义类的灵活性时，命名元组是最佳选择。

### 1.3 最简示例

```python
from collections import namedtuple

# 定义一个命名元组类型
Point = namedtuple("Point", ["x", "y"])

# 创建实例
p = Point(3, 4)

# 属性访问
print(p.x)      # 3
print(p.y)      # 4

# 索引访问（和普通元组完全兼容）
print(p[0])     # 3
print(p[1])     # 4

# 解包（也和普通元组一样）
x, y = p
print(x, y)     # 3 4
```

## 2. 核心内容

### 2.1 创建命名元组

#### 2.1.1 namedtuple 工厂函数签名

```python
collections.namedtuple(typename, field_names, *, rename=False, defaults=None, module=None)
```

各参数含义如下：

| 参数 | 类型 | 说明 |
|------|------|------|
| `typename` | str | 创建的命名元组类型名称（即类名） |
| `field_names` | 序列或字符串 | 字段名列表，可以是列表、空格分隔的字符串 |
| `rename` | bool | 是否自动重命名非法字段名，默认 `False` |
| `defaults` | 序列或 None | 字段默认值列表，从右向左匹配，默认 `None` |
| `module` | str | 设置新类型的 `__module__` 属性，用于 pickling |

#### 2.1.2 字段名的两种定义方式

字段名可以用列表传入，也可以用空格或逗号分隔的字符串传入，两种方式等价：

```python
from collections import namedtuple

# 方式一：列表
Color1 = namedtuple("Color", ["red", "green", "blue"])

# 方式二：空格分隔的字符串
Color2 = namedtuple("Color", "red green blue")

# 方式三：逗号分隔的字符串
Color3 = namedtuple("Color", "red, green, blue")

# 三种方式创建的类型行为完全一致
c1 = Color1(255, 128, 0)
c2 = Color2(255, 128, 0)
print(c1)  # Color(red=255, green=128, blue=0)
print(c2)  # Color(red=255, green=128, blue=0)
```

**示例**

列表方式更清晰，适合字段较多或字段名较长时使用。字符串方式更简洁，适合字段较少的快速定义。

#### 2.1.3 字段名规则

字段名必须符合 Python 标识符的规则：

- 只能包含字母、数字和下划线
- 不能以数字开头
- 不能是 Python 关键字（如 `class`、`def`、`return` 等）
- 以下划线开头的字段名会被保留给命名元组自身的方法（如 `_fields`、`_replace`）

如果字段名不合法且 `rename=False`（默认），会直接抛出 `ValueError`。如果 `rename=True`，非法字段名会被自动替换为 `_<位置索引>`：

```python
from collections import namedtuple

# 不用 rename：非法字段名报错
try:
    Bad = namedtuple("Bad", ["abc", "def", "123"])
except ValueError as e:
    print(f"ValueError: {e}")
    # ValueError: Type names and field names cannot be a keyword: 'def'

# 用 rename=True：非法字段名自动重命名
Good = namedtuple("Good", ["abc", "def", "123"], rename=True)
print(Good._fields)  # ('abc', '_1', '_2')
# "abc" 合法 → 保持原名
# "def" 是关键字 → 替换为 _1
# "123" 以数字开头 → 替换为 _2

t = Good("hello", "world", "baz")
print(t.abc)  # hello
print(t._1)   # world
print(t._2)   # baz
```

**运行结果**：

```text
ValueError: Type names and field names cannot be a keyword: 'def'
('abc', '_1', '_2')
hello
world
baz
```

**适用场景**：当从数据库、CSV 文件等外部数据源读取列名时，列名可能包含非法字符或与 Python 关键字冲突。这时用 `rename=True` 可以自动处理，避免报错中断程序。

### 2.2 属性访问与索引访问

命名元组同时支持属性访问和索引访问，这是它"既是元组又有属性名"的核心体现。

```python
from collections import namedtuple

Point = namedtuple("Point", ["x", "y"])
p = Point(10, 20)

# 属性访问——通过字段名
print(p.x)       # 10
print(p.y)       # 20

# 索引访问——和普通元组完全兼容
print(p[0])      # 10
print(p[1])      # 20

# 解包
x, y = p
print(x, y)      # 10 20

# 迭代
for item in p:
    print(item)  # 10, 20

# 成员判断
print(10 in p)   # True
```

属性访问和索引访问返回相同的值，区别在于可读性。`p.x` 比 `p[0]` 更自文档化——读代码的人不需要去记住"第 0 个字段是 x"。

**关键点**：属性访问是命名元组存在的核心意义。如果你只用索引访问，那和普通元组没有区别。属性名让你的代码自带文档。

### 2.3 不可变性与替换

#### 2.3.1 不可变性

命名元组继承自 `tuple`，因此具有和普通元组一样的不可变性：

```python
from collections import namedtuple

Point = namedtuple("Point", ["x", "y"])
p = Point(3, 4)

# 不能修改字段值
try:
    p.x = 100
except AttributeError as e:
    print(f"AttributeError: {e}")
    # AttributeError: can't set attribute
```

不可变性意味着命名元组创建后就固定不变。这是它的特性而非缺陷——不可变对象更安全，可以被用作字典键、集合元素，也可以安全地在多线程环境中共享。

#### 2.3.2 _replace 方法

虽然不能就地修改字段，但命名元组提供了 `_replace` 方法来**创建一个修改了部分字段的新实例**：

```python
from collections import namedtuple

Employee = namedtuple("Employee", ["name", "department", "salary", "level"])

emp = Employee("王五", "技术部", 20000, "P5")
print(f"原始: {emp}")
# Employee(name='王五', department='技术部', salary=20000, level='P5')

# 只替换 salary 字段，其余字段保持不变
emp_raise = emp._replace(salary=25000)
print(f"加薪后: {emp_raise}")
# Employee(name='王五', department='技术部', salary=25000, level='P5')

# 同时替换多个字段
emp_promote = emp._replace(salary=25000, level="P6")
print(f"升职加薪: {emp_promote}")
# Employee(name='王五', department='技术部', salary=25000, level='P6')

# 原始对象不受影响
print(f"原始未变: {emp}")
# Employee(name='王五', department='技术部', salary=20000, level='P5')
```

`_replace` 的名字容易让人误解为"修改"，但它实际上遵循的是不可变对象的设计模式——不修改原对象，而是返回一个新对象。这类似于字符串的 `replace` 方法：`"hello".replace("l", "x")` 不会修改原字符串，而是返回新字符串。

### 2.4 命名元组的特殊方法

命名元组自带以下以单下划线开头的方法和属性（下划线前缀是为了避免与用户定义的字段名冲突）：

#### 2.4.1 _make：从可迭代对象批量创建

`_make` 接收一个可迭代对象，将其元素按顺序映射到字段，创建一个新实例：

```python
from collections import namedtuple

Point = namedtuple("Point", ["x", "y"])

# 从列表创建
p1 = Point._make([10, 20])
print(p1)  # Point(x=10, y=20)

# 从生成器创建
p2 = Point._make(v * 2 for v in [5, 10])
print(p2)  # Point(x=10, y=20)

# 从 map 对象创建
p3 = Point._make(map(int, ["100", "200"]))
print(p3)  # Point(x=100, y=200)
```

**运行结果**：

```text
Point(x=10, y=20)
Point(x=10, y=20)
Point(x=100, y=200)
```

`_make` 与直接构造函数的区别在于语义清晰性：`Point._make(data)` 明确表达了"从已有数据序列构建"，而 `Point(*data)` 需要解包，且在数据量不匹配时报错信息不够直观。

#### 2.4.2 _asdict：转为字典

`_asdict` 将命名元组转为字典（Python 3.8+ 返回普通 `dict`，之前版本返回 `OrderedDict`）：

```python
from collections import namedtuple

Student = namedtuple("Student", ["name", "age", "gpa"])
s = Student("李四", 22, 3.9)

d = s._asdict()
print(d)          # {'name': '李四', 'age': 22, 'gpa': 3.9}
print(type(d))    # <class 'dict'>
```

**适用场景**：当你需要把命名元组的数据传给期望字典的函数（如 JSON 序列化、模板渲染），或者需要用键值遍历时，`_asdict` 是最方便的转换方式。

#### 2.4.3 _fields：字段名元组

`_fields` 返回一个包含所有字段名的元组，可用于动态遍历字段：

```python
from collections import namedtuple

Student = namedtuple("Student", ["name", "age", "gpa"])
print(Student._fields)  # ('name', 'age', 'gpa')

s = Student("赵六", 21, 3.5)

# 动态遍历所有字段
for field in Student._fields:
    print(f"  {field} = {getattr(s, field)}")

# 输出：
#   name = 赵六
#   age = 21
#   gpa = 3.5
```

`_fields` 还可以用于动态创建新的命名元组类型——在原有类型基础上增加字段：

```python
Point = namedtuple("Point", ["x", "y"])
ColoredPoint = namedtuple("ColoredPoint", Point._fields + ("color",))

cp = ColoredPoint(10, 20, "red")
print(cp)  # ColoredPoint(x=10, y=20, color='red')
```

#### 2.4.4 _field_defaults：查看默认值

`_field_defaults` 返回一个包含字段默认值的字典（Python 3.8+）：

```python
from collections import namedtuple

Config = namedtuple("Config", ["host", "port", "timeout"], defaults=[8080, 30])
print(Config._field_defaults)
# {'port': 8080, 'timeout': 30}
```

只有设置了默认值的字段才会出现在 `_field_defaults` 中。`host` 没有默认值，所以不在字典里。

### 2.5 defaults 参数详解

`defaults` 参数允许为字段设置默认值，让某些字段在创建实例时可以省略。

#### 2.5.1 从右向左匹配规则

`defaults` 是一个序列（列表或元组），其元素**从右向左**匹配字段。这一点非常重要——不是从左向右，也不是按名称匹配。

```python
from collections import namedtuple

# 4 个字段，3 个默认值 → 第一个字段必填，后三个有默认值
Settings = namedtuple(
    "Settings",
    ["env", "debug", "timeout", "retries"],
    defaults=[True, 30, 3],  # debug=True, timeout=30, retries=3
)

print(Settings._field_defaults)
# {'debug': True, 'timeout': 30, 'retries': 3}

# 只传 env，其余用默认值
s1 = Settings("production")
print(s1)  # Settings(env='production', debug=True, timeout=30, retries=3)

# 传 env 和 debug
s2 = Settings("staging", False)
print(s2)  # Settings(env='staging', debug=False, timeout=30, retries=3)
```

**运行结果**：

```text
{'debug': True, 'timeout': 30, 'retries': 3}
Settings(env='production', debug=True, timeout=30, retries=3)
Settings(env='staging', debug=False, timeout=30, retries=3)
```

#### 2.5.2 defaults 数量规则

| defaults 数量 | 字段数量 | 效果 |
|:---:|:---:|------|
| 0 | N | 全部必填 |
| k (k < N) | N | 前 N-k 个字段必填，后 k 个有默认值 |
| N | N | 全部有默认值，可以零参创建 |
| > N | N | 报错 `TypeError` |

```python
from collections import namedtuple

# defaults 数量等于字段数量 → 可零参创建
AllDefault = namedtuple("AllDefault", ["a", "b", "c"], defaults=[1, 2, 3])
obj = AllDefault()  # 无需传参
print(obj)  # AllDefault(a=1, b=2, c=3)

# defaults 数量超过字段数量 → 报错
try:
    Bad = namedtuple("Bad", ["a", "b"], defaults=[1, 2, 3])
except TypeError as e:
    print(f"TypeError: {e}")
    # TypeError: Got more default values than field names
```

#### 2.5.3 defaults 实际应用

一个典型的应用场景是配置管理——大多数字段都有合理的默认值，只有少数关键字段需要调用方显式指定：

```python
from collections import namedtuple

DBConfig = namedtuple(
    "DBConfig",
    ["host", "port", "database", "user", "password"],
    defaults=["localhost", 5432, "mydb", "admin", ""],
)

# 开发环境——全部用默认值
dev = DBConfig()
print(dev)
# DBConfig(host='localhost', port=5432, database='mydb', user='admin', password='')

# 生产环境——显式指定
prod = DBConfig("prod.db.internal", 5432, "prod_db", "app_user", "secret")
print(prod)
# DBConfig(host='prod.db.internal', port=5432, database='prod_db', user='app_user', password='secret')
```

### 2.6 命名元组的类型关系

命名元组是 `tuple` 的子类，这一点非常关键——它意味着命名元组可以无缝替换普通元组：

```python
from collections import namedtuple

Point = namedtuple("Point", ["x", "y"])
p = Point(1, 2)

# isinstance 检查
print(isinstance(p, Point))   # True
print(isinstance(p, tuple))   # True

# 父类关系
print(Point.__bases__)        # (<class 'tuple'>,)
```

**运行结果**：

```text
True
True
(<class 'tuple'>,)
```

这意味着：

- 任何期望 `tuple` 参数的函数都能接收命名元组
- 命名元组支持解包、迭代、索引、切片等所有元组操作
- 命名元组可哈希，可作字典键和集合元素
- 命名元组不可变，与普通元组的不可变语义一致

```python
# 可以在期望 tuple 的地方无缝使用
def calculate_distance(point):
    x, y = point  # 解包
    return (x**2 + y**2) ** 0.5

p = Point(3, 4)
print(calculate_distance(p))  # 5.0

# 可以作为字典键
city_map = {Point(0, 0): "原点", Point(1, 1): "对角点"}
print(city_map[Point(0, 0)])  # "原点"
```

### 2.7 namedtuple 的底层原理

namedtuple 是一个**工厂函数**——它不创建实例，而是创建类。调用 `namedtuple("Point", ["x", "y"])` 时，Python 在运行时动态生成一个 Point 类。

核心机制如下：

```text
namedtuple("Point", ["x", "y"])
         ↓
  1. 创建一个继承自 tuple 的新类
  2. 为每个字段生成 property（只读属性描述符）
  3. 生成 __new__ 方法，接受位置参数和关键字参数
  4. 生成 __repr__ 方法，输出 "Point(x=..., y=...)" 格式
  5. 添加 _make、_asdict、_replace、_fields 等方法
         ↓
  返回 Point 类（不是实例）
```

你可以验证这一点：

```python
from collections import namedtuple

Point = namedtuple("Point", ["x", "y"])
p = Point(3, 4)

# x 和 y 是 property 对象
print(type(Point.x))  # <class 'property'>

# __repr__ 是自动生成的
print(p.__repr__())   # "Point(x=3, y=4)"

# __new__ 接受位置参数和关键字参数
p1 = Point(3, 4)         # 位置参数
p2 = Point(x=3, y=4)     # 关键字参数
```

因为字段是通过 `property` 实现的，所以属性访问实际上是通过描述符协议完成的——每次访问 `p.x` 时，Python 会调用 `Point.x.__get__(p, Point)` 来获取值。这使得属性访问和索引访问的性能几乎相同。

理解这个原理的意义在于：

- namedtuple 创建的是类，不是实例。你定义一次 `Point = namedtuple(...)`，然后多次创建实例 `Point(1, 2)`、`Point(3, 4)`
- 字段名在创建类时确定，之后不能添加或删除字段
- 因为继承了 tuple，所有 tuple 的协议（序列、可迭代、可哈希）都自动满足

## 3. 最佳实践

### 3.1 推荐 vs 不推荐写法

**推荐：类型名使用首字母大写的驼峰命名**

```python
# 推荐
UserRecord = namedtuple("UserRecord", ["id", "name", "email"])
HttpResponse = namedtuple("HttpResponse", ["status", "headers", "body"])
```

**不推荐：类型名全小写**

```python
# 不推荐——容易与变量混淆
user_record = namedtuple("user_record", ["id", "name", "email"])
```

命名元组创建的是一个类，按照 Python 的命名惯例，类名应该使用首字母大写的驼峰命名法（如 `UserRecord`），而不全小写。

**推荐：字段名使用下划线分隔的小写命名**

```python
# 推荐
Config = namedtuple("Config", ["host_name", "port_number", "timeout_seconds"])
```

**不推荐：字段名使用驼峰命名**

```python
# 不推荐——不符合 Python 惯例
Config = namedtuple("Config", ["hostName", "portNumber", "timeoutSeconds"])
```

**推荐：在模块顶部定义命名元组类型**

```python
from collections import namedtuple

# 在模块顶部定义类型（只定义一次）
Point = namedtuple("Point", ["x", "y"])
Student = namedtuple("Student", ["name", "age", "gpa"])

def process_data():
    # 使用已定义的类型
    p = Point(1, 2)
    ...
```

**不推荐：在函数内部重复定义类型**

```python
# 不推荐——每次调用都重新创建类，浪费性能
def process_data(x, y):
    Point = namedtuple("Point", ["x", "y"])  # 每次调用都创建新类！
    return Point(x, y)
```

每次调用 `namedtuple()` 都会在运行时动态创建一个新类，这是一项有开销的操作。应该在模块顶部定义一次，然后在多处复用。

### 3.2 何时使用命名元组

| 场景 | 适合用 namedtuple | 理由 |
|------|:---:|------|
| 函数返回多个值 | 适合 | 比返回元组更可读，比返回字典更轻量 |
| 数据库查询结果映射 | 适合 | 列名 → 字段名，行数据 → 实例 |
| CSV 文件读取 | 适合 | 表头 → 字段名，行数据 → 实例 |
| 不可变的配置对象 | 适合 | 不可变 + 属性访问 + 可哈希 |
| 坐标/向量等数学对象 | 适合 | 不可变 + 可哈希 + 可解包 |
| 需要频繁修改数据 | 不适合 | 用 dataclass 或普通类 |
| 需要添加方法 | 不适合 | 继承 namedtuple 或用 dataclass |
| 字段结构动态变化 | 不适合 | 用字典 |

### 3.3 常见错误模式及修正

**错误一：尝试修改字段**

```python
Point = namedtuple("Point", ["x", "y"])
p = Point(1, 2)

# 错误：直接赋值
# p.x = 10  # AttributeError: can't set attribute

# 修正：使用 _replace
p = p._replace(x=10)
```

**错误二：忘记 _replace 返回新对象**

```python
p = Point(1, 2)

# 错误：忽略返回值
p._replace(x=10)  # 返回了新对象，但没接收
print(p.x)  # 仍然是 1

# 修正：接收返回值
p = p._replace(x=10)
print(p.x)  # 10
```

**错误三：defaults 数量超过字段数量**

```python
# 错误
try:
    Bad = namedtuple("Bad", ["a", "b"], defaults=[1, 2, 3])
except TypeError as e:
    print(f"TypeError: {e}")
    # TypeError: Got more default values than field names

# 修正：defaults 数量不能超过字段数量
Good = namedtuple("Good", ["a", "b", "c"], defaults=[1, 2, 3])
```

**错误四：字段名以下划线开头**

```python
# 错误：以下划线开头的字段名可能与内置方法冲突
try:
    Bad = namedtuple("Bad", ["name", "_fields"])  # _fields 是保留属性
except ValueError as e:
    print(f"ValueError: {e}")

# 修正：避免以下划线开头的字段名
Good = namedtuple("Good", ["name", "field_list"])
```

## 4. 原理

### 4.1 namedtuple 的内存优势

命名元组和普通元组在内存占用上几乎相同，因为属性名存储在类上而非实例上：

```python
import sys
from collections import namedtuple

plain_tuple = ("张三", 28, "工程师")
Point = namedtuple("Person", ["name", "age", "title"])
named_tuple = Point("张三", 28, "工程师")

print(f"普通元组: {sys.getsizeof(plain_tuple)} bytes")
print(f"命名元组: {sys.getsizeof(named_tuple)} bytes")
```

**运行结果**：

```text
普通元组: 64 bytes
命名元组: 64 bytes
```

两者的内存占用完全相同。原因是命名元组的实例存储结构和普通元组一样——一个指向元素的指针数组。字段名——"name"、"age"、"title"——是作为 property 对象存储在**类**上的，每个实例共享同一份类定义，不会为每个实例重复存储字段名。

这就是命名元组相比字典的内存优势根源：字典需要为每个实例存储键名，而命名元组的键名（字段名）只存储在类上。

```python
d = {"name": "张三", "age": 28, "title": "工程师"}
print(f"字典: {sys.getsizeof(d)} bytes")  # 184 bytes——约为元组的 3 倍
```

### 4.2 namedtuple 与 dataclass 的选择

Python 3.7 引入了 `dataclass` 装饰器，它也能创建带属性名的轻量级数据类。那么 namedtuple 和 dataclass 该怎么选？

| 维度 | namedtuple | dataclass |
|------|-----------|-----------|
| 不可变 | 默认不可变 | 默认可变（`frozen=True` 可设为不可变） |
| 可哈希 | 默认可哈希 | 默认不可哈希（`frozen=True` 后可哈希） |
| 解包 | 支持解包 `x, y = p` | 不支持解包 |
| 继承 | 继承自 tuple | 继承自 object |
| 内存 | 与元组相同 | 通常略大 |
| 添加方法 | 不方便（需继承） | 方便（直接在类中定义） |
| 类型注解 | 不支持 | 原生支持 |
| 位置参数 | 按位置传参 | 默认不支持（需自定义 `__init__`） |
| 适合场景 | 不可变数据容器、元组替代品 | 需要方法、可变数据、类型注解 |

**选择建议**：

- 数据不可变、需要解包、需要可哈希 → namedtuple
- 需要添加自定义方法、需要可变性、需要类型注解 → dataclass
- 简单的数据载体，不需要额外方法 → 两者都行，namedtuple 更轻量

```python
from collections import namedtuple
from dataclasses import dataclass

# namedtuple：不可变、可解包、可哈希
Point = namedtuple("Point", ["x", "y"])
p = Point(1, 2)
x, y = p  # 解包
d = {p: "origin"}  # 可哈希

# dataclass：可变、支持方法、支持类型注解
@dataclass
class PointDC:
    x: float
    y: float

    def distance_to_origin(self):
        return (self.x ** 2 + self.y ** 2) ** 0.5

dc = PointDC(1.0, 2.0)
dc.x = 10  # 可变
print(dc.distance_to_origin())  # 可添加方法
```

## 5. 总结

本文围绕命名元组 namedtuple 展开，主要介绍了以下内容：

- **基本概念**：namedtuple 是 `collections` 模块提供的工厂函数，创建带字段名称的元组子类，兼具元组的轻量和属性访问的可读性
- **创建方式**：通过 `namedtuple(typename, field_names)` 创建类型，字段名可用列表或空格分隔的字符串传入，`rename=True` 可自动处理非法字段名
- **访问方式**：同时支持属性访问（`p.x`）和索引访问（`p[0]`），完全兼容普通元组的解包、迭代、切片操作
- **不可变性与替换**：字段不可修改，但可用 `_replace()` 创建修改了部分字段的新实例
- **特殊方法**：`_make` 从可迭代对象批量创建、`_asdict` 转字典、`_fields` 查看字段名、`_field_defaults` 查看默认值
- **defaults 参数**：从右向左匹配字段，用于设置默认值，让部分字段可在创建时省略
- **类型关系**：命名元组是 tuple 的子类，可无缝替换普通元组，可哈希可解包
- **底层原理**：namedtuple 在运行时动态创建类，字段名通过 property 存储在类上，实例不重复存储字段名
- **最佳实践**：类型名用驼峰命名、字段名用下划线命名、在模块顶部定义类型避免重复创建
- **选型建议**：不可变数据容器选 namedtuple，需要方法和可变性选 dataclass
