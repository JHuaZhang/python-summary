---
group:
  title: 【17】生成器与迭代器
  order: 17
order: 1
title: yield 生成器定义
nav:
  title: Python基础
  order: 1
---

> 本篇是「生成器与迭代器」系列的开篇。目标是建立最核心的认知：`yield` 不是"返回一个值"，而是"暂停执行 + 产出值 + 保存全部状态"。理解了这三件事，后续的 `send`、`yield from`、协程式生成器都只是在这个状态机上的扩展。

## 1. 介绍

### 1.1 什么是生成器函数

普通函数的执行模型是"调用即执行，执行完即返回"：你写下 `def f(): ...`，调用 `f()` 时解释器进入函数体，自上而下逐行执行，遇到 `return` 把结果交还给调用者，函数的局部变量、执行位置随之销毁。下一次再调用 `f()`，是一次全新的执行，上一次的状态早已不存在。

只要函数体里出现了一个 `yield` 关键字（哪怕这个 yield 在一个永远不会被走到分支里），这个函数的性质就彻底变了：它不再是一个普通函数，而是一个**生成器函数（generator function）**。调用生成器函数时，解释器**不会执行函数体里的任何一行代码**，而是立即构造并返回一个**生成器对象（generator object）**。真正的函数体执行，被推迟到你对这个生成器对象调用 `next()` 的那一刻。

```python
def count_three():
    print("进入函数体")
    yield 1
    print("第一次恢复")
    yield 2
    print("第二次恢复")
    yield 3
    print("即将结束")

gen = count_three()          # 调用生成器函数
print("调用完毕，函数体没执行")
# 输出：调用完毕，函数体没执行
```

上面这段代码运行后，你会先看到"调用完毕，函数体没执行"，而"进入函数体"那一行**根本没被打印**。这就是生成器函数和普通函数最直观的差异：调用它不等于执行它。函数体被"冷冻"在生成器对象里，等着你用 `next()` 去"解冻"它一步步往前走。

### 1.2 yield 的基本语法与最小用法

`yield` 的语法形式很简单，就是 `yield <表达式>`，后面跟一个值（或变量、表达式）。它的语义可以浓缩成一句话：**执行到这里暂停，把 `yield` 后面的值产出去给调用者，同时把当前全部状态冻结起来，等下一次 `next()` 时从这里接着走。**

```python
def squares(n):
    """逐个产出 1..n 的平方"""
    for i in range(1, n + 1):
        yield i * i

gen = squares(3)
print(next(gen))   # 第一次 next：执行到第一个 yield，产出 1
# 输出：1
print(next(gen))   # 第二次 next：从上次暂停处恢复，循环到下一个 yield，产出 4
# 输出：4
print(next(gen))   # 第三次 next：产出 9
# 输出：9
print(next(gen))   # 第四次 next：循环结束、函数体走完，抛出 StopIteration
# 输出：StopIteration
```

几个要点先记住：

- `squares(3)` 这个调用本身什么都没算，它只是"造"了一个生成器对象赋给 `gen`。
- 每一次 `next(gen)` 让函数体往前走，走到下一个 `yield` 就停下，把 `yield` 后面的值作为这一次 `next()` 的返回值交出去。
- 当函数体真正走完（自然结束或遇到 `return`），再 `next()` 会抛 `StopIteration`，表示"这个生成器没东西可产了"。
- 生成器对象实现了迭代器协议（`__iter__` / `__next__`），所以可以直接用 `for` 循环遍历，`for` 会自动帮你调 `next()` 并在 `StopIteration` 时收尾。

这就是生成器函数最基础的形态。本章剩下的小节会把这个"调用不执行、next 才前进、yield 暂停并产出"的模型再拆细。

### 1.3 生成器对象是什么

调用生成器函数得到的是一个**生成器对象**，它是一个独立的、实现了迭代器协议的对象，和函数本身、和其他生成器对象互不干扰。

```python
def echo():
    yield "A"
    yield "B"

g1 = echo()
g2 = echo()
print(g1 is g2)        # 两个独立的生成器对象
# 输出：False
print(type(g1))
# 输出：<class 'generator'>
print(g1.__iter__() is g1)   # 生成器的 __iter__ 返回自身
# 输出：True
```

可以把生成器对象理解成一个"被暂停的函数执行现场"：它内部持有这个函数调用专属的一份局部变量、一个执行到哪里的指针（上次停在哪个 yield 之后）、以及自己的调用栈帧。两个生成器对象 `g1`、`g2` 各自持有独立现场，所以它们可以各自独立地 `next()`、各自停在不同的 yield 上、互不影响。这一点在后面讲原理时会展开，现在先记住：**生成器对象 = 一个携带了独立执行现场的迭代器**。

### 1.4 普通函数与生成器函数的本质差异

用一个对照把差异讲死：

| 维度 | 普通函数 | 生成器函数（函数体含 yield） |
|---|---|---|
| 函数体何时执行 | 调用时立即执行 | 调用时不执行，首次 `next()` 时才开始 |
| 调用的返回值 | 函数体里 `return` 的值 | 一个生成器对象（函数体一行没跑） |
| 执行方式 | 一口气跑到 return 或末尾 | 遇 yield 暂停，遇 next 恢复，分多步走 |
| 局部变量生命周期 | 返回后销毁 | 暂停期间被冻结保留，恢复后继续用 |
| 终止信号 | return 值 / 隐式 return None | 抛出 `StopIteration`（return 值进 `.value`） |
| 是否可迭代 | 否（除非自己实现） | 是，天然实现迭代器协议 |

理解这张表是理解整个生成器体系的入口。后面所有进阶用法（`send`、`throw`、`close`、`yield from`）都是在"暂停-恢复-状态保留"这个骨架上加肉。

## 2. 核心内容

