---
group:
  title: 【01】初识python
  order: 1
order: 8
title: 注释规范
nav:
  title: Python基础
  order: 1
---

# 注释规范

## 1. 介绍

### 1.1 什么是注释

注释是写给人类看的代码说明文字，Python 解释器在执行时会跳过注释内容。注释的核心价值是让代码更易读、更易维护——几个月后你回来看代码，或者新人接手项目时，注释能大大降低理解成本。

Python 中的注释分为两大类：

```text
注释体系
├── 单行注释    →  以 # 开头，解释器忽略该行 # 后面的内容
├── 多行注释    →  连续多行 # 注释，或用三引号字符串"伪装"
└── 文档字符串  →  三引号字符串放在函数/类/模块的第一条语句位置
                   →  被解释器捕获到 __doc__ 属性，可被 help() 读取
                   →  是 Python 的"正式文档"机制
```

其中，文档字符串（docstring）是 Python 的特色——大多数语言只有普通注释，Python 把"文档"提升为了语言层面的概念，有自己的属性 `__doc__` 和工具 `help()` 来访问。

### 1.2 最简示例

单行注释：

```python
# 这是一个单行注释，解释器会忽略 # 后面的内容
age = 25  # 行尾注释：记录用户年龄
```

文档字符串：

```python
def greet(name: str) -> str:
    """向指定的人打招呼。

    Args:
        name: 对方姓名

    Returns:
        问候字符串
    """
    return f"你好，{name}！"
```

文档字符串和普通注释的关键区别在于：注释只是给人看的，文档字符串还能被 Python 解释器捕获，通过 `help(greet)` 就能查看：

```python
>>> help(greet)
Help on function greet in module __main__:

greet(name: str) -> str
    向指定的人打招呼。

    Args:
        name: 对方姓名

    Returns:
        问候字符串
```

---

## 2. 核心内容

### 2.1 单行注释（#）

单行注释以 `#` 开头，Python 解释器遇到 `#` 后，该行 `#` 后面的内容全部忽略。

`#` 可以独占一行，也可以跟在代码后面：

```python
# 独占一行：说明接下来这段代码的意图
total = 0
for score in scores:
    total += score  # 行尾注释：累加每个分数

# 跟在代码后：简短补充说明
MAX_CONNECTIONS = 10  # 连接池上限，超过会排队等待
```

**单行注释的核心原则**：注释解释"为什么这么写"，而不是"这行在做什么"。解释器已经知道代码在做什么，注释的价值在于补充代码无法自表达的设计意图。

```python
# 不好的注释：废话翻译，代码本身已经说明了一切
x = x + 1  # x 加 1

# 好的注释：解释意图，代码本身看不出来的"为什么"
retry_count = 0  # 失败重试计数，最多 MAX_RETRY 次
if retry_count > MAX_RETRY:
    break  # 超过重试上限，放弃本次请求
```

### 2.2 多行注释

Python 没有专门的多行注释语法。两种写法可以"伪装"多行注释：

**方式一：连续多行 #**

```python
# 这是多行注释的第一行
# 这是第二行
# 每行都要以 # 开头
# 适合短小的说明文字
```

**方式二：三引号字符串**

```python
"""
这看起来像多行注释，
但它其实是一个没有赋值给任何变量的字符串字面量。
Python 解释器执行时会创建这个字符串对象然后丢弃。
"""
```

需要注意，三引号字符串作为多行注释使用时，它并不是真正的注释——解释器会解析它、创建字符串对象，只是没有赋值给变量，所以没有副作用。在函数、类、模块内部，如果三引号字符串出现在**第一条语句**的位置，它会被当作文档字符串。出现在其他位置时，它只是一个被丢弃的字符串表达式。

```python
def example():
    """这是 docstring，会被存入 __doc__ 属性。"""
    x = 1
    """这不是 docstring，只是一个被丢弃的字符串。"""
    return x
```

**推荐做法**：模块级、函数级、类级的文档用三引号 docstring；代码内部的说明用 `#` 注释。不要在代码中间用三引号字符串当注释，容易和 docstring 混淆。

### 2.3 文档字符串（docstring）概述

