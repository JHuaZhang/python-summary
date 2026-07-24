---
group:
  title: 【14】装饰器深度剖析
  order: 14
order: 8
title: 装饰器实战：lru_cache 缓存
nav:
  title: Python
  order: 1
---

## 1. 介绍

### 1.1 什么是缓存与 memoize

缓存（cache）是一种用空间换时间的优化手段：把某个计算过程的结果存起来，下次遇到"同样的输入"时直接返回存好的结果，跳过重复计算。缓存的思想在日常编程里无处不在——浏览器缓存网页资源、数据库缓存查询结果、CPU 的 L1/L2 缓存，都是同一个套路。

在 Python 函数层面，这种"按输入参数缓存结果"的技术有个专门的名字叫 **memoize（记忆化）**。它的核心逻辑非常朴素：

1. 用一个字典记录"参数 → 结果"的映射。
2. 函数被调用时，先用参数去字典里查，查到（命中）就直接返回缓存值；查不到（未命中）才执行真正的函数体，执行完后把结果存进字典，供下次使用。

当函数是**纯函数**（同样的输入永远产生同样的输出，且没有副作用）时，memoize 能带来巨大的性能提升，尤其是对那些计算量大、重复调用频繁的函数。

### 1.2 functools.lru_cache 是什么

`functools.lru_cache` 是 Python 标准库 `functools` 提供的一个**装饰器**，它把上面说的 memoize 逻辑帮你封装好了，并且加上了 **LRU（Least Recently Used，最近最少使用）淘汰策略**——当缓存条目达到上限时，自动淘汰最久没被访问的那一条，避免缓存无限膨胀。

最基本的用法如下：

```python
from functools import lru_cache

@lru_cache
def fib(n):
    """递归斐波那契，被 lru_cache 自动缓存"""
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)

print(fib(50))  # 输出：12586269025
```

如果不加 `@lru_cache`，递归版本的 `fib(50)` 因为存在海量的重复子问题调用，实际上在普通机器上要跑很久（指数级时间复杂度）；加上之后，每个 `n` 只计算一次，后续命中缓存，瞬间返回。

`lru_cache` 本质上就是一个"自带淘汰策略的 memoize 装饰器"。本章先讲解它的基本用法，后面会带你从手写 memoize 开始，一步步理解 `lru_cache` 的每一处设计。

## 2. 核心内容

### 2.1 手写一个简易 memoize 装饰器

要真正理解 `lru_cache`，最好的方式是先自己写一个简化版的缓存装饰器。这样你才能体会到标准库帮你处理了哪些问题、以及为什么它要设计那些参数。

**memoize 装饰器要做什么**

1. 在装饰器内部维护一个字典 `cache`，键是调用参数，值是对应的返回结果。
2. 返回一个 wrapper 函数，每次被调用时：
   - 先用参数去 `cache` 里查；
   - 命中则直接返回缓存值；
   - 未命中则执行原函数，把结果存进 `cache`，再返回。

下面是一个能工作的简易版本：

```python
def memoize(func):
    """简易 memoize 装饰器：用字典缓存 参数→结果"""
    cache = {}  # 闭包变量，每个被装饰函数独享一份

    def wrapper(*args):
        # 用参数元组 args 作为字典键
        if args in cache:
            print(f"  [缓存命中] {func.__name__}{args}")
            return cache[args]
        print(f"  [真正计算] {func.__name__}{args}")
        result = func(*args)
        cache[args] = result
        return result

    return wrapper


@memoize
def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)


print(fib(5))
```

运行这段代码，你会看到只有第一次出现某个 `n` 时才"真正计算"，后面都是命中缓存：

```
# 输出：
#   [真正计算] fib(5)
#   [真正计算] fib(4)
#   [真正计算] fib(3)
#   [真正计算] fib(2)
#   [真正计算] fib(1)
#   [真正计算] fib(0)
#   [缓存命中] fib(1)
#   [缓存命中] fib(2)
#   [缓存命中] fib(3)
#   [缓存命中] fib(4)
# 5
```

可以看出，`fib(5)` 在计算过程中递归触发了 `fib(4)`…`fib(0)` 的真正计算，但当递归回溯时，`fib(3)`、`fib(2)` 等的值已经缓存好了，第二处调用直接命中。这就是 memoize 节省重复计算的本质。

**加速效果对比**

光看命中日志感受不深，下面用计时器对比缓存前后的耗时，场景就是递归斐波那契——一个典型的"重复子问题"问题：

```python
import time

# 不缓存的版本
def fib_slow(n):
    if n < 2:
        return n
    return fib_slow(n - 1) + fib_slow(n - 2)

# 缓存的版本
@memoize
def fib_fast(n):
    if n < 2:
        return n
    return fib_fast(n - 1) + fib_fast(n - 2)

start = time.perf_counter()
print("fib_slow(35) =", fib_slow(35))
print(f"未缓存耗时: {time.perf_counter() - start:.4f}s")

start = time.perf_counter()
print("fib_fast(35) =", fib_fast(35))
print(f"缓存后耗时: {time.perf_counter() - start:.6f}s")
```

典型结果如下（数字随机器不同，但数量级差异明显）：

```
# 输出：
# fib_slow(35) = 9227465
# 未缓存耗时: 1.8423s
# fib_fast(35) = 9227465
# 缓存后耗时: 0.000124s
```

未缓存版本是 `O(2^n)` 的指数级复杂度，`n=35` 时函数被调用约 1800 万次；缓存的版本每个 `n` 只算一次，复杂度降到 `O(n)`，快了一万多倍。这就是"空间换时间"在这一类问题上的威力。

