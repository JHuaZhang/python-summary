---
group:
  title: 【12】函数核心机制
  order: 12
order: 12
title: nonlocal修改外层局部变量
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 nonlocal

在 Python 里，函数可以嵌套定义：一个函数内部还可以再定义另一个函数。当内层函数想"修改"外层函数里定义的局部变量时，直接赋值会出一个看似奇怪的 bug——本来想改外层那个变量，结果 Python 把它当成了一个全新的局部变量，外层那个值根本没被改动，甚至还会报 `UnboundLocalError`。

`nonlocal` 关键字就是为了解决这件事。它是一条声明，放在内层函数里，告诉解释器："这个名字不是本函数的局部变量，也不是模块级全局变量，而是外面那层（或者更外层）函数的局部变量，请帮我绑定到那一个。"在此之后，对该名字的赋值，修改的就是外层那个变量本身，而不是新建一个。

需要先分清三类变量作用域，这是理解 `nonlocal` 的前提：

| 作用域                               | 名字来源                     | 关键字         |
| ------------------------------------ | ---------------------------- | -------------- |
| 局部（local）                        | 当前函数体内定义             | 默认，无需声明 |
| 外层函数局部（enclosing / nonlocal） | 包裹当前函数的外层函数里定义 | `nonlocal`     |
| 全局（global）                       | 模块顶层定义                 | `global`       |

`nonlocal` 瞄准的是中间那一层——**enclosing function scope**，也就是"外层函数的局部作用域"。它和 `global` 是平行但完全不同的两件事：`global` 指向模块级，`nonlocal` 指向外层函数级。它们都不会"自动推断"，必须显式声明。

### 1.2 为什么需要 nonlocal

先看一段不需要 `nonlocal` 的代码——内层函数只是"读"外层变量，这总是没问题的：

```python
def outer():
    count = 0          # 外层函数的局部变量

    def inner():
        print(count)   # 读外层变量，OK，闭包自动捕获

    inner()

outer()
# 输出：0
```

内层函数 `inner` 里没有 `count` 这个名字，Python 向外一层查，找到 `outer` 里的 `count`，于是读到 `0`。这就是闭包的"读"能力，不需要任何关键字。

但是一旦你想"写"——比如让 `count` 每次调用加 1——问题就来了：

```python
def outer():
    count = 0

    def inner():
        count = count + 1   # 想改外层 count，但……
        print(count)

    inner()

outer()
# 输出：UnboundLocalError: local variable 'count' referenced before assignment
```

为什么报错？因为在函数体内出现 `count = ...` 这种赋值语句，Python 在编译阶段就会把 `count` 标记为**当前函数的局部变量**。于是 `count + 1` 里的那个 `count` 也被当作局部变量，而此时它还没被赋值（赋值在右边），于是触发 `UnboundLocalError`。

注意：**赋值语句不仅包括 `=`，还包括 `+=`、`-=` 这类增强赋值，以及 `del`、`await` 等绑定操作。** 也就是说 `count += 1` 同样会触发上面这个问题。

解决办法就是显式告诉 Python：`count` 不是本函数的局部变量，是外层的：

```python
def outer():
    count = 0

    def inner():
        nonlocal count    # 声明：count 来自外层函数
        count = count + 1 # 现在这句真的改了外层的 count
        print(count)

    inner()

outer()
# 输出：1
```

这一行 `nonlocal count` 就是 `nonlocal` 的全部语法。它本身不创建变量，也不赋值，只是一条"绑定声明"，改变编译器对后续 `count` 这个名字的处理方式。

### 1.3 最小语法形式

`nonlocal` 的语法非常简单：

```python
nonlocal <名字1>[, <名字2>, ...]
```

- 它只能出现在**函数体的第一行可执行语句之前**（确切说是与 `global` 一样，必须在使用该名字之前声明，且不能在被声明的名字使用之后才出现）。
- 名字是**标识符**，不带括号、不带引号。
- 可以同时声明多个名字：`nonlocal a, b, c`。
- 不能与同一函数内的 `global` 声明同一个名字（会报 `SyntaxError`）。
- 声明的名字必须是真的存在于某一层外层函数的局部作用域中，否则 `SyntaxError`。

最小可运行示例：

```python
def f():
    x = 10

    def g():
        nonlocal x
        x = 20

    g()
    print(x)

f()
# 输出：20
```

`g` 内部对 `x` 的赋值，通过 `nonlocal` 绑定到了 `f` 的 `x`，所以 `f` 里的 `x` 被改成 `20`。这就是 `nonlocal` 最核心的作用：**让内层函数能修改外层函数的局部变量。**

---

## 2. 核心内容

### 2.1 nonlocal 的基本行为：读、写与绑定层级

`nonlocal` 声明后，该名字在内层函数里的"读"和"写"都指向同一个外层变量。要真正理解它，得先搞清楚它绑定到**哪一层**——不是随便一层，而是"最近一层定义了该名字的外层函数"。

**绑定到最近一层外层**

```python
def outer():
    x = "outer 的 x"

    def middle():
        x = "middle 的 x"   # 这一层也定义了 x

        def inner():
            nonlocal x       # 绑定到最近一层定义 x 的外层 —— middle
            x = "inner 修改后"

        inner()
        print("middle 里 x =", x)

    middle()
    print("outer 里 x =", x)

outer()
# 输出：
# middle 里 x = inner 修改后
# outer 里 x = outer 的 x
```

`inner` 里的 `nonlocal x` 不是无脑找最外层，而是**从内向外查找，找到第一个定义了 `x` 的外层函数就绑定到那一层**。这里 `middle` 已经定义了 `x`，所以绑定到 `middle`，`outer` 的 `x` 纹丝不动。

如果中间层没有定义 `x`，才会继续向外找：

```python
def outer():
    x = "outer 的 x"

    def middle():
        # middle 里没有定义 x
        def inner():
            nonlocal x       # middle 没有，向外找到 outer
            x = "inner 修改后"

        inner()
        print("middle 执行完")

    middle()
    print("outer 里 x =", x)

outer()
# 输出：
# middle 执行完
# outer 里 x = inner 修改后
```

