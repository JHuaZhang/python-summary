---
group:
  title: 【14】装饰器深度剖析
  order: 14
order: 3
title: 装饰器执行顺序
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是装饰器执行顺序问题

当我们在一个函数上方只叠放一个装饰器时，执行顺序是清楚的：装饰器外层函数在定义时运行一次，返回的 `wrapper` 在调用时运行。但当我们把多个装饰器叠放在同一个函数上方，比如：

```python
@d1
@d2
@d3
def func():
    ...
```

此时就会产生两个完全不同维度的顺序问题：

- **装饰时（定义/模块加载时）顺序**：`d1`、`d2`、`d3` 这三个装饰器的外层函数，谁先被调用？谁后被调用？最终 `func` 这个名字绑定到谁返回的 `wrapper` 上？
- **调用时（`func()` 被执行时）顺序**：当我们写下 `func()` 时，三层的 `wrapper` 与原始 `func` 的执行先后是怎样的？前置逻辑和后置逻辑各按什么次序出现？

这两个顺序不是同一件事，甚至方向相反。把这两者混为一谈，是学习多重装饰器时最常见误区。本篇的核心目标，就是把这两个时机彻底拆开，让你在任何叠加层数下都能准确预判"谁先谁后"。

### 1.2 基本语法与最小示例

多重装饰器的语法就是把多个 `@decorator` 从函数定义处往上依次书写，离函数定义最近的装饰器写在最下面：

```python
@d1   # 离 func 最远
@d2
@d3   # 离 func 最近
def func():
    print("func")
```

这段代码在 Python 解释器看来，等价于：

```python
def func():
    print("func")

func = d1(d2(d3(func)))
```

也就是说，`@` 语法糖会被展开成一层层函数调用：最靠近 `func` 的 `d3` 最先被调用，离 `func` 最远的 `d1` 最后被调用，最终 `func` 这个名字重新绑定到 `d1` 返回的那个 `wrapper` 上。

为了直观看到这个顺序，我们用一个会"自报家门"的装饰器来做最小演示：

```python
def make_tag(name):
    """返回一个装饰器，装饰时打印自己的名字。"""
    def decorator(func):
        print(f"[装饰时] {name} 正在装饰 {func.__name__}")
        def wrapper(*args, **kwargs):
            print(f"[调用时] 进入 {name} 的前置逻辑")
            result = func(*args, **kwargs)
            print(f"[调用时] 离开 {name} 的后置逻辑")
            return result
        return wrapper
    return decorator


@make_tag("d1")
@make_tag("d2")
@make_tag("d3")
def greet():
    print("Hello!")
```

运行这段定义代码（此时 `greet` 尚未被调用），输出如下：

```
# 输出：
# [装饰时] d3 正在装饰 greet
# [装饰时] d2 正在装饰 greet
# [装饰时] d1 正在装饰 greet
```

可以看到：装饰时的顺序是 `d3 → d2 → d1`，也就是**自下而上**。而当我们真正调用 `greet()` 时：

```python
greet()
```

```
# 输出：
# [调用时] 进入 d1 的前置逻辑
# [调用时] 进入 d2 的前置逻辑
# [调用时] 进入 d3 的前置逻辑
# Hello!
# [调用时] 离开 d3 的后置逻辑
# [调用时] 离开 d2 的后置逻辑
# [调用时] 离开 d1 的后置逻辑
```

调用时的顺序变成了 `d1 → d2 → d3 → func → d3 → d2 → d1`，也就是**自外向内再自内向外**，前后对称。这两种顺序看起来"相反"，但其实是同一个套娃结构在两个不同时机下的自然表现。本篇后续会把这个结构彻底讲透。

## 2. 核心内容

### 2.1 装饰时顺序：自下而上的"包裹"过程

装饰时（decoration time）指的是 Python 执行到 `def` 语句、把函数对象创建出来之后，立刻应用上方那一串 `@decorator` 的时刻。这个时刻发生在模块加载阶段，无论你之后是否真正调用这个函数，装饰过程都会发生。

理解装饰时顺序的关键，是记住 `@decorator` 只是一个语法糖，它等价于：

```python
func = decorator(func)
```

当有多个装饰器叠放时，Python 的展开规则是：**从离函数最近的那个装饰器开始，逐层向外展开**。即：

```python
@d1
@d2
@d3
def func():
    ...
```

被展开成：

```python
func = d1(d2(d3(func)))
```

这是一个嵌套的函数调用表达式。根据 Python 求值嵌套调用的规则，**内层括号先求值**：

1. 先求 `d3(func)`：`d3` 拿到原始 `func`，返回 `wrapper3`。
2. 再求 `d2(d3(func))` → 即 `d2(wrapper3)`：`d2` 拿到 `wrapper3`，返回 `wrapper2`。
3. 最后求 `d1(d2(d3(func)))` → 即 `d1(wrapper2)`：`d1` 拿到 `wrapper2`，返回 `wrapper1`。
4. 最终 `func` 这个名字重新绑定到 `wrapper1`。

所以装饰时的执行顺序是 `d3 → d2 → d1`，离函数最近的 `d3` 最先执行，离函数最远的 `d1` 最后执行。整个过程可以用一个比喻来理解：`d3` 是最内层的盒子，先把 `func` 装进去；`d2` 套在 `d3` 外面；`d1` 套在最外面。这就是"自下而上包裹"的含义。

**装饰时顺序的实证**

我们用一个带编号的装饰器来实证，每层装饰器被调用时都立即打印一行：

```python
def trace_deco(layer):
    def decorator(func):
        print(f"装饰时：{layer} 接收到 {func.__name__}，开始包装")
        def wrapper(*args, **kwargs):
            print(f"调用时：{layer} 前置")
            ret = func(*args, **kwargs)
            print(f"调用时：{layer} 后置")
            return ret
        print(f"装饰时：{layer} 产生了 wrapper（id={id(wrapper) % 1000}）")
        return wrapper
    return decorator


@trace_deco("外层-A")
@trace_deco("中层-B")
@trace_deco("内层-C")
def task():
    print("执行 task 本体")

print("=== 定义阶段结束 ===")
```

