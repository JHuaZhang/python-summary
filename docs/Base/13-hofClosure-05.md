---
group:
  title: 【13】高阶函数与闭包
  order: 13
order: 5
title: sorted 自定义排序
nav:
  title: Python
  order: 1
---

## 1. 介绍

### 1.1 什么是 sorted

`sorted` 是 Python 的内置函数，用于对任意可迭代对象进行排序，返回一个**全新的列表**，不修改原对象。与它配对的还有列表对象的 `list.sort()` 方法，用于**原地**排序。两者底层都基于同一套排序算法（Timsort），只是接口形态和副作用不同。

排序是日常编程里最常见的操作之一：把成绩从高到低排、把日志按时间倒序取最近 10 条、把商品按价格升序展示……这些场景都离不开 `sorted`。Python 的 `sorted` 之所以好用，关键在于它通过 `key` 参数把"如何比较"这件事抽象成了一个函数——你不需要自己去实现比较逻辑，只要告诉它"每个元素该用什么值来代表它的排序权重"即可。

理解 `sorted` 的核心是理解三个参数：`iterable`（排什么）、`key`（怎么定序）、`reverse`（升还是降）。其中 `key` 是重中之重，它取代了 Python 2 时代基于 `cmp` 比较函数的写法，既是性能上的进步，也是思维方式的转变——从"两两比较"转向"先抽取排序键，再按键排序"。

### 1.2 基本语法与最小用法

`sorted` 的函数签名如下：

```python
sorted(iterable, /, *, key=None, reverse=False)
```

- `iterable`：任意可迭代对象（列表、元组、字符串、字典的键、集合、甚至生成器都可以）。
- `key`：仅关键字参数（`*` 之后），接受一个单参数函数，用于把每个元素映射成排序键；默认 `None`，即直接比较元素本身。
- `reverse`：布尔值，默认 `False`（升序）；传 `True` 得到降序结果。

最小示例：

```python
# 最朴素的用法：对一组数字排序
nums = [3, 1, 4, 1, 5, 9, 2, 6]
result = sorted(nums)
print(result)   # 输出：[1, 1, 2, 3, 4, 5, 6, 9]
print(nums)     # 输出：[3, 1, 4, 1, 5, 9, 2, 6]  —— 原列表没变
```

`list.sort()` 方法的签名类似，但它没有返回值（返回 `None`），且直接作用于列表本身：

```python
nums = [3, 1, 4, 1, 5, 9, 2, 6]
ret = nums.sort()   # 原地排序
print(ret)          # 输出：None
print(nums)         # 输出：[1, 1, 2, 3, 4, 5, 6, 9]  —— 原列表被改了
```

这个"返回新列表 vs 原地修改、返回 None"的差异，是 `sorted` 和 `list.sort` 之间最关键的区别，下文会反复涉及。

## 2. 核心内容

### 2.1 sorted 与 list.sort 的取舍

先看一对兄弟 API 的完整对照。`sorted()` 是内置函数，接受任意可迭代对象（不只是列表），返回新列表；`list.sort()` 是列表方法，只能作用于列表，原地排序，返回 `None`。

为什么要让 `list.sort()` 返回 `None` 而不是返回排序后的列表？这是 Python 的一个刻意设计：返回 `None` 可以避免调用者误以为得到了新对象，从而强化"这是原地修改"的语义。这种"原地修改的方法返回 None"的约定在 Python 中很常见，比如 `list.append`、`list.extend`、`dict.update` 都是如此。

```python
# sorted：返回新列表，适用任意可迭代对象
words = ("banana", "apple", "cherry")   # 元组
result = sorted(words)
print(result)            # 输出：['apple', 'banana', 'cherry']
print(words)             # 输出：('banana', 'apple', 'cherry')  —— 元组不可变，本来也不能原地排
print(result is words)   # 输出：False  —— 新对象

# list.sort：原地排序，仅列表可用
nums = [5, 2, 8, 1]
nums.sort()
print(nums)   # 输出：[1, 2, 5, 8]
```

**什么时候用哪个**

- 需要**保留原对象不变**（比如原始顺序后续还要用、对象是不可变的元组或字符串、共享引用给别人）：用 `sorted()`。
- 只有一个**列表**、**不需要保留原顺序**、**在意内存**（避免复制一份）：用 `list.sort()`。
- 想在**链式表达式**里写（如 `sorted(data)[:10]` 取 top 10）：用 `sorted()`，因为 `list.sort()` 返回 `None`，链不下去。

```python
# 链式写法：sorted 返回列表，可以接切片
data = [88, 72, 95, 61, 80, 77, 90]
top3 = sorted(data, reverse=True)[:3]
print(top3)   # 输出：[95, 90, 88]

# list.sort 在链式里不行
# data.sort()[:3]  # 报错：NoneType is not subscriptable
```

**原地排序省内存的场景**

处理一个很大的列表、只需要排好顺序用一次时，原地排序能省掉一份拷贝：

```python
big_list = list(range(10_000_000, 0, -1))
big_list.sort()   # 原地排，不再分配一份等大的新列表
```

不过要注意，`sorted()` 内部其实也用了归并排序，开销主要在结果列表的分配和写入上，并不至于翻倍；只有在数据量极大、内存敏感时才需要刻意区分。

### 2.2 reverse 参数：升序与降序

`reverse` 是个布尔开关，默认 `False`（升序）。传 `True` 就是降序。它**不是**"先升序再反转"的偷懒实现，而是在排序比较过程中直接反转比较方向，因此性能与升序一致。

```python
nums = [3, 1, 4, 1, 5, 9, 2, 6]
print(sorted(nums))                 # 输出：[1, 1, 2, 3, 4, 5, 6, 9]  升序
print(sorted(nums, reverse=True))   # 输出：[9, 6, 5, 4, 3, 2, 1, 1]  降序
```

字符串也按字典序（Unicode 码点序）排序：

```python
fruits = ["banana", "Apple", "cherry", "avocado"]
print(sorted(fruits))
# 输出：['Apple', 'avocado', 'banana', 'cherry']
# 注意大写 'A' (65) 排在小写 'a' (97) 前面，因为比较的是码点
```

**reverse 与 key 的搭配**

`reverse=True` 翻转的是**最终排序方向**，而不是 key 函数的返回方向。也就是说，排序仍然是"按 key 从小到大"算出来，再整体反转：

```python
words = ["banana", "apple", "cherry", "fig"]
# 按长度升序
print(sorted(words, key=len))                 # 输出：['fig', 'apple', 'banana', 'cherry']
# 按长度降序
print(sorted(words, key=len, reverse=True))   # 输出：['banana', 'cherry', 'apple', 'fig']
```

这里 `'banana'` 和 `'cherry'` 长度都为 6，谁排前面取决于稳定性（下文专门讲）。

