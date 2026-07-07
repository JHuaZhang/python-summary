---
group:
  title: 【02】基础数据类型和类型系统
  order: 2
order: 9
title: 类型注解基础
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是类型注解

类型注解(type hints / type annotations)是 Python 3.5+ 引入的一套**给代码标注期望类型的语法**。它让你在变量、函数参数、返回值旁边写上"这里应该是什么类型",如 `def greet(name: str) -> str:`。Python 是动态类型语言(变量无类型、对象有类型),类型注解为这种动态语言增加了一层**可选的、声明式的类型信息**,服务于静态检查、文档、IDE 补全等目的。

```python
# 无注解(传统动态写法)
def greet(name):
    return "Hello, " + name

# 有注解(标注参数与返回类型)
def greet(name: str) -> str:
    return "Hello, " + name
```

理解类型注解,最关键的一点是:**它不影响运行时行为**。注解默认只是"元数据",Python 解释器在运行时**不强制检查**类型——你标注 `name: str`,但传一个 `int` 进去,程序照常运行(直到真正因类型不匹配出错才报错)。注解主要给**静态类型检查器**(如 `mypy`、`pyright`)和 IDE 用,让它们在你运行代码前就能发现类型错误:

```python
def greet(name: str) -> str:
    return "Hello, " + name
# 运行时:传 int 不报错(直到拼接时才 TypeError)
greet(42)    # 运行到 "Hello, " + 42 才抛 TypeError,而非调用时
# 但 mypy 静态检查会提前报错:greet(42) 类型不匹配
```

这一"注解不影响运行时"的特性是初学者最需建立的认知。类型注解是**development-time(开发期)**工具,不是 runtime(运行时)强制。Python 通过这种方式,既保留了动态类型的灵活,又获得了静态类型检查的好处——这是"渐进式类型化"(gradual typing)的设计哲学,你可以在大型项目中逐步添加注解,不必一次性全改。

为什么要用类型注解?在小型脚本里它可有可无,但在中大型项目里价值巨大:

- **提前发现错误**:静态检查器在运行前就能抓出"传错类型""返回错类型""属性不存在"等 bug,而非等运行时崩溃。据统计,大量运行时错误本质是类型错误,静态检查能消除其中绝大部分。
- **代码即文档**:注解让函数签名自解释——`def process(data: list[int]) -> dict[str, int]:` 一眼说明"接收 int 列表、返回 str→int 字典",胜过注释或读实现。
- **IDE 补全与重构**:IDE 根据注解提供精准的自动补全、跳转定义、安全重构。`name: str` 后输入 `name.` 会提示 str 的方法。
- **大型项目协作**:注解是团队间的"类型契约",降低跨模块调用的认知负担,重构时检查器守住接口。

类型注解生态主要由三部分构成:

1. **语法**:Python 内置的注解语法(`: 类型`、`-> 类型`、`变量: 类型`)。
2. **typing 模块**:提供 `List`/`Dict`/`Optional`/`Union`/`Any`/`TypeVar` 等类型构造工具(本次基础篇重点)。
3. **静态检查器**:`mypy`、`pyright` 等工具,读注解做检查(`mypy` 留待第 13 篇详述)。

本篇作为"类型注解"子系列(第 9~13 篇)的入门,聚焦于**注解的基础语法与基本类型标注**:变量注解、函数注解、内置类型作注解、容器类型(`list`/`dict`/`tuple`/`set`)注解、`Optional`/可空、`typing` 模块入门、注解的存储与运行时行为概览。Union/Any/TypeVar 泛型等进阶留待第 10、11 篇,运行时深入留第 12 篇,mypy 实操留第 13 篇。

### 1.2 动态类型与渐进式类型化

要理解注解的位置,先回顾 Python 的类型哲学。Python 本质是**动态类型**的——

- **变量无类型,对象有类型**:`x = 10` 后 `x` 指向 int,`x = "hi"` 后 `x` 指向 str,`x` 本身只是名字,类型随所指对象变。
- **类型检查在运行时**:`x + 1` 运行到这一行才检查 `x` 当前所指对象能否 `+ 1`,而非编译期。

```python
x = 10           # x 是 int
x = "hello"      # x 变 str,合法(动态类型)
x + 1            # 运行时 TypeError(str 不能 + 1)
```

动态类型的好处是**灵活、简洁、快速原型开发**——无需声明类型,代码短,改类型无障碍。坏处是**类型错误推迟到运行时**:`x + 1` 的错误要等执行到才暴露,大型项目里这可能导致"上线后特定路径才崩"的隐患。

**渐进式类型化**(gradual typing)是折中:**在动态类型基础上,可选地添加静态类型注解**。加了注解的部分可被静态检查,没加的部分仍是动态。这让你:

- 新项目可全程注解(类型安全)。
- 老项目可逐步加注解(不破坏现有代码)。
- 快速原型可不注解(灵活),稳定后再补注解(安全)。

Python 的注解就是渐进式类型化的实现——**注解可选、不强制运行时、由外部工具静态检查**。这与 Java/C# 的"类型是语言强制的、编译期检查"截然不同。Python 没有编译期,注解是"附加信息",检查由 `mypy` 等独立工具完成,而非解释器。

```python
# 渐进式:这个函数注解了(静态检查覆盖)
def add(a: int, b: int) -> int:
    return a + b
# 这个函数没注解(不检查,纯动态)
def mystery(x):
    return x.foo()   # x 啥都行,运行到才知有没有 foo
```

理解渐进式类型化,就理解了注解的定位:它是"动态类型的可选增强",不是"把 Python 变成 Java"。你按需在关键接口、公共 API、复杂模块加注解,获得静态保障;在简单脚本、原型代码可不加,保留灵活。

### 1.3 类型注解速览

讲清定位前,先给出注解的全貌速览,建立印象:

```python
# 1. 变量注解
count: int = 0
name: str = "Alice"
pi: float = 3.14
items: list[int] = [1, 2, 3]      # Python 3.9+ 内置泛型写法

# 2. 函数注解:参数 + 返回值
def repeat(word: str, times: int) -> str:
    return word * times

# 3. 容器类型注解
scores: dict[str, int] = {"Alice": 90}    # dict: 键类型, 值类型
point: tuple[int, int] = (10, 20)          # tuple: 各位置类型
mixed: tuple[int, str, float] = (1, "x", 2.0)  # 固定长度异构元组
unique: set[str] = {"a", "b"}

# 4. 可空(可能 None)
def find(key: str) -> str | None:   # 3.10+ 写法(也用 Optional[str])
    ...

# 5. 多类型(任一)
def parse(x: int | str) -> int:     # 3.10+ 写法(也用 Union[int, str])
    ...

# 6. 不标注(动态,Any)
def anything(x): ...
```

几个关键符号:

- `: 类型` 标注变量/参数。
- `-> 类型` 标注函数返回值。
- `list[int]`、`dict[str, int]` 等是**泛型**写法(容器 + 元素类型),3.9+ 可直接用内置类型(以前需 `typing.List[int]`)。
- `X | Y` 是**联合类型**(X 或 Y),3.10+ 语法(以前需 `typing.Union[X, Y]`)。
- `str | None` 等价 `Optional[str]`(可能为 None)。

这些是注解的基础语法,后续章节逐一展开。本篇聚焦"基础类型 + 容器 + Optional + Union 入门 + Any 入门",泛型(TypeVar)、Protocol、 Callable 等进阶留后续。

### 1.4 注解的运行时行为概览

