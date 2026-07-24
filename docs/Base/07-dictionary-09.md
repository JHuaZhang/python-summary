---
group:
  title: 【07】字典深度剖析
  order: 7
order: 9
title: 字典解包与**kwargs
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 \*\*kwargs 和字典解包

`**kwargs` 和 `**dict` 是 Python 中同一个 `**` 运算符在**两个方向**上的使用：

- **收集方向**：在函数定义的形参列表里，`**kwargs` 表示"把所有多余的关键字参数收集到一个字典里"。`kwargs` 只是一个习惯性变量名，可以用任何合法名称。
- **展开方向**：在函数调用的实参列表里，`**dict` 表示"把这个字典展开成关键字参数传给函数"。

```python
# 方向一：收集 — 函数定义中，把多余关键字参数收进字典
def user_info(name, **kwargs):
    print(f"name: {name}")
    print(f"extras: {kwargs}")

user_info("Alice", age=30, city="Beijing", role="admin")
# 输出：
# name: Alice
# extras: {'age': 30, 'city': 'Beijing', 'role': 'admin'}

# 方向二：展开 — 函数调用中，把字典展开成关键字参数
config = {"sep": "-", "end": "!\n"}
print("hello", "world", **config)
# 输出：hello-world!
```

前一篇《字典合并》讲过 `{**d1, **d2}` 的**字面量解包**——那是 `**` 的第三种用法，发生在花括号字面量内部，用于合并字典。本篇聚焦于前两种：**函数参数领域的一收一放**。这三种用途共享相同的 `**` 标记，但作用范围和语义截然不同。

把三类 `**` 用法整理在一起，方便区分：

| 用途        | 语法位置          | 方向        | 结果                             |
| ----------- | ----------------- | ----------- | -------------------------------- |
| 收集 kwargs | `def f(**kwargs)` | 实参 → 字典 | 创建新字典，填充多余关键字参数   |
| 展开字典    | `f(**dict)`       | 字典 → 实参 | 字典被展开成关键字参数传给函数   |
| 字面量合并  | `{**d1, **d2}`    | 字典 → 字典 | 两字典合并，生成新字典（前一篇） |

本篇核心主线是：**`**` 在函数调用中如何实现"字典 → 关键字参数"的映射，以及它在函数定义中如何实现"多余关键字 → 字典"的收集\*\*。理解这两个方向，你就完全掌控了 Python 函数参数系统的最后一环。

### 1.2 为什么需要 \*\*kwargs：可扩展性和参数透传

`**kwargs` 的存在不是为了炫技，而是解决两个关键问题：

**问题一：可扩展性**。如果你设计的函数需要接收"当时所有已知的选项"，同时又希望"未来新增选项不用改函数签名"，`**kwargs` 就是天然的方案。来看一个 HTTP 请求函数的例子：

```python
import requests

# 没有 kwargs：每新增一个参数都要手动加
def old_fetch(url, timeout=10, headers=None, auth=None, proxies=None):
    return requests.get(url, timeout=timeout, headers=headers, auth=auth, proxies=proxies)

# 有 kwargs：requests 支持多少参数，fetch 就能透传多少，无需一一声明
def new_fetch(url, **kwargs):
    return requests.get(url, **kwargs)

# 两行代码就完成了上面 10 行的活
new_fetch("https://api.example.com", timeout=5, auth=("user", "pass"))
```

**问题二：参数透传**。当你的函数需要"接收一些参数处理，把剩下的原封不动传给下一层函数"时，`**kwargs` 是唯一不需要"每一层都显式声明参数"的方式。这在装饰器、中间件、API wrapper 模式中无处不在。

```python
# 典型的 decorator 透传模式
def log_calls(func):
    def wrapper(*args, **kwargs):       # 原封不动接收
        print(f"Calling {func.__name__}")
        result = func(*args, **kwargs)  # 原封不动透传
        print(f"Returned {result}")
        return result
    return wrapper
```

至此，`**kwargs` 的设计动机就清楚了：**它是 Python 为了让函数接口对未来保持开放而设计的关键机制。它解决的不仅是"参数多了怎么办"，更是"参数未知时怎么办"。**

### 1.3 关键概念：\*\* 的真实语义——映射端口

