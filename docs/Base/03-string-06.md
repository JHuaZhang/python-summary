---
group:
  title: 【03】字符串介绍
  order: 3
order: 6
title: f-string高级格式化
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 f-string

f-string（Formatted String Literal，格式化字符串字面量）是 Python 3.6 引入的一种字符串格式化机制。它以 `f` 或 `F` 为前缀，在字符串内部使用花括号 `{}` 包裹表达式、变量或函数调用，实现"所见即所得"的字符串格式化。与传统的 `%` 格式化、`str.format()` 方法相比，f-string 以其简洁的语法、优秀的性能以及强大的功能，迅速成为 Python 中字符串格式化的首选方式。

f-string 的核心设计理念是：**将表达式直接嵌入字符串字面量中，让格式化代码与字符串内容融为一体**。这种设计使得代码既保持了自然语言的可读性，又实现了精确的格式化控制。

```python
# f-string 的基本用法
name = "Alice"
age = 30

# 使用 f-string 进行字符串格式化
message = f"Hello, my name is {name}, I'm {age} years old."
print(message)
# 输出：Hello, my name is Alice, I'm 30 years old.
```

对比传统的格式化方式，f-string 的优势显而易见：

```python
# 传统 % 格式化
msg1 = "Hello, my name is %s, I'm %d years old." % (name, age)

# str.format() 方法
msg2 = "Hello, my name is {}, I'm {} years old.".format(name, age)

# f-string（推荐）
msg3 = f"Hello, my name is {name}, I'm {age} years old."
```

从以上对比可以看出，f-string 的语法更加直观——变量名直接出现在字符串中，不需要额外的占位符或格式说明符。这不仅让代码更容易阅读，也大大减少了拼写错误和位置参数错配的可能性。

### 1.2 f-string 与字符串拼接的关系

在《字符串拼接性能对比》章节中，我们学习了各种字符串拼接方式的性能特点。f-string 作为一种格式化工具，同时也承担着字符串拼接的功能。与传统的字符串拼接（使用 `+` 运算符或 `+=`）相比，f-string 在可读性和性能两个维度都表现出色。

**f-string 的拼接能力**：

```python
# 使用 f-string 进行字符串构建
parts = ["apple", "banana", "cherry"]
result = f"Fruits: {', '.join(parts)}"
print(result)  # Fruits: apple, banana, cherry
```

f-string 的拼接能力体现在它可以将变量、表达式、甚至函数调用直接嵌入字符串中。这是传统的 `+` 拼接方式无法做到的——使用 `+` 时，字符串和变量需要明确分开，使用 `+` 运算符连接。

```python
# 对比：f-string vs + 拼接

# f-string 方式
name = "Alice"
greeting = f"Hello, {name}!"
# 代码含义一目了然：创建一个包含 name 值的问候语

# + 拼接方式
greeting = "Hello, " + name + "!"
# 代码被分隔符（+）打断，可读性略逊
```

在性能方面，f-string 与其他现代格式化方式（如 `format()` 方法）的性能相当，通常优于 `%` 格式化。在 Python 3.6+ 中，f-string 是处理字符串格式化的首选方案。

### 1.3 f-string 的发展历史与版本要求

f-string 是在 **PEP 498**（Literal String Interpolation）中提出，并于 **Python 3.6** 版本正式引入的。这一特性的引入标志着 Python 字符串格式化进入了新的时代。

**关键版本节点**：

- **Python 3.6 (2016)**: f-string 正式引入，成为标准特性
- **Python 3.8 (2019)**: 增加了 `=` 自引用调试规范的特性
- **Python 3.12 (2023)**: 对 f-string 的解析进行了多项优化，错误信息更清晰

```python
# Python 版本检查
import sys
print(f"当前 Python 版本: {sys.version}")

# 如果版本低于 3.6，f-string 将无法使用
# raise SyntaxError: f-strings are not supported
```

值得注意的是，**Python 3.6 之前的版本不支持 f-string**。如果你的代码需要兼容旧版 Python，应避免使用 f-string，或者使用条件判断来选择不同的格式化方式。

### 1.4 f-string 的典型应用场景

f-string 在日常 Python 编程中有极其广泛的应用场景，以下是一些最常见的例子：

**场景一：变量值插入**

```python
# 最基本的用法：将变量值插入字符串
user = "Bob"
score = 95
print(f"User: {user}, Score: {score}")
# 输出：User: Bob, Score: 95
```

**场景二：表达式计算**

