---
group:
  title: 【13】高阶函数与闭包
  order: 13
order: 8
title: nonlocal 在闭包中的使用
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 nonlocal

`nonlocal` 是 Python 3 引入的一个关键字，专门用于在嵌套函数（闭包）中声明"我要修改外层函数的局部变量"。它解决的是闭包场景下的一个核心痛点：默认情况下，内层函数对外层函数的变量只能"读"，一旦你写下赋值语句想要"写"，Python 并不会修改外层变量，而是在内层函数的局部作用域里新建一个同名局部变量，把外层变量"遮蔽"（shadow）掉。`nonlocal` 就是用来打破这个遮蔽、让赋值真正作用到外层变量上的开关。

理解 `nonlocal` 的前提是先理解闭包。闭包是指"一个内层函数捕获了外层函数的变量，且在外层函数返回后依然能访问这些变量"的现象。被捕获的变量存放在一个特殊的"cell"对象里，内层函数通过引用去读写它。`nonlocal` 正是控制"如何写这个 cell"的关键声明——没有它，写操作会绕开 cell，在内层新建局部变量；有了它，写操作才会真正写回 cell，让外层函数和内层函数看到同一份被修改的值。

这一篇是本系列闭包主题的实践落地篇，重点回答三个问题：为什么闭包默认只能读不能写？用 `nonlocal` 声明后到底发生了什么？哪些真实场景必须靠 `nonlocal` 才能实现？

### 1.2 基本语法与最小用法

`nonlocal` 的语法很简单：在内层函数体开头写一行 `nonlocal 变量名`，即可声明该变量指向外层函数的同名局部变量。可以同时声明多个变量，写成 `nonlocal a, b, c`。

先看一个最小对比，直观感受"没有 nonlocal"和"有 nonlocal"的区别。

**没有 nonlocal：赋值会遮蔽外层变量**

```python
def make_counter_broken():
    count = 0                # 外层函数的局部变量
    def inner():
        count = count + 1    # 试图计数，但这行会报错
        return count
    return inner

# 下面的调用会抛错，原因留到第 2 章和第 4 章详细剖析
# c = make_counter_broken()
# c()
# UnboundLocalError: local variable 'count' referenced before assignment
```

这个例子本意是做一个计数器，每次调用 `inner()` 就让 `count` 加 1。但运行直接报 `UnboundLocalError`。原因在于：`inner` 里出现了 `count = ...` 这样的赋值语句，Python 在编译时就认定 `count` 是 `inner` 的局部变量；于是等号右边 `count + 1` 中的 `count` 也被当成局部变量，而此时局部变量 `count` 还没赋值，于是报错。

**有 nonlocal：赋值真正修改外层变量**

```python
def make_counter():
    count = 0                # 外层函数的局部变量
    def inner():
        nonlocal count       # 声明 count 指向外层函数的 count
        count = count + 1    # 真正修改外层的 count
        return count
    return inner

c = make_counter()
print(c())   # 输出：1
print(c())   # 输出：2
print(c())   # 输出：3
```

加了 `nonlocal count` 之后，`inner` 里的 `count = count + 1` 就真正修改了外层 `make_counter` 的 `count`。连续调用三次，`count` 从 0 涨到 3。这就是 `nonlocal` 最核心的作用——打通内层对外层的"写"通道。

### 1.3 nonlocal 在 Python 中的作用域位置

要准确理解 `nonlocal`，必须先看清 Python 的变量作用域层级。Python 查找变量时按"LEGB"顺序依次搜索：Local（当前函数局部）→ Enclosing（外层函数局部）→ Global（模块全局）→ Builtin（内置）。

`nonlocal` 作用在 **Enclosing** 这一层，也就是"外层函数的局部变量"。它特别注意两点：

- 它不会去碰 **Global** 层：如果某个名字只在模块全局定义、没有外层函数的局部定义，`nonlocal` 不会声明它，反而会报 `SyntaxError`。
- 它也不会碰 **Local** 层：一旦声明 `nonlocal x`，`x` 就不再占用内层函数自己的局部命名空间，而是绑定到外层。

```python
x = "全局"               # 模块全局变量

def outer():
    x = "外层局部"         # 外层函数的局部变量

    def inner():
        nonlocal x        # 指向 outer 的 x，不是全局的 x
        x = "内层修改"

    inner()
    print("outer 内 x =", x)   # 外层被改了

outer()
print("全局 x =", x)           # 全局不受影响
# 输出：
# outer 内 x = 内层修改
# 全局 x = 全局
```

这个例子说明：`nonlocal x` 绑定的是离内层最近的、定义了 `x` 的外层函数的 `x`，与模块全局的 `x` 毫无关系。这也是 `nonlocal` 与 `global` 最本质的区别。

## 2. 核心内容

### 2.1 闭包默认只能"读"外层变量

这是理解 `nonlocal` 为什么存在的根本前提。闭包内层函数对外层变量的访问，默认是"只读引用"——可以读取外层变量的值，但不能通过赋值修改它。这里的"不能"不是报错那么简单，而是 Python 的编译期规则：只要内层函数体里出现了对某个名字的赋值（包括 `=`、`+=`、`def`、`import`、`class` 等绑定操作），Python 就把这个名字标记为内层函数的局部变量。

先看"读"是没问题的：

```python
def make_greeter(greeting):
    # greeting 被内层函数"捕获"，形成闭包
    def greet(name):
        # 这里只是"读" greeting，没有任何赋值
        return f"{greeting}, {name}!"
    return greet

say_hello = make_greeter("你好")
say_hai = make_greeter("嗨")

print(say_hello("小明"))   # 输出：你好, 小明!
print(say_hai("小红"))     # 输出：嗨, 小红!
```

`greet` 内部只是把 `greeting` 拼接到字符串里，没有任何对 `greeting` 的赋值，所以 `greeting` 被识别为自由变量（free variable），从外层 `make_greeter` 的作用域读取。两次调用 `make_greeter` 各自创建了独立的闭包，各自有自己的 `greeting`。这是闭包基础的"读"用法——捕获配置、生成定制化的函数。

再看"写"出问题的场景。下面这个函数想做一个计数器，但直接报错：

```python
def make_counter_broken():
    count = 0
    def inner():
        count = count + 1   # 编译期：count 被标记为 inner 的局部变量
        return count
    return inner

# 调用即报错
# make_counter_broken()()
# UnboundLocalError: local variable 'count' referenced before assignment
```

为什么报的是 `UnboundLocalError` 而不是"你不能修改外层变量"？因为 Python 的处理逻辑分两步：

1. **编译期**：看到 `count = count + 1` 里有对 `count` 的赋值，就把 `count` 标记为 `inner` 的局部变量。这一步决定了作用域：整个 `inner` 函数体里的 `count` 都指局部变量，不会去外层找。
2. **运行期**：执行 `count + 1` 时，需要先读 `count` 的值来计算，但局部变量 `count` 还没被赋值（赋值要等 `=` 右边的表达式算完才执行），于是报 `UnboundLocalError`。

这个错误非常经典，是闭包初学者最常遇到的陷阱。关键点不在于"赋值失败"，而在于"在编译期就已经作用域错位了"——你以为在改外层的 `count`，实际上 Python 早就把它当成了局部变量。

**"读"与"写"的不对称**

闭包对外层变量的"读"和"写"行为是不对称的：

- **读**：自由变量，通过 cell 引用从外层作用域获取，不需要任何声明。
- **写**（赋值，即重新绑定）：默认被当成创建新的局部变量，导致遮蔽或 `UnboundLocalError`。

这种不对称是 Python 作用域规则的设计结果，不是 bug。它的逻辑是：赋值即绑定，绑定即局部。要让赋值作用到外层，必须显式用 `nonlocal` 声明，告诉编译器"这个名字别当局部变量，去外层找"。

