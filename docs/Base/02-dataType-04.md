---
group:
  title: 【02】基础数据类型和类型系统
  order: 2
order: 4
title: float类型与精度问题
nav:
  title: Python基础
  order: 1
---

# float类型与精度问题

## 1. 介绍

### 1.1 什么是 float

`float`（浮点数）是 Python 中用于表示带小数点的数值类型。当你在代码中写下 `3.14`、`0.5`、`1e5` 时，Python 都会创建一个 `float` 对象。它广泛用于科学计算、金额处理、百分比、坐标等场景——可以说，只要涉及"不是整数"的数值，就绕不开 `float`。

Python 的 `float` 底层采用 IEEE 754 双精度浮点数标准（C 语言中的 `double`），用 64 位二进制存储一个数值。这个标准决定了 `float` 能表示的范围（约 ±1.8e308）和精度（约 15~17 位有效十进制数字），也直接导致了一个所有 Python 开发者都必须面对的问题——精度误差。

### 1.2 最简示例

先来看 `float` 最基本的用法：

```python
# 标准小数
print(3.14)          # 3.14
print(type(3.14))    # <class 'float'>

# 即便值是整数，写了小数点就是 float
print(type(1.0))     # <class 'float'>
```

再来看一个"经典名场面"——精度误差：

```python
print(0.1 + 0.2)           # 0.30000000000000004
print(0.1 + 0.2 == 0.3)    # False
```

`0.1 + 0.2` 不等于 `0.3`，这不是 bug，而是 IEEE 754 浮点数表示法的必然结果。后面会详细解释原因和应对方案。

### 1.3 在 Python 类型体系中的定位

```text
Python 数值类型层次
├── int      —— 任意精度整数，没有溢出问题
├── float    —— IEEE 754 双精度浮点数（本篇主题）
├── complex  —— 复数（实部 + 虚部，均为 float）
├── bool     —— 布尔值（int 的子类，True=1, False=0）
└── 标准库扩展
    ├── decimal.Decimal   —— 十进制浮点数，精度可控
    └── fractions.Fraction —— 精确有理数（分数）
```

`float` 是 Python 数值类型中唯一一个"有限精度"的浮点类型——`int` 可以无限大，`Decimal` 可以自定义精度，`Fraction` 是精确分数，只有 `float` 受限于 IEEE 754 的 64 位表示。

---

## 2. 核心内容

### 2.1 float 的字面量写法

Python 提供了多种字面量语法来书写 `float`，掌握它们能让代码更清晰。

#### 2.1.1 标准小数写法

最直接的写法就是带小数点的数字：

```python
print(3.14)          # 3.14
print(1.0)           # 1.0 —— 写了小数点就是 float，即便值是整数
```

小数点前后的数字可以省略，但两者至少保留一个：

```python
print(3.)            # 3.0 —— 小数点后数码可省略
print(.5)            # 0.5 —— 小数点前数码可省略
```

#### 2.1.2 科学计数法

科学计数法用 `e` 或 `E` 表示"乘以 10 的 N 次方"，适合表示很大或很小的数：

```python
print(2e3)           # 2000.0 —— 2 × 10³
print(2E3)           # 2000.0 —— E 大小写均可
print(1.5e-3)        # 0.0015 —— 1.5 × 10⁻³
print(3.14e2)        # 314.0 —— 3.14 × 10²
```

科学计数法产出的始终是 `float`，即使值看起来是整数（如 `2e3` 得到 `2000.0` 而非 `2000`）。

#### 2.1.3 下划线分隔（Python 3.6+）

为了提升可读性，可以在数字字面量中用下划线做分隔符：

```python
print(1_000.5)               # 1000.5
print(6.022_140_76e23)       # 阿伏伽德罗常数，更易读
```

下划线会被 Python 忽略，纯粹是为了让人眼更容易识别位数。

#### 2.1.4 特殊浮点值：inf 和 nan

`float` 有三个字面量语法无法直接表示的特殊值：正无穷、负无穷和非数（NaN）。它们需要通过 `float()` 函数或 `math` 模块构造：

