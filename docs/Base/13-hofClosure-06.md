---
group:
  title: 【13】高阶函数与闭包
  order: 13
order: 6
title: 闭包（closure）
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是闭包

闭包是 Python 中一个非常重要、却又常被讲得过于抽象的概念。用一句话概括：**闭包是"携带了其定义环境变量"的函数**。

普通函数在执行时，它用到的变量要么来自自己的局部作用域，要么来自模块全局作用域。而闭包不同——它还引用了"定义它时所在的那层函数"的局部变量。即使那层外层函数已经返回、调用栈早已销毁，这些被引用的变量仍然存活，就好像函数"记住"了它诞生的环境。

先看一个最小例子来建立直观感受：

```python
def make_adder(n):
    def adder(x):
        return x + n      # n 来自外层函数 make_adder 的参数
    return adder          # 返回的是 adder 函数对象本身，而非调用结果

add3 = make_adder(3)      # add3 是一个"携带了 n=3"的函数
add10 = make_adder(10)    # add10 是一个"携带了 n=10"的函数

print(add3(5))   # 输出：8    （5 + 3）
print(add3(20))  # 输出：23   （20 + 3）
print(add10(5))  # 输出：15   （5 + 10）
```

注意一个关键点：`make_adder(3)` 执行完毕后，它的局部变量 `n` 按理说应该随栈帧一起销毁。但 `add3` 在后续调用中仍然能正确使用 `n=3`，这说明 `n` 并没有真正消失——它被 `adder` 这个内层函数"捕获"了。这个 `adder` 函数加上它捕获的 `n`，合在一起就是一个闭包。

### 1.2 闭包的形成条件

并非随便嵌套两个函数就能得到闭包。形成闭包需要同时满足三个条件：

1. **有嵌套的函数定义**：存在外层函数和内层函数，内层函数定义在外层函数的函数体内部。
2. **内层函数引用了外层函数的变量**：内层函数的函数体中用到了外层函数的局部变量（或参数），这些变量对内层函数而言是"自由变量"——在自己作用域里找不到的变量。
3. **外层函数返回了内层函数**：外层函数把内层函数对象作为返回值返回（或以某种方式暴露到外部），使得内层函数在外层函数之外仍可被调用。

三个条件缺一不可。来看一个反面例子——只有嵌套，没有引用外层变量，不构成闭包意义的捕获：

```python
def outer():
    def inner():
        return "hello"   # inner 没有引用 outer 的任何变量
    return inner

f = outer()
print(f())  # 输出：hello
```

这里 `inner` 虽然是嵌套函数，但它没有引用外层变量，所以 `f` 只是一个普通函数对象，并不携带任何"环境变量"。技术上它仍是个函数，但从闭包的角度看，它没有捕获任何自由变量，`__closure__` 为 `None`（后面会详述）。

再看一个只有引用、没有返回的例子：

```python
def outer():
    count = 0
    def inner():
        return count + 1   # 引用了外层变量 count
    print(inner())         # 在 outer 内部调用，没有返回 inner

outer()  # 输出：1
# 此处无法再访问 inner，也没有闭包被"带出来"
```

这里 `inner` 引用了 `count`，但 `outer` 没有把 `inner` 返回出来，闭包的生命周期随 `outer` 调用结束而终止。真正的闭包力量在于：函数被带出定义环境后仍能访问那些变量。

### 1.3 闭包的核心价值

理解了"是什么"之后，自然会问：闭包到底有什么用？在 Python 中，闭包主要解决一类问题——**让函数"记住"状态**，而不必依赖全局变量或类的实例属性。

考虑一个计数器需求：我们需要一个函数，每次调用它都会让某个计数加 1，并返回当前计数。如果用全局变量实现：

```python
count = 0

def counter():
    global count
    count += 1
    return count

print(counter())  # 输出：1
print(counter())  # 输出：2
print(counter())  # 输出：3
```

问题在于 `count` 是全局变量，任何地方都能改它，容易冲突、难以维护。而且如果需要两个独立计数器，全局变量方案几乎无法优雅应对。用闭包则干净利落：

```python
def make_counter():
    count = 0              # 每次调用 make_counter 都创建一个独立的 count
    def counter():
        nonlocal count     # 声明 count 是外层变量，在此重新绑定
        count += 1
        return count
    return counter

c1 = make_counter()
c2 = make_counter()

print(c1())  # 输出：1
print(c1())  # 输出：2
print(c2())  # 输出：1   ← c2 是独立计数器，不受 c1 影响
print(c1())  # 输出：3
```

`c1` 和 `c2` 各自携带自己的 `count`，互不干扰。这就是闭包的魅力：用简单的函数嵌套，实现了状态的封装与隔离，无需定义类。后续在装饰器、回调、延迟计算等场景中，闭包都是底层支撑机制。

---

## 2. 核心内容

### 2.1 闭包的三要素逐一拆解

第一章已经给出了闭包的三个形成条件。本节把每个条件拆开讲透，理解了这三点，闭包的概念才算真正落地。

**条件一：嵌套函数定义**

Python 允许在函数内部定义另一个函数，这叫嵌套函数（nested function）。内层函数和普通函数一样，有自己的函数体、参数、局部作用域，只不过它的"可见范围"多了外层函数的局部作用域这一层。

```python
def outer(msg):
    prefix = "[LOG] "
    def inner(text):
        # inner 能看到 outer 的 msg、prefix，也能看到全局
        return prefix + msg + ": " + text
    return inner

info_logger = outer("INFO")
error_logger = outer("ERROR")

print(info_logger("启动服务"))   # 输出：[LOG] INFO: 启动服务
print(error_logger("连接失败"))  # 输出：[LOG] ERROR: 连接失败
```

`inner` 定义在 `outer` 内部，这是闭包形成的物理基础。

**条件二：内层函数引用外层变量**

内层函数必须"用到"外层函数的局部变量或参数，这些变量对内层函数来说是"自由变量"——即在内层函数自身作用域里没有定义、需要到外层去找的变量。如果内层函数完全不引用外层变量，那它虽然形式上嵌套，但没有"环境"可携带，构不成闭包的实质。

