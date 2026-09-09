---
group:
  title: 【01】初识python
  order: 1
order: 11
title: 常量约定
nav:
  title: Python基础
  order: 1
---

# 常量约定

## 1. 介绍

### 1.1 什么是常量约定

在编程中，**常量**（Constant）是一旦定义就不应该被修改的值。例如圆周率 `PI = 3.14159`、最大重试次数 `MAX_RETRY = 3`、应用名称 `APP_NAME = "OrderService"`——这些值在程序运行期间应当保持不变。

在 C/C++、Java 等语言中，有 `const`、`final` 等关键字来声明常量，编译器会在编译阶段拦截对常量的修改。但 Python **没有** `const` 关键字，变量的赋值本质上没有"只读"属性。因此 Python 社区通过一套**约定**来模拟常量行为，配合类型注解和静态检查工具来实现"事实上的常量"。

这套约定包括：

- **命名约定**：全大写字母 + 下划线分隔，如 `MAX_RETRY`、`PAGE_SIZE`
- **类型注解**：用 `typing.Final` 标注，让静态检查器（mypy、Ruff）拦截误改
- **运行时保护**：用 `Enum`、`frozen dataclass`、`tuple`、`frozenset` 等语言机制提供运行时不可变性

### 1.2 为什么 Python 需要常量约定

假设你在代码里多次使用数字 `10000` 来判断"大额订单"：

```python
def process_order(order):
    if order["amount"] > 10000:
        order["priority"] = "high"
    # ...
    if order["amount"] > 10000:
        order["flag"] = "large"
```

这里的 `10000` 就是**魔法数**（Magic Number）——读代码的人不知道它代表什么含义。如果业务需求变更，阈值从 10000 改为 15000，你需要全文搜索每一处 `10000`，逐个判断是不是"大额订单阈值"再决定是否修改。漏改或多改都会引入 bug。

用常量替代魔法数：

```python
LARGE_ORDER_THRESHOLD = 10000

def process_order(order):
    if order["amount"] > LARGE_ORDER_THRESHOLD:
        order["priority"] = "high"
    # ...
    if order["amount"] > LARGE_ORDER_THRESHOLD:
        order["flag"] = "large"
```

改阈值只需修改一处定义。常量让代码**自解释**——`LARGE_ORDER_THRESHOLD` 这个名字本身就说明了它的含义。

Python 没有编译期常量保护，全靠约定和工具链。这套约定虽不是强制的，但它是 Python 工程实践中非常重要的编码规范。正确使用常量约定能显著提升代码的可读性、可维护性和安全性。

### 1.3 最简示例

最基础的常量写法——全大写命名 + 模块顶部集中定义：

```python
# 常量定义在模块顶部，全大写命名
APP_NAME = "OrderService"
MAX_RETRY = 3
PI = 3.14159

# 使用时直接引用常量名
print(f"应用: {APP_NAME}")
print(f"重试: {MAX_RETRY} 次")
print(f"圆面积: {PI * 5 ** 2:.4f}")
```

```text
应用: OrderService
重试: 3 次
圆面积: 78.5397
```

注意：Python 运行时**不会阻止**你对 `MAX_RETRY = 100` 重新赋值——全大写命名只是"君子协定"。要获得更强的保护，需要用 `Final` 类型注解配合静态检查器，或用 `Enum`、`frozen dataclass` 等运行时机制。

## 2. 核心内容

### 2.1 模块级常量：全大写命名 + Final 类型注解

模块级常量是 Python 中最常见的常量形式。核心做法是把所有常量集中定义在模块顶部，用**全大写 + 下划线**命名，配合 `Final` 类型注解。

**命名约定规则**

| 规则 | 示例 | 说明 |
|------|------|------|
| 全大写 + 下划线分隔 | `MAX_RETRY`、`PAGE_SIZE` | 与变量（小写）视觉区分 |
| 常量名应语义化 | `LARGE_ORDER_THRESHOLD` 而非 `THRESHOLD1` | 名字即文档 |
| 带单位时在名称中体现 | `CONNECTION_TIMEOUT_SECONDS` 而非 `CONNECTION_TIMEOUT` | 消除秒/毫秒歧义 |
| 布尔常量用 is/has 前缀 | `DEBUG`、`IS_PRODUCTION` | 表明布尔语义 |

**Final 类型注解**

`typing.Final` 是 Python 3.8 引入的类型注解，告诉静态检查器"这个变量不应被重新赋值"：

```python
from typing import Final

# Final 标注 + 赋初值
APP_NAME: Final[str] = "OrderService"
APP_VERSION: Final[str] = "1.0.0"
MAX_RETRY: Final[int] = 3
PAGE_SIZE: Final[int] = 20
LARGE_ORDER_THRESHOLD: Final[float] = 10000.0
```

**示例**

一个完整的配置常量模块，集中定义应用所需的全部常量：

```python
import os
from dataclasses import dataclass
from typing import Final


# === 应用信息 ===
APP_NAME: Final[str] = "OrderService"
APP_VERSION: Final[str] = "1.0.0"
# 环境变量驱动：不同环境用不同配置，代码不变
DEBUG: Final[bool] = os.getenv("DEBUG", "false").lower() == "true"

# === 数据库 ===
DATABASE_URL: Final[str] = os.getenv(
    "DATABASE_URL", "postgresql://localhost/orders"
)
MAX_CONNECTIONS: Final[int] = 10
CONNECTION_TIMEOUT_SECONDS: Final[int] = 30  # 带单位，消除秒/毫秒歧义

# === 业务阈值 ===
MAX_RETRY: Final[int] = 3
LARGE_ORDER_THRESHOLD: Final[float] = 10000.0
PAGE_SIZE: Final[int] = 20
```