```python
import math

# 正无穷和负无穷
print(float('inf'))          # inf
print(float('-inf'))         # -inf
print(math.inf)              # inf —— math 常量更清晰
print(-math.inf)             # -inf

# 非数（Not a Number）
print(float('nan'))          # nan
print(math.nan)              # nan
```

这些特殊值会在后续章节详细讲解。

#### 2.1.5 用 float() 构造

除了字面量，还可以用 `float()` 函数从其他类型创建 `float`：

```python
print(float(3))              # 3.0 —— int → float
print(float("3.14"))         # 3.14 —— str → float
print(float("1e5"))          # 100000.0 —— 含指数的字符串
print(float(True))           # 1.0 —— bool → float（True=1, False=0）
```

**注意事项**：`float()` 只认小数点 `.`，不认逗号 `,`，传入不合法的字符串会抛 `ValueError`：

```python
# float("abc")      # ValueError: could not convert string to float: 'abc'
# float("3,14")     # ValueError: 不认逗号小数点
```

处理外部输入时，需要用 `try/except` 捕获异常：

```python
try:
    value = float("abc")
except ValueError:
    print("无法解析为浮点数")
```

---

### 2.2 精度误差现象

这是 `float` 使用中最常遇到的问题，理解它需要先接受一个事实：**并非所有十进制小数都能被二进制浮点数精确表示**。

#### 2.2.1 经典现象：0.1 + 0.2 != 0.3

```python
print(0.1 + 0.2)              # 0.30000000000000004
print(0.1 + 0.2 == 0.3)       # False
print(0.1 + 0.2 - 0.3)        # 5.551115123125783e-17 —— 极小残差
```

不止这一组，很多"看起来应该相等"的运算都会出问题：

```python
print(1.1 + 2.2)              # 3.3000000000000003
print(0.1 * 3)                # 0.30000000000000004
```

但也有恰好"干净"的情况：

```python
print(0.7 - 0.1)              # 0.6 —— 恰好干净
```

为什么有时有误差有时没有？因为误差的出现取决于参与运算的数值的二进制表示是否精确、以及运算后舍入方向是否恰好抵消。

#### 2.2.2 用 repr 和格式化看真相

直接 `print` 看到的 `0.1` 很有欺骗性——Python 的 `repr()` 使用了"最短表示"算法，会找到最接近实际存储值的最短十进制字符串来显示。要看真实存储值，需要用高精度格式化：

```python
print(repr(0.1))              # 0.1 —— repr 用最短表示算法
print(f"{0.1:.20f}")          # 0.10000000000000000555 —— 实际略大于 0.1
print(f"{0.2:.20f}")          # 0.20000000000000001110 —— 实际略大于 0.2
print(f"{0.3:.20f}")          # 0.29999999999999998890 —— 实际略小于 0.3
```

可以看到，`0.1` 的实际存储值比理想值大一点，`0.2` 也偏大，而 `0.3` 反而偏小。所以 `0.1 + 0.2` 的结果是 "偏大 + 偏大" ≈ 0.300...0004，大于了偏小的 `0.3`，比较时就不等了。

#### 2.2.3 累积误差

单次运算的误差极小（在 1e-17 量级），但如果在循环中反复累加，误差会逐步放大：

```python
total = 0.0
for _ in range(10):
    total += 0.1
print(total)                  # 0.9999999999999999 —— 不是 1.0!
print(total == 1.0)           # False
```

每次 `+= 0.1` 都引入一次舍入误差，10 次之后就累积成了可见的偏差。这在金融场景中是不可接受的——1000 笔 0.1 元的交易加起来不是 100 元，而是 99.99999...元。

**注意**：Python 3.12+ 改进了 `sum()` 内置函数的浮点求和精度，使用更优的算法：

```python
print(sum([0.1] * 10))        # 1.0（3.12+）或 0.9999999999999999（旧版本）
```

但 `+=` 循环的累积误差依然存在，因为每次赋值都会做舍入。

#### 2.2.4 大数吞噬小数

当一个 `float` 的值非常大时，它的最小可分辨单位也会变大，导致小的增量被"吞掉"：

