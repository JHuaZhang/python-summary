---
group:
  title: 【12】函数核心机制
  order: 12
order: 10
title: 作用域LEGB规则
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是作用域

在 Python 中，每一个名字（变量名、函数名、类名等）都不是凭空存在的，它们都存活在一个特定的"命名空间"（namespace）里。作用域（scope）就是"在当前这段代码里，哪些名字是可见的、能被访问的"这一可见性范围的统称。你可以把作用域理解成一道无形的墙：墙内的名字彼此可见，墙外的名字对墙内则未必可见。

之所以需要作用域机制，是因为程序里的名字会越起越多，如果所有名字都挤在同一个全局空间里，重名冲突几乎不可避免——你在函数里写了一个临时变量 `count`，结果不小心覆盖了别人在别处定义的 `count`，调试起来会非常痛苦。作用域通过"分层隔离"解决了这个问题：函数内部的名字只在函数内部有效，函数执行完毕后这些名字就会随着函数的局部命名空间一起被回收，不会污染外部环境。

理解作用域的核心，在于搞清 Python 在执行到一处名字引用时，到底按什么顺序去"找"这个名字。Python 采用的是一套被称为 **LEGB** 的查找规则，它定义了四层依次查找的作用域：

- **L（Local）**：局部作用域，即当前函数体内定义的名字。
- **E（Enclosing）**：外层嵌套函数的作用域，即包围当前函数的那些外层函数的局部名字。
- **G（Global）**：模块级全局作用域，也就是当前 `.py` 文件（模块）顶层定义的名字。
- **B（Built-in）**：内置作用域，包含 Python 解释器启动时自动加载的内置名字，如 `print`、`len`、`int`、`ValueError` 等。

LEGB 这个缩写本身就是查找顺序：先在 L 找，找不到就去 E，再找不到去 G，最后去 B。如果四层都找不到，Python 会抛出 `NameError`，告诉你这个名字在当前作用域里根本不存在。

### 1.2 作用域与命名空间的关系

命名空间是"名字到对象的映射"这个实实在在的字典结构，而作用域是"这个名字在哪些代码区域里可见"这种逻辑范围的描述。二者的关系可以这样理解：作用域决定了"去哪些命名空间里找名字"，命名空间则负责"真的存这些名字"。

Python 中主要有两种命名空间是"物理可见"的：

- 模块全局命名空间，可以通过内置函数 `globals()` 拿到一个表示它的字典。
- 函数局部命名空间，可以通过内置函数 `locals()` 拿到一个表示它的字典（在模块顶层调用 `locals()` 时，它返回的其实就是全局命名空间）。

而 Enclosing 作用域对应的命名空间无法直接通过某个内置函数"按层"获取，它由外层函数各自的局部命名空间逐层构成；Built-in 作用域则对应 `builtins` 模块的命名空间。

### 1.3 最小示例：直观感受 LEGB

下面这个例子构造了一条从局部到内置的查找链，让你先直观感受一下四层作用域的存在：

```python
# 模块顶层，定义全局作用域的名字
x = "global 的 x"           # 这属于 G 层

def outer():
    # 外层函数 inner 之外、outer 之内的名字属于 E 层（对 inner 而言）
    x = "enclosing 的 x"    # 这属于 outer 的局部作用域，但对 inner 来说是 Enclosing

    def inner():
        # inner 自己的局部名字属于 L 层
        x = "local 的 x"
        print(x)            # 查找顺序：L 先命中，直接用 inner 的 x

    inner()

outer()
# 输出：local 的 x
```

如果把 `inner` 里的 `x = "local 的 x"` 这一行去掉，那么 L 层就找不到 `x` 了，Python 会向上到 E 层（`outer` 的局部）去查，于是会打印 `enclosing 的 x`。再继续去掉 `outer` 里的 `x`，就会查到 G 层，打印 `global 的 x`。这个"逐层向上找不到再往上"的过程，就是 LEGB 的精髓。

下面再看一个"一直查到 Built-in"的例子：

```python
# 没有在任何地方定义 print、len，它们来自 Built-in 作用域
def show():
    # 当前函数局部没有 print，外层也没有，模块全局也没有
    # 最终在 Built-in 作用域里找到了内置函数 print
    print(len([1, 2, 3]))

show()
# 输出：3
```

这段代码看起来平平无奇，但它其实揭示了：你每天都能顺利调用 `print`、`len` 不是因为它们是"关键字"，而是因为 LEGB 查找的最后一步会把目光投到 Built-in 作用域，在那里找到这些内置对象。这也意味着，如果你在 G 层定义了一个同名的 `len`，它会"遮蔽"（shadow）掉内置的 `len`：

```python
# 在模块全局作用域里定义一个同名的 len，遮蔽内置 len
len = "我被定义在全局了"

def use_len():
    # 查找 len：L 没有 → E 没有 → G 命中（拿到了字符串，不是内置函数）
    print(len)

use_len()
# 输出：我被定义在全局了
```

这种"同层名字优先、上层被遮蔽"的现象，是 LEGB 的另一个重要特性：一旦在某一层找到了名字，查找立刻终止，不会再继续往上找。所以即便 Built-in 里真的有 `len`，但因为 G 层先命中了一个同名对象，内置的那个就被挡住了。

## 2. 核心内容

### 2.1 L 层：Local 局部作用域

Local 作用域是最内层的作用域，指的是"在一个函数体内定义的名字"。当你写 `def foo():` 时，`foo` 函数体内部就是它自己的一个局部作用域；在这个函数体里通过赋值语句（`name = value`）、`def`、`class`、`import`、`for` 循环变量、`with ... as`、`except ... as` 等方式引入的名字，都算这个函数的局部名字。

理解 Local 作用域，有几点必须牢牢把握：

**第一，函数每被调用一次，就产生一个全新的局部命名空间。** 这意味着两次调用同一个函数，彼此的局部变量互不影响，因为它们分属不同的命名空间实例。

```python
def counter(start):
    # 每次调用都会创建一个新的局部命名空间，
    # 因此 n 是属于"本次调用"的，不会和别的调用混淆
    n = start
    print(f"本次调用的 n = {n}")

counter(10)
counter(20)
# 输出：
# 本次调用的 n = 10
# 本次调用的 n = 20
```

