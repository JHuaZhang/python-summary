---
group:
  title: 【10】异常处理完整体系
  order: 10
order: 8
title: with与上下文管理器协议
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是上下文管理器

上下文管理器（Context Manager）是 Python 中一套用于资源管理的协议。它解决了编码中最常见的一类问题：**进入某个操作前需要准备资源，操作完成后无论是否发生异常都需要释放资源**。典型的场景包括打开文件后要关闭、获取锁后要释放、建立数据库连接后要断开。

在引入 `with` 语句之前，Python 开发者只能靠 `try-finally` 块手动管理资源的清理：在 `try` 中获取资源，在 `finally` 中释放。这种写法本身没有问题，但它将"获取-使用-释放"这三个阶段分散在了不同位置，当资源较多或嵌套较深时，代码的逻辑结构会变得不够直观。`with` 语句将这三阶段封装为一个整体，让代码更短、更安全、更可读。

最直观的例子是文件读写。Python 初学者通常需要记住手动关闭文件，否则可能丢失缓冲区中的数据：

```python
# 不推荐：手动管理文件生命周期
f = open("example.txt", "w", encoding="utf-8")
try:
    f.write("hello")
finally:
    f.close()
```

而使用 `with` 语句后，关闭文件的动作由上下文管理器自动完成：

```python
# 推荐：with 语句自动管理资源
with open("example_auto.txt", "w", encoding="utf-8") as f:
    f.write("hello")
# 离开缩进块后，文件自动关闭
```

从 Python 2.5 开始，`with` 语句通过 `__future__` 引入，Python 2.6 起成为关键字。如今它是 Python 代码中最常见的惯用法之一，也是判断代码是否"Pythonic"的重要标准。

### 1.2 上下文管理器协议的定义

上下文管理器协议由两个魔法方法组成：

| 方法 | 作用 | 调用时机 |
|------|------|----------|
| `__enter__(self)` | 进入上下文时调用 | `with` 语句求值时 |
| `__exit__(self, exc_type, exc_val, exc_tb)` | 退出上下文时调用 | 离开 `with` 块时（正常退出或异常退出） |

任何实现了这两个方法的对象都是上下文管理器，可以直接在 `with` 语句中使用。

```python
# 最简单的自定义上下文管理器
class SimplePrinter:
    """演示 __enter__ 和 __exit__ 的调用时机"""

    def __enter__(self):
        print(">>> 进入上下文（__enter__ 被调用）")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        print(">>> 退出上下文（__exit__ 被调用）")
        # 返回 False 表示不抑制异常，这是默认行为
        return False


with SimplePrinter() as sp:
    print("--- 正在执行 with 块内部 ---")
```

运行结果：

```
>>> 进入上下文（__enter__ 被调用）
--- 正在执行 with 块内部 ---
>>> 退出上下文（__exit__ 被调用）
```

这个例子清晰地展示了 `with` 语句的执行顺序：
1. 计算 `with` 表达式（创建 `SimplePrinter` 实例）
2. 调用 `__enter__`，返回值赋给 `as` 子句的变量
3. 执行 `with` 块中的代码
4. 离开块时调用 `__exit__`

## 2. 核心内容

### 2.1 with 语句的基本语法

`with` 语句的完整语法有两种形式：

**单上下文管理器的形式：**

```python
with EXPRESSION as TARGET:
    BLOCK
```

其中 `EXPRESSION` 是一个求值后得到上下文管理器的表达式，`as TARGET` 是可选的（没有 `as` 时，`__enter__` 的返回值被丢弃），`BLOCK` 是在上下文中执行的代码块。

**多上下文管理器的形式（Python 2.7 / 3.1 起支持）：**

```python
with EXPRESSION1 as TARGET1, EXPRESSION2 as TARGET2:
    BLOCK
```

等价于嵌套的 `with`：

```python
with EXPRESSION1 as TARGET1:
    with EXPRESSION2 as TARGET2:
        BLOCK
```

**多个表达式的底层行为**：每个 `EXPRESSION` 从左到右依次求值，每个的 `__enter__` 也在进入块之前按顺序调用；退出时按**相反顺序**调用 `__exit__`，这个顺序与栈的先进后出逻辑一致。

```python
# 演示多上下文管理器的进入/退出顺序
class TracedContext:
    def __init__(self, name):
        self.name = name

    def __enter__(self):
        print(f"  ENTER: {self.name}")
        return self

    def __exit__(self, *args):
        print(f"  EXIT:  {self.name}")
        return False


print("嵌套 with：")
with TracedContext("A") as a:
    with TracedContext("B") as b:
        print("    --- 在嵌套块内部 ---")

print()
print("单行 with 逗号分隔：")
with TracedContext("X") as x, TracedContext("Y") as y:
    print("    --- 在逗号分隔块内部 ---")
```

运行结果：

```
嵌套 with：
  ENTER: A
  ENTER: B
    --- 在嵌套块内部 ---
  EXIT:  B
  EXIT:  A

单行 with 逗号分隔：
  ENTER: X
  ENTER: Y
    --- 在逗号分隔块内部 ---
  EXIT:  Y
  EXIT:  X
```

两种写法的退出顺序一致：Y/B 先退出，X/A 后退出。

### 2.2 __enter__ 方法详解

`__enter__` 的签名：

```python
def __enter__(self) -> Any:
```

它没有任何额外参数，只接收 `self`。返回值被 `with` 语句赋值给 `as` 子句中声明的变量。如果没有 `as` 子句，返回值被忽略。

```python
# __enter__ 可以返回任意对象，不一定是 self
class ResourcePool:
    def __init__(self):
        self._connections = [f"conn-{i}" for i in range(3)]
        self._index = 0

    def __enter__(self):
        # 从连接池取出一个连接返回
        conn = self._connections[self._index % len(self._connections)]
        self._index += 1
        print(f"  从连接池取出: {conn}")
        return conn

    def __exit__(self, *args):
        print("  归还连接至连接池")
        return False


print("首次使用连接池：")
with ResourcePool() as conn:
    print(f"  使用连接: {conn}")

print()
print("再次使用连接池：")
with ResourcePool() as conn:
    print(f"  使用连接: {conn}")
```

运行结果：

```
首次使用连接池：
  从连接池取出: conn-0
  使用连接: conn-0
  归还连接至连接池

再次使用连接池：
  从连接池取出: conn-1
  使用连接: conn-1
  归还连接至连接池
```

这说明 `__enter__` 的返回值可以是任意类型，而 `as` 子句绑定的正是这个返回值。最常见的做法是返回 `self`，但当需要提供一个代理对象或转化后的对象时，返回其他对象也是合法的。

### 2.3 __exit__ 方法详解

`__exit__` 的签名和参数：

```python
def __exit__(
    self,
    exc_type: Optional[Type[BaseException]],
    exc_val: Optional[BaseException],
    exc_tb: Optional[TracebackType],
) -> bool:
```

三个参数的含义：

| 参数 | 类型 | 含义 |
|------|------|------|
| `exc_type` | `Type[BaseException]` 或 `None` | 异常的类型（如 `ValueError`、`ZeroDivisionError`） |
| `exc_val` | `BaseException` 或 `None` | 异常实例本身 |
| `exc_tb` | `traceback` 对象或 `None` | 异常发生时的堆栈回溯对象 |

当 `with` 块正常结束时，三个参数都是 `None`。当块内发生异常时，三个参数都被设置。

**返回值的含义**：

- 返回 `False` 或 `None`（默认行为）：异常不被抑制，会继续向上传播。
- 返回 `True`：异常被抑制，`with` 块之后的代码正常继续执行，仿佛异常从未发生。

```python
class ExceptionLogger:
    """记录 __exit__ 接收到的异常信息"""

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            print(f"  [__exit__] 捕获到异常类型: {exc_type.__name__}")
            print(f"  [__exit__] 异常信息: {exc_val}")
            print(f"  [__exit__] 堆栈对象存在: {exc_tb is not None}")
        else:
            print("  [__exit__] 没有异常发生")
        # 返回 False，不抑制异常
        return False


print("--- 场景一：正常执行 ---")
with ExceptionLogger():
    print("  执行正常操作...")

print()
print("--- 场景二：发生异常 ---")
try:
    with ExceptionLogger():
        result = 1 / 0  # 触发 ZeroDivisionError
except ZeroDivisionError:
    print("  异常已传播到 with 外部")
```

运行结果：

```
--- 场景一：正常执行 ---
  执行正常操作...
  [__exit__] 没有异常发生

--- 场景二：发生异常 ---
  [__exit__] 捕获到异常类型: ZeroDivisionError
  [__exit__] 异常信息: division by zero
  [__exit__] 堆栈对象存在: True
  异常已传播到 with 外部
```

**返回 True 抑制异常**：

```python
class ExceptionSuppressor:
    """抑制所有发生的异常"""

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            print(f"  [抑制] {exc_type.__name__}: {exc_val}")
        return True  # 抑制异常


print("--- 异常被抑制后，后续代码继续执行 ---")
with ExceptionSuppressor():
    print("  即将发生异常...")
    raise ValueError("这是被抑制的异常")
    print("  这行永远不会执行")  # 由于异常发生在上一行，这不执行

print("  with 块之后：程序继续运行，就像没发生过异常")
```

运行结果：

```
--- 异常被抑制后，后续代码继续执行 ---
  即将发生异常...
  [抑制] ValueError: 这是被抑制的异常
  with 块之后：程序继续运行，就像没发生过异常
```

**在 __exit__ 中重新抛出异常**：

`__exit__` 可以在完成清理后重新抛出同一个异常。这是因为返回 `False` 后，异常会继续传播；或者可以在 `__exit__` 内部显式用 `raise` 重新抛出。

```python
class CleanerWithReraise:
    """清理后重新抛出异常"""

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            print(f"  [清理] 异常发生时执行清理操作")
            # 记录日志后，返回 False 让异常继续传播
        return False


try:
    with CleanerWithReraise():
        raise RuntimeError("出错了")
except RuntimeError as e:
    print(f"  外部捕获: {e}")
```

