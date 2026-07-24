---
group:
  title: 【02】基础数据类型和类型系统
  order: 2
order: 12
title: 类型注解运行时行为
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 类型注解在运行时是什么

前三篇(09~11)讲类型注解怎么写、给谁用——核心结论是"注解主要给 mypy 等静态检查器用,不影响运行时行为"。但"不影响运行时行为"不等于"运行时不存在"——事实上,Python 解释器在运行时会**把注解收集并存起来**,作为对象的元数据。本篇要讲的,正是注解在运行时的这一面:它存成了什么、存在哪里、如何被读取、如何被框架消费。

```python
def greet(name: str, age: int = 0) -> str:
    return f"{name}, {age}"
print(greet.__annotations__)
# {'name': <class 'str'>, 'age': <class 'int'>, 'return': <class 'str'>}
```

`greet.__annotations__` 是个字典,存着函数的所有类型注解——参数名→类型,加上特殊的 `'return'` 键存返回类型。这就是注解在运行时的"住所":它被存进 `__annotations__` 属性,可被运行时代码读取。

为什么注解要在运行时存起来?虽然解释器**不基于注解做类型检查**(`greet(42)` 传 int 给 str 参数,运行时不报错),但存起来的注解元数据对**框架**极有价值:

- **FastAPI** 读函数参数注解,自动把 HTTP 请求参数解析成对应类型、生成 API 文档。
- **Pydantic** 读类属性注解,自动做数据校验(int 字段拒绝字符串、str 字段长度等)。
- **dataclasses** 读类属性注解,自动生成 `__init__`/`__repr__` 等方法。
- **SQLAlchemy/ORM** 读模型字段注解,映射数据库列类型。
- **运行时类型校验库**(typeguard、beartype)读注解,在运行时按注解 isinstance 检查。

这些框架让"类型注解"从"静态检查工具"升级为"运行时驱动力"——注解不再只是写给 mypy 看的,而成为框架行为的数据源。理解注解的运行时存储与读取,是理解这些框架如何工作、以及如何自己写基于注解的代码的基础。

本篇要深入讲清注解的运行时全貌:`__annotations__` 的存储结构与各级对象(函数/类/模块)、注解的求值时机(立即求值 vs 延迟求值)、前向引用(forward reference)与字符串注解、`typing.get_type_hints()` 解析注解、PEP 563(`from __future__ import annotations`)的延迟求值、泛型运行时表示(`Generic`/`__orig_bases__`/`get_args`)、运行时类型校验(typing运行时、typeguard)。这是类型注解子系列里专讲"运行时层"的一篇——把 09~11 讲的"静态写法"与"运行时机制"打通。

本篇与 09~11 分工:09 给注解基础语法、10 给 Union/Any 注解、11 给泛型注解的**写法**;本篇讲这些注解**写出来后在运行时怎么存、怎么求值、怎么被读取消费**。mypy 静态检查本身留 13。

### 1.2 静态层与运行时层的双重身份

类型注解有双重身份,理解这点是本篇的总纲:

**静态层(给 mypy/IDE)**:注解是类型契约,静态检查器读源码做类型验证,不运行代码。这是注解设计的主要目的——开发期发现类型错误。`def f(x: int) -> str: ...` 让 mypy 检查"传 int、返回 str",但运行时不强制。

```python
def f(x: int) -> str:
    return x      # mypy 报错(返回 int 非 str),但运行时不报
f(42)             # 运行时正常(注解不检查);返回 42(int),也不报
```

**运行时层(给框架/反射)**:注解被存进 `__annotations__` 元数据,运行时代码可读取消费。框架据此驱动行为(FastAPI 解析、Pydantic 校验)。这是注解的附加用途——开发期不强制,运行时元数据。

```python
def f(x: int) -> str:
    return str(x)
print(f.__annotations__)   # {'x': <class 'int'>, 'return': <class 'str'>}
# 运行时:注解元数据可读,但不强制(f(42) 不检查 x 是否 int)
```

这两层的关键区别在"是否强制":

- 静态层:my 检查,但不运行(开发期,非强制运行时)。
- 运行时层:存元数据,可读,但解析器**默认不主动检查**(只存不查)。
- **框架层(运行时主动检查)**:FastAPI/Pydantic/typeguard 等**主动读 `__annotations__` 并 isinstance 校验**——这是框架行为,使注解在运行时"生效"。

```python
# 框架使注解运行时生效(Pydantic 风格)
class User:           # 假设用 pydantic.BaseModel
    name: str
    age: int
# Pydantic 读 __annotations__,实例化时按注解 isinstance 校验:
# User(name="Alice", age="thirty")   # Pydantic 运行时报错(age 应 int)
# 这是框架主动检查,非解释器默认行为
```

理解这三层(静态检查 / 运行时元数据存储 / 框架主动消费),就理解了注解的全貌。日常主要关注静态层(写对注解让 mypy 满意),但在用 FastAPI/Pydantic 等框架时需理解运行时层(注解如何被读、如何驱动框架)。本篇聚焦运行时层。

### 1.3 注解运行时速览

讲清定位前,给出注解运行时的全貌速览:

```python
# 1. 函数注解存 __annotations__
def f(x: int, y: str = "a") -> bool: ...
print(f.__annotations__)     # {'x': int, 'y': str, 'return': bool}

# 2. 类/模块注解也存 __annotations__
class C:
    a: int
    b: str = "x"
print(C.__annotations__)     # {'a': int, 'b': str}
x: float = 1.0
print(__annotations__)        # 模块级:{'x': float}

# 3. 字符串前向引用(注解存为字符串)
def f(node: "Node") -> "Node": ...   # "Node" 是字符串(前向引用)
print(f.__annotations__)     # {'node': 'Node', 'return': 'Node'}(字符串!)

# 4. get_type_hints 解析注解(字符串→真实类型)
import typing
print(typing.get_type_hints(f))   # {'node': <class Node>, 'return': <class Node>}(已解析)

# 5. PEP 563 延迟求值(注解全存字符串)
# from __future__ import annotations
# def f(x: int) -> str: ...   # x 注解存为 'int' 字符串(不求值)

# 6. 泛型运行时表示
class Box(typing.Generic[T]): ...
b: Box[int]
print(Box[int])              # Box[int](GenericAlias 对象)
print(typing.get_args(Box[int]))   # (int,)
```

几个关键:

- `__annotations__`:注解的运行时存储字典(函数/类/模块都有)。
- 字符串前向引用:`"Node"` 注解存为字符串(不求值),需 `get_type_hints` 解析。
- `get_type_hints()`:把字符串注解解析回真实类型对象(框架必需)。
- PEP 563:所有注解默认延迟为字符串(不立即求值)。
- 泛型:`Box[int]` 是 GenericAlias 对象,`get_args` 取类型参数。

本篇逐一展开。重点是 `__annotations__` 结构、求值时机、`get_type_hints` 解析、PEP 563 影响、泛型反射——这些是"运行时消费注解"的基础设施。

### 1.4 求值时机:注解何时变成类型对象

注解在运行时是"存起来的",但"存的是类型对象还是字符串"?这取决于**求值时机**(evaluation time)。Python 有两种模式:

**默认(立即求值)**:注解在函数/类定义时**立即求值**为类型对象,存入 `__annotations__`:

```python
def f(x: int) -> str: ...    # 定义时:int 被求值为 <class 'int'>,存入
print(f.__annotations__)     # {'x': <class 'int'>, 'return': <class 'str'>} —— 类型对象
```

定义 `f` 时,`int`、`str` 立即被求值(就是 Python 的 `int` 类对象),存入 `__annotations__`。这是默认行为。

**前向引用(字符串,延迟)**:当注解引用"尚未定义的名字"时,必须用字符串包住:

```python
class Node:
    def set_next(self, nxt: "Node") -> None: ...
    # 定义时 Node 类体未执行完,"Node" 名未定义
    # 用 "Node" 字符串避免 NameError,存为字符串不求值
print(Node.set_next.__annotations__)   # {'nxt': 'Node', 'return': None}
# nxt 存的是字符串 'Node',不是 Node 类(因延迟)
```

`"Node"`(字符串)在定义时不求值,存为字符串 `'Node'`。后续需要真实类型时,用 `get_type_hints` 解析(把 `'Node'` 在 Node 的作用域内求值为 Node 类)。

**PEP 563(全延迟)**:`from __future__ import annotations` 让**所有注解**默认存为字符串(不求值),无需手动加引号:

