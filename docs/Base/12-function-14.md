---
group:
  title: 【12】函数核心机制
  order: 12
order: 14
title: 函数注解与类型提示
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是函数注解

函数注解（Function Annotations，PEP 3107）是 Python 3.0 引入的一项语法特性，允许你在函数的参数和返回值上附加任意的「标注信息」。这些标注信息会被 Python 收集到一个名为 `__annotations__` 的字典里，成为函数对象的元数据。

需要特别强调的一点是：**Python 默认不对注解做任何事情**——不检查、不强制、不影响运行。注解只是元数据，它的「意义」完全交给第三方工具来定义。PEP 3107 原文明确写道："Python itself does not assign any meaning to annotations."也就是说，解释器只负责把这些标注存起来，至于它们用来干什么，Python 不管。

举一个最简单的例子：

```python
def greet(name: str, times: int = 1) -> str:
    return (f"Hello, {name}! " * times).strip()

print(greet("Alice", 2))
# 输出：Hello, Alice! Hello, Alice!

print(greet.__annotations__)
# 输出：{'name': <class 'str'>, 'times': <class 'int'>, 'return': <class 'str'>}
```

这段代码里，`name: str` 表示参数 `name` 期望接收一个字符串，`times: int = 1` 表示参数 `times` 期望是整数且默认值为 1，`-> str` 表示返回值是字符串。注意第二行调用 `greet("Alice", 2)` 正常返回——即便你故意传错类型，Python 也不会报错：

```python
# 故意传错类型，Python 不会拦截
print(greet(123, "two"))
# 输出：Hello, 123! Hello, 123!  （字符串乘法照样执行，因为 "two" 是真值）
```

这正说明了注解的「纯元数据」性质：它不影响运行时行为。

### 1.2 类型提示是注解的一种约定用法

函数注解本身是一个通用的元数据机制，你可以往参数上标注任何对象——一个字符串、一个数字、一个类都行。但在 PEP 484（2014 年）之后，社区形成了一个约定：**用注解来表达「期望的类型」**，这就是「类型提示」（Type Hints）。

换句话说：

- **注解（annotation）** 是语法机制（`name: str` 这套写法）。
- **类型提示（type hint）** 是注解的一种约定用法（约定标注的内容是类型，而非任意元数据）。

PEP 484 规定了类型提示的正式写法、`typing` 模块提供的类型构造工具，以及一套静态类型检查规则。围绕这套约定，社区发展出了 mypy、pyright 等静态类型检查器，以及 IDE 的类型补全能力。今天我们说「函数注解」，绝大多数情况下指的就是「类型提示」。

### 1.3 最小可运行示例

下面是一个贴近真实业务场景的最小示例，展示了类型提示的完整写法：

```python
def parse_user(data: dict) -> dict:
    """从原始数据中解析出用户信息。"""
    return {
        "name": data.get("name", "unknown"),
        "age": int(data.get("age", 0)),
    }

user = parse_user({"name": "Alice", "age": "30"})
print(user)
# 输出：{'name': 'Alice', 'age': 30}
```

这个函数的签名 `parse_user(data: dict) -> dict` 已经把「入参是个字典、返回也是个字典」这一契约写在了函数定义上。任何阅读这段代码的人（包括 IDE 和静态检查器）都能立刻理解函数的输入输出类型，而不必去通读函数体。

## 2. 核心内容

### 2.1 注解语法详解

注解语法分为三个位置：参数注解、默认值与注解共存、返回值注解。下面逐一说明。

**参数注解**

参数注解写在参数名之后、逗号之前，格式为 `参数名: 标注`。标注可以是任何表达式，但类型提示约定下通常是类型对象。

```python
def add(a: int, b: int) -> int:
    return a + b

print(add.__annotations__)
# 输出：{'a': <class 'int'>, 'b': <class 'int'>, 'return': <class 'int'>}
```

`__annotations__` 字典的键是参数名字符串，值是对应的标注对象。返回值注解用特殊的键 `'return'` 存放（因为 `return` 是关键字不能做参数名）。

**默认值与注解共存**

当参数同时有注解和默认值时，写法是 `参数名: 标注 = 默认值`，注解在前、默认值在后。这是初学者容易写反的地方：

```python
# 正确写法：注解在前，默认值在后
def format_price(price: float, currency: str = "CNY") -> str:
    return f"{price:.2f} {currency}"

print(format_price(99.5))
# 输出：99.50 CNY

print(format_price(99.5, "USD"))
# 输出：99.50 USD

print(format_price.__annotations__)
# 输出：{'price': <class 'float'>, 'currency': <class 'str'>, 'return': <class 'str'>}
```

注意 `currency: str = "CNY"` 这个写法：冒号后的 `str` 是注解，等号后的 `"CNY"` 是默认值。两者是独立的东西，注解描述「期望类型」，默认值描述「不传时的取值」。默认值的类型不必和注解一致（Python 不检查），但约定上应当一致。

如果用关键字参数调用，效果和普通默认参数一样：

```python
print(format_price(99.5, currency="EUR"))
# 输出：99.50 EUR
```

**返回值注解**

返回值注解写在参数列表的右括号之后、冒号之前，用 `->` 连接：

```python
def is_adult(age: int) -> bool:
    return age >= 18

print(is_adult(20))
# 输出：True

print(is_adult.__annotations__)
# 输出：{'age': <class 'int'>, 'return': <class 'bool'>}
```

`-> bool` 表示这个函数应该返回一个布尔值。同样地，这只是一个声明，函数体里就算返回 `None` 或字符串，运行时也不会报错：

```python
def is_adult(age: int) -> bool:
    return "yes"  # 类型不符，但运行时不报错

print(is_adult(20))
# 输出：yes
```

**无返回值的函数用 `-> None`**

当函数不返回有意义的值（比如只做打印、修改全局状态等），约定标注返回类型为 `None`：

```python
def log_message(msg: str) -> None:
    print(f"[LOG] {msg}")
    # 没有 return，或者 return None

log_message("system started")
# 输出：[LOG] system started

print(log_message.__annotations__)
# 输出：{'msg': <class 'str'>, 'return': <class 'NoneType'>}
```

