---
group:
  title: 【12】函数核心机制
  order: 12
order: 6
title: 可变关键字参数kwargs
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是可变关键字参数

在 Python 函数设计中，有时候我们事先无法确定调用者会以"关键字 = 值"的形式传入多少个参数。比如一个通用的配置函数，调用时可能只传一个开关，也可能传十个八项配置项；如果为每一项都显式定义形参，签名会冗长且难以维护。为此 Python 提供了 **可变关键字参数**，语法是在形参名前加两个星号 `**`，习惯上写作 `**kwargs`（kwargs 是 keywords arguments 的缩写，并非关键字，名字可任意取）。

它的本质是：函数定义时，`**kwargs` 会把调用者传入的"所有未被前面形参捕获的多余关键字参数"打包成一个字典（`dict`），在函数体内通过 `kwargs` 这个字典变量访问。也就是说，`kwargs` 是一个普通的 `dict` 对象，键是关键字参数的名字（字符串），值是对应的传入值。

与它相辅相成的是调用时的 `**` 解包语法：在调用函数时，对一个字典使用 `**mapping`，会把字典展开成一组关键字参数传入函数。这构成了"字典 ⇄ 关键字参数"的双向通道——定义端打包成字典，调用端从字典解包成关键字参数。

`**kwargs` 让函数具备了"接受任意数量关键字参数"的能力，是配置透传、装饰器、代理转发、包装器等场景的核心机制，也是 Python 灵活参数体系的关键一环。

### 1.2 基础语法与最小用法

定义端的语法：在形参名前加 `**`，该形参会收集多余的关键字参数为字典。

```python
def show_info(name, **kwargs):
    print(f"name = {name}")
    print(f"kwargs = {kwargs}")
    print(f"kwargs 的类型 = {type(kwargs).__name__}")

show_info("alice", age=18, city="杭州", role="admin")
# 输出：
# name = alice
# kwargs = {'age': 18, 'city': '杭州', 'role': 'admin'}
# kwargs 的类型 = dict
```

上面示例中，`name` 按位置接收了 `"alice"`，而 `age`、`city`、`role` 都是"多余的关键字参数"，它们被 `**kwargs` 打包成一个字典 `{'age': 18, 'city': '杭州', 'role': 'admin'}`。如果不传任何多余关键字参数，`kwargs` 就是一个空字典：

```python
show_info("bob")
# 输出：
# name = bob
# kwargs = {}
# kwargs 的类型 = dict
```

调用端的 `**` 解包语法：

```python
def greet(greeting, name, punct="!"):
    print(f"{greeting}, {name}{punct}")

options = {"greeting": "Hello", "name": "carol", "punct": "."}
greet(**options)
# 输出：Hello, carol.
```

这里 `**options` 把字典展开为 `greeting="Hello", name="carol", punct="."` 三个关键字参数，等价于直接写 `greet(greeting="Hello", name="carol", punct=".")`。

这两条规则——定义时 `**` 打包、调用时 `**` 解包——是 `**kwargs` 的全部语法基础，后续所有进阶用法都是在这两条规则上的组合。

## 2. 核心内容

### 2.1 函数定义中的 **kwargs：收集多余关键字参数为字典

`**kwargs` 出现在函数定义的形参列表中，作用是收集"未被前面显式形参捕获的"全部关键字参数，打包为一个字典。这个字典在函数体内就像普通字典一样可以遍历、索引、修改。

理解"多余"二字的含义很关键：如果某个关键字参数已经被前面的显式形参"对号入座"地接收了，它就不会进入 `kwargs`。

```python
def configure(host, port=80, **kwargs):
    # host、port 由显式形参接收
    # 其余关键字参数全部进入 kwargs
    print(f"host = {host}, port = {port}")
    print(f"extra = {kwargs}")

configure("127.0.0.1", port=8080, timeout=30, debug=True, retries=3)
# 输出：
# host = 127.0.0.1, port = 8080
# extra = {'timeout': 30, 'debug': True, 'retries': 3}
```

`host` 接收了 `"127.0.0.1"`，`port` 接收了 `8080`（因为 `port=8080` 是关键字实参，匹配到名为 `port` 的形参），剩余的 `timeout`、`debug`、`retries` 没有对应的显式形参，于是全部归入 `kwargs`。

在函数体内对 `kwargs` 的常见操作：遍历查看、按键取值、设置默认值、转换为其他结构。

```python
def make_request(url, **kwargs):
    # 把可选项从 kwargs 中取出，没传则用默认值
    method = kwargs.pop("method", "GET")     # 取出并移除，缺省为 GET
    timeout = kwargs.pop("timeout", 10)      # 缺省 10 秒
    headers = kwargs.pop("headers", {})      # 缺省空 headers
    # 剩余的 kwargs 视为未知选项，原样保留
    extras = kwargs                          # 此时 kwargs 已被 pop 过
    print(f"{method} {url} (timeout={timeout})")
    print(f"headers = {headers}")
    print(f"extras = {extras}")

make_request("/api/user", method="POST", timeout=5,
              headers={"Content-Type": "application/json"},
              trace_id="abc123", force=True)
# 输出：
# POST /api/user (timeout=5)
# headers = {'Content-Type': 'application/json'}
# extras = {'trace_id': 'abc123', 'force': True}
```