### 2.1 调用生成器函数：不执行，只造对象

这一节把"调用"这件事单独拎出来讲透，因为这是初学者最容易栽跟头的地方。

很多人第一次写生成器，会写成这样：

```python
def squares(n):
    for i in range(1, n + 1):
        yield i * i

# 错误直觉：以为 squares(3) 会立刻算出所有平方
result = squares(3)
print(result)
# 输出：<generator object squares at 0x10a3c2f50>
```

他们以为 `squares(3)` 会返回 `[1, 4, 9]`，结果拿到的是一个生成器对象。**生成器函数的调用永远返回生成器对象，永远不返回函数体里 yield 的值本身**。`yield` 的值是给 `next()` 用的，不是给"调用生成器函数"这个动作用的。

可以用一个小实验强化这个认知：在函数体最开头放一个 `print`，然后只调用、不 `next`。

```python
def gen():
    print("函数体开始执行")
    yield 1

g = gen()                  # 只调用，不 next
print("到这里函数体还没跑")
# 输出：到这里函数体还没跑
# 注意：「函数体开始执行」并不会被打印
```

`g = gen()` 这一行执行完后，函数体一行都没动。函数体被"封装"在 `g` 里，成为一份尚未启动的执行计划。只有当你对 `g` 调用 `next(g)` 时，这份计划才第一次开始执行。

**为什么这样设计**：这正是生成器"惰性"的根源。因为调用不执行，你可以先造一个生成器对象放着，等到真正需要数据时再驱动它。如果调用即执行，那生成器就退化成了普通函数，无法实现"按需产出、用一点算一点"。

### 2.2 next(gen)：驱动执行到下一个 yield

`next(gen)` 是驱动生成器前进的油门。每一次 `next()` 做的事情可以分成四步：

1. 恢复生成器冻结的执行现场（局部变量、执行位置、栈帧）。
2. 从上次暂停的位置继续往下执行函数体。
3. 遇到下一个 `yield <表达式>` 时，把表达式的值作为本次 `next()` 的返回值产出去。
4. 在该 `yield` 处再次冻结执行现场，挂起函数，等待下一次 `next()`。

```python
def steps():
    print("  [启动]")
    yield "第一步"
    print("  [中间]")
    yield "第二步"
    print("  [收尾]")

g = steps()
print("第1次 next:")
v = next(g)
print(f"  -> 得到 {v}")
# 输出：
# 第1次 next:
#   [启动]
#   -> 得到 第一步

print("第2次 next:")
v = next(g)
print(f"  -> 得到 {v}")
# 输出：
# 第2次 next:
#   [中间]
#   -> 得到 第二步

print("第3次 next:")
v = next(g)
print(f"  -> 得到 {v}")
# 输出：
# 第3次 next:
#   [收尾]
#   -> 得到 StopIteration（因为函数体走完后没有 yield 了）
```

注意第三次 `next()`：函数体打印完 `[收尾]` 之后，下面没有 yield 了，函数自然结束，于是 `next()` 抛出 `StopIteration`。所以上面那段为了不报错，第三次其实要写成：

```python
try:
    v = next(g)
except StopIteration:
    print("  -> 生成器已耗尽")
# 输出：
# 第3次 next:
#   [收尾]
#   -> 生成器已耗尽
```

一个常被忽略的点：**yield 产出的值是它后面那个表达式的值，不是 yield 语句本身的"返回值"**。从调用者视角看，`next(g)` 拿到的就是 yield 后面那个表达式求值的结果；从函数体内部视角看，yield 语句本身没有"产出值"这个概念——yield 是一个动作（暂停 + 交出值），不是表达式求值（后面讲 `send` 时会补充 yield 作为表达式的另一面，本篇先按基础用法理解）。

**多次 next 之间的状态连续性**是生成器的精髓。下面这个例子演示"暂停期间局部变量被保留"：

```python
def accumulator():
    total = 0
    while True:
        total += 1
        yield total           # 每次暂停时 total 的当前值被冻结

g = accumulator()
print(next(g))   # 输出：1
print(next(g))   # 输出：2
print(next(g))   # 输出：3
# 每次恢复时 total 接着上次的值加 1，说明变量在暂停期间一直保留
```

如果 `total` 在每次 yield 后被销毁，就不可能累加。这正是生成器和普通函数在语义上的分水岭。

### 2.3 yield 的暂停与状态保存

这一节专门讲"暂停时到底保存了什么"，因为这是生成器能"接着上次跑"的底层原因。

yield 暂停时，生成器对象会把当前函数调用的**完整执行现场**冻结起来，至少包括：

- **全部局部变量**的当前值（包括函数参数、循环变量、临时变量）。
- **执行位置**：解释器停在函数字节码的哪一条指令上（具体说是某个 yield 之后的那条指令）。
- **调用栈帧**：当前的栈帧结构、异常处理表状态等。
- **求值栈**：正在计算中的中间状态（比如一个多层嵌套表达式算到一半）。

恢复时，这些状态被原样还原，函数体就像从未被打断过一样继续往后走。

```python
def mixed():
    a = 10
    b = 20
    yield a + b           # 暂停点 1：此时 a=10, b=20 被冻结
    a *= 100
    yield a + b           # 恢复后 a 变成 1000，b 仍是 20
    b *= 100
    yield a + b           # 恢复后 b 变成 2000

g = mixed()
print(next(g))   # 输出：30    (10 + 20)
print(next(g))   # 输出：1020  (1000 + 20)
print(next(g))   # 输出：3000  (1000 + 2000)
```