**这个简易版本的局限**

手写的 memoize 虽然能工作，但有几个明显的不足，也正是 `lru_cache` 要解决的问题：

1. **缓存无限增长**：`cache` 字典只增不减，调用参数种类越多，字典越大，最终可能吃光内存。
2. **不支持关键字参数**：上面只用 `*args` 做键，如果函数有 `**kwargs`，简单写成 `args` 元组无法覆盖关键字参数，会出错或漏存。
3. **没有淘汰策略**：当缓存太大时，无法自动清除"过时"的条目。
4. **没有缓存统计**：无法知道命中多少次、未命中多少次、当前缓存了多少条。
5. **非线程安全**：多线程同时访问字典可能出问题。

标准库的 `lru_cache` 正是为了解决这些问题而生的。

### 2.2 functools.lru_cache 的基本用法

`lru_cache` 是 `functools` 模块提供的装饰器，内部用一个字典 + 双向链表实现了"带淘汰策略的 memoize"。

**最小用法**

```python
from functools import lru_cache

@lru_cache
def square(n):
    print(f"  计算 {n} 的平方")
    return n * n

print(square(4))
print(square(4))  # 第二次命中缓存，不会打印"计算..."
```

```
# 输出：
#   计算 4 的平方
# 16
# 16
```

注意第二次 `square(4)` 没有打印"计算 4 的平方"，说明函数体压根没执行，直接从缓存拿到了 `16`。被 `lru_cache` 装饰后，函数调用被拦截，命中缓存时原函数完全不会被触发。

注意，不带括号写 `@lru_cache` 时，使用默认参数（`maxsize=128`, `typed=False`）。如果想自定义参数，必须写成 `@lru_cache(maxsize=...)` 这种带括号的形式。

### 2.3 参数详解：maxsize

`lru_cache` 的完整签名是：

```python
lru_cache(maxsize=128, typed=False)
```

**maxsize** 控制缓存最多保存多少条不同的调用结果。

- `maxsize` 是一个正整数时，缓存最多保留这么多个条目；满了之后按 LRU 策略淘汰最久未访问的条目。
- `maxsize=None` 表示**不限制大小**，缓存会无限增长直到你手动 `cache_clear()` 或进程结束。此时退化为一个不带淘汰的纯 memoize。
- `maxsize=0` 实际上禁用缓存（每次都不命中，但也不存储），一般不会这么用；如果真想禁用，直接不装饰即可。

**对比有界与无界缓存**

下面这个例子展示 `maxsize` 满了之后的行为：

```python
from functools import lru_cache

@lru_cache(maxsize=3)
def greet(name):
    print(f"  [计算] greet({name})")
    return f"hello, {name}"

# 依次访问 4 个不同的 key，但 maxsize 只有 3
print(greet("a"))
print(greet("b"))
print(greet("c"))
print(greet("d"))   # 插入第 4 个，淘汰最久未用的 "a"
print(greet("a"))   # "a" 已被淘汰，需要重新计算
print(greet("b"))   # "b" 命中缓存
```

```
# 输出：
#   [计算] greet(a)
# hello, a
#   [计算] greet(b)
# hello, b
#   [计算] greet(c)
# hello, c
#   [计算] greet(d)
# hello, d
#   [计算] greet(a)
# hello, a
#   [计算] greet(b)
# hello, b        <-- 注意：这里 "b" 也未命中！
```

最后 `greet("b")` 为什么也没命中？因为 LRU 的淘汰是按"最近访问"排序的。当我们调用 `greet("a")` 触发重新计算时，"a" 被标记为最新使用，同时把链表最尾部的 "b" 推向了淘汰区。紧接着访问的 "d" 实际上又把某个条目淘汰了。LRU 的具体顺序在第 4 章会详细画出来，这里只需记住：**maxsize 满了之后，最久没被访问的条目会被丢弃**。

**maxsize 该设多大**

- 如果你能预估不同入参的总数是有限的、且不多（比如几十个），设一个大一点的值或 `None` 都无所谓。
- 如果入参的范围很大、甚至不可控（比如用字符串做 key、调用次数极多），一定要设一个合理的上限，否则缓存会变成内存泄漏源。
- 经验法则：`maxsize` 会影响字典大小 + 双向链表节点数，每条缓存大约几百字节（含 key/value 引用），估算内存占用后再定值。

### 2.4 参数详解：typed

**typed** 控制"是否区分类型相同但值相等的参数"，默认 `False`。

- `typed=False`（默认）：`3` 和 `3.0` 被视为同一个 key（因为 `3 == 3.0` 且 `hash(3) == hash(3.0)`）。
- `typed=True`：`3` 和 `3.0` 被视为不同的 key，分别缓存。

举个例子：

```python
from functools import lru_cache

@lru_cache(typed=False)  # 默认行为
def add_one(x):
    print(f"  [计算] add_one({x!r})")
    return x + 1

print(add_one(3))
print(add_one(3.0))   # 与 3 视为同一 key，命中缓存
```

```
# 输出：
#   [计算] add_one(3)
# 4
# 4
```

第二次 `add_one(3.0)` 没打印"计算"，说明命中了 `add_one(3)` 的缓存。但这里有个隐蔽的陷阱：返回值 `4`（int）实际上是从 `add_one(3)` 缓存的，而调用者传的是 `3.0`（float），期望可能拿到 `4.0`。如果业务上对类型敏感，要小心。

设 `typed=True` 就能区分：

