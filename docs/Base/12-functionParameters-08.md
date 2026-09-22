---
group:
  title: 【12】函数参数介绍
  order: 12
order: 8
title: 调用侧参数解包
nav:
  title: Python基础
  order: 1
---

# 调用侧参数解包

## 1. 介绍

### 1.1 什么是调用侧参数解包

**调用侧参数解包**是指在函数调用时，用 `*` 和 `**` 运算符将一个可迭代对象或字典拆开为独立的位置参数或关键字参数。它和 `*args` / `**kwargs` 是互逆操作——一个负责"收"，一个负责"拆"。

```python
def show(a, b, c):
    print(f"a={a}, b={b}, c={c}")


data = [1, 2, 3]
show(*data)  # * 将列表解包 → 等价于 show(1, 2, 3)
```

运行结果：

```text
a=1, b=2, c=3
```

`*data` 把列表 `[1, 2, 3]` 拆成了三个独立的位置实参 `1, 2, 3`。同样，`**dict` 把字典拆成独立的关键字实参：

```python
config = {"host": "localhost", "port": 8080}
connect(**config)  # 等价于 connect(host="localhost", port=8080)
```

### 1.2 在 Python 知识体系中的位置

调用侧参数解包是参数传递体系中"聚合」的逆操作：

```text
定义侧（收集）：                调用侧（解包）：
*args  ←  多个独立实参     →   *iterable  将一个可迭代对象拆为多个独立实参
**kwargs ← 多个关键字实参  →   **mapping  将一个字典拆为多个关键字实参
```

前两篇分别讲了 `*args` 和 `**kwargs` 的定义侧用法（收集），本篇聚焦于调用侧（解包）。理解 `*` 和 `**` 在两侧的不同含义，是掌握 Python 参数体系的最后一环。

### 1.3 最简示例

```python
# 解包列表，传给 *args 函数
def sum_all(*numbers):
    return sum(numbers)


scores = [85, 92, 78, 95, 88]
print(sum_all(*scores))  # 等价于 sum_all(85, 92, 78, 95, 88) → 438
```

---

## 2. 核心内容

### 2.1 `*` 解包：将可迭代对象拆分为位置实参

#### 2.1.1 基本语法

在调用函数时，在可迭代对象前加 `*`，Python 会逐个取出行其元素，作为独立的位置实参传入：

```python
def show_three(a, b, c):
    print(f"a={a}, b={b}, c={c}")


data = [1, 2, 3]
show_three(*data)          # 等价于 show_three(1, 2, 3)

data = (10, 20, 30)
show_three(*data)          # 元组也可以

data = range(3)
show_three(*data)          # range 也可以 → 0, 1, 2
```

**解包的本质**：`func(*iterable)` 等价于 `func(iterable[0], iterable[1], iterable[2], ...)`——Python 对可迭代对象调用 `iter()`，然后逐个提取元素作为独立实参。

#### 2.1.2 解包可以与其他参数混合

```python
def generic(*args):
    print(f"args = {args}")


items = ["hello", 42, 3.14]

# 解包 + 前置位置参数
generic(1, 2, *items)
# args = (1, 2, 'hello', 42, 3.14)

# 解包 + 后置位置参数
generic(*items, 99)
# args = ('hello', 42, 3.14, 99)

# 多个解包
a = [1, 2]
b = [3, 4]
generic(*a, *b)
# args = (1, 2, 3, 4)
```

混合规则：所有通过解包产生的实参和普通位置实参一起按**出现顺序**排列。

#### 2.1.3 任何可迭代对象都可以解包

| 对象类型 | 示例 | 解包结果 |
|---------|------|---------|
| list | `*[1, 2, 3]` | `1, 2, 3` |
| tuple | `*(4, 5, 6)` | `4, 5, 6` |
| str | `*"ABC"` | `'A', 'B', 'C'` |
| range | `*range(3)` | `0, 1, 2` |
| 生成器 | `*(x*2 for x in range(3))` | `0, 2, 4` |
| set | `*{7, 8, 9}` | `8, 9, 7`（无序） |
| 自定义迭代器 | `*MyIterator()` | 按 `__iter__` 依次产生 |

