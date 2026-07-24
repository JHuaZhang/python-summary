---
group:
  title: 【12】函数核心机制
  order: 12
order: 5
title: 可变位置参数args
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是可变位置参数

在 Python 中，定义函数时通常需要明确列出参数列表，调用时按位置一一传入。但现实中有许多场景，函数在被调用时究竟会收到多少个参数，编写函数时并不确定。例如写一个求最大值的函数，调用者可能传入 2 个数，也可能传入 10 个；写一个字符串拼接函数，拼接几个字符串完全由调用方决定；写一个日志打印函数，日志内容的占位参数可多可少。

可变位置参数（variable-length positional arguments）就是为这类场景设计的语法。在函数定义的形参列表中，在一个参数名前加上星号 `*`，如 `def func(*args)`，这个参数就会把调用时"多出来的"那些位置参数全部收集起来，打包成一个元组（`tuple`）传给函数体。习惯上这个参数名叫 `args`（arguments 的缩写），但这只是约定俗成，实际可以取任何合法的标识符名，星号 `*` 才是关键。

与之对应的还有调用时的"解包"语法：在调用函数时，对一个序列（列表、元组、字符串等可迭代对象）前加 `*`，如 `func(*nums)`，解释器会先把 `nums` 展开成若干个独立的位置参数，再逐个匹配到形参上。定义时的 `*args` 是"打包"，调用时的 `*seq` 是"解包"，两者是一对互逆操作，理解这对关系是掌握 `*` 用法的关键。

`*args` 在 Python 日常开发中极其常见：标准库里大量函数的签名里都能看到它（如 `print` 的 `*objects`、`max`/`min` 的 `*args`、`str.format` 的 `*args`）；装饰器透传参数、代理函数转发调用、实现自己的可变参数工具函数时都离不开它。可以说，不看懂 `*args`，就很难真正读懂 Python 标准库与主流框架的源码。

### 1.2 基础语法与最小用法

先看定义侧的最小示例：在形参前加 `*`，让它收集所有多余位置参数。

```python
def show(*args):
    print(type(args))
    print(args)

show(1, 2, 3)
# 输出：
# <class 'tuple'>
# (1, 2, 3)

show()
# 输出：
# <class 'tuple'>
# ()
```

这个例子揭示了三条核心事实：第一，`args` 拿到的是一个元组，不是列表；第二，即便不传任何参数，`args` 也是一个空元组 `()`，而不会是 `None`，因此函数体内可以直接对它做迭代、求长度，不用判空；第三，`*` 后的名字只是普通变量名，换成 `def show(*items)` 效果完全一样。

再看调用侧的解包语法：把一个序列用 `*` 展开，再传给函数。

```python
def add(a, b, c):
    return a + b + c

nums = [10, 20, 30]
print(add(*nums))
# 输出：60

# 等价于
print(add(10, 20, 30))
# 输出：60
```

`add(*nums)` 和 `add(10, 20, 30)` 完全等价：解释器在调用前先把 `nums` 展开成三个独立的位置参数 10、20、30，再分别绑定到 `a`、`b`、`c`。如果 `nums` 的长度不等于形参个数，会像直接传三个参数那样报 `TypeError`。

定义侧的 `*args`、调用侧的 `*seq`，合在一起构成了可变位置参数的完整图景。下面进入核心内容，逐个展开它们的用法细节与典型场景。

## 2. 核心内容

### 2.1 定义侧：用 *args 收集多余位置参数

当函数签名里有 `*args` 时，调用时所有未被前面的普通形参"消费掉"的位置参数，都会被收集进 `args` 这个元组。理解"多余"二字很关键：`*args` 收集的是前面普通参数匹配完之后剩下的位置参数，而不是"所有参数"。

```python
def greet(greeting, *names):
    # greeting 是普通位置参数，匹配第一个实参
    # names 收集剩下的所有位置参数
    for name in names:
        print(f"{greeting}, {name}!")

greet("你好", "张三", "李四", "王五")
# 输出：
# 你好, 张三!
# 你好, 李四!
# 你好, 王五!
```

调用 `greet("你好", "张三", "李四", "王五")` 时，`"你好"` 绑定到 `greeting`，剩下的三个字符串被打包成元组 `("张三", "李四", "王五")` 赋给 `names`。`*args` 永远在前面的普通位置参数吃掉属于它们的那一份之后，才收拾残局。

如果只传了普通参数、没给 `*args` 留任何余量，`args` 就是空元组：

```python
def f(a, *args):
    print(f"a={a}, args={args}")

f(1)
# 输出：a=1, args=()

f(1, 2)
# 输出：a=1, args=(2,)

f(1, 2, 3, 4)
# 输出：a=1, args=(2, 3, 4)
```

**`args` 的类型永远是元组**

这里要特别强调一个容易搞错的点：`args` 是元组，不是列表。元组不可变，不能对它做 `append`、`sort`、`remove` 这类原地修改操作。

