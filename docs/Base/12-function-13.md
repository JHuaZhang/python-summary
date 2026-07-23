---
group:
  title: 【12】函数核心机制
  order: 12
order: 13
title: docstring文档与help
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 docstring

docstring（documentation string，文档字符串）是写在函数、类、模块定义紧随其后的**第一个字符串表达式**。它不是普通的字符串变量，也不是注释——Python 解释器在编译时会把这段字符串拎出来，存到该对象的 `__doc__` 属性上，使其成为对象"自带说明"的一部分，运行期随时可被 `help()`、IDE、文档生成工具读取。

先看一个最小例子，直观感受 docstring 长什么样：

```python
def greet(name):
    """向指定用户打招呼。"""
    return f"hello, {name}"


print(greet.__doc__)
# 输出：向指定用户打招呼。
```

`greet.__doc__` 就是函数 `greet` 的文档字符串。注意：它用的是三引号 `"""..."""` 而不是 `#` 注释。`#` 注释只是给写代码的人看，解释器在解析阶段就丢弃了，运行期根本访问不到；而 docstring 是一个真正的字符串对象，被绑定在函数对象上，程序跑起来后依然存在。

在 Python 生态中，docstring 的地位远高于普通注释：

- `help(obj)` 会把 `__doc__` 取出来格式化展示，是交互式解释器里查函数用法的官方途径。
- IDE（如 PyCharm、VS Code）在你悬停一个函数名时弹出的提示气泡，展示的就是 docstring。
- Sphinx、pdoc、MkDocs 等自动文档工具，直接把整个项目里所有对象的 docstring 抽出来拼成一套 API 文档站点。
- `doctest` 模块还能把 docstring 里写的 `>>>` 示例当成测试用例跑一遍，既当文档又当测试。

**docstring 与注释的根本区别**

这是初学者最容易混淆的点，先用一个对照强调：

```python
def calc_total(items):
    # 计算订单总金额      ← 这是注释，运行期不存在，__doc__ 取不到
    """计算订单总金额。"""  # ← 这是 docstring，运行期可通过 __doc__ 访问
    return sum(item.price for item in items)
```

注释 `#` 是"给读源码的开发者看的备注"，docstring 是"给使用这个对象的任何人（含运行时工具）看的文档"。一个函数可以没有注释照样被 `help()` 说明清楚，但如果没有 docstring，`help()` 就只能干巴巴地打印函数签名。

### 1.2 基本语法与最小用法

docstring 的语法规则只有一条：**必须是定义体（`def` / `class` / 模块顶部）的第一个语句，且是一个字符串字面量**。放在别的位置就只是个普通字符串表达式，不会被 `__doc__` 捕获。

**单行 docstring** 适用于逻辑极简单的函数，一行说明即可：

```python
def square(x):
    """返回 x 的平方。"""
    return x * x


print(square.__doc__)
# 输出：返回 x 的平方。
```

惯例：单行 docstring 用三引号 `"""` 包裹，前后不要留空行，结尾的 `"""` 紧跟内容最后一个字符，不另起一行。虽然用单引号 `'...'` 在语法上也能成为 docstring，但社区约定一律用三引号，即便只有一行。

**多行 docstring** 适用于所有"一行说不清"的函数，结构通常是：第一行是简短摘要（祈使句，不超过 79 字符），空一行，再写详细说明：

```python
def send_email(to, subject, body):
    """发送一封邮件给指定收件人。

    内部通过 SMTP 协议连接邮件服务器，依次完成认证、
    构造 MIME 报文、投递。失败时会重试最多 3 次，
    仍失败则抛出 SmtpError。
    """
    # 实现略
    pass


print(send_email.__doc__[:20])
# 输出：发送一封邮件给指定收件人。
```

**模块级 docstring** 写在 `.py` 文件的最顶端（如果有 `#!/usr/bin/env python` 这样的 shebang 或 `# -*- coding -*-` 声明，写在其后），作为整个模块的说明：

```python
# 文件 payment.py
"""支付模块。

提供订单支付、退款、对账查询等能力，
是交易系统的核心入口之一。
"""

import json


def pay(order_id):
    """发起一笔支付。"""
    ...
```

模块 docstring 存在 `payment.__doc__` 上，`help(payment)` 会先把它打印出来。

**类级和方法级 docstring**：

```python
class Order:
    """订单实体，聚合订单号、买家、商品快照与金额。

    用 Order.from_cart(cart) 从购物车构建，
    不要直接 __init__，因为有大量校验逻辑。
    """

    def from_cart(cls, cart):
        """从购物车构造一个订单。"""
        ...

    def total(self):
        """返回订单总金额（含运费）。"""
        ...
```

类有类的 docstring，方法有方法的 docstring，层层叠加，`help(Order)` 会把它们组织成一份层次清晰的说明文档。

**适用场景**

任何"会被别人调用"的函数、类、模块都该写 docstring——哪怕"别人"是三个月后的你自己。内部的一次性脚本里的 throwaway 函数可以省，但凡进入库、进入团队协作的代码，docstring 是最低限度的可维护性保障。

**常见误区**