把 `**` 理解为"映射端口"比"解包/打包"更准确。在函数定义侧，`**kwargs` 把函数调用时的**键=值**映射，以字典形式捕获；在函数调用侧，`**dict` 把字典的**键→值**映射，还原为函数的关键字参数。两端的核心操作都是"映射的重新表达"：

```
函数调用侧：f(a=1, b=2)        →   f(**{"a": 1, "b": 2})
              键=值实参                    字典映射展开

函数定义侧：def f(**kwargs)    →   {"a": 1, "b": 2}
              捕获字典                    实参映射打包
```

这个视角让你理解为什么 `**` 只能用于字典（必须是键→值映射结构），以及为什么展开时的键必须是字符串且是合法的标识符——因为最终要变成关键字参数名。

## 2. 核心内容

### 2.1 函数定义中的 \*\*kwargs：收集多余关键字参数

在函数定义中，`**kwargs` 出现在参数列表的**最末尾**，把所有没有匹配到显式形参的关键字参数收集到一个字典里：

```python
def register(name, age, **kwargs):
    print(f"name={name}, age={age}")
    print(f"additional: {kwargs}")

register("Alice", 30)
# name=Alice, age=30
# additional: {}

register("Bob", 25, city="Beijing", role="admin", active=True)
# name=Bob, age=25
# additional: {'city': 'Beijing', 'role': 'admin', 'active': True}
```

要点：

1. `**kwargs` 必须出现在参数列表的**最后**（在 `*args` 之后，如果有的话）。
2. `kwargs` 始终是一个**新创建的普通 dict**，即使调用时没有传入任何多余关键字参数，它也是空字典 `{}`（不是 None）。
3. `kwargs` 这个名字是约定俗成的惯例——你可以起任何名字：`**options`、`**extras`、`**config` 都可以，但用 `**kwargs` 能让阅读代码的人立刻明白"这是关键字参数收集器"。
4. 传入的关键字参数的**键必须是字符串**——它们必须能成为 Python 的合法参数名。这和字典的键约束不同：字典的键可以是 `int`、`tuple` 等可哈希类型，但 `**` 展开和收集时，键必须是能当作形参名的字符串。

```python
# ❌ 关键字参数名不能以数字开头
# def f(**kwargs):
#     pass
# f(**{1: "val"})       # TypeError: keywords must be strings
# f(**{"1key": "val"})  # 可以收集到字典里，但展开调用时 "1key" 不是合法标识符会报错
```

### 2.2 函数调用中的 \*\*dict：把字典展开为关键字参数

在函数调用中，`**dict` 把字典的键值对"展开"成关键字参数：

```python
def connect(host, port, timeout=10, ssl=False):
    print(f"Connecting to {host}:{port}, timeout={timeout}, ssl={ssl}")

config = {"host": "db.example.com", "port": 5432, "ssl": True}
connect(**config)
# Connecting to db.example.com:5432, timeout=10, ssl=True
```

`connect(**config)` 等价于 `connect(host="db.example.com", port=5432, ssl=True)`。字典中的每个键变成一个关键字参数的名称，对应的值变成参数值。

展开时的约束：

```python
# ✅ 字典可以包含额外的键（只要函数有 **kwargs 接收）
def open_file(path, **options):
    print(f"Opening {path} with {options}")

config = {"path": "/tmp/data.txt", "mode": "r", "buffering": 4096}
open_file(**config)   # "path" 匹配到显式形参，"mode" 和 "buffering" 收进 options
# Opening /tmp/data.txt with {'mode': 'r', 'buffering': 4096}

# ❌ 但如果没有 **kwargs，多余的键会报错
# config = {"host": "x", "port": 1, "unknown": 99}
# connect(**config)    # TypeError: connect() got an unexpected keyword argument 'unknown'
```

展开和 `*args` 一样，允许在同一个函数调用中混合位置参数和展开：

```python
connect("localhost", **{"port": 8080})
# Connecting to localhost:8080, timeout=10, ssl=False
```

### 2.3 \*args 与 \*\*kwargs 的配套使用

`*args`（收集多余位置参数为元组）和 `**kwargs`（收集多余关键字参数为字典）常成对出现。它们的顺序是固定的：**位置参数 → \*args → 关键字参数 → **kwargs\*\*：