```python
def collect(*args):
    print(type(args))
    # args.append(1)  # 报错：AttributeError: 'tuple' object has no attribute 'append'
    # 需要可变的话，自己转成列表
    result = list(args)
    result.append(99)
    return result

print(collect(1, 2, 3))
# 输出：[1, 2, 3, 99]
```

为什么 Python 把 `args` 设计成元组而不是列表？因为函数接收到的实参本身在调用结束后就不应该被函数体修改——元组的不可变性正好表达了"这是一份只读的实参快照"这一语义，同时元组在创建和内存占用上都比列表更轻量（后续原理章节会展开）。

### 2.2 调用侧：用 *seq 解包序列为位置参数

与定义侧的打包相对，调用侧的 `*seq` 做的是"解包"：把一个可迭代对象展开成若干个独立的位置实参，再按位置匹配到形参。任何可迭代对象（列表、元组、字符串、集合、生成器等）都可以用 `*` 解包。

```python
def three(a, b, c):
    print(a, b, c)

data = [1, 2, 3]
three(*data)
# 输出：1 2 3

# 字符串也是可迭代对象，逐字符展开
three(*"xyz")
# 输出：x y z

# 元组解包
three(*(4, 5, 6))
# 输出：4 5 6
```

`*` 解包在调用前的"展开"阶段就完成了，效果和你把手写出来的一堆逗号分隔参数完全一样。如果展开后的元素个数与形参对不上，报的错和手动传错参数个数时一模一样：

```python
def two(a, b):
    return a + b

print(two(*[1, 2, 3]))
# 报错：TypeError: two() takes 2 positional arguments but 3 were given
```

这个报错信息非常直白："two 需要 2 个位置参数，但给了 3 个"。说明 `*` 解包是发生在参数绑定之前的——解释器先展开成三个实参，再尝试匹配，发现多了，于是报错。

**解包可以和普通实参混用**

调用时，`*` 解包出来的参数可以和手写的位置参数并排出现，按从左到右的顺序拼接。

```python
def four(a, b, c, d):
    print(a, b, c, d)

four(0, *[1, 2], 3)
# 输出：0 1 2 3

# 等价于 four(0, 1, 2, 3)
```

`0` 是手动写的位置参数，`*[1, 2]` 展开成 1 和 2，`3` 又是手动写的，最终拼成四个实参 `0, 1, 2, 3`。这个特性在"固定前缀 + 可变后缀"的调用场景里很实用，比如给一次拼接固定加一个头部参数，其余参数从某个列表解包而来。

### 2.3 典型场景一：求任意个数的最值与聚合

可变位置参数最经典的用途，是让函数接受"数量不限"的同类输入，做聚合运算。Python 内置的 `max`、`min`、`sum` 的签名里就有 `*args`（`max` 的签名是 `max(arg1, *args, key=...)`），我们自己实现一个 `max_n` 来体会这种设计。

```python
def max_n(*nums):
    """求任意个数数值中的最大值，不传参数返回 None。"""
    if not nums:          # args 是空元组时，not () 为 True
        return None
    result = nums[0]
    for n in nums[1:]:
        if n > result:
            result = n
    return result

print(max_n(3, 7, 2, 9, 5))
# 输出：9

print(max_n(42))
# 输出：42

print(max_n())
# 输出：None
```

这里有两个细节值得留意。其一，因为 `*nums` 在不传参时是空元组而非缺失，函数体需要在开头判空，否则 `nums[0]` 会 `IndexError`——内置 `max` 遇到零参数调用则直接抛 `TypeError`，设计取舍因函数而异。其二，`*nums` 收集的是"未知个数"的输入，调用方无需先打包成列表再传，写起来比 `max_n([3, 7, 2])` 这种"只能传列表"的接口更自然。

如果数据本来就在一个列表里，调用时用 `*` 解包即可，两种调用方式都支持：

```python
scores = [88, 92, 76, 95, 81]

# 方式一：逐个传
print(max_n(88, 92, 76, 95, 81))
# 输出：95

# 方式二：从列表解包
print(max_n(*scores))
# 输出：95
```

同类的聚合场景还有"求任意个数之和"、"求任意个数之积"：

```python
def product(*factors):
    """求任意个数因子的连乘积，空调用返回 1（乘法单位元）。"""
    result = 1
    for f in factors:
        result *= f
    return result

print(product(2, 3, 4))
# 输出：24

print(product(5))
# 输出：5

print(product())
# 输出：1
```

`product` 空调用返回 1 而不是 `None`，因为乘法单位元是 1，这与 `sum([]) == 0` 的设计是一致的——聚合函数的空值返回单位元，是一个值得遵循的数学约定。

### 2.4 典型场景二：字符串与值的灵活拼接