**只影响"读写绑定"，不影响名字本身的销毁时机**

`nonlocal` 不会把外层变量"搬"到内层，也不会延长外层变量的生命周期——延长生命周期是闭包本身做的事（只要内层函数还活着，它引用的外层变量就不会随外层函数返回而销毁）。`nonlocal` 只是把内层函数里那个名字的读写目标，定位到外层那一份存储上。

**`nonlocal` 不能跨越到模块全局**

```python
x = "模块全局"

def f():
    nonlocal x    # 报错：外层函数里没有 x
    x = "改了"
```

运行结果：

```
SyntaxError: no binding for nonlocal 'x' declared
```

因为模块顶层不是"外层函数"，`nonlocal` 根本看不到模块级的 `x`。要改模块全局，必须用 `global`。

### 2.2 nonlocal 与 global 的区别

这两个关键字经常被放在一起讲，因为形式对称，但它们指向的存储位置完全不同。理解差异是掌握 `nonlocal` 的关键一步。

**作用对象对照表**

| 维度                         | `nonlocal`                        | `global`                                                        |
| ---------------------------- | --------------------------------- | --------------------------------------------------------------- |
| 指向的作用域                 | 外层函数的局部作用域（enclosing） | 模块级全局作用域                                                |
| 必须存在的位置               | 某一层包裹当前函数的外层函数体内  | 模块顶层（即便还没定义也允许，`global` 可在模块首次赋值时创建） |
| 找不到时报什么               | `SyntaxError`（编译期就能查出）   | 不报错，会在模块全局新建该名字                                  |
| 典型用途                     | 闭包里修改外层状态                | 函数里读写模块级变量/常量                                       |
| 能否指向内置（builtins）名字 | 否                                | 否（`global` 也只指向模块全局，不指向 `builtins`）              |

**对比演示**

```python
x = "模块全局 x"

def demo():
    x = "demo 的局部 x"

    def inner_global():
        global x            # 指向模块全局
        x = "被 inner_global 修改"

    def inner_nonlocal():
        nonlocal x          # 指向 demo 的局部 x
        x = "被 inner_nonlocal 修改"

    inner_nonlocal()
    print("调用 inner_nonlocal 后，demo 的 x =", x)

    inner_global()
    print("调用 inner_global 后，模块全局 x =", x)

demo()
print("模块全局 x =", x)
# 输出：
# 调用 inner_nonlocal 后，demo 的 x = 被 inner_nonlocal 修改
# 调用 inner_global 后，模块全局 x = 被 inner_global 修改
# 模块全局 x = 被 inner_global 修改
```

同一个函数里同名的 `x`，因为声明的关键字不同，一个改的是 `demo` 的局部变量，一个改的是模块全局变量，互不干扰。这就是它们最本质的差别——**绑定到不同层的存储**。

**不能同时声明同一个名字**

```python
x = 1
def f():
    x = 2
    def g():
        global x
        nonlocal x     # SyntaxError：同一个名字不能既是 global 又是 nonlocal
        x = 3
    g()
```

```
SyntaxError: name 'x' is nonlocal and global
```

一个名字只能属于一种绑定方式，不能脚踩两只船。

### 2.3 nonlocal 是闭包"写入"的机制

这是个需要反复强调的点：**闭包默认只能"读"外层变量，要"写"必须借助 `nonlocal`。**

之所以这样设计，和 Python 的变量绑定规则有关：在函数体内只要出现赋值（`=`、`+=`、`del` 等），那个名字就会被编译为当前函数的局部变量。这会让内层函数"看不到"外层名字，必须用 `nonlocal` 把它"拽回来"。

来看一个对比，同一个累加器，不加 `nonlocal` 和加了 `nonlocal` 的区别：

**不加 nonlocal（错误版本）**

```python
def make_adder(bad=False):
    total = 0

    def add(n):
        if bad:
            total = total + n   # total 变成局部变量，报错
        return total

    return add
```

调用：

```python
adder = make_adder(bad=True)
adder(5)
# 输出：UnboundLocalError: local variable 'total' referenced before assignment
```

**加 nonlocal（正确版本）**

```python
def make_adder():
    total = 0

    def add(n):
        nonlocal total
        total += n
        return total

    return add

adder = make_adder()
print(adder(5))   # 输出：5
print(adder(3))   # 输出：8
print(adder(10))  # 输出：18
```

`make_adder` 调用完毕后，它的局部变量 `total` 本应该随函数返回被回收。但因为返回的 `add` 闭包还在引用它，它被"保留"了下来，成为闭包的私有状态。`nonlocal total` 让 `add` 每次都能真正修改这个被保留的状态，而不是在 `add` 内部新建一个同名局部变量。这就是闭包计数器/累加器能工作的底层机制。

**读不冲突，写才需要 nonlocal**

```python
def make_multiplier(factor):
    def multiply(x):
        return x * factor   # 只读 factor，不需要 nonlocal
    return multiply

dbl = make_multiplier(2)
trp = make_multiplier(3)
print(dbl(10))  # 输出：20
print(trp(10))  # 输出：30
```

这里 `factor` 只被读取，闭包通过 cell 把它捕获进 `__closure__`，不需要 `nonlocal`。每个 `make_multiplier` 调用都有自己独立的 `factor`，所以 `dbl` 和 `trp` 互不干扰——这就是闭包"读"外层变量的典型用法。

### 2.4 典型场景一：计数器闭包

计数器是 `nonlocal` 最经典的场景。需求很常见：做一个可以被反复调用、每次返回"下一个数字"的对象，但又不想用一个暴露在模块顶层的全局变量来记状态。闭包 + `nonlocal` 正好满足。

**基础计数器**

```python
def make_counter(start=0, step=1):
    count = start

    def counter():
        nonlocal count
        count += step
        return count

    return counter

# 一个从 0 开始、步长为 1 的计数器
c = make_counter()
print(c())  # 输出：1
print(c())  # 输出：2
print(c())  # 输出：3

# 一个从 10 开始、步长为 5 的计数器
c2 = make_counter(start=10, step=5)
print(c2())  # 输出：15
print(c2())  # 输出：20
print(c())   # 输出：4  —— 两套计数器状态互不干扰
```