虽然注解"主要给静态检查器用",但它在运行时也并非完全不存在——解释器会把注解**存起来**,供运行时访问。这部分深入机制留第 12 篇,这里给概览:

```python
def greet(name: str) -> str:
    return "Hello, " + name
# 注解存在函数的 __annotations__ 属性里
print(greet.__annotations__)
# {'name': <class 'str'>, 'return': <class 'str'>}
```

注解默认存进 `__annotations__` 字典(键是参数名/'return',值是类型)。运行时可读取它,但**解释器不基于它做类型检查**——你不传 str 也不会在调用时报错。注解的运行时存在主要是"元数据",供框架(如 FastAPI 用注解做参数解析、Pydantic 用注解做数据验证)和工具(mypy)消费。

理解这点就理解了注解的双重身份:**静态层**(给 mypy/IDE 检查)和**运行时层**(存为 `__annotations__` 元数据,但默认不强制)。日常主要关注静态层(写对注解让 mypy 满意),运行时层在用 FastAPI/Pydantic 等框架时才需深入——那留第 12 篇。

建立这些认知后,后续章节展开注解的具体写法与规则。

---

## 2. 核心内容

本章详解类型注解的基础语法。每节遵循"规则 → demo → 陷阱 → 场景"展开。变量注解、函数注解、容器泛型、Optional/Union 是重点,因为它们是日常注解的高频部分。

### 2.1 变量注解

变量注解用 `变量名: 类型` 标注,可带初始值也可不带。Python 3.6+ 支持。

**带初始值的变量注解**(最常见):

```python
count: int = 0
name: str = "Alice"
pi: float = 3.14
active: bool = True
items: list[int] = [1, 2, 3]     # 容器类型注解(3.9+)
```

`count: int = 0` 声明"count 是 int 并赋 0"。注解 `: int` 是给检查器的提示,`= 0` 是运行时赋值。两者并存。

**不带初始值的变量注解**(只声明类型,不赋值):

```python
# 只标注类型,不赋值(运行时不创建变量!)
result: str
# print(result)   # NameError:result 未定义!注解不创建变量
result = "done"   # 之后赋值
print(result)     # done
```

⚠️ **关键陷阱:不带初始值的变量注解不创建变量**。`result: str`(无 `=`)只把注解记入模块/作用域的 `__annotations__`,但**不在运行时创建 `result` 变量**。直接用 `result` 会 `NameError`。这与"声明变量"的直觉不同——Python 没有纯粹的"声明",`x: int` 不赋值就是个注解记录,不是变量声明。要创建变量必须赋值(`result: str = ""` 或后续 `result = "done"`)。

不带初始值的注解主要用于:模块级常量/类型说明(配合后续赋值)、类属性前置声明(类体内 `attr: str` 然后在 `__init__` 赋值)。

**类属性注解**(类体内声明属性类型):

```python
class User:
    name: str          # 类属性注解(只声明类型,不赋实例属性)
    age: int = 0       # 带默认值的类属性

    def __init__(self, name: str):
        self.name = name    # 实例属性在 __init__ 赋值
```

类体内 `name: str` 声明"User 实例有 name 属性,类型 str",给检查器提示;实际属性在 `__init__` 里 `self.name = name` 创建。这种"类体内注解 + __init__ 赋值"是类属性注解的标准模式。也可用 `@dataclass` 自动生成 `__init__`(见后续专题)。

**注解的位置规则**:

```python
# 模块级注解
MAX_SIZE: int = 100

def f():
    # 函数内局部变量注解
    local_var: int = 42
    # 局部注解默认不被 mypy 严格检查(除非配置),主要用于可读性
```

模块级注解(常量、全局变量)是 mypy 检查的重点;函数内局部变量注解也可写,但局部注解的价值相对小(局部变量类型通常一目了然),按需添加。

**注解不强制运行时**:

```python
x: int = "hello"    # 注解 int,赋 str —— 运行时不报错!
print(x)            # hello
# 但 mypy 会报错:Incompatible types in assignment
```

`x: int = "hello"` 运行时完全不报错(注解只是元数据,赋什么是什么),mypy 静态检查才会发现"注解 int 却赋 str"。这再次印证"注解不影响运行时"。所以**注解写错不会导致运行时报错,只会让静态检查失败**——写注解要靠自觉正确,配合 mypy 才有意义。

### 2.2 函数注解:参数与返回值

函数注解是注解最高频的场景,标注参数类型和返回值类型。语法:参数用 `参数名: 类型`,返回值用 `-> 类型` 放在 `:` 前。

**基本函数注解**:

```python
def greet(name: str) -> str:
    return "Hello, " + name

def add(a: int, b: int) -> int:
    return a + b

def print_info(msg: str) -> None:    # 返回 None 表"无返回值"
    print(msg)
```

- `name: str` 标注参数 name 是 str。
- `-> str` 标注返回值是 str。
- `-> None` 表示函数无返回值(返回 None)。这是表达"副作用函数"(只打印/只修改、不返回有意义值)的标准注解。

**参数默认值与注解**:

```python
# 默认值写在类型注解之后
def greet(name: str = "World") -> str:
    return f"Hello, {name}"
# 等价于 def greet(name: str = "World") —— 注解在 = 前,默认值在 = 后
print(greet())        # Hello, World
print(greet("Alice")) # Hello, Alice
```

注解与默认值的顺序:`参数名: 类型 = 默认值`。注解在前,默认值在后。

**`*args` 和 `**kwargs` 的注解**:

```python
def f(*args: int, **kwargs: str) -> None:
    # args 是 int 元组,kwargs 是 str 值字典
    for a in args:
        print(a)        # a: int
    for k, v in kwargs.items():
        print(k, v)     # v: str
f(1, 2, 3, x="a", y="b")
```

`*args: int` 注解的是**每个参数的类型**(args 是 int 的元组,不是"args 本身是 int"),`**kwargs: str` 同理(kwargs 值是 str)。这是 `*args`/`**kwargs` 注解的正确语义——标注的是可变参数的元素类型。

**注解的位置参数 vs 关键字参数**:

```python
def create_user(name: str, *, age: int, active: bool = True) -> dict:
    # name 是位置或关键字参数;age/active 是仅关键字参数(* 后)
    return {"name": name, "age": age, "active": active}
create_user("Alice", age=30)        # 正确
# create_user("Alice", 30)          # TypeError:age 必须关键字传
```

`*` 强制后续参数关键字传,注解照常写。注解与参数传递机制(位置/关键字/仅关键字)正交,只标类型。

**不标注的参数**:可以部分注解、部分不注解(渐进式),但通常要么全注解要么全不注解,混用易困惑:

```python
def f(a: int, b):     # a 注解了,b 没有 —— 合法但不推荐
    ...
```

**注解的运行时存储**:

```python
def greet(name: str) -> str:
    return "Hello, " + name
print(greet.__annotations__)
# {'name': <class 'str'>, 'return': <class 'str'>}
```

函数注解存入 `__annotations__` 字典,键是参数名/'return'。myself 读这个做检查,运行时不强制。

### 2.3 内置类型作注解

Python 的内置类型(`int`/`str`/`float`/`bool`/`bytes`/`None` 等)可直接作注解——这是最基础的注解形式。

```python
def f(x: int, y: float, name: str, flag: bool, data: bytes) -> None:
    ...

age: int = 30
score: float = 95.5
name: str = "Alice"
active: bool = True
raw: bytes = b"data"
```

内置类型作注解直观——`int` 标注整数、`str` 标注字符串,无需导入。注意:

