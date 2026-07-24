---
group:
  title: 【14】装饰器深度剖析
  order: 14
order: 2
title: 无参装饰器实现
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是无参装饰器

装饰器的本质在上一篇已经讲透：它是一个"接收函数、返回新函数"的函数，用 `@` 语法糖挂到目标函数上，让目标函数在被调用时实际执行的是装饰器返回的新函数。无参装饰器，就是装饰器本身不需要接收额外参数的那一类——它只接收"被装饰的那个函数"，不接收任何配置项。

换句话说，无参装饰器的签名是固定的：`def decorator(func): ...`。它的外层只有一个参数 `func`，就是被 `@` 装饰的那个函数对象。你不需要在 `@decorator(...)` 里写括号传参，直接 `@decorator` 即可。

这一篇聚焦"手写实战"。也就是说，读完之后你应该能不查资料、凭理解默写出最常用的几类无参装饰器：日志、计时、调用计数、重试、参数校验。这些是工程里出现频率最高的几类，掌握了它们，其他装饰器都是同一套结构换汤不换药。

无参装饰器是所有装饰器的根基。带参数装饰器是在它外面再套一层"参数接收层"；类装饰器是用 `__call__` 替换"两层函数"里的内层 wrapper。把无参装饰器的两层结构彻底吃透，后面那些变体就是顺水推舟。

### 1.2 标准结构与最小用法

无参装饰器的标准结构是"两层函数"：外层接收被装饰函数，内层（通常叫 `wrapper`）替换被装饰函数、在调用时执行增强逻辑。

```python
def decorator(func):          # 外层：接收被装饰函数
    def wrapper(*args, **kwargs):   # 内层：替换 func，透传参数
        # ...调用前增强逻辑...
        result = func(*args, **kwargs)  # 调用原函数，保存返回值
        # ...调用后增强逻辑...
        return result           # 返回原函数的返回值
    return wrapper              # 外层返回 wrapper，替换掉 func
```

这就是骨架，所有无参装饰器都长这样，区别只在 `...增强逻辑...` 那几行。下面用一个最简单的例子跑通它——给函数加一行"调用前打印"。

```python
def say_hello(func):
    def wrapper(*args, **kwargs):
        print(f"[hello] 即将调用 {func.__name__}")
        result = func(*args, **kwargs)
        return result
    return wrapper

@say_hello
def greet(name):
    return f"你好，{name}！"

print(greet("张三"))
# 输出：
# [hello] 即将调用 greet
# 你好，张三！
```

注意三个点：第一，`@say_hello` 等价于 `greet = say_hello(greet)`，执行后 `greet` 这个名字绑定的已经是 `wrapper`，不再是原始函数对象。第二，调用 `greet("张三")` 实际调的是 `wrapper("张三")`。第三，`wrapper` 内部又去调了原始的 `func`（也就是原始的 `greet`），把它的返回值原样返回出去。

这三点理解了，无参装饰器就理解了。下面进入核心内容，逐类手写实战。

## 2. 核心内容

### 2.1 外层与内层的职责划分

在动手写具体装饰器之前，先把两层函数每一层的职责彻底拆清楚，后面所有示例都遵循这个划分。

**外层 `decorator(func)` 的职责**

外层只做两件事：接收被装饰函数 `func`，定义并返回内层 `wrapper`。它不执行任何增强逻辑，也几乎不做参数校验。外层只在"装饰阶段"（即 `@decorator` 被解析时）执行一次。

```python
def decorator(func):
    # 这里不写增强逻辑，只定义 wrapper
    def wrapper(*args, **kwargs):
        ...
    return wrapper   # 必须 return，否则 @decorator 得到 None
```

一个常见错误是在外层直接写增强逻辑：

```python
# 错误：增强逻辑写在了外层，导致装饰时就执行了，且 wrapper 为 None
def wrong_log(func):
    print(f"调用 {func.__name__}")   # 装饰时就打印，而非调用时
    result = func()                   # 装饰时就调了原函数，参数也没法传
    def wrapper():
        return result
    return wrapper
```

这种写法的问题在于：增强逻辑会在"装饰阶段"（模块导入时）就执行，而不是"调用阶段"。正确的无参装饰器必须把增强逻辑放在 `wrapper` 内部，让它推迟到函数被调用时才执行。

**内层 `wrapper(*args, **kwargs)` 的职责**

内层是真正干活的地方。它的职责是：接收调用方传入的参数、执行增强逻辑、调用原函数、处理返回值。因为 `wrapper` 会替换掉 `func` 成为外界调用的入口，所以它的参数签名必须能兼容被装饰函数的任意签名——这正是 `*args, **kwargs` 透传的用意，后面原理章会详细展开。

```python
def wrapper(*args, **kwargs):
    # 1. 调用前增强（可选）
    # 2. 调用原函数，保存返回值
    result = func(*args, **kwargs)
    # 3. 调用后增强（可选）
    # 4. 返回原函数的返回值
    return result
```

这四步顺序是铁律。第二步必须保存返回值到变量，第四步必须把返回值 `return` 出去。如果你写了 `func(*args, **kwargs)` 却没保存没返回，被装饰函数的返回值就被吞掉了，这是新手最常踩的坑之一，后面会专门讲。

### 2.2 *args 与 **kwargs 透传

`wrapper` 的参数写成 `*args, **kwargs` 不是随便定的，是必须的。`*args` 收集所有位置参数为一个元组，`**kwargs` 收集所有关键字参数为一个字典。这样不管被装饰函数签名是 `f(a, b)`、`f(x, y, z=1)` 还是 `f()`，`wrapper` 都能原样接收、原样转发。

```python
def passthrough(func):
    def wrapper(*args, **kwargs):
        print(f"args = {args}, kwargs = {kwargs}")
        return func(*args, **kwargs)
    return wrapper

@passthrough
def add(a, b, c=0):
    return a + b + c

print(add(1, 2, c=3))
# 输出：
# args = (1, 2), kwargs = {'c': 3}
# 6

@passthrough
def greet(name, greeting="你好"):
    return f"{greeting}，{name}！"

print(greet("李四", greeting="嗨"))
# 输出：
# args = ('李四',), kwargs = {'greeting': '嗨'}
# 嗨，李四！
```