### 2.1.1 遮蔽陷阱：赋值创建了新的局部变量

`UnboundLocalError` 是"先读后写"导致的报错。但还有一种更隐蔽的情况：如果内层函数先赋值再读取，不会报错，但会遮蔽外层变量，得到与预期完全不同的结果。

```python
def make_accumulator_broken():
    total = 100   # 外层有一个初始值 100
    def inner(n):
        total = total   # 先给局部 total 赋一个来自"外层 total" 的值？
        total += n
        return total
    return inner
```

上面这段同样会报 `UnboundLocalError`——因为 `total = total` 右边的 `total` 已经被标记为局部变量，赋值前读取就报错。要真正演示"遮蔽但不报错"的场景，得让内层函数完全不依赖外层值来初始化局部变量：

```python
def make_box():
    value = "外层的值"
    def inner():
        value = "内层新建的值"   # 纯赋值，不读 value，不会报错
        print("inner 内 value =", value)
    return inner

box = make_box()
box()
# 输出：
# inner 内 value = 内层新建的值
```

`inner` 内部 `value = "内层新建的值"` 看似在修改外层 `value`，实际上是在 `inner` 的局部作用域里新建了一个叫 `value` 的局部变量。外层的 `value` 仍然是 `"外层的值"`，纹丝不动。这就是"遮蔽"（shadowing）：内层的局部变量把外层的同名变量挡住了，你写的赋值只改了局部副本，外层毫无感知。

如果想验证外层确实没被改，可以在 `make_box` 里加一行返回前检查：

```python
def make_box2():
    value = "外层的值"
    def inner():
        value = "内层新建的值"
        print("inner 内 value =", value)
    inner()
    print("make_box2 内 value =", value)   # 外层没被改
    return inner

make_box2()
# 输出：
# inner 内 value = 内层新建的值
# make_box2 内 value = 外层的值
```

注意最后一行：外层 `value` 仍然是 `"外层的值"`，`inner` 内部的赋值完全没影响到它。这就是没有 `nonlocal` 时"写"行为的真相——你不是在修改外层变量，你是在新建一个局部变量。

**遮蔽与 UnboundLocalError 的区别**

这两种情况本质上同源，都是"赋值让名字变成局部变量"导致的，但表现不同：

- 如果赋值前先读取了那个名字（如 `count = count + 1`），会报 `UnboundLocalError`，因为局部变量还没初始化。
- 如果只赋值不读取（如 `value = "新值"`），不会报错，但会遮蔽外层变量，逻辑上悄悄偏离预期。

后者更危险，因为它不报错，代码看似正常跑完，但结果是错的。这种 bug 在状态保持、计数器、累加器等场景里尤其常见。

### 2.2 nonlocal 声明：打通写通道

`nonlocal` 就是用来解决上面这两个问题的。在内层函数里写一行 `nonlocal 变量名`，就告诉 Python 编译器："这个名字不要当局部变量，去外层函数的作用域找它的绑定。" 于是赋值操作不再创建局部变量，而是真正修改外层的那份变量。

**修复计数器**

```python
def make_counter():
    count = 0
    def inner():
        nonlocal count       # 关键声明
        count = count + 1    # 现在真正改外层的 count
        return count
    return inner

c = make_counter()
print(c())   # 输出：1
print(c())   # 输出：2
print(c())   # 输出：3
```

和 2.1 的报错版本对比，唯一区别就是加了 `nonlocal count`。但效果天差地别：之前报 `UnboundLocalError`，现在能正常累加。`nonlocal` 的作用就是把 `count` 这个名字从"局部变量"重新标记为"自由变量"，让读和写都走外层 cell。

**修复遮蔽**

```python
def make_box_fixed():
    value = "外层的值"
    def inner():
        nonlocal value          # 声明 value 指向外层
        value = "内层修改的值"    # 真正改外层 value
        print("inner 内 value =", value)
    inner()
    print("make_box_fixed 内 value =", value)
    return inner

make_box_fixed()
# 输出：
# inner 内 value = 内层修改的值
# make_box_fixed 内 value = 内层修改的值
```

这次外层的 `value` 也被改成了 `"内层修改的值"`。`nonlocal` 让 `inner` 里的 `value` 和 `make_box_fixed` 里的 `value` 指向同一个 cell，赋值直接写回那个共享的 cell。

### 2.2.1 nonlocal 的声明规则

`nonlocal` 虽然好用，但它有几条必须遵守的规则，违反都会在编译期报 `SyntaxError`。

**规则一：必须在函数体顶部声明**

`nonlocal` 声明要放在内层函数体的开头（和其他 `nonlocal`/`global`/`import` 等作用于整个函数块的声明一样），虽然 Python 允许它在声明前的注释或字符串之后，但第二次赋值同变量后再声明会报 `SyntaxError`。

```python
def demo():
    x = 0
    def inner():
        x = 1
        nonlocal x   # SyntaxError: name 'x' is assigned to before nonlocal declaration
    return inner
```

正确写法是把 `nonlocal` 放在最前面：

```python
def demo():
    x = 0
    def inner():
        nonlocal x
        x = 1
    return inner
```

实际编码中，约定俗成把所有 `nonlocal` 声明放在函数体第一行（紧跟 `def` 之后），最清晰。

**规则二：外层必须真的有这个变量**

`nonlocal` 声明的变量，必须在某个外层函数的作用域里已经定义过。如果在外层任何函数里都找不到这个变量，Python 在编译期就会报 `SyntaxError: no binding for nonlocal 'x' found`。

```python
def demo():
    def inner():
        nonlocal no_such_var   # SyntaxError: no binding for nonlocal 'no_such_var' found
        no_such_var = 1
    return inner
```

`no_such_var` 在 `demo` 及更外层都没有定义，所以编译直接失败。这和 `global` 不同：`global` 声明的变量如果模块里没定义，运行时会自动当作新变量创建；`nonlocal` 不行，它必须有现成的外层绑定可指。

**规则三：不能指向全局变量**

即便外层没有同名变量、但模块全局有，`nonlocal` 也不会退化成指向全局。它只认"外层函数的局部作用域"，不认模块全局。

```python
g = 10   # 模块全局

def demo():
    def inner():
        nonlocal g   # SyntaxError: no binding for nonlocal 'g' found
        g = 20
    return inner
```

`g` 虽然在模块全局存在，但 `demo` 函数里没有定义 `g`，所以 `nonlocal g` 找不到外层函数绑定，报 `SyntaxError`。要修改全局变量，应该用 `global g`，而不是 `nonlocal g`。

### 2.3 典型场景一：计数器

计数器是 `nonlocal` 最经典的用例。需求是：做一个函数，每次调用让某个计数加 1，并返回当前计数。这种"带状态"的函数，本质上是闭包 + `nonlocal`。

```python
def make_counter(start=0):
    """生成一个从 start 开始的计数器，每次调用 +1"""
    count = start
    def step():
        nonlocal count
        count += 1
        return count
    return step

# 场景：给一次批处理任务编号
task_no = make_counter(start=1000)
print("任务号：", task_no())   # 输出：任务号： 1001
print("任务号：", task_no())   # 输出：任务号： 1002
print("任务号：", task_no())   # 输出：任务号： 1003

# 场景：统计某个按钮被点击的次数
click_counter = make_counter()
print("已点击", click_counter(), "次")   # 输出：已点击 1 次
print("已点击", click_counter(), "次")   # 输出：已点击 2 次
```

注意几个细节：

- `count = start` 让计数器的初始值可配置。每次调用 `make_counter` 都会创建一份独立的 `count`，多个计数器互不干扰。
- `nonlocal count` 让 `step` 能真正累加 `count`，否则又掉进 `UnboundLocalError` 陷阱。
- 返回的 `step` 是一个闭包，它"记住"了属于自己的那份 `count`。

