---
group:
  title: 【08】运算符和表达式
  order: 8
order: 8
title: 身份运算符
nav:
  title: Python基础
  order: 1
---

# 身份运算符

## 1. 介绍

### 1.1 什么是身份运算符

身份运算符判断的是两个变量是否指向**同一个对象**——换句话说，比较的是对象的"身份"（内存中那一块东西），而不是对象里装的内容。Python 提供两个身份运算符：

| 运算符 | 含义 | 返回值 |
|--------|------|--------|
| `is` | 两个变量指向同一个对象 | `True` / `False` |
| `is not` | 两个变量不指向同一个对象 | `True` / `False` |

它和相等运算符 `==` 看起来像在做同一件事，实则完全不同。`==` 问他俩"值一不一样"，`is` 问他俩"是不是同一份东西"。理解这条区分，是掌握身份运算符的全部关键：值相等不一定同一对象，同一对象值一定相等。

身份运算符在工程里真正的用武之地很具体：判断 `None`、判断 `True`/`False` 这类单例、以及偶尔在排查共享可变对象时确认是否被意外复用。绝大多数值比较都应该用 `==`，把 `is` 用在值的比较上是常见的误用。

### 1.2 在运算符体系中的定位

身份运算符位于 Python 运算符体系中"判断类"运算符这一层，和比较运算符（`==`、`!=`）、成员运算符（`in`）并列。三者都返回布尔值，但判断的内容不同：比较运算符看值、成员运算符看从属关系、身份运算符看对象同一性。它们的优先级也处在相近的层次。

### 1.3 最简示例

用一个最小的例子感受身份运算符在做什么：

```python
a = [1, 2, 3]
b = a            # b 和 a 指向同一个列表
c = [1, 2, 3]    # c 是另一个新建的列表，值相同但是不同对象

print(a is b)     # True，a 和 b 是同一个对象
print(a is c)     # False，值相同但不是同一个对象
print(a is not c) # True，不是同一个对象
```

运行结果：

```text
True
False
True
```

`b = a` 是赋值（给同一个对象起了别名），不是拷贝，所以 `a is b` 成立；`c = [1,2,3]` 新建了一个列表，内容一样但是另一块内存，所以 `a is c` 不成立。下面逐个讲透 `is` 的用法、它和 `==` 的区别，以及 Python 里影响 `is` 结果的缓存机制。

---

## 2. 核心内容

本章先讲两个运算符本身，再讲它和 `==` 的关键区别，然后讲影响 `is` 结果的两类缓存机制，最后讲它最经典的应用——判断 `None`。

### 2.1 `is` 运算符

`is` 的语法是 `a is b`，当 `a` 和 `b` 指向同一个对象时返回 `True`。这里的"同一个对象"是指内存中同一块存储，用内置函数 `id()` 可以看到这个对象的唯一编号——`a is b` 就等价于 `id(a) == id(b)`。

**示例**

```python
a = [1, 2, 3]
b = a            # 别名：b 和 a 是同一个列表
c = [1, 2, 3]    # 新建：c 是另一个列表

print(f"a is b -> {a is b}")        # True
print(f"a is c -> {a is c}")        # False
print(f"id(a) == id(b) -> {id(a) == id(b)}")   # True，验证 is 就是比较 id
```

运行结果：

```text
a is b -> True
a is c -> False
id(a) == id(b) -> True
```

赋值和拷贝的区别直接决定 `is` 的结果，这一点值得看清楚：

```python
import copy
origin = [10, 20]
alias = origin                    # 别名，同一个对象
shallow = origin.copy()           # 浅拷贝，新对象
deep = copy.deepcopy(origin)     # 深拷贝，新对象

print(f"origin is alias   -> {origin is alias}")    # True
print(f"origin is shallow -> {origin is shallow}")  # False
print(f"origin is deep    -> {origin is deep}")      # False
```

运行结果：

