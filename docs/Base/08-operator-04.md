---
group:
  title: 【08】运算符和表达式
  order: 8
order: 4
title: 比较运算符
nav:
  title: Python基础
  order: 1
---

# 比较运算符

## 1. 介绍

### 1.1 什么是比较运算符

比较运算符（comparison operators）是 Python 中用来判断两个值之间"大小""相等"关系的运算符。它对左右两个操作数做一次比较，然后返回一个布尔值——关系成立返回 `True`，不成立返回 `False`。

比较运算符是"判断"的基础。几乎所有条件分支（`if`）、循环终止（`while`）、数据筛选（列表推导里的条件）最终都要落到一次比较上。可以说，掌握了比较运算符，你就掌握了 Python 中"做判断"的入口。

Python 的比较运算符一共有六个：

| 运算符 | 含义 | 示例 | 结果 |
|--------|------|------|------|
| `==` | 等于 | `3 == 3` | `True` |
| `!=` | 不等于 | `3 != 4` | `True` |
| `>` | 大于 | `5 > 2` | `True` |
| `<` | 小于 | `5 < 2` | `False` |
| `>=` | 大于等于 | `5 >= 5` | `True` |
| `<=` | 小于等于 | `4 <= 5` | `True` |

除了这六个"值比较"运算符，Python 还有两个判断"身份"的关键字 `is` / `is not`，以及判断"成员"的 `in` / `not in`。它们和比较运算符关系密切，但语义不同（`is` 比的是"是不是同一个对象"，`==` 比的是"值相不相等"），本文会专门拿出一个章节讲清楚二者的区别。

**本章的学习路径**

```text
六个运算符基本用法
        ↓
数值比较（int/float/bool 互通）
        ↓
字符串与容器比较
        ↓
链式比较与不同类型混比
        ↓
None / NaN 的特殊比较
        ↓
最佳实践 + 富比较方法原理
```

### 1.2 最简示例

用一个最简单的例子先建立直觉：比较年龄是否成年。

```python
age = 20
is_adult = age >= 18
print(is_adult)          # True
print(type(is_adult))    # <class 'bool'>
```

**运行结果**：

```text
True
<class 'bool'>
```

从这个例子能看到三件事：比较运算符作用于两个值（`age` 和 `18`），返回一个结果（`True`），结果的类型是 `bool`。这一条"返回永远是布尔值"的规律，是后面所有内容的基础。

## 2. 核心内容

### 2.1 比较结果永远是布尔值

先记住一条贯穿全局的规律：**任何比较表达式的结果都是 `bool` 类型**，只有 `True` 或 `False` 两种取值，不会返回 `None`、不会返回 `0/1`、更不会抛异常（只要两侧类型"可比较"）。

```python
print(3 == 3)        # True
print(3 == 4)        # False
print(3 > 4)         # False
print("a" < "b")     # True
```

**运行结果**：

```text
True
False
False
True
```

因为结果是布尔值，所以可以直接当条件用，不必再和 `True` 比较：

```python
# 推荐：直接用布尔值
if age >= 18:
    print("成年")

# 不推荐：多余的 == True 比较
if (age >= 18) == True:
    print("成年")
```

布尔值还可以参与逻辑运算、赋值、容器存储：

```python
results = [3 > 2, 5 < 1, "a" == "a"]
print(results)                # [True, False, True]
print(any(results))           # True（只要有一个 True）
print(all(results))           # False（要求全 True）
```

**运行结果**：

```text
[True, False, True]
True
False
```

### 2.2 等于 == 与不等于 !=

`==` 判断两边的值是否相等，`!=` 判断是否不等。它们是"值比较"——只关心值是否一致，不关心是否是同一个对象。

```python
print(3 == 3)            # True
print(3 == 3.0)          # True，int 与 float 数值相等即相等
print(3 != 4)            # True
print("py" == "py")      # True
print("py" != "PY")      # True，大小写不同
print([1, 2] == [1, 2])  # True，列表按值比较
```

**运行结果**：

```text
True
True
True
True
True
True
```

