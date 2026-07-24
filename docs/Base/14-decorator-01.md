---
group:
  title: 【14】装饰器深度剖析
  order: 14
order: 1
title: 装饰器本质
nav:
  title: Python
  order: 1
---

## 1. 介绍

### 1.1 什么是装饰器

如果只用一句话概括装饰器，那就是：**装饰器是一个接收函数、返回函数的高阶函数**。

说得更具体一点：装饰器本身是一个 callable，它接受一个函数（或类）作为参数，经过一番加工后，返回一个"新"的函数（或类）——这个返回的对象会**替换掉原本函数的名字绑定**。从那以后，你用这个名字调用函数，实际执行的是装饰器返回的那个对象，而不是最初定义的函数。

这是 Python 里一个非常自然的机制。在 Python 中，函数是一等对象（first-class object）：函数可以被赋值给变量、作为参数传递、作为返回值返回、存进容器。装饰器只是把"函数作为参数传入、函数作为返回值传出"这件事用一个语法糖 `@` 包装了一下，让它写起来更顺手、看起来更整齐。

理解装饰器的关键，不在于记住 `@` 怎么写，而在于抓住三件事：

1. 装饰器是高阶函数——接收函数、返回函数。
2. `@decorator` 是语法糖，等价于 `target = decorator(target)`。
3. 装饰器的执行时机是函数定义时（模块加载 / import 时），不是函数调用时。

这三点构成了"装饰器本质"的全部骨架。本篇要做的，就是把这三点讲透，并说明装饰器为什么几乎总是用闭包来实现、装饰器能用来做什么、和闭包到底是什么关系，为后续的"无参装饰器""带参装饰器""类装饰器"等篇章打好地基。

### 1.2 最基本的语法形式

装饰器的语法分成两种形态：不带参数的装饰器，和带参数的装饰器。本篇主要讲前者，后者只做对比性提及。

不带参装饰器的语法形式：

```python
def decorator(func):
    # 接收一个函数，返回一个"新"函数
    ...

@decorator
def target():
    ...
```

这里的 `@decorator` 紧贴在函数定义上方，`@` 后面直接跟装饰器名字（不带括号）。它完全等价于下面这一行：

```python
def target():
    ...
target = decorator(target)
```

也就是说，`@decorator` 做的事情就是：先正常执行 `def` 语句定义出函数对象，把它绑定到名字 `target`；紧接着调用 `decorator(target)`，把返回值再绑定回 `target` 这个名字。名字 `target` 现在指向的，是 `decorator` 返回的那个对象，而不是原来的函数。

带参装饰器的语法形式（本篇只看一眼，详细留给后续篇章）：

```python
def decorator_with_args(level):
    # 返回一个"真正的装饰器"
    ...
    return real_decorator

@decorator_with_args("info")
def target():
    ...
```

注意 `@decorator_with_args("info")` 这里带了括号和参数。它等价于 `target = decorator_with_args("info")(target)`——先调用 `decorator_with_args("info")` 拿到"真正的装饰器"，再用那个装饰器去装饰 `target`。这就是为什么带参装饰器通常需要三层嵌套：最外层接收参数、中间层是真正的装饰器、最内层是包装函数。本篇之后会再简要点出这个差异，但实现细节留给"带参装饰器"篇。

### 1.3 一个最小可运行示例

先看一个最朴素的不带参装饰器，不加任何花哨功能，只打印一行"我要装饰你了"：

```python
def shout(func):
    """最简单的装饰器：在原函数前后各打印一行。"""
    def wrapper(*args, **kwargs):
        print(">>> 准备执行", func.__name__)
        result = func(*args, **kwargs)
        print(">>> 执行完毕", func.__name__)
        return result
    return wrapper

@shout
def greet(name):
    print(f"你好，{name}")

greet("老王")
# 输出：
# >>> 准备执行 greet
# 你好，老王
# >>> 执行完毕 greet
```

这个例子里有几个要点可先记住，后面会逐个拆开：

- `shout` 是装饰器，它接收 `func`（被装饰的函数 `greet`），返回 `wrapper`。
- `wrapper` 是一个"包装函数"，它内部通过 `func(*args, **kwargs)` 调用了原函数。这里用 `*args, **kwargs` 是为了兼容任意签名的被装饰函数。
- `greet("老王")` 实际调用的是 `wrapper("老王")`，而不是原始的 `greet`。
- `func` 被 `wrapper` 引用着，即使 `shout` 调用已经返回，`wrapper` 依然能访问到 `func`——这就是闭包在装饰器里扮演的角色。

这个例子虽然小，但已经包含了装饰器的全部核心机制。接下来我们把它一块块拆开。

## 2. 核心内容

### 2.1 装饰器是"接收函数、返回函数"的高阶函数

装饰器最根本的身份，就是一个高阶函数。所谓高阶函数，就是满足以下两条之一（或都满足）的函数：接收一个或多个函数作为参数；返回一个函数作为结果。装饰器两者都满足。

来看一个不使用任何 `@` 语法糖的等价写法，先把"装饰器就是个普通函数"这件事看穿：

```python
def add_logging(func):
    """给 func 增加"执行前打印日志"的能力。"""
    def wrapper(*args, **kwargs):
        print(f"[LOG] 调用 {func.__name__}，参数 args={args} kwargs={kwargs}")
        return func(*args, **kwargs)
    return wrapper

def fetch_user(user_id):
    return {"id": user_id, "name": "张三"}

# 不用 @，手动"装饰"
fetch_user = add_logging(fetch_user)

print(fetch_user(7))
# 输出：
# [LOG] 调用 fetch_user，参数 args=(7,) kwargs={}
# {'id': 7, 'name': '张三'}
```

注意这一行：

```python
fetch_user = add_logging(fetch_user)
```

它做了两件事：

1. 把原始的 `fetch_user` 函数作为参数传给 `add_logging`。
2. 把 `add_logging` 返回的 `wrapper` 重新绑定到名字 `fetch_user`。

从这之后，名字 `fetch_user` 指向的不再是原始函数对象，而是 `wrapper`。任何人通过 `fetch_user(...)` 调用，实际进入的都是 `wrapper` 函数体。

`@` 语法糖只是把上面这种"手动装饰"的写法缩短了。我们可以等价改写：

```python
@add_logging
def fetch_user(user_id):
    return {"id": user_id, "name": "张三"}
```