```text
origin is alias   -> True
origin is shallow -> False
origin is deep    -> False
```

**关键点**

- `is` 看的是"是不是同一份"，不等同于"内容一样"。新建出来的对象哪怕长得一模一样，`is` 也是 `False`。
- `is` 永远无法被自定义类重载，它只看对象的身份标识。这点和 `==` 形成鲜明对比——`==` 可以通过实现 `__eq__` 被任意改写。
- 判断"同一对象"的底层依据是 `id()`，所以 `a is b` 恒等于 `id(a) == id(b)`，写法上直接用 `is` 更清晰。

### 2.2 `is not` 运算符

`is not` 是 `is` 的逻辑取反，等价于 `not (a is b)`。当 `a` 和 `b` 不是同一个对象时返回 `True`。

**示例**

```python
a = [1, 2, 3]
b = a
c = [1, 2, 3]
print(f"a is not b -> {a is not b}")    # False（a、b 是同一对象）
print(f"a is not c -> {a is not c}")    # True（a、c 不同对象）
```

运行结果：

```text
a is not b -> False
a is not c -> True
```

**关键点**

- 推荐用 `a is not b` 而不是 `not (a is b)`。前者是一条运算符，读起来和判断意图一致；后者要先比较再取反，多一层括号，优先级一旦写漏语义可能跑偏。
- `is not` 不应误写成 `not is`——`not is` 是语法错误，正确写法永远是 `is not`。

### 2.3 `is` 与 `==` 的区别：标识 vs 值相等

这是身份运算符最重要的一节。`is` 和 `==` 看似都在比较"相等"，但比较的层面完全不同：

| 维度 | `is` | `==` |
|------|------|------|
| 比较内容 | 对象是否同一份 | 对象的值是否相等 |
| 底层机制 | 比较 `id()` | 调用 `__eq__` 方法（可自定义） |
| 能否重载 | 不能 | 能 |
| 典型用途 | 判 `None`/单例/对象同一性 | 判值是否相等 |
| 两个值相同的不同对象 | `False` | `True` |

最直观的对比：

```python
a = [1, 2, 3]
b = [1, 2, 3]
print(f"a == b -> {a == b}")    # True，值相等
print(f"a is b -> {a is b}")    # False，不是同一个对象
```

运行结果：

```text
a == b -> True
a is b -> False
```

**`==` 可以被自定义类改写，`is` 不能**

这是两者最关键的差别。`==` 走的是对象的 `__eq__` 方法，类可以自由定义它；`is` 永远只看对象标识，无法被改写。这意味着在需要"绝对可靠的同一对象判断"时，只有 `is` 靠得住。

```python
class Money:
    def __init__(self, amount):
        self.amount = amount
    def __eq__(self, other):
        # 自定义相等：只比金额
        return self.amount == other.amount

m1 = Money(100)
m2 = Money(100)
print(f"m1 == m2 -> {m1 == m2}")    # True，自定义了 __eq__
print(f"m1 is m2 -> {m1 is m2}")    # False，是两个不同对象
```

运行结果：

```text
m1 == m2 -> True
m1 is m2 -> False
```

**一个反直觉的例子：NaN**

`float('nan')` 是个特殊值，它的规定是"自己不等于自己"，所以 `==` 判 NaN 会出错；但 `is` 看的是对象同一性，同一个 NaN 对象当然 `is` 自己：

```python
import math
nan = float('nan')
print(f"nan == nan -> {nan == nan}")   # False，NaN 不等于自己
print(f"nan is nan -> {nan is nan}")   # True，还是同一个对象
print(f"math.isnan(nan) -> {math.isnan(nan)}")  # 判 NaN 的正确方法
```

运行结果：

```text
nan == nan -> False
nan is nan -> True
math.isnan(nan) -> True
```

**关键点**

记住一句口诀：**值比较用 `==`，对象同一性用 `is`**。日常代码里 99% 的比较都是值比较，应该用 `==`；`is` 留给判断 `None`、`True`/`False` 单例，以及少数需要确认"是不是同一份东西"的场景。

