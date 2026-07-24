---
group:
  title: 【13】高阶函数与闭包
  order: 13
order: 4
title: reduce 累积计算
nav:
  title: Python
  order: 1
---

## 1. 介绍

### 1.1 什么是 reduce 累积计算

`functools.reduce` 是 Python 标准库 `functools` 模块中的一个高阶函数，它的作用是把一个二元函数（接受两个参数的函数）从左到右依次应用到可迭代对象的元素上，把整列数据"折叠"成单个值。如果你用过其他语言里的 `foldl`、`fold`、`accumulate`，它们与 `reduce` 概念上是同一类东西。

可以从两个角度理解 `reduce` 做的事：

- 从数值上看，它像是在做"滚动累积"。假设有一串数字 `[a, b, c, d]` 和一个加法函数，`reduce` 先把 `a` 和 `b` 相加得到一个中间结果，再把这个中间结果和 `c` 相加，再和 `d` 相加，最终得到 `a + b + c + d` 这一个值。
- 从结构上看，它把一个"多个值组成的序列"压缩成"一个值"。这个"一个值"可以是数字、字符串、列表、字典，甚至是你自定义的任意对象——只要你的累积函数能定义出"两个值如何合并成一个值"。

`reduce` 的核心价值在于：它把"遍历 + 累积"这一非常普遍的计算模式抽象成了一个通用的函数式接口。只要你能描述清楚"每一步怎么把当前累积值和下一个元素合并"，`reduce` 就能替你完成整个遍历过程。这使得它特别适合那些没有专用内置函数、但又本质上是"把一列东西合并成一个"的场景，比如合并多个字典、扁平化嵌套列表、把一组配置项折叠成一个配置对象等。

需要注意的是，Python 3 已经把 `reduce` 从内置函数（Python 2 时代是内置的）移到了 `functools` 模块，使用前需要先 `from functools import reduce`。这个改动本身就反映了 Python 社区对 `reduce` 的态度：它是一个有用的工具，但不是日常最常用的工具，更不是应该到处替代 `for` 循环的工具。这一点后面原理章会详细讲。

### 1.2 基本语法与最小用法

`reduce` 的使用形式非常简洁，最小用法只需要两个参数：一个二元函数和一个可迭代对象。

```python
from functools import reduce

# 最小用法：对一组数字求和
# add 接收两个参数，返回它们的和
def add(x, y):
    return x + y

numbers = [1, 2, 3, 4, 5]
result = reduce(add, numbers)
print(result)  # 输出：15
```

这段代码背后发生的事情是：`reduce` 拿到 `numbers` 后，先把第 1 个元素 `1` 作为初始累积值，然后把第 2 个元素 `2` 传给 `add`，得到 `3`；再把 `3` 和第 3 个元素 `3` 传给 `add`，得到 `6`；再和第 4 个元素 `4` 传给 `add`，得到 `10`；最后和第 5 个元素 `5` 传给 `add`，得到 `15`。整列数字就这样被"折叠"成了一个值。

上面的 `add` 函数太简单，实际写代码时通常会配合 `lambda` 或 `operator` 模块里的现成函数：

```python
from functools import reduce
import operator

numbers = [1, 2, 3, 4, 5]

# 用 lambda 表达式
result1 = reduce(lambda x, y: x + y, numbers)
print(result1)  # 输出：15

# 用 operator.add（等价于 lambda x, y: x + y，但更直观）
result2 = reduce(operator.add, numbers)
print(result2)  # 输出：15
```

`operator.add` 就是 `lambda x, y: x + y` 的现成版本，`operator` 模块里还有 `mul`（乘）、`sub`（减）、`truediv`（除）等，用它们替代简单 `lambda` 更清晰，也避免重复造轮子。

这就是 `reduce` 的最小用法。接下来第 2 章我们会把它的完整签名、每一个参数、以及各种典型应用场景逐一展开。

## 2. 核心内容

### 2.1 reduce 的函数签名与参数详解

`reduce` 的完整签名如下：

```python
functools.reduce(function, iterable, initializer=None)
```

它接收三个参数，其中前两个是位置参数且必须提供，第三个是可选的：

- **`function`**：一个接收两个参数的可调用对象（函数、`lambda`、实现了 `__call__` 的对象等）。`reduce` 在每一步都会调用它，第一个参数是"到目前为止的累积值"，第二个参数是"从可迭代对象取出的下一个元素"。它必须返回一个新的累积值，作为下一轮调用时的累积值。这个函数应当是"无副作用"的——它不应该在内部修改传入的可变对象，而是应该返回一个新值或返回修改后的同一对象（取决于你的设计，但语义要清晰）。
- **`iterable`**：任何可迭代对象，如列表、元组、字符串、集合、字典（迭代键）、生成器、`range` 等。`reduce` 会从中逐个取出元素。需要注意的是，`reduce` 会把整个迭代过程跑完（内部会一直 `next` 直到 `StopIteration`），所以传一个无限生成器会让程序卡死。
- **`initializer`**：可选的初始累积值。如果提供了，`reduce` 会把它作为第一次调用 `function` 时的第一个参数，然后把可迭代对象的"第一个元素"作为第二个参数。如果没提供，`reduce` 会把可迭代对象的第一个元素作为初始累积值，从第二个元素开始才调用 `function`。这个参数对空序列的边界处理至关重要，后面会专门讲。

**返回值**：`reduce` 返回最终的累积值——一个单独的值（可以是任何类型）。如果可迭代对象为空且没有提供 `initializer`，`reduce` 会抛 `TypeError`；如果提供了 `initializer`，空序列会直接返回 `initializer`。

可以从一张对照表里看清 `initializer` 提供与否的区别：

| 情形 | 无 initializer | 有 initializer |
| --- | --- | --- |
| 序列为空 | 抛 `TypeError` | 直接返回 `initializer` |
| 序列有 1 个元素 | 直接返回该元素（不调用 `function`） | 调用 `function(initializer, 元素)` |
| 序列有多个元素 | 第一个元素作为初值，从第二个开始累积 | `initializer` 作为初值，从第一个元素开始累积 |

这张表是理解 `reduce` 行为的关键，后面很多"坑"都和这三行的差异有关。

### 2.2 无 initializer 时：以第一个元素为初始值

当不提供 `initializer` 时，`reduce` 把可迭代对象的第一个元素直接作为初始累积值，然后从第二个元素开始才调用 `function`。这意味着：如果序列只有一个元素，`function` 根本不会被调用，`reduce` 直接返回那唯一一个元素。

```python
from functools import reduce
import operator

# 多个元素：第一个元素作为初值，从第二个开始累积
# reduce(operator.add, [1, 2, 3, 4]) 等价于 ((1 + 2) + 3) + 4
result = reduce(operator.add, [1, 2, 3, 4])
print(result)  # 输出：10

# 只有一个元素：function 不会被调用，直接返回该元素
result1 = reduce(operator.add, [42])
print(result1)  # 输出：42

# 空序列且无 initializer：抛 TypeError
try:
    reduce(operator.add, [])
except TypeError as e:
    print(f"报错：{e}")  # 输出：报错：reduce() of empty iterable with no initial value
```

这里有几个细节值得注意：

第一个元素作为初始值时，它的类型不会经过 `function` 处理。这对"求和"这种场景没问题，因为第一个数字就是合法的累积值；但对"把一组字符串合并成一个空格分隔的大字符串"这种场景，如果不提供 `initializer`，第一个字符串会原样进入结果，而你本来希望所有元素都被同等地拼接。比如：