```python
def log(level, message, *args, **kwargs):
    """ *args 收集额外位置参数，**kwargs 收集额外关键字参数 """
    print(f"[{level}] {message}")

    if args:
        print(f"  extra positional: {args}")

    if kwargs:
        for k, v in kwargs.items():
            print(f"  {k}: {v}")

log("INFO", "user login", "extra1", "extra2", user="Alice", ip="10.0.0.1")
# [INFO] user login
#   extra positional: ('extra1', 'extra2')
#   user: Alice
#   ip: 10.0.0.1
```

`*args` 和 `**kwargs` 不是必须同时存在——它们完全独立，按需使用：

```python
# 只要 **kwargs，不要 *args
def configure(**options):
    for k, v in options.items():
        print(f"{k} = {v}")

# 只要 *args，不要 **kwargs
def maximum(*values):
    return max(values) if values else None
```

两者配合的最经典场景是**装饰器**和**参数透传中间件**：

```python
def timing_decorator(func):
    import time
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)  # 完整透传，不关心具体参数
        elapsed = time.perf_counter() - start
        print(f"{func.__name__} took {elapsed:.4f}s")
        return result
    return wrapper

@timing_decorator
def process(data, mode="fast"):
    import time
    time.sleep(0.1)
    return f"Processed {data} with {mode}"

print(process("dataset.csv", mode="accurate"))
# process took 0.1002s
# Processed dataset.csv with accurate
```

`wrapper(*args, **kwargs)` 这种写法被称为"万能透传"——它不关心被包装的函数有什么参数，全部原封不动收进来、再原封不动传出去。这是 Python 装饰器系统的基石。

### 2.4 强制关键字参数：用 \* 分隔

在函数定义中，单独的 `*`（不是 `*args`）表示"后面的所有参数必须是关键字参数"——调用时不能按位置传入，必须写 `参数名=值` 的形式：

```python
def build_url(host, *, port=443, path="/", scheme="https"):
    return f"{scheme}://{host}:{port}{path}"

# ✅ 正常：host 按位置，port/path/scheme 按关键字
print(build_url("api.example.com", port=8080))
# https://api.example.com:8080/

# ❌ 错误：port 不能按位置传
# build_url("api.example.com", 8080)   # TypeError: build_url() takes 1 positional argument but 2 were given
```

`*` 之后的所有参数称为 **keyword-only 参数**（仅关键字参数）。它们的特点：

- 调用时**必须**以 `key=value` 形式传入
- **不强制必传**——如果你给它们默认值，它们就是可选的关键字参数
- 如果不给默认值，调用时**必须**传入，例如：`def f(*, required_param): ...`

设计用途：当你希望 API 的调用方**显式写清楚**每个参数的语义时，把参数放在 `*` 后面。这能防止调用方的代码写成 `build_url("api.example.com", 8080)` 这样语义不清的样子——`8080` 是 port 还是 timeout？答案全靠位置猜。

```python
# ✅ 好的设计：关键字参数语义清楚
draw_rectangle(x=0, y=0, width=100, height=200, color="red")

# ❌ 差的设计：全是位置参数，语义埋没在顺序里
# draw_rectangle(0, 0, 100, 200, "red")  # 哪个是宽？哪个是高？红的？
```

### 2.5 仅位置参数：用 / 分隔（Python 3.8+）

和 `*` 相反，`/` 表示它**前面的参数必须是仅位置参数**——调用时不能带参数名，只能按位置传入：

```python
# 仅位置参数：Python 内置函数中很常见
# pow(x, y, /, mod=None)  — x 和 y 必须是位置参数
print(pow(2, 3))       # 8
# pow(x=2, y=3)        # TypeError: pow() takes no keyword arguments

# 自定义
def greet(name, /, greeting="Hello"):
    return f"{greeting}, {name}"

print(greet("Alice"))              # OK: name 按位置传
print(greet("Alice", "Hi"))        # OK: greeting 按位置也可以
print(greet("Alice", greeting="Hi"))  # OK: greeting 可位置也可关键字
# greet(name="Alice")              # TypeError: name is positional-only
```

`/` 参数的设计动机来自 C 实现中参数没有实际名称的场景（如 `pow(x, y, z=None)` 底层是三个位置），以及为了避免"我改了参数名，调用方用旧的名字报错"这几个问题。

一个完整展示了所有参数类型的函数签名：

