---
group:
  title: 【03】Python数据类型
  order: 3
order: 1
title: python数据类型介绍
nav:
  title: python基础
  order: 1
---

Python 是一种动态强类型语言，变量无需声明类型，解释器会在运行时根据值自动推断。Python 中常用的**6 种标准数据类型**为：**数字（Numbers）**、**字符串（Strings）**、**列表（Lists）**、**元组（Tuples）**、**字典（Dictionaries）**、**集合（Sets）**。除此之外，还有布尔型、空值、字节串等其他类型。本文将按照“先详细介绍 6 种标准数据类型，再补充其他类型”的顺序，深入讲解每种类型的特性、常用操作、注意事项以及与其他语言的对比。

---

## 1. 数字（Numbers）

数字类型用于存储数值，Python 支持三种不同的数字类型：整型（`int`）、浮点型（`float`）、复数（`complex`）。数字是不可变类型，任何运算都会产生新的对象。

### 1.1 整型（int）

Python 的整数可以任意大（仅受可用内存限制），不像其他语言有 32 位或 64 位的限制。这一点类似于 JavaScript 的 `BigInt`，但 Python 中 `int` 是默认整数类型，无需特殊后缀。

**进制表示**：
- 十进制：`123`, `-456`, `0`
- 二进制：以 `0b` 或 `0B` 开头，如 `0b1010`（十进制 10）
- 八进制：以 `0o` 或 `0O` 开头，如 `0o123`（十进制 83）
- 十六进制：以 `0x` 或 `0X` 开头，如 `0x1F`（十进制 31）

**下划线分隔（Python 3.6+）**：
为了提高长数字的可读性，可以在数字之间（但不能在开头或结尾）使用下划线 `_` 作为分隔符。Python 解析时会自动忽略。

```python
million = 1_000_000          # 1000000
hex_bytes = 0x_FF_FF_FF      # 0xFFFFFF
binary = 0b_1010_1111_0000   # 0b101011110000
```

**常用操作**：
```python
a = 10
b = 3
print(a + b)    # 13
print(a - b)    # 7
print(a * b)    # 30
print(a / b)    # 3.3333333333333335（返回浮点数）
print(a // b)   # 3（整除，向下取整）
print(a % b)    # 1（取余）
print(a ** b)   # 1000（幂运算）
```

**类型转换**：
```python
int("123")      # 123
int(3.14)       # 3（截断小数）
int(True)       # 1
int(False)      # 0
```

### 1.2 浮点型（float）

浮点数采用 IEEE 754 双精度 64 位格式，与 JavaScript 的 `number` 完全相同。因此具有相同的精度问题和特殊值。

**表示方式**：
- 普通小数：`3.14`, `-0.001`, `.5`（等价于 `0.5`）, `2.`（等价于 `2.0`）
- 科学计数法：使用 `e` 或 `E`，如 `1.2e3`（=1200.0），`1.2E-3`（=0.0012）

**特殊值**（需要通过 `float()` 构造）：
```python
float('inf')    # 正无穷大
float('-inf')   # 负无穷大
float('nan')    # 非数字（Not a Number）
```

**精度问题**：
由于浮点数在二进制中无法精确表示某些十进制小数，会出现精度误差：
```python
print(0.1 + 0.2)          # 0.30000000000000004
print(0.1 + 0.2 == 0.3)   # False
```
解决方案：使用 `math.isclose()` 比较浮点数，或使用 `decimal` 模块。

**常用函数**：
```python
round(3.14159, 2)   # 3.14（四舍五入到指定小数位）
abs(-3.14)          # 3.14（绝对值）
```

### 1.3 复数（complex）

Python 原生支持复数，这在科学计算中非常有用。复数由实部和虚部组成，虚部以 `j` 或 `J` 后缀表示。

```python
z1 = 3 + 4j
z2 = 1.2j           # 实部为 0
z3 = -5J
z4 = complex(3, 4)  # 使用构造函数

print(z1.real)      # 3.0
print(z1.imag)      # 4.0
print(z1.conjugate())  # (3-4j)（共轭复数）

# 复数运算
print(z1 + z2)      # (3+5.2j)
print(z1 * z2)      # (-4.8+3.6j)
```

