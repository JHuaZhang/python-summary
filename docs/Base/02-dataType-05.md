---
group:
  title: 【02】基础数据类型和类型系统
  order: 2
order: 5
title: float类型与精度问题
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 float 类型

`float` 是 Python 中表示浮点数(小数)的内置类型,如 `3.14`、`-0.5`、`2.71828`、`1.0`。它用于表示一切"带小数的连续量"——温度、长度、比例、概率、科学测量、计算结果中的非整数部分。当你写下 `3.14` 这个字面量时,得到的就是一个 `float` 对象。

```python
print(3.14)         # 3.14
print(type(3.14))   # <class 'float'>
print(type(1.0))    # <class 'float'> —— 即便值是整数,写了小数点就是 float
```

`float` 与 `int` 最大的不同,在于它**不能精确表示大多数十进制小数**。这是 `float` 最重要的特性,也是它绝大多数"诡异行为"的根源:

```python
print(0.1 + 0.2)           # 0.30000000000000004 —— 不是 0.3!
print(0.1 + 0.2 == 0.3)    # False
```

`0.1 + 0.2` 不等于 `0.3`,这并非 Python 的 bug,而是所有遵循 IEEE 754 浮点标准的语言(C、Java、JavaScript、Go 无一例外)的共同现象。`float` 内部用二进制存储数值,而 `0.1`、`0.2` 在二进制下是无限循环小数,存储时被截断,累加后误差暴露。本篇的核心任务之一,就是讲清这个误差从何而来、如何规避。

`float` 的一些关键事实:

- **底层是 IEEE 754 双精度(64 位)**:1 位符号 + 11 位指数 + 52 位尾数。这套标准由 CPU 硬件直接支持,运算极快。
- **有范围限制**:`float` 能表示的最大值约 `1.8 × 10^308`,超出变 `inf`(无穷);最小正数约 `5e-324`,更小变 `0.0`。这是和 `int`(任意精度无上限)的本质区别。
- **不可变(immutable)**:与 `int` 一样,`float` 不可变,运算返回新对象,可哈希能做 `dict` 键。
- **特殊值**:`inf`(无穷)、`-inf`(负无穷)、`nan`(非数,Not a Number)。

```python
print(1.0 / 0.0)          # ZeroDivisionError(Python 不允许浮点除零,与某些语言不同)
print(float('inf'))       # inf
print(float('nan'))       # nan
```

本篇要系统讲透 `float`:字面量写法、算术运算与精度误差、`round` 的银行家舍入、`inf`/`nan` 的行为、`float` 的方法、与 `int` 的转换与隐式提升、**精度问题的完整规避方案**(`int` 存最小单位、`Decimal`、`Fraction`、容差比较)、以及 IEEE 754 的内部原理。这是本大章节里最该认真对待的类型——因为它的精度陷阱在生产环境中引发过无数金额计算 bug。

### 1.2 int 与 float:何时用哪个

`int` 与 `float` 的选择,取决于数据本质是"离散整数"还是"连续小数",以及是否需要精度:

- **本质是离散计数**(个数、索引、ID、份数)→ `int`。精确无误差。
- **本质是连续量/带小数**(温度、长度、比例)→ `float`。物理测量本就有误差,float 的精度通常足够。
- **精度敏感的金额/利率** → 用 `int` 存最小单位(金额存"分"),或 `decimal.Decimal`。**绝不要用 `float` 存金额**。

```python
# 金额:用 int 存"分",精确
total_cents = 199 + 299 + 499    # 997 分,精确
print(total_cents / 100)         # 9.97(仅展示时转元)

# float 存金额会出问题
print(0.1 + 0.2)                 # 0.30000000000000004 —— 这就是不能存金额的原因
print(49.99 * 100)               # 4998.999999999999,不是 4999
```

"金额用 int 存分"这条实践极其重要——它用 `int` 的精确性规避了 `float` 的精度误差,是工业级金额计算的标配(数据库的 `DECIMAL` 类型同理)。凡涉及钱的逻辑,第一反应应是"用整数最小单位"。

何时该用 `float`?科学计算、物理量、比例、统计分析、图形坐标——这些场景数据本就来自测量(有固有误差),float 的 15~17 位有效数字精度通常远超需求,且 float 运算由 CPU 硬件加速,性能远高于 `Decimal`。NumPy 等科学计算库也基于 float。所以 `float` 不是"坏类型",只是在"精确十进制"场景(金额)用错了地方。

### 1.3 float 的核心特性速览

| 特性 | 说明 |
|------|------|
| 底层 | IEEE 754 双精度(64 位),硬件加速 |
| 精度 | 约 15~17 位有效十进制数字 |
| 范围 | 约 ±1.8×10³⁰⁸,超出 → `inf`;最小正数约 5e-324 |
| 可变性 | 不可变,运算返回新对象 |
| 可哈希 | 是,可做 `dict` 键 / `set` 元素 |
| 精度误差 | 二进制无法精确表示多数十进制小数 |
| 特殊值 | `inf`、`-inf`、`nan` |
| `int` 混合运算 | 隐式提升为 float,结果 float |

理解这张表,就建立了 `float` 的全局认知。后续章节会逐一展开,重点是"精度误差"这条——它是 `float` 一切特殊行为的根源,也是本篇着墨最多的部分。

---

## 2. 核心内容

本章详解 `float` 的全部用法与精度问题。每节遵循"规则 → demo → 陷阱 → 场景"展开。精度误差与 `round`、`inf`/`nan`、Decimal 规避方案是重点,因为它们最易在生产环境出问题。

### 2.1 float 字面量

`float` 字面量有多种形式,核心规则:**必须含小数点 `.` 或指数 `e`/`E` 之一**(否则就是 `int`)。

```python
print(3.14)        # 3.14 —— 标准小数
print(3.)          # 3.0 —— 小数点后数码可省略
print(.5)          # 0.5 —— 小数点前数码可省略
print(2e3)         # 2000.0 —— 科学计数法,2 × 10³
print(2E3)         # 2000.0 —— E 大小写均可
print(1.5e-3)      # 0.0015 —— 负指数
print(3.14e2)      # 314.0
```

