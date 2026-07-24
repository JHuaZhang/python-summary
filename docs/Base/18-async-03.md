---
group:
  title: 【18】异步协程
  order: 18
order: 3
title: async def 与 await —— 协程的定义与暂停
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 async def 与 await

`async def` 和 `await` 是 Python 3.5（PEP 492）引入的两个关键字，它们共同构成了 Python 异步编程的核心语法。`async def` 用于**定义协程函数**（coroutine function），`await` 用于在协程内部**暂停并等待可等待对象**（awaitable）完成。两者是写出任何 asyncio 程序的基础——没有 `async def` 就没有协程，没有 `await` 协程就无法把控制权交还事件循环。

理解这两个关键字的第一步是分清三个概念：**协程函数**、**协程对象**、**协程的执行**。用 `async def` 定义的函数叫协程函数，调用它不会执行函数体，而是返回一个协程对象（coroutine object）；这个协程对象必须被事件循环调度（如 `asyncio.run`、`await`、`asyncio.create_task`）才会真正运行。这一点和普通函数截然不同——普通函数调用即执行，协程函数调用只"造"出一个尚未启动的协程。

`await expr` 则是协程内部的"让位"指令。当协程执行到 `await` 时，它会暂停自身，把控制权连同被等待的对象一起交回事件循环；事件循环去驱动其他可运行的任务，等被等待对象完成后，再恢复原协程，并把结果交给 `await` 表达式。没有 `await`，协程就和普通同步函数一样一路跑到底，丧失了异步的能力。

一个常见的误解是"`async def` 就是把函数变成异步的"。准确地说，`async def` 只是声明"这个函数是协程函数，内部可以使用 `await`"，它本身不会自动并发，也不会自动让出控制权——真正让协程"挂起"的是 `await`（以及 `async for`、`async with` 隐含的 `await`）。一个 `async def` 函数里如果完全没有 `await`，它仍会同步地从头执行到尾，只是返回值是一个协程对象而非直接结果。

**在 Python 异步体系中的地位**

`async def` + `await` 是整个 asyncio 生态的语法基石。`asyncio.sleep`、`asyncio.gather`、`aiohttp`、`aiofiles` 等所有异步 API 都通过协程函数暴露，调用它们必须用 `await`。可以说：学不清 `async def` 和 `await`，就看不懂任何一段 asyncio 代码。本篇是异步语法的核心，后续的 `create_task`、`gather`、取消与超时等主题都建立在本篇之上。

### 1.2 基础语法与最小示例

**`async def` 定义协程函数**

```python
async def hello():          # 用 async def 声明这是一个协程函数
    print("hello 开始")
    return "hello 完成"

print(type(hello))          # 输出：<class 'function'>，但它是协程函数
print(hello)                # 输出：<function hello at 0x...>

coro = hello()              # 调用它：不执行函数体，而是返回协程对象
print(type(coro))           # 输出：<class 'coroutine'>
print(coro)                 # 输出：<coroutine object hello at 0x...>
```

注意 `hello()` 这一行：它**没有**打印 `"hello 开始"`，也没有返回 `"hello 完成"`。它做的唯一一件事是创建并返回一个协程对象。函数体的代码此时一行都没跑。这是 `async def` 与 `def` 最直观的差异。

要让协程对象真正执行，必须把它交给事件循环或用 `await` 驱动：

```python
import asyncio

async def hello():
    print("hello 开始")
    return "hello 完成"

result = asyncio.run(hello())   # asyncio.run 启动事件循环并运行协程到底
print(result)
# 输出：
# hello 开始
# hello 完成
```

`asyncio.run(hello())` 先创建协程对象（`hello()`），再由事件循环驱动它执行到结束，最后返回协程的 `return` 值。`asyncio.run` 是从外部（同步世界）启动一个顶层协程的标准入口，后续篇章会专门讲它。

**`await` 等待一个协程**

```python
import asyncio

async def fetch():
    print("fetch 开始")
    await asyncio.sleep(0.01)   # await：暂停当前协程，把控制权交还事件循环
    print("fetch 结束")
    return "数据"

async def main():
    result = await fetch()      # await 一个协程：等它完成并取其返回值
    print(f"拿到: {result}")

asyncio.run(main())
# 输出：
# fetch 开始
# fetch 结束
# 拿到: 数据
```

这段代码展示了 `await` 的两个核心用途：在 `fetch` 内部 `await asyncio.sleep(...)` 把控制权让给事件循环（模拟一次异步 IO 等待）；在 `main` 内部 `await fetch()` 等待另一个协程完成并拿到它的返回值。`main` 调用 `fetch()` 得到协程对象，`await` 驱动该协程对象执行，`fetch` 的 `return` 值 `"数据"` 成为 `await fetch()` 表达式的结果，赋给 `result`。

**`await` 只能用在 `async def` 内**

```python
import asyncio

def sync_caller():
    # 在普通函数里用 await 会直接报 SyntaxError，代码根本无法编译
    # await asyncio.sleep(0.01)   # 取消注释会导致 SyntaxError: 'await' outside async function
    pass
```

`await` 是一个"协程内专用"的关键字。编译器在编译期就检查：`await` 必须出现在 `async def` 函数体中（或 `async with`、`async for` 这些隐含协程上下文的构造里），否则直接 `SyntaxError`。这不是运行时错误，而是语法层面的禁止——连 import 都过不了。

本篇余下章节会把这些基础点逐层展开：`async def` 的语义、`await` 的语义与可等待对象、`return` 值与 await 的链式传播、常见错误与最佳实践，最后深入字节码讲清协程的挂起/恢复机制。

## 2. 核心内容

### 2.1 async def：定义协程函数

`async def` 用来把一个函数声明为协程函数。它的语法和普通 `def` 几乎一致，只是多了 `async` 前缀：

```python
async def 函数名(参数列表):
    函数体
    return 返回值        # 可选
```

协程函数和普通函数的差异集中在三点：**调用行为**、**可用语法**、**返回的对象类型**。

**调用行为：返回协程对象，不执行函数体**

```python
import asyncio

async def add(a, b):
    print(f"计算 {a} + {b}")
    return a + b

coro = add(3, 4)          # 没有打印 "计算 3 + 4"，只是拿到协程对象
print(coro)               # 输出：<coroutine object add at 0x...>

# 必须被驱动才会执行
result = asyncio.run(coro)
# 输出：计算 3 + 4
print(result)             # 输出：7
```

`add(3, 4)` 形似函数调用，但实际只构造了一个协程对象。函数体中的 `print` 和 `return` 此时都没有发生。这是初学者最容易踩的坑：写了 `add(3, 4)` 却发现函数体没跑，原因就是协程函数调用只"造对象"，不"执行代码"。

**可用语法：函数体内可使用 `await`、`async for`、`async with`**

```python
import asyncio

async def demo():
    # async with：异步上下文管理器（隐含 await）
    async with asyncio.Lock():
        # async for：异步迭代（隐含 await）
        async for item in async_range(3):
            print(item)
    # await：显式等待
    await asyncio.sleep(0.01)
    return "done"
```

在普通 `def` 函数里使用 `await` / `async for` / `async with` 会直接 `SyntaxError`。这些异步语法是 `async def` 函数体的"特权"。

**返回的对象类型：coroutine，不是普通返回值**

```python
import asyncio

async def greet():
    return "hi"

print(type(greet()))        # 输出：<class 'coroutine'>
```

即使函数体里写了 `return "hi"`，`greet()` 的调用结果也不是 `"hi"`，而是一个 coroutine 对象。`"hi"` 这个值只有在协程被驱动到结束时，才通过 `await` 或 `asyncio.run` 取出。

**判断一个函数是不是协程函数**

```python
import asyncio
import inspect

async def coro_func():
    pass

def normal_func():
    pass

print(asyncio.iscoroutinefunction(coro_func))   # 输出：True
print(asyncio.iscoroutinefunction(normal_func)) # 输出：False
print(inspect.iscoroutinefunction(coro_func))   # 输出：True（通用判断）

# 判断一个对象是不是协程对象
print(asyncio.iscoroutine(coro_func()))         # 输出：True
print(asyncio.iscoroutine(normal_func()))       # 输出：False
```

`asyncio.iscoroutinefunction` 判断函数，`asyncio.iscoroutine` 判断对象。在写装饰器、调度器、回调注册时经常需要这些判断，以区分协程函数与普通函数、协程对象与普通返回值。

**协程函数的参数**

