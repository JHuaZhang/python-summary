---
group:
  title: 【19】标准库精讲
  order: 19
order: 20
title: functools 常用工具
nav:
  title: Python
  order: 1
---

## 1. 介绍

### 1.1 什么是 functools

`functools` 是 Python 标准库中专门为「函数式编程」提供高阶工具的模块。所谓高阶工具，指的是那些以函数为处理对象、用来增强或改造函数行为的工具——接收一个函数、返回一个功能更强的新函数，或者把一个函数变换成另一种调用形态。

在很多语言里，函数式编程意味着 `map`/`filter`/`reduce` 这类组合子。Python 把这些组合子放在了内置函数（`map`/`filter`）和 `functools`（`reduce`）里，但 `functools` 的真正价值远不止于此：它提供了一批面向「工程实战」的工具，用来解决以下几类常见痛点——

- 装饰器写完之后原函数信息丢失（`@wraps`）；
- 纯函数重复计算同一组参数开销大（`lru_cache`/`cache`）；
- 需要固定函数的部分参数、生成一个专门用途的函数（`partial`）；
- 需要按参数类型分派到不同实现（`singledispatch`）；
- 需要把昂贵计算结果缓存为属性（`cached_property`）；
- 定义类时只愿写两个比较方法，希望其他比较运算自动补全（`total_ordering`）；
- 老式 `cmp` 函数想用到新式 `key` 接口里（`cmp_to_key`）。

这些工具共同体现的函数式思想是：**把「函数」当作可组合的数据来处理——包装它、缓存它、固定它的参数、按类型分派它——而原始函数本身不被修改。** 这种「不修改原函数、只在外面包一层」的风格，正是装饰器和高阶函数能在 Python 里大行其道的原因。

本篇会把 `functools` 里最常用的工具逐一精讲，给出全貌。其中 `@wraps`、`lru_cache`、`reduce` 在前面的笔记里已经详讲过（分别在【14】04、【14】08、【13】04），本篇会给它们完整的定位与简明回顾，并把重心放在其它工具以及「`functools` 作为整体该如何选用」上。

### 1.2 基本语法与最小用法

`functools` 是标准库，直接 `import` 即可，无需安装：

```python
import functools
```

最小用法示意——用 `@functools.wraps` 写一个「不改写原函数元信息」的装饰器，再调用它：

```python
import functools

def log_call(func):
    @functools.wraps(func)          # 保留原函数的 __name__ / __doc__ 等信息
    def wrapper(*args, **kwargs):
        print(f"调用 {func.__name__}，参数 args={args} kwargs={kwargs}")
        return func(*args, **kwargs)
    return wrapper

@log_call
def greet(name):
    """向对方打招呼。"""
    return f"你好，{name}！"

print(greet("小张"))
print(greet.__name__)     # 没有 @wraps 时这里会变成 'wrapper'
print(greet.__doc__)
# 输出：
# 调用 greet，参数 args=('小张',) kwargs={}
# 你好，小张！
# greet
# 向对方打招呼。
```

这个例子同时点出了 `functools` 的两个核心特征：它处理的是「函数」这个对象；它通过「在原函数外面包一层」来增强行为，而不侵入原函数体。下面的章节会把每个工具的适用场景、参数细节、背后原理逐一展开。

## 2. 核心内容

### 2.1 @functools.wraps(wrapped)：保留原函数元信息

**作用与何时用**

写装饰器时，装饰器返回的 `wrapper` 函数会"顶替"原函数被对外使用。如果不做任何处理，外界拿到的 `__name__`、`__doc__`、`__module__`、`__qualname__`、`__dict__` 等属性都会变成 `wrapper` 自己的，原函数的元信息丢失。这会导致：

- `help(原函数)` 显示的是 `wrapper` 的文档（通常是 `None`）；
- 调试器、日志、序列化框架（如 `pickle`）、API 文档生成器（如 Sphinx）都拿不到真实函数名；
- 多层装饰器嵌套时，名字一层层被覆盖，排查问题困难。

`@functools.wraps(wrapped)` 就是用来自动把 `wrapped`（原函数）的关键属性复制到 `wrapper` 上的装饰器。它还有两个可选参数：

- `updated`：默认 `None`，等价于 `wrapper.__dict__.update(wrapped.__dict__)`，把原函数实例属性字典也合并过来；若传一个序列（如 `()`），则只更新 `__dict__` 中 `updated` 里列出的属性（一般用不到）。
- `assigned`：默认 `WRAPPER_ASSIGNMENTS`（`__module__`、`__name__`、`__qualname__`、`__annotations__`、`__doc__`），指定要复制哪些属性。

绝大多数场景只需 `@functools.wraps(func)` 即可，不必传参。关于 `wraps` 的本质、`update_wrapper` 的细节、`__wrapped__` 属性的用途，在【14】04 已详讲，这里给出回顾与一个工程感的例子。

**demo：三层装饰器链下名字是否丢失的对比**

```python
import functools

# 不使用 wraps 的装饰器
def deco_no_wrap(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

# 使用 wraps 的装饰器
def deco_with_wrap(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

@deco_no_wrap
@deco_no_wrap
@deco_no_wrap
def f_naive(x):
    """f_naive 的文档。"""
    return x

@deco_with_wrap
@deco_with_wrap
@deco_with_wrap
def f_safe(x):
    """f_safe 的文档。"""
    return x

print(f_naive.__name__, "|", f_naive.__doc__)
print(f_safe.__name__,  "|", f_safe.__doc__)
# 输出：
# wrapper | None
# f_safe | f_safe 的文档。
```

可以看到，三层不包 `wraps` 的装饰器层层覆盖，最终对外暴露的名字变成无意义的 `wrapper`、文档变为 `None`；而加了 `wraps` 的版本，即使三层嵌套，名字与文档依然忠实保留——因为每一层都把"上一层看到的真实函数"的属性往上传。这也是为什么"写装饰器必加 `wraps`"被当作一条工程铁律。

### 2.2 functools.lru_cache(maxsize=128, typed=False)：LRU 缓存纯函数

**作用与何时用**

当一个函数满足两个条件——（1）对相同输入永远返回相同输出（纯函数）；（2）相同输入被反复调用、且计算/IO 开销可观——就适合用 `lru_cache` 缓存它的返回值。典型场景：递归求斐波那契数、按 URL 拉取远端配置、按坐标做地理编码、读取小文件解析等。

