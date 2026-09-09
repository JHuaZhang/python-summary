---
group:
  title: 【01】初识python
  order: 1
order: 10
title: 标识符命名规范
nav:
  title: Python基础
  order: 1
---

# 标识符命名规范

## 1. 介绍

### 1.1 什么是标识符

标识符（Identifier）是 Python 中用来给变量、函数、类、模块等程序元素起名字的符号序列。简单来说，你写的每一行代码中出现的 `count`、`calculate_total`、`Order`、`MAX_SIZE`，都是标识符。

Python 对标识符有一套明确的语法规则：哪些字符可以用、哪些不能用、哪些名字是保留给语言自身的。同时，Python 社区还有一套约定俗成的命名风格（PEP 8），规定了不同类型的程序元素应该用什么"样子"的名字——变量用小写下划线、类名用驼峰、常量用全大写等等。

掌握标识符命名规范，有两个层面的意义：

- **语法层面**：不违反规则，代码能跑起来，不会遇到 `SyntaxError` 或遮蔽内置函数的坑。
- **协作层面**：写出别人一看就懂的名字，降低阅码成本。好的命名是自文档化代码的基石。

### 1.2 最简示例

先看一组最简单的标识符使用：

```python
count = 1            # 变量：snake_case 风格
Count = 2            # 类名风格（仅演示，不推荐变量这样用）
MAX_COUNT = 3        # 常量：全大写 + 下划线

def calculate_total(items):
    return sum(item["price"] * item["quantity"] for item in items)

class Order:
    def __init__(self, order_id):
        self.order_id = order_id
```

运行结果：

```text
count = 1, Count = 2, MAX_COUNT = 3
```

这段代码涉及了变量名、函数名、类名、方法名、参数名，每种都有各自约定。后面会逐一拆解每种命名场景的规则和风格。

## 2. 核心内容

### 2.1 标识符语法规则

Python 标识符的合法字符有一套严格的规定，不是所有字符都能用在名字里。

**合法字符集**：

- 字母（a-z, A-Z）
- 数字（0-9）
- 下划线（_）
- Unicode 字符（如中文、日文等）

**规则**：

- 标识符**不能以数字开头**，但可以以字母或下划线开头。
- 标识符**不能包含**空格、连字符（`-`）、`@`、`$`、`%` 等特殊字符。
- 标识符**不能是 Python 关键字**（如 `class`、`for`、`if` 等）。
- Python 3 允许 Unicode 字符（如中文）作为标识符，但不推荐在实际项目中使用。

Python 提供了两个内置工具来帮助你验证标识符的合法性：

- `str.isidentifier()`：判断一个字符串是否是合法标识符（但不排除关键字）。
- `keyword.kwlist`：列出所有 Python 关键字。

**示例**：

```python
import keyword

candidates = {
    "count": "合法（普通变量名）",
    "_user": "合法（单下划线开头）",
    "user2": "合法（含数字但非数字开头）",
    "__init__": "合法（前后双下划线，魔法名）",
    "总人数": "合法（Unicode，但不推荐）",
    "2count": "非法（数字开头，SyntaxError）",
    "my-var": "非法（含连字符，被当减号）",
    "my var": "非法（含空格）",
    "class": "非法（关键字，SyntaxError）",
    "for": "非法（关键字，SyntaxError）",
}

keywords = set(keyword.kwlist)
print(f"Python 关键字数量：{len(keywords)} 个")
print("标识符合法性检查：")
for name, reason in candidates.items():
    is_kw = name in keywords
    is_valid = name.isidentifier() and not is_kw
    tag = "合法" if is_valid else "非法"
    print(f"  {name!r:12s} -> {tag} ({reason})")
```

运行结果：

```text
Python 关键字数量：35 个
标识符合法性检查：
  'count'      -> 合法 (合法（普通变量名）)
  '_user'      -> 合法 (合法（单下划线开头）)
  'user2'      -> 合法 (合法（含数字但非数字开头）)
  '__init__'   -> 合法 (合法（前后双下划线，魔法名））
  '总人数'     -> 合法 (合法（Unicode，但不推荐）)
  '2count'     -> 非法 (非法（数字开头，SyntaxError）)
  'my-var'     -> 非法 (非法（含连字符，被当减号））
  'my var'     -> 非法 (非法（含空格））
  'class'      -> 非法 (非法（关键字，SyntaxError））
  'for'        -> 非法 (非法（关键字，SyntaxError））
```

**关键点**：

- `str.isidentifier()` 只检查语法合法性，**不排除关键字**。所以 `class.isidentifier()` 返回 `True`，但 `class` 不能用作标识符。必须同时用 `keyword.kwlist` 排除关键字。
- `my-var` 中的 `-` 会被 Python 解析为减号运算符，所以 `my-var = 1` 实际上是 `my - var = 1`，会报 `SyntaxError`。
- 虽然中文标识符合法，但在实际项目中不推荐使用——不利于跨团队协作和国际化。