```python
def all_params(pos_only, /, pos_or_kw, *, kw_only, **kwargs):
    """
    pos_only:    仅位置参数（在 / 之前），不能带参数名
    pos_or_kw:   可选参数（在 / 和 * 之间），可位置可关键字
    kw_only:     仅关键字参数（在 * 之后），必须带参数名
    kwargs:      剩余关键字参数，收集到 dict 中
    """
    print(f"pos_only={pos_only}, pos_or_kw={pos_or_kw}, kw_only={kw_only}, kwargs={kwargs}")

all_params(1, 2, kw_only=3, extra=99)
# pos_only=1, pos_or_kw=2, kw_only=3, kwargs={'extra': 99}
```

参数排列的完整顺序（从左到右）：

```
仅位置参数 / 可选参数 * 仅关键字参数 **kwargs
```

记住这个骨架，你就掌握了 Python 函数参数系统的全部层级。

### 2.6 \*\*kwargs 在重写方法中的使用

当你在子类中重写父类方法时，`**kwargs` 可以让你"接收父类不需要的参数"而不报错：

```python
class Base:
    def __init__(self, name):
        self.name = name

class Derived(Base):
    def __init__(self, name, extra_config=None, **kwargs):
        super().__init__(name)           # 只把 name 传给父类
        self.extra_config = extra_config
        self.options = kwargs            # 剩余的全收进 options

obj = Derived("Alice", extra_config={"x": 1}, verbose=True, debug=False)
print(obj.name)          # Alice
print(obj.extra_config)  # {'x': 1}
print(obj.options)       # {'verbose': True, 'debug': False}
```

这是多重继承中合作式方法调用（cooperative method calling）的关键技巧——每层取走自己关心的参数，把剩余的参数转发给下一层的 `super().__init__(**remaining_kwargs)`。

### 2.7 \*\*kwargs 的类型提示

从 Python 3.5 开始，可以为 `**kwargs` 添加类型提示：

```python
# 基本用法：**kwargs 的值都是 str 类型
def format_template(template: str, **kwargs: str) -> str:
    return template.format(**kwargs)

# 更常见：值是任意类型
def create_config(**kwargs: object) -> dict:
    return dict(kwargs)

# 用 TypedDict 精确描述（Python 3.8+）
from typing import TypedDict, Unpack

class UserOptions(TypedDict, total=False):
    age: int
    city: str
    role: str

# Python 3.12+: Unpack 用于展开 kwargs 的类型
# def create_user(name: str, **kwargs: Unpack[UserOptions]) -> dict: ...
```

大多数场景中，`**kwargs: Any` 或 `**kwargs: object` 就足够表达"关键字参数值可以是任何类型"。如果需要精确的类型保证，考虑把关键参数显式声明为 keyword-only 参数而不是放 kwargs 里。

### 2.8 典型场景一：构建 API 客户端

```python
import requests

class APIClient:
    def __init__(self, base_url: str, **defaults):
        self.base_url = base_url.rstrip("/")
        self.defaults = defaults  # 默认参数存起来

    def get(self, endpoint: str, **overrides) -> dict:
        """发送 GET 请求，overrides 覆盖 defaults"""
        params = {**self.defaults, **overrides}
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        resp = requests.get(url, params=params)
        resp.raise_for_status()
        return resp.json()

    def post(self, endpoint: str, data=None, **overrides) -> dict:
        params = {**self.defaults, **overrides}
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        resp = requests.post(url, json=data, params=params)
        resp.raise_for_status()
        return resp.json()

# 使用
client = APIClient("https://jsonplaceholder.typicode.com", _limit=10)

# 这次调用中 _limit=10 被 overrides 中的 _limit=5 覆盖
posts = client.get("/posts", _limit=5)
```

### 2.9 典型场景二：参数校验 + 过滤

```python
def create_user(name: str, age: int, **kwargs):
    """ kwargs 接收的可选字段：email, phone, address """
    allowed = {"email", "phone", "address"}
    unknown = set(kwargs) - allowed
    if unknown:
        raise ValueError(f"Unknown fields: {unknown}")

    return {"name": name, "age": age, **kwargs}

print(create_user("Alice", 30, email="a@b.com", address="Beijing"))
# {'name': 'Alice', 'age': 30, 'email': 'a@b.com', 'address': 'Beijing'}

# create_user("Bob", 25, invalid="x")  # ValueError: Unknown fields: {'invalid'}
```

### 2.10 典型场景三：字典配置批量注入

