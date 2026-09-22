---
group:
  title: 【12】函数参数介绍
  order: 12
order: 5
title: 可变默认参数陷阱
nav:
  title: Python基础
  order: 1
---

# 可变默认参数陷阱

## 1. 介绍

### 1.1 什么是可变默认参数陷阱

在 Python 中，如果你把**可变对象**（如 `[]`、`{}`、`set()`）作为函数参数的默认值，会触发一个著名的陷阱——所有不传该参数的调用，将**共享同一个可变对象**。每次调用修改这个对象，修改会累积到下一次调用中。

```python
def add_item(item, items=[]):
    items.append(item)
    return items


print(add_item("a"))  # ['a']
print(add_item("b"))  # ['a', 'b'] ← 不是 ['b']！
print(add_item("c"))  # ['a', 'b', 'c'] ← 持续累积！
```

运行结果：

```text
['a']
['a', 'b']
['a', 'b', 'c']
```

期望行为是每次调用得到独立的列表，但实际上所有调用在往**同一个**列表里追加。这是 Python 中最经典的面向初学者的陷阱之一，也是代码审查中几乎一定会被指出的问题。

### 1.2 在 Python 知识体系中的位置

这个陷阱是"默认参数值在定义时求值"这一机制的必然推论。理解它需要连接两个知识点：

- **默认参数值的求值时机**：默认值表达式在 `def` 语句执行时计算，只计算一次
- **可变对象引用传递**：函数拿到的是对象的引用，对内容的修改在原对象上发生

两者的组合就是陷阱的根因：默认值对象只创建一次 + 可变对象的内容可以被修改 = 所有调用共享同一个可变状态。

### 1.3 陷阱不仅限于 list

`list` 是最常见的案例，但同样的陷阱适用于**所有**可变类型：

```python
def build_config(key, value, config={}):
    config[key] = value
    return config


def add_tag(tag, tags=set()):
    tags.add(tag)
    return tags
```

`dict`、`set`、甚至自定义类的实例——任何内容可被修改的对象作为默认值时，都会触发同样的共享状态问题。

---

## 2. 核心内容

### 2.1 陷阱的完整演示

用一个完整的示例展示陷阱从"看起来正常"到"明显错误"的过程：

```python
def append_to_log(entry, log=[]):
    """将条目追加到日志列表"""
    log.append(entry)
    return log


# 阶段一：第一次调用——看起来正常
result1 = append_to_log("系统启动")
print(f"第 1 次：{result1}")  # ['系统启动']

# 阶段二：第二次调用——开始不对劲
result2 = append_to_log("加载配置")
print(f"第 2 次：{result2}")  # ['系统启动', '加载配置'] ← 上一次的数据还在！

# 阶段三：第三次调用——显然错误
result3 = append_to_log("初始化数据库")
print(f"第 3 次：{result3}")  # ['系统启动', '加载配置', '初始化数据库']

# 阶段四：所有引用指向同一对象
print(f"\n三次返回的是同一个对象：{result1 is result2 is result3}")  # True
```

运行结果：

```text
第 1 次：['系统启动']
第 2 次：['系统启动', '加载配置']
第 3 次：['系统启动', '加载配置', '初始化数据库']

三次返回的是同一个对象：True
```

如果三次调用是三个独立用户的操作，第二个用户就会看到第一个用户的日志条目——这在任何多用户场景下都是不可接受的 bug。

**陷阱同样适用于 dict 和 set**：

```python
def set_config(key, value, config={}):
    config[key] = value
    return config

print(set_config("host", "localhost"))  # {'host': 'localhost'}
print(set_config("port", 8080))        # {'host': 'localhost', 'port': 8080}
# 第二次调用看到了第一次设置的 host——不符合预期
```

```python
def collect_tags(tag, tags=set()):
    tags.add(tag)
    return tags

print(collect_tags("python"))   # {'python'}
print(collect_tags("coding"))   # {'python', 'coding'}
# 集合也在不断膨胀
```

### 2.2 陷阱的根因

这个陷阱的根因可以拆解为两个层次的机制。

#### 2.2.1 直接原因：默认值在定义时创建且只创建一次

Python 在执行 `def` 语句时，对每个默认值表达式求值，并将求值结果存储在函数对象的 `__defaults__` 属性中。后续每次调用，如果不传该参数，直接从 `__defaults__` 中取出同一个对象。

