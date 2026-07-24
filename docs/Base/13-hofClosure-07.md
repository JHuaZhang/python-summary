---
group:
  title: 【13】高阶函数与闭包
  order: 13
order: 7
title: 闭包应用场景
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 从概念到实战

上一篇笔记讲清楚了闭包是什么：一个函数记住了它定义时所在的作用域里的变量，哪怕那个作用域已经执行完毕、离开了自己的地盘，这个函数仍然能访问那些变量。这是 Python 作用域规则加上函数是一等对象共同产生的结果。如果你对 `LEGB` 规则、`free variable`（自由变量）、`cell object`（单元对象）这些词还没有印象，建议先回到上一篇复习。

本篇不再重复"闭包怎么形成的"，而是回答一个更实在的问题：**这个东西到底能用在哪里？** 闭包不是考试用的八股文，它是在工程里反复出现的实用工具。只要你的需求属于下面几类之一，闭包往往是比"写个类"或"用全局变量"更轻便的选择：

- 需要把一段"配置"或"上下文"预先绑定到一个函数上，之后再带着这些配置去执行。
- 需要让一个函数在多次调用之间"记住"某些状态，但又不想为了这点状态专门写一个类。
- 需要包装一个已有函数、为它增加额外行为（比如记日志、做缓存），且不改动原函数的调用方式。
- 需要把一组变量"藏"起来，只留几个受控的接口去访问，避免它们被外部直接修改。

你会发现，这四类需求分别对应了配置化函数工厂、状态保持、装饰器、私有命名空间等典型场景。本篇会逐一展开，每个场景都给出动机、可运行示例、运行结果，以及"为什么这里用闭包比用类或全局变量更合适"的对比说明。

### 1.2 本篇的阅读方式

本篇的 8 个场景彼此独立，你可以按顺序读，也可以跳着读。但建议先看完 2.1（装饰器）和 2.2（函数工厂），因为它们是最基础的两类用法，后面的场景多多少少都建立在这两类的思路上。

每个场景的结构统一为：

1. **动机**：什么需求会把它推到你面前。
2. **示例**：一段可以直接复制运行、带场景感的代码，并标注 `# 输出：`。
3. **为何用闭包**：和"用类""用全局变量""用默认参数"等替代方案做对比，说清楚闭包赢在哪里、又输在哪里。

另外，本篇假设你已经掌握了上一篇讲过的内容：闭包的形成条件、`nonlocal` 关键字、`__closure__` 属性的查看方法。这些不再从头解释，只在需要时点一句。

## 2. 核心内容

### 2.1 装饰器：闭包最经典的应用

装饰器是闭包最广为人知的落地形式。即便你平时没主动写过装饰器，只要用过 `@staticmethod`、`@property`、Flask 的 `@app.route`、pytest 的 `@pytest.mark.parametrize`，就已经在用闭包了。

先说一句本质：**装饰器就是一个接收函数、返回函数的高阶函数，而"返回的函数"之所以能记住"被装饰前的原函数"，靠的正是闭包。** 本篇只用一小段代码点破这层关系，更系统的装饰器讲解（带参装饰器、`functools.wraps`、类装饰器、装饰器叠放顺序等）留给后续专门的装饰器章节。

动机：你有一个已经写好、并且在很多地方被调用的函数 `say_hello`，现在想给它加一层"执行前打印一行日志"的行为，但不想改动它的函数体、也不想改动所有调用点。装饰器模式让你把这个"增强行为"写在外面，再"裹"回原函数。

```python
def log_calls(func):
    """一个最简单的装饰器：在调用前后打印日志"""
    def wrapper(*args, **kwargs):
        print(f"[LOG] 正在调用 {func.__name__}，参数 args={args} kwargs={kwargs}")
        result = func(*args, **kwargs)
        print(f"[LOG] {func.__name__} 返回 {result!r}")
        return result
    return wrapper

@log_calls
def say_hello(name):
    return f"你好，{name}"

print(say_hello("张三"))
# 输出：
# [LOG] 正在调用 say_hello，参数 args=('张三',) kwargs={}
# [LOG] say_hello 返回 '你好，张三'
# 你好，张三
```

`@log_calls` 这个语法糖等价于 `say_hello = log_calls(say_hello)`。`log_calls` 接收旧函数 `func`，在内部定义了 `wrapper`。`wrapper` 里引用了 `func` 这个名字——而 `func` 是外层 `log_calls` 的参数，属于外层作用域的变量。当 `log_calls` 执行完毕返回 `wrapper` 后，它的作用域本该消亡，但 `wrapper` 闭包捕获了 `func`，于是 `func`（也就是原来的 `say_hello`）被"随身携带"了下来。这就是装饰器能记住原函数的底层原因。

**为何用闭包而非类**

你当然可以用一个类来实现同样的"增强"：

```python
class LogCalls:
    def __init__(self, func):
        self.func = func

    def __call__(self, *args, **kwargs):
        print(f"[LOG] 正在调用 {self.func.__name__}")
        return self.func(*args, **kwargs)

@LogCalls
def say_hello(name):
    return f"你好，{name}"
```

类方案把原函数存在 `self.func` 上，本质上和闭包把原函数存在 cell 里是同一件事——都是"把外层数据挂在一个对象上"。区别在于：当增强逻辑简单（只是包一层日志、一层计时），闭包写法短、直观、不用写 `__init__`/`__call__`；当增强逻辑复杂、需要持有多个状态、需要继承或多态时，类方案更清晰。本篇后续的场景在"闭包 vs 类"的取舍上都遵循这个判断。

### 2.2 配置化函数工厂：用闭包记忆配置

动机：你的程序里需要一批"结构相同、只是某个参数不同"的函数。比如一个税率计算系统，不同地区的税率不同，但"含税价 = 原价 × (1 + 税率)"这个公式是一样的。你不想每次调用都把税率作为参数传进去，而是希望"先把税率固定下来，得到一个专属于该地区的函数"。

这就是**函数工厂**（function factory）：一个"生产函数的函数"。外层函数接收配置参数，内层函数闭包捕获这个配置，返回出去后配置就"焊"在了内层函数身上。

