---
group:
  title: 【02】基础数据类型和类型系统
  order: 2
order: 10
title: Union 与 Any 类型
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 为什么需要 Union 与 Any

《类型注解基础》介绍了用单一类型标注变量与函数:`x: int`、`def f(s: str) -> bool`。但现实代码里,一个值往往**不是单一固定类型**——它可能是几种类型之一,或类型根本无法预先确定。要表达这些情况,就需要 `Union`(联合类型)与 `Any`(任意类型)这两大类型构造工具。

`Union`(联合)表示"值属于若干类型中的一种"。真实场景无处不在:

- 一个函数接收 `int` 或 `str`(如 `parse(x: int | str)`——既能解析数字也能解析数字字符串)。
- 一个字段可能存 `int`、`str` 或 `None`(数据库可选列、JSON 多态字段)。
- 返回值依分支不同,返回 `dict` 或 `list`(配置解析结果)。
- 兼容多种数字类型 `int | float | complex`。

```python
def parse(x: int | str) -> int:
    if isinstance(x, str):
        return int(x)
    return x
parse(42), parse("42")    # 都合法
```

`Any`(任意)表示"值可以是任何类型,且不做类型检查"。它是类型系统的"逃生舱",用于:

- 与无注解的旧代码交互(旧函数返回类型未知)。
- 动态数据结构(JSON 解析结果、ORM 查询行),结构运行时才知。
- 确实无法或不必确定类型的场景(元编程、装饰器转发参数)。

```python
from typing import Any
def log(obj: Any) -> None:    # 接受任何对象,不检查
    print(repr(obj))
log(42); log("hi"); log([1,2])   # 都合法
```

`Union` 与 `Any` 是类型注解从"单一类型"走向"灵活表达现实"的关键。没有它们,注解要么过严(只能单类型,无法表达"或")要么过松(全用 object/不注解,失去检查)。本篇要深入讲透这两者及其周边:`Union` 的完整语义与 `|` 语法、`Optional` 作为 Union 的特例、`Literal` 字面量类型(精确到具体值)、`Any` 的精确语义与"逃逸"行为、`object` vs `Any` 的深层区别、`Never`/`NoReturn`(不可达类型)、以及 Union 的代数性质与简化规则。

本篇是类型注解子系列的进阶篇。与《类型注解基础》的分工:《09》给了 Union/Optional/Any 的入门用法,本篇深入它们的语义、行为边界、代数规则、运行时表现与陷阱——把"知道怎么写"推进到"理解为什么、何时用、避开哪些坑"。`TypeVar` 泛型留第 11 篇,运行时反射留第 12 篇,mypy 实战留第 13 篇。

### 1.2 Union 的语义:或关系

`Union[X, Y]` 的语义是**逻辑或**——值是 X 或 Y 中任意一种。它的核心特征是:

- **声明时**:列出所有可能类型(`int | str` 表"可能是 int 或 str")。
- **使用时**:必须处理"是哪种"的情况,通常用 `isinstance` 或 `is None` 区分分支后分别操作。
- **检查时**:mypy 在分支内"收窄"到具体类型,允许该类型的安全操作。

```python
def double(x: int | str) -> int | str:
    if isinstance(x, int):
        return x * 2          # 分支内 x: int,myself 允许 int*2
    return x + x              # 此处 x: str(收窄),str+str 合法
print(double(5))     # 10
print(double("ab"))  # abab
```

`int | str` 声明后,函数体内用 `isinstance` 区分:为 `int` 的分支里 mypy 把 `x` 当 int(允许 `*2`),否则当 str(允许 `+`)。这种"联合声明 + isinstance 收窄"是处理 Union 的标准模式。

**Union 与单一类型的区别**:单一类型(`int`)检查器知道确切类型,直接允许操作;Union(`int | str`)检查器只知"是其中之一",需先用 isinstance 收窄到具体类型才能安全操作——否则 `x * 2` 在 str 上含义不同(重复),检查器不敢假设。

```python
def f(x: int | str):
    # return x * 2     # mypy 可能允许(因 int*2 和 str*2 都合法,但语义不同),但常需先收窄明确意图
    if isinstance(x, int):
        return x * 2   # 明确是数值翻倍
    return x * 2       # 此处是字符串重复
```

理解 Union 是"或关系 + 需收窄才安全精确操作",就掌握了它的使用心法。

### 1.3 Any 的语义:放弃检查

`Any` 的语义是**任意类型,关闭类型检查**。它与 Union 有本质区别:

- `Union[int, str]`:有限的、明确的类型集合,检查器仍验证(配合 isinstance 收窄)。
- `Any`:无限类型集合,**检查器对该值的所有操作放行不验证**。

```python
from typing import Any
def f(x: Any) -> Any:
    return x.foo().bar[0] + x.baz   # mypy 全部放行,不检查 foo/bar/baz 是否存在
f(42)    # 运行时 AttributeError(int 无 foo)
```

`Any` 让检查器对该变量"装作没看见"——任何属性访问、运算、传参都放行。这等于在该处关闭类型安全,把错误推迟到运行时(`AttributeError`/`TypeError`)。

**Any 的两个方向**(重要):

- **Any 兼容任何类型**:`Any` 类型的值可赋给任何类型的变量(因 Any 可能是任何类型,包括目标类型)。
- **任何类型兼容 Any**:任何类型的值可赋给 `Any` 变量(显然)。

```python
x: Any = 10
y: str = x        # mypy 允许!Any → str(Any 兼容任何类型,故可赋给 str)
# 运行时 y=10 是 int 不是 str,但 mypy 不报(因 Any 关闭检查)
x = "hi"          # str → Any,允许
```

`y: str = x`(x 是 Any)被 mypy 允许,即便 x 实际是 int 10——因为 Any"可能是 str",检查器信它。这是 Any 的"逃逸"特性:它让类型不匹配"渗透"过检查器,可能污染后续代码。这是 Any 危险的根源——一个 Any 来源的值,赋给具体类型变量后,那个变量实际类型可能与注解不符,但检查器不知情,后续基于错误注解的检查都失准。

```python
def get_dynamic() -> Any:    # 动态来源(JSON、旧代码)
    return 42
s: str = get_dynamic()       # mypy 允许(Any→str),但 s 实际是 42(int)!
print(s.upper())             # 运行时 AttributeError(int 无 upper),mypy 没抓到
```

`get_dynamic()` 返回 Any,赋给 `s: str` 通过检查,但 s 实际是 int,`s.upper()` 运行时崩——mypy 没发现(因 Any 关闭检查)。这就是 Any 的风险:它制造"检查器看不见的类型错误"。理解 Any 的"双向兼容 + 关闭检查 + 错误渗透",就理解为何要慎用 Any。

### 1.4 Union、Any、object 三者定位

把 Union、Any、object 三者放一起对比,是理解本篇的关键。它们都涉及"多类型",但语义与安全度截然不同:

| 类型 | 语义 | 检查器行为 | 安全度 |
|------|------|-----------|--------|
| `Union[X,Y]` | X 或 Y(有限明确) | 验证,需 isinstance 收窄 | 高 |
| `object` | 任意类型(但类型未知) | 要求收窄才能操作 | 中高 |
| `Any` | 任意类型(放弃检查) | 放行不验证 | 低 |

```python
from typing import Any, Union

# Union:有限类型,检查器验证
def f_union(x: int | str) -> int:
    if isinstance(x, int):
        return x + 1
    return len(x)

# object:任意类型,但必须收窄才能操作(检查器强制)
def f_obj(x: object) -> int:
    # return x + 1     # mypy 报错!object 没有 + 操作,需先收窄
    if isinstance(x, int):
        return x + 1
    return 0

# Any:任意类型,检查器放行(危险)
def f_any(x: Any) -> Any:
    return x + 1       # mypy 放行,但 x 可能是 str 运行时拼成 "a1"
```

三者的核心差异在"检查器对操作的态度":