```python
def make_multiplier(factor):
    def multiply(x):
        # factor 是自由变量，在 multiply 自己的作用域里找不到定义
        # 它来自外层 make_multiplier 的参数
        return x * factor
    return multiply

double = make_multiplier(2)
triple = make_multiplier(3)

print(double(10))  # 输出：20
print(triple(10))  # 输出：30
```

`factor` 就是 `multiply` 捕获的自由变量。每次调用 `make_multiplier` 传入不同的 `factor`，生成的闭包就携带不同的值。

**条件三：外层函数返回内层函数**

闭包的意义在于让内层函数"离开"外层函数之后还能继续被调用。这要求外层函数把内层函数对象返回出去（或存入容器、作为参数传走等，总之要暴露到外部）。

```python
def make_greeting(greeting):
    def greet(name):
        return f"{greeting}, {name}!"
    return greet   # 注意：返回的是 greet 函数对象，没有加括号

say_hello = make_greeting("Hello")
say_hi = make_greeting("Hi")

print(say_hello("Alice"))  # 输出：Hello, Alice!
print(say_hi("Bob"))       # 输出：Hi, Bob!
```

这里有个新手常犯的错误：`return greet` 写成 `return greet()`。前者返回函数对象（形成闭包），后者立即调用内层函数并返回其结果（此时如果 `greet` 需要参数还会报错，且闭包根本没机会"带出去"）。闭包的本质是返回函数对象本身，让它在未来某个时刻被调用。

### 2.2 闭包捕获的是"变量"而非"值"

这是闭包最容易让人误解的一点：闭包捕获的是变量本身（或者说对变量的引用），而不是变量在某一时刻的值。这意味着，如果外层变量在闭包形成后（但外层函数返回前）发生了改变，闭包看到的是最新的值；更重要的是，通过 `nonlocal`，闭包内部还能修改外层变量。

先看捕获引用（而非值拷贝）的体现：

```python
def make_watcher():
    value = 10
    def get():
        return value    # 捕获的是 value 这个变量，而非 10 这个值
    # 在 make_watcher 返回前，改变 value
    value = 999
    return get

watch = make_watcher()
print(watch())  # 输出：999
```

如果闭包捕获的是值拷贝，那么 `get` 应该记住 `value=10`，输出 10。但实际输出 999——因为 `get` 捕获的是 `value` 这个变量的引用（cell），只要 `make_watcher` 内 `value` 指向哪里，`get` 就读到哪里。

再看通过 `nonlocal` 让闭包"写回"外层变量：

```python
def make_accumulator():
    total = 0
    def add(n):
        nonlocal total     # 允许内层函数重新绑定外层的 total
        total += n
        return total
    return add

acc = make_accumulator()
print(acc(10))  # 输出：10
print(acc(20))  # 输出：30
print(acc(5))   # 输出：35
```

`acc` 每次调用都会更新并记住 `total` 的值。`total` 不是普通的局部副本，而是被闭包"持有"的状态。如果没有 `nonlocal`，`total += n` 会在 `add` 内部创建一个新的局部 `total`，反而报错（因为在赋值前就引用了 `total`）。关于 `nonlocal` 的详细用法，有专门篇章讲解，这里只需知道它是让闭包"修改"外层变量的关键。

### 2.3 每次外层调用都创建独立环境

理解了"捕获变量引用"后，接下来一个关键推论：**每次调用外层函数，都会创建一个全新的、独立的环境**，因此每次调用产生的闭包互不干扰。

```python
def make_counter(start=0):
    count = start
    def counter():
        nonlocal count
        count += 1
        return count
    return counter

c_a = make_counter()       # 全新环境，count=0
c_b = make_counter(100)    # 又一个全新环境，count=100
c_c = make_counter()       # 第三个全新环境，count=0

print(c_a())  # 输出：1
print(c_a())  # 输出：2
print(c_b())  # 输出：101
print(c_c())  # 输出：1   ← 和 c_a 互不影响
print(c_a())  # 输出：3
print(c_b())  # 输出：102
```

`c_a`、`c_b`、`c_c` 是三个独立的计数器，各自维护自己的 `count`。这是因为 `make_counter` 每次被调用，都会创建一个新的栈帧，其中有一个新的 `count` 局部变量。三个闭包捕获的是三个不同的 `count` 变量（三个不同的 cell 对象）。

这一点和"类实例"很像——每次 `make_counter()` 类似于 `Counter()` 创建实例，各自的状态隔离。后面会专门对比闭包与类。

### 2.4 用 __closure__ 查看 captured 变量

Python 提供了一个内省机制来"看见"闭包到底捕获了什么：函数对象的 `__closure__` 属性。

```python
def make_adder(n):
    def adder(x):
        return x + n
    return adder

add3 = make_adder(3)

print(add3.__closure__)           # 输出：(<cell at 0x...: int object 0x...>,)
print(type(add3.__closure__))     # 输出：<class 'tuple'>
print(len(add3.__closure__))      # 输出：1   ← 捕获了 1 个变量
```

`__closure__` 是一个元组，元素是 `cell` 对象，每个 `cell` 对应一个被捕获的自由变量。可以通过 `cell_contents` 属性读取 cell 里存的值：

```python
cell = add3.__closure__[0]
print(cell.cell_contents)   # 输出：3
```

把 `add3` 和 `add10` 放一起对比：

```python
add3 = make_adder(3)
add10 = make_adder(10)

print(add3.__closure__[0].cell_contents)   # 输出：3
print(add10.__closure__[0].cell_contents)  # 输出：10

# 证明它们捕获的是不同的 cell 对象
print(add3.__closure__[0] is add10.__closure__[0])  # 输出：False
```

`add3` 和 `add10` 各自的 `__closure__` 里的 cell 是不同的对象，分别持有 3 和 10。

对于不捕获任何自由变量的普通函数，`__closure__` 是 `None`：

```python
def plain(x):
    return x + 1

print(plain.__closure__)  # 输出：None
```

再看一个 `nonlocal` 修改后，cell 内容随之更新的例子：