```python
from functools import reduce

words = ["hello", "world", "reduce"]
# 不提供 initializer：第一个 "hello" 直接作为初值，后面才用 lambda 拼接
result = reduce(lambda acc, w: acc + " " + w, words)
print(result)  # 输出：hello world reduce
```

这个例子看起来没毛病，但如果你希望结果是 `hello world reduce` 带一个统一的前导空格风格，或者结果要以某个固定前缀开头，就得用 `initializer` 来指定这个前缀。下一节会演示。

单元素序列直接返回该元素的特性，有时候会产生出人意料的结果。比如你写了一个 `lambda acc, x: acc + x`，对 `["a"]` 调用 `reduce`，结果是 `"a"`，而你可能以为会是 `acc + "a"` 这样的某种"加工后"的值。如果你希望即使单元素也经过加工，就必须提供 `initializer`。

### 2.3 提供 initializer：显式初始值的语义与边界处理

`initializer` 让你显式指定累积的起点。一旦提供了它，`reduce` 就会把 `initializer` 作为第一次调用 `function` 时的累积值，把可迭代对象的第一个元素作为第二个参数。也就是说，`function` 会对每一个元素都被调用一次，包括第一个元素。

```python
from functools import reduce
import operator

# 提供 initializer=0：从 0 开始累加
result = reduce(operator.add, [1, 2, 3, 4], 0)
print(result)  # 输出：10

# 等价的展开：add(add(add(add(0, 1), 2), 3), 4) = ((0+1)+2)+3)+4 = 10
```

`initializer` 在几个场景下几乎是必须的：

**场景一：空序列的防御**。当可迭代对象可能为空时，没有 `initializer` 的 `reduce` 会直接抛 `TypeError`，这往往不是你想要的行为。提供 `initializer` 后，空序列会安静地返回这个初始值，语义上相当于"没有元素要处理，那就用这个默认值"。

```python
from functools import reduce
import operator

# 数据可能来自外部，可能是空列表
def safe_sum(numbers):
    # 提供 initializer=0，空列表返回 0 而不是报错
    return reduce(operator.add, numbers, 0)

print(safe_sum([1, 2, 3]))  # 输出：6
print(safe_sum([]))         # 输出：0
```

**场景二：累积结果的类型与元素类型不同**。如果你的累积值类型和元素类型不一致，比如要把一组数字累积成一个 `list`，就必须提供 `initializer` 来给出正确类型的起点，否则第一个元素就成了初值，后续 `function` 拿到的累积值和元素类型就对不上。

```python
from functools import reduce

# 把一组数字收集成一个列表
# 必须提供 initializer=[]，否则第一个数字 1 作为初值，lambda 拿到 int 和 int
numbers = [1, 2, 3, 4]
result = reduce(lambda acc, n: acc + [n], numbers, [])
print(result)  # 输出：[1, 2, 3, 4]
```

这里一定要传 `initializer=[]`，因为如果不传，`reduce` 会把 `1`（一个 `int`）当作初值，然后调用 `lambda 1, 2`，得到 `1 + [2]`，这会直接报 `TypeError: unsupported operand type(s) for +`。养成"只要累积类型和元素类型不同就传 initializer"的习惯，能避开很多这种类型对不上的坑。

**场景三：需要统一处理每个元素**。当你希望每个元素（包括第一个）都经过 `function` 处理时，`initializer` 让处理流程统一。

```python
from functools import reduce

words = ["hello", "world", "reduce"]
# 希望：用 ", " 分隔，结果形如 "hello, world, reduce"
# 思路：initializer 用空串，但第一次拼接会多出一个前导 ", "
# 所以改进：用 lambda 判断累积值是否为空
result = reduce(
    lambda acc, w: acc + w if not acc else acc + ", " + w,
    words,
    ""
)
print(result)  # 输出：hello, world, reduce
```

上面这个写法用空串作为 `initializer`，并在 `lambda` 里判断累积值是不是空串来决定要不要加分隔符——这是处理"元素之间加分隔符"的一种常见技巧。当然这种场景更推荐直接用 `", ".join(words)`，后面"与内置函数对比"一节会讲为什么。

### 2.4 执行过程拆解：逐次 func(acc, next) 递推演示

`reduce` 的执行过程很容易让人迷糊——它不像 `for` 循环那样每一步都摆在你面前。理解它的关键是把"每一步的累积值"显式地列出来。下面用一个有 `initializer` 的例子，把每一步的 `acc` 和 `next` 都拆出来看。

```python
from functools import reduce

def show_add(acc, n):
    """带打印的加法，用来观察 reduce 每一步的输入和输出"""
    print(f"  调用 function(acc={acc}, next={n}) -> {acc + n}")
    return acc + n

numbers = [10, 20, 30, 40]
print("开始 reduce，initializer=0")
result = reduce(show_add, numbers, 0)
print(f"最终结果：{result}")
```

运行后的输出：

```
开始 reduce，initializer=0
  调用 function(acc=0, next=10) -> 10
  调用 function(acc=10, next=20) -> 30
  调用 function(acc=30, next=30) -> 60
  调用 function(acc=60, next=40) -> 100
最终结果：100
```

可以清楚地看到整个过程：

1. `reduce` 用 `initializer=0` 作为首次的 `acc`，取序列第一个元素 `10` 作为 `next`，调用 `function(0, 10)` 得到 `10`。
2. 把上一步的结果 `10` 作为新的 `acc`，取第二个元素 `20` 作为 `next`，调用 `function(10, 20)` 得到 `30`。
3. 把 `30` 作为 `acc`，取 `30` 作为 `next`，得到 `60`。
4. 把 `60` 作为 `acc`，取 `40` 作为 `next`，得到 `100`。
5. 序列耗尽，返回最终累积值 `100`。

这是一个标准的"左结合"累积过程：`(((0 + 10) + 20) + 30) + 40`。每一步都把当前累积值和新元素合并成新累积值，并把新累积值带入下一步。

再来看不提供 `initializer` 时的执行过程，对比一下差异：

```python
from functools import reduce

def show_add(acc, n):
    print(f"  调用 function(acc={acc}, next={n}) -> {acc + n}")
    return acc + n

numbers = [10, 20, 30, 40]
print("开始 reduce，不提供 initializer")
result = reduce(show_add, numbers)
print(f"最终结果：{result}")
```

运行后的输出：

```
开始 reduce，不提供 initializer
  调用 function(acc=10, next=20) -> 30
  调用 function(acc=30, next=30) -> 60
  调用 function(acc=60, next=40) -> 100
最终结果：100
```

注意这里 `function` 只被调用了 3 次，比有 `initializer` 时少一次。第一次调用时 `acc` 直接就是序列的第一个元素 `10`，对应 `next=20`。这正好印证了"无 `initializer` 时第一个元素作为初值、从第二个元素开始才调用 `function`"的规则。

把两种模式画成表达式更直观：

- 无 `initializer`：`f(f(f(10, 20), 30), 40)` —— 内层是序列前两个元素
- 有 `initializer=0`：`f(f(f(f(0, 10), 20), 30), 40)` —— 内层是 `initializer` 和第一个元素

这种"左结合"的展开方式对加法这种满足结合律的运算来说，结果相同；但对减法、除法、字符串拼接顺序敏感的运算，结合方向就很重要了。这一点在原理章会详细讲。

### 2.5 典型应用：求和与求积

求和和求积是 `reduce` 最直观的应用，也是讲解"折叠"概念最好的入口。

**求和**：

