---
group:
  title: 【10】异常处理完整体系
  order: 10
order: 3
title: 获取异常对象
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是异常对象

当 Python 代码执行过程中遇到错误时，解释器会创建一个异常对象（Exception Object）来描述这个错误。异常对象是异常类的实例，携带错误消息、错误类型、堆栈跟踪等信息。整个异常继承体系根节点是 `BaseException`，其下分为 `SystemExit`、`KeyboardInterrupt`、`GeneratorExit` 和常规的 `Exception`。

获取异常对象是指在 `except` 子句中使用 `as` 关键字将异常实例绑定到一个变量上，从而可以访问异常的详细信息。学会正确获取和操作异常对象，是编写健壮 Python 代码的核心技能之一。从异常对象中提取的错误类型、消息和堆栈信息，可以帮助开发者精准定位问题并做出有针对性的处理。

### 1.2 基本语法：except 子句绑定异常

获取异常对象最基础的方式是 `except ExceptionType as variable_name` 语法：

```python
try:
    result = 10 / 0
except ZeroDivisionError as e:
    # e 就是被捕获的异常对象（ZeroDivisionError 的实例）
    print(f"捕获到异常：{e}")
    print(f"异常类型：{type(e).__name__}")
    print(f"异常对象的模块：{type(e).__module__}")

# 输出：
# 捕获到异常：division by zero
# 异常类型：ZeroDivisionError
# 异常对象的模块：builtins
```

这里的 `e` 就是被赋值的异常变量。它在 `except` 块内有效，可以通过它的各种属性和方法获取丰富的诊断信息。Python 的异常对象设计得相当完善，不仅包含错误消息，还通过属性链记录了异常的完整上下文。

### 1.3 异常对象的核心作用

异常对象不仅用于记录错误，它在 Python 的异常处理机制中还承担了以下角色：

```python
# 作用一：区分不同的错误情况
def parse_user_input(text):
    try:
        value = int(text)
        return value
    except ValueError as e:
        if "base 10" in str(e):
            print("输入内容不是有效的数字格式")
        elif "invalid literal" in str(e):
            print("输入包含非法字符")
        return None

# 作用二：传播错误上下文
def load_user_profile(user_id):
    try:
        with open(f"users/{user_id}.json") as f:
            return f.read()
    except FileNotFoundError as e:
        # e 包含了文件名、错误码等信息
        print(f"文件 {e.filename} 不存在，错误码：{e.errno}")
        raise  # 保留异常信息重抛

# 作用三：构建异常链，保留根因
def process_order(order_id):
    try:
        int(order_id)
    except ValueError as e:
        raise RuntimeError(f"处理订单 {order_id} 失败") from e

parse_user_input("abc")
print("---")
load_user_profile(99999)

# 输出（需要捕获异常）：
# 输入内容不是有效的数字格式
# ---
# 文件 users/99999.json 不存在，错误码：2
# 异常在上层捕获（因 raise 而传播）
```

## 2. 核心内容

### 2.1 except 子句中的异常绑定语法

**单类型捕获并绑定**

这是最基本的形式，捕获指定类型的异常并绑定到变量：

```python
def fetch_data(api_url):
    """模拟 API 数据获取"""
    import random
    if random.random() < 0.5:
        raise ConnectionError(f"无法连接到 {api_url}")
    return {"status": "ok", "data": [1, 2, 3]}

for i in range(5):
    try:
        result = fetch_data("https://api.example.com/data")
        print(f"请求成功：{result}")
        break
    except ConnectionError as e:
        print(f"连接失败（第 {i+1} 次）：{e}")
else:
    print("所有重试均失败")

# 输出（随机，可能运行多次才成功，也可能最终走 else）：
# 连接失败（第 1 次）：无法连接到 https://api.example.com/data
# 连接失败（第 2 次）：无法连接到 https://api.example.com/data
# 请求成功：{'status': 'ok', 'data': [1, 2, 3]}
```

**多类型捕获共享绑定**

用元组同时捕获多个异常类型，共用一个异常变量：

```python
def process_data(data):
    """处理数据，可能触发不同类型异常"""
    if not isinstance(data, (list, tuple)):
        raise TypeError("数据必须是列表或元组")
    if len(data) == 0:
        raise ValueError("数据不能为空")
    return [x * 2 for x in data]

test_cases = [
    "not_a_list",      # 触发 TypeError
    [],                # 触发 ValueError
    [1, 2, 3],         # 正常
]

for case in test_cases:
    try:
        result = process_data(case)
        print(f"处理结果：{result}")
    except (TypeError, ValueError) as e:
        print(f"数据格式错误：{type(e).__name__}: {e}")

# 输出：
# 数据格式错误：TypeError: 数据必须是列表或元组
# 数据格式错误：ValueError: 数据不能为空
# 处理结果：[2, 4, 6]
```

**捕获所有异常（不推荐）**

使用 `except BaseException as e` 或裸 `except` 可以捕获所有异常，但在生产代码中应避免：

```python
def risky_operation():
    """高风险操作"""
    import random
    choice = random.choice(["value_error", "type_error", "zero_division", "keyboard"])
    if choice == "value_error":
        raise ValueError("值错误")
    elif choice == "type_error":
        raise TypeError("类型错误")
    elif choice == "zero_division":
        return 1 / 0
    elif choice == "keyboard":
        raise KeyboardInterrupt("用户中断")  # 这种不应该被捕获

# ❌ 不推荐：捕获所有异常
try:
    risky_operation()
except BaseException as e:  # 会捕获 KeyboardInterrupt 和 SystemExit
    print(f"异常被捕获：{type(e).__name__}: {e}")

# ✅ 推荐：只捕获预期的 Exception 子类
try:
    risky_operation()
except Exception as e:  # 不会捕获 KeyboardInterrupt/SystemExit
    print(f"捕获到异常：{type(e).__name__}: {e}")

# 输出（随机）：
# 异常被捕获：ValueError: 值错误
# 捕获到异常：TypeError: 类型错误
```

**不捕获异常对象（省略 as）**

如果不需要异常对象的信息，可以省略 `as`：

```python
def safe_delete(filepath):
    """安全删除文件"""
    import os
    try:
        os.remove(filepath)
    except FileNotFoundError:  # 不需要异常对象，直接省略 as
        # 文件不存在是预期行为，不需要处理
        pass
    except PermissionError as e:  # 需要错误信息
        print(f"无权限删除 {filepath}：{e}")
        raise

safe_delete("/tmp/nonexistent.txt")
print("安全删除完成（FileNotFoundError 被忽略）")

# 输出：
# 安全删除完成（FileNotFoundError 被忽略）
```

### 2.2 异常变量的作用域与生命周期

**Python 3 的异常变量清除机制**

Python 3 在 `except` 块结束后会自动删除异常变量，这是为了打破循环引用，避免内存泄漏：

```python
import sys

def demonstrate_scope():
    """演示异常变量的作用域"""
    try:
        int("abc")
    except ValueError as e:
        print(f"=== 在 except 块内 ===")
        print(f"e 存在：{e}")
        print(f"sys.exc_info(): {sys.exc_info()[1]}")
        # e 在此处有效
        saved_e = e  # 如果要保留，需要手动拷贝引用

    print(f"=== 在 except 块外 ===")
    try:
        print(f"e 的值：{e}")
    except NameError as ne:
        print(f"e 已被清除：{ne}")
    print(f"sys.exc_info(): {sys.exc_info()[1]}")  # 也被清除

demonstrate_scope()

# 输出：
# === 在 except 块内 ===
# e 存在：invalid literal for int() with base 10: 'abc'
# sys.exc_info(): invalid literal for int() with base 10: 'abc'
# === 在 except 块外 ===
# e 已被清除：name 'e' is not defined
# sys.exc_info(): None
```

**保存异常对象引用**

如果你需要在 `except` 块外使用异常对象，必须手动保存引用：

```python
def collect_exceptions():
    """收集异常用于日志记录"""
    errors = []
    operations = [
        ("parse_int", lambda: int("xyz")),
        ("divide", lambda: 1 / 0),
        ("access_index", lambda: [1, 2, 3][10]),
    ]

    for name, op in operations:
        try:
            op()
        except Exception as e:
            # 手动保存异常对象引用
            errors.append({
                "operation": name,
                "exception": e,
                "type": type(e).__name__,
                "message": str(e),
            })

    # 查看所有收集到的异常
    print("=== 收集到的异常 ===")
    for err in errors:
        print(f"  {err['operation']}: [{err['type']}] {err['message']}")

    return errors

collect_exceptions()

# 输出：
# === 收集到的异常 ===
#   parse_int: [ValueError] invalid literal for int() with base 10: 'xyz'
#   divide: [ZeroDivisionError] division by zero
#   access_index: [IndexError] list index out of range
```

**`sys.exc_info()` 的清除时机**

`sys.exc_info()` 在 `except` 块执行完毕后也会被清除，这一行为与异常变量删除是一体的：

```python
import sys

def check_exc_info():
    """检查 sys.exc_info 在不同阶段的值"""
    print("1. 无异常时:", sys.exc_info())
    try:
        raise ValueError("测试错误")
    except ValueError:
        print("2. except 块内:", sys.exc_info()[1])
        # 即使显式保存，except 结束后也会被清除
        saved = sys.exc_info()

    print("3. except 块外:", sys.exc_info()[1])
    print("4. 手动保存的引用:", saved[1])  # 只有手动保存的引用还存活

check_exc_info()

# 输出：
# 1. 无异常时: (None, None, None)
# 2. except 块内: 测试错误
# 3. except 块外: None
# 4. 手动保存的引用: 测试错误
```

### 2.3 异常对象的基础属性

每个异常对象都继承自 `BaseException`，因此共享一组基础属性。

**`args` 属性详解**

`args` 是最核心的属性，它是一个元组，包含传给异常构造函数的所有位置参数：

```python
# args 的多种形态
print("=== 零参数 ===")
try:
    raise ValueError()
except ValueError as e:
    print(f"  args = {e.args}")
    print(f"  len(args) = {len(e.args)}")
    print(f"  str(e) = '{e}'")

print()

print("=== 单字符串参数（最常见）===")
try:
    raise ValueError("年龄不能为负数")
except ValueError as e:
    print(f"  args = {e.args}")
    print(f"  args[0] = {e.args[0]!r}")
    print(f"  str(e) = '{e}'")

print()

print("=== 多参数 ===")
try:
    raise ValueError("格式错误", "字段：email", 42)
except ValueError as e:
    print(f"  args = {e.args}")
    print(f"  args[0] = {e.args[0]!r}")
    print(f"  args[1] = {e.args[1]!r}")
    print(f"  args[2] = {e.args[2]!r}")
    print(f"  str(e) = '{e}'")

print()

print("=== 混合类型参数 ===")
try:
    raise TypeError("类型不匹配", ("int", "str"), {"expected": "int", "got": "str"})
except TypeError as e:
    print(f"  args = {e.args}")
    # 遍历所有参数
    for i, arg in enumerate(e.args):
        print(f"  args[{i}] = {arg!r} (type: {type(arg).__name__})")

# 输出：
# === 零参数 ===
#   args = ()
#   len(args) = 0
#   str(e) = ''
# 
# === 单字符串参数（最常见）===
#   args = ('年龄不能为负数',)
#   args[0] = '年龄不能为负数'
#   str(e) = '年龄不能为负数'
# 
# === 多参数 ===
#   args = ('格式错误', '字段：email', 42)
#   args[0] = '格式错误'
#   args[1] = '字段：email'
#   args[2] = 42
#   str(e) = ('格式错误', '字段：email', 42)
# 
# === 混合类型参数 ===
#   args = ('类型不匹配', ('int', 'str'), {'expected': 'int', 'got': 'str'})
#   args[0] = '类型不匹配'
#   args[1] = ('int', 'str')
#   args[2] = {'expected': 'int', 'got': 'str'}
```