**运行结果**（读取并打印这些常量）：

```python
print(f"  APP_NAME = {APP_NAME}")
print(f"  APP_VERSION = {APP_VERSION}")
print(f"  DEBUG = {DEBUG}")
print(f"  DATABASE_URL = {DATABASE_URL}")
print(f"  MAX_RETRY = {MAX_RETRY}, PAGE_SIZE = {PAGE_SIZE}")
```

```text
APP_NAME = OrderService
APP_VERSION = 1.0.0
DEBUG = False
DATABASE_URL = postgresql://localhost/orders
MAX_RETRY = 3, PAGE_SIZE = 20
```

**关键点说明**

- 全大写命名是**纯自觉**——运行时不拦截修改。`MAX_RETRY = 100` 能正常执行，不会报错。不可变性靠 Final + mypy/Ruff 静态检查保证。
- `Final` 注解只在**静态检查**阶段生效：如果你写 `MAX_RETRY = 100` 重新赋值，mypy 会报 `Cannot assign to final name "MAX_RETRY"`，但 Python 解释器运行时不会拦截。
- 常量名带单位（如 `_SECONDS`、`_MS`、`_KB`）能消除歧义。`CONNECTION_TIMEOUT = 30` 让读者猜不出是秒还是毫秒，`CONNECTION_TIMEOUT_SECONDS = 30` 一目了然。
- 环境变量驱动的常量适合不同部署环境：开发环境 `DEBUG=true`，生产环境 `DEBUG=false`，代码不需要改，只改环境变量。

### 2.2 类级常量：与类语义绑定的常量

当常量与某个类的语义强相关时，把它作为**类属性**定义在类内部，而不是放在模块顶部。这样常量和类在同一个位置，修改时不用满文件找。

**何时用类级常量**

| 场景 | 示例 | 说明 |
|------|------|------|
| 数学/物理常量 | `Circle.PI`、`Earth.GRAVITY` | 与类公式强相关 |
| 角色常量 | `User.ROLE_ADMIN`、`User.ROLE_VIEWER` | 角色值与用户类绑定 |
| 状态常量 | `Order.STATUS_PENDING` | 状态与订单类绑定 |
| 配置常量 | `HttpClient.MAX_TIMEOUT` | 默认配置与类绑定 |

**示例**

```python
class Circle:
    """圆——PI 是数学常量，与圆的公式强相关。"""

    PI = 3.14159  # 类常量，所有实例共享

    def __init__(self, radius):
        self.radius = radius  # 实例属性，每实例不同、可变

    def area(self):
        # 约定用类访问 Circle.PI，而非 self.PI
        return Circle.PI * self.radius ** 2

    def circumference(self):
        return 2 * Circle.PI * self.radius


class User:
    ROLE_ADMIN = "admin"   # 类常量
    ROLE_EDITOR = "editor"
    ROLE_VIEWER = "viewer"

    def __init__(self, name, role):
        self.name = name  # 实例属性
        self.role = role
```

**运行结果**：

```python
c = Circle(5)
print(f"  Circle.PI = {Circle.PI}（类访问）")
print(f"  Circle(5).area() = {c.area():.4f}")
print(f"  Circle(5).circumference() = {c.circumference():.4f}")

admin = User("张三", User.ROLE_ADMIN)
print(f"  User.ROLE_ADMIN = {User.ROLE_ADMIN}")
print(f"  用户 {admin.name} 角色: {admin.role}")
```

```text
Circle.PI = 3.14159（类访问）
Circle(5).area() = 78.5397
Circle(5).circumference() = 31.4159
User.ROLE_ADMIN = admin
用户 张三 角色: admin
```

**关键点说明**

- 类常量用**类名访问**（`Circle.PI`），而非实例访问（`self.PI`）。通过类名访问明确表达"这是一个常量"，通过 `self.PI` 访问会让人误以为是实例属性。
- 类常量被所有实例共享，内存中只有一份。实例属性（如 `self.radius`）每实例独立。
- 类常量同样可以被运行时修改（`Circle.PI = 4` 不会报错），Final 注解和静态检查同样适用。
- 当角色常量数量较多或需要迭代时，更适合用 Enum（见 2.3 节）。

### 2.3 Enum 枚举：运行时只读的常量

当一组常量属于同一个有限集合（如订单状态有 4 种：待处理、处理中、成功、失败），用 `Enum` 比"一堆全大写变量"更合适。Enum 是 Python 标准库提供的枚举类型，最大的优势是**运行时只读**——由元类强制执行，试图修改枚举成员会抛 `AttributeError`。

**Enum vs 全大写常量**

| 维度 | 全大写常量 | Enum |
|------|----------|------|
| 运行时保护 | 无，纯自觉 | 有，元类强制只读 |
| 成员可迭代 | 不行 | 可以，`for s in OrderStatus` |
| 按名取值 | 不直接支持 | `OrderStatus['PENDING']` |
| 按值取名 | 不直接支持 | `OrderStatus('pending')` |
| 分组明确 | 散落在模块中 | 集中在类内 |
| 适合场景 | 独立常量 | 一组相关常量 |