```python
from functools import reduce
import operator

# 一组销售额（元），求当日总销售额
sales = [125.5, 89.9, 230.0, 45.8, 178.2]
total = reduce(operator.add, sales, 0)
print(f"当日总销售额：{total:.2f} 元")  # 输出：当日总销售额：669.40 元
```

这里 `initializer=0` 是一个良好的习惯：即使 `sales` 为空列表，也能优雅地返回 `0`，而不是抛 `TypeError`。

**求积（连乘）**：

```python
from functools import reduce
import operator

# 计算一组折扣的最终折扣率：依次乘以每张优惠券的折扣
# 0.8 七折 + 0.9 九折 + 0.95 九五折
discounts = [0.8, 0.9, 0.95]
final_rate = reduce(operator.mul, discounts, 1)
print(f"最终折扣率：{final_rate:.4f}")  # 输出：最终折扣率：0.6840
print(f"相当于约 {final_rate * 100:.1f} 折")  # 输出：相当于约 68.4 折
```

求积时 `initializer=1` 是乘法单位元，对应求和时的 `0`（加法单位元）。如果 `discounts` 为空，说明没有折扣，`final_rate` 应该是 `1`，正好是 `initializer` 的值——这是一个语义自洽的设计。

**为什么求和求积用 reduce 没那么"划算"**：Python 内置有 `sum()` 函数，求和根本用不上 `reduce`；求积没有内置函数，但用 `math.prod`（Python 3.8+）一行就能搞定：

```python
import math

print(sum([1, 2, 3, 4, 5]))        # 输出：15
print(math.prod([1, 2, 3, 4, 5]))  # 输出：120
```

所以现实里求和用 `sum`、求积用 `math.prod`，`reduce` 更适合那些没有专用内置函数的场景。但求和求积作为教学例子很有价值，能帮读者快速理解"折叠"到底怎么运作。

### 2.6 典型应用：求最大值/最小值

用 `reduce` 求最大值是一个很好的练习，因为它揭示了 `reduce` 能表达任何"滚动地比较两个值保留一个"的模式。

```python
from functools import reduce

# 一组学生成绩，找出最高分
scores = [76, 92, 83, 95, 68, 89, 90]
highest = reduce(lambda a, b: a if a > b else b, scores)
print(f"最高分：{highest}")  # 输出：最高分：95

# 最低分
lowest = reduce(lambda a, b: a if a < b else b, scores)
print(f"最低分：{lowest}")  # 输出：最低分：68
```

这里 `lambda a, b: a if a > b else b` 的语义是"两个值里保留较大的那个"，每一轮比较后都把较大的值带进下一轮，最后留下的就是全局最大值。

不过这里有个隐患：如果 `scores` 为空，`reduce` 会抛 `TypeError`。为了健壮，可以提供 `initializer`，但 `initializer` 必须是一个合理的"初始候选值"。对最大值来说，合理的初始值是 `float('-inf')`（负无穷，任何数都比它大），对最小值则是 `float('inf')`：

```python
from functools import reduce

scores = []  # 空数据

# 用负无穷作为求最大值的 initializer，空列表返回负无穷
highest = reduce(lambda a, b: a if a > b else b, scores, float('-inf'))
print(highest)  # 输出：-inf

# 用正无穷作为求最小值的 initializer
lowest = reduce(lambda a, b: a if a < b else b, scores, float('inf'))
print(lowest)  # 输出：inf
```

但这种返回 `inf`/`-inf` 的结果对调用方往往没有实际意义。现实编码里，求最大值最小值请直接用内置 `max()` / `min()`，它们对空序列会抛更清晰的 `ValueError`，而且通过 `default` 参数也能指定空序列时的默认值：

```python
print(max([76, 92, 83, 95, 68]))         # 输出：95
print(max([], default=None))             # 输出：None
print(min([76, 92, 83, 95, 68]))         # 输出：68
```

所以"求最大最小"同样属于能被内置专用函数优雅处理、不需要 `reduce` 的场景。这里展示 `reduce` 的写法，主要是帮助理解折叠的通用性。

### 2.7 典型应用：扁平化嵌套列表

把一个"列表的列表"压平成一个一维列表，是 `reduce` 的经典用武之地——这里没有内置专用函数能直接搞定。

```python
from functools import reduce
import operator

# 一组订单，每个订单是一组商品名，现在要把所有订单的商品汇总成一份大清单
orders = [
    ["苹果", "香蕉"],
    ["牛奶", "面包", "鸡蛋"],
    ["咖啡", "巧克力"]
]

# 每一步：把当前累积的清单和新订单的商品列表拼起来
all_items = reduce(operator.concat, orders, [])
print(all_items)  # 输出：['苹果', '香蕉', '牛奶', '面包', '鸡蛋', '咖啡', '巧克力']
```

`operator.concat` 等价于 `lambda a, b: a + b`，对两个列表做拼接。`reduce` 把每一轮拼好的总清单带入下一轮，最终把三个子列表全部合并成一个。`initializer=[]` 是必须的，否则第一个子列表 `["苹果", "香蕉"]` 会被当作初值，后续才用 `operator.concat` 拼接——结果虽然也对，但语义不统一；更关键的是当 `orders` 为空时，没有 `initializer` 会报错。

也可以用 `lambda acc, order: acc + order` 写出来，效果相同：

```python
from functools import reduce

orders = [
    ["苹果", "香蕉"],
    ["牛奶", "面包", "鸡蛋"],
]

all_items = reduce(lambda acc, order: acc + order, orders, [])
print(all_items)  # 输出：['苹果', '香蕉', '牛奶', '面包', '鸡蛋']
```

**性能提醒**：`acc + order` 每次都会创建一个新列表，复杂度是 O(n²)（n 是元素总数）。如果数据量大，应该用 `itertools.chain.from_iterable` 或 `extend` 风格的累积。后面最佳实践章会讲这个取舍。

另一种思路是让累积值始终是"同一个可变列表"，每步 `extend` 进去：

```python
from functools import reduce

orders = [["苹果", "香蕉"], ["牛奶", "面包", "鸡蛋"], ["咖啡"]]

# 用 extend 原地扩展同一个列表，extend 返回 None，所以要返回 acc 本身
all_items = reduce(lambda acc, order: acc.extend(order) or acc, orders, [])
print(all_items)  # 输出：['苹果', '香蕉', '牛奶', '面包', '鸡蛋', '咖啡']
```

这里 `acc.extend(order) or acc` 利用了 `extend` 返回 `None`（假值）这一事实，让 `or` 表达式的值取到 `acc`，从而把 `reduce` 的累积值始终维持为同一个列表对象。这种写法效率更高（O(n)），但牺牲了一点函数式纯净——累积函数有了副作用。这是 `reduce` 在性能与纯净之间常见的取舍。

### 2.8 典型应用：连乘阶乘

阶乘 `n! = 1 * 2 * 3 * ... * n` 是一个典型的连乘问题，天然可以用 `reduce` 表达：

```python
from functools import reduce
import operator

def factorial(n):
    if n < 0:
        raise ValueError("阶乘只对非负整数定义")
    return reduce(operator.mul, range(1, n + 1), 1)

print(factorial(5))   # 输出：120
print(factorial(10))  # 输出：3628800
print(factorial(0))   # 输出：1（range(1,1) 为空，直接返回 initializer=1）
```

这里 `range(1, n + 1)` 生成 `[1, 2, ..., n]`，`reduce(operator.mul, ..., 1)` 把它们连乘起来。`initializer=1` 是乘法单位元，让 `factorial(0)` 能正确返回 `1`——这正是 `initializer` 处理空序列边界的价值：`range(1, 1)` 是空的，没有 `initializer` 会直接报错。