这两段代码在运行时产生的效果是完全一致的。换句话说，**`@decorator` 唯一的作用，就是自动帮你执行 `target = decorator(target)`**。它没有引入任何新机制，只是个为了可读性而存在的语法糖。

**一个帮助理解的小实验**

下面这个例子用 `print` 证实了"装饰后名字指向的对象变了"：

```python
def tag(func):
    def wrapper(*args, **kwargs):
        return f"<b>{func(*args, **kwargs)}</b>"
    return wrapper

def hello():
    return "hello"

print("装饰前，hello 是：", hello)
print("装饰前，hello.__name__ 是：", hello.__name__)

# 手动装饰
hello = tag(hello)

print("装饰后，hello 是：", hello)
print("装饰后，hello.__name__ 是：", hello.__name__)
print("调用结果：", hello())
# 输出：
# 装饰前，hello 是： <function hello at 0x...>
# 装饰前，hello.__name__ 是： hello
# 装饰后，hello 是： <function tag.<locals>.wrapper at 0x...>
# 装饰后，hello.__name__ 是： wrapper
# 调用结果： <b>hello</b>
```

装饰前 `hello` 的 `__name__` 是 `hello`，装饰后变成了 `wrapper`——因为现在名字 `hello` 绑定的是 `tag` 内部定义的那个 `wrapper` 函数对象。这是个"副作用"，后续我们会用 `functools.wraps` 来修复它，但在这里它恰好清楚地说明了一件事：**名字 `hello` 已经不再指向原始函数了**。

### 2.2 `@decorator` 是语法糖：等价转换 `target = decorator(target)`

理解装饰器最重要的一步，就是把 `@` 这个符号"祛魅"。它不是什么魔法，它只是一条简写规则。

规则只有一句话：

> 紧跟在 `def` 上方的 `@decorator`，等价于在 `def` 语句之后立即执行 `target = decorator(target)`。

用代码对比最直观：

```python
# 写法 A：使用 @ 语法糖
@decorator
def target():
    pass

# 写法 B：不用 @，手动等价转换
def target():
    pass
target = decorator(target)
```

A 和 B 在运行时执行的指令完全相同，没有任何差别。`@` 只是让"装饰"这件事看起来更显眼、更整齐地贴在函数定义上方而已。

**把语法糖手动展开**

下面这个 demo 同时展示两种写法，并用一个装饰器证明它们的确是等价的：

```python
def double_result(func):
    """把原函数返回值翻倍的装饰器。"""
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs) * 2
    return wrapper

# 写法一：用 @ 语法糖
@double_result
def compute_a(x):
    return x + 1

# 写法二：手动等价转换
def compute_b(x):
    return x + 1
compute_b = double_result(compute_b)

print("compute_a(5) =", compute_a(5))   # (5+1)*2 = 12
print("compute_b(5) =", compute_b(5))   # (5+1)*2 = 12
# 输出：
# compute_a(5) = 12
# compute_b(5) = 12
```

两种写法的输出完全一致。把 `@` 在脑内展开成 `target = decorator(target)`，是读懂一切装饰器的基础。

**带参装饰器的等价转换（预告）**

带参装饰器的等价转换稍微多一步。先看一个最简版带参装饰器：

```python
def repeat(times):
    """重复调用被装饰函数 times 次，返回最后一次结果。"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            result = None
            for _ in range(times):
                result = func(*args, **kwargs)
            return result
        return wrapper
    return decorator

@repeat(3)
def say(msg):
    print(msg)
    return msg

say("hi")
# 输出：
# hi
# hi
# hi
```

它的等价转换是：

```python
def say(msg):
    print(msg)
    return msg
say = repeat(3)(say)
```

也就是说，`@repeat(3)` 做的是：先执行 `repeat(3)`——这会返回"真正的装饰器" `decorator`；再用 `decorator` 去装饰 `say`。因为多了一层"先吃参数、再吃函数"的嵌套，带参装饰器天然就需要三层 `def`。本篇只点到此，细节留给"带参装饰器"篇。

### 2.3 装饰器在函数定义时执行，不是函数调用时

这是初学者最容易误解的一点：装饰器里的代码，究竟在什么时候跑？

答案是：**在 `def` 语句执行时**——也就是模块被加载（import 或直接运行）的时候，而**不是**在每次调用被装饰函数的时候。

来看一个能直接验证时机的 demo：

```python
def register(func):
    print(f"[装饰执行] 正在装饰 {func.__name__}")
    def wrapper(*args, **kwargs):
        print(f"[调用执行] 正在调用 {func.__name__}")
        return func(*args, **kwargs)
    return wrapper

@register
def task_a():
    print("task_a 真正的函数体")

@register
def task_b():
    print("task_b 真正的函数体")

print("==== 模块定义完毕，下面才开始调用 ====")
task_a()
print("----")
task_b()
# 输出：
# [装饰执行] 正在装饰 task_a
# [装饰执行] 正在装饰 task_b
# ==== 模块定义完毕，下面才开始调用 ====
# [调用执行] 正在调用 task_a
# task_a 真正的函数体
# ----
# [调用执行] 正在调用 task_b
# task_b 真正的函数体
```

关键看输出顺序：

1. `[装饰执行]` 两行在模块定义阶段就打印了——此时 `task_a` / `task_b` 一次都还没被调用。
2. `==== 模块定义完毕 ====` 这行之后，才真正发生函数调用，打印 `[调用执行]` 和函数体内容。

也就是说，装饰器 `register` 函数体（外层函数）在 `def` 语句被解释器执行时立即运行了一次，而 `wrapper`（内层包装函数）则是在每次调用被装饰函数时才运行。

**这对理解装饰器意味着什么**

- 装饰动作只发生一次。模块加载时装饰器执行一次，返回的 wrapper 绑定到名字上，之后这个绑定就固定下来了。你再调用多少次被装饰函数，外层装饰器函数体都不会再跑。
- "每次调用都执行装饰器"是错误的心智模型。正确的是："每次调用执行的是 wrapper；装饰器只负责在定义时把 wrapper 造出来并替换名字绑定"。
- 因此装饰器里不要写"每次调用都要重新执行"的耗时逻辑——那应该写到 wrapper 里；装饰器外层只适合做一次性的准备工作（比如注册函数到某个表里）。