```python
# 在 f-string 中直接计算表达式
a, b = 10, 20
print(f"{a} + {b} = {a + b}")           # 10 + 20 = 30
print(f"{a} * {b} = {a * b}")           # 10 * 20 = 200
print(f"{a} ** 2 = {a ** 2}")           # 10 ** 2 = 100
```

**场景三：函数调用结果**

```python
# 在 f-string 中调用函数
name = "  Alice  "
print(f"Upper: {name.upper().strip()}")  # Upper: ALICE
print(f"Length: {len(name.strip())}")    # Length: 5
```

**场景四：条件表达式**

```python
# 条件表达式（三元运算符）
score = 85
print(f"Result: {'Pass' if score >= 60 else 'Fail'}")
# 输出：Result: Pass
```

**场景五：调试输出**

```python
# = 调试规范（Python 3.8+）
x = 42
y = "hello"
print(f"{x=} {y=}")
# 输出：x=42 y='hello'
```

这些应用场景覆盖了日常编程中的大部分需求。在后续的"核心内容"章节中，我们将深入讲解 f-string 的各项高级特性，包括格式化规范、类型转换、自定义格式化等。

---

## 2. 核心内容

本章深入讲解 f-string 的各项特性与高级用法，从基础语法到进阶技巧全面覆盖。

### 2.1 基本语法与使用

#### 2.1.1 语法结构

f-string 的基本语法结构是在字符串前加上 `f` 或 `F` 前缀，然后在字符串内部使用花括号 `{}` 包裹表达式：

```python
# 基本语法
f"内容 {表达式} 内容"
F"内容 {表达式} 内容"
```

花括号内的表达式会在运行时被求值，其结果会被转换为字符串并插入到最终输出中。表达式的范围可以是一个简单的变量名，也可以是一个复杂的函数调用或算术表达式。

```python
# 简单变量
name = "Alice"
print(f"Hello, {name}")  # Hello, Alice

# 算术表达式
a, b = 5, 3
print(f"{a} * {b} = {a * b}")  # 5 * 3 = 15

# 函数调用
import math
radius = 5
print(f"圆面积: {math.pi * radius ** 2:.2f}")  # 圆面积: 78.54
```

#### 2.1.2 引号的使用

f-string 支持单引号、双引号和三引号，与普通字符串的规则一致。选择哪种引号取决于字符串内容本身是否包含该种引号。

```python
# 双引号 f-string
s1 = f"Hello, {name}"

# 单引号 f-string
s2 = f'Hello, {name}'

# 三引号 f-string（多行）
s3 = f"""
Name: {name}
Age: {age}
"""
```

如果字符串内容中需要同时包含单引号和双引号，可以使用转义或选择一种不在内容中出现的引号作为外层包裹。

```python
# 字符串内容包含双引号，使用单引号包裹
msg = f'She said: "Hello"'
print(msg)  # She said: "Hello"

# 字符串内容包含单引号，使用双引号包裹
msg = f"It's a beautiful day"
print(msg)  # It's a beautiful day

# 两者都需要时，使用转义
msg = f"He said: \"It's fine\""
print(msg)  # He said: "It's fine"
```

#### 2.1.3 嵌套的花括号

当需要在 f-string 输出中包含字面量的花括号时，需要将花括号双写以进行转义：

```python
# 输出字面的花括号
s = f"Python 字典: {{'key': 'value'}}"
print(s)  # Python 字典: {'key': 'value'}

# 双写大括号输出单大括号
s = f"{{ }}"
print(s)  # { }

# 示例：JSON 格式输出
data = {"name": "Alice"}
s = f'{{"name": "{data["name"]}"}}'
print(s)  # {"name": "Alice"}
```

这是 f-string 中花括号的双重含义：
- 单个 `{...}` 表示插入表达式的值
- 双写 `{{...}}` 表示输出字面的花括号字符

### 2.2 格式化规范详解

f-string 的强大之处在于其内置的格式化规范。通过在表达式后添加冒号和格式说明符，可以精确控制数值的呈现方式。

#### 2.2.1 数值格式化

**整数格式化**：

```python
# 整数基本格式化
n = 42

# 默认显示
print(f"{n}")           # 42

# 指定宽度（右对齐，默认用空格填充）
print(f"{n:5}")         #    42

# 指定宽度（用 0 填充）
print(f"{n:05}")        # 00042

# 左对齐
print(f"{n:<5}")        # 42   

# 居中对齐
print(f"{n:^5}")        #  42  

# 逗号分隔（千分位）
print(f"{n:,}")         # 42
print(f"{n:,.0f}")      # 42

n = 1234567
print(f"{n:,}")         # 1,234,567

# 二进制、八进制、十六进制
print(f"{n:b}")         # 1110101（二进制）
print(f"{n:o}")         # 52（八进制）
print(f"{n:x}")         # 2a（十六进制，小写）
print(f"{n:X}")         # 2A（十六进制，大写）
print(f"{n:#x}")        # 0x2a（带前缀）
```

