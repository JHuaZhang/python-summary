---
group:
  title: 【17】生成器与迭代器
  order: 17
order: 2
title: 生成器惰性求值过程
nav:
  title: Python
  order: 1
---

## 1. 介绍

### 1.1 什么是惰性求值

普通函数的执行方式是"即时求值"（eager evaluation）：你一调用它，它就把函数体从头到尾跑完，把结果一次性返回给你。即便函数里要处理一百万个数字，它也会在返回前把这百万个数字全部算出来塞进一个列表，哪怕调用方其实只想取前三个。

生成器走的是另一条路——**惰性求值**（lazy evaluation）。所谓惰性，意思是"不到被需要的那一刻，就不动手算"。一个生成器函数被调用时，它并不会执行函数体里的任何一行代码，只是产出一个生成器对象（generator object）搁在那里。要等到你用 `next()` 或 `for` 循环去"消费"它时，函数体才开始执行；而且每执行到一个 `yield`，它就把 yield 后面的值吐出来，然后**原地冻结**——暂停在这一行，连同此刻所有的局部变量、执行位置一起定格，直到下一次被 `next()` 唤醒才继续往下走。

这和普通函数"一口气跑完"的模型截然不同。可以把普通函数想象成一个一次性交付的工厂：下单后它埋头生产，最后把整批货一次发给你。生成器则是一条按需供货的流水线：你喊一声"要一个"，它就生产一个递给你，然后停下机器等你下个指令；你不喊，机器就一直歇着。

```python
def squares(n):
    """普通角度看：这像在算 1~n 的平方。惰性角度看：它不会主动算任何东西。"""
    for i in range(1, n + 1):
        yield i * i

gen = squares(3)      # ★ 此刻函数体一行都没执行
print(gen)            # <generator object squares at 0x...>
print(next(gen))      # 1 —— 这一刻才真正进入函数体，算出 1*1 后 yield 暂停
print(next(gen))      # 4 —— 从暂停点恢复，算 2*2 后再 yield
print(next(gen))      # 9 —— 再恢复，算 3*3 后 yield
# print(next(gen))    # 再 next 会抛 StopIteration（函数体已走完）
```

```python
# 输出：
# <generator object squares at 0x100d3a200>
# 1
# 4
# 9
```

注意第一行 `gen = squares(3)`：它只是"造好了机器"，没有任何数字被算出来。这就是惰性求值的第一层含义——**创建不等于求值**。

### 1.2 惰性求值的两条核心规则

把上面的现象提炼成两条规则，它们贯穿整篇：

**规则一：按需前进。** 生成器对象只在被消费（`next`、`for`、以及间接消费它的 `sum`/`list`/`map` 等）时才向前执行，每消费一次最多前进到一个 `yield` 处暂停。不被消费，它就纹丝不动。

**规则二：一次一步。** 每次前进都以 `yield` 为停靠点，吐出一个值后立刻冻结。下一个值永远不会提前算好等着你——它要等下一次消费指令到来时才算。

这两条规则合起来，就是"惰性"的全部含义：**不提前算、不囤货、要一个给一个、给完就歇**。后面所有的现象——无限序列能表示、内存占用恒定、只能迭代一次、链式管线逐元素流转——全是从这两条规则推导出来的。

### 1.3 最小可运行示例：用 print 验证"创建时没执行"

光说"创建时不执行"可能不好信，用 print 直接验证：

```python
def gen_demo():
    print("  [函数内] 开始执行函数体")
    yield 10
    print("  [函数内] 第一次恢复，准备 yield 第二个")
    yield 20
    print("  [函数内] 第二次恢复，函数体即将结束")
    return

print(" step1: 准备调用 gen_demo()")
g = gen_demo()
print(" step2: 已经调用，拿到 g，但函数体还没跑")
print(" step3: 第一次 next")
v1 = next(g)
print(f" step3: next 返回了 {v1}")
print(" step4: 第二次 next")
v2 = next(g)
print(f" step4: next 返回了 {v2}")
print(" step5: 第三次 next")
try:
    next(g)
except StopIteration:
    print(" step5: StopIteration，函数体已全部跑完")
```

```python
# 输出：
#  step1: 准备调用 gen_demo()
#  step2: 已经调用，拿到 g，但函数体还没跑
#  step3: 第一次 next
#   [函数内] 开始执行函数体
#  step3: next 返回了 10
#  step4: 第二次 next
#   [函数内] 第一次恢复，准备 yield 第二个
#  step4: next 返回了 20
#  step5: 第三次 next
#   [函数内] 第二次恢复，函数体即将结束
#  step5: StopIteration，函数体已全部跑完
```

关键看输出顺序：`step2` 那句"已经调用，拿到 g"先打印了，而 `[函数内] 开始执行函数体` 直到 `step3` 的 `next(g)` 之后才出现。这铁证了"调用生成器函数 ≠ 执行函数体"。函数体里的代码是被 `next` 一段段拽着往前走的。

---

## 2. 核心内容

### 2.1 next(gen)：驱动一次前进、停在 yield

`next(gen)` 是最直接的消费方式。它的完整语义是：把生成器从当前暂停点"唤醒"，让函数体继续往下执行，直到撞上下一个 `yield`（把 yield 后的值作为 `next` 的返回值返回并再次暂停）或函数结束（抛出 `StopIteration`）。

一图概括一次 `next` 的生命周期：

```
当前状态(暂停在某 yield 或起始点)
      │
      │  next(gen) 调用
      ▼
函数体从这里恢复执行
      │
      ├── 遇到 yield 值 ──► 吐出值，暂停在该 yield，next 返回该值
      │
      └── 走到函数末尾 / return ──► 抛 StopIteration，帧结束
```

几个要点必须强调：

- `next` 一次，**最多**经过一个 `yield`。两个 yield 之间的所有代码会在这一次 `next` 里跑完，但在第二个 yield 处停住，不会越过去。
- 第一次 `next` 之前，生成器停在函数体的**开头**（第一个 yield 之前的代码也是此刻才跑）。
- 函数体走完后，`next` 不再返回值，而是抛 `StopIteration`。这是"序列到此结束"的信号。
- 已经抛过 `StopIteration` 的生成器再 `next`，仍然抛 `StopIteration`——它已"耗尽"，不会复活。

用一个分段 yield 的例子把"停一次、走一段"看清楚：

```python
def three_stages():
    print("  → 进入函数，准备算第一段")
    a = 1 + 1
    yield a                       # 第一次 next 在这里停，返回 2
    print("  → 第一段后恢复，准备算第二段")
    b = a + 10
    yield b                       # 第二次 next 在这里停，返回 12
    print("  → 第二段后恢复，准备算第三段")
    c = b + 100
    yield c                       # 第三次 next 在这里停，返回 112
    print("  → 第三段后恢复，函数结束")

g = three_stages()
print("call done, now next #1 ->", next(g))
print("call done, now next #2 ->", next(g))
print("call done, now next #3 ->", next(g))
try:
    next(g)
except StopIteration:
    print("next #4 -> StopIteration")
```