**关键点**：

- `3 == 3.0` 为 `True`，因为 Python 把数值类型（`int`、`float`、`bool` 乃至 `complex`）视为"可互通比较"的，比较的是数学意义上的数值。
- 容器（列表、元组、字典、集合）的 `==` 是按内容逐元素/逐键值比，而不是按内存地址比，后面会专门讲。
- 字符串比较区分大小写，`"py" == "PY"` 是 `False`。

**最常见的新手失误：把 = 当成 ==**

`=` 是赋值，`==` 才是比较。在 `if` 里写成 `if age = 18:` 会直接抛 `SyntaxError`，Python 在语法层就拦住了这种错误：

```python
age = 20
# if age = 18:    # SyntaxError: 不能在表达式位置用赋值
if age == 18:
    print("正好 18 岁")
else:
    print("不是 18 岁")
```

**运行结果**：

```text
不是 18 岁
```

### 2.3 大于 >、小于 <、大于等于 >=、小于等于 <=

四个大小比较运算符，含义和数学完全一致。带有 `=` 的两个（`>=`、`<=`）在两边相等时也返回 `True`。

```python
print(20 > 18)      # True
print(12 < 18)      # True
print(90 >= 90)     # True，等号也成立
print(85 >= 90)     # False
print(90 <= 100)    # True
```

**运行结果**：

```text
True
True
True
False
True
```

**关键点**：

- 大小比较不只是数值的专利，字符串、列表、元组都能比，规则是"按字典序逐元素比较"（详见 2.8、2.9 节）。
- 字典（`dict`）和某些自定义类型不支持大小比较，会抛 `TypeError`，但 `==` / `!=` 仍然可用。

### 2.4 数值类型之间的比较

数值类型（`int`、`float`、`bool`）可以跨类型直接比较，Python 把它们统一当作"数"来看待。

```python
print(3 == 3.0)     # True，int 与 float 数值相等
print(0 == 0.0)     # True
print(2 < 2.5)      # True
print(3 != 3.1)     # True
```

**运行结果**：

```text
True
True
True
True
```

**布尔值是 int 的子类型**

在 Python 中，`bool` 本质上是 `int` 的子类：`True` 等价于 `1`，`False` 等价于 `0`。所以布尔值能直接和整数比较，也能参与算术：

```python
print(True == 1)       # True
print(False == 0)      # True
print(True + True)     # 2
print(False + 5)       # 5
print([True, False, True].count(True))  # 2
```

**运行结果**：

```text
True
True
2
5
2
```

这条特性在很多场景下很有用，比如统计"满足条件的个数"：

```python
scores = [78, 92, 55, 88, 60]
# 用比较得到一串布尔值，再求和就是"及格人数"
pass_count = sum(s >= 60 for s in scores)
print(pass_count)   # 4
```

**运行结果**：

```text
4
```

这里能工作的原因正是 `True` 被当作 `1` 求和。这是 Python 中一个常用且优雅的惯用法。

### 2.5 浮点数比较的精度陷阱

数值比较里有一个"经典反直觉"的坑：`0.1 + 0.2 == 0.3` 的结果是 `False`。

```python
left = 0.1 + 0.2
right = 0.3
print(left == right)
```

**运行结果**：

```text
False
```

原因是浮点数用二进制无法精确表示 `0.1` 和 `0.2`，累加后产生了极小的误差。把两边的真实值打印出来就能看清：

```python
print(f"{0.1 + 0.2:.20f}")
print(f"{0.3:.20f}")
```

**运行结果**：

```text
0.30000000000000004441
0.29999999999999998890
```

两个数在末尾几位有差别，`==` 是严格逐位相等判断，自然不相等。

**正确做法：用容差比较**

凡是涉及浮点数的相等判断，都不要直接用 `==`，而要用"绝对误差小于某个容差"的方式。标准库 `math.isclose` 是官方推荐做法：