```python
@lru_cache(typed=True)
def add_one_typed(x):
    print(f"  [计算] add_one_typed({x!r})")
    return x + 1

print(add_one_typed(3))
print(add_one_typed(3.0))   # 与 3 区分，重新计算
```

```
# 输出：
#   [计算] add_one_typed(3)
# 4
#   [计算] add_one_typed(3.0)
# 4.0
```

这次两次都进了函数，而且返回类型也正确区分了 `int` 和 `float`。

**typed 什么时候要开**

绝大多数情况下保持 `typed=False` 即可。只有在以下情形才考虑开 `typed=True`：

- 函数对参数类型敏感，比如 `f(3)` 与 `f(3.0)` 返回值类型不同；
- 业务上把 `3` 和 `3.0` 当作"不同的输入"，混用会导致逻辑错误。

注意 `typed` 只影响"值相等但类型不同"的参数，对 `True == 1` 这类也成立：`f(True)` 与 `f(1)` 在 `typed=False` 下命中同一缓存，`typed=True` 下分别缓存。

### 2.5 装饰器适用条件：哪些函数适合用 lru_cache

`@lru_cache` 不是万能药，它只适合**纯函数**——满足下面两个条件的函数：

1. **确定性**：同样的参数永远返回同样的结果。不能依赖随机数、当前时间、全局状态、网络请求结果等每次都可能不同的外部因素。
2. **无副作用或副作用可接受**：函数不应该修改外部可变状态（比如全局变量、传入的可变参数）。如果函数既有副作用又依赖返回值，缓存后副作用可能不再发生，导致程序行为改变。
3. **参数可哈希**：`lru_cache` 用参数作为字典的键，所以参数必须可哈希（下面 2.7 节专门讲这个约束）。

**适合的函数示例**

- 数学计算：斐波那契、阶乘、组合数 `C(n, k)`、幂运算等。
- 动态规划类问题：爬楼梯、背包问题、最长公共子序列等"重叠子问题"密集的场景。
- 纯数据转换：把一条记录按某种规则归一化、解析一段固定格式文本。
- 结果可重复的外部调用：比如对同一 URL 的 HTTP GET，且你接受"短时间内用旧结果"（此时要额外考虑缓存陈旧问题，见 2.10）。

**不适合的函数示例**

```python
import random
import time

# 反例 1：依赖随机数，结果不确定
@lru_cache
def random_in_range(a, b):
    return random.randint(a, b)

print(random_in_range(1, 100))  # 第一次返回 42
print(random_in_range(1, 100))  # 第二次命中缓存，仍返回 42，不再是随机数！
```

```
# 输出：
# 42
# 42
```

第二次本意是再要一个随机数，结果被缓存"锁住"了，永远返回 42。

```python
# 反例 2：依赖当前时间
@lru_cache
def now_str():
    return time.strftime("%H:%M:%S")

print(now_str())   # 假设输出 10:00:00
import time as _t; _t.sleep(2)
print(now_str())   # 命中缓存，仍是 10:00:00，时间"不走了"
```

这两个反例都说明：**只有在结果确定且可复用时缓存才有意义**。

### 2.6 查看缓存信息：cache_info()

`lru_cache` 装饰后的函数对象上挂了一个 `cache_info()` 方法，返回一个 `CacheInfo` 命名元组，包含四个字段：

| 字段 | 含义 |
|---|---|
| `hits` | 缓存命中次数 |
| `misses` | 未命中次数（真正执行原函数的次数） |
| `maxsize` | 缓存最大容量 |
| `currsize` | 当前缓存条目数 |

用法：

```python
from functools import lru_cache

@lru_cache(maxsize=10)
def square(n):
    return n * n

# 调用一些值
for i in range(5):       # 0,1,2,3,4 写入缓存
    square(i)
square(2)                # 命中
square(3)                # 命中
square(2)                # 命中

info = square.cache_info()
print(info)
print(f"命中 {info.hits} 次，未命中 {info.misses} 次")
```

```
# 输出：
# CacheInfo(hits=3, misses=5, maxsize=10, currsize=5)
# 命中 3 次，未命中 5 次
```

`cache_info()` 在调优时非常有用：如果命中率为 0，说明缓存完全没起作用，要么是参数每次都不同，要么是 `maxsize` 太小一直在淘汰；如果命中率很高，说明缓存配置合理。

### 2.7 清空缓存：cache_clear()

调用 `func.cache_clear()` 可以手动清空缓存，释放所有条目：

```python
@lru_cache(maxsize=5)
def square(n):
    return n * n

for i in range(5):
    square(i)

print(square.cache_info())   # currsize=5

square.cache_clear()
print(square.cache_info())   # currsize=0, hits/misses 也清零
```

```
# 输出：
# CacheInfo(hits=0, misses=5, maxsize=5, currsize=5)
# CacheInfo(hits=0, misses=0, maxsize=5, currsize=0)
```

注意 `cache_clear()` 同时会把 `hits` 和 `misses` 计数器归零。这在你想"重新开始统计"时也很方便。

**何时需要手动清缓存**

- 长期运行的服务进程里，如果缓存的函数过期了（比如配置更新，老结果不再有效），调用 `cache_clear()` 让后续调用重新计算。
- 测试中，在每次用例之间清空缓存，避免相互干扰。
- 怀疑缓存陈旧导致结果异常时，先 `cache_clear()` 再复现。

### 2.8 参数可哈希约束

`lru_cache` 的底层是字典，字典的键来自调用参数。Python 字典要求键**可哈希**（hashable），所以传给 `@lru_cache` 函数的参数也必须可哈希。