**浮点数格式化**：

```python
# 浮点数基本格式化
pi = 3.1415926535

# 默认显示
print(f"{pi}")          # 3.1415926535

# 指定小数位数
print(f"{pi:.2f}")      # 3.14
print(f"{pi:.4f}")      # 3.1416

# 指定总宽度（包含小数点）
print(f"{pi:10.2f}")    #      3.14

# 用 0 填充
print(f"{pi:010.2f}")   # 000003.14

# 逗号分隔
money = 1234567.89
print(f"{money:,.2f}") # 1,234,567.89

# 百分比格式
rate = 0.856
print(f"{rate:.1%}")    # 85.6%

# 科学计数法
large = 123456789
print(f"{large:.2e}")   # 1.23e+08
print(f"{large:.2E}")   # 1.23E+08

# 浮点数正负号显示
num = -3.14
print(f"{num:+}")       # -3.14
num = 3.14
print(f"{num:+}")       # +3.14
```

**精度与填充的综合示例**：

```python
# 综合示例
values = [3.14159, 2.71828, 1.41421]

for v in values:
    # 默认格式
    print(f"默认: {v}")
    # 保留3位小数
    print(f"小数: {v:.3f}")
    # 宽度10，右对齐
    print(f"右对齐: {v:10.3f}")
    # 宽度10，左对齐
    print(f"左对齐: {v:<10.3f}")
    # 宽度10，居中
    print(f"居中: {v:^10.3f}")
    print("-" * 20)
```

#### 2.2.2 字符串格式化

**字符串对齐与填充**：

```python
# 字符串基本格式化
s = "hello"

# 默认显示
print(f"{s}")           # hello

# 指定宽度（右对齐）
print(f"{s:>10}")       #      hello

# 指定宽度（左对齐）
print(f"{s:<10}")       # hello     

# 指定宽度（居中）
print(f"{s:^10}")       #   hello  

# 用特定字符填充
print(f"{s:*>10}")      # ******hello
print(f"{s:_<10}")      # hello_____
print(f"{s:-^10}")      # --hello---

# 截断字符串
long_s = "abcdefghij"
print(f"{long_s:.5}")   # abcde
print(f"{long_s:5.5}")  # abcde（宽度5，截断5）

# 字符串截断 + 宽度
s = "Hello World"
print(f"{s:15.5}")      # Hello          （宽度15，只显示前5字符）
print(f"{s:>15.5}")     #           Hello
print(f"{s:<15.5}")     # Hello          
print(f"{s:^15.5}")     #     Hello      
```

**字符串大小写转换**：

```python
# 大小写转换
s = "Hello World"

# 全部小写
print(f"{s.lower()}")   # hello world

# 全部大写
print(f"{s.upper()}")   # HELLO WORLD

# 首字母大写
print(f"{s.title()}")   # Hello World

# 单词首字母大写
print(f"{s.capitalize()}")  # Hello world

# 大小写互换
print(f"{s.swapcase()}")   # hELLO wORLD
```

这些字符串方法可以直接在 f-string 的表达式部分调用，实现即时的格式转换。

#### 2.2.3 对齐与填充的综合应用

```python
# 制作表格输出
headers = ["Name", "Age", "City"]
rows = [
    ["Alice", "25", "Beijing"],
    ["Bob", "30", "Shanghai"],
    ["Charlie", "28", "Guangzhou"],
]

# 打印表头
print(f"{headers[0]:<10} {headers[1]:>5} {headers[2]:<15}")
print("-" * 35)

# 打印数据行
for row in rows:
    print(f"{row[0]:<10} {row[1]:>5} {row[2]:<15}")
```

运行结果：

```
Name              Age City            
-----------------------------------
Alice              25 Beijing         
Bob                30 Shanghai        
Charlie            28 Guangzhou       
```

### 2.3 日期时间格式化

f-string 对 `datetime` 对象有良好的内置支持，可以直接使用格式规范进行日期时间的格式化输出。

#### 2.3.1 datetime 格式化基础

