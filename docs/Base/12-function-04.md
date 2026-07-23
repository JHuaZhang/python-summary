---
group:
  title: 【12】函数核心机制
  order: 12
order: 4
title: 默认参数陷阱
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是默认参数

在定义函数时，我们可以为参数指定一个默认值。调用函数时，如果调用者没有为该参数传值，函数就会使用这个默认值。这是 Python 中非常常用的特性，用来让函数的调用更加灵活——某些"通常不需要调用者关心"的参数，可以给一个默认值，调用者只在需要定制时才显式传入。

```python
def greet(name, greeting="你好"):
    print(f"{greeting}, {name}!")

greet("张三")              # 使用默认问候语
greet("李四", "Hello")    # 显式传入问候语
```

上面的 `greeting="你好"` 就是一个默认参数。第一种调用没传 `greeting`，所以使用了默认值"你好"；第二种调用显式传入了 `"Hello"`，覆盖了默认值。

默认参数让函数的接口更简洁，常见于日志函数的日志级别、请求函数的超时时间、数据处理函数的输出格式等场景。

### 1.2 默认参数的基本语法与最小用法

默认参数的语法很简单：在参数列表中，用 `参数名=默认值` 的形式指定默认值。有一个基本规则——**默认参数必须放在非默认参数的后面**，也就是默认参数不能出现在位置参数（无默认值的参数）之前。

```python
# 正确：默认参数在位置参数之后
def make_power(base, exponent=2):
    return base ** exponent

print(make_power(3))      # 9, 使用默认指数 2
print(make_power(3, 3))   # 27, 显式传入指数 3
```

```python
# 错误：默认参数在位置参数之前
def bad_func(a=1, b):
    return a + b
# SyntaxError: non-default argument follows default argument
```

这个语法限制的原因是：Python 按位置匹配参数，如果默认参数在前面，解释器无法判断调用 `bad_func(5)` 时，`5` 到底是给 `a` 还是给 `b`。所以语法强制要求默认参数居后。

默认参数看起来平淡无奇，但它背后隐藏着一个 Python 函数机制中非常重要、也非常容易踩坑的特性——**默认参数的值在函数定义时只求值一次，并绑定到函数对象上**。这个特性对不可变类型（如 `int`、`str`、`tuple`）毫无影响，但对可变类型（如 `list`、`dict`、`set`）来说，就是一个经典的"陷阱"。本文就来彻底讲清这个陷阱的成因、表现、规避方法和底层原理。

## 2. 核心内容

### 2.1 默认参数的求值时机：定义时而非调用时

这是理解整个默认参数陷阱的关键前提：**默认参数的值在函数定义被执行时（也就是 `def` 语句运行时）求值一次，之后不会再重新求值。**

很多初学者直觉上以为，每次调用函数时，默认参数都会被"重新创建"或"重新计算"。比如下面的代码：

```python
def append_to_list(value, lst=[]):
    lst.append(value)
    return lst

print(append_to_list(1))  # 期望输出 [1]
print(append_to_list(2))  # 期望输出 [2]，实际输出 [1, 2]
print(append_to_list(3))  # 期望输出 [3]，实际输出 [1, 2, 3]
```

运行结果：

```
[1]
[1, 2]
[1, 2, 3]
```

如果默认参数每次调用都重新创建一个空列表，那么三次调用的结果应该分别是 `[1]`、`[2]`、`[3]`。但实际上后两次调用的结果在前面结果的基础上不断累加。这说明：**三次调用使用的 `lst` 是同一个列表对象**，那个列表在函数定义时就被创建，之后所有的调用——只要不传入 `lst`——都共用这一个对象。

这就引出了默认参数陷阱的核心：**可变默认参数会被函数的所有调用共享。**

### 2.2 经典陷阱：可变默认参数的"累加 bug"

`append_to_list` 就是默认参数陷阱最经典的复现场景。我们再用一个更贴近真实场景的例子来演示——一个向购物车追加商品的函数：

```python
def add_to_cart(item, cart=[]):
    """向购物车添加商品。未传入购物车时，使用一个新购物车。"""
    cart.append(item)
    return cart

# 第一次调用：张三的购物车
cart_a = add_to_cart("苹果")
print(cart_a)  # 输出：['苹果']

# 第二次调用：李四的购物车
cart_b = add_to_cart("香蕉")
print(cart_b)  # 输出：['苹果', '香蕉']  ← 期望只有 ['香蕉']

# 第三次调用：王五的购物车
cart_c = add_to_cart("橙子")
print(cart_c)  # 输出：['苹果', '香蕉', '橙子']  ← 期望只有 ['橙子']

# 更诡异的是：原来的 cart_a 也被污染了
print(cart_a)  # 输出：['苹果', '香蕉', '橙子']
```

三个顾客的购物车本应各自独立，结果却互相串了——因为它们用的是同一个列表对象。在生产环境中，这类 bug 非常隐蔽：函数单独测试时可能没问题（因为只调用一次），但在真实业务里反复调用时，数据就会莫名其妙地累积，排查起来相当痛苦。

同样的陷阱对 `dict` 和 `set` 也成立：

```python
def register_user(username, email, tags=set()):
    """注册用户并打标签。未传入 tags 时，使用新的空集合。"""
    tags.add(username)
    tags.add(email)
    return tags

tags_a = register_user("alice", "alice@example.com")
print(tags_a)  # 输出：{'alice', 'alice@example.com'}

tags_b = register_user("bob", "bob@example.com")
print(tags_b)  # 输出：{'alice', 'alice@example.com', 'bob', 'bob@example.com'}
```

`tags_b` 本应只包含 `bob` 相关的标签，却把 `alice` 的也带进来了。这就是 `set` 默认参数的共享陷阱。

