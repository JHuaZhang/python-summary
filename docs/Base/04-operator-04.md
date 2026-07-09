---
group:
  title: 【04】运算符和表达式
  order: 4
order: 4
title: 值相等与引用相等
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是值相等与引用相等

「相等」在 Python 里不是一个概念,而是两个:`==` 与 `is`。它们看起来都判断"相等",语义却截然不同,这是新手最容易混淆、也是引发隐蔽 bug 最多的地方之一。

- **值相等 `==`**:比较两个对象的**内容(值)是否相同**。`[1, 2] == [1, 2]` 为 `True`——两个列表虽然不是同一个对象,但内容一样,所以"值相等"。
- **引用相等 `is`**:比较两个对象**是否是同一个对象**(身份是否相同,即内存地址是否相同)。`[1, 2] is [1, 2]` 为 `False`——两个列表是各自创建的不同对象,即便内容一样,也不是"同一个",所以"引用不相等"。

```python
a = [1, 2]
b = [1, 2]
print(a == b)    # True  —— 值相等:内容都是 [1, 2]
print(a is b)    # False —— 引用相等:是两个不同的列表对象(地址不同)
print(id(a))     # 地址 A
print(id(b))     # 地址 B(不同),is 比的就是这个地址
```

理解两者的关键,是建立 Python 的"对象身份"概念。每个对象在内存中有一个唯一身份(identity),可用 `id(obj)` 获取(在 CPython 里就是对象的内存地址)。`is` 比较的就是两个名字是否指向**同一个身份**(同一个 `id`),与对象内容无关;而 `==` 比较的是对象**内容**是否相等,与身份无关。一句话锚定:**`is` 比"是不是同一个东西",`==` 比"长得一不一样"**。

`is` 与 `==` 的差异最直观地体现在"修改一边是否影响另一边"的行为上,这正源于引用相等背后的共享关系:

```python
# is 相等 → 是同一个对象 → 改一个影响另一个
a = [1, 2]
b = a            # b 和 a 指向同一个列表(is 相等)
b.append(3)
print(a)         # [1, 2, 3] —— a 也变了!因为是同一个列表

# == 相等但 is 不等 → 不是同一个对象 → 互不影响
a = [1, 2]
b = [1, 2]       # b 内容和 a 一样(== 相等),但是新列表(is 不等)
b.append(3)
print(a)         # [1, 2] —— a 不变,因为是两个独立列表
```

`a is b` 为 `True` 意味着 `a`、`b` 是同一个列表,改 `b` 即改 `a`;`a == b` 为 `True` 但 `a is not b` 意味着两个独立列表恰好内容相同,改 `b` 不影响 `a`。这条"修改副作用"的差异,是引用相等与值相等最实用的分水岭——它直接关系到可变对象共享会不会出 bug。

Python 相等比较与 C/Java 的一个重要区别:**Python 默认的 `==` 对大多数内置容器做"逐元素深度值比较"**。`[1, 2] == [1, 2]` 在 Python 是 `True`(列表的 `==` 比较每个元素);而在 Java 里 `new int[]{1,2}.equals(new int[]{1,2})` 默认比的是引用(为 `false`,数组 `equals` 不比内容),要 `Arrays.equals` 才比值。Python 让 `==` 默认"比值",这更符合直觉,但也需要理解其背后是调用 `__eq__` 方法实现的,以及何时会退化为比引用(自定义类没写 `__eq__` 时)。本篇要讲透这套机制。

本篇要系统讲透:值相等 `==` 与引用相等 `is` 的区别、`id()` 与身份、可变与不可变对象的相等行为差异、`==` 退化为比引用的情况(自定义类)、`None`/`bool`/小整数等"字面量缓存"现象、`is` 的正确使用场景(单例判断)、`__eq__` 与 `__hash__` 的耦合,以及浮点、`nan`、嵌套容器等特殊相等行为。这是「运算符与表达式」大章节的第四篇,与《变量赋值机制》(讲引用模型)、《逻辑运算符与短路求值》(讲比较运算符返回 bool)互为补充。

### 1.2 `==` 与 `is` 对照表

下面这张表是本篇的总纲,后续每节逐一展开。先建立全局对照。

| 维度 | `==` 值相等 | `is` 引用相等 |
|------|-------------|---------------|
| 比较对象 | 内容(值) | 身份(内存地址/id) |
| 实现机制 | 调用 `__eq__` 方法 | 比较 `id(a) == id(b)` |
| 可重载 | ✅ 自定义类写 `__eq__` | ❌ 不能重载 `is` |
| `[1,2] == [1,2]` | `True` | `False`(两个不同对象) |
| `a = []; b = a; a is b` | `True`(同对象) | `True` |
| 改一边影响另一边? | 不一定(取决于是否同对象) | `is True` 则会 |
| `None` 判断推荐 | `x == None` 不推荐 | ✅ `x is None`(单例) |
| `float('nan')` | `nan == nan` → `False` | `nan is nan` → `True`(同对象) |

核心认知三点:① `==` 比"内容"、`is` 比"身份";② `==` 调 `__eq__` 可重载,`is` 比 `id` 不可重载;③ 单例(`None`、`True`、`False`)用 `is`,内容值用 `==`。表中几行反直觉的用例(缓存、nan)后续章节会逐一拆解。

### 1.3 身份(id)与值(value):对象的三要素

要彻底分清 `==` 与 `is`,需回到 Python 对象的三要素(详见《变量赋值机制》):每个对象有**身份(identity)、类型(type)、值(value)**三个根本属性。

- **身份(identity)**:对象的唯一标识,`id(obj)` 获取。CPython 中即对象在内存中的地址。身份在对象生命周期内不变,**`is` 比较的就是身份**。
- **类型(type)**:`type(obj)` 获取,决定对象能做什么操作。
- **值(value)**:对象承载的数据。`==` 比较的就是值(通过 `__eq__` 定义何为"值相等")。

```python
a = [1, 2]
b = [1, 2]
print(id(a))         # 地址 A —— a 的身份
print(id(b))         # 地址 B —— b 的身份(A ≠ B)
print(type(a))       # <class 'list'> —— 类型相同
# 值:a 的值是 [1,2],b 的值也是 [1,2]
print(a == b)        # True —— 值相等
print(a is b)        # False —— 身份不同(id 不同)
```

`a`、`b` 身份不同(两个列表对象,地址各异),但值相同(内容都是 `[1, 2]`)、类型相同(都是 list)。所以 `a == b` 为 `True`(值相等),`a is b` 为 `False`(身份不同)。**`is` 等价于 `id(a) == id(b)`**——这是理解 `is` 的底层定义:

```python
a = [1, 2]
b = a
print(a is b)          # True
print(id(a) == id(b))  # True —— is 本质就是比 id
```

⚠️ 虽然理论上 `a is b` 等价 `id(a) == id(b)`,但**判断同对象应直接用 `is`,不要写 `id(a) == id(b)`**——`is` 更清晰、更高效(直接比指针,不调用函数),且语义明确。`id()` 主要用于调试观察身份,不用于相等判断。

理解"身份(id)与值(value)分离",就抓住了 `==` 与 `is` 的本质:`==` 看值(可重载、可不同对象得 True),`is` 看身份(不可重载、只有同对象才 True)。后续的可变/不可变行为差异、缓存现象、`__eq__` 退化,都建立在这套身份-值分离之上。

---

## 2. 核心内容

本章详解 `==` 与 `is` 的完整用法与各种相等行为,每节遵循"规则 → demo → 陷阱 → 场景"展开。

### 2.1 值相等 `==`:内容比较

`==` 比较两个对象的**值(内容)**是否相等,由类型的 `__eq__` 方法定义"何为相等"。

**内置类型的值相等**:Python 内置容器(列表、元组、字典、集合)的 `==` 做**逐元素/逐键值深度比较**,两个内容相同的独立对象 `==` 为 `True`:

