---
group:
  title: 【14】装饰器深度剖析
  order: 14
order: 4
title: functools.wraps 保留原函数信息
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 functools.wraps

在 Python 中，装饰器是一种"用函数去包装函数"的机制。一个典型的装饰器内部会定义一个 `wrapper` 函数，它在原函数前后插入额外逻辑，然后返回这个 `wrapper`。被装饰的函数名（`func`）所指向的引用，实际上已经被 `wrapper` 顶替了。

这个"顶替"带来一个隐蔽却严重的副作用：原函数的名字、文档字符串、所属模块、签名等元信息，全都变成了 `wrapper` 的。对于一两个函数，这似乎无关紧要；但在一个有几十上百个被装饰函数的工程里，调试时函数名全部显示为 `wrapper`、`help()` 查不到真实文档、`inspect.signature` 看不到真实参数、Sphinx 自动文档错乱——这些都会让排查问题变成噩梦。

`functools.wraps` 就是用来解决这个问题的标准库工具。它本身是一个装饰器工厂，用于装饰 `wrapper` 函数，把原函数的 `__name__`、`__doc__`、`__module__`、`__qualname__`、`__annotations__` 等元属性复制到 `wrapper` 上，并设置 `__wrapped__` 指向原函数，从而让被装饰后的函数在元信息层面"看起来"仍然是原函数。

它的位置在标准库 `functools` 模块中，导入方式为：

```python
from functools import wraps
```

整个模块无需额外安装，属于 Python 自带标准库。

### 1.2 为什么需要 functools.wraps

先看一个不加 `wraps` 的装饰器，直观感受"元信息丢失"这个问题的严重性。

```python
# 一个"诚实"的装饰器：它没加 wraps，于是暴露了问题

def log_call(func):
    # wrapper 顶替了 func 的名字绑定
    def wrapper(*args, **kwargs):
        print(f"[LOG] 调用 {func.__name__}({args}, {kwargs})")
        return func(*args, **kwargs)
    return wrapper


@log_call
def send_email(to: str, subject: str, body: str) -> bool:
    """发送一封邮件给指定收件人，返回是否发送成功。"""
    # 这里省略真实发送逻辑
    return True
```

现在观察被装饰后的 `send_email`，它的元信息发生了什么变化：

```python
print(send_email.__name__)   # 本期望 send_email
# 输出：wrapper

print(send_email.__doc__)    # 本期望发送一封邮件...的文档字符串
# 输出：None

print(send_email.__module__) # 期望 __main__（或其他定义模块）
# 输出：__main__  （巧合一致，因为 wrapper 也在这个模块定义）

print(send_email.__qualname__) # 期望 send_email
# 输出：log_call.<locals>.wrapper
```

注意 `__qualname__` 的变化尤其刺眼：它显示的是 `log_call.<locals>.wrapper`，意思是这个函数对象其实是 `log_call` 局部作用域里的 `wrapper`。在调试器的调用栈、`repr(func)` 、序列化、类型检查工具里，这个名字会反复出现，让排查变得困难。

加上 `wraps` 后，同样这段代码就能保留原函数信息：

```python
from functools import wraps

def log_call(func):
    @wraps(func)            # 关键一行：把 func 的元信息复制给 wrapper
    def wrapper(*args, **kwargs):
        print(f"[LOG] 调用 {func.__name__}({args}, {kwargs})")
        return func(*args, **kwargs)
    return wrapper


@log_call
def send_email(to: str, subject: str, body: str) -> bool:
    """发送一封邮件给指定收件人，返回是否发送成功。"""
    return True


print(send_email.__name__)
# 输出：send_email

print(send_email.__doc__)
# 输出：发送一封邮件给指定收件人，返回是否发送成功。

print(send_email.__qualname__)
# 输出：send_email
```

这就是 `functools.wraps` 的核心价值：它让装饰器"只改变行为，不改变身份"。被装饰后的函数仍然叫原来的名字、带原来的文档、属于原来的模块、有原来的签名。

### 1.3 基本语法与最小用法

`wraps` 的标准用法是作为装饰器套在 `wrapper` 函数定义上：

```python
from functools import wraps

def my_decorator(func):
    @wraps(func)          # func 是被装饰的原函数
    def wrapper(*args, **kwargs):
        # 前置逻辑
        result = func(*args, **kwargs)
        # 后置逻辑
        return result
    return wrapper
```

要点：

- `@wraps(func)` 写在 `wrapper` 定义的正上方，`func` 是被装饰的原函数。
- `wraps(func)` 返回一个装饰器，这个装饰器再去装饰 `wrapper`，所以 `wraps` 是"带参数的装饰器"，也就是所谓的"装饰器工厂"。
- 它会把 `func` 的一系列元属性复制到 `wrapper` 上，并把 `wrapper.__wrapped__` 指向 `func`。

`wraps` 也可以带关键字参数来精细控制复制哪些属性：

```python
@wraps(func, assigned=('__name__', '__doc__'), updated=())
def wrapper(*args, **kwargs):
    ...
```

`assigned` 指定要赋值（复制）的属性名元组，`updated` 指定要"更新"而非"覆盖"的属性名元组（默认是 `__dict__`，即把原函数的 `__dict__` 内容合并进 `wrapper` 的 `__dict__`）。这两个参数一般保持默认即可，按需调整的场景很少。

下面是最小可运行的完整示例：

```python
from functools import wraps


def timer(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        import time
        start = time.perf_counter()
        result = func(*args, **kwargs)
        end = time.perf_counter()
        print(f"{func.__name__} 耗时 {end - start:.6f} 秒")
        return result
    return wrapper


@timer
def fib(n: int) -> int:
    """递归计算第 n 个斐波那契数（低效版，仅作演示）。"""
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)


print(fib(10))
# 输出（耗时部分每次不同）：
# fib 耗时 0.000012 秒
# 55

print(fib.__name__, '/', fib.__doc__)
# 输出：fib / 递归计算第 n 个斐波那契数（低效版，仅作演示）。
```

如果没有 `@wraps(func)`，第一行输出会变成 `wrapper 耗时 0.000012 秒`，而 `fib.__name__` 会是 `wrapper`，`fib.__doc__` 会是 `None`。这正是 `wraps` 要解决的问题。

---

## 2. 核心内容

### 2.1 functools.wraps 的签名与参数

`wraps` 的完整签名如下：

```python
functools.wraps(wrapped,
                assigned=WRAPPER_ASSIGNMENTS,
                updated=WRAPPER_UPDATES)
```

各参数含义：

- `wrapped`：被包装的原函数，`wraps` 会从这里读取元属性。
- `assigned`：一个字符串元组，列出需要从 `wrapped` **复制（赋值）** 到 `wrapper` 的属性名。默认值是 `WRAPPER_ASSIGNMENTS`：
  ```python
  WRAPPER_ASSIGNMENTS = ('__module__', '__name__', '__qualname__',
                         '__annotations__', '__doc__')
  ```
  即默认会复制模块、名字、限定名、注解、文档字符串这五项。