```
# 输出：
# 装饰时：内层-C 接收到 task，开始包装
# 装饰时：内层-C 产生了 wrapper（id=576）
# 装饰时：中层-B 接收到 wrapper，开始包装    ← 注意：B 收到的 func 已是 C 的 wrapper
# 装饰时：中层-B 产生了 wrapper（id=448）
# 装饰时：外层-A 接收到 wrapper，开始包装    ← A 收到的是 B 的 wrapper
# 装饰时：外层-A 产生了 wrapper（id=320）
# === 定义阶段结束 ===
```

这个输出非常关键，它揭示了两个事实：

1. 装饰顺序确实是 `内层-C → 中层-B → 外层-A`，自下而上。
2. 每一层装饰器收到的 `func` 参数，都不是原始的 `task`，而是内层装饰器已经返回的 `wrapper`。也就是说，`B` 包装的是 `C` 的 `wrapper`，`A` 包装的是 `B` 的 `wrapper`。这正是嵌套结构的来源。

**为什么"离函数最近"的先执行**

很多人会困惑：为什么写在最上面的 `d1` 不是最先执行的？答案是，`@` 语法糖的展开规则决定了这一点。你可以把多个 `@` 想象成依次从下往上"贴"到函数上：每次贴一个，就用这个装饰器把当前的名字内容包装一次，再把包装后的结果交回给这个名字。最后贴的那个（写在最上面的 `d1`）自然就是最外层。

一个更直白的验证方式是手动模拟整个展开过程：

```python
def deco(name):
    def decorator(func):
        def wrapper(*a, **kw):
            print(f"  <- {name} 前置")
            r = func(*a, **kw)
            print(f"  -> {name} 后置")
            return r
        return wrapper
    return decorator

def original():
    print("original")

# 手动模拟 @deco("x") @deco("y") @deco("z")
step1 = deco("z")(original)       # 最内层 z 先装饰
step2 = deco("y")(step1)          # y 装饰 z 的结果
step3 = deco("x")(step2)          # x 最后装饰
manual = step3

@deco("x")
@deco("y")
@deco("z")
def syntactic():
    print("syntactic")

print("调用手动模拟版本：")
manual()
print("调用语法糖版本：")
syntactic()
```

```
# 输出：
# 调用手动模拟版本：
#   <- x 前置
#   <- y 前置
#   <- z 前置
#   original
#   -> z 后置
#   -> y 后置
#   -> x 后置
# 调用语法糖版本：
#   <- x 前置
#   <- y 前置
#   <- z 前置
#   syntactic
#   -> z 后置
#   -> y 后置
#   -> x 后置
```

手动模拟和语法糖版本的调用结果完全一致，证明 `@d1 @d2 @d3` 确实等价于 `d1(d2(d3(func)))`，装饰时自下而上的结论成立。

**装饰时只发生一次**

需要强调的是，装饰这个过程在函数定义时就**立刻完成，且只发生一次**。即使你之后调用 `task()` 一万次，`trace_deco` 的外层函数和 `decorator` 函数也都不会再运行，真正反复运行的是它们产生的 `wrapper`。请看下面的对比：

```python
# 假设上面的定义已经存在
print("第一次调用 task()")
task()
print("第二次调用 task()")
task()
```

```
# 输出：
# 第一次调用 task()
# 调用时：外层-A 前置
# 调用时：中层-B 前置
# 调用时：内层-C 前置
# 执行 task 本体
# 调用时：内层-C 后置
# 调用时：中层-B 后置
# 调用时：外层-A 后置
# 第二次调用 task()
# ...（与第一次完全相同的调用时输出）
```

注意：在两次调用之间，没有再出现"装饰时"的打印行。这佐证了装饰是定义阶段的一次性动作，而调用是反复发生的行为。理解"外层装饰器函数只跑一次，wrapper 反复跑"这一点，对后面看懂调用时顺序至关重要。

### 2.2 调用时顺序：洋葱模型的对称嵌套

装饰时决定的是"谁包装谁"，也就是最终形成的嵌套结构。调用时顺序，则是指当你调用最外层的名字 `func()` 时，这个嵌套结构是如何被一层层剥开又一层层合上的。

**洋葱模型**

把多层装饰器叠加后的函数想象成一个洋葱：最外层是 `d1` 的 `wrapper`，往里是 `d2` 的 `wrapper`，再往里是 `d3` 的 `wrapper`，最核心才是原始 `func`。调用 `func()` 时，控制流从外向内逐层穿过每一层的"前置逻辑"，到达核心执行 `func` 本体，再从内向外逐层穿过每一层的"后置逻辑"。每一层的前置和后置是对称出现的，就像洋葱的内外两层皮。

一个典型的 `wrapper` 长这样：

```python
def wrapper(*args, **kwargs):
    # 前置逻辑：进入这一层时执行
    print("前置")
    result = func(*args, **kwargs)  # ← 回调点：把控制权交给内层
    # 后置逻辑：内层返回后执行
    print("后置")
    return result
```

这里的关键是 `result = func(*args, **kwargs)` 这一行。在多层嵌套中，`func` 指向的是内层装饰器的 `wrapper`，所以这一行实际是"调用更内层的 wrapper"。当前层的前置逻辑跑完后，控制权才交到内层；内层全部跑完返回后，当前层才继续执行后置逻辑。这就是为什么每一层都是"前置 → 内层 → 后置"的对称结构。

**调用时顺序的实证**

我们用具象的"请求处理"场景来实证：一个 Web 请求依次穿过 `auth`（鉴权）、`log`（日志）、`cache`（缓存）三层装饰器，最后到达真正的业务函数。每一层在进入和退出时都打印一行。