```python
# 列表:逐元素比较
print([1, 2, 3] == [1, 2, 3])      # True —— 内容相同(虽是不同列表)
print([1, 2, 3] == [1, 2, 4])      # False —— 第三个元素不同
print([1, 2] == (1, 2))            # False —— 类型不同(list vs tuple)

# 元组:同样逐元素
print((1, 2) == (1, 2))            # True
print((1, 2) == (1, 2, 3))         # False —— 长度不同

# 字典:逐键值对比较(与顺序无关)
print({"a": 1, "b": 2} == {"b": 2, "a": 1})  # True —— 键值相同,顺序无关
print({"a": 1} == {"a": 1, "b": 2})          # False —— 键数量不同

# 集合:元素相同即相等(集合本就无序)
print({1, 2, 3} == {3, 2, 1})      # True
```

⚠️ **不同类型的 `==` 通常为 `False`,但数值类型跨类型可相等**:列表和元组内容相同 `==` 也为 `False`(类型不同),但 `1 == 1.0`、`1 == True` 为 `True`(数值跨类型比较):

```python
print([1, 2] == (1, 2))     # False —— list 与 tuple 类型不同
print({1: 2} == [(1, 2)])   # False —— dict 与 list 类型不同
print(1 == 1.0)             # True —— int 与 float 数值相等
print(1 == True)            # True —— bool 是 int 子类,True==1
print(0 == False)           # True —— False==0
```

数值类型(`bool`、`int`、`float`、`complex`)跨类型 `==` 会做数值提升比较,`1 == 1.0 == True` 都为 `True`。这是"数值塔"的体现。但容器跨类型(`list` vs `tuple`)即使内容相同也为 `False`——容器 `__eq__` 先比类型。

**字符串的值相等**:

```python
print("hello" == "hello")    # True —— 内容相同
print("hello" == "world")    # False
print("Hello" == "hello")    # False —— 大小写敏感
```

str 的 `==` 比字符序列,大小写敏感。注意 `==` 在 str 上比的是值不是身份(即便两个 str 是不同对象,内容同则 `==` 为 True,见 §2.5 驻留机制)。

**`==` 是可重载的**:类型的 `__eq__` 方法定义 `==` 行为。自定义类默认 `==` 退化比引用(§2.4),内置类型的 `__eq__` 已实现值比较。

### 2.2 引用相等 `is`:身份比较

`is` 比较两个对象**是否是同一个对象**(身份/id 是否相同),与内容无关,**不可重载**。

```python
a = [1, 2, 3]
b = a                    # b 和 a 指向同一个列表对象
c = [1, 2, 3]           # c 是内容相同的新列表

print(a is b)            # True —— a、b 是同一个对象
print(a is c)            # False —— a、c 是不同对象(虽内容相同)
print(a == c)           # True —— 但内容相同
```

`a is b` 为 `True`(同对象,`b = a` 让 b 指向了 a 的对象),`a is c` 为 `False`(c 是新建的,与 a 不同对象),但 `a == c` 为 `True`(内容相同)。这组对比完整展示了"同对象(is)→ 内容必相等;内容相等(==)≠ 同对象"。

**`is` 等价 `id` 比较**:

```python
a = [1, 2]
b = a
print(a is b)            # True
print(id(a) is id(b))    # 错误示例!id() 返回 int,is 比的是两个 int 对象
# 正确等价形式:
print(id(a) == id(b))    # True —— id 相同
```

⚠️ 注意 `id(a) is id(b)` 是错误写法:`id()` 返回的是 int,而每次调用 `id()` 可能返回**新的 int 对象**(大整数不缓存),所以 `id(a) is id(b)` 即便 `a is b` 也可能为 `False`。`is` 的正确等价是 `id(a) == id(b)`(比 int 的值),但如前所述,判断同对象直接用 `is` 即可,无需绕道 `id`。

**`is not` 取反**:

```python
a = [1, 2]
b = [1, 2]
print(a is not b)        # True —— a、b 不是同一对象
```

`is not` 是 `is` 的取反(合为一个运算符,优先级与 `is` 相同),比 `not (a is b)` 更推荐(更清晰、CPython 解析更直接)。

**`is` 不可重载**:`is` 比较的是 C 层的指针(身份),不调用任何 Python 方法,因此**类型无法改变 `is` 的行为**。这与 `==`(调 `__eq__`,可重载)是根本区别:

```python
class Foo:
    def __eq__(self, other):
        return True       # 让 == 永远为 True
    # 但无法重载 is —— is 仍比身份

a = Foo()
b = Foo()
print(a == b)             # True —— __eq__ 让 == 为 True
print(a is b)             # False —— is 不受影响,仍比身份(a、b 不同对象)
```

Foo 重载了 `__eq__` 让 `==` 恒为 `True`,但 `is` 不受影响,`a is b` 仍是 `False`(a、b 是两个不同对象)。`is` 的不可重载性,使它成为"绝对可靠的身份判断"——无论类型怎么定义 `__eq__`,`is` 永远只看是不是同一个对象。

### 2.3 可变对象 vs 不可变对象的相等行为

可变与不可变类型在相等比较上的行为不同,理解这层差异能解释大量"为什么 `==` 为 True 还会出 bug"的困惑。

**不可变对象(数值、str、tuple、frozenset)**:值相等通常意味着"可互换使用",`==` 比较纯粹看值:

```python
print(1 == 1)               # True —— int 值相等
print("abc" == "abc")       # True —— str 值相等
print((1, 2) == (1, 2))     # True —— tuple 值相等
print((1, [2]) == (1, [2])) # True —— 元组含可变元素,仍逐元素比较(列表值相等)
```

不可变对象的 `==` 行为直观:值相同即 `True`。tuple 虽不可变,但若含可变元素(如 `(1, [2])`),`==` 仍递归比较内部可变对象的值(`[2] == [2]`)。

**可变对象(list、dict、set)**:`==` 仍比内容,但"两个内容相同的可变对象是独立对象,改一个不影响另一个":

```python
a = [1, 2]
b = [1, 2]
print(a == b)               # True —— 内容相同
b.append(3)                 # 改 b
print(a)                    # [1, 2] —— a 不变(独立对象)
print(a == b)               # False —— 内容不再相同

# 对比:is 相等的可变对象才会联动
a = [1, 2]
b = a                       # 同对象
b.append(3)
print(a)                    # [1, 2, 3] —— a 也变了(is 相等的联动)
```

⚠️ **可变对象最大的陷阱:`==` 为 True 也不代表安全共享**。两个 `==` 相等的 list 是独立对象,改一个不影响另一个;但若误以为"`==` 相等就是同一个"而去共享,或反之误以为"$a = b$ 后 $a == b$ 但独立"——都会出 bug:

```python
# 陷阱:以为 == 相等就是同一个,误判共享状态
def buggy(cart1, cart2):
    if cart1 == cart2:          # 只看内容相等
        cart1.append("gift")
        return cart2            # 以为 cart2 也会收到 gift —— 错!
    return cart2

c1 = ["item"]
c2 = ["item"]
print(buggy(c1, c2))        # ['item'] —— c2 没收到 gift(c1、c2 是独立的)
```

判断"改一个会不会影响另一个"必须看 `is`(是否同对象),不能看 `==`(内容是否相同)。这是可变对象共享逻辑的核心守则:**辨副作用看 `is`,辨内容看 `==`**。

### 2.4 `==` 退化为比引用:自定义类默认行为

自定义类若**不重载 `__eq__`**,其 `==` 退化为**比身份**(等价 `is`),这是新手常困惑的"我两个对象内容一样,为什么 `==` 是 False"的根因。

```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

p1 = Point(1, 2)
p2 = Point(1, 2)            # 内容与 p1 完全一样
print(p1 == p2)            # False! —— 没重载 __eq__,== 退化为比身份
print(p1 is p2)            # False —— 本来就不是同对象
# 所以 p1 == p2 与 p1 is p2 都是 False(退化后 == 等价 is)
```

`Point` 没定义 `__eq__`,所以 `p1 == p2` 退化为 `object.__eq__` 的默认行为——比身份(等价 `is`)。两个不同对象即便内容相同,`==` 也为 `False`。这与内置类型(如 list 有自己的 `__eq__` 比内容)不同。

**重载 `__eq__` 让自定义类比值**:

```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y
    def __eq__(self, other):
        if not isinstance(other, Point):
            return NotImplemented      # 交由对方尝试,或最终 False
        return self.x == other.x and self.y == other.y
    def __repr__(self):
        return f"Point({self.x}, {self.y})"

p1 = Point(1, 2)
p2 = Point(1, 2)
print(p1 == p2)            # True —— 重载后按 x、y 比值
print(p1 is p2)            # False —— 仍不是同对象
```