**`args` 与 `str(e)` 的关系**

```python
# 不同异常类对 args 的处理方式
print("=== ValueError（单参数）===")
try:
    raise ValueError("值不正确")
except ValueError as e:
    print(f"  str(e) = {str(e)}")
    print(f"  args = {e.args}")

print()
print("=== OSError（多参数，含 errno）===")
import os
try:
    os.remove("/nonexistent_file")
except OSError as e:
    print(f"  str(e) = {str(e)}")
    print(f"  args = {e.args}")
    print(f"  errno = {e.errno}")
    print(f"  strerror = {e.strerror}")
    print(f"  filename = {e.filename}")

print()
print("=== UnicodeDecodeError（结构化参数）===")
try:
    b"\xff\xfe\x00\x01\x02".decode("utf-8")
except UnicodeDecodeError as e:
    print(f"  str(e) = {str(e)}")
    print(f"  args = {e.args}")
    print(f"  encoding = {e.encoding}")
    print(f"  start = {e.start}")
    print(f"  end = {e.end}")
    print(f"  reason = {e.reason}")

# 输出：
# === ValueError（单参数）===
#   str(e) = 值不正确
#   args = ('值不正确',)
# 
# === OSError（多参数，含 errno）===
#   str(e) = [Errno 2] No such file or directory: '/nonexistent_file'
#   args = (2, 'No such file or directory', '/nonexistent_file')
#   errno = 2
#   strerror = No such file or directory
#   filename = /nonexistent_file
# 
# === UnicodeDecodeError（结构化参数）===
#   str(e) = 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
#   args = ('utf-8', b'\xff\xfe\x00\x01\x02', 0, 5, 'invalid start byte')
#   encoding = utf-8
#   start = 0
#   end = 5
#   reason = invalid start byte
```

**`__traceback__` 属性**

这个属性持有异常发生时的堆栈回溯对象（traceback 对象），用于定位异常发生的准确位置：

```python
import traceback

def level_one():
    return level_two()

def level_two():
    return level_three()

def level_three():
    raise ValueError("最深处的错误")

try:
    level_one()
except ValueError as e:
    # 获取完整的堆栈回溯对象
    tb = e.__traceback__
    print(f"__traceback__ 类型：{type(tb).__name__}")
    print()

    # 使用 traceback 模块提取帧信息
    frames = traceback.extract_tb(tb)
    print(f"堆栈深度：{len(frames)} 层")
    for idx, frame in enumerate(frames):
        print(f"  层级 {idx}：")
        print(f"    文件：{frame.filename}")
        print(f"    行号：{frame.lineno}")
        print(f"    函数：{frame.name}")
        print(f"    代码：{frame.line!r}")

# 输出：
# __traceback__ 类型：traceback
# 
# 堆栈深度：3 层
#   层级 0：
#     文件：<ipython-input-...>
#     行号：5
#     函数：level_one
#     代码：'return level_two()'
#   层级 1：
#     文件：<ipython-input-...>
#     行号：8
#     函数：level_two
#     代码：'return level_three()'
#   层级 2：
#     文件：<ipython-input-...>
#     行号：11
#     函数：level_three
#     代码：'raise ValueError("最深处的错误")'
```

**`__context__` 属性（隐式异常链）**

当在 `except` 块中抛出新异常时，Python 自动将原始异常设置为新异常的 `__context__`：

```python
import traceback

def parse_config_file(config_path):
    """读取并解析配置文件"""
    try:
        with open(config_path, "r") as f:
            return f.read()
    except FileNotFoundError as e:
        # 发生 FileNotFoundError 时，又抛出了新的 RuntimeError
        # Python 自动将 FileNotFoundError 设置为 RuntimeError 的 __context__
        raise RuntimeError(f"无法读取配置文件：{config_path}")

try:
    parse_config_file("/tmp/nonexistent_config.json")
except RuntimeError as e:
    print(f"当前异常：{type(e).__name__}: {e}")
    print(f"__context__（原始异常）：{type(e.__context__).__name__}: {e.__context__}")
    print(f"__cause__（显式原因）：{e.__cause__}")
    print()
    print("完整异常链：")
    traceback.print_exc()

# 输出：
# 当前异常：RuntimeError: 无法读取配置文件：/tmp/nonexistent_config.json
# __context__（原始异常）：FileNotFoundError: [Errno 2] No such file or directory: '/tmp/nonexistent_config.json'
# __cause__（显式原因）：None
# 
# 完整异常链：
# Traceback (most recent call last):
#   ...
#     FileNotFoundError: [Errno 2] No such file or directory: '/tmp/nonexistent_config.json'
#     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
# During handling of the above exception, another exception occurred:
# 
# Traceback (most recent call last):
#   ...
#     raise RuntimeError(f"无法读取配置文件：{config_path}")
# RuntimeError: 无法读取配置文件：/tmp/nonexistent_config.json
```

**`__cause__` 属性（显式异常链）**

使用 `raise ... from` 语法显式设置异常链的原因：

```python
import traceback

class DataValidationError(Exception):
    """数据校验失败"""
    pass

def validate_user_email(email):
    if "@" not in email:
        raise ValueError(f"邮箱格式错误：{email}")

def register_user(username, email):
    try:
        validate_user_email(email)
    except ValueError as e:
        # 显式设置异常链：使用 from 语法
        raise DataValidationError(f"用户 {username} 注册失败") from e

try:
    register_user("张三", "invalid-email")
except DataValidationError as e:
    print(f"当前异常：{type(e).__name__}: {e}")
    print(f"__cause__（显式设置的原因）：{type(e.__cause__).__name__}: {e.__cause__}")
    print(f"__context__（也被设置了）：{type(e.__context__).__name__}: {e.__context__}")
    print(f"__suppress_context__：{e.__suppress_context__}")
    print()
    print("异常链输出（只显示 __cause__）：")
    traceback.print_exc()

# 输出：
# 当前异常：DataValidationError: 用户 张三 注册失败
# __cause__（显式设置的原因）：ValueError: 邮箱格式错误：invalid-email
# __context__（也被设置了）：ValueError: 邮箱格式错误：invalid-email
# __suppress_context__：True
# 
# 异常链输出（只显示 __cause__）：
# Traceback (most recent call last):
#   ...
#     raise ValueError(f"邮箱格式错误：{email}")
# ValueError: 邮箱格式错误：invalid-email
# 
# The above exception was the direct cause of the following exception:
# 
# Traceback (most recent call last):
#   ...
#     raise DataValidationError(f"用户 {username} 注册失败") from e
# DataValidationError: 用户 张三 注册失败
```

**`raise ... from None` 切断异常链**

某些场景下你不希望暴露内部的异常细节，可以使用 `raise ... from None`：

```python
import traceback

def internal_component():
    """内部组件，不应暴露其异常细节"""
    try:
        1 / 0
    except ZeroDivisionError:
        raise RuntimeError("内部计算错误") from None

try:
    internal_component()
except RuntimeError as e:
    print(f"异常：{e}")
    print(f"__context__：{e.__context__}")  # 被设为 None
    print(f"__cause__：{e.__cause__}")       # 被设为 None
    print()
    print("异常堆栈（原始异常信息被隐藏）：")
    traceback.print_exc()

# 输出：
# 异常：内部计算错误
# __context__：None
# __cause__：None
# 
# 异常堆栈（原始异常信息被隐藏）：
# Traceback (most recent call last):
#   ...
#     raise RuntimeError("内部计算错误") from None
# RuntimeError: 内部计算错误
```

**从异常链中追溯根因**

当你需要从多层异常链中找到最原始的错误时，可以遍历整个链：

```python
def find_root_cause(exc):
    """遍历异常链找到根因"""
    chain = []
    current = exc
    while current is not None:
        cause = current.__cause__ or current.__context__
        chain.append((type(current).__name__, str(current)))
        current = cause
    return chain

class DatabaseError(Exception):
    pass

def save_to_db():
    try:
        1 / 0
    except ZeroDivisionError as e:
        raise DatabaseError("数据库写入失败") from e

def process_request():
    try:
        save_to_db()
    except DatabaseError as e:
        raise RuntimeError("请求处理失败") from e

try:
    process_request()
except RuntimeError as e:
    root_chain = find_root_cause(e)
    print("=== 异常链追溯 ===")
    for idx, (exc_type, exc_msg) in enumerate(root_chain):
        marker = " <- " if idx > 0 else ""
        print(f"  {marker}{exc_type}: {exc_msg}")

# 输出：
# === 异常链追溯 ===
#   RuntimeError: 请求处理失败
#   <- DatabaseError: 数据库写入失败
#   <- ZeroDivisionError: division by zero
```

### 2.4 str(e) 与 repr(e) 的区别

`str(e)` 和 `repr(e)` 对异常对象的输出行为不同，这在日志记录和调试时有重要影响。

**两者在不同场景下的输出对比**

```python
class DetailedError(Exception):
    def __init__(self, error_code, message, severity):
        super().__init__(error_code, message, severity)
        self.error_code = error_code
        self.message = message
        self.severity = severity

try:
    raise DetailedError("ERR-001", "数据库连接超时", "HIGH")
except DetailedError as e:
    print("=== str(e) 和 repr(e) 对比 ===")
    print(f"str(e)   = {str(e)}")
    print(f"repr(e)  = {repr(e)}")
    print(f"e.args   = {e.args}")
    print(f"str(e.args) = {str(e.args)}")
    print(f"repr(e.args) = {repr(e.args)}")

# 输出：
# === str(e) 和 repr(e) 对比 ===
# str(e)   = ('ERR-001', '数据库连接超时', 'HIGH')
# repr(e)  = DetailedError(('ERR-001', '数据库连接超时', 'HIGH'))
# e.args   = ('ERR-001', '数据库连接超时', 'HIGH')
# str(e.args) = ('ERR-001', '数据库连接超时', 'HIGH')
# repr(e.args) = ('ERR-001', '数据库连接超时', 'HIGH')
```

**内置异常的 str/repr 行为**

不同异常类在 str 和 repr 上的输出差异：

```python
print("=== 单参数异常 ===")
try:
    raise ValueError("就一个参数")
except ValueError as e:
    print(f"  str(e)  = {str(e)}")
    print(f"  repr(e) = {repr(e)}")

print()
print("=== 多参数异常 ===")
try:
    raise ValueError("参数A", "参数B", 100)
except ValueError as e:
    print(f"  str(e)  = {str(e)}")
    print(f"  repr(e) = {repr(e)}")

print()
print("=== 无参数异常 ===")
try:
    raise ValueError()
except ValueError as e:
    print(f"  str(e)  = '{str(e)}'")
    print(f"  repr(e) = {repr(e)}")

print()
print("=== 格式化输出中的使用 ===")
import logging
try:
    raise RuntimeError("运行时异常")
except RuntimeError as e:
    # %s 和 %r 的效果
    print(f"  %s 风格: %s" % (e, e))         # str(e)
    print(f"  %r 风格: %r" % (e,))            # repr(e)
    print(f"  f-string: {e}")                 # str(e)
    print(f"  f-string !r: {e!r}")            # repr(e)

# 输出：
# === 单参数异常 ===
#   str(e)  = 就一个参数
#   repr(e) = ValueError('就一个参数',)
# 
# === 多参数异常 ===
#   str(e)  = ('参数A', '参数B', 100)
#   repr(e) = ValueError(('参数A', '参数B', 100),)
# 
# === 无参数异常 ===
#   str(e)  = ''
#   repr(e) = ValueError()
# 
# === 格式化输出中的使用 ===
#   %s 风格: 运行时异常
#   %r 风格: RuntimeError('运行时异常',)
#   f-string: 运行时异常
#   f-string !r: RuntimeError('运行时异常',)
```

**两者的适用场景**