```python
def render_page(title: str, header: str, body: str, **extras):
    html = f"<html><head><title>{title}</title></head>"
    html += f"<body><h1>{header}</h1><p>{body}</p>"
    for k, v in extras.items():
        html += f"<div class='{k}'>{v}</div>"
    html += "</body></html>"
    return html

# 配置字典一次展开，函数签名显式声明必需字段
default_config = {
    "title": "My Site",
    "header": "Welcome",
    "body": "This is the main content.",
    "footer": "Copyright 2025",
    "sidebar": "Links here",
}

# 用 ** 展开整个配置字典
page = render_page(**default_config)
# footer 和 sidebar 进入 extras
```

## 3. 最佳实践

### 3.1 推荐写法 vs 不推荐写法

**装饰器/透传函数用 \*args, **kwargs 万能签名\*\*

```python
# ✅ 推荐：万能透传，不关心被包装函数的参数
def log_call(func):
    def wrapper(*args, **kwargs):
        print(f">>> {func.__name__}")
        return func(*args, **kwargs)
    return wrapper

# ❌ 不推荐：硬编码每个被包装函数的参数
# def wrapper(a, b, c, ...):  — 换个函数就炸
```

**能显式声明的参数就不要放 kwargs 里**

```python
# ✅ 推荐：核心参数显式声明，可选的扩展放 kwargs
def connect(host, port, *, timeout=10, **extras):
    ...

# ❌ 不推荐：全部塞进 kwargs，函数签名失去文档价值
# def connect(**config):
#     host = config["host"]  — 不写签名谁知道必传 host 和 port？
```

**透传时用 {**defaults, **overrides} 模式**

```python
# ✅ 推荐：默认配置 + 调用时覆盖
def fetch(url, **overrides):
    defaults = {"timeout": 10, "method": "GET"}
    return _do_fetch(url, **{**defaults, **overrides})

# ❌ 不推荐：手动一个个覆盖
# timeout = overrides.pop("timeout", 10)
# method = overrides.pop("method", "GET")
# ...  # 每个都要写
```

### 3.2 kwargs 的名字是约定，可以改但不要改

```python
# ✅ 推荐：用 kwargs 这个通用名
def process(**kwargs): ...

# ⚠️ 特殊场景可以改名，但要确保可读
def parse_config(**options): ...
def build_html(**attrs): ...

# ❌ 不推荐：改成奇怪的缩写
# def do(**x): ...  — 没人知道 x 是什么
```

### 3.3 \*\*kwargs 收到的 dict 是可变的，但不要长期依赖它

```python
def handler(**kwargs):
    kwargs["_internal"] = True   # ✅ 临时加内部标记 OK
    result = do_work(**kwargs)
    return result
    # kwargs 里的修改会在 handler 返回后消失（局部变量），没问题
```

但要注意：如果函数外部缓存了这个 dict（比如把它存进了实例属性），修改会永久生效：

```python
class Handler:
    def __init__(self, **kwargs):
        self.options = kwargs   # 引用同一个 dict 对象
        self.options["_cache"] = {}
        # 如果调用方保留了原来的 dict 引用，它也会看到这个修改
```

解决方案是在需要保留副本时显式 `dict(kwargs)` 浅拷贝。

### 3.4 展开时注意键与函数形参的匹配

```python
def query(limit=10):
    print(f"limit={limit}")

# ✅ OK：键 "limit" 匹配形参
query(**{"limit": 20})

# ❌ 错误：键名和形参不一致
# query(**{"LIMIT": 20})    # TypeError: unexpected keyword argument 'LIMIT'

# ❌ 错误：多余的键，函数没有 **kwargs
# query(**{"limit": 20, "offset": 5})  # TypeError
```

这在从 JSON、环境变量等**动态键名来源**构建参数字典时尤其要小心——外部数据源的键名必须和函数的形参名完全一致。

### 3.5 不要直接修改传入的 kwargs dict 并期望调用方感知

```python
def modify_options(**kwargs):
    kwargs["modified"] = True      # 在函数内部改了
    print(kwargs["modified"])      # True

# 调用方
options = {"debug": False}
modify_options(**options)
print(options)                     # {'debug': False}  ← 原 dict 没变！
```

为什么没变？因为 `**options` 展开时，Python **创建了一个新的 dict 传给函数**——它不传递原始 dict 的引用。所以函数内对 `kwargs` 的修改不会影响 `options`。这和"传 list 进去函数内修改会改变原来 list"的行为看似矛盾，但原因是 **`** 展开创建了新 dict\*\*，而不是传递引用。

```python
# 如果你想修改原 dict，把它作为一个普通参数传进去
def modify_options_explicit(options: dict):
    options["modified"] = True       # 修改的是传进来的 dict 本身