重载 `__eq__` 后,`p1 == p2` 按属性 `x`、`y` 比较为 `True`。注意:

- `__eq__` 返回 `NotImplemented`(不是 `False`)表示"本类型不知道怎么和 other 比",交由 other 的 `__eq__` 尝试,更灵活(支持对称比较)。
- `isinstance` 检查避免和无关类型(如 `Point(1,2) == 5`)误判为真。

⚠️ **`@dataclass` 与 `NamedTuple` 自动生成 `__eq__`**:手写 `__eq__` 繁琐,`dataclass` 默认生成逐字段值比较的 `__eq__`:

```python
from dataclasses import dataclass

@dataclass
class Point:
    x: int
    y: int

p1 = Point(1, 2)
p2 = Point(1, 2)
print(p1 == p2)            # True —— dataclass 自动生成按字段比较的 __eq__
print(p1 is p2)            # False
```

`@dataclass` 默认 `eq=True`,自动生成 `__eq__`(以及 `__ne__`、`__repr__`),按字段逐个比较。这是现代 Python 定义"值对象"的推荐方式,避免手写 `__eq__` 的样板。详见《面向对象 OOP 全套》。

### 2.5 整数缓存与字符串驻留:`is` 的"假阳性"陷阱

理论上"`10 == 10` 为 True,`10 is 10` 不一定"——因为两次出现的 `10` 可能是不同对象。但实际你测 `10 is 10` 总是 `True`!这是 Python 的**缓存机制**造成的 `is` "假阳性",是最经典的认知陷阱。

**小整数缓存(small integer caching)**:CPython 启动时**预创建 `-5` 到 `256` 的所有 int 对象并缓存**,凡用到这个范围的整数,都复用同一个缓存对象。因此这个范围内的 int,无论怎么创建,`is` 都为 `True`:

```python
a = 100
b = 100
print(a is b)        # True —— 100 在 [-5, 256] 缓存内,复用同对象

a = 300
b = 300
print(a is b)        # False! —— 300 超出缓存,是两个不同对象(某些环境)
print(a == b)        # True —— 但值相等

# 但同一代码块里的字面量可能被编译器进一步优化
a = 300; b = 300     # 同一行/同一编译单元,可能 peephole 优化成同对象
print(a is b)        # True(交互式下可能 False,取决于编译优化)
```

⚠️ **`is` 对 int 的判断不可靠且依赖实现**:小整数缓存和编译器优化(常量折叠、peephole)让 `a is b` 在不同环境、不同写法下结果不同(交互式 REPL、脚本文件、不同 Python 实现如 PyPy 行为各异)。所以**判断整数相等必须用 `==`,绝不用 `is`**——`is` 的"假阳性"(小整数恰好同对象)会让你误以为 `is` 可靠,但超出范围或换个环境就翻车。

```python
# 危险:用 is 判断整数"相等"
x = 600
if x is 600:          # 可能 False(600 不缓存)!逻辑出错
    ...
# 正确:用 ==
if x == 600:
    ...
```

**字符串驻留(string interning)**:类似地,Python 会对**看起来像标识符的字符串**(含字母数字下划线)做驻留——编译期确定相同的字面量字符串复用同一对象。这导致 `is` 在 str 上也"有时为 True":

```python
a = "hello"
b = "hello"
print(a is b)        # True —— "hello" 像标识符,被驻留,复用同对象

a = "hello world!"   # 含空格和!,不像标识符
b = "hello world!"
print(a is b)        # False(字面量,可能)或 True —— 取决于驻留策略,不可靠
print(a == b)        # True —— 值相等才可靠
```

驻留规则复杂(标识符样 str、短 str、`sys.intern` 显式驻留等),不同环境结果不同。**判断 str 相等也必须用 `==`,不用 `is`**。`is` 在 str 上的"假阳性"同样依赖实现。

**总结缓存现象**:小整数缓存、字符串驻留、`None`/`True`/`False` 单例,都是 Python 为性能复用对象的机制。它们让 `is` 在这些类型上"看起来能用",构成危险的"假阳性"——你测试时刚好为 True,换个数/换个环境就 False。铁律:**`is` 只用于身份判断(单例、是否同一可变对象),数值/字符串的内容相等一律用 `==`**。

### 2.6 `None` 与单例判断:`is` 的正确用法

`is` 最正当、最该用的场景是判断**单例(singleton)**——全程序唯一的对象,典型是 `None`、`True`、`False`。判断单例必须用 `is`,不用 `==`。

**`None` 判断用 `is None`**:

```python
x = None
print(x is None)        # True  —— 推荐
print(x == None)        # True  —— 不推荐(虽通常也对,但有坑)
print(x is not None)    # True  —— 非 None 判断

# is None 的优势:不受 __eq__ 重载影响
class Weird:
    def __eq__(self, other):
        return True       # 这个类的 == 永远返回 True

w = Weird()
print(w == None)          # True! —— 被 __eq__ 骗了,误判 w 是 None
print(w is None)          # False —— is 不受影响,正确判断 w 不是 None
```

⚠️ **为何 `None` 判断必须用 `is` 而非 `==`**:`x == None` 依赖 `x` 的 `__eq__`,若 `x` 是个重载了 `__eq__` 的奇怪对象(如上 `Weird` 让 `==` 恒真),`x == None` 会错误地返回 `True`。而 `x is None` 比**身份**,`None` 是单例(全程序只有一个 None 对象),`x is None` 只有 `x` 真的是那个 None 时才 True,不受任何 `__eq__` 干扰——**绝对可靠**。PEP 8 也明确规定:与单例的比较用 `is`/`is not`,不用 `==`。

**布尔单例判断**:

```python
flag = True
print(flag is True)     # True —— True 是单例
print(flag is False)    # False

# 但通常直接用真值测试,不写 is True
if flag:                # 比 if flag is True: 更 Pythonic(但语义略不同,见下)
    ...
```

`True`/`False` 也是单例,理论上判断可用 `is`。但更推荐**真值测试**(`if flag:` 而非 `if flag is True:`),除非你需要**严格区分 `True` 与其他真值**(如 `1`、非空列表都是真值但不是布尔 `True`):

```python
# 真值测试:1、"yes"、[1] 都算真(不区分类型)
if value:               # value 为 1、"yes"、[1]、True 都进
    ...
# 严格布尔判断:只接 True,不接 1 等
if value is True:       # 只 value 恰好是 True 才进(1 不进)
    ...
```

`if value:` 与 `if value is True:` 语义不同:前者接受所有真值(`1`、`"yes"`、`True`),后者只接受布尔 `True`。需要"只判断真正的布尔 True"时用 `is True`(少见),一般用真值测试。详见《bool 类型与短路逻辑》。

⚠️ **特殊场景下 `== None` 的陷阱:NumPy 数组**:

```python
import numpy as np
arr = np.array([1, 2, 3])
# arr == None  会报错或返回数组!
# ValueError: 数组比较返回数组,无法用于 if
# 而 arr is None  安全返回 False
print(arr is None)      # False —— 安全
```

NumPy 数组的 `==` 被重载为逐元素比较,`arr == None` 返回的是数组(或报错),不能用于 `if`。而 `arr is None` 安全返回 `False`。所以处理可能的数组时,`is None` 是唯一可靠判空方式。这是 `is None` 相对 `== None` 的又一实战优势。

### 2.7 `==` 与 `__hash__` 的耦合:可哈希与字典键

`==` 和 `__hash__` 是一对耦合的方法:若两个对象 `==` 相等,它们的 `__hash__` **必须**相等(否则字典/集合会出错——相等的对象却散列到不同桶,找不到)。这条契约直接影响对象能否做 dict 键、set 元素。

**可哈希契约**:`a == b` → `hash(a) == hash(b)` 必须成立。反之不要求(hash 相同不代表 `==` 相等,那是哈希冲突,正常)。

```python
# int:1 == 1.0 → hash(1) == hash(1.0)
print(1 == 1.0)             # True
print(hash(1) == hash(1.0)) # True —— __hash__ 一致,契约满足
print({1: "a"}[1.0])        # 'a' —— 1 和 1.0 在 dict 里是同一个键!因 == 且 hash 都相等
```