```python
def make_pricer(tax_rate):
    """根据税率生成一个含税价计算函数"""
    def price_with_tax(origin_price):
        # tax_rate 来自外层，被闭包捕获
        return round(origin_price * (1 + tax_rate), 2)
    return price_with_tax

# 为不同地区生产专属的计价函数
beijing_pricer = make_pricer(0.13)   # 北京税率 13%
shanghai_pricer = make_pricer(0.06)  # 上海税率 6%

print(beijing_pricer(100))    # 输出：113.0
print(shanghai_pricer(100))   # 输出：106.0
print(beijing_pricer(250))    # 输出：282.5
```

`make_pricer(0.13)` 执行完后，它的局部变量 `tax_rate=0.13` 本应随之消亡，但返回的 `price_with_tax` 闭包捕获了它，于是 `beijing_pricer` 这个函数对象身上就始终带着"税率 0.13"这个配置。同理 `shanghai_pricer` 带着的是 0.06。两次调用 `make_pricer` 产生的是两个互相独立的闭包实例，各自的 `tax_rate` 互不干扰。

再看一个更典型的例子：配置化日志格式器。你希望程序里不同模块的日志带不同的前缀和级别标签，但格式化逻辑相同。

```python
def make_logger(prefix, level="INFO"):
    """生成一个带固定前缀和级别的日志输出函数"""
    def log(message):
        print(f"[{level}] {prefix}: {message}")
    return log

db_logger = make_logger("DB", level="ERROR")
api_logger = make_logger("API")

db_logger("连接超时")
# 输出：[ERROR] DB: 连接超时
api_logger("开始处理请求")
# 输出：[INFO] API: 开始处理请求
api_logger("请求处理完毕")
# 输出：[INFO] API: 请求处理完毕
```

每调用一次 `make_logger`，就"生产"出一个记住自己前缀和级别的日志器。调用方使用 `db_logger("...")` 时完全不用再传前缀，代码读起来更贴合自然语言。

**为何用闭包而非全局变量或默认参数**

你可能想到两种替代写法：

第一种，把配置塞进默认参数：

```python
def price_with_tax(origin_price, tax_rate=0.13):
    return round(origin_price * (1 + tax_rate), 2)
```

这样做的问题在于：税率变成了调用方可以随时覆盖的参数，`price_with_tax(100, tax_rate=0)` 这种调用完全合法，配置就被绕过了。而闭包版本里税率是"焊死"的，调用方根本看不到 `tax_rate` 这个名字，无法篡改，配置的强制性更强。

第二种，用全局变量保存当前税率：

```python
CURRENT_TAX_RATE = 0.13
def price_with_tax(origin_price):
    return round(origin_price * (1 + CURRENT_TAX_RATE), 2)
```

问题更明显：没法同时存在两个不同税率的计价函数——全局变量只有一份，改它会影响所有调用。而闭包版本天然支持"同时存在多个独立配置"。

**闭包的局限**：配置一旦"焊死"就不好改。如果你需要运行时动态调整某个闭包的配置参数，通常得用类（把配置存成实例属性）或用 `nonlocal` 在内部修改。对于"配置一次、反复使用"的场景，闭包是最简方案；对于"配置频繁变动"的场景，类更合适。

### 2.3 状态保持：计数器、累加器与调用统计

动机：你想让一个函数在多次调用之间记住某些状态——比如统计它自己被调用了多少次、累加所有传入的值、记录上一次调用的结果。这种"跨调用保持状态"的需求在工程中很常见，最直觉的实现是写一个类，用实例属性存状态。但如果状态很简单（一两个变量），专门为它写个类显得杀鸡用牛刀。闭包提供了一个更轻的写法：把状态变量放在外层函数里，内层函数通过 `nonlocal` 修改它。

先看调用计数器。注意，这里必须用 `nonlocal`，否则内层函数里对 `count` 赋值会被 Python 当成"定义一个新的局部变量"，遮蔽掉外层的 `count`，无法真正累加。上一篇已经详细解释过这个坑，这里直接用。

```python
def make_counter(start=0):
    """生成一个调用计数器函数"""
    count = start
    def counter():
        nonlocal count
        count += 1
        return count
    return counter

visitor_counter = make_counter()
print(visitor_counter())  # 输出：1
print(visitor_counter())  # 输出：2
print(visitor_counter())  # 输出：3

# 另一个独立计数器，互不干扰
error_counter = make_counter(start=99)
print(error_counter())    # 输出：100
print(error_counter())    # 输出：101
print(visitor_counter())  # 输出：4
```

`count` 这个变量没有任何全局变量、也没有存成实例属性，它"活"在 `make_counter` 的闭包里。每次调用 `visitor_counter()`，`nonlocal count` 告诉 Python："这里的 `count` 不是局部变量，去外层找"，于是修改的是闭包里那份 `count`。两个计数器各自有自己的一份 `count`，因为它们来自两次独立的 `make_counter()` 调用，是两个独立的闭包实例。

再看累加器，它除了维护状态还要使用传入参数：

```python
def make_accumulator(initial=0):
    """生成一个累加器：每次调用把传入值加到累计总和上，并返回当前总和"""
    total = initial
    def add(value):
        nonlocal total
        total += value
        return total
    return add

sales = make_accumulator()
print(sales(100))   # 输出：100   （今日销售额累计）
print(sales(250))   # 输出：350
print(sales(80))    # 输出：430
print(f"当前累计销售额：{sales(0)}")  # 输出：当前累计销售额：430
```

这个累加器的特点是：状态 `total` 被封装在闭包内部，外部无法直接访问或修改它，只能通过 `sales(value)` 这个受控接口去间接更新。这就是"封装"的效果——只是没用类而已。

**为何用闭包而非类**

类版本长这样：

```python
class Counter:
    def __init__(self, start=0):
        self.count = start
    def __call__(self):
        self.count += 1
        return self.count

visitor_counter = Counter()
```

功能等价。取舍点在于：当状态只有一两个变量、行为只有一个 `__call__`，闭包写法更紧凑、没那么多样板代码；当状态变量多、行为复杂（比如还要重置、暂停、导出统计），类版本的可读性更好，因为属性有名字、方法有名字，比一堆 `nonlocal` 更容易追踪。本篇的立场是：**简单状态选闭包，复杂状态选类**，没有绝对优劣。

**为何用闭包而非全局变量**

全局变量版本：

```python
count = 0
def counter():
    global count
    count += 1
    return count
```