```python
import traceback
import json

def log_exception(e):
    """将异常信息记录到日志（同时使用 str 和 repr）"""
    log_entry = {
        "timestamp": "2024-01-15 10:30:00",
        "level": "ERROR",
        "str_message": str(e),      # 人类可读的错误描述
        "repr_message": repr(e),    # 精确的异常表示
        "exception_type": type(e).__name__,
    }
    print(f"[日志] {json.dumps(log_entry, ensure_ascii=False, indent=2)}")

def user_facing_message(e):
    """返回给用户看的消息"""
    return str(e)  # 只用 str，友好简洁

def developer_debug_message(e):
    """返回给开发者看的调试信息"""
    return f"{type(e).__module__}.{type(e).__qualname__}: {repr(e)}"

try:
    int("not_a_number")
except ValueError as e:
    print("=== 向用户显示 ===")
    print(f"  错误：{user_facing_message(e)}")
    print()
    print("=== 向开发者显示 ===")
    print(f"  {developer_debug_message(e)}")
    print()
    print("=== 日志记录 ===")
    log_exception(e)

# 输出：
# === 向用户显示 ===
#   错误：invalid literal for int() with base 10: 'not_a_number'
# 
# === 向开发者显示 ===
#   builtins.ValueError: ValueError('invalid literal for int() with base 10: 'not_a_number'',)
# 
# === 日志记录 ===
# [日志] {
#   "timestamp": "2024-01-15 10:30:00",
#   "level": "ERROR",
#   "str_message": "invalid literal for int() with base 10: 'not_a_number'",
#   "repr_message": "ValueError('invalid literal for int() with base 10: 'not_a_number'',)",
#   "exception_type": "ValueError"
# }
```

### 2.5 e.args 的多种形态

异常对象的 `args` 元组的内容取决于构造异常时的传参方式。理解这一点对正确解析异常信息至关重要。

**内置异常类的 args 结构**

```python
import os

# TypeError：只含消息字符串
try:
    raise TypeError("类型不匹配")
except TypeError as e:
    print(f"TypeError.args = {e.args}")

# OSError：包含 (errno, strerror, filename) 结构化信息
try:
    os.chdir("/nonexistent_dir")
except OSError as e:
    print(f"OSError.args = {e.args}")

# ValueError：可接受任意数量的参数
try:
    raise ValueError("错误码", 404, {"detail": "Not Found"})
except ValueError as e:
    print(f"ValueError.args = {e.args}")

# KeyError：只含缺失的键
try:
    d = {"name": "张三"}
    d["age"]
except KeyError as e:
    print(f"KeyError.args = {e.args}")
    print(f"str(e) = {str(e)}")

# SystemExit：可接受整数退出码
try:
    raise SystemExit(1)
except SystemExit as e:
    print(f"SystemExit.args = {e.args}")
    print(f"exit code = {e.code}")

# 输出：
# TypeError.args = ('类型不匹配',)
# OSError.args = (2, 'No such file or directory', '/nonexistent_dir')
# ValueError.args = ('错误码', 404, {'detail': 'Not Found'})
# KeyError.args = ('age',)
# str(e) = 'age'
# SystemExit.args = (1,)
# exit code = 1
```

**args 的操作技巧**

```python
def analyze_exception(e):
    """通用异常分析函数"""
    print(f"异常类型：{type(e).__name__}")
    print(f"args 数量：{len(e.args)}")

    if len(e.args) == 0:
        print("无参数异常的异常")
    elif len(e.args) == 1:
        print(f"消息：{e.args[0]}")
    else:
        print("多参数异常：")
        for i, arg in enumerate(e.args):
            print(f"  args[{i}]: {arg!r} (type: {type(arg).__name__})")

# 测试不同的异常情况
test_cases = [
    ("单参数", lambda: ValueError("单一的错误消息")),
    ("双参数", lambda: ValueError("多个信息", "附加详情")),
    ("结构参数", lambda: OSError(2, "No such file", "/tmp/missing.txt")),
]

for name, exc_raiser in test_cases:
    print(f"=== {name} ===")
    try:
        raise exc_raiser()
    except Exception as e:
        analyze_exception(e)
    print()

# 输出：
# === 单参数 ===
# 异常类型：ValueError
# args 数量：1
# 消息：单一的错误消息
# 
# === 双参数 ===
# 异常类型：ValueError
# args 数量：2
# 多参数异常：
#   args[0]: '多个信息' (type: str)
#   args[1]: '附加详情' (type: str)
# 
# === 结构参数 ===
# 异常类型：OSError
# args 数量：3
# 多参数异常：
#   args[0]: 2 (type: int)
#   args[1]: 'No such file' (type: str)
#   args[2]: '/tmp/missing.txt' (type: str)
```

**args 与自定义异常**

自定义异常类如果不调用 `super().__init__()`，则 `args` 不会被自动填充：

```python
# 错误的自定义方式：没有调用 super().__init__
class BadCustomError(Exception):
    def __init__(self, user_id, message):
        self.user_id = user_id
        self.message = message
        # 没有 super().__init__()

try:
    raise BadCustomError(1001, "用户未找到")
except BadCustomError as e:
    print(f"args = {e.args}")     # () - 空的
    print(f"str(e) = '{str(e)}'")  # '' - 取不到消息
    print(f"user_id = {e.user_id}")

print()

# 正确的自定义方式
class GoodCustomError(Exception):
    def __init__(self, user_id, message):
        self.user_id = user_id
        self.message = message
        super().__init__(message)  # 将消息传给父类

try:
    raise GoodCustomError(1001, "用户未找到")
except GoodCustomError as e:
    print(f"args = {e.args}")     # 有内容了
    print(f"str(e) = '{str(e)}'")  # 能显示消息
    print(f"user_id = {e.user_id}")

# 输出：
# args = ()
# str(e) = ''
# user_id = 1001
# 
# args = ('用户未找到',)
# str(e) = '用户未找到'
# user_id = 1001
```

### 2.6 使用 traceback 模块获取异常详情

`traceback` 模块提供了比简单打印更丰富的堆栈跟踪能力。

**`traceback.print_exc()`**

将当前异常打印到标准错误流，是使用最广泛的调试辅助函数：

```python
import traceback
import sys

def read_file(filepath):
    """读取文件内容"""
    with open(filepath, "r", encoding="utf-8") as f:
        return f.read()

def process_data(filepath):
    """处理文件数据"""
    content = read_file(filepath)
    return len(content.splitlines())

print("=== print_exc() 默认输出到 stderr ===")
try:
    line_count = process_data("/tmp/nonexistent_data.csv")
except FileNotFoundError:
    traceback.print_exc()  # 默认输出到 sys.stderr

print()
print("=== print_exc() 输出到 stdout ===")
try:
    line_count = process_data("/tmp/nonexistent_data.csv")
except FileNotFoundError:
    traceback.print_exc(file=sys.stdout)  # 显示指定输出

# print_exc 的参数
print()
print("=== limit=1 只显示最内层 ===")
try:
    process_data("/tmp/nonexistent_data.csv")
except FileNotFoundError:
    traceback.print_exc(limit=1, file=sys.stdout)

print()
print("=== chain=False 不显示异常链 ===")
try:
    process_data("/tmp/nonexistent_data.csv")
except FileNotFoundError:
    traceback.print_exc(chain=False, file=sys.stdout)

# 输出：
# === print_exc() 默认输出到 stderr ===
# Traceback (most recent call last):
#   ...
# FileNotFoundError: [Errno 2] No such file or directory: '/tmp/nonexistent_data.csv'
# 
# === print_exc() 输出到 stdout ===
# Traceback (most recent call last):
#   ...
# FileNotFoundError: [Errno 2] No such file or directory: '/tmp/nonexistent_data.csv'
# 
# === limit=1 只显示最内层 ===
# Traceback (most recent call last):
#   File "...", line 7, in read_file
#     with open(filepath, "r", encoding="utf-8") as f:
# FileNotFoundError: [Errno 2] No such file or directory: '/tmp/nonexistent_data.csv'
# 
# === chain=False 不显示异常链 ===
# Traceback (most recent call last):
#   ...
# FileNotFoundError: [Errno 2] No such file or directory: '/tmp/nonexistent_data.csv'
```

**`traceback.format_exc()`**

将堆栈跟踪格式化为字符串，而不是直接打印。这在需要将异常信息写入日志文件或发送网络时非常有用：

```python
import traceback
import json

def log_error_to_service(e, context_info):
    """将异常日志发送到集中式日志服务"""
    # 格式化异常
    tb_str = traceback.format_exc()

    # 构建日志条目
    log_entry = {
        "service": "user-service",
        "context": context_info,
        "exception_type": type(e).__name__,
        "exception_message": str(e),
        "traceback": tb_str,
    }

    # 模拟发送到日志服务
    print(f"=== 发送日志到日志服务 ===")
    print(json.dumps(log_entry, ensure_ascii=False, indent=2))
    return log_entry

def process_order(order_data):
    """处理订单"""
    try:
        amount = float(order_data["amount"])
        if amount <= 0:
            raise ValueError("订单金额必须为正数")
        return {"status": "success", "order_id": "ORD-001"}
    except (ValueError, KeyError) as e:
        # 将异常详情存入变量，后续统一发送日志
        error_log = log_error_to_service(e, {"user_id": "USER-001", "order_data": order_data})
        raise  # 重抛异常

try:
    process_order({"amount": "-100"})
except (ValueError, KeyError):
    pass  # 已在函数内记录了日志

# 输出：
# === 发送日志到日志服务 ===
# {
#   "service": "user-service",
#   "context": {"user_id": "USER-001", "order_data": {"amount": "-100"}},
#   "exception_type": "ValueError",
#   "exception_message": "订单金额必须为正数",
#   "traceback": "Traceback (most recent call last):\n  ...\nValueError: 订单金额必须为正数\n"
# }
```

**`traceback.print_exception()`**

更灵活的版本，可以接受 `(type, value, traceback)` 三元组或分别传入：

```python
import traceback
import sys

def custom_exception_handler(exc_type, exc_val, exc_tb):
    """自定义异常处理器"""
    print("=== 自定义处理器 ===")
    print(f"类型: {exc_type.__name__}")
    print(f"值  : {exc_val}")
    print(f"堆栈: {exc_tb is not None}")
    print()
    # 格式化为字符串
    formatted = traceback.format_exception(exc_type, exc_val, exc_tb)
    print("格式化后的堆栈：")
    print("".join(formatted))

try:
    import nonexistent_module
except ImportError as e:
    custom_exception_handler(type(e), e, e.__traceback__)

# 输出：
# === 自定义处理器 ===
# 类型: ModuleNotFoundError
# 值  : No module named 'nonexistent_module'
# 堆栈: True
# 
# 格式化后的堆栈：
# Traceback (most recent call last):
#   ...
# ModuleNotFoundError: No module named 'nonexistent_module'
```

**`traceback.extract_tb()` 和 `traceback.StackSummary`**

从 traceback 对象中提取结构化的帧信息，便于程序化处理：

```python
import traceback

def load_config():
    """加载配置"""
    return parse_config()

def parse_config():
    """解析配置"""
    return int("not_a_number")

try:
    load_config()
except ValueError as e:
    # 提取结构化的堆栈帧
    stack = traceback.extract_tb(e.__traceback__)
    print(f"=== StackSummary 对象类型：{type(stack).__name__} ===")
    print(f"帧数：{len(stack)}")
    print()

    # 遍历每一帧
    for i, frame in enumerate(stack):
        print(f"  帧 #{i}：")
        print(f"    文件名：{frame.filename.split('/')[-1]}")
        print(f"    行号：{frame.lineno}")
        print(f"    函数：{frame.name}")
        print(f"    代码行：{frame.line!r}")
        print()

    # 使用 format 方法
    print("format() 输出：")
    for line in stack.format():
        print(f"  {line.rstrip()}")

# 输出：
# === StackSummary 对象类型：StackSummary ===
# 帧数：2
# 
#   帧 #0：
#     文件名：<ipython-input-...>
#     行号：4
#     函数：load_config
#     代码行：'return parse_config()'
# 
#   帧 #1：
#     文件名：<ipython-input-...>
#     行号：8
#     函数：parse_config
#     代码行：'return int("not_a_number")'
# 
# format() 输出：
#   File "<ipython-input-...>", line 4, in load_config
#     return parse_config()
#   File "<ipython-input-...>", line 8, in parse_config
#     return int("not_a_number")
```