```python
big = 1e16
print(big + 1.0)              # 1e+16 —— 1.0 被"吞掉"了
print(big + 1.0 == big)       # True

# 1e15 还能容纳 +1
print(f"{1e15 + 1:.0f}")      # 1000000000000001
```

`1e16` 已经达到了 53 位有效数字的极限，加 `1` 后的值落不到可表示的精度位上，直接被舍掉了。

#### 2.2.5 math.fsum 高精度求和

当需要对浮点数列表求和且要求高精度时，用 `math.fsum` 代替 `sum` 或 `+=` 循环：

```python
import math
print(math.fsum([0.1] * 10))  # 1.0 —— 无累积误差
```

`math.fsum` 内部使用 Shewchuk 算法跟踪多个部分和，能在最终舍入时最大限度地减少误差。适合对精度敏感的求和场景。

---

### 2.3 IEEE 754 双精度原理

要真正理解精度误差，需要了解 `float` 在计算机内部是如何存储的。

#### 2.3.1 64 位结构

IEEE 754 双精度浮点数用 64 位二进制存储一个数值，分为三部分：

```text
┌─┬──────────┬───────────────────────────────┐
│S│  Exponent│         Mantissa (52 bits)     │
│1│  11 bits │                               │
└─┴──────────┴───────────────────────────────┘
 S = 符号位 (0=正, 1=负)
 Exponent = 指数 (偏置 1023)
 Mantissa = 尾数 (规格化时隐含最高位 1，实际 53 位有效)
```

一个 `float` 的数值等于：

```text
(-1)^S × 1.Mantissa × 2^(Exponent - 1023)
```

可以用 `hex()` 方法看到 `float` 的内部结构：

```python
print((0.5).hex())    # 0x1.0000000000000p-1 = 1.0 × 2⁻¹ = 0.5
print((3.0).hex())    # 0x1.8000000000000p+1 = 1.5 × 2¹ = 3.0
```

`0x1.8p+1` 解读：`1.8` 是十六进制（等于十进制 1.5），`p+1` 表示 ×2¹，所以 1.5 × 2 = 3.0。

#### 2.3.2 53 位有效数字 → 15~17 位十进制精度

规格化双精度有 53 位有效二进制数字（52 位尾数 + 1 位隐含的 1）。53 位二进制约等于 log₁₀(2⁵³) ≈ 15.95 位十进制数字，所以说 `float` 的精度大约是 15~17 位十进制有效数字。

```python
print(f"{1e16:.0f}")           # 10000000000000000（17 位，接近精度上限）
print(1e16 + 1)                # 1e+16 —— 1 被舍掉
print(f"{1e15 + 1:.0f}")       # 1000000000000001 —— 1e15 还能容纳 +1
```

#### 2.3.3 0.1 为何无法精确表示

十进制的 `0.1` 在二进制下是无限循环小数：`0.0001100110011...`，就像十进制中 `1/3 = 0.333...` 一样。由于尾数只有 52 位，必须截断，因此存储的是一个近似值：

```python
print(f"{0.1:.20f}")           # 0.10000000000000000555 —— 略大于 0.1
print((0.1).as_integer_ratio())
# (3602879701896397, 36028797018963968) = 3602879701896397 / 2^55
```

这说明 `0.1` 的实际存储值是一个分母为 2⁵⁵ 的精确分数，它非常接近 0.1，但不等于 0.1。

反过来，分母是 2 的幂的小数可以精确表示：

```python
print((0.5).as_integer_ratio())     # (1, 2)     —— 2 的幂分母，干净
print((0.25).as_integer_ratio())    # (1, 4)
print((0.125).as_integer_ratio())   # (1, 8)
print((0.1).as_integer_ratio())     # (3602879701896397, 36028797018963968) —— 巨大分母
```

#### 2.3.4 float 的范围与 sys.float_info

`sys` 模块提供了查看 `float` 各项极限值的方式：

```python
import sys

print(sys.float_info.max)      # 1.7976931348623157e+308 —— 最大值
print(sys.float_info.min)      # 2.2250738585072014e-308 —— 最小正规格化值
print(sys.float_info.epsilon)  # 2.220446049250313e-16 —— 机器 epsilon

print(1e400)                   # inf —— 超出上限变成无穷
print(1e-400)                  # 0.0 —— 超出下限变成 0（下溢）
```

