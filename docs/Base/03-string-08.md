---
group:
  title: 【03】字符串介绍
  order: 3
order: 8
title: 占位符精度控制
nav:
  title: Python基础
  order: 1
---

# 占位符精度控制

## 1. 介绍

### 1.1 什么是占位符精度控制

在 Python 中进行字符串格式化时，我们经常需要对输出的数值、字符串等内容进行精度控制——比如限定小数点后保留几位、字符串最大截取长度、数字的千分位分隔格式等。这种在格式化字符串中控制输出精度的方式，就是**占位符精度控制**。

精度控制是字符串格式化功能的核心组成部分，它出现在 Python 的三种主流格式化方式中：

- **f-string（格式化字符串字面量）**：Python 3.6+ 引入的现代格式化语法，如 `f"{value:.2f}"` 表示保留两位小数
- **str.format() 方法**：传统的 `.format()` 格式化方式，如 `"{:.2f}".format(value)`
- **% 格式化（旧式）**：源自 C 语言的 `%` 操作符格式化，如 `"%.2f" % value`

精度控制的典型应用场景包括：

- **金融计算**：金额保留两位小数、精确到分的计算结果展示
- **科学计算**：控制浮点数的有效数字、避免精度误差
- **数据展示**：表格对齐、数字格式化（如千分位）
- **日志记录**：控制输出长度、避免过长的数值占满屏幕
- **用户界面**：固定小数位数、百分比展示、货币格式

```python
# 精度控制在实际场景中的应用示例
price = 1234.567
quantity = 100

# 金融场景：金额保留两位小数
total = price * quantity
print(f"总价: {total:.2f}")  # 输出: 总价: 123456.70

# 科学计算：控制有效数字
pi = 3.141592653589793
print(f"π的近似值: {pi:.4f}")  # 输出: π的近似值: 3.1416

# 数据展示：千分位 + 两位小数
gdp = 1234567890.567
print(f"GDP: {gdp:,.2f}")  # 输出: GDP: 1,234,567,890.57
```

### 1.2 精度控制的基本语法

精度控制的核心是在格式化字符串的**格式规范**中指定精度，其基本语法结构如下：

```
:{填充字符 对齐方式 宽度 , 千分位 . 精度 类型}
```

其中与精度直接相关的是**精度说明符**（precision specifier），其格式为：

- `.数字` — 指定小数精度（对浮点数）
- `.数字` — 指定最大字符宽度（对字符串）

精度说明符的位置在格式规范的**最后**，位于类型说明符之前。例如：

```python
value = 3.1415926

# .2 表示保留两位小数
print(f"{value:.2f}")    # 输出: 3.14
print(f"{value:.4f}")    # 输出: 3.1416
print(f"{value:.10f}")   # 输出: 3.1415926000
```

精度控制涉及的组件较多，本章将逐一展开。首先从最常用的 f-string 精度控制讲起，因为它是最现代、最推荐的写法。

### 1.3 精度控制与格式化方式的关系

在 Python 中，不同的格式化方式对精度控制的语法大致相同，但也有一些细微差异。了解这些差异，有助于我们在不同场景下选择合适的格式化方式。

```python
value = 123.456789

# f-string 方式（推荐）
print(f"{value:.2f}")    # 3.6+ 推荐写法

# format() 方式
print("{:.2f}".format(value))

# % 旧式方式
print("%.2f" % value)
```

三种方式的精度控制语法对比如下：

| 特性 | f-string | format() | % 格式化 |
|------|----------|----------|----------|
| 浮点精度 | `.2f` | `.2f` | `.2f` |
| 字符串截断 | `.5s` | `.5s` | `.5s` |
| 整体宽度 | `>10.2f` | `>10.2f` | `%10.2f` |
| 千分位 | `,.2f` | `,.2f` | 无原生支持 |

从 Python 3.6 开始，f-string 因其简洁性和可读性成为了首选的格式化方式。本篇笔记将围绕 f-string 展开讲解，同时也涵盖另外两种方式的对应写法，确保读者在不同代码库中都能灵活应对。

---

## 2. 核心内容

### 2.1 f-string 精度控制基础

#### 2.1.1 f-string 的基本结构

f-string（formatted string literal）是 Python 3.6 引入的字符串格式化机制，它以 `f` 或 `F` 为前缀，在字符串内部直接嵌入表达式。f-string 的基本语法是：

```python
f"文本 {表达式:格式规范} 文本"
```

其中**格式规范**（format spec）是精度控制的核心所在。格式规范的完整结构如下：

```
[[fill]align][sign][#][0][width][grouping_option][.precision][type]
```

- `fill`：填充字符（可选，用于不足宽度时的填充）
- `align`：对齐方式（`<`, `>`, `^`, `=`）
- `sign`：符号（`+`, `-`, ` `）
- `#`： Alternate form（alternate form）
- `0`：零填充（equivalent to fill='0' and align='='）
- `width`：总宽度
- `grouping_option`：千分位分隔符（`,` 或 `_`）
- `.precision`：精度（小数位数或最大字符数）
- `type`：类型格式化符

精度控制主要涉及 `.precision` 部分，以及与之配合的 `width` 和 `type`。

#### 2.1.2 精度说明符的基本用法

精度说明符（precision specifier）以英文句点 `.` 开头，后跟一个非负整数。它的作用取决于被格式化值的类型：

- **对浮点数**：指定小数点后保留的位数
- **对字符串**：指定最大字符宽度（超长截断）

```python
# 浮点数精度控制
pi = 3.141592653589793

print(f"π保留2位: {pi:.2f}")      # 输出: π保留2位: 3.14
print(f"π保留4位: {pi:.4f}")      # 输出: π保留4位: 3.1416
print(f"π保留0位: {pi:.0f}")      # 输出: π保留0位: 3
print(f"π保留10位: {pi:.10f}")    # 输出: π保留10位: 3.1415926535
```

精度为 `0` 时会显示整数部分，小数点后的 `0` 全部省去。精度 `10` 表示保留小数点后 10 位，不足部分用 `0` 补齐。

```python
# 字符串精度控制
text = "Hello, World!"

print(f"截取5字符: {text:.5s}")    # 输出: 截取5字符: Hello
print(f"截取10字符: {text:.10s}")  # 输出: 截取10字符: Hello, Wor
print(f"截取20字符: {text:.20s}")  # 输出: 截取20字符: Hello, World!
print(f"截取0字符: {text:.0s}")    # 输出: 截取0字符: (空)
```

字符串的精度控制是**最大字符数**，不是固定宽度。如果字符串长度小于精度，则原样显示；如果超过精度，则截断到指定长度。

### 2.2 浮点数精度控制详解

#### 2.2.1 基本精度控制：`.nf` 格式

浮点数精度控制最常见的用法是 `.nf`，其中 `n` 是保留的小数位数，`f` 表示 fixed-point（定点数）格式。

```python
# 基础用法：.nf 格式化浮点数
value = 123.456789

# 保留不同位数
print(f"原始值: {value}")                    # 输出: 原始值: 123.456789
print(f"保留1位: {value:.1f}")               # 输出: 保留1位: 123.5
print(f"保留2位: {value:.2f}")               # 输出: 保留2位: 123.46
print(f"保留3位: {value:.3f}")               # 输出: 保留3位: 123.457
print(f"保留6位: {value:.6f}")               # 输出: 保留6位: 123.456789
print(f"保留10位: {value:.10f}")             # 输出: 保留10位: 123.4567890000
```