**为什么不直接用全局变量？** 用全局变量也能计数，但全局变量谁都能改，命名冲突风险高，而且无法同时存在多个独立计数器（多个全局变量管理起来很快就会乱）。闭包 + `nonlocal` 把状态封装在函数内部，从外部无法直接访问 `count`，只能通过 `step()` 间接操作，天然实现了"状态私有"。这是函数式风格实现状态保持的经典手法。

### 2.4 典型场景二：累加器

累加器是计数器的进阶版本：计数器每次固定加 1，累加器每次加一个任意值，并维护累计总和。

```python
def make_accumulator():
    """生成一个累加器，每次调用加入一个增量，返回当前累计值"""
    total = 0
    def add(delta):
        nonlocal total
        total += delta
        return total
    return add

sales = make_accumulator()
print("今日销售：", sales(120.5))    # 输出：今日销售： 120.5
print("今日销售：", sales(85.0))     # 输出：今日销售： 205.5
print("今日销售：", sales(33.2))     # 输出：今日销售： 238.7
print("今日销售：", sales(-15.0))    # 输出：今日销售： 223.7  （退款）
```

这里 `add` 接收一个参数 `delta`，把它累加到 `total`。`nonlocal total` 让 `total += delta` 等价于 `total = total + delta`，真正修改外层的 `total`。

**`+=` 与 `nonlocal` 的关系**

`total += delta` 这种增强赋值，本质上是 `total = total + delta`，左边有赋值（重新绑定），右边有读取。没有 `nonlocal` 时，`total` 会被当局部变量，右边的读取就会触发 `UnboundLocalError`。所以只要用到 `+=`、`-=` 这类对捕获变量的增强赋值，就必须加 `nonlocal`。

```python
def make_accumulator_broken():
    total = 0
    def add(delta):
        total += delta    # UnboundLocalError: local variable 'total' referenced before assignment
        return total
    return add

# make_accumulator_broken()(1)
```

这是另一个极其常见的坑：以为 `+=` 是"原地修改"就不需要 `nonlocal`。对于不可变对象（如 `int`、`str`、`tuple`），`+=` 会创建新对象并重新绑定，属于"写"操作，必须 `nonlocal`。只有对可变对象的原地方法（如 `list.append`）才不需要 `nonlocal`，后面会专门讲。

### 2.5 典型场景三：状态机切换

`nonlocal` 非常适合实现小型状态机——在一个闭包里维护"当前状态"，每次调用根据输入切换状态并返回对应动作。下面是一个"按钮控制灯"的有限状态机：开→关→开→关，循环切换。

```python
def make_light_switch():
    """模拟一个带记忆的灯开关：开/关交替切换"""
    state = "关"
    def toggle():
        nonlocal state
        if state == "关":
            state = "开"
        else:
            state = "关"
        return f"灯现在的状态：{state}"
    return toggle

light = make_light_switch()
print(light())   # 输出：灯现在的状态：开
print(light())   # 输出：灯现在的状态：关
print(light())   # 输出：灯现在的状态：开
```

这里 `state` 记录当前灯的状态。每次调用 `toggle()` 切换它，并返回新状态。`nonlocal state` 是这个状态能被"记住"并切换的关键。

**更复杂的三态状态机**

```python
def make_traffic_light():
    """三态红绿灯：绿 → 黄 → 红 → 绿 循环"""
    state = "红"   # 初始状态
    sequence = ["绿", "黄", "红"]
    def next_state():
        nonlocal state
        # 找到当前状态在序列中的位置，取下一个
        idx = sequence.index(state)
        state = sequence[(idx + 1) % len(sequence)]
        return state
    return next_state

light = make_traffic_light()
print(light())   # 输出：绿
print(light())   # 输出：黄
print(light())   # 输出：红
print(light())   # 输出：绿
```

`sequence` 是只读的（内层函数只读取不赋值），所以不需要 `nonlocal`；`state` 需要被修改，所以要 `nonlocal`。这个例子很好地体现了一个闭包里"读"和"写"变量的差别对待。

**带输入的状态机**

状态机往往还需要根据外部输入决定下一个状态，下面是一个密码锁：输入正确序列才能开锁，输错就重置。

```python
def make_password_lock(secret):
    """输入正确密码序列才解锁，输错则重置进度"""
    progress = 0   # 已匹配的密码位数
    def press(key):
        nonlocal progress
        if key == secret[progress]:
            progress += 1
            if progress == len(secret):
                progress = 0   # 解锁后重置，准备下次
                return "解锁成功！"
            return f"已匹配 {progress}/{len(secret)}"
        else:
            progress = 0
            return "密码错误，已重置"
    return press

unlock = make_password_lock("1357")
print(unlock("1"))   # 输出：已匹配 1/4
print(unlock("3"))   # 输出：已匹配 2/4
print(unlock("5"))   # 输出：已匹配 3/4
print(unlock("9"))   # 输出：密码错误，已重置
print(unlock("1"))   # 输出：已匹配 1/4
print(unlock("3"))   # 输出：已匹配 2/4
print(unlock("5"))   # 输出：已匹配 3/4
print(unlock("7"))   # 输出：解锁成功！
```

这个状态机维护一个 `progress` 变量，记录已经匹配到密码的第几位。`nonlocal progress` 让每次按键都能更新进度。输错就清零，是典型的"状态推进 + 失败回滚"模式。

### 2.6 典型场景四：带运行次数限制的函数

实际工程中常遇到"这个函数最多只能调用 N 次"的需求，比如限流、试用次数限制。用闭包 + `nonlocal` 可以把"已调用次数"封装在闭包内部，对外只暴露一个"看起来和普通函数一样"的接口。

```python
def limited_call(max_times, func):
    """让 func 最多只能被调用 max_times 次，超过则抛异常"""
    called = 0
    def wrapper(*args, **kwargs):
        nonlocal called
        if called >= max_times:
            raise RuntimeError(f"超过调用上限 {max_times} 次")
        called += 1
        return func(*args, **kwargs)
    return wrapper

def send_sms(phone, msg):
    return f"已发送[{msg}]到{phone}"

# 试用版短信接口，最多 3 次
trial_send = limited_call(3, send_sms)
print(trial_send("13800000000", "验证码 1234"))   # 输出：已发送[验证码 1234]到13800000000
print(trial_send("13800000000", "验证码 5678"))   # 输出：已发送[验证码 5678]到13800000000
print(trial_send("13800000000", "验证码 9012"))   # 输出：已发送[验证码 9012]到13800000000
try:
    trial_send("13800000000", "验证码 3456")
except RuntimeError as e:
    print(e)   # 输出：超过调用上限 3 次
```

`called` 是被 `limited_call` 封装在闭包里的状态，外部无法直接读到也无法绕过限制，只能通过 `trial_send(...)` 调用，而每次调用都会触发次数检查。这种"把状态藏在闭包里"的做法，本质上就是用函数实现了"私有属性 + 公开方法"的封装效果，是装饰器思想的雏形。

**带"冷却"的调用限制**

进阶一点，还可以加上"两次调用之间必须间隔 N 秒"的限制：

```python
import time

def rate_limit(interval, func):
    """两次调用之间至少间隔 interval 秒"""
    last_called = 0.0
    def wrapper(*args, **kwargs):
        nonlocal last_called
        now = time.time()
        if now - last_called < interval:
            wait = interval - (now - last_called)
            raise RuntimeError(f"调用太快，还需等 {wait:.2f} 秒")
        last_called = now
        return func(*args, **kwargs)
    return wrapper
```

这里 `last_called` 记录上次调用的时间戳，每次调用检查间距。`nonlocal last_called` 让时间戳能在闭包调用之间保持并更新。这种"时间窗口限流"的逻辑用闭包写比用类写更轻量。

### 2.7 典型场景五：生成器状态推进