- `updated`：一个字符串元组，列出需要从 `wrapped` **更新（合并）** 到 `wrapper` 的属性名。默认值是 `WRAPPER_UPDATES`：
  ```python
  WRAPPER_UPDATES = ('__dict__',)
  ```
  "更新"和"复制"的区别在于：`__dict__` 这种属性本身是一个字典，直接赋值会覆盖 `wrapper` 自己定义的字典条目，所以 `wraps` 选择把 `wrapped.__dict__` 的内容**合并进** `wrapper.__dict__`，而不是替换。

`wraps(wrapped)` 本身返回一个 `Partial`（严格说是 `functools.partial(update_wrapper, wrapped=wrapped, assigned=..., updated=...)`），它再去装饰 `wrapper` 函数。所以 `@wraps(func)` 等价于：

```python
wrapper = functools.update_wrapper(wrapper, func,
                                   assigned=WRAPPER_ASSIGNMENTS,
                                   updated=WRAPPER_UPDATES)
```

`update_wrapper` 才是真正干活的函数，`wraps` 只是它的"装饰器工厂"包装。这也是 `wraps` 常被当作"带参数的装饰器"早期示例的原因——它本身就是 `装饰器(原函数) -> 装饰器 -> wrapper` 的结构。

**演示：用 assigned 限制只复制 __name__ 和 __doc__**

```python
from functools import wraps, WRAPPER_ASSIGNMENTS


def strict(func):
    # 只复制 __name__ 和 __doc__，不复制 __qualname__ / __annotations__
    @wraps(func, assigned=('__name__', '__doc__'))
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper


@strict
def add(a: int, b: int) -> int:
    """返回两数之和。"""
    return a + b


print(add.__name__)    # 输出：add
print(add.__doc__)     # 输出：返回两数之和。

# 但 __qualname__ 和 __annotations__ 没被复制，仍然是 wrapper 的
print(add.__qualname__)
# 输出：strict.<locals>.wrapper
print(add.__annotations__)
# 输出：（wrapper 的默认注解，通常是空字典 {} ）
```

这个例子说明 `assigned` 是可以裁剪的。实际工程中极少需要这么做，但理解它的作用有助于读懂 `wraps` 的内部行为。

### 2.2 不加 wraps 的元信息丢失：逐项实证

为了把"为什么要用 wraps"讲透，下面系统地对比每个会丢失的元属性。先准备一个不加 `wraps` 的装饰器，再逐项观察被装饰函数的元信息。

```python
# ====== 不加 wraps 的装饰器 ======

def summarize(func):
    def wrapper(*args, **kwargs):
        result = func(*args, **kwargs)
        return f"[摘要] {result}"
    return wrapper


@summarize
def get_user_profile(user_id: int) -> dict:
    """根据用户 ID 查询用户资料，返回一个字典。"""
    return {"id": user_id, "name": "张三", "age": 28}
```

逐项检查：

```python
# (1) __name__ ：函数对象的名字
print(get_user_profile.__name__)
# 输出：wrapper
# 本应是 get_user_profile

# (2) __doc__ ：文档字符串
print(get_user_profile.__doc__)
# 输出：None
# 本应是 "根据用户 ID 查询用户资料，返回一个字典。"

# (3) __qualname__ ：限定名（含定义路径）
print(get_user_profile.__qualname__)
# 输出：summarize.<locals>.wrapper
# 本应是 get_user_profile

# (4) __module__ ：所属模块
# 这里恰巧都是 __main__，所以看不出来；如果 wrapper 来自其他模块就会错乱
print(get_user_profile.__module__)
# 输出：__main__

# (5) __annotations__ ：类型注解
print(get_user_profile.__annotations__)
# 输出：{} 或 wrapper 自己的注解（这里 wrapper 没写注解，所以是 {}）
# 本应是 {'user_id': <class 'int'>, 'return': <class 'dict'>}

# (6) __wrapped__ ：是否有指向原函数的链接
print(hasattr(get_user_profile, '__wrapped__'))
# 输出：False
# 加了 wraps 后会变成 True，指向原函数
```

可以看到，除了 `__module__` 巧合一致外，其余五项全部失真。这就引出几个非常具体的"踩坑场景"。

**场景一：日志里全是 wrapper，无法区分函数**

```python
import logging

logging.basicConfig(level=logging.INFO, format='%(message)s')


def audit(func):
    def wrapper(*args, **kwargs):
        logging.info("执行函数 %s", func.__name__)  # 这里用 func.__name__，是对的
        # 但如果有人写成了 func.__name__ 或外层用了 wrapper 自己的名字呢？
        return func(*args, **kwargs)
    return wrapper


# 问题出在：别人拿到的是被装饰后的对象，不是原来的 func
@audit
def delete_order(order_id: int) -> None:
    """删除指定订单。"""
    print(f"已删除订单 {order_id}")


@audit
def refund_order(order_id: int) -> None:
    """对指定订单发起退款。"""
    print(f"已对订单 {order_id} 发起退款")


# 调用方在排查问题时，往往会打印对象本身的名字
logging.info("即将调用 %s", delete_order.__name__)
# 输出：即将调用 wrapper

# 两个不同函数，在日志里名字完全一样
logging.info("即将调用 %s", refund_order.__name__)
# 输出：即将调用 wrapper
```

两个功能完全不同的函数，在日志里都叫 `wrapper`。如果日志里同时出现这两条记录，排查时根本分不清是谁产生的。加了 `wraps` 后，日志会正确显示 `delete_order` 和 `refund_order`。

**场景二：help() 显示错误信息**

```python
# 延续上面不加 wraps 的 get_user_profile
help(get_user_profile)
# 输出：
# Help on function wrapper in module __main__:
#
# wrapper(*args, **kwargs)
#     <无文档>
#
# ——完全看不出这是在查 get_user_profile
```

而加了 `wraps` 后：

```python
from functools import wraps

def summarize2(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        result = func(*args, **kwargs)
        return f"[摘要] {result}"
    return wrapper


@summarize2
def get_user_profile2(user_id: int) -> dict:
    """根据用户 ID 查询用户资料，返回一个字典。"""
    return {"id": user_id, "name": "张三", "age": 28}


help(get_user_profile2)
# 输出：
# Help on function get_user_profile2 in module __main__:
#
# get_user_profile2(user_id: int) -> dict
#     根据用户 ID 查询用户资料，返回一个字典。
```

`help()` 显示的内容来自 `__name__`、`__doc__` 以及函数签名。加了 `wraps` 后，名字、签名、文档全部正确。

**关于 help() 为什么签名也正确**

这里 `help()` 能显示 `get_user_profile2(user_id: int) -> dict`，并不是因为 `wraps` 真的复制了签名（Python 的函数签名本身并不是一个可复制的属性），而是因为 `wraps` 设置了 `__wrapped__`，而 `inspect.signature` 会跟随 `__wrapped__` 链去解析真实签名。`help()` 内部依赖 `inspect`，所以签名也能正确还原。这个机制的细节会在第 4 章原理部分详述。

**场景三：inspect.signature 看不到真实参数**