### 2.4 小整数缓存机制

`is` 在整数上的行为有个著名的"坑"：小整数范围内 `is` 似乎能当 `==` 用，一旦超出范围又突然不行。这是 CPython 的**小整数缓存**导致的。

CPython 在启动时预先创建了一组小整数对象（默认范围是 `[-5, 256]`），全程序复用它们。所以在这个范围内，每次用到同一个整数都是同一个对象，`is` 自然就成立。

```python
for n in [-5, 0, 100, 256]:
    a = n
    b = n
    print(f"{n:>4}: a is b -> {a is b}")
```

运行结果：

```text
  -5: a is b -> True
   0: a is b -> True
 100: a is b -> True
 256: a is b -> True
```

超出缓存范围，同一个数值就可能是两个不同的对象了。用运行时构造（避免编译期优化）来看最清楚：

```python
# 用 int() 在运行时构造，避开编译期常量折叠
for n in [257, 1000, 999999]:
    a = int(str(n))
    b = int(str(n))
    print(f"{n}: a == b -> {a == b}, a is b -> {a is b}")
```

运行结果：

```text
257: a == b -> True, a is b -> False
1000: a == b -> True, a is b -> False
999999: a == b -> True, a is b -> False
```

**更隐蔽的坑：编译期常量折叠**

小整数缓存只是一半的故事。另一半是**编译期常量折叠**——同一行里写两次 `200 + 60`，CPython 在编译期就把它们算成常量 `260` 并合并成同一个对象，于是 `is` 看起来也成立：

```python
# 编译期折叠：两个 200+60 被合并成同一个 260 对象，is 仍为 True
total_a = 200 + 60
total_b = 200 + 60
print(f"编译期折叠: == {total_a == total_b}, is {total_a is total_b}")
# 一旦改成运行时构造，就分家了
ra = int('260')
rb = int('260')
print(f"运行时构造: == {ra == rb}, is {ra is rb}")
```

运行结果：

```text
编译期折叠: == True, is True
运行时构造: == True, is False
```

**关键点**

- 小整数缓存范围（`[-5, 256]`）和编译期常量折叠，都是 CPython 的性能优化，属于实现细节，**不要依赖它们写业务逻辑**。
- 这两个机制的存在恰恰说明了一件事：`is` 比较整数的结果时真时假、不可预测——有时成立、有时不成立。所以比较数值永远用 `==`，把 `is` 留给 `None` 和单例。

### 2.5 字符串驻留（intern）机制

整数有缓存，字符串也有对应的优化叫**驻留（intern）**。简单说，相同的字符串字面量在某些条件下会被复用成同一个对象，让 `is` 成立。但驻留的触发条件比整数缓存更复杂、更依赖实现，所以字符串上的 `is` 同样不可靠。

```python
s1 = "hello"
s2 = "hello"
print(f"s1 == s2 -> {s1 == s2}")    # True
print(f"s1 is s2 -> {s1 is s2}")    # 常为 True，字面量常被驻留
```

运行结果：

```text
s1 == s2 -> True
s1 is s2 -> True
```

但运行时拼接出来的字符串，通常不会自动驻留，于是 `is` 就分家了：

```python
part = "world"
built = "hello " + part      # 运行时拼接，产生新对象
literal = "hello world"
print(f"== -> {built == literal}")
print(f"is -> {built is literal}")    # 通常为 False
```

运行结果：

```text
== -> True
is -> False
```

**显式驻留：`sys.intern`**

如果确实想让一批重复字符串成为同一个对象（省内存、并用 `is` 快速判等），可以用 `sys.intern` 主动把字符串加入驻留池：

```python
import sys
a = "hello world!"
b = "hello world!"
ia = sys.intern(a)
ib = sys.intern(b)
print(f"intern 前: a is b -> {a is b}")
print(f"intern 后: ia is ib -> {ia is ib}")
```

