---
group:
  title: 【14】装饰器深度剖析
  order: 14
order: 6
title: 类装饰器
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是类装饰器

"类装饰器"在 Python 里其实有两种含义，初学者很容易把它们混为一谈，但它们对应的是两件不同的事：

- **用类去装饰函数**：定义一个类，让它实现 `__init__(self, func)` 和 `__call__(self, *args, **kwargs)`，然后用这个类的实例当作函数的装饰器。其本质是"用一个可调用对象（callable object）替代函数装饰器"。
- **用装饰器去装饰类**：书写 `@decorator` 放在 `class` 定义的上方，等价于 `MyClass = decorator(MyClass)`。这里的 `decorator` 可以是普通函数，也可以是另一个类，它接收一个类作为参数，返回一个（通常是修改后的）类。

这两种用法都可以写成 `@xxx` 的形式，但其作用对象不同：前者作用于函数，后者作用于类。本文会把两个层面都讲清楚，并给出最小可运行示例。

先看第一种含义的最小例子——用类做一个函数装饰器：

```python
class Echo:
    def __init__(self, func):
        # 装饰时被调用：把被装饰函数存到实例上
        self.func = func

    def __call__(self, *args, **kwargs):
        # 调用时被调用：在原函数前后做增强
        print(f"[Echo] 即将调用 {self.func.__name__}")
        result = self.func(*args, **kwargs)
        print(f"[Echo] 调用完毕")
        return result


@Echo
def greet(name):
    print(f"hello, {name}")


greet("Alice")
# 输出：
# [Echo] 即将调用 greet
# hello, Alice
# [Echo] 调用完毕
```

再看第二种含义的最小例子——用装饰器装饰类：

```python
def add_version(cls):
    """给类附加一个 __version__ 属性"""
    cls.__version__ = "1.0.0"
    return cls


@add_version
class Config:
    pass


print(Config.__version__)
# 输出：1.0.0
```

两种写法都用到了 `@` 语法，但关心的"被装饰对象"一个是函数、一个是类。接下来会分别展开。

### 1.2 基础语法与等价形式

理解类装饰器的关键，是记住 `@` 语法只是一个语法糖，它背后永远是"赋值回写"。

**用类装饰函数时：**

```python
@MyDecorator
def func(...):
    ...
```

等价于：

```python
def func(...):
    ...

func = MyDecorator(func)
```

`MyDecorator(func)` 会触发 `MyDecorator.__init__(self, func)`，把 `func` 存为实例属性。之后写 `func(...)` 实际上是调用这个实例，触发 `MyDecorator.__call__(self, ...)`。所以一个能当函数装饰器用的类，至少要实现这两个方法。

**用装饰器装饰类时：**

```python
@decorator
class MyClass:
    ...
```

等价于：

```python
class MyClass:
    ...

MyClass = decorator(MyClass)
```

`decorator` 接收原来的 `MyClass`，返回一个新的（或修改后的）类，再用返回值覆盖同名变量。如果 `decorator` 返回的就是原类对象（只是在其上做了修改），则 `MyClass` 仍然指向原类；如果 `decorator` 返回了一个包装类，则 `MyClass` 指向的是包装类。

把这两条等价关系记牢，后面的所有示例都能一眼看穿。

## 2. 核心内容

### 2.1 用类做函数装饰器：\_\_init\_\_ 与 \_\_call\_\_ 协议

一个类要想当函数装饰器用，核心是实现两个方法：

- `__init__(self, func)`：在"装饰阶段"被调用。此时 `func` 是被装饰的原函数，通常把它存到 `self.func` 上，以便后续调用。
- `__call__(self, *args, **kwargs)`：在"调用阶段"被调用。也就是外部代码写 `func(...)` 时真正执行的方法，在这里可以实现前置/后置增强、参数改写、结果缓存等逻辑。

这两个方法的调用时机是理解类装饰器的关键，下面用一个计时器演示：

```python
import time


class Timer:
    def __init__(self, func):
        self.func = func
        self.calls = 0  # 顺便在实例上存一个状态：累计调用次数

    def __call__(self, *args, **kwargs):
        self.calls += 1
        start = time.perf_counter()
        result = self.func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"[Timer] 第 {self.calls} 次调用，耗时 {elapsed:.6f}s")
        return result


@Timer
def compute(n):
    return sum(i * i for i in range(n))


compute(100000)
compute(100000)
print("总调用次数：", compute.calls)
# 输出（耗时数值随机器而变）：
# [Timer] 第 1 次调用，耗时 0.00xxxxxxs
# [Timer] 第 2 次调用，耗时 0.00xxxxxxs
# 总调用次数： 2
```

注意最后一句：`compute.calls` 能直接读到 `Timer` 实例上的属性。这正是类装饰器相比函数装饰器的一个直观优势——状态保存在实例属性里，可读可写可继承，比闭包里用 `nonlocal` 维护变量要直观得多。

**为什么必须实现 \_\_call\_\_？**