可变位置参数在"格式化输出"类的函数里几乎是标配。Python 的 `print` 就用 `*objects` 收集任意个要打印的值，再配合 `sep`、`end` 控制分隔符和结尾。我们自己实现一个简化版的 `join_all`，把任意个字符串用指定连接符拼起来。

```python
def join_all(sep, *parts):
    """用 sep 把任意个字符串拼接成一个字符串。"""
    # 因为 sep 是普通位置参数，调用时第一个实参一定绑到 sep
    # 调用者不可能漏掉 sep，这正是把它放在 *parts 前的意义
    return sep.join(parts)

print(join_all("-", "2025", "07", "23"))
# 输出：2025-07-23

print(join_all("/", "usr", "local", "bin", "python3"))
# 输出：usr/local/bin/python3

print(join_all(""))
# 输出：（空字符串，parts 为空元组，join 结果为 ""）
```

把固定语义的参数（分隔符 `sep`）放在 `*parts` 之前，是一个常见且优雅的设计：它既保证了关键参数不会被"可变参数洪流"吞掉，又让调用形式 `join_all(分隔符, 片段1, 片段2, ...)` 读起来非常贴近自然语言。

再来看一个"printf 风格"的可变参数日志函数，它接受一条模板和任意个要填入模板的值，模仿 C 语言 `printf(fmt, ...)` 的接口：

```python
def log_info(template, *values):
    """用 values 依次填充 template 中的 {} 占位符，输出一行日志。"""
    message = template.format(*values) if values else template
    print(f"[INFO] {message}")

log_info("用户 {} 在 {} 登录", "张三", "2025-07-23 10:30")
# 输出：[INFO] 用户 张三 在 2025-07-23 10:30 登录

log_info("系统启动完成")
# 输出：[INFO] 系统启动完成

log_info("支持上线，当前 {} 个实例，QPS {}", 8, 12500)
# 输出：[INFO] 支持上线，当前 8 个实例，QPS 12500
```

注意这里 `template.format(*values)`：`str.format` 本身就接受可变位置参数，我们把收集到的 `values` 元组再用 `*` 解包回去，交给 `format` 处理。这正是"转发参数"思想的一个微缩版——收集进来，再原样转发出去。后面会专门讲转发模式。

### 2.5 典型场景三：转发参数给另一个函数

`*args` 最具威力的用法是"参数透传"：一个函数自己不关心参数细节，只是把收到的位置参数原封不动转给另一个函数。这种模式在写代理、包装器、适配器时极为常见。

```python
def _real_compute(a, b, c, d):
    """假设这是某个底层计算函数，签名固定。"""
    return (a + b) * (c - d)

def wrapper(*args):
    """代理函数：记录调用，再把参数转发给真正的计算函数。"""
    print(f"调用 _real_compute，收到 {len(args)} 个参数：{args}")
    result = _real_compute(*args)   # 关键：把 args 解包后转发
    print(f"计算结果：{result}")
    return result

wrapper(10, 20, 30, 5)
# 输出：
# 调用 _real_compute，收到 4 个参数：(10, 20, 30, 5)
# 计算结果：150
```

`wrapper(*args)` 把所有位置参数收进元组，`_real_compute(*args)` 又把这个元组展开回位置参数——一收一发之间，`wrapper` 完全不必知道 `_real_compute` 到底要几个参数，只要调用者传对了就行。这意味着即便将来 `_real_compute` 的签名变了（增减参数），`wrapper` 的代码一行都不用改，这种"对签名变化免疫"的特性是参数转发最大的价值。

更真实的例子：实现一个带缓存的结果记忆化包装器，把原函数的参数原样转给原函数。

```python
def memoize(func):
    """简易记忆化装饰器：按位置参数缓存函数返回值。"""
    cache = {}

    def helper(*args):
        if args not in cache:
            cache[args] = func(*args)   # 把参数转发给被装饰的函数
        return cache[args]

    return helper

@memoize
def slow_square(n):
    print(f"  计算 {n} 的平方...")
    return n * n

print(slow_square(4))
# 输出：
#   计算 4 的平方...
# 16

print(slow_square(4))
# 输出：16    （第二次没打印"计算"，命中缓存）

print(slow_square(5))
# 输出：
#   计算 5 的平方...
# 25
```

这里 `helper(*args)` 收集调用方传入的参数，`func(*args)` 把这些参数转发给被装饰的 `slow_square`。因为 `args` 是元组，元组是可哈希的，可以直接作为 `cache` 字典的键——这是 `*args` 恰好是元组带来的一个天然红利（如果是列表就不能直接当字典键）。

### 2.6 典型场景四：装饰器透传任意参数

装饰器面对的是"被装饰函数的签名千差万别"的问题：你写装饰器时根本不知道将来它会套在什么函数上，那个函数可能没有参数，可能有 2 个位置参数，也可能有 3 个位置参数加 2 个关键字参数。要让装饰器对各种签名都通用，标准做法就是用 `*args` 透传。