```python
import inspect


def retry(func):
    def wrapper(*args, **kwargs):
        for attempt in range(3):
            try:
                return func(*args, **kwargs)
            except Exception:
                if attempt == 2:
                    raise
    return wrapper


@retry
def fetch_data(url: str, timeout: int = 5) -> bytes:
    """从指定 URL 拉取数据。"""
    import urllib.request
    return urllib.request.urlopen(url, timeout=timeout).read()


print(inspect.signature(fetch_data))
# 输出：(*args, **kwargs)
# 本应是 (url: str, timeout: int = 5) -> bytes
```

`(*args, **kwargs)` 对调用方毫无价值——它说明不了要传什么参数、哪个是必填、哪个有默认值。加上 `wraps`：

```python
import inspect
from functools import wraps


def retry2(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        for attempt in range(3):
            try:
                return func(*args, **kwargs)
            except Exception:
                if attempt == 2:
                    raise
    return wrapper


@retry2
def fetch_data2(url: str, timeout: int = 5) -> bytes:
    """从指定 URL 拉取数据。"""
    import urllib.request
    return urllib.request.urlopen(url, timeout=timeout).read()


print(inspect.signature(fetch_data2))
# 输出：(url: str, timeout: int = 5) -> bytes
```

签名被完整还原。这就是 `inspect` 跟随 `__wrapped__` 的效果。

**场景四：API 文档生成错乱（Sphinx 等工具）**

像 Sphinx 的 `autodoc` 扩展、pdoc、mkdocs 这类文档工具，通常依赖 `inspect` 或直接读取 `__name__`、`__doc__`、`__signature__` 来自动生成 API 文档。如果装饰器没加 `wraps`：

- 所有被装饰函数的文档名都变成 `wrapper`，文档页会出现一堆同名条目，互相覆盖。
- 文档字符串全部丢失，页面只显示一个光秃秃的 `wrapper(*args, **kwargs)`，没有任何说明。
- 签名变成 `(*args, **kwargs)`，读者无法知道该传什么参数。

加了 `wraps` 后，文档工具就能正确识别每个函数的名字、文档和签名，生成清晰可读的 API 参考。

### 2.3 加 wraps 与不加 wraps 的完整对比

把前面几个点汇成一个可对照的表格，便于一眼看出差距：

| 元信息 / 工具              | 不加 wraps             | 加 wraps                         |
|----------------------------|------------------------|----------------------------------|
| `__name__`                 | `wrapper`              | 原函数名（如 `send_email`）      |
| `__doc__`                  | `None`                 | 原文档字符串                     |
| `__qualname__`             | `xx.<locals>.wrapper`  | 原限定名                         |
| `__module__`               | 通常错乱（跨模块时）   | 原模块                           |
| `__annotations__`          | `wrapper` 的注解（多为空） | 原函数的类型注解               |
| `__wrapped__`              | 无此属性               | 指向原函数对象                   |
| `inspect.signature(f)`     | `(*args, **kwargs)`    | 原真实签名                       |
| `help(f)`                  | 显示 `wrapper` 无文档  | 显示原名 + 原文档 + 原签名      |
| Sphinx / pdoc 文档         | 名字错乱、文档缺失     | 正常生成                         |
| 日志/调试器中的函数名      | 全是 `wrapper`         | 正确显示各函数名                 |

一个完整跑通这个对比的程序：

```python
from functools import wraps
import inspect


# 不加 wraps
def deco_no_wrap(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper


# 加 wraps
def deco_with_wrap(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper


@deco_no_wrap
def func_a(x: int, y: int) -> int:
    """函数 a：两数相加。"""
    return x + y


@deco_with_wrap
def func_b(x: int, y: int) -> int:
    """函数 b：两数相加。"""
    return x + y


def show_info(name, fn):
    print(f"--- {name} ---")
    print("  __name__      :", fn.__name__)
    print("  __qualname__  :", fn.__qualname__)
    print("  __doc__       :", fn.__doc__)
    print("  __annotations__:", fn.__annotations__)
    print("  __wrapped__   :", getattr(fn, '__wrapped__', None))
    print("  signature     :", inspect.signature(fn))
    print()


show_info("func_a (不加 wraps)", func_a)
show_info("func_b (加 wraps)", func_b)
```

```text
--- func_a (不加 wraps) ---
  __name__      : wrapper
  __qualname__  : deco_no_wrap.<locals>.wrapper
  __doc__       : None
  __annotations__: {}
  __wrapped__   : None
  signature     : (*args, **kwargs)

--- func_b (加 wraps) ---
  __name__      : func_b
  __qualname__  : func_b
  __doc__       : 函数 b：两数相加。
  __annotations__: {'x': <class 'int'>, 'y': <class 'int'>, 'return': <class 'int'>}
  __wrapped__   : <function func_b at 0x...>
  signature     : (x: int, y: int) -> int
```

`__wrapped__` 一个 `None`、一个指向原函数对象，这是 `inspect.signature` 能还原签名的前提。

### 2.4 wraps 与 inspect.signature 的配合

`inspect.signature` 是查函数签名的标准工具。它对带 `wraps` 的函数有特殊处理：会沿着 `__wrapped__` 链一路回溯，直到找到真正的底层函数，再基于它生成签名。

```python
from functools import wraps
import inspect


def add_logging(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        print("调用", func.__name__)
        return func(*args, **kwargs)
    return wrapper


def add_timing(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        import time
        t = time.perf_counter()
        result = func(*args, **kwargs)
        print("耗时", time.perf_counter() - t)
        return result
    return wrapper


@add_logging
@add_timing
def process_payment(order_id: int, amount: float, currency: str = "CNY") -> dict:
    """处理一笔支付，返回支付结果字典。"""
    return {"order_id": order_id, "amount": amount, "currency": currency}


print(inspect.signature(process_payment))
# 输出：(order_id: int, amount: float, currency: str = 'CNY') -> dict
```

这里有两层装饰器：`add_logging` 套在最外层，`add_timing` 套在里层。被装饰后的 `process_payment` 的 `__wrapped__` 指向 `add_timing` 的 `wrapper`，而那层 `wrapper` 的 `__wrapped__` 又指向真正的 `process_payment`。`inspect.signature` 会沿这条链回溯，最终给出原始的 `(order_id: int, amount: float, currency: str = 'CNY') -> dict`。

如果想显式拿到"被包装函数本身"（即链的最末端），可以用 `inspect.unwrap`：

```python
real_func = inspect.unwrap(process_payment)
print(real_func.__name__)
# 输出：process_payment
print(real_func is process_payment)          # False，被装饰过
# 输出：False
print(real_func is process_payment.__wrapped__.__wrapped__)
# 输出：True
```

`inspect.unwrap` 会沿着 `__wrapped__` 链走到尽头，返回最底层的原函数，默认还会检测循环引用，避免无限递归。

**手动改了 __wrapped__ 会怎样**

如果出于特殊目的手动把 `__wrapped__` 指向别的函数，`inspect.signature` 会跟着走：

```python
from functools import wraps
import inspect


def fake_signature(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    # 假装它的签名是另一个函数的
    def _fake(a, b, c):
        pass
    wrapper.__wrapped__ = _fake
    return wrapper


@fake_signature
def real(x):
    return x


print(inspect.signature(real))
# 输出：(a, b, c)
```