```python
from __future__ import annotations
class Node:
    def set_next(self, nxt: Node) -> None: ...   # 无需引号!注解存为字符串
print(Node.set_next.__annotations__)   # {'nxt': 'Node', 'return': 'None'} —— 全字符串
```

PEP 563 下,`nxt: Node` 也存为字符串 `'Node'`(不立即求值),故无需前向引用引号。代价:所有注解都是字符串,运行时要用 `get_type_hints` 解析才能拿真实类型。

求值时机是本篇的关键变量——它决定了"注解存的是类型对象还是字符串""需不需要前向引用引号""框架如何解析"。后续章节展开三种模式(立即求值/字符串前向引用/PEP 563)的完整规则与影响。

理解了注解的静态/运行时双重身份、运行时存储位置与求值时机这些总纲,后续章节展开各机制细节。

---

## 2. 核心内容

本章详解注解运行时的各机制。每节遵循"规则 → demo → 陷阱 → 场景"展开。`__annotations__` 结构、求值时机、`get_type_hints`、泛型反射是重点。

### 2.1 __annotations__ 的存储结构

`__annotations__` 是注解运行时的核心载体——函数、类、模块都有这个属性,它是个字典,存该对象的所有类型注解。

**函数的 `__annotations__`**:

```python
def greet(name: str, age: int = 0, *, city: str = "HZ") -> str:
    return f"{name}, {age}, {city}"
print(greet.__annotations__)
# {'name': <class 'str'>, 'age': <class 'int'>, 'city': <class 'str'>, 'return': <class 'str'>}
```

函数 `__annotations__` 结构:

- 键是参数名(`'name'`、`'age'`、`'city'`),值是参数注解的类型对象。
- 特殊键 `'return'` 存返回类型注解。
- 默认值(`= 0`、`= "HZ"`)不进 `__annotations__`(那是 `__defaults__`/`__kwdefaults__`),只类型注解进。

**无注解的函数没有 `__annotations__`?不对,有空字典**:

```python
def no_anno(x, y): ...
print(no_anno.__annotations__)   # {} —— 空字典,不是无属性
# Python 3.10+ 函数默认都有 __annotations__(即使空)
# (3.10 之前,无注解函数可能无 __annotations__ 属性,需 getattr 防 AttributeError)
```

3.10+ 函数几乎总有 `__annotations__`(无注解时是空字典)。3.9 及之前,完全无注解的函数可能没该属性——读时用 `getattr(f, '__annotations__', {})` 防御。

**类的 `__annotations__`**:

```python
class User:
    name: str
    age: int = 0          # 带默认值(类属性)
    email: "str"          # 字符串注解(前向引用风格)
    def __init__(self, name: str):   # 方法注解在方法的 __annotations__,不在类
        self.name = name
print(User.__annotations__)
# {'name': <class 'str'>, 'age': <class 'int'>, 'email': 'str'}
```

类 `__annotations__` 只存**类体里直接写的属性注解**(`name`/`age`/`email`),不包含方法的参数注解(那在各方法的 `__annotations__`)。注意 `email: "str"` 字符串注解存为字符串 `'str'`(不求值,前向引用)。

⚠️ **类的 `__annotations__` 不继承**:子类有自己的 `__annotations__`,不合并父类的:

```python
class Base:
    x: int
class Derived(Base):
    y: str
print(Derived.__annotations__)   # {'y': str} —— 只有 y,不含父类 x
# 要拿所有(含继承)需手动沿 MRO 合并
```

`Derived.__annotations__` 只有子类自己写的 `y`,不含父类 `Base` 的 `x`。要拿"继承的全部属性注解",需沿 `__mro__` 手动合并各类 `__annotations__`(`get_type_hints` 会做这事,见 2.4)。

**模块级注解**:

```python
# 模块顶层
MAX_CONN: int = 100
DEBUG: bool = True
print(__annotations__)   # 模块级 {'MAX_CONN': int, 'DEBUG': bool}
```

模块顶层的变量注解存入模块的 `__annotations__`(用 `__annotations__` 名访问当前模块)。

**局部变量注解不进 `__annotations__`**:

```python
def f():
    x: int = 10          # 局部变量注解
    y: str               # 局部变量注解(不赋值)
    # 局部注解不存任何 __annotations__
    return x
print(f.__annotations__)   # {}(无参数注解)—— 局部 x、y 的注解丢失
```

⚠️ 局部变量注解(`函数内 x: int = 10`)**不进任何 `__annotations__`**——它在运行时几乎完全消失(只影响静态检查)。这是局部注解的特性:它们是纯静态提示,运行时不可访问。框架无法读局部注解,只能读函数参数/类属性/模块级注解。

**赋值注解与不带值注解**:

```python
class C:
    a: int = 10          # 注解 + 赋值:存注解 + a 成为类属性(值10)
    b: str               # 注解不赋值:只存注解,b 不成为类属性
print(C.__annotations__)   # {'a': int, 'b': str}
print(hasattr(C, 'a'))     # True(a 是类属性,值10)
print(hasattr(C, 'b'))     # False!b 只注解,未赋值,不是类属性
```

类体内 `a: int = 10` 既注解又赋值(`a` 成类属性);`b: str` 只注解不赋值(`b` 不成属性)。这让"类属性注解"有两种:`a` 是真有默认值的属性,`b` 是"声明存在但运行时无值"的注解(常配合 `__init__` 赋值实例属性,如 dataclass 模式)。

### 2.2 立即求值与前向引用

注解默认在定义时立即求值为类型对象,但当注解引用"定义时还不存在的名字"时,需用字符串前向引用。这节讲清立即求值的边界与前向引用。

**立即求值(默认)**:

```python
def f(x: int, y: list[str]) -> str: ...   # 定义时 int、list[str] 求值
print(f.__annotations__)
# {'x': <class 'int'>, 'y': list[str], 'return': <class 'str'>}
# y 是 list[str](GenericAlias,立即求值)
```

`y: list[str]` 在定义时求值为 `list[str]`(GenericAlias 对象,3.9+)。这是默认——注解即写即求值,存类型对象。

**前向引用(字符串)**——引用未定义名字:

```python
class Node:
    def set_next(self, nxt: "Node") -> "Node":    # Node 类体未完,"Node" 字符串
        self.next = nxt
        return nxt
# 若写 nxt: Node(不加引号):
# class Node:
#     def bad(self, nxt: Node) -> Node: ...   # NameError!Node 类体执行时 Node 名未定义
print(Node.set_next.__annotations__)
# {'nxt': 'Node', 'return': 'Node'}   —— 存字符串,不求值
```

类体内方法注解引用类自身(`Node`),但类体执行时 `Node` 名尚未绑定(类定义未完成),故需字符串 `"Node"` 前向引用。运行时存为字符串 `'Node'`,待后续解析。

**自引用、互引用**:

```python
class TreeNode:
    value: int
    left: "TreeNode" = None      # 自引用(树左子树)
    right: "TreeNode" = None
# 互相引用
class A:
    partner: "B"                 # 引用 B(B 后定义)
class B:
    partner: "A"                 # 引用 A
```

自引用(类内注解引用自身)、互相引用(A 注解引用 B,B 引用 A)都需前向引用字符串,因被引用者在定义时未就绪。

**前向引用的求值**——字符串需解析:

```python
class Node: ...
def f(n: "Node") -> "Node": ...
# __annotations__ 存字符串,要真实类型需 get_type_hints
import typing
print(typing.get_type_hints(f))   # {'n': <class Node>, 'return': <class Node>} 已解析
```

`"Node"` 字符串注解运行时是字符串,要拿 Node 类对象需 `typing.get_type_hints(f)` 解析(在 f 的全局作用域求值 `'Node'`)。直接读 `__annotations__` 只得字符串。这是前向引用的运行时代价——需额外解析。

⚠️ **前向引用字符串必须能在作用域求值**:`get_type_hints` 解析 `"Node"` 时,在函数的全局 + 局部作用域找 `Node` 名。若 Node 不在可达作用域(如已被删、或字符串拼错),`get_type_hints` 报 `NameError`:

```python
def f(x: "Nonexistent"): ...
import typing
# typing.get_type_hints(f)   # NameError: name 'Nonexistent' is not defined
# 字符串注解'Nonexistent'无法在作用域解析
```

前向引用字符串最终要能求值成真实类型,否则 `get_type_hints` 报 NameError。故前向引用要写对名字(等于真实类型名)。