Python 把"能不能被调用"这件事交给 `__call__` 协议判断。一个对象只要定义了 `__call__`，它就是 callable，就可以用 `obj(...)` 的语法去调用它。`@Timer` 把 `compute` 替换成了 `Timer` 的一个实例，如果这个实例没有 `__call__`，那么写 `compute(100000)` 时 Python 会报 `TypeError: 'Timer' object is not callable`。

### 2.2 类装饰器 vs 函数装饰器：状态管理的差异

函数装饰器维护状态通常有两条路：用闭包 + `nonlocal`，或用函数属性。相比之下，类装饰器把"状态"和"行为"统一放在实例里，结构更清晰。

先用函数装饰器 + `nonlocal` 实现同一个计数器：

```python
def count_calls(func):
    calls = 0  # 闭包变量

    def wrapper(*args, **kwargs):
        nonlocal calls
        calls += 1
        print(f"[count_calls] 第 {calls} 次调用")
        return func(*args, **kwargs)

    # 如果想让外部读到 calls，还得手动挂个属性
    wrapper.calls = 0  # 注意：这个属性和闭包里的 calls 是两份！

    return wrapper


@count_calls
def say(msg):
    print(msg)


say("hi")
say("ho")
print("wrapper.calls =", say.calls)  # 输出 0，因为闭包里的 calls 没回写
```

上面这个例子暴露了函数装饰器的一个典型坑：闭包里的 `calls` 和 `wrapper.calls` 是两份数据，外部读到的 `wrapper.calls` 是 0，而不是真正累加的值。要让外部读到，还得在 `wrapper` 里显式 `wrapper.calls = calls` 同步。

用类装饰器就没有这个问题：

```python
class CountCalls:
    def __init__(self, func):
        self.func = func
        self.calls = 0

    def __call__(self, *args, **kwargs):
        self.calls += 1
        print(f"[CountCalls] 第 {self.calls} 次调用")
        return self.func(*args, **kwargs)


@CountCalls
def say(msg):
    print(msg)


say("hi")
say("ho")
print("instance.calls =", say.calls)  # 输出 2，状态只有一份
# 输出：
# [CountCalls] 第 1 次调用
# hi
# [CountCalls] 第 2 次调用
# ho
# instance.calls = 2
```

**差异小结**

| 维度 | 函数装饰器 + nonlocal | 类装饰器 |
| --- | --- | --- |
| 状态存放位置 | 闭包 cell | 实例属性 |
| 外部访问状态 | 需要手动同步到 wrapper 属性 | 直接 `func.calls` 即可 |
| 多份状态 | 要多个 nonlocal 变量 | 加几个 self 属性即可 |
| 可读性 | wrapper 嵌套，调试不方便 | 类结构清晰，可断点 |
| 继承/扩展 | 较难 | 可用子类扩展 |

当装饰器需要维护多个状态、或者想让外部直接读到这些状态时，优先考虑用类实现。

### 2.3 保留被装饰函数的元信息：\_\_wrapped\_\_ 与 functools.wraps

用类做装饰器时，被装饰后的 `func` 实际上是类实例，而不是原函数。这会导致 `func.__name__`、`func.__doc__` 等元信息丢失：

```python
class NaiveDeco:
    def __init__(self, func):
        self.func = func

    def __call__(self, *args, **kwargs):
        return self.func(*args, **kwargs)


@NaiveDeco
def hello(name):
    """打招呼"""
    return f"hi, {name}"


print(hello.__name__)  # 输出：NaiveDeco 实例没有 __name__，会拿不到/报错
```

实际运行时，`hello.__name__` 会触发 `AttributeError`（因为 `NaiveDeco` 实例没有 `__name__`）。解决办法有两种：

**办法一：在类里手动转发常用属性**

```python
class DecoWithName:
    def __init__(self, func):
        self.func = func
        self.__name__ = func.__name__
        self.__doc__ = func.__doc__
        self.__wrapped__ = func  # 让 inspect.signature 等工具能识别

    def __call__(self, *args, **kwargs):
        return self.func(*args, **kwargs)
```

**办法二：用 functools.update_wrapper 自动同步**

`functools.wraps` 默认用于函数装饰器，它内部调用的是 `update_wrapper(wrapper, wrapped)`。在类装饰器里，我们可以手动调用 `update_wrapper`：

```python
import functools


class DecoAuto:
    def __init__(self, func):
        self.func = func
        # update_wrapper 会把 func 的 __name__、__doc__、__module__、
        # __qualname__、__dict__、__wrapped__ 等同步到 self 上
        functools.update_wrapper(self, func)

    def __call__(self, *args, **kwargs):
        return self.func(*args, **kwargs)


@DecoAuto
def hello(name):
    """打招呼"""
    return f"hi, {name}"


print(hello.__name__)   # 输出：hello
print(hello.__doc__)    # 输出：打招呼
import inspect
print(inspect.signature(hello))  # 输出：(name)
```

`update_wrapper(self, func)` 能工作，是因为它本质上是把 `func` 的一组属性逐个 `setattr` 到 `self` 上。只要 `self` 是个普通对象（类的实例），这个调用就能成功。

### 2.4 用装饰器装饰类：基本范式