```python
def update_config(key, value, config={}):
    """更新配置项。未传入 config 时，使用新的空字典。"""
    config[key] = value
    return config

config_a = update_config("timeout", 30)
print(config_a)  # 输出：{'timeout': 30}

config_b = update_config("retry", 3)
print(config_b)  # 输出：{'timeout': 30, 'retry': 3}
```

字典同样有这个问题，`config_b` 里出现了属于 `config_a` 的 `timeout` 键。

### 2.3 规避方法：用 None 作哨兵值

既然可变默认参数会被共享，规避的思路就是：**默认参数给一个不可变的值（通常是 `None`），在函数体内判断如果传来的是 `None`，就创建一个新的可变对象。**

这种写法在 Python 社区被称为"哨兵值（sentinel）模式"，是处理可变默认参数的标准做法：

```python
def append_to_list(value, lst=None):
    """向列表追加元素。未传入列表时，新建空列表。"""
    if lst is None:
        lst = []
    lst.append(value)
    return lst

print(append_to_list(1))  # 输出：[1]
print(append_to_list(2))  # 输出：[2]
print(append_to_list(3))  # 输出：[3]
```

现在每次调用都会创建一个全新的列表，三次调用各自独立，结果符合预期。

购物车例子修正后：

```python
def add_to_cart(item, cart=None):
    if cart is None:
        cart = []
    cart.append(item)
    return cart

cart_a = add_to_cart("苹果")
cart_b = add_to_cart("香蕉")
cart_c = add_to_cart("橙子")

print(cart_a)  # 输出：['苹果']
print(cart_b)  # 输出：['香蕉']
print(cart_c)  # 输出：['橙子']
```

config 例子修正后：

```python
def update_config(key, value, config=None):
    if config is None:
        config = {}
    config[key] = value
    return config

config_a = update_config("timeout", 30)
config_b = update_config("retry", 3)

print(config_a)  # 输出：{'timeout': 30}
print(config_b)  # 输出：{'retry': 3}
```

**为什么必须用 `None` 而不是其他值？**

哨兵值的选择有一个原则：它必须是一个调用者"几乎不可能有意传入"的值。`None` 是最常用的哨兵，因为它语义上代表"没有值"，且不可变，不会触发共享问题。如果用 `0`、`""`、`[]` 这些作为哨兵，会出现两种问题：

- 如果用 `[]` 作哨兵，那又回到了可变默认参数陷阱。
- 如果用 `0` 或 `""`，调用者可能正好想传入一个空值（比如 `append_to_list(1, [])` 想显式指定空列表），这时函数无法区分"调用者没传"和"调用者传了空值"。

`None` 之所以合适，是因为在绝大多数业务场景中，`None` 不是一个合法的"有效值"，它的唯一含义就是"缺省、未指定"，与哨兵语义完全吻合。

**为什么判断用 `is None` 而不是 `== None`？**

`is None` 是身份比较（identity），判断的是"这个对象是不是 None 这个唯一实例"；`== None` 是相等比较（equality），会调用对象的 `__eq__` 方法。某些自定义类型可能实现了 `__eq__`，使得 `obj == None` 返回 `True`，但这不代表 `obj` 就是 `None`。用 `is None` 更安全、更准确、也更快（直接比较内存地址，不触发方法调用）。这是 PEP 8 明确推荐的写法。

### 2.4 不可变默认参数是安全的

并非所有默认参数都有陷阱。**只有可变类型（list、dict、set 等）才会出问题；不可变类型（int、float、str、tuple、bool、None、frozenset）是安全的。**

原因是：不可变类型一旦创建就不能被修改。对不可变对象的任何"修改"操作，实际上都是创建一个新对象并重新绑定变量名，不会改动原来的对象。所以即使多个调用"共享"同一个不可变默认值，也不会出现数据污染。

```python
def increment(base=0):
    """每次调用让计数从 base 开始 +1。"""
    base = base + 1   # 这一步创建了一个新的 int 对象
    return base

print(increment())  # 输出：1
print(increment())  # 输出：1
print(increment())  # 输出：1
```

三次调用的 `base` 默认值确实是同一个 `int` 对象 `0`，但 `base = base + 1` 这一行并没有"修改"那个 `0`，而是创建了一个新的 `int` 对象 `1` 并把局部变量 `base` 指向它。所以默认值 `0` 始终是 `0`，每次调用都从 `0` 开始，互不影响。

对比可变类型的 `lst.append(value)`：`append` 是原地修改，它直接改动了那个共享的列表对象本身，没有创建新对象。这就是两者的根本区别。

字符串默认值同样安全：

```python
def greet(name, greeting="你好"):
    greeting = greeting + "!"   # 创建新字符串，不修改默认值
    return f"{greeting} {name}"

print(greet("张三"))          # 输出：你好! 张三
print(greet("李四", "Hello"))  # 输出：Hello! 李四
```

元组默认值也安全（元组是不可变的，无法 `append`）：

```python
def with_extra(item, extras=()):
    return (item,) + extras   # 拼接产生新元组，不修改默认值

print(with_extra("a"))         # 输出：('a',)
print(with_extra("b", (1, 2))) # 输出：('b', 1, 2)
```

一个容易混淆的点：`tuple` 虽然是"容器"，但因为不可变，所以安全。`frozenset` 同理。而 `list`、`dict`、`set` 都是可变容器，作默认参数时必须用哨兵模式。

### 2.5 观察 `__defaults__`：默认值就挂在函数对象上

Python 的函数本身就是一个对象，默认参数的值就存储在这个对象的一个属性里——`__defaults__`。我们可以通过它直接观察默认参数的值。