可以看到 `a` 和 `b` 在多次暂停-恢复之间的变化是连续的：第一次 next 后 `a=10,b=20` 被冻住；第二次 next 恢复这个现场，执行 `a *= 100` 让 `a` 变 1000，再 yield；第三次 next 又恢复 `a=1000,b=20`，执行 `b *= 100` 让 `b` 变 2000，再 yield。如果说普通函数的局部变量是"用完即弃"的草稿纸，生成器的局部变量就是一份被书签标记着读到哪一页的正在读的书。

**循环变量也会被保存**，这是生成器能实现"分步遍历"的关键：

```python
def page_numbers():
    for page in [1, 2, 3]:
        yield f"第 {page} 页"

g = page_numbers()
print(next(g))   # 输出：第 1 页   （page=1 被冻结）
print(next(g))   # 输出：第 2 页   （恢复后 for 循环接着走，page 变 2）
print(next(g))   # 输出：第 3 页
```

如果循环变量 `page` 没被保存，第二次 next 时 for 循环就不可能知道"上次走到第 1 页、这次该走第 2 页"。

### 2.4 for 循环与迭代器协议

每次手写 `next()` 再 `try/except StopIteration` 太繁琐。好在上文提过：生成器对象天然实现了迭代器协议，也就是 `__iter__` 和 `__next__` 两个方法。`for` 循环正是基于这两个方法工作的，所以生成器可以直接被 `for` 遍历。

```python
def squares(n):
    for i in range(1, n + 1):
        yield i * i

for sq in squares(4):
    print(sq)
# 输出：
# 1
# 4
# 9
# 16
```

`for` 循环在背后做了这几件事：

1. 对 `squares(4)` 返回的生成器对象调用 `__iter__()`，拿到一个迭代器（生成器对象的 `__iter__` 返回自身）。
2. 反复调用 `__next__()`，把每次产出的值赋给 `sq`。
3. 一旦 `__next__()` 抛 `StopIteration`，`for` 自动捕获并结束循环，不会把异常向上抛。

所以上面这段 `for` 等价于这样的手写形式：

```python
_gen = squares(4)
while True:
    try:
        sq = next(_gen)
    except StopIteration:
        break
    print(sq)
# 输出：
# 1
# 4
# 9
# 16
```

正因为生成器对象自己是迭代器，它还可以喂给任何接收可迭代对象的内置函数：

```python
print(list(squares(4)))      # 输出：[1, 4, 9, 16]
print(sum(squares(4)))       # 输出：30
print(tuple(squares(3)))     # 输出：(1, 4, 9)
print(sorted(squares(4), reverse=True))   # 输出：[16, 9, 4, 1]
```

注意：`list(...)`、`sum(...)` 这类函数会**把生成器彻底耗尽**——它们内部就是对生成器不停 `next()` 直到 `StopIteration`。耗尽之后的生成器对象就"死"了，再 `next()` 只会继续抛 `StopIteration`，不会重新启动。

```python
g = squares(3)
print(list(g))    # 输出：[1, 4, 9]   ← 生成器被耗尽
print(list(g))    # 输出：[]          ← 再列一次就是空，因为已经没东西可产
```

**一个生成器对象只能用一轮**，这是它和 `range`、`list` 这类可重复迭代的对象的重要区别。要再来一轮，只能重新调用生成器函数造一个新的生成器对象。

### 2.5 函数末尾与 return：StopIteration 的触发

当生成器函数的函数体走到末尾（没有更多 yield 可执行），或者显式遇到 `return`，生成器就进入"终止"状态：再 `next()` 会抛 `StopIteration`。

没有 return 的末尾终止最常见：

```python
def finite():
    yield 1
    yield 2
    # 函数体到此结束，隐式等价于 return None

g = finite()
print(next(g))   # 输出：1
print(next(g))   # 输出：2
next(g)          # 抛 StopIteration
```

`return` 在生成器里的作用也是终止迭代，但和普通函数略有不同：**生成器里的 `return <值>` 不会把这个值"返回"给调用者，而是把它塞进 `StopIteration` 异常对象的 `.value` 属性里**，同时仍触发迭代结束。

```python
def with_return():
    yield 1
    return "我结束了"

g = with_return()
print(next(g))    # 输出：1
try:
    next(g)
except StopIteration as e:
    print(f"终止，携带值: {e.value!r}")
# 输出：终止，携带值: '我结束了'
```

这个机制在早期 Python 里用得不多，但在后续 `yield from` 委托生成器、协程等场景里，`return` 携带的值会被外层捕获并使用。本篇先记住两点：

- 生成器里的 `return` 一定是"结束迭代"的信号，不会像普通函数那样把值直接交给调用者。
- `return` 后面的值（若有）进 `StopIteration.value`，没写就是 `None`。

`for` 循环会吞掉 `StopIteration`，所以 `for` 遍历生成器时 `.value` 拿不到。只有手写 `next()` 配合 `try/except` 才能读到它：

```python
def search():
    for i in range(10):
        if i == 7:
            return i          # 用 return 把"找到的结果"交给调用者
        yield i               # 否则把每个候选值 yield 出去

g = search()
collected = []
try:
    while True:
        collected.append(next(g))
except StopIteration as e:
    print(f"已收集: {collected}")
    print(f"最终结果: {e.value}")
# 输出：
# 已收集: [0, 1, 2, 3, 4, 5, 6]
# 最终结果: 7
```

这种"边 yield 边走、最终用 return 把结论带回来"的写法，是把生成器当"流式处理 + 最终汇总"用的小技巧。

### 2.6 生成器对象是惰性的

"惰性"是生成器最重要的工程价值。惰性有两层含义：

1. **调用生成器函数时不执行函数体**——造对象零成本。
2. **不 next 就不前进，next 一步走一步**——数据按需产出，用到多少算多少。

这意味着：即使底层要产出的序列是无限的，或者数据量极大，生成器本身也不占大量内存，因为任何时候它只持有"当前这一步"的状态。