科学计数法 `eN` 表示"乘以 10 的 N 次方"。`2e3` = 2000.0。注意凡含 `e` 的字面量都是 `float`,哪怕结果看起来是整数(`2e3` 是 `2000.0` 不是 `2000`)。

⚠️ `.5` 与 `3.` 这种省略形式合法但可读性见仁见智:`.5` 容易被一眼扫成 `5`。团队代码里写 `0.5` 更稳妥。省略形式在数学公式里常见,正式工程代码倾向写全。

**下划线分隔**(3.6+):float 也支持,提升可读性:

```python
print(1_000.5)         # 1000.5
print(6.022_140_76e23) # 阿伏伽德罗常数,分组清晰
```

**特殊浮点值**:`float` 没有直接表示 `inf`/`nan` 的字面量语法,但可通过 `float()` 构造或 `math` 模块:

```python
print(float('inf'))       # inf —— 正无穷
print(float('-inf'))      # -inf
print(float('nan'))       # nan
import math
print(math.inf)           # inf —— math 常量,更清晰
print(math.nan)           # nan
```

严格说 `float('inf')` 是构造函数调用而非字面量(需执行函数),但它是写出 `inf`/`nan` 的标准方式。`math.inf`/`math.nan` 是更清晰的替代。

### 2.2 精度误差:float 最核心的问题

这是 `float` 最重要的章节。`0.1 + 0.2 != 0.3` 不是 bug,而是 IEEE 754 浮点的本质。先看现象:

```python
print(0.1 + 0.2)              # 0.30000000000000004
print(0.1 + 0.2 == 0.3)       # False
print(0.1 + 0.2 - 0.3)        # 5.551115123125783e-17 —— 极小残差
print(1.1 + 2.2)              # 3.3000000000000003
print(0.1 * 3)                # 0.30000000000000004
print(0.7 - 0.1)              # 0.6(恰好干净的情况也有,看二进制表示)
```

误差从何而来?`float` 用二进制存储数值,而 **`0.1` 在二进制下是无限循环小数**(`0.0001100110011...`),存储时被截断到 52 位尾数,实际存储值略偏离 0.1。两个"略偏"的数相加,误差暴露。用 `repr` 看真相:

```python
print(repr(0.1))              # 0.1 —— Python 的 repr 会"巧妙"显示成 0.1(repr 优化)
print(f"{0.1:.20f}")          # 0.10000000000000000555 —— 实际存储值略大于 0.1
print(f"{0.3:.20f}")          # 0.29999999999999998890 —— 实际存储值略小于 0.3
```

`repr(0.1)` 显示 `0.1` 是因为 Python 的浮点 repr 用了"最短表示"算法——找到与 0.1 实际存储值最接近的、能唯一回转到该存储值的短十进制串,显示成 `0.1`。但底层存储值是 `0.10000000000000000555...`。所以 `0.1 + 0.2` 加出来是 `0.30000000000000004`,它与 `0.3` 的存储值(`0.29999...`)不相等。

**这影响的不仅是相等比较,还有累积误差**:

```python
total = 0.0
for _ in range(10):
    total += 0.1
print(total)                  # 0.9999999999999999 —— 不是 1.0!
print(total == 1.0)           # False
```

10 个 `0.1` 相加不等于 `1.0`——若这是金额累加,账就对不平了。这正是 float 不能用于金额的根本原因。

**误差的几个表现维度**:

```python
# 显示与实际不符
print(0.1 + 0.2)              # 0.30000000000000004(显示)
print(round(0.1 + 0.2, 17))   # 0.30000000000000004(无法靠 round 修好)

# 比较失效
print(0.1 + 0.2 == 0.3)       # False

# 累积
total = sum([0.1] * 10)       # 0.9999999999999999
print(total)

# 大数吞噬小数(精度丢失)
big = 1e16
print(big + 1.0)              # 1e+16 —— 1.0 被"吞掉"了!因 1e16 已用满 52 位尾数
print(big + 1.0 == big)       # True
```

最后一条"大数吞噬小数"值得注意:当数值很大(接近精度上限)时,加上一个相对极小的数,小数会被舍入掉,因为 float 的 52 位尾数无法同时容纳大数的所有有效位和那个小增量。这解释了"`1e16 + 1 == 1e16`"这种看似荒谬的结果。

**核心结论**:`float` 是"近似值"而非"精确值"。任何依赖 float 精确相等的逻辑(比较、累加求和、金额)都会出问题。

### 2.3 round() 的银行家舍入陷阱

`round(x, n)` 把 `x` 四舍五入到 n 位小数。但它有个反直觉细节:**银行家舍入(round half to even)**——当待舍入位正好是 5 时,向**最近的偶数**舍入,而非总是向上。

```python
print(round(3.14159, 2))    # 3.14 —— 正常四舍五入
print(round(2.5))           # 2!不是 3 —— .5 时向偶数舍入
print(round(3.5))           # 4
print(round(0.5))           # 0
print(round(1.5))           # 2
print(round(2.675, 2))      # 2.67(不是 2.68!)—— 见下方精度解释
```

`round(2.5) → 2`、`round(3.5) → 4`:两者都向最近的偶数靠(2 是偶数,4 是偶数)。这与多数人"四舍五入逢 5 进 1"的直觉冲突。银行家舍入的目的是在大量数据上避免系统性偏差(若总向上,正误差累积;向偶数则长期正负抵消),金融领域常用。

⚠️ **`round(2.675, 2)` 为何是 `2.67` 而非 `2.68`?** 这又是 float 精度问题:`2.675` 的实际存储值略小于 2.675(`2.67499999...`),所以 `round` 在"比 5 略小"的位置,向 2.67 舍。也就是 `round` 的"银行家规则"只在数值**真的精确等于 5** 时才触发,而 float 几乎不可能精确等于 5,所以实际行为常被精度误差干扰,不可预测。

```python
print(f"{2.675:.20f}")    # 2.67499999999999982236 —— 实际略小,故 round 到 2.67
```

**`round` 返回 float**(`round(3.14, 2)` 返回 `3.14` 这个 float,仍是近似值):

```python
print(type(round(3.14, 2)))   # <class 'float'>
print(round(2.675, 2))        # 2.67 —— 仍是 float,仍有精度问题
```