```python
def make_counter():
    count = 0
    def counter():
        nonlocal count
        count += 1
        return count
    return counter

c = make_counter()
print(c())  # 输出：1
print(c.__closure__[0].cell_contents)  # 输出：1
print(c())  # 输出：2
print(c.__closure__[0].cell_contents)  # 输出：2
print(c())  # 输出：3
print(c.__closure__[0].cell_contents)  # 输出：3
```

可以清楚看到，`count` 这个 cell 的 `cell_contents` 随着 `c()` 的调用不断更新。闭包持有的是 cell（引用），不是快照值。

### 2.5 自由变量（free variable）概念

前面多次提到"自由变量"，这里给出明确定义：**自由变量是指在一个函数体内被引用，但在该函数自身作用域中未定义的变量**。它会沿着 LEGB 的 E 层（Enclosing）向外层函数作用域查找。

在闭包语境下，内层函数引用的外层函数局部变量，就是典型的自由变量。

```python
def outer():
    a = 1          # outer 的局部变量
    b = 2          # outer 的局部变量
    def inner():
        c = 10     # inner 的局部变量
        return a + b + c   # a、b 是 inner 的自由变量，c 是 inner 的局部变量
    return inner

f = outer()
print(f())  # 输出：13
print(f.__code__.co_freevars)  # 输出：('a', 'b')
```

`co_freevars` 是函数对象 `__code__` 属性上的一个字段，以元组形式列出了该函数所有的自由变量名。`f.__code__.co_freevars` 返回 `('a', 'b')`，说明 `inner` 有两个自由变量 `a` 和 `b`，它们都来自外层 `outer`。

对比普通函数的自由变量列表：

```python
def plain():
    x = 1
    return x

print(plain.__code__.co_freevars)  # 输出：()
```

`plain` 没有自由变量，所以 `co_freevars` 为空元组。`__closure__` 也为 `None`。这两个属性是一致的：有自由变量才有 cell，才有闭包。

这个概念在调试和理解闭包行为时非常重要——要判断一个函数是不是闭包、捕获了哪些外层变量，看 `co_freevars` 和 `__closure__` 即可。

### 2.6 闭包与 LEGB 作用域中的 E 层

Python 的变量查找规则遵循 LEGB：Local → Enclosing → Global → Built-in。其中 E 层（Enclosing function locals）特指外层函数的局部作用域，只在嵌套函数场景中存在。闭包正是 E 层机制的具体体现。

```python
x = "global"        # G 层

def outer():
    y = "enclosing" # E 层（对 inner 而言）

    def inner():
        z = "local" # L 层（对 inner 而言）
        # 查找顺序：z→y→x，分别命中 L、E、G
        return f"{z} / {y} / {x}"
    return inner

print(outer()())  # 输出：local / enclosing / global
```

E 层只在"函数嵌套"时才存在。如果没有嵌套，L 的上一层直接就是 G。闭包机制让内层函数在"未来被调用时"仍能访问 E 层变量，这超出了普通的作用域查找时机——普通函数调用结束后栈帧销毁，局部变量随之消失，但闭包通过 cell 对象让 E 层变量"延寿"。

可以这样理解：作用域规则定义了"在哪里能找到变量"，而闭包机制保证了"即便外层函数已经返回，这些变量依然可被内层函数找到"。闭包是 E 层查找规则的"持久化保障"。

需要强调的是，E 层查找只看"定义时"的外层函数，不看"调用时"的调用栈。也就是说，闭包的变量查找由函数定义的静态位置（词法作用域 / 静态作用域）决定，而非由调用链动态决定：

```python
def outer():
    value = "outer 的 value"
    def inner():
        return value   # value 由 inner 定义时的外层决定，固定指向 outer 的 value
    return inner

value = "global 的 value"
f = outer()
print(f())  # 输出：outer 的 value    ← 不是 "global 的 value"
```

即便调用 `f()` 时全局也有一个 `value`，`inner` 的自由变量 `value` 仍指向 `outer` 里的那个——这是词法作用域的体现，闭包捕获的是"定义环境"而非"执行环境"。

### 2.7 闭包的经典场景：计数器与累加器

把前面几节的内容串起来，用两个经典场景把闭包的用法讲透。

**计数器**

计数器是闭包最经典的入门示例。需求：一个可调用的"计数器"，每次调用返回当前计数并自增，多个计数器相互独立。

```python
def make_counter(start=0, step=1):
    """创建一个计数器闭包

    start: 初始值
    step:  每次自增的步长
    """
    current = start
    def counter():
        nonlocal current
        result = current
        current += step
        return result
    return counter

# 模拟两个独立的事件计数器
click_counter = make_counter()          # 从 0 开始，步长 1
error_counter = make_counter(start=0, step=1)  # 另一个独立计数器

print(click_counter())  # 输出：0
print(click_counter())  # 输出：1
print(click_counter())  # 输出：2

print(error_counter())  # 输出：0   ← 互不影响
print(error_counter())  # 输出：1

print(click_counter())  # 输出：3   ← click 继续从自己的 current 往下走
```

**累加器**

累加器类似计数器，但接受参数进行累加，常用于"收集总量"：

```python
def make_accumulator(initial=0):
    total = initial
    def add(n):
        nonlocal total
        total += n
        return total
    return add

revenue = make_accumulator()    # 模拟收入累计
print(revenue(100))  # 输出：100
print(revenue(50))   # 输出：150
print(revenue(200))  # 输出：350

cost = make_accumulator()       # 另一个独立累加器，用于成本
print(cost(30))     # 输出：30
print(cost(70))     # 输出：100

print(f"利润：{revenue(0) - cost(0)}")  # 输出：利润：250
```

**函数工厂 make_adder**

"函数工厂"指根据参数批量制造不同行为函数的模式，是闭包最自然的应用：

```python
def make_adder(n):
    def adder(x):
        return x + n
    return adder

add5 = make_adder(5)
add20 = make_adder(20)

print(add5(1))   # 输出：6
print(add5(2))   # 输出：7
print(add20(1))  # 输出：21
```

`make_adder` 像一个"函数工厂"，传入 `n` 就生产一个"加 n"的函数。每个生产出来的函数携带各自的 `n`，独立工作。这比每次都写一个 `def add5(x): return x+5` 要灵活得多。