```python
import sys

def infinite_counter(start=0):
    n = start
    while True:
        yield n
        n += 1

g = infinite_counter()
print(sys.getsizeof(g))   # 生成器对象本身只占百来字节
# 输出（典型值）：112
# 但它背后是一个无限的整数序列

for _ in range(5):
    print(next(g), end=" ")
print()
# 输出：0 1 2 3 4
```

如果把同样的"无限序列"用列表存，内存会立刻爆掉——你根本无法把无限个元素装进列表。生成器能这样做，正是因为它"不预存结果，只存当前状态"。

**惰性的工程价值在"大文件逐行读"这种场景最直观**。下面是一个不把整个文件读进内存、按需逐行产出的生成器：

```python
def read_lines(path):
    """逐行读取大文件，每调用一次 next 产出一行"""
    with open(path, encoding="utf-8") as f:
        for line in f:
            yield line.rstrip("\n")

# 假设 data.log 有上百万行
lines = read_lines("data.log")
for line in lines:
    if "ERROR" in line:
        print(line)
        break          # 找到第一个 ERROR 就停，后面几百万行根本不会被读
```

这个写法的好处是双重的：一是不把上百万行一次性塞进内存（`list(open(...))` 会吃掉整文件），二是循环里 `break` 提前退出时，生成器也立刻停下，剩下的行不会被白白处理。这种"用一点算一点、随时可停"的特性，是列表做不到的。

**惰性的另一面：必须被驱动才会工作**。如果你只造了生成器对象却从来不遍历它，函数体一行都不会跑：

```python
def tee():
    print("我被驱动了")
    yield 1

g = tee()
# 到这里什么都不打印，函数体没执行
next(g)
# 输出：我被驱动了
```

这带来一个常见陷阱：造了一堆生成器却不消费，你以为数据已经处理了，实际上连函数体都没进。后续在最佳实践里会再提。

### 2.7 生成器与列表的对比

把生成器和列表放在一起对比，能把"惰性"和"一次性"这两件事看得更清楚。

假设要处理前 100 万个自然数的平方：

```python
# 方式一：列表，一次性算完、全部装进内存
squares_list = [i * i for i in range(1_000_000)]
print(len(squares_list))      # 输出：1000000

# 方式二：生成器，按需产出、任何时候只在内存里存一个值
def squares_gen(n):
    for i in range(n):
        yield i * i

squares = squares_gen(1_000_000)
print(next(squares))          # 输出：0
print(next(squares))          # 输出：1
```

对照要点：

| 维度 | 列表（`[...]`） | 生成器（`yield`） |
|---|---|---|
| 何时计算 | 立即全部算完 | 每次 next 算一个 |
| 内存占用 | 与元素数量成正比 | 几乎恒定（只存当前状态） |
| 是否可重复遍历 | 是（想遍历几次都行） | 否（一轮耗尽，再遍历为空） |
| 是否可下标访问 | 是 `lst[3]` | 否（只能 next 顺序前进） |
| 适合的场景 | 需要随机访问/多次遍历/先算后用 | 数据量大/无限序列/按需处理 |

选择生成器还是列表，本质上是在"内存"和"灵活性"之间取舍：生成器省内存但只能顺序走一轮，列表能反复随机访问但吃内存。当数据量很大、只需顺序处理一次时，生成器几乎总是更优解。

### 2.8 多 yield 串联的数据流水线

生成器可以像管道一样串联：一个生成器的输出喂给另一个生成器，每一级都是惰性的，整条流水线在任何时刻都只持有当前正在处理的那个元素。

```python
def numbers():
    n = 0
    while True:
        yield n
        n += 1

def take(seq, k):
    """从 seq 里取前 k 个"""
    for i, x in enumerate(seq):
        if i >= k:
            return
        yield x

def squares(seq):
    """对 seq 每个元素求平方"""
    for x in seq:
        yield x * x

def evens(seq):
    """只保留偶数"""
    for x in seq:
        if x % 2 == 0:
            yield x

# 流水线：自然数 → 取前 10 个 → 求平方 → 筛偶数
pipeline = evens(squares(take(numbers(), 10)))
print(list(pipeline))
# 输出：[0, 4, 16, 36, 64]
```

这条流水线没有任何一个中间列表：`numbers()` 是无限的，`take` 限制了只取 10 个，`squares` 逐个平方，`evens` 逐个筛选。整条链路在任何时刻内存里都只有一两个数在流动。这正是 Unix 管道思想在 Python 里的等价物，也是后续学习 `yield from` 委托生成器、协程式数据流的基础。

## 3. 最佳实践

### 3.1 别把生成器当列表用

最常见的错误是以为生成器可以反复遍历、随机访问。实际上它一次性、只能顺序 next。

**不推荐**（会得到空结果，且很难排查）：

```python
def names():
    yield "Alice"
    yield "Bob"

g = names()
print(list(g))    # 输出：['Alice', 'Bob']
print(list(g))    # 输出：[]   ← 第二次为空，因为生成器已耗尽
```

**推荐**：需要多次遍历就重新调用生成器函数造新对象；或者如果数据不大、确实需要反复访问，直接用列表。

```python
def names():
    yield "Alice"
    yield "Bob"

print(list(names()))   # 输出：['Alice', 'Bob']
print(list(names()))   # 输出：['Alice', 'Bob']
```

如果不确定一个对象是生成器还是列表，且需要多次遍历，最稳的做法是一次性物化成列表再反复用：

```python
data = list(names())   # 物化一次，后面随便用
print(len(data), data[0], sum(1 for _ in data))
```

但物化会失去惰性，所以只在"确实要多次访问且数据量可控"时这么做。

### 3.2 造了就要消费，别让生成器空跑

生成器是惰性的，造了不消费就等于啥也没干。这种 bug 很隐蔽，因为不会报错。