值得一提的是 Python 3.8+ 有 `math.factorial`，而且它对大整数有优化，所以实际工程里直接用它：

```python
import math

print(math.factorial(5))    # 输出：120
print(math.factorial(100))  # 输出：93326215443944152681699238856266700490715968264381621468...
```

`reduce` 版本的阶乘更偏教学意义，它把"阶乘就是从 1 到 n 连乘"这个数学定义直接翻译成了代码。

还可以用 `reduce` 表达斐波那契这种"状态随每一步演化"的问题，但写法会比较绕：

```python
from functools import reduce

# 用 reduce 生成斐波那契数列前 n 项
# 累积值是一个元组 (fib_list, prev, curr)，每步更新
def fib_step(state, _):
    fib_list, prev, curr = state
    fib_list.append(prev)
    return (fib_list, curr, prev + curr)

def fib(n):
    if n <= 0:
        return []
    # initializer：(空列表, 第一个数 0, 第二个数 1)
    state = reduce(fib_step, range(n), ([], 0, 1))
    return state[0]

print(fib(10))  # 输出：[0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

这个例子把"累积值"从一个简单的数扩展成了一个元组（携带列表 + 前两个状态值），每一步通过解构和更新这个元组推进。它展示了 `reduce` 的累积值可以是任意复杂的状态对象——这是 `reduce` 强大表达能力的来源，也是它可读性迅速下降的起点。

### 2.9 典型应用：字典合并

把多个字典合并成一个，是 `reduce` 的另一个高价值场景。Python 没有内置的"合并多个字典"函数（`dict.update` 只能合并两个，`{**a, **b}` 语法也只是两个），所以合并 N 个字典时 `reduce` 派得上用场。

```python
from functools import reduce

# 把多个配置片段合并成一个总配置
config_a = {"debug": True, "host": "127.0.0.1"}
config_b = {"port": 8080, "host": "0.0.0.0"}  # host 会覆盖前面的值
config_c = {"retries": 3}

# {**a, **b} 是 Python 3.5+ 的合并两个字典写法
merged = reduce(lambda a, b: {**a, **b}, [config_a, config_b, config_c], {})
print(merged)
# 输出：{'debug': True, 'host': '0.0.0.0', 'port': 8080, 'retries': 3}
```

这里 `lambda a, b: {**a, **b}` 每次都创建一个新字典，把累积字典 `a` 和当前字典 `b` 的所有键值对放进去。如果有重复键，`b` 的值会覆盖 `a` 的值——这是字典合并的常见语义（后者优先）。`initializer={}` 让空输入也能优雅地返回空字典。

如果不在乎修改顺序、想要"自己修改同一个字典"来省内存，可以这样写：

```python
from functools import reduce

configs = [{"a": 1}, {"b": 2}, {"c": 3}]
# 原地 update，返回被更新后的字典本身
merged = reduce(lambda acc, d: (acc.update(d), acc)[1], configs, {})
print(merged)  # 输出：{'a': 1, 'b': 2, 'c': 3}
```

这里 `(acc.update(d), acc)[1]` 是一个常用技巧：`update` 返回 `None`，用元组把它和 `acc` 包起来再取 `[1]` 拿到 `acc`。和前面扁平化列表的 `extend or acc` 一样，这是"原地修改 + 返回原对象"的模式。

更推荐的是用 `dict.update` 在 `for` 循环里完成，可读性更好：

```python
configs = [{"a": 1}, {"b": 2}, {"c": 3}]
merged = {}
for c in configs:
    merged.update(c)
print(merged)  # 输出：{'a': 1, 'b': 2, 'c': 3}
```

对比之下会发现，N 个字典合并这种场景，`for` 循环其实比 `reduce` 直观得多——这正好引出后面"reduce vs for 循环"和"何时该用 reduce"的话题。

### 2.10 典型应用：构建树/链表结构

`reduce` 不仅能做数值和容器合并，还能用来构建数据结构。一个经典例子是用 `reduce` 反向构建单链表。

先定义一个简单的链表节点：

```python
from functools import reduce

class Node:
    def __init__(self, value, nxt=None):
        self.value = value
        self.next = nxt

    def __repr__(self):
        # 防止链表有环时无限递归，这里简单展示
        values = []
        node = self
        while node is not None:
            values.append(str(node.value))
            node = node.next
        return " -> ".join(values) + " -> None"

# 数据列表
data = [1, 2, 3, 4]

# 思路：reduce 从左到右遍历数据
# 累积值 acc 是"已经构建好的链表头"
# 每来一个元素，把它包装成新节点，让新节点指向 acc，于是 acc 成了"接在它后面的链表"
# 这样最后得到的是一个"反序"的链表（4->3->2->1->None）
head = reduce(lambda acc, v: Node(v, acc), data, None)
print(head)  # 输出：4 -> 3 -> 2 -> 1 -> None
```

这里的精妙之处在于，`reduce` 每一步都把"新元素"和"已经构建好的部分链表"组合起来——这正是"折叠"思想在构建结构时的体现。`initializer=None` 表示空链表，对应链表末尾的 `None`。

如果想要正向顺序 `1 -> 2 -> 3 -> 4 -> None`，可以先反转数据再 reduce：

```python
from functools import reduce

class Node:
    def __init__(self, value, nxt=None):
        self.value = value
        self.next = nxt
    def __repr__(self):
        values = []
        node = self
        while node is not None:
            values.append(str(node.value))
            node = node.next
        return " -> ".join(values) + " -> None"

data = [1, 2, 3, 4]
# 对 reversed(data) 调用 reduce：先处理 4，再 3、2、1
# 第一步：Node(4, None)
# 第二步：Node(3, Node(4, None))
# ...
# 最后：Node(1, Node(2, Node(3, Node(4, None))))
head = reduce(lambda acc, v: Node(v, acc), reversed(data), None)
print(head)  # 输出：1 -> 2 -> 3 -> 4 -> None
```

这种"用 reduce 配合 reversed 改变折叠方向"的技巧，在 2.13 节我们会专门讲。

**构建嵌套字典结构**：另一个常见场景是把一组 `(key, value)` 路径层层嵌套进一个字典。

```python
from functools import reduce

# 把一组 ["a", "b", "c"] 配上最终值，变成 {"a": {"b": {"c": value}}}
def set_nested_value(keys, value):
    """keys 是键的序列，把 value 嵌到最里层"""
    # 思路：从右往左，每步包一层字典
    # 累积值 inner 从 value 开始，每来一个 key 都包一层 {key: inner}
    return reduce(lambda inner, key: {key: inner}, reversed(keys), value)

result = set_nested_value(["a", "b", "c"], 42)
print(result)  # 输出：{'a': {'b': {'c': 42}}}
```

这里用 `reversed(keys)` 是因为我们想"从最内层往外层包"——`c` 对应最内层 `{c: 42}`，然后 `b` 包它成 `{b: {c: 42}}`，最后 `a` 包它。如果直接对 `keys` 做 reduce 会得到 `{c: {b: {a: 42}}}`，顺序就反了。

这种"把结构构建表达成折叠"的能力，使得 `reduce` 在处理递归型数据结构（树、树形配置、JSON）时非常简洁。

### 2.11 reduce 与 for 循环手写累积的对比

`reduce` 的本质和 `for` 循环累积是等价的。任何 `reduce` 都可以改写成下面这个固定模式的 `for` 循环：

```python
from functools import reduce
import operator

numbers = [1, 2, 3, 4, 5]

# reduce 版
total_reduce = reduce(operator.add, numbers, 0)