可以看到，`add(1, 2, c=3)` 的位置参数 `1, 2` 被 `args` 收成元组 `(1, 2)`，关键字参数 `c=3` 被 `kwargs` 收成字典 `{'c': 3}`。然后在 `func(*args, **kwargs)` 处进行"解包还原"：`*args` 把元组拆回位置参数，`**kwargs` 把字典拆回关键字参数，等价于 `func(1, 2, c=3)`。

**如果不透传会怎样**

如果 `wrapper` 写死参数签名，装饰器就只能用在一个固定签名的函数上，换一个函数就报错或丢失参数。

```python
# 只兼容单参数函数的装饰器，换了函数就出问题
def fragile(func):
    def wrapper(x):           # 写死单参数
        return func(x)
    return wrapper

@fragile
def square(x):
    return x * x

print(square(5))   # 输出：25，碰巧能用

@fragile
def power(base, exp):   # 双参数，wrapper 只传一个，exp 丢了
    return base ** exp

# power(2, 3) 会抛 TypeError: power() missing 1 required positional argument: 'exp'
```

所以除非你有意要限制被装饰函数的签名（比如写一个只给无参函数用的装饰器），否则 `wrapper` 一律写 `*args, **kwargs`，这是最安全、最通用的写法。

### 2.3 返回值处理：必须 return func(...)

`wrapper` 内部调用原函数后，一定要把返回值 `return` 出去。这一条看起来理所当然，但在写增强逻辑时很容易忘，尤其是当增强逻辑里有 `print`、写日志等"看起来像是函数主要任务"的操作时。

**正确写法**

```python
def double_result(func):
    def wrapper(*args, **kwargs):
        result = func(*args, **kwargs)
        return result * 2    # 增强后返回
    return wrapper

@double_result
def compute(x):
    return x + 10

print(compute(5))   # 输出：30
```

**错误写法一：忘了 return**

```python
def buggy(func):
    def wrapper(*args, **kwargs):
        func(*args, **kwargs)   # 调了，但没 return
        print("调用完毕")
    return wrapper

@buggy
def get_score(name):
    return 95

score = get_score("张三")
print(score)
# 输出：
# 调用完毕
# None
```

`get_score` 原本返回 `95`，但因为 `wrapper` 没有把 `func(...)` 的返回值 `return`，`wrapper` 默认返回 `None`，于是 `score` 就是 `None`。这种 bug 非常隐蔽，如果调用方拿 `score` 去做算术，直接 `TypeError`。

**错误写法二：return 了增强逻辑的值，没 return 原函数返回值**

```python
def mislead(func):
    def wrapper(*args, **kwargs):
        result = func(*args, **kwargs)
        print(f"日志：返回值是 {result}")
        return True    # 返回了固定值，原返回值丢了
    return wrapper

@mislead
def get_price(item):
    return 12.5

print(get_price("咖啡"))
# 输出：
# 日志：返回值是 12.5
# True
```

日志里能看到原返回值，但调用方拿到的却是 `True`。这种错误常出现在"只关心副作用、不关心返回值"的装饰器里，写的时候觉得"反正我就是加个日志"，顺手 `return` 了个状态值，就把被装饰函数的返回值覆盖了。

**推荐模式**

无论装饰器做什么增强，都用"先保存、后增强、最后 return 保存值"的三步法：

```python
def safe_decorator(func):
    def wrapper(*args, **kwargs):
        # 调用前增强
        result = func(*args, **kwargs)   # 保存返回值
        # 调用后增强（不碰 result 的值，或基于 result 做变换后再赋值）
        return result                    # 最后一定 return
    return wrapper
```

### 2.4 实战一：日志装饰器

日志装饰器是无参装饰器最经典的用例。目标：在函数被调用时打印调用信息（函数名、参数），在函数返回后打印返回值，方便排查问题、复现调用链。

先讲思路。日志装饰器需要在"调用前"记录函数名和参数，在"调用后"记录返回值。这两步分别在 `wrapper` 里 `func(...)` 的前后执行。函数名可以通过 `func.__name__` 拿到（注意：没用 `functools.wraps` 时，`wrapper.__name__` 是 `wrapper`，但 `func.__name__` 始终是原函数名，因为 `func` 闭包捕获的是原始函数对象）。

```python
def log(func):
    def wrapper(*args, **kwargs):
        # 调用前：打印函数名和参数
        print(f"[LOG] 调用 {func.__name__}(args={args}, kwargs={kwargs})")
        result = func(*args, **kwargs)
        # 调用后：打印返回值
        print(f"[LOG] {func.__name__} 返回 {result!r}")
        return result
    return wrapper

@log
def transfer(from_acc, to_acc, amount):
    # 模拟转账业务
    return f"从 {from_acc} 向 {to_acc} 转账 {amount} 元成功"

print(transfer("6228-001", "6228-002", 500))
# 输出：
# [LOG] 调用 transfer(args=('6228-001', '6228-002', 500), kwargs={})
# [LOG] transfer 返回 '从 6228-001 向 6228-002 转账 500 元成功'
# 从 6228-001 向 6228-002 转账 500 元成功
```

这个装饰器可以直接用在任何业务函数上。注意三件事：第一，参数被完整打印出来了，如果参数里含敏感信息（密码、token），日志装饰器就可能泄露，生产环境要么脱敏要么不打印参数值，只打印参数名。第二，`{result!r}` 用 `!r` 调用 `repr`，能更忠实地显示字符串的引号、数字的类型，调试时更准确。第三，这里 `print` 只是演示，真实工程应该用 `logging` 模块，能控制级别和输出目标。

**进阶版：记录到日志系统**