**`bool` 注解与 bool 子类**:`bool` 是 `int` 子类,故 `True`/`False` 也能赋给 `int` 注解的变量(mypy 允许 bool→int):

```python
x: int = True    # mypy 允许(bool 是 int 子类),运行时 True==1
# 反之不行
# y: bool = 1    # mypy 可能报错(int 不一定是 bool)
```

**`None` 作注解**:`None` 可直接作返回类型(表无返回值),也可作类型(等价 `NoneType`):

```python
def log(msg: str) -> None:   # 返回 None
    print(msg)
# None 作类型注解,等价 type(None)
x: None = None
```

`-> None` 是函数无返回值的标准注解。`x: None` 罕见(只接受 None 单例),通常用 `Optional[X]` 表"可能 None"。

**特殊:object 注解**:`object` 是所有类根基类,`x: object` 表示"接受任意类型"(但比 `Any` 更受限——mypy 会要求你用前先 narrowing):

```python
def f(x: object) -> None:
    # x 可以是任何对象,但 mypy 不让你直接调特定方法(需先 isinstance 收窄)
    print(x)
f(42); f("hi"); f([1,2])   # 都合法
```

`object` 注解表"任意类型但类型未知",与 `Any`(任意类型且不做检查)有别(§2.7)。

**自定义类作注解**:你自己定义的类也可直接作注解:

```python
class User:
    def __init__(self, name: str):
        self.name = name

def get_name(user: User) -> str:    # User 类直接作注解
    return user.name
```

自定义类作注解是面向对象代码的标准用法——标注对象所属的类。注解里直接用类名,无需引号。

**前向引用(forward reference)**:当注解的类还未定义(如类方法返回自身类型)时,用字符串引号包住类名:

```python
class Tree:
    def __init__(self, value: int):
        self.value = value
    def add_child(self, child: "Tree") -> None:   # "Tree" 字符串,因 Tree 类体未执行完
        ...
```

`child: "Tree"` 用字符串避免"Tree 还未定义完就引用"的 NameError。Python 3.10+ 可用 `from __future__ import annotations` 让所有注解默认延迟为字符串(不立即求值),解决前向引用(§4.5 详述)。基础场景记住"引用未定义的类用引号"。

### 2.4 容器类型的泛型注解

容器类型(`list`/`dict`/`tuple`/`set`/`frozenset`)的注解需要指明**元素类型**——这叫泛型注解(generic),用 `容器[元素类型]` 写法。这是注解相对复杂的部分,规则较多。

**`list[T]`:元素类型为 T 的列表**:

```python
scores: list[int] = [90, 85, 92]        # int 列表
names: list[str] = ["Alice", "Bob"]     # str 列表
nested: list[list[int]] = [[1, 2], [3]] # 嵌套:int 列表的列表

def average(nums: list[float]) -> float:
    return sum(nums) / len(nums)
```

`list[int]` 表示"元素都是 int 的列表"。这与 `list`(不指明元素类型)不同——`x: list` 表"任意元素列表",检查器不知元素类型;`list[int]` 精确到元素。

**`dict[K, V]`:键类型 K、值类型 V 的字典**:

```python
ages: dict[str, int] = {"Alice": 30, "Bob": 25}   # str→int 字典
config: dict[str, list[int]] = {"ids": [1, 2]}    # 嵌套

def count_words(words: list[str]) -> dict[str, int]:
    # 返回 词→频次
    result: dict[str, int] = {}
    for w in words:
        result[w] = result.get(w, 0) + 1
    return result
```

`dict[str, int]` 两个类型参数:键类型、值类型。

**`tuple` 的三种注解形式**(tuple 注解最特殊,因元组可固定长度异构):

```python
# 1. 固定长度、固定类型(同构):tuple[int, ...]
nums: tuple[int, ...] = (1, 2, 3)    # 任意长度的 int 元组(... 表任意长度)

# 2. 固定长度、异构类型:tuple[int, str, float]
point: tuple[int, int] = (10, 20)              # 长度 2,两个 int
record: tuple[int, str, float] = (1, "Alice", 3.14)  # 长度 3,各类型不同
pair: tuple[str, int] = ("age", 30)

# 3. 空元组:tuple[()]
empty: tuple[()] = ()
```

⚠️ tuple 注解的关键区分:

- `tuple[int, ...]`(注意 `...`):**任意长度**的同构 int 元组(可 0 个、3 个、100 个 int)。
- `tuple[int, int]`:**恰好 2 个** int 元组(长度固定)。
- `tuple[int, str, float]`:恰好 3 个,类型依次 int/str/float(异构)。

```python
nums: tuple[int, ...] = (1, 2, 3, 4)   # OK,任意长度
# nums: tuple[int, ...] = (1, "x")     # 错!"x" 不是 int
pair: tuple[int, str] = (1, "x")       # OK,固定 (int, str)
# pair: tuple[int, str] = (1, 2)       # 错!第二个应是 str 不是 int
# pair: tuple[int, str] = (1, "x", 3)  # 错!长度应是 2 不是 3
```

tuple 异构注解(`tuple[int, str]`)非常适合"固定结构记录"(如 (id, name)、坐标 (x, y)),能精确表达"第 0 位是 int、第 1 位是 str"。这是 tuple 相对 list 的注解优势——可表达固定结构。

**`set[T]` / `frozenset[T]`**:

```python
tags: set[str] = {"python", "code"}       # str 集合
unique_ids: set[int] = {1, 2, 3}
frozen: frozenset[int] = frozenset([1, 2])
```

**内置泛型写法的历史**(重要):`list[int]` 这种"用内置类型作泛型"的写法是 **Python 3.9+ 才支持**的(PEP 585)。3.9 之前,必须用 `typing` 模块的 `List`/`Dict`/`Tuple`/`Set`:

```python
# Python 3.9+ (推荐,简洁)
def f(nums: list[int]) -> dict[str, int]: ...

# Python 3.8 及以前(需 typing 大写)
from typing import List, Dict, Tuple
def f(nums: List[int]) -> Dict[str, int]: ...
point: Tuple[int, int] = (10, 20)
```

`typing.List[int]`(大写)与 `list[int]`(小写,3.9+)语义等价,后者是现代写法。新项目用小写内置泛型;若需兼容 3.8 及以前,用 `typing` 大写。本篇示例用 3.9+ 小写写法(现代标准),提到大写作兼容说明。

**注解的元素类型不 enforcement 运行时**:

```python
scores: list[int] = [90, 85]
scores.append("oops")    # 运行时不报错!(注解不强制)
# mypy 会报错:Argument 1 to "append" has incompatible type "str"
```

`list[int]` 注解的列表 append str,运行时不报错(注解不强制运行时),mypy 才发现。再次印证注解是静态工具。

### 2.5 Optional 与可空类型

`Optional[X]` 表示"值可能是 X 类型,也可能是 None"——即**可空类型**。这是处理"查找可能失败""字段可缺失"等场景的标准注解,极其常用。

**`Optional[X]` 的两种写法**(等价):

```python
from typing import Optional

# 写法一:Optional(老写法,所有版本)
def find(key: str) -> Optional[str]:
    if key in data:
        return data[key]
    return None           # 可能返回 str,也可能 None

# 写法二:X | None(3.10+,现代推荐)
def find(key: str) -> str | None:
    ...
```

`Optional[str]` 等价 `str | None`(3.10+ 语法),也等价 `Union[str, None]`(§2.6)。三种写法语义相同,3.10+ 推荐 `str | None`(简洁、无需导入),兼容老版本用 `Optional[str]`。