这里用 `dict.pop(key, default)` 的手法非常典型：既能读取某个可选项、又能让它不残留在 `kwargs` 里，这样最后剩下的 `extras` 就是真正的"未知/透传参数"。

**一个细节：kwargs 是普通 dict，可改可增**

```python
def decorate(**kwargs):
    kwargs["wrapped"] = True      # 直接往字典里塞东西
    kwargs["label"] = kwargs.get("label", "default") + "_decorated"
    return kwargs

print(decorate(label="main", x=1))
# 输出：{'label': 'main_decorated', 'x': 1, 'wrapped': True}
```

`kwargs` 本质就是个 `dict`，可以随时增删改键值对，不存在"只读"限制。

### 2.2 调用时的 `**mapping` 解包：把字典展开为关键字参数

`**` 的第二个作用出现在函数调用端：对一个字典使用 `**mapping`，Python 会把字典的每一对键值转换为一个"关键字 = 值"的形式的实参。它与定义端的打包正好方向相反，构成了字典与关键字参数的转换通道。

```python
def create_user(username, email, role, active):
    print(f"用户名: {username}, 邮箱: {email}, 角色: {role}, 启用: {active}")

params = {
    "username": "david",
    "email": "david@example.com",
    "role": "editor",
    "active": True,
}

create_user(**params)
# 输出：用户名: david, 邮箱: david@example.com, 角色: editor, 启用: True
```

`**params` 的效果完全等同于 `create_user(username="david", email="david@example.com", role="editor", active=True)`。当字典来自于外部数据（数据库、配置文件、API 响应）时，用 `**` 解包可以避免逐个手写参数，尤其在参数数量多或动态变化时非常方便。

`**` 解包可以和普通位置参数、普通关键字参数混用，规则是：位置实参在前，关键字实参（含 `**` 解包）穿插，但同一参数不能重复赋值。

```python
def build_profile(name, age, **traits):
    profile = {"name": name, "age": age}
    profile.update(traits)
    return profile

base = {"age": 28, "hobby": "摄影", "city": "上海"}
# name 用位置参数传,其余用 ** 解包
print(build_profile("eve", **base))
# 输出：{'name': 'eve', 'age': 28, 'hobby': '摄影', 'city': '上海'}
```

这里 `base` 中的 `age` 通过 `**base` 以关键字实参 `age=28` 传入，匹配到形参 `age`；`hobby`、`city` 则落入 `**traits`。混用时只要不出现"同一个参数既被位置实参赋值、又被解包的关键字覆盖"就没有问题。

**解包时键必须是字符串且为合法标识符**

`**mapping` 把字典键当作"关键字实参的名字"。Python 的关键字实参名字必须是合法标识符（以字母或下划线开头，由字母数字下划线组成）。所以如果字典里含有非字符串键、或字符串键不是合法标识符（如含空格、以数字开头），`**` 解包会报错。

```python
def f(a, b):
    return a + b

# 键是字符串且是合法标识符 → 正常
print(f(**{"a": 1, "b": 2}))
# 输出：3

# 键不是字符串 → 报错
# f(**{1: 10, 2: 20})          # TypeError: keywords must be strings

# 字符串键但不是合法标识符 → 报错
# f(**{"a b": 1, "c": 2})      # SyntaxError / TypeError: 键含空格不是标识符
# f(**{"1a": 1, "2b": 2})      # 以数字开头,不是合法标识符
```

这一点在动态构造字典后再 `**` 解包时要特别留意：如果键来源于用户输入或外部数据，先校验键是否为合法标识符字符串，否则运行时才会暴露错误。

### 2.3 kwargs 的类型与键的本质

`kwargs` 是一个普通的 `dict`，没有特殊类型、没有只读限制。上一节已展示过它可增删改。这里系统说明它的几个特性。

**键的类型始终是字符串**

关键字参数的名字本身就是一个标识符（比如 `age=18` 中的 `age`），而标识符在 Python 中本质是字符串名字。即使你传入时写的是什么类型，进入 `kwargs` 后键都是字符串。

```python
def collect(**kwargs):
    for key, value in kwargs.items():
        print(f"键 {key!r} 类型 {type(key).__name__}, 值 {value!r} 类型 {type(value).__name__}")

collect(id=1, name="alice", active=True, tags=[1, 2])
# 输出：
# 键 'id' 类型 str, 值 1 类型 int
# 键 'name' 类型 str, 值 'alice' 类型 str
# 键 'active' 类型 str, 值 True 类型 bool
# 键 'tags' 类型 str, 值 [1, 2] 类型 list
```

所有键都被存为字符串，与值的类型无关。这也解释了为什么 `**` 解包时键必须是合法标识符字符串——因为它们要重新被当作"关键字实参的名字"放回到调用中。

**键的顺序：保序**

在 Python 3.7+，`dict` 保持插入顺序，因此 `kwargs` 中键的顺序与调用时传入的顺序一致。这在需要顺序敏感的场景（如序列化、日志输出）下是有用的保证。

```python
def ordered(**kwargs):
    return list(kwargs.keys())

print(ordered(z=1, a=2, m=3, b=4))
# 输出：['z', 'a', 'm', 'b']   # 保持传入顺序,不会自动排序
```

**kwargs 可以转换为其他结构**