### 2.8 闭包 vs 类实例：两种保存状态的方式

保存状态有两条路：闭包和类。它们在能力上是等价的（任何闭包能做的事，用类也能做，反之亦然），但风格和适用场合不同。

用类实现计数器：

```python
class Counter:
    def __init__(self, start=0, step=1):
        self.current = start
        self.step = step

    def __call__(self):
        result = self.current
        self.current += self.step
        return result

c = Counter(start=0, step=1)
print(c())  # 输出：0
print(c())  # 输出：1
print(c())  # 输出：2
```

用闭包实现：

```python
def make_counter(start=0, step=1):
    current = start
    def counter():
        nonlocal current
        result = current
        current += step
        return result
    return counter

c = make_counter(start=0, step=1)
print(c())  # 输出：0
print(c())  # 输出：1
print(c())  # 输出：2
```

两者用法几乎一致（都是 `c()` 调用），但内部机制不同：

| 维度       | 闭包                      | 类实例                      |
|------------|---------------------------|-----------------------------|
| 状态存储   | cell 对象（__closure__）  | 实例属性（self.xxx）         |
| 访问方式   | 内层函数直接引用自由变量  | 方法通过 self 访问属性       |
| 可读性     | 简洁，但 nonlocal 较隐晦  | 显式 self.xxx，状态更直观    |
| 扩展性     | 适合单一行为的简单场景    | 适合多方法、复杂行为的场景    |
| 调试       | __closure__ 不太直观      | 可以 print/self.__dict__     |

**选择建议**

- 只需要一个可调用对象、单一职责（如计数、累加、参数预设），用闭包更轻量。
- 需要多个方法、属性继承、复杂状态管理，用类更合适。
- 不确定时，优先类——它更易扩展、更易被他人理解。

### 2.9 闭包作为函数工厂的高级用法

闭包不止能保存状态，还能用来"预设参数"或"组合行为"，常见于回调注册、策略模式、配置注入等场景。

**回调注册（模拟事件系统）**

```python
def make_handler(button_name):
    def handle(event):
        return f"[{button_name}] 收到事件: {event}"
    return handle

handlers = [
    make_handler("保存"),
    make_handler("取消"),
    make_handler("帮助"),
]

for h in handlers:
    print(h("click"))
# 输出：
# [保存] 收到事件: click
# [取消] 收到事件: click
# [帮助] 收到事件: click
```

每个 handler 都"记住"了自己负责的按钮名，调用时不用再传按钮名进去——这等价于把部分参数提前绑定，剩下的参数在调用时再给。这种"部分参数预设"的思路，和 `functools.partial` 是同一类思想。

**带默认值的配置注入**

```python
def make_requester(base_url, timeout=5):
    def request(path):
        # 真实场景里这里会发 HTTP 请求，这里用打印模拟
        return f"GET {base_url}{path} (timeout={timeout}s)"
    return request

api = make_requester("https://api.example.com", timeout=10)
cdn = make_requester("https://cdn.example.com")

print(api("/users"))     # 输出：GET https://api.example.com/users (timeout=10s)
print(api("/orders"))    # 输出：GET https://api.example.com/orders (timeout=10s)
print(cdn("/logo.png"))  # 输出：GET https://cdn.example.com/logo.png (timeout=5s)
```

`api` 和 `cdn` 各自携带自己的 `base_url` 和 `timeout`，调用时只需传 `path`，极大地减少了重复参数。相比于每次都写 `request(path, base_url, timeout)`，闭包把"不变的配置"封装了起来，只暴露"每次变化的部分"。

### 2.10 闭包的惰性求值

闭包"携带环境但不立即执行"的特性，天然适合做惰性求值（lazy evaluation）——把计算延后到真正需要结果时再执行。

```python
def lazy_value(compute):
    """返回一个延迟计算的闭包，compute 是一个无参的可调用对象"""
    called = False
    cache = None
    def get():
        nonlocal called, cache
        if not called:
            cache = compute()   # 首次调用才真正执行 compute
            called = True
        return cache
    return get

import time

def slow_computation():
    print("正在执行耗时计算 ...")
    time.sleep(0.1)
    return 42

val = lazy_value(slow_computation)

print("闭包已创建，但还没执行计算")
print("第一次访问：", val())     # 此处才打印"正在执行耗时计算 ..."，输出：第一次访问：42
print("第二次访问：", val())     # 不再打印"正在执行耗时计算 ..."，输出：第二次访问：42
```

`val` 被创建时并没有执行 `slow_computation`；第一次调用 `val()` 时才真正执行并缓存结果；后续调用直接返回缓存。这就是"带缓存的惰性求值"，完全用闭包实现，没有用任何类。这种模式在配置加载、 ORM 查询、ORM 字段延迟加载等场景里非常常见。

---

## 3. 最佳实践

### 3.1 优先用 nonlocal 显式声明，避免隐式歧义

当内层函数需要"修改"外层变量时，必须用 `nonlocal` 显式声明。没有 `nonlocal`，内层函数对外层变量的赋值会创建一个新的局部变量，而不是修改外层变量，这会导致非预期行为甚至报错。

**推荐写法**

```python
def make_counter():
    count = 0
    def counter():
        nonlocal count       # 明确告诉 Python：count 是外层变量
        count += 1
        return count
    return counter
```

**不推荐写法（会报错）**

```python
def make_counter():
    count = 0
    def counter():
        count += 1           # 未声明 nonlocal，赋值导致 count 被当成局部变量
        return count         # 但 count += 1 先读取再赋值，读取时尚未赋值 → UnboundLocalError
    return counter

c = make_counter()
# c()  # 抛出 UnboundLocalError: local variable 'count' referenced before assignment
```

如果只是"读取"外层变量，不需要 `nonlocal`（E 层查找会自动找到）。但一旦涉及赋值（包括 `+=`、`-=` 这类复合赋值，本质是读取再赋值），就必须加 `nonlocal`。建议把"会不会改外层变量"想清楚再决定加不加——宁可显式，不要靠猜。

