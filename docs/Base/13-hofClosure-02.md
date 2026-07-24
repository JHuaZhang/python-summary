---
group:
  title: 【13】高阶函数与闭包
  order: 13
order: 2
title: map 映射函数
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 map

`map` 是 Python 的一个内置函数，用于对可迭代对象中的每个元素应用同一个函数，并返回一个新的可迭代对象。它的核心思想可以用一句话概括：**把一个函数"映射"到一组数据上，逐个变换，得到一组新数据**。

这种"对每个元素做同一件事"的需求在日常编程中极为常见：把一个字符串列表全部转成整数、把一组温度值从摄氏度转成华氏度、对文件的每一行去掉首尾空白……这些都是典型的"映射"场景。`map` 就是把这类操作抽象成一个通用工具：你只需要告诉它"做什么"（函数）和"对谁做"（可迭代对象），它负责把函数逐个作用到每个元素上。

先看一个最小例子建立直觉：

```python
# 把字符串列表里的每个元素转成整数
numbers = ["1", "2", "3", "4", "5"]
result = map(int, numbers)

# map 返回的不是列表，而是一个迭代器，需要用 list() 收集才能看到全貌
print(list(result))
# 输出：[1, 2, 3, 4, 5]
```

这里 `int` 是函数，`numbers` 是可迭代对象。`map(int, numbers)` 的意思是"对 `numbers` 里的每个元素调用 `int`，把结果收集起来"。最终 `int("1")` 得到 `1`，`int("2")` 得到 `2`，以此类推。

关键的一点是：`map` 的返回值 **不是列表**，而是一个 `map` 对象（迭代器）。它不会立即把所有元素都算出来，而是"你问一个它算一个"。这就是为什么上面要用 `list(result)` 把它转成列表才能打印出全部结果——`list()` 在遍历迭代器的过程中触发了每个元素的实际计算。

### 1.2 基本语法

`map` 的函数签名如下：

```python
map(func, *iterables)
```

- `func`：要对每个元素应用的函数。它应该接受与 `iterables` 数量相同的参数——如果只传一个可迭代对象，`func` 就接受一个参数；传两个可迭代对象，`func` 就接受两个参数，依次类推。
- `*iterables`：一个或多个可迭代对象（列表、元组、字符串、range、文件对象、生成器等均可）。`*` 表示可变位置参数，所以你可以传任意多个可迭代对象给 `map`。
- 返回值：一个 `map` 对象，它是迭代器，支持 `for` 循环遍历和 `next()` 逐个取值，也可以用 `list()`、`tuple()`、`set()` 等收集成容器。

最小用法再演示一次，这次用 `for` 循环来消费 map 对象：

```python
words = ["apple", "banana", "cherry"]

# 对每个单词取首字母大写形式
for title in map(str.title, words):
    print(title)
# 输出：
# Apple
# Banana
# Cherry
```

这里没有用 `list()` 收集，而是直接 `for` 循环遍历 `map` 对象。每次循环时，`map` 才会调用一次 `str.title` 拿到下一个结果。这正是 `map` 作为迭代器的典型消费方式。

### 1.3 map 在函数式编程中的定位

`map` 属于 Python 函数式编程工具箱中的一员。在函数式编程范式里，有三个经典的"高阶函数"操作：

- `map`：映射——对每个元素做变换。
- `filter`：过滤——按条件筛选元素。
- `reduce`（在 `functools` 模块中）：归约——把所有元素汇总成一个值。

`map` 对应的是"变换"这一步。它强调的是 **声明式** 的思维方式：你要表达的是"把每个元素变成什么"，而不是"怎么循环、怎么追加到列表里"。对比一下：

```python
# 命令式写法：关注"怎么做"
squares = []
for x in range(1, 6):
    squares.append(x ** 2)
print(squares)
# 输出：[1, 4, 9, 16, 25]

# 声明式写法：关注"做什么"
squares = list(map(lambda x: x ** 2, range(1, 6)))
print(squares)
# 输出：[1, 4, 9, 16, 25]
```

两者结果一样，但思路不同。命令式写法描述了"建空列表、循环、追加"的过程；`map` 写法则直接表达了"把 `range(1,6)` 里每个数变成它的平方"这一意图。在变换逻辑简单、阅读者熟悉 `map` 的场合，声明式写法确实更简洁；但当变换逻辑复杂时，`map` 加 `lambda` 反而不如普通 `for` 循环或列表推导式好读。如何取舍，后面会专门讨论。

### 1.4 map 返回的是迭代器而非列表

这是使用 `map` 时最需要建立的关键认知，也是许多初学者踩坑的根源。请记住：

**`map(func, iterable)` 不会立刻生成一个新列表，它只返回一个"承诺"——承诺在需要时按顺序产出变换后的元素。** 这个"承诺"就是迭代器对象。

之所以这样设计，是为了 **惰性求值**（lazy evaluation）：如果可迭代对象很大（比如一千万个元素），但你只需要前几个结果，或者你只想逐个处理而不需要同时持有全部结果，那么 `map` 就不必一次性把所有结果都算出来存进内存，而是算一个用一个。这在处理大文件、大数据集时尤其有意义。

```python
# 一个直观的感受：map 对象本身不包含计算结果
m = map(str, [1, 2, 3])
print(m)          # 直接打印 map 对象，看不到内容
# 输出：<map object at 0x...>
print(type(m))    # 它的类型是 map，不是 list
# 输出：<class 'map'>
```

`<map object at 0x...>` 告诉你这是一个 `map` 对象，处在某个内存地址。要看内容，必须主动消费它——用 `list()`、`tuple()`、`for` 循环、`next()` 等。这一点在后续章节会反复出现，务必内化。

## 2. 核心内容

### 2.1 参数 func：要应用的函数

`func` 是 `map` 的第一个参数，也是 `map` 的核心——它定义了"对每个元素做什么"。`func` 可以是任何 **可调用对象**（callable）：内置函数、自定义函数、类的方法、类本身、甚至实现了 `__call__` 的对象都可以。

**内置函数作为 func**

最常见的是用内置函数做转换，比如 `int`、`str`、`float`、`len`、`abs` 等：

```python
# 批量类型转换：字符串转浮点数
price_strs = ["9.9", "19.5", "100.0", "0.01"]
prices = list(map(float, price_strs))
print(prices)
# 输出：[9.9, 19.5, 100.0, 0.01]

# 取每个数的绝对值
temps = [-5, 3, -1, 0, -8, 2]
print(list(map(abs, temps)))
# 输出：[5, 3, 1, 0, 8, 2]

# 取每个单词的长度
words = ["hi", "hello", "internationalization"]
print(list(map(len, words)))
# 输出：[2, 5, 20]
```

注意这里 `func` 传的是函数对象本身（如 `int`、`abs`、`len`），**不要加括号**。`map(int, ...)` 是把 `int` 函数交给 `map`，由 `map` 在内部对每个元素调用它；如果你写成 `map(int(), ...)`，那是在调用 `int()` 得到一个整数（而且会报错，因为 `int()` 没传参数），而不是把 `int` 函数本身交给 `map`。这是 Python"函数是一等公民"的体现——函数可以作为参数传递。

**自定义函数作为 func**

`func` 也可以是你自己定义的函数：

```python
def to_celsius(fahrenheit):
    """华氏度转摄氏度"""
    return (fahrenheit - 32) * 5 / 9

f_readings = [32, 68, 100, 212]
c_readings = list(map(to_celsius, f_readings))
print([round(c, 1) for c in c_readings])
# 输出：[0.0, 20.0, 37.8, 100.0]
```

这里 `to_celsius` 是一个普通函数，`map(to_celsius, f_readings)` 会把 `f_readings` 里的每个华氏度值交给 `to_celsius` 处理。相比用 `for` 循环逐个 append 到新列表，`map` 的写法更紧凑，也直接表达了"批量转换"的意图。

**类作为 func**

类本身也是可调用对象（调用类就是创建实例），所以也可以作为 `func`：

```python
class Point:
    def __init__(self, coord):
        self.x, self.y = coord

# 把一组 "(x, y)" 元组批量变成 Point 实例
coords = [(0, 0), (1, 2), (3, 4), (5, 6)]
points = list(map(Point, coords))
print([(p.x, p.y) for p in points])
# 输出：[(0, 0), (1, 2), (3, 4), (5, 6)]
```

这里 `Point` 类的 `__init__` 接受一个 `coord` 参数，`map(Point, coords)` 就是对每个元组调用 `Point(...)`，得到一个 `Point` 实例。这种用法在读入数据、批量构造对象时很方便。

** méthode 作为 func**

绑定方法也可以作为 `func`：