### 2.7 sys.exc_info() 的 (type, value, traceback) 三元组

`sys.exc_info()` 返回当前线程正被处理的异常的 `(type, value, traceback)` 三元组。没有异常时三个值都是 `None`。

**基本用法**

```python
import sys
import traceback

def capture_exception_info():
    """捕获当前异常信息"""
    exc_type, exc_value, exc_tb = sys.exc_info()
    if exc_type is None:
        print("当前没有异常被处理")
        return None

    print(f"类型 (type)：{exc_type.__name__}")
    print(f"值  (value)：{exc_value}")
    print(f"堆栈 (traceback)：{'存在' if exc_tb else 'None'}")

    # 可以用 traceback 打印堆栈
    if exc_tb:
        traceback.print_tb(exc_tb)
    return exc_type, exc_value, exc_tb

def step_one():
    step_two()

def step_two():
    step_three()

def step_three():
    try:
        1 / 0
    except ZeroDivisionError:
        # 在 except 块中调用
        capture_exception_info()

step_one()

# 输出：
# 类型 (type)：ZeroDivisionError
# 值  (value)：division by zero
# 堆栈 (traceback)：存在
#   File "<ipython-input-...>", line 19, in step_three
#     1 / 0
```

**`sys.exc_info()` 与 `except ... as e` 的对比**

```python
import sys

# sys.exc_info() 和 as 子句实际上是不同的方式获得同一个对象
try:
    raise RuntimeError("同一个异常对象")
except RuntimeError as e:
    exc_type, exc_val, exc_tb = sys.exc_info()

    # 验证两者是同一对象
    print(f"e is exc_val：{e is exc_val}")
    print(f"type(e) is exc_type：{type(e) is exc_type}")
    print(f"e.__traceback__ is exc_tb：{e.__traceback__ is exc_tb}")

    # 但 e 在 except 块结束后会被删除
    # 而 sys.exc_info() 的返回值如果被保存则不会被删除

# 输出：
# e is exc_val：True
# type(e) is exc_type：True
# e.__traceback__ is exc_tb：True
```

**`sys.exc_info()` 在多线程中的行为**

`sys.exc_info()` 是线程安全的，每个线程维护自己的当前异常：

```python
import sys
import threading

def worker():
    """工作线程中处理异常"""
    try:
        raise ValueError(f"线程 {threading.current_thread().name} 出错")
    except ValueError:
        exc_type, exc_val, _ = sys.exc_info()
        print(f"  {threading.current_thread().name}: exc_info = {exc_val}")

# 在主线程中也设置一个异常
def main_work():
    try:
        raise KeyError("主线程 KeyError")
    except KeyError:
        # 启动子线程，观察各线程的 sys.exc_info 是否独立
        t = threading.Thread(target=worker)
        t.start()
        t.join()

        # 验证主线程的异常信息没有被子线程影响
        exc_type, exc_val, _ = sys.exc_info()
        print(f"  主线程: exc_info = {repr(exc_val)} [类型: {exc_type.__name__}]")

main_work()

# 输出：
#   线程 Thread-1: exc_info = 线程 Thread-1 出错
#   主线程: exc_info = KeyError('主线程 KeyError',) [类型: KeyError]
```

**`sys.exception()` (Python 3.11+)**

Python 3.11 引入了更简洁的 `sys.exception()`，只返回异常值（不需要解包三元组）：

```python
import sys

if sys.version_info >= (3, 11):
    # Python 3.11+ 的简洁写法
    try:
        1 / 0
    except ZeroDivisionError:
        # 之前: exc_type, exc_val, exc_tb = sys.exc_info()
        exc = sys.exception()  # 直接获取异常对象
        print(f"sys.exception() 返回：{exc}")
        print(f"异常类型：{type(exc).__name__}")
        print(f"异常消息：{exc}")

    # sys.exception() 和 sys.exc_info() 的关系
    try:
        raise ValueError("两者返回同一个对象")
    except ValueError:
        exc_simple = sys.exception()
        _, exc_tuple, _ = sys.exc_info()
        print(f"is same object: {exc_simple is exc_tuple}")
else:
    print(f"当前 Python {sys.version_info.major}.{sys.version_info.minor}，不支持 sys.exception()")

# 输出（Python 3.11+）：
# sys.exception() 返回：division by zero
# 异常类型：ZeroDivisionError
# 异常消息：division by zero
# is same object: True
```

### 2.8 raise 不带参数时重用当前异常对象

在 `except` 块中使用裸 `raise`（不带参数）时，Python 会将当前捕获的异常原封不动地重新抛出，保留完整的堆栈信息：

**`raise` 与 `raise e` 的关键区别**

```python
import traceback

def handle_with_raise():
    """使用裸 raise：保留原始堆栈"""
    try:
        1 / 0
    except ZeroDivisionError as e:
        print(f"[handle_with_raise] 捕获到: {e}")
        # 保留原始异常对象和堆栈
        raise  # 等价于: raise e.with_traceback(e.__traceback__)

def handle_with_raise_e():
    """使用 raise e：堆栈增加一帧"""
    try:
        1 / 0
    except ZeroDivisionError as e:
        print(f"[handle_with_raise_e] 捕获到: {e}")
        raise e  # 堆栈会显示从当前帧重新抛出

print("=== 裸 raise 的堆栈 ===")
try:
    handle_with_raise()
except ZeroDivisionError:
    traceback.print_exc()

print()
print("=== raise e 的堆栈 ===")
try:
    handle_with_raise_e()
except ZeroDivisionError:
    traceback.print_exc()

# 注意输出区别：raise e 的堆栈会多一层（显示从 current except 重新抛出）
# 而裸 raise 直接穿透，不增加新帧
```

**在多层 except 中传递异常**

```python
import traceback

def api_gateway_handler(request_id):
    """API 网关层"""
    try:
        return business_logic(request_id)
    except ValueError:
        print(f"[网关层] 记录请求 {request_id} 相关的错误")
        raise  # 透传到更上层

def business_logic(request_id):
    """业务逻辑层"""
    try:
        validate_request(request_id)
    except ValueError:
        print(f"[业务层] 记录请求 {request_id} 的上下文")
        raise  # 透传到网关层

def validate_request(request_id):
    """请求校验层"""
    if request_id <= 0:
        raise ValueError(f"无效的请求 ID：{request_id}")

print("=== raise 的多层传递 ===")
try:
    api_gateway_handler(-1)
except ValueError as e:
    print(f"[最终] 捕获: {e}")
    traceback.print_exc()

# 输出：
# [业务层] 记录请求 -1 的上下文
# [网关层] 记录请求 -1 相关的错误
# [最终] 捕获: 无效的请求 ID：-1
# Traceback (most recent call last):
#   ...
# ValueError: 无效的请求 ID：-1
```

**在函数外使用 raise**

```python
# ❌ 错误：在 except 块外使用裸 raise
try:
    pass  # 无异常
except ValueError:  # 不会触发
    pass

# 下面的 raise 会抛出 RuntimeError
# try:
#     pass
# except:
#     raise  # 这在 except 块内是有效的
```

**带条件的裸 raise**

你可以在 `except` 块中只对某些条件满足时重用异常：

```python
def process_transaction(amount, balance):
    """处理交易"""
    try:
        if amount <= 0:
            raise ValueError("无效的交易金额")
        if amount > balance:
            raise ValueError("余额不足")
    except ValueError as e:
        # 只对特定消息的异常做处理，其他的直接重抛
        if "余额不足" in str(e):
            print(f"[业务处理] 余额不足：剩余 {balance}，需要 {amount}")
            # 做业务处理，比如发短信通知
            return {"status": "insufficient_balance", "balance": balance}
        else:
            # 其他校验错误，直接向上传播
            raise

# 余额不足的情况：不抛出异常，被处理了
result = process_transaction(200, 100)
print(f"处理结果：{result}")

print()

# 无效金额的情况：抛出异常
try:
    process_transaction(-50, 500)
except ValueError as e:
    print(f"无效金额异常被传播到外部：{e}")

# 输出：
# [业务处理] 余额不足：剩余 100，需要 200
# 处理结果：{'status': 'insufficient_balance', 'balance': 100}
# 
# 无效金额异常被传播到外部：无效的交易金额
```

### 2.9 自定义异常类与额外属性

通过自定义异常类，你可以为异常对象附加业务相关属性，携带比 `args` 更丰富、结构化的信息。

**基础自定义异常类**

```python
class APIException(Exception):
    """API 业务异常基类"""
    def __init__(self, message, status_code=500, error_code=None):
        self.status_code = status_code
        self.error_code = error_code or self.__class__.__name__
        # 传给父类，确保 str(e) 正常工作
        super().__init__(message)

class NotFoundError(APIException):
    """资源未找到"""
    def __init__(self, resource_type, resource_id, message=None):
        self.resource_type = resource_type
        self.resource_id = resource_id
        if message is None:
            message = f"{resource_type} '{resource_id}' 未找到"
        super().__init__(message, status_code=404)

class ValidationError(APIException):
    """数据校验失败"""
    def __init__(self, message, field_errors=None):
        self.field_errors = field_errors or {}
        super().__init__(message, status_code=422)

# 使用自定义异常
try:
    raise NotFoundError("用户", "USER-001")
except NotFoundError as e:
    print(f"类型：{type(e).__name__}")
    print(f"消息：{e}")
    print(f"状态码：{e.status_code}")
    print(f"错误码：{e.error_code}")
    print(f"资源类型：{e.resource_type}")
    print(f"资源ID：{e.resource_id}")
    print(f"args：{e.args}")

print()

try:
    raise ValidationError(
        "用户数据校验失败",
        {"email": "邮箱格式不正确", "age": "年龄必须在 0-150 之间"}
    )
except ValidationError as e:
    print(f"消息：{e}")
    print(f"字段错误：{e.field_errors}")
    print(f"args：{e.args}")

# 输出：
# 类型：NotFoundError
# 消息：用户 'USER-001' 未找到
# 状态码：404
# 错误码：NotFoundError
# 资源类型：用户
# 资源ID：USER-001
# args：("用户 'USER-001' 未找到",)
# 
# 消息：用户数据校验失败
# 字段错误：{'email': '邮箱格式不正确', 'age': '年龄必须在 0-150 之间'}
# args：('用户数据校验失败',)
```

**异常类的层次体系设计**

```python
# 分层设计异常体系
class PaymentError(Exception):
    """支付相关异常基类"""
    def __init__(self, message, transaction_id=None):
        self.transaction_id = transaction_id
        super().__init__(message)

class InsufficientFundsError(PaymentError):
    """余额不足"""
    def __init__(self, account_id, requested, available):
        self.account_id = account_id
        self.requested = requested
        self.available = available
        # 每次都传入 transaction_id 很麻烦，在 from 语法中设置
        message = f"账户 {account_id} 余额不足：需要 {requested}，可用 {available}"
        super().__init__(message)

class PaymentTimeoutError(PaymentError):
    """支付超时"""
    def __init__(self, transaction_id, timeout_seconds):
        super().__init__(
            f"事务 {transaction_id} 超时（{timeout_seconds}s）",
            transaction_id=transaction_id
        )

# 使用实例
try:
    raise InsufficientFundsError("ACC-001", 500, 100)
except InsufficientFundsError as e:
    print(f"交易ID：{e.transaction_id}")  # 基类属性
    print(e)

try:
    raise PaymentTimeoutError("TXN-20240101", 30)
except PaymentTimeoutError as e:
    print(f"交易ID：{e.transaction_id}")
    print(e)

# isinstance 行为与继承一致
print(f"InsufficientFundsError 是 PaymentError 子类: {issubclass(InsufficientFundsError, PaymentError)}")
print(f"实例是 PaymentError 类型: {isinstance(InsufficientFundsError('A', 1, 1), PaymentError) is True}")

# 输出：
# 交易ID：None
# 账户 ACC-001 余额不足：需要 500，可用 100
# 交易ID：TXN-20240101
# 事务 TXN-20240101 超时（30s）
# InsufficientFundsError 是 PaymentError 子类: True
# 实例是 PaymentError 类型: True
```

