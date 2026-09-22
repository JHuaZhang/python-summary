---
group:
  title: 【12】函数参数介绍
  order: 12
order: 7
title: 可变关键字参数 **kwargs
nav:
  title: Python基础
  order: 1
---

# 可变关键字参数 **kwargs

## 1. 介绍

### 1.1 什么是 **kwargs

`**kwargs` 是 Python 中用于接收**任意数量关键字参数**的语法。在函数定义时，形参列表末尾写 `**kwargs`，调用时所有超出已知形参名称的关键字实参，都会被收集到一个字典中。

```python
def show_info(**kwargs):
    for key, value in kwargs.items():
        print(f"{key} = {value}")


show_info(name="小明", age=25, city="北京")
```

运行结果：

```text
name = 小明
age = 25
city = 北京
```

`kwargs` 是一个**字典**——键是参数名（字符串），值是参数值。支持所有字典操作：`items()`、`keys()`、`values()`、`get()`、`in` 等。

`*args` 处理"任意数量的位置参数"，`**kwargs` 处理"任意数量的关键字参数"——两者组合在一起可以实现**接收任意形式参数的通用函数**。

### 1.2 在 Python 知识体系中的位置

在 Python 参数体系中，`**kwargs` 是"弹性机制"的另一半：

```text
def func(a, b, *args, c=10, **kwargs):
    pass

   固定参数    *args收集  默认参数    **kwargs收集
             剩余位置               剩余关键字
```

- `*args` 收集剩余**位置**参数 → 元组
- `**kwargs` 收集剩余**关键字**参数 → 字典
- 两者配合使用，可以适配任何调用签名

`**kwargs` 在装饰器、子类化、API 包装、配置管理等场景中大量使用。

### 1.3 最简示例

```python
def merge_options(defaults, **overrides):
    """合并默认配置和用户覆盖选项"""
    result = defaults.copy()
    result.update(overrides)
    return result


base = {"timeout": 30, "retries": 3}
custom = merge_options(base, timeout=60, debug=True)
print(custom)
# {'timeout': 60, 'retries': 3, 'debug': True}
```

`**overrides` 接收了 `timeout=60` 和 `debug=True`，打包为 `{'timeout': 60, 'debug': True}`，然后更新到基础配置中。

---

## 2. 核心内容

### 2.1 **kwargs 的基本语法与本质

#### 2.1.1 语法规则

| 部分 | 含义 |
|------|------|
| `**` | 前缀符号，表示"收集剩余关键字参数" |
| `kwargs` | 变量名——约定俗成叫 `kwargs`（keyword arguments 缩写） |
| 整体 | 接收所有未匹配的关键字实参，打包进一个字典 |

`kwargs` 的本质是一个**字典**——支持 `items()`、`keys()`、`values()`、`get()`、`in` 等所有字典操作：

```python
def inspect(**kwargs):
    print(f"类型：{type(kwargs)}")       # <class 'dict'>
    print(f"键：{list(kwargs.keys())}")  # dict 方法
    print(f"值：{list(kwargs.values())}")
    # 安全取值
    print(kwargs.get("unknown", "默认"))  # 不存在的键返回默认值


inspect(name="Alice", role="admin", active=True)
```

运行结果：

```text
类型：<class 'dict'>
键：['name', 'role', 'active']
值：['Alice', 'admin', True]
默认
```

#### 2.1.2 可以接收 0 个参数

```python
def show(**kwargs):
    print(kwargs)


show()            # {}
show(x=1)         # {'x': 1}
show(a=1, b=2)    # {'a': 1, 'b': 2}
```

不传任何关键字参数时，`kwargs` 是空字典 `{}`。

#### 2.1.3 参数键必须是合法标识符

`**kwargs` 的键来自调用时写的参数名，必须是 Python 合法标识符（不能以数字开头、不能含特殊字符等）：

```python
def store(**kwargs):
    return kwargs

# ✅ 合法：标准标识符
store(user_name="alice", version2="1.0")

# ❌ 不合法：以数字开头
# store(1st="value")  # SyntaxError

# ❌ 不合法：含连字符
# store(user-name="alice")  # SyntaxError
```