`None` 在 `__annotations__` 里显示为 `NoneType`，因为注解求值时 `None` 这个名字指向的就是 `NoneType` 的唯一实例，而字典里存的是类型对象（注意这里存的是 `NoneType` 类型，因为 `None` 本身会被当作类型名求值——实际上 `-> None` 存的是 `type(None)` 即 `<class 'NoneType'>`）。

### 2.2 `__annotations__` 字典的访问

每个定义了注解的函数对象都有一个 `__annotations__` 属性，它是一个普通字典。你可以像访问任何字典一样访问它：

```python
def build_query(table: str, conditions: list, limit: int = 100) -> str:
    return f"SELECT * FROM {table} WHERE {' AND '.join(conditions)} LIMIT {limit}"

# 访问整个注解字典
print(build_query.__annotations__)
# 输出：{'table': <class 'str'>, 'conditions': <class 'list'>, 'limit': <class 'int'>, 'return': <class 'str'>}

# 访问单个参数的注解
print(build_query.__annotations__["table"])
# 输出：<class 'str'>

# 访问返回值注解
print(build_query.__annotations__["return"])
# 输出：<class 'str'>

# 没有 return 注解时，字典里就没有 'return' 键
def no_return_annotation(x: int):
    pass

print(no_return_annotation.__annotations__)
# 输出：{'x': <class 'int'>}
```

注意第三点：如果你不写 `-> ...`，`__annotations__` 里就不会有 `'return'` 键。同理，没写注解的参数也不会出现在字典里：

```python
def mixed(a: int, b, c: str = "x"):
    pass

print(mixed.__annotations__)
# 输出：{'a': <class 'int'>, 'c': <class 'str'>}
```

`b` 没有注解，所以不在字典里。这意味着注解是「可选的」——你可以只给部分参数加注解，这是完全合法的。

**注解是函数对象的属性，而非类的属性**

注解存在函数对象上，不是存在类上。对于模块级函数，直接访问 `函数名.__annotations__` 即可。对于类的方法，注解存在方法函数对象上：

```python
class UserService:
    def find(self, user_id: int) -> dict:
        return {"id": user_id}

# 方法函数本身的注解
print(UserService.find.__annotations__)
# 输出：{'user_id': <class 'int'>, 'return': <class 'dict'>}

# 通过实例访问绑定方法的 __func__ 也是同一个函数
service = UserService()
print(service.find.__func__.__annotations__)
# 输出：{'user_id': <class 'int'>, 'return': <class 'dict'>}
```

### 2.3 常用内置类型作为注解

类型提示最基础的用法，就是直接用 Python 的内置类型作为注解。这些类型本身不需要导入，拿来即用。

**基本类型：int / float / str / bool**

```python
def compute_score(correct: int, total: int) -> float:
    return correct / total * 100 if total else 0.0

def is_enabled(flag: bool) -> bool:
    return flag

def normalize_name(name: str) -> str:
    return name.strip().lower()

print(compute_score.__annotations__)
# 输出：{'correct': <class 'int'>, 'total': <class 'int'>, 'return': <class 'float'>}

print(normalize_name("  Hello World  "))
# 输出：hello world
```

**容器类型：list / dict / tuple / set**

从 Python 3.9 开始，内置容器类型（`list`、`dict`、`tuple`、`set`）可以直接用下标语法表示「容器里的元素类型」：

```python
# Python 3.9+ 内置泛型
def sum_scores(scores: list[int]) -> int:
    return sum(scores)

def count_by_tag(items: list[str]) -> dict[str, int]:
    result: dict[str, int] = {}
    for item in items:
        result[item] = result.get(item, 0) + 1
    return result

def first_last(items: list[int]) -> tuple[int, int]:
    return items[0], items[-1] if items else (0, 0)

def unique_tags(tags: set[str]) -> list[str]:
    return sorted(tags)

print(sum_scores([90, 85, 95]))
# 输出：270

print(count_by_tag(["a", "b", "a", "c", "b", "a"]))
# 输出：{'a': 3, 'b': 2, 'c': 1}
```

这里需要区分两个版本：

- **Python 3.9 之前**：内置容器不能用下标语法做类型提示，必须从 `typing` 模块导入大写版本（`List`、`Dict`、`Tuple`、`Set`）。
- **Python 3.9 及之后**：内置容器（小写 `list`、`dict` 等）直接支持下标语法，大写版本的 `typing.List` 等已标记为弃用。

```python
# 兼容 3.9 之前的写法（3.9+ 仍然可用，只是多了导入）
from typing import List, Dict, Tuple, Set

def old_sum_scores(scores: List[int]) -> int:
    return sum(scores)

def old_count_by_tag(items: List[str]) -> Dict[str, int]:
    result: Dict[str, int] = {}
    for item in items:
        result[item] = result.get(item, 0) + 1
    return result

# 3.9+ 推荐写法：直接用内置类型
def new_sum_scores(scores: list[int]) -> int:
    return sum(scores)
```

**元组的特殊用法**

`tuple` 的下标写法有两种含义：

```python
# 固定长度、固定类型的元组
def point() -> tuple[float, float]:
    return (3.14, 2.71)

# 任意长度的同类型元组（用 ... 表示）
def to_tuple(items: list[int]) -> tuple[int, ...]:
    return tuple(items)

p = point()
print(p)
# 输出：(3.14, 2.71)

print(to_tuple([1, 2, 3]))
# 输出：(1, 2, 3)
```

`tuple[float, float]` 表示「一个恰好两个 float 的元组」，`tuple[int, ...]` 表示「一个元素都是 int 的任意长度元组」。`...`（三个点）在这里是「省略其余」的意思。

### 2.4 typing 模块常用品

光靠内置类型不足以表达所有类型约束。比如「一个可能是 None 的整数」「一个能接收两个 int 返回 bool 的可调用对象」——这些需要 `typing` 模块提供的类型构造工具。下面逐一介绍最常用的几个。

**Optional：可空类型**

`Optional[X]` 表示「类型是 X，或者 None」。等价于 `Union[X, None]`。它的典型场景是函数某个参数可以不传（传 None）、返回值可能为空。