### 3.2 谨防循环变量延迟绑定陷阱

这是闭包最经典的"坑"。先看问题：

```python
funcs = []
for i in range(3):
    funcs.append(lambda: i)

# 期望：funcs[0]() 返回 0，funcs[1]() 返回 1，funcs[2]() 返回 2
# 实际：全部返回 2
print(funcs[0]())  # 输出：2
print(funcs[1]())  # 输出：2
print(funcs[2]())  # 输出：2
```

三个 lambda 闭包捕获的不是 `i` 的值，而是 `i` 这个变量。循环结束后 `i` 的值是 2，所以三个闭包在循环外调用时，读到的都是 2。这就是"延迟绑定"——闭包在"调用时"才去查找 `i` 的值，而非"定义时"。

**修复方法一：用默认参数把值"快照"到函数定义时**

```python
funcs = []
for i in range(3):
    funcs.append(lambda i=i: i)   # 默认参数 i=i 在定义时求值，把当时的 i 值固定下来

print(funcs[0]())  # 输出：0
print(funcs[1]())  # 输出：1
print(funcs[2]())  # 输出：2
```

默认参数的值在函数定义时（也就是每次循环迭代时）求值，因此 `i=i` 把当时的 `i` 值存为默认值。后续调用不传参时使用这个默认值，绕过了对循环变量 `i` 的引用。

**修复方法二：用一个工厂函数显式创建独立环境**

```python
def make_func(n):
    return lambda: n   # n 是 make_func 的参数，每次调用 make_func 都是独立环境

funcs = [make_func(i) for i in range(3)]

print(funcs[0]())  # 输出：0
print(funcs[1]())  # 输出：1
print(funcs[2]())  # 输出：2
```

这里的 `n` 是 `make_func` 的参数，每次 `make_func(i)` 都创建一个独立环境，lambda 捕获的是各自的 `n`，互不干扰。这是更"闭包正统"的写法——用额外的外层函数把循环变量"捕获"成各自独立的环境。

**修复方法三（Python 3）：直接用列表推导式配合工厂**

```python
funcs = [make_func(i) for i in range(3)]   # 同方法二
```

本质上与方法二一致，只是更紧凑。

**实践建议**：凡是在循环里创建闭包（lambda 或 def），都要警觉"这个闭包引用的循环变量在循环结束后值会变吗"。如果是，用默认参数快照或工厂函数捕获，确保闭包拿到的是循环当时的值。

### 3.3 不要过度用闭包替代类

闭包适合"单一行为 + 少量状态"的场景。如果发现一个闭包要持有五六重 state，还要提供多个不同行为（不止 `__call__`），那就该用类了。

**反例：闭包塞太多职责**

```python
def make_thing():
    a = 0
    b = 0
    c = 0
    def op1():
        nonlocal a, b, c
        ...
    def op2():
        nonlocal a, b, c
        ...
    # 要同时返回 op1、op2，还得让外部能分别调用，变得很别扭
    return op1, op2
```

要返回多个函数、共享同一组状态，闭包的写法会很别扭（要么返回元组，要么包成字典）。此时用类天然更合适：

```python
class Thing:
    def __init__(self):
        self.a = 0
        self.b = 0
        self.c = 0
    def op1(self):
        ...
    def op2(self):
        ...
```

**原则**：闭包是"轻量级状态封装"工具，不是"类的替代品"。状态多、行为多时，老老实实用类。

### 3.4 调试闭包时善用 __closure__ 和 co_freevars

当闭包行为不符合预期时，`__closure__` 和 `__code__.co_freevars` 是排查利器。

```python
def confusing_closure():
    data = [1, 2, 3]
    name = "test"
    flag = True

    def inner():
        return f"{name}: {flag}"
    return inner

f = confusing_closure()

# 看看 inner 捕获了哪些自由变量
print(f.__code__.co_freevars)  # 输出：('flag', 'name')  ← 注意：没用到 data，所以没捕获 data

# 看 cell 里的实际值
for var, cell in zip(f.__code__.co_freevars, f.__closure__):
    print(var, "=", cell.cell_contents)
# 输出：
# flag = True
# name = test
```

通过 `co_freevars` 能确知函数真正依赖哪些外层变量——只列出了"实际被引用的"自由变量，没被用到的外层变量不会出现。这对排查"为什么这个外层变量没被捕获"或"为什么捕获了一个我没意识到的变量"非常有用。

### 3.5 闭包持有引用可能造成内存"驻留"

因为闭包通过 cell 持有外层变量的引用，只要闭包还活着，这些变量就不会被回收。有时这会造成"以为已经不用了但还在内存里"的情况。

```python
def make_closure():
    big = list(range(1_000_000))   # 一个很大的列表
    def small():
        return len(big)            # 只用到 len，但持有整个 big 的引用
    return small

s = make_closure()
# 即使后续不再需要 big 的内容，只要 s 还在，big 就不会被回收
```

如果outer 里有一个很大的对象，但闭包只用其中一小部分，建议在闭包里只存需要的部分：

```python
def make_closure_better():
    big = list(range(1_000_000))
    needed = len(big)              # 提前算好，只存结果
    def small():
        return needed
    return small

s = make_closure_better()
# big 在 make_closure_better 返回后即可被回收，s 只持有 needed 这个 int
```

**实践建议**：闭包会持有它引用的所有外层变量的引用。如果外层有大型对象，确认闭包是否真的需要引用整对象，还是可以预先提取出小部分信息，避免无意中延长大型对象的生命周期。

### 3.6 闭包不是"私有"——可通过 __closure__ 访问

不要把闭包当成安全的"私有变量"机制。虽然外层变量看起来"封装"在闭包里，但通过 `__closure__` 仍可访问和修改：

```python
def make_secret():
    secret = "password123"
    def get():
        return secret
    return get

g = make_secret()
print(g())  # 输出：password123

# 并非真的私有，可被外部访问
print(g.__closure__[0].cell_contents)  # 输出：password123
g.__closure__[0].cell_contents = "hacked"
print(g())  # 输出：hacked
```

