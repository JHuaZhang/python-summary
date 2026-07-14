---
group:
  title: 【06】元组深度剖析
  order: 6
order: 1
title: 元组创建与单元素陷阱
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是元组

元组（Tuple）是 Python 中一种有序的、不可变的序列类型。与列表（list）类似，元组可以存储任意类型的元素，但一旦创建后就无法修改其中的元素。元组使用圆括号 `()` 来表示，而不是列表的方括号 `[]`。

```python
# 元组的基本定义
empty_tuple = ()
single_tuple = (1,)
multi_tuple = (1, 2, 3)
mixed_tuple = (1, "hello", 3.14, True)
```

元组在 Python 中应用广泛：
- 作为字典的键（因为不可变）
- 作为函数的返回值（可以返回多个值）
- 用于数据解包和交换变量
- 作为可迭代对象在函数间传递

### 1.2 元组与列表的区别

虽然元组和列表看起来相似，但有本质区别：

| 特性 | 元组 | 列表 |
|-----|------|------|
| 语法 | `(1, 2, 3)` | `[1, 2, 3]` |
| 可变性 | 不可变 | 可变 |
| 性能 | 更轻量，略快 | 略重 |
| 用途 | 固定数据、常量 | 动态数据 |
| 内存 | 占用更少 | 占用更多 |
| 方法 | 少（只有 count, index） | 多（append, insert 等） |

```python
# 不可变性示例
point = (10, 20)
print(point)  # 输出：(10, 20)

# 尝试修改会报错
# point[0] = 15  # TypeError: 'tuple' object does not support item assignment

# 列表可以修改
point_list = [10, 20]
point_list[0] = 15
print(point_list)  # 输出：[15, 20]
```

### 1.3 为什么存在单元素元组陷阱

这是 Python 元组最独特也最易错的特性：**单元素元组必须在元素后面加逗号**，否则圆括号会被当作分组运算符而不是元组标志。

```python
# 这是什么？
not_a_tuple = (1)
print(type(not_a_tuple))  # 输出：<class 'int'>
print(not_a_tuple)  # 输出：1

# 正确的单元素元组
is_a_tuple = (1,)
print(type(is_a_tuple))  # 输出：<class 'tuple'>
print(is_a_tuple)  # 输出：(1,)
```

这个陷阱经常让 Python 新手困惑不解。理解其原理对于正确使用元组至关重要。

## 2. 核心内容

### 2.1 元组的创建方式

#### 2.1.1 使用圆括号创建

最直接的创建方式是使用圆括号：

```python
# 空元组
empty = ()
print(empty)  # 输出：()
print(len(empty))  # 输出：0

# 多元素元组
point = (10, 20)
coords = (1.5, 2.5, 3.5)
person = ("Alice", 30, "Beijing")

# 多行定义（方便阅读）
config = (
    "localhost",
    8080,
    "database",
)
```

#### 2.1.2 使用 tuple() 构造函数

tuple() 可以从其他可迭代对象创建元组：

```python
# 从列表创建
list_data = [1, 2, 3]
tuple_from_list = tuple(list_data)
print(tuple_from_list)  # 输出：(1, 2, 3)

# 从字符串创建（字符序列）
tuple_from_str = tuple("hello")
print(tuple_from_str)  # 输出：('h', 'e', 'l', 'l', 'o')

# 从 range 创建
tuple_from_range = tuple(range(5))
print(tuple_from_range)  # 输出：(0, 1, 2, 3, 4)

# 从字典创建（只取键）
tuple_from_dict = tuple({"a": 1, "b": 2})
print(tuple_from_dict)  # 输出：('a', 'b')

# 从集合创建（无序）
tuple_from_set = tuple({1, 2, 3})
print(tuple_from_set)  # 输出：(1, 2, 3)
```

#### 2.1.3 省略括号的隐式创建

在某些情况下，Python 允许省略圆括号：

```python
# 多个变量赋值时自动创建元组
a, b, c = 1, 2, 3
print(type((a, b, c)))  # 输出：<class 'tuple'>
print((a, b, c))  # 输出：(1, 2, 3)

# 函数返回多个值时实际返回元组
def get_point():
    return 10, 20  # 相当于 return (10, 20)

result = get_point()
print(result)  # 输出：(10, 20)
print(type(result))  # 输出：<class 'tuple'>
```