有人把 docstring 写成"翻译函数名"，比如 `def send_email(...): """send email"""`——这等于什么都没说，函数名已经告诉你它是发邮件的。docstring 的价值在于补充签名无法表达的信息：参数含义、边界条件、异常情况、副作用、使用示例。

---

## 2. 核心内容

### 2.1 docstring 的存放位置：**doc** 属性

每个可以写 docstring 的对象（函数、类、模块、方法，甚至描述符的属性），都会把它的文档字符串存在自身的 `__doc__` 属性里。访问 `__doc__` 就能拿到原始字符串，不做任何格式化。

```python
def format_price(cents):
    """把以分为单位的金额格式化为「元」字符串。

    如 format_price(1099) 返回 '10.99'。
    """
    return f"{cents / 100:.2f}"


# 直接访问 __doc__，拿到原始字符串（含换行、缩进）
print(repr(format_price.__doc__))
```

```text
# 输出：
'把以分为单位的金额格式化为「元」字符串。\n\n    如 format_price(1099) 返回 \'10.99\'。\n    '
```

可以看到 `__doc__` 保留了源码里的所有缩进和换行。这一点很关键：源码里多行 docstring 为了对齐 `def` 缩进，后面几行前面都有空白，这些空白**原样**进了 `__doc__`。`help()` 会做清理（见后文 `inspect.getdoc`），但直接读 `__doc__` 看到的是带缩进的原始版。

**没有 docstring 时 **doc** 是 None**

```python
def add(a, b):
    return a + b


print(add.__doc__)
# 输出：None
```

没写 docstring 的函数，`__doc__` 就是 `None`，`help()` 只能显示签名。这也是为什么有些函数 `help` 出来只有一行——它没写文档。

**模块的 **doc\*\*\*\*

模块加载后，模块对象本身也有 `__doc__`：

```python
# 文件 mymath.py
"""一个用于演示 docstring 的小数学工具模块。"""

def half(x):
    """返回 x 的一半。"""
    return x / 2
```

```python
import mymath

print(mymath.__doc__)
# 输出：一个用于演示 docstring 的小数学工具模块。

print(mymath.half.__doc__)
# 输出：返回 x 的一半。
```

**类的 **doc** 与方法的 **doc** 分开存在**

```python
class Stack:
    """一个固定容量的栈。"""

    def push(self, item):
        """把 item 压入栈顶。"""
        ...

    def pop(self):
        """弹出并返回栈顶元素。"""
        ...


print(Stack.__doc__)          # 一个固定容量的栈。
print(Stack.push.__doc__)     # 把 item 压入栈顶。
print(Stack.pop.__doc__)      # 弹出并返回栈顶元素。
```

三者各管各的 docstring，并不合并。`help(Stack)` 会把它们汇总排版，但底层仍是分别存取的。

### 2.2 help() 函数：格式化展示文档

`help()` 是 Python 内置函数，它把对象、对象所属类的继承链、对象的 docstring 全部取出来，交给标准库的 `pydoc` 模块做格式化，再打印到终端。交互式解释器里查函数用法最常用的就是它。

最小示例——对一个有 docstring 的函数调 `help`：

```python
def repeat(s, n):
    """把字符串 s 重复 n 次拼接返回。

    参数 n 必须为非负整数，n=0 时返回空串。
    """
    return s * n


help(repeat)
```

```text
# 输出：
Help on function repeat in module __main__:

repeat(s, n)
    把字符串 s 重复 n 次拼接返回。

    参数 n 必须为非负整数，n=0 时返回空串。
```

`help` 先打印一行 `Help on function ... in module ...:`，接着是函数签名 `repeat(s, n)`，再把它 `__doc__` 里的内容清理掉多余缩进后逐行显示。这就是 docstring 写出来后最直接的"消费方式"。

**对类调 help：看到的是完整的方法清单**

```python
class Counter:
    """一个简单的计数器。"""

    def __init__(self):
        """初始化计数为 0。"""
        self.count = 0

    def inc(self):
        """计数加一。"""
        self.count += 1
        return self.count

    def reset(self):
        """清零。"""
        self.count = 0


help(Counter)
```

```text
# 输出（节选）：
Help on class Counter in module __main__:

class Counter(builtins.object)
 |  一个简单的计数器。
 |
 |  Methods defined here:
 |
 |  __init__(self)
 |      初始化计数为 0。
 |
 |  inc(self)
 |      计数加一。
 |
 |  reset(self)
 |      清零。
```

`help` 把类的 docstring、每个方法的签名和 docstring 都梳理出来，排版成一份结构化说明。这正是为什么类里的每个方法都该写 docstring——`help` 能自动汇总它们。

**对模块调 help**

假设 `mymath.py` 内容如下：

```python
"""一个用于演示 docstring 的小数学工具模块。

提供 half、quarter 等简单运算。
"""

def half(x):
    """返回 x 的一半。"""
    return x / 2

def quarter(x):
    """返回 x 的四分之一。"""
    return x / 4
```

```python
import mymath
help(mymath)
```

```text
# 输出（节选）：
Help on module mymath:

NAME
    mymath - 一个用于演示 docstring 的小数学工具模块。

DESCRIPTION
    提供半数等简单运算。

FUNCTIONS
    half(x)
        返回 x 的一半。

    quarter(x)
        返回 x 的四分之一。
```