```python
def append_to_list(value, lst=[]):
    lst.append(value)
    return lst

print(append_to_list.__defaults__)  # 输出：([],)

print(append_to_list(1))            # 输出：[1]
print(append_to_list.__defaults__)  # 输出：([1],)

print(append_to_list(2))            # 输出：[1, 2]
print(append_to_list.__defaults__)  # 输出：([1, 2],)
```

这个观察非常直观地说明了问题：

1. 函数定义后，`__defaults__` 里就存了一个空列表 `[]`。
2. 第一次调用 `append_to_list(1)`，它使用并修改了这个列表，`__defaults__` 里的列表变成了 `[1]`。
3. 第二次调用 `append_to_list(2)`，它用的还是这同一个列表，追加后变成 `[1, 2]`。

`__defaults__` 是一个元组，按位置参数的顺序存放所有默认参数的值。如果函数没有默认参数，`__defaults__` 是 `None`。

```python
def func(a, b=10, c="hi"):
    pass

print(func.__defaults__)  # 输出：(10, 'hi')
```

这里 `a` 没有默认值，所以 `__defaults__` 里只有 `b` 和 `c` 的默认值。

对于只有关键字默认参数的函数，默认值存在 `__defaults__` 还是 `__kwdefaults__` 取决于参数类型：

```python
def func(a, b=1, *, c=2, d=3):
    pass

print(func.__defaults__)       # 输出：(1,)        — 位置默认参数
print(func.__kwdefaults__)     # 输出：{'c': 2, 'd': 3} — 关键字默认参数
```

`__defaults__` 存放普通位置默认参数的值（元组形式），`__kwdefaults__` 存放 `*` 之后的纯关键字默认参数的值（字典形式）。两者都是直接挂在函数对象上的属性，可以随时读取，甚至可以修改（虽然不建议）：

```python
def append_to_list(value, lst=[]):
    lst.append(value)
    return lst

# 手动把 __defaults__ 换成新的列表（仅用于演示，生产中不要这么做）
append_to_list.__defaults__ = ([],)
print(append_to_list(1))  # 输出：[1]  — 用的是新换的空列表
```

手动修改 `__defaults__` 的行为进一步印证了默认值就是一个普通对象，只是被函数对象引用而已。

通过 `__defaults__` 我们还能验证哨兵模式为什么有效：

```python
def append_to_list(value, lst=None):
    if lst is None:
        lst = []
    lst.append(value)
    return lst

print(append_to_list.__defaults__)  # 输出：(None,)

print(append_to_list(1))            # 输出：[1]
print(append_to_list.__defaults__)  # 输出：(None,)  — 仍然是 None，没被污染

print(append_to_list(2))            # 输出：[2]
print(append_to_list.__defaults__)  # 输出：(None,)  — 仍然是 None
```

哨兵模式下，`__defaults__` 里存的是不可变的 `None`，每次调用时函数体内新建列表，`__defaults__` 永远保持 `None` 不变。这就从根本上避免了共享。

### 2.6 默认参数与闭包变量捕获的区别

默认参数陷阱容易和另一个概念混淆——闭包的变量捕获。两者都涉及"函数引用外部变量"的机制，但行为截然不同，需要对比理解。

先看闭包的变量捕获。下面的函数 `make_counter` 返回一个内部函数 `counter`，`counter` 捕获了外部变量 `count`：

```python
def make_counter():
    count = 0
    def counter():
        nonlocal count
        count += 1
        return count
    return counter

c1 = make_counter()
print(c1())  # 输出：1
print(c1())  # 输出：2
print(c1())  # 输出：3

c2 = make_counter()
print(c2())  # 输出：1  — 全新的计数器，从 0 开始
print(c2())  # 输出：2
```

`c1` 和 `c2` 是两次 `make_counter()` 调用产生的独立闭包，它们的 `count` 互不影响。这是因为闭包的变量捕获是**每次外层函数调用时**创建的——每次执行 `make_counter()` 都会创建一个新的局部变量 `count`，内层函数捕获的就是这一次的 `count`。

对比默认参数：默认值是在 `def` 语句执行时创建一次的，与函数的调用次数无关。

```python
def counter_with_default(count=[0]):
    """用默认参数实现的计数器——有共享陷阱"""
    count[0] += 1
    return count[0]

print(counter_with_default())  # 输出：1
print(counter_with_default())  # 输出：2
print(counter_with_default())  # 输出：3
```

这个 `counter_with_default` 也能计数，但它的 `count` 是函数对象上的一个共享列表，所有调用都共享同一个。这与闭包"每次外层调用创建独立环境"形成鲜明对比。

**两者的本质区别**：

| 维度     | 闭包变量捕获                   | 默认参数                         |
| -------- | ------------------------------ | -------------------------------- |
| 创建时机 | 外层函数每次调用时             | `def` 语句执行时，仅一次         |
| 是否独立 | 每次外层调用产生独立的捕获环境 | 所有调用共享同一个默认值对象     |
| 存储位置 | 闭包单元 `__closure__`         | 函数对象 `__defaults__`          |
| 修改方式 | 通过 `nonlocal` 修改外部变量   | 直接引用 `__defaults__` 中的对象 |
| 典型场景 | 装饰器、偏函数、状态封装       | 为参数提供可选默认值             |

一个更直观的对比 demo：

```python
# 方式一：闭包方式，每次 make_counter 产生独立计数
def make_counter():
    count = 0
    def counter():
        nonlocal count
        count += 1
        return count
    return counter

# 方式二：默认参数方式，所有调用共享一个计数
def shared_counter(count=[0]):
    count[0] += 1
    return count[0]

# 闭包：各自独立
a = make_counter()
b = make_counter()
print(a(), a(), a())  # 输出：1 2 3
print(b(), b())       # 输出：1 2

# 默认参数：全局共享
print(shared_counter(), shared_counter(), shared_counter())  # 输出：1 2 3
```