```python
def demo(items=[]):
    return items

# 查看默认值对象
print(demo.__defaults__)  # ([],)

# 调用一次，向默认列表追加
demo().append(42)

# 再次查看——默认值被修改了！
print(demo.__defaults__)  # ([42],)
```

`__defaults__` 直接持有默认值对象的引用，不是副本。任何对这个对象的修改都会反映到后续所有不传参的调用中。

#### 2.2.2 根本原因：默认值对象可变 + 通过引用修改内容

不可变默认值（`int`、`str`、`tuple`）不会触发这个陷阱——不是求值机制不同，而是无法在原对象上修改内容：

```python
def add_suffix(text, suffix=".txt"):
    text = text + suffix   # 字符串拼接创建新对象，不修改原 ".txt"
    return text

# 多次调用完全独立
print(add_suffix("readme"))   # readme.txt
print(add_suffix("data"))     # data.txt
```

`suffix` 虽然也是默认值对象，但字符串是不可变的——`text + suffix` 创建的是新字符串，原默认值 `".txt"` 毫发无伤。

对比可变对象：

```python
def add_item(items=[]):
    items.append(42)  # 在原列表对象上追加——修改了 __defaults__ 中的对象
    return items
```

`items.append(42)` 不创建新列表，而是在默认值对象上原地操作。这就是陷阱的根源：**不是"多次调用"有问题，而是"修改操作在原对象上进行"**。

**用 id 验证共享同一对象**：

```python
def add_item(items=[]):
    items.append(len(items))
    return items


r1 = add_item()
r2 = add_item()
r3 = add_item()

print(f"三次返回是同一对象：{r1 is r2 is r3}")  # True
print(f"id 全部相同：{id(r1)} == {id(r2)} == {id(r3)}")
```

`is` 判断为 `True` 意味着 `r1`、`r2`、`r3` 指向内存中的**同一个列表**。三次"独立"调用返回的是同一个对象的引用。

**对比不可变默认值的行为**：

```python
def inc(value, step=1):
    """step 是不可变的 int——不会共享状态"""
    return value + step


print(inc(10))       # 11
print(inc(10, 5))    # 15
print(inc(10))       # 11 —— 每次行为一致，不受前次调用影响
```

`step=1` 中的 `1` 是整数，不可变——它永远不会被"修改"，也没有"追加"这种操作。所以不可变默认值完全不受这个陷阱的影响。

#### 2.2.3 传了参数就不会触发陷阱

陷阱只在"使用默认值"时触发——如果调用者显式传了参数，默认值不被使用，问题就不出现：

```python
def add_item(items=[]):
    items.append("x")
    return items


print(add_item())          # ['x']——使用默认值
print(add_item())          # ['x', 'x']——还在用同一个默认值
print(add_item([1, 2]))   # [1, 2, 'x']——用户传了新列表，和默认值无关
print(add_item())          # ['x', 'x', 'x']——又回到共享的默认值
```

这解释了为什么有些函数间歇性地表现出异常行为——因为有些调用路径传了参数（正常），有些用了默认值（累积状态）。

### 2.3 正确的修正方式

#### 2.3.1 标准修正：None 哨兵模式

```python
def add_item(item, items=None):
    if items is None:
        items = []    # 每次调用都创建全新的列表
    items.append(item)
    return items


print(add_item("a"))  # ['a']
print(add_item("b"))  # ['b']——每次都是新列表
print(add_item("c"))  # ['c']
```

`None` 是不可变对象，作为默认值绝对安全。函数体内的 `if items is None` 检查确保每次"没传参"时都创建一个全新的列表。

**None 哨兵模式的核心逻辑**：

```text
调用 add_item("a")
  ↓
1. 检查：实参中有 items 吗？→ 没有
2. 从 __defaults__ 中取出默认值 → None
3. 将 None 绑定到形参 items
4. 进入函数体 → items 是 None → 新建 []
5. [] 是这次调用独有的新对象
  ↓
调用 add_item("b")
  ↓
1. 检查：实参中有 items 吗？→ 没有
2. 从 __defaults__ 中取出默认值 → None（None 不会被修改，永远安全）
3. 将 None 绑定到形参 items
4. 进入函数体 → items 是 None → 再次新建 []
5. 这一次的 [] 和上一次的 [] 是两个完全不同的对象
```