生成器本身就是"有状态的函数"，但它有自己的挂起/恢复机制。有时候我们不用生成器，而是手动写一个迭代器式的闭包，让每次调用推进一次内部状态，这种场景也需要 `nonlocal`。

```python
def make_fibonacci():
    """每次调用返回下一个斐波那契数"""
    a, b = 0, 1
    def next_fib():
        nonlocal a, b
        result = a
        a, b = b, a + b
        return result
    return next_fib

fib = make_fibonacci()
for _ in range(10):
    print(fib(), end=" ")
# 输出：0 1 1 2 3 5 8 13 21 34
```

`a, b = b, a + b` 是一个元组解包赋值，同时给 `a` 和 `b` 重新绑定。因为对 `a`、`b` 都有赋值，所以两个都得 `nonlocal`。这类"每次调用推进一次内部状态"的闭包，和生成器函数干的是同一件事，只是写法不同。

**游标式数据遍历**

```python
def make_pagination(fetch_page, page_size=10):
    """分页遍历器：每次调用取下一页，内部维护当前页码"""
    page = 1
    has_more = True
    def take_next():
        nonlocal page, has_more
        if not has_more:
            return None
        data = fetch_page(page, page_size)
        if len(data) < page_size:
            has_more = False
        page += 1
        return data
    return take_next
```

`page` 和 `has_more` 都是会变的状态，需要 `nonlocal`。这是在后端分页、流式拉取等场景里能直接用上的模式：把"当前在第几页、还有没有下一页"封进闭包，调用方只管反复调 `take_next()` 直到返回 `None`。

### 2.8 nonlocal 修改可变对象：其实不需要 nonlocal

这是一个非常重要、却被很多人忽略的细节。前面所有场景里需要对捕获变量用 `nonlocal`，是因为它们做的都是**重新绑定**（`count = count + 1`、`total += delta`、`state = "开"`），即让变量名指向一个新对象。重新绑定的"赋值"触发 Python 的"局部变量"规则，所以要 `nonlocal` 把名字重新指向外层。

但如果捕获的是一个**可变对象**（如 `list`、`dict`、`set`），并且在内层函数里做的是**原地修改**（如 `lst.append(...)`、`d[k] = v`、`s.add(...)`），那就不涉及重新绑定——变量名指向的还是同一个对象，只是对象内部变了。这种情况下**不需要 `nonlocal`**。

```python
def make_list_appender():
    items = []   # 可变对象
    def add(item):
        # 原地修改 list，没有对 items 赋值，不需要 nonlocal
        items.append(item)
        return items
    return add

appender = make_list_appender()
print(appender("苹果"))    # 输出：['苹果']
print(appender("香蕉"))    # 输出：['苹果', '香蕉']
print(appender("橙子"))    # 输出：['苹果', '香蕉', '橙子']
```

`add` 里没有对 `items` 赋值，只是调用 `items.append(item)`——这调用的是 `list` 对象的方法，修改了 `items` 指向的那个 `list`，但 `items` 这个名字本身没变。所以既不会报 `UnboundLocalError`，也不会遮蔽——闭包通过 cell 读取 `items`，拿到那个共享的 `list` 对象，再原地改它。外层和内层看到的 `list` 是同一个，修改自然对双方可见。

**对比：原地修改 vs 重新绑定**

```python
def compare():
    data_list = []
    data_int = 0

    def mutate_in_place():
        # 修改 list 内部：不需要 nonlocal
        data_list.append(1)

    def rebind_int():
        # 给 int 重新赋值：需要 nonlocal，否则报错
        nonlocal data_int
        data_int += 1

    return mutate_in_place, rebind_int
```

这段对照很清晰：`data_list.append(1)` 是原地修改，不用声明；`data_int += 1` 是重新绑定（因为 `int` 不可变，`+=` 会创建新对象），必须 `nonlocal`。

**常见混淆：`lst = lst + [x]` vs `lst.append(x)`**

```python
def make_appender_broken():
    items = []
    def add(item):
        items = items + [item]   # 对 items 赋值！触发局部变量规则
        return items
    return add

# make_appender_broken()(1)
# UnboundLocalError: local variable 'items' referenced before assignment
```

`items = items + [item]` 虽然语义上也是"在列表里加一个元素"，但它是**赋值**——左边出现了 `items =`，于是 `items` 被标记为局部变量，右边的 `items` 也被当成局部变量， lại 一次 `UnboundLocalError`。这说明：决定要不要 `nonlocal` 的不是"你在改可变对象还是不可变对象"，而是"你有没有对那个变量名重新赋值"。只要对捕获变量名赋值（哪怕是赋一个看起来"原地"的值），就要 `nonlocal`；只调用对象的方法或通过下标改内容，则不需要。

**用 dict 维护状态也可以不用 nonlocal**

```python
def make_cache():
    cache = {}   # 可变对象
    def get_or_set(key, factory):
        # 原地修改 dict，不需要 nonlocal
        if key not in cache:
            cache[key] = factory()
        return cache[key]
    return get_or_set
```

很多"用闭包做缓存/配置容器"的写法，用 `dict` 存状态，靠 `d[k] = v` 改内容，全程不用 `nonlocal`。这是闭包式状态管理的另一种风格——把状态做成可变容器，只读引用、原地修改。它的好处是少写 `nonlocal`，坏处是状态暴露为可变对象，调用方若拿到引用也能改，封装性比 `nonlocal` 的纯变量差。

### 2.9 nonlocal 声明多个变量

`nonlocal` 可以一次声明多个变量，用逗号分隔。当闭包要同时维护多个状态（如累加器同时记录总和与次数），这个写法很常用。

```python
def make_stats():
    total = 0
    count = 0
    max_value = None
    def observe(x):
        nonlocal total, count, max_value   # 一次声明三个
        total += x
        count += 1
        if max_value is None or x > max_value:
            max_value = x
        return {
            "平均": total / count,
            "个数": count,
            "最大": max_value,
        }
    return observe

stats = make_stats()
print(stats(10))    # 输出：{'平均': 10.0, '个数': 1, '最大': 10}
print(stats(20))    # 输出：{'平均': 15.0, '个数': 2, '最大': 20}
print(stats(6))     # 输出：{'平均': 12.0, '个数': 3, '最大': 20}
```

`total`、`count`、`max_value` 都要在内层被重新赋值，所以都得 `nonlocal`。写成一行 `nonlocal total, count, max_value` 比写三行 `nonlocal` 更常见、更简洁。

**分两行写也完全可以**

```python
def observe(x):
    nonlocal total
    nonlocal count
    nonlocal max_value
    ...
```

两种写法等价，多行写法在变量多、各变量有独立注释时更清晰。实际编码按团队习惯选择。

### 2.10 多个外层同名变量的就近匹配

当嵌套层次很深、有多层外层函数都定义了同名变量时，`nonlocal` 会匹配离内层最近的那一层（即最内层的那个同名变量）。这是"就近原则"。

```python
def outer():
    x = "外层的 x"

    def middle():
        x = "中间层的 x"

        def inner():
            nonlocal x   # 匹配最近的 middle.x
            x = "内层修改的 x"

        inner()
        print("middle 内 x =", x)

    middle()
    print("outer 内 x =", x)

outer()
# 输出：
# middle 内 x = 内层修改的 x
# outer 内 x = 外层的 x
```

`inner` 里的 `nonlocal x` 找最近的外层 `x`，也就是 `middle` 里那个。所以 `inner` 把 `middle` 的 `x` 改成了 `"内层修改的 x"`，而 `outer` 里的 `x` 纹丝不动，还是 `"外层的 x"`。

如果要让 `inner` 改的是 `outer` 里的 `x` 怎么办？需要在 `middle` 里也声明 `nonlocal x`，让 `middle` 的 `x` 也指向 `outer` 的 `x`，这样两层 `nonlocal` 连起来，最终改的就是 `outer` 的 `x`。

