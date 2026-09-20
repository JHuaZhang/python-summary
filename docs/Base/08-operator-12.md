---
group:
  title: 【08】运算符和表达式
  order: 8
order: 12
title: 运算符重载
nav:
  title: Python基础
  order: 1
---

# 运算符重载

## 1. 介绍

### 1.1 什么是运算符重载

运算符重载（Operator Overloading）是 Python 提供的一种机制，允许你为自定义类定义运算符行为——让 `+`、`-`、`==`、`[]` 等内置运算符作用在你自己的对象上时，你知道它们会做什么，而不是报错。

简单说：你写 `obj1 + obj2`，Python 会调用 `obj1.__add__(obj2)`；你写 `obj[0]`，Python 会调用 `obj.__getitem__(0)`。运算符重载就是通过在类中定义这些**魔术方法（Magic Methods / Dunder Methods）**来"告诉 Python 这个运算符对这类对象应该做什么"。

```python
# 没有重载：两个自定义对象不能直接相加
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

p1 = Point(1, 2)
p2 = Point(3, 4)
# p1 + p2  # TypeError: unsupported operand type(s) for +: 'Point' and 'Point'

# 重载后：定义 __add__ 让 Python 知道怎么加
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __add__(self, other):
        return Point(self.x + other.x, self.y + other.y)

    def __repr__(self):
        return f"Point({self.x}, {self.y})"

p1 = Point(1, 2)
p2 = Point(3, 4)
print(p1 + p2)  # 输出：Point(4, 6)
```

### 1.2 为什么需要运算符重载

运算符重载的核心价值在于**让自定义类的实例表现得像 Python 内置类型一样自然**。

| 没有重载 | 有重载 |
|---------|--------|
| `v1.add(v2)` | `v1 + v2` |
| `v1.equals(v2)` | `v1 == v2` |
| `v1.get(0)` | `v1[0]` |
| `v1.to_string()` | `str(v1)` 或 `print(v1)` |

有了运算符重载，你的类就"融入"了 Python 的语言体系——可以用 `sorted()` 排序、用 `for` 遍历、用 `if obj:` 做真值判断、用 `in` 做成员检查。这让你写的代码更 Pythonic。

### 1.3 在 Python 语法体系中的位置

运算符重载处于 Python 的**数据模型（Data Model）层**——它是连接自定义类型和语言语法的桥梁。整个 Python 语言的运算符都是通过魔术方法调用的，没有例外：`3 + 5` 实际执行的是 `int.__add__(3, 5)`。

当你理解了运算符重载，你就真正理解了 Python 的"一切皆对象，一切皆方法调用"的设计哲学。

## 2. 核心内容

### 2.1 魔术方法总览

Python 为运算符重载提供了丰富的魔术方法，按功能可以分为以下几类：

```text
运算符重载魔术方法分类
├── 算术运算符
│   ├── __add__(self, other)        加法 +
│   ├── __sub__(self, other)        减法 -
│   ├── __mul__(self, other)        乘法 *
│   ├── __truediv__(self, other)    真除法 /
│   ├── __floordiv__(self, other)   整除 //
│   ├── __mod__(self, other)        取余 %
│   ├── __pow__(self, other)        幂运算 **
│   └── ═══ 反射运算符（右操作数）═══
│       ├── __radd__(self, other)     右加法
│       ├── __rsub__(self, other)     右减法
│       ├── __rmul__(self, other)     右乘法
│       └── __rtruediv__(self, other) 右除法
│
├── 比较运算符
│   ├── __eq__(self, other)         等于 ==
│   ├── __ne__(self, other)         不等于 !=
│   ├── __lt__(self, other)         小于 <
│   ├── __le__(self, other)         小于等于 <=
│   ├── __gt__(self, other)         大于 >
│   └── __ge__(self, other)         大于等于 >=
│
├── 一元运算符
│   ├── __neg__(self)               负号 -
│   ├── __pos__(self)               正号 +
│   ├── __abs__(self)              绝对值 abs()
│   └── __invert__(self)            按位取反 ~
│
├── 增强赋值（原地操作）
│   ├── __iadd__(self, other)       +=
│   ├── __isub__(self, other)       -=
│   ├── __imul__(self, other)       *=
│   └── __itruediv__(self, other)   /=
│
├── 容器/序列模拟
│   ├── __getitem__(self, key)      obj[key]
│   ├── __setitem__(self, key, v)   obj[key] = v
│   ├── __delitem__(self, key)      del obj[key]
│   ├── __len__(self)               len(obj)
│   ├── __contains__(self, item)    item in obj
│   ├── __iter__(self)              for item in obj
│   └── __reversed__(self)          reversed(obj)
│
└── 输出与类型转换
    ├── __str__(self)               str(obj) / print(obj)
    ├── __repr__(self)              repr(obj)
    ├── __int__(self)               int(obj)
    ├── __float__(self)             float(obj)
    ├── __bool__(self)              bool(obj) / if obj:
    └── __format__(self, spec)      format(obj) / f"{obj:spec}"
```

