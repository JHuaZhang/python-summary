---
group:
  title: 【14】装饰器深度剖析
  order: 14
order: 5
title: 带参数装饰器
nav:
  title: Python
  order: 1
---

## 1. 介绍

### 1.1 什么是带参数装饰器

在前面的笔记中，我们已经熟悉了"无参装饰器"——那种直接写在被装饰函数上方的 `@decorator` 形式。无参装饰器本质上是一个接收函数、返回函数的高阶函数，两层嵌套就能搞定：外层接收 `func`，内层 `wrapper` 负责增强。

但在实际工程中，我们经常希望装饰器本身能"可配置"。比如一个日志装饰器，有时想用 `[INFO]` 前缀，有时想用 `[WARN]`；一个重试装饰器，有时重试 3 次，有时重试 5 次，还想控制每次重试之间的等待秒数。如果每换一组配置就复制一份装饰器代码，那就太笨了。这时候就需要**带参数装饰器**——装饰器自己也能接受参数，用来在被装饰函数之外，额外定制增强行为。

先看一个最直观的例子，建立感性认识：

```python
def log(prefix):
    def real_decorator(func):
        def wrapper(*args, **kwargs):
            print(f"{prefix} 调用 {func.__name__}")
            return func(*args, **kwargs)
        return wrapper
    return real_decorator

@log(prefix="[INFO]")
def greet(name):
    return f"hello, {name}"

print(greet("Alice"))
# 输出：
# [INFO] 调用 greet
# hello, Alice
```

注意 `@log(prefix="[INFO]")` 这一行的样子——装饰器名后面跟了括号、括号里还有参数。这和 `@log`（无参形式）在写法上只差一对括号，但在内部结构上却多了一层。理解"为什么多一对括号就多一层"，是掌握带参数装饰器的关键。

### 1.2 带参数装饰器的基本语法

带参数装饰器的标准写法是一个**三层嵌套结构**：

```python
def decorator(配置参数):
    def real_decorator(func):            # 真正的（无参）装饰器
        def wrapper(*args, **kwargs):    # 包装函数，负责增强
            ...                          # 调用前的增强逻辑
            result = func(*args, **kwargs)
            ...                          # 调用后的增强逻辑
            return result
        return wrapper
    return real_decorator
```

三层的职责划分非常清晰：

- **第一层 `decorator(配置参数)`**：这是一个"装饰器工厂"，它接收配置参数，返回一个真正的装饰器。
- **第二层 `real_decorator(func)`**：这才是我们熟悉的"无参装饰器"形态，它接收被装饰函数 `func`，返回包装函数 `wrapper`。
- **第三层 `wrapper(*args, **kwargs)`**：实际替代被装饰函数被调用的包装体，在这里执行增强逻辑并最终调用原始函数。

使用时，在函数上方写 `@decorator(参数)` 即可：

```python
@decorator(参数)
def some_function(...):
    ...
```

这个语法糖等价于 `some_function = decorator(参数)(some_function)`——先调用 `decorator(参数)` 得到真正的装饰器，再用这个装饰器去装饰 `some_function`。理解这一点至关重要，我们在第 4 章原理部分会详细展开。

### 1.3 与无参装饰器的对照

如果用一句话区分两者：无参装饰器是"两层"，带参装饰器是"三层"；多出来的一层，正是用来"先吃配置参数、再生成装饰器"的工厂层。

```python
# 无参装饰器：两层
def log_no_args(func):
    def wrapper(*args, **kwargs):
        print(f"调用 {func.__name__}")
        return func(*args, **kwargs)
    return wrapper

# 带参装饰器：三层
def log_with_args(prefix):
    def real_decorator(func):
        def wrapper(*args, **kwargs):
            print(f"{prefix} 调用 {func.__name__}")
            return func(*args, **kwargs)
        return wrapper
    return real_decorator
```

可以看到，带参版本的 `real_decorator` 函数体，和 `log_no_args` 的函数体几乎一模一样——都是"定义 `wrapper` 并返回它"。区别只在于带参版本在外面又套了一层 `log_with_args(prefix)`，这一层不做装饰，只负责把 `prefix` 这个配置"先存起来"。理解这种"无参装饰器 + 外壳"的关系，是写出带参装饰器的核心。

## 2. 核心内容

### 2.1 三层结构的完整骨架

在进入具体场景之前，我们先把带参数装饰器的标准骨架拆透。每一层的输入、输出、它"捕获"了什么，都要心中有数。

```python
import functools

def decorator(config_a, config_b):          # 第①层：装饰器工厂
    print(f"[工厂] 接收配置: {config_a}, {config_b}")

    def real_decorator(func):               # 第②层：真正的无参装饰器
        print(f"[装饰器] 接收函数: {func.__name__}")

        @functools.wraps(func)              # 保留原函数元信息
        def wrapper(*args, **kwargs):       # 第③层：包装函数
            print(f"[包装] 调用 {func.__name__}，参数={args} {kwargs}")
            print(f"[包装] 使用配置: {config_a}, {config_b}")
            result = func(*args, **kwargs)
            return result

        return wrapper

    return real_decorator


@decorator("A", "B")
def task(x, y):
    return x + y

print(task(3, 4))
```

运行这段代码，你能看到三个阶段分别在不同时机触发：

```text
[工厂] 接收配置: A, B
[装饰器] 接收函数: task
[包装] 调用 task，参数=(3, 4) {}
[包装] 使用配置: A, B
7
```

三个阶段的触发时机完全不同，这也是带参装饰器最容易被搞混的地方：

- **工厂执行时机**：在 `@decorator("A", "B")` 这行被"应用"到 `task` 定义上方时，立即执行一次。它把配置参数 `"A"`、`"B"` 吃进去，返回 `real_decorator`。
- **装饰器执行时机**：紧接工厂之后，Python 拿到 `real_decorator` 后立刻调用它并传入 `task`，得到 `wrapper`，把 `wrapper` 绑定回 `task` 这个名字。这一步也是定义时发生，同一时刻执行一次。
- **包装函数执行时机**：只有在 `task(3, 4)` 真正被调用时才执行。每次调用 `task` 都会进入 `wrapper`，配置参数和原函数在此时被一起使用。

把这三段时机记牢，后面看任何带参装饰器都不会迷路。

**三层各自捕获了什么**

带参装饰器的三层嵌套，每一层都通过闭包捕获了属于自己的变量：

- `wrapper` 捕获了外层的 `func`（被装饰函数）和更外层的 `config_a`、`config_b`（工厂的配置参数）。调用时，它同时用上这两批变量。
- `real_decorator` 本身的闭包捕获了 `config_a`、`config_b`。它定义 `wrapper` 时，`wrapper` 又捕获了它自身的参数 `func`。
- `decorator` 工厂本身不捕获什么——它被调用时配置参数就是它的形参，它把这些形参通过返回 `real_decorator` 的方式"留存"下来。

