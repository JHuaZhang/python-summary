---
group:
  title: 【11】函数基础
  order: 11
order: 2
title: 函数定义与调用
nav:
  title: Python基础
  order: 1
---

# 函数定义与调用

## 1. 介绍

### 1.1 什么是函数定义与调用

在 Python 中，使用一个函数分为两步：**定义**和**调用**。

**定义**是用 `def` 关键字告诉 Python："我要创建一个函数，名字叫 X，参数是 Y，函数体是 Z"。定义只是"注册"了一个函数，定义时函数体内的代码并不会执行。

**调用**是在函数名后加括号，告诉 Python："现在立刻执行这个函数的代码，把括号里的值作为参数传进去"。调用是函数体内代码实际执行的时刻。

这个关系可以用一句话概括：**定义一次，调用任意多次**。定义是写配方，调用是按配方做菜。

### 1.2 在 Python 知识体系中的位置

函数定义与调用是 Python 从"写语句"到"组织代码"的入口。它承接了变量、运算、条件判断、循环等基础语法，是后续学习参数传递、作用域、装饰器、类等内容的前提。

在函数知识体系中，本篇聚焦于"怎么创建函数"和"怎么使用函数"，属于函数学习的起点。

### 1.3 最简示例

从一个最小的函数定义和调用开始：

```python
def greet(name):
    return f"你好，{name}！"


result = greet("Python")
print(result)
```

运行结果：

```text
你好，Python！
```

- `def greet(name):` 是**定义**——创建一个名为 `greet`、接收一个参数 `name` 的函数
- `greet("Python")` 是**调用**——传入 `"Python"`，执行函数体，获取返回值
- `result = ...` 将返回值赋值给变量

---

## 2. 核心内容

### 2.1 `def` 关键字与基本语法

#### 2.1.1 函数定义语法

`def` 是 Python 定义函数的唯一关键字。完整的函数定义语法：

```python
def 函数名(参数列表):
    """文档字符串（可选）"""
    函数体
    return 返回值  # 可省略
```

**语法规则**：

- `def` 必须小写，是保留关键字
- 函数名后必须有括号 `()`，即使没有参数
- 括号后必须有冒号 `:`
- 函数体必须**缩进**（通常 4 个空格）
- 冒号和缩进共同界定函数体的范围，从冒号下一行开始，到缩进解除为止

**最精简的函数**（什么也不做）：

```python
def do_nothing():
    pass  # pass 是占位符语句，让空函数体语法合法
```

**验证**：即使函数体只有 `pass`，它也是一个合法的函数对象：

```python
def do_nothing():
    pass

print(type(do_nothing))   # 输出：<class 'function'>
print(callable(do_nothing))  # 输出：True
```

每个 `def` 定义都创建了一个类型为 `function` 的可调用对象，函数名就是指向这个对象的变量。这就意味着函数名可以像变量一样被重新赋值、传递。

#### 2.1.2 函数命名规则

函数名遵循 Python 标识符命名规则，此外还有社区约定：

| 规则 | 示例 | 说明 |
|------|------|------|
| 全小写 + 下划线分隔 | `calculate_area` | PEP 8 推荐风格 |
| 动词或动词短语开头 | `get_user`, `compute_total` | 函数是"动作" |
| 布尔判断用 `is_` / `has_` 前缀 | `is_valid`, `has_permission` | 表明返回 True/False |
| 转换类用 `to_` / `convert_` 前缀 | `to_fahrenheit`, `convert_to_int` | 表明转换语义 |
| 避免 Python 内置名 | 不要取名为 `len`, `print`, `list` | 会覆盖内置函数 |

**正确示例**：

```python
def calculate_average(scores): ...   # 全小写 + 下划线
def is_even(n): ...                  # is_ 前缀，布尔返回值
def convert_to_celsius(f): ...       # convert_ 前缀，转换类
def get_user_email(user_id): ...     # get_ 前缀，获取类
```

#### 2.1.3 函数名指向函数对象