这种玩法不常用，但说明 `inspect` 完全信任 `__wrapped__`。`wraps` 之所以能"还原签名"，靠的就是 `inspect` 对 `__wrapped__` 的这条跟随规则。

### 2.5 wraps 是装饰器工厂：带参装饰器的早期示例

`wraps` 本身是带参数的，语法是 `@wraps(func)`，`func` 是它的参数。这与普通装饰器 `@deco` 不同——普通装饰器在被装饰函数定义时，`deco` 已经是"装饰器函数"本身；而 `wraps` 先被调用（传入 `func`），返回的才是真正的装饰器。这种"先调用、再装饰"的结构称为"装饰器工厂"，也是带参装饰器的一种典型形态。

```python
# wraps 的"工厂"结构拆解

from functools import wraps, update_wrapper

# @wraps(func) 等价于下面三步：

def my_wraps(func):
    # 第一次调用：传入原函数，返回一个装饰器
    def decorator(wrapper):
        # 第二次调用：传入 wrapper，返回修改后的 wrapper
        update_wrapper(wrapper, func)
        return wrapper
    return decorator


# 验证它和 functools.wraps 行为一致
def my_deco(func):
    @my_wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper


@my_deco
def greet(name: str) -> str:
    """向某人打招呼。"""
    return f"你好，{name}"


print(greet.__name__, '/', greet.__doc__)
# 输出：greet / 向某人打招呼。
```

这个手写版本能帮助理解 `wraps` 的形态：它是一个"接收原函数、返回装饰器"的函数。真实工程中大多数带参数的装饰器（比如 `@app.route('/path')`、`@retry(times=3)`）都是这个结构，`wraps` 可以算是标准库自己提供的一个早期范例。

需要注意的是，`wraps` 本身的参数是被装饰的原函数（`func`），不是普通意义上的"装饰器参数"。所以它更准确的身份是"为了配合装饰器而设计的工具函数"，形态上恰好是装饰器工厂。真正典型的带参装饰器会是 `@retry(times=3)` 这种，参数是装饰器自己的配置项，`wraps` 的结构则可以作为实现这类带参装饰器的模板。

### 2.6 带参数装饰器中 wraps 的使用

当装饰器自己也需要参数时（即三层嵌套结构），`wraps` 的位置仍然在 `wrapper` 上方，这一点不变。

```python
from functools import wraps


def retry(times: int = 3, exceptions: tuple = (Exception,)):
    # 最外层：接收装饰器参数
    def decorator(func):
        # 中间层：接收被装饰函数
        @wraps(func)
        def wrapper(*args, **kwargs):
            # 最内层：实际包装逻辑
            last_exc = None
            for attempt in range(times):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exc = e
                    print(f"第 {attempt + 1} 次尝试失败：{e}")
            raise last_exc
        return wrapper
    return decorator


@retry(times=3, exceptions=(ValueError, KeyError))
def read_config(key: str) -> str:
    """从配置中读取某个键的值。"""
    config = {}  # 模拟一个空配置，必然抛 KeyError
    return config[key]


try:
    read_config("db_host")
except KeyError:
    print("最终失败：键不存在")
# 输出：
# 第 1 次尝试失败：'db_host'
# 第 2 次尝试失败：'db_host'
# 第 3 次尝试失败：'db_host'
# 最终失败：键不存在

print(read_config.__name__)
# 输出：read_config
print(read_config.__doc__)
# 输出：从配置中读取某个键的值。
```

结构是 `retry(times, exceptions) -> decorator(func) -> wrapper(*args, **kwargs)`。`@wraps(func)` 依然写在 `wrapper` 定义正上方。无论装饰器嵌套多少层，只要找到定义 `wrapper` 的那一层，把 `@wraps(func)` 放在它正上方即可。

### 2.7 wraps 对类装饰器的适用性

`wraps` 并不是只能用于函数装饰器，也可以处理"用类实现的装饰器"（即带 `__call__` 的类实例）。但需要注意，类装饰器返回的是实例而非函数，`wraps` 复制的是原函数的属性到一个对象上，可能需要借助 `update_wrapper` 手动调用，因为 `@wraps` 装饰语法只能贴在 `def` 定义上。

```python
from functools import wraps, update_wrapper
import inspect


class CountCalls:
    """统计函数被调用次数的类装饰器。"""

    def __init__(self, func):
        # 把原函数的元信息复制到实例本身
        update_wrapper(self, func)
        self.func = func
        self.count = 0

    def __call__(self, *args, **kwargs):
        self.count += 1
        print(f"第 {self.count} 次调用 {self.func.__name__}")
        return self.func(*args, **kwargs)

    # 下面这两个方法让 inspect.signature 也能正确工作
    def __get__(self, obj, objtype=None):
        return self if obj is None else MethodType(self, obj)  # noqa: F821


@CountCalls
def say_hello(name: str) -> str:
    """向某人问好。"""
    return f"Hello, {name}"


print(say_hello.__name__)
# 输出：say_hello
print(say_hello.__doc__)
# 输出：向某人问好。
print(inspect.signature(say_hello))
# 输出的部分依赖 __wrapped__，此处会显示原始签名
say_hello("张三")
say_hello("李四")
print("共调用", say_hello.count, "次")
# 输出：共调用 2 次
```

类装饰器中用 `update_wrapper(self, func)` 把原函数的属性复制到实例对象上，这样外部访问 `say_hello.__name__` 时能拿到正确值。不过类装饰器的签名还原比函数装饰器复杂，通常还需要额外实现 `__signature__` 或让 `__call__` 的签名与原函数一致。这里只是展示 `wraps`/`update_wrapper` 同样适用于类装饰器场景。

### 2.8 手动访问 functools.update_wrapper

`wraps` 是 `update_wrapper` 的装饰器语法糖。如果不想用 `@wraps(func)` 的写法，可以直接调用 `update_wrapper`：

```python
from functools import update_wrapper
import inspect


def trace(func):
    def wrapper(*args, **kwargs):
        print("调用", func.__name__)
        return func(*args, **kwargs)
    # 等价于在 wrapper 上加 @wraps(func)
    update_wrapper(wrapper, func)
    return wrapper


@trace
def compute(x: int, y: int) -> int:
    """计算 x 与 y 的某种组合。"""
    return x * y + y


print(compute.__name__)
# 输出：compute
print(compute.__doc__)
# 输出：计算 x 与 y 的某种组合。
print(inspect.signature(compute))
# 输出：(x: int, y: int) -> int
```

`update_wrapper` 的签名是：

```python
functools.update_wrapper(wrapper, wrapped,
                         assigned=WRAPPER_ASSIGNMENTS,
                         updated=WRAPPER_UPDATES)
```

它是 `wraps` 的底层实现。`wraps(wrapped)` 等价于 `partial(update_wrapper, wrapped=wrapped, ...)`。`update_wrapper` 返回 `wrapper` 本身，因此可以链式调用。

### 2.9 查看 WRAPPER_ASSIGNMENTS 与 WRAPPER_UPDATES

这两个常量定义了"复制哪些"和"更新哪些"，可以直接从 `functools` 导入查看：