问题有二：第一，`count` 这个名字暴露在全局作用域，程序里任何一处都可以 `count = 0` 把它清零，状态失控；第二，无法同时存在两个独立计数器，因为全局 `count` 只有一份。闭包版本既藏起了 `count`，又能轻松造出多个独立实例，两点都比全局变量强。

### 2.4 缓存与 memoize：用闭包保存函数结果

动机：有些函数计算成本高但调用频繁，且对相同输入总会得到相同结果（纯函数）。这时可以用一个"缓存"把"输入→输出"的映射存下来，下次遇到相同输入直接返回缓存值，跳过重复计算。经典场景是递归实现的斐波那契数列——朴素递归的复杂度是指数级，加了缓存后变成线性。

这里的关键是：缓存必须是一个在多次调用之间持续存在的字典，且它应该"绑定"在被缓存函数身上，而不是散落在全局。闭包正好能提供这种绑定。

先看朴素的递归斐波那契，感受一下慢：

```python
def fib_slow(n):
    if n < 2:
        return n
    return fib_slow(n - 1) + fib_slow(n - 2)

# fib_slow(35) 在多数机器上要跑好几秒，因为存在海量重复计算
# fib_slow(35) 里 fib_slow(1) 会被调用 9227465 次
```

`fib_slow(5)` 的调用树里，`fib_slow(3)` 被计算了两次，`fib_slow(2)` 被计算了三次……随着 n 增大，重复呈指数膨胀。原因是函数没有"记忆"，每次都从零算起。

用闭包加缓存：

```python
def memoize(func):
    """用闭包为任意纯函数加缓存"""
    cache = {}                      # 缓存字典，存在于闭包中
    def wrapper(*args):
        if args in cache:
            # 命中缓存，直接返回之前算过的结果
            return cache[args]
        result = func(*args)       # 未命中则真正计算
        cache[args] = result        # 存入缓存
        return result
    return wrapper

@memoize
def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)

print(fib(35))    # 输出：9227465（几乎瞬间返回）
print(fib(50))    # 输出：12586269025
print(fib(100))   # 输出：354224848179261915075
```

把 `fib(35)` 从"几秒"降到"瞬间"，靠的就是 `cache` 字典。这个字典没有放在全局、也没有挂在 `fib` 函数对象的属性上，而是安静地待在 `memoize` 的闭包里。每次调用 `fib(n)`，实际进入的是 `wrapper(n)`，它先查 `cache`，命中就直接返回，不命中才往下递归。

这里有个细节值得一提：被装饰的 `fib` 内部递归调用的是 `fib` 这个名字，而 `fib` 经过 `@memoize` 后已经指向了 `wrapper`，所以递归也是走缓存的。如果直接 `fib = memoize(fib_slow)` 但 `fib_slow` 内部仍然递归调用自己（而非 `fib`），那递归路径就不会经过缓存，加速效果会大打折扣。把 `@memoize` 写在定义处，就是为了保证递归调用走的是被装饰后的版本。

还有一种带过期时间的缓存，常用于"缓存的数据可能过一阵就过期"的场景，比如缓存一个外部接口的返回值。这时缓存里除了存结果，还要存时间戳，并在命中时检查是否过期。闭包同样能漂亮地装下这些状态：

```python
import time

def memoize_with_ttl(ttl_seconds):
    """带过期时间的缓存装饰器工厂"""
    def decorator(func):
        cache = {}   # key -> (result, timestamp)
        def wrapper(*args):
            now = time.time()
            if args in cache:
                result, ts = cache[args]
                if now - ts < ttl_seconds:
                    return result            # 缓存未过期
            result = func(*args)
            cache[args] = (result, now)      # 写入/更新缓存
            return result
        return wrapper
    return decorator

@memoize_with_ttl(ttl_seconds=2)
def fetch_user(user_id):
    """模拟一个耗时的远端查询"""
    print(f"  (真正查询数据库：user_id={user_id})")
    return {"id": user_id, "name": f"用户{user_id}"}

print(fetch_user(1))   # 输出：(真正查询数据库...) {'id': 1, 'name': '用户1'}
print(fetch_user(1))   # 输出：{'id': 1, 'name': '用户1'}  （命中缓存，没打印查询日志）
time.sleep(2)
print(fetch_user(1))   # 输出：(真正查询数据库...) {'id': 1, 'name': '用户1'}  （过期，重新查询）
```

这里出现了"两层闭包"：外层 `memoize_with_ttl` 捕获配置 `ttl_seconds`，内层 `decorator` 捕获被装饰函数 `func` 和缓存字典 `cache`。这就是带参装饰器的典型结构，后续装饰器章节会系统讲解，这里只是让读者看到闭包在这种"多层嵌套"下依然自然工作。

**为何用闭包而非手动字典**

手写缓存当然可以把字典放在全局：

```python
_fib_cache = {}
def fib(n):
    if n in _fib_cache:
        return _fib_cache[n]
    if n < 2:
        return n
    result = fib(n - 1) + fib(n - 2)
    _fib_cache[n] = result
    return result
```

能用，但每个要缓存的函数都得这么手写一遍缓存管理逻辑，重复且易错。闭包版本（`memoize`）把缓存管理抽象出来，任何纯函数只要加一个 `@memoize` 就能复用，这是闭包带来的"逻辑封装 + 复用"价值。事实上，标准库 `functools.lru_cache` 就是用类似的闭包 + 字典思路实现的（它内部用的是字典加双向链表，以支持 LRU 淘汰策略）。

### 2.5 回调与事件处理：携带上下文的闭包

动机：在 GUI 编程、异步任务、事件监听这些场景里，你常常需要"注册一个回调函数"——某个事件发生时，框架会替你调用这个函数。问题在于：回调函数被注册时所在的环境，和它被执行时的环境，往往不是同一个。你希望回调被调用时还能带上注册时的某些上下文（比如"是哪个用户点的按钮""是哪个任务 ID 完成了"），而框架的回调签名通常是固定的，不接受你额外塞参数。

闭包天生擅长"绑上下文"：在注册时把上下文变量捕获进闭包，回调执行时这些变量随身带着，框架无需知情。

来看一个模拟的按钮点击处理：