`def` 创建的函数是一个对象，函数名是指向它的变量。这意味着你可以把函数名赋值给另一个变量，通过新变量也能调用：

```python
def greet(name):
    return f"你好，{name}！"


say_hello = greet  # 把函数对象赋值给新变量
print(say_hello("小明"))  # 输出：你好，小明！
print(say_hello is greet)  # 输出：True —— 同一个对象
```

### 2.2 定义顺序与调用规则

#### 2.2.1 先定义，后调用

Python 要求函数**在被调用之前必须已经定义**。这是因为 Python 是解释执行语言——执行到调用语句时，需要函数名在当前命名空间中已经存在。

```python
# ✅ 正确：先定义，后调用
def say_hello():
    print("Hello!")

say_hello()  # Hello!
```

```python
# ❌ 错误：先调用，后定义
say_bye()  # NameError: name 'say_bye' is not defined

def say_bye():
    print("Bye!")
```

这个规则的本质是：`def` 语句是一行**可执行语句**，它被执行时才创建函数对象并将其绑定到函数名。不像某些编译型语言在编译阶段就解析了所有函数声明。

#### 2.2.2 多次调用

同一个函数可以被调用任意多次，每次可以传入不同的参数：

```python
def greet(name):
    return f"你好，{name}！"


print(greet("小明"))
print(greet("小红"))
print(greet("小刚"))
```

运行结果：

```text
你好，小明！
你好，小红！
你好，小刚！
```

这正是函数的价值所在：定义一次逻辑，在需要的地方随时调用，每次用不同的数据驱动。

#### 2.2.3 函数内部调用其他函数

函数的函数体内可以调用任何已经定义的其他函数（包括内置函数和自定义函数）：

```python
def add_tax(price, tax_rate=0.13):
    """计算含税价格"""
    return price * (1 + tax_rate)


def format_price(price):
    """格式化价格"""
    return f"¥{price:.2f}"


def show_price(price):
    """展示含税价格——内部调用两个函数"""
    taxed = add_tax(price)           # 调用 add_tax
    formatted = format_price(taxed)   # 调用 format_price
    print(f"原价 ¥{price:.2f} → 含税 {formatted}")


show_price(100)
```

运行结果：

```text
原价 ¥100.00 → 含税 ¥113.00
```

`show_price` 自己不计算含税价格也不做格式化——它用函数名"委托"给专门做这件事的函数。这种"函数调用函数"的组合方式是构建复杂逻辑的基础。

#### 2.2.4 递归调用（简介）

函数还可以调用自身，这称为**递归**：

```python
def factorial(n):
    """计算阶乘 n! = n * (n-1) * ... * 1"""
    if n <= 1:
        return 1
    return n * factorial(n - 1)  # 调用自身


print(factorial(5))  # 输出：120
```

递归是一种强大的思考方式，但需要注意设置终止条件（`if n <= 1: return 1`），否则会导致无限递归最终栈溢出。

### 2.3 函数体与缩进规则

#### 2.3.1 缩进是语法要求

Python 用缩进（而非大括号 `{}` 或 `begin/end`）来界定函数体的范围。冒号 `:` 标志着函数体的开始，**接下来所有缩进级别一致的代码行都属于函数体**。

```python
def classify_number(n):
    # 以下三行缩进相同，都属于函数体
    if n > 0:
        return "正数"    # 更多缩进，属于 if 块
    elif n < 0:
        return "负数"    # 更多缩进，属于 elif 块
    else:
        return "零"      # 更多缩进，属于 else 块
```

函数体结束后，恢复到函数定义级别缩进的代码不再属于该函数：

```python
def my_function():
    print("这行属于函数体")

print("这行不属于函数体，它是模块级代码")
```

**缩进要求**：
- 通常使用 **4 个空格**（PEP 8 推荐）
- 在同一函数内**必须统一**——不要混用空格和 Tab
- 缩进不正确会引发 `IndentationError`

#### 2.3.2 函数体可以包含任意合法代码

