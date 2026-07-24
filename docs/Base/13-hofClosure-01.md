---
group:
  title: 【13】高阶函数与闭包
  order: 13
order: 1
title: 函数是一等公民
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是"函数是一等公民"

在编程语言里，"一等公民"（first-class citizen）指的是一种语言实体，它享有和其它实体一样的权利——可以被赋值给变量、可以作为参数传递、可以作为返回值返回、可以存进数据结构里。说人话就是：函数在这个语言里不矮人一头，它和整数、字符串、列表一样，就是一个普通的"值"。

在 Python 中，函数确实是一等公民。更准确地说，Python 的函数是一等对象（first-class object）。它本质上就是一个对象，和你自己写的类的实例没有本质区别，只不过这个对象"可调用"（callable）。理解这一点几乎是理解所有 Python 高级特性的前提：装饰器、闭包、map/filter/reduce、回调机制、策略模式，全都是建立在"函数能被传来传去"这个事实之上的。

很多初学者写了一段时间 Python，会下意识觉得"函数就是定义出来然后调用的东西"，把函数和"动作"绑定在一起。但一旦你把函数看作"值"，很多写法就豁然开朗了：为什么 `sorted(nums, key=abs)` 里的 `abs` 不加括号？为什么 `button.on_click(handle_click)` 传的是函数本身而不是调用结果？这些都是"函数是一等公民"的直接体现。

本篇是「高阶函数与闭包」系列的开篇。这一篇只打底：把"函数是对象"这个观念立起来，讲清它的四种能力（赋值、传参、返回、存数据结构）、函数对象的常见属性、以及用字典实现命令分派这种典型应用。后续的 map/filter/reduce、闭包、装饰器都建立在这个根基上。

### 1.2 一个最小示例：函数可以赋值给变量

先看最小的一个例子，直观感受"函数是对象"：

```python
def greet(name):
    return f"hello, {name}"

# greet 是函数对象本身
print(greet)        # 输出：<function greet at 0x...>

# 把函数对象赋值给另一个变量，新变量也能调用
say = greet
print(say("张三"))  # 输出：hello, 张三
print(say is greet) # 输出：True，两个名字指向同一个函数对象
```

`say = greet` 这一行是关键。在 Python 里，赋值语句做的不是"复制函数"，而是"给同一个对象起一个新名字"。所以 `say is greet` 是 `True`，两个变量绑定到内存中同一个函数对象。调用 `say("张三")` 和调用 `greet("张三")` 完全等价。

这个例子看起来很简单，但它背后就是"函数是一等公民"的第一块基石：函数可以被名字引用，像任何普通对象一样。注意赋值时 `greet` 没有加括号——加括号是"调用函数"，不加括号是"引用函数对象本身"。这个区别后面会反复出现，是初学者最容易踩的点。

## 2. 核心内容

### 2.1 一等对象的四种能力

判断一门语言里函数是不是一等公民，有一个业界通行的标准：看函数是否具备下面这四种能力。Python 的函数四种能力都满足，下面逐一展开。

**能力一：赋值给变量**

这一点 1.2 已经演示过。补充一个更贴近实际的场景——你有一个函数名太长，或者你想给一个库函数起一个更顺手的短名字：

```python
numbers = [3, -1, 4, -2, 0]

# 标准库的 abs 写起来不长，但假设是用第三方库的某个长名字函数
import operator
plus = operator.add     # 给函数起个短名字

# 赋值后，plus 就和 operator.add 完全一样
print(plus(2, 3))       # 输出：5
print(plus(10, -4))     # 输出：6
```

这里 `plus = operator.add` 之后，`plus` 就是一个指向 `operator.add` 函数对象的引用。调用它和调用原函数没有任何差别。这种"给函数起别名"的能力在写快速脚本、简化调用时很常用。

**能力二：作为参数传递**

把函数作为参数传给另一个函数，是高阶函数（higher-order function）的核心特征之一。先看一个最朴素的例子——`sorted` 的 `key` 参数：

```python
nums = [-5, 2, -3, 8, -1]

# key 参数接收一个函数，sorted 会用它对每个元素做转换再比较
print(sorted(nums, key=abs))
# 输出：[-1, 2, -3, -5, 8]
```

注意 `key=abs` 这里传的是 `abs` 函数对象本身，不是 `abs()`（那会立刻调用并传报错）。`sorted` 内部会对每个元素调用一次 `abs`，根据返回值来排序。如果 `abs` 不是一等对象、不能被当参数传，Python 的排序就得写成别扭的形式。

再来看一个自定义的"接收函数为参数"的例子，这能帮你看清高阶函数的内部到底在做什么：

```python
def apply_twice(func, value):
    """对 value 连续调用 func 两次。"""
    return func(func(value))

def double(x):
    return x * 2

def add_one(x):
    return x + 1

print(apply_twice(double, 3))    # 输出：12  （先 double(3)=6，再 double(6)=12）
print(apply_twice(add_one, 10))  # 输出：12  （先 11，再 12）
```

`apply_twice` 的第一个参数 `func` 接收一个函数，然后在内部调用它。这种"把行为（函数）当参数传"的写法，是函数式编程最基本的手法。它的好处是：调用方可以随意定制 `apply_twice` 的行为，传 `double` 就是翻倍两次，传 `add_one` 就是加两次，`apply_twice` 本身不用改一行代码。

**能力三：作为返回值返回**

函数不仅能被当作参数传入，还能被当作返回值传出来。这也是高阶函数的另一种形式。看一个简单例子：

```python
def make_multiplier(factor):
    """返回一个函数：把传入的数乘以 factor。"""
    def multiplier(x):
        return x * factor
    return multiplier    # 注意：返回的是函数对象本身，不带括号

# 每次调用 make_multiplier 都"生产"出一个新函数
times3 = make_multiplier(3)
times5 = make_multiplier(5)

print(times3(4))   # 输出：12
print(times5(4))   # 输出：20
```

`make_multiplier` 接收一个 `factor`，返回一个"记住"了这个 `factor` 的新函数 `multiplier`。这种"函数造函数"的写法是闭包的基础形态——虽然本篇不深入讲闭包，但你应该能从这个例子里感受到：函数能被当结果返回，意味着我们可以在运行时"动态拼装"出行为不同的函数。