```python
names = ["alice", "bob", "carol"]

# 用 str.upper 把每个名字转大写
uppers = list(map(str.upper, names))  # 注意：这种写法在所有元素都是 str 时可行
print(uppers)
# 输出：['ALICE', 'BOB', 'CAROL']
```

严格地说，`str.upper` 是一个未绑定方法（在 Python 3 中就是函数），`map(str.upper, names)` 会先取出 `"alice"`，然后调用 `str.upper("alice")` 得到 `"ALICE"`。这要求 `names` 里的元素都是字符串类型，否则 `str.upper` 会报错。

### 2.2 参数 *iterables：单个可迭代对象

`map` 最简单的形式是只传一个可迭代对象：`map(func, iterable)`。此时 `func` 必须是接受一个参数的函数，`map` 会从 `iterable` 中依次取出元素，逐个交给 `func` 处理。

可迭代对象不限于列表，任何可迭代的对象都可以：元组、字符串、range、集合、字典、文件对象、生成器、甚至 `map` 对象本身。

**字符串作为可迭代对象**

字符串是字符的可迭代对象，可以直接用 `map` 逐字符处理：

```python
# 把字符串里每个字符转成它的 ASCII 码
chars = "hello"
codes = list(map(ord, chars))
print(codes)
# 输出：[104, 101, 108, 108, 111]
```

`ord` 是内置函数，返回单个字符的 Unicode 编码点。`map(ord, "hello")` 等价于 `[ord('h'), ord('e'), ord('l'), ord('l'), ord('o')]`，但因为惰性求值，只有被消费时才真正计算。

**range 作为可迭代对象**

`range` 是非常典型的惰性序列，配合 `map` 用很自然：

```python
# 计算 1 到 5 的阶乘
import math

factorials = list(map(math.factorial, range(1, 6)))
print(factorials)
# 输出：[1, 2, 6, 24, 120]
```

`math.factorial(n)` 返回 `n` 的阶乘。`range(1, 6)` 产出 `1, 2, 3, 4, 5`，`map` 把每个数交给 `math.factorial`，最终得到 `[1, 2, 6, 24, 120]`。注意 `range` 本身是惰性的，`map` 也是惰性的，两者叠加仍是惰性的，直到 `list()` 把它们一次性消费掉。

**字典作为可迭代对象**

对字典做 `map` 时，迭代的是字典的键：

```python
stock = {"apple": 5, "banana": 3, "cherry": 8}

# 对字典的每个键取长度
key_lengths = list(map(len, stock))
print(key_lengths)
# 输出：[5, 6, 6]   （"apple"=5, "banana"=6, "cherry"=6）
```

如果要同时处理键和值，应该用 `dict.items()`，并配合接受两个参数的 `func`（这在下一节"多可迭代对象"里会涉及）。

**文件对象作为可迭代对象**

文件对象直接迭代时会逐行产出字符串，所以 `map` 配合文件可以做"逐行处理"：

```python
# 假设 data.txt 内容是：
#   10
#   20
#   30
#
# 读取并解析每行的数字（用 map 在内存里逐行变换）

with open("data.txt") as f:
    numbers = list(map(int, f))   # f 迭代时产出 "10\n", "20\n", "30\n"，int 自动去空白

print(numbers)
# 输出：[10, 20, 30]
```

`int("10\n")` 会自动忽略首尾空白，得到 `10`。这个写法非常简洁地完成了"读文件 + 逐行转整数"两件事。注意 `f` 是惰性的，`map` 也是惰性的，`list()` 在这里触发了整个读取链路，读完文件后 `with` 块退出、文件关闭。

**关于"返回值中哪些是真惰性、哪些需要立即消费"的区分**

| 调用方式 | 是否即时计算 | 何时消费 |
| --- | --- | --- |
| `map(func, it)` 创建 | 否，只是构造迭代器 | 后续 `list()` / `for` / `next()` 时 |
| `list(map(...))` | 是，立即遍历到底 | 构造列表时 |
| `tuple(map(...))` | 是，立即遍历到底 | 构造元组时 |
| `sum(map(...))` | 是，逐个累加到底 | 求和时 |
| `for x in map(...)` | 否，逐个产出 | 每次循环迭代时 |

这张表帮助你判断：到底是 "惰性持有" 还是 "立即求值"，完全取决于 **谁在消费**。`map` 自身永远是惰性的。

### 2.3 参数 *iterables：多个可迭代对象

`map` 最有特色的一种用法，是同时传多个可迭代对象：`map(func, iterable_a, iterable_b, ...)`。此时 `func` 必须接受与可迭代对象数量相同的参数。`map` 会并行从每个可迭代对象里各取一个元素，组成参数元组交给 `func`。

**两序列逐元素运算**

这是多可迭代对象最经典的场景——两个序列按位置配对，逐元素做某种运算：

```python
# 两个向量的逐元素相加
vec_a = [1, 2, 3, 4]
vec_b = [10, 20, 30, 40]

sums = list(map(lambda x, y: x + y, vec_a, vec_b))
print(sums)
# 输出：[11, 22, 33, 44]
```

这里 `func` 是 `lambda x, y: x + y`，它接受两个参数。`map` 从 `vec_a` 取 `1`、从 `vec_b` 取 `10`，交给 `lambda` 得到 `11`；再取 `2` 和 `20` 得到 `22`……等价于 `[a + b for a, b in zip(vec_a, vec_b)]`。

这种"并行取元素"的做法，本质上是 `map` 内部帮你做了 `zip` 的工作，并把解包后的参数交给 `func`。可以理解为 `map(f, a, b)` 等价于 `(f(x, y) for x, y in zip(a, b))`。

**多列数据并行处理**

在处理结构化的多列数据时也很有用，比如把"姓名列表"和"成绩列表"合并成 "姓名:成绩" 字符串：

```python
names = ["张三", "李四", "王五"]
scores = [88, 95, 72]

# 每次从两个列表各取一个元素，组成 "姓名:成绩"
reports = list(map(lambda name, score: f"{name}:{score}", names, scores))
print(reports)
# 输出：['张三:88', '李四:95', '王五:72']
```

如果要合并三列，就传三个可迭代对象，`func` 也接受三个参数：

```python
ids = [101, 102, 103]
names = ["张三", "李四", "王五"]
scores = [88, 95, 72]

records = list(map(lambda i, n, s: f"{i}-{n}-{s}", ids, names, scores))
print(records)
# 输出：['101-张三-88', '102-李四-95', '103-王五-72']
```

这种写法比三层嵌套的 `for` 循环或 `zip` + 列表推导式都要简洁，尤其适合"多列字段拼接成单列"的场景。

**配合内置函数做多元运算**

`func` 不一定非得是 `lambda`，也可以是接受多个参数的内置函数或自定义函数。例如用 `max` 取每对元素的较大值：

```python
a = [3, 7, 2, 9]
b = [5, 1, 8, 4]

maximums = list(map(max, a, b))
print(maximums)
# 输出：[5, 7, 8, 9]
```

`max(3, 5)` 得 `5`，`max(7, 1)` 得 `7`，以此类推。这种用法的关键是理解：`max` 在这里被当成"接受两个参数的函数"，每次 `map` 都会从 `a` 和 `b` 各取一个数，调用 `max(a_i, b_i)`。

类似地，用 `min` 取每对较小值：

```python
minimums = list(map(min, a, b))
print(minimums)
# 输出：[3, 1, 2, 4]
```

用 `divmod` 同时得到商和余数（`divmod` 返回元组，`map` 会把元组作为元素产出）：

```python
dividends = [10, 20, 30]
divisors = [3, 7, 4]

results = list(map(divmod, dividends, divisors))
print(results)
# 输出：[(3, 1), (2, 6), (7, 2)]
```

`divmod(10, 3)` 返回 `(3, 1)`（商 3 余 1），`divmod(20, 7)` 返回 `(2, 6)`，`divmod(30, 4)` 返回 `(7, 2)`。可以看到 `func` 返回什么类型，`map` 就产出什么类型——它不做额外加工，只负责"把 `func` 的调用结果原样产出"。

### 2.4 按最短可迭代对象截断

当传入多个可迭代对象时，`map` 遵循 **按最短截断** 的规则：只要其中最短的那个可迭代对象耗尽，整个 `map` 就停止。这一点和 `zip` 的行为一致。

```python
a = [1, 2, 3, 4, 5]       # 5 个元素
b = [10, 20, 30]           # 3 个元素

# 以最短的 b 为准，只产出 3 个结果
result = list(map(lambda x, y: x + y, a, b))
print(result)
# 输出：[11, 22, 33]
```

`b` 在第 4 次取值时就耗尽了，`map` 立即停止，`a` 里多余的 `4`、`5` 不会被处理。这种"短的说了算"的语义在某些场景下很方便（比如只处理到最短数据集结束），但也可能带来意外——如果你以为会处理全部 `a` 的元素，就会少得到两个结果。