`lru_cache` 是一个装饰器，可以直接 `@lru_cache` 用默认参数，也可以显式传参：

- `maxsize`：缓存最多保存多少条结果。`None` 表示无上限（退化为普通字典缓存）；正整数表示用 LRU（最近最少使用）策略在超容量时淘汰最久未命中的条目。默认 `128`。
- `typed`：是否区分类型。`False`（默认）下 `1` 与 `1.0` 视为同一键；`True` 下视为不同键。`True` 适合需要严格按类型区分语义的场合，但通常会让命中率下降。

`lru_cache` 内部实现机制、`OrderedDict`/字典+双向链表、与手写缓存的对比，详见 【14】08 的原理讲解；本篇给出一个场景化例子和 `cache_info`/`cache_clear` 的用法（见 2.4 节专题）。

**demo：递归斐波那契，对比缓存前后调用次数**

```python
import functools

# 不缓存：指数级重复调用
def fib_naive(n):
    return n if n < 2 else fib_naive(n - 1) + fib_naive(n - 2)

# 缓存：每个 n 只算一次
@functools.lru_cache(maxsize=None)
def fib_cached(n):
    return n if n < 2 else fib_cached(n - 1) + fib_cached(n - 2)

print(fib_naive(20))      # 已经偏慢
print(fib_cached(100))    # 若不缓存，这会算到天荒地老
# 输出：
# 6765
# 354224848179261915075

# 看看缓存命中情况
print(fib_cached.cache_info())
# 输出：
# CacheInfo(hits=98, misses=101, maxsize=None, currsize=101)
```

`cache_info` 报告中的 `hits` 是命中次数、`misses` 是未命中（实际执行函数）次数。上面 `fib_cached(100)` 涉及 101 个不同入参（0..100），每个第一次算时 miss，之后 98 次递归调用全部命中——如果没有缓存，这些都会重复计算。

### 2.3 functools.cache：LRU 缓存的"无限版"（3.9+）

**作用与何时用**

`functools.cache` 是 Python 3.9 新增的便捷工具，它本质等价于 `lru_cache(maxsize=None)`：**不设上限、不做淘汰**，只做"输入→输出"的字典式缓存。存在的意义是把这种最常见的"我就想要个无限缓存"场景写成一行更可读的代码：

```python
@functools.cache          # 等价于 @functools.lru_cache(maxsize=None)
def load_config(path):
    ...  # 读文件并解析
```

什么时候选 `cache`、什么时候选 `lru_cache(maxsize=N)`？

- **键空间可数且不大**（如配置文件路径、固定枚举参数）：用 `cache`，不需要淘汰，代码更简洁。
- **键空间可能无限增长**（如接收用户自由输入的字符串、递增的 ID）：必须用 `lru_cache(maxsize=N)`，否则缓存会无限膨胀、吃光内存。
- 需要区分 `1` 和 `1.0`：仍要用 `lru_cache(typed=True)`，因为 `cache` 不接受 `typed` 参数。

**demo：用 cache 缓存一个读配置函数，展示"同一参数只读一次盘"**

```python
import functools

read_counter = {"n": 0}                  # 用字典当可变计数器，绕开 nonlocal

@functools.cache
def read_section(section):
    read_counter["n"] += 1               # 模拟一次磁盘读取
    return f"<配置：{section}>"

print(read_section("db"))
print(read_section("redis"))
print(read_section("db"))               # 同一参数，不会再读盘
print("实际读取次数：", read_counter["n"])
# 输出：
# <配置：db>
# <配置：redis>
# <配置：db>
# 实际读取次数： 2
```

上面用 `read_counter` 这个字典当计数器（因为整型在闭包里不能直接 `nonlocal` 赋值的演示要额外加 `nonlocal`，用字典绕开），直观地看到：调用 3 次但只读了 2 次盘——`"db"` 第二次命中缓存。这就是 `cache` 的核心价值：**用空间换时间，且不让你操心淘汰策略**。

### 2.4 lru_cache 的 cache_info() 与 cache_clear()

`lru_cache`（以及 `cache`）装饰后的函数，会被附加两个方法：`cache_info()` 和 `cache_clear()`。它们在排查"缓存到底有没有生效、命中率多少"时非常关键，却又常被忽略。

- **`cache_info()`**：返回一个 `namedtuple`，字段为 `hits`（命中次数）、`misses`（未命中/实际执行次数）、`maxsize`（容量上限）、`currsize`（当前条目数）。可以 `print` 也可以按字段取值。
- **`cache_clear()`**：清空全部缓存条目，把 `hits`/`misses` 计数归零。适用于"我知道依赖的外部数据变了、缓存应该整体失效"的场景。

注意：`lru_cache` 是按"参数值"做键的，它不知道函数内部依赖了哪些外部可变对象。如果你缓存了一个读文件函数、文件内容被改写了，缓存里仍是旧值——这时需要主动 `cache_clear()`，或者干脆不要缓存这种对外部状态敏感的函数。

**demo：观察命中率、主动清空**

```python
import functools

@functools.lru_cache(maxsize=4)
def square(x):
    return x * x

for x in [1, 2, 1, 3, 1, 2, 4, 5]:   # 1、2 重复，4 会让缓存淘汰最早的
    square(x)

info = square.cache_info()
print(f"命中 {info.hits} 次，未命中 {info.misses} 次，当前 {info.currsize} 条，上限 {info.maxsize}")
# 输出：
# 命中 3 次，未命中 5 次，当前 4 条，上限 4

# 主动清空
square.cache_clear()
print(square.cache_info())
# 输出：
# CacheInfo(hits=0, misses=0, maxsize=4, currsize=0)
```

把 `cache_info` 和单元测试组合起来，可以做出"断言某热点函数命中率符合预期"这类集成校验，比纯靠肉眼看性能更靠谱。

### 2.5 functools.partial(func, /, *args, **kwargs)：偏函数，固定部分参数

**作用与何时用**