**不要用 reverse 去"抵消" key**

如果你的真实需求是"按某字段降序、再按另一字段升序"，不要简单堆 `reverse=True`——这会把两个字段的方向都翻过来。正确做法是用元组 key 配合负数技巧（见 2.6），或者用 `cmp_to_key`（见 2.8）。

### 2.3 key 参数：排序的核心

`key` 是 `sorted` 真正强大的地方。它接受一个单参数函数，对每个元素调用一次，返回的值作为该元素的"排序键"；排序时实际比较的是这些键，而不是元素本身。

需要强调三点：

1. `key` 是**仅关键字参数**。因为函数签名里 `iterable` 后面有个 `/`，再后面是 `*`，所以 `key` 和 `reverse` 必须用关键字传，写成 `sorted(nums, len)` 会报错。
2. `key` 函数对每个元素**只调用一次**（不是每次比较都调用），这是它比 `cmp` 比较函数快的根本原因，原理章会详细展开。
3. `key` 函数返回的值必须是**可比较**的（支持 `<` 运算）。返回元组时是元组按字典序比较，这正是多关键字排序的基础。

**按字符串长度排序**

最经典的入门例子：

```python
words = ["banana", "pie", "apple", "fig", "cherry"]
# 用内置函数 len 作为 key：每个单词算一次长度，按长度排序
print(sorted(words, key=len))
# 输出：['pie', 'fig', 'apple', 'banana', 'cherry']
# 'pie' 和 'fig' 长度都是 3，相对顺序保持原样（稳定性）
```

为什么不支持直接对字符串比较长度？因为字符串默认的比较是字典序，不是长度。`key=len` 就是把每个元素"翻译"成它的长度，再排序。

**按字符串小写形式排序（忽略大小写）**

```python
names = ["banana", "Apple", "cherry", "avocado"]
print(sorted(names, key=str.lower))
# 输出：['Apple', 'avocado', 'banana', 'cherry']
# 'Apple' 和 'avocado' 的 lower 都是 'apple'/'avocado'，按字典序排，原相对顺序保留
```

**用 lambda 写复杂的 key**

当 key 逻辑稍复杂时，用 `lambda` 临时写一个匿名函数：

```python
students = [
    ("张三", 88),
    ("李四", 72),
    ("王五", 95),
    ("赵六", 80),
]
# 按分数排序（元组的第二项）
ranked = sorted(students, key=lambda s: s[1])
print(ranked)
# 输出：[('李四', 72), ('赵六', 80), ('张三', 88), ('王五', 95)]
```

`lambda s: s[1]` 接收一个元组 `s`，返回它的第二个元素。排序时实际比较的就是这些分数。

**按字典的某个键排序**

字典默认不可排序，也没有 `<` 比较，所以必须提供 key：

```python
people = [
    {"name": "张三", "age": 32},
    {"name": "李四", "age": 25},
    {"name": "王五", "age": 28},
]
# 按 age 升序
by_age = sorted(people, key=lambda p: p["age"])
print(by_age)
# 输出：
# [{'name': '李四', 'age': 25},
#  {'name': '王五', 'age': 28},
#  {'name': '张三', 'age': 32}]
```

这里 `lambda p: p["age"]` 把每个字典翻译成它的 `age` 值，再排序。

### 2.3.1 key 函数对每个元素只调用一次

这是 `key` 与 `cmp` 的本质差异，值得专门强调。`key` 函数对每个元素**只调用一次**，调用结果会被缓存下来反复用于比较；而老式的 `cmp(a, b)` 比较函数，在最坏情况下每次两两比较都要调用，排序过程中可能被调用 N·log N 次甚至更多。

```python
# 用一个带副作用的函数来验证 key 被调用次数
def make_key(x):
    make_key.count += 1
    return x % 10
make_key.count = 0

data = [23, 45, 12, 78, 34, 56, 89, 11, 67, 90]
sorted(data, key=make_key)
print(f"key 被调用 {make_key.count} 次，元素共 {len(data)} 个")
# 输出：key 被调用 10 次，元素共 10 个
```

无论列表有多长、排序中发生了多少次比较，key 函数的调用次数始终等于元素个数。这是 Schwartzian 变换的核心（原理章会讲）。

### 2.4 用 operator 模块替代 lambda

`operator` 模块提供了两个工厂函数，专门用于取代常见的 `lambda` key：

- `operator.itemgetter(*items)`：等价于 `lambda x: x[items]`，按下标或键取值，适合元素是序列或字典。
- `operator.attrgetter(*attrs)`：等价于 `lambda x: x.attr`，按属性名取值，适合元素是对象。

它们用 C 实现，比 lambda 略快，而且语义更明确。

**itemgetter：取下标或字典键**

```python
import operator

students = [
    ("张三", 88, 3),
    ("李四", 72, 1),
    ("王五", 95, 2),
    ("赵六", 80, 4),
]
# 按分数（下标 1）排序
by_score = sorted(students, key=operator.itemgetter(1))
print(by_score)
# 输出：[('李四', 72), ('赵六', 80), ('张三', 88), ('王五', 95)]

# itemgetter(1) 等价于 lambda s: s[1]
```

`itemgetter` 还能一次取多个下标，返回元组，正好用于多关键字排序（见 2.6）：

```python
# itemgetter 取多个下标 → 返回元组
g = operator.itemgetter(0, 1)
print(g(("张三", 88, 3)))   # 输出：('张三', 88)
```

**attrgetter：取对象属性**

```python
import operator

class Student:
    def __init__(self, name, score, age):
        self.name = name
        self.score = score
        self.age = age
    def __repr__(self):
        return f"Student({self.name}, score={self.score}, age={self.age})"

students = [
    Student("张三", 88, 20),
    Student("李四", 72, 19),
    Student("王五", 95, 21),
    Student("赵六", 88, 18),
]
# 按分数排序
by_score = sorted(students, key=operator.attrgetter("score"))
print(by_score)
# 输出：[Student(李四, score=72), Student(张三, score=88), Student(赵六, score=88), Student(王五, score=95)]
```

注意两个 88 分的同学，`张三` 在 `赵六` 前——这是因为稳定性（原顺序里张三在前），不是因为有任何额外规则。

**methodcaller：调用方法**

`operator.methodcaller` 能调用元素的方法，适合需要做转换的场景：

```python
import operator

words = ["Banana", "apple", "Cherry", "avocado"]
# 等价于 key=str.lower
print(sorted(words, key=operator.methodcaller("lower")))
# 输出：['apple', 'avocado', 'Banana', 'Cherry']
```

**lambda 还是 operator？**