**第二，函数内"赋值即局部"。** 这里说的"赋值"不仅指 `=`，还包括增强赋值 `+=`、`-=` 等。只要函数体内某处对某个名字做了赋值，Python 在编译这个函数时就会把该名字标记为"局部变量"——哪怕赋值语句在引用之后，甚至根本没执行到。这是一个非常容易踩坑的点，后面讲 `UnboundLocalError` 时会专门展开。

**第三，局部作用域只在函数执行期间存在。** 函数一旦返回，它本次调用的局部命名空间就被丢弃（除非被闭包捕获，后面会讲），里面的局部变量会随之被垃圾回收。所以你不能在函数外面去访问函数内部的变量：

```python
def make_local():
    inner_var = "我只在 make_local 执行期间活着"

make_local()
# 函数已返回，inner_var 所在的局部命名空间已销毁
try:
    print(inner_var)
except NameError as e:
    print(f"访问失败：{e}")
# 输出：访问失败：name 'inner_var' is not defined
```

**第四，控制结构（if/for/while/with/try）不创建新的作用域。** 这是 Python 与 C/Java 等语言的一个显著区别：在 Python 中，`for` 循环里的循环变量不会随循环结束而消失，它会留在"包含这段循环的最近一层函数（或模块）作用域"里。

```python
def demo_for_scope():
    for i in range(3):
        item = f"第 {i} 项"
        # i 和 item 都是 demo_for_scope 的局部变量
        print(item)
    # 循环结束后，i 和 item 仍然可见，值是循环最后一次赋的值
    print(f"循环结束后：i = {i}，item = {item!r}")

demo_for_scope()
# 输出：
# 第 0 项
# 第 1 项
# 第 2 项
# 循环结束后：i = 2，item = '第 2 项'
```

这一点经常被误解为"循环变量泄漏到全局"，其实没有"泄漏"——它本来就属于外层函数的局部作用域，只是控制结构没有再给它套一层独立作用域而已。同理：

```python
if True:
    in_if = "我在 if 块里被定义"
    # if 不创建新作用域，in_if 属于当前模块全局作用域

print(in_if)
# 输出：我在 if 块里被定义
```

把上面这段放在模块顶层运行，`in_if` 就成了一个货真价实的全局变量——这进一步说明 Python 的控制结构不划分作用域，只有函数和模块（以及类体，略有特殊）才会划分。

### 2.2 E 层：Enclosing 外层嵌套函数作用域

Enclosing 作用域只存在于"函数嵌套函数"的场景中。当你在一个函数 A 的函数体里又定义了另一个函数 B 时，B 是 A 的内层函数，A 是 B 的外层函数。对 B 而言，A 的局部命名空间就是它的 Enclosing 作用域。如果嵌套更深——A 里嵌 B、B 里嵌 C——那么对 C 来说，B 和 A 的局部命名空间依次都是它的 Enclosing 作用域，查找时会按由内到外的顺序逐层向上。

Enclosing 作用域最重要的用途，是让内层函数能够"看到"外层函数的局部变量，这正是闭包（closure）得以工作的基础。

```python
def make_adder(base):
    # base 是 make_adder 的局部变量
    # 对被返回的内层函数 adder 来说，base 属于 Enclosing 作用域

    def adder(x):
        # 在 adder 内部查找 base：L 没有 → E（make_adder 的局部）命中
        return base + x

    return adder

# 每次调用 make_adder 会产生一个独立的 adder 函数对象，
# 它各自"记住"了自己被创建时的 base
add10 = make_adder(10)
add20 = make_adder(20)

print(add10(5))   # 输出：15
print(add20(5))   # 输出：25
```

这里的关键点在于：`make_adder` 调用结束、`return adder` 之后，`make_adder` 的本次调用命名空间"按理"应该被销毁，`base` 应该随之消失。但实际上 `adder` 函数对象里保留了一份对 `base` 所在"cell 对象"的引用（详见第 4 章原理），所以 `base` 并没有被回收，而是被 `adder` "带走了"。这就是闭包的本质：函数对象 + 它所引用的 Enclosing 变量。

再来看一个"多层 Enclosing"的例子，把查找链拉长一点：

```python
def level1():
    msg = "level1 的 msg"

    def level2():
        # 对 level3 而言，level2 和 level1 的局部都是 Enclosing
        msg = "level2 的 msg"

        def level3():
            # 查找 msg：L 没有 → E（level2 的局部）命中，得到 level2 的 msg
            print(msg)

        level3()

    level2()

level1()
# 输出：level2 的 msg
```

如果把 `level2` 里的 `msg = "level2 的 msg"` 删掉，那么 `level3` 在 `level2` 这一层 Enclosing 找不到 `msg`，就会继续向上到 `level1` 这一层 Enclosing 去找，从而打印 `level1 的 msg`。这正说明 Enclosing 不是"单一一层"，而是"由内向外逐层排列的外层函数作用域链"。

**重要边界：Enclosing 只看函数嵌套，不看代码块嵌套。** 也就是说，Enclosing 作用域的形成必须是真的在函数体里定义了另一个函数，而不是把一段代码块放在某个条件分支或循环里。下面这个反例就能说明这点：

```python
def outer_demo():
    a = "outer 的 a"
    if True:
        # 这里并没有创建新的作用域，if/else 块都属于 outer_demo 的局部作用域
        a = "我在 if 块里改了 a"
    # a 被同一个局部作用域内的赋值语句修改了
    print(a)

outer_demo()
# 输出：我在 if 块里改了 a
```

这里没有任何"内层函数"被定义，所以并不存在 Enclosing 作用域这一层，`a` 一直都是 `outer_demo` 的局部变量，`if` 块里的赋值就直接改了它。

### 2.3 G 层：Global 模块全局作用域

Global 作用域就是"一个 `.py` 文件（模块）顶层所定义的所有名字组成的命名空间"。当你在模块的最外层写 `x = 1`、`def foo(): ...`、`class A: ...`、`import os`，这些名字统统进入模块的全局命名空间。