```python
def log_call(func):
    """装饰器：在调用前后打印日志，参数原样透传。"""
    def inner(*args, **kwargs):
        print(f"--> 调用 {func.__name__}({args}, {kwargs})")
        result = func(*args, **kwargs)    # 透传位置参数和关键字参数
        print(f"<-- {func.__name__} 返回 {result}")
        return result
    return inner

@log_call
def add(a, b):
    return a + b

@log_call
def greet(name, greeting="你好"):
    return f"{greeting}, {name}"

@log_call
def no_arg():
    return "无事可做"

print(add(1, 2))
# 输出：
# --> 调用 add((1, 2), {})
# <-- add 返回 3
# 3

print(greet("张三", greeting="早上好"))
# 输出：
# --> 调用 greet(('张三',), {'greeting': '早上好'})
# <-- greet 返回 早上好, 张三
# 早上好, 张三

print(no_arg())
# 输出：
# --> 调用 no_arg((), {})
# <-- no_arg 返回 无事可做
# 无事可做
```

这里出现了 `**kwargs`（可变关键字参数），它和 `*args` 是一对搭档，本篇聚焦 `*args`，`**kwargs` 会在专门一篇里展开。只需记住一点：凡是要写"对任意签名都通用"的装饰器，闭包内层的签名几乎一定是 `def inner(*args, **kwargs): ... func(*args, **kwargs)`，这是 Python 社区公认的通用透传模板，是把 `*args` 用到极致的代表场景。

不只要透传，还能在透传基础上做"前后增强"：比如在转发前校验参数、在转发后处理返回值、在转发前后计时——下面是一个给函数加上执行耗时的装饰器，参数透传部分和上面完全一致，只是多包了 `time.perf_counter`：

```python
import time

def timed(func):
    def inner(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"{func.__name__} 耗时 {elapsed:.6f}s")
        return result
    return inner

@timed
def build_message(*parts):
    time.sleep(0.01)
    return " | ".join(parts)

print(build_message("a", "b", "c", "d"))
# 输出（耗时会随运行环境变化）：
# build_message 耗时 0.010xxx s
# a | b | c | d
```

### 2.7 *args 与普通位置参数、默认参数的顺序规则

Python 对函数签名中各类参数的排列顺序有严格规定，顺序错了会直接 `SyntaxError`。完整的顺序规则是：

```
def func(普通位置参数, 带默认值的参数, *args, 仅关键字参数, **kwargs):
            ────────────────       ────────
            前面这些叫"位置参数"     *args 之后的参数只能按关键字传
```

具体来说：普通位置参数在前，带默认值的参数紧随其后（带默认值的参数本质上也属于位置参数，只是调用时可以省略），接着是 `*args`，再往后是只能用关键字传的参数，最后是 `**kwargs`。先通过一组对照例子建立直觉：

```python
# 合法：普通参数 + 带默认参数 + *args
def f1(a, b=10, *args):
    print(a, b, args)

f1(1)
# 输出：1 10 ()

f1(1, 2)
# 输出：1 2 ()

f1(1, 2, 3, 4)
# 输出：1 2 (3, 4)
```

`f1(1, 2, 3, 4)` 中，`1` 给 `a`，`2` 给 `b`（覆盖了默认值 10），`3, 4` 被 `*args` 收走。注意此时 `b` 虽然"有默认值"，但它依然按位置匹配——只要调用时对应位置有实参，默认值就会被覆盖。

把带默认参数放在 `*args` 之后，行为就不同了——此时它变成了"仅关键字参数"：

```python
# 合法：普通参数 + *args + 带默认参数（此时是仅关键字参数）
def f2(a, *args, b=10):
    print(a, args, b)

f2(1)
# 输出：1 () 10

f2(1, 2, 3)
# 输出：1 (2, 3) 10

# b 只能用关键字传，不能按位置传
f2(1, 2, 3, b=99)
# 输出：1 (2, 3) 99

# 下面这行会报错：
# f2(1, 2, 3, 99)
# TypeError: f2() takes ... but ... were given
```

`f2(1, 2, 3, 99)` 为什么报错？因为 `b` 位于 `*args` 之后，已经不再是位置参数，无法按位置接收第 4 个实参 `99`——那个 `99` 没有任何形参能匹配，于是报错。要给 `b` 传值只能写成 `b=99` 关键字形式。这正是"`*args` 之后的参数成为仅关键字参数"这一规则的直观体现。

为什么 Python 要设计这条规则？因为 `*args` 是个"贪吃蛇"，会把后面的位置参数全部吞掉。如果允许 `*args` 之后的参数还能按位置传，调用时就彻底无法区分"这个值是给 `*args` 的还是给后面某个参数的"。用 `*args` 作为一道分界线，把"可以按位置传的参数"和"必须用关键字传的参数"清晰隔开，既消除了二义性，又给了函数作者一种强制调用者写关键字参数的手段。