### 2.2 大小写敏感

Python 是**大小写敏感**的语言。`count`、`Count`、`COUNT` 是三个完全不同的标识符。

**示例**：

```python
count = 1       # 变量：snake_case
Count = 2       # 类名风格（仅演示同名不同义，不推荐变量这样用）
MAX_COUNT = 3   # 常量：全大写

print(f"count = {count}, Count = {Count}, MAX_COUNT = {MAX_COUNT}")
print("三者是完全不同的标识符，体现了变量/类/常量的命名区分")
```

运行结果：

```text
count = 1, Count = 2, MAX_COUNT = 3
三者是完全不同的标识符，体现了变量/类/常量的命名区分
```

大小写敏感的实际影响体现在两个层面：

1. **避免意外碰撞**：你在代码中定义了 `count`，不会意外覆盖另一个叫 `Count` 的变量。Python 把它们当作两个独立的名称。
2. **利用大小写区分用途**：PEP 8 建议用不同的命名风格区分变量、类和常量，大小写敏感是实现这一约定的基础。

**容易踩的坑**：

```python
name = "Alice"
# 过了几十行代码后
Name = "Bob"    # 拼错了，本意是更新 name，实际创建了新变量 Name
print(name)     # 仍然是 "Alice"，不是 "Bob"
```

Python 不会像某些语言那样给你警告。保持命名一致性需要靠自己和团队规范。

### 2.3 命名风格约定（PEP 8）

PEP 8 是 Python 社区公认的代码风格指南，对命名风格有明确的约定。不同类型的程序元素使用不同的命名风格，这让你一眼就能从名字判断出它是变量、函数、类还是常量。

| 元素类型 | 命名风格 | 示例 | 说明 |
|----------|---------|------|------|
| 变量 | snake_case | `user_name`、`order_id` | 全小写，单词用下划线分隔 |
| 函数 | snake_case | `calculate_total()`、`get_user_info()` | 全小写，单词用下划线分隔 |
| 方法 | snake_case | `is_empty()`、`process_order()` | 同函数风格 |
| 类 | PascalCase（CamelCase） | `Order`、`InvalidOrderError` | 每个单词首字母大写，无下划线 |
| 常量 | UPPER_SNAKE_CASE | `MAX_ORDER_ITEMS`、`DISCOUNT_RATE` | 全大写，单词用下划线分隔 |
| 模块 | snake_case | `user_service.py`、`order_models.py` | 全小写，简短 |
| 包 | snake_case | `utils`、`models` | 全小写，简短，不含下划线最好 |
| 私有成员 | _leading_underscore | `_status`、`_has_discount()` | 单下划线前缀，约定为内部使用 |
| 魔法方法 | \_\_double_underscore\_\_ | `__init__`、`__str__` | 前后双下划线，Python 内部约定 |
| 异常类 | CamelCase + Error | `InvalidOrderError`、`ConnectionError` | 类名以 Error 或 Exception 结尾 |

**命名风格对比示例**：

```python
# === 常量：全大写、单词下划线分隔 ===
MAX_SIZE = 100
DEFAULT_TIMEOUT = 30

# === 类名：CamelCase ===
class UserAccount:
    def __init__(self, user_id: int, user_name: str):
        self.user_id = user_id          # 实例属性：snake_case
        self.user_name = user_name
        self._is_active = True          # 私有属性：单下划线前缀

    # 方法名：snake_case
    def get_display_name(self) -> str:
        return self.user_name

    # 布尔返回方法：is_ 或 has_ 前缀
    def is_active(self) -> bool:
        return self._is_active

# === 异常类：CamelCase + Error 结尾 ===
class InvalidUserError(Exception):
    pass

# === 函数名：snake_case，动词开头 ===
def calculate_discount(price: float, rate: float) -> float:
    return price * (1 - rate)
```

**关键约定**：

- **函数/方法名用动词开头**：因为函数是"做事情"的，名字应该描述"做什么"。如 `get_user`、`calculate_total`、`fetch_data`、`send_email`。
- **布尔返回的函数/方法用 `is_` 或 `has_` 前缀**：如 `is_empty()`、`has_permission()`，让调用者一眼就知道返回的是布尔值。
- **避免缩写**：`calculate_total` 比 `calc_tot` 好，`user_name` 比 `usr_nm` 好。拆开几个字母换来可读性是值得的。除非缩写是行业通用术语（如 `url`、`id`、`db`）。
- **类名用名词**：因为类是"东西"，不是"动作"。如 `Order`、`UserAccount`，而不是 `CreateOrder`（`CreateOrder` 听起来像函数名）。

### 2.4 下划线的特殊含义

下划线在 Python 中有特殊的语义，不同位置和数量的下划线代表不同含义。这是一个 Python 独有的命名约定体系，值得单独梳理。