```python
import asyncio

# 协程函数的参数和普通函数一样：位置参数、默认参数、关键字参数都支持
async def fetch_user(user_id, fields=("name", "email")):
    await asyncio.sleep(0.01)   # 模拟异步查询
    return {"id": user_id, "fields": fields}

async def main():
    # 调用时仍然只是创建协程对象，参数被绑定在对象上
    u1 = await fetch_user(1)
    u2 = await fetch_user(2, fields=("name", "phone"))
    print(u1)                   # 输出：{'id': 1, 'fields': ('name', 'email')}
    print(u2)                   # 输出：{'id': 2, 'fields': ('name', 'phone')}

asyncio.run(main())
```

参数在调用 `fetch_user(...)` 时就被绑定到协程对象上，但函数体要等 `await` 驱动时才执行。注意：**不要**把"希望异步获得的值"作为协程函数调用的参数期望它异步求值——参数是同步求值的（在调用 `fetch_user(...)` 那一刻就确定了值），异步的是函数体内的 IO 操作。

### 2.2 调用协程函数返回的是协程对象，不是结果

这一节单独强调，因为它是 `async def` 最反直觉的一点，也是 `asyncio` 初学者的第一大坑。

**协程对象是"尚未开始执行的协程"**

```python
import asyncio

async def task(name, delay):
    await asyncio.sleep(delay)
    return f"{name} 完成（耗时 {delay}s）"

# 拿到三个协程对象，但没有一个开始执行
c1 = task("A", 0.1)
c2 = task("B", 0.2)
c3 = task("C", 0.3)

print(c1, c2, c3, sep="\n")
# 输出（地址每次不同）：
# <coroutine object task at 0x...>
# <coroutine object task at 0x...>
# <coroutine object task at 0x...>

# 三个协程对象如果不被 await / asyncio.run / create_task 驱动，
# 程序结束时 Python 会发出警告：
# RuntimeWarning: coroutine 'task' was never awaited
```

上面这段代码运行后会看到三条 `RuntimeWarning: coroutine 'task' was never awaited` 警告——因为 `c1`、`c2`、`c3` 三个协程对象自始至终都没有被驱动，它们只是被构造出来，然后随程序退出被垃圾回收。这是典型的"调用了协程函数但忘了 await"错误。

**协程对象的三种合法去向**

一个协程对象创建后，只有三条出路，否则就是"泄漏"：

1. **被 `await`**：`result = await coro`。当前协程暂停，等 `coro` 完成，取其返回值。
2. **被 `asyncio.create_task` 包装**：`task = asyncio.create_task(coro)`。把协程交给事件循环并发调度。
3. **被 `asyncio.run` 等顶层入口驱动**：`asyncio.run(coro)`。从同步世界启动事件循环运行一个顶层协程。

```python
import asyncio

async def work(n):
    await asyncio.sleep(0.01)
    return n * 2

# 去向一：await
async def via_await():
    r = await work(5)                 # 等待 work 完成
    print("await 方式:", r)            # 输出：await 方式: 10

# 去向二：create_task（并发）
async def via_task():
    t = asyncio.create_task(work(6))  # 立即调度，不等
    r = await t                       # 后面再 await 等它完成
    print("create_task 方式:", r)      # 输出：create_task 方式: 12

# 去向三：asyncio.run（顶层入口）
print("asyncio.run 方式:", asyncio.run(work(7)))  # 输出：asyncio.run 方式: 14

asyncio.run(via_await())
asyncio.run(via_task())
```

理解"协程对象必须被驱动"后，就能解释为什么下面这种写法在某些库的回调里特别危险：

```python
import asyncio

async def on_event():
    await asyncio.sleep(0.01)
    print("事件处理完成")

def register_callback():
    # 错误：把协程函数调用结果（协程对象）当回调注册，
    # 但框架只对普通函数调用，不会 await 它
    some_sync_framework.set_callback(on_event())   # on_event() 是协程对象，不会被驱动
    # 程序运行后会看到 RuntimeWarning: coroutine 'on_event' was never awaited
```

如果框架本身不支持协程，需要用 `asyncio.run` 或 `asyncio.ensure_future` 把协程对象显式交给事件循环，而不能直接把协程对象当普通回调塞进去。

### 2.3 await：暂停当前协程，等待 awaitable

`await` 是协程内部的让位指令。它的语法是：

```python
result = await <可等待对象>
```

`await expr` 做三件事：求值 `expr` 得到一个可等待对象；暂停当前协程并把控制权与该对象一起交回事件循环；等该对象完成后恢复当前协程，`await` 表达式的值就是该对象的结果。

**`await` 的语义演示**

```python
import asyncio

async def step(name, delay):
    print(f"  {name} 开始，等待 {delay}s")
    await asyncio.sleep(delay)        # 让位给事件循环，模拟 IO
    print(f"  {name} 恢复")
    return f"{name}完成"

async def main():
    print("main: 第一件事")
    r1 = await step("读数据库", 0.1)  # await 暂停 main，等 step 完成
    print(f"main: 第一件事结果 {r1}")
    print("main: 第二件事")
    r2 = await step("调接口", 0.1)
    print(f"main: 第二件事结果 {r2}")

asyncio.run(main())
# 输出：
# main: 第一件事
#   读数据库 开始，等待 0.1s
#   读数据库 恢复
# main: 第一件事结果 读数据库完成
# main: 第二件事
#   调接口 开始，等待 0.1s
#   调接口 恢复
# main: 第二件事结果 调接口完成
```

注意执行顺序：`main` 在 `await step(...)` 处暂停，`step` 开始执行；`step` 内部又 `await asyncio.sleep(...)` 暂停，事件循环计时 0.1s；计时到了恢复 `step`，`step` 跑完 `return`，`await step(...)` 拿到返回值，`main` 恢复继续。这里的"暂停-恢复"是 `await` 的本质，第 4 章会从字节码层细讲。

**`await` 表达式的值就是被等待对象的结果**

```python
import asyncio

async def compute():
    await asyncio.sleep(0.01)
    return 42

async def main():
    # await 表达式本身是一个"有值的表达式"，值 = 被等待协程的 return 值
    value = await compute()
    print(value + 1)          # 输出：43

    # 也可以直接在更大的表达式里用
    print((await compute()) * 2)   # 输出：84

asyncio.run(main())
```

`await compute()` 是一个表达式，它的值是 `compute` 协程的 `return` 值。因此可以直接赋值、参与运算、作为函数参数。但出于可读性，建议先赋值再用（见最佳实践）。

**`await` 遇到的是普通值会怎样**

```python
import asyncio

async def main():
    # await 一个不是 awaitable 的对象会报 TypeError
    # x = await 42        # TypeError: object int can't be used in 'await' expression
    pass

asyncio.run(main())
```

`await` 后面必须跟一个"可等待对象"。直接 `await 42` 会抛 `TypeError: object int can't be used in 'await' expression`。这是运行期检查，不是语法错误——`await 42` 语法合法，但运行到这一行才报错。

### 2.4 可等待对象（awaitable）的三种

`await` 后面能跟什么？Python 定义了"可等待对象"（awaitable）这一概念，它有三种具体形态：**协程**（coroutine）、**任务**（Task）、**未来**（Future）。三者都实现了 `__await__` 方法（或属于Coroutine/Task/Future 类型族），因此都能被 `await`。

**第一种：协程（coroutine）**

调用 `async def` 函数返回的对象就是协程。`await` 一个协程，意味着等它执行完毕并取其返回值。

```python
import asyncio

async def sub_task():
    await asyncio.sleep(0.01)
    return "子任务完成"

async def main():
    result = await sub_task()      # await 协程对象
    print(result)                  # 输出：子任务完成

asyncio.run(main())
```

这是最常见的用法：在协程 A 里 `await` 协程 B，A 暂停，B 执行到结束，A 拿到 B 的返回值恢复。

**第二种：任务（Task）**

`asyncio.create_task(coro)` 把一个协程包装成 Task 对象并立即交给事件循环调度。Task 也是 awaitable，`await` 一个 Task 表示等这个任务完成。

```python
import asyncio

async def work(name, delay):
    await asyncio.sleep(delay)
    return f"{name} 完成"

async def main():
    # create_task 立即把 work 交给事件循环，不等
    t1 = asyncio.create_task(work("A", 0.1))
    t2 = asyncio.create_task(work("B", 0.1))

    # 两个任务已在并发执行；这里 await 等它们各自完成
    r1 = await t1
    r2 = await t2
    print(r1, r2)
    # 输出（总耗时约 0.1s 而非 0.2s，因为两任务并发）：
# A 完成 B 完成

asyncio.run(main())
```