- **Union**:操作前需 isinstance 收窄到具体类型,否则检查器限制操作(因不知是联合里哪个)。
- **object**:操作前必须 isinstance 收窄——object 只有所有对象共有的方法(`__str__` 等),任何特定操作(如 `+`、`.upper()`)都需先 isinstance 证明类型。
- **Any**:无需收窄,检查器放行任何操作(不验证)。

**实践排序:能用 Union 明确列举就不用 Any,接受任意但需处理用 object**,只有确实无法确定且不关心检查才用 Any。`object` 比 `Any` 安全——同样"接受任意",object 强制你 isinstance 收窄(检查器在收窄后验证),Any 则全放行。这条"优先 object 而非 Any"是本篇最重要的实践原则之一。

理解了 Union(或关系,需收窄)、Any(放弃检查,危险)、object(任意但强制收窄)三者的定位,就掌握了本篇的理论骨架。后续章节展开每个的完整用法与陷阱。

---

## 2. 核心内容

本章详解 Union、Any 及其周边的完整用法。每节遵循"规则 → demo → 陷阱 → 场景"展开。Union 的代数规则、Optional 特例、Literal 精确值、Any 的逃逸是重点。

### 2.1 Union 的完整写法与代数规则

`Union[X, Y, Z]` 表示"X 或 Y 或 Z"。"两种等价写法:

```python
from typing import Union
# 写法一:Union(所有版本)
def f(x: Union[int, str, float]) -> str: ...
# 写法二:| 联合(3.10+,推荐)
def f(x: int | str | float) -> str: ...
```

`int | str | float` 等价 `Union[int, str, float]`。3.10+ 推荐 `|`(简洁无需导入),兼容老版本用 `Union`。

**Union 的代数简化规则**(mypy 自动应用,理解有助读懂错误)":

```python
from typing import Union
# 规则1:顺序无关
print(Union[int, str] == Union[str, int])   # True

# 规则2:重复类型合并
def f(x: int | int) -> None: ...   # 等价 x: int(mypy 简化)

# 规则3:子类被父类吸收
def f(x: bool | int) -> None: ...  # 等价 x: int(bool 是 int 子类,bool 被吸收)

# 规则4:Union 套 Union 展平
def f(x: Union[int, Union[str, float]]) -> None: ...  # 等价 Union[int, str, float]
```

这些规则让 Union 在 mypy 内部规范化:bool|int → int(因 bool 是 int 子类,含 bool 的值都已是 int)、嵌套 Union 展平。了解这些,当看到 mypy 把 `bool | int` 报成 `int` 时不困惑——是规范化结果。

**Union 的运行时表示**(3.10+):

```python
# 3.10+:int | str 在运行时产生 types.UnionType 对象
import types
t = int | str
print(t)            # int | str
print(type(t))      # <class 'types.UnionType'>
print(isinstance(42, t))   # False!注意:UnionType 的 isinstance 不工作
# 3.10+ 联合类型对象不能用 isinstance 直接判断
# 要判需用 get_args 取出成员逐个 isinstance
import typing
print(typing.get_args(t))   # (<class 'int'>, <class 'str'>)
```

⚠️ **`isinstance(42, int | str)` 在 3.10+ 报 TypeError**(UnionType 不是合法的 isinstance 第二参数)。这是 `|` 联合的运行时限制——它主要服务静态检查,运行时 isinstance 不能直接用。要运行时判断"是否 Union 成员",用 `typing.get_args` 取出成员逐个 isinstance,或用 `typing.Union` 之外的方式(见第 12 篇运行时)。`typing.Union[X,Y]`(老写法)的行为略不同,但同样不直接支持 isinstance Union 整体。这条"Union 不直接支持 isinstance 整体判断"是 3.10+ 的运行时陷阱。

**Union 作类型别名**(复杂 Union 复用):

```python
# 给复杂 Union 起名
Number = int | float | complex     # 3.10+ (或 Union[int,float,complex])
JsonScalar = int | float | str | bool | None
def f(x: Number) -> Number: ...
def g(v: JsonScalar) -> str: ...
```

类型别名让复杂 Union 复用,改定义一处生效。3.12+ 有更规范的 `type Number = int | float | complex` 语句(惰性求值),普通赋值 `Number = int | float` 在 3.10+ 也可(立即求值,注意前向引用问题)。

### 2.2 Optional:Union 的 None 特例

`Optional[X]` 是 `Union[X, None]` 的语法糖——表示"X 或 None",即**可空类型**。三种等价写法:

```python
from typing import Optional, Union
# 写法一:Optional
def f(x: Optional[int]) -> None: ...
# 写法二:Union[X, None]
def f(x: Union[int, None]) -> None: ...
# 写法三:X | None(3.10+,推荐)
def f(x: int | None) -> None: ...
```

三者完全等价,3.10+ 推荐 `int | None`(简洁)。`Optional` 这个名字其实有些误导——它不是"可选参数"(参数可不传),而是"值可为 None"(类型可空)。`Optional[X] = X | None`,语义是类型层面的"或 None",与参数默认值无关。

**Optional 的唯一性规则**:`Optional` 只接受一个类型参数,且等价于"该类型 | None":

```python
# Optional 单参数
Optional[int]               # int | None
# Optional 不接受多参数(那不是 Optional 的语义)
# Optional[int, str]        # 错!Optional 只接受一个参数
# 多类型可空用 | None
int | str | None            # (int|str) | None,正确
Union[int, str, None]       # 等价
```

`Optional[X]` 必须单参数;多类型可空用 `X | Y | None`。这条规则源于 Optional 的语义定义("X 或 None",只一个 X)。

**Optional 的收窄——判 None**:

```python
def f(x: int | None) -> int:
    if x is None:
        return 0
    return x + 1    # 此处 mypy 收窄 x: int(排除 None),允许 +1
# 等价地用 is not None
def f(x: int | None) -> int:
    if x is not None:
        return x + 1   # 收窄为 int
    return 0
```

`is None` / `is not None` 是 Optional 收窄的标准方式(mypy 据此排除 None)。判 None 后,检查器当非 None 类型,允许该类型操作。这是 Optional 安全使用的机制。

**Optional 的常见场景**:

```python
# 1. 查找函数:可能找不到返回 None
def find(key: str) -> dict | None:
    return data.get(key)    # .get 缺失返回 None

# 2. 可空字段(数据库可选列、JSON 可选字段)
class User:
    email: str | None = None    # email 可为空

# 3. 可空的可选参数(默认 None、类型可空)
def f(x: int | None = None) -> None: ...
```

这三类——查找失败、可空字段、可空可选参数——是 Optional 的高频场景。贯穿的语义是"值可能缺失/未提供",用 None 表示,Optional 注解让检查器强制处理 None 分支。

**Optional 的陷阱——`if x:` 不等于 `if x is not None:`**:

```python
def f(x: int | None):
    if x:              # 真值测试:0/None 都为假
        # mypy 收窄为 int(排除 None 和 0)
        print(x + 1)
    # 此处 x 仍可能是 0 int(python 真值,0 被 if 排除但没到 None)
# 注意:if x 排除 0 和 None,语义与 is not None 不同
def f(x: int | None):
    if x is not None:  # 仅排除 None,保留 0
        print(x + 1)   # x 可能是 0
```

`if x:`(真值)排除 None **和 0**(都为假),`if x is not None:` 只排除 None(保留 0)。收窄结果不同:`if x` 后 mypy 知道 x 是"非0 int",`if x is not None` 后是"int(含0)"。当 0 是合法值时用 `is not None`(避免排除 0),要排除 falsy 用 `if x`。这条区分对 `int | None`、`str | None`(空串)等含假值的 Optional 至关重要。

### 2.3 Literal:字面量类型

`Literal` 是 Union 的精细化——把类型精确到**具体的字面值**。`Literal["a", "b"]` 表示"值必须是字符串 'a' 或 'b'",而非"任意 str"。它让类型注解从"类型级"细化到"值级"。