函数体内可以写任何合法的 Python 代码——条件判断、循环、异常处理、变量赋值、调用其他函数等：

```python
def find_primes(limit):
    """找出 [2, limit] 范围内的所有质数"""
    if limit < 2:
        return []

    is_prime = [True] * (limit + 1)
    is_prime[0] = is_prime[1] = False

    for i in range(2, int(limit ** 0.5) + 1):
        if is_prime[i]:
            for j in range(i * i, limit + 1, i):
                is_prime[j] = False

    return [i for i in range(2, limit + 1) if is_prime[i]]


print(find_primes(50))
# 输出：[2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]
```

这个函数体内包含了条件判断、列表初始化、嵌套循环和列表推导式——展示了函数体可以容纳任意复杂度的逻辑。

#### 2.3.3 空函数体用 `pass`

当你需要一个函数框架但暂时不想写实现时，用 `pass` 语句填充：

```python
def process_data(raw_data):
    """数据预处理函数——待实现"""
    pass


def validate_input(user_input):
    """输入验证——待实现"""
    pass
```

`pass` 是一个**什么都不做的语句**，它存在的唯一目的是让语法合法——Python 不允许空代码块。这种"先占位后实现"的方式常用于制定接口框架。

没有 `pass` 会怎样？

```python
# 错误：空函数体会引发 IndentationError
def unfinished():
    # 缩进块不能为空
```

### 2.4 文档字符串（docstring）

#### 2.4.1 什么是文档字符串

文档字符串是函数定义中第一行出现的**字符串字面量**（通常用三引号 `"""` 包裹），用于描述函数的用途、参数和返回值。它不是注释——它在运行时保留为函数对象的 `__doc__` 属性，`help()` 函数可以读取它。

```python
def calculate_bmi(weight_kg, height_m):
    """计算身体质量指数（BMI）

    BMI = 体重(kg) / 身高(m)²

    参数：
        weight_kg: 体重，单位千克
        height_m: 身高，单位米

    返回：
        BMI 数值

    示例：
        >>> calculate_bmi(70, 1.75)
        22.86
    """
    return weight_kg / (height_m * height_m)
```

查看文档字符串的两种方式：

```python
# 方式1：help() —— 格式化输出
help(calculate_bmi)

# 方式2：__doc__ 属性 —— 获取原始字符串
print(calculate_bmi.__doc__)
```

运行 `help(calculate_bmi)` 的输出：

```text
Help on function calculate_bmi in module __main__:

calculate_bmi(weight_kg, height_m)
    计算身体质量指数（BMI）

    BMI = 体重(kg) / 身高(m)²

    参数：
        weight_kg: 体重，单位千克
        height_m: 身高，单位米

    返回：
        BMI 数值

    示例：
        >>> calculate_bmi(70, 1.75)
        22.86
```

#### 2.4.2 单行 vs 多行文档字符串

**单行文档字符串**：简单函数用一行描述即可，三引号放在同一行：

```python
def is_even(n):
    """判断一个整数是否为偶数"""
    return n % 2 == 0
```

**多行文档字符串**：复杂函数推荐按风格规范书写：

```python
def send_email(to, subject, body, cc=None, bcc=None):
    """发送邮件。

    Args:
        to: 收件人邮箱地址
        subject: 邮件主题
        body: 邮件正文
        cc: 抄送人邮箱地址（可选）
        bcc: 密送人邮箱地址（可选）

    Returns:
        bool: 发送成功返回 True，失败返回 False

    Raises:
        ValueError: 收件人地址为空时抛出
    """
    if not to:
        raise ValueError("收件人地址不能为空")
    print(f"邮件已发送至 {to}")
    return True
```

#### 2.4.3 常见文档字符串风格

| 风格 | 示例 | 特点 |
|------|------|------|
| **PEP 257** | 首行概述 + 空行 + 详细描述 | Python 官方推荐，灵活 |
| **Google 风格** | `Args:` / `Returns:` / `Raises:` | 结构清晰，可读性高 |
| **NumPy 风格** | `Parameters` / `Returns` 用 `---` 分隔 | 科学计算领域常用 |
| **Sphinx 风格** | `:param:` / `:type:` / `:return:` | 适合自动生成文档 |