运行结果：

```text
intern 前: a is b -> True
intern 后: ia is ib -> True
```

驻留是处理大量重复字符串的实际手段——比如日志解析中反复出现的状态码字符串，驻留后比较走对象标识，省内存又快。但要明确，这是你**主动**请求的优化，不是默认行为。

**关键点**

- 字符串的 `is` 结果受驻留机制影响，同样不稳定、不可预测。
- 比较字符串内容永远用 `==`；只有在显式 `intern` 后想用对象标识做快速判等时，才用 `is`。

### 2.6 用 `is` 判断 `None`：经典用法

`None` 是 Python 里最重要的单例——全程序只有一个 `None` 对象。所以判断一个值是不是 `None`，正确姿势就是 `x is None`，而不是 `x == None`。这不是风格偏好，是有实际原因的。

**为什么必须用 `is None`**

`None` 是单例，`is None` 直接比较对象标识，绝对不会出错。而 `==` 可以被类重载，要是有个类把 `__eq__` 写得很奇怪，`== None` 就会被它劫持，给出错误的结果：

```python
class Weird:
    def __eq__(self, other):
        return True            # 和任何东西比都返回 True
w = Weird()
print(f"w == None -> {w == None}")     # True！被 __eq__ 劫持
print(f"w is None -> {w is None}")     # False，is 不受重载影响
```

运行结果：

```text
w == None -> True
w is None -> False
```

`is None` 因为不可重载，在任何情况下都准确反映"是否真的是 None"。所以 PEP 8 明确要求：判断 `None` 用 `is`，判断"不是 None"用 `is not None`。

**常见用法对比**

```python
# 判断 None
val = None
if val is None:
    print("val 是 None")       # 推荐
if val == None:
    print("val 是 None（不推荐）")  # 能跑但不可靠

# 判断不是 None
data = [1, 2, 3]
if data is not None:
    print(f"data = {data}，正常使用")
```

运行结果：

```text
val 是 None
data = [1, 2, 3]，正常使用
```

**可选参数默认 `None` 的判断**

函数用 `None` 做"没传参数"的标志时，必须用 `is None` 来区分"没传"和"传了空值"：

```python
def greet(name=None):
    if name is None:           # 用 is None 区分“没传”和“传了空值”
        name = "陌生人"
    print(f"你好，{name}")
greet()           # 没传 -> 陌生人
greet("小明")      # 显式传值
greet("")         # 传了空串：空串不是 None，不会被替换
```

运行结果：

```text
你好，陌生人
你好，小明
你好，
```

如果这里用 `if not name:` 代替 `if name is None:`，那么传 `""` 或 `0` 都会被当成"没传"，语义就错了——这是 `is None` 区分"空值"和"缺省值"的核心价值。

**`True` / `False` 也是单例**

和 `None` 一样，`True`/`False` 是单例，技术上也能用 `is` 判断：

```python
flag = True
print(f"flag is True -> {flag is True}")   # True，单例
```

运行结果：

```text
flag is True -> True
```

但实际编码中很少需要写 `if flag is True:`，直接 `if flag:` 就够了。`is True` 这种写法一般在需要严格区分"真值"和"就是 True 本身"时才有意义（比如 `1 is True` 是 `False`，因为 `1` 不是 `True` 这个对象）。

### 2.7 运算符优先级与结合性

身份运算符的优先级与比较运算符（`==`、`!=`、`in`）处在同一层，低于算术和位运算，高于布尔逻辑（`and`、`or`、`not`）。和这些运算混用时，有一个特别容易踩的坑——**连续比较**。

Python 支持链式比较，`a is b == c` 不会被理解成"(a is b) 和 (b == c) 的比较结果"，而是被折叠成 `(a is b) and (b == c)`。这本是个便利特性，但一旦你不小心把 `is` 和 `==` 写在一行，就会出现预料之外的结果：