不是所有场景都该用 `operator`。当逻辑简单且只取一个下标/属性时，`operator.itemgetter` / `attrgetter` 更清楚；但只要涉及计算（如 `x % 10`、`-x.age`、`len(x)` 的组合），还是 `lambda` 更直接。可读性优先，性能差异通常可忽略。

### 2.5 元组 key 实现多关键字排序

这是 `sorted` 最实用的进阶技巧。`key` 函数可以返回**元组**，元组在 Python 中是按字典序比较的——先比第一个元素，相等再比第二个，依此类推。这正好对应"先按主关键字排、主相同再按次关键字排"的多字段排序需求。

**场景：学生按成绩降序、成绩相同按姓名升序**

```python
students = [
    ("张三", 88),
    ("李四", 95),
    ("王五", 88),
    ("赵六", 95),
    ("钱七", 72),
]

# 想要：分数从高到低，分数相同按姓名从 A 到 Z
# 思路：key 返回元组，元组按字典序比较
# 分数降序 → 用负分数；姓名升序 → 直接用字符串
result = sorted(students, key=lambda s: (-s[1], s[0]))
print(result)
# 输出：
# [('李四', 95), ('赵六', 95), ('张三', 88), ('王五', 88), ('钱七', 72)]
```

说明一下这里为什么不直接用 `reverse=True`：

如果写 `sorted(students, key=lambda s: (s[1], s[0]), reverse=True)`，那么 `reverse=True` 会把**两个**字段方向都翻转——分数降序是对的，但姓名也会变成降序（从 Z 到 A），与想要的"姓名升序"正好相反。所以对"一个降一个升"的场景，标准技巧是：**对要降序的数值字段取负**，让整个 key 仍按升序走，避免反向干扰。

**为什么元组比较能实现多关键字**

元组比较的规则如下：

```python
print((1, 2) < (1, 3))      # 输出：True   —— 第一项相等，比第二项
print((1, 2) < (2, 0))      # 输出：True   —— 第一项 1 < 2，直接判定，不看第二项
print((1, 2) < (1, 2, 0))   # 输出：True   —— 前面的都相等，较短的元组更小
```

所以当你返回 `(主键, 次键, 三键)` 时，主键决定排序主干，主键相同才看次键。

**场景：商品按类别升序、类别相同按价格降序**

```python
products = [
    ("水果", "苹果", 5.5),
    ("水果", "香蕉", 3.2),
    ("饮料", "可乐", 4.0),
    ("水果", "葡萄", 8.8),
    ("饮料", "果汁", 12.0),
    ("饮料", "矿泉水", 2.0),
]

# 类别升序（字符串）；价格降序（数值取负）
# 注意：价格取负前要先确保它是数值类型
result = sorted(products, key=lambda p: (p[0], -p[2]))
for r in result:
    print(r)
# 输出：
# ('饮料', '果汁', 12.0)
# ('饮料', '可乐', 4.0)
# ('饮料', '矿泉水', 2.0)
# ('水果', '葡萄', 8.8)
# ('水果', '苹果', 5.5)
# ('水果', '香蕉', 3.2)
```

类别"饮料"字典序在前、"水果"在后；同一类别内按价格降序。

**字符串字段也想降序怎么办**

取负只对数值字段有效。对字符串字段没有 `-s` 这种操作。如果确实要对字符串降序、其他字段升序，又不能用一个 `reverse` 搞定时，有几个办法：

1. 排两轮：先按次要字段排一遍（升序），再按主要字段排一遍（升序 + reverse=True），利用稳定性把第一遍的方向"倒"过来。
2. 用 `functools.cmp_to_key`（见 2.8）写一个明确方向的比较函数。
3. 对字符串做映射使比较方向翻转（不容易维护，不推荐）。

**排两轮技巧示例**

```python
# 目标：按 category 升序，category 相同按 name 降序
data = [
    {"category": "A", "name": "x"},
    {"category": "A", "name": "y"},
    {"category": "B", "name": "z"},
    {"category": "B", "name": "w"},
]

# 先按次要字段 name 升序
step1 = sorted(data, key=lambda d: d["name"])
# 再按主要字段 category 升序，reverse=True 反转整体
# 注意：第一次 name 升序已经在，第二次稳定排序会把 category 相同的按"反过来看"算
# 这里 reverse=True 会反转整个结果，category 也会降序，需要调整思路
```

实际上排两轮的更清晰写法是：**先排最次要的关键字（方向正确），再排更主的关键字，最后排最主的关键字**。每一步都排序稳定，所以更早排好的相对顺序会被后面相同键时保留下来。但混用升降序时，排两轮 + reverse 很容易把自己绕晕，所以对"多字段且方向不同"的场景，`cmp_to_key` 反而是更不容易出错的选择。

### 2.6 多关键字排序的 itemgetter 写法

当所有字段都取升序（或都取降序）时，`itemgetter` 配合多下标是最简洁的：

```python
import operator

students = [
    ("张三", 88, 20),
    ("李四", 88, 19),
    ("王五", 95, 21),
    ("赵六", 88, 18),
]

# 全部升序：先按分数，分数相同按年龄
by_score_then_age = sorted(students, key=operator.itemgetter(1, 2))
print(by_score_then_age)
# 输出：
# [('赵六', 88, 18), ('李四', 88, 19), ('张三', 88, 20), ('王五', 95, 21)]
```

`itemgetter(1, 2)` 返回 `("分数", "年龄")` 这样一个元组，元组字典序比较天然实现多关键字。

如果字段都降序，加 `reverse=True` 即可：

```python
# 全部降序
print(sorted(students, key=operator.itemgetter(1, 2), reverse=True))
# 输出：
# [('王五', 95, 21), ('张三', 88, 20), ('李四', 88, 19), ('赵六', 88, 18)]
```

但一旦方向不一致（比如分数降序、年龄升序），就只能回到 lambda 配负数的写法：

```python
# 分数降序、年龄升序
result = sorted(students, key=lambda s: (-s[1], s[2]))
print(result)
# 输出：
# [('王五', 95, 21), ('赵六', 88, 18), ('李四', 88, 19), ('张三', 88, 20)]
```

### 2.7 按对象属性排序与 attrgetter 的多关键字

对象场景与字典/元组类似，只是把 `p["age"]` 换成 `p.age` 或 `attrgetter("age")`。多属性排序时，`attrgetter("score", "age")` 同样返回元组。

```python
import operator

class Student:
    def __init__(self, name, score, age):
        self.name = name
        self.score = score
        self.age = age
    def __repr__(self):
        return f"Student({self.name}, score={self.score}, age={self.age})"

students = [
    Student("张三", 88, 20),
    Student("李四", 88, 19),
    Student("王五", 95, 21),
    Student("赵六", 72, 22),
]

# 先按分数升序、再按年龄升序
print(sorted(students, key=operator.attrgetter("score", "age")))
# 输出：
# [Student(赵六, score=72, age=22),
#  Student(李四, score=88, age=19),
#  Student(张三, score=88, age=20),
#  Student(王五, score=95, age=21)]
```