```python
from typing import Optional

def find_user(user_id: int) -> Optional[dict]:
    """根据 ID 查找用户，找不到返回 None。"""
    users = {1: {"name": "Alice"}, 2: {"name": "Bob"}}
    return users.get(user_id)

result = find_user(1)
print(result)
# 输出：{'name': 'Alice'}

result = find_user(999)
print(result)
# 输出：None
```

这段代码里，`find_user` 的返回类型是 `Optional[dict]`，明确告诉调用方：返回值可能是个字典，也可能是 `None`，你必须处理这两种情况。如果不标注 `Optional`，只写 `-> dict`，调用方很可能假设永远有值，从而在找不到时触发 `AttributeError`。

从 Python 3.10 开始，`Optional[X]` 可以用更简洁的 `X | None` 写法：

```python
# Python 3.10+ 写法
def find_user_new(user_id: int) -> dict | None:
    users = {1: {"name": "Alice"}, 2: {"name": "Bob"}}
    return users.get(user_id)

print(find_user_new(2))
# 输出：{'name': 'Bob'}
```

`dict | None` 和 `Optional[dict]` 语义完全等价，只是写法更紧凑。3.9 及以下版本不支持这种 `|` 语法（除非用 `from __future__ import annotations`，后面会讲）。

**Union：多个类型之一**

`Union[X, Y]` 表示「类型是 X 或 Y 之一」。当你一个参数能接受几种不相关的类型时用它。

```python
from typing import Union

def process_id(user_id: Union[int, str]) -> str:
    """user_id 可以是整数 ID 也可以是字符串 ID，统一转成字符串。"""
    return f"USER-{user_id}"

print(process_id(1001))
# 输出：USER-1001

print(process_id("VIP-2002"))
# 输出：USER-VIP-2002
```

从 Python 3.10 开始，`Union[X, Y]` 可以写成 `X | Y`：

```python
# Python 3.10+ 写法
def process_id_new(user_id: int | str) -> str:
    return f"USER-{user_id}"

print(process_id_new(1001))
# 输出：USER-1001
```

`Union` 可以接受任意多个类型：`Union[int, str, float, None]`。当其中包含 `None` 时，就等价于 `Optional[Union[int, str, float]]`。

**List / Dict / Tuple / Set（3.9 之前的大写版本）**

前面已经提到，3.9 之前用 `typing.List` 等大写版本，3.9 之后推荐用内置 `list` 等小写版本。这里再补一个完整对比：

```python
from typing import List, Dict, Tuple, Set

# 旧写法（3.8 及以下必须这样）
def old_style(names: List[str], mapping: Dict[str, int], pair: Tuple[int, str], tags: Set[str]) -> None:
    pass

# 新写法（3.9+ 推荐）
def new_style(names: list[str], mapping: dict[str, int], pair: tuple[int, str], tags: set[str]) -> None:
    pass
```

两种写法在运行时存入 `__annotations__` 的对象不同（旧写法存的是 `typing.List` 的实例，新写法存的是 `list[int]` 这种内置泛型别名），但对静态检查器和 IDE 来说语义一致。

**Any：任意类型**

`Any` 表示「任意类型」，相当于关闭类型检查。当你确实无法或不想约束类型时用它，但它是一把双刃剑——用了 `Any` 就等于在这个位置上放弃了类型提示带来的安全性。

```python
from typing import Any

def print_anything(value: Any) -> None:
    """打印任意值，不做类型约束。"""
    print(value)

print_anything(42)
# 输出：42

print_anything("hello")
# 输出：hello

print_anything([1, 2, 3])
# 输出：[1, 2, 3]
```

`Any` 与 `object` 的区别值得注意：`object` 是所有类型的基类，它表示「任何类型都可以」，但类型检查器会限制你对 `object` 类型的变量调用方法（因为 `object` 本身没有多少方法）；而 `Any` 则完全不做限制，你可以对 `Any` 类型的变量调用任何方法、赋值给任何类型的变量，类型检查器都不会报错。

```python
from typing import Any

def risky(value: Any) -> None:
    # Any 类型可以调用任何方法，检查器不拦截
    value.nonexistent_method()  # mypy 不会报错

def safe(value: object) -> None:
    # object 类型不能随意调用方法
    value.nonexistent_method()  # mypy 会报错：object 没有 nonexist_ent_method
```

实际使用中，应优先用 `object`（表示「任何类型但约束其使用」），只有在确实需要「完全不受约束」时才用 `Any`。

**Callable：可调用对象类型**

`Callable` 用于描述「函数、lambda、实现了 `__call__` 的类实例」这类可调用对象的类型签名。它的写法是 `Callable[[参数类型列表], 返回类型]`。

```python
from typing import Callable

def apply_callback(callback: Callable[[int, int], int], a: int, b: int) -> int:
    """接收一个回调函数，对 a 和 b 执行回调并返回结果。"""
    return callback(a, b)

# 回调：加法
def add(x: int, y: int) -> int:
    return x + y

# 回调：乘法
def multiply(x: int, y: int) -> int:
    return x * y

print(apply_callback(add, 3, 4))
# 输出：7

print(apply_callback(multiply, 3, 4))
# 输出：12

# lambda 也行
print(apply_callback(lambda x, y: x - y, 10, 3))
# 输出：7
```

这里 `callback: Callable[[int, int], int]` 表示：`callback` 是一个可调用对象，它接收两个 int 参数、返回一个 int。这种标注让回调的契约非常清晰——阅读代码的人立刻知道该传什么样的函数。

如果可调用对象的参数列表不定，可以用 `Callable[..., int]` 表示「接收任意参数、返回 int」：

```python
from typing import Callable

def run(fn: Callable[..., int]) -> int:
    return fn()

print(run(lambda: 42))
# 输出：42
```

`...` 在 `Callable` 里的含义是「参数列表不关心」，和 `tuple[int, ...]` 里的 `...` 含义不同（后者是「更多同类元素」）。

**TypeVar：类型变量**

`TypeVar` 用于定义「泛型函数」——让多个位置的类型保持一致。比如一个「返回列表第一个元素」的函数，输入是 `list[int]` 时返回 `int`，输入是 `list[str]` 时返回 `str`。用 `TypeVar` 可以表达这种关联。

