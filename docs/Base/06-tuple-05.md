---
group:
  title: 【06】元组深度剖析
  order: 6
order: 5
title: namedtuple命名元组
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 namedtuple

namedtuple 是 Python 标准库 collections 模块中的一个工厂函数，它用于创建一种类似元组的自定义类，这种类的实例具有可访问的属性名，同时保持元组的不可变特性和高效性能。namedtuple 将元组的简洁性与类的可读性结合在一起，提供了一种轻量级的方式来定义简单数据结构。

```python
from collections import namedtuple

# 定义一个命名元组类
Point = namedtuple("Point", ["x", "y"])

# 创建实例
p = Point(10, 20)

# 可以像访问对象属性一样访问元素
print(p.x)  # 输出：10
print(p.y)  # 输出：20

# 同时也可以像元组一样使用索引访问
print(p[0])  # 输出：10
print(p[1])  # 输出：20
```

namedtuple 填补了元组和类之间的空白。当你需要创建一个简单的数据结构来存储固定数量的属性，但又不希望为此编写一个完整的类时，namedtuple 是理想的选择。它比普通类更简洁，比元组更易读。

### 1.2 为什么使用 namedtuple

在 Python 编程中，我们经常需要在简单数据容器和完整类之间做出选择。普通元组通过索引访问元素，代码可读性差；完整类功能强大，但编写和维护成本较高。namedtuple 提供了折中的方案。

```python
# 使用普通元组 - 可读性差
def get_position():
    return (10, 20, 30)

pos = get_position()
print(pos[0], pos[1], pos[2])  # 代码难以理解哪个是 x, y, z

# 使用命名元组 - 清晰明确
Position = namedtuple("Position", ["x", "y", "z"])
pos = Position(10, 20, 30)
print(pos.x, pos.y, pos.z)  # 一目了然

# 使用完整类 - 过于笨重
class Position:
    def __init__(self, x, y, z):
        self.x = x
        self.y = y
        self.z = z
```

命名元组的主要优势在于它结合了元组的不可变特性和类的命名属性访问能力，同时保持了极佳的性能。与字典相比，namedtuple 更轻量且支持元组解包；与列表相比，它提供命名访问且不可变；与完整类相比，它的定义更简洁。

### 1.3 namedtuple 与其他数据结构的对比

| 特性 | namedtuple | 元组 | 字典 | 类 |
|-----|-----------|------|------|-----|
| 访问方式 | 属性名 OR 索引 | 索引 | 键名 | 属性名 |
| 可变性 | 不可变 | 不可变 | 可变 | 可变 |
| 内存效率 | 高 | 最高 | 较低 | 低 |
| 代码量 | 少 | 最少 | 少 | 多 |
| 类型提示 | 有 | 无 | 无 | 有 |

## 2. 核心内容

### 2.1 基础的 namedtuple 定义

#### 2.1.1 基本定义方式

使用 namedtuple 的第一步是定义一个类。collections.namedtuple 接受两个必要参数：类名和字段名列表。

```python
from collections import namedtuple

# 定义命名元组类
# 方式一：字段名作为列表
Person = namedtuple("Person", ["name", "age", "city"])

# 方式二：字段名作为空格分隔的字符串
Person = namedtuple("Person", "name age city")

# 方式三：字段名作为字符串，用任意分隔符（需要 split=False）
Person = namedtuple("Person", "name,age,city")

# 创建实例
p = Person("Alice", 30, "Beijing")
print(p)  # 输出：Person(name='Alice', age=30, city='Beijing')
```

#### 2.1.2 字段名命名规则

字段名必须是有效的 Python 标识符，不能以数字开头，不能与 Python 关键字冲突。

```python
# 有效的字段名
Point = namedtuple("Point", ["x", "y", "z"])
Valid = namedtuple("Valid", ["name1", "name_2", "_private"])

# 无效的字段名会导致错误
# Error = namedtuple("Error", ["1invalid", "class", "for"])  # SyntaxError

# 如果必须使用保留字作为字段名，可以使用 renamed 参数
# Python 会自动将冲突的字段名改为下划线开头
Keyword = namedtuple("Keyword", ["class", "def", "for"], rename=True)
# field_0 会被自动重命名为 _0
print(Keyword._fields)  # 输出：('_0', 'def', 'for')
```