⚠️ **round 不能"修好"精度问题**:`round(0.1 + 0.2, 1)` 得 `0.3`,看似好了,但 `round` 结果仍是 float,内部仍是近似值,后续运算误差会再冒出来。round 只能"限制显示位数",不能让 float 变精确。

```python
x = round(0.1 + 0.2, 2)    # 0.3(显示)
print(x == 0.3)             # True(恰好),但
print(x * 3)                # 0.8999999999999999!round 后再算又冒误差
```

**正确取整/舍入的多种方式**:

```python
import math
# 截断
print(math.trunc(3.7))      # 3(向零)
print(int(3.7))             # 3(等同 trunc)
# 向下/向上
print(math.floor(3.7))      # 3
print(math.ceil(3.7))       # 4
# 四舍五入(传统,非银行家)
print(math.floor(3.5 + 0.5)) # 4(传统四舍五入的实现:加0.5后向下取整,但负数要另处理)
```

需要"传统四舍五入(逢5进1)"而非银行家舍入时,Python 内建没有直接函数,可用 `Decimal` 的 `ROUND_HALF_UP` 模式(见 §2.6)。round 的银行家规则要刻进认知,避免在金额/统计中误用产生系统性偏差。

### 2.4 特殊浮点值:inf 与 nan

`float` 有两个特殊值:`inf`(无穷)和 `nan`(Not a Number,非数)。它们遵循独特的运算规则,处理不当会引入隐蔽 bug。

**inf(无穷)**:表示超出表示范围的值,有正负。

```python
import math
print(math.inf)          # inf
print(-math.inf)         # -inf
print(float('inf'))      # inf
print(1e400)             # inf —— 超出最大值,变成 inf
print(math.inf > 1e308)  # True
print(math.inf + 1)      # inf —— 无穷加有限仍无穷
print(math.inf * 2)      # inf
print(1 / math.inf)      # 0.0
```

**nan(非数)**:表示"无意义的运算结果"(如 `0/0`、`inf - inf`、负数开方等数学未定义运算)。nan 的核心特性:**nan 与任何值(含自身)都不相等**。

```python
print(math.nan)               # nan
print(float('nan'))           # nan
nan = math.nan
print(nan == nan)             # False! —— nan 不等于自己
print(nan != nan)             # True
print(nan > 0, nan < 0)       # (False, False) —— nan 与任何数比较都 False
print(math.isnan(nan))        # True —— 判 nan 唯一可靠方式
```

⚠️ **`nan != nan` 为 True** 是 nan 最反直觉的特性。它导致"用 `==` 判 nan 永远失败":

```python
x = math.nan
# 错误:nan 永远不等于 nan,这个判断永远 False
if x == math.nan:
    print("是 nan")
# 正确:用 math.isnan
if math.isnan(x):
    print("是 nan")   # ← 走这里
```

判 nan **必须**用 `math.isnan(x)`,绝不能用 `x == float('nan')`(恒为 False)。这是 nan 处理的第一守则。

**inf 的运算规则**:

```python
inf = math.inf
print(inf - inf)         # nan —— 无穷减无穷无意义
print(inf / inf)         # nan
print(0.0 * inf)         # nan
print(inf + inf)         # inf
print(inf * 0.0)         # nan
print(1.0 / 0.0)         # ZeroDivisionError!Python 浮点除零会报错,不像某些语言返回 inf
```

注意 Python 的 `1.0 / 0.0` 抛 `ZeroDivisionError`,而非返回 `inf`(与 JavaScript/IEEE 某些实现不同)。但 `1.0 / inf` 是 `0.0`,`inf - inf` 是 `nan`。

**nan 在数据中的危害**:nan 一旦混入数据,会"污染"统计结果——任何与 nan 的算术都得 nan,且 nan 比较都 False,导致求和、平均值、排序混乱:

```python
data = [1.0, math.nan, 3.0]
print(sum(data))         # nan —— 一个 nan 毒化整个求和
print(max(data))         # nan —— 排序也乱
# 数据清洗时必须先剔除 nan
clean = [x for x in data if not math.isnan(x)]
print(sum(clean))        # 4.0
```

处理含 nan 的数据时,务必先用 `math.isnan` 过滤,否则整个计算被毒化。NumPy 有 `np.nanmean`/`np.nansum` 等专门的 nan 安全函数。

### 2.5 float 的常用方法

`float` 作为内置类型,方法不多,但有几个实用:

**`as_integer_ratio()`**:把 float 表示为分数(分子/分母),精确揭示其内部值:

```python
print((0.5).as_integer_ratio())    # (1, 2) —— 0.5 = 1/2,精确(2 的幂可精确表示)
print((0.1).as_integer_ratio())    # (3602879701896397, 36028797018963968) —— 0.1 的近似分数
print((0.1).as_integer_ratio())    # 0.1 实际 = 3602879701896397/36028797018963968
```

`0.5` 的 ratio 是干净的 `1/2`(因 0.5 是 2 的幂次,二进制精确),而 `0.1` 的 ratio 是个巨大分数——直观证明 `0.1` 无法精确表示。这是理解 float 误差的利器。

**`is_integer()`**:判断 float 是否为整数值(值层面,非类型层面):

```python
print((3.0).is_integer())    # True —— 值是整数(但类型仍是 float)
print((3.5).is_integer())    # False
print((0.1).is_integer())    # False
```

注意 `3.0` 类型是 `float`,但 `is_integer()` 为 `True`(它的值是整数)。常用于"判断浮点结果是否恰好整数"。

**`hex()`**:float 的十六进制表示,直观看到其内部指数/尾数:

```python
print((1.0).hex())           # '0x1.0000000000000p+0'
print((0.1).hex())           # '0x1.999999999999ap-4'
```

`p` 后是二进制指数。这个方法日常少用,但在深入分析 float 表示时有用。

**`float()` 构造**:从其他类型创建 float:

```python
print(float(3))          # 3.0 —— int → float
print(float("3.14"))     # 3.14 —— str → float
print(float("1e5"))      # 100000.0 —— 含指数的字符串
print(float("inf"))      # inf
print(float(True))       # 1.0 —— bool → float(True 即 1)
# float("abc")           # ValueError
# float("3,14")          # ValueError —— 不认逗号(欧洲小数点写法)
```