```python
import math

left = 0.1 + 0.2
right = 0.3

# 方式一：手写绝对误差容差
eps = 1e-9
print(abs(left - right) < eps)              # True

# 方式二：math.isclose（推荐，自带默认容差）
print(math.isclose(left, right))            # True
```

**运行结果**：

```text
True
True
```

`math.isclose` 默认同时考虑"相对误差"和"绝对误差"，对大小不同的数都能合理判断，比手写容差更稳妥：

```python
print(math.isclose(1e9, 1e9 + 1))                      # True（默认容差下大数差异被忽略）
print(math.isclose(1e9, 1e9 + 1, rel_tol=1e-12))      # False（收紧容差后能识别）
print(math.isclose(0.0, 1e-300))                      # False（接近 0 时用绝对容差判断）
```

**运行结果**：

```text
True
False
False
```

**特殊浮点值**

无穷 `inf` 和负无穷 `-inf` 也能比较，且 `inf == inf` 是 `True`：

```python
inf = float("inf")
ninf = float("-inf")
print(inf > 1e308)    # True，无穷大于任何有限数
print(inf == inf)     # True
print(inf > ninf)     # True
```

**运行结果**：

```text
True
True
True
```

### 2.6 字符串比较

字符串比较的规则是"逐字符按 Unicode 码点比较"，等价于逐字符调用 `ord()` 得到一个整数再做数值比较。

```python
print(ord("A"), ord("a"), ord("Z"))
print("A" < "a")          # True，65 < 97
print("Z" < "a")          # True，90 < 97
```

**运行结果**：

```text
65 97 90
True
True
```

**关键点**：字符串比较区分大小写，因为大小写字母的码点不同；大写字母码点（65~90）普遍小于小写字母（97~122），所以 `"Z" < "a"` 居然是 `True`。

**字典序比较**

从左到右逐字符比较，第一个出现差异的字符决定整体结果：

```python
print("apple" < "banana")    # True，首字符 a < b
print("apple" < "apply")     # True，前 4 个相同，第 5 个 e < y
print("abc" < "abcd")        # True，短的前缀相同则更短者小
```

**运行结果**：

```text
True
True
True
```

**数字字符串的坑：按字符比，不是按数值比**

这是排序文件名、版本号时最容易踩的坑：

```python
print("10" < "9")        # True！因为 '1' < '9'
print("100" < "20")      # True，同理
# 想按数值比，先转 int
print(int("10") < int("9"))   # False
```

**运行结果**：

```text
True
True
False
```

如果要让字符串"按数值意义"比较或排序，必须先转成数字再比；这是文件名排序、版本号比较中要特别注意的。

**中文字符串**

中文字符同样有 Unicode 码点，但码点顺序不一定符合"笔画数"或"拼音"的直觉，所以比较结果可能不直观：

```python
print(ord("一"))          # 19968
print("一" < "二")        # 看码点，不一定符合字典直觉
```

**运行结果**：

```text
19968
True
```

需要按拼音排序时，要借助 `locale` 模块或第三方库 `pypinyin`，不能直接依赖字符串大小比较。

**字符串与其它类型的 == 比较**

字符串与数字、浮点等非字符串类型做 `==` 比较时，直接判定为不相等（不会抛异常），因为类型不同：

```python
print("1" == 1)           # False
print("3.14" == 3.14)     # False
```

**运行结果**：

```text
False
False
```

### 2.7 容器比较（列表、元组、字典、集合）

容器之间的比较有两条不同的规则线，要分清楚：

- `==` / `!=`：按"内容"判断是否相等，几乎所有容器都支持。
- `>` / `<` / `>=` / `<=`：按"字典序逐元素"比较，**字典不支持**，会抛 `TypeError`；集合的 `< <= > >=` 语义则是"子集/超集"，不是字典序。

**列表与元组：逐元素按字典序比**

```python
print([1, 2, 3] == [1, 2, 3])      # True，内容相同
print([1, 2] < [1, 2, 3])           # True，短的且前缀相同则更短者小
print([1, 2, 0] < [1, 2, 3])        # True，第 3 个 0 < 3
print([1, 3] > [1, 2, 9])           # True，第 2 个 3 > 2，直接出结果
```

