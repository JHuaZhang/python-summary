---
group:
  title: 【12】函数参数介绍
  order: 12
order: 4
title: 默认参数值
nav:
  title: Python基础
  order: 1
---

# 默认参数值

## 1. 介绍

### 1.1 什么是默认参数值

**默认参数值**（Default Parameter Value）是在定义函数时，给某些形参预先赋予一个值。当调用者没有为这些形参提供实参时，它们就自动使用预先设定的默认值；当调用者提供了实参时，默认值被覆盖。

```python
def greet(name, greeting="你好"):
    return f"{greeting}，{name}！"


print(greet("小明"))                   # 你好，小明！
print(greet("小红", greeting="早上好"))  # 早上好，小红！
```

运行结果：

```text
你好，小明！
早上好，小红！
```

`greeting="你好"` 就是一个默认参数值——`greeting` 有了一个"后备值"。调用者可以完全不碰它（使用默认值），也可以显式传入一个新值来覆盖它。

### 1.2 在 Python 知识体系中的位置

默认参数值是位置参数和关键字参数的**自然延伸**。如果说位置参数解决了"传什么"，关键字参数解决了"怎么传得更清晰"，那默认参数值解决的就是"不传的时候怎么办"。它的核心价值在于：

- **简化常见调用**：把最常用的值设为默认值后，大多数调用无需显式传参
- **向后兼容**：给函数增加新参数时，新参数带默认值就不会破坏已有调用代码
- **表达"可选性"**：有默认值的参数天然就是"可选"的，调用者不用被迫关心它

### 1.3 最简示例

```python
def create_connection(host, port=3306, user="root", charset="utf8mb4"):
    return f"mysql://{user}@{host}:{port}?charset={charset}"


# 最简调用：只传必选的 host，其余全部用默认值
print(create_connection("localhost"))
# mysql://root@localhost:3306?charset=utf8mb4

# 覆盖一个默认值
print(create_connection("db.example.com", user="admin"))
# mysql://admin@db.example.com:3306?charset=utf8mb4
```

4 个参数中只有 1 个是必选的，调用者可以根据需要在"全默认"和"全部自定义"之间任意选择。

---

## 2. 核心内容

### 2.1 默认参数值的基本语法与规则

#### 2.1.1 基本语法

```python
def 函数名(必选参数, 可选参数=默认值, ...):
    函数体
```

**语法规则**：

- 默认值写在 `=` 后面，和关键字参数调用时的 `=` 是同一符号但含义不同
- 定义时：`param=value` 是**设定默认值**（"如果没传，就用这个"）
- 调用时：`param=value` 是**关键字传参**（"明确传这个值给 param"）
- 默认值可以是任意表达式——字面量、变量、函数调用结果等

```python
# 定义时 = 设定默认值
def configure(host, port=8080):     # port 的默认值是 8080
    ...

# 调用时 = 关键字传参
configure("api.example.com", port=9090)  # 覆盖 port 为 9090
```

#### 2.1.2 默认参数必须排在非默认参数后面

这是一条语法硬约束——有默认值的参数不能出现在没有默认值的参数前面：

```python
# ✅ 正确：必选参数在前，默认参数在后
def func(a, b=10, c=20):
    return a + b + c

# ❌ 错误：默认参数不能放在必选参数前面
# def func(a=10, b):  # SyntaxError: non-default argument follows default argument
#     pass
```

这个限制的出发点很明确——消除调用时的歧义。假设 `func(a=10, b)` 是合法的，那么 `func(5)` 中的 `5` 应该给 `a` 还是给 `b`？Python 无法确定，干脆在语法层面禁止。

#### 2.1.3 不同类型的默认值：不可变 vs 可变

默认值按数据类型的可变性分为两类，安全性完全不同：

| 默认值类型 | 示例 | 安全性 | 原因 |
|-----------|------|--------|------|
| 不可变（int、str、tuple、None） | `timeout=30`、`name=""` | ✅ 安全 | 对象内容无法被修改 |
| 可变（list、dict、set） | `items=[]`、`config={}` | ⚠️ 危险 | 对象在所有调用之间共享 |

可变默认值（list、dict、set 等）的陷阱：由于默认值在定义时创建且所有调用共享，多次调用会操作同一个可变对象，导致意想不到的累积行为。安全做法是用 `None` 哨兵在函数体内创建新对象（在 2.3 节详述）。