# 等价的 for 循环版
total_for = 0
for n in numbers:
    total_for = operator.add(total_for, n)

print(total_reduce)  # 输出：15
print(total_for)     # 输出：15
```

把 `reduce(f, iterable, init)` 翻译成 `for` 循环的固定套路是：

```python
acc = init
for x in iterable:
    acc = f(acc, x)
# acc 就是 reduce 的结果
```

没有 `initializer` 时，套路变成：

```python
it = iter(iterable)
try:
    acc = next(it)          # 取第一个元素作为初值
except StopIteration:
    raise TypeError("reduce() of empty iterable with no initial value")
for x in it:
    acc = f(acc, x)
```

这个等价关系揭示了 `reduce` 的本质：它就是把"初始化累积值 → 循环更新累积值 → 返回累积值"这三步打包成一个函数调用。

**那么该用哪个？**

`reduce` 的优势在于：它是声明式的，一行表达"把这列东西合并成一个"。对简单且读者熟悉的累积操作（求和、求积、扁平化），`reduce` 比等同的 `for` 循环紧凑。它也更函数式，可以和 `map`、`filter` 链式组合，写出"先过滤、再映射、再折叠"的流水线。

`for` 循环的优势在于：每一步都摆在眼前，读者不需要在脑里"展开折叠过程"。它也更灵活，可以在循环里加上额外的控制流（break、continue、日志、异常处理），而 `reduce` 的累积函数里写这些会非常别扭。

社区里有一个经典的可读性争议：`reduce(lambda a, b: a + b, values)` 比 `sum(values)` 长且难读，而 `sum` 是专门为求和设计的内置函数。Guido（Python 之父）甚至一度想从 Python 3 移除 `reduce`，理由就是"读代码的人要在脑里推导折叠过程，可读性不如直接的 `for` 循环或专用函数"。最终 `reduce` 被保留但移到了 `functools`，作为"高级用户工具"而不是日常推荐。

结论是：**如果某个累积能用内置专用函数（`sum`、`max`、`min`、`any`、`all`、`math.prod`）或专用方法（`str.join`、`dict.update` 循环）干净表达，就不要用 `reduce`；只有当累积逻辑确实没有现成专用函数、且累积函数足够简单（一两个参数的 lambda 能讲清）时，`reduce` 才是合适的选择**。

### 2.12 reduce 与 sum/max/min/any/all 等内置专用函数的取舍

Python 内置了一批"把可迭代对象压缩成单值"的专用函数，它们各自只擅长一件事，但因为专精所以更清晰、更快、更不容易出错。能用它们就不要用 `reduce`。

| 需求 | 专用函数 | reduce 写法（仅供对比，不推荐） | 评价 |
| --- | --- | --- | --- |
| 求和 | `sum(values)` | `reduce(add, values)` | 内置版本更短、更快、空序列返回 0 |
| 求积 | `math.prod(values)` | `reduce(mul, values)` | 内置版本更短、空序列返回 1、对大整数有优化 |
| 最大值 | `max(values)` | `reduce(lambda a,b: a if a>b else b, values)` | 内置版本清晰太多 |
| 最小值 | `min(values)` | `reduce(lambda a,b: a if a<b else b, values)` | 同上 |
| 是否全真 | `all(values)` | `reduce(lambda a,b: a and b, values, True)` | 内置版本短路求值，reduce 不短路 |
| 是否有真 | `any(values)` | `reduce(lambda a,b: a or b, values, False)` | 同上，且内置更清晰 |
| 字符串拼接 | `"sep".join(strings)` | `reduce(lambda a,b: a+"sep"+b, strings, "")` | 内置版本更短且 O(n) |
| 字典合并 | `for` + `update` | `reduce(lambda a,b: {**a,**b}, dicts, {})` | 看场景，reduce 偶尔可接受 |

这张表把"能用专用函数就不要 reduce"的原则具象化了。除了功能上的清晰度，内置函数还有几个 reduce 不具备的优势：

- **短路求值**：`any` 遇到第一个真就停，`all` 遇到第一个假就停；而 `reduce` 会把整个序列跑完，对 `lambda a, b: a or b, [...]` 这种模拟 `any` 的写法，即使第一个元素就是真，也得跑完整个序列。
- **空序列的合理默认值**：`sum([])` 返回 `0`，`any([])` 返回 `False`，`all([])` 返回 `True`——这些默认值符合数学定义；用 `reduce` 模拟时要手动指定 `initializer` 才能得到一样的行为。
- **性能**：内置函数是 C 实现的，没有 Python 层面反复调用 lambda 的开销。

一个例子直观展示短路差异：

```python
from functools import reduce

# 想判断一组数字里有没有大于 100 的
values = [5, 8, 12, 9, 3]

# any 短路：发现一个真就停
has_big = any(v > 100 for v in values)
print(has_big)  # 输出：False

# reduce 模拟：非短路，会遍历完整个序列
has_big_reduce = reduce(lambda a, b: a or b > 100, values, False)
print(has_big_reduce)  # 输出：False
```

表面上看结果一样，但如果 `values` 是一个无限生成器，`any` 能在找到真值时优雅退出，`reduce` 会无限循环下去。

下面这个例子更明显地展示短路优势：

```python
from functools import reduce

def is_even(n):
    print(f"  检查 {n}")
    return n % 2 == 0

# any 检查到第一个偶数就停
print("用 any：")
print(any(is_even(n) for n in [1, 3, 4, 5, 6]))
# 输出：
# 用 any：
#   检查 1
#   检查 3
#   检查 4
# True

# reduce 不会停，会把所有元素跑完
print("用 reduce 模拟 any：")
print(reduce(lambda acc, n: acc or is_even(n), [1, 3, 4, 5, 6], False))
# 输出：
# 用 reduce 模拟 any：
#   检查 1
#   检查 3
#   检查 4
#   检查 5
#   检查 6
# True
```

`any` 在 `4` 命中后立即终止，而 `reduce` 把 `5`、`6` 也检查了。这就是"专用函数比 reduce 更聪明"的体现。

### 2.13 reduce 右折叠的模拟：用 reversed

`reduce` 是固定从左到右遍历的"左折叠"（`foldl`）。有些场景你希望从右到左处理元素——比如对减法来说，`[1, 2, 3]` 的"右折叠"是 `1 - (2 - 3)`，而左折叠是 `(1 - 2) - 3`，结果完全不同：

```python
from functools import reduce
import operator

# 左折叠：((1 - 2) - 3) = -4
print(reduce(operator.sub, [1, 2, 3]))  # 输出：-4

