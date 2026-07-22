---
group:
  title: 【10】异常处理完整体系
  order: 10
order: 6
title: 主动抛异常raise
nav:
  title: Python
  order: 1
---

---

## 1. 介绍

### 1.1 什么是 raise

`raise` 是 Python 中**主动抛出异常**的关键字。当你检测到程序进入了一个"不应该继续执行下去"的状态——比如参数不合法、数据不完整、权限不足、业务规则被违反——就可以用 `raise` 主动创建一个异常对象并让它沿着调用栈向上传播，交由上层的 `try...except` 处理，或者直接让程序终止并打印错误信息。

异常机制的核心哲学是："如果我处理不了这个问题，就把它交给能处理的人"。`raise` 就是"我处理不了"这个表态的语法工具。没有 `raise`，你就只能通过返回错误码、设置标志位等原始方式传递错误信息——这些做法在 Python 中既不 Pythonic 也不可靠，因为调用方很容易忘记检查返回值。

从语言设计角度看，`raise` 与 `try/except/finally` 共同构成了 Python 异常处理的三块基石：

- **`try`**：标记需要监控的代码区域。
- **`except`**：指定捕获并处理某种异常。
- **`raise`**：主动创建或重新抛出异常，启动传播流程。

```python
def divide(a: float, b: float) -> float:
    if b == 0:
        raise ValueError("除数不能为零")  # 主动抛出异常
    return a / b

# 调用方可以选择捕获，也可以不捕获
try:
    result = divide(10, 0)
except ValueError as e:
    print(f"捕获到异常: {e}")  # 输出：捕获到异常: 除数不能为零
```

### 1.2 raise 语句的基本语法

Python 的 `raise` 语句有三种形式：

| 形式 | 语法 | 说明 |
|------|------|------|
| 抛异常实例 | `raise SomeException("message")` | 最常见形式，传入异常实例 |
| 抛异常类 | `raise SomeException` | 自动调用无参构造，等价于 `raise SomeException()` |
| 重新抛出 | `raise` | 只能在 `except` 块中使用，重新抛出当前异常 |

```python
# 形式一：抛异常实例
raise ValueError("输入不能为空")

# 形式二：抛异常类
raise ValueError   # 等价于 raise ValueError()

# 形式三：重新抛出（必须在 except 块中）
try:
    1 / 0
except ZeroDivisionError:
    print("记录日志")
    raise  # 重新抛出不处理
```

**最小可运行示例**：

```python
def check_age(age: int) -> None:
    if age < 0:
        raise ValueError(f"年龄不能为负数，收到: {age}")
    if age > 150:
        raise ValueError(f"年龄超出合理范围，收到: {age}")
    print(f"年龄 {age} 校验通过")

try:
    check_age(-5)
except ValueError as e:
    print(f"参数校验失败: {e}")
# 输出：参数校验失败: 年龄不能为负数，收到: -5
```

运行结果说明：`check_age` 函数在检测到负数年龄后，主动 `raise ValueError` 异常。调用方用 `try/except` 捕获并打印友好提示，程序不会崩溃——这正是 `raise` 配合异常处理的工程意义：防御性的验证 + 优雅的错误反馈。

### 1.3 raise vs return：两个不同的信号传递路径

很多初学者会混淆"抛异常"和"返回值"：能不能用 `return` 返回一个错误码代替 `raise`？

```python
# 用 return 传递错误（不推荐）
def divide_v1(a, b):
    if b == 0:
        return None, "除数不能为零"
    return a / b, None

result, err = divide_v1(10, 0)
if err:
    print(err)

# 用 raise 传递错误（推荐）
def divide_v2(a, b):
    if b == 0:
        raise ValueError("除数不能为零")
    return a / b
```

对比说明：

- **`return` 方案**：调用方必须记得检查错误码，一旦忘记就可能在后续代码中使用错误的返回值。同时，正常值和错误值混在一起，函数的返回值类型也模糊了——一个返回值既可能是 `float` 又可能是 `None`。
- **`raise` 方案**：如果调用方不处理，程序会明确终止并打印 traceback。错误不会静默地隐藏。调用方可以通过 `try/except` 有选择地处理，不需要逐层传递错误码。

异常是 Python 中一等公民的错误传递机制，`raise` 比 `return None` 更安全、更显式、更符合 Python 惯例。把异常限制在 `try/except` 范围内使用，而不是在普通控制流中使用（不应把 `raise` 当作特殊的 `return`）。

---

## 2. 核心内容

本章从基础到进阶全面讲解 `raise` 的使用方法，涵盖三种形式、异常实例化、重新抛出、异常链、自定义异常、以及与相关机制的对比。每节按"文字说明 → demo → 运行结果说明"组织。

### 2.1 raise SomeException("message")：抛异常实例

这是最常用的 `raise` 形式——先创建异常实例，再抛出。异常实例可以带错误消息，也可以不带。

```python
# 带错误消息的异常实例
raise ValueError("年龄不能为负数")

# 不带错误消息的异常实例
raise ValueError()

# 带多个参数的异常实例（部分异常支持）
raise KeyError("user_id", 42)
```

```python
def get_user(user_id: int, users: dict) -> str:
    """从用户字典中查找用户，找不到则抛异常"""
    if not isinstance(user_id, int):
        raise TypeError(f"user_id 必须是整数，收到: {type(user_id).__name__}")
    if user_id <= 0:
        raise ValueError(f"user_id 必须为正整数，收到: {user_id}")
    if user_id not in users:
        raise KeyError(f"用户 {user_id} 不存在")

    return users[user_id]

users_db = {1: "Alice", 2: "Bob", 3: "Charlie"}

# 测试场景
try:
    print(get_user(1, users_db))         # Alice
    print(get_user(99, users_db))        # KeyError
except KeyError as e:
    print(f"查询失败: {e}")              # 查询失败: 用户 99 不存在

try:
    get_user("abc", users_db)            # TypeError
except TypeError as e:
    print(f"类型错误: {e}")              # 类型错误: user_id 必须是整数，收到: str

try:
    get_user(-1, users_db)               # ValueError
except ValueError as e:
    print(f"值错误: {e}")                # 值错误: user_id 必须为正整数，收到: -1
```

运行结果说明：函数内部根据不同的验证失败原因抛出不同类型的异常，调用方可以根据需要分别捕获。这种"分层异常"的设计让错误处理更精细：`KeyError` 表示"资源不存在"，`TypeError` 表示"调用方式错误"，`ValueError` 表示"参数值不合理"。

**异常实例的 args 属性**：

所有内置异常都将传入构造函数的参数保存在 `.args` 属性中，这是一个元组：

```python
try:
    raise ValueError("错误信息", 42, {"code": 500})
except ValueError as e:
    print(f"args: {e.args}")   # args: ('错误信息', 42, {'code': 500})
    print(f"str: {e}")         # str: ('错误信息', 42, {'code': 500})
    # 注意：多个参数时 str() 显示的是 args 的 repr
```

运行结果说明：`args` 元组保存了传给异常构造函数的全部参数。单参数时 `str(e)` 直接显示参数内容；多参数时 `str(e)` 显示 `args` 的 repr。可以通过 `e.args` 获取原始参数自行格式化输出。

### 2.2 raise SomeException vs raise SomeException() 的区别

`raise ValueError` 和 `raise ValueError()` 在行为上**几乎等价**，但存在一个细微的语义差异：

```python
# 两种写法等价
raise ValueError      # 自动调用 ValueError()
raise ValueError()    # 显式构造函数调用
```

两种写法在绝大多数场景下完全等价，但有一个关键差异点：**传入参数时的写法**。