**运行结果**：

```text
True
True
True
True
```

元组的比较规则与列表完全一致。但列表和元组是不同类型，`==` 直接判不相等：

```python
print((1, 2, 3) == (1, 2, 3))       # True
print([1, 2] == (1, 2))             # False，类型不同
```

**运行结果**：

```text
True
False
```

**关键点**：容器比较大小时，元素本身也必须"可比较"，否则会抛 `TypeError`：

```python
try:
    print([1, 2] < ["a"])
except TypeError as e:
    print(e)
```

**运行结果**：

```text
'<' not supported between instances of 'int' and 'str'
```

**字典：只支持 == 和 !=**

字典的 `==` 比较的是"所有键值对是否一致"，与键的顺序无关：

```python
print({"a": 1} == {"a": 1})         # True
print({"a": 1} == {"a": 2})         # False
print({"a": 1, "b": 2} == {"b": 2, "a": 1})   # True，顺序无关
```

**运行结果**：

```text
True
False
True
```

但字典不支持大小比较，会抛 `TypeError`：

```python
try:
    print({"a": 1} < {"a": 2})
except TypeError as e:
    print(e)
```

**运行结果**：

```text
'<' not supported between instances of 'dict' and 'dict'
```

所以判断两个字典"内容是否一致"用 `==` 就够了；想按字典"排序"则要自己指定比较依据，不能直接比较字典本身。

**集合：< <= > >= 是子集/超集语义**

集合的大小比较语义特殊：`<` `<=` 表示子集关系，`>` `>=` 表示超集关系，与列表的"字典序"完全不同，不要混用：

```python
s1 = {1, 2, 3}
s2 = {1, 2}
print(s2 <= s1)            # True，s2 是 s1 的子集（含等于）
print(s2 < s1)             # True，真子集
print(s1 > s2)             # True，超集
print(s1 == {3, 2, 1})     # True，集合不分顺序
```

**运行结果**：

```text
True
True
True
True
```

如果想判断"两个集合内容是否相同"用 `==` 即可；想判断"是不是子集"才用 `<` / `<=`。这两类语义本质不同，混用是集合比较最常见的 bug 来源。

**嵌套容器的等值比较会递归**

容器可以嵌套，`==` 比较时会逐层递归比对，不论文本多深：

```python
a = [[1, 2], {"k": [3, 4]}]
b = [[1, 2], {"k": [3, 4]}]
print(a == b)            # True
```

**运行结果**：

```text
True
```

### 2.8 链式比较

Python 支持把多个比较连起来写，称为链式比较：

```python
x = 5
print(1 < x < 10)        # True
```

语义上，`a < b < c` 等价于 `a < b and b < c`：

```python
x = 5
r1 = 1 < x < 10
r2 = (1 < x) and (x < 10)
print(r1, r2)            # True True
```

**运行结果**：

```text
True True
```

链式比较不仅更简洁，还有一个隐藏优势：**中间的操作数只会被求值一次**。这在中间是函数调用或属性访问时尤其重要：

```python
calls = {"n": 0}

def get_x():
    calls["n"] += 1
    return 5

# 链式：get_x() 只调用一次
calls["n"] = 0
_ = 1 < get_x() < 10
print(calls["n"])          # 1

# 拆开写：get_x() 被调用两次
calls["n"] = 0
_ = (1 < get_x()) and (get_x() < 10)
print(calls["n"])          # 2
```

**运行结果**：

```text
1
2
```

**实战场景：区间判断**

链式比较最自然的用途就是"判断一个值是否落在某区间内"：

```python
score = 85

if 60 <= score <= 100:
    print("合格")
elif 0 <= score < 60:
    print("不及格")
else:
    print("非法分数")
```

**运行结果**：

```text
合格
```

**反例：不要把"或"的语义写成链式**

想表达"x 大于 10 或小于 0"（越界）时，不能写成 `10 < x < 0`，那是永远为 `False` 的（因为 `10 < x` 为真后还要继续 `x < 0`，必然假）：