**`Optional` 的核心价值——防止 None 误用**:

```python
def get_user(id: int) -> Optional[dict]:
    if id == 1:
        return {"name": "Alice"}
    return None

user = get_user(999)
# 没有 Optional 提示,可能直接用:
# print(user["name"])   # 运行时 TypeError(None 不可索引)
# 有了 Optional[dict],mypy 会要求你先判 None:
if user is not None:     # mypy 在这里"收窄"类型,user 变 dict
    print(user["name"])  # mypy 知道 user 是 dict,允许 ["name"]
else:
    print("不存在")
```

`Optional[dict]` 让 mypy 知道返回值可能 None,从而**强制你先 `is not None` 判断再访问**——否则 mypy 报错"dict | None 不可索引"。这就是 Optional 的安全价值:把"可能 None"声明出来,检查器逼你处理 None 分支,消除 "对 None 操作" 的运行时 bug。

**`if user is not None:` 的类型收窄(narrowing)**:

```python
user: dict | None = get_user(999)
# 此处 user: dict | None,mypy 不允许 user["name"]
if user is not None:
    # 此处 mypy 收窄 user 为 dict(排除了 None),允许 user["name"]
    print(user["name"])
# 出了 if,user 又是 dict | None
```

mypy 在 `if x is not None:` 块内**收窄** `x` 的类型为非 None(从 `X | None` 变 `X`),允许访问 X 的方法。这是类型检查的核心机制,让 Optional 既安全又好用——你判 None 后,检查器就当它是非 None。

⚠️ **`Optional[X]` 不等于"可选参数"**(常见混淆):

```python
# Optional 表"值可能是 X 或 None",不是"参数可不传"
def f(x: Optional[int] = None):   # 参数可不传(默认 None),且接受 int/None
    ...
# 上面实际是"可选参数(默认 None)+ 接受 int/None 类型"
# 等价:x: int | None = None

# 仅"可选参数"不等于 Optional:
def g(x: int = 0):     # 参数可不传(默认 0),但只接受 int(传 None 会 mypy 报错)
    ...
```

`Optional[int]` 是"类型可 int 或 None",`x: int = 0` 是"参数可选(默认0)但类型只能 int",二者不同。`def f(x: Optional[int] = None)` 是"可选参数且默认 None、类型 int|None"的组合,常用于"可空的可选参数"。

**默认 None 必须配 Optional/None|**:

```python
# 正确:默认 None 的参数,类型标注要含 None
def f(x: int | None = None): ...
def f(x: Optional[int] = None): ...
# 错误(mypy):默认 None 但类型不含 None
# def f(x: int = None): ...   # mypy 报错:默认 None 与类型 int 不符
```

参数默认值是 `None`,类型注解必须包含 None(`Optional[int]` 或 `int | None`),否则 mypy 报"默认值 None 与类型 int 矛盾"。这是注解一致性的基本要求。

### 2.6 Union:联合类型

`Union[X, Y]` 表示"值可能是 X 或 Y 中任意一种类型"——**联合类型**。它泛化 `Optional`(`Optional[X] = Union[X, None]`),允许两个以上非 None 的类型组合。

**`Union` 的两种写法**(等价):

```python
from typing import Union

# 写法一:Union(老写法)
def parse(x: Union[int, str]) -> int:
    if isinstance(x, str):
        return int(x)
    return x

# 写法二:X | Y | Z(3.10+,现代推荐)
def parse(x: int | str) -> int:
    ...
# 多个类型
def f(x: int | str | float) -> str:
    return str(x)
```

`Union[int, str]` 等价 `int | str`(3.10+),允许传 int 或 str。3.10+ 推荐用 `|`(简洁、无需导入),兼容老版本用 `Union`。

**Union 的使用场景**——"一个函数/变量接受多种类型":

```python
# 接受数字或数字字符串,统一转 int
def to_int(x: int | str) -> int:
    if isinstance(x, str):
        return int(x)
    return x
print(to_int(42))      # 42
print(to_int("42"))    # 42

# 字段可存 int 或 str
id_value: int | str = "A001"
id_value = 1001        # 也可改 int

# 返回多种类型(慎用,可能设计有问题)
def get(x: str) -> int | str:
    if x.isdigit():
        return int(x)
    return x
```

**Union 的 isinstance 收窄**:像 Optional,mypy 在 `isinstance` 判断后收窄类型:

```python
def f(x: int | str) -> int:
    if isinstance(x, int):     # mypy 收窄:x 为 int
        return x + 1           # 允许 int 运算
    else:                      # mypy 推断:x 为 str
        return len(x)          # 允许 str 操作
```

`isinstance(x, int)` 分支内 mypy 知道 x 是 int,else 分支推断为 str。这让 Union 配合 isinstance 能安全操作各类型。这是处理 Union 的标准模式——用 isinstance 区分后分别处理。

**Union vs 任一类型 Any**:Union 是"有限几个已知类型",Any 是"任意类型不检查":

```python
# Union[int, str]:已知的两种,检查器按这两种检查
def f(x: int | str): ...
# Any:任意类型,检查器放行不做检查
def g(x: Any): ...
```

能用 Union 明确列出可能的类型,就不要用 Any——Union 让检查器仍能验证(配合 isinstance),Any 则关闭检查。`int | str` 比 `Any` 安全得多(§2.7)。

**Union 的顺序与冗余**:

```python
# Union 顺序无关:Union[int, str] == Union[str, int]
# 重复类型被简化:Union[int, int] == int
# Union[X, None] 即 Optional[X],mypy 鼓励写 Optional
```

Union 的类型顺序不影响语义(`int|str` 等价 `str|int`),重复类型自动简化(`int|int`→`int`),`Union[X, None]` 推荐写 `Optional[X]`/`X | None`。

⚠️ **`X | Y` 写法的兼容性**:`int | str` 在注解里用(`-> int | str`、`x: int | str`)是 3.10+ 语法。3.9 及更早注解里写 `int | str` 会运行时报错(TypeError,因 int 的 `__or__` 旧版不支持类型)。3.9 及更早要用 `Union[int, str]`,或 `from __future__ import annotations`(3.7+,注解不立即求值,§4.5)。3.10+ 的运行时(非注解)里 `int | str` 也可用作类型对象(PEP 604)。

Union/Optional 的进阶(协议、联合的字面量类型 Literal 等)留第 10 篇。本篇掌握"Union 表多类型、配合 isinstance 收窄、优先 `|` 写法"即可。

### 2.7 Any 与 NoReturn

`Any` 表示"任意类型"——关闭类型检查的"逃生舱"。需谨慎使用。

**`Any` 关闭检查**:

```python
from typing import Any

def f(x: Any) -> Any:
    return x.foo() + x.bar()   # mypy 不检查 foo/bar 是否存在!
# 传啥都行,运行到才知对错
f(42)          # 运行时 AttributeError(int 没有 foo)
f("hi")        # 运行时 AttributeError
```

`Any` 让检查器对该变量**完全不检查**——任何操作都放行。这关闭了类型安全,等于"这里放弃静态保障"。`Any` 用于:与无注解的旧代码交互、动态结构(JSON 解析结果、ORM 查询)、确实无法确定类型场景。

**`Any` vs `object`**(重要区分):