类装饰器的第二种含义，是把 `@decorator` 写在 `class` 上方。此时 `decorator` 接收的是类本身，通常返回修改后的类。常见用途有：

- 给类添加属性或方法。
- 注册类（如插件系统、序列化器注册）。
- 修改类的行为（如把类变成单例、自动生成 `__init__`、加日志）。
- 包装类（返回另一个类，把原类作为内部委托）。

先看最简单的"加方法"：

```python
def with_to_json(cls):
    """给类自动添加一个 to_json 方法"""

    def to_json(self):
        import json
        # 只序列化实例的 __dict__，简单演示
        return json.dumps(self.__dict__, ensure_ascii=False, default=str)

    cls.to_json = to_json
    return cls


@with_to_json
class User:
    def __init__(self, name, age):
        self.name = name
        self.age = age


u = User("小明", 18)
print(u.to_json())
# 输出：{"name": "小明", "age": 18}
```

`with_to_json` 在类定义结束后被调用，它往 `cls` 上挂了一个 `to_json` 方法，然后把 `cls` 返回。于是 `User` 指向的仍然是同一个类，但多了一个方法，所有 `User` 的实例都能用 `u.to_json()`。

**常见搭配：类装饰器 + 函数装饰器组合**

类装饰器并不排斥函数装饰器，两者经常配合使用。例如先用函数装饰器给类的某些方法打标记，再用类装饰器扫描这些标记做批量注册：

```python
def route(path):
    """方法装饰器：把路径记在方法上"""

    def deco(func):
        func._route = path
        return func

    return deco


class Router:
    routes = {}

    @classmethod
    def register(cls, target_cls):
        for name, method in vars(target_cls).items():
            if callable(method) and hasattr(method, "_route"):
                cls.routes[method._route] = method
        return target_cls


def app(cls):
    """类装饰器：收集所有带 @route 的方法到全局路由表"""
    return Router.register(cls)


@app
class HelloController:
    @route("/hello")
    def hello(self):
        return "hello"

    @route("/bye")
    def bye(self):
        return "bye"


print(Router.routes.keys())
# 输出：dict_keys(['/hello', '/bye'])
```

这种"方法装饰器打标记 + 类装饰器扫描标记"的写法，正是 Flask、FastAPI 等框架内部路由注册的简化模型。

### 2.5 单例类装饰器

单例（singleton）是类装饰器的经典用途：保证一个类全局只有一个实例。

```python
def singleton(cls):
    """把任意类变成单例"""
    instances = {}

    def get_instance(*args, **kwargs):
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]

    # 保留原类的名字等信息
    import functools
    get_instance.__name__ = cls.__name__
    return get_instance


@singleton
class DBConnection:
    def __init__(self):
        print("建立数据库连接（只应出现一次）")
        self.pool = []


a = DBConnection()
b = DBConnection()
print(a is b)
# 输出：
# 建立数据库连接（只应出现一次）
# True
```

注意这里的实现：`singleton` 返回的是一个函数 `get_instance`，而不是原来的类。这意味着 `DBConnection` 这个名字在被装饰后指向的是一个函数，调用它时会从缓存里取实例。第一次调用会真正执行 `cls(*args, **kwargs)` 触发 `__init__`，之后都返回同一个对象。

**用类实现的 singleton 类装饰器**

如果我们更偏好用类来组织逻辑，也可以把 `singleton` 写成一个类：

```python
class Singleton:
    def __init__(self, cls):
        self.cls = cls
        self.instance = None

    def __call__(self, *args, **kwargs):
        if self.instance is None:
            self.instance = self.cls(*args, **kwargs)
        return self.instance


@Singleton
class Logger:
    def __init__(self):
        print("初始化 Logger")
        self.logs = []


log1 = Logger()
log2 = Logger()
print(log1 is log2)
# 输出：
# 初始化 Logger
# True
```

这里 `Singleton` 既是"用类做函数装饰器"，又被拿去装饰 `Logger` 这个类。换句话说，`Logger` 在 `@Singleton` 之后变成了 `Singleton` 的一个实例，每次写 `Logger()` 实际上是调用这个实例的 `__call__`，从缓存返回同一个 `Logger` 实例。这就是两种含义在同一处汇合的典型写法。

### 2.6 类装饰器给类批量加方法/属性

类装饰器最常见的工程用法之一，是给被装饰的类"补"一些通用能力，避免重复写 boilerplate。

**示例：自动给模型类加 repr 和 to dict**

```python
def model_like(cls):
    """给类自动添加 __repr__ 和 to_dict 方法"""

    def __repr__(self):
        keys = ", ".join(
            f"{k}={v!r}" for k, v in self.__dict__.items()
        )
        return f"{cls.__name__}({keys})"

    def to_dict(self):
        return dict(self.__dict__)

    cls.__repr__ = __repr__
    cls.to_dict = to_dict
    return cls


@model_like
class Product:
    def __init__(self, sku, price, stock):
        self.sku = sku
        self.price = price
        self.stock = stock


p = Product("A001", 9.9, 100)
print(p)            # 由 __repr__ 控制
print(p.to_dict())
# 输出：
# Product(sku='A001', price=9.9, stock=100)
# {'sku': 'A001', 'price': 9.9, 'stock': 100}
```