### 2.2 **kwargs 与其他参数的混合使用

#### 2.2.1 形参列表中的位置规则

`**kwargs` 必须是形参列表中的**最后一个参数**，且一个函数中最多出现一次：

```python
# ✅ 正确位置
def func(a, b, *args, **kwargs):
    pass

def simple(a, **kwargs):
    pass

# ❌ 错误
# def broken(**kwargs, a):  # SyntaxError
#     pass
```

#### 2.2.2 绑定规则：已知形参先拿，剩余全给 **kwargs

```python
def config(host, port=8080, **options):
    print(f"host={host}, port={port}")
    print(f"额外选项：{options}")


config("localhost")
# host=localhost, port=8080, 额外选项：{}

config("db.example.com", port=3306)
# host=db.example.com, port=3306, 额外选项：{}

config("api.com", timeout=30, retries=3, ssl=True)
# host=api.com, port=8080, 额外选项：{'timeout': 30, 'retries': 3, 'ssl': True}
```

`host` 和 `port` 是已知形参，优先匹配。`timeout`、`retries`、`ssl` 在形参列表中找不到对应名称，全部被 `**kwargs` 收集。

绑定流程：

```text
调用 config("api.com", timeout=30, retries=3)
  ↓
1. 处理位置实参："api.com" → host
2. 处理关键字实参：
   - timeout=30 → 形参列表中没有 timeout → 进入 **kwargs 候选
   - retries=3  → 形参列表中没有 retries  → 进入 **kwargs 候选
3. port 未被赋值 → 使用默认值 8080
4. 所有候选关键字 → **kwargs = {'timeout': 30, 'retries': 3}
```

#### 2.2.3 完整签名：固定 + *args + 默认 + **kwargs

```python
def full(a, b, *args, c=10, **kwargs):
    print(f"a={a}, b={b}, args={args}, c={c}, kwargs={kwargs}")


full(1, 2, 3, 4, 5, c=100, x=10, y=20)
# a=1, b=2, args=(3, 4, 5), c=100, kwargs={'x': 10, 'y': 20}

full(1, 2)
# a=1, b=2, args=(), c=10, kwargs={}
```

`*args` 收集剩余位置参数，`**kwargs` 收集剩余关键字参数——两者各司其职，互不干扰。

### 2.3 **kwargs 的核心应用场景

#### 2.3.1 灵活配置函数

`**kwargs` 让函数可以接收任意配置项，而不需要为每个配置项声明参数：

```python
def create_button(label, **styles):
    """创建按钮——样式完全通过 **kwargs 传递"""
    attrs = [f'label="{label}"']
    for key, value in styles.items():
        attrs.append(f'{key}="{value}"')
    return f"<Button {' '.join(attrs)} />"


print(create_button("提交"))                                    # 默认样式
print(create_button("删除", color="red", size="large"))          # 自定义
print(create_button("确认", bg="blue", disabled=True))           # 灵活组合
```

#### 2.3.2 参数转发——不破坏被包装函数的接口

与 `*args` 的转发类似，`**kwargs` 转发关键字参数：

```python
def cached_query(query, **params):
    """带缓存的查询——转发 params 给底层查询函数"""
    cache_key = f"{query}:{params}"
    print(f"[CACHE] key = {cache_key}")
    return database_query(query, **params)  # 字典解包原样转发
```

#### 2.3.3 子类化——链式传递配置

类的 `__init__` 中使用 `**kwargs` 可以让继承链灵活传递参数：

```python
class Base:
    def __init__(self, name, **kwargs):
        self.name = name
        self.options = kwargs

class Child(Base):
    def __init__(self, name, version, **kwargs):
        super().__init__(name, **kwargs)  # kwargs 原样向上传递
        self.version = version

# 调用端可以传递任意额外配置
obj = Child("MyApp", "2.0", env="production", debug=False)
# Child 拿到 version，剩下的 env 和 debug 通过 **kwargs 传到 Base
```

#### 2.3.4 通用装饰器

结合 `*args` 和 `**kwargs`，装饰器可以适配**任意函数签名**：