返回函数时一定要记得不带括号：写 `return multiplier` 返回的是函数对象；写 `return multiplier()` 则是先调用函数、把调用结果返回去，这两者天差地别。

**能力四：存入数据结构**

函数既然是对象，当然也能塞进列表、字典、集合这些容器里。这一能力在实战中极其有用——下一小节会专门讲"把函数存进字典"实现命令分派，这里先看一个列表的例子：

```python
def capitalize(s):
    return s.capitalize()

def upper(s):
    return s.upper()

def lower(s):
    return s.lower()

# 把三个函数存进列表
transformers = [capitalize, upper, lower]

text = "hello world"
# 依次用每个函数处理 text
for fn in transformers:
    print(fn(text))
# 输出：
# Hello world
# HELLO WORLD
# hello world
```

`transformers` 是一个"装着函数的列表"。用 `for fn in transformers` 遍历时，每次 `fn` 就是一个函数对象，直接 `fn(text)` 调用即可。这种写法让"对同一份数据依次应用一组处理函数"变得非常自然，也是 map/管线式处理的雏形。

四种能力串起来就是"函数是一等公民"的全貌：赋值、传参、返回、存容器。这四种能力背后是同一条规则——函数是对象，凡对象能去的地方函数都能去。

### 2.2 函数引用 vs 函数调用：带括号还是不带括号

这是理解"函数是一等对象"时最关键的一个细节，也是初学者最容易混淆的点。规则其实一句话就能说完：

- **不带括号**：引用函数对象本身，是一个"值"，不执行函数体。
- **带括号**：调用函数，立即执行函数体，得到返回值。

听起来简单，但实际写起来经常出错。下面用对照的方式把区别讲透：

```python
def greet(name):
    return f"hello, {name}"

# 不带括号：这是"函数对象"，尚未执行
print(greet)
# 输出：<function greet at 0x...>

# 带括号：这是"调用函数并拿到返回值"
print(greet("李四"))
# 输出：hello, 李四
```

**一个经典错误：括号写错导致传了 None**

下面这段代码是初学者最常踩的坑之一：

```python
def double(x):
    return x * 2

# 想把 double 传给 sorted 当 key，但手滑加了括号
try:
    # double() 会报错（缺参数），但即便 double(0) 不报错，传进去的也是"调用结果"
    result = sorted([1, -2, 3], key=double)   # 正确：传函数对象
    print(result)
except TypeError as e:
    print("报错：", e)
# 输出：[1, 3, -2]   （按 double 后的值排序，等价于按原值排）
```

上面是正确写法。下面看错误写法会怎样：

```python
def double(x):
    return x * 2

# 错误演示：加了括号，传的是"调用结果"而不是函数本身
# double() 在这里会因为没给参数而报错
try:
    sorted([1, -2, 3], key=double())
except TypeError as e:
    print("报错：", e)
# 输出：报错： double() missing 1 required positional argument: 'x'
```

这个例子更隐蔽的一种形态是：当函数本身不需要参数时，加括号不会立刻报错，而是悄悄传了一个 `None` 进去。比如：

```python
import time

def current_label():
    return time.strftime("%H:%M:%S")

# 想注册一个回调函数，但加了括号
button_on_click = current_label   # 正确：传函数对象，稍后被点击时再调用
button_on_click_buggy = current_label()  # 错误：立刻调用，把字符串赋给变量

print(button_on_click)        # 输出：<function current_label at 0x...>
print(button_on_click_buggy)  # 输出：14:23:08 （一个字符串，不是函数）
```

`button_on_click_buggy` 此时是一个字符串，不是函数。如果后面有代码按"这是函数"去调用它（`button_on_click_buggy()`），就会报 `TypeError: 'str' object is not callable`。

**记忆口诀**

判断要不要加括号，就问自己一句："我是想要这个函数本身，还是想要它执行完的结果？" 想要函数本身→不加括号；想要结果→加括号。这种判断贯穿整个高阶函数、回调、装饰器的学习和使用。

### 2.3 函数对象的本质：类型、id 与属性

既然函数是对象，那它就应该有类型、有内存地址、有一堆属性，和普通对象别无二致。这一小节就把函数对象"解剖"开来看看。

**函数的类型是 function**

```python
def greet(name):
    return f"hello, {name}"

print(type(greet))
# 输出：<class 'function'>

print(type(greet).__name__)
# 输出：function
```

`type(greet)` 显示 `function`，这说明 `greet` 是 `function` 这个类的一个实例。你平时写的 `def` 语句，本质上就是在创建 `function` 类的实例对象，只不过这个创建过程由解释器在编译期/运行期自动完成，你不用手动 `function(...)`。

**函数对象有 id，说明它真真实实住在一块内存里**

```python
def greet(name):
    return f"hello, {name}"

print(id(greet))   # 输出：例如 4312345696（每次运行不同）
```

`id(greet)` 给出函数对象在内存中的地址。每次定义新函数都会新建一个函数对象，`id` 也不同。这一点和普通对象完全一致——它不是什么特殊的"虚的东西"，就是一块实实在在的内存。

**函数对象有一堆属性**

函数对象内部携带了大量属性，这些属性在调试、写装饰器、做内省时非常有用。下面逐一讲几个最常用的：

```python
def greet(name, greeting="你好"):
    """根据名字生成问候语。"""
    return f"{greeting}, {name}!"

print(greet.__name__)      # 输出：greet         函数的名字（字符串）
print(greet.__doc__)       # 输出：根据名字生成问候语。  函数的文档字符串
print(greet.__defaults__)  # 输出：('你好',)     默认参数值的元组
print(greet.__globals__ is globals())  # 输出：True  函数能访问的全局命名空间
```

逐个解释这些属性：

- `__name__`：函数定义时用的名字。`greet.__name__` 是 `"greet"`。即使你用 `say = greet` 给它起了别名，`say.__name__` 仍然是 `"greet"`，因为属性记录的是"出生名"，不是"当前绑定的名字"。这在写装饰器时要注意——装饰后会被包装成内层函数，`__name__` 可能变成 `wrapper`，通常要用 `functools.wraps` 把原函数的 `__name__` 等属性拷过来。

- `__doc__`：函数的文档字符串，就是 `def` 下一行那个三引号字符串。`help(greet)` 会用到它，`__doc__` 写得好，别人调用你的函数时 `help` 就能看明白。