⚠️ `float()` 转换失败抛 `ValueError`,处理外部输入需捕获。注意 `float("3,14")` 报错——欧洲用逗号作小数点,直接转失败,需先替换。

### 2.6 精度问题的规避方案(重点)

这是 `float` 实战最关键的部分——既然 float 有精度问题,如何在需要精度的场景规避?有四条出路。

**方案一:int 存最小单位(推荐用于金额)**

把金额存成"分"等最小单位的整数,全程用 int 精确计算,仅在展示时除以 100 转元。彻底绕开浮点。

```python
# 金额用 int 存"分"
price_cents = 4999          # 49.99 元 = 4999 分
qty = 3
total_cents = price_cents * qty   # 14997 分,精确
print(f"总计:{total_cents / 100:.2f} 元")  # 总计:149.97 元(仅展示转元)

# 对比 float 的错误
print(49.99 * 3)           # 149.97(显示),但
print(49.99 * 100)         # 4998.999999999999 —— 内部不精确
```

这是最简单、最可靠、最高性能的金额方案,工业界广泛使用。缺点:需全程维护"分"的约定,且不适合有非整数比例(如利率 3.75%)直接参与运算的场景(那种用 Decimal)。

**方案二:decimal.Decimal(精确十进制)**

`decimal` 模块提供十进制浮点运算,"存什么是什么",精确表示 `0.1`。它是为金融/财务场景设计的标准库。

```python
from decimal import Decimal, getcontext

a = Decimal('0.1')          # 注意:用字符串构造!用 float 构造会带入精度
b = Decimal('0.2')
print(a + b)                # 0.3 —— 精确!
print(a + b == Decimal('0.3'))  # True

# 对比 float
print(0.1 + 0.2 == 0.3)     # False
```

⚠️ **Decimal 必须用字符串构造**:`Decimal(0.1)` 会把 float 0.1 的不精确值原样带进 Decimal(得到 `0.1000000000000000055...`),失去精度。必须 `Decimal('0.1')` 从字符串构造,才是精确的 0.1:

```python
print(Decimal(0.1))         # Decimal('0.1000000000000000055511151231257827021181583404541015625') —— 带 float 误差!
print(Decimal('0.1'))       # Decimal('0.1') —— 精确
# 所以:永远用字符串构造 Decimal
```

Decimal 的精度与舍入可控:

```python
from decimal import Decimal, ROUND_HALF_UP, getcontext
getcontext().prec = 6       # 全局精度:6 位有效数字
# 传统四舍五入(逢5进1),用 ROUND_HALF_UP
print(Decimal('2.675').quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))  # 2.68 —— 传统舍入!
# 对比 round(2.675,2) = 2.67(银行家)
```

Decimal 支持 `ROUND_HALF_UP`(传统四舍五入)、`ROUND_HALF_EVEN`(银行家,默认)、`ROUND_DOWN`、`ROUND_CEILING` 等多种舍入模式,金融计算可精确控制。代价:运算比 float 慢得多(软件实现的十进制运算,无 CPU 加速),性能敏感场景慎用。

**方案三:fractions.Fraction(精确有理数)**

`fractions.Fraction` 用分数(分子/分母)精确表示有理数,运算无任何误差,直到需要时才转 float。

```python
from fractions import Fraction
a = Fraction(1, 10)         # 1/10
b = Fraction(2, 10)         # 2/10
print(a + b)                # 3/10 —— 精确
print(a + b == Fraction(3, 10))  # True
print(float(a + b))         # 0.3 —— 需要时转 float
```

Fraction 适合"精确有理数运算"(如分数计算、精确比例),自动约分(`Fraction(2,10)` = `Fraction(1,5)`)。缺点:无法表示无理数(π、√2),分母增长导致运算变慢,不适合大规模数值计算。

**方案四:容差比较(epsilon)**

当必须用 float 但要比较相等时,不用 `==`,改用"差值小于某容差"判断:

```python
def almost_equal(a, b, eps=1e-9):
    return abs(a - b) < eps

print(almost_equal(0.1 + 0.2, 0.3))    # True —— 容差比较
print(0.1 + 0.2 == 0.3)                # False —— 严格相等失败

# 更稳妥:用相对容差(math.isclose,3.5+)
import math
print(math.isclose(0.1 + 0.2, 0.3))           # True
print(math.isclose(1e9 + 1, 1e9))             # True(默认相对容差,大数也判近)
print(math.isclose(1e-9, 1e-12))              # False(相对容差下不算近)
print(math.isclose(1e-9, 0, abs_tol=1e-8))    # True(加绝对容差判接近0)
```

`math.isclose(a, b, rel_tol=1e-9, abs_tol=0.0)` 是 Python 3.5+ 提供的容差比较,默认相对容差(适合大数),可加 `abs_tol` 绝对容差(适合接近 0 的小数)。比手写 `abs(a-b)<eps` 更稳健(处理了大数/小数两种情况)。**float 相等比较几乎总该用 `math.isclose`,而非 `==`**。

**四方案选型**:

| 场景 | 推荐方案 |
|------|---------|
| 金额(货币) | int 存最小单位,或 Decimal |
| 利率/财务精确十进制 | Decimal(可控精度与舍入) |
| 精确有理数/分数 | Fraction |
| 科学计算/物理量 | float(精度足够,性能好) |
| float 相等比较 | math.isclose(容差) |
| float 显示固定小数位 | round 或格式化(仅显示,不解决精度) |

记住总原则:**精度敏感追求精确 → int/Decimal/Fraction;性能敏感可接受近似 → float;float 比较 → isclose**。

### 2.7 float 与 int 的转换与隐式提升

`float` 与 `int` 互转是高频操作,且要注意"隐式提升"——int 与 float 混算时结果总变 float。

**int ↔ float**:

```python
print(float(5))         # 5.0 —— int → float
print(int(3.9))         # 3 —— float → int(截断,向零)
print(int(-3.9))        # -3(向零截断,不是 floor 的 -4)
print(int(3.0))         # 3
```

⚠️ `int(3.9)` 是**截断(向零)**不是四舍五入:`int(3.9)=3`、`int(-3.9)=-3`,直接丢小数部分。要四舍五入用 `round()`,要向下用 `math.floor()`:

```python
import math
print(int(3.9))         # 3(截断)
print(round(3.9))       # 4(四舍五入,但注意银行家规则)
print(math.floor(3.9))  # 3(向下)
print(math.ceil(3.9))   # 4(向上)
print(math.trunc(3.9))  # 3(向零,等同 int)
```

**除法的类型规则**(回顾,与《int 类型详解》呼应):

```python
print(8 / 2)            # 4.0 —— / 真除,永远 float(即便整除)
print(8 // 2)           # 4 —— // 地板除,操作数全 int 返回 int
print(8.0 // 2)         # 4.0 —— 有 float 参与,// 返回 float
print(7 / 2)            # 3.5
print(7 // 2)           # 3
print(7.0 // 2)         # 3.0
```

`//` 的返回类型取决于操作数:全 int 返回 int,有 float 返回 float。但 `//` 在有 float 时仍是地板除(向负无穷),只是结果类型是 float:

```python
print(-7.0 // 2)        # -4.0 —— float 地板除,向负无穷
```

**隐式提升(int → float)**:int 与 float 混合运算时,int 自动提升为 float,结果 float。这是"向更宽的类型看齐"的规则:

```python
print(3 + 0.5)          # 3.5 —— int 3 提升为 3.0 再加 float
print(type(3 + 0.5))    # <class 'float'>
print(2 * 3.0)          # 6.0 —— 结果 float
print(10 - 2.5)         # 7.5
print(4 ** 0.5)         # 2.0 —— 0.5 是 float,结果 float(开平方)
```

只要运算中有 float,结果就是 float。这条规则决定了"何时结果从 int 变 float",理解它就不会对 `8/2=4.0`、`4**0.5=2.0` 感到意外。详见《隐式类型转换》。

**float → str**(显示与解析):

```python
print(str(3.14))        # '3.14'
print(repr(3.14))       # '3.14'(最短表示)
print(f"{3.14159:.2f}") # '3.14' —— 格式化两位小数
print(f"{0.1+0.2:.2f}") # '0.30' —— 格式化能"掩盖"显示误差(但内部仍不精确)
print(f"{1234567.89:,}")# '1,234,567.89' —— 千分位
```

⚠️ 格式化(`:.2f`)能控制显示位数,看起来"修好了"误差,但内部 float 值不变,后续运算误差会再冒出。格式化只是"显示层",不是"精度解决方案"。

### 2.8 综合示例:float 精度问题的完整诊断与规避

下面这个片段集中演示 float 的精度现象与规避方案,阅读时对照每种现象的成因与解法:

```python
import math
from decimal import Decimal, ROUND_HALF_UP

# 1. 精度误差现象
print("=== 精度误差 ===")
print(f"0.1 + 0.2 = {0.1 + 0.2}, == 0.3? {0.1 + 0.2 == 0.3}")
print(f"0.1 实际值: {0.1:.20f}")
print(f"10 次 0.1 累加: {sum([0.1]*10)}, == 1.0? {sum([0.1]*10) == 1.0}")

# 2. isclose 容差比较(正确比较方式)
print("=== 容差比较 ===")
print(f"isclose(0.1+0.2, 0.3) = {math.isclose(0.1 + 0.2, 0.3)}")
print(f"isclose(1e16+1, 1e16) = {math.isclose(1e16 + 1, 1e16)}")

# 3. round 银行家舍入
print("=== round 银行家舍入 ===")
print(f"round(2.5) = {round(2.5)}, round(3.5) = {round(3.5)}")
print(f"round(2.675, 2) = {round(2.675, 2)}(精度干扰,非 2.68)")

# 4. Decimal 精确十进制(金额方案)
print("=== Decimal 精确 ===")
price = Decimal('49.99')           # 字符串构造,精确
total = price * 3                  # Decimal 乘法,精确
print(f"49.99 × 3 = {total}")
# 传统四舍五入
print(f"2.675 传统舍入到2位: {Decimal('2.675').quantize(Decimal('0.01'), ROUND_HALF_UP)}")

# 5. int 存最小单位(金额另一方案)
print("=== int 存分 ===")
total_cents = 4999 * 3            # 4999 分 × 3
print(f"总计 {total_cents} 分 = {total_cents/100:.2f} 元")

# 6. 大数吞噬小数
print("=== 大数吞噬 ===")
big = 1e16
print(f"1e16 + 1 == 1e16? {big + 1.0 == big}(1 被精度吞掉)")

# 7. inf 与 nan
print("=== inf / nan ===")
print(f"inf - inf = {math.inf - math.inf}(nan)")
print(f"nan == nan? {math.nan == math.nan}(False), isnan? {math.isnan(math.nan)}(True)")
```

跑一遍这段示例,对照输出:float 的误差现象、isclose 的正确比较、round 的银行家规则、Decimal/int 的精确规避、大数吞噬、inf/nan 行为——float 的完整图景与应对就清晰了。核心结论:**精度敏感场景必须绕开 float(int/Decimal),float 比较用 isclose,round 不能修精度**。

---

## 3. 最佳实践

### 3.1 金额等精度敏感数据绝不用 float

```python
# 推荐:int 存分,或 Decimal
total = 4999 * 3                      # int 存分
total = Decimal('49.99') * 3          # Decimal 精确
# 绝不推荐:float 存金额
total_bad = 49.99 * 3                 # 内部 4998.999...,账对不平
```

货币、利率、税率、手续费等精度敏感计算,禁用 float。用 int 存最小单位(分)最简高效,需复杂十进制运算或可控舍入用 Decimal。这是 float 实践的头号红线。

### 3.2 float 相等比较用 math.isclose,不用 ==

```python
# 推荐
if math.isclose(a, b): ...
if math.isclose(a, b, abs_tol=1e-9): ...   # 接近 0 时加绝对容差
# 不推荐
if a == b: ...    # 0.1+0.2 == 0.3 会 False
```

float 是近似值,`==` 几乎总会因误差失败。`math.isclose` 用相对容差(默认 1e-9,适合大数)加可选绝对容差(适合小数),是 float 比较的标准方式。

### 3.3 round 是银行家舍入,且不能"修好"精度