# 期望右折叠：1 - (2 - 3) = 2
# 直接用 reduce 做右折叠做不到，但可以先反转数据再 reduce
# 反转后 [3, 2, 1]，左折叠得到 ((3 - 2) - 1) = 0，不是我们要的
# 真正的右折叠需要把累积值作为第二个参数
print(reduce(lambda a, b: b - a, reversed([1, 2, 3])))
# 输出：-2
```

这里需要小心：**"右折叠"不是简单地把序列反转后用同一个 `lambda` 做 `reduce`**，而是要交换 `function` 的参数位置。因为右折叠的语义是 "对每个元素，把它和'右边部分的折叠结果'合并"，所以新元素应该作为第一个参数，累积值作为第二个参数。

来一步步拆解 `reduce(lambda a, b: b - a, reversed([1, 2, 3]))`：

- `reversed([1, 2, 3])` 产生 `[3, 2, 1]`。
- `reduce` 没有 `initializer`，第一个元素 `3` 作为初值，从 `2` 开始调用 `lambda`。
- 第 1 次调用：`lambda(3, 2) = 2 - 3 = -1`。
- 第 2 次调用：`lambda(-1, 1) = 1 - (-1) = 2`。
- 结果是 `2`，恰好等于 `1 - (2 - 3) = 1 - (-1) = 2`，正是数学上右折叠的预期结果。

为对比，再看左折叠 `reduce(operator.sub, [1, 2, 3])`：

- 第 1 个元素 `1` 作为初值，从 `2` 开始调用。
- `1 - 2 = -1`。
- `-1 - 3 = -4`。
- 结果是 `-4`，对应 `((1 - 2) - 3) = -4`。

所以"左折叠 vs 右折叠"的本质区别在于**累积值是新参数位置上的第几个参数**，而不是简单的遍历顺序。对加法、乘法这类满足结合律的运算，左右折叠结果相同；对减法、除法、字符串拼接顺序敏感的运算，就要谨慎选择。

实际工程里，需要"右折叠"的场景较少，更多时候是用 `reversed` 把序列反过来、"从后往前"处理。`reduce(lambda a, b: ..., reversed(seq))` 的写法已经能覆盖绝大多数右折叠需求。前面 2.10 节构建链表时已经用到了这个技巧。

### 2.14 initializer 的重要性：空序列边界与可变默认陷阱

`initializer` 不只是"提供一个起点"，它还肩负着保证 `reduce` 在边界情况下行为正确的责任。最典型的边界就是空序列。

**没有 initializer 时空序列直接报错**：

```python
from functools import reduce
import operator

try:
    reduce(operator.add, [])
except TypeError as e:
    print(f"报错：{e}")
    # 输出：报错：reduce() of empty iterable with no initial value
```

这个报错在很多生产场景下是不能接受的——你期望的是"没有数据就返回 0"或"返回空列表"，而不是抛异常。提供 `initializer` 就能优雅处理：

```python
from functools import reduce
import operator

print(reduce(operator.add, [], 0))   # 输出：0
print(reduce(operator.mul, [], 1))   # 输出：1
print(reduce(lambda a, b: a + [b], [], []))  # 输出：[]
```

**可变默认陷阱**：`initializer` 如果是一个可变对象（比如 `[]`、`{}`），要特别小心它会被整个累积过程共享。不过 `reduce` 在这里比函数默认参数稍微安全一点——因为 `reduce` 每次调用都要求你显式传入 `initializer`，不像函数默认参数那样会被多次调用共享。所以你只在多次 `reduce` 调用复用同一个可变对象作为 `initializer` 时才会踩坑：

```python
from functools import reduce

# 坑：复用同一个列表作为 initializer
shared = []
result1 = reduce(lambda acc, n: acc + [n], [1, 2, 3], shared)
# 这里 shared 仍然是 []，因为 acc + [n] 每步创建新列表，没有修改 shared
print(result1)  # 输出：[1, 2, 3]
print(shared)   # 输出：[]
```

上面这个例子因为用的是 `acc + [n]`（非原地，每次创建新列表），所以 `shared` 没被修改。但如果你用原地修改：

```python
from functools import reduce

shared = []
result1 = reduce(lambda acc, n: (acc.append(n), acc)[1], [1, 2, 3], shared)
print(result1)  # 输出：[1, 2, 3]
print(shared)   # 输出：[1, 2, 3] —— shared 被修改了！

# 再用同一个 shared 做 reduce 就会出问题
result2 = reduce(lambda acc, n: (acc.append(n), acc)[1], [4, 5, 6], shared)
print(result2)  # 输出：[1, 2, 3, 4, 5, 6] —— 不是预期的 [4, 5, 6]
```

这就是"可变默认陷阱"——复用同一个可变 `initializer` 会让历史结果污染新调用。规避方式很简单：每次都现场创建一个新的可变对象传给 `initializer`，写成 `reduce(..., [])` 而不是 `reduce(..., shared)`。

**initializer 选择的精神法则**：`initializer` 应该是累积操作的"单位元"（identity element），即"对它做一次累积操作等同于没做"。

- 加法的单位元是 `0`：`0 + x = x`。
- 乘法的单位元是 `1`：`1 * x = x`。
- 列表拼接的单位元是 `[]`：`[] + [x] = [x]`。
- 字符串拼接的单位元是 `""`：`"" + x = x`。
- 字典合并的单位元是 `{}`：`{**{}, **d} = d`。
- "取较大值"的单位元是 `float('-inf')`：`max(-inf, x) = x`。
- "取较小值"的单位元是 `float('inf')`：`min(inf, x) = x`。
- `and` 操作的单位元是 `True`：`True and x = x`（对布尔值）。
- `or` 操作的单位元是 `False`：`False or x = x`（对布尔值）。

只要 `initializer` 选的是单位元，`reduce` 在空序列时返回的就是"一个什么都没累积过的干净起点"，语义自然自洽。如果选了非单位元（比如求和时 `initializer=10`），那 `reduce` 就相当于"从 10 开始加起来的总和"，这对业务是有意义的场合才用，否则会带来意想不到的偏差。

## 3. 最佳实践

**优先用内置专用函数**

能用 `sum`、`math.prod`、`max`、`min`、`any`、`all`、`str.join` 这些专用函数干净表达的累积，就不要用 `reduce`。专用函数更短、更快、有短路求值、空序列默认值合理，可读性也明显更好。`reduce` 留给那些没有专用函数、且累积逻辑能用一两个参数的 lambda 讲清的场景。

```python
# 不推荐：用 reduce 求和
from functools import reduce
import operator
total = reduce(operator.add, [1, 2, 3, 4], 0)

# 推荐：直接用内置 sum
total = sum([1, 2, 3, 4])
```

**总是提供 initializer**

只要你的累积值类型和元素类型可能不一致，或者可迭代对象可能为空，就提供 `initializer`。养成"调用 reduce 时养成显式思考单位元的习惯"——这一步能把绝大多数空序列崩溃和类型不匹配的 bug 提前消除。

```python
# 不推荐：空列表会报错
total = reduce(operator.add, values)

# 推荐：显式提供加法单位元
total = reduce(operator.add, values, 0)
```

**累积函数尽量纯函数**

`reduce` 的累积函数最好是无副作用的纯函数：给定同样的累积值和元素，返回同样的新累积值，不偷偷修改 `accumulator`。这样 `reduce` 的行为才容易推理。如果为了性能而做原地修改（如 `extend`、`update`），要在注释里明确说明这个累积函数会修改 `accumulator`，并严格遵守"每次调用都建立一个新的可变 `initializer`"的原则。

```python
# 推荐：纯函数式，每次创建新列表（适合数据量不大的场景）
result = reduce(lambda acc, x: acc + [x], data, [])

# 也可接受：原地修改（适合大数据量），但确保每次都用新的 initializer
result = reduce(lambda acc, x: (acc.append(x), acc)[1], data, [])
```

**避免复杂的累积 lambda**

如果累积逻辑需要超过两三行、有控制流、有状态变量、要抛异常，那就不该塞进 `lambda` 里。把这些逻辑抽成一个命名函数，再用 `reduce` 调用，可读性会好很多。更进一步，如果逻辑复杂到这种程度，可能直接写 `for` 循环更清晰。

```python
# 不推荐：lambda 里塞复杂逻辑
result = reduce(lambda acc, item: {**acc, item["type"]: acc.get(item["type"], 0) + item["amount"]}, items, {})

# 推荐：抽成命名函数
def collect_by_type(acc, item):
    t = item["type"]
    acc[t] = acc.get(t, 0) + item["amount"]
    return acc