### 2.2 默认值的求值时机——核心机制

#### 2.2.1 定义时求值，只求值一次

这是默认参数值最核心的机制：**默认值表达式在函数定义时计算，只计算一次，后续所有调用共享同一个对象。**

```python
def show_time(timestamp=__import__("datetime").datetime.now()):
    """timestamp 的默认值是定义函数那一刻的时间"""
    return timestamp


t1 = show_time()
import time; time.sleep(2)
t2 = show_time()

print(t1 == t2)  # 输出：True —— 间隔 2 秒，但默认值还是定义时的那个时间！
```

无论调用多少次 `show_time()`，只要不传参数，`timestamp` 永远是**函数被定义那一刻**的 `datetime.now()` 返回值。

这个机制的运作过程：

```text
当 Python 执行到 def show_time(timestamp=datetime.now()):
  ↓
1. 对 datetime.now() 求值 → 得到 "2026-09-22 12:00:00.123"
2. 将这个值绑定为函数对象的默认值
3. 后续每次调用，如果不传 timestamp，就使用步骤 2 中保存的同一个对象
4. datetime.now() 不会再次执行！
```

#### 2.2.2 这个机制对不可变默认值的影响

对于不可变默认值（如 `int`、`str`），"定义时求值一次"通常不成问题，因为即使多次调用共享同一个对象，调用的代码也无法修改它：

```python
def append_suffix(text, suffix=".txt"):
    return text + suffix  # str 拼接创建新对象，不修改原 ".txt"


print(append_suffix("readme"))   # readme.txt
print(append_suffix("data", ".csv"))  # data.csv
```

#### 2.2.3 这个机制对可变默认值的影响

对于可变默认值，"所有调用共享同一个可变对象"就是一场灾难：

```python
def add_item(item, items=[]):
    items.append(item)
    return items


print(add_item("a"))  # ['a']
print(add_item("b"))  # ['a', 'b']  ← 不是 ['b']！
print(add_item("c"))  # ['a', 'b', 'c']  ← 越来越长！
```

每一次"看起来独立"的调用，都在往同一个默认列表里追加元素。这是因为默认列表对象 `[]` 在定义时创建了一次，后续所有没有传 `items` 的调用都操作同一个列表对象。

修正模式：

```python
def add_item_safe(item, items=None):
    """用 None 做默认值，每次调用时按需创建新列表"""
    if items is None:
        items = []
    items.append(item)
    return items


print(add_item_safe("a"))  # ['a']
print(add_item_safe("b"))  # ['b']  ← 正确！每次都是新列表
print(add_item_safe("c"))  # ['c']
```

### 2.3 `None` 哨兵模式

#### 2.3.1 基础用法

`None` 哨兵模式是 Python 中最常用的默认值设计模式：**用 `None` 作为默认值，在函数体内检查 `None` 来决定实际行为**。

```python
def connect_to_cache(host, port=None):
    """port 的默认值取决于 host"""
    if port is None:
        port = 6379 if "redis" in host else 11211
    return f"连接 {host}:{port}"


print(connect_to_cache("redis-cluster.local"))   # 连接 redis-cluster.local:6379
print(connect_to_cache("memcached.local"))       # 连接 memcached.local:11211
print(connect_to_cache("redis.local", 6380))     # 连接 redis.local:6380
```

这里 `port=None` 的语义不是"port 默认为 None"，而是**"port 没有被用户指定——请根据 host 自动决定"**。`None` 在此充当了一个"未传"的信号。

#### 2.3.2 None 哨兵的局限性

当 `None` 本身也是有效值时，基础版哨兵就不够用了：

```python
def get_user(name, age=None):
    if age is None:
        return f"用户 {name}（年龄未知）"
    return f"用户 {name}，{age} 岁"


print(get_user("小明", 0))     # 正常——0 岁
print(get_user("李四", None))  # 等价于不传——无法区分！
```

`age=0` 和 `age=None` 应该是不同的——但 `None` 哨兵把"没传"和"传了 None"混为一谈。

#### 2.3.3 自定义哨兵对象

当需要精确区分"没传"和"传了任何值（包括 None）"时，使用唯一的自定义哨兵对象：