**可哈希的类型**：`int`、`float`、`str`、`tuple`（且元组内所有元素也可哈希）、`frozenset`、`None`、`bool` 等不可变类型。

**不可哈希的类型**：`list`、`dict`、`set` 等可变容器，它们没有稳定的 `__hash__`，因为内容可变，作为字典键会引发一致性灾难。

如果你给 `@lru_cache` 装饰的函数传一个 `list`，会直接 `TypeError`：

```python
from functools import lru_cache

@lru_cache
def sum_list(nums):
    return sum(nums)

sum_list([1, 2, 3])   # list 不可哈希，作为 cache key 会报错
```

```
# 输出（报错）：
# TypeError: unhashable type: 'list'
```

`lru_cache` 在第一次调用前就会用参数构造字典 key，遇到不可哈希类型立刻抛错。

**解决方案：把可变容器转为不可变容器**

- `list` → `tuple`
- `set` → `frozenset`
- `dict` → `tuple(sorted(d.items()))` 或 `frozenset(d.items())`（如果 key/value 都可哈希）

```python
from functools import lru_cache

@lru_cache
def sum_tuple(nums):
    # 接收元组，元组可哈希
    return sum(nums)

print(sum_tuple((1, 2, 3)))
print(sum_tuple((1, 2, 3)))   # 命中
```

```
# 输出：
# 6
# 6
```

更好的做法是在 wrapper 里做转换，对外仍接收 `list`：

```python
from functools import lru_cache, wraps

def list_safe_cache(func):
    """对外接收 list，内部转 tuple 做缓存键"""
    @lru_cache(maxsize=128)
    def cached(nums_tuple, *args, **kwargs):
        return func(list(nums_tuple), *args, **kwargs)

    @wraps(func)
    def wrapper(nums, *args, **kwargs):
        return cached(tuple(nums), *args, **kwargs)

    return wrapper

@list_safe_cache
def sum_list(nums):
    print(f"  [计算] sum_list({nums})")
    return sum(nums)

print(sum_list([1, 2, 3]))
print(sum_list([1, 2, 3]))   # 命中
```

```
# 输出：
#   [计算] sum_list([1, 2, 3])
# 6
# 6
```

第二次调用 `sum_list([1, 2, 3])` 没打印"计算"，说明命中了缓存，同时对外接口仍然是 `list`。

### 2.9 为何缓存对递归效果显著

递归斐波那契之所以慢，根本原因是**重叠子问题**：`fib(n)` 会调用 `fib(n-1)` 和 `fib(n-2)`，而 `fib(n-1)` 又会调用 `fib(n-2)` 和 `fib(n-3)`——同一个 `fib(k)` 会被重复计算很多次。整个调用树是指数级膨胀的。

加了缓存后，每个 `fib(k)` 只计算一次，后续的调用都从缓存拿。递归调用树从"指数级"被"压平"成了"线性"——每个子问题只算一次，这正是动态规划"记忆化搜索"的思想。

再看一个爬楼梯的例子：你站在第 `n` 级台阶，每次可以走 1 步或 2 步，问从第 0 级走到第 `n` 级有多少种走法。递推式 `ways(n) = ways(n-1) + ways(n-2)`，跟斐波那契一样：

```python
from functools import lru_cache

@lru_cache(maxsize=None)   # 这种 DP 题目，参数范围可控，直接用无限缓存
def ways(n):
    if n < 0:
        return 0
    if n == 0:
        return 1
    return ways(n - 1) + ways(n - 2)

print(ways(100))   # 瞬间出结果，无缓存的话递归到 100 早就栈溢出或超时了
```

```
# 输出：
# 573147844013817084101
```

这类"重叠子问题 + 递归"的问题，是 `lru_cache` 的天然主场。一个问题只要能写成递推式 + 递归实现，且参数是离散可哈希的，套上 `@lru_cache` 通常立刻就能跑得很快。

### 2.10 典型应用场景

**场景一：数学计算 / 动态规划**

上面已经讲了斐波那契和爬楼梯。类似的还有：

```python
from functools import lru_cache
import math

@lru_cache(maxsize=None)
def comb(n, k):
    """组合数 C(n, k)，用递推公式 + 缓存"""
    if k == 0 or k == n:
        return 1
    if k > n:
        return 0
    return comb(n - 1, k - 1) + comb(n - 1, k)

print(comb(50, 10))   # 输出：10272278170
```

组合数也有大量重叠子问题，缓存后 `comb(50, 10)` 计算飞快。

**场景二：HTTP 结果缓存**

对同一个 URL 多次请求时，可以用缓存避免重复发起 HTTP 调用（前提是接受短时间内结果一致）：

```python
from functools import lru_cache
import urllib.request

@lru_cache(maxsize=32)
def fetch(url):
    print(f"  [发起 HTTP 请求] {url}")
    with urllib.request.urlopen(url) as resp:
        return resp.read().decode("utf-8")

# 假设调用同一个 url 两次
print(len(fetch("https://example.com")))
print(len(fetch("https://example.com")))   # 命中，不再次发请求
```

```
# 输出（示意）：
#   [发起 HTTP 请求] https://example.com
# 1256
# 1256
```

第二次调用直接命中缓存，不再发起 HTTP 请求。但要注意：**外部数据会变**，如果缓存时间长，可能拿到陈旧结果。下面 2.11 会专门讲这个陷阱。

**场景三：解析/编译结果的复用**

比如正则表达式编译、JSON Schema 校验器的构建，这类"编译一次多次用"的场景：