闭包提供的是一种"使用上的封装"，而非"访问控制"。如需真正的访问控制，仍应通过约定（下划线命名）或专门的封装模式去实现。

---

## 4. 原理

### 4.1 自由变量与 cell 对象：闭包的存储基础

闭包在 Python 中的实现核心是一个叫 **cell 对象**的特殊类型。每个 cell 对象可以理解为一个"间接层"——它本身不直接存储值，而是持有一个指向真正对象的引用。

为什么要引入这个间接层？考虑下面这个场景：

```python
def outer():
    value = 10
    def inner():
        return value
    return inner
```

`outer` 调用时，会在栈上创建一个栈帧（frame），其中有一个局部变量 `value` 指向整数 10。当 `outer` 返回 `inner` 函数对象后，`outer` 的栈帧会被销毁。如果 `inner` 直接引用 `value` 所在的那个栈帧槽位，栈帧销毁后这个槽位也就没了，`inner` 也就读不到 `value` 了。

为了解决"栈帧销毁后变量仍需存活"的问题，Python 引入了 cell：在涉及闭包时，外层函数的局部变量并不是直接存在栈帧的普通槽位中，而是存在 cell 对象里，栈帧里存的是对 cell 的引用；内层函数也持有同一个 cell 的引用。这样即便外层栈帧销毁，只要内层函数（闭包）还存活，它持有的 cell 引用就还在，cell 指向的值也就还在。

用 id 和类型来观察这个过程：

```python
def outer():
    value = 10
    def inner():
        return value
    print("inner 的 cell:", inner.__closure__)
    print("cell 类型:", type(inner.__closure__[0]))
    print("初始 cell_contents:", inner.__closure__[0].cell_contents)
    value = 20   # 改变 value
    print("改变后 cell_contents:", inner.__closure__[0].cell_contents)
    return inner

f = outer()
# 输出（示意）：
# inner 的 cell: (<cell at 0x10a...: int object 0x...>,)
# cell 类型: <class 'cell'>
# 初始 cell_contents: 10
# 改变后 cell_contents: 20

print("外部调用后 cell_contents:", f.__closure__[0].cell_contents)
# 输出：外部调用后 cell_contents: 20
```

注意：即便 `outer` 已经返回、栈帧已销毁，通过 `f.__closure__[0]` 仍能读到 cell，cell 里存的还是 20。这就是 cell"延寿"的效果。

### 4.2 co_freevars 字段：函数对象记录的自由变量

每个函数对象都有一个 `__code__` 属性，它是 code 对象，承载函数的字节码与若干元信息。其中 `co_freevars` 是一个字符串元组，列出该函数的所有自由变量名（按定义时的顺序）。

```python
def make_power_calculator(base, exponent):
    def compute():
        return base ** exponent    # base、exponent 是自由变量
    return compute

p = make_power_calculator(2, 10)
print(p.__code__.co_freevars)  # 输出：('base', 'exponent')
print(p.__code__.co_freevars[0])  # 输出：base
```

`co_freevars` 里出现 `('base', 'exponent')`，说明 `compute` 这个函数引用了两个外层变量。这个名字列表与 `__closure__` 里的 cell 元组一一对应：

```python
for name, cell in zip(p.__code__.co_freevars, p.__closure__):
    print(f"{name} = {cell.cell_contents}")
# 输出：
# base = 2
# exponent = 10
```

`co_freevars` 是"变量名"，`__closure__` 是"变量值（通过 cell 间接持有）"，两者一一对应，共同构成闭包的"环境信息"。

值得指出的是，`co_freevars` 只列"实际被内层函数引用的"外层变量。如果外层有一堆局部变量但内层函数没用到，它们不会出现在 `co_freevars` 里，也不会被捕获到 `__closure__` 里——这进一步印证了"闭包只捕获被引用的变量"。

```python
def outer():
    used = 1
    unused = 2
    big_list = list(range(1000))
    def inner():
        return used     # 只用到 used
    return inner

f = outer()
print(f.__code__.co_freevars)  # 输出：('used',)  ← 只捕获 used
print(len(f.__closure__))      # 输出：1
```

`unused` 和 `big_list` 都不会被捕获到 `__closure__` 里——它们在 `outer` 返回后就可以进入正常的垃圾回收流程（除非有其他引用指向它们）。这说明 cell 的创建是"按需的"，捕获不会无谓地延长无关变量的生命周期。

### 4.3 LOAD_DEREF / STORE_DEREF：操作 cell 的字节码

在字节码层面，读写自由变量不是用 `LOAD_FAST`（读写普通局部变量）或 `LOAD_GLOBAL`（读写全局变量），而是用专门操作 cell 的指令：

- `LOAD_DEREF`：从 cell 中读取值（解引用 cell 后取到真正的对象）。
- `STORE_DEREF`：把一个值写入 cell（让 cell 指向新的对象）。
- `LOAD_CLOSURE`：把 cell 本身（不是 cell 里的值）压入栈顶，用于构造闭包或传递 cell 引用。

用 `dis` 模块查看内层函数的字节码：

```python
import dis

def make_adder(n):
    def adder(x):
        return x + n
    return adder

add3 = make_adder(3)
print("adder 的 co_freevars:", add3.__code__.co_freevars)   # 输出：('n',)
print("--- adder 字节码 ---")
dis.dis(add3)
```

典型的字节码大致如下（不同 Python 版本细节可能略有差异）：

```
  3           0 LOAD_FAST                0 (x)
              2 LOAD_DEREF               0 (n)     ← 读取自由变量 n（从 cell）
              4 BINARY_ADD
              6 RETURN_VALUE
```

其中 `LOAD_DEREF 0 (n)` 就是从 `__closure__` 的第 0 个 cell 里取出 `n` 的值。`LOAD_FAST 0 (x)` 是普通局部变量 `x`，读取方式完全不同。

再看一个带 `nonlocal` 赋值的例子，对比 `STORE_DEREF`：

```python
def make_counter():
    count = 0
    def counter():
        nonlocal count
        count += 1
        return count
    return counter

c = make_counter()
print("counter 的 co_freevars:", c.__code__.co_freevars)   # 输出：('count',)
print("--- counter 字节码 ---")
dis.dis(c)
```