```python
from functools import WRAPPER_ASSIGNMENTS, WRAPPER_UPDATES

print(WRAPPER_ASSIGNMENTS)
# 输出：('__module__', '__name__', '__qualname__', '__annotations__', '__doc__')

print(WRAPPER_UPDATES)
# 输出：('__dict__',)
```

`assigned` 那五项是"赋值复制"——如果原函数有这个属性，就把它整体赋给 `wrapper`（覆盖 `wrapper` 自己的）。`updated` 那一项是"合并更新"——把原函数 `__dict__` 里的键值对逐个放进 `wrapper.__dict__`。

可以验证 `__dict__` 的更新行为：

```python
from functools import wraps


def deco(func):
    # 先给 wrapper 自己塞一个标记
    @wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    wrapper.custom_marker = "来自 wrapper"
    return wrapper


@deco
def target():
    """目标函数。"""
    return None

target.extra_attr = "原函数的额外属性"  # 给原函数设置属性

# 注意：这行赋值挂在 target 上，而 target 已经是 wrapper 了
# 所以它进的是 wrapper 的 __dict__
print(target.__dict__)
# 输出：{'custom_marker': '来自 wrapper', 'extra_attr': '原函数的额外属性'}
```

真正能体现 `__dict__` 合并的场景是：在 `@deco` 之前就给原函数设置属性，然后被装饰后这些属性依然可见。

```python
from functools import wraps


def target_original():
    """原函数。"""
    return None

target_original.extra_attr = "原函数的额外属性"


def deco2(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper


wrapped_target = deco2(target_original)

print(wrapped_target.__dict__)
# 输出：{'extra_attr': '原函数的额外属性'}
# 原函数 __dict__ 里的内容被合并进了 wrapper 的 __dict__
```

这就是 `WRAPPER_UPDATES` 的作用：确保原函数上的自定义属性不会丢失，能"穿透"装饰器出现在最终对象上。

---

## 3. 最佳实践

**习惯成自然：每个 wrapper 都加 wraps**

写装饰器时，给 `wrapper` 加 `@wraps(func)` 应当成为肌肉记忆。无论装饰器多简单、内层函数多短，都加上。成本极低（一行代码），收益是让被装饰函数在调试、日志、文档、签名检查等所有场景下都表现正常。

推荐写法：

```python
from functools import wraps


def my_decorator(func):
    @wraps(func)                       # 永远写这一行
    def wrapper(*args, **kwargs):
        ...
        return func(*args, **kwargs)
    return wrapper
```

不推荐写法：

```python
def my_decorator(func):
    def wrapper(*args, **kwargs):      # 忘了 wraps，元信息全销
        return func(*args, **kwargs)
    return wrapper
```

**不要只复制名字，要复制全部默认属性**

有些人会手动只复制 `__name__` 和 `__doc__` 来"偷懒"：

```python
def bad_deco(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    wrapper.__name__ = func.__name__
    wrapper.__doc__ = func.__doc__
    return wrapper
```

这样能解决最表面的日志问题，但 `__qualname__`、`__annotations__`、`__wrapped__` 都没处理，`inspect.signature` 仍然看不到真实签名，`help()` 也显示不出正确签名。应直接用 `@wraps(func)`，让标准库替你处理全部默认属性。

**类装饰器记得调用 update_wrapper**

类装饰器里没有 `def wrapper` 可以挂 `@wraps`，但可以在 `__init__` 里调用 `update_wrapper(self, func)`，把元属性复制到实例上。否则外部访问 `instance.__name__` 会拿到类默认的 `__name__`（类名字），而不是原函数的。

**多层装饰器加 wraps 的顺序**

当多层装饰器叠加时，每一层 `wrapper` 都应加 `@wraps(func)`，其中 `func` 是"交给本层装饰器的那一版函数"（可能是上一层 wrapper 输出的结果）。这样 `__wrapped__` 链才能层层回溯到最原始的函数。漏加某一层，或把 `func` 写错成最外层函数名，签名回溯就会断链。

```python
from functools import wraps


def deco_a(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper


def deco_b(func):
    @wraps(func)   # func 这里指的是 deco_b 收到的那版函数（已被 deco_a 装饰过）
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper


@deco_a
@deco_b
def business(x: int) -> int:
    """业务函数。"""
    return x
```

每一层的 `func` 都是"上一层给过来的函数"，不要手动写死成最原始的 `business`，否则 `__wrapped__` 链会跳过中间环节，虽不影响最终签名，但会让调试和 `inspect.unwrap` 的逐层回溯行为不清晰。

**需要暴露真实包装函数时不要误用 __wrapped__**

`__wrapped__` 的语义是"我（wrapper）在包装这个函数"。它不是"装饰器配置"的存放处，也不应被随意改写。一旦在 `wraps` 之外手动修改 `wrapper.__wrapped__`，`inspect.signature` 会跟着你指的那个函数走，可能让签名变成意料之外的样子。如果确实要伪造签名，请用 `inspect.Signature.replace` 或 `__signature__` 属性，而不是篡改 `__wrapped__`。

**保持 wrapper 签名与原函数兼容**

`wrapper(*args, **kwargs)` 能兼容任意签名，但代价是静态检查工具（如 mypy）无法校验参数类型。如果你的装饰器不改变签名，又希望类型检查器能继续工作，可以用 `ParamSpec`/`TypeVarTuple`（Python 3.10+ 的 `typing`）让 `wrapper` 保留原函数的签名类型。这是比 `wraps` 更进一步的类型保留手段，`wraps` 只管运行时元信息，不管静态类型。

**反序列化场景对 __name__ 的依赖**

有一些场景会按函数的 `__name__` + `__module__` 去查找真实函数对象，例如 `multiprocessing` 的某些序列化路径、`pickle`（对函数有限支持）、一些任务队列框架（Celery、RQ）的任务注册表。如果装饰器没加 `wraps`，`__name__` 变成 `wrapper`，反序列化时按这个名字找不到真实函数，会抛 `AttributeError` 或 `ImportError`。给装饰器加 `wraps`，能避免这类"按名字找函数"的流程失效。

```python
from functools import wraps
import pickle


def deco(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper


@deco
def task_compute(x: int) -> int:
    """一个可被序列化的任务。"""
    return x * x


# pickle 对函数只能存名字 + 模块，反序列化时按这两个属性重新定位
data = pickle.dumps(task_compute)
restored = pickle.loads(data)
print(restored.__name__)
# 输出：task_compute
```

如果没加 `wraps`，`pickle.dumps` 可能依然能存（存的是 `wrapper` 这个名字），但 `pickle.loads` 时会按 `wrapper` 去模块里找，找不到就报错。即便能找到，反序列化回来的也只是一个叫 `wrapper` 的普通函数，丢失了原函数的语义。

**测试中用 inspect 校验签名**

写装饰器的测试时，别只测"被装饰后行为对不对"，还要测"被装饰后元信息对不对"。一个最小的回归测试骨架：

```python
import inspect
from my_decorators import retry  # 假设


def test_retry_preserves_metadata():
    @retry()
    def sample(url: str, timeout: int = 5) -> bytes:
        """doc"""
        return b""

    assert sample.__name__ == "sample"
    assert sample.__doc__ == "doc"
    assert str(inspect.signature(sample)) == "(url: str, timeout: int = 5) -> bytes"
```