```python
from typing import TypeVar

T = TypeVar("T")

def first(items: list[T]) -> T:
    """返回列表第一个元素，元素类型与列表元素类型一致。"""
    return items[0]

print(first([1, 2, 3]))
# 输出：1

print(first(["a", "b", "c"]))
# 输出：a

print(first([3.14, 2.71]))
# 输出：3.14
```

注意 `T = TypeVar("T")` 声明了一个类型变量 `T`，然后 `list[T] -> T` 表示「返回值的类型等于列表元素的类型」。这样当你传 `list[int]` 时，静态检查器知道返回值是 `int`，而不是笼统的「某个类型」。

`TypeVar` 可以带有约束，限定类型变量的取值范围：

```python
from typing import TypeVar

# 约束 T 只能是 str 或 bytes
T = TypeVar("T", str, bytes)

def longest(a: T, b: T) -> T:
    """返回两个同类型值中较长的一个。"""
    return a if len(a) >= len(b) else b

print(longest("apple", "banana"))
# 输出：banana

print(longest(b"hello", b"hi"))
# 输出：b'hello'

# 传 int 会报类型错误（静态检查层面）
# longest(1, 2)  # mypy: error
```

`TypeVar("T", str, bytes)` 表示 `T` 只能是 `str` 或 `bytes` 且两个参数的类型必须相同。这是一种「类型约束」机制，比 `Union[str, bytes]` 更强——后者允许 `a` 是 str、`b` 是 bytes，前者要求两者一致。

### 2.5 一个完整业务函数的注解示例

把前面学到的组合起来，注解一个接近真实业务的用户解析函数：

```python
from typing import Optional, Union, Callable

# 用户数据结构
class User:
    def __init__(self, name: str, age: int, email: Optional[str] = None) -> None:
        self.name = name
        self.age = age
        self.email = email

    def __repr__(self) -> str:
        return f"User(name={self.name!r}, age={self.age}, email={self.email!r})"

# 解析回调：接收 User，返回处理后的标识字符串
def default_postprocess(user: User) -> str:
    return f"[OK] {user.name}"

def parse_user(
    data: dict,
    postprocess: Callable[[User], str] = default_postprocess,
    default_age: Union[int, str] = 0,
) -> Optional[User]:
    """
    从字典解析出 User 对象。

    data:         原始数据，需包含 name 字段，age 可选。
    postprocess:  解析完成后的回调，接收 User 返回字符串。
    default_age:  age 缺失时的默认值，可以是 int 也可以是字符串数字。
    返回:         User 对象，若 data 为空或缺少 name 则返回 None。
    """
    if not data or "name" not in data:
        return None

    age = int(data.get("age", default_age))
    email = data.get("email")  # 可能为 None
    user = User(name=data["name"], age=age, email=email)

    # 调用后处理回调
    tag = postprocess(user)
    print(f"解析完成: {tag}")
    return user

# 场景一：正常解析
user1 = parse_user({"name": "Alice", "age": "30", "email": "alice@example.com"})
# 输出：解析完成: [OK] Alice
print(user1)
# 输出：User(name='Alice', age=30, email='alice@example.com')

# 场景二：缺少 age，使用默认值
user2 = parse_user({"name": "Bob"})
# 输出：解析完成: [OK] Bob
print(user2)
# 输出：User(name='Bob', age=0, email=None)

# 场景三：空数据，返回 None
user3 = parse_user({})
print(user3)
# 输出：None

# 场景四：自定义回调
def admin_postprocess(user: User) -> str:
    return f"[ADMIN] {user.name}"

user4 = parse_user({"name": "Carol", "age": 28}, postprocess=admin_postprocess)
# 输出：解析完成: [ADMIN] Carol
print(user4)
# 输出：User(name='Carol', age=28, email=None)
```

这个例子整合了 `Optional`（可空返回）、`Union`（多种默认值类型）、`Callable`（回调类型）、默认值与注解共存（`postprocess` 和 `default_age`）、`-> None`（`User.__init__` 的返回类型）。通过签名就能读出这个函数的全部契约，这就是类型提示的核心价值。

### 2.6 返回类型 `list[int]`（3.9+ 内置泛型）与 `Optional[int]`

再单独把几个容易混淆的返回类型拎出来讲清楚。

**`list[int]` 表示返回一个元素都是 int 的列表**

```python
def get_even(numbers: list[int]) -> list[int]:
    return [n for n in numbers if n % 2 == 0]

print(get_even([1, 2, 3, 4, 5, 6]))
# 输出：[2, 4, 6]
```

**`dict[str, int]` 表示键是 str、值是 int 的字典**

```python
def word_counts(text: str) -> dict[str, int]:
    counts: dict[str, int] = {}
    for word in text.split():
        counts[word] = counts.get(word, 0) + 1
    return counts

print(word_counts("the quick brown fox the lazy dog the fox"))
# 输出：{'the': 3, 'quick': 1, 'brown': 1, 'fox': 2, 'lazy': 1, 'dog': 1}
```

**`Optional[int]` 表示返回 int 或 None**

```python
from typing import Optional

def first_even(numbers: list[int]) -> Optional[int]:
    for n in numbers:
        if n % 2 == 0:
            return n
    return None  # 没有偶数时返回 None

print(first_even([1, 3, 4, 5]))
# 输出：4

print(first_even([1, 3, 5]))
# 输出：None
```

调用 `first_even` 后，类型检查器会要求你先判断返回值是否为 `None` 再使用：

```python
result = first_even([1, 3, 5])
# 直接用 result + 1 会触发 mypy 报错，因为 result 可能是 None
if result is not None:
    print(result + 1)
else:
    print("没有偶数")
# 输出：没有偶数
```

### 2.7 typing.get_type_hints() 解析字符串注解

有时候你会看到注解写成字符串形式——也就是在注解位置写一个带引号的类型名，而不是直接写类型对象：

```python
def ratio(numerator: "int", denominator: "int") -> "float":
    return numerator / denominator if denominator else 0.0

print(ratio.__annotations__)
# 输出：{'numerator': 'int', 'denominator': 'int', 'return': 'float'}
```