再看一个把全部顺序拼到一起的完整例子：

```python
def f3(a, b=2, *args, c, d=5, **kwargs):
    print(f"a={a}, b={b}, args={args}, c={c}, d={d}, kwargs={kwargs}")

f3(1, c=3)
# 输出：a=1, b=2, args=(), c=3, d=5, kwargs={}

f3(1, 20, 30, 40, c=100, d=200, e=300)
# 输出：a=1, b=20, args=(30, 40), c=100, d=200, kwargs={'e': 300}
```

逐步解析 `f3(1, 20, 30, 40, c=100, d=200, e=300)`：`1` 给 `a`；`20` 按位置给 `b` 覆盖默认 2；`30, 40` 被 `*args` 收成 `(30, 40)`；`c=100` 用关键字给 `c`（`c` 没有默认值又位于 `*args` 之后，是"必须传的仅关键字参数"）；`d=200` 给 `d`；`e=300` 没有对应形参，被 `**kwargs` 收进字典。这个例子把五类参数一次性铺开，理解了它就掌握了 Python 函数签名的全貌。

### 2.8 *args 单独出现：强制其后的参数为仅关键字参数

`*args` 不一定要带名字。在参数列表中单独写一个 `*`，也是一个合法且有用的语法：它不收集任何参数到变量里，但依然充当"分界线"，强制它之后的参数必须用关键字传。Python 3 的许多内置函数都用这个技巧来"逼迫"调用者写清楚参数名，从而提升可读性、避免误用。

```python
def connect(host, port, *, timeout=10, retry=3):
    """port 之后强制关键字传 timeout / retry，防止位置参数含义混淆。"""
    print(f"连接 {host}:{port}，超时 {timeout}s，重试 {retry} 次")

connect("127.0.0.1", 8080)
# 输出：连接 127.0.0.1:8080，超时 10s，重试 3 次

connect("127.0.0.1", 8080, timeout=30, retry=5)
# 输出：连接 127.0.0.1:8080，超时 30s，重试 5 次

# 以下调用会因为没用关键字而报错：
# connect("127.0.0.1", 8080, 30, 5)
# TypeError: connect() takes 2 positional arguments but 4 were given
```

如果不加那道 `*`，`connect("127.0.0.1", 8080, 30, 5)` 会悄悄成功——调用者把 `30` 当超时、`5` 当重试，但读代码的人完全没法一眼看出哪个数字是超时哪个是重试，未来如果再把参数顺序调换一下，调用方更是要踩大坑。加了 `*` 之后，调用必须写成 `timeout=30, retry=5`，参数含义一目了然。这正是不带名字的 `*` 的核心价值：把"容易传错的可选参数"保护起来，强制显式传名。

关于"仅关键字参数"的完整机制（含 `*` 裸分隔符的更多用法、`*args` 之后带默认值与不带默认值的仅关键字参数差异、与 `**kwargs` 的交互等），会单独开一篇详述。本篇只在此"简提"这条规则，作为理解 `*args` 定位作用的补充。

### 2.9 *args 元组的不可变性与应对

前面反复提到 `args` 是元组，元组不可变。这一小节专门把这个约束的后果和应对方式讲清，因为它经常让初学者写不下去。

**问题：想往 `args` 里动态加东西怎么办？**

常见错误是直接对 `args` 调用 `append`：

```python
def bad(*args):
    args.append(99)   # AttributeError: 'tuple' object has no attribute 'append'
    print(args)

# bad(1, 2)   # 一调用就崩
```

正确做法是在函数体开头把 `args` 转成列表，之后操作这个列表即可：

```python
def good(*args):
    bag = list(args)     # 转成可变列表
    bag.append(99)
    bag.extend([100, 101])
    print(bag)

good(1, 2, 3)
# 输出：[1, 2, 3, 99, 100, 101]
```

如果想把处理后的列表继续作为可变位置参数转发给另一个函数，再对列表用 `*` 解包即可：

```python
def downstream(*items):
    print("收到：", items)

def pipeline(*args):
    bag = list(args)
    bag.append("尾巴")
    downstream(*bag)    # 把列表解包后转发

pipeline("头", "中")
# 输出：收到： ('头', '中', '尾巴')
```

这套"收到元组 → 转 list 改 → 用 `*` 再发出去"的流程，是处理 `*args` 时的标准动作，务必熟练。

**元组不可变带来的一个好处：可直接当字典键**

由于元组可哈希，`args` 能直接作为字典的键，上文的记忆化装饰器正是利用了这一点。如果 `args` 是列表，就不能这么写：

```python
cache = {}

def once(func):
    def inner(*args):
        if args not in cache:          # 元组能 in 字典
            cache[args] = func(*args)
        return cache[args]
    return inner
```

### 2.10 与位置参数默认值的配合：可变参数的"可选前缀"