#### 2.1.4 生成器表达式创建元组

生成器表达式需要用 tuple() 转换为元组：

```python
# 生成器表达式 -> 元组
gen = (x ** 2 for x in range(5))
tuple_from_gen = tuple(gen)
print(tuple_from_gen)  # 输出：(0, 1, 4, 9, 16)

# 不能直接用圆括号创建生成器，那是另一个语法
# gen = (x ** 2 for x in range(5))  # 这是生成器表达式，不是元组
# print(type(gen))  # <class 'generator'>
```

### 2.2 单元素元组的陷阱

#### 2.2.1 为什么需要那个逗号

理解这个问题的关键在于 Python 如何解析圆括号：

```python
# 圆括号的三种语义：
# 1. 分组运算符： (1 + 2) * 3  -> 9
# 2. 调用函数： print("hello")
# 3. 创建元组： (1, 2, 3)

# 当只有一个元素时：
(1)   # Python 认为这是分组运算符，返回 1
(1,)  # Python 明确知道这是元组，返回 (1,)

# 如何区分？靠逗号！
```

逗号是元组的关键标识符，优先级高于圆括号：

```python
# 验证逗号的作用
print((1,))    # 输出：(1,)
print((1, 2))  # 输出：(1, 2)

# 空格不影响
print(( 1 , ))  # 输出：(1,)

# 多元素时不加逗号也可以
print((1 2))  # 这是语法错误！
print((1, 2))  # 正确
```

#### 2.2.2 单元素元组的常见错误场景

**场景一：函数返回单元素元组**

```python
def get_first(items):
    if items:
        return items[0],  # 注意这个逗号！
    return None

result = get_first([1, 2, 3])
print(result)  # 输出：(1,)
print(type(result))  # 输出：<class 'tuple'>

# 错误写法
def get_first_wrong(items):
    if items:
        return items[0]  # 没有逗号，返回 1，不是 (1,)

result = get_first_wrong([1, 2, 3])
print(result)  # 输出：1
print(type(result))  # 输出：<class 'int'>
```

**场景二：定义单元素元组常量**

```python
# 正确的单元素常量
SUCCESS_CODE = (200,)
ERROR_CODE = (404,)

# 错误：变量变成了整数
BAD_CODE = (404)  # type = int, not tuple!
print(type(BAD_CODE))  # 输出：<class 'int'>
```

**场景三：在数据结构中使用**

```python
# 创建嵌套元组时
matrix = ((1, 0), (0, 1))  # 2x2 单位矩阵
print(matrix)  # 输出：((1, 0), (0, 1))

# 存储单元素的元组列表
points = [(1, 2), (3, 4), (5, 6)]  # 都是多元素

# 单元素需要特别注意
centers = ((0, 0),)  # 注意这里的逗号！
print(centers)  # 输出：((0, 0),)

# 错误写法
centers_wrong = ((0, 0))
print(centers_wrong)  # 输出：(0, 0) —— 不是嵌套元组
print(type(centers_wrong))  # 输出：<class 'tuple'> —— 这是普通元组

# 如果存储到列表中
centers_list = [((0, 0),), ((1, 1),)]  # 正确
centers_list_wrong = [((0, 0)), ((1, 1))]  # 也可以工作，但语义不同
```

**场景四：条件判断中的陷阱**

```python
# 正确：用元组判断
result = (404,)
if result == (404,):
    print("Not Found")  # 正确

# 常见错误
result = (404)  # 这是整数 404
if result == (404,):  # 永远为 False
    print("Not Found")
else:
    print(f"Matched: {result}, type: {type(result)}")
# 输出：Matched: 404, type: <class 'int'>
```

#### 2.2.3 如何避免单元素元组陷阱

**方法一：时刻记住逗号**

```python
# 养习惯：创建单元素元组时一定加逗号
single = ("value",)  # 元组
not_single = ("value")  # 字符串

# 在代码审核时特别注意这类情况
```

**方法二：使用构造函数**

```python
# 用 tuple() 构造函数可以避免歧义
single = tuple([1])  # (1,)
not_single = tuple(1)  # TypeError: 'int' object is not iterable

# 试图用整数调用 tuple() 会报错，反而更安全
```

**方法三：类型检查辅助**