```python
def f_any(x: Any) -> Any:
    return x.upper()    # mypy 放行,不检查(可能运行时崩)

def f_obj(x: object) -> object:
    # return x.upper()    # mypy 报错!object 没有 upper,需先 isinstance 收窄
    if isinstance(x, str):
        return x.upper()
    return str(x)
```

- `Any`:任意类型,**检查器放行不检查**(unsafe)。
- `object`:任意类型,**检查器要求你用前 isinstance 收窄**(safe,因 object 只有所有对象共有的方法)。

`object` 比 `Any` 安全——它表达"任意类型但类型未知,用前必须收窄",检查器会强制你 isinstance。`Any` 表"任意类型且不做检查",放弃安全。**优先用 `object` 而非 `Any`**——同样"接受任意",object 保留检查(迫使你显式处理未知类型),Any 关闭检查。

**`Any` 的来源——动态类型值默认 Any**:

```python
import json
data = json.loads('{"a": 1}')   # json.loads 返回 Any(结构未知)
# data 是 Any,data["a"] + 1 不被检查(可能 data 不是 dict 就崩)
# 应显式声明类型或用 TypedDict/pydantic
parsed: dict[str, int] = data   # 断言为具体类型,后续受检查
```

`json.loads`、`eval`、无注解函数的返回值等"动态来源"默认是 `Any`。要恢复检查,显式声明具体类型(`parsed: dict[str, int] = data` 让 mypy 当 dict 检查,虽运行时不强制)。

**`NoReturn`**:表示函数"永不返回"(总抛异常或死循环):

```python
from typing import NoReturn

def fail(msg: str) -> NoReturn:
    raise ValueError(msg)    # 总抛异常,不正常返回

def loop_forever() -> NoReturn:
    while True:              # 死循环,不返回
        pass
```

`NoReturn` 标注"函数不会正常返回"(只抛异常或死循环)。这让 mypy 知道调用该函数后的代码不可达(类似 `None`,但语义更明确——表"必定异常退出")。常用于错误处理函数(`raise` 后用 NoReturn)、状态机终态。

Any/NoReturn 的更多进阶(如 TypeVar、Never 替代 NoReturn)留第 10、11 篇。本篇掌握"Any 关闭检查慎用、优先 object、NoReturn 表永不返回"。

### 2.8 typing 模块与综合示例

`typing` 模块是注解的工具箱,本篇已用到的:`Optional`、`Union`、`Any`、`NoReturn`。它还提供很多进阶工具(留后续):`TypeVar`(泛型)、`Callable`(可调用)、`Protocol`(结构化类型)、`Literal`(字面量类型)、`TypedDict`(带类型的 dict)、`Final`(常量)、`ClassVar`(类变量)等。

**typing 的版本演进**:注解写法随 Python 版本演进,逐步从"必须用 typing"到"内置直接支持":

| 注解 | 3.8 及以前 | 3.9+ | 3.10+ |
|------|-----------|------|-------|
| 列表 int | `List[int]`(typing) | `list[int]`(内置) | 同 3.9 |
| 字典 str→int | `Dict[str,int]` | `dict[str,int]` | 同 |
| 元组 | `Tuple[int,int]` | `tuple[int,int]` | 同 |
| 可空 | `Optional[X]` | 同 | `X \| None` |
| 多类型 | `Union[X,Y]` | 同 | `X \| Y` |

3.10+ 是分水岭——`X | Y` 联合语法、内置泛型全面可用,注解写得最简洁。新项目建议用 3.10+ 写法(配合 `from __future__ import annotations` 兼容 3.7+)。知道演进,看老代码的 `typing.List` 不困惑。

**综合示例**:一个带完整注解的小服务接口,演示各类基础注解:

```python
from typing import Optional, Union, Any

# 类型别名(给复杂类型起名,3.12+ 也可用 type 语句)
UserId = int
UserDict = dict[str, Union[str, int]]   # 值可 str 或 int

# 用户仓库接口(全程注解)
class UserRepo:
    def __init__(self) -> None:
        self._data: dict[UserId, UserDict] = {}

    # 新增用户,返回新 id;name 必填,age 可空
    def add(self, name: str, age: int | None = None) -> UserId:
        uid: UserId = len(self._data) + 1
        self._data[uid] = {"name": name, "age": age if age is not None else 0}
        return uid

    # 查找用户,可能返回 None(Optional)
    def get(self, uid: UserId) -> Optional[UserDict]:
        return self._data.get(uid)   # .get 缺失返回 None,匹配 Optional

    # 批量获取 id 列表
    def list_ids(self) -> list[UserId]:
        return list(self._data.keys())

# 使用
repo = UserRepo()
alice_id = repo.add("Alice", 30)        # UserId
bob_id = repo.add("Bob")                # age 默认 None → 存 0
user = repo.get(alice_id)
if user is not None:                    # Optional 收窄
    print(f"{user['name']}, {user['age']}")   # Alice, 30
print("所有 id:", repo.list_ids())      # [1, 2]

# 注解存运行时元数据
print(repo.add.__annotations__)
# {'name': <class 'str'>, 'age': typing.Optional[int], 'return': <class 'int'>}
```

阅读这段示例,对照各类注解:类型别名(`UserId = int`)、容器泛型(`dict[UserId, UserDict]`)、Optional(`-> Optional[UserDict]`)、Union(`Union[str, int]`)、`int | None` 现代写法、None 默认参数配 Optional、Optional 收窄判断、`__annotations__` 运行时存储。一个完整注解的服务接口,展示了基础注解的全套用法。

跑完这段示例,注解的基础写法就基本掌握。核心:**变量 `x: T`、函数 `def f(a: T) -> R`、容器 `list[T]`/`dict[K,V]`/`tuple[T,...]`、可空 `X | None`、多类型 `X | Y`、Any 慎用优先 object、注解不强制运行时由 mypy 检查**。

---

## 3. 最佳实践

### 3.1 公共 API、复杂函数必加注解,简单局部变量可省

```python
# 公共接口必注解(类、公共函数、模块常量)
def process(data: list[dict]) -> dict[str, int]: ...
MAX_CONN: int = 100
# 简单局部变量类型一目了然,可省
def f():
    total = 0          # 显然 int,不必 total: int = 0
    for i in range(10):
        total += i
```

注解的成本(书写量、维护)在公共/复杂接口上回报最大(文档+检查+IDE);简单局部变量加注解收益小、徒增噪音。按"接口必注、局部按需"分配。

### 3.2 注解要靠 mypy 才有意义,配合静态检查器

```python
# 注解本身运行时不强制,没 mypy 等于文档
def f(x: int) -> int:
    return x
f("hi")    # 运行时不报(注解不强制)!mypy 才报错
```

写了注解却不跑 mypy/pyright,注解退化成"可能过时的文档"。注解与静态检查器配套使用才有价值——项目配置 mypy(第 13 篇),CI 里跑,让注解真正守护类型安全。

### 3.3 容器注解指明元素类型,别只写裸 list/dict

```python
# 推荐:指明元素
def f(nums: list[int]) -> dict[str, int]: ...
# 不推荐:裸容器,检查器不知元素
def f(nums: list) -> dict: ...
```

`list[int]` 比 `list` 精确——前者让检查器知道元素是 int(可验证 append/索引操作),后者元素类型未知(检查放松)。容器注解尽量带元素类型,发挥精确检查。

### 3.4 可空用 X | None(3.10+)或 Optional[X],默认 None 参数必配

```python
# 3.10+ 推荐
def f(x: int | None = None): ...
# 兼容老版本
def f(x: Optional[int] = None): ...
# 错误:默认 None 但类型不含 None
# def f(x: int = None): ...   # mypy 报错
```