```python
from datetime import datetime, date, time

# 获取当前时间
now = datetime.now()
print(f"当前时间: {now}")

# 年月日格式化
print(f"年: {now:%Y}")        # 2024
print(f"月: {now:%m}")        # 01
print(f"日: {now:%d}")        # 15
print(f"完整日期: {now:%Y-%m-%d}")  # 2024-01-15

# 时间格式化
print(f"时: {now:%H}")        # 14
print(f"分: {now:%M}")        # 30
print(f"秒: {now:%S}")        # 45

# 组合格式化
print(f"格式化时间: {now:%Y年%m月%d日 %H:%M:%S}")
# 输出：格式化时间: 2024年01月15日 14:30:45
```

#### 2.3.2 常用日期时间格式代码

```python
from datetime import datetime

dt = datetime(2024, 1, 15, 14, 30, 45)

# 常用格式代码
print(f"%Y 4位年份: {dt:%Y}")                    # 2024
print(f"%y 2位年份: {dt:%y}")                    # 24
print(f"%m 月份（01-12）: {dt:%m}")              # 01
print(f"%d 日期（01-31）: {dt:%d}")              # 15
print(f"%H 24小时（00-23）: {dt:%H}")            # 14
print(f"%I 12小时（01-12）: {dt:%I}")            # 02
print(f"%M 分钟（00-59）: {dt:%M}")              # 30
print(f"%S 秒（00-59）: {dt:%S}")                # 45

print(f"%a 星期缩写: {dt:%a}")                   # Mon
print(f"%A 星期全称: {dt:%A}")                   # Monday
print(f"%b 月份缩写: {dt:%b}")                   # Jan
print(f"%B 月份全称: {dt:%B}")                   # January

print(f"%c 日期和时间: {dt:%c}")                  # Mon Jan 15 14:30:45 2024
print(f"%x 日期: {dt:%x}")                       # 01/15/24
print(f"%X 时间: {dt:%X}")                       # 14:30:45

# 常用格式组合
print(f"ISO 格式: {dt:%Y-%m-%d}")                # 2024-01-15
print(f"中文格式: {dt:%Y年%m月%d日}")            # 2024年01月15日
print(f"美国格式: {dt:%m/%d/%Y}")                # 01/15/2024
print(f"24小时制: {dt:%H:%M:%S}")                # 14:30:45
print(f"12小时制: {dt:%I:%M:%S %p}")             # 02:30:45 PM
```

#### 2.3.3 date 对象的格式化

```python
from datetime import date

# 创建日期对象
today = date.today()
print(f"今天是: {today}")

# 格式化
print(f"{today:%Y-%m-%d}")  # 2024-01-15
print(f"{today:%Y年%m月%d日}")  # 2024年01月15日
print(f"星期: {today:%A}")  # Monday
```

### 2.4 高级特性

#### 2.4.1 自引用调试规范（Python 3.8+）

Python 3.8 引入了一个极其方便的特性：`=` 自引用调试规范。在 f-string 中使用 `{expr=}` 语法，会同时输出表达式本身和其值，非常适合调试输出。

```python
# 基本用法
x = 42
y = "hello"
print(f"{x=}")        # x=42
print(f"{y=}")        # y='hello'

# 多个变量
a = 10
b = 20
c = 30
print(f"{a=}, {b=}, {c=}")
# 输出：a=10, b=20, c=30

# 表达式
print(f"{a + b=}")
# 输出：a + b=30

# 带格式化
value = 3.14159
print(f"{value=:.2f}")
# 输出：value=3.14
```

#### 2.4.2 在 f-string 中使用条件表达式

```python
# 条件表达式（三元运算符）
score = 85
result = f"成绩: {'优秀' if score >= 90 else '良好' if score >= 80 else '及格' if score >= 60 else '不及格'}"
print(result)  # 成绩: 良好

# 嵌套条件
status = "active"
role = "admin"
permission = f"{'管理员' if role == 'admin' else '普通用户'}"
print(permission)  # 管理员
```

#### 2.4.3 在 f-string 中调用函数和方法

```python
# 调用内置函数
import math
print(f"π 向上取整: {math.ceil(math.pi)}")
print(f"π 向下取整: {math.floor(math.pi)}")
print(f"π 四舍五入: {round(math.pi, 2)}")

# 调用自定义函数
def greet(name):
    return f"Hello, {name}!"

name = "Alice"
print(f"{greet(name)}")

# 调用字符串方法
text = "hello world"
print(f"大写: {text.upper()}")
print(f"首字母大写: {text.title()}")

# 链式调用
s = "  hello  "
print(f"处理后: {s.strip().upper()}")
```

#### 2.4.4 嵌套的 f-string

从 Python 3.12 开始，f-string 支持嵌套使用，虽然这是一个较新的特性，但了解它有助于理解 f-string 的工作原理。