**对象属性也支持点号嵌套**

`attrgetter` 支持点号的属性路径，比如 `attrgetter("address.city")`。当元素是嵌套对象时很方便：

```python
class Address:
    def __init__(self, city):
        self.city = city

class Person:
    def __init__(self, name, address):
        self.name = name
        self.address = address

people = [
    Person("张三", Address("北京")),
    Person("李四", Address("上海")),
    Person("王五", Address("广州")),
]

by_city = sorted(people, key=operator.attrgetter("address.city"))
print([p.name for p in by_city])
# 输出：['王五', '张三', '李四']
```

### 2.8 cmp_to_key：用老式比较函数

Python 3 移除了 `sorted` / `list.sort` 的 `cmp` 参数（Python 2 时代可以传 `cmp=lambda a, b: ...`）。这是因为基于比较的 `cmp` 函数性能差（每对比较都要调用一次），而且无法利用 Schwartzian 变换。但有些排序逻辑用 key 很难表达——比如"按某种自定义规则比较两个对象"，这时可以用 `functools.cmp_to_key` 把一个比较函数包装成 key 函数。

`cmp_to_key` 接受一个传统的两参数比较函数（返回负数/0/正数，分别表示 a<b、a==b、a>b），返回一个实现了所有比较协议的类实例，可以直接作为 `key` 传入。

```python
import functools

# 自定义比较：按"数位之和"比较两个数
def digit_sum_cmp(a, b):
    """按各位数字之和比较：和小的排在前"""
    sa = sum(int(c) for c in str(abs(a)))
    sb = sum(int(c) for c in str(abs(b)))
    return sa - sb   # 负数表示 a 在前

nums = [123, 4, 99, 111, 56, 1000]
result = sorted(nums, key=functools.cmp_to_key(digit_sum_cmp))
print(result)
# 输出：[1 的和 1, ...]
# 4 → 4；11 → 2；1000 → 1；123 → 6；56 → 11；99 → 18
# 所以排序后按数位和：1, 2, 4, 6, 11, 18 → [4, 111, 1000, 123, 56, 99]
print(result)   # 输出：[4, 111, 1000, 123, 56, 99]
```

**什么时候真的需要 cmp_to_key**

只在以下情况才考虑：

- 排序规则无法用"提取一个键"表达，只能用"比较两个对象"表达。例如某些体育比赛的对战积分规则、版本号比较、特殊优先级（`HIGH > MEDIUM > LOW`）。
- 从 Python 2 迁移过来的老代码，已经写好了 `cmp` 函数。

如果 key 能轻松表达，就别用 `cmp_to_key`，因为它的性能仍然不如纯 key（要在比较时反复调用包装后的逻辑）。

**版本号比较的经典例子**

版本号比较是 `cmp_to_key` 的典型场景，因为版本号是分段比较，不容易用纯 key 表达：

```python
import functools

def version_cmp(v1, v2):
    """比较两个版本号字符串，如 1.2.10 vs 1.2.3"""
    parts1 = [int(x) for x in v1.split(".")]
    parts2 = [int(x) for x in v2.split(".")]
    # 补齐到同长，用 0 填充
    for a, b in zip(parts1, parts2):
        if a != b:
            return a - b
    return len(parts1) - len(parts2)

versions = ["1.2.10", "1.10.0", "1.2.3", "2.0.0", "1.2.2"]
print(sorted(versions, key=functools.cmp_to_key(version_cmp)))
# 输出：['1.2.2', '1.2.3', '1.2.10', '1.10.0', '2.0.0']
```

这里纯字符串排序会把 `"1.10.0"` 排在 `"1.2.3"` 前面（因为 `"1" < "2"` 是按字符比较的，`"10"` 的 `"1"` 比 `"2"` 小），而数字比较则需要按数值比，所以必须自定义比较或把每段转成数字后用元组 key（后者其实更推荐）：

```python
# 用元组 key 实现版本号比较，比 cmp_to_key 更高效
# 但版本号长度不一时需要补 0，稍微多写一点
versions = ["1.2.10", "1.10.0", "1.2.3", "2.0.0", "1.2.2"]
# 把每段转 int，用元组比较；但要比 5 个版本，需要先算最大段数
max_len = max(v.count(".") for v in versions) + 1
print(sorted(versions, key=lambda v: [int(x) for x in (v.split(".") + ["0"] * max_len)[:max_len]]))
# 输出：['1.2.2', '1.2.3', '1.2.10', '1.10.0', '2.0.0']
```

这个对比也说明：很多时候 `cmp_to_key` 能用，但纯 key 能更优雅地解决——优先尝试纯 key。

### 2.9 稳定排序：相等键的元素保持原顺序

`sorted` 和 `list.sort` 都是**稳定排序**：当两个元素的排序键相等时，它们在结果中的相对顺序与原序列中的相对顺序一致。这是一条保证，而不是巧合，由 Python 的 Timsort 算法保证（原理章会讲为什么 Timsort 天然稳定）。

稳定性有什么用？最大的用处是**支持"多轮排序叠加"**：你可以先按次要字段排一遍，再按主要字段排一遍，最终结果是"先按主要字段，主要相同按次要字段"——因为第二轮稳定排序不会打乱第一轮已经排好的相对顺序。

```python
students = [
    ("张三", 88, 20),
    ("李四", 88, 19),
    ("王五", 95, 21),
    ("赵六", 88, 18),
]

# 目标：按分数升序，分数相同按年龄升序
# 方法一：一轮元组 key
# 方法二：两轮稳定排序
# 先按年龄排
step1 = sorted(students, key=lambda s: s[2])   # 年龄升序
# 再按分数排，稳定排序保证分数相同时保留 step1 的相对顺序
step2 = sorted(step1, key=lambda s: s[1])      # 分数升序
print(step2)
# 输出：
# [('赵六', 88, 18), ('李四', 88, 19), ('张三', 88, 20), ('王五', 95, 21)]
```

若排序不稳定，第二轮按分数排时，三个 88 分的同学相对顺序可能被打乱，年龄就没法保证升序了。一轮元组 key 也能做得对，这里只是为了演示稳定性的作用。

**稳定性让"按某字段降序、其余字段升序"变得可行**

对一组字段里"只想让主字段降序、其余字段保持升序"的场景，可以借助稳定性排两轮：

```python
# 目标：分数降序（仅主字段降序），分数相同保持原列表顺序
students = [
    ("张三", 88),
    ("李四", 95),
    ("王五", 88),
    ("赵六", 95),
]
# 单一轮次：用负分数做 key
print(sorted(students, key=lambda s: -s[1]))
# 输出：[('李四', 95), ('赵六', 95), ('张三', 88), ('王五', 88)]
# 这里李四和赵六分数相同，相对顺序保留（李四在赵六前）
```