注意 `c` 和 `c2` 的状态互不影响：每次调用 `make_counter` 都会创建一份新的 `count`，被各自的 `counter` 闭包捕获。这就是闭包相对于"一个全局变量记所有计数"的巨大优势——**状态被私有化、实例化**，不会互相污染。

**带可重置的计数器**

```python
def make_resumable_counter(start=0, step=1):
    count = start

    def advance():
        nonlocal count
        count += step
        return count

    def reset():
        nonlocal count
        count = start
        return count

    # 返回两个操作，共享同一个 count
    return advance, reset

adv, rst = make_resumable_counter(step=2)
print(adv())  # 输出：2
print(adv())  # 输出：4
print(adv())  # 输出：6
print(rst())  # 输出：0   —— 回到起点
print(adv())  # 输出：2
```

这里 `advance` 和 `reset` 两个闭包共享同一个 `count`，因为它们都是在同一次 `make_resumable_counter` 调用里定义的，`nonlocal count` 绑定到的是同一份外层存储。

### 2.5 典型场景二：累加器

累加器与计数器形式类似，但接受参数，把每次传入的值累加到状态里。

```python
def make_accumulator(initial=0):
    total = initial

    def add(n):
        nonlocal total
        total += n
        return total

    return add

ac = make_accumulator(100)
print(ac(10))   # 输出：110
print(ac(20))   # 输出：130
print(ac(-5))   # 输出：125
```

**带历史记录的累加器**

把 `nonlocal` 的状态变量改成一个 `list`，就能记录每次传入的值：

```python
def make_logger_accumulator(initial=0):
    total = initial
    history = []

    def add(n):
        nonlocal total
        total += n
        history.append(n)          # list 是可变对象，append 不算"赋值"，不需要 nonlocal
        return total, list(history)

    return add

la = make_logger_accumulator()
print(la(3))   # 输出：(3, [3])
print(la(5))   # 输出：(8, [3, 5])
print(la(2))   # 输出：(10, [3, 5, 2])
```

这里有个细节值得注意：`total` 是不可变对象（整数），`total += n` 等价于 `total = total + n`，是赋值，所以需要 `nonlocal total`。而 `history.append(n)` 是对可变列表的就地修改，并不重新绑定 `history` 这个名字，所以**不需要** `nonlocal history`。这是一个常见的迷惑点，下一节会专门展开。

### 2.6 nonlocal 与可变对象的微妙关系

很多人第一次学 `nonlocal` 都会困惑：为什么修改列表 `lst.append(x)` 不用 `nonlocal`，而修改整数 `n += 1` 就要用？

关键在于 Python 区分两种"修改"：

- **重新绑定名字**：`x = ...`、`x += ...`（对不可变对象而言）、`del x`。这些会改变 `x` 指向哪个对象，属于绑定操作，在函数内会创建局部变量，因此需要 `nonlocal`。
- **就地修改对象**：`lst.append(x)`、`d[k] = v`、`obj.attr = v`。这些不改变名字指向哪个对象，只改对象内部，不涉及变量绑定规则，**不需要 `nonlocal`**。

**对比演示**

```python
def outer():
    n = 0
    lst = []

    def inner():
        # lst.append(n) 不需要 nonlocal，因为不重新绑定 lst
        lst.append(n)

        # 但下面这行不写 nonlocal n 就会出错：
        # n = n + 1   # UnboundLocalError

        # 正确做法
        nonlocal n
        n = n + 1

    inner()
    print("n =", n)
    print("lst =", lst)

outer()
# 输出：
# n = 1
# lst = [0]
```

注意上面 `nonlocal n` 出现在 `n = n + 1` 之前才合法；如果把它放到 `n = n + 1` 之后，就会先把 `n` 当成局部变量，依然报错。所以实际写代码时，习惯把所有 `nonlocal` / `global` 声明放在函数体最前面，跟导入语句一样整齐。

**对象内部改写：用可变容器"模拟" nonlocal**

在 Python 2 里没有 `nonlocal`，那时候要让内层函数修改外层状态，惯用做法是用一个可变容器（通常用列表）来"绕过"重新绑定：

```python
def make_counter_py2():
    count = [0]              # 用列表包一层

    def counter():
        count[0] += 1        # 修改的是列表内容，不是重新绑定 count
        return count[0]

    return counter

c = make_counter_py2()
print(c())  # 输出：1
print(c())  # 输出：2
```

这种写法在 Python 3 里已经被 `nonlocal` 取代，更直接、更清晰。但理解它有助于明白为何 `lst.append` 不需要 `nonlocal`——本质上就是"改对象不改名字"。

### 2.7 典型场景三：带状态的生成器

生成器（`yield`）天然有"挂起-恢复"的状态保持能力，但有时候我们想用一个普通函数返回一个"可被反复调用、内部有状态"的对象，又不希望状态暴露到外部。这时闭包 + `nonlocal` 比生成器更合适。

次序号生成器示例：

```python
def make_sequential_id(prefix="ID"):
    seq = 0

    def next_id():
        nonlocal seq
        seq += 1
        return f"{prefix}-{seq:04d}"

    return next_id

gen = make_sequential_id("ORD")
print(gen())  # 输出：ORD-0001
print(gen())  # 输出：ORD-0002
print(gen())  # 输出：ORD-0003

# 另一套独立序列
user_gen = make_sequential_id("USER")
print(user_gen())  # 输出：USER-0001
print(gen())       # 输出：ORD-0004 —— 两套互不影响
```

**带"暂停-继续"状态的小型状态机**