| 写法 | 含义 | 示例 |
|------|------|------|
| `_` | 临时忽略的占位符 | `for _ in range(3):` 或 `a, _ = (1, 2)` |
| `_name` | 约定私有（单下划线前缀） | `self._status = "pending"` |
| `__name` | 名称重整（双下划线前缀，无后缀） | `self.__secret = 0.05` |
| `__name__` | 魔法方法（前后双下划线） | `def __init__(self):` |
| `name_` | 避免与关键字冲突（尾下划线） | `class_ = "高级班"` |

**单下划线 `_`：忽略占位符**

```python
# 循环中不使用的变量
for _ in range(3):
    print("重复输出")

# 解包时忽略某些值
a, _ = (100, 200)
print(f"只取 a = {a}，忽略第二个值")

# 忽略多个值
a, *_, b = (1, 2, 3, 4, 5)
print(f"取首尾：a = {a}, b = {b}")
```

运行结果：

```text
重复输出
重复输出
重复输出
只取 a = 100，忽略第二个值
取首尾：a = 1, b = 5
```

**单下划线前缀 `_name`：约定私有**

单下划线前缀是一种**约定**，不是强制。它告诉其他开发者"这是内部使用的，不应该在外部直接访问"。但 Python 不会阻止你从外部访问它。

```python
class Order:
    def __init__(self):
        self._status = "pending"     # 约定私有属性

    def _has_discount(self) -> bool:  # 约定私有方法
        return True

order = Order()
print(order._status)     # 技术上可以访问，但不推荐
```

**双下划线前缀 `__name`：名称重整**

双下划线前缀（无后缀）会触发 Python 的**名称重整（Name Mangling）**机制，将属性名在编译时自动改为 `_ClassName__name` 的形式。这是一种更强的私有化手段，但不完全等同于其他语言的 `private`。详细机制在 2.6 节展开。

**前后双下划线 `__name__`：魔法方法**

前后双下划线是 Python 预留的"魔法方法"（dunder methods）命名空间，如 `__init__`、`__str__`、`__len__`。不要自己发明 `__xxx__` 格式的名字，以免与未来版本的 Python 内置方法冲突。

```python
class Order:
    def __init__(self, order_id: int):
        self.order_id = order_id

    def __str__(self) -> str:
        return f"Order(#{self.order_id})"

    def __len__(self) -> int:
        return 0

order = Order(order_id=1001)
print(order)        # 自动调用 __str__
print(len(order))   # 自动调用 __len__
```

运行结果：

```text
Order(#1001)
0
```

**尾下划线 `name_`：避免与关键字冲突**

当你需要一个名字恰好是 Python 关键字时，加尾下划线：

```python
# class 是关键字，不能直接用
class_ = "高级班"      # 没问题
type_ = "student"      # type 不是关键字但冲突内置函数，加尾下划线也合理

# 常见于匹配 Python 关键字的场景
def filter_records(type_="all", class_="default"):
    print(f"类型：{type_}，班级：{class_}")
```

### 2.5 避免遮蔽内置名

Python 有大量内置函数和类型，如 `list`、`dict`、`str`、`int`、`id`、`sum`、`type`、`len`、`map`、`filter` 等。如果你用这些名字作为变量名，就会**遮蔽（shadow）**内置函数，导致后续代码无法正常使用该内置函数。

**错误示例**：

```python
# 反例：用 list 作变量名
list = [1, 2, 3]
new_list = list(range(5))    # TypeError: 'list' object is not callable
                              # 因为 list 现在指向 [1, 2, 3]，不是内置函数了
```

运行结果：

```text
TypeError: 'list' object is not callable
```

**正确做法**：在有语义的名称上加后缀或前缀。

```python
# 好的做法：不用 list 作变量名
product_list = ["键盘", "鼠标", "显示器"]
# 内置 list() 仍可正常使用
new_list = list(range(3))
print(f"正确命名：product_list = {product_list}，内置 list() 仍可用：list(range(3)) = {new_list}")
```

运行结果：

```text
正确命名：product_list = ['键盘', '鼠标', '显示器']，内置 list() 仍可用：list(range(3)) = [0, 1, 2]
```

**常见容易遮蔽的内置名一览**：

| 内置名 | 容易误用场景 | 推荐替代 |
|-------|-------------|---------|
| `list` | 存储列表数据 | `item_list`、`records`、`items` |
| `dict` | 存储字典数据 | `info_dict`、`config`、`mapping` |
| `str` | 存储字符串 | `text`、`name_str`、`content` |
| `id` | 存储 ID 值 | `user_id`、`order_id`、`record_id` |
| `sum` | 求和结果变量 | `total`、`subtotal`、`amount` |
| `type` | 类型标识 | `record_type`、`item_type` |
| `input` | 用户输入 | `user_input`、`raw_input` |
| `max` / `min` | 最大/最小值 | `max_value` / `min_value` |
| `map` / `filter` | 集合操作 | `plan` / `filtered_items` |

**关键点**：