### 2.10 混合类型与可比较性

`sorted` 默认用元素本身的 `<` 比较。如果元素类型不支持互相比较，就会抛出 `TypeError`。最常见的两类坑：

1. **字符串数字与整数混排**：`["1", 2, "11", 1]` 不能直接排，因为字符串和整数之间没有 `<`。
2. **字符串形式的数字按字符串排序**：`["2", "10", "1"]` 排完是 `["1", "10", "2"]`，而不是数值序 `["1", "2", "10"]`。

```python
# 字符串数字按字符串序排
str_nums = ["2", "10", "1", "21"]
print(sorted(str_nums))
# 输出：['1', '10', '2', '21']  —— 字典序，不是数值序

# 想按数值序：key=int
print(sorted(str_nums, key=int))
# 输出：['1', '2', '10', '21']
```

`key=int` 把每个字符串先转成整数再比较，但返回的还是原字符串，所以排序结果是字符串形式的数字、按数值序排列。

**字符串数字与整数混合**

```python
mixed = ["10", 2, "1", 11]
# 直接排会报错：'<' not supported between instances of 'int' and 'str'
# sorted(mixed)   # TypeError

# 用 key=str 统一成字符串比较
print(sorted(mixed, key=str))
# 输出：['1', 2, '10', 11]
# 注意：str(2) 是 "2"，"2" < "10" 为 False，所以 2 排在 10 后
```

这个结果可能不符合直觉——因为 `str(2)` 是 `"2"`，按字典序 `"10" < "2"`（首字符 `"1"` < `"2"`），所以 `"10"` 排在前。如果想要真正的数值序，先把所有元素统一成整数：

```python
print(sorted(mixed, key=lambda x: int(x)))
# 输出：['1', 2, '10', 11]
```

这下顺序对了：1、2、10、11。

**None 与整数混排**

```python
data = [3, None, 1, None, 2]
# 直接排会报错：'<' not supported between 'int' and 'NoneType'
# sorted(data)   # TypeError

# 把 None 当成一个极小值
print(sorted(data, key=lambda x: (x is None, x)))
# 输出：[1, 2, 3, None, None]
# 思路：先按"是不是 None"排（False=0 在前），再按值排
# None 和 None 比较 x 时还会 TypeError，但稳定性保证不会真去比较两个 None
```

这里利用了稳定性：`(True, None)` 与 `(True, None)` 两个键的"第一项"都是 `True`，要进入第二项比较就会触发 `None < None` 的 TypeError——但 Python 的元组比较在第一项相等时才会比第二项，比 `None < None` 会报错。所以更稳妥的做法是把 None 映射成一个具体值：

```python
print(sorted(data, key=lambda x: (1, 0) if x is None else (0, x)))
# 输出：[1, 2, 3, None, None]
# 第一项 0/1 决定 None 排在最后；非 None 时第二项是数字，可比较
# None 时第二项补 0（任意常量都行，因为不会拿来比较两个 None 之外的对象）
```

实际上更简洁的常用写法是用 `float("-inf")` 把 None 当成极小值（或 `float("inf")` 排最后）：

```python
print(sorted(data, key=lambda x: float("-inf") if x is None else x))
# 输出：[None, None, 1, 2, 3]  —— None 排最前

print(sorted(data, key=lambda x: float("inf") if x is None else x))
# 输出：[1, 2, 3, None, None]  —— None 排最后
```

### 2.11 对任意可迭代对象排序

`sorted` 的第一个参数是 `iterable`，所以传字符串、字典、集合、生成器都可以。结果统一是列表。

**字符串**：按字符排序，结果是单字符字符串的列表：

```python
print(sorted("python"))
# 输出：['h', 'n', 'o', 'p', 't', 'y']
```

**字典**：默认按 key 迭代，所以 `sorted(d)` 是对键排序：

```python
scores = {"语文": 88, "数学": 95, "英语": 80}
print(sorted(scores))
# 输出：['数学', '英语', '语文']   —— 按 key 的字典序
print(sorted(scores, key=scores.get))
# 输出：['英语', '语文', '数学']   —— 按值排序，返回的是键
```

`scores.get` 作为 key 函数：对每个键调用 `scores.get(键)`，返回它的值。排序时按值比较，结果还是键的列表。

**集合**：无序，排完变有序列表：

```python
print(sorted({3, 1, 4, 1, 5, 9, 2, 6}))
# 输出：[1, 2, 3, 4, 5, 6, 9]
```

**生成器**：流式输入也能排，但 `sorted` 会先把整个迭代器取完（要全部入内存才能排序）：

```python
gen = (x * 2 for x in [3, 1, 4, 1, 5])
print(sorted(gen))
# 输出：[2, 2, 6, 8, 10]
```

### 2.12 按多个字段排序的典型场景

**场景一：学生成绩单多级排序**

需求：先按总分降序；总分相同按数学降序；再相同按语文降序；再相同按姓名升序。

```python
students = [
    {"name": "张三", "math": 80, "chinese": 70, "english": 90},
    {"name": "李四", "math": 80, "chinese": 70, "english": 90},
    {"name": "王五", "math": 90, "chinese": 60, "english": 60},
    {"name": "赵六", "math": 80, "chinese": 90, "english": 70},
]

def total(s):
    return s["math"] + s["chinese"] + s["english"]

# 总分、数学、语文都是降序（取负），姓名是升序
result = sorted(students, key=lambda s: (-total(s), -s["math"], -s["chinese"], s["name"]))
for s in result:
    print(s["name"], total(s), s["math"], s["chinese"])
# 输出：
# 李四 240 80 70
# 张三 240 80 70
# 赵六 240 80 90
# 王五 210 90 60
```

注意张三和李四所有分数都一样，最后按姓名升序，"李四" < "张三"（按拼音的字典序，取决于编码和具体字符），所以李四在前。这里 `repr` 的输出顺序依赖于字典的实现；实际比较的是字符串字符的码点。

**场景二：日志按时间倒序取 top N**

```python
import datetime

logs = [
    {"time": datetime.datetime(2024, 1, 1, 10, 0), "level": "INFO", "msg": "启动"},
    {"time": datetime.datetime(2024, 1, 1, 10, 5), "level": "ERROR", "msg": "超时"},
    {"time": datetime.datetime(2024, 1, 1, 9, 30), "level": "WARN", "msg": "内存高"},
    {"time": datetime.datetime(2024, 1, 1, 11, 0), "level": "ERROR", "msg": "断连"},
]

# 时间倒序（最新在前），取最近 2 条
recent = sorted(logs, key=lambda r: r["time"], reverse=True)[:2]
for r in recent:
    print(r["time"], r["level"], r["msg"])
# 输出：
# 2024-01-01 11:00:00 ERROR 断连
# 2024-01-01 10:05:00 ERROR 超时
```