```python
# 必须加括号传入参数
raise ValueError("msg")    # ✓ 正确
raise ValueError("msg")    # raise ValueError "msg" 会语法错误

# 无参时的细微差异
try:
    raise ValueError
except ValueError as e:
    print(repr(e.args))      # () —— 空元组

try:
    raise ValueError()
except ValueError as e:
    print(repr(e.args))      # () —— 空元组，一样
```

**实际差异场景**：当异常类可以通过类方法或属性提供额外信息时，直接抛类和抛实例有行为差别——虽然内置异常没有这个区分，但自定义异常可以：

```python
class RequestError(Exception):
    def __init__(self, status_code: int, message: str = ""):
        self.status_code = status_code
        self.message = message
        super().__init__(f"HTTP {status_code}: {message}")

# 抛类：调用 __init__(self)，没有初始化参数，可能出错
# raise RequestError  # TypeError: __init__() missing 1 required positional argument: 'status_code'

# 抛实例：传递参数
raise RequestError(404, "Not Found")  # ✓ 正确
```

**工程建议**：推荐统一写成 `raise SomeException("message")` 带括号的形式。理由有二：

1. 一致性——无论异常类是否需要参数，写法统一。
2. 明确——形式 1 明确表达了"我正在创建一个异常实例并抛出"。

```python
# 推荐写法：统一带括号
raise ValueError("参数不合法")
raise RuntimeError("系统繁忙")
raise CustomError(code=1001, message="业务规则被违反")
```

### 2.3 raise 不带参数：重新抛出当前异常

`raise` 单独使用时，在 `except` 块中**重新抛出当前正在处理的异常**。这是 Python 异常处理中一个至关重要的模式：你可以在 `except` 块中记录日志、执行清理，然后保留异常继续向上传播，让上层调用方决定如何处理。

```python
def read_config(filepath: str) -> dict:
    """读取配置文件，出错时记录日志后重新抛出"""
    try:
        with open(filepath, 'r') as f:
            return eval(f.read())  # 简化示意，实际应用中用 json.load
    except FileNotFoundError as e:
        print(f"[错误] 配置文件不存在: {filepath}")
        raise  # 重新抛出，让上层处理
    except PermissionError as e:
        print(f"[错误] 没有读取权限: {filepath}")
        raise  # 重新抛出
    except Exception as e:
        print(f"[错误] 读取配置时发生未知错误: {e}")
        raise  # 重新抛出

try:
    config = read_config("/etc/myapp/config.py")
except FileNotFoundError:
    print("使用默认配置启动")
    config = {"debug": False, "port": 8080}
```

运行结果说明：`read_config` 函数内部捕获了各种可能的文件读取异常，打印日志后全部重新抛出。调用方选择处理 `FileNotFoundError`（降级使用默认配置），而其他异常（如 `PermissionError`）因为没有对应的 `except` 子句，继续向上传播直到程序终止并打印 traceback。

**重新抛出的关键特性**：

- 保留原始 traceback：如果后面用 `except Exception as e` 再次捕获，`traceback` 中显示的是原始异常发生的位置（文件操作那一行），而不是 `raise` 这一行。这对调试非常关键。
- 不会丢失异常类型和上下文：重新抛出后异常类型、消息、追踪栈都完整保留。

```python
import traceback

def inner():
    try:
        raise ValueError("内部错误")
    except ValueError:
        print("inner 记录日志")
        raise  # 原始异常继续上抛

def outer():
    try:
        inner()
    except ValueError as e:
        print("outer 捕获到:")
        traceback.print_exc()
        # traceback 会指向 inner 函数中 raise ValueError 的那一行
        # 而不是 raise 这一行

outer()
# 输出：
# inner 记录日志
# outer 捕获到:
# Traceback (most recent call last):
#   File "...", line X, in inner
#     raise ValueError("内部错误")
# ValueError: 内部错误
```

运行结果说明：即使 `raise`（无参数）发生在 `inner` 函数的 `except` 块中，traceback 仍然指向原始 `raise ValueError` 的位置。Python 的异常重新抛出会沿着调用链保持原始异常信息不变。

### 2.4 raise 重新抛出 vs print + pass

初学者在 `except` 块中处理异常时，有时会使用 `print` + `pass` 的组合，而不是用 `raise` 重新抛出。这两种模式有本质区别：

```python
# 模式 A：print + pass（吞掉异常）
try:
    result = 1 / 0
except ZeroDivisionError:
    print("发生除零错误，跳过")
    # pass 隐式存在——没做任何事，异常被吞掉

# 模式 B：raise（重新抛出）
try:
    result = 1 / 0
except ZeroDivisionError:
    print("记录日志...")
    raise  # 保留异常继续传播
```

**区别分析**：

| 对比项 | `print` + `pass` | `raise`（重新抛出） |
|--------|------------------|---------------------|
| 异常去向 | 被彻底吞掉 | 继续向上传播 |
| 调用方 | 完全不知情 | 可以通过 except 捕获 |
| traceback | 丢失（仅打印了消息） | 完整保留 |
| 调试难度 | 高（异常静默消失） | 低（追踪链完整） |
| 适用场景 | 你确实想无视这个错误 | 你只想记录/补充后交上层处理 |

```python
def process_items(items: list) -> int:
    """处理数据，记录错误日志后重新抛出"""
    total = 0
    for i, item in enumerate(items):
        try:
            total += 1 / item  # 如果 item 为 0 会抛 ZeroDivisionError
        except ZeroDivisionError:
            print(f"[警告] 第 {i} 个元素为零，跳过")
            # 注意：这里没有 raise——等于吞掉了异常
            # 这个设计可能合理：除零是数据问题，跳过继续处理
    return total

# 调用方完全不知道内部发生了除零
result = process_items([1, 2, 0, 3, 0, 4])
print(f"结果: {result}")  # 结果: 9（跳过两个零，其余正常求和）
```

运行结果说明：这个例子中 `print` + `pass` 是合理的——除零被当作"数据脏"处理，跳过即可。但如果这种错误不应该静默发生，就应该用 `raise` 暴露给上层。

```python
# 不推荐：吞掉真正致命的错误
def transfer(amount: float, balance: float) -> float:
    try:
        if amount > balance:
            raise ValueError("余额不足")
        return balance - amount
    except ValueError:
        print("余额不足")  # 只是打印，不处理——还吞了异常
        return balance     # 返回原余额，但调用方以为扣款成功了

new_balance = transfer(1000, 500)  # 应该报错但没报
print(f"余额: {new_balance}")      # 余额: 500 —— 调用方不知道发生了异常
```

运行结果说明：这里 `print` + `pass` 是危险的——调用方看到返回值以为操作正常完成，但实际上交易被静默拒绝了。如果函数内无法处理这个问题，就应该 `raise` 让调用方来做决策。

**经验法则**：如果你捕获了一个异常但不知道如何处理它，就**不要捕获它**，或者捕获后记录日志用 `raise` 重新抛出。永远不要默认吞掉异常——除非你明确确认在这个点吞咽是安全的。

### 2.5 raise 在 except 块外不带参数会抛 RuntimeError

这是初学者容易踩的坑：在 `except` 块之外写一个裸 `raise`。

```python
# 错误示例：except 块外裸 raise
def bad_function():
    raise  # RuntimeError: No active exception to re-raise

try:
    bad_function()
except RuntimeError as e:
    print(f"捕获到 RuntimeError: {e}")
# 输出：捕获到 RuntimeError: No active exception to re-raise
```

```python
# 更常见的踩坑场景
def process_data(data):
    try:
        result = data["key"]
    except KeyError:
        print("key 不存在")
        # 打算重新抛出，但忘了写 raise 而写成了别的
        # 先写 print，后面忘了 raise
    # 经过若干行代码后...
    if True:  # 假装有个条件
        raise  # ✗ RuntimeError: No active exception to re-raise
```