```python
# 输出：
# call done, now next #1 ->  → 进入函数，准备算第一段
# call done, now next #1 -> 2
# call done, now next #2 ->  → 第一段后恢复，准备算第二段
# call done, now next #2 -> 12
# call done, now next #3 ->  → 第二段后恢复，准备算第三段
# call done, now next #3 -> 112
#   → 第三段后恢复，函数结束
# next #4 -> StopIteration
```

（上面第二段输出里 print 的执行顺序值得细看：`next(g)` 既会触发函数内 print，又会触发外层 print，外层 print 在 `next` 返回后才执行，所以"→ 第一段后恢复"这种函数内打印出现在外层那一行之前。这正体现了 `next` 是一个"同步完成"的调用——它把函数体拽到下一个 yield，然后把控制权交回调用方。）

**stop and go 的调试范式**

在调试生成器时，最有效的手段就是在每个 yield 前后各加一行 print，把"何时进入、何时暂停、何时恢复"全程打出来。这是后面 `num_series()` 场景会反复用到的模式：

```python
def traced():
    print("    [trace] before yield A")
    x = yield "A"
    print(f"    [trace] after yield A, received x={x}")
    print("    [trace] before yield B")
    yield "B"
    print("    [trace] after yield B, ending")

g = traced()
print("== next 1 ==")
print("got:", next(g))
print("== next 2 ==")
print("got:", next(g))
print("== next 3 ==")
try:
    next(g)
except StopIteration:
    print("got: StopIteration")
```

```python
# 输出：
# == next 1 ==
#     [trace] before yield A
# got: A
# == next 2 ==
#     [trace] after yield A, received x=None
#     [trace] before yield B
# got: B
# == next 3 ==
#     [trace] after yield B, ending
# got: StopIteration
```

注意 `after yield A` 这一行是**第二次** next 才打印的——因为第一次 next 在 `yield "A"` 处就停住了，yield 这一行"下面"的代码要等下一次恢复才轮到执行。这种"yield 一行分两侧"的时序，是理解生成器执行轨迹的关键。

### 2.2 连续 next 直到 StopIteration

`next` 可以一直喊，直到生成器耗尽。把整个耗尽过程完整跑一遍并观察每一步的 print，能彻底看清"逐个求值"的节奏：

```python
def count_down(start):
    n = start
    while n > 0:
        print(f"  [gen] 即将 yield {n}")
        yield n
        n -= 1
        print(f"  [gen] yield 后，n 减到 {n}")
    print("  [gen] 循环结束，函数退出")

g = count_down(3)
for i in range(1, 6):       # 故意多调几次看 StopIteration
    print(f"--- 第 {i} 次 next ---")
    try:
        val = next(g)
        print(f"    返回: {val}")
    except StopIteration:
        print("    返回: StopIteration（已耗尽）")
        # 注意：耗尽后再 next 还是会抛 StopIteration，不会复活
```

```python
# 输出：
# --- 第 1 次 next ---
#   [gen] 即将 yield 3
#     返回: 3
# --- 第 2 次 next ---
#   [gen] yield 后，n 减到 2
#   [gen] 即将 yield 2
#     返回: 2
# --- 第 3 次 next ---
#   [gen] yield 后，n 减到 1
#   [gen] 即将 yield 1
#     返回: 1
# --- 第 4 次 next ---
#   [gen] yield 后，n 减到 0
#   [gen] 循环结束，函数退出
#     返回: StopIteration（已耗尽）
# --- 第 5 次 next ---
#     返回: StopIteration（已耗尽）
```

把输出和函数体对照看：

- 第 1 次 next：从函数开头进入，跑 `print` + `yield n`（此时 n=3），停在 yield，返回 3。注意 `n -= 1` **还没执行**。
- 第 2 次 next：从 yield 处恢复，执行 `n -= 1`（n 变 2），`print`，回到 while 顶，`print`，`yield 2`，停住，返回 2。
- 依此类推。每次 next 完成的"步"是"yield 后的代码 + 下一轮循环直到下一个 yield"。
- 第 4 次 next：n=1 时恢复，`n -= 1` → n=0，while 条件不成立，跳出，`print`，函数结束 → StopIteration。
- 第 5 次 next：生成器已耗尽，直接 StopIteration，函数体不会再进。

**手动耗尽的等价写法**

用一个 while + try/except 就能手动模拟 for 循环的"一直 next 到 StopIteration"行为：

```python
def drain(gen):
    """手动消费生成器到耗尽，等价于 for 循环但不收集结果。"""
    while True:
        try:
            value = next(gen)
            print(f"  drained: {value}")
        except StopIteration:
            print("  drained: <end>")
            break

drain(count_down(2))
```

```python
# 输出：
#   [gen] 即将 yield 2
#   drained: 2
#   [gen] yield 后，n 减到 1
#   [gen] 即将 yield 1
#   drained: 1
#   [gen] yield 后，n 减到 0
#   [gen] 循环结束，函数退出
#   drained: <end>
```

这段代码本身不重要，重要的是它揭示的事实：**for 循环在底层就是这么干的**——不断 `next`，捕获 `StopIteration` 就停。下一节展开。

### 2.3 for 循环 = 反复 next 直到 StopIteration

`for x in gen:` 不是什么新机制，它本质就是"自动帮你 `next` 到 `StopIteration`"的语法糖。等价展开：

```python
# for x in gen:
#     body(x)
# 等价于：
_while = True
while _while:
    try:
        x = next(gen)
    except StopIteration:
        _while = False
    else:
        body(x)
```

把这个等价关系用代码直接印证：

```python
def letters():
    yield "a"
    yield "b"
    yield "c"

# 方式一：for 循环
print("for 方式:")
for ch in letters():
    print("  ", ch)

# 方式二：手动 next + StopIteration
print("手动方式:")
g = letters()
while True:
    try:
        ch = next(g)
        print("  ", ch)
    except StopIteration:
        break
```

```python
# 输出：
# for 方式:
#    a
#    b
#    c
# 手动方式:
#    a
#    b
#    c
```

两者输出完全一致，因为 for 循环干的就是"反复 next 直到 StopIteration"。理解这一点有两个直接收益：

1. 你再不会奇怪"为什么 for 循环能自动停在生成器末尾"——它只是捕获了 StopIteration。
2. 你能解释"为什么生成器在 for 里只能遍历一次"——for 把它 next 到耗尽就结束了，下次再 for 同一个对象，它已经是耗尽状态，第一次 next 就 StopIteration，循环一次都不跑。

**for 的提前退出并不会"浪费"剩余值，只是不再消费**

```python
def infinite_ids():
    i = 0
    while True:
        yield i
        i += 1

# 只取前 3 个就 break
got = []
for x in infinite_ids():
    if x >= 3:
        break
    got.append(x)
print("got:", got)        # got: [0, 1, 2]
```

```python
# 输出：
# got: [0, 1, 2]
```

这里 underlying 生成器是无限的，但 for 循环通过 break 提前退出了——意味着它停止了对生成器的 next 调用。生成器于是停在 `x=3` 那次 yield 处，不再前进。这正是惰性求值的好处之一：**随时能停**，没消费的部分根本没算。