**在自定义异常中扩展方法**

```python
class DataValidationError(Exception):
    """数据校验异常，支持嵌套字段错误"""
    def __init__(self, message, field_errors=None, data_snapshot=None):
        self.field_errors = field_errors or {}
        self.data_snapshot = data_snapshot or {}
        super().__init__(message)

    def add_field_error(self, field, error_message):
        """添加字段级错误"""
        self.field_errors[field] = error_message

    def has_errors(self):
        """检查是否含字段级错误"""
        return len(self.field_errors) > 0

    def to_dict(self):
        """将异常转换为字典（用于 API 响应）"""
        result = {
            "error": str(self),
            "type": type(self).__name__,
        }
        if self.has_errors():
            result["field_errors"] = self.field_errors
        return result

# 使用
try:
    exc = DataValidationError("数据校验未通过")
    exc.add_field_error("username", "用户名不能为空")
    exc.add_field_error("age", "年龄必须为数字")
    raise exc
except DataValidationError as e:
    print(f"消息：{e}")
    print(f"字段错误数：{len(e.field_errors)}")
    print(f"完整字典：{e.to_dict()}")

# 输出：
# 消息：数据校验未通过
# 字段错误数：2
# 完整字典：{'error': '数据校验未通过', 'type': 'DataValidationError', 'field_errors': {'username': '用户名不能为空', 'age': '年龄必须为数字'}}
```

### 2.10 异常对象的 `__traceback__` 属性修改

**`with_traceback()` 方法**

`BaseException` 提供了 `with_traceback(tb)` 方法，允许替换或设置异常的堆栈跟踪：

```python
import traceback
import sys

def deep_validation(value):
    """深层校验"""
    if not isinstance(value, int):
        raise TypeError("必须是整数")

def shallow_wrapper(value):
    """浅包装层"""
    deep_validation(value)

def top_handler(value):
    """顶层处理"""
    try:
        shallow_wrapper(value)
    except TypeError as e:
        # 创建一个新异常，但保留原始 traceback
        new_exc = TypeError(f"输入值校验失败：{value}")
        new_exc = new_exc.with_traceback(e.__traceback__)
        raise new_exc

print("=== with_traceback 保留原始堆栈 ===")
try:
    top_handler("abc")
except TypeError as e:
    print(f"异常：{e}")
    traceback.print_exc()

# 输出：
# === with_traceback 保留原始堆栈 ===
# 异常：输入值校验失败：abc
# Traceback (most recent call last):
#   File "...", line 15, in top_handler
#     shallow_wrapper(value)
#   File "...", line 10, in shallow_wrapper
#     deep_validation(value)
#   File "...", line 6, in deep_validation
#     raise TypeError("必须是整数")
# TypeError: 输入值校验失败：abc
```

**`__traceback__` 直接赋值**

`with_traceback()` 本质上就是设置 `__traceback__` 属性，你也可以直接操作它：

```python
import traceback

def service_one():
    return service_two()

def service_two():
    return 1 / 0

try:
    service_one()
except ZeroDivisionError as e:
    # 方法一：with_traceback（推荐）
    new_e1 = RuntimeError("计算异常").with_traceback(e.__traceback__)

    # 方法二：直接赋值（效果相同）
    new_e2 = RuntimeError("计算异常")
    new_e2.__traceback__ = e.__traceback__

    # 验证两者效果一致
    print(f"方法一 traceback：")
    traceback.print_exception(type(new_e1), new_e1, new_e1.__traceback__)
    print()
    print(f"方法二 traceback：")
    traceback.print_exception(type(new_e2), new_e2, new_e2.__traceback__)

# 输出：
# 方法一 traceback：
# Traceback (most recent call last):
#   File "...", line 8, in service_one
#     return service_two()
#   File "...", line 11, in service_two
#     return 1 / 0
# RuntimeError: 计算异常
# 
# 方法二 traceback：
# Traceback (most recent call last):
#   File "...", line 8, in service_one
#     return service_two()
#   File "...", line 11, in service_two
#     return 1 / 0
# RuntimeError: 计算异常
```

**使用 `sys.exc_info()` 构造 traceback**

```python
import sys
import traceback

def wrap_exception_with_current_tb():
    """将当前调用栈作为异常的 traceback"""
    # 获取当前栈的 traceback
    try:
        raise RuntimeError("无意义的异常用于获取栈帧")
    except RuntimeError:
        # 获取当前调用栈的 traceback（但不包括当前帧）
        _, _, current_tb = sys.exc_info()

    # 创建一个新异常，使用取得的 traceback
    new_exc = ValueError("包装后的错误")
    new_exc = new_exc.with_traceback(current_tb)
    return new_exc

def caller():
    exc = wrap_exception_with_current_tb()
    raise exc

try:
    caller()
except ValueError:
    traceback.print_exc()

# 输出：
# Traceback (most recent call last):
#   File "...", line 17, in wrap_exception_with_current_tb
#     raise RuntimeError("无意义的异常用于获取栈帧")
#   File "...", line 7, in caller  # 注：实际的调用路径
#     exc = wrap_exception_with_current_tb()
# ValueError: 包装后的错误
```

**设置 traceback 的限制**

```python
import traceback

# 不能设置非 traceback 对象
try:
    raise ValueError("原始错误")
except ValueError as e:
    try:
        e.__traceback__ = "这不是一个traceback对象"
    except TypeError as te:
        print(f"赋值失败：{te}")

    # 可以设置为 None（清除 traceback）
    e.__traceback__ = None
    print(f"清除后 traceback 为：{e.__traceback__}")
    traceback.print_exception(type(e), e, e.__traceback__)

# 输出：
# 赋值失败：__traceback__ must be a traceback object
# 清除后 traceback 为：None
# NoneType: None
```

### 2.11 Python 3.11 的异常笔记：`add_note()` 和 `__notes__`

Python 3.11 引入了异常笔记（Exception Notes）机制，允许为异常添加附加信息，而不改变异常消息或类型。

**基础用法**

```python
import sys

if sys.version_info >= (3, 11):
    def parse_order(order_data):
        try:
            user_id = order_data["user_id"]
            amount = float(order_data["amount"])
        except (KeyError, ValueError) as e:
            # 为异常添加笔记——附着额外上下文信息
            e.add_note(f"原始数据：{order_data}")
            e.add_note(f"处理时间：2024-06-15 10:30:00")
            raise

    try:
        parse_order({"user_id": "U001", "amount": "不是数字"})
    except (KeyError, ValueError) as e:
        print(f"异常：{type(e).__name__}: {e}")
        print(f"笔记数：{len(e.__notes__)}")
        for i, note in enumerate(e.__notes__):
            print(f"  笔记 #{i}: {note}")

    # 输出（Python 3.11+）：
    # 异常：ValueError: could not convert string to float: '不是数字'
    # 笔记数：2
    #   笔记 #0: 原始数据：{'user_id': 'U001', 'amount': '不是数字'}
    #   笔记 #1: 处理时间：2024-06-15 10:30:00
else:
    print(f"当前 Python {sys.version_info.major}.{sys.version_info.minor}，不支持异常笔记")

# 输出（Python 3.11+）：
# 异常：ValueError: could not convert string to float: '不是数字'
# 笔记数：2
#   笔记 #0: 原始数据：{'user_id': 'U001', 'amount': '不是数字'}
#   笔记 #1: 处理时间：2024-06-15 10:30:00
```

**异常笔记在异常链中的表现**

异常笔记附着在每个异常上，在异常链中各自独立：

```python
import sys
import traceback

if sys.version_info >= (3, 11):
    class BusinessError(Exception):
        pass

    def fetch_data():
        try:
            raise ConnectionError("API 不可达")
        except ConnectionError as e:
            e.add_note("目标：https://api.example.com")
            e.add_note("已重试 3 次都失败")
            raise BusinessError("数据获取失败") from e

    try:
        fetch_data()
    except BusinessError as e:
        traceback.print_exception(type(e), e, e.__traceback__)
        print(f"\n业务异常的笔记：{getattr(e, '__notes__', None)}")
        cause = e.__cause__
        if cause:
            print(f"底层异常的笔记：{getattr(cause, '__notes__', None)}")
else:
    print(f"不支持异常笔记")

# 输出（Python 3.11+）：
# Traceback (most recent call last):
#   File "...", line 11, in fetch_data
#     raise ConnectionError("API 不可达")
# ConnectionError: API 不可达
#     目标：https://api.example.com
#     已重试 3 次都失败
# 
# The above exception was the direct cause of the following exception:
# 
# Traceback (most recent call last):
#   ...
# BusinessError: 数据获取失败
# 
# 业务异常的笔记：None
# 底层异常的笔记：['目标：https://api.example.com', '已重试 3 次都失败']
```

**`add_note()` 在不同 Python 版本的兼容**

```python
import sys

def safe_add_note(exc, note):
    """跨版本安全的添加笔记方法"""
    if hasattr(exc, 'add_note'):
        exc.add_note(note)
    else:
        # Python < 3.11 可用 __notes__ 模拟
        if not hasattr(exc, '__notes__'):
            exc.__notes__ = []
        exc.__notes__.append(note)

# 统一使用跨版本版本
try:
    raise RuntimeError("测试错误")
except RuntimeError as e:
    safe_add_note(e, "笔记1：跨版本兼容")
    safe_add_note(e, "笔记2：注意版本差异")
    # 安全读取
    notes = getattr(e, '__notes__', []) or []
    print(f"异常笔记：{notes}")

# 输出：
# 异常笔记：['笔记1：跨版本兼容', '笔记2：注意版本差异']
```

### 2.12 异常对象的其他属性和方法

**`__traceback__` 的深拷贝问题**

异常对象的堆栈跟踪包含帧引用，在跨线程或序列化时需要注意：

```python
import traceback

def collect_deep_info(exc):
    """收集异常的所有可用信息，适用于日志记录"""
    info = {
        "type": type(exc).__name__,
        "module": type(exc).__module__,
        "args": exc.args,
        "str": str(exc),
        "repr": repr(exc),
        "has_traceback": exc.__traceback__ is not None,
    }

    # 收集异常链信息
    chain = []
    current = exc
    while current is not None:
        chain.append({
            "type": type(current).__name__,
            "message": str(current),
        })
        current = current.__context__ or current.__cause__

    info["chain"] = chain

    return info

def business_function():
    try:
        1 / 0
    except ZeroDivisionError as e:
        raise ValueError("参数校验失败") from e

try:
    business_function()
except ValueError as e:
    info = collect_deep_info(e)
    import json
    print(json.dumps(info, ensure_ascii=False, indent=2))

# 输出：
# {
#   "type": "ValueError",
#   "module": "builtins",
#   "args": [
#     "参数校验失败"
#   ],
#   "str": "参数校验失败",
#   "repr": "ValueError('参数校验失败',)",
#   "has_traceback": true,
#   "chain": [
#     {
#       "type": "ValueError",
#       "message": "参数校验失败"
#     },
#     {
#       "type": "ZeroDivisionError",
#       "message": "division by zero"
#     }
#   ]
# }
```