- `__defaults__`：默认参数值的元组，按位置顺序排列。`greet(name, greeting="你好")` 的默认参数是 `"你好"`，所以 `__defaults__` 是 `('你好',)`。如果函数没有默认参数，`__defaults__` 是 `None`。这个属性在分析函数签名时很有用，比如你接收到一个函数想知道它有哪些参数有默认值。

- `__globals__`：函数定义时所在模块的全局命名空间（一个 dict）。函数运行时如果要访问全局变量，就是从这个 dict 里去找。这一点和闭包里的 `__closure__` 形成对照——一个管"全局"，一个管"外层局部"。

- `__closure__`：这个属性专门给闭包用的。当函数引用了外层函数的局部变量时，外层变量会被打包进一个 cell 对象的元组，存到 `__closure__` 里。没有闭包时它是 `None`。本篇暂不深入闭包，但先记住这个属性和"自由变量"绑定在一起。

下面演示一个有闭包的函数，直接看 `__closure__`：

```python
def make_counter():
    count = 0
    def counter():
        nonlocal count
        count += 1
        return count
    return counter

c = make_counter()
print(c())        # 输出：1
print(c())        # 输出：2

# c 是个闭包，__closure__ 里装着对 count 的引用
print(c.__closure__)
# 输出：(<cell at 0x...: int object at 0x...>,)
print(c.__closure__[0].cell_contents)
# 输出：2   （当前 count 的值）
```

`c.__closure__` 不是 `None`，因为 `counter` 内层函数引用了外层 `make_counter` 的局部变量 `count`。每次 `c()` 后，`count` 的值变化，`__closure__[0].cell_contents` 也会同步反映新值。后续讲闭包时会展开这个机制，这里仅建立"`__closure__` 存的是外层被引用变量"的印象。

**函数像普通对象一样可以被检验**

正是因为函数是普通对象，你平时检验普通对象的那套手段对函数也完全适用：

```python
def greet(name):
    return f"hello, {name}"

# type 检验
print(type(greet) is ... )  # 占位，下面分行
```

```python
def greet(name):
    return f"hello, {name}"

# 用 type 检查类型
from types import FunctionType
print(type(greet) is FunctionType)  # 输出：True

# 用 callable 检查是否可调用（更推荐，能覆盖类、lambda 等）
print(callable(greet))              # 输出：True

# 用 dir 看函数对象身上有哪些属性
attrs = [a for a in dir(greet) if not a.startswith("__")]
print(attrs)
# 输出大致：['__name__', ... ] 这里只看非双下划线的（函数上很少）

# 看 __ 开头的属性
dunder_attrs = [a for a in dir(greet) if a.startswith("__")]
print(dunder_attrs[:8])
# 输出示例：['__annotations__', '__builtins__', '__call__', ...]
```

这里重点说一下 `callable`。判断"一个东西能不能被当函数调用"，优先用 `callable(x)` 而不是 `isinstance(x, FunctionType)`。原因有两个：第一，`callable` 更宽泛，不仅函数能被调用，类（调用即实例化）、实现了 `__call__` 的对象都能被调用。第二，`callable` 更符合 Python 的风格——我们关心的是"能不能干这件事"，而不是"是不是这类对象"。这叫做"鸭子类型"（duck typing）。

```python
# callable 比单纯判断"是不是函数"更实用

class Adder:
    def __init__(self, n):
        self.n = n
    def __call__(self, x):
        return x + self.n

add5 = Adder(5)
print(callable(add5))    # 输出：True
print(add5(10))          # 输出：15

# add5 不是函数，是个普通对象，但因为它实现了 __call__，所以能像函数一样被调用
from types import FunctionType
print(isinstance(add5, FunctionType))  # 输出：False
```

`add5` 是 `Adder` 的实例，不是函数对象，但因为它实现了 `__call__`，`callable(add5)` 是 `True`。凡是需要"把函数当参数传"的地方，你也可以传一个实现了 `__call__` 的对象进去，接收方调用起来毫无差别。这就是为什么用 `callable` 检验"能不能当函数用"更合适。

### 2.4 高阶函数的定义

讲完四种能力和函数对象的本质，可以正式给"高阶函数"下定义了。一个函数只要满足下面两个条件之一，就是高阶函数：

1. 接收一个或多个函数作为参数。
2. 返回一个函数作为结果。

前面见过的 `apply_twice` 就满足条件一，`make_multiplier` 满足条件二。Python 内置的 `sorted`、`map`、`filter` 都满足条件一。满足条件二的典型就是各种"工厂函数"和装饰器。

高阶函数的本质就是"把行为（函数）当数据用"。有了这个能力，你就能写出一套通用逻辑，再让调用方把具体行为塞进来。下面是一个稍微完整的例子——写一个通用的"列表处理流程"，把每一步行为都做成参数：

```python
def process(items, transform, filter_fn=None, reduce_fn=None):
    """通用列表处理流程：先转换、再过滤、最后汇总。"""
    # 第一步：对每个元素做转换
    transformed = [transform(x) for x in items]
    # 第二步：可选过滤
    if filter_fn is not None:
        transformed = [x for x in transformed if filter_fn(x)]
    # 第三步：可选汇总
    if reduce_fn is not None:
        return reduce_fn(transformed)
    return transformed

# 场景：对一组数字，先翻倍，再过滤掉小于 10 的，最后求和
data = [3, 5, 7, 8]

double = lambda x: x * 2
keep_big = lambda x: x >= 10
sum_all = lambda xs: sum(xs)

result = process(data, transform=double, filter_fn=keep_big, reduce_fn=sum_all)
print(result)   # 输出：30   （翻倍后 [6, 10, 14, 16]，过滤后 [10, 14, 16]，求和 40？请往下看）
```

等一下，输出怎么对不上？仔细算一下：`[3,5,7,8]` 翻倍得 `[6,10,14,16]`，过滤掉小于 10 的剩 `[10,14,16]`，求和 `10+14+16 = 40`。上面注释里写 30 是错的。修一下注释：

```python
result = process(data, transform=double, filter_fn=keep_big, reduce_fn=sum_all)
print(result)   # 输出：40   （翻倍后 [6,10,14,16]，过滤后 [10,14,16]，求和 40）
```