**再看一个"注册器"场景**

正因为在定义时就执行，装饰器天生适合做"注册"：把所有被装饰的函数收集到一个字典或列表里，自动建立一张"函数表"。

```python
HANDLERS = {}

def handler(path):
    """把被装饰函数注册到 HANDLERS 字典里，key 为 path。"""
    def decorator(func):
        HANDLERS[path] = func
        return func       # 注册完原样返回，不改函数行为
    return decorator

@handler("/home")
def home_page():
    return "首页"

@handler("/about")
def about_page():
    return "关于页"

# 模块加载后 HANDLERS 已经填好了，不需要手动登记
print(HANDLERS)
# 输出： {'/home': <function home_page at 0x...>, '/about': <function about_page at 0x...>}

print(HANDLERS["/about"]())
# 输出： 关于页
```

这个例子里装饰器只做"登记"——它原样返回原函数，不改它的行为。注册逻辑只在模块加载时执行一次，就把所有 handler 收集完毕。这正是"定义时执行"特性的典型应用。

### 2.4 装饰器返回的对象会替换原函数名绑定

前面反复出现了一句话："装饰器返回的对象替换原名字绑定"。这小节把它单独拎出来讲清楚，因为它决定了一切后续行为。

Python 中 `def name(): ...` 本质上做了两步：

1. 创建一个函数对象。
2. 把这个名字 `name` 绑定到这个函数对象（相当于一次赋值）。

`@decorator` 插在这两步之后又加了一步：

3. 调用 `decorator(name)`，把返回值重新绑定到 `name`。

所以被装饰之后，`name` 不再是最初 `def` 创建出来的那个函数对象了，而是装饰器的返回值。如果你在装饰器里返回的不是函数，而是一个整数、一个字符串，那 `name` 就会变成那个整数或字符串——调用它就会报错。

下面这个极端例子故意返回一个非 callable，来证实"替换绑定"这件事：

```python
def silly(func):
    # 不返回 wrapper，而是直接返回一个字符串
    return "我偷走了你的函数"

@silly
def important():
    print("我很重要")

print(important)        # 现在这个名字指向一个字符串
# 输出： 我偷走了你的函数

important()             # 字符串自然不可调用
# 输出（报错）：
# TypeError: 'str' object is not callable
```

这个 demo 看起来很无厘头，但它把"名字被重新绑定"这件事表现得很直白：装饰器返回什么，这个名字之后就指向什么。正常装饰器都会返回一个 callable（通常是 wrapper 函数），这样调用被装饰名字时才不会报错。

**两个名字同时存在的情形**

如果被装饰函数在装饰前被另一个名字引用过，会出现"装饰只影响新名字、旧名字不受影响"的现象。这个现象能帮我们进一步确认"替换的是名字绑定，不是原函数对象本身"：

```python
def emphasize(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs) + "!"
    return wrapper

def original():
    return "ok"

# alias 指向"装饰之前"的 original
alias = original

# 现在用 @ 装饰
@emphasize
def original():
    return "ok"

print(original())   # 走的是 wrapper：ok!
print(alias())      # 还是指向原来的 original：ok
# 输出：
# ok!
# ok
```

这个例子说明：`@emphasize` 只是把名字 `original` 重新指向了 `emphasize(...)` 的返回值；它没有"原地修改"原来的函数对象。原来的函数对象仍然存在，被 `alias` 引用着，行为不变。装饰器添加行为的方式是"返回一个新的包装函数"，而不是"改动原函数"——Python 的函数对象是不可原地改写的。

### 2.5 装饰器可以叠加：`@d1 @d2` = `d1(d2(f))`

多个装饰器可以叠在一个函数上方，执行顺序是"由下往上"应用、由上往下包裹。规则也是一句话：

> 紧挨着函数定义括号上面的装饰器最先生效，越往上的装饰器越后应用。

等价转换如下：

```python
@d1
@d2
def f():
    pass

# 等价于
def f():
    pass
f = d1(d2(f))
```

也就是说，`d2` 先作用在原始 `f` 上，得到 `d2(f)`；然后 `d1` 再作用在 `d2(f)` 上，得到 `d1(d2(f))`。最终名字 `f` 指向的是 `d1(d2(f))`。

下面用一个"加前缀/加后缀"的装饰器验证顺序：

```python
def add_prefix(func):
    def wrapper(*args, **kwargs):
        return "[前缀]" + func(*args, **kwargs)
    return wrapper

def add_suffix(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs) + "[后缀]"
    return wrapper

@add_prefix
@add_suffix
def make_text():
    return "正文"

print(make_text())
# 输出： [前缀]正文[后缀]
# 输出： [前缀]正文[后缀]
```

解析一下为什么是这个结果：

1. 先应用 `@add_suffix`：`make_text = add_suffix(make_text)`，得到一个 wrapper，调用时返回 `"正文" + "[后缀]"`。
2. 再应用 `@add_prefix`：`make_text = add_prefix(上面那个wrapper)`，得到一个新的 wrapper，调用时返回 `"[前缀]" + (上面那个wrapper 的返回值)`。
3. 最终调用时：`"[前缀]" + ("正文" + "[后缀]")` = `"[前缀]正文[后缀]"`。

如果把两个装饰器顺序对调：

```python
@add_suffix
@add_prefix
def make_text():
    return "正文"

print(make_text())
# 输出： [前缀]正文[后缀]
```

咦，怎么结果一样？其实不是同一回事。这次的结果是：先 `add_prefix` 得到 `"[前缀]正文"`，再 `add_suffix` 得到 `"[前缀]正文" + "[后缀]"` = `"[前缀]正文[后缀]"`。字符串拼接在这两个例子里恰好结果相同，但**调用链的嵌套结构不同**。我们换一个能让顺序差异显出来的例子：

```python
def tag_div(func):
    def wrapper(*args, **kwargs):
        return f"<div>{func(*args, **kwargs)}</div>"
    return wrapper

def tag_span(func):
    def wrapper(*args, **kwargs):
        return f"<span>{func(*args, **kwargs)}</span>"
    return wrapper

@tag_div
@tag_span
def content():
    return "x"

print(content())   # 先 span 再 div
# 输出： <div><span>x</span></div>

@tag_span
@tag_div
def content2():
    return "x"

print(content2())  # 先 div 再 span
# 输出： <span><div>x</div></span>
```