### 2.4 用 print 观察生成器的"走一步停一步"

这一节把 next 驱动的执行轨迹用 print 完整可视化。设计一个 `num_series()` 生成器，在每个 yield 前后都打点，然后逐个 next 消费，看函数体到底什么时候在跑、什么时候在歇。

```python
def num_series(count):
    """生成 1..count，在每个 yield 前后打点，观察惰性执行轨迹。"""
    print(f"  [num_series] 函数体开始，将产出 {count} 个数")
    for i in range(1, count + 1):
        value = i * 2                  # 模拟一点计算
        print(f"  [num_series] 即将 yield 第 {i} 个值 {value}")
        yield value                    # ← 暂停点：next 在这里返回并停住
        print(f"  [num_series] 第 {i} 个 yield 后恢复")
    print("  [num_series] 循环结束，函数退出")

print("==== 创建生成器 ====")
gen = num_series(3)
print("==== 创建完成，尚未 next ====")
print("==== next #1 ====")
v1 = next(gen)
print(f"==== next #1 返回 {v1} ====")
print("==== next #2 ====")
v2 = next(gen)
print(f"==== next #2 返回 {v2} ====")
print("==== next #3 ====")
v3 = next(gen)
print(f"==== next #3 返回 {v3} ====")
print("==== next #4 ====")
try:
    next(gen)
except StopIteration:
    print("==== next #4 -> StopIteration ====")
```

```python
# 输出：
# ==== 创建生成器 ====
# ==== 创建完成，尚未 next ====
# ==== next #1 ====
#   [num_series] 函数体开始，将产出 3 个数
#   [num_series] 即将 yield 第 1 个值 2
# ==== next #1 返回 2 ====
# ==== next #2 ====
#   [num_series] 第 1 个 yield 后恢复
#   [num_series] 即将 yield 第 2 个值 4
# ==== next #2 返回 4 ====
# ==== next #3 ====
#   [num_series] 第 2 个 yield 后恢复
#   [num_series] 即将 yield 第 3 个值 6
# ==== next #3 返回 6 ====
# ==== next #4 ====
#   [num_series] 第 3 个 yield 后恢复
#   [num_series] 循环结束，函数退出
# ==== next #4 -> StopIteration ====
```

对这个输出读法做个彻底解读：

- `==== 创建完成，尚未 next ====` 出现在所有 `[num_series]` 打印之前——再次证实创建时不执行函数体。
- `next #1` 期间，函数从开头跑到第一个 yield，打了"函数体开始"和"即将 yield 第 1 个"两行，然后停在 `yield value`，把 2 交给 `next` 返回。于是 `==== next #1 返回 2 ====` 跟在这两行后面。
- `next #2` 期间，函数从第一个 yield 处恢复，打"第 1 个 yield 后恢复"，进入下一轮循环，i=2，算出 4，打"即将 yield 第 2 个"，停在第二个 yield，返回 4。
- `next #3` 同理。
- `next #4` 期间，函数从第三个 yield 处恢复，打"第 3 个 yield 后恢复"，i=4 不满足 `range(1, 4)`，循环结束，打"循环结束，函数退出"，函数返回 → StopIteration。注意这一步没有 yield 任何值，所以外层 catch 到 StopIteration。

这就是"走一步停一步"的完整画面：每次 next 让函数走"从当前 yield 到下一个 yield 之间"的代码段，走完就停。函数体不是一条直线跑完，而是被 next 切成了若干段，一段一段地执行。

**调试中的副作用时序**

正因为函数体是分段执行的，函数体内带副作用的代码（写文件、改全局变量、发请求）的执行时机就不是"调用生成器时"，而是"被 next 消费时"。这在调试时是个高频踩坑点：

```python
log = []

def lazy_appender():
    log.append("start")      # 这个 append 什么时候发生？
    yield 1
    log.append("after 1")    # 这个呢？
    yield 2
    log.append("after 2")    # 这个呢？

g = lazy_appender()
print("after create, log =", log)      # 创建后：log 还是空的
log.append("outer-1")
next(g)
print("after next1, log  =", log)      # 只有 start 被加进去
log.append("outer-2")
next(g)
print("after next2, log  =", log)      # after 1 被加进去
log.append("outer-3")
try:
    next(g)
except StopIteration:
    pass
print("after next3, log  =", log)      # after 2 被加进去
```

```python
# 输出：
# after create, log = []
# after next1, log  = ['outer-1', 'start']
# after next2, log  = ['outer-1', 'start', 'outer-2', 'after 1']
# after next3, log  = ['outer-1', 'start', 'outer-2', 'after 1', 'outer-3', 'after 2']
```

看清楚 `log` 的最终顺序：外层 `outer-*` 和函数内 `start/after 1/after 2` 是交错的，不是"函数内全在前面"或"全在后面"——因为函数内代码是被 next 一段段插入到外层时间线里的。如果你以为"调用生成器函数后 log 就会有 start"，就会对 log 的状态做出错误预期。这就是惰性求值在副作用时序上的注意点：**生成器内代码的执行时机，取决于消费时机，而非创建时机**。

### 2.5 惰性带来的好处

#### 2.5.1 表示无限序列

普通函数没法返回一个无限长的列表（内存会炸）。生成器因为是按需产出一个，根本不需要把整个序列装进内存，所以天然能表示无限序列。

```python
def natural_numbers(start=1):
    """无限自然数序列：1, 2, 3, ... 永远不会停。"""
    n = start
    while True:          # 无限循环，但因为惰性，不会卡死
        yield n
        n += 1

# 要多少取多少，不会爆内存
evens = []
for x in natural_numbers():
    if x > 10:
        break
    if x % 2 == 0:
        evens.append(x)
print("evens:", evens)
```

```python
# 输出：
# evens: [2, 4, 6, 8, 10]
```

`natural_numbers()` 的函数体里是 `while True`，看似会无限循环卡死。但因为每次 `yield n` 后会暂停等下一次 next，而 for 循环在 `x > 10` 时 break 不再 next，生成器就停在 `yield 11` 处不再前进。惰性求值让"无限"变得可控：**消费者决定何时停，生产者不会自己跑疯**。

**take 前 N 的惯用法**

对无限序列，常见操作是"取前 N 个"。可以写一个工具函数：

```python
def take(n, gen):
    """从 gen 取前 n 个，返回列表。对无限序列也安全。"""
    result = []
    for i, x in enumerate(gen):
        if i >= n:
            break
        result.append(x)
    return result

print("take 5:", take(5, natural_numbers()))
print("take 3 from 100:", take(3, natural_numbers(100)))
```

```python
# 输出：
# take 5: [1, 2, 3, 4, 5]
# take 3 from 100: [100, 101, 102]
```

`take` 之所以对无限序列安全，完全是惰性求值的功劳：`for x in gen` 虽然写法上像在遍历整个序列，但 break 会让 for 停止 next，生成器没消费完的部分就不算。

#### 2.5.2 随时可停

不一定要"取前 N 个"，任何消费方都可以根据条件随时停。这对"找到第一个满足条件的就收手"的场景特别有用：