**截断的典型陷阱**

```python
# 期望：把学号和姓名对应起来
ids = [1, 2, 3, 4]
names = ["张三", "李四"]    # 少了两个名字，可能是数据缺失

# 如果用 map 按 id 分配名字，只会处理前两条
pairs = list(map(lambda i, n: (i, n), ids, names))
print(pairs)
# 输出：[(1, '张三'), (2, '李四')]
```

输出里 `id=3` 和 `id=4` 静默消失了，没有任何报错提示。这种"长度不匹配就默默截断"的行为，如果你没有意识到，会导致数据悄悄丢失。当你需要明确的长度校验时，更稳妥的做法是先用 `zip`（同样会截断），或用 `itertools.zip_longest`（用填充值补齐到最长）：

```python
from itertools import zip_longest

# 用 None 补齐缺失的名字，长度以最长的 ids 为准
pairs = list(zip_longest(ids, names, fillvalue="未知"))
print([(i, n) for i, n in pairs])
# 输出：[(1, '张三'), (2, '李四'), (3, '未知'), (4, '未知')]
```

注意 `zip_longest` 不像 `map` 那样能直接套用 `func`，它只负责配对，得到配对后还需要进一步处理。如果你想在长度不匹配时既补齐又能应用 `func`，可以用 `zip_longest` + 列表推导式或生成器表达式来组合。

### 2.5 func 为 None 的特殊行为

`map` 有一个不那么常见、但有时很方便的用法：把 `func` 设为 `None`。此时 `map` 不做任何变换，而是 **把多个可迭代对象的元素打包成元组**——其行为和 `zip` 完全一致。

```python
a = [1, 2, 3]
b = ['x', 'y', 'z']

# func=None 时，map 等价于 zip
zipped = list(map(None, a, b))
print(zipped)
# 输出：[(1, 'x'), (2, 'y'), (3, 'z')]
```

这和 `list(zip(a, b))` 的结果一样。既然如此，为什么不直接用 `zip` 呢？原因有几个：

- `zip` 更直观、语义更清晰，是首选写法。
- `map(None, ...)` 只是历史遗留的"另一种写法"，在现代代码里几乎不再使用，读代码的人不一定认识。
- 在 Python 2 时代，`map(None, a, b)` 和 `zip(a, b)` 有细微差异（`map(None, ...)` 在长度不等时用 `None` 补齐到最长，而 `zip` 截断到最短）。Python 3 里 `map(None, ...)` 与 `zip` 行为完全一致了，因此 `map(None, ...)` 的特殊性消失了，存在的意义也就更弱。

**只传一个可迭代对象时 func 不能为 None**

```python
# 只传一个可迭代对象时，func 不能为 None
list(map(None, [1, 2, 3]))
# 输出：
# TypeError: 'NoneType' object is not callable
```

`func=None` 只有在传多个可迭代对象时才有"打包"语义；只传一个可迭代对象时，`map` 会试图调用 `None(...)`，而 `None` 不可调用，于是抛出 `TypeError`。所以这个特殊行为仅适用于多元 `map`。

**实践建议**

现代 Python 代码里几乎不会看到 `map(None, ...)`，因为它不如 `zip` 直观，也没有额外的好处。了解它的存在主要是为了读老代码时不被吓到——看到 `map(None, a, b)` 就知道它等价于 `zip(a, b)` 即可。新代码请直接用 `zip`。

### 2.6 map 对象的消费方式

因为 `map` 返回的是迭代器，所以理解"怎么消费它"至关重要。下面列举几种典型消费方式。

**用 list() / tuple() / set() 收集成容器**

最常见的就是用 `list()` 把结果收成列表：

```python
m = map(str, range(5))
print(list(m))
# 输出：['0', '1', '2', '3', '4']

# 想要元组就用 tuple()
m = map(str, range(5))
print(tuple(m))
# 输出：('0', '1', '2', '3', '4')

# 想要集合就用 set()（注意集合无序、去重）
m = map(str, [1, 1, 2, 3, 3])
print(set(m))
# 输出：{'1', '2', '3'}
```

`list()`、`tuple()`、`set()` 都会立即遍历 `map` 对象到底，把所有元素收集起来。一旦消费完成，这个 `map` 对象就空了，不能再用。

**用 for 循环逐个处理**

如果你不需要把结果存成列表，只想逐个处理，直接 `for` 循环更省内存：

```python
# 逐个处理日志行，不把全部结果存在内存里
log_lines = ["  error: xxx  ", "  warn: yyy ", "  info: zzz  "]

for cleaned in map(str.strip, log_lines):
    # 每次循环 cleaned 是去掉首尾空白后的一行
    print(f"[{cleaned}]")
# 输出：
# [error: xxx]
# [warn: yyy]
# [info: zzz]
```

这里 `map(str.strip, log_lines)` 是惰性的，`for` 每次循环才调用一次 `str.strip`，处理完一行就继续下一行，不需要把所有清洗后的结果同时持有。如果日志文件几百万行，这种写法内存占用恒定。

**用 next() 手动取值**

`map` 对象是迭代器，所以支持 `next()`，可以手动一个一个取：

```python
m = map(str, [10, 20, 30])

print(next(m))   # 取第一个
# 输出：10
print(next(m))   # 取第二个
# 输出：20
print(next(m))   # 取第三个
# 输出：30

# 再取就触发 StopIteration
print(next(m))
# 输出：
# StopIteration
```

`next()` 适合"只取前几个"的场景，比如查看 map 产出的前几个结果确认行为：

```python
# 只看前 3 个，验证转换正确
sample = list(map(str.upper, ["a", "b", "c", "d", "e"]))
print(sample[:3])
# 输出：['A', 'B', 'C']
```

也可以配合 `itertools.islice` 只取前 N 个，而不会把整个 `map` 都算出来：

```python
from itertools import islice

m = map(lambda x: x ** 2, range(1, 1000000))
# 只计算前 5 个，不把上百万个全算出来
print(list(islice(m, 5)))
# 输出：[1, 4, 9, 16, 25]
```

这里 `range(1, 1000000)` 是个上百万的惰性序列，`map` 也是惰性的，`islice(m, 5)` 只触发前 5 次计算就停手，后面的元素根本没被算过。这就是惰性求值的威力——用多少算多少。

**用 sum() / min() / max() / any() / all() 等聚合**

这些聚合函数都接受可迭代对象，所以可以直接喂 `map` 对象：

```python
# 用 sum 直接对 map 结果求和
nums = [1, 2, 3, 4, 5]
total = sum(map(lambda x: x ** 2, nums))
print(total)
# 输出：55   （1 + 4 + 9 + 16 + 25）
```

```python
# 用 any 判断 map 里是否存在满足条件的元素
has_large = any(map(lambda x: x > 100, [10, 50, 200, 30]))
print(has_large)
# 输出：True
```

`any` 在遇到第一个 `True` 时就会短路，后面不会继续计算，这也是惰性求值的一个体现——`any` 不会把整个 `map` 都消费到底。

```python
# 用 all 判断是否全部满足
all_positive = all(map(lambda x: x > 0, [1, 2, 3, 4]))
print(all_positive)
# 输出：True

all_positive = all(map(lambda x: x > 0, [1, -2, 3, 4]))
print(all_positive)
# 输出：False   （-2 不满足，all 立即短路）
```

### 2.7 map 对象只能迭代一次

这是 `map` 返回迭代器（而不是列表）的直接后果：**`map` 对象是"一次性"的，迭代过一次后就空了**，第二次迭代不会得到任何元素。

```python
m = map(str, [1, 2, 3])

first_round = list(m)
print(first_round)
# 输出：['1', '2', '3']

# 同一个 map 对象再迭代一次
second_round = list(m)
print(second_round)
# 输出：[]
```

第一次 `list(m)` 把 `m` 里的元素全部取走，`m` 变成空迭代器；第二次 `list(m)` 自然得到空列表。这和列表不同——列表可以反复迭代。如果你需要多次遍历，就该把结果存成列表：

```python
# 需要反复使用，就先转成列表
result = list(map(str, [1, 2, 3]))

print(result)             # 第一次用
# 输出：['1', '2', '3']
print(len(result))        # 第二次用
# 输出：3
print(result.count('2'))  # 第三次用
# 输出：1
```

把 `list(map(...))` 的结果赋给一个变量，后续就可以反复用。但代价是失去了惰性——一旦 `list()`，所有结果都立刻被算出来并占用内存。这是"惰性省内存"和"可重复使用"之间的取舍：如果你只需要走一遍，保持 `map` 对象惰性就好；如果需要多次访问结果，就转成列表。

**容易出错的场景：把 map 对象传给需要多次迭代的函数**