```python
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("app")

def log_to_logger(func):
    def wrapper(*args, **kwargs):
        logger.info(f"调用 {func.__name__}，参数 args={args} kwargs={kwargs}")
        result = func(*args, **kwargs)
        logger.info(f"{func.__name__} 返回 {result!r}")
        return result
    return wrapper

@log_to_logger
def fetch_user(user_id):
    return {"id": user_id, "name": "张三"}

user = fetch_user(1001)
# 输出（时间戳随运行变化）：
# 2026-07-23 10:00:00,000 INFO 调用 fetch_user，参数 args=(1001,) kwargs={}
# 2026-07-23 10:00:00,000 INFO fetch_user 返回 {'id': 1001, 'name': '张三'}
```

用 `logging` 的好处是能按级别过滤、按时间格式化、输出到文件，比 `print` 工程化得多。装饰器的结构没有任何变化，只是把 `print` 换成 `logger.info`。

### 2.5 实战二：计时装饰器

计时装饰器用于测量函数执行耗时，在性能优化、慢查询排查时非常常用。思路是用 `time.perf_counter()` 在调用前后各取一次时间戳，相减得到耗时。`time.perf_counter()` 返回高精度计时器，比 `time.time()` 更适合测量短时间间隔。

```python
import time

def timer(func):
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"[TIMER] {func.__name__} 耗时 {elapsed:.6f} 秒")
        return result
    return wrapper

@timer
def slow_sum(n):
    total = 0
    for i in range(n):
        total += i
    return total

print(slow_sum(1_000_000))
# 输出：
# [TIMER] slow_sum 耗时 0.045212 秒
# 499999500000
```

注意 `start` 和 `elapsed` 都在 `wrapper` 内部计算——这保证了每次调用都是独立计时的，不会互相干扰。如果把 `start` 写在外层，就会算成"从装饰定义到函数调用"的时间，完全不对。

**为什么用 perf_counter 不用 time**

`time.time()` 返回的是"墙上时钟"，会受系统时间调整（NTP 同步、手动改时间）影响，可能出现负的耗时或跳跃。`time.perf_counter()` 专门用于性能测量，单调递增、精度高（通常纳秒级），是官方文档推荐的计时函数。

```python
# 对比：time.time 可能受系统时间调整影响
import time

def timer_time(func):
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        print(f"耗时 {time.time() - start} 秒")
        return result
    return wrapper
```

上面的写法平时也能用，但在生产环境如果系统时钟被回拨，`time.time()` 的差值会是负数，导致计时结果无意义。所以养成用 `perf_counter` 的习惯。

**进阶版：把耗时挂到返回值上**

有时候调用方想知道耗时而不只是打印，可以用一个包装对象把返回值和耗时一起返回。但这样改变了返回值类型，侵入性较大，更常见的做法是打印足够，或者把耗时写进日志。

```python
def timer_with_log(func):
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        # 把耗时也记到日志，方便后续统计
        logger = logging.getLogger("perf")
        logger.warning(f"{func.__name__} 耗时 {elapsed:.4f}s")
        return result
    return wrapper
```

这里用 `logger.warning` 是因为性能数据通常值得提高级别，便于在一堆 INFO 日志里被注意到（慢查询就该告警）。结构依然是两层函数，只是增强逻辑更偏工程化。

### 2.6 实战三：调用计数装饰器

调用计数装饰器用于统计一个函数被调用了多少次。典型场景：测试里验证函数被调了 N 次、监控接口调用频次、调试时确认递归深度。关键点在于：计数变量不能是 `wrapper` 的局部变量（每次调用重新归零），也不能是外层的普通变量（闭包内层无法直接赋值）。这里需要用"可变容器"绕过闭包只读限制。

```python
def count_calls(func):
    counter = {"n": 0}   # 用字典承载计数，闭包内层可修改
    def wrapper(*args, **kwargs):
        counter["n"] += 1
        print(f"[COUNT] {func.__name__} 第 {counter['n']} 次调用")
        return func(*args, **kwargs)
    # 把计数器挂到 wrapper 上，方便外部读取
    wrapper.count = counter
    return wrapper

@count_calls
def process_order(order_id):
    return f"订单 {order_id} 已处理"

for oid in [101, 102, 103]:
    print(process_order(oid))

print(f"总共调用 {process_order.count['n']} 次")
# 输出：
# [COUNT] process_order 第 1 次调用
# 订单 101 已处理
# [COUNT] process_order 第 2 次调用
# 订单 102 已处理
# [COUNT] process_order 第 3 次调用
# 订单 103 已处理
# 总共调用 3 次
```

**为什么用字典不用普通变量**

如果直接写 `counter = 0`，内层 `counter += 1` 会报 `UnboundLocalError`。原因是 Python 看到 `wrapper` 里有对 `counter` 的赋值，会把它当作 `wrapper` 的局部变量，而不是从外层闭包捕获的变量。解法有两个：用 `nonlocal` 声明（Python 3 引入），或用可变容器（字典、列表）承载。两种都行，下面用 `nonlocal` 改写一遍。

```python
def count_calls_nonlocal(func):
    n = 0
    def wrapper(*args, **kwargs):
        nonlocal n
        n += 1
        print(f"[COUNT] {func.__name__} 第 {n} 次调用")
        return func(*args, **kwargs)
    wrapper.count = n   # 注意：这里存的是当前值 0，不是引用，后面读不到更新
    return wrapper
```

注意 `wrapper.count = n` 存的是 `n` 当前的值（0），因为整数是不可变的，`n += 1` 实际是让 `n` 指向新对象，`wrapper.count` 仍指向旧的 0。所以如果要让外部能读到最新计数，`wrapper.count` 应该存一个可变引用，或者干脆不存、改成专门一个取值函数。相比之下，前面的字典写法更直接——`wrapper.count` 存的是字典引用，内部改 `counter["n"]` 外部能看到。

**nonlocal 版正确写法**

```python
def count_calls_nonlocal(func):
    n = 0
    def wrapper(*args, **kwargs):
        nonlocal n
        n += 1
        return func(*args, **kwargs)
    return wrapper

@count_calls_nonlocal
def fetch_cache(key):
    return f"cached:{key}"
```