```python
import re
from functools import lru_cache

@lru_cache(maxsize=128)
def get_pattern(pattern_str):
    print(f"  [编译正则] {pattern_str}")
    return re.compile(pattern_str)

get_pattern(r"\d+")
get_pattern(r"\d+")   # 命中，复用已编译的 pattern 对象
get_pattern(r"\d+")   # 命中
```

```
# 输出：
#   [编译正则] \d+
```

只编译了一次。后续两次命中缓存，直接拿到之前编译好的 `Pattern` 对象。

**场景四：单例化 / 记忆化对象工厂**

`lru_cache` 也能用来做"按参数返回同一对象"的工厂——同一个参数永远返回同一个实例：

```python
from functools import lru_cache

class Connection:
    def __init__(self, dsn):
        self.dsn = dsn
        print(f"  [建立连接] {dsn}")

@lru_cache(maxsize=8)
def get_connection(dsn):
    return Connection(dsn)

get_connection("mysql://host1")   # 触发建连
get_connection("mysql://host1")   # 命中，复用同一连接对象
get_connection("mysql://host1")   # 命中

print(get_connection.cache_info())
```

```
# 输出：
#   [建立连接] mysql://host1
# CacheInfo(hits=2, misses=1, maxsize=8, currsize=1)
```

`hits=2` 说明后两次复用了第一次创建的对象，实现了"按 dsn 单例化"。这种用法比手写单例字典更简洁，但要意识到：被缓存的对象会一直被引用，不会被 GC 回收（2.11 会讲）。

### 2.11 lru_cache 的陷阱

**陷阱一：参数必须可哈希**

这个前面已经讲过，不再赘述。核心是：传入 `list`、`dict`、`set` 会 `TypeError`，需要转成 `tuple` / `frozenset`。

**陷阱二：缓存持有引用导致对象不释放（内存泄漏）**

`lru_cache` 的字典里存着"参数 → 结果"的引用，只要缓存还在，这些对象就不会被垃圾回收。如果你缓存的是大对象、或者参数本身是大对象，长期运行的服务进程会逐渐积累内存，最终表现为"内存泄漏"。

```python
from functools import lru_cache

@lru_cache(maxsize=None)   # 无限缓存
def build_big_array(seed):
    # 每次返回一个 1MB 的 bytes
    return bytes([seed % 256] * (1024 * 1024))

# 模拟长期运行：不断用不同的 seed 调用
for i in range(1000):
    build_big_array(i)

# 此时缓存里已经堆了 ~1GB 的 bytes，永远不会被释放
print(build_big_array.cache_info())
```

```
# 输出：
# CacheInfo(hits=0, misses=1000, maxsize=None, currsize=1000)
```

`currsize=1000`，1000 个 1MB 的 `bytes` 对象都挂在缓存里，约 1GB——这就是内存泄漏。解决方法：

- 设一个合理的 `maxsize`，让老条目自动被 LRU 淘汰；
- 在合适的时机调用 `cache_clear()` 主动清空；
- 对于"一次性计算"场景，用完就清缓存。

**陷阱三：缓存的函数依赖外部可变状态时出错（陈旧缓存）**

如果被缓存的函数依赖某个全局变量或闭包外的可变对象，那么这个外部状态变化后，缓存里存的旧结果就不对了，但 `lru_cache` 不知道，还会继续返回旧值。这就是"缓存陈旧"问题。

```python
from functools import lru_cache

TAX_RATE = 0.1   # 全局税率

@lru_cache(maxsize=128)
def price_with_tax(price):
    return price * (1 + TAX_RATE)

print(price_with_tax(100))   # 110.0

TAX_RATE = 0.2   # 税率改了，但 lru_cache 不知道
print(price_with_tax(100))   # 仍返回 110.0，缓存陈旧！
```

```
# 输出：
# 110.0
# 110.0
```

第二次 `price_with_tax(100)` 命中了缓存，返回的还是旧税率下的 110，而不是新税率下的 120。这就是"被缓存的函数依赖外部可变状态"导致的 bug。

规避方法：

- 让外部状态成为函数参数，迫使参数变化时缓存自动区分（`price_with_tax(price, tax_rate)`）；
- 外部状态改变后，手动 `cache_clear()`；
- 不用 `lru_cache`，改用手动管理的缓存，在状态变化时主动失效。

```python
# 改进：把依赖的状态作为参数
@lru_cache(maxsize=128)
def price_with_tax_fix(price, tax_rate):
    return price * (1 + tax_rate)

print(price_with_tax_fix(100, 0.1))   # 110.0
print(price_with_tax_fix(100, 0.2))   # 120.0，参数变了，缓存区分
```

```
# 输出：
# 110.0
# 120.0
```

把 `tax_rate` 作为参数传入，`lru_cache` 会把它作为 key 的一部分，于是 `(100, 0.1)` 和 `(100, 0.2)` 被视为不同的调用，各自缓存正确的值。

**陷阱四：带副作用的函数被缓存后副作用消失**

如果一个函数除了返回值还有副作用（比如打印日志、写文件、发请求），被缓存后，命中时副作用不会发生：

```python
from functools import lru_cache

@lru_cache
def log_and_compute(x):
    print(f"  [日志] computing {x}")   # 副作用
    return x * x

print(log_and_compute(5))   # 打印日志 + 返回 25
print(log_and_compute(5))   # 命中缓存，日志没打印，只返回 25
```

```
# 输出：
#   [日志] computing 5
# 25
# 25
```