```python
def analyze(iterable):
    """对可迭代对象做多种分析"""
    length = len(list(iterable))   # 第一次消费
    total = sum(iterable)          # 第二次消费——但此时已经空了！
    return length, total

m = map(int, ["1", "2", "3"])
print(analyze(m))
# 输出：(3, 0)   ← total 是 0，因为 m 在 len() 时已经被消费光
```

这种 bug 非常隐蔽。`analyze` 内部第二次使用 `iterable` 时，如果传入的是 `map` 对象（一次性迭代器），第二次就是空的。解决办法是：要么在 `analyze` 内部就把 iterable 物化成列表，要么由调用方负责传入列表。

```python
# 正确做法：调用方先物化成列表
data = list(map(int, ["1", "2", "3"]))
print(analyze(data))
# 输出：(3, 6)
```

### 2.8 map 与 lambda 配合

`map` 和 `lambda` 是一对常见搭档。当你需要"对每个元素做一个简单变换"，而又懒得专门定义一个函数时，`lambda` 就是那个"即用即弃"的函数。

**简单算术变换**

```python
nums = [1, 2, 3, 4, 5]

# 每个数乘以 10
doubled = list(map(lambda x: x * 10, nums))
print(doubled)
# 输出：[10, 20, 30, 40, 50]

# 每个数取平方
squared = list(map(lambda x: x ** 2, nums))
print(squared)
# 输出：[1, 4, 9, 16, 25]

# 每个数加 1
incremented = list(map(lambda x: x + 1, nums))
print(incremented)
# 输出：[2, 3, 4, 5, 6]
```

**字符串变换**

```python
words = ["hello", "world", "python"]

# 每个单词反转
reversed_words = list(map(lambda w: w[::-1], words))
print(reversed_words)
# 输出：['olleh', 'dlrow', 'nohtyp']

# 每个单词补上前缀
prefixed = list(map(lambda w: f"_{w}", words))
print(prefixed)
# 输出：['_hello', '_world', '_python']
```

**条件表达式配合 lambda**

`lambda` 里也可以写条件表达式，做带有判断的变换：

```python
scores = [55, 78, 92, 40, 67]

# 60 分以上为"及格"，否则"不及格"
labels = list(map(lambda s: "及格" if s >= 60 else "不及格", scores))
print(labels)
# 输出：['不及格', '及格', '及格', '不及格', '及格']
```

**lambda 与自定义函数的取舍**

`lambda` 适合一句话能写完的简单逻辑。一旦需要多行、有复杂判断或要复用，就该定义正式的函数：

```python
# 简单变换：lambda 足够
list(map(lambda x: x * 2, nums))

# 复杂逻辑：定义函数更清晰
def classify_score(s):
    if s >= 90:
        return "优秀"
    elif s >= 60:
        return "及格"
    else:
        return "不及格"

labels = list(map(classify_score, [55, 78, 92, 40]))
print(labels)
# 输出：['不及格', '及格', '优秀', '不及格']
```

如果非要把复杂逻辑塞进 `lambda`，代码会变成一行又长又难读的表达式，反而得不偿失。

### 2.9 map 与列表推导式的对比

这是 Python 社区里一个长期话题：到底是 `map` 好还是列表推导式好？其实没有绝对答案，要看场景。

**形式对比**

同样一件事——把列表里每个数取平方：

```python
nums = [1, 2, 3, 4, 5]

# map 写法
squares_map = list(map(lambda x: x ** 2, nums))

# 列表推导式写法
squares_lc = [x ** 2 for x in nums]

print(squares_map == squares_lc)
# 输出：True
```

两者结果完全一样。但写法有明显区别：

- `map` 把"做什么"放在 `lambda` 里，"对谁做"放后面；读者要先把 `lambda` 解析清楚，再去理解整体。
- 列表推导式把"做什么"放最前面（`x ** 2`），"对谁做"紧随其后（`for x in nums`）；语序更接近自然语言，一眼就能抓住意图。

**func 是现成函数时，map 更简洁**

当变换函数已经存在、不需要现场定义时，`map` 不用 `lambda` 反而更短：

```python
price_strs = ["9.9", "19.5", "100.0"]

# map 写法：直接用 float
prices_map = list(map(float, price_strs))

# 列表推导式写法：要写 float(x)
prices_lc = [float(x) for x in price_strs]

print(prices_map == prices_lc)
# 输出：True
```

`map(float, ...)` 比 `[float(x) for x in ...]` 更短，也更不容易写错（不用临时起名 `x`）。当变换逻辑就是一个现成的单参函数时，`map` 是更省字的选择。

**带条件时，列表推导式更清晰**

如果变换里带条件判断，列表推导式的可读性优势就明显了：

```python
nums = range(10)

# 列表推导式：对偶数取平方，奇数不变
result_lc = [x ** 2 if x % 2 == 0 else x for x in nums]
print(result_lc)
# 输出：[0, 1, 4, 3, 16, 5, 36, 7, 64, 9]

# 等价的 map 写法：要塞进 lambda，可读性差
result_map = list(map(lambda x: x ** 2 if x % 2 == 0 else x, nums))
print(result_map == result_lc)
# 输出：True
```

列表推导式里 `x ** 2 if x % 2 == 0 else x for x in nums` 这种"做啥 for 啥 in 啥"的结构，读起来更顺；`map(lambda x: x ** 2 if x % 2 == 0 else x, nums)` 则把所有逻辑挤在 `lambda` 里，一行变得很长。

**带过滤时，列表推导式更直接**

列表推导式可以同时在"变换"之外加一个过滤条件，而 `map` 本身没有过滤能力，要靠 `filter` 配合：

```python
nums = range(10)

# 列表推导式：只对偶数取平方
result_lc = [x ** 2 for x in nums if x % 2 == 0]
print(result_lc)
# 输出：[0, 4, 16, 36, 64]

# map + filter 等价写法：要先 filter 再 map
result_map = list(map(lambda x: x ** 2, filter(lambda x: x % 2 == 0, nums)))
print(result_map == result_lc)
# 输出：True
```

带过滤的 `map` 写法出现两层嵌套（`map` 套 `filter`），还各配一个 `lambda`，可读性明显不如列表推导式。所以"变换 + 过滤"组合时，列表推导式几乎是默认选择。

**并行多序列时，map 更直接**

当要并行处理多个可迭代对象时，`map` 不用 `zip` 就能直接配对，写起来更短：

```python
a = [1, 2, 3]
b = [10, 20, 30]

# map 写法：直接配对两序列
sums_map = list(map(lambda x, y: x + y, a, b))

# 列表推导式写法：要借助 zip
sums_lc = [x + y for x, y in zip(a, b)]

print(sums_map == sums_lc)
# 输出：True
```

这种场景下 `map` 略简洁，因为它把"并行取值"内化了。但列表推导式配合 `zip` 的写法也很清晰，不算逊色。

**性能对比**

在 CPython 上，对于简单的元素级变换，列表推导式通常比 `map(lambda, ...)` 快，因为列表推导式在解释器里有专门优化的字节码路径，而 `lambda` 会引入额外的函数调用开销。但当 `func` 是内置函数（C 实现）时，`map` 反而可能更快，因为内置函数本身执行快、且 `map` 内部的迭代也走 C 层：

```python
import timeit

nums = list(range(10000))

# 列表推导式：x ** 2
t_lc = timeit.timeit(lambda: [x ** 2 for x in nums], number=1000)

# map + lambda：x ** 2
t_map_lambda = timeit.timeit(lambda: list(map(lambda x: x ** 2, nums)), number=1000)

# map + 内置函数：str
t_map_builtin = timeit.timeit(lambda: list(map(str, nums)), number=1000)

# 列表推导式：str(x)
t_lc_builtin = timeit.timeit(lambda: [str(x) for x in nums], number=1000)

print(f"列表推导式 x**2: {t_lc:.3f}s")
print(f"map+lambda x**2: {t_map_lambda:.3f}s")
print(f"map+内置 str:    {t_map_builtin:.3f}s")
print(f"列表推导式 str:  {t_lc_builtin:.3f}s")
```

典型结果会是：内置函数场景下 `map` 与列表推导式差距不大（`map` 略快或持平）；`lambda` 场景下列表推导式明显快于 `map+lambda`。但具体比例依赖 Python 版本和数据规模，性能不应作为唯一选择依据——可读性往往是更重要的考虑。

**取舍建议**

综合可读性、功能与性能，实践经验大致是：

- 变换就是一个现成的单参函数（`int`、`str`、`len` 等）：优先 `map`，写法简洁。
- 变换需要现场写 `lambda`，且逻辑简单：`map` 和列表推导式都可，看团队习惯。
- 变换里带条件判断或过滤：优先列表推导式，可读性更好。
- 需要惰性求值、不想立即生成全部结果：`map`（或生成器表达式）。
- 需要返回列表：两者都能，列表推导式更直接。