- 遮蔽 builtin 不像遮蔽关键字那样会立即报 `SyntaxError`，Python 允许你这么做，但会在后续使用内置函数时悄然崩溃。这种 bug 非常隐蔽，调试成本高。
- 在小型脚本中你可能恰好没再用到那个内置函数，不会出问题；但在大型项目中，遮蔽内置名的代码迟早会坑到别人。
- 很多人误以为 `id` 不是内置函数（它是 `id()`，返回对象的内存地址），实际上它是。用 `user_id` 而不是 `id` 来存储 ID 值。

### 2.6 名称重整机制

名称重整（Name Mangling）是 Python 类中双下划线前缀属性的一种特殊机制。当你在类中定义 `self.__secret_discount = 0.05` 时，Python 会在编译时将属性名改为 `_Order__secret_discount` 的形式——即在原名前加上 `_ClassName` 前缀。

这个机制的核心目的是**避免子类与父类之间的属性名冲突**。当父类和子类都定义了 `__secret_discount` 属性时，它们会被分别重整为 `_Order__secret_discount` 和 `_VipOrder__secret_discount`，互不覆盖。

**示例**：

```python
class Order:
    def __init__(self, order_id, items):
        self.order_id = order_id
        self.items = items
        self.__secret_discount = 0.05    # 重整为 _Order__secret_discount

class VipOrder(Order):
    def __init__(self, order_id, items):
        super().__init__(order_id, items)
        self.__secret_discount = 0.2    # 重整为 _VipOrder__secret_discount

order = Order(order_id=1, items=[{"price": 10, "quantity": 2}])
vip = VipOrder(order_id=2, items=[{"price": 100, "quantity": 1}])

# 外部用 __secret_discount 无法访问（AttributeError）
# 但用重整全名可以访问
print(f"通过重整名访问：order._Order__secret_discount = {order._Order__secret_discount}")

# 展示实例属性中实际存储的重整名
mangled_order = [attr for attr in vars(order) if attr.startswith("_Order__")]
print(f"实际存储的重整属性：{mangled_order}")

# 子类同名 __ 属性不覆盖父类
print(f"父类重整属性：{[a for a in vars(vip) if a.startswith('_Order__')]}")
print(f"子类重整属性：{[a for a in vars(vip) if a.startswith('_VipOrder__')]}")
print(f"父类折扣 {vip._Order__secret_discount} 与子类折扣 {vip._VipOrder__secret_discount} 互不覆盖")
```

运行结果：

```text
通过重整名访问：order._Order__secret_discount = 0.05
实际存储的重整属性：['_Order__secret_discount']
父类重整属性：['_Order__secret_discount']
子类重整属性：['_VipOrder__secret_discount']
父类折扣 0.05 与子类折扣 0.2 互不覆盖
```

**关键点**：

- 名称重整只在**类定义体内**对以双下划线开头且不以双下划线结尾的标识符生效。`__init__` 不会重整，`__secret_discount` 会重整。
- 重整后的名字格式固定为 `_ClassName__attrname`。注意 `ClassName` 是当前类的名字，不是父类的名字。
- 从外部直接用 `__secret_discount` 访问会报 `AttributeError`，必须用重整后的全名 `_Order__secret_discount` 才能访问。这意味着名称重整并不是真正的私有——它只是"增加了一层间接"。

**名称重整 vs 单下划线约定对比**：

| 维度 | `_name`（单下划线） | `__name`（双下划线） |
|------|-------------------|---------------------|
| 外部能否直接访问 | 能（约定不推荐，但不阻止） | 不能（需用重整名） |
| 触发名称重整 | 否 | 是（改为 `_ClassName__name`） |
| 子类同名是否覆盖 | 是（普通属性继承） | 否（各自重整为不同名字） |
| 使用场景 | 内部约定用 | 防止子类属性名冲突 |
| Python 推荐度 | 更常用 | 有特定场景才用 |

### 2.7 作用域与命名长度原则

命名长度应该与作用域的宽窄相匹配：作用域越宽（如全局变量、模块级常量），名字应该越具体、越完整；作用域越窄（如函数内局部变量、循环变量），名字可以越简短。

**原则**：

```text
作用域宽度          命名长度        示例
────────────────────────────────────────────────────────
全局/模块级     →    长而具体       user_session_timeout = 1800
类属性          →    长而具体       self.order_id
参数            →    中等          calculate_total(items)
函数内局部      →    短            total = sum(...)
循环变量/临时   →    极短或_        for _ in range(3)
```

**示例**：

```python
# 全局/模块级：作用域宽，名字具体完整
user_session_timeout = 1800
DATABASE_CONNECTION_POOL_SIZE = 10

def process_order(order):
    # 局部：上下文是 order，不必 order_xxx 冗余前缀
    total = sum(item["price"] * item["quantity"] for item in order["items"])
    return total

# 函数内局部变量可以在上下文中缩短
# 在 process_order 内部，total 就够了，不需要写 order_total_amount
```

