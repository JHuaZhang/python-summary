---
group:
  title: 【03】字符串深度剖析
  order: 3
order: 7
title: f-string 与字符串格式化
nav:
  title: Python基础
  order: 1
---

# f-string 与字符串格式化

## 1. 介绍

### 1.1 什么是字符串格式化

字符串格式化是将变量、表达式或对象的值"嵌入"到字符串模板中，生成最终字符串的过程。无论是输出用户信息、生成报表、拼接日志——都离不开字符串格式化。Python 提供了三种字符串格式化方式，代表了语言演进的三个阶段：

```python
# 方式一：% 旧式格式化（Python 最初的格式化方式）
name = "Alice"
print("姓名: %s, 年龄: %d" % (name, 30))
# 姓名: Alice, 年龄: 30

# 方式二：str.format() 方法（Python 2.6 引入）
print("姓名: {}, 年龄: {}".format("Alice", 30))
# 姓名: Alice, 年龄: 30

# 方式三：f-string（Python 3.6 引入，推荐方式）
age = 30
print(f"姓名: {name}, 年龄: {age}")
# 姓名: Alice, 年龄: 30
```

三种方式的设计目标和使用场景各有侧重：

| 方式 | 引入版本 | 核心机制 | 可读性 | 推荐程度 |
|------|---------|---------|--------|---------|
| `%` 格式化 | Python 1 | C 语言风格的占位符 | 参数多时差 | 仅用于维护旧代码 |
| `str.format()` | Python 2.6 | 花括号 `{}` 占位 + `format()` 方法 | 较好 | 兼容性场景使用 |
| f-string | Python 3.6 | 字符串前缀 `f` + `{}` 内嵌表达式 | 最佳 | 新代码首选 |

### 1.2 最简示例

```python
# % 格式化：占位符 + 元组传参
print("价格: %.2f 元" % 9.999)
# 价格: 9.99 元

# str.format()：花括号占位 + format 方法
print("价格: {:.2f} 元".format(9.999))
# 价格: 9.99 元

# f-string：直接在花括号中写变量和表达式
price = 9.999
print(f"价格: {price:.2f} 元")
# 价格: 9.99 元

# f-string 支持任意表达式
items = [10, 20, 30]
print(f"总数: {len(items)}, 合计: {sum(items)}, 平均: {sum(items)/len(items):.1f}")
# 总数: 3, 合计: 60, 平均: 20.0
```

三种方式覆盖了从简单变量替换到复杂格式控制的全部需求。理解每种方式的语法、格式说明符和适用场景，能让你在任何 Python 版本和项目中都写出清晰、高效的格式化代码。

## 2. 核心内容

### 2.1 `%` 旧式格式化

`%` 格式化是 Python 最早的字符串格式化方式，语法源自 C 语言的 `printf`。虽然在现代 Python 中已被 f-string 取代，但在维护旧代码、阅读第三方库源码时仍会频繁遇到。

#### 2.1.1 基本占位符

`%` 格式化的核心是"占位符"——以 `%` 开头的特殊标记，表示"在这个位置插入一个某种类型的值"：

| 占位符 | 含义 | 示例 |
|--------|------|------|
| `%s` | 字符串（任何类型，自动调用 `str()`） | `"%s" % "hello"` |
| `%d` / `%i` | 整数 | `"%d" % 42` |
| `%f` | 浮点数（默认 6 位小数） | `"%f" % 3.14` |
| `%e` / `%E` | 科学计数法 | `"%e" % 123456` |
| `%x` / `%X` | 十六进制（小写/大写） | `"%x" % 255` |
| `%o` | 八进制 | `"%o" % 255` |
| `%c` | 字符（Unicode 码点转字符） | `"%c" % 65` |
| `%r` | 原始表示（调用 `repr()`） | `"%r" % "hi"` |
| `%%` | 百分号本身 | `"%d%%" % 50` |

```python
# %s — 字符串占位符
print("姓名: %s" % "Alice")
# 姓名: Alice

# %d — 整数占位符
print("年龄: %d" % 30)
# 年龄: 30

# %f — 浮点数占位符
print("Pi: %f" % 3.14159265)
# Pi: 3.141593

# %x / %o — 进制转换
num = 255
print("十六进制: %x" % num)  # ff
print("八进制: %o" % num)    # 377
# 注意：% 格式化不支持 %b（二进制），需用 bin()
print("二进制: %s" % bin(num))  # 0b11111111
```

**注意**：`%s` 是最通用的占位符——它可以接收任何类型，自动调用 `str()` 转换：

```python
print("对象: %s" % [1, 2, 3])   # 对象: [1, 2, 3]
print("对象: %s" % {"a": 1})    # 对象: {'a': 1}
print("对象: %s" % None)        # 对象: None
print("对象: %s" % True)        # 对象: True
```

#### 2.1.2 多参数与元组传参

当字符串中有多个占位符时，`%` 右侧需要传入一个**元组**——即使只有一个参数也要注意元组语法：

```python
name = "Alice"
age = 30
score = 95.5

# 多参数：用元组传入
print("姓名: %s, 年龄: %d, 分数: %.1f" % (name, age, score))
# 姓名: Alice, 年龄: 30, 分数: 95.5
```

**常见陷阱**——单参数元组的括号问题：

```python
# 正常：单个字符串参数不需要元组
print("姓名: %s" % "Alice")

# 但如果参数本身是元组，需要额外括号防歧义
items = (1, 2, 3)
print("元组: %s" % (items,))  # 元组: (1, 2, 3)
# 不加额外括号也可正常工作，但加括号更明确
print("元组: %s" % items)     # 元组: (1, 2, 3)
```