如果你需要"每次构造一个独立的有状态函数"，应该用闭包（或类），而不是默认参数。如果你只是想"为参数提供一个缺省值"，应该用默认参数（可变对象用哨兵模式）。

理解这个区别还能帮助你避免一个更隐蔽的坑：**在闭包中循环变量捕获的延迟问题**，与默认参数陷阱是两个独立的现象，不要混为一谈。

```python
# 闭包的延迟捕获：所有闭包共享同一个循环变量的最终值
funcs = []
for i in range(3):
    funcs.append(lambda: i)

print([f() for f in funcs])  # 输出：[2, 2, 2]
```

```python
# 用默认参数修复（每次循环把当时的 i 固定到默认参数里）
funcs = []
for i in range(3):
    funcs.append(lambda i=i: i)

print([f() for f in funcs])  # 输出：[0, 1, 2]
```

这里默认参数恰好成了修复闭包延迟捕获的工具——因为默认参数的值是在 `def` 执行时（即每次循环时）求值的，所以每次循环都把当时的 `i` 值固定了下来。这是默认参数"定义时求值"特性的一个巧妙应用。

### 2.7 日志函数与缓存函数中的默认参数陷阱

在真实工程中，默认参数陷阱经常出现在两个场景：日志函数和缓存函数。我们分别看这两个场景的复现与修复。

**场景一：日志函数的格式化器共享**

```python
import datetime

def log(message, fmt_parts=[]):
    """记录日志。fmt_parts 是额外的格式化片段列表。"""
    timestamp = datetime.datetime.now().strftime("%H:%M:%S")
    fmt_parts.append(f"[{timestamp}]")
    fmt_parts.append(message)
    return " ".join(fmt_parts)

# 第一次日志
print(log("服务启动"))
# 输出：[10:00:00] 服务启动

# 第二次日志——本应只有自己这条
print(log("收到请求"))
# 输出：[10:00:00] 服务启动 [10:00:01] 收到请求  ← 积累了上一条

# 第三次日志
print(log("处理完毕"))
# 输出：[10:00:00] 服务启动 [10:00:01] 收到请求 [10:00:02] 处理完毕
```

`fmt_parts` 是一个列表，在函数定义时被创建一次，之后所有调用共享。每次调用都往这同一个列表里追加，导致日志越来越长，且包含了不属于本次调用的历史片段。

修正后：

```python
def log(message, fmt_parts=None):
    if fmt_parts is None:
        fmt_parts = []
    timestamp = datetime.datetime.now().strftime("%H:%M:%S")
    fmt_parts.append(f"[{timestamp}]")
    fmt_parts.append(message)
    return " ".join(fmt_parts)

print(log("服务启动"))  # 输出：[10:00:00] 服务启动
print(log("收到请求"))  # 输出：[10:00:01] 收到请求
print(log("处理完毕"))  # 输出：[10:00:02] 处理完毕
```

**场景二：缓存函数的默认缓存共享**

```python
def fetch_data(query, cache={}):
    """查询数据。未传入 cache 时，使用新的空缓存。"""
    if query not in cache:
        # 模拟耗时的数据查询
        cache[query] = f"result_of_{query}"
    return cache[query]

# 第一个模块查询 A、B
print(fetch_data("A"))  # 输出：result_of_A
print(fetch_data("B"))  # 输出：result_of_B

# 第二个模块只想查 C，但缓存里已经有 A、B 了
print(fetch_data("C"))  # 输出：result_of_C

# 观察：第二个模块"看不到"但"污染了"同一个缓存
# 如果有人遍历这个默认缓存，会发现 A、B、C 都在
print(fetch_data.__defaults__)
# 输出：({'A': 'result_of_A', 'B': 'result_of_B', 'C': 'result_of_C'},)
```

这里的危害是：不同的调用者本应拥有独立的缓存，结果却共享了一个全局缓存。如果两个调用者查询同名 key 但期望不同的结果（比如同名但不同业务线的数据），就会出现"拿到别人缓存"的诡异现象。此外缓存会无限增长，造成内存泄漏。

修正方式同样是哨兵模式：

```python
def fetch_data(query, cache=None):
    if cache is None:
        cache = {}
    if query not in cache:
        cache[query] = f"result_of_{query}"
    return cache[query]

print(fetch_data.__defaults__)  # 输出：(None,) — 默认值始终是 None，不会被污染
```

**场景三：递归函数中的可变默认参数**

递归函数也常用默认参数来传递累加器。如果用可变默认参数，同样会共享：

```python
def collect_tree(node, result=[]):
    """递归收集树形结构所有节点。"""
    result.append(node.get("name", ""))
    for child in node.get("children", []):
        collect_tree(child, result)
    return result

tree1 = {
    "name": "root1",
    "children": [{"name": "child1"}, {"name": "child2"}]
}

tree2 = {
    "name": "root2",
    "children": [{"name": "child3"}]
}

print(collect_tree(tree1))  # 输出：['root1', 'child1', 'child2']
print(collect_tree(tree2))  # 输出：['root1', 'child1', 'child2', 'root2', 'child3']  ← 累积了 tree1
```

修正：

```python
def collect_tree(node, result=None):
    if result is None:
        result = []
    result.append(node.get("name", ""))
    for child in node.get("children", []):
        collect_tree(child, result)
    return result

print(collect_tree(tree1))  # 输出：['root1', 'child1', 'child2']
print(collect_tree(tree2))  # 输出：['root2', 'child3']
```