文档字符串是 Python 中一种特殊的注释形式——用三引号（`"""` 或 `'''`）包裹的字符串，放在函数、类、模块的第一条语句位置时，Python 解释器会自动将它存入对象 的 `__doc__` 属性。

**docstring 与普通注释的区别**：

| 维度 | 普通注释（#） | 文档字符串（docstring） |
|------|-------------|----------------------|
| 语法 | `#` 开头 | 三引号字符串 |
| 被解释器捕获 | 否 | 是，存入 `__doc__` |
| 可被 `help()` 读取 | 否 | 是 |
| 可被 IDE 悬浮提示 | 否 | 是 |
| 可被文档生成工具提取 | 否 | 是（Sphinx 等） |
| 适用位置 | 任何位置 | 函数/类/模块的第一条语句 |
| 含义 | 给开发者看 | 给使用者看 |

docstring 有三种主要风格：Google 风格、NumPy 风格和 reST 风格。下面逐一讲解。

### 2.4 Google 风格 docstring

Google 风格是可读性最好的 docstring 风格，用 `Args:`、`Returns:`、`Raises:` 等小节标签来组织参数、返回值和异常说明。它的特点是结构清晰、格式紧凑，不依赖特殊指令语法，用 Markdown 风格的缩进即可。

**基本结构**：

```python
def fetch(url: str, timeout: int = 10) -> str:
    """发起 HTTP GET 请求并返回响应文本。

    Args:
        url: 请求地址
        timeout: 超时秒数，默认 10

    Returns:
        响应文本字符串

    Raises:
        TimeoutError: 请求超时
        ValueError: url 为空时
    """
    if not url:
        raise ValueError("url 不能为空")
    return f"GET {url} (timeout={timeout}s)"
```

**运行结果**：

```text
>>> fetch("https://api.example.com")
'GET https://api.example.com (timeout=10s)'
>>> fetch("")
Traceback (most recent call last):
  ...
ValueError: url 不能为空
```

**关键点说明**：

- 第一行是简短摘要（一行），描述函数做什么
- 摘要后空一行，然后是小节标签
- `Args:` 列出每个参数，格式为 `参数名: 说明`
- `Returns:` 描述返回值
- `Raises:` 列出可能抛出的异常及触发条件
- 各小节都是可选的——没有参数的函数不需要 `Args:`

**Google 风格的参数类型说明**：类型信息已在函数签名的类型注解中表达，docstring 中不需要重复写类型，只写语义说明即可。这也体现了类型注解与 docstring 的分工——注解表达"是什么类型"，docstring 表达"做什么、有什么约束"。

### 2.5 NumPy 风格 docstring

NumPy 风格在科学计算社区（NumPy、SciPy、pandas）中广泛使用。与 Google 风格相比，它的参数和返回值用下划线分隔的标题行来标记，可读性稍差但格式更统一，适合参数较多的函数。

**基本结构**：

```python
def calc_bmi(weight: float, height: float) -> float:
    """计算 BMI 指数。

    Parameters
    ----------
    weight : float
        体重（kg）
    height : float
        身高（米）

    Returns
    -------
    float
        BMI 值，保留一位小数
    """
    return round(weight / (height ** 2), 1)
```

**运行结果**：

```text
>>> calc_bmi(68, 1.75)
22.2
```

**NumPy 风格的特点**：

- `Parameters` 和 `Returns` 用下划线行（`----------`）作为标题分隔
- 每个参数格式为 `参数名 : 类型`，下一行缩进写说明
- 返回值格式为 `类型`，下一行缩进写说明
- 适合参数多、类型复杂的科学计算函数

**Google vs NumPy 对比**：

| 维度 | Google 风格 | NumPy 风格 |
|------|------------|-----------|
| 参数格式 | `url: 请求地址` | `weight : float` + 缩进说明 |
| 分隔方式 | `Args:` 标签 | `Parameters` + 下划线行 |
| 紧凑性 | 高，一行一个参数 | 低，每个参数占两行 |
| 可读性 | 更好，像散文 | 一般，更像表格 |
| 适用场景 | 通用开发 | 科学计算社区 |
| 主流支持 | PyCharm、VS Code 原生 | Sphinx + napoleon 插件 |