**不推荐**（函数体根本没执行，你以为处理了数据其实没有）：

```python
def process(items):
    for x in items:
        yield x.upper()

data = ["a", "b"]
process(data)              # 只造了生成器对象，没 next，函数体没跑
# 没有任何输出，也没报错
```

**推荐**：要么直接 `for` 消费，要么显式 `list()` 物化，确保生成器被驱动到结束：

```python
processed = list(process(data))
print(processed)           # 输出：['A', 'B']
```

如果你写了一个生成器函数打算给别人用，建议在文档里写清楚"这是生成器，需要遍历才能生效"，降低使用者的迷惑。

### 3.3 大数据/无限序列优先用生成器

只要符合以下任一条件，生成器几乎总是比列表更合适：

- 数据量未知或可能很大（日志文件、数据库游标、网络流）。
- 序列是无限的（自然数、事件流）。
- 只需要顺序处理一遍、处理到某个条件就停。
- 需要把多级处理串成流水线，且不希望中间结果占内存。

**推荐**（逐行读、按需停）：

```python
def iter_large_log(path):
    with open(path, encoding="utf-8") as f:
        for line in f:
            yield line.rstrip("\n")

# 找到第一条 ERROR 就停，不读穿整文件
for line in iter_large_log("huge.log"):
    if "ERROR" in line:
        print(line)
        break
```

反过来，如果数据很小、需要随机访问或多次遍历，用列表更直白、更省心。不要为了"显得高级"就把所有函数都写成生成器，那样只会让简单的代码变难懂。

### 3.4 生成器函数里谨慎使用 return

在生成器里写 `return`（裸 return 或 `return <值>`）的语义是"终止迭代"。它不像普通函数那样把值交还给调用者，而是把它塞进 `StopIteration.value`，对 `for` 循环不可见。

**不推荐**（返回值丢失，调用方拿不到）：

```python
def find_first(needle, haystack):
    for i, x in enumerate(haystack):
        if x == needle:
            return i          # 以为能把下标"返回"给调用者
        yield x

# 用 for 遍历，StopIteration 被吞，return 的值无法被读到
for x in find_first("c", ["a", "b", "c", "d"]):
    print(x)
# 输出：
# a
# b
# （return 的 2 被丢掉了）
```

**推荐**：如果确实想让调用者拿到一个"最终结果"，要么用 `next()` + `try/except StopIteration` 读 `e.value`；要么干脆改用普通函数 + 显式返回值，让语义更直白：

```python
def find_index(needle, haystack):
    for i, x in enumerate(haystack):
        if x == needle:
            return i
    return -1

print(find_index("c", ["a", "b", "c", "d"]))   # 输出：2
```

简单原则：**生成器里 return 的主要用途是"提前结束迭代"，不是"返回结果"**。拿 return 当普通返回值用，语义容易错位。

### 3.5 别在生成器里吞掉异常

生成器函数体里抛出的异常，会沿着 `next()` 调用点向上传播，并使生成器进入终止状态（之后再 next 直接 StopIteration）。如果你在生成器内部 `try/except` 把异常吞了，外部调用者会以为一切正常，但生成器可能已经处于半损坏状态。

**不推荐**：

```python
def risky():
    for x in [1, 2, "oops", 4]:
        try:
            yield x + 0          # "oops" + 0 会抛 TypeError
        except Exception:
            pass                  # 吞掉，外部看不到任何异常，但已经少产出一个值

g = risky()
print(list(g))
# 输出：[1, 2, 4]   ← 看起来"正常"，其实中间出过错
```

**推荐**：要么让异常正常传播（外部 try/except），要么明确记录/转换异常，别静默吞。生成器一旦在执行中抛出未处理异常，会立刻被标记为终止，这种行为是合理的，不要去破坏它。

### 3.6 及时关闭不再使用的生成器

生成器对象持有文件句柄、网络连接等资源时，如果中途 `break` 退出 `for` 循环，生成器并未自然走到末尾，它持有的资源不会自动释放。这时应显式 `.close()` 或用 `try/finally` 确保清理。

**推荐**：

```python
def read_lines(path):
    with open(path, encoding="utf-8") as f:   # with 保证文件最终被关
        for line in f:
            yield line

g = read_lines("data.log")
try:
    for line in g:
        if "ERROR" in line:
            print(line)
            break
finally:
    g.close()    # 提前退出时主动关闭，触发生成器内部的 GeneratorExit 清理
```

`.close()` 会在生成器当前暂停的 yield 处抛入一个 `GeneratorExit` 异常，促使生成器去执行 `finally` 块、`with` 块的清理逻辑。本篇只点到为止，`close`/`throw` 的细节在后续篇章展开。

## 4. 原理

本章把前面"调用不执行、next 才前进、yield 暂停并保存状态、StopIteration 终止"这套行为，落到 CPython 解释器层面讲清楚。理解这些不是为了去改 CPython 源码，而是为了在遇到"为什么这样写能生效""为什么生成器能无限大"这类疑问时，有一个准确的底层图景，而不是停留在"魔法"层面。

### 4.1 编译期：含 yield 的函数被标记为生成器函数

`def` 写的函数在 Python 里是一段编译后的字节码对象（code object）。编译器在编译一个函数时，会扫描它的函数体：**只要函数体里出现了 `yield`（或 `yield from`），编译器就把这个函数的 code object 打上 `CO_GENERATOR` 标志位**。这个标志位记录在 code object 的 `co_flags` 里，可以用 `inspect` 查看：

```python
import inspect

def normal(x):
    return x + 1

def gen(x):
    yield x + 1

print(normal.__code__.co_flags & inspect.CO_GENERATOR)   # 0：不是生成器函数
# 输出：0
print(gen.__code__.co_flags & inspect.CO_GENERATOR)      # 非 0：是生成器函数
# 输出（典型值）：32
```