对模块里任何一个函数来说，这个模块的全局命名空间就是它的 G 层。也就是说，不管函数嵌套多深，只要它属于这个模块，它的 G 层都是同一个——即这个模块自己的全局命名空间。

```python
# === 模块顶层，全部进入 Global 作用域 ===
PI = 3.1415926           # 全局变量
config = {"debug": True}  # 全局变量

def area(r):
    # r 是局部变量；PI 来自 G 层
    return PI * r * r

def toggle_debug():
    # config 来自 G 层
    config["debug"] = not config["debug"]
    print(f"debug 切换为 {config['debug']}")

print(area(2))     # 输出：12.5663704
toggle_debug()      # 输出：debug 切换为 False
```

**关于全局变量的修改，有一个非常关键的规则：函数内部对全局变量"赋值"和"读 + 修改其内容"是两码事。**

- 如果全局变量是可变对象（如列表、字典），你在函数内部调用它的方法（如 `lst.append(x)`、`d["k"] = v`），这是"修改对象内容"，并不涉及对名字本身重新赋值，因此不需要 `global` 声明，修改对全局可见。

```python
tags = []   # 全局可变对象

def add_tag(tag):
    # 这里没有对 tags 重新赋值，只是调用了它的 append 方法
    # 所以 LEGB 在 G 层找到 tags 这个列表对象，对其内容做了修改
    tags.append(tag)

add_tag("python")
add_tag("scope")
print(tags)
# 输出：['python', 'scope']
```

- 而如果你想在函数内部对全局变量名本身重新赋值，例如 `count = count + 1`，则必须先用 `global` 声明这个名字，否则 Python 会把 `count` 当成局部变量（因为出现了赋值语句），从而引发 `UnboundLocalError`。

```python
count = 0   # 全局变量

def bad_increase():
    # 函数里有对 count 的赋值，于是 count 被视为局部变量
    # 但赋值右侧又试图读取 count，此时局部 count 还没绑定，报错
    count = count + 1

try:
    bad_increase()
except UnboundLocalError as e:
    print(f"出错：{e}")
# 输出：出错：local variable 'count' referenced before assignment
```

加上 `global` 声明后就能正常工作：

```python
count = 0

def good_increase():
    global count      # 告诉 Python：这里的 count 指全局的那个
    count = count + 1 # 读写都作用于全局 count

good_increase()
good_increase()
print(count)
# 输出：2
```

`global` 的更详细用法（一声明多名字、与 `import` 的交互等）会放在后续专门讲 `global` 关键字的笔记里展开，本篇只需要知道"函数内对全局名重新赋值需要 `global` 声明"这一点即可。

### 2.4 B 层：Built-in 内置作用域

Built-in 作用域是最外层的作用域，它由 Python 解释器在启动时自动构建，里面存放了所有内置对象：内置函数（`print`、`len`、`range`、`open` 等）、内置类型（`int`、`str`、`list`、`dict` 等）、内置异常（`ValueError`、`KeyError` 等）以及少量内置常量（`True`、`False`、`None`、`__name__` 等）。

你可以通过 `import builtins` 来查看 Built-in 作用域的内容，`dir(builtins)` 会列出全部内置名字：

```python
import builtins
# 看看前几个内置名字
print([name for name in dir(builtins) if not name.startswith("_")][:10])
# 输出（不同版本可能略有差异）：['ArithmeticError', 'AssertionError', 'AttributeError', 'BaseException', 'BlockingIOError', 'BrokenPipeError', 'BufferError', 'BytesWarning', 'ChildProcessError', 'ConnectionError']

# 内置函数其实是 builtins 模块的属性
print(builtins.len is len)
# 输出：True
```

Built-in 作用域的特殊之处有两点：

**第一，它是 LEGB 的最后一站，查找前几层都找不到才会落到这里。** 这意味着如果你在 G/E/L 层定义了同名对象，就会"遮蔽"内置对象。前面已经演示过用模块全局的 `len` 遮蔽内置 `len` 的情形。在函数里遮蔽也是同理：

```python
def shadow_len():
    # 在函数内部定义一个局部 len，遮蔽内置 len
    len = "我只是一个字符串"
    print(len)        # L 层命中，打印字符串
    # 如果你此时还想调用内置 len，就会出错：
    try:
        print(len([1, 2, 3]))
    except TypeError as e:
        print(f"不能把 str 当函数用：{e}")

shadow_len()
# 输出：
# 我只是一个字符串
# 不能把 str 当函数用：'str' object is not callable
```

**第二，Built-in 作用域本身是可写的。** 虽然不推荐，但你确实可以给 `builtins` 模块添加或覆盖属性，这会影响到整个解释器中所有对 Built-in 作用域的查找：

```python
import builtins

# 给 builtins 模块添加一个自定义名字
builtins.greet = lambda name: f"你好，{name}"

def call_greet_anywhere():
    # 在任何函数里都能直接"凭空"使用 greet，因为它在 Built-in 作用域
    print(greet("Python"))

call_greet_anywhere()
# 输出：你好，Python
```

这种做法在实际工程中几乎不会用到，了解它主要是为了说明"Built-in 作用域并不是石板一块，它其实就是 builtins 模块的命名空间"。

### 2.5 UnboundLocalError：函数内赋值导致名字被当作局部

这是初学者最常踩的一个坑，也是理解"作用域在编译期确定"这一性质最好的切入点。

来看一个典型场景：你想在函数里基于一个全局变量累加，于是随手写了这样一段：

```python
total = 100

def add_to_total(n):
    total = total + n     # 期望：把全局 total 加上 n 后再存回 total
    return total

try:
    print(add_to_total(50))
except UnboundLocalError as e:
    print(f"报错：{e}")
# 输出：报错：local variable 'total' referenced before assignment
```

按直觉，`total = total + n` 右侧的 `total` 应该去查全局，拿到 `100`，然后赋值给左侧的 `total`。但 Python 不这么干。它的规则是：**只要函数体中某个名字出现了赋值语句（包括 `=`、`+=`、`-=`、`def`、`class`、`import` 等"绑定"操作），解释器在编译这个函数时就会把该名字标记为"局部变量"，覆盖整个函数体——与赋值语句出现在函数的哪个位置无关，也与它是否真的会被执行到无关。**