### 2.6 reST 风格 docstring

reST（reStructuredText）风格是 Sphinx 文档生成工具的原生格式，用 `:param`、`:returns`、`:raises` 等指令来标注参数和返回值。

**基本结构**：

```python
def divide(a: float, b: float) -> float:
    """返回 a / b。

    :param a: 被除数
    :param b: 除数，不能为 0
    :returns: 商
    :raises ZeroDivisionError: b 为 0 时
    """
    if b == 0:
        raise ZeroDivisionError("除数不能为0")
    return a / b
```

**运行结果**：

```text
>>> divide(10, 3)
3.3333333333333335
>>> divide(10, 0)
Traceback (most recent call last):
  ...
ZeroDivisionError: 除数不能为0
```

**reST 风格的特点**：

- 用 `:param 名称: 说明` 标注每个参数
- 用 `:returns: 说明` 标注返回值
- 用 `:raises 异常名: 说明` 标注异常
- 是 Sphinx 的原生格式，配合 Sphinx 可以自动生成 API 文档
- 格式略显冗长，相比 Google 风格可读性稍差

**三种风格快速对比**：

| 风格 | 参数写法 | 返回值写法 | 社区偏好 |
|------|---------|-----------|---------|
| Google | `Args:` + `name: 说明` | `Returns:` + 说明 | 通用开发，推荐首选 |
| NumPy | `Parameters` + `name : type` | `Returns` + `type` | 科学计算 |
| reST | `:param name: 说明` | `:returns: 说明` | Sphinx 生态 |

### 2.7 docstring 的 `__doc__` 属性与 `help()` 函数

Python 会把函数、类、模块的 docstring 存入 `__doc__` 属性。你可以直接访问这个属性，也可以用内置的 `help()` 函数格式化查看。

**访问 `__doc__` 属性**：

```python
def add(a: int, b: int) -> int:
    """返回 a 与 b 的和。

    >>> add(1, 2)
    3
    """
    return a + b

# 直接访问 docstring 文本
print(add.__doc__)
```

**运行结果**：

```text
返回 a 与 b 的和。

    >>> add(1, 2)
    3
```

**用 `help()` 查看**：

```python
help(add)
```

**运行结果**：

```text
Help on function add in module __main__:

add(a: int, b: int) -> int
    返回 a 与 b 的和。

    >>> add(1, 2)
    3
```

`help()` 和 `__doc__` 的区别：

| 维度 | `help(obj)` | `obj.__doc__` |
|------|------------|---------------|
| 输出格式 | 格式化后的可读文档 | docstring 原始文本 |
| 包含签名 | 是，含函数签名 | 否，只有 docstring 正文 |
| 支持分页 | 是，终端中自动分页 | 否，一次性输出 |
| 在 REPL 中 | 交互式查看 | 直接打印 |

**实用场景**：在交互式环境中，用 `help()` 查看某个库函数的文档是最快的方式：

```python
>>> help(print)
Help on built-in function print in module builtins:

print(*args, sep=' ', end='\n', file=None, flush=False)
    ...
```

### 2.8 docstring 第一条语句规则

docstring 必须出现在函数体（或类体、模块体）的**第一条语句**位置。如果第一条语句是别的代码，即使后面有三引号字符串，Python 也不会将它当作 docstring。

**正确写法**：docstring 是函数体第一条语句

```python
def has_docstring():
    """这是 docstring，__doc__ 有值。"""
    x = 1
    return x

print(f"has_docstring.__doc__: {has_docstring.__doc__!r}")
```

**运行结果**：

```text
has_docstring.__doc__: '这是 docstring，__doc__ 有值。'
```

**错误写法**：docstring 不是第一条语句

```python
def no_docstring():
    x = 1  # 第一条语句是赋值，不是字符串
    """这不是 docstring，__doc__ 为 None。"""  # noqa
    return x

print(f"no_docstring.__doc__: {no_docstring.__doc__!r}")
```

**运行结果**：

```text
no_docstring.__doc__: None
```

