---
group:
  title: 【11】函数基础
  order: 11
order: 1
title: 函数概述与基本概念
nav:
  title: Python基础
  order: 1
---

# 函数概述与基本概念

## 1. 介绍

### 1.1 什么是函数

**函数（Function）是一段有名字的、可重复使用的代码块，它接收输入，执行特定逻辑，然后返回输出。** 简单说，函数就是把一系列操作"打包"起来，给它起个名字，以后需要时直接喊这个名字就行，不需要把那些操作再写一遍。

在 Python 中，函数是**最核心的代码组织单元**之一。你写的每一段有意义的逻辑，最终都会被放进各种函数里。无论是写一个小脚本还是一个大型项目，本质上都是在定义函数、调用函数、组合函数。

**类比**：函数就像工厂里的一台机器——你把原料（参数）送进去，机器按照预设的流程（函数体）对原料进行加工，最后产出产品（返回值）。你不需要每次都手工做一遍加工流程，只需要操作这台机器就行了。不同的机器做不同的事，把它们组合起来就形成了一条生产线。

### 1.2 在 Python 知识体系中的位置

函数位于 Python 语言从"写语句"到"组织代码"的过渡层：

- **基础层**（变量、数据类型、运算符）：学习"数据怎么表示和计算"
- **流程控制层**（条件判断、循环）：学习"代码的执行顺序怎么控制"
- **函数层**（定义函数、调用函数、参数传递）：学习"怎么把代码组织成可复用的单元"——**你当前所在的层次**
- **进阶组织层**（模块、类、包）：学习"怎么把函数组织成更大的结构"

函数是"写脚本"和"写程序"的分水岭。没有函数时，你只是在顺序执行一条条语句；有了函数，你开始**设计**代码的结构。

### 1.3 最简示例

用一个最小例子感受函数长什么样：

```python
def greet(name):
    """向指定的人打招呼"""
    return f"你好，{name}！欢迎学习 Python。"


result = greet("小明")
print(result)
```

运行结果：

```text
你好，小明！欢迎学习 Python。
```

这个例子包含了函数的所有基本要素：`def` 关键字定义、函数名 `greet`、参数 `name`、函数体（缩进代码块）、文档字符串和 `return` 返回值。

**不使用函数时**的等价写法：

```python
# 每需要一次打招呼，就要重复写这段代码
name = "小明"
result = f"你好，{name}！欢迎学习 Python。"
print(result)

name = "小红"
result = f"你好，{name}！欢迎学习 Python。"
print(result)
```

有了函数后，逻辑只写一次，调用时可以传入不同的参数产生不同的输出。随着代码量增长，这种"定义一次，多次使用"的优势会越来越明显。

---

## 2. 核心内容

### 2.1 函数的四个基本组成部分

每个 Python 函数都由四个要素构成，缺一不可：

```python
def 函数名(参数列表):
    """文档字符串（可选但推荐）"""
    函数体
    return 返回值  # 可省略
```

用文字拆解这四个部分：

| 组成部分 | 作用 | 类比 |
|---------|------|------|
| **函数名** | 给代码块起名字，后续用这个名字来调用 | 机器的名称标签，比如"粉碎机" |
| **参数列表** | 接收外部传入的数据，控制函数的行为 | 机器的进料口，放什么原料就处理什么 |
| **函数体** | 执行具体逻辑的代码块（必须缩进） | 机器内部的加工程序 |
| **返回值** | 把处理结果传递给外部调用者 | 机器的出料口，产出加工后的产品 |

通过具体代码理解各部分：

```python
def calculate_bmi(weight_kg, height_m):
    """计算身体质量指数 BMI"""
    bmi = weight_kg / (height_m * height_m)
    return bmi


# 函数名: calculate_bmi
# 参数列表: weight_kg, height_m
# 函数体: bmi = weight_kg / (height_m * height_m)
# 返回值: bmi
```

```python
my_bmi = calculate_bmi(70, 1.75)
print(f"BMI：{my_bmi:.1f}")
```

运行结果：

```text
BMI：22.9
```

**函数名**不仅是一个标识符，它还承载了**语义**——一个好的函数名能让调用者一眼看懂这个函数做什么，而不需要阅读函数体。`calculate_bmi` 比 `calc` 或 `f1` 好得多。