```python
def fibonacci():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

# 找第一个大于 1000 的斐波那契数
target = None
for f in fibonacci():
    if f > 1000:
        target = f
        break
print("first fib > 1000:", target)
```

```python
# 输出：
# first fib > 1000: 1597
```

如果用列表存斐波那契数列到"第一个大于 1000"，你得先猜要存多少个；用生成器，找到就 break，没消费的值一个都没算。惰性求值让"搜索"类操作天然高效。

#### 2.5.3 不预占内存

普通函数返回 list，会一次性把所有结果物化到内存。生成器在任何时刻只持有"当前这一个值"和少量局部状态，不囤积结果。

```python
import sys

def eager_squares(n):
    """即时求值：一次性算好全部，返回列表。"""
    return [i * i for i in range(n)]

def lazy_squares(n):
    """惰性求值：每次只算一个。"""
    for i in range(n):
        yield i * i

big = 1_000_000
eager = eager_squares(big)
lazy = lazy_squares(big)

print("eager list size:", sys.getsizeof(eager), "bytes")   # 列表本身占用的内存
print("lazy gen size: ", sys.getsizeof(lazy),  "bytes")    # 生成器对象固定大小
# 真正算出来的值数量：eager 已经有 100 万个，lazy 一个都还没算
```

```python
# 输出（具体字节数随平台不同，数量级差异是重点）：
# eager list size: 8448728 bytes
# lazy gen size:  200 bytes
```

差距是数量级的：列表要持有 100 万个 int 的引用数组，生成器只持一个固定的帧对象。注意 `lazy_squares(big)` 创建后，那 100 万个平方一个都没算——你只看到 200 字节，是因为函数体根本没跑。这就是"不预占内存"的真正含义：**未消费的值既不占内存，也不耗 CPU**。

### 2.6 惰性的注意点

#### 2.6.1 不消费就不执行——"没人要就不干活"

惰性的反面是：你不主动消费，生成器就一动不动。这会导致一些反直觉的现象。

```python
def side_effect():
    print("  我在干活！")
    yield 1

g = side_effect()
# 此刻什么都不会打印，因为没消费
print("创建后，没 next，啥都没发生")

# 就是把它传给函数也不一定消费
# list(g) 会消费，但很多人会犯下面的错：
g2 = side_effect()
_ = g2              # 只是赋值，不消费
print("赋值后，依然啥都没发生")

g3 = side_effect()
print("list 前开始消费") if True else None
list(g3)            # 这才真正消费
print("list 后结束")
```

```python
# 输出：
# 创建后，没 next，啥都没发生
# 赋值后，依然啥都没发生
# list 前开始消费
#   我在干活！
# list 后结束
```

最经典的坑是：写了一个生成器函数打算"做点什么"（比如日志、发请求），结果只创建了对象却忘了消费，副作用永远不触发。**记住口诀：生成器没人要就不干活。** 要让生成器里的代码真的执行，必须有消费动作（next、for、list、sum、`deque(..., maxlen=0)` 等）。

```python
# 一个隐蔽的坑：把生成器当"会自动执行的函数"用
def notify(msg):
    print(f"  [notify] {msg}")
    yield  # 本意是"打印通知"，但写成生成器了
    print(f"  [notify] done")

# 错误用法：以为调用就打印
notify("hello")
# 上面这行什么都不打印！只是造了个生成器对象又丢弃

# 正确用法：必须消费
for _ in notify("hello"):
    pass
```

```python
# 输出：
#   [notify] hello
#   [notify] done
```

第一次 `notify("hello")` 之后一行输出都没有——生成器对象创建即丢弃，没人 next，函数体一行未跑。只有下面 `for _ in notify("hello"): pass` 真正消费了，两行打印才出现。

#### 2.6.2 只能迭代一次，耗尽即止

生成器是有状态的，每次 next 都会让它前进一步。一旦走到 StopIteration，它就永久耗尽，不会再从头来。

```python
def small():
    yield 1
    yield 2

g = small()
print("第一轮:", list(g))   # [1, 2]
print("第二轮:", list(g))   # [] —— 已经耗尽
print("第三次 next:", end=" ")
try:
    next(g)
except StopIteration:
    print("StopIteration")
```

```python
# 输出：
# 第一轮: [1, 2]
# 第二轮: []
# 第三次 next: StopIteration
```

第二轮 `list(g)` 返回空列表，因为第一轮已经把 g next 到耗尽。这不是 bug 是设计：生成器就是一次性流水线。要重复迭代，要么重新调用生成器函数造个新的（`small()` 再调一次），要么用 `itertools.tee` 复制（有代价），要么干脆把结果物化成 list。

**推荐 vs 不推荐**

```python
def process(gen):
    # 不推荐：对同一个生成器遍历两次，第二次啥也得不到
    total = sum(gen)
    count = len(list(gen))   # 这一行 gen 已经耗尽，得到 0
    return total, count

# 推荐：要么物化一次后复用，要么重新生成
def process_good(make_gen):
    data = list(make_gen())   # 物化一次
    return sum(data), len(data)
    # 或：需要惰性又想多次遍历，就 make_gen() 再调一次造新生成器
```

#### 2.6.3 调试时副作用时序需注意

前面 2.4 节已经展示了副作用时序的交错现象。这里再强调一个调试技巧：**当生成器行为不符合预期时，先把"它到底什么时候被执行"搞清楚，再谈逻辑对错**。因为在惰性模型下，"创建"和"执行"是脱节的，很多看似的逻辑错误其实是"我以为它执行了但其实没"或"我以为现在执行了其实要等下次 next"。

典型场景：在生成器里 open 文件但忘了消费，以为文件已被读取；在生成器里改计数器但消费发生在另一个函数，调试时发现计数器"莫名其妙"没变。排查方式统一是：在每个 yield 前后加 print，看副作用到底在哪一步发生。

### 2.7 链式惰性：map / filter / 生成器表达式叠加

惰性求值最优雅的展开形式是"生成器链"：把多个生成器串起来，每个都是惰性的，整条链形成一条按需供货的管线。数据一个一个流过整条链，而不是每一段都把全部数据物化一遍。

#### 2.7.1 生成器表达式本身就是惰性的

`(expr for x in iterable)` 这种生成器表达式，等价于一个 yield expr 的生成器函数，它不会立即算出所有值：

```python
squares_lazy = (x * x for x in range(5))
print(squares_lazy)              # generator object，没算任何值
print("next 1:", next(squares_lazy))   # 0 —— 这才开始算
print("next 2:", next(squares_lazy))   # 1
print("rest:", list(squares_lazy))     # [4, 9, 16] —— 把剩余消费掉
```

```python
# 输出：
# <generator object <genexpr> at 0x...>
# next 1: 0
# next 2: 1
# rest: [4, 9, 16]
```

#### 2.7.2 map / filter 返回的也是惰性迭代器

Python 3 的 `map` 和 `filter` 不再返回 list，而是返回惰性迭代器。它们只有在被消费时才去底层取数据、施加变换。