**示例**

定义订单状态和优先级枚举：

```python
from enum import Enum, auto


class OrderStatus(Enum):
    """订单状态枚举（一组有限命名取值）。"""

    PENDING = "pending"        # 已创建，待处理
    PROCESSING = "processing"  # 处理中
    SUCCESS = "success"        # 成功
    FAILED = "failed"          # 失败，含 error 字段


class UserRole(Enum):
    """用户角色枚举。"""

    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"


class Priority(Enum):
    """订单优先级，用 auto() 自动编号。"""

    LOW = auto()     # 1
    NORMAL = auto()  # 2
    HIGH = auto()    # 3
```

**运行结果**（访问枚举成员）：

```python
order_status = OrderStatus.PENDING
print(f"  订单状态: {order_status.name} = {order_status.value}")

# Enum 可迭代、按名取、按值取
print(f"  所有状态: {[s.name for s in OrderStatus]}")
print(f"  按名取 OrderStatus['SUCCESS'] = {OrderStatus['SUCCESS'].value}")
print(f"  按值取 OrderStatus('failed') = {OrderStatus('failed').name}")

# 运行时强制只读：试图改成员抛 AttributeError
try:
    OrderStatus.PENDING = "x"
except AttributeError as e:
    print(f"  AttributeError: {e}")

# 试图改成员值也抛 AttributeError
try:
    OrderStatus.PENDING.value = "x"
except AttributeError as e:
    print(f"  AttributeError: {e}")

print(f"  Priority 自动编号: LOW={Priority.LOW.value}, "
      f"NORMAL={Priority.NORMAL.value}, HIGH={Priority.HIGH.value}")
```

```text
订单状态: PENDING = pending
所有状态: ['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED']
按名取 OrderStatus['SUCCESS'] = success
按值取 OrderStatus('failed') = FAILED
AttributeError: cannot reassign member 'PENDING'
AttributeError: <enum 'Enum'> cannot set attribute 'value'
Priority 自动编号: LOW=1, NORMAL=2, HIGH=3
```

**关键点说明**

- `OrderStatus.PENDING` 是一个枚举成员对象，`.name` 返回成员名（`"PENDING"`），`.value` 返回成员值（`"pending"`）。
- `auto()` 自动从 1 开始递增编号（不是从 0），适合不需要特定值的场景。
- Enum 的只读性是**运行时强制**的，不是约定——这比全大写常量更强。`OrderStatus.PENDING = "x"` 直接抛 `AttributeError`。
- `OrderStatus('pending')` 可以通过值反查到枚举成员，全大写常量做不到这种反向查找。
- 枚举成员是**单例**——`OrderStatus.PENDING is OrderStatus.PENDING` 返回 `True`，可以用 `is` 判断身份。

### 2.4 frozen dataclass：不可变结构化常量

当常量是一组相关的配置项（如 HTTP 客户端的超时、重试次数、User-Agent），用一个结构化的对象来表达比分散的变量更清晰。`@dataclass(frozen=True)` 创建的**冻结数据类**让实例属性不可修改——试图赋值会抛 `FrozenInstanceError`。

**frozen vs 普通 dataclass**

| 维度 | 普通 dataclass | frozen dataclass |
|------|--------------|-----------------|
| 实例属性可修改 | 可以 | 不可以，抛 FrozenInstanceError |
| 可哈希 | 不一定 | 是，可做 dict 键 |
| 适合场景 | 可变数据对象 | 不可变配置常量 |
| 安全性 | 运行时可被篡改 | 运行时只读 |

**示例**

定义 HTTP 配置常量：

```python
from dataclasses import dataclass
from typing import Final


@dataclass(frozen=True)
class HttpConfig:
    """HTTP 客户端不可变配置。

    frozen=True 让实例属性不可改，改属性抛 FrozenInstanceError，
    适合"一组配置常量"作为不可变对象。
    """

    timeout_seconds: int = 30
    retry: int = 3
    user_agent: str = "OrderService/1.0"


# 全局 HTTP 配置常量，frozen 实例不可改
HTTP: Final[HttpConfig] = HttpConfig()
```

**运行结果**（验证不可变性）：

```python
print(f"  HTTP 配置默认: timeout={HTTP.timeout_seconds}s, retry={HTTP.retry}")
print("  尝试改 frozen 属性 HTTP.timeout_seconds = 60 ...")
try:
    HTTP.timeout_seconds = 60
except AttributeError as e:
    # FrozenInstanceError 是 AttributeError 的子类
    print(f"  -> {type(e).__name__}: {e}")
```

```text
HTTP 配置默认: timeout=30s, retry=3
尝试改 frozen 属性 HTTP.timeout_seconds = 60 ...
-> FrozenInstanceError: cannot assign to field 'timeout_seconds'
```

**关键点说明**

- `frozen=True` 让 dataclass 的 `__setattr__` 和 `__delattr__` 被拦截，任何对实例属性的赋值或删除都会抛 `FrozenInstanceError`（`AttributeError` 的子类）。
- frozen 实例是**可哈希**的（普通 dataclass 不一定），可以用作 dict 的键或放入 set 中。
- 适合表达"一组不可变配置"——比如 HTTP 配置、数据库配置、业务参数配置。
- `Final` 和 `frozen` 搭配使用：`Final` 防止 `HTTP` 变量被重新赋值，`frozen` 防止 `HTTP.timeout_seconds` 被修改。双重保护。