技术上，裸 `raise` 会尝试从当前线程的异常栈中获取当前异常对象。如果不在 `except` 块中，异常栈为空（没有"当前异常"），Python 就会抛出一个 `RuntimeError`，消息为 "No active exception to re-raise"。

**如何避免**：始终保持裸 `raise` 缩进在 `except` 块内部，不要在 `except` 块结束后再写裸 `raise`。

```python
# 正确做法
def process_data_safe(data):
    try:
        result = data["key"]
    except KeyError:
        print("key 不存在")
        raise  # ✓ 缩进在 except 块内
    # 这里不要写 raise
```

### 2.6 选择合适的内置异常来抛

Python 内置了丰富的异常类型。选择合适的异常类型来抛，是 API 设计的一部分——它让调用方可以精确地捕获和处理不同类型的错误。下面是常用的"抛出用"内置异常及其典型场景：

| 异常类型 | 典型抛出场景 |
|----------|-------------|
| `ValueError` | 参数值不合法（类型对但值不对） |
| `TypeError` | 参数类型不合法（传入的数据类型不对） |
| `KeyError` | 字典中找不到键 |
| `IndexError` | 序列索引越界 |
| `AttributeError` | 对象没有某个属性或方法 |
| `RuntimeError` | 运行时出现不特定的错误 |
| `NotImplementedError` | 抽象方法未实现（子类必须覆写） |
| `StopIteration` | 迭代器没有更多元素 |
| `FileNotFoundError` | 文件不存在 |
| `PermissionError` | 权限不足 |
| `OverflowError` | 数值运算结果超出范围 |
| `LookupError` | `KeyError` 和 `IndexError` 的共同基类 |

```python
def set_age(age: int) -> None:
    """设置用户年龄，展示不同异常类型的选择"""
    # TypeError：类型错误
    if not isinstance(age, int):
        raise TypeError(f"年龄必须是整数，收到: {type(age).__name__}")

    # ValueError：值不合法
    if age < 0:
        raise ValueError(f"年龄不能为负数，收到: {age}")
    if age > 150:
        raise ValueError(f"年龄不合法，收到: {age}")

    print(f"年龄设置成功: {age}")

# 测试 TypeError
try:
    set_age("25")
except TypeError as e:
    print(f"[TypeError] {e}")  # [TypeError] 年龄必须是整数，收到: str

# 测试 ValueError
try:
    set_age(-1)
except ValueError as e:
    print(f"[ValueError] {e}")  # [ValueError] 年龄不能为负数，收到: -1
```

**NotImplementedError 的特殊用途**：

`NotImplementedError` 在抽象基类和模板方法模式中非常有用——它告诉继承者："你得实现这个方法，否则就跑不起来"。

```python
class BaseParser:
    """基础解析器——子类必须实现 parse 方法"""
    def parse(self, data: str) -> dict:
        raise NotImplementedError("子类必须实现 parse() 方法")

class JsonParser(BaseParser):
    def parse(self, data: str) -> dict:
        import json
        return json.loads(data)

class CsvParser(BaseParser):
    pass  # 忘了实现 parse

parsers = [JsonParser(), CsvParser()]
for p in parsers:
    try:
        p.parse('{"key": "value"}')
    except NotImplementedError as e:
        print(f"[错误] {e}")
# 输出：[错误] 子类必须实现 parse() 方法
```

运行结果说明：`CsvParser` 没有覆写 `parse` 方法，调用时触发了基类的 `raise NotImplementedError`，在开发阶段就能及时发现问题——这比返回一个空值或默认值好得多，因为错误会被尽早发现。

### 2.7 自定义异常类

当内置异常不足以表达业务语义时，可以创建自定义异常类。自定义异常应该继承自 `Exception`（不是 `BaseException`——那会干扰系统级异常的处理）。

**基本自定义异常**：

```python
class InsufficientBalanceError(Exception):
    """余额不足异常"""
    pass

def withdraw(amount: float, balance: float) -> float:
    if amount > balance:
        raise InsufficientBalanceError(
            f"余额不足：需 {amount}，实有 {balance}"
        )
    return balance - amount

try:
    withdraw(500, 100)
except InsufficientBalanceError as e:
    print(f"交易失败: {e}")
# 输出：交易失败: 余额不足：需 500，实有 100
```

**带结构化信息的高级自定义异常**：

自定义异常可以包含额外的结构化属性，让上层处理时能获取更多上下文：

```python
class BusinessValidationError(Exception):
    """业务校验异常——带错误码和字段信息"""

    def __init__(self, code: str, field: str, message: str):
        self.code = code
        self.field = field
        self.message = message
        super().__init__(f"[{code}] {field}: {message}")

class OrderService:
    @staticmethod
    def place_order(user_id: int, product_id: str, quantity: int):
        if quantity <= 0:
            raise BusinessValidationError(
                code="INVALID_QTY",
                field="quantity",
                message="购买数量必须大于 0"
            )
        if not product_id.startswith("PROD-"):
            raise BusinessValidationError(
                code="INVALID_PROD_ID",
                field="product_id",
                message="商品 ID 格式不正确"
            )
        print(f"订单创建成功: user={user_id}, product={product_id}, qty={quantity}")

try:
    OrderService.place_order(1001, "ABC-001", 0)
except BusinessValidationError as e:
    print(f"业务错误码: {e.code}")
    print(f"错误字段: {e.field}")
    print(f"错误详情: {e.message}")
    # 输出：
    # 业务错误码: INVALID_QTY
    # 错误字段: quantity
    # 错误详情: 购买数量必须大于 0
```

运行结果说明：自定义异常 `BusinessValidationError` 携带了 `code`（机器可读的错误码）、`field`（出错的字段名）、`message`（人类可读的描述）三个结构化属性。上层可以在 `except` 中提取这些属性做精细处理——比如用 `code` 在前端显示对应的国际化错误文案。

**自定义异常的分层设计**：

在较大的项目中，通常会设计一个异常基类体系：

```python
class AppBaseError(Exception):
    """应用基础异常"""
    def __init__(self, message: str, code: str = "UNKNOWN"):
        self.code = code
        self.message = message
        super().__init__(message)

class UserError(AppBaseError):
    """用户相关异常"""
    pass

class UserNotFoundError(UserError):
    def __init__(self, user_id: int):
        super().__init__(f"用户不存在: {user_id}", code="USER_NOT_FOUND")

class UserDisabledError(UserError):
    def __init__(self, user_id: int, reason: str = ""):
        super().__init__(
            f"用户已被禁用: {user_id} ({reason})",
            code="USER_DISABLED"
        )

class OrderError(AppBaseError):
    """订单相关异常"""
    pass

# 使用时可以精确捕获，也可以按层级捕获
try:
    raise UserNotFoundError(42)
except UserNotFoundError as e:     # 精确捕获
    print(f"[{e.code}] {e.message}")
except UserError as e:             # 按层级捕获——捕获所有用户相关异常
    print(f"用户错误: {e.message}")
except AppBaseError as e:          # 捕获所有应用异常
    print(f"应用错误: {e.message}")
# 输出：[USER_NOT_FOUND] 用户不存在: 42
```

### 2.8 raise ... from None：抑制异常链

当一个异常在 `except` 块中触发了另一个异常时，Python 会自动将两个异常关联成**异常链**（exception chain），这通常有助于调试。但某些情况下你希望**隐藏**原始异常，只暴露新的异常——这时用 `raise ... from None`。

先看默认的异常链行为：

```python
def read_user_score():
    """从文件中读取用户分数"""
    try:
        with open("/nonexistent/user_scores.csv", "r") as f:
            data = f.read()
    except FileNotFoundError as e:
        # 在 except 块中抛出了新的异常
        raise RuntimeError("数据文件丢失，请联系管理员") from e

try:
    read_user_score()
except RuntimeError as e:
    import traceback
    traceback.print_exc()
    # traceback 会显示异常链：
    # RuntimeError: 数据文件丢失，请联系管理员
    # —— 由 FileNotFoundError 引发
```