```python
def make_traffic_light():
    colors = ["红", "绿", "黄"]
    state = {"idx": 0, "paused": False}

    def next_color():
        nonlocal state            # 注意：state 是不可变绑定么？不，state 是名字，需 nonlocal 吗？
        # state 是字典，这里没有重新绑定 state，只改它内部，所以其实不需要 nonlocal
        if state["paused"]:
            return "（暂停）"
        idx = state["idx"]
        state["idx"] = (idx + 1) % len(colors)
        return colors[idx]

    def pause():
        state["paused"] = True

    def resume():
        state["paused"] = False

    return next_color, pause, resume

nxt, pause, resume = make_traffic_light()
print(nxt())  # 输出：绿
print(nxt())  # 输出：黄
print(nxt())  # 输出：红
pause()
print(nxt())  # 输出：（暂停）
resume()
print(nxt())  # 输出：绿
```

上面的 demo 故意保留了一段"要不要 nonlocal"的自问自答，用来强化上一节的规则：`state` 是字典名字，函数内只是改它的内容（`state["idx"] = ...`），并没有写 `state = ...`，所以**不需要** `nonlocal state`。如果哪天你写了 `state = {"idx": 0, "paused": False}` 这种重新赋值，那才需要 `nonlocal state`。

### 2.8 典型场景四：装饰器状态记录

装饰器内部经常需要记录"这个函数被调用了多少次""最近一次参数是什么"——这些都是典型的外层状态，内层包装函数要写它们，自然离不开 `nonlocal`。

**统计调用次数的装饰器**

```python
def count_calls(func):
    n_calls = 0

    def wrapper(*args, **kwargs):
        nonlocal n_calls
        n_calls += 1
        print(f"[{func.__name__}] 第 {n_calls} 次调用")
        return func(*args, **kwargs)

    # 把计数暴露到 wrapper 上，方便外部读取
    wrapper.n_calls = lambda: n_calls
    return wrapper

@count_calls
def greet(name):
    print(f"hello, {name}")

greet("Alice")  # 输出：[greet] 第 1 次调用\nhello, Alice
greet("Bob")    # 输出：[greet] 第 2 次调用\nhello, Bob
greet("Carol")  # 输出：[greet] 第 3 次调用\nhello, Carol
print("总调用次数 =", greet.n_calls())  # 输出：总调用次数 = 3
```

这里 `wrapper` 通过 `nonlocal n_calls` 去修改 `count_calls` 里的计数；又通过 `wrapper.n_calls = lambda: n_calls` 把一个能读取该计数的闭包挂到 `wrapper` 上，外部就能查到当前调用次数。整体既封装了状态，又暴露了受控的访问接口。

**缓存最近一次结果的装饰器**

```python
def remember_last(func):
    last = {"result": None, "args": None}

    def wrapper(*args, **kwargs):
        result = func(*args, **kwargs)
        # 这里改的是字典内容，不需要 nonlocal
        last["result"] = result
        last["args"] = (args, kwargs)
        return result

    wrapper.last = lambda: last
    return wrapper

@remember_last
def square(x):
    return x * x

print(square(3))  # 输出：9
print(square(5))  # 输出：25
print("最近一次 =", square.last()["result"])  # 输出：最近一次 = 25
```

这里 `last` 是字典，函数内只改内容不重新绑定，所以不需要 `nonlocal`。如果改成 `last = {...}` 重新赋值，就需要 `nonlocal last` 了。同一件事可有两种写法，选哪种取决于你想强调"重置"还是"累积"。

### 2.9 nonlocal 声明多个变量

`nonlocal` 一次可以声明多个名字，用逗号分隔。这些名字必须各自存在于某一层外层函数的局部作用域中（可以是不同层）。

```python
def make_stats():
    n = 0       # 数据个数
    total = 0   # 累加和
    squares = 0 # 平方和

    def observe(x):
        nonlocal n, total, squares   # 一次声明三个
        n += 1
        total += x
        squares += x * x
        return {
            "count": n,
            "mean": total / n if n else 0,
            "variance": (squares / n - (total / n) ** 2) if n else 0,
        }

    return observe

stats = make_stats()
print(stats(2))  # 输出：{'count': 1, 'mean': 2.0, 'variance': 0.0}
print(stats(4))  # 输出：{'count': 2, 'mean': 3.0, 'variance': 1.0}
print(stats(6))  # 输出：{'count': 3, 'mean': 4.0, 'variance': 2.6666666666666665}
```

这里 `n`、`total`、`squares` 三个变量都是不可变整数，每次都要 `+=` 重新绑定，所以必须一起 `nonlocal`。少一个，对应那行就会 `UnboundLocalError`。

**多个名字来自不同层级**

```python
def outer():
    a = "outer.a"
    def middle():
        b = "middle.b"
        def inner():
            nonlocal a, b    # a 来自 outer，b 来自 middle
            a = "inner 改的 a"
            b = "inner 改的 b"
        inner()
        print("middle 里 b =", b)
    middle()
    print("outer 里 a =", a)

outer()
# 输出：
# middle 里 b = inner 改的 b
# outer 里 a = inner 改的 a
```

`nonlocal` 会为每个名字**各自向外层查找最近的定义**，允许它们来自不同层级，这跟单个名字的规则一致。

### 2.10 找不到外层绑定时报 SyntaxError

如果 `nonlocal` 声明的名字在任何外层函数的局部作用域里都不存在，Python 会在**编译阶段**就报 `SyntaxError`，而不是运行时才报错。这是 `nonlocal` 和 `global` 的一个重要差异：`global` 允许你声明一个模块里还没有的名字（等价于"我要在模块全局新建一个"），`nonlocal` 不行——它必须有一个已经存在的外层局部变量可指。

**情形一：外层函数里完全没有这个名字**

```python
def outer():
    # 外层没有定义 x
    def inner():
        nonlocal x    # SyntaxError
        x = 1
    inner()
```

```
SyntaxError: no binding for nonlocal 'x' declared
```

**情形二：外层只有模块全局的同名变量，仍报错**

```python
x = "模块全局"

def outer():
    def inner():
        nonlocal x    # SyntaxError：模块全局不算 enclosing
        x = 1
    inner()
```

```
SyntaxError: no binding for nonlocal 'x' declared
```

这再次印证"`nonlocal` 不能指向模块全局"——模块级变量不在 `nonlocal` 的视线里。

**情形三：外层有定义，但定义在 inner 之后才执行**