#### 2.1.3 宽度、对齐与精度

`%` 格式化通过在占位符中插入数字来控制宽度、对齐和精度：

```python
# %10d — 宽度 10，右对齐
print("[%10d]" % 42)
# [        42]

# %-10d — 宽度 10，左对齐（- 表示左对齐）
print("[%-10d]" % 42)
# [42        ]

# %010d — 宽度 10，右对齐，用 0 填充
print("[%010d]" % 42)
# [0000000042]

# %.2f — 保留 2 位小数
print("价格: %.2f 元" % 9.999)
# 价格: 9.99 元

# %10.2f — 宽度 10，保留 2 位小数
print("[%10.2f]" % 3.14159)
# [      3.14]
```

格式结构的完整语法是 `%[flags][width][.precision]type`：

```text
%d       → 整数
%10d     → 宽度 10，右对齐
%-10d    → 宽度 10，左对齐
%010d    → 宽度 10，用 0 填充
%.2f     → 保留 2 位小数
%10.2f   → 宽度 10，保留 2 位小数

flags:  - 左对齐    0 用零填充    + 显示正负号    (空格) 正数前加空格
width:  最小宽度
precision: 对于浮点数是小数位数，对于字符串是最大字符数
type:   s/d/f/x/o/e 等
```

#### 2.1.4 字典键名引用

`%` 格式化支持通过 `%(key)type` 语法用字典键名引用值，避免位置参数的顺序混乱：

```python
data = {"name": "Bob", "age": 25, "city": "Beijing"}
print("姓名: %(name)s, 年龄: %(age)d, 城市: %(city)s" % data)
# 姓名: Bob, 年龄: 25, 城市: Beijing

# 同一个键可以引用多次
print("%(name)s 来自 %(city)s，%(name)s 很喜欢 %(city)s" % data)
# Bob 来自 Beijing，Bob 很喜欢 Beijing
```

#### 2.1.5 `%` 格式化的常见陷阱

```python
# 陷阱 1: 百分号本身需要用 %% 转义
progress = 85
print("进度: %d%%" % progress)
# 进度: 85%

# 陷阱 2: %s vs %r 的区别
text = "Hello\nWorld"
print("str: %s" % text)   # str: Hello（换行）World
print("repr: %r" % text)  # repr: 'Hello\nWorld'  ← 显示转义符

# 陷阱 3: 参数数量不匹配会报错
# print("%s %s" % ("Alice",))  # TypeError: not enough arguments
```

### 2.2 `str.format()` 方法

`str.format()` 是 Python 2.6 引入的格式化方法，用花括号 `{}` 作为占位符，通过 `format()` 方法传入参数。它解决了 `%` 格式化的参数顺序混乱问题，并提供了更灵活的引用方式。

#### 2.2.1 基本用法

```python
# 位置参数（按顺序填入花括号）
print("姓名: {}, 年龄: {}".format("Alice", 30))
# 姓名: Alice, 年龄: 30

# 索引引用（可重复使用同一参数）
print("{0} 来自 {1}，{0} 很喜欢 {1}".format("Alice", "Beijing"))
# Alice 来自 Beijing，Alice 很喜欢 Beijing

# 交换顺序
print("{1} {0}".format("hello", "world"))
# world hello

# 关键字参数
print("姓名: {name}, 年龄: {age}".format(name="Bob", age=25))
# 姓名: Bob, 年龄: 25
```

#### 2.2.2 宽度、对齐与填充

`str.format()` 使用冒号 `:` 后的格式说明符控制对齐和填充——语法是 `{:[fill][align][width]}`：

| 对齐符 | 含义 | 示例 |
|--------|------|------|
| `<` | 左对齐（字符串默认） | `"{:<10}"` |
| `>` | 右对齐（数字默认） | `"{:>10}"` |
| `^` | 居中 | `"{:^10}"` |
| `=` | 填充在符号和数字之间（仅数值） | `"{:=10}"` |

```python
# 宽度 10，默认左对齐（字符串）
print("[{:10}]".format("hello"))
# [hello     ]

# 右对齐
print("[{:>10}]".format("hello"))
# [     hello]

# 居中
print("[{:^10}]".format("hello"))
# [  hello   ]

# 自定义填充字符（写在 < > ^ 前面）
print("[{:*^10}]".format("hello"))
# [**hello***]

# 用 0 填充右对齐
print("[{:0>10}]".format(42))
# [0000000042]
```

#### 2.2.3 精度与类型

```python
# 精度控制
print("{:.2f}".format(3.14159))  # 3.14
print("{:.4f}".format(3.14159))  # 3.1416
print("[{:10.2f}]".format(3.14159))  # [      3.14]

# 有效数字（g 格式）
print("{:.3g}".format(1234567.89))  # 1.23e+06

# 整数进制
print("二进制: {:b}".format(255))   # 11111111
print("八进制: {:o}".format(255))   # 377
print("十六进制: {:x}".format(255))  # ff

# 带前缀（加 # 号）
print("{:#b}".format(42))  # 0b101010
print("{:#o}".format(42))  # 0o52
print("{:#x}".format(42))  # 0x2a

# 千分位
print("{:,}".format(1234567890))      # 1,234,567,890
print("{:,.2f}".format(1234567.891))  # 1,234,567.89

# 百分比
print("{:.1%}".format(0.8525))  # 85.2%
print("{:.0%}".format(0.8525))  # 85%

# 科学计数法
print("{:e}".format(123456.789))   # 1.234568e+05
print("{:.2e}".format(123456.789))  # 1.23e+05
```