### 2.8 默认参数表达式的求值

默认参数不只能是一个常量，它可以是一个表达式。但无论多么复杂的表达式，都只在 `def` 执行时求值一次。

```python
import time

def greet(name, current_time=time.time()):
    return f"Hello {name}, it's {current_time}"

t1 = greet("张三")
print(t1)  # 输出类似：Hello 张三, it's 1719xxxxxx.xxxx

import time as _t
_t.sleep(2)

t2 = greet("李四")
print(t2)  # 输出的时间戳和上面一模一样！
```

两次调用间隔了 2 秒，但 `current_time` 的值却完全一样——因为 `time.time()` 是在 `def` 执行时调用的，之后每次调用函数都不会再调它。如果想让每次调用都获取当前时间，应该在函数体内调用：

```python
def greet(name):
    current_time = time.time()
    return f"Hello {name}, it's {current_time}"
```

这个例子说明：**默认参数的值在函数定义时求值**这句话的"求值"是字面意义的——`time.time()` 这个函数调用本身都只发生一次。

再看一个用表达式作为默认参数的例子：

```python
import random

def pick_one(options, seed=random.randint(0, 100)):
    """从 options 里选一个。seed 默认随机。"""
    random.seed(seed)
    return random.choice(options)

print(pick_one(["A", "B", "C"]))  # seed 固定为定义时那个随机值
print(pick_one(["A", "B", "C"]))  # 每次调用 seed 都一样，随机序列一致
```

`random.randint(0, 100)` 只在 `def` 时执行一次，之后所有调用的 `seed` 都是那同一个值。这通常不是想要的行为。

**原则**：如果默认值需要"每次调用都动态获取"，就在函数体内获取，不要放在默认参数里。默认参数只适合放"静态的、不会变的"缺省值。

### 2.9 默认参数与方法

类的方法同样会有默认参数陷阱，而且更容易被忽略，因为方法是被多个实例共享的：

```python
class MessageBus:
    def __init__(self):
        self.handlers = {}

    def subscribe(self, event, callbacks=[]):
        """订阅事件。未传入 callbacks 时，新建空列表。"""
        if event not in self.handlers:
            self.handlers[event] = callbacks
        else:
            self.handlers[event].extend(callbacks)
        return self.handlers[event]

bus = MessageBus()
print(bus.subscribe("login"))  # 输出：[]

bus2 = MessageBus()
print(bus2.subscribe("login"))  # 输出：[] — 看似正常
```

上面的例子看似没问题，但如果 `callbacks` 被修改，问题就暴露了：

```python
class MessageBus:
    def subscribe(self, event, callbacks=[]):
        if event not in self.handlers:
            self.handlers = {}
        self.handlers.setdefault(event, callbacks)
        return self.handlers[event]

bus = MessageBus()
bus.subscribe("login").append("handler_a")
print(bus.subscribe("login"))  # 输出：['handler_a']

bus2 = MessageBus()
bus2.subscribe("login").append("handler_b")
print(bus2.subscribe("login"))  # 输出：['handler_a', 'handler_b']  ← bus 的 handler_a 跑到 bus2 来了
```

两个不同实例的 `bus` 和 `bus2`，它们的 `subscribe` 方法共享同一个默认 `callbacks` 列表（因为方法本身是类级别的，`__defaults__` 挂在函数对象上）。修正：

```python
class MessageBus:
    def __init__(self):
        self.handlers = {}

    def subscribe(self, event, callbacks=None):
        if callbacks is None:
            callbacks = []
        self.handlers.setdefault(event, [])
        if callbacks:
            self.handlers[event].extend(callbacks)
        return self.handlers[event]
```

方法的默认参数陷阱尤其值得注意，因为开发者直觉上会觉得"每个实例有自己的状态"，但默认参数是挂在方法函数对象上的，与实例无关。

### 2.10 用 `__defaults__` 调试默认参数问题

当你怀疑某个函数的默认参数有共享问题，可以直接打印它的 `__defaults__` 来确认：

```python
def process(data, buffer=[]):
    buffer.extend(data)
    return buffer

# 怀疑 buffer 被共享
print(process.__defaults__)  # 输出：([],)

process([1, 2])
print(process.__defaults__)  # 输出：([1, 2],) — 默认值被改了，确认是共享问题

process([3, 4])
print(process.__defaults__)  # 输出：([1, 2, 3, 4],)
```

如果 `__defaults__` 里的可变对象在调用后发生了变化，就说明默认参数被共享并修改了。一个正常的哨兵模式函数，`__defaults__` 应该始终保持不变（永远是 `None`）。

```python
def process(data, buffer=None):
    if buffer is None:
        buffer = []
    buffer.extend(data)
    return buffer

print(process.__defaults__)  # 输出：(None,)

process([1, 2])
print(process.__defaults__)  # 输出：(None,) — 保持不变，正常
```

## 3. 最佳实践

### 3.1 可变默认参数一律用 None 哨兵

这是最核心的一条实践准则：**任何可变类型（list、dict、set）作为默认参数时，一律用 `None` 哨兵模式。** 不要心存侥幸地使用 `[]`、`{}`、`set()` 作为默认值，即使你确信"这个函数只会被调用一次"——因为维护过程中别人可能会多次调用它。

推荐写法：

```python
def func(items, extra=None):
    if extra is None:
        extra = []
    extra.extend(items)
    return extra
```

不推荐写法：

```python
def func(items, extra=[]):
    extra.extend(items)
    return extra
```

### 3.2 判断哨兵一律用 `is None`

不要用 `if not extra:`、`if extra == None:`、`if extra is None:` 之外的方式判断哨兵。