#### 2.1.3 创建和使用实例

```python
# 创建命名元组实例
User = namedtuple("User", ["username", "email", "level"])

# 方式一：位置参数
user1 = User("alice", "alice@example.com", "admin")

# 方式二：关键字参数
user2 = User(username="bob", email="bob@example.com", level="user")

# 方式三：_make 类方法（从可迭代对象创建）
data = ["charlie", "charlie@example.com", "guest"]
user3 = User._make(data)

print(user1)  # 输出：User(username='alice', email='alice@example.com', level='admin')
print(user2)  # 输出：User(username='bob', email='bob@example.com', level='user')
print(user3)  # 输出：User(username='charlie', email='charlie@example.com', level='guest')
```

### 2.2 属性访问与操作

#### 2.2.1 通过属性名访问

```python
# 定义命名元组
Product = namedtuple("Product", ["id", "name", "price", "stock"])

# 创建实例
p = Product(1, "Laptop", 5999, 100)

# 访问属性
print(p.id)     # 输出：1
print(p.name)   # 输出：Laptop
print(p.price)  # 输出：5999
print(p.stock)  # 输出：100
```

#### 2.2.2 通过索引访问

命名元组同时支持索引访问，保留了元组的特性。

```python
# 索引访问
print(p[0])   # 输出：1 (id)
print(p[1])   # 输出：Laptop (name)
print(p[2])   # 输出：5999 (price)

# 负索引
print(p[-1])  # 输出：100 (stock)
print(p[-2])  # 输出：5999 (price)

# 切片操作
print(p[1:3])  # 输出：('Laptop', 5999)
```

#### 2.2.3 解包操作

命名元组完全支持元组解包，这使得它可以方便地与各种 Python 语法配合使用。

```python
# 基础解包
p = Product(1, "Laptop", 5999, 100)
id, name, price, stock = p
print(f"{name}: ¥{price}")  # 输出：Laptop: ¥5999

# 星号解包
first, *rest = p
print(first)   # 输出：1
print(rest)    # 输出：['Laptop', 5999, 100]

# 在函数返回值中使用
def get_product_info():
    return Product(1, "Phone", 4999, 50)

id, name, price, stock = get_product_info()
print(f"ID:{id}, Name:{name}, Price:{price}")
```

#### 2.2.4 迭代功能

命名元组是可迭代对象，可以用于各种需要迭代的场景。

```python
# 直接迭代
p = Product(1, "Laptop", 5999, 100)
for field in p:
    print(field, end=" ")
# 输出：1 Laptop 5999 100
print()

# 在列表推导式中使用
products = [
    Product(1, "Laptop", 5999, 100),
    Product(2, "Phone", 4999, 50),
    Product(3, "Tablet", 2999, 80),
]

# 提取所有名称
names = [p.name for p in products]
print(names)  # 输出：['Laptop', 'Phone', 'Tablet']

# 筛选价格高于 4000 的产品
expensive = [p for p in products if p.price > 4000]
for p in expensive:
    print(f"{p.name}: {p.price}")
```

### 2.3 命名元组的方法

#### 2.3.1 _fields 属性

_fields 是一个类属性，返回所有字段名的元组。

```python
Person = namedtuple("Person", "name age city")
print(Person._fields)  # 输出：('name', 'age', 'city')

# 用例：动态处理字段
def introspect_namedtuple(nt_class):
    print(f"类型名称: {nt_class.__name__}")
    print(f"字段列表: {nt_class._fields}")
    for i, field in enumerate(nt_class._fields):
        print(f"  字段 {i}: {field}")

introspect_namedtuple(Person)
# 输出：
# 类型名称: Person
# 字段列表: ('name', 'age', 'city')
#   字段 0: name
#   字段 1: age
#   字段 2: city
```

#### 2.3.2 _asdict 方法