#### 2.2.4 访问对象属性和字典键

`str.format()` 支持直接访问对象的属性和字典的键值，通过点号 `.` 和方括号 `[]` 语法：

```python
# 访问对象属性
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age

p = Person("Alice", 30)
print("姓名: {0.name}, 年龄: {0.age}".format(p))
# 姓名: Alice, 年龄: 30

# 访问字典键
data = {"name": "Bob", "age": 25}
# 方式 1：用 ** 解包
print("姓名: {name}, 年龄: {age}".format(**data))

# 方式 2：用方括号语法
print("姓名: {0[name]}, 年龄: {0[age]}".format(data))
```

#### 2.2.5 嵌套字段引用

`str.format()` 支持"嵌套字段"——在格式说明符中引用其他参数的值：

```python
# 宽度由第二个参数决定
print("{0:{1}}".format("hello", 10))
# hello      （宽度 10）

# 宽度和精度由参数决定
print("{0:{1}.{2}}".format("Hello World", 15, 5))
# Hello（宽度 15，截断 5 个字符）
```

### 2.3 f-string 基本用法

f-string（formatted string literal）是 Python 3.6 引入的字符串格式化方式，也是目前**推荐**的格式化方式。它在字符串前加 `f` 前缀，允许在花括号 `{}` 中直接写 Python 表达式，无需额外的方法调用。

#### 2.3.1 变量与表达式

f-string 的核心优势是"所见即所得"——花括号中直接写变量名或任意表达式：

```python
name = "Alice"
age = 30

# 直接嵌入变量
print(f"姓名: {name}, 年龄: {age}")
# 姓名: Alice, 年龄: 30

# 嵌入表达式
print(f"明年 {age + 1} 岁")
# 明年 31 岁

# 嵌入函数调用
print(f"姓名大写: {name.upper()}")
# 姓名大写: ALICE

# 嵌入列表和字典元素
items = [1, 2, 3]
print(f"列表: {items}, 第一个: {items[0]}")
# 列表: [1, 2, 3], 第一个: 1

user = {"name": "Bob", "age": 25}
print(f"用户: {user['name']}, 年龄: {user['age']}")
# 用户: Bob, 年龄: 25
```

#### 2.3.2 引号规则

f-string 中的花括号内可以使用与外层不同的引号类型（Python 3.12 之前必须不同，3.12+ 可相同）：

```python
# 外层双引号，内层单引号
d = {"key": "value"}
print(f"值: {d['key']}")
# 值: value

# 外层单引号，内层双引号
print(f'列表: {", ".join(["a", "b", "c"])}')
# 列表: a, b, c
```

#### 2.3.3 格式说明符

f-string 使用与 `str.format()` 相同的格式说明符语法——冒号 `:` 后跟格式规范：

```python
# 宽度与对齐
text = "hello"
print(f"[{text:10}]")   # [hello     ]
print(f"[{text:>10}]")  # [     hello]
print(f"[{text:^10}]")  # [  hello   ]

# 自定义填充字符
print(f"[{text:*>10}]")  # [*****hello]
print(f"[{text:*<10}]")  # [hello*****]
print(f"[{text:*^10}]")  # [**hello***]

# 数值格式化
pi = 3.14159265
print(f"{pi:.2f}")       # 3.14
print(f"{pi:.4f}")       # 3.1416
print(f"[{pi:10.2f}]")   # [      3.14]

# 整数宽度与填充
num = 42
print(f"{num:05d}")  # 00042
print(f"{num:+d}")   # +42
print(f"{num: d}")   #  42（正数前加空格）
```

#### 2.3.4 完整格式说明符语法

f-string 和 `str.format()` 共享同一套格式说明符语法，完整结构是：

```text
{[变量或表达式]:[fill][align][sign][#][0][width][grouping][.precision][type]}
  ↑               ↑     ↑      ↑    ↑   ↑    ↑      ↑         ↑         ↑
  表达式         填充  对齐   符号  前缀 零   宽度   分组      精度      类型
```

逐位说明：

| 位置 | 符号 | 作用 | 示例 |
|------|------|------|------|
| fill | 任意字符 | 填充字符 | `*`, `-`, `0` |
| align | `<` `>` `^` `=` | 对齐方式 | `:<10`, `:>10`, `:^10` |
| sign | `+` `-` `空格` | 正负号显示 | `:+d`, `:-d`, `: d` |
| `#` | `#` | 进制前缀 | `:#b`, `:#x` |
| `0` | `0` | 数字零填充 | `:05d` |
| width | 数字 | 最小宽度 | `:10d` |
| grouping | `,` `_` | 千分位分隔符 | `:,`, `:_` |
| precision | `.数字` | 小数位数 | `:.2f` |
| type | `s` `d` `f` `e` `g` `b` `o` `x` `X` `%` | 类型码 | `:d`, `:f`, `:x` |

```python
# 各位置的组合示例
num = 255
print(f"十进制: {num:d}")      # 十进制: 255
print(f"十进制补零: {num:08d}")  # 十进制补零: 00000255
print(f"千分位: {num:,}")       # 千分位: 255 (不够千分位不显示)

big = 1234567
print(f"千分位: {big:,}")       # 千分位: 1,234,567
print(f"二进制: {num:b}")       # 二进制: 11111111
print(f"带前缀hex: {num:#x}")   # 带前缀hex: 0xff

val = 3.14159
print(f"科学计数: {val:.2e}")   # 科学计数: 3.14e+00
print(f"百分比: {0.8525:.1%}")  # 百分比: 85.2%
```