这里我故意保留了这个小插曲——它也想说明一点：写高阶函数的好处是"流程固定、行为可换"，但具体的过滤条件、转换规则都要你自己保证对，函数本身不会替你检查业务逻辑。这也正是"把行为当参数传"的代价：灵活性高了，但你得更多地靠单元测试来兜住正确性。

上述例子里用了 `lambda` 来定义临时函数，`lambda` 作为一等对象的进阶用法下一小节细讲。

### 2.5 命令分派表：用字典存函数替代 if-elif

这一小节是本篇最重要的实战应用。很多场景下你需要"根据某个标识符选择执行对应的逻辑"，新手会本能地写一长串 `if-elif`，但其实把函数存进字典，查表式调用要清爽得多。

**先看 if-elif 的写法**

假设你在做一个简易计算器，根据运算符做加减乘除：

```python
def calc(op, a, b):
    if op == "add":
        return a + b
    elif op == "sub":
        return a - b
    elif op == "mul":
        return a * b
    elif op == "div":
        return a / b if b != 0 else "除数不能为零"
    else:
        return f"未知操作: {op}"

print(calc("add", 1, 2))   # 输出：3
print(calc("mul", 3, 4))   # 输出：12
print(calc("pow", 2, 3))   # 输出：未知操作: pow
```

这种写法的问题是：每加一个新运算，都要回来改 `calc` 函数体，在长长的 `elif` 链里再插一个分支。分支一多，函数体又长又乱，维护成本直线上升。

**用字典存函数改写**

把每个运算抽成一个小函数，然后用一个字典把"操作名 → 函数"映射起来：

```python
def add(a, b): return a + b
def sub(a, b): return a - b
def mul(a, b): return a * b
def div(a, b): return a / b if b != 0 else "除数不能为零"

# 命令分派表：字符串映射到函数对象
dispatch = {
    "add": add,
    "sub": sub,
    "mul": mul,
    "div": div,
}

def calc(op, a, b):
    fn = dispatch.get(op)
    if fn is None:
        return f"未知操作: {op}"
    return fn(a, b)

print(calc("add", 1, 2))   # 输出：3
print(calc("mul", 3, 4))   # 输出：12
print(calc("div", 8, 0))   # 输出：除数不能为零
print(calc("pow", 2, 3))   # 输出：未知操作: pow
```

改写后，`calc` 函数体只有三行：查表、判空、调用。新增一个运算只要两步：写一个小函数、把它加进 `dispatch` 字典。`calc` 本身一行都不用动。这就是"开闭原则"在 Python 里的自然落地——对扩展开放，对修改封闭。

这种写法能成立的根基就是"函数能存进字典"。字典的 value 可以是任意对象，函数也是对象，自然能做 value。查表拿到函数对象后，直接 `fn(a, d)` 调用。

**扩展：支持不同签名的命令**

实际业务里，不同命令的参数常常不一样。比如一个命令行工具支持 `help`（无参数）、`copy`（一个参数）、`move`（两个参数）。这时可以让分派表指向统一签名的函数，把"解析参数"这件事在入参时统一掉：

```python
def cmd_help(args):
    return "可用命令: help / copy / move"

def cmd_copy(args):
    if len(args) < 1:
        return "用法: copy <文件>"
    return f"复制 {args[0]}"

def cmd_move(args):
    if len(args) < 2:
        return "用法: move <源> <目标>"
    return f"移动 {args[0]} -> {args[1]}"

commands = {
    "help": cmd_help,
    "copy": cmd_copy,
    "move": cmd_move,
}

def run(cmdline):
    parts = cmdline.split()
    if not parts:
        return "空命令"
    name, *args = parts
    fn = commands.get(name)
    if fn is None:
        return f"未知命令: {name}"
    return fn(args)

print(run("help"))                 # 输出：可用命令: help / copy / move
print(run("copy report.txt"))      # 输出：复制 report.txt
print(run("move a.txt b.txt"))     # 输出：移动 a.txt -> b.txt
```

这里所有命令函数都统一收一个 `args` 列表，函数内部自己解析。`run` 把命令行拆成名字 + 参数，查表调用。这种模式在做 CLI、消息分发、HTTP 路由时非常常见——差别只在具体怎么解析参数，骨架完全一样。

**命令分派 vs if-elif 的选择**

不是所有"多分支"都该用分派表。选择上有几个参考点：

- 分支条件是"离散的字符串/枚举值"且分支数量多或有增长趋势 → 用分派表。
- 分支条件是数值区间、复杂逻辑组合、或分支数量很少（两三个）→ 直接 `if-elif` 更直观。
- 分支之间有重叠逻辑、需要短路求值 → `if-elif` 更灵活。
- 需要在运行时动态注册新命令 → 分派表（字典可以随时 `dispatch["xxx"] = fn`）。

后面第 3 章的最佳实践会再补充一些注意事项。

### 2.6 策略模式：从一组算法中选一个

策略模式（Strategy Pattern）是设计模式里的经典案例，本质就是"把多种算法各自封装成函数，运行时挑一个用"。在 Python 里，因为函数是一等公民，策略模式不需要写一堆类，几个函数加一个选择函数就够了。

**场景：促销折扣计算**

假设一个电商系统有不同的折扣策略：不打折、满减、打折、VIP 再打 9 折。需求是给一个订单金额，按选择的策略计算最终价格。

```python
def discount_none(price):
    """不打折。"""
    return price

def discount_percent_10(price):
    """打 9 折。"""
    return price * 0.9

def discount_full_reduction(price):
    """满 200 减 50。"""
    return price - 50 if price >= 200 else price

def discount_vip(price):
    """VIP 用户在已有折扣基础上再打 9 折。"""
    return price * 0.9

# 策略表：策略名 → 函数
strategies = {
    "none": discount_none,
    "10off": discount_percent_10,
    "full": discount_full_reduction,
    "vip": discount_vip,
}

def apply_strategy(strategy_name, price):
    fn = strategies.get(strategy_name)
    if fn is None:
        raise ValueError(f"未知策略: {strategy_name}")
    return fn(price)

print(apply_strategy("none", 100))    # 输出：100
print(apply_strategy("10off", 100))   # 输出：90.0
print(apply_strategy("full", 250))    # 输出：200
print(apply_strategy("full", 150))    # 输出：150（不满 200，不减）
```

和命令分派是一回事：把策略名映射到函数，查表执行。新增策略时只需加一个函数、在字典里加一行，`apply_strategy` 不动。