Python 社区没有强制的唯一标准，但推荐在项目内**统一使用一种风格**。Google 风格因其简洁清晰而在开源项目中广泛使用。

#### 2.4.4 docstring 与普通注释的区别

| 维度 | 文档字符串 (`"""..."""`) | 普通注释 (`# ...`) |
|------|------------------------|-------------------|
| 运行时存在 | 是，保存在 `__doc__` 属性中 | 否，运行时被丢弃 |
| 可通过 `help()` 查看 | 是 | 否 |
| 位置 | 函数定义后的第一行 | 任何位置 |
| 用途 | 描述"这个函数做什么" | 解释"这一行为什么这么写" |
| 影响重构工具 | 是（IDE 可提取展示） | 否 |

```python
def calculate_tax(income, rate=0.13):
    """计算应缴税款"""           # ← 文档字符串（描述函数整体用途）
    # 免税额 5000 元              # ← 普通注释（解释下一行为什么减 5000）
    taxable = max(0, income - 5000)
    return taxable * rate
```

### 2.5 `return` 语句详解

#### 2.5.1 return 的基本用法

`return` 语句做两件事：**终止函数执行**和**向调用者返回一个值**。

```python
def square(x):
    return x * x  # 计算并返回结果


result = square(5)
print(result)  # 输出：25
```

函数执行到 `return` 后**立即停止**，`return` 之后的所有代码都不会被执行。这个特性常用于**提前退出**。

#### 2.5.2 返回单个值

返回一个具体对象——这是最常见的形式：

```python
def calculate_bmi(weight_kg, height_m):
    return weight_kg / (height_m * height_m)
```

#### 2.5.3 返回多个值（实质上返回元组）

可以在 `return` 后写多个值（用逗号分隔），Python 会自动将它们打包成一个元组：

```python
def min_max_avg(numbers):
    """返回列表的最小值、最大值和平均值"""
    if not numbers:
        return None
    return min(numbers), max(numbers), sum(numbers) / len(numbers)


scores = [85, 92, 78, 95, 88]
result = min_max_avg(scores)
print(result)        # 输出：(78, 95, 87.6)
print(type(result))  # 输出：<class 'tuple'>
```

调用方可以用多变量解包来接收：

```python
lowest, highest, average = min_max_avg(scores)
print(f"最低：{lowest}，最高：{highest}，平均：{average:.1f}")
# 输出：最低：78，最高：95，平均：87.6
```

**注意**：这不是真的返回了"多个值"，Python 函数只能返回**一个对象**——`return a, b, c` 实际上是 `return (a, b, c)`。

#### 2.5.4 return 后跟表达式

`return` 后可以跟任意表达式——Python 先对表达式求值，再返回结果：

```python
def compound_interest(principal, rate, years):
    """复利计算"""
    return principal * (1 + rate) ** years


print(compound_interest(10000, 0.05, 3))  # 输出：11576.25
```

表达式先被计算为 `11576.25`，然后这个值被返回。这意味着你不需要把结果赋值给一个临时变量再返回。

#### 2.5.5 return 不带值（返回 None）

`return` 后面不跟任何值（或函数根本没有 `return` 语句）时，函数返回 `None`：

```python
def print_banner(text):
    """打印横幅——有输出但无返回值"""
    print("=" * (len(text) + 8))
    print(f"||  {text}  ||")
    print("=" * (len(text) + 8))
    return  # 显式 return 但不带值


def log_message(msg):
    """记录消息——没有 return 语句"""
    print(f"[LOG] {msg}")
    # 没有 return，隐式返回 None


print(print_banner("通知"))  # 输出横幅文字后打印：None
print(log_message("启动"))   # 输出日志后打印：None
```