现在用 `from None` 抑制异常链：

```python
def read_user_score_suppressed():
    """从文件中读取用户分数——抑制异常链"""
    try:
        with open("/nonexistent/user_scores.csv", "r") as f:
            data = f.read()
    except FileNotFoundError:
        # from None 抑制原始异常，用户只能看到 RuntimeError
        raise RuntimeError("数据文件丢失，请联系管理员") from None

try:
    read_user_score_suppressed()
except RuntimeError as e:
    import traceback
    traceback.print_exc()
    # traceback 只显示 RuntimeError，没有 FileNotFoundError
    # RuntimeError: 数据文件丢失，请联系管理员
```

**什么时候该用 `from None`**：

- 你的 API 层想对调用方隐藏底层实现细节——比如接口层不应该让调用方看到底层数据库的 `psycopg2.Error`，而应该抛出自定义的 `DatabaseError`。
- 原始异常是调试细节，但与当前异常链无关，反而会让日志变得冗长。

**什么时候不该用 `from None`**：

- 调试阶段——保留异常链可以帮助追踪问题根因。
- 内层异常对外层调用方有诊断价值——比如文件操作失败，暴露底层的 `FileNotFoundError` 有助于定位。

```python
# 合适的场景：API 对外隐藏实现细节
class UserService:
    def get_user(self, user_id: int) -> dict:
        try:
            # 模拟数据库查询
            if user_id <= 0:
                raise ValueError("invalid id")
        except ValueError:
            raise UserNotFoundError(user_id) from None
            # 调用方不需要知道内部用的是 ValueError

# 不应抑制的场景：内部系统调试
try:
    service = UserService()
    service.get_user(0)
except UserNotFoundError as e:
    print(f"用户不存在: {e}")
# 输出：用户不存在: 用户不存在: 0
```

### 2.9 raise ... from：显式异常链

除了 `from None`，还可以用 `raise ... from <exception>` 将一个异常显式关联到另一个异常上：

```python
def process_payment(amount: float, balance: float) -> float:
    """处理支付"""
    if amount <= 0:
        raise ValueError("支付金额必须大于 0")

    if amount > balance:
        balance_error = ValueError(f"余额不足：需 {amount}，实有 {balance}")
        raise RuntimeError("支付失败") from balance_error

    return balance - amount

try:
    process_payment(100, 50)
except RuntimeError as e:
    print(f"原始异常: {e.__cause__}")  # 通过 __cause__ 访问原始异常
    # 输出：原始异常: 余额不足：需 100，实有 50
```

运行结果说明：`raise ... from` 显式设置了异常的 `__cause__` 属性，调用方可以通过 `e.__cause__` 访问原始异常。标准库的 `raise ... from` 用法与此一致——Python 在 `except` 块中抛新异常时自动设置 `__context__`，而 `raise ... from` 设置 `__cause__`，二者在 traceback 中的呈现略有不同。

### 2.10 raise 与 assert 的对比

`assert` 在底层也是通过 `raise AssertionError` 实现的，但两者有本质不同：

```python
# assert：用于开发和测试阶段的"自检"
def divide_positive(a: int, b: int) -> float:
    assert a > 0, "被除数必须为正数"
    assert b > 0, "除数必须为正数"
    return a / b

# raise：用于生产环境的防御性编程
def divide_safe(a: int, b: int) -> float:
    if a <= 0:
        raise ValueError("被除数必须为正数")
    if b <= 0:
        raise ValueError("除数必须为正数")
    return a / b
```

**核心区别**：

| 对比项 | `assert` | `raise` |
|--------|----------|---------|
| 可禁用 | 是（`python -O` 或 `PYTHONOPTIMIZE=1`）| 否 |
| 异常类型 | 固定 `AssertionError` | 任意异常类型 |
| 定位 | 开发时的内部自检 | 生产环境防御性编程 |
| 调试信息 | `assert condition, message` | 可携带丰富结构化属性 |
| 工程信任度 | 低（可能被禁用） | 高（始终生效） |

```python
# assert 被禁用的后果
import sys

def safe_divide(a, b):
    assert b != 0, "除数不能为零"     # 运行 python -O 后这行被跳过
    return a / b

# 模拟 Python -O 模式（禁用 assert）
# __debug__ 在正常模式下为 True，优化模式下为 False
print(f"__debug__ = {__debug__}")  # True（正常执行）

# 演示 assert 被禁用的风险
if not __debug__:
    print("优化模式下 assert 被跳过，除零不会被检查")

# raise 方式不受影响
def robust_divide(a, b):
    if b == 0:
        raise ZeroDivisionError("除数不能为零")
    return a / b

print(robust_divide(10, 2))  # 5.0
# print(robust_divide(10, 0))  # ZeroDivisionError
```

**工程规范**：

- **用 `assert` 检查"不应该发生"的内部状态**——比如算法的不变量、函数内部逻辑的预期、测试中的断言。这些断言是开发期的健康检查，不依赖外部输入。
- **用 `raise` 检查"可能因为外部输入而失败"的条件**——比如参数校验、文件是否存在、数据格式是否正确。这些检查必须始终执行。

```python
def find_median(sorted_data: list) -> float:
    """计算有序列表的中位数"""
    # assert：检查内部不变量——sorted_data 确实是有序的（开发期检查）
    assert all(sorted_data[i] <= sorted_data[i+1]
               for i in range(len(sorted_data) - 1)), "数据必须有序"

    n = len(sorted_data)
    # raise：检查参数有效性（始终执行）
    if n == 0:
        raise ValueError("列表不能为空")

    mid = n // 2
    if n % 2 == 1:
        return sorted_data[mid]
    return (sorted_data[mid - 1] + sorted_data[mid]) / 2

try:
    # 传空列表
    print(find_median([]))
except ValueError as e:
    print(f"参数错误: {e}")
# 输出：参数错误: 列表不能为空
```

运行结果说明：`assert` 检查有序性——这只在开发调试中有用，如果传到生产中且用户禁用了 `assert`，这个检查就不再生效。而空列表检查用 `raise ValueError` 实现，始终生效，适合生产环境。

### 2.11 异常类型选择的工程规范

Python 标准库对异常类型的选择有不成文的约定，理解这些约定能让你的代码异常设计更像"专业 Python"：

**规则一：用 ValueError 表示"类型对但值不对"**

如果参数类型正确但值超出了合法的语义范围，用 `ValueError`。

```python
import math

def set_speed(speed: float) -> None:
    if speed < 0:
        raise ValueError("速度不能为负数")
    if speed > 300:
        raise ValueError("速度超出最大限制 300 km/h")
    if math.isnan(speed):
        raise ValueError("速度不能为 NaN")
    if math.isinf(speed):
        raise ValueError("速度不能为无穷大")

try:
    set_speed(-10)
except ValueError as e:
    print(e)  # 速度不能为负数
```

**规则二：用 TypeError 表示"类型错误"**

调用方传入了错误类型的参数，或者函数调用时参数数量不对，用 `TypeError`。

```python
def connect(host: str, port: int) -> None:
    if not isinstance(host, str):
        raise TypeError(f"host 必须是字符串，收到: {type(host).__name__}")
    if not isinstance(port, int):
        raise TypeError(f"port 必须是整数，收到: {type(port).__name__}")

try:
    connect(123, "8080")
except TypeError as e:
    print(e)  # host 必须是字符串，收到: int
```

**规则三：用 RuntimeError 表示"不该发生的错误"**