`sys.float_info.epsilon` 是"1.0 与比它大的下一个可表示 float 之差"，也叫机器 epsilon。它量化了 `float` 在 1.0 附近的精度极限。

---

### 2.4 round() 与舍入问题

#### 2.4.1 round 基本用法

`round()` 用于对浮点数四舍五入到指定小数位：

```python
print(round(3.14159, 2))      # 3.14
print(round(3.14159, 4))      # 3.1416
```

不传第二个参数时，`round` 返回整数（但类型是 `int`）：

```python
print(round(3.7))             # 4
print(type(round(3.7)))       # <class 'int'>
```

#### 2.4.2 银行家舍入（round half to even）

Python 3 的 `round()` 采用"银行家舍入"策略（round half to even）——当待舍入位正好是 5 时，向最近的**偶数**舍入，而不是简单地"向上进一"：

```python
print(round(2.5))             # 2 —— 向偶数（不是 3!）
print(round(3.5))             # 4 —— 向偶数
print(round(0.5))             # 0
print(round(1.5))             # 2
```

这个设计的目的是在一大批数据的舍入中减少系统性偏差——传统的"五入"会让结果系统性地偏大。

#### 2.4.3 round(2.675, 2) 为何是 2.67

一个常见的困惑是 `round(2.675, 2)` 得到 `2.67` 而不是 `2.68`：

```python
print(round(2.675, 2))        # 2.67（用户期望 2.68）
print(f"{2.675:.20f}")        # 2.67499999999999982236 —— 实际略小
```

原因：`2.675` 的实际存储值略小于 `2.675`（约 `2.67499...`），所以在 `round` 看来，第五位小数不是"正好 5"，而是"接近 5 但偏小"，自然向下舍入到 `2.67`。这是精度误差干扰舍入的典型案例。

#### 2.4.4 round 不解决精度问题

`round` 返回的仍是 `float`，它只是对显示做了截断，不改变底层存储：

```python
print(type(round(3.14, 2)))   # <class 'float'>
x = round(0.1 + 0.2, 2)      # 0.3（显示）
print(x == 0.3)               # True（恰好）
print(x * 3)                  # 0.8999999999999999 —— round 后再运算又冒误差
```

`round` 后的值在这个特定案例中恰好等于 `0.3`，但一旦再次参与运算，精度误差又会浮现。

#### 2.4.5 取整方式对比

除了 `round`，Python 还有多种取整方式，它们的语义不同：

```python
import math

# 正数
print(int(3.9))               # 3（截断，向零）
print(round(3.9))             # 4（四舍五入，银行家规则）
print(math.floor(3.9))        # 3（向下取整）
print(math.ceil(3.9))         # 4（向上取整）
print(math.trunc(3.9))        # 3（向零截断，等同 int）

# 负数差异更明显
print(int(-3.9))              # -3（向零截断）
print(math.floor(-3.9))       # -4（向负无穷）
print(math.ceil(-3.9))        # -3（向正无穷）
```

| 方式 | 方向 | 正数 3.9 | 负数 -3.9 | 返回类型 |
|------|------|---------|----------|---------|
| `int(x)` | 向零截断 | 3 | -3 | `int` |
| `math.trunc(x)` | 向零截断 | 3 | -3 | `int` |
| `math.floor(x)` | 向下（负无穷） | 3 | -4 | `int` |
| `math.ceil(x)` | 向上（正无穷） | 4 | -3 | `int` |
| `round(x)` | 四舍五入（银行家） | 4 | -4 | `int` |

---

### 2.5 特殊值：inf 和 nan

#### 2.5.1 inf（无穷）

`inf` 表示无穷大，在溢出或特殊运算中产生：

```python
import math

print(math.inf)               # inf
print(-math.inf)              # -inf
print(float('inf'))           # inf
print(1e400)                  # inf —— 超出最大值
```

**inf 的运算规则**：

```python
inf = math.inf
print(inf > 1e308)            # True
print(inf + 1)                # inf —— 无穷加有限仍无穷
print(inf * 2)                # inf
print(1 / inf)                # 0.0
print(inf + inf)              # inf
```