注意这里的 `__annotations__` 里存的是字符串 `'int'`，而不是 `<class 'int'>`。这种写法叫做「字符串注解」或「前向引用」（forward reference），主要用于解决「类型还没定义就要引用它」的问题：

```python
class TreeNode:
    def add_child(self, child: "TreeNode") -> None:  #TreeNode 在此处还没定义完
        self.children.append(child)

    def __init__(self) -> None:
        self.children: list["TreeNode"] = []

print(TreeNode.add_child.__annotations__)
# 输出：{'child': 'TreeNode', 'return': <class 'NoneType'>}
```

`add_child` 方法注解 `child` 为 `"TreeNode"`，但 `TreeNode` 类此时还没定义完（正处在类体内部）。如果不用引号写成 `child: TreeNode`，会触发 `NameError`，因为 `TreeNode` 还不存在。用字符串 `"TreeNode"` 就避免了这个问题——注解不求值，只存字符串。

但字符串注解存的是字符串，静态检查器虽然能识别（mypy 会自行解析字符串内容），但运行时如果你想拿到真正的类型对象，就需要用 `typing.get_type_hints()` 来解析：

```python
import typing

def ratio(numerator: "int", denominator: "int") -> "float":
    return numerator / denominator if denominator else 0.0

# __annotations__ 里是字符串
print(ratio.__annotations__)
# 输出：{'numerator': 'int', 'denominator': 'int', 'return': 'float'}

# get_type_hints 会把字符串解析成真正的类型对象
print(typing.get_type_hints(ratio))
# 输出：{'numerator': <class 'int'>, 'denominator': <class 'int'>, 'return': <class 'float'>}
```

`get_type_hints()` 在运行时根据函数所在作用域把字符串注解求值成真正的类型对象。它接收一个函数对象（或模块、类），返回一个字典，字典的值是求值后的类型。

对于前向引用的类，`get_type_hints` 同样能解析：

```python
import typing

class TreeNode:
    def add_child(self, child: "TreeNode") -> None:
        pass

# 原始注解
print(TreeNode.add_child.__annotations__)
# 输出：{'child': 'TreeNode', 'return': <class 'NoneType'>}

# 解析后的注解
print(typing.get_type_hints(TreeNode.add_child))
# 输出：{'child': <class '__main__.TreeNode'>, 'return': <class 'NoneType'>}
```

解析后 `'TreeNode'` 变成了真正的 `TreeNode` 类对象。`get_type_hints` 的价值正在于此：它让你能在运行时获得「真正可操作的类型」，而不只是一段字符串。

### 2.8 mypy 静态类型检查示例

类型提示的价值只有在配合静态检查工具时才能完全体现。mypy 是最常用的 Python 静态类型检查器，它读取你的类型注解，在不运行代码的情况下检查类型是否匹配。

**安装与基本用法**

```bash
pip install mypy
mypy your_script.py
```

**类型正确的例子**

把以下代码存为 `correct.py`：

```python
# correct.py
from typing import Optional

def find_user(user_id: int) -> Optional[dict]:
    users = {1: {"name": "Alice"}}
    return users.get(user_id)

result = find_user(1)
if result is not None:
    print(result["name"])
```

运行 `mypy correct.py`：

```bash
$ mypy correct.py
Success: no issues found in 1 source file
```

mypy 没有报错，说明类型注解与实际用法一致。

**类型错误的例子**

把以下代码存为 `wrong.py`：

```python
# wrong.py
from typing import Optional

def find_user(user_id: int) -> Optional[dict]:
    users = {1: {"name": "Alice"}}
    return users.get(user_id)

# 错误一：传字符串给期望 int 的参数
result = find_user("1")

# 错误二：返回值可能是 None，却直接访问键
print(find_user(999)["name"])
```

运行 `mypy wrong.py`：

```bash
$ mypy wrong.py
wrong.py:8: error: Argument 1 to "find_user" has incompatible type "str"; expected "int"  [arg-type]
wrong.py:11: error: Value of type "Optional[dict]" is not indexable  [index]
Found 2 errors in 1 file (checked 1 source file)
```

mypy 报了两处错误：

1. 第 8 行：`find_user("1")` 传了字符串 `"1"`，但函数签名要求 `int`，类型不匹配。
2. 第 11 行：`find_user(999)` 的返回类型是 `Optional[dict]`（可能是 None），直接用 `["name"]` 索引会在为 None 时崩溃，mypy 要求先判断是否为 None。

这就是类型提示 + 静态检查的核心收益：**在你运行代码之前，mypy 就能帮你揪出潜在的类型 bug**。对于一个大型项目，这种事前检查能省下大量调试时间。

**Callable 类型的检查**

```python
# callback_check.py
from typing import Callable

def apply(callback: Callable[[int], int], value: int) -> int:
    return callback(value)

# 正确：接收 int 返回 int
def double(x: int) -> int:
    return x * 2

print(apply(double, 5))
# 输出：10

# 错误：接收 str 返回 str，签名不匹配
def stringify(x: str) -> str:
    return str(x)

print(apply(stringify, 5))  # mypy 报错
```

运行 `mypy callback_check.py`：

```bash
$ mypy callback_check.py
callback_check.py:15: error: Argument 1 to "apply" has incompatible type "Callable[[str], str]"; expected "Callable[[int], int]"  [arg-type]
Found 1 error in 1 file (checked 1 source file)
```

mypy 识别出 `stringify` 的签名（`str -> str`）和 `apply` 期望的签名（`int -> int`）不兼容，提前报错。

### 2.9 IDE 补全与文档价值

类型提示除了配合 mypy 做静态检查，还能显著提升 IDE 的代码补全体验。以 PyCharm、VS Code（Pylance）为例，当你调用一个有类型提示的函数时，IDE 会：

- 在调用处展示参数的类型信息。
- 对返回值提供基于类型的方法补全。
- 标记类型不匹配的实参。