### 2.2 `**` 解包：将字典拆分为关键字实参

#### 2.2.1 基本语法

在字典前加 `**`，Python 将字典的键值对拆分为独立的关键字实参：

```python
def show_user(name, age, city="未知"):
    print(f"{name}，{age} 岁，{city}")


info = {"name": "小明", "age": 25, "city": "北京"}
show_user(**info)
# 等价于 show_user(name="小明", age=25, city="北京")
```

**解包本质**：`func(**mapping)` 等价于 `func(key1=value1, key2=value2, ...)`——字典的每个键成为一个关键字参数名，对应值成为参数值。

#### 2.2.2 解包可以混合使用

```python
def register(name, email, role="user", notify=True):
    print(f"注册：{name} <{email}>，角色={role}，通知={notify}")


# 位置参数 + 字典解包
defaults = {"role": "admin", "notify": False}
register("张三", "zhang@ex.com", **defaults)
# 注册：张三 <zhang@ex.com>，角色=admin，通知=False

# * 和 ** 同时使用
args = ["李四", "li@ex.com"]
kwargs = {"role": "user", "notify": False}
register(*args, **kwargs)
# 等价于 register("李四", "li@ex.com", role="user", notify=False)
```

### 2.3 解包中的三条铁律

#### 2.3.1 铁律一：位置参数必须在关键字参数之前

```python
def show(a, b, c="default", **kwargs):
    print(f"a={a}, b={b}, c={c}, kwargs={kwargs}")


# ✅ 解包位置在前，关键字在后
show(*[1, 2], c=3, extra="hello")

# ✅ 解包 + 解包——位置在前，关键字在后
show(*[1, 2], **{"c": 3, "extra": "hello"})

# ❌ 关键字解包在位置解包之前
# show(c=3, *[1, 2])  # SyntaxError
```

#### 2.3.2 铁律二：同一个参数不能通过多个来源传值

```python
def process(a, b, **kwargs):
    print(f"a={a}, b={b}, kwargs={kwargs}")


# ❌ a 既在位置解包中，又在关键字解包中
# process(*[1, 2], **{"a": 10})
# TypeError: got multiple values for argument 'a'

# ❌ 同样是 a 冲突
# process(1, 2, a=10)
# TypeError: got multiple values for argument 'a'
```

这个机制是 Python 的安全网——防止参数来源不清晰导致的歧义。

#### 2.3.3 铁律三：解包数量必须与形参数量匹配

对于没有 `*args` 的固定参数函数，解包产生的参数数量必须精确匹配：

```python
def fixed(a, b, c):
    print(f"a={a}, b={b}, c={c}")

fixed(*[1, 2, 3])     # ✅ 数量匹配
# fixed(*[1, 2, 3, 4]) # ❌ TypeError: 多了参数
# fixed(*[1, 2])        # ❌ TypeError: 少了参数
```

### 2.4 解包的典型应用场景

**场景一：配置文件驱动的函数调用**

```python
def connect_database(host, port=3306, user="root", password="",
                     database=None, charset="utf8mb4"):
    return f"mysql://{user}@{host}:{port}/{database or ''}"


# 从 YAML/JSON 配置文件加载的字典
db_config = {
    "host": "db.example.com",
    "user": "app_user",
    "password": "secret123",
    "database": "myapp",
}

# 一行解包——无需逐个提取字段
print(connect_database(**db_config))
```

这是生产代码中最常见的解包用法之一。配置字典可以来自 JSON、YAML、环境变量、命令行参数等多种来源，解包将它们统一映射到函数参数。

**场景二：中间件链中的参数透明转发**