**`traceback.extract_stack()`——当前栈而不是异常栈**

与 `extract_tb()` 不同，`extract_stack()` 获取的是当前调用栈，而不是异常发生时的栈：

```python
import traceback

def get_current_stack():
    """获取当前调用栈信息"""
    stack = traceback.extract_stack()
    print("当前调用栈：")
    for frame in stack:
        print(f"  文件：{frame.filename.split('/')[-1]}, 行号：{frame.lineno}, 函数：{frame.name}")

def alpha():
    beta()

def beta():
    gamma()

def gamma():
    # 获取到 gamma 的调用路径
    get_current_stack()
    # 对比：如果这里发生了异常，异常堆栈会类似但不完全相同

alpha()

# 输出：
# 当前调用栈：
#   文件：<ipython-input-...>, 行号：8, 函数：get_current_stack
#   文件：<ipython-input-...>, 行号：16, 函数：gamma
#   文件：<ipython-input-...>, 行号：14, 函数：beta
#   文件：<ipython-input-...>, 行号：12, 函数：alpha
#   文件：<ipython-input-...>, 行号：19, 函数：<module>
```

**`traceback.format_stack()` 获取栈字符串**

```python
import traceback

def log_caller_info():
    """记录调用者的信息"""
    # 获取调用栈字符串（排除当前帧）
    stack = traceback.format_stack(limit=3)[:-1]
    print("=== 日志：我被调用了 ===")
    print("".join(stack))

def process_data():
    log_caller_info()

def handle_request():
    process_data()

handle_request()

# 输出：
# === 日志：我被调用了 ===
#   File "<ipython-input-...>", line 12, in handle_request
#     process_data()
#   File "<ipython-input-...>", line 9, in process_data
#     log_caller_info()
```

### 2.13 异常对象的序列化和反序列化

异常对象通常不能直接序列化（pickle），但在某些场景（分布式系统、日志传输）中需要序列化异常信息：

```python
import json
import traceback

class SerializableException:
    """将异常转换为可序列化的格式"""
    @staticmethod
    def to_dict(exc):
        """将异常对象转为字典"""
        result = {
            "type": f"{type(exc).__module__}.{type(exc).__qualname__}",
            "type_name": type(exc).__name__,
            "message": str(exc),
            "repr": repr(exc),
            "args": exc.args,
        }

        # 序列化 traceback（格式化为字符串）
        if exc.__traceback__:
            result["traceback"] = "".join(
                traceback.format_exception(type(exc), exc, exc.__traceback__)
            )
        else:
            result["traceback"] = None

        # 异常链
        chain = []
        current = exc
        while current is not None:
            chain.append({
                "type": type(current).__name__,
                "message": str(current),
            })
            current = current.__cause__ or current.__context__

        # 去除当前异常自身（链的开始）
        result["cause_chain"] = chain[1:] if len(chain) > 1 else []

        return result

# 测试
def nested_call():
    try:
        1 / 0
    except ZeroDivisionError as e:
        raise RuntimeError("内部出错") from e

try:
    nested_call()
except RuntimeError as e:
    serialized = SerializableException.to_dict(e)
    print(json.dumps(serialized, ensure_ascii=False, indent=2))

# 输出（traceback 字符串从简）：
# {
#   "type": "builtins.RuntimeError",
#   "type_name": "RuntimeError",
#   "message": "内部出错",
#   "repr": "RuntimeError('内部出错',)",
#   "args": [
#     "内部出错"
#   ],
#   "traceback": "Traceback (most recent call last):\n  ...\nRuntimeError: 内部出错\n",
#   "cause_chain": [
#     {
#       "type": "ZeroDivisionError",
#       "message": "division by zero"
#     }
#   ]
# }
```

### 2.14 在 except 中使用 with_traceback 和异常笔记的组合

结合 `with_traceback()` 和 `add_note()`（Python 3.11+），可以构造出既保留原始堆栈又附加详细上下文的异常：

```python
import sys
import traceback

def validate_address(address_data):
    """验证地址数据"""
    try:
        if not address_data.get("city"):
            raise KeyError("缺少 city 字段")
    except KeyError as e:
        # 附加笔记（Python 3.11+）
        if hasattr(e, 'add_note'):
            e.add_note(f"完整数据: {address_data}")
            e.add_note(f"请求来源: 用户注册表单")
        raise

def process_registration(user_data):
    """处理用户注册"""
    try:
        validate_address(user_data.get("address", {}))
    except KeyError as e:
        # 创建业务异常，保留原始 traceback
        new_exc = ValueError("用户注册数据不完整")
        new_exc = new_exc.with_traceback(e.__traceback__)
        # 附加笔记
        if hasattr(new_exc, 'add_note'):
            new_exc.add_note(f"用户: {user_data.get('username', 'unknown')}")
            new_exc.add_note(f"邮箱: {user_data.get('email', 'unknown')}")
        raise new_exc from e

try:
    process_registration({
        "username": "张三",
        "email": "zhangsan@example.com",
        "address": {"province": "北京"}
    })
except ValueError as e:
    traceback.print_exception(type(e), e, e.__traceback__)
    # 读取笔记
    notes = getattr(e, '__notes__', []) or []
    if notes:
        print(f"\n附加笔记：")
        for n in notes:
            print(f"  - {n}")

# 输出（Python 3.11+）：
# Traceback (most recent call last):
#   ...
#     validate_address(address_data)
#   ...
#     raise KeyError("缺少 city 字段")
# KeyError: '缺少 city 字段'
#     完整数据: {'province': '北京'}
#     请求来源: 用户注册表单
# 
# The above exception was the direct cause of the following exception:
# 
# Traceback (most recent call last):
#   ...
#     process_registration(user_data)
#   ...
#     raise new_exc from e
# ValueError: 用户注册数据不完整
#     用户: 张三
#     邮箱: zhangsan@example.com
# 
# 附加笔记：
#   - 用户: 张三
#   - 邮箱: zhangsan@example.com
```

### 2.15 异常对象作为日志上下文

在生产环境中，异常对象通常会被传送到日志系统。Python 的 `logging` 模块对异常有内置支持：

```python
import logging
import traceback

# 配置日志输出到控制台
logging.basicConfig(
    level=logging.ERROR,
    format="[%(levelname)s] %(asctime)s - %(name)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger("user-service")

def fetch_user_data(user_id):
    """获取用户数据"""
    try:
        if user_id <= 0:
            raise ValueError(f"无效的用户 ID: {user_id}")
        return {"id": user_id, "name": "张三"}
    except ValueError as e:
        # 方法一：使用 exc_info 参数（自动记录 traceback）
        logger.error(f"获取用户数据失败: {e}", exc_info=True)
        # 方法二：手动 format
        logger.error(f"获取用户数据失败: {e}\n{traceback.format_exc()}")
        raise

try:
    fetch_user_data(-1)
except ValueError:
    pass  # 已在日志中记录

# 输出：
# [ERROR] 2024-06-15 10:30:00 - user-service - 获取用户数据失败: 无效的用户 ID: -1
# Traceback (most recent call last):
#   ...
# ValueError: 无效的用户 ID: -1
# [ERROR] 2024-06-15 10:30:00 - user-service - 获取用户数据失败: 无效的用户 ID: -1
# Traceback (most recent call last):
#   ...
# ValueError: 无效的用户 ID: -1
```

**`logging.logException()`**

`logging` 模块提供了更简洁的 `logger.exception()` 方法，自动记录异常堆栈：

```python
import logging

logging.basicConfig(level=logging.WARNING, format="[%(levelname)s] %(message)s")
logger = logging.getLogger("order-service")

def process_payment(order_id, amount):
    """处理支付"""
    try:
        raise ConnectionError("支付网关超时")
    except ConnectionError:
        # logger.exception() 自动包含 exc_info=True
        logger.exception(f"订单 {order_id} 支付失败（金额: {amount}）")
        # 等价于：
        # logger.error(f"订单 {order_id} 支付失败（金额: {amount}）", exc_info=True)

try:
    process_payment("ORD-001", 99.9)
except ConnectionError:
    pass  # 已在日志中记录

# 输出：
# [ERROR] 订单 ORD-001 支付失败（金额: 99.9）
# Traceback (most recent call last):
#   ...
# ConnectionError: 支付网关超时
```

## 3. 最佳实践

### 3.1 总是捕获具体的异常类型

捕获异常时应尽量精确，不要使用裸 `except` 捕获所有异常：

```python
import os

# ❌ 不推荐：捕获所有异常
def delete_file_bad(filepath):
    try:
        os.remove(filepath)
    except:  # 会捕获 KeyboardInterrupt、SystemExit 等
        print("删除失败")
        return False

# ✅ 推荐：只捕获预期的异常
def delete_file_good(filepath):
    try:
        os.remove(filepath)
    except FileNotFoundError:
        # 文件不存在是预期行为
        return False
    except PermissionError as e:
        # 权限错误需要记录并重抛
        print(f"权限不足: {e}")
        raise
    except OSError as e:
        # 其他操作系统错误统一处理
        print(f"IO错误: {e}")
        return False
    return True

# ✅ 一般业务代码，捕获 Exception 子类（排除 SystemExit/KeyboardInterrupt）
def process_data(data):
    try:
        return {"status": "ok", "data": data.upper()}
    except Exception as e:  # 不会捕获 KeyboardInterrupt
        return {"status": "error", "message": str(e)}
```

### 3.2 使用异常附加上下文

在多层调用中，不要简单吃掉异常，而是要附加上下文再重抛：

```python
import traceback

# ❌ 不推荐：吃掉原始异常
def load_config_bad():
    try:
        with open("config.json") as f:
            return f.read()
    except FileNotFoundError:
        print("配置文件不存在")  # 原始异常被吞掉
        return "{}"

# ✅ 推荐：记录并附加上下文
def load_config_good():
    try:
        with open("config.json") as f:
            return f.read()
    except FileNotFoundError as e:
        # 方式一：附加上下文后重抛
        raise RuntimeError("初始化失败：缺少配置文件") from e

# ✅ 推荐：使用异常笔记（Python 3.11+）
import sys
if sys.version_info >= (3, 11):
    def load_config_best():
        try:
            with open("config.json") as f:
                return f.read()
        except FileNotFoundError as e:
            e.add_note("检查项目根目录下是否存在 config.json")
            e.add_note("可以通过环境变量 CONFIG_PATH 指定路径")
            raise  # 保留原始异常，直接重抛
```

### 3.3 通用错误信息 vs 调试信息

对用户和开发者展示不同的异常信息：

```python
class AppError(Exception):
    """应用层异常，区分用户友好消息和调试信息"""
    def __init__(self, user_message, debug_message=None, status_code=500):
        self.user_message = user_message
        self.debug_message = debug_message or str(user_message)
        self.status_code = status_code
        super().__init__(user_message)

def get_user(user_id):
    """获取用户信息"""
    try:
        if user_id <= 0:
            raise ValueError(f"Invalid user_id: {user_id}")
        return {"id": user_id, "name": "张三"}
    except ValueError as exc:
        # 对用户：友好消息
        # 对开发者：详细调试信息
        raise AppError(
            user_message="用户信息获取失败",
            debug_message=f"get_user failed: {exc}, user_id={user_id}",
            status_code=400
        )

try:
    get_user(-1)
except AppError as e:
    # 生产环境：给用户看的
    print(f"[用户] {e.user_message}（状态码: {e.status_code}）")
    # 调试环境：给开发者看的
    print(f"[调试] {e.debug_message}")
    # 通用日志：异常本身
    print(f"[日志] {repr(e)}")

# 输出：
# [用户] 用户信息获取失败（状态码: 400）
# [调试] get_user failed: Invalid user_id: -1, user_id=-1
# [日志] AppError('用户信息获取失败',)
```