```python
from typing import Optional

class User:
    def __init__(self, name: str, age: int) -> None:
        self.name = name
        self.age = age

    def greet(self) -> str:
        return f"Hi, I'm {self.name}"

def find_user(user_id: int) -> Optional[User]:
    users = {1: User("Alice", 30)}
    return users.get(user_id)

user = find_user(1)
if user is not None:
    # 此处 IDE 知道 user 是 User 类型，会补全 name/age/greet
    print(user.greet())
    # 输出：Hi, I'm Alice
```

在 IDE 里，当你输入 `user.` 时，会自动建议 `name`、`age`、`greet()`——因为返回类型标注为 `Optional[User]`，经过 `if user is not None` 收窄后，IDE 确认 `user` 是 `User` 类型，从而提供精准补全。如果没有类型提示，IDE 只能通过启发式猜测，补全准确性会下降。

类型提示作为「可执行的文档」也有独特价值：普通注释会随着代码修改而过时，但类型注解和函数签名绑定，改了签名就要改注解，mypy 还会强制你保持一致。因此类型注解比注释更可靠地反映函数的真实契约。

## 3. 最佳实践

**注解描述期望类型，而非任意元数据**

PEP 3107 允许注解是任意对象，但在现代 Python 中，注解默认就是「类型提示」。不要在注解位置放除类型以外的其他东西（如描述字符串、范围限制），这会让静态检查器和 IDE 困惑。如果你需要附带额外元数据，考虑用 `Annotated` 类型（Python 3.9+ 的 `typing.Annotated`）：

```python
# 推荐：注解只表达类型
def set_age(user: dict, age: int) -> None:
    user["age"] = age

# 不推荐：用注解塞业务描述（PEP 3107 允许，但破坏了类型提示约定）
# def set_age(user: "a dict with 'name' key", age: "positive int") -> None:
#     user["age"] = age
```

**用 Optional 明确表达可空语义**

一个函数可能返回 `None` 时，务必标注 `Optional[X]`（或 `X | None`），而不是只写 `X`。前者强迫调用方处理 None 情况，后者会让调用方误以为永远有返回值。

```python
# 推荐
def find_user(user_id: int) -> Optional[dict]:
    ...

# 不推荐
def find_user(user_id: int) -> dict:
    ...  # 实际可能返回 None，但类型说一定有 dict，调用方不会判断 None
```

**避免滥用 Any**

`Any` 等于关闭类型检查，应尽量少用。如果实在想表达「任意类型但约束使用」，用 `object`；如果知道是某几种类型之一，用 `Union`。只有当 `Any` 确实无法避免（比如对接无类型签名的第三方库）时才使用，并配注释说明原因。

```python
# 不推荐
def process(data: Any) -> Any:
    ...

# 推荐：尽量收窄
def process(data: Union[dict, list]) -> str:
    ...
```

**默认值的类型要和注解一致**

虽然运行时不检查，但约定上默认值应该符合注解类型。否则会让阅读者困惑，也容易被 mypy 抓住。

```python
# 推荐：默认值类型和注解一致
def repeat(text: str, times: int = 1) -> str:
    return text * times

# 不推荐：默认值是 None，注解是 int，自相矛盾
# def repeat(text: str, times: int = None) -> str:
#     return text * (times or 0)
```

如果默认值想用 `None` 表示「不传」，注解应该用 `Optional[int]`：

```python
from typing import Optional

def repeat(text: str, times: Optional[int] = None) -> str:
    if times is None:
        return text
    return text * times

print(repeat("hi"))
# 输出：hi

print(repeat("hi", 3))
# 输出：hihihi
```

**3.9+ 优先用内置泛型，避免 typing.List 等**

3.9 之后 `list[int]`、`dict[str, int]` 等内置泛型可直接使用，不需要从 `typing` 导入大写版本。除非要兼容 3.8 及更早版本，否则推荐用内置写法，更简洁也更符合未来方向。

```python
# 3.9+ 推荐
def sum_scores(scores: list[int]) -> int:
    return sum(scores)

# 3.8 及更早必须用 typing
# from typing import List
# def sum_scores(scores: List[int]) -> int:
#     return sum(scores)
```

**需向前引用时用字符串注解或 `from __future__ import annotations`**

当类型在定义时还不存在（如类内部引用自身、两个类互相引用），需要用字符串注解避免 `NameError`。在 Python 3.7+，更推荐用 `from __future__ import annotations` 把整个文件的注解都变成字符串，从而可以自由地写前向引用：

```python
# 方式一：逐处用字符串
class Node:
    def set_next(self, next_node: "Node | None") -> None:
        ...

# 方式二：文件顶部开启延迟注解（更推荐）
from __future__ import annotations

class Node:
    def set_next(self, next_node: Node | None) -> None:  # 即便 Node 还没定义完也不会报错
        ...
```

两种方式都能静态检查器正常工作，方式二写起来更自然，不需要处处记得加引号。

****annotations** 只用于读取，不要用来做运行时检查**

`__annotations__` 是一个普通字典，你可以读它，但不要在自己的代码里读 `__annotations__` 来做运行时类型检查——这种工作应该交给 mypy 等静态工具。运行时检查类型用 `isinstance`，而不是去查注解。注解是给工具读的，不是给运行时用的。

## 4. 原理

### 4.1 注解在编译/定义期求值并存入函数对象

要理解注解的运作方式，关键是弄清「注解什么时候被求值」。答案是在函数定义执行时——也就是解释器执行到 `def` 语句那一刻。

当你写下：

```python
def add(a: int, b: int) -> int:
    return a + b
```

Python 在执行这条 `def` 语句时，会依次做以下几件事：

1. 对每个注解表达式求值。`int` 被求值为 `int` 类对象，`-> int` 中的 `int` 也被求值。
2. 创建函数对象，把函数体编译成 code 对象挂到函数上。
3. 把求值后的注解组装成一个字典，存到函数对象的 `__annotations__` 属性。

也就是说，**注解的求值发生在函数定义时，而不是函数调用时**。每次调用 `add(1, 2)` 都不会重新去求值注解——注解早就求好并存在 `__annotations__` 里了。

一个验证：

```python
print("定义前")

def f(x: int) -> str:
    return str(x)

print("定义后")
print(f.__annotations__)
# 输出：{'x': <class 'int'>, 'return': <class 'str'>}
```