`datetime` 对象本身支持 `<`，所以不需要额外转换，直接当 key 用。

**场景三：分组后排序——分组的稳定排序实现**

需求：学生按班级分组，每组内按成绩降序，但组与组之间保持班级 A、B、C 的出现顺序。利用稳定性，先按成绩排，再按班级稳定排：

```python
students = [
    ("A班", "张三", 88),
    ("B班", "李四", 72),
    ("A班", "王五", 95),
    ("B班", "赵六", 85),
    ("A班", "钱七", 70),
    ("B班", "孙八", 90),
]

# 先按成绩降序
step1 = sorted(students, key=lambda s: s[2], reverse=True)
# 再按班级稳定排（班级相同的元素，相对顺序保留 step1 的降序）
step2 = sorted(step1, key=lambda s: s[0])
for s in step2:
    print(s)
# 输出：
# ('A班', '王五', 95)
# ('A班', '张三', 88)
# ('A班', '钱七', 70)
# ('B班', '孙八', 90)
# ('B班', '赵六', 85)
# ('B班', '李四', 72)
```

每班内按成绩降序，班与班之间保持 A 班在前 B 班在后，正是稳定排序带来的好处。如果排序不稳定，第二轮按班级整理时就会打乱第一轮的顺序。

**场景四：字典按值排序后转回原字典**

排序字典本身不保留顺序（在 3.7+ 字典有序，但说"字典按值排序"通常希望得到一个新的有序结果）。最常见写法：

```python
scores = {"语文": 88, "数学": 95, "英语": 80, "物理": 95}

# 按 value 降序，value 相同按 key 升序
ordered = dict(sorted(scores.items(), key=lambda kv: (-kv[1], kv[0])))
print(ordered)
# 输出：{'数学': 95, '物理': 95, '语文': 88, '英语': 80}
```

`scores.items()` 返回 `(key, value)` 元组，`kv[1]` 是 value、`kv[0]` 是 key。`dict(...)` 把排好序的键值对列表重新组装成字典（Python 3.7+ 字典保持插入顺序）。

### 2.13 sort 与 sorted 的细节差异再回顾

把前面散落的差异集中一下，方便查阅：

| 维度 | `sorted(iterable)` | `list.sort()` |
|------|--------------------|---------------|
| 作用对象 | 任意可迭代对象 | 仅 list |
| 是否修改原对象 | 否（返回新列表） | 是（原地） |
| 返回值 | 新列表 | `None` |
| 链式调用 | 支持（`sorted(x)[:5]`） | 不支持（返回 None） |
| 内存 | 需要分配结果列表 | 不额外分配 |
| 参数 | `key`, `reverse` | `key`, `reverse` |

```python
# sorted 接受任意可迭代对象，包括 range
print(sorted(range(10, 0, -1)))
# 输出：[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

# list.sort 只能对 list
nums = [3, 1, 2]
nums.sort()
print(nums)   # 输出：[1, 2, 3]

# 元组没有 sort 方法
t = (3, 1, 2)
# t.sort()   # AttributeError: 'tuple' object has no attribute 'sort'
print(sorted(t))   # 输出：[1, 2, 3]
```

## 3. 最佳实践

### 3.1 优先 key 而非 cmp，优先纯 key 而非 cmp_to_key

Python 3 已经移除了 `cmp` 参数，把"排序逻辑"表达为 key 函数是首选。`cmp_to_key` 是兼容老代码或特殊逻辑的兜底方案，不要动不动就上——它比纯 key 慢（每次比较都要走 Python 层的比较函数），也更难读。

```python
# 不推荐：能用 key 表达却用 cmp_to_key
import functools
nums = [3, 1, 4, 1, 5]
sorted(nums, key=functools.cmp_to_key(lambda a, b: a - b))   # 多此一举

# 推荐：直接写
sorted(nums)
```

### 3.2 key 函数保持简单

key 函数会被对每个元素调用一次，所以它应该是轻量的。复杂的 key 逻辑会拖慢排序：

```python
# 不推荐：key 里做了大量计算
data = list(range(1000))
sorted(data, key=lambda x: sum(int(d) for d in str(x ** 2)))
# 每个元素都要算平方、转字符串、求和，排序代价高

# 推荐：预计算 + 缓存
key_map = {x: sum(int(d) for d in str(x ** 2)) for x in data}
sorted(data, key=key_map.get)
# 同样对每个元素算一次，但把计算从 lambda 内部抽出来，便于看清复杂度
```

如果 key 计算昂贵且元素很多，可以预先把 `(key, element)` 排好序后再取回 element（手写 Schwartzian 变换）——但日常用 `sorted(key=...)` 已足够，C 实现的 key 缓存已经很高效。

### 3.3 用 itemgetter / attrgetter 提升可读性

简单的取下标、取属性用 `operator` 模块语义更清楚：

```python
# 不推荐：lambda 表达"按下标取"
sorted(students, key=lambda s: s[1])

# 推荐：itemgetter
import operator
sorted(students, key=operator.itemgetter(1))
```

但一旦涉及计算（`-s[1]`、`s[1] * 2 + s[0]`），就用 lambda；不要为了避免 lambda 而绕弯路。

### 3.4 不要忘记 sorted 返回新列表、sort 返回 None

新手最常踩的两个坑：

```python
# 坑 1：以为 sort 返回了新列表
nums = [3, 1, 2]
new = nums.sort()
print(new)         # 输出：None
print(new[0])      # 报错：NoneType is not subscriptable

# 坑 2：以为 sorted 修改了原列表
nums = [3, 1, 2]
sorted(nums)
print(nums)        # 输出：[3, 1, 2]  —— 原列表未变
```

**推荐写法**：

```python
# 想要新列表就用 sorted
new = sorted(nums)
# 想要原地就别接返回值
nums.sort()
```

### 3.5 多字段方向不一致时，优先用负数而非 reverse

`reverse=True` 是整体反转，不能区分"主字段降、次字段升"。混排方向时，对数值字段取负更直接：

```python
# 不推荐：主降次升想用 reverse，但分不开
# sorted(data, key=lambda d: (d["score"], d["name"]), reverse=True)
# 这样 name 也会被反转成降序，不是我想要的

# 推荐：对要降序的数值取负
sorted(data, key=lambda d: (-d["score"], d["name"]))
```

对字符串字段需要降序时，考虑用 `cmp_to_key` 或排两轮的稳定性技巧（见 2.5、2.9）。

### 3.6 注意 key 函数返回值的类型一致性

key 函数对不同元素返回的类型必须可互相比较，否则会 TypeError：