```python
nums = [1, 2, 3, 4, 5]
doubled = map(lambda x: x * 2, nums)           # 惰性
evens = filter(lambda x: x % 2 == 0, doubled)  # 在 doubled 上再叠一层惰性
print("doubled:", doubled)   # <map object>
print("evens: ", evens)      # <filter object>
print("first:", next(evens)) # 4 —— 这一刻 doubled 才被 next，原始 nums[0]*2=2 被滤掉
```

```python
# 输出：
# doubled: <map object at 0x...>
# evens:  <filter object at 0x...>
# first: 4
```

#### 2.7.3 链式 map-filter 逐元素流经全过程打印

把"链式惰性"看穿，最好的办法就是在每个环节打点，看一个元素是怎么一段段流过去的。设计序列：原始 → 平方 → 过滤偶数 → 加 100，每一步都打点。

```python
def source(nums):
    """原始数据源：逐个吐出。"""
    for x in nums:
        print(f"    [source] yield {x}")
        yield x

def squared(gen):
    """惰性 map：每消费一个，才去 source 取一个。"""
    for x in gen:
        v = x * x
        print(f"    [squared] {x} -> {v}")
        yield v

def even_only(gen):
    """惰性 filter：偶数才往下传，奇数直接丢弃并继续取下一个。"""
    for x in gen:
        if x % 2 == 0:
            print(f"    [even_only] {x} 通过")
            yield x
        else:
            print(f"    [even_only] {x} 被丢弃，继续取下一个")

def plus_hundred(gen):
    """惰性 map 再叠一层。"""
    for x in gen:
        v = x + 100
        print(f"    [plus_hundred] {x} -> {v}")
        yield v

# 组装管线：注意这一步不产生任何计算
pipeline = plus_hundred(even_only(squared(source([1, 2, 3, 4]))))
print("==== 管线已组装，尚未消费 ====")

# 逐个消费，看每个值怎么流过整条链
print("---- 消费第 1 个 ----")
print("RESULT:", next(pipeline))
print("---- 消费第 2 个 ----")
print("RESULT:", next(pipeline))
```

```python
# 输出：
# ==== 管线已组装，尚未消费 ====
# ---- 消费第 1 个 ----
#     [source] yield 1
#     [squared] 1 -> 1
#     [even_only] 1 被丢弃，继续取下一个
#     [source] yield 2
#     [squared] 2 -> 4
#     [even_only] 4 通过
#     [plus_hundred] 4 -> 104
# RESULT: 104
# ---- 消费第 2 个 ----
#     [source] yield 3
#     [squared] 3 -> 9
#     [even_only] 9 被丢弃，继续取下一个
#     [source] yield 4
#     [squared] 4 -> 16
#     [even_only] 16 通过
#     [plus_hundred] 16 -> 116
# RESULT: 116
```

这个输出值得逐帧品味。当 `next(pipeline)` 被调用，**整条链被反向唤醒**：

- `plus_hundred` 的 `for x in gen` 调 `next(even_only_gen)` →
- `even_only` 的 `for x in gen` 调 `next(squared_gen)` →
- `squared` 的 `for x in gen` 调 `next(source_gen)` →
- `source` yield 出 1。

然后 1 沿链正向回流：squared 把它算成 1，even_only 发现是奇数丢弃，于是 even_only 的 for 循环进入下一轮，再度向 squared 要下一个，squared 向 source 要，source 给 2……直到 plus_hundred 终于拿到一个能 yield 的值（104），整次 `next(pipeline)` 才返回。

这就是链式惰性的精髓：**消费驱动逐级唤醒，数据像水流一样一个一个淌过管线，每一段在任何时刻只持有当前这一个值**。如果把链换成 `[x+100 for x in [v for v in [x*x for x in nums] if v%2==0]]` 这种列表推导层层物化，每一段都要算完整个列表才进入下一段——对大序列内存差异巨大。

**用生成器表达式写等价管线**

上面四个函数可以用生成器表达式压缩，但惰性本质完全一样：

```python
nums = [1, 2, 3, 4]
step1 = (x for x in nums)                    # source
step2 = (x * x for x in step1)               # squared
step3 = (x for x in step2 if x % 2 == 0)     # even_only
step4 = (x + 100 for x in step3)             # plus_hundred

print(list(step4))
```

```python
# 输出：
# [104, 116]
```

四个生成器表达式叠加，每个都把上一个作为输入。`list(step4)` 这一刻才驱动整条链消费到底，把结果物化成 `[104, 116]`。在 `list` 之前，没有任何值被算出来。

**管线中的"短路"现象**

链式惰性还有个特点：如果下游提前停止消费，上游也不会继续。比如上面的管线只 `take(1, pipeline)`：

```python
pipeline2 = plus_hundred(even_only(squared(source([1, 2, 3, 4, 5, 6]))))
first_only = [next(pipeline2)]
print("只取第一个:", first_only)
# 此时 source 里 2 之后的 3、4、5、6 一个都没被 next
# 整条管线停在 plus_hundred yield 104 之后的暂停点
```

```python
# 输出：
# 只取第一个: [104]
```

只取一个，source 后面几个数完全没被触达——惰性链的短路让"早停"非常省。

### 2.8 消费方式一览

驱动惰性求值的消费方式不止 `next` 和 `for`，把常见消费方式汇总成表，便于对照：

| 消费方式 | 行为 | 何时用 |
|---|---|---|
| `next(gen)` | 前进一步到一个 yield；耗尽抛 StopIteration | 手动控制每一步 |
| `for x in gen` | 反复 next 直到 StopIteration | 遍历全部 |
| `list(gen)` | 全部消费物化成列表 | 需要反复访问或索引 |
| `tuple(gen)` / `set(gen)` | 全部消费物化成对应容器 | 同上 |
| `sum(gen)` / `max(gen)` / `min(gen)` | 全部消费归约成一个值 | 聚合统计 |
| `any(gen)` / `all(gen)` | 消费到能确定结果为止（短路） | 存在性/全称判断，省时 |
| `dict(gen)` | 消费 (k, v) 对成字典 | 构造映射 |
| `collections.deque(gen, maxlen=0)` | 全部消费但不保存（"耗尽"） | 只为触发副作用 |
| `itertools.islice(gen, n)` | 惰性切片，只消费前 n 个 | 取前 N，保持惰性 |
| `zip(gen1, gen2)` | 同步消费多个，取最短 | 并行遍历 |

`any` 和 `all` 的短路特别值得一提：它们会消费到能确定结果就停，不会无脑耗到底。

```python
def checked():
    for i in range(1, 100):
        print(f"  check {i}")
        yield i > 0

print("any:", any(checked()))   # 第一个 True 就够，第 1 次即停
```

```python
# 输出：
#   check 1
# any: True
```

只打了 `check 1`，因为 `any` 看到 True 就立刻返回，不再 next。惰性链 + 短路消费 = 极致省。

---

## 3. 最佳实践

### 3.1 需要物化时别犹豫，需要惰性时别物化

惰性不是银弹。该物化成 list 的时候硬要用生成器，会让代码变慢更绕；该惰性的时候硬要 list，会吃光内存。判断标准是**是否会多次消费 / 数据量是否大**：