第二次没打印日志——副作用被缓存"吃掉"了。如果你依赖日志进行审计，这就是 bug。所以 `lru_cache` 只该装饰**纯函数**，有副作用的函数要么不缓存，要么把副作用拆出去单独处理。

### 2.12 functools.cache（Python 3.9+）

Python 3.9 新增了 `functools.cache`，它等价于 `lru_cache(maxsize=None)`——一个不带淘汰策略的无限缓存。当你确定"参数种类有限、不会无限增长"时，用 `cache` 更直观：

```python
from functools import cache

@cache
def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)

print(fib(100))
```

```
# 输出：
# 354224848179261915075
```

**cache 与 lru_cache 的取舍**

| 特性 | `functools.cache` | `functools.lru_cache` |
|---|---|---|
| 缓存上限 | 无限（`maxsize=None` 的别名） | 可设 `maxsize`，有 LRU 淘汰 |
| 内部结构 | 只有字典（O(1) 存取） | 字典 + 双向链表（维护 LRU 顺序） |
| 内存占用 | 略低（无链表节点） | 略高（每个条目多了链表指针） |
| 命中速度 | 略快（不需要移动链表节点） | 略慢（命中时要移动到链表头部） |
| 适用场景 | 参数种类有限、确定不会爆炸 | 参数范围大、需要限制内存 |

简单说：参数可控就用 `cache`（更轻快），参数不可控就用 `lru_cache(maxsize=N)`（更安全）。

## 3. 最佳实践

**实践一：只在纯函数上用 lru_cache**

被缓存的函数必须是"同样的输入永远产生同样的输出，且不依赖/修改外部状态"。如果函数有随机性、依赖时间、依赖全局可变状态，缓存就会导致错误结果。这是首要前提，违反这条再讨论其他都没意义。

**实践二：给 maxsize 一个合理值**

不要无脑写 `@lru_cache`（默认 `maxsize=128`）或 `@lru_cache(maxsize=None)`（无限）。应该根据参数的可能取值总数来设：

- 如果总取值数远小于 128，默认值就够；
- 如果可能取值很多（比如字符串参数、长整型参数），务必设一个能控制内存的上限，例如 `maxsize=1024`；
- 如果确定性很强且取值有限（比如枚举值、小整数），直接用 `functools.cache` 更简洁。

**实践三：用 cache_info() 验证缓存是否有效**

上线前用 `cache_info()` 看一眼命中率。如果 `misses` 远大于 `hits`，说明缓存几乎没起作用——要么参数每次都不同（缓存粒度太细），要么 `maxsize` 太小（一直淘汰），这时要么调整参数设计，要么放弃缓存。

**实践四：把依赖的外部状态变成参数**

如果函数依赖某个会变化的外部量（税率、配置、时间），不要让它藏在闭包里，而是作为参数传入。这样状态变化时参数也变，`lru_cache` 自然把它们当成不同的调用，缓存就不会陈旧。2.11 的 `price_with_tax_fix` 就是这个思路。

**实践五：长期运行服务要定期清缓存或设上限**

Web 服务一跑就是几个月，`lru_cache` 的字典只增不减（设了 `maxsize` 才会淘汰）。对那种"结果会过期"的缓存（比如配置、汇率、用户信息），要么用 `maxsize` 控制，要么在状态变化时主动 `cache_clear()`，要么干脆用专门的缓存库（如 `cachetools`）支持 TTL 过期。

**实践六：不要缓存大对象**

缓存大对象会吃内存。如果一个函数返回几 MB 的数据，且参数种类多，`lru_cache` 会把所有结果都囤着。要么减小缓存粒度，要么用带 LRU 淘汰的 `maxsize` 控制总量，要么干脆不缓存，改为在业务层用 Redis 之类的外部缓存。

**实践七：测试时记得清缓存**

单元测试里用 `@lru_cache` 装饰的函数会在用例之间共享缓存，可能导致用例相互干扰。规范做法是在每个用例开头或 `setUp` 里调用 `func.cache_clear()`，保证每个用例都在干净的缓存上跑。

**实践八：推荐写法对比**

```python
# 不推荐：无限缓存 + 函数依赖外部可变状态
CONFIG = {"rate": 0.1}

@lru_cache(maxsize=None)
def calc(price):
    return price * (1 + CONFIG["rate"])

# 推荐：把可变状态当参数，并设合理上限
@lru_cache(maxsize=1024)
def calc(price, rate):
    return price * (1 + rate)
```

不推荐版本里 `CONFIG["rate"]` 一旦改了，缓存立刻陈旧；推荐版本把 `rate` 作为参数，状态变了参数也变，缓存自动正确区分。

## 4. 原理

### 4.1 memoize 用字典缓存"参数→结果"的哈希机制

先从手写 memoize 的底层机制讲起。memoize 的核心是 Python 的字典，字典又是基于哈希表实现的。

当你写 `cache[args]` 时，Python 做了以下事情：

1. 对 key（这里是参数元组 `args`）调用 `hash(args)`，得到一个整数哈希值。
2. 用这个哈希值对字典内部的表取模，定位到一个"桶"（bucket）。
3. 在桶里比较 `args` 和已有 key 是否相等（`==`）。如果相等，命中；如果不等（哈希冲突），继续看桶里的下一个条目。
4. 命中则返回对应 value；未命中则插入新条目。

这就是为什么 `lru_cache` 要求参数可哈希——字典需要 `hash()` 和 `__eq__` 来定位和管理条目。`list`、`dict`、`set` 这些类型没有实现稳定的 `__hash__`（因为内容可变，哈希值会变），所以不能当字典 key，也就不能作为 `lru_cache` 的参数。