```python
def make_handler(user_name, button_id):
    """为某个用户的某个按钮生成点击处理器"""
    click_count = 0   # 每个处理器自带自己的点击计数
    def on_click():
        nonlocal click_count
        click_count += 1
        print(f"用户 {user_name} 点击了按钮 {button_id}（第 {click_count} 次）")
    return on_click

# 模拟给不同用户注册不同按钮的回调
handlers = [
    make_handler("张三", "submit"),
    make_handler("李四", "cancel"),
    make_handler("张三", "save"),
]

# 模拟框架事件触发
for handler in handlers:
    handler()
# 输出：
# 用户 张三 点击了按钮 submit（第 1 次）
# 用户 李四 点击了按钮 cancel（第 1 次）
# 用户 张三 点击了按钮 save（第 1 次）

handlers[0]()   # 张三 又点了一次 submit
handlers[0]()
# 输出：
# 用户 张三 点击了按钮 submit（第 2 次）
# 用户 张三 点击了按钮 submit（第 3 次）
```

`make_handler("张三", "submit")` 返回的 `on_click` 是一个闭包，它身上同时绑了三个变量：`user_name="张三"`、`button_id="submit"`、`click_count=0`。框架只看到一个"无参数的回调函数"，但它执行时却能正确说出是哪个用户、哪个按钮、第几次点击——全靠闭包携带上下文。

另一个典型例子是异步任务的完成回调，需要知道"是哪个任务完成了"：

```python
def make_completion_callback(task_id, task_name):
    """生成一个异步任务完成时的回调"""
    def on_complete(result):
        status = "成功" if result is not None else "失败"
        print(f"任务 [{task_id}] {task_name} 已完成，状态：{status}，结果：{result}")
    return on_complete

def run_async(task_name, callback):
    """模拟一个异步执行器：执行完任务后调用回调"""
    print(f"开始执行任务：{task_name}")
    # 模拟计算结果
    result = len(task_name)   # 假装这是个耗时计算
    callback(result)

callback1 = make_completion_callback(task_id="T001", task_name="导出报表")
callback2 = make_completion_callback(task_id="T002", task_name="清理日志")

run_async("导出报表", callback1)
# 输出：
# 开始执行任务：导出报表
# 任务 [T001] 导出报表 已完成，状态：成功，结果：4

run_async("清理日志", callback2)
# 输出：
# 开始执行任务：清理日志
# 任务 [T002] 清理日志 已完成，状态：成功，结果：4
```

注意 `run_async` 的签名只接受 `callback(result)` 这种单参数回调，它对 `task_id`、`task_name` 一无所知。但回调被触发时却能正确报出这两个信息——闭包把"注册时的上下文"和"执行时的参数"无缝拼在一起。

**为何用闭包而非 lambda + 默认参数**

有人说这可以用 `lambda` 加默认参数做到：

```python
task_id, task_name = "T001", "导出报表"
callback = lambda result, tid=task_id, tname=task_name: print(f"任务 [{tid}] {tname} 完成，结果：{result}")
```

这确实可行，但有两个缺点：一是不能带状态（像 `click_count` 那种需要跨调用累加的状态，lambda 做不到，因为 lambda 里不能写 `nonlocal`）；二是当上下文变量多了，参数列表会变长，可读性下降。**闭包更适合"上下文 + 状态"都有的场景，lambda 只适合"只绑定几个只读上下文"的简单场景。**

**为何用闭包而非类**

可以用一个带 `__call__` 的类来替代：

```python
class ClickHandler:
    def __init__(self, user_name, button_id):
        self.user_name = user_name
        self.button_id = button_id
        self.click_count = 0
    def __call__(self):
        self.click_count += 1
        print(f"用户 {self.user_name} 点击了按钮 {self.button_id}（第 {self.click_count} 次）")
```

功能等价，取舍点同前：状态简短时闭包更轻，状态多、行为多时类更清楚。

### 2.6 偏函数应用与柯里化：用闭包固定部分参数

动机：有时候一个函数参数太多，而你调用时不总是要全部指定——某些参数在特定场景下是固定的。你希望"预先固定一部分参数，得到一个参数更少的新函数"，这就是**偏函数应用**（partial application）。进一步，如果每个参数都单独固定、函数被逐层"消化"，那就是**柯里化**（currying）。

Python 标准库 `functools.partial` 提供了这个能力，而它本身就是用闭包实现的。我们先看看 `partial` 怎么用，再手动实现一个，理解闭包在其中扮演的角色。

`functools.partial` 的典型场景：把 `int` 的 `base` 参数固定下来，得到一个专门做"二进制转十进制"的函数。

```python
from functools import partial

# int(x, base=10) 是内置函数，base 默认 10
# 用 partial 把 base 固定为 2，得到一个"把二进制字符串转成整数"的专用函数
bin2dec = partial(int, base=2)

print(bin2dec("1010"))    # 输出：10
print(bin2dec("1111"))    # 输出：15
print(bin2dec("100000"))  # 输出：32
```

`partial(int, base=2)` 做的事是：返回一个新函数，这个新函数调用时会把 `base=2` 自动带上。`base=2` 这个配置就是被闭包捕获的。

手动实现一个简化版 `partial`，看清楚闭包在哪：

```python
def my_partial(func, *fixed_args, **fixed_kwargs):
    """手写偏函数：把 func 的部分参数固定下来，返回一个新函数"""
    def wrapper(*args, **kwargs):
        # 调用时，把固定参数和调用时传入的参数合并，交给原函数
        merged_kwargs = {**fixed_kwargs, **kwargs}
        return func(*fixed_args, *args, **merged_kwargs)
    return wrapper

bin2dec = my_partial(int, base=2)
print(bin2dec("1010"))    # 输出：10

# 再来一个：固定 print 的 sep 参数，得到一个"用 -> 拼接"的专用打印函数
arrow_print = my_partial(print, sep=" -> ")
arrow_print("a", "b", "c")
# 输出：a -> b -> c
```

`wrapper` 闭包捕获了 `func`、`fixed_args`、`fixed_kwargs` 三样东西。每次 `bin2dec("1010")` 调用，其实是 `wrapper("1010")`，内部把 `fixed_kwargs={"base": 2}` 和当前调用的 `kwargs={}` 合并，交给 `int("1010", base=2)`。

**柯里化**是偏函数应用的极端形式：把一个多参数函数拆成一串单参数函数，每调用一次固定一个参数。Python 原生不强制柯里化，但可以用闭包手动构造：