```python
def ensure_tuple(value):
    """确保返回值是元组"""
    if isinstance(value, tuple) and len(value) == 1:
        return value
    return (value,)

# 测试
print(ensure_tuple(1))     # 输出：(1,)
print(ensure_tuple((1,)))  # 输出：(1,)
print(ensure_tuple((1, 2)))  # 输出：(1, 2)
```

### 2.3 元组的解包操作

#### 2.3.1 基础解包

元组支持一种强大的操作——解包（Unpacking），可以一次性将元组中的多个值赋给多个变量：

```python
# 基本解包
point = (10, 20)
x, y = point
print(f"x = {x}, y = {y}")  # 输出：x = 10, y = 20

# 交换变量（不需要临时变量）
a, b = 1, 2
a, b = b, a  # 交换
print(f"a = {a}, b = {b}")  # 输出：a = 2, b = 1

# 多重赋值
first, second, third = "abc"
print(f"{first}, {second}, {third}")  # 输出：a, b, c
```

#### 2.3.2 使用 * 解包剩余元素

Python 3 引入的星号解包可以捕获多个元素：

```python
# 捕获第一个和剩余元素
first, *rest = (1, 2, 3, 4, 5)
print(f"first = {first}, rest = {rest}")  # 输出：first = 1, rest = [2, 3, 4, 5]

# 捕获最后一个和前面的元素
*head, last = (1, 2, 3, 4, 5)
print(f"head = {head}, last = {last}")  # 输出：head = [1, 2, 3, 4], last = 5

# 捕获中间部分
first, *middle, last = (1, 2, 3, 4, 5)
print(f"first = {first}, middle = {middle}, last = {last}")
# 输出：first = 1, middle = [2, 3, 4], last = 5
```

#### 2.3.3 解包的实际应用

**应用一：交换变量**

```python
# 不使用临时变量交换两个值
x, y = 10, 20
x, y = y, x
print(f"x = {x}, y = {y}")  # 输出：x = 20, y = 10
```

**应用二：函数返回值**

```python
# 函数返回多个值，实际返回元组
def divide(a, b):
    quotient = a // b
    remainder = a % b
    return quotient, remainder  # 返回 (quotient, remainder)

q, r = divide(10, 3)
print(f"商 = {q}, 余数 = {r}")  # 输出：商 = 3, 余数 = 1
```

**应用三：遍历多个序列**

```python
names = ["Alice", "Bob", "Charlie"]
ages = [25, 30, 35]

for name, age in zip(names, ages):
    print(f"{name} is {age} years old")
# 输出：
# Alice is 25 years old
# Bob is 30 years old
# Charlie is 35 years old
```

**应用四：解析配置**

```python
# 解析服务器配置
config = ("localhost", 8080, "admin", "password")

host, port, user, pwd = config
print(f"连接 {host}:{port}，用户 {user}")

# 使用 _ 忽略不需要的值
host, port, _, _ = config  # 忽略用户名和密码
print(f"连接 {host}:{port}")
```

### 2.4 元组的方法

#### 2.4.1 index 方法

```python
# index 返回指定元素第一次出现的索引
fruits = ("apple", "banana", "cherry", "banana", "date")

# 查找元素
print(fruits.index("banana"))  # 输出：1 —— 第一次出现的位置

# 查找不存在的元素会报错
# print(fruits.index("grape"))  # ValueError: tuple.index(x): x not in tuple

# 可以指定起始和结束位置
print(fruits.index("banana", 2))  # 输出：3 —— 从索引2开始查找
print(fruits.index("banana", 0, 2))  # 输出：1 —— 在 0-2 范围内查找
```

#### 2.4.2 count 方法

```python
# count 返回指定元素出现的次数
data = (1, 2, 2, 3, 2, 4, 2, 5)

print(data.count(2))   # 输出：4
print(data.count(1))   # 输出：1
print(data.count(99))  # 输出：0 —— 不存在的元素返回 0，不会报错
```

### 2.5 元组与列表的性能对比

#### 2.5.1 内存占用

```python
import sys

# 比较相同元素的列表和元组的内存占用
list_data = [1, 2, 3, 4, 5]
tuple_data = (1, 2, 3, 4, 5)

print(f"列表大小: {sys.getsizeof(list_data)} bytes")
print(f"元组大小: {sys.getsizeof(tuple_data)} bytes")

# 元组通常比列表占用更少的内存
# 列表：动态数组，需要额外的空间应对可能的追加
# 元组：固定大小，精确分配
```