写一个这样的类装饰器，就能让所有数据类共用同一套 `__repr__` 和 `to_dict`，不必在每个类里手写。这其实就是 `dataclass` 的简化精神——用装饰器自动补齐样板方法。

### 2.7 带参数的类装饰器

类装饰器也可以带参数。对于"用类做函数装饰器"的情况，需要再加一层：外层函数接收参数，返回一个类，这个类再去装饰函数。或者让类本身实现 `__init__` 接收参数，并实现 `__call__(self, func)` 返回包装器。

**方式一：类实现 \_\_call\_\_(self, func) 返回包装函数**

这是"带参数的类装饰器"最清晰的写法：`__init__` 收参数，`__call__` 收被装饰函数并返回真正的 wrapper。

```python
class Retry:
    def __init__(self, times=3, delay=0.1):
        self.times = times
        self.delay = delay

    def __call__(self, func):
        import time

        def wrapper(*args, **kwargs):
            last_exc = None
            for attempt in range(1, self.times + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as exc:
                    last_exc = exc
                    print(f"[Retry] 第 {attempt} 次失败：{exc!r}")
                    time.sleep(self.delay)
            raise last_exc

        return wrapper


@Retry(times=3, delay=0)
def call_api(endpoint):
    import random
    if random.random() < 0.8:
        raise RuntimeError("网络抖动")
    return {"data": 42}


# 仅演示，不保证一定成功；可多运行几次观察重试行为
try:
    print(call_api("/user/profile"))
except Exception as e:
    print("最终失败：", e)
# 可能输出：
# [Retry] 第 1 次失败：RuntimeError('网络抖动')
# [Retry] 第 2 次失败：RuntimeError('网络抖动')
# [Retry] 第 3 次失败：RuntimeError('网络抖动')
# 最终失败： 网络抖动
```

这里 `@Retry(times=3, delay=0)` 展开是 `call_api = Retry(times=3, delay=0)(call_api)`：先实例化 `Retry`（走 `__init__` 存参数），再用这个实例去调用 `__call__(self, func)` 返回真正的 `wrapper`。注意此时 `wrapper` 是普通函数，不是 `Retry` 实例，所以它本身就是 callable，没有 `not callable` 的问题。

**方式二：用类装饰类也带参数**

装饰类的装饰器同样可以带参数。比如给类加一个带命名空间的日志方法：

```python
def with_logger(tag="APP"):
    def decorator(cls):
        def log(self, msg):
            print(f"[{tag}] {self.__class__.__name__}: {msg}")

        cls.log = log
        return cls

    return decorator


@with_logger(tag="ORDER")
class OrderService:
    def create(self):
        self.log("创建订单")
        return "order#1"


OrderService().create()
# 输出：[ORDER] OrderService: 创建订单
```

### 2.8 用类实现带统计的 API 客户端装饰器

把前面的知识点串起来，写一个更贴近实际业务的例子：用类装饰器装饰一个 API 客户端的方法，自动统计调用次数、成功/失败次数、最近一次错误，并把这些统计暴露为实例属性，便于监控。

```python
import time


class ApiStat:
    """装饰函数：统计调用次数、成功/失败、最近错误"""

    def __init__(self, func):
        self.func = func
        # 状态全部存实例属性，外部可读
        self.calls = 0
        self.success = 0
        self.failure = 0
        self.last_error = None
        self.last_duration = 0.0

    def __call__(self, *args, **kwargs):
        self.calls += 1
        start = time.perf_counter()
        try:
            result = self.func(*args, **kwargs)
            self.success += 1
            return result
        except Exception as exc:
            self.failure += 1
            self.last_error = exc
            raise
        finally:
            self.last_duration = time.perf_counter() - start


class PaymentClient:
    def __init__(self):
        self.balance = 100

    @ApiStat
    def charge(self, amount):
        """从余额扣款，余额不足抛异常"""
        if amount > self.balance:
            raise ValueError(f"余额不足：需要 {amount}，剩余 {self.balance}")
        self.balance -= amount
        return {"ok": True, "balance": self.balance}

    @ApiStat
    def refund(self, amount):
        self.balance += amount
        return {"ok": True, "balance": self.balance}


client = PaymentClient()
client.charge(30)
client.charge(50)
try:
    client.charge(100)  # 这一次会失败
except ValueError:
    pass
client.refund(10)

# charge 方法本身被 ApiStat 装饰，charge 就是一个 ApiStat 实例
stat = client.charge
print(f"charge 调用 {stat.calls} 次，成功 {stat.success} 次，失败 {stat.failure} 次")
print(f"最近一次错误：{stat.last_error!r}")
print(f"charge 单次耗时：{stat.last_duration:.6f}s")
# 输出（耗时不定）：
# charge 调用 3 次，成功 2 次，失败 1 次
# 最近一次错误：ValueError('余额不足：需要 100，剩余 20')
# charge 单次耗时：0.0000xxxs
```