这下顺序差异就一目了然了：离函数最近的装饰器先包裹，离函数最远的装饰器最后包裹在外层。把多层装饰器在脑内展开成 `f = d1(d2(...dn(f)))`，顺序就不会搞错。

### 2.6 不带参装饰器 vs 带参装饰器：语法差异

到目前为止本篇讲的装饰器全是不带参的：`@decorator`，括号都没有。带参装饰器则是 `@decorator(args)`，带括号、带参数。这两种写法虽然看起来只差一对括号，但"括号在不在"决定了装饰器的结构。

- `@decorator`（不带括号）：`decorator` 本身就是装饰器，它直接接收被装饰函数。等价转换：`f = decorator(f)`。结构是两层：外层是装饰器、内层是 wrapper。
- `@decorator(args)`（带括号）：`decorator(args)` 先执行，返回"真正的装饰器"，那个装饰器再接收被装饰函数。等价转换：`f = decorator(args)(f)`。结构通常是三层：最外层接收参数、中间层是真正的装饰器、最内层是 wrapper。

对比 demo：

```python
# ---------- 不带参装饰器 ----------
def log_plain(func):
    def wrapper(*args, **kwargs):
        print("call", func.__name__)
        return func(*args, **kwargs)
    return wrapper

@log_plain
def f1():
    return 1

# 等价于：f1 = log_plain(f1)


# ---------- 带参装饰器 ----------
def log_with_level(level):
    def decorator(func):
        def wrapper(*args, **kwargs):
            print(f"[{level}] call", func.__name__)
            return func(*args, **kwargs)
        return wrapper
    return decorator

@log_with_level("INFO")
def f2():
    return 2

# 等价于：f2 = log_with_level("INFO")(f2)
```

判断依据很简单：**看 `@` 后面有没有括号**。有括号就是带参装饰器，需要多一层来"吃参数"；没括号就是不带参装饰器，两层就够。带参装饰器的完整实现细节、为什么必须三层、参数怎么传进 wrapper，留给"带参装饰器"篇展开。本篇只需要建立"两种语法对应不同嵌套层级"的印象。

### 2.7 装饰器能与什么搭配：日志、计时、缓存、权限、注册

装饰器在实际工程中最常见的用途，可以归纳成几类。这里给五个有真实场景感的 demo，每个都用最朴素的不带参或带参装饰器实现，先建立"装饰器能干什么"的直觉，具体工程化细节留给后续篇章。

**场景一：日志装饰器**

在每次函数调用前后自动记录日志，避免在每个函数里手写 `print`。

```python
def logCall(func):
    def wrapper(*args, **kwargs):
        print(f"[LOG] 开始 {func.__name__}(args={args}, kwargs={kwargs})")
        result = func(*args, **kwargs)
        print(f"[LOG] 结束 {func.__name__} -> {result}")
        return result
    return wrapper

@logCall
def transfer(from_acc, to_acc, amount):
    print(f"  从 {from_acc} 转 {amount} 元到 {to_acc}")
    return amount

transfer("A001", "B002", 500)
# 输出：
# [LOG] 开始 transfer(args=('A001', 'B002', 500), kwargs={})
#   从 A001 转 500 元到 B002
# [LOG] 结束 transfer -> 500
```

这里 wrapper 通过 `*args, **kwargs` 透传所有参数，保证装饰器对任意签名的函数都通用。

**场景二：计时装饰器**

测量函数执行耗时，常用于定位慢调用。

```python
import time

def timeit(func):
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"[TIME] {func.__name__} 耗时 {elapsed*1000:.2f} ms")
        return result
    return wrapper

@timeit
def build_report(rows):
    total = sum(r * r for r in rows)
    time.sleep(0.05)
    return total

print(build_report(range(1000)))
# 输出：
# [TIME] build_report 耗时 50.xx ms
# 332833500
```

**场景三：缓存装饰器（手写最简版）**

把函数的计算结果按参数缓存起来，相同参数的重复调用直接返回缓存值。

```python
def memoize(func):
    cache = {}
    def wrapper(*args):
        if args not in cache:
            cache[args] = func(*args)
        return cache[args]
    return wrapper

@memoize
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)

print(fib(35))   # 不加缓存要算很久，加了缓存几乎瞬时
# 输出： 9227465
```

注意这里 `fib` 递归调用的是 `fib` 这个名字——而这个名字已经被装饰器替换成了 `wrapper`，所以递归调用也会命中缓存。这就是"名字替换"机制的一个附带好处。

**场景四：权限校验装饰器**

在调用前检查当前用户是否有权限，没有就拒绝。

```python
CURRENT_USER = {"name": "guest", "role": "viewer"}   # 模拟当前登录用户

def require_admin(func):
    def wrapper(*args, **kwargs):
        if CURRENT_USER.get("role") != "admin":
            raise PermissionError(f"{CURRENT_USER['name']} 无权执行 {func.__name__}")
        return func(*args, **kwargs)
    return wrapper

@require_admin
def delete_database():
    print("数据库已清空")

# 当前是 viewer，调用会被拦
try:
    delete_database()
except PermissionError as e:
    print("拒绝：", e)
# 输出： 拒绝： guest 无权执行 delete_database

# 切换为 admin 再调用
CURRENT_USER["role"] = "admin"
delete_database()
# 输出： 数据库已清空
```

**场景五：注册器装饰器**

前面 2.3 已经给过一个路由注册器的例子。这里再给一个"插件注册"场景，强调"装饰器在定义时执行"带来的便利：

```python
PLUGINS = {}

def plugin(name):
    def decorator(func):
        PLUGINS[name] = func
        return func
    return decorator

@plugin("upper_all")
def upper_all(text):
    return text.upper()

@plugin("reverse")
def reverse(text):
    return text[::-1]

# 所有插件在模块加载时就自动登记好了
print(list(PLUGINS.keys()))
# 输出： ['upper_all', 'reverse']

def run_plugin(name, *args):
    return PLUGINS[name](*args)

print(run_plugin("upper_all", "hello"))
print(run_plugin("reverse", "hello"))
# 输出：
# HELLO
# olleh
```

这五类场景覆盖了装饰器最经典的应用：横切关注点（日志、计时）、性能优化（缓存）、访问控制（权限）、元编程式登记（注册）。它们的共同点是：**这些逻辑都和函数的"主营业务"无关，不应该写进函数体里**。装饰器把它们抽出来，让函数体保持纯粹。