_asdict 方法返回一个 OrderedDict，将字段名映射到对应的值。

```python
Person = namedtuple("Person", "name age city")
p = Person("Alice", 30, "Beijing")

# 转换为有序字典
d = p._asdict()
print(d)  # 输出：OrderedDict([('name', 'Alice'), ('age', 30), ('city', 'Beijing')])

# 有序字典可以用于各种字典操作
print(d["name"])  # 输出：Alice
for key, value in d.items():
    print(f"{key}: {value}")
```

#### 2.3.3 _replace 方法

_replace 方法返回一个"修改了指定字段值"的新的命名元组实例。注意命名元组本身是不可变的，所以 _replace 实际上创建了一个新实例。

```python
Product = namedtuple("Product", "id name price stock")
p1 = Product(1, "Laptop", 5999, 100)

# 修改部分字段
p2 = p1._replace(price=4999, stock=50)
print(p2)  # 输出：Product(id=1, name='Laptop', price=4999, stock=50)

# 原实例不变
print(p1)  # 输出：Product(id=1, name='Laptop', price=5999, stock=100)

# 可以用于批量修改
updates = {"price": 4499, "stock": 30}
p3 = p1._replace(**updates)
print(p3)  # 输出：Product(id=1, name='Laptop', price=4499, stock=30)
```

#### 2.3.4 _make 方法

_make 是一个类方法，用于从可迭代对象创建命名元组实例。

```python
Person = namedtuple("Person", "name age city")

# 从列表创建
data = ["Bob", 25, "Shanghai"]
p1 = Person._make(data)
print(p1)  # 输出：Person(name='Bob', age=25, city='Shanghai')

# 从元组创建
data = ("Charlie", 35, "Guangzhou")
p2 = Person._make(data)
print(p2)  # 输出：Person(name='Charlie', age=35, city='Guangzhou')

# 从生成器创建
def gen():
    yield "Diana"
    yield 28
    yield "Shenzhen"

p3 = Person._make(gen())
print(p3)  # 输出：Person(name='Diana', age=28, city='Shenzhen')
```

### 2.4 命名元组的继承与扩展

#### 2.4.1 使用 defaults 参数（Python 3.7+）

从 Python 3.7 开始，namedtuple 支持默认值参数。

```python
from collections import namedtuple
import sys

# 定义带默认值的命名元组
User = namedtuple("User", ["name", "age", "city"], defaults=["Unknown", 0, "Unknown"])

# 创建实例时可以省略有默认值的字段
u1 = User("Alice")  # name="Alice", age=0, city="Unknown"
u2 = User("Bob", 25)  # name="Bob", age=25, city="Unknown"
u3 = User("Charlie", 30, "Beijing")  # 全部指定

print(u1)  # 输出：User(name='Alice', age=0, city='Unknown')
print(u2)  # 输出：User(name='Bob', age=25, city='Unknown')
print(u3)  # 输出：User(name='Charlie', age=30, city='Beijing')
```

#### 2.4.2 使用 rename 参数处理保留字

当字段名可能与 Python 关键字冲突时，使用 rename=True 让 Python 自动重命名冲突字段。

```python
# 字段名可能冲突
Record = namedtuple("Record", ["id", "class", "def", "for"], rename=True)

# 冲突的字段会被自动重命名
print(Record._fields)  # 输出：('id', '_1', '_2', '_3')

# 使用
r = Record(1, "A+", "pass", "active")
print(r)  # 输出：Record(id=1, class='A+', def='pass', for='active')
print(r.class)  # 输出：A+
print(r._1)     # 输出：A+ （也可用新名称访问）
```

#### 2.4.3 创建子类

可以通过继承 namedtuple 来添加方法或属性。