```python
import time


def auth(func):
    """最外层：鉴权。"""
    def wrapper(*args, **kwargs):
        print("[auth] 检查用户登录状态...")
        # 这里假装做鉴权，实际只是打印
        result = func(*args, **kwargs)
        print("[auth] 鉴权层收尾（记录登录后行为）")
        return result
    return wrapper


def log(func):
    """中间层：日志。"""
    def wrapper(*args, **kwargs):
        print("[log] 记录请求开始时间")
        result = func(*args, **kwargs)
        print("[log] 记录请求结束并写入日志文件")
        return result
    return wrapper


def cache(func):
    """最内层：缓存。"""
    def wrapper(*args, **kwargs):
        print("[cache] 查看缓存是否命中")
        result = func(*args, **kwargs)
        print("[cache] 把结果写入缓存")
        return result
    return wrapper


@auth       # 离业务函数最远 → 最外层
@log        # 中间层
@cache      # 离业务函数最近 → 最内层
def handle_request(path):
    """真正的业务函数。"""
    print(f"[业务] 处理请求：{path}")
    return "OK"


print("=== 调用 handle_request('/api/user') ===")
ret = handle_request("/api/user")
print(f"返回值：{ret}")
```

```
# 输出：
# === 调用 handle_request('/api/user') ===
# [auth] 检查用户登录状态...
# [log] 记录请求开始时间
# [cache] 查看缓存是否命中
# [业务] 处理请求：/api/user
# [cache] 把结果写入缓存
# [log] 记录请求结束并写入日志文件
# [auth] 鉴权层收尾（记录登录后行为）
# 返回值：OK
```

把输出和三层装饰器的位置对照一下：

| 阶段 | 执行内容 | 对应装饰器位置 |
| --- | --- | --- |
| 进入 | `[auth]` 前置 | 最外层（离 func 最远） |
| 进入 | `[log]` 前置 | 中间层 |
| 进入 | `[cache]` 前置 | 最内层（离 func 最近） |
| 核心 | `[业务]` 执行 | 原始 `handle_request` |
| 退出 | `[cache]` 后置 | 最内层 |
| 退出 | `[log]` 后置 | 中间层 |
| 退出 | `[auth]` 后置 | 最外层 |

可以清楚看到：调用时进入顺序是"由外向内"（`auth → log → cache`），退出顺序是"由内向外"（`cache → log → auth`），整体呈对称的洋葱形状。这与装饰时的"由内向外"（`cache → log → auth`）方向正好相反，但两者描述的是不同时机发生的事，并不矛盾。

**用缩进可视化洋葱结构**

为了把这个洋葱结构看得更清楚，我们再加一个带缩进的装饰器，让每一层在打印时根据自己的深度缩进，这样输出的形状本身就是洋葱的剖面图：

```python
def onion(name, depth):
    """depth 用于控制缩进，让输出可视化洋葱结构。"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            pad = "  " * depth
            print(f"{pad}▼ {name} 前置")
            result = func(*args, **kwargs)
            print(f"{pad}▲ {name} 后置")
            return result
        return wrapper
    return decorator


@onion("L1 最外层", 0)
@onion("L2 中间层", 1)
@onion("L3 内层", 2)
@onion("L4 最内层", 3)
def core():
    print("    ★ 核心：真正的业务函数")


print("调用 core()：")
core()
```

```
# 输出：
# 调用 core()：
# ▼ L1 最外层 前置
#   ▼ L2 中间层 前置
#     ▼ L3 内层 前置
#       ▼ L4 最内层 前置
#         ★ 核心：真正的业务函数
#       ▲ L4 最内层 后置
#     ▲ L3 内层 后置
#   ▲ L2 中间层 后置
# ▲ L1 最外层 后置
```

输出的形状就像一个被竖着切开的洋葱：四个"▼ 前置"从外向内收敛到核心，再从核心向外发散出四个"▲ 后置"，前后两层严格对称。这就是多层装饰器在调用时的标准形状——任何符合规范写法的多层装饰器，调用时都会呈现这种"前-内-后"的对称嵌套结构。

**回调点是洋葱对称的根源**

为什么每一层的前置和后置会对称出现？根源在于 `wrapper` 内部那行 `result = func(*args, **kwargs)`。这行代码是一个"回调点"：当前层的前置逻辑在它之前，后置逻辑在它之后；这行代码本身会触发更内一层 `wrapper` 的执行，内层同样有自己的前置、回调、后置。于是整个调用过程在回调点的串联下，自然形成"外层前置 → 内层前置 → ... → 核心 → ... → 内层后置 → 外层后置"的对称链。

如果我们故意把某一层的 `func(*args, **kwargs)` 去掉，洋葱就会被打断。例如，让中间层不调用 `func`，直接返回一个固定值：

```python
def outer(func):
    def wrapper(*args, **kwargs):
        print("outer 前置")
        r = func(*args, **kwargs)
        print("outer 后置")
        return r
    return wrapper

def middle(func):
    def wrapper(*args, **kwargs):
        print("middle 前置")
        # 故意不调用 func，直接返回
        print("middle 短路返回")
        return "middle-fixed"
    return wrapper

def inner(func):
    def wrapper(*args, **kwargs):
        print("inner 前置")
        r = func(*args, **kwargs)
        print("inner 后置")
        return r
    return wrapper

@outer
@middle
@inner
def business():
    print("business 本体")
    return "business-done"

print(business())
```

```
# 输出：
# outer 前置
# middle 前置
# middle 短路返回
# outer 后置
# business-done-or-middle-fixed
```

（实际返回值是 `"middle-fixed"`。）可以看到，因为 `middle` 没有调用 `func`，所以 `inner` 和 `business` 完全没有被执行，洋葱在 `middle` 这一层就被截断了，`inner 前置/后置`、`business 本体` 全部缺席。这反过来说明：洋葱的对称性依赖于每一层都老老实实地在回调点调用内层。这也提示我们一个实践要点——**装饰器的 wrapper 必须调用内层 func，否则会破坏其他装饰器的预期行为**。

### 2.3 两个顺序的对照与常见误区

理解多重装饰器的最大障碍，是把"装饰时顺序"和"调用时顺序"混淆。它们看起来方向相反，但实际上是同一套嵌套结构在两个不同时刻的表现。下面用一个对照表把两者并排放在一起，便于记忆：