参数默认 None,类型注解必须含 None。可空类型现代用 `X | None`(简洁无需导入),兼容用 `Optional[X]`。别让默认 None 与注解类型矛盾。

### 3.5 Optional 收窄:判 None 后再访问,让 mypy 守护

```python
def f(user: dict | None):
    if user is not None:        # 收窄:user 为 dict
        print(user["name"])     # mypy 允许
    # 不判直接用:user["name"] mypy 报错(可能 None)
```

`Optional[X]` 的价值在于 mypy 强制你 `is not None` 判断后再访问 X 的成员。利用这种"收窄守护",消除对 None 操作的运行时 bug。这是 Optional 使用的关键。

### 3.6 优先 Union/object 明确类型,慎用 Any

```python
# 推荐:明确可能类型(Union)或接受任意但收窄(object)
def f(x: int | str): ...
def g(x: object):
    if isinstance(x, str): ...
# 慎用:Any 关闭检查
def h(x: Any): ...   # 放弃类型安全
```

能列出可能类型用 Union/`|`(检查器仍验证);接受任意但需处理用 object(强制收窄);确实无法确定才 Any。Any 是逃生舱,过度使用让注解形同虚设。优先 object 而非 Any。

### 3.7 用类型别名提高复杂类型可读性

```python
# 类型别名:给复杂类型起短名
UserId = int
UserMap = dict[str, list[int]]
Config = dict[str, Union[str, int, bool]]
# 使用
def f(users: UserMap) -> Config: ...
# 比直接写 dict[str, list[int]] 清晰
```

复杂类型(`dict[str, list[tuple[int, str]]]`)反复出现时,起类型别名(`UserMap = ...`),注解更短、改类型只改一处。别名 = 类型赋值给名字(3.12+ 有 `type` 语句更规范)。

### 3.8 注解与实现保持一致,避免注解过时

```python
# 注解说返回 str,实现却返回 int —— 注解过时,误导
def f(x: int) -> str:
    return x + 1   # 实际返回 int,注解错!
# mypy 会发现(返回 int 与 -> str 不符),及时修正
```

注解过时(改了实现忘改注解)比没注解更糟(误导)。mypy 能抓出"注解与实现矛盾",所以**改实现后跑 mypy**,让注解与实现同步。注解是契约,要维护。

### 3.9 tuple 注解区分"固定异构"与"任意长度同构"

```python
# 固定异构(记录):tuple[int, str] 表 (id, name)
record: tuple[int, str] = (1, "Alice")
# 任意长度同构:tuple[int, ...] 表 int 序列
nums: tuple[int, ...] = (1, 2, 3)
# 别混:tuple[int] 是"恰好1个int的元组"(罕见,通常是笔误想写 tuple[int, ...])
```

tuple 注解按结构选:固定结构记录用 `tuple[T1, T2, ...]`(异构),任意长度序列用 `tuple[T, ...]`。注意 `tuple[int]`(恰好1个)罕见,常见笔误,通常应 `tuple[int, ...]`。

### 3.10 前向引用用引号或 from __future__ import annotations

```python
# 方案一:字符串前向引用
class Node:
    def set_next(self, n: "Node") -> None: ...
# 方案二:3.7+ 全局延迟注解求值(推荐,3.11 默认行为)
from __future__ import annotations
class Node:
    def set_next(self, n: Node) -> None: ...   # 无需引号
```

引用未定义的类(自引用、互相引用)用字符串 `"Node"` 或 `from __future__ import annotations`(让所有注解延迟求值,3.11+/PEP 563 计划默认)。现代项目用后者,注解里直接写类名无需引号。

### 3.11 旧代码用 typing 大写泛型,新代码用内置小写

```python
# 兼容 3.8 及更早
from typing import List, Dict, Tuple, Optional
def f(x: List[int]) -> Dict[str, int]: ...
# 3.9+ 推荐(简洁)
def f(x: list[int]) -> dict[str, int]: ...
```

按目标 Python 版本选写法:3.9+ 用内置小写泛型(`list[int]`),3.8 及更早用 `typing` 大写(`List[int]`)。新项目用 3.10+ 小写 + `|` 联合,最简洁。勿在 3.9- 项目用 `list[int]`(运行时报错)。

### 3.12 注解不影响性能(默认),勿为性能回避注解

```python
# 注解默认几乎无运行时开销(存 __annotations__ 仅一次),放心加
def f(x: int) -> str: ...   # 无性能损失
# unless 用了大量需立即求值的复杂注解(罕见),才可能有微小开销
```

注解默认开销极小(函数定义时算一次存 `__annotations__`),不随调用重复。不必为性能回避注解。`from __future__ import annotations` 让注解完全不求值(性能最优),适合注解复杂场景。

---

## 4. 原理

本章讲清类型注解的机制:注解的运行时存储(`__annotations__`)与求值、为何不强制运行时检查、mypy 的静态检查原理、类型收窄(narrowing)机制、`from __future__ import annotations` 的延迟求值、内置泛型与 PEP 585。这些是"注解为何如此"的根基,运行时深入留第 12 篇。

### 4.1 注解的运行时存储:__annotations__(需理解,详述)

类型注解在运行时并非消失——解释器把注解**存入 `__annotations__` 属性**。函数、类、模块都有此属性,是个字典,键是参数名/'return'/属性名,值是注解的类型对象。

**函数注解**:

```python
def greet(name: str, times: int = 1) -> str:
    return name * times
print(greet.__annotations__)
# {'name': <class 'str'>, 'times': <class 'int'>, 'return': <class 'str'>}
```

函数的 `__annotations__` 是字典:参数名→类型,'return'→返回类型。默认值(`= 1`)不进 `__annotations__`(那是函数签名 `__defaults__`)。这个字典在函数定义时构建一次。

**变量/模块注解**:

```python
x: int = 10
y: str                      # 不赋值的注解
print(__annotations__)      # 模块级:{'x': <class 'int'>, 'y': <class 'str'>}
```

模块级变量注解存入模块的 `__annotations__`。注意 `y: str`(不赋值)也存入——它记了注解但没创建变量(§2.1 的陷阱根源)。

**类注解**:

```python
class User:
    name: str
    age: int = 0
print(User.__annotations__)
# {'name': <class 'str'>, 'age': <class 'int'>}
```

类属性注解存入类的 `__annotations__`。注意 `age: int = 0` 的 `0`(默认值)是类属性,`name: str`(无值)只注解不赋默认。

**`__annotations__` 的用途**:

1. **mypy/IDE 读取**:静态检查器读 `__annotations__`(或直接解析源码 AST)做检查。
2. **运行时框架消费**:FastAPI 读函数参数注解自动生成 API 文档与参数解析;Pydantic 读类属性注解做数据校验;`dataclasses` 读注解生成 `__init__`。
3. **运行时类型检查**:可用 `typing.get_type_hints()` 获取解析后的注解(处理字符串前向引用),做运行时反射。

```python
# 框架消费注解示例(Pydantic 风格)
class User:
    name: str
    age: int
# Pydantic 读 User.__annotations__,自动生成 name 字段校验(str)、age 字段校验(int)
```

**关键:存了但不强制**。`__annotations__` 存着注解,但**解释器不基于它检查函数调用**。`greet(42)`(传 int 给 str 参数)运行时不报错——注解只是被记录,没成为运行时类型守卫。这就是"注解不影响运行时"的存储层根源:注解是**被动元数据**,非主动检查器。