`CO_GENERATOR` 是一个位标志（值为 32）。`co_flags & 32` 非 0 表示该函数被认定为生成器函数。注意这里判断的是"函数体里有没有 yield 关键字"，和 yield 运行时是否真的被执行到无关：

```python
def unreachable_yield(x):
    if False:
        yield x          # 这行永远走不到，但函数仍是生成器函数
    return

print(unreachable_yield.__code__.co_flags & inspect.CO_GENERATOR)
# 输出（典型值）：32   ← 仍被标记
```

编译期打标志这件事解释了一个常见困惑：为什么"函数里有没有 yield"是个编译期决定，不能用运行时条件改变。你没法写"`if 条件: yield`"让同一个函数"有时是生成器有时不是"——只要函数体里出现过 yield，它就永远是生成器函数，调用它永远返回生成器对象，即使那个 yield 分支永远走不到。

这个标志位的存在，直接影响下一节"调用时"的行为分叉。

### 4.2 调用期：不执行函数体，而是用 MAKE_FUNCTION 造生成器对象

当 Python 执行到 `gen = squares(3)` 这种"调用生成器函数"的语句时，字节码层面实际发生的是：解释器用 `MAKE_FUNCTION` 指令把函数对象准备好，然后 `PRECALL/CALL` 指令去调用它。由于该函数的 code object 带有 `CO_GENERATOR` 标志，**CPython 的函数调用机制不会像普通函数那样去申请 C 栈执行字节码，而是构造一个生成器对象并立即返回**。

可以近似理解成这样的等价逻辑（伪代码）：

```python
# 伪代码：CPython 调用机制对 CO_GENERATOR 函数的特判
def call_function(func, args, kwargs):
    if func.__code__.co_flags & CO_GENERATOR:
        return GeneratorObject(func, args, kwargs)   # 造对象，不执行函数体
    else:
        return execute_bytecode(func, args, kwargs)  # 普通函数：直接执行字节码
```

这就是为什么 `gen = squares(3)` 之后函数体一行没跑：调用机制压根没进函数体，它只是"把函数对象 + 实参打包成一个尚未启动的生成器对象"。函数体的字节码被挂在这个生成器对象上，等着 `next()` 去触发执行。

可以用一个小实验验证"调用即造对象、且不执行"：

```python
def never_runs():
    print("如果看到这行，说明函数体被执行了")
    yield 1

# 只调用，不 next——观察是否打印
g = never_runs()
# 不会打印任何东西
print("调用完毕，生成器对象:", g)
# 输出：调用完毕，生成器对象: <generator object never_runs at 0x...>
```

`print("如果看到这行...")` 从未被打印，说明字节码确实没跑。这和上一节"调用普通函数会立刻蹦进函数体"的行为形成鲜明对比，根源就是 `CO_GENERATOR` 标志让调用走了不同分支。

### 4.3 生成器对象的栈帧：独立执行现场

生成器对象内部持有一个**独立的栈帧（frame）**，这是它能"保存-恢复"状态的物理载体。每个生成器对象都有自己专属的栈帧，互不干扰。

栈帧里至少保存着：

- 指向函数 code object 的引用（决定要执行哪段字节码）。
- 局部变量的存储区（`co_nlocals` 决定槽位数量）。
- 求值栈（evaluation stack），存放表达式求值的中间值。
- 当前指令指针（`f_lasti` 的等价物），记录执行到字节码的哪一条。
- 异常处理表状态、全局/内置命名空间引用等。

关键点：**这个栈帧不是 C 调用栈上的帧，而是堆上的对象**。普通函数调用时，栈帧通常建在 C 栈上、函数返回即销毁；生成器的栈帧建在堆上，只要生成器对象还活着，栈帧就活着，暂停期间它的所有内容（局部变量、指令指针、求值栈）原样保留。这就是为什么 yield 暂停后局部变量不丢、下次 next 能"接着上次"的根本原因。

```python
def demo():
    a = 100
    b = 200
    yield a + b        # 暂停点：此时栈帧冻结 a=100, b=200, 指令指针停在这条 yield 之后
    a *= 2
    yield a + b        # 恢复时栈帧被还原，a 变 200，再 yield

g = demo()
print(next(g))    # 输出：300
print(next(g))    # 输出：400
```

两次 `next` 之间，`g` 内部栈帧里 `a`、`b` 的值被原样冻存。第二次 next 恢复时，解释器把栈帧里的指令指针拨回上次停的位置，接着执行 `a *= 2`，于是 `a` 变 200。

两个不同的生成器对象各自有独立栈帧，所以它们可以独立地停在不同位置：

```python
g1 = demo()
g2 = demo()
print(next(g1))    # 输出：300   g1 停在第一个 yield 后
print(next(g2))    # 输出：300   g2 独立地也停在第一个 yield 后
print(next(g1))    # 输出：400   g1 前进到第二个 yield
print(next(g2))    # 输出：400   g2 紧接着也前进到第二个 yield
```

`g1`、`g2` 各自一套局部变量和指令指针，完全互不影响。这就是第 1 章说的"生成器对象 = 携带独立执行现场的迭代器"在内存层面的真相。

### 4.4 next 触发栈帧恢复：执行到 yield 后挂起

`next(gen)` 在解释器层面是调用生成器对象的 `__next__` 方法。它做的事可以简化为：

1. 取出生成器对象内部的栈帧，把指令指针拨到上次暂停处（首次 next 时拨到函数体第一条字节码）。
2. 把这个栈帧"挂载"到当前 C 调用栈上，开始执行函数体字节码。
3. 字节码逐条执行，直到遇到 `GEN_SAVE`（yield 对应的保存/返回原语）这一类指令。
4. `GEN_SAVE` 把 yield 后面表达式的值放进生成器的"产出值"槽位，更新指令指针到 yield 之后下一条指令，把栈帧从 C 栈上卸下，函数体执行被挂起。
5. `next()` 把"产出值"槽位里的值作为返回值交还给调用者。

