---
group:
  title: 【02】基础数据类型和类型系统
  order: 2
order: 11
title: TypeVar泛型
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是泛型与 TypeVar

泛型(generics)是"参数化类型"的机制——让类型带"类型参数",一份代码适用于多种具体类型,同时保留类型安全。`list[int]`、`dict[str, int]` 这种"容器+元素类型"的标注就是泛型的体现:`list` 是泛型容器,`[int]` 是类型参数,`list[int]` 表示"int 元素的列表"。

但只有容器泛型还不够。当你自己写函数或类,希望它"对多种类型通用,且类型有关联"时,就需要**自定义泛型**——而 Python 表达自定义泛型的核心工具就是 `TypeVar`(类型变量)。

```python
from typing import TypeVar

T = TypeVar("T")              # 定义一个类型变量 T

def first(items: list[T]) -> T:    # 泛型函数:list[T] 的元素类型与返回 T 一致
    return items[0]

print(first([1, 2, 3]))       # 1 —— T 被推导为 int
print(first(["a", "b"]))      # "a" —— T 被推导为 str
```

`first` 函数对"任意类型的列表"通用——传 `list[int]` 返回 `int`,传 `list[str]` 返回 `str`。这通过 `T = TypeVar("T")` 定义类型变量,在签名 `list[T] -> T` 中表达"输入元素类型与返回类型是同一个 T"。mypy 据调用时的实参把 T 具体化(int 或 str),从而对每次调用做精确类型检查。

为什么要泛型?对比三种方案的差异,最能说明问题。假设写一个"取列表第一个元素"的函数:

```python
# 方案一:无注解(动态,不安全)
def first(items):
    return items[0]        # 不知元素类型,后续 mypy 不检查

# 方案二:用 Any(放弃关联)
def first(items: list[Any]) -> Any:
    return items[0]        # 返回 Any,后续操作不检查,逃逸

# 方案三:用 object(松弛)
def first(items: list[object]) -> object:
    return items[0]        # 元素是 object,取出是 object,后续需收窄

# 方案四:用 TypeVar 泛型(精确关联)
T = TypeVar("T")
def first(items: list[T]) -> T:
    return items[0]        # 元素类型 = 返回类型,mypy 推导精确
```

- 方案一/二:丢失类型信息,后续检查失效。
- 方案三:`list[object]` 强制收窄——但 `first([1,2,3])` 返回 `object`,你 `+1` 都要收窄,过度松弛,丢失了"传入 int 列表就返回 int"的信息。
- 方案四(泛型):传入 `list[int]` 返回 `int`(`T=int`),传入 `list[str]` 返回 `str`(`T=str`)——元素类型与返回类型**精确关联**,既通用又类型安全。

泛型的核心价值就在于此:**让"输入类型"与"输出类型"建立关联,在通用的同时保留精确类型信息**。这是 object/Any 做不到的——它们要么松弛(丢失关联)要么放行(放弃检查),只有 TypeVar 能表达"这两处类型相同"的约束。

`TypeVar` 的应用场景:

- **泛型函数**:`first`、`identity`(恒等)、`map` 这类"输入输出类型相关"的函数。
- **泛型类**:自定义容器(`Stack[T]`、`Box[T]`)、结果类型(`Result[T, E]`)、ORM 模型。
- **泛型工具**:序列化/反序列化、缓存装饰器、链式构建器。

本篇要深入讲透 TypeVar 与泛型:`TypeVar` 的定义与使用、泛型函数、泛型类、`Generic` 基类、类型变量的**约束**(bounded/constrained,限制 T 的范围)、**协变与逆变**(variance,容器子类型关系)、进阶的 `ParamSpec`(参数规格)与 `TypeVarTuple`(可变类型参数)。这是类型注解子系列里偏理论的一篇——协变逆变是难点,但理解它才能真正写对泛型容器。

本篇是类型注解子系列进阶篇。与 09/10 的分工:09 给了内置泛型 `list[T]` 的用,10 给了 Union/Any,本篇深入"自定义泛型"(TypeVar、Generic、协变逆变)。运行时泛型反射留 12,mypy 实战留 13。

### 1.2 类型变量:TypeVar 的本质

`TypeVar`(类型变量)是泛型的基本构件——它是一个"代表某个类型的变量",在泛型签名里作占位,调用时被具体类型替换。

**定义 TypeVar**:

```python
from typing import TypeVar

T = TypeVar("T")              # 无约束的类型变量,可代表任何类型
```

`TypeVar("T")` 创建一个类型变量,通常赋给大写名 `T`。参数 `"T"` 是类型变量的名字(必须与变量名一致,用于调试与字符串表示)。无约束的 T 可代表任意类型——像 Any 一样灵活,但有关键区别:**T 在一次使用中"同一化"**(同一签名里多处 T 必须指同一类型)。

**T 的"同一化"是核心**:

```python
T = TypeVar("T")
def pair(a: T, b: T) -> tuple[T, T]:    # 三处 T 必须是同一类型
    return (a, b)
pair(1, 2)        # T=int,OK:(int,int)->tuple[int,int]
pair("a", "b")    # T=str,OK
pair(1, "b")      # mypy 报错!T 不能同时是 int 和 str(同一化冲突)
```

`pair(a: T, b: T)` 要求 a、b 同类型(同一 T)。`pair(1, "b")` 中 1 是 int、"b" 是 str,T 无法同一化为单一类型,mypy 报错。这就是 TypeVar 相对 Any 的力量:**它建立"a 和 b 类型相同"的约束**,Any/无注解都表达不了这种关联。

```python
# 对比 Any:a、b 都是 Any,不要求同类型
def pair_any(a: Any, b: Any) -> tuple[Any, Any]:
    return (a, b)
pair_any(1, "b")    # mypy 不报(Any 不关联),但失去了"同类型"约束
```

`pair_any(1, "b")` mypy 不报(Any 各自独立),但这丢失了"两参数同类型"的意图。TypeVar 能精确表达该意图并强制检查。

**T 的推导**:调用泛型函数时,T 据实参自动推导:

```python
def identity(x: T) -> T:
    return x
r1 = identity(42)      # T=int,r1: int
r2 = identity("hi")    # T=str,r2: str
# mypy 对每次调用把 T 具体化,故 r1 被当 int、r2 当 str,各自精确检查
```

`identity(42)` 时 mypy 推导 T=int,返回 int;`identity("hi")` 推导 T=str,返回 str。T 在每次调用中独立具体化,不跨调用保留。这让泛型函数每次调用都获得精确类型(而非 Any)。

**TypeVar 的命名约定**:单字母大写 `T`、`U`、`K`、`V`(像数学变量),泛型类也可用描述名。约定是社区共识,提升可读性:

```python
T = TypeVar("T")              # 通用元素类型
K = TypeVar("K")              # 键类型
V = TypeVar("V")              # 值类型
T_co = TypeVar("T_co", covariant=True)    # 协变(见后)
```

理解 TypeVar 是"类型占位符 + 同一化约束",就抓住了泛型的本质——它不是"任意类型"(那是 Any),而是"某个待定类型,且关联处相同"。这是泛型相对 Any/无注解的全部价值所在。

### 1.3 泛型速览

讲清定位前,给出泛型的全貌速览:

```python
from typing import TypeVar, Generic

# 1. 泛型函数
T = TypeVar("T")
def first(items: list[T]) -> T: ...

# 2. 泛型类(Generic 基类)
class Box(Generic[T]):
    def __init__(self, value: T) -> None:
        self.value = T_value
    def get(self) -> T: return self.value

# 3. 约束 TypeVar(限制 T 范围)
Number = TypeVar("Number", bound=int | float)   # T 必须是数字(int/float 子类)
def add(a: Number, b: Number) -> Number: ...

# 4. 限定 TypeVar(枚举允许类型)
S = TypeVar("S", str, bytes)   # T 只能是 str 或 bytes
def concat(a: S, b: S) -> S: ...

# 5. 多类型参数
K, V = TypeVar("K"), TypeVar("V")
class Map(Generic[K, V]): ...

# 6. 协变/逆变
T_co = TypeVar("T_co", covariant=True)
T_contra = TypeVar("T_contra", contravariant=True)
```

几个关键:

- `TypeVar("T")`:定义无约束类型变量。
- `Generic[T]`:类继承它成为泛型类。
- `bound=...`:约束 T 必须是某类型(子类)。
- `TypeVar("S", str, bytes)`:限定 T 只能是 str 或 bytes(枚举)。
- `covariant=True`/`contravariant=True`:声明协变/逆变(控制容器子类型关系)。