当程序运行到了一个"按理说不会到这里"的状态时抛 `RuntimeError`。

```python
def execute_command(cmd: str) -> str:
    """执行命令并返回结果"""
    if cmd not in ("start", "stop", "restart"):
        raise RuntimeError(f"未知命令: {cmd}，这应该是开发者 bug")
    return f"命令 {cmd} 执行成功"

# RuntimeError 通常意味着程序有 bug，而不是外部输入问题
```

**规则四：业务逻辑用自定义异常**

当错误具有特定的业务含义时，创建自定义异常。

```python
class QuotaExceededError(Exception):
    """配额超限异常"""
    pass

def upload_file(user_id: int, file_size: int, quota_remaining: int) -> None:
    if file_size > quota_remaining:
        raise QuotaExceededError(
            f"用户 {user_id} 配额不足：剩余 {quota_remaining}B，需要 {file_size}B"
        )
    print("上传成功")
```

### 2.12 实际场景：参数校验

参数校验是 `raise` 最频繁的使用场景之一。在函数入口处进行防御性检查，用清晰的异常告诉调用方哪里出了问题。

```python
from typing import Any, Optional

def register_user(
    username: str,
    email: str,
    age: int,
    password: str
) -> dict:
    """注册用户——完整的参数校验"""
    # 校验用户名
    if not isinstance(username, str):
        raise TypeError(f"用户名必须是字符串，收到: {type(username).__name__}")
    if not username.strip():
        raise ValueError("用户名不能为空")
    if len(username) < 3 or len(username) > 20:
        raise ValueError("用户名长度必须在 3-20 个字符之间")

    # 校验邮箱
    if not isinstance(email, str):
        raise TypeError(f"邮箱必须是字符串，收到: {type(email).__name__}")
    if "@" not in email or "." not in email.split("@")[-1]:
        raise ValueError(f"邮箱格式不正确: {email}")

    # 校验年龄
    if not isinstance(age, int):
        raise TypeError(f"年龄必须是整数，收到: {type(age).__name__}")
    if age < 0 or age > 150:
        raise ValueError(f"年龄不合法: {age}")

    # 校验密码
    if not isinstance(password, str):
        raise TypeError(f"密码必须是字符串，收到: {type(password).__name__}")
    if len(password) < 8:
        raise ValueError("密码长度不能少于 8 位")
    if not any(c.isdigit() for c in password):
        raise ValueError("密码必须包含至少一位数字")

    print(f"用户 {username} 注册成功")
    return {"username": username, "email": email, "age": age}

# 测试
test_cases = [
    ("alice", "alice@example.com", 25, "securePass123"),  # ✓
    ("ab", "invalid", 25, "short"),                       # ✗
    ("a" * 30, "bob@test.com", 25, "securePass123"),      # ✗
    ("bob", "bob@test.com", -5, "securePass123"),         # ✗
    ("bob", "bob@test.com", 25, "nospecial"),             # ✗
]

for case in test_cases:
    try:
        register_user(*case)
    except (TypeError, ValueError) as e:
        print(f"校验失败: {e}")
# 输出：
# 用户 alice 注册成功
# 校验失败: 用户名长度必须在 3-20 个字符之间
# 校验失败: 用户名长度必须在 3-20 个字符之间
# 校验失败: 年龄不合法: -5
# 校验失败: 密码必须包含至少一位数字
```

运行结果说明：清晰的参数校验在函数入口处拦截了所有非法输入，调用方通过捕获 `TypeError` 和 `ValueError` 即可获得精确的错误信息，不需要深入到函数内部去排查异常原因。

### 2.13 实际场景：业务逻辑验证

在业务系统中，除了参数格式校验，还有更复杂的**业务规则校验**。

```python
class OrderValidationError(Exception):
    """订单校验异常"""
    def __init__(self, code: str, message: str):
        self.code = code
        super().__init__(message)

class InsufficientStockError(Exception):
    """库存不足异常"""
    def __init__(self, product_id: str, requested: int, available: int):
        self.product_id = product_id
        self.requested = requested
        self.available = available
        super().__init__(
            f"商品 {product_id} 库存不足：需要 {requested}，库存 {available}"
        )

def validate_order(
    product_id: str,
    quantity: int,
    unit_price: float,
    user_balance: float,
    inventory: dict
) -> float:
    """验证订单的业务规则，返回订单总额"""
    total_price = quantity * unit_price

    # 规则 1：库存检查
    if product_id not in inventory:
        raise OrderValidationError(
            "PRODUCT_NOT_FOUND",
            f"商品 {product_id} 不存在"
        )
    if inventory[product_id] < quantity:
        raise InsufficientStockError(
            product_id, quantity, inventory[product_id]
        )

    # 规则 2：单笔订单金额上限
    if total_price > 50000:
        raise OrderValidationError(
            "ORDER_AMOUNT_LIMIT",
            f"单笔订单金额不能超过 50000 元，当前: {total_price}"
        )

    # 规则 3：余额检查
    if user_balance < total_price:
        raise OrderValidationError(
            "BALANCE_INSUFFICIENT",
            f"余额不足：需要 {total_price}，余额 {user_balance}"
        )

    # 规则 4：数量合理性
    if quantity > 100:
        raise OrderValidationError(
            "QTY_EXCEEDS_LIMIT",
            "单次购买不能超过 100 件"
        )

    return total_price

# 模拟数据
inventory = {"PROD-001": 50, "PROD-002": 0}

# 测试不同的业务违规场景
test_orders = [
    ("PROD-999", 1, 100, 100000, inventory),  # 商品不存在
    ("PROD-002", 1, 100, 100000, inventory),  # 库存为 0
    ("PROD-001", 600, 100, 100000, inventory),# 金额超限
    ("PROD-001", 10, 100, 500, inventory),    # 余额不足
    ("PROD-001", 200, 100, 100000, inventory),# 数量超限
    ("PROD-001", 5, 100, 10000, inventory),   # ✓ 正常
]

for order in test_orders:
    try:
        total = validate_order(*order)
        print(f"订单验证通过，金额: {total}")
    except InsufficientStockError as e:
        print(f"库存不足: {e}")
    except OrderValidationError as e:
        print(f"业务校验失败 [{e.code}]: {e}")
# 输出：
# 业务校验失败 [PRODUCT_NOT_FOUND]: 商品 PROD-999 不存在
# 库存不足: 商品 PROD-002 库存不足：需要 1，库存 0
# 业务校验失败 [ORDER_AMOUNT_LIMIT]: 单笔订单金额不能超过 50000 元，当前: 60000.0
# 业务校验失败 [BALANCE_INSUFFICIENT]: 余额不足：需要 1000，余额 500
# 业务校验失败 [QTY_EXCEEDS_LIMIT]: 单次购买不能超过 100 件
# 订单验证通过，金额: 500
```

运行结果说明：业务规则校验使用了自定义异常体系——`OrderValidationError` 携带 `code` 用于前端映射，`InsufficientStockError` 携带商品 ID、请求量和库存量三个结构化属性，方便调用方做精细化处理（如提示用户"库存仅剩 X 件"）。

### 2.14 实际场景：权限检查

权限检查是分布式系统和 Web 应用中的常见模式：