`partial` 接收一个可调用对象 `func` 和一部分位置参数 `args`、关键字参数 `kwargs`，返回一个新的可调用对象（`functools.partial` 实例）。调用这个新对象时，相当于把"事先绑定的参数"和"调用时给的参数"拼起来，再去调用 `func`。这叫「偏函数应用」（partial application）：没有真正调用 `func`，只是预先填好一部分参数，得到一个更"专门化"的函数。

适用场景：

- 把一个通用函数改造成一个专门用途的小函数，避免到处重复写同样的固定参数；
- 在回调/事件处理里传一个"已经被预先填好部分参数"的函数；
- 作为 `sorted`/`map` 等接口的 `key`/`func` 参数，又不方便写 lambda 时。

**签名细节**

`partial` 返回的对象有三个只读属性：`.func`（被包装的原函数）、`.args`（绑定的位置参数元组）、`.keywords`（绑定的关键字参数字典），便于调试。它还实现了 `__call__`、`__repr__`，行为上就是个函数。

**demo：固定 `int` 的 base，造一个"十六进制解析器"**

```python
import functools

# int(x, base) 需要两个参数；我们固定 base=16，得到只要传字符串的专用函数
parse_hex = functools.partial(int, base=16)

print(parse_hex("ff"))
print(parse_hex("10"))
print(parse_hex.func, parse_hex.args, parse_hex.keywords)
# 输出：
# 255
# 16
# <class 'int'> () {'base': 16}
```

原本要写 `int("ff", 16)`，每次都得带 `16`；用 `partial` 固定后，`parse_hex` 是个语义清晰的专门函数。这在批量处理时尤其方便：

```python
import functools

parse_hex = functools.partial(int, base=16)
data = ["a", "1f", "deadbeef"]
print(list(map(parse_hex, data)))     # 不必再写 lambda s: int(s, 16)
# 输出：
# [10, 31, 3735928559]
```

**demo：回调场景——给按钮处理器预填用户 ID**

```python
import functools

def handle_event(user_id, event_name, payload):
    print(f"[用户{user_id}] 事件 {event_name}：{payload}")

# 框架只会在事件发生时回调，且只会传 event_name 和 payload，
# 我们用 partial 把当前用户的 id 预先绑进去
on_event_for_user42 = functools.partial(handle_event, 42)

on_event_for_user42("click",   {"x": 10, "y": 20})
on_event_for_user42("scroll",  {"dy": -3})
# 输出：
# [用户42] 事件 click：{'x': 10, 'y': 20}
# [用户42] 事件 scroll：{'dy': -3}
```

这种"把上下文信息冻结进回调"的模式，在 GUI、异步任务、路由分发里非常常见，比用 lambda 闭包更直白、也更容易 pickle（`partial` 对象只要 `func` 和参数都可 pickle 就可序列化）。

**与 lambda 的取舍**

`partial(func, x)` 和 `lambda *a, **k: func(x, *a, **k)` 效果类似，但 `partial` 意图更明确（"我在做参数固定"），且自带 `func/args/keywords` 属性便于调试；lambda 则更灵活（可以做任意表达式）。固定参数优先 `partial`，需要额外逻辑用 `lambda`。

### 2.6 functools.reduce(func, iterable, initial)：累积折叠

**作用与何时用**

`reduce` 把一个二元函数 `func` 依次作用到 `iterable` 的元素上，从左到右不断"折叠"，最终得到一个累计结果。等价于：

```
result = initial
for x in iterable:
    result = func(result, x)
return result
```

`initial` 是可选的初值。不传 `initial` 时，第一次 `func` 的左操作数就是 `iterable` 的第一个元素；如果 `iterable` 为空且没传 `initial`，会抛 `TypeError`。

关于 `reduce` 的完整语义、与 `for` 循环的可读性对比、与 `sum`/`max`/`min`/`itertools.accumulate` 的取舍，已在【13】04 详讲。本篇给出定位与一个典型场景，便于它在 `functools` 全家桶中找到位置。

**demo：把多层嵌套 dict 按 path 折叠取值**

```python
import functools

def deep_get(obj, keys):
    return functools.reduce(lambda cur, key: cur[key], keys, obj)

cfg = {"db": {"pool": {"size": 10}}}
print(deep_get(cfg, ["db", "pool", "size"]))
# 输出：
# 10
```

这种"链式取值/链式转换"是 `reduce` 的经典用法：每一步都以上一步结果为输入。再给一个更直观的累积例子，提醒它就是"带初值的滚动计算"：

```python
import functools

nums = [1, 2, 3, 4]
print(functools.reduce(lambda a, b: a + b, nums, 0))   # 求和
print(functools.reduce(lambda a, b: a * b, nums, 1))   # 阶乘
# 输出：
# 10
# 24
```

工程实践上，能用内置 `sum`/`any`/`all`/`max`/`min` 表达的，就不要用 `reduce`——前者更可读、也更快；需要"以上一步结果为输入滚动推进"的链式逻辑，`reduce` 才是趁手工具。

### 2.7 functools.singledispatch：按第一参数类型分派（泛型函数）

**作用与何时用**

有时你想写一个函数，针对不同类型的入参做不同处理。最朴素的写法是函数体内一堆 `if isinstance(x, A): ... elif isinstance(x, B): ...`，缺点是：分支会越加越多、每加一个类型都要改这个函数、其它模块无法在不修改原函数的前提下扩展新类型。

`@singledispatch` 把这个结构性问题优雅地解掉了：你注册一个"通用实现"作为入口，再用 `@func.register(类型)` 为不同类型注册各自的实现。调用时，Python 根据**第一个位置参数的运行时类型**，查注册表找到对应实现并调用。这就是所谓的「单分派泛型函数」（single-dispatch generic function）。

它的核心价值是**开闭原则**：对扩展开放（新类型只要 `register`），对修改关闭（不用动原函数体）。

关键 API：

- `@singledispatch`：装饰一个函数，使其成为分派入口（默认实现）。
- `@func.register(类型)`：为指定类型注册实现；`@func.register` 也可不传类型，直接根据被装饰函数的类型注解推断。
- `func.dispatch(type)`：返回对某类型实际会调用的实现函数（调试用）。
- `func.registry`：只读映射，查看已注册的类型→实现。

**demo：按类型渲染不同对象**