### 2.2 算术运算符

#### 2.2.1 `__add__`、`__sub__`、`__mul__`——二元算术

最常用的三个二元运算符。实现它们让你的类支持 `+`、`-`、`*`。

**核心模式**：每个方法接收 `self` 和 `other`，检查 `other` 类型，执行运算后返回**新对象**（不修改原对象）。

```python
class Money:
    """金额类：支持加减和乘法"""

    def __init__(self, amount):
        self.amount = amount

    def __add__(self, other):
        """salary + bonus → 新的 Money 对象"""
        if isinstance(other, Money):
            return Money(self.amount + other.amount)
        return NotImplemented  # 让 Python 尝试 other.__radd__(self)

    def __sub__(self, other):
        """salary - tax → 新的 Money 对象"""
        if isinstance(other, Money):
            return Money(self.amount - other.amount)
        return NotImplemented

    def __mul__(self, other):
        """salary * 12（金额 × 倍数）"""
        if isinstance(other, (int, float)):
            return Money(self.amount * other)
        return NotImplemented

    def __repr__(self):
        return f"Money({self.amount:.2f})"
```

**运行结果**：

```text
>>> salary = Money(8000)
>>> bonus = Money(1500)
>>> salary + bonus
Money(9500.00)
>>> salary - Money(800)
Money(7200.00)
>>> salary * 12
Money(96000.00)
```

**关键点**：
- `return NotImplemented` 不是异常——它告诉 Python"我不会处理这个操作数类型"，Python 会回退尝试 `other.__radd__(self)`，都失败时才抛出 `TypeError`。
- 二元运算符应返回**新对象**而非修改 `self`，保持不可变性语义，行为与 `int`、`float` 等内置类型一致。

#### 2.2.2 `__truediv__`、`__floordiv__`、`__mod__`、`__pow__`

除法相关运算符：

```python
class Money:
    # ... 其他方法同上 ...

    def __truediv__(self, other):
        """salary / 2（金额 ÷ 数量）"""
        if isinstance(other, (int, float)):
            return Money(self.amount / other)
        return NotImplemented

    def __floordiv__(self, other):
        """salary // 3（整除分配）"""
        if isinstance(other, (int, float)):
            return Money(self.amount // other)
        return NotImplemented

    def __mod__(self, other):
        """salary % rate → 返回余数（float）"""
        if isinstance(other, (int, float)):
            return self.amount % other
        return NotImplemented

    def __pow__(self, other):
        """salary ** 2 → 返回幂运算结果（float）"""
        if isinstance(other, (int, float)):
            return self.amount ** other
        return NotImplemented
```

#### 2.2.3 `__rmul__`——反射运算符（右操作数）

当 `a + b` 中 `a.__add__(b)` 返回 `NotImplemented` 时，Python 会尝试调用 `b.__radd__(a)`。这个机制保证了**操作数的顺序灵活性**。