### 2.3 get_type_hints:解析注解为真实类型

`typing.get_type_hints()` 是运行时解析注解的核心工具——它读对象的 `__annotations__`,把字符串前向引用解析回真实类型对象,处理 Optional/Union/泛型等。框架(FastAPI/Pydantic)依赖它读注解。

**基本解析**:

```python
import typing
class Node:
    def f(self, x: "Node", y: int) -> "list[Node]": ...
print(Node.f.__annotations__)
# {'x': 'Node', 'y': <class 'int'>, 'return': 'list[Node]'} —— 混合(str+对象)
print(typing.get_type_hints(Node.f))
# {'x': <class Node>, 'y': <class 'int'>, 'return': list[Node]} —— 全解析为真实类型
```

`get_type_hints` 把混合的注解(字符串 `'Node'` + 对象 `int` + 字符串 `'list[Node]'`)统一解析为真实类型对象(`Node`、`int`、`list[Node]`)。它在函数的全局作用域求值字符串(`'Node'`→`Node` 类,`'list[Node]'`→`list[Node]` GenericAlias)。

**解析类注解(含继承合并)**:

```python
class Base:
    x: int
class Derived(Base):
    y: str
print(Derived.__annotations__)        # {'y': str}(不含父类 x)
print(typing.get_type_hints(Derived)) # {'x': int, 'y': str} —— 合并继承!
# get_type_hints 沿 MRO 合并所有父类的属性注解
```

`get_type_hints(cls)` 返回**含继承**的全部属性注解(沿 MRO 合并 Base 的 `x` 与 Derived 的 `y`),而 `cls.__annotations__` 只含本类。这是 `get_type_hints` 相对 `__annotations__` 的额外能力——合并继承。

**`include_extras` 与 `Annotated`**:

```python
from typing import Annotated
def f(x: Annotated[int, "meta info"]): ...
print(typing.get_type_hints(f))                    # {'x': int}(默认丢弃 Annotated 的元信息)
print(typing.get_type_hints(f, include_extras=True))  # {'x': Annotated[int, 'meta info']}(保留)
```

`Annotated[int, "meta"]` 给类型附加元信息(框架用,如 Pydantic/FastAPI 附加约束)。`get_type_hints` 默认丢弃元信息只留 `int`,要保留用 `include_extras=True`。框架读附加元数据需 `include_extras`。

**`get_type_hints` 的作用域控制**:

```python
# 可指定 localns/globalns 控制字符串求值的作用域
typing.get_type_hints(f, globalns=globals(), localns=locals())
# 默认用函数的 __globals__;复杂场景(如在另一个模块解析)可显式传
```

`get_type_hints(obj, globalns=..., localns=...)` 可显式指定求值字符串的作用域。默认用对象自带的 `__globals__`(函数定义所在模块的全局)。跨模块解析、动态构造类型时需显式传作用域。

**`get_type_hints` 与默认值剥离**:

```python
def f(x: int = 10) -> None: ...
print(typing.get_type_hints(f))   # {'x': int, 'return': None} —— 只类型,无默认值
# 默认值不进 get_type_hints 结果(那是签名 __defaults__)
```

`get_type_hints` 只返回类型注解,不含默认值(默认值在 `__defaults__`/`__kwdefaults__`)。框架要拿默认值需另读签名(`inspect.signature`)。

`get_type_hints` 是运行时读注解的标准入口——它统一处理(字符串前向引用解析、泛型求值、继承合并),返回干净的类型对象字典。框架依赖它把"注解文本"变成"可 isinstance/可反射的类型对象"。

### 2.4 PEP 563:from __future__ import annotations

PEP 563(`from __future__ import annotations`,3.7+)改变注解求值时机——所有注解默认**不立即求值,存为字符串**。这影响前向引用、运行时注解读取的方式。

**启用 PEP 563**:

```python
from __future__ import annotations   # 模块顶部
class Node:
    def set_next(self, nxt: Node) -> "Node": ...   # nxt: Node 无需引号!
print(Node.set_next.__annotations__)
# {'nxt': 'Node', 'return': 'Node'}   —— 全是字符串(未求值)
```

启用后,`nxt: Node` 也存为字符串 `'Node'`(不立即求值),故自引用无需加引号。所有注解统一变字符串,前向引用问题自动消失("反正都是字符串,无所谓定义时求不求值")。

**PEP 563 的好处**:

1. **消除前向引用困扰**:自引用/互引用类无需引号,直接写类名。
2. **性能**:注解不求值,复杂注解(如深层泛型)无求值开销。
3. **避免注解副作用**:注解里的表达式(若求值)可能触发副作用,PEP 563 避免之。

```python
from __future__ import annotations
# 复杂注解不求值(无开销)
def f(x: dict[str, list[tuple[int, str | None]]]) -> None: ...
# 注解存为 'dict[str, list[tuple[int, str | None]]]' 字符串,不求值
```

**PEP 563 的代价——运行时需解析**:注解全变字符串,运行时要类型对象必须 `get_type_hints` 解析:

```python
from __future__ import annotations
def f(x: int) -> str: ...
print(f.__annotations__)          # {'x': 'int', 'return': 'str'} —— 字符串!
# 直接 __annotations__ 得字符串,不能用 isinstance(int 注解)
import typing
print(typing.get_type_hints(f))   # {'x': <class 'int'>, 'return': <class 'str'>} 解析后
# 框架需调用 get_type_hints 解析
```

PEP 563 下 `__annotations__` 全是字符串,直接读无法用(不能 `isinstance(x, 'int')`)。框架必须 `get_type_hints` 解析后用。多数主流框架(FastAPI/Pydantic)已支持(内部调 get_type_hints),但若你手写读 `__annotations__` 的逻辑,PEP 563 下会出错(读到字符串)。

**PEP 563 与 3.10+ 的关系**:原计划 3.10 默认启用 PEP 563,后推迟(因框架兼容性)。当前(至 3.12+)仍需显式 `from __future__ import annotations` 启用,非默认。PEP 649(3.14 计划)用另一种机制(惰性求值,注解作为可调用对象按需求值)替代 PEP 563,解决字符串问题。

⚠️ **PEP 563 的已知陷阱**:某些注解在 PEP 563 下行为变化:

```python
from __future__ import annotations
# 1. Annotated 元信息:默认 get_type_hints 丢弃,需 include_extras
# 2. 类型别名注解求值时机变化
# 3. 某些框架旧版不解析字符串注解(需升级框架)
# 测试:启用 PEP 563 后,确保所用框架能正确解析字符串注解
```

启用 PEP 563 前测试兼容性——所用框架(FastAPI/Pydantic/dataclasses)是否正确解析字符串注解。现代版本通常支持,但老旧或自写的注解读取逻辑可能失效。

**实践**:新项目可在顶部加 `from __future__ import annotations`,免前向引用引号、性能更优,框架兼容性已基本解决。若有自写注解反射或老旧框架,保留默认(立即求值)+ 手动前向引用引号。

### 2.5 泛型的运行时表示与反射

泛型注解(`list[int]`、`Box[T]`)在运行时有特殊表示和反射工具。本节讲清泛型运行时表示,以及如何反射。

**泛型类的 `Generic` 与参数化**:

```python
from typing import Generic, TypeVar
T = TypeVar("T")
class Box(Generic[T]):
    def __init__(self, v: T): self.v = v
# Box 是泛型类(Generic 子类)
# Box[int] 是参数化泛型(GenericAlias)
print(Box)               # <class '__main__.Box'>
print(Box[int])          # Box[int]
print(type(Box[int]))    # <class 'typing.GenericAlias'>
```

`Box(Generic[T])` 使 Box 成泛型类。`Box[int]` 是**参数化的泛型**(产生 `typing.GenericAlias` 对象),表示"int 的 Box"。`Box`(裸类)与 `Box[int]`(参数化)是不同对象——前者是类,后者是类型别名对象。

**内置泛型同机制**:

```python
print(list[int])         # list[int]
print(type(list[int]))   # <class 'types.GenericAlias'>(3.9+,内置泛型用 types.GenericAlias)
print(dict[str, int])    # dict[str, int]
```

`list[int]`、`dict[str,int]` 同样产生 GenericAlias(3.9+ 用 `types.GenericAlias`),与 `Box[int]` 机制一致(`__class_getitem__`)。

**`get_args` 与 `get_origin`**——反射泛型结构:

```python
import typing, types
# 取类型参数
print(typing.get_args(list[int]))        # (<class 'int'>,)
print(typing.get_args(dict[str, int]))   # (<class 'str'>, <class 'int'>)
print(typing.get_args(Box[int]))         # (<class 'int'>,)
# 取构造器(原始类)
print(typing.get_origin(list[int]))      # <class 'list'>
print(typing.get_origin(dict[str,int]))  # <class 'dict'>
print(typing.get_origin(Box[int]))       # <class '__main__.Box'>
```

`get_args(list[int])` → `(int,)`(类型参数元组),`get_origin(list[int])` → `list`(原始类)。这套工具让运行时"拆开"泛型——看它是什么容器、元素什么类型。框架(如序列化库)据此对 `list[int]`、`dict[str,int]` 分别处理。

**解构 Union/Optional**(呼应第 10 篇):

```python
import typing, types
t = int | str
print(typing.get_origin(t))   # <class 'types.UnionType'>(3.10+ 联合)
print(typing.get_args(t))     # (<class 'int'>, <class 'str'>)
from typing import Optional
t2 = Optional[int]           # Union[int, None]
print(typing.get_origin(t2))  # typing.Union
print(typing.get_args(t2))    # (<class 'int'>, <class 'NoneType'>)
```

`get_origin`/`get_args` 也解构 Union(3.10+ 的 `int|str` origin 是 `types.UnionType`,typing.Union origin 是 `typing.Union`)。这让运行时能识别"是否联合""成员是谁"。详见第 10 篇。

**泛型类的 `__orig_bases__`**:

```python
class Box(Generic[T]): ...
print(Box.__orig_bases__)   # (typing.Generic[T],) 或 Box 的原始泛型基类
# __orig_bases__ 存"原始带参数的基类",用于反射泛型类自身的类型参数
```

泛型类有 `__orig_bases__` 属性,存"带类型参数的基类",供高级反射(获取类定义时的 TypeVar 映射)。日常少直接用,框架内部用。

**`isinstance` 与泛型**(类型擦除,呼应第 11 篇):

```python
b: Box[int] = Box(42)
print(isinstance(b, Box))         # True(查裸类)
# isinstance(b, Box[int])         # TypeError!运行时类型擦除,不支持带参数
# 运行时 Box[int] 与 Box 是同一类(类型参数擦除)
```

`isinstance(b, Box)` 查裸类工作,`isinstance(b, Box[int])` 报 TypeError(类型擦除,运行时不验类型参数)。这是泛型运行时的核心限制——类型参数在实例上擦除,不能 isinstance 验参数。需运行时验参数得自己存类型或用框架(详见 2.6)。

**运行时构造泛型类型**:

```python
# Box[int] 是运行时对象,可存/传
IntBox = Box[int]    # 类型别名(运行时 GenericAlias)
def make_box() -> IntBox: ...    # 当类型用
# 动态构造:list[int] 等价 list.__class_getitem__(int)
dynamic = list.__class_getitem__(int)   # list[int]
# 或 typing 下工具
```

`Box[int]` 是运行时可操作对象(GenericAlias),可存变量、动态构造、传给注解。这让"运行时根据数据动态选类型"可行(如据 schema 构造 `dict[str, 类型]`)。

理解泛型的运行时表示(GenericAlias)、反射工具(get_args/get_origin)、类型擦除(isinstance 限制),就掌握了泛型注解的运行时反射——这是写注解驱动框架的基础。

### 2.6 运行时类型校验

虽然解释器默认不基于注解检查,但可通过库在运行时**主动**按注解做 isinstance 校验。这是注解"运行时层"的高级应用——让注解从静态提示变为运行时守卫。

**`typing.runtime_checkable` 与 Protocol 运行时检查**:

```python
from typing import Protocol, runtime_checkable, TypeVar, get_args

@runtime_checkable
class Drawable(Protocol):
    def draw(self) -> None: ...

class Circle:
    def draw(self) -> None: print("圆")
class Number:
    pass
print(isinstance(Circle(), Drawable))   # True(Circle 有 draw 方法,符合协议)
print(isinstance(Number(), Drawable))   # False(无 draw)
```

`@runtime_checkable` 装饰 Protocol 使其支持 `isinstance` 检查——检查对象是否有协议要求的方法(结构化,鸭子类型)。这把"Protocol 静态结构化类型"延伸到运行时 isinstance。注意:`runtime_checkable` 的 isinstance 只检查方法**存在性**(有 draw 方法),不检查签名/返回类型(运行时无法验签名),是"浅检查"。

⚠️ `runtime_checkable` 限制:

```python
@runtime_checkable
class P(Protocol):
    x: int          # 协议有数据属性 x
class C:
    x: int = 5
# isinstance(C(), P)   # 行为不保证(数据属性检查不可靠,运行时只可靠方法协议)
# runtime_checkable 主要可靠检查方法协议,数据属性检查有限
```

`runtime_checkable` 对**方法协议**检查可靠,对**数据属性协议**检查不可靠(运行时难验属性类型)。故 runtime_checkable 主要用于方法协议的运行时 isinstance。

**typeguard / beartype——按注解全量运行时校验**:

```python
# typeguard:按函数注解运行时校验参数与返回
from typeguard import typechecked
@typechecked
def add(a: int, b: int) -> int:
    return a + b
add(1, 2)        # OK
# add(1, "x")   # typeguard 运行时抛 TypeError(b 应 int,实为 str)
# add(1, 2) 返回检查也守

# beartype:更快的运行时校验(JIT)
from beartype import beartype
@beartype
def greet(name: str) -> str:
    return "hi " + name
greet("Alice")      # OK
# greet(42)         # beartype 运行时抛 TypeError
```

`typeguard`/`beartype` 读函数注解,在调用时按注解 isinstance 校验参数与返回值。这让注解在运行时"生效"——传错类型运行时立即抛错(而非等深层错误)。beartype 比 typeguard 快(JIT 生成检查函数),适合生产;typeguard 更完整(支持复杂类型)。

**手写运行时校验**(理解框架如何做):

```python
import typing
def validate(value, type_hint):
    """按 type_hint 运行时校验 value(简化,处理基础类型与泛型)。"""
    origin = typing.get_origin(type_hint)
    if origin is list:           # list[T]
        if not isinstance(value, list): raise TypeError
        elem_type = typing.get_args(type_hint)[0]
        for v in value: validate(v, elem_type)
    elif origin is typing.Union or origin is __import__('types').UnionType:  # X|Y
        if not any(validate_or(v, t) for t in typing.get_args(type_hint)):
            raise TypeError
    elif type_hint is not typing.Any:
        if not isinstance(value, type_hint): raise TypeError(f"{value} 非 {type_hint}")
def validate_or(v, t):
    try: validate(v, t); return True
    except TypeError: return False
validate([1, 2, 3], list[int])      # OK
# validate([1, "x"], list[int])     # TypeError(元素 str 非 int)
validate(42, int | str)             # OK
# validate(3.14, int | str)         # TypeError(非 int 非 str)
```

这是运行时校验的本质——递归解构类型注解(`get_origin`/`get_args`),对值按解构出的类型 isinstance 检查。Pydantic、typeguard 内部就是这套递归校验逻辑(更完善,处理更多类型/边界)。理解这套机制,就理解了"注解如何驱动运行时校验"。

**运行时校验的性能与取舍**:

- **性能开销**:运行时校验每次调用都 isinstance,有开销(beartype JIT 优化,typeguard 较慢)。
- **取舍**:关键接口、外部输入处用运行时校验(防脏数据);内部热路径不用(性能)。
- **Pydantic 模式**:Pydantic 在数据入口(请求解析、模型构造)校验,内部用已校验数据(不再逐操作校验),平衡安全与性能。

```python
# Pydantic 风格:入口校验,内部信任
class User(pydantic.BaseModel):
    name: str
    age: int
# User(name="Alice", age="30") 时 Pydantic 校验+转换(age "30"→30 int)
# 构造后 user.age 是 int,内部用不再校验
```

运行时校验让注解"活"起来——从静态文档变为运行时守卫。但需权衡性能,在关键边界用而非全量。理解 typeguard/beartype/Pydantic 的校验本质(递归解构注解 isinstance),就掌握了注解运行时校验的全貌。

### 2.7 综合示例:一个迷你注解驱动框架

下面这个片段综合演示 `__annotations__`、`get_type_hints`、泛型反射、运行时校验,实现一个迷你的"注解驱动数据校验器"(简版 Pydantic):