一旦有人改动了装饰器实现、不小心删掉了 `@wraps`，这个测试会立刻失败，把元信息丢失的问题挡在合入代码之前。

**相对地：偶尔不需要 wraps**

当装饰器的目的就是"彻底替换"原函数、不想让外部看到任何原函数信息时，可以不加 `wraps`。这种情况极少，例如某些"禁用函数"的装饰器会让被装饰函数直接抛异常，且不希望 `help()` 还显示原来的文档。绝大多数情况下还是该加。

---

## 4. 原理

### 4.1 __name__ 等属性是函数对象自身的属性

要理解"元信息为什么会丢"，首先要明白 `__name__`、`__doc__` 这些属性是存在哪里的。它们不是"全局命名空间里的标签"，而是**函数对象自身的属性**。每一个 `def` 语句执行时，Python 会创建一个新的函数对象，并在这个对象上设置 `__name__`、`__qualname__`、`__doc__` 等属性，属性的值来自 `def` 的语法信息（函数名、文档字符串等）。

```python
def alpha():
    """alpha 的文档"""
    pass


def beta():
    """beta 的文档"""
    pass


print(alpha.__name__, '/', alpha.__doc__)   # 输出：alpha / alpha 的文档
print(beta.__name__, '/', beta.__doc__)     # 输出：beta / beta 的文档
```

`alpha` 和 `beta` 是两个不同的函数对象，各自带自己的 `__name__` 和 `__doc__`。它们彼此独立，不能通过"名字叫 alpha"推断出对方的属性。

装饰器做的事情，是返回一个**新的函数对象**（通常是 `wrapper`），然后把外部名字绑定到这个新对象上。用伪代码表示 `@deco / def f` 的实际执行过程：

```python
def f():
    ...

f = deco(f)
# deco 内部返回了 wrapper，所以这一步之后，f 这个名字指向 wrapper
```

关键点：`deco` 返回的 `wrapper` 是 `def wrapper` 定义出来的一个全新函数对象，它有自己的 `__name__ = "wrapper"`、`__doc__ = None`。外部名字 `f` 现在绑定到 `wrapper` 上，所以 `f.__name__` 自然就是 `wrapper`。原函数对象其实还活着（被 `wrapper` 的闭包 `func` 变量引用着），但外部已经访问不到它了，外部访问到的是 `wrapper`。

这就是"元信息丢失"的根因：**`__name__` 等是函数对象自身的属性，跟着"当前指向的对象"走，而不是跟着"外部用的名字"走**。外部名字从指向 `f` 切换到指向 `wrapper` 之后，属性自然就变成了 `wrapper` 的。

```python
def deco(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper


@deco
def f():
    """f 的文档"""
    pass


# f 这个名字现在指向 wrapper 对象
print(f.__name__)   # 输出：wrapper
print(f.__doc__)    # 输出：None

# 原 f 对象其实还在，被 wrapper 的闭包引用着
# 我们无法通过外部名字访问到它，但可以通过 __wrapped__ 或闭包变量看到（加了 wraps 之后）
```

一旦理解了"属性跟着对象走"，就知道 `wraps` 要做的事情很直接：**把原函数对象的这些属性值，显式复制到 wrapper 对象上**。复制之后，wrapper 对象的 `__name__` 就被改写成原函数的名字，外部再访问 `f.__name__` 时，由于 `f` 指向的是 wrapper，而 wrapper 的 `__name__` 已经被改写，于是就能拿到正确值。

### 4.2 functools.update_wrapper 如何复制属性

`wraps` 的底层是 `update_wrapper`。它的核心逻辑可以概括为三步：赋值复制 `assigned` 中的属性、合并更新 `updated` 中的属性、设置 `__wrapped__` 指向原函数。下面用等价的简化实现来展示这个过程：

```python
# 简化版 update_wrapper，仅演示逻辑，并非 CPython 原始实现

WRAPPER_ASSIGNMENTS = ('__module__', '__name__', '__qualname__',
                       '__annotations__', '__doc__')
WRAPPER_UPDATES = ('__dict__',)


def update_wrapper_simple(wrapper, wrapped,
                          assigned=WRAPPER_ASSIGNMENTS,
                          updated=WRAPPER_UPDATES):
    # 第一步：对 assigned 中的每个属性，尝试从 wrapped 复制到 wrapper
    for attr in assigned:
        try:
            value = getattr(wrapped, attr)
        except AttributeError:
            pass
        else:
            setattr(wrapper, attr, value)

    # 第二步：对 updated 中的每个属性，把 wrapped 的内容"合并"进 wrapper
    for attr in updated:
        # 拿到两边的 __dict__（或其他指定属性），把 wrapped 的键值合并进去
        getattr(wrapper, attr).update(getattr(wrapped, attr, {}))

    # 第三步：设置 __wrapped__，建立从 wrapper 回溯到 wrapped 的链
    wrapper.__wrapped__ = wrapped

    # 返回 wrapper，方便链式调用
    return wrapper
```

逐段拆解：

**第一步：赋值复制 assigned**

对 `__module__`、`__name__`、`__qualname__`、`__annotations__`、`__doc__` 这五个属性名，分别用 `getattr` 从原函数读值，再用 `setattr` 写到 `wrapper` 上。注意它是"按名字取值再赋值"，所以如果原函数没有某个属性（理论上极少，但可能），就用 `try/except` 跳过，不报错。赋值之后，`wrapper.__name__` 就等于原函数的名字，其余同理。

为什么用"赋值"而不是"合并"对这五项？因为它们都是单一值（字符串、字典、`None`），而不是可累积的容器。`__name__` 就是一个字符串，没了就没了，复制就是要覆盖。

**第二步：合并更新 updated**

对 `__dict__` 这一项（默认只有它），用 `wrapper.__dict__.update(wrapped.__dict__)` 把原函数 `__dict__` 里所有的键值对合并进 `wrapper.__dict__`。这样原函数上挂的额外属性（比如 `func.is_admin = True` 这种给函数对象打的标记）不会因为装饰而丢失。

为什么对 `__dict__` 要"合并"而不是"覆盖"？因为 `wrapper` 自身的 `__dict__` 可能已经有内容（比如 `wraps` 执行前别人给它设置的属性），直接覆盖会把这些内容冲掉。合并能确保两边的属性都保留。这也解释了为什么 `WRAPPER_UPDATES` 只放 `__dict__`——它是一个字典，适合合并；而 `__name__` 这种字符串属性只能赋值。

**第三步：设置 __wrapped__**

`wrapper.__wrapped__ = wrapped`，把原函数对象挂到 `wrapper` 的 `__wrapped__` 属性上。这一步意义重大：它是 `inspect.signature`、`inspect.unwrap`、`help()` 等工具"回溯到原函数"的入口。没有它，`inspect` 只能看到 `wrapper` 自己的 `(*args, **kwargs)` 签名。有了它，`inspect` 会沿 `__wrapped__` 链一路走到真正的原函数，再基于原函数解析签名。

**update_wrapper 返回 wrapper**

`update_wrapper` 最后返回 `wrapper` 本身，这让它可以链式调用：