```python
a = [1, 2, 3]
b = a
# 想表达“a is b” 和 “id(a)==id(b)” 结果一致，错误写法：
print(f"a is b == (id(a)==id(b)): {a is b == (id(a) == id(b))}")
```

运行结果：

```text
a is b == (id(a)==id(b)): False
```

结果居然是 `False`！因为 `a is b == (id(a)==id(b))` 被当成连续比较 `(a is b) and (b == (id(a) == id(b)))`，后面 `b == True` 是 `[1,2,3] == True`，结果 `False`，整体就 `False` 了。正确写法是显式加括号：

```python
print(f"结果一致: {(a is b) == (id(a) == id(b)))")
```

运行结果：

```text
结果一致: True
```

**最佳实践**

混用 `is` 和其他比较运算符时，一律显式加括号，不依赖连续比较的隐式规则。养成这个习惯，能避开一大类难以察觉的 `is` 相关 bug。

---

## 3. 最佳实践

### 3.1 `is` 的正当用途：`None` 和单例

身份运算符的合理使用范围其实很窄——主要就是判断 `None`、`True`/`False` 这类单例，以及偶尔确认对象是否被意外共享。在这些场合用 `is` 是正确而专业的做法。

| 场景 | 推荐写法 | 不推荐写法 | 原因 |
|------|---------|-----------|------|
| 判 `None` | `x is None` | `x == None` | `==` 可被重载，`is` 最可靠 |
| 判非 None | `x is not None` | `not x is None` | 前者优先级清晰 |
| 区分缺省与空值 | `if x is None:` | `if not x:` | 后者把空串/0/空列表都当假 |
| 比较值 | `x == y` | `x is y` | 值比较要 `==` |
| 比较整数/字符串 | `x == y` | `x is y` | 缓存机制让 `is` 不可靠 |
| 自定义单例/哨兵 | `obj is UNSET` | `obj == UNSET` | 单例同一性更精确 |

```python
# 推荐写法集
if data is None:           # 判 None
    ...
if data is not None:       # 判非 None
    ...
if a == b:                 # 值比较
    ...
```

### 3.2 区分 `None` 与空容器：用 `is None` 而非 `if not x`

`if not x:` 会把 `None`、`[]`、`""`、`0`、`0.0` 全部当成"假"，无法区分"没有数据"和"有数据但为空"。当函数支持 `None` 作为缺省标记时，必须用 `is None`：

```python
def process(data=None):
    if data is None:           # 区分 None
        return "缺省：没有数据"
    if not data:               # 区分空容器
        return "空容器：有数据但为空"
    return f"正常数据：{data}"
print(process())            # None
print(process([]))          # 空列表
print(process([1, 2]))      # 有数据
```

运行结果：

```text
缺省：没有数据
空容器：有数据但为空
正常数据：[1, 2]
```

### 3.3 自定义单例：用 `is` 判断哨兵对象

当需要区分"未提供参数"和"提供了某种合法值"（包括 `None` 也合法）时，`None` 本身不够用，可以造一个全局唯一的哨兵对象，用 `is` 判断：

```python
class _Unset:
    def __repr__(self):
        return "UNSET"
UNSET = _Unset()            # 全局唯一实例作为哨兵

def update(value=UNSET):
    if value is UNSET:       # 用 is 判断是否未提供
        return "未提供参数"
    return f"值为 {value}"
print(update())             # 未提供
print(update(0))            # 0 也能正常传入（不会被误判）
```

运行结果：

```text
未提供参数
值为 0
```

这里 `0` 不会被当成"未提供"，因为它不 `is UNSET`。这正是 `is` 判断对象同一性的独特价值——它能在 `==` 会混淆的边界上做出准确区分。

### 3.4 常见错误模式

**错误一：把 `is` 当 `==` 用**

```python
a = 1000
b = 1000
# 错：以为 is 是更“严格”的 ==
if a is b:           # 不可靠，超出缓存可能 False
    print("相等")
# 对：
if a == b:           # 值比较正确用法
    print("相等（用 ==）")
```