**关键点说明**：

1. **四舍五入规则**：Python 使用银行家舍入（round half to even），即遇到中间值时向偶数舍入。例如 `2.5` 舍入到 `2`，`3.5` 舍入到 `4`。这与传统的"四舍五入"略有不同。

```python
# 银行家舍入示例
print(f"{2.5:.0f}")   # 2 (2.5 → 2，因为2是偶数)
print(f"{3.5:.0f}")   # 4 (3.5 → 4，因为4是偶数)
print(f"{4.5:.0f}")   # 4 (4.5 → 4，因为4是偶数)
print(f"{5.5:.0f}")   # 6 (5.5 → 6，因为6是偶数)
```

2. **精度补零**：当精度大于实际小数位数时，会在末尾补零。

```python
value = 3.14
print(f"{value:.1f}")    # 3.1
print(f"{value:.5f}")    # 3.14000 （补两个0）
print(f"{value:.10f}")   # 3.1400000000 （补7个0）
```

3. **精度为0**：显示为整数，小数点不显示。

```python
value = 99.9
print(f"{value:.0f}")    # 输出: 100
print(f"{value:.1f}")    # 输出: 99.9
```

#### 2.2.2 精度控制与宽度控制结合

精度控制经常与宽度控制配合使用，以实现对齐和固定格式输出的效果。

```python
# 精度与宽度结合
price1 = 12.5
price2 = 1234.56
price3 = 9.9

# 每种价格统一宽度为10，保留2位小数
print(f"价格1: {price1:10.2f}")   # 输出: 价格1:      12.50
print(f"价格2: {price2:10.2f}")   # 输出: 价格2:    1234.56
print(f"价格3: {price3:10.2f}")   # 输出: 价格3:       9.90
```

宽度控制的几种对齐方式：

```python
value = 123.456

# 左对齐（默认对字符串，数值默认右对齐）
print(f"{value:<10.2f}")   # 输出: 123.46    (左对齐，宽10)

# 右对齐（数值的默认对齐方式）
print(f"{value:>10.2f}")   # 输出:     123.46 (右对齐，宽10)

# 居中对齐
print(f"{value:^10.2f}")   # 输出:   123.46   (居中，宽10)

# 0 填充（特殊对齐方式）
print(f"{value:010.2f}")   # 输出: 0000123.46 (用0填充到宽度10)
```

**对齐方式说明**：

- `<`：左对齐，填充字符放在右侧
- `>`：右对齐，填充字符放在左侧
- `^`：居中对齐，填充字符均匀分布在两侧
- `=`：符号后的填充（仅对数值），如负号 `-0123.46` 的 `-` 在最左边，0 填充在符号后

```python
# 负数的0填充
value = -123.456
print(f"{value:010.2f}")   # 输出: -00123.46 (负号在最左，0填充在中间)
print(f"{value:>10.2f}")   # 输出:   -123.46 (右对齐时负号在最左)
print(f"{value:=10.2f}")   # 输出: -00123.46 (等号效果同0填充，负号紧贴数字)
```

#### 2.2.3 千分位与精度结合

处理大数值时，千分位分隔符（`,` 或 `_`）可以提高可读性，它常与精度控制结合使用。

```python
# 千分位分隔符
value = 1234567.89123

# 基本的千分位格式化
print(f"{value:,.2f}")    # 输出: 1,234,567.89 (逗号千分位)
print(f"{value:_.2f}")    # 输出: 1_234_567.89 (下划线千分位，Python 3.6+)

# 宽度 + 千分位 + 精度 组合
print(f"{value:15,.2f}")  # 输出:    1,234,567.89 (宽15，右对齐)
print(f"{value:15_.2f}")  # 输出:    1_234_567.89 (宽15，下划线分隔)

# 填充 + 对齐 + 宽度 + 千分位 + 精度
print(f"{value:*>15,.2f}")  # 输出: ****1,234,567.89 (左填充*)
print(f"{value:*^20,.2f}")  # 输出: ****1,234,567.89**** (居中填充*)
```

千分位格式化在实际应用中非常常见，特别是财务报表、数据展示等场景：

```python
# 真实业务场景示例
revenue = 98765432.109
cost = 12345678.999
profit = revenue - cost

print(f"营业收入: {revenue:,.2f}")
print(f"营业成本: {cost:,.2f}")
print(f"毛利润:   {profit:,.2f}")
# 输出:
# 营业收入: 98,765,432.11
# 营业成本: 12,345,678.99
# 毛利润:   86,419,753.12
```

### 2.3 整数精度控制详解

#### 2.3.1 整数的宽度控制

整数本身没有小数位数，但精度控制的概念可以扩展为**最小宽度**控制——即输出整数的最小字符位数，不足时用填充字符补齐。

```python
# 整数宽度控制
num = 42

# 基本宽度控制
print(f"{num:d}")          # 42 （默认，无填充）
print(f"{num:5d}")         #   42 （宽5，右对齐）
print(f"{num:05d}")        # 00042 （宽5，0填充）
print(f"{num:010d}")       # 0000000042 （宽10，0填充）
```

精度说明符在整数格式化中有特殊含义：**表示最小数字位数**，而非小数位数。

```python
# 整数的"精度"——最小位数
num = 42

# 精度控制：最小显示位数
print(f"{num:02d}")      # 42 （2位足够，原样显示）
print(f"{num:05d}")      # 00042 （补足到5位）
print(f"{num:010d}")     # 0000000042 （补足到10位）
```

**注意**：整数格式化中使用 `.precision` 是非标准的，标准做法是直接使用宽度（`width`）。但在一些文档中会看到用 0 来表示最小位数的用法：

```python
# 特殊的0前缀精度（常见但非标准写法）
num = 7
print(f"{num:03d}")    # 007 —— 用03d表示至少3位
# 而不是 f"{num:.3d}"（后者在某些实现中等效于{d，但没有广泛支持）
```

#### 2.3.2 整数与进制的精度控制

整数格式化可以配合进制转换一起使用，此时精度控制仍然有效。

```python
# 整数进制的精度控制
num = 255

# 十六进制
print(f"{num:x}")        # ff
print(f"{num:02x}")      # ff （2位足够）
print(f"{num:04x}")      # 00ff （补足到4位）
print(f"{num:08x}")      # 000000ff （补足到8位）

# 十六进制大写
print(f"{num:X}")        # FF
print(f"{num:08X}")      # 000000FF

# 二进制
print(f"{num:b}")        # 11111111
print(f"{num:08b}")      # 11111111
print(f"{num:016b}")     # 0000000011111111

# 八进制
print(f"{num:o}")        # 377
print(f"{num:06o}")      # 000377
print(f"{num:010o}")     # 0000000377
```

#### 2.3.3 进制前缀的显示控制

使用 `#` 选项可以在十六进制、八进制、二进制的输出前添加 `0x`、`0o`、`0b` 前缀。

```python
# 显示进制前缀
num = 255

# 带前缀的进制输出
print(f"{num:#x}")       # 0xff
print(f"{num:#X}")       # 0xFF
print(f"{num:#o}")       # 0o377
print(f"{num:#b}")       # 0b11111111

# 配合宽度和精度
print(f"{num:#010x}")    # 0x000000ff (宽10，含前缀)
print(f"{num:#012X}")    # 0X00000000FF (宽12，大写)
```