`1` 和 `1.0` `==` 相等且 `hash` 相等,所以在 dict 里是同一个键(`{1: "a"}[1.0]` 能取到 `'a'`)。这正是"相等对象 hash 必相等"契约的体现。

**自定义类重载 `__eq__` 必须同时重载 `__hash__`**:一旦你定义了 `__eq__`,Python 会把类的 `__hash__` 设为 `None`(使对象**不可哈希**),除非你显式定义 `__hash__`:

```python
class Point:
    def __init__(self, x, y): self.x, self.y = x, y
    def __eq__(self, other):
        return isinstance(other, Point) and (self.x, self.y) == (other.x, other.y)
    # 没定义 __hash__ → __hash__ 被设为 None → 不可哈希

p = Point(1, 2)
# d = {p: "value"}        # TypeError: unhashable type —— 重载 __eq__ 后不可哈希!
```

⚠️ 定义 `__eq__` 却忘了 `__hash__`,对象就突然不能做 dict 键/set 元素了。修复:

```python
class Point:
    def __init__(self, x, y): self.x, self.y = x, y
    def __eq__(self, other):
        return isinstance(other, Point) and (self.x, self.y) == (other.x, other.y)
    def __hash__(self):
        return hash((self.x, self.y))   # 与 __eq__ 一致:相等对象的元组也相等,hash 一致

p1 = Point(1, 2)
p2 = Point(1, 2)
print(p1 == p2)            # True
print(hash(p1) == hash(p2))# True —— __hash__ 与 __eq__ 一致,契约满足
d = {p1: "value"}
print(d[p2])               # 'value' —— p2 能取到 p1 的值(因 == 相等且 hash 相等)
```

`__hash__` 要基于与 `__eq__` 相同的字段(这里 `(x, y)`),保证 `==` 相等的对象 hash 也相等。`@dataclass` 默认 `frozen=False` 时不可哈希(因可变),`frozen=True` 时自动生成一致的 `__hash__`,这是 dataclass 的便利。

**可变容器为何不可哈希**:list、dict、set 可变,其内容可变→若可哈希,内容改了 hash 就该变,但对象身份没变,会破坏"对象→hash 稳定"的假设,导致 dict/set 内部错乱。所以可变容器**不可哈希**(`hash([1,2])` 报 TypeError),不能做 dict 键/set 元素。不可变容器(tuple、frozenset)可哈希(前提是内部元素也可哈希)。

```python
# hash([1, 2])            # TypeError: unhashable type: 'list'
# {[1, 2]: "v"}          # TypeError —— list 不可哈希,不能做键
print(hash((1, 2)))       # 可哈希(元素都可哈希)
# hash((1, [2]))         # TypeError —— 元组含不可哈希元素 list,整个不可哈希
```

理解 `==` 与 `__hash__` 的耦合,是正确实现自定义值对象(能做 dict 键、能去重)的关键。详见《hash 与可哈希类型》。

### 2.8 浮点数与 nan 的相等特殊性

浮点数的相等比较有精度陷阱,`nan` 更是特殊——这俩是 `==`/`is` 行为最反直觉的部分。

**浮点 `==` 受精度影响**(详见《float 类型与精度问题》):

```python
print(0.1 + 0.2 == 0.3)     # False! —— float 精度误差
print(0.1 + 0.2)            # 0.30000000000000004
# float 相等比较应改用容差
import math
print(math.isclose(0.1 + 0.2, 0.3))  # True
```

`0.1 + 0.2 == 0.3` 为 `False`,因 float 精度误差。**float 的相等比较应避免 `==`,改用 `math.isclose`**(容差比较)。这是浮点相等的第一守则。

**`nan` 的特殊相等**:`nan`(Not a Number)最反直觉的特性——**`nan` 不等于任何值,包括它自己**(`nan == nan` 为 `False`):

```python
nan = float('nan')
print(nan == nan)          # False! —— nan 不等于自己
print(nan != nan)          # True —— 这是判 nan 的一种方式
print(nan is nan)          # True —— 但 is 比身份,nan 还是同对象
```

⚠️ 这里 `==` 和 `is` 给出相反结果:`nan == nan` 为 `False`(nan 不等于自身),但 `nan is nan` 为 `True`(是同一个 nan 对象)。这清楚展示了 `==` 比"值"、`is` 比"身份"的本质分歧——nan 的"值"被定义为"不等于任何",但它的"身份"仍是那个特定对象。

**判 `nan` 的正确方式**:因 `nan != nan` 为 `True`,可用 `x != x` 检测 nan;但更推荐 `math.isnan`:

```python
nan = float('nan')
# 方式一:利用 nan != nan
print(nan != nan)           # True —— 是 nan(但晦涩,不推荐)
# 方式二:math.isnan(推荐,清晰)
import math
print(math.isnan(nan))      # True —— 判 nan 最可靠清晰的方式
# 错误方式:用 ==
# if nan == float('nan'):   # 永远 False,判不出
```

判 nan **必须用 `math.isnan`**(或 `numpy.isnan`),绝不能用 `== float('nan')`(恒为 False)。这是 nan 处理的第一守则。详见《float 类型与精度问题》。

### 2.9 嵌套容器的深度值比较

Python 容器的 `==` 是**递归深度比较**——嵌套容器会逐层比较内部元素,直到不可再分。这让复杂的嵌套结构也能正确判断值相等。

```python
# 嵌套列表:逐层递归比较
print([[1, 2], [3, 4]] == [[1, 2], [3, 4]])   # True —— 外层逐元素,内层也逐元素
print([[1, 2], [3, 4]] == [[1, 2], [3, 5]])   # False —— 最内层 4 ≠ 5

# 字典嵌套
d1 = {"user": {"name": "alice", "age": 30}}
d2 = {"user": {"name": "alice", "age": 30}}
print(d1 == d2)            # True —— 递归比较嵌套 dict

# 混合类型嵌套
print([{"a": 1}, (2, 3)] == [{"a": 1}, (2, 3)])  # True —— list 含 dict、tuple,递归比较
print([{"a": 1}, (2, 3)] == [{"a": 1}, [2, 3]])  # False —— tuple != list(类型不同)
```

嵌套 `==` 递归到每一层,最终落到基本类型(数值、str)或不同类型比较。`[{"a":1}, (2,3)]` 与 `[{"a":1}, [2,3]]` 为 `False`,因第二个元素 `tuple` vs `list` 类型不同——递归比较到第二层时,(2,3) == [2,3] 因类型不同为 False。

⚠️ **`==` 是值比较不是结构比较,顺序敏感**:list/tuple 的 `==` 按顺序比,顺序不同则不等;dict/set 的 `==` 无序(键值集合相同即等)。

```python
print([1, 2, 3] == [3, 2, 1])        # False —— list 顺序敏感
print((1, 2, 3) == (3, 2, 1))        # False —— tuple 顺序敏感
print({"a": 1, "b": 2} == {"b": 2, "a": 1})  # True —— dict 顺序无关
print({1, 2, 3} == {3, 2, 1})        # True —— set 无序
```

理解嵌套容器的深度 `==`,就能正确处理配置对比、JSON 数据比较、缓存键等场景:同结构的值用 `==` 即可,无需手动逐字段比。详见《列表深度剖析》《字典深度剖析》。

### 2.10 综合示例:相等判断实战

下面这个片段集中演示 `==` 与 `is` 的典型用法与易错点,阅读时对照每段行为:

```python
import math

# 1. == 值相等 vs is 引用相等
print("=== 值相等 vs 引用相等 ===")
a = [1, 2, 3]
b = [1, 2, 3]
c = a
print(f"a == b: {a == b}, a is b: {a is b}")   # True, False
print(f"a == c: {a == c}, a is c: {a is c}")   # True, True

# 2. is 相等的副作用联动
print("=== 副作用联动 ===")
a = [1, 2]
b = a                       # is 相等
b.append(3)
print(f"改 b 后 a: {a}")      # [1, 2, 3](a 变了)
a = [1, 2]
b = [1, 2]                  # == 相等,is 不等
b.append(3)
print(f"改 b 后 a: {a}")      # [1, 2](a 不变)

# 3. 嵌套容器深度比较
print("=== 嵌套比较 ===")
print({"u": {"n": "a"}} == {"u": {"n": "a"}})  # True
print([1, (2, 3)] == [1, [2, 3]])               # False(tuple vs list)

# 4. 自定义类:== 退化为比引用
print("=== 自定义类 ===")
class Pt:
    def __init__(self, x, y): self.x, self.y = x, y
print(f"未重载: {Pt(1,2) == Pt(1,2)}")   # False(退化比引用)

from dataclasses import dataclass
@dataclass
class Pt2:
    x: int; y: int
print(f"dataclass: {Pt2(1,2) == Pt2(1,2)}")  # True(自动 __eq__)

# 5. 小整数缓存陷阱
print("=== 缓存陷阱 ===")
print(f"100 is 100: {100 is 100}")         # True(缓存内)
x, y = 600, 600
print(f"600 is 600: {x is y}, 600 == 600: {x == y}")  # 可能 False, True

# 6. None 单例判断
print("=== None 判断 ===")
val = None
print(f"val is None: {val is None}")       # True(推荐)
class Weird:
    def __eq__(self, o): return True
w = Weird()
print(f"w == None: {w == None}(被欺骗), w is None: {w is None}(可靠)")  # True, False

# 7. none 判断在数组场景
print("=== 数组判空 ===")
import numpy as np
arr = np.array([1, 2])
print(f"arr is None: {arr is None}")       # False(安全)

# 8. nan 特殊相等
print("=== nan ===")
nan = float('nan')
print(f"nan == nan: {nan == nan}, nan is nan: {nan is nan}")  # False, True
print(f"math.isnan(nan): {math.isnan(nan)}")   # True(推荐判 nan)

# 9. float 精度
print("=== float 精度 ===")
print(f"0.1+0.2 == 0.3: {0.1+0.2 == 0.3}")          # False
print(f"math.isclose(0.1+0.2, 0.3): {math.isclose(0.1+0.2, 0.3)}")  # True

# 10. == 与 hash 契约(1 和 1.0 是同一个 dict 键)
print("=== == 与 hash ===")
print(f"1 == 1.0: {1 == 1.0}, hash 相等: {hash(1) == hash(1.0)}")  # True, True
print({1: 'a'}[1.0])        # 'a'(1 和 1.0 同键)
```

跑一遍这段示例,对照输出:值相等 vs 引用相等、is 联动副作用、嵌套深度比较、自定义类退化与 dataclass、小整数缓存陷阱、None 单例判断(及 Weird/数组场景)、nan 的 `==` vs `is` 分歧、float 精度与 isclose、`==` 与 hash 契约(1 与 1.0 同键)——相等判断的完整图景就清晰了。核心结论:**`==` 比值(可重载、容器递归)、`is` 比身份(不可重载、单例判断);数值/字符串相等用 `==`、单例用 `is`;有副作用看 `is`、看内容用 `==`;float 用 isclose、nan 用 isnan;`1` 与 `1.0` 因 `==` 且 `hash` 等是同键**。

---

## 3. 最佳实践

### 3.1 判断单例用 `is`,判断内容用 `==`

```python
# 推荐:单例用 is
if x is None: ...
if x is not None: ...
if flag is True: ...     # 严格布尔(少见,一般用真值测试)

# 推荐:内容相等用 ==
if score == 100: ...
if name == "admin": ...
if data == expected: ...
```

**铁律**:`None`/`True`/`False` 等单例判断用 `is`/`is not`(PEP 8 规定),数值/字符串/容器内容相等用 `==`。这是最根本的相等判断准则,混用会引入 bug(`x == None` 被重载 `__eq__` 欺骗、`x is 600` 因缓存翻车)。

### 3.2 绝不用 `is` 比较数值和字符串

```python
# 错误:用 is 比整数(str 同理)
if count is 100: ...        # 100 在缓存内恰好 True,超范围就 False!
if name is "admin": ...     # 驻留恰好 True,不可靠

# 正确:用 ==
if count == 100: ...
if name == "admin": ...
```

小整数缓存(`[-5, 256]`)和字符串驻留让 `is` 在数值/str 上"假阳性",换数或换环境就翻车。数值和字符串的内容相等**一律用 `==`**,`is` 只用于身份判断。这条是最常见的 `is` 误用,务必警惕。

### 3.3 判断"修改联动"看 `is`,不看 `==`

```python
# 判断两个可变变量是否共享同一对象(改一个会影响另一个),用 is
a = [1, 2]
b = some_list
if a is b:                  # 同对象 → 改 b 会影响 a
    handle_shared()
# 不能用 ==:
# if a == b:                # 仅内容相同,可能是独立对象,改 b 不影响 a
```

"改一边是否影响另一边"取决于是否同对象(`is`),不取决于内容是否相同(`==`)。两个 `==` 相等的可变对象是独立的,互不影响。处理可变对象共享状态(缓存、别名、默认参数)时,用 `is` 判断别名关系。

### 3.4 自定义类要值比较,重载 `__eq__`(或用 dataclass)

```python
# 推荐:dataclass 自动生成 __eq__
from dataclasses import dataclass
@dataclass
class Point:
    x: int; y: int

# 或手写 __eq__(返回 NotImplemented 交由对方尝试)
class Point:
    def __init__(self, x, y): self.x, self.y = x, y
    def __eq__(self, other):
        if not isinstance(other, Point):
            return NotImplemented
        return (self.x, self.y) == (other.x, other.y)

# 不推荐:不重载 __eq__ → == 退化为比身份,内容相同的对象判不等
```

自定义类默认 `==` 比身份(内容相同的对象判不等,常违背预期)。需要值比较就重载 `__eq__`(返回 `NotImplemented` 处理类型不匹配),或用 `@dataclass`(自动生成按字段的 `__eq__`,推荐)。重载 `__eq__` 后别忘了 `__hash__`(§3.5)。

### 3.5 重载 `__eq__` 必须同时定义 `__hash__`

```python
class Point:
    def __init__(self, x, y): self.x, self.y = x, y
    def __eq__(self, other):
        return isinstance(other, Point) and (self.x, self.y) == (other.x, other.y)
    def __hash__(self):
        return hash((self.x, self.y))   # 基于 __eq__ 相同字段,保证契约

# 错误:只重载 __eq__ 不定义 __hash__ → 对象不可哈希,不能做 dict 键/set 元素
```

定义 `__eq__` 后 Python 自动把 `__hash__` 设为 `None`(不可哈希)。要让对象能做 dict 键/set 元素去重,必须同时定义 `__hash__`,且基于与 `__eq__` 相同的字段(保证 `a == b` → `hash(a) == hash(b)`)。`frozen=True` 的 dataclass 自动处理,可变 dataclass 不可哈希。

### 3.6 浮点相等用 `math.isclose`,不用 `==`

```python
# 推荐:容差比较
import math
if math.isclose(a, b): ...
if math.isclose(a, b, abs_tol=1e-9): ...   # 接近 0 加绝对容差

# 不推荐
if a == b: ...    # 0.1+0.2 == 0.3 会 False
```

float 有精度误差,`==` 几乎总会因误差失败。`math.isclose` 用相对容差(默认 1e-9)加可选绝对容差,是 float 比较的标准方式。详见《float 类型与精度问题》。

### 3.7 判 nan 用 `math.isnan`,不用 `==`

```python
# 推荐
if math.isnan(x): ...
# 或 numpy 数组
# if np.isnan(arr): ...

# 错误
# if x == float('nan'): ...   # 恒为 False(nan 不等于自身)
# if x != x: ...              # 虽能判但晦涩,不推荐
```

`nan` 不等于任何值(含自身),`== float('nan')` 恒为 False。判 nan 必须用 `math.isnan`(或 `np.isnan`)。这是 nan 处理的铁律,纳米混入数据会毒化计算,先 `isnan` 过滤。

### 3.8 处理可能的数组/对象,判空用 `is None`(避免 `== None` 翻车)

```python
# 推荐:is None 对所有类型安全
if value is None: ...

# 危险:== None 对 NumPy 数组等会报错或被 __eq__ 欺骗
# if value == None: ...   # NumPy: 返回数组/报错;Weird 对象: 被 __eq__ 骗成 True
```