```python
val = 12
print(10 < val < 0)              # False，写法错误
print(val > 10 or val < 0)       # True，正确写法
```

**运行结果**：

```text
False
True
```

链式比较表达的是"一系列同时成立的条件"（与的关系），表达"或"必须用 `or` 拆开。

### 2.9 不同类型之间的比较

比较运算符对"跨类型"的处理分两种情况：

- `==` / `!=`：不同类型直接判为不相等，不抛异常。
- `>` / `<` / `>=` / `<=`：不同类型（尤其是数值与非数值）之间会抛 `TypeError`。

```python
print(1 == "1")         # False，类型不同直接判不相等
print([1, 2] == (1, 2)) # False
print({} == [])         # False
```

**运行结果**：

```text
False
False
False
```

但跨类型做大小比较就会出错：

```python
try:
    print(1 < "1")
except TypeError as e:
    print(e)
```

**运行结果**：

```text
'<' not supported between instances of 'int' and 'str'
```

**关键点**：Python 3 主动拒绝了数值和字符串之间"隐式的大小比较"（Python 2 里这种比较有定义但很混乱，3 里被修正为报错）。这是一个"早暴露错误优于静默给出奇怪结果"的设计。

数值类型之间（`int`、`float`、`bool`、`complex`）则可以互通比较，其中 `complex` 只支持 `==` / `!=`，不支持大小比较（复数没有大小序）：

```python
print(1 == 1.0)         # True
print(1 == True)        # True
print(3 == 3 + 0j)      # True
print((1 + 2j) == (1 + 2j))   # True
try:
    print(1 + 2j < 3 + 0j)
except TypeError as e:
    print(e)
```

**运行结果**：

```text
True
True
True
True
'<=' not supported between instances of 'complex' and 'complex'
```

### 2.10 None 的比较

`None` 是 Python 中表示"没有值"的单例。判断一个变量是不是 `None`，有两种写法：

```python
val = None
print(val == None)    # True
print(val is None)    # True
```

**运行结果**：

```text
True
True
```

两种写法都能工作，但 PEP 8 明确推荐用 `is None` / `is not None`，原因是：

1. `is` 直接判断身份（是不是同一个 `None` 对象），比 `==` 更快。
2. `==` 会触发对象自定义的 `__eq__` 方法，如果对象把 `__eq__` 写得很奇怪，`obj == None` 可能返回非预期结果（比如返回 `True` 或抛异常），而 `is` 不会。

```python
class Weird:
    def __eq__(self, other):
        return True      # 任何东西都判为相等

w = Weird()
print(w == None)     # True，被 Weird 的 __eq__ 干扰
print(w is None)     # False，身份判断不受影响
```

**运行结果**：

```text
True
False
```

这也是为什么官方和绝大多数代码风格都坚持用 `is None`。这条规则同样适用于"哨兵值"判断：当函数参数用 `None` 作为"未传参"的默认值时，判断时一定要用 `is None`。

### 2.11 NaN 的特殊比较

`NaN`（Not a Number）是 IEEE 754 浮点数标准中的一个特殊值，表示"不是一个数"，常出现在 `float("nan")` 或某些非法运算的结果中。它有一个反直觉的特性：**`NaN` 不等于它自己**。

```python
nan = float("nan")
print(nan == nan)     # False！
print(nan != nan)     # True
```

**运行结果**：

```text
False
True
```

这意味着不能用 `==` 判断一个值是不是 `NaN`。正确做法是用 `math.isnan`：

```python
import math
print(math.isnan(nan))     # True
```

**运行结果**：

```text
True
```

这个特性的底层原因是 IEEE 754 规范有意为之：`NaN` 用于表示"未知/不可比"的结果，"未知 == 未知"结果定为 `False`，可以避免在数据清洗里把脏数据当成正常数据误判。实践中，当你需要识别缺失值（如 `pandas` 里的 `NaN`）时，一定要用 `isnan` 之类的专用函数，不能用 `==`。

## 3. 最佳实践