#### 2.3.5 对齐符详解

四种对齐符的行为和适用类型：

```python
# < 左对齐（字符串默认）
print(f"{'hello':<10}|")   # hello     |
print(f"{42:<10d}|")       # 42        |

# > 右对齐（数值默认）
print(f"{'hello':>10}|")   #      hello|
print(f"{42:>10d}|")       #         42|

# ^ 居中
print(f"{'hello':^10}|")   #   hello   |
print(f"{'hello':*^10}|")  # **hello***|

# = 填充在符号和数字之间（仅数值类型）
print(f"{42:=5d}|")    #    42|
print(f"{-42:=5d}|")   # -  42|
print(f"{42:=+5d}|")   # +  42|
# 注意：= 对齐符不支持字符串类型
```

#### 2.3.6 符号显示

```python
# 默认：正数不显示 +，负数显示 -
print(f"{42:d}")   # 42
print(f"{-42:d}")  # -42

# + ：正数和负数都显示符号
print(f"{42:+d}")   # +42
print(f"{-42:+d}")  # -42

# 空格：正数前加空格，负数前加 -
# 用于对齐正负数
print(f"{42: d}")   #  42
print(f"{-42: d}")  # -42
```

#### 2.3.7 进制转换

f-string 支持所有常用进制转换，`#` 前缀可添加进制标识：

```python
num = 255
print(f"十进制: {num:d}")      # 255
print(f"二进制: {num:b}")      # 11111111
print(f"八进制: {num:o}")      # 377
print(f"小写hex: {num:x}")     # ff
print(f"大写hex: {num:X}")     # FF

# 带前缀
print(f"带前缀: {num:#b}")     # 0b11111111
print(f"带前缀: {num:#o}")     # 0o377
print(f"带前缀: {num:#x}")     # 0xff
# 大写前缀 + 大写字母需要手动
print(f"带前缀: {num:#X}")     # 0XFF
```

#### 2.3.8 千分位与百分比

```python
# 千分位分隔符
big = 1234567890
print(f"{big:,}")      # 1,234,567,890
print(f"{big:_}")      # 1_234_567_890 (下划线也是合法千分位符)

price = 1234567.891
print(f"{price:,.2f}")  # 1,234,567.89
print(f"{price:_.2f}")  # 1_234_567.89

# 百分比（自动乘 100 并加 %）
ratio = 0.8525
print(f"进度: {ratio:.1%}")  # 进度: 85.2%
print(f"进度: {ratio:.0%}")  # 进度: 85%
print(f"进度: {ratio:.2%}")  # 进度: 85.25%
```

#### 2.3.9 调试输出符号 `=`

Python 3.8 引入了 f-string 调试语法 `{var=}`，自动输出变量名和值：

```python
x = 42
y = "Alice"

# {var=} 自动显示 "var = value"
print(f"{x = }")
# x = 42

# 可以加格式说明符
print(f"{x = :05d}")
# x = 00042

# 多变量同时调试
print(f"{x = }, {y = }")
# x = 10, y = 'Alice'

# !r 显示 repr 形式
data = "Hello\nWorld"
print(f"{data = !r}")
# data = 'Hello\nWorld'

# !s 显示 str 形式
print(f"{data = !s}")
# data = Hello（换行）World
```

### 2.4 f-string 高级用法

#### 2.4.1 日期时间格式化

f-string 支持在冒号后使用 `strftime` 格式化日期，通过 `__format__` 协议实现：

```python
import datetime

now = datetime.datetime.now()

# 常用日期格式
print(f"日期: {now:%Y-%m-%d}")      # 2024-01-15
print(f"时间: {now:%H:%M:%S}")       # 14:30:45
print(f"日期时间: {now:%Y-%m-%d %H:%M:%S}")

# 中文日期
print(f"中文: {now:%Y年%m月%d日}")    # 2024年01月15日

# 星期
print(f"星期: {now:%A}")             # Monday
print(f"星期缩写: {now:%a}")         # Mon

# 12小时制
print(f"12小时制: {now:%I:%M:%S %p}")  # 02:30:45 PM

# 时间戳
print(f"时间戳: {now:%s}")           # 1705290645

# 构造特定日期
dt = datetime.datetime(2024, 6, 15, 10, 30)
print(f"自定义: {dt:%Y-%m-%d %H:%M}")
# 自定义: 2024-06-15 10:30
```

常用 `strftime` 格式符速查表：

| 格式符 | 含义 | 示例 |
|--------|------|------|
| `%Y` | 四位年份 | 2024 |
| `%m` | 两位月份 | 01 |
| `%d` | 两位日期 | 15 |
| `%H` | 两位小时（24h） | 14 |
| `%M` | 两位分钟 | 30 |
| `%S` | 两位秒 | 45 |
| `%A` | 星期全名 | Monday |
| `%a` | 星期缩写 | Mon |
| `%I` | 两位小时（12h） | 02 |
| `%p` | AM/PM | PM |
| `%s` | Unix 时间戳 | 1705290645 |

#### 2.4.2 嵌套表达式与动态宽度

f-string 的花括号中可以嵌套任意 Python 表达式——包括在格式说明符中：