options = {"debug": False}
modify_options_explicit(options)
print(options)                       # {'debug': False, 'modified': True}
```

这条差异是最常见的 `**kwargs` 误解之一——"我觉得 kwargs 是一个 dict，所以改了应该反映到外面"。记住：`**` 展开时创建了新字典。

### 3.6 强制关键字参数 (\*) 的使用场景判断

```python
# ✅ 好：参数超过 2 个且容易混淆时用 * 强制关键字
def draw_circle(*, x, y, radius, color="black", fill=False):
    ...

# ✅ 好：布尔标志参数强制关键字，避免 draw_circle(0, 0, 10, "red", True) 这种谜语
def save_file(path, *, overwrite=False):
    ...

# ⚠️ 不必滥用：只有 1-2 个参数且语义清晰时，位置参数更简洁
def abs(x):              # 不需要 *，只有一个参数
def pow(x, y):           # 两个参数，语义清晰，不需要 *
```

### 3.7 / 的使用一般仅在设计公共 API 时用到

仅位置参数 `/ ` 在日常代码中较少直接使用，它主要出现在：

- 标准库中 C 实现的函数（`pow`、`len`、`str.split` 等）
- 你设计的公共 API，且参数名是内部实现细节、不想被外部依赖

日常开发中的大部分函数不需要 `/`。如果你不确定要不要用，大概率不需要。

### 3.8 避免在 kwargs 中传可变对象作为默认行为

```python
# ❌ 反模式：用 ** 展开把列表传给多值参数
# connect("localhost", tags=["a", "b"])  — 这样更好，显式传 list

# ⚠️ 风险：如果函数内部修改了 kwargs 中的列表，会影响谁？
# 答案：只影响 kwargs 这个新 dict 内的列表（和外部无关）
# 但如果函数把 kwargs 存为实例属性，后续的修改会影响所有访问者
```

## 4. 原理

### 4.1 \*\*kwargs 在函数定义侧的底层实现

当 Python 遇到 `def f(**kwargs)` 时，编译器为这个函数生成字节码，在执行阶段把多余的关键字参数打包成一个真正的 `dict`：

```python
# def f(a, b=2, **kwargs): pass
# 调用 f(1, b=3, c=4, d=5) 的过程：
# 1. 编译器确定了 f 接受：a (位置/关键字), b (位置/关键字 + 默认), **kwargs
# 2. 调用 f(1, b=3, c=4, d=5)
# 3. 解析：a=1, b=3，剩余的 c=4 和 d=5 没有对应形参
# 4. 创建字典 {"c": 4, "d": 5} → 赋值给 kwargs
```

等价于：

```python
def f(**kwargs):
    ...

# 调用 f(a=1, b=2) 在底层等于：
# kwargs = {"a": 1, "b": 2}
# 然后执行函数体
```

`kwargs` 始终是一个**全新的 dict 实例**，和调用方传入的原始字典无关（见 3.5 节）。

### 4.2 \*\*dict 在函数调用侧的底层实现

`f(**{"a": 1, "b": 2})` 的底层过程：

```python
# 1. 字典被"解包"成关键字参数序列
# 2. Python 解释器把 {"a": 1, "b": 2} 当成 f(a=1, b=2) 来处理
# 3. 字节码层面的 CALL_FUNCTION_EX 指令负责把 dict 展开
```

这个展开过程对字典的键有一个要求：**必须是字符串形式的合法 Python 标识符**（不能以数字开头、不能包含空格或特殊字符）。违反这个约束会导致 `TypeError`。

```python
# ✅ 键 = 合法标识符
f(**{"valid_name": 1})