这个例子综合体现了类装饰器的两个优势：状态保存在实例上（`calls`、`success`、`failure`、`last_error` 等），外部可以像 `client.charge.calls` 这样直接读取，不必像函数装饰器那样再额外暴露接口。如果你把这些属性对接到 Prometheus 之类的监控，这就是一个最小可用埋点方案的雏形。

### 2.9 dataclass：一个标准库里的类装饰器

Python 3.7 引入的 `dataclasses.dataclass` 本身就是一个类装饰器。它的作用是：扫描类的类型注解，根据注解自动生成 `__init__`、`__repr__`、`__eq__` 等方法。

```python
from dataclasses import dataclass


@dataclass
class Point:
    x: float
    y: float


p = Point(3.0, 4.0)
print(p)            # 输出：Point(x=3.0, y=4.0)，自动生成的 __repr__
print(p == Point(3.0, 4.0))  # 输出：True，自动生成的 __eq__
```

`@dataclass` 展开后等价于 `Point = dataclass(Point)`，它接收 `Point` 类，在类身上动态生成方法，再把类返回。你可以把它理解为 2.6 节 `model_like` 的"官方增强版"。其内部机制就是类装饰器：接收类、按字段注解合成方法、返回类。

`dataclass` 还支持参数：`@dataclass(frozen=True, slots=True)` 等，对应 2.7 节"带参数的类装饰器"。

### 2.10 类装饰器装饰类时的 \_\_init_subclass\_\_ 替代视角

有时候我们想"在子类被创建时自动做点事"，比如注册子类、校验字段。这既可以用类装饰器实现，也可以用 `__init_subclass__` 实现，两者可以互相替代。

**用类装饰器做子类注册**

```python
_registry = {}


def register(cls):
    _registry[cls.__name__] = cls
    return cls


class Animal:
    pass


@register
class Dog(Animal):
    pass


@register
class Cat(Animal):
    pass


print(list(_registry.keys()))
# 输出：['Dog', 'Cat']
```

**用 \_\_init_subclass\_\_ 做同样的事**

```python
registry2 = {}


class AnimalBase:
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        registry2[cls.__name__] = cls


class Dog(AnimalBase):
    pass


class Cat(AnimalBase):
    pass


print(list(registry2.keys()))
# 输出：['Dog', 'Cat']
```

两者的区别在于触发点：类装饰器是"显式写在子类上方"的，要求每个子类都写 `@register`；而 `__init_subclass__` 是"在基类里定义一次"，之后所有继承 `AnimalBase` 的子类都会自动被注册，不需要额外标注。当你能控制基类、希望对子类透明时，`__init_subclass__` 更省事；当你无法修改基类、或只想有选择地装饰某些类时，类装饰器更灵活。

## 3. 最佳实践

**优先用类实现需要维护状态的装饰器**

当一个装饰器需要维护多个状态（调用次数、耗时、缓存、开关……），或者希望把这些状态暴露给外部读取时，类装饰器比函数装饰器 + `nonlocal` 更直观、更不容易踩"闭包变量和外挂属性不同步"的坑。

- 推荐：`class CountCalls: def __init__ ... def __call__ ...`，状态放 `self`，外部 `func.calls` 直接读。
- 不推荐：函数装饰器里一会儿 `nonlocal calls`，一会儿 `wrapper.calls = calls`，容易出现两份不同步的数据。

**别忘了保留被装饰对象的元信息**

无论类装饰器装饰的是函数还是类，都要注意保留元信息。

- 装饰函数：用 `functools.update_wrapper(self, func)`，让 `__name__`、`__doc__`、`__wrapped__`、`inspect.signature` 都能正常工作。这对调试、日志、文档生成工具非常关键。
- 装饰类：类装饰器如果返回的不是原类（而是包装类），要考虑原类的 `__name__`、`__qualname__`、`__doc__` 是否需要转发。`functools.update_wrapper(wrapper_cls, cls)` 也能用，但要注意类可能没有某些函数才有的属性（如 `__annotations__` 的结构差异），需要按需补充。

**类装饰器装饰函数时，不要在 \_\_init\_\_ 里做重活**

`__init__` 在"装饰阶段"被调用，也就是模块导入时。如果在这里做网络请求、文件读写、大量计算，会导致 import 变慢，甚至产生副作用。把初始化里重活延迟到第一次 `__call__` 或显式的 `setup()` 方法。

- 推荐：`__init__` 只存 `func`、初始化计数器等廉价属性。
- 不推荐：在 `__init__` 里打开数据库连接、拉取配置。

**类装饰器装饰类时，尽量"修改并返回原类"，避免"返回包装类"**

修改原类（往 `cls` 上加方法、加属性）后返回 `cls`，能保持 `isinstance` 语义、继承链、`type()` 不变，对使用者更友好。返回一个全新的包装类虽然更强大（可以拦截所有方法访问），但会破坏 `isinstance(x, MyClass)` 检查，也让调试更复杂。

- 推荐：`cls.to_json = to_json; return cls`。
- 谨慎：`return WrappedClass(cls)`——确有必要再用。

**带参数的类装饰器：\_\_init\_\_ 收参数、\_\_call\_\_ 收被装饰对象**