### 2.10 map 与生成器表达式的等价关系

`map(func, iterable)` 和生成器表达式 `(func(x) for x in iterable)` 在语义上完全等价——两者都返回一个惰性的迭代器，按需对每个元素应用 `func`。

```python
nums = [1, 2, 3, 4]

# map 写法
m = map(lambda x: x ** 2, nums)

# 等价的生成器表达式
g = (x ** 2 for x in nums)

# 两者的元素逐一相同
print(list(m) == list(g))
# 输出：True
```

两者都是迭代器，都是惰性的，都只能迭代一次，内存占用也都是 O(1)（不持有全部结果）。可以说，生成器表达式是 `map` 的一种"语法糖"形式——把 `map(f, seq)` 直接写成 `(f(x) for x in seq)`，省掉了 `lambda`。

**多可迭代对象时的等价**

`map(f, a, b)` 等价于 `(f(x, y) for x, y in zip(a, b))`：

```python
a = [1, 2, 3]
b = [10, 20, 30]

# map 写法
m = map(lambda x, y: x + y, a, b)

# 生成器表达式写法（要借助 zip）
g = (x + y for x, y in zip(a, b))

print(list(m) == list(g))
# 输出：True
```

可以看到，多可迭代对象时生成器表达式要用 `zip` 辅助配对，写出来反而比 `map(f, a, b)` 长。这种场景下 `map` 的写法略胜一筹。

**生成器表达式的额外能力：带条件**

生成器表达式可以在变换之外带过滤条件，这一点比 `map` 更灵活：

```python
nums = range(10)

# 生成器表达式：只对偶数取平方
g = (x ** 2 for x in nums if x % 2 == 0)
print(list(g))
# 输出：[0, 4, 16, 36, 64]

# 等价的 map 写法必须配合 filter
m = map(lambda x: x ** 2, filter(lambda x: x % 2 == 0, nums))
print(list(m))
# 输出：[0, 4, 16, 36, 64]
```

生成器表达式 `(f(x) for x in seq if cond(x))` 把变换和过滤写在一处，一目了然；而 `map + filter` 的写法出现两层嵌套，每个都要配 `lambda`，可读性差一截。

**何时选 map，何时选生成器表达式**

- 只是"`func` 套上去"且 `func` 已存在：`map` 更短（如 `map(str, nums)`）。
- 变换逻辑简单、要现场写：生成器表达式略短（如 `(x ** 2 for x in nums)` 比 `map(lambda x: x ** 2, nums)` 更紧凑）。
- 需要带过滤条件：生成器表达式更直接。
- 多可迭代对象配对：`map` 不用 `zip` 更短。

两者都是惰性迭代器，内存行为一致，所以选择主要看可读性和代码长度。

### 2.11 map 与 filter 配合链式处理

`map` 负责变换，`filter` 负责筛选，两者配合可以实现"先筛选再变换"或"先变换再筛选"的链式处理。由于两者都返回迭代器，链式写法可以保持惰性，不产生中间列表。

**先 filter 后 map**

```python
nums = range(20)

# 先筛出偶数，再取平方
result = list(
    map(lambda x: x ** 2,
        filter(lambda x: x % 2 == 0, nums))
)
print(result)
# 输出：[0, 4, 16, 36, 64, 100, 144, 196, 256, 324]
```

执行流程是：`filter` 先把 `nums` 里的偶数筛出来（产出 `0, 2, 4, ...`），`map` 再对这些偶数取平方。整个过程是惰性的——`filter` 不把所有偶数存下来，`map` 也不把所有平方存下来，最后 `list()` 才一次性把链路走完。如果数据源是巨大序列，这种链式写法的内存占用始终是 O(1)。

**先 map 后 filter**

也可以先 `map` 变换，再 `filter` 筛选：

```python
words = ["  apple  ", "  ", "banana", "  cherry  ", ""]
# 先 strip 每个字符串，再过滤掉空字符串

result = list(
    filter(None,                        # filter(None, ...) 会剔除"假值"，包括空字符串
        map(str.strip, words))
)
print(result)
# 输出：['apple', 'banana', 'cherry']
```

这里 `filter(None, iterable)` 是 `filter` 的特殊用法：`None` 当判断函数，表示"保留真值、剔除假值"，空字符串 `""` 是假值会被剔除。`map(str.strip, words)` 先把每个字符串已去除首尾空白（`"  apple  "` → `"apple"`，`"  "` → `""`），`filter(None, ...)` 再剔除空字符串。结果就是非空、已清洗的字符串。

**链式处理的惰性优势**

链式 `filter` + `map` 的最大优势是内存恒定：

```python
import sys

# 数据源：超大 range（不会真的占用多少内存，range 本身是惰性的）
big = range(10 ** 8)

# 链式处理：保持惰性，内存占用恒定
pipeline = map(lambda x: x + 1, filter(lambda x: x % 1000 == 0, big))

# 只取前 5 个看一下
from itertools import islice
print(list(islice(pipeline, 5)))
# 输出：[1, 1001, 2001, 3001, 4001]   （注意 x+1 后的结果）
```

`range(10**8)` 是一个上亿的惰性序列；`filter` 筛出其中 1000 的倍数；`map` 把每个加上 1。整条管道都是惰性的，没有中间列表，`islice` 只触发前 5 次计算就停手。如果改用列表存储中间结果（`[x for x in big if x % 1000 == 0]` 再 `map`），内存会瞬间爆炸。链式惰性管道在处理大数据时是克制而高效的。

**链式 vs 列表推导式**

带过滤的链式 `filter` + `map`，写出来往往不如生成器表达式清晰：

```python
# 链式 filter + map
result_chain = list(
    map(lambda x: x ** 2,
        filter(lambda x: x % 2 == 0, range(20)))
)

# 生成器表达式（等价）
result_gen = list(x ** 2 for x in range(20) if x % 2 == 0)

print(result_chain == result_gen)
# 输出：True
```

两者结果相同且都是惰性的（链式管道里 `filter` 和 `map` 都返回迭代器；生成器表达式也是迭代器）。但生成器表达式的写法明显更紧凑、更易读：变换和过滤写在一行里，自然语言语序。所以现代 Python 代码里，这种"变换 + 过滤"的简单链式处理，更多用生成器表达式而非 `filter + map` 嵌套。

`filter + map` 链式写法的用武之地，主要是当你已经把变换函数和判断函数都封装好了，想要把它们组合起来：

```python
def is_valid(record):
    return "active" in record

def to_upper(record):
    return record.upper()

records = ["user-active", "user-inactive", "admin-active", "guest-unknown"]

# 用现成函数组合，不必 lambda
pipeline = map(to_upper, filter(is_valid, records))
print(list(pipeline))
# 输出：['USER-ACTIVE', 'ADMIN-ACTIVE']
```

当 `is_valid` 和 `to_upper` 都是已有的具名函数时，`map(to_upper, filter(is_valid, records))` 读起来还是很清晰的，像在拼管道。这比 `map` 嵌套 `lambda` 要好得多。

### 2.12 典型应用场景汇总

把前面散见的场景集中起来，让读者一眼看到 `map` 在实际编码中的落点。

**场景一：批量类型转换**

这是 `map` 最经典的用途，把一个序列从一种类型批量转成另一种类型。

```python
# 从用户输入或文件读入的数字字符串，统一转成整数
input_lines = [" 12 ", "34\n", " 56 ", "78"]
numbers = list(map(int, input_lines))   # int 自动处理首尾空白
print(numbers)
# 输出：[12, 34, 56, 78]
```

```python
# 把成绩列表批量转成字符串，用于拼接展示
scores = [88, 92, 75, 60]
score_strs = list(map(str, scores))
print(",".join(score_strs))
# 输出：88,92,75,60
```

```python
# 把数值列表批量转成浮点数，做后续浮点运算
values = ["3.14", "2.718", "1.414"]
floats = list(map(float, values))
print(floats)
# 输出：[3.14, 2.718, 1.414]
```

类型转换的本质是"对每个元素都调用同一个类型构造函数"，这正是 `map` 的拿手好戏。比起写 `for` 循环逐个 append，`map(int, ...)` 一行就表达了意图，且类型构造函数是现成的，不需要 `lambda`。

**场景二：两序列逐元素运算**

两个等长序列按位置配对做运算，是 `map` 多元形式的典型场景。

```python
# 两个向量的逐元素相加
v1 = [1.0, 2.0, 3.0]
v2 = [4.0, 5.0, 6.0]
v_sum = list(map(lambda a, b: a + b, v1, v2))
print(v_sum)
# 输出：[5.0, 7.0, 9.0]
```

