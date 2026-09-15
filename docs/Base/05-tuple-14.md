---
group:
  title: 【05】元组介绍
  order: 6
order: 14
title: 元组常用技巧与惯用法
nav:
  title: Python基础
  order: 1
---

# 元组常用技巧与惯用法

## 1. 介绍

### 1.1 什么是元组的惯用法

惯用法（idiom）是指一门编程语言中被广泛使用的、符合该语言特有风格的代码写法。就像自然语言中的"惯用表达"一样，掌握了惯用法，你写的代码就不再是"能跑的翻译体"，而是地道的"Pythonic"代码。

元组是 Python 中最具特色的内置类型之一。它的不可变性、解包能力和可哈希性，使得元组在许多场景下有着列表无法替代的惯用法。比如函数返回多个值、变量交换、多关键字排序——这些都是元组的拿手好戏。

打个比方：如果你只用元组来"存几个值"，那就像买了一部智能手机却只用来打电话。元组的真正价值在于它参与的那些惯用模式——这些模式让代码更简洁、更可读、更高效。

### 1.2 为什么掌握惯用法很重要

惯用法的价值体现在三个方面：

- **简洁性**：用一行元组解包替代五行的临时变量交换
- **可读性**：`return (passed, message)` 比 `return {"passed": passed, "message": message}` 更直观
- **性能**：元组的创建速度和内存占用优于列表和字典，在小数据场景下优势明显

### 1.3 最简示例

先看几个最能体现元组惯用法威力的例子：

```python
# 惯用法一：一行交换两个变量（底层是元组打包 + 解包）
a, b = 10, 20
a, b = b, a
print(a, b)  # 20 10

# 惯用法二：函数返回多个值
def min_max(numbers):
    return (min(numbers), max(numbers))

lowest, highest = min_max([3, 1, 4, 1, 5, 9, 2, 6])
print(f"最低: {lowest}, 最高: {highest}")  # 最低: 1, 最高: 9

# 惯用法三：多关键字排序（元组自动逐元素比较）
students = [("张三", 85, 92), ("李四", 85, 78), ("王五", 92, 88)]
by_subject = sorted(students, key=lambda s: (-s[1], -s[2]))  # 语文降序→数学降序
for s in by_subject:
    print(s)
```

**运行结果**：

```text
20 10
最低: 1, 最高: 9
('王五', 92, 88)
('张三', 85, 92)
('李四', 85, 78)
```

这三个例子分别展示了元组的三个核心惯用能力：解包赋值、多返回值打包、元组比较排序。下面逐个深入讲解。

## 2. 核心内容

### 2.1 多返回值——元组最经典的惯用法

#### 2.1.1 基本用法

Python 函数返回多个值时，底层返回的就是一个元组。这是元组最常见、最有价值的惯用法。`return a, b, c` 本质上等价于 `return (a, b, c)`，Python 自动将多个返回值打包成元组。

```python
def divide(a, b):
    """返回商和余数"""
    return (a // b, a % b)

# 调用方用元组解包接收
quotient, remainder = divide(17, 5)
print(f"17 ÷ 5 = 商 {quotient}, 余 {remainder}")

# 不用解包，直接拿到元组
result = divide(17, 5)
print(f"结果元组: {result}")  # (3, 2)
```

**运行结果**：

```text
17 ÷ 5 = 商 3, 余 2
结果元组: (3, 2)
```

括号可以省略——`return a, b, c` 和 `return (a, b, c)` 完全等价。但加上括号的可读性更好，特别是返回值多的时候。

#### 2.1.2 实际应用场景

多返回值在实际开发中非常常见。标准库就大量使用了这一惯用法：

```python
# 场景一：查询数据库返回用户信息
def get_user_info(user_id):
    # 模拟数据库查询
    return "张三", 25, "工程师"

name, age, title = get_user_info(1001)
print(f"用户: {name}, 年龄: {age}, 职位: {title}")

# 场景二：路径分割——os.path.split 的设计
import os
dir_name, file_name = os.path.split("/home/user/docs/readme.txt")
print(f"目录: {dir_name}, 文件: {file_name}")

# 场景三：divmod——同时返回商和余数
q, r = divmod(100, 7)
print(f"100 ÷ 7 = {q} 余 {r}")
```

**运行结果**：

```text
用户: 张三, 年龄: 25, 职位: 工程师
目录: /home/user/docs, 文件: readme.txt
100 ÷ 7 = 14 余 2
```

对比其他语言的做法：C 语言需要通过指针参数返回多个值，Java 需要创建一个包含多个字段的对象。Python 用元组一行搞定，这就是惯用法的力量。

#### 2.1.3 条件返回——用元组简化 if-else

当函数需要根据条件返回"状态 + 消息"时，元组让代码非常简洁：

```python
# 用元组返回 (布尔状态, 描述信息)
def is_pass(score):
    return (True, "及格") if score >= 60 else (False, "不及格")

passed, message = is_pass(75)
print(f"成绩 75: {passed}, {message}")

passed, message = is_pass(45)
print(f"成绩 45: {passed}, {message}")
```

**运行结果**：

```text
成绩 75: True, 及格
成绩 45: False, 不及格
```

### 2.2 变量交换——Python 独有的优雅写法