```python
class AuthError(Exception):
    """认证/授权异常基类"""
    pass

class NotLoggedInError(AuthError):
    def __init__(self):
        super().__init__("用户未登录")

class PermissionDeniedError(AuthError):
    def __init__(self, user: str, required_role: str):
        self.user = user
        self.required_role = required_role
        super().__init__(f"用户 {user} 缺少角色: {required_role}")

class ResourceForbiddenError(AuthError):
    def __init__(self, user: str, resource: str):
        self.user = user
        self.resource = resource
        super().__init__(f"用户 {user} 无权访问资源: {resource}")

# 模拟角色系统
USER_ROLES = {
    "alice": ["admin"],
    "bob": ["editor"],
    "charlie": ["viewer"],
}

def check_permission(username: str, required_role: str, resource: str) -> None:
    """检查用户是否有权限访问资源"""
    if not username:
        raise NotLoggedInError()

    roles = USER_ROLES.get(username, [])
    if not roles:
        raise PermissionDeniedError(username, required_role)

    if required_role not in roles and "admin" not in roles:
        raise PermissionDeniedError(username, required_role)

    # 资源级权限检查
    if resource == "/api/admin/config" and "admin" not in roles:
        raise ResourceForbiddenError(username, resource)

    print(f"权限检查通过: {username} 访问 {resource}")

# 测试
tests = [
    ("", "viewer", "/api/public"),           # 未登录
    ("david", "viewer", "/api/public"),       # 无此用户
    ("alice", "viewer", "/api/admin/config"), # admin 默认有全部权限
    ("charlie", "admin", "/api/admin/config"),# 角色不足
]

for username, role, resource in tests:
    try:
        check_permission(username, role, resource)
    except NotLoggedInError as e:
        print(f"认证失败: {e}")
    except PermissionDeniedError as e:
        print(f"授权失败: {e}")
    except ResourceForbiddenError as e:
        print(f"资源禁止: {e}")

# 输出：
# 认证失败: 用户未登录
# 授权失败: 用户 david 缺少角色: viewer
# 权限检查通过: alice 访问 /api/admin/config
# 授权失败: 用户 charlie 缺少角色: admin
```

### 2.15 不要在 except 块中做无意义的 raise 又重新捕获

一个反模式是：在 `except` 块中重新抛出异常，然后在同一级或紧邻的上级又用 `try/except` 捕获，等于做了什么又等于没做什么。

```python
# 反模式：无意义的重新捕获
def pointless_re_raise(data):
    try:
        result = data["key"]
    except KeyError:
        raise  # 重新抛出
    return result

# 上层立即又捕获
try:
    pointless_re_raise({})  # 重新抛出的 KeyError 又被这里的 except 捕获
except KeyError as e:
    print(f"处理 KeyError: {e}")  # 等于直接在外面写 try/except，中间那段白干了
```

上面的代码可以简化为：

```python
def simple_version(data):
    try:
        return data["key"]
    except KeyError:
        print("key 不存在")   # 实际干点有用的事
        raise                 # 重新抛出是合理的

# 或者如果不需要记日志，直接不捕获
better = lambda data: data["key"]
```

**什么时候重新抛出是合理的**：

- 你在 `except` 中执行了有意义的操作（日志、计数器增加、资源清理），然后需要让异常继续向上传播。
- 你在当前层级无法完全处理的异常（比如只知道出错了，但不知道应该怎么恢复），交给上层做决策。

```python
# 合理的重新抛出模式
def fetch_user_data(user_id: int) -> dict:
    """从远程 API 获取用户数据"""
    import time

    max_retries = 3
    for attempt in range(max_retries):
        try:
            # 模拟网络请求
            if user_id <= 0:
                raise ValueError(f"无效用户 ID: {user_id}")
            return {"id": user_id, "name": "User"}
        except ConnectionError:
            if attempt < max_retries - 1:
                print(f"连接失败，第 {attempt + 1} 次重试...")
                time.sleep(1)
            else:
                print("重试耗尽，重新抛出")
                raise  # 重试耗尽后重新抛出
        except ValueError:
            raise  # 参数错误，不需要重试，直接抛给上层

try:
    user = fetch_user_data(0)
except ValueError as e:
    print(f"获取用户数据失败: {e}")
# 输出：获取用户数据失败: 无效用户 ID: 0
```

运行结果说明：`fetch_user_data` 中的 `raise` 两种场景都有实际意义——网络错误时先重试再重新抛出，参数错误时直接重新抛出——前者包含了重试逻辑，后者跳过了无意义的重试。

---

## 3. 最佳实践

### 3.1 使用具体的异常类型，而非通用的 Exception

抛出异常时应该尽可能具体。抛出 `raise Exception("错误")` 会让调用方难以精确处理。

```python
# 不推荐：泛泛的 Exception
def divide_bad(a: float, b: float) -> float:
    if b == 0:
        raise Exception("除数不能为零")  # 调用方只能捕获 Exception
    return a / b

# 推荐：使用具体的内置异常
def divide_good(a: float, b: float) -> float:
    if b == 0:
        raise ValueError("除数不能为零")  # 调用方可以精确捕获 ValueError
    return a / b

# 调用方如果只关心"除零"错误而不是所有 Exception，用具体类型更精确
```

### 3.2 异常信息要包含足够的上下文

异常消息应该包含"发生了什么"和"出问题时涉及的关键数据"。

```python
# 不推荐：信息不足
def find_user(users: list, user_id: int) -> dict:
    for user in users:
        if user["id"] == user_id:
            return user
    raise ValueError("未找到用户")  # 不知道是哪个 user_id

# 推荐：包含上下文
def find_user_good(users: list, user_id: int) -> dict:
    for user in users:
        if user["id"] == user_id:
            return user
    raise ValueError(f"未找到用户 ID={user_id}，总用户数={len(users)}")
    # 不仅告诉调用方哪个 ID 没找到，还提供了当前数据规模

try:
    users = [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]
    find_user_good(users, 999)
except ValueError as e:
    print(e)
    # 输出：未找到用户 ID=999，总用户数=2
```

### 3.3 不要用 raise 模拟普通控制流

`raise` 是异常机制，不是特殊的 `return`。不要用它来实现"跳出多层循环"、"提前返回结果"等控制流跳转——Python 有 `break`、`return`、`for...else` 等更合适的工具。

```python
# 不推荐：用异常模拟控制流
def find_first(seq, predicate):
    """用异常退出循环——反模式"""
    result = None
    try:
        for item in seq:
            if predicate(item):
                result = item
                raise StopIteration  # StopIteration 是迭代终止信号，不是控制流工具
    except StopIteration:
        pass
    return result

# 推荐：用普通的控制流
def find_first_good(seq, predicate):
    for item in seq:
        if predicate(item):
            return item
    return None

data = [1, 3, 5, 6, 7]
print(find_first_good(data, lambda x: x % 2 == 0))  # 6
```

### 3.4 自定义异常的命名规范

自定义异常名称应以 `Error` 结尾，清晰表明其异常身份。

```python
# 推荐命名
class ValidationError(Exception): ...
class NetworkTimeoutError(Exception): ...
class DatabaseConnectionError(Exception): ...
class InsufficientStockError(Exception): ...
class PaymentDeclinedError(Exception): ...

# 不推荐命名
class BadThings(Exception): ...       # 看不懂
class UserNotValid(Exception): ...    # 应该是 UserNotValidError
```

### 3.5 不要吞掉你不知道如何处理的异常

"等一等，也许没问题"的心态是生产环境问题的根源。如果不知道如何处理，就不要捕获。

```python
# 反模式：空的 except 吞掉所有错误
def silent_failure(data):
    try:
        return data["key"]
    except:
        pass  # 吃掉所有异常，包括内存错误、系统退出等

# 反模式：只打印了日志但继续执行
def print_and_ignore(data):
    try:
        return data["key"]
    except KeyError:
        print("KeyError")  # 打印了但没处理
    return None  # 调用方不知道是 key 不存在还是其他原因

# 正确的做法
def proper_handling(data):
    try:
        return data["key"]
    except KeyError as e:
        print(f"记录日志: {e}")
        raise  # 重新抛出，让上层处理
```

### 3.6 在恰当的抽象层级抛出异常

底层函数抛出与底层相关的异常，上层函数捕获后转换为上层异常——这是分层异常管理的关键。