在上面的例子中，`no_docstring` 函数内的三引号字符串不是第一条语句，Python 不会将它存入 `__doc__` 属性，`__doc__` 的值是 `None`。这个字符串只是一个被丢弃的字符串表达式，没有任何副作用。

**规则总结**：

- docstring 必须是函数体/类体/模块体中的第一条语句
- 第一条语句之前的注释（`#`）不影响 docstring 的判定
- docstring 之前不能有任何可执行语句
- 如果想在 docstring 之前写注释，可以用 `#` 注释，但不能有赋值、表达式等可执行语句

### 2.9 doctest：docstring 内嵌可运行示例

doctest 是 Python 标准库中的一个模块，它可以从 docstring 中提取 `>>>` 开头的示例代码并自动运行验证。这让 docstring 不仅仅是文档，还是可执行的测试用例——文档和代码不会"脱节"。

**在 docstring 中写 doctest 示例**：

```python
def add(a: int, b: int) -> int:
    """返回 a 与 b 的和。

    >>> add(1, 2)
    3
    >>> add(-1, 1)
    0
    >>> add(0, 0)
    0
    """
    return a + b


def is_even(n: int) -> bool:
    """判断 n 是否为偶数。

    >>> is_even(4)
    True
    >>> is_even(7)
    False
    """
    return n % 2 == 0
```

**运行 doctest 验证**：

```python
import doctest

import examples

# 对 examples 模块运行 doctest
results = doctest.testmod(examples, verbose=True)
print(f"尝试数: {results.attempted}, 失败数: {results.failed}")
```

**运行结果**：

```text
Trying:
    add(1, 2)
Expecting:
    3
ok
Trying:
    add(-1, 1)
Expecting:
    0
ok
Trying:
    add(0, 0)
Expecting:
    0
ok
Trying:
    is_even(4)
True
ok
Trying:
    is_even(7)
Expecting:
    False
ok
5 passed and 0 failed.

  尝试数: 5, 失败数: 0
```

**doctest 的关键要素**：

- `>>>` 开头表示一条 Python 语句
- 下一行写期望的输出结果
- `doctest.testmod()` 会扫描模块中所有函数的 docstring，提取 `>>>` 示例并执行
- 如果实际输出与期望不一致，doctest 会报告失败
- `verbose=True` 会打印每个测试的详细信息

**doctest 的价值**：文档中的示例代码永远是"活的"——如果函数的行为变了但 docstring 没更新，doctest 会跑失败，提醒你同步更新文档。这比"写完就过时"的普通注释好得多。

### 2.10 类型注解与 docstring 协作

Python 3.5+ 引入了类型注解（Type Hints），可以在函数签名中标注参数和返回值类型。类型注解和 docstring 不是替代关系，而是互补关系——注解表达"是什么类型"，docstring 表达"做什么、有什么约束"。

**协作示例**：

```python
def find_user(users: list[dict], user_id: int) -> dict | None:
    """在用户列表中按 id 查找用户。

    类型注解表达"参数/返回是什么类型"，
    docstring 表达"做什么、约束"，两者不重叠。

    Args:
        users: 用户字典列表，每个含 'id' 键
        user_id: 要查找的用户 id

    Returns:
        匹配的用户字典，未找到返回 None
    """
    for u in users:
        if u.get("id") == user_id:
            return u
    return None
```

**运行结果**：

```text
>>> users = [{"id": 1, "name": "张三"}, {"id": 2, "name": "李四"}]
>>> find_user(users, 2)
{'id': 2, 'name': '李四'}
>>> find_user(users, 99)
None
```

**分工原则**：

| 信息 | 由谁表达 | 示例 |
|------|---------|------|
| 参数类型 | 类型注解 | `user_id: int` |
| 返回值类型 | 类型注解 | `-> dict \| None` |
| 功能描述 | docstring 摘要 | "在用户列表中按 id 查找用户" |
| 参数语义 | docstring Args | "要查找的用户 id" |
| 返回值语义 | docstring Returns | "匹配的用户字典，未找到返回 None" |
| 异常及触发条件 | docstring Raises | "KeyError: 字典缺少 'id' 键时" |