于是在 `add_to_total` 里，`total` 因为有一处赋值就被当成了局部变量。当执行 `total + n` 时，Python 去 L 层找 `total`，发现局部 `total` 虽然存在（编译期已登记），但还没"绑定"到任何值（赋值语句右侧还没执行完），于是抛出 `UnboundLocalError`。

这和"名字完全不存在"（`NameError`）是两回事：`UnboundLocalError` 说的是"这个局部名字是存在的，只是现在还没有绑定值"，它是 `NameError` 的子类。

下面再给一个更能体现"与位置无关"的例子——把赋值放在 `if` 分支里，而这个分支根本不会执行：

```python
msg = "我是全局 msg"

def show_msg(flag):
    if flag:
        msg = "我是局部 msg"   # 即使 flag=False 不会执行到这里，
                               # 编译器看到这行赋值，仍把 msg 当局部
    print(msg)                 # 此时局部 msg 没绑定，报错

try:
    show_msg(False)
except UnboundLocalError as e:
    print(f"报错：{e}")
# 输出：报错：local variable 'msg' referenced before assignment
```

即便赋值语句永远执行不到，它对"名字是局部还是全局"的判定照样生效。要想在函数里既读全局又给它赋值，就得显式用 `global`（或 `nonlocal`，对于 Enclosing 变量）声明。

**修复全局版的写法：**

```python
total = 100

def add_to_total(n):
    global total          # 声明 total 为全局
    total = total + n     # 现在 total 统一指向全局
    return total

print(add_to_total(50))   # 输出：150
print(add_to_total(30))   # 输出：180
```

**修复 Enclosing 版的写法（用 `nonlocal`）：**

```python
def make_counter():
    count = 0                # Enclosing 变量

    def step():
        nonlocal count       # 声明 count 指向外层函数的局部变量
        count += 1
        return count

    return step

c1 = make_counter()
print(c1(), c1(), c1())
# 输出：1 2 3
```

`nonlocal` 与 `global` 的详细对比将留到后续的专题笔记里讲，本篇只需建立"函数内赋值默认创建局部变量，想改外层名字必须用 `global`/`nonlocal` 声明"这一认识即可。

### 2.6 闭包与 Enclosing 作用域

闭包（closure）和 Enclosing 作用域是紧密绑定的两个概念。简单说，当一个内层函数引用了它的外层函数（Enclosing 作用域）的变量，并且这个内层函数被作为返回值传到外层函数之外时，被引用的外层变量不会随外层函数调用结束而销毁，而是被内层函数"随身携带"。这种"内层函数 + 它捕获的外层变量"的组合就叫做闭包。

```python
def make_multiplier(factor):
    # factor 是 Enclosing 变量
    def multiply(x):
        # 引用外层 factor，形成闭包
        return x * factor
    return multiply

double = make_multiplier(2)
triple = make_multiplier(3)

print(double(10))   # 输出：20
print(triple(10))   # 输出：30
```

`make_multiplier(2)` 调用结束后，按普通作用域规则，它的局部命名空间应该被销毁。但由于返回的 `multiply` 函数对象引用了 `factor`，Python 会把 `factor` 存进一个特殊的"cell 对象"里，并将其挂到 `multiply` 的 `__closure__` 属性上。只要 `multiply` 还活着，`factor` 就一直活着。

你可以直接看到闭包里捕获了哪些变量：

```python
print(double.__closure__)
# 输出：(<cell at 0x...: int object at 0x...>,)

# 看捕获的变量名
print(double.__code__.co_freevars)
# 输出：('factor',)

# 取出 cell 里存的实际值
print(double.__closure__[0].cell_contents)
# 输出：2
```

`co_freevars` 叫"自由变量"（free variables）——指在函数内部使用但没有在函数内部绑定的名字。它们正是从 Enclosing 作用域"借用"来的。闭包的核心机制就是把这些自由变量和函数对象绑定在一起。

**闭包的一个经典应用：计数器。**

```python
def make_counter():
    count = 0

    def inner():
        nonlocal count   # 声明 count 指向 Enclosing 变量，允许修改
        count += 1
        return count

    return inner

counter = make_counter()
print(counter())   # 输出：1
print(counter())   # 输出：2
print(counter())   # 输出：3
```

这里 `count` 被闭包捕获并持续累加。注意它与"全局变量计数器"的区别：全局计数器暴露在模块顶层，任何代码都能碰它；而闭包把 `count` 藏在 `inner` 的 Enclosing 作用域里，外部无法直接访问 `count`，只能通过 `counter()` 这一受控接口去修改它。这就是闭包提供的一种轻量级"封装"能力。

**闭包捕获的是变量，不是值。** 这一点常常让人意外。下面这个"循环里创建闭包"的经典面试题最能说明问题：

```python
def make_funcs():
    funcs = []
    for i in range(3):
        funcs.append(lambda: i)   # 这里的 i 是自由变量，绑定到 i 这个名字
    return funcs

for f in make_funcs():
    print(f())
# 输出：
# 2
# 2
# 2
```

你可能以为会输出 `0 1 2`，但其实全是 `2`。原因在于：三个 lambda 都捕获了同一个变量 `i`（而不是当时 `i` 的那个值），当循环跑完后，`i` 的值已经是 `2`。等我们真正去调用这些 lambda 时（`for f in make_funcs()`），它们去查 `i`，拿到的自然都是 `2`。

要打印 `0 1 2`，有一个常见技巧：用默认参数把当时的值"冻结"下来：

```python
def make_funcs_fixed():
    funcs = []
    for i in range(3):
        # i=i 是关键：把当前 i 的值作为默认参数值，
        # 随每次循环创建一个独立的局部绑定
        funcs.append(lambda i=i: i)
    return funcs

for f in make_funcs_fixed():
    print(f())
# 输出：
# 0
# 1
# 2
```