```python
def middleware_a(func):
    def wrapper(*args, **kwargs):
        kwargs["request_id"] = "REQ-001"      # 注入额外参数
        return func(*args, **kwargs)            # 原样转发
    return wrapper


def middleware_b(func):
    def wrapper(*args, **kwargs):
        print(f"[LOG] args={args}, kwargs={kwargs}")
        return func(*args, **kwargs)
    return wrapper


@middleware_a
@middleware_b
def handle_request(path, method="GET", **options):
    return f"处理 {method} {path}，选项：{options}"
```

每个中间件通过 `*args, **kwargs` 做三件事：接收任意参数、可选注入新参数、原样传递给下一层。这个模式让中间件可以**任意堆叠**而不需要互相知道对方的参数需求。

**场景三：数据驱动的函数组合**

```python
def distance(x1, y1, x2, y2):
    return ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5


coords = [0, 0, 3, 4]
d = distance(*coords)  # distance(0, 0, 3, 4) → 5.0

# 从文件中读取的坐标列表
points = [
    [0, 0, 3, 4],
    [1, 1, 4, 5],
    [2, 2, 5, 6],
]
for p in points:
    print(f"距离 = {distance(*p):.2f}")
```

**场景四：合并多个配置源后解包**

```python
base_config = {"host": "localhost", "user": "root", "database": "test"}
env_overrides = {"host": "db.prod.com", "password": "prod_pass"}

# 先合并字典，再解包——避免重复键冲突
merged = {**base_config, **env_overrides}
connect_database(**merged)  # host 来自 env_overrides
```

直接写 `connect_database(**base_config, **env_overrides)` 会在两个字典有相同键时报错。先合并字典再解包是安全写法。

**场景五：动态构建 SQL 查询**

```python
def build_query(table, columns="*", where=None, **conditions):
    """构建参数化查询"""
    parts = [f"SELECT {columns} FROM {table}"]
    if where:
        parts.append(f"WHERE {where}")
    for key in conditions:
        parts.append(f"AND {key} = %s")
    return " ".join(parts)


# 从 Web 请求中获取查询条件
request_params = {"status": "active", "role": "admin", "sort": "created_at"}
query = build_query("users", where="1=1", **request_params)
```

### 2.5 解包与定义侧收包的对比：一张图理解全部

`*` 和 `**` 在 Python 中有两套完全不同的语义，取决于出现的位置：

```text
            定义侧                             调用侧
            ────────                           ────────
*args      收集多个位置实参 → 元组              拆一个可迭代对象 → 多个位置实参
           分散 → 聚合                          聚合 → 分散

**kwargs   收集多个关键字实参 → 字典            拆一个映射对象 → 多个关键字实参
           分散 → 聚合                          聚合 → 分散

位置要求   *args 在普通参数之后                *iterable 在 **mapping 之前
           **kwargs 在所有参数之后             两者都在普通参数之后

数量限制   最多一个 *args                      可以使用任意多个 *iterable
           最多一个 **kwargs                    最多一个 **mapping
```

这个对称设计让 Python 的参数系统在"结构化数据"和"独立参数"之间提供了完整的互转能力。

### 2.6 多变量赋值中的 `*`——同一符号的不同用法

解包运算符 `*` 在函数调用侧和赋值左侧是不同的用法，但原理相通：

```python
# 调用侧解包：将可迭代对象拆为独立实参
func(*[1, 2, 3])   # → func(1, 2, 3)

# 赋值侧解包：将剩余元素吸收到列表中
first, *rest = [1, 2, 3, 4, 5]
# first = 1, rest = [2, 3, 4, 5]

first, *middle, last = [1, 2, 3, 4, 5]
# first = 1, middle = [2, 3, 4], last = 5
```

函数调用侧的 `*` 是"拆"，赋值侧的 `*` 是"收"——这是同一个符号在不同上下文中的两种语义。

---

## 3. 最佳实践

### 3.1 推荐 vs 不推荐写法对比

#### 3.1.1 用解包替代逐个提取和传递

**不推荐**：从数据结构中逐个提取字段再传参

```python
config = load_config("db.yaml")
connect(host=config["host"], port=config["port"],
        user=config["user"], password=config["password"],
        database=config["database"], charset=config["charset"])
```