```python
from typing import Literal

# mode 只能是 "r"/"w"/"a" 三个字面量
def open_file(mode: Literal["r", "w", "a"]) -> None:
    if mode == "r":
        ...
open_file("r")     # OK
open_file("x")     # mypy 报错:不在 "r"/"w"/"a" 中
open_file("rw")    # mypy 报错(若未含 "rw")
```

`Literal["r","w","a"]` 把 mode 限制为三个具体字符串值,传别的字符串 mypy 报错。这比 `mode: str`(任意字符串)精确得多,能抓"传错模式字符串"的 bug。

**Literal 支持的字面量类型**:

```python
from typing import Literal
# 字符串字面量
s: Literal["yes", "no"] = "yes"
# 整数字面量
n: Literal[0, 1, 2] = 1
# 布尔字面量(True/False 是 Literal 的特例)
b: Literal[True] = True
# 字节字面量
by: Literal[b"a"] = b"a"
# None 字面量
x: Literal[None] = None   # 等价 None 类型
```

Literal 支持 str/int/bool/bytes/None 字面量(以及 Enum)。bool 是 Literal 的特例——`bool` 实际是 `Literal[True, False]` 的别名。

**Literal 与 Union 结合**(常见模式——有限选项的"枚举式"标注):

```python
from typing import Literal, Union
# 状态字面量联合
Status = Literal["idle", "running", "stopped"]
def set_status(s: Status) -> None: ...
set_status("running")   # OK
set_status("paused")    # mypy 报错

# 多类型字面量
def f(x: Literal[1, "one", True]) -> str: ...
f(1); f("one"); f(True)    # 都 OK
```

`Literal[...]` 本身就是个"字面量值的 Union"。`Status = Literal["idle",...]` 给一组字面量起别名,等价一个"穷举的字符串联合",常用于替代简单 Enum(更轻量,值就是 str)。

**Literal 的收窄——值比较**:

```python
def f(x: Literal["a", "b"]) -> int:
    if x == "a":
        # mypy 收窄 x 为 Literal["a"]
        return 1
    # else 收窄 x 为 Literal["b"]
    return 2
```

`if x == "a":` 让 mypy 在分支内把 x 收窄到 `Literal["a"]`,else 到 `Literal["b"]`。这种"值比较收窄"让 Literal 能像 Union 一样分支精确处理。

**Literal 的应用场景**:

```python
# 1. API 模式/选项(替代魔法字符串的脆弱)
def request(method: Literal["GET", "POST", "PUT", "DELETE"]) -> None: ...
# 2. 配置开关
def config(log_level: Literal["debug", "info", "warn", "error"] = "info") -> None: ...
# 3. 区分函数重载行为(@overload 配合,见后续)
@overload
def f(x: Literal["int"]) -> int: ...
@overload
def f(x: Literal["str"]) -> str: ...
```

Literal 在"有限字符串选项""API 模式""重载区分"中极有用——它把"字符串参数的合法值"从注释/文档移到类型系统,由 mypy 强制。这比 `mode: str` 加运行时 `if mode not in [...]` 检查更优雅(错误前置到开发期)。

**Literal vs Enum**:Literal 适合"少量固定字符串/数字选项,值就是 str/int";Enum 适合"需要一个类型、有方法、要遍历的枚举"。Literal 更轻(值即字面量,无需定义类),Enum 更强(类型独立、可挂方法)。按需选——简单选项用 Literal,复杂枚举用 Enum。

### 2.4 Any 的完整行为与逃逸

§1.3 概述了 Any,这里详述其完整行为,尤其"逃逸"——Any 如何污染类型检查。

**Any 的双向兼容**:

```python
from typing import Any
# Any → 任何类型(Any 兼容一切)
a: Any = 42
s: str = a         # mypy 允许(Any → str),即便 a 是 int
n: int = a         # 允许
# 任何类型 → Any(一切兼容 Any)
x: Any = "hi"      # str → Any
y: Any = [1, 2]    # list → Any
```

Any 在赋值时双向兼容:可赋给任何类型变量(Any→任何),也可接收任何类型值(任何→Any)。这让 Any 成为类型系统的"万能适配器",但也因此让类型错误能"穿透"检查器。

**Any 的逃逸——污染蔓延**:

```python
def get_data() -> Any:        # 动态来源(如 json.loads)
    return {"age": "thirty"}  # 注意 age 值是 str

data = get_data()             # data: Any
age: int = data["age"]        # mypy 允许(Any → int)!但 age 实际是 str "thirty"
print(age + 1)                # 运行时 TypeError(str + 1),mypy 没抓到!
```

`get_data()` 返回 Any,`age: int = data["age"]` 通过检查(Any→int),但 `data["age"]` 实际是 str `"thirty"`,`age + 1` 运行时崩——mypy 全程没报错(因 Any 关闭检查)。这就是 Any 的逃逸:一个 Any 值,沿赋值链把"类型不匹配"传播到后续变量,检查器看不见,直到运行时崩。

**阻断逃逸——显式收窄或类型断言**:

```python
def get_data() -> Any:
    return {"age": 30}
data = get_data()
# 方案1:isinstance 收窄(安全,运行时也验证)
if isinstance(data, dict) and isinstance(data.get("age"), int):
    age: int = data["age"]
    print(age + 1)
# 方案2:类型断言 cast(告诉 mypy 类型,但不运行时验证)
from typing import cast
age = cast(int, data["age"])    # mypy 当 int,运行时不验证(仍可能崩)
print(age + 1)
# 方案3:更优——给动态数据声明具体类型(如 TypedDict/pydantic)
```

- **isinstance 收窄**:`isinstance(data["age"], int)` 后 mypy 收窄为 int,且运行时也验证(安全)。
- **`cast(类型, 值)`**:告诉 mypy"把这个值当某类型",不运行时验证(mypy 信你,但若错运行时仍崩)。cast 是"我知道类型,检查器不知道"的断言,比 Any 安全(收窄到具体类型),但比 isinstance 弱(不运行时验证)。
- **TypedDict/Pydantic**:给动态数据声明结构化类型,从源头消除 Any(见后续)。

**Any 的来源——动态数据与无注解代码**:

```python
import json
data = json.loads('{"x": 1}')   # 返回 Any(JSON 结构运行时才知)
# data 是 Any,操作不被检查
# 无注解的旧函数
def legacy(x):       # 无注解,mypy 当参数返回都是 Any
    return x.foo()
result = legacy(1)   # result: Any(legacy 返回 Any)
```

`json.loads`、`eval`、无注解函数的返回值等"动态来源"默认 Any。这是 Any 不可避免的来源——某些数据类型运行时才知。处理方法:用 TypedDict/pydantic 给动态数据建类型,或用 isinstance/cast 在边界收窄。**目标不是消灭所有 Any,而是在边界(动态数据入口、旧代码接口)收窄 Any,让系统内部类型确定**。

**Any 的合理用法**(并非全坏):

```python
# 1. 真正无法确定类型(元编程、极动态场景)
def deep_getattr(obj: Any, *names: str) -> Any: ...
# 2. 与无类型 stub 的 C 扩展/旧库交互
# 3. 装饰器转发任意签名(配合 ParamSpec 更优,见 TypeVar 篇)
def log_call(func: Any) -> Any: ...
```

Any 有其合理位置——真正动态的代码(元编程、转发任意函数)。关键是**把 Any 限制在小范围边界**,不让它蔓延到系统内部。一个 Any 变量应尽快被 isinstance/cast/具体类型收窄,蜕变为确定类型。

### 2.5 object vs Any 的深层区别

§1.4 对比了 object 与 Any,这里深入它们的本质差异——这是本篇最该吃透的对比。

**object 是类型系统的顶,Any 是类型检查的关**:

- `object`:所有类的根基类。任何值都是 object 实例。但 object 类型**只有所有对象共有的方法**(`__str__`/`__repr__`/`__eq__` 等),要调用特定类型的方法必须先 isinstance 收窄。检查器**强制**收窄,故安全。
- `Any`:任意类型。检查器**关闭**对该值的检查,任何操作放行。不强制收窄,故危险(可能运行时崩)。