这里 `lambda i=i: i` 中的参数 `i` 是 lambda 自己的局部变量，而右边的 `i` 是循环变量——等号在每次循环时执行，把当时的循环变量值赋给参数 `i`。这样每个 lambda 都自带了一份当时的值，彼此独立。这个例子很好地说明：闭包延迟查询自由变量的特性，决定了它"捕获的是变量引用而非当时的快照值"。

### 2.7 locals() 与 globals()：查看当前命名空间

Python 提供了两个内置函数用来查看命名空间的内容：

- `globals()` 返回"当前模块的全局命名空间"对应的字典。
- `locals()` 返回"当前所在局部作用域"对应的字典；如果在模块顶层调用，它返回的就是全局命名空间。

```python
# 在模块顶层调用
print("globals() 里有 print 吗？", "print" in globals())   # 通常不在（print 是内置）
print("globals() 里有 builtins 吗？", "builtins" in globals())

x = 42
# 刚定义完 x，全局命名空间里就出现了它
print("x 的值:", globals().get("x"))   # 输出：42
```

在函数内部调用 `locals()`，则能看到本次调用的局部变量：

```python
def inspect_local(a, b):
    c = a + b
    # locals() 返回当前局部命名空间的一个快照字典
    snapshot = locals()
    print("局部命名空间快照：", snapshot)
    return c

inspect_local(10, 20)
# 输出示例：局部命名空间快照： {'a': 10, 'b': 20, 'c': 30}
```

**注意 `locals()` 返回的字典是"快照"，不是实时镜像。** 也就是说，你通过 `locals()` 拿到字典后，再去新增或修改局部变量，这个字典不会自动同步更新；在函数里修改 `locals()` 返回的字典也不会真正影响局部变量：

```python
def try_modify_locals():
    x = 1
    d = locals()
    d["x"] = 999      # 改的是快照字典，不影响真正的局部变量 x
    d["y"] = "新变量"  # 也不会真的创建局部变量 y
    print("修改快照后，x =", x)
    print("重新调用 locals():", locals())

try_modify_locals()
# 输出示例：
# 修改快照后，x = 1
# 重新调用 locals(): {'x': 1, 'd': {...}}
```

相比之下，`globals()` 返回的字典就是"实时"的全局命名空间本身——向它里面写入新键值对，真的会创建出新的全局变量：

```python
def create_global_via_dict():
    globals()["brand_new"] = "我是被 globals() 写进去的"

create_global_via_dict()
print(brand_new)
# 输出：我是被 globals() 写进去的
```

虽然能这么干，但直接用 `globals()` 去动态创建全局变量非常不推荐——可读性差、静态分析工具看不出来、维护困难。它更多用于调试和内省场景。

### 2.8 模块级作用域与函数级作用域对比

把模块级和函数级作用域对比来看，能更清楚地看出二者的分工和边界。

| 维度 | 模块级作用域（Global） | 函数级作用域（Local） |
| --- | --- | --- |
| 谁在创建名字 | 模块顶层的赋值 / def / class / import | 函数体内的赋值 / def / class / import / for 变量 / with-as / except-as |
| 生命周期 | 模块被加载起到模块被卸载 | 函数本次调用起到函数返回（被闭包捕获的外层变量除外）|
| 同名隔离 | 多个模块之间的全局命名空间天然隔离，靠模块名访问 | 每次函数调用都产生新的局部命名空间，调用间天然隔离 |
| 如何查看 | `globals()` | `locals()` |
| 是否可被内部代码看见 | 模块里的所有函数都能看见它（G 层）| 只有该函数自身和其内层函数能看见（L 或 E 层）|

下面用一个对照示例把上面这些点串起来：

```python
# === 模块顶层 ===
module_var = "全局变量"

def outer_fn():
    outer_local = "outer 的局部"

    def inner_fn():
        inner_local = "inner 的局部"
        # 站在 inner_fn 里看名字：
        # L 层：inner_local
        # E 层：outer_local
        # G 层：module_var
        # B 层：print（内置）
        print(inner_local, "/", outer_local, "/", module_var)

    inner_fn()
    # 到了这里，inner_local 不可见（它属于 inner_fn 的局部）
    print(outer_local, "/", module_var)
    # module_var 是全局的，outer_local 是本函数局部的

outer_fn()
# 到了这里，outer_local / inner_local 都不可见
print(module_var)
# 输出：
# inner 的局部 / outer 的局部 / 全局变量
# outer 的局部 / 全局变量
# 全局变量
```

这段代码的关键看点是：函数一旦返回，它内部的局部名字就从外部视角"消失"了；而模块全局变量在任何函数内都能被访问到（虽然要做赋值得加 `global`）。

### 2.9 类体作用域的特殊性（附带说明）

虽然不是 LEGB 的主要关注点，但很多人会问"类里的变量算哪一层"，这里顺带说明：**类体（class body）本身在执行时会创建一个独立的命名空间，类体里定义的变量和方法都会成为类的属性。但是，类体作用域并不是"成员函数的 Enclosing 作用域"。**

```python
class Demo:
    class_var = "类的属性"

    def method(self):
        # 即便 class_var 写在 method 外层（类体里），
        # 它对 method 而言并不算 Enclosing 变量，无法直接访问
        try:
            print(class_var)
        except NameError as e:
            print(f"访问失败：{e}")
        # 正确做法是通过 self 或类名访问
        print(Demo.class_var)

Demo().method()
# 输出：
# 访问失败：name 'class_var' is not defined
# 类的属性
```

类体作用域与函数作用域的这一区别，是 Python 与其他一些语言（如 Java 的字段直接可见）很不一样的地方。记住一句话：**Enclosing 作用域只来自函数嵌套函数，不来自类体包围方法。**

## 3. 最佳实践

**优先用参数和返回值传递数据，少依赖全局变量。**

全局变量在模块任何位置都可被读写，导致数据流难以追踪——你很难知道某个全局变量在哪些函数里被改过。更稳妥的做法是：把需要的数据当作参数传进去，把需要的结果当作返回值传出来。这样数据流向清晰，也更容易写单元测试。

```python
# 不推荐：依赖全局变量
counter = 0
def incr():
    global counter
    counter += 1

# 推荐：用类或闭包封装状态
def make_counter():
    n = 0
    def incr():
        nonlocal n
        n += 1
        return n
    return incr

c = make_counter()
print(c(), c(), c())
# 输出：1 2 3
```