运行结果：

```
  [清理] 异常发生时执行清理操作
  外部捕获: 出错了
```

**在 __exit__ 中抛出新的异常**：

在 `__exit__` 内部抛出新的异常会覆盖原始异常。如果原始异常存在，新的异常会成为它的"上下文"（`__context__`），最终抛出的是新异常，原始异常附加在 `__cause__` 链上。

```python
class OverridingCleaner:
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        print(f"  [__exit__] 处理中，准备抛出新异常")
        raise RuntimeError("清理期间出错")

print("--- __exit__ 中抛出新异常 ---")
try:
    with OverridingCleaner():
        print("  块内开始")
        raise ValueError("原始异常")
        print("  这行不会执行")
except RuntimeError as e:
    print(f"  外部捕获: {type(e).__name__}: {e}")
```

运行结果：

```
--- __exit__ 中抛出新异常 ---
  块内开始
  [__exit__] 处理中，准备抛出新异常
  外部捕获: RuntimeError: 清理期间出错
```

### 2.4 标准库中的上下文管理器

**2.4.1 open() 函数**

`open()` 是最常用的上下文管理器，用于文件操作。它从 Python 2.5 起就支持 `with` 语句。

```python
# 写入文件
with open("demo_file.txt", "w", encoding="utf-8") as f:
    f.write("第一行内容\n")
    f.write("第二行内容\n")
# 文件在这里自动关闭

# 读取文件
with open("demo_file.txt", "r", encoding="utf-8") as f:
    content = f.read()
    print(f"文件内容:\n{content}")

# 验证文件已关闭
try:
    f.read()
except ValueError as e:
    print(f"文件已关闭，无法读取: {e}")
```

运行结果：

```
文件内容:
第一行内容
第二行内容

文件已关闭，无法读取: I/O operation on closed file.
```

**2.4.2 threading.Lock 和 threading.RLock**

锁对象实现了上下文管理器协议，在 `__enter__` 中调用 `acquire()`，在 `__exit__` 中调用 `release()`。

```python
import threading
import time

shared_counter = 0
lock = threading.Lock()

def safe_increment(thread_id, iterations):
    global shared_counter
    for _ in range(iterations):
        with lock:  # 自动获取锁和释放锁
            # 临界区：只有持有锁的线程可以进入
            current = shared_counter
            # 模拟非原子操作
            time.sleep(0.0001)
            shared_counter = current + 1
    print(f"  线程 {thread_id} 完成")


threads = []
start = time.time()
for i in range(5):
    t = threading.Thread(target=safe_increment, args=(i, 100))
    threads.append(t)
    t.start()

for t in threads:
    t.join()

elapsed = time.time() - start
print(f"\n最终计数: {shared_counter}（期望值: 500）")
print(f"耗时: {elapsed:.3f}秒")
```

运行结果：

```
  线程 0 完成
  线程 1 完成
  线程 2 完成
  线程 3 完成
  线程 4 完成

最终计数: 500（期望值: 500）
耗时: 0.103秒
```

如果不使用锁，计数可能少于期望值（由于竞态条件）。

**2.4.3 io.BytesIO 和 io.StringIO**

虽然 `BytesIO` 和 `StringIO` 是内存中的流，但它们也是上下文管理器，`__exit__` 调用 `close()`。

```python
from io import StringIO, BytesIO

# StringIO 作为上下文管理器
with StringIO() as buffer:
    buffer.write("Python - 优雅")
    buffer.write(", 强大")
    result = buffer.getvalue()
    print(f"StringIO 内容: {result}")
# 缓冲区自动关闭

# BytesIO 同理
with BytesIO() as buf:
    buf.write(b"\x00\x01\x02")
    buf.seek(0)
    data = buf.read()
    print(f"BytesIO 读取: {data.hex()}")
```

运行结果：

```
StringIO 内容: Python - 优雅, 强大
BytesIO 读取: 000102
```

**2.4.4 contextlib.redirect_stdout 和 contextlib.redirect_stderr**

这两个上下文管理器将 `sys.stdout` 或 `sys.stderr` 临时重定向到另一个文件类对象。注意：它们存在于 `contextlib` 模块中，已在 Python 3.5 引入。

```python
import contextlib
import sys
from io import StringIO


# 使用 redirect_stdout 捕获 print 输出
buffer = StringIO()
with contextlib.redirect_stdout(buffer):
    print("这段文字不会显示在终端")
    print("而是被写入到 StringIO 中")
    sys.stdout.write("直接写入 stdout 也一样\n")

output = buffer.getvalue()
print(f"捕获到的输出:\n{output}")
```

运行结果：

```
捕获到的输出:
这段文字不会显示在终端
而是被写入到 StringIO 中
直接写入 stdout 也一样
```

### 2.5 contextlib 模块详解

`contextlib` 模块是 Python 标准库中专为上下文管理器设计的工具模块，提供了便捷的装饰器、辅助类和实用工具。

**2.5.1 @contextmanager 装饰器**

`@contextmanager` 允许用生成器函数定义上下文管理器，省去编写类实现 `__enter__` 和 `__exit__` 的样板代码。

**基本原理**：`yield` 之前的代码对应 `__enter__` 的逻辑，`yield` 之后的代码对应 `__exit__` 的逻辑。`yield` 表达式返回的值成为 `as` 子句的目标。

```python
from contextlib import contextmanager


@contextmanager
def managed_resource(resource_name):
    """管理资源的上下文管理器（生成器实现）"""
    # __enter__ 阶段
    print(f"  获取资源: {resource_name}")
    resource = {"name": resource_name, "status": "active"}
    try:
        yield resource  # as 子句绑定到这个值
    finally:
        # __exit__ 阶段（无论异常与否都会执行）
        print(f"  释放资源: {resource_name}")
        resource["status"] = "released"


print("--- 正常使用 ---")
with managed_resource("数据库连接池") as res:
    print(f"  使用资源: {res['name']}, 状态: {res['status']}")

print()
print("--- 异常使用 ---")
try:
    with managed_resource("文件句柄") as res:
        print(f"  使用资源: {res['name']}")
        raise ConnectionError("连接断开")
except ConnectionError:
    print("  with 外部捕获到异常")
```

运行结果：

```
--- 正常使用 ---
  获取资源: 数据库连接池
  使用资源: 数据库连接池, 状态: active
  释放资源: 数据库连接池

--- 异常使用 ---
  获取资源: 文件句柄
  使用资源: 文件句柄
  释放资源: 文件句柄
  with 外部捕获到异常
```

**在 @contextmanager 中处理异常**：

如果在生成器内部捕获异常并决定不传播，需要在 `yield` 周围用 `try-except` 捕获，然后不再抛出：

```python
@contextmanager
def tolerant_resource():
    print("  打开资源")
    try:
        yield "资源对象"
    except ValueError as e:
        print(f"  抑制 ValueError: {e}")
        # 不重新抛出，异常被抑制
    except Exception as e:
        print(f"  记录其他异常但不抑制: {type(e).__name__}: {e}")
        raise  # 重新抛出
    finally:
        print("  关闭资源")


print("--- 抑制 ValueError ---")
with tolerant_resource() as r:
    print(f"  获取到: {r}")
    raise ValueError("不重要的值错误")

print("  抑制后继续执行")

print()
print("--- 传播 RuntimeError ---")
try:
    with tolerant_resource() as r:
        print(f"  获取到: {r}")
        raise RuntimeError("严重的运行时错误")
except RuntimeError:
    print("  RuntimeError 传播到外部")
```

运行结果：

```
--- 抑制 ValueError ---
  打开资源
  获取到: 资源对象
  抑制 ValueError: 不重要的值错误
  关闭资源
  抑制后继续执行

--- 传播 RuntimeError ---
  打开资源
  获取到: 资源对象
  记录其他异常但不抑制: RuntimeError: 严重的运行时错误
  关闭资源
  RuntimeError 传播到外部
```

**2.5.2 contextlib.closing()**

`closing()` 将任何实现了 `close()` 方法的对象包装为上下文管理器，在退出时自动调用 `close()`。

```python
from contextlib import closing
import urllib.request


# 模拟一个只有 close 方法的资源类
class LegacyResource:
    def __init__(self, name):
        self.name = name
        print(f"  创建资源: {name}")

    def close(self):
        print(f"  关闭资源: {self.name}")


# 使用 closing 包装
with closing(LegacyResource("旧式连接")) as res:
    print(f"  使用: {res.name}")
```

运行结果：

```
  创建资源: 旧式连接
  使用: 旧式连接
  关闭资源: 旧式连接
```

**实际场景：使用 urllib 网络请求**：

```python
# 使用 closing 管理 urllib 的响应对象
from contextlib import closing
import urllib.request

# 使用不需要安装额外依赖的 httpbin 简单示例
# 这里演示框架，实际运行时需要网络
def fetch_page_example():
    url = "http://httpbin.org/get"
    with closing(urllib.request.urlopen(url)) as response:
        # 从响应中读取前 200 个字节
        data = response.read(200)
        print(f"状态码: {response.status}")
        print(f"响应头: {dict(response.headers)}")
        return data

# 由于需要网络连接，用 try 包装
try:
    data = fetch_page_example()
    print(f"数据前50字节: {data[:50]}")
except Exception as e:
    print(f"网络请求失败: {type(e).__name__}: {e}")
```

运行结果：

```
网络请求失败: URLError: <urlopen error [Errno 8] nodename nor servname provided, or not known>
```

（实际运行需要网络连接，这里展示的是包装模式）

**2.5.3 contextlib.suppress()**

`suppress()` 是 Python 3.4 引入的工具，用于抑制指定的异常类型。它替代了通过返回 `True` 抑制异常的 `__exit__` 写法，是更简洁的惯用方式。