这种是 Python 新手容易踩的坑：外层"写了"赋值语句，但运行到 `inner()` 时还没执行到那行，结果外层并没有真的绑定该名字。

```python
def outer():
    def inner():
        nonlocal x
        x = 100
    inner()
    x = 0    # 这行虽然写了，但执行顺序在 inner() 之后

outer()
# 输出： SyntaxError: no binding for nonlocal 'x' declared
```

实际上，`nonlocal x` 查的是"名字 x 在外层函数体内的绑定关系"。CPython 在编译 `outer` 的函数对象时，会把 `x = 0` 这一行也算作 `outer` 的局部变量（不管它在代码中出现的位置），所以从**编译期**看 `outer` 确实有 `x` 这个局部名字。上面这段在 CPython 里其实是合法的：

```python
def outer():
    def inner():
        nonlocal x
        x = 100
    inner()
    x = 0    # 编译期 x 已是 outer 的局部变量
    print("outer 里 x =", x)

outer()
# 输出：
# outer 里 x = 100
```

`inner()` 先执行，把外层的 `x` 通过 `nonlocal` 绑定并赋成 `100`，然后外层继续往下执行 `x = 0` 把它又改回 `0`——但前面 `inner` 里赋的 `100` 已经被覆盖了。这个例子提醒：**`nonlocal` 绑定的是"外层那个名字"，而不是"外层那个名字目前持有的值"**，所以即便外层的赋值还在后面，只要编译期这个名字属于外层局部，绑定就成立。

正因为这个绑定是编译期就定的，可读性考虑下，强烈建议把外层变量的定义放在内层函数之前，不要依赖这种"后定义也行"的细节。

### 2.11 nonlocal 在类方法中的限制

`nonlocal` 只对**函数嵌套**有效，对类的方法没有"外层方法局部变量"这个概念。类体本身确实是一个作用域，但类作用域并不是 enclosing function scope，`nonlocal` 找不到它。

```python
def make_class():
    counter = 0

    class C:
        nonlocal counter    # 想在类体里引用外层函数的 counter
        counter = counter + 1   # SyntaxError 或行为异常
```

在大多数 Python 版本中，这种写法要么编译报错，要么行为不符合预期。类体里要读外层函数变量，直接在方法里通过闭包读即可；要写，则在方法内用 `nonlocal`，而不是在类体顶层用：

```python
def make_class():
    counter = 0

    class C:
        def bump(self):
            nonlocal counter    # 在方法里用，没问题
            counter += 1
            return counter

    return C()

obj = make_class()
print(obj.bump())  # 输出：1
print(obj.bump())  # 输出：2
```

关键在于：**`nonlocal` 要出现在"函数体"里**，而类体不算函数体，类里的方法才是函数体。

### 2.12 nonlocal 与默认参数的对比

在讲闭包陷阱时，常有人用默认参数来"代替" `nonlocal`，比如：

```python
def make_counter_v2(counter=[0]):
    def counter_func():
        counter[0] += 1
        return counter[0]
    return counter_func
```

这种写法能工作，但有几个问题：默认参数是函数对象的属性，会被所有"未传参"的调用共享；可读性差，意图不明显；还容易和"可变默认参数"陷阱混在一起。相比之下，`nonlocal` 的写法：

```python
def make_counter():
    count = 0
    def counter_func():
        nonlocal count
        count += 1
        return count
    return counter_func
```

意图明确：状态属于这一次 `make_counter()` 调用，每次调用都新建一份。**推荐优先用 `nonlocal`，而不是用可变默认参数绕路**。

### 2.13 nonlocal 与类实例的取舍

闭包 + `nonlocal` 能解决"带状态的小对象"，但当状态变多、逻辑变复杂时，类的可读性往往更好。比如下面两个等价的"带状态的累加器"：

**闭包版本**

```python
def make_accumulator():
    total = 0
    def add(n):
        nonlocal total
        total += n
        return total
    return add
```

**类版本**

```python
class Accumulator:
    def __init__(self):
        self.total = 0
    def add(self, n):
        self.total += n
        return self.total
```

类版本多了 `self`，但状态都用属性表达，逻辑一目了然。当状态多于 2~3 个、或者需要多个互相调用的方法时，类通常更合适；状态只有 1~2 个、操作单一时，闭包更轻量。`nonlocal` 不是"必须用"，而是"当你想要函数式风格、又需要一点内部状态时"的最佳工具。

---

## 3. 最佳实践

### 3.1 把所有 nonlocal 声明集中在函数体最前面

和 `global`、`import` 一样，`nonlocal` 声明建议放在函数体的第一行可执行语句之前。这样一眼就能看清这个函数会向外"写"哪些变量，便于排查"某个外层变量怎么莫名其妙变了"。

**推荐**

```python
def make_counter():
    count = 0
    step = 1

    def counter():
        nonlocal count, step    # 一眼可见
        count += step
        return count

    return counter
```

**不推荐**

```python
def make_counter():
    count = 0

    def counter():
        # 一堆其他逻辑
        result = count
        nonlocal count          # 声明藏在中段，容易看漏
        count += 1
        return count

    return counter
```

虽然只要 `nonlocal` 在使用该名字之前就算合法，但藏在中间会让读代码的人反复回头确认。

### 3.2 不要滥用 nonlocal 做跨层状态共享

`nonlocal` 让内层函数能写外层变量，这很方便，但也意味着两层函数之间有**隐式耦合**。当层级多了，状态来源会非常难追踪——某个变量被改了，却不知道是哪一层、哪个闭包改的。

**不推荐**

```python
def f():
    s = ""

    def g():
        def h():
            nonlocal s   # 从最内层穿透两层改最外层
            s += "x"
        h()
    g()
```

这种嵌套层数较深、还要跨层改外层状态的写法，一旦业务扩张，维护成本会非常高。更合适的做法是显式传参、用返回值传递，或者干脆组织成类。

### 3.3 状态超过三个就考虑用类

如果一个闭包要写 4 个以上的 `nonlocal` 变量，通常说明状态已经复杂到应该用类来组织了：