利用带默认值的普通参数 + `*args`，可以做出"前几个参数有默认、后面的随便传"的接口。例如一个生成报告的函数，`title` 必填，`level` 有默认值，后面允许追加任意条目：

```python
def report(title, level="INFO", *items):
    body = "\n".join(f"  - {it}" for it in items)
    print(f"[{level}] {title}")
    if items:
        print(body)

report("日报", "WARN", "完成 3 个任务", "延迟 1 个任务", "新增 2 个工单")
# 输出：
# [WARN] 日报
#   - 完成 3 个任务
#   - 延迟 1 个任务
#   - 新增 2 个工单

report("周报")
# 输出：[INFO] 周报

report("临时汇报", "ERROR", "服务 500")
# 输出：
# [ERROR] 临时汇报
#   - 服务 500
```

这种结构适合"第一个是主题、第二个是有默认值的类别、后面是零到多个同性质的条目"的场景。但要注意一个陷阱：`level` 既然有默认值，调用时一旦想省略它只写 `title` 和 `items`，是做不到的——因为 `level` 还是位置参数，会被第一个"多余"的实参顶上。如果你希望"第二个参数既能省略又能让 `*items` 正常收集"，应该把 `level` 移到 `*items` 之后，改成仅关键字参数：

```python
def report2(title, *items, level="INFO"):
    body = "\n".join(f"  - {it}" for it in items)
    print(f"[{level}] {title}")
    if items:
        print(body)

report2("日报", "任务A", "任务B", level="WARN")
# 输出：
# [WARN] 日报
#   - 任务A
#   - 任务B

report2("周报")
# 输出：[INFO] 周报
```

此时 `level` 省略时静默用默认值，`items` 能正常收集所有位置实参——这正是 `*args` 作为分界线的另一重价值：把"可省略的可选参数"挪到它后面，既省得了，又不和可变位置参数抢位置。

## 3. 最佳实践

**优先用具名参数代替过长的 *args**

`*args` 用多了会让调用者完全不知道该传什么、传几个，可读性变差。只要参数个数有限且含义明确，就应该写成具名参数。对比：

```python
# 不推荐：调用者看不出要传什么
def create_user(*args):
    ...

create_user("张三", 30, "admin", True)   # 这 4 个分别是什么？

# 推荐：参数含义清晰
def create_user(name, age, role="user", active=True):
    ...

create_user("张三", 30, role="admin", active=True)
```

只有当参数个数真的不可预知、且同为一种性质（一串数值、一串字符串）时，才该用 `*args`。

**不要在 *args 收集到参数后立即改它，而是转 list 再改**

记住 `args` 是元组这一事实，需要修改时先 `list(args)`，避免在 `args.append(...)` 上反复踩坑。也要提醒 teammates：代码评审时看到 `args.append` 几乎可以直接判负。

**转发参数时养成 *args、**kwargs 一起用的习惯**

写装饰器、代理函数、包装器时，哪怕当前你只看到位置参数，也建议直接用 `def inner(*args, **kwargs): ... func(*args, **kwargs)`，让代码对将来被包装函数加上关键字参数免疫。事后补 `**kwargs` 既要改代码又要回归测试，不如一开始就写全。

**避免把 *args 当成"什么都能塞"的万能口袋**

有的团队喜欢写 `def handler(*args)` 然后在体内靠 `args[0]`、`args[1]` 下标取值——这其实是在用元组模拟位置参数列表，丢失了参数名、丢失了 IDE 提示、丢失了类型检查。一旦有人把参数顺序传错，运行时才报错，排查极痛。正确做法仍然是具名参数。

**调用侧解包前确认元素个数**

`func(*seq)` 在 `seq` 长度与形参不匹配时会抛 `TypeError`，并且报错信息只说"传了几个、要几个"，不告诉你是哪个序列出问题。对动态来源的序列（如用户输入解析、文件读取的结果），先做长度校验或用 `try/except TypeError` 包一层，能给出更友好的错误信息。

**用裸 * 强制关键字传"危险参数"**

当函数有几个含义迥然、容易传错的可选参数时，在它们前面放一个裸 `*`，强制调用者写参数名。这是用 `*args` 机制的延伸（裸 `*` 就是"不命名的 `*args` 分界线"），对接口稳定性和可读性都有显著帮助，标准库 `sorted(iterable, *, key=None, reverse=False)` 就是这么做的。

**给 *args 的元组判空用 `if not args`**

判断 `*args` 是否收到了参数，最 Pythonic 的写法是 `if not args`（空元组为假值），而不是 `if len(args) == 0` 或 `if args == ()`。简洁且符合真值测试语义。

**给可变位置参数取一个有语义的名字**

`*args` 这个名字虽然通用，但并不总是最好的选择。当可变参数承载的是明确同性质的数据时，给它一个能说明"这是什么"的名字，会让函数签名本身就成为文档：