如果在注解位置放一个有副作用的表达式，你会看到它只在定义时执行一次：

```python
def trace(name):
    print(f"求值注解: {name}")
    return name

def demo(a: trace("int")) -> trace("str"):
    return str(a)

# 输出：求值注解: int
#       求值注解: str
# （上面两行在函数定义时就已经打印，不需要调用 demo）

print("---定义完成---")

demo(123)
# 注意：这里不会再次打印「求值注解」，说明注解只求值一次

print(demo.__annotations__)
# 输出：{'a': 'int', 'return': 'str'}
```

可以看到，`trace("int")` 和 `trace("str")` 在函数定义时各执行了一次，之后调用 `demo(123)` 不会再触发。这正说明注解是「定义期」求值的。

### 4.2 Python 运行时完全不使用注解做检查

这是理解注解最重要的一点：**注解只是元数据，Python 运行时完全不读 `__annotations__` 来做类型检查**。解释器把注解存起来之后就不管了——它不会在调用函数时核对实参类型，也不会在返回时核对返回值类型。

```python
def add(a: int, b: int) -> int:
    return a + b

# 传字符串照样能跑，运行时不拦截
print(add("hello", " world"))
# 输出：hello world
```

`add` 注解要求两个 int，但你传两个 str，运行时毫无阻拦——因为字符串相加 `"hello" + " world"` 本身是合法的 Python 操作，运行时只关心操作是否合法，不关心类型是否匹配注解。

这也意味着注解几乎不影响运行性能：注解在定义时求值一次，之后调用函数时完全不被读取。你可以把一个加了注解的函数和一个没加注解的函数放在一起对比，调用开销是一样的。

那注解的价值在哪里？在于**工具链**：mypy、pyright 等静态检查器在「不运行代码」的前提下，通过读注解来分析类型一致性；IDE 通过读注解来提供补全和提示。这些工作都发生在「代码编写阶段」或「CI 检查阶段」，而不是「运行阶段」。

### 4.3 字符串注解与前向引用

有时注解里的类型在函数定义时还不存在。最典型的场景是「类内部引用类自身」：

```python
class TreeNode:
    def add_child(self, child: TreeNode) -> None:  # 此刻 TreeNode 还没定义完
        ...
```

如果直接写 `child: TreeNode`，解释器在执行到这条 `def` 时会去查找 `TreeNode` 这个名字，但 `TreeNode` 类的定义还没结束（正处在类体内），此时 `TreeNode` 还没被绑定到任何对象，于是触发 `NameError`：

```python
class TreeNode:
    def add_child(self, child: TreeNode) -> None:
        pass
# NameError: name 'TreeNode' is not defined
```

解决方法是把注解写成字符串：

```python
class TreeNode:
    def add_child(self, child: "TreeNode") -> None:
        pass
```

写成字符串后，解释器在定义时不会去求值 `"TreeNode"`（它就是一个字符串字面量），只是把它原样存进 `__annotations__`。真正的类型解析推迟到「有人主动调用 `typing.get_type_hints()`」时，那时 `TreeNode` 类早已定义完毕，就能正确求值了。

这种「用字符串避免定义期求值」的写法叫「前向引用」（forward reference）。它的本质是**延迟求值**——把注解的求值时机从「定义期」推迟到「需要时」。静态检查器（mypy 等）都能自行解析字符串注解，所以前向引用对静态检查没有影响。

### 4.4 typing.get_type_hints() 的延迟求值机制

`typing.get_type_hints(func)` 的工作原理是：取到 `func.__annotations__` 里的字符串注解，然后在 `func` 所在模块的全局命名空间里对这些字符串做 `eval`，得到真正的类型对象。

```python
import typing

def demo(x: "int", y: "str") -> "bool":
    return bool(x) and bool(y)

# __annotations__ 存的是字符串
print(demo.__annotations__)
# 输出：{'x': 'int', 'y': 'str', 'return': 'bool'}

# get_type_hints 用 eval 把字符串解析成类型对象
print(typing.get_type_hints(demo))
# 输出：{'x': <class 'int'>, 'y': <class 'str'>, 'return': <class 'bool'>}
```

`get_type_hints` 内部大致等价于：

```python
def get_type_hints(func):
    hints = {}
    for name, value in func.__annotations__.items():
        if isinstance(value, str):
            # 在 func 所在模块的全局命名空间中 eval 这个字符串
            hints[name] = eval(value, func.__globals__)
        else:
            hints[name] = value
    return hints
```

（实际实现更复杂，会处理嵌套类型、递归引用、`None` 的特殊处理等，但核心是「在正确的作用域里 eval 字符串」。）

这也是为什么前向引用能工作：`get_type_hints` 在类已经定义完毕之后被调用，此时 `TreeNode` 已经在模块命名空间里，`eval("TreeNode")` 就能找到它。

一个前向引用结合 `get_type_hints` 的完整例子：

```python
import typing

class LinkedList:
    def __init__(self, value: int, next_node: "LinkedList | None" = None) -> None:
        self.value = value
        self.next_node = next_node

# 注解里是字符串
print(LinkedList.__init__.__annotations__)
# 输出：{'value': <class 'int'>, 'next_node': 'LinkedList | None', 'return': <class 'NoneType'>}

# 解析之后
print(typing.get_type_hints(LinkedList.__init__))
# 输出：{'value': <class 'int'>, 'next_node': typing.Optional[LinkedList], 'return': <class 'NoneType'>}
```

注意 `get_type_hints` 还把 `'LinkedList | None'` 自动转成了 `typing.Optional[LinkedList]`——因为它内部能识别 `X | None` 这种 3.10 语法，即便你不在 3.10 上跑，只要注解是字符串形式，`get_type_hints` 也能正确解析。

### 4.5 from **future** import annotations 的作用

Python 3.7（PEP 563）引入了一个特性：`from __future__ import annotations`。在文件顶部加上这行后，该文件内所有注解都**不求值**，原样作为字符串存入 `__annotations__`。