### 2.8 装饰器与闭包的关系

到目前为止，你大概已经注意到：我们手写的每个装饰器里都有一个 `wrapper`，而 `wrapper` 里都用到了外层装饰器函数的 `func` 参数。这其实就是闭包。

闭包指的是：一个内层函数引用了外层函数的变量，并且在内层函数被返回后、即使外层函数已经返回，这个引用依然有效。在装饰器场景下：

- 外层函数是装饰器（`decorator(func)`），`func` 是它的参数。
- 内层函数是 `wrapper`，它引用了 `func`。
- 装饰器 `decorator` 执行完毕返回 `wrapper` 后，`wrapper` 仍然能访问 `func`。

也就是说，**装饰器几乎总是用闭包来实现的**，因为装饰器的核心需求就是："我要在原函数外面套一层逻辑，而这一层逻辑需要能调用到原函数"。能把"原函数"这个变量"带"到 wrapper 里的机制，就是闭包。

来看一个把闭包链条写得很清楚的 demo：

```python
def trace(func):
    # ---- 外层：装饰器 ----
    print(f"[trace] 生成 wrapper，将包装 {func.__name__}")
    def wrapper(*args, **kwargs):
        # ---- 内层：包装函数 ----
        # 这里引用的 func，是外层 trace 的参数，构成闭包
        print(f"[trace] 调用 {func.__name__}({args}, {kwargs})")
        return func(*args, **kwargs)
    return wrapper

@trace
def add(a, b):
    return a + b

# 模块加载阶段就会打印：[trace] 生成 wrapper，将包装 add
print(add(1, 2))
# 输出：
# [trace] 调用 add((1, 2), {})
# 3
```

`wrapper` 里的 `func` 是从外层 `trace` 作用域"捕获"的——这正是闭包。即使 `trace` 调用早就返回了，`wrapper` 还能继续访问 `func`，因为 Python 把 `func` 存在了 `wrapper` 的 `__closure__` 属性里（详见第 4 章原理）。

**闭包让 wrapper"记住"了被装饰函数**

这正是装饰器需要闭包的根本原因：装饰器要把"被装饰的原函数"这个变量保存下来，让 wrapper 在未来某次被调用时还能拿到它。没有闭包，wrapper 就拿不到 `func`，也就无法"在原函数外面包一层"。

当然，并非所有装饰器都必须用闭包——类装饰器可以用实例属性达到同样效果（后续篇章会讲）。但函数式装饰器，几乎一定是闭包。所以理解装饰器和理解闭包，是绑在一起的：

- 装饰器是"做什么"：接收函数、返回函数、替换名字。
- 闭包是"怎么做到的"：用作用域捕获机制，让 wrapper 能访问到 `func`。

### 2.9 `@decorator` 也能装饰类

虽然本系列主要关注函数装饰器，但要知道 `@decorator` 不只可以贴在 `def` 上方，也可以贴在 `class` 上方。装饰类时，装饰器接收的是一个类、返回的通常也是一个类（或一个改造过的类）。

简单看一眼：

```python
def add_repr(cls):
    """给类添加一个简单的 __repr__。"""
    def __repr__(self):
        keys = ", ".join(f"{k}={v!r}" for k, v in self.__dict__.items())
        return f"{cls.__name__}({keys})"
    cls.__repr__ = __repr__
    return cls

@add_repr
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

p = Point(3, 4)
print(p)
# 输出： Point(x=3, y=4)
```

这里 `add_repr(Point)` 接收类、给类挂上一个 `__repr__`、再把同一个类返回。应用 `@add_repr` 后，`Point` 这个名字仍然指向 `Point` 类，只是这个类被"原地"补了个方法。类装饰器的更多玩法（替换类、注册子类等）留给后续篇章，这里只建立"`@` 也能贴在 class 上"的认知。

## 3. 最佳实践

### 3.1 永远用 `functools.wraps` 保留原函数信息

这是装饰器最容易被忽略、又最容易埋雷的一点。前面 2.1 的例子里已经看到，装饰后 `hello.__name__` 变成了 `wrapper`。这不只是"名字变了"的问题——`__doc__`、`__module__`、`__wrapped__`、甚至参数签名都会跟着丢，调试时打印的堆栈、自动文档生成、基于反射的框架（如 FastAPI）都会受影响。

推荐写法：在 wrapper 上加 `@functools.wraps(func)`，让它把原函数的元信息复制过来。

```python
import functools

def good(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

@good
def hello():
    """ say hello """
    return "hi"

print(hello.__name__)    # hello（而不是 wrapper）
print(hello.__doc__)     #  say hello 
```

不推荐写法：不加 `wraps`，结果元信息全丢。

```python
def bad(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

@bad
def hello():
    """ say hello """
    return "hi"

print(hello.__name__)   # wrapper
print(hello.__doc__)    # None
```

本篇为了讲清楚"名字替换"这件事，前面的 demo 故意没加 `wraps`、好让 `__name__` 变化看得更清楚。但在真实工程代码里，**函数式装饰器的 wrapper 上一定要加 `@functools.wraps(func)`**。这一条的细节和原理，会在"functools.wraps"篇专门展开。

### 3.2 wrapper 用 `*args, **kwargs` 透传参数，除非有明确理由不这么做

装饰器能不能"通用地"装饰任意函数，关键在 wrapper 的签名。最通用的写法是：

```python
def wrapper(*args, **kwargs):
    return func(*args, **kwargs)
```

这样无论被装饰函数有几个位置参数、几个关键字参数，wrapper 都能原样透传。如果 wrapper 写成 `def wrapper(x):`，那它就只能装饰单参数函数，换个签名就崩。

只有当你需要"在 wrapper 里拿到某个具体参数做判断"时（比如权限装饰器里想看 user 参数），才考虑显式写出参数名，并且仍应尽量用 `*args, **kwargs` 兜底。例如：

```python
def wrapper(user, *args, **kwargs):
    if not user.is_admin:
        raise PermissionError
    return func(user, *args, **kwargs)
```

如果被装饰函数签名不匹配，这种"显式参数"写法会报错——所以要么用 `functools.wraps` 加签名保证，要么干脆只在 wrapper 里包 `*args, **kwargs`，再用 `inspect` 在内部取参数。通用优先，特殊时再收窄。