`x == None` 依赖 `x.__eq__`,对重载 `==` 的类型(NumPy 数组返回数组导致 if 报错、奇怪对象返回 True)会翻车。`x is None` 比**身份**,对所有类型绝对可靠。处理来源不明的对象(可能数组、可能重载 `__eq__`),判空一律 `is None`。

### 3.9 容器相等注意顺序敏感性

```python
# list/tuple:顺序敏感
[1, 2, 3] == [3, 2, 1]     # False
# dict/set:顺序无关
{"a": 1, "b": 2} == {"b": 2, "a": 1}  # True
{1, 2, 3} == {3, 2, 1}     # True
```

list/tuple 的 `==` 按位置顺序比;dict/set 按键值/元素集合比(无序)。比较前确认数据结构的顺序语义:需要"顺序无关的相等"用 set/frozenset 或排序后比 list。详见《列表深度剖析》《集合与冻结集合》。

### 3.10 `id()` 仅用于调试,不用于相等判断

```python
# 调试用:观察身份
print(id(a), id(b))        # 看是否同地址(调试)

# 判断同对象:直接用 is,不要 id() == id()
# 不推荐:id(a) == id(b)  (绕弯,且 id() 返回 int 可能短暂存在导致误判)
# 推荐:a is b
```

`id()` 用于调试观察对象身份/地址。判断是否同对象直接用 `is`(更清晰、更高效、不会被 `id()` 返回值生命周期问题干扰)。不要用 `id(a) == id(b)` 代替 `is`。

### 3.11 `is not` 优于 `not ... is`

```python
# 推荐
if x is not None: ...

# 不推荐
if not x is None: ...      # 啰嗦,PEP 8 不推荐
```

`is not` 是合成的比较运算符,比 `not (x is None)` / `not x is None` 更清晰、更符合 PEP 8。同理 `not in` 优于 `not ... in`。

### 3.12 比较不同类型数值会"跨类型相等",注意 bool

```python
print(1 == 1.0)        # True —— 数值跨类型相等
print(1 == True)       # True —— bool 是 int 子类,True==1
print(0 == False)      # True
# 这可能导致意外:用 1/0 当布尔,或统计时 True 被当 1
print(sum([True, True, False]))   # 2 —— True 当 1 求和
```

数值类型(`bool/int/float/complex`)跨类型 `==` 做数值比较,`1 == 1.0 == True`。注意 `bool` 是 `int` 子类,`True`/`False` 在数值运算里当 `1`/`0`。需要严格类型区分用 `isinstance` 或 `type() is`。详见《bool 类型与短路逻辑》。

---

## 4. 原理

本章讲清相等比较背后的机制:`==` 通过 `__eq__` 方法实现且可重载、`is` 比较身份指针不可重载、`id()` 的本质、小整数缓存与字符串驻留的实现、`__eq__` 与 `__hash__` 契约、nan 不等于自身的 IEEE 754 规定。这些是"相等为何如此"的根基。

### 4.1 `==` 调 `__eq__`,`is` 比身份:协议与底层指针

`==` 与 `is` 在 Python 对象模型里是两个完全不同的机制:`==` 通过**协议方法 `__eq__`** 实现(可重载),`is` 通过**比较对象身份指针**实现(不可重载)。

**`==` 的实现:`a == b` 调用 `__eq__`**

```
a == b 的执行:
1. 尝试 type(a).__eq__(a, b)
2. 若返回 NotImplemented → 尝试 type(b).__eq__(b, a)(反向)
3. 若仍 NotImplemented → 退化为比身份 a is b(最后回退)
```

每个类型定义 `__eq__` 决定 `==` 行为。内置类型的 `__eq__`:

- 数值(`int`/`float`):比数值(`1 == 1.0` 跨类型 True)。
- str:比字符序列。
- list/tuple/dict/set:递归逐元素/逐键值比。
- 自定义类(无 `__eq__`):继承 `object.__eq__`,**回退比身份**(所以 `p1 == p2` 等价 `p1 is p2`)。

```python
# == 的回退:自定义类无 __eq__,退化为 is
class A: pass
a1, a2 = A(), A()
print(a1 == a2)        # False —— object.__eq__ 返回 NotImplemented → 回退 a1 is a2 → False
print(a1 is a2)        # False
```

`NotImplemented` 的双向尝试机制:`a == b` 先试 `a.__eq__(b)`,若返回 `NotImplemented`(a 不知道怎么和 b 比),再试 `b.__eq__(a)`(让 b 这边尝试)。这让不同类型的比较能对称(如 `Decimal('1') == 1` 和 `1 == Decimal('1')` 都成立,即使只有一方实现了兼容比较)。

**`is` 的实现:直接比身份(id),不调方法**

```python
# is 等价于(概念上):
def is_(a, b):
    return id(a) == id(b)   # 比身份指针
# 但实际 is 在 C 层直接比较 PyObject 指针,比调用 id() 更高效,且不创建 int
```

`a is b` 在 CPython 的 C 层直接比较两个 PyObject 指针(`a == b` 在 C 层就是 `a == b` 指针相等),**不调用任何 Python 方法**。这就是为何 `is` 不可重载——它绕过了所有方法分派,纯粹看内存地址。无论类型怎么定义 `__eq__`,`is` 行为固定为"是否同对象"。

理解这条原理,就理解了 `==`(可重载、可不同对象得 True、可被 `__eq__` 操纵)与 `is`(不可重载、只同对象得 True、绝对可靠)的根本分歧。协议方法详见《面向对象 OOP 全套》。

### 4.2 `id()` 的本质:身份与内存地址

`id(obj)` 返回对象的身份标识。在 CPython 中,`id()` 返回的就是**对象在内存中的地址**(PyObject 指针的整数值)。这是 CPython 实现细节(其他实现如 PyPy 的 id 不一定是地址,但保证唯一且不变),但理解它有助于建立"身份"的直觉。

```python
a = [1, 2]
b = a
print(id(a))          # 比如 4321234560 —— a 对象的内存地址
print(id(b))          # 同上 —— b 指向同对象,地址相同
print(a is b)         # True —— 地址相同

b = [1, 2]            # b 重新指向新对象
print(id(b))          # 不同地址 —— 新对象
print(a is b)         # False —— 地址不同
```

身份的关键性质:

- **唯一**:每个对象有唯一的 id(任一时刻,两个不同对象 id 不同)。
- **不变**:对象生命周期内 id 不变(immutable 对象如 int 也如此,虽值不变但 id 是它的身份)。
- **可复用**:对象被回收后,其 id(地址)可被新对象复用。所以"id 相等"只在对象都存活时有意义——若一个对象已回收,其 id 可能被新对象占用,此时"曾经的 id"已无意义。

⚠️ **`id()` 的生命周期陷阱**:

```python
# 危险:保存 id 后原对象回收,id 被新对象复用,造成误判
x = object()
saved_id = id(x)
del x                  # x 对象可能被回收
y = object()
print(id(y) == saved_id)  # 可能 True!y 复用了 x 的地址(但 x、y 不是同对象)
```

`id()` 返回的只是地址数值,原对象回收后该地址可被复用。所以**不能跨对象生命周期用 id 判断身份**——`saved_id` 在原对象死后失去了意义。判断同对象只在两者都存活的当下用 `is`。这也是为何"判断同对象用 `is` 而非 `id()` 比较"的另一原因:`is` 在 C 层直接比指针,绕开了 id 数值的生命周期问题。

理解 `id()` 的本质(地址、唯一、不变、可复用),就理解了 `is` 比的是什么,以及为何 `is` 比 `id()` 比较更可靠。`id()` 主要用于调试身份,不作为相等判断工具。

### 4.3 小整数缓存与字符串驻留:复用机制造就 `is` 假阳性

`is` 对 int/str 的"假阳性"(小整数和驻留 str 恰好同对象),源于 Python 的**对象复用机制**,为减少对象创建开销。

**小整数缓存(CPython 实现细节)**:CPython 启动时预创建 `[-5, 256]` 范围的 int 对象,存于全局数组 `small_integers`。凡这个范围的整数字面量或运算结果,都**引用同一个缓存对象**,不新建。

```python
# CPython 内部(概念):
# small_integers = [-5, -4, ..., 0, ..., 255, 256]  # 262 个预创建对象
# 用到 100 时,返回 small_integers[100 - (-5)] 即缓存对象,不 new
a = 100
b = 100
# a、b 都指向 small_integers 里同一个 100 对象
print(a is b)        # True
```