```python
def add(a):
    def add_b(b):
        def add_c(c):
            return a + b + c     # a、b、c 分别来自三层外层作用域
        return add_c
    return add_b

print(add(1)(2)(3))    # 输出：6
print(add(10)(20)(30))  # 输出：60

# 也可以分步调用
step1 = add(100)        # 固定 a=100
step2 = step1(20)       # 固定 b=20
print(step2(3))         # 固定 c=3，得到 123
# 输出：123
```

这是三层嵌套的闭包：最外层 `add` 捕获 `a`，中间 `add_b` 捕获 `b`，最内层 `add_c` 捕获 `c`，最后把三者相加。实际工程里手动柯里化的场景不多，因为 Python 有更灵活的参数语法；但理解这层结构有助于你在函数式风格库里阅读类似的链式调用。

**为何闭包比 lambda + 默认参数更合适**

对于 `bin2dec` 这样"固定一个固定值"的场景，lambda 也能做：

```python
bin2dec = lambda s: int(s, base=2)
```

短，能用。但它的局限是：lambda 只能固定静态值，不能在运行时动态"根据已固定的参数组装调用"，而且当参数多了之后可读性差。`partial` 用闭包实现，能统一处理位置参数和关键字参数、能被叠加使用（`partial(partial(f, a=1), b=2)`），更通用。

### 2.7 私有命名空间：用闭包隐藏内部数据

动机：Python 没有 `private` 关键字，类里的"私有"靠的是命名约定（下划线前缀）而非强制。如果你希望某些变量真的对外不可见、只能通过预定的几个接口去访问，闭包能提供一种比下划线更硬的封装——变量干脆就不在对象的属性里，外部根本够不到。

典型场景：一个"存钱罐"，只允许通过 `deposit` 存钱、`get_balance` 查余额，不允许直接改余额。用闭包来做：

```python
def make_wallet(initial_balance=0):
    """一个用闭包封装的电子钱包"""
    balance = initial_balance      # 余额存在闭包里，外部无法直接访问
    history = []                    # 交易历史同样藏在闭包里

    def deposit(amount):
        nonlocal balance
        if amount <= 0:
            print("存入金额必须大于 0")
            return
        balance += amount
        history.append(("存入", amount))
        print(f"存入 {amount}，当前余额 {balance}")

    def withdraw(amount):
        nonlocal balance
        if amount <= 0:
            print("取出金额必须大于 0")
            return
        if amount > balance:
            print(f"余额不足，当前余额仅 {balance}")
            return
        balance -= amount
        history.append(("取出", amount))
        print(f"取出 {amount}，当前余额 {balance}")

    def get_balance():
        return balance

    def get_history():
        return list(history)        # 返回副本，避免外部篡改

    # 返回一组受控的接口函数，每个都是闭包
    return {
        "deposit": deposit,
        "withdraw": withdraw,
        "get_balance": get_balance,
        "get_history": get_history,
    }

wallet = make_wallet(100)
wallet["deposit"](50)      # 输出：存入 50，当前余额 150
wallet["withdraw"](30)     # 输出：取出 30，当前余额 120
wallet["withdraw"](500)    # 输出：余额不足，当前余额仅 120
print(wallet["get_balance"]())      # 输出：120
print(wallet["get_history"]())      # 输出：[('存入', 50), ('取出', 30)]

# 尝试从外部直接访问 balance？找不到这个名字——它根本没有暴露
# wallet.balance         # AttributeError: 'dict' 对象没有 balance
# balance                # NameError: 全局也没有 balance
```

`balance` 和 `history` 这两个变量没有挂成任何对象的属性，它们只存在于 `make_wallet` 的闭包里。外部能拿到的只有 `make_wallet` 返回的那个字典，字典里是四个闭包函数。这四个函数都捕获了 `balance` 和 `history`，所以能读写它们；而外部代码没有这两个名字的任何访问入口，只能走这四个接口。

这种"用闭包 + 函数集合模拟私有数据"的写法，在 JavaScript 里非常常见（模块模式），在 Python 里虽然不如类主流，但在"状态简单、又确实想要硬封装"时是个不错的选择。

**为何用闭包而非带下划线的类**

类版本：

```python
class Wallet:
    def __init__(self, initial_balance=0):
        self._balance = initial_balance
        self._history = []
    def deposit(self, amount):
        if amount > 0:
            self._balance += amount
            self._history.append(("存入", amount))
    ...

wallet = Wallet(100)
wallet.deposit(50)
wallet._balance       # 下划线只是约定，技术上仍可访问
wallet._balance = -999  # 甚至可以直接篡改
```

下划线约定要求"所有人都自觉不碰"，但 Python 解释器不强制，碰了也不报错。闭包版本则真正做到了"外部够不到"——`balance` 这个名字在闭包外根本不存在，你就算想碰也没有可访问的入口。这是闭包在封装上比类更硬的地方。

反过来，类的优势在于：可读性、可调试性（`dir(wallet)` 能看到属性）、可继承。当"绝对的私有"不是硬需求时，类仍然是默认选项。

### 2.8 生成器与闭包结合：带状态的惰性序列

动机：生成器函数本身就有"挂起-恢复"的能力，执行到 `yield` 暂停，下次 `next` 时从暂停处继续，中间的局部变量会被保留。这其实和闭包"记住外层变量"是同一种机制在不同层面的体现。把闭包和生成器结合，可以做出"带配置、带状态、惰式产出"的序列生成器。

看一个例子：带起始值和步长的无限等差数列生成器。外层函数接收配置（start、step），内层生成器闭包捕获这些配置，产生无穷序列。

```python
def make_counter_stream(start, step):
    """生成一个从 start 开始、每次加 step 的无穷计数流"""
    def stream():
        current = start       # current 是生成器的局部状态
        while True:
            yield current
            current += step    # 改的是生成器自己的 current，不影响 step
    return stream

positive = make_counter_stream(start=1, step=1)()    # 正整数流
even = make_counter_stream(start=0, step=2)()        # 偶数流

print(next(positive))    # 输出：1
print(next(positive))    # 输出：2
print(next(positive))    # 输出：3
print(next(even))        # 输出：0
print(next(even))        # 输出：2
print(next(positive))    # 输出：4（positive 自己的状态独立保存）
```

`stream` 是一个生成器函数，它的闭包捕获了外层的 `start` 和 `step`。`start` 被用来初始化生成器内部的 `current`；`step` 被用来在每次循环里递增。`positive` 和 `even` 是两次独立调用 `make_counter_stream` 后再调用得到的生成器对象，各自有独立的 `current` 状态。