`help(module)` 把模块 docstring、模块里所有公开函数的 docstring 组织成 NAME/DESCRIPTION/FUNCTIONS 等段落。模块级 docstring 是整个模块的"门面"，决定了 `help(module)` 第一眼展示什么。

**help 是交互式工具，不要在生产代码里调**

`help()` 默认把内容打到 `sys.stdout` 并分页，它返回 `None`。它的设计意图是给人看，不是给程序读——想拿到文档字符串做处理请直接用 `__doc__` 或 `inspect.getdoc`，不要把 `help` 当作 API。

### 2.3 单行 docstring 与多行 docstring 的取舍

**单行 docstring**：摘要一行，不写参数说明，不空行。适合"一眼能看懂的简单工具函数"：

```python
def is_even(n):
    """判断 n 是否为偶数。"""
    return n % 2 == 0


def trim(s):
    """去掉字符串首尾空白。"""
    return s.strip()
```

社区惯例（PEP 257）对单行 docstring 的要求：

- 采用三引号 `"""`，即便只有一行。
- 摘要以**祈使句**写成，第一个单词是动词，首字母大写（中文则直接说做什么）。
- 结尾的 `"""` 紧贴内容最后一个字符，不另起一行。
- 不要在 `"""` 内部再写一句"返回什么"——摘要已经包含了主语和动作就够了，细节交给多行段或类型注解。

**多行 docstring**：当需要说明参数、返回值、异常、副作用、示例时使用。典型结构是"一行摘要 + 空行 + 详细段"，再用格式约定分段（详见 2.4）。

```python
def parse_price(text):
    """把 '￥10.99' 这样的字符串解析成以分为单位的整数。

    支持人民币符号 ￥ 与 $，忽略前后空白与千分位逗号。
    若无法解析则抛出 ValueError。
    """
    s = text.strip().replace(",", "")
    if s.startswith("￥"):
        s = s[1:]
    elif s.startswith("$"):
        s = s[1:]
    yuan = float(s)
    return round(yuan * 100)
```

这里第一行"把 '￥10.99' 这样的字符串解析成以分为单位的整数"是摘要，后面空一行再详细补充"支持哪些符号、失败抛什么异常"。这种"摘要 + 空行 + 详细"是 PEP 257 的硬性结构。

**何时从单行升到多行**：只要满足下面任意一条，就改多行：

- 参数超过 2 个，或参数含义不直观。
- 有返回值需要说明（比如返回一个元组，得说清每个元素是什么）。
- 会抛出异常，调用方需要知道捕获什么。
- 有副作用（写文件、发请求、改全局状态）。
- 行为有边界条件或重要约束（如 n=0 的特殊处理）。

### 2.4 常见 docstring 格式约定

Python 社区并没有把 docstring 格式写进语言规范，但目前有三种主流约定被工具广泛支持：**reStructuredText (Sphinx) 风格**、**Google 风格**、**NumPy 风格**。三者都被 Sphinx 通过相应扩展解析，区别主要在排版习惯。

下面用同一个函数分别写三种风格，便于对比。函数是一个"下单创建订单"的业务函数。

**reStructuredText (Sphinx) 风格**——用 `:param:`、`:return:`、`:raises:` 这种字段标记：

```python
def create_order(user_id, sku_list, coupon=None):
    """为指定用户创建订单。

    :param user_id: 买家用户 ID。
    :param sku_list: 要购买的商品列表，每项为 (sku_id, quantity)。
    :param coupon: 优惠券码，可选。
    :return: 订单 ID（字符串）。
    :raises ValueError: 当 sku_list 为空时。
    :raises PermissionError: 当用户被风控冻结时。
    """
    if not sku_list:
        raise ValueError("sku_list 不能为空")
    ...
    return "ORD123456"
```

**Google 风格**——用 `Args:`、`Returns:`、`Raises:` 等段落标题，段内用 `name: description` 列项：

```python
def create_order(user_id, sku_list, coupon=None):
    """为指定用户创建订单。

    Args:
        user_id: 买家用户 ID。
        sku_list: 要购买的商品列表，每项为 (sku_id, quantity)。
        coupon: 优惠券码，可选。

    Returns:
        str: 订单 ID。

    Raises:
        ValueError: 当 sku_list 为空时。
        PermissionError: 当用户被风控冻结时。
    """
    if not sku_list:
        raise ValueError("sku_list 不能为空")
    ...
    return "ORD123456"
```

**NumPy 风格**——段标题下用一行横线分隔，参数表排列得更像表格：

```python
def create_order(user_id, sku_list, coupon=None):
    """为指定用户创建订单。

    Parameters
    ----------
    user_id : int
        买家用户 ID。
    sku_list : list of tuple
        要购买的商品列表，每项为 (sku_id, quantity)。
    coupon : str, optional
        优惠券码。

    Returns
    -------
    str
        订单 ID。

    Raises
    ------
    ValueError
        当 sku_list 为空时。
    PermissionError
        当用户被风控冻结时。
    """
    if not sku_list:
        raise ValueError("sku_list 不能为空")
    ...
    return "ORD123456"
```

**三种风格的对比**