# ❌ 键 = 非法标识符
# f(**{"0invalid": 1})      # TypeError:keywords must be strings (实际上这个可以)
# f(**{"has space": 1})     # 这个会报错 TypeError
```

### 4.3 \* 和 / 在函数签名中的语法糖原理

`def f(a, b, *, c, d)` 中的 `*` 不是真正接收参数——它在语法上只是一个"分隔符"，告诉 Python 编译器："后面的 c 和 d 不能通过位置传递"。字节码层面，编译器把 c 和 d 标记为 `KEYWORD_ONLY`，在调用时如果检测到按位置传入了这两个参数，就抛出 `TypeError`。

同理，`/` 也是一个纯语法分隔符，标记前面的参数为 `POSITIONAL_ONLY`。

```python
# def f(pos_only, /, normal, *, kw_only):
# 完整参数顺序和分类：
# pos_only  → POSITIONAL_ONLY
# normal    → POSITIONAL_OR_KEYWORD
# kw_only   → KEYWORD_ONLY
```

### 4.4 \*\* 展开的行参顺序规则

在函数调用中，参数求值顺序为：**位置参数 → \*args 展开 → 关键字参数 → **kwargs 展开\*\*。同一个调用中不能有重复的关键字参数名：

```python
# ❌ 重复关键字参数
d = {"a": 1}
# f(**d, a=2)        # TypeError: got multiple values for keyword argument 'a'
# f(a=1, **{"a": 2}) # TypeError: got multiple values for keyword argument 'a'

# ✅ 不同名的 kwargs 字典合并不受此限（各自独立展开）
def merge(**first):
    return first

# 两个 ** 可以出现在不同位置（只要不重复名）
d1 = {"a": 1}
d2 = {"b": 2}
# f(**d1, **d2) 是 OK 的（Python 3.5+）
```

### 4.5 时间复杂度总表

| 操作                               | 时间复杂度 | 说明                        |
| ---------------------------------- | ---------- | --------------------------- |
| `def f(**kwargs): ... f(a=1, b=2)` | O(n)       | 创建字典放入 n 个关键字参数 |
| `f(**{"a": 1, "b": 2})`            | O(n)       | 展开 n 个键值对为参数       |
| `{**d1, **d2}` 字面量解包          | O(n1 + n2) | 共 n1+n2 个键值对           |
| `*args` 收集位置参数               | O(n)       | 元组创建和填充              |
| 函数调用参数解析                   | O(n)       | n = 总参数数                |

## 5. 总结

### 5.1 \*\*kwargs 速查

```
函数定义（收集方向）：
- def f(**kwargs)            收集所有多余关键字参数到 dict
- kwargs 始终是新 dict        调用方传什么都能收，不影响原对象
- **kwargs 必须在参数列表最后  在 *args 之后（如果有的话）

函数调用（展开方向）：
- f(**dict)                  把 dict 展开为关键字参数
- 键必须是合法 Python 标识符    "0key"、"key with space" 不行
- 不能和已有的关键字参数重复     f(a=1, **{"a": 2}) → TypeError
- 可以混合多个 ** 展开          f(**d1, **d2)

参数层级骨架：
- def f(pos_only, /, pos_or_kw, *, kw_only, **kwargs):
         仅位置       普通      仅关键字       多余收集

* 分隔符：
- * 之后参数必须关键字传入      def draw(*, x, y)

/ 分隔符：
- / 之前参数必须位置传入        def process(id, /, name)

典型模式：
- 装饰器透传        def wrapper(*args, **kwargs): return func(*args, **kwargs)
- 默认 + 覆盖       {**defaults, **overrides}
- API 客户端        client.get(url, **options)
- 子类 __init__     super().__init__(**{k: v for k, v in kwargs.items() if k != "mine"})
```

### 5.2 核心要点回顾

- `**kwargs` 在函数定义中收集多余关键字参数为一个新 dict（收集方向）。
- `**dict` 在函数调用中将字典展开为关键字参数（展开方向）。
- `*args`（收集位置参数为元组）和 `**kwargs`（收集关键字参数为字典）配对使用，形成万能透传。
- `*` 单独出现分隔仅关键字参数；`/` 分隔仅位置参数。
- 参数完整排列：仅位置 `/` 普通 `*` 仅关键字 `**kwargs`。
- `**` 展开时创建新 dict，函数内修改 kwargs 不影响调用方的原 dict。
- 展开时键必须是合法 Python 标识符，不能有重复键。
- 能显式声明的参数不要塞进 kwargs——保持函数签名的可读性和文档性。

### 5.3 读完应能掌握

- 能正确区分 `**` 的三种用途：函数定义收集、函数调用展开、字典字面量合并。
- 能写装饰器和中间件用 `*args, **kwargs` 做万能透传。
- 能在函数设计中使用 `*` 强制关键字参数和 `/` 强制位置参数。
- 能理解 `**` 展开创建新 dict 的语义，避免"函数内改了 kwargs 为什么外面没变"的困惑。
- 能在 `{**defaults, **overrides}` 和 `**` 透传之间选对工具。

### 5.4 常见面试问题

**问题一：`*args` 和 `**kwargs` 分别是什么？\*\*

```python
# *args：收集多余位置参数为元组
def sum_all(*args):
    return sum(args)