### 1.4 数字类型的不可变性

数字是不可变对象，每次运算都会生成新对象，原对象不变。

```python
x = 10
y = x
x = x + 1
print(x, y)   # 11 10（y 仍指向原对象）
```

---

## 2. 字符串（Strings）

字符串是**不可变**的 Unicode 字符序列。Python 中字符串可以用单引号、双引号、三引号定义。

### 2.1 创建字符串

```python
s1 = 'Hello'
s2 = "World"
s3 = '''多行
字符串'''
s4 = """也支持双引号三引号"""
```

### 2.2 转义字符

| 转义序列 | 含义               |
| -------- | ------------------ |
| `\n`     | 换行               |
| `\t`     | 水平制表符         |
| `\\`     | 反斜杠自身         |
| `\'`     | 单引号             |
| `\"`     | 双引号             |
| `\r`     | 回车               |
| `\b`     | 退格               |
| `\xhh`   | 十六进制字符（2位）|
| `\uhhhh` | Unicode 字符（4位）|
| `\Uhhhhhhhh` | Unicode 字符（8位）|
| `\ooo`   | 八进制字符（3位）  |

### 2.3 原始字符串（raw string）

在引号前加 `r` 或 `R`，反斜杠不再作为转义字符，原样输出。适用于正则表达式、Windows 文件路径等。

```python
path = r'C:\Users\name'
print(path)        # C:\Users\name（不会将 \U 视为转义）
```

### 2.4 格式化字符串（f-string，Python 3.6+）

在引号前加 `f` 或 `F`，可以在字符串中嵌入用 `{}` 包裹的表达式。支持格式化说明符。

```python
name = "Alice"
age = 25
print(f"{name} is {age} years old.")
# 输出：Alice is 25 years old.

# 支持表达式
print(f"{2 + 3 = }")          # 2 + 3 = 5
# 支持格式化
print(f"{3.14159:.2f}")       # 3.14
```

除了 f-string，还有老式格式化方法：`%` 操作符和 `str.format()`。

### 2.5 常用字符串方法

```python
s = "  Hello, World!  "
s.lower()           # "  hello, world!  "
s.upper()           # "  HELLO, WORLD!  "
s.strip()           # "Hello, World!"（去除首尾空白）
s.replace("World", "Python")  # "  Hello, Python!  "
s.split(",")        # ['  Hello', ' World!  ']
s.startswith("  He") # True
s.endswith("!  ")    # True
",".join(["a","b","c"])  # "a,b,c"
len(s)              # 16（字符数）
```

### 2.6 索引与切片

字符串支持通过索引访问字符，支持负数索引（从末尾计数），支持切片。

```python
s = "Python"
print(s[0])      # 'P'
print(s[-1])     # 'n'
print(s[1:4])    # 'yth'（索引1到3）
print(s[:3])     # 'Pyt'（从开头到索引2）
print(s[3:])     # 'hon'（索引3到末尾）
print(s[::2])    # 'Pto'（步长2）
```

**注意**：字符串不可变，不能通过索引赋值（如 `s[0] = 'p'` 会报错）。

### 2.7 字符串拼接与重复

```python
"Hello" + " " + "World"   # "Hello World"
"Ha" * 3                  # "HaHaHa"
```

相邻的字符串字面量会自动拼接：
```python
text = "Hello" "World"    # "HelloWorld"
```

### 2.8 成员判断

```python
"ell" in "Hello"   # True
"ell" not in "Hello"  # False
```

---

## 3. 列表（Lists）

列表是**可变**、**有序**的序列，可以包含任意类型的元素（包括列表自身，实现多维数组）。使用方括号 `[]`。

### 3.1 创建列表

```python
empty = []
numbers = [1, 2, 3]
mixed = [1, "hello", [2, 3]]
```

### 3.2 访问与修改

```python
lst = [10, 20, 30]
print(lst[1])       # 20
lst[1] = 99         # [10, 99, 30]
```

### 3.3 常用方法