```python
from typing import Any
def f_obj(x: object) -> int:
    # return x.upper()      # mypy 报错!object 没有 upper
    if isinstance(x, str):
        return len(x)       # 收窄后允许 str 操作
    return 0
def f_any(x: Any) -> Any:
    return x.upper()        # mypy 放行!但 x 可能非 str 运行时崩
```

`f_obj` 里 `x.upper()` mypy 报错(object 无 upper),强制你 isinstance 收窄——这保证你在收窄后才操作,安全。`f_any` 里 `x.upper()` mypy 放行,但若 x 是 int 运行时崩——不安全。

**赋值兼容性的关键差异**:

```python
# object 不兼容具体类型(具体 → object OK,object → 具体 需检查)
x: object = "hi"     # str → object,OK(任何值都是 object)
# s: str = x         # mypy 报错!object 不一定是 str,需 isinstance
# Any 双向兼容
a: Any = "hi"
s: str = a           # mypy 允许!Any → str(危险,可能实际非 str)
```

- `object → str`:mypy **报错**(需 isinstance 证明),安全。
- `Any → str`:mypy **允许**(Any 关闭检查),危险。

这是 object 与 Any 最实质的区别:**object 阻止"不确定类型的值"赋给具体类型变量(强制收窄),Any 允许(放任逃逸)**。所以"接受任意输入"用 object 比用 Any 安全得多——object 把"类型未知"的限制传递下去(迫使后续收窄),Any 把"类型未知"伪装成"类型确定"(让后续基于可能错误的注解检查)。

**何时用 object**:

```python
# 接受任意输入但内部收窄处理
def print_anything(x: object) -> None:
    print(x)          # object 有 __str__,允许 print
def process(x: object) -> str:
    if isinstance(x, (int, str)):
        return str(x)
    return "unknown"
# 容器存任意类型(异构)
mixed: list[object] = [1, "a", True, [1,2]]   # 元素是 object
```

`list[object]` 接受任意元素(异构列表),取出时是 object 需收窄。这比 `list[Any]` 安全——后者元素取出是 Any(操作放行危险),前者是 object(强制收窄)。

**核心实践原则**:**凡是用 Any 的地方,先问能否用 object**。object 提供"接受任意"的同时保留"强制收窄"的安全性,Any 则牺牲安全换"放行"。绝大多数"接受任意输入"的场景,object 是更好的选择;只有真正需要"关闭检查"(元编程、动态转发)才 Any。

### 2.6 Never 与 NoReturn:不可达类型

`NoReturn`(老)与 `Never`(3.11+)表示**不可达类型**——函数永不正常返回(总抛异常或死循环),或某分支永不可达。它们是类型系统表达"这里不会到达"的工具。

**NoReturn / Never 标注永不返回的函数**:

```python
from typing import NoReturn, Never   # Never 是 3.11+,NoReturn 是老

def fail(msg: str) -> NoReturn:     # 或 Never
    raise ValueError(msg)           # 总抛异常,不返回

def loop_forever() -> NoReturn:
    while True:                     # 死循环,不返回
        pass
```

`-> NoReturn`(或 `-> Never`)声明"函数不会正常返回"——只抛异常或死循环。这让 mypy 知道调用该函数后的代码**不可达**(执行流不会过去)。

**NoReturn/Never 在控制流中的作用——排除分支**:

```python
def fail(msg: str) -> NoReturn:
    raise ValueError(msg)

def f(x: int | None) -> int:
    if x is None:
        fail("x 不能为 None")    # 调 NoReturn 函数,此后不可达
    # 此处 mypy 知道 x 必非 None(因 None 分支 fail 了,不可达)
    # 故 x 收窄为 int(从 int|None 排除 None)
    return x + 1
```

`fail()` 是 NoReturn,调用后 mypy 知道"那条路径不会继续",故 `if x is None: fail(...)` 后,`x is None` 分支"不返回",mypy 推断后续 x 必是非 None 的 int。这让 NoReturn 能辅助收窄——在 None 分支调 fail,mypy 自动排除 None。

**Never vs NoReturn**:

```python
# NoReturn:老,主要标"函数不返回"
def f() -> NoReturn: raise ...
# Never:3.11+,更通用——既可标函数不返回,也可表"不可达表达式"
def f() -> Never: raise ...
# Never 还可用于:穷尽检查的兜底
def handle(color: Literal["red","green","blue"]) -> int:
    if color == "red": return 1
    if color == "green": return 2
    if color == "blue": return 3
    assert False, "unreachable"   # 或返回 Never 表此分支不可达
```

`Never`(3.11+)是 `NoReturn` 的演进——更通用,可标注表达式级"不可达"。`NoReturn` 仍可用(别名关系,Never 是 NoReturn 的子类型)。新代码 3.11+ 用 Never,兼容老版本用 NoReturn。

**Never 的代数性质——Union 的吸收元**:

```python
# Never 是 Union 的"吸收元":Union[X, Never] == X
# 因 Never 不可达,Union 加它相当于没加
def f(x: int | Never) -> int: ...   # 等价 x: int
# 这让 Never 在类型推导里"消失",不影响联合
```

Never 在 Union 中被吸收(`int | Never` = `int`),因 Never 表"不可能的值",对联合无贡献。这与 `int | int` = `int`(重复吸收)类似,Never 是更强的"空类型"吸收。

**Never 的应用场景**:

```python
# 1. 标注总抛异常的错误处理函数
def assert_never(x: Never) -> Never:   # 兜底:不该到达
    raise AssertionError(f"Unexpected: {x}")
# 2. 穷尽检查(Enum/Literal 的兜底)
def handle(s: Literal["a","b","c"]) -> int:
    if s == "a": return 1
    if s == "b": return 2
    if s == "c": return 3
    return assert_never(s)   # 若 s 是其他值,mypy 报错(因 s 此时是 Never,但 assert_never 要 Never)
    # 实际:若 Literal 漏了分支,mypy 在 assert_never(s) 处报"s 不是 Never",提示穷尽不全
```

`assert_never` 是 Never 的经典用法——放在穷尽检查末尾,若 Enum/Literal 有未处理分支,mypy 报错(因漏分支时 s 不是 Never,与 assert_never 参数要求 Never 不符),强制穷尽所有情况。这是类型系统保证分支完整性的技巧。

理解 Never/NoReturn 表"不可达",及其在收窄、穷尽检查中的作用,就掌握了类型系统的"不可能性表达"。

### 2.7 Union 与 Any 的运行时内省

注解里的 Union/Any 主要给 mypy 静态用,但有时需要在运行时"读出"这些类型信息(框架、反射、动态分发)。`typing` 提供了内省工具。

**`typing.get_args` / `get_origin`**:解析泛型与 Union 的结构:

```python
import typing
from typing import Union, Optional, Any

# 解析 Union 的成员
t = Union[int, str]
print(typing.get_args(t))      # (<class 'int'>, <class 'str'>)
print(typing.get_origin(t))    # typing.Union(3.9 之前)/ Union(标记是联合)

# 解析 Optional(= Union[X, None])
t2 = Optional[int]
print(typing.get_args(t2))     # (<class 'int'>, <class 'NoneType'>)

# 3.10+ 的 X | Y 是 types.UnionType,get_args 同样工作
t3 = int | str
print(typing.get_args(t3))     # (<class 'int'>, <class 'str'>)
print(typing.get_origin(t3))   # <class 'types.UnionType'>
```

`get_args(t)` 取出 Union/泛型的成员类型(返回元组),`get_origin(t)` 取其"构造器"(Union/list/dict 等)。这让运行时能"拆开"类型注解,看它是不是 Union、成员是谁。

**判断是否 Union 类型**:

```python
import typing, types
def is_union(t) -> bool:
    # 兼容 typing.Union 和 3.10+ 的 X|Y(types.UnionType)
    origin = typing.get_origin(t)
    return origin is typing.Union or origin is types.UnionType
print(is_union(int | str))          # True
print(is_union(Optional[int]))      # True
print(is_union(int))                # False
print(is_union(int | None))         # True
```