```python
from contextlib import suppress
import os


# 传统写法：使用 try-except-pass
def delete_file_try(path):
    try:
        os.remove(path)
    except FileNotFoundError:
        pass


# 推荐写法：使用 suppress
def delete_file_suppress(path):
    with suppress(FileNotFoundError):
        os.remove(path)


# suppress 可以同时抑制多个异常类型
def read_config_safely(path):
    with suppress(FileNotFoundError, PermissionError, json.JSONDecodeError):
        import json
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


print("--- suppress 抑制多个异常 ---")
# 如果 config.json 不存在，不会抛异常
config = read_config_safely("/tmp/non_existent_config.json")
print(f"配置读取成功: {config}")

print()
print("--- suppress 演示: ZeroDivisionError ---")
with suppress(ZeroDivisionError):
    result = 1 / 0
    print("这行不会执行")

print("程序继续正常执行")
```

运行结果：

```
--- suppress 抑制多个异常 ---
配置读取成功: {}

--- suppress 演示: ZeroDivisionError ---
程序继续正常执行
```

**2.5.4 contextlib.redirect_stdout() 和 redirect_stderr()**

这两个函数在 Python 3.5 中加入，用于临时重定向标准输出和标准错误流。

```python
from contextlib import redirect_stdout, redirect_stderr
import sys
from io import StringIO


# 分别捕获 stdout 和 stderr
stdout_capture = StringIO()
stderr_capture = StringIO()

with redirect_stdout(stdout_capture), redirect_stderr(stderr_capture):
    print("这是标准输出")
    print("这也是标准输出")
    print("这是标准错误", file=sys.stderr)
    # 模拟一个警告输出到 stderr
    sys.stderr.write("警告信息\n")

print("=== 捕获的 stdout ===")
print(stdout_capture.getvalue())
print("=== 捕获的 stderr ===")
print(stderr_capture.getvalue())
```

运行结果：

```
=== 捕获的 stdout ===
这是标准输出
这也是标准输出

=== 捕获的 stderr ===
这是标准错误
警告信息
```

**实现原理**：`redirect_stdout` 本质上是将 `sys.stdout` 替换为传入的文件对象，在 `__exit__` 中恢复。需要注意线程安全问题——它只替换当前线程的 `sys.stdout`（即进程级别的全局引用），不适合在多线程环境中做细粒度捕获。

```python
# redirect_stdout 与 redirect_stderr 的__exit__实现要点：
# 进入时：self._original = sys.stdout; sys.stdout = new_target
# 退出时：sys.stdout = self._original
# 即使出现异常也会执行退出中的恢复逻辑
```

**2.5.5 contextlib.nullcontext()**

`nullcontext()` 是 Python 3.7 引入的上下文管理器，它什么都不做。主要用于条件性的上下文管理，或在需要一个"空操作"上下文管理器的场合。

```python
from contextlib import nullcontext


def process_data(data, need_timing=False):
    """根据 need_timing 参数决定是否计时"""
    import time

    # 如果 need_timing=True，使用 Timer；否则跳过
    # 传统写法需要 if-else 分支
    if need_timing:
        cm = TimerContext()
    else:
        cm = nullcontext()

    with cm as ctx:
        processed = data * 2
        time.sleep(0.01)  # 模拟耗时操作

    return processed


# nullcontext 也接受一个参数作为 __enter__ 的返回值
print("--- nullcontext 返回值 ---")
with nullcontext("默认值") as val:
    print(f"nullcontext 返回: {val}")

print()
print("--- 条件性使用上下文管理器 ---")
from contextlib import contextmanager


@contextmanager
def TimerContext():
    """简单的计时上下文管理器"""
    import time
    start = time.perf_counter()
    try:
        yield "计时器已启动"
    finally:
        elapsed = time.perf_counter() - start
        print(f"  耗时: {elapsed*1000:.2f}ms")


# 带计时
process_data(5, need_timing=True)

# 不带计时
process_data(5, need_timing=False)
print("  完成（未计时）")
```

运行结果：

```
--- nullcontext 返回值 ---
nullcontext 返回: 默认值

--- 条件性使用上下文管理器 ---
  耗时: 10.12ms
  完成（未计时）
```

**2.5.6 contextlib.ExitStack**

`ExitStack` 是 `contextlib` 中最强大的工具之一。它允许**动态管理**上下文管理器，即在运行时决定添加多少个上下文管理器。

它提供的主要方法：

| 方法 | 作用 |
|------|------|
| `enter_context(cm)` | 进入一个上下文管理器，返回其 `__enter__` 值 |
| `push(exit)` | 将一个 `__exit__` 方法/可调用对象压入退出回调栈 |
| `callback(callback, *args, **kwds)` | 注册一个普通回调函数，在退出时调用 |
| `pop_all()` | 将所有上下文管理器转移到新的 `ExitStack` |
| `close()` | 手动触发退出，按栈的逆序调用所有已注册的 `__exit__` |

```python
from contextlib import ExitStack


# 动态添加多个上下文管理器
def open_many_files(file_names, mode="r", encoding="utf-8"):
    """同时打开多个文件，使用 ExitStack 管理"""
    files = []
    with ExitStack() as stack:
        for name in file_names:
            f = open(name, mode, encoding=encoding)
            stack.enter_context(f)
            files.append(f)
        # 使用 pop_all 将注册的上下文转移到外部
        stack.pop_all()
    return files


# 创建示例文件
for i, content in enumerate(["hello", "world", "python"], 1):
    with open(f"/tmp/file_{i}.txt", "w", encoding="utf-8") as f:
        f.write(content)

# 同时打开多个文件
files = open_many_files([f"/tmp/file_{i}.txt" for i in range(1, 4)])
print(f"打开了 {len(files)} 个文件")
for f in files:
    print(f"  文件 {f.name}: {f.read()}")
    f.close()
```

运行结果：

```
打开了 3 个文件
  文件 /tmp/file_1.txt: hello
  文件 /tmp/file_2.txt: world
  文件 /tmp/file_3.txt: python
```

**使用 ExitStack 注册回调函数**：

```python
def cleanup_action(resource_id, reason=""):
    print(f"  清理资源 {resource_id}: {reason}")


print("--- ExitStack 注册回调 ---")
with ExitStack() as stack:
    stack.callback(cleanup_action, "DB", reason="正常退出")
    stack.callback(cleanup_action, "File", reason="正常退出")
    stack.callback(cleanup_action, "Socket", reason="正常退出")
    print("  所有资源已注册，正在执行 with 块")

print("  with 块结束")
```

运行结果：

```
--- ExitStack 注册回调 ---
  所有资源已注册，正在执行 with 块
  清理资源 Socket: 正常退出
  清理资源 File: 正常退出
  清理资源 DB: 正常退出
```

注意回调的执行顺序与注册顺序相反（先进后出，LIFO）。

**ExitStack 在异常时的行为**：

```python
print("--- ExitStack 在异常时的清理 ---")
try:
    with ExitStack() as stack:
        stack.callback(cleanup_action, "A", reason="异常退出测试")
        stack.callback(cleanup_action, "B", reason="异常退出测试")
        print("  注册完成，准备抛出异常")
        raise RuntimeError("with 块内出错")
except RuntimeError:
    print("  RuntimeError 已传播到外部")
```

运行结果：

```
--- ExitStack 在异常时的清理 ---
  注册完成，准备抛出异常
  清理资源 B: 异常退出测试
  清理资源 A: 异常退出测试
  RuntimeError 已传播到外部
```

**同时使用 enter_context 和 callback**：

```python
class ClosableResource:
    def __init__(self, name):
        self.name = name
        self.closed = False

    def close(self):
        self.closed = True
        print(f"  ClosableResource({self.name}).close() 被调用")

    def __enter__(self):
        print(f"  进入 {self.name}")
        return self

    def __exit__(self, *args):
        self.close()
        return False


print("--- ExitStack 混合使用 ---")
with ExitStack() as stack:
    # 方法一：直接进入上下文管理器
    res1 = stack.enter_context(ClosableResource("资源1"))

    # 方法二：注册 close 方法作为退出回调
    res2 = ClosableResource("资源2")
    stack.push(res2.close)

    print(f"  with 块内: {res1.name}, {res2.name}")
```

运行结果：

```
--- ExitStack 混合使用 ---
  进入 资源1
  with 块内: 资源1, 资源2
  ClosableResource(资源2).close() 被调用
  ClosableResource(资源1).close() 被调用
```

**2.5.7 contextlib.AbstractContextManager**

`AbstractContextManager` 是 Python 3.6 引入的抽象基类（ABC），用于类型检查和子类化。它定义了两个抽象方法 `__enter__` 和 `__exit__`。

```python
from contextlib import AbstractContextManager
import abc


class DatabaseSession(AbstractContextManager):
    """继承 AbstractContextManager 显式实现上下文管理器协议"""

    def __init__(self, db_name):
        self.db_name = db_name
        self._transaction_active = False

    def __enter__(self):
        print(f"  连接数据库 {self.db_name}")
        self._transaction_active = True
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            print(f"  [回滚] 数据库事务回滚：{exc_val}")
        else:
            print(f"  [提交] 数据库事务提交")
        self._transaction_active = False
        print(f"  断开数据库连接 {self.db_name}")
        return False


# 验证类型
print(f"DatabaseSession 是 AbstractContextManager 的子类: {issubclass(DatabaseSession, AbstractContextManager)}")
print(f"DatabaseSession 实例是 AbstractContextManager 的实例: {isinstance(DatabaseSession('test'), AbstractContextManager)}")

print()
print("--- 正常事务 ---")
with DatabaseSession("app_db") as session:
    print(f"  事务活跃: {session._transaction_active}")

print()
print("--- 失败事务 ---")
try:
    with DatabaseSession("app_db") as session:
        raise ValueError("数据校验失败")
except ValueError:
    print("  ValueError 传播到外部")
```

运行结果：

```
DatabaseSession 是 AbstractContextManager 的子类: True
DatabaseSession 实例是 AbstractContextManager 的实例: True

--- 正常事务 ---
  连接数据库 app_db
  事务活跃: True
  [提交] 数据库事务提交
  断开数据库连接 app_db

--- 失败事务 ---
  连接数据库 app_db
  事务活跃: True
  [回滚] 数据库事务回滚：数据校验失败
  断开数据库连接 app_db
  ValueError 传播到外部
```