#### 2.2.1 基本用法

在大多数语言中，交换两个变量需要引入临时变量。Python 用元组的打包和解包一步到位：

```python
a, b = 10, 20
print(f"交换前: a={a}, b={b}")
a, b = b, a  # 右边 b, a 先打包成元组 (20, 10)，左边再解包
print(f"交换后: a={a}, b={b}")
```

**运行结果**：

```text
交换前: a=10, b=20
交换后: a=20, b=10
```

`a, b = b, a` 的执行过程分两步：

1. **右边先求值**：`b, a` 被打包成元组 `(20, 10)`
2. **左边再解包**：元组 `(20, 10)` 被解包，20 赋给 `a`，10 赋给 `b`

整个过程中，右边的值在赋值开始前就已经全部确定，所以不会出现中间状态不一致的问题。

#### 2.2.2 多变量交换

同样适用于三个或更多变量：

```python
x, y, z = 1, 2, 3
print(f"交换前: x={x}, y={y}, z={z}")
x, y, z = z, x, y  # 循环交换
print(f"交换后: x={x}, y={y}, z={z}")
# x=3, y=1, z=2
```

**运行结果**：

```text
交换前: x=1, y=2, z=3
交换后: x=3, y=1, z=2
```

#### 2.2.3 元素交换——排序算法中的应用

在实现排序算法时，变量交换是最频繁的操作。Python 的元组交换让代码极其简洁：

```python
def bubble_sort(lst):
    n = len(lst)
    for i in range(n - 1):
        for j in range(n - 1 - i):
            if lst[j] > lst[j + 1]:
                lst[j], lst[j + 1] = lst[j + 1], lst[j]  # 一行交换
    return lst

numbers = [64, 34, 25, 12, 22, 11, 90]
print(f"排序前: {numbers}")
print(f"排序后: {bubble_sort(numbers)}")
```

**运行结果**：

```text
排序前: [64, 34, 25, 12, 22, 11, 90]
排序后: [11, 12, 22, 25, 34, 64, 90]
```

### 2.3 星号解包——灵活分配元素

#### 2.3.1 基本用法

星号表达式（`*`）让元组解包更加灵活——用 `*变量名` 收集剩余元素到列表：

```python
# 取首尾，中间收集
first, *middle, last = (10, 20, 30, 40, 50)
print(f"首: {first}, 中: {middle}, 尾: {last}")
# 首: 10, 中: [20, 30, 40], 尾: 50

# 只取第一个，其余收集
first, *rest = (10, 20, 30, 40, 50)
print(f"首: {first}, 其余: {rest}")
# 首: 10, 其余: [20, 30, 40, 50]
```

**运行结果**：

```text
首: 10, 中: [20, 30, 40], 尾: 50
首: 10, 其余: [20, 30, 40, 50]
```

注意：`*middle` 收集到的是**列表**而非元组。这是 Python 3 的设计决定——收集结果应该是可变的。

#### 2.3.2 丢弃不需要的值

当只关心部分返回值时，用 `*` 配合下划线 `_` 丢弃不需要的值：

```python
# 只关心首尾，中间不要
first, *_, last = (10, 20, 30, 40, 50)
print(f"首: {first}, 尾: {last}")

# 只关心中间值
*_, middle, _ = range(10)  # 这个写法不对，需要明确
# 更常见的用法：丢弃函数返回值中的某些部分
_, important, _ = ("debug_info", "核心数据", "trace_info")
print(f"核心数据: {important}")
```

**运行结果**：

```text
首: 10, 尾: 50
核心数据: 核心数据
```

#### 2.3.3 函数返回值的部分接收

当一个函数返回多个值，但你只需要其中一部分时，星号解包非常方便：

```python
def get_stats(scores):
    """返回最低分、最高分和所有中间分"""
    sorted_scores = sorted(scores)
    return sorted_scores[0], sorted_scores[-1], sorted_scores[1:-1]

# 只关心最高分和最低分，中间分数丢弃
lowest, highest, *_ = get_stats([88, 92, 75, 100, 63, 85])
print(f"最低: {lowest}, 最高: {highest}")
```

**运行结果**：

```text
最低: 63, 最高: 100
```

### 2.4 类型转换——tuple() 构造与互转

#### 2.4.1 tuple() 从可迭代对象构造

`tuple()` 是内置函数，接收任何可迭代对象，将其元素收集为元组：

```python
# 从列表转元组
from_list = tuple([1, 2, 3, 4, 5])
print(f"列表 → 元组: {from_list}")

# 从字符串转元组——逐字符拆分
from_string = tuple("hello")
print(f"字符串 → 元组: {from_string}")

# 从 range 转元组
from_range = tuple(range(0, 10, 2))
print(f"range → 元组: {from_range}")

# 从生成器转元组
from_gen = tuple(x * x for x in range(5))
print(f"生成器 → 元组: {from_gen}")

# 从字典转元组——得到键的元组
from_dict = tuple({"a": 1, "b": 2, "c": 3})
print(f"字典 → 元组: {from_dict}")
```

**运行结果**：