正是这种层层闭包捕获，让一个配置参数能"跨越"两层函数，最终在 `wrapper` 被调用时仍然可用。这是闭包的威力在装饰器场景下的集中体现。

### 2.2 可配置前缀的日志装饰器

日志装饰器是带参装饰器最经典的入门场景。无参版本的日志装饰器只能打印固定格式，一旦想要切换前缀就得改代码。带参版本把这个前缀变成一个参数，使用时按需传入即可。

**@log(prefix)**

文字说明：`@log(prefix)` 用于给被装饰函数增加"调用前打印一行前缀 + 函数名、调用后打印一行返回值"的增强逻辑。签名 `log(prefix="[INFO]")`——`prefix` 为日志行的前缀字符串，默认值 `[INFO]`，适合大多数通用日志场景；需要区分级别时传入 `"[WARN]"`、`"[ERROR]"` 等。它返回一个无参装饰器，再用该装饰器修饰被装饰函数。

```python
import functools

def log(prefix="[INFO]"):
    def real_decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            print(f"{prefix} 开始执行 {func.__name__}，参数={args} {kwargs}")
            result = func(*args, **kwargs)
            print(f"{prefix} 执行完毕 {func.__name__}，返回={result!r}")
            return result
        return wrapper
    return real_decorator


@log(prefix="[INFO]")
def fetch_user(user_id):
    return {"id": user_id, "name": "Alice"}

@log(prefix="[WARN]")
def check_disk(threshold=80):
    usage = 92
    return usage > threshold

print(fetch_user(1))
print(check_disk())
```

运行结果：

```text
[INFO] 开始执行 fetch_user，参数=(1,) {}
[INFO] 执行完毕 fetch_user，返回={'id': 1, 'name': 'Alice'}
{'id': 1, 'name': 'Alice'}
[WARN] 开始执行 check_disk，参数=() {}
[WARN] 执行完毕 check_user，返回=True
True
```

同一个 `log` 装饰器，因为传入不同的 `prefix`，被装饰的 `fetch_user` 和 `check_disk` 输出了不同前缀的日志。这就是"配置"的意义——装饰逻辑只有一份，配置参数在装饰时就被封存进闭包，调用时由 `wrapper` 取用。

**多参数版本**

配置参数当然可以不止一个。日志里除了前缀，我们还可能想控制是否打印参数、是否打印返回值：

```python
import functools

def log(prefix="[INFO]", show_args=True, show_return=False):
    def real_decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            msg = f"{prefix} {func.__name__}"
            if show_args:
                msg += f" args={args} kwargs={kwargs}"
            print(msg)
            result = func(*args, **kwargs)
            if show_return:
                print(f"{prefix} {func.__name__} return={result!r}")
            return result
        return wrapper
    return real_decorator


@log(prefix="[DEBUG]", show_args=True, show_return=True)
def compute(a, b):
    return a * b + 1

compute(10, 20)
# 输出：
# [DEBUG] compute args=(10, 20) kwargs={}
# [DEBUG] compute return=201

@log(prefix="[ERROR]", show_args=False, show_return=False)
def notify():
    print("发送告警邮件……")

notify()
# 输出：
# [ERROR] notify
# 发送告警邮件……
```

这里同一个 `log` 装饰器，通过不同参数组合，给 `compute` 打印了详细调试信息（参数+返回值），而给 `notify` 只打印了一行函数名。配置项越丰富，装饰器能适配的场景就越多，而核心增强逻辑只用维护一份。

### 2.3 可配置重试装饰器 @retry(times, delay)

重试是带参装饰器最实用的场景之一。网络请求、文件写入、数据库操作这类容易临时失败的操作，往往希望通过"失败后自动重试若干次"来提升成功率。重试次数、重试之间的延迟、对哪些异常重试，这些都是天然的"配置参数"。

**@retry(times, delay, exceptions)**

文字说明：`@retry(times=3, delay=1, exceptions=(Exception,))` 给被装饰函数增加"失败自动重试"能力。签名 `retry(times=3, delay=0, exceptions=(Exception,))`——`times` 为最大尝试次数（含首次调用），`delay` 为每次重试前等待的秒数，`exceptions` 为需要捕获并重试的异常类型元组。`times=3` 意味着原始调用最多执行 3 次；若 3 次都失败则抛出最后一次的异常。`exceptions` 只对指定类型的异常重试，其他异常立即向上抛出，避免盲目重试不可恢复的错误。

先看一个最小实现，只有 `times` 一个参数：

```python
import functools

def retry(times=3):
    def real_decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            attempt = 0
            while attempt < times:
                attempt += 1
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    print(f"  第 {attempt}/{times} 次调用 {func.__name__} 失败：{e}")
                    if attempt >= times:
                        raise
        return wrapper
    return real_decorator
```

现在引入 `delay` 和 `exceptions`，让它更贴近真实工程：

```python
import functools
import time

def retry(times=3, delay=0.5, exceptions=(Exception,)):
    def real_decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            last_exc = None
            for attempt in range(1, times + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exc = e
                    print(f"  [{func.__name__}] 第 {attempt}/{times} 次失败：{type(e).__name__}: {e}")
                    if attempt < times:
                        print(f"  [{func.__name__}] 等待 {delay}s 后重试……")
                        time.sleep(delay)
            raise last_exc
        return wrapper
    return real_decorator
```

用一个会"时好时坏"的模拟网络请求来测试：

```python
import random

call_count = 0

@retry(times=4, delay=0.1, exceptions=(ConnectionError, TimeoutError))
def fetch_data(url):
    global call_count
    call_count += 1
    print(f"  第 {call_count} 次真正调用 fetch_data({url})")
    # 模拟随机失败：前几次抛连接错误
    if call_count < 3:
        raise ConnectionError("连接被拒")
    return f"<数据来自 {url}>"

data = fetch_data("https://api.example.com/users")
print("最终拿到：", data)
```

运行结果（每次因随机数可能不同，但此处 `call_count < 3` 前必定失败）：

```text
  第 1 次真正调用 fetch_data(https://api.example.com/users)
  [fetch_data] 第 1/4 次失败：ConnectionError: 连接被拒
  [fetch_data] 等待 0.1s 后重试……
  第 2 次真正调用 fetch_data(https://api.example.com/users)
  [fetch_data] 第 2/4 次失败：ConnectionError: 连接被拒
  [fetch_data] 等待 0.1s 后重试……
  第 3 次真正调用 fetch_data(https://api.example.com/users)
最终拿到： <数据来自 https://api.example.com/users>
```