| 方法                         | 说明                                     |
| ---------------------------- | ---------------------------------------- |
| `append(x)`                  | 在末尾添加元素 x                         |
| `extend(iterable)`           | 将可迭代对象的所有元素追加到末尾         |
| `insert(i, x)`               | 在索引 i 处插入元素 x                    |
| `remove(x)`                  | 删除第一个值为 x 的元素（不存在会报错）  |
| `pop([i])`                   | 删除并返回索引 i 处的元素（默认末尾）    |
| `clear()`                    | 清空列表                                 |
| `index(x[, start[, end]])`   | 返回第一个 x 的索引，可指定搜索范围      |
| `count(x)`                   | 统计 x 出现的次数                        |
| `sort(key=None, reverse=False)` | 原地排序                               |
| `reverse()`                  | 原地反转                                 |
| `copy()`                     | 浅拷贝                                   |

```python
lst = [1, 2, 3]
lst.append(4)           # [1,2,3,4]
lst.extend([5,6])       # [1,2,3,4,5,6]
lst.insert(0, 0)        # [0,1,2,3,4,5,6]
lst.remove(3)           # [0,1,2,4,5,6]
popped = lst.pop()      # 6，lst变为[0,1,2,4,5]
lst.reverse()           # [5,4,2,1,0]
lst.sort()              # [0,1,2,4,5]
```

### 3.4 切片操作

切片返回一个新列表（浅拷贝），语法 `[start:stop:step]`。

```python
lst = [10, 20, 30, 40, 50]
print(lst[1:4])      # [20,30,40]
print(lst[:3])       # [10,20,30]
print(lst[3:])       # [40,50]
print(lst[::2])      # [10,30,50]
print(lst[::-1])     # [50,40,30,20,10]（反转）
```

### 3.5 列表推导式（List Comprehension）

一种简洁的创建列表方式：

```python
squares = [x**2 for x in range(10)]   # [0,1,4,9,16,25,36,49,64,81]
evens = [x for x in range(10) if x % 2 == 0]  # [0,2,4,6,8]
matrix = [[i+j for j in range(3)] for i in range(3)]  # 二维列表
```

### 3.6 列表的深浅拷贝

- **浅拷贝**：`lst.copy()`、`lst[:]`、`list(lst)` 只复制第一层，内层对象仍共享引用。
- **深拷贝**：`copy.deepcopy(lst)` 递归复制所有层级。

### 3.7 列表的可变性

列表是可变对象，修改一个引用会影响所有指向同一对象的引用。

```python
a = [1,2,3]
b = a
b.append(4)
print(a)   # [1,2,3,4]
```

---

## 4. 元组（Tuples）

元组是**不可变**、**有序**的序列，使用圆括号 `()`。一旦创建，不能修改、添加或删除元素。

### 4.1 创建元组

```python
empty = ()
single = (1,)        # 注意逗号，否则是整数1
triple = (1, 2, 3)
# 也可以不加括号，但建议加上
another = 1, 2, 3    # 也是元组
```

### 4.2 访问元素

```python
t = (10, 20, 30)
print(t[1])      # 20
# t[0] = 99      # 报错：TypeError
```

### 4.3 不可变性的意义

- 元组可以作为字典的键（列表不行，因为列表可变）。
- 函数返回多个值时，实际上返回的是元组。
- 保护数据不被意外修改。

```python
d = {(1,2): "point"}   # 元组作为键
def get_min_max(arr):
    return min(arr), max(arr)   # 返回元组
```

### 4.4 元组的常用操作

由于不可变，元组的方法较少：`count()` 和 `index()`。

```python
t = (1, 2, 2, 3)
t.count(2)      # 2
t.index(2)      # 1（第一个出现的位置）
```

### 4.5 元组的解包（Unpacking）

```python
point = (10, 20)
x, y = point
print(x, y)     # 10 20

# 使用 * 收集剩余元素
a, *rest = (1, 2, 3, 4)
print(a, rest)  # 1 [2,3,4]
```

### 4.6 元组与列表的转换

```python
lst = [1,2,3]
t = tuple(lst)      # (1,2,3)
lst2 = list(t)      # [1,2,3]
```

---

## 5. 字典（Dictionaries）

字典是**可变**、**无序**（Python 3.7+ 保持插入顺序）的键值对集合，使用花括号 `{}`。键必须是不可变类型（字符串、数字、元组等），值可以是任意类型。