#### 2.5.2 访问速度

```python
import timeit

# 创建测试数据
list_data = list(range(1000))
tuple_data = tuple(range(1000))

# 访问性能测试
def access_list():
    for i in range(1000):
        _ = list_data[i]

def access_tuple():
    for i in range(1000):
        _ = tuple_data[i]

t1 = timeit.timeit(access_list, number=1000)
t2 = timeit.timeit(access_tuple, number=1000)

print(f"列表访问: {t1:.4f} 秒")
print(f"元组访问: {t2:.4f} 秒")
# 元组通常略快，因为是固定大小，内存布局更紧凑
```

### 2.6 元组的不可变性详解

#### 2.6.1 什么是真正的不可变

元组的"不可变"指的是元组对象的引用结构不可变，但元组中的可变对象（列表、字典）仍然可以被修改：

```python
# 尝试修改元组元素会报错
t = (1, 2, [3, 4])
# t[0] = 100  # TypeError: 'tuple' object does not support item assignment

# 但可以修改元组中的可变对象
t[2].append(5)
print(t)  # 输出：(1, 2, [3, 4, 5]) —— 列表被修改了！

# 元组本身还是那个元组，但内容变了
print(id(t))  # 输出：同一个 id
```

#### 2.6.2 正确的理解

元组的不可变性体现在：
- 不能添加或删除元素
- 不能修改元素的引用
- 但元素如果是可变对象，其内部状态可以修改

```python
# 元组的不可变性
point = (10, 20)

# 这些都不行：
# point[0] = 15      # 报错
# point.append(30)   # 报错
# del point[0]       # 报错

# 但如果元素本身是可变的：
nested = ([1, 2], [3, 4])
nested[0].append(999)  # 可以修改列表
print(nested)  # 输出：([1, 2, 999], [3, 4])
```

## 3. 最佳实践

### 3.1 元组创建的最佳实践

**使用场景选择**

```python
# ✅ 推荐：固定数据用元组
RGB = (255, 0, 0)  # 颜色常量
HTTP_OK = (200, "OK")  # 状态码

# ✅ 推荐：字典键用元组
location = (37.7749, -122.4194)  # 经纬度
location_map = {location: "San Francisco"}

# ✅ 推荐：函数返回值
def get_stats(numbers):
    return min(numbers), max(numbers), sum(numbers) / len(numbers)

min_val, max_val, avg_val = get_stats([1, 2, 3, 4, 5])
```

**避免的错误**

```python
# ❌ 避免：可变数据用元组
# point = (10, 20, [])
# point[2].append(30)  /* 虽然能工作，但违背元组的设计意图 */

# ❌ 避免：需要频繁修改的数据用元组
# colors = ("red", "green")
# colors.append("blue")  # 报错

# ✅ 正确：需要修改时用列表
colors = ["red", "green"]
colors.append("blue")
```

### 3.2 处理单元素元组

**命名约定**

```python
# 使用有意义的变量名
_SINGLE = (1,)  # 常量用大写
error_code = (404,)  # 明确是元组

# 或者使用类型注释
from typing import Tuple

def get_user() -> Tuple[int]:
    """返回用户 ID 的元组"""
    return (1,)
```

**防御性编程**

```python
# 函数参数处理
def process_ids(ids):
    """确保 ids 是元组或列表"""
    if isinstance(ids, (list, tuple)):
        return tuple(ids)  # 转换为元组
    return (ids,)  # 包装为单元素元组

print(process_ids(1))     # 输出：(1,)
print(process_ids([1,2])) # 输出：(1, 2)
print(process_ids((1,2))) # 输出：(1, 2)
```

### 3.3 解包的注意事项

**变量数量必须匹配**

```python
data = (1, 2, 3)

# ❌ 变量多了
# a, b = data  # ValueError: not enough values to unpack

# ❌ 变量少了
# a, b, c, d = data  # ValueError: not enough values to unpack

# ✅ 正确匹配
a, b, c = data

# ✅ 使用 * 捕获多余元素
a, *bc = data
print(f"a = {a}, bc = {bc}")  # 输出：a = 1, bc = [2, 3]
```

**解包应用于循环**