这个例子里，`times=4`、`delay=0.1`、`exceptions=(ConnectionError, TimeoutError)` 三个配置在装饰时就被封进闭包。`wrapper` 被调用时按这些配置行动——最多尝试 4 次、每次间隔 0.1 秒、只对连接类异常重试。如果想让另一个函数重试 5 次、间隔 2 秒、对所有 `Exception` 重试，只要再写一行 `@retry(times=5, delay=2)` 即可，装饰逻辑本身一行不改。

**只对指定异常重试**

注意 `except exceptions as e` 这行的写法——这里 `exceptions` 是一个元组，`except` 语句天然支持元组形式的异常类型列表。这意味着我们可以精细控制"哪些错才重试"：

```python
@retry(times=5, delay=1, exceptions=(ConnectionError,))
def call_api():
    ...

@retry(times=3, delay=0, exceptions=(KeyError, ValueError))
def parse_input():
    ...
```

上面第一个装饰器只对 `ConnectionError` 重试——如果是 `PermissionError` 这种"权限不够"的问题，重试再多也没意义，应该立刻抛出让人去查权限；第二个装饰器则只对输入解析类异常重试，遇到其他错误立即向上传递。合理设置 `exceptions`，能避免把装饰器变成"无脑重试所有错误"的反模式。

### 2.4 可配置超时装饰器 @timeout(seconds)

超时控制是另一个常见需求。某些耗时不可预测的操作（爬虫抓取、慢查询、第三方 API），我们希望给它设个上限——超过这个时间还没返回，就强制中止并抛出超时异常。

**@timeout(seconds)**

文字说明：`@timeout(seconds=5)` 限制被装饰函数的最大执行时长。签名 `timeout(seconds)`——`seconds` 为允许的最长秒数。由于 Python 的 GIL 限制，跨线程直接"杀死"一个正在执行 Python 字节码的线程并不安全，因此常见做法是把被装饰函数放到子线程中执行，主线程等待 `seconds` 秒，若超时则抛出 `TimeoutError`。

下面是一个基于 `threading` 的简化实现，足以展示带参装饰器的写法：

```python
import functools
import threading

class TimeoutError(Exception):
    pass

def timeout(seconds):
    def real_decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            result_container = {}

            def worker():
                try:
                    result_container["value"] = func(*args, **kwargs)
                except Exception as e:
                    result_container["error"] = e

            t = threading.Thread(target=worker, daemon=True)
            t.start()
            t.join(timeout=seconds)

            if t.is_alive():
                raise TimeoutError(f"{func.__name__} 超过 {seconds}s 仍未返回")
            if "error" in result_container:
                raise result_container["error"]
            return result_container.get("value", None)
        return wrapper
    return real_decorator


@timeout(seconds=2)
def quick_task():
    import time
    time.sleep(0.3)
    return "快速完成"

@timeout(seconds=1)
def slow_task():
    import time
    time.sleep(5)
    return "永远不会到达"

print(quick_task())
# 输出：快速完成

try:
    slow_task()
except TimeoutError as e:
    print("捕获到：", e)
# 输出：捕获到： slow_task 超过 1s 仍未返回
```

同一个 `timeout` 装饰器，`quick_task` 给了 2 秒额度、`slow_task` 给了 1 秒额度——各自的 `seconds` 在装饰时进入闭包，互不干扰，调用时由 `wrapper` 据此等待。

需要说明的是，上面这个基于线程的实现并不能真正中断 `func` 的执行——超时后子线程仍在后台跑（因为是 `daemon` 线程，主进程退出时会一起结束）。在真实工程中，更严格的超时通常用进程级方案（`multiprocessing` + 进程终止）、信号（Unix 下的 `signal.alarm`）或异步框架（`asyncio.wait_for`）实现。但装饰器的"三层嵌套 + 配置参数"结构是一样的——理解了三层结构，再替换底层超时机制就不难。

### 2.5 路由注册模式 @app.route(path)

Web 框架里的路由注册，是带参装饰器最经典的非增强型用例。前面几个例子都是"用 `wrapper` 替代原函数、在 `wrapper` 里做额外的事"，但路由装饰器不替换原函数——它只是把"某个 URL 路径"和"某个处理函数"的映射记录下来，原函数该怎么用还怎么用。

**@app.route(path)**

文字说明：`@app.route("/path")` 把被装饰的函数注册为某个 URL 路径的处理函数。它典型的结构是方法调用——`app` 是某个应用对象，`app.route("/path")` 调用 `app.route` 方法、传入路径字符串、返回一个真正的装饰器。装饰器把映射关系写入 `app` 的路由表后，直接返回原函数（而非 `wrapper`），因此被装饰函数本身不变，只是"被注册"了。

先模拟一个微型 Web 框架：

```python
class MiniApp:
    def __init__(self):
        self.routes = {}            # 路径 → 处理函数 的映射

    def route(self, path):
        def real_decorator(func):
            self.routes[path] = func   # 注册路由：把函数和路径绑定
            return func                # 直接返回原函数，不替换
        return real_decorator

    def dispatch(self, path):
        handler = self.routes.get(path)
        if handler is None:
            return 404, "Not Found"
        return 200, handler()


app = MiniApp()

@app.route("/api/users")
def list_users():
    return "[Alice, Bob, Carol]"

@app.route("/api/health")
def health_check():
    return "OK"

@app.route("/")
def index():
    return "Welcome to MiniApp"
```

测试一下：

```python
for path in ["/", "/api/users", "/api/health", "/no-such-path"]:
    status, body = app.dispatch(path)
    print(f"{path:20s} -> {status} {body}")
# 输出：
# /                    -> 200 Welcome to MiniApp
# /api/users           -> 200 [Alice, Bob, Carol]
# /api/health          -> 200 OK
# /no-such-path        -> 404 Not Found
```

这个例子里 `real_decorator` 的特点在于**不返回 `wrapper`**，而是返回 `func` 自身——路由装饰器的目的不是改造函数，而是"借装饰时机把函数登记进路由表"。配置参数 `path` 通过最外层 `route(self, path)` 进入闭包，`real_decorator` 在装饰发生的那一刻把 `(path, func)` 写入 `self.routes`。这种"注册式装饰器"在 Web 框架（Flask、FastAPI、Bottle）、命令行工具（Click、argparse 封装）、插件系统中非常常见。

**真实 Flask 风格的增强版**

真实框架的路由装饰器还会支持 methods 等额外参数，借此把同一个路径的不同 HTTP 方法映射到不同函数：