```python
def logged(func):
    def wrapper(*args, **kwargs):
        print(f"→ {func.__name__}(args={args}, kwargs={kwargs})")
        result = func(*args, **kwargs)
        print(f"← {result}")
        return result
    return wrapper
```

#### 2.3.5 配置合并模式

```python
def http_client(base_url, **config):
    """config 收集所有可选配置项，与默认值合并"""
    defaults = {"timeout": 30, "headers": {}, "auth": None}
    settings = {**defaults, **config}  # 用户值覆盖默认值
    return f"{base_url} | timeout={settings['timeout']}s"


print(http_client("https://api.com", timeout=10, auth=("u", "p")))
```

### 2.4 定义侧的 **kwargs vs 调用侧的 **

| 位置 | 语法 | 含义 | 方向 |
|------|------|------|------|
| **定义侧** | `def func(**kwargs):` | **收集**：多个关键字实参 → 一个字典 | 分散 → 聚合 |
| **调用侧** | `func(**mapping)` | **解包**：一个字典 → 多个关键字实参 | 聚合 → 分散 |

```python
# 定义侧 **kwargs：收集（多→一）
def show(**kwargs):
    print(kwargs)

show(name="Alice", age=25)    # 两个关键字 → {'name': 'Alice', 'age': 25}

# 调用侧 **：解包（一→多）
config = {"name": "Bob", "age": 30}
show(**config)                # 一个字典 → name="Bob", age="30"
# 等价于 show(name="Bob", age=30)
```

**解包可以混合使用**：

```python
def register(name, email, **extra):
    print(f"{name} <{email}>，额外：{extra}")


defaults = {"role": "user", "notify": True}
register("Alice", "alice@ex.com", **defaults)
# 等价于 register("Alice", "alice@ex.com", role="user", notify=True)
```

一个常见的实际模式是用 `**` 解包来传递从配置文件或环境变量中读取的字典：

```python
# 从配置文件中读取的数据库连接参数
db_config = load_config("database.yaml")
# db_config = {"host": "localhost", "port": 3306, "user": "admin"}

connection = create_connection(**db_config)
# 等价于 create_connection(host="localhost", port=3306, user="admin")
```

这种方式让配置文件中的键名直接映射为函数的关键字参数——无需手动逐个提取和传递。但要注意：配置字典的键必须与函数形参名称完全匹配，否则会触发 `TypeError`。

**解包与普通关键字参数的合并顺序**：

```python
def configure(host, port=8080, **extra):
    ...

# 解包传参 + 额外关键字覆盖
common = {"port": 3306, "ssl": True}
configure("api.com", **common, port=9090, timeout=60)
# 最终：host="api.com", port=9090（覆盖了 common 中的 3306）, ssl=True, timeout=60
```

---

## 3. 最佳实践

### 3.1 推荐 vs 不推荐写法对比

#### 3.1.1 用 **kwargs 保持接口开放

**不推荐**：固定参数列表——任何新需求都要改动函数签名

```python
# 每增加一个配置项就要改一次签名
def create_report(title, author, date, footer=None, page_size="A4", ...):
    ...
```

**推荐**：核心参数明确 + **kwargs 保持开放

```python
def create_report(title, **options):
    """title 必选，其余配置通过 **options 灵活传递"""
    ...

create_report("月报", author="张三", date="2026-09-22")
create_report("年报", author="李四", footer="保密", language="zh", page_size="A3")
```

#### 3.1.2 子类化中保持 **kwargs 传递链

**不推荐**：子类截断 **kwargs

```python
class Child(Base):
    def __init__(self, name, version):
        super().__init__(name)  # 只传了 name，丢失了其他参数
```

**推荐**：子类保留 **kwargs，原样向上传递

```python
class Child(Base):
    def __init__(self, name, version, **kwargs):
        super().__init__(name, **kwargs)
        self.version = version
```

#### 3.1.3 命名优先使用 kwargs

通用场景用标准名称 `**kwargs`；特定领域可以用更有语义的名字如 `**options`、`**config`、`**styles`。但即使在领域场景中，`**kwargs` 仍然是安全的选择。

#### 3.1.4 提取 kwargs 中的值做输入验证

**不推荐**：直接使用 kwargs，不做任何检查