`await` 协程与 `await` Task 的差别：`await coro` 是"就地驱动该协程"（不会与其他任务并发，除非协程内部自己 await 让出）；`await task` 是"等待一个已经被事件循环调度的任务完成"（可以与其他任务并发）。是否需要并发是选择 `create_task` 的关键，本篇只点出差异，完整讨论放在 create_task 篇。

**第三种：Future**

Future 是 asyncio 中表示"将来会有结果"的底层对象，Task 本身就是 Future 的子类。直接 `await` 一个 Future 表示等它的结果被设置。日常应用代码很少直接 `await` Future，但理解它有助于看懂底层 API。

```python
import asyncio

async def main():
    # 创建一个 Future（通常用 loop.create_future，3.10+ 可直接 asyncio.Future）
    fut = asyncio.get_running_loop().create_future()

    # 模拟：0.05s 后给 fut 设置结果
    async def fulfill():
        await asyncio.sleep(0.05)
        fut.set_result("future 结果")
    asyncio.create_task(fulfill())

    # await Future：等它被 set_result
    print(await fut)              # 输出：future 结果

asyncio.run(main())
```

**判断一个对象是否 awaitable**

```python
import asyncio
import collections.abc

async def coro():
    return 1

async def main():
    c = coro()
    t = asyncio.create_task(coro())
    f = asyncio.get_running_loop().create_future()

    print(isinstance(c, collections.abc.Coroutine))   # True
    print(isinstance(t, asyncio.Future))              # True（Task 是 Future 子类）
    print(isinstance(f, asyncio.Future))              # True
    # 通用判断：能否 await 由是否有 __await__ 决定
    print(hasattr(c, "__await__"))                    # True
    print(hasattr(t, "__await__"))                    # True
    print(hasattr(f, "__await__"))                    # True

asyncio.run(main())
```

从协议角度，凡是实现了 `__await__` 方法的对象都是 awaitable。协程、Task、Future 都满足这一协议。自定义类也可以实现 `__await__` 来创建自定义 awaitable，但日常开发很少需要。

**三种 awaitable 对照**

| 类型 | 由什么创建 | `await` 它意味着 | 是否自动调度 |
|------|-----------|------------------|------------|
| 协程 coroutine | 调用 `async def` 函数 | 就地驱动其函数体执行到结束 | 否，需 `await` 或 `create_task` |
| 任务 Task | `asyncio.create_task(coro)` | 等待已在循环中调度的任务完成 | 是，创建即调度 |
| 未来 Future | `loop.create_future()` | 等待外部 `set_result` | 否，需有人设结果 |

### 2.5 await 只能在 async def 内使用

`await` 是协程上下文专属关键字。Python 在**编译期**就检查这一约束：`await` 必须出现在 `async def` 函数体内（包括 `async with`、`async for` 这些隐含协程的构造），否则 `SyntaxError`。

**在普通 def 里用 await：SyntaxError**

```python
import asyncio

def sync_func():
    # 下面这行如果取消注释，整个文件都无法导入/运行：
    # await asyncio.sleep(0.01)
    # SyntaxError: 'await' outside async function
    pass
```

这是语法错误而非运行错误——Python 在编译源码阶段就会拒绝，连 `import` 都过不了。这一约束保证了"`await` 一定在协程中"这一不变量。

**在模块顶层用 await：同样 SyntaxError（3.7 及以下）或受限（3.8+ 顶层 await）**

```python
# 在模块顶层直接写 await 在传统脚本中不被允许：
# import asyncio
# await asyncio.sleep(0.01)   # SyntaxError: 'await' outside async function

# Python 3.8+ 在 -c / 交互式 / asyncio.run 等某些 REPL 上下文下
# 允许"顶层 await"，但其本质仍是运行在一个隐式协程里，
# 普通模块文件顶层仍不能用 await。
```

对绝大多数应用代码而言，记住一条规则即可：**`await` 只能写在 `async def` 函数体内**。如果你想在某个地方 `await`，那就把那个函数改成 `async def`，并确保它的调用方也 `await` 它——这会一路传播到顶层 `asyncio.run`。

**await 可以嵌套出现（协程内多层 await）**

```python
import asyncio

async def level3():
    await asyncio.sleep(0.01)
    return 3

async def level2():
    r = await level3()
    return r + 10

async def level1():
    r = await level2()
    return r + 100

async def main():
    print(await level1())     # 输出：113

asyncio.run(main())
```

每一层都是 `async def`，每一层都用 `await` 调用下一层。`await` 链一直延伸到 `asyncio.sleep` 这种真正让位的点。这就是协程调用栈的标准形态。

### 2.6 await 后面必须跟 awaitable

前面提到 `await` 后跟非 awaitable 会 `TypeError`。这里展开讲几种常见的错误形态。

**`await` 普通值：TypeError**

```python
import asyncio

async def main():
    try:
        await 42
    except TypeError as e:
        print("报错:", e)
        # 输出：报错: object int can't be used in 'await' expression

asyncio.run(main())
```

整数 `42` 没有 `__await__`，不是 awaitable。同理 `await "hello"`、`await [1,2]`、`await None` 都会报同样错误。这个错误是运行时报的，因为编译器无法静态判断一个表达式的类型。

**`await` 普通函数调用结果：TypeError**

```python
import asyncio

def sync_compute():
    return 100

async def main():
    try:
        await sync_compute()      # sync_compute() 返回 100，不是 awaitable
    except TypeError as e:
        print("报错:", e)          # 输出：报错: object int can't be used in 'await' expression

asyncio.run(main())
```

常见于把同步函数误当协程 `await`。区分方法：同步函数的 `def` 没有 `async` 前缀；协程函数是 `async def`。

**`await` 协程函数（而非协程对象）：TypeError**

```python
import asyncio

async def coro_func():
    return 1

async def main():
    try:
        await coro_func        # 注意：没加 ()，await 的是函数对象本身
    except TypeError as e:
        print("报错:", e)
        # 输出：报错: object function can't be used in 'await' expression

asyncio.run(main())
```

`coro_func` 是函数对象，`coro_func()` 才是协程对象。`await` 必须接协程对象（或 Task/Future），不能接函数本身。这个错误常发生在手滑漏写 `()` 时。

### 2.7 协程必须被 await 或调度才会运行

这一节用一个对比例子强化"协程不主动运行"的观念，并展示让协程运行的三种正确方式。

**只调用不 await：函数体不执行，且会报警告**

```python
import asyncio
import warnings

async def should_run():
    print("我运行了吗？")
    return "结果"

async def main():
    # 只调用协程函数，不 await 也不 create_task
    coro = should_run()        # 创建协程对象，函数体一行没跑
    # 故意不处理 coro，让它随 main 结束被 GC
    # （实际运行会打印 "我运行了吗？" 吗？不会）
    print("main 结束")
    # 当 coro 被 GC，Python 发出警告：
    # RuntimeWarning: coroutine 'should_run' was never awaited

warnings.simplefilter("always")   # 确保看到警告
asyncio.run(main())
# 输出：
# main 结束
# （以及一条 RuntimeWarning: coroutine 'should_run' was never awaited）
# "我运行了吗？" 不会打印
```

`should_run()` 创建的协程对象 `coro` 全程没被驱动，函数体没执行，`return` 也被丢弃。Python 在 GC 它时发出警告。

**正确方式一：await 驱动**

```python
import asyncio

async def should_run():
    print("我运行了吗？")
    return "结果"

async def main():
    r = await should_run()       # 正确：await 驱动
    print("拿到:", r)

asyncio.run(main())
# 输出：
# 我运行了吗？
# 拿到: 结果
```

**正确方式二：create_task 调度再 await**

```python
import asyncio

async def should_run():
    print("我运行了吗？")
    return "结果"

async def main():
    t = asyncio.create_task(should_run())   # 立即交给事件循环调度
    r = await t                             # 等它完成
    print("拿到:", r)

asyncio.run(main())
# 输出：
# 我运行了吗？
# 拿到: 结果
```

**正确方式三：asyncio.run 作为顶层入口**

```python
import asyncio

async def should_run():
    print("我运行了吗？")
    return "结果"

result = asyncio.run(should_run())   # 从同步世界启动事件循环运行顶层协程
print("拿到:", result)
# 输出：
# 我运行了吗？
# 拿到: 结果
```