```python
# 错误：key 有时返回 int，有时返回 str
data = [{"v": 1}, {"v": "a"}]
# sorted(data, key=lambda d: d["v"])   # TypeError: '<' not supported between 'int' and 'str'

# 修正：统一成字符串
sorted(data, key=lambda d: str(d["v"]))
```

### 3.7 处理 None 值的方式不要触发比较

含 None 的列表排序时，None 之间不能比较，要避免两个 None 进入比较：

```python
data = [3, None, 1, None, 2]

# 推荐：把 None 映射成极值，避免它参与比较
sorted(data, key=lambda x: float("inf") if x is None else x)
# 输出：[1, 2, 3, None, None]
```

### 3.8 性能预估

`sorted` 的时间复杂度是 O(N log N)，空间复杂度 O(N)（要存结果列表）。`list.sort` 时间 O(N log N)，空间 O(1)（原地，但 Timsort 临时空间最坏 O(N/2)）。对几万到几十万级别的数据，`sorted` 都很快，不需要纠结。百万级以上、内存敏感时再考虑 `list.sort`。

Timsort 在"已部分有序"的数据上表现尤其好，可以接近 O(N)。所以如果你的数据已经是近乎有序的（比如追加几个新元素到已排好序的列表），`list.sort()` 重新排序非常便宜。

### 3.9 不要在 key 里做有副作用的操作

key 函数应该是纯函数——只读输入、返回键，不修改外部状态。在 key 里修改原数据是危险且难以预测的：

```python
# 不推荐：key 里改了原列表
data = [{"v": 3}, {"v": 1}, {"v": 2}]
# sorted(data, key=lambda d: d.pop("v"))   # 把 v 弹出来了，原字典被破坏

# 推荐：key 只读
sorted(data, key=lambda d: d["v"])
```

## 4. 原理

### 4.1 Timsort：Python 的稳定排序算法

`sorted` 和 `list.sort` 都用 **Timsort** 算法，由 Tim Peters 在 2002 年为 Python 设计。Timsort 是一种混合排序算法，结合了归并排序和插入排序，最关键的特点是**稳定**和**对真实数据高效**。

Timsort 的核心思想是：**现实世界的数据通常已经部分有序**，而不是完全随机的。算法会扫描序列，找出已经有序的连续片段（称为 "run"）：

- 升序的片段直接作为一个 run。
- 降序的片段被识别后反转成一个升序 run（因为是"识别后整体反转"，不是两两交换，所以反转后相同元素的相对顺序保持不变——这就是 Timsort 稳定的关键之一）。
- 太短的片段（长度小于一个阈值 minrun，通常 32~64）用二分插入排序补长。

然后把得到的这些 run 用归并排序合并起来。归并排序本身是稳定的，合并两个 run 时遇到相等的元素总是取左边 run 的先，从而保证稳定性贯穿整个排序。

**复杂度**

- 最好情况 O(N)：数据已经有序时，Timsort 只需一次扫描就识别出整个序列是一个 run，没有合并工作。
- 平均情况 O(N log N)。
- 最坏情况 O(N log N)：数据完全随机，需要更多合并工作。
- 空间：最坏 O(N/2) 的临时存储（用于归并），不是原地 O(1)。但 `list.sort` 会在原列表上写入结果，所以从用户视角仍是"原地"。

**为什么 Timsort 稳定**

关键有两个机制：

1. 识别降序 run 后整体反转（而非两两交换），保留相等元素的相对顺序。
2. 归并时对相等的键，总是先消费左侧 run 的元素。

这两点共同保证了：排序前 A 排在 B 前且 A、B 键相等时，排序后 A 仍在 B 前。

```python
# 验证稳定性
data = [(1, "a"), (2, "b"), (1, "c"), (2, "d"), (1, "e")]
result = sorted(data, key=lambda x: x[0])
print(result)
# 输出：[(1, 'a'), (1, 'c'), (1, 'e'), (2, 'b'), (2, 'd')]
# 键为 1 的三个元素 'a','c','e' 相对顺序保留；键为 2 的 'b','d' 顺序也保留
```

### 4.2 Schwartzian 变换：key 缓存为何比 cmp 快

Python 2 时代，`sorted` 支持 `cmp` 参数，传一个两两比较函数。这种方式的性能问题在于：排序过程中，比较次数是 O(N log N) 量级，每次比较都要调用一次 Python 层的 `cmp` 函数，函数调用开销巨大。

`key` 参数采用了一种被称为 **Schwartzian 变换**（Schwartzian transform）的技巧，得名于 Perl 黑客 Randal Schwartz。思路分三步：

1. **Decorate**：遍历一次所有元素，对每个元素 `x` 调用一次 `key(x)`，构造出 `(key(x), x)` 这样的"装饰"列表。
2. **Sort**：对装饰后的列表排序，此时比较的是元组的第一项 key。因为 key 已经预先算好，比较时不再调用 Python 函数，直接走 C 层的元组比较。
3. **Undecorate**：从排好序的装饰列表里取回原始元素，丢弃 key。

在 Python 的 C 实现里，这三步是合并在一起做的：`sorted` 先建一个 `PyObject*` 数组，每个槽位存 (key, 原元素) 的包装对象；排序比较两个槽位时只比 key；最后把原元素按新顺序拷到结果列表。整个过程 key 函数被调用 N 次（N 是元素个数），比较次数虽然是 O(N log N)，但每次比较只是 C 层的指针/元组比较，不涉及 Python 函数调用。

对比：

- `cmp` 模式：O(N log N) 次 Python 函数调用。
- `key` 模式：N 次 Python 函数调用 + O(N log N) 次 C 层比较。

Python 函数调用比 C 层比较慢一两个数量级，所以 `key` 模式通常快得多，尤其是 N 大、key 函数本身不便宜的情况下。

```python
# 用计数器验证 key 的调用次数
class Trace:
    def __init__(self, n):
        self.data = list(range(n, 0, -1))
    def __iter__(self):
        return iter(self.data)

calls = 0
def key_fn(x):
    global calls
    calls += 1
    return x

Trace(1000)
data = list(range(1000, 0, -1))
sorted(data, key=key_fn)
print(f"元素 1000 个，key 调用 {calls} 次")
# 输出：元素 1000 个，key 调用 1000 次
# 无论排序中发生了多少次比较，key 调用次数恒等于元素个数
```

这个恒定的 N 次调用，就是 Schwartzian 变换带来的性能保证。

### 4.3 为什么 Python 3 移除了 cmp 参数

Python 3 在 `sorted` 和 `list.sort` 上移除了 `cmp` 参数，原因有三：