```python
_NOT_PROVIDED = object()  # 创建一个全宇宙唯一的哨兵对象


def cache_get(key, default=_NOT_PROVIDED):
    """从缓存取值——区分'不传 default'和'default=None'"""
    cache = {"name": "Alice", "role": "admin"}

    if key in cache:
        return cache[key]

    if default is _NOT_PROVIDED:
        raise KeyError(f"缓存中没有键 '{key}'")

    return default  # 即使用户传了 None，也返回 None


# 不传 default → 抛异常
# cache_get("missing_key")  → KeyError

# 传了 default=None → 返回 None
result = cache_get("missing_key", None)  # 返回 None（用户的意愿）

# 传了正常默认值 → 返回它
result = cache_get("missing_key", "默认值")  # 返回 "默认值"
```

`object()` 创建的每个对象都是独一无二的——只有函数定义时的那个原始对象才会命中 `is _NOT_PROVIDED` 检查，任何用户传入的值（包括 `None`）都不可能等于这个哨兵。

| 场景 | None 哨兵 | 自定义哨兵 |
|------|----------|-----------|
| 用户不会传 None 作为有效值 | ✅ 够用 | 也可以 |
| None 是有效值 | ❌ 无法区分 | ✅ 精确区分 |
| 需要区分三种情况（未传/传了值/传了None） | ❌ | ✅ |

### 2.4 默认参数的设计模式

#### 2.4.1 模式一：合理默认行为

将最常用、最合理的值设为默认值，让大多数调用场景无需显式传参：

```python
def read_file(filename, size=-1, encoding="utf-8"):
    """默认读取全部内容，UTF-8 编码——覆盖了 95% 的场景"""
    ...

read_file("data.txt")                           # 95% 的场景这样用
read_file("data.txt", 1024)                     # 少数场景：限制大小
read_file("data.txt", encoding="gbk")           # 少数场景：指定编码
```

#### 2.4.2 模式二：函数参数作为覆盖开关

某些参数的默认值可以充当"自动检测"开关，用户传入时就覆盖默认行为：

```python
def log_message(message, level="INFO", timestamp=None, output=None):
    """timestamp 默认为当前时间，output 默认为控制台"""
    if timestamp is None:
        timestamp = datetime.now().strftime("%H:%M:%S")
    prefix = f"[{timestamp}] [{level}]"
    text = f"{prefix} {message}"
    if output is not None:
        output.append(text)  # 收集到列表
    else:
        print(text)          # 打印到控制台
    return text
```

#### 2.4.3 模式三：级联默认值

一个参数的默认值依赖于另一个参数的值：

```python
def build_url(protocol="https", host="localhost", port=None, path="/"):
    """port 的默认值取决于 protocol——级联默认"""
    if port is None:
        port = 443 if protocol == "https" else 80
    return f"{protocol}://{host}:{port}{path}"


print(build_url())                              # https://localhost:443/
print(build_url(protocol="http"))               # http://localhost:80/
print(build_url(host="api.com", port=8080))     # https://api.com:8080/
```

### 2.5 默认参数值的适用场景

```text
场景分析
  ↑
  │  函数需要向后兼容地新增参数
  │     → 新参数必须带默认值，否则破坏已有调用
  │
  │  参数有明确的"最常见值"（如编码=utf-8、超时=30）
  │     → 设为默认值，大幅减少调用时的样板代码
  │
  │  参数是可选配置，用户大多数时候不关心
  │     → 设为默认值，保持简单调用路径
  │
  │  参数没有合理的"最常见值"，每个调用都不同
  │     → 不要设默认值，强制用户每次都要明确传
  │
  └────────────────────────→ 参数特征
```

---

## 3. 最佳实践

### 3.1 推荐 vs 不推荐写法对比

#### 3.1.1 默认值选最常用值而非"安全值"

**不推荐**：默认值选了"最安全的"，但用户每次都要改

```python
# 日志级别默认 DEBUG——但生产环境 90% 用 INFO
def log(msg, level="DEBUG"):
    ...

# 每次调用都要覆盖
log("启动完成", level="INFO")     # 烦
log("数据库连接", level="INFO")   # 烦
```

**推荐**：默认值选"最常见的"

```python
def log(msg, level="INFO"):    # 默认 INFO——大多数场景直接写 log(...)
    ...
```

**原因**：默认值的目标是**减少调用代码的噪音**。如果默认值需要被频繁覆盖，就失去了设置默认值的意义。