**不要用模块全局变量名去遮蔽内置名字。**

虽然 LEGB 允许你用全局 `list`、`len` 这类名字"覆盖"内置对象，但这样会让同模块内后面的所有代码拿不到原本的内置功能，而且排查起来非常反直觉。如果实在需要用类似的语义名字，换一个有区分度的拼写即可。

```python
# 不推荐
# len = lambda x: 42   # 之后整个模块都拿不回内置的 len 了

# 推荐：起一个表现意图的名字
def my_len(seq):
    return sum(1 for _ in seq)
```

**函数内对全局/外层变量赋值时，务必显式声明 `global`/`nonlocal`。**

不要依赖"巧合"——没有声明就想改外层名字，几乎一定会撞上 `UnboundLocalError`。显式声明既解决了技术上的限制，也是一种"我确实要改外层"的强语义提示，读代码的人一眼就能看出副作用。

```python
total = 0

def reset_total():
    global total
    total = 0   # 明确表示在重置全局 total
```

**循环里创建闭包，注意自由变量的延迟绑定。**

当你需要在循环里创建多个闭包时，务必留意"捕获的是变量引用而非值"这一点。要么用默认参数把值"冻结"，要么改用工厂函数把外层变量作为参数传入。

```python
# 推荐：用工厂函数避免延迟绑定陷阱
def make_adder(n):
    return lambda x: x + n

adders = [make_adder(i) for i in range(3)]
print([f(10) for f in adders])
# 输出：[10, 11, 12]
```

**控制结构不创建作用域，用这一点来组织代码时要心中有数。**

正因为 `if`/`for`/`while`/`with`/`try` 不引入新作用域，所以你在循环里临时定义的变量在循环外仍然可见。如果你的意图是"只在循环里用它"，通常可以接受；如果你担心名字污染外层作用域，可以把循环体抽成一个独立的函数。

```python
# 循环变量 i 在循环后仍然可见
for i in range(3):
    pass
print(i)   # 输出：2

# 想隔离：把循环做成函数
def process():
    for j in range(3):
        pass
process()
# 这里没有 j，访问会 NameError
```

**用 `locals()` 调试，但不要用它去动态创建变量。**

`locals()` 非常适合在调试时快速看一眼当前局部作用域都有哪些名字，但用它去动态写变量既不可靠（如前所述，函数内的 `locals()` 是快照），又会破坏静态分析工具（如 IDE、类型检查器）的推断能力。需要动态属性，请用字典。

## 4. 原理

### 4.1 作用域在编译期静态确定（静态作用域）

Python 的作用域是"静态作用域"（也叫词法作用域，lexical scope）：一个名字到底属于哪一层作用域，是在编译这个函数（确切地说是生成代码对象 code object）时就已经确定下来的，而不是在运行时根据调用栈动态决定的。这与"动态作用域"语言（如 Emacs Lisp 的某些模式、bash 的变量查找）形成鲜明对比。

具体来说，当 CPython 编译一个 `def` 函数时，它会扫描整个函数体，看哪些名字出现了赋值操作。凡是在函数体内有赋值的名字，编译器就把它归入该函数的局部变量集合（存放在代码对象的 `co_varnames` 中）；没有在函数内赋值、但被引用的名字，则可能成为自由变量（存放在 `co_freevars` 中）或全局变量（存放在 `co_names` 中）。这一切在函数被调用之前就已经定型。

你可以直接查看一个函数的代码对象来印证：

```python
x = 1

def demo(a):
    b = 2          # b 有赋值 → 局部
    print(a, b, x) # x 没有在函数内赋值 → 全局/内置

print("co_varnames（局部）:", demo.__code__.co_varnames)
print("co_names（全局/属性）:", demo.__code__.co_names)
# 输出示例：
# co_varnames（局部）: ('a', 'b')
# co_names（全局/属性）: ('print', 'x')
```

`co_varnames` 里是局部变量（按定义顺序排列），`co_names` 里是函数用到的"全局名字"或属性名（如 `print`、`x`）。注意：`print` 也会进 `co_names`，因为它是通过 `LOAD_GLOBAL` 来加载的——是否为"真全局"还是"内置"，要到运行时在 G 和 B 层依次查找才能确定。

### 4.2 LEGB 查找在字节码层面的实现

对四层作用域的变量访问，CPython 分别用不同的字节码指令去加载和存储，编译器在编译期就会根据名字属于哪一层来选择对应的指令：

- `LOAD_FAST` / `STORE_FAST`：用于局部变量（L 层）。
- `LOAD_DEREF` / `STORE_DEREF`：用于"自由变量"，即来自 Enclosing 作用域的变量（E 层），它们被存在 cell 对象里。
- `LOAD_GLOBAL` / `STORE_GLOBAL`：用于全局变量（G 层），若这一层没找到则回退到 Built-in 作用域（B 层）。

用 `dis` 模块看一下前面 `demo` 函数的字节码，可以直观看出这种分工：

```python
import dis

x = 1

def demo(a):
    b = 2
    print(a, b, x)

dis.dis(demo)
```

输出大致如下（不同 Python 版本细节会变化，但指令名是一致的）：

```
  5           0 RESUME 0

  6           2 LOAD_CONST 1 (2)
              4 STORE_FAST 1 (b)

  7           6 LOAD_GLOBAL 1 (print + NULL)   # 全局/内置：去 G 再去 B
              8 LOAD_FAST 0 (a)                # 局部：直接从 fast local 槽取
             10 LOAD_FAST 1 (b)                # 局部
             12 LOAD_GLOBAL 2 (x)              # 全局：去 G 再去 B
             14 CALL 3
             16 POP_TOP
             18 RETURN 0
```

可以看到：`a`、`b` 都用 `LOAD_FAST`，而 `print`、`x` 用 `LOAD_GLOBAL`。`LOAD_FAST` 没有任何字典查找过程——这就是下一节要讲的"快槽"。

### 4.3 局部变量的快槽（fast local）机制