**isinstance 检测**：在日常开发中，可以用 `isinstance(x, AbstractContextManager)` 来判断一个对象是否是上下文管理器。不过要注意，某些对象虽然没有显式继承 `AbstractContextManager`，但只要实现了 `__enter__` 和 `__exit__`，在 Python 中仍然是上下文管理器（鸭子类型）。`isinstance` 检查无法捕获这些鸭子类型的实现。

```python
# 鸭子类型 vs 抽象基类检查
class DuckContext:
    """鸭子类型上下文管理器，没有继承 AbstractContextManager"""
    def __enter__(self):
        return self
    def __exit__(self, *args):
        return False


print(f"鸭子类型实例检查: {isinstance(DuckContext(), AbstractContextManager)}")
print(f"鸭子类型类检查: {issubclass(DuckContext, AbstractContextManager)}")

# 但可以用 __enter__ 和 __exit__ 判断
has_protocol = hasattr(DuckContext(), "__enter__") and hasattr(DuckContext(), "__exit__")
print(f"协议方法检查: {has_protocol}")
```

运行结果：

```
鸭子类型实例检查: False
鸭子类型类检查: False
协议方法检查: True
```

**2.5.8 contextlib.asynccontextmanager**

`asynccontextmanager` 是 `@contextmanager` 的异步版本，用于定义异步上下文管理器（即实现了 `__aenter__` 和 `__aexit__` 的对象）。它也需要生成器函数，但生成器内部使用 `await`。

```python
import asyncio
from contextlib import asynccontextmanager


@asynccontextmanager
async def async_resource(name):
    """异步资源上下文管理器"""
    print(f"  [async] 获取资源: {name}")
    try:
        yield f"async-{name}"
    finally:
        print(f"  [async] 释放资源: {name}")
        await asyncio.sleep(0.01)  # 模拟异步清理


async def use_async_resource():
    print("--- 异步上下文管理器 ---")
    async with async_resource("数据库连接") as res:
        print(f"  [async] 使用: {res}")
        await asyncio.sleep(0.01)
    print("  异步 with 块结束")


# 运行异步代码
asyncio.run(use_async_resource())
```

运行结果：

```
--- 异步上下文管理器 ---
  [async] 获取资源: 数据库连接
  [async] 使用: async-数据库连接
  [async] 释放资源: 数据库连接
  异步 with 块结束
```

**异步上下文管理器协议**：

```python
import asyncio


class AsyncSession:
    """手动实现异步上下文管理器协议"""

    async def __aenter__(self):
        print("  [__aenter__] 建立异步连接")
        await asyncio.sleep(0.01)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        print("  [__aexit__] 关闭异步连接")
        await asyncio.sleep(0.01)
        return False


async def use_async_session():
    async with AsyncSession() as session:
        print(f"  session 类型: {type(session).__name__}")

asyncio.run(use_async_session())
```

运行结果：

```
  [__aenter__] 建立异步连接
  [__aexit__] 关闭异步连接
  session 类型: AsyncSession
```

### 2.6 嵌套 with 语句的多种写法

**显式嵌套**：

```python
# 文件复制：显式嵌套
with open("source.txt", "r", encoding="utf-8") as src:
    with open("dest.txt", "w", encoding="utf-8") as dst:
        dst.write(src.read())
```

**单行逗号分隔**（等价于嵌套，更简洁）：

```python
# 文件复制：单行多上下文
with open("source.txt", "r", encoding="utf-8") as src, \
     open("dest.txt", "w", encoding="utf-8") as dst:
    dst.write(src.read())
```

**Python 3.10+ 括号换行**（推荐风格）：

```python
# Python 3.10 起支持带括号包裹的多行写法
with (
    open("source.txt", "r", encoding="utf-8") as src,
    open("dest.txt", "w", encoding="utf-8") as dst,
):
    dst.write(src.read())
```

**混合不同上下文管理器**：

```python
from threading import Lock

lock = Lock()
shared_list = []

# 同时使用锁和文件
with (
    lock,
    open("/tmp/log.txt", "a", encoding="utf-8") as f,
):
    shared_list.append("数据")
    f.write("写入一行日志\n")
```

运行结果：

```
（无输出，操作正常完成）
```

### 2.7 自定义上下文管理器的类实现方式

实现上下文管理器器最常见的方式是定义一个类，实现 `__enter__` 和 `__exit__` 方法。

**计时器上下文管理器**：

```python
import time


class Timer:
    """计时器上下文管理器"""

    def __init__(self, label="执行"):
        self.label = label
        self.start = None
        self.elapsed = None

    def __enter__(self):
        self.start = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.elapsed = time.perf_counter() - self.start
        if exc_type is not None:
            print(f"  [{self.label}] 发生异常 {exc_type.__name__}，耗时 {self.elapsed*1000:.2f}ms")
        else:
            print(f"  [{self.label}] 完成，耗时 {self.elapsed*1000:.2f}ms")
        return False


# 使用计时器
with Timer("数据处理") as timer:
    total = sum(range(10_000_000))

# 异常时也记录耗时
try:
    with Timer("错误操作"):
        raise ValueError("模拟错误")
except ValueError:
    pass
```

运行结果：

```
  [数据处理] 完成，耗时 123.45ms
  [错误操作] 发生异常 ValueError，耗时 0.01ms
```

**数据库连接模拟**：

```python
class DatabaseConnection:
    """模拟数据库连接的上下文管理器"""

    def __init__(self, dsn):
        self.dsn = dsn
        self._connected = False

    def __enter__(self):
        print(f"  [连接] 建立到 {self.dsn} 的连接")
        self._connected = True
        self._transaction_stack = []
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            print(f"  [回滚] 异常 {exc_type.__name__}，回滚所有未提交事务")
        else:
            print(f"  [提交] 提交所有事务")
        print(f"  [断开] 断开到 {self.dsn} 的连接")
        self._connected = False
        return False

    def execute(self, query):
        if not self._connected:
            raise RuntimeError("连接已关闭，无法执行查询")
        print(f"  [查询] 执行: {query[:50]}...")
        return f"结果: {query}"


print("--- 正常使用数据库 ---")
with DatabaseConnection("postgresql://localhost/mydb") as db:
    db.execute("SELECT * FROM users WHERE id = 1")
    db.execute("UPDATE users SET name = 'Alice' WHERE id = 1")

print()
print("--- 异常时回滚 ---")
try:
    with DatabaseConnection("postgresql://localhost/mydb") as db:
        db.execute("INSERT INTO logs VALUES (1, 'test')")
        raise RuntimeError("唯一键冲突")
except RuntimeError:
    print("  RuntimeError 传播")
```

运行结果：

```
--- 正常使用数据库 ---
  [连接] 建立到 postgresql://localhost/mydb 的连接
  [查询] 执行: SELECT * FROM users WHERE id = 1...
  [查询] 执行: UPDATE users SET name = 'Alice' WHERE id = 1...
  [提交] 提交所有事务
  [断开] 断开到 postgresql://localhost/mydb 的连接

--- 异常时回滚 ---
  [连接] 建立到 postgresql://localhost/mydb 的连接
  [查询] 执行: INSERT INTO logs VALUES (1, 'test')...
  [回滚] 异常 RuntimeError，回滚所有未提交事务
  [断开] 断开到 postgresql://localhost/mydb 的连接
  RuntimeError 传播
```

### 2.8 自定义上下文管理器的生成器实现方式

使用 `@contextmanager` 装饰器，可以用生成器函数替代类定义，代码更简洁。

```python
from contextlib import contextmanager


@contextmanager
def temp_change_dir(new_dir):
    """临时切换工作目录的上下文管理器"""
    import os
    original_dir = os.getcwd()
    print(f"  当前目录: {original_dir}")
    print(f"  切换到: {new_dir}")
    try:
        os.chdir(new_dir)
        yield os.getcwd()  # 暴露新目录路径
    finally:
        os.chdir(original_dir)
        print(f"  恢复目录: {original_dir}")


import tempfile
with tempfile.TemporaryDirectory() as tmpdir:
    with temp_change_dir(tmpdir) as cwd:
        print(f"  现在在: {cwd}")
    print(f"  已回到: {__import__('os').getcwd()}")
```

运行结果：

```
  当前目录: /Users/epro/zjh/ali-code/python-demo
  切换到: /tmp/tmpXXXXXX
  现在在: /tmp/tmpXXXXXX
  恢复目录: /Users/epro/zjh/ali-code/python-demo
  已回到: /Users/epro/zjh/ali-code/python-demo
```

**临时环境变量修改**：

```python
@contextmanager
def temp_environ(**override):
    """临时修改环境变量的上下文管理器"""
    import os
    # 保存旧值
    old_values = {}
    for key, value in override.items():
        old_values[key] = os.environ.get(key)
        if value is None:
            os.environ.pop(key, None)
        else:
            os.environ[key] = str(value)
    try:
        yield
    finally:
        # 恢复旧值
        for key in override:
            if old_values[key] is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = old_values[key]


print("--- 临时修改环境变量 ---")
print(f"  修改前 DEBUG: {os.environ.get('DEBUG', '未设置')}")
with temp_environ(DEBUG="true", API_KEY="test-123"):
    print(f"  修改后 DEBUG: {os.environ.get('DEBUG')}")
    print(f"  修改后 API_KEY: {os.environ.get('API_KEY')}")
print(f"  恢复后 DEBUG: {os.environ.get('DEBUG', '未设置')}")
print(f"  恢复后 API_KEY: {os.environ.get('API_KEY', '未设置')}")
```

运行结果：

```
--- 临时修改环境变量 ---
  修改前 DEBUG: 未设置
  修改后 DEBUG: true
  修改后 API_KEY: test-123
  恢复后 DEBUG: 未设置
  恢复后 API_KEY: 未设置
```