这个 `nonlocal` 版简洁，但外部无法直接读到 `n`（因为 `n` 是闭包变量，不暴露）。两种写法各有适用场景：需要外部读取计数用字典，只在内部用用 `nonlocal`。

### 2.7 实战四：重试装饰器

重试装饰器在调用外部服务（HTTP API、数据库、文件 IO）时极常用。目标：当被装饰函数抛异常时，自动重试若干次，全部失败才把异常抛给调用方。这里的"重试次数"看起来像个参数，但我们把它写死在装饰器里，所以仍然是无参装饰器（带参数的重试装饰器下一篇会讲）。

思路：在 `wrapper` 里用一个循环，捕获异常，达到最大次数才抛出。

```python
import random

def retry_three_times(func):
    def wrapper(*args, **kwargs):
        max_attempts = 3
        last_exc = None
        for attempt in range(1, max_attempts + 1):
            try:
                result = func(*args, **kwargs)
                return result               # 成功就返回，退出循环
            except Exception as e:
                print(f"[RETRY] {func.__name__} 第 {attempt} 次失败：{e}")
                last_exc = e
        # 全部失败，抛出最后一次的异常
        raise last_exc
    return wrapper

@retry_three_times
def call_api():
    # 模拟调用外部 API，有 70% 概率失败
    if random.random() < 0.7:
        raise ConnectionError("API 连接超时")
    return {"status": "ok", "data": [1, 2, 3]}

try:
    result = call_api()
    print(f"成功：{result}")
except ConnectionError as e:
    print(f"最终失败：{e}")
# 输出（随机，可能如下）：
# [RETRY] call_api 第 1 次失败：API 连接超时
# [RETRY] call_api 第 2 次失败：API 连接超时
# 成功：{'status': 'ok', 'data': [1, 2, 3]}
```

关键点：第一，`return result` 写在 `try` 里，一旦成功立刻返回，不会继续重试。第二，`last_exc` 记录最后一次异常，循环结束后 `raise last_exc` 把它抛出去，让调用方知道真失败了。第三，捕获的是 `Exception`，不是 `BaseException`，避免把 `KeyboardInterrupt`、`SystemExit` 也吞掉（那会让用户连 Ctrl+C 都停不下来）。

**加退避（backoff）的版本**

真实场景下，立刻重试往往还是会失败（服务还在恢复），应该在两次尝试之间 sleep 一会儿。下面的版本加上固定退避：

```python
import time
import random

def retry_with_backoff(func):
    def wrapper(*args, **kwargs):
        max_attempts = 3
        for attempt in range(1, max_attempts + 1):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                if attempt == max_attempts:
                    raise
                wait = attempt   # 第1次失败等1秒，第2次失败等2秒
                print(f"[RETRY] 第 {attempt} 次失败，{wait}s 后重试：{e}")
                time.sleep(wait)
    return wrapper

@retry_with_backoff
def fetch_remote():
    if random.random() < 0.5:
        raise TimeoutError("远程接口超时")
    return "data-ok"

print(fetch_remote())
# 输出（可能）：
# [RETRY] 第 1 次失败，1s 后重试：远程接口超时
# data-ok
```

这里用 `attempt` 作为等待秒数，实现简单的线性退避。生产中常用指数退避（`2 ** attempt`）或加抖动（jitter）。结构没变，还是两层函数 + `wrapper` 内循环。

### 2.8 实战五：参数校验装饰器

参数校验装饰器用于在函数执行前检查入参是否满足要求，不满足就抛异常或给默认值，避免脏数据进入业务逻辑。典型场景：校验入参非空、类型正确、取值范围合法。

先实现一个"位置参数不能为 None"的校验装饰器：

```python
def require_non_none(func):
    def wrapper(*args, **kwargs):
        for i, arg in enumerate(args):
            if arg is None:
                raise ValueError(f"{func.__name__} 的第 {i+1} 个位置参数不能为 None")
        return func(*args, **kwargs)
    return wrapper

@require_non_none
def create_user(name, email):
    return {"name": name, "email": email}

print(create_user("张三", "zhangsan@example.com"))
# 输出：{'name': '张三', 'email': 'zhangsan@example.com'}

# create_user(None, "zhangsan@example.com")
# 抛出：ValueError: create_user 的第 1 个位置参数不能为 None
```

`wrapper` 拿到 `args` 元组后逐一检查，发现 `None` 就抛 `ValueError`，没问题才放行调原函数。这种装饰器的校验逻辑写在"调用前"，符合 2.1 节职责划分里的"步骤一"。

**类型校验版**

下面这个版本用函数注解（`__annotations__`）做轻量类型检查。Python 注解默认不强制，装饰器可以读取它做运行时校验：

```python
def type_check(func):
    annotations = func.__annotations__   # 在外层取一次，避免每次调用重复取
    def wrapper(*args, **kwargs):
        # 把位置参数和关键字参数都对齐到"参数名 -> 值"
        import inspect
        bound = inspect.signature(func).bind(*args, **kwargs)
        bound.apply_defaults()
        for name, value in bound.arguments.items():
            expected = annotations.get(name)
            if expected is not None and not isinstance(value, expected):
                raise TypeError(
                    f"{func.__name__} 参数 {name} 期望 {expected.__name__}，"
                    f"实际 {type(value).__name__}"
                )
        return func(*args, **kwargs)
    return wrapper

@type_check
def compute_discount(price: float, rate: float) -> float:
    return price * (1 - rate)

print(compute_discount(100.0, 0.2))
# 输出：80.0

# compute_discount("一百", 0.2)
# 抛出：TypeError: compute_discount 参数 price 期望 float，实际 str
```

这里用 `inspect.signature(func).bind` 把位置参数和关键字参数统一映射到参数名，再对照 `func.__annotations__` 做类型检查。`annotations` 在外层取一次（因为它是函数对象的属性，不变），节省每次调用的开销。