**参数列表**可以是空的（括号里什么都不写），也可以有多个参数。参数的数量和类型决定了函数的**通用性**——参数越多，函数能应对的输入场景越多。`calculate_bmi(weight, height)` 可以计算任何人的 BMI，但如果写成 `calculate_bmi()` 且内部硬编码了体重和身高，那就只能算一个人的。

**返回值**是函数与外部世界沟通的桥梁。一个函数如果只做"事"而不返回结果（比如打印日志），那么它的调用者无法获取处理后的数据。没有 `return` 语句的函数隐式返回 `None`。

### 2.2 函数的分类

Python 中的函数可以从多个维度进行分类。理解这些分类能帮你建立函数的"坐标系"，知道什么时候用什么类型的函数。

#### 2.2.1 按来源分类：内置函数 vs 自定义函数

```text
Python 中的可调用对象
├── 内置函数（Built-in Functions）
│   ├── print(), len(), type(), input(), range()
│   ├── int(), float(), str(), bool(), list(), dict()
│   ├── abs(), round(), max(), min(), sum(), pow()
│   ├── sorted(), reversed(), enumerate(), zip(), map(), filter()
│   └── open(), help(), dir(), id(), isinstance()
│
├── 自定义函数
│   └── 使用 def 关键字定义的函数
│
└── 第三方库中的函数
    └── 通过 import 引入的函数，如 math.sqrt(), random.randint()
```

**内置函数**是 Python 解释器自带的开箱即用工具，不需要 `import` 任何模块即可直接调用。它们是 Python 最基础的 API，覆盖了类型转换、数学计算、序列操作、输入输出等高频需求。

```python
# 内置函数——开箱即用
print(len("Hello"))        # 输出：5
print(abs(-42))            # 输出：42
print(max(3, 7, 2, 9))    # 输出：9
print(sorted([3, 1, 2]))  # 输出：[1, 2, 3]
```

**自定义函数**是你通过 `def` 关键字自行定义的函数。每个 Python 程序最终都是在内置函数的基础上，通过自定义函数构建出特定领域的逻辑。

```python
# 自定义函数——按需定义
def is_even(n):
    """判断一个数是否为偶数"""
    return n % 2 == 0


print(is_even(10))  # 输出：True
print(is_even(7))   # 输出：False
```

**关键认知**：在 Python 中，内置函数和自定义函数**地位完全相同**，都是可调用对象，都可以赋值给变量、作为参数传递给其他函数：

```python
# 内置函数和自定义函数一视同仁
my_len = len          # 内置函数赋值给变量
my_is_even = is_even  # 自定义函数赋值给变量

print(my_len("abc"))  # 输出：3
print(my_is_even(4))  # 输出：True
```

| 维度 | 内置函数 | 自定义函数 |
|------|---------|-----------|
| 定义者 | Python 解释器（C 语言实现） | 开发者（Python 代码） |
| 是否需要 import | 不需要 | 跨文件时需要 |
| 覆盖范围 | 通用基础操作 | 特定业务逻辑 |
| 数量 | 约 70 个 | 无限，按需定义 |
| 可修改性 | 不能修改 | 随时修改 |

#### 2.2.2 按参数分类：无参函数 vs 有参函数

**无参函数**：括号里不接收任何输入，每次调用的行为完全相同。

```python
def show_welcome():
    """显示欢迎信息——不需要任何输入，行为固定"""
    print("=" * 40)
    print("欢迎使用 Python 学习工具！")
    print("=" * 40)


show_welcome()
```

运行结果：

```text
========================================
欢迎使用 Python 学习工具！
========================================
```

无参函数适合执行**固定的初始化操作**、**打印固定的提示信息**、**获取不依赖外部输入的当前状态**等场景。它的优势是调用最简洁，劣势是缺乏灵活性。

**有参函数**：接收外部传入的数据，不同输入产生不同输出。

```python
def greet_person(name, level="初学者"):
    """根据不同的输入产生不同的问候"""
    print(f"你好 {name}，欢迎加入 {level} 学习小组！")


greet_person("小红")
greet_person("小明", "进阶")
```

运行结果：

```text
你好 小红，欢迎加入 初学者 学习小组！
你好 小明，欢迎加入 进阶 学习小组！
```

有参函数是函数的主力形态。参数让函数从"只能做一件事"变成了"能做很多类似的事"——`greet_person` 可以问候任何人，而不是只能问候一个固定的人。