`if not extra:` 的问题：调用者如果传入一个空的可变对象（如 `func(items, [])`），`not []` 是 `True`，函数会错误地新建一个列表，而调用者传入的那个空列表就被忽略了。

```python
# 错误的哨兵判断
def func(items, extra=None):
    if not extra:        # 这里会把调用者传入的空列表也当成 None
        extra = []
    extra.extend(items)
    return extra

result = func([1, 2], [])  # 调用者显式传入空列表
print(result)  # 输出：[1, 2]
# 但如果调用者想保持那个空列表的引用，他会失望地发现引用没被修改
```

`if extra == None:` 的问题：相等比较会调用 `__eq__`，某些类型可能实现得不够严格，导致误判。而且语义上我们关心的是"是不是 None 这个对象"，不是"是否等于 None"。`is None` 直接比较身份，最准确最安全。

### 3.3 不可变默认参数可以直接用

对于不可变类型（int、float、str、tuple、bool、None、frozenset），直接作为默认参数是安全的，不需要哨兵模式。

```python
# 这些都是安全的
def retry(times=3): ...
def format_msg(msg, prefix=">>>"): ...
def with_extra(item, extras=()): ...
def is_valid(value, required=True): ...
```

不要为了"风格统一"而对不可变默认值也套哨兵，那样反而让代码变啰嗦。只在可变类型上用哨兵即可。

### 3.4 默认参数不要放有副作用的表达式

默认参数的表达式只求值一次，所以不要放会产生副作用或动态结果的调用（如 `time.time()`、`random.random()`、`uuid.uuid4()`、`datetime.now()`）。如果需要每次调用都获取动态值，放在函数体内。

```python
# 不推荐：time.time() 只在 def 时执行一次
def log(msg, ts=time.time()):
    return f"[{ts}] {msg}"

# 推荐：每次调用都获取当前时间
def log(msg):
    ts = time.time()
    return f"[{ts}] {msg}"
```

### 3.5 静态分析工具辅助发现

静态分析工具能帮你自动发现可变默认参数的问题。Python 社区主流的 linter 几乎都内置了这条检查规则：

- **pylint**：规则 `W0102`（dangerous-default-value）会标记 `def f(x=[])` 这类写法。
- **flake8 + flake8-bugbear**：规则 `B006` 会标记可变默认参数。
- **ruff**：规则 `B006` 同样检测这个问题，且速度极快。

启用这些工具后，代码中的可变默认参数会在编码阶段就被高亮提示，省去运行时排查的麻烦。在大型项目中，强烈建议把 `B006` 设为强制规则，纳入 CI 检查。

### 3.6 文档中标注默认参数的行为

如果函数的默认参数有特殊行为（比如空字典时新建缓存、None 时创建临时对象），在 docstring 里写清楚，让调用者明白：

```python
def update_config(key, value, config=None):
    """更新配置项。

    Args:
        key: 配置键。
        value: 配置值。
        config: 待更新的配置字典。为 None 时新建空字典，
            不会修改任何已有字典。

    Returns:
        更新后的配置字典。
    """
    if config is None:
        config = {}
    config[key] = value
    return config
```

### 3.7 何时可以"有意"利用可变默认参数

少数情况下，可变默认参数的共享特性是可以被有意利用的——比如实现单例缓存、函数级的 memoization。但即便如此，也建议显式声明意图，避免让后来者误以为是 bug：

```python
def fib(n, memo={}):
    """计算斐波那契数。memo 是函数级缓存，所有调用共享以加速重复计算。"""
    if n in memo:
        return memo[n]
    if n < 2:
        return n
    memo[n] = fib(n - 1) + fib(n - 2)
    return memo[n]

print(fib(100))  # 输出：354224848179261915075
```

这里 `memo` 故意用可变字典作默认参数，实现跨调用的缓存共享，加速递归。但应该充分注释意图，或者改用 `functools.lru_cache` 这种标准库工具来显式表达"我在做缓存"：

```python
from functools import lru_cache

@lru_cache(maxsize=None)
def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)

print(fib(100))  # 输出：354224848179261915075
```

`lru_cache` 更清晰、更规范，是这种场景的推荐做法。

## 4. 原理

### 4.1 默认参数在 def 执行时求值并存入函数对象

Python 的 `def` 语句是一条可执行语句。当解释器执行到 `def` 时，它会做以下几件事：

1. **求值默认参数表达式**：对函数签名中每个带默认值的参数，求值其默认表达式。这些求值发生在 `def` 语句所在的作用域里，在 `def` 被执行的那一刻发生。
2. **创建函数对象**：把这些求值结果打包，与函数的代码对象一起，构造出一个函数对象。
3. **把默认值存入 `__defaults__`**：函数对象有一个 `__defaults__` 属性（元组），用于存位置默认参数的值；`__kwdefaults__`（字典）用于存纯关键字默认参数的值。
4. **把函数名绑定到当前作用域**：把函数对象赋值给函数名，使其在后续代码中可被调用。

关键在于第 1 步——默认参数的求值发生在 `def` 执行时，**而不是每次函数调用时**。这意味着：

```python
def f(x=[]):
    x.append(1)
    return x
```

当 `def f(x=[]):` 这一行被执行时，`[]` 这个列表字面量被求值，产生一个空的列表对象。这个列表对象随后被存入 `f.__defaults__`。此后无论 `f` 被调用多少次，`__defaults__` 里的都是这同一个列表对象。调用 `f()` 时，由于没传 `x`，解释器就从 `__defaults__` 里取出这个列表，绑定到局部变量 `x`。`x.append(1)` 原地修改了这个列表，也就是修改了 `__defaults__` 里的那个对象。

通过 `id()` 可以验证"同一个对象"：