```text
列表 → 元组: (1, 2, 3, 4, 5)
字符串 → 元组: ('h', 'e', 'l', 'l', 'o')
range → 元组: (0, 2, 4, 6, 8)
生成器 → 元组: (0, 1, 4, 9, 16)
字典 → 元组: ('a', 'b', 'c')
```

#### 2.4.2 元组与列表互转

元组和列表之间的互转是日常开发中的常见操作——元组用于"锁定"数据不可变，列表用于"动态"修改：

```python
# 元组 → 列表（需要修改时）
constants = (3.14159, 2.71828, 1.41421)
mutable = list(constants)
mutable.append(1.61803)
print(f"元组 → 列表并追加: {mutable}")

# 列表 → 元组（需要不可变时）
dynamic_list = [1, 2, 3, 4, 5]
fixed = tuple(dynamic_list)
print(f"列表 → 元组: {fixed}")

# 对元组排序——sorted 返回列表，再用 tuple 转回
unordered = (5, 2, 8, 1, 9)
ordered = tuple(sorted(unordered))
print(f"排序后: {ordered}")
```

**运行结果**：

```text
元组 → 列表并追加: [3.14159, 2.71828, 1.41421, 1.61803]
列表 → 元组: (1, 2, 3, 4, 5)
排序后: (1, 2, 5, 8, 9)
```

#### 2.4.3 字符串分割为元组

字符串的 `split()` 返回列表，配合 `tuple()` 可以得到元组。这在解析 CSV、日期、IP 地址等结构化文本时很常用：

```python
# CSV 行解析
csv_line = "张三,25,工程师,北京"
fields = tuple(csv_line.split(","))
print(f"CSV 解析: {fields}")

# 日期字符串解析
date_str = "2024-03-15"
year, month, day = tuple(date_str.split("-"))
print(f"日期: {year}年{month}月{day}日")

# IP 地址解析为数字元组
ip = "192.168.1.100"
parts = tuple(int(p) for p in ip.split("."))
print(f"IP 解析: {parts}")
```

**运行结果**：

```text
CSV 解析: ('张三', '25', '工程师', '北京')
日期: 2024年03月15日
IP 解析: (192, 168, 1, 100)
```

#### 2.4.4 元组转字符串

将元组内容拼接为字符串时，需要注意元素类型：

```python
# 元素全为字符串时，直接 join
words = ("Hello", "World", "Python")
result = " ".join(words)
print(f"join 结果: {result}")

# 元素为混合类型时，先转 str 再 join
mixed = (1, "hello", 3.14, True)
result = " ".join(str(item) for item in mixed)
print(f"混合类型 join: {result}")

# 格式化输出元组内容
scores = (92, 85, 78, 96, 88)
formatted = ", ".join(f"{score}分" for score in scores)
print(f"格式化: {formatted}")
```

**运行结果**：

```text
join 结果: Hello World Python
混合类型 join: 1 hello 3.14 True
格式化: 92分, 85分, 78分, 96分, 88分
```

### 2.5 元组作为字典键——不可变性的价值

#### 2.5.1 基本用法

元组是可哈希的（前提是元组内所有元素也都是可哈希的），因此可以作为字典的键。这是列表做不到的——列表不可哈希，试图用列表做键会报 `TypeError`。

```python
# 用坐标 (x, y) 作为字典键
grid_values = {
    (0, 0): "原点",
    (1, 0): "右移一格",
    (0, 1): "上移一格",
    (1, 1): "右上角",
}

# 查找
print(f"坐标 (0,0) → {grid_values[(0, 0)]}")
print(f"坐标 (1,1) → {grid_values[(1, 1)]}")

# 列表不能作为字典键
try:
    bad_dict = {[0, 0]: "origin"}
except TypeError as e:
    print(f"列表作键报错: TypeError: {e}")
```

**运行结果**：

```text
坐标 (0,0) → 原点
坐标 (1,1) → 右上角
列表作键报错: TypeError: unhashable type: 'list'
```

#### 2.5.2 复合键——多维映射

当需要用多个维度来索引数据时，元组作为复合键是最自然的方案：

```python
# 用 (班级, 学号) 作为复合键
grades = {
    ("一班", 1001): 92,
    ("一班", 1002): 85,
    ("二班", 2001): 78,
    ("二班", 2002): 96,
}

# 遍历复合键
for (class_name, student_id), score in grades.items():
    print(f"  {class_name} {student_id}号: {score}分")
```

**运行结果**：

```text
  一班 1001号: 92分
  一班 1002号: 85分
  二班 2001号: 78分
  二班 2002号: 96分
```

#### 2.5.3 缓存模式——用元组键做 memoize

元组作为字典键的特性是缓存模式的基础。用元组将函数参数"指纹化"，作为缓存的键：

```python
_cache = {}

def expensive_compute(n, operation):
    """模拟耗时计算，用元组键缓存结果"""
    cache_key = (n, operation)
    if cache_key in _cache:
        print(f"  命中缓存: {cache_key}")
        return _cache[cache_key]

    print(f"  计算中: {cache_key}")
    if operation == "square":
        result = n * n
    elif operation == "double":
        result = n * 2
    else:
        result = n

    _cache[cache_key] = result
    return result

print(f"第一次 5 的平方: {expensive_compute(5, 'square')}")
print(f"第二次 5 的平方: {expensive_compute(5, 'square')}")
print(f"第一次 5 的两倍: {expensive_compute(5, 'double')}")
```