**推荐**：一行解包

```python
config = load_config("db.yaml")
connect(**config)
```

**原因**：解包消除了 6 行样板代码，且当新增配置项时无需改动调用代码。

#### 3.1.2 字典键名必须与形参名一致

**不推荐**：字典键名和形参名不一致

```python
params = {"server": "db.example.com", "login": "admin"}
# connect(**params)  # ❌ TypeError: 形参是 host 和 user，不是 server 和 login
```

**推荐**：确保字典键名与函数签名对齐

```python
params = {"host": "db.example.com", "user": "admin"}
connect(**params)  # ✅
```

#### 3.1.3 多个配置源合并后再解包

**不推荐**：直接解包两个可能有键冲突的字典

```python
# ❌ 如果 base 和 overrides 有相同键 → TypeError
# connect(**base, **overrides)
```

**推荐**：先合并字典，消除冲突

```python
merged = {**base, **overrides}  # overrides 优先
connect(**merged)               # 安全
```

### 3.2 常见错误模式及修正

**错误一：`*` 解包字符串时忘记它会按字符拆分**

```python
def show(*args):
    print(args)

show(*"hello")   # ('h', 'e', 'l', 'l', 'o')——5 个参数！
show("hello")    # ('hello',)——1 个参数
```

解包字符串时每个字符变成一个独立参数。如果想传递整个字符串，去掉 `*`。

**错误二：解包数量与形参不符**

对于没有 `*args` 的函数，解包过多或过少都会报 `TypeError`。确保可迭代对象的长度等于形参数量。

**错误三：`**` 解包的键必须全部是合法标识符**

```python
def show(**kwargs):
    ...

# show(**{"1st": "value"})     # ❌ 关键字参数名不能以数字开头
# show(**{"user-name": "x"})    # ❌ 关键字参数名不能含连字符
```

**错误四：`**` 解包的字典不能有未被函数接受的键**

```python
def connect(host, port):
    ...

config = {"host": "localhost", "port": 8080, "debug": True}
# connect(**config)  # ❌ TypeError: 没有 debug 这个形参
```

修正方式有两种：一是在目标函数中加 `**kwargs` 吸收多余参数；二是在解包前过滤字典：

```python
# 方式一：目标函数接收多余参数
def connect(host, port, **kwargs):
    ...

# 方式二：解包前只保留需要的键
allowed = {"host", "port"}
filtered = {k: v for k, v in config.items() if k in allowed}
connect(**filtered)
```

**错误五：对空可迭代对象解包传入需要参数的函数**

```python
def requires_one(x):
    return x

# requires_one(*[])  # ❌ TypeError: 缺少参数
```

**错误六：对非 mapping 对象使用 `**` 解包**

```python
def show(**kwargs):
    print(kwargs)

# show(**{1, 2, 3})  # ❌ TypeError: set 不是 mapping
```

`**` 要求对象实现了 `keys()` 方法。普通可迭代对象（list、set、tuple）不能使用 `**` 解包。

### 3.3 解包在不同 Python 版本中的特性

Python 3.5 引入了在同一调用中使用多个 `*` 解包的能力：

```python
# Python 3.5+ 特性
a = [1, 2]
b = [3, 4]
c = {"x": 10, "y": 20}

func(*a, *b, **c)  # 多个 * 解包 + 一个 **
# Python 3.4 及之前不允许这种写法
```

### 3.4 调用侧解包检查清单

1. **可迭代对象的长度是否匹配形参数量？**（无 `*args` 时）
2. **字典的键名是否全部与形参名一致？**
3. **字典的键是否全部是合法 Python 标识符？**
4. **多个解包源之间是否有重复键？** → 先合并字典再解包
5. **位置解包和关键字解包的顺序是否正确？** → 位置在前
6. **解包的数量是否与函数签名匹配？** → 有 `*args` 则任意数量，否则必须精确匹配
7. **`**` 解包的对象是否真的是 mapping？** → dict、OrderedDict 可以，set、list 不行