```python
def f(x=[]):
    return x

print(id(f.__defaults__[0]))  # 输出：例如 4318xxxxxx
print(id(f()))                # 输出：同样的 4318xxxxxx
print(id(f()))                # 输出：同样的 4318xxxxxx
```

三次的 `id` 完全相同，证实了它们指向内存中的同一个列表对象。

### 4.2 字节码层面：MAKE_FUNCTION 打包默认值

在字节码层面，默认参数的处理涉及 `MAKE_FUNCTION` 指令。我们用 `dis` 模块观察 `def` 语句的字节码。

```python
import dis

def outer():
    def f(x=[]):
        return x

dis.dis(outer)
```

你会看到类似下面的字节码（不同 Python 版本细节略有差异）：

```
  2           0 BUILD_LIST                0        # 创建空列表 []
              2 LOAD_CONST               1 (<code object f ...>)
              4 LOAD_CONST               2 ('f')
              6 MAKE_FUNCTION            0          # 打包默认值，创建函数对象
              8 STORE_FAST               0 (f)
             10 LOAD_CONST               0 (None)
             12 RETURN_VALUE
```

重点在开头的 `BUILD_LIST 0`——它创建了一个空列表，压入栈顶。随后 `MAKE_FUNCTION` 把这个列表（作为默认参数值）和函数代码对象一起打包成一个函数对象。这个过程只发生在 `outer()` 被调用、执行到 `def f` 这一行时。`outer()` 每被调用一次，就执行一次 `BUILD_LIST`，产生一个新的空列表。

```python
import dis

def outer():
    def f(x=[]):
        return x
    return f

f1 = outer()
f2 = outer()
print(id(f1.__defaults__[0]))  # 输出：例如 4318aaaaa
print(id(f2.__defaults__[0]))  # 输出：例如 4318bbbbb  — 不同的 id
```

`f1` 和 `f2` 是两次 `outer()` 调用产生的不同函数对象，它们的 `__defaults__[0]` 也是不同的列表。这说明默认值的确是在每次 `def` 执行时新建的——但关键是，**同一个函数对象的多次调用，共享 `__defaults__` 里那同一个对象**。

对于直接在模块级别定义的函数，`def` 只在模块加载时执行一次，所以 `__defaults__` 里的对象在整个程序运行期间只创建一次，被所有调用共享。

### 4.3 调用时：缺位参数从 `__defaults__` 取值

函数被调用时，解释器是如何处理缺位的默认参数的呢？大致流程：

1. 调用者传入的实际参数按位置和关键字匹配到形参。
2. 对于没有被匹配到的形参，如果该形参有默认值，解释器从 `__defaults__`（或 `__kwdefaults__`）中取出对应的对象，绑定到该形参。
3. 如果该形参没有默认值且没被传入，报 `TypeError`。

关键在第 2 步——从 `__defaults__` 取值时，**取的是对象引用，不是对象副本**。也就是说，形参变量直接指向 `__defaults__` 里那个对象，函数体内对它的任何原地修改，都会反映到 `__defaults__` 中的那个对象上。

可以做一个直观的验证：

```python
def f(x=[]):
    print("调用前 id:", id(x))
    x.append(1)
    print("调用后 id:", id(x))
    return x

print("默认值 id:", id(f.__defaults__[0]))
# 输出：默认值 id: 4318xxxxxx

f()
# 输出：
# 调用前 id: 4318xxxxxx  — 与 __defaults__[0] 相同
# 调用后 id: 4318xxxxxx  — 仍是同一个对象

f()
# 输出：
# 调用前 id: 4318xxxxxx  — 仍然是同一个对象
# 调用后 id: 4318xxxxxx
```

所有 `id` 完全一致，表明函数体内的 `x` 与 `__defaults__[0]` 是同一个对象。`append` 原地修改这个对象，所以多次调用的修改会累积。

对比哨兵模式：

```python
def f(x=None):
    if x is None:
        x = []
    print("调用时 id:", id(x))
    x.append(1)
    return x

print("默认值 id:", id(f.__defaults__[0]))
# 输出：默认值 id: 4300yyyyy（这是 None 的 id）

f()
# 输出：
# 调用时 id: 4318zzzzz  — 新建列表的 id，与 None 不同

f()
# 输出：
# 调用时 id: 4318wwwww  — 又一个新建列表的 id，与上一次不同
```

哨兵模式下，每次调用都在函数体内新建列表，`x` 指向的是新的对象，互不影响。`__defaults__[0]` 始终是不可变的 `None`，不会被修改。

### 4.4 为什么可变默认参数会被共享：同一个对象的引用

综合上述机制，可变默认参数被共享的根本原因可以总结为一句话：**所有调用使用的都是 `__defaults__` 中那同一个对象的引用。**

让我们把整条链路串起来：

1. `def f(x=[])` 执行时，`[]` 求值产生一个空列表对象 A。
2. A 被存入 `f.__defaults__`（作为元组的第一个元素）。
3. 调用 `f()` 时，解释器从 `f.__defaults__` 取出 A，把形参 `x` 绑定到 A。
4. `x.append(1)` 原地修改 A，A 变成 `[1]`。
5. 再次调用 `f()` 时，解释器又从 `f.__defaults__` 取出 A（此时已经是 `[1]`），绑定到 `x`。
6. `x.append(1)` 修改 A，A 变成 `[1, 1]`。
7. 如此往复，所有调用的修改都累积在 A 上。

不可变默认参数不会有这个问题，是因为"修改"不可变对象的操作（如 `x = x + 1`、`x = x + "a"`）会创建新对象并重新绑定局部变量 `x`，而不会影响 `__defaults__` 中的原对象。下一次调用时，`__defaults__` 里的仍然是原来的那个不可变值，完全没有被污染。