```python
# 用变量控制宽度
width = 15
text = "Hello"
print(f"[{text:{width}}]")
# [Hello          ]

# 用表达式动态控制宽度
items = ["Apple", "Banana", "Cherry"]
max_len = max(len(item) for item in items)
for item in items:
    print(f"{item:{max_len}} | {'*' * len(item)}")
# Apple   | *****
# Banana  | ******
# Cherry  | ******

# 动态精度
precision = 3
pi = 3.14159265
print(f"Pi: {pi:.{precision}f}")
# Pi: 3.142

# 条件表达式
score = 85
print(f"结果: {'及格' if score >= 60 else '不及格'}")
# 结果: 及格
```

#### 2.4.3 多行 f-string

f-string 可以跨多行使用，配合三引号字符串生成复杂模板：

```python
name = "Alice"
age = 30
city = "Beijing"

profile = f"""
=== 用户信息 ===
姓名: {name}
年龄: {age}
城市: {city}
"""
print(profile)
# === 用户信息 ===
# 姓名: Alice
# 年龄: 30
# 城市: Beijing
```

#### 2.4.4 自定义 `__format__` 方法

f-string 和 `str.format()` 底层都调用对象的 `__format__` 方法。自定义类可以实现 `__format__` 来支持自定义格式说明符：

```python
class Temperature:
    def __init__(self, celsius):
        self.celsius = celsius

    def __format__(self, format_spec):
        if format_spec == "f":
            return f"{self.celsius * 9 / 5 + 32:.1f}F"
        elif format_spec == "k":
            return f"{self.celsius + 273.15:.1f}K"
        else:
            return f"{self.celsius:.1f}C"

temp = Temperature(25)
print(f"摄氏: {temp}")      # 摄氏: 25.0C
print(f"华氏: {temp:f}")    # 华氏: 77.0F
print(f"开尔文: {temp:k}")  # 开尔文: 298.1K
```

更完整的自定义格式化示例——货币类：

```python
class Money:
    def __init__(self, amount, currency="CNY"):
        self.amount = amount
        self.currency = currency

    def __format__(self, format_spec):
        if format_spec == "cn":
            return f"￥{self.amount:,.2f}"
        elif format_spec == "us":
            return f"${self.amount:,.2f}"
        else:
            return f"{self.currency} {self.amount:,.2f}"

price = Money(1234567.89)
print(f"默认: {price}")     # 默认: CNY 1,234,567.89
print(f"人民币: {price:cn}")  # 人民币: ￥1,234,567.89
print(f"美元: {price:us}")    # 美元: $1,234,567.89
```

#### 2.4.5 `!s` / `!r` / `!a` 转换标志

f-string 花括号中可以使用 `!s`、`!r`、`!a` 转换标志，分别调用 `str()`、`repr()`、`ascii()` 函数：

```python
text = "Hello\nWorld"

# 默认：使用 __format__
print(f"默认: {text}")    # 默认: Hello（换行）World

# !s：强制使用 str()
print(f"!s: {text!s}")    # !s: Hello（换行）World

# !r：强制使用 repr()
print(f"!r: {text!r}")    # !r: 'Hello\nWorld'

# !a：强制使用 ascii()（非 ASCII 字符转义）
cn = "你好"
print(f"!a: {cn!a}")      # !a: '\u4f60\u597d'
```

### 2.5 三种方式对比与最佳实践

#### 2.5.1 可读性对比

**场景：生成用户卡片**

```python
user = {"name": "Alice", "age": 30, "city": "Beijing", "score": 95.5}

# % 方式：参数多时难读
# 需要在字符串和参数列表之间反复对照
report_pct = "姓名: %(name)s, 年龄: %(age)d, 城市: %(city)s, 分数: %(score).1f" % user

# format 方式：清晰但不简洁
# 可以用 ** 解包
report_fmt = "姓名: {name}, 年龄: {age}, 城市: {city}, 分数: {score:.1f}".format(**user)

# f-string 方式：最直接、最简洁
report_f = f"姓名: {user['name']}, 年龄: {user['age']}, 城市: {user['city']}, 分数: {user['score']:.1f}"
```

#### 2.5.2 性能对比

f-string 在运行时性能上通常优于 `%` 格式化和 `str.format()`——因为 f-string在编译时就能解析大部分结构：

```python
import time

n = 10000
text = "Hello"
num = 42

# % 方式
start = time.perf_counter()
for _ in range(n):
    s = "%s %d" % (text, num)
pct_time = time.perf_counter() - start

# format 方式
start = time.perf_counter()
for _ in range(n):
    s = "{} {}".format(text, num)
format_time = time.perf_counter() - start

# f-string 方式
start = time.perf_counter()
for _ in range(n):
    s = f"{text} {num}"
fstring_time = time.perf_counter() - start

print(f"%-style:    {pct_time:.4f}s")
print(f".format(): {format_time:.4f}s")
print(f"f-string:   {fstring_time:.4f}s")
# f-string 通常最快
```

**运行结果**：

```text
%-style:    0.0012s
.format(): 0.0013s
f-string:   0.0010s
```

#### 2.5.3 功能对比一览

```text
能力                         % 格式化    str.format()    f-string
--------------------------------------------------------------------
表达式内嵌                   ✗          ✗              ✓
变量名直接引用               ✗          ✓(关键字)      ✓
字典键引用                   ✓(%(k)s)   ✓([key])       ✓(['k'])
对象属性访问                 ✗          ✓(.attr)       ✓(.attr)
嵌套字段宽/精度               ✗          ✓              ✓
日期格式化                   ✗          ✓(:strfmt)     ✓(:strfmt)
自定义 __format__            ✓          ✓              ✓
调试输出 (=)                 ✗          ✗              ✓
行内调用函数                 ✗          ✗              ✓
Python 3.6 及以下兼容        ✓          ✓              ✗
```