运行结果：

```text
相等（用 ==）
```

**错误二：可变默认参数被 `is` 揪出共享 bug**

```python
def append_one(lst=[]):
    lst.append(1)
    return lst
r1 = append_one()
r2 = append_one()
print(f"r1 = {r1}, r2 = {r2}")
print(f"r1 is r2 -> {r1 is r2}")    # True！默认参数被复用，是 bug 源头
```

运行结果：

```text
r1 = [1, 1], r2 = [1, 1]
r1 is r2 -> True
```

`is` 在这里恰恰成了发现 bug 的工具——它揭示了"默认参数在多次调用间共享同一个列表对象"这一陷阱。正确写法是用 `None` 当占位符，函数内新建：

```python
def append_one_safe(lst=None):
    if lst is None:
        lst = []
    lst.append(1)
    return lst
print(f"safe: {append_one_safe()} is {append_one_safe()} -> {append_one_safe() is append_one_safe()}")
```

运行结果：

```text
safe: [1] is [1] -> False
```

**错误三：用 `== None` 判 None 被 `__eq__` 劫持**

```python
class AlwaysEqual:
    def __eq__(self, other):
        return True
obj = AlwaysEqual()
print(f"obj == None -> {obj == None}")   # True，被劫持了
print(f"obj is None -> {obj is None}")   # False，可靠
```

运行结果：

```text
obj == None -> True
obj is None -> False
```

凡是判 None，一律用 `is None`，避免被任意类的 `__eq__` 误导。

---

## 4. 原理：对象标识、`id()` 与缓存机制

身份运算符的所有"反直觉"，根源都在 Python 的对象模型——一切皆对象，每个对象有唯一标识。本节把这套机制讲透。

### 4.1 一切皆对象、每个对象有 `id`

在 Python 里，整数、字符串、列表、函数都是对象。每个对象在创建时获得一个唯一的身份标识，用内置函数 `id()` 可以查到。在 CPython 实现里，`id()` 返回的就是对象在内存中的地址。`a is b` 的实现就是比较这两个 `id` 是否相等：

```text
a = [1, 2, 3]      新建对象 A（id=A）
b = a              把 A 的引用赋给 b
c = [1, 2, 3]      新建对象 C（id=C）

a.is(b):  id(A) == id(A) -> True   （a、b 都指向 A）
a.is(c):  id(A) == id(C) -> False  （内容相同，对象不同）
```

这解释了为什么 `b = a` 之后 `a is b` 成立——赋值是传递引用，两个名字指向同一块内存；而 `c = [1,2,3]` 新建了一个对象，哪怕内容一样，`id` 也不同，`is` 自然 `False`。

`is` 不可重载正是因为它绕过了所有方法，直接读对象的 `id` 比较；`==` 则要调用 `__eq__`，可以被类任意改写。

### 4.2 小整数缓存：为什么 `is` 在小整数上"碰巧"成立

CPython 启动时会预创建一组小整数对象（默认 `[-5, 256]`），把它们放在一个数组里复用。每次用到这个范围内的整数，都返回同一个对象，而不是新建。所以在这个范围内 `a is b` 总是成立：

```python
for n in [-5, 256]:
    print(f"{n}: {n is n}")    # True，同一个对象
print(f"超出范围 257: {int('257') is int('257')}")    # 大概率 False
```

运行结果：

```text
-5: True
256: True
超出范围 257: False
```

这套缓存纯属性能优化——小整数在程序中出现频率极高，复用它们避免了大量小对象的创建和销毁。代价是给程序员一个错觉：`is` 在整数上有时"能用"。但它只在缓存范围内成立，超出范围就分家，所以**绝对不能依赖**。

`is` 的结果由"实际指向的对象"决定，而 Python 在背后会优化对象的分配。以下几个因素都会让 `is` 结果变得难以预测：