| 维度     | reST 风格                 | Google 风格               | NumPy 风格                    |
| -------- | ------------------------- | ------------------------- | ----------------------------- |
| 段落标记 | `:param:` `:return:` 字段 | `Args:` `Returns:` 段标题 | `Parameters` `Returns` + 横线 |
| 可读性   | 紧凑但符号嘈杂            | 最接近自然文章            | 像表格，参数多时整齐          |
| 适合场景 | 老项目、Sphinx 原生       | 多数应用代码、Google 内部 | 科学计算、参数众多的函数      |
| IDE 支持 | 良好                      | 极好                      | 良好                          |

实际工程中选哪个看团队约定，但**一个项目内只能选一种**，不要混用。新项目如果没有偏好，推荐 Google 风格——它的 `Args/Returns/Raises` 段在 PyCharm、VS Code 里悬浮提示展示最自然。

### 2.5 Args / Returns / Raises 段的写法（以 Google 风格为例）

不论选哪种风格，docstring 的"干货段"都围绕三类信息：参数、返回值、异常。本节以 Google 风格为例讲清三段的写法。

**Args 段**：列出每个参数的名字、类型（可选）、含义。多参数时每个参数独占一行，名字后跟冒号空格再写说明，说明里可以带括号注明类型：

```python
def transfer(from_uid, to_uid, amount, memo=""):
    """从一方向另一方转账。

    Args:
        from_uid (int): 付款方用户 ID。
        to_uid (int): 收款方用户 ID。
        amount (int): 转账金额，以分为单位，必须为正。
        memo (str, optional): 转账附言，最长 32 字。默认为空串。

    Returns:
        dict: 包含 trade_no（流水号）与 timestamp（完成时间戳）。
    """
    ...
    return {"trade_no": "T20260723001", "timestamp": 1753300000}
```

参数名后 `(int)` 这种写法是"类型注解的 docstring 表达"。现代代码通常同时写 PEP 484 类型注解（`def transfer(from_uid: int, ...)`），这时 docstring 的 Args 里就可以省略类型，只写含义：

```python
def transfer(from_uid: int, to_uid: int, amount: int, memo: str = "") -> dict:
    """从一方向另一方转账。

    Args:
        from_uid: 付款方用户 ID。
        to_uid: 收款方用户 ID。
        amount: 转账金额，以分为单位，必须为正。
        memo: 转账附言，最长 32 字。默认为空串。

    Returns:
        dict: 包含 trade_no（流水号）与 timestamp（完成时间戳）。
    """
    ...
    return {"trade_no": "T20260723001", "timestamp": 1753300000}
```

这样签名承担"类型"，docstring 承担"含义"，职责清晰，不重复。

**Returns 段**：说明返回值的结构与含义。返回简单类型时直接写类型名加说明；返回复杂结构（如 dict、tuple、dataclass）时，展开内部字段：

```python
def query_order(order_id: str) -> dict:
    """查询订单详情。

    Returns:
        dict: 订单详情，结构为::

            {
                "order_id": "ORD123",      # 订单号
                "status": "PAID",           # 状态：PAID/UNPAID/CANCELED
                "total_cents": 1099,        # 总金额（分）
                "items": [...]              # 商品快照列表
            }
    """
    ...
```

返回 `None` 的函数也可以写 `Returns: None` 显式说明"本函数无返回值，靠副作用生效"，提示调用者不要拿它的返回值做判断。

**Raises 段**：列出本函数**有意抛出**的异常及其触发条件。调用方据此决定要不要 try/except：

```python
def withdraw(uid: int, amount: int) -> str:
    """取款。

    Raises:
        ValueError: amount 非正数。
        InsufficientBalanceError: 账户余额不足。
        RiskControlError: 触发风控规则，需人工复核。
    """
    if amount <= 0:
        raise ValueError("amount 必须为正")
    ...
```

注意 Raises 只写"函数主动 raise 的、调用方需要知情并可能处理的"异常。底层库泄漏上来的、不该让调用方处理的内部异常不要写进来，否则会误导。

### 2.6 一个完整的业务函数 docstring + help 展示

把前面几节串起来。下面是一个真实业务函数——"发起退款"——写完整 docstring 后用 `help()` 展示效果。注意 docstring 怎么把签名表达不出来的"边界条件、异常、副作用"全补上。

```python
class RefundError(Exception):
    """退款失败的基础异常。"""


def refund(order_id: str, reason: str, amount_cents: int | None = None) -> str:
    """对一笔已支付订单发起退款。

    只能对状态为 PAID 的订单退款；部分退款需指定 amount_cents，
    全额退款则留空。退款异步处理，本函数返回后并不代表款项到账，
    需后续轮询 refund_status(refund_no) 或等回调。

    Args:
        order_id: 订单号，必须已存在且状态为 PAID。
        reason: 退款原因，最长 128 字。会原样记录到流水。
        amount_cents: 退款金额（分）。为 None 表示全额退；
            指定时必须小于等于订单可退金额且为正。

    Returns:
        str: 退款单号，形如 'R' + 14 位时间戳序列，可用于查询。

    Raises:
        ValueError: order_id 不存在，或 reason 为空。
        RefundError: 订单状态非 PAID，或可退金额不足。

    Side Effects:
        会写一条 refund_log 记录、发送风控事件消息。
    """
    if not order_id:
        raise ValueError("order_id 不能为空")
    if not reason:
        raise ValueError("reason 不能为空")
    # 实际退款逻辑省略
    return "R20260723000001"


help(refund)
```