### 3.3 不要在装饰器外层写"每次调用都要跑"的逻辑

前面讲过：装饰器外层只在定义时执行一次，wrapper 在每次调用时执行。所以：

- 一次性的准备工作（建缓存字典、注册路由、读取配置）可以放在外层装饰器里，只跑一次。
- 每次调用都要做的逻辑（记日志、计时、取锁、校验）必须放在 wrapper 里。

把高频逻辑写在外层会导致它根本不会被执行；把一次性准备写进 wrapper 会导致它每次调用都重复执行（浪费、甚至有副作用，比如每次都新建一个 cache dict 就等于没有缓存）。

### 3.4 装饰器要有清晰的单一职责

一个装饰器最好只做一件事：只记日志、只计时、只校验权限。不要写一个"既记日志又计时又校验权限"的大装饰器——那会让被装饰函数很难维护，也难以按需组合。

正确做法是写多个小装饰器，然后叠加：

```python
@timeit
@logCall
@require_admin
def sensitive_action():
    ...
```

叠加顺序（由下往上应用、由上往下包裹）决定了 wrapper 的嵌套层次，可以按"最外层先做、最内层后做"来组织。比如把 `require_admin` 放在最内层（离函数最近），意味着权限校验在日志和计时之内执行——如果校验失败，就不会进入被装饰函数、也不会产生耗时统计。顺序设计要结合实际语义。

### 3.5 装饰器返回值要想清楚

wrapper 应不应该返回原函数的返回值？大多数场景答案是"应该"——装饰器只是加副作用，不该吞噬原函数的结果：

```python
def good(func):
    def wrapper(*args, **kwargs):
        print("before")
        result = func(*args, **kwargs)   # 先存起来
        print("after")
        return result                     # 再返回，不被 print 丢掉
    return wrapper
```

不推荐写法：直接 `return func(...)` 之外还忘了处理返回值，或者干脆不 return：

```python
def bad(func):
    def wrapper(*args, **kwargs):
        print("before")
        func(*args, **kwargs)    # 结果没接，wrapper 返回 None
        print("after")
    return wrapper
```

被 `bad` 装饰后，原函数的返回值会被吃掉，调用方拿到的是 `None`。这种 bug 很隐蔽，因为装饰器不影响函数"执行"，只影响"返回"。写装饰器时永远要问自己：原函数的返回值要不要传给调用方？要的话，必须 `return` 出去。

### 3.6 装饰器名字、文档要表达清楚意图

装饰器也是一个函数，给它起个能表达意图的名字（`logCall`、`timeit`、`require_admin`、`retry`）比叫 `deco`、`my_decorator` 要好得多。给装饰器写 docstring，说明它做了什么、是否改变返回值、是否吞掉异常、是否对参数有要求。调试别人写的装饰器时，最怕的就是没有文档、行为还反直觉（比如吞掉异常、改返回值）。

## 4. 原理

本篇是"装饰器深度剖析"的开篇，装饰器的原理是语言机制类知识点，这里必须讲透。本章把前面"是什么"层面用到的事实，下沉到"解释器怎么干的"这一层，把每个机制都说清楚。

### 4.1 `@` 语法糖的等价转换：`target = decorator(target)` 在字节码层面如何发生

我们前面反复说过 `@decorator` 等价于 `target = decorator(target)`。现在看看它在解释器里到底是怎么发生的。

Python 在编译一个模块时，遇到 `def name(): ...` 会生成一条 `MAKE_FUNCTION` 指令用来创建函数对象，再生成一条 `STORE_NAME` 指令把名字绑定到这个函数对象。当函数上方有 `@decorator` 时，编译器会在 `MAKE_FUNCTION` 和 `STORE_NAME` 之间插入两条指令：

1. `LOAD_NAME(decorator)`：把装饰器函数加载到栈上。
2. 不带参装饰器场景下，再发一条 `CALL_FUNCTION`（或 `CALL`）调用，把刚创建的函数对象作为参数传给装饰器，得到返回值。
3. `STORE_NAME(name)`：把"装饰器的返回值"绑定到名字 `name`，而不是绑定为原始函数对象。

也就是说，`@decorator` 并没有引入新的字节码指令族，它只是在 `MAKE_FUNCTION` 之后、`STORE_NAME` 之前，自动插入了一次装饰器调用，并让 `STORE_NAME` 绑定的是"调用结果"而不是"原始函数"。

用一段极简代码对照来看：

```python
def deco(func):
    return func

@deco
def f():
    pass
```

可以用 `dis` 直接看字节码（截取关键部分）：

```python
import dis

print(dis.code_info(f))  # 看 f 的字节码片段
```

更直观的是看模块顶层 `def f` 所在那段编译输出（下面是概念性描述，无需死记指令名）：

```
MAKE_FUNCTION              # 创建函数对象 f
LOAD_NAME    deco          # 把装饰器 deco 压栈
CALL_FUNCTION 1            # 用栈顶的 f 调用 deco，结果压栈
STORE_NAME   f             # 把"deco 调用结果"绑定到名字 f
```

如果没有 `@deco`，那么 `MAKE_FUNCTION` 之后直接就是 `STORE_NAME f`，中间不会插入 `LOAD_NAME deco` 和 `CALL_FUNCTION`。`@` 糖的全部魔法就是这一步插入。

**对"等价转换"的意义**

这意味着：`@decorator` 和 `f = decorator(f)` 是真正意义上、字节码层面的等价，不是某种"看起来像"的类比。你在任何地方看到 `@decorator`，都可以在脑内把它替换成"先 `def`，再 `f = decorator(f)`"，绝不会出错。带参装饰器同理，只是中间多了一次"先调用 `decorator(args)` 得到内层装饰器"。

### 4.2 执行时机：装饰器在 `def` 语句执行时运行，而非函数调用时

上一节说得很清楚：装饰器调用发生在 `MAKE_FUNCTION` 之后、`STORE_NAME` 之前。而 `def` 语句就是在模块被加载时逐条执行的——也就是说，装饰器是在"模块加载阶段"就执行了，不是等到你调用 `f()` 时才执行。

这就解释了前面 2.3 的奇怪现象：我们把 `print` 写在装饰器外层，结果在"函数定义阶段"就打印了，调用函数时反而不会再打印。因为装饰器外层在那一次 `def` 执行时就已经跑完返回了，之后再调用 `f()` 进入的是 `wrapper`，外层装饰器函数体根本不会再被执行。