| 维度 | 装饰时（定义阶段） | 调用时（func() 时） |
| --- | --- | --- |
| 触发时机 | `def` 语句执行后立刻发生，模块加载时一次完成 | 每次写 `func()` 时发生，可反复 |
| 执行对象 | 装饰器的外层函数（`decorator`） | 各层 wrapper 内部逻辑 |
| 执行方向 | 自下而上：`d3 → d2 → d1`（离 func 最近的先跑） | 自外向内再向外：`d1 前 → d2 前 → d3 前 → func → d3 后 → d2 后 → d1 后` |
| 等价表达 | `func = d1(d2(d3(func)))` | `wrapper1 → wrapper2 → wrapper3 → func → ...` 回调返回 |
| 发生次数 | 每个装饰器外层函数各一次，共 3 次 | 三个 wrapper 加 func 各一次，每次调用都重复 |

**误区一：认为装饰时顺序就是调用时顺序**

这是最常见的错误。有人看到 `@d1 @d2 @d3` 从上到下排，就以为调用时也按 `d1 → d2 → d3` 执行前置逻辑——这部分恰好是对的（因为调用时确实是 `d1` 的 wrapper 先跑）。但如果因此推断"装饰时也是 `d1` 先跑"，就错了：装饰时最先跑的是 `d3`，因为它在最内层括号里。记住一个口诀：**装饰时"离函数近的先跑"，调用时"离函数远的前置先跑"**。

**误区二：把"谁先被装饰"等同于"谁在前"**

`d3` 最先被装饰，并不意味着它在前。`d3` 最先被装饰，意味着它最先拿到原始 `func` 并把它包起来，因此它成为最内层；调用时它的前置逻辑是最后才被触发的（因为要先穿过 `d1`、`d2` 才能到达它）。换句话说，"装饰得最早"的装饰器，在调用时反而"前置触发最晚"——这看起来反直觉，但只要画出洋葱就一目了然。

**误区三：以为调用时后置会"跳过"某些层**

有人以为后置逻辑只跑最内层或最外层，其实不是。只要每一层都在回调点之后写了后置代码，那么从内向外逐层返回时，每一层的后置都会被触发，顺序与进入时的前置严格相反。不会跳层，也不会乱序。

**误区四：混淆装饰器外层函数与 wrapper 的执行次数**

`d1`、`d2`、`d3` 这三个外层函数只在装饰时各跑一次，之后再也不跑；真正的"每次调用"跑的是它们产生的 `wrapper`。如果你在装饰器的外层函数里写了"每次调用都要做的事"，那它只会发生在模块加载时一次，而不是每次调用时。这是一个非常隐蔽的 bug 来源。

下面这个 demo 专门制造这种错误来提醒你：

```python
def buggy_counter(func):
    # 错误：把计数器放在外层函数里
    count = 0
    print(f"[装饰时] count 初始化为 {count}")   # 只在装饰时跑一次
    def wrapper(*args, **kwargs):
        # count 来自闭包，这里没有改 count
        return func(*args, **kwargs)
    return wrapper

@buggy_counter
def say(msg):
    return f"say: {msg}"

# 装饰时已经打印过一次
say("a")
say("b")
say("c")
# 调用三次，"装饰时"那行不会再打印
```

```
# 输出：
# [装饰时] count 初始化为 0
```

（三次 `say()` 调用不会再次触发"装饰时"那行打印，因为那行属于外层函数，定义阶段已经跑完了。）正确做法是把每次调用都要更新的状态放进 `wrapper` 内部，而不是装饰器外层。

### 2.4 带参装饰器叠加时的顺序

带参装饰器（如 `@deco("x")`）相比普通装饰器多了一层：装饰器本身先被"参数化"，返回一个真正的装饰器，再把这个装饰器应用到函数上。当多个带参装饰器叠加时，顺序规则完全继承自无参情况，只是每个装饰器在"被应用"之前多了一步"被构造"。

看这个例子：

```python
def repeat(name, times):
    """带参装饰器：重复调用内层若干次。"""
    print(f"[构造] repeat({name!r}) 被调用，返回一个 decorator")
    def decorator(func):
        print(f"[装饰时] {name} 开始装饰 {func.__name__}")
        def wrapper(*args, **kwargs):
            print(f"[调用时] {name} 前置")
            last = None
            for _ in range(times):
                last = func(*args, **kwargs)
            print(f"[调用时] {name} 后置（已重复 {times} 次）")
            return last
        return wrapper
    return decorator


def tag(name):
    print(f"[构造] tag({name!r}) 被调用")
    def decorator(func):
        print(f"[装饰时] {name} 开始装饰 {func.__name__}")
        def wrapper(*args, **kwargs):
            print(f"[调用时] {name} 前置")
            result = func(*args, **kwargs)
            print(f"[调用时] {name} 后置")
            return result
        return wrapper
    return decorator


@repeat("外层-repeat", 2)
@tag("内层-tag")
def echo(msg):
    print(f"  echo: {msg}")
    return msg


print("=== 定义结束，开始调用 ===")
echo("hi")
```

```
# 输出：
# [构造] tag('内层-tag') 被调用
# [构造] repeat('外层-repeat', 2) 被调用
# [装饰时] 内层-tag 开始装饰 echo
# [装饰时] 外层-repeat 开始装饰 wrapper
# === 定义结束，开始调用 ===
# [调用时] 外层-repeat 前置
# [调用时] 内层-tag 前置
#   echo: hi
# [调用时] 内层-tag 后置
#   echo: hi
# [调用时] 内层-tag 前置
#   echo: hi
# [调用时] 内层-tag 后置
# [调用时] 外层-repeat 后置（已重复 2 次）
```

这里有几点要注意：

1. **构造顺序**：两个带参装饰器的"构造"（即 `repeat(...)` 和 `tag(...)` 这两个外层调用）在 `def` 执行前就已经发生，顺序是 `tag` 先（写在下面，离函数近，但构造阶段其实按书写从上到下求值也很常见，具体见第 4 章原理）。注意构造顺序和装饰时顺序不是一回事。
2. **装饰时顺序**：依然是自下而上，`内层-tag` 先装饰 `echo`，`外层-repeat` 后装饰 `tag` 产生的 wrapper。
3. **调用时顺序**：依然是洋葱模型，`外层-repeat` 前置 → `内层-tag` 前置 → `echo` → `内层-tag` 后置 →（因 repeat 重复 2 次，内层链再跑一遍）→ `外层-repeat` 后置。