**常见误区**：有了类型注解就不写 docstring 了。这是错误的做法——类型注解只能告诉你 `user_id` 是 `int`，但不会告诉你它的合法范围（"必须是正整数"），也不会告诉你函数的行为（"未找到返回 None"）。两者各有分工，缺一不可。

### 2.11 类 docstring 与 property docstring

类级别的 docstring 描述类的整体职责，使用 `Attributes:` 小节描述实例属性。property 装饰器修饰的方法也可以有自己的 docstring，描述这个计算属性的语义。

**类 docstring 示例**：

```python
class UserStat:
    """用户统计结果。

    Attributes:
        total: 总人数
        valid: 有效人数
    """

    def __init__(self, total: int, valid: int):
        self.total = total
        self.valid = valid

    @property
    def valid_rate(self) -> float:
        """有效用户占比（0~1）。"""
        return self.valid / self.total if self.total else 0.0
```

**使用示例**：

```python
stat = UserStat(total=100, valid=85)
print(f"总人数: {stat.total}")
print(f"有效人数: {stat.valid}")
print(f"有效率: {stat.valid_rate:.1%}")
```

**运行结果**：

```text
总人数: 100
有效人数: 85
有效率: 85.0%
```

**用 help() 查看类文档**：

```python
help(UserStat)
```

**运行结果**：

```text
Help on class UserStat in module __main__:

class UserStat(builtins.object)
 |  UserStat(total: int, valid: int)
 |
 |  用户统计结果。
 |
 |  Attributes:
 |      total: 总人数
 |      valid: 有效人数
 |
 |  Readonly properties defined here:
 |
 |  valid_rate
 |      有效用户占比（0~1）。
```

**关键点说明**：

- 类 docstring 放在 `class` 语句之后的第一行
- `Attributes:` 小节列出实例属性（`__init__` 中 `self.xxx` 赋值的属性）
- property 的 docstring 放在 `@property` 装饰的方法体第一行
- `help(UserStat)` 会同时显示类 docstring、方法签名和 property docstring

### 2.12 TODO/FIXME/HACK 特殊注释标记

在开发过程中，经常需要标记"待办事项""已知问题""临时方案"。社区约定了一些特殊的注释标记前缀，方便工具和编辑器搜索定位。

**常用标记**：

| 标记 | 含义 | 使用场景 |
|------|------|---------|
| `TODO` | 待完成的功能/优化 | 功能还没写完，先标记位置 |
| `FIXME` | 已知 bug，需要修复 | 发现问题但当前来不及修 |
| `HACK` | 临时解决方案，不够优雅 | 先跑通再说，后续要重构 |
| `XXX` | 需要注意的危险代码 | 逻辑脆弱，改了容易出问题 |

**使用示例**：

```python
def find_user(users: list[dict], user_id: int) -> dict | None:
    """在用户列表中按 id 查找用户。"""
    # TODO(alice, 2026-08): 后续支持模糊查找
    for u in users:
        if u.get("id") == user_id:
            return u
    return None
```

**标记的推荐写法**：

- `TODO(谁, 什么时候): 做什么`——带上负责人和计划时间
- `FIXME: 问题描述`——简要说明什么 bug
- `HACK: 为什么临时这样做`——说明"不优雅但能跑"的原因

这些标记是团队协作的信号——grep `TODO|FIXME|HACK` 就能列出项目中所有待处理项。但要注意：**这些标记不应该留在正式发布的生产代码中**，发布前应处理掉或者转为 issue 跟踪。

---

## 3. 最佳实践

### 3.1 推荐 vs 不推荐写法对比

**场景一：注释内容**

```python
# ---- 不推荐 ----
x = x + 1  # x 加 1

# ---- 推荐 ----
retry_count += 1  # 失败重试计数，最多 MAX_RETRY 次
```

不推荐的原因：`x = x + 1` 本身已经说明了"加一"操作，注释只是翻译代码，没有增加任何信息。推荐写法解释了"为什么"加一——因为这是重试计数逻辑。

**场景二：魔法数**

```python
# ---- 不推荐 ----
if retry > 3:
    print("超过重试上限")

# ---- 推荐 ----
MAX_RETRY = 3  # 重试上限，超过即放弃（来自运维经验值）
if retry > MAX_RETRY:
    print("超过重试上限")
```