为何缓存 `[-5, 256]`?这个范围是高频常用整数(循环计数、小索引、ASCII 码),预创建复用能显著减少对象创建/回收开销。范围是经验值,CPython 文档明确"小整数缓存是实现细节,不应依赖"。

超出范围的整数不缓存,每次创建新对象:

```python
a = 300
b = 300
print(a is b)        # 可能 False —— 300 不缓存,两个不同对象(交互式 REPL)
# 但同编译单元的字面量可能被 peephole 优化常量折叠成同对象
```

⚠️ 字面量折叠(ast/compile 优化):同一编译单元(如同一个函数体、同一文件模块级)里相同的字面量,编译器可能把它们折叠成同一对象(常量去重)。这让 `300 is 300` 在脚本文件里可能 True、在交互式 REPL 里可能 False——**结果依赖编译器实现,不可预测**。这进一步说明:`is` 判整数不可靠。

**字符串驻留(interning)**:对**符合标识符规则的字符串**(只含字母、数字、下划线,且不以数字开头),CPython 自动驻留——相同内容的标识符样 str 共享同一对象。这是为字典键查找优化(标识符常作键,驻留后 `is` 比较快于 `==`)。

```python
a = "hello"          # 符合标识符规则 → 自动驻留
b = "hello"
print(a is b)        # True —— 驻留,同对象

a = "hello world!"   # 含空格!,不符合标识符规则 → 不自动驻留
b = "hello world!"
print(a is b)        # 可能 False —— 不驻留,不同对象(交互式)
print(a == b)        # True —— 但值相等(可靠)
```

驻留规则:符合标识符规则的 str 自动驻留;其他 str(含空格、特殊字符、运行时拼接的)默认不驻留,但可 `sys.intern(s)` 显式驻留(强制相同内容共享对象,用于大量重复长字符串省内存)。

```python
import sys
s1 = sys.intern("hello world!")
s2 = sys.intern("hello world!")
print(s1 is s2)      # True —— 显式驻留后同对象
```

**总结**:`is` 在数值/str 上的"假阳性"是缓存/驻留的实现副作用,不是语言保证。这些机制(小整数缓存、字符串驻留、`None`/`bool` 单例)为性能存在,让 `is` 在这些类型"碰巧可用",但跨范围/跨环境/跨编译就翻车。铁律根植于此:**内容相等一律 `==`,身份/单例才 `is`**。

### 4.4 `__eq__` 与 `__hash__` 契约:相等对象必须同 hash

`==` 与 `__hash__` 有一条语言级契约:**若 `a == b` 为 True,则 `hash(a) == hash(b)` 必须为 True**。这条契约是 dict/set 正确工作的前提,理解它能解释"为何重载 `__eq__` 要同时定义 `__hash__`""为何可变容器不可哈希"。

**契约的必要性:dict/set 依赖 hash 定位**。dict 查找键 `d[key]` 时:先算 `hash(key)` 定位到一个桶(bucket),再在桶内用 `==` 比较找到目标。若两个 `==` 相等的对象 `hash` 不同,它们会散列到**不同桶**,查找时在 key 所在桶找不到与之相等的对象——dict 就坏了。

```python
# 契约满足(int 与 float):1 == 1.0 且 hash(1) == hash(1.0)
# 所以 {1: 'a'} 里 1 和 1.0 是同一个键(hash 同桶 + == 相等)
d = {1: 'a'}
print(d[1.0])        # 'a' —— 1.0 找到了 1 的桶(因 hash 相同),且 == 相等
```

`{1: 'a'}[1.0]` 能取到 `'a'`,因 `hash(1) == hash(1.0)`(同桶)+ `1 == 1.0`(相等),所以 dict 把 1 和 1.0 视为同一个键。若 hash 不同,1.0 会散到别的桶,找不到 1 的值。

**自定义类重载 `__eq__` 的连锁反应**:Python 规定,类一旦定义 `__eq__`,其 `__hash__` 自动设为 `None`(使实例不可哈希),unless 显式定义 `__hash__`。这是**保护性默认**:防止你只改 `__eq__`(改变相等语义)却用默认 `__hash__`(基于 id)导致契约违反。

```python
# 默认 object:__eq__ 比 id,__hash__ 也基于 id —— 契约满足(id 相同→== 相同→hash 相同)
# 重载 __eq__ 比内容,但默认 __hash__ 仍基于 id → 契约违反(内容相同但 hash 不同)
# 故 Python 把 __hash__ 设 None,逼你显式定义
class P:
    def __init__(self, x): self.x = x
    def __eq__(self, o): return isinstance(o, P) and self.x == o.x
    # __hash__ 被设为 None → 不可哈希
p = P(1)
# hash(p)  # TypeError: unhashable
```

若没这个保护,`P(1) == P(1)` 为 True 但 `hash(P(1)) != hash(P(1))`(基于不同 id),放进 dict 后两个相等的 P 会散到不同桶,`d[P(1)]` 找不到 `d[另一个 P(1)]` 的值——dict 出错。Python 用"`__eq__` 后 `__hash__=None`"强制你显式定义一致的 `__hash__`,避免这种隐蔽 bug。

```python
class P:
    def __init__(self, x): self.x = x
    def __eq__(self, o): return isinstance(o, P) and self.x == o.x
    def __hash__(self): return hash(self.x)   # 基于 __eq__ 同字段,契约满足
# 现在 P(1) 和 P(1):== 相等 且 hash 相等 → 可做 dict 键,行为正确
```

**可变容器不可哈希的原理**:list/dict/set 内容可变。若可哈希,内容改变后 hash 应变,但对象身份不变——这违反"对象 id 不变则 hash 不变"的假设(dict 依赖键 hash 稳定,若键改了内容 dict 内部散列结构就错乱)。所以可变容器**禁止哈希**(`__hash__ = None`),不能做 dict 键/set 元素。不可变容器(tuple/frozenset)可哈希,前提是其元素也可哈希(`(1, [2])` 因含 list 不可哈希)。

```python
# 可变 → __hash__ = None
# hash([1, 2])  # TypeError
# 不可变但含不可哈希元素 → 仍不可哈希
# hash((1, [2]))  # TypeError —— tuple 要哈希需所有元素可哈希
hash((1, 2))        # OK —— 元素都可哈希
```

理解 `__eq__` 与 `__hash__` 契约,就理解了"重载 `__eq__` 为何要配 `__hash__`""可变容器为何不可哈希""1 与 1.0 为何是同键"——这些都是同一契约的不同侧面。详见《hash 与可哈希类型》。

### 4.5 nan 不等于自身:IEEE 754 的有意规定

`nan != nan`(nan 不等于自身)是 IEEE 754 浮点标准的**有意规定**,不是 bug。理解其设计目的,就理解了这个最反直觉的相等行为。

**IEEE 754 为何规定 nan 不等于自身**:nan 表示"无意义的运算结果"(如 `0/0`、`inf - inf`、负数开方)。IEEE 754 规定 nan 与任何值(含自身)的比较都返回 False(`==`、`<`、`>` 全 False),目的是让"**用 `x != x` 检测 nan**"成为可能——这是不依赖专门函数、在任意比较上下文检测 nan 的通用机制。

```python
nan = float('nan')
# nan 与任何值比较都 False(含自身)
print(nan == nan)      # False
print(nan < 0)         # False
print(nan > 0)         # False
print(nan != nan)      # True —— 这是检测 nan 的"信号"(nan != nan 为 True)
```

设计逻辑:如果 `nan == nan` 为 True,你就无法用比较运算区分"一个数是 nan"和"两个数相等"——两者都是 `==`。IEEE 让 `nan != nan` 唯一为 True,于是"判断 x 是不是 nan"只需测 `x != x`(或 `x != x` 在条件里)。这是一个巧妙的自检机制。

**`math.isnan` 的实现底层**:虽然理论上 `x != x` 能判 nan,但 Python 的 `math.isnan` 在 C 层用专门的位模式检查(直接看 float 的指数位是否全 1、尾数非 0——IEEE 754 的 nan 编码),比 `x != x` 更直接、且不受 Python 比较优化干扰。`math.isnan` 是判 nan 的标准可靠方式,`x != x` 虽可行但晦涩、不推荐。