```python
class FlaskLikeApp:
    def __init__(self):
        # 路径 + 方法 → 处理函数
        self.routes = {}

    def route(self, path, methods=("GET",)):
        def real_decorator(func):
            for method in methods:
                self.routes[(path, method)] = func
            return func
        return real_decorator

    def dispatch(self, path, method):
        handler = self.routes.get((path, method))
        if handler is None:
            return 404, "Not Found"
        return 200, handler()


app = FlaskLikeApp()

@app.route("/api/users", methods=("GET",))
def get_users():
    return "获取用户列表"

@app.route("/api/users", methods=("POST",))
def create_users():
    return "创建新用户"

@app.route("/api/users", methods=("GET", "POST"))
def get_or_create_users():
    return "既能读也能写"

app2 = FlaskLikeApp()
get_or_create_users.__wrapped_reg__ = None  # 仅占位示意
# 因为同一个 path+method 不能注册两次，这里只演示可配置的 methods
```

`methods=("GET",)`、`methods=("POST",)`、`methods=("GET", "POST")` 都是把"这个函数响应哪些 HTTP 方法"作为配置，在装饰时通过闭包传进去。这些参数决定了 `wrapper`（这里是 `real_decorator`）如何把函数登记进路由表。

### 2.6 带参装饰器的叠加

装饰器可以叠加，带参装饰器自然也可以。多个带参装饰器叠加时，它们的执行顺序和叠加顺序的关系，遵循"从下往上装饰、从上往下调用"的通用规则。

```python
import functools

def log(prefix="[INFO]"):
    def real_decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            print(f"{prefix} 进入 {func.__name__}")
            result = func(*args, **kwargs)
            print(f"{prefix} 离开 {func.__name__}")
            return result
        return wrapper
    return real_decorator

def repeat(times=2):
    def real_decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            result = None
            for i in range(times):
                print(f"  [repeat] 第 {i+1}/{times} 次")
                result = func(*args, **kwargs)
            return result
        return wrapper
    return real_decorator


@log(prefix="[A]")
@repeat(times=3)
def work():
    print("    执行 work")

work()
```

运行结果：

```text
[A] 进入 work
  [repeat] 第 1/3 次
    执行 work
  [repeat] 第 2/3 次
    执行 work
  [repeat] 第 3/3 次
    执行 work
[A] 离开 work
```

为什么是这个顺序？因为 `@log(prefix="[A]")` 在上、`@repeat(times=3)` 在下，叠加顺序意味着：

```python
work = log(prefix="[A]")(repeat(times=3)(work))
```

`repeat(times=3)(work)` 先执行，把 `work` 包成一个"重复 3 次的 wrapper"；然后 `log(prefix="[A]")(这个wrapper)` 再包一层，套上日志。所以从外到内的嵌套是 `log_wrapper → repeat_wrapper → 原始 work`，调用 `work()` 时自然先打印日志的"进入"、再走进 repeat 的 3 次循环、每次循环内部调用原始 `work`、循环结束后再打日志的"离开"。

如果交换两个装饰器的顺序：

```python
@repeat(times=3)
@log(prefix="[A]")
def work2():
    print("    执行 work")

work2()
```

结果变成：

```text
  [repeat] 第 1/3 次
[A] 进入 work2
    执行 work2
[A] 离开 work2
  [repeat] 第 2/3 次
[A] 进入 work2
    执行 work2
[A] 离开 work2
  [repeat] 第 3/3 次
[A] 进入 work2
    执行 work2
[A] 离开 work2
```

这时 `log` 在内、`repeat` 在外，`repeat` 包的是"带日志的 work2"，所以整个"进入→执行→离开"被重复了 3 遍。叠加顺序直接决定谁在内、谁在外，最终调用链的结构完全不同——这一点对带参装饰器和无参装饰器都一样。

### 2.7 带参装饰器的参数形式

带参装饰器的参数形式可以很灵活，涵盖了"位置参数""关键字参数""默认值""不定长参数"等所有普通函数能用的形式。

**默认值与关键字调用**

```python
def banner(symbol="=", width=40):
    def real_decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            print(symbol * width)
            result = func(*args, **kwargs)
            print(symbol * width)
            return result
        return wrapper
    return real_decorator


@banner()                      # 用默认值，但括号不能省
def hello():
    print("hello")

@banner(symbol="-", width=30)  # 关键字参数覆盖默认值
def hi():
    print("hi")

hello()
# 输出：
# ========================================
# hello
# ========================================
hi()
# 输出：
# ------------------------------
# hi
# ------------------------------
```

注意 `@banner()` 后面这对空括号是必须的——因为 `banner` 本身是"接收配置参数、返回装饰器"的工厂，必须调用它才能真正得到装饰器。如果写成 `@banner`（无括号），Python 会把被装饰函数 `hello` 当作 `symbol` 参数传给 `banner`，后续逻辑全乱。

**不定长配置参数**

装饰器工厂也能接收 `*config_args, **config_kwargs`，把所有配置打包：

```python
import functools

def tag(*tags, sep=", "):
    def real_decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            result = func(*args, **kwargs)
            return f"<{sep.join(tags)}>{result}</{sep.join(tags)}>"
        return wrapper
    return real_decorator


@tag("section", "highlight", sep="|")
def content():
    return "重要内容"

print(content())
# 输出：<section|highlight>重要内容</section|highlight>
```

`tags` 是不定长位置参数，`sep` 是关键字参数。这种写法让一个装饰器支持的配置"形状"非常灵活——可以传一个标签、多个标签、自定义分隔符，等等。

### 2.8 带 functools.wraps 的必要性

前面所有例子中，`wrapper` 上面都加了 `@functools.wraps(func)`。这一点对带参装饰器和无参装饰器同样重要，但带参场景下更容易被忽略——因为三层嵌套的注意力都在"怎么把配置传进去"上，很容易忘记给最内层的 `wrapper` 加 `wraps`。

不加 `wraps` 会怎样？看一个反例：

```python
def log_no_wraps(prefix="[INFO]"):
    def real_decorator(func):
        def wrapper(*args, **kwargs):
            print(f"{prefix} {func.__name__}")
            return func(*args, **kwargs)
        return wrapper          # 没加 functools.wraps
    return real_decorator


@log_no_wraps(prefix="[X]")
def my_func():
    """这是 my_func 的文档"""
    return 42

print(my_func.__name__)      # 输出：wrapper     ← 名字丢了
print(my_func.__doc__)       # 输出：None       ← 文档丢了
print(my_func.__wrapped__)   # 可能抛 AttributeError
```

`my_func` 实际上是 `wrapper`，所以 `__name__` 是 `wrapper`，`__doc__` 是 `wrapper` 的文档（为空）。如果一个模块里有十几二十个函数都用这个装饰器，调试时 `help()` 看到的全是 `wrapper`，会非常混乱。

加上 `wraps` 后：