| 维度 | 无参函数 | 有参函数 |
|------|---------|---------|
| 输入 | 无 | 有（必须或可选） |
| 灵活性 | 低，行为固定 | 高，输入决定输出 |
| 调用方式 | `func()` | `func(arg1, arg2)` |
| 典型场景 | 初始化、固定输出 | 数据计算、条件操作 |

#### 2.2.3 按返回值分类：有返回值 vs 无返回值

**有返回值的函数**：执行计算后将结果通过 `return` 传递给调用方。

```python
def celsius_to_fahrenheit(celsius):
    """摄氏温度转华氏温度——返回计算结果"""
    return celsius * 9 / 5 + 32


temp_f = celsius_to_fahrenheit(36.5)
print(f"36.5°C = {temp_f:.1f}°F")

# 返回值可以继续参与后续计算
temp_f_plus_10 = celsius_to_fahrenheit(36.5) + 10
print(f"转换后加 10：{temp_f_plus_10:.1f}°F")
```

运行结果：

```text
36.5°C = 97.7°F
转换后加 10：107.7°F
```

有返回值的函数像一个"数据加工厂"——给你原料，还给你产品。返回的结果可以被赋值给变量、参与后续运算、作为其他函数的参数，这使得函数可以**链式组合**。

**无返回值的函数**：只执行操作，不返回有意义的数据。这类函数内部通常包含 `print()`、文件写入、网络请求等"副作用"操作。

```python
def log_activity(activity_name):
    """记录活动——产生副作用（打印日志），不返回数据"""
    from datetime import datetime
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {activity_name}")


result = log_activity("用户登录")
print(f"返回值：{result}")
```

运行结果：

```text
[2026-09-22 09:24:46] 用户登录
返回值：None
```

无返回值的函数隐式返回 `None`。它的价值在于**副作用**——改变了程序的状态（打印到屏幕、写入文件、修改全局变量等），而非产出数据。

| 维度 | 有返回值 | 无返回值 |
|------|---------|---------|
| 核心目的 | 产出数据 | 产生副作用 |
| `return` 语句 | 有 `return 值` | 无 `return` 或 `return` 无值 |
| 实际返回值 | 有意义的数据 | `None` |
| 能否链式组合 | 能，结果可继续参与运算 | 不能，拿到的是 `None` |
| 典型场景 | 计算、转换、查询 | 打印、记录日志、保存文件 |

### 2.3 为什么需要函数

函数解决了编写代码时的四个核心问题。理解这些问题能帮你明白函数不只是语法糖，而是**代码组织的必然选择**。

#### 2.3.1 避免重复——DRY 原则

DRY（Don't Repeat Yourself）是编程的核心原则之一：**每一段知识在系统中应当有唯一、明确、权威的表示。**

没有函数时，相同的逻辑散布在代码各处：

```python
# 糟糕：相同逻辑写了三遍
# 计算圆的面积——第一次
r1 = 5
area1 = 3.14159 * r1 * r1
print(f"半径 {r1} 的圆面积：{area1:.2f}")

# 计算圆的面积——第二次（完全重复的逻辑）
r2 = 10
area2 = 3.14159 * r2 * r2
print(f"半径 {r2} 的圆面积：{area2:.2f}")

# 计算圆的面积——第三次
r3 = 2.5
area3 = 3.14159 * r3 * r3
print(f"半径 {r3} 的圆面积：{area3:.2f}")
```

有了函数后：

```python
def circle_area(radius):
    """计算圆的面积"""
    return 3.14159 * radius * radius


# 逻辑只写一次，任意多次调用
for r in [5, 10, 2.5]:
    print(f"半径 {r} 的圆面积：{circle_area(r):.2f}")
```

重复代码的危害不只是"多写几行"——如果计算公式需要修改（比如改用 `math.pi`），没有函数时你要找到每一处手动修改，漏一处就产生 bug。有函数时只需改一处。

#### 2.3.2 封装复杂度——抽象分层

函数让你可以把复杂逻辑"装进盒子"，对外只暴露一个简洁的接口。调用者不需要知道盒子里的细节，只需要知道"给它什么，它返回什么"。

```python
def is_valid_email(email):
    """验证邮箱地址是否合法——内部逻辑复杂，但接口简单"""
    # 调用者不需要关心这些校验细节
    if "@" not in email:
        return False
    local, domain = email.rsplit("@", 1)
    if not local or not domain:
        return False
    if "." not in domain:
        return False
    if len(email) > 254:
        return False
    return True


# 调用者视角：一行调用，一个布尔结果
print(is_valid_email("user@example.com"))  # 输出：True
print(is_valid_email("not-an-email"))      # 输出：False
```