- 数据量小 + 需要多次访问 / 索引 / len → 直接 list。
- 数据量大 or 只需顺序遍历一次 or 无限序列 → 生成器。

```python
# 不推荐：小数据还用生成器，为了取 len 又 list 一次，绕
g = (x * 2 for x in range(5))
data = list(g)
print(len(data))

# 推荐：小数据直接列表推导
data = [x * 2 for x in range(5)]
print(len(data))
```

```python
# 不推荐：大数据先 list 再遍历，内存爆
# total = sum([x * x for x in range(10_000_000)])

# 推荐：生成器表达式，sum 消费时逐个算，内存恒定
total = sum(x * x for x in range(10_000_000))
```

注意 `sum(x * x for x in range(...))` 里没有外层方括号——传给 sum 的是生成器表达式而非列表推导，sum 边消费边累加，不预占。

### 3.2 别把生成器当"会自动执行的函数"

2.6.1 节已展示这个坑。实践准则：**如果你的生成器函数里写了副作用（写文件、发请求、改状态），调用处必须紧接着消费，不能创建即丢**。更稳妥的做法是——纯副作用逻辑干脆不要写成生成器，写成普通函数；生成器留给"产出数据"的场景。

```python
# 不推荐：副作用写成生成器，容易忘记消费
def send_batch(items):
    for item in items:
        api.post(item)    # 副作用
        yield item

# 调用方很容易写错：
send_batch(data)   # 啥都没发！

# 推荐：纯副作用用普通函数
def send_batch(items):
    for item in items:
        api.post(item)

# 调用即执行，没有"忘了消费"的隐患
```

### 3.3 对同一个生成器只消费一次

耗尽即止是硬约束。任何需要"看两遍"的场景都要显式处理：要么物化成 list，要么重新生成。

```python
# 不推荐：gen 被消费两次，第二次空
def analyze(gen):
    total = sum(gen)
    avg = total / len(list(gen))   # ZeroDivisionError，list 为空
    return avg

# 推荐一：物化一次
def analyze(data_iter):
    data = list(data_iter)
    return sum(data) / len(data)

# 推荐二：造生成器的工厂函数，要时再造
def analyze(make_gen):
    g1 = make_gen()
    total = sum(g1)
    g2 = make_gen()
    count = sum(1 for _ in g2)
    return total / count
```

### 3.4 调试惰性链时从下游往上打点

链式惰性出 bug 时，bug 现象往往在下游（最终结果不对），但根因在上游。逐级打 print 是最直接的定位手段：在每一层 yield 前后打印"收到什么、产出什么"，就能看到每个元素在哪一层出了问题。日志格式统一成 `[层名] 收到 X -> 产出 Y` 最好读，2.7.3 节的 demo 就是这个范式。

### 3.5 无限序列一定要配 take / break / islice

无限生成器很强大，但也意味着"如果你忘了设停止条件，for 循环会一直跑下去"。养成习惯：只要看到 `while True: yield`，立即想清楚消费方靠什么停。

```python
# 危险：没有停止条件的无限消费
# for x in natural_numbers():
#     print(x)          # 永远不停

# 安全：明确停止条件
for x in natural_numbers():
    if x > 100:
        break
    print(x)

# 安全：用 islice 取前 N
from itertools import islice
print(list(islice(natural_numbers(), 5)))
```

```python
# 输出：
# 1
# 2
# ...
# 100
# [1, 2, 3, 4, 5]
```

### 3.6 大管线优先用生成器表达式而非层层函数

2.7 节演示的链式管线，既能写成几个带 yield 的函数，也能写成几行生成器表达式。当每层逻辑都是简单变换时，生成器表达式更紧凑、可读性更好；当每层逻辑复杂、需要调试打点或复用单层时，拆成函数更清晰。取舍标准是"每层有多复杂、要不要单独调试"。

### 3.7 别用 list 去消费只想触发副作用的生成器

有时候你只是想让生成器里的代码跑一遍（触发副作用），根本不关心返回值。用 `list(gen)` 会白白构造一个大列表浪费内存。标准做法是 `collections.deque(gen, maxlen=0)`——它会把 gen 消费到底，但 maxlen=0 意味着不保留任何元素。

```python
from collections import deque

def echo_all(items):
    for x in items:
        print(f"  echo {x}")
        yield

# 不推荐：为了触发 print 而构造无用列表
# list(echo_all(range(1000000)))

# 推荐：消费但不保留
deque(echo_all(range(1_000_000)), maxlen=0)
```

---

## 4. 原理

### 4.1 生成器对象的内部结构：gi_frame 与 gi_running

理解惰性求值的底层机制，要从"生成器对象里到底装了什么"入手。一个生成器对象的核心字段有三个：

- **`gi_frame`**：一个帧对象（frame object）。它记录了函数体的执行位置（指令指针）、局部变量表、块栈等——简言之，"函数执行到哪儿了、本地状态是什么"全在这个帧里。它是生成器的"记忆"，让暂停-恢复成为可能。
- **`gi_running`**：一个布尔标志，表示生成器当前是否正在执行（防止重入）。
- **`gi_code`**：函数体的代码对象（只读的 bytecode），所有生成器实例共享同一份。

可以用 `inspect` 模块直接观察这几个字段，把"惰性"具象成可见的状态：

```python
import inspect

def gen_func():
    x = 10
    yield x
    y = 20
    yield y

g = gen_func()
print("创建后（未 next）:")
print("  gi_frame:", g.gi_frame)               # 有帧，停在函数开头
print("  gi_frame.f_locals:", g.gi_frame.f_locals)   # 空，还没执行到 x=10
print("  gi_running:", g.gi_running)           # False
print("  gi_suspended:", g.gi_suspended)       # False（Python 3.11+ 新增）

v1 = next(g)
print("\n第一次 next 后（停在第一个 yield）:")
print("  返回值:", v1)
print("  gi_frame:", g.gi_frame is not None)   # 仍有帧
print("  gi_frame.f_locals:", g.gi_frame.f_locals)   # {'x': 10}，y 还没赋值
print("  gi_suspended:", g.gi_suspended)       # True

v2 = next(g)
print("\n第二次 next 后（停在第二个 yield）:")
print("  返回值:", v2)
print("  gi_frame.f_locals:", g.gi_frame.f_locals)   # {'x': 10, 'y': 20}

try:
    next(g)
except StopIteration:
    pass
print("\n耗尽后:")
print("  gi_frame:", g.gi_frame)               # None！帧已结束被清理
print("  gi_running:", g.gi_running)           # False
```

```python
# 输出（Python 3.11+，f_locals 内容随版本略有不同）：
# 创建后（未 next）:
#   gi_frame: <frame at 0x...>
#   gi_frame.f_locals: {}
#   gi_running: False
#   gi_suspended: False
#
# 第一次 next 后（停在第一个 yield）:
#   返回值: 10
#   gi_frame: True
#   gi_frame.f_locals: {'x': 10}
#   gi_suspended: True
#
# 第二次 next 后（停在第二个 yield）:
#   返回值: 20
#   gi_frame.f_locals: {'x': 10, 'y': 20}
#
# 耗尽后:
#   gi_frame: None
#   gi_running: False
```