### 3.4 不要在 `except` 里做太复杂的事情

`except` 块应该保持简短，只做必要的处理：

```python
# ❌ 不推荐：except 里做复杂操作
def process_order_bad(order_id):
    try:
        int(order_id)
    except ValueError as e:
        # except 块中嵌套了复杂的业务逻辑
        log_error(e)
        send_alert("数据异常", order_id)
        update_dashboard("error", order_id)
        cleanup_temporary_files(order_id)
        # ... 太多事情了

# ✅ 推荐：except 只做简短的异常处理，复杂逻辑放在外面
def process_order_good(order_id):
    try:
        int(order_id)
        return None
    except ValueError as e:
        return e  # 返回异常对象，由调用者处理

# 调用者统一处理
exc = process_order_good("not_a_number")
if isinstance(exc, Exception):
    log_error(exc)
    send_alert("数据异常", order_id)
    update_dashboard("error", order_id)
    cleanup_temporary_files(order_id)
```

### 3.5 正确处理异常变量的引用

```python
# ❌ 不推荐：依赖 except 块结束后的异常变量
def collect_bad(operations):
    errors = []
    for name, op in operations:
        try:
            op()
        except Exception as e:
            errors.append(e)
    # except 块外 e 被清除，但 errors 中的引用还在
    return errors

# ✅ 推荐：显式标注，避免混淆
def collect_good(operations):
    errors = []
    for name, op in operations:
        try:
            op()
        except Exception as error:
            # 命名为更有语义的变量名
            errors.append(error)
    # 循环中每次 except 后 e 被清除，但 error 引用已被添加到列表
    # 这是安全的，因为 error 对象还被 errors 列表引用
    return errors
```

### 3.6 `raise` 与 `raise from` 的选择

```python
# 场景一：完全转换异常类型，不暴露内部细节 —— 用 raise ... from
def read_config():
    try:
        with open("config.yaml") as f:
            return f.read()
    except FileNotFoundError as e:
        raise RuntimeError("系统配置缺失") from e

# 场景二：附加信息但不丢失原始错误 —— 用 raise ... from
def parse_value(value):
    try:
        return int(value)
    except ValueError as e:
        raise ValueError(f"参数 '{value}' 不是有效的整数") from e

# 场景三：记录日志后重抛 —— 用裸 raise
def handle_transaction(request):
    try:
        process_payment(request)
    except PaymentError:
        logger.exception("支付失败")
        raise  # 保留原始堆栈

# 场景四：隐藏内部实现细节 —— 用 raise ... from None
def core_function():
    try:
        1 / 0
    except ZeroDivisionError:
        raise RuntimeError("内部运算错误") from None
```

### 3.7 自定义异常类设计原则

```python
# 原则一：总是调用 super().__init__()
class GoodException(Exception):
    def __init__(self, message, extra_info=None):
        self.extra_info = extra_info
        super().__init__(message)  # 确保 args 被填充

# 原则二：不要在 __init__ 中调用 super().__init__() 后还额外修改 args
class BadException(Exception):
    def __init__(self, msg):
        super().__init__(msg)
        self.args = ("hacked",)  # ❌ 不要直接修改 args

try:
    raise GoodException("正常消息", {"key": "value"})
except GoodException as e:
    print(f"Good: str={e}, args={e.args}")

try:
    raise BadException("原始消息")
except BadException as e:
    print(f"Bad: str={e}, args={e.args}")

# 输出：
# Good: str=正常消息, args=('正常消息',)
# Bad: str=hacked, args=('hacked',)
```

### 3.8 异常笔记的最佳实践

```python
import sys

if sys.version_info >= (3, 11):
    class ValidationError(Exception):
        """数据校验异常"""
        pass

    def validate_user_data(data):
        """校验用户数据"""
        try:
            username = data["username"]
            if len(username) < 2:
                raise ValidationError("用户名太短")
        except (KeyError, ValidationError) as e:
            # 使用笔记附加上下文，而不是修改异常消息
            e.add_note(f"数据来源: 用户注册 API")
            e.add_note(f"期望字段: username")
            if hasattr(e, 'add_note') and 'username' in str(data):
                e.add_note(f"当前值: username='{data.get('username')}'")
            raise

    try:
        validate_user_data({"username": "a"})
    except ValidationError:
        import traceback
        traceback.print_exc()

    # 输出（Python 3.11+）：
    # Traceback (most recent call last):
    #   ...
    # ValidationError: 用户名太短
    #     数据来源: 用户注册 API
    #     期望字段: username
    #     当前值: username='a'
```

### 3.9 `sys.exc_info()` 的线程安全使用

```python
import sys
import threading

def thread_safe_exc_info():
    """线程安全的异常信息捕获"""
    try:
        raise ValueError("子线程异常")
    except ValueError:
        # 在线程内使用 sys.exc_info() —— 是安全的
        exc_type, exc_val, exc_tb = sys.exc_info()
        # 关键：如果需要在回调或异步中使用，必须保存引用
        return exc_type, exc_val, exc_tb  # 返回引用以保留

# 在线程外调用 sys.exc_info() 是不安全的（没有当前异常）
print(f"主线程（无异常）: {sys.exc_info()}")
```

### 3.10 在不同异常处理策略之间的选择

```python
# 策略一：防御式编程 —— 在源头避免异常
def safe_int_conversion(value, default=None):
    """安全的整数转换"""
    if not isinstance(value, (str, int, float)):
        return default
    try:
        return int(value)
    except (ValueError, TypeError):
        return default

# 策略二：快速失败 —— 让异常传播
def validate_age(age):
    """严格校验，失败就抛出"""
    if not isinstance(age, int):
        raise TypeError(f"年龄必须为整数，得到 {type(age).__name__}")
    if age < 0 or age > 150:
        raise ValueError(f"年龄超出有效范围（0-150）: {age}")
    return age

# 策略三：搓衣板式 —— 逐个捕获，分别处理
def parse_complex_data(data):
    """逐层处理不同异常"""
    try:
        name = data["name"]
        age = int(data["age"])
        scores = data["scores"]
        avg = sum(scores) / len(scores)
    except KeyError as e:
        print(f"缺少必要字段: {e}")
        raise
    except (ValueError, TypeError) as e:
        print(f"数据类型错误: {e}")
        raise
    except ZeroDivisionError as e:
        print(f"成绩列表为空，不能计算平均值")
        raise
    except Exception as e:
        print(f"未知错误: {type(e).__name__}: {e}")
        raise
```

## 4. 原理

### 4.1 CPython 中异常对象的内部结构

CPython 中每个异常对象（`PyBaseExceptionObject`）的内部结构包含以下几个字段：

```c
// CPython 源码 Include/cpython/pyerrors.h 中的结构定义
typedef struct {
    PyObject_HEAD           // Python 对象头部（引用计数 + 类型指针）
    PyObject *dict;         // __dict__ 属性字典
    PyObject *args;         // 异常的构造参数元组（对应 e.args）
    PyObject *notes;        // Python 3.11+: __notes__ 列表
    PyObject *traceback;    // __traceback__ 堆栈回溯对象
    PyObject *context;      // __context__ 异常链的上一个异常
    PyObject *cause;        // __cause__ 显式设置的原因
    char suppress_context;  // __suppress_context__ 布尔标志
} PyBaseExceptionObject;
```

**字段的初始化顺序**

创建异常对象时，CPython 的初始化顺序如下：

```python
# 伪代码展示 CPython 内部初始化顺序
class BaseException:
    def __new__(cls, *args):
        obj = super().__new__(cls)
        obj.args = ()          # 初始化为空元组
        obj.__traceback__ = None
        obj.__context__ = None
        obj.__cause__ = None
        obj.__suppress_context__ = False  # 0
        return obj

    def __init__(self, *args):
        # Exception.__init__ 将 args 保存到 self.args
        self.args = args
```

**`args` 在 `__init__` 中的设置**

```python
# show_args_init.py
import dis

class DemoError(Exception):
    pass

# 反汇编查看 Exception.__init__
# 验证 args 是如何被设置的
exc = DemoError("消息", 42)
print(f"args = {exc.args}")

# 输出：
# args = ('消息', 42)
```

**`__str__` 方法的实现逻辑**

```python
# 理解 Exception.__str__ 的内部实现
# 源码：Objects/exceptions.c -> BaseException_str()

def base_exception_str(self):
    """模拟 Exception.__str__ 的行为"""
    if len(self.args) == 0:
        return ""
    elif len(self.args) == 1:
        return str(self.args[0])
    else:
        return str(self.args)

class TestException(Exception):
    pass

# 零参数
try:
    raise TestException()
except TestException as e:
    print(f"str(e) = '{e}'")

# 单参数
try:
    raise TestException("只有一条消息")
except TestException as e:
    print(f"str(e) = '{e}'")

# 多参数
try:
    raise TestException("消息1", "消息2", 3)
except TestException as e:
    print(f"str(e) = '{e}'")

# 输出：
# str(e) = ''
# str(e) = '只有一条消息'
# str(e) = ('消息1', '消息2', 3)
```

### 4.2 raise 语句在字节码层面的实现

**`raise` 不带参数（重用当前异常）**

当在 `except` 块中使用裸 `raise` 时，CPython 生成 `RAISE_VARARGS` 指令（参数为 0），直接从当前异常槽中取出异常对象并重新抛出：

```python
import dis

def demo_raise():
    try:
        1 / 0
    except ZeroDivisionError:
        raise  # 裸 raise

# 查看字节码
dis.dis(demo_raise)

# 输出（近似）：
#   ...
#   >> PUSH_EXC_INFO
#   >> LOAD_CONST ...  ZeroDivisionError
#   >> CHECK_EXC_MATCH
#   >> POP_JUMP_IF_FALSE ...
#   >> STORE_FAST ...     e
#   >> RAISE_VARARGS 0   # <-- 裸 raise：从当前异常槽中取出异常重抛
#   ...
```

**`raise e`（显式指定异常）**

当指定异常对象时，CPython 的字节码会多一条 `LOAD_FAST e` 指令来加载变量：

```python
def demo_raise_e():
    try:
        1 / 0
    except ZeroDivisionError as e:
        raise e  # 显式使用 e

dis.dis(demo_raise_e)

# 输出（近似）：
#   ...
#   >> STORE_FAST ...     e
#   >> LOAD_FAST ...      e        # <-- 多出来的加载指令
#   >> RAISE_VARARGS 1             # <-- 参数为1：从栈顶取异常对象
#   ...
```

**`raise X from Y`（带原因链）**

```python
def demo_raise_from():
    try:
        1 / 0
    except ZeroDivisionError as e:
        raise RuntimeError("出错") from e

dis.dis(demo_raise_from)

# 输出（近似）：
#   ...
#   >> RAISE_VARARGS 2   # <-- 参数为2：从栈顶取 cause，次顶取 value
#   ...
```

### 4.3 `sys.exc_info()` 的内部实现

`sys.exc_info()` 是 CPython 解释器中的一个 C 函数（`sys_exc_info` in `Python/sysmodule.c`），它的行为由线程的异常状态（`PyThreadState.exc_info`）控制：

```python
# sys.exc_info() 的近似内部行为

import sys

def exc_info_approximation():
    """sys.exc_info() 的行为近似模拟"""
    # 实际上，CPython 不通过 Python 函数实现，
    # 而是直接访问线程状态（PyThreadState）中的 exc_info 字段
    # 每个线程维护自己的异常状态

    # 获取当前线程的异常信息
    thread_state = _get_thread_state()  # 伪代码：从 TLS 获取
    exc_type = thread_state.exc_type
    exc_value = thread_state.exc_value
    exc_traceback = thread_state.exc_traceback

    return (exc_type, exc_value, exc_traceback)

# 验证线程隔离
import threading

def thread_exc_info():
    print(f"子线程 exc_info: {sys.exc_info()}")

t = threading.Thread(target=thread_exc_info)
t.start()
t.join()
print(f"主线程 exc_info: {sys.exc_info()}")

# 输出：
# 子线程 exc_info: (None, None, None)
# 主线程 exc_info: (None, None, None)
```