#### 3.1.2 可变默认值用 None 哨兵替代

**不推荐**：

```python
def add_to_group(user, group=[]):
    group.append(user)
    return group
```

**推荐**：

```python
def add_to_group(user, group=None):
    if group is None:
        group = []
    group.append(user)
    return group
```

#### 3.1.3 新增参数统一加在末尾并给默认值

**不推荐**：新增参数插在中间，破坏已有位置调用

```python
# v1: def search(query, limit=10)
# v2: def search(query, offset=0, limit=10)  # ← 所有 search("x", 20) 含义变了！
```

**推荐**：新增参数加在末尾 + 给默认值 = 零破坏性

```python
# v1: def search(query, limit=10)
# v2: def search(query, limit=10, offset=0)  # ← 已有调用不受影响
```

### 3.2 常见错误模式及修正

**错误一：默认值用了函数调用结果，期望每次调用都重新计算**

```python
# ❌ 期望：每次调用 show_time() 返回当前时间
from datetime import datetime
def show_time(now=datetime.now()):
    return now

# 第一次、第二次、第 N 次调用——返回的都是同一个时间！
print(show_time())  # 2026-09-22 12:00:00
import time; time.sleep(2)
print(show_time())  # 还是 2026-09-22 12:00:00——不是当前时间！
```

修正：

```python
# ✅ 正确：用 None 哨兵，在函数体内计算
def show_time(now=None):
    if now is None:
        now = datetime.now()
    return now
```

**为什么这是个高频错误**：很多人把函数签名中的 `datetime.now()` 理解成"每次调用时执行"，但实际上它只在定义时执行了一次。记忆的关键：**`def` 语句中的默认值表达式只在 `def` 被执行时计算。**

**错误二：传 None 时以为"相当于不传"**

```python
def fetch_data(url, timeout=30):
    ratio = timeout / 1000  # 如果 timeout 是 None，TypeError！
    ...

# 调用者可能这样写：
fetch_data("https://api.com", None)  # 以为等同于不传 timeout
```

修正：如果业务上 `None` 等同于"使用默认值"，在函数体内做转换：

```python
def fetch_data(url, timeout=30):
    if timeout is None:
        timeout = 30
    ...
```

**错误三：所有参数都加默认值**

```python
# ❌ 过度设计："localhost" 作为 host 的默认值几乎一定不对
def connect(host="localhost", port=8080, user="admin", password=""):
    ...
```

修正：只有那些有"明确的、真正常见的默认行为"的参数才给默认值。判断标准：**80% 的调用场景不需要传这个参数，才值得设默认值。**

**错误四：默认值表达式包含可变状态的外部依赖**

```python
# ❌ 如果 SOME_CONFIG 在定义后改变了，默认值不会跟着变
SOME_CONFIG = {"timeout": 30}

def fetch(url, config=SOME_CONFIG):  # 默认值在定义时"固化"了
    ...

# 后来改了 SOME_CONFIG
SOME_CONFIG["timeout"] = 60

# 但 fetch 的默认值还是旧的！
# 因为 config 的默认值是在 def 时捕获的 SOME_CONFIG 引用
```

修正：这种情况用 None 哨兵并在函数体内读取最新值：

```python
def fetch(url, config=None):
    if config is None:
        config = SOME_CONFIG  # 每次都读当前值
    ...
```

**错误五：默认值表达式有副作用**

```python
# ❌ file=open("log.txt") 在定义时就打开了文件——即使从来没调用过这个函数
def log(msg, file=open("log.txt", "a")):  # 恶意设计
    file.write(msg + "\n")
```

修正：副作用操作放到函数体内。

### 3.3 默认参数值设计检查清单

1. **参数有"最常见值"吗？** → 有就设为默认值；没有就保持必选
2. **默认值是可变对象吗？** → 改为 `None` 哨兵模式
3. **默认值的语义对所有调用方都合理吗？** → 不合理的默认值比没有默认值更糟糕
4. **默认值会随时间变化吗？**（如当前时间、随机数）→ 改用 None 哨兵，函数体内计算
5. **新增的参数加在末尾了吗？** → 加默认值以保证向后兼容
6. **默认值表达式有副作用吗？**（文件 IO、网络请求）→ 移到函数体内

### 3.4 默认参数值的反模式