这段输出把惰性求值的底层事实摆得很清楚：

1. **创建时 gi_frame 已存在但 f_locals 为空**——帧造好了，但任何赋值都没发生，因为函数体一行没跑。这就是"创建不等于求值"的底层依据。
2. **第一次 next 后 f_locals 出现 {x: 10}**——函数体跑到了第一个 yield，`x = 10` 这条赋值此刻才执行。此时帧的执行指针停在第一个 yield 之后。
3. **第二次 next 后 f_locals 多了 {y: 20}**——从第一个 yield 恢复，跑完 `y = 20`，停在第二个 yield。
4. **耗尽后 gi_frame 为 None**——函数体走完，帧被回收，生成器进入"死亡"状态。再 next 直接抛 StopIteration，不再有帧可恢复。

### 4.2 next() 触发帧恢复的机制

`next(gen)` 在 CPython 里大致做这么几件事（概念层面，简化描述）：

1. 检查 `gen.gi_frame` 是否为 None。若 None，说明已耗尽，直接抛 `StopIteration`。
2. 检查 `gen.gi_running`。若 True，抛 `ValueError: generator already executing`（防止重入——一个生成器不能在它自己还没 yield 完时被再次 next）。
3. 把 `gi_running` 置 True，把 `gi_frame` 挂到当前调用栈，从帧记录的指令指针处继续执行 bytecode。
4. bytecode 执行到 `YIELD_VALUE` 指令时，把栈顶值作为本次 yield 的产出，保存当前指令指针和局部变量到帧里，把帧从调用栈摘下，`gi_running` 置 False，`next` 返回这个值。
5. 若 bytecode 执行到函数末尾（`RETURN_VALUE`），帧结束，`gi_frame` 置 None，`gi_running` 置 False，抛 `StopIteration`（若 return带了值，存到 `StopIteration.value`）。

关键点是"从帧记录的指令指针处继续执行"——这正是生成器能"走一步停一步"的根本。普通函数的帧是用完即弃的：函数返回帧就销毁。生成器的帧被"封存"在生成器对象里，指令指针停在 yield 处，等下次 next 把它重新挂回调用栈继续跑。**yield 不是 return，yield 是"带书签的暂停"**。

用 `dis` 看 bytecode 能看到 YIELD_VALUE 指令，直观感受"暂停点"：

```python
import dis

def tiny():
    x = 1
    yield x
    y = 2
    yield y

print(dis.dis(tiny))
```

```python
# 输出（关键字节码摘录，行号/偏移随版本变化）：
#   2           0 RESUME
#               2 LOAD_CONST  1 (1)
#               4 STORE_FAST  0 (x)
#   3           6 LOAD_FAST   0 (x)
#               8 YIELD_VALUE            ← 第一个 yield 暂停点
#   4          10 LOAD_CONST  2 (2)
#              12 STORE_FAST  1 (y)
#   5          14 LOAD_FAST   1 (y)
#              16 YIELD_VALUE            ← 第二个 yield 暂停点
#              18 LOAD_CONST  0 (None)
#              20 RETURN_VALUE
```

每遇到 `YIELD_VALUE`，解释器就把当前帧封存、控制权交回 `next` 的调用方。下次 next 时从 YIELD_VALUE 之后那条字节码继续。这就是"next 触发帧恢复从上次 yield 之后继续"的 bytecode 层真相。

### 4.3 未消费则帧不前进

这是惰性求值的核心机制的自然推论。因为帧的执行只发生在 `next`（或 `send`/`throw`/`close`）被调用时——这些方法才会把帧挂回调用栈跑 bytecode——所以没有消费动作，帧里的指令指针就永远停在上次那个位置，局部变量也不会变。

```python
def demo():
    print("  执行了")
    yield 1

g = demo()
# 什么都不做
import time
time.sleep(0.001)   # 假装过了很久
# 只要没人 next(g)，g.gi_frame 里的指令指针还在函数开头，print 永不执行
```

把帧想象成一盘暂停的录像带：你按播放键（next）它才走一格，按一次走一格。不按，它就定格在那里，放多久都不动。

这也解释了为什么无限生成器 `while True: yield` 不会把 CPU 跑满——while 循环的"下一轮"必须由 next 触发，没有 next，循环体不前进。

### 4.4 StopIteration 后帧结束、gi_frame 置 None

当一次 next 把帧从某个 yield 处恢复后，bytecode 一路执行到函数末尾的 `RETURN_VALUE` 而没再遇到 yield，帧就"寿终正寝"了。CPython 此刻：

1. 清理帧（释放局部变量、解构块栈）。
2. 把 `gen.gi_frame` 置为 None。
3. 构造一个 `StopIteration` 异常抛出（如果函数 `return value`，value 会存到 `StopIteration.value`）。

之后所有 `next(gen)` 在第一步检查 `gi_frame is None` 就直接抛 StopIteration，不会再 attempt 恢复帧——因为帧已经不存在了。这就是"耗尽即止、不能复活"的底层原因：**帧是生成器的全部记忆，帧没了，生成器就成了空壳**。

```python
def with_return_value():
    yield 1
    return "done"      # return 的值会进 StopIteration.value

g = with_return_value()
next(g)                # 1
try:
    next(g)
except StopIteration as e:
    print("StopIteration.value:", e.value)   # done
print("gi_frame is None:", g.gi_frame is None)
```

```python
# 输出：
# StopIteration.value: done
# gi_frame is None: True
```

`return` 在生成器里等价于"提前抛 StopIteration 并携带一个值"，这个值通过 `StopIteration.value` 透出。for 循环会默默吞掉这个异常，所以平时感知不到；但用 while + next 手动消费时可以拿到。

### 4.5 惰性链中每个生成器各自独立帧

链式惰性管线里，每一层都是一个独立的生成器对象，各有自己的 `gi_frame`。它们的帧互不干扰，各自记录各自的执行位置和局部变量。消费链时发生的"逐级唤醒"，本质是一次 `next` 调用引发的帧级联恢复。

以 2.7.3 节的 `plus_hundred(even_only(squared(source(...))))` 为例，当最外层 `next(pipeline)` 被调用时：

1. `pipeline`（plus_hundred 的生成器）的帧被挂回调用栈，从它 `for x in gen` 处执行，要取下一个 x，于是调用 `next(inner)`，inner 是 even_only 的生成器。
2. even_only 的帧被挂回调用栈，从它 `for x in gen` 处执行，要取下一个 x，于是调用 `next(inner2)`，inner2 是 squared 的生成器。
3. squared 的帧挂回，要 `next(source_gen)`。
4. source 的帧挂回，执行到 `yield x`，把 1 吐出来，封存自己的帧。
5. squared 拿到 1，算成 1，执行 `yield 1`，封存。
6. even_only 拿到 1，发现奇数丢弃，循环回到 `for x in gen` 再要一个 → 又触发 squared → source 的级联……
7. 直到 even_only 终于 yield 出一个偶数（4），plus_hundred 拿到它，加 100，`yield 104`，封存。
8. 最外层 `next(pipeline)` 返回 104。