运行结果（假设调用）：

```text
全局变量 user_session_timeout = 1800（名字完整具体）
局部变量 total = 80.0（上下文即 order，无需冗余前缀）
```

**关键点**：

- 全局变量可能被项目中任何地方引用，名字必须自解释——读者看到 `user_session_timeout` 就知道是什么，不需要去找定义。
- 局部变量只在一个小范围内使用，上下文已经提供了足够的信息。在 `process_order` 函数内，`total` 比 `order_total_amount` 更好——作用域只有一个函数体，读者不会搞混。
- `_` 作为忽略占位符是最极端的"短"——表示"这个值我不关心"。

### 2.8 函数命名规范

函数名遵循 PEP 8 的 snake_case 风格，此外还有一些函数特有的命名约定。

**规则**：

- 动词开头：函数是"做事情"的，名字应该描述"做什么"。
- snake_case：全小写，单词用下划线分隔。
- 布尔返回函数：用 `is_` 或 `has_` 前缀。
- 私有函数：单下划线前缀。

**函数命名的动词推荐**：

| 动词 | 适用场景 | 示例 |
|------|---------|------|
| `get_` | 获取数据（通常有返回值） | `get_user_name()` |
| `set_` | 设置数据（通常无返回值或返回 None） | `set_timeout(30)` |
| `fetch_` | 从远程获取数据（隐含网络/IO 操作） | `fetch_user_profile()` |
| `load_` | 从文件/存储加载数据 | `load_config()` |
| `save_` | 保存数据到文件/存储 | `save_report()` |
| `calculate_` | 计算并返回结果 | `calculate_total()` |
| `process_` | 处理数据（可能有副作用） | `process_order()` |
| `validate_` | 验证数据，返回布尔或抛异常 | `validate_email()` |
| `is_` | 判断状态，返回布尔值 | `is_active()` |
| `has_` | 判断是否拥有，返回布尔值 | `has_permission()` |
| `parse_` | 解析输入数据 | `parse_json()` |
| `format_` | 格式化输出 | `format_date()` |

**示例**：

```python
from typing import Final

MAX_ORDER_ITEMS: Final[int] = 100

def get_user_summary(user_id: int, is_active: bool) -> str:
    """演示布尔参数 is_ 前缀、变量 snake_case、避免缩写。"""
    status_text = "活跃" if is_active else "停用"
    return f"用户 {user_id} 当前状态：{status_text}"

print(get_user_summary(user_id=5001, is_active=True))
print(get_user_summary(user_id=5002, is_active=False))
```

运行结果：

```text
用户 5001 当前状态：活跃
用户 5002 当前状态：停用
```

**关键点**：

- 参数名也用 snake_case：`user_id` 比 `userId` 更符合 Python 风格（`userId` 是 Java/JS 风格）。
- 布尔参数用 `is_` 前缀：`is_active=True` 比 `active=True` 语义更明确——读者一看就知道传的是布尔值。
- 函数名避免缩写：`get_user_summary` 比 `get_usr_sum` 好。

### 2.9 综合命名示例

将命名规范串联起来，看一个完整的订单处理系统示例。这个示例覆盖了常量命名、类名命名、方法命名、私有属性约定、名称重整、异常类命名、魔法方法等知识点。

**常量定义（全大写 + 下划线）**：

```python
from typing import Final

# 常量命名：全大写、单词下划线分隔，放模块顶部
MAX_ORDER_ITEMS: Final[int] = 100
DISCOUNT_RATE: Final[float] = 0.1
STATUS_PENDING: Final[str] = "pending"
STATUS_PAID: Final[str] = "paid"
```

**异常类定义（CamelCase + Error 结尾）**：

```python
# 异常类命名：CamelCase + Error 结尾，继承 Exception
class InvalidOrderError(Exception):
    """无效订单异常。"""
```

**业务类定义（展示私有约定与名称重整）**：

```python
class Order:
    """订单实体。演示 CamelCase 类名、snake_case 方法、_ 与 __ 私有约定。"""

    def __init__(self, order_id: int, items: list[dict]) -> None:
        self.order_id = order_id
        self.items = items
        self._status = STATUS_PENDING               # 约定私有：单下划线
        self.__secret_discount = 0.05                 # 名称重整：双下划线

    def is_empty(self) -> bool:
        return len(self.items) == 0

    def item_count(self) -> int:
        return len(self.items)

    def __str__(self) -> str:
        return f"Order(#{self.order_id}, items={self.item_count()}, status={self._status})"

    def __len__(self) -> int:
        return self.item_count()

    def _has_discount(self) -> bool:
        """约定私有方法：单下划线，模块内部使用。"""
        return self.item_count() >= 5

    def process(self) -> float:
        """处理订单，返回折扣后金额。"""
        if self.is_empty():
            raise InvalidOrderError(f"订单 #{self.order_id} 没有商品，无法处理")

        total = sum(item["price"] * item["quantity"] for item in self.items)
        discounted = total * (1 - DISCOUNT_RATE)
        if self._has_discount() and self.__secret_discount > 0:
            discounted *= (1 - self.__secret_discount)
        self._status = STATUS_PAID
        return round(discounted, 2)
```