`None` 的含义是"没有有意义的值"。当函数的主要目的是**产生副作用**（打印、写入文件、发送请求等）而非产出数据时，返回 `None` 是合理的。但当你写 `result = some_func()` 然后检查 `result is None` 时，要问问自己这个函数是否应该显式返回一个有意义的值。

#### 2.5.6 return 的提前退出特性

`return` 最常见的实用模式之一是**卫语句**——在函数开头检查异常条件，提前返回：

```python
def safe_divide(a, b):
    """安全除法——先检查再执行"""
    if b == 0:
        print("错误：除数不能为 0")
        return None                     # ← 提前退出
    if not isinstance(a, (int, float)) or not isinstance(b, (int, float)):
        print("错误：参数必须是数字")
        return None                     # ← 提前退出
    return a / b                        # ← 只有正常情况才执行到这一步
```

这种写法让"正常路径"的代码保持在函数的主干上，不需要嵌套多层 `if-else`。

#### 2.5.7 多条件分支返回

当函数有多个处理分支时，每个分支可以有自己的 `return`：

```python
def get_ticket_price(age):
    """根据年龄返回票价"""
    if age < 0:
        return None         # 非法年龄
    if age < 6:
        return 0            # 婴幼儿免费
    if age < 18:
        return 50           # 未成年人半价
    if age < 60:
        return 100          # 成人全价
    return 0                # 老年人免费（兜底）


for age in [3, 15, 30, 65, -1]:
    print(f"年龄 {age:>2} → 票价：{get_ticket_price(age)}")
```

运行结果：

```text
年龄  3 → 票价：0
年龄 15 → 票价：50
年龄 30 → 票价：100
年龄 65 → 票价：0
年龄 -1 → 票价：None
```

这种"扁平"的写法利用 `return` 的提前退出特性避免了深层嵌套，每个年龄段的逻辑一目了然。

#### 2.5.8 return 与 print 的本质区别

这是初学者最容易混淆的概念：

```python
def add_with_return(a, b):
    return a + b

def add_with_print(a, b):
    print(a + b)


# return：结果可以继续使用
r = add_with_return(3, 5)
print(f"两倍：{r * 2}")             # 输出：两倍：16

# print：屏幕上看到 8，但变量拿到的是 None
r = add_with_print(3, 5)           # 屏幕输出：8
print(f"add_with_print 返回了：{r}") # 输出：add_with_print 返回了：None
```

`return` 让函数可以成为数据流的**管道**——结果传递到下一个处理环节。`print` 只是把信息展示在屏幕上，调用者拿不到这个信息。用 `return` 的函数是"生产者"，用 `print` 的函数是"喊话者"。

---

## 3. 最佳实践

### 3.1 推荐 vs 不推荐写法对比

#### 3.1.1 函数体不要太长

**不推荐**：一个函数做了太多事

```python
# 处理订单：验证→计算→保存→发邮件→打日志全在一个函数里
def process_order(order):
    # 验证（50 行）
    ...
    # 计算价格（30 行）
    ...
    # 保存数据库（20 行）
    ...
    # 发送邮件（25 行）
    ...
    # 打日志（10 行）
    ...
```

**推荐**：拆分为多个职责单一的小函数

```python
def validate_order(order):
    """验证订单合法性"""
    ...

def calculate_price(order):
    """计算订单价格"""
    ...

def save_order(order):
    """保存订单到数据库"""
    ...

def notify_user(order):
    """通知用户订单状态"""
    ...

def process_order(order):
    """处理订单——组合各步骤"""
    if not validate_order(order):
        return False
    order["price"] = calculate_price(order)
    save_order(order)
    notify_user(order)
    return True
```

**原因**：每个小函数可以独立测试、独立修改、独立复用。`process_order` 只充当编排者，不包含具体逻辑。

#### 3.1.2 用卫语句替代深层嵌套

**不推荐**：层层嵌套的 if-else

```python
def get_user_discount(user):
    if user:
        if user.get("is_active"):
            if user.get("vip_level"):
                if user["vip_level"] >= 3:
                    return 0.3
                else:
                    return 0.1
            else:
                return 0.05
    return 0
```