关键在于步骤 2：`None` 作为默认值是无法被修改的，所以无论调用多少次，`__defaults__` 中的 `None` 始终是同一个 `None`。而每次在函数体内新创建的列表是独立的。

同样适用于 dict 和 set：

```python
def build_config(key, value, config=None):
    if config is None:
        config = {}
    config[key] = value
    return config
```

```python
def add_tag(tag, tags=None):
    if tags is None:
        tags = set()
    tags.add(tag)
    return tags
```

#### 2.3.2 为什么 `items = items or []` 是错误写法

一些 Python 代码中使用 `or` 运算符来实现类似效果，但它有一个微妙的 bug：

```python
def add_items(items=None):
    items = items or []  # ⚠️ 有坑！
    items.append("data")
    return items


print(add_items())      # ['data'] ✅  —— None or [] → []
print(add_items([]))    # ['data'] ⚠️  —— [] or [] → []，用户传入的空列表被丢弃了！
```

问题出在 Python 的真值判断上：空列表 `[]`、空字典 `{}`、空集合 `set()` 在被当作布尔值使用时都是 `False`。所以 `[] or []` 会取第二个 `[]`（新创建的），而不是保留用户传入的空列表。

**`if items is None` 和 `items = items or []` 的行为差异**：

| 调用方式 | `if items is None` | `items or []` |
|---------|-------------------|----------------|
| `add_items()` | items = []（新建） | items = []（新建） |
| `add_items(None)` | items = []（新建） | items = []（新建） |
| `add_items([])` | items = []（保留传入的空列表） | items = []（丢弃传入的，重建） |
| `add_items([1,2])` | items = [1,2]（保留） | items = [1,2]（保留） |
| `add_items({})` | items = {}（保留） | items = {}（...等等，这是 dict 不是 list） |

**始终使用 `if items is None` 而不是 `items = items or []`**——这是唯一能精确区分"调用者没传参数"和"调用者传了一个空容器"的写法。

#### 2.3.3 当有意利用共享默认值——必须文档化

有少数场景下，共享可变默认值是有意为之的设计——最典型的是**函数级别缓存**：

```python
def fibonacci_memo(n, memo={0: 0, 1: 1}):
    """计算斐波那契数——memo 利用共享默认值做缓存

    注意：memo 默认值在所有调用间共享，这是有意为之的缓存设计。
    """
    if n not in memo:
        memo[n] = fibonacci_memo(n - 1, memo) + fibonacci_memo(n - 2, memo)
    return memo[n]


print(fibonacci_memo(10))  # 55
print(fibonacci_memo(20))  # 6765——利用了上次调用累积的缓存
```

这种情况合法但有两个前提：
1. **文档字符串中明确说明了共享行为**——让调用者知道这不是 bug
2. **调用者不需要每次得到独立状态**——缓存场景恰好需要共享

如果没有这两个前提，共享可变默认值就是 bug。大多数生产代码中，这种模式已经被 `functools.lru_cache` 装饰器替代：

```python
from functools import lru_cache

@lru_cache(maxsize=None)
def fibonacci(n):
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)
```

`lru_cache` 是 Python 官方提供的缓存方案，比手动用可变默认值做缓存更清晰、更可靠。

### 2.4 陷阱适用的完整类型列表

| 默认值类型 | 会触发陷阱？ | 示例 | 原因 |
|-----------|------------|------|------|
| `list` | ✅ 是 | `items=[]` | 可变，支持 `append` |
| `dict` | ✅ 是 | `config={}` | 可变，支持 `config[key]=v` |
| `set` | ✅ 是 | `tags=set()` | 可变，支持 `add` |
| `bytearray` | ✅ 是 | `buf=bytearray()` | 可变 |
| 自定义类实例 | ✅ 是 | `logger=Logger()` | 取决于类的实现 |
| `int`, `float` | ❌ 否 | `timeout=30` | 不可变 |
| `str` | ❌ 否 | `name=""` | 不可变 |
| `tuple` | ❌ 否 | `coords=(0, 0)` | 不可变 |
| `frozenset` | ❌ 否 | `tags=frozenset()` | 不可变 |
| `None` | ❌ 否 | `data=None` | 不可变，推荐哨兵值 |
| `bool` | ❌ 否 | `verbose=False` | 不可变 |