**注意**：Python 中浮点除以零会抛 `ZeroDivisionError`，不会返回 `inf`（某些语言会返回 `inf`）：

```python
# print(1.0 / 0.0)   # ZeroDivisionError!
```

#### 2.5.2 nan（非数）

`nan`（Not a Number）表示"不是有效数值"的结果，通常来自无定义的数学运算：

```python
print(math.nan)               # nan
print(float('nan'))           # nan
```

**nan 的核心特性：不等于任何值，包括自身**——这是 IEEE 754 的设计：

```python
nan = math.nan
print(nan == nan)             # False! —— nan 不等于自己
print(nan != nan)             # True
print(nan > 0, nan < 0)       # (False, False) —— 与任何数比较都 False
```

**判断 nan 的唯一可靠方式**是用 `math.isnan()`：

```python
x = math.nan

# 错误：nan 永远不等于 nan，这个判断永远 False
if x == math.nan:
    print("是 nan（不会走到这里）")

# 正确：用 math.isnan
if math.isnan(x):
    print("是 nan（正确判断）")    # 会打印
```

#### 2.5.3 inf 产生 nan 的运算

某些 `inf` 运算会得到 `nan`：

```python
inf = math.inf
print(inf - inf)              # nan —— 无穷减无穷无意义
print(inf / inf)              # nan
print(0.0 * inf)              # nan
```

#### 2.5.4 nan 的"毒化"效应

`nan` 有一个危险的特性——它会"污染"整个计算链。数据中混入一个 `nan`，所有后续统计结果都会变成 `nan`：

```python
data = [1.0, math.nan, 3.0]
print(sum(data))              # nan —— 一个 nan 毒化整个求和
print(max(data))              # nan —— 排序也乱

# 数据清洗：先剔除 nan
clean = [x for x in data if not math.isnan(x)]
print(sum(clean))             # 4.0
```

在数据分析中，处理 `nan` 是第一步也是最重要的一步——要么剔除，要么填充，但不能无视。

---

### 2.6 float 的常用方法

`float` 对象自带几个实用方法，能帮助你理解其内部表示。

#### 2.6.1 as_integer_ratio()

返回一个 `(分子, 分母)` 元组，精确表示该 `float` 的有理数等价形式：

```python
print((0.5).as_integer_ratio())    # (1, 2) —— 0.5 = 1/2，精确
print((0.25).as_integer_ratio())   # (1, 4)
print((0.75).as_integer_ratio())   # (3, 4)
print((0.1).as_integer_ratio())    # (3602879701896397, 36028797018963968)
```

分母是 2 的幂的小数能给出干净的分数，不能精确表示的小数则给出巨大的分子分母。

#### 2.6.2 is_integer()

判断 `float` 的值是否为整数（注意，类型仍是 `float`）：

```python
print((3.0).is_integer())          # True —— 值是整数（类型仍是 float）
print((3.5).is_integer())          # False
print((0.1).is_integer())          # False
```

**适用场景**：当某个计算结果可能是整数也可能不是，需要做分支处理时，比如判断除法是否整除：

```python
result = 10.0 / 2.0
if result.is_integer():
    print(f"整除，商为 {int(result)}")
else:
    print(f"不能整除，商为 {result}")
```

#### 2.6.3 hex()

返回 `float` 的十六进制字符串表示，能直接看到内部的指数和尾数：

```python
print((1.0).hex())                 # 0x1.0000000000000p+0
print((0.5).hex())                 # 0x1.0000000000000p-1 = 1.0 × 2⁻¹
print((0.1).hex())                 # 0x1.999999999999ap-4
```

`0x1.999999999999ap-4` 解读：尾数 `1.999...a`（十六进制），指数 `-4`，即 `1.6 × 2⁻⁴ ≈ 0.1`。尾数中的 `999...a` 体现了一个"取最接近值"的截断过程。

#### 2.6.4 float() 转换与异常处理

`float()` 能从字符串、整数、布尔值等构造浮点数，但输入不合法时会抛 `ValueError`：