```python
# 记住:round(2.5) == 2(向偶数),非 3
# round 结果仍是 float,后续运算误差会再冒出
# 需传统四舍五入用 Decimal + ROUND_HALF_UP
from decimal import Decimal, ROUND_HALF_UP
Decimal('2.675').quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)  # 2.68
```

不要指望 round 解决精度问题,它只控显示位数、且是银行家舍入(逢 5 向偶数)。金额/统计需传统四舍五入时用 Decimal 的 ROUND_HALF_UP。

### 3.4 Decimal 必须用字符串构造

```python
# 正确
Decimal('0.1')      # 精确 0.1
# 错误
Decimal(0.1)        # 带 float 误差,= 0.1000000000000000055...
```

`Decimal(float)` 会把 float 的不精确值原样带入,失去意义。从字符串、int 构造才精确。从 float 转时先 `str(float)` 也行但不如直接用字符串源。

### 3.5 累加大量 float 用更稳的算法

```python
# naive 累加有误差累积
total = 0.0
for x in data:
    total += x          # 误差累积
# 更稳:fsum(数学库的高精度求和)
math.fsum(data)         # 用更高内部精度求和,误差小得多
# 或 Kahan 求和算法(手动补偿误差)
```

大量 float 累加时误差会累积。`math.fsum` 用扩展精度内部累加,显著降低误差,比循环 `+=` 稳。精度敏感的求和优先 `math.fsum`。

### 3.6 数据中混入 nan 会毒化计算,先清洗

```python
# nan 会毒化求和/排序
clean = [x for x in data if not math.isnan(x)]
total = sum(clean)
# 判 nan 用 math.isnan,不用 ==
if math.isnan(x): ...
```

一个 nan 让整个 sum/max/min 变 nan。处理含 nan 数据(缺失值、未定义运算结果)前必须用 `math.isnan` 过滤。判 nan 永远用 isnan,不用 `==`(nan != nan)。

### 3.7 大数运算注意精度吞噬

```python
# 1e16 后加 1 会被吞
big = 1e16
big + 1 == big     # True!精度丢失
# 需要大数精度用 int(任意精度)或 Decimal
```

float 只有 ~15~17 位有效数字,大数后加小增量会被舍入丢失。需要大整数精度用 int(任意精度无上限),需大十进制精度用 Decimal。

### 3.8 取整明确语义:int 是截断非四舍五入

```python
# 截断(向零)
int(3.9)          # 3
# 四舍五入
round(3.9)        # 4(但注意银行家)
# 向下/向上
math.floor(3.9)   # 3
math.ceil(3.9)    # 4
```

`int()` 向零截断,新手常误以为是四舍五入。明确你需要截断、四舍五入、向下、向上哪种,选对应函数,负数下差异更明显(`int(-3.9)=-3` vs `floor(-3.9)=-4`)。

### 3.9 除法:要整数用 //,要小数用 /

```python
# 要整数商
avg_int = total // count
# 要小数精确商
avg = total / count
```

`/` 永远 float(即便整除 `8/2=4.0`),`//` 返回整数类型(全 int 时)。需要 int 结果用 `//`,需要小数用 `/`。

### 3.10 科学计算用 float,追求性能合理

```python
# 科学计算、NumPy:用 float,硬件加速,精度通常足够
import numpy as np
arr = np.array([0.1, 0.2, 0.3], dtype=np.float64)
```

float 不是"坏类型"——物理量、统计分析、图形、机器学习里 float 的 15 位精度远超需求,且 CPU 硬件加速、NumPy 向量化,性能远高于 Decimal。错的是"在金额等精确十进制场景用 float",而非 float 本身。

### 3.11 float 转换外部输入需捕获 ValueError

```python
try:
    x = float(user_input)
except ValueError:
    print("请输入有效数字")
```

`float("abc")`、`float("3,14")` 会抛 ValueError。处理用户输入/配置/JSON 解析的字符串转 float 时,务必 try/except 或预校验,别假设输入合法。

### 3.12 显示固定小数位用格式化,但记住它不解决精度

```python
# 显示控制(仅显示层)
f"{0.1+0.2:.2f}"    # '0.30',显示干净
# 但内部仍不精确,后续运算误差会再出
# 真正解决精度要用 int/Decimal,不是格式化
```

格式化(`:.2f`)、`round` 控制 float 显示位数,适合"展示给用户",但绝不能当作"精度解决方案"。内部 float 值不变,精度问题依旧潜伏。

---

## 4. 原理

本章讲清 `float` 背后的 IEEE 754 机制:二进制浮点为何无法精确表示十进制小数、64 位的结构(符号/指数/尾数)、精度与范围的来源、特殊值 inf/nan 的编码、误差累积与大数吞噬的成因。这些是"float 为何如此"的根基,也是规避方案的依据。

### 4.1 IEEE 754 双精度结构(需理解,详述)

`float` 底层是 IEEE 754 双精度浮点数(double),共 64 位,分三段:

```
| 1 位符号 | 11 位指数 | 52 位尾数 |
```

- **符号位(sign)**:1 位,0 正 1 负。
- **指数(exponent)**:11 位,偏置值 1023,表示 2 的幂次。范围约 -1022 ~ +1023,决定了 float 的数值范围(约 ±1.8×10³⁰⁸)。
- **尾数(mantissa/significand)**:52 位,存有效数字。因规格化数隐含最高位 1,实际精度 53 位,约 15~17 位十进制有效数字。

一个 float 值 = `(-1)^符号 × 1.尾数 × 2^指数`(规格化形式)。例如 `0.5` = `1.0 × 2⁻¹`,`3.0` = `1.5 × 2¹`。

```python
# 用 as_integer_ratio 和 hex 窥探内部
print((0.5).as_integer_ratio())   # (1, 2) = 1/2 = 1.0 × 2⁻¹
print((0.5).hex())                # '0x1.0000000000000p-1' = 1.0 × 2⁻¹
print((3.0).hex())                # '0x1.8000000000000p+1' = 1.5 × 2¹
```

`0x1.8p+1` 解读:`1.8`(十六进制,即 1.5 十进制)× `2¹` = 3.0。这套表示直观对应 IEEE 754 的"1.尾数 × 2^指数"结构。