**运行结果**：

```text
  计算中: (5, 'square')
第一次 5 的平方: 25
  命中缓存: (5, 'square')
第二次 5 的平方: 25
  计算中: (5, 'double')
第一次 5 的两倍: 10
```

### 2.6 元组作为集合元素——去重与集合运算

#### 2.6.1 元素去重

和字典键一样，集合元素也必须是可哈希的。元组可以放入集合，列表不行。这在处理坐标点、路径记录等不可变数据时非常有用：

```python
# 记录访问过的坐标点，自动去重
visited = set()
visited.add((0, 0))
visited.add((1, 0))
visited.add((0, 1))
visited.add((1, 1))
visited.add((0, 0))  # 重复添加，自动去重

print(f"访问过的点: {visited}")
print(f"去重后数量: {len(visited)}")  # 4，不是 5
```

**运行结果**：

```text
访问过的点: {(1, 0), (0, 1), (1, 1), (0, 0)}
去重后数量: 4
```

#### 2.6.2 集合运算

元组放入集合后，可以进行并集、交集、差集等集合运算。这在处理"两组记录的对比"时很方便：

```python
# 两个同学的选课记录
alice_courses = {("math", 1), ("english", 2), ("physics", 1)}
bob_courses = {("math", 1), ("chemistry", 3), ("english", 2)}

# 共同选的课（交集）
common = alice_courses & bob_courses
print(f"共同选课: {common}")

# 所有选过的课（并集）
all_courses = alice_courses | bob_courses
print(f"所有课程: {all_courses}")

# 只有 Alice 选的课（差集）
only_alice = alice_courses - bob_courses
print(f"只有 Alice 选的: {only_alice}")
```

**运行结果**：

```text
共同选课: {('math', 1), ('english', 2)}
所有课程: {('math', 1), ('physics', 1), ('chemistry', 3), ('english', 2)}
只有 Alice 选的: {('physics', 1)}
```

#### 2.6.3 分组统计——Counter 与元组

`collections.Counter` 配合元组可以快速实现分组统计：

```python
from collections import Counter

# 销售记录：(区域, 产品)
sales = [
    ("华东", "笔记本电脑"),
    ("华南", "手机"),
    ("华东", "手机"),
    ("华北", "笔记本电脑"),
    ("华南", "笔记本电脑"),
    ("华东", "笔记本电脑"),
    ("华南", "手机"),
]

# 按 (区域, 产品) 分组计数
pair_counts = Counter(sales)
print("区域 × 产品 销量：")
for (region, product), count in pair_counts.items():
    print(f"  {region} - {product}: {count}次")
```

**运行结果**：

```text
区域 × 产品 销量：
  华东 - 笔记本电脑: 2次
  华南 - 手机: 2次
  华东 - 手机: 1次
  华北 - 笔记本电脑: 1次
  华南 - 笔记本电脑: 1次
```

### 2.7 多关键字排序——元组比较的自然应用

#### 2.7.1 元组的自然排序

元组在排序时，会按元素顺序**逐个比较**——先比第一个元素，如果相等再比第二个，以此类推。这种"逐元素比较"的机制天然适合多关键字排序：

```python
data = [(3, 1), (1, 4), (1, 2), (2, 3), (1, 1)]
sorted_data = sorted(data)
print(f"排序: {sorted_data}")
# 先比第一个元素：(1,*) < (2,*) < (3,*)
# 第一个相等时比第二个：(1,1) < (1,2) < (1,4)
```

**运行结果**：

```text
排序: [(1, 1), (1, 2), (1, 4), (2, 3), (3, 1)]
```

#### 2.7.2 多关键字排序

利用元组的逐元素比较特性，可以轻松实现多关键字排序——只需要让 `key` 函数返回一个元组：

```python
students = [
    ("张三", 85, 92),  # (姓名, 语文, 数学)
    ("李四", 85, 78),
    ("王五", 92, 88),
    ("赵六", 85, 92),
    ("钱七", 92, 75),
]

# 先按语文降序，语文相同按数学降序
# 技巧：对数值字段取负实现降序
by_both = sorted(students, key=lambda s: (-s[1], -s[2]))
print("语文降序 → 数学降序：")
for s in by_both:
    print(f"  {s}")
```

**运行结果**：

```text
语文降序 → 数学降序：
  ('王五', 92, 88)
  ('钱七', 92, 75)
  ('张三', 85, 92)
  ('赵六', 85, 92)
  ('李四', 85, 78)
```

`key=lambda s: (-s[1], -s[2])` 返回的元组 `(-85, -92)` 会被 `sorted` 用逐元素比较。取负号让大的值排到前面，实现了降序。

#### 2.7.3 operator.itemgetter——更高效的写法

`operator.itemgetter` 是 C 实现的，比 `lambda` 更高效，且代码更简洁：

```python
from operator import itemgetter

products = [
    ("键盘", 299, 150),   # (名称, 价格, 库存)
    ("鼠标", 99, 300),
    ("显示器", 1599, 50),
    ("耳机", 159, 200),
    ("键盘", 599, 80),
]

# itemgetter(0, 1) 等价于 lambda p: (p[0], p[1])
by_name_price = sorted(products, key=itemgetter(0, 1))
print("按名称 → 价格排序：")
for p in by_name_price:
    print(f"  {p}")
```