**策略组合：把多个策略串起来**

更进阶一点的玩法是组合策略——让一个折扣在另一个之上再应用。因为策略本身就是函数，你可以把多个策略函数像流水线一样串起来：

```python
def compose(*funcs):
    """把多个单参数函数串起来：compose(f, g)(x) = f(g(x))。"""
    def composed(x):
        result = x
        # 从后往前依次应用
        for fn in reversed(funcs):
            result = fn(result)
        return result
    return composed

# 先满减，再 VIP 9 折
vip_after_full = compose(discount_vip, discount_full_reduction)
print(vip_after_full(250))
# 满减：250 - 50 = 200；再 9 折：200 * 0.9 = 180.0
# 输出：180.0
```

`compose` 自己就是一个高阶函数：接收多个函数，返回一个把它们串起来的新函数。这种写法在函数式编程里是基础工具，Python 里也能很自然地写出来，根本原因还是函数能被当参数传、当返回值返回。

### 2.7 回调注册：函数作为事件处理器

函数作为一等对象的另一个典型场景是"回调"（callback）。所谓回调，就是你把一个函数交给某个组件，让它在合适的时机（事件发生、异步任务完成、迭代每个元素时）回头调用你给的函数。

下面这个简化的"按钮点击"模型演示回调注册：

```python
class Button:
    def __init__(self, label):
        self.label = label
        self._handlers = []   # 用列表存放回调函数

    def on_click(self, handler):
        """注册一个点击回调。handler 是一个函数。"""
        self._handlers.append(handler)

    def click(self):
        """模拟点击：依次调用所有注册的回调。"""
        print(f"[{self.label}] 被点击")
        for handler in self._handlers:
            handler()

# 定义两个回调函数
def log_click():
    print("-> 记录日志：按钮被点了")

def send_analytics():
    print("-> 上报埋点：click_event")

btn = Button("提交")
btn.on_click(log_click)       # 注册时传的是函数本身，不带括号
btn.on_click(send_analytics)

btn.click()
# 输出：
# [提交] 被点击
# -> 记录日志：按钮被点了
# -> 上报埋点：click_event
```

关键点还是 `btn.on_click(log_click)`——这里传的是 `log_click` 函数对象本身。如果写成 `btn.on_click(log_click())`，会立刻调用 `log_click`，把它（返回的 `None`）存进 `_handlers`，等点击时再调用 `None()` 就会报错。回调注册是"函数引用 vs 函数调用"这个区别最常出没的地方。

这种"把函数存进一个列表，后面统一回调"的模式在 GUI、事件循环、异步框架（asyncio 的 `add_done_callback`）、Web 框架（Flask 的 `@app.route` 把视图函数注册进路由表）里都极常见。背后的机制完全一样：正因为函数能被装进容器，框架才能收集、存储、延迟调用它们。

### 2.8 lambda 作为临时一等对象

`lambda` 是 Python 里的"匿名函数"语法，本质就是创建一个函数对象，只不过没有名字、通常在一行内写完。因为 `lambda` 表达式的结果是一个函数对象，它理所当然地也是一等对象——可以赋值、传参、返回、存容器。

**lambda 的基本形态**

```python
# 普通函数
def double(x):
    return x * 2

# 等价的 lambda
double_lambda = lambda x: x * 2

print(double(5))           # 输出：10
print(double_lambda(5))    # 输出：10
print(type(double_lambda)) # 输出：<class 'function'>
```

`lambda x: x * 2` 创建了一个函数对象，赋值给 `double_lambda`。这个对象的类型和 `def` 出来的函数完全一样，都是 `function`。两者唯一的区别是：`def` 函数有名字（`__name__` 是 `"double"`），`lambda` 创建的函数 `__name__` 统一是 `"<lambda>"`。

**lambda 最典型用法：作为参数一次性传入**

`lambda` 真正的用武之地是"短期、用一次就扔"的小函数，不适合起名字的时候。比如：

```python
students = [
    {"name": "张三", "age": 20, "score": 88},
    {"name": "李四", "age": 22, "score": 75},
    {"name": "王五", "age": 19, "score": 95},
]

# 按分数降序排序
by_score = sorted(students, key=lambda s: s["score"], reverse=True)
for s in by_score:
    print(s["name"], s["score"])
# 输出：
# 王五 95
# 张三 88
# 李四 75

# 按年龄升序排序
by_age = sorted(students, key=lambda s: s["age"])
for s in by_age:
    print(s["name"], s["age"])
# 输出：
# 王五 19
# 张三 20
# 李四 22
```

`lambda s: s["score"]` 就是"给 sorted 用一次"的小函数，用完就丢。如果非要用 `def` 写，得在函数外定义一个 `get_score(s)` 函数，定义和使用离得很远，读起来反而费劲。这种场景用 `lambda` 最合适。

**lambda 存进字典**

`lambda` 也可以塞进分派表里，适合那种"每个分支逻辑都很短"的场景：

```python
ops = {
    "add": lambda a, b: a + b,
    "sub": lambda a, b: a - b,
    "mul": lambda a, b: a * b,
    "div": lambda a, b: a / b if b != 0 else "除数不能为零",
}

print(ops["add"](2, 3))  # 输出：5
print(ops["mul"](3, 4))  # 输出：12
```

对照 2.5 那版用 `def` 写的分派表，这里所有运算都只用一行就搞定，分派表本身就是一个完整的小 DSL（领域专用语言）。短逻辑用 `lambda` 内联，长逻辑抽成 `def` 函数，这种搭配在实战中很常见。

**lambda 的局限**

`lambda` 有几个硬性限制，用的时候要心里有数：

- 只能写一个表达式，不能写语句（不能有 `if` 语句块、`for`、`while`、`try` 等，但可以有三元表达式 `x if cond else y`）。
- 没有名字，调试时栈回溯看到的都是 `<lambda>`，不好定位。
- 不适合复杂逻辑。如果一个 `lambda` 超过一行、嵌套很多，立刻改成 `def` 函数，可读性优先。

一句话区分：**短小、一处使用的小逻辑用 `lambda`；有名字、多处复用、逻辑稍长的都用 `def`。**

### 2.9 函数对象当作"配置项"

最后一个实用的视角：把函数对象当成一种"配置"传递。普通配置是字符串、数字、布尔值，而"行为配置"可以用函数。这种思路在做框架、库、通用工具时很常用。