理解 `__annotations__` 是"注解的运行时住所",就理解了注解的双重身份:静态层(给 mypy 检查)、运行时层(存为元数据领导框架用,但不主动检查)。运行时消费详解留第 12 篇。

### 4.2 为何注解不强制运行时检查

注解"不影响运行时"是 Python 的有意设计,而非疏忽。原因:

**原因一:渐进式类型化的核心承诺**。渐进式类型化要求"注解可选、加注解不改变运行时行为"。若注解强制运行时检查,加注解的代码会在调用处因类型不符抛错——这改变了运行时行为,破坏"可选、渐进"的承诺,老代码加注解可能突然崩溃。Python 选择"注解是元数据、检查交给外部工具",保证加注解零运行时风险。

**原因二:性能**。运行时类型检查要在每次函数调用、赋值时 `isinstance` 验证,开销巨大。Python 追求运行时性能,不做这种全量检查。静态检查(mypy)在开发期一次性查,运行时零开销,是更经济的方案。

**原因三:动态类型的本质**。Python 对象有类型、变量无类型,运行时"变量当前指什么类型"是动态的。强制注解检查要处理大量动态情况(子类、协议、协变逆变),实现复杂且与动态特性冲突。静态检查在"声明类型"层面工作,更简单。

```python
# 注解不强制:运行时与无注解行为完全一致
def add(a: int, b: int) -> int:
    return a + b
add(1, 2)        # 3
add("a", "b")    # 'ab' —— 传 str 不报错!str 支持 +,运行正常
add(1, "b")      # TypeError —— 但这是 str+int 自身不支持 +,不是注解检查
```

`add("a", "b")` 传 str 给 int 参数,运行时正常返回 `'ab'`(str 支持 +)——注解完全不干预。`add(1, "b")` 报错是 `int + str` 运算本身不支持,不是注解检查(与无注解时一样)。这清楚说明注解对运行时透明。

**例外:框架可主动用注解做运行时检查**。虽然解释器不检查,但 FastAPI、Pydantic 等框架**主动读注解 + 主动 isinstance 检查**——这是框架行为,不是解释器行为。它们在请求解析、数据验证时用注解做运行时校验。但这是"框架选择消费注解",非"注解本身强制"。理解这个区分,就理解了为何"解释器不检查"与"FastAPI 能用注解校验"不矛盾。

### 4.3 mypy 静态检查的工作原理(概览,详留第13篇)

mypy 是独立的静态检查器,读 Python 源码(注解 + 实现)做类型检查,**不运行代码**。其工作流程概览:

1. **解析源码 AST**:mypy 解析 .py 文件得到抽象语法树。
2. **收集注解与推断类型**:读函数/变量注解,对无注解的代码据赋值推断类型。
3. **类型检查**:沿控制流验证"操作是否与类型匹配"——参数类型是否匹配注解、返回值是否匹配 `->`、属性访问是否存在、类型收窄是否正确。
4. **报告错误**:发现类型不符报告(不修代码,只提示)。

```python
# mypy 检查示例
def greet(name: str) -> str:
    return "Hello, " + name
greet(42)    # mypy 报错:Argument 1 to "greet" has incompatible type "int"; expected "str"
```

mypy 发现 `greet(42)` 的 42(int)与参数注解 str 不符,报错。这是**静态、开发期**的检查,代码没运行就抓出类型错误。

**mypy 与运行时的分工**:

- **mypy(静态)**:开发期/CI 检查类型一致性,报类型错误。
- **解释器(运行时)**:执行代码,无类型检查(除非框架主动)。

mypy 能抓的类型错误:传错类型、返回错类型、对 Optional/None 误操作、属性不存在、容器元素类型错等。它抓不了:运行时才知的值(`if x > 0:` 分支)、动态特性(`getattr`、`__getattr__`)、Any 部分。

mypy 的配置、严格度、命令行用法留第 13 篇详述。本篇理解"mypy 是读注解做静态检查的独立工具,与运行时无关"即可。运行时类型信息(`get_type_hints`、`isinstance` 配合注解)留第 12 篇。

### 4.4 类型收窄(narrowing)机制

§2.5 提到的"Optional 收窄"是类型检查的核心机制,这里讲清。mypy 沿控制流"收窄"变量类型——在条件判断后,基于条件把变量类型缩小到更精确的子集。

**isinstance 收窄**:

```python
def f(x: int | str) -> int:
    if isinstance(x, int):
        # 此分支 mypy 收窄 x: int(从 int|str 排除 str)
        return x + 1
    # else 分支 mypy 推断 x: str(剩余类型)
    return len(x)
```

`isinstance(x, int)` 为真的分支内,mypy 知道 x 是 int(联合类型排除 str);为假的分支,x 是 str。这让联合类型能安全操作——分支内按具体类型用。

**None 收窄**:

```python
def f(x: dict | None):
    if x is not None:
        # 收窄 x: dict(is not None 排除 None)
        print(x["key"])   # mypy 允许(知道非 None)
    if x is None:
        # 收窄 x: None
        print("空")
```

`is not None` 收窄到非 None 类型,`is None` 收窄到 None。这是 Optional 安全使用的机制——判 None 后检查器当非 None。

**其他收窄**:

```python
def f(x: int | None):
    if x:   # 真值测试也收窄:排除 None 和 0(x 为 int 且非0)
        # x: int(非0)
        ...
# mypy 还支持 type(x) is、len()、比较等收窄
```

收窄让"复杂类型(联合、Optional)的分支处理"可行——检查器在每个分支把类型缩小到可安全操作的范围,既允许灵活的联合类型,又保证操作安全。理解收窄,就理解了为何"判 None/isinstance 后能安全访问"——不是运行时变了,是检查器在该分支把类型当更窄的用。

### 4.5 from __future__ import annotations 与延迟求值

PEP 563(`from __future__ import annotations`,3.7+)改变注解的求值时机:注解**不在定义时求值,而存为字符串**。

**默认行为(立即求值)**:

```python
class Node:
    # child: Node   # NameError!Node 类体未执行完,Node 名未定义
    def set_child(self, child: "Node") -> None:   # 字符串绕过
        self.child = child
```

默认注解在定义时求值——`child: Node` 在 Node 类体内执行时,Node 还没定义完,NameError。故需字符串 `"Node"` 前向引用。

**`from __future__ import annotations`(延迟求值)**:

```python
from __future__ import annotations

class Node:
    def set_child(self, child: Node) -> None:   # 无需引号!注解不求值
        self.child = child
print(Node.set_child.__annotations__)
# {'child': 'Node'}   —— 注解存为字符串 'Node',不求值
```

加 `from __future__ import annotations` 后,所有注解**不求值,存为字符串**。这样:

- 前向引用无需引号(`child: Node` 直接写)。
- 注解里可用未定义的名字、复杂表达式不求值(无运行时开销)。
- 注解存为字符串,需用 `typing.get_type_hints()` 解析回类型对象(框架用)。

**为何要延迟求值**?

1. **解决前向引用**:自引用类(`Node` 方法返回 `Node`)、互相引用类无需引号。
2. **性能**:注解不求值,复杂注解无开销。
3. **PEP 563 计划**:Python 原计划 3.10+ 默认延迟求值(后推迟,仍需显式 import)。

⚠️ **延迟求值的代价**:注解变字符串,运行时要拿类型对象需 `typing.get_type_hints()` 解析(处理字符串→类型)。直接读 `__annotations__` 得到的是字符串而非类型,框架(FastAPI/Pydantic)需适配。某些运行时用注解的场景可能受影响。这是 3.11 未默认开启 PEP 563 的原因之一权衡。