```python
# 嵌套 f-string（Python 3.12+）
nesting_level = 2
prefix = "test"

# 注意：Python 3.12 之前的版本不支持嵌套 f-string
# 以下代码仅适用于 Python 3.12+
# nested = f"Value: {f'{nesting_level * 10}'}"
```

在实际开发中，更常见的是通过在表达式中调用函数来实现类似的灵活性。

### 2.5 类型转换与 self-="{ }" 规范

#### 2.5.1 类型转换

f-string 会自动将表达式的结果转换为字符串。如果需要显式指定转换方式，可以使用转换标志：

```python
# 转换标志
# !s: 使用 str() 转换（默认行为）
# !r: 使用 repr() 转换
# !a: 使用 ascii() 转换

text = "Hello\nWorld"

# 默认：str 转换
print(f"{text}")
# 输出（显示换行）：
# Hello
# World

# repr 转换：显示原始表示
print(f"{text!r}")
# 输出：'Hello\nWorld'

# str 显式转换
print(f"{text!s}")
# 输出（显示换行）：
# Hello
# World

# ascii 转换：类似 repr，但对非 ASCII 字符使用 \x 转义
chinese = "中文"
print(f"{chinese!r}")  # '中文'
print(f"{chinese!a}")  # '中文'
```

#### 2.5.2 !r 与调试

`!r` 转换在调试时非常有用，因为它能显示变量的"原始"表示，包括引号、转义序列等：

```python
# 调试场景
name = "Alice"
path = "C:\\Users\\Admin"

# 普通输出
print(f"名字: {name}")
# 名字: Alice

# repr 输出（显示引号）
print(f"名字: {name!r}")
# 名字: 'Alice'

# repr 输出（显示原始路径）
print(f"路径: {path!r}")
# 路径: 'C:\\Users\\Admin'

# 结合调试规范
print(f"{name=!r}")
# name='Alice'
```

### 2.6 与其他格式化方式的对比

#### 2.6.1 f-string vs % 格式化

```python
# % 格式化（旧式）
name = "Alice"
age = 30
msg1 = "My name is %s, I'm %d years old." % (name, age)

# f-string（新式，推荐）
msg2 = f"My name is {name}, I'm {age} years old."

# 输出相同
print(msg1)  # My name is Alice, I'm 30 years old.
print(msg2)  # My name is Alice, I'm 30 years old.
```

f-string 相比 % 格式化的优势：
- 语法更直观，变量直接在字符串中可见
- 不需要记忆占位符类型（%s, %d, %f 等）
- 支持更丰富的格式化选项
- 性能相当或更好

#### 2.6.2 f-string vs format() 方法

```python
# format() 方法
name = "Bob"
age = 25
msg1 = "Hello, {}, you are {} years old.".format(name, age)

# f-string
msg2 = f"Hello, {name}, you are {age} years old."

# 位置参数
msg3 = "{0} loves {1}. And {0} lives in {2}.".format("Alice", "Bob", "Beijing")

# f-string 无法直接使用位置参数，但可以这样：
name1, name2, city = "Alice", "Bob", "Beijing"
msg4 = f"{name1} loves {name2}. And {name1} lives in {city}."

print(msg3)  # Alice loves Bob. And Alice lives in Beijing.
print(msg4)  # Alice loves Bob. And Alice lives in Beijing.
```

f-string 相比 format() 方法的优势：
- 语法更简洁，不需要 `.format()` 调用
- 变量直接可见，不需要位置索引或命名参数
- 表达力更强，代码更短

### 2.7 综合示例

#### 示例一：生成报告摘要

```python
from datetime import datetime

# 模拟数据
sales_data = {
    "2024-01": {"revenue": 125000, "orders": 1250, "customers": 980},
    "2024-02": {"revenue": 142000, "orders": 1380, "customers": 1120},
    "2024-03": {"revenue": 168000, "orders": 1620, "customers": 1340},
}

# 生成报告
report = f"""
{'='*50}
销售报告摘要
生成时间: {datetime.now():%Y-%m-%d %H:%M:%S}
{'='*50}
"""

for month, data in sales_data.items():
    avg_order_value = data["revenue"] / data["orders"]
    customer_value = data["revenue"] / data["customers"]
    
    report += f"""
{'-'*30}
月份: {month}
{'-'*30}
收入: ¥{data['revenue']:,}
订单数: {data['orders']:,}
客户数: {data['customers']:,}
平均客单价: ¥{avg_order_value:.2f}
人均贡献: ¥{customer_value:.2f}
"""

print(report)
```

#### 示例二：JSON 格式化输出