```python
# 不推荐：看不出 args 装的是什么
def total(*args):
    return sum(args)

# 推荐：名字直接说明"这是一组价格"
def total(*prices):
    return sum(prices)

print(total(19.9, 25.5, 8.0))
# 输出：53.4
```

调用链长的时候，语义化命名尤为关键：读代码的人扫一眼 `def total(*prices)` 就知道要传价格，而 `def total(*args)` 则要靠人去翻文档或猜。装饰器这类"完全透传、不关心参数含义"的场景才用 `*args`，其他要尽量具名。

**注意性能：每次调用都会新建元组**

每次函数被调用，`*args` 都会在调用栈上新建一个元组对象。对高频调用的小函数，如果可变参数绝大多数时候只传 0 或 1 个值，这点开销可以忽略；但如果调用频率非常高（百万级/秒），并且 `args` 元素经常很多，可考虑改用具名参数或直接接收一个序列形参，避免反复打包元组。正常业务代码无需为此焦虑，知道这个事实即可。

## 4. 原理

### 4.1 调用侧：参数打包与 * 解包发生在 CALL 之前

当解释器执行一次函数调用 `func(1, 2, *nums, 5)` 时，可变位置参数的处理顺序是：先算出每个实参表达式的值，对 `*nums` 执行解包（把 `nums` 这个可迭代对象展开成若干个值），再把所有实参按从左到右拼成一个完整的位置参数序列，最后才进入形参绑定与函数体执行。也就是说，"解包"发生在"绑定"之前。

用字节码可以验证这一点。看这个简单函数和它的调用：

```python
def add(a, b):
    return a + b

nums = [10, 20]
add(*nums)
```

用 `dis` 模块查看 `add(*nums)` 这一行调用对应的字节码：

```python
import dis

def demo():
    nums = [10, 20]
    add(*nums)

dis.dis(demo)
```

核心片段大致如下（不同 Python 版本细节略有差异，但结构一致）：

```
  LOAD_GLOBAL              0 (add)
  LOAD_CONST               1 (10)
  LOAD_CONST               2 (20)
  BUILD_LIST               2
  STORE_FAST               0 (nums)
  LOAD_GLOBAL              0 (add)
  LOAD_FAST                0 (nums)
  CALL_FUNCTION_EX         0 | 1      # 关键：把 nums 解包后传给 add
```

关键指令是 `CALL_FUNCTION_EX`（在 Python 3.11 之前版本如此，3.11+ 改为 `CALL` 系列，但语义相同）。它的工作流程是：取到栈顶的可迭代对象 `nums`，在调用前先把它展开成一个 C 层的位置参数数组，再把这组参数交给目标函数 `add` 去绑定形参。也就是说，等 `add` 真正"看见"这组参数时，`*nums` 早就展开完了，`add` 拿到的就是 10 和 20 两个独立实参，与直接写 `add(10, 20)` 没有任何区别。

这也解释了为什么 `add(*nums)` 在 `nums` 长度不等于形参个数时报的和 `add(10, 20, 30)` 一样的"`TypeError`: takes 2 ... but 3 were given"——对 `add` 而言，它根本不知道也不关心这些实参是手写的还是 `*` 解包来的。

### 4.2 定义侧：def 中 *args 的绑定机制

当函数被定义时，`def func(*args)` 中的 `*args` 会被编译器标记成一个"可变位置参数槽位"。真正的绑定发生在每次调用时：解释器先把所有位置实参填进普通形参槽位，把剩下的多余位置实参打包成一个元组对象，再把这个元组绑定到 `args` 这个局部变量上。

继续用一个例子配合 `dis` 观察：

```python
def f(a, *args):
    return args

dis.dis(f)
```

字节码片段大致为：

```
  <参数绑定由解释器在进入函数体前完成， 不展开成显式字节码>
  LOAD_FAST                1 (args)
  RETURN_VALUE
```

可见函数体里直接把 `args` 当一个已存在的局部变量来用，不需要任何"构造元组"的代码——元组的构造在"参数绑定"阶段由解释器替你完成了，对函数体是透明的。这个"构造元组"动作对应的底层操作就是下一节要讲的 `BUILD_TUPLE`。

### 4.3 元组打包的字节码层面：BUILD_TUPLE

解释器在把"多余的位置实参"打包成 `args` 元组时，本质上执行的就是 `BUILD_TUPLE` 指令。`BUILD_TUPLE n` 的语义是：从栈顶弹出 `n` 个元素，构造一个包含这 `n` 个元素的元组对象，再把它压回栈顶。

可以通过人工构造一段等价代码来"看到"这条指令：

```python
import dis

def make_tuple():
    a = 1
    b = 2
    c = 3
    return (a, b, c)

dis.dis(make_tuple)
```

关键片段：