```text
# 输出（节选）：
Help on function refund in module __main__:

refund(order_id: str, reason: str, amount_cents: int | None = None) -> str
    对一笔已支付订单发起退款。

    只能对状态为 PAID 的订单退款；部分退款需指定 amount_cents，
    全额退款则留空。退款异步处理，本函数返回后并不代表款项到账，
    需后续轮询 refund_status(refund_no) 或等回调。

    Args:
        order_id: 订单号，必须已存在且状态为 PAID。
        reason: 退款原因，最长 128 字。会原样记录到流水。
        amount_cents: 退款金额（分）。为 None 表示全额退；
            指定时必须小于等于订单可退金额且为正。

    Returns:
        str: 退款单号，形如 'R' + 14 位时间戳序列，可用于查询。

    Raises:
        ValueError: order_id 不存在，或 reason 为空。
        RefundError: 订单状态非 PAID，或可退金额不足。

    Side Effects:
        会写一条 refund_log 记录、发送风控事件消息。
```

这份 docstring 把一个"发起退款"动作的所有调用方须知一次性讲清：前置条件（订单状态）、参数语义（amount_cents 为 None 的特殊含义）、返回值结构、可能抛出的异常、副作用。任何调用者读完它就够动笔写调用代码了，不必再翻内部实现。

### 2.7 模块 docstring + 类 docstring + 方法 docstring 的层次示例

一个完整文件应当自上而下"层层有 docstring"。下面这个 `storage.py` 是个简化版的文件存储模块，演示模块、类、方法三级 docstring 如何承接：

```python
# 文件 storage.py
"""轻量文件存储模块。

提供基于本地磁盘的简单对象存储能力：写、读、删、列举。
适合单机小规模场景；生产环境分布式存储请用 OSS SDK。
"""

from pathlib import Path


class FileStore:
    """基于本地目录的文件存储。

    每个 FileStore 绑定一个根目录，所有 key 会被映射成
    该目录下的文件路径。key 中 / 会被当作子目录分隔符。

    Example:
        store = FileStore("/var/data/myapp")
        store.put("users/1/avatar", b"\\x89PNG...")
        store.get("users/1/avatar")
    """

    def __init__(self, root: str):
        """初始化存储实例。

        Args:
            root: 根目录路径，不存在会自动创建。
        """
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)

    def put(self, key: str, data: bytes) -> None:
        """写入一个对象。

        Args:
            key: 对象键，支持多级，如 'users/1/avatar'。
            data: 对象内容（字节串）。

        Raises:
            ValueError: key 为空或以 / 开头。
        """
        if not key or key.startswith("/"):
            raise ValueError("非法 key")
        path = self.root / key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)

    def get(self, key: str) -> bytes:
        """读取一个对象。

        Args:
            key: 对象键。

        Returns:
            bytes: 对象内容。

        Raises:
            KeyError: 对象不存在。
        """
        path = self.root / key
        if not path.exists():
            raise KeyError(key)
        return path.read_bytes()

    def delete(self, key: str) -> bool:
        """删除一个对象。

        Args:
            key: 对象键。

        Returns:
            bool: 是否确实删除了对象。key 不存在时返回 False。
        """
        path = self.root / key
        if path.exists():
            path.unlink()
            return True
        return False
```

```python
import storage

help(storage.FileStore)
```

```text
# 输出（节选）：
Help on class FileStore in module storage:

class FileStore(builtins.object)
 |  基于本地目录的文件存储。
 |
 |  每个 FileStore 绑定一个根目录...
 |
 |  Methods defined here:
 |
 |  __init__(self, root: str)
 |      初始化存储实例。
 |      ...
 |
 |  delete(self, key: str) -> bool
 |      删除一个对象。
 |      ...
 |
 |  get(self, key: str) -> bytes
 |      读取一个对象。
 |      ...
 |
 |  put(self, key: str, data: bytes) -> None
 |      写入一个对象。
 |      ...
```

`help(FileStore)` 输出里先看到类的 docstring（"基于本地目录……"），再依次列出每个方法的签名与 docstring。**这种"层次清晰"的阅读体验完全取决于你有没有在每个层级都写 docstring**——少了任何一层，help 输出对应位置就是空的。

### 2.8 **doc** 的直接访问与编程式读取

`__doc__` 既然是普通属性，就能被程序读取后做处理。典型场景：

**批量生成函数清单**

```python
def login(uid): ...
def logout(uid): ...
def refresh_token(uid): ...

# 标准库有些函数没写 docstring，下面演示填充版
def login(uid):
    """用户登录。"""
    pass

def logout(uid):
    """用户登出。"""
    pass

for fn in (login, logout):
    print(f"{fn.__name__}: {fn.__doc__}")
```

```text
# 输出：
login: 用户登录。
logout: 用户登出
```

**写一个"文档完整性检查器"**