```python
def build(**kwargs):
    # 转为只读映射
    frozen = frozenset(kwargs.items())
    # 转为命名空间对象,支持属性访问
    class Struct:
        pass
    obj = Struct()
    for k, v in kwargs.items():
        setattr(obj, k, v)
    return kwargs, frozen, obj

d, fr, ns = build(host="localhost", port=8080, debug=True)
print(d)              # {'host': 'localhost', 'port': 8080, 'debug': True}
print(ns.host, ns.port, ns.debug)   # localhost 8080 True
```

把 `kwargs` 转为对象属性访问风格（如 `ns.host`）在某些需要链式书写或避免字典下标噪音的场景下很实用，但需注意键可能不是合法 Python 属性名。

### 2.4 典型场景一：配置透传

这是 `**kwargs` 最经典的用途之一。一个高层的配置函数只需要关心自己的少量核心参数，把其余可选项原样收集并透传给底层函数。

```python
def _set_engine(pool_size=10, max_overflow=20, echo=False, **engine_opts):
    """模拟底层 DB 引擎配置函数"""
    print(f"[engine] pool_size={pool_size}, max_overflow={max_overflow}, echo={echo}")
    if engine_opts:
        print(f"[engine] 额外引擎选项: {engine_opts}")

def init_db(url, **options):
    """高层入口:只关心 url,其余配置透传到底层引擎"""
    print(f"[init_db] 连接 {url}")
    # 把 options 原样透传给底层
    _set_engine(**options)

init_db(
    "mysql://localhost/shop",
    pool_size=30,
    echo=True,
    isolation_level="REPEATABLE_READ",   # 底层理解、本层不关心
    timeout=15,                          # 底层理解、本层不关心
)
# 输出：
# [init_db] 连接 mysql://localhost/shop
# [engine] pool_size=30, max_overflow=20, echo=True
# [engine] 额外引擎选项: {'isolation_level': 'REPEATABLE_READ', 'timeout': 15}
```

价值在于：`init_db` 不需要为底层引擎的每一个选项都在签名里列出，签名保持简洁；而底层 `_set_engine` 又能拿到这些选项。二者解耦——底层新增选项时高层无需改动。

**多级透传链**

透传可以形成多层链条，每一层都只提取自己关心的参数，其余继续向下传。

```python
def http_transport(url, method="GET", timeout=10, **conn_opts):
    print(f"[transport] {method} {url} timeout={timeout}")
    print(f"[transport] 连接层选项: {conn_opts}")

def api_client(endpoint, **opts):
    print(f"[api_client] endpoint={endpoint}")
    # 只关心 endpoint,其余透传
    http_transport(f"https://api.example.com{endpoint}", **opts)

def app_service(user_id, **opts):
    print(f"[app_service] user_id={user_id}")
    # 透传给 api_client
    api_client(f"/users/{user_id}", **opts)

app_service(1001, method="POST", timeout=5, verify_ssl=False, proxy="http://proxy:8080")
# 输出：
# [app_service] user_id=1001
# [api_client] endpoint=/users/1001
# [transport] POST https://api.example.com/users/1001 timeout=5
# [transport] 连接层选项: {'verify_ssl': False, 'proxy': 'http://proxy:8080'}
```

三层透传下来，`method`、`timeout`、`verify_ssl`、`proxy` 一路无损而下，每层只取所需。这是大型框架（SQLAlchemy、Requests、各种 SDK）里非常常见的参数流组织方式。

### 2.5 典型场景二：装饰器透传 *args 与 **kwargs

装饰器常常需要做到"对被装饰函数的调用签名完全透明"——无论原函数接受什么参数，装饰器都不应该破坏它的调用方式。这时统一用 `*args, **kwargs` 接收并透传是标准做法。

```python
import functools
import time

def timed(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        # 原样透传所有参数
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"[timed] {func.__name__} 耗时 {elapsed:.4f}s")
        return result
    return wrapper

@timed
def send_email(to, subject, body, cc=None, bcc=None, **headers):
    time.sleep(0.01)
    print(f"发送给 {to}, 主题: {subject}")
    if cc:
        print(f"抄送: {cc}")
    if headers:
        print(f"邮件头: {headers}")
    return "ok"

send_email(
    "alice@example.com",
    subject="周报",
    body="本周工作...",
    cc=["manager@example.com"],
    x_mailer="custom-mailer/1.0",
    reply_to="noreply@example.com",
)
# 输出：
# 发送给 alice@example.com, 主题: 周报
# 抄送: ['manager@example.com']
# 邮件头: {'x_mailer': 'custom-mailer/1.0', 'reply_to': 'noreply@example.com'}
# [timed] send_email 耗时 0.0101s
```

`wrapper` 用 `*args, **kwargs` 把所有实参"打包 → 原样解包"，对被装饰函数而言调用环境没有任何改变。`functools.wraps` 还把原函数的元信息（`__name__`、`__doc__`）复制过来。这种写法是绝大多数通用装饰器的模板。

如果你的装饰器想额外注入或修改某些关键字参数，可以先把 `kwargs` 复制一份再改，避免污染调用者传入的字典：

```python
def with_defaults(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        # 复制一份,确保不修改调用方可能持有的同一个 dict
        opts = dict(kwargs)
        opts.setdefault("retry", 3)       # 注入默认 retry
        opts.setdefault("verbose", False) # 注入默认 verbose
        return func(*args, **opts)
    return wrapper

@with_defaults
def task(name, retry, verbose, **rest):
    print(f"task={name}, retry={retry}, verbose={verbose}, rest={rest}")

task("upload", retry=5)
# 输出：task=upload, retry=5, verbose=False, rest={}
```