```python
def outer():
    x = "外层的 x"

    def middle():
        nonlocal x       # middle 的 x 也指向 outer 的 x
        x = "中间层改过的 x"

        def inner():
            nonlocal x   # 现在 inner 找到的 x 已经连到 outer 了
            x = "内层修改的 x"

        inner()
        print("middle 内 x =", x)

    middle()
    print("outer 内 x =", x)

outer()
# 输出：
# middle 内 x = 内层修改的 x
# outer 内 x = 内层修改的 x
```

这一次 `inner` 的修改一路传到了 `outer`，因为 `middle` 的 `nonlocal x` 把中间那一层的 `x` 和最外层连上了。`nonlocal` 是"逐层传递"的，每一层都要显式声明才能把链路接起来。

### 2.11 nonlocal vs global：区别与选择

`nonlocal` 和 `global` 长得很像，都是"声明一个变量指向别处"，但作用域完全不同，必须分清。

| 对比项 | `nonlocal x` | `global x` |
|---|---|---|
| 指向的作用域 | 外层函数的局部变量（Enclosing） | 模块全局变量（Global） |
| 前提条件 | 外层函数必须已定义同名变量 | 无要求，全局没有就创建 |
| 是否能在模块顶层使用 | 不能（没有外层函数） | 能 |
| 典型场景 | 闭包内修改捕获的外层变量 | 函数内修改模块级变量 |

**两个声明的指向差异**

```python
x = "全局 x"

def outer():
    x = "外层 x"

    def use_global():
        global x       # 指向模块全局的 x
        x = "改的是全局"

    def use_nonlocal():
        nonlocal x     # 指向 outer 的 x
        x = "改的是外层"

    use_global()
    print("调用 use_global 后，outer 内 x =", x)   # 仍是"外层 x"
    print("调用 use_global 后，全局 x =", x)        # 还是"全局 x"，因为 print 的 x 指局部

    use_nonlocal()
    print("调用 use_nonlocal 后，outer 内 x =", x)
```

这个对照很容易让人绕晕，关键看 `print` 里 `x` 指什么。这里 `outer` 没有 `global x`，所以 `outer` 内的 `print(x)` 默认读的是 `outer` 的局部 `x`。`use_global` 改的是模块全局的 `x`，对 `outer` 的局部 `x` 没影响；`use_nonlocal` 改的才是 `outer` 的局部 `x`。

更干净的分两段看：

```python
x = "全局 x"

def outer():
    x = "外层 x"
    def use_nonlocal():
        nonlocal x
        x = "改的是外层"
    use_nonlocal()
    print("outer 内 x =", x)

outer()
print("全局 x =", x)
# 输出：
# outer 内 x = 改的是外层
# 全局 x = 全局 x
```

```python
x = "全局 x"

def outer():
    x = "外层 x"
    def use_global():
        global x
        x = "改的是全局"
    use_global()
    print("outer 内 x =", x)   # 外层没被改

outer()
print("全局 x =", x)           # 全局被改了
# 输出：
# outer 内 x = 外层 x
# 全局 x = 改的是全局
```

**何时该用哪个**

- 在闭包里修改"外层函数传进来的、捕获的"变量 → `nonlocal`。
- 在普通函数里修改"模块级配置变量、全局开关" → `global`。
- 两者的使用场景几乎不重叠：`nonlocal` 一定出现在嵌套函数里，`global` 可以在任意函数里。

实际工程里 `global` 用得越来越少，因为它破坏封装、让函数行为依赖全局状态，难以测试和并发。`nonlocal` 相对安全，因为它只在闭包内部传递，不污染模块全局。

### 2.12 用 nonlocal 闭包替代类实现状态保持

`nonlocal` 闭包和"带实例属性的类"在功能上高度重合：都是"私有状态 + 操作接口"。下面用两种方式实现同一个计数器，对比取舍。

**用 nonlocal 闭包实现**

```python
def CounterClosure(start=0):
    count = start
    def step():
        nonlocal count
        count += 1
        return count
    def reset():
        nonlocal count
        count = 0
        return count
    def get():
        return count
    step.reset = reset
    step.get = get
    return step

c = CounterClosure(10)
print(c())       # 输出：11
print(c())       # 输出：12
print(c.get())   # 输出：12
c.reset()
print(c.get())   # 输出：0
```

**用类实现**

```python
class CounterClass:
    def __init__(self, start=0):
        self.count = start
    def step(self):
        self.count += 1
        return self.count
    def reset(self):
        self.count = 0
        return self.count
    def get(self):
        return self.count

c = CounterClass(10)
print(c.step())   # 输出：11
print(c.step())   # 输出：12
print(c.get())    # 输出：12
c.reset()
print(c.get())    # 输出：0
```

**取舍对比**

- **闭包式**：状态 `count` 完全私有，外部无法直接读写，只能通过 `step/get/reset` 间接访问。封装性好，但接口挂得比较 hack（给函数对象硬塞属性），也不直观。
- **类式**：状态 `self.count` 默认是公开的，可读可写，调试方便。接口通过方法定义，符合面向对象直觉。支持继承、`__str__`、属性装饰器等扩展。

**什么时候用闭包替代类**

- 状态很简单（一两个变量），且接口只有一个主操作时。
- 需要把"状态 + 操作"打包成一个可直接调用的函数（比如要做装饰器、回调函数）时。
- 希望状态完全私有、不希望外部访问时。

**什么时候老老实实写类**

- 状态较多、方法较多时（闭包写法要给函数挂一堆属性，很难维护）。
- 需要继承、多态、`isinstance` 检查时。
- 团队规范要求面向对象风格时。

一般来说，状态一旦超过两三个变量，或者方法超过三四个，类的可读性就开始碾压闭包。`nonlocal` 闭包适合"轻量级私有状态"场景，不适合做复杂状态对象。

### 2.13 闭包状态隔离：每次调用都是独立的

一个容易被忽视的细节：每次调用外层函数，都会创建一份全新的外层局部变量，内层闭包捕获的是这一次的 cell。所以"同一个工厂函数生成的多个闭包，各自状态独立"。

```python
def make_counter():
    count = 0
    def step():
        nonlocal count
        count += 1
        return count
    return step

a = make_counter()
b = make_counter()
print("a:", a(), a(), a())   # 输出：a: 1 2 3
print("b:", b(), b())        # 输出：b: 1 2
print("a:", a())             # 输出：a: 4
```

`a` 和 `b` 是两次独立调用 `make_counter()` 生成的，它们捕获的 `count` 是两份不同的 cell，互不影响。`a` 涨到 3 时 `b` 才开始，`b` 涨到 2 时 `a` 接着涨到 4。这是闭包相对于全局变量的巨大优势：状态天然隔离，想生成多少个独立计数器就生成多少个，不用担心互相干扰。

这种隔离性来自"每次调用函数都会创建新的局部命名空间"这一 Python 基础机制。闭包的 cell 指向的是某一次调用的局部变量，不同次调用产生不同 cell。

### 2.14 nonlocal 与函数属性：另一种状态保持方案

除了 `nonlocal`，Python 还有一种"给函数对象挂属性"的方式来保持状态，它不需要嵌套函数。对比一下：

**用函数属性**

```python
def counter_attr(start=0):
    def step():
        step.count += 1
        return step.count
    step.count = start
    return step

c = counter_attr(5)
print(c())   # 输出：6
print(c())   # 输出：7
```

`step.count` 是给函数对象 `step` 挂的一个属性，它存在函数对象本身上，不依赖闭包 cell。这种写法和 `nonlocal` 在功能上等价，但机制不同：

- `nonlocal`：状态在 `step` 外层函数的 cell 里，外部完全看不到。
- 函数属性：状态挂在 `step` 对象上，外部可以通过 `c.count` 直接访问、改写，封装性差。