#### 2.5.4 三种方式选择指南

| 场景 | 推荐方式 | 原因 |
|------|---------|------|
| 新代码（Python 3.6+） | f-string | 最简洁、最高效、最可读 |
| 需兼容 Python 3.5 及以下 | `str.format()` | 旧版本不支持 f-string |
| 维护旧代码 | `%` 格式化 | 不动旧代码，保持一致性 |
| 需要模板复用（延迟格式化） | `str.format()` | 模板字符串可以存储和重用 |
| 日志中的惰性格式化 | `%` 格式化 | logging 模块用 `%` 延迟格式化避免无谓开销 |

**关于日志格式的特殊说明**：Python 的 `logging` 模块使用 `%` 格式化做惰性求值——`logging.debug("val=%d", x)` 中的格式化只在日志级别满足时才执行，而 f-string 会在调用前就完成格式化，所以日志中推荐用 `%`：

```python
# 推荐：logging 用 % 格式化（惰性求值）
import logging
logging.debug("用户 %s 的分数是 %d", name, score)  # 不满足 DEBUG 级时不格式化

# 不推荐：f-string 在日志中
# logging.debug(f"用户 {name} 的分数是 {score}")  # 无论是否输出都会格式化
```

### 2.6 综合实战

#### 2.6.1 终端表格输出

f-string 在终端表格输出中极为常用——编号补零、左对齐文本、右对齐数字、千分位分隔：

```python
products = [
    ("苹果", 5.50, 100),
    ("香蕉", 3.80, 200),
    ("西瓜", 25.00, 50),
    ("芒果", 12.90, 80),
    ("葡萄", 8.50, 120),
]

print("=" * 55)
print(f"{'商品价格表':^55}")
print("=" * 55)
print(f"{'编号':<6} {'商品名称':<12} {'单价':>10} {'库存':>10}")
print("-" * 55)

total_value = 0
for i, (name, price, stock) in enumerate(products, 1):
    print(f"{i:03d}    {name:<12} {price:>9.2f}元 {stock:>9d}件")
    total_value += price * stock

print("-" * 55)
print(f"{'合计':<6} {'':<12} {'':>10} {total_value:>10.2f}元")
print("=" * 55)
```

**运行结果**：

```text
=======================================================
                       商品价格表
=======================================================
编号     商品名称         单价         库存
-------------------------------------------------------
001    苹果          5.50元       100件
002    香蕉          3.80元       200件
003    西瓜         25.00元        50件
004    芒果         12.90元        80件
005    葡萄          8.50元       120件
-------------------------------------------------------
合计                              4612.00元
=======================================================
```

#### 2.6.2 日志格式化

```python
import datetime

log_entries = [
    ("INFO", "系统启动完成"),
    ("WARNING", "内存使用率超过 80%"),
    ("ERROR", "数据库连接失败"),
    ("DEBUG", "查询参数: table=user, limit=100"),
]

now = datetime.datetime.now()
print("=== 日志输出 ===")
for level, message in log_entries:
    timestamp = now.strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{level:>7}] {message}")
```

**运行结果**：

```text
=== 日志输出 ===
[2024-01-15 14:30:45] [   INFO] 系统启动完成
[2024-01-15 14:30:45] [WARNING] 内存使用率超过 80%
[2024-01-15 14:30:45] [  ERROR] 数据库连接失败
[2024-01-15 14:30:45] [  DEBUG] 查询参数: table=user, limit=100
```

#### 2.6.3 进度条

利用 `\r` 回车符和 f-string 的动态宽度格式化实现进度条：

```python
import time

total = 30
for i in range(total + 1):
    progress = i / total
    bar_len = 20
    filled = int(bar_len * progress)
    bar = "=" * filled + "-" * (bar_len - filled)
    percent = progress * 100
    print(f"\r进度: [{bar}] {percent:5.1f}%", end="", flush=True)
    time.sleep(0.02)
print()
```

`{bar}` 动态生成进度条填充，`{percent:5.1f}` 保证百分比始终占 5 字符宽度并保留 1 位小数，`\r` 和 `end=""` 让每次输出覆盖上一行。

#### 2.6.4 数据报表生成器

综合使用 f-string 的宽度对齐、日期格式化、千分位和精度控制生成报表：

```python
import datetime

def generate_sales_report(sales_data, title="销售数据报表"):
    width = 50
    lines = []
    lines.append("=" * width)
    lines.append(f"{title:^{width}}")
    lines.append("=" * width)
    lines.append(f"{'日期':<12} {'客户':<10} {'产品':<10} {'金额':>12}")
    lines.append("-" * width)

    total_amount = 0
    for date, customer, product, amount in sales_data:
        lines.append(f"{date:<12} {customer:<10} {product:<10} {amount:>10.2f}元")
        total_amount += amount

    lines.append("-" * width)
    lines.append(f"{'合计':<34} {total_amount:>10.2f}元")
    lines.append("=" * width)
    return "\n".join(lines)

sales = [
    ("2024-01-15", "张三", "笔记本电脑", 5999.00),
    ("2024-01-15", "李四", "鼠标", 89.90),
    ("2024-01-16", "王五", "键盘", 259.00),
    ("2024-01-16", "赵六", "显示器", 1299.00),
    ("2024-01-17", "张三", "耳机", 499.00),
]

report = generate_sales_report(sales)
print(report)
```