传进来的 `retry=5` 被保留（`setdefault` 不会覆盖已有键），缺失的 `verbose` 用默认值 `False`。注意这里先把 `kwargs` 拷一份再改，不直接动 `kwargs`，避免外层调用者若复用同一字典产生意外。

### 2.6 典型场景三：构造器参数收集

在类设计中，尤其是有继承层次时，子类构造器常常把不属于自己关心的参数继续向上传给父类构造器。`**kwargs` 让这种"我不管、交给父类管"的逻辑非常简洁。

```python
class Animal:
    def __init__(self, name, age):
        self.name = name
        self.age = age
        print(f"[Animal] name={name}, age={age}")

class Dog(Animal):
    def __init__(self, breed, **kwargs):
        # Dog 只关心 breed,其余(name, age)交给父类
        super().__init__(**kwargs)
        self.breed = breed
        print(f"[Dog] breed={breed}")

class GuideDog(Dog):
    def __init__(self, guide_level, **kwargs):
        # GuideDog 只关心 guide_level,其余(breed, name, age)继续向上传
        super().__init__(**kwargs)
        self.guide_level = guide_level
        print(f"[GuideDog] guide_level={guide_level}")

g = GuideDog(name="雷克斯", age=3, breed="拉布拉多", guide_level="高级")
print("---")
print(f"名字: {g.name}, 年龄: {g.age}, 品种: {g.breed}, 等级: {g.guide_level}")
# 输出：
# [Animal] name=雷克斯, age=3
# [Dog] breed=拉布拉多
# [GuideDog] guide_level=高级
# ---
# 名字: 雷克斯, 年龄: 3, 品种: 拉布拉多, 等级: 高级
```

调用链上每一层 `__init__` 只抽取自己关心的参数（`guide_level`、`breed`、`name`/`age`），其余参数通过 `**kwargs` 一直向上传，直到顶层。这样每一层签名只暴露与自身职责相关的参数，新增子类时不必修改父类签名。

**构造器 + 默认值合并**

构造器里也常用 `kwargs.pop` 提取某个参数并给默认值，剩余继续透传。

```python
class Base:
    def __init__(self, **kwargs):
        self.tag = kwargs.pop("tag", "default-tag")
        print(f"[Base] tag={self.tag}, 剩余={kwargs}")

class Derived(Base):
    def __init__(self, size, **kwargs):
        self.size = size
        # 把父类关心的 tag 让给父类处理,其余透传
        super().__init__(**kwargs)

d = Derived(size=10, tag="custom", color="red", weight=2)
# 输出：[Base] tag=custom, 剩余={'color': 'red', 'weight': 2}
```

`Base.__init__` 把 `tag` 弹出来处理，剩余的 `color`、`weight` 留在 `kwargs` 里——实际工程中可以把这些再做透传或存储。这种"`pop` 自己的、剩下的继续传"是构造器链里的经典模式。

### 2.7 与 *args 混用

`*args` 收集多余的位置参数为元组，`**kwargs` 收集多余的关键字参数为字典。当二者一起使用时，函数就具备了"接受任意位置参数 + 任意关键字参数"的完全通用形态——这正是通用装饰器、代理包装器的标准签名。

参数排列顺序必须遵守：位置参数 → 默认参数 → `*args` → 关键字参数（仅关键字形态）→ `**kwargs`。简言之 `**kwargs` 必须放在形参列表的最后。

```python
def dispatch(*args, **kwargs):
    print(f"args   = {args}   (类型 {type(args).__name__})")
    print(f"kwargs = {kwargs} (类型 {type(kwargs).__name__})")

dispatch(1, 2, 3, name="x", mode="fast")
# 输出：
# args   = (1, 2, 3)   (类型 tuple)
# kwargs = {'name': 'x', 'mode': 'fast'} (类型 dict)

dispatch()
# 输出：
# args   = ()   (类型 tuple)
# kwargs = {} (类型 dict)
```

`args` 是元组、`kwargs` 是字典，二者各管一类参数互不干扰。位置实参全部进 `args`（即便它写成了 `a=1` 形式但 `a` 不是关键字名……不，`a=1` 一定是关键字实参，位置实参只能写裸值）。

**位置参数与关键字参数的归口**

当一个函数同时有命名位置参数、`*args`、命名关键字参数、`**kwargs` 时，演变成一种"四段式"签名，每种实参各归其位：

```python
def f(a, b, *args, key, **kwargs):
    print(f"a={a}, b={b}, args={args}, key={key}, kwargs={kwargs}")

f(1, 2, 3, 4, 5, key="K", x=10, y=20)
# 输出：a=1, b=2, args=(3, 4, 5), key='K', kwargs={'x': 10, 'y': 20}
```

- `1, 2` 给 `a, b`；
- `3, 4, 5` 是多余的位置实参，进 `args`；
- `key="K"` 是显式关键字参数，匹配到 `key` 形参（必须显式以关键字形式传递，因为它在 `*args` 之后，是 keyword-only 参数）；
- `x=10, y=20` 是多余的关键字参数，进 `kwargs`。

这种排列是理解 Python 函数参数体系的"集大成"形态，掌握了它就掌握了完整签名。

**反序透传**