不推荐的原因：`3` 是一个魔法数——读者不知道 3 是从哪来的、代表什么。提取为命名常量后，名字本身就是注释，常量旁边再补充来源说明。

**场景三：用注释解释坏命名**

```python
# ---- 不推荐 ----
d = {}  # 用户字典

# ---- 推荐 ----
user_dict = {"id": 1, "name": "张三"}
```

不推荐的原因：命名 `d` 太糟糕，需要注释才能理解。好的命名应该自解释——`user_dict` 一看就知道是用户字典，不需要额外注释。

**场景四：docstring 与注释的分工**

```python
# ---- 不推荐 ----
# 这个函数用来查找用户，参数是用户列表和 id，返回匹配的用户
def find_user(users, user_id):
    ...

# ---- 推荐 ----
def find_user(users: list[dict], user_id: int) -> dict | None:
    """在用户列表中按 id 查找用户。

    Args:
        users: 用户字典列表，每个含 'id' 键
        user_id: 要查找的用户 id

    Returns:
        匹配的用户字典，未找到返回 None
    """
    ...
```

不推荐的原因：用普通注释写函数说明，无法被 `help()` 读取，也无法被 IDE 和文档生成工具使用。应该用 docstring。

### 3.2 docstring 风格选择建议

| 场景 | 推荐风格 | 原因 |
|------|---------|------|
| 通用项目/个人项目 | Google 风格 | 可读性最好，主流 IDE 原生支持 |
| 科学计算/数据分析项目 | NumPy 风格 | 社区惯例，与 numpy/scipy 一致 |
| 需要生成 API 文档 | reST 风格或 Google 风格 + napoleon | Sphinx 原生支持 |
| 简单的内联函数 | 一行摘要即可 | 不需要完整结构 |

**实际建议**：如果没有特殊需求，选 Google 风格。它在可读性、IDE 支持（PyCharm、VS Code）、工具兼容性之间取得了最好的平衡。

### 3.3 注释屏蔽代码的注意事项

在调试过程中，用 `#` 注释掉一段代码是常见操作，但有两个注意点：

```python
data = [1, 2, 3, 4, 5]

# 临时注释掉调试代码（提交前应删除）:
# for item in data:
#     print(f"调试: {item}")

# 正式代码
total = sum(data)
print(f"数据总和: {total}")
```

**注意事项**：

1. **提交前删除**：注释掉的代码不应出现在版本控制中。版本控制（如 Git）本身就是"历史记录"，不需要用注释来备份旧代码。
2. **不要用三引号字符串屏蔽代码**：虽然三引号可以"注释掉"多行代码，但这样做有风险——如果代码本身包含三引号字符串，会导致语法错误。用 `#` 注释更安全，IDE 也有快捷键可以批量注释/取消注释。

**用 Git stash 代替注释屏蔽**：如果临时需要切换功能，`git stash` 比"把代码注释掉再取消"更干净，不会在代码中留下注释痕迹。

### 3.4 何时该写注释，何时不该写

**该写注释的情况**：

- 解释"为什么"这样设计（代码本身只能表达"做什么"，不能表达"为什么"）
- 标注业务规则、约束条件（如"此值不能超过 100，因为 API 限制"）
- 标注临时的 workaround 或待处理项（TODO/FIXME）
- 补充代码无法自表达的上下文（如"这个延迟 500ms 是为了等数据库写入完成"）

**不该写注释的情况**：

- 代码已经自解释——好命名 + 清晰的结构比注释更强
- 注释只是翻译代码——`x = 1  # x 等于 1` 是噪音
- 注释过时了——如果代码改了但注释没更新，过时注释比没注释更糟
- 用注释代替函数名——与其写 `# 这个函数检查年龄是否合法`，不如给函数起名 `is_valid_age`

**核心原则**：注释回答"为什么"，代码回答"做什么"。如果注释只是在重复代码，删掉它。

---

## 4. 原理

### 4.1 docstring 的底层机制：`__doc__` 属性

Python 在编译阶段会扫描函数、类、模块体的第一条语句。如果它是一个字符串字面量（三引号或单引号），Python 编译器会将这个字符串存入对象的 `__doc__` 属性。