**运行结果**：

```text
==================================================
                  销售数据报表
==================================================
日期           客户         产品         金额
--------------------------------------------------
2024-01-15   张三         笔记本电脑    5999.00元
2024-01-15   李四         鼠标           89.90元
2024-01-16   王五         键盘          259.00元
2024-01-16   赵六         显示器       1299.00元
2024-01-17   张三         耳机          499.00元
--------------------------------------------------
合计                              8145.90元
==================================================
```

## 3. 最佳实践

### 3.1 选择正确的格式化方式

| 需求 | 推荐方式 | 原因 |
|------|---------|------|
| Python 3.6+ 新代码 | f-string | 最简洁高效 |
| 简单变量替换 | f-string | `f"{name}"` 比任何方式都直观 |
| 需要复用模板 | `str.format()` | 模板可存储后复用 |
| 兼容旧版本 | `str.format()` 或 `%` | 根据最低版本选择 |
| 日志输出 | `%` 格式化 | `logging` 支持惰性求值 |
| 复杂表达式 | f-string | 任意 Python 表达式直接内嵌 |
| 日期格式化 | f-string | `f"{now:%Y-%m-%d}"` 最简洁 |
| 进制/千分位 | f-string | 格式说明符最齐全 |

### 3.2 推荐 vs 不推荐写法

```python
# ---- 简单变量替换 ----

# 推荐：f-string 最简洁
name = "Alice"
age = 30
msg = f"姓名: {name}, 年龄: {age}"

# 不推荐：% 格式化在新代码中过时
msg = "姓名: %s, 年龄: %d" % (name, age)

# 不推荐：format 在有 f-string 时显得啰嗦
msg = "姓名: {}, 年龄: {}".format(name, age)

# ---- 表达式内嵌 ----

# 推荐：f-string 直接写表达式
items = [10, 20, 30]
print(f"总数: {len(items)}, 合计: {sum(items)}, 平均: {sum(items)/len(items):.1f}")
# 总数: 3, 合计: 60, 平均: 20.0

# 不推荐：format 需要先算好
total = sum(items)
avg = sum(items) / len(items)
print("总数: {}, 合计: {}, 平均: {:.1f}".format(len(items), total, avg))

# ---- 日期格式化 ----

# 推荐：f-string + strftime
import datetime
now = datetime.datetime.now()
print(f"当前时间: {now:%Y-%m-%d %H:%M:%S}")

# 不推荐：手动拼接
print(f"{now.year}-{now.month:02d}-{now.day:02d} {now.hour:02d}:{now.minute:02d}:{now.second:02d}")

# ---- 宽度对齐 ----

# 推荐：f-string 格式说明符
for item in items_list:
    print(f"{item:<10} | {item_value:>8.2f}")

# 不推荐：手动拼接空格
for item in items_list:
    print(item.ljust(10) + " | " + str(item_value).rjust(8))

# ---- 日志输出 ----

# 推荐：logging 用 % 格式化（惰性求值）
import logging
logging.debug("用户 %s 的操作: %s", username, action)  # 不输出时不格式化

# 不推荐：f-string 在日志中
# logging.debug(f"用户 {username} 的操作: {action}")  # 即使不输出也会先格式化
```

### 3.3 综合推荐 vs 不推荐对照表

| 场景 | 推荐写法 | 不推荐写法 | 原因 |
|------|---------|-----------|------|
| 变量替换 | `f"{name}"` | `"{}".format(name)` | f-string 更简洁 |
| 表达式 | `f"{x + y:.2f}"` | `"{:.2f}".format(x + y)` | f-string 直接展示表达式 |
| 日期 | `f"{now:%Y-%m-%d}"` | `now.strftime("%Y-%m-%d")` | f-string 更可读 |
| 日志 | `log("%s", val)` | `log(f"{val}")` | `%` 支持惰性格式化 |
| 模板复用 | `template.format(**data)` | `f"{data['name']}"` | f-string 无法延迟 |
| 百分比 | `f"{ratio:.1%}"` | `f"{ratio*100:.1f}%"` | `%` 格式符自动处理 |

### 3.4 常见错误与注意事项

**f-string 中的引号冲突（Python 3.11 及以下）**

```python
# 错误（Python 3.11-）：内外引号相同导致语法错误
# d = {"name": "Alice"}
# print(f"Name: {d["name"]}")  # SyntaxError!

# 正确：内外引号不同
d = {"name": "Alice"}
print(f"Name: {d['name']}")   # 双引号外，单引号内
print(f'Name: {d["name"]}')   # 单引号外，双引号内

# Python 3.12+ 支持同类型引号嵌套
```

**`=` 对齐符仅用于数值**

```python
# 错误：字符串使用 = 对齐符
# f"{'hello':*=15}"  # ValueError!

# 正确：字符串居中用 ^
print(f"{'hello':*^15}")
# *****hello*****
```

**`%b` 不是旧式格式化支持的占位符**

```python
# 错误：% 格式化不支持 %b
# print("%b" % 255)  # ValueError!

# 正确：用 bin() 函数 + %s
print("%s" % bin(255))  # 0b11111111

# 或者用 f-string
print(f"{255:b}")  # 11111111
```

**千分位分隔符 `s` 类型不支持**

```python
# 错误：字符串类型不能使用千分位
# print(f"{'hello':,s}")  # ValueError!

# 正确：千分位仅用于数值
print(f"{1234567:,}")  # 1,234,567
```

## 4. 原理

### 4.1 f-string 的编译时解析