这是最清晰的结构，参数和被装饰对象职责分明。`@Deco(a=1)` 会先执行 `Deco(a=1)` 调用 `__init__`，再用实例调用 `__call__(func)`。

- 推荐：`class Deco: def __init__(self, a): self.a = a; def __call__(self, func): ...`。
- 不推荐：把参数和 `func` 混在 `__init__` 里，那样就没法写 `@Deco(a=1)` 这种带参形式。

**单例装饰器的线程安全**

2.5 节的单例实现是非线程安全的：两个线程同时第一次调用 `get_instance`，可能各自 `cls(...)` 一次，产出两个实例。在多线程环境里需要加锁，或依赖模块级全局变量（Python 模块本身是线程安全导入的）。

- 推荐：必要时用 `threading.Lock` 包住"检查并创建"这段临界区。
- 或者：把单例做成模块级全局变量，利用模块导入的原子性。

**类装饰器要可叠加**

`@A @B @C def f(): ...` 等价于 `f = A(B(C(f)))`。设计类装饰器时要考虑叠加场景：你的装饰器是否假设被装饰对象是"原始函数/类"？如果假设了，叠加其它装饰器后可能失效（比如 `self.func.__name__` 取到的是上一层 wrapper 的名字）。用 `functools.update_wrapper` 维护 `__wrapped__` 链，可以让 `inspect` 系列工具沿链追溯到原对象。

**避免在类装饰器里静默吞异常**

像 retry、cache 这类装饰器，容易写成"出错了就返回 None / 静默重试"。这会让 bug 难以发现。推荐：

- 保留 `last_error` 这类诊断属性（见 2.8 节）。
- 超过重试次数后把原异常 `raise`，而不是吞掉。
- 对外暴露统计指标，便于监控异常率。

**用 \_\_init_subclass\_\_ 替代部分类装饰器**

如果你能控制基类、且希望对所有子类统一生效，用 `__init_subclass__` 比给每个子类贴 `@decorator` 更省事、更不容易遗漏。反过来，如果你只能控制某些类、或需要对不同子类做不同装饰，类装饰器更合适。

## 4. 原理

### 4.1 可调用对象：\_\_call\_\_ 协议

Python 里"能不能被 `obj(...)` 调用"这件事，是由 `__call__` 决定的。对任意对象 `obj`，写 `obj(a, b)` 时，Python 会走如下流程：

1. 在 `type(obj)` 上查找 `__call__` 方法（注意是找 type 的，不是找实例的）；
2. 如果存在，则调用 `type(obj).__call__(obj, a, b)`，把 `obj` 作为第一个参数传入；
3. 如果不存在，抛出 `TypeError: 'XXX' object is not callable`。

对普通函数来说，`type(func)` 是 `function` 类型，它的 `__call__` 由 C 层实现，最终执行函数字节码。对类实例来说，`type(obj)` 是这个类本身，如果类定义了 `__call__`，实例就 callable。

这就是为什么"用类做函数装饰器"能成立：`@Timer` 把 `func` 替换成 `Timer` 的实例，只要 `Timer` 定义了 `__call__`，后面写 `func(...)` 就会走进 `Timer.__call__`。

```python
class A:
    def __call__(self):
        print("A call")


a = A()
# 等价于 type(a).__call__(a)
a()
# 输出：A call


class B:
    pass


b = B()
# b()  # TypeError: 'B' object is not callable
```

可以直接用 `callable(obj)` 检查一个对象能否被调用，它内部就是检查 `type(obj)` 是否有 `__call__`。

### 4.2 用类做函数装饰器：完整的调用链

把 2.1 节的 `Timer` 拆开看每一步发生了什么。

```python
@Timer
def compute(n):
    return sum(i * i for i in range(n))
```

等价于：

```python
def compute(n):
    return sum(i * i for i in range(n))


compute = Timer(compute)
```

**装饰阶段**：`Timer(compute)` 会调用 `Timer.__init__(self, compute)`，把 `compute` 存到 `self.func`。此时 `compute` 这个名字被重新绑定到刚创建的 `Timer` 实例上。注意：原函数对象并没有销毁，它被 `self.func` 引用着。

**调用阶段**：外部写 `compute(100000)`，实际上是在调用 `Timer` 实例，Python 走 `type(instance).__call__(instance, 100000)`，进入 `Timer.__call__(self, *args, **kwargs)`。在 `__call__` 里：

1. `self.calls += 1`：在实例上累加计数；
2. `start = time.perf_counter()`：记录开始时间；
3. `result = self.func(*args, **kwargs)`：调用原函数（原函数被 `self.func` 引用着，始终能找到）；
4. 计算耗时、打印日志、`return result`。

**为什么能替代闭包？**

在函数装饰器里，`wrapper` 之所以能访问外层的 `calls` 变量，是因为 Python 的闭包机制：内层函数捕获了对外层变量的引用，这些变量被存在函数对象的 `__closure__` 属性里（一个 cell 对象的 tuple）。要修改外层变量得用 `nonlocal`。