举个例子——写一个通用的"打印列表"工具，允许调用方自定义"怎么打印每个元素"：

```python
def print_list(items, formatter=None):
    """打印列表，formatter 是一个把元素转成字符串的函数。"""
    if formatter is None:
        # 没给 formatter，用默认的 str
        formatter = str
    for item in items:
        print(formatter(item))

# 默认行为
print_list([1, 2, 3])
# 输出：
# 1
# 2
# 3

# 用 lambda 定制：每个元素前面加"项："
print_list([1, 2, 3], formatter=lambda x: f"项：{x}")
# 输出：
# 项：1
# 项：2
# 项：3

# 用 lambda 定制：显示类型和值
print_list(["a", 1, True], formatter=lambda x: f"[{type(x).__name__}] {x}")
# 输出：
# [str] a
# [int] 1
# [bool] True
```

`formatter` 这个参数就是一个"函数型配置项"。它不是数据，是一个"行为"——调用方传入什么函数，`print_list` 的输出就呈现什么样式。这种模式让一个通用工具变得极有弹性，而实现它没有任何魔法，就是"函数是对象、能传参"这一条规则的运用。

把这种思路推广到更多场景：

- 排序时的 `key` 函数，是一种"排序依据"的配置。
- HTTP 框架里把"路径 → 视图函数"映射成字典，`path` 是配置，视图函数也是配置。
- 数据处理管线里每一步的 `transform` 函数，都是配置。

一旦你习惯"函数即配置"，你会发现很多原本要写一堆类、一堆继承的地方，用一个函数参数就解决了。

## 3. 最佳实践

### 3.1 传函数时永远别多加括号

这是本篇反复强调的点，也是实战中最高频的坑。写回调、写高阶函数、用 `sorted(key=...)`、`map`、`filter` 时，一定要区分"传函数对象"和"调用函数"。

推荐写法：

```python
# 正确：传函数对象
sorted(nums, key=abs)
button.on_click(handle_click)
map(str, items)
```

不推荐写法：

```python
# 错误：多加了括号，传的是调用结果
sorted(nums, key=abs())         # abs() 缺参数，报错
button.on_click(handle_click()) # 立刻调用 handle_click，注册的是它的返回值
map(str(), items)               # str() 得到空字符串，不可调用
```

工程上有个习惯能帮你兜底：注册回调、传 `key` 函数时，心里默念一遍"我现在是传函数，还是传结果"。这一念能挡掉八成的隐性 bug。

### 3.2 用 callable 检查"能不能当函数用"，别用 isinstance(x, FunctionType)

前面 2.3 讲过，`callable` 比 `isinstance(x, FunctionType)` 更通用——类、实现了 `__call__` 的对象、lambda 都是 callable，但不一定是 `FunctionType`。在写通用工具时，接收一个"函数型参数"，推荐的边界检查是：

```python
def apply(func, value):
    if not callable(func):
        raise TypeError(f"期望一个可调用对象，得到 {type(func)}")
    return func(value)
```

这样调用方既可以传函数，也可以传 lambda，甚至可以传一个带 `__call__` 的"仿函数"对象，灵活性最大。相反，如果硬卡 `isinstance(func, FunctionType)`，会把"带 `__call__` 的对象"挡在外面，没有理由这么做。

### 3.3 命令分派表里写统一的函数签名

2.5 里演示的"统一签名"（所有命令函数都收同一个参数列表）不是死规定，但实践证明这是维护分派表时的最佳做法。签名不一致时，要么你得在调用前判断、拼参数，要么得用 `functools.singledispatch` 之类的工具，都会让分派逻辑变复杂。

推荐：让分派表里所有函数的入参形状统一，内部各自处理参数差异。需要拿到原始命令行的，还可以把整个 `args` 列表传进去。

### 3.4 不要把分派表写成全局可变、随便塞东西

分派表（`dispatch`、`strategies` 这种字典）是模块级的共享状态。如果多处代码都可以往里加东西，很容易出现"某个命令在某个场景下被意外覆盖"的问题。推荐做法：

- 把分派表定义在模块顶层，用 ` DispatchTable` 类封装"注册"和"查找"两个操作，避免外部直接 `dispatch["x"] = ...`。
- 如果一定要全局可改，约定好一个唯一的注册入口（例如 `register_command(name, fn)` 函数），谁加谁走这个入口。
- 用 `functools.singledispatch` 做按类型分派时，注册也走装饰器，不要直接动底层 registry。

### 3.5 lambda 能用就用，但不要硬塞

`lambda` 的适用边界是"短小、一处使用"。一旦你发现 `lambda` 需要嵌套三元表达式、需要多行、需要给同一个变量写两次，立刻改成 `def`。一个长 `lambda` 读起来比正经函数还费劲，失去它本来的意义。

反例：

```python
# 不推荐：lambda 太长，逻辑复杂
process = lambda data: [x * 2 for x in data if x > 0] if data else []
```

正例：

```python
# 推荐：改成 def，有名字，逻辑清晰
def double_positive(data):
    if not data:
        return []
    return [x * 2 for x in data if x > 0]
```

有名字的函数还能被 `help`、被栈回溯、被 IDE 跳转，这些在排错时都是实打实的帮助。

### 3.6 保存对函数的引用，别让函数对象被意外回收

在异步、回调场景里，你把一个函数存进某个容器的瞬间，那个函数对象的生命周期就和容器绑定了。如果你把回调注册进一个"弱引用"容器（比如某些框架用 `WeakSet` 存回调），而你又没在别处保留对函数的强引用，函数对象会被垃圾回收掉，回调就永远不会触发。

经验法则：注册的回调要么是模块级定义的函数（天然有强引用），要么你把它的引用保存在一个长期存活的变量里。`lambda` 尤其要注意，因为没人保存它的别名。

### 3.7 用 functools.wraps 保留原函数属性（给后续装饰器打基础）

如果你在写一个"接收函数、返回函数"的高阶函数（也就是装饰器的雏形），返回的内层函数往往丢掉了原函数的 `__name__`、`__doc__` 等属性。这会让使用方 `help` 到的是内层函数，很困惑。推荐写法：