```python
# 单价 × 数量 = 小计
prices = [9.9, 19.5, 5.0, 12.8]
quantities = [2, 1, 5, 3]
subtotals = list(map(lambda p, q: p * q, prices, quantities))
print(subtotals)
# 输出：[19.8, 19.5, 25.0, 38.4]
```

```python
# 计算每个学生的平均分（三门课，每门用总分/人数得到平均）
totals = [270, 240, 285]
counts = [3, 3, 3]
averages = list(map(lambda t, c: t / c, totals, counts))
print(averages)
# 输出：[90.0, 80.0, 95.0]
```

这种"两股数据并行配对"的场景，`map(func, a, b)` 不用 `zip` 就能直接配对，写起来利落。

**场景三：对文件每行做处理**

文件对象逐行产出字符串，配合 `map` 可以做"逐行清洗 / 解析"。

```python
# 假设 access.log 每行是一条日志，格式如 "200 /home"
# 要统计每条日志的状态码
status_codes = []

with open("access.log") as f:
    # f 迭代产出每行（带换行符），split 后取第一个字段
    for fields in map(lambda line: line.split(), f):
        status_codes.append(fields[0])

# （假设日志内容如下）：
# 200 /home
# 404 /missing
# 200 /about
print(status_codes)
# 输出：['200', '404', '200']
```

这里 `map` 把"每行 → split 后的字段列表"这一变换逐行进行，`for` 循环拿到字段列表后取第一个元素。整个流程是惰性的：文件按行读、`map` 按行变换，内存里同一时刻只持有当前行。对于多 GB 的大日志文件，这种写法能做到恒定内存。

**更直接的逐行 strip**

```python
# 去掉每行首尾空白（包括换行符）
with open("data.txt") as f:
    cleaned = list(map(str.strip, f))
print(cleaned)
# 输出（假设文件内容是 "a\n b \nc"）：['a', 'b', 'c']
```

`str.strip` 现成可用，`map(str.strip, f)` 把每行的首尾空白清掉。这种写法比 `[line.strip() for line in f]` 略短，且不引入临时变量名 `line`。

**场景四：并行处理多列**

在结构化数据处理里，把多列字段合并、加工成一列是常见需求。

```python
# 三列：姓名、年龄、城市，合并成 "姓-龄-城" 字符串
names = ["张三", "李四", "王五"]
ages = [25, 30, 28]
cities = ["北京", "上海", "广州"]

profiles = list(map(lambda n, a, c: f"{n}-{a}-{c}", names, ages, cities))
print(profiles)
# 输出：['张三-25-北京', '李四-30-上海', '王五-28-广州']
```

```python
# 数据清洗：把三列字符串都转成大写、去空白
col_a = ["  a1 ", " a2", "a3 "]
col_b = [" b1 ", "  b2", "b3  "]
col_c = [" c1", "c2  ", " c3 "]

cleaned = list(map(lambda a, b, c: (a.strip().upper(), b.strip().upper(), c.strip().upper()),
                   col_a, col_b, col_c))
print(cleaned)
# 输出：[('A1', 'B1', 'C1'), ('A2', 'B2', 'C2'), ('A3', 'B3', 'C3')]
```

三个序列并行处理，`map` 把每列同位置的元素配成三元组交给 `lambda`，`lambda` 对每个元素做 strip + upper，产出清洗后的三元组列表。

## 3. 最佳实践

### 3.1 不要忘了把 map 对象物化

最常见的坑就是以为 `map(...)` 返回了列表，其实它返回的是迭代器。如果你后续想反复使用、用下标访问、或者用列表方法（如 `.append`、`.count`），就要先 `list(map(...))`。

```python
# 错误：直接对 map 对象做下标访问
m = map(str, [1, 2, 3])
print(m[0])
# 输出：
# TypeError: 'map' object is not subscriptable

# 正确：先转成列表
m_list = list(map(str, [1, 2, 3]))
print(m_list[0])
# 输出：1
```

`map` 对象不支持 `[]` 下标访问，也不支持 `len()`。要支持这些，就物化成 `list` / `tuple`。

```python
# 错误：对 map 对象取长度
m = map(str, [1, 2, 3])
print(len(m))
# 输出：
# TypeError: object of type 'map' has no len()
```

### 3.2 警惕 map 对象只能迭代一次

如前所述，`map` 对象一旦迭代完就空了。在把 `map` 对象传给函数、或在循环里多次使用时，要特别注意这一点。

```python
# 反面：把 map 对象直接传给需要多次迭代的逻辑
def summarize(numbers):
    total = sum(numbers)        # 第一次迭代
    count = len(list(numbers))  # 第二次迭代——已经是空的了
    return total, count

m = map(int, ["1", "2", "3"])
print(summarize(m))
# 输出：(6, 0)   ← total 算对了，count 是 0
```

`sum` 把 `m` 消费完了，`len(list(m))` 就找不到元素。修正办法：在 `summarize` 内部先把 `numbers` 物化成列表，或调用方先物化：

```python
# 修正：在函数内部物化
def summarize(numbers):
    data = list(numbers)        # 一次性物化
    return sum(data), len(data)

m = map(int, ["1", "2", "3"])
print(summarize(m))
# 输出：(6, 3)
```

### 3.3 别在复杂变换上硬用 lambda

`lambda` 只能写单表达式，一旦变换逻辑复杂（多行、嵌套判断、临时变量），硬塞进 `lambda` 会让代码非常难读。应该定义正式的函数：

```python
# 反面：把复杂逻辑塞进 lambda
result = list(map(
    lambda r: (r.split(",")[0].strip(), int(r.split(",")[1].strip()), r.split(",")[2].strip().upper()),
    raw_records
))

# 推荐：定义一个清晰的函数
def parse_record(line):
    parts = [p.strip() for p in line.split(",")]
    return parts[0], int(parts[1]), parts[2].upper()

result = list(map(parse_record, raw_records))
```

函数有名字、可以写多行、可以用临时变量，可读性和可维护性都好得多。`lambda` 只适合一句话能说清的简单变换。

### 3.4 多可迭代对象时注意长度对齐

`map` 多元形式按最短截断，且不报错。当你的本意是"两个序列应该等长"时，这种静默截断会让数据悄悄丢失。建议在长度敏感的场合显式校验：

```python
# 数据清洗场景：两边长度必须一致，否则视为数据异常
prices = [9.9, 19.5, 5.0]
quantities = [2, 1]

if len(prices) != len(quantities):
    raise ValueError(f"价格与数量长度不一致: {len(prices)} vs {len(quantities)}")

subtotals = list(map(lambda p, q: p * q, prices, quantities))
# 输出：ValueError: 价格与数量长度不一致: 3 vs 2
```

加上显式校验后，长度不一致会立即报错，避免数据被默默截断。如果确实想用"补齐到最长"的语义，改用 `itertools.zip_longest`。

### 3.5 选 map 还是列表推导式，看可读性

性能差异通常不显著，可读性才是主要取舍点。一个实用的判断标准：

- 变换就是一个现成的单参函数 → `map` 更简洁。
- 变换要现场写表达式 → 列表推导式更自然。
- 带条件或过滤 → 列表推导式更清晰。
- 多序列并行配对 → `map` 略短，两者都可。
- 需要惰性、不要立即生成列表 → `map` 或生成器表达式。

```python
# 现成函数：map 更短
list(map(str, nums))         # 优于 [str(x) for x in nums]？

# 简单表达式：看个人偏好
[x * 2 for x in nums]        # 直观
list(map(lambda x: x * 2, nums))  # 同样清晰

# 带过滤：列表推导式好
[x for x in nums if x > 0]   # 比 filter + map 更直接
```

团队里可以约定一个统一风格，避免代码里 `map` 和列表推导式混用造成阅读负担。

### 3.6 惰性链式处理时注意消费时机

链式 `filter` + `map` 保持惰性是它的优势，但要留意：惰性管道只有在真正被消费时才会执行。如果你在管道里依赖了文件句柄、数据库连接等需要及时释放的资源，记得在消费完之后再关闭资源，否则会读到已关闭的资源。

```python
# 反面：文件在外面关了，管道还没消费
def get_cleaned():
    with open("data.txt") as f:
        return map(str.strip, f)   # 返回的是惰性 map，文件在 with 退出时就关了！

pipeline = get_cleaned()
print(list(pipeline))   # 此时文件已关闭，但 map 持有的迭代器其实是文件对象，
                        # 文件关闭后再迭代会得到空结果或报错
# 输出：[]   （或 ValueError: I/O operation on closed file）
```

```python
# 正面：在文件还开着时就完成消费
with open("data.txt") as f:
    cleaned = list(map(str.strip, f))   # 在 with 内物化
print(cleaned)
```