```python
from __future__ import annotations       # 启用 PEP 563,注解存字符串
import typing, types

# 迷你校验器:按类注解运行时校验实例属性
class Model:
    def __init__(self, **kwargs):
        hints = typing.get_type_hints(type(self))   # 解析注解(含继承、字符串→类型)
        for field, ftype in hints.items():
            if field not in kwargs:
                raise ValueError(f"缺字段:{field}")
            value = kwargs[field]
            _validate(value, ftype, field)          # 运行时校验
            setattr(self, field, value)

def _validate(value, hint, name=""):
    """递归校验 value 符合 hint(简化版)。"""
    origin = typing.get_origin(hint)
    # 泛型:list[T]
    if origin is list:
        if not isinstance(value, list):
            raise TypeError(f"{name} 应 list,实 {type(value).__name__}")
        elem = typing.get_args(hint)[0]
        for i, v in enumerate(value):
            _validate(v, elem, f"{name}[{i}]")
    # 联合:X | Y
    elif origin is types.UnionType or origin is typing.Union:
        members = typing.get_args(hint)
        if not any(_try(v, m) for v in [value] for m in members):
            raise TypeError(f"{name} 不匹配联合 {hint}")
    # Optional 成员 NoneType
    elif hint is type(None):
        if value is not None: raise TypeError(f"{name} 应 None")
    # 具体类型
    elif isinstance(hint, type):
        if not isinstance(value, hint):
            raise TypeError(f"{name} 应 {hint.__name__},实 {type(value).__name__}")

def _try(value, hint):
    try: _validate(value, hint); return True
    except TypeError: return False

# 定义数据模型(注解驱动)
class User(Model):
    name: str
    age: int
    tags: list[str]
    email: str | None

# 正确实例化(校验通过)
u = User(name="Alice", age=30, tags=["a", "b"], email=None)
print(u.name, u.age, u.tags, u.email)   # Alice 30 ['a', 'b'] None

# 校验失败示例(取消注释看报错)
# User(name="Bob", age="thirty", tags=["x"], email=None)   # age 应 int
# User(name="C", age=1, tags=[1, 2], email=None)           # tags[0] 应 str
# User(name="D", age=1, tags=[], email=42)                 # email 不匹配 str|None

# 反射:读模型字段注解
print("User 字段:", typing.get_type_hints(User))
# {'name': <class 'str'>, 'age': <class 'int'>, 'tags': list[str], 'email': str | None}
```

跑一遍这段示例,对照:启用 PEP 563(注解存字符串)→ `get_type_hints` 解析(字符串→真实类型,含泛型 list[str]、联合 str|None)→ 递归 `_validate` 校验(解构 list/Union 逐层 isinstance)→ 构造时校验。这就是 Pydantic 的核心模型——注解驱动、运行时校验。

这个迷你框架展示了注解运行时层的完整链条:**注解(字符串/立即)→ `get_type_hints` 解析 → 泛型/联合反射(get_args/get_origin)→ 递归 isinstance 校验**。理解它,就理解了 FastAPI/Pydantic 等"注解驱动框架"的运行时机制——它们都在做这套"读注解、解析、校验、反射"的工作,只是更完善(更多类型支持、性能优化、错误信息)。

核心结论:**注解在运行时是 `__annotations__` 元数据(默认立即求值为类型,PEP 563 下存字符串),`get_type_hints` 解析含前向引用/继承/泛型,泛型运行时是 GenericAlias 可 get_args 反射但 isinstance 受类型擦除限制,运行时校验(typeguard/beartype/Pydantic)递归解构注解 isinstance 使注解成为运行时守卫**。

---

## 3. 最佳实践

### 3.1 读注解用 get_type_hints,而非直接 __annotations__

```python
# 推荐:解析注解(处理字符串前向引用、继承合并、泛型)
import typing
hints = typing.get_type_hints(func_or_class)
# 避免:直接 __annotations__(可能是字符串、不含继承)
# raw = func.__annotations__   # 可能 {'x': 'Node'}(字符串),无法 isinstance
```

直接读 `__annotations__` 可能得字符串前向引用(无法 isinstance)、且不含继承属性。`get_type_hints` 统一解析为真实类型对象并合并继承,是运行时读注解的标准入口。框架与你自己的注解反射都应优先它。

### 3.2 处理 PEP 563 的字符串注解,用 get_type_hints 解析

```python
from __future__ import annotations
def f(x: int) -> str: ...
print(f.__annotations__)        # {'x': 'int', 'return': 'str'} 字符串!
# 用 get_type_hints 解析才能用
import typing
print(typing.get_type_hints(f)) # {'x': int, 'return': str}
```

启用 PEP 563 后 `__annotations__` 全是字符串,不能直接用。解析必须 `get_type_hints`。若你自写读注解逻辑,PEP 563 下要改用 get_type_hints,否则读到字符串。

### 3.3 前向引用优先用 from __future__ import annotations,免引号

```python
# 推荐(3.7+):顶部 import,自引用/互引用无需引号
from __future__ import annotations
class Node:
    def f(self, n: Node) -> Node: ...
# 兼容场景:手动引号
class Node:
    def f(self, n: "Node") -> "Node": ...
```

`from __future__ import annotations` 让所有注解延迟为字符串,自引用/互引用直接写类名无需引号,最简洁。无该 future 时,前向引用手动加字符串引号。现代项目用 future。

### 3.4 isinstance 不查泛型类型参数,理解类型擦除

```python
class Box(Generic[T]): ...
b: Box[int] = Box(42)
isinstance(b, Box)         # True(查裸类,OK)
# isinstance(b, Box[int])  # TypeError!类型擦除,不查 [int]
# 需运行时验类型参数,自己存类型或用框架反射注解
```

泛型实例的类型参数运行时擦除,`isinstance(x, 泛型类[参数])` 报 TypeError。运行时只能查裸类。要验类型参数,需自己存类型(类属性记 T)或从注解反射(get_args)。别误用带参数的 isinstance。

### 3.5 反射泛型/联合用 get_args + get_origin

```python
import typing, types
t = list[int]
if typing.get_origin(t) is list:
    elem = typing.get_args(t)[0]    # int
u = int | str
if typing.get_origin(u) in (types.UnionType, typing.Union):
    members = typing.get_args(u)    # (int, str)
```

运行时拆解泛型(`list[int]`)、联合(`int|str`)的结构,用 `get_origin`(取原始类/联合标记)+ `get_args`(取成员)。这是写注解驱动代码(校验器、序列化器)的基础工具。3.10+ 联合 origin 是 `types.UnionType`,typing.Union origin 是 `typing.Union`,两者都判。

### 3.6 类属性注解区分"带默认值"与"纯声明"

```python
class C:
    a: int = 10        # 带默认:a 是类属性(值10)+ 注解
    b: str             # 纯声明:b 只注解,不是类属性(运行时 hasattr(C,'b') False)
# 框架读 __annotations__ 看 b,但 b 运行时无默认值(需 __init__ 赋实例属性)
```

类体内 `a: int = 10` 既注解又成类属性;`b: str` 只注解不成属性(运行时无值)。框架(dataclass/Pydantic)读 `__annotations__` 看所有字段(含 b),但 b 需在 `__init__` 赋实例属性。理解两种注解的运行时差异,避免"以为 b 有默认值"。

### 3.7 局部变量注解运行时不可访问,纯静态

```python
def f():
    x: int = 10        # 局部注解
    y: str
    # x、y 的注解运行时丢失,不进任何 __annotations__
# 框架无法读局部注解,只能读函数参数/类属性/模块级注解
```

局部变量注解(`函数内 x: int`)运行时完全消失(不存 `__annotations__`),纯静态提示。框架只能读函数参数、类属性、模块级注解。若需运行时反射某值的类型,用参数/属性注解,别用局部注解。

### 3.8 runtime_checkable 只可靠检查方法协议,数据属性有限

```python
@runtime_checkable
class Drawable(Protocol):
    def draw(self) -> None: ...
isinstance(Circle(), Drawable)   # 可靠(检查 draw 方法存在)
# 对数据属性协议,运行时检查不可靠
```

`@runtime_checkable` Protocol 的 isinstance 检查,对**方法协议**可靠(验方法存在),对**数据属性协议**不可靠(运行时难验属性类型)。优先用 runtime_checkable 检查方法协议,数据属性协议用静态层(Protocol)而非运行时 isinstance。