```python
import functools

def my_decorator(func):
    @functools.wraps(func)   # 把 func 的属性拷到 wrapper 上
    def wrapper(*args, **kwargs):
        print(f"调用 {func.__name__}")
        return func(*args, **kwargs)
    return wrapper

@my_decorator
def greet(name):
    """打招呼。"""
    return f"hello, {name}"

print(greet.__name__)   # 输出：greet（不是 wrapper）
print(greet.__doc__)    # 输出：打招呼。
```

本篇不再展开 `*args, **kwargs` 和装饰器的细节，这里先把"`functools.wraps` 保留函数属性"这个动作记住，到装饰器那篇会完整讲透。

## 4. 原理

### 4.1 function 类：函数对象的类型

Python 里一切皆对象，函数也不例外。你用 `def` 写出来的函数，其实是一个叫做 `function` 的内置类型的实例。这个类型定义在 CPython 的 C 源码里（`funcobject.c`），对应的 Python 端入口是 `types.FunctionType`。

```python
import types

def greet(name):
    return f"hello, {name}"

print(isinstance(greet, types.FunctionType))   # 输出：True
print(type(greet) is types.FunctionType)       # 输出：True
```

`function` 类型本身是一个"可调用"的类型——你可以 `types.FunctionType(...)` 手动构造一个函数对象（虽然几乎没人这么干，但理论上可行）。这意味着函数对象不是什么语法糖虚影，它就是一个普通的类实例，只不过这个类的实例支持 `__call__`。

正因为函数对象是普通实例，所以它身上有属性、能被 `id()` 取地址、能被 `dir()` 列属性、能被 `copy.deepcopy` 拷贝（虽然意义不大）。这一切都源于"它就是一个对象"这个事实。

### 4.2 函数对象的内部结构：code object + globals + defaults + closure

一个函数对象内部到底装了什么？这是理解"函数是一等公民"的底层钥匙。CPython 的 `function` 对象内部主要有以下几个部分：

- **`__code__`（code object）**：函数的"静态信息"——字节码、参数名、局部变量名、常量、栈大小等。这是函数"要做什么"的全部指令。
- **`__globals__`**：函数运行时能看到的"全局命名空间"，一个 dict。函数里访问全局变量时，就是到这个 dict 里查。
- **`__defaults__`**：位置参数的默认值元组。
- **`__kwdefaults__`**：关键字参数的默认值 dict。
- **`__closure__`**：闭包用的 cell 对象元组，保存的是对外层局部变量的引用。

这几样东西分开存，正是 Python 函数能被灵活传递的根本原因。函数的字节码（`__code__`）是不变的、可复用的"指令"；而 `__globals__`、`__defaults__`、`__closure__` 是运行时绑定上去的"环境"。同一个 `__code__`，搭上不同的 `__globals__` 或 `__closure__`，就能表现出不同的运行时行为。这种"指令和环境分离"的设计，让函数对象成了一个天然的可移动对象——你把函数传到别处，它的字节码不变，但自带的环境让它在新地方依然能正确执行。

看一个直白的演示：

```python
def greet(name, greeting="你好"):
    return f"{greeting}, {name}!"

# __code__ 里存的是"指令"和"名字"
code = greet.__code__
print(code.co_varnames)       # 输出：('name', 'greeting')
print(code.co_consts)         # 输出：('你好', None, None, ', ', '!', None)（含一些隐含常量）
print(code.co_argcount)       # 输出：2

# __globals__ 是这个函数所在模块的全局 dict
print(greet.__globals__ is globals())   # 输出：True

# __defaults__ 是默认参数值
print(greet.__defaults__)      # 输出：('你好',)
```

`co_varnames` 是函数的所有局部变量名（含参数）；`co_consts` 是函数里用到的常量；`co_argcount` 是参数个数。这些信息在函数编译期就定了，不会因为调用方式不同而改变。`__globals__` 和 `__defaults__` 则是运行时绑定的环境。

**为什么这能让函数"像普通对象一样传递"**

关键点在于：函数对象自己把执行所需的所有上下文打包好了。你把函数传给 `sorted` 时，`sorted` 内部只要准备好参数、调用 `func(x)`，函数自己会自动从 `__code__` 取指令、从 `__globals__` 取全局、从 `__closure__` 取外层变量。接收方完全不用关心这个函数"从哪来、能不能用到自己的上下文"——它自给自足。如果函数不是自带环境、而是只能引用"定义它的那个栈帧"，那一旦离开原栈帧就执行不了了，就成不了"能到处传的对象"。

### 4.3 为什么函数能像普通对象一样传递：Python 对象模型的统一

"函数是一等公民"这个特性，不同的语言实现难度不同。在 C 里，函数就是一段代码的入口地址，传函数本质是传指针，谈不上"对象"。在 Java 早期，函数不是对象，只能靠"假装函数的类"（匿名内部类实现 `Runnable` 之类）来模拟。而 Python 从设计之初就让一切皆对象，函数也是对象的一种，不需要任何特殊机制就能享有"对象"的全部权利。

Python 的对象模型底层是一个 `PyObject*` 指针，所有对象（int、str、list、function、自定义类的实例）都是 `PyObject*`。赋值、传参、返回、存容器这些操作的底层实现完全统一——都是把一个 `PyObject*` 拷一份（引用拷贝）到目标位置。所以"把函数赋值给变量"和"把整数赋值给变量"在解释器层面几乎是同一件事，没有"函数是特殊东西"这种分支。这就是为什么 Python 的函数天生就是一等公民——不是后天加的特性，是语言底层模型统一带来的"免费红利"。

换句话说，Python 不需要为"函数能传参"专门设计一套机制。`int` 能传参是因为它是对象，`str` 能传参是因为它是对象，`function` 能传参也是因为它是对象，三者一视同仁。

### 4.4 字节码层面：函数对象的创建与名字绑定

来看最后一个层次——字节码。当你写下 `def greet(name): ...` 时，Python 编译器并没有立刻"创建"函数对象，而是先编译出一段"创建函数"的字节码。可以用 `dis` 模块观察：

```python
import dis

def outer():
    def greet(name):
        return f"hello, {name}"
    say = greet
    return say

dis.dis(outer)
```

运行后会看到 `outer` 的字节码里，关键几行大致是：