```python
def create_user(**kwargs):
    name = kwargs["name"]  # KeyError 如果 name 没传
    email = kwargs.get("email", "unknown@example.com")
    ...
```

**推荐**：提取必需的键，给出有意义的默认值和错误信息

```python
def create_user(**kwargs):
    name = kwargs.pop("name", None)
    if name is None:
        raise ValueError("name 是必选参数")
    email = kwargs.pop("email", "unknown@example.com")
    role = kwargs.pop("role", "user")

    if kwargs:
        raise ValueError(f"未知参数：{list(kwargs.keys())}")
    # 处理逻辑
    return f"创建用户 {name} ({email})，角色={role}"


print(create_user(name="张三", email="zhang@ex.com"))
print(create_user(name="李四", role="admin"))
# create_user()  # ValueError: name 是必选参数
```

这种模式结合了 `**kwargs` 的灵活性和必要的输入验证，是 API 端点函数中最常用的设计。

### 3.2 常见错误模式及修正

**错误一：把字典当成位置参数传入 `**kwargs` 函数**

```python
def show(**kwargs):
    print(kwargs)

# show({"name": "alice"})  # ❌ TypeError: 不能把 dict 当位置参数
show(**{"name": "alice"})  # ✅ 用 ** 解包
```

**错误二：在 `**kwargs` 后面跟参数**

```python
# def broken(**kwargs, extra):  # ❌ SyntaxError
#     pass

def correct(extra, **kwargs):   # ✅ **kwargs 必须放最后
    pass
```

**错误三：解包时键与已有参数冲突**

```python
def register(name, email, **extra):
    ...

defaults = {"email": "x@x.com", "role": "admin"}
# register("Alice", **defaults)  # ❌ email 传了两次！TypeError

# ✅ 先合并再传
params = {"name": "Alice", **defaults}
register(**params)
```

**错误四：调用侧 `func(**dict)` 中 dict 的键必须是合法标识符**

```python
def show(**kwargs):
    ...

# show(**{"1st": "value"})     # ❌ 关键字参数名不能以数字开头
# show(**{"user-name": "x"})    # ❌ 关键字参数名不能含连字符
show(**{"first": "value"})     # ✅
show(**{"user_name": "value"}) # ✅
```

这个限制来自 Python 的关键字参数语法本身——参数名必须符合标识符规范。

**错误五：对 `**kwargs` 进行修改后，没有意识到修改了映射**

```python
def process(**kwargs):
    kwargs["new_key"] = "new_value"  # kwargs 是函数内的普通字典
    # 这个修改只影响 kwargs 这个局部变量，不影响调用者
    # 但如果 kwargs 中的某个值本身是可变对象，修改它会影响外部
    if "items" in kwargs:
        kwargs["items"].append("processed")  # ⚠️ 影响了调用者的列表！
```

### 3.3 Python 内置函数与标准库中的 **kwargs

| 函数/方法 | 签名 | **kwargs 的作用 |
|----------|------|----------------|
| `dict()` | `dict(**kwargs)` | 从关键字参数创建字典 |
| `str.format()` | `format(**kwargs)` | 通过关键字参数格式化 |
| `subprocess.run()` | `run(args, **kwargs)` | 大量配置选项通过 kwargs 传递 |
| `requests.get()` | `get(url, **kwargs)` | headers、params、auth 等灵活配置 |

以 `dict()` 为例展示 `**kwargs` 的威力：

```python
d = dict(name="Alice", age=25, active=True)
print(d)  # {'name': 'Alice', 'age': 25, 'active': True}
```

`str.format()` 配合 `**kwargs` 让命名占位符成为可能：

```python
template = "{name} 的分数是 {score}"
result = template.format(name="小明", score=95)
print(result)  # 小明的分数是 95
```

### 3.4 *args 与 **kwargs 的选择指南

```text
参数特征
  ↑
  │ 参数名不固定、随业务变化 → **kwargs
  │ 例：API 配置项、样式属性、扩展选项
  │
  │ 参数数量不固定、但无名称 → *args
  │ 例：多值聚合、格式化列表、数学运算
  │
  │ 位置和关键字都有可能 → *args + **kwargs
  │ 例：装饰器、代理函数、通用包装
  │
  │ 数量和名称都固定 → 普通参数
  │ 例：已知的必选字段和可选字段
  │
  └────────────────────────────→ 需求明确度
```