```python
def deco(func):
    print(f"deco 执行，正在装饰 {func.__name__}")  # 这行在 def 时执行
    def wrapper(*a, **k):
        print("wrapper 执行")                     # 这行在每次调用 f 时执行
        return func(*a, **k)
    return wrapper

@deco
def f():
    pass

# 到这里，"deco 执行..." 已经打印过了
# 但 "wrapper 执行" 还没有，因为 f 一次都没调用

f()   # 现在才打印 "wrapper 执行"
```

把"外层只在定义时跑一次、wrapper 每次调用都跑"这个心智模型建好，后续理解 `functools.lru_cache`、路由注册、插件登记之类的用法都不会困惑。

### 4.3 名字替换的机制：`STORE_NAME` 绑定的是装饰器返回值

"装饰器返回的对象替换原函数名绑定"这件事，本质就是上一节说的 `STORE_NAME` 绑定的是"装饰器调用的返回值"而不是"原始函数对象"。这里把它的来龙去脉再讲细一点。

Python 的名字绑定（赋值、`def`、`import`、`class`、`for` 循环变量等）都是把一个名字指向一个对象。`def f(): ...` 相当于"先创建函数对象，再把 `f` 绑定到它"。加上 `@deco` 后，解释器先创建函数对象（我们叫它 `F0`），然后调用 `deco(F0)` 得到一个返回值 `R`，最后执行 `STORE_NAME f` 将 `f` 绑定到 `R`（而不是 `F0`）。

`F0` 这个对象本身并没有被销毁、也没有被修改——它只是"不再被名字 `f` 指向"了。如果在此之前有别的名字指向 `F0`（比如前面的 `alias = original`），那 `F0` 依旧存活，可以通过那个别名访问到。

这也是为什么前面 2.4 的demo 里 `alias()` 仍然返回 "ok"：`alias` 指向的是 `F0`（未装饰的原函数），而 `original` 这个名字 被 `@emphasize` 重新绑定到了 `wrapper` 上。Python 没有"原地改函数对象行为"的机制，装饰器添加行为靠的是"换一个名字指向"。

如果装饰器返回的是 `F0` 本身（比如前面 `handler` 注册器里的 `return func`），那么名字 `f` 依旧指向原函数，只是顺带在装饰器外层做了点注册之类的副作用。这种"返回原函数"的装饰器不会改变函数行为，只用来做元编程式登记。

### 4.4 多层装饰器的嵌套结合顺序：`d1(d2(f))` 的形成

多层装饰器的顺序规则，同样可以从 `MAKE_FUNCTION` + `CALL` 的角度来理解。设有：

```python
@d1
@d2
def f():
    pass
```

编译器处理时，从下往上扫描装饰器，生成的等价指令可以概念性写成：

```
MAKE_FUNCTION                    # 创建 F0
# 处理离 f 最近的 @d2
LOAD_NAME d2; CALL F0            # R1 = d2(F0)
# 处理 @d1
LOAD_NAME d1; CALL R1            # R2 = d1(R1) = d1(d2(F0))
STORE_NAME f                     # f = R2 = d1(d2(F0))
```

这就是为什么结果是 `f = d1(d2(f))`：**离函数定义越近的装饰器越先应用，越远的越在外层包裹**。

从调用视角看，调用 `f()` 最终进入的是 `d1` 返回的 wrapper（最外层）；它在内部调用 `d2` 的 wrapper；`d2` 的 wrapper 再调用原始 `F0`。所以执行顺序是"从外到内"穿过 `d1 → d2 → F0`，返回时则反过来。

记忆口诀：**装饰器应用顺序从下往上，调用时执行顺序从外到内**。这两个顺序看起来"相反"，其实是一回事——后应用的装饰器自然在最外层，所以被最先执行。

### 4.5 为什么装饰器几乎都用闭包实现：wrapper 需要引用被装饰函数

前面 2.8 已经把装饰器和闭包的关系点出来了。这里从原理上说明为什么"非闭包不可"。

函数式装饰器的需求是：返回一个 `wrapper` 函数，它在未来被调用时能"调用到被装饰的原函数"。但 `wrapper` 是在装饰器函数体里定义、并被 return 出去的——一旦装饰器函数返回，它的局部作用域就"消失了"（至少形式上如此）。那 `wrapper` 凭什么还能访问 `func`？

答案就是闭包。Python 规定：当一个内层函数引用了外层函数的局部变量时，解释器会把那个变量打包进内层函数的 `__closure__` 属性——这是一个元组，每个元素是一个 cell 对象，cell 里的 `cell_contents` 就是那个被捕获的变量值。即使外层函数已经返回，cell 依然持有这个值，内层函数通过 `__closure__` 访问它。

可以用这个 demo 直接观察到 `__closure__` 的存在：

```python
def deco(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

@deco
def f():
    return 42

# f 现在指向 wrapper，看看它的闭包
print(f.__closure__)               # 一个 cell 元组
print(f.__closure__[0].cell_contents)   # 被装饰的原函数 F0
# 输出（cell_contents 指向原函数）：
# (<cell at 0x...: function object at 0x...>,)
# <function f at 0x...>
```

`f.__closure__[0].cell_contents` 就是装饰器的 `func` 参数——即原始的、未被装饰的那个 `f` 函数对象。wrapper 之所以能调用原函数，就是通过这个 cell 找到的。

如果不用闭包（比如直接用全局变量保存 `func`），也能跑，但会污染全局命名空间、且不支持多个被装饰函数同时存在（后一个会覆盖前一个的 `func`）。闭包天然给每个 wrapper 独立保存一份 `func`，所以函数式装饰器几乎一律用闭包。

**类装饰器为什么可以不用闭包**

顺带说一下类装饰器为什么可以"绕开"闭包：类装饰器通常返回一个新类，把被装饰函数存成实例属性或类属性。属性访问走的是对象的 `__dict__`，而不是作用域捕获，所以不需要闭包也能让"包装层"拿到原函数。这给出了一个有趣的对照：函数式装饰器靠闭包"记住"原函数，类装饰器靠属性"持有"原函数，两条路殊途同归。类装饰器的细节留给后续篇章。