```python
class Money:
    # ... 其他方法同上 ...

    def __rmul__(self, other):
        """右乘：12 * salary → 当 int.__mul__(12, salary) 返回 NotImplemented 时自动调用"""
        return self.__mul__(other)
```

**关键点**：
- 没有 `__rmul__` 时，`12 * salary` 会报错（`int.__mul__` 不认识 `Money`），但 `salary * 12` 正常工作。
- 实现 `__rmul__` 后，两种顺序都能用。
- 其他反射方法同理：`__radd__`、`__rsub__`、`__rtruediv__` 等。

### 2.3 比较运算符

比较运算符重载让你的对象支持 `==`、`<`、`>` 以及 `sorted()` 排序功能。

#### 2.3.1 `__eq__` 和 `__ne__`——相等与不等

```python
class Version:
    """语义化版本号，重载比较运算符"""

    def __init__(self, major, minor, patch):
        self.major = major
        self.minor = minor
        self.patch = patch

    def __eq__(self, other):
        """v1 == v2"""
        if not isinstance(other, Version):
            return NotImplemented
        return (self.major, self.minor, self.patch) == (other.major, other.minor, other.patch)

    def __ne__(self, other):
        """v1 != v2（Python 3 中如不定义，默认取 __eq__ 的反值）"""
        result = self.__eq__(other)
        if result is NotImplemented:
            return NotImplemented
        return not result
```

**运行结果**：

```text
>>> v1 = Version(3, 10, 0)
>>> v2 = Version(3, 10, 0)
>>> v1 == v2
True
>>> v1 != v2
False
```

#### 2.3.2 `__lt__`、`__le__`、`__gt__`、`__ge__`——大小比较

```python
class Version:
    # ... 其他方法同上 ...

    def __lt__(self, other):
        """v1 < v2（用元组比较简化实现）"""
        if isinstance(other, Version):
            return (self.major, self.minor, self.patch) < (other.major, other.minor, other.patch)
        return NotImplemented

    def __le__(self, other):
        if isinstance(other, Version):
            return (self.major, self.minor, self.patch) <= (other.major, other.minor, other.patch)
        return NotImplemented

    def __gt__(self, other):
        if isinstance(other, Version):
            return (self.major, self.minor, self.patch) > (other.major, other.minor, other.patch)
        return NotImplemented

    def __ge__(self, other):
        if isinstance(other, Version):
            return (self.major, self.minor, self.patch) >= (other.major, other.minor, other.patch)
        return NotImplemented
```

**关键点**：
- Python 的 `functools.total_ordering` 装饰器可以只定义 `__eq__` 和 `__lt__`（再加 `__le__`、`__gt__`、`__ge__` 之一），自动推导其余比较方法——但手动全定义更清晰、更可控。
- 如果你定义了 `__eq__`，Python 会将 `__hash__` 设为 `None`，对象变成不可哈希（无法放入 `set` 或作为 `dict` 的键）。如果需要哈希，必须同时定义 `__hash__`。

#### 2.3.3 `__hash__`——配合 `__eq__` 使用

```python
class Version:
    # ... 其他方法同上 ...

    def __hash__(self):
        """与 __eq__ 一致：等价的版本号必须有相同的哈希值"""
        return hash((self.major, self.minor, self.patch))
```

这让你可以将 `Version` 对象用作字典键或放入集合：

```python
changelog = {
    Version(2, 7, 0): "修复安全漏洞",
    Version(3, 10, 0): "加入新语法特性",
}
```

### 2.4 一元运算符

一元运算符只操作一个操作数。

#### 2.4.1 `__neg__`、`__pos__`、`__abs__`

```python
class Counter:
    """计数器类，支持负号、正号、绝对值"""

    def __init__(self, value):
        self.value = value

    def __neg__(self):
        """-self：返回新对象，而非修改原对象"""
        return Counter(-self.value)

    def __pos__(self):
        """+self"""
        return Counter(+self.value)

    def __abs__(self):
        """abs(self)"""
        return Counter(abs(self.value))

    def __repr__(self):
        return f"Counter({self.value})"
```