`asyncio.run` 是"从同步代码启动一个协程"的标准入口，它内部创建事件循环、运行协程到结束、关闭事件循环并返回协程的 `return` 值。在整个 asyncio 程序中，`asyncio.run` 通常只调用一次，作为最外层入口。

### 2.8 async def 函数内可以直接 return 值，被 await 捕获

协程函数的 `return` 值不会像普通函数那样直接给调用方，而是通过 `await` 表达式被捕获。这是因为 `async def` 函数"调用"只返回协程对象，`return` 的值要等协程被执行到结束时才"释放"。

**return 值经 await 取回**

```python
import asyncio

async def make_data():
    await asyncio.sleep(0.01)
    return {"status": "ok", "items": [1, 2, 3]}

async def main():
    data = await make_data()       # make_data 的 return 值赋给 data
    print(data["status"])          # 输出：ok
    print(data["items"])           # 输出：[1, 2, 3]

asyncio.run(main())
```

协程的 `return` 值通过 `await` 表达式流出。这与生成器 `yield from` 取子生成器 `return` 值的机制同源（见第 4 章）。

**没有 return 时 await 得到 None**

```python
import asyncio

async def no_return():
    await asyncio.sleep(0.01)
    # 没有 return，等价于 return None

async def main():
    result = await no_return()
    print(result)                  # 输出：None

asyncio.run(main())
```

**return 值类型任意**

```python
import asyncio

async def return_int():
    return 42

async def return_list():
    return [1, 2, 3]

async def return_tuple():
    return ("a", "b")

async def return_asyncio_future_like():
    # 即使 return 另一个协程对象也可以（但通常需要再 await）
    async def inner():
        return "inner"
    return inner()                 # 返回一个协程对象

async def main():
    print(await return_int())                # 输出：42
    print(await return_list())               # 输出：[1, 2, 3]
    print(await return_tuple())              # 输出：('a', 'b')
    inner_coro = await return_asyncio_future_like()
    # inner_coro 还是一个协程对象，需要再 await
    print(await inner_coro)                  # 输出：inner

asyncio.run(main())
```

注意 `return_asyncio_future_like`：它 `return` 了一个协程对象，`await` 它拿到的是那个协程对象本身，需要再 `await` 一次才能得到内部结果。这其实是一种"`return await inner()`"的简化漏写——更自然的写法是 `return await inner()`。

**return 与 await 的组合：提前返回**

```python
import asyncio

async def check_cache(key):
    await asyncio.sleep(0.01)
    if key == "hit":
        return "缓存命中"
    return None

async def get_data(key):
    # await 后立即判断 return，等价于同步代码的早返回
    cached = await check_cache(key)
    if cached is not None:
        return cached
    await asyncio.sleep(0.01)      # 模拟回源
    return f"{key} 回源数据"

async def main():
    print(await get_data("hit"))   # 输出：缓存命中
    print(await get_data("miss"))  # 输出：miss 回源数据

asyncio.run(main())
```

`async def` 函数里 `return` 的语义和普通函数一致——立刻结束当前协程并把值交给 `await` 方。这种"`await - 判断 - return`"模式在异步缓存、异步校验中非常常见。

### 2.9 await 的链式传播：协程 A await 协程 B

协程之间通过 `await` 形成调用链。外层协程 `await` 内层协程时，内层的每一次让位（`await` 第三方）都会沿链向上把控制权交还事件循环；内层完成后，返回值沿链向下交回外层。这是异步程序的典型调用结构。

**单链：A → B → C**

```python
import asyncio

async def fetch_url(url):
    print(f"  [{url}] 开始下载")
    await asyncio.sleep(0.05)      # 让位
    print(f"  [{url}] 下载完成")
    return f"<html from {url}>"

async def fetch_and_parse(url):
    html = await fetch_url(url)    # 等下载
    print(f"  [{url}] 解析完成")
    return f"parsed({html})"

async def render_page(url):
    data = await fetch_and_parse(url)   # 等下载+解析
    print(f"  [{url}] 渲染完成")
    return f"page({data})"

async def main():
    result = await render_page("http://example.com")
    print("最终:", result)

asyncio.run(main())
# 输出：
#   [http://example.com] 开始下载
#   [http://example.com] 下载完成
#   [http://example.com] 解析完成
#   [http://example.com] 渲染完成
# 最终: page(parsed(<html from http://example.com>))
```

`main → render_page → fetch_and_parse → fetch_url` 是一条 `await` 链。最内层的 `await asyncio.sleep` 是唯一真正让位点；外层每一层都"等"内层完成。返回值则反向流回：`fetch_url` 的 `return` 值 → `fetch_and_parse` 的 `await` 表达式 → `fetch_and_parse` 的 `return` 值 → `render_page` 的 `await` 表达式 → …。

**await 链中的让位是"层层透传"的**

```python
import asyncio

async def innermost():
    print("innermost 让位前")
    await asyncio.sleep(0.01)      # 让位
    print("innermost 恢复后")
    return "innermost 结果"

async def middle():
    print("middle 调用 innermost")
    r = await innermost()          # 这一步不立即返回，innermost 内部的 await 会让位给循环
    print("middle 拿到", r)
    return f"middle({r})"

async def outer():
    print("outer 调用 middle")
    r = await middle()             # middle 内部让位时，outer 也处于挂起态
    print("outer 拿到", r)
    return f"outer({r})"

async def main():
    # 同时调度 outer 与一个 background 任务，演示让位期间循环能跑别的任务
    async def background():
        for i in range(3):
            print(f"--- background tick {i}")
            await asyncio.sleep(0.005)

    asyncio.create_task(background())
    print(await outer())

asyncio.run(main())
# 一种可能的输出（让位期间 background 在跑）：
# outer 调用 middle
# middle 调用 innermost
# innermost 让位前
# --- background tick 0
# --- background tick 1
# innermost 恢复后
# middle 拿到 innermost 结果
# outer 拿到 middle(innermost 结果)
# outer(middle(innermost 结果))
# --- background tick 2
```

关键观察：当 `innermost` 内部 `await asyncio.sleep` 让位时，`middle` 和 `outer` 都"卡"在各自的 `await` 处挂起，事件循环此时去跑 `background`。`innermost` 恢复后层层恢复。整条 `await` 链是一个"挂起态共同体"——任何一层的让位都会让整链一起挂起，事件循环借机跑其他任务。这就是 asyncio 单线程并发的机制：通过 `await` 链的挂起/恢复，让 IO 等待期间 CPU 能跑其他协程。

**await 链中异常的传播**

```python
import asyncio

async def leaf():
    await asyncio.sleep(0.01)
    raise ValueError("叶子协程出错")

async def branch():
    await leaf()                   # leaf 的异常会穿透这里

async def root():
    await branch()                 # 继续穿透到这里

async def main():
    try:
        await root()               # 在最外层捕获
    except ValueError as e:
        print(f"捕获到: {e}")       # 输出：捕获到: 叶子协程出错

asyncio.run(main())
```

`await` 链上的异常会从内层向外层冒泡，与普通函数调用栈的异常传播一致。任何一层都可以用 `try/except` 捕获，未捕获则继续向外冒泡。

### 2.10 常见错误一：忘 await 协程，被警告"coroutine was never awaited"

这是 asyncio 初学者最高频的错误，本节专门复现并分析。

**错误复现**

```python
import asyncio
import warnings

async def save(data):
    await asyncio.sleep(0.01)
    print(f"保存: {data}")
    return True

async def main():
    # 错误：调用协程函数却忘了 await
    save("important")              # 创建了协程对象，但没 await
    print("main 结束（save 没真的跑）")

warnings.simplefilter("always")
asyncio.run(main())
# 输出：
# main 结束（save 没真的跑）
# RuntimeWarning: coroutine 'save' was never awaited
# 注意：没有打印 "保存: important"
```

`save("important")` 只创建了协程对象，函数体没执行，`return True` 也丢了。Python 在协程对象被 GC 时发出 `RuntimeWarning: coroutine 'save' was never awaited`。这种错误的危害在于：**代码看起来跑了（没报错），但实际什么都没做**——保存没发生、返回值被丢弃。在生产环境里这种 bug 极其隐蔽。

**修正**

```python
import asyncio

async def save(data):
    await asyncio.sleep(0.01)
    print(f"保存: {data}")
    return True

async def main():
    ok = await save("important")   # 正确：await 驱动
    print("保存结果:", ok)

asyncio.run(main())
# 输出：
# 保存: important
# 保存结果: True
```

**容易出错的场景：把协程对象放进数据结构里忘了取**