实际项目中两者都常见。`nonlocal` 更"纯函数式"，函数属性更"对象式"。但当状态需要被外部读取（如查日志、调试）时，函数属性反而更方便——`c.count` 直接取值，比额外写 `get()` 更直接。

## 3. 最佳实践

### 3.1 该用 nonlocal 时一定要用，不要靠"可变对象绕过"

常见反模式：明明逻辑上是对一个"计数"这种不可变状态做累加，却为了不写 `nonlocal`，硬把它包成 `count = [0]` 然后 `count[0] += 1`。这种写法能跑，但失去了 `nonlocal` 的清晰语义。

**不推荐：用 list 玩 hack**

```python
def make_counter_hack():
    count = [0]
    def step():
        count[0] += 1
        return count[0]
    return step
```

这段代码确实不需要 `nonlocal`（因为 `count` 没被重新赋值，只是 `count[0]` 被改），但读代码的人要绕个弯才能理解"这个 `count[0]` 其实是个 int 计数器"。

**推荐：直接 nonlocal**

```python
def make_counter():
    count = 0
    def step():
        nonlocal count
        count += 1
        return count
    return step
```

`nonlocal count` 一眼就能看出"这里在改外层 count"，语义直观。既然 Python 3 专门提供了 `nonlocal` 来解决这个问题，就应该直接用。

### 3.2 增强赋值（+= 等）对不可变捕获变量也要 nonlocal

`+=`、`-=`、`*=` 这些增强赋值，对不可变类型（`int`、`str`、`tuple`、`float`）等价于 `x = x + y`，属于重新绑定，必须 `nonlocal`。这是最常踩的坑之一，因为直觉上会觉得 `+=` 是"原地修改"。

**不推荐**

```python
def make_accumulator_bad():
    total = 0
    def add(delta):
        total += delta    # UnboundLocalError
        return total
    return add
```

**推荐**

```python
def make_accumulator():
    total = 0
    def add(delta):
        nonlocal total
        total += delta
        return total
    return add
```

判断标准很简单：看赋值号 `=` 是不是出现在被捕获变量名前。`total += delta` 含 `=`，要 `nonlocal`；`lst.append(x)` 没有 `=` 给 `lst`，不用 `nonlocal`。

### 3.3 nonlocal 声明集中在函数体顶部

把所有 `nonlocal` 声明放在内层函数体第一行（或第二行，紧跟 docstring 之后），不要散落在代码中间。这是 Python 社区的事实约定，能让读者一眼看清这个闭包修改了哪些外层变量。

**推荐**

```python
def observe(x):
    nonlocal total, count, max_value
    total += x
    count += 1
    if max_value is None or x > max_value:
        max_value = x
```

**不推荐**

```python
def observe(x):
    total += x
    nonlocal count      # 藏在中间，可读性差
    count += 1
    nonlocal max_value  # 而且会报 SyntaxError（赋值后再 nonlocal）
    ...
```

集中声明不仅可读性好，也避免"先赋值后 nonlocal"的 `SyntaxError`。

### 3.4 闭包状态过多时改用类

当 `nonlocal` 声明的变量超过 3 个，或者闭包内层函数超过 2 个（一个主操作、若干辅助操作嵌挂函数属性），可读性会急剧下降。这时改用类更合适。

**不推荐：一堆 nonlocal + 挂函数属性**

```python
def make_complex_state():
    a, b, c, d, e = 0, 0, 0, 0, 0
    def main():
        nonlocal a, b, c, d, e
        ...
    def helper1():
        nonlocal a, c
        ...
    def helper2():
        nonlocal b, d, e
        ...
    main.helper1 = helper1
    main.helper2 = helper2
    return main
```

**推荐：直接写类**

```python
class ComplexState:
    def __init__(self):
        self.a = self.b = self.c = self.d = self.e = 0
    def main(self):
        ...
    def helper1(self):
        ...
    def helper2(self):
        ...
```

类的 `self.xxx` 天然支持多状态、多方法，组织起来清晰得多。

### 3.5 别用 nonlocal 做跨函数"隐式通信"

`nonlocal` 只能在闭包的内外层之间传递状态，它的意义是"封装私有状态"，不是"在函数间传消息"。如果发现自己在写一个外层函数只为了"用 nonlocal 连接两个内层函数"，那大概率是设计有问题，应该考虑改成类或显式传参。

**不推荐**

```python
def messy():
    flag = False
    def set_true():
        nonlocal flag
        flag = True
    def check():
        return flag
    return set_true, check
```

这种"用一个外层变量在两个内层函数间传消息"的写法，读起来需要追好几层函数才能搞清楚 `flag` 是怎么变化的。

**推荐：显式对象**

```python
class Flag:
    def __init__(self):
        self.value = False
    def set_true(self):
        self.value = True
    def check(self):
        return self.value
```

类把状态和操作组织在一起，读起来直接得多。

### 3.6 确认外层变量真的已定义再 nonlocal

`nonlocal` 要求外层函数有同名变量绑定，否则 `SyntaxError`。写闭包时先确认外层有定义，再在内层声明 `nonlocal`。一个常踩的坑是：想 `nonlocal` 模块全局变量（写错成 `nonlocal` 而非 `global`），结果报"找不到绑定"。

**错误**

```python
config = {"debug": False}

def set_debug():
    nonlocal config    # SyntaxError: no binding for nonlocal 'config' found
    config["debug"] = True
```

`config` 是模块全局，没有外层函数定义它，所以 `nonlocal` 找不到。其实这里也不需要 `nonlocal`——`config["debug"] = True` 是对 `dict` 的原地修改，不涉及重新绑定 `config`，直接写就行：

**正确**

```python
config = {"debug": False}

def set_debug():
    config["debug"] = True   # 原地修改，不需要 nonlocal 也不需要 global
```

这个例子同时说明：`nonlocal` 不是"修改外层任何东西的万能钥匙"，它只管"重新绑定名字"，不管"原地改对象"。

### 3.7 闭包状态调试技巧

`nonlocal` 变量在外部无法直接访问，这是它的封装优势，但调试时也会让人犯难——想看 `count` 现在是多少，没法直接 `print(c.count)`。几种实用做法：

- **提供 get 方法**：闭包里额外定义一个 `def get(): return count` 挂出去，用于读状态。
- **改用函数属性**：把状态挂在函数对象上（`step.count = 0`），外部可读可改，便于调试。
- **改用类**：`self.count` 默认公开，调试最方便。

选择哪种取决于对"封装性 vs 可调试性"的权衡。纯私有、不希望外部依赖的，用 `nonlocal` + `get()`；需要调试便利的，用函数属性或类。

## 4. 原理

### 4.1 闭包的 cell 机制：捕获变量存哪儿

要理解 `nonlocal` 的原理，先要搞清楚闭包捕获的变量到底存在哪里。它既不在内层函数的局部作用域，也不在外层函数结束后的局部作用域（外层函数返回后其局部命名空间就应该销毁了），而是存在一种叫 **cell 对象**（cell object）的特殊容器里。

当 Python 编译器发现内层函数引用了外层函数的局部变量（自由变量），它会做两件事：

1. 在外层函数里，把那个变量从"普通局部变量"改成"cell 变量"——它的值不再直接存在局部变量槽里，而是存到一个 cell 对象里，外层函数通过 cell 间接访问它。
2. 在内层函数里，把这个自由变量也链接到同一个 cell 对象，内层函数同样通过 cell 间接访问。

这样即使外层函数返回、外层局部命名空间消失，cell 对象依然被内层函数持有，cell 里存的值不会丢——这就是闭包能"记住"外层变量的底层原因。

可以借助 cell 对象亲眼看到这个机制：