```python
import functools

def log_with_wraps(prefix="[INFO]"):
    def real_decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            print(f"{prefix} {func.__name__}")
            return func(*args, **kwargs)
        return wrapper
    return real_decorator


@log_with_wraps(prefix="[X]")
def my_func():
    """这是 my_func 的文档"""
    return 42

print(my_func.__name__)      # 输出：my_func
print(my_func.__doc__)       # 输出：这是 my_func 的文档
print(my_func.__wrapped__)   # 输出：<function my_func at 0x...>（可访问原始函数）
```

`functools.wraps(func)` 把 `func` 的 `__name__`、`__doc__`、`__module__`、`__qualname__` 等属性复制到 `wrapper`，并设置 `__wrapped__` 指向原始 `func`。这对带参装饰器尤其重要——配置越灵活、装饰器被用得越广，"原函数信息是否被保留"对调试和反射的影响就越大。

## 3. 最佳实践

带参装饰器在工程里常用，也常被写错。下面这些注意点，每一条都对应着真实踩坑经验。

**配置参数一定要有默认值**

装饰器工厂调用处（`@retry(times=3)` 那一行）写起来越简洁越好。推荐给所有配置参数都设默认值，让用户在"最常见场景"下能直接 `@retry()` 或 `@log` 的扩展形式下零参数使用：

```python
# 推荐：默认值齐全，常见场景零参数
@retry()
def fetch(): ...

# 不推荐：没有默认值，每次都要补全参数
@retry(times, delay, exceptions)
def fetch(): ...
```

但注意：**带参装饰器即使全用默认值，括号也不能省。**`@retry` 和 `@retry()` 是两种东西——前者把 `func` 当作 `times` 传入，完全错位；后者正确调用工厂返回真正的装饰器。如果你希望"既支持 `@retry` 又支持 `@retry(times=3)`"，需要额外写"参数自适应"逻辑（见下文 3.x 节），但对大多数场景来说，统一要求带括号是最简单清晰的约定。

**不可变的配置参数优先**

由于配置参数会被闭包长期持有，它若可变并被意外修改，会导致跨调用之间的隐式状态泄漏：

```python
# 不推荐：配置是可变默认值
def log_bad(prefix_tags=[]):
    def real_decorator(func):
        def wrapper(*args, **kwargs):
            prefix_tags.append(func.__name__)    # 副作用：修改了共享列表
            print(prefix_tags)
            return func(*args, **kwargs)
        return wrapper
    return real_decorator

# 推荐：配置为不可变值（字符串、数字、元组）
def log_good(prefix="[INFO]"):
    ...
```

如果确实需要传可变配置（比如一个"累加日志"的列表），应当让用户自己显式传入并文档化其副作用，避免用可变对象做默认值——这和普通函数的可变默认参数陷阱是同一类问题。

**`exceptions` 元组要显式传入**

重试装饰器里，`exceptions` 默认值不要设成 `BaseException`——这会把 `KeyboardInterrupt`、`SystemExit` 也吞掉，让用户连 Ctrl+C 都停不下来。默认 `Exception` 是合理的，但要文档说明："只对指定异常重试，其他异常立即抛出"。生产场景更需要显式列出可重试的异常类型（网络错误、超时），而不是无脑重试。

**`wrapper` 一定要加 `wraps`**

三层嵌套中，注意力容易全都放在"怎么把配置传到 `wrapper`"上，结果忘了最内层那行 `@functools.wraps(func)`。无论装饰器带不带参数，`wrapper` 必须保留原函数的元信息。养成模板习惯：写 `def wrapper` 上一行永远先加 `@functools.wraps(func)`。

**避免在装饰器工厂里做重活**

装饰器工厂函数（最外层）只在"定义时"执行一次，它是"生成装饰器"的地方，不是"做业务"的地方。不要在工厂里做耗时操作（如读文件、连数据库）——那些应该放在 `wrapper` 里，让每次调用时按需执行。工厂里只做"保存配置、返回装饰器"这一件事。

**推荐写法 vs 不推荐写法**

```python
# 推荐：工厂只接收配置，wrapper 里做增强
def retry(times=3, delay=0.5, exceptions=(Exception,)):
    def real_decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(1, times + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    if attempt >= times:
                        raise
                    time.sleep(delay)
        return wrapper
    return real_decorator

# 不推荐：在工厂里执行耗时初始化，每次装饰都白跑一次
def retry_bad(times=3):
    db = connect_database()          # 装饰时就连数据库，太早且没必要
    def real_decorator(func):
        ...
    return real_decorator
```

**参数自适应的情形**

如果希望装饰器既能 `@retry` 也能 `@retry(times=3)`，可以让工厂判断第一个参数是不是函数对象：

```python
import functools

def smart_retry(func=None, *, times=3, delay=0.5):
    def real_decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            for attempt in range(1, times + 1):
                try:
                    return fn(*args, **kwargs)
                except Exception:
                    if attempt >= times:
                        raise
                    import time; time.sleep(delay)
        return wrapper

    if func is None:
        return real_decorator          # @smart_retry(times=3)
    return real_decorator(func)        # @smart_retry（无括号）
```

这种写法兼顾两种调用形式，但增加了实现复杂度，只在确实需要"两种用法并存"时才用。多数项目选其中一种统一约定即可。

**配置参数与被装饰函数的职责边界**

配置参数是"装饰器级行为"的配置（前缀、重试次数、超时秒数），不要把"单次调用才该有的数据"塞进装饰器参数。比如下面这种把 `user_id` 当装饰器参数的反模式：

```python
# 不推荐：把单次调用的数据放装饰器参数
@log(user_id=1001)
def fetch(): ...

# 推荐：user_id 是调用时才需要的数据，应该作为函数参数
@log(prefix="[INFO]")
def fetch(user_id): ...

fetch(1001)
```

判断标准：如果这个值在任何一次调用里都可能不同，它就该是函数参数，而不是装饰器配置。

## 4. 原理

这一章是带参装饰器的"机理说明书"。理解了这里的每一步，你就能在脑子里把任何带参装饰器一行行展开、推理出它何时执行、捕获了什么。

### 4.1 语法糖展开：decorator(args)(func) 的两次调用

带参装饰器最根本的原理，藏在一个语法糖展开里。当我们写：

```python
@decorator(args)
def func():
    ...
```

Python 并没有直接"调用 `decorator` 一次并传入 `func`"，而是分两步：

```python
func = decorator(args)(func)
```

也就是说，这一行等价于两次连续调用——

1. 先调用 `decorator(args)`，得到一个"真正的装饰器"（记为 `real_decorator`）。
2. 再用 `real_decorator(func)` 装饰被装饰函数，得到的 `wrapper` 绑定回 `func` 这个名字。

关键点是：`decorator(args)` 先被求值。正因为 `@decorator(args)` 中括号里那对参数的存在，Python 会"先求值括号里的调用"、再"装饰下面的函数"。如果没有括号（无参形式 `@decorator`），Python 就直接把下面的函数作为唯一参数传给 `decorator`，于是 `decorator` 就是装饰器本身，只需要两层嵌套。