再进一步，把闭包的状态保持和生成器的惰性结合，做一个"分页拉取器"。模拟从某个 "大数据源" 按页拉取，每页 10 条，闭包记录当前页码，生成器惰式产出每一页。

```python
def make_paginator(fetch_page, page_size=10):
    """生成一个分页迭代器：每次 next 拉取下一页
    fetch_page(page_num, page_size) 是由调用方提供的"拉取单页"函数
    """
    def iterator():
        page_num = 0
        while True:
            rows = fetch_page(page_num, page_size)
            if not rows:           # 没有更多数据，停止迭代
                break
            yield page_num, rows
            page_num += 1
    return iterator

# 模拟一个数据源：总共 25 条数据
all_data = [f"记录-{i}" for i in range(25)]

def fetch_page(page_num, page_size):
    start = page_num * page_size
    return all_data[start:start + page_size]

paginator = make_paginator(fetch_page, page_size=10)()
for page_num, rows in paginator:
    print(f"第 {page_num} 页：{rows}")
# 输出：
# 第 0 页：['记录-0', '记录-1', '记录-2', '记录-3', '记录-4', '记录-5', '记录-6', '记录-7', '记录-8', '记录-9']
# 第 1 页：['记录-10', '记录-11', '记录-12', '记录-13', '记录-14', '记录-15', '记录-16', '记录-17', '记录-18', '记录-19']
# 第 2 页：['记录-20', '记录-21', '记录-22', '记录-23', '记录-24']
```

`make_paginator` 把"分页大小"`page_size` 和"拉取单页的逻辑"`fetch_page` 都绑在闭包上，内部生成器只负责迭代和推进页码。调用方用 `for page_num, rows in paginator` 就能逐页消费，不用关心页码怎么推进、什么时候该停——这些都被闭包+生成器封装了。

**为何用闭包而非纯生成器或类**

纯生成器（不带外层闭包）也能实现等差数列，但参数得在生成器自己的签名上：

```python
def counter_stream(start, step):
    current = start
    while True:
        yield current
        current += step
```

能用，但每次 `next` 调用后如果想再得到一个"同样配置"的新流，配置参数 `start`/`step` 必须重新传一遍，没有"把配置固化下来"的便捷手段。而闭包版本 `make_counter_stream(start=1, step=1)` 本身就是个"配置好的流工厂"，`make_counter_stream(1, 1)` 调用一次就把配置焊死，之后再 `()` 得到的都是带这个配置的新流，配置无须重复传。

如果状态更复杂（比如还要记录总产出量、支持重置等），类版本会更合适，理由同前。

### 2.9 场景横向对比

前面 8 个场景各自讲了动机和取舍，这里做一次横向对比，帮助你在面对需求时快速选型。

| 需求特征 | 推荐场景 | 典型写法 | 状态来源 |
|---|---|---|---|
| 包装原函数、加增强行为 | 装饰器 | `@deco` + `wrapper` 闭包 | 捕获原函数 |
| 把配置固化成专用函数 | 函数工厂 | 外层收配置、内层用配置 | 捕获配置参数 |
| 跨调用保持简单状态 | 状态保持 | 外层定义状态、`nonlocal` 修改 | 捕获可变状态 |
| 缓存纯函数结果 | memoize | 闭包字典 + 命中检查 | 捕获缓存字典 |
| 回调携带上下文 | 回调处理 | 闭包捕获上下文变量 | 捕获上下文 |
| 固定部分参数 | 偏函数/柯里化 | 闭包捕获已固定参数 | 捕获固定参数 |
| 隐藏内部数据 | 私有命名空间 | 闭包封装状态、返回接口函数 | 闭包内变量 |
| 惰式带配置序列 | 生成器+闭包 | 外层配置、内层生成器 | 闭包配置 + 生成器局部状态 |

一个共通的判断准则：**只要你想"把一些数据焊在一个函数身上、让它随身带"，而且数据量不大、行为不复杂，闭包就是首选；数据量大、行为复杂、需要继承或多态时，转向类。**

## 3. 最佳实践

### 3.1 不要用可变默认参数冒充闭包

很多人在写"带缓存"或"带状态"的函数时，会顺手写出这样的代码：

```python
# 不推荐：用可变默认参数当缓存
def fib(n, cache={}):
    if n in cache:
        return cache[n]
    if n < 2:
        return n
    result = fib(n - 1) + fib(n - 2)
    cache[n] = result
    return result
```

看起来能用，`cache={}` 作为默认参数，在函数定义时只创建一次、之后复用，确实起到了"跨调用持久存在"的效果。但这种写法有两个问题：第一，`cache` 暴露在函数签名上，调用方完全可以 `fib(10, cache={})` 传一个自己的字典进来，破坏缓存语义；第二，这是"默认参数陷阱"的一个变种，读代码的人不容易看明白这个 `cache` 为什么能持久存在，可读性差。

推荐用闭包或装饰器版本：

```python
# 推荐：缓存藏在闭包里，调用方碰不到
def memoize(func):
    cache = {}
    def wrapper(*args):
        if args not in cache:
            cache[args] = func(*args)
        return cache[args]
    return wrapper

@memoize
def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)
```

缓存字典 `cache` 在闭包里，调用方只能调 `fib(n)`，无法直接操作 `cache`，语义干净。

### 3.2 闭包里修改外层变量一定要 `nonlocal`

这是上一篇反复强调的坑，本篇再次在实际场景中遇到——只要你的闭包需要"更新"外层状态（计数器、累加器、钱包余额），就必须写 `nonlocal`，否则赋值会变成"定义新的局部变量"，状态不会真正更新，而且不会报错，是最难查的那种 bug。

```python
# 不推荐：忘记 nonlocal，计数器永远返回 1
def make_counter_bad():
    count = 0
    def counter():
        count += 1    # UnboundLocalError：count 被当成局部变量，但还没赋值就读了
        return count
    return counter

# 推荐：显式声明 nonlocal
def make_counter_good():
    count = 0
    def counter():
        nonlocal count
        count += 1
        return count
    return counter
```

如果只是"读"外层变量而不"写"，不需要 `nonlocal`，因为 Python 的 LEGB 查找机制天然会向外找到它。`nonlocal` 只在你需要"重新赋值"时才必须。

### 3.3 闭包不要捕获过大的作用域