带参装饰器叠加时，容易让人被多出来的"构造"步骤搞乱。一个简化记忆的方法是：**先把带参装饰器的"参数化"部分（最外层那一圈括号）在脑子里折叠掉，只看 `@decorator` 应用到函数的顺序，就和无参装饰器完全一样**。构造步骤只是"生产出那个 decorator"，与后续的装饰、调用时机无关。

### 2.5 用一个综合 demo 串起两个时机

最后用一个综合性的 demo，把装饰时和调用时两个时机的顺序同时打印出来，让两者并排可见。这个 demo 模拟一个带缓存、计时和日志的接口调用，三层装饰器各司其职：

```python
import functools
import time


def log(func):
    """最外层：记录调用日志。"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        print("  [log] 前置：记录调用入参")
        result = func(*args, **kwargs)
        print("  [log] 后置：记录调用结果")
        return result
    return wrapper


def timer(func):
    """中间层：计时。"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        print("    [timer] 前置：开始计时")
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"    [timer] 后置：耗时 {elapsed:.6f}s")
        return result
    return wrapper


def cache(func):
    """最内层：简单缓存。"""
    store = {}

    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        key = (args, tuple(sorted(kwargs.items())))
        print("      [cache] 前置：检查缓存")
        if key in store:
            print("      [cache] 命中缓存，直接返回")
            return store[key]
        result = func(*args, **kwargs)
        store[key] = result
        print("      [cache] 后置：结果已缓存")
        return result
    return wrapper


@log
@timer
@cache
def compute(x):
    """模拟一个耗时计算。"""
    print(f"        [业务] compute({x}) 正在计算...")
    time.sleep(0.05)
    return x * x


print("########## 第一次调用 ##########")
print("结果：", compute(3))
print()
print("########## 第二次调用（同参数，命中缓存） ##########")
print("结果：", compute(3))
```

```
# 输出：
# ########## 第一次调用 ##########
#   [log] 前置：记录调用入参
#     [timer] 前置：开始计时
#       [cache] 前置：检查缓存
#         [业务] compute(3) 正在计算...
#       [cache] 后置：结果已缓存
#     [timer] 后置：耗时 0.05xxxxxs
#   [log] 后置：记录调用结果
# 结果： 9
#
# ########## 第二次调用（同参数，命中缓存） ##########
#   [log] 前置：记录调用入参
#     [timer] 前置：开始计时
#       [cache] 前置：检查缓存
#       [cache] 命中缓存，直接返回
#       [cache] 后置：结果已缓存
#     [timer] 后置：耗时 0.00xxxxxs
#   [log] 后置：记录调用结果
# 结果： 9
```

注意第二次调用时，因为 `cache` 命中了，`[业务]` 那行没有再出现，但三层的"前置/后置"框架依然完整走了一遍——只是 `cache` 在前置阶段就拿到了结果，还没走到回调点就短路返回了，所以内层 `compute` 没跑，但 `cache` 自己的后置逻辑（以及外层 `timer`、`log` 的后置逻辑）依然按洋葱顺序依次执行。这说明一个重要规则：**洋葱对称结构不依赖内层是否真正执行，只要某个装饰器在回调点之后写了后置代码，它的后置就一定会被执行**。

另外请注意装饰层次与职责分工的对应关系：`cache` 离业务函数最近（最内层），所以它能最早介入并决定是否短路；`log` 离业务函数最远（最外层），所以它看到的是"经过 timer 和 cache 处理之后的整体行为"。这种"缓存放内层、日志放外层"的分层方式是常见且合理的设计，第 3 章会进一步讨论。

## 3. 最佳实践

### 3.1 根据"职责粒度"决定装饰器的叠放次序

装饰器的叠放次序不是随意的，它决定了调用时各层逻辑的执行先后，直接影响行为正确性。一个实用的思维模型是：**把"想最早介入、最晚收尾"的逻辑放在最外层（`@` 最上面），把"想最接近业务函数"的逻辑放在最内层（`@` 最下面）**。

典型的推荐分层（从外到内）：

```python
@log          # 最外层：想看到所有调用的整体面貌
@timer        # 中间层：想统计包含缓存查询在内的总耗时
@cache        # 最内层：想在查询业务函数前就决定是否命中
def api():
    ...
```

为什么这样放？因为日志和计时通常希望"包住"所有内部行为，包括缓存命中导致的提前返回，所以它们放在外层；缓存希望直接拦截对业务函数的调用，所以放在最内层。如果把 `cache` 放到最外层：

```python
# 不推荐：cache 放最外层
@cache
@timer
@log
def api():
    ...
```

那么一旦缓存命中，`timer` 和 `log` 都不会执行，你将无法在缓存命中时记录日志和耗时——这通常不是你想要的。再比如鉴权和缓存的关系：如果希望"即使缓存命中也要鉴权"，那 `auth` 必须在 `cache` 外层；如果希望"鉴权结果也缓存"（少见，可能不安全），才把 `auth` 放内层。次序背后是职责优先级，要先想清楚再排。

下面用一个对照 demo 说明次序对行为的实际影响：

```python
def auth(func):
    def wrapper(*a, **kw):
        print("[auth] 鉴权通过")
        return func(*a, **kw)
    return wrapper

def cache(func):
    store = {}
    def wrapper(*a, **kw):
        if a in store:
            print("[cache] 命中")
            return store[a]
        r = func(*a, **kw)
        store[a] = r
        return r
    return wrapper

def biz(x):
    print(f"[biz] 计算 {x}")
    return x + 1

# 写法 A：auth 在外，cache 在内
@auth
@cache
def api_a(x):
    return biz(x)

# 写法 B：cache 在外，auth 在内
@cache
@auth
def api_b(x):
    return biz(x)

print("=== A: auth 外 / cache 内 ===")
print("首次:", api_a(1))
print("再次:", api_a(1))   # 仍会鉴权
print()
print("=== B: cache 外 / auth 内 ===")
print("首次:", api_b(1))
print("再次:", api_b(1))   # 命中，跳过 auth
```