### 3.9 Annotated 元信息默认被 get_type_hints 丢弃,需 include_extras

```python
from typing import Annotated
def f(x: Annotated[int, "positive"]): ...
typing.get_type_hints(f)                       # {'x': int}(丢弃元信息)
typing.get_type_hints(f, include_extras=True)  # {'x': Annotated[int,'positive']}(保留)
# 框架用 Annotated 附加约束(如 >0),读时需 include_extras
```

`Annotated[int, "meta"]` 附加元信息(框架约束,如 Pydantic 字段约束)。`get_type_hints` 默认丢弃元信息只留 `int`,要读约束需 `include_extras=True`。框架(FastAPI/Pydantic)读 Annotated 约束用 include_extras。

### 3.10 运行时校验权衡性能,关键边界用而非全量

```python
# 推荐关键边界校验(入口防脏数据)
class User(pydantic.BaseModel):    # Pydantic 入口校验
    name: str; age: int
# 内部热路径不逐操作校验(性能)
def process(u: User):             # u 已校验,内部信任
    ...
# 避免:每个函数 typechecked/typeguard(性能开销累积)
```

运行时校验(typeguard/beartype/Pydantic)有开销。在数据入口(请求解析、模型构造、外部输入)校验,内部用已校验数据信任(不再逐操作校验),平衡安全与性能。别每个函数都加重型运行时校验。

### 3.11 跨模块解析注解显式传 globalns

```python
# 在模块 B 解析模块 A 定义的函数注解(引用 A 的类型)
typing.get_type_hints(func, globalns=vars(module_a))
# 默认用 func.__globals__(A 的全局),通常 OK;复杂场景显式传
```

`get_type_hints` 默认用对象自带 `__globals__`(定义所在模块全局)解析字符串注解。复杂场景(动态构造、跨模块)显式传 `globalns`/`localns` 控制求值作用域,确保字符串能解析。

### 3.12 类的 __annotations__ 不含继承,合并用 get_type_hints 或手动 MRO

```python
class Base: x: int
class Derived(Base): y: str
print(Derived.__annotations__)        # {'y': str}(不含 x)
print(typing.get_type_hints(Derived)) # {'x': int, 'y': str}(合并继承)
# 手动合并沿 MRO
all_fields = {}
for cls in reversed(Derived.__mro__):
    all_fields.update(getattr(cls, '__annotations__', {}))
```

`cls.__annotations__` 只含本类注解,不含父类。要全部(含继承)用 `get_type_hints`(自动合并),或沿 `__mro__` 手动合并各类注解。框架读"完整字段列表"用 get_type_hints 或手动 MRO 合并。

---

## 4. 原理

本章讲清注解运行时的底层机制:`__annotations__` 的构建与存储、求值时机的实现(立即求值 vs 字符串)、`get_type_hints` 的解析过程、泛型 GenericAlias 与类型擦除的实现、PEP 563 的字符串化机制、PEP 649 惰性求值展望。这些是"注解运行时为何如此"的根源。

### 4.1 __annotations__ 的构建机制(需理解,详述)

解释器在处理带注解的函数/类/模块定义时,会把注解**收集进 `__annotations__` 字典**。这是编译期/定义期的行为,理解其机制就理解存储结构。

**函数 `__annotations__` 构建**:函数定义 `def f(x: int, y: str = "a") -> bool:` 被编译为字节码,其中注解部分被收集:

```python
import dis
def f(x: int, y: str = "a") -> bool: ...
dis.dis(f.__code__)  # 或看定义处字节码
# 编译时:注解 int、str、bool 被求值(默认),收集进 __annotations__ 字典
# 字典: {'x': int, 'y': str, 'return': bool}
# 绑定到函数对象 f.__annotations__
```

具体:函数定义编译时,各参数注解(默认立即求值为类型对象)、返回注解编译进 `MAKE_FUNCTION` 的注解字典参数,函数对象创建时绑定到 `__annotations__`。默认值(`= "a"`)单独编译进 `__defaults__`(不混入注解字典)。故 `__annotations__` 只含类型,默认值在别处。

**变量注解的边界——局部 vs 模块/类**:

```python
# 模块级变量注解:进模块 __annotations__
x: int = 10          # 模块级,注解 + 赋值
# 模块 __annotations__ += {'x': int}

def f():
    y: int = 20      # 局部变量注解
    # 局部注解不进任何 __annotations__(字节码只记为注解,不存字典)
# 函数 f.__annotations__ 不含 y(局部注解丢失)
```

为何局部变量注解不存?字节码层,局部变量注解(`y: int = 20`)编译为一个 `SETUP_ANNOTATIONS`(仅在首次)和注解记录,但**局部作用域不维护注解字典**(局部名字空间是数组/槽位,非 dict,无地方存注解)。模块/类作用域有 dict 可存注解,故模块级/类属性注解进 `__annotations__`,局部不进。这是"局部注解运行时消失"的字节码根源——局部名字空间结构与注解字典不兼容。

**类 `__annotations__` 构建**:

```python
class C:
    a: int           # 类体执行时:记录到类命名空间的 __annotations__
    b: str = "x"
# 类创建时:类体的 __annotations__ 字典( {'a': int, 'b': str} )绑到 C.__annotations__
```

类体执行时,维护一个类命名空间 dict,属性注解写入其中的 `__annotations__` 子键。类对象创建后,该 dict 绑定为 `C.__annotations__`。注意 `b: str = "x"` 的 `"x"`(默认值)是类属性(写入命名空间 `b`),注解 `str` 写入 `__annotations__['b']`——两者分开存。

**3.10+ 函数默认有 `__annotations__`**:

```python
def no_anno(): ...
print(no_anno.__annotations__)   # {}(3.10+)
# 3.9 及更早:可能无该属性(完全无注解函数)
```

3.10 起,函数对象创建时默认绑定空 `__annotations__` 字典(即使无注解),故 3.10+ 函数总有该属性。3.9 及更早,无注解函数可能没 `__annotations__` 属性——读时用 `getattr(f, '__annotations__', {})` 防御。这是版本差异,跨版本代码注意。

理解 `__annotations__` 在函数/类/模块定义时构建(局部注解因名字空间结构不存)、字节数与对象绑定的机制,就理解了"注解存哪、为何局部注解消失、为何 3.10+ 函数总有该属性"。

### 4.2 求值时机:立即求值与字符串化的字节码差异

注解的"立即求值 vs 字符串"机制,在字节码层有清晰体现。

**立即求值(默认)**:

```python
def f(x: int) -> str: ...
# 字节码:LOAD_NAME 'int'(求值 int 类)→ 收入注解 dict
# 故 __annotations__['x'] = <class 'int'>(类型对象)
```

默认注解 `x: int`——编译为 `LOAD_NAME int`(把 `int` 名求值为类对象),收入 `__annotations__`。故 `__annotations__['x']` 是 `<class 'int'>` 类型对象。求值在定义时发生,若 `int` 名不存在(未定义),`NameError`。

**字符串前向引用**:

```python
def f(x: "Node") -> "Node": ...
# 字节码:LOAD_CONST 'Node'(字符串,不求值)→ 收入注解 dict
# 故 __annotations__['x'] = 'Node'(字符串)
```

`x: "Node"`——字符串字面量,编译为 `LOAD_CONST 'Node'`(字符串,不求值),收入 `__annotations__`。故 `__annotations__['x']` 是 `'Node'` 字符串(未求值)。求值被推迟(到 get_type_hints 时)。

对比:`x: int`(立即,LOAD_NAME 求值)vs `x: "int"`(字符串,LOAD_CONST 不求值)。这就是前向引用的本质——用字符串阻止定义时求值,推迟到运行时解析。字符串注解的"不求值"使其能引用尚未定义的名字(因不求值就不查名字是否存在)。

**PEP 563(`from __future__ import annotations`)**:

```python
from __future__ import annotations
def f(x: int) -> str: ...     # 写 int,但存为 'int' 字符串
# 字节码:本应 LOAD_NAME int,但 PEP 563 改为 LOAD_CONST 'int'(字符串)
# 故 __annotations__['x'] = 'int'(字符串,不求值)
```

PEP 563 改变编译器行为:有该 future 时,所有注解(无论加不加引号)编译为 `LOAD_CONST '字符串'`(注解的源码文本),不求值。故 `x: int` 在 PEP 563 下也存为 `'int'` 字符串。这是 PEP 563 的实现——编译期把注解转为字符串常量,跳过求值。