这种带前缀的格式化常用于调试输出、代码生成、数据序列化等场景：

```python
# 调试输出示例
value = 255

print(f"十进制: {value:d}")     # 十进制: 255
print(f"十六进制: {value:#x}")  # 十六进制: 0xff
print(f"二进制: {value:#b}")    # 二进制: 0b11111111

# 内存地址风格输出
print(f"地址: 0x{value:08X}")   # 地址: 0x000000FF
```

### 2.4 字符串精度控制详解

#### 2.4.1 字符串截断：`.ns` 格式

字符串的精度控制表示**最大字符数**，超过这个长度的部分会被截断。

```python
# 字符串截断精度控制
text = "Hello, World!"

# 精度控制就是最大字符数
print(f"截取5字符: {text:.5s}")    # 输出: Hello
print(f"截取10字符: {text:.10s}")  # 输出: Hello, Wor
print(f"截取20字符: {text:.20s}")  # 输出: Hello, World! (长度不足，原样显示)
print(f"截取0字符: {text:.0s}")    # 输出: (空字符串)
```

这个功能在以下场景特别有用：

1. **列表项预览**：长文本的简短预览
2. **表格列宽控制**：限制每列的最大显示宽度
3. **日志截断**：避免过长的日志行
4. **UI 文本截断**：按钮文本、超长标题的省略

```python
# 实际应用场景

# 场景1：商品名称截断（用于列表展示）
products = ["iPhone 15 Pro Max 256GB", "无线蓝牙耳机", "笔记本电脑支架"]

for p in products:
    print(f"商品: {p:.15s}")

# 输出:
# 商品: iPhone 15 Pro
# 商品: 无线蓝牙耳机
# 商品: 笔记本计算

# 场景2：日志消息截断
log_messages = [
    "User logged in successfully from IP 192.168.1.100",
    "Database connection established after 3 retries",
    "Error: Connection refused - service unavailable at port 8080"
]

for msg in log_messages:
    print(f"[LOG] {msg:.40s}")

# 输出:
# [LOG] User logged in successfully from IP
# [LOG] Database connection established after 3
# [LOG] Error: Connection refused - service unav
```

#### 2.4.2 字符串宽度控制与精度结合

字符串也可以指定总输出宽度，与精度控制结合使用。

```python
# 字符串宽度 + 精度控制
text = "Hello"

# 只有精度：截断
print(f"精度5: {text:.5s}")      # Hello (足够，原样)
print(f"精度3: {text:.3s}")      # Hel (截断)

# 只有宽度：右对齐（默认）
print(f"宽度10: {text:10s}")     #      Hello

# 宽度 + 精度：优先截断，再对齐
print(f"宽度10精度5: {text:10.5s}")    # Hello     (截断到5字符，再右对齐)
print(f"宽度10精度3: {text:10.3s}")    # Hel       (截断到3字符，再右对齐)
print(f"宽度10精度10: {text:10.10s}")  # Hello     (精度足够，无截断)

# 左对齐 + 宽度 + 精度
print(f"左对齐10.3: {text:<10.3s}")    # Hel
print(f"右对齐10.3: {text:>10.3s}")    #       Hel
print(f"居中10.3: {text:^10.3s}")      #    Hel
```

**重要理解**：字符串的 `.precision` 是**先截断**再填充对齐。处理的顺序是：

1. 先根据精度（`.ns`）对字符串进行截断
2. 然后将截断后的结果按照指定宽度和对齐方式进行填充

```python
# 处理顺序验证
text = "HelloWorld"

# 精度10，但字符串只有10字符，不截断
print(f"{text:10.10s}")   # HelloWorld (5+5 spacing)
# 输出: HelloWorld (后跟空格到宽度10)

# 精度5，截断到5字符，再右对齐到宽度10
print(f"{text:10.5s}")    #      Hello (5字符 + 5空格)
# 输出:      Hello

# 精度3，截断到3字符，再居中到宽度10
print(f"{text:^10.3s}")   #    Hel
# 输出:    Hel (3字符 + 7空格分布两侧)
```

### 2.5 百分号格式化详解

#### 2.5.1 百分号的产生：`.n%` 格式

在 Python 格式化中， `%` 类型说明符会将数值乘以 100 并格式化为百分数形式。这在统计分析、概率计算、进度展示等场景非常有用。

```python
# 百分号格式化
ratio = 0.8756

# 基本百分号格式化
print(f"{ratio:%}")        # 87.560000% （默认6位小数）
print(f"{ratio:.1%}")      # 87.6% （保留1位小数）
print(f"{ratio:.2%}")      # 87.56% （保留2位小数）
print(f"{ratio:.0%}")      # 88% （四舍五入到整数）
print(f"{ratio:.3%}")      # 87.560% （保留3位小数）
```

**原理说明**：`.%` 的核心是将数值乘以 100，然后加上 `%` 符号。所以在处理时 `0.8756` 变成了 `87.56%`。

```python
# 百分号格式化原理
value = 0.3

print(f"{value:%}")        # 30.000000% (0.3 × 100 = 30)
print(f"{value:.0%}")      # 30% (0.3 × 100，四舍五入)
print(f"{value:.1%}")      # 30.0% (0.3 × 100 = 30.0)
print(f"{value:.2%}")      # 30.00%
print(f"{(1-value):.1%}")  # 70.0% (也可以这样计算剩余比例)
```

#### 2.5.2 百分号与宽度控制

百分号格式化同样可以配合宽度、填充、对齐使用。

```python
# 百分号的宽度控制
completion_rate = 0.756
accuracy = 0.9456

# 基本宽度控制
print(f"完成率: {completion_rate:8.1%}")   # 完成率:   75.6%
print(f"准确率: {accuracy:8.2%}")         #   准确率:   94.56%

# 0 填充
print(f"{completion_rate:08.1%}")         # 075.6%

# 左对齐
print(f"{completion_rate:<10.1%}")         # 75.6%

# 负数的百分号
negative_ratio = -0.25
print(f"{negative_ratio:.1%}")             # -25.0%
print(f"{negative_ratio:08.1%}")           # -025.0%
```

#### 2.5.3 百分号的实际应用场景

```python
# 场景1：数据统计分析
scores = [0.8567, 0.9234, 0.7890, 0.9456]
print("正确率统计:")
for i, s in enumerate(scores, 1):
    print(f"  题目{i}: {s:.1%}")

# 输出:
# 正确率统计:
#   题目1: 85.7%
#   题目2: 92.3%
#   题目3: 78.9%
#   题目4: 94.6%

# 场景2：进度条显示
import time

def progress_bar(task_name, progress):
    """模拟进度条显示"""
    bar_length = 30
    filled = int(bar_length * progress)
    bar = "█" * filled + "░" * (bar_length - filled)
    percentage = progress * 100
    print(f"\r{task_name}: |{bar}| {percentage:5.1f}%", end="", flush=True)

# 模拟进度
for i in range(0, 101, 5):
    progress_bar("下载进度", i / 100)
    time.sleep(0.1)
print()  # 换行

# 场景3：占比计算
total = 150
categories = [45, 60, 30, 15]

print("各分类占比:")
for i, count in enumerate(categories, 1):
    ratio = count / total
    print(f"  分类{i}: {count:3d} ({ratio:5.1%})")

# 输出:
# 各分类占比:
#   分类1:  45 ( 30.0%)
#   分类2:  60 ( 40.0%)
#   分类3:  30 ( 20.0%)
#   分类4:  15 ( 10.0%)
```