```python
# 不推荐：一堆 nonlocal，意图不直观
def make_order_processor():
    total = 0
    item_count = 0
    discount = 0.0
    coupon = None
    last_error = None

    def process(item):
        nonlocal total, item_count, discount, coupon, last_error
        # ... 一堆逻辑
        return ...
    return process

# 推荐：状态用类组织
class OrderProcessor:
    def __init__(self):
        self.total = 0
        self.item_count = 0
        self.discount = 0.0
        self.coupon = None
        self.last_error = None

    def process(self, item):
        # ... 同样的逻辑，但状态是 self.xxx
        ...
```

类版本多了点样板，但状态访问路径明确（`self.xxx`），也更方便扩展和测试。

### 3.4 不可变状态用 nonlocal，可变容器视情况不写

总结一下什么时候要写 `nonlocal`：

| 情形                                                 | 例子                | 要不要 nonlocal |
| ---------------------------------------------------- | ------------------- | --------------- |
| 重新绑定整数/字符串/元组等不可变对象                 | `n += 1`、`s = "x"` | 要              |
| 就地修改可变对象（list.append、dict[key]=、set.add） | `lst.append(1)`     | 不要            |
| 重新绑定可变对象名字                                 | `lst = [1, 2]`      | 要              |
| 删除名字                                             | `del x`             | 要              |

记住这条规则，能少踩很多坑。如果拿不准，就问自己一句："这行代码会不会让这个名字指向一个新对象？"会——要 `nonlocal`；不会——不要。

### 3.5 每个 nonlocal 名字都要有命名清晰的外层变量

`nonlocal foo` 没人知道 `foo` 是干什么的。好的命名让闭包代码自解释：

```python
# 不推荐
def f():
    c = 0
    def g():
        nonlocal c
        c += 1
    return g

# 推荐
def make_click_counter():
    click_count = 0
    def click():
        nonlocal click_count
        click_count += 1
        return click_count
    return click
```

即便外层函数短，也要给状态变量一个表达意图的名字，这样 `nonlocal click_count` 一眼就说明它要修改的是"点击计数"。

### 3.6 闭包状态不要跨线程共享

`nonlocal` 维护的状态在多线程下不安全。多个线程同时调用同一个闭包，会出现和"全局变量被多线程改"一样的问题：

```python
counter = make_counter()
# 多线程里都调 counter()，count += 1 不是原子操作，会丢更新
```

若确需线程安全的计数，用 `threading.Lock` 包裹，或直接用 `itertools.count` 这类已经做好原子性的工具。不要指望 `nonlocal` 的变量本身有锁。

### 3.7 调试时可以用函数属性替代 nonlocal 暴露内部状态

如果你需要观察闭包内部状态但又不想把它做成类，可以把状态额外挂到函数属性上：

```python
def make_counter_debug():
    count = 0

    def counter():
        nonlocal count
        count += 1
        counter.last_value = count   # 同步暴露给外部观察
        return count

    counter.last_value = 0
    return counter

c = make_counter_debug()
c(); c(); c()
print("当前值 =", c.last_value)   # 输出：当前值 = 3
```

这样既能享受闭包的封装，又保留了"查状态"的口子。但要把状态真正暴露给外部修改，还是建议用类。

---

## 4. 原理

这一章我们把 `nonlocal` 放到 Python 的实现机制里去看：为什么一行 `nonlocal count` 就能让内层函数改到外层变量？为什么闭包能"记住"外层已经返回的变量？理解了 cell 与字节码层面的 `LOAD_DEREF` / `STORE_DEREF`，这些问题就能彻底想通。

### 4.1 闭包的底层：cell 对象与 **closure**

要理解 `nonlocal`，先要理解"闭包是怎么记住外层变量的"。Python 的实现（CPython）用一个叫 **cell 对象**的中间层来达成。

当一个外层函数的局部变量被它内部某个嵌套函数引用时，CPython 不会直接把这个变量放在外层函数的普通局部存储里，而是把它放进一个"cell 对象"——一个一层的间接容器。外层函数的局部变量名实际上指向这个 cell，而内层函数也指向同一个 cell。这样，即便外层函数返回、它自己的栈帧销毁了，只要内层函数还活着，那个 cell 就还活着。

可以用 `__closure__` 属性直接看到这件事：

```python
def make_adder():
    total = 0

    def add(n):
        nonlocal total
        total += n
        return total

    return add

adder = make_adder()
print(adder.__closure__)        # 输出：(<cell at 0x...: int object at 0x...>,)
print(adder.__code__.co_freevars)  # 输出：('total',)
```

`__closure__` 是一个元组，每个元素是一个 cell 对象，对应 `add` 引用的一个外层变量。`co_freevars` 是这个函数的"自由变量"列表——即它引用了但不在自己作用域里定义的名字，顺序和 `__closure__` 一一对应。

**cell 是共享引用，不是值拷贝**

cell 里面并不存"外层变量当时的值"，而是存"指向那个值的引用"。多个嵌套函数引用同一个外层变量时，它们共享同一个 cell：

```python
def make_pair():
    x = 0

    def get():
        return x

    def set_x(v):
        nonlocal x
        x = v

    return get, set_x

g, s = make_pair()
print(g.__closure__)   # (<cell at 0x...: int object at 0x...>,)
print(s.__closure__)   # (<cell at 0x...: int object at 0x...>,)
print(g.__closure__[0] is s.__closure__[0])  # 输出：True —— 同一个 cell
```

`get` 不需要写 `x`，所以没有 `nonlocal`，但它依然通过同一个 cell 读到 `x`；`set_x` 有 `nonlocal x`，写的是同一个 cell。两者共享同一份存储，所以 `s(10)` 之后 `g()` 立刻能看到 `10`：

```python
s(10)
print(g())    # 输出：10
s(99)
print(g())    # 输出：99
```

这就是为什么 `nonlocal` 能"改"外层变量——它让内层函数对 `x` 的赋值，通过这个共享 cell 立刻对其它闭包和已经返回的外层环境可见。

**验证 cell.\_cell_contents**