### 2.5 namedtuple：轻量不可变记录

`collections.namedtuple` 是另一种创建不可变记录的方式。它比 dataclass 更轻量，不需要定义类，适合简单的固定字段记录。

**示例**

```python
from collections import namedtuple

# 定义一个 Point 命名元组，有 x、y 两个字段
Point = namedtuple("Point", ["x", "y"])
p = Point(3, 4)

print(f"  Point(3, 4): x={p.x}, y={p.y}")
print("  尝试改 namedtuple 字段 p.x = 10 ...")
try:
    p.x = 10
except AttributeError as e:
    print(f"  -> AttributeError: {e}")
```

```text
Point(3, 4): x=3, y=4
尝试试改 namedtuple 字段 p.x = 10 ...
-> AttributeError: can't set attribute
```

**namedtuple vs frozen dataclass**

| 维度 | namedtuple | frozen dataclass |
|------|-----------|-----------------|
| 定义方式 | `namedtuple("Name", [...])` | `@dataclass(frozen=True)` |
| 类型注解 | 不支持（Python < 3.6 typing.NamedTuple 支持） | 原生支持 |
| 默认值 | `defaults` 参数 | 字段直接赋默认值 |
| 方法 | 继承 tuple 全部方法 | 自动生成 `__init__`、`__repr__` 等 |
| 解包 | 支持（元组解包） | 不直接支持 |
| 适合场景 | 轻量记录、兼容旧代码 | 结构化配置常量 |
| 内存开销 | 更小（C 实现） | 略大 |

**选择建议**：新代码优先用 `dataclass(frozen=True)`，类型注解更自然、功能更完整；需要与 tuple 兼容或需要迭代/解包时用 `namedtuple`。

### 2.6 tuple 与 frozenset：不可变集合常量

当常量是一个集合（如支持的语言列表、允许的来源域名），用不可变集合类型 `tuple` 和 `frozenset` 而非 `list` 和 `set`。这样可以防止运行时被误 `append`、`add` 等操作修改。

**list vs tuple vs set vs frozenset**

| 集合类型 | 可变性 | 可哈希 | 适合场景 |
|---------|--------|--------|---------|
| `list` | 可变 | 否 | 运行时动态增删的场景 |
| `tuple` | 不可变 | 是 | 固定顺序的不可变序列 |
| `set` | 可变 | 否 | 需要去重和集合运算 |
| `frozenset` | 不可变 | 是 | 固定成员的不可变集合，可做 dict 键 |

**示例**

定义不可变集合常量：

```python
from typing import Final

# 用 tuple 而非 list，防止运行时被误 append
SUPPORTED_LANGUAGES: Final[tuple[str, ...]] = ("zh", "en", "ja")
# frozenset 不可变且可哈希，能做 dict 键
ALLOWED_ORIGINS: Final[frozenset[str]] = frozenset(
    {"https://app.example.com", "https://admin.example.com"}
)
```

**运行结果**：

```python
langs = SUPPORTED_LANGUAGES
origins = ALLOWED_ORIGINS
print(f"  tuple: {langs}")
print(f"  frozenset: {origins}")

# tuple 结构不可变：没有 append 方法
print("  尝试 tuple.append (不可变，无此方法)...")
print(f"  hasattr(langs, 'append') = {hasattr(langs, 'append')}")

# 但元素若可变，元素内容仍可改——容器不可变 ≠ 元素不可变
nested = ([1, 2], [3, 4])
print(f"  含 list 的 tuple: {nested}")
nested[0].append(99)
print(f"  nested[0].append(99) 后: {nested}（tuple 内的 list 被改了！）")

# frozenset 可哈希，能做 dict 键——set 不行
cache = {origins: "ok"}
print(f"  frozenset 做 dict 键: {cache}")
```

```text
tuple: ('zh', 'en', 'ja')
frozenset: frozenset({'https://app.example.com', 'https://admin.example.com'})
尝试 tuple.append (不可变，无此方法)...
hasattr(langs, 'append') = False
含 list 的 tuple: ([1, 2], [3, 4])
nested[0].append(99) 后: ([1, 2, 99], [3, 4])（tuple 内的 list 被改了！）
frozenset 做 dict 键: {frozenset({'https://app.example.com', 'https://admin.example.com'}): 'ok'}
```

**关键点说明**

- `tuple` 不可变指的是**结构不可变**——不能 `append`、不能 `del`、不能通过索引替换元素引用。但如果 tuple 内的元素本身是可变对象（如 `list`），你仍然可以修改那个可变对象的内容。所以"tuple 不可变"精确地说应该是"tuple 不可重新绑定元素引用"，而非"tuple 内所有内容都不可变"。
- `frozenset` 和 `set` 的区别就是可变性。`frozenset` 是可哈希的，所以它可以做 dict 的键或放入另一个 set 中。`set` 不可哈希，不能做 dict 键。
- 版本提示：`tuple[str, ...]` 和 `frozenset[str]` 这种内置泛型注解需要 Python 3.9+。3.8 及以下需要用 `typing.Tuple` 和 `typing.FrozenSet`。
- 什么时候用 tuple，什么时候用 frozenset？——需要保持顺序且有重复值用 tuple，需要去重和成员判断用 frozenset。