```python
# 底层：抛出具体异常
class DataStore:
    def get(self, key: str) -> str:
        # 假设这是从 Redis 查询
        if key == "crash":
            raise ConnectionError("Redis 连接超时")
        return f"value_{key}"

# 上层：转换异常
class UserRepository:
    def __init__(self):
        self.store = DataStore()

    def get_username(self, user_id: int) -> str:
        try:
            return self.store.get(f"user:{user_id}:name")
        except ConnectionError as e:
            raise RuntimeError("用户数据暂时不可用，请稍后重试") from e

# 调用方：只关心上层异常
try:
    repo = UserRepository()
    name = repo.get_username(42)
except RuntimeError as e:
    print(f"服务降级: {e}")
# 输出：服务降级: 用户数据暂时不可用，请稍后重试
```

运行结果说明：`DataStore` 抛出底层 `ConnectionError`，`UserRepository` 在 `except` 中将其转换为业务层面的 `RuntimeError`。调用方不需要知道底层用的是 Redis、MySQL 还是文件系统——这是一种关注点分离的设计。

### 3.7 raise 异常与返回 None 的选择

在函数设计中，什么时候该抛异常，什么时候该返回 `None`？这里有一个工程决策框架：

- **抛异常**：当调用方**不应该忽略**这个错误时。调用方无法合理地从该错误中恢复（至少在当前层级不能）。
- **返回 None / 空值**：当这个结果"不存在"是预期内的正常业务逻辑时。比如根据 ID 查找用户——查不到是正常的。

```python
# 场景 A：查不到是正常的——返回 None
def find_user_optional(user_id: int) -> dict | None:
    """根据 ID 查找用户，可能不存在"""
    user_db = {1: {"name": "Alice"}}
    return user_db.get(user_id)  # 不存在时返回 None

user = find_user_optional(999)
if user is None:
    # 这是正常的业务逻辑——我预期可能查不到
    user = {"name": "Guest"}


# 场景 B：必须找到——抛异常
def get_user_required(user_id: int) -> dict:
    """获取用户信息——必须存在"""
    user_db = {1: {"name": "Alice"}}
    if user_id not in user_db:
        raise KeyError(f"用户 {user_id} 必须存在但未找到")
    return user_db[user_id]

try:
    user = get_user_required(999)
except KeyError as e:
    # 这是异常情况——系统假设用户存在但实际不存在
    print(f"数据不一致: {e}")
```

### 3.8 资源清理用 finally，而不是 try/except/raise

如果需要确保即使出现异常也执行清理工作，用 `finally` 而不是手动 `raise`。

```python
# 不推荐：手动 try/except/raise 做清理
def read_file_v1(path: str) -> str:
    file = open(path, "r")
    try:
        return file.read()
    except:
        file.close()
        raise

# 推荐：finally 确保清理
def read_file_v2(path: str) -> str:
    file = open(path, "r")
    try:
        return file.read()
    finally:
        file.close()  # 无论是否异常都会执行

# 最佳：使用 with 语句自动管理资源
def read_file_v3(path: str) -> str:
    with open(path, "r") as file:
        return file.read()  # with 块退出时自动 close
```

---

## 4. 原理

### 4.1 Python 的异常传播机制

当 `raise` 语句执行时，Python 内部会进行一系列操作来传播异常：

**第一步：创建异常对象**

`raise ValueError("msg")` 执行时，Python 首先调用 `ValueError("msg")` 创建异常实例（除非你抛的是异常类本身，这时会自动实例化）。

**第二步：查找异常处理代码**

CPython 的实现中，每个函数帧（frame）的字节码在执行时维护着一个异常处理表（`PyTryBlock` 栈）。当 `raise` 发生时，解释器沿着当前 `PyFrameObject` 的调用栈向上搜索：
1. 先查当前帧有没有匹配的 `except` 子句。
2. 如果没有，当前帧结束执行，异常传播到上一帧（调用者的帧）。
3. 逐层回溯，直到找到匹配的 `except` 或到达顶层帧。

**第三步：展开栈帧**

在搜索过程中，如果遇到 `finally` 块，会先执行 `finally` 代码。`finally` 块中的代码可以"干扰"异常传播：
- 如果 `finally` 中执行了 `return`、`break`、`continue`，异常会被**丢弃**（这是 Python 的一个已知陷阱，详见《finally 子句》笔记）。
- 如果 `finally` 中抛出了新的异常，新异常会替换掉原来的异常。

```python
def demonstrate_stack_unwinding():
    """演示栈展开与 finally 的执行"""
    try:
        print("第1层: 执行中")
        try:
            print("第2层: 即将抛异常")
            raise ValueError("内部错误")
        finally:
            print("第2层的 finally 执行")  # 这个一定会执行
        # 不会到这里——异常在 finally 之后继续传播
    except ValueError as e:
        print(f"第1层捕获: {e}")
    finally:
        print("第1层的 finally 执行")

demonstrate_stack_unwinding()
# 输出：
# 第1层: 执行中
# 第2层: 即将抛异常
# 第2层的 finally 执行
# 第1层捕获: 内部错误
# 第1层的 finally 执行
```

运行结果说明：`raise ValueError` 后，第 2 层的 `finally` 立即执行，然后异常继续传播到第 1 层的 `except` 中被捕获，最后第 1 层的 `finally` 执行。整个过程中，栈帧被有序地展开，每个层级有机会做清理。

```python
def finally_overrides_exception():
    """finally 块中的 return 会吞掉异常"""
    try:
        try:
            raise ValueError("重要错误")
        finally:
            return "finally 中的 return 让异常消失了"
    except ValueError:
        print("这不会被打印")

result = finally_overrides_exception()
print(result)
# 输出：finally 中的 return 让异常消失了
# 注意：ValueError 被吞掉了！这是一个需要警惕的行为
```

### 4.2 raise 语句的 Python 字节码

通过查看 `raise` 对应的字节码，可以更深入理解其底层行为：

```python
import dis

def raise_exception():
    raise ValueError("test")

def raise_re_raise():
    try:
        1 / 0
    except ZeroDivisionError:
        raise

dis.dis(raise_exception)
print("---")
dis.dis(raise_re_raise)
```

```python
# 运行结果（注释说明）：
#   4           0 LOAD_GLOBAL              0 (ValueError)
#               2 LOAD_CONST               1 ('test')
#               4 CALL_FUNCTION            1
#               6 RAISE_VARARGS            1    ← 对应 raise 实例
#               8 NOP
#
# ---
#   9           0 SETUP_FINALLY           12 (to 14)
#               2 LOAD_CONST               1 (1)
#               4 LOAD_CONST               2 (0)
#               6 BINARY_TRUE_DIVIDE
#               8 POP_TOP
#              10 POP_BLOCK
#              12 JUMP_FORWARD            16 (to 30)
#         >>   14 DUP_TOP
#              16 LOAD_GLOBAL              0 (ZeroDivisionError)
#              18 COMPARE_OP              10 (exception match)
#              20 POP_JUMP_IF_FALSE       28
#              22 POP_TOP
#              24 POP_TOP
#              26 POP_TOP
#
#  11          28 RAISE_VARARGS            0    ← 对应裸 raise
#         >>   30 RETURN_VALUE
```

字节码分析：
- `RAISE_VARARGS 1`：从栈顶弹出异常对象（已创建的实例），触发异常传播。
- `RAISE_VARARGS 0`：从当前线程的状态中获取异常对象（`tstate->curexc_value`），重新抛出——这就是为什么裸 `raise` 必须在 `except` 块中才能工作。
- `RAISE_VARARGS 2`：用在 `raise X from Y` 中，同时弹出异常对象 `X` 和原因对象 `Y`。