```python
# 正确：解包在 for 循环中
pairs = [(1, 2), (3, 4), (5, 6)]
for a, b in pairs:
    print(f"{a} + {b} = {a + b}")
# 输出：
# 1 + 2 = 3
# 3 + 4 = 7
# 5 + 6 = 11

# 用 enumerate 同时获取索引和值
for i, v in enumerate((1, 2, 3)):
    print(f"index {i} = {v}")
```

### 3.4 性能优化建议

**使用元组代替列表的场景**

```python
# 需要遍历但不需要修改的数据优先用元组
# 元组更快、更省内存

# ❌ 不推荐：不需要修改的列表
colors_list = ["red", "green", "blue"]

# ✅ 推荐：不需要修改时用元组
colors_tuple = ("red", "green", "blue")

# 内存对比
import sys
print(f"列表: {sys.getsizeof(colors_list)} bytes")
print(f"元组: {sys.getsizeof(colors_tuple)} bytes")
```

**函数返回元组而不是列表**

```python
# ✅ 推荐：返回元组
def get_coordinates():
    return (10, 20)  # 作为常量，不需要修改

# ❌ 不必要：如果不需要可变性，返回列表没有额外好处
def get_coords_list():
    return [10, 20]
```

## 4. 原理

### 4.1 元组的内存表示

元组在 CPython 中是一种固定长度的对象：

```python
# 元组对象的内部结构（C 伪代码）
typedef struct {
    PyObject_VAR_HEAD
    PyObject *ob_item[1];  // 指向元素的指针数组
} PyTupleObject;
```

关键点：
- 元组创建时大小固定，分配恰好够用的内存
- 元组没有 append/insert 等方法，因为大小不可变
- 这也是元组比列表更轻量的原因

### 4.2 单元素元组的技术细节

为什么单元素元组需要那个逗号？Python 的语法分析：

```python
# 语法分析器如何处理 (1)
# 1. 看到 (，可能是分组或元组开始
# 2. 看到 1，这是一个表达式
# 3. 看到 )，有两种解释：
#    - 分组结束：(1) -> 表达式 1
#    - 元组创建：(1,) -> 内部元素 1
# 4. 没有逗号 -> 解释为分组运算符

# 语法分析器如何处理 (1,)
# 1. 看到 (，可能是分组或元组开始
# 2. 看到 1，表达式
# 3. 看到 ,，这是元组特有的分隔符！
# 4. 看到 )，元组创建完成
# 解释为包含元素 1 的元组
```

逗号 `,` 在 Python 语法中是元组构造符，优先级高于括号：

```python
# 逗号的优先级
1, 2    # 元组 (1, 2)
(1, 2)  # 也是元组 (1, 2)，括号只是增强可读性
1,      # 单元素元组 (1,)
(1,)    # 也是单元素元组 (1,)
(1)     # 只是数字 1
```

### 4.3 元组的哈希性

由于元组不可变，所以可以被哈希（hashable），可以作为字典的键或放入集合中：

```python
# 元组可哈希
d = {(1, 2): "point", (3, 4): "another"}
print(d)  # 输出：{(1, 2): 'point', (3, 4): 'another'}

# 列表不可哈希
# d = {[1, 2]: "value"}  # TypeError: unhashable type: 'list'

# 集合中的元组
s = {(1, 2), (3, 4), (1, 2)}
print(s)  # 输出：{(1, 2), (3, 4)} —— 自动去重
```

### 4.4 解包的实现原理

元组解包实际上是多次赋值的语法糖：

```python
# 解包
a, b = (1, 2)

# 底层相当于
temp = (1, 2)
a = temp[0]
b = temp[1]

# Python 的 TARGET 模式会优化这个过程
# 不需要中间的 temp 对象，直接从迭代器取值
```

## 5. 总结

### 5.1 核心要点回顾

本文详细讲解了元组创建与单元素陷阱：

1. **元组创建方式**：圆括号、tuple() 构造函数、省略括号、生成器转换
2. **单元素元组陷阱**：`()` 和 `(1,)` 的本质区别，逗号的重要性
3. **元组解包**：基本解包、星号解包、实际应用场景
4. **元组方法**：index 和 count 方法的使用
5. **性能与不可变性**：元组 vs 列表的性能差异、不可变的正确理解

### 5.2 单元素元组速查