注意一点：Python 的 `bool` 是 `int` 的子类，`isinstance(True, int)` 是 `True`，所以类型校验对 `bool/float` 这种边界要做额外处理，这点属于类型检查库的范畴，这里只是演示装饰器结构。

### 2.9 多个无参装饰器叠加

一个函数可以叠加多个装饰器，写法是多个 `@` 堆叠。叠加顺序是"从下往上装饰，从上往下执行"，这句话稍微抽象，下面拆开讲。

```python
def deco_a(func):
    def wrapper(*args, **kwargs):
        print("A 前")
        result = func(*args, **kwargs)
        print("A 后")
        return result
    return wrapper

def deco_b(func):
    def wrapper(*args, **kwargs):
        print("B 前")
        result = func(*args, **kwargs)
        print("B 后")
        return result
    return wrapper

@deco_a
@deco_b
def hello():
    print("hello")
```

`@deco_a` 在 `@deco_b` 上面。装饰阶段等价于 `hello = deco_a(deco_b(hello))`，也就是先套 `deco_b` 再套 `deco_a`，所以 `deco_b` 的 `wrapper` 在内层，`deco_a` 的 `wrapper` 在外层。调用 `hello()` 时，先进入外层 `deco_a` 的 `wrapper`，打印 "A 前"，调内层，进入 `deco_b` 的 `wrapper`，打印 "B 前"，调原函数，打印 "hello"，回到 `deco_b` 打印 "B 后"，回到 `deco_a` 打印 "A 后"。

```python
hello()
# 输出：
# A 前
# B 前
# hello
# B 后
# A 后
```

把"前/后"的顺序连起来读：`A 前 → B 前 → hello → B 后 → A 后`，像洋葱一样一层套一层，这就是常说的"装饰器洋葱模型"。理解它只需记住一句：**上面的装饰器包在外面，下面的装饰器贴着原函数**。

**调换顺序会变结果**

```python
@deco_b
@deco_a
def hello2():
    print("hello")

hello2()
# 输出：
# B 前
# A 前
# hello
# A 后
# B 后
```

仅仅是上下换了位置，执行顺序就变成 `B 前 → A 前 → hello → A 后 → B 后`。所以装饰器的顺序不能随便写，尤其当多个装饰器之间有依赖（比如认证装饰器要在日志装饰器之前先拒绝非法请求）时，顺序错了行为就变了。

叠加装饰器时还有一个坑：未用 `functools.wraps` 时，最外层 `wrapper` 的 `__name__` 会覆盖 `hello.__name__`，导致调试时看到的是最外层装饰器的 `wrapper` 而非 `hello`。这是 04 篇要解决的问题，这里先记住：多个装饰器叠加 + 不用 `wraps` = 元信息全乱。

### 2.10 functools.wraps 的衔接说明

上面所有装饰器都漏了一个细节：装饰后 `func.__name__` 等元信息会变成 `wrapper` 的（因为外界拿到的是 `wrapper`）。日志装饰器里我们用 `func.__name__` 打印原函数名，那是因为 `func` 这个闭包变量指向的是原始函数，`func.__name__` 自然是原名；但如果别人想用 `greet.__name__` 去查这个被装饰后的函数叫什么，拿到的就是 `wrapper` 而非 `greet`。

解法是用 `functools.wraps(func)` 装饰 `wrapper`，把 `func` 的 `__name__`、`__doc__`、`__module__`、`__qualname__` 等复制到 `wrapper` 上。这里只给一个加 `wraps` 的标准写法形状，详细机制和 `__wrapped__` 留给 04 篇专门讲。

```python
from functools import wraps

def log(func):
    @wraps(func)                  # 把 func 的元信息复制给 wrapper
    def wrapper(*args, **kwargs):
        print(f"[LOG] 调用 {func.__name__}")
        return func(*args, **kwargs)
    return wrapper
```

本篇后面的示例为了聚焦"两层函数结构"，不一定每个都加 `wraps`，但工程实践中所有装饰器都应加 `wraps`，这是铁律。

### 2.11 类实现无参装饰器（简提）

无参装饰器也可以用类来写。类装饰器的核心是 `__call__` 方法：让类的实例变成可调用对象，调用实例时执行 `__call__`，这相当于两层函数里的 `wrapper`。

```python
class CallLogger:
    def __init__(self, func):
        self.func = func
        self.call_count = 0

    def __call__(self, *args, **kwargs):
        self.call_count += 1
        print(f"[CALL] {self.func.__name__} 第 {self.call_count} 次调用")
        return self.func(*args, **kwargs)

@CallLogger
def save_record(record_id):
    return f"记录 {record_id} 已保存"

print(save_record(1))
print(save_record(2))
print(f"累计调用 {save_record.call_count} 次")
# 输出：
# [CALL] save_record 第 1 次调用
# 记录 1 已保存
# [CALL] save_record 第 2 次调用
# 记录 2 已保存
# 累计调用 2 次
```

类装饰器有几个天然优势：状态保存不用字典或 `nonlocal` 绕弯，直接用实例属性（`self.call_count`）；可以对外暴露更多方法（比如 `reset()`、`stats()`）。结构上，`__init__` 对应外层 `decorator(func)`（接收被装饰函数），`__call__` 对应内层 `wrapper`（执行增强逻辑）。详细的类装饰器机制（包括和 `functools.wraps` 的配合、`__get__` 描述符处理方法装饰）留给 06 篇专门展开，这里只是简提一下"也能这么写"。

## 3. 最佳实践

### 3.1 wrapper 必须透传参数

无论被装饰函数签名多么简单，`wrapper` 都写 `*args, **kwargs` 而不是写死参数。写死参数会在被装饰函数签名变化时悄悄出错。只有当你有意要限制装饰器只用于特定签名函数时，才可以写死——但要明确这是有意为之，并在文档里说明。

```python
# 推荐
def decorator(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

# 不推荐（除非有意限制）
def decorator_fragile(func):
    def wrapper(x):
        return func(x)
    return wrapper
```