这种抽象能力让你可以**分层思考**——在高层用 `is_valid_email` 做业务判断，在底层再关注邮箱校验的具体规则。复杂系统的构建正是通过层层抽象实现的。

#### 2.3.3 可测试性和可维护性

独立的小函数天然适合单元测试——给一组输入，断言期望的输出：

```python
def add(a, b):
    return a + b


# 测试变得简单直观
assert add(1, 2) == 3
assert add(-1, 1) == 0
assert add(0, 0) == 0
```

如果把所有逻辑堆在一个大代码块里，测试和调试都会变得极其困难——你不知道错误出在哪一段逻辑。

#### 2.3.4 代码即文档——可读性

好的函数名本身就是**最有效的文档**。阅读下面两段代码，体会函数名带来的理解差异：

**没有函数时**——需要阅读代码细节才能理解意图：

```python
# 这段代码在做什么？需要读完每一行才能判断
temps = [36.5, 37.0, 36.8, 38.2, 36.3]
result = []
for t in temps:
    result.append(t * 9 / 5 + 32)
print(result)
```

**有了函数后**——函数名直接表达了意图：

```python
# 一眼看懂：把摄氏温度列表转换为华氏温度
def celsius_to_fahrenheit(c):
    return c * 9 / 5 + 32


temps_c = [36.5, 37.0, 36.8, 38.2, 36.3]
temps_f = [celsius_to_fahrenheit(t) for t in temps_c]
print(temps_f)
```

函数名 `celsius_to_fahrenheit` 本身就说明了这段代码在做什么，甚至不需要读函数体。代码的可读性直接决定了项目的可维护性——你写的代码不仅要让计算机理解，更要让包括三个月后的你在内的人类读者理解。

---

## 3. 实践示例

### 3.1 用函数组织一个小型工具

下面用一个完整的例子展示如何用函数组织一个简单但实用的工具——**学生成绩管理器**。这个例子综合运用了无参函数、有参函数、有返回值函数和无返回值函数等各种函数概念。

```python
def calculate_average(scores):
    """计算平均分"""
    if not scores:
        return 0
    return sum(scores) / len(scores)


def get_grade(score):
    """根据分数返回等级"""
    if score >= 90:
        return "优秀"
    elif score >= 80:
        return "良好"
    elif score >= 70:
        return "中等"
    elif score >= 60:
        return "及格"
    else:
        return "不及格"


def print_separator():
    """打印分隔线——无参无返回值函数"""
    print("-" * 40)


def print_student_report(name, scores):
    """打印单个学生的成绩报告"""
    avg = calculate_average(scores)
    grade = get_grade(avg)
    highest = max(scores)
    lowest = min(scores)

    print_separator()
    print(f"学生：{name}")
    print(f"各科成绩：{scores}")
    print(f"平均分：{avg:.1f}")
    print(f"最高分：{highest}  最低分：{lowest}")
    print(f"等级评定：{grade}")
    print_separator()


# 使用这些函数
scores_ming = [88, 92, 76, 85, 90]
scores_hong = [95, 89, 93, 91, 97]

print_student_report("小明", scores_ming)
print_student_report("小红", scores_hong)
```

运行结果：

```text
----------------------------------------
学生：小明
各科成绩：[88, 92, 76, 85, 90]
平均分：86.2
最高分：92  最低分：76
等级评定：良好
----------------------------------------
----------------------------------------
学生：小红
各科成绩：[95, 89, 93, 91, 97]
平均分：93.0
最高分：97  最低分：89
等级评定：优秀
----------------------------------------
```

这个例子体现了函数组织的几个关键设计思路：

- `calculate_average`：有参数有返回值，专注计算——只做一件事
- `get_grade`：有参数有返回值，负责等级映射——单一职责
- `print_separator`：无参数无返回值，纯副作用函数
- `print_student_report`：**组合者**——调用其他函数完成复杂任务，自身不包含任何计算逻辑

函数之间的调用关系形成了一张清晰的网络：

```text
print_student_report()
  ├── calculate_average()  →  返回平均分
  ├── get_grade()          →  返回等级
  ├── max()                →  返回最高分（内置函数）
  ├── min()                →  返回最低分（内置函数）
  └── print_separator()    →  打印分隔线
```

