---
group:
  title: 【02】基础数据类型和类型系统
  order: 2
order: 6
title: None类型详解
nav:
  title: Python基础
  order: 1
---

# None类型详解

## 1. 介绍

### 1.1 什么是 None

在 Python 中，`None` 是一个特殊的常量，表示"没有值"或"空"。它是 `NoneType` 类的唯一实例——整个 Python 进程中只有一个 `None` 对象，所有引用 `None` 的变量都指向同一个内存地址。

你可以把 `None` 理解为"空座位"的标签：一个座位上贴着 `None`，不是因为这个座位上放了什么特殊的东西，而是明确表示"这个位置是空的，没有人坐"。这与 `0`（零分）、`""`（空字符串）、`[]`（空列表）不同——后者都是有具体类型的"空内容"，而 `None` 是"压根没有内容"。

在 Python 的类型体系中，`None` 的定位如下：

```text
Python 内置类型
├── 数值类型：int, float, complex
├── 序列类型：str, list, tuple
├── 映射类型：dict
├── 集合类型：set, frozenset
├── 布尔类型：bool
└── NoneType：None（唯一实例）
```

`None` 不属于任何常规类型分类（不是数值，不是序列，不是映射），它自成一类。

### 1.2 最简示例

```python
x = None
print(x)               # None
print(type(x))         # <class 'NoneType'>
print(x is None)       # True
```

运行结果：

```text
None
<class 'NoneType'>
True
```

这段代码展示了 `None` 的三个核心特征：打印出来就是 `None`、类型是 `NoneType`、用 `is None` 可以判断一个变量是否为 `None`。

## 2. 核心内容

### 2.1 None 的单例本质与身份判断

#### 2.1.1 None 是全局唯一单例

`None` 在 Python 进程中只有一个实例。无论你在哪里、用什么方式得到 `None`，都是同一个对象：

```python
a = None
b = None
c = (lambda: None)()  # 函数返回 None

print(a is b)          # True —— 同一个对象
print(a is b is c)     # True —— 全是同一对象
print(id(a) == id(b))  # True —— 同一内存地址
print(a == b)          # True —— 值也相等
```

运行结果：

```text
True
True
True
True
```

`is` 运算符比较的是两个对象的内存地址（身份），`==` 比较的是值是否相等。对于 `None` 来说，因为只有一个实例，所以 `is` 和 `==` 的结果都是 `True`。但判断 `None` 时应该始终使用 `is`，下面会解释原因。

#### 2.1.2 判 None 必须用 is，不用 ==

Python 官方风格指南（PEP 8）明确要求：**判断一个变量是否为 `None`，必须用 `is None` 或 `is not None`，不要用 `== None`**。

```python
x = None

# 推荐写法
print(x is None)       # True
print(x is not None)   # False

# 不推荐写法
# print(x == None)     # 能得到 True，但不可靠
```

为什么 `== None` 不可靠？因为 `==` 运算调用的是对象的 `__eq__` 方法，而 `__eq__` 可以被自定义类改写，从而"欺骗" `==` 判断：

```python
class AlwaysEqual:
    """一个与任何值都"相等"的类"""
    def __eq__(self, other):
        return True

obj = AlwaysEqual()
print(obj == None)     # True! —— 误判，obj 根本不是 None
print(obj is None)     # False —— is 不受 __eq__ 影响，可靠
```

运行结果：

```text
True
False
```

`obj` 显然不是 `None`，但 `obj == None` 却返回 `True`，因为 `AlwaysEqual` 的 `__eq__` 总是返回 `True`。而 `is` 比较的是内存地址，不受 `__eq__` 影响，永远可靠。

#### 2.1.3 NoneType 没有公开名称

Python 中没有直接可用的 `NoneType` 名字，你需要手动获取它：

```python
NoneType = type(None)           # 手动绑定名字
print(NoneType)                 # <class 'NoneType'>
print(isinstance(None, NoneType))  # True
```

运行结果：

```text
<class 'NoneType'>
True
```

日常编程中不需要用 `isinstance(x, NoneType)` 来判断 `None`，直接用 `x is None` 即可。`isinstance` 更笨重且性能更低。

#### 2.1.4 None 不支持常规操作

`None` 是"无值"标记，不能调用方法、不能索引、没有长度、不参与算术：