### 2.7 常量与魔法数：消除散落的硬编码值

**魔法数**（Magic Number）是代码中直接出现的、没有解释含义的数字或字符串。它们像"魔法"一样凭空出现，读代码的人必须猜测含义。用常量替代魔法数是常量约定最核心的应用场景之一。

**什么是魔法数**

```python
# 魔法数满天飞的代码
def process_order(order):
    if order["status"] == "pending":       # "pending" 是魔法字符串
        if order["amount"] > 10000:        # 10000 是魔法数——大额阈值？
            order["priority"] = "high"     # "high" 是魔法字符串
    if order["retry"] > 3:                 # 3 是魔法数——最大重试？
        order["status"] = "failed"        # "failed" 是魔法字符串
    return order
```

每处魔法数和魔法字符串都需要猜测含义。修改阈值需要全文搜索，容易遗漏。

**用常量替代**

```python
from enum import Enum, auto


class OrderStatus(Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SUCCESS = "success"
    FAILED = "failed"


class Priority(Enum):
    LOW = auto()
    NORMAL = auto()
    HIGH = auto()


# 业务阈值常量
MAX_RETRY = 3
LARGE_ORDER_THRESHOLD = 10000.0


def process_order(order):
    if order["status"] == OrderStatus.PENDING.value:
        if order["amount"] > LARGE_ORDER_THRESHOLD:
            order["priority"] = Priority.HIGH.name
        if order["retry"] > MAX_RETRY:
            order["status"] = OrderStatus.FAILED.value
    return order
```

**重构前后对比**

```python
order = {"status": "pending", "amount": 15000, "retry": 1, "priority": "normal"}

# 重构前：魔法数/字符串满天飞，读时要猜含义
def process_order_bad(order):
    if order["status"] == "pending":
        if order["amount"] > 10000:
            order["priority"] = "high"
    if order["retry"] > 3:
        order["status"] = "failed"
    return order

# 重构后：常量化，自解释
def process_order_good(order):
    if order["status"] == OrderStatus.PENDING.value:
        if order["amount"] > LARGE_ORDER_THRESHOLD:
            order["priority"] = Priority.HIGH.name
        if order["retry"] > MAX_RETRY:
            order["status"] = OrderStatus.FAILED.value
    return order

order = {"status": "pending", "amount": 15000, "retry": 1, "priority": "normal"}
result = process_order_good(order)
print(f"  原始订单: {order}")
print(f"  处理后: {order}")
```

```text
原始订单: {'status': 'pending', 'amount': 15000, 'retry': 1, 'priority': 'normal'}
处理后: {'status': 'pending', 'amount': 15000, 'retry': 1, 'priority': 'HIGH'}
```

**关键点说明**

- 重构后每处值的含义一目了然——`LARGE_ORDER_THRESHOLD` 替代了 `10000`，`MAX_RETRY` 替代了 `3`，`OrderStatus.PENDING.value` 替代了散落的 `"pending"` 字符串。
- 修改阈值时只需改常量定义一处，不需要全文搜索。比如把大额阈值从 10000 改为 15000，只需改 `LARGE_ORDER_THRESHOLD = 15000.0`。
- Enum 相比普通字符串常量还有一个额外好处：拼写检查。如果你把 `"pending"` 误写为 `"pendign"`，运行时可能不会报错但逻辑不对。而 `OrderStatus.PENDIGNGN` 会在 import 时直接抛 `AttributeError`，立即暴露错误。

### 2.8 可变常量作默认参数的陷阱

这是 Python 中一个非常经典的坑。当你把一个**可变对象**（如 list、dict、set）作为常量，并用作函数的默认参数时，多次调用会**共享同一对象**，导致数据累积。

**陷阱演示**

```python
# 陷阱：可变常量作默认参数，多次调用共享同一对象
DEFAULT_TAGS = ["new"]  # 可变常量（本身就不该用 list 当常量）

def create_user_bad(name, tags=DEFAULT_TAGS):
    tags.append("new")
    return {"name": name, "tags": tags}

user_a = create_user_bad("alice")
user_b = create_user_bad("bob")
print(f"  陷阱: user_a = {user_a}")
print(f"  陷阱: user_b = {user_b}（累积了 alice 的标签！）")
```

```text
陷阱: user_a = {'name': 'alice', 'tags': ['new', 'new', 'new']}
陷阱: user_b = {'name': 'bob', 'tags': ['new', 'new', 'new']}（累积了 alice 的标签！）
```

`user_b` 的 tags 里竟然有 alice 的标签！原因是 Python 的函数默认参数在**函数定义时创建一次**，之后所有调用共享这同一个对象。`tags.append("new")` 修改的是这同一个 list，每次调用都会往里面加一个 `"new"`。

**修复方案**

**方案一：None 哨兵 + 函数内创建新对象**

```python
def create_user_good(name, tags=None):
    if tags is None:
        tags = []       # 每次调用创建新 list
    tags.append("new")
    return {"name": name, "tags": tags}

user_c = create_user_good("charlie")
user_d = create_user_good("diana")
print(f"  修复: user_c = {user_c}")
print(f"  修复: user_d = {user_d}（各自独立）")
```