print(sum_all(1, 2, 3, 4))  # 10

# **kwargs：收集多余关键字参数为字典
def describe(**kwargs):
    for k, v in kwargs.items():
        print(f"{k}: {v}")

describe(name="Alice", age=30)
# name: Alice
# age: 30
```

**问题二：`def f(a, *, b)` 中的 `*` 是什么意思？**

`*` 是分隔符，表示后面的参数（b）必须用关键字形式传入，不能按位置传入。调用 `f(1, b=2)` OK，`f(1, 2)` 报 TypeError。

**问题三：`f(**{"a": 1})` 内部会修改传入的字典吗？\*\*

不会。`**` 展开时创建了新 dict 作为 `kwargs`，函数内对 `kwargs` 的修改只在函数内可见。原字典不受影响。如果想把原字典传给函数并让它修改，需要把字典作为普通位置参数传入。

### 5.5 实战串讲：CLI 工具的参数处理

把本篇的内容串进一个完整的 CLI 工具开发场景——从解析参数到层层透传给底层函数：

```python
import argparse
from typing import Any

# 1. 命令行参数 → 字典
def parse_args() -> dict:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", help="subcommand to run")
    parser.add_argument("--host", default="localhost")
    parser.add_argument("--port", type=int, default=8080)
    parser.add_argument("--debug", action="store_true")
    parser.add_argument("--extra", action="append", default=[])
    # 返回一个 argparse.Namespace，转成 dict
    return vars(parser.parse_args(["--host", "0.0.0.0", "start"]))

# 2. 默认配置 + 用户参数合并
DEFAULT_CONFIG = {
    "timeout": 30,
    "retries": 3,
    "log_level": "INFO",
}

def build_config(**user_overrides) -> dict:
    """合并默认配置和用户覆盖"""
    return {**DEFAULT_CONFIG, **user_overrides}

# 3. 用 **kw_only 参数做核心参数的语义声明
def execute_command(*, host: str, port: int, **options: Any) -> None:
    """执行命令，核心参数显式、扩展参数透传"""
    print(f"Connecting to {host}:{port}")
    print(f"Options: {options}")

# 4. 组装
args = parse_args()
config = build_config(host=args["host"], port=args["port"], debug=args["debug"])
execute_command(**config)

# 输出（基于上面的 parse_args 示例）：
# Connecting to 0.0.0.0:8080
# Options: {'timeout': 30, 'retries': 3, 'log_level': 'INFO', 'debug': False}
```

这个场景用到了 `**` 的收集（`build_config(**user_overrides)` 的形参）、展开（`execute_command(**config)` 的实参）、合并（`{**DEFAULT_CONFIG, **user_overrides}` 的字面量）、以及 `*` 后的仅关键字参数（`execute_command` 必须写明 `host` 和 `port` 参数名）。

### 5.6 延伸

`**kwargs` 和字典解包是 Python 函数参数系统的最高抽象层。和前面的内容串联：

- **字典合并**（前一篇）的 `{**d1, **d2}` 字面量解包，和本篇的函数调用 `f(**dict)` 共享 `**` 标记，是同一枚硬币的两面——前者合并两个映射生成新映射，后者把映射展开成参数。
- **遍历**（遍历篇）和 \*\*kwargs 的交互：`kwargs` 是一个普通的 dict，所有遍历操作（`items()`、`keys()`、`values()`）完全适用——你经常会需要遍历 kwargs 来动态处理参数。
- **defaultdict** 的自动默认，也可以用于 `**kwargs` 的场景——比如解析配置时想要"缺失键自动补 0"。

掌握了本篇，你对函数参数的完整认知已经到达上限：`仅位置 / 普通 * 仅关键字 **kwargs` 的五层结构，以及 `**` 的三种用法（收集、展开、字面量合并）。学习**字典的底层原理哈希表**——它将解释为什么参数收集到 `**kwargs` 的 O(1) 查找这么快，以及这一切的底层数据结构是怎样的。