```python
x = None
# x.foo()    # AttributeError: 'NoneType' object has no attribute 'foo'
# x[0]       # TypeError: 'NoneType' object is not subscriptable
# len(x)     # TypeError: object of type 'NoneType' has no len()
# x + 1      # TypeError: unsupported operand type(s) for +: 'NoneType' and 'int'
```

这些操作都会抛出异常。`None` 继承了 `object` 的基础方法，但自身只覆写了 `__bool__`（返回 `False`）和 `__repr__`（返回 `'None'`）：

```python
print(None.__bool__())    # False
print(None.__repr__())   # 'None'
print(None.__class__)    # <class 'NoneType'>
```

运行结果：

```text
False
None
<class 'NoneType'>
```

### 2.2 None 的布尔行为与空值辨析

#### 2.2.1 None 在布尔语境中为假

在 `if`、`while`、`and`、`or` 等需要布尔值的语境中，`None` 被视为 `False`：

```python
print(bool(None))   # False

if None:
    print("不会执行")
else:
    print("None 为假")  # ← 走这里
```

运行结果：

```text
False
None 为假
```

#### 2.2.2 if not x 与 if x is None 的语义差异

这是一个极其重要的区分点，也是 Python 初学者最容易犯的错误之一。

- `if not x`：判断 x 是否为"假值"——`None`、`0`、`0.0`、`""`、`[]`、`{}`、`False` 都会触发
- `if x is None`：仅在 x 确实是 `None` 时才触发

```python
# 用不同的"假值"测试两种判断
test_values = [0, [], '', None]

for x in test_values:
    print(f"x = {repr(x):8} → not x: {not x},  x is None: {x is None}")
```

运行结果：

```text
x = 0        → not x: True,   x is None: False
x = []       → not x: True,   x is None: False
x = ''       → not x: True,   x is None: False
x = None     → not x: True,   x is None: True
```

可以看到，`not x` 对所有假值都返回 `True`，而 `x is None` 只对 `None` 返回 `True`。如果你只想判断"是否为 `None`"，就必须用 `is None`，否则会把 `0`、`""`、`[]` 这些合法值也当作 `None` 误处理。

#### 2.2.3 None 与空值的语义辨析

在实际业务中，`None` 和"空值"（如 `0`、`""`）有完全不同的含义：

| 场景 | None 的含义 | 空值的含义 | 示例 |
|------|------------|-----------|------|
| 考试分数 | `None`：未参加考试 | `0`：考了零分 | `score = None` vs `score = 0` |
| 用户昵称 | `None`：未设置昵称 | `""`：设置为空 | `name = None` vs `name = ""` |
| 搜索结果 | `None`：未搜索 | `[]`：搜了但没结果 | `result = None` vs `result = []` |
| 配置参数 | `None`：使用默认值 | `0`/`False`：用户设为零/关 | `timeout = None` vs `timeout = 0` |

一个实际的三态处理示例：

```python
def format_name(name):
    """处理用户昵称的三种状态"""
    if name is None:          # 未提供
        return "(未填写)"
    if name == "":            # 提供了空字符串
        return "(名字为空)"
    return name               # 有正常值

print(format_name(None))      # (未填写)
print(format_name(""))        # (名字为空)
print(format_name("Alice"))   # Alice
```

运行结果：

```text
(未填写)
(名字为空)
Alice
```

如果这里误用 `if not name` 来判断，那么 `None` 和 `""` 都会走进同一个分支，无法区分"未填写"和"名字为空"。

#### 2.2.4 假值类型对比

Python 中的假值各有不同的类型，理解它们的区别有助于避免误判：

```python
print(f"{'值':<10} {'类型':<12} {'bool()':<8}")
print("-" * 32)
falsy_values = [None, 0, 0.0, '', [], {}, False]
for v in falsy_values:
    print(f"{repr(v):<10} {type(v).__name__:<12} {bool(v):<8}")
```

运行结果：

```text
值         类型          bool()  
--------------------------------
None       NoneType     False   
0          int          False   
0.0        float        False   
''         str          False   
[]         list         False   
{}         dict         False   
False      bool         False   
```

这些值在布尔语境中都为 `False`，但它们的类型和含义完全不同。判断其中某一个具体类型时，不能用 `if not x` 一刀切。

### 2.3 函数返回值中的 None

#### 2.3.1 无 return 语句时返回 None