f-string 在 Python 编译时被解析为具体的字符串拼接操作和格式调用。当解释器遇到 `f"..."` 前缀时，会将花括号中的表达式和格式说明符转换为等价的 Python 字节码：

```text
f"姓名: {name}, 年龄: {age}" 的编译过程：

  1. 解析器识别 f 前缀，进入 f-string 解析模式
  2. 分割: "姓名: " + 表达式 name + ", 年龄: " + 表达式 age
  3. 编译表达式: name → LOAD_NAME name
  4. 编译表达式: age → LOAD_NAME age
  5. 生成拼接字节码: BUILD_STRING
  6. 最终等价于: "姓名: " + str(name) + ", 年龄: " + str(age)
```

带格式说明符时的编译：

```text
f"价格: {price:.2f}" 的编译过程：

  1. 分割: "价格: " + 表达式 price with format ".2f"
  2. 编译表达式: LOAD_NAME price
  3. 编译格式化: FORMAT_VALUE (format_spec=".2f")
  4. 生成拼接字节码
  5. 等价于: "价格: " + format(price, ".2f")
```

这就是 f-string 在性能上优于 `%` 格式化和 `str.format()` 的原因——前者在编译时就完成了大部分检测和优化，而后者在运行时才解析格式字符串和执行查找。

### 4.2 `__format__` 协议

f-string 和 `str.format()` 底层都依赖 `__format__` 协议——内置函数 `format(value, format_spec)` 会调用 `value.__format__(format_spec)`，返回格式化后的字符串。

```text
format(obj, "spec") 的调用链：

  1. 检查 obj 是否有 __format__ 方法
  2. 调用 obj.__format__(format_spec="spec")
  3. __format__ 返回字符串结果

  对于内置类型：
    format(42, "05d")     → int.__format__(42, "05d")
    format("hi", ">10")   → str.__format__("hi", ">10")

  对于自定义类型：
    format(temp, "f")     → Temperature.__format__(temp, "f")
    → 返回自定义的格式化字符串
```

内置类型的 `__format__` 实现了解析格式说明符的全部逻辑——填充字符、对齐方式、宽度、精度、类型码。自定义类型可以重写 `__format__` 来支持自定义格式说明符。

### 4.3 进制转换的底层机制

f-string 和 `str.format()` 的进制类型码（`b`、`o`、`x`、`X`）在底层调用整数的 `__format__` 方法，通过 `format()` 内置函数实现转换：

```python
# 等价关系
f"{255:b}"              # 等价于 format(255, "b")
f"{255:#x}"            # 等价于 format(255, "#x")
format(255, "b")       # 等价于 bin(255)[2:]  → "11111111"
format(255, "#x")      # 等价于 hex(255)     → "0xff"
format(255, "o")       # 等价于 oct(255)[2:] → "377"
```

`#` 前缀的实现是在结果前添加对应的进制标识符（`0b`、`0o`、`0x`）。

### 4.4 百分比格式化的实现

`%` 类型码底层做了一次"乘 100 + 加 %"的操作：

```python
# 等价关系
f"{0.8525:.2%}"
# 等价于: format(0.8525, ".2%")
# 底层: 0.8525 * 100 = 85.25, 格式化为 ".2f" → "85.25", 加 "%" → "85.25%"
```

精度控制 `.2` 在百分比格式中作用的是"乘 100 后"的数字——即最终显示的小数位数，而不是原始数值的小数位数。

## 5. 总结

本文围绕 Python 字符串的三种格式化方式展开，主要介绍了以下内容：

- **`%` 旧式格式化**：使用 `%s`、`%d`、`%f` 等占位符，支持宽度/对齐/精度控制和字典键名引用 `%(key)s`；不支持表达式内嵌和 `%b` 二进制；新代码中已被 f-string 取代，但维护旧代码和 `logging` 日志中仍在使用
- **`str.format()` 方法**：使用 `{}` 花括号占位，支持位置/索引/关键字参数、对象属性访问、字典键引用、嵌套字段（动态宽度和精度）；兼容性好，在不能使用 f-string 的场景下首推
- **f-string**：Python 3.6 引入的推荐方式，花括号中直接写变量和任意表达式，`f"..."` 前缀；支持所有格式说明符（宽度/对齐/填充/精度/进制/千分位/百分比/日期）；性能最优、可读性最佳
- **格式说明符**：三种方式共享 `{:[fill][align][sign][#][0][width][grouping][.precision][type]}` 格式语法；四种对齐符 `<` `>` `^` `=`；符号显示 `+` `-` 空格；进制 `b` `o` `x` `X` 加 `#` 前缀；千分位 `,` `_`；百分比 `%` 自动乘 100
- **高级用法**：f-string 支持日期时间格式化 `f"{now:%Y-%m-%d}"`、嵌套表达式动态宽度 `f"{text:{width}}"`、调试输出 `{var=}`、`!s`/`!r`/`!a` 转换标志、自定义 `__format__` 方法实现私有格式说明符
- **最佳实践**：新代码首选 f-string；兼容旧版本用 `str.format()`；日志用 `%` 格式化（惰性求值）；注意 f-string 的引号冲突（Python 3.11-）、`=` 对齐符仅用于数值、`%b` 不被旧式格式化支持等常见陷阱
- **底层原理**：f-string 在编译时解析为字节码级拼接操作（性能最优），`%` 和 `str.format()` 在运行时解析；所有方式底层调用 `__format__` 协议，进制/百分比通过 `format()` 内置函数实现