```python
import asyncio
import warnings

async def fetch_item(i):
    await asyncio.sleep(0.01)
    return i * 10

async def main():
    # 错误：生成器表达式里调用协程函数，拿到的全是协程对象
    results = [fetch_item(i) for i in range(3)]   # 三个协程对象，都没 await
    print("results:", results)
    # results: [<coroutine object fetch_item at 0x...>, ...]
    # 三个协程都没被驱动，程序结束时报三条 RuntimeWarning

warnings.simplefilter("always")
asyncio.run(main())
# 输出：
# results: [<coroutine object fetch_item at 0x...>, <coroutine object fetch_item at 0x...>, <coroutine object fetch_item at 0x...>]
# RuntimeWarning: coroutine 'fetch_item' was never awaited（×3）
```

正确做法是用 `asyncio.gather` 或循环 `await`：

```python
import asyncio

async def fetch_item(i):
    await asyncio.sleep(0.01)
    return i * 10

async def main():
    # 正确一：逐个 await（串行）
    results = []
    for i in range(3):
        results.append(await fetch_item(i))
    print("串行:", results)     # 输出：串行: [0, 10, 20]

    # 正确二：gather 并发
    results2 = await asyncio.gather(fetch_item(0), fetch_item(1), fetch_item(2))
    print("并发:", results2)    # 输出：并发: [0, 10, 20]

asyncio.run(main())
```

记住一条排查口诀：**看到 `coroutine ... was never awaited` 警告，就回头找哪里调用了协程函数却没 `await`（也没 `create_task` / `asyncio.run`）**。

### 2.11 常见错误二：在同步函数里用 await 报错

`await` 出现在普通 `def` 函数里会直接 `SyntaxError`，代码无法编译。这一节展示几种"想异步但写错地方"的典型错误。

**错误一：在同步函数里调用协程并试图 await**

```python
import asyncio

async def fetch():
    await asyncio.sleep(0.01)
    return "数据"

def handler():                      # 普通 def，不是 async def
    # 取消下面这行注释会 SyntaxError，整个文件无法导入：
    # data = await fetch()
    # SyntaxError: 'await' outside async function
    pass
```

修正方式是把 `handler` 改成 `async def`：

```python
import asyncio

async def fetch():
    await asyncio.sleep(0.01)
    return "数据"

async def handler():                # 改成 async def
    data = await fetch()            # 合法
    print(data)

asyncio.run(handler())             # 输出：数据
```

但要注意：把 `handler` 改成协程后，**调用 `handler` 的地方也必须能 `await`**。这种"异步改造"会沿调用链向上传播，直到某个同步入口（如 `asyncio.run`）为止。这是 asyncio 程序"异步传染性"的体现。

**错误二：在同步回调里调用协程函数**

```python
import asyncio

async def on_click():
    await asyncio.sleep(0.01)
    print("点击处理完成")

def register():
    # 假设 some_gui_framework 是同步 GUI 框架，回调必须是普通函数
    # some_gui_framework.on_click(on_click)   # on_click 是协程函数，框架调用它只会拿到协程对象
    pass

# 正确做法：把协程交给事件循环，而非直接当同步回调
def register_correct():
    loop = asyncio.get_event_loop()

    def sync_wrapper():
        # 把协程交给事件循环调度
        asyncio.ensure_future(on_click())

    # some_gui_framework.on_click(sync_wrapper)
```

同步框架不能直接调用协程函数（调用只返回协程对象）。需要用 `asyncio.ensure_future` / `loop.create_task` 把协程交给事件循环，或在协程与同步边界用专门桥接（见"同步代码调用异步代码"篇）。

**错误三：把 await 写在列表推导式但外层函数不是 async def**

```python
import asyncio

async def work(i):
    await asyncio.sleep(0.01)
    return i * 2

def bad():
    # 下面这行会 SyntaxError，因为 bad 是普通 def，
    # 推导式里的 await 无效
    # return [await work(i) for i in range(3)]
    pass

async def good():
    # async def 内的列表推导式可以包含 await
    return [await work(i) for i in range(3)]   # 合法：串行 await

async def main():
    print(await good())      # 输出：[0, 2, 4]

asyncio.run(main())
```

列表推导式里的 `await` 是否合法，取决于外层函数是否为 `async def`。Python 3 编译期会正确识别推导式内的 `await` 并应用同样的协程上下文检查。

### 2.12 综合示例：模拟异步数据拉取与串联

把前面各节的内容用一个稍具场景感的例子串起来——模拟一个异步爬虫的"拉取-解析-汇总"流程。

```python
import asyncio

# 模拟异步 HTTP 拉取
async def fetch(url, delay=0.05):
    print(f"  fetch {url} 开始")
    await asyncio.sleep(delay)             # 让位，模拟网络等待
    print(f"  fetch {url} 完成")
    return f"<html:{url}>"

# 模拟异步解析
async def parse(html):
    print(f"  parse 开始")
    await asyncio.sleep(0.02)             # 让位，模拟 CPU+IO
    print(f"  parse 完成")
    return f"parsed({html})"

# 串联 fetch 与 parse
async def crawl(url):
    html = await fetch(url)                # await 协程 fetch
    data = await parse(html)               # await 协程 parse
    return {"url": url, "data": data}

# 顶层编排：并发爬取多个 URL
async def main():
    urls = ["http://a.com", "http://b.com", "http://c.com"]
    # create_task 让多个 crawl 并发执行（create_task 篇会详讲）
    tasks = [asyncio.create_task(crawl(u)) for u in urls]
    # await 每个任务，收集结果
    results = []
    for t in tasks:
        results.append(await t)
    return results

results = asyncio.run(main())
for r in results:
    print(r)
# 输出（三路并发，总耗时约 max(0.05+0.02) 而非 3×）：
#   fetch http://a.com 开始
#   fetch http://b.com 开始
#   fetch http://c.com 开始
#   fetch http://a.com 完成
#   parse 开始
#   fetch http://b.com 完成
#   parse 开始
#   fetch http://c.com 完成
#   parse 开始
#   parse 完成
#   parse 完成
#   parse 完成
# {'url': 'http://a.com', 'data': 'parsed(<html:http://a.com>)'}
# {'url': 'http://b.com', 'data': 'parsed(<html:http://b.com>)'}
# {'url': 'http://c.com', 'data': 'parsed(<html:http://c.com>)'}
```

这个例子覆盖了本篇所有要点：`async def` 定义协程、调用协程返回协程对象、`await` 驱动协程并取返回值、`await` 链式传播（`crawl` await `fetch`/`parse`）、`create_task` 把协程交给循环并发、`asyncio.run` 作为顶层入口、让位期间事件循环跑其他任务。这也是后续 `create_task` / `gather` 篇的起点。

## 3. 最佳实践

**调用协程函数后立即驱动，绝不让协程对象悬空**

协程对象一旦创建就必须有明确去向（`await` / `create_task` / `asyncio.run`），否则就是 `was never awaited` 的隐患。

```python
import asyncio

async def save(x):
    await asyncio.sleep(0.01)
    return x

# 不推荐：创建后悬空
async def bad():
    save(1)                      # 协程对象悬空，函数体不跑，警告

# 推荐：创建即驱动
async def good():
    await save(1)                # 串行驱动
    t = asyncio.create_task(save(2))   # 或交给循环并发
    await t
```

口诀：**写了 `xxx()` 就紧接着写 `await` 或 `create_task`**。若 IDE 有 `coroutine-not-awaited` 检查（如 pyright），务必开启。

**await 表达式先赋值再用，避免在大表达式中内嵌**

`await` 是表达式，可以内嵌在更大的表达式里，但内嵌会降低可读性并增加调试难度。

```python
import asyncio

async def get_a():
    await asyncio.sleep(0.01)
    return 10

async def get_b():
    await asyncio.sleep(0.01)
    return 20

# 不推荐：await 内嵌，顺序不直观，异常栈也难看
async def bad():
    return (await get_a()) + (await get_b())

# 推荐：显式赋值，顺序清晰
async def good():
    a = await get_a()
    b = await get_b()
    return a + b
```

显式赋值让"先 await A 再 await B"的顺序一目了然，断点也更易设置。

**不要在 async def 内写长时间的同步阻塞代码**

`async def` 函数内若出现 CPU 密集或同步阻塞调用（如 `time.sleep`、`requests.get`、同步文件读写），会卡住整个事件循环——因为 `async def` 本身不会"自动让位"，只有 `await` 才让位。同步阻塞期间，事件循环无法调度其他任务，所有协程都被拖慢。