本篇逐一展开。重点是泛型函数/类的写法、约束(bound/constrained)的区分、协变逆变的原理(最难也最重要)、ParamSpec/TypeVarTuple 进阶。

### 1.4 泛型与运行时

与所有类型注解一样,泛型**不影响运行时**——`list[T]`、`Box[T]` 里的 T 在运行时不强制,mypy 静态检查。但泛型类 `Box(Generic[T])` 在运行时确实创建了一个可参数化的类(`Box[int]` 产生 `GenericAlias`),`isinstance(box, Box)` 工作(但 `isinstance(box, Box[int])` 不工作——运行时不检查类型参数)。这部分运行时细节留第 12 篇,本篇聚焦泛型的静态写法与类型关系。

```python
class Box(Generic[T]):
    def __init__(self, v: T): self.v = v
b: Box[int] = Box(42)
print(isinstance(b, Box))       # True —— isinstance 看 Box 类不看 [int]
# print(isinstance(b, Box[int])) # TypeError!运行时不支持带参数的 isinstance
```

理解泛型是静态层工具(运行时类参数被擦除,称"类型擦除"),就理解了为何 `isinstance(b, Box[int])` 不工作——运行时 T 已擦除,Box[int] 与 Box 是同一类。这条"运行时类型擦除"是泛型与运行时交互的核心,12 篇详述。

建立这些认知后,后续章节展开泛型的具体写法与类型关系。

---

## 2. 核心内容

本章详解 TypeVar 与泛型的完整用法。每节遵循"规则 → demo → 陷阱 → 场景"展开。泛型函数、泛型类、约束(bound/constrained)、协变逆变是重点,协变逆变最难。

### 2.1 泛型函数

泛型函数用 TypeVar 在签名里参数化类型。基本模式:定义 TypeVar,在参数/返回类型里用 T。

**最简泛型函数**:

```python
from typing import TypeVar
T = TypeVar("T")

def first(items: list[T]) -> T:
    return items[0]

# 调用时 T 据实参推导
n = first([1, 2, 3])        # T=int,n: int
s = first(["a", "b"])       # T=str,s: str
# mypy 知道 n 是 int(可 n+1)、s 是 str(可 s.upper()),精确检查
```

`first([1,2,3])` mypy 推导 T=int,返回 int——后续对 n 的操作按 int 检查。这就是泛型函数的价值:通用且每次调用类型精确。

**恒等函数 identity**(经典泛型示例):

```python
T = TypeVar("T")
def identity(x: T) -> T:
    return x
r = identity(42)    # T=int,r: int
r2 = identity("hi") # T=str,r2: str
# identity 保留输入类型,不像 def identity(x: Any) -> Any 丢失类型
```

`identity` 看似无用(原样返回),但它**保留输入类型**——传 int 返回 int、传 str 返回 str。这对中间处理函数(如日志包装器、缓存层)重要,避免"经过一层就变 Any"。

**多类型参数关联**:

```python
K = TypeVar("K")
V = TypeVar("V")
def make_pair(k: K, v: V) -> tuple[K, V]:
    return (k, v)
p = make_pair("age", 30)   # K=str,V=int,p: tuple[str,int]
# K、V 独立推导(可不同),但各自关联输入输出
```

多个 TypeVar(K、V)各自独立推导,但每个在自己关联处同一化。`make_pair("age",30)` 推导 K=str、V=int,返回 `tuple[str,int]`。

**类型关联的约束力**:

```python
T = TypeVar("T")
def add_to_list(lst: list[T], item: T) -> list[T]:   # lst 元素类型与 item 同
    lst.append(item)
    return lst
add_to_list([1, 2], 3)         # T=int,OK
# add_to_list([1, 2], "x")    # mypy 报错!T 不能同时 int 和 str
```

`add_to_list(lst: list[T], item: T)` 约束"lst 的元素类型与 item 同"。`add_to_list([1,2], "x")` 中 lst 是 int 列表、item 是 str,T 冲突,mypy 报错。这种"参数间类型关联"是泛型函数的核心能力,Any/无注解都无法表达。

**泛型函数不需要显式传类型参数**:Python 中调用泛型函数**总是自动推导**,不写 `first[int]([1,2])`(那是其他语言如 Java/Rust 的语法):

```python
first([1, 2, 3])    # 直接调用,T 自动推导为 int
# 不写 first[int]([1,2,3])  —— Python 无此语法(某些场景可显式,见后)
```

Python 泛型函数调用时 T 由实参推导,无需显式指定类型参数。这与 Java 的 `first("a")`(也推导)类似,但 Python 没有显式 `first<Integer>` 语法(运行时不支持,因类型擦除)。极少数需显式指定时(如推导不出),用类型断言或注解变量类型辅助。

### 2.2 泛型类与 Generic

泛型类让自定义容器/数据结构带类型参数。用 `Generic[T]` 基类声明,在方法签名用 T。

**基本泛型类**:

```python
from typing import Generic, TypeVar
T = TypeVar("T")

class Box(Generic[T]):
    def __init__(self, value: T) -> None:
        self.value = value
    def get(self) -> T:
        return self.value
    def set(self, value: T) -> None:
        self.value = value

# 使用时指定类型参数
int_box: Box[int] = Box(42)
print(int_box.get())       # 42,mypy 知道返回 int
int_box.set(100)           # OK,T=int,set 接受 int
# int_box.set("x")         # mypy 报错!Box[int] 只接受 int

str_box: Box[str] = Box("hello")
print(str_box.get().upper())  # HELLO,mypy 知道返回 str
```

`Box(Generic[T])` 声明 Box 是泛型类,带类型参数 T。`Box[int]`、`Box[str]` 是具体化的泛型实例(类型参数分别为 int、str)。每个具体化的 Box 内部 T 一致——`Box[int]` 的 set 只接受 int、get 返回 int。

**泛型容器示例——栈**:

```python
from typing import Generic, TypeVar
T = TypeVar("T")

class Stack(Generic[T]):
    def __init__(self) -> None:
        self._items: list[T] = []
    def push(self, item: T) -> None:
        self._items.append(item)
    def pop(self) -> T:
        return self._items.pop()
    def peek(self) -> T:
        return self._items[-1]

s: Stack[str] = Stack()
s.push("a"); s.push("b")
top: str = s.peek()       # mypy 知道 peek 返回 str(T=str)
# s.push(1)               # mypy 报错:Stack[str] 只推 str
```

`Stack[T]` 表达"元素类型为 T 的栈"。`Stack[str]` 是字符串栈,push/peek/pop 都关联 str。这比 `Stack`(无泛型,元素 Any/object)类型安全得多——编译期就保证栈内元素类型一致。

**属性类型注解**:泛型类的实例属性用 T 标注(`self._items: list[T]`),但**实例属性注解在运行时不强制**(普通类也一样),mypy 检查。注意 `__init__` 里 `self._items: list[T] = []` 把属性类型声明为 `list[T]`(T 具体化后为 `list[int]` 等)。

**多类型参数的泛型类**:

```python
K = TypeVar("K")
V = TypeVar("V")
class Pair(Generic[K, V]):
    def __init__(self, first: K, second: V) -> None:
        self.first = first
        self.second = second
    def swap(self) -> "Pair[V, K]":    # 注意返回类型用 V,K 互换
        return Pair(self.second, self.first)

p: Pair[str, int] = Pair("age", 30)
print(p.first)        # age (str)
print(p.second)       # 30 (int)
swapped = p.swap()    # Pair[int, str]
```

`Pair[K, V]` 两个类型参数,具体化 `Pair[str,int]`。`swap` 返回 `Pair[V, K]`(类型参数互换),需前向引用字符串 `"Pair[V,K]"`(类体内引用自身)。

**继承泛型类**:子类可固定或继续泛型:

```python
# 固定类型参数(子类不再是泛型)
class IntBox(Box[int]):    # IntBox 是 Box[int] 的子类,T 固定为 int
    pass

# 继续泛型(子类仍是泛型)
class MyStack(Stack[T]):   # MyStack 仍是泛型,继承 Stack[T]
    def peek_all(self) -> list[T]:
        return list(self._items)
# 或子类不重复 Generic(继承父类的 TypeVar)
class ClearableStack(Stack[T]):
    def clear(self) -> None:
        self._items.clear()
```

子类可固定类型参数(`IntBox(Box[int])` 失去泛型,T 恒 int),或继承继续泛型(`MyStack(Stack[T])` 仍泛型)。按需选。