```python
print(float(3))                    # 3.0
print(float("3.14"))               # 3.14
print(float("1e5"))                # 100000.0
print(float("inf"))                # inf
print(float(True))                 # 1.0

# 转换失败抛 ValueError
try:
    float("abc")
except ValueError:
    print("ValueError: 无法解析 'abc'")

try:
    float("3,14")
except ValueError:
    print("ValueError: 不认逗号小数点")
```

处理用户输入时，始终用 `try/except` 包裹 `float()` 调用：

```python
def safe_float(s):
    try:
        return float(s)
    except ValueError:
        return None

print(safe_float("3.14"))    # 3.14
print(safe_float("abc"))     # None
```

---

### 2.7 float 与 int 的转换

#### 2.7.1 int ↔ float 互转

```python
print(float(5))               # 5.0 —— int → float
print(int(3.9))               # 3 —— float → int（截断，向零）
print(int(-3.9))              # -3 —— 向零截断（不是 floor 的 -4）
print(int(3.0))               # 3
```

`int()` 转换是**截断**（向零取整），不是四舍五入。

#### 2.7.2 除法的类型规则

Python 中 `/` 和 `//` 的行为不同，理解它们对类型的影响很重要：

```python
print(8 / 2)                  # 4.0 —— / 真除，永远返回 float
print(8 // 2)                 # 4   —— // 地板除，全 int 返回 int
print(8.0 // 2)               # 4.0 —— // 有 float 参与，返回 float
print(7 / 2)                  # 3.5
print(7 // 2)                 # 3
print(7.0 // 2)               # 3.0
```

`//` 地板除对负数向负无穷取整，与 `int()` 的向零截断不同：

```python
print(-7.0 // 2)              # -4.0 —— 地板除向负无穷
print(int(-7.0 / 2))          # -3   —— int() 向零截断
```

| 运算符 | 语义 | `8 / 2` | `7 / 2` | `-7 / 2` | 返回类型 |
|--------|------|---------|---------|----------|---------|
| `/` | 真除（保留小数） | 4.0 | 3.5 | -3.5 | 始终 `float` |
| `//` | 地板除（向负无穷） | 4 | 3 | -4 | 操作数全 `int` 则 `int`，有 `float` 则 `float` |

#### 2.7.3 隐式类型提升

当 `int` 和 `float` 一起运算时，`int` 会自动提升为 `float`：

```python
print(3 + 0.5)                # 3.5 —— int 提升为 float
print(type(3 + 0.5))          # <class 'float'>
print(2 * 3.0)                # 6.0
print(10 - 2.5)               # 7.5
print(4 ** 0.5)               # 2.0 —— 0.5 是 float，结果 float（开平方）
```

#### 2.7.4 float → str 显示

`float` 转字符串时有多种格式化选项：

```python
print(str(3.14))              # 3.14
print(repr(3.14))             # 3.14（最短表示）
print(f"{3.14159:.2f}")       # 3.14 —— 保留 2 位小数
print(f"{0.1+0.2:.2f}")       # 0.30 —— 格式化"掩盖"显示误差
print(f"{1234567.89:,}")      # 1,234,567.89 —— 千分位分隔
```

格式化字符串可以在显示时"掩盖"精度误差（如 `{0.1+0.2:.2f}` 显示 `0.30`），但底层值没变，比较时仍会出问题。

---

## 3. 最佳实践

### 3.1 精度规避方案

当 `float` 的精度误差影响业务正确性时，有以下四种规避方案。

#### 3.1.1 方案一：int 存最小单位（金额推荐）

对于金额计算，最简单可靠的方法是用整数存储最小单位（如分），避免使用小数：

```python
price_cents = 4999          # 49.99 元 = 4999 分
qty = 3
total_cents = price_cents * qty    # 14997 分，精确
print(f"总计：{total_cents / 100:.2f} 元")   # 149.97 元

# 对比 float 的错误
print(49.99 * 100)          # 4998.999999999999 —— 内部不精确
```

**优点**：整数运算无精度问题，性能好。**适用场景**：金额、积分等"最小单位明确"的数值。

#### 3.1.2 方案二：decimal.Decimal（精确十进制）