### 3.1 推荐 vs 不推荐写法对比

把常见比较场景的"好写法"和"坏写法"做一组对比，方便对照记忆。

| 场景 | 不推荐 | 推荐 | 原因 |
|------|--------|------|------|
| 判断布尔结果 | `if (x > 0) == True:` | `if x > 0:` | 布尔值直接当条件，多余的 `== True` 是噪声 |
| 判断 None | `if x == None:` | `if x is None:` | `is` 不受自定义 `__eq__` 干扰，PEP 8 推荐 |
| 浮点相等 | `if a + b == c:` | `if math.isclose(a + b, c):` | 浮点有精度误差，`==` 不可靠 |
| 区间判断 | `if 0 < x and x < 100:` | `if 0 < x < 100:` | 链式更简洁，且 `x` 只求值一次 |
| 统计满足条件个数 | 手写循环 + 计数 | `sum(x > 0 for x in data)` | 利用 `True == 1` 求和，简洁高效 |
| 判断 NaN | `if x == float("nan"):` | `if math.isnan(x):` | `NaN != NaN`，`==` 永远为 `False` |
| 判断空容器 | `if len(lst) == 0:` | `if not lst:` | Python 惯用法，空容器本身就是假值 |

逐个看一组代码对照：

```python
# 1) 布尔判断
x = 5
if x > 0:            # 好
    pass
if (x > 0) == True:  # 坏
    pass

# 2) 区间判断
if 0 < x < 100:      # 好，链式
    pass
if x > 0 and x < 100: # 可接受，但不如链式
    pass

# 3) 统计
data = [3, -1, 5, -2, 8]
positive_cnt = sum(d > 0 for d in data)   # 好
# positive_cnt = 0                          # 坏，手写循环
# for d in data:
#     if d > 0:
#         positive_cnt += 1
print(positive_cnt)
```

**运行结果**：

```text
3
```

### 3.2 常见错误模式及修正

**错误一：浮点数直接 == 比较**

```python
# 坏：浮点精度坑
if 0.1 + 0.2 == 0.3:
    print("相等")     # 不会被打印
```

修正：

```python
import math
if math.isclose(0.1 + 0.2, 0.3):
    print("相等")     # 会被打印
```

**运行结果**：

```text
相等
```

**错误二：用 == 判断 None**

```python
# 坏：可能被自定义 __eq__ 干扰
def handle(value=None):
    if value == None:   # 应改为 is None
        print("未传参")
```

修正：

```python
def handle(value=None):
    if value is None:   # 推荐
        print("未传参")
```

**错误三：字典之间做大小比较**

```python
# 坏：字典不支持大小比较，抛 TypeError
# if {"a": 1} < {"a": 2}: ...
```

修正：找出要比较的特征（如某个键的值），再比较该值：

```python
d1, d2 = {"score": 80}, {"score": 90}
print(d1["score"] < d2["score"])   # 按score 比较
```

**运行结果**：

```text
True
```

**错误四：数字字符串按数值排序**

```python
versions = ["10", "9", "100", "20"]
print(sorted(versions))              # 坏：按字符排序 → ['10', '100', '20', '9']
print(sorted(versions, key=int))     # 好：按数值排序 → ['9', '10', '20', '100']
```

**运行结果**：

```text
['10', '100', '20', '9']
['9', '10', '20', '100']
```

**错误五：误把集合的 < 当成字典序**

```python
# 以为 {1, 2} < {1, 2, 3} 表示"字典序在前"？其实它是"真子集"语义
print({1, 2} < {1, 2, 3})    # True，因为子集关系成立，不是因为"大小"
print({2, 3} < {1, 2, 3})    # True，也是子集，不是"2排前面"
```

**运行结果**：

```text
True
True
```

### 3.3 性能与惯用法的取舍