在类装饰器里，状态不是存在 `__closure__` 里，而是存在实例的 `__dict__` 里（`self.calls`）。实例本身就是一个可见的对象，访问状态就是 `self.xxx`，修改状态就是 `self.xxx = ...`，不需要 `nonlocal`。实例属性相比 cell 对象有两个直观优势：

- 可见性：`obj.calls` 外部能直接读，`__closure__` 外部读起来很别扭。
- 可扩展性：要加一个状态就 `self.xxx = 0`，要加多个状态就加多个属性；闭包要加多个 `nonlocal`，还要同步到 wrapper 的属性上才便于外部访问。

用一个对比来加深理解：

```python
# 函数装饰器：状态在 __closure__
def deco_func(func):
    calls = 0

    def wrapper(*args, **kwargs):
        nonlocal calls
        calls += 1
        return func(*args, **kwargs)

    return wrapper


@deco_func
def f1():
    pass


# 类装饰器：状态在实例 __dict__
class DecoClass:
    def __init__(self, func):
        self.func = func
        self.calls = 0

    def __call__(self, *args, **kwargs):
        self.calls += 1
        return self.func(*args, **kwargs)


@DecoClass
def f2():
    pass


f1(); f1()
f2(); f2()
print(f1.__closure__)   # (<cell at 0x... int object at 0x...>,)
print(f2.__dict__)      # {'func': <function f2>, 'calls': 2}
```

`f1` 的状态藏在 `__closure__` 的 cell 里，从外面看不到也无法直接读写；`f2` 的状态明明白白躺在 `__dict__` 里，`f2.calls` 可读可写。这就是类装饰器更适合维护状态的根本原因。

### 4.3 装饰器装饰类：等价改写与返回值策略

`@decorator class C: ...` 等价于 `C = decorator(C)`。`decorator` 接收的是"类对象"本身（在 Python 里类也是一等对象，可以像普通变量一样传来传去）。`decorator` 可以有两种返回策略：

**策略一：修改原类并返回它**

```python
def add_field(cls):
    cls.extra = 1
    return cls


@add_field
class T:
    pass


print(T.extra)      # 输出：1
print(type(T))      # 输出：<class 'type'>，仍然是普通类
```

这种策略下，`T` 仍然指向原来的类对象，只是它多了一个属性 `extra`。`isinstance`、继承、`type()` 等语义完全不变，是最安全的写法。

**策略二：返回一个新类（包装类）**

```python
def wrap(cls):
    class Wrapper:
        def __init__(self, *args, **kwargs):
            self._inner = cls(*args, **kwargs)

        def __getattr__(self, name):
            return getattr(self._inner, name)

    Wrapper.__name__ = cls.__name__
    return Wrapper


@wrap
class T2:
    def __init__(self, x):
        self.x = x


t = T2(10)
print(t.x)          # 通过 __getattr__ 委托，输出：10
print(type(t))      # 输出：<class '...Wrapper'>，已经不是 T2 了
```

这种策略下，`T2` 指向的是 `Wrapper`，`type(t)` 不再是 `T2`。好处是可以拦截所有属性访问、方法调用；坏处是 `isinstance(t, T2)` 语义被破坏（`T2` 已经不是原来的类），调试和类型检查更复杂。所以要用这种策略，必须有明确理由（比如需要全面代理、AOP 切面）。

### 4.4 dataclass 内部机制

`dataclasses.dataclass` 本质上是一个"接收类、扫描注解、生成方法、返回类"的类装饰器。简化后的内部流程如下：

1. **收集字段**：遍历 `cls.__annotations__`，把带类型注解的属性识别为字段，按定义顺序记录字段名、类型、默认值。
2. **合成 \_\_init\_\_**：根据字段列表动态生成 `__init__` 的源码字符串（或用 `exec` 执行），`__init__` 参数顺序与字段顺序一致（有默认值的字段排后）。
3. **按需合成其它方法**：如果 `repr=True`（默认），生成 `__repr__`；如果 `eq=True`（默认），生成 `__eq__`；如果 `frozen=True`，还会生成 `__setattr__`、`__delattr__` 来禁止赋值。
4. **把方法挂到 cls 上并返回**：`cls.__init__ = ...; cls.__repr__ = ...; ...`，最后 `return cls`。

正因为它总是返回原类（策略一），`dataclass` 几乎不破坏 `isinstance`、继承等语义，这也是它能在标准库和各种框架中被广泛使用的原因。

一个最小化复现 `dataclass` 生成的 `__init__`：

```python
def mini_dataclass(cls):
    fields = list(cls.__annotations__.items())

    def __init__(self, *args):
        for (name, _typ), value in zip(fields, args):
            setattr(self, name, value)

    def __repr__(self):
        items = ", ".join(
            f"{n}={getattr(self, n)!r}" for n, _ in fields
        )
        return f"{cls.__name__}({items})"

    cls.__init__ = __init__
    cls.__repr__ = __repr__
    return cls


@mini_dataclass
class Point:
    x: int
    y: int


p = Point(1, 2)
print(p)  # 输出：Point(x=1, y=2)
```