### 3.2 必须保存并返回原函数返回值

`wrapper` 里调用 `func(*args, **kwargs)` 后，结果必须保存到变量并 `return`。哪怕你的装饰器只是"加个日志"，看起来"不关心返回值"，也必须 `return`——因为被装饰函数的调用方关心。养成"先保存、后增强、最后 return 保存值"的三步法习惯。

```python
# 推荐
def decorator(func):
    def wrapper(*args, **kwargs):
        result = func(*args, **kwargs)
        # 增强逻辑
        return result
    return wrapper

# 不推荐
def decorator_lossy(func):
    def wrapper(*args, **kwargs):
        func(*args, **kwargs)    # 返回值丢了
        print("done")
    return wrapper
```

### 3.3 增强逻辑放在 wrapper 内部，不要放外层

外层 `decorator(func)` 只负责定义和返回 `wrapper`，所有增强逻辑（打印、计时、计数、重试、校验）都必须在 `wrapper` 内部。写在 `decorator` 外层会把逻辑提前到"装饰阶段"（模块导入时）执行，那时的参数还没有传入、函数还没被调用，完全不是你想要的时机。

```python
# 推荐
def timer(func):
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        print(time.perf_counter() - start)
        return result
    return wrapper

# 不推荐：计时逻辑跑在装饰阶段
def timer_wrong(func):
    start = time.perf_counter()
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    print(time.perf_counter() - start)   # 模块导入时就打印了
    return wrapper
```

### 3.4 捕获异常要精准，不要吞 Exception

重试装饰器里捕获异常，应捕获具体的异常类型（`ConnectionError`、`TimeoutError`），避免把 `KeyboardInterrupt`、`SystemExit` 一起吞掉。如果确实要捕获所有"业务异常"，用 `Exception` 而非 `BaseException`，并在重试耗尽后重新抛出，不要静默返回 `None`。

```python
# 推荐
def retry(func):
    def wrapper(*args, **kwargs):
        for _ in range(3):
            try:
                return func(*args, **kwargs)
            except (ConnectionError, TimeoutError) as e:
                continue
        raise e
    return wrapper

# 不推荐：吞 BaseException
def retry_bad(func):
    def wrapper(*args, **kwargs):
        for _ in range(3):
            try:
                return func(*args, **kwargs)
            except:           # 裸 except，连 Ctrl+C 都吞
                continue
```

### 3.5 一律加 functools.wraps

工程项目里所有装饰器都应加 `functools.wraps`，保留原函数的 `__name__`、`__doc__` 等。否则调试时看到的函数名全是 `wrapper`，堆栈追踪、文档生成都会乱。这条本篇不展开，留给 04 篇专门讲，但实践时记住"装饰器加 wraps"是无脑默认动作。

### 3.6 装饰器不要有副作用残留

装饰器里的可变状态（计数器、缓存）如果跨请求共享，在多线程下要加锁或用线程局部存储。本篇示例是单线程演示，多线程场景下 `counter["n"] += 1` 不是原子操作，会丢更新。生产环境要考虑线程安全，或干脆用 `threading.local()`、`functools.lru_cache` 这类已经处理好的工具。

### 3.7 装饰器叠加顺序要从语义想

多个装饰器叠加时，顺序由"哪个要先拦截/先准备"决定。例如：认证装饰器应该放最外层（先拒绝非法请求，避免后续装饰器白干），日志装饰器可以放内层（记录的是通过认证后的调用）。调试时如果顺序不对，把装饰器堆叠的顺序在脑海里模拟一遍洋葱模型，很快能定位。

## 4. 原理

### 4.1 两层函数结构的成因

无参装饰器为什么是两层函数结构？这要从装饰器的两个时间点说起：装饰阶段和调用阶段。

装饰阶段发生在 `@decorator` 被 Python 解析时（通常是模块导入时），等价于执行 `func = decorator(func)`。这个阶段装饰器只拿到"被装饰的函数对象"，调用方还没传任何参数——所以外层 `decorator(func)` 的职责就是接收函数、准备好"增强后的新函数"并返回它。这个阶段不能执行增强逻辑，因为函数还没被调用。

调用阶段发生在用户调用 `func(...)` 时。经过装饰阶段后，`func` 这个名字绑定的已经是 `decorator` 返回的新函数（`wrapper`），所以用户调的实际上是 `wrapper(...)`。这时才真正有参数传入，增强逻辑才能基于参数和返回值工作。

两个阶段、两个职责，自然需要"外层管装饰阶段、内层管调用阶段"的两层结构。外层 `decorator(func)` 在装饰阶段运行，内层 `wrapper(*args, **kwargs)` 在调用阶段运行。如果不是两层，你就没法把"接收函数"和"接收调用参数"这两件事分到不同时机。

下面用一段代码把两个时间点显式标出来：

```python
def decorator(func):
    print(f"[装饰阶段] decorator 接收到 {func.__name__}，准备返回 wrapper")
    def wrapper(*args, **kwargs):
        print(f"[调用阶段] wrapper 被调用，参数 args={args} kwargs={kwargs}")
        result = func(*args, **kwargs)
        return result
    return wrapper

@decorator                  # 模块导入时执行 decorator(target)，打印"装饰阶段"
def target(x):
    return x * 2

print("--- 模块导入完成，开始调用 ---")
print(target(21))
# 输出：
# [装饰阶段] decorator 接收到 target，准备返回 wrapper
# --- 模块导入完成，开始调用 ---
# [调用阶段] wrapper 被调用，参数 args=(21,) kwargs={}
# 42
```

可以看到"装饰阶段"的打印出现在"开始调用"之前，证实两层各跑各的时机。

### 4.2 wrapper 替换名字绑定后调用栈怎么走

理解装饰器执行的关键是弄清"名字绑定"在装饰后变成了什么。`@decorator def target(x): ...` 等价于：

```python
def target(x):
    ...
target = decorator(target)
```