透传 `*args, **kwargs` 时不需要关心原始调用是以位置还是关键字形式传入的——分别打包成元组和字典、再用 `*` 与 `**` 解包还原即可。

```python
def inner(a, b, c):
    print(f"inner: a={a}, b={b}, c={c}")

def outer(*args, **kwargs):
    print(f"outer 收到: args={args}, kwargs={kwargs}")
    # 原样转交
    inner(*args, **kwargs)

outer(1, 2, c=3)
# 输出：
# outer 收到: args=(1, 2), kwargs={'c': 3}
# inner: a=1, b=2, c=3
```

`outer` 把位置实参打包进 `args`、关键字实参打包进 `kwargs`，再以相同的形态还原给 `inner`，对调用者完全透明。这就是装饰器和代理能"无感包装"任意函数的根本机制。

### 2.8 合并配置字典后解包调用

`**kwargs` 经常配合字典的合并操作使用：先把若干来源的配置合并成一个字典，再 `**` 解包去调用。

```python
def connect_db(host, port, user, password, **extra):
    print(f"连接 {user}@{host}:{port}")
    print(f"额外: {extra}")

# 默认配置
default = {"port": 5432, "user": "admin", "sslmode": "prefer"}
# 用户覆盖配置
override = {"host": "db.example.com", "port": 6543, "password": "secret"}
# 合并:override 优先
merged = {**default, **override}

connect_db(**merged)
# 输出：
# 连接 admin@db.example.com:6543
# 额外: {'password': 'secret', 'sslmode': 'prefer'}
```

`{**default, **override}` 是 Python 3.5+ 引入的字典解包合并语法：后面的键覆盖前面同名的键。这里 `port` 取自 `override`（6543），`sslmode` 取自 `default`（`prefer`）。合并后的字典通过 `**merged` 一次性传入函数。

注意一个细节：`host`、`port`、`user`、`password` 这四个键匹配到了 `connect_db` 的命名形参，而 `sslmode` 没有对应形参，于是进入 `**extra`。这种"命名形参 + extra 兜底"的签名非常适合处理"已知项 + 未知扩展项"的配置。

**动态构建参数再调用**

```python
def render(template, **context):
    # 模拟模板渲染
    parts = [f"{k}={v}" for k, v in context.items()]
    return f"[{template}] " + ", ".join(parts)

# 根据用户权限动态选择要注入的上下文
user = {"role": "guest", "name": "visitor"}
ctx = {"site": "main", "lang": "zh-CN"}
ctx.update(user)  # 合并用户信息

print(render("home", **ctx))
# 输出：[home] site=main, lang=zh-CN, role=guest, name=visitor
```

`ctx` 由两个来源拼接而成，再通过 `**ctx` 解包成关键字参数传给 `render`，`render` 用 `**context` 把它们收回来——一来一回，配置数据就完成了从字典到关键字参数的流动。

### 2.9 只接受关键字参数：`*` 单独使用与 **kwargs 的关系

虽然 `**kwargs` 是本章主角，但它和 `*` 单独使用（用于强制后续参数必须以关键字形式传递）经常关联出现。理解二者的区别有助于写出更清晰的签名。

```python
def insert_row(table, *, if_not_exists=False, **kwargs):
    """table 按位置传;if_not_exists 及其他必须按关键字传"""
    print(f"INSERT INTO {table}")
    print(f"if_not_exists={if_not_exists}")
    print(f"columns={kwargs}")

insert_row("users", name="alice", age=18, if_not_exists=True)
# 输出：
# INSERT INTO users
# if_not_exists=True
# columns={'name': 'alice', 'age': 18}
```

这里的 `*` 不是用来收集位置参数的，而是一个"位置参数到此为止"的分割标记，它后面的参数（`if_not_exists`、`kwargs` 收集到的）都必须以关键字形式传递。`if_not_exists` 是显式的 keyword-only 参数，没有对应显式形参的关键字参数则落入 `**kwargs`。这种签名强制关键参数显式书写，提升可读性、避免误传。

### 2.10 functools 部分"冻结"关键字参数

`functools.partial` 可以把一个函数的部分关键字参数固定下来，生成一个新函数，剩余的关键字参数（包括 `**kwargs` 收集到的）依然可以在调用新函数时传入。

```python
from functools import partial

def send_request(url, method="GET", timeout=10, **headers):
    print(f"{method} {url} (timeout={timeout}) headers={headers}")

# 固定 url(method 仍可用)
post_req = partial(send_request, "https://api.example.com", method="POST")

post_req(timeout=5, Authorization="Bearer xyz", Accept="application/json")
# 输出：POST https://api.example.com (timeout=5) headers={'Authorization': 'Bearer xyz', 'Accept': 'application/json'}

post_req(timeout=8)
# 输出：POST https://api.example.com (timeout=8) headers={}
```

`partial` 固定了 `url` 和 `method`，但 `timeout` 与 `**headers` 收集的任意关键字参数仍可在调用 `post_req` 时灵活传入。这是 `**kwargs` 配合函数式工具的典型链路。

## 3. 最佳实践

**签名顺序：`**kwargs` 永远在最后**

Python 语法强制要求 `**kwargs` 必须位于形参列表末尾，否则会直接报 `SyntaxError`。这不仅是一条语法规则，也是语义上的自然要求——既然它能"扫走剩余所有关键字参数"，那它之后当然不可能再有任何命名关键字参数（那些参数永远会被它"截获"而无法到达）。