```python
def check_docstrings(module):
    """检查模块里所有函数是否都写了 docstring，打印缺失清单。"""
    import inspect
    missing = []
    for name, obj in inspect.getmembers(module, inspect.isfunction):
        if obj.__doc__ is None:
            missing.append(name)
    if missing:
        print(f"缺少 docstring 的函数：{missing}")
    else:
        print("所有函数均已写 docstring")


# 假设 aaa 模块里有几个函数
# import aaa
# check_docstrings(aaa)
```

这类工具是 docstring "运行期可访问"特性的直接受益者——靠 `#` 注释是绝对做不出来的。

### 2.9 inspect.getdoc()：去缩进的正确方式

直接读 `__doc__` 的问题前面 2.1 已经看到：多行 docstring 后面几行带了源码缩进的空白，展示出来很难看。Python 的 `inspect` 模块提供了 `getdoc(obj)`，它用 `cleandoc` 算法把多余缩进去掉，返回"干净版"：

```python
import inspect


def fetch_user(uid: int) -> dict:
    """获取用户信息。

    参数 uid 为用户 ID。
    返回包含账号、昵称、头像的 dict。
    """
    ...


# 直接读 __doc__：保留源码缩进
print(repr(fetch_user.__doc__))
# 输出：'获取用户信息。\n\n    参数 uid 为用户 ID。\n    返回包含账号、昵称、头像的 dict。\n    '

# inspect.getdoc：去掉公共缩进
print(repr(inspect.getdoc(fetch_user)))
# 输出：'获取用户信息。\n\n参数 uid 为用户 ID。\n返回包含账号、昵称、头像的 dict。'
```

`inspect.getdoc` 的处理逻辑（`inspect.cleandoc`）大致是：

1. 把所有行（除第一行）前的"公共最小缩进"统一去掉；
2. 第一行（摘要）前后的空白去掉；
3. 行尾空白去掉。

结果是"看起来像排版好的多段文本"。`help()` 内部用的也是同样思路——`pydoc.doc` 在格式化时调用了类似清理，所以 `help()` 输出没有难看的缩进。

**什么场景用 getdoc 而不是 **doc\*\*\*\*

- 你要在 GUI、Web、CLI 工具里**展示**文档——用 `getdoc`。
- 你要拿到原始字符串做精确匹配或正则——用 `__doc__`。
- 你要写 docstring 解析器（抽 Args/Returns 段）——先用 `getdoc` 再 parse，能少处理缩进。

### 2.10 docstring 与注释 # 的区别

这一节把 docstring 与注释的差异系统对比一遍，因为这是初学者最容易混淆的点。

**注释 # 的特征**

- 是"给读源码的人看的说明"。
- 解释器解析阶段就丢弃，运行期**完全不存在**，无法被程序读取。
- 适合写"为什么这样写"这类不必对使用者暴露的实现注解。

**docstring 的特征**

- 是"给使用这个对象的人（含运行时工具）看的文档"。
- 编译期被存入函数对象 `__doc__`，运行期一直存在，可被 `help()`、IDE、`inspect.getdoc` 访问。
- 适合写"这个函数做什么、参数什么意思、返回什么、抛什么异常"这类接口契约。

对照示例：

```python
def calc_discount(price, level):
    # 如果价格超过 10000，强制走 VIP 通道
    # 这是为了绕开老系统的折扣限制（legacy bug #4521）
    """计算折扣后价格。

    Args:
        price: 原价（分）。
        level: 用户等级 1-5。

    Returns:
        int: 折后价（分）。
    """
    if price > 10000:
        # 走 VIP 通道
        ...
    ...
```

这里：

- docstring 讲"这个函数给外部调用者承诺什么"——参数、返回、含义。
- `#` 注释讲"内部实现为什么这样写"——兼容老系统、绕 bug。

两类信息面向不同读者，混在一起不合适。把接口契约写进 `#` 注释会让 `help()` 拿不到、IDE 无法提示；把实现细节写进 docstring 会让接口说明被无关信息淹没。

### 2.11 为何要写 docstring

最后从收益角度把"为什么要写"讲透——这决定了你愿不愿意养成习惯。

**收益一：IDE 悬浮提示**

在 PyCharm / VS Code 里，鼠标悬停在某个函数名上会弹出一个小气泡，显示它的签名和 docstring。写 docstring 后，调用方根本不用跳到定义就能知道参数含义，写代码节奏不会被"翻看实现"打断。不写 docstring 时，气泡里只有签名，参数含义全靠猜。

**收益二：help() 随时查**

交互式解释器（REPL）或 Jupyter 里调 `help(obj)`，瞬间拿到一份格式化文档。调试时不用切窗口去翻文档站。这对教学、探索式编程效率提升极大。

**收益三：自动文档工具**

Sphinx（配 `autodoc` 扩展）能扫描整个包，把每个模块/类/函数的 docstring 抽出来，渲染成 HTML 文档站。pdoc、MkDocs 等工具同理。写了 docstring = 自动生成一份文档站；不写 = 文档站是空的。这是"文档与代码同源"的根本保证。

**收益四：团队协作的契约**

调用方读 docstring 就能正确调用，不必读你的实现。当你修改实现、但保持 docstring 描述的契约不变，调用方代码不会出问题。docstring 是函数与调用方之间的"接口合同"。

**收益五：写 docstring 会逼你思考接口**