**运行订单处理流程**：

```python
orders = [
    Order(order_id=1001, items=[
        {"price": 35.0, "quantity": 2},
        {"price": 12.5, "quantity": 4},
    ]),
    Order(order_id=1002, items=[
        {"price": 199.0, "quantity": 1},
        {"price": 29.9, "quantity": 5},
        {"price": 9.9, "quantity": 3},
    ]),
    Order(order_id=1003, items=[]),  # 空订单，触发异常
]

for order in orders:
    try:
        print(f"处理前：{order}（len()={len(order)}）")
        if order.item_count() > MAX_ORDER_ITEMS:
            raise InvalidOrderError(f"订单 #{order.order_id} 商品数超过上限 {MAX_ORDER_ITEMS}")
        amount = order.process()
        print(f"处理后：{order} -> 实付金额：{amount}")
    except InvalidOrderError as exc:
        print(f"处理失败：{exc}")
    print()
```

运行结果：

```text
处理前：Order(#1001, items=2, status=pending)（len()=2）
处理后：Order(#1001, items=2, status=paid) -> 实付金额：108.0

处理前：Order(#1002, items=3, status=pending)（len()=3）
处理后：Order(#1002, items=3, status=paid) -> 实付金额：340.38

处理前：Order(#1003, items=0, status=pending)（len()=0）
处理失败：订单 #1003 没有商品，无法处理
```

**代码解读**：

- `MAX_ORDER_ITEMS`、`DISCOUNT_RATE`：常量全大写，放在模块顶部，用 `Final` 标注表示不应被重新赋值。
- `InvalidOrderError`：异常类用 CamelCase，以 `Error` 结尾，继承 `Exception`。
- `Order`：类名用 PascalCase，单数形式（不是 `Orders`）。
- `order_id`、`items`：公有属性用 snake_case，语义清晰。
- `_status`：单下划线前缀，约定私有——外部不应直接修改状态，应通过 `process()` 方法改变。
- `__secret_discount`：双下划线前缀触发名称重整，子类不会意外覆盖。
- `is_empty()`、`item_count()`：方法名用 snake_case，`is_empty` 用 `is_` 前缀返回布尔值。
- `_has_discount()`：单下划线私有方法，表示仅供类内部使用。
- `__str__`、`__len__`：前后双下划线的魔法方法，被 `print()` 和 `len()` 自动调用。
- `process()`：动词开头，表示"处理订单"这个动作。

## 3. 最佳实践

### 3.1 推荐 vs 不推荐写法对比

好的命名和坏的命名之间的差异，往往不是"对错"问题，而是"可读性"问题。但在团队协作中，可读性就是生产力。

| 场景 | 不推荐写法 | 推荐写法 | 原因 |
|------|----------|---------|------|
| 变量命名 | `d = {"name": "Alice"}` | `user_info = {"name": "Alice"}` | 单字母无语义 |
| 变量命名 | `lst = [1, 2, 3]` | `numbers = [1, 2, 3]` | 遮蔽内置 `list` |
| 变量命名 | `a = 1800` | `session_timeout = 1800` | 无上下文，不知含义 |
| 函数命名 | `def calc(x, y): ` | `def calculate_total(price, quantity):` | 缩写 + 无参数语义 |
| 布尔函数 | `def empty(items):` | `def is_empty(items):` | 缺少 `is_` 前缀 |
| 布尔变量 | `active = True` | `is_active = True` | 缺少 `is_` 前缀 |
| 类命名 | `class order:` | `class Order:` | 类名应为 CamelCase |
| 常量命名 | `maxSize = 100` | `MAX_SIZE = 100` | 常量应全大写 |
| 缩写滥用 | `def get_usr_sum(usr_id):` | `def get_user_summary(user_id):` | 缩写降低可读性 |
| 魔法数字 | `if len(items) > 100:` | `if len(items) > MAX_ORDER_ITEMS:` | 魔法数字不可维护 |
| 私有属性 | `self.secret = 0.1` | `self._secret = 0.1` | 缺少私有约定 |

### 3.2 常见错误模式及修正

**错误模式一：遮蔽内置名**

```python
# 错误
list = [1, 2, 3]
print(list(range(5)))  # TypeError: 'list' object is not callable

# 修正
numbers = [1, 2, 3]
print(list(range(5)))  # [0, 1, 2, 3, 4]
```

**错误模式二：大小写不一致导致的"幽灵变量"**