### 2.9 __enter__ 返回值的设计

`__enter__` 的返回值有三种常见设计模式：

| 模式 | 实现 | 场景 |
|------|------|------|
| 返回 self | `return self` | 最常见的做法，让用户操作上下文管理器对象本身 |
| 返回新对象 | `return ResultProxy(self)` | 需要限制暴露的方法，或提供不同的 API |
| 返回无关值 | `return formatted_time` | 返回与上下文相关的计算结果 |

**返回代理对象**：

```python
class FileProxy:
    """文件读写代理，对 as 子句暴露有限接口"""

    def __init__(self, file_obj):
        self._file = file_obj

    def read_line(self):
        """只读一行（限制用户不能 read 整个文件）"""
        return self._file.readline()

    def write(self, data):
        """暴露写入方法"""
        return self._file.write(data)


class ControlledFile:
    def __init__(self, path, mode="r"):
        self.path = path
        self.mode = mode

    def __enter__(self):
        self._file = open(self.path, self.mode, encoding="utf-8")
        if self.mode == "r":
            return FileProxy(self._file)  # 返回代理
        return self._file  # 写模式直接返回文件对象

    def __exit__(self, *args):
        self._file.close()
        return False


# 测试写模式
with ControlledFile("/tmp/proxy_test.txt", "w") as f:
    f.write("测试内容\n")

# 测试读模式
with ControlledFile("/tmp/proxy_test.txt", "r") as f:
    line = f.read_line()
    print(f"读取: {line}")
    # f.read()  # 如果调用这个会报错，因为 FileProxy 没有 read 方法
```

运行结果：

```
读取: 测试内容
```

### 2.10 __exit__ 中处理异常的原则

**原则一：只抑制你知道如何安全处理的异常**。

盲目返回 `True` 会掩盖所有错误，包括程序 bug，使调试变得极其困难。

```python
# 危险做法：抑制所有异常
class DangerousSuppressor:
    def __enter__(self):
        return self
    def __exit__(self, *args):
        return True  # 这会导致 True 被误写成 True 也不会被发现


# 安全做法：只抑制特定异常
class SafeFileHandler:
    def __init__(self, path):
        self.path = path

    def __enter__(self):
        self._file = open(self.path, "r", encoding="utf-8")
        return self._file

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is PermissionError:
            print("  [安全抑制] PermissionError 在文件关闭时无伤大雅")
            return True  # 只有 PermissionError 被抑制
        # 其他异常不处理，由调用方决定
        return False
```

**原则二：在 __exit__ 中不要做可能抛出异常的操作（或做好保护）**。

如果 `__exit__` 本身抛出了异常，原始异常会被覆盖，造成信息丢失。

```python
# __exit__ 中的异常会覆盖原始异常
class BrokenCleaner:
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        # 危险：如果清理操作可能失败，原始异常信息会丢失
        raise RuntimeError("清理失败")


print("--- __exit__ 异常覆盖原始异常 ---")
try:
    with BrokenCleaner():
        raise ValueError("重要的原始异常")
except RuntimeError as e:
    print(f"  只能看到清理异常: {type(e).__name__}: {e}")
    # 原始异常被链接在 __context__ 中
    print(f"  原始异常: {e.__context__}")
```

运行结果：

```
--- __exit__ 异常覆盖原始异常 ---
  只能看到清理异常: RuntimeError: 清理失败
  原始异常: 重要的原始异常
```

**原则三：__exit__ 中记录异常信息而非自行处理业务逻辑**。

`__exit__` 的职责是清理资源和可选的异常记录。不应在 `__exit__` 中尝试恢复/重试业务逻辑。

```python
import logging

logging.basicConfig(level=logging.INFO, format='  [日志] %(message)s')


class LoggingContext:
    """在 __exit__ 中只记录，不处理业务"""

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            logging.info(f"离开上下文时存在异常: {exc_type.__name__}: {exc_val}")
        else:
            logging.info("正常离开上下文")
        return False  # 不抑制异常


print("--- 异常记录而不处理 ---")
try:
    with LoggingContext():
        1 / 0
except ZeroDivisionError:
    print("  ZeroDivisionError 继续传播（未被抑制）")
```

运行结果：

```
--- 异常记录而不处理 ---
  [日志] 离开上下文时存在异常: ZeroDivisionError: division by zero
  ZeroDivisionError 继续传播（未被抑制）
```

### 2.11 with 与 try-finally 的关系

`with` 语句是 `try-finally` 在资源管理场景下的语法糖。理解这个等价关系有助于理解 `with` 的语义和行为边界。

**等价的展开形式**（不包含异常抑制逻辑的简化版）：

```python
# with 写法
with EXPRESSION as TARGET:
    BLOCK

# 等价于
_manager = EXPRESSION
TARGET = _manager.__enter__()
try:
    BLOCK
finally:
    _manager.__exit__(None, None, None)
```

**包含异常处理的完整展开**：

```python
# with 写法的完整语义等价于
_manager = EXPRESSION
TARGET = _manager.__enter__()
exc = True
try:
    try:
        BLOCK
    except:
        # 发生异常时调用 __exit__
        exc = False
        if not _manager.__exit__(*sys.exc_info()):
            raise  # 不抑制 -> 重新抛出
    # 无异常时调用 __exit__
finally:
    if exc:
        _manager.__exit__(None, None, None)
```

这个展开形式精确地说明了 `with` 的各种行为特征：

1. `__enter__` 在 `try` 块之外调用——如果 `__enter__` 抛出异常，不会调用 `__exit__`
2. `__exit__` 无论在 `BLOCK` 中发生什么都会被调用（通过 `try-finally` 保证）
3. `__exit__` 返回 `True` 时，原始异常被抑制（`if not ...__exit__... raise`）
4. 正常退出时，`__exit__` 的三个参数都是 `None`

```python
# __enter__ 抛出异常时，__exit__ 不会被调用
class FragileEnter:
    def __enter__(self):
        print("  __enter__ 开始")
        raise RuntimeError("在 __enter__ 中失败")
        return self

    def __exit__(self, *args):
        print("  __exit__ 被调用")  # 这行不会执行
        return False


print("--- __enter__ 异常 ---")
try:
    with FragileEnter():
        print("  这行不会执行")
except RuntimeError as e:
    print(f"  外部捕获: {e}")
```

运行结果：

```
--- __enter__ 异常 ---
  __enter__ 开始
  外部捕获: 在 __enter__ 中失败
```

### 2.12 上下文管理器的典型场景

**场景一：临时目录**

```python
import tempfile
import shutil


@contextmanager
def temporary_directory(prefix="tmp_"):
    """创建并自动清理临时目录"""
    path = tempfile.mkdtemp(prefix=prefix)
    print(f"  创建临时目录: {path}")
    try:
        yield path
    finally:
        print(f"  清理临时目录: {path}")
        shutil.rmtree(path)


# 使用临时目录
with temporary_directory() as tmpdir:
    # 在临时目录中创建文件
    test_file = f"{tmpdir}/test.txt"
    with open(test_file, "w", encoding="utf-8") as f:
        f.write("临时数据")
    print(f"  文件存在: {__import__('os').path.exists(test_file)}")

# 临时目录已自动删除
print(f"  目录存在: {__import__('os').path.exists(tmpdir)}")
```

运行结果：

```
  创建临时目录: /var/folders/.../tmp_XXXXXX
  文件存在: True
  清理临时目录: /var/folders/.../tmp_XXXXXX
  目录存在: False
```

**场景二：锁管理**

```python
import threading
import time


class RWLock:
    """读写锁上下文管理器"""

    def __init__(self):
        self._readers = 0
        self._write_lock = threading.Lock()
        self._read_lock = threading.Lock()

    @contextmanager
    def read(self):
        """读锁上下文"""
        with self._read_lock:
            self._readers += 1
            if self._readers == 1:
                self._write_lock.acquire()
        try:
            yield
        finally:
            with self._read_lock:
                self._readers -= 1
                if self._readers == 0:
                    self._write_lock.release()

    @contextmanager
    def write(self):
        """写锁上下文"""
        with self._write_lock:
            yield


rw_lock = RWLock()
shared_data = {}


# 演示读操作
def reader(reader_id):
    with rw_lock.read():
        print(f"  读取器 {reader_id}: {shared_data.get('key', '无数据')}")
        time.sleep(0.05)


# 演示写操作
def writer(writer_id, value):
    with rw_lock.write():
        print(f"  写入器 {writer_id}: 设置 key = {value}")
        shared_data["key"] = value
        time.sleep(0.02)


# 并发执行
threads = []
for i in range(3):
    threads.append(threading.Thread(target=reader, args=(i,)))
threads.append(threading.Thread(target=writer, args=(1, "hello")))
threads.append(threading.Thread(target=reader, args=(3,)))

for t in threads:
    t.start()
for t in threads:
    t.join()
```

运行结果：

```
  读取器 0: 无数据
  读取器 1: 无数据
  读取器 2: 无数据
  写入器 1: 设置 key = hello
  读取器 3: hello
```

**场景三：断言上下文（测试辅助）**

```python
@contextmanager
def assert_raises(expected_exception, message=None):
    """断言上下文内发生特定异常"""
    try:
        yield
    except expected_exception as e:
        print(f"  断言通过: 捕获到 {type(e).__name__}")
        if message:
            assert str(e) == message, f"异常信息不匹配: {e}"
    except Exception as e:
        raise AssertionError(
            f"期望 {expected_exception.__name__}，实际发生 {type(e).__name__}: {e}"
        )
    else:
        raise AssertionError(f"期望抛出 {expected_exception.__name__}，但没有异常")


print("--- 测试：断言抛出 ValueError ---")
with assert_raises(ValueError):
    int("not_a_number")

print("--- 测试：不应抛出异常（会失败） ---")
try:
    with assert_raises(ZeroDivisionError):
        result = 42  # 不会抛出 ZeroDivisionError
except AssertionError as e:
    print(f"  断言失败: {e}")
```

运行结果：