### 2.3 TypeVar 的约束:bound 与 constrained

无约束的 `T = TypeVar("T")` 可代表任何类型,但有时需要限制 T 的范围——用 **bound(约束)** 或 **constrained(限定)**。两者语义不同,易混。

**bound(约束)—T 必须是指定类型(或其子类)**:

```python
from typing import TypeVar
# T 必须是 int|float 或其子类(即数字)
Number = TypeVar("Number", bound=int | float)

def double(x: Number) -> Number:
    return x * 2         # 因 T bound 于 int|float,必有 * 2 操作
double(3)        # Number=int,OK
double(3.14)     # Number=float,OK
# double("hi")   # mypy 报错!str 不是 int|float 的子类
```

`TypeVar("Number", bound=int|float)` 声明 Number 必须是 `int|float` 的子类型(即数字)。在 `double` 内,mypy 知道 x 有 int|float 的接口(支持 `* 2`),允许该操作。调用时 `double("hi")` 报错(str 不是数字子类)。

bound 的价值:**让泛型函数内能用 bound 类型的操作**。无约束 T 内部只能用 object 的接口(因 T 可能任意),`bound=Number` 后 T 至少有 Number 的接口,可用数字操作:

```python
T = TypeVar("T")
def f(x: T) -> T:
    # return x + 1    # mypy 报错!无约束 T 可能是任意类型,不一定有 +1
    return x
Number = TypeVar("Number", bound=int | float)
def g(x: Number) -> Number:
    return x + 1       # OK!Number 至少是数字,有 +1
```

无约束 T 内 `x + 1` 报错(T 可能无 `+`),bound 于数字后允许。这是 bound 的实用价值——既保留 T 类型关联,又允许特定操作。

**constrained(限定)—T 只能是指定的几个类型之一(枚举)**:

```python
# T 只能是 str 或 bytes(不是它们的子类,就是这两个或子类)
S = TypeVar("S", str, bytes)
def concat(a: S, b: S) -> S:
    return a + b        # str 和 bytes 都有 +
concat("a", "b")    # S=str,OK
concat(b"a", b"b")  # S=bytes,OK
# concat(1, 2)      # mypy 报错!int 不在 str/bytes 中
```

`TypeVar("S", str, bytes)` 限定 S 只能是 str 或 bytes。这与 bound 不同——bound 是"T 是某类(子类)",constrained 是"T 是这几个类型之一"。

**bound 与 constrained 的关键区别**:

```python
# bound:T 是 NumberType 或其子类(T 范围是开放的——NumberType 的任何子类都行)
T1 = TypeVar("T1", bound=int | float)
# constrained:T 是这几个类型之一(范围是封闭的——只能是列出的)
T2 = TypeVar("T2", str, bytes)

class MyInt(int): pass
def f(x: T1) -> T1: ...
def g(x: T2) -> T2: ...
f(MyInt(1))     # OK!MyInt 是 int 子类,bound 允许
# g(MyInt(1))   # 报错!MyInt 不是 str/bytes,constrained 不允许子类(除非本身是 int 子类匹配?详见规则)
```

- **bound(`bound=X`)**:T 是 X 的子类型(含 X 的任意子类,开放)。T 内部"同一化"——传入类型保留(传 MyInt 返回 MyInt)。
- **constrained(`T, A, B`)**:T 是 A 或 B 之一(封闭,受限)。T 内部"规范化"——传入类型若是最精确的受限类型则保留,但子类会被规范化到约束类型之一(见下)。

**constrained 的"规范化"陷阱**:

```python
S = TypeVar("S", str, bytes)
class MyStr(str): pass
def f(x: S) -> S: ...
r = f(MyStr("hi"))    # S 推导为 str(规范化!不保留 MyStr)
# mypy 把 MyStr 规范化为 str(最近的约束类型),返回 str 不是 MyStr
```

constrained T 传入"约束类型的子类"(如 MyStr 是 str 子类)时,T 被规范化为约束类型(str),不保留子类(MyStr)。而 bound 保留子类(`bound=str` 传 MyStr 返回 MyStr)。这是 bound 与 constrained 在子类型处理上的实质差异——**bound 保留精确类型,constrained 规范化到约束类型**。

**何时用 bound,何时用 constrained**:

- 用 **bound**:需要 T "至少有某些操作/是某类子类",且希望保留传入精确类型。如 `bound=Hashable`(T 可哈希)、`bound=Comparable`(T 可比较)。
- 用 **constrained**:T 必须是已知几个类型之一(如 str 或 bytes),不需要"任意子类"。constrained 较少用,bound 更常见。

```python
# bound 实例:T 可哈希(能做 dict 键)
from typing import Hashable, TypeVar
H = TypeVar("H", bound=Hashable)
def make_dict(keys: list[H]) -> dict[H, int]:
    return {k: 0 for k in keys}
```

`bound=Hashable` 让 T 限于可哈希类型(可做 dict 键),且保留精确类型。这是 bound 的典型用法——限制 T 到"有某能力"的类型。

**bound 与 Union 的区分**:`bound=int | float` 是"T 是 int 或 float 的子类",`int | float`(bound 内)是 T 的上界;不是"T 是 int 或 float 两个之一"(那是 constrained)。bound 的参数是"上界类型",constrained 的多参数是"允许的枚举类型":

```python
T = TypeVar("T", bound=int | float)    # bound:T 是 (int|float) 的子类
T = TypeVar("T", int, float)           # constrained:T 是 int 或 float 之一
```

理解 bound(上界约束、保留子类)与 constrained(枚举限定、规范化子类)的差异,是写对约束 TypeVar 的关键。日常多用 bound,constrained 谨慎用。

### 2.4 协变与逆变(重点难点)

协变(covariance)与逆变(contravariance)描述**泛型容器的子类型关系**——当 `Dog` 是 `Animal` 子类时,`list[Dog]` 是不是 `list[Animal]` 子类?这取决于容器的"变型"(variance)。这是泛型最难也最重要的概念,决定泛型类能否正确参与子类型。

**问题起源**:子类型关系(a 是 b 子类,记 `a <: b`)是否"传递"到泛型容器?

```python
class Animal: pass
class Dog(Animal): pass      # Dog <: Animal

# list[Dog] 是不是 list[Animal] 的子类?
dogs: list[Dog] = [Dog()]
animals: list[Animal] = dogs    # 这个赋值安全吗?
```

`animals: list[Animal] = dogs` 把"狗列表"赋给"动物列表"变量——安全吗?这取决于"list 能否当协变容器":

- 若 list 协变:`list[Dog] <: list[Animal]`,允许(狗列表"是一种"动物列表)。
- 若 list 不变(invariant):不允许(需精确 `list[Animal]`)。

**为何 list 是不变(invariant)而非协变?** 因 list 可变且可写:

```python
dogs: list[Dog] = [Dog()]
animals: list[Animal] = dogs    # 若允许(协变)
animals.append(Cat())           # 往"动物列表"加猫 —— 但 animals 实际是 dogs!
# dogs 现在含 Cat,类型污染!故 list 协变不安全
```

若 list 协变,`animals = dogs` 后 `animals.append(Cat())` 会把猫塞进 dogs 列表(因 animals 和 dogs 同一对象),类型污染。故 **Python 的 list/mutable 序列是不变(invariant)的**——`list[Dog]` 不是 `list[Animal]` 子类,赋值 `animals = dogs` mypy 报错。

```python
dogs: list[Dog] = [Dog()]
# animals: list[Animal] = dogs   # mypy 报错!list 不变,list[Dog] ≠ list[Animal]
```

**协变(covariant)——只读容器是协变的**:若容器只读(不暴露写接口),协变是安全的:

```python
# 序列只读(Sequence 不可变接口),协变安全
from typing import Sequence
dogs: Sequence[Dog] = [Dog()]
animals: Sequence[Animal] = dogs   # mypy 允许!Sequence 协变
# 因 Sequence 不暴露 append,不会把猫塞进 dogs,安全
```

`collections.abc.Sequence`(不可变序列,只有 `__getitem__`/`__len__`,无 append)是协变的——`Sequence[Dog] <: Sequence[Animal]`,允许赋值。因为只读,不会类型污染。

**三种变型总结**:

| 变型 | 关系 | 安全条件 | 典型 |
|------|------|---------|------|
| 协变(covariant) | `A <: B ⇒ F[A] <: F[B]` | F 只读 A(不写) | `Sequence[T]`、`Iterator[T]` |
| 逆变(contravariant) | `A <: B ⇒ F[B] <: F[A]` | F 只写 A(不读) | 函数参数 `Callable[[T], R]` 的 T |
| 不变(invariant) | 无关系(除非 A=B) | F 既读又写 A | `list[T]`、`dict[K,V]`、`set[T]` |

**逆变——函数参数**:函数类型在参数位置是逆变的。`Callable[[Animal], None]` 是 `Callable[[Dog], None]` 的子类(反过来!):

```python
from typing import Callable
class Animal: pass
class Dog(Animal): pass

def feed_animal(a: Animal) -> None: ...    # 喂任意动物
def feed_dog(d: Dog) -> None: ...          # 只喂狗

# 哪个能赋给"喂狗的函数"变量?
feed: Callable[[Dog], None]
feed = feed_animal   # OK!能喂动物的函数"也是一种"喂狗函数(更宽的能替窄的)
# feed = feed_dog    # 报错!只喂狗的不能当"喂狗"?实际 feed_dog 类型正匹配,这是逆变的方向
```

逆变的直觉:"需要一个喂 Dog 的函数"时,给一个"喂 Animal 的函数"是安全的(能喂动物的肯定能喂狗,狗也是动物)。反过来不安全(只喂狗的遇到猫就崩)。故 `Callable[[Animal],None] <: Callable[[Dog],None]`(参数逆变,方向反转)。这是"函数参数逆变"的语义根源——更通用的函数能替代更专用的。

**声明 TypeVar 的变型**:默认 TypeVar 是不变。声明协变/逆变:

```python
from typing import TypeVar, Generic

# 协变 TypeVar(用于只读位置)
T_co = TypeVar("T_co", covariant=True)
# 逆变 TypeVar(用于只写位置)
T_contra = TypeVar("T_contra", contravariant=True)

# 协变泛型类(只读 T,如不可变容器)
class ImmutableList(Generic[T_co]):
    def __init__(self, items: tuple[T_co, ...]) -> None:
        self._items = items
    def get(self, i: int) -> T_co:    # 只读 T(get 返回 T),协变安全
        return self._items[i]
    # 无 set/append(写 T 会破坏协变)

# 逆变泛型类(只写 T,如消费者)
class Consumer(Generic[T_contra]):
    def consume(self, x: T_contra) -> None:   # 只写 T(参数),逆变安全
        print(x)
```

**协变/逆变的声明规则**:

- 协变 T(`covariant=True`):T 只能出现在**返回位置**(只读),不能在参数位置(写)。违反则 mypy 报错。
- 逆变 T(`contravariant=True`):T 只能出现在**参数位置**(只写),不能在返回位置(读)。
- 不变 T(默认):T 可读可写(任意位置),但失去子类型关系。

```python
T_co = TypeVar("T_co", covariant=True)
class Bad(Generic[T_co]):
    def add(self, x: T_co) -> None: ...   # mypy 报错!协变 T 不能在参数(写)位置
class Good(Generic[T_co]):
    def get(self) -> T_co: ...            # OK,协变 T 在返回(读)位置
```

协变 T 出现在参数位置(写)mypy 报错——因写会破坏协变安全性(协变要求只读)。这是声明变型时的硬约束。

**何时需要显式声明协变/逆变?**

- 自定义**不可变容器**(只读,如 frozen/immutable 结构):声明协变,让 `MyContainer[Dog] <: MyContainer[Animal]`。
- 自定义**消费者**(只接收 T 不返回,如回调注册器):声明逆变。
- 默认(可读可写):不变,不声明。

实际经验:**多数泛型类保持不变(默认)即可**——只有"纯只读容器"或"纯消费者"才显式声明协变/逆变,且需严格保证 T 不出现在破坏变型的位置。声明变型是为让子类型关系正确,但用错(声明协变却又写 T)会更危险(类型污染),故保守起见,不确定就保持不变。

```python
# Python 内置的不变容器:list/dict/set(可读可写)——不变
# Python 内置的协变:Sequence/Iterator(只读)——协议层协变
# 故 list[Dog] ≠ list[Animal],但 Sequence[Dog] <: Sequence[Animal]
```

理解协变(只读,正向)、逆变(只写,反向)、不变(读写,无关)三种变型,以及"可变容器为何不变"(防类型污染)、"只读容器为何协变"(无污染风险),是写对泛型容器的核心。这是本篇最难部分,值得反复读:协变逆变的本质是"读写的方向性决定子类型传递的方向"。

### 2.5 进阶:ParamSpec 与 TypeVarTuple

`TypeVar` 表达"单个类型参数",但有两类需求它力不从心:转发函数的**完整参数签名**(参数个数与类型都未知)、**可变数量类型参数**。Python 3.10/3.11 引入 `ParamSpec` 与 `TypeVarTuple` 解决。

**ParamSpec——参数规格(转发完整签名)**:装饰器常需"接收任意函数,返回同签名函数",传统用 `Any` 失去类型:

```python
# 传统(失去类型):装饰器返回 Any
def log(func: Any) -> Any:
    def wrapper(*args, **kwargs):
        print("call")
        return func(*args)
    return wrapper
@log
def add(a: int, b: int) -> int: return a + b
r = add(1, 2)   # r: Any(失去 int),且 add(1,"x") 不再检查(签名丢失)
```

`ParamSpec`(3.10+)捕获函数的完整参数签名(参数列表作为整体),转发时保留:

```python
from typing import ParamSpec, TypeVar, Callable
P = ParamSpec("P")           # 参数规格(代表一个参数列表)
R = TypeVar("R")             # 返回类型

def log(func: Callable[P, R]) -> Callable[P, R]:
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        print("call")
        return func(*args, **kwargs)
    return wrapper

@log
def add(a: int, b: int) -> int: return a + b
r = add(1, 2)        # r: int(保留!) —— P=(int,int),R=int
# add(1, "x")        # mypy 报错!保留签名,检查 b 应是 int

@log
def greet(name: str) -> str: return "hi " + name
g = greet("Alice")   # g: str,P=(str,),R=str
```

`ParamSpec("P")` 捕获 `func` 的参数签名(整体),`Callable[P, R] -> Callable[P, R]` 表达"接收 P 签名返回 R 的函数,返回同 P 同 R 的函数"。`wrapper(*args: P.args, **kwargs: P.kwargs)` 用 `P.args`/`P.kwargs` 转发 P 捕获的参数。这让装饰器**完整保留被装饰函数的类型签名**,add/greet 都保持精确类型。这是 ParamSpec 的核心价值——类型安全的装饰器/转发。

**ParamSpec 的 `P.args`/`P.kwargs`**:P 在 `*args: P.args`、`**kwargs: P.kwargs` 中转发参数,这两个是 ParamSpec 特有的用法(只能在 `*args`/`**kwargs` 位置)。不能单独用 P 作普通类型(P 是参数列表规格,不是单类型)。

**TypeVarTuple——可变类型参数**:表达"可变数量类型参数"的泛型,如 `tuple[int, str, float]`(异构元组,元素类型数不定):

```python
from typing import TypeVarTuple, Generic, Unpack
Ts = TypeVarTuple("Ts")     # 类型变量元组

class Array(Generic[Unpack[Ts]]):     # 接受可变类型参数
    def __init__(self, *values: Unpack[Ts]) -> None:
        self.values = values

# 用法(3.11+ 的 Unpack 语法,*Ts 旧式)
a: Array[int, str] = Array(1, "x")         # Ts=(int,str)
b: Array[int, str, float, bool] = Array(1, "x", 2.0, True)  # Ts=(int,str,float,bool)
```

`TypeVarTuple("Ts")` 是"类型变量的元组",`Generic[Unpack[Ts]]`(3.11+ `Unpack[Ts]`,旧 `*Ts`)让类接受可变数量类型参数。`Array[int,str]`、`Array[int,str,float,bool]` 都能匹配,Ts 捕获具体类型元组。

**TypeVarTuple 的典型用途**:异构元组操作、形状类型(NumPy 数组形状)、多维泛型。日常较少用,主要在类型密集的库。

```python
# tuple 内置已支持类似(异构元组)
t: tuple[int, str, float] = (1, "x", 2.0)   # tuple 本身就是可变类型参数泛型
```

**ParamSpec 与 TypeVarTuple 的版本**:

- `ParamSpec`:3.10+(typing)。
- `TypeVarTuple`:3.11+(`Unpack[Ts]` 语法),3.10 有 `*Ts` 旧式。
- 两者较新,且偏高级,主要用于类型密集的库(装饰器框架、数值计算)。日常业务泛型用 TypeVar + bound 已够。