Python 函数如果没有 `return` 语句，或者 `return` 不带值，都会自动返回 `None`：

```python
def greet(name):
    print(f"Hello, {name}")

result = greet("Alice")
print(result)   # None —— 函数默认返回 None
```

运行结果：

```text
Hello, Alice
None
```

```python
def do_something():
    print("doing")
    return       # 等价于 return None

r = do_something()
print(r)         # None
```

运行结果：

```text
doing
None
```

你也可以显式写 `return None`，语义上更清晰地表达"这里就是返回空"：

```python
def not_found():
    return None  # 明确表达"这里返回空"

print(not_found())  # None
```

#### 2.3.2 就地修改方法返回 None

Python 中一个统一的设计约定：**就修修改原对象的方法返回 `None`**，而非返回修改后的对象。这是为了明确区分"就地修改"和"返回新对象"两种模式，避免调用者误以为原对象没被修改。

```python
# 就地修改 → 返回 None
data = [1, 2]
result = data.append(3)
print(result)   # None! 不是 [1, 2, 3]
print(data)     # [1, 2, 3] —— 原列表被改了

lst = [3, 1, 2]
result = lst.sort()
print(result)   # None
print(lst)      # [1, 2, 3]

# 对比：返回新对象 → 返回新列表
lst2 = [3, 1, 2]
result = sorted(lst2)
print(result)   # [1, 2, 3] —— 返回新列表
print(lst2)     # [3, 1, 2] —— 原列表不变
```

运行结果：

```text
None
[1, 2, 3]
None
[1, 2, 3]
[1, 2, 3]
[3, 1, 2]
```

常见的就地修改方法与对应的"返回新对象"版本对比：

| 就地修改（返回 None） | 返回新对象 | 说明 |
|---------------------|-----------|------|
| `list.append(x)` | `list + [x]` | 添加元素 |
| `list.sort()` | `sorted(list)` | 排序 |
| `list.reverse()` | `reversed(list)` | 反转 |
| `list.extend(iter)` | `list + list(iter)` | 扩展 |
| `dict.update(d)` | `dict | d`（3.9+） | 合并 |
| `set.add(x)` | `set | {x}` | 添加元素 |

初学者常犯的错误是把就地修改的返回值赋给变量，结果得到 `None`：

```python
# 错误写法
nums = [3, 1, 2]
nums = nums.sort()    # nums 变成了 None!
# print(nums[0])      # TypeError: 'NoneType' object is not subscriptable

# 正确写法
nums = [3, 1, 2]
nums.sort()           # 就地排序，不接收返回值
print(nums)            # [1, 2, 3]
```

#### 2.3.3 查找类函数返回 None 表示"未找到"

当一个函数需要返回查找结果，但没找到时，通常返回 `None` 表示"未找到"：

```python
def find_user(user_id):
    users = {1: "Alice", 2: "Bob"}
    if user_id in users:
        return users[user_id]
    return None  # 找不到返回 None

name = find_user(999)
if name is not None:   # 先判 None
    print(f"找到: {name}")
else:
    print("未找到")     # ← 走这里
```

运行结果：

```text
未找到
```

注意：如果 `find_user` 有可能返回假值（如空字符串），就必须用 `is not None` 而非 `if name` 来判断是否找到。

#### 2.3.4 对 None 操作的典型 bug

最常见的 `None` 相关 bug 是：拿到函数返回的 `None` 后直接当正常对象操作，导致 `TypeError`：

```python
def get_user(uid):
    if uid == 1:
        return {"name": "Alice"}
    return None

user = get_user(999)   # 返回 None（用户不存在）

# 错误：直接用 user["name"] → TypeError
# print(user["name"])  # TypeError: 'NoneType' object is not subscriptable

# 正确：先判 None
if user is not None:
    print(user["name"])
else:
    print("用户不存在")  # ← 走这里
```

运行结果：

```text
用户不存在
```

### 2.4 None 哨兵模式

#### 2.4.1 可变默认参数陷阱

Python 函数的默认参数在函数定义时只创建一次，后续所有调用共享同一个默认对象。对于可变对象（如 `list`、`dict`），这会导致"上次调用的数据残留到下次调用"的经典陷阱：

```python
def add_item_bad(item, target=[]):  # 默认 target 是同一个 list
    target.append(item)
    return target

print(add_item_bad(1))   # [1]
print(add_item_bad(2))   # [1, 2] —— 不是 [2]! 默认 list 被共享累积
```