result = reduce(collect_by_type, items, {})
```

**警惕大序列下的性能问题**

`reduce` 每一步都要调用一次 Python 函数（`lambda` 或命名函数），相比内置函数的 C 实现，对大序列会有明显开销。如果累积逻辑可以用内置函数表达，性能差距可能是一个数量级以上。即使在非用 `reduce` 不可的场景，也要避免累积函数里做 O(n) 的操作（比如 `acc + [x]` 在列表末尾添加是新建整个列表，整体 O(n²)）。

```python
from functools import reduce
import timeit

data = list(range(10000))

# reduce 版求和
reduce_time = timeit.timeit(lambda: reduce(lambda a, b: a + b, data, 0), number=100)
# 内置 sum 版
sum_time = timeit.timeit(lambda: sum(data), number=100)

print(f"reduce: {reduce_time:.4f}s")  # 输出示例：reduce: 0.0852s（数量级因机器而异）
print(f"sum: {sum_time:.4f}s")        # 输出示例：sum: 0.0061s
```

实测中 `sum` 比 `reduce(lambda a, b: a + b, ...)` 快十倍以上是常见的。这不是说 `reduce` 慢得不能用，而是强调"有专用函数就用专用函数"既是可读性上的取舍，也是性能上的取舍。

**不要用 reduce 模拟 map 和 filter**

`reduce` 可以模拟 `map`（把累积值维护成一个"结果列表"，每步 append 处理后的元素）和 `filter`（每步 append 满足条件的元素），但这种写法毫无可读性优势，性能也差。请直接用 `map`、`filter`、列表推导式。

```python
# 不推荐：用 reduce 模拟 map + filter
result = reduce(
    lambda acc, x: acc + [x * x] if x % 2 == 0 else acc,
    range(10),
    []
)

# 推荐：直接用列表推导式
result = [x * x for x in range(10) if x % 2 == 0]
```

**reducer 不要有副作用外露**

`reduce` 的累积函数有时候为了性能会修改 `accumulator`，但不要让它去修改外部其他对象（比如全局变量、传入的其他参数）。这种隐藏副作用会让 `reduce` 的结果难以预测。如果一定要有副作用（比如打日志、缓存），把副作用局限在 `accumulator` 这一对象上。

## 4. 原理

### 4.1 reduce 的折叠机制与左结合递推

`reduce` 的核心机制是"左折叠"：把一个二元函数 `f` 从左到右依次应用到序列上，每一步都用当前累积值和下一个元素计算出新的累积值，直到序列耗尽。可以用一个递归定义来精炼地描述：

```
reduce(f, [x1, x2, x3, ...], init) = f(f(f(init, x1), x2), x3), ...
reduce(f, [x1, x2, x3, ...])       = f(f(x1, x2), x3), ...        # 从 x1, x2 开始
```

把含 `initializer` 的版本展开成表达式，能看到清晰的"左结合"括号嵌套：

```
f(f(f(f(init, x1), x2), x3), x4)
```

内层括号最先求值，外层最后求值。"左"的语义体现在两点：

- **遍历方向是从左到右**：先处理 `x1`，再 `x2`，再 `x3`……
- **结合方向是左结合**：累积值始终在左参数位置（即 `f(acc, x)`），新元素在右参数位置。

这两点合起来决定了"左折叠"的完整语义。对加法、乘法这种满足交换律和结合律的运算，左折叠、右折叠结果都一样；但对减法、除法、列表头插（`[x] + acc`）这类顺序敏感的运算，左折叠和右折叠会产生不同结果。理解这一点，才能在需要"右结合"时知道为什么不能简单调换 `lambda` 的参数位置。

可以从一个具体例子看清楚左结合的括号结构。给定 `reduce(lambda a, b: a - b, [10, 3, 2], 0)`，完整的展开式是：

```
((0 - 10) - 3) - 2
= (-10 - 3) - 2
= -13 - 2
= -15
```

每一步的 `acc` 都是一个"已经折叠好的中间值"，`f` 把它和下一个元素再折叠一次。这种"把序列结构压扁成单值"的过程，在函数式编程里叫"折叠"（fold），在数据结构理论里叫"catamorphism"（范畴论中的"坍缩"）——`reduce` 就是这两个抽象概念在 Python 里的具体实现。

### 4.2 initializer 对空序列边界的处理

`reduce` 在没有 `initializer` 时对空序列抛 `TypeError`，这个行为是刻意的。原因在于：没有 `initializer` 时，`reduce` 无法给出一个"什么都没累积"的合理返回值——它没有累积值的起点，又没有元素可以取第一个作为起点。抛异常是让调用方意识到"这个累积在空序列上没有定义"，而不是默默返回某个可能错误的默认值。

提供 `initializer` 后，空序列的行为变成"直接返回 `initializer`"。这一点可以从 `reduce` 的实现伪代码中看清：

```python
# reduce 的简化伪代码（无 initializer 分支）
def reduce(func, iterable, initializer=None):
    it = iter(iterable)
    if initializer is None:
        try:
            acc = next(it)            # 没初始值，尝试取第一个元素作为初值
        except StopIteration:
            raise TypeError("reduce() of empty iterable with no initial value")
    else:
        acc = initializer             # 有初始值，直接用它
    for x in it:
        acc = func(acc, x)            # 每步更新累积值
    return acc
```

从伪代码可以看出：

- **无 initializer 时**：`acc = next(it)` 取第一个元素。如果序列空，`next` 抛 `StopIteration`，被捕获后改抛 `TypeError`。
- **有 initializer 时**：`acc = initializer`，随后 `for x in it` 从第一个元素开始正常累积。如果序列空，循环根本不执行，直接返回 `initializer`。

这就是"提供 `initializer` 能优雅处理空序列"的实现根源——它给 `reduce` 提供了一个不需要从序列取的累积起点，让循环有一个良定义的初值，即便序列为空也无碍。

这也解释了为什么"initializer 应该是单位元"：因为只有单位元才能保证"没有累积发生时返回的值"和"做了完整累积后的值"在语义上一致。如果你给求和传 `initializer=10`，空序列返回 `10`，看起来似乎也合理，但它混淆了"没做任何加法"和"已经从 10 起步了"两种语义，容易让调用方产生误判。

### 4.3 C 实现层面：循环而非递归避免栈溢出

`functools.reduce` 在 CPython 里是用 C 实现的（源码在 `Modules/_functoolsmodule.c` 的 `functools_reduce` 函数）。尽管"折叠"在数学定义上常被写成递归形式：

```
foldl(f, init, [x1, x2, ...]) = foldl(f, f(init, x1), [x2, ...])
foldl(f, init, [])            = init
```

但 CPython 的实现并不是递归调用，而是一个简单的 C 循环：

```c
// 简化的 C 伪代码（实际实现见 CPython 源码）
static PyObject *
functools_reduce(PyObject *self, PyObject *args) {
    PyObject *func, *seq, *result, *item;
    PyObject *it = PyObject_GetIter(seq);
    if (initializer != NULL) {
        result = initializer;            // 有 initializer，直接用
    } else {
        result = PyIter_Next(it);        // 没 initializer，取第一个元素
        if (result == NULL) {
            // 序列为空，抛 TypeError
        }
    }
    while ((item = PyIter_Next(it)) != NULL) {
        PyObject *newacc = PyObject_CallFunctionObjArgs(func, result, item, NULL);
        Py_DECREF(result);
        Py_DECREF(item);
        result = newacc;
    }
    return result;
}
```

这个循环实现有几个重要的工程价值：

- **不会栈溢出**：因为是循环而不是递归，理论上可以处理任意大的可迭代对象，只要内存和时间允许。如果用递归实现，处理百万级元素的序列会立刻撞到 Python 的递归深度上限（默认 1000）。
- **每步只保持当前累积值**：循环里只有一个 `result` 变量携带当前累积值，不需要保留中间所有步的累积历史，内存占用是 O(1)（不算累积值本身的大小）。如果你想知道中间每步的累积值，得用 `itertools.accumulate`，它返回的是一个生成所有中间累积值的迭代器。
- **迭代器协议友好**：`reduce` 通过 `PyObject_GetIter` + `PyIter_Next` 消费可迭代对象，这意味着它兼容任何实现了 `__iter__` 和 `__next__` 的对象，包括生成器、`map`/`filter` 对象等惰性序列。

`itertools.accumulate` 是 `reduce` 的"近亲"——它也是左折叠，但不返回最终的单个值，而是返回一个迭代器，逐步吐出每个中间累积值。如果你既要最终结果也要过程，应当用 `accumulate`：

```python
from itertools import accumulate
import operator