整个过程中，四个生成器的帧**各自独立**：每个帧记着自己停在哪条 yield、自己的局部变量是什么。链式惰性不是"一个帧跑遍全程"，而是"多个帧交错地挂上/摘下调用栈"。这保证了：

- 每层的状态互不污染（even_only 的循环变量和 squared 的循环变量各住各家）。
- 任意一层都能暂停（每层遇到自己的 yield 就封存帧交回调用方）。
- 整条链的"逐元素流动"是帧级联调用的自然结果。

用 `gi_frame.f_locals` 可以观测到"各帧独立"：

```python
def layer(name, gen):
    for x in gen:
        local_sum = x  # 每层都有自己的 local_sum
        print(f"  [{name}] 帧局部变量:", end=" ")
        # 通过生成器自己的 gi_frame 看自己状态
        yield x

import types
src = (x for x in [1, 2, 3])
l1 = layer("L1", src)
l2 = layer("L2", l1)

# 消费一次，看两层帧的 locals
next(l2)
```

概念上：l1 和 l2 各有一个 gi_frame，l1 的 f_locals 记的是 l1 这层的 x、local_sum；l2 的 f_locals 记的是 l2 这层的。它们不会串。这就是链式惰性"每段独立"的底层保证。

### 4.6 从字节码看链式帧的级联

把链式消费时的"帧挂回—级联 next—帧封存"用一张时序图概括（每条竖线代表一次 next 调用链）：

```
调用方            plus_hundred          even_only            squared              source
  │                   │                     │                   │                   │
  │ next(pipeline)    │                     │                   │                   │
  ├──────────────────►│ 恢复帧, 要 next(inner)│                   │                   │
  │                   ├────────────────────►│ 恢复帧, 要 next(inner2)                 │
  │                   │                     ├──────────────────►│ 恢复帧, 要 next(src)
  │                   │                     │                   ├──────────────────►│ 恢复帧
  │                   │                     │                   │                   │ yield 1, 封存帧
  │                   │                     │                   │ 算 1*1=1, yield 1, 封存
  │                   │                     │ 1 是奇数, 丢弃, 再 next(inner2)        │
  │                   │                     ├──────────────────►│ 恢复帧, 要 next(src)
  │                   │                     │                   ├──────────────────►│ 恢复帧
  │                   │                     │                   │                   │ yield 2, 封存
  │                   │                     │                   │ 算 4, yield 4, 封存
  │                   │                     │ 4 偶数, yield 4, 封存                  │
  │                   │ 算 4+100=104, yield 104, 封存           │                   │
  │ ◄─────────────────┤ 返回 104            │                   │                   │
  │ 得到 104          │                     │                   │                   │
```

关键观察：一次最外层 `next` 在链上引发了多次内层 next（级联），每一层的帧经历了"挂回—执行—封存"的循环。两层 yield 之间的代码就是帧"挂回"期间跑的；yield 那一行就是帧"封存"的点。所有这些挂回/封存都在同一次最外层 `next` 的同步调用里完成——链式惰性没有任何异步或线程切换，纯粹是函数调用栈的嵌套。

### 4.7 yield 暂停与恢复的精确语义

补充几个容易被忽略的精确点，它们都和"帧的暂停/恢复"机制相关：

**yield 的"返回值"来自下一次 send/next。** `x = yield v` 这行有个容易被忽视的事实：yield 表达式不仅产出 v，它的"计算结果"会在下一次帧恢复时由 send/next 注入。`next(gen)` 等价于 `gen.send(None)`——所以 `x = yield v` 里 x 总是 None（除非用 send 传值）。这是协程语义的入口，但对惰性求值而言的要点是：yield 这一行在函数体内"既结束本次、又定义下次起点"。

```python
def with_receive():
    print("  start")
    received = yield "first"        # yield 产出 "first"；received 等下次恢复时注入
    print(f"  received = {received}")
    yield "second"

g = with_receive()
print("got:", next(g))              # 进入函数，yield "first"，received 还没拿到值
print("got:", next(g))              # 恢复，received = None（next 等价于 send(None)）
```

```python
# 输出：
#   start
# got: first
#   received = None
# got: second
```

**yield from 委派也是帧级联。** `yield from sub` 把控制权"委派"给子生成器 sub，本质上是把当前生成器的消费驱动直接转发给 sub 的帧，直到 sub 耗尽才回到当前生成器。这也是惰性链的一种实现方式，且 sub 的帧同样是独立的。

**close() 会向帧注入 GeneratorExit。** `gen.close()` 把 GeneratorExit 异常注入到生成器当前暂停点的帧里，触发帧清理。这也是"消费驱动帧"的一种特殊情形：不是让帧前进到下一个 yield，而是让帧在当前暂停点处理一个异常并退出。

这些都归于同一个底层机制：**帧的执行、暂停、终止，全都由"消费方对生成器的操作"驱动；没有操作，帧就是冻结的**。惰性求值就是这个机制在"产出数据"层面的外在表现。

---

## 5. 总结

### 5.1 本文内容要点

- 惰性求值是生成器的执行模型：创建时不执行函数体，消费时才逐段执行，每到一个 yield 暂停。
- 两条核心规则：按需前进（不消费不动）、一次一步（每次 next 最多过一个 yield）。
- `next(gen)` 驱动一次前进，停在 yield；连续 next 直到 StopIteration 即耗尽。
- `for x in gen` 本质是"反复 next 直到 StopIteration"的语法糖，提前 break 就停止消费。
- 用 print 在每个 yield 前后打点，可以把"走一步停一步"的轨迹完整可视化——这是调试生成器的核心范式。
- 惰性的好处：表示无限序列、随时能停、不预占内存（任意时刻只持有当前值和局部状态）。
- 惰性的注意点：不消费就不执行（"没人要就不干活"）、只能迭代一次耗尽即止、副作用时序取决于消费时机而非创建时机。
- 链式惰性：map / filter / 生成器表达式叠加都是惰性管线，消费驱动逐级唤醒，数据逐元素流过各层，每层独立帧。
- 底层原理：生成器对象持 `gi_frame`（执行位置 + 局部变量）和 `gi_running` 标志；next 挂回帧从上次 yield 之后继续；StopIteration 后帧结束 `gi_frame` 置 None；链中每个生成器各自独立帧，级联唤醒。

### 5.2 读完应能掌握

- 能说清"生成器创建时为什么不执行函数体"以及"next 如何驱动帧恢复"。
- 能用 print 调试法观察并解释一个生成器在每步 next 时的执行轨迹，包括副作用的精确发生时机。
- 能判断给定场景该用生成器（惰性）还是列表（即时），并说明理由。
- 能识别"生成器被创建但未消费导致副作用未触发"和"同一生成器被消费两次导致第二次为空"这两类常见 bug。
- 能用生成器表达式/链式函数构建多阶段惰性管线，并解释数据如何以"逐元素流过各层"的方式被处理。
- 能从 `gi_frame`、`gi_running`、YIELD_VALUE 字节码层面解释惰性求值与链式帧级联的工作原理。