**实践**:新项目防前向引用困扰,顶部加 `from __future__ import annotations`,注解里直接写类名无需引号。但若大量运行时消费注解(FastAPI/Pydantic),测试兼容性——这些框架已支持字符串注解解析。

理解延迟求值,就理解了前向引用的两种解法(字符串 / future import),以及注解求值时机的可控性。

### 4.6 内置泛型与 PEP 585

`list[int]`(用内置类型作泛型)是 PEP 585(Python 3.9+)引入的。之前只能 `typing.List[int]`。理解这次演进:

**3.9 前**:容器类型本身不支持 `[]` 作泛型,需 `typing` 提供的别名:

```python
from typing import List, Dict, Tuple
x: List[int] = [1, 2]    # typing.List 是个特殊泛型别名
```

`typing.List` 等是为注解特制的"泛型别名"对象,支持 `List[int]` 语法。

**3.9+(PEP 585)**:给内置容器类(`list`/`dict`/`tuple`/`set`/`frozenset` 等)和 `collections.abc` 的 ABC 加了 `__class_getitem__`,使其原生支持 `[]`:

```python
x: list[int] = [1, 2]    # list.__class_getitem__(int) 返回泛型别名
```

`list[int]` 调用 `list.__class_getitem__(int)`,返回一个 `types.GenericAlias` 对象,表示"int 元素的 list"。这让内置类型直接当泛型用,无需 typing。

**PEP 585 的意义**:

- 注解更简洁(`list[int]` 比 `List[int]` 短,无需导入)。
- 统一了内置类型与注解(容器类型既是运行时类型,也是注解类型)。
- `typing.List` 等被标记废弃(3.9 起建议用小写内置)。

**运行时行为**:`list[int]` 在 3.9+ 运行时产生 `GenericAlias` 对象,可作类型注解存入 `__annotations__`:

```python
print(list[int])      # list[int]
print(type(list[int])) # <class 'types.GenericAlias'>
x: list[int] = []
print(__annotations__) # {'x': list[int]}
```

**与 `|` 联合(PEP 604,3.10+)**:`int | str` 联合语法也是类似演进——3.10+ 让类型对象支持 `|` 运算(`int.__or__(str)` 返回 `types.UnionType`),注解里可直接 `int | str`,无需 `typing.Union`。

理解 PEP 585/604,就理解了为何"新代码用 `list[int]`、`int | str` 而非 `List[int]`、`Union[int,str]`"——这是语言演进的现代写法,内置类型原生支持泛型与联合。老代码的 `typing` 大写写法是历史遗留,语义等价但更冗长。

---

## 5. 总结

### 5.1 本文内容回顾

- **类型注解定义**:Python 3.5+ 给代码标注期望类型的语法,服务静态检查/文档/IDE;**不影响运行时**(解释器不强制),由 mypy 等外部工具静态检查。
- **渐进式类型化**:动态类型基础上可选添加注解,新项目全注解、老项目逐步加、原型可不注解;注解可选、不强制运行时。
- **变量注解**:`x: T = v` 带值、`x: T` 不带值(不创建变量,只记注解,易踩坑);类属性注解;注解错运行时不报只 mypy 报。
- **函数注解**:参数 `a: T`、返回 `-> R`、None 表无返回值;默认值 `a: T = v`;`*args: T`/`**kwargs: T` 注解元素类型;可部分注解(不推荐)。
- **内置类型作注解**:`int/str/float/bool/bytes/None/object` 直用作注解;自定义类直接作注解;前向引用用字符串 `"Tree"`。
- **容器泛型**:`list[T]`/`dict[K,V]`/`set[T]`;tuple 三形式——固定异构 `tuple[int,str]`、任意同构 `tuple[T,...]`、空 `tuple[()]`;3.9+ 内置小写 vs 3.8- typing 大写。
- **Optional/可空**:`Optional[X]`= `X | None`= `Union[X,None]`;防 None 误用,配 `is not None` 收窄后访问;默认 None 参数必配 Optional;Optional ≠ 可选参数。
- **Union 联合**:`Union[X,Y]`= `X | Y`(3.10+);接受多类型,配 isinstance 收窄;优先 `|` 写法;3.9- 注解里 `|` 需 future 或 Union。
- **Any/NoReturn**:Any 关闭检查慎用,优先 object(强制收窄);动态来源默认 Any;NoReturn 表永不返回(只抛异常/死循环)。
- **typing 模块**:工具箱(Optional/Union/Any/NoReturn + 进阶 TypeVar/Callable/Protocol 等留后续);版本演进 3.8 typing 大写→3.9 内置泛型→3.10 `|` 联合。
- **原理**:`__annotations__` 存注解为元数据(函数/类/模块);不强制运行时是渐进式承诺+性能+动态本质;mypy 静态读源码检查(独立于运行时);类型收窄(isinstance/is None/真值)在分支缩小类型;`from __future__ import annotations` 延迟求值(存字符串,解决前向引用);PEP 585 内置泛型(`list[int]` 经 `__class_getitem__`)、PEP 604 `|` 联合。
- **最佳实践**:公共接口必注解局部按需、配 mypy 才有意义、容器指明元素、可空 X|None、Optional 收窄守护、优先 Union/object 慎 Any、类型别名提可读、注解与实现同步、tuple 区分异构/同构、前向引用用 future、按版本选大小写泛型、注解几乎无性能开销。

### 5.2 读完本文你应能掌握

- 说明类型注解的定义与"不影响运行时"特性,阐述渐进式类型化定位。
- 用 `x: T = v`、`x: T`、类属性注解,指出不带值注解不创建变量的陷阱。
- 用 `def f(a: T) -> R` 标注函数参数与返回值,标注 `*args`/`**kwargs`/默认值参数。
- 用 `list[T]`/`dict[K,V]`/`set[T]` 标注容器,tuple 三形式(异构/同构 `...`/空),区分 3.9+ 内置与 3.8- typing 写法。
- 用 `Optional[X]`/`X | None` 标注可空,用 `is not None` 收窄访问,说明默认 None 参数必配 Optional、Optional ≠ 可选参数。
- 用 `Union[X,Y]`/`X | Y` 标注多类型,isinstance 收窄分支处理。
- 说明 Any(关闭检查慎用)与 object(强制收窄)的区别,用 NoReturn 标注永不返回。
- 用类型别名简化复杂注解,前向引用用字符串或 `from __future__ import annotations`。
- 阐述 `__annotations__` 存储、不强制运行时的原因、mypy 静态检查、类型收窄、延迟求值、PEP 585/604 等原理。

### 5.3 延伸方向

- **Union 与 Any 类型**:Union/Optional 的进阶、Literal 字面量类型、Any 的精确语义、Never/NeverReturn,见《Union 与 Any 类型》。
- **TypeVar 泛型**:自定义泛型函数/类、协变逆变、TypeVar 约束,见《TypeVar 泛型》。
- **类型注解运行时行为**:`__annotations__` 深入、`typing.get_type_hints`、运行时反射、FastAPI/Pydantic 消费注解,见《类型注解运行时行为》。
- **mypy 静态类型检查**:mypy 安装配置、严格度、命令行、CI 集成、常见错误,见《mypy 静态类型检查》。
- **进阶 typing 工具**:Protocol(结构化类型)、Callable、TypedDict、Final、ClassVar、@overload,见标准库 typing 专题。