**异常变量的删除机制（Python 3）**

Python 3 在 `except` 块结束后自动删除异常变量，这个行为由 `symtable.c` 和 `compile.c` 中的特殊处理实现：

```python
# 近似模拟 Python 3 对异常变量的清除

import sys

class FrameState:
    """模拟解释器帧状态"""
    def __init__(self):
        self.exc_value = None
        self.exc_type = None
        self.exc_traceback = None

def except_block_simulation():
    """模拟 except 块结束后的清除行为"""
    state = FrameState()
    try:
        raise ValueError("模拟错误")
    except ValueError as e:
        state.exc_type, state.exc_value, state.exc_traceback = sys.exc_info()
        print(f"except 块内: e={e}, exc_info={state.exc_value}")
        # e 在此处有效

    # Python 内部在这之后会执行：
    # 1. 删除异常变量 e（从局部名称空间中移除）
    # 2. 清除线程状态中的 exc_info
    # 这两步是编译时生成的代码，不是运行时反射

    e_removed = 'e' not in locals() and 'e' not in globals()
    exc_info_cleared = sys.exc_info() == (None, None, None)
    print(f"except 块外: e 已删除={e_removed}, exc_info 已清除={exc_info_cleared}")
    print(f"手动保存的异常对象: {state.exc_value}")

except_block_simulation()

# 输出：
# except 块内: e=模拟错误, exc_info=模拟错误
# except 块外: e 已删除=True, exc_info 已清除=True
# 手动保存的异常对象: 模拟错误
```

### 4.4 异常链（`__context__` / `__cause__`）的底层机制

```python
# 异常链的底层实现模拟

def set_context(new_exc, old_exc):
    """CPython 在 except 块中抛出异常时自动执行的设置"""
    # 在 CPython 内部，这是由 PyException_SetContext() 完成的
    # 此函数在 Objects/exceptions.c 中实现
    if new_exc.__context__ is None:
        new_exc.__context__ = old_exc

def set_cause(new_exc, cause_exc):
    """raise ... from 语法触发的设置"""
    # CPython 中由 PyException_SetCause() 实现
    new_exc.__cause__ = cause_exc
    new_exc.__suppress_context__ = True

def traceback_format_exception_only(exc_type, exc_val):
    """模拟 traceback 在显示异常链时的逻辑"""
    if exc_val.__cause__ is not None:
        # 显示 __cause__（from 语法）
        cause = exc_val.__cause__
        parts = traceback_format_exception_only(type(cause), cause)
        parts.append("\nThe above exception was the direct cause of the following exception:\n\n")
        parts += _format_exception_only(exc_type, exc_val)
        return parts
    elif exc_val.__context__ is not None and not exc_val.__suppress_context__:
        # 显示 __context__（隐式链）
        ctx = exc_val.__context__
        parts = traceback_format_exception_only(type(ctx), ctx)
        parts.append("\nDuring handling of the above exception, another exception occurred:\n\n")
        parts += _format_exception_only(exc_type, exc_val)
        return parts
    else:
        return _format_exception_only(exc_type, exc_val)

def _format_exception_only(exc_type, exc_val):
    """格式化单一异常"""
    return [f"{exc_type.__name__}: {exc_val}\n"]

# 实际使用
class ChainDemo:
    @staticmethod
    def inner():
        raise ValueError("内部错误")

    @staticmethod
    def outer_hidden():
        try:
            ChainDemo.inner()
        except ValueError as e:
            raise RuntimeError("外部错误") from None  # 显式切断

    @staticmethod
    def outer_implicit():
        try:
            ChainDemo.inner()
        except ValueError:
            raise RuntimeError("外部错误")  # 隐式链

    @staticmethod
    def outer_explicit():
        try:
            ChainDemo.inner()
        except ValueError as e:
            raise RuntimeError("外部错误") from e  # 显式链

print("从 None：隐藏了内部异常")
try:
    ChainDemo.outer_hidden()
except RuntimeError as e:
    print(f"  __cause__: {e.__cause__}")
    print(f"  __context__: {e.__context__}")
    print(f"  __suppress_context__: {e.__suppress_context__}")

print()
print("隐式链（自动设置 __context__）：")
try:
    ChainDemo.outer_implicit()
except RuntimeError as e:
    print(f"  __context__: {type(e.__context__).__name__}: {e.__context__}")

print()
print("显式链（from 语法设置 __cause__）：")
try:
    ChainDemo.outer_explicit()
except RuntimeError as e:
    print(f"  __cause__: {type(e.__cause__).__name__}: {e.__cause__}")
    print(f"  __suppress_context__: {e.__suppress_context__}")

# 输出：
# 从 None：隐藏了内部异常
#   __cause__: None
#   __context__: None
#   __suppress_context__: True
# 
# 隐式链（自动设置 __context__）：
#   __context__: ValueError: 内部错误
# 
# 显式链（from 语法设置 __cause__）：
#   __cause__: ValueError: 内部错误
#   __suppress_context__: True
```

### 4.5 Python 3.11 异常笔记的实现

Python 3.11 在 `BaseException` 中新增了两个方法：`add_note(note)` 和属性 `__notes__`。

**内部实现机制**

```python
# 模拟 Python 3.11 异常笔记的内部实现

import sys

if sys.version_info >= (3, 11):
    # Python 3.11 的 add_note 大致等价于：
    def add_note_behavior(exc, note):
        """模拟 Python 3.11 add_note 的内部行为"""
        if not isinstance(note, str):
            raise TypeError(
                f"Exception.add_note() argument must be str, not {type(note).__name__}"
            )
        if not hasattr(exc, '__notes__'):
            exc.__notes__ = []
        exc.__notes__.append(note)

    # 验证行为
    try:
        raise RuntimeError("测试")
    except RuntimeError as e:
        # Python 3.11 原生的 add_note
        e.add_note("第一条笔记")
        e.add_note("第二条笔记")
        print(f"__notes__ = {e.__notes__}")
        print(f"类型: {type(e.__notes__)}")

        # traceback 输出会自动包含笔记
        import traceback
        traceback.print_exception(type(e), e, e.__traceback__)

    # 输出（Python 3.11+）：
    # __notes__ = ['第一条笔记', '第二条笔记']
    # 类型: <class 'list'>
    # Traceback (most recent call last):
    #   ...
    # RuntimeError: 测试
    #     第一条笔记
    #     第二条笔记
```

**`add_note()` 的类型检查**

```python
import sys

if sys.version_info >= (3, 11):
    try:
        raise RuntimeError("类型检查")
    except RuntimeError as e:
        try:
            e.add_note(123)  # 非字符串参数
        except TypeError as te:
            print(f"类型检查失败: {te}")

    # 输出（Python 3.11+）：
    # 类型检查失败: Exception.add_note() argument must be str, not int
```

### 4.6 `raise` 语句在生成器和协程中的特殊行为

```python
import sys

def generator_with_exception():
    """生成器内使用 raise 的行为"""
    try:
        yield "第一步"
        yield "第二步"
    except GeneratorExit:
        # 当生成器被 close() 时，会收到 GeneratorExit
        print("收到 GeneratorExit")
        raise  # 必须重抛 GeneratorExit
    except ValueError as e:
        # 通过 generator.throw(ValueError) 注入的异常
        print(f"收到 ValueError: {e}")
        yield "处理了错误"

gen = generator_with_exception()
print(next(gen))           # 第一步
print(next(gen))           # 第二步
try:
    print(gen.throw(ValueError, "外部注入的错误"))
except ValueError:
    print("ValueError 被生成器重抛了（如果没有 yield 处理）")

# 输出：
# 第一步
# 第二步
# 收到 ValueError: 外部注入的错误
# 处理了错误

# 尝试注入另一个异常
try:
    print(gen.throw(RuntimeError, "运行时错误"))
except RuntimeError:
    print("RuntimeError 从生成器传播出来")
```

## 5. 总结

**内容要点回顾**：

- **`except ... as e` 语法**：将捕获到的异常实例绑定到变量，方便读取异常的属性。
- **异常变量的作用域**：在 Python 3 中，异常变量在 `except` 块结束后会被自动清除（从局部名称空间删除），`sys.exc_info()` 也会被重置。
- **异常对象的核心属性**：
  - `args`：构造参数元组，不同传参方式影响其形态（空元组、单元素、多元素）。
  - `__traceback__`：堆栈回溯对象，记录异常发生时的调用栈。
  - `__context__` 和 `__cause__`：分别承载隐式异常链和显式异常链，`__suppress_context__` 控制显示优先级。
- **`str(e)` vs `repr(e)`**：`str(e)` 返回人类可读的错误描述（单参数时返回字符串本身，多参数时返回 args 的字符串形式）；`repr(e)` 返回精确的异常构造函数调用形式。
- **`traceback` 模块**：
  - `print_exc()`：打印当前异常堆栈到 stderr。
  - `format_exc()`：返回当前异常堆栈的字符串。
  - `print_exception()`：灵活打印指定异常的堆栈。
  - `extract_tb()`：提取结构化的堆栈帧信息。
- **`sys.exc_info()`**：返回 `(type, value, traceback)` 三元组，仅在 `except` 块内有效；Python 3.11+ 可用 `sys.exception()` 直接获取异常对象。
- **裸 `raise` 重用当前异常**：在 `except` 块中使用不带参数的 `raise` 保留异常对象和原始堆栈，与 `raise e` 的区别在于是否在堆栈中增加一帧。
- **自定义异常类**：应始终调用 `super().__init__(message)` 以确保 `args` 被正确填充；可扩展业务属性，但不要重写 `args`。
- **`__traceback__` 修改**：`with_traceback(tb)` 方法允许替换异常对象的堆栈跟踪；Python 3.7+ 可以直接赋值 `exc.__traceback__ = new_tb`。
- **异常笔记（Python 3.11+）**：`Exception.add_note(note)` 为异常添加字符串笔记，`__notes__` 以列表形式存储笔记；笔记会在异常链输出中自动显示。
- **内部原理**：
  - `PyBaseExceptionObject` 包含 args、traceback、context、cause、suppress_context 等字段。
  - 裸 `raise` 在字节码层面生成 `RAISE_VARARGS 0` 直接重用当前异常槽。
  - `sys.exc_info()` 通过线程本地存储（`PyThreadState.exc_info`）实现线程隔离。
  - `raise ... from` 通过 `PyException_SetCause()` 设置 `__cause__` 并置 `__suppress_context__ = True`。

**读完本文你应能掌握**：

1. 正确使用 `except ... as e` 语法获取异常对象，并理解不同捕获形式的适用场景。
2. 区分异常对象的 `args`、`__traceback__`、`__context__`、`__cause__` 属性的含义和用法。
3. 在日志记录和调试中正确选择 `str(e)` 或 `repr(e)`。
4. 使用 `traceback` 模块的 `print_exc`、`format_exc`、`print_exception`、`extract_tb` 函数分析和格式化异常堆栈。
5. 使用 `sys.exc_info()` 获取当前异常的三元组信息，理解其线程隔离、作用域和清除行为。
6. 正确使用裸 `raise`（重用当前异常）和 `raise e`，理解其堆栈差异。
7. 设计自定义异常类，正确初始化 `args`，并附加业务相关的结构化属性。
8. 使用 `with_traceback()` 或直接赋值修改异常对象的 traceback。
9. 在 Python 3.11+ 中使用 `add_note()` 为异常附加笔记，实现跨版本兼容。
10. 在实践中做出正确取舍：精确捕获 vs 通配捕获、附加上下文 vs 简单重抛、异常笔记 vs 修改异常消息。