### 5.1 创建字典

```python
empty = {}
person = {"name": "Alice", "age": 25}
# 使用 dict() 构造函数
person2 = dict(name="Bob", age=30)
# 从键值对列表创建
person3 = dict([("name", "Charlie"), ("age", 35)])
```

### 5.2 访问与修改

```python
d = {"a": 1, "b": 2}
print(d["a"])        # 1
d["c"] = 3           # 添加新键值对
d["b"] = 99          # 修改
del d["a"]           # 删除键
```

**安全访问**：使用 `get()` 方法避免 KeyError。

```python
print(d.get("x", 0))   # 0（不存在时返回默认值）
```

### 5.3 常用方法

| 方法                       | 说明                                 |
| -------------------------- | ------------------------------------ |
| `keys()`                   | 返回所有键的视图                     |
| `values()`                 | 返回所有值的视图                     |
| `items()`                  | 返回所有 (键, 值) 对的视图           |
| `get(key[, default])`      | 安全获取值，不存在返回默认值         |
| `setdefault(key[, default])` | 如果键存在则返回值，否则设置并返回默认值 |
| `update(other)`            | 用另一个字典更新当前字典             |
| `pop(key[, default])`      | 删除并返回指定键的值                 |
| `popitem()`                | 删除并返回最后插入的键值对（LIFO）   |
| `clear()`                  | 清空字典                             |

```python
d = {"a": 1, "b": 2}
print(d.keys())      # dict_keys(['a', 'b'])
print(d.values())    # dict_values([1, 2])
print(d.items())     # dict_items([('a', 1), ('b', 2)])
d.update({"c": 3, "d": 4})   # 合并
value = d.pop("b")   # 2，d变为{'a':1,'c':3,'d':4}
```

### 5.4 遍历字典

```python
for key in d:
    print(key, d[key])

for key, value in d.items():
    print(key, value)

for value in d.values():
    print(value)
```

### 5.5 字典推导式

```python
squares = {x: x**2 for x in range(5)}   # {0:0,1:1,2:4,3:9,4:16}
```

### 5.6 键的类型限制

字典的键必须是可哈希的（不可变类型）。列表、字典、集合等可变类型不能作为键，但元组可以作为键（前提是元组内的元素都是不可变的）。

```python
d = {(1,2): "point"}      # 合法
# d = {[1,2]: "list"}     # 报错：unhashable type
```

---

## 6. 集合（Sets）

集合是**可变**、**无序**、**元素唯一**的集合。使用花括号 `{}`，但注意 `{}` 是空字典，空集合需用 `set()`。

### 6.1 创建集合

```python
fruits = {"apple", "banana", "orange"}
empty_set = set()
# 从列表去重创建
nums = set([1,2,2,3,3,4])   # {1,2,3,4}
```

### 6.2 常用方法

| 方法                         | 说明                                 |
| ---------------------------- | ------------------------------------ |
| `add(x)`                     | 添加元素 x                           |
| `remove(x)`                  | 删除元素 x（不存在会报错）           |
| `discard(x)`                 | 删除元素 x（不存在不报错）           |
| `pop()`                      | 随机删除并返回一个元素（无序）       |
| `clear()`                    | 清空集合                             |
| `union(other)` 或 `\|`        | 并集                                 |
| `intersection(other)` 或 `&` | 交集                                 |
| `difference(other)` 或 `-`   | 差集                                 |
| `symmetric_difference(other)` 或 `^` | 对称差集                         |
| `issubset(other)` 或 `<=`    | 子集判断                             |
| `issuperset(other)` 或 `>=`  | 超集判断                             |
| `isdisjoint(other)`          | 是否不相交（无共同元素）             |

```python
a = {1,2,3}
b = {3,4,5}
a.add(6)                # {1,2,3,6}
a.remove(2)             # {1,3,6}
a.discard(10)           # 无影响
print(a | b)            # {1,3,4,5,6}
print(a & b)            # {3}
print(a - b)            # {1,6}
print(a ^ b)            # {1,4,5,6}
```

### 6.3 集合运算的更新版本

`update()`, `intersection_update()`, `difference_update()`, `symmetric_difference_update()` 会修改原集合。

### 6.4 集合推导式