真实 `dataclass` 的实现要复杂得多（处理默认值、`field()`、继承、`__hash__`、`frozen`、`slots` 等），但骨架就是这样：类装饰器 + 注解扫描 + 动态方法合成。

### 4.5 \_\_init_subclass\_\_ 与类装饰器的协作

`__init_subclass__` 是 Python 3.6 引入的隐式钩子：任何类被定义并继承自某个基类时，基类的 `__init_subclass__(cls)` 会被调用，参数是"新定义的子类"。它和类装饰器都能"在类创建时做点事"，但触发机制不同：

- 类装饰器：显式 `@decorator` 写在被装饰类上方，`decorator(cls)` 被显式调用。
- `__init_subclass__`：在"类被创建"这一刻由解释器隐式调用，对基类的所有子孙类生效，不需要任何标注。

两者的协作在于：`__init_subclass__` 通常写在基类里，负责"对所有子类统一做的事"（注册、契约校验）；类装饰器可以写在特定子类上，做"额外的事"（打标签、加方法）。它们互不冲突，可以同时存在：

```python
class Plugin:
    registry = []

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        Plugin.registry.append(cls)


def with_tag(tag):
    def deco(cls):
        cls.tag = tag
        return cls

    return deco


@with_tag("audio")
class MP3Decoder(Plugin):
    pass


@with_tag("video")
class H264Decoder(Plugin):
    pass


print([c.__name__ for c in Plugin.registry])  # ['MP3Decoder', 'H264Decoder']
print(MP3Decoder.tag)   # audio
print(H264Decoder.tag)  # video
```

这里 `__init_subclass__` 负责把子类加入 `registry`，`with_tag` 负责"每个具体子类要额外携带的标签"。两者分工不同，却能无缝叠加。

### 4.6 两种含义在同一处的调用链

最后把两种含义的调用链放在一起对照，帮助彻底分清：

**含义 A：用类做函数装饰器**

```
@MyDeco
def f(): ...
```

- 装饰：`f = MyDeco(f)` → `MyDeco.__init__(self, f)`
- 调用：`f()` → `type(self).__call__(self)` → `MyDeco.__call__(self)`

**含义 B：用装饰器装饰类**

```
@deco
class C: ...
```

- 装饰：`C = deco(C)` → 调用函数 `deco(C)`（或类 `deco.__call__(C)`，如果 `deco` 是个类实例）
- 使用：`C()` → `type(C)()`，即调用装饰后返回的那个类

**两者交汇：`@Singleton class C`**

```
@Singleton
class C: ...
```

- 装饰：`C = Singleton(C)` → `Singleton.__init__(self, C)` 存下原类 `self.cls = C`
- 使用：`C()` → `type(self).__call__(self)` → `Singleton.__call__(self)` 返回 `self.cls` 的单例

在"两者交汇"这个场景里，`Singleton` 是个类（含义 A 的"类做装饰器"），它装饰的 `C` 也是一个类（含义 B 的"装饰器装饰类"）。理解这一点后，所有类装饰器代码都能看穿：只要盯住 `@x` 展开成 `y = x(y)`，再分别问"`x` 是什么、`y` 是什么、调用走的是谁的 `__call__`"，就不会乱。

## 5. 总结

- 本文讲清了"类装饰器"的两层含义。
- 用类做函数装饰器：类实现 `__init__(self, func)` 存被装饰函数、`__call__(self, *args, **kwargs)` 实现增强调用，`@MyDeco` 等价于 `func = MyDeco(func)`。装饰阶段走 `__init__`，调用阶段走 `__call__`。相比函数装饰器，状态存实例属性、可读可写、比 `nonlocal` + 闭包直观。
- 用装饰器装饰类：`@decorator class C` 等价于 `C = decorator(C)`，可修改原类或返回包装类。典型用途：加方法/属性、注册子类、单例化、自动生成方法（dataclass）。
- 带参数的类装饰器：`__init__` 收参数、`__call__` 收被装饰对象，`@Deco(a=1)` 展开为 `obj = Deco(a=1); f = obj(f)`。
- 元信息保留：用 `functools.update_wrapper(self, func)` 同步 `__name__`、`__doc__`、`__wrapped__`，让 `inspect` 系列工具正常工作。
- 标准库 `dataclass` 是一个典型的类装饰器：扫描注解、动态合成 `__init__` / `__repr__` / `__eq__`、返回原类。
- `__init_subclass__` 是类装饰器在"子类注册/契约校验"场景的替代视角，两者可协作。
- 读完本文你应能掌握：
  - 看到任意 `@xxx` 写法，能立刻判断它是"类装饰函数"还是"装饰器装饰类"，并写出等价的 `y = x(y)` 展开。
  - 能用类实现带计数、带统计、带重试的状态化函数装饰器，并把状态暴露给外部读取。
  - 能用类装饰器给类自动加方法（`to_json`、`to_dict`、`__repr__`）、实现单例、做子类注册。
  - 能说清 `__init__` 与 `__call__` 的调用时机、`__call__` 协议为何让实例可调用、类装饰器相比函数装饰器在状态管理上的优势原理。
  - 能在 `dataclass`、`__init_subclass__`、类装饰器三者之间做出合理选择。