**推荐**：用 return 提前退出，扁平化逻辑

```python
def get_user_discount(user):
    if not user:
        return 0
    if not user.get("is_active"):
        return 0
    if not user.get("vip_level"):
        return 0.05
    if user["vip_level"] >= 3:
        return 0.3
    return 0.1
```

**原因**：扁平化代码阅读顺序就是执行顺序，不需要在脑中维护嵌套状态。每行 `return` 都是一个清晰的"出口"。

#### 3.1.3 函数名要清晰表达意图

**不推荐**：含混的命名

```python
def proc(d, flag):        # proc 做什么？d 是什么数据？flag 控制什么？
    ...
```

**推荐**：自解释的命名

```python
def process_user_data(user_data, send_notification):
    """处理用户数据，可选择是否发送通知"""
    ...
```

**原因**：好的函数名是一行文档。`proc(d, flag)` 需要读者钻进代码才能理解，`process_user_data(user_data, send_notification)` 调用处一看就懂。

#### 3.1.4 每个函数只返回单一类型

**不推荐**：同一函数返回不同类型

```python
def get_user(user_id):
    # 在不同情况下返回不同含义的值
    ...
    if found:
        return {"name": "张三", "age": 25}  # 返回字典
    else:
        return -1  # 返回整数表示错误
```

**推荐**：返回统一类型，用特殊值或异常表示错误

```python
def get_user(user_id):
    # 始终返回字典或 None
    ...
    if found:
        return {"name": "张三", "age": 25}
    return None  # 调用方统一处理 None
```

**原因**：调用者不需要用 `isinstance(result, dict)` 判断返回类型，只需检查 `if result is None`。

### 3.2 常见错误模式及修正

**错误一：忘记写冒号 `:`**

```python
def greet(name)   # ❌ SyntaxError
    print(f"Hello, {name}")
```

正确写法：

```python
def greet(name):  # ✅ 冒号不能少
    print(f"Hello, {name}")
```

**错误二：缩进不一致**

```python
def calc(x):
    y = x * 2
      return y   # ❌ IndentationError: 缩进级别不一致
```

正确写法：

```python
def calc(x):
    y = x * 2
    return y     # ✅ 同一级别统一缩进
```

**错误三：把函数调用和函数对象搞混**

```python
def handler():
    print("处理事件")

# ❌ 注册时写了括号——立即调用了函数
button.on_click = handler()  # handler 被立即执行，返回值 None 被赋值
```

正确写法：

```python
# ✅ 注册时不写括号——传递函数对象，稍后需要时才调用
button.on_click = handler  # 把函数对象传递过去

# 稍后在按钮被点击时：
# button.on_click() 才会实际执行 handler 的代码
```

**错误四：想在 return 之后写代码**

```python
def process(data):
    result = do_something(data)
    return result
    save_log(result)  # ❌ 永远不会执行！return 后函数已退出
```

正确写法：

```python
def process(data):
    result = do_something(data)
    save_log(result)  # ✅ 先保存日志
    return result     # ✅ 再返回结果
```

### 3.3 可读性 / 可维护性取舍建议

1. **先追求正确，再追求优雅**：让代码先跑起来，然后再重构。`def` 本身就是重构的第一步——从一堆语句中提取出一个有名字的函数。
2. **文档字符串不是可选项**：即使是只有三行的简单函数，加一行文档字符串的成本极低，但几个月后回头看代码时的收益极大。
3. **return 要放对位置**：`return` 不只是"返回结果"，更是"控制流"。合理使用 `return` 能让代码从层层嵌套变为扁平主干。
4. **命名是一等公民**：花 30 秒想一个好函数名，比花 3 分钟读一段没有命名的代码更划算。

---

## 4. 原理

### 4.1 `def` 是运行时可执行语句

`def` 不是编译时声明，而是 Python 运行时真正执行的语句。当你写下：

```python
def add(a, b):
    return a + b
```