判断"某类型是否 Union":检查 `get_origin` 是 `typing.Union`(老 Union/Optional)或 `types.UnionType`(3.10+ `|`)。注意两种 Union 表示不同(typing.Union vs types.UnionType),要兼容都判。

**判断是否 Any**:

```python
import typing
print(t := Any)
print(t is Any)   # True —— 直接用 is 判 Any(Any 是单例)
print(typing.get_origin(Any))   # None(Any 无 origin,不是泛型)
```

`Any` 是个特殊单例对象,用 `t is Any` 判(身份比较)。Any 不是泛型,`get_origin(Any)` 为 None。

**运行时判断值是否属于 Union**(避开 §2.1 的 isinstance 陷阱):

```python
import typing
def isinstance_union(value, union_type) -> bool:
    """运行时判断 value 是否属于 union_type(Union/Optional)的某成员。"""
    if typing.get_origin(union_type) in (typing.Union, __import__('types').UnionType):
        return any(isinstance(value, arg) for arg in typing.get_args(union_type))
    return isinstance(value, union_type)
print(isinstance_union(42, int | str))      # True
print(isinstance_union("hi", int | str))    # True
print(isinstance_union(3.14, int | str))    # False
print(isinstance_union(None, Optional[int]))# True(None 是 NoneType)
```

因 `isinstance(x, int | str)` 直接报 TypeError(§2.1),运行时判断"值是否在 Union 内"要用 `get_args` 取成员,逐个 isinstance(注意 NoneType 成员——Optional 的 None 成员是 `type(None)`,`isinstance(None, type(None))` 为 True)。

**`get_type_hints` 解析注解**(处理字符串前向引用,见第 12 篇详述):

```python
def f(x: "int | str", y: "list[int]") -> "Optional[dict]":
    ...
print(typing.get_type_hints(f))
# {'x': int | str, 'y': list[int], 'return': Optional[dict]}
# get_type_hints 把字符串注解解析回真实类型对象(含 Union/泛型)
```

`get_type_hints` 解析函数/类的 `__annotations__`,把字符串前向引用(`"int | str"`)解析回真实类型对象,并解析 Union/泛型。框架(FastAPI/Pydantic)用它在运行时读注解做参数解析/校验。运行时内省细节留第 12 篇。

理解 `get_args`/`get_origin` 能运行时拆解 Union/Any,就掌握了类型注解的运行时反射入口——这在写通用框架(基于注解动态分发)时关键。

### 2.8 综合示例:Union/Literal/Any 协作

下面这个片段综合演示 Union、Optional、Literal、Any、object、Never 的协作,模拟一个处理"多形态配置"的小系统:

```python
from typing import Union, Optional, Literal, Any, NoReturn
import typing, types

# 类型别名:配置值可能是多种类型
ConfigValue = int | float | str | bool | None | list["ConfigValue"]
Mode = Literal["strict", "lenient", "off"]   # 有限模式选项

# 错误处理:NoReturn 表永不返回
def fail(msg: str) -> NoReturn:
    raise ValueError(msg)

# Literal 收穷尽 + NoReturn 兜底
def apply_mode(mode: Mode) -> str:
    if mode == "strict":
        return "严格校验"
    if mode == "lenient":
        return "宽松校验"
    if mode == "off":
        return "不校验"
    # 若 Mode 漏分支,mypy 此处报错(因 mode 此时非 Never,assert_never 要 Never)
    return fail(f"未知模式:{mode}")   # NoReturn,此后不可达

# Union 收窄:多类型输入分支处理
def normalize(value: int | str | None) -> str:
    if value is None:           # Optional 收窄
        return "空"
    if isinstance(value, int):  # Union 收窄
        return str(value)
    return value                # 此处 value: str

# object vs Any:接收任意输入,object 强制收窄(安全),Any 放行(危险)
def safe_describe(x: object) -> str:
    # x.upper() mypy 报错(object 无 upper),故必须收窄
    if isinstance(x, str):
        return f"字符串:{x.upper()}"
    if isinstance(x, (int, float)):
        return f"数字:{x}"
    return "其他"

def unsafe_describe(x: Any) -> Any:
    return x.upper()    # mypy 放行,但 x 非 str 运行时崩

# 运行时内省:拆解 Union
def describe_type(t) -> str:
    origin = typing.get_origin(t)
    if origin in (typing.Union, types.UnionType):
        members = " | ".join(m.__name__ if hasattr(m, '__name__') else str(m) for m in typing.get_args(t))
        return f"Union[{members}]"
    if t is Any:
        return "Any(任意,关闭检查)"
    return getattr(t, "__name__", str(t))

# 运行演示
print(apply_mode("strict"))       # 严格校验
print(normalize(42), normalize("hi"), normalize(None))   # 42 hi 空
print(safe_describe("abc"), safe_describe(3.14), safe_describe([1]))  # 字符串:ABC 数字:3.14 其他
# unsafe_describe(42) 会运行时崩(Any 放行 x.upper()),故不调用
print(describe_type(int | str))   # Union[int | str]
print(describe_type(Optional[int]))  # Union[int | NoneType]
print(describe_type(Any))         # Any(任意,关闭检查)
```

跑一遍这段示例(注意 `apply_mode` 的 Literal 穷尽与 NoReturn 兜底、`normalize` 的 Union/Optional 收窄、`safe_describe` 的 object 强制收窄 vs `unsafe_describe` 的 Any 危险放行、`describe_type` 的运行时类型拆解),Union/Literal/Any/object/Never 的协作与差异就清晰了。

核心结论:**Union 表"或关系"配 isinstance 收窄、Optional 是 None 特例配 is None 收窄、Literal 精确到值配值比较收窄、object 接受任意但强制收窄(安全)、Any 关闭检查(危险,限于动态边界)、Never 表不可达辅助穷尽**。这是本篇的实践总纲。

---

## 3. 最佳实践

### 3.1 能用 Union 明确列举,就不用 Any

```python
# 推荐:明确可能类型,检查器仍验证
def f(x: int | str) -> int: ...
# 避免:用 Any 关闭检查
def f_bad(x: Any) -> Any: ...
```

能用 Union(`|`)列出可能类型就不要 Any。Union 保留检查器验证(配 isinstance 收窄),Any 关闭检查放弃安全。明确的联合远胜含糊的 Any。

### 3.2 接受任意输入优先 object,而非 Any

```python
# 推荐:object(强制收窄,安全)
def process(x: object) -> str:
    if isinstance(x, str): ...
    return "unknown"
# 避免:Any(放行,危险)
def process_bad(x: Any) -> Any:
    return x.upper()   # 非法操作也放行
```

凡"接受任意类型输入"的场景,优先 `object`——它要求收窄才能操作,检查器在收窄后验证。`Any` 仅当确需关闭检查(元编程、动态转发)时用。优先 object 是本篇头号原则。

### 3.3 Optional 配 is None / is not None 收窄,注意 0/'' 区别

```python
def f(x: int | None) -> int:
    if x is not None:      # 仅排除 None,保留 0
        return x + 1
    return 0
# 不要用 if x:(排除 None 和 0,0 是合法值时丢失)
```

Optional 用 `is None`/`is not None` 收窄(精确判 None)。当联合类型含假值(int 的 0、str 的 '')时,`if x:` 会误排除这些合法值,要用 `is not None`。区分"判 None"与"判假值"。

### 3.4 有限字符串/数字选项用 Literal,别用裸 str/int

```python
# 推荐:Literal 精确到值
def request(method: Literal["GET", "POST"]) -> None: ...
# 避免:裸 str + 运行时检查
def request_bad(method: str) -> None:
    if method not in ("GET", "POST"): raise ...
```

有限固定选项(模式、状态、方法名)用 `Literal["a","b",...]`,把合法值移入类型系统,myssy 开发期抓"传错值",优于裸 `str` 加运行时校验。大量选项或需方法/遍历用 Enum。

### 3.5 在动态数据入口收窄 Any,不让其逃逸蔓延