**运行结果**：

```text
按名称 → 价格排序：
  ('显示器', 1599, 50)
  ('耳机', 159, 200)
  ('键盘', 299, 150)
  ('键盘', 599, 80)
  ('鼠标', 99, 300)
```

`itemgetter(0, 1)` 返回的实际上是一个函数，调用时会对传入的对象取第 0 和第 1 个元素，打包成元组返回。这就是元组的逐元素比较在排序中的应用。

#### 2.7.4 混合升降序——稳定排序两步法

当需要对一个字段升序、另一个字段降序时，取负号的方法只适用于数值。对于字符串字段，需要利用 Python `sort` 的**稳定性**——排序是稳定的，相等元素的相对顺序不变。两步排序法：先排次要关键字，再排主要关键字。

```python
employees = [
    ("张三", "技术部", 20000),
    ("李四", "市场部", 15000),
    ("王五", "技术部", 25000),
    ("赵六", "市场部", 18000),
    ("钱七", "技术部", 22000),
]

# 目标：按部门升序，同部门按薪资降序
# 步骤一：先按次要关键字（薪资）降序排序
by_salary = sorted(employees, key=lambda e: e[2], reverse=True)

# 步骤二：再按主要关键字（部门）升序排序（稳定排序保持上一步的顺序）
by_dept = sorted(by_salary, key=lambda e: e[1])

print("部门升序 → 薪资降序：")
for emp in by_dept:
    print(f"  {emp}")
```

**运行结果**：

```text
部门升序 → 薪资降序：
  ('赵六', '市场部', 18000)
  ('李四', '市场部', 15000)
  ('王五', '技术部', 25000)
  ('钱七', '技术部', 22000)
  ('张三', '技术部', 20000)
```

### 2.8 元组去重——保持顺序

#### 2.8.1 set 去重（不保序）

最简单的去重方式是转 `set`，但 `set` 不保持原始顺序：

```python
raw_data = [(1, 2), (3, 4), (1, 2), (5, 6), (3, 4)]
unique_set = set(raw_data)
print(f"set 去重: {unique_set}")  # 顺序被打乱
```

#### 2.8.2 有序去重

当需要保持去重后的原始顺序时，有两种惯用法：

```python
raw_data = [(1, 2), (3, 4), (1, 2), (5, 6), (3, 4)]

# 方法一：显式遍历 + set 判断
def unique_ordered(items):
    seen = set()
    result = []
    for item in items:
        if item not in seen:
            seen.add(item)
            result.append(item)
    return result

print(f"有序去重: {unique_ordered(raw_data)}")

# 方法二：dict.fromkeys（Python 3.7+ 字典保持插入顺序）
dict_unique = list(dict.fromkeys(raw_data))
print(f"dict 去重: {dict_unique}")
```

**运行结果**：

```text
set 去重: {(1, 2), (3, 4), (5, 6)}
有序去重: [(1, 2), (3, 4), (5, 6)]
dict 去重: [(1, 2), (3, 4), (5, 6)]
```

`dict.fromkeys` 方法更简洁——`dict.fromkeys(raw_data)` 会创建一个字典，键来自 `raw_data`（自动去重），值全为 `None`。然后 `list()` 取出键列表。

### 2.9 *args 与元组——灵活参数传递

#### 2.9.1 *args 本质是元组

Python 函数的 `*args` 参数本质上就是将传入的位置参数收集为一个元组：

```python
def calculate_sum(*args):
    print(f"  args 类型: {type(args)}")
    print(f"  args 值: {args}")
    return sum(args)

result = calculate_sum(10, 20, 30, 40)
print(f"  总和: {result}")
```

**运行结果**：

```text
  args 类型: <class 'tuple'>
  args 值: (10, 20, 30, 40)
  总和: 100
```

#### 2.9.2 元组解包传参

`*` 运算符可以将元组展开为位置参数传给函数：

```python
def calculate_sum(*args):
    return sum(args)

numbers = (10, 20, 30)
result = calculate_sum(*numbers)  # 等价于 calculate_sum(10, 20, 30)
print(f"  解包传参求和: {result}")
```

**运行结果**：

```text
  解包传参求和: 60
```

### 2.10 字符串格式化中的元组

#### 2.10.1 % 格式化——元组是标准传法

在使用 `%` 格式化字符串时，多个参数必须用元组传入：

```python
name = "张三"
age = 25
score = 92.5
print("%s 同学，%d 岁，成绩 %.1f 分" % (name, age, score))
# 输出: 张三 同学，25 岁，成绩 92.5 分
```

#### 2.10.2 format 与元组解包

`str.format` 配合 `*` 解包元组，可以简化多参数传入：

```python
info = ("李四", 22, 88.5)
print("{} 同学，{} 岁，成绩 {} 分".format(*info))
# 输出: 李四 同学，22 岁，成绩 88.5 分
```

#### 2.10.3 f-string 中的元组

f-string 可以直接引用元组元素：