### 2.6 科学计数法精度控制

#### 2.6.1 科学计数法格式：`.ne` 和 `.nE`

对于非常大或非常小的数值，科学计数法（scientific notation）可以保持数值的可读性。Python 提供了 `e`（小写）和 `E`（大写）两种科学计数法格式。

```python
# 科学计数法精度控制
values = [123456789, 0.000000123456, 3.14159265358979]

# 小写 e 格式
for v in values:
    print(f"{v:.2e}")   # 科学计数法，2位小数

# 输出（新格式，保留理解）：
# 1.23e+08
# 1.23e-07
# 3.14e+00

# 大写 E 格式
for v in values:
    print(f"{v:.2E}")   # 科学计数法，2位小数

# 输出:
# 1.23E+08
# 1.23E-07
# 3.14E+00

# 不同的精度
v = 123456.789
print(f"{v:.1e}")     # 1.2e+05
print(f"{v:.3e}")     # 1.235e+05
print(f"{v:.6e}")     # 1.234568e+05
print(f"{v:.10e}")    # 1.2345678900e+05
```

**精度说明**：

- 精度 `.n` 控制的是**小数部分的位数**（有效数字）
- 指数部分固定显示 minimum 2 位（如 `+05`），使用更多位时会自动扩展

```python
# 精度与有效数字
v = 0.0000000123456789

print(f"{v:.1e}")    # 1.2e-08
print(f"{v:.3e}")    # 1.235e-08
print(f"{v:.5e}")    # 1.23457e-08
print(f"{v:.10e}")   # 1.2345678900e-08
```

#### 2.6.2 科学计数法与宽度控制

科学计数法同样可以与宽度、填充、对齐控制结合。

```python
# 科学计数法的宽度控制
values = [1.23e-5, 9.87e7, 5.43e0]

for v in values:
    print(f"{v:15.2e}")    # 右对齐，宽15

# 输出:
#     1.23e-05
#     9.87e+07
#     5.43e+00

# 0 填充
for v in values:
    print(f"{v:015.2e}")   # 0填充到宽15

# 输出:
# 000001.23e-05
# 0000009.87e+07
# 0000005.43e+00

# 居中对齐
for v in values:
    print(f"{v:^15.2e}")   # 居中，宽15

# 输出:
#   1.23e-05
#   9.87e+07
#   5.43e+00
```

#### 2.6.3 科学计数法的实际应用

```python
# 场景1：物理常数展示
c = 299792458           # 光速 m/s
h = 6.62607015e-34      # 普朗克常数 J·s

print(f"光速: {c:.2e} m/s")
print(f"普朗克常数: {h:.3e} J·s")

# 场景2：化学数据
avogadro = 6.02214076e23

print(f"阿伏伽德罗常数: {avogadro:.3e} mol⁻¹")

# 场景3：金融大额数值（使用逗号分隔）
national_debt = 3.46e13  # 约34.6万亿美元

print(f"美国国债: ${national_debt:,.2e}")
```

### 2.7 更精确的数字格式化：`.ng` 格式

#### 2.7.1 g 格式的特点

`g` 格式是一种"智能"格式化方式，它会根据数值的大小自动选择**定点表示法**或**科学计数法**。

```python
# g 格式智能选择
values = [0.000012345, 0.12345, 12.345, 1234.5, 123456.78, 12345678.9]

for v in values:
    print(f"原始: {v:20.4g}  科学: {v:20.4e}  定点: {v:20.4f}")

# g 格式自动选择：
# - 小数值用科学计数法
# - 大数值用定点表示法
```

**g 格式的核心规则**：

- 精度 `.n` 表示**有效数字的总位数**
- 对于非常小或非常大的数，自动切换到科学计数法
- 不显示尾随的零

```python
# g 格式的特性
v = 123.456

print(f"{v:.1g}")      # 1e+02 (1位有效数字)
print(f"{v:.2g}")      # 1.2e+02 (2位有效数字)
print(f"{v:.3g}")      # 123 (3位有效数字)
print(f"{v:.4g}")      # 123.5 (4位有效数字)
print(f"{v:.5g}")      # 123.46 (5位有效数字)
print(f"{v:.6g}")      # 123.456 (6位有效数字)

# 不显示尾随零
print(f"{v: .4g}")      #  123.5 (不是 123.50)
print(f"{100:.4g}")     #  100 (不是 100.0)
```

#### 2.7.2 G 格式（基础科学计数法）

`G` 格式与 `g` 相同，但对指数部分使用大写 `E`：

```python
v = 1234567.89

print(f"{v:.4g}")    # 1.235e+06
print(f"{v:.4G}")    # 1.235E+06

v2 = 0.0000123
print(f"{v2:.2g}")   # 1.2e-05
print(f"{v2:.2G}")   # 1.2E-05
```

### 2.8 复数精度控制

#### 2.8.1 复数的格式化

复数在 Python 中表示为 `a + bj`，其中 `a` 是实部，`b` 是虚部。复数的精度控制需要分别指定实部和虚部的格式。

```python
# 复数的精度控制
z = 3.14159265358979 + 2.718281828459045j

# 基本精度
print(f"{z:.2f}")       # (3.14+2.72j) - 两部分都保留2位小数
print(f"{z:.4f}")       # (3.1416+2.7183j)

# 宽度控制
print(f"{z:20.2f}")     #           (3.14+2.72j)
print(f"{z:20.4f}")     #       (3.1416+2.7183j)
```

#### 2.8.2 复数格式化选项

复数格式化还有一些特殊选项：

```python
z2 = -12.345 + 67.89j

# 分离实部和虚部
print(f"{z2.real:.2f}")     # -12.35 (只显示实部)
print(f"{z2.imag:.2f}")     # 67.89 (只显示虚部)

# 负数处理
z3 = -5 - 12j
print(f"{z3:.2f}")          # (-5.00-12.00j) - 虚部负号显示

# 配合格式说明
print(f"{z.real:>10.2f}")   #     -12.35
print(f"{z.imag:>10.2f}")   #      67.89
```

### 2.10 % 格式化（旧式）精度控制

#### 2.10.1 % 格式化概述

虽然 f-string 是 Python 3.6+ 推荐的方式，但 `%` 格式化作为 Python 最古老的字符串格式化语法，至今仍在大量遗留代码中使用。理解 `%m.nf` 这种格式规范，对于维护旧代码和理解 C 语言风格的格式化非常有用。

`%` 格式化的基本语法来源于 C 语言的 `printf` 函数，其格式规范的结构如下：

```
%[flags][width][.precision]type
```

与 f-string 的 `{value:format_spec}` 语法不同，`%` 格式化将格式规范放在 `%` 符号之后，类型字符放在最后。

```python
# % 格式化的基本结构
value = 123.456789

# %m.nf 格式：m 是最小宽度，n 是小数位数
print("%.2f" % value)     # 输出: 123.46
print("%10.2f" % value)   # 输出:    123.46 (宽度10，右对齐)
print("%-10.2f" % value)  # 输出: 123.46    (宽度10，左对齐)
```

#### 2.10.2 `%m.nf` 格式详解

`%m.nf` 是 `%` 格式化中最常用的浮点数精度控制格式，其含义如下：

- **`%`**：格式化起始符
- **`m`**：最小宽度（field width），指定输出字符串的最小字符数
- **`.`**：精度说明符的分隔符
- **`n`**：小数精度，指定小数点后保留的位数
- **`f`**：类型说明符，表示定点数（fixed-point）