典型字节码大致如下：

```
  4           0 LOAD_DEREF               0 (count)   ← 读 cell 里的 count
              2 LOAD_CONST               1 (1)
              4 INPLACE_ADD
              6 STORE_DEREF               0 (count)   ← 写回 cell
  5           8 LOAD_DEREF               0 (count)   ← 再次读 cell
             10 RETURN_VALUE
```

`count += 1` 展开成"读—加—写"三步：`LOAD_DEREF` 读 cell，`INPLACE_ADD` 加 1，`STORE_DEREF` 写回 cell。这就是 `nonlocal count` 在字节码层面的体现——通过 cell 间接读写外层 `count`。

如果没有 `nonlocal`，`count += 1` 会被编译成 `LOAD_FAST` + `STORE_FAST`（操作局部变量），那时 `count` 会被当作 `counter` 自己的局部变量；但 `LOAD_FAST` 一个未赋值的局部变量会触发 `UnboundLocalError`，前文"不推荐写法"的报错就是从这里来的。

### 4.4 闭包为什么能"记住"外层变量

综合前几节，可以完整回答这个问题：**闭包能"记住"外层变量，是因为内层函数持有的不是外层变量的值拷贝，而是对 cell 对象的引用，cell 对象又持有真正的值**。

完整链条如下：

1. 当 Python 编译 `outer` 时，发现 `inner` 引用了 `outer` 的局部变量（如 `n`），就会把 `n` 标记为"cell 变量"（`co_cellvars`），使 `n` 不直接存在栈帧的普通局部槽位，而是存到 cell 里，`outer` 的栈帧持有这个 cell 的引用。
2. 同时，`inner` 的 `co_freevars` 会记下 `n`，`inner` 的 `__closure__` 在运行时持有同一个 cell 的引用。
3. `outer` 返回 `inner` 后，`outer` 栈帧销毁，但 cell 还活着——因为 `inner`（即闭包）持有它的引用，引用计数不为 0，不会被回收。
4. 后续调用 `inner()` 时，通过 `LOAD_DEREF` 从 cell 中读取 `n` 的值，这个 cell 正是当年 `outer` 创建的那个。

来看一个能体现"cell 共享"的实验：

```python
def make_pair():
    shared = 0
    def getter():
        return shared
    def setter(v):
        nonlocal shared
        shared = v
    return getter, setter

g, s = make_pair()

print(g())                 # 输出：0
s(42)
print(g())                 # 输出：42
print(g.__closure__[0] is s.__closure__[0])  # 输出：True   ← 同一个 cell！
```

`g` 和 `s` 捕获的是同一个 `shared` cell（`is` 比较为 True）。`s` 通过 `STORE_DEREF` 改写 cell 内容，`g` 通过 `LOAD_DEREF` 读到的就是新值。这就是"以函数对封装可变状态"的底层机制——多个闭包共享外层的同一个 cell。

再验证"不同外层调用产生不同 cell"：

```python
g1, s1 = make_pair()
g2, s2 = make_pair()

print(g1.__closure__[0] is g2.__closure__[0])  # 输出：False   ← 不同次调用，不同 cell
s1(100)
s2(200)
print(g1())  # 输出：100
print(g2())  # 输出：200
```

不同 `make_pair()` 产生的闭包持有不同 cell，互不干扰——对应"每次外层调用都是独立环境"的现象。

### 4.5 闭包与 LEGB 的 E 层如何对应

前文提到 E 层是"外层函数的局部作用域"，而闭包是 E 层的"持久化保障"。这里从实现层面把它们对应起来：

- **E 层查找的对象**：在存在嵌套函数时，外层函数的某些局部变量被存到 cell 中（`co_cellvars` 标记），内层函数通过 `__closure__` 引用这些 cell。E 层查找在实际执行时，就是通过 `LOAD_DEREF` 从 `__closure__` 里拿对应 cell。
- **E 层的存在前提**：只有在"函数定义时处于另一个函数体内"时才有 E 层。这和词法作用域对应——E 层由代码书写的静态嵌套结构决定，不由调用链动态决定。
- **E 层的延寿**：通常函数返回后栈帧销毁，局部变量也就没了。但 cell 机制让"被内层引用的那些"局部变量存活到"内层不再被引用"为止。这正是闭包"携带环境"的本质。

用一个例子把 LEGB 四层和对应的字节码操作整理在一起：

```python
BUILTIN = "builtins_print"   # 演示用，实际 builtins 不用这么写

g_var = "global"

def outer():
    e_var = "enclosing"

    def inner():
        l_var = "local"
        return (l_var, e_var, g_var, len)   # L、E、G、B 四层依次体现

    return inner

f = outer()
print(f())  # 输出：('local', 'enclosing', 'global', <built-in function len>)
print(f.__code__.co_freevars)  # 输出：('e_var',)
```

- `l_var`：L 层，字节码 `LOAD_FAST`。
- `e_var`：E 层，字节码 `LOAD_DEREF`，通过 `__closure__` 里的 cell 读取。
- `g_var`：G 层，字节码 `LOAD_GLOBAL`，从模块全局字典读取。
- `len`：B 层，同样 `LOAD_GLOBAL`，从 builtins 模块的字典读取。

用 `dis` 验证：

```python
import dis
print("--- inner 字节码 ---")
dis.dis(f)
```

典型输出会包含：

```
  LOAD_FAST                0 (l_var)       ← L
  LOAD_DEREF               0 (e_var)       ← E
  LOAD_GLOBAL              1 (g_var)       ← G
  LOAD_GLOBAL              2 (len)         ← B
  ...
```

可以清楚看到 E 层的 `e_var` 走 `LOAD_DEREF`，与 L 层 `LOAD_FAST` 和 G/B 层 `LOAD_GLOBAL` 不同。这条字节码的差别，就是闭包在实现层面的"身份标识"。

### 4.6 外层函数的 co_cellvars：被捕获变量的标记

前面讲内层函数的 `co_freevars`，对应地，外层函数的 `__code__.co_cellvars` 记录"本函数中哪些局部变量被内层函数引用"。这就是 Python 编译器在编译外层函数时做的"预判"——它发现某些变量会构成闭包，于是提前把它们做成 cell。