这就是为什么：

- 可变默认参数（`[]`、`{}`、`set()`）→ 共享并被修改 → 陷阱。
- 不可变默认参数（`0`、`""`、`()`、`None`、`True`）→ 共享但无法被原地修改 → 安全。
- 哨兵模式（`None` + 函数体内新建）→ 每次调用都新建独立对象 → 无共享。

### 4.5 `__defaults__` 与 `__kwdefaults__` 的内部结构

`__defaults__` 是一个元组，元素按位置参数顺序排列。对于 `def f(a, b=1, c=2)`，`__defaults__` 是 `(1, 2)`。

`__kwdefaults__` 是一个字典，存放 `*` 之后的纯关键字默认参数。对于 `def f(a, b=1, *, c=2, d=3)`，`__defaults__` 是 `(1,)`，`__kwdefaults__` 是 `{'c': 2, 'd': 3}`。

```python
def f(a, b=1, *, c=2, d=3):
    pass

print(f.__defaults__)     # 输出：(1,)
print(f.__kwdefaults__)   # 输出：{'c': 2, 'd': 3}
```

理解这两个属性的结构，有助于在反射场景（如写装饰器、框架代码）中正确读取和修改默认参数。大部分时候你不需要手动操作它们，但知道它们的存在，能帮助你在调试默认参数问题时快速定位。

### 4.6 为什么 Python 要这样设计

你可能会问：既然这个特性这么容易踩坑，为什么 Python 不改成"每次调用都重新求值默认参数"？

这是一个历史与一致性的权衡。Python 的设计哲学有几个考量：

1. **一致性**：Python 里"定义时求值"是普遍机制。类属性、装饰器参数等都在定义时求值。默认参数也遵循这个一致的模式。
2. **性能**：如果每次调用都重新求值默认参数，对于复杂表达式会带来性能开销，而且大多数默认参数（如不可变常量）并不需要重新求值。
3. **可预期性**：定义时求值让默认值是一个稳定的、可观察的对象（通过 `__defaults__`），便于反射和调试。
4. **有意利用**：有些场景确实需要跨调用共享的对象（如缓存），定义时求值恰好满足这种需求。

代价就是可变默认参数的陷阱。Python 社区通过编码规范（PEP 8、lint 规则）和教学来规避这个陷阱，而不是改变语言机制。理解了这个设计原因，你也会更自然地记住"可变默认参数用哨兵"这条规则——它不是乱补的补丁，而是顺应语言机制的合理写法。

## 5. 总结

### 5.1 本文内容要点

- **默认参数的求值时机**：默认参数的值在 `def` 语句执行时求值一次，并存入函数对象的 `__defaults__`（位置默认参数）或 `__kwdefaults__`（关键字默认参数）属性。此后函数的每次调用，缺位的默认参数都从这两个属性中取值——取的是对象引用，不是副本。

- **可变默认参数陷阱**：当默认值是可变对象（list、dict、set）时，所有调用共享 `__defaults__` 里的同一个对象。函数体内的原地修改（`append`、`extend`、`add`、`update` 等）会累积到这个共享对象上，导致"上一次调用的数据污染下一次调用"的经典 bug。

- **规避方法**：用 `None` 作哨兵值放在默认参数里，函数体内用 `if x is None: x = []` 新建独立可变对象。判断必须用 `is None`，不能用 `== None` 或 `if not x`。

- **不可变默认参数是安全的**：int、float、str、tuple、bool、None、frozenset 这些不可变类型作为默认值不会出问题，因为"修改"不可变对象会创建新对象并重新绑定局部变量，不影响 `__defaults__` 中的原对象。

- **与闭包变量捕获的区别**：闭包的变量捕获发生在"外层函数每次调用时"，每次外层调用产生独立的捕获环境；默认参数发生在"`def` 执行时"，仅一次，所有调用共享。两者机制不同，不要混淆。

- **`__defaults__` 观察**：可以直接打印 `func.__defaults__` 来观察默认参数的实际值，确认是否存在共享问题。正常的哨兵模式 `__defaults__` 应该始终保持 `None` 不变。

- **底层原理**：`def` 执行时，默认参数表达式被求值，打包进函数对象的 `__defaults__`；字节码层面由 `MAKE_FUNCTION` 指令完成打包；调用时由解释器从 `__defaults__` 取出对象引用绑定到形参。可变默认参数被共享，是因为共享的是同一个对象的引用。

### 5.2 读完本文你应能掌握

- 能准确说出默认参数的求值时机是"函数定义时"而非"函数调用时"，并用 `__defaults__` 属性加以验证。
- 能复现可变默认参数的"累加 bug"（如 `append_to_list(value, lst=[])`），解释其成因为"共享同一个可变对象"。
- 能写出正确的哨兵模式：默认参数用 `None`，函数体内 `if x is None: x = []`，且说明为什么必须用 `is None` 而非 `== None` 或 `if not x`。
- 能判断哪些默认参数是安全的（不可变类型）、哪些需要用哨兵（可变类型），并对 `int`、`str`、`tuple`、`list`、`dict`、`set` 等常见类型做出正确选择。
- 能区分默认参数陷阱与闭包变量捕获的差异，从"创建时机"、"是否独立"、"存储位置"三个维度说明两者不同。
- 能在日志函数、缓存函数、递归函数、类方法等真实场景中识别默认参数陷阱，并给出修正方案。
- 能使用 `func.__defaults__` 调试默认参数问题，确认默认值是否被共享修改。
- 能说明 `def` 语句执行、`MAKE_FUNCTION` 字节码、`__defaults__` 存储机制如何共同导致可变默认参数的共享行为。