# accumulate 返回每一步的中间累积值
# 求和过程的"滚动总和"
print(list(accumulate([1, 2, 3, 4, 5], operator.add, initial=0)))
# 输出：[0, 1, 3, 6, 10, 15]
# 注意 initial=0 让结果包含起点 0，否则会是 [1, 3, 6, 10, 15]
```

可以看到 `accumulate([1,2,3,4,5], add, initial=0)` 给出的是 `[0, 1, 3, 6, 10, 15]`，其中 `0` 是初始累积值，之后每来一个元素都计算一次新累积值。`reduce` 实际上就是 `accumulate` 序列的最后一个值。这也是为什么 `reduce` 不能短路——它的 C 循环直到 `PyIter_Next` 返回 `NULL`（即 `StopIteration`）才结束，中途没有检查累积值的条件退出机制。

### 4.4 为何 Python 3 把 reduce 移到 functools 的设计考量

Python 2 时代，`reduce` 是内置函数，可以直接用 `reduce(...)` 而无需 `import`。Python 3 把它移到了 `functools` 模块，需要 `from functools import reduce` 才能用。这个决定背后是一段著名的设计哲学争议。

Guido van Rossum（Python 之父）在 2005 年写过一篇博客《The fate of reduce() in Python 3000》，明确表达了对 `reduce` 的不欣赏：

> "I think dropping filter() and map() is pretty uncontroversial. ... I also think ~~reduce~~ should be dropped from Python 3000. ... I think that if you're writing code that uses `reduce` heavily, you're probably writing code that's hard for most Python programmers to read."

他的核心论点是：

**第一，可读性差**。`reduce` 把"遍历 + 累积"打包进一个不透明的函数调用，读者必须在脑里"展开这个折叠"才能知道代码做什么。对一个不熟悉函数式编程的 Python 程序员来说，`reduce(lambda a, b: a + b, values)` 远不如 `sum(values)` 或 `total = 0; for v in values: total += v` 直观。

**第二，专用函数能覆盖大多数场景**。求和、求积、最大值、最小值、是否存在真值、是否全真、字符串拼接——这些日常累积都有内置专用函数。`reduce` 这个"通用折叠"反而变成了"看起来通用、实际很少用得上"的工具，留下来只会诱导人们写出比专用函数更差的代码。

**第三，函数式编程不是 Python 的主旋律**。Python 借鉴了函数式编程的一些好东西（`map`、`filter`、`lambda`、列表推导式），但它的核心风格是命令式的、面向对象的。把 `reduce` 放在内置函数里会给新手一种"Python 鼓励函数式风格"的错觉，而实际上 Python 社区更推崇列表推导式和生成器表达式。

经过社区讨论，最终 Python 3 采取了折中方案：

- `map`、`filter` 保留在内置，但鼓励用列表推导式替代；
- `reduce` 移到 `functools`，明确它的定位是"有用的高级工具，但不是日常推荐"；
- 新增 `sum` 作为求和的标准答案，明确"求和就该用 `sum`"。

这个设计选择折射出 Python 的整体哲学：**API 设计要照顾大多数人的可读性，少数高级用户的特殊需求通过专门模块满足**。`functools.reduce` 留下了，但放在了一个不会让新手误以为"它就是标准做法"的位置。这种"对通用性的克制"是 Python 区别于一些纯函数式语言的重要风格。

实践上，这意味着读完这篇笔记的你也应该形成一个心理映射：**写下 `reduce(...)` 之前，先问自己有没有更简单的专用函数或一行 `for` 循环**。如果答案是"有"，那就别用 `reduce`；如果答案是"这个累积确实没有更简单的表达方式，且累积函数足够简单清晰"，再考虑 `reduce`。

## 5. 总结

本文围绕 `functools.reduce` 讲解了以下内容：

- `reduce` 是把二元函数从左到右累积应用到可迭代对象、把整列数据折叠成单个值的高阶函数。
- `reduce(function, iterable, initializer=None)` 的三个参数：`function` 是二元累积函数，`iterable` 是数据源，`initializer` 是可选的初始累积值。
- 无 `initializer` 时第一个元素作为初值、从第二个元素开始才调用 `function`；有 `initializer` 时它作为初值，`function` 对每个元素都调用一次。
- 空序列且无 `initializer` 会抛 `TypeError`，提供 `initializer` 可以优雅地返回它作为默认值。
- 逐次 `func(acc, next)` 的递推过程是 `reduce` 的执行本质，理解它能把任何 `reduce` 改写成等价的 `for` 循环。
- 典型应用包括求和求积、求最大最小、扁平化嵌套列表、连乘阶乘、字典合并、构建链表/嵌套字典等结构。
- `reduce` 与内置专用函数（`sum`、`math.prod`、`max`、`min`、`any`、`all`、`str.join` 等）相比，在可读性、性能、短路求值上都处于劣势；能用专用函数就不要 `reduce`。
- 右折叠可以通过 `reduce(lambda a, b: ..., reversed(seq))` 配合参数交换来模拟。
- `initializer` 应当是累积操作的"单位元"，这样空序列的默认值语义自洽；要警惕可变 `initializer` 被多次调用复用导致的污染。
- `reduce` 在 CPython 中是 C 循环实现而非递归，理论上不会因序列过长而栈溢出；`itertools.accumulate` 是查看中间累积值的近亲工具。
- Python 3 把 `reduce` 从内置移到 `functools` 的设计考量，反映了 Python 对"可读性优先于通用性"的取舍。

读完本文你应能掌握：

- 能准确说出 `reduce` 的签名、三个参数各自的语义、有/无 `initializer` 时调用 `function` 的次数差异。
- 能把任意一段 `reduce` 代码改写成等价的 `for` 循环，反之亦然。
- 能正确选择 `initializer`（单位元），并解释为什么不用 `initializer` 时空序列会报错。
- 能判断一个累积场景该用 `reduce` 还是用内置专用函数，并说明取舍理由。
- 能用 `reduce` 实现扁平化嵌套列表、合并多个字典、构建链表等无专用函数的场景。
- 能用 `reduce` + `reversed` 配合参数交换模拟右折叠，并说明左右折叠在顺序敏感运算上的差异。
- 能解释 `reduce` 在 CPython 中的循环实现为什么不会栈溢出、为什么不能短路求值。
- 能阐述 Python 3 把 `reduce` 移到 `functools` 的设计理由，并在自己写代码时遵循"专用函数优先、reduce 兜底"的原则。