```python
def make_simple():
    x = 1
    def get():
        return x
    def set_(v):
        nonlocal x
        x = v
    return get, set_

g, s = make_simple()
cell = g.__closure__[0]
print("cell contents:", cell.cell_contents)  # 输出：1
s(42)
print("cell contents:", cell.cell_contents)  # 输出：42
```

`cell_contents` 是 cell 对象暴露的一个属性，直接读写它里面的值。可以看到 `set_` 调用后，cell 里的值从 `1` 变成 `42`——`nonlocal` 改的就是这个值。

### 4.2 字节码层面：LOAD_DEREF 与 STORE_DEREF

光看 `__closure__` 还不足以解释"为什么赋值能落到外层"——这要从字节码看起。用 `dis` 模块反汇编一下：

```python
import dis

def make_counter():
    count = 0
    def counter():
        nonlocal count
        count += 1
        return count
    return counter

dis.dis(make_counter.__code__.co_consts[1])
```

反汇编会看到大致这样的字节码（不同 Python 版本细节略有差异）：

```
  5           0 LOAD_DEREF               0 (count)
              2 LOAD_CONST               1 (1)
              4 BINARY_ADD
              6 STORE_DEREF              0 (count)

  6           8 LOAD_DEREF               0 (count)
             10 RETURN_VALUE
```

关键点：

- `LOAD_DEREF 0`：从 cell 数组的第 0 个 cell 读出值，压入栈顶。
- `STORE_DEREF 0`：把栈顶的值写回 cell 数组的第 0 个 cell。

对**没有** `nonlocal` 的普通内层函数，写一个名字用的是 `STORE_FAST`（写到当前函数的局部存储）；读外层名字用的是 `LOAD_DEREF`（从 cell 读）。区别就在" STORE"这一步：`STORE_FAST` 把值存在本函数的局部表里，对其它函数完全不可见；`STORE_DEREF` 把值写到 cell 里，而 cell 是与外层和兄弟闭包共享的，写进去大家立刻看到。

这就是 `nonlocal` 的本质作用——**把内层函数对某名字的存储操作从 `STORE_FAST` 改成 `STORE_DEREF`**，从而让它写到共享的 cell 上。

对比一下：

```python
import dis

def no_nonlocal():
    count = 0
    def counter():
        count = 1     # 这会被编译为 STORE_FAST
        return count
    return counter

dis.dis(no_nonlocal.__code__.co_consts[1])
```

反汇编里会看到：

```
  4           0 LOAD_CONST               1 (1)
              2 STORE_FAST               0 (count)

  5           4 LOAD_FAST                0 (count)
              6 RETURN_VALUE
```

`STORE_FAST` / `LOAD_FAST` 全部操作的是本函数局部表，跟外层的 `count` 完全没关系——外层那个 `count` 还是 0，内层"看上去在写 count"其实是自己玩自己的。这就是"没加 nonlocal 就改不动外层"的字节码原因。

### 4.3 为什么闭包能"修改"外层变量——cell 是引用共享

把 4.1 和 4.2 连起来看：cell 是一个间接层，外层函数和内层函数都持有同一个 cell 的引用。内层写 cell，外层读 cell，自然能看到改动；多个内层函数写同一个 cell，彼此也能立刻看到。**这就是为什么"外层函数早就返回了，内层闭包还能持续改它的变量"**——因为变量本身已经不是存在外层栈帧里了，而是存在那个共享的 cell 对象里，外层栈帧销毁只是回收外层那个名字到 cell 的引用，cell 本身和它里面的值都还在。

可以用一个极简示例来感受这种"引用共享"：

```python
def make_holder():
    value = "初始"

    def get():
        return value          # 只读，cell 里读出来

    def set_(v):
        nonlocal value
        value = v             # 写，通过 cell 立刻生效

    return get, set_

g, s = make_holder()
# 再也访问不到 make_holder 里的 value 了，只剩 g 和 s 持有那个 cell
print(g())   # 输出：初始
s("改了")
print(g())   # 输出：改了
```

`make_holder` 已经返回，它内部那个 `value` 的栈帧早已销毁。但 cell 还活着，`g` 和 `s` 共享同一个 cell，所以 `s("改了")` 通过 `STORE_DEREF` 把新值写进 cell，`g()` 通过 `LOAD_DEREF` 从 cell 读出来，结果就是"改了"。**这背后没有任何"魔法"，只是有一层 cell 做中间人。**

### 4.4 nonlocal vs global 的存储位置差异

把 `nonlocal` 和 `global` 放到字节码层面再对比一遍，能更深刻看出它们指向不同的存储。

**nonlocal 版本**

```python
def f():
    x = 1
    def g():
        nonlocal x
        x = 2
    return g
```

`g` 里写 `x` 用的是 `STORE_DEREF`，写到 cell（在 `f` 和 `g` 之间共享的那个 cell）。

**global 版本**

```python
x = 0
def g():
    global x
    x = 2
```

`g` 里写 `x` 用的是 `STORE_NAME`（模块顶层）或者 `STORE_GLOBAL`（在某些上下文里），目标是模块的 `__dict__`。

二者的存储位置截然不同：

- `nonlocal`：写到 cell 对象，是与外层函数共享的小内存盒，存储在堆上（只要还有闭包引用就不会回收）。
- `global`：写到模块的命名空间字典，模块级共享，整个进程内导入该模块的代码都看到同一个值。

这也解释了几个行为差异：

- `global` 声明一个尚不存在的名字不报错，因为往模块字典里塞新键本就是允许的；而 `nonlocal` 必须有一个已存在的 cell 可指（来自外层函数对该名字的绑定），所以"找不到就 `SyntaxError`"。
- `global` 修改后所有看到模块全局的代码都受影响（影响面大），`nonlocal` 只影响这一次调用所形成的那个闭包家族（影响面小）。这两个影响面的差别，决定了 `nonlocal` 比 `global` 安全得多，也更常用于封装状态。

### 4.5 cell 共享的实际验证

下面用一个综合 demo 把这套机制跑一遍，分别验证：

1. 同一次外层调用产生的多个闭包共享同一个 cell；
2. 多次外层调用产生的闭包不共享 cell；
3. `nonlocal` 写入 cell 后，所有持引用的闭包立刻可见。