```python
squares = {x**2 for x in range(5)}   # {0,1,4,9,16}
```

### 6.5 冻结集合（frozenset）

不可变的集合，可以作为字典的键。

```python
fs = frozenset([1,2,3])
# fs.add(4)   # 报错
d = {fs: "value"}   # 合法
```

---

## 7. 布尔类型（bool）

`bool` 是 `int` 的子类，只有两个值：`True` 和 `False`。在数值运算中，`True` 视为 `1`，`False` 视为 `0`。

```python
print(True + True)      # 2
print(False * 10)       # 0
```

布尔值常用于条件判断，所有 Python 对象都可以隐式转换为布尔值（`bool(obj)`）。

**假值**：`None`, `False`, 零（`0`, `0.0`, `0j`）, 空序列/集合（`''`, `[]`, `()`, `{}`, `set()`）。

---

## 8. 空值类型（NoneType）

`None` 是唯一的空值对象，表示“无”或“缺失”。类似其他语言的 `null`。通常用于函数默认返回值、变量初始化。

```python
def foo():
    pass
print(foo())   # None
```

**判断空值**：使用 `is None` 而不是 `==`（因为 `None` 是单例）。

---

## 9. 字节串（bytes）

不可变的字节序列，元素是 0-255 的整数。字面量以 `b` 前缀，常用于处理二进制数据、网络协议、文件 I/O。

```python
b = b'hello'
print(b[0])        # 104（ASCII 'h'）
# b[0] = 72        # 报错：bytes 不可变
```

字节串与字符串的转换：

```python
s = "hello"
b = s.encode('utf-8')   # b'hello'
s2 = b.decode('utf-8')  # "hello"
```

---

## 10. 字节数组（bytearray）

可变的字节序列，类似于 `bytes` 但可以修改。

```python
ba = bytearray(b'hello')
ba[0] = 72        # 将 'h' 改为 'H'（ASCII 72）
print(ba)         # bytearray(b'Hello')
```

---

## 11. 范围（range）

不可变的数字序列，常用于 `for` 循环。不实际存储所有元素，按需生成，节省内存。

```python
r = range(5)           # 0,1,2,3,4
r = range(2, 10, 2)    # 2,4,6,8
print(list(r))         # [2,4,6,8]
```

`range` 支持 `in`、`len()`、索引等操作。

---

## 12. 可变性与不可变性总结

| 类型         | 可变性 | 说明                     |
| ------------ | ------ | ------------------------ |
| `int`        | 不可变 | 运算产生新对象           |
| `float`      | 不可变 | 同上                     |
| `complex`    | 不可变 | 同上                     |
| `bool`       | 不可变 | 同上                     |
| `str`        | 不可变 | 任何修改返回新字符串     |
| `tuple`      | 不可变 | 不能修改元素             |
| `frozenset`  | 不可变 | 不可变集合               |
| `bytes`      | 不可变 | 字节串不可变             |
| `list`       | 可变   | 可增删改元素             |
| `dict`       | 可变   | 可增删改键值对           |
| `set`        | 可变   | 可增删元素               |
| `bytearray`  | 可变   | 可变字节序列             |

---

## 13. 与 JavaScript 核心类型对比

| Python          | JavaScript               | 说明                                     |
| --------------- | ------------------------ | ---------------------------------------- |
| `int`           | `number` + `BigInt`      | Python int 无限精度，类似 BigInt         |
| `float`         | `number`                 | 都是 IEEE 754 双精度浮点数               |
| `complex`       | 无                       | Python 原生支持复数                      |
| `bool`          | `boolean`                | 完全相同                                 |
| `str`           | `string`                 | 都不可变                                 |
| `list`          | `Array`                  | 基本相同，方法名略有差异                 |
| `tuple`         | 无（`Object.freeze([])` 模拟） | 不可变序列，可作字典键                   |
| `dict`          | `Object`                 | 键类型限制不同（Python 键必须不可变）    |
| `set`           | `Set`                    | 基本相同，Python 支持集合运算运算符      |
| `None`          | `null`                   | 相似，但 Python 无 `undefined`           |
| `bytes`         | `Uint8Array`             | 字节序列，Python 不可变，JS 可变         |