```
  LOAD_FAST                0 (a)
  LOAD_FAST                1 (b)
  LOAD_FAST                2 (c)
  BUILD_TUPLE              3        # 把栈顶 3 个元素打包成元组
  RETURN_VALUE
```

虽然这段代码不是 `*args` 本身，但它揭示了 Python 创建元组的统一机制：当函数签名里有 `*args` 时，解释器在参数绑定阶段执行的也是同一种"把若干个值打包成元组"的操作，只不过这个打包过程对 Python 源码层不可见，由解释器的函数调用协议在 C 层完成（CPython 的 `MAKE_FUNCTION` 与调用协议 `CALL_FUNCTION_EX` 配合，会根据函数的 `CO_VARARGS` 标志位判断是否需要把多余位置参数收进元组）。

`CO_VARARGS` 是函数对象 `__code__` 上的一个标志位。可以用它来检查一个函数是否声明了 `*args`：

```python
def with_args(*args):
    pass

def without_args(a, b):
    pass

import inspect
print(inspect.getfullargspec(with_args).varargs)   # 输出：args
print(inspect.getfullargspec(without_args).varargs)  # 输出：None

# 也可以直接看标志位
print(bool(with_args.__code__.co_flags & 0x04))      # 输出：True （0x04 = CO_VARARGS）
print(bool(without_args.__code__.co_flags & 0x04))    # 输出：False
```

`co_flags & 0x04` 为真，说明这个函数在编译期就被标记了"需要收集可变位置参数"，调用时解释器会据此触发元组打包。这就是 `*args` 在定义侧的底层落点。

### 4.4 为什么是元组而不是列表

从原理角度补充一句"为什么 `args` 是元组"，能帮理解更扎实。三个原因：

第一，调用时多余位置参数的个数在运行时才确定，但每次调用开始时这些值就已经全部就位、之后不会再增减，这是一个典型的"一次性快照"语义，元组正合适；而列表是用来表达"后续还会增删"的容器，语义不匹配。

第二，元组是不可变的，因此可哈希，可以直接当字典键——记忆化模式能直接用 `args` 做缓存键，正是得益于此。如果 `args` 是列表，就得先 `tuple(args)` 才能当键。

第三，元组的内存开销与构造速度都比列表更优：元组是一个固定大小的数组结构，没有 list 那种"过度分配 + 容量管理"的开销；每次调用都新建一个 `args` 元组，用元组能把这层高频开销压到最低。这在 CPython 源码 `Python/ceval.c` 的调用协议实现里也能印证：打包多余位置参数走的是一条最短的构造路径。

## 5. 总结

### 5.1 本文内容要点

- 可变位置参数 `*args` 让函数接收数量不定的位置实参：定义时 `*args` 把"多余"的位置实参打包成一个元组，调用时 `*seq` 把序列解包成若干个位置实参，二者互为逆操作。
- `args` 永远是元组，不是列表，即便零参数调用也是空元组 `()` 而非 `None`；需要可变时用 `list(args)` 转换。
- 典型场景：任意个数聚合（`max_n`、`product`）、灵活拼接（`join_all`、`log_info`）、参数转发（`wrapper(*args)` 转给底层函数）、装饰器透传（`def inner(*args, **kwargs): func(*args, **kwargs)`）。
- 参数顺序规则：普通位置参数 → 带默认值参数 → `*args` → 仅关键字参数 → `**kwargs`，顺序错误会 `SyntaxError`。
- 单独一个裸 `*` 不收集参数，但充当场分界线，强制其后的参数必须用关键字传递。
- 判断 `*args` 是否收到参数用 `if not args`；修改 `args` 先 `list(args)`；转发参数同时配 `**kwargs` 以对签名变化免疫。
- 原理上：调用侧的 `*` 解包发生在 `CALL_FUNCTION_EX`/`CALL` 之前的实参组装阶段；定义侧的 `*args` 由 `CO_VARARGS` 标志位触发，解释器在参数绑定阶段用 `BUILD_TUPLE` 机制把多余位置实参打包为元组；元组而非列表的选择出于不可变语义、可哈希、构造开销小三方面考量。

### 5.2 读完本文你应能掌握

- 准确说出定义侧 `*args`、调用侧 `*seq` 各自的作用与关系，并能写出收集与解包的最小可运行示例。
- 在签名中正确排列"普通参数、带默认值参数、`*args`、仅关键字参数、`**kwargs`"的顺序，解释清楚为什么 `*args` 之后的参数会成为仅关键字参数。
- 独立实现求任意个数最值、自定义拼接函数、参数转发包装器、带缓存/计时的装饰器透传，并理解每一步为什么这么写。
- 解释 `args` 为何是元组、何时要转 `list`、元组可哈希带来的记忆化便利。
- 用 `dis` 模块观察 `CALL_FUNCTION_EX` 解包时机与 `BUILD_TUPLE` 打包机制，说明 `co_flags & CO_VARARGS` 如何标记一个函数需要收集可变位置参数。