```python
# 正确:位置参数在前,**kwargs 在最后
def f(a, b, *args, **kwargs): ...

# 错误:SyntaxError
# def g(**kwargs, x): ...
# def h(**kwargs, *args): ...
```

**不要把 kwargs 当万能口袋滥用**

`**kwargs` 提供了灵活性，但代价是丢失了显式签名带来的可读性与静态检查能力。IDE 无法自动补全 `kwargs` 里的键、调用者看不出该传哪些参数、类型检查工具也帮不上忙。因此建议：

- 用得到的核心参数请显式书写在签名里，只把"数量可变、难以穷举、需要透传"的部分交给 `**kwargs`。
- 纯配置类入口函数可以用 `**kwargs`，但内部业务函数最好显式声明参数。

```python
# 不推荐:调用者完全不知道该传什么
def process_data(**kwargs):
    data = kwargs["data"]       # 若没传会在运行时 KeyError
    mode = kwargs.get("mode", "fast")
    ...

# 推荐:核心参数显式声明,扩展项用 kwargs 兜底
def process_data(data, *, mode="fast", **options):
    ...
```

**从 kwargs 取值时给默认值，避免 KeyError**

```python
def render(template, **kwargs):
    # 用 get 提供默认,避免调用者没传时崩溃
    title = kwargs.get("title", "未命名")
    author = kwargs.get("author", "匿名")
    return f"{title} - {author}"

print(render("page"))                          # 输出：未命名 - 匿名
print(render("page", title="首页", author="团队"))  # 输出：首页 - 团队
```

**使用 pop 提取后透传，避免参数混乱**

当一个中间层函数既要消费某些选项、又要把其余透传给底层时，推荐用 `dict.pop(key, default)` 提取——好处是提取后该键不再残留在 `kwargs` 里，避免下游误处理。

```python
def client(endpoint, **options):
    # 本层消费 verbose,其余透传
    verbose = options.pop("verbose", False)
    if verbose:
        print(f"verbose 模式: {endpoint}")
    transport(endpoint, **options)

def transport(url, **opts):
    print(f"transport -> {url}, opts={opts}")

client("/api", verbose=True, timeout=5)
# 输出：
# verbose 模式: /api
# transport -> /api, opts={'timeout': 5}
```

`verbose` 被 `pop` 出来消费，`transport` 收到的就只剩 `timeout`，不会去误处理它不认识的 `verbose`。

**透传时先复制字典，避免副作用**

如果你想对 `kwargs` 增删改后再传给下游，建议先 `dict(kwargs)` 拷一份再修改，避免意外修改了调用者持有的字典。虽然函数内对 `kwargs` 的改动通常不会影响调用方（因为每次调用都新建了 `kwargs` 字典），但当透传链上多个函数交叉时，保持"每个函数不污染收到的 kwargs"的习惯能极大降低排查难度。

```python
def layer_a(**kwargs):
    opts = dict(kwargs)
    opts["layer_a"] = True
    layer_b(**opts)            # 传给 b 的是带 layer_a 的副本
    print(f"a 看到 kwargs = {kwargs}")   # a 自己的 kwargs 不被改变

def layer_b(**kwargs):
    print(f"b 收到 {kwargs}")

layer_a(x=1, y=2)
# 输出：
# b 收到 {'x': 1, 'y': 2, 'layer_a': True}
# a 看到 kwargs = {'x': 1, 'y': 2}
```

**解包前校验键的合法性**

当字典键来自外部数据（JSON、表单、数据库）再 `**` 解包前，先确认键都是合法标识符字符串，否则会难以察觉地崩溃。

```python
def safe_call(func, mapping):
    for key in mapping:
        if not isinstance(key, str) or not key.isidentifier():
            raise ValueError(f"非法关键字名: {key!r}")
    return func(**mapping)

def task(user_id, action):
    print(f"{user_id} -> {action}")

safe_call(task, {"user_id": 1, "action": "login"})   # 正常
# safe_call(task, {"user id": 1, "action": "x"})     # 抛 ValueError
```

**与类型注解配合**

`**kwargs` 的类型注解形式为 `**kwargs: ValueType`，表示所有值的统一类型；键无法注解（始终是字符串）。对可变关键字参数做类型标注时，特别注意没有"键的类型"这一项。

```python
from typing import Union

def build_query(base: str, **filters: Union[str, int]) -> str:
    pairs = [f"{k}={v}" for k, v in filters.items()]
    return f"{base}?{'&'.join(pairs)}"

print(build_query("/search", q="python", page=1, limit=20))
# 输出：/search?q=python&page=1&limit=20
```

## 4. 原理

本章深入讲解 `**kwargs` 在 Python 解释器层面到底是如何运作的，重点说明"调用时关键字参数打包为字典"与"`**` 解包把字典展开为关键字参数"这一双向转换的内部机制，以及 `**kwargs` 的绑定过程。

### 4.1 字节码视角：BUILD_MAP 与关键字参数打包

函数调用时，如果使用了关键字实参（形如 `f(a=1, b=2)`），CPython 会把这些"名字=值"对在调用前组织成一个字典，再附在函数调用上。这个动作对应的字节码指令在 Python 3.11+ 以前通常体现为 `KW_NAMES` + `CALL` 系列、或更早的 `CALL_FUNCTION_KW`；从概念上可以理解为：解释器把所有关键字实参构造成一个映射（dict）传给函数。