```python
# %m.nf 的 m 和 n 含义
value = 12.5

# 只有精度 n，没有宽度 m
print("%.2f" % value)     # 12.50 (省略宽度，只控制精度)

# 同时指定宽度 m 和精度 n
print("%8.2f" % value)    #    12.50 (宽度8，右对齐)
print("%10.2f" % value)   #     12.50 (宽度10，右对齐)
print("%12.2f" % value)   #      12.50 (宽度12，右对齐)

# 精度为0
print("%.0f" % value)     # 13 (四舍五入到整数，不显示小数点)
print("%5.0f" % value)    #    13 (宽度5，整数形式)
```

**m（宽度）和 n（精度）的交互规则**：

1. **当 m > 实际输出宽度时**：用填充字符（默认空格）补齐到宽度 m
2. **当 m <= 实际输出宽度时**：宽度参数被忽略，输出实际需要的宽度
3. **当 n > 实际小数位数时**：在末尾补零
4. **当 n = 0 时**：不显示小数点和小数部分

```python
# m 和 n 的交互
value = 7.5

# 宽度足够的情况
print("%2.2f" % value)    # 7.50 (宽度2不够显示"7.50"，实际输出"7.50")

# 宽度不足的情况
print("%10.2f" % value)   #       7.50 (宽度10，用空格填充)

# 补零情况
value2 = 3.1
print("%8.2f" % value2)   #     3.10 (小数位不足，补零)

# 精度为0
value3 = 7.89
print("%.0f" % value3)    # 8 (四舍五入，无小数部分)
print("%6.0f" % value3)   #      8 (宽度6，无小数部分)
```

#### 2.10.3 % 格式化的标志位（flags）

`%` 格式化支持多个标志位来改变输出格式，这些标志位放在 `%` 和宽度之间：

- **`-`**：左对齐（默认是右对齐）
- **`+`**：显示正负号
- **` ` （空格）**：正数前显示空格，负数显示负号
- **`0`**：用零填充而不是空格（仅对数值类型）
- **`#`**：备用形式（alternate form）

```python
# % 格式化的标志位
value = 123.45

# 左对齐 - 
print("%-10.2f" % value)  # 123.45    (左对齐，宽10)

# 显示正号 +
print("%+10.2f" % value)  #   +123.45 (宽度10，显示+号)

# 空格标志位
print("% 10.2f" % value)  #   123.45 (正数前有空格)

# 零填充 0
print("%010.2f" % value)  # 000123.45 (用0填充到宽度10)
print("%+010.2f" % value) # +00123.45 (正号 + 零填充)

# 负数的处理
value2 = -123.45
print("%10.2f" % value2)  #   -123.45
print("%010.2f" % value2) # -000123.45

# # 备用形式（对f类型，强制显示小数点）
print("%#.0f" % 10)       # 10. (即使精度为0也显示小数点)
print("%#.1f" % 10.0)     # 10.0
```

#### 2.10.4 % 格式化与不同类型

除了 `%m.nf` 之外，`%` 格式化还支持其他类型，这些类型也可以配合宽度和精度使用：

```python
# 整数格式化 %m.nd（n 实际被忽略，但语法允许）
value = 42

print("%d" % value)       # 42
print("%5d" % value)      #    42 (宽度5，右对齐)
print("%05d" % value)     # 00042 (零填充)
print("%+5d" % value)     #   +42 (显示正号)

# 字符串格式化 %m.ns（n 是最大字符数）
text = "Hello, World!"

print("%s" % text)        # Hello, World!
print("%20s" % text)      #      Hello, World! (宽度20，右对齐)
print("%-20s" % text)     # Hello, World!       (宽度20，左对齐)
print("%.5s" % text)      # Hello (截断到5字符)
print("%20.5s" % text)    #               Hello (截断后右对齐)

# 百分号格式化 %m.n% （精度控制小数位数）
ratio = 0.8756

print("%.1%%" % ratio)    # 87.6% (1位小数)
print("%8.2%%" % ratio)   #   87.56% (宽度8，2位小数)

# 科学计数法 %m.ne
value = 123456.789

print("%.2e" % value)     # 1.23e+05
print("%12.2e" % value)   #    1.23e+05 (宽度12)

# 十六进制 %m.nx
value = 255

print("%x" % value)       # ff
print("%02x" % value)     # ff (2位足够，忽略前导零)
print("%04x" % value)     # 00ff (补零到4位)
print("%#06x" % value)    # 0x00ff (带0x前缀)
```

#### 2.10.5 %m.nf 与 f-string 的对应关系

在实际编码中，我们经常需要在 `%` 格式化和 f-string 之间进行转换。以下是常见场景的对照表：

| 功能 | % 格式化 | f-string |
|------|----------|----------|
| 保留2位小数 | `"%.2f" % value` | `f"{value:.2f}"` |
| 宽度10，2位小数 | `"%10.2f" % value` | `f"{value:10.2f}"` |
| 左对齐 | `"%-10.2f" % value` | `f"{value:<10.2f}"` |
| 零填充 | `"%010.2f" % value` | `f"{value:010.2f}"` |
| 显示正号 | `"%+10.2f" % value` | `f"{value:+10.2f}"` |
| 字符串截断 | `"%.5s" % text` | `f"{text:.5s}"` |
| 百分比 | `"%.1f%%" % ratio` | `f"{ratio:.1%}"` |
| 千分位 | 不支持原生 | `f"{value:,.2f}"` |

```python
# 实际转换示例
value = 1234.5678
text = "Hello World"

# 保留2位小数
print("%.2f" % value)          # f-string: f"{value:.2f}"

# 宽度10，右对齐
print("%10.2f" % value)        # f-string: f"{value:10.2f}"

# 零填充
print("%010.2f" % value)       # f-string: f"{value:010.2f}"

# 字符串截断
print("%.5s" % text)           # f-string: f"{text:.5s}"

# 多个值
name = "Alice"
score = 95.5
print("Name: %s, Score: %.1f" % (name, score))
# 等价于
print(f"Name: {name}, Score: {score:.1f}")
```

#### 2.10.6 % 格式化的高级用法

**多值格式化**：可以用元组同时格式化多个值：

```python
# 多值格式化
name = "Bob"
age = 30
score = 95.678

print("Name: %s, Age: %d, Score: %.1f" % (name, age, score))
# 输出: Name: Bob, Age: 30, Score: 95.7

# 使用关键字参数（使用字典）
data = {'name': 'Charlie', 'age': 25, 'score': 88.5}
print("Name: %(name)s, Age: %(age)d, Score: %(score).1f" % data)
# 输出: Name: Charlie, Age: 25, Score: 88.5
```

**格式化符号的转义**：需要输出 `%` 本身时，使用 `%%`：

```python
# 转义 % 符号
value = 75
print("完成度: %d%%" % value)  # 输出: 完成度: 75%
print("%.2f%%" % 0.8765)       # 输出: 87.65%
```

**动态宽度和精度**：可以通过间接引用实现动态格式：

```python
# 动态格式
width = 10
precision = 2
value = 123.456

# 方法1：字符串拼接
fmt = f"%{width}.{precision}f"  # %10.2f
print(fmt % value)              #     123.46

# 方法2：使用 * 动态指定（format() 方法）
print("{:*.{}}f".format(value, precision).format(value, width))
# 输出量少用，这里了解即可
```