运行结果：

```text
[1]
[1, 2]
```

第二次调用时，`target` 默认值仍然是第一次调用后已被修改的那个 `[1]`，所以 `append(2)` 后变成了 `[1, 2]`。

#### 2.4.2 用 None 哨兵修复

标准修复方案是用 `None` 作为默认值（哨兵），在函数内部判断后创建新对象：

```python
def add_item(item, target=None):
    if target is None:
        target = []    # 每次调用未传参时新建 list
    target.append(item)
    return target

print(add_item(1))       # [1]
print(add_item(2))       # [2] —— 正确! 每次 None 则新建
print(add_item(3, [9]))  # [9, 3] —— 传了则用传入的
```

运行结果：

```text
[1]
[2]
[9, 3]
```

这个模式适用于所有可变默认参数：`list`、`dict`、`set` 等。

#### 2.4.3 区分"未传参"与"传了假值"

`None` 哨兵的核心价值在于区分"用户没传参数"和"用户传了一个假值"。以 `timeout` 参数为例：

```python
def fetch(url, timeout=None):
    if timeout is None:   # 仅 None 触发（未传参 → 用默认 30）
        timeout = 30
    # 若用户传 timeout=0，这里 timeout=0，不会被替换
    print(f"超时: {timeout}s")

fetch("a.com")              # 超时: 30s（未传，用默认）
fetch("a.com", timeout=0)   # 超时: 0s（传了 0，0 是合法值，保留）
fetch("a.com", timeout=10)  # 超时: 10s
```

运行结果：

```text
超时: 30s
超时: 0s
超时: 10s
```

`timeout=0` 在某些场景下是合法值（表示"不等待"），如果用 `if not timeout` 来判断，`0` 会被当作"未传参"替换成 `30`，导致 bug：

```python
def fetch_bad(url, timeout=None):
    if not timeout:       # timeout 为 0/None/'' 都触发!
        timeout = 30      # 把合法的 0 也换成 30
    print(f"  bad: {timeout}s")

fetch_bad("a.com", timeout=0)  # bad: 30s —— 0 被吞了!
```

运行结果：

```text
  bad: 30s
```

#### 2.4.4 多参数哨兵

当一个函数有多个可选参数时，每个都需要独立的哨兵处理：

```python
def configure(host=None, port=None, debug=None):
    host = host or "localhost"   # None/'' 都用默认（host 无合法假值）
    if port is None:             # 仅 None 用默认（0 是合法端口，需保留）
        port = 8080
    if debug is None:            # 仅 None 用默认（False 是合法调试值）
        debug = False
    print(f"  {host}:{port} debug={debug}")

configure()                        # localhost:8080 debug=False
configure(port=0, debug=False)     # localhost:0 debug=False
```

运行结果：

```text
  localhost:8080 debug=False
  localhost:0 debug=False
```

注意这里对三个参数用了不同的默认值处理方式：`host` 用 `or`（因为空字符串不是合法 host），`port` 和 `debug` 用 `is None`（因为 `0` 和 `False` 是合法值）。选择哪种方式取决于参数是否有合法的假值。

#### 2.4.5 私有哨兵：区分"未传参"与"显式传 None"

有时候用户可能显式传入 `None` 作为参数值（表示"明确不用"），此时用 `None` 作哨兵就无法区分"未传参"和"传了 `None`"。解决方案是用一个私有对象作哨兵：

```python
_MISSING = object()  # 私有哨兵，唯一对象，用户不可能传入

def f(timeout=_MISSING):
    if timeout is _MISSING:   # 用私有哨兵判"是否未传"
        timeout = 30
    # f(None) 显式传 None 不会被当"未传"
    print(f"  timeout={timeout}")

f()         # 未传 → 用 30
f(None)     # 显式 None → 保留 None
f(10)       # 10
```

运行结果：

```text
  timeout=30
  timeout=None
  timeout=10
```

`object()` 创建一个全新的空对象，用户不可能碰巧传入同一个对象，因此 `is _MISSING` 可以精确区分"未传参"和"显式传了任何值（包括 `None`）"。

### 2.5 None 安全访问模式

当函数可能返回 `None`，而你又需要访问其属性或元素时，直接操作会导致 `TypeError`。以下是几种常见的 `None` 安全访问模式。