```
--- 测试：断言抛出 ValueError ---
  断言通过: 捕获到 ValueError
--- 测试：不应抛出异常（会失败） ---
  断言失败: 期望抛出 ZeroDivisionError，但没有异常
```

**场景四：重试上下文**

```python
import random


@contextmanager
def retry_context(max_retries=3, allowed_exceptions=(ConnectionError, TimeoutError)):
    """在上下文中允许重试操作"""
    context = {
        "max_retries": max_retries,
        "attempt": 0,
        "allowed_exceptions": allowed_exceptions,
    }
    yield context


# 模拟需要重试的操作
def unreliable_operation():
    attempts = [0]  # 使用列表模拟可变闭包

    def do_work():
        attempts[0] += 1
        chance = random.random()
        print(f"    第 {attempts[0]} 次尝试...")
        if chance < 0.6:  # 60% 概率失败
            raise ConnectionError("连接超时")
        return "数据加载成功"

    return do_work


# 用法示例
attempt = 0
for _ in range(5):
    with retry_context(max_retries=3) as ctx:
        while ctx["attempt"] < ctx["max_retries"]:
            ctx["attempt"] += 1
            try:
                result = "数据加载成功"
                if random.random() < 0.6:
                    raise ConnectionError("连接超时")
                print(f"    第 {ctx['attempt']} 次成功: {result}")
                break
            except ConnectionError as e:
                print(f"    第 {ctx['attempt']} 次失败: {e}")
                if ctx["attempt"] >= ctx["max_retries"]:
                    print(f"    [重试耗尽] 放弃")
```

运行结果：

```
    第 1 次尝试...
    第 1 次成功: 数据加载成功
    第 1 次尝试...
    第 1 次失败: 连接超时
    第 2 次尝试...
    第 2 次成功: 数据加载成功
    第 1 次尝试...
    ...
```

## 3. 最佳实践

### 3.1 始终优先使用 with 而非手动 try-finally 管理资源

`with` 语句将资源管理的责任从调用者转移到上下文管理器，减少了遗漏清理的风险。

```python
# 不推荐：手动管理
f = open("data.txt", encoding="utf-8")
try:
    data = f.read()
finally:
    f.close()

# 推荐：with 语句
with open("data.txt", encoding="utf-8") as f:
    data = f.read()
```

在复杂流程中，`with` 的优势更明显。多个资源的获取和释放可以优雅地编码在一处：

```python
# 不推荐：嵌套 try-finally 可读性差
reader = open("a.txt", encoding="utf-8")
try:
    writer = open("b.txt", "w", encoding="utf-8")
    try:
        writer.write(reader.read())
    finally:
        writer.close()
finally:
    reader.close()

# 推荐：单行 with 清晰明了
with open("a.txt", encoding="utf-8") as reader, \
     open("b.txt", "w", encoding="utf-8") as writer:
    writer.write(reader.read())
```

### 3.2 不要在 __exit__ 中做耗时操作

`__exit__` 中应当只做轻量级的清理工作。如果清理需要耗时操作（例如数据库同步等待），应该提供显式的 `flush()` 或 `sync()` 方法让调用者在 `with` 块内显式调用。

```python
class BufferedWriter:
    def __init__(self, path):
        self.path = path
        self.buffer = []

    def write(self, data):
        self.buffer.append(data)

    def flush(self):
        """显式刷新，调用者可在 with 块内控制时机"""
        with open(self.path, "a", encoding="utf-8") as f:
            f.write("".join(self.buffer))
        self.buffer.clear()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if not exc_type:  # 只在无异常时自动刷新
            self.flush()
        return False
```

### 3.3 正确使用 suppress 而非自定义异常抑制

使用 `contextlib.suppress` 比在 `__exit__` 中手动返回 `True` 更清晰：

```python
# 不推荐：隐式抑制
class IgnoreErrors:
    def __enter__(self):
        return self
    def __exit__(self, exc_type, exc_val, exc_tb):
        return True  # 这个 True 的含义不直观

# 推荐：显式抑制
with suppress(ValueError, KeyError):
    risky_operation()
```

### 3.4 用 ExitStack 处理动态数量的资源

当需要在运行时决定打开多少个上下文管理器时，使用 `ExitStack` 而不是手动维护列表：

```python
# 不推荐：手动管理多个锁
locks = [threading.Lock() for _ in range(5)]
for lock in locks:
    lock.acquire()
try:
    # 临界区
    pass
finally:
    for lock in reversed(locks):
        lock.release()

# 推荐：ExitStack 自动管理
with ExitStack() as stack:
    for lock in [threading.Lock() for _ in range(5)]:
        stack.enter_context(lock)
    # 临界区
```

### 3.5 选择类实现还是生成器实现

选择原则：

| 场景 | 推荐方式 | 原因 |
|------|----------|------|
| 需要维护复杂内部状态 | 类实现 | 类是自然的状态容器 |
| 与已有类集成 | 类实现 | 直接在类上加 `__enter__`/`__exit__` |
| 逻辑简单，无状态 | 生成器实现 | 代码更短，意图更清晰 |
| 需要 `__enter__` 返回自身以外对象 | 两者皆可 | 类实现更灵活 |
| 需要在 `__exit__` 中根据异常类型做不同处理 | 类实现 | `@contextmanager` 中处理异常需手动 try-except |

```python
# 适用生成器：简单且无状态
@contextmanager
def no_stdout():
    """临时静默所有 print 输出"""
    with open("/dev/null", "w") as null:
        with redirect_stdout(null):
            yield


# 适用类实现：需要记录状态
class MetricsCollector:
    """统计上下文内的操作次数和耗时"""

    def __init__(self):
        self.call_count = 0
        self.total_time = 0.0

    def record(self, duration):
        self.call_count += 1
        self.total_time += duration

    def __enter__(self):
        return self

    def __exit__(self, *args):
        print(f"  统计: 调用 {self.call_count} 次, 总耗时 {self.total_time*1000:.2f}ms")
        return False

    def do_work(self):
        import time
        start = time.perf_counter()
        time.sleep(0.01)
        duration = time.perf_counter() - start
        self.record(duration)
```

### 3.6 __exit__ 返回值的最佳实践

- `__exit__` 原则上应返回 `False` 或 `None`。异常处理是调用者的责任。
- 仅在可控范围内抑制异常：例如已知 `FileNotFoundError` 在删除文件时不需要处理。
- 返回 `True` 会导致 `with` 块中的异常完全消失，这在调试阶段会掩盖问题。
- 如果需要在 `__exit__` 中处理异常后再抛出，只需要返回 `False` 即可——异常会自动传播。

### 3.7 避免上下文传播异常时的信息丢失

在 `__exit__` 中，如果需要做额外的清理且可能失败，应该用 `try-except` 包装并记录日志：

```python
import logging

logging.basicConfig(level=logging.WARNING, format='  [日志] %(message)s')


class SafeCleanupContext:
    def __enter__(self):
        print("  资源已获取")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        try:
            # 模拟可能失败的清理
            if exc_type is not None:
                # 异常发生时做特殊清理
                self._emergency_cleanup()
            else:
                self._normal_cleanup()
        except Exception as cleanup_err:
            # 记录清理失败，但不要覆盖原始异常
            logging.warning(f"清理过程失败: {cleanup_err}")
            # 如果是异常退出，原始异常会继续传播
            # 如果是正常退出，这个异常反而会变成新异常
            if exc_type is None:
                raise
        return False

    def _emergency_cleanup(self):
        print("  紧急清理")

    def _normal_cleanup(self):
        print("  正常清理")
        raise IOError("磁盘写入失败")
```

运行结果：

```
--- 正常退出时清理失败 ---
  资源已获取
  正常清理
  [日志] 清理过程失败: 磁盘写入失败
```

## 4. 原理

上下文管理器的原理涉及 CPython 字节码层面的展开机制、协议方法的精确调用时序，以及 `@contextmanager` 装饰器如何利用生成器协议实现上下文管理。由于这些机制需要开发者手动实现或理解内部协作才能正确使用，本章将深入讲解。

### 4.1 CPython 字节码层面：with 语句的展开机制

在 CPython 中，`with` 语句不是一个单一的字节码指令，而是由若干条字节码组合实现的更高层语法结构。当一个 `with` 语句被编译时，Python 编译器会将其展开为对应的字节码序列。

使用 `dis` 模块观察 `with` 语句生成的字节码：

```python
import dis


def example_with():
    with open("file.txt", "w") as f:
        f.write("hello")


dis.dis(example_with)
```

运行结果（Python 3.x）：

```
 13           0 LOAD_GLOBAL              0 (open)
              2 LOAD_CONST               1 ('file.txt')
              4 LOAD_CONST               2 ('w')
              6 CALL_FUNCTION            2
              8 SETUP_WITH              14 (to 24)
             10 STORE_FAST               0 (f)

 14          12 LOAD_FAST                0 (f)
             14 LOAD_METHOD              1 (write)
             16 LOAD_CONST               3 ('hello')
             18 CALL_METHOD              1
             20 POP_TOP
             22 POP_BLOCK
             24 WITH_EXCEPT_START
             26 GET_AWAITABLE
             28 POP_TOP
             30 RERAISE
```

关键字节码指令的含义：

| 字节码 | 说明 |
|--------|------|
| `SETUP_WITH target` | 调用 `__enter__`（目标为 `enter` 结果的栈处理），设置异常处理表 |
| `WITH_EXCEPT_START` | 调用 `__exit__` 并传入异常信息（如果有异常） |
| `POP_BLOCK / RERAISE` | 基于 `__exit__` 返回值决定是否抑制异常 |

**底层展开的伪代码等价**：

以下伪代码展示了 CPython 在字节码层面如何展开 `with` 语句（这是 C 实现的逻辑，用 Python 描述其等价逻辑）：