```python
# 错误
user_name = "Alice"
# ... 几十行代码后
UserName = "Bob"    # 本意是更新 user_name，实际创建了新变量
print(user_name)    # 仍然是 "Alice"

# 修正
user_name = "Alice"
user_name = "Bob"   # 保持一致
print(user_name)     # "Bob"
```

**错误模式三：数字开头**

```python
# 错误
2nd_value = 10      # SyntaxError

# 修正
second_value = 10
```

**错误模式四：使用连字符**

```python
# 错误
user-name = "Alice"  # SyntaxError: '-' 被当减号

# 修正
user_name = "Alice"
```

**错误模式五：名称重整理解错误**

```python
class Order:
    def __init__(self):
        self.__discount = 0.05    # 重整为 _Order__discount

order = Order()
# 错误：以为 __discount 是真正私有的，无法访问
# 实际上可以用重整名访问
print(order._Order__discount)  # 0.05，能正常访问

# 不要依赖名称重整做安全控制
```

**错误模式六：在遍历时随意起名**

```python
# 不推荐
for i in users:
    print(i.name)    # i 通常用于索引，用于对象遍历容易混淆

# 推荐
for user in users:
    print(user.name)
```

### 3.3 命名可读性技巧

**技巧一：用描述性质的名称替代泛名称**

```python
# 不推荐
def process(data):
    return data

# 推荐
def validate_email(email_address):
    return email_address
```

`data` 是万能词，什么都能装，也就什么都不表达。`email_address` 一眼就知道是什么。

**技巧二：布尔变量用 `is_`/`has_`/`can_`/`should_` 前缀**

```python
# 不推荐
user = True          # 是什么意思？
admin = False        # 是管理员？还是不是？

# 推荐
is_user = True
is_admin = False
has_permission = True
can_delete = True
should_retry = False
```

**技巧三：集合用复数名**

```python
# 不推荐
user = ["Alice", "Bob", "Charlie"]    # 看名字以为是单个 user
item = [1, 2, 3]

# 推荐
users = ["Alice", "Bob", "Charlie"]
items = [1, 2, 3]

# 遍历时就自然了
for user in users:
    print(user)
```

**技巧四：避免否定式命名**

```python
# 不推荐
is_not_empty = True
if not is_not_empty:    # 双重否定，需要转一个弯才能理解
    print("空")

# 推荐
is_empty = False
if not is_empty:
    print("非空")
```

**技巧五：常量集中管理，放在模块顶部**

```python
# 不推荐：常量散落在代码各处
def process_order(order):
    if len(order["items"]) > 100:    # 魔法数字
        ...
    total = order["total"] * 0.9    # 魔法数字（折扣率 0.1）

# 推荐：常量集中定义
MAX_ORDER_ITEMS = 100
DISCOUNT_RATE = 0.1

def process_order(order):
    if len(order["items"]) > MAX_ORDER_ITEMS:
        ...
    total = order["total"] * (1 - DISCOUNT_RATE)
```

**技巧六：上下文相关的简短命名**

```python
# 在类方法内部，self 已提供了上下文
class User:
    def __init__(self, name, email):
        self.name = name        # 不需要 self.user_name
        self.email = email

# 在函数内部，参数名提供了上下文
def calculate_total(price, quantity):
    return price * quantity     # 不需要 item_price * item_quantity
```

## 4. 原理：名称重整的内部机制

### 4.1 名称重整的触发条件

名称重整（Name Mangling）是 Python 编译器在编译类定义体时，对符合条件的标识符进行自动改名的行为。改名的规则是：将 `__name` 改为 `_ClassName__name`。

**触发条件**（同时满足以下三点才触发）：

1. 标识符以**两个或更多**下划线开头。
2. 标识符以**至多一个**下划线结尾（即不以 `__` 结尾，`__name__` 不触发，`__name` 触发，`__name_` 触发）。
3. 标识符出现在**类定义体内部**（模块级别不触发）。

**触发条件一览**：

```text
写法            是否触发名称重整     重整后的名字
──────────────────────────────────────────────────
__secret        是                _ClassName__secret
__secret_       是                _ClassName__secret_
__init__        否                保持不变（前后双下划线）
___secret__     否                保持不变（以双下划线结尾）
__              否                保持不变（只有下划线）
_secret         否                保持不变（单下划线前缀）
```

**验证性代码**：

```python
class Test:
    def __init__(self):
        self.__data = 1        # 触发 → _Test__data
        self.__data2_ = 2      # 触发 → _Test__data2_
        self.__init__ = 3      # 不触发 → __init__
        self._data = 4         # 不触发 → _data
        self.data = 5          # 不触发 → data

t = Test()
for attr in sorted(vars(t)):
    print(f"  {attr} = {getattr(t, attr)}")
```

运行结果：

```text
  __init__ = 3
  _Test__data = 1
  _Test__data2_ = 2
  _data = 4
  data = 5
```

可以看到，`__data` 变成了 `_Test__data`，`__data2_` 变成了 `_Test__data2_`，而 `__init__`（前后双下划线）和 `_data`（单下划线前缀）都保持不变。