```python
import json

# 模拟 API 响应数据
api_response = {
    "status": "success",
    "code": 200,
    "data": {
        "user": {
            "id": 1001,
            "name": "Alice",
            "email": "alice@example.com",
            "roles": ["admin", "editor"]
        },
        "last_login": "2024-01-15T10:30:00Z"
    },
    "meta": {
        "page": 1,
        "per_page": 10,
        "total": 1
    }
}

# 使用 f-string 格式化输出
output = f"""API 响应:
--------
状态: {api_response['status']}
代码: {api_response['code']}

用户信息:
  ID: {api_response['data']['user']['id']}
  姓名: {api_response['data']['user']['name']}
  邮箱: {api_response['data']['user']['email']}
  角色: {', '.join(api_response['data']['user']['roles'])}

元数据:
  页码: {api_response['meta']['page']}
  每页数量: {api_response['meta']['per_page']}
  总数: {api_response['meta']['total']}
"""

print(output)

# 同时输出原始 JSON
print("\n原始 JSON:")
print(json.dumps(api_response, indent=2, ensure_ascii=False))
```

#### 示例三：表格数据格式化

```python
# 模拟用户数据表格
users = [
    {"name": "Alice", "age": 28, "city": "Beijing", "score": 92.5},
    {"name": "Bob", "age": 34, "city": "Shanghai", "score": 87.3},
    {"name": "Charlie", "age": 25, "city": "Guangzhou", "score": 95.8},
    {"name": "Diana", "age": 31, "city": "Shenzhen", "score": 88.1},
    {"name": "Eve", "age": 27, "city": "Hangzhou", "score": 91.6},
]

# 表格标题
print(f"{'姓名':<10} {'年龄':>5} {'城市':<12} {'分数':>8} {'评级':<6}")
print("-" * 50)

# 打印数据行
for user in users:
    # 根据分数确定评级
    if user["score"] >= 90:
        rating = "A"
    elif user["score"] >= 80:
        rating = "B"
    elif user["score"] >= 70:
        rating = "C"
    else:
        rating = "D"
    
    print(f"{user['name']:<10} {user['age']:>5} {user['city']:<12} {user['score']:>8.1f} {rating:<6}")

# 汇总统计
avg_score = sum(u["score"] for u in users) / len(users)
max_score = max(u["score"] for u in users)
min_score = min(u["score"] for u in users)

print("-" * 50)
print(f"{'平均分':<10} {avg_score:>8.1f}")
print(f"{'最高分':<10} {max_score:>8.1f}")
print(f"{'最低分':<10} {min_score:>8.1f}")
```

---

## 3. 最佳实践

### 3.1 优先使用 f-string 作为字符串格式化的首选

在 Python 3.6+ 环境中，f-string 应该是字符串格式化的首选方式。它在可读性和性能方面都表现出色，是现代 Python 编程的最佳实践。

```python
# 推荐：f-string
name = "Alice"
age = 30
message = f"Hello, {name}!"

# 可接受但不如 f-string 简洁
message = "Hello, {}!".format(name)
message = "Hello, %s!" % name

# 不推荐：使用 + 拼接
message = "Hello, " + name + "!"
```

### 3.2 在调试输出时使用 = 自引用规范

Python 3.8+ 的 `=` 自引用规范是调试输出的利器，建议在开发过程中广泛使用。

```python
# 开发调试时
x = 42
y = [1, 2, 3]
z = {"key": "value"}

# 普通输出
print(f"x = {x}, y = {y}, z = {z}")

# 使用 = 规范（更清晰，显示变量名）
print(f"{x=}, {y=}, {z=}")
# 输出：x=42, y=[1, 2, 3], z={'key': 'value'}

# 结合表达式
print(f"{x * 2=}")
# 输出：x * 2=84

# 结合格式化
print(f"{y=!r}")  # 显示 Python 字面量风格
# 输出：y=[1, 2, 3]
```

### 3.3 数值格式化时考虑可读性

在进行数值格式化时，应优先考虑可读性：

```python
# 金额格式化：使用逗号千分位
price = 1234567.89
print(f"价格: ¥{price:,.2f}")
# 输出：价格: ¥1,234,567.89

# 百分比格式化
conversion_rate = 0.8567
print(f"转化率: {conversion_rate:.1%}")
# 输出：转化率: 85.7%

# 对齐输出（表格场景）
data = [
    ("Apple", 100),
    ("Banana", 250),
    ("Cherry", 50),
]

print(f"{'水果':<10} {'数量':>6}")
print("-" * 18)
for name, count in data:
    print(f"{name:<10} {count:>6}")
```

### 3.4 处理特殊字符和转义

在使用 f-string 时，需要注意特殊字符的处理：