**何时用进阶**:

- 装饰器/转发任意函数 → ParamSpec(保留签名)。
- 可变类型参数/异构结构 → TypeVarTuple。
- 单类型关联 → TypeVar(本篇主体)。

理解 ParamSpec(参数规格转发)、TypeVarTuple(可变类型参数)是 TypeVar 之外的补充工具,在写类型安全的装饰器/高级泛型时使用。本篇主体是 TypeVar + 协变逆变,ParamSpec/TypeVarTuple 作进阶了解,日常多数泛型用前者即可。

### 2.6 泛型协议与抽象类型

`TypeVar` 的 `bound` 可绑定到普通类(如 `bound=int|float`),也可绑定到 **Protocol/ABC**(抽象类型),表达"T 必须实现某协议/接口"。这是泛型与结构化类型结合的用法。

**bound 于 Protocol**(结构化约束):

```python
from typing import TypeVar, Protocol

# 定义协议:可比较大小
class Comparable(Protocol):
    def __lt__(self, other: "Comparable") -> bool: ...

T = TypeVar("T", bound=Comparable)    # T 必须是可比的(实现 __lt__)

def sort(items: list[T]) -> list[T]:
    # 因 T bound 于 Comparable,内部可用 < 比较
    return sorted(items)
sort([3, 1, 2])       # OK,int 实现 __lt__
sort(["b", "a"])      # OK,str 实现 __lt__
# sort([object()])    # 报错!object 没实现 Comparable 协议
```

`bound=Comparable`(Protocol)约束 T 必须实现 `__lt__`(可比较)。这让 `sort` 内部能用 `<`(因 T 至少可比),且只接受可比类型。Protocol 的"结构化"特性让任何"有 __lt__ 的类型"自动符合(无需继承),配合 bound 表达"T 有某能力"。

**bound 于 ABC**(名义约束):

```python
from typing import TypeVar
from collections.abc import Hashable
H = TypeVar("H", bound=Hashable)    # T 必须可哈希
def make_set(items: list[H]) -> set[H]:
    return set(items)    # 因 H 可哈希,能做 set 元素
make_set([1, 2, 3])      # OK
# make_set([[1, 2]])     # 报错!list 不可哈希
```

`bound=Hashable`(ABC)约束 T 可哈希。ABC 的约束是"按行为判"(Hashable 的 `__subclasshook__`,详见类型判断篇),list 不可哈希故被排除。

**Protocol/ABC 作 bound 的价值**:比 `bound=int|float` 更抽象——后者限具体类,前者限"接口能力"。`bound=Comparable` 不限定具体类型,只要求"能比较",这让泛型对"任何满足协议的类型"开放,极大通用。这是泛型 + 协议的威力——类型安全的鸭子类型。

**泛型协议(Generic Protocol)**:Protocol 本身也可是泛型:

```python
from typing import Protocol, TypeVar
T = TypeVar("T")

class Container(Protocol[T]):     # 泛型协议
    def get(self) -> T: ...
    def put(self, x: T) -> None: ...

def use(c: Container[int]) -> None:   # 用 int 容器
    c.put(42)
```

`Container(Protocol[T])` 是泛型协议,`Container[int]` 表"装 int 的容器"。这结合协议(结构化)与泛型(类型参数),表达"任意容器类型,元素是 T"。Protocol 详见标准库 typing 专题,本篇了解"bound 可绑定 Protocol/ABC 表达能力约束"即可。

### 2.7 综合示例:泛型数据结构

下面这个片段综合演示泛型函数、泛型类、bound 约束、协变的协作,实现一个类型安全的缓存容器:

```python
from typing import TypeVar, Generic, Hashable, Callable, ParamSpec

# 1. 泛型函数:取列表首元素,保留元素类型
T = TypeVar("T")
def first(items: list[T]) -> T:
    return items[0]
n = first([1, 2, 3])      # int
s = first(["a", "b"])     # str
print(n + 1, s.upper())

# 2. 泛型类:类型安全的缓存(键可哈希,值任意)
K = TypeVar("K", bound=Hashable)    # 键必须可哈希
V = TypeVar("V")                    # 值任意
class Cache(Generic[K, V]):
    def __init__(self) -> None:
        self._store: dict[K, V] = {}
    def set(self, key: K, value: V) -> None:
        self._store[key] = value
    def get(self, key: K) -> V | None:
        return self._store.get(key)

cache: Cache[str, int] = Cache()
cache.set("age", 30)
age = cache.get("age")     # int | None
if age is not None:
    print(f"age={age + 1}")   # 31
# cache.set(42, "x")           # 报错:Cache[str,int] 键应 str 值应 int

# 3. bound 约束:数字求和(T bound 于数字)
Number = TypeVar("Number", bound=int | float)
def sum_all(items: list[Number]) -> Number:
    total: Number = items[0]
    for x in items[1:]:
        total = total + x    # Number 至少是数字,支持 +
    return total
print(sum_all([1, 2, 3]))        # 6 (int)
print(sum_all([1.5, 2.5]))       # 4.0 (float)
# sum_all(["a", "b"])            # 报错:str 非数字

# 4. 协变:只读容器
T_co = TypeVar("T_co", covariant=True)
class FrozenBag(Generic[T_co]):
    """只读不可变 bag,协变(只读 T)。"""
    def __init__(self, items: tuple[T_co, ...]) -> None:
        self._items = items
    def first(self) -> T_co:        # 协变 T 在返回位置(只读)
        return self._items[0]
# 协变验证:Dog 是 Animal 子类
class Animal: pass
class Dog(Animal): pass
dogs: FrozenBag[Dog] = FrozenBag((Dog(),))
animals: FrozenBag[Animal] = dogs   # 允许!FrozenBag 协变
# 因 FrozenBag 只读,不会把 Cat 塞进 dogs,安全

# 5. ParamSpec 装饰器:保留签名
P = ParamSpec("P")
R = TypeVar("R")
def logged(func: Callable[P, R]) -> Callable[P, R]:
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        print(f"calling {func.__name__}")
        return func(*args, **kwargs)
    return wrapper
@logged
def add(a: int, b: int) -> int: return a + b
print(add(1, 2))    # 3,且 mypy 知 add(a:int,b:int)->int(签名保留)
# add(1, "x")       # 报错:保留签名检查
```

跑一遍这段示例,对照输出:泛型函数保留元素类型、Cache 泛型类键值类型安全、bound 约束数字求和、FrozenBag 协变子类型、ParamSpec 装饰器保留签名——TypeVar 泛型的核心能力就完整呈现了。

核心结论:**TypeVar 建立类型关联(同一化)、Generic[T] 造泛型类、bound 限 T 能力、协变逆变定容器子类型关系、ParamSpec 转发签名**。这是泛型实践的总纲。

---

## 3. 最佳实践

### 3.1 需要"输入输出类型关联"才用 TypeVar,否则用具体/Any/object

```python
# 需要 T 关联(first 元素类型=返回类型):用 TypeVar
def first(items: list[T]) -> T: ...
# 不需关联(任意输入):用 object/具体类型
def count(items: list[object]) -> int:
    return len(items)
```

TypeVar 的价值是"类型关联"。若函数不涉及类型关联(如 `len` 返回固定 int),用 `list[object]` 或具体类型即可,无需 TypeVar。泛型不为泛型而泛型,有真实关联才用。

### 3.2 泛型类继承 Generic[T],方法签名用 T 保持一致

```python
class Stack(Generic[T]):
    def push(self, item: T) -> None: ...   # 用 T 保持类型一致
    def pop(self) -> T: ...
# 不要在泛型类里用 Any 替代 T(破坏类型安全)
# class BadStack(Generic[T]):
#     def pop(self) -> Any: ...   # 丢失 T 类型
```

泛型类内方法用 T 标注,保持"该类型的栈只进出该类型"。混入 Any 会破坏泛型安全(类型逃逸)。一致性贯穿所有方法。

### 3.3 默认 TypeVar 不变,只读/只写才显式声明协变/逆变

```python
# 默认不变(可读可写容器):list/dict 等
T = TypeVar("T")
class Box(Generic[T]): ...    # 不变,Box[Dog] ≠ Box[Animal]
# 只读容器:协变
T_co = TypeVar("T_co", covariant=True)
class ReadOnly(Generic[T_co]): ...    # ReadOnly[Dog] <: ReadOnly[Animal]
# 只写/消费者:逆变
T_contra = TypeVar("T_contra", contravariant=True)
class Sink(Generic[T_contra]): ...
```