---

## 3. 实践示例

### 3.1 常见陷阱场景及修正

**场景一：任务队列的默认列表**

```python
# ❌ 陷阱版
def enqueue_task(task, queue=[]):
    queue.append(task)
    return queue


# 模拟一个 Web 服务器处理多个请求
print(enqueue_task("请求A：创建用户"))   # ['请求A']
print(enqueue_task("请求B：更新订单"))   # ['请求A', '请求B'] ← 请求A 的数据泄露到了 请求B！
```

多次独立的任务入队操作最终会堆积在同一个队列中——第一个任务的队列里出现了第三个任务的数据。在多用户/多请求环境中，这就是数据泄露。

```python
# ✅ 修正版
def enqueue_task(task, queue=None):
    if queue is None:
        queue = []
    queue.append(task)
    return queue
```

**场景二：API 响应的默认字典累积**

```python
# ❌ 陷阱版——模拟 API 聚合数据
def add_response_field(key, value, response={}):
    """构建 API 响应——默认 response 被所有调用共享"""
    response[key] = value
    return response


# 模拟两次独立 API 调用
api_response_1 = add_response_field("user", "Alice")
api_response_2 = add_response_field("product", "Laptop")

# 第二次调用看到了第一次的数据！
print(f"响应1：{api_response_1}")
print(f"响应2：{api_response_2}")
# 响应1：{'user': 'Alice', 'product': 'Laptop'}
# 响应2：{'user': 'Alice', 'product': 'Laptop'}
# 两次"独立"调用拿到了完全相同的数据——这是严重的 bug
```

**场景三：日志收集器的共享状态**

```python
# ❌ 陷阱版
def collect_logs(entry, logs=[]):
    logs.append(f"[INFO] {entry}")
    return logs


# 模拟三个不同的模块记录日志
module_a_logs = collect_logs("模块A 初始化")
module_b_logs = collect_logs("模块B 初始化")
module_c_logs = collect_logs("模块C 初始化")

print(f"模块A 的日志：{module_a_logs}")  # 不是 ['模块A 初始化']！
print(f"模块B 的日志：{module_b_logs}")
print(f"模块C 的日志：{module_c_logs}")
# 三个模块的日志完全相同——所有条目都混在了一起

# ✅ 修正版
def collect_logs(entry, logs=None):
    if logs is None:
        logs = []
    logs.append(f"[INFO] {entry}")
    return logs
```

### 3.2 静态检查工具的检测

Python 社区的主流静态检查工具都会自动检测这个陷阱：

| 工具 | 规则编号 | 检测内容 |
|------|---------|---------|
| Pylint | `W0102` | dangerous-default-value |
| Ruff | `B006` | mutable-argument-default |
| flake8-bugbear | `B006` | 同上 |

这些工具会在 `def func(param=[])` 或 `def func(param={})` 上直接划线警告。

用代码自查的方法：

```python
def check_default_value(func):
    """检查函数默认值中是否包含可变对象"""
    defaults = func.__defaults__
    if defaults is None:
        return "无默认值"

    mutable_types = (list, dict, set, bytearray)
    for i, val in enumerate(defaults):
        if isinstance(val, mutable_types):
            return (f"⚠️ {func.__name__} 的第 {i+1} 个默认值是 "
                    f"{type(val).__name__}，可能是陷阱！")

    return f"✅ {func.__name__} 的默认值都是安全的"
```

### 3.3 当函数很多参数且需要可变默认值时——改用类

如果一个函数需要维护可变状态（如事件监听器表、配置字典），且这恰好是默认值陷阱的触发场景，说明**这个函数可能需要变成一个类**：

```python
# ❌ 函数版：handlers 字典被所有调用共享
def register_handler(event_type, handler, handlers={}):
    if event_type not in handlers:
        handlers[event_type] = []
    handlers[event_type].append(handler)
    return handlers


# ✅ 类版：每个实例有自己的 handlers
class EventBus:
    def __init__(self):
        self.handlers = {}

    def register(self, event_type, handler):
        if event_type not in self.handlers:
            self.handlers[event_type] = []
        self.handlers[event_type].append(handler)


bus1 = EventBus()
bus2 = EventBus()
bus1.register("click", "handler_a")
bus2.register("click", "handler_b")
# bus1 和 bus2 的 handlers 互不影响
```