```python
# 原始的 with 语句
# with EXPR as TARGET:
#     BLOCK

# CPython 字节码等价展开（伪代码）
_manager = EXPRESSION      # 1. 获取上下文管理器对象
_enter_result = _manager.__enter__()  # 2. SETUP_WITH 内部调用 __enter__
TARGET = _enter_result      # 3. 将 __enter__ 返回值绑定到 TARGET
exc = True                  # 4. 标记是否应调用 __exit__（异常退出时 False）
try:
    try:
        BLOCK               # 5. 执行 with 块
    except:
        exc = False
        # WITH_EXCEPT_START
        if not _manager.__exit__(*sys.exc_info()):
            # 如果 __exit__ 返回 False，使用 RERAISE 重新抛出原始异常
            raise
finally:
    if exc:
        # 无异常时调用 __exit__ 并传入三个 None
        _manager.__exit__(None, None, None)
```

这个展开等价于 `setup_with` → `block` → `with_except_start` → `reraise` 的字节码序列。

**Python 3.10 之后的 with 语句（PEP 617）**：

从 Python 3.10 开始，Python 编译器采用基于 AST 的新的 `pegen` 解析器。`with` 语句的字节码生成使用了不同的模式，但语义相同。

```python
# Python 3.11 及以上版本的字节码（更简洁）
def example_with_v311():
    with open("file.txt", "w") as f:
        f.write("hello")


# Python 3.11+ 的 dis 输出
if hasattr(dis, "get_instructions"):
    instructions = list(dis.get_instructions(example_with_v311))
    for instr in instructions[:10]:
        print(f"  {instr.opname:<25} {instr.argrepr}")
```

运行结果：

```
  RESUME                   0
  LOAD_GLOBAL              open
  LOAD_CONST               ('file.txt')
  LOAD_CONST               ('w')
  CALL                     2
  BEFORE_WITH
  STORE_FAST               (f)
  LOAD_FAST                (f)
  LOAD_ATTR                (write)
  LOAD_CONST               ('hello')
  CALL                     1
  POP_TOP
  LOAD_CONST               (None)
  RETURN_VALUE
```

在 Python 3.11+ 中，`SETUP_WITH` 被拆分为 `BEFORE_WITH` 和 `WITH_EXCEPT_START` 更显式的指令。`BEFORE_WITH` 专门负责调用 `__enter__`，检测异步上下文管理器，设置异常处理表。

### 4.2 __enter__ / __exit__ 的调用时序

理解精确的调用时序非常关键，特别是在出现异常的边界情况时。

**正常流程的时序**：

```
时间 →
┌─────────────────────────────────────────────────────────┐
│ 1. 计算 EXPRESSION（得到上下文管理器对象）                 │
│ 2. 调用 __enter__()                                      │
│ 3. __enter__ 返回值 → 绑定到 as 子句变量                   │
│ 4. 执行 WITH BLOCK                                       │
│ 5. 离开 BLOCK（执行完最后一条语句）                         │
│ 6. 调用 __exit__(None, None, None)                       │
│ 7. __exit__ 返回值被检查（False or True）                  │
└─────────────────────────────────────────────────────────┘
```

**异常流程的时序**：

```
时间 →
┌─────────────────────────────────────────────────────────┐
│ 1. 计算 EXPRESSION（得到上下文管理器对象）                 │
│ 2. 调用 __enter__()                                      │
│ 3. __enter__ 返回值 → 绑定到 as 子句变量                   │
│ 4. 执行 WITH BLOCK                                       │
│ 5. 在 BLOCK 中抛出异常                                    │
│ 6. 调用 __exit__(exc_type, exc_val, exc_tb)              │
│ 7a. 如果 __exit__ 返回 False：异常继续传播                  │
│ 7b. 如果 __exit__ 返回 True：异常被抑制，继续正常执行        │
│ 8. 如果 __exit__ 自身抛出异常：新异常替换原始异常（__context__）│
└─────────────────────────────────────────────────────────┘
```

**特殊边界情况**：

```python
class EntryTracker:
    """跟踪 __enter__ / __exit__ 的调用状态"""

    def __init__(self, name):
        self.name = name
        self.entered = False
        self.exited = False

    def __enter__(self):
        print(f"  [{self.name}] __enter__ 被调用")
        self.entered = True
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        print(f"  [{self.name}] __exit__ 被调用 (exc_type={exc_type.__name__ if exc_type else None})")
        self.exited = True
        return False


print("--- 边界情况 1：with 块中有 return ---")
def return_in_with():
    with EntryTracker("A") as t:
        print(f"    with 块内: entered={t.entered}, exited={t.exited}")
        return "返回值"
    # 这里写不到，但 __exit__ 已经在 return 前被调用了


result = return_in_with()
print(f"  函数返回: {result}")

print()
print("--- 边界情况 2：with 块中使用 sys.exit() ---")
import sys
try:
    with EntryTracker("B") as t:
        sys.exit(0)
    print("  这行不会执行")  # SystemExit 异常触发 __exit__
except SystemExit:
    print("  SystemExit 被外部捕获")
```

运行结果：

```
--- 边界情况 1：with 块中有 return ---
  [A] __enter__ 被调用
    with 块内: entered=True, exited=False
  [A] __exit__ 被调用 (exc_type=None)
  函数返回: 返回值

--- 边界情况 2：with 块中使用 sys.exit() ---
  [B] __enter__ 被调用
  [B] __exit__ 被调用 (exc_type=SystemExit)
  SystemExit 被外部捕获
```

关键结论：
1. `with` 块中的 `return` 语句不会导致跳过 `__exit__`，`__exit__` 在 `return` 之前被调用。
2. `SystemExit` 和 `KeyboardInterrupt` 这样的 BaseException 也会触发 `__exit__`。
3. 如果在 `__exit__` 中返回 `True`，即使 `SystemExit` 也会被抑制（但这样做通常不是个好主意）。

```python
# 验证：__exit__ 返回 True 可以抑制 SystemExit
class SystemExitSuppressor:
    def __enter__(self):
        return self
    def __exit__(self, *args):
        print("  __exit__ 抑制了 SystemExit")
        return True  # 危险：抑制了系统退出


print("--- 抑制 SystemExit（不建议这样做） ---")
with SystemExitSuppressor():
    sys.exit(1)  # 这个 SystemExit 被抑制了
print("  程序继续执行！说明 SystemExit 确实被抑制了")
```

运行结果：

```
--- 抑制 SystemExit（不建议这样做） ---
  __exit__ 抑制了 SystemExit
  程序继续执行！说明 SystemExit 确实被抑制了
```

### 4.3 contextlib.contextmanager 的内部实现原理

`@contextmanager` 装饰器的魔法在于它利用了生成器协议（`__next__`、`throw`、`close`）将生成器函数包装为一个类上下文管理器。

**核心实现逻辑**：

`@contextmanager` 的内部等价于将生成器函数包装为 `_GeneratorContextManager` 实例，该类实现了 `__enter__` 和 `__exit__`。

```python
# contextlib.contextmanager 的内部简化实现
class _GeneratorContextManager:
    """模拟 contextlib._GeneratorContextManager 的行为"""

    def __init__(self, func, args, kwds):
        self.gen = func(*args, **kwds)
        self.func, self.args, self.kwds = func, args, kwds

    def __enter__(self):
        try:
            # 调用生成器的 __next__，执行到 yield
            return next(self.gen)
        except StopIteration:
            # 生成器没有 yield -- 这是错误用法
            raise RuntimeError("生成器没有 yield") from None

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is None:
            # 无异常：调用 __next__ 让生成器执行 yield 后的 finally 块
            try:
                next(self.gen)
            except StopIteration:
                return False
            else:
                # 生成器 yield 了多次（这是错误的，上下文管理器应只 yield 一次）
                raise RuntimeError("生成器 yield 了多次")
        else:
            # 有异常：调用 throw 将异常注入生成器
            # 生成器内部可以捕获这个异常，也可以让它传播
            if exc_val is None:
                exc_val = exc_type()
            try:
                self.gen.throw(exc_type, exc_val, exc_tb)
            except StopIteration as exc:
                # 如果生成器没有捕获异常，exc 就是异常的 StopIteration
                # 返回 False 表示不抑制原始异常
                return exc is not exc_val
            except:
                # 如果生成器内 raise 了一个不同的异常
                # __exit__ 不应捕获生成器内部未处理的异常
                raise
            else:
                # 如果 throw 没有抛出异常（即生成器内部捕获了异常并继续执行到另一个 yield 或结束）
                raise RuntimeError("生成器 yield 了多次")
```

**真实 contextlib.contextmanager 的关键步骤**：

1. **构造时**：`_GeneratorContextManager.__init__` 调用生成器函数创建生成器对象
2. **__enter__**: 调用 `next(self.gen)`，执行到 `yield`，`yield` 的值作为 `__enter__` 返回值
3. **正常 __exit__**: 调用 `next(self.gen)`，让生成器从 `yield` 处继续执行 `finally` 块
4. **异常 __exit__**: 调用 `self.gen.throw(exc_type, exc_val, exc_tb)`，将异常注入到生成器的 `yield` 表达式中

**关键区别：生成器内的 try-finally 保证清理**：

```python
# 演示 throw 和 close 的行为
def demo_generator():
    print("  [生成器] 开始")
    try:
        value = yield "enter_value"
        print(f"  [生成器] 从 yield 恢复，收到值: {value}")
    except GeneratorExit:
        print("  [生成器] 收到 GeneratorExit（close 被调用）")
        raise
    except Exception as e:
        print(f"  [生成器] 收到异常: {type(e).__name__}: {e}")
    finally:
        print("  [生成器] finally 块执行（保证清理）")


print("--- 场景 1：正常执行 ---")
gen = demo_generator()
enter_val = next(gen)
print(f"  外部: __enter__ 得到: {enter_val}")
try:
    next(gen)  # 相当于 __exit__(None, None, None)
except StopIteration:
    print("  外部: 生成器正常结束")

print()
print("--- 场景 2：异常注入 ---")
gen = demo_generator()
next(gen)  # 执行到 yield
print("  外部: 注入 ValueError")
try:
    gen.throw(ValueError, "测试错误")
except StopIteration:
    print("  外部: 生成器结束（异常被生成器内部处理并到达 finally）")
```