这对括号是否带括号，在语法上是"两套完全不同的展开规则"：

| 写法 | 展开 | 层数 |
|------|------|------|
| `@decorator` | `func = decorator(func)` | 2 层（无参装饰器） |
| `@decorator(args)` | `func = decorator(args)(func)` | 3 层（带参装饰器） |

理解这张对照表，带参装饰器就不神秘了——它只是因为多了一对括号、多了一次"先求值工厂"的调用，所以才需要在外层多套一层函数来"接住"那些配置参数。

### 4.2 三层各自做什么

把 `@decorator(args)` 展开成 `decorator(args)(func)` 后，三层函数的职责就一目了然：

**第①层：装饰器工厂 decorator(args)**

它接收的是"配置参数"——用于定制增强行为的那些值（前缀、次数、秒数、路径）。它的函数体里**不接触 `func`**，只做两件事：定义 `real_decorator`、把配置参数通过闭包"留存"给它，然后返回 `real_decorator`。

```python
def decorator(prefix):
    # 这一层只能拿到 prefix，拿不到 func
    def real_decorator(func):
        ...
    return real_decorator
```

工厂执行时机：**装饰器应用到函数上方的那一刻**，即 `@decorator(args)` 这行被解释器处理时。它只执行一次。工厂的返回值 `real_decorator` 被立刻用于装饰 `func`。

**第②层：真正的装饰器 real_decorator(func)**

这是展开后第二次调用（`decorator(args)(func)` 的后半段）真正触发的函数。它接收的是"被装饰函数 `func`"，本质就是我们已经熟悉的无参装饰器。它的函数体定义 `wrapper` 并返回它。由于它定义在工厂内部，它能访问工厂的配置参数（闭包捕获）。

```python
def real_decorator(func):
    # 这里既能拿到 func，又能拿到外层的配置参数
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        ...
    return wrapper
```

`real_decorator` 执行时机：紧接工厂之后、把 `func` 装饰进去的那一刻，也是定义时执行一次。它返回的 `wrapper` 会被绑定回原函数名。

**第③层：包装函数 wrapper(*args, **kwargs)**

实际替代原函数被调用的对象。它同时捕获了两批变量——

- 外层 `real_decorator` 的形参 `func`（被装饰函数本身）
- 更外层 `decorator` 的形参 `prefix`（配置参数）

每次原函数名被调用时，进入的都是 `wrapper`。它在这里做增强逻辑（打印日志、重试、超时控制），并通过 `func(*args, **kwargs)` 转发对原始函数的调用。

```python
def wrapper(*args, **kwargs):
    # 这里同时使用配置参数 prefix 和被装饰函数 func
    print(f"{prefix} 调用 {func.__name__}")
    return func(*args, **kwargs)
```

`wrapper` 执行时机：**原函数名被调用的那一刻**，可能执行多次（每次调用一次）。

### 4.3 闭包如何捕获配置参数

带参装饰器最精妙的地方在于：配置参数怎么从最外层"穿越"两层到达最内层的 `wrapper`？答案是闭包。

下面这段极简代码，专门用来观察闭包捕获：

```python
def decorator(prefix):
    def real_decorator(func):
        def wrapper(*args, **kwargs):
            return f"{prefix} -> {func(*args, **kwargs)}"
        return wrapper
    return real_decorator

@decorator("[INFO]")
def greet(name):
    return f"hello {name}"

print(greet("Alice"))   # 输出：[INFO] -> hello Alice
```

这段代码定义结束后、但还没调用 `greet` 时，内存里其实存在这样一组对象关系：

1. `decorator("[INFO]")` 已经执行完毕，产生了一个 `real_decorator` 函数对象，它的 `__closure__` 指向一个 cell，里面存着 `prefix = "[INFO]"`。即便 `decorator` 的栈帧已经销毁，`prefix` 仍存活。
2. `real_decorator(greet)` 也执行完毕，产生了一个 `wrapper` 函数对象，它的 `__closure__` 指向两个 cell：一个是 `func`（指向原始未被装饰的 `greet`），另一个是 `prefix`（同一个 cell，值仍是 `"[INFO]"`）。
3. `greet` 这个名字现在绑定到 `wrapper` 对象。原 `greet` 函数对象只被 `wrapper` 的闭包引用着。

所以当 `greet("Alice")` 被调用时，`wrapper` 从自己的 `__closure__` 里取出 `prefix = "[INFO]"`、`func`（原始 `greet`），执行 `f"{prefix} -> {func('Alice')}"`，返回 `[INFO] -> hello Alice`。

可以用 `__closure__` 亲手验证：

```python
print(greet.__name__)                         # wrapper（没加 wraps 的情况）
print(greet.__closure__)                      # 一个 cell 元组
print(greet.__closure__[0].cell_contents)     # 可能是 "[INFO]" 或 func
```

如果加了 `@functools.wraps(func)`，`greet.__name__` 会变成 `"greet"`，但 `greet` 仍然指向 `wrapper` 对象——`wraps` 只是复制属性，并没有改变"它是个 `wrapper`"的事实。

### 4.4 三层捕获什么：一张完整的关系图

把上面三层的"输入、输出、闭包捕获、执行时机"综合起来：

| 层 | 形参 | 返回值 | 闭包捕获来自上层 | 闭包捕获来自本层 | 执行时机 |
|----|------|--------|------------------|------------------|----------|
| ① 工厂 `decorator(args)` | 配置参数 | `real_decorator` | 无 | 定义 `real_decorator` | 装饰应用时，1 次 |
| ② 装饰器 `real_decorator(func)` | 被装饰函数 `func` | `wrapper` | ① 的 `args` | 定义 `wrapper` | 紧接①后，1 次 |
| ③ 包装 `wrapper(*a, **kw)` | 调用时的实参 | 增强后的返回值 | ① 的 `args`、② 的 `func` | 无 | 每次原函数名调用 |

这张表值得反复对照。带参装饰器写错的根因，几乎都是某一层的职责错位——比如把应该在 `wrapper` 里做的事放到了工厂里（导致只执行一次）、或把应该捕获到 `wrapper` 里的变量写在了错误的层、或漏了某一层导致把 `func` 传给了 `decorator(args)`。

### 4.5 与无参两层装饰器的结构对照

回到前面那张"是否带括号"的对照，这里把两种结构的代码骨架并排放，看清"多一层多了什么"：

```python
# 无参装饰器：两层
def decorator(func):              # 只接收 func
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        # 增强逻辑
        return func(*args, **kwargs)
    return wrapper

# 带参装饰器：三层
def decorator(prefix):            # ① 接收配置，返回真正的装饰器
    def real_decorator(func):     # ② 接收 func，返回 wrapper
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # 增强逻辑中可使用 prefix
            return func(*args, **kwargs)
        return wrapper
    return real_decorator
```