```python
from __future__ import annotations

def add(a: int, b: int) -> int:
    return a + b

print(add.__annotations__)
# 输出：{'a': 'int', 'b': 'int', 'return': 'int'}
```

注意对比：没有 `from __future__ import annotations` 时，`__annotations__` 里是 `{'a': <class 'int'>, ...}`（类型对象）；加上之后，`__annotations__` 里是 `{'a': 'int', ...}`（字符串）。

这个机制的好处是：

- **前向引用可以不用加引号**：所有注解天然都是字符串，不用手动写 `"TreeNode"`，直接写 `TreeNode` 就行，不会有 `NameError`。
- **减少启动开销**：复杂注解（如 `Dict[str, List[int]]`）在定义时无需构建对象，只存字符串，启动更快。
- **解耦类型与运行时**：当类型提示只用于静态检查而与运行无关时，延迟求值避免了不必要的对象创建。

但也要注意代价：既然注解都被存成字符串，运行时如果你要拿到真正的类型对象，就必须显式调用 `typing.get_type_hints()`。直接读 `__annotations__` 只会得到字符串。

```python
from __future__ import annotations

from typing import Optional

class Node:
    def set_next(self, next_node: Optional[Node] = None) -> None:
        self.next_node = next_node

# 直接读 __annotations__，得到字符串
print(Node.set_next.__annotations__)
# 输出：{'next_node': 'Optional[Node]', 'return': 'None'}

# 用 get_type_hints 才能得到类型对象
import typing
print(typing.get_type_hints(Node.set_next))
# 输出：{'next_node': typing.Optional[__main__.Node], 'return': <class 'NoneType'>}
```

原本需要担心时机的「`Optional[Node]` 中的 `Node` 还没定义」问题，在 `from __future__ import annotations` 下自动消失——因为注解根本不求值，`Node` 有没有定义都无所谓。

原计划 Python 3.10 会把「注解默认不求值」作为标准行为（PEP 563），但社区担忧这会破坏一些运行时依赖注解的库（如 FastAPI、Pydantic），于是推迟了默认切换（PEP 649 提出了更平滑的方案，即「延迟求值但能拿到真实对象」）。所以目前（截至 3.12）默认行为仍然是「定义时求值」，要用字符串形式仍需显式写 `from __future__ import annotations`。

### 4.6 注解存储的具体形态

`__annotations__` 字典在 CPython 里的实际存储，从 Python 3.10 起有一个细节变化值得提一下：在这之前，函数的 `__annotations__` 是函数对象的一个内置字段（直接存在函数对象内存里，访问很快）；从 3.10 开始，为了配合 PEP 563 的延迟求值方向，CPython 将 `__annotations__` 改为「按需生成」——当你第一次访问 `func.__annotations__` 时，解释器才从字节码里保存的原始注解信息组装出这个字典。

这对普通使用没有影响，但解释了一点：在 3.10+ 上，如果你从来不访问 `__annotations__`，这个字典就不会被组装，节省了一点点内存。这也是注解「纯元数据、不影响运行」这一设计哲学的体现。

## 5. 总结

### 5.1 本文内容要点

- **函数注解（PEP 3107）** 是 Python 3.0 引入的语法，允许在参数和返回值上附加任意标注，标注会被存入函数的 `__annotations__` 字典。Python 默认不对注解做任何检查或强制，注解只是元数据。
- **类型提示（PEP 484）** 是注解的一种约定用法，约定用类型对象作为标注，配合 mypy 等静态检查器和 IDE 实现类型安全。
- **注解语法**：参数注解 `a: int`、默认值与注解共存 `b: str = "x"`、返回值注解 `-> bool`、无返回 `-> None`。
- **`__annotations__` 字典** 以参数名为键、标注对象为值，返回值用 `'return'` 键，可直接读取但不要用于运行时检查。
- **内置类型注解**：`int`、`str`、`float`、`bool` 可直接使用；`list`、`dict`、`tuple`、`set` 在 3.9+ 支持下标语法（`list[int]`、`dict[str, int]`），3.9 之前需用 `typing.List` 等大写版本。
- **typing 模块常用品**：`Optional[X]`（可空）、`Union[X, Y]`（多类型之一）、`Any`（任意类型）、`Callable[[参数], 返回]`（可调用对象）、`TypeVar`（类型变量，表达泛型关联）。
- **字符串注解与前向引用**：当类型在定义时还没定义完，用字符串 `"TreeNode"` 避免求值，`typing.get_type_hints()` 可在运行时解析成真正的类型对象。
- **`from __future__ import annotations`**：让整个文件的注解都延迟求值，原样存成字符串，前向引用无需手动加引号。
- **注解的原理**：注解在函数定义期求值一次并存入 `__annotations__`，运行时不读取、不检查；静态检查由 mypy 等工具在编写阶段完成。
- **类型提示的价值**：静态检查（mypy 在运行前揪出类型 bug）、IDE 补全（基于返回类型精准建议方法和属性）、可执行文档（比注释更可靠地反映函数契约）。

### 5.2 读完应能掌握

- 能正确书写带注解的函数签名，包括参数注解、默认值与注解共存、返回值注解、`None` 返回类型。
- 能说出 `__annotations__` 字典的结构，并用代码读取一个函数的全部注解和单个参数的注解。
- 能区分 `Optional[X]`、`Union[X, Y]`、`Any`、`Callable`、`TypeVar` 各自的语义，并选用合适的类型表达「可空」「多类型之一」「任意类型」「回调签名」「泛型关联」。
- 能区分 `list[int]`（3.9+ 内置泛型）和 `typing.List[int]`（旧写法）的关系，知道根据 Python 版本选择写法。
- 能解释为什么 `def f(a: TreeNode)` 在类内部会报 `NameError`，并用字符串注解 `"TreeNode"` 或 `from __future__ import annotations` 解决。
- 能用 `typing.get_type_hints()` 把字符串注解解析成真正的类型对象。
- 能用 mypy 对一段带类型提示的代码做静态检查，看懂「参数类型不匹配」「返回值可能为 None 却直接使用」等典型报错。
- 能解释注解在定义期求值、运行时不检查这一核心机制，理解类型提示的价值主要在静态工具和 IDE，而非运行时。