```python
def make_counter():
    count = 0
    def inner():
        nonlocal count
        count += 1
        return count
    print("inner 的闭包变量：", inner.__closure__)
    print("cell 内容：", inner.__closure__[0].cell_contents)
    return inner

c = make_counter()
# 输出：
# inner 的闭包变量：(<cell at 0x...: int object at 0x...>,)
# cell 内容： 0
print(c())   # 输出：1
print(c.__closure__[0].cell_contents)   # 输出：1
```

`inner.__closure__` 是一个元组，存放内层函数的所有 cell 对象。每次调用 `c()` 修改 `count`，cell 里的 `cell_contents` 也会随之更新，外层和内层看到的都是这个 cell 里的最新值。

### 4.2 读闭包变量：LOAD_DEREF 查 cell

内层函数**读取**自由变量时，使用专门的字节码 `LOAD_DEREF`。它的逻辑是：从内层函数的 `__closure__` 里取出对应的 cell，再从 cell 里取出实际值。

对比看，读取一个普通局部变量用的是 `LOAD_FAST`，读取全局变量用的是 `LOAD_GLOBAL`。闭包的"读"走的是第三种路径——`LOAD_DEREF`，专门用来读 cell。

```python
import dis

def read_demo():
    x = 10
    def inner():
        print(x)   # 只读不写，x 是自由变量
    dis.dis(inner)

read_demo()
# 关键字节码：
#  3          0 LOAD_GLOBAL              0 (print)
#             2 LOAD_DEREF               0 (x)     ← 读闭包变量走 LOAD_DEREF
#             4 CALL_FUNCTION            1
#             6 POP_TOP
#             8 LOAD_CONST               0 (None)
#            10 RETURN_VALUE
```

`LOAD_DEREF 0` 表示从第 0 个 cell 里取值，这里就是 `x` 的 cell。读路径不涉及任何"绑定"操作，所以读闭包变量从不需要 `nonlocal`。

### 4.3 写闭包变量：不加 nonlocal 时为什么遮蔽

如果没有 `nonlocal`，内层函数里对捕获变量的赋值会走 `STORE_FAST`——这是给普通局部变量存值的字节码。也就是说，赋值根本没去碰 cell，而是在内层函数的局部变量槽里新建了一份。这就是"遮蔽"的底层来源：编译器看到赋值，就把名字标记为局部变量，赋值时用的 `STORE_FAST` 写进局部槽，和外层的 cell 毫无关系。

```python
import dis

def shadow_demo():
    x = 10
    def inner():
        x = 20     # 没有 nonlocal，x 被标记为局部变量
        print(x)
    dis.dis(inner)

shadow_demo()
# 关键字节码：
#  3          0 LOAD_CONST               1 (20)
#             2 STORE_FAST               0 (x)     ← 写局部变量走 STORE_FAST，写不进 cell
#  4          4 LOAD_GLOBAL              0 (print)
#             6 LOAD_FAST                0 (x)     ← 读的也是局部变量
#             8 CALL_FUNCTION            1
#            10 POP_TOP
#            12 LOAD_CONST               0 (None)
#            14 RETURN_VALUE
```

`STORE_FAST 0 (x)` 把 20 存进内层局部变量 `x`，完全绕过了 cell。紧接着 `LOAD_FAST 0 (x)` 读的也是这个局部 `x`。整个 `inner` 函数里 `x` 自始至终是局部变量，外层的 cell 一点没被碰。

这也解释了 `UnboundLocalError` 的成因：如果内层写的是 `x = x + 1`，编译期 `x` 被标记为局部，运行时先执行 `LOAD_FAST 0 (x)` 去读局部 `x` 来计算 `x + 1`，但此时局部 `x` 还没被 `STORE_FAST` 赋值，于是报"局部变量赋值前被引用"。

### 4.4 加 nonlocal 后：STORE_DEREF 写回 cell

加了 `nonlocal x` 之后，编译器对 `x` 的处理完全改变：它不再被标记为局部变量，而是标记为"来自外层的自由变量"，读写都走 cell。赋值时用的字节码也从 `STORE_FAST` 变成 `STORE_DEREF`——专门用来写 cell 的字节码。

```python
import dis

def nonlocal_demo():
    x = 10
    def inner():
        nonlocal x
        x = 20      # 写的是 cell，不是局部变量
        print(x)
    dis.dis(inner)

nonlocal_demo()
# 关键字节码：
#  3          0 LOAD_CONST               1 (20)
#             2 STORE_DEREF               0 (x)    ← 写 cell 走 STORE_DEREF，写回外层
#  4          4 LOAD_GLOBAL              0 (print)
#             6 LOAD_DEREF                0 (x)    ← 读也走 LOAD_DEREF
#             8 CALL_FUNCTION            1
#            10 POP_TOP
#            12 LOAD_CONST               0 (None)
#            14 RETURN_VALUE
```

`STORE_DEREF 0 (x)` 把 20 写进第 0 个 cell，而那个 cell 正是外层 `x` 的 cell。于是外层的 `x` 也变成了 20，因为两者共享同一个 cell。这就是 `nonlocal` "打通写通道"的底层动作——把 `STORE_FAST`（写局部）换成 `STORE_DEREF`（写 cell）。

**LOAD_DEREF / STORE_DEREF 对照表**

| 操作 | 没 nonlocal | 有 nonlocal | 效果 |
|---|---|---|---|
| 读捕获变量 | `LOAD_FAST`（读局部） | `LOAD_DEREF`（读 cell） | 有 nonlocal 时读 cell，读到外层最新值 |
| 写捕获变量 | `STORE_FAST`（写局部） | `STORE_DEREF`（写 cell） | 有 nonlocal 时写 cell，外层可见 |

没有 `nonlocal` 时读也走 `LOAD_FAST`，因为整个函数体里 `x` 都被标记为局部变量。有 `nonlocal` 时读和写都走 `DEREF` 系列，读写都作用在共享的 cell 上。

### 4.5 cell 共享让修改对外层可见

`nonlocal` 之所以能让内层修改"真的传到外层"，根本原因就是 cell 共享。外层函数的 `x` 和内层函数的 `x` 各自通过 cell 间接访问同一个 cell 对象，无论谁写 cell，另一边读到的都是最新值。

```python
def show_shared_cell():
    x = 1
    def inner():
        nonlocal x
        x = 2
        print("inner 看到的 x 的 cell：", inner.__closure__[0])
    print("outer 的 x 的 cell：", show_shared_cell.__code__.co_cellvars)
    inner()
    # 外层也能看到改动，因为 cell 是同一个
    print("outer 现在的 x =", x)

show_shared_cell()
```

`co_cellvars` 是外层函数代码对象的一个属性，列出哪些局部变量被做成了 cell（因为被内层函数引用）。`inner.__closure__` 是内层函数的 cell 元组。两边指向的是同一个 cell 对象，所以修改会双向可见。

更直观地看，可以在 `inner` 里修改 cell，外层立刻能看到：

```python
def verify():
    value = "原始"
    def inner():
        nonlocal value
        value = "被内层改了"
    print("调用 inner 前，value =", value)
    inner()
    print("调用 inner 后，value =", value)

verify()
# 输出：
# 调用 inner 前，value = 原始
# 调用 inner 后，value = 被内层改了
```

这是因为 `inner` 里的 `value = "被内层改了"`（`STORE_DEREF`）写回了 cell，而外层的 `print(value)` 读 cell（外层函数读自己的 cell 变量走 `LOAD_DEREF`），自然读到新值。

### 4.6 可变对象原地修改为何不需要 nonlocal

回到那个关键细节：为什么对 `list`、`dict` 的原地修改不需要 `nonlocal`？用字节码看一看就明白了。