这里的"挂载/卸下栈帧"是关键：普通函数的栈帧生命周期等于函数调用周期，生成器的栈帧生命周期等于生成器对象生命周期，而它在 C 栈上的"挂载"只发生在某次 `next()` 执行期间。暂停时栈帧被卸下但保留在堆上，恢复时再挂回去。

可以用伪字节码描述一个简单生成器函数：

```python
def two():
    yield 1
    yield 2
```

它的字节码大致长这样（简化示意）：

```
RESUME
GEN_SAVE 1        # 产出 1，保存状态并挂起；next 恢复时从这里之后继续
GEN_SAVE 2        # 产出 2，再次挂起
RETURN_NONE       # 函数体结束，抛 StopIteration
```

每一次 `GEN_SAVE` 都是"把值交出去 + 把指令指针停在它后面 + 把栈帧卸回堆上"。下一次 next 的恢复点就是 GEN_SAVE 之后那条指令。这个机制保证：

- yield 后面的值被外层 `next()` 拿到（因为先放进产出值槽位）。
- 下次 next 从 yield 之后继续（因为指令指针停在 GEN_SAVE 后）。
- 暂停期间所有局部状态保留（因为栈帧没销毁，只是卸回堆）。

**yield 暂停发生在表达式求值完成、值已产出之后**，而不是之前。所以像 `yield a + b` 这种，恢复时 `a + b` 已经算完、值已经交出去，不会"算到一半"再恢复。

### 4.5 StopIteration：函数末尾或 return 触发

当生成器函数的字节码执行到函数末尾（等价于隐式 `return None`）或显式 `return` 时，解释器不再遇到 GEN_SAVE，而是走普通的返回路径。对生成器而言，这条返回路径不把值返回给调用者，而是：

1. 把生成器对象标记为"已终止"状态。
2. 把 `return` 携带的值（若有）存入一个 `StopIteration` 异常对象的 `.value`。
3. 抛出这个 `StopIteration`。

`next()` 捕获到 `StopIteration` 就知道生成器走到头了。`for` 循环正是靠捕获 `StopIteration` 来判断"遍历结束"。

```python
def finite():
    yield 1
    return "done"        # 显式 return 携带值

g = finite()
print(next(g))           # 输出：1
try:
    next(g)
except StopIteration as e:
    print(e.value)       # 输出：done
```

字节码层面，`return <值>` 在生成器里会被编译为类似 `LOAD_CONST <值>; RETURN_VALUE` 的序列。`RETURN_VALUE` 指令在 `CO_GENERATOR` 函数里会走生成器特判路径：构造 `StopIteration(value=<值>)` 并抛出，而不是像普通函数那样把值压回调用者栈。

**为什么用异常而不是用返回值表达终止**：这是为了和迭代器协议统一。迭代器协议规定 `__next__()` 在耗尽时必须抛 `StopIteration`，这样 `for`、`list`、`sum` 等所有接收可迭代对象的机制都能用同一种方式判断"到底了"。生成器把这个协议内化进了自己的执行模型：函数体走完自动抛 `StopIteration`，使用者无需手写"是否还有下一个"的判断。

### 4.6 yield 的"保存-恢复"状态机本质

把前几节拼起来，可以给出生成器执行的完整状态机描述。生成器对象在其生命周期里有三个核心状态：

- **GEN_CREATED**：刚被 `MAKE_FUNCTION` 构造出来，尚未启动。函数体一行没执行。
- **GEN_SUSPENDED**：执行过、当前停在某个 yield 之后，等待 next 恢复。绝大部分活跃生成器处于这个状态。
- **GEN_CLOSED**：已终止（函数体走完、return、异常、或被 close）。再 next 只会抛 StopIteration。

状态流转：

```
GEN_CREATED --next--> [执行函数体] --遇 yield--> GEN_SUSPENDED
GEN_SUSPENDED --next--> [从 yield 后恢复] --遇 yield--> GEN_SUSPENDED
GEN_SUSPENDED --next--> [从 yield 后恢复] --函数末尾/return--> GEN_CLOSED (抛 StopIteration)
任意状态 --异常/close--> GEN_CLOSED
```

转换发生时，核心动作始终是"保存当前现场（局部变量 + 指令指针 + 求值栈）到堆上的栈帧；恢复时把现场读出来挂回 C 栈继续执行"。这个"保存-恢复"循环就是 yield 的本质：它不是"返回一个值"，而是**冻结当前执行现场并交出一个值，等下一次 next 把现场解冻继续往前走**。

理解成状态机后，前面那些现象都有了统一解释：

- **为什么调用不执行**：因为调用只做了 `GEN_CREATED` 这一步，没触发状态流转。
- **为什么 next 能续上**：因为暂停时现场被完整保存到栈帧，恢复时原样读出。
- **为什么局部变量不丢**：因为栈帧是堆对象，生命周期跟生成器对象一样长。
- **为什么 StopIteration 表示结束**：因为状态流转到 `GEN_CLOSED`，再 next 没有现场可恢复，只能抛异常。
- **为什么生成器能表示无限序列**：因为任何时刻只有"当前这一步"的现场在内存里，不需要预存所有结果。

这个状态机就是后续所有生成器高级特性（`send` 双向通信、`throw` 注入异常、`close` 触发清理、`yield from` 委托）的地基。本篇先把这个基础状态机钉死，后续篇章在这个骨架上加肉。

### 4.7 从字节码看一次完整的 next

把一个具体生成器从头到尾走一遍，对照字节码把行为落实。考虑：