- **能用 `is` 就不用 `==` 来判 `None`**：`is` 是单条指令级的身份比较，比 `==` 触发 `__eq__` 调用要快，也更安全。
- **能用链式就别拆开**：链式比较中间表达式只求值一次，对带副作用的表达式更安全。
- **`sum(x > 0 for x in data)` 这种布尔求和是惯用法**：可读性高、性能不错，比手动循环出计数器更 Pythonic。
- **跨类型大小比较前先做类型检查**：如果数据来源可能混杂类型（比如配置中既有数字又有字符串），比较前用 `isinstance` 过滤，能避免 `TypeError`。
- **批量比较时考虑短路**：`all()` / `any()` 是短路求值的，`all()` 遇到第一个 `False` 就停，`any()` 遇到第一个 `True` 就停，比全部算完再判断更高效。

## 4. 原理

### 4.1 比较结果为什么是布尔值

Python 的比较运算符在底层都返回一个 `bool` 对象，`bool` 是 `int` 的子类。所以比较结果既能当真假值用，也能当 `0/1` 参与算术。

可以用一个角度理解这条设计：让"判断"和"运算"统一。比较得到布尔值，布尔值能进算术、能进 `sum`、能存进列表做统计，整个数据流就是一条线，不需要二次转换。

### 4.2 富比较方法（`__eq__`、`__lt__` 等）

每个比较运算符背后都对应一个"富比较方法"（rich comparison methods）。Python 在执行 `a op b` 时，本质上是调用 `a.__xxx__(b)`，六个运算符对应六个方法：

| 运算符 | 对应方法 | 调用形式 |
|--------|----------|----------|
| `==` | `__eq__` | `a == b` → `a.__eq__(b)` |
| `!=` | `__ne__` | `a != b` → `a.__ne__(b)` |
| `<` | `__lt__` | `a < b` → `a.__lt__(b)` |
| `<=` | `__le__` | `a <= b` → `a.__le__(b)` |
| `>` | `__gt__` | `a > b` → `a.__gt__(b)` |
| `>=` | `__ge__` | `a >= b` → `a.__ge__(b)` |

内置类型（`int`、`str`、`list` 等）已经实现了这些方法，所以可以直接比较。自定义类型默认只继承了"按身份比较"的 `__eq__`（即默认比较两个对象是不是同一个），如果要让自定义类型按"值"比较，就要重写 `__eq__`：

```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __eq__(self, other):
        if not isinstance(other, Point):
            return NotImplemented       # 交给对方去比
        return self.x == other.x and self.y == other.y

    def __repr__(self):
        return f"Point({self.x}, {self.y})"


a = Point(1, 2)
b = Point(1, 2)
c = a
print(a == b)      # True，重写 __eq__ 后按值比较
print(a is b)       # False，两个不同对象
print(a is c)       # True，c 就是 a
```

**运行结果**：

```text
True
False
True
```

**关键点**：

- `__eq__` 返回 `NotImplemented` 是一个特殊约定：它告诉 Python"我不会处理这种类型，请你去找对方的对应方法试试"。这是处理"自定义类与其它类型比较"的推荐写法。
- 重写 `__eq__` 后，默认的 `__ne__` 会自动"取反" `__eq__` 的结果，所以一般不用单独再写 `__ne__`。
- 如果要让自定义对象可排序（支持 `<`、`>` 等），还要实现 `__lt__`、`__le__` 等方法，或者更简单地用 `functools.total_ordering` 装饰器：只写 `__eq__` 和 `__lt__`，其余方法会自动生成。

```python
from functools import total_ordering

@total_ordering
class Score:
    def __init__(self, value):
        self.value = value

    def __eq__(self, other):
        if not isinstance(other, Score):
            return NotImplemented
        return self.value == other.value

    def __lt__(self, other):
        if not isinstance(other, Score):
            return NotImplemented
        return self.value < other.value


print(Score(80) < Score(90))     # True
print(Score(90) >= Score(80))   # True，total_ordering 自动补出
```

**运行结果**：

```text
True
True
```

### 4.3 == 与 is 的本质区别

`==` 和 `is` 是两套完全不同的比较机制：