**运行结果**：

```text
>>> c = Counter(5)
>>> -c
Counter(-5)
>>> +c
Counter(5)
>>> abs(c)
Counter(5)
```

**关键点**：
- 一元运算符和二元运算符一样，建议返回新对象而非修改原对象。
- `__pos__` 很少用到，但"定义不花代价，不定义可能后悔"——如果某天你写了 `+obj`，没有 `__pos__` 会报 `TypeError`。

#### 2.4.2 `__invert__`——按位取反 `~`

```python
class Counter:
    def __invert__(self):
        """~self"""
        return Counter(~self.value)
```

```text
>>> ~Counter(0)
Counter(-1)  # 因为 ~0 = -1（按位取反的二进制规则）
```

`__invert__` 一般很少用于应用层代码。它主要出现在与位运算密相关的领域（如位标记、标志位——Flags 类）中。

### 2.5 增强赋值（原地操作）

增强赋值运算符 `+=`、`-=`、`*=` 等对应 `__iadd__`、`__isub__`、`__imul__` 等方法。

**核心区别**：`__add__` 返回新对象，`__iadd__` 通常修改 `self` 并返回 `self`。

```python
class Counter:
    def __init__(self, value=0):
        self.value = value

    def __iadd__(self, other):
        """c += n：修改自身状态"""
        if isinstance(other, Counter):
            self.value += other.value
        elif isinstance(other, int):
            self.value += other
        else:
            return NotImplemented
        return self  # 必须返回 self，否则 c 会被重新赋值为 None

    def __isub__(self, other):
        if isinstance(other, Counter):
            self.value -= other.value
        elif isinstance(other, int):
            self.value -= other
        else:
            return NotImplemented
        return self

    def __repr__(self):
        return f"Counter({self.value})"
```

**运行结果**：

```text
>>> c = Counter(10)
>>> c += Counter(5)
>>> c
Counter(15)
>>> c -= 3
>>> c
Counter(12)
```

**关键点**：
- `__iadd__` **必须返回 `self`**。如果不返回 `self`，Python 会将 `c` 重新绑定为返回值——如果返回 `None`，`c` 就变成了 `None`。
- 关于 **"可变对象不实现 `__iadd__` 会怎样？"**：如果没定义 `__iadd__`，Python 会回退用 `__add__` 创建一个新对象再赋值给变量。比如对于不可变的 `int`，`a += 1` 实际上是 `a = a + 1`，`a` 指向新 `int` 对象。对于可变对象，定义 `__iadd__` 能避免不必要的对象创建。

### 2.6 容器/序列模拟

让你的对象像 `list` 一样支持 `obj[0]`、`len(obj)`、`for ... in obj`。

#### 2.6.1 `__getitem__`、`__setitem__`、`__delitem__`——索引访问

```python
class Leaderboard:
    """排行榜：支持按排名索引（下标操作）"""

    def __init__(self):
        self._players = []

    def __getitem__(self, index):
        """lb[0] 或 lb[0:3]（自动支持切片）"""
        return self._players[index]

    def __setitem__(self, index, player):
        """lb[0] = player"""
        if not isinstance(player, Player):
            raise TypeError("只接受 Player 类型")
        self._players[index] = player

    def __delitem__(self, index):
        """del lb[-1]"""
        del self._players[index]
```

**运行结果**：

```text
>>> lb = Leaderboard()
>>> lb[0]
Player(Diana, 10200, Lv50)
>>> lb[0:3]  # 切片自动支持！因为 self._players 是 list
[Player(Diana, 10200, Lv50), Player(Alice, 9800, Lv42), Player(Charlie, 8900, Lv40)]
>>> del lb[-1]  # 删除最后一名
```