```
# 输出：
# === A: auth 外 / cache 内 ===
# [auth] 鉴权通过
# [biz] 计算 1
# 首次: 2
# [auth] 鉴权通过
# [cache] 命中
# 再次: 2
#
# === B: cache 外 / auth 内 ===
# [auth] 鉴权通过
# [biz] 计算 1
# 首次: 2
# [cache] 命中
# 再次: 2
```

写法 A 每次都鉴权（安全优先），写法 B 在缓存命中时跳过鉴权（性能优先但牺牲安全）。两者都用同样的两个装饰器，只是次序不同，行为就变了。次序不是风格问题，是语义问题。

### 3.2 在每一层都保留函数元信息

多层装饰器叠加时，如果不使用 `functools.wraps`，原始函数的 `__name__`、`__doc__` 会被最内层 wrapper 的信息覆盖，层层叠加后可读性很差。推荐每一层都用 `@functools.wraps(func)`：

```python
import functools

def deco_a(func):
    @functools.wraps(func)
    def wrapper(*a, **kw):
        return func(*a, **kw)
    return wrapper

def deco_b(func):
    @functools.wraps(func)
    def wrapper(*a, **kw):
        return func(*a, **kw)
    return wrapper

@deco_a
@deco_b
def task():
    """原始 task 的文档。"""
    pass

print(task.__name__)  # 输出：task（而非 wrapper）
print(task.__doc__)   # 输出：原始 task 的文档。
```

如果不加 `wraps`，`task.__name__` 会变成 `wrapper`，调试时很难定位到底是哪一层出了问题。多层装饰器下这个问题更严重，所以形成习惯：**只要写装饰器的 wrapper，就先 `@functools.wraps(func)`**。

### 3.3 避免在装饰器外层函数里写"每次调用都要做的事"

如前所述，装饰器的外层函数只在装饰时跑一次。如果你把"计数""重置状态""读配置"等"每次调用都该做"的逻辑写在外层，就会变成只发生在模块加载时的一次性行为，产生难以察觉的 bug。

```python
# 不推荐：计数器放在外层
def bad(func):
    count = 0                    # 这个赋值只在装饰时发生
    def wrapper(*a, **kw):
        # count += 1             # 如果取消注释还会报错（UnboundLocalError）
        return func(*a, **kw)
    return wrapper

# 推荐：计数器放在 wrapper 内部，用 nonlocal 更新
def good(func):
    count = 0
    def wrapper(*a, **kw):
        nonlocal count
        count += 1
        print(f"第 {count} 次调用")
        return func(*a, **kw)
    return wrapper
```

判断标准很简单：**这段代码是应该在"定义函数时"跑，还是在"每次调用函数时"跑？**前者放外层，后者放 `wrapper` 内。

### 3.4 不要让某一层"吞掉"异常或返回值

洋葱模型的后置逻辑是在内层返回之后执行的。如果某一层在后置逻辑里直接 `return` 一个新值，就会"吃掉"内层的结果；如果某一层捕获了内层异常却不重新抛出，就会让外层以为一切正常。这两种做法都会破坏洋葱的对称性，导致外层装饰器看到的行为与实际不符。

```python
# 不推荐：吞掉异常
def swallow(func):
    def wrapper(*a, **kw):
        try:
            return func(*a, **kw)
        except Exception:
            print("被吞掉了")
            return None         # 外层以为成功
    return wrapper

# 不推荐：篡改返回值
def alter(func):
    def wrapper(*a, **kw):
        r = func(*a, **kw)
        return "changed"        # 原始结果丢失
    return wrapper
```

除非这个装饰器明确就是为了做"兜底返回"或"返回值转换"，否则应该保持内层结果的透明传递：

```python
def safe(func):
    def wrapper(*a, **kw):
        try:
            return func(*a, **kw)     # 正常透传
        except Exception as e:
            print(f"记录异常：{e}")
            raise                      # 重新抛出，让外层处理
    return wrapper
```

## 4. 原理

### 4.1 @语法糖的展开规则：为何自下而上

要理解装饰时为何是自下而上，需要从 `@` 语法糖的展开规则说起。在 Python 的语法层面，`@decorator` 是一个专门为函数定义和类定义设计的语法糖。当解释器遇到：

```python
@d1
@d2
@d3
def func():
    ...
```

它会先把 `func` 这个函数对象创建出来，然后把装饰器从**离函数最近的那一行开始，向上逐行**应用，每应用一行就相当于执行一次 `func = decorator(func)`。也就是说，展开过程是：

```python
def func():
    ...
func = d3(func)   # 先应用离 func 最近的 d3
func = d2(func)   # 再应用 d2
func = d1(func)   # 最后应用 d1
```

把这个连续赋值代入，就得到 `func = d1(d2(d3(func)))` 的等价形式。注意这里的"自下而上"有两层含义：一是装饰器的**书写顺序**是从上到下 `d1, d2, d3`，但**应用顺序**是从下到上 `d3, d2, d1`；二是应用后形成的嵌套结构是 `d1` 在最外、`d3` 在最内，与书写顺序方向相反。

为什么 Python 要这样设计，而不是从上往下应用？因为从下往上应用，才能让最上面的装饰器最终成为最外层的 `wrapper`，这符合"写在最上面的装饰器最显眼、影响最大"的直觉。如果你希望 `d1` 是整个链路的入口，那它就应该把其他装饰器的产物都包在自己里面，所以它必须最后一步应用。这是一种递归式的构造：先构造内层，再逐层向外包裹。

**可以从字节码验证这个展开**

Python 在编译 `def` 时会把 `@d1 @d2 @d3` 翻译成一串字节码，核心是先 `MAKE_FUNCTION` 创建函数对象，再依次 `LOAD_NAME d3`、`CALL_FUNCTION 1`（应用最内层），再 `LOAD_NAME d2`、`CALL_FUNCTION 1`，最后 `LOAD_NAME d1`、`CALL_FUNCTION 1`，然后把结果绑定到 `func` 这个名字上。我们用 `dis` 来看一个简化版本：

```python
import dis

def make():
    def deco(f):
        return f

    @deco      # d1
    @deco      # d2
    @deco      # d3
    def f():
        pass

dis.show_code(make)
print("-" * 40)
dis.dis(make, depth=1)
```