```python
import functools

@functools.singledispatch
def render(obj):
    """默认渲染：直接转字符串。"""
    return str(obj)

@render.register(int)
def _(obj):
    return f"整数：{obj:,}"                  # 千分位

@render.register(str)
def _(obj):
    return f"字符串：{obj!r}"                 # 带引号

@render.register(list)
def _(obj):
    return "列表：" + "、".join(render(x) for x in obj)   # 元素递归渲染

print(render(1234567))
print(render("hi"))
print(render([1, 2, "a"]))
print(render(3.14))                          # 没有专门注册，走默认
# 输出：
# 整数：1,234,567
# 字符串：'hi'
# 列表：整数：1、整数：2、字符串：'a'
# 3.14
```

注意几个要点：

- 注册函数的名字可以都叫 `_`，因为它们只是被 `register` 登记进表、不会按名字被直接调用；
- `list` 里的元素通过 `render(x)` 递归调用，自动路由到各自的实现——这是泛型函数的组合力；
- 浮点数 `3.14` 没有专门注册，落到默认实现 `str(3.14)`。

**demo：用类型注解自动推断注册类型**

```python
import functools

@functools.singledispatch
def to_json(obj):
    return json.dumps(obj)  # 占位，实际需 import json

@to_json.register
def _(obj: dict):           # 注解 dict，自动注册到 dict
    items = ", ".join(f'"{k}": {to_json(v)}' for k, v in obj.items())
    return "{" + items + "}"

@to_json.register
def _(obj: list):
    items = ", ".join(to_json(x) for x in obj)
    return "[" + items + "]"

print(to_json({"a": 1, "b": [1, 2]}))
# 输出（演示结构，未对数字/字符串类型注册实现）：
# {"a": 1, "b": [1, 2]}
```

不传类型给 `register`、靠函数注解推断，是简洁写法；缺点是要求注解必须是真实类型对象，不能用字符串前向引用。

**分派规则备忘**

`singledispatch` 按「MRO」查找：对某类型没有精确注册时，会沿其 MRO 顺序往上找父类的注册实现。例如注册了 `list` 实现、对 `MyList(list)` 也会命中 list 的实现。若同时注册了父类和子类，子类优先。

### 2.8 functools.cached_property：只算一次的缓存属性（3.8+）

**作用与何时用**

`@property` 让一个方法像属性一样被访问，但如果方法体计算开销大、且结果在对象生命周期内不变，每次访问都重算就很浪费。`@cached_property` 解决的正是这个：**第一次访问时计算并缓存到实例 `__dict__`，之后访问直接走实例字典、不再触发计算**。

它与 `@property` 的区别就两个字：缓存。

适用场景：

- 解析一个对象内部数据得到派生量、且该派生量在对象不变期间稳定；
- 加载一次就要复用、但不想在 `__init__` 里提前算（懒加载）；
- 计算本身耗时（如统计一个大列表、解析一个嵌套结构）。

注意限制：

- 类必须具有可写的 `__dict__`（即非 `__slots__` 类、且不是内置不可变类型）；
- 该属性只读——试图赋值会抛 `AttributeError`；要支持改写，自己写 setter 或用普通 `@property`；
- 一旦依赖的实例状态变了，缓存不会自动失效，需要手动 `del obj.attr` 来清掉（再次访问会重算）。

**demo：解析一个昂贵字段，验证只算一次**

```python
import functools
import time

class Report:
    def __init__(self, raw):
        self.raw = raw
        self._compute_calls = 0

    @functools.cached_property
    def summary(self):
        self._compute_calls += 1
        time.sleep(0.01)                     # 模拟耗时解析
        return f"共 {len(self.raw)} 条记录"

rep = Report([1, 2, 3, 4, 5])

# 第一次访问：会真正计算
print(rep.summary, "计算次数 =", rep._compute_calls)
# 第二次访问：直接走实例字典，不再计算
print(rep.summary, "计算次数 =", rep._compute_calls)
# 输出：
# 共 5 条记录 计算次数 = 1
# 共 5 条记录 计算次数 = 1

# 想强制重算：删除缓存
del rep.summary
print(rep.summary, "计算次数 =", rep._compute_calls)
# 输出：
# 共 5 条记录 计算次数 = 2
```

**demo：懒加载，避免 `__init__` 阶段就付出代价**

```python
import functools

class HeavyService:
    @functools.cached_property
    def big_config(self):
        print("（首次访问，开始加载配置……）")
        return {"timeout": 30, "retries": 3}

svc = HeavyService()
print("对象已创建，但配置还没加载")
print("现在要用配置了：", svc.big_config)
print("再次使用：", svc.big_config)
# 输出：
# 对象已创建，但配置还没加载
# （首次访问，开始加载配置……）
# 现在要用配置了：{'timeout': 30, 'retries': 3}
# 再次使用：{'timeout': 30, 'retries': 3}
```

第二次"（首次访问…"没再出现，说明走了缓存。这种"用到才算、算了就留"的懒加载，对一些"创建了不一定会立刻全用上"的服务对象很有价值。

### 2.9 functools.total_ordering：只写两个比较方法，其余自动补全

**作用与何时用**

要让一个类的实例支持全部六个比较运算——`<`、`<=`、`>`、`>=`、`==`、`!=`——按理要实现 `__lt__`、`__le__`、`__gt__`、`__ge__`、`__eq__`、`__ne__` 六个方法，写起来很重复。`total_ordering` 是一个类装饰器：你只要定义 `__eq__` 和**其中一个**比较方法（`__lt__`/`__le__`/`__gt__`/`__ge__` 任意一个），它会用反射关系自动把缺失的其它比较方法补出来。

补全的依据就是这组运算之间的逻辑恒等式：

- `a > b`  ⟺  `not (a < b or a == b)`；
- `a >= b` ⟺  `not (a < b)`；
- `a <= b` ⟺  `a < b or a == b`；
- `a != b` ⟺  `not (a == b)`（`__ne__` 其实 Python 默认就是 `not __eq__`，`total_ordering` 不会重复做）。

适用场景：任何具备全序关系的值对象——版本号、分数、温度、价格、优先级等。定义时写一两行，省下四五行的样板。

**demo：一个版本号类，只写 `__eq__` 和 `__lt__`**