**反模式一："假默认值"——设定了一个几乎总要被覆盖的值**

```python
# 日志 99% 的时间不需要 debug 级别
def process(data, verbose=False):  # ← 这是个反模式
    if verbose:
        print("Processing:", data)
    # ...

# 每次调用：
process(user_data)              # 100 次中有 99 次不传 verbose
process(order_data, True)       # 只有 1 次需要 verbose
```

这种情况下，`verbose=False` 是有意义的默认值——因为绝大多数调用不需要它。真正的"假默认值"是这样的：

```python
def calculate(price, tax_rate=0.13):  # 如果税率因地区不同而频繁变化
    # 每个调用方都要覆盖 tax_rate——那不如不要默认值
    ...
```

**反模式二：默认值泄露实现细节**

```python
# ❌ 默认值暴露了内部存储结构
def get_users(cache_key="users:all:v3"):
    ...

# ✅ 更好的方式——默认值隐藏实现细节
def get_users(cache_key=None):
    if cache_key is None:
        cache_key = "users:all"  # 内部决定
    ...
```

---

## 4. 原理

### 4.1 默认值存储在函数对象的 `__defaults__` 属性中

Python 将默认参数值存储在函数对象的 `__defaults__` 属性（一个元组）中：

```python
def connect(host, port=3306, user="root", charset="utf8mb4"):
    pass

print(connect.__defaults__)
# 输出：(3306, 'root', 'utf8mb4')
```

`__defaults__` 中的值与形参列表中从右向左的默认参数一一对应。每当调用时不传某个有默认值的参数，Python 就从 `__defaults__` 中取出对应的默认值。

可以证明"默认值只创建一次"的机制：

```python
def demo(a=[]):
    return a

print(demo.__defaults__)            # ([],)
demo().__defaults__[0].append(42)   # 通过 __defaults__ 修改了默认列表
print(demo())                       # [42] ← 通过外部修改 __defaults__ 影响了函数调用！
```

这段代码展示了两个事实：`__defaults__` 直接持有默认值对象，它不是副本；修改 `__defaults__` 会影响后续所有不传参的调用。

### 4.2 仅关键字参数的默认值：`__kwdefaults__`

如果函数有仅关键字参数（`*` 之后的参数）并带了默认值，它们存储在 `__kwdefaults__`（一个字典）中：

```python
def register(name, *, role="user", active=True):
    pass

print(register.__kwdefaults__)
# 输出：{'role': 'user', 'active': True}
```

| 属性 | 存储内容 | 类型 |
|------|---------|------|
| `__defaults__` | 普通位置/关键字参数的默认值 | tuple |
| `__kwdefaults__` | 仅关键字参数的默认值 | dict |

### 4.3 调用时的默认值填充流程

```text
调用 connect("db.example.com", user="admin")
  ↓
1. 处理位置实参："db.example.com" → host
2. 处理关键字实参：user="admin" → user
3. 检查未绑定的形参：port=None, charset=None（尚未有值）
4. 从 __defaults__ 中取出默认值：
   port=3306, charset="utf8mb4"
5. 检查所有必选形参都有值 → 是
6. 进入函数体执行，port=3306, charset="utf8mb4"
```

关键点在于步骤 4：**默认值在调用时才从 `__defaults__` 取出并绑定**，不是定义时就绑定到形参上。形参和默认值之间的关联是惰性的——只有调用时没有实参提供时才触发。

---

## 5. 总结

本文围绕 Python 默认参数值展开，主要介绍了以下内容：

- 默认参数值让形参在调用者不传值时使用预先设定的值，"设置一次，简化多数调用"
- 默认值的核心机制：**定义时求值，只求值一次**，所有调用共享同一个默认值对象
- 不可变默认值（int、str、tuple、None）安全，可变默认值（list、dict、set）存在共享陷阱
- `None` 哨兵模式是最常用的设计模式，用于实现"未传时动态计算"的行为；当 None 是有效值时使用自定义哨兵对象
- 四种设计模式：合理默认行为、参数作为覆盖开关、级联默认值、向后兼容新增参数
- 最佳实践：默认值选最常见值、可变默认值转 None 哨兵、新参数加末尾、不滥用默认值
- 底层：`__defaults__`（元组）和 `__kwdefaults__`（字典）分别存储普通默认值和仅关键字默认值