#### 2.10.7 % 格式化的实际应用场景

虽然新代码推荐使用 f-string，但 `%` 格式化在以下场景仍然常见：

```python
# 场景1：维护遗留代码
# 很多老项目使用 % 格式化
def legacy_log_format(level, message):
    return "[%s] %s: %s" % (level, time.strftime("%H:%M:%S"), message)

# 场景2：与 C 语言库交互
# 有的场景需要生成类C格式的输出
import ctypes
printf_format = "Value: %10.2f\n"  # 类似printf的格式

# 场景3：日志系统兼容
# 某些日志框架使用 % 格式化
logging.info("Processing %d records, %.1f%% complete", 150, 67.5)
# 输出: Processing 150 records, 67.5% complete

# 场景4：字符串模板（简单场景）
template = "Hello, %s! You have %d messages."
print(template % ("Alice", 5))
# 输出: Hello, Alice! You have 5 messages.
```

#### 2.10.8 % 格式化的常见错误与注意事项

```python
# 常见错误1：忘记元组封装
value = 123.45
# 错误：print("%f" % value)  # 这里OK，但如果多个值必须用元组
print("%.2f" % value)  # OK

# 常见错误2：元组元素数量不匹配
name = "Alice"
age = 30
# 错误：print("%s, %d, %s" % (name, age))  # 只提供了2个值，3个占位符
print("%s, %d" % (name, age))  # OK

# 常见错误3：类型不匹配
# 错误：print("%d" % "123")  # 字符串不能用%d格式化
# 正确：print("%d" % int("123"))

# 常见错误4：对新式格式化误解
# % 格式化不支持千分位
value = 1234567.89
# print("%,.2f" % value)  # 错误！不支持千分位
# 正确做法：手动添加千分位或转换f-string

# 正确方式：使用格式化工具函数
def with_thousands_separator(value):
    """为数值添加千分位分隔符"""
    parts = str(value).split('.')
    integer_part = parts[0]
    decimal_part = parts[1] if len(parts) > 1 else ''
    integer_with_sep = '{:,}'.format(int(integer_part))
    if decimal_part:
        return f"{integer_with_sep}.{decimal_part}"
    return integer_with_sep

print(with_thousands_separator(1234567.89))  # 1,234,567.89
```

---

### 2.9 特殊格式化选项

#### 2.9.1 显示正号 `+`

使用 `+` 符号选项可以让正数也显示 `+` 号，这在表格中对齐正负数非常有用。

```python
# 显示正号 +
values = [12.34, -56.78, 90.12]

print(f"不加+: {values[0]:.2f}, {values[1]:.2f}, {values[2]:.2f}")
print(f"加+:   {values[0]:+.2f}, {values[1]:+.2f}, {values[2]:+.2f}")

# 输出:
# 加+:   +12.34, -56.78, +90.12
```

#### 2.9.2 空格符号位

使用空格符号位，可以在正数前显示空格，负数前显示 `-`，实现视觉上的对齐。

```python
# 空格符号位
values = [12.34, -56.78, 90.12]

print(f"空格: ", end="")
for v in values:
    print(f"{v: .2f}", end=" ")
print()

# 输出:
# 空格:  12.34 -56.78  90.12

# 对比：正数前有空格，负数前有负号
# 这样在列对齐时符号位位置一致
```

#### 2.9.3 备用形式 `#`

`#` 选项会产生"备用形式"（alternate form）的输出，对不同类型有不同效果：

```python
# # 选项的备用形式效果

# 十六进制
print(f"{255:#x}")    # 0xff (带0x前缀)

# 二进制
print(f"{255:#b}")    # 0b11111111 (带0b前缀)

# 八进制
print(f"{255:#o}")    # 0o377 (带0o前缀)

# 浮点数：始终显示小数点
print(f"{10:#.0f}")   # 10. (有小数点，即使整数)
print(f"{10:.0f}")    # 10 (无小数点)

# g/G 格式：显示尾随零
print(f"{1.5:#.1g}")  # 1.5 (显示)
print(f"{1.5:.1g}")   # 1.5 (同样显示，差异在于特殊值)
```

### 2.10 数字格式的实际应用案例

#### 2.10.1 财务报表格式

```python
# 财务报表格式示例
class FinancialReport:
    def __init__(self):
        self.items = []
    
    def add_item(self, name, amount):
        self.items.append((name, amount))
    
    def print_report(self):
        # 表头
        print("=" * 60)
        print(f"{'项目':<20} {'金额':>15}")
        print("-" * 60)
        
        # 数据行
        for name, amount in self.items:
            # 金额格式化：千分位、两位小数、右对齐
            if amount >= 0:
                amount_str = f"{amount:,.2f}"
            else:
                amount_str = f"({abs(amount):,.2f})"
            print(f"{name:<20} {amount_str:>15}")
        
        print("-" * 60)
        
        # 汇总
        total = sum(a for _, a in self.items)
        if total >= 0:
            total_str = f"{total:,.2f}"
        else:
            total_str = f"({abs(total):,.2f})"
        print(f"{'合计':<20} {total_str:>15}")
        print("=" * 60)

# 使用示例
report = FinancialReport()
report.add_item("营业收入", 1234567.89)
report.add_item("营业成本", -456789.01)
report.add_item("销售费用", -234567.89)
report.add_item("管理费用", -123456.78)
report.print_report()
```

运行结果：
```
============================================================
项目                            金额
------------------------------------------------------------
营业收入                   1,234,567.89
营业成本                  (456,789.01)
销售费用                  (234,567.89)
管理费用                  (123,456.78)
------------------------------------------------------------
合计                      419,754.21
============================================================
```

#### 2.10.2 科学实验数据表格

```python
# 科学实验数据表格
def print_scientific_table(data, precision=3):
    """科学数据格式化表格"""
    # 找到最大宽度
    headers = ["实验编号", "测量值", "误差", "相对误差(%)"]
    
    # 打印表头
    print(f"{headers[0]:^8} | {headers[1]:^12} | {headers[2]:^12} | {headers[3]:^15}")
    print("-" * 55)
    
    # 打印数据
    for i, (value, error) in enumerate(data, 1):
        rel_error = abs(error / value) * 100 if value != 0 else 0
        print(f"{i:^8} | {value:12.4e} | {error:12.4e} | {rel_error:15.2f}")

# 实验数据
measurements = [
    (1.234567e-4, 1.2e-6),
    (5.678901e-3, 5.6e-5),
    (9.876543e2, 9.8e0),
    (1.111111e1, 1.1e-1),
]

print_scientific_table(measurements)

# 输出：
#  实验编号  |    测量值     |     误差     |   相对误差(%)
# -------------------------------------------------------
#     1     |  1.2346e-04  |  1.2000e-06  |           0.97
#     2     |  5.6789e-03  |  5.6000e-05  |           0.99
#     3     |  9.8765e+02  |  9.8000e+00  |           0.99
#     4     |  1.1111e+01  |  1.1000e-01  |           0.99
```

#### 2.10.3 游戏伤害计算器