- `==` 调用 `__eq__`，比较的是"值是否相等"，可以被自定义类型重写。
- `is` 比较的是"身份"——两个变量是否指向内存中同一个对象，等价于 `id(a) == id(b)`，任何类型都一样，不可被重写。

```python
a = [1, 2, 3]
b = [1, 2, 3]
c = a
print(a == b)      # True，值相等
print(a is b)      # False，不是同一对象
print(a is c)      # True，c 是 a 的别名
print(id(a), id(b), id(c))
```

**运行结果**（`id` 值每次运行不同）：

```text
True
False
True
4362417288 4362417416 4362417288
```

**小整数缓存的迷惑**

CPython 有一个实现细节：缓存了 `[-5, 256]` 范围内的小整数对象，让所有这一区间的整数都用同一个对象。这会让 `is` 在小整数上"恰好"返回 `True`，造成"`is` 也能比值"的错觉：

```python
p, q = 100, 100
print(p is q)      # True（小整数缓存，实现细节）
```

**运行结果**：

```text
True
```

但超出范围就不一定了。用 `int()` 运行时构造能可靠得到两个独立对象：

```python
big1 = int("300")
big2 = int("300")
print(big1 is big2)   # False，超出缓存，是两个不同对象
print(big1 == big2)   # True，值相等
```

**运行结果**：

```text
False
True
```

**结论**：判断值相等永远用 `==`，判断"是不是同一对象"才用 `is`。不要依赖小整数缓存做任何判断——它是 CPython 的实现细节，不是语言规范保证的。`None`、`True`、`False` 这类"语言级单例"用 `is` 是安全的（它们的单例身份由语言规范保证，不依赖实现）。

为了让"身份比较"的机制更直观，可以用一张数据流图理解 `==` 和 `is` 的差别：

```text
执行 a == b                    执行 a is b
    │                              │
    ▼                              ▼
读取 a.__eq__                  读取 id(a)、id(b)
    │                              │
    ▼                              ▼
调用 a.__eq__(b)               比较 id 是否相等
    │                              │
    ▼                              ▼
返回 True / False              返回 True / False
（可被自定义类型改写）          （永远只比内存地址，不可改写）
```

## 5. 总结

本文围绕 Python 的比较运算符展开，主要介绍了以下内容：

- 比较运算符共有六个：`==`、`!=`、`>`、`<`、`>=`、`<=`，作用是判断两个值的关系，结果永远是布尔值 `True` 或 `False`。
- 数值类型（`int`、`float`、`bool`、`complex`）之间可以互通比较，其中 `bool` 是 `int` 子类，`True == 1`、`False == 0`，利用这条特性可以用 `sum(x > 0 for x in data)` 优雅统计满足条件的个数。
- 浮点数直接用 `==` 比较不可靠（`0.1 + 0.2 != 0.3`），应改用 `math.isclose` 做容差比较。
- 字符串按 Unicode 码点逐字符比较，区分大小写；数字字符串按字符比而非按数值比，排序时要先转成数字。
- 容器比较分两条线：`==` 按内容比（递归）；列表/元组还支持大小比较（字典序）；字典只支持 `==`/`!=`；集合的 `< <= > >=` 是子集/超集语义而非字典序。
- 链式比较 `a < b < c` 等价于 `a < b and b < c`，且中间操作数只求值一次，区间判断应优先使用链式写法。
- 不同类型用 `==` 直接返回 `False`，用大小比较会抛 `TypeError`（Python 3 主动拒绝数值与字符串的隐式比较）。
- `None` 的判断应使用 `is None` 而非 `== None`，避免被自定义 `__eq__` 干扰；`NaN` 不等于自身，要用 `math.isnan` 判断。
- 每个比较运算符背后对应一个富比较方法（`__eq__`、`__lt__` 等），自定义类型可通过重写这些方法实现按值比较，配合 `functools.total_ordering` 可一站式补全所有比较方法。
- `==` 比较的是值（调用 `__eq__`，可改写），`is` 比较的是身份（内存地址，不可改写）；判断值相等用 `==`，判断"是否同一对象"用 `is`，不要依赖小整数缓存做判断。