```python
import functools

@functools.total_ordering
class Version:
    def __init__(self, major, minor):
        self.major, self.minor = major, minor

    def __eq__(self, other):
        if not isinstance(other, Version):
            return NotImplemented
        return (self.major, self.minor) == (other.major, other.minor)

    def __lt__(self, other):
        if not isinstance(other, Version):
            return NotImplemented
        return (self.major, self.minor) < (other.major, other.minor)

v1 = Version(1, 2)
v2 = Version(1, 10)
v3 = Version(2, 0)

print(v1 < v2, v2 < v3, v3 > v1, v1 <= v1, v1 >= v2, v2 != v3)
print(sorted([v3, v1, v2]))
# 输出：
# True True True True False True
# [Version(1, 2), Version(1, 10), Version(2, 0)]
```

只写了 `__eq__`、`__lt__`，但 `>`、`>=`、`<=`、`!=` 全可用，`sorted` 也能直接排序。

**使用要点**

- 必须定义 `__eq__`，且至少定义四个大小比较之一，否则 `total_ordering` 无从补全；
- 比较方法遇到不兼容类型要返回 `NotImplemented`（而不是 `False`），让 Python 去尝试反向操作，多类型互比时行为才正确；
- `total_ordering` 补出的方法比手写略慢（多一次函数调用与逻辑推导），对性能极敏感的核心循环可以手写全套。

### 2.10 functools.cmp_to_key(func)：把旧式 cmp 转成新式 key

**作用与何时用**

Python 2 时代，`sort`/`sorted` 接收的是一个 `cmp(x, y)` 函数：返回负数表示 `x<y`、零表示相等、正数表示 `x>y`。Python 3 废弃了 `cmp` 参数，统一改为 `key`：返回一个"比较键"，按键自然排序。`cmp_to_key` 就是一座桥——它把一个旧式 `cmp` 函数包装成一个 `key` 函数，让它在 Python 3 的 `sorted`/`list.sort`/`heapq`/`min`/`max` 里继续可用。

何时用？主要是两种：

- 维护遗留代码：还在用 `cmp` 风格的比较函数，不愿/无法重写成 `key`；
- 比较逻辑天然是"两两对比"而非"提取键"：某些复杂的多字段比较，用 `cmp` 表达更直观，改 `key` 反而绕。

关于 `key` 与 `cmp` 的本质区别、`cmp_to_key` 在排序里的位置，【13】05 已详讲。这里给一个场景化例子。

**demo：用 cmp 风格做"按长度、长度相同按字典序"的比较**

```python
import functools

def cmp_words(a, b):
    # 先按长度：短的排前
    if len(a) != len(b):
        return len(a) - len(b)
    # 长度相同：字典序
    if a < b:
        return -1
    if a > b:
        return 1
    return 0

words = ["banana", "apple", "fig", "kiwi", "pear", "date"]
print(sorted(words, key=functools.cmp_to_key(cmp_words)))
# 输出：
# ['fig', 'date', 'kiwi', 'pear', 'apple', 'banana']
```

同样的逻辑用 `key` 也能写：`key=lambda w: (len(w), w)`，更简洁也更快。所以 `cmp_to_key` 真正的价值在那些**提取不出简单键、必须两两对比**的场景——例如一套带"互相覆盖但不可比"规则的版本优先级比较。能用 `key` 就用 `key`，是 Python 3 的正道。

`cmp_to_key` 返回的是一个 `functools.cmp_to_key.<locals>.comparator` 类的实例，它实现了全部富比较运算符（`__lt__`/`__gt__`/...），所以不仅能给 `sorted` 用，也能直接用于 `>`、`<` 等比较表达式，但实际这种直接用法很少见。

## 3. 最佳实践

- **写装饰器必加 `@wraps`。** 不加 `wraps` 会让原函数的元信息（名字、文档、注解）被 `wrapper` 覆盖，调试、文档生成、`pickle` 都受影响。哪怕只是两层装饰器，名字丢失也足以让人困惑半天。养成肌肉记忆：写 `def wrapper` 之前先 `@functools.wraps(func)`。

- **`lru_cache` 只缓存纯函数。** 它按参数值做键、不知道函数读取了哪些外部状态。若函数读了文件、数据库、网络、全局变量，缓存可能与真实状态脱节。对这类函数要么不缓存，要么在外部状态变化时主动 `cache_clear()`，要么把外部依赖显式提成参数（让缓存键能反映它）。

- **`maxsize` 要与键空间匹配。** `maxsize=None`（或 `cache`）看似方便，但当入参来自不受控来源（用户输入、自增 ID）时，缓存会无限增长。一个经验法则：当键空间可数且小，用 `cache`；凡是不确定的，用 `lru_cache(maxsize=合适的数)`，让 LRU 替你兜底。

- **`typed=True` 慎用。** 很多场景下 `1` 和 `1.0` 表达的是同一值，区分类型会降低命中率、还可能引发"为什么缓存没命中"的疑问。只有当类型差异影响计算结果时（如 `hash` 不同、序列化输出不同），才开 `typed`。

- **`partial` 优先于 `lambda` 做参数固定。** `partial(int, base=16)` 比 `lambda s: int(s, 16)` 意图更直白、可调试（有 `func`/`args`/`keywords` 属性）、可 pickle。需要额外表达式逻辑时才用 `lambda`。

- **`reduce` 能用内置函数替就替。** 求和用 `sum`、求极值用 `max`/`min`、累计用 `itertools.accumulate`，比 `reduce` 更可读、通常也更快。`reduce` 留给"以上一步结果为输入滚动推进"的链式逻辑（如 `deep_get`、`pipe` 风格的流水线）。

- **`singledispatch` 优于长 `if isinstance` 链。** 一旦 `if isinstance` 超过三个分支，或需要让外部模块扩展新类型，就改用 `singledispatch`：实现按类型落位、新增类型不动原函数。注意它只按**第一个位置参数**分派；多参数分派需要 `singledispatchmethod`（方法版）或第三方 `multipledispatch`。

- **`cached_property` 对可变对象要小心。** 它假设"对象不变期间派生量不变"——一旦你改了对象里被它依赖的字段，缓存值就过时了。约定：要么对象设计为不可变、要么在修改后 `del obj.cached_attr` 显式失效。不要把它用在依赖字段会被频繁改动的场合。