多数泛型类保持默认不变(安全保守)。仅"纯只读容器"才协变,"纯只写消费者"才逆变,且严守"T 不出现在破坏变型的位置"。不确定就保持不变——声明错变型比不变更危险(类型污染)。

### 3.4 bound 表达"T 有某能力",优于无约束 T

```python
# 推荐:bound 让 T 有数字接口,可用 +
Number = TypeVar("Number", bound=int | float)
def add(a: Number, b: Number) -> Number:
    return a + b
# 无约束 T 内部只能用 object 接口
T = TypeVar("T")
def add_bad(a: T, b: T) -> T:
    # return a + b    # 报错!无约束 T 可能无 +
    return a
```

需要 T 内部用某类型操作(如 +、<、__hash__)时,用 `bound=X` 让 T 至少有 X 的接口。无约束 T 只能用 object 接口(受限)。bound 平衡"通用 + 可操作"。

### 3.5 优先 bound 而非 constrained(枚举)

```python
# 推荐:bound(开放,T 可是 X 任意子类,保留精确类型)
T = TypeVar("T", bound=int | float)
# 少用:constrained(封闭,规范化子类到枚举类型)
S = TypeVar("S", str, bytes)
```

bound 比 constrained 更灵活、保留子类型精确性。constrained 会规范化子类(MStr→str),通常不期望。多数约束场景用 bound,只有"严格限定几个已知类型"才 constrained。

### 3.6 装饰器用 ParamSpec 保留被装饰函数签名

```python
from typing import ParamSpec, Callable
P = ParamSpec("P"); R = TypeVar("R")
def deco(func: Callable[P, R]) -> Callable[P, R]:
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        return func(*args, **kwargs)
    return wrapper
# 不要用 Callable[..., Any](丢签名)或 Any
```

写类型安全装饰器用 ParamSpec 捕获并转发完整签名,保留被装饰函数的参数与返回类型。避免 `Callable[..., Any]`(丢签名)或 `Any`(全放行)。3.10+ 用 ParamSpec。

### 3.7 泛型类运行时 isinstance 只能查类,不查类型参数

```python
class Box(Generic[T]): ...
b: Box[int] = Box(42)
isinstance(b, Box)        # True(查 Box 类)
# isinstance(b, Box[int]) # TypeError!运行时类型擦除,不检查 [int]
```

因运行时类型擦除,`isinstance(x, 泛型类[参数])` 不支持(报 TypeError)。只能 `isinstance(x, 泛型类)` 查裸类。需运行时验类型参数,得自己存类型或用框架。理解类型擦除避免误用。

### 3.8 多个独立类型用多个 TypeVar,不要硬塞一个

```python
# 推荐:K、V 各自独立
K, V = TypeVar("K"), TypeVar("V")
def make(k: K, v: V) -> tuple[K, V]: ...
make("age", 30)   # K=str,V=int(独立)
# 不要用一个 T 强求同类型(除非确实要同类型)
# def make(k: T, v: T) -> tuple[T, T]: ...   # 限制 k,v 同类型
```

独立类型用独立 TypeVar(K、V),不强制关联。只有真"需同类型"才用单 T 关联。TypeVar 数量按关联需求定,不多不少。

### 3.9 类型参数命名用单字母大写 T/U/K/V,可读性优先

```python
T = TypeVar("T")          # 通用元素
K = TypeVar("K"); V = TypeVar("V")   # 键值
T_co = TypeVar("T_co", covariant=True)   # 协变(后缀 _co)
```

TypeVar 命名用约定单字母 `T/U/K/V`(数学变量风格),协变/逆变加 `_co`/`_contra` 后缀。一致性提升泛型代码可读性,团队易读。

### 3.10 泛型类继承时:固定类型 vs 继续泛型按需选

```python
class IntBox(Box[int]): ...    # 固定 T=int,IntBox 非泛型
class MyStack(Stack[T]): ...   # 继续泛型,MyStack 仍泛型
```

子类固定类型参数(失去泛型,专用)或继承继续泛型(保持通用),按子类用途选。专用子类固定,通用扩展继续泛型。

### 3.11 协变/逆变声明后严守 T 出现位置

```python
T_co = TypeVar("T_co", covariant=True)
class Good(Generic[T_co]):
    def get(self) -> T_co: ...      # OK,协变 T 只在返回
class Bad(Generic[T_co]):
    def set(self, x: T_co): ...     # mypy 报错!协变 T 不能在参数(写)
```

声明协变后,T 只能出现在返回位置(读);逆变 T 只能参数位置(写)。违反 mypy 报错。声明变型等于承诺"T 只读/只写",要兑现,否则类型安全破。

### 3.12 泛型与原型:tuple 异构、Callable 协议等优先用内置

```python
# tuple 异构用内置(已是可变类型参数泛型)
t: tuple[int, str, float] = (1, "x", 2.0)
# Callable 用内置
def f(cb: Callable[[int], str]) -> None: ...
# 不必为这些自建 TypeVar(除非自定义协议)
```

tuple 异构、Callable 等已有内置泛型支持,直接用内置,不必自建 TypeVar。TypeVar 用于"自定义泛型"(自己的函数/类),内置覆盖的不重复造。

---

## 4. 原理

本章讲清 TypeVar 泛型的机制:类型变量的同一化规则、协变逆变的子类型推导、为何 mutable 容器不变(类型污染)、bound/constrained 的类型规则差异、运行时类型擦除、ParamSpec/TypeVarTuple 的实现。这些是"泛型为何如此"的根基。

### 4.1 TypeVar 的同一化机制(需理解,详述)

TypeVar 的核心机制是**同一化(unification)**——在一次函数调用/类实例化中,一个 TypeVar 必须被具体化为单一类型,所有出现该 TypeVar 的位置同一为该类型。这是泛型类型检查的基础。

**同一化的过程**:

```python
T = TypeVar("T")
def pair(a: T, b: T) -> tuple[T, T]: ...
# 调用 pair(1, 2)
# mypy 推导:1 是 int → T 候选 int;2 是 int → T 候选 int
# 同一化:T = int(所有候选一致)
# 结果:pair(1,2) 类型为 tuple[int, int]
```

mypy 在调用 `pair(1, 2)` 时:从实参推导 T 的候选(1→int,2→int),若候选一致(都 int),T 同一化为 int,函数类型具体化为 `tuple[int, int]`。若候选冲突(`pair(1, "x")`:1→int,"x"→str),同一化失败,mypy 报错"T 不能同时是 int 和 str"。

**同一化的"最近公共上界"优化**:当候选类型不同但有子类关系时,mypy 取"最近公共上界":

```python
class Animal: pass
class Dog(Animal): pass
pair(Dog(), Animal())    # 候选 Dog、Animal,公共上界 Animal
# T 同一化为 Animal(不是 Dog,也不是报错,因 Dog <: Animal)
# 结果:tuple[Animal, Animal]
pair(Dog(), Cat())       # 假设 Cat <: Animal,公共上界 Animal
# T = Animal
```

`pair(Dog(), Animal())` 实参 Dog 和 Animal,T 同一化为它们的公共上界 Animal(因 Dog 是 Animal 子类,Animal 能涵盖两者)。这是同一化的"宽松"策略——找能涵盖所有实参的最小类型。若无公共上界(如 int 和 str 无子类关系),才报错。

**同一化的"独立性"——不同 TypeVar 独立**:

```python
K, V = TypeVar("K"), TypeVar("V")
def make(k: K, v: V) -> tuple[K, V]: ...
make(1, "x")    # K=int(从 1),V=str(从 "x"),独立同一化
# K、V 各自独立推导,不要求相同
```

不同 TypeVar(K、V)各自独立同一化,互不约束。`make(1, "x")` K=int、V=str。只有"同一 TypeVar 的多处出现"才要求同一化,不同 TypeVar 独立。

**同一化的类型安全意义**:同一化保证"相关位置类型一致",这是 TypeVar 相对 Any 的全部力量。Any 处处独立(无关联),TypeVar 通过同一化建立关联:`list[T] -> T` 中输入元素与返回同类型,无 Any 逃逸。理解同一化,就理解 TypeVar 为何能"既通用又类型安全"——它在调用点把类型"钉死"(具体化),后续基于精确类型检查,而非 Any 的含糊。

### 4.2 协变逆变:子类型关系传递的方向性(需理解,详述)