运行后你会看到 `make` 函数的字节码里，对 `f` 的处理大致是：先 `MAKE_FUNCTION`，再三次 `LOAD_NAME deco` + `CALL`，最后 `STORE_NAME 'f'`。这三次 `CALL` 的顺序就是从最内层（`d3`）到最外层（`d1`），与"自下而上"完全一致。（不同 Python 版本指令名可能略有差异，如 3.11+ 使用 `CALL`，3.10 以前用 `CALL_FUNCTION`，但顺序不变。）

### 4.2 MAKE_FUNCTION 与 DECORATOR 的结合过程

在 CPython 的编译与执行流程里，装饰器的应用是一组明确可追踪的指令。以一个简单函数为例：

```python
@d1
@d2
@d3
def func():
    pass
```

CPython 编译这个 `def` 时会生成如下指令序列（简化表示）：

1. `PUSH_NULL`（或等价的准备 callable 的指令）
2. `LOAD_NAME 'd1'` —— 加载最外层装饰器，先压栈备用
3. `LOAD_NAME 'd2'` —— 加载 d2
4. `LOAD_NAME 'd3'` —— 加载最内层装饰器
5. `MAKE_FUNCTION func` —— 创建原始函数对象
6. `CALL 1` —— 用栈顶的 `d3` 调用，参数是刚创建的 func
7. `CALL 1` —— 用 `d2` 调用上一步结果
8. `CALL 1` —— 用 `d1` 调用上一步结果
9. `STORE_NAME 'func'` —— 把最终结果绑定到 `func`

关键在于第 6、7、8 步：三次 `CALL` 是按"栈"的顺序进行的。由于 `d3` 是最后被压入的装饰器，它最先被 `CALL` 使用，这与"离函数最近的装饰器先应用"一致。每一次 `CALL` 都会消耗栈上的一个装饰器和一个函数对象，产出一个新的函数对象压回栈顶；下一次 `CALL` 就用更外层的装饰器来消费这个新对象。最终栈顶留下的是 `d1(d2(d3(func)))` 的结果，被 `STORE_NAME` 写回 `func`。

这样一套基于操作数栈的逐层调用机制，从字节码层面自洽地保证了"自下而上"的应用顺序：**谁离 `MAKE_FUNCTION` 产生的原始函数距离最近（即谁最后被压栈但在 CALL 时最先被取用），谁就最先被应用**。

### 4.3 调用时的调用栈结构：洋葱的运行时形态

装饰时构造出的是一个嵌套的函数对象链：最外层 `wrapper1` 闭包引用 `d2` 返回的 `wrapper2`，`wrapper2` 闭包引用 `d3` 返回的 `wrapper3`，`wrapper3` 闭包引用原始 `func`。当你调用 `func(...)` 时，实际调用的是 `wrapper1(...)`，它在执行完前置逻辑后，会执行 `return func(...)`——但此时 `wrapper1` 闭包里的 `func` 其实是 `wrapper2`，于是这次调用变成了调用 `wrapper2(...)`。

整个过程形成一个调用栈（call stack），自外向内依次压栈：

| 栈层 | 正在执行的代码 | 这一层闭包里的 `func` 指向 |
| --- | --- | --- |
| 栈顶 | `wrapper1` 前置 | `wrapper2` |
| | `wrapper2` 前置 | `wrapper3` |
| | `wrapper3` 前置 | 原始 `func` |
| | `func` 本体 | （无） |
| | `wrapper3` 后置 | —— |
| | `wrapper2` 后置 | —— |
| 栈底 | `wrapper1` 后置 | —— |

每一层 `wrapper` 在到达 `func(...)` 这一行时，压入下一层的栈帧；下一层返回后，栈帧弹出，当前层继续执行后置逻辑，然后返回给更外层。这就是洋葱对称形态的运行时来源——**前置在"进入栈帧时"发生，后置在"栈帧即将弹出时"发生，两者天然围绕回调点对称**。

可以用 `traceback` 模块在每一层打印当前调用栈深度，来实证这个栈结构：

```python
import traceback


def show_stack(layer):
    def decorator(func):
        def wrapper(*args, **kwargs):
            depth = len(traceback.extract_stack())
            print(f"  {'  '*(depth-1)}进入 {layer}（栈深度 {depth}）")
            r = func(*args, **kwargs)
            depth2 = len(traceback.extract_stack())
            print(f"  {'  '*(depth2-1)}离开 {layer}（栈深度 {depth2}）")
            return r
        return wrapper
    return decorator


@show_stack("外层 L1")
@show_stack("中层 L2")
@show_stack("内层 L3")
def core():
    print(f"  {'  '*len(traceback.extract_stack())}核心 core 执行")


core()
```

```
# 输出（栈深度数值取决于调用环境，这里只示意相对变化）：
#   进入 外层 L1（栈深度 5）
#     进入 中层 L2（栈深度 6）
#       进入 内层 L3（栈深度 7）
#         核心 core 执行
#       离开 内层 L3（栈深度 7）
#     离开 中层 L2（栈深度 6）
#   离开 外层 L1（栈深度 5）
```

栈深度从外到内逐层加一，再从内到外逐层减一，完美对应洋葱的嵌套形态。这证明调用时顺序是由 Python 调用栈的压栈/弹栈机制决定的，而调用栈的形状又是由装饰时构造出的嵌套函数对象链决定的。两个时机的顺序看似相反，其实是同一个结构的两面：装饰时负责"搭好这个嵌套"，调用时负责"按这个嵌套逐层压栈和弹栈"。

### 4.4 带参装饰器叠加的字节码视图

带参装饰器（`@deco(arg)`）多了一层"构造装饰器"的调用。在字节码层面，它表现为先 `LOAD arg`、`LOAD_NAME deco`、`CALL 1` 构造出真正的 decorator，然后再把这个 decorator 按前面的规则参与 `CALL` 链。

```python
@d1("a")
@d2("b")
@d3("c")
def func():
    pass
```

大致编译为：