函数定义端接收这些关键字实参时，先把与命名形参对应的部分绑定到对应形参，没匹配上的多余关键字实参则集中起来，通过类似 `BUILD_MAP`（构造字典）的动作汇总为一个 dict 对象，绑定到 `**kwargs` 这个形参名上。

可以通过 `dis` 模块观察调用端的字节码：

```python
import dis

def demo(**kwargs):
    return kwargs

# 观察调用 demo(x=1, y=2) 的字节码
def caller():
    return demo(x=1, y=2)

dis.dis(caller)
```

运行这段代码会看到类似下面的字节码片段（不同 Python 版本指令名略有差异）：

```
  LOAD_CONST    1 (<code object ...>)
  LOAD_CONST    2 ('caller')
  MAKE_FUNCTION 0
  STORE_NAME   0 (caller)

  ...

 典型的关键字调用相关:
  LOAD_GLOBAL   0 (demo)
  LOAD_CONST    1 (1)
  LOAD_CONST    2 (2)
  KW_NAMES      ('x', 'y')     # 3.11+:关键字名清单
  CALL          2               # 调用,附带关键字名
```

`KW_NAMES` 把关键字名字清单告诉 `CALL`，`CALL` 据此把栈上的值按名字构造为字典，作为关键字实参传入 `demo`。函数内部的 `**kwargs` 形参正是从这个字典获得它的值。

### 4.2 定义端的绑定机制：从关键字字典到 kwargs

函数被调用时，CPython 会执行参数绑定（argument binding）。绑定的顺序大致是：

1. 位置实参与命名位置形参按位置配对绑定；
2. 关键字实参与同名的显式形参绑定；
3. 没匹配上的多余位置实参打包为元组，绑定到 `*args`；
4. 没匹配上的多余关键字实参打包为字典，绑定到 `**kwargs`；
5. 仍没被绑定的、且没有默认值的形参，抛出 `TypeError`；
6. 同一个形参被位置实参与关键字实参双重赋值时，抛出 `TypeError`。

也就是说 `**kwargs` 永远拿到的是"剩下没人要的"关键字实参。这解释了为什么同名形参会优先"吸走"对应关键字实参：

```python
def f(a, **kwargs):
    print(f"a={a}, kwargs={kwargs}")

f(a=1, b=2, c=3)
# 输出：a=1, kwargs={'b': 2, 'c': 3}
# a=1 被 a 形参绑定,b=2/c=3 进入 kwargs
```

绑定完成之后，在函数体内 `kwargs` 就是一个普通的局部 `dict` 变量，与其他任何局部变量无异——没有任何"特殊只读态"或"魔法属性"。

**绑定是一次性的**

绑定只发生在函数被调用那一刻，之后 `kwargs` 与绑定到 `a`、`args` 的对象就没有任何"联动"关系。在函数体内修改 `kwargs` 不会影响其它形参的值，反之亦然。

```python
def f(a, **kwargs):
    kwargs["a"] = 999      # 改 kwargs 里的 a
    print(f"a 仍是 {a}")   # a 不受影响
    print(f"kwargs = {kwargs}")

f(a=1, b=2)
# 输出：
# a 仍是 1
# kwargs = {'b': 2, 'a': 999}
```

`a` 是一个独立的局部变量，`kwargs["a"]` 只是字典里的一个键，二者没有引用关系。

### 4.3 调用端 `**` 解包：从字典到关键字实参

调用端 `f(**mapping)` 的过程正好是定义端的逆过程。CPython 看到调用表达式中带 `**`，会先把该字典的键值对转成关键字实参（键必须为字符串、且为合法标识符），然后合并进本次调用的关键字实参集合，之后走相同的参数绑定流程。

观察解包调用的字节码：

```python
import dis

def g(a, b):
    return a, b

def caller():
    d = {"a": 1, "b": 2}
    return g(**d)

dis.dis(caller)
```

关键字解包不会引入新的"字典"参数，而是把字典内部的键值对"摊平"为关键字实参与本次调用的其他关键字实参一起传给函数。因此：

```python
def f(a, b, c):
    print(a, b, c)

extra = {"b": 2, "c": 3}
f(a=1, **extra)    # 等价于 f(a=1, b=2, c=3)
# 输出：1 2 3
```

`a=1` 是直接写的关键字实参，`**extra` 解包出 `b=2, c=3`，合并后整体作为关键字实参传给 `f`。当然，同一个键不能既出现在直接书写的实参里、又出现在解包字典里，否则会触发"重复关键字参数"错误：

```python
# f(a=1, a=2, **{"a": 3})   # 重复,TypeError
```

### 4.4 字典与关键字参数的双向转换

把上面两个方向串起来，就构成了字典与关键字参数的双向转换通道：

- **字典 → 关键字参数**（调用端 `**d`）：把字典 `d` 的每个键值对变成一个关键字实参；
- **关键字参数 → 字典**（定义端 `**kwargs`）：把本次调用中没人要的关键字实参收集为字典 `kwargs`。

正因为它一来一回刚好是逆操作，所以下面这种"透传链"能完全无损工作：