运行结果：

```
--- 场景 1：正常执行 ---
  [生成器] 开始
  外部: __enter__ 得到: enter_value
  [生成器] 从 yield 恢复，收到值: None
  [生成器] finally 块执行（保证清理）
  外部: 生成器正常结束

--- 场景 2：异常注入 ---
  [生成器] 开始
  外部: 注入 ValueError
  [生成器] 收到异常: ValueError: 测试错误
  [生成器] finally 块执行（保证清理）
  外部: 生成器结束（异常被生成器内部处理并到达 finally）
```

**@contextmanager 中抑制异常的机制**：

当生成器内部的 `try-except` 捕获了注入的异常且不重新抛出时，`gen.throw()` 不会引发异常（或者引发 `StopIteration`），`_GeneratorContextManager.__exit__` 据此知道异常被抑制了，并返回 `True`。

```python
# 展示 @contextmanager 如何抑制异常

@contextmanager
def suppress_value_error():
    print("  [CM] 进入")
    try:
        yield "value"
    except ValueError:
        print("  [CM] 捕捉到 ValueError 并抑制")
        # 不重新抛出 → 异常被抑制
    finally:
        print("  [CM] 清理")


print("--- @contextmanager 抑制异常 ---")
with suppress_value_error() as val:
    print(f"  获取到: {val}")
    raise ValueError("被抑制的错误")

print("  异常被抑制，程序继续")
```

运行结果：

```
--- @contextmanager 抑制异常 ---
  [CM] 进入
  获取到: value
  [CM] 捕捉到 ValueError 并抑制
  [CM] 清理
  异常被抑制，程序继续
```

### 4.4 @asynccontextmanager 的原理

`@asynccontextmanager` 与 `@contextmanager` 的原理类似，但它操作的是异步生成器（`async def` + `yield`），`__enter__` 对应为 `__aenter__`，调用 `anext()` 替代 `next()`，`throw()` 对应为 `athrow()`，`close()` 对应为 `aclose()`。

```python
# asynccontextmanager 的简化实现
class _AsyncGeneratorContextManager:
    def __init__(self, func, args, kwds):
        self.agen = func(*args, **kwds)

    async def __aenter__(self):
        try:
            return await self.agen.__anext__()
        except StopAsyncIteration:
            raise RuntimeError("异步生成器没有 yield")

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_type is None:
            try:
                await self.agen.__anext__()
            except StopAsyncIteration:
                return False
            else:
                raise RuntimeError("异步生成器 yield 了多次")
        else:
            try:
                await self.agen.athrow(exc_type, exc_val, exc_tb)
            except StopAsyncIteration as exc:
                return exc is not exc_val
            else:
                raise RuntimeError("异步生成器 yield 了多次")
```

```python
import asyncio


# 改为普通生成器并模拟异步行为
class FakeAsyncContextManager:
    """手动模拟 @asynccontextmanager 行为的同步版本"""

    def __init__(self, func, *args, **kwargs):
        self.generator = func(*args, **kwargs)

    def __enter__(self):
        try:
            return next(self.generator)
        except StopIteration:
            raise RuntimeError("生成器没有 yield")

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is None:
            try:
                next(self.generator)
                return False
            except StopIteration:
                return False
            except RuntimeError:
                raise
        else:
            try:
                self.generator.throw(exc_type, exc_val, exc_tb)
            except StopIteration:
                return False
            except Exception as e:
                if e is exc_val:
                    return False
                return True


def fake_context(func):
    def wrapper(*args, **kwargs):
        return FakeAsyncContextManager(func, *args, **kwargs)
    return wrapper


@fake_context
def my_fake_cm():
    print("  进入")
    try:
        yield "资源"
    finally:
        print("  退出")


with my_fake_cm() as val:
    print(f"  使用: {val}")
```

运行结果：

```
  进入
  使用: 资源
  退出
```

### 4.5 __enter__ 返回值与 as 子句的语义细节

`as` 子句绑定的变量，其生命周期由 `with` 块决定，但 Python 不提供块级作用域。实际上，`as` 子句创建的是一个普通变量，它在 `with` 块结束后仍然存在。

```python
# as 子句变量的生命周期
class DemoContext:
    def __enter__(self):
        print("  __enter__ 被调用")
        return 42  # 返回一个整数

    def __exit__(self, *args):
        print("  __exit__ 被调用")
        return False


with DemoContext() as result:
    print(f"  with 块内: result = {result}")

print(f"  离开 with 块后: result = {result}")
print(f"  类型仍是: {type(result).__name__}")
```

运行结果：

```
  __enter__ 被调用
  with 块内: result = 42
  __exit__ 被调用
  离开 with 块后: result = 42
  类型仍是: int
```

**as 子句的三种情况**：

```python
# 1. 没有 as 子句——__enter__ 返回值被丢弃
print("--- 无 as 子句 ---")
with DemoContext():
    print("  块内")

print()

# 2. 有 as 子句——__enter__ 返回值被绑定
print("--- 有 as 子句 ---")
with DemoContext() as result:
    print(f"  块内: {result}")

print()

# 3. 双重引用——变量在 with 块内外都可访问（但块外资源可能已关闭）
class FileOpener:
    def __init__(self, path):
        self.path = path

    def __enter__(self):
        self._file = open(self.path, "w", encoding="utf-8")
        return self._file

    def __exit__(self, *args):
        self._file.close()
        return False


with FileOpener("/tmp/as_test.txt") as f:
    f.write("测试内容")

# 变量 f 仍然可访问，文件已关闭
try:
    f.write("更多内容")  # 会失败
except ValueError as e:
    print(f"  文件已关闭: {e}")
```

运行结果：

```
--- 无 as 子句 ---
  __enter__ 被调用
  块内
  __exit__ 被调用

--- 有 as 子句 ---
  __enter__ 被调用
  块内: 42
  __exit__ 被调用

  文件已关闭: I/O operation on closed file.
```

### 4.6 with 语句的嵌套展开与作用域

当有多个 `with` 语句嵌套或使用逗号分隔时，CPython 会按如下方式展开：

```python
# 多上下文 with 的字节码等价展开（伪代码）
#
# with A() as a, B() as b:
#     BLOCK
#
# 等价于：

_manager_a = A()
_a_result = _manager_a.__enter__()
a = _a_result
_manager_b = B()
_b_result = _manager_b.__enter__()
b = _b_result
exc = True
try:
    BLOCK
except:
    exc = False
    if not _manager_b.__exit__(*sys.exc_info()):
        if not _manager_a.__exit__(*sys.exc_info()):
            raise
        else:
            # 如果 B.__exit__ 返回 False 但 A.__exit__ 返回 True
            # 异常被 A 抑制
            pass
    else:
        # 如果 B.__exit__ 返回 True，异常被抑制（不继续调用 A 的 __exit__？）
        # 实际上 B.__exit__ 返回 True 后，A.__exit__ 仍然会被调用（因为是在 finally 中）
        pass
finally:
    if exc:
        _manager_b.__exit__(None, None, None)
        _manager_a.__exit__(None, None, None)
```

上面的伪代码非常复杂，但 CPython 用异常处理表（`except table`）在字节码层面优雅地解决了这个问题。Python 3.11+ 使用了零开销异常处理表（zero-cost exception handling tables），`with` 的 `__exit__` 调用被编码在异常处理表中。

## 5. 总结

### 5.1 核心要点回顾

- **上下文管理器**：实现了 `__enter__` 和 `__exit__` 方法的对象，用于封装"获取-使用-释放"的资源管理流程。
- **with 语句**：上下文管理器的配套语法，确保即使在异常发生时也能正确清理资源。
- **__enter__**：进入上下文时调用，返回值通过 `as` 子句绑定给变量。
- **__exit__(exc_type, exc_val, exc_tb)**：退出上下文时调用，返回 `True` 抑制异常，返回 `False`/`None` 传播异常。
- **标准库上下文管理器**：`open()`、`threading.Lock`、`io.BytesIO/StringIO`、`subprocess.Popen` 等。
- **contextlib 模块**：
  - `@contextmanager`：用生成器定义上下文管理器的装饰器
  - `closing()`：包装 `close()` 方法为上下文管理器
  - `suppress()`：抑制指定异常的上下文管理器
  - `redirect_stdout/redirect_stderr`：重定向输出流
  - `nullcontext()`：空操作上下文管理器
  - `ExitStack`：动态管理多个上下文管理器
  - `AbstractContextManager`：上下文管理器的抽象基类
  - `@asynccontextmanager`：异步上下文管理器的装饰器
- **多上下文管理器**：`with A() as a, B() as b:` 等价于嵌套 `with`，退出顺序与进入顺序相反。
- **实现方式**：类实现（定义 `__enter__` 和 `__exit__`）或生成器实现（`@contextmanager` + yield）。
- **with 与 try-finally 的关系**：`with` 是资源管理上对 `try-finally` 的替代，其字节码层面等价于带异常处理的 `try-finally` 结构。

### 5.2 读完本文你应能掌握

1. 清楚说出上下文管理器协议的两个方法及其签名和语义。
2. 能编写类实现和生成器实现的自定义上下文管理器。
3. 能说明 `__exit__` 的三个参数在异常和正常情况下的含义。
4. 能解释 `__exit__` 返回 `True` 和 `False` 的区别及适用场景。
5. 能正确使用 `contextlib` 模块中的 8 个工具函数/类，并说明各自用途。
6. 能在多资源管理的场景中选择使用逗号分隔 with 或 `ExitStack`。
7. 能在编码中准确判断何时需要用 `with` 替代 `try-finally`。
8. 能说出 CPython 在字节码层面如何将 `with` 语句展开为异常处理逻辑。
9. 能理解 `@contextmanager` 的"生成器 → 上下文管理器"转换原理。
10. 能识别并避免 `__exit__` 中的常见陷阱（抑制不该抑制的异常、清理时抛出新异常导致信息丢失等）。