#### 2.5.1 模式一：先判 None 再访问

最直接的方式：拿到结果后先判断 `is not None`，再进行操作。

```python
def get_user(uid):
    if uid == 1:
        return {"name": "Alice", "email": "a@mail.com"}
    return None

user = get_user(999)
if user is not None:
    print(user["name"])
else:
    print("无用户")   # ← 走这里
```

运行结果：

```text
无用户
```

#### 2.5.2 模式二：用容器方法避免对 None 操作

`dict.get(key)` 在键不存在时返回 `None`（或指定默认值），不会抛异常：

```python
d = {"a": 1}
print(d.get("b"))      # None —— 键不存在，安全
print(d.get("b", 0))   # 0 —— 自定义默认值
```

运行结果：

```text
None
0
```

但要注意：如果 `dict` 本身可能是 `None`，仍然需要先判 `None`：

```python
config = None
# config.get("x")    # TypeError: NoneType 没有 get 方法

val = config.get("x") if config is not None else None
print(val)            # None
```

运行结果：

```text
None
```

#### 2.5.3 模式三：用 or 提供默认值

`or` 运算符会返回第一个真值，如果左边是 `None`（假值），就返回右边的默认值：

```python
name = None
name = name or "匿名"   # None → "匿名"
print(name)              # 匿名
```

运行结果：

```text
匿名
```

**注意**：`or` 会把所有假值（包括 `""`、`0`、`[]` 等）都替换为默认值。如果空字符串等是合法值不应该被替换，改用 `is None` 判断：

```python
name = ""
name = name if name is not None else "匿名"
print(name)   # 空串被保留，输出空行
```

运行结果：

```text

```

#### 2.5.4 模式四：and 短路链式访问

`and` 运算符在左边为假值时会短路返回左边的值。利用这个特性，可以在对象可能为 `None` 时不触发属性访问：

```python
obj = None
result = obj and obj.method()   # None 短路，不调 .method()
print(result)                   # None，安全
```

运行结果：

```text
None
```

**注意**：`and` 短路对所有假值生效，空容器也会被短路：

```python
empty_cfg = {}
val = empty_cfg and empty_cfg.get("key")  # {} 为假，短路返回 {}
print(val)                                # {} —— 不是 get 结果
```

运行结果：

```text
{}
```

因此 `and` 短路只适合"确认对象大概率是 `None` 或非空容器"的场景，不适合需要区分 `None` 和空容器的场景。

#### 2.5.5 模式五：封装 safe_get 模拟可选链

Python 3.10 之前没有 Haskell/JavaScript 那样的可选链操作符（`?.`），但可以通过封装一个工具函数来模拟链式安全访问：

```python
def safe_get(obj, *keys, default=None):
    """沿 keys 链取值，任一层为 None/不存在返回 default。"""
    for k in keys:
        if obj is None:
            return default
        if isinstance(obj, dict):
            obj = obj.get(k, default)
        else:
            obj = getattr(obj, k, default)
    return obj

user = {"profile": {"name": "Alice", "age": 30}}
print(safe_get(user, "profile", "name"))           # Alice
print(safe_get(user, "profile", "phone"))          # None —— 安全
print(safe_get(None, "profile"))                   # None —— 安全
print(safe_get(user, "profile", "age", default=0)) # 30
```

运行结果：

```text
Alice
None
None
30
```

`safe_get` 沿着 `keys` 路径逐层访问，任意一层为 `None` 或不存在就返回 `default`，不会抛异常。这在处理嵌套 JSON/API 响应时特别有用。

Python 3.10+ 可以使用 `match/case` 语法进行更优雅的 `None` 处理，但 `safe_get` 在所有版本都适用。

### 2.6 None 在数据结构中的应用

#### 2.6.1 链表终止节点

在链表等数据结构中，`None` 常被用作"终止标记"，表示"后面没有节点了"：

```python
class Node:
    def __init__(self, value, next=None):
        self.value = value
        self.next = next      # None 表链尾

head = Node(1, Node(2, Node(3, None)))  # 1→2→3→None(尾)

# 遍历链表
cur = head
values = []
while cur is not None:   # 遇 None 停止
    values.append(cur.value)
    cur = cur.next
print(values)            # [1, 2, 3]
```

运行结果：

```text
[1, 2, 3]
```