```python
def add_up():
    total = 0
    for i in range(3):
        total += i
        yield total
    return total
```

调用 `add_up()` 得到生成器对象 `g`，此时处于 `GEN_CREATED`。

第一次 `next(g)`：
- 栈帧挂载，执行 `total = 0`，`i = 0`（range 第一轮），`total += 0` → total=0。
- 遇 `yield total`：GEN_SAVE 产出 0，指令指针停在 yield 之后，栈帧卸回堆，返回 0。
- 此时 `g` 处于 `GEN_SUSPENDED`，栈帧里 total=0, i=0。

第二次 `next(g)`：
- 栈帧恢复，从 yield 之后继续：for 循环下一轮 `i = 1`，`total += 1` → total=1。
- 遇 `yield total`：产出 1，挂起，返回 1。
- 栈帧冻结 total=1, i=1。

第三次 `next(g)`：
- 恢复：`i = 2`，`total += 2` → total=3。
- 产出 3，挂起，返回 3。
- 栈帧冻结 total=3, i=2。

第四次 `next(g)`：
- 恢复：for 循环判断 range(3) 已走完，跳出循环。
- 执行 `return total`：RETURN_VALUE 走生成器路径，构造 `StopIteration(value=3)` 并抛出。
- `g` 进入 `GEN_CLOSED`。

对应到可观察的运行结果：

```python
g = add_up()
print(next(g))    # 输出：0
print(next(g))    # 输出：1
print(next(g))    # 输出：3
try:
    next(g)
except StopIteration as e:
    print(e.value)   # 输出：3
```

每一次产出都对应一次"执行-遇 GEN_SAVE-挂起-返回值"，每一次 next 都对应一次"恢复-继续执行"。把这套流程对应到字节码层，就是生成器的全部运行机制。

### 4.8 为什么生成器能这样设计：协程的雏形

理解了状态机，你会意识到生成器其实是一种"可暂停、可恢复的执行体"。这恰恰是协程的核心特征。事实上 Python 早期的协程（`@asyncio.coroutine`、`yield from` 驱动）就是直接基于生成器实现的：`yield` 暂停把控制权交还给事件循环，事件循环在合适时机 `send`/`next` 把生成器恢复。直到后来才有了 `async`/`await` 这套更明确的异步语法，但底层执行模型仍和生成器一脉相承。

所以本篇建立的不只是"yield 怎么用"的知识，更是一种"可暂停执行体"的思维模型。理解了 yield 的状态机，后续学协程时你会发现很多概念似曾相识：暂停点、恢复点、状态保存、终止信号——换一层语法，骨架没变。

## 5. 总结

### 5.1 本文内容要点

- **生成器函数的本质**：只要函数体含 `yield`，它在编译期就被打上 `CO_GENERATOR` 标志，成为生成器函数。调用它不执行函数体，而是返回一个生成器对象。
- **next 驱动执行**：每次 `next(gen)` 让函数体从上次暂停处继续执行，遇下一个 `yield` 暂停并把 yield 后表达式的值产出给调用者。
- **状态保存**：yield 暂停时，生成器对象的独立栈帧把局部变量、指令指针、求值栈完整冻结到堆上；恢复时原样读回，所以局部变量在多次 next 之间连续。
- **终止信号**：函数体走完或遇 `return` 触发 `StopIteration`；`return <值>` 的值进 `StopIteration.value`，`for` 循环不可见。
- **迭代器协议**：生成器对象实现 `__iter__`/`__next__`，可直接被 `for`、`list`、`sum` 等消费；一个生成器只能走一轮，耗尽即止。
- **惰性**：调用零成本、按需前进、数据用一点算一点，适合大文件、无限序列、流水线场景。
- **底层状态机**：`GEN_CREATED → GEN_SUSPENDED ↔ (next) → GEN_CLOSED`，核心是栈帧在堆上的保存-恢复。
- **最佳实践**：别把生成器当列表反复遍历；造了就要消费；大数据优先生成器；生成器里 return 当终止信号而非返回值；异常别静默吞；持有资源要主动 close。

### 5.2 读完应能掌握

- 能说清"含 yield 的函数为什么调用时不执行函数体"：`CO_GENERATOR` 标志让调用走造对象分支而非执行字节码分支。
- 能用 `next()` 手动驱动生成器并正确处理 `StopIteration`，也能用 `for` 循环消费生成器。
- 能解释 yield 暂停时保存了什么（局部变量、指令指针、求值栈、栈帧）、为什么下次 next 能接着上次跑。
- 能写出 `squares(n)`、`read_lines(path)` 这类典型生成器，并说明它相比列表的内存优势。
- 能区分生成器里 `return <值>` 和普通函数 `return` 的语义差别，知道值去哪了（`StopIteration.value`）。
- 能用"GEN_CREATED/SUSPENDED/CLOSED + 栈帧保存-恢复"这套状态机描述任意一段生成器代码的完整执行过程。
- 能判断什么场景该用生成器、什么场景该用列表，并说出代价（一次性、不可随机访问）。

### 5.3 本篇在系列中的位置

本篇是「生成器与迭代器」系列的地基。后续篇章会在这个"yield = 暂停 + 产出 + 状态保存"的状态机上继续扩展：

- `send`：让 yield 不仅是"产出值"，还能"接收值"，实现双向通信。
- `throw` / `close`：从外部向生成器注入异常、触发清理。
- `yield from`：把一个生成器委托给另一个生成器，串联子生成器。
- 自定义迭代器：用 `__iter__`/`__next__` 手写和生成器等价的迭代器，理解生成器帮你省掉了什么。
- 生成器与协程：从"可暂停执行体"过渡到 `async`/`await`。

把本篇的状态机模型钉牢，后面的扩展都是在同一个骨架上加新动作，而不是每次重学一套新东西。