```text
修复: user_c = {'name': 'charlie', 'tags': ['new']}
修复: user_d = {'name': 'diana', 'tags': ['new']}（各自独立）
```

**方案二：tuple 常量做默认参数**

如果默认值本身是固定的不可变集合，直接用 `tuple`：

```python
# 规则：常量集合用 tuple（不可变，可作安全默认参数）
SAFE_DEFAULT_LANGS = ("zh",)  # tuple 不可变

def set_langs(langs=SAFE_DEFAULT_LANGS):
    return list(langs)  # 函数内转 list 使用，不修改常量

print(f"  tuple 常量作默认参数: set_langs() = {set_langs()}")
```

```text
tuple 常量作默认参数: set_langs() = ['zh']
```

**关键点说明**

- 根本原因：Python 函数默认参数在 `def` 执行时求值一次，之后共享。这是 Python 的设计决策，不是 bug。
- 集合常量用 `tuple` / `frozenset` 而非 `list` / `set`，从根源上避免可变默认参数陷阱。
- 用 `None` 哨兵是处理"需要可变默认值"的标准模式——函数内判断 `is None` 后创建新对象。
- `is None` 而非 `== None`：`is` 判断身份（同一个对象），`==` 可能被重载。用 `is None` 更安全更快。

## 3. 最佳实践

### 3.1 推荐 vs 不推荐写法对比

| 维度 | 不推荐 | 推荐 | 原因 |
|------|--------|------|------|
| 命名 | `max_retry = 3` | `MAX_RETRY: Final[int] = 3` | 大写+Final 让常量一眼可辨 |
| 位置 | 函数内部散落定义 | 模块顶部集中定义 | 集中管理，修改一处生效 |
| 集合常量 | `TAGS = ["new"]` | `TAGS = ("new",)` | tuple 不可变，防误改 |
| 魔法数 | `if amount > 10000:` | `if amount > LARGE_ORDER_THRESHOLD:` | 自解释，改一处 |
| 状态字符串 | `status = "pending"` | `status = OrderStatus.PENDING.value` | 防拼写错误，可迭代 |
| 配置式常量 | 散落多个变量 | `frozen dataclass` 集中 | 结构化、不可变 |
| 默认参数 | `def f(x, tags=[]):` | `def f(x, tags=None)` 或 `tags=()` | 避免共享可变对象 |
| 单位 | `TIMEOUT = 30` | `TIMEOUT_SECONDS = 30` | 消除秒/毫秒歧义 |
| 类内访问 | `self.PI` | `Circle.PI` | 表明是类常量非实例属性 |

### 3.2 常量定义的分层策略

实际项目中的常量不是一股脑全放一个文件，而是按层次组织：

```text
常量分层架构：

┌─────────────────────────────────────────┐
│  环境变量 (.env / os.environ)            │
│  → 不同部署环境不同值，代码不变            │
│  → DATABASE_URL、DEBUG、SECRET_KEY        │
├─────────────────────────────────────────┤
│  全局配置常量 (config.py 模块)             │
│  → 应用级常量，全项目共享                  │
│  → APP_NAME、MAX_RETRY、HTTP 配置         │
├─────────────────────────────────────────┤
│  类级常量 (类内部)                        │
│  → 与类语义绑定的常量                      │
│  → Circle.PI、User.ROLE_ADMIN             │
├─────────────────────────────────────────┤
│  枚举常量 (enums.py 模块)                 │
│  → 一组相关命名取值                        │
│  → OrderStatus、Priority、UserRole        │
├─────────────────────────────────────────┤
│  函数内局部常量                           │
│  → 仅当前函数使用的魔法数常量化             │
│  → 作用域最小，不暴露给外部                 │
└─────────────────────────────────────────┘
```

**分层原则**：

- **作用域最小化**：只在当前函数使用的值，定义为函数内局部常量；跨模块共享的才提升到模块级。
- **环境变量优先**：部署相关的常量（数据库 URL、密钥、调试开关）用环境变量驱动，不要硬编码在代码里。
- **枚举合一**：一组相关的命名常量用 Enum 集中管理，而不是散落的多个 `Final` 变量。
- **配置集中**：应用级常量集中在一个配置模块中，其他模块通过 `from config import XXX` 引用，不要各自重复定义。

### 3.3 常见错误模式及修正

**错误模式一：用 list/dict/set 当常量**

```python
# 不推荐：用 list 当常量，可被运行时修改
SUPPORTED_LANGS = ["zh", "en", "ja"]
SUPPORTED_LANGS.append("ko")  # 运行时不报错，但常量被意外修改了
```

```python
# 推荐：用 tuple，运行时不可变
SUPPORTED_LANGS: Final[tuple[str, ...]] = ("zh", "en", "ja")
```

**错误模式二：魔法数不消除**

```python
# 不推荐：魔法数散落
if user["age"] >= 18:
    process()
if len(data) > 100:
    truncate(data)
```

```python
# 推荐：常量化
ADULT_AGE_THRESHOLD = 18
MAX_DATA_SIZE = 100

if user["age"] >= ADULT_AGE_THRESHOLD:
    process()
if len(data) > MAX_DATA_SIZE:
    truncate(data)
```

**错误模式三：可变默认参数**

```python
# 不推荐：list 做默认参数，多次调用共享
def add_item(item, items=[]):
    items.append(item)
    return items
```