#### 2.6.2 二叉树空子节点

在二叉树中，`None` 表示"空子节点"（没有左子或右子），遍历时遇到 `None` 就返回：

```python
class TreeNode:
    def __init__(self, val, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

#       2
#      / \
#     1   3
root = TreeNode(2, TreeNode(1), TreeNode(3))

def traverse(node):
    if node is None:   # 空节点，返回
        return
    traverse(node.left)
    print(node.val, end=" ")
    traverse(node.right)

traverse(root)   # 1 2 3
```

运行结果：

```text
1 2 3
```

`TreeNode(1)` 没有传 `left` 和 `right`，它们默认是 `None`。遍历时遇到 `None` 就递归返回，不会继续往下走。

#### 2.6.3 占位与延迟赋值

`None` 常用于"先占位，后面再赋值"的模式——先声明一个变量为 `None`，在满足条件时才赋真实值：

```python
candidates = [85, 55, 92, 78, 60]
result = None   # 占位，先无值

for candidate in candidates:
    if candidate >= 90:
        result = candidate
        break

if result is not None:
    print(f"找到优秀分数: {result}")
else:
    print("未找到")
```

运行结果：

```text
找到优秀分数: 92
```

用 `None` 作初始值的好处是：循环结束后可以通过 `is not None` 精确判断"是否找到了"，而用 `0` 作初始值就无法区分"没找到"和"找到的值恰好是 0"。

#### 2.6.4 清空引用释放大对象

当一个大对象不再需要时，将变量设为 `None` 可以解除引用，让垃圾回收器尽快回收内存：

```python
big_data = [0] * 1000000      # 大对象
print(f"big_data 长度: {len(big_data)}")

big_data = None               # 解除引用，对象可被 GC 回收
print(f"big_data = {big_data}")
```

运行结果：

```text
big_data 长度: 1000000
big_data = None
```

注意：Python 的垃圾回收会自动管理内存，大多数情况下不需要手动设 `None`。但在处理特别大的对象、循环引用、或需要精确控制释放时机的场景中，手动设 `None` 仍有价值。

### 2.7 None 与 JSON 的映射

#### 2.7.1 Python None 与 JSON null 的双向转换

JSON 中没有 `None`，对应的值是 `null`。Python 的 `json` 模块会自动处理两者之间的转换：

```python
import json

# Python → JSON: None 变 null
data = {"name": "Alice", "age": None, "scores": [90, None]}
js = json.dumps(data)
print(js)   # {"name": "Alice", "age": null, "scores": [90, null]}

# JSON → Python: null 变 None
parsed = json.loads('{"name": "Bob", "age": null}')
print(parsed)                # {'name': 'Bob', 'age': None}
print(parsed["age"] is None) # True
```

运行结果：

```text
{"name": "Alice", "age": null, "scores": [90, null]}
{'name': 'Bob', 'age': None}
True
```

#### 2.7.2 字段缺失与字段值为 null 的三态处理

在处理 API 响应时，一个字段可能处于三种状态：

1. **有值**：字段存在且值不为 `null`
2. **值为 null**：字段存在但值为 `null`（JSON 中明确写了 `"city": null`）
3. **字段缺失**：JSON 中根本没有这个字段

这三种状态需要谨慎区分：

```python
# 字段值为 null
d1 = {"name": "Alice", "age": None}
# 字段缺失
d2 = {"name": "Alice"}

# 用 in 区分"字段存在"与"字段缺失"
print("age" in d1, d1.get("age"))   # True None（字段存在，值 None）
print("age" in d2, d2.get("age"))   # False None（字段缺失，get 返回 None）

# d["age"] 在字段缺失时抛 KeyError
try:
    d2["age"]
except KeyError:
    print("KeyError: age 字段缺失")

# .get 在缺失和 null 时都返回 None，无法区分
print(d1.get("age"))   # None（值是 null）
print(d2.get("age"))   # None（字段缺失）—— 同样 None，无法区分
```

运行结果：

```text
True None
False None
KeyError: age 字段缺失
None
None
```

**关键点**：`.get()` 在"字段值为 `null`"和"字段缺失"时都返回 `None`，如果需要区分这两种情况，必须先用 `in` 运算符判断字段是否存在。

一个完整的 JSON 三态处理示例：