```python
from collections import namedtuple

# 创建基础命名元组
Point = namedtuple("Point", ["x", "y"])

# 扩展类
class Point3D(Point):
    """3D 点类，继承自 Point"""
    
    @property
    def z(self):
        return 0  # 默认 z=0
    
    def distance_to_origin(self):
        """计算到原点的距离"""
        return (self.x ** 2 + self.y ** 2 + self.z ** 2) ** 0.5
    
    def __str__(self):
        return f"Point3D(x={self.x}, y={self.y}, z={self.z})"

# 创建实例
p = Point3D(3, 4)
print(p)  # 输出：Point3D(x=3, y=4, z=0)
print(p.distance_to_origin())  # 输出：5.0

# 也可以用 _fields 扩展
Point4D = namedtuple("Point4D", Point._fields + ("z", "w"))
p4 = Point4D(1, 2, 3, 4)
print(p4)  # 输出：Point4D(x=1, y=2, z=3, w=4)
```

### 2.5 命名元组与类型注解

#### 2.5.1 基本类型注解

命名元组可以与类型注解结合使用，提高代码的可读性和类型安全性。

```python
from collections import namedtuple
from typing import NamedTuple

# 方式一：使用 namedtuple + 类型注解（Python 3.6+）
Point = namedtuple("Point", ["x", "y"])

# 在变量注解中使用
def distance(p1: Point, p2: Point) -> float:
    return ((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2) ** 0.5

p1 = Point(0, 0)
p2 = Point(3, 4)
print(distance(p1, p2))  # 输出：5.0
```

#### 2.5.2 使用 typing.NamedTuple（推荐）

从 Python 3.6 开始，推荐使用 typing.NamedTuple 来定义命名元组，它提供了更清晰的类型注解语法。

```python
from typing import NamedTuple

# 方式二：使用 typing.NamedTuple
class Point(NamedTuple):
    x: float
    y: float

# 创建实例
p = Point(3.0, 4.0)

# 自动类型检查
print(f"x = {p.x}, y = {p.y}")  # 输出：x = 3.0, y = 4.0
```

#### 2.5.3 带默认值和复杂类型

```python
from typing import NamedTuple, Optional, List

class User(NamedTuple):
    name: str
    age: int
    email: str
    tags: List[str] = []  # 带默认值
    bio: Optional[str] = None  # 可选类型

# 创建实例
u1 = User("Alice", 30, "alice@example.com")
u2 = User("Bob", 25, "bob@example.com", tags=["developer", "python"], bio="Hi")

print(u1)  # 输出：User(name='Alice', age=30, email='alice@example.com', tags=[], bio=None)
print(u2)  # 输出：User(name='Bob', age=25, email='bob@example.com', tags=['developer', 'python'], bio='Hi')

# 类型检查
# u3 = User("Invalid", "not_an_int", "email@example.com")  # 类型检查器会报错
```

### 2.6 命名元组与 JSON

#### 2.6.1 序列化与反序列化

```python
from collections import namedtuple
import json

# 定义命名元组
Person = namedtuple("Person", "name age city")

# 创建实例
p = Person("Alice", 30, "Beijing")

# 序列化为字典
d = p._asdict()
json_str = json.dumps(d)
print(json_str)  # 输出：{"name": "Alice", "age": 30, "city": "Beijing"}

# 从 JSON 反序列化
json_str = '{"name": "Bob", "age": 25, "city": "Shanghai"}'
d = json.loads(json_str)
p = Person(**d)  # 使用字典解包创建实例
print(p)  # 输出：Person(name='Bob', age=25, city='Shanghai')
```

#### 2.6.2 自定义序列化方法

```python
from collections import namedtuple
import json

class Person(namedtuple("Person", "name age city")):
    """带自定义 JSON 序列化的命名元组"""
    
    def to_json(self):
        return json.dumps(self._asdict())
    
    @classmethod
    def from_json(cls, json_str):
        return cls(**json.loads(json_str))

# 使用
p = Person("Alice", 30, "Beijing")
json_str = p.to_json()
print(json_str)  # 输出：{"name": "Alice", "age": 30, "city": "Beijing"}

p2 = Person.from_json(json_str)
print(p2)  # 输出：Person(name='Alice', age=30, city='Beijing')
```

## 3. 最佳实践

### 3.1 何时使用 namedtuple

**适合使用 namedtuple 的场景**