```python
import asyncio
import time

# 不推荐：async def 里有同步阻塞
async def bad_task():
    time.sleep(0.5)              # 阻塞整个事件循环 0.5s！其他协程全卡住
    return "done"

# 推荐：用异步等价物
async def good_task():
    await asyncio.sleep(0.5)     # 让位，其他协程能跑
    return "done"

# CPU 密集：用 run_in_executor 委托线程/进程池
async def cpu_bound():
    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(None, heavy_compute, data)
    return result

def heavy_compute(data):
    # 同步 CPU 密集计算
    return sum(data)
```

记住"`async def` 不等于并发"——没有 `await` 的 `async def` 就是一段"被伪装成协程的同步代码"，它会独占事件循环直到函数体跑完。

**区分 await 协程 与 await Task**

`await coro()` 是就地驱动一个协程，不会与其他事情并发（除非该协程内部 `await` 让位期间有别的任务在跑）。`await asyncio.create_task(coro())` 是先让事件循环并发调度它，再 `await` 等它完成。

```python
import asyncio
import time

async def work(n):
    await asyncio.sleep(0.1)
    return n

# 串行：3 次串行 await，总耗时约 0.3s
async def serial():
    start = time.monotonic()
    a = await work(1)
    b = await work(2)
    c = await work(3)
    return (a, b, c, round(time.monotonic() - start, 2))

# 并发：3 个 create_task 后 await，总耗时约 0.1s
async def concurrent():
    start = time.monotonic()
    t1 = asyncio.create_task(work(1))
    t2 = asyncio.create_task(work(2))
    t3 = asyncio.create_task(work(3))
    a = await t1
    b = await t2
    c = await t3
    return (a, b, c, round(time.monotonic() - start, 2))

async def main():
    print(await serial())       # 输出形如：(1, 2, 3, 0.3)
    print(await concurrent())   # 输出形如：(1, 2, 3, 0.1)

asyncio.run(main())
```

何时用 `await coro`：只关心这一件事的结果、不需要并发。何时用 `create_task + await`：需要与其他协程并发。混淆二者是性能 bug 的常见来源。

**不要重复 await 同一个协程对象**

协程对象是一次性的：`await` 到结束后内部状态已耗尽，再次 `await` 同一个对象会报 `RuntimeError: cannot reuse already awaited coroutine`。

```python
import asyncio

async def work():
    return 1

async def main():
    c = work()
    print(await c)              # 输出：1
    try:
        await c                 # 再次 await 同一个对象
    except RuntimeError as e:
        print("报错:", e)        # 输出：报错: cannot reuse already awaited coroutine

asyncio.run(main())
```

如果需要"多次执行同一逻辑"，应多次调用协程函数得到新对象：

```python
import asyncio

async def work():
    return 1

async def main():
    print(await work())         # 新协程对象
    print(await work())         # 又一个新协程对象
    # 输出：
# 1
# 1
```

**顶层只调用一次 asyncio.run**

`asyncio.run` 每次都会创建并关闭一个事件循环。在同一个程序里反复 `asyncio.run` 会创建多个事件循环，开销大且容易让 Task/Future 跨循环失效。

```python
import asyncio

async def step(n):
    await asyncio.sleep(0.01)
    return n

# 不推荐：多次 asyncio.run
# def bad():
#     asyncio.run(step(1))
#     asyncio.run(step(2))
#     asyncio.run(step(3))

# 推荐：用一个 async def 串联，顶层一次 run
async def all_steps():
    return [await step(i) for i in range(3)]

print(asyncio.run(all_steps()))   # 输出：[0, 1, 2]
```

把多个顶层协程合并到一个 `async def main` 里，再 `asyncio.run(main())`，是标准结构。

**协程函数命名与类型提示**

为协程函数加类型提示，返回类型标注为 `T`（`return` 值类型），而非 `Coroutine[...]`——Python 的静态检查器理解 `async def f() -> T` 中 `await f()` 的结果是 `T`。

```python
import asyncio

# 推荐：返回类型写业务值类型
async def fetch_user(uid: int) -> dict:
    await asyncio.sleep(0.01)
    return {"id": uid}

async def main() -> None:
    u: dict = await fetch_user(1)   # 静态检查器能推出 u: dict
    print(u)

asyncio.run(main())
```

不要写成 `async def fetch_user(uid: int) -> Coroutine[Any, Any, dict]`——虽然语义没错，但啰嗦且 `await` 后的类型推断不如直接写 `dict` 清晰。

## 4. 原理

### 4.1 async def 编译为带 CO_COROUTINE 标志的函数

`async def` 在编译期就把函数对象的类型标记为协程函数。Python 函数在内部由 `PyCodeObject`（代码对象）+ 函数对象表示，代码对象上有一组标志位，其中 `CO_COROUTINE`（0x100）标记"这是原生协程函数"。当解释器执行到 `async def f(): ...` 定义时，创建的函数对象就携带这个标志。

```python
import asyncio
import dis

async def coro_func():
    return 1

def normal_func():
    return 1

# 检查代码对象标志位
print(hex(coro_func.__code__.co_flags))      # 含 0x100（CO_COROUTINE）
print(hex(normal_func.__code__.co_flags))    # 不含 0x100

# CO_COROUTINE = 0x100；可通过位与判断
CO_COROUTINE = 0x100
print(bool(coro_func.__code__.co_flags & CO_COROUTINE))    # True
print(bool(normal_func.__code__.co_flags & CO_COROUTINE)) # False
```

`CO_COROUTINE` 标志带来的行为差异：当这样一个函数被**调用**时，解释器不会像普通函数那样执行函数体，而是构造一个 coroutine 对象并返回。coroutine 对象内部持有该函数的代码对象、调用时绑定的参数、以及一个尚未初始化的帧（frame）。

**调用返回 coroutine 对象，持帧未执行**

```python
import asyncio

async def f(x):
    return x + 1

c = f(10)
print(type(c))                 # <class 'coroutine'>
# coroutine 对象刚开始时，cr_frame（其内部帧）尚未执行第一条字节码
# 可以观察到它处于"created"而非"started"状态
print(c)                        # <coroutine object f at 0x...>
# 通过 inspect 观察协程状态
import inspect
print(inspect.getcoroutinestate(c))   # 输出：CORO_CREATED

# 驱动它
async def main():
    return await c

print(asyncio.run(main()))      # 输出：11
# 现在 c 已完成
print(inspect.getcoroutinestate(c))   # 输出：CORO_CLOSED
```

coroutine 对象有四种状态：`CORO_CREATED`（已创建未启动）、`CORO_RUNNING`（正在执行）、`CORO_SUSPENDED`（在 await 处挂起）、`CORO_CLOSED`（已结束/取消）。`f(10)` 拿到的协程对象初始处于 `CORO_CREATED`，其内部帧 `cr_frame` 已分配但指令指针还没动过——这正是"调用不执行"的实现层面表现。

### 4.2 await 在字节码上如何让位：GET_AWAITABLE + SEND/YIELD_VALUE

`await expr` 在字节码层面展开为一组指令的组合。不同 Python 版本具体指令有差异（3.11 引入 `SEND`，3.12 进一步调整特化指令），但核心语义一致。以概念性描述为准，`await expr` 大致对应：

1. **求值 `expr`** 得到一个对象 `obj`。
2. **`GET_AWAITABLE`**：检查 `obj` 是否是 awaitable。如果 `obj` 是协程/Task/Future（实现了 `__await__`），直接用；如果不是 awaitable 但当前是协程上下文，Python 3.11+ 会尝试把生成器兼容地视为 awaitable（历史包袱），否则抛 `TypeError: object X can't be used in 'await' expression`。`GET_AWAITABLE` 的产出是一个"可迭代对象"（`__await__` 返回的迭代器，或协程自身的帧迭代器）。
3. **`SEND` / `YIELD_VALUE`**：把控制权交回事件循环。具体地，协程通过 `YIELD_VALUE`（3.11 后语义等同把当前帧挂起并把一个值送出给驱动者）把 `awaitable` 的"未完成"信号送出给事件循环；事件循环据此知道这个协程要等这个 awaitable。
4. **循环驱动 awaitable 完成**：事件循环在后台驱动 awaitable（例如对 Task 就是继续运行它内部的协程，对 Future 就是等 `set_result`）。awaitable 完成后，事件循环用 `SEND` 把结果作为"send 值"送回协程，协程在 `await` 处恢复，`await` 表达式取到结果。
5. **若 awaitable 抛异常**：事件循环用 `THROW` 把异常注入协程当前挂起点，协程在 `await` 处抛出该异常。