```python
api_response = {"name": "Alice", "age": 30, "city": None}
# name: 有值
# age: 有值
# city: 字段存在但值为 null
# phone: 字段缺失

for field in ["name", "age", "city", "phone"]:
    if field not in api_response:
        print(f"  {field}: 字段缺失")
    elif api_response[field] is None:
        print(f"  {field}: 值为 null")
    else:
        print(f"  {field}: {api_response[field]}")
```

运行结果：

```text
  name: Alice
  age: 30
  city: 值为 null
  phone: 字段缺失
```

## 3. 最佳实践

### 3.1 判断 None 的正确方式

| 场景 | 推荐写法 | 不推荐写法 | 原因 |
|------|---------|-----------|------|
| 判断是否为 None | `x is None` | `x == None` | `==` 可能被 `__eq__` 改写 |
| 判断是否非 None | `x is not None` | `x != None` | 同上 |
| 哨兵判断 | `if target is None:` | `if not target:` | `not` 会误杀 `0`/`''`/`False` 等合法值 |
| 类型检查 | `x is None` | `isinstance(x, NoneType)` | `is None` 更简洁、更快 |

### 3.2 常见错误模式及修正

**错误模式 1：用 == None 判断**

```python
# 不推荐
if x == None:
    ...

# 推荐
if x is None:
    ...
```

**错误模式 2：用 if not x 代替 if x is None**

```python
# 不推荐：0/''/[]/False 都会走进来
if not timeout:
    timeout = 30

# 推荐：仅 None 触发
if timeout is None:
    timeout = 30
```

**错误模式 3：就地修改方法返回值赋给原变量**

```python
# 不推荐
nums = nums.sort()   # nums 变成 None

# 推荐
nums.sort()          # 就地修改，不接收返回值
```

**错误模式 4：对函数返回值不加 None 检查**

```python
# 不推荐
user = get_user(999)
print(user["name"])  # 可能 TypeError

# 推荐
user = get_user(999)
if user is not None:
    print(user["name"])
else:
    print("用户不存在")
```

**错误模式 5：可变默认参数**

```python
# 不推荐：默认 list 在调用间共享
def f(item, target=[]):
    target.append(item)
    return target

# 推荐：用 None 哨兵
def f(item, target=None):
    if target is None:
        target = []
    target.append(item)
    return target
```

### 3.3 or 与 is None 的选择

| 场景 | 推荐方式 | 原因 |
|------|---------|------|
| `None` 或空都用默认，无需区分 | `name or "默认值"` | 简洁 |
| `None` 用默认，但 `""`/`0` 等是合法值 | `name if name is not None else "默认值"` | 不会误杀合法假值 |
| 函数参数未传用默认 | `if param is None: param = 默认值` | 哨兵判断的标准写法 |

选择标准：如果参数存在合法的假值（如 `timeout=0`、`debug=False`），必须用 `is None`；如果没有合法假值（如 host 不会是空字符串），用 `or` 更简洁。

## 4. 原理

### 4.1 None 单例的字节码验证

`None` 是 CPython 解释器内置的全局单例。用 `dis` 模块查看字节码，可以验证 `is None` 的底层实现：

```python
import dis

# is None 的字节码
dis.dis(compile("x is None", "", "eval"))
```

运行结果：

```text
  1           0 LOAD_NAME                0 (x)
              2 LOAD_CONST               0 (None)
              4 IS_OP                    0
              6 RETURN_VALUE
```

`is None` 只需要三条字节码指令：
1. `LOAD_NAME x`：加载变量 `x`
2. `LOAD_CONST None`：加载 `None` 单例常量
3. `IS_OP 0`：身份比较——直接比较两个对象的内存地址（指针），时间复杂度 O(1)

### 4.2 is None 与 == None 的字节码差异

```python
import dis

# == None 的字节码
dis.dis(compile("x == None", "", "eval"))
```

运行结果：

```text
  1           0 LOAD_NAME                0 (x)
              2 LOAD_CONST               0 (None)
              4 COMPARE_OP               2 (==)
              6 RETURN_VALUE
```

`== None` 使用 `COMPARE_OP` 而非 `IS_OP`。`COMPARE_OP` 内部会调用 `x.__eq__(None)`，这意味着：
- 如果 `x` 的类覆写了 `__eq__`，比较逻辑可以被自定义，从而返回错误结果
- `__eq__` 调用比指针比较有额外开销