**关键点**：
- `__getitem__` 用 `self._players[index]` 实现，切片语法（`lb[0:3]`）由底层 `list` 自动处理，无需额外代码。
- 如果你的内部不是 `list`，需要手动处理 `isinstance(index, slice)`。

#### 2.6.2 `__len__`、`__contains__`——长度和成员检查

```python
class Leaderboard:
    # ... 其他方法同上 ...

    def __len__(self):
        """len(lb)：榜上玩家数量"""
        return len(self._players)

    def __contains__(self, item):
        """player in lb：检查玩家是否在榜"""
        if isinstance(item, str):
            return any(p.name == item for p in self._players)
        if isinstance(item, Player):
            return item in self._players
        return False
```

**运行结果**：

```text
>>> len(lb)
4
>>> "Alice" in lb
True
>>> "Eve" in lb
False
```

**关键点**：
- 如果没有定义 `__contains__`，Python 会用 `__iter__` 逐个遍历查找。定义 `__contains__` 可以获得更好的性能（如用哈希表 O(1) 查找）。

#### 2.6.3 `__iter__`、`__reversed__`——迭代支持

```python
class Leaderboard:
    # ... 其他方法同上 ...

    def __iter__(self):
        """for player in lb：按排名遍历"""
        return iter(self._players)

    def __reversed__(self):
        """reversed(lb)：倒序查看"""
        return reversed(self._players)
```

**运行结果**：

```text
>>> for rank, player in enumerate(lb, 1):
...     print(f"#{rank} {player}")
#1 Player(Diana, 10200, Lv50)
#2 Player(Alice, 9800, Lv42)
#3 Player(Charlie, 8900, Lv40)
#4 Player(Bob, 7600, Lv35)
```

### 2.7 输出与类型转换

#### 2.7.1 `__str__` 和 `__repr__`——字符串表示

这是最常用的两个魔术方法，几乎每个类都应该定义它们。

```python
class Temperature:
    def __init__(self, celsius):
        self.celsius = celsius

    def __str__(self):
        """面向用户：友好的格式"""
        return f"{self.celsius:.1f}°C"

    def __repr__(self):
        """面向开发者：可用于 eval() 重建对象的表达式"""
        return f"Temperature(celsius={self.celsius})"
```

**运行结果**：

```text
>>> temp = Temperature(36.6)
>>> print(temp)      # 调用 __str__
36.6°C
>>> temp             # 交互环境中直接输入变量名 → 调用 __repr__
Temperature(celsius=36.6)
>>> str(temp)        # 显式 str()
'36.6°C'
>>> repr(temp)
'Temperature(celsius=36.6)'
```

**关键点**：
- `__str__`：给用户看的，目标是"好看"。
- `__repr__`：给开发者看的，目标是"清楚、无歧义"。最佳实践是让 `repr(obj)` 的输出是一个有效的 Python 表达式，`eval(repr(obj))` 能创建等价对象。
- `print(obj)` 调用 `__str__`，没有 `__str__` 时回退到 `__repr__`。

#### 2.7.2 `__int__`、`__float__`、`__bool__`——数值与布尔转换

```python
class Temperature:
    # ... 其他方法同上 ...

    def __int__(self):
        """int(temp) → 取整数摄氏度"""
        return int(self.celsius)

    def __float__(self):
        """float(temp) → 浮点摄氏度"""
        return self.celsius

    def __bool__(self):
        """bool(temp) → 非负温度为 True"""
        return self.celsius >= 0
```

**运行结果**：

```text
>>> temp = Temperature(36.6)
>>> int(temp)
36
>>> float(temp)
36.6
>>> bool(temp)
True
>>> ice = Temperature(-5)
>>> bool(ice)
False
```

**关键点**：
- 没有 `__bool__` 时，Python 回退用 `__len__`（非零为 `True`）。如果两者都没定义，对象始终为 `True`。
- `if obj:` 和 `while obj:` 都会触发 `__bool__`。

#### 2.7.3 `__format__`——格式化字符串