```python
wrapper = update_wrapper(wrapper, func)
# 或者
@wraps(func)
def wrapper(...): ...
# @wraps(func) 等价于 wrapper = update_wrapper(wrapper, func)
```

这种"返回 wrapper 自己"的设计是装饰器能正常工作的前提——被装饰的结果必须是 `wrapper`，而不是 `None`。

**完整对一遍 update_wrapper 的源码逻辑**

CPython 的 `functools.py` 里 `update_wrapper` 的核心逻辑和上面简化版基本一致，主要差别是容错更细致（处理 `__dict__` 不存在的情况、跳过缺失属性）以及性能优化（用 `getattr` 一次性取值）。简化版的误差在于 `getattr(wrapper, attr)` 当 `attr='__dict__'` 时拿到的是 wrapper 的字典引用，`.update` 会原地修改它——这一点和真实实现一致。

### 4.3 wraps 是 update_wrapper 的装饰器工厂

`wraps` 本质上是 `update_wrapper` 的"装饰器风格包装"。它的源码非常短，大致等价于：

```python
def wraps(wrapped,
          assigned=WRAPPER_ASSIGNMENTS,
          updated=WRAPPER_UPDATES):
    return partial(update_wrapper, wrapped=wrapped,
                   assigned=assigned, updated=updated)
```

也就是说，`wraps(func)` 返回一个 `partial` 对象，这个 partial 已经绑定了 `wrapped=func` 参数。当它被用作装饰器（即 `partial(wrapper)`）时，等价于调用 `update_wrapper(wrapper, wrapped=func, assigned=..., updated=...)`。

理解了这一点，就能解释一些容易困惑的现象：

- `@wraps(func)` 为什么能"装饰"一个 `def`？因为 `partial(update_wrapper, wrapped=func)` 是一个可调用对象，调用它会执行 `update_wrapper(wrapper, wrapped=func)`，返回 `wrapper`。
- `wraps(func)` 的"参数" `func` 从哪来？它是在装饰器 `deco` 内部能访问到的闭包变量，也就是被装饰的原函数。
- 为什么说 `wraps` 是"带参装饰器"的早期示例？因为它的使用形式 `@wraps(func)` 正是"先调用拿参数、再用返回值装饰"的结构，和 `@retry(times=3)`、`@app.route('/path')` 的形态完全一致。

这也让 `wraps` 成了讲解"带参装饰器"时的天然范例：标准库自己就用 `wraps` 这个结构实现了一个"带参的装饰器"，开发者完全可以在自定义装饰器里套同一种结构。

### 4.4 inspect.signature 如何跟随 __wrapped__ 还原签名

这是 `wraps` 带来的最有价值的能力之一：被多层装饰器套过的函数，`inspect.signature` 仍能看到最原始的签名。它的原理是 `inspect` 内部对 `__wrapped__` 的特殊处理。

`inspect.signature` 解析一个函数签名时，大致按这个顺序查找：

1. 如果对象有 `__signature__` 属性，直接用它（优先级最高，可以人为覆盖签名）。
2. 否则，如果对象有 `__wrapped__` 属性，递归地对 `__wrapped__` 再求签名。
3. 最终落到一个"没有 `__wrapped__`"的函数上，解析它的 `def` 签名（通过代码对象的参数信息）。

简化伪代码：

```python
def signature_simple(obj):
    # 1. 显式 __signature__ 优先
    sig = getattr(obj, '__signature__', None)
    if sig is not None:
        return sig
    # 2. 跟随 __wrapped__ 链
    wrapped = getattr(obj, '__wrapped__', None)
    if wrapped is not None:
        return signature_simple(wrapped)
    # 3. 没有 __wrapped__，解析 obj 自身的 def 签名
    return _parse_def_signature(obj)
```

实际 CPython 的 `inspect` 实现比这复杂（还要处理 `staticmethod`/`classmethod`、绑定方法、`__call__` 等），但对普通函数装饰器而言，核心就是"跟随 `__wrapped__` 递归回溯"。

这就解释了前面那个两层装饰器的例子为什么能还原原始签名：

```python
@add_logging
@add_timing
def process_payment(order_id: int, amount: float, currency: str = "CNY") -> dict:
    ...
```

被装饰后的 `process_payment` 对象关系链是：

```
process_payment  (add_logging 的 wrapper)
  └─ __wrapped__ -> add_timing 的 wrapper
        └─ __wrapped__ -> 真正的 process_payment 函数对象
```

`inspect.signature(process_payment)` 第一步发现 `__wrapped__`，递归到 `add_timing` 的 wrapper；它也有 `__wrapped__`，再递归到真正的 `process_payment`；真正的函数没有 `__wrapped__`，解析它的 `def` 签名，返回 `(order_id: int, amount: float, currency: str = 'CNY') -> dict`。

**inspect.unwrap 与循环引用保护**

`inspect` 还提供了 `unwrap(func, stop=None)` 函数，专门用来沿 `__wrapped__` 链走到尽头：

```python
import inspect

original = inspect.unwrap(process_payment)
print(original.__name__)
# 输出：process_payment
```

`unwrap` 默认会检测循环引用：如果链上出现已经访问过的函数对象，就停止，避免无限递归。可以传 `stop` 回调自定义停止条件。这个保护机制的存在说明 `__wrapped__` 并不总是被规规矩矩维护的——某些自定义装饰器可能错误地把 `__wrapped__` 指向了链上某个祖先，形成环，`unwrap` 的循环检测能兜住这种情况。

**wraps 与 inspect 的协作关系**

`wraps` 和 `inspect` 在设计上是配合的：

- `wraps` 负责在装饰器里设置好 `__wrapped__`，并复制基础元属性。
- `inspect` 负责在读取签名/文档时，沿着 `__wrapped__` 链还原真实信息。

两者分工明确：`wraps` 是"写入端"，`inspect` 是"读取端"。这种"写入端写元信息、读取端读元信息"的约定，让所有依赖 `inspect` 的工具（`help()`、`pydoc`、`Sphinx` autodoc、`pytest` 的参数名显示、IDE 的参数提示等）都能自动受益——只要装饰器加了 `wraps`，这些工具就能看到正确的签名和文档。

反过来，如果只复制 `__name__`、`__doc__` 而不设 `__wrapped__`（或漏设 `__annotations__`），签名就还原不了。`wraps` 把这些事一次性都做了，所以"用 `wraps`"几乎是保留元信息的唯一推荐做法。

### 4.5 为什么 __dict__ 要"更新"而不是"赋值"

`WRAPPER_UPDATES = ('__dict__',)` 这一项在原理上是个细节，但理解它能帮你看清 `update_wrapper` 的全貌。

函数对象自带一个 `__dict__` 属性，它是一个字典，用来存放"挂在这个函数上的自定义属性"。例如：

```python
def f():
    pass

f.is_cached = True
f.version = "1.0"

print(f.__dict__)
# 输出：{'is_cached': True, 'version': '1.0'}
```

`wraps` 处理 `__dict__` 时，为什么选择 `wrapper.__dict__.update(wrapped.__dict__)` 而不是 `wrapper.__dict__ = wrapped.__dict__`？有两个原因：