也就是说，`target` 这个名字原来绑定原始函数对象，经过 `target = decorator(target)` 后，重新绑定到 `decorator(target)` 的返回值，即 `wrapper`。原始的 `target` 函数对象并没有消失，它被 `decorator` 的闭包 `wrapper` 通过 `func` 变量捕获着，仍然能被 `wrapper` 内部调用。

调用 `target(21)` 时的实际过程：

1. Python 查名字 `target`，在模块命名空间找到它，发现它绑定的是 `wrapper` 函数对象。
2. 调用 `wrapper(21)`，进入 `wrapper` 的栈帧。
3. `wrapper` 内部引用 `func`——它不在 `wrapper` 的局部作用域，Python 通过闭包机制从外层 `decorator` 的作用域找到 `func`（指向原始 `target`）。
4. 调用 `func(21)`，进入原始 `target` 的栈帧，返回 `42`。
5. `wrapper` 把 `42` 返回给调用方。

整条调用栈是"调用方 → wrapper → 原始 func"。这就是为什么增强逻辑能"包裹"在原始函数调用前后——因为它就在 `wrapper` 这一层栈帧里，`func` 调用前后的代码正好包住 `func` 的执行。

### 4.3 闭包捕获 func 的 cell 机制

`wrapper` 能在 `decorator` 返回后、过了很久被调用时仍然访问到 `func`，靠的是 Python 的闭包机制。很多人以为闭包是"把外层变量复制一份到内层"，其实不是——Python 闭包用的是"cell 对象共享"。

当 Python 编译 `decorator` 时，发现 `wrapper` 内部引用了 `decorator` 的局部变量 `func`，于是会把 `func` 这个变量从"普通局部变量槽"升级为"cell 变量"。cell 变量不直接存值，而是存一个对 `cell` 对象的引用，`cell` 对象里再存值。`wrapper` 的 `__closure__` 属性会持有一个指向同一个 `cell` 对象的引用。

效果是：`decorator` 执行结束、栈帧销毁后，`func` 这个局部变量的"值"不会随栈帧消失，因为它存在 `cell` 对象里；`wrapper` 通过自己的 `__closure__` 也能访问同一个 `cell`，于是拿得到 `func`。

可以验证：

```python
def decorator(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

@decorator
def target(x):
    return x

print(target.__closure__)
# 输出：(<cell at 0x...: function object at 0x...>,)

# cell 里存的就是原始 target 函数对象
print(target.__closure__[0].cell_contents)
# 输出：<function target at 0x...>

# 验证它和原始 target 是同一个对象
original_target = target.__closure__[0].cell_contents
print(original_target(10))
# 输出：10
```

`target.__closure__` 是一个元组，每个元素是一个 `cell` 对象。这里 `wrapper` 内部引用了一个外层变量 `func`，所以 `__closure__` 有一个 cell，`cell_contents` 就是原始 `target` 函数对象。我们直接调这个原始对象，得到的就是没经过装饰的 `target(10)`——本例原始定义是 `return x`，所以输出 `10`（如果原始定义是 `return x * 2`，这里就会输出 `20`；关键在于 `cell` 里存的是被装饰前的原始函数对象，调用它绕过了装饰增强）。

这个 cell 机制也解释了 2.6 节"计数装饰器为什么用字典/非 `nonlocal`"：普通变量如果在 `wrapper` 内被赋值会被当成局部变量，与外层 `cell` 脱钩；用 `nonlocal` 是显式告诉 Python"这个变量要从外层 cell 取"，从而 `wrapper` 内的 `n += 1` 改的是 `cell` 里的值，而不是新建局部 `n`。用字典则是因为字典本身是可变对象，`counter["n"] += 1` 修改的是字典内容（没对 `counter` 这个名字赋值），所以 `counter` 这个引用天然能从 `cell` 取到。

### 4.4 *args/**kwargs 透传的字节码视角

`wrapper(*args, **kwargs)` 和 `func(*args, **kwargs)` 在字节码层面是怎么把参数"收与发"的？用一个最小例子看字节码。

```python
def decorator(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper
```

`wrapper` 的签名是 `*args, **kwargs`，这意味着它在参数收集阶段把所有位置参数装进 `args` 元组、所有关键字参数装进 `kwargs` 字典。反映到字节码，调用 `wrapper(1, 2, c=3)` 时，Python 先构造元组 `(1, 2)` 和字典 `{'c': 3}`，再赋给 `wrapper` 的局部变量 `args` 和 `kwargs`。

`wrapper` 内部调 `func(*args, **kwargs)` 时，字节码大致是：把 `func` 加载到栈顶（`LOAD_DEREF`，因为 `func` 是闭包变量），把 `args` 加载到栈顶（`LOAD_FAST`，因为 `args` 是 `wrapper` 的局部变量），通过 `BUILD_TUPLE_UNPACK` 或 `CALL_FUNCTION_EX` 把 `args` 解包成位置参数；再把 `kwargs` 加载到栈顶，通过 `CALL_FUNCTION_EX` 的关键字参数部分把字典解包成关键字参数，最终调用 `func`。

关键点是 `CALL_FUNCTION_EX`：它专门处理"参数已经在元组/字典里"的调用形式，等价于直接写 `func(1, 2, c=3)`，但参数来源是 `*args` 和 `**kwargs`。这就是"透传"在字节码层面的体现——收集是 `*` / `**` 把"散参数"装进容器，转发是 `*` / `**` 把"容器"拆回散参数，两端对称。

可以实际看一眼字节码：

```python
import dis

def decorator(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

dis.dis(decorator.__code__.co_consts[1])
# 输出（节选，不同 Python 版本细节略异）：
# ... 
# LOAD_DEREF    func
# LOAD_FAST     args
# BUILD_TUPLE   ...
# LOAD_FAST     kwargs
# CALL_FUNCTION_EX  ...
# RETURN_VALUE
```