| 语法 | 类型 | 值 |
|-----|------|-----|
| `()` | tuple | 空元组 |
| `(1)` | int | 整数 1 |
| `(1,)` | tuple | 单元素元组 |
| `(1, 2)` | tuple | 多元素元组 |

### 5.3 读完应能掌握

- 能说明为什么单元素元组需要逗号
- 能正确创建各种元组（空、单元素、多元素）
- 能熟练使用元组解包进行变量赋值和交换
- 能区分元组和列表的使用场景
- 能解释元组的不可变性及其边界情况

### 5.4 元组在实际项目中的使用案例

**案例一：返回值封装**

在处理数据库查询结果时，元组常用于返回固定数量的字段：

```python
# 模拟数据库查询返回
def query_user(user_id):
    # 假设返回 (id, name, email, created_at)
    return (user_id, f"user_{user_id}", f"user{user_id}@example.com", "2024-01-01")

# 解包使用
user_id, name, email, created_at = query_user(1)
print(f"用户 {name} 的邮箱是 {email}")  # 输出：用户 user_1 的邮箱是 user1@example.com
```

**案例二：多值返回与错误处理**

```python
# 典型的成功/失败返回值设计
def safe_divide(a, b):
    if b == 0:
        return (False, None, "除数不能为零")
    return (True, a / b, None)

success, result, error = safe_divide(10, 2)
if success:
    print(f"结果是 {result}")  # 输出：结果是 5.0
else:
    print(f"错误: {error}")

success, result, error = safe_divide(10, 0)
if not success:
    print(f"错误: {error}")  # 输出：错误: 除数不能为零
```

**案例三：配置管理**

```python
# 使用元组存储不可变配置
APP_CONFIG = (
    "my_app",           # 应用名称
    "1.0.0",            # 版本号
    8080,               # 端口
    100,                # 最大连接数
    (                  # 数据库配置
        "localhost",
        5432,
        "mydb"
    )
)

# 解包配置
app_name, version, port, max_conn, (db_host, db_port, db_name) = APP_CONFIG
print(f"启动 {app_name} v{version}，监听端口 {port}")
print(f"连接数据库 {db_host}:{db_port}/{db_name}")
# 输出：
# 启动 my_app v1.0.0，监听端口 8080
# 连接数据库 localhost:5432/mydb
```

**案例四：状态机转换**

```python
# 定义状态的枚举值（使用元组便于扩展）
class State:
    PENDING, PROCESSING, COMPLETED, FAILED = range(4)

# 使用元组存储状态名称映射
STATE_NAMES = (
    "待处理",
    "处理中",
    "已完成",
    "失败"
)

# 获取状态名称
current_state = State.PROCESSING
print(f"当前状态: {STATE_NAMES[current_state]}")  # 输出：当前状态: 处理中
```

### 5.5 常见面试问题

**问题一：(1,) 和 (1) 的区别**

这是最常见的元组面试题：

```python
print(type((1,)))   # <class 'tuple'> — 单元素元组
print(type((1)))    # <class 'int'> — 只是一对括号分组的数字 CS 1

print((1,) == (1,)) # True
print((1,) == (1))  # False — 它们的类型都不同！
```

**问题二：为什么元组可以作字典键而列表不行**

```python
# 元组不可变，所以可哈希
d = {(1, 2): "value"}
# d[(1, 2)] = "new value"

# 列表可变，不能哈希
#连 key 都不行，因为它的哈希值会随内容改变
# d[[1, 2]] = "value"  # TypeError: unhashable type: 'list'
```

**问题三：元组和列表的性能差异**

```python
import timeit

# 创建性能对比
def create_tuple():
    return (1, 2, 3, 4, 5)

def create_list():
    return [1, 2, 3, 4, 5]

t1 = timeit.timeit(create_tuple, number=100000)
t2 = timeit.timeit(create_list, number=100000)

print(f"元组创建: {t1:.4f} 秒")
print(f"列表创建: {t2:.4f} 秒")
# 元组创建通常稍快
```

### 5.6 延伸学习

- **命名元组（Named Tuple）**：带名称的元组，兼具元组性能和命名访问
- **解包高级用法**：函数参数解包、嵌套解包
- **类型注解中的元组**：`Tuple[int, str, bool]` 等写法
- **data classes vs namedtuple**：现代 Python 中数据类的选择
- **枚举（Enum）**：当需要命名的常量集合时，Enum 是更好的选择