```python
# 输出花括号：双写花括号
s = f"字典: {{'key': 'value'}}"
print(s)  # 字典: {'key': 'value'}

# 输出引号
s = f'She said: "Hello"'
print(s)  # She said: "Hello"

# 输出反斜杠（在原始字符串中更简洁）
path1 = "C:\\Users\\Admin"         # 普通字符串，双写
path2 = r"C:\Users\Admin"          # 原始字符串，单写
print(f"{path1}, {path2}")

# 多行字符串使用三引号 f-string
multiline = f"""
This is a multiline
f-string with variables:
name = {name}
age = {age}
"""
```

### 3.5 避免在 f-string 中执行复杂计算

虽然 f-string 支持表达式，但过于复杂的表达式会影响代码可读性：

```python
# 不推荐：过于复杂的表达式
result = f"结果是: {[x**2 for x in range(10) if x % 2 == 0][-1] if len([x**2 for x in range(10) if x % 2 == 0]) > 0 else 0}"

# 推荐：先计算，再格式化
squares = [x**2 for x in range(10) if x % 2 == 0]
result_value = squares[-1] if squares else 0
result = f"结果是: {result_value}"
```

### 3.6 在循环中使用 f-string 的注意事项

在循环中构建字符串时，应根据性能要求选择合适的方式：

```python
# 小规模循环（< 100 次）：直接使用 f-string
parts = []
for i in range(50):
    parts.append(f"Item {i}: {i*10}")

# 大规模循环（>= 100 次）：考虑 join
# 详见《字符串拼接性能对比》章节
```

### 3.7 使用 !r 进行调试输出

当需要显示变量的"原始"表示时，使用 `!r` 转换标志：

```python
# 调试字符串（含特殊字符）
text = "Hello\nWorld"
print(f"str:  {text}")         # 显示为两行
print(f"repr: {text!r}")       # 显示为 'Hello\nWorld'

# 输出文件路径
path = "C:\\Users\\Admin"
print(f"路径: {path!r}")       # 路径: 'C:\\Users\\Admin'

# 输出包含引号的字符串
quote = 'She said "Hi"'
print(f"引用: {quote!r}")      # 引用: 'She said "Hi"'
```

### 3.8 格式化规范的一致性

在项目中保持格式化规范的一致性：

```python
# 建立团队约定：
# 1. 浮点数保留 2 位小数，除非有特殊要求
print(f"金额: {amount:.2f}")

# 2. 百分比保留 1 位小数
print(f"比例: {ratio:.1%}")

# 3. 日期使用 ISO 格式或中文格式，不混用
print(f"日期: {date:%Y-%m-%d}")    # ISO
print(f"日期: {date:%Y年%m月%d日}")  # 中文

# 4. 整数用逗号分隔千分位
print(f"数量: {count:,}")
```

---

## 4. 原理

### 4.1 f-string 的编译原理

f-string 看似简单，实际上在编译阶段经历了复杂的转换过程。理解其原理有助于更好地使用这个特性。

**编译阶段的转换**：

```python
# 源代码
s = f"Hello, {name}!"

# Python 编译器将其转换为类似以下形式：
s = "Hello, {}!".format(name)

# 或者（更底层）：
s = "Hello, {0}".format(name)
```

这种转换发生在**编译时**，而非运行时。这意味着 f-string 的格式化模板在编译阶段就已经被解析和优化，运行时只需要执行简单的格式化操作。

**字节码层面的分析**：

```python
import dis

# 简单的 f-string
def test_fstring():
    name = "Alice"
    return f"Hello, {name}"

# 对比传统方式
def test_concat():
    name = "Alice"
    return "Hello, " + name

# 查看字节码
print("=== f-string ===")
dis.dis(test_fstring)
print("\n=== 字符串拼接 ===")
dis.dis(test_concat)
```

从字节码分析可以看出，f-string 生成的字节码通常更加简洁，因为它避免了运行时的字符串拼接操作。

### 4.2 格式化规范的解析

f-string 中的格式化规范（如 `:>10`、`.2f` 等）是在运行时通过 `__format__` 协议进行解析的。

**`__format__` 协议**：

```python
# 内置类型的格式化都遵循 __format__ 协议
# 例如整数的格式化

n = 42
print(f"{n:05}")  # 00042

# 等价于
print(format(n, "05"))
# 再等价于
print(n.__format__("05"))
```

自定义类可以通过实现 `__format__` 方法来支持格式化规范：