```python
def handle_json(raw: Any) -> dict:    # raw 来自 json.loads,Any
    # 在入口用 isinstance 收窄,蜕变为确定类型
    if not isinstance(raw, dict):
        raise TypeError
    return raw    # 此后 raw: dict,系统内部类型确定
# 不要让 Any 蔓延到系统深处
```

Any 来源(json.loads、旧代码)在入口处用 isinstance/cast/TypedDict 收窄成具体类型,让系统内部类型确定。勿让 Any 一路渗透(逃逸)到深处,制造检查器看不见的 bug。

### 3.6 复杂 Union/Optional 用类型别名,提高可读与维护

```python
# 起名复用,改类型一处生效
JsonScalar = int | float | str | bool | None
User = dict | None   # 或更具体的 TypedDict
def f(v: JsonScalar) -> str: ...
# 比反复写 int | float | str | bool | None 清晰
```

复杂联合(`int | float | str | None | list[...]`)反复出现时起类型别名(`JsonScalar = ...`),注解更短、改定义一处。3.12+ 用 `type` 语句更规范。

### 3.7 Union 的 X | Y 写法注意版本,3.9- 用 Union 或 future

```python
# 3.10+: X | Y 推荐写法
def f(x: int | str): ...
# 3.9 及更早: 注解里 X | Y 运行时报错,用 Union
# def f(x: Union[int, str]): ...
# 或: from __future__ import annotations(注解不求值,3.7+)
```

`int | str` 注解是 3.10+ 语法,3.9- 运行时报 TypeError。兼容老版本用 `typing.Union`,或顶部 `from __future__ import annotations`(注解延迟求值,不立即计算 `int | str`)。新项目用 3.10+ 或 future。

### 3.8 isinstance 收窄 Union,而非直接 isinstance(值, Union整体)

```python
# 推荐:分支 isinstance 收窄
def f(x: int | str) -> int:
    if isinstance(x, int): return x + 1
    return len(x)
# 避免:isinstance(x, int | str) 在 3.10+ 报 TypeError
# isinstance(x, int | str)   # TypeError(get_args 取成员判)
```

Union 收窄用分支 `isinstance(x, int)`/`isinstance(x, str)`(mypy 据此收窄)。不要 `isinstance(x, int | str)`(3.10+ 联合对象不支持,报 TypeError)。运行时若必须判"值是否在 Union 内",用 `get_args` 取成员逐个 isinstance。

### 3.9 重载函数用 Literal 区分,优于 Any 多返回

```python
from typing import overload, Literal
@overload
def f(x: Literal["int"]) -> int: ...
@overload
def f(x: Literal["str"]) -> str: ...
def f(x): ...   # 实现统一,但对外类型依 Literal 精确
# 调用方据传的字面量得到精确返回类型,优于 def f(x: str) -> Any
```

函数依输入返回不同类型时,用 `@overload` + Literal 区分重载,让调用方得到精确返回类型。这比单一 `-> Any` 签名安全(调用方类型确定,可检查)。重载详见进阶 typing。

### 3.10 穷尽检查用 assert_never(Never)兜底,防漏分支

```python
def handle(s: Literal["a","b","c"]) -> int:
    if s == "a": return 1
    if s == "b": return 2
    if s == "c": return 3
    return assert_never(s)   # 漏分支时 mypy 报错(s 此处非 Never)
def assert_never(x: Never) -> NoReturn:
    raise AssertionError(f"未处理:{x}")
```

Enum/Literal 的分支处理,末尾用 `assert_never(s)`(Never 兜底)。若漏了某个值分支,mypy 在 assert_never 处报"s 不是 Never",强制补全分支。这是类型系统保证穷尽的标准技巧,防"新增枚举值忘加分支"bug。

### 3.11 cast 断言类型,但优于 Any 仍逊于 isinstance

```python
from typing import cast, Any
def get_x(d: Any) -> int:
    # isinstance 最安全(运行时验证)
    if isinstance(d, dict) and isinstance(d.get("x"), int):
        return d["x"]
    # cast 次之(不运行时验证,但比留 Any 好——收窄到 int 后续可检查)
    return cast(int, d["x"]) if isinstance(d, dict) else 0
# cast 别滥用:它是"我知道类型检查器不知道",错则运行时崩
```

`cast(T, x)` 告诉 mypy"把 x 当 T",不运行时验证。比留着 Any 好(收窄后后续可检查),但不如 isinstance(后者运行时也验证)。cast 用于"确知类型但检查器推断不出"(如 C 扩展返回),别当万能类型转换。

### 3.12 NoReturn/Never 标注永不返回函数,辅助收窄与穷尽

```python
def fail(msg: str) -> NoReturn:   # 或 Never(3.11+)
    raise ValueError(msg)
def f(x: int | None) -> int:
    if x is None:
        fail("x 必填")   # NoReturn,此后不可达,mypy 推断 x 非 None
    return x + 1   # x: int(收窄)
```

总抛异常/死循环的函数用 `NoReturn`(或 3.11+ `Never`)标注。这让 mypy 知道调用后不可达,辅助控制流收窄(如 None 分支调 fail 后,x 自动排除 None)。3.11+ 优先 Never,兼容用 NoReturn。

---

## 4. 原理

本章讲清 Union/Any/Literal/Never 背后的机制:`|` 联合与 `types.UnionType` 的运行时表示、`typing.Union` 与 `X|Y` 的差异、Any 的"双向兼容"类型规则根源、Literal 的"值类型"实现、object 为何强制收窄、Never 的代数性质(吸收元)、子类型关系(supertype/subtype)。这些是"为何如此"的根基。

### 4.1 X | Y 的运行时表示:types.UnionType(需理解,详述)

3.10+ 的 `int | str` 注解在运行时**产生一个 `types.UnionType` 对象**——这要讲清其机制,理解了就不疑惑"为何 isinstance 不支持"。

**`|` 运算符的类型协议**:3.10+(PEP 604)让类型对象支持 `|` 运算,通过 `__or__`/`__ror__`:

```python
import types
t = int | str
print(t)           # int | str
print(type(t))     # <class 'types.UnionType'>
# 等价:int.__or__(str) 返回 types.UnionType 对象
```

`int | str` 调用 `int.__or__(str)`,返回新的 `types.UnionType` 实例,表示"int 或 str 的联合"。这个对象是**运行时真实存在**的类型对象,可存入变量、放进 `__annotations__`、被 `get_args` 拆解。

**`types.UnionType` vs `typing.Union`**(重要差异):

```python
import typing, types
# typing.Union(老,所有版本)
u1 = typing.Union[int, str]
print(type(u1))    # <class 'typing._UnionGenericAlias'>(typing 工具对象)
# types.UnionType(新,3.10+)
u2 = int | str
print(type(u2))    # <class 'types.UnionType'>
# 两者语义等价(mypy 视为同),但运行时是不同对象
print(u1 == u2)    # True(语义相等,但 type 不同)
```

- `typing.Union[int, str]`:产生 typing 模块的 `_UnionGenericAlias` 对象(PEP 484 工具)。
- `int | str`:产生 `types.UnionType` 对象(PEP 604,3.10+)。

两者**语义等价**(mypy 同等对待,`==` 为 True),但运行时是不同的类。这是历史演进——3.10 为了"内置 `|` 语法"引入 UnionType,与老的 typing.Union 并存。新代码用 `|`,老代码 typing.Union 仍工作。

**为何 `isinstance(x, int | str)` 报 TypeError**:`types.UnionType` 不是"可被 isinstance 用的类型"——`isinstance` 的第二参数要求是"类型或类型元组",而 UnionType 是"联合类型对象"(非具体类),`isinstance` 不识别它:

```python
# isinstance(42, int | str)   # 3.10+ TypeError:UnionType 不是合法 isinstance 参数
# 因 UnionType 不是单一 class,isinstance 不知如何对它判
# 对比:isinstance(42, (int, str))   # OK,类型元组是合法的
```