- **`total_ordering` 比较方法要返回 `NotImplemented`。** 遇到不兼容类型返回 `NotImplemented`，Python 会去尝试另一侧的反向操作，这是富比较协议的正确姿势；直接返回 `False` 或抛异常会破坏多类型互比。

- **`cmp_to_key` 是过渡工具，不是首选。** Python 3 的正道是 `key`。只有遗留 `cmp` 函数或两两对比逻辑确实无法转为键时，才用 `cmp_to_key`。能写 `key=lambda x: (...)"  就别用 `cmp`。

- **`lru_cache` 与可变默认参数的坑。** 缓存的键来自参数；若参数是可变对象（list、dict），改动它会污染下一次命中的判断。缓存函数的入参最好是不可变的（数字、字符串、元组），需要时可先 `tuple(...)` 冻结。

**选型速查表**

| 需求 | 优先选 | 备注 |
| --- | --- | --- |
| 装饰器里保留原函数信息 | `@wraps(func)` | 写装饰器必加，几乎无成本 |
| 纯函数缓存、键空间可控 | `@functools.cache`（3.9+） | 等价 `lru_cache(maxsize=None)`，不淘汰 |
| 纯函数缓存、键空间可能膨胀 | `@lru_cache(maxsize=N)` | LRU 自动淘汰，N 按热点规模估 |
| 需要看缓存命中/主动清空 | `cache_info()` / `cache_clear()` | 两方法由 lru_cache/cache 附加 |
| 固定函数部分参数造专门函数 | `partial(func, *a, **k)` | 比 lambda 更直白、可 pickle |
| 把序列折叠成一个值 | `reduce(func, iterable, init)` | 能用 sum/max/min/accumulate 替就替 |
| 按第一参数类型分派实现 | `singledispatch` + `register` | 替代长 `if isinstance` 链 |
| 方法按第二参数类型分派 | `singledispatchmethod`（3.8+） | 用在类方法上 |
| 派生属性只算一次 | `cached_property` | 类须可写 `__dict__`，可 `del` 失效 |
| 只写两个比较方法、补全其余 | `@total_ordering` | 比较方法遇异类返回 `NotImplemented` |
| 老式 cmp 用进 sorted/key | `cmp_to_key(cmp)` | 过渡工具，能用 key 优先 key |

**常见误区**

- **以为 `cache` 比 `lru_cache` 更"高级"。** 它们是同一机制的两个接口：`cache` 就是 `lru_cache(maxsize=None)`，不设淘汰而已。选哪个看键空间是否会爆，而不是哪个"新"。
- **给 `lru_cache` 装饰的函数传可变参数。** `list`/`dict` 做 key 时，外部修改它们会让"等值判断"失真，命中行为变得不可预测。要么冻结成 tuple，要么不缓存。
- **把 `cached_property` 用在 `__slots__` 类上。** 没有可写 `__dict__`，描述符无法把结果落盘，会抛 `AttributeError`。需要缓存就别用 `__slots__`，或改用普通 property + 手动缓存字段。
- **`total_ordering` 下比较方法返回 `False`。** 不是 `NotImplemented` 时，Python 不会去尝试反向操作，跨类型比较会错。正确姿势是对"无法比较的类型"返回 `NotImplemented`，让协议兜底。
- **`singledispatch` 想按多个参数分派。** 它只看第一个位置参数。需要多参数分派用 `functools.singledispatchmethod`（方法版，按 self 之后第一参数）或第三方 `multipledispatch`。
- **把 `reduce` 当 sum 用。** `reduce(lambda a,b: a+b, xs)` 比 `sum(xs)` 慢且难读。内置 `sum`/`any`/`all`/`max`/`min` 是为这些常见折叠专门优化的，首选它们。
- **装饰器嵌套时漏掉某一层的 `wraps`。** 只要有任一层没加，元信息就会从那一层断掉、对外暴露 `wrapper`。三层装饰器每层都要加，属性才能忠实传导。

## 4. 原理

### 4.1 wraps 与 update_wrapper：属性复制与 `__wrapped__`

`@functools.wraps(wrapped)` 本身是一个「返回装饰器的函数」：它读两个默认元组——

```
WRAPPER_ASSIGNMENTS = ('__module__', '__name__', '__qualname__', '__annotations__', '__doc__')
WRAPPER_UPDATES     = ('__dict__',)
```

——然后返回一个装饰器，该装饰器调用 `functools.update_wrapper(wrapper, wrapped, assigned, updated)` 完成实际工作。`update_wrapper` 做三件事：

1. 遍历 `WRAPPER_ASSIGNMENTS`，对每个属性名 `attr`，执行 `setattr(wrapper, attr, getattr(wrapped, attr))`，把原函数的 `__name__`/`__doc__` 等复制到 `wrapper` 上（若 `wrapped` 缺该属性则跳过）。
2. 遍历 `WRAPPER_UPDATES`（默认只有 `__dict__`），执行 `getattr(wrapper, attr).update(getattr(wrapped, attr, {}))`，把原函数实例字典合并进 `wrapper`。
3. 额外给 `wrapper` 设置一个 `__wrapped__ = wrapped` 属性，指向未经装饰的原函数。

第 3 步常被忽略但很有用：通过 `func.__wrapped__` 可以"穿透装饰器"拿到原始函数，用于测试、API 文档生成、签名内省（`inspect.signature` 默认就跟随 `__wrapped__` 得到原函数签名）。

多层装饰器下 `wraps` 之所以能层层传属性，是因为每层 `wraps` 复制的是"上一层 `wrapper` 看到的函数"——而上一层 `wrapper` 已经被它的 `wraps` 装成了"原样名字"。于是名字像接力棒一样，从最内层原函数逐层传到最外层对外暴露的 `wrapper`。

`wraps` 还允许自定义 `assigned`/`updated`，例如某些场景不希望复制 `__dict__`，可以传 `assigned=functools.WRAPPER_ASSIGNMENTS, updated=()`，就只复制赋值型属性、不合并字典。这在装饰器需要保留自己注入的实例属性、不希望被原函数字典覆盖时有用，但属于少见的精细控制，日常不必关心。

### 4.2 lru_cache 的字典+双向链表 LRU 结构

`lru_cache` 的核心数据结构（CPython 实现层面，3.x 演进过，本质思路一致）是「字典 + 双向链表」：

- 字典负责 `key → value` 的 O(1) 查找；
- 双向链表维持"最近使用顺序"：每次命中或写入，把对应节点搬到链表头部；容量超限（`maxsize`）时从链表尾部淘汰最久未使用的条目。

这样 hit/miss/插入/淘汰都是 O(1)。早期的 Python 实现直接用 `OrderedDict`；后来为了性能，CPython 用 C 实现了一份专用的缓存结构，但语义仍是"字典存放键值、链表维护 LRU 顺序"。

`typed=False` 时，键的哈希基于参数值（`1` 和 `1.0` 哈希相同、且相等，视为一键）；`typed=True` 时，键的构造把每个参数的 `type` 也纳入，于是 `1` 与 `1.0` 落到不同键。这就是 `typed` 的全部实现差异。

`cache_info()` 返回的 `hits`/`misses` 是分派函数在每次调用时增减的两个计数器；`cache_clear()` 把字典与链表一并清空、并把计数器归零。它们都是 `lru_cache` 装饰器在构造分派函数时绑定上去的闭包方法，所以不同被缓存函数的 `cache_info` 互不干扰。

更细的 LRU 与手写缓存对比、`maxsize=None` 时退化为无链表的纯字典等，【14】08 原理章已详讲，此处不重复。

### 4.3 partial 返回的对象：持有 func 与已绑定参数

`partial(func, *args, **keywords)` 返回的是 `functools.partial` 类的实例。这个类的 `__init__` 把传入的 `func`、`args`、`keywords` 存为实例属性——也就是后面能读到的 `.func`、`.args`、`.keywords`。

真正调用 `partial` 对象时（即触发 `__call__`），它把参数拼接成 `func(*(self.args + args), **(self.keywords | keywords))` 去调用原函数——注意几个细节：

- 位置参数是**拼接**：事先绑定的 `.args` 在前、调用时给的 `args` 在后；
- 关键字参数是**合并**：调用时给的 `keywords` 与 `.keywords` 合并、调用时传的同名键会覆盖绑定值；
- `.args` 在前意味着 `partial` 绑定的位置参数一定是 `func` 的最左若干个位置参数，无法绑定"中间位置参数"。

这解释了一个常见疑问："我能用 partial 固定第二个参数吗？"——位置参数不行（它会先填第一个），但可用关键字参数：`partial(func, second=VALUE)`，只要 `func` 的第二参数有名字。

`partial` 对象还实现了 `__repr__`，形如 `functools.partial(<class 'int'>, base=16)`，便于调试；只要 `func` 和被绑参数都支持 pickle，它也支持 pickle，这是它比 `lambda` 在跨进程序列化场景更可用的原因。

### 4.4 singledispatch：类型注册表与按 MRO 查找

`@singledispatch` 装饰一个函数 `func` 时，内部创建一个 `singledispatch` 对象，它持有：

- 一个 `registry` 字典：`类型 → 实现函数`，初始时只有 `object: func`（默认实现）；
- 一个指向 `func` 本身的引用，作为默认实现；
- 一个 `dispatch(cls)` 方法：给定类型 `cls`，返回应当被调用的实现函数。

调用分派函数 `func(x, ...)` 时，流程是：

1. 取第一个位置参数 `x` 的类型 `cls = type(x)`；
2. 调用 `dispatch(cls)`：先查 `registry` 是否有精确命中；没有则遍历 `cls` 的 MRO，逐个向上找第一个注册过的父类；都没有时返回默认实现（`object` 对应的 `func`）；
3. 用找到的实现函数代替 `func` 调用，参数原样转发。

`@func.register(类型)` 的作用是往 `registry` 里加一条 `类型 → 实现函数`；不传类型时则从被装饰函数的类型注解读取（这也是为什么注解必须是真实类型、字符串注解不行——此时注解还没被求值）。这就是单分派的全部机制：一张类型→实现的表 + 一次 MRO 查找。

由于按 `type(x)` 分派，它只在"运行时类型"上生效——若你把一个 `int` 传给形参注解为 `object` 的位置，它仍按 `int` 分派，注解不参与分派、只是 `register` 不传类型时用来登记的来源。

`@func.register` 不显式传类型时，`singledispatch` 会去读被装饰函数的 `__annotations__`，取第一个位置参数的注解作为注册类型。这就是为什么"注解必须是真实类型对象"：此时注解在类体被求值时就必须能得到一个 `type`，字符串前向引用（`"dict"`）在此处未被求值、无法使用。若必须用字符串注解，就显式 `@func.register(dict)` 写类型，不依赖注解推断。

`singledispatchmethod`（3.8+）是方法版：分派发生在 `self` 之外的第一个参数，用于类的泛型方法。它解决了"想在方法上按第二参数类型分派、但又不想把 `self` 算进分派键"的需求，常见于 `visit(self, node)`、`serialize(self, obj)` 这类按 `obj` 类型路由的实现。

### 4.5 cached_property：描述符协议与实例字典协作

`cached_property` 是一个「非数据描述符」（只定义 `__get__`、未定义 `__set__`/`__delete__`）。它的 `__get__(self, instance, owner)` 大致逻辑是：

1. 若 `instance is None`（类访问），返回描述符自身；
2. 否则计算 `value = self.func(instance)`；
3. 把 `value` 写入 `instance.__dict__[self.attrname]`；
4. 返回 `value`。

关键在第 3 步：它把计算结果直接塞进实例自己的 `__dict__`，键名就是属性名。由于普通属性查找的优先级是「数据描述符 > 实例字典 > 非数据描述符」，而 `cached_property` 是非数据描述符，所以**一旦实例字典里有了同名键，后续访问会优先命中实例字典**，`__get__` 不再被调用——这就是"只算一次"的实现秘诀。

由此能推出几条重要后果：

- 类必须允许写 `__dict__`。带 `__slots__` 且不含 `__dict__` 槽的类，无法用 `cached_property`（会抛 `AttributeError`）；
- 属性只读：因为没有 `__set__`，赋值会直接落到实例字典（按理会让缓存失效、但也被允许），不过 `cached_property` 为了避免误写，在 3.x 里会阻止赋值并抛 `AttributeError`；
- `del obj.attr` 能删掉实例字典里的键，使下次访问重新走描述符、重新计算；
- `__init__` 里若给同名属性赋值，会先于描述符写入实例字典，之后访问都不会再计算——需要避免这种命名冲突。

**与 `@property` + 手缓存的对比**

`@property` 手写缓存通常是：定义一个私有字段（如 `_summary`，初值 `None`），在 getter 里判断"为空则算、算完存入"。这套手写方案能用、也支持 setter 主动改写，但代码量大、每加一个缓存属性都要重复这套样板。`cached_property` 用一行 `@cached_property` 把"算一次、存实例字典"封装好，代价是失去 setter 能力与 `__slots__` 兼容。两者取舍很清晰：值只读、类有 `__dict__`，用 `cached_property`；需要可写或 `__slots__`，手写。在数据类（`dataclass`）里，`cached_property` 常与 `field(init=False)` 搭配，做"声明即懒加载"。

### 4.6 total_ordering：用已有比较方法反射补全其它

`total_ordering` 是一个类装饰器，在类被定义后扫描类字典，要求至少存在 `__eq__` 和 (`__lt__`/`__le__`/`__gt__`/`__ge__`) 之一，否则抛 `ValueError`。

它的补全逻辑不是魔法，就是把恒等式翻译成方法。以"用户定义了 `__lt__` 与 `__eq__`"为例，`total_ordering` 给类补上：

- `__gt__ = lambda self, other: not (self < other or self == other)`
- `__ge__ = lambda self, other: not (self < other)`
- `__le__ = lambda self, other: (self < other) or (self == other)`

（`__ne__` 默认就是 `__eq__` 取反，Python 早已内置，不需要补。）

其它 starting 方法（`__le__`/`__gt__`/`__ge__`）的情形同理换恒等式即可。补出来的方法在调用时会触发 `__lt__`/`__eq__`，返回 `NotImplemented` 时由 Python 继续走富比较协议，这就是为什么 `total_ordering` 下仍要正确返回 `NotImplemented`。

因为补全是「调用层多一次转发」，`total_ordering` 生成的比较方法比手写略慢——在热点路径上若每秒比较上百万次，这点开销才值得在意；普通业务代码可以忽略。

**`total_ordering` 的两难**

还要注意一个边界情况：补出的方法依赖 `__eq__` 与起始比较方法的"全序一致性"。如果 `__eq__` 与 `__lt__` 的语义不自洽（例如 `__eq__` 说相等、`__lt__` 却说小于），`total_ordering` 不会帮你校验，补出来的 `__le__`/`__ge__` 会跟着出错。也就是说，`total_ordering` 只负责"补全"，不负责"纠错"；全序关系的正确性仍由你定义的两个方法保证。这也是它在数学语义上应被视作"变换"而非"实现"的原因——它把"一个等价类 + 一个严格弱序"反射为完整的六个运算符，前提是那两个基底本身正确。

同类不同实例比较时，`__eq__` 不返回 `NotImplemented` 就能直接比较；跨类比较时返回 `NotImplemented` 让 Python 尝试反向，是避免 `TypeError` 的标准做法。`total_ordering` 补出的方法同样遵循这套协议，因此跨类比较时它们也会把 `NotImplemented` 透传出去，不会强行返回 bool，这与手写一套比较方法的行为是一致的。

## 5. 总结

- **`functools` 的定位**：标准库为「以函数为对象」的工程化操作提供工具——包装、缓存、固定参数、按类型分派，都是"不修改原函数、只在外面包一层"的高阶手法。
- **`@wraps(wrapped)`**：装饰器必备，通过 `update_wrapper` 复制 `__name__`/`__doc__`/`__wrapped__` 等元信息，避免原函数信息被 `wrapper` 覆盖（详见【14】04）。
- **`lru_cache(maxsize, typed)`**：给纯函数做 LRU 缓存，`maxsize` 控制容量、`typed` 控制是否按类型区分键；`cache_info()` 看命中、`cache_clear()` 清缓存（详见【14】08）。
- **`cache`（3.9+）**：等价于 `lru_cache(maxsize=None)`，键空间可数且小时的简洁写法。
- **`partial(func, *args, **kwargs)`**：偏函数，返回持有原函数与已绑定参数的可调用对象，调用时拼接后续参数；适合固定参数造专门函数、回调预填上下文。
- **`reduce(func, iterable, initial)`**：累积折叠，以上一步结果为输入滚动推进；能用 `sum`/`max`/`min`/`itertools.accumulate` 表达的优先用内置（详见【13】04）。
- **`singledispatch`**：按第一参数类型分派的泛型函数，用类型注册表 + MRO 查找实现；把 `if isinstance` 长链重构为可扩展的注册机制。
- **`cached_property`（3.8+）**：非数据描述符 + 实例字典协作，首次访问计算并把结果写入实例字典，之后直接命中；适合昂贵且稳定的派生属性、懒加载；可 `del` 失效。
- **`total_ordering`**：类装饰器，定义 `__eq__` 与一个比较方法，按恒等式自动补全其余比较运算符；温度、版本号、价格等值对象的省力工具。
- **`cmp_to_key(func)`**：把旧式 `cmp` 包装成新式 `key`，遗留代码与"两两对比"逻辑的过渡桥梁（详见【13】05）；能用 `key` 就用 `key`。

读完本文你应能掌握：

- 说明 `wraps`/`update_wrapper` 复制了哪些属性、`__wrapped__` 有何用途，并能正确写装饰器保留原函数信息；
- 在合适场景选用 `lru_cache`/`cache`，合理设置 `maxsize`/`typed`，用 `cache_info` 验证命中率、用 `cache_clear` 主动失效；
- 用 `partial` 固定参数造专门函数与回调，并能区分它与 `lambda` 的取舍；
- 用 `singledispatch` 重构类型分支代码、用 `register` 扩展新类型，并理解按 MRO 分派的查找规则；
- 用 `cached_property` 给昂贵派生量做单次缓存、用 `del` 失效，并理解为何它要求类可写 `__dict__`；
- 用 `total_ordering` 只要写两个比较方法就能获得全套比较运算，并知道为何要返回 `NotImplemented`；
- 用 `cmp_to_key` 让旧式 `cmp` 在 Python 3 排序接口里可用，并知道何时应改写为 `key`。