```python
# 游戏伤害数字格式化
def format_damage(base_damage, critical_multiplier=1.5):
    """游戏伤害格式化显示"""
    # 基础伤害格式化（整数，无小数）
    base = int(base_damage)
    
    # 暴击伤害
    crit = int(base_damage * critical_multiplier)
    
    print(f"基础伤害: {base:,}")
    print(f"暴击伤害: {crit:,}")
    print(f"暴击加成: x{critical_multiplier:.1f}")
    
    # DPS 格式（保留一位小数）
    dps = base_damage * 2.5  # 假设每秒2次攻击
    print(f"预估DPS: {dps:,.1f}")

# 示例
format_damage(1573)

# 输出：
# 基础伤害: 1,573
# 暴击伤害: 2,359
# 暴击加成: x1.5
# 预估DPS: 3,932.5
```

---

## 3. 最佳实践

### 3.1 优先使用 f-string

在 Python 3.6+，**f-string 是首选的字符串格式化方式**。它比 `.format()` 和 `%` 格式化更易读、更简洁。

```python
# 推荐：f-string
name = "Alice"
score = 95.5
print(f"姓名: {name}, 分数: {score:.1f}")

# 不推荐：format() 方法
print("姓名: {}, 分数: {:.1f}".format(name, score))

# 不推荐：% 格式化
print("姓名: %s, 分数: %.1f" % (name, score))
```

**f-string 的优势**：

1. **可读性更好**：变量直接在字符串内部，不需要位置标记
2. **性能更高**：在所有格式化方式中执行速度最快
3. **表达力更强**：可以直接在 `{}` 内 작성任意表达式

```python
# f-string 可嵌入表达式
a, b = 10, 3
print(f"{a} / {b} = {a/b:.2f}")    # 10 / 3 = 3.33
print(f"{a} ** 2 = {a**2}")        # 10 ** 2 = 100

# 条件表达式
score = 85
print(f"成绩等级: {'A' if score >= 90 else 'B' if score >= 80 else 'C'}")
```

### 3.2 浮点数精度选择的建议

不同场景下精度选择不同，以下是经验建议：

| 场景 | 推荐精度 | 说明 |
|------|----------|------|
| 货币/金融 | `.2f` | 精确到分 |
| 百分比 | `.1%` ~ `.2%` | 通常1-2位小数足够 |
| 科学计算 | `.6f` ~ `.10f` | 根据精度需求 |
| 数据展示 | `.2f` | 平衡可读性与精度 |
| UI 显示 | 根据界面调整 | 可能需要整数 |

```python
# 金融计算：始终使用 .2f
price = 99.99
tax = price * 0.06
total = price + tax
print(f"价格: {price:.2f}, 税: {tax:.2f}, 总计: {total:.2f}")

# 百分比显示
conversion_rate = 0.1567
print(f"转化率: {conversion_rate:.1%}")  # 15.7%

# 科学计算（需要更高精度）
scientific_value = 1.234567890123456
print(f"测量值: {scientific_value:.10f}")  # 保留10位小数
```

### 3.3 避免精度相关陷阱

#### 3.3.1 浮点数精度问题

浮点数采用 IEEE 754 二进制表示，某些十进制数无法精确表示，这会导致精度问题。

```python
# 浮点数精度陷阱
value = 0.1 + 0.2
print(f"0.1 + 0.2 = {value}")           # 0.30000000000000004
print(f"0.1 + 0.2 = {value:.1f}")       # 0.3
print(f"0.1 + 0.2 = {value:.10f}")      # 0.3000000000

# 解决方案：使用 Decimal 进行精确计算
from decimal import Decimal
value_decimal = Decimal('0.1') + Decimal('0.2')
print(f"Decimal: {value_decimal}")      # 0.3

# 或者在格式化时使用 round
print(f"round: {round(0.1 + 0.2, 1)}")  # 0.3
```

#### 3.3.2 格式化字符串中的 f-string 前缀

当字符串本身包含大括号 `{}` 时，需要注意与 f-string 的冲突。

```python
# JSON 格式化（包含大括号）
data = {"name": "Alice", "age": 30}

# 方法1：双大括号转义
print(f"Data: {data}")                  # Data: {'name': 'Alice', 'age': 30}

# 方法2：使用字典的 __str__ 之外的格式化
import json
print(f"JSON: {json.dumps(data)}")      # JSON: {"name": "Alice", "age": 30}

# 需要字面量显示大括号时
print(f"Literal: {{ hello }}")          # Literal: { hello }
print(f"Code: {{x}}".format(x=42))       # Code: 42
```

#### 3.3.3 整数除法与精度

在 Python 3 中，`/` 是真除法（返回浮点数），`//` 是整除（返回整数）。

```python
# 整数除法的精度问题
a, b = 7, 3

print(f"7 / 3 = {a/b:.2f}")    # 2.33 (真除法，返回浮点数)
print(f"7 // 3 = {a//b}")      # 2 (整除，直接截断)

# 如果需要四舍五入
print(f"round(7/3) = {round(a/b)}")  # 2 (四舍五入)
print(f"round(7/3, 2) = {round(a/b, 2)}")  # 2.33
```

### 3.4 格式化与数据验证

在实际应用中，格式化前应确保数据类型正确。

```python
# 类型转换后再格式化（推荐）
def safe_format(value, fmt):
    """安全的数值格式化"""
    try:
        return f"{float(value):{fmt}}"
    except (ValueError, TypeError) as e:
        return f"Error: {e}"

# 测试
print(safe_format(123.456, ".2f"))    # 123.46
print(safe_format("123.456", ".2f"))  # 123.46 (字符串可转换)
print(safe_format("abc", ".2f"))      # Error: could not convert string to float
print(safe_format(None, ".2f"))       # Error: float() argument must be a string or a number, not 'NoneType'
```

### 3.5 性能优化建议

在需要大量格式化的场景（如日志、数据处理），注意以下性能和最佳实践：

```python
# 性能测试示例
import time

# 测试不同格式化方式的性能
iterations = 100000

# f-string
start = time.time()
for _ in range(iterations):
    _ = f"{123.456:.2f}"
fstring_time = time.time() - start

# format()
start = time.time()
for _ in range(iterations):
    _ = "{:.2f}".format(123.456)
format_time = time.time() - start

# % 格式化
start = time.time()
for _ in range(iterations):
    _ = "%.2f" % 123.456
percent_time = time.time() - start

print(f"f-string: {fstring_time:.3f}s")
print(f"format(): {format_time:.3f}s")
print(f"% 格式化: {percent_time:.3f}s")
```

通常 f-string 性能最优，但在绝大多数实际场景下差异可忽略。可读性更重要。

### 3.6 控制台表格对齐

```python
# 实用的表格对齐打印
def print_table(headers, rows, column_widths=None):
    """格式化表格打印"""
    # 自动计算列宽
    if column_widths is None:
        column_widths = [max(len(str(row[i])) for row in [headers] + rows) 
                        for i in range(len(headers))]
    
    # 打印表头
    header_line = " | ".join(h.ljust(w) for h, w in zip(headers, column_widths))
    print(header_line)
    print("-" * len(header_line))
    
    # 打印数据行
    for row in rows:
        row_line = " | ".join(str(cell).rjust(w) if isinstance(cell, (int, float)) 
                              else str(cell).ljust(w) 
                              for cell, w in zip(row, column_widths))
        print(row_line)

# 示例
headers = ["商品", "单价", "销量", "销售额"]
data = [
    ["iPhone 15", 6999, 1234, 8637666],
    ["MacBook Pro", 15999, 567, 9071433],
    ["AirPods Pro", 1899, 3456, 6565344],
]

print_table(headers, data)
```

---

## 4. 原理

### 4.1 格式化规范的内部机制