### 4.6 `MAKE_FUNCTION`、`STORE_NAME` 与装饰器调用的协作全过程

把前面几节拼起来，给一个完整的"装饰器从源码到运行"的原理链条，作为本章收束。

以这段代码为例：

```python
def show(func):
    def wrapper(*a, **k):
        print("call", func.__name__)
        return func(*a, **k)
    return wrapper

@show
def greet(name):
    print(f"hi, {name}")
```

从源码到运行，发生的事情依次是：

1. **模块加载**：解释器逐条执行模块顶层语句。
2. **`def show`**：创建 `show` 函数对象，`STORE_NAME show` 把 `show` 绑定到它。
3. **遇到 `@show` + `def greet`**：编译器发现 `@show`，按"先 `def`、再调用 `show`、最后 `STORE_NAME`"的顺序生成指令。
4. **`MAKE_FUNCTION greet`**：创建原始函数对象 `G0`（对应源码里的 `greet` 函数体）。
5. **`LOAD_NAME show`**：把 `show` 函数对象压栈。
6. **调用 `show(G0)`**：进入 `show` 函数体，执行其中的 `def wrapper`，创建 wrapper 函数对象 `W`；wrapper 的 `__closure__` 捕获了 `func=G0`。`show` 返回 `W`。
7. **`STORE_NAME greet`**：把名字 `greet` 绑定到 `W`（而不是 `G0`）。`G0` 仍然存在，被 `W.__closure__[0]` 持有，但不再被名字 `greet` 直接指向。
8. **此后调用 `greet("老王")`**：实际调用的是 `W("老王")`，进入 wrapper 函数体，打印 `"call greet"`，再通过 `__closure__` 拿到 `G0` 执行 `G0("老王")`，打印 `"hi, 老王"`。

这套机制有几个值得强调的特征：

- 装饰器 `show` 只执行一次（第 6 步），发生在模块加载阶段。
- 每次调用 `greet("老王")` 执行的都是 `W`，`W` 内部每次都会调用 `G0`。
- `G0` 的"存活"全靠 `W.__closure__` 这个 cell 持有它；如果没有这个引用，`G0` 就会被垃圾回收。
- 名字 `greet` 与 `G0` 之间已经没有直接绑定关系了，只有通过 `W.__closure__[0].cell_contents` 才能"找回"原函数。

把这套原理映射到脑中，再看任何装饰器：你都能说清楚"哪段代码在什么时候跑、谁持有谁、名字指向谁"。这就是"理解装饰器本质"的全部。

### 4.7 带参装饰器为什么要多一层：预告

顺带从原理角度点一下带参装饰器为什么是三层。带参装饰器 `@deco(args)` 的等价转换是 `f = deco(args)(f)`，也就是"先调用 `deco(args)` 得到真正的装饰器，再用它装饰 `f`"。

从指令层面看，和不带参装饰器相比，多了一步"先调用 `deco(args)`"——这次调用会返回一个内层装饰器，然后再用那个内层装饰器走一遍 `MAKE_FUNCTION → CALL → STORE_NAME` 的流程。

为了在结构上支持这两次调用（外层吃参数、内层吃函数），带参装饰器通常得写成三层 `def`：最外层函数接收参数、返回"真正的装饰器"（也就是第二层）；第二层接收被装饰函数、返回 wrapper（第三层）。具体实现和 `wraps` 怎么放，留给"带参装饰器"篇详述。

## 5. 总结

### 5.1 本文内容要点

- 装饰器本质是"接收函数、返回函数"的高阶函数。它接收一个函数（或类）、返回一个新对象，并用这个新对象替换原本的名字绑定。
- `@decorator` 是语法糖，等价于 `target = decorator(target)`。带参形式 `@decorator(args)` 等价于 `target = decorator(args)(target)`。`
- 装饰器在 `def` 语句执行时（即模块加载 / import 时）就执行一次，而非每次调用被装饰函数时执行。每次调用执行的是 wrapper，不是装饰器外层。
- 装饰器返回的对象会替换原函数名绑定，原函数对象本身不被修改、不被销毁，可能被闭包或别名持有。
- 多层装饰器按"从下往上应用、从外到内调用"的顺序组合，等价于 `d1(d2(...dn(f)))`。
- 不带参装饰器是两层结构（装饰器 + wrapper）；带参装饰器是三层结构（吃参数 + 装饰器 + wrapper），因为多了一次"先吃参数"的调用。
- 装饰器常见用途：日志、计时、缓存、权限校验、注册器——这些都属于"与函数主营业务无关的横切关注点"。
- 装饰器与闭包密不可分：函数式装饰器几乎总是用闭包实现，因为 wrapper 需要在装饰器返回后依然能引用到被装饰的原函数，这个"记得原函数"的能力由 `__closure__` 提供。
- `@decorator` 也能装饰类：装饰器接收类、返回改造后的类。本篇只建立这个认知，细节留给后续。
- 原理层面：`@decorator` 在字节码里就是 `MAKE_FUNCTION` 之后、`STORE_NAME` 之前插入一次装饰器调用；多层装饰器是多次 `CALL` 的嵌套；闭包通过 cell 对象在 `__closure__` 中持有被装饰函数。

### 5.2 读完本文你应能掌握

- 用一句话说清"装饰器是什么"：接收函数、返回函数的高阶函数。
- 把任何 `@decorator` 在脑内手动展开成 `target = decorator(target)`，把 `@decorator(args)` 展开成 `target = decorator(args)(target)`。
- 说出装饰器外层与 wrapper 各自的执行时机：外层只在定义时执行一次，wrapper 在每次调用时执行。
- 解释"装饰后被装饰名字指向谁"：指向装饰器返回的对象；原函数对象被闭包或别名持有而未被修改。
- 判定多层装饰器的应用顺序和调用顺序，正确给出 `d1(d2(f))` 形式的等价转换。
- 区分不带参装饰器（两层 `def`）和带参装饰器（三层 `def`）的结构差异，并说明为什么带参要多一层。
- 手写一个最简的日志 / 计时 / 缓存 / 权限 / 注册装饰器，并知道各自的典型应用场景。
- 从 `__closure__` 角度说明"wrapper 凭什么能访问到被装饰函数"。
- 从 `MAKE_FUNCTION` / `CALL` / `STORE_NAME` 的角度，描述 `@decorator` 在解释器里到底做了什么。