```python
import dis

def mutable_demo():
    items = []
    def inner():
        items.append(1)   # 原地修改，不赋值给 items
    dis.dis(inner)

mutable_demo()
# 关键字节码：
#  3          0 LOAD_DEREF               0 (items)   ← 读 cell 拿到 list 对象
#             2 LOAD_METHOD              0 (append)
#             4 LOAD_CONST               1 (1)
#             6 CALL_METHOD              1
#             8 POP_TOP
#            10 LOAD_CONST               0 (None)
#            12 RETURN_VALUE
```

整个 `inner` 里只出现了一次 `items`，那次是 `LOAD_DEREF`——把 cell 里的 `list` 对象加载到栈上，然后调用它的 `append` 方法。从头到尾**没有对 `items` 赋值**，所以根本不涉及 `STORE_FAST` 或 `STORE_DEREF`，`items` 始终是个自由变量，从 cell 读出来用。

`items.append(1)` 这个操作改变的是 `list` 对象的内部内容，并没有改变 `items` 这个名字指向哪个对象（它还指向同一个 `list`，只是 `list` 里多了一个元素）。没有重新绑定，就不需要 `nonlocal`。

对比 `items = items + [1]`：

```python
import dis

def rebind_demo():
    items = []
    def inner():
        items = items + [1]   # 对 items 重新赋值
    dis.dis(inner)

rebind_demo()
# 关键字节码（部分）：
#  3          0 LOAD_FAST                0 (items)    ← LOAD_FAST，读局部
#             2 LOAD_CONST               1 (1)
#             4 BUILD_LIST               1
#             6 BINARY_ADD
#             8 STORE_FAST               0 (items)    ← STORE_FAST，写局部
```

一旦写了 `items = ...`，字节码立刻变成 `LOAD_FAST`/`STORE_FAST`，全部走局部变量路径，cell 被彻底绕开。所以 `items = items + [1]` 会报 `UnboundLocalError`（`LOAD_FAST` 时局部 `items` 还没赋值），而 `items.append(1)` 不会。

**核心区别**

- `items.append(1)`：加载 cell 里的对象 → 调它的方法改内容 → 不碰绑定。路径：`LOAD_DEREF` + 方法调用。
- `items = items + [1]`：对名字 `items` 重新赋值 → 触发局部变量规则 → cell 被绕过。路径：`LOAD_FAST` + `STORE_FAST`。

这就是"改可变对象不需要 nonlocal、重新绑定需要 nonlocal"的机制本质——决定要 `nonlocal` 的不是"对象可不可变"，而是"有没有对变量名做重新绑定"。

### 4.7 nonlocal 的编译期处理

`nonlocal` 是一条**编译期指令**，它不产生运行时字节码，而是在编译时改变编译器对变量作用域的判定。

当编译器扫描到 `nonlocal x` 时，它会：

1. 从内层函数向外逐层查找，直到找到某个外层函数定义了 `x` 这个局部变量。
2. 把内层函数里的 `x` 标记为"指向那个外层 cell 的自由变量"。
3. 把内层函数对 `x` 的读写字节码定为 `LOAD_DEREF`/`STORE_DEREF`，而不是 `LOAD_FAST`/`STORE_FAST`。

如果找不到外层绑定，编译器直接报 `SyntaxError`——这就是为什么"外层没有同名变量时 `nonlocal` 会报错"。这个错误在编译期就发生，运行期根本到不了。

这也解释了 `nonlocal` 声明为什么必须在使用前：编译器需要先知道 `x` 是自由变量，才能正确生成 `LOAD_DEREF`/`STORE_DEREF`。如果先执行了 `x = 1`（生成 `STORE_FAST`），再 `nonlocal x`，编译器就矛盾了——同一个 `x` 既是局部又是自由变量，于是报 `SyntaxError: name 'x' is assigned to before nonlocal declaration`。

### 4.8 cell 的延迟绑定与多闭包共享

一个外层变量被做成了 cell 之后，所有引用它的内层函数都共享同一个 cell 对象。这意味着同一个外层变量的多个闭包，看到的是同一份值——这点和"每次调用外层函数生成独立 cell"不矛盾，因为是"同一次调用内的多个内层函数"共享。

```python
def make_pair():
    value = 0
    def set_v(v):
        nonlocal value
        value = v
    def get_v():
        return value    # 只读，不用 nonlocal
    return set_v, get_v

setter, getter = make_pair()
setter(42)
print(getter())   # 输出：42
```

`set_v` 和 `get_v` 来自同一次 `make_pair()` 调用，它们捕获的是同一个 `value` cell。`set_v` 通过 `STORE_DEREF` 把 42 写进 cell，`get_v` 通过 `LOAD_DEREF` 从同一个 cell 读出来，自然得到 42。这是"用闭包模拟对象（setter/getter）"的底层基础——多个方法共享同一个 cell，相当于多个方法共享同一个实例属性。

如果把 `make_pair()` 再调一次，得到的就是另一组全新的 cell，和上一组毫无关系：

```python
setter2, getter2 = make_pair()
setter2(100)
print(getter())    # 输出：42     （第一组，没被影响）
print(getter2())   # 输出：100    （第二组的 cell）
```

`setter2`/`getter2` 是第二次调用 `make_pair()` 生成的，它们用的是新的 `value` cell。这就是"每次调用外层函数生成独立 cell"的体现，也是闭包能做"对象实例"的底层支撑——每次调用外层函数相当于"new 一个对象"，每个对象有自己的状态 cell。

## 5. 总结

### 5.1 本文要点回顾

- **闭包默认只能"读"外层变量**：内层函数里只要对某个名字有赋值，Python 就把它标记为局部变量，赋值不会修改外层，反而会遮蔽或报 `UnboundLocalError`。
- **nonlocal 打通写通道**：`nonlocal 变量名` 告诉编译器"这个名字指向外层函数的同名局部变量"，赋值会真正写回外层 cell，让修改对外层可见。
- **读 vs 写的不对称**：读捕获变量走 `LOAD_DEREF` 一直可用；写捕获变量没 `nonlocal` 时走 `STORE_FAST`（写局部）、有 `nonlocal` 时走 `STORE_DEREF`（写 cell）。
- **可变对象原地修改不需要 nonlocal**：`lst.append(x)`、`d[k] = v` 只是改对象内容、不重新绑定名字，走 `LOAD_DEREF` + 方法调用，不触发局部变量规则；而 `lst = lst + [x]` 有重新赋值，必须 `nonlocal`。
- **典型场景**：计数器、累加器、状态机切换、带调用次数/速率限制的函数、生成器式状态推进，都是 `nonlocal` 的主场。
- **nonlocal vs global**：`nonlocal` 指向外层函数局部（Enclosing），`global` 指向模块全局；两者场景几乎不重叠。
- **多变量与就近匹配**：`nonlocal a, b, c` 一次声明多个；多层外层同名变量时匹配最近一层，要跨层传递需要每层都声明 `nonlocal`。
- **闭包替代类的取舍**：状态少、接口简单、要"函数式私有状态"时用 `nonlocal` 闭包；状态多、方法多、要面向对象扩展性时用类。

### 5.2 读完本文你应能掌握

- 准确说出"闭包默认能读不能写"的根源，并用 `UnboundLocalError` 和"遮蔽"两个现象说明"写"的坑。
- 在计数器、累加器、状态机、调用限制、状态推进等场景里正确使用 `nonlocal`，而不是靠 `list[0] += 1` 之类的 hack。
- 清楚判断"这个操作要不要 nonlocal"：看是否对捕获变量名重新绑定，而不是看对象可不可变。
- 用 `dis` 模块查看 `LOAD_DEREF`/`STORE_DEREF`/`STORE_FAST` 字节码，从机器层面解释 `nonlocal` 的作用。
- 区分 `nonlocal` 和 `global` 的作用域指向，不把全局变量误用 `nonlocal` 声明。
- 在"用 nonlocal 闭包"和"用类"之间做合理取舍，并说明各自的封装性和可维护性差异。