第一，直接赋值会让 `wrapper` 和 `wrapped` 共用同一个字典对象。之后再给 `wrapper` 挂的属性也会出现在原函数对象上，反之亦然——两个对象共享状态，行为反直觉。

第二，`wrapper` 自己可能在 `wraps` 之前已经挂过属性（例如某些框架先给 wrapper 设置了内部标记）。直接覆盖会把这些标记冲掉。`update` 只合并原函数的条目，不破坏 wrapper 自身已有的条目，更安全。

```python
from functools import wraps


def deco(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    wrapper.internal_marker = True   # wrapper 自己挂的属性
    return wrapper


def original():
    pass

original.extra = "原函数的额外属性"


# 手工模拟 wraps 后，wrapper.__dict__ 应该既有自己挂的，也有原函数的
# 等价验证：先把 original 装饰一下，再看 wrapper.__dict__
wrapped = deco(original)
print(wrapped.__dict__)
# 输出：{'internal_marker': True, 'extra': '原函数的额外属性'}
# internal_marker 是 wrapper 自己的，extra 是从原函数 __dict__ 合并来的
```

这就是"更新"而非"赋值"的价值：两边都保留。

### 4.6 __wrapped__ 与 __signature__ 的优先级

`inspect.signature` 先看 `__signature__`，再看 `__wrapped__`。如果你给一个函数显式设置了 `__signature__`，它会无条件覆盖，`__wrapped__` 就被忽略了。这个优先级让"伪造签名"成为可能：

```python
import inspect
from functools import wraps


def deco(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    # 故意把签名伪造成 (a, b)
    wrapper.__signature__ = inspect.Signature.from_callable(lambda a, b: None)
    return wrapper


@deco
def real(x: int, y: int, z: int) -> int:
    """真实的三个参数。"""
    return x + y + z


print(inspect.signature(real))
# 输出：(a, b)
# 显式 __signature__ 覆盖了 __wrapped__ 还原的签名
```

这个机制在框架里偶尔有用：某些装饰器需要把签名"改造"成对外暴露的形式（比如掩盖内部参数、填默认值）。但绝大多数业务装饰器不需要这种操作，让 `wraps` + `__wrapped__` 把原签名原样呈现即可。

### 4.7 wraps 不复制的东西

最后，`wraps` 不是万能的，它只复制 `WRAPPER_ASSIGNMENTS` 里列的五项属性，加上 `__dict__` 的合并和 `__wrapped__` 的设置。它**不会**复制：

- 函数的实际代码逻辑（这是 `wrapper` 自己的事，由你手写）。
- 函数的静态类型签名（这是 `typing` 的领域，需要 `ParamSpec` 或 `Concatenate` 才能保留）。
- 函数的 `__code__`（代码对象，包含字节码、局部变量名等），`wraps` 不碰它。
- 函数的默认参数值、关键字参数默认值（这些是 `__defaults__`、`__kwdefaults__`，不在 `WRAPPER_ASSIGNMENTS` 里）。
- 函数的 `__globals__`（全局命名空间引用，决定了函数体内的名字解析环境）。

这意味着：如果你直接看 `wrapper.__code__`，它仍然是 `(*args, **kwargs)` 的代码对象，并没有变成原函数的字节码。`inspect.signature` 能还原"看起来"的签名，靠的是 `__wrapped__` 链，而不是改动 `wrapper.__code__`。所以 `wraps` 保留的是"元信息层面"的真相，而 `wrapper` 的实际执行行为始终是它自己的代码。

```python
from functools import wraps
import inspect


def deco(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper


@deco
def real(a: int, b: int) -> int:
    return a + b


# signature 显示的是还原后的真实签名
print(inspect.signature(real))
# 输出：(a: int, b: int) -> int

# 但 code 对象仍然是 wrapper 自己的
print(real.__code__.co_varnames)
# 输出：('args', 'kwargs')
print(real.__code__.co_argcount)
# 输出：0
```

这就是"元信息还原"和"代码对象不变"之间的关系：`wraps` 让外部工具看到原函数的元信息，但 `wrapper` 本体的代码对象没变。对绝大多数场景（`help`、文档生成、日志、签名检查）来说，"元信息正确"已经足够；而对极少数需要直接读 `__code__` 的场景，`wraps` 帮不上忙，要靠 `inspect.unwrap` 先拿到原函数再分析。

---

## 5. 总结

### 5.1 本文内容要点

- 装饰器返回的 `wrapper` 会顶替原函数的名字绑定，导致 `__name__`、`__doc__`、`__qualname__`、`__annotations__`、`__module__` 等元信息从"原函数的"变成"wrapper 的"，`__wrapped__` 属性也缺失。
- 元信息丢失会造成的具体后果：日志里全是 `wrapper`、`help()` 显示错误、`inspect.signature` 只看到 `(*args, **kwargs)`、Sphinx 等文档生成工具错乱、按 `__name__` 反序列化找函数失败。
- `functools.wraps(func)` 是标准库提供的解法：作为装饰器写在 `wrapper` 定义上方，它调用 `update_wrapper`，把原函数的元属性复制到 `wrapper` 上，并设置 `__wrapped__` 指向原函数。
- `update_wrapper` 的三步动作：对 `WRAPPER_ASSIGNMENTS` 中的属性做"赋值复制"（默认含 `__module__`/`__name__`/`__qualname__`/`__annotations__`/`__doc__`）；对 `WRAPPER_UPDATES` 中的属性做"合并更新"（默认含 `__dict__`）；设置 `__wrapped__`。
- `wraps` 是"带参装饰器"的早期示例：`@wraps(func)` 结构与 `@retry(times=3)` 一致，都是"先调用拿参数、再用返回值装饰"。
- `inspect.signature` 会沿 `__wrapped__` 链递归回溯，直到遇到没有 `__wrapped__` 的原函数，再基于它解析签名。`inspect.unwrap` 也能手动走这条链。
- 多层装饰器叠加时，每一层 `wrapper` 都应加 `@wraps(func)`，`func` 是本层收到的函数版本，以保证 `__wrapped__` 链不断裂。
- `wraps` 只保留运行时元信息，不复制 `__code__`、类型签名、默认参数值等；静态类型保留需要 `ParamSpec`/`TypeVarTuple`。

### 5.2 读完应能掌握

- 能说清"装饰器导致元信息丢失"的根因：`__name__` 等是函数对象自身属性，跟着 `wrapper` 对象走，而不是跟着外部名字走。
- 能写出带 `@wraps(func)` 的标准装饰器，并解释它做了哪三件事（复制 assigned 属性、合并 updated 属性、设置 `__wrapped__`）。
- 能用对比 demo 实证"不加 wraps"与"加 wraps"在 `__name__`、`__doc__`、`inspect.signature`、`help()` 上的差异。
- 能解释 `inspect.signature` 为何能还原被多层装饰器包装过的函数签名：沿 `__wrapped__` 链递归回溯。
- 能识别出至少三种"不加 wraps 会踩坑"的具体场景（日志无法区分函数、`help()` 显示错误、反序列化按名字找函数失败）。
- 能写出针对装饰器元信息保留的最小回归测试（校验 `__name__`、`__doc__`、`inspect.signature`）。