"函数局部变量很快"这句话在 CPython 里有具体的实现依据：局部变量并不像全局变量那样存在一个字典里按名字查找，而是被编译成"按位置索引的数组"。当函数被调用时，CPython 会为本次调用在帧对象（frame object）里分配一个固定大小的数组（即 fast locals），代码对象里 `co_varnames` 的顺序就对应了数组中的位置。`LOAD_FAST i` 实际上是"从数组的第 i 个槽位读出对象"，`STORE_FAST i` 则是"把对象写入第 i 个槽位"——没有哈希计算，没有字典查找，就是数组下标访问，所以非常快。

这也是为什么 `locals()` 返回的是"快照字典"：因为局部变量平时并不是以字典形式存在的，`locals()` 是临时把 fast local 数组里的对象按 `co_varnames` 的名字拼成一个字典给你看，自然也就没法"实时同步"修改。而 `globals()` 返回的字典就是全局命名空间本身，因为全局变量确实是按字典存的。

下面用 `dis` 观察 `STORE_FAST` / `LOAD_FAST` 的下标使用：

```python
def fast_demo():
    a = 1
    b = 2
    c = a + b
    return c

import dis
dis.dis(fast_demo)
```

输出（节选，版本不同会略有差异）：

```
  2           0 RESUME 0

  3           2 LOAD_CONST 1 (1)
              4 STORE_FAST 0 (a)     # a 存进第 0 槽

  4           6 LOAD_CONST 2 (2)
              8 STORE_FAST 1 (b)     # b 存进第 1 槽

  5          10 LOAD_FAST 0 (a)      # 从第 0 槽读 a
             12 LOAD_FAST 1 (b)      # 从第 1 槽读 b
             14 BINARY_OP 0 (+)
             16 STORE_FAST 2 (c)     # c 存进第 2 槽

  6          18 LOAD_FAST 2 (c)      # 从第 2 槽读 c
             20 RETURN_VALUE
```

`(a)`、`(b)`、`(c)` 后面的数字就是槽位下标。无论你访问多少次，都是直接按下标走数组，所以局部变量访问几乎是最快的。

### 4.4 闭包变量存于 __closure__ 的 cell 对象

当内层函数引用了外层函数的局部变量，编译器会把那个变量标记为"cell 变量"。这意味着外层函数存储这个变量不再使用简单的 fast local 槽，而是用一个"cell 对象"间接包装一层：外层函数和内层函数都持有这个 cell 对象的引用，cell 对象内部才真正保存值。这样，即便外层函数已经返回，只要内层函数还活着（持有 cell 引用），Cell 里的值就不会被回收，内层函数通过 cell 随时能读到最新值。

字节码层面：

- 外层函数：`STORE_DEREF` 把值写进 cell，`LOAD_DEREF` 从 cell 读值。
- 内层函数：`LOAD_DEREF` 通过自己 `__closure__` 里持有的同一批 cell 读值；`LOAD_CLOSURE` 用来把 cell 自身压栈（用于构建内层函数的 `__closure__`）。

来看个具体的字节码对照：

```python
def outer():
    base = 10          # base 在 outer 里是 cell 变量
    def inner(x):
        return base + x   # base 对 inner 是自由变量，从 cell 读取
    return inner

print("outer 的 co_cellvars:", outer.__code__.co_cellvars)
print("inner 的 co_freevars:", outer().__code__.co_freevars)

import dis
print("---- outer 字节码 ----")
dis.dis(outer)
print("---- inner 字节码 ----")
dis.dis(outer().__code__)
```

输出（节选，关键看指令名）：

```
outer 的 co_cellvars: ('base', 'inner')
inner 的 co_freevars: ('base',)
---- outer 字节码 ----
 ...
      LOAD_CONST 1 (10)
      STORE_DEREF 0 (base)       # 把 10 存进 base 对应的 cell
      LOAD_CLOSURE 0 (base)
      MAKE_FUNCTION 8 (closure)  # 创建内层函数，附带 base 的 cell
 ...
---- inner 字节码 ----
 ...
      LOAD_DEREF 0 (base)        # 从 base 的 cell 读值
      LOAD_FAST 0 (x)
      BINARY_OP 0 (+)
      RETURN_VALUE
```

可以看到 `base` 在外层用 `STORE_DEREF` 存进 cell，在内层用 `LOAD_DEREF` 从 cell 读出。两者操作的是同一个 cell 对象，所以内层函数总能反映外层对 `base` 的最新修改（也正是上一节"闭包捕获的是变量而非值"的实现基础）。

要直接看一下 cell 的内容：

```python
f = outer()
print(f.__closure__)                      # 输出包含一个 cell 对象的元组
print(f.__code__.co_freevars)             # 输出：('base',)
print(f.__closure__[0].cell_contents)     # 输出：10
```

### 4.5 UnboundLocalError 为何在编译期就注定

回到前面那个 `total = total + n` 报错的例子。现在已经能完全从原理上解释它了：

1. CPython 在编译 `add_to_total` 函数时，扫描函数体，发现 `total` 这个名字有一次赋值（`total = ...`），于是把它登记进 `co_varnames`，标记为局部变量。
2. 从这一刻起，函数内所有对 `total` 的引用都被编译成 `LOAD_FAST`（从 fast local 槽读取），而不是 `LOAD_GLOBAL`。
3. 运行时执行到 `total + n`，虚拟机执行 `LOAD_FAST` 去读局部槽位里的 `total`，发现这个槽位里还没有绑定任何对象（因为赋值还没执行完），于是抛出 `UnboundLocalError`。

所以这不是"查找顺序的问题"，而是"编译期已经决定走 `LOAD_FAST`，运行时根本没有机会去走 `LOAD_GLOBAL`"。只要函数里有一处对某名字的赋值，这个名字在整个函数体里就都是局部的了——不管赋值写在哪个位置、是否会被执行到。

这一点也能用字节码验证：

```python
total = 100

def add_to_total(n):
    total = total + n       # total 被当作局部
    return total

import dis
dis.dis(add_to_total)
```

输出（节选）：

```
 ...
      LOAD_FAST 0 (total)       # 注意是 LOAD_FAST：编译期已决定 total 是局部
      LOAD_FAST 1 (n)
      BINARY_OP 0 (+)
      STORE_FAST 0 (total)
 ...
```