很多人不写 docstring 是因为"自己知道这函数干啥"。但一旦尝试把"它做什么、参数什么意思、边界在哪"写出来，往往会发现自己对参数语义其实没想清楚——比如 `amount` 是分还是元？`coupon=None` 是"不使用优惠券"还是"优惠券字段未提供"？写下 docstring 的过程就是梳理接口设计的过程。

---

## 3. 最佳实践

**摘要要具体到能替代函数名**

不推荐：

```python
def send_email(to, subject, body):
    """发送邮件。"""
```

"发送邮件"几乎就是函数名的翻译，没增加信息。推荐：

```python
def send_email(to, subject, body):
    """通过 SMTP 发送一封纯文本邮件，失败自动重试 3 次。"""
```

后者补充了"渠道（SMTP）""内容类型（纯文本）""失败行为（重试 3 次）"——这些是签名表达不了的。

**不要用 docstring 复述类型注解**

如果已经写了类型注解，docstring 里就不用再抄一遍类型：

```python
# 不推荐：类型在签名和 docstring 里重复
def add(a: int, b: int) -> int:
    """两个整数相加。

    Args:
        a (int): 第一个整数。
        b (int): 第二个整数。

    Returns:
        int: 和。
    """
```

```python
# 推荐：docstring 只讲"含义"，类型交给注解
def add(a: int, b: int) -> int:
    """两个整数相加。

    Args:
        a: 第一个加数。
        b: 第二个加数。

    Returns:
        两数之和。
    """
```

**docstring 必须与实现同步**

过期的 docstring 比没有更糟，因为它会让调用方基于错误前提写代码。改函数行为时，第一件事是改 docstring，再改实现。

**第一行摘要单独成行**

PEP 257 要求多行 docstring 的摘要行后必须空一行再写详细段，摘不要自己续行：

```python
# 不推荐
def f():
    """做某事。这里是详细说明，紧贴摘要行。"""

# 推荐
def f():
    """做某事。

    这里是详细说明，与摘要之间空一行。
    """
```

某些工具（Sphinx、帮助格式化器）会按"第一行 + 空行 + 剩余"切分摘要与正文，违反这个结构会导致摘要被截断或正文被并入摘要。

**用三引号而非单引号**

```python
# 不推荐
def f():
    '做某事。'

# 推荐
def f():
    """做某事。"""
```

单引号字符串语法上也能成为 docstring，但社区（PEP 257）统一约定用三引号 `"""`，即便只有一行。统一的三引号让"扩展为多行"时不必改引号风格，也利于工具用正则识别。

**结尾的 \"\"\" 单独成行还是贴尾**

```python
# 单行：贴尾
def f():
    """做某事。"""

# 多行：单独成行
def f():
    """做某事。

    详细说明。
    """
```

单行 docstring 的结尾 `"""` 紧贴最后一个字；多行的结尾 `"""` 单独一行，与开头 `"""` 在同一缩进列。两种约定不要混。

**不要在 docstring 里写"我用…实现"这类实现细节**

docstring 描述接口契约而非实现。写"内部用 X 算法实现"会让以后换算法时 docstring 过期。要写实现细节，写在 `#` 注释或专门的设计文档里。

**Raises 段只列有意抛出的异常**

```python
# 不推荐
def read_config(path):
    """读取配置。

    Raises:
        FileNotFoundError: 配置文件不存在。
        PermissionError: 无权限。
        OSError: 基类，所有上述异常的父类。
    """
```

`OSError` 是父类，写进来不增加信息，反而让调用方以为要分别捕获一堆。只列出调用方"需要区分对待"的异常即可。

**用 doctest 把示例当测试**

```python
def half(x):
    """返回 x 的一半。

    >>> half(10)
    5.0
    >>> half(7)
    3.5
    """
    return x / 2
```

`doctest` 模块会把 `>>>` 行当输入、下一行当期望输出，跑一遍验证。这样示例不会过期——一旦行为变了 doctest 立刻报错。

**公开 API 一定写，私有辅助函数可省**

```python
def _normalize_key(key):
    # 内部辅助，调用方不会直接用，省 docstring
    return key.strip().lower()


def get_config(key):
    """读取配置项。

    Args:
        key: 配置键，大小写不敏感。

    Returns:
        配置值字符串，不存在时返回 None。
    """
    return _store.get(_normalize_key(key))
```

下划线开头的私有函数实现细节不暴露给外部，docstring 收益降低，可以只写 `#` 注释。但只要项目里别处会调它，就仍建议写。

**类型注解 + docstring 配合而非二选一**

类型注解回答"是什么类型"，docstring 回答"这个值什么意思、有什么约束"。两者配合最有效，不是非此即彼。

---

## 4. 原理

理解 docstring 在 Python 内部怎么"落地"，能帮你解释几个常见疑问：为什么 docstring 缩进会原样进入 `__doc__`？为什么 `help()` 输出没有那种缩进？

**编译期提取**

Python 解释器在编译一个 `def` 语句时，会把函数体的字节码、常量表、docstring 等组装成一个函数对象（`PyFunction_Type` 的实例）。docstring 就是函数体里"第一个语句如果是字符串字面量"的特殊处理：编译器把这个字符串字面量从函数体语句里"摘出来"，单独存到函数对象的 `func.__doc__` 槽位上，不生成任何执行它的字节码。这就是为什么 docstring 不会"被执行"——它只是被记录。