```python
def make_cell_pair():
    val = 100

    def reader():
        return val

    def writer(v):
        nonlocal val
        val = v

    return reader, writer

# 第一次调用：r1, w1 共享一个 cell
r1, w1 = make_cell_pair()
# 第二次调用：r2, w2 共享另一个 cell
r2, w2 = make_cell_pair()

print("初始 r1:", r1())  # 输出：初始 r1: 100
print("初始 r2:", r2())  # 输出：初始 r2: 100

w1(1)
print("w1 改 1 后 r1:", r1())  # 输出：1
print("r2 不受影响:", r2())    # 输出：100

w2(999)
print("w2 改 999 后 r2:", r2())  # 输出：999
print("r1 不受影响:", r1())     # 输出：1

# 直接看 cell 对象是不是同一个
print("r1 的 cell:", r1.__closure__[0])
print("r2 的 cell:", r2.__closure__[0])
print("两套闭包 cell 是否同一对象:", r1.__closure__[0] is r2.__closure__[0])  # 输出：False
```

每次 `make_cell_pair()` 调用都会产生一个新的 `val`、一个新的 cell，所以两套闭包互不相干。这也是闭包比"全局变量记状态"安全得多的原因——状态天然是实例级的，而不是进程级的。

### 4.6 编译期决定的绑定

另一个容易忽略的点：`nonlocal` 是**编译期**就决定好的绑定，不是运行时动态查找。

```python
def f():
    x = 1
    def g():
        nonlocal x
        x = 2
    return g
```

CPython 在编译 `g` 的代码对象时，看到 `nonlocal x`，就把 `x` 标记为"自由变量"，对应一条 `STORE_DEREF`。这个绑定关系被编进 `g.__code__.co_freevars`，是 `g` 这个函数对象的固有属性，运行时不会再变。所以即便你之后把 `g` 赋给别的名字、传到别处去调用，它指向的仍然是当初那个 `f` 调用产生的 cell。

这也意味着，无法在运行时通过字符串名字来"动态决定 nonlocal 谁"——`nonlocal` 必须写死在代码里。需要动态作用域的场景，只能用字典/对象显式模拟，Python 不会替你做。

### 4.7 为什么读不需要 nonlocal，写却需要

把上面的字节码分析浓缩成一句话：**读用 `LOAD_DEREF`，写用 `STORE_DEREF`；读的时候 Python 会一路向外找名字，而写的时候如果没声明 `nonlocal`，Python 会默认用 `STORE_FAST`，把名字变成局部变量。**

Python 的设计哲学是：函数内的赋值默认创造局部变量（避免函数内部意外污染外层），但读名字时允许"逐层向外查找"。这导致一个不对称：读外层变量是默认允许的（闭包能"记住"外层数据），写外层变量是默认禁止的（必须显式 `nonlocal` 才能写）。这种设计牺牲了一点便利性，换来了闭包对外层环境的可控影响——只有在开发者明确写 `nonlocal` 时，闭包才会动外层状态。

### 4.8 nonlocal 不增加新的存储

最后强调一点：`nonlocal` 不分配新内存，也不创建新变量。它只**改变编译器对该名字的处理方式**（从 `STORE_FAST` 改成 `STORE_DEREF`），让赋值落到已经存在的那个 cell 上。如果你误以为 `nonlocal` 会"新建一份外层变量的副本"，就会想不通为什么兄弟闭包能立刻看到改动——其实没有副本，只有一份存储，大家都指同一个 cell。

---

## 5. 总结

### 5.1 本文内容要点

- `nonlocal` 是一条编译期声明，让内层函数里某个名字绑定到最近一层外层函数的局部变量，对其赋值会直接修改那个外层变量。
- 它只对 enclosing function scope（外层函数局部作用域）有效，不能指向模块全局；找不到外层绑定时编译期就报 `SyntaxError`。
- 闭包默认能"读"外层变量，要"写"必须用 `nonlocal`；内层函数内的赋值（包括 `+=`、`del`）默认会创建局部变量，这是不写 `nonlocal` 就改不动外层的根因。
- `nonlocal` 与 `global` 形式对称但指向完全不同：前者指向外层函数局部，后者指向模块全局；二者不能对同一名字同时声明。
- 典型场景：计数器闭包、累加器、带状态的小型生成器、装饰器统计/缓存状态。
- 不可变对象（int/str/tuple）的修改要 `nonlocal`；可变对象的就地修改（list.append、dict[key]=）不需要，因为不重新绑定名字。
- 底层机制：被嵌套函数引用的外层变量存在 cell 对象里，外层和内层共享同一个 cell；`nonlocal` 让内层对该名字的写操作走 `STORE_DEREF` 而不是 `STORE_FAST`，从而写到共享 cell。
- 每次外层函数调用产生一份新的 cell，所以不同调用产生的闭包状态互不影响，这是闭包比全局变量更安全的原因。

### 5.2 读完应能掌握的能力

- 能在不写 `nonlocal` 报错和写了 `nonlocal` 正确修改两个版本之间，解释清楚为什么需要 `nonlocal`。
- 能正确区分 `nonlocal` 与 `global` 的作用域层级，把同一个名字分别绑定到外层函数局部和模块全局并说明二者差异。
- 能写出带状态的闭包（计数器、累加器、序号生成器），并解释状态如何被 `nonlocal` 维护。
- 能判断一段内层函数代码是否需要 `nonlocal`：依据是"该行是否重新绑定名字"，而非"是否改了对象内容"。
- 能用 `__closure__` 和 `cell_contents` 验证闭包共享同一个 cell，并用 `dis` 说明 `LOAD_DEREF` / `STORE_DEREF` 与 `LOAD_FAST` / `STORE_FAST` 的区别。
- 能根据状态数量、是否需要多方法协作，合理在"闭包+nonlocal"和"类"之间做选型。
- 能识别 `nonlocal` 的常见陷阱：跨多层嵌套滥用、多线程下不安全、类体内（而非方法内）使用不生效、声明找不到外层绑定时的 `SyntaxError`。