memoize 装饰器用闭包持有 `cache` 字典，每次调用 wrapper 时走一遍"查字典 → 命中返回 / 未命中执行并存入"的流程。这是缓存最朴素也是最快的实现——字典查找平均 O(1)。

### 4.2 lru_cache 的 LRU 淘汰实现：字典 + 双向链表

`lru_cache` 在 memoize 的基础上加了"最近最少使用"淘汰策略。数据结构是经典的**字典 + 双向链表**组合：

- **字典**：负责 O(1) 的"参数 → 链表节点"查找。键是参数，值是指向链表节点的引用。
- **双向链表**：维护所有缓存条目的"使用顺序"。每次访问一个条目，就把它移到链表头部（表示最近用过）；当缓存满了要淘汰时，直接砍掉链表尾部的节点（最久没用的）。

**为什么需要两个结构？** 字典擅长"按 key 查找"（O(1)），但不擅长维护顺序；双向链表擅长"调整顺序"（节点指针操作 O(1)），但不擅长按值查找。两者结合，用字典做快速查找、用链表做顺序维护，各取所长。

**一次"命中"的内部流程**

假设调用 `f(3)` 且 `3` 已在缓存中：

1. 用参数 `3` 去字典查找，O(1) 定位到对应的链表节点。
2. 把这个节点从当前位置摘下来，插入链表头部（标记为"最近使用")。
3. 返回节点里存的 value。

注意第 2 步只是指针操作，O(1)，没有重新计算原函数。这就是命中时"省去原函数执行"的全部秘密。

**一次"未命中"的内部流程**

假设调用 `f(5)` 且 `5` 不在缓存中：

1. 字典里查 `5`，查不到——未命中。
2. 执行原函数 `f(5)`，拿到结果 `result`。
3. 检查当前缓存是否已满（`currsize == maxsize`）：
   - 如果满了，先淘汰链表尾部的节点（最久未使用）：从字典里删掉它的 key，从链表里摘掉节点。
   - 如果没满，直接进入下一步。
4. 创建一个新链表节点，存 `(5, result)`，插入链表头部。
5. 在字典里登记 `5 → 新节点`。
6. 返回 `result`。

这样每次未命中都会把新条目放在"最新"位置，老的条目自然往尾部推移，满了就淘汰最尾部——这就是 LRU（Least Recently Used）的语义。

**一个具体例子演示链表变化**

设 `maxsize=3`，依次调用 `f(a)`, `f(b)`, `f(c)`, `f(a)`, `f(d)`：

```
调用 f(a)：未命中，插入 a。            链表：[a]             字典：{a}
调用 f(b)：未命中，插入 b 到头部。      链表：[b, a]          字典：{a, b}
调用 f(c)：未命中，插入 c 到头部。      链表：[c, b, a]       字典：{a, b, c}（满了）
调用 f(a)：命中，把 a 移到头部。        链表：[a, c, b]       字典：{a, b, c}
调用 f(d)：未命中，满了，淘汰尾部 b。    链表：[d, a, c]       字典：{a, c, d}
```

最后字典里没有 `b`——因为在 `f(d)` 时 `b` 是最久未用的（链表尾部），被淘汰了。而 `a` 因为在 `f(a)` 那次被"续命"移到了头部，所以没被淘汰。

这就解释了 2.3 节那个例子里 `greet("b")` 为什么没命中——因为在访问 `greet("a")` 后，"b" 成了链表尾部，被后续淘汰掉了。

### 4.3 为何要求参数可哈希

从上面的数据结构就能看出：字典的 key 就是调用参数，字典依赖哈希表实现。哈希表要求 key 满足：

1. 有 `__hash__` 方法，能算出整数哈希值；
2. 有 `__eq__` 方法，能判断两个 key 是否相等；
3. **对象的生命周期内哈希值不变**（否则放进字典后就找不到了）。

`int`、`str`、`tuple`（元素也可哈希）这些不可变类型满足这三条，所以可哈希。`list`、`dict`、`set` 因为内容可变，哈希值会变，违反第 3 条，Python 直接让它们 `__hash__ = None`，导致 `hash([1,2])` 抛 `TypeError`。

`lru_cache` 把参数打包成 key 时（对于位置参数会打包成元组，关键字参数打包成 `(args, kwargs)` 的排序元组），同样要求这个 key 可哈希，于是传不可哈希参数会报错。

`typed` 参数会影响 key 的构造方式：`typed=False` 时，`3` 和 `3.0` 因为 `hash(3) == hash(3.0)` 且 `3 == 3.0` 被视为同一 key；`typed=True` 时，`lru_cache` 会在 key 里额外带上类型信息（把参数按类型区分），于是 `3` 和 `3.0` 生成不同的 key。

### 4.4 maxsize 与 typed 的内部影响

**maxsize 的内部影响**

- `maxsize` 为正整数时，`lru_cache` 使用"字典 + 双向链表"的完整结构，每次命中/未命中都要维护链表顺序。
- `maxsize=None` 时，不需要淘汰，于是不需要维护使用顺序，内部可以省去双向链表（实际上 CPython 的 `lru_cache` 实现里 `maxsize=None` 会走一条更轻的代码路径，只用字典），存取更快、内存更省。这也是 `functools.cache`（3.9+）存在的理由——它就是 `maxsize=None` 的特化版。
- `maxsize=0` 时不缓存任何东西（每次都未命中且不存），基本没意义。

**typed 的内部影响**