```text
影响 is 结果的隐藏因素
├── 小整数缓存：[-5, 256] 内总是同一对象
├── 编译期常量折叠：相同字面量表达式被合并成同一对象
├── 字符串驻留：相同字面量字符串被复用
└── 运行时新建：int()、拼接产生新对象，分家
```

只要这些因素混合在一起，`is` 的结果就不可预判。这也是为什么"比较数值一律用 `==`"是铁律。

### 4.3 字符串驻留：为什么字符串的 `is` 也不可靠

字符串虽然不像整数有固定范围的缓存，但 CPython 也会对部分字符串做**驻留**：把多个原本相等的字符串指向同一个对象，省内存也加速比较。哪些字符串会被驻留，取决于实现细节——标识符风格的字符串（只含字母/数字/下划线）通常会被自动驻留，含特殊字符或运行时拼接的就不一定。

```python
# 字面量常被驻留
print(f"'hi' is 'hi' -> {'hi' is 'hi'}")            # 常为 True
# 运行时拼接通常不驻留
part = "world"
built = "hello " + part
print(f"拼接 is 字面量 -> {built is 'hello world'}")  # 常为 False
```

运行结果：

```text
'hi' is 'hi' -> True
拼接 is 字面量 -> False
```

驻留是 CPython 省内存的优化，但因为它依实现而定，所以字符串上的 `is` 结果同样不稳定。需要让一批字符串共用对象时，用 `sys.intern` 主动驻留，把控制权拿回自己手里：

```python
import sys
# 大量重复字符串的场景，主动驻留省内存 + 加速 is 判等
statuses = ["200", "200", "404", "200", "404"]
interned = [sys.intern(c) for c in statuses]
# 驻留后相同值是同一对象，可以用 is 做高速判等
print(f"intern 后 '200' is '404' -> {interned[0] is interned[2]}")  # False
print(f"intern 后 两个 '200' -> {interned[0] is interned[1]}")      # True
```

运行结果：

```text
intern 后 '200' is '404' -> False
intern 后 两个 '200' -> True
```

### 4.4 `is` 比 `==` 快：何时这是个理由

因为 `is` 只比较 `id`（一条指针比较指令），而 `==` 可能要调用 `__eq__` 做完整的值比较，所以对长字符串、大列表等"值比较很贵"的对象，`is` 确实更快。但"更快"不能滥用——只有在确实知道两份是同一对象时，`is` 才有用。典型场景就是上面 `sys.intern` 之后用 `is` 代替 `==` 做字符串判等，那是个有真实收益的优化。除此之外，绝大多数场景选 `==` 就是对的，不该为了"快"把它们换成 `is`。

---

## 5. 总结

本文围绕身份运算符展开，主要介绍了以下内容：

- 身份运算符只有 `is` 和 `is not` 两个，判断两个变量是否指向同一个对象，依据是 `id()` 是否相等
- `is` 判断对象同一性，`==` 判断值是否相等；`==` 可被 `__eq__` 重载，`is` 永远不可重载
- 值相等未必同一对象，同一对象值一定相等——记住"值比较用 `==`，对象同一性用 `is`"
- 小整数缓存（`[-5, 256]`）和编译期常量折叠会让 `is` 在整数上"碰巧"成立，但超出范围或不满足折叠条件就分家，所以比较数值永远用 `==`
- 字符串驻留（intern）让字符串的 `is` 同样不可靠，比较内容用 `==`，需要共用对象时显式 `sys.intern`
- 判断 `None` 必须用 `is None` / `is not None`，因为 `==` 会被自定义类的 `__eq__` 劫持导致误判
- `is` 的正当用途：判 `None`/单例、用 `None` 区分缺省值与空值、自定义哨兵对象、排查可变默认参数的共享 bug
- `is` 比 `==` 快，但只有在已知两份是同一对象时（如 intern 后）才有意义，不要为追求性能滥用