**判断规则**：如果你需要可变默认值来"在多次调用之间保持状态"，你需要的其实是类的实例属性——而不是函数默认参数。

---

## 4. 常见误区与边界

**误区一：只有 `list` 才会触发这个陷阱**

任何可变对象都会触发，包括 `dict`、`set`、`bytearray` 和自定义类的可变实例。检查方法是看这个类型的实例方法是否会修改自身内容（`append`、`add`、`update`、`__setitem__` 等）。

**误区二：传了参数就不会有任何问题**

传了参数时默认值确实不会被使用——但传入的可变对象仍然会被修改（因为传的是引用）：

```python
def process(data=[]):
    data.append("processed")
    return data


original = ["item1"]
result = process(original)
print(original)  # ['item1', 'processed'] ← 传入的列表也被改了！
```

这与默认值陷阱是不同的机制——这里是"通过引用修改了调用者传入的对象"，属于参数传递机制范畴。

**误区三：`items = items or []` 等价于 `if items is None`**

不等价。`or` 会把空列表、空字典等"假值"误判为"未传"。正确的做法始终是用 `is None`。

**误区四：IDE 警告了但没看懂，忽略就好**

可变默认值问题在生产环境中可能导致**数据泄露**（一个用户的请求影响另一个用户的结果），不是"代码风格建议"而是**正确性 bug**。永远不应该忽略这个警告。

**误区五：默认值设为 `tuple` 就可以有"默认列表"的效果**

`tuple` 是不可变对象，作为默认值不会触发共享状态问题——但你也无法向它追加元素。如果你需要"默认值是可以追加的列表"，正确的做法仍然是 None 哨兵模式。

**误区六：只有自己定义的函数才会踩这个坑**

标准库和第三方库的函数同样受此影响——只要它使用了可变默认值。好在主流库通常都会避免这个陷阱。你需要注意的不仅是自己的代码，还包括你在使用的库函数是否意外暴露了共享状态。

**误区七：函数不返回默认值对象就安全了**

即使函数不返回默认值，只要在函数内部修改了它，修改就会持久化：

```python
def process_tasks(tasks=[]):
    """处理完就清空——即使不返回，修改也已持久化"""
    while tasks:
        task = tasks.pop()
        print(f"处理：{task}")

process_tasks()  # 什么都不做，但默认列表是空的
tasks = process_tasks.__defaults__[0]
tasks.append("task1")
tasks.append("task2")
process_tasks()  # 处理：task2 → task1（两次 pop）

# 第二次调用仍在使用被修改过的默认列表
tasks.append("task3")
process_tasks()  # 处理：task3

print(f"默认列表剩余：{process_tasks.__defaults__[0]}")
```

依赖外部状态配合的函数极难调试——因为 bug 的触发条件取决于调用历史。

**陷阱的本质总结——三要素缺一不可**

```text
可变默认参数陷阱 = 
    默认值只在 def 时创建（求值时机）
    × 通过引用修改对象内容（原地操作）
    × 后续调用复用同一默认值（共享状态）

去掉任意一个要素，陷阱就不成立：
  - 不可变默认值 → 内容无法修改 → 无累积效果
  - 每次调用创建新对象（None 哨兵）→ 不共享 → 无累积
  - 永远传参（不用默认值）→ 不经过 __defaults__ → 无累积
```

将这个三要素公式印在脑海里，你就能在任何变体中快速识别这个陷阱。

---

## 5. 总结

本文围绕 Python 可变默认参数陷阱展开，主要介绍了以下内容：

- 可变对象（list、dict、set 等）作为默认值时，所有不传参的调用共享同一个对象，修改会累积
- 陷阱根因：默认值在 `def` 时求值一次 + 可变对象内容可被原地修改
- 不可变默认值（int、str、tuple）不受此影响——不是机制不同，而是内容无法被修改
- 标准修正方案：用 `None` 作为默认值，函数体内检查 `if param is None` 后创建新对象
- 避免用 `items = items or []` 写法，它会把空值也误判为"未传"
- 少数刻意利用共享默认值的场景（如函数缓存）需要明确文档说明
- pylint（W0102）、ruff/flake8-bugbear（B006）等静态检查工具可自动检测此陷阱