`typed=True` 时构造 key 会带上参数类型，这意味着 `f(3)` 和 `f(3.0)` 在字典里是两个独立的条目，各自占用一份缓存空间。如果同一函数被各种类型反复调用，`typed=True` 会让缓存条目数变多，`currsize` 增长更快，命中率也可能下降。所以默认是 `typed=False`——大多数场景下值相等就该复用结果。

### 4.5 线程安全

`lru_cache` 是线程安全的。CPython 的实现里，对缓存的更新操作（命中后移动链表节点、未命中后插入新条目、淘汰尾部节点等）都用了一把内部锁（`_CacheInfo` 相关代码里用 `threading.Lock` 或 C 层的等价机制）保护起来。

这意味着多线程环境下，两个线程同时调用同一个被 `lru_cache` 装饰的函数时：

- 缓存查找和更新的过程是原子的，不会出现字典/链表被破坏的情况。
- 但**原函数本身的执行不在锁内**——如果原函数有副作用或操作共享资源，仍需要自己保证线程安全。
- 第一次未命中时，两个线程同时发现未命中，可能**都会执行一遍原函数**（锁只保护缓存写入，不保护"只允许执行一次"），然后各自把结果写入缓存，最终保留后写入的那个。这就是所谓的"惊群"问题——对于昂贵的计算，可能需要在外层额外加锁避免重复计算。

`@lru_cache` 保证的是"缓存数据结构不会被并发损坏"，不是"原函数只被调用一次"。如果你的场景对"只算一次"敏感，需要额外加锁或用 `once` 模式。

### 4.6 缓存命中如何省去原函数执行

这是 `lru_cache` 能带来性能提升的本质。被装饰后，调用 `func(args)` 实际上走的是 wrapper，wrapper 的逻辑大致是：

```python
def wrapper(*args, **kwargs):
    key = make_key(args, kwargs)        # 构造缓存 key
    result = cache.get(key, _MISS)      # 字典 O(1) 查找
    if result is not _MISS:
        # 命中：移动链表节点 + 返回，不执行原函数
        move_to_front(key)
        return result
    # 未命中：执行原函数
    result = func(*args, **kwargs)
    cache[key] = result                 # 存入缓存
    move_to_front(key)
    return result
```

命中分支里**完全没有调用 `func`**，只有一次字典查找 + 一次链表节点移动，都是 O(1)。对于原本要跑几秒甚至几分钟的计算（比如深递归、HTTP 请求），命中后几乎是瞬时返回，这就是性能提升的来源。

反过来，未命中分支要多执行一次原函数 + 一次字典写入 + 链表插入，比"不缓存直接调用"还稍微慢一点点。所以缓存的有效性取决于命中率——命中率越高收益越大，命中率趋于 0 时反而有微小损耗。这也是 3.3 节强调"用 cache_info() 验证命中率"的原因。

## 5. 总结

### 5.1 本文内容要点

- **缓存的本质**是"用空间换时间"：把"参数 → 结果"的映射存起来，下次同样输入直接返回，跳过重复计算。
- **手写 memoize** 用一个闭包字典即可实现：以参数元组为键，命中返回缓存，未命中执行后存入。
- **functools.lru_cache** 是标准库提供的带 LRU 淘汰策略的 memoize 装饰器，用"字典 + 双向链表"实现 O(1) 查找和 O(1) 淘汰。
- **maxsize** 控制缓存上限，设 `None` 表示无限；**typed** 控制是否区分值相等但类型不同的参数。
- **cache_info()** 查看 hit/miss/currsize/maxsize 四项统计；**cache_clear()** 清空缓存并重置计数器。
- **参数必须可哈希**：`list`/`dict`/`set` 不可哈希会 `TypeError`，需转为 `tuple`/`frozenset`。
- **适用条件**：纯函数、确定性、参数可哈希——三者缺一不可。
- **陷阱**：缓存持有引用导致内存泄漏、缓存陈旧（依赖外部可变状态）、副作用被缓存"吃掉"。
- **functools.cache**（3.9+）是 `lru_cache(maxsize=None)` 的轻量别名，参数可控时更简洁。
- **LRU 原理**：字典做 O(1) 查找，双向链表维护使用顺序；命中移到头部，满则淘汰尾部；这就是"最近最少使用"的实现。
- **线程安全**：`lru_cache` 内部有锁保护数据结构，但不保证原函数只被调用一次，"惊群"问题需自行加锁。

### 5.2 读完应能掌握

读完本文你应能掌握：

- 能手写一个简易 memoize 装饰器，并用它解释"参数 → 结果"字典缓存的工作机制。
- 能说明 `lru_cache` 的 `maxsize` 和 `typed` 两个参数各自的作用、默认值、不同取值的行为差异，并据此为具体场景选择合适的值。
- 能用 `cache_info()` 观察命中率并据此判断缓存是否有效，能用 `cache_clear()` 在合适的时机清空缓存。
- 能解释为什么 `lru_cache` 要求参数可哈希，遇到 `list`/`dict` 参数报错时知道如何改造（转 `tuple`/`frozenset`）。
- 能识别 `lru_cache` 的三大陷阱（内存泄漏、缓存陈旧、副作用消失），并知道对应的规避手段。
- 能画出"字典 + 双向链表"的 LRU 内部结构，演示一次命中和一次未命中时链表节点的变化过程。
- 能在 `functools.cache` 与 `lru_cache(maxsize=N)` 之间根据参数可控性做出合理取舍。
- 能判断一个函数是否适合用 `@lru_cache` 装饰（纯函数性、确定性、参数可哈希性），并能对不适合的函数指出原因。