`__format__` 让你控制在 `format()` 和 f-string 中的显示方式。

```python
class Temperature:
    # ... 其他方法同上 ...

    def __format__(self, format_spec):
        """支持 f'{temp:c}'、f'{temp:f}'、f'{temp:k}' 等格式"""
        if format_spec == "c":
            return f"{self.celsius:.1f}"
        elif format_spec == "f":
            # 华氏度
            fahrenheit = self.celsius * 9 / 5 + 32
            return f"{fahrenheit:.1f}°F"
        elif format_spec == "k":
            # 开尔文
            kelvin = self.celsius + 273.15
            return f"{kelvin:.2f} K"
        return f"{self.celsius:.1f}°C"
```

**运行结果**：

```text
>>> temp = Temperature(36.6)
>>> f"{temp:c}"   # 只输出数值
'36.6'
>>> f"{temp:f}"   # 华氏度
'97.9°F'
>>> f"{temp:k}"   # 开尔文
'309.75 K'
```

## 3. 最佳实践

### 3.1 推荐 vs 不推荐写法

| 场景 | 推荐 | 不推荐 | 原因 |
|------|------|--------|------|
| 二元运算 | `return MyClass(self.x + other.x)` | `self.x += other.x; return self` | 二元运算不应修改操作数，应返回新对象 |
| `__iadd__` | `self.x += other; return self` | `return MyClass(self.x + other.x)` | `__iadd__` 应该原地修改并返回 self，否则就回退用 `__add__` 好了 |
| 类型检查 | `isinstance(other, MyClass)` | `type(other) == MyClass` | `isinstance` 支持继承，更稳健 |
| 不支持的类型 | `return NotImplemented` | `raise TypeError(...)` | 给 Python 机会尝试反射运算符 |
| `__eq__` | 同时定义 `__hash__` 或设为 `None` | 只定义 `__eq__` 不处理 `__hash__` | 定义了 `__eq__` 会导致 `__hash__` 变为 `None`，对象不可哈希 |

### 3.2 `return NotImplemented` vs `raise TypeError`

这是最容易犯错的地方。当运算符重载方法发现 `other` 类型不对时：

- **正确**：`return NotImplemented`
- **错误**：`raise TypeError("不支持的类型")`

`NotImplemented` 是一个特殊的单例值，它告诉 Python 解释器"我不会处理这个操作数，试试反射运算符"。只有当两个操作数都返回 `NotImplemented` 时，Python 才会抛出 `TypeError`。

```python
class A:
    def __add__(self, other):
        if isinstance(other, B):  # A 知道怎么加 B
            return ...
        return NotImplemented     # 不认识的类型，让 Python 试试 other.__radd__

class B:
    def __radd__(self, other):
        if isinstance(other, A):  # B 知道怎么被 A 右加
            return ...
        return NotImplemented
```

### 3.3 `__eq__` 和 `__hash__` 的绑定规则

Python 有一个重要约定：如果两个对象相等（`a == b` 为 `True`），它们的哈希值必须相同（`hash(a) == hash(b)`）。

当你定义了 `__eq__` 而没有定义 `__hash__` 时，Python 会将 `__hash__` 设为 `None`，对象无法放入 `set` 或作为 `dict` 的键。

```python
# 错误：定义了 __eq__ 但没定义 __hash__，对象不可哈希
class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y
    def __eq__(self, other):
        return self.x == other.x and self.y == other.y

p = Point(1, 2)
# hash(p)  # TypeError: unhashable type: 'Point'

# 正确：同时定义 __hash__
class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y
    def __eq__(self, other):
        if not isinstance(other, Point):
            return NotImplemented
        return self.x == other.x and self.y == other.y
    def __hash__(self):
        return hash((self.x, self.y))
```

### 3.4 常见错误与修正