`decimal` 模块提供了十进制浮点数，精度可控，是金融场景的标准选择：

```python
from decimal import Decimal, ROUND_HALF_UP, getcontext

a = Decimal('0.1')          # 必须用字符串构造！
b = Decimal('0.2')
print(a + b)                # 0.3 —— 精确
print(a + b == Decimal('0.3'))  # True
```

**关键陷阱**：用 `float` 构造 `Decimal` 会带入精度误差：

```python
print(Decimal(0.1))         # 0.1000000000000000055...（带 float 误差!）
print(Decimal('0.1'))       # 0.1（精确）
```

所以——**始终用字符串构造 Decimal**。

`Decimal` 还能控制精度和舍入方式：

```python
getcontext().prec = 6
print(Decimal('2.675').quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
# 2.68 —— 传统四舍五入
```

#### 3.1.3 方案三：fractions.Fraction（精确有理数）

`Fraction` 表示精确的分数，运算过程中不产生任何精度误差：

```python
from fractions import Fraction

a = Fraction(1, 10)         # 1/10
b = Fraction(2, 10)         # 2/10
print(a + b)                # 3/10 —— 精确
print(a + b == Fraction(3, 10))  # True
print(float(a + b))         # 0.3 —— 需要时转 float
print(Fraction(2, 10))      # 1/5 —— 自动约分
```

**适用场景**：需要精确有理数运算且最终可以接受转回 `float` 显示的场景。

#### 3.1.4 方案四：容差比较（epsilon）

很多时候不需要改变数据类型，只需要在比较时允许一个容差范围：

```python
import math

# 手写容差比较
def almost_equal(a, b, eps=1e-9):
    return abs(a - b) < eps

print(almost_equal(0.1 + 0.2, 0.3))    # True
print(0.1 + 0.2 == 0.3)                # False
```

更推荐使用 `math.isclose()`（Python 3.5+），它同时处理绝对容差和相对容差：

```python
print(math.isclose(0.1 + 0.2, 0.3))           # True
print(math.isclose(1e9 + 1, 1e9))             # True（默认相对容差）
print(math.isclose(1e-9, 1e-12))              # False（相对容差下不算近）
print(math.isclose(1e-9, 0, abs_tol=1e-8))    # True（加绝对容差判接近 0）
```

`math.isclose` 默认使用相对容差 `rel_tol=1e-9`，意思是两个值的差不超过较大值的 1e-9 倍就认为相等。对于接近 0 的数需要配合 `abs_tol` 参数。

#### 3.1.5 四种方案对比

| 方案 | 精度 | 性能 | 适用场景 | 注意事项 |
|------|------|------|---------|---------|
| `int` 存最小单位 | 精确 | 最佳 | 金额、积分 | 最小单位需提前确定 |
| `Decimal` | 精确可控 | 中等 | 金融、财务 | 必须用字符串构造 |
| `Fraction` | 精确 | 较低 | 数学计算 | 无法表示无理数（如 π） |
| 容差比较 | 近似 | 最佳 | 科学计算、比较判断 | 需要选择合理的容差值 |

### 3.2 浮点比较的正确方式

**不推荐**：直接用 `==` 比较 `float`：

```python
# 不推荐 —— 浮点直接比较
if 0.1 + 0.2 == 0.3:
    print("相等")  # 永远不会执行
```

**推荐**：用容差比较或 `math.isclose`：

```python
# 推荐 —— 容差比较
import math

result = 0.1 + 0.2
expected = 0.3
if math.isclose(result, expected):
    print("相等")  # 正确执行
```

### 3.3 常见错误模式及修正

| 错误模式 | 后果 | 修正方式 |
|---------|------|---------|
| `float` 直接 `==` 比较 | 判断失败 | 用 `math.isclose` 或容差比较 |
| 循环 `+= 0.1` 累加 | 累积误差 | 用 `math.fsum` 或 `Decimal` |
| `Decimal(float)` 构造 | 带入精度误差 | 用 `Decimal(str)` 构造 |
| `round()` 处理金额 | 银行家舍入不符预期 | 用 `Decimal` + `ROUND_HALF_UP` |
| 忽略 nan 检查 | 统计结果全部变 nan | 用 `math.isnan` 做数据清洗 |
| 金额用 `float` 存储 | 计算误差 | 用 `int` 存分或 `Decimal` |