```python
# 推荐方案 A：None 哨兵
def add_item(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items

# 推荐方案 B：tuple 做默认参数（适合不需修改默认值的场景）
DEFAULT_ITEMS = ()
def add_item(item, items=DEFAULT_ITEMS):
    return list(items) + [item]
```

**错误模式四：Final 不初始化**

```python
# 不推荐：Final 不赋初值，静态检查器无法推断类型
MAX_SIZE: Final  # 缺少初值，Final 失去意义
MAX_SIZE = 100    # 这行赋值在运行时正常，但 Final 的保护被打折
```

```python
# 推荐：Final 声明和赋值放一起
MAX_SIZE: Final[int] = 100
```

**错误模式五：枚举和普通常量混用**

```python
# 不推荐：同一类常量有的用 Enum，有的用 Final
STATUS_PENDING = "pending"
STATUS_PROCESSING = "processing"

class OrderStatus(Enum):
    SUCCESS = "success"
    FAILED = "failed"
```

```python
# 推荐：统一用 Enum 集中管理
class OrderStatus(Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SUCCESS = "success"
    FAILED = "failed"
```

## 4. 原理：Python 为什么没有 const 关键字

### 4.1 Python 的变量模型

理解 Python 为什么没有 `const` 关键字，需要先理解 Python 的变量模型。

在 C 语言中，变量是内存中一块有名字的区域，`const int x = 5` 声明这块内存为只读。在 Python 中，**变量不是内存盒子，而是名字标签**。赋值 `x = 5` 是把名字 `x` 绑定到对象 `5`，而不是把 `5` 放进 `x` 这个盒子。

```python
x = 5       # 名字 x 绑定到 int 对象 5
x = 10      # 名字 x 重新绑定到 int 对象 10
            # 对象 5 本身没有变，只是名字 x 不再指向它
```

因为"变量赋值"本质上是"重新绑定名字"，在 Python 中实现 `const` 就意味着"禁止某个名字重新绑定到其他对象"。这与 Python 的名字绑定模型不太契合——Python 的赋值语句太灵活了，几乎可以出现在任何地方。

Python 社区曾经多次讨论过引入 `const` 关键字（参见 PEP 讨论记录），但最终都没有采纳。核心原因：

- Python 是动态语言，运行时编译执行，`const` 的编译期保护意义有限
- `Final` 类型注解 + 静态检查器（mypy、Ruff）可以实现"开发期保护"，满足大部分需求
- Enum、frozen dataclass 等机制提供了**运行时强制**的不可变性，弥补了 Final 的运行时空白

### 4.2 Final 的静态检查机制

`typing.Final` 不是运行时强制机制，它是一个**类型注解标记**。工作原理如下：

```text
Final 的工作流程：

开发者代码                    静态检查器（mypy/Ruff）              Python 运行时
───────────                  ─────────────────────             ─────────────
MAX_RETRY: Final = 3   →   记录: MAX_RETRY 是 Final    →    正常绑定: MAX_RETRY = 3
                                                            (运行时不做检查)

MAX_RETRY = 100         →   报错: Cannot assign to    →    正常执行: MAX_RETRY = 100
                             final name "MAX_RETRY"        (运行时允许!)
```

**mypy 检查示例**

假设有以下代码 `demo.py`：

```python
from typing import Final

MAX_RETRY: Final[int] = 3
MAX_RETRY = 10  # 试图修改 Final 变量
```

运行 mypy 检查：

```bash
mypy demo.py
```

```text
demo.py:4: error: Cannot assign to final name "MAX_RETRY"  [misc]
Found 1 error in 1 file (checked 1 source file)
```

mypy 在静态分析阶段发现了对 Final 变量的重新赋值并报错。但如果你直接 `python demo.py` 运行，不会报错——Python 运行时完全忽略 `Final` 注解。

**这意味着什么**

- `Final` 的保护只在**开发期**奏效——你必须在 CI/CD 流水线中集成 mypy/Ruff 检查，才能拦截 Final 变量被修改。
- 如果只在运行时保护，需要用 Enum、frozen dataclass 等机制。
- `Final` 防止的是**名字重新绑定**（`MAX_RETRY = 10`），不是对象内容修改。如果 Final 变量绑定的是可变对象（如 `Final[list] = [1, 2]`），你仍然可以 `append` 修改其内容。所以要搭配不可变集合使用。

### 4.3 Enum 的元类只读强制

Enum 的运行时只读性来自其**元类** `EnumMeta`。当你定义 `class OrderStatus(Enum)` 时，Python 使用 `EnumMeta` 创建这个类。`EnumMeta` 在类创建过程中做了以下事情：

```text
EnumMeta 的只读机制：

1. 类创建时：
   class OrderStatus(Enum):
       PENDING = "pending"
   → EnumMeta 将 PENDING 转换为枚举成员对象
   → 设置 OrderStatus.PENDING 指向该成员对象

2. 防止重新赋值成员：
   OrderStatus.PENDING = "x"
   → EnumMeta.__setattr__ 拦截
   → 抛出 AttributeError: cannot reassign member 'PENDING'

3. 防止修改成员属性：
   OrderStatus.PENDING.value = "x"
   → 成员对象没有 __dict__ 或 __setattr__ 被拦截
   → 抛出 AttributeError: <enum 'Enum'> cannot set attribute 'value'

4. 防止删除成员：
   del OrderStatus.PENDING
   → EnumMeta.__delattr__ 拦截
   → 抛出 AttributeError
```