**求值时机的字节码验证**:

```python
import dis
def f1(x: int): ...          # 立即求值
def f2(x: "int"): ...        # 字符串
# dis 显示 f1 的注解构建有 LOAD_NAME int,f2 有 LOAD_CONST 'int'
```

`dis` 可见 f1 注解构建含 `LOAD_NAME int`(求值),f2 含 `LOAD_CONST 'int'`(字符串)。这是立即求值 vs 字符串化的字节码铁证。

理解求值时机的字节码差异(LOAD_NAME 求值 vs LOAD_CONST 字符串),就理解了"立即求值为何存类型对象、字符串为何存字符串、PEP 563 为何让所有注解变字符串"——都是编译器对注解的处理方式决定。

### 4.3 get_type_hints 的解析过程(需理解,详述)

`get_type_hints` 把 `__annotations__`(可能含字符串)解析为真实类型对象。讲清其解析过程,就理解框架如何读注解。

**解析步骤**:

1. 取对象的 `__annotations__`(函数/类/模块)。
2. 对类,**沿 MRO 合并**父类注解(子类覆盖父类)。
3. 对每个注解值,**若是字符串,在适当作用域 eval 求值为类型对象**;若已是类型对象,保留。
4. 处理 `None` 注解(`None` → `type(None)` 即 NoneType,规范化)。
5. (可选)`include_extras` 控制是否保留 Annotated 元信息。

**字符串求值的作用域**:

```python
class Node: ...
def f(x: "Node") -> "list[Node]": ...
import typing
typing.get_type_hints(f)
# 解析 'Node':在 f.__globals__(f 定义模块全局)找 Node → Node 类
# 解析 'list[Node]':eval('list[Node]', f.__globals__) → list[Node](GenericAlias)
```

`get_type_hints` 对字符串注解 `eval(s, globalns, localns)`——在对象的全局作用域(f.`__globals__`)求值。`'Node'`→在全局找 Node 名→Node 类;`'list[Node]'`→eval 得 `list[Node]` GenericAlias。这要求字符串能在作用域求值(名字存在),否则 NameError。

**None 规范化**:

```python
def f(x: None) -> None: ...
typing.get_type_hints(f)   # {'x': <class 'NoneType'>, 'return': <class 'NoneType'>}
# 注解里的 None 被规范化为 type(None)(NoneType 类)
```

注解 `None`(常写的 `-> None`)被 get_type_hints 规范化为 `type(None)`(NoneType 类对象)。这让运行时能 isinstance 判 None(`isinstance(x, type(None))`)。原始 `__annotations__` 里可能存 `None`(对象),get_type_hints 转为 NoneType 类。

**继承合并**:

```python
class Base: x: int
class Derived(Base): y: str
typing.get_type_hints(Derived)
# 沿 Derived.__mro__ (Derived, Base, object) 遍历
# 合并各 __annotations__:Base 的 {'x':int} + Derived 的 {'y':str}
# 结果 {'x': int, 'y': str}
```

`get_type_hints(cls)` 沿 `cls.__mro__` 遍历,合并各类 `__annotations__`(子类覆盖父类同名)。这相对 `cls.__annotations__`(只本类)增加了继承。框架读"完整字段"靠此。

**Annotated 处理**:

```python
from typing import Annotated
def f(x: Annotated[int, "meta"]): ...
# 默认:get_type_hints 返回 {'x': int}(剥 Annotated 留基础类型)
# include_extras=True:返回 {'x': Annotated[int, 'meta']}(保留)
```

`Annotated[int, "meta"]` 是带元信息的类型。get_type_hints 默认剥离 Annotated 留基础 int(默认 `include_extras=False`),`include_extras=True` 保留 Annotated 完整(含 meta)。框架读 meta 约束用 include_extras。

**潜在 NameError 与解决**:

```python
def f(x: "SomeType"): ...
del SomeType     # 删除了 SomeType
# typing.get_type_hints(f)   # NameError:解析 'SomeType' 时找不到
# 解决:确保字符串引用的类型在作用域可达,或显式传 globalns/localns
```

`get_type_hints` 解析字符串需名字可达。若引用的类型被删/不可达,NameError。解决:保持类型可达,或显式 `get_type_hints(f, globalns={...})` 传作用域。这是前向引用的运行时风险——字符串最终要能求值。

理解 get_type_hints 的解析(取注解→合并继承→eval 字符串→规范化 None→可选 Annotated),就理解框架读注解的标准流程。这是 FastAPI/Pydantic 内部的核心——它们都以 get_type_hints 为基础解析注解。

### 4.4 泛型 GenericAlias 与类型擦除的实现

§2.5 讲了泛型运行时表示,这里讲清 `GenericAlias` 与类型擦除的实现根源。

**`X[T]` 的 `__class_getitem__`**:泛型写法 `list[int]`、`Box[T]` 调用类的 `__class_getitem__` 方法,返回 GenericAlias:

```python
# list[int] 等价 list.__class_getitem__(int)
print(list.__class_getitem__(int))    # list[int]
print(type(list.__class_getitem__(int)))  # <class 'types.GenericAlias'>(3.9+)
# Box[int] 等价 Box.__class_getitem__(int)
class Box(Generic[T]): ...
print(type(Box[int]))    # <class 'typing._GenericAlias'>(typing 的)
```

`list.__class_getitem__(int)` 返回 `types.GenericAlias` 对象(3.9+,PEP 585),表示"int 元素的 list"。`Box[int]`(typing Generic)返回 `typing._GenericAlias`(PEP 484)。两者都封装"原始类 + 类型参数",供运行时反射(get_args/get_origin)与静态检查。

**GenericAlias 的结构**:

```python
g = list[int]
# g.__origin__ = list(原始类)
# g.__args__ = (int,)(类型参数)
# 等价 get_origin(g)=list, get_args(g)=(int,)
print(g.__origin__)   # list
print(g.__args__)     # (int,)
```

GenericAlias 内部存 `__origin__`(原始类)与 `__args__`(类型参数元组)。`get_origin`/`get_args` 就是读这两个属性。这让运行时能拆解泛型结构。

**类型擦除——实例不携带类型参数**:GenericAlias 是"类型注解对象"(如 `b: Box[int]` 的注解),但**实例**(Box(42) 对象)不携带类型参数:

```python
b: Box[int] = Box(42)   # 注解 Box[int](GenericAlias)
# 但 b 的运行时类型只是 Box(无 int 信息)
print(type(b))          # <class Box>(不含 int)
# Box 的 __init__ 不记录 T=int(类型参数擦除)
```

泛型类实例化时(`Box(42)`),`__init__` 不记录类型参数(int)——对象只知自己是 Box 实例,不知"装的是 int"。这是类型擦除:类型参数在"注解层"(GenericAlias)存在,在"实例层"擦除(对象不带)。根源:Python 对象模型只在对象头存 `ob_type`(指向类),不存泛型类型参数;泛型类 `Box` 与 `Box[int]` 实例化产生的是同一类 Box 的实例(类型参数不影响对象创建)。

**为何 `isinstance(x, Box[int])` 报 TypeError**:isinstance 检查对象的 `ob_type` 是否是某类(或子类)。`Box` 是类,isinstance 可查;但 `Box[int]` 是 GenericAlias 对象(非类),isinstance 不识别它(第二参数要类或类元组,GenericAlias 既非类也非元组),报 TypeError:

```python
isinstance(b, Box)           # OK:Box 是类,查 ob_type
# isinstance(b, Box[int])    # TypeError:Box[int] 是 GenericAlias,isinstance 不认
```

isinstance 的第二参数要求"类或类元组",GenericAlias 不符合(它是注解对象非类)。这是"类型擦除下无法 isinstance 验类型参数"的根源——实例无类型参数信息,isinstance 也无法对 GenericAlias 工作。

**框架如何"绕过"类型擦除**:需运行时验类型参数的框架,通过**注解反射**(从类/属性注解 get_type_hints 读 Box[int] 的 int)而非实例 isinstance:

```python
class Container:
    box: Box[int] = Box(42)
# 框架读 Container.__annotations__['box'] = Box[int],get_args 得 int
# 得知 box 应装 int,据此校验(而非 isinstance(box, Box[int]))
```

框架(如 Pydantic)从注解读字段类型(Box[int]→int),在赋值/构造时校验值是否符合注解(而非 isinstance 验泛型实例)。这是"类型擦除下运行时验类型参数"的正道——从注解读泛型信息,而非从实例 isinstance。