闭包捕获的是整个外层作用域的变量绑定，不是"只捕获你用到的那个变量"。虽然 CPython 的实现实际上只把用到的变量放进 `__closure__`，但读代码的人看到内层函数时，仍会觉得"它能访问外层所有局部变量"。如果外层函数很长、定义了大量临时变量，内层闭包的可读性会下降——读者得回到外层去找每个名字的来源。

推荐做法：**把闭包需要用到的变量，集中放在一个短小的外层函数里**，外层函数只负责"配置 + 返回闭包"，不要掺入大量无关逻辑。如果外层逻辑确实很多，应该把它拆成一个类，把状态存成实例属性，比塞在一个超长作用域里清楚得多。

### 3.4 不要用闭包替代所有类

闭包能在"简单状态"场景下替代类，但下面这些情况请老老实实用类：

- 状态变量超过三四个，或者行为方法超过三四个。
- 需要继承、多态、`isinstance` 判断。
- 需要让外部代码能 `dir()` 看到、能调试器里展开查看属性。
- 需要支持 `pickle` 序列化（闭包函数通常不可 pickle）。
- 需要多个方法共享同一份状态（类里 `self.xxx` 自然共享，闭包要靠手工把多个内部函数都返回出去）。

一个实战经验值：**闭包适合"一个状态 + 一个行为"，类适合"多个状态 + 多个行为"**。踩到这条线就把闭包改成类，不要硬撑。

### 3.5 注意闭包捕获的是变量而非值

这是一个经典陷阱：在循环里创建闭包时，所有闭包捕获的是同一个循环变量，而不是每次迭代时的值。

```python
# 不推荐：循环里建闭包，全都捕获到最后的值
funcs = []
for i in range(3):
    funcs.append(lambda: i)       # 所有 lambda 都看同一个 i

print([f() for f in funcs])
# 输出：[2, 2, 2]   而非 [0, 1, 2]
```

循环结束后 `i` 的值是 2，所有闭包都引用这个名字，调用的都是 2。正确写法有两种：

用默认参数把当前值固化下来：

```python
funcs = [lambda i=i: i for i in range(3)]
print([f() for f in funcs])    # 输出：[0, 1, 2]
```

或者用一个工厂函数显式建闭包：

```python
def make_func(value):
    return lambda: value

funcs = [make_func(i) for i in range(3)]
print([f() for f in funcs])    # 输出：[0, 1, 2]
```

`make_func(i)` 每次调用产生一个独立作用域，`value` 是该作用域的参数，lambda 捕获的是"这次调用的 value"，不再受外层 `i` 变动影响。这个坑在装饰器工厂、回调注册等场景里很常见，务必留意。

### 3.6 闭包与可变对象：小心"被捕获的列表被多方修改"

闭包捕获的是变量绑定，如果这个变量指向一个可变对象（列表、字典、集合），那么所有共享这个闭包的函数都能就地修改它。这在 memoize 场景里是有意为之——`cache` 字典就该被 `wrapper` 读写。但在别处可能出现意外共享：

```python
def make_shared_list():
    shared = []                  # 一个被两个闭包共享的列表
    def add(x):
        shared.append(x)
        return shared
    def get():
        return shared
    return add, get

add, get = make_shared_list()
add(1)
add(2)
print(get())     # 输出：[1, 2]
other_add, _ = make_shared_list()   # 新的工厂调用产生新的 shared
other_add(99)
print(get())     # 输出：[1, 2]   <- 旧 shared 没被影响，因为是另一份闭包
```

如果两次工厂调用是独立的，共享只发生在同一份闭包内的多个函数之间，没问题。真正要警惕的是：你想"每个函数有自己独立的状态"，却不小心让它们指向了同一个可变对象。出现这种 bug 时，检查一下你是不是在某个不该共享的层把可变对象定义在外层、然后被多个内层函数同时捕获了。

## 4. 原理

### 4.1 闭包在每个场景里到底捕获了什么

上一篇讲过闭包的底层机制：内层函数通过 `__closure__` 属性持有若干 `cell` 对象，每个 cell 指向一个外层变量的值。本篇不重复这些细节，只把每个场景下"到底捕获了什么、状态如何持久"讲清楚，帮助你把"用在哪"和"底层是什么"对应起来。

**装饰器场景**：`wrapper` 的 `__closure__` 里有一个 cell，指向被装饰的原函数 `func`。状态持久化方式是"原函数对象本身常驻内存、闭包持有它的引用"。装饰器本身不持有可变状态，只有这一份只读引用。

**函数工厂场景**：内层函数捕获的是外层的配置参数（如 `tax_rate`、`prefix`、`level`），通常是不可变对象（数字、字符串）。每次工厂调用产生一份新的 cell，对应一份独立的配置。状态是"只读"的——内层函数只读不写，所以不需要 `nonlocal`。

**状态保持场景**：内层函数捕获的是外层的可变状态（如 `count`、`total`），并且要修改它。这时不仅要持有 cell，还要靠 `nonlocal` 声明去"穿透"局部作用域、真正写回 cell 里的值。变量本身可能是 `int` 这种不可变对象——"不可变"是说每次 `+= 1` 都产生一个新 int，但 cell 指向的引用会更新到新 int 上，对外表现就是"状态被修改了"。

**memoize 场景**：`wrapper` 捕获两样东西：原函数 `func`（只读引用）和缓存字典 `cache`（可变对象）。`cache` 是字典，是可变的，所以 `wrapper` 不需要 `nonlocal` 就能 `cache[args] = result`——它修改的是字典对象本身，没有重新赋值 `cache` 这个名字。这一点和状态保持场景有微妙差别：前者改的是"可变对象的内容"，后者改的是"变量指向的对象"，只有后者才需要 `nonlocal`。

**回调场景**：闭包捕获的是注册时的上下文变量（`user_name`、`button_id`）加上可能的可变状态（`click_count`）。只读上下文不需要 `nonlocal`，要更新的状态才需要。

**偏函数场景**：`wrapper` 捕获 `func`、`fixed_args`、`fixed_kwargs`，全部只读。偏函数不持有可变状态，只是把固定参数合并到每次调用里。

**私有命名空间场景**：多个内部函数共享同一份闭包变量（`balance`、`history`）。只要某个变量需要被某个内部函数重新赋值（`balance += amount`），那个函数就要 `nonlocal balance`。如果只是就地修改可变对象（`history.append(...)`），则不需要 `nonlocal`。多份闭包共享同一组 cell 是这种"接口集合"模式的关键。