```python
# 场景一：返回多个值的函数
from collections import namedtuple

def get_statistics(numbers):
    Result = namedtuple("Result", ["min", "max", "avg", "sum"])
    return Result(
        min=min(numbers),
        max=max(numbers),
        avg=sum(numbers) / len(numbers),
        sum=sum(numbers)
    )

result = get_statistics([1, 2, 3, 4, 5])
print(f"最小: {result.min}, 最大: {result.max}, 平均: {result.avg}")

# 场景二：数据记录
from collections import namedtuple

LogEntry = namedtuple("LogEntry", ["timestamp", "level", "message"])
logs = [
    LogEntry("2024-01-01 10:00:00", "INFO", "Application started"),
    LogEntry("2024-01-01 10:01:00", "ERROR", "Connection failed"),
]

for log in logs:
    print(f"[{log.level}] {log.timestamp}: {log.message}")

# 场景三：配置对象
from collections import namedtuple

Config = namedtuple("Config", ["host", "port", "debug", "max_connections"])
config = Config("localhost", 8080, True, 100)
```

**不适合使用 namedtuple 的场景**

```python
# 场景一：需要经常修改字段值
# 考虑使用类或 dataclass
class Config:
    def __init__(self):
        self.host = "localhost"
        self.port = 8080

# 场景二：需要复杂的方法
# 考虑使用普通类
class Calculator:
    def add(self, a, b):
        return a + b
    # 更多方法...

# 场景三：需要验证输入
# 考虑使用 dataclass 或 Pydantic
```

### 3.2 命名规范

```python
# 推荐：使用有意义的类型名称
User = namedtuple("User", ["username", "email", "created_at"])
Point = namedtuple("Point", ["x", "y", "z"])
RGB = namedtuple("RGB", ["red", "green", "blue"])

# 避免：过于简短或模糊的名称
# BadExample = namedtuple("BadExample", ["a", "b", "c"])  # 不推荐

# 字段名使用下划线命名法
EmployeeRecord = namedtuple("EmployeeRecord", [
    "first_name",
    "last_name", 
    "employee_id",
    "department_code"
])
```

### 3.3 性能优化

#### 3.3.1 内存占用

```python
import sys
from collections import namedtuple

# 比较内存占用
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

PointNT = namedtuple("PointNT", ["x", "y"])

# 创建实例
p_class = Point(10, 20)
p_tuple = (10, 20)
p_named = PointNT(10, 20)

print(f"普通类: {sys.getsizeof(p_class)} bytes (不含属性)")
print(f"元组: {sys.getsizeof(p_tuple)} bytes")
print(f"命名元组: {sys.getsizeof(p_named)} bytes")
```

#### 3.3.2 创建速度

```python
import timeit
from collections import namedtuple

Point = namedtuple("Point", ["x", "y"])

# 方式一：直接构造函数
def create_direct():
    return Point(10, 20)

# 方式二：_make 方法
def create_make():
    return Point._make((10, 20))

# 方式三：_replace 方法
def create_replace():
    return Point(0, 0)._replace(x=10, y=20)

t1 = timeit.timeit(create_direct, number=100000)
t2 = timeit.timeit(create_make, number=100000)
t3 = timeit.timeit(create_replace, number=100000)

print(f"直接构造: {t1:.4f} 秒")
print(f"_make方法: {t2:.4f} 秒")
print(f"_replace: {t3:.4f} 秒")
```

### 3.4 错误处理

```python
from collections import namedtuple

# 字段数量不匹配
Point = namedtuple("Point", ["x", "y"])

# p = Point(1)  # 报错：TypeError: not enough values to unpack

# p = Point(1, 2, 3)  # 报错：TypeError: too many values to unpack

# 正确的创建方式
p = Point(1, 2)
print(p)  # 输出：Point(x=1, y=2)

# 字段名拼写错误会立即报错
# p = Point(x=1, y=2, z=3)  # 报错：unexpected keyword argument 'z'
```

## 4. 原理

### 4.1 namedtuple 的实现原理

namedtuple 本质上是一个工厂函数，它动态创建一个继承自 tuple 的新类。