### 4.3 异常的 __context__ 与 __cause__ 属性

每个异常实例有两个属性用于维护异常链：

- **`__context__`**：当异常在 `except` 块中发生（自动关联）时，Python 自动将当前异常设置为新异常的上下文。
- **`__cause__`**：用 `raise X from Y` 显式设置的"原因"异常。当 `__cause__` 存在时，traceback 显示 "The above exception was the direct cause of..."。
- 当 `raise ... from None` 时，`__cause__` 被设置为 `Ellipsis`（一个哨兵值），Python 看到这个值就会抑制异常链显示。

```python
def cause_vs_context():
    """对比 __cause__ 和 __context__ 的区别"""
    try:
        try:
            raise ValueError("内部错误")
        except ValueError:
            raise RuntimeError("外部错误")  # 这里的 __context__ 指向 ValueError
    except RuntimeError as e:
        print(f"__context__: {e.__context__}")   # 自动上下文
        print(f"__cause__: {e.__cause__}")        # None（没有显式设置）

    print("---")

    try:
        try:
            raise ValueError("内部错误")
        except ValueError as e:
            raise RuntimeError("外部错误") from e  # 显式设置 __cause__
    except RuntimeError as e:
        print(f"__context__: {e.__context__}")     # 仍然被设置
        print(f"__cause__: {e.__cause__}")         # 被显式设置为 ValueError

cause_vs_context()
# 输出：
# __context__: 内部错误
# __cause__: None
# ---
# __context__: 内部错误
# __cause__: 内部错误
```

运行结果说明：`__context__` 总是被 Python 自动填充（只要异常发生在 `except` 块中），而 `__cause__` 仅在显式使用 `raise ... from` 时才被设置。traceback 渲染时优先显示 `__cause__`，如果 `__cause__` 不存在但 `__context__` 存在，则显示 "During handling of the above exception, another exception occurred:"。

### 4.4 raise 与 traceback 对象

Python 3 引入的 `raise X from Y` 还支持链接回溯对象（traceback），但不常见。更实用的是 `raise` 配合 `sys.exc_info()` 的使用：

```python
import sys

def inspect_current_exception():
    """检查当前异常的底层信息"""
    try:
        raise ValueError("测试异常", 42)
    except ValueError:
        # sys.exc_info() 返回 (type, value, traceback) 三元组
        exc_type, exc_value, exc_tb = sys.exc_info()
        print(f"异常类型: {exc_type.__name__}")     # ValueError
        print(f"异常值: {exc_value}")                # 测试异常
        print(f"异常 args: {exc_value.args}")        # ('测试异常', 42)
        print(f"traceback: {exc_tb}")                # <traceback object at 0x...>
        print(f"traceback.tb_frame: {exc_tb.tb_frame}")
        print(f"traceback.tb_lineno: {exc_tb.tb_lineno}")
        print(f"traceback.tb_next: {exc_tb.tb_next}")

inspect_current_exception()
```

运行结果说明：`sys.exc_info()` 是 CPython 内部暴露给 Python 层的线程局部异常状态。`traceback` 对象是通过 `tb_frame`、`tb_lineno`、`tb_next` 组成一个单向链表，用来追踪异常传播路径的。当裸 `raise` 执行时，CPython 正是从线程状态中取出 `exc_value` 来恢复异常传播的。

### 4.5 CPython 中 Raise 的底层流程（简述）

在 CPython 源码（`Python/ceval.c` 的 `do_raise` 函数）中，`raise` 的处理流程如下：

1. **解析参数**：根据 `oparg`（0/1/2）从栈顶弹出对应的操作数。
   - `oparg=0`：裸 `raise`，读取 `tstate->exc_info`。
   - `oparg=1`：弹出异常对象 `exc`。
   - `oparg=2`：弹出异常对象 `exc` 和原因 `cause`。
2. **类型检查**：`exc` 可以是异常类（会实例化）或异常实例。如果不是异常类型也不是异常实例，会抛 `TypeError` 说 "exceptions must derive from BaseException"。
3. **设置 cause/context**：如果有 `cause`，则设置 `exc.__cause__ = cause`（`cause` 为 `None` 时设置 `__cause__ = Ellipsis`，触发异常链抑制）。
4. **查找处理者**：调用 `PyErr_SetObject` 将异常设置到当前线程状态，然后 `PyTraceBack_Here` 记录当前位置。接着 `Py_MakePendingCalls` 处理未决调用，最后 `CHECK_EVAL_BREAKER()` 检查是否需要中断。
5. **栈展开**：开始逐层弹出帧，每弹出一帧执行 `finally` 块（如果有），直到找到匹配的 `except` 子句或者到达顶层。

这个底层流程解释了几个关键行为：
- 裸 `raise` 为什么必须放在 `except` 块中——因为它直接从线程状态读取当前异常，而不在 `except` 块中时线程状态中没有当前异常。
- `raise` 为什么能保留原始 traceback——因为 `PyTraceBack_Here` 在异常设置时被调用，记录的是异常发生位置，而不是 `raise` 语句的位置（裸 `raise` 不重新记录 traceback）。
- `finally` 块为什么能吞掉异常——因为 `finally` 块中的 `return`/`break`/`continue` 在执行清理后被处理，它们的优先级高于异常传播。

---

## 5. 总结

本文系统讲解了 Python 中 `raise` 语句的完整知识体系，涵盖语法、API、工程实践和底层原理。

**核心要点回顾**：

1. **`raise` 的三种形式**：
   - `raise SomeException("msg")`——抛异常实例，最常用形式。
   - `raise SomeException`——抛异常类，自动无参实例化。
   - `raise`（裸 raise）——在 `except` 块中重新抛出当前异常。

2. **异常类型选择指南**：
   - `TypeError`：参数类型错误。
   - `ValueError`：参数值不合法（类型对但值错）。
   - `KeyError`/`IndexError`/`AttributeError`：查找类错误。
   - `RuntimeError`：不应该发生的运行时状态错误。
   - `NotImplementedError`：子类未实现抽象方法。
   - 自定义异常：复杂的业务语义。

3. **异常链控制**：
   - `raise X from Y`：显式设置异常链。
   - `raise ... from None`：抑制异常链。
   - 理解 `__context__`（自动设置）和 `__cause__`（显式设置）的区别。

4. **最佳实践**：
   - 使用具体异常类型，而非笼统的 `Exception`。
   - 异常消息包含足够上下文。
   - 不要在 `except` 块外写裸 `raise`。
   - 不要用异常模拟普通控制流。
   - 不在 `except` 中做无意义的重新捕获。
   - 在恰当的抽象层级抛出和转换异常。

5. **工程决策框架**：
   - 返回值是正常的"不存在"状态 → 返回 `None`/空值。
   - 返回值是不该发生的错误 → 抛异常。
   - 断言是开发期的内部检查 → 用 `assert`。
   - 参数校验是生产期的防御 → 用 `raise ValueError/TypeError` 等。

**读完本文你应能掌握**：
- 在 Python 代码中选择合适的时机和异常类型使用 `raise` 主动抛出异常。
- 区分 `raise Exception()`、`raise Exception`、`raise`（裸 raise）三种写法的行为差异和适用场景。
- 设计并使用自定义异常体系（包括分层继承、结构化属性、错误码）。
- 使用 `raise ... from` 和 `raise ... from None` 控制异常链和错误隐藏。
- 在参数校验、业务逻辑验证、权限检查等典型场景中正确运用 `raise`。
- 理解裸 `raise` 只能在 `except` 块中使用的原因（从 CPython 的异常传播机制和字节码层面）。
- 区分 `assert` 和 `raise` 的定位差异，在合适场景选择合适的检查方式。
- 了解 `except` 块中无意义的重新捕获反模式及其改进方案。