惰性和资源生命周期是一对爱出 bug 的组合：惰性意味着"晚点再算"，资源意味着"现在就要用"。两者错位时就会出问题。惯用法是：**在资源还在作用域内就把惰性管道消费完**。

### 3.7 不要用 map 只为了副作用

`map` 设计上是用来"变换"的——收集 `func` 的返回值。如果 `func` 只做副作用（比如打印、写日志、修改外部状态）、没有有意义的返回值，那用 `map` 是误用。`map` 的返回值会被丢弃，但惰性机制意味着 **如果你不消费 `map` 对象，`func` 根本不会被调用**：

```python
# 反面：想用 map 把每个元素打印出来，但没消费 map 对象
def show(x):
    print(f"处理: {x}")

m = map(show, [1, 2, 3])   # 不会立刻打印！map 是惰性的
# （什么都没输出）

# 必须消费才能触发
list(m)
# 输出：
# 处理: 1
# 处理: 2
# 处理: 3
```

`m = map(show, [1, 2, 3])` 不会触发任何打印，因为 `map` 对象还没被消费。后续 `list(m)` 才真正调用了 `show`。这种"因为惰性所以不执行"的特性，让 `map` 用来做副作用非常反直觉。如果你就是想做副作用，直接用 `for` 循环更清楚：

```python
# 推荐：纯副作用用 for 循环
for x in [1, 2, 3]:
    show(x)
# 输出：
# 处理: 1
# 处理: 2
# 处理: 3
```

`for` 循环没有惰性陷阱，意图也更明确。`map` 留给"收集变换结果"的场景。

## 4. 原理

### 4.1 map 返回的是迭代器对象而非列表

要真正理解 `map`，必须搞清楚它返回的到底是什么。答案是一个 **`map` 类型的迭代器对象**。它既不是列表，也不是生成器（generator），而是 `map` 这个内置类型的一个实例。

```python
m = map(str, [1, 2, 3])

print(type(m))
# 输出：<class 'map'>

# 它实现了迭代器协议：__iter__ 返回自身，__next__ 产出下一个元素
print(m.__iter__() is m)
# 输出：True

print(next(m))
# 输出：1
```

`type(m)` 是 `<class 'map'>`，这是 CPython 里用 C 实现的一个内置类型。`m.__iter__()` 返回 `m` 自身，这是迭代器的标志——迭代器协议要求 `__iter__` 返回迭代器自身，`__next__` 返回下一个元素。`map` 对象两者都满足，所以它是个标准的迭代器。

和列表对比一下：

| 特性 | list | map 对象 |
| --- | --- | --- |
| 立即持有全部元素 | 是 | 否，按需算 |
| 可重复迭代 | 是 | 否，一次性 |
| 支持 `len()` | 是 | 否 |
| 支持下标 `[]` | 是 | 否 |
| 支持 `in` | 是（遍历） | 是（遍历） |
| 内存占用 | O(n) | O(1) |

"`map` 返回迭代器"这件事是 Python 3 的重大改动之一。在 Python 2 里，`map` 返回的是列表，这带来了不同的语义和性能特征，后面会专门讨论。

### 4.2 惰性求值的机制

`map` 的惰性求值是怎么实现的？核心在于 **`__next__` 才触发计算**。构造 `map` 对象时，`map` 只是把 `func` 和可迭代对象的引用存起来，不做任何计算；每次调用 `next(m)` 时，才从底层可迭代对象取一个元素、调用 `func`、把结果返回。

可以想象成 `map` 对象内部大概是这样的状态机（用 Python 伪代码描述其工作逻辑）：

```python
# 伪代码：map 对象的工作逻辑（仅示意，非真实实现）
class Map:
    def __init__(self, func, iterable):
        self.func = func                    # 保存函数引用
        self.iterator = iter(iterable)      # 保存可迭代对象的迭代器

    def __iter__(self):
        return self                         # 迭代器返回自身

    def __next__(self):
        item = next(self.iterator)          # 从底层迭代器取一个元素
        return self.func(item)              # 调用 func 并返回结果
```

这段伪代码揭示了几个关键点：

1. **构造时不计算**：`__init__` 只存了 `func` 和 `iter(iterable)`，没有调用 `func`，也没有遍历 `iterable`。
2. **每次 `__next__` 才算一个**：`next` 从底层迭代器取一个元素，调用 `func` 计算后返回。这就是"问一个算一个"的本质。
3. **底层迭代器耗尽即停止**：当 `next(self.iterator)` 抛出 `StopIteration` 时，`map` 的 `__next__` 也跟着抛出 `StopIteration`，表示没有更多元素。

多可迭代对象的情况类似，只是 `__next__` 里要同时从多个迭代器各取一个元素：

```python
# 伪代码：多元 map 的工作逻辑
class MapMulti:
    def __init__(self, func, *iterables):
        self.func = func
        self.iterators = [iter(it) for it in iterables]  # 保存每个可迭代对象的迭代器

    def __iter__(self):
        return self

    def __next__(self):
        # 从每个迭代器各取一个元素，组成参数元组
        args = [next(it) for it in self.iterators]
        return self.func(*args)   # 解包成多个参数调用 func
```

当任意一个底层迭代器抛出 `StopIteration` 时，`map` 就停止——这就是"按最短截断"的机制来源：第一个耗尽的迭代器让整个 `map` 停下。

**用 next 验证惰性**

```python
m = map(lambda x: print(f"计算 {x}") or x * 2, [10, 20, 30])

# 到这里为止，没有任何输出——map 构造时不计算
print("--- 创建 map 对象后，尚未计算 ---")

# 调用一次 next，才触发一次计算
print(next(m))
# 输出：
# 计算 10
# 20

print("--- 再取一个 ---")
print(next(m))
# 输出：
# 计算 20
# 40

print("--- 剩下一个还没算 ---")
# 第三个元素还没被计算，直到再 next 之一
print(next(m))
# 输出：
# 计算 30
# 60
```

这段代码直观地证明了：`map` 对象的每个元素都是在被 `next` 取出时才真正计算的，没人取就没人算。这就是惰性求值。

### 4.3 map 对象内部维护函数与可迭代对象的引用

`map` 对象在内部持有两样东西：**对 `func` 的引用** 和 **对可迭代对象（或其迭代器）的引用**。这两样引用在对象的整个生命周期里都存在，这也带来一些值得注意的行为。

```python
m = map(str, [1, 2, 3])

# map 对象有一些属性可以窥探内部
print("func:", m.func)
# 输出：func: <class 'str'>

print("iterable:", m.iterable)
# 输出：iterable: [1, 2, 3]   （或类似，取决于实现；CPython 通过 map 对象内部字段持有）
```

在 CPython 里，`map` 对象暴露了 `func` 和 `iterable` 等属性（具体取决于版本和实现细节）。`func` 就是你传入的函数引用，`iterable` 是对底层可迭代对象的引用。注意：

- 如果你把一个生成器传给 `map`，那么 `map` 持有的是生成器的迭代器，生成器一旦耗尽，`map` 也跟着耗尽。
- 如果你把一个列表传给 `map`，那么 `map` 持有列表的迭代器。**列表本身不会被 `map` 修改**，`map` 只是读它。
- `func` 如果是一个 closure，那么 `map` 持有的函数对象也持有 closure 的变量引用。只要 `map` 还活着，这些变量就不会被回收。

这意味着 `map` 对象在引用关系上是一个"持有者"：它持有 `func` 和底层 iterable 的引用，阻止它们被垃圾回收，直到 `map` 对象自己被回收或被消费完。

**对底层可迭代对象的修改会影响 map**

因为 `map` 持有的是底层可迭代对象的引用（而且对于列表这类可变序列，迭代器是按索引读的），如果在你消费 `map` 之前底层可迭代对象被改了，`map` 产出的结果也会变：

```python
data = [1, 2, 3]
m = map(lambda x: x * 10, data)

# 在消费 m 之前修改 data
data.append(4)

# 现在 m 会把新加的 4 也变换出来
print(list(m))
# 输出：[10, 20, 30, 40]
```

`map` 持有 `data` 的迭代器，迭代器在列表末尾添加元素后还能取到新元素（这是列表迭代器的特性）。所以 `list(m)` 把 `4*10=40` 也算了出来。这种"延迟求值期间源数据被改"导致的意外，是惰性求值的潜在副作用。消费得越早，受这种影响越小。

### 4.4 与 Python 2 的历史差异

在 Python 2 里，`map` 的行为和 Python 3 有显著不同：

- **Python 2 的 `map` 返回列表**：`map(func, iterable)` 在 Python 2 里直接返回一个列表，所有元素立即被计算出来。
- **Python 3 的 `map` 返回迭代器**：`map(func, iterable)` 返回 `map` 对象，惰性求值。