**验证性代码**

可以通过检查 Enum 的内部机制来理解其工作原理：

```python
from enum import Enum

class Color(Enum):
    RED = 1
    GREEN = 2

# 查看枚举成员的类型
print(f"  Color.RED 类型: {type(Color.RED)}")
print(f"  Color.RED.name: {Color.RED.name}")
print(f"  Color.RED.value: {Color.RED.value}")

# 查看是否有 __dict__（枚举成员通常没有可写 __dict__）
print(f"  Color.RED.__dict__: {vars(Color.RED) if hasattr(Color.RED, '__dict__') else 'N/A'}")

#枚举成员是单例
print(f"  Color.RED is Color.RED: {Color.RED is Color.RED}")
print(f"  Color.RED is Color['RED']: {Color.RED is Color['RED']}")
print(f"  Color.RED is Color(1): {Color.RED is Color(1)}")
```

```text
Color.RED 类型: <enum 'Color'>
Color.RED.name: RED
Color.RED.value: 1
Color.RED.__dict__: N/A
Color.RED is Color.RED: True
Color.RED is Color['RED']: True
Color.RED is Color(1): True
```

### 4.4 frozen dataclass 的 __setattr__ 拦截

`@dataclass(frozen=True)` 的不可变性是通过拦截 `__setattr__` 和 `__delattr__` 实现的。当你设置了 `frozen=True`，dataclass 装饰器会自动生成以下方法：

```text
frozen dataclass 的拦截机制：

实例属性赋值:
  config.timeout_seconds = 60
  → 触发 __setattr__('timeout_seconds', 60)
  → 生成的 __setattr__ 抛出 FrozenInstanceError
  → AttributeError: cannot assign to field 'timeout_seconds'

实例属性删除:
  del config.timeout_seconds
  → 触发 __delattr__('timeout_seconds')
  → 生成的 __delattr__ 抛出 FrozenInstanceError
  → AttributeError: cannot delete field 'timeout_seconds'
```

**验证性代码**

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class Config:
    host: str = "localhost"
    port: int = 8080

c = Config()

# 验证 FrozenInstanceError 是 AttributeError 的子类
try:
    c.port = 9090
except AttributeError as e:
    error_type = type(e).__name__
    print(f"  错误类型: {error_type}")
    print(f"  是 AttributeError 子类: {isinstance(e, AttributeError)}")
    print(f"  错误信息: {e}")
```

```text
错误类型: FrozenInstanceError
是 AttributeError 子类: True
错误信息: cannot assign to field 'port'
```

`FrozenInstanceError` 继承自 `AttributeError`，所以 `except AttributeError` 可以捕获它。这意味着你可以用统一的 `AttributeError` 处理逻辑来捕获常量被修改的异常。

**为什么 frozen 实例可哈希**

普通 dataclass 默认不可哈希（因为 `__hash__` 被设为 `None`），而 frozen dataclass 是可哈希的。原因是 frozen 实例的属性不可变，其哈希值在整个生命周期内不变，可以安全地作为 dict 键或放入 set。

```python
@dataclass(frozen=True)
class Point:
    x: int
    y: int

# frozen 实例可哈希
p = Point(1, 2)
print(f"  hash(Point(1, 2)): {hash(p)}")

# 可做 dict 键
d = {p: "origin"}
print(f"  dict 键: {d}")

# 普通 dataclass 不可哈希（会抛 TypeError）
from dataclasses import dataclass as dc

@dc
class MutablePoint:
    x: int
    y: int

try:
    hash(MutablePoint(1, 2))
except TypeError as e:
    print(f"  MutablePoint 不可哈希: {e}")
```

```text
hash(Point(1, 2)): 3713081631934420656
dict 键: {Point(x=1, y=2): 'origin'}
MutablePoint 不可哈希: unhashable type: 'MutablePoint'
```

## 5. 总结

本文围绕 Python 常量约定展开，主要介绍了以下内容：

- Python 没有 `const` 关键字，常量通过**命名约定**（全大写 + 下划线）和**工具链**（Final 类型注解 + mypy 静态检查）实现"事实上的常量"
- **模块级常量**是最基础的形式，集中定义在模块顶部，配合 `Final` 注解让静态检查器拦截误改
- **类级常量**适合与类语义强相关的常量，通过类名访问（`Circle.PI`），被所有实例共享
- **Enum 枚举**提供运行时只读保护（元类强制），适合一组相关的命名取值，支持迭代和按名/值查找
- **frozen dataclass** 创建不可变结构化配置对象，实例属性不可修改（`FrozenInstanceError`），且可哈希
- **namedtuple** 是轻量不可变记录，适合简单固定字段场景，新代码优先用 frozen dataclass
- **tuple/frozenset** 作为不可变集合常量，防止运行时被误修改，frozenset 可做 dict 键
- **魔法数消除**是常量约定的核心应用场景——用命名常量替代散落的硬编码值，让代码自解释、易维护
- **可变默认参数陷阱**：list/dict/set 不能做函数默认参数，用 None 哨兵或 tuple 常量替代
- Python 没有 `const` 的原因是其变量模型——变量是名字标签而非内存盒子，Final + 静态检查器 + Enum + frozen dataclass 共同构成了 Python 的常量保护体系