```python
point = (3, 4)
print(f"点坐标: ({point[0]}, {point[1]})")
print(f"距原点距离: {(point[0]**2 + point[1]**2) ** 0.5:.2f}")
# 输出: 点坐标: (3, 4)
# 输出: 距原点距离: 5.00
```

### 2.11 zip 与矩阵转置

#### 2.11.1 zip 产出元组

`zip` 函数将多个可迭代对象配对，每次产出一个元组。配合元组解包，可以同时遍历多个序列：

```python
names = ["张三", "李四", "王五"]
scores = [92, 85, 78]

for name, score in zip(names, scores):
    print(f"  {name}: {score}分")
```

**运行结果**：

```text
  张三: 92分
  李四: 85分
  王五: 78分
```

`enumerate` 也是同理——产出 `(index, value)` 元组：

```python
for index, name in enumerate(names):
    print(f"  第 {index + 1} 名: {name}")
```

#### 2.11.2 矩阵转置——zip(*) 经典惯用法

`zip(*matrix)` 是 Python 中矩阵转置的经典惯用法。`*` 将矩阵的每一行展开为 `zip` 的参数，然后 `zip` 依次从每行取一个元素配成元组：

```python
matrix = [
    [1, 2, 3],
    [4, 5, 6],
]

transposed = list(zip(*matrix))
print(f"原始: {matrix}")
print(f"转置: {transposed}")
```

**运行结果**：

```text
原始: [[1, 2, 3], [4, 5, 6]]
转置: [(1, 4), (2, 5), (3, 6)]
```

`zip(*matrix)` 等价于 `zip([1,2,3], [4,5,6])`，即从第一个列表取第一个元素 1，从第二个列表取第一个元素 4，配成 `(1, 4)`，以此类推。

#### 2.11.3 itertools.groupby——元组分组

`itertools.groupby` 按指定键对可迭代对象分组。它产出 `(key, group)` 元组，是处理分组操作的惯用法：

```python
from itertools import groupby

events = [
    ("早晨", "起床"),
    ("早晨", "吃早餐"),
    ("早晨", "出门"),
    ("中午", "吃午饭"),
    ("中午", "午休"),
    ("晚上", "吃晚饭"),
    ("晚上", "看书"),
]

# groupby 要求先按分组键排序
events.sort(key=lambda e: e[0])

for time_period, group in groupby(events, key=lambda e: e[0]):
    activities = [item[1] for item in group]
    print(f"  {time_period}: {' → '.join(activities)}")
```

**运行结果**：

```text
  中午: 吃午饭 → 午休
  早晨: 起床 → 吃早餐 → 出门
  晚上: 吃晚饭 → 看书
```

### 2.12 不可变配置常量

#### 2.12.1 用元组定义常量组

元组的不可变性使它天然适合存储一组不应该被修改的配置常量：

```python
DIRECTIONS = (
    ("N", "北", (0, 1)),
    ("S", "南", (0, -1)),
    ("E", "东", (1, 0)),
    ("W", "西", (-1, 0)),
)

# 构建查找字典
direction_map = {code: (name, vec) for code, name, vec in DIRECTIONS}

move = "E"
if move in direction_map:
    name, vector = direction_map[move]
    print(f"移动方向: {move} ({name}), 向量: {vector}")

# 尝试修改会报错——配置安全
try:
    DIRECTIONS[0] = ("UP", "上", (0, 1))
except TypeError as e:
    print(f"修改常量报错: TypeError: {e}")
```

**运行结果**：

```text
移动方向: E (东), 向量: (1, 0)
修改常量报错: TypeError: 'tuple' object does not support item assignment
```

#### 2.12.2 元组模拟枚举

在 Python 3.4 引入 `enum` 模块之前，用元组解包模拟枚举是一种常见惯用法：

```python
STATUS = ("PENDING", "PROCESSING", "COMPLETED", "FAILED")
PENDING, PROCESSING, COMPLETED, FAILED = STATUS

order_status = PENDING
if order_status == PENDING:
    print("等待处理中...")
elif order_status == PROCESSING:
    print("正在处理...")
elif order_status == COMPLETED:
    print("已完成")

# 状态有效性校验
def is_valid_status(status):
    return status in STATUS

print(f"'COMPLETED' 有效: {is_valid_status('COMPLETED')}")
print(f"'UNKNOWN' 有效: {is_valid_status('UNKNOWN')}")
```

**运行结果**：

```text
等待处理中...
'COMPLETED' 有效: True
'UNKNOWN' 有效: False
```

### 2.13 轻量数据记录——元组作为行记录

#### 2.13.1 数据库查询结果模拟

数据库查询结果天然适合用元组表示——每行是一个元组，字段按位置排列。这在性能敏感的场景下比字典更省内存：

```python
# 模拟数据库查询结果
db_result = [
    (1, "Python 编程", "技术", 45.00, 120),
    (2, "西游记", "文学", 35.00, 89),
    (3, "Python 进阶", "技术", 55.00, 76),
    (4, "红楼梦", "文学", 65.00, 200),
]

# 按类别统计销售额
from collections import defaultdict

category_sales = defaultdict(float)
for book_id, title, category, price, sales in db_result:
    category_sales[category] += price * sales

print("分类销售额：")
for category, total in category_sales.items():
    print(f"  {category}: ¥{total:.2f}")

# 找最畅销的书
best = max(db_result, key=lambda row: row[4])
print(f"最畅销: 《{best[1]}》 销量 {best[4]} 本")
```