Python 解释器执行这段代码时，实际做的是：
1. 创建一个函数对象（类型为 `function`，包含代码对象、参数定义等）
2. 将函数对象绑定到变量名 `add`

可以验证这一点：

```python
def add(a, b):
    return a + b

print(type(add))       # 输出：<class 'function'>
print(add.__name__)    # 输出：'add'
print(add.__code__)    # 输出：<code object add at 0x...>
```

`add.__code__` 是编译后的字节码对象，它包含了函数的代码逻辑。而 `add` 本身是 `function` 类型的一个实例，包含了对代码对象的引用和对全局命名空间的引用。

这就是为什么**函数必须在调用之前定义**：`def` 必须在运行到之前被执行，函数对象才会被创建。

### 4.2 函数对象的三要素

Python 中的每个函数对象都携带三个关键信息：

| 要素 | 属性 | 说明 |
|------|------|------|
| **代码对象** | `__code__` | 编译后的字节码，定义"执行什么" |
| **全局命名空间** | `__globals__` | 指向定义函数时的模块全局变量字典 |
| **闭包变量** | `__closure__` | 如果函数引用了外部自由变量，闭包就存在 |

```python
x = 10  # 模块全局变量

def multiply(n):
    return n * x  # 引用了全局变量 x

print(multiply.__globals__['x'])  # 输出：10 —— 可以访问到 x
print(multiply.__closure__)       # 输出：None —— 没有闭包
```

当函数内部引用一个模块级别的全局变量 `x` 时，`__globals__` 字典中包含了 `x`。如果 `x` 被修改，函数的下一次调用会看到新值——这种动态绑定是 Python 函数的重要特性。

### 4.3 `return` 的本质：将值压入调用栈

当函数执行 `return` 时底层发生了什么：

```text
调用方执行 multiply(3, 5)
  ↓
1. Python 创建一个新的栈帧（stack frame），存放局部变量 a=3, b=5
2. 执行函数体中的字节码指令，计算 a * b → 15 存在栈上
3. 执行 RETURN_VALUE 字节码指令：
   - 将栈顶的值（15）保存为返回值
   - 销毁当前栈帧
   - 将控制权和返回值交还给调用方
4. 调用方收到 15，继续执行
```

用简化的字节码视角验证：

```python
import dis

def multiply(a, b):
    result = a * b
    return result

dis.dis(multiply)
```

输出：

```text
  2           0 LOAD_FAST                0 (a)
              2 LOAD_FAST                1 (b)
              4 BINARY_MULTIPLY
              6 STORE_FAST               2 (result)

  3           8 LOAD_FAST                2 (result)
             10 RETURN_VALUE
```

`RETURN_VALUE` 是 `return` 对应的字节码指令——它将当前栈顶的值返回给调用者并结束当前栈帧。这解释了为什么 `return` 之后的代码永远不会执行：栈帧在 `RETURN_VALUE` 处已被销毁。

---

## 5. 总结

本文围绕 Python 函数的定义与调用展开，主要介绍了以下内容：

- `def` 关键字是 Python 定义函数的唯一方式，完整的函数定义包含函数名、参数列表、冒号、缩进函数体和可选的 `return` 语句
- 函数命名遵循 PEP 8 规范：全小写加下划线，动词开头，`is_` 前缀用于布尔函数
- 函数必须先定义后调用，同一个函数可被任意多次调用，函数体内可调用其他已定义的函数
- Python 用缩进（而非大括号）界定函数体范围，空函数体必须用 `pass` 占位
- 文档字符串（docstring）是函数的"说明书"，通过 `help()` 和 `__doc__` 属性查看，常用风格有 PEP 257 和 Google 风格
- `return` 语句终止函数执行并向调用者返回值：可返回单个值、多个值（实质是元组）、表达式结果或 `None`
- 最佳实践包括：拆分大函数为单一职责小函数、用卫语句替代深层嵌套、函数名自解释、统一返回类型
- 原理层面：`def` 是运行时可执行语句，函数对象包含代码对象和全局命名空间，`return` 由 `RETURN_VALUE` 字节码指令实现