### 3.5 实际应用：一个完整的 HTTP 客户端封装

```python
def http_request(url, method="GET", **options):
    """模拟 HTTP 请求——options 收集全部可选配置"""
    timeout = options.pop("timeout", 30)
    headers = options.pop("headers", {})
    auth = options.pop("auth", None)
    body = options.pop("body", None)

    auth_str = "已认证" if auth else "匿名"
    return (f"{method} {url} | 超时:{timeout}s | {auth_str} "
            f"| Headers:{len(headers)}")


# 默认配置
default_headers = {"User-Agent": "MyApp/1.0"}
default_auth = ("admin", "secret")

# 用解包构建不同场景的调用
# 场景1：简单 GET
print(http_request("/api/users"))

# 场景2：POST + 认证 + 自定义头
print(http_request("/api/users", method="POST",
                   headers={**default_headers, "X-Request-ID": "abc"},
                   auth=default_auth,
                   body={"name": "张三"}))

# 场景3：用配置字典
config = {
    "method": "PUT",
    "headers": {"Content-Type": "application/json"},
    "auth": default_auth,
    "timeout": 10,
}
print(http_request("/api/users/42", **config))
```

这个例子展示了 `**kwargs` 收集 + `**config` 解包的完整配合模式——从配置字典到灵活的函数调用，解包让整个链路无需手工提取和传递每个参数。

---

## 4. 原理

### 4.1 `*` 和 `**` 是运算符，不是语法糖

`*` 和 `**` 在调用侧是真正的运算符——它们触发的是 Python 运行时的迭代和解包操作，而不是编译时的简单替换：

```text
func(*iterable)
  ↓
1. Python 调用 iter(iterable) 获取迭代器
2. 逐个执行 next() 提取元素
3. 将所有元素作为独立位置实参排列在参数列表中
4. 与普通位置实参一起，按出现顺序传递给函数

func(**mapping)
  ↓
1. Python 调用 mapping.keys() 获取所有键
2. 对每个键 k，读取 mapping[k] 作为值 v
3. 将所有 (k, v) 对转换为关键字实参 k=v
4. 与普通关键字实参一起，传递给函数
```

### 4.2 解包与 *args/**kwargs 的往返

```python
# 定义侧收集 + 调用侧解包 = 往返
def collect(*args, **kwargs):
    print(f"args={args}, kwargs={kwargs}")


data = [1, 2, 3]
config = {"name": "test", "flag": True}

collect(*data, **config)
# args=(1, 2, 3), kwargs={'name': 'test', 'flag': True}
```

解包→收集的往返是 Python 参数系统设计精巧的体现：`*` 和 `**` 在两侧是一对完美的逆操作，通过它们，数据可以在"结构化容器"和"独立参数"之间自由转换。

可以这样验证往返的精确性：

```python
def roundtrip(*args, **kwargs):
    """验证数据在解包→收集的往返中保持完整"""
    return args, kwargs


# 任意复杂的数据结构都可以精确往返
data = [1, "hello", (2, 3)]
config = {"x": 10, "y": {"nested": True}}

restored_args, restored_kwargs = roundtrip(*data, **config)
print(restored_args == tuple(data))    # True
print(restored_kwargs == config)       # True
```

---

## 5. 总结

本文围绕 Python 调用侧参数解包展开，主要介绍了以下内容：

- `*iterable` 将可迭代对象拆开为独立的位置实参；`**mapping` 将字典拆开为独立的关键字实参
- 解包与 `*args` / `**kwargs` 的定义侧用法是互逆操作——一个"拆"，一个"收"
- 解包可以与其他参数混合：位置解包在前、关键字解包在后、同一参数不能来自多个来源
- 任何可迭代对象（list、tuple、str、range、生成器、set、自定义迭代器）都可以用 `*` 解包
- 核心应用场景：配置文件驱动调用、中间件链、数据驱动组合、多配置源合并
- 常见错误：解包数量不匹配、字典键与形参名不一致、解包字符串按字符拆分