类、模块同理：`class` 体、模块顶层的第一个字符串字面量也会被摘出来，存到对应对象的 `__doc__`。

\***\*doc** 是函数对象的属性而非局部变量\*\*

很多人误以为 docstring 在函数内可以当普通字符串变量用，其实不是。它没有绑定到任何局部名字，只是被存到函数对象上：

```python
def f():
    """docstring"""
    print("inner")


f.__doc__   # 'docstring'，可访问
# 函数体内没有任何名字指向这个字符串
```

也就是说，docstring 是"对象的属性"而非"函数内的变量"。这也解释了为什么它能在函数定义之外被访问——它属于函数对象本身，不属于函数执行时的作用域。

**help() 调用 pydoc 做格式化**

`help(obj)` 内部把 `obj` 交给标准库的 `pydoc` 模块。`pydoc` 根据对象类型（函数、类、模块、方法……）走不同分支：

- 取出 `obj.__doc__`，用 `inspect.getdoc` 或等价的 `cleandoc` 去掉多余缩进。
- 对函数：补上签名（从 `inspect.signature` 取），拼成 `name(args)\n  <清理后的 docstring>`。
- 对类：列出基类、方法表，每个方法再各自走一遍函数分支。
- 对模块：分段落 NAME / DESCRIPTION / FUNCTIONS / CLASSES 等组织。

最终把这份组装好的文本送到分页器（或直接 `print`）。所以 `help` 的输出就是"pydoc 用你写的 docstring 排版出来的"。这也意味着你写得越结构化（带 `Args:` 段等），`help` 越好读——尽管 pydoc 本身不解析这些段，它只是按行展示，但分段对齐的视觉效果会更好。

**inspect.getdoc 与 cleandoc**

`inspect.getdoc(obj)` 的实现等价于：取 `obj.__doc__`，若为 `None` 返回 `None`；否则调 `inspect.cleandoc(doc)`。`cleandoc` 的算法大致是：

1. 按行 split。
2. 找到除第一行外所有非空行的"最小前导空白"作为公共缩进。
3. 把这些行的公共缩进去掉。
4. 去掉首尾全空行，去掉每行尾空白。

所以 `getdoc` 返回的版本没有源码缩进的视觉污染。这也是 `help` 输出干净的原因。

**docstring 是运行期属性而非纯注释**

把上面几点串起来：docstring 的"运行期存在性"是它区别于 `#` 注释的根本。注释在编译时被词法分析器丢弃，字节码里没有踪迹；docstring 在编译时被提取并绑定到函数对象上，对象活着它就活着。这带来了几个直接后果：

- `help()`、`inspect.getdoc` 能拿到它——靠的是它在运行期是真实属性。
- IDE 悬浮提示能拿它——IDE 通过静态分析或 introspection 都能读到 `__doc__`。
- 自动文档工具能拿它——Sphinx 等以"导入模块后 introspect `__doc__`"为主路径。
- 程序能读它做校验、生成清单——`#` 注释做不到。

这一层"对象自带文档"的设计是 Python 文档生态的基石。

---

## 5. 总结

- **docstring** 是函数、类、模块定义紧随其后的第一个字符串字面量，被解释器提取并存到对象的 `__doc__` 属性，运行期可被访问。
- **单行 docstring** 适合简单函数，一行摘要即可；**多行 docstring** 用于需要说明参数、返回、异常时，结构为"摘要 + 空行 + 详细段"。
- 三种主流格式约定：**reStructuredText**（`:param:` 字段）、**Google 风格**（`Args:` / `Returns:` / `Raises:` 段）、**NumPy 风格**（段标题下加横线、参数像表格）。Google 风格在应用代码中最常用。
- **Args / Returns / Raises** 段分别描述参数含义、返回值结构、有意抛出的异常，是 docstring 的"干货三段"。
- **help()** 把对象的 `__doc__` 通过 `pydoc` 格式化展示，是交互式查文档的官方途径；它是给人看的工具，不要在生产代码里当 API 用。
- **`__doc__` 直接访问**拿到原始字符串（带源码缩进）；**`inspect.getdoc`** 用 `cleandoc` 去除公共缩进，返回干净版，适合做展示与解析。
- **docstring 与注释 `#` 的本质区别**：docstring 是运行期对象属性、描述接口契约；注释是开发者读的实现备注、运行期不存在。两者面向不同读者，不可互相替代。
- 写 docstring 的收益：IDE 悬浮提示、`help()` 即时查阅、Sphinx 等自动文档、团队接口契约、强迫自己厘清接口设计。
- 读完本文你应能掌握：
  - 给任意函数、类、模块写出符合 PEP 257 与团队风格（Google / NumPy / reST）的 docstring；
  - 在 `Args / Returns / Raises` 段准确描述参数、返回值、异常，并与类型注解配合而非重复；
  - 用 `help(obj)` 与 `inspect.getdoc(obj)` 读取文档，理解两者与 `obj.__doc__` 的差异；
  - 解释 docstring 在编译期被提取、存入函数对象 `__doc__`、运行期随对象存在这一整套机制；
  - 区分 docstring 与 `#` 注释的适用场景，知道何时该写哪一种。