理解 GenericAlias(注解层存类型参数)+ 类型擦除(实例层无类型参数)+ isinstance 限制(对 GenericAlias 报错),就理解泛型运行时反射的全部边界,以及框架为何从注解而非实例读泛型信息。

### 4.5 PEP 563 字符串化与 PEP 649 惰性求值展望

PEP 563(字符串化)解决了前向引用,但引入"运行时全是字符串需解析"的问题。PEP 649(3.14 计划)用更优的惰性求值替代。

**PEP 563 的机制与问题**:

```python
from __future__ import annotations
def f(x: int) -> str: ...
# PEP 563:编译期,注解 'int'/'str' 存为字符串(LOAD_CONST),不求值
# 运行时 __annotations__ = {'x': 'int', 'return': 'str'}(全字符串)
# 问题:运行时要类型对象必须 get_type_hints 解析(开销+可能 NameError)
```

PEP 563 让注解全字符串化(4.2 述),好处是免前向引用、无求值副作用;问题是运行时读注解必须 get_type_hints(直接 `__annotations__` 是字符串不能用),且字符串求值有开销与 NameError 风险。这"全字符串化"是激进方案——所有注解(含不需前向引用的)都被字符串化。

**为何 PEP 563 未成默认**:原计划 3.10 默认启用 PEP 563,但推迟——因它对某些运行时场景破坏太大(如直接读 `__annotations__` 期望类型对象的代码、C 扩展读注解),且 get_type_hints 的 NameError 风险(类型被删)。社区权衡后,PEP 563 保留为 opt-in(future import),非默认。

**PEP 649——惰性求值(更优方案)**:PEP 649(计划 3.14 默认)用"惰性注解"替代 PEP 563 字符串化:

```python
# PEP 649 概念(3.14):
def f(x: int) -> str: ...
# 注解不立即求值,也不字符串化,而是存为"可求值的描述"(code object/thunk)
# 读 __annotations__ 时,按需求值(惰性),返回类型对象(非字符串)
# 兼顾:免前向引用(惰性,定义时不求值)+ 运行时直接得类型(非字符串)
```

PEP 649 的核心:注解存为**可按需求值的对象**(类似 property 的惰性求值),而非字符串。读 `__annotations__` 时才求值(惰性),返回类型对象(非 PEP 563 的字符串)。这兼顾 PEP 563 优点(免前向引用、无立即求值副作用)与"运行时直接得类型对象"(无字符串化问题)。

**PEP 649 vs PEP 563**:

| 方面 | PEP 563(字符串化) | PEP 649(惰性求值) |
|------|-------------------|---------------------|
| 注解存储 | 字符串 | 可求值对象(thunk) |
| 读 `__annotations__` 得 | 字符串 | 类型对象(惰性求值) |
| 需 get_type_hints 解析 | 是(必要) | 否(直接得类型) |
| 前向引用 | 解决(字符串不求值) | 解决(惰性不求值) |
| 运行时 NameError 风险 | 求值时 | 求值时(惰性触发) |

PEP 649 优于 PEP 563——它避免"运行时全字符串需解析",直接惰性提供类型对象。这是 3.14 计划的方向,解决注解求值时机的根本问题(免前向引用 + 运行时直得类型 + 无立即求值副作用)。

**当前实践(3.12 及前)**:

```python
# 当前选择:
# 1. 默认(立即求值)+ 手动前向引用引号:最稳,运行时 __annotations__ 是类型对象
# 2. from __future__ import annotations(PEP 563):免引号,但运行时需 get_type_hints
# 等 3.14 PEP 649 默认后,两者优点的合并,无需纠结
```

当前(3.12 及前)二选一:默认立即求值(稳,需手动引号)或 PEP 563(免引号,需运行时解析)。3.14 PEP 649 默认后将统一(免引号 + 直接类型)。理解 PEP 563 字符串化与 PEP 649 惰性求值的机制差异,就理解注解求值时机演进的方向——从激进字符串化(PEP 563)走向更优的惰性求值(PEP 649)。

---

## 5. 总结

### 5.1 本文内容回顾

- **注解运行时双重身份**:静态层(给 mypy,不强运行时)+ 运行时层(存 `__annotations__` 元数据,默认不主动检查)+ 框架层(主动读注解 isinstance 校验,使注解运行时生效)。
- **__annotations__ 存储**:函数(参数名→类型+'return')、类(类体属性注解,不含继承、不含方法参数)、模块级;局部变量注解不存(局部名字空间无注解字典);带值注解成类属性、纯声明不成;3.10+ 函数默认有该属性。
- **求值时机**:默认立即求值(注解存类型对象);前向引用(字符串 `"Node"`,存字符串不求值,避 NameError,需 get_type_hints 解析);PEP 563(`from __future__ import annotations`,所有注解字符串化,免引号但运行时需解析)。
- **get_type_hints**:解析注解为真实类型(字符串 eval 求值、合并继承、规范化 None→NoneType、可选 include_extras 保留 Annotated);框架读注解标准入口;作用域控制 globalns/localns。
- **泛型运行时**:GenericAlias(注解层存类型参数,`__origin__`/`__args__`);get_args/get_origin 反射泛型/联合;类型擦除(实例层无类型参数,`isinstance(x, 泛型类[参数])` 报 TypeError,只查裸类);框架从注解读泛型信息而非实例 isinstance。
- **运行时校验**:runtime_checkable Protocol(方法协议可 isinstance,浅检查);typeguard/beartype(按注解全量运行时校验参数返回);Pydantic(入口校验);校验本质是递归解构注解(get_args/get_origin)isinstance;权衡性能关键边界用。
- **原理**:`__annotations__` 构建机制(函数注解进 MAKE_FUNCTION、类体命名空间收集、局部注解因名字空间结构不存);求值字节码差异(LOAD_NAME 立即求值 vs LOAD_CONST 字符串);get_type_hints 解析过程(取注解→合并 MRO→eval 字符串→规范化 None→Annotated);GenericAlias 实现(`__class_getitem__` 返回封装 origin/args)+ 类型擦除(对象只 ob_type 无类型参数)+ isinstance 限制;PEP 563 字符串化 vs PEP 649 惰性求值(3.14 展望,兼顾免引号与直得类型)。
- **最佳实践**:读注解用 get_type_hints、PEP 563 下必须解析、前向引用用 future 免引号、isinstance 不查泛型参数、反射用 get_args/get_origin、区分类属性带值/声明、局部注解不可反射、runtime_checkable 限方法协议、Annotated 需 include_extras、运行时校验权衡性能、跨模块传 globalns、继承合并用 get_type_hints/MRO。

### 5.2 读完本文你应能掌握

- 说明注解的静态/运行时/框架三层身份,阐述"注解不影响运行时但存为元数据"。
- 读取并解释函数/类/模块的 `__annotations__` 结构,指出局部变量注解不存、类注解不含继承。
- 区分立即求值、字符串前向引用、PEP 563 三种求值模式,用字符串/future 处理前向引用。
- 用 `get_type_hints` 解析注解为真实类型(含字符串解析、继承合并、None 规范化、Annotated),理解框架依赖它。
- 用 get_args/get_origin 反射泛型与联合,说明类型擦除对 isinstance 的限制,解释框架从注解(非实例)读泛型信息。
- 用 runtime_checkable/typeguard/beartype 做运行时校验,阐述校验本质(递归解构注解 isinstance),权衡性能。
- 阐述 `__annotations__` 构建机制、求值字节码差异、get_type_hints 解析过程、GenericAlias 与类型擦除实现、PEP 563/649 演进等原理。

### 5.3 延伸方向

- **mypy 静态检查**:mypy 如何读注解(源码 AST,非运行时 `__annotations__`)、与运行时注解的差异,见《mypy 静态类型检查》。
- **类型注解基础/Union/Any/TypeVar**:注解的写法(本篇讲运行时机制,写法见 09/10/11),互为补充。
- **框架的注解消费**:FastAPI(注解驱动 API 参数解析)、Pydantic(注解驱动数据校验)、dataclasses(注解生成方法)的注解读取实现,见各自专题。
- **typing 模块进阶**:runtime_checkable Protocol、Annotated、get_type_hints、get_args/get_origin 的完整 API,见标准库 typing 专题。
- **PEP 649 与注解演进**:惰性求值机制、3.14 默认启用影响、对框架的改进,关注 Python 类型注解未来发展。