```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y
    
    def __format__(self, spec):
        if spec == "short":
            return f"({self.x}, {self.y})"
        elif spec == "coord":
            return f"x={self.x}, y={self.y}"
        else:
            # 默认格式
            return self.__format__("short")

p = Point(3, 4)
print(f"{p}")           # (3, 4)  （默认格式）
print(f"{p:short}")     # (3, 4)
print(f"{p:coord}")     # x=3, y=4
```

### 4.3 性能特性分析

f-string 的性能通常优于或等同于其他格式化方式，这是因为它在编译阶段进行了优化。

**性能测试对比**：

```python
import timeit

name = "Alice"
age = 30

# f-string
t1 = timeit.timeit('f"{name} is {age} years old"', globals=globals())

# % 格式化
t2 = timeit.timeit('"%s is %d years old" % (name, age)', globals=globals())

# format() 方法
t3 = timeit.timeit('"{} is {} years old".format(name, age)', globals=globals())

print(f"f-string:  {t1*1000:.3f}ms")
print(f"% 格式化:  {t2*1000:.3f}ms")
print(f"format():  {t3*1000:.3f}ms")
```

**性能差异的原因**：
1. **编译时优化**：f-string 的模板在编译时解析
2. **字节码简洁**：生成的字节码更少
3. **无运行时字典查找**：不需要像 format() 那样处理位置或命名参数

### 4.4 字符串驻留与 f-string

Python 的字符串驻留机制对 f-string 的性能有一定影响：

```python
# 短字符串会被自动驻留
s1 = f"hello"
s2 = f"hello"
print(s1 is s2)  # True（可能）

# 但动态插入的值不会被驻留
name = "Alice"
s1 = f"hello {name}"
s2 = f"hello {name}"
print(s1 is s2)  # False（通常）

# 格式化后的结果通常也不会被驻留
# 这是正常的，不影响使用
```

### 4.5 版本差异与兼容性

不同 Python 版本对 f-string 的支持程度有所不同：

**Python 3.6**：
- 基本 f-string 功能
- 不支持嵌套 f-string
- 不支持 `=` 调试规范

**Python 3.8**：
- 新增 `=` 调试规范
- 错误信息更清晰

**Python 3.12**：
- 性能优化
- 支持在 f-string 中使用注释（`#`）
- 更灵活的语法解析

```python
# 版本兼容性检查
import sys

if sys.version_info < (3, 6):
    raise RuntimeError("需要 Python 3.6 或更高版本")
elif sys.version_info < (3, 8):
    # Python 3.6-3.7
    print(f"当前版本: {sys.version_info.major}.{sys.version_info.minor}")
    print("注意：= 调试规范不可用")
else:
    # Python 3.8+
    x = 42
    print(f"{x=}")  # x=42
```

---

## 5. 总结

### 5.1 本文内容回顾

- **f-string 基础**：以 `f` 为前缀的字符串字面量，使用 `{}` 嵌入表达式，是 Python 3.6+ 推荐的字符串格式化方式。
- **基本语法**：单双三引号支持、花括号转义、嵌套使用等规则。
- **格式化规范**：数值格式化（宽度、填充、对齐、科学计数法、百分比）、字符串格式化（对齐、截断）、日期时间格式化（各种格式代码）。
- **高级特性**：`=` 自引用调试规范、条件表达式、函数调用、`!r`/`!s`/`!a` 转换标志。
- **最佳实践**：优先使用 f-string、调试时用 `=` 规范、数值格式化考虑可读性、避免复杂表达式。
- **原理**：编译时转换、__format__ 协议、性能特性分析。

### 5.2 读完本文你应能掌握

- 说明 f-string 的基本语法和相对于其他格式化方式的优势。
- 使用 f-string 进行变量插入、表达式计算、函数调用。
- 使用格式化规范精确控制数值（`.2f`、`：,`等）和字符串（`：>10`、`：.5`等）的输出格式。
- 使用 `=` 调试规范进行快速调试输出。
- 解释 f-string 与 % 格式化、format() 方法的区别，并能根据场景选择合适的格式化方式。
- 在实际项目中应用 f-string 的最佳实践，提高代码可读性和维护性。

### 5.3 延伸方向

- **自定义类的格式化**：通过实现 `__format__` 方法，让自定义类支持 f-string 格式化规范。
- **模板字符串**：对于复杂的消息模板，可以了解 `string.Template` 或 Jinja2 等模板引擎。
- **pathlib 路径格式化**：结合 pathlib 模块，使用 f-string 格式化文件路径。
- **正则表达式与 f-string**：在正则表达式中使用 f-string 动态构建模式。
- **性能调优**：在高吞吐量场景下，测试和比较不同格式化方式的性能。