`isinstance(x, (int, str))`(类型**元组**)是合法的——元组是 isinstance 支持的多类型形式。但 `isinstance(x, int | str)`(types.UnionType 对象)不支持——UnionType 与元组是不同对象,isinstance 只认元组不认 UnionType。这是 `|` 联合的运行时限制:它服务静态注解,运行时多类型判断要用元组 `(int, str)` 或 `get_args` 取成员。

理解 `int | str` 产生 `types.UnionType`,及其与元组/typing.Union 的差异,就理解了 Union 的运行时表现与 isinstance 限制的根源。

### 4.2 Any 的双向兼容:子类型规则

§1.3/§2.4 讲了 Any 的"双向兼容",这里讲清其在类型系统规则层的根源——**Any 既是所有类型的子类型,也是所有类型的父类型**。

**子类型关系(subtype)**:类型系统中,`A` 是 `B` 的子类型(`A <: B`)意味着"任何需要 B 的地方都能用 A"。如 `bool <: int`(bool 是 int 子类型,任何要 int 处可用 bool)。

**Any 的特殊地位**:Any 被定义为**与所有类型互为子类型**——`Any <: T` 且 `T <: Any`,对任意 T。这使:

- `Any <: T`(Any 是 T 子类型):Any 类型的值可赋给 T 类型变量(子类型可替代父类型位置)。
- `T <: Any`(T 是 Any 子类型):T 类型值可赋给 Any 变量。

```python
a: Any = 42
s: str = a     # Any <: str(Any 是 str 子类型),故 Any→str 允许
a = "hi"        # str <: Any,故 str→Any 允许
```

这条"Any 与一切互为子类型"是 Any 双向兼容的类型规则根源。它是有意为之——设计上 Any 表"我不关心类型,什么都可以",故赋予它这种"万能兼容"地位,换取灵活性。

**代价——类型安全漏洞**:`Any <: T` 意味着 Any 值可流入任何 T 位置而检查器放行,即便实际类型不符。这是 §2.4 "逃逸"的类型论根源:

```python
def get() -> Any: return 42   # 实际 int
s: str = get()     # Any <: str,允许。但实际是 int,后续 s.upper() 崩
```

`get()` 返回 Any,因 `Any <: str` 故 `s: str = get()` 合规则通过,但 get 实际返回 int,后续基于 s 是 str 的操作运行时崩——Any 的"万能子类型"让类型错误流过检查器。这是 Any 危险的本质:它的类型规则(与一切互为子类型)注定它会"放松"类型边界。

**与 object 的对比**:object 是所有类型的父类型(`T <: object`),但**不是所有类型的子类型**(`object` 不是 `int <: object` 意义上的"object <: int")。故:

```python
o: object = 42       # int <: object,允许(int → object)
# n: int = o         # object 不是 int 子类型,故 object → int 不允许(mypy 报错)
```

`object → int` mypy 报错——因 object 不是 int 的子类型,不能流入 int 位置。这强制收窄(必须 isinstance 证明才是 int)。这正是 §2.5 的对比根源:**object 只是父类型(向下兼容受阻,强制收窄),Any 是双向万能子类型(全放行)**。理解这条子类型规则差异,就彻底理解 object 安全而 Any 危险的类型论原因。

### 4.3 Literal 的"值类型"实现

`Literal["a", "b"]` 把类型精确到值,这是类型系统从"类型级"到"值级"的下探。其机制:

**Literal 是特殊的 Union,成员是值不是类**:

```python
from typing import Literal, get_args
t = Literal["a", "b"]
print(get_args(t))   # ('a', 'b') —— 成员是字面量值,不是类型对象!
# 对比普通 Union
print(get_args(int | str))   # (<class 'int'>, <class 'str'>) 成员是类
```

`Literal["a","b"]` 的 `get_args` 返回 `('a', 'b')`——值本身,而非类型类。这与普通 Union(成员是类)不同。Literal 本质是"成员为单值类型的 Union",每个值 `'a'` 对应一个"只能取 'a' 的单值类型"。

**单值类型的子类型关系**:字面量 `'a'` 的类型是"只能取 'a'"(称 Literal['a']),它是 `str` 的子类型(因 'a' 是 str 的一个值):

```python
# Literal["a"] <: str(因 "a" 是 str 的值)
s: str = "a"   # 这其实是 Literal["a"](最精确) <: str 的赋值
def f(x: str): ...
f("a")    # "a" 是 Literal["a"],它 <: str,允许传给 str 参数
```

`Literal["a"]` 是 `str` 的子类型(单值 ⊂ 类型)。这让 Literal 能赋给对应的普通类型(`Literal["a"]` → `str`),反之不行(`str` 不一定是 `Literal["a"]`)。这是 Literal 的子类型规则。

**Literal 的收窄机制**:mypy 用值比较收窄 Literal:

```python
def f(x: Literal["a", "b"]) -> int:
    if x == "a":
        # mypy 收窄 x: Literal["a"](从 "a"|"b" 排除 "b")
        return 1
    # else 收窄 x: Literal["b"]
    return 2
```

`if x == "a":` 让 mypy 在分支内把 x 收窄到 `Literal["a"]`(精确到值)。这是值级收窄——比类型级收窄(isinstance)更细。Literal 的检查能力建立在这套"值比较收窄"上。

**Literal 的限制**:

```python
# Literal 只支持 str/int/bool/bytes/None/Enum 字面量,不支持变量
mode = "r"
def f(x: Literal[mode]): ...   # 错!Literal 要字面量,不能是变量
# Literal 不支持 float 字面量(3.8 之前)
# Literal[1.5]   # 旧版不支持,新版部分支持
```

Literal 的成员必须是**字面量常量**(编译期可知),不能是变量(变量值运行时变,非字面)。这是 Literal "编译期可穷举"的前提——myssy 静态检查需在编译期知道所有可能值。这也是 Literal 适合"固定选项"(值确定)不适合"动态值"的原因。

理解 Literal 是"成员为单值类型的 Union",其子类型关系(单值 ⊂ 类型)与值比较收窄,就掌握了"值级类型"的机制。

### 4.4 object 为何强制收窄:类型边界

§2.5 讲了 object 强制收窄,这里讲清其根源——object 类型**只有所有对象共有的接口**。

**object 的接口**:object 是所有类的根基类,它定义的方法(`__str__`/`__repr__`/`__eq__`/`__hash__`/`__init__` 等)是所有对象都有的。但**具体类型的方法**(str 的 `upper`、list 的 `append`、int 的 `+`)**不在 object 接口里**——它们是子类各自的扩展。

```python
def f(x: object):
    # x 类型是 object,只有 object 接口
    str(x)      # OK(__str__ 是 object 接口)
    repr(x)     # OK
    # x.upper()  # mypy 报错:upper 不在 object 接口(是 str 特有)
    # x + 1      # mypy 报错:+ 不在 object 接口(int 特有)
    if isinstance(x, str):
        x.upper()   # 收窄后 x: str,有 upper
```

`x: object` 时,mypy 只允许 object 接口的方法——具体类型的特有方法需先 isinstance 收窄(证明 x 是该子类型)才可用。这就是 object "强制收窄"的根源:**类型决定可用接口,object 的接口最窄(只共有的),故用特有接口必须先收窄到有该接口的子类型**。

**与 Any 的对比**:Any 的"接口"是**无限**(所有操作放行,因 Any 关闭检查),故无需收窄(但危险)。object 的接口是**最窄**(只共有),故必须收窄。这是 object 安全而 Any 危险的接口论根源——object 把"类型未知"具象为"接口最小",迫使你收窄;Any 把"类型未知"伪装为"接口无限",放任操作。

**object 作为容器元素类型**:

```python
mixed: list[object] = [1, "a", True]   # 异构列表,元素是 object
for x in mixed:
    # x: object,操作前收窄
    if isinstance(x, int):
        print(x + 1)
# 对比 list[Any]:元素是 Any,操作放行(危险)
```

`list[object]` 的元素取出是 object(强制收窄),`list[Any]` 的元素是 Any(放行)。前者安全(每次操作都收窄验证),后者危险(操作不验证)。故"异构容器"用 `list[object]` 而非 `list[Any]`。