| 错误 | 现象 | 修正 |
|------|------|------|
| `__iadd__` 没返回 `self` | `c += 5` 后 `c` 变成 `None` | `return self` |
| 没有验证 `other` 类型 | 传入不相关类型的对象时报奇怪的 `AttributeError` | 用 `isinstance` 检查，返回 `NotImplemented` |
| 二元运算修改了 `self` | `b = a + c` 后 `a` 的值也变了 | 返回新对象，不修改 `self` |
| 修改了可变默认参数 | 运算符重载中错误地共享了可变对象 | 在方法内创建新对象，不共享引用 |
| 忘了 `__repr__` | 打印列表时看到 `<__main__.MyClass at 0x...>` | 至少定义 `__repr__` |
| 同时定义 `__eq__` 忽略 `__hash__` | 对象无法放入集合 | 添加 `__hash__` 或使用 `@dataclass(eq=True, frozen=True)` |

## 4. 原理

### 4.1 Python 的运算符调度机制

当你写 `a + b` 时，Python 不是直接执行加法，而是经过一套调度流程：

```text
a + b 的调用流程

1. type(a).__add__(a, b)
   │
   ├── 返回正常值 → 直接返回（流程结束）
   │
   └── 返回 NotImplemented
          │
          ↓
   2. type(b).__radd__(b, a)
      │
      ├── 返回正常值 → 直接返回（流程结束）
      │
      └── 返回 NotImplemented
             │
             ↓
         抛出 TypeError: unsupported operand type(s)
```

这个两阶段调度保证了操作数的顺序灵活性。这也解释了为什么你必须 `return NotImplemented` 而不是 `raise TypeError`——如果你直接抛出异常，Python 根本没有机会去尝试 `b.__radd__(a)`。

### 4.2 增强赋值的回退机制

对于 `a += b`，Python 的调度更复杂：

```text
a += b 的调用流程

1. type(a).__iadd__(a, b)     ← 优先尝试原地操作
   │
   ├── 返回正常值 → 将返回值赋给 a（流程结束）
   │
   └── 返回 NotImplemented 或 未定义 __iadd__
          │
          ↓
   2. type(a).__add__(a, b)   ← 回退到二元加法
      │
      ├── 返回新对象 → 将新对象赋给 a（相当于 a = a + b）
      │
      └── 返回 NotImplemented
             │
             ↓
         抛出 TypeError
```

这就解释了为什么不可变类型（如 `int`、`str`、`tuple`）的 `+=` 实际上是创建新对象——它们没有定义 `__iadd__`（或不修改自身），所以 Python 回退用 `__add__` + 重新赋值。

### 4.3 `NotImplemented` 是什么

`NotImplemented` 是 Python 内置的单例对象（类似 `None`、`True`、`False`），定义在 `builtins` 中。**它不是 `NotImplementedError` 异常**——名字相似但完全不同。

```python
>>> NotImplemented
NotImplemented
>>> type(NotImplemented)
<class 'NotImplementedType'>
# NotImplemented 是一个值（return 用）
# NotImplementedError 是一个异常（raise 用）
```

验证用代码：

```python
class Left:
    def __add__(self, other):
        print("Left.__add__ 被调用")
        return NotImplemented

class Right:
    def __radd__(self, other):
        print("Right.__radd__ 被调用")
        return "成功"

a = Left()
b = Right()
result = a + b
# 输出：
# Left.__add__ 被调用
# Right.__radd__ 被调用
print(result)  # 输出：成功
```

你可以看到：`a.__add__(b)` 返回 `NotImplemented` 后，Python 自动调用了 `b.__radd__(a)`。

### 4.4 模拟内置类型的操作语义

Python 的数据模型定义了一个"协议"：只要你实现了特定的魔术方法，你的类就能无缝融入 Python 的语法体系。下面用一个完整的 `Vector` 类串联所有知识点：