```python
def outer():
    captured = 1      # 会被内层引用，应出现在 co_cellvars
    not_captured = 2  # 不会被内层引用，不应出现

    def inner():
        return captured
    return inner

print(outer.__code__.co_cellvars)  # 输出：('captured',)
```

`co_cellvars` 是 `('captained',)` 而不包含 `not_captured`，说明只有"被内层引用的变量"才会被标记为 cell 变量。这也解释了前文"闭包只捕获被引用的变量"——编译器是按引用来决定 cell 化的，不是无差别地把外层所有局部变量都做成 cell。

对应关系总结：

- 外层函数 `co_cellvars`：被内层引用的局部变量名（外层"知道"要把它做成 cell）。
- 内层函数 `co_freevars`：它引用的外层变量名（内层"知道"要从 cell 读哪些自由变量）。
- 内层函数 `__closure__`：与 `co_freevars` 一一对应的 cell 元组（运行时真正持有这些变量）。

```python
def outer():
    a = 1
    b = 2
    def inner():
        return a + b
    return inner

f = outer()
print("outer 的 co_cellvars:", outer.__code__.co_cellvars)   # 输出：('a', 'b')
print("inner 的 co_freevars:", f.__code__.co_freevars)        # 输出：('a', 'b')
print("inner 的 __closure__:", f.__closure__)                 # 两个 cell
print("closure 长度:", len(f.__closure__))                    # 输出：2
```

这三个字段共同构成了"闭包在代码与运行时之间的桥梁"，理解它们就掌握了 Python 闭包的实现全貌。

### 4.7 闭包创建与调用的完整时序

把前面所有机制串起来，看一次完整的"创建—调用"时序，加深对原理的整体理解。

```python
def make_adder(n):
    def adder(x):
        return x + n
    return adder

add3 = make_adder(3)
result = add3(5)
print(result)  # 输出：8
```

时序如下：

1. **编译阶段**（模块加载时）：Python 编译 `make_adder`，发现 `adder` 引用了 `n`，于是把 `n` 加入 `make_adder` 的 `co_cellvars`，把 `n` 加入 `adder` 的 `co_freevars`。
2. **`make_adder(3)` 调用**：创建 `make_adder` 栈帧。因为 `n` 是 cell 变量，栈帧里不直接存 3，而是创建一个 cell 对象，cell 内部指向 3；栈帧里的 `n` 槽位存的是这个 cell 的引用。
3. **执行 `def adder(x): ...`**：创建 `adder` 函数对象。它的 `__closure__` 被设置为 `(n_cell,)`——即外层创建的那个 cell 的元组。此时 `adder` 和 `make_adder` 的栈帧共享同一个 cell。
4. **`return adder`**：`adder` 函数对象被返回给调用者，绑定到 `add3`。`make_adder` 栈帧随后销毁，但 cell 还活着——因为 `add3.__closure__` 持有它，引用计数不为 0。
5. **`add3(5)` 调用**：创建 `adder` 栈帧，`x` 作为普通局部变量压入。执行 `return x + n` 时，`x` 用 `LOAD_FAST` 读取，`n` 用 `LOAD_DEREF` 从 `__closure__[0]` 这个 cell 里读取（得到 3）。两者相加得 8，返回。
6. **结果 8**：打印输出 8。

整个过程的关键在于步骤 2 和步骤 4：cell 把"本应随栈帧销毁"的 `n` 从栈帧解耦，让它的生命周期跟随闭包而不是跟随外层函数的调用栈。这就是"闭包携带环境"在底层实现上的完整图景。

---

## 5. 总结

### 5.1 本文内容要点

- 闭包是"携带了其定义环境变量的函数"，即内层函数引用外层函数的局部变量，外层函数返回后这些变量仍存活。
- 闭包 = 函数对象 + 它引用的环境变量（cell）。
- 形成闭包的三条件：嵌套函数定义、内层引用外层变量、外层返回内层函数。
- 闭包捕获的是变量本身（cell 引用），而非值快照；通过 `nonlocal` 可在内层修改外层变量。
- 每次外层调用创建独立的闭包环境，多个闭包实例互不干扰。
- `__closure__` 是 cell 元组，`cell.cell_contents` 查看捕获值；`__code__.co_freevars` 列出自由变量名。
- 自由变量是函数体内引用但在自身作用域未定义的变量，沿 LEGB 的 E 层查找。
- 闭包与 LEGB 的 E 层对应；查找由定义时的静态位置决定（词法作用域）。
- 闭包与类实例都能保存状态，闭包适合轻量单一行为，类适合复杂多行为。
- 循环中创建闭包要警惕延迟绑定陷阱，用默认参数快照或工厂函数修复。
- 原理层面：外层 `co_cellvars` 标记 cell 变量，内层 `co_freevars` + `__closure__` 持有 cell，`LOAD_DEREF` / `STORE_DEREF` 在字节码层操作 cell，cell 的引用计数让外层变量在外层栈帧销毁后仍存活。

### 5.2 读完应能掌握的能力

- 能准确说出闭包的定义，并解释"外层函数返回后变量为何仍存活"。
- 能识别一段代码是否构成闭包（三条件判断），并能说明为什么。
- 能用闭包实现计数器、累加器、函数工厂、惰性求值等常见模式。
- 能正确使用 `nonlocal` 让闭包修改外层变量，并能解释不加 `nonlocal` 会报什么错、为什么。
- 能用 `__closure__` 和 `co_freevars` 查看、调试闭包捕获了哪些变量及其当前值。
- 能识别循环变量延迟绑定陷阱，并用默认参数或工厂函数正确修复。
- 能在闭包与类之间做合理取舍：单一行为选闭包，多行为选类。
- 能从 cell 对象、`co_cellvars`/`co_freevars`、`LOAD_DEREF`/`STORE_DEREF` 字节码层面解释闭包的实现机制。
- 能说明"不同外层调用产生独立 cell"和"同一外层调用内的多个闭包共享同一组 cell"两种现象的底层原因。