```python
# math.isnan 底层:检查 IEEE 754 nan 编码(指数全 1、尾数非 0)
# 比浮点比较更直接,不受 == 行为影响
import math
nan = float('nan')
print(math.isnan(nan))   # True —— C 层位模式检查,最可靠
```

⚠️ **nan 在数据中的毒化**:因 `nan ==` 任何都 False、`nan` 参与算术得 nan,一个 nan 混入数据会毒化求和(`sum` 变 nan)、排序(乱序)、比较(失真)。处理含 nan 数据必须先用 `math.isnan`/`np.isnan` 过滤。这是 nan 行为在数据处理的连带危害。

**`==` vs `is` 在 nan 上的分歧根源**:回顾 §2.8,`nan == nan` 为 False(IEEE 规定 nan 不等于任何),`nan is nan` 为 True(是同一个对象)。这清楚展示 `==` 比值(受 IEEE 754 nan 语义支配)、`is` 比身份(只看对象,与值语义无关)的本质——哪怕值的语义"不等于自身",身份仍是那个特定对象。这是 `==` 与 `is` 分歧最极端的案例。详见《float 类型与精度问题》。

---

## 5. 总结

### 5.1 本文内容回顾

- **两个相等概念**:`==` 值相等(比内容)、`is` 引用相等(比身份/id);`is` 比"是不是同一个东西",`==` 比"长得一不一样";改一边影响另一边看 `is`(同对象才联动)。
- **对照表**:`==` 调 `__eq__` 可重载比内容,`is` 比 `id` 不可重载比身份;单例用 `is`,内容用 `==`;`nan == nan` 为 False 而 `nan is nan` 为 True。
- **三要素分离**:对象有身份(id)、类型、值;`is` 比 `id`、`==` 比值;`is` 等价 `id(a)==id(b)`(但判断直接用 `is`,`id` 仅调试)。
- **值相等 `==`**:内置容器递归逐元素深度比较(list/tuple 顺序敏感,dict/set 无序);数值跨类型相等(`1==1.0==True`);`==` 调 `__eq__` 可重载。
- **引用相等 `is`**:比身份不可重载,绝对可靠;`a is b` 当且仅当同对象;`is not` 取反;不受 `__eq__` 干扰。
- **可变 vs 不可变**:不可变对象值相等即可互换;可变对象 `==` 相等不代表安全共享(独立对象改一个不影响另一个),副作用联动看 `is`——辨副作用用 `is`、辨内容用 `==`。
- **`==` 退化比引用**:自定义类无 `__eq__` 时 `==` 退化为比身份(内容相同也判 False);重载 `__eq__`(返回 NotImplemented)或用 `@dataclass` 自动生成按字段比较。
- **缓存与驻留陷阱**:小整数缓存 `[-5,256]`、字符串驻留(标识符样 str)、单例复用,让 `is` 在数值/str 上"假阳性";`is` 判数值/str 不可靠(依赖实现/环境),内容相等必须 `==`。
- **`None` 与单例**:`None`/`True`/`False` 单例判断用 `is`(PEP 8),不用 `==`(被 `__eq__` 欺骗、NumPy 数组报错);`is None` 对所有类型绝对可靠。
- **`==` 与 `__hash__` 契约**:`a==b` → `hash(a)==hash(b)` 必须成立(dict/set 正确工作前提);重载 `__eq__` 后 `__hash__` 被设 None(不可哈希),必须同时定义基于同字段的 `__hash__`;可变容器不可哈希(内容变会破坏 hash 稳定);1 与 1.0 因 `==` 且 hash 等是同键。
- **float 与 nan**:float `==` 受精度影响用 `math.isclose`;`nan != nan`(IEEE 754 有意规定,让 `x!=x` 可检测 nan),判 nan 用 `math.isnan`;`nan == nan` False 而 `nan is nan` True 展示 `==` 比值/`is` 比身份分歧。
- **嵌套深度比较**:容器 `==` 递归逐层比较,直到基本类型或类型不同;`[1,(2,3)] != [1,[2,3]]`(tuple vs list)。
- **最佳实践**:单例用 `is` 内容用 `==`、绝不用 `is` 比数值/str、副作用看 `is`、自定义类重载 `__eq__` 或用 dataclass、重载 `__eq__` 必配 `__hash__`、float 用 isclose、nan 用 isnan、判空用 `is None`、注意容器顺序敏感、`id` 仅调试、`is not` 优于 `not is`、注意 bool 当 int。
- **原理**:`==` 调 `__eq__`(双向 NotImplemented 尝试、无 `__eq__` 回退比身份)、`is` C 层比指针不可重载;`id()` 是 CPython 内存地址(唯一/不变/可复用,生命周期陷阱致不能跨期判身份);小整数缓存 `[-5,256]` 与字符串驻留(标识符样)为性能复用对象造就 `is` 假阳性;`__eq__`/`__hash__` 契约(相等必同 hash,重载 `__eq__` 自动设 `__hash__=None` 保护、可变容器不可哈希);nan 不等于自身是 IEEE 754 有意规定(让 `x!=x` 检测 nan),`math.isnan` 走位模式检查。

### 5.2 读完本文你应能掌握

- 说明 `==`(值相等,调 `__eq__` 可重载)与 `is`(引用相等,比 id 不可重载)的本质区别,指出 `is` 比"是不是同一对象"、`==` 比"内容一不一样"。
- 用 `id()` 观察对象身份,说明 `a is b` 等价 `id(a) == id(b)`,并指出判断同对象应直接用 `is` 而非 `id()` 比较(及原因)。
- 说明可变对象 `==` 相等不代表安全共享(独立对象改一个不影响另一个),判断"修改联动"看 `is` 不看 `==`。
- 说明自定义类默认 `==` 退化为比身份的原因(`object.__eq__` 回退),用重载 `__eq__` 或 `@dataclass` 实现值比较。
- 说明小整数缓存(`[-5,256]`)和字符串驻留导致 `is` 在数值/str 上"假阳性",指出判断数值/字符串相等必须用 `==`。
- 说明 `None` 等单例判断用 `is` 而非 `==` 的原因(不受 `__eq__` 欺骗、对 NumPy 数组等安全),写出 `x is None`/`x is not None`。
- 说明 `__eq__` 与 `__hash__` 契约(`a==b` → `hash(a)==hash(b)`),解释重载 `__eq__` 为何必须同时定义 `__hash__`、可变容器为何不可哈希、1 与 1.0 为何是同一 dict 键。
- 说明 float `==` 受精度影响改用 `math.isclose`,说明 `nan != nan` 的 IEEE 754 原因,用 `math.isnan` 判 nan,解释 `nan == nan` False 与 `nan is nan` True 的分歧。
- 用递归深度比较判断嵌套容器相等,说明 list/tuple 顺序敏感而 dict/set 无序。
- 阐述 `==`/`is` 的协议与指针实现、`id()` 本质与生命周期、缓存/驻留机制、`__eq__`/`__hash__` 契约、nan 的 IEEE 754 规定。

### 5.3 延伸方向

- **变量赋值机制**:赋值是贴引用、共享可变对象、拷贝与 deepcopy,见《变量赋值机制》(本篇讲相等比较,该篇讲引用模型根源)。
- **bool 类型与短路逻辑**:`True`/`False` 是 int 子类、真值测试 vs `is True`、比较运算符返回 bool,见《bool 类型与短路逻辑》。
- **float 类型与精度问题**:float 精度误差、`math.isclose`、nan/inf 行为的完整讲解,见《float 类型与精度问题》。
- **hash 与可哈希类型**:`__hash__` 契约、可哈希性、dict/set 键要求的深度讲解,见《hash 与可哈希类型》。
- **列表/字典/集合深度剖析**:各容器的 `==` 深度比较、顺序敏感性、去重机制,见《列表深度剖析》《字典深度剖析》《集合与冻结集合》。
- **面向对象 OOP**:`__eq__`/`__hash__`/`__ne__` 协议方法重载、dataclass 自动生成,见《面向对象 OOP 全套》。
- **逻辑运算符与短路求值**:比较运算符(`==`/`!=`/`is` 等)返回 bool 及其在逻辑表达式中的作用,见《逻辑运算符与短路求值》。