```python
from collections import namedtuple

# 内部实现简化理解
# 1. 创建一个继承自 tuple 的类
# 2. 添加属性访问功能（通过 __getattribute__）
# 3. 添加特殊方法（_fields, _asdict, _replace, _make）

Point = namedtuple("Point", ["x", "y"])
print(f"基类: {Point.__bases__}")  # 输出：(<class 'tuple'>,)
print(f"类型: {type(Point)}")  # 输出：<class 'type'>
```

### 4.2 属性访问的实现

```python
# namedtuple 通过 __getattribute__ 实现属性访问
# 简化理解：
class Point(tuple):
    @property  # 实际上是动态生成的
    def x(self):
        return self[0]
    
    @property
    def y(self):
        return self[1]

# 实际实现使用 __slots__ 优化内存
# 并使用 __getnewargs__ 确保可哈希
```

### 4.3 可哈希性

命名元组作为元组的子类，天然支持哈希，这使得它可以作为字典键或放入集合中。

```python
from collections import namedtuple

Point = namedtuple("Point", ["x", "y"])

# 验证可哈希性
p1 = Point(1, 2)
p2 = Point(1, 2)

print(f"哈希值相同: {hash(p1) == hash(p2)}")  # 输出：True

# 作为字典键
points_map = {p1: "origin", p2: "duplicate_key"}
print(f"字典大小: {len(points_map)}")  # 输出：1（相同键只存一个）

# 作为集合元素
points_set = {p1, p2}
print(f"集合大小: {len(points_set)}")  # 输出：1（自动去重）
```

## 5. 总结

### 5.1 核心要点

命名元组是 Python 中一个强大的数据结构，它结合了元组的不可变特性和类的命名属性访问能力。通过 namedtuple，可以快速创建轻量级、结构清晰的数据类型，适用于函数返回值、数据记录、配置对象等多种场景。

### 5.2 使用场景速查

| 场景 | 推荐 | 说明 |
|-----|------|------|
| 函数返回多个值 | namedtuple | 清晰表达返回值结构 |
| 数据记录 | namedtuple | 简洁定义固定字段的数据结构 |
| 配置对象 | namedtuple | 定义只读配置 |
| 需要修改的复杂对象 | dataclass | 支持可变字段 |
| 需要验证的模型 | Pydantic | 内置数据验证 |

### 5.3 读完应能掌握

- 能理解 namedtuple 的概念和优势
- 能创建和使用命名元组类型
- 能熟练使用 _fields、_asdict、_replace、_make 等方法
- 能区分 namedtuple 和其他数据结构的适用场景
- 能在实际项目中选择合适的数据结构

### 5.4 常见面试问题

**问题一：namedtuple 和类的区别**

```python
from collections import namedtuple

# namedtuple
PointNT = namedtuple("Point", ["x", "y"])
p = PointNT(1, 2)
print(f"namedtuple: {p.x}, {p[0]}")  # 属性和索引都能访问+ 不支持修改属性

# 普通类
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

p = Point(1, 2)
p.x = 10  # 可以修改
print(f"类: {p.x}")
# namedtuple 更轻量，不可变；类更灵活，可变
```

**问题二：namedtuple 的不可变性**

```python
from collections import namedtuple

Point = namedtuple("Point", ["x", "y"])
p = Point(1, 2)

# p.x = 10  # 报错：AttributeError: can't set attribute

# 但可以通过 _replace 创建新实例
p2 = p._replace(x=10)
print(f"原实例: {p}")   # 输出：Point(x=1, y=2)
print(f"新实例: {p2}")  # 输出：Point(x=10, y=2)
```

**问题三：namedtuple 与 dataclass 的对比**

```python
# namedtuple（Python 3.6+）
from collections import namedtuple
Point = namedtuple("Point", ["x", "y"])

# dataclass（Python 3.7+）
from dataclasses import dataclass

@dataclass
class PointDC:
    x: float
    y: float

# 主要区别：
# - namedtuple 不可变，dataclass 可变
# - namedtuple 更轻量
# - dataclass 支持 type hints 更完善
# - dataclass 支持默认值和方法
```