`LOAD_DEREF func` 证实 `func` 是从闭包（cell）取的；`LOAD_FAST args` 证实 `args` 是 `wrapper` 的局部变量；`CALL_FUNCTION_EX` 是"用元组+字典调用"的指令。三个指令合起来就是"闭包取原函数 + 局部取收集来的参数 + 解包调用"。

### 4.5 为何必须 return func(...)

最后解释为什么必须 `return func(*args, **kwargs)`，不能光调不返回。

Python 函数没有显式 `return` 时，默认返回 `None`。`wrapper` 是个函数，如果它内部调了 `func(*args, **kwargs)` 却没把结果 `return`，那 `wrapper` 的返回值就是 `None`。而外界调用的入口是 `wrapper`，所以调用方拿到的就是 `None`，原函数的真实返回值被丢进内存里再被垃圾回收，调用方再也拿不到。

```python
def buggy(func):
    def wrapper(*args, **kwargs):
        func(*args, **kwargs)    # 没保存、没 return
    return wrapper

@buggy
def add(a, b):
    return a + b

result = add(1, 2)
print(result)
# 输出：None
```

`add` 原本返回 `3`，但 `wrapper` 在执行 `func(1, 2)` 后没 `return`，`wrapper` 默认返回 `None`，于是 `result` 是 `None`。

字节码上，`wrapper` 里写 `func(*args, **kwargs)` 不带 `return`，对应字节码最后是 `POP_TOP`（把栈顶的函数返回值弹掉丢弃），然后 `LOAD_CONST None` + `RETURN_VALUE`（返回 `None`）。写 `return func(*args, **kwargs)` 则是 `CALL_FUNCTION_EX` 后直接 `RETURN_VALUE`，把函数返回值作为 `wrapper` 的返回值送上栈。

```python
import dis

def has_return(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

def no_return(func):
    def wrapper(*args, **kwargs):
        func(*args, **kwargs)
    return wrapper

print("--- 有 return ---")
dis.dis(has_return.__code__.co_consts[1])
# CALL_FUNCTION_EX 后直接 RETURN_VALUE，把 func 的返回值作为 wrapper 返回值

print("--- 无 return ---")
dis.dis(no_return.__code__.co_consts[1])
# CALL_FUNCTION_EX 后是 POP_TOP（丢弃 func 返回值），
# 然后 LOAD_CONST None + RETURN_VALUE（返回 None）
```

这就是"必须 return"的原理：不 `return` 就 `POP_TOP`，函数返回值被字节码层面直接丢弃，调用方拿到的是 `None`。

### 4.6 装饰阶段只执行一次的来源

最后顺带说清"装饰阶段只执行一次"这件事的来源。`@decorator` 是语法糖，等价于 `target = decorator(target)`。这条赋值语句在 Python 解析到 `@decorator def target` 时执行一次，执行完 `target` 就绑定到 `wrapper`，之后 `decorator` 不会再被调用（除非你手动调）。所以外层 `decorator` 整个生命周期只跑一次，它内部的 `print` 只会打印一次，它定义的 `wrapper` 也只创建一次（之后每次调用 `target` 复用同一个 `wrapper` 对象）。

这也解释了为什么把"计时逻辑"写在 `decorator` 外层不对：那个 `print` 会只在模块导入时执行一次，根本不是每次调用都计时。同理，计数装饰器如果把计数变量写在 `decorator` 外层（而非 `wrapper` 内层用 cell 维护），所有调用共用同一个计数变量——这反而对计数装饰器是对的（要的就是累计），但如果是其他场景（比如想每次调用独立状态），写在外层就会出 bug。理解了"装饰阶段一次性、调用阶段多次"这个时间差，很多装饰器的怪异行为都能解释。

## 5. 总结

- 无参装饰器的标准结构是"两层函数"：外层 `def decorator(func):` 在装饰阶段运行、接收被装饰函数并定义返回 `wrapper`；内层 `def wrapper(*args, **kwargs):` 在调用阶段运行、执行增强逻辑、调用原函数并返回其返回值。
- `wrapper` 必须用 `*args, **kwargs` 透传，兼容任意被装饰函数签名；透传的字节码核心是 `CALL_FUNCTION_EX`，把收集来的元组/字典解包转发给原函数。
- `wrapper` 内部调用 `func(*args, **kwargs)` 后必须 `return` 其返回值，否则被装饰函数的返回值在字节码层面被 `POP_TOP` 丢弃，调用方拿到 `None`。养成"先保存、后增强、最后 return 保存值"的三步法。
- 五类典型无参装饰器：日志（调用前后打印）、计时（`perf_counter` 前后相减）、调用计数（字典或 `nonlocal` 闭包变量）、重试（`wrapper` 内循环捕获异常重抛）、参数校验（调用前检查 `args`/注解）。
- 多个无参装饰器叠加遵循"洋葱模型"：上面的装饰器包在外面，执行顺序是外层前 → 内层前 → 原函数 → 内层后 → 外层后。
- 类实现无参装饰器用 `__init__` 接收函数、`__call__` 执行增强，状态保存用实例属性，比函数版自然；详细机制留给 06 篇。
- `functools.wraps` 用于保留原函数元信息，工程实践中无脑默认加上；详细机制留给 04 篇。

读完本文你应能掌握：

- 不查资料默写出无参装饰器的标准两层结构，准确说出外层和内层各自的职责与执行时机；
- 解释 `*args, **kwargs` 透传为什么是必须的，并用 `dis` 看懂 `CALL_FUNCTION_EX` 的解包过程；
- 解释为什么 `wrapper` 必须 `return func(...)`，并指出不 `return` 时字节码层面的 `POP_TOP` 行为；
- 独立手写日志、计时、调用计数、重试、参数校验五类装饰器，并在合适的地方加 `functools.wraps`；
- 解释闭包捕获 `func` 的 cell 机制，理解为什么计数装饰器要用字典或 `nonlocal`；
- 看懂多装饰器叠加的洋葱模型，能根据语义正确安排装饰器顺序；
- 用类（`__init__` + `__call__`）实现一个带状态的无参装饰器。