**验证性代码**：

```python
def foo():
    """这是一个 docstring。"""
    pass

# __doc__ 属性存储了 docstring 的原始文本
print(type(foo.__doc__))   # <class 'str'>
print(repr(foo.__doc__))   # '这是一个 docstring。'

def bar():
    pass

# 没有 docstring 时，__doc__ 为 None
print(repr(bar.__doc__))   # None
```

**运行结果**：

```text
<class 'str'>
'这是一个 docstring。'
None
```

这个机制是 Python 语言层面的——不是某个工具的约定，而是 CPython 解释器的核心行为。`help()` 函数正是通过读取 `__doc__` 属性来展示文档的。

### 4.2 模块级 docstring 与函数级 docstring

docstring 不仅适用于函数，也适用于模块和类。模块级 docstring 放在文件开头（import 之前），类级 docstring 放在 `class` 语句之后的第一行。

**模块级 docstring**：

```python
"""这是模块的 docstring。

描述这个模块的用途和内容。
"""

import os  # import 语句在 docstring 之后


def my_function():
    """函数 docstring。"""
    ...
```

**类级 docstring**：

```python
class MyClass:
    """这是类的 docstring。"""

    def my_method(self):
        """方法的 docstring。"""
        ...
```

可以通过 `help()` 或 `__doc__` 分别访问各级别 docstring：

```python
print(help(my_function))   # 函数 docstring
print(help(MyClass))        # 类 docstring + 方法 docstring
```

**层级关系**：

```text
模块 docstring（文件开头）
├── 函数 docstring（函数体第一行）
├── 类 docstring（class 语句后第一行）
│   ├── 方法 docstring（方法体第一行）
│   └── property docstring（@property 方法体第一行）
└── 函数 docstring（函数体第一行）
```

每一层级的 docstring 都是独立的，存入各自对象的 `__doc__` 属性。`help(类名)` 会显示类 docstring 和所有公共方法的 docstring。

### 4.3 docstring 与代码对象的绑定

Python 中，函数、类、模块在编译后都会生成一个"代码对象"（code object），`__doc__` 是代码对象的属性之一。这也解释了为什么 docstring 必须是第一条语句——Python 编译器只在第一条语句位置检查是否为字符串字面量，如果是则提取为 `__doc__`。

```python
import types

def example():
    """docstring 示例。"""
    pass

# 检查 __doc__ 属性的类型
print(isinstance(example.__doc__, str))   # True

# 函数对象有一个 __code__ 属性指向代码对象
print(type(example.__code__))             # <class 'code'>
```

**运行结果**：

```text
True
<class 'code'>
```

docstring 不会被编译进字节码——它在编译阶段被提取出来，存为对象的属性，函数体执行时不会"运行"docstring。这就是为什么把 docstring 放在函数第一行的开销几乎为零：它只在模块加载时解析一次，之后只在 `__doc__` 属性中存储文本字符串。

---

## 5. 总结

本文围绕 Python 注释规范展开，主要介绍了以下内容：

- Python 注释分两大类：单行注释（`#`）和文档字符串（docstring），docstring 是 Python 的特色机制，被存入 `__doc__` 属性，可通过 `help()` 查看
- docstring 有三种主流风格：Google 风格（推荐，可读性最好）、NumPy 风格（科学计算社区约定）、reST 风格（Sphinx 原生格式）
- docstring 必须是函数/类/模块体的第一条语句，否则不会被捕获为 `__doc__` 属性
- doctest 可以将 docstring 中的 `>>>` 示例变为可执行的测试用例，让文档"永不脱节"
- 类型注解与 docstring 是互补关系——注解表达"是什么类型"，docstring 表达"做什么、有什么约束"
- 类 docstring 用 `Attributes:` 描述实例属性，property 也可以拥有自己的 docstring
- TODO/FIXME/HACK 是社区约定的特殊注释标记，方便搜索定位待处理项
- 注释的核心原则是解释"为什么"而非"做什么"——好的命名和清晰的结构比注释更重要，注释应该补充代码无法自表达的设计意图