```python
import math

class Vector:
    """2D 向量：串联算术、比较、一元、容器、输出等全部运算符重载"""

    def __init__(self, x, y):
        self.x = x
        self.y = y

    # === 算术 ===
    def __add__(self, other):
        if isinstance(other, Vector):
            return Vector(self.x + other.x, self.y + other.y)
        return NotImplemented

    def __sub__(self, other):
        if isinstance(other, Vector):
            return Vector(self.x - other.x, self.y - other.y)
        return NotImplemented

    def __mul__(self, scalar):
        if isinstance(scalar, (int, float)):
            return Vector(self.x * scalar, self.y * scalar)
        return NotImplemented

    def __rmul__(self, scalar):
        return self.__mul__(scalar)

    def __truediv__(self, scalar):
        if isinstance(scalar, (int, float)):
            return Vector(self.x / scalar, self.y / scalar)
        return NotImplemented

    # === 原地 ===
    def __iadd__(self, other):
        if isinstance(other, Vector):
            self.x += other.x
            self.y += other.y
        return self

    def __isub__(self, other):
        if isinstance(other, Vector):
            self.x -= other.x
            self.y -= other.y
        return self

    # === 一元 ===
    def __neg__(self):
        return Vector(-self.x, -self.y)

    def __abs__(self):
        return math.sqrt(self.x ** 2 + self.y ** 2)  # 模长

    # === 比较 ===
    def __eq__(self, other):
        if isinstance(other, Vector):
            return self.x == other.x and self.y == other.y
        return NotImplemented

    def __lt__(self, other):
        """按模长比较"""
        if isinstance(other, Vector):
            return abs(self) < abs(other)
        return NotImplemented

    # === 容器 ===
    def __getitem__(self, index):
        if index == 0:
            return self.x
        elif index == 1:
            return self.y
        raise IndexError("Vector 索引范围: 0 或 1")

    def __len__(self):
        return 2

    # === 输出与转换 ===
    def __str__(self):
        return f"({self.x}, {self.y})"

    def __repr__(self):
        return f"Vector({self.x}, {self.y})"

    def __bool__(self):
        return self.x != 0 or self.y != 0

    def __int__(self):
        return int(abs(self))

    def __float__(self):
        return abs(self)
```

**运行结果**：

```text
>>> v1 = Vector(3, 4)
>>> v2 = Vector(1, 2)
>>> v1 + v2
Vector(4, 6)
>>> abs(v1)          # 模长
5.0
>>> v1[0], v1[1]     # 像 tuple 一样索引
(3, 4)
>>> bool(Vector(0, 0))
False
>>> int(v1)
5
```

## 5. 总结

本文围绕 Python 运算符重载展开，主要介绍了以下内容：

- **核心概念**：运算符重载通过定义魔术方法让自定义类支持 `+`、`==`、`[]` 等内置运算符，使自定义对象"融入"Python 语言体系。
- **算术运算符**：`__add__`、`__sub__`、`__mul__`、`__truediv__` 等方法让对象支持二元运算，反射运算符（`__rmul__` 等）保证操作数顺序灵活性，`NotImplemented` 是关键的调度信号而非异常。
- **比较运算符**：`__eq__`、`__lt__` 等让对象支持 `==`、`<`、`>` 以及 `sorted()` 排序，定义 `__eq__` 时需同时处理 `__hash__` 以保持哈希一致性。
- **一元运算符**：`__neg__`、`__abs__` 等作用于单个操作数。
- **增强赋值**：`__iadd__` 等方法实现原地修改，必须返回 `self`，否则变量会被重新绑定为 `None`。
- **容器模拟**：`__getitem__`、`__setitem__`、`__len__`、`__contains__`、`__iter__` 等让自定义类像 `list` 一样支持索引、遍历和成员检查。
- **输出与类型转换**：`__str__` vs `__repr__` 面向用户 vs 面向开发者；`__int__`、`__float__`、`__bool__`、`__format__` 让对象与内置类型无缝互转。
- **最佳实践**：二元运算返回新对象、增强赋值返回 `self`、不支持类型用 `return NotImplemented` 而非抛异常、`__eq__` 和 `__hash__` 同时定义或同时不定义。