### 4.2 重整的存储与访问

名称重整后，属性在实例的 `__dict__` 中以重整后的名字存储。这意味着：

1. 在类内部，你仍然用 `self.__secret_discount` 访问——Python 帮你做了映射。
2. 在类外部（不在类定义体内），`self.__secret_discount` 会被理解为字面量 `__secret_discount`，而实例里没有这个名字，所以报 `AttributeError`。
3. 但如果你知道重整规则，可以用 `_ClassName__secret_discount` 访问——这并不是漏洞，而是 Python 设计的取舍。

**数据流**：

```text
类定义体:
  self.__secret = 0.05
        │
        ▼
编译器检测到 __secret 满足重整条件
        │
        ▼
改写为: self._Order__secret = 0.05
        │
        ▼
存储在 instance.__dict__["_Order__secret"] = 0.05

类内部访问:
  self.__secret
        │
        ▼
编译器同样改写为: self._Order__secret
        │
        ▼
在 __dict__ 中找到 → 正常返回

类外部访问:
  order.__secret
        │
        ▼
编译器不做改写（不在类定义体内）
        │
        ▼
在 __dict__ 中寻找 "__secret" → 找不到 → AttributeError

  order._Order__secret
        │
        ▼
在 __dict__ 中寻找 "_Order__secret" → 找到 → 正常返回
```

### 4.3 名称重整的设计目的

名称重整的主要设计目的是**防止子类无意中覆盖父类的"私有"属性**。Python 没有 Java 那样的 `private` 关键字，它只用约定（`_name`）提供了"弱私有"，但弱私有无法防止属性名碰撞。

**没有名称重整的假设场景**：

```text
如果 Python 不做名称重整：
  class Order:
      self.__discount = 0.05     # 父类属性

  class VipOrder(Order):
      self.__discount = 0.2      # 子类属性 → 覆盖父类！

  VipOrder 的 __discount 变成 0.2
  父类方法中引用 self.__discount 的逻辑全部受影响 → 意料之外的 bug
```

**有了名称重整后**：

```text
  class Order:
      self.__discount = 0.05     → _Order__discount = 0.05

  class VipOrder(Order):
      self.__discount = 0.2      → _VipOrder__discount = 0.2

  两个属性互不干扰：
      _Order__discount = 0.05    ← 父类的
      _VipOrder__discount = 0.2  ← 子类的
```

**名称重整 vs Java private 对比**：

| 维度 | Python 名称重整 | Java private |
|------|----------------|-------------|
| 访问控制强度 | 弱（可通过重整名访问） | 强（编译期强制，反射才能绕过） |
| 设计目的 | 防止属性名碰撞 | 完全禁止外部访问 |
| 子类能否覆盖 | 不能（名字不同） | 不能（编译报错） |
| 反射绕过 | 直接用重整名 | 用反射 API 可绕过 |

Python 的哲学是"we are all consenting adults here"——不做强制限制，靠开发者自觉。名称重整减少碰撞坑，但把是否遵守私有的决定权留给开发者。

## 5. 总结

本文围绕 Python 标识符命名规范展开，主要介绍了以下内容：

- **标识符语法规则**：合法字符集（字母、数字、下划线、Unicode），不能数字开头，不能包含空格和连字符，不能使用 Python 关键字。用 `str.isidentifier()` 和 `keyword.kwlist` 验证合法性。
- **大小写敏感**：`count`、`Count`、`COUNT` 是三个不同标识符，PEP 8 利用大小写区分变量、类和常量的命名风格。
- **命名风格约定**：变量和函数用 snake_case，类用 PascalCase，常量用 UPPER_SNAKE_CASE，私有成员用单下划线前缀，异常类以 Error 结尾。
- **下划线的特殊含义**：`_` 忽略占位符、`_name` 约定私有、`__name` 名称重整、`__name__` 魔法方法、`name_` 避免与关键字冲突。
- **避免遮蔽内置名**：不用 `list`、`dict`、`id`、`sum` 等内置名作变量名，遮蔽后会导致内置函数无法使用。
- **名称重整机制**：双下划线前缀触发编译器自动改名为 `_ClassName__name`，防止子类属性名碰撞，但不是真正的访问控制。
- **作用域与命名长度**：作用域越宽名字越具体，作用域越窄名字越简短。全局变量要自解释，局部变量可以依赖上下文。
- **函数命名规范**：动词开头，snake_case 风格，布尔返回用 `is_`/`has_` 前缀，私有函数用单下划线前缀。
- **最佳实践**：推荐描述性名称而非缩写，布尔变量用 `is_` 前缀，集合用复数名，常量集中管理，避免否定式命名和魔法数字。
- **名称重整原理**：触发条件（双下划线前缀、不以双下划线结尾、在类定义体内），重整后的存储格式 `_ClassName__name`，设计目的是防止子类属性碰撞而非强制访问控制。