**用 dis 观察 await 的字节码**

```python
import dis
import asyncio

async def demo():
    x = await asyncio.sleep(0.01)
    return x

# 反汇编（3.11+ 会看到 SEND/GET_AWAITABLE 等指令）
dis.dis(demo)
# 输出形如（具体指令随版本变化）：
# ... GET_AWAITABLE ...
# ... SEND ...
# ... YIELD_VALUE 或 JUMP ...
# ... RETURN_VALUE ...
```

不同版本输出细节不同，但应能看到 `GET_AWAITABLE` 这一关键指令——它就是"`await` 后面必须是 awaitable"检查的实现点。

**与生成器 yield 的同源机制**

`async def` 协程与生成器在字节码层面共享 `YIELD_VALUE` 指令（及 `SEND` 等调度指令）。这不是巧合：原生协程在 Python 内部就是"受限的生成器"——它保留了生成器的"挂起帧/恢复帧"能力，但禁止了 `yield` 语法（协程内写 `yield` 会报 `SyntaxError: 'yield' inside async function`，3.6 起严格禁止），改用 `await` 作为唯一让位方式。`YIELD_VALUE` 在协程语义下表示"把控制权交回事件循环"，在生成器语义下表示"把一个值送给调用方并挂起"——同一指令，两种语义。

```python
import asyncio
import dis

async def coro_demo():
    await asyncio.sleep(0.01)

def gen_demo():
    yield 1

# 两者的字节码里都能看到 YIELD_VALUE / SEND 等让位指令家族
# 这正是"协程继承自生成器机制"在实现层面的证据
```

历史上（PEP 342、PEP 380），生成器经 `yield` + `send` 演化为"可双向传值的协程"，`yield from` 提供委托通道，PEP 492 把这套机制封装为 `async def` + `await`，禁止了普通 `yield` 以划清界限。理解这一点，就能明白为什么 `await` 与 `yield from` 语义如此相近（见 yield_from 委托篇）。

### 4.3 事件循环如何驱动 awaitable 并用 SEND 恢复协程

`await` 让位后，协程对象的帧挂起在 `await` 字节码处，状态变为 `CORO_SUSPENDED`。它交回事件循环的是一个 awaitable（通常是被包装成 Task 的子协程，或 Future）。事件循环的工作就是：找到让位时的 awaitable，驱动它，等它完成后用 `send(result)` 恢复原协程。

**对 Task 类型的 awaitable**

`asyncio.Task` 是对协程的封装，自身实现了 `__await__`。当协程 A `await task_B` 时，`task_B.__await__` 返回的迭代器会一直 yield（让位）直到 `task_B` 内部协程完成。事件循环在每次循环迭代中：

1. 从"就绪队列"取一个可运行任务推进一小步（`task.__step()`，本质是对内部协程 `coro.send(None)` 或 `coro.send(value)`）。
2. 若该任务内部协程又 `await` 了别的 awaitable，任务把自己挂到那个 awaitable 的完成回调上，交出执行权。
3. 当某个 awaitable 完成（如 `Future.set_result`），其回调把关联任务重新放回就绪队列。
4. 循环往复，直到 `task_B` 内部协程 `return`——此时 `task_B` 完成，触发 A 的恢复，事件循环把 `task_B` 的结果 `send` 给 A 协程，A 从 `await` 处继续。

**对 Future 类型的 awaitable**

Future 没有内部协程，只表示"将来会有结果"。协程 `await fut` 时，`fut.__await__` 会 yield（让位），并保证 `fut` 被设结果时通过回调恢复协程。当外部代码 `fut.set_result(value)`，事件循环把 `value` 作为 `send` 的参数恢复等待 `fut` 的协程。

**对裸协程的 await**

`await coro_obj`（没有 `create_task` 包装）时，当前协程直接驱动 `coro_obj`——相当于当前协程"接管"了 `coro_obj` 的执行，`coro_obj` 的每一次 `await` 让位都会沿调用栈向上把控制权交给当前协程的事件循环。这种模式下没有额外的 Task 调度层，但也不会与其他任务并发（除非 `coro_obj` 内部让位期间循环跑别的任务）。这与 `yield from` 的"就地委托"机制同源。

**简化的驱动模型**

下面用概念性伪代码近似事件循环驱动一个协程到完成的过程（仅帮助理解，不是真实实现）：

```python
# 伪代码：事件循环驱动协程的概念模型
def run_until_complete(coro):
    # 第一次必须 send(None) 启动协程
    send_value = None
    while True:
        try:
            # coro.send 推进协程到下一个 await 让位点
            awaitable = coro.send(send_value)
        except StopIteration as e:
            return e.value          # 协程 return 值藏在 StopIteration.value

        # awaitable 是协程 await 时交回的对象（Task/Future/协程）
        # 事件循环这里会去驱动 awaitable（可能调度别的任务），
        # 等 awaitable 完成后把结果作为下一次 send 的值
        send_value = drive_awaitable_until_done(awaitable)
```

这个模型揭示了几个关键点：

- 协程的 `return` 值同样藏在 `StopIteration.value` 中——与生成器一致。
- 每次 `coro.send(value)` 都把协程推进到下一个 `await` 让位点（或结束）。
- `await` 交回的 `awaitable` 是"当前协程需要等待的东西"，事件循环去驱动它。
- 协程自己不会"主动推进"——它完全是被事件循环 `send` 一步步推进的。

这与生成器被 `next`/`send` 推进的模型同构。区别在于：生成器的 `yield` 把一个值送给调用方并挂起；协程的 `await` 把一个 awaitable 送给事件循环并挂起。前者关心"产出值"，后者关心"等待结果"。

### 4.4 await 只允许在协程内的编译期检查

`await` 必须在 `async def` 内——这条规则由编译器在编译期保证，而非运行期。

**编译期检查的实现**

Python 编译器在解析 `await expr` 时，会检查当前的"语法作用域栈"是否处于一个协程函数内。如果当前最近的函数定义是 `async def`，`await` 合法；如果是普通 `def` 或模块顶层，直接 `SyntaxError: 'await' outside async function`。

```python
# 这段代码如果保存为 .py 文件并尝试导入/运行，
# 编译期就会失败，不会执行任何代码

# def normal():
#     await something()    # SyntaxError: 'await' outside async function
```

由于是编译期错误，文件**都无法**作为模块导入，更不会运行。这意味着：把 `await` 写错地方不会产生半执行的程序——要么全对，要么编译失败。这是 Python 设计者刻意选择的强约束，保证了"`await` 一定在协程中"这一不变量永不破坏。

**嵌套函数中的 await 归属**

```python
import asyncio

async def outer():
    # 内层是 async def，await 合法
    async def inner():
        await asyncio.sleep(0.01)
    await inner()

    # 内层是普通 def，await 非法（编译失败）
    # def inner_sync():
    #     await asyncio.sleep(0.01)   # SyntaxError
```

`await` 的合法性由"最近的包围函数是否为 `async def`"决定，与词法嵌套层级无关。即使外层是 `async def`，内层普通 `def` 里仍不能用 `await`。这避免了"`await` 在异步外衣下偷偷同步执行"的混淆。

**推导式与 lambda 中的 await**

```python
import asyncio

async def work(i):
    await asyncio.sleep(0.01)
    return i

async def main():
    # 列表推导式内的 await：合法，外层是 async def
    results = [await work(i) for i in range(3)]
    print(results)                # 输出：[0, 1, 2]

    # lambda 内的 await：非法（lambda 是普通函数）
    # f = lambda x: await x       # SyntaxError: 'await' outside async function

asyncio.run(main())
```

列表/集合/字典推导式内的 `await` 合法性取决于外层函数是否为 `async def`。`lambda` 是普通函数，其内部不能用 `await`——这是 Python 3 一直坚持的约束（异步 lambda 的提议至今未被接受）。

### 4.5 await 与生成器 yield 的机制传承

原生协程（`async def`）与生成器（`def + yield`）在实现上共享同一套"挂起帧/恢复帧"机制。这一节梳理传承关系，帮助理解 `await` 的本质。

**共享的帧挂起/恢复机制**

生成器执行到 `yield v` 时，解释器把当前帧（指令指针、局部变量、栈）冻结，把 `v` 返回给调用方，生成器对象内部保留这个冻结的帧。调用方 `next(gen)` 或 `gen.send(x)` 时，解释器恢复帧，从 `yield` 处继续，`yield` 表达式的值就是 `send` 传入的 `x`（或 `None`）。