理解 object 的接口最窄决定强制收窄,就理解了它如何"接受任意但保安全"——这是 object 相对 Any 的核心优势的类型论与接口论双重根基。

### 4.5 Never 的代数性质:吸收元与底类型

§2.6 提到 Never 是 Union 吸收元,这里讲清其在类型代数中的地位——**Never 是底类型(bottom type)**。

**底类型(bottom type)**:类型系统中,底类型是**所有类型的子类型**(永不可达,无实例,故可声称"是任何类型的子类型"而不矛盾)。Never 是 Python 的底类型:

```python
# Never <: T,对任意 T(Never 是所有类型子类型)
def f() -> Never: raise ...
# 因 Never 不可达,它"可以是任何类型"(无实例,不矛盾)
# 这让 Never 能赋值/返回到任何期望类型处
def g(x: int | None) -> str:
    if x is None:
        return fail()   # fail() 返回 Never,Never <: str,故可作 str 返回
    return str(x)
```

`fail()` 返回 Never,因 `Never <: str`,故 `return fail()` 可作 `-> str` 的返回(不可达的 Never 兼容任何目标类型)。这是底类型在控制流中的作用——让"永不返回的调用"能用在任何需要某类型处。

**吸收元(Never 在 Union 中消失)**:因 Never 无实例(不可达),`Union[X, Never]` 等价 `X`(加入"不可能的值"对联合无贡献):

```python
# int | Never == int(Never 被吸收)
def f(x: int | Never) -> int: ...   # 等价 x: int
# 这与 int | int == int(重复吸收)同性质,但 Never 是更强的"空"吸收
```

`X | Never = X`,Never 在 Union 中被吸收。这让 Never 在类型推导里自动消失——例如 `if x is None: fail()` 后,mypy 推断剩余路径的 x 排除了 None(因 None 分支 fail,Never 被吸收),x 变 `int`(从 `int | None` 收窄)。这是 §2.6 收窄的代数根源。

**顶类型与底类型的对称**:

```python
# 顶类型(top):object(所有类型的父类型,T <: object)
# 底类型(bottom):Never(所有类型的子类型,Never <: T)
# 对称:object 接受一切(父),Never 兼容一切(子,但不可达)
# Any:奇怪的"既是顶也是底"(双向万能),破坏了顶/底的清晰(故危险)
```

类型系统有顶类型(object,父类型)和底类型(Never,子类型)的对称结构。Any 是破坏这种对称的"异类"——它同时是顶和底(双向万能),模糊了类型边界,故危险。Never 作为正规底类型,清晰表达"不可达",比 NoReturn 更现代(NoReturn 偏"函数不返回",Never 更通用含"表达式不可达")。

理解 Never 是底类型(所有类型子类型、Union 吸收元),及其与顶类型 object、Any 的对称关系,就掌握了类型系统的代数结构——顶(object)、底(Never)、异类(Any)三者定位清晰,Union/Literal 等构造在这个代数上运作。

---

## 5. 总结

### 5.1 本文内容回顾

- **Union 语义**:表"X 或 Y"或关系,配 isinstance/is None 收窄分支处理;`Union[X,Y]` = `X | Y`(3.10+);代数简化(顺序无关、重复合并、子类吸收、嵌套展平)。
- **Optional**:Union[X,None] 的特例(可空);`Optional[X]` = `X | None` = `Union[X,None]`;单参数;配 `is None`/`is not None` 收窄;`if x:`(排除假值)≠ `if x is not None`(仅排除 None),含 0/'' 的 Optional 注意。
- **Literal**:精确到值的类型;`Literal["a","b"]`;支持 str/int/bool/bytes/None/Enum 字面量(非变量);配值比较收窄;常用于有限选项替代裸 str/Enum;穷尽检查兜底。
- **Any**:任意类型,关闭检查(逃生舱);双向兼容(Any 与一切互为子类型);逃逸污染(Any→具体类型放行,可能错误渗透);来源是动态数据(json.loads)/无注解代码;入口处收窄阻断逃逸;合理用于元编程/动态转发。
- **object vs Any**:object 是顶类型(所有类型父),接口最窄(只共有方法),强制收窄(安全);Any 是双向万能子类型,接口无限(放行,危险);接受任意优先 object。
- **Never/NoReturn**:不可达类型(永不返回);NoReturn(老)偏函数不返回,Never(3.11+)更通用含表达式不可达;Union 吸收元(`X|Never=X`);用于总抛异常函数、穷尽检查 assert_never 兜底、辅助控制流收窄。
- **运行时内省**:`get_args`/`get_origin` 拆解 Union/泛型成员;`int|str` 是 `types.UnionType`(3.10+),与 typing.Union 语义等价但运行时不同对象;`isinstance(x, int|str)` 报 TypeError(用 get_args 逐个或类型元组);`t is Any` 判 Any;`get_type_hints` 解析字符串注解。
- **原理**:`X|Y` 经 `__or__` 产生 `types.UnionType`(3.10+),与 typing.Union 并存(语义等价运行时异构),非元组故 isinstance 不支持;Any 双向兼容源于"与一切互为子类型"规则(既是顶也是底,故危险逃逸);Literal 是"成员为单值类型的 Union",单值 <: 对应类型(如 Literal["a"] <: str),值比较收窄,成员须编译期字面量;object 强制收窄源于接口最窄(只共有的方法,特有方法需收窄);Never 是底类型(所有类型子类型、Union 吸收元),与顶 object 对称,Any 破坏顶/底对称故危险。
- **最佳实践**:能用 Union 不用 Any、接受任意优先 object、Optional 配 is None 注意 0/''、有限选项用 Literal、Any 入口收窄防逃逸、复杂联合用别名、`|` 写法注意版本、isinstance 分支收窄非整体、重载用 Literal 区分、穷尽用 assert_never、cast 慎用逊于 isinstance、NoReturn/Never 标永不返回辅助收窄。

### 5.2 读完本文你应能掌握

- 说明 Union 的"或关系"语义与 isinstance 收窄使用模式,用 `X | Y`/`Union[X,Y]` 标注,阐述代数简化规则。
- 说明 Optional 是 Union[X,None] 特例,用 is None/is not None 收窄,区分 `if x:` 与 `if x is not None:` 对 0/'' 的差异。
- 用 Literal 精确标注有限值选项,用值比较收窄,说明 Literal vs Enum 取舍。
- 说明 Any 的双向兼容与逃逸污染,在动态数据入口收窄 Any 阻断蔓延,阐述 Any 合理用法。
- 深刻对比 object(顶类型、接口最窄、强制收窄、安全)与 Any(双向万能、放行、危险),优先 object 接受任意。
- 用 Never/NoReturn 标注永不返回函数,做穷尽检查 assert_never 兜底与控制流收窄。
- 用 get_args/get_origin 运行时拆解 Union/Any,说明 `int|str` 是 types.UnionType 与 isinstance 限制。
- 阐述 UnionType 运行时表示、Any 双向子类型规则、Literal 单值类型实现、object 接口最窄、Never 底类型与吸收元等原理。

### 5.3 延伸方向

- **TypeVar 泛型**:自定义泛型函数/类、协变逆变、TypeVar 约束,Union/Any 与泛型结合,见《TypeVar 泛型》。
- **类型注解运行时行为**:`get_type_hints` 深入、运行时注解反射、框架(FastAPI/Pydantic)消费 Union/Literal/Any,见《类型注解运行时行为》。
- **mypy 静态检查**:mypy 如何检查 Union 收窄、Any 警告、Literal 穷尽,见《mypy 静态类型检查》。
- **进阶 typing**:Protocol(结构化类型,与 object 鸭子类型对应)、Callable、@overload(与 Literal 配合的多返回)、TypedDict、ParamSpec(传透 Any 签名),见标准库 typing 专题。
- **类型系统理论**:子类型/协变逆变、顶/底类型代数、渐进式类型化的形式化,深入类型论。