观察这两段代码：

- `real_decorator` 的函数体与无参 `decorator` 的函数体**结构完全一致**——都是"定义 `wrapper`、返回 `wrapper`"。
- 差异仅在最外层：带参版本在外面套了 `def decorator(prefix): ... return real_decorator` 这一层，用来"先吃配置、再吐装饰器"。
- `wrapper` 内部唯一的不同是：带参版本在 `wrapper` 内部可以引用外层的 `prefix`，无参版本没有这种跨层变量。

这让一个推导技巧成立：**任何无参装饰器都可以升级为带参装饰器**——只需把它"外面套一层工厂"、把它体内原本写死的常量变成工厂的参数。例如把无参 `log` 里写死的 `"[INFO]"` 改成参数 `prefix`：

```python
# 无参版本，前缀写死
def log(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        print(f"[INFO] {func.__name__}")
        return func(*args, **kwargs)
    return wrapper

# 升级为带参版本，前缀可配置
def log(prefix="[INFO]"):
    def real_decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            print(f"{prefix} {func.__name__}")   # 替换为变量
            return func(*args, **kwargs)
        return wrapper
    return real_decorator
```

这个"套外壳 + 变量化常量"的思路，是从无参装饰器平滑过渡到带参装饰器的最简单方法。

### 4.6 调用时机的三分

带参装饰器的三层函数，在时间轴上分散在三个完全不同的时刻：

1. **模块导入时/定义时**：工厂 `decorator(args)` 和装饰器 `real_decorator(func)` 依次执行，各一次。这一步"把装饰器造出来"、"把 `wrapper` 绑回原函数名"。
2. **模块导入后、调用前**：什么都不发生。`wrapper` 对象在内存里待命，`__closure__` 持着配置和原函数。
3. **运行时调用**：每次"原函数名(...)"的调用都进入 `wrapper`，`wrapper` 调用原始 `func` 转发请求。这一步可能执行很多次，也可能一次都不执行（如果该函数从未被调用）。

把这三步区分清楚能回答很多疑问。比如：

- "为什么我在 `decorator(args)` 里 `print`，但运行时没再打印？"因为工厂只在装饰时执行一次，不是每次调用都跑。
- "为什么改了配置参数，但被装饰函数的行为没变？"因为配置是在"装饰时"被冻结进闭包的，之后修改原变量不影响闭包里的 cell（除非显式重新装饰一次）。
- "为什么 `func.__name__` 在 `wrapper` 里是对的？"因为 `real_decorator(func)` 在装饰发生时把 `func` 捕获进 `wrapper` 的闭包，那个 `func` 指向原始函数，名字自然正确。

### 4.7 为什么 @decorator(args) 是"先求值再应用"

这一点容易被忽略：`@decorator(args)` 中的 `decorator(args)` 本质上是一个**表达式**，Python 会先对这个表达式求值、再用求值结果去装饰下面的函数。这意味着——

- `decorator(args)` 这部分可以替换成任何"求值结果为装饰器"的表达式。比如 `@get_decorator(mode)`、`@(decorator_a if cond else decorator_b)`（Python 3.9+ 允许带括号写在 `@` 后），甚至 `@decorator_factory.create(args)`。只要这个表达式的最终结果是一个"接收 `func`、返回 `wrapper`"的可调用对象，语法都成立。
- 路由模式 `@app.route("/path")` 的 `app.route("/path")` 也是先求值——它调用 `app` 对象的 `route` 方法、传入 `"/path"`，返回值就是一个真正的装饰器。整个 `route` 方法本身才是工厂，`app.route("/path")` 这个调用等价于"先生成装饰器"。
- "先求值"也解释了为什么 `@decorator()` 即使空括号也不是空操作——它确实是"显式调用一次工厂、返回真正的装饰器"。

### 4.8 用 functools.partial 实现带参装饰器的替代写法

除了"三层嵌套函数"，`functools.partial` 也能实现同样的效果——思路是把无参装饰器的一部分参数预先绑定，得到一个新的可调用对象作为工厂。

```python
import functools

# 基础形态：无参装饰器，但 prefix 作为关键字参数暴露出来
def log(func=None, *, prefix="[INFO]"):
    if func is None:
        # @log(prefix="[WARN]") 的情况：返回一个"已绑定 prefix"的装饰器
        return functools.partial(log, prefix=prefix)

    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        print(f"{prefix} {func.__name__}")
        return func(*args, **kwargs)
    return wrapper


@log(prefix="[INFO]")
def info_task():
    print("执行 info_task")

@log(prefix="[WARN]")
def warn_task():
    print("执行 warn_task")

info_task()
# 输出：
# [INFO] info_task
# 执行 info_task
warn_task()
# 输出：
# [WARN] warn_task
# 执行 warn_task
```

这里 `log(prefix="[WARN]")` 时 `func` 为 `None`，走 `return functools.partial(log, prefix="[WARN]")`——这个 `partial` 对象是一个"已经绑定好 `prefix`、还差一个 `func` 没传"的可调用对象，等价于三层结构里的 `real_decorator`。后续 Python 把被装饰函数传给这个 `partial` 对象，触发原本的 `log(func, prefix="[WARN]")`，进入"定义 `wrapper` 并返回"的分支。

`partial` 写法的好处是只写一层函数体（`log` 自身），结构更紧凑；但理解成本略高，需要熟悉 `partial` 的工作方式。工程中两种写法都常见，按团队习惯选择。

### 4.9 用类实现带参装饰器的替代写法

类也可以实现带参装饰器，逻辑更"对象化"：

- 工厂的职责由 `__init__` 承担——接收配置参数。
- 真正装饰器的职责由 `__call__` 承担——接收被装饰函数、返回 `wrapper`。

```python
import functools

class log:
    def __init__(self, prefix="[INFO]"):
        self.prefix = prefix          # 等价于工厂把配置存进闭包

    def __call__(self, func):          # 等价于 real_decorator(func)
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            print(f"{self.prefix} {func.__name__}")
            return func(*args, **kwargs)
        return wrapper


@log(prefix="[INFO]")
def task_a():
    print("执行 task_a")

@log(prefix="[WARN]")
def task_b():
    print("执行 task_b")

task_a()
# 输出：
# [INFO] task_a
# 执行 task_a
task_b()
# 输出：
# [WARN] task_b
# 执行 task_b
```

`@log(prefix="[INFO]")` 会先实例化 `log` 类（调用 `__init__` 存下 `prefix`），得到一个可调用对象（实例）；然后 Python 把被装饰函数传给这个实例，触发 `__call__` 方法，返回 `wrapper`。整个过程等价于三层函数结构，但用类的 `__init__`/`__call__` 两个方法分配职责。