1. **性能**：`cmp` 模式慢于 `key` 模式，因为要 O(N log N) 次 Python 函数调用。`key` 模式只需 N 次调用，其余比较在 C 层完成。
2. **可读性**：`key` 表达的是"每个元素的排序代表值"，语义更直观；`cmp` 表达的是"两个元素的相对大小关系"，要脑补全局排序逻辑。
3. **稳定性**：`key` 模式与 Timsort 的稳定性天然兼容；`cmp` 模式如果实现不当（例如比较函数没正确返回 0），可能破坏稳定性保证。

对于确实需要自定义比较逻辑的场景，Python 3 提供了 `functools.cmp_to_key` 作为桥梁——它把 `cmp` 函数包装成一个支持所有比较运算的对象（重载了 `__lt__`、`__eq__` 等魔术方法），使其能作为 `key` 传入。但 `cmp_to_key` 内部仍然会在比较时调用原始的 cmp 函数（所以仍是 O(N log N) 次 Python 函数调用），性能不如纯 key。它只是兼容方案，不是推荐写法。

```python
import functools

# cmp_to_key 的内部原理示意（非真实实现）
# 它返回一个类的实例，该类定义了 __lt__ 等方法，方法内调用原始 cmp
class _CmpToKeyWrapper:
    def __init__(self, value, cmp):
        self.value = value
        self.cmp = cmp
    def __lt__(self, other):
        return self.cmp(self.value, other.value) < 0
    def __eq__(self, other):
        return self.cmp(self.value, other.value) == 0

def my_cmp(a, b):
    return a - b

# sorted 内部对每个元素构造 wrapper（调用一次 cmp_to_key 工厂），
# 然后在比较两个 wrapper 时调用 my_cmp 一次。
# 所以 cmp 函数仍会被调用 O(N log N) 次。
```

这也解释了为什么 `cmp_to_key` 比纯 key 慢——它没有真正把"两两比较"转换成"单次映射"，只是把比较协议包装了一层，调用次数没变。

### 4.4 key 返回元组时，元组比较如何工作

当 `key` 函数返回元组时，元组之间的比较按字典序：逐项比较，遇到第一对不相等的项就返回那对的大小关系；如果所有对应项都相等，则长度短的更小；长度也相同则相等。

```python
# 元组比较规则
print((1, 2) < (1, 3))        # True：第一项相等，比第二项 2 < 3
print((1, 2) < (2, 1))        # True：第一项 1 < 2，直接返回
print((1, 2) < (1, 2))        # False：全部相等
print((1, 2) < (1, 2, 0))     # True：对应项都相等，长度短的更小
```

元组比较是在 C 层完成的，非常快。所以"返回元组实现多关键字排序"不仅语义清晰，性能也几乎和单字段排序一样好——只是每个元素的 key 存储多几个字段的指针而已。

利用元组比较的字典序特性，可以巧妙地表达"先按主字段、再按次字段"的排序：把主字段放在元组第一项，次字段放第二项。主字段相等时（比较到第一项就停不下来），自然进入第二项的比较。

**对数值字段做降序的技巧**

元组比较天然是升序的，要实现"某字段降序"，对整数/浮点字段取负是最简单的（`-s[1]`）。对字符串字段没有 `-s` 这种操作，所以多字段方向混合且含字符串降序时，才需要排两轮或 `cmp_to_key`。

### 4.5 稳定排序让多轮排序叠加可行

Timsort 的稳定性带来一个重要的工程价值：**复杂的排序需求可以通过几轮简单排序叠加实现**，而不必用一个复杂的 key 函数。

例如"按班级分组、组内按成绩降序"，可以：

1. 先按成绩降序排一轮。
2. 再按班级稳定排一轮。

因为第二轮稳定，班级相同的元素会保留第一轮的相对顺序（按成绩降序）。这种思路在古老的"卡片排序机"上很常见——多关键字排序就是一轮一轮排出来的。

如果排序不稳定，第二轮就会把第一轮的顺序打乱，这种"分轮排"的技巧就失效了。所以稳定性不仅是"相同元素顺序不变"这种表面性质，更是"多轮排序可组合"的工程保证。

### 4.6 key 函数的缓存实现细节

在 CPython 的 C 实现中，`sorted`（`bltinmodule.c` 的 `builtin_sorted`）和 `list.sort`（`listobject.c` 的 `listsort_impl`）对 key 的处理略有不同：

- `list.sort`：直接在原列表上建立"keys 数组"，每个槽位存 key 对象。排序比较时只比 keys，排序完成后把原列表元素按 key 的顺序重排。这避免了反复调用 key 函数。
- `sorted`：先把可迭代对象转成列表，再走和 `list.sort` 类似的流程，最后把排好的元素拷到新列表返回。

两种实现都保证 key 函数对每个元素只调用一次。这也是为什么我们能在前面用计数器验证"key 调用次数等于元素个数"。

## 5. 总结

### 5.1 本文内容要点

- `sorted(iterable, *, key=None, reverse=False)` 返回新列表，不修改原对象；`list.sort(key=None, reverse=False)` 原地排序，返回 `None`。
- `key` 是仅关键字参数，接受单参数函数，对每个元素**只调用一次**，返回的值用作排序键。
- `reverse=True` 整体反转为降序，性能与升序一致。
- `key` 返回元组时，按元组字典序比较，天然实现多关键字排序；对数值字段取负可实现"主降次升"。
- `operator.itemgetter` 取下标/字典键、`operator.attrgetter` 取对象属性，比 lambda 更直观且略快。
- `sorted` 是稳定排序，相等键的元素保持原相对顺序，使"多轮排序叠加"可行。
- Python 3 移除了 `cmp` 参数，老式比较函数须用 `functools.cmp_to_key` 包装；能用 key 表达的就不要用 cmp_to_key。
- 混合类型排序要保证 key 返回值可比较；字符串数字按数值序需 `key=int`；含 None 的列表把 None 映射成极值。
- 底层用 Timsort 算法：稳定、对部分有序数据高效、最坏 O(N log N)；key 缓存基于 Schwartzian 变换，比 cmp 模式的 O(N log N) 次 Python 调用快得多。

### 5.2 读完应能掌握

- 在 `sorted` 与 `list.sort` 之间做正确取舍，并说明返回值差异。
- 用 `key` 对字符串、字典、对象、元组按任意字段排序。
- 用元组 key 实现多关键字排序，并正确处理"主降次升"的字段方向。
- 用 `itemgetter` / `attrgetter` 写出更清晰的 key。
- 判断何时必须用 `cmp_to_key`，何时纯 key 更合适。
- 说明稳定排序的含义，并用多轮排序技巧实现分组后排序。
- 处理混合类型、None 值、字符串数字等常见排序坑。
- 说明 Timsort 的稳定性来源、key 模式比 cmp 快的原因（Schwartzian 变换）、Python 3 移除 cmp 参数的动机。