**生成器+闭包场景**：外层闭包捕获的是配置（`start`、`step`），通常只读；内层生成器自己的局部状态（`current`、`page_num`）则走生成器的帧挂起机制——生成器对象自己持有它的执行帧，`yield` 时帧不销毁，`next` 时恢复，所以这些局部变量天然持久，不需要任何 `nonlocal`。

### 4.2 闭包状态 vs 类实例状态：内存与机制对比

现在把视角拉高，对比"用闭包保持状态"和"用类实例保持状态"在底层有什么区别。

**存储位置**：

- 闭包状态存在内层函数对象的 `__closure__` 属性里，`__closure__` 是一个 tuple，每个元素是一个 cell 对象，cell 的 `cell_contents` 指向真正的值。一个闭包函数就是"函数代码 + 一个 cell tuple"。
- 类实例状态存在实例的 `__dict__` 里（或通过 `__slots__` 的描述符存），每个属性是一个键值对。一个实例就是"类引用 + 一个属性字典"。

**访问方式**：

- 闭包里的变量只能被"定义在闭包内的代码"访问，外部代码没有名字入口，除非把内层函数返回出去。
- 类实例的属性既能被实例方法内部访问（`self.xxx`），也能被外部代码访问（`obj.xxx`），除非显式用 `__` 做名称改写（双下划线才会触发改写，单下划线只是约定）。

**内存开销**：

- 闭包函数对象本身有一个 `__closure__` tuple 和若干 cell，cell 是很轻的对象；相比一个完整的类实例（含 `__dict__` 字典），开销略小，但差距不大。绝大多数场景这点内存差异可以忽略。
- 真正的差距在于"可发现性"和"可调试性"：实例的属性能被 `dir()`、调试器、序列化工具看到；闭包状态藏在 cell 里，只有显式访问 `__closure__` 才能看到，调试器里默认不展开。

**生命周期**：

- 闭包状态的生命周期与内层函数对象绑定——只要这个函数还被引用（比如被赋值给一个变量、注册到一个回调列表），cell 就不会销毁；函数对象失去引用后，cell 随之回收。
- 类实例状态的生命周期与实例对象绑定——实例被引用就存活，失去引用后 `__dict__` 随之回收。两者在生命周期上没有本质差异，都靠引用计数 + 垃圾回收。

**修改语义**：

- 闭包里要修改不可变状态（数字、字符串），必须用 `nonlocal`；修改可变对象内容则直接改。
- 类里要修改实例属性，直接 `self.xxx = ...` 就行，无需任何声明。这是类比闭包更宽松的一点——也正是闭包里漏写 `nonlocal` 容易出 bug 的原因。

把以上对比落到本篇场景上：
- 装饰器、函数工厂、偏函数这种"只读引用外层变量"的场景，闭包比类轻便，没什么劣势。
- 计数器、累加器、钱包这种"需要反复修改状态"的场景，闭包能用但每处修改都得写 `nonlocal`，类则更省心。状态越多，`nonlocal` 越多，可读性越差，此时类更合适。
- memoize 这种"持有可变字典、就地修改"的场景，闭包天然契合，因为字典本来就可变、不需要 `nonlocal`。

### 4.3 为什么循环里的闭包会共享同一个变量

3.5 节给出了循环闭包陷阱的写法和修法，这里补上机制解释，帮助理解"闭包捕获的是变量，不是值"。

Python 的 `for` 循环不创建新的作用域——循环变量 `i` 在循环结束后仍然存在于 enclosing 作用域里，值是最后一次迭代后的值。循环里定义的每个 lambda 都引用 `i` 这个名字，而它们共享的是同一个作用域里的同一个 `i`。当循环结束、所有 lambda 被调用时，它们去查 `i`，拿到的都是"循环结束后的最终值"。

用工厂函数能绕开这个坑，是因为每次调用 `make_func(i)` 都会创建一个新的函数作用域，`value` 是这个新作用域的参数。每个 lambda 捕获的是各自那次调用的 `value`，互不相同。本质上是用"新作用域"把"当前值"固化下来，切断了和循环变量 `i` 的引用关系。

用默认参数 `lambda i=i: i` 起的是同样效果：默认参数在函数定义时求值，会把当前 `i` 的值存成一个默认值。每个 lambda 因此有了各自独立的、固化的 `i`。这两种修法都是"用绑定固化当前值"，只是落点不同。

## 5. 总结

本篇承接闭包概念篇，聚焦工程中的 8 个典型应用场景，每个场景都给出了动机、可运行示例和与替代方案的对比。

**场景回顾**：

- 装饰器：闭包最经典应用，通过捕获原函数实现"不改原函数就增强行为"。
- 配置化函数工厂：用闭包把配置焊在函数身上，得到一组结构相同、配置不同的专用函数。
- 状态保持：用闭包 + `nonlocal` 在多次调用之间保存简单状态，无需写类。
- 缓存与 memoize：用闭包封装缓存字典，给纯函数加速。
- 回调与事件处理：用闭包携带注册时的上下文，让框架回调能拿到额外信息。
- 偏函数应用与柯里化：用闭包固定部分参数，得到参数更少的新函数。
- 私有命名空间：用闭包隐藏内部数据，只暴露受控接口，封装比下划线更硬。
- 生成器与闭包结合：把配置焊在闭包上、把状态交给生成器帧，做出带配置的惰性序列。

**核心准则**：闭包适合"数据量小、行为简单、把数据焊在函数身上"的场景；一旦状态多、方法多、需要继承或调试可见性，就改用类。不要为了"显得函数式"而硬用闭包替代所有类。

**读完应能掌握**：

- 能说出闭包在装饰器、函数工厂、状态保持、memoize、回调、偏函数、私有命名空间、生成器结合中分别起什么作用。
- 面对一个新需求，能判断"该用闭包还是该用类"，并给出判断理由。
- 能写出带缓存的递归函数、带状态的计数器、携带上下文的事件回调、配置化的日志格式器，并解释闭包在每段代码里捕获了什么。
- 能说清闭包状态与类实例状态在存储位置、访问方式、修改语义上的区别。
- 能识别并修复循环里创建闭包时的"捕获变量而非值"陷阱。