协程执行到 `await a` 时，解释器同样冻结当前帧，把 `a` 交给事件循环，协程对象保留冻结的帧。事件循环 `coro.send(result)` 恢复帧，从 `await` 处继续，`await` 表达式的值就是 `send` 传入的 `result`。

两者在帧操作层面几乎相同：冻结帧 → 返回/交出值 → 恢复帧 → 接收 send 值。差异只在"交出的是什么"与"谁负责恢复"：

| 维度 | 生成器 `yield v` | 协程 `await a` |
|------|-----------------|---------------|
| 交出的对象 | 一个值 `v`（给调用方） | 一个 awaitable `a`（给事件循环） |
| 谁恢复 | 调用方 `next`/`send` | 事件循环 `send`（awaitable 完成后） |
| 恢复时送入的值 | `send(x)` 的 `x` | awaitable 的结果 |
| 让位语义 | "我产出一个值，暂停" | "我要等 a 完成，暂停" |
| 共享指令 | `YIELD_VALUE` / `SEND` | `YIELD_VALUE` / `SEND` |

**历史演进：yield → yield from → await**

- PEP 342（Python 2.5）：给生成器加 `send`/`throw`/`close`，使生成器可双向传值，具备协程雏形。
- PEP 380（Python 3.3）：`yield from` 提供生成器委托通道，可在协程间转发 send/throw/close 并接收 return 值——这是早期 asyncio（`@asyncio.coroutine` + `yield from`）的基础。
- PEP 492（Python 3.5）：引入 `async def` + `await`，把协程机制从生成器语法中分离出来。`await` 在语义上等价于 `yield from`，但加了约束：只接受 awaitable，且只能在 `async def` 内用；同时禁止协程内 `yield`，划清与生成器的界限。
- Python 3.6+：进一步禁止 `async def` 内使用 `yield`（3.6 起的 `async generator` 是另一个独立概念，用 `async def + yield` 定义，但那是异步生成器而非协程）。

**为什么要有 await 而不继续用 yield from**

`yield from` 接受任意可迭代对象，语义偏"产出委托"；协程需要的是"等待结果"而非"产出值"。用 `await` 明确表达"我在等"而非"我在产出"，并限定操作数为 awaitable，让协程代码的意图更清晰。同时 `async def` 的 `CO_COROUTINE` 标志让解释器与框架能明确区分协程与生成器，避免 `@asyncio.coroutine` 那种"装饰器伪装"的模糊。`await` 的引入是语义层面的澄清，而非全新机制——底层仍是帧的挂起/恢复。

### 4.6 async def 内禁止 yield 的设计理由

原生协程内写 `yield` 会 `SyntaxError: 'yield' inside async function`。这条禁令有其设计理由。

**避免语义混淆**

如果协程内允许 `yield v`，那么协程既是"可被 await 等待的"又是"可被 next 取值的"——它同时是协程和生成器，调用方无法判断该用 `await` 还是 `next`。这种双重身份会让异步代码难以理解。Python 选择划清界限：

- `async def + await`：原生协程，只能被 `await` 驱动。
- `def + yield`：生成器，用 `next`/`send` 驱动。
- `async def + yield`：异步生成器（async generator），用 `async for` 驱动，是另一种独立对象（`async generator`，不是 coroutine）。

三者各司其职，互不混淆。

**异步生成器是另一个概念**

如果确实需要在异步上下文里"产出值流"，用异步生成器：`async def + yield`。它返回的是 `async generator` 对象，用 `async for` 消费，不是 coroutine，不能被 `await`。这超出了本篇范围，提一句以示区分。

```python
import asyncio

# 这是异步生成器，不是协程——合法
async def async_gen():
    for i in range(3):
        await asyncio.sleep(0.01)
        yield i

async def main():
    async for x in async_gen():     # 用 async for 消费
        print(x)

asyncio.run(main())
# 输出：
# 0
# 1
# 2
```

异步生成器综合了"异步等待"与"流式产出"，但它是独立机制。本篇讨论的 `async def` 默认指"原生协程"（函数体内无 `yield`，可被 `await`），不含异步生成器。

## 5. 总结

### 5.1 本文内容要点

- **`async def` 定义协程函数**：用 `async def` 声明的函数是协程函数，调用它**不执行函数体**，而是返回一个 coroutine 对象（协程对象）。函数体要等协程对象被 `await` / `asyncio.create_task` / `asyncio.run` 驱动才会执行。
- **`async def` 函数内可直接 `return` 值**：该值不是直接交给调用方，而是通过 `await` 表达式被捕获（`result = await coro()`），与生成器 `return` 藏于 `StopIteration.value` 同源。
- **`await expr` 暂停当前协程**：把控制权连同被等待对象交回事件循环，等 awaitable 完成后恢复协程，`await` 表达式的值就是 awaitable 的结果。
- **awaitable（可等待对象）三种**：协程（coroutine）、任务（Task）、未来（Future），都实现 `__await__` 协议。`await` 协程=就地驱动其执行；`await` Task=等待已在循环中调度的任务；`await` Future=等待外部 `set_result`。
- **`await` 只能在 `async def` 内使用**：这是编译期检查，违反则 `SyntaxError: 'await' outside async function`，文件无法导入。嵌套普通函数里也不能用 `await`。
- **`await` 后必须跟 awaitable**：跟普通值/普通函数返回值/协程函数本身（非协程对象）会运行时 `TypeError: object X can't be used in 'await' expression`。
- **协程必须被驱动才会运行**：只调用协程函数不 `await`/`create_task`/`asyncio.run`，函数体不执行，且协程对象被 GC 时报 `RuntimeWarning: coroutine '...' was never awaited`。
- **`await` 的链式传播**：协程 A `await` 协程 B 时，B 的每次让位沿链向上交给事件循环，B 完成后返回值沿链向下交回 A；异常也沿链向外冒泡，与调用栈一致。
- **常见错误**：忘 `await` 导致协程未运行（`was never awaited` 警告，业务静默失败）；在同步 `def` 里用 `await`（`SyntaxError`，文件无法编译）；把同步阻塞调用放进 `async def`（卡住事件循环，拖慢所有协程）。
- **原理**：`async def` 编译为带 `CO_COROUTINE` 标志的函数，调用返回 coroutine 对象（持帧未执行）；`await` 在字节码上经 `GET_AWAITABLE` 校验 awaitable、用 `YIELD_VALUE`/`SEND` 把控制权与 awaitable 交回事件循环，循环驱动 awaitable 完成后用 `send(result)` 恢复协程并送上结果；`await` 的合法性由编译期作用域检查保证；与生成器 `yield` 共享帧挂起/恢复机制（`YIELD_VALUE`/`SEND` 同源），`await` 是 `yield from` 的协程特化版本。

### 5.2 读完本文你应能掌握

- 能说明 `async def` 函数与普通 `def` 函数在调用行为、返回对象、可用语法三方面的差异，并解释"调用协程函数不执行函数体"的实现原因。
- 能用 `asyncio.iscoroutinefunction` / `asyncio.iscoroutine` 正确判断协程函数与协程对象，避免把协程对象当普通返回值使用。
- 能说明 `await expr` 的三步语义（求值 awaitable、暂停交回循环、恢复取结果），并据此解释一段 `await` 链代码的执行顺序与让位点。
- 能列举可等待对象的三种（coroutine / Task / Future），说明 `await` 协程与 `await` Task 的差别（就地驱动 vs 等待已调度任务），并知道何时用 `create_task` 实现并发。
- 能识别并修正"忘 await 协程"的错误（看到 `coroutine was never awaited` 警告即回查）、"同步函数里用 await"的错误（`SyntaxError`）、"await 非 awaitable"的错误（`TypeError`）。
- 能编写 `async def A await async def B` 的调用链，正确通过 `return` 和 `await` 传递结果与异常，并用 `asyncio.run` 作为顶层入口运行。
- 能从字节码层面说明 `async def` 的 `CO_COROUTINE` 标志、`await` 的 `GET_AWAITABLE`+`SEND`/`YIELD_VALUE` 让位机制、事件循环用 `send(result)` 恢复协程的过程，以及 `await` 与生成器 `yield` 的机制传承关系。
- 能说明 `await` 只能在 `async def` 内是编译期检查、`async def` 内禁止 `yield` 的设计理由（划清协程与生成器界限，避免语义混淆），并区分原生协程与异步生成器。