```python
def inner(**kw):
    print(f"inner: {kw}")

def middle(**kw):
    print(f"middle 收到: {kw}")
    inner(**kw)          # 打包收到,再解包传出

middle(a=1, b=2, c=3)
# 输出：
# middle 收到: {'a': 1, 'b': 2, 'c': 3}
# inner: {'a': 1, 'b': 2, 'c': 3}
```

`middle` 把关键字实参打包为 `kw`，又用 `**kw` 把它解包回去传给 `inner`，`inner` 再把它打包回来。中间即便很多层，全程无损——只要中间层不主动修改 `kw`。

**不是完全无损的情况**

虽然结构上互逆，但语义上要注意：中间层若消费了某些键（比如 `kw.pop("x")`），这些键就不会再向下传；而下游若有显式同名形参，会先把对应关键字实参"吸走"进自身形参，进到下游 `kwargs` 里的就只是真正剩余的部分。这就是为什么"先 pop 取出、再透传"的写法能精确控制每层看到的参数。

```python
def bottom(**kw):
    print(f"bottom: {kw}")

def top(**kw):
    consumed = kw.pop("token", None)   # 顶层消费 token
    print(f"top 消费 token={consumed}")
    bottom(**kw)                        # token 不再向下传

top(token="abc", user="alice", role="admin")
# 输出：
# top 消费 token=abc
# bottom: {'user': 'alice', 'role': 'admin'}
```

### 4.5 `**kwargs` 与命名空间的关系

从内部实现看，函数调用涉及两个层面的"named values"：

- 函数的局部命名空间（locals）：由实参绑定而来，每个形参名都是一个局部变量；
- 关键字实参盒子（传入的关键字字典）：供绑定过程匹配。

`**kwargs` 形参是一个特殊位置：它"看见"的是没有匹配上任何显式形参的关键字实参——也就是没进入局部命名空间的那部分名字。所以可以从某个角度理解：`kwargs` 是"局部命名空间之外的关键字实参余量"的索引。

这也解释了为什么 `kwargs` 的键永远是字符串：因为它们都是"没被绑定成局部变量"的关键字实参的名字，而关键字名字除了字符串别无其他可能——Python 不允许关键字参数名是非字符串或非标识符。

### 4.6 解包时的类型与标识符限制的来源

`**d` 解包时要求键必须是合法标识符字符串，这个限制来自 Python 词法与语法层面：关键字实参中的名字（如 `f(name=value)` 中的 `name`）在语法上必须是 `identifier`——能作为变量名出现的词法单位。Python 没有把 "a-b" 这种字符串当作标识符的语法解析能力，所以也就不能用作关键字实参的名字，用 `**` 解包同样遵守这条语法约束。

```python
def f(**kw):
    print(kw)

# 合法标识符键 → 可以
f(**{"good_name": 1, "_x": 2})       # 输出：{'good_name': 1, '_x': 2}

# 非合法标识符键 → 不行
# f(**{"bad-name": 1})               # TypeError: 不合法标识符
# f(**{"123abc": 1})                 # 以数字开头,不合法
# f(**{1: "one"})                    # 键不是字符串
```

如果数据确实需要这种"非标识符键"，那就不该用 `**` 解包传给普通函数，而应直接作为一个 dict 参数显式传递。

## 5. 总结

### 5.1 本文内容要点

- 可变关键字参数 `**kwargs` 在函数定义端收集"未被显式形参捕获的多余关键字实参"，打包为一个普通 `dict`；调用端 `**mapping` 则把字典解包为一组关键字实参。
- `kwargs` 就是个普通字典，可遍历、可取值、可增删改；键永远是字符串且为合法标识符，Python 3.7+ 下保持插入顺序。
- `**kwargs` 必须位于形参列表最后；与 `*args` 配合时构成"接受任意位置 + 任意关键字实参"的通用签名。
- 典型场景包括：配置透传（多层链式透传到底层引擎）、装饰器透传（`*args, **kwargs` 让包装对调用者透明）、构造器参数收集（子类把不关心的参数继续传给父类 `super().__init__(**kwargs)`）、合并配置字典后解包调用。
- 取值时用 `get` 设默认值、透传中用 `pop` 消费自己的选项后再透传、解包前校验键的合法性、改名/增删前先 `dict(kwargs)` 拷一份是工程上的稳健写法。
- 原理上，调用端通过关键字实参构造字典（`KW_NAMES`/`CALL`），定义端绑定过程中把无处安放的关键字实参汇总为 `kwargs` 字典；双向转换构成"字典 ⇄ 关键字参数"通道，链式透传据此无损传递。

### 5.2 读完应能掌握的能力

- 能说明 `**kwargs` 在定义端与 `**mapping` 在调用端各自的作用，并解释它们为何互为逆操作。
- 能写出规范的"配置透传链"函数签名，正确使用 `pop` / `setdefault` 处理可选项后再透传给下游。
- 能写出对原函数完全透明的装饰器 wrapper（`*args, **kwargs` 收集并透传）。
- 能构造类继承层次下的 `__init__` 透传链，每一层只取自己关心的参数、其余向上传。
- 能正确混用位置参数、`*args`、keyword-only 参数、`**kwargs`，并解释参数归口规则与 `**kwargs` 必须在最后的语法依据。
- 说得出 `**` 解包时键必须是合法标识符字符串的原因，并能据此判断哪些字典能/不能安全解包。
- 能用 `dis` 观察调用端的关键字打包过程，从字节码层面理解字典与关键字参数的双向转换。