如果你加 `global total`，字节码就会切换成使用 `LOAD_GLOBAL` + `STORE_GLOBAL`：

```python
def add_to_total_global(n):
    global total
    total = total + n
    return total

dis.dis(add_to_total_global)
```

输出（节选）：

```
 ...
      LOAD_GLOBAL 1 (total)    # LOAD_GLOBAL：编译期决定走全局
      LOAD_FAST 0 (n)
      BINARY_OP 0 (+)
      STORE_GLOBAL 0 (total)   # STORE_GLOBAL：写回全局字典
 ...
```

`global` 声明本质上就是告诉编译器："这个名字别再当局部了，它的加载和存储都走全局字典。" `nonlocal` 同理，只是它指的目标是 Enclosing 层的 cell，字节码上对应 `LOAD_DEREF` / `STORE_DEREF`。

### 4.6 LEGB 是静态查找，不是动态链栈

最后强调一个容易混淆的点：Python 的 LEGB 查找看似是"沿函数调用栈向上找"，其实不是。它是沿"函数定义时静态确定的作用域链"查找的。调用栈决定"现在执行到哪个函数"，但作用域边界则由"函数定义时所处的代码结构"决定。

下面的例子能清楚区分两种情况的差异：

```python
# 定义在模块顶层，函数体内的名字在编译期就绑定好来源
def where_am_i():
    # 虽然它会被 make_wrapper 调用，但它查 binding 时不会看 make_wrapper 的局部
    print(binding)

def make_wrapper():
    binding = "我在 make_wrapper 的局部里"
    where_am_i()   # 这里只是"调用方"，不会成为 where_am_i 的作用域来源

try:
    make_wrapper()
except NameError as e:
    print(f"报错：{e}")
# 输出：报错：name 'binding' is not defined
```

如果作用域是"按调用栈动态确定"的，上面这段理应在 `where_am_i` 里查到 `make_wrapper` 的局部 `binding`。但实际结果却是 `NameError`——因为 `binding` 对 `where_am_i` 来说，并没有出现在它自己的局部、它定义时的外层函数、模块全局、内置这四层里；`make_wrapper` 只是一个"调用者"，不会把它的局部变量贡献给被调用者的作用域链。这正是静态作用域与动态作用域最直观的分界。

### 4.7 小结：LEGB 与字节码的对应

把上面几节拼起来，可以这样总结 Python 作用域的内部实现：

| 作用域 | 字节码加载 | 字节码存储 | 存储位置 | 确定时机 |
| --- | --- | --- | --- | --- |
| Local | `LOAD_FAST` | `STORE_FAST` | 帧的 fast local 数组 | 编译期（co_varnames）|
| Enclosing | `LOAD_DEREF` | `STORE_DEREF` | cell 对象（来自外层函数）| 编译期（co_freevars/co_cellvars）|
| Global | `LOAD_GLOBAL` | `STORE_GLOBAL` | 模块的 `__dict__` | 编译期（co_names），运行时在 G→B 查找 |
| Built-in | `LOAD_GLOBAL` 回退到 builtins | —— | `builtins.__dict__` | 运行时 G 层未命中时自动回退 |

理解这套机制，不仅能解释"为什么函数内同名赋值会让全局变量读不到""为什么闭包能捕获外层变量"，也能让你在调试更复杂的命名问题（如 import 陷阱、装饰器里的名字可见性）时有清晰的因果链条可循。

## 5. 总结

### 5.1 本文要点

- LEGB 是 Python 查找名字的四层顺序：**L**ocal（局部）→ **E**nclosing（外层嵌套函数）→ **G**lobal（模块全局）→ **B**uilt-in（内置）。一旦在某层命中，查找立即终止；四层都找不到则抛 `NameError`。
- Local 是函数体内部的作用域，函数每次调用产生全新的局部命名空间，函数返回后随即销毁（除非被闭包捕获）。
- Enclosing 只在"函数嵌套函数"时存在，它是闭包的基础；内层函数引用外层函数的变量，并把这些变量带出外层函数，就形成闭包。
- Global 是模块顶层的命名空间，可通过 `globals()` 查看与修改；函数内可读全局变量，若要重新赋值（含 `+=`）则需 `global` 声明。
- Built-in 是 `builtins` 模块的命名空间，最后被查找；同层名字会"遮蔽"上层名字，因此要避免用全局名覆盖内置函数。
- 函数内只要出现对某名字的赋值，该名字在整个函数里都被视为局部，可能引发 `UnboundLocalError`；要改外层名字，须显式使用 `global` 或 `nonlocal`。
- 控制结构（if/for/while/with/try）不创建新作用域，循环变量的可见范围属于包含它的最近一层函数或模块作用域。
- 作用域在编译期静态确定：编译器按"有赋值即局部"标记名字，选择对应的字节码（`LOAD_FAST` / `LOAD_DEREF` / `LOAD_GLOBAL`），运行时按既定方案走，不会动态沿调用栈查找。
- 局部变量以 fast local 数组按槽位存取，访问开销极低；闭包变量以 cell 对象间接持有，存于函数对象的 `__closure__` 属性。

### 5.2 读完应能掌握

- 能准确说出 LEGB 四层的含义与查找顺序，并能预测一段包含多层同名变量的代码最终访问到哪一层。
- 能解释"函数内赋值默认创建局部变量"这一规则，并能复现和修复 `UnboundLocalError`。
- 能写出最简单的闭包（计数器、加法工厂），并说出它依赖 Enclosing 作用域的原理。
- 能用 `locals()` 和 `globals()` 查看当前命名空间，并说明二者在"是否实时同步"上的区别。
- 能区分"修改可变全局对象内容"与"对全局变量名重新赋值"在是否需要 `global` 声明上的差异。
- 能从字节码角度说明 `LOAD_FAST`、`LOAD_DEREF`、`LOAD_GLOBAL` 分别对应哪一层作用域，解释 `UnboundLocalError` 为何是"编译期就注定"的。
- 能判断一段代码是否会出现"闭包循环变量延迟绑定"问题，并给出正确的修复写法。