这个改动是 Python 3 的一项大型"惰性化"调整的一部分，同期改动的还有 `zip`、`filter`、`range`、字典的 `keys/values/items` 等——它们在 Python 2 都返回列表，在 Python 3 里都改成了惰性视图或迭代器。

改动的动机是 **内存效率**。在 Python 2 里，`map(str, huge_list)` 会立即生成一个等长的新列表，哪怕你只想看前几个结果，也要付出完整列表的内存代价。Python 3 改成迭代器后，`map` 不再预先把所有结果算出来，而是"要一个算一个"，内存占用恒定为 O(1)。这对大数据处理是实质性的提升。

但这个改动也带来 **不兼容**：Python 2 代码里 `map(func, seq)` 可以直接当下标用、可以反复迭代，迁移到 Python 3 时如果不变换，就会出现"下标访问报错"、"第二次迭代是空的"等问题。常见迁移做法是在 `map(...)` 外面包一层 `list()`，即 `list(map(func, seq))`，让行为退回到 Python 2 的"立即得到列表"。

**Python 2 多元 map 与 None 的差异**

在 Python 2 里，`map(None, a, b)` 和 `zip(a, b)` 不完全一样：`map(None, a, b)` 在长度不等时用 `None` 补齐到最长（类似 `zip_longest`），而 `zip(a, b)` 截断到最短。

```python
# Python 2 行为（示意，Python 3 不再如此）
# map(None, [1,2,3], [10,20]) → [(1,10), (2,20), (3,None)]
# zip([1,2,3], [10,20])      → [(1,10), (2,20)]
```

Python 3 里 `map(None, a, b)` 和 `zip(a, b)` 行为一致，都是截断到最短。这也是为什么 `map(None, ...)` 在 Python 3 里失去了"补齐"的独有能力，变得不如 `zip`，更没什么人用了。

### 4.5 map 与迭代器协议的契约

`map` 之所以能用在 `for` 循环、`list()`、`sum()` 等所有"吃可迭代对象"的地方，是因为它严格遵守了迭代器协议。迭代器协议是 Python 里"可迭代"这件事的底层契约，它规定：

- 一个迭代器必须实现 `__iter__`，返回自身。
- 一个迭代器必须实现 `__next__`，返回下一个元素，没元素时抛 `StopIteration`。

`map` 对象两者都实现了：

```python
m = map(str, [1, 2])
print(hasattr(m, "__iter__"))   # True
print(hasattr(m, "__next__"))   # True
```

`__iter__` 返回 `m` 自身，所以 `for x in m` 能工作（`for` 本质上调用 `iter(m)` 拿到迭代器，然后反复调用 `next`）。`__next__` 每次调底层的 `next` 并把元素交给 `func`，耗尽时抛 `StopIteration`，`for` 收到 `StopIteration` 就退出循环。

`list(m)` 内部也是同样的流程：反复调用 `next(m)` 把元素逐个塞进列表，直到 `StopIteration`。`sum(m)`、`any(m)`、`all(m)` 也都是同理——只要遵守迭代器协议，就能被所有接受可迭代对象的工具消费。

**作为一次性迭代器的后果**

迭代器协议里没有"重置"的概念——迭代器一旦耗尽，就不能再开始。这就是 `map` 对象只能迭代一次的根源。对比列表：列表实现了 `__iter__`，每次调用 `iter(list)` 都会创建一个新的列表迭代器，所以列表能反复迭代；`map` 对象的 `__iter__` 返回自身，没有"新的迭代器"可创建，所以一旦走完就空。

理解了这一点，你也就能理解为什么 `map` 和生成器一样"一次性"，而 `list`、`tuple`、`range` 这些"容器"可以反复迭代——区别就在于 `__iter__` 是返回新迭代器，还是返回自身。

### 4.6 垃圾回收与资源释放

`map` 对象持有 `func` 和底层可迭代对象的引用。当 `map` 对象自己被回收（比如离开作用域）时，这些引用也会释放。这通常不是问题，但在处理文件、数据库连接等需要显式关闭的资源时，要留意 `map` 是否还活着：

```python
# 反面：map 持有文件迭代器，但文件早就该关了
def get_lines():
    f = open("data.txt")
    return map(str.strip, f)   # map 持有 f 的迭代器，f 不会被立刻关闭
    # 函数返回后，f 失去局部引用，但 map 还持有 f 的迭代器
    # 依赖 GC 回收才关闭文件，时机不确定

lines = get_lines()
# 此处 f 可能还开着，文件描述符还占着
```

正确的做法是让 `map` 在资源的作用域内就被消费完：

```python
def get_lines():
    with open("data.txt") as f:
        return list(map(str.strip, f))   # 在 with 内消费完，返回列表
```

或者干脆不要返回 `map` 对象，避免把"持有资源"的迭代器泄漏到外面。这是惰性求值与资源管理相互作用时需要特别留意的点：**惰性意味着生命周期被拉长，而资源通常希望尽早释放**。

## 5. 总结

### 5.1 本文内容要点

- **map 的定义**：内置函数 `map(func, *iterables)`，对可迭代对象的每个元素应用 `func`，返回一个 `map` 迭代器（惰性求值，不返回列表）。
- **func 参数**：要应用的函数，可以是内置函数、自定义函数、类、绑定方法等任何可调用对象；多元形式下需接受与可迭代对象数量相同的参数。
- **单可迭代对象形式**：`map(func, iterable)`，`func` 接受一个参数，逐元素变换，如 `map(str, [1,2,3])`。
- **多可迭代对象形式**：`map(func, a, b, ...)`，并行从每个可迭代对象各取一个元素交给 `func`，按最短截断，如 `map(lambda x,y: x+y, a, b)`。
- **func=None 特殊行为**：多元形式下等价于 `zip`，把多序列打包成元组；单可迭代对象时 `func` 不能为 `None`。
- **map 对象的消费**：因为是迭代器，需要 `list()` / `tuple()` / `for` / `next()` / `sum()` 等来消费；只能迭代一次，再次迭代为空。
- **map 与 lambda 配合**：适合简单变换；复杂逻辑应定义正式函数，不要硬塞进 `lambda`。
- **map 与列表推导式对比**：现成单参函数用 `map` 更短；带条件或过滤用列表推导式更清晰；性能差距通常不显著，可读性是主要取舍。
- **map 与生成器表达式等价**：`map(func, seq)` 等价于 `(func(x) for x in seq)`，两者都是惰性迭代器；生成器表达式可带条件，更灵活。
- **map 与 filter 链式处理**：`map` 做变换、`filter` 做筛选，组成惰性管道，内存占用恒定；带过滤的简单链式可用生成器表达式替代。
- **典型场景**：批量类型转换（`str`/`int`/`float`）、两序列逐元素运算、文件每行处理、并行多列加工。
- **底层原理**：`map` 返回的是 `map` 类型的迭代器对象，遵守迭代器协议（`__iter__` 返回自身、`__next__` 触发一次计算）；内部持有 `func` 和底层可迭代对象（或其迭代器）的引用；构造时不计算，每次 `__next__` 才算一个元素；耗尽即抛 `StopIteration`，多元时第一个耗尽的迭代器决定停止。
- **历史差异**：Python 2 的 `map` 返回列表（立即求值），Python 3 改为返回迭代器（惰性求值），是"惰性化"调整的一部分；`map(None, a, b)` 在 Python 2 会用 `None` 补齐到最长，在 Python 3 与 `zip` 一致为最短截断。

### 5.2 读完本文你应能掌握

- 说清 `map(func, *iterables)` 各参数含义，并正确使用单可迭代对象与多可迭代对象两种形式，能举出每种的典型场景。
- 解释为什么 `map` 返回的是迭代器而不是列表，并说明 `list(map(...))`、`for x in map(...)`、`next(map(...))` 各自如何消费 map 对象、何时触发计算。
- 说明 map 对象"只能迭代一次"的原因（迭代器协议规定 `__iter__` 返回自身），并能在代码中规避"第二次迭代为空"的坑。
- 判断"按最短截断"何时是便利、何时是隐患，并在长度敏感的场合加入显式校验或改用 `itertools.zip_longest`。
- 在 `map` + `lambda`、`map` + 现成函数、列表推导式、生成器表达式之间，按可读性与功能需求做出合理取舍，并能说明各自的惰性与内存行为。
- 用 `map` + `filter` 组合或生成器表达式写出惰性链式处理管道，并理解其内存恒定优势与资源生命周期注意事项。
- 解释 `map` 的惰性求值机制（构造时只存引用、`__next__` 才计算、耗尽抛 `StopIteration`），以及 Python 2 返回列表与 Python 3 返回迭代器的历史差异对迁移代码的影响。
- 识别 `map` 用于副作用时的惰性陷阱（不消费就不执行），并改用 `for` 循环处理纯副作用场景。