实用的判断流程：

1. 参数有名字吗？→ 是 → 使用关键字参数或 `**kwargs`
2. 参数只是列表式的值？→ 使用位置参数或 `*args`
3. 需要同时支持两者？→ 使用 `*args, **kwargs` 组合
4. 你是在写装饰器？→ 总是使用 `*args, **kwargs` 组合

---

## 4. 原理

### 4.1 **kwargs 在函数对象中的存储

通过函数对象的 `__code__` 属性可以看到 `**kwargs` 的标记：

```python
def demo(a, b, *args, **kwargs):
    pass

# co_flags 中有一个标志位表示使用了 **kwargs
print(f"有 **kwargs：{demo.__code__.co_flags & 0x08 != 0}")  # True
print(f"有 *args：{demo.__code__.co_flags & 0x04 != 0}")    # True
```

`co_flags` 是位掩码：`0x04` 标记 `*args`，`0x08` 标记 `**kwargs`。Python 解释器在调用时读取这些标记来决定如何解析实参。

### 4.2 调用时的 **kwargs 收集流程

```text
调用 func(1, b=2, c=3, d=4)，其中 func(a, b, *args, **kwargs)
  ↓
1. 处理位置实参：a=1
2. 处理关键字实参：
   - b=2 → 形参 b 匹配 → b=2
   - c=3 → 形参列表中没有 c → 进入 **kwargs 候选
   - d=4 → 形参列表中没有 d → 进入 **kwargs 候选
3. 检测到 **kwargs → 将所有候选打包：kwargs = {'c': 3, 'd': 4}
4. 检查所有必选参数都有值 → 执行
```

### 4.3 *args 和 **kwargs 的协同原理

当函数同时有 `*args` 和 `**kwargs` 时，绑定的执行顺序不变：

```text
1. 位置实参 → 绑定普通形参（a, b...）
2. 剩余位置实参 → *args（元组）
3. 关键字实参 → 绑定普通形参（c, d...）
4. 剩余关键字实参 → **kwargs（字典）
```

这个顺序保证了：
- 位置参数不会落入 `**kwargs`（它们被 `*args` 优先接住了）
- 关键字参数不会落入 `*args`（它们是命名参数，走的是名称匹配路径）
- 两者各司其职，覆盖了参数传递的完整空间

用代码验证这个顺序：

```python
def demo(a, b, *args, c=10, **kwargs):
    print(f"  a={a}, b={b}")
    print(f"  *args={args}")
    print(f"  c={c}")
    print(f"  **kwargs={kwargs}")

# 传入各种参数，观察它们各自的归宿
demo(1, 2, 3, 4, c=100, d=200, e=300)
#   a=1, b=2           ← 前两个位置
#   *args=(3, 4)       ← 剩余位置
#   c=100              ← 关键字匹配已知形参
#   **kwargs={'d': 200, 'e': 300}  ← 剩余关键字
```

`args` 和 `kwargs` 的分工精确而稳定——这是 Python 参数系统设计优雅的体现。

---

## 5. 总结

本文围绕 Python 可变关键字参数 `**kwargs` 展开，主要介绍了以下内容：

- `**kwargs` 收集任意数量的关键字实参到一个字典中，本质就是 `dict`，支持所有字典操作
- `**kwargs` 必须是形参列表的最后一个参数，已知形参优先匹配，剩余关键字全归 `**kwargs`
- 定义侧的 `**kwargs`（收集，分散→聚合）和调用侧的 `**`（解包，聚合→分散）是互逆操作
- 核心应用场景：灵活配置函数、参数转发、子类化链式传递、通用装饰器、配置合并
- `*args` 和 `**kwargs` 协同工作时，位置参数归 `*args`，关键字参数归 `**kwargs`，覆盖了参数传递的完整空间
- 常见错误：把字典当位置参数传入、`**kwargs` 后跟参数、解包键冲突、键名不合法