```
MAKE_FUNCTION     0      # 创建一个函数对象，压入栈顶
STORE_FAST        0 (greet)  # 把栈顶的函数对象绑定到局部变量 greet
LOAD_FAST         0 (greet)  # 读取 greet（函数对象本身），压栈
STORE_FAST        1 (say)    # 绑定到 say
LOAD_FAST         1 (say)    # 读取 say，压栈（准备 return）
RETURN_VALUE
```

`MAKE_FUNCTION` 是创建函数对象的核心指令。它从栈上取出函数的 code object（以及默认值、闭包变量等），构造出一个新的 `function` 实例，压回栈顶。这一步就是你写 `def` 时真正发生的事——它不是语法糖，是有对应字节码指令的真实操作。

紧接着的 `STORE_FAST 0 (greet)`，是把刚创建的函数对象绑定到名字 `greet`。注意这个名字绑定操作和绑定整数一模一样——`x = 42` 也是 `LOAD_CONST 42` + `STORE_FAST x`。函数对象从这一刻起就和整数没区别了，都是一个"存在局部变量里的对象引用"。

后续 `say = greet` 的字节码就是 `LOAD_FAST greet` + `STORE_FAST say`——把同一个函数对象的引用再绑个新名字，背后没有任何"特殊处理函数"的代码。这正是 4.3 里说的"对象模型统一"在字节码层面的体现：不管是函数还是整数，绑定名字用的是同一套 `LOAD_*` / `STORE_*` 指令。

**调用函数的字节码**

那调用函数又是什么样？`greet("张三")` 会编译成：

```
LOAD_GLOBAL       0 (greet)   # 取函数对象本身
LOAD_CONST        1 ('张三')   # 把参数压栈
CALL_FUNCTION     1            # 调用，参数个数为 1
```

`LOAD_GLOBAL` 把函数对象加载到栈顶（不带括号就到这里为止，只是"取值"）。`CALL_FUNCTION` 才是"调用"——它从栈上取出可调用对象和参数，执行调用，把返回值压回栈顶。注意 `CALL_FUNCTION` 不挑食，它不要求栈顶必须是 `function` 类型的对象，只要支持 `__call__` 就行——这正好对应 2.3 里 `callable` 能覆盖函数、lambda、带 `__call__` 的类的那个观察。底层上，Python 调用一个对象时，会先看它是 `function` 类型还是其它类型，分别走不同的调用路径，但对使用者来说表现一致。

通过字节码可以清晰地看到：函数对象的创建用 `MAKE_FUNCTION`，名字绑定用通用的 `LOAD/STORE`，调用用 `CALL_FUNCTION`。没有一处出现"函数是特殊东西"的处理，这就从最底层印证了——在 Python 里，函数就是一个普通的、可以被名字引用、可以被调用、可以被传来传去的对象。

### 4.5 一句话串联四个原理层次

从最外到最里，"函数是一等公民"在 Python 里的实现可以这样串起来：

1. 语言的类型层面：函数是 `function` 类的实例，和 `int`、`str` 一样是 `PyObject`。
2. 函数对象内部：`__code__` 存指令，`__globals__`/`__defaults__`/`__closure__` 存运行时环境，组合起来让函数"自带上下文、可移动"。
3. 对象模型层面：所有对象用统一的 `PyObject*` 表示，赋值、传参、返回都是拷贝引用，函数无需特殊路径。
4. 字节码层面：`MAKE_FUNCTION` 创建函数对象，`LOAD/STORE` 绑名字，`CALL_FUNCTION` 调用，全用通用指令。

这四层从"是什么"到"底层怎么实现"逐步展开，合起来就是"函数是一等公民"在 Python 里的完整图景。理解了这套原理，后续学闭包（`__closure__` 怎么和 cell 对象协作）、学装饰器（`MAKE_FUNCTION` + `@` 语法糖怎么展开）、学 map/filter/reduce 时，你会发现它们不过是在同一套机制上加了点花样，不会有"突兀的新东西"。

## 5. 总结

### 5.1 本文内容要点

- "函数是一等公民"意味着函数享有和普通对象一样的权利，可以被赋值、传参、返回、存进容器。Python 的函数完全满足这四种能力。
- 函数引用 vs 函数调用：不带括号是函数对象本身，带括号是调用得到结果。这是高阶函数、回调写法的关键区分点。
- 函数对象的类型是 `function`，它有 `id`、有 `__name__`/`__doc__`/`__defaults__`/`__closure__`/`__globals__` 等属性，和普通对象一样可以被 `type`、`callable`、`dir` 检验。
- 高阶函数是"接收函数为参数或返回函数的函数"，本质是把"行为"当数据用。
- 命令分派表（`dispatch = {"add": add, ...}`）和策略模式利用"函数存字典"，把多分支 `if-elif` 改成查表式调用，更易扩展、更易维护。
- 回调注册利用"函数存列表"，让外部代码把行为交给框架延迟调用。
- `lambda` 是临时一等对象，适合短小、一次性的小函数；逻辑稍长就该改 `def`。
- 原理上：函数对象是 `function` 类的实例，内部由 `__code__` + `__globals__` + `__defaults__` + `__closure__` 构成；Python 对象模型统一，所有对象走同一套 `PyObject*` 与字节码 `LOAD/STORE`，所以函数能像普通对象一样被传递，无需特殊机制。

### 5.2 读完本文你应能掌握

- 能说清"函数是一等公民"的四种能力（赋值、传参、返回、存容器），并各举一个示例。
- 能分清"函数引用"和"函数调用"（带括号 vs 不带括号），在回调注册、`sorted(key=...)` 等场景中正确取舍，不犯多加括号的错误。
- 能说出 `function` 对象的几个关键属性（`__name__`、`__doc__`、`__defaults__`、`__closure__`、`__globals__`）各自存的是什么，并能用 `callable`/`dir` 检验一个函数对象。
- 能用字典分派表替代 `if-elif` 实现命令分发或策略选择，并说明为什么这种写法更易扩展。
- 能写出一个接收函数为参数或返回函数的高阶函数（如 `apply_twice`、`make_multiplier`），并解释它的内部逻辑。
- 能说出 Python 函数对象的内部结构（`__code__` + 环境绑定），并用字节码 `MAKE_FUNCTION`/`LOAD/STORE`/`CALL_FUNCTION` 解释函数的创建、命名与调用过程，回答"为什么 Python 的函数天生就是一等公民"。
- 为后续学习 map/filter/reduce、闭包、装饰器打好"函数是对象"这个观念基础。