**这套结构的核心限制**:尾数 52 位(53 位有效)决定了**精度上限 ~15~17 位十进制**。超过这个位数的数字无法精确存储,会被截断。这就是 §2.2"大数吞噬小数"的根源——`1e16` 用满了 53 位有效位,再加 1 进不到有效位,被舍掉。

```python
print(f"{1e16:.0f}")      # 10000000000000000(17 位,接近精度上限)
print(1e16 + 1)           # 1e+16 —— 1 被舍掉
print(f"{1e15 + 1:.0f}")  # 1000000000000001 —— 1e15 还能容纳 +1
```

`1e15 + 1` 能精确(15 位有效,未超限),`1e16 + 1` 不能(16 位有效,接近上限,1 被舍)。理解 53 位有效数字的精度上限,就能预判何时会发生精度丢失。

### 4.2 为何 0.1 无法精确表示(需理解,详述)

float 用**二进制**表示数值,而二进制只能精确表示"分母是 2 的幂"的小数(0.5、0.25、0.125、0.0625...),其余十进制小数(0.1、0.2、0.3、0.7...)在二进制下是**无限循环小数**,存储时被截断到 52 位尾数,产生舍入误差。

以 `0.1` 为例,转成二进制:`0.1 = 0.0001100110011001100...`(0011 无限循环)。这就像十进制下 `1/3 = 0.3333...` 无法精确表示一样——0.1 在二进制下是无限循环的。52 位尾数只存有限位,必然截断:

```python
# 0.1 的真实存储值
print(f"{0.1:.20f}")    # 0.10000000000000000555 —— 略大于 0.1
# 用 as_integer_ratio 看精确分数
print((0.1).as_integer_ratio())
# (3602879701896397, 36028797018963968) —— 0.1 实际 = 3602879701896397 / 2^55
```

`0.1` 的实际存储值是 `3602879701896397 / 2^55 = 0.100000000000000005551...`,略大于 0.1。同理 `0.2` 略偏差。两个略偏的数相加,误差暴露为 `0.30000000000000004`:

```python
print(f"{0.1:.20f}")    # 0.10000000000000000555(略大)
print(f"{0.2:.20f}")    # 0.20000000000000001110(略大)
print(f"{0.3:.20f}")    # 0.29999999999999998890(略小)
# 0.1+0.2 的实际值 ≈ 0.30000000000000004,与 0.3 的存储值(略小)不等
```

这与 C/Java/JavaScript 完全一致——所有 IEEE 754 实现的 0.1 都是同一个不精确值,**这不是任何语言的 bug,而是二进制浮点的固有特性**。十进制小数(人习惯的)与二进制浮点(计算机存储的)之间的不可通约,是问题的数学本质。

**哪些小数能精确表示**?分母是 2 的幂的:`0.5`、`0.25`、`0.125`、`0.0625`、`0.75`(3/4)、`0.375`(3/8)等。这些 `as_integer_ratio` 给出干净的小分母:

```python
print((0.5).as_integer_ratio())    # (1, 2)    —— 干净,2 的幂分母
print((0.25).as_integer_ratio())   # (1, 4)
print((0.75).as_integer_ratio())   # (3, 4)
print((0.1).as_integer_ratio())    # (3602879701896397, 36028797018963968) —— 巨大,不精确
```

`0.5` 干净(`1/2`)、`0.1` 不干净(巨大分母)。这解释了"为什么有些小数运算恰好干净、有些出现长串误差"——取决于参与运算的数是否恰好是 2 的幂分母。

**解决之道**:既然二进制浮点无法精确表示十进制小数,需要精确十进制时改用**十进制存储**——`decimal.Decimal`(十进制浮点,存 0.1 就是 0.1)或 `int` 存最小单位(分母=1,纯整数)。这就是 §2.6 规避方案的原理依据:换一种"能精确表示所需数值"的存储方式。

### 4.3 精度范围与 inf/nan 的编码

**范围**:指数 11 位(偏置 1023)给出约 ±1.8×10³⁰⁸ 的范围。超出上限 → `inf`,低于下限(下溢)→ 0。最小正正规数约 2.2×10⁻³⁰⁸,次正规数下到约 5×10⁻³²⁴。

```python
import sys
print(sys.float_info.max)     # 1.7976931348623157e+308 —— 最大有限值
print(sys.float_info.min)     # 2.2250738585072014e-308 —— 最小正规正数
print(sys.float_info.epsilon) # 2.220446049250313e-16 —— 1.0 与下一个可表示值的差(机器epsilon)
print(1e400)                  # inf —— 超出上限变 inf
print(1e-400)                 # 0.0 —— 下溢变 0
```

`sys.float_info` 暴露 float 的各种界限。`epsilon`(2.22e-16)是"1.0 与最近可区分值的差",代表 float 的相对精度极限——这就是 `math.isclose` 默认 `rel_tol=1e-9` 的参照(远大于 epsilon,留足容差)。

**inf 与 nan 的编码**:IEEE 754 用"指数全 1"的特殊编码表示这两个特殊值:

- 指数全 1、尾数全 0 → `inf`(符号位定正负)。
- 指数全 1、尾数非 0 → `nan`。

这解释了 inf/nan 为何不遵循普通算术规则——它们是"特殊编码"而非普通数值。nan 的"不等于自身"特性是 IEEE 754 标准有意规定的:为了让"`x != x` 检测 nan"成为可能(即 `math.isnan` 的底层依据,虽然 Python 用专门指令实现)。inf 参与运算的规则(如 `inf - inf = nan`、`inf + 1 = inf`)也是 IEEE 754 明确定义的,反映"无穷与有限数的数学关系"。

```python
import math
print(math.inf - math.inf)   # nan —— 无穷减无穷未定义
print(math.inf / math.inf)   # nan
print(math.inf + 1)          # inf —— 无穷吞有限
print(1 / math.inf)          # 0.0
```

理解 inf/nan 是"特殊编码"而非普通数,就理解了它们的奇特算术行为,也理解了为何要用 `math.isinf`/`math.isnan` 专门检测(而非 `==`)。

### 4.4 误差累积与大数吞噬的成因

**误差累积**:单次运算误差极小(约 1e-17 量级),但反复累加会放大。10 次 `0.1` 累加误差累积到 `1e-16`,导致 `sum([0.1]*10) != 1.0`:

```python
print(sum([0.1]*10))         # 0.9999999999999999 —— 误差累积
print(sum([0.1]*10) - 1.0)   # -1.1102230246251565e-16 —— 累积残差
```

每次 `+= 0.1` 都引入一次舍入误差,累积 N 次后误差约 N × epsilon。`math.fsum` 用更高内部精度(80 位扩展或精确求和算法)累加,避免中间舍入,显著降低累积误差:

```python
import math
print(math.fsum([0.1]*10))   # 1.0 —— 高精度求和,无累积误差
```

`math.fsum` 维护一个"部分和"列表,用精确的整数运算跟踪舍入,最终给出最接近真值的结果。这是处理大量 float 求和的标准做法。

**大数吞噬**:当数值大到用满 53 位有效数字时,加上一个相对极小的增量,该增量落不到有效位,被舍掉:

```python
print(1e16 + 1.0)            # 1e+16 —— 1 落不到有效位,被舍
print(1e16 + 1.0 == 1e16)    # True
```

`1e16` 的二进制表示已占满 53 位有效位,`+1` 的增量小于"该量级下可分辨的最小步"(ULP,unit in the last place),被舍入丢失。ULP 随数值变大而变大——`1e16` 的 ULP 是 2,`1e0` 的 ULP 是 2⁻⁵²。这是浮点"绝对精度固定(53 位)、相对精度固定(epsilon)、绝对分辨率随量级变化"的特性。需要大数精度时,改用 `int`(任意精度)或 `Decimal`(可控精度)。

理解误差累积与大数吞噬的成因,就理解了"为何 float 累加会偏、大数运算会丢增量",从而在精度敏感场景主动选用更稳的算法或类型。

---

## 5. 总结

### 5.1 本文内容回顾

- **float 定义**:Python 浮点数类型,底层 IEEE 754 双精度(64 位),不可变,可哈希;有范围限制(±1.8×10³⁰⁸)与精度限制(~15~17 位有效数字)。
- **int vs float**:离散计数用 int、连续量用 float、金额等精度敏感用 int 存最小单位或 Decimal,绝不用 float 存金额。
- **字面量**:含 `.`/`e` 即 float,科学计数法,下划线分隔;inf/nan 用 `float()`/`math` 构造无字面量。
- **精度误差(核心)**:二进制无法精确表示多数十进制小数(0.1 是无限循环二进制),`0.1+0.2!=0.3`,累加有累积误差,大数吞噬小数;误差是 IEEE 754 共性非 Python bug。
- **round 银行家舍入**:逢 5 向偶数舍入(`round(2.5)=2`),且受精度干扰(`round(2.675,2)=2.67`),不能"修好"精度;传统四舍五入用 Decimal ROUND_HALF_UP。
- **inf/nan**:inf 超范围值,nan 表无意义运算结果;nan 不等于自身,判 nan 用 `math.isnan`,混入数据毒化计算需先清洗。
- **float 方法**:`as_integer_ratio`(看精确分数,揭示 0.1 不精确)、`is_integer`(判整数值)、`hex`(看内部表示)、`float()` 构造(失败抛 ValueError)。
- **精度规避方案**:int 存最小单位(金额)、Decimal(精确十进制,须字符串构造、可控舍入)、Fraction(精确分数)、math.isclose(容差比较);四方案按场景选型。
- **转换与隐式提升**:`int(3.9)` 截断(向零)非四舍五入;`/` 永远 float、`//` 地板除(有 float 返回 float);int 与 float 混算隐式提升为 float。
- **原理**:IEEE 754 双精度结构(1 符号 + 11 指数 + 52 尾数,53 位有效决定 ~15~17 位精度);0.1 在二进制下无限循环被截断(分母非 2 的幂的小数都不精确);inf/nan 用指数全 1 的特殊编码;误差累积源于每次运算的舍入放大、math.fsum 用高精度求和规避;大数吞噬因 53 位有效位用满后小增量落不到有效位。
- **最佳实践**:金额不用 float、float 比较用 isclose、round 是银行家且不能修精度、Decimal 用字符串构造、累加用 fsum、清洗 nan、大数用 int/Decimal、取整明语义、除法 // vs /、科学计算用 float、转换捕获 ValueError、格式化仅显示层不解决精度。

### 5.2 读完本文你应能掌握

- 说明 `float` 的 IEEE 754 双精度结构(符号/指数/尾数)与精度(~15~17 位)、范围限制。
- 解释 `0.1 + 0.2 != 0.3` 的根本原因(二进制无法精确表示 0.1),指出这是所有 IEEE 754 实现的共性而非 Python bug。
- 选用正确方案规避精度问题:金额用 int 存分、精确十进制用 Decimal(字符串构造)、分数用 Fraction、float 比较用 math.isclose。
- 说明 `round` 的银行家舍入规则及其受精度干扰的现象,用 Decimal 实现传统四舍五入。
- 说明 inf/nan 的行为(nan 不等于自身、毒化计算),用 `math.isnan`/`math.isinf` 检测,清洗含 nan 数据。
- 用 `as_integer_ratio`/`is_integer`/`hex` 观察 float 内部,解读结果。
- 说明 `int(3.9)` 是截断非四舍五入,区分 int/round/floor/ceil/trunc 的取整语义。
- 说明 `/`(真除 float)与 `//`(地板除)的返回类型规则,以及 int 与 float 混算的隐式提升。
- 阐述 IEEE 754 结构、0.1 不精确的数学本质、inf/nan 编码、误差累积与大数吞噬的成因。

### 5.3 延伸方向

- **int 类型详解**:int 的任意精度、`int` 存最小单位规避浮点的完整用法,见《int 类型详解》。
- **bool 类型与短路逻辑**:bool 作为 int 子类、真值测试,见《bool 类型与短路逻辑》。
- **类型转换机制**:显式转换(`int()`/`float()` 构造规则)与隐式转换(int→float 提升),见《显式类型转换》《隐式类型转换》。
- **Decimal 与 Fraction 深度**:`decimal` 模块的上下文精度、舍入模式、`Context`、`fractions` 的有理数运算,见标准库专题。
- **科学计算中的浮点**:NumPy 的 float32/float64、向量化浮点运算、`np.isclose`/`np.isnan` 数组级精度处理,见《NumPy 数值计算》专题。