这种写法的好处：状态可以显式存在 `self.prefix` 上，不必依赖闭包捕获；如果装饰器自身有复杂状态（计数器、限流窗口、连接池），用类比嵌套函数更清晰。代价是稍多几行样板代码。

### 4.10 三种写法的横向对照

把"三层嵌套函数""partial""类实现"三种写法放到一起，对比它们如何承担三层职责：

| 写法 | 对应①工厂 | 对应②装饰器 | 对应③wrapper |
|------|----------|------------|--------------|
| 三层嵌套 | `def d(args):` 返回 `real_decorator` | 内层 `def real_decorator(func):` 返回 `wrapper` | 最内层 `def wrapper(*a, **kw):` |
| `functools.partial` | `def d(func=None, *, args):` 的 `func=None` 分支返回 `partial` | `partial` 对象被调用，触发 `d(func, args=...)` | `def wrapper` 同上 |
| 类实现 | `__init__(self, args)` 存配置 | `__call__(self, func)` 返回 wrapper | `def wrapper` 同上 |

三种写法的核心都是**三个不同时机、三种不同输入输出**，只是用不同语言机制来分配这些职责。理解了三层的本质，换什么写法都不迷糊。

### 4.11 一个完整的"动手追踪"示例

最后用一个把每一步都打印出来的例子，把上述原理一次性串起来：

```python
import functools

def make_deco(tag):
    print(f"  [①工厂] 执行 make_deco(tag={tag!r})")
    def real_decorator(func):
        print(f"  [②装饰器] 执行 real_decorator(func={func.__name__})")
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            print(f"  [③包装] 调用 wrapper，使用 tag={tag!r}, func={func.__name__}")
            result = func(*args, **kwargs)
            print(f"  [③包装] {func.__name__} 返回 {result!r}")
            return f"<{tag}>{result}</{tag}>"
        return wrapper
    print(f"  [①工厂] 返回 real_decorator")
    return real_decorator


# —— 定义阶段 ——
print("=== 开始定义 task ===")

@make_deco(tag="em")
def task():
    print("    [原始] 执行 task")
    return "done"

print("=== 定义完成 ===")
print()

# —— 调用阶段 ——
print("=== 第一次调用 task() ===")
print("结果:", task())
print()
print("=== 第二次调用 task() ===")
print("结果:", task())
```

运行结果：

```text
=== 开始定义 task ===
  [①工厂] 执行 make_deco(tag='em')
  [①工厂] 返回 real_decorator
  [②装饰器] 执行 real_decorator(func=task)
=== 定义完成 ===

=== 第一次调用 task() ===
  [③包装] 调用 wrapper，使用 tag='em', func=task
    [原始] 执行 task
  [③包装] task 返回 'done'
结果: <em>done</em>

=== 第二次调用 task() ===
  [③包装] 调用 wrapper，使用 tag='em', func=task
    [原始] 执行 task
  [③包装] task 返回 'done'
结果: <em>done</em>
```

观察这段输出里几个标志性现象：

- ①工厂和②装饰器都只在"定义阶段"各执行一次，调用阶段完全不出现它们的打印。这印证了"工厂 + 装饰器是定义时跑的"。
- ③包装每次调用都打印一组，证明"`wrapper` 才是运行时反复执行的"。
- `wrapper` 能同时使用 `tag`（来自①）和 `func`（来自②），这正是闭包跨越两层的捕获效果。
- 最终 `task` 这个名字指向 `wrapper`，`task()` 实际执行的是 `wrapper()`，而原始 `task` 函数体通过 `func(*args, **kwargs)` 被间接调用一次。

把这个追踪例子在脑海里跑通，带参装饰器的内部运作就基本"看得见"了。

## 5. 总结

### 5.1 本文要点回顾

- 带参数装饰器是在无参装饰器（两层嵌套）外面再套一层"工厂"形成的，整体是三层嵌套结构：`def decorator(args): def real_decorator(func): def wrapper(*args, **kwargs): ...`。
- `@decorator(args)` 是 `decorator(args)(func)` 的语法糖——先调用 `decorator(args)` 得到真正的无参装饰器，再用它装饰 `func`。多一对括号，就多一次"先求值"的调用，也就多一层外壳。
- 三层各自承担不同职责、在不同时机执行：①工厂在装饰应用时执行一次接收配置参数；②装饰器紧接其后执行一次接收被装饰函数；③`wrapper` 在每次原函数被调用时执行，同时使用 ① 的配置和 ② 捕获的原函数。
- 配置参数和原函数通过闭包被 `wrapper` 跨层捕获，即使外层函数早已返回，这些变量仍存活在 `wrapper` 的 `__closure__` 中，让运行时调用能同时利用配置和原函数。
- 典型实现包括可配置前缀的日志装饰器 `@log(prefix="[INFO]")`、可配置重试 `@retry(times=3, delay=1, exceptions=...)`、可配置超时 `@timeout(seconds=5)`、路由注册 `@app.route("/path")` 等。这些例子展示了带参装饰器在"增强型"与"注册型"两类用途上的通用性。
- 带参装饰器也可以叠加，叠加顺序决定装饰器由外到内的嵌套层次，直接影响调用链结构。
- 除了三层嵌套函数，还可以用 `functools.partial` 或类（`__init__` 接配置、`__call__` 接函数）实现等价结构，三者只是用不同语言机制分配同一组职责。
- `wrapper` 必须加 `@functools.wraps(func)`，以保留原函数的元信息；这对带参装饰器和无参装饰器同等重要。

### 5.2 读完本文你应能掌握

- 能在不看模板的情况下，独立写出一个三层嵌套的带参装饰器，并清楚地标注每一层接收什么、返回什么、何时执行。
- 能把 `@decorator(args)` 一行精确展开为 `decorator(args)(func)`，并解释为什么需要两次调用、为什么因此多一层函数嵌套。
- 能写出至少四种典型带参装饰器：带前缀的日志装饰器、带重试次数和延迟的重试装饰器、带秒数限制的超时装饰器、带路径的路由注册装饰器，并说明各自配置参数如何在 `wrapper` 中被使用。
- 能判断装饰器叠加时内层外层关系，预测调用链的执行顺序和输出。
- 能在遇到"装饰器工厂"或"类装饰器"写法时，把它们与三层嵌套函数的结构对应起来，说出三层职责分别由哪个函数/方法承担。
- 能指出"参数必须带括号""`wrapper` 要加 `wraps`""避免可变默认参数""工厂里不写重逻辑"等常见坑，并给出推荐写法。
- 能用 `__closure__` 验证一个带参装饰器的 `wrapper` 确实捕获了配置参数和原函数，从底层机制上理解"配置参数如何穿越两层到达 `wrapper`"。