### 3.2 函数的组合优于大函数

把上面的 `print_student_report` 和一个"什么都在一个函数里"的版本对比：

```python
# 反模式：一个函数做了太多事情
def do_everything(name, scores):
    # 计算平均分
    total = 0
    for s in scores:
        total += s
    avg = total / len(scores)

    # 判断等级
    if avg >= 90:
        grade = "优秀"
    elif avg >= 80:
        grade = "良好"
    elif avg >= 70:
        grade = "中等"
    elif avg >= 60:
        grade = "及格"
    else:
        grade = "不及格"

    # 找最高最低
    highest = scores[0]
    lowest = scores[0]
    for s in scores:
        if s > highest:
            highest = s
        if s < lowest:
            lowest = s

    # 打印报告
    print("-" * 40)
    print(f"学生：{name}")
    print(f"各科成绩：{scores}")
    print(f"平均分：{avg:.1f}")
    print(f"最高分：{highest}  最低分：{lowest}")
    print(f"等级评定：{grade}")
    print("-" * 40)
```

| 维度 | 函数组合版 | 一个大函数版 |
|------|----------|------------|
| 平均分算法可复用 | 是，`calculate_average` 可被其他模块调用 | 否，逻辑嵌在大函数里 |
| 等级规则可独立测试 | 是，可单独测试 `get_grade` | 否，必须跑整个函数 |
| 代码可读性 | 高，每个函数名都是文档 | 低，需要通读才能理解 |
| 修改影响范围 | 小，改一个函数不影响其他 | 大，改一处可能影响全部 |

---

## 4. 常见误区与边界

**误区一：函数一定要有参数**

不是。有些操作逻辑固定、不依赖外部输入，用无参函数正好。`print_separator()` 不需要参数也能很好地完成它的任务。但要注意——如果无参函数内部使用了全局变量来获取数据，通常说明设计有问题。

**误区二：函数一定要有 return**

不是。`print()`、日志记录、文件保存等"执行动作"型操作不需要返回值。但如果你发现自己在写 `result = some_func()` 然后检查 `result` 是不是 `None`，那这个函数可能应该有返回值。

**误区三：内置函数比自定义函数特殊**

在 Python 中，两者地位完全平等。`len` 和你的 `calculate_average` 都是可调用对象，都可以被赋值、传参、作为返回值。Python 的"一切皆对象"哲学对函数同样适用。

**误区四：函数越小越好，越短越好**

函数的目标是**一个明确的职责**，不是字面意义上的"短"。一个 30 行的函数如果只做一件事且逻辑清晰，比三个 10 行的函数各自做了半件事要好。判断标准是：你能不能用一句话说清楚这个函数做什么？如果能，函数大小就是合适的。

**误区五：return 和 print 都能"输出"结果**

这是初学者最容易混淆的一点。`return` 把数据**交还给调用者**，数据可以继续参与后续运算。`print()` 把数据**显示到屏幕上**，调用者拿不到这个数据。

```python
def add_with_return(a, b):
    return a + b

def add_with_print(a, b):
    print(a + b)


# return：结果可以被继续使用
result = add_with_return(3, 5)
double = result * 2
print(f"两倍：{double}")  # 输出：两倍：16

# print：屏幕上看到了结果，但调用者拿不到
result = add_with_print(3, 5)  # 屏幕输出：8
print(f"函数返回了：{result}")   # 输出：函数返回了：None
```

用 `return` 的函数像一条"数据管道"——你可以把多个函数串联起来，数据在管道中流动。用 `print` 的函数像一个"广播喇叭"——喊完就没下文了。

---

## 5. 总结

本文围绕 Python 函数的基础概念展开，主要介绍了以下内容：

- 函数是一段有名字的、可重复使用的代码块，它是 Python 中最核心的代码组织单元，也是"写脚本"和"写程序"的分水岭
- 函数由四个基本要素构成：函数名、参数列表、函数体、返回值，每个要素都有明确的职责
- 函数可以按三个维度分类：按来源分为内置函数和自定义函数，按参数分为无参和有参函数，按返回值分为有返回和无返回函数
- 使用函数的四大价值：避免重复，封装复杂度，提升可测试性，以函数名充当文档
- 函数组合优于大函数，每个函数应该有一个明确、单一的职责
- 常见误区包括：return 和 print 的本质区别、函数不一定要有参数和返回值、内置函数和自定义函数地位平等