**运行结果**：

```text
分类销售额：
  技术: ¥9580.00
  文学: ¥16115.00
最畅销: 《红楼梦》 销量 200 本
```

元组作为行记录的缺点是只能通过索引访问字段（`row[4]`），可读性不如命名元组。当字段较多或需要频繁按名访问时，应该优先使用 `namedtuple` 或 `dataclass`。

#### 2.13.2 字典遍历惯用法

`dict.items()` 返回的 `(key, value)` 元组是遍历字典的标准方式：

```python
config = {
    "host": "localhost",
    "port": 8080,
    "debug": True,
}

# 遍历键值对
for key, value in config.items():
    print(f"  {key}: {value}")

# 同时需要索引
for i, (key, value) in enumerate(config.items()):
    print(f"  [{i}] {key} = {value}")
```

**运行结果**：

```text
  host: localhost
  port: 8080
  debug: True
  [0] host = localhost
  [1] port = 8080
  [2] debug = True
```

### 2.14 多赋值——一行初始化多个变量

元组解包可以在一行中初始化多个变量，这是 Python 中最常见的"同时赋值"惯用法：

```python
# 一行定义多个变量
host, port, debug, timeout = "localhost", 8080, True, 30
print(f"配置: {host}:{port}, debug={debug}, timeout={timeout}s")

# 配合格式化输出
lat, lon = 39.9042, 116.4074
print(f"坐标: 北纬 {lat}°, 东经 {lon}°")
```

**运行结果**：

```text
配置: localhost:8080, debug=True, timeout=30s
坐标: 北纬 39.9042°, 东经 116.4074°
```

## 3. 最佳实践

### 3.1 推荐 vs 不推荐写法

**推荐：函数返回多个值时用元组**

```python
# 推荐——简洁、Pythonic
def parse_date(date_str):
    year, month, day = date_str.split("-")
    return int(year), int(month), int(day)

y, m, d = parse_date("2024-03-15")
```

**不推荐：返回字典增加不必要的开销**

```python
# 不推荐——对于简单的多返回值，字典过于冗重
def parse_date(date_str):
    year, month, day = date_str.split("-")
    return {"year": int(year), "month": int(month), "day": int(day)}

result = parse_date("2024-03-15")
y, m, d = result["year"], result["month"], result["day"]
```

当返回值只有 2~3 个且含义明确时，元组比字典更合适。当返回值多、需要按名访问、或可能扩展时，字典或命名元组更好。

**推荐：用 sorted 配合 key 函数排序**

```python
# 推荐——key 函数清晰表达排序意图
students = [("张三", 85), ("李四", 92), ("王五", 78)]
by_score = sorted(students, key=lambda s: s[1], reverse=True)
```

**不推荐：用 cmp 函数排序**

```python
# 不推荐——Python 3 已移除 cmp 参数
# sorted(students, cmp=lambda a, b: b[1] - a[1])  # TypeError!
```

**推荐：变量交换用元组解包**

```python
# 推荐——Pythonic
a, b = b, a
```

**不推荐：用临时变量交换**

```python
# 不推荐——啰嗦，非 Pythonic
temp = a
a = b
b = temp
```

**推荐：用 itemgetter 替代 lambda 做简单的元素取值**

```python
# 推荐——简洁且高效
from operator import itemgetter
sorted(data, key=itemgetter(0, 1))
```

**不推荐：lambda 做简单的元素取值**

```python
# 不推荐——对简单取值来说，lambda 不如 itemgetter 清晰
sorted(data, key=lambda x: (x[0], x[1]))
```

### 3.2 常见错误模式及修正

**错误一：混合类型 join**

```python
words = (1, "hello", 3.14)
# 错误：直接 join 会报 TypeError
# " ".join(words)  # TypeError: sequence item 0: expected str instance, int found

# 修正：先转 str
result = " ".join(str(item) for item in words)
```

**错误二：对元组调用 sort**

```python
data = (5, 2, 8, 1, 9)
# 错误：元组没有 sort 方法
# data.sort()  # AttributeError: 'tuple' object has no attribute 'sort'

# 修正一：用 sorted（返回列表）
data = tuple(sorted(data))

# 修正二：先转列表再 sort
lst = list(data)
lst.sort()
data = tuple(lst)
```

**错误三：可变元素放入元组后误以为不可变**

```python
# 元组本身不可变，但元素如果是可变对象，仍可被修改
mixed = (1, [2, 3], 4)
mixed[1].append(5)  # 这不会报错！
print(mixed)  # (1, [2, 3, 5], 4)

# 此时元组不再可哈希
try:
    hash(mixed)
except TypeError as e:
    print(f"TypeError: {e}")
# 元组中包含可变元素时不可哈希
```

**运行结果**：

```text
(1, [2, 3, 5], 4)
TypeError: unhashable type: 'list'
```

**错误四：对含有可变元素的元组排序**

```python
# 含有可变元素的元组之间不能比较
t1 = (1, [2, 3])
t2 = (1, [4, 5])
try:
    print(t1 < t2)  # 比较 [2,3] 和 [4,5] 时 TypeError
except TypeError as e:
    print(f"TypeError: {e}")
```