1. 先构造 `d3("c")`：`LOAD "c"`、`LOAD_NAME d3`、`CALL 1` → 得到真正的 `decorator3`
2. 同理构造 `d2("b")` → `decorator2`
3. 构造 `d1("a")` → `decorator1`
4. `MAKE_FUNCTION` 创建 `func`
5. 用 `decorator3` 调用 `func`（第一次 `CALL`）
6. 用 `decorator2` 调用上一步结果
7. 用 `decorator1` 调用上一步结果
8. `STORE_NAME 'func'`

注意构造阶段（步骤 1-3）的顺序在字节码上通常是从最内层开始，但这取决于具体版本；对使用者来说要记住的是：**构造阶段只是"生产装饰器"，真正决定应用顺序的是步骤 5-7 的 `CALL` 链，依然是从离 `func` 最近的 `d3("c")` 产生的 `decorator3` 开始**。所以即便带参，应用顺序依旧自下而上，调用时依旧是洋葱。

### 4.5 一个容易忽略的细节：`@` 的应用发生在 `def` 求值时

`@decorator` 并不是"函数被调用时才应用"的，它在 `def` 语句作为一条普通语句被执行时立刻应用。这意味着：

- 装饰发生在**模块加载阶段**（顶层 `def`）或**外层函数执行阶段**（嵌套 `def`），而不是被装饰的函数第一次被调用时。
- 如果 `def` 位于 `if` 分支里，只有这个分支真正执行时，装饰才会发生。
- 如果同一个 `def` 被多次执行（例如在循环里 `def`），每次执行都会重新创建并重新装饰函数对象。

```python
for i in range(3):
    def deco(func):
        def w(*a, **kw):
            return func(*a, **kw)
        return w

    @deco
    def f():
        pass

    # 每次循环都会创建一个全新的 f 并装饰一次
    print(f"第 {i} 次 f 的 id：{id(f)}")
```

每次循环 `f` 的 id 都不同，因为每次都重新走了一遍 `MAKE_FUNCTION + CALL(deco) + STORE_NAME`。这也再次说明装饰是 `def` 求值时的一次性动作，和"函数被调用"无关。

### 4.6 装饰时与调用时的统一视角

把第 4 章的所有原理串起来，可以得到一个统一视角：

1. **装饰时**：`@` 语法糖被展开成一串 `CALL`，由 `MAKE_FUNCTION` 产生的原始函数出发，从离它最近的装饰器开始应用，每次应用用一个装饰器函数把当前函数对象包装成新的 `wrapper`，最终得到一条嵌套的函数对象链。整个过程发生在 `def` 求值时，一次性、不可重复（除非 `def` 再次执行）。
2. **调用时**：调用最外层的 `wrapper` 会触发一个逐层向内的调用栈压栈过程，每一层在 `func(...)` 处把控制权交给更内层的 `wrapper`，直到最内层调用原始 `func`；返回时栈逐层弹出，每一层在 `func(...)` 之后继续执行后置逻辑，形成与前置严格对称的洋葱形态。

装饰时搭好了嵌套，调用时走了这个嵌套。两者描述的是同一套结构在两个不同时刻的行为，所以它们"看起来方向相反"，实则完全自洽。理解了这一点，多重装饰器就不再是"靠背诵记忆顺序"的规则，而是一个可以随时从结构推导出来的一贯性原理。

## 5. 总结

### 5.1 本文内容要点

- 多重装饰器叠加时存在两个不同维度的顺序：装饰时顺序和调用时顺序，两者方向相反但同构。
- 装饰时（`def` 求值/模块加载时），`@d1 @d2 @d3` 等价于 `func = d1(d2(d3(func)))`，应用顺序自下而上：离函数最近的 `d3` 最先被调用，离函数最远的 `d1` 最后被调用。每应用一次，就用一个装饰器把当前函数对象包装成新的 `wrapper`，形成嵌套链。
- 调用时（`func()` 被调用时），控制流按洋葱模型走：最外层 `wrapper1` 前置 → `wrapper2` 前置 → `wrapper3` 前置 → 原始 `func` → `wrapper3` 后置 → `wrapper2` 后置 → `wrapper1` 后置。前置与后置围绕回调点 `func(...)` 严格对称。
- 装饰器外层函数只在装饰时各跑一次；`wrapper` 在每次调用时反复运行。把"每次调用都要做的事"写在 `wrapper` 内部，而不是外层函数里。
- 常见误区：把装饰时顺序当成调用时顺序、误以为后置会跳层、混淆外层函数与 wrapper 的执行次数、某一层吞掉异常或篡改返回值破坏洋葱对称性。
- 带参装饰器叠加时，顺序规则与无参一致，只是多了一步"构造装饰器"的调用；决定应用顺序的依然是 `CALL` 链，自下而上。
- 装饰器叠放次序是语义问题而非风格问题：缓存宜放内层以便直接拦截业务调用，日志/鉴权/计时宜放外层以包住全部内部行为。
- 原理层面：`@` 语法糖在字节码里被翻译为 `MAKE_FUNCTION` 后的一串 `CALL`，按操作数栈顺序自下而上应用；调用时则由 Python 调用栈的压栈/弹栈机制自然形成洋葱对称形态。装饰时搭嵌套，调用时走嵌套。

### 5.2 读完应能掌握

- 能在看到一个 `@d1 @d2 @d3` 的叠加写法时，立刻说出装饰时的应用顺序（`d3 → d2 → d1`）和调用时的前置/后置顺序（`d1 → d2 → d3 → func → d3 → d2 → d1`），并解释为什么。
- 能用打印装饰器或 `traceback` 栈深度实证两个时机的顺序，向他人演示洋葱模型。
- 能根据职责优先级（鉴权、缓存、日志、计时等）合理排布多层装饰器的次序，并预判不同次序下的行为差异（如缓存命中是否仍鉴权）。
- 能识别"在装饰器外层写每次调用都要做的逻辑"这一典型错误，并正确地把状态放在 `wrapper` 内部配合 `nonlocal` 使用。
- 能解释 `@` 语法糖在字节码层面如何被 `MAKE_FUNCTION` 与多次 `CALL` 实现，以及调用栈如何支撑洋葱对称形态。
- 能在多层装饰器中正确使用 `functools.wraps` 保留原始函数元信息，避免某一层吞掉异常或篡改返回值破坏洋葱对称性。