Python 的字符串格式化背后是一套统一的**格式化协议**（Format Protocol）。当你对某个对象使用 `format()` 方法或 f-string 时，Python 会尝试调用对象的 `__format__` 方法。

```python
# 格式化协议的核心
class Number:
    def __init__(self, value):
        self.value = value
    
    def __format__(self, format_spec):
        # format_spec 就是冒号后面的部分，如 ".2f"
        # 你可以自定义解析逻辑
        if format_spec == "":
            return str(self.value)
        elif format_spec.endswith("f"):
            precision = int(format_spec[:-1]) if format_spec[:-1] else 6
            return f"{self.value:.{precision}f}"
        else:
            return str(self.value)

n = Number(3.14159)
print(f"{n:.2f}")   # 调用 n.__format__(".2f") -> "3.14"
```

这个协议让自定义类型也能享受与内置类型相同的格式化语法。

### 4.2 精度控制的内部逻辑

精度控制的实现涉及以下步骤：

1. **解析格式规范**：从格式字符串中提取精度值 `.n`
2. **类型特定处理**：
   - 浮点数：使用 round() 进行四舍五入，格式化时处理小数位数
   - 字符串：使用切片截断到指定长度
   - 整数：精度被忽略或特殊处理
3. **结果生成**：按指定格式生成最终的字符串

```python
# 简化版的精度处理逻辑（Python 内部逻辑类似）
def format_float(value, precision):
    # 1. 四舍五入到指定精度
    rounded = round(value, precision)
    
    # 2. 格式化为字符串
    format_str = f"{{:.{precision}f}}"
    return format_str.format(rounded)

# 例如 .2f 的处理
print(format_float(3.14159, 2))  # "3.14"
print(format_float(2.675, 2))    # "2.68" (银行家舍入)
```

### 4.3 银行家舍入详解

Python 的 `round()` 函数和格式化使用**银行家舍入**（Banker's Rounding，也叫 Round Half To Even）：

- 当要舍入的值正好在两个数的中间时，向最近的**偶数**舍入
- 这不是传统的"四舍五入"

```python
# 银行家舍入 vs 传统四舍五入
test_values = [0.5, 1.5, 2.5, 3.5, 4.5]

print("Python 银行家舍入:")
for v in test_values:
    print(f"  round({v}) = {round(v)}")

print("\n传统四舍五入（需要自定义）:")
def traditional_round(x):
    import math
    return math.floor(x + 0.5)

for v in test_values:
    print(f"  traditional_round({v}) = {traditional_round(v)}")

# 输出：
# Python 银行家舍入:
#   round(0.5) = 0
#   round(1.5) = 2
#   round(2.5) = 2
#   round(3.5) = 4
#   round(4.5) = 4

# 传统四舍五入:
#   traditional_round(0.5) = 1
#   traditional_round(1.5) = 2
#   traditional_round(2.5) = 3
#   traditional_round(3.5) = 4
#   traditional_round(4.5) = 5
```

这种设计是为了在大量数值计算中减少累积误差。例如金融机构在处理大量交易时，银行家舍入可以更公平。

### 4.4 浮点数二进制表示与精度损失

浮点数的精度问题源自其二进制表示方式。许多十进制小数无法用二进制精确表示。

```python
# 二进制表示精度问题
0.1 in binary = 0.000110011001100... (无限循环)
0.2 in binary = 0.001100110011001... (无限循环)

# 这导致计算结果略有偏差
result = 0.1 + 0.2
print(f"精确值: 0.3")
print(f"实际值: {result}")
print(f"差值: {result - 0.3}")  # 很小的误差

# 格式化时这个误差会显现
print(f"格式化: {result:.1f}")   # 0.3
print(f"格式化: {result:.17f}")  # 0.30000000000000004
```

这就是为什么金融计算建议使用 `decimal.Decimal` 类型：

```python
from decimal import Decimal, getcontext

# 设置精度
getcontext().prec = 10

# 精确计算
d1 = Decimal('0.1')
d2 = Decimal('0.2')
d3 = d1 + d2
print(f"Decimal: {d3}")              # 0.3 (精确)
print(f"格式化: {d3.quantize(Decimal('0.00'))}")  # 0.30
```

### 4.5 内存与性能考量

格式化操作涉及字符串构建，对性能有一定影响：

1. **f-string 在编译时解析**：Python 在编译 f-string 时会解析格式规范，运行更快
2. **format() 需要运行时解析**：格式规范在运行时解析，相对稍慢
3. **% 格式化有历史包袱**：虽然语法老旧，但性能与 f-string 接近

大量格式化时的优化：

```python
# 避免在循环中重复解析格式规范
# 不好：每次循环都解析格式字符串
for value in values:
    print(f"{value:.2f}")

# 好：预定义格式规范（如果值类型统一）
format_spec = "{:.2f}".format
for value in values:
    print(format_spec(value))

# 更好：列表推导式一次生成
result = [f"{v:.2f}" for v in values]
```

---

## 5. 总结

本文围绕占位符精度控制展开，主要介绍了以下内容：

- **精度控制基础**：精度说明符 `.n` 位于宽度之后、类型符之前（`f"{v:10.2f}"`）；对浮点数是小数位数、对字符串是最大字符数、对整数实际是最小显示位数；f-string、`format()`、`%` 三种格式化方式共享同一套精度语法
- **浮点数精度控制**：`.nf` 定点格式固定小数位数；`,.2f` 千分位与精度结合用于金额展示；宽度、对齐（`<` `>` `^`）、0 填充可与精度任意组合，用于报表与控制台列对齐
- **整数精度控制**：整数的"精度"实为宽度控制，补零惯用写法是 `03d` 而非 `.3d`；进制格式 `x`/`X`/`b`/`o` 配合 `#` 显示前缀，配合宽度对齐常用于调试输出
- **字符串精度控制**：`.ns` 截断到最大 n 字符（商品名、日志消息展示）；与宽度结合时先截断、再按宽度对齐
- **百分比与科学计数法**：`.n%` 自动乘以 100 并追加 `%`（精度作用于乘 100 后的值），`,.1%` 可叠加千分位；`.ne`/`.nE` 控制科学计数法小数位，用于极大极小数值；`.ng` 自动在定点与科学计数法之间选择并去除尾随零
- **特殊选项与复数**：`+` 强制显示正号、空格符号位对齐正负数、`#` 备用形式（进制前缀、强制小数点）；复数的 `.nf` 同时作用于实部与虚部，也可用 `z.real`/`z.imag` 分离后单独格式化
- **`%` 旧式格式化的精度**：`%m.nf` 中 m 为最小宽度、n 为小数位数；标志位支持 `-`、`+`、空格、`0`、`#`；与 f-string 写法有对应转换关系；常见错误：忘记元组封装、元素数量不匹配、类型不匹配、不支持千分位（`%,.2f` 无效）
- **最佳实践**：新代码优先 f-string；按场景选择精度——金额用 `,.2f`、百分比用 `.1%`、科学数据用 `e`/`g`；格式化前先完成类型转换与验证；f-string 性能最优但实际差异大多可忽略，可读性优先；警惕 f-string 前缀误写与整数除法的精度丢失
- **原理**：格式说明符由 `__format__` 协议与内置 `format()` 统一解析；浮点数舍入默认采用银行家舍入而非四舍五入；`0.1` 等十进制小数无法被二进制精确表示，格式化的舍入作用在二进制近似值之上