### 3.3 场景选型速查表

| 场景 | 推荐写法 | 说明 |
|------|---------|------|
| 函数返回 2~3 个值 | `return a, b, c` | 元组打包，调用方解包 |
| 变量交换 | `a, b = b, a` | 一行搞定 |
| 多赋值初始化 | `x, y, z = 1, 2, 3` | 简洁清晰 |
| 多关键字排序 | `sorted(data, key=lambda d: (d[0], -d[1]))` | 元组逐元素比较 |
| 字典复合键 | `{(k1, k2): value}` | 元组可哈希 |
| 集合去重 | `set(tuple_items)` | 元组可哈希 |
| 矩阵转置 | `zip(*matrix)` | 经典惯用法 |
| 可变参数 | `*args` → tuple | 收集为元组 |
| 条件返回 | `return (True, msg) if cond else (False, err)` | 元组简化 if-else |
| 不可变常量 | `CONSTANTS = ("A", "B", "C")` | 天然防修改 |
| 轻量行记录 | `(id, name, score)` | 比字典省内存 |
| 遍历键值对 | `for k, v in d.items()` | 元组解包 |

## 4. 原理

### 4.1 元组的比较机制

元组的排序和比较基于**逐元素比较**机制。当 Python 比较两个元组时，会从第 0 个元素开始逐一比较，直到找到第一个不相等的元素，那个元素的比较结果就是整个元组的比较结果：

```python
# (1, 2) vs (1, 3)：第一个元素相等，比第二个 → 2 < 3
print((1, 2) < (1, 3))   # True

# (1, 2) vs (1, 2, 3)：前两个相等，更短的"较小"
print((1, 2) < (1, 2, 3))  # True

# (1, 2) vs (2, 1)：第一个元素就不同 → 1 < 2
print((1, 2) < (2, 1))   # True
```

这个机制可以用 `==` 和 `<` 的组合来形式化描述：

```text
(a1, a2, ..., an) < (b1, b2, ..., bm)
等价于：
  找到第一个 ai != bi 的位置 i
  如果存在这样的 i，则结果由 ai < bi 决定
  如果前 min(n,m) 个元素全相等，则 n < m 时为 True
```

正是这个逐元素比较机制，让元组天然适合做多关键字排序的 key——`key=lambda x: (x[0], x[1], x[2])` 让 `sorted` 自动按第一个、第二个、第三个关键字依次排序。

### 4.2 元组的可哈希性原理

元组是可哈希的（`hash()` 可用），前提是其中所有元素也是可哈希的。可哈希性需要满足两个条件：

1. **对象的哈希值在生命周期内不变**——不可变对象天然满足
2. **两个相等的对象有相同的哈希值**——元组的哈希值由所有元素的哈希值组合计算

```python
# 纯不可变元素的元组可哈希
t1 = (1, "hello", 3.14)
print(hash(t1))  # 有值

# 含可变元素的元组不可哈希
t2 = (1, [2, 3])
try:
    hash(t2)
except TypeError as e:
    print(f"TypeError: {e}")
```

**运行结果**：

```text
-4528347230621932640
TypeError: unhashable type: 'list'
```

这就是元组能作为字典键和集合元素，而列表不能的根本原因——列表可变，哈希值会变化，无法保证"哈希值不变"的要求。

## 5. 总结

本文围绕元组的常用技巧与惯用法展开，主要介绍了以下内容：

- **多返回值**：函数用元组打包多个返回值，调用方用解包接收，是 Python 中最经典的元组惯用法
- **变量交换**：`a, b = b, a` 利用元组打包和解包，一步完成变量交换
- **星号解包**：`*变量名` 收集剩余元素到列表，`*_` 丢弃不需要的值
- **类型转换**：`tuple()` 从可迭代对象构造元组，元组与列表互转实现可变与不可变的切换
- **字符串与元组互转**：`split()` + `tuple()` 解析结构化文本，`join()` + `str()` 拼接元组内容
- **元组作为字典键**：不可变性使元组可哈希，适合做复合键和缓存键
- **元组作为集合元素**：用于去重和集合运算（并交差）
- **多关键字排序**：利用元组逐元素比较特性，`key` 函数返回元组实现多关键字排序
- **itemgetter 排序**：`operator.itemgetter` 比 `lambda` 更高效的排序惯用法
- **混合升降序**：取负号法处理数值降序，稳定排序两步法处理字符串混合排序
- **元组去重**：`set` 去重不保序，`dict.fromkeys` 保持插入顺序去重
- **\*args 与元组**：`*args` 本质是将位置参数收集为元组，`*` 运算符将元组展开为参数
- **语法格式化**：`%` 格式化和 `format` 配合 `*` 解包的惯用法
- **zip 与矩阵转置**：`zip(*matrix)` 是矩阵转置的经典惯用法，`groupby` 按元组分组
- **不可变配置常量**：元组天然适合存储不应修改的配置常量组
- **元组模拟枚举**：在 `enum` 模块出现前的经典惯用法
- **轻量数据记录**：元组作为数据库行记录的轻量表示
- **多赋值初始化**：一行初始化多个变量的简洁写法