§2.4 讲了协变逆变的用法,这里讲清其子类型推导的根源——**变型是"泛型容器子类型关系如何由元素子类型关系决定"的规则**。

**回顾子类型**:`A <: B`(A 是 B 子类)意味着"任何需 B 处可用 A"。如 `bool <: int`(bool 可替 int)。

**泛型容器的子类型问题**:给定 `A <: B`,`F[A]` 与 `F[B]` 的子类型关系如何?这取决于 F 对类型参数的"使用方式"(读/写),即变型:

- **协变(covariant)**:`A <: B ⇒ F[A] <: F[B]`(同向)。F 只"产出"A(读,返回 A),不"消费"(不写 A)。
- **逆变(contravariant)**:`A <: B ⇒ F[B] <: F[A]`(反向)。F 只"消费"A(写,参数 A),不"产出"(不返回 A)。
- **不变(invariant)**:无关系(除非 A=B)。F 既读又写 A。

**为何协变要求"只读"?** 用反证法看类型安全:

```python
# 假设 list 协变(实际不变)
class Dog(Animal): pass
dogs: list[Dog] = [Dog()]
animals: list[Animal] = dogs    # 若协变允许(实际 mypy 拒绝)
animals.append(Cat())           # 写 Cat 进"动物列表"(实际是 dogs)
# dogs 现含 Cat(类型污染!从 dogs 读出 Cat 当 Dog 用会崩)
```

若 list 协变,`animals = dogs` 后 `animals.append(Cat())` 把 Cat 写入 dogs(因同对象),污染——后续从 dogs 读出 Cat 当 Dog 用危险。故**可写容器不能协变**(要不变)。只有只读容器(无写接口)协变才安全——只读不会把错类型塞入。

**为何逆变要求"只写"?** 对称地:

```python
# 函数参数逆变:Callable[[Animal],None] <: Callable[[Dog],None]
# (能喂动物的函数"也是"喂狗函数)
def feed_animal(a: Animal): ...
def feed_dog(d: Dog): ...
# "需要喂狗函数"处,给"喂动物函数"安全:
need_dog_feeder: Callable[[Dog], None] = feed_animal   # OK(逆变)
# 反之不安全:给"只喂狗函数"当"喂动物函数",遇到猫崩
# need_animal_feeder: Callable[[Animal], None] = feed_dog   # 报错!
```

函数在参数位置"消费"参数。能处理 Animal(更宽)的函数,能处理 Dog(Dog 是 Animal)——故"需喂 Dog 函数"处可用"喂 Animal 函数"(逆变,反向)。反之,"喂 Dog 函数"不能当"喂 Animal 函数"(遇到 Cat 崩)。这是参数逆变的类型安全根源——更通用的消费者能替代更专用的。

**变型的位置规则(读/写位置)**:

- 协变 T 只在**返回位置**(产出/读):如 `def get() -> T`。
- 逆变 T 只在**参数位置**(消费/写):如 `def consume(x: T)`。
- 不变 T 在**读+写位置**:如 `list[T]` 的 append(写)+ getitem(读)。

mypy 据TypeVar 的声明(`covariant`/`contravariant`/默认)与 T 出现位置验证:协变 T 出现在参数(写)位置报错(破坏只读约定),逆变 T 出现在返回(读)报错。这是变型声明后的硬约束——声明变型等于承诺读写方向。

**为何 Python 内置 list/dict 不变而 Sequence 协变**:

```python
# list:可写(append),含读+写 → 不变
# Sequence(collections.abc):只读接口(__getitem__/__len__,无 append)→ 协变
```

`list` 提供读写(append + getitem),故不变(防污染);`Sequence` 只读(无 append),故协变(无污染风险)。Python 据接口能力决定变型:list 因可写而不变,Sequence 因只读而协变。自定义泛型类同理——只读容器声明协变,读写容器保持不变。

理解变型是"读写方向决定子类型传递方向"——产出位协变(同向)、消费位逆变(反向)、读写位不变。这是类型系统保证泛型容器类型安全的核心规则。变型虽难,但本质就这一条:"读的方向同,写的方向反,读写则不变"。

### 4.3 bound 与 constrained 的类型规则差异

§2.3 讲了 bound/constrained 的用法与"保留子类 vs 规范化"差异,这里讲清其类型规则根源。

**bound 的类型规则——上界约束**:

```python
# T = TypeVar("T", bound=X) 等价声明:T 是 X 的子类型(T <: X)
Number = TypeVar("Number", bound=int | float)
# Number <: (int | float),即 Number 是 int 或 float 的子类型
def f(x: Number) -> Number: ...
# 调用 f(MyInt()):
# MyInt <: int <: (int|float),满足 bound,Number = MyInt(保留精确子类)
```

bound 声明"T 的上界是 X",即 `T <: X`。调用时 T 可是 X 的任意子类(含 X 及其所有子类),T 同一化为传入的精确类型(保留子类)。`f(MyInt())`(MyInt 是 int 子类)推导 Number=MyInt(保留),因 MyInt 满足 `MyInt <: int|float`。

bound 内部,mypy 把 T 当 X 的子类型处理——可用 X 的接口(因 T 至少是 X,有 X 的方法),且 T 保留精确性(传入 MyInt 仍是 MyInt 不是 int)。

**constrained 的类型规则——枚举约束**:

```python
# T = TypeVar("T", A, B) 等价声明:T 是 A 或 B 之一
S = TypeVar("S", str, bytes)
# S ∈ {str, bytes}(枚举,封闭集合)
def g(x: S) -> S: ...
# 调用 g(MStr())(MStr <: str):
# 推导:S 规范化为 str(最近的约束枚举值),不保留 MStr
```

constrained 声明"T 只能是这几个类型之一"(枚举),`T ∈ {A, B}`。调用时若传入约束类型的子类(如 MStr 是 str 子类),T 被规范化到约束类型(str),不保留子类。这是 constrained 与 bound 的类型规则差异——constrained "规范化"到枚举值,bound "保留"精确子类。

**为何规范化的差异?** constrained 的语义是"T 是这几个类型之一",其类型规则为每个 T 出现处"选择最近的枚举值"。传入 MStr(子类),最近的枚举值是 str(因 MStr <: str),故 T=str。这与 bound"T 是 X 的子类,保留精确"不同——bound 允许任意子类,T 即传入类型;constrained 限定枚举,T 规范化到枚举值。

**bound 与 constrained 的选择根源**:

- 需"任意满足上界的子类,保留精确"——bound。如 `bound=Hashable` 接受 int/str/tuple(元素可哈希)等,各自精确。
- 需"严格这几个类型,规范化"——constrained。如 str|bytes,接受 str(bytes)规范化到 str(bytes)。

理解 bound(`T <: X` 上界、保留子类)与 constrained(`T ∈ {A,B}` 枚举、规范化子类)的类型规则差异,就理解为何"日常多用 bound"——bound 保留精确子类更符合"通用泛型"期望,constrained 的规范化常非期望行为。

### 4.4 运行时类型擦除

§1.4 提到 `isinstance(b, Box[int])` 不工作,根源是**类型擦除(type erasure)**——Python 泛型在运行时擦除类型参数,泛型类的类型参数不参与运行时类型判断。

**类型擦除的表现**:

```python
class Box(Generic[T]): ...
b: Box[int] = Box(42)       # 编译期:Box[int]
# 运行期:Box[int] 擦除为 Box(b 的运行时类型是 Box 实例,无 [int] 信息)
print(type(b))              # <class '__main__.Box'>(不含 int)
isinstance(b, Box)          # True(查 Box 类)
# isinstance(b, Box[int])   # TypeError!运行时 Box[int] 不可用作 isinstance 参数
```

`Box[int]` 在运行时擦除——`b` 的运行时类型就是 `Box`(无 int 信息)。`isinstance(b, Box)` 查裸 Box 类工作,但 `isinstance(b, Box[int])` 报 TypeError(运行时不支持带类型参数的 isinstance,因类型参数已擦除)。

**为何擦除?** Python 的泛型是静态层机制(给 mypy 检查),运行时不强制类型。若运行时保留类型参数(像 Java 的部分泛型信息),需在每个对象附带类型参数信息,开销大且与动态类型冲突。Python 选择擦除——泛型类的对象运行时只知"是哪个类",不知"类型参数是什么",与无泛型时一致。这简化实现、保持运行时性能,代价是运行时无法验类型参数。

**擦除与运行时反射的补充**:`Box[int]` 这个**类型注解对象**(GenericAlias)运行时存在(可 `get_args(Box[int])` 取得 `(int,)`),但**类的实例**(Box(42))不携带类型参数。故:

```python
print(Box[int])          # Box[int](注解对象存在)
print(typing.get_args(Box[int]))   # (int,) 可反射注解
b = Box(42)
print(type(b))           # Box(实例类型擦除,无 int)
```

`Box[int]`(类型对象)可反射,`b`(实例)类型擦除。这是"注解层有类型信息,实例层无"的不对称。框架若需运行时类型参数,得自己存(如 Pydantic 在 `__init__` 存字段类型)或从注解反射(从类注解读 Box[T] 的 T)。

**类型擦除的实战影响**:

```python
# 1. isinstance 只查裸类
isinstance(x, list)        # True(查 list)
# isinstance(x, list[int]) # TypeError(擦除)
# 用 typing.get_origin/get_args 反射类型对象(注解层)
# 2. 运行时无法"按类型参数分发"
def process(x): 
    # if isinstance(x, list[int]): ...   # 不可能(擦除)
    if isinstance(x, list):              # 只能查裸类
        ...
```

运行时类型参数擦除意味着:不能按类型参数 isinstance 分发,只能查裸类。需运行时类型参数能力的,用框架(Pydantic/dataclass 存字段类型)或显式存类型。这是 Python 泛型相对 Java(C# 部分保留运行时泛型)的限制——但与"注解不影响运行时"一致,Python 选择静态泛型 + 运行时擦除。

### 4.5 ParamSpec 与 TypeVarTuple 的实现

进阶 TypeVar 的实现:

**ParamSpec**:`ParamSpec("P")` 是特殊的类型变量,代表"一个完整的参数规格"(参数列表 + 关键字参数,整体)。它不是单类型,而是参数列表类型:

```python
P = ParamSpec("P")
# P 代表一个参数列表规格,如 (int, str) 或 (x: int, y: str, *, z: bool)
# P.args:该规格的位置参数,P.kwargs:关键字参数
def f(func: Callable[P, R]) -> Callable[P, R]: ...
# P 在两处 Callable 同一化:被装饰函数与返回函数签名一致
```

ParamSpec 的机制:它捕获一个函数的完整参数规格,在 `P.args`/`P.kwargs` 转发时,保证转发的参数与原函数签名严格匹配。这比 `Callable[..., R]`(`...` 是任意参数,无类型)精确——P 保留具体参数类型,`...` 丢弃。ParamSpec 的同一化保证"装饰前后签名一致",这是类型安全装饰器的机制。

**TypeVarTuple**:`TypeVarTuple("Ts")` 是"类型变量的可变元组",代表"零或多个类型":

```python
Ts = TypeVarTuple("Ts")
class Array(Generic[Unpack[Ts]]): ...
# Ts 可匹配零到多个类型:Array[int]、Array[int, str]、Array[int,str,float]...
# Ts 在实例化时同一化为一个类型元组
```

TypeVarTuple 的机制:它是一个"类型槽位序列",匹配可变数量类型参数。`Array[int, str]` 时 Ts=(int, str)(一个类型元组)。这扩展了 TypeVar(单类型)到"多类型",用于异构结构(如 tuple 的可变类型、NumPy 形状)。`Unpack[Ts]`(3.11+,旧 `*Ts`)在 `Generic[...]` 内展开 Ts 为可变参数。

**ParamSpec/TypeVarTuple 的同一化**:与 TypeVar 同一化类似,但作用于"参数规格"或"类型元组"整体。`f(func: Callable[P, R]) -> Callable[P, R]` 中 P 在两处同一(装饰前后同规格),`g(*args: P.args)` 转发 P 的参数。TypeVarTuple 的 Ts 同一化为元组,各位置独立。

理解 ParamSpec(参数规格变量,转发签名)、TypeVarTuple(可变类型元组,异构结构)是 TypeVar 的两类扩展,在写高级泛型(装饰器、异构容器)时使用。它们是 3.10/3.11+ 较新特性,机制上共享 TypeVar 的同一化,但作用于更大粒度(规格/元组)。

---

## 5. 总结

### 5.1 本文内容回顾

- **泛型与 TypeVar**:泛型是"参数化类型",TypeVar 是类型变量(类型占位符);核心是"同一化"——相关位置 T 同一类型,建立输入输出类型关联;对比 Any(无关联)/object(松弛),TypeVar 既通用又精确。
- **泛型函数**:`def f(x: list[T]) -> T`,调用自动推导 T;类型关联约束(pair(a:T,b:T) 要同类型);不需显式传类型参数(运行时擦除)。
- **泛型类**:`class Box(Generic[T])`,方法签名用 T 保持一致;多类型参数 `Generic[K,V]`;子类固定类型或继续泛型。
- **TypeVar 约束**:bound(上界,`bound=X`,T 是 X 子类,保留精确子类);constrained(枚举,`T,A,B`,T 是 A 或 B,规范化子类);bound 优先(灵活保留子类);bound 内可用 X 接口。
- **协变逆变(重点)**:变型定容器子类型关系——协变(只读,同向 `F[A]<:F[B]`)、逆变(只写,反向 `F[B]<:F[A]`)、不变(读写,无关);mutable 容器(list/dict)不变防类型污染,只读(Sequence)协变;声明 `covariant=True`/`contravariant=True`,严守 T 出现位置。
- **进阶**:ParamSpec(参数规格,转发完整签名,类型安全装饰器,`P.args`/`P.kwargs`);TypeVarTuple(可变类型元组,异构结构,`Unpack[Ts]`)。
- **泛型协议/抽象**:bound 可绑定 Protocol/ABC 表"T 有某能力"(结构化约束,如 `bound=Comparable`/`bound=Hashable`),泛型协议 `Protocol[T]`。
- **原理**:TypeVar 同一化(一次调用 T 钉死单类型,候选冲突报错,公共上界优化);协变逆变的子类型方向(读产出位协变同向、写消费位逆变反向、读写位不变,防类型污染);bound(`T<:X` 保留子类)vs constrained(`T∈{A,B}` 规范化)类型规则差异;运行时类型擦除(泛型实例不携带类型参数,isinstance 只查裸类);ParamSpec/TypeVarTuple 共享同一化但作用规格/元组。
- **最佳实践**:有类型关联才用 TypeVar、泛型类方法一致用 T、默认不变只读/写才声明变型、bound 表达能力、优先 bound、装饰器用 ParamSpec、isinstance 只查裸类、独立类型多 TypeVar、命名 T/U/K/V、子类按需固定/泛型、变型声明守位置、内置泛型优先。

### 5.2 读完本文你应能掌握

- 说明 TypeVar 的定义与"同一化"机制,用泛型函数 `def f(x: list[T]) -> T` 表达输入输出类型关联,对比 Any/object。
- 用 `Generic[T]` 定义泛型类,方法签名用 T 保持类型一致,定义多类型参数泛型类,子类固定/继续泛型。
- 用 bound(`bound=X`)约束 T 上界(保留子类、可用 X 接口),用 constrained(`T,A,B`)限定枚举(规范化子类),阐述两者差异并优先 bound。
- 阐述协变/逆变/不变三种变型及其读写位置规则,说明 mutable 容器为何不变(类型污染)、只读容器为何协变,声明协变/逆变 TypeVar。
- 用 ParamSpec 写类型安全装饰器(转发签名),了解 TypeVarTuple 表达可变类型参数。
- 用 Protocol/ABC 作 bound 表达"T 有某能力"的结构化约束。
- 阐述 TypeVar 同一化、协变逆变的子类型推导、bound/constrained 类型规则、运行时类型擦除、ParamSpec/TypeVarTuple 实现等原理。

### 5.3 延伸方向

- **类型注解运行时行为**:`Generic[T]` 运行时表示、`__orig_bases__`、泛型类反射 `get_type_hints`/`get_args`、Pydantic/dataclass 用泛型,见《类型注解运行时行为》。
- **mypy 静态检查**:mypy 如何推导 TypeVar、检查协变/逆变、bound 违反,见《mypy 静态类型检查》。
- **Union 与 Any**:TypeVar 与 Union/Optional 结合(受约束联合)、Any 逃逸在泛型里的影响,见《Union 与 Any 类型》。
- **进阶 typing**:Protocol(Generic Protocol)、@overload(配合 TypeVar 的多返回)、TypedDict、Generic 的 `__class_getitem__`,见标准库 typing 专题。
- **类型论**:参数化多态(parametric polymorphism)、子类型多态、协变逆变的形式化,深入类型系统理论。