这就是为什么 `is None` 既安全又高效——它只比指针，不受 `__eq__` 影响。

### 4.3 函数默认返回 None 的字节码

Python 函数如果没有显式 `return`，解释器会在函数末尾隐式添加 `LOAD_CONST None; RETURN_VALUE`：

```python
import dis

def f(x):
    print(x)

dis.dis(f)
```

运行结果：

```text
  3           0 PUSH_NULL
              2 LOAD_GLOBAL              0 (print)
              4 LOAD_FAST                0 (x)
              6 PRECALL                  0
              8 CALL                     1
             10 POP_TOP

  4          12 LOAD_CONST               0 (None)
             14 RETURN_VALUE
```

最后两条字节码 `LOAD_CONST 0 (None)` 和 `RETURN_VALUE` 就是解释器自动添加的——加载 `None` 并返回。这也解释了为什么无 `return` 的函数总是返回 `None`。

### 4.4 NoneType 的方法继承

`NoneType` 继承自 `object`，自身只覆写了 `__bool__` 和 `__repr__`：

```python
print(dir(type(None)))
```

运行结果：

```text
['__bool__', '__class__', '__delattr__', '__dir__', '__doc__', '__eq__', '__format__', '__ge__', '__getattribute__', '__getstate__', '__gt__', '__hash__', '__init__', '__init_subclass__', '__le__', '__lt__', '__ne__', '__new__', '__reduce__', '__reduce_ex__', '__repr__', '__setattr__', '__sizeof__', '__str__', '__subclasshook__']
```

其中：
- `__bool__` 返回 `False`——使得 `None` 在布尔语境中为假
- `__repr__` 返回 `'None'`——使得 `print(None)` 输出 `None`
- 其余方法（`__eq__`、`__hash__` 等）继承自 `object` 的默认实现

`None` 是不可变的：不能给它添加属性，不能创建"另一个 `None` 对象"。这种设计保证了 `is None` 永远可靠——没有任何方式可以伪造一个 `None` 假对象来欺骗 `is` 判断。

### 4.5 就地修改返回 None 的设计哲学

Python 选择"就地修改返回 `None`"的设计，核心目的是**消除歧义**。如果 `list.sort()` 返回排序后的列表，调用者会困惑：原列表到底被修改了没有？

```text
设计决策对比：

方案 A（Python 的选择）：就地修改返回 None
  → 调用者看到 None，明确知道"原对象被修改了"
  → 但不能链式调用 nums.sort().reverse()

方案 B（替代方案）：就地修改返回自身
  → 调用者看到返回值，不确定原对象是否被修改
  → 可以链式调用，但容易引入隐蔽 bug
```

Python 选择了方案 A，牺牲了链式调用的便利，换取了语义的明确性。这是一个属于"安全优于便利"的典型设计决策。

## 5. 总结

本文围绕 Python 的 `None` 类型展开，主要介绍了以下内容：

- `None` 是 `NoneType` 的全局唯一单例，表示"没有值"，不在任何常规类型分类中
- 判断 `None` 必须用 `is None` / `is not None`，不能用 `== None`——`==` 可能被自定义 `__eq__` 改写，导致误判
- `None` 在布尔语境中为 `False`，但 `if not x` 与 `if x is None` 语义不同——前者对所有假值生效，后者仅对 `None` 生效
- 函数无 `return` 或 `return` 不带值时自动返回 `None`；就地修改方法（如 `append`、`sort`）统一返回 `None` 以区分"就地修改"与"返回新对象"
- `None` 哨兵模式用于解决可变默认参数陷阱，并能区分"未传参"与"传了假值"；私有哨兵 `object()` 可进一步区分"未传参"与"显式传 `None`"
- `None` 安全访问模式包括先判 `None`、`dict.get`、`or` 默认值、`and` 短路、`safe_get` 模拟可选链
- `None` 在数据结构中用作链表终止节点、二叉树空子节点、占位变量和引用释放标记
- Python `None` 与 JSON `null` 自动映射，但需注意"字段值 `null`"与"字段缺失"的三态区分
- 字节码层面，`is None` 使用 `IS_OP` 做指针比较（O(1)），`== None` 使用 `COMPARE_OP` 调用 `__eq__`，前者更安全高效
- 就地修改方法返回 `None` 是 Python"安全优于便利"的设计决策，确保语义明确无歧义