---

## 4. 原理补充：IEEE 754 与 Python float

### 4.1 精度误差的根本原因

精度误差的根本原因可以用一句话概括：**十进制小数在二进制中不总是能精确表示**。

就像十进制无法精确表示 `1/3`（只能写 0.333...）一样，二进制也无法精确表示 `1/10`（只能写 0.0001100110011...）。当 Python 把 `0.1` 存为 `float` 时，它存的不是精确的 0.1，而是最接近 0.1 的可表示值，这个值与 0.1 之间有一个极小的差。运算后，这些微小的差可能被放大到可见的程度。

```text
十进制 0.1 → 二进制 0.0001100110011...（无限循环）
             → 截断为 52 位尾数 → 存储值 ≈ 0.10000000000000000555
             → 与理想值 0.1 之间存在约 5.55e-18 的误差
```

### 4.2 为什么不全部改用 Decimal

`Decimal` 虽然精确，但并不是万能替代品：

| 维度 | float (IEEE 754) | Decimal |
|------|------------------|---------|
| 性能 | C 硬件级加速，极快 | 纯 Python 实现，慢 10~100 倍 |
| 精度 | 固定 53 位（~15~17 位十进制） | 可配置，默认 28 位 |
| 数学函数 | `math` 模块全面支持 | 需要额外适配 |
| 适用场景 | 科学计算、图形、通用编程 | 金融、财务、需要十进制精确的场景 |

科学计算中，`float` 的精度通常是够用的，而且性能优势巨大。只有在"精度直接影响业务正确性"的场景（比如金额计算），才需要切换到 `Decimal` 或 `int` 存最小单位。

### 4.3 Python 对 IEEE 754 的封装

Python 的 `float` 在 CPython 中直接映射为 C 语言的 `double`，没有额外封装。这意味着：

- `float` 运算的性能等同于 C 语言 `double` 运算
- 精度行为与 C、Java、JavaScript 等语言完全一致（都遵循 IEEE 754）
- 在不同平台上行为一致（不像某些语言的 `long double` 因平台而异）

Python 额外提供了一些方便的工具来观察和调试 `float` 的内部状态：

```python
import sys, math

x = 0.1

# 查看内部结构
print(x.hex())                    # 0x1.999999999999ap-4
print(x.as_integer_ratio())       # (3602879701896397, 36028797018963968)

# 查看 float 的系统极限
print(sys.float_info.epsilon)     # 2.220446049250313e-16
print(sys.float_info.max)         # 1.7976931348623157e+308
print(sys.float_info.min)         # 2.2250738585072014e-308

# math 模块提供的常量
print(math.inf)                   # inf
print(math.nan)                   # nan
print(math.pi)                    # 3.141592653589793
print(math.e)                     # 2.718281828459045
```

---

## 5. 总结

本文围绕 `float` 类型与精度问题展开，主要介绍了以下内容：

- `float` 的字面量写法（标准小数、科学计数法、下划线分隔、`float()` 构造）及特殊浮点值（`inf`、`nan`）的创建方式
- 精度误差的典型现象：`0.1 + 0.2 != 0.3`、累积误差、大数吞噬小数，以及 `math.fsum` 高精度求和方案
- IEEE 754 双精度原理：64 位结构、53 位有效数字对应 15~17 位十进制精度、二进制无法精确表示所有十进制小数
- `round()` 的银行家舍入规则及其注意事项，五种取整方式的对比
- `inf` 和 `nan` 的特性：`nan` 不等于任何值（含自身）、nan 的"毒化"效应、`math.isnan` 的正确判断方式
- `float` 常用方法：`as_integer_ratio()`、`is_integer()`、`hex()`、`float()` 构造与异常处理
- `float` 与 `int` 的转换规则、除法类型规则、隐式类型提升
- 四种精度规避方案：`int` 存最小单位、`Decimal`、`Fraction`、容差比较（`math.isclose`）
- 浮点比较的正确方式及常见错误模式与修正
