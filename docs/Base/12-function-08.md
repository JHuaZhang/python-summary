---
group:
  title: 【12】函数核心机制
  order: 12
order: 7
title: 参数顺序规范列
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 为什么需要参数顺序规范

在前面的几篇笔记中，我们分别学习了位置参数与关键字参数、默认参数、`*args`、`**kwargs`，以及即将展开的仅位置参数（`/`）和仅关键字参数（`*`）。这些参数种类各自有不同的语法形式和绑定规则。当它们出现在同一个函数签名中时，就不能随意排列了——Python 对它们的顺序有严格的语法约束。

设想一个函数签名 `def f(a, b, /, c, d=2, *args, e, f3=3, **kwargs)`。这里同时出现了六类参数：仅位置参数（`a`、`b`）、普通位置参数（`c`）、带默认值的普通位置参数（`d`）、可变位置参数（`*args`）、仅关键字参数（`e`）、带默认值的仅关键字参数（`f3`）和可变关键字参数（`**kwargs`）。它们之间为什么必须按这个顺序排列？调换两个会怎样？调用时实参又该如何排列？这就是本篇要统一回答的问题。

参数顺序规范的存在不是语法的洁癖，而是参数绑定机制的自然结果。Python 在调用函数时，需要把调用方传入的实参一一绑定到形参上，而这种绑定是"从前到后、无歧义匹配"的。如果允许参数乱序排列，绑定过程就会出现二义性——某个实参既能绑定到参数 A，也能绑定到参数 B，解释器就无法决定。因此，语法规定了一个让绑定过程无歧义的固定顺序，理解了这个顺序，也就理解了 Python 函数签名设计的一半精髓。

### 1.2 参数种类速览与本篇定位

为了让后面的讲解有共同语言，先快速罗列 Python 函数签名中可能出现的六类参数，并标注它们的"顺序归属"：

| 参数种类       | 语法示例                              | 是否可省略 | 顺序位置       |
| -------------- | ------------------------------------- | ---------- | -------------- |
| 仅位置参数     | `a, b`（位于 `/` 之前）               | 可省略     | 第 1 位        |
| 普通位置参数   | `c, d`（`/` 之后、`*` 之前）          | 可省略     | 第 2 位        |
| 默认值参数     | `d=2`（带默认值的位置或仅关键字参数） | 可省略     | 依附于所属种类 |
| 可变位置参数   | `*args`（或单独 `*`）                 | 可省略     | 第 3 位        |
| 仅关键字参数   | `e, f=3`（位于 `*` 之后）             | 可省略     | 第 4 位        |
| 可变关键字参数 | `**kwargs`                            | 可省略     | 第 5 位        |

本篇是这些参数种类的"总结性篇章"。前面几篇笔记各自聚焦一类参数，零散地提到过"这个参数必须放在那个参数之后"之类的规则，本篇的目标是把所有顺序规则统一起来，给出一个完整的、可查阅的排列规范。关于 `/` 和 `*` 这两个标志符，本篇只做规则性提及（它们分别标记仅位置参数区和仅关键字参数区的边界），其细节含义留给 08 篇（仅位置参数）和 09 篇（仅关键字参数）展开。

### 1.3 最小示例：完整顺序的一瞥

先看一个把所有种类都囊括进去的函数签名，它直观展示了合法排列的样子：

```python
# 一个包含全部六类参数的函数签名
# 注意：limit=100 带默认值位于仅位置区，其后跨 / 的普通位置参数 column 也必须带默认值
#       ——否则触发"non-default argument follows default argument"（详见 2.3、4.2）
def build_query(
    table, limit=100, /,              # 仅位置参数区：table 必填、limit 带默认值
    column="*", offset=0,             # 普通位置参数区：column、offset 均带默认值（与 limit 默认值链衔接）
    *filters,                         # 可变位置参数：收集多余的实参到 filters 元组
    order_by="id",                    # 仅关键字参数：必须用关键字传入
    **options                         # 可变关键字参数：收集多余的关键字实参
):
    print(f"table={table}, limit={limit}")
    print(f"column={column}, offset={offset}")
    print(f"filters={filters}")
    print(f"order_by={order_by}")
    print(f"options={options}")

# 调用时，实参也要遵循对应的顺序规则
build_query("users", 50, "name", 10, "active", "vip", order_by="created", timeout=30)
# 输出：
# table=users, limit=50
# column=name, offset=10
# filters=('active', 'vip')
# order_by=created
# options={'timeout': 30}
```

这个签名里 `/` 之前是仅位置参数区，`*filters` 既是可变位置参数也充当了"`*` 之后均为仅关键字参数"的分界线，`**options` 收纳所有额外的关键字实参。整个签名的排列就是本篇要详细讲解的标准顺序。后面的章节会把这六类参数逐一拆开，讲清楚它们各自在序列中的合法位置、为什么必须这样排、以及排错时解释器会报什么错。

## 2. 核心内容

### 2.1 完整合法顺序总表

Python 函数定义中，参数的完整合法顺序如下（从左到右）：

```python
def 函数名(
    仅位置参数,          # 1. 位于 / 之前（必填）
    /,                   #    仅位置参数区的结束标志（可省略，省略则无仅位置参数）
    普通位置参数,        # 2. 位于 / 之后、* 之前（同区内无默认值参数在前）
    普通位置参数=默认值,  #    带默认值（同区内其后的位置参数也必须带默认值）
    *args,               # 3. 可变位置参数（或单独 * 作为分界）
    仅关键字参数,        # 4. 位于 * 之后
    仅关键字参数=默认值,  #    带默认值（仅关键字区内顺序自由）
    **kwargs             # 5. 可变关键字参数，必须放在最后
):
    ...
```

如果确实需要给仅位置参数带上默认值，则跨过 `/` 之后的普通位置参数也必须全部带默认值：

```python
def 函数名(
    仅位置参数,          # 必填
    仅位置参数=默认值,    # 带默认值（其后跨 / 的普通位置参数也必须带默认值）
    /,
    普通位置参数=默认值,  # 因前区有默认值，这里也必须带默认值
    普通位置参数=默认值,
    *args,
    仅关键字参数,
    仅关键字参数=默认值,
    **kwargs
):
    ...
```

把这个顺序整理成一张更清晰的"位置归属表"：

| 序号 | 参数种类       | 在签名中的位置                         | 标志符   | 能否带默认值       | 典型用法                     |
| ---- | -------------- | -------------------------------------- | -------- | ------------------ | ---------------------------- |
| 1    | 仅位置参数     | 签名最前、`/` 之前                     | `/` 结束 | 能                 | 强制按位置传参的参数         |
| 2    | 普通位置参数   | `/` 之后、`*`（或 `*args`）之前        | 无       | 能                 | 既可位置传也可关键字传的参数 |
| 3    | 可变位置参数   | `*args` 或单独 `*`                     | `*`      | 否（本身是收集器） | 收集多余位置实参             |
| 4    | 仅关键字参数   | `*`（或 `*args`）之后、`**kwargs` 之前 | `*` 开始 | 能                 | 强制按关键字传参的参数       |
| 5    | 可变关键字参数 | 签名最后                               | `**`     | 否（本身是收集器） | 收集多余关键字实参           |

**三条不可逾越的规则**

从总表中可以提炼出三条核心规则，它们是整个参数顺序规范的骨架：

1. **`/` 只能出现在参数列表的前段**，且 `/` 之前不能有 `*` 或 `**`。`/` 划出的是"仅位置参数区"，这个区只能位于签名的最前部。
2. **`*`（含 `*args`）是"分水岭"**。`*` 之前的参数（除仅位置参数区外）可以位置传也可以关键字传；`*` 之后的参数只能关键字传。因此 `*` 的位置决定了"仅关键字参数区"的起点。
3. **`**kwargs`必须放在最后**。因为它要收集所有未被匹配的关键字实参，如果它后面还有任何参数，那些参数就永远无法被关键字传参匹配到（实参会被`\*\*kwargs` 先收走），产生二义性。

**默认值参数的从属规则**

需要特别说明的是，"默认值"本身不是一个独立的参数种类，而是参数的一个属性。一个参数能否带默认值、带默认值后位置如何，取决于它所属的种类：

- 仅位置参数可以带默认值，带默认值后仍位于 `/` 之前，必须排在同区无默认值的仅位置参数之后。
- 普通位置参数可以带默认值，带默认值后必须排在同区无默认值的普通位置参数之后。
- 仅关键字参数可以带默认值，带默认值后排在其所在区内任何位置均可（因为关键字传参不依赖顺序），但约定俗成也是无默认值在前、有默认值在后。
- `*args` 和 `**kwargs` 本身就是"收集器"，不需要也不应该带默认值（`*args` 的"默认值"相当于空元组 `()`，`**kwargs` 相当于空字典 `{}`，这是内建行为）。

由此可以补充一条关于默认值的约束：**带默认值的位置参数之后，不能再出现无默认值的位置参数**。这里"位置参数"是广义的，包含仅位置参数和普通位置参数，且规则会跨过 `/` 边界起作用——也就是说，`/` 之前如果有带默认值参数，而 `/` 之后紧接着一个无默认值的普通位置参数，同样非法。唯一能让这条约束"断开"的是 `*args`（或单独 `*`）：它把位置参数区和仅关键字区隔开，因此 `*` 之后（仅关键字区内）的默认值顺序完全自由。违反这条规则会报 `SyntaxError: non-default argument follows default argument`。

下面两个对比能帮助厘清这条跨区约束的边界：

```python
# 非法：b=1 带默认值位于 / 前，c 无默认值位于 / 后，跨 / 违反约束
def bad(a, b=1, /, c):
    pass
# SyntaxError: non-default argument follows default argument

# 合法：只要 / 后的首个普通位置参数也带默认值（或全部无默认值在前），即可通过
def ok1(a, b, /, c, d=2):
    pass

def ok2(a, b=1, /, c=2, d=3):
    pass

# 合法：*args 阻断了约束的传递，其后（仅关键字区）默认值顺序自由
def ok3(a, d=2, *args, e):
    pass
```

### 2.2 逐类参数归位讲解

总表给出了宏观顺序，但要真正理解"为什么是这个顺序"，需要把每一类参数单独拎出来，看它被允许出现在哪里、被禁止出现在哪里、以及这样设计的理由。

#### 2.2.1 仅位置参数 —— 签名的最前哨

仅位置参数由 `/` 标记。`/` 之前出现的所有参数都是仅位置参数，调用时必须按位置传入，不能用关键字传参。仅位置参数只能出现在签名的最前面，不能出现在 `*args` 或 `**kwargs` 之后。

```python
# 仅位置参数的正确位置：最前面，/ 之前
def power(base, exponent, /):
    return base ** exponent

print(power(2, 10))           # 输出：1024
# power(base=2, exponent=10)  # 报错：仅位置参数不能用关键字传
```

如果硬要把仅位置参数放到后面，会直接语法报错：

```python
# 错误：/ 不能出现在 *args 之后
def wrong(*args, a, /):
    pass
# SyntaxError: / must appear in scope before *
```

这个报错信息很直白：`/` 必须出现在 `*` 之前。也就是说，仅位置参数区（`/` 之前）永远在可变位置参数（`*args`）和仅关键字参数区（`*` 之后）的前面。原因在于绑定的优先级：仅位置参数只能用位置实参匹配，而位置实参是从实参序列最前面开始消耗的，所以仅位置参数必须排在能接收位置实参的最前段。

关于 `/` 标志符本身，本篇只记住一点：它是一个"分界符"，放在它前面的参数归入仅位置区，`/` 本身不消耗任何参数。`/` 的更细节含义（比如为什么会有这个设计、它对 API 演化的保护作用）留到 08 篇展开。

#### 2.2.2 普通位置参数 —— `/` 与 `*` 之间的缓冲地带

普通位置参数是指既能按位置传、也能按关键字传的参数。它们位于 `/` 之后、`*`（或 `*args`）之前。如果签名里没有 `/`，那么签名开头直到 `*` 之前的参数都是普通位置参数（这是最常见的形态）。

```python
# 无 / 时，开头到 * 之前都是普通位置参数
def greet(name, greeting, punctuation="!"):
    # name、greeting、punctuation 都是普通位置参数（可位置也可关键字）
    return f"{greeting}, {name}{punctuation}"

print(greet("Alice", "Hi"))                 # 输出：Hi, Alice!
print(greet("Bob", greeting="Hello"))       # 输出：Hello, Bob!
print(greet(name="Carol", greeting="Hey"))  # 输出：Hey, Carol!
```

普通位置参数区有一个重要约束：带默认值的参数必须排在无默认值的参数之后。这是因为位置实参是按顺序匹配的，如果无默认值参数排在带默认值参数后面，调用时少传一个实参，解释器无法判断是"省略了带默认值的那个"还是"省略了后面的无默认值那个"。

```python
# 错误：无默认值参数跟在带默认值参数后面
def wrong(a=1, b):
    pass
# SyntaxError: non-default argument follows default argument
```

#### 2.2.3 可变位置参数 \*args —— 承前启后的枢纽

可变位置参数 `*args` 收集所有未被前面参数匹配的多余位置实参，打包成一个元组。它在签名中的位置是固定的：必须在所有位置参数（仅位置 + 普通位置）之后，在所有仅关键字参数之前。

```python
# *args 收集多余的位置实参
def sum_all(prefix, *numbers):
    total = sum(numbers)
    return f"{prefix}: {total}"

print(sum_all("总和", 1, 2, 3, 4, 5))  # 输出：总和: 15
# numbers = (1, 2, 3, 4, 5)
```

`*args` 的位置之所以严格，是因为它承担"收集器"角色：它前面的参数按位置匹配剩余的位置实参，它把剩下的一股脑收进元组，它后面的参数再也无法接收位置实参（因为位置实参已经被 `*args` 全部收走），所以 `*` 之后的参数只能用关键字传参——这恰好就是"仅关键字参数区"的由来。

有时我们并不需要收集多余的实参，只是想用 `*` 来开启仅关键字参数区。这时可以写一个单独的 `*`，不带名字：

```python
# 单独 * 不收集实参，只做分界
def create_user(name, *, active=True):
    # active 是仅关键字参数
    return f"{name} (active={active})"

print(create_user("Alice", active=False))  # 输出：Alice (active=False)
# create_user("Bob", False)                # 报错：active 只能用关键字传
```

单独的 `*` 和 `*args` 在"划定仅关键字参数区"这件事上作用完全一样，区别只在于前者不额外收集实参。

#### 2.2.4 仅关键字参数 —— \* 之后的专属区域

仅关键字参数位于 `*`（或 `*args`）之后、`**kwargs` 之前，调用时必须用关键字传参。它们之所以"仅关键字"，是因为 `*args` 已经把剩余的位置实参全收走了，没有位置实参能流到这里。

```python
# * 之后的参数都是仅关键字参数
def configure(host, port, *, debug=False, timeout=30):
    return f"{host}:{port} (debug={debug}, timeout={timeout})"

print(configure("localhost", 8080))                      # 输出：localhost:8080 (debug=False, timeout=30)
print(configure("localhost", 8080, debug=True, timeout=5))  # 输出：localhost:8080 (debug=True, timeout=5)
# configure("localhost", 8080, True)                     # 报错：debug/timeout 必须用关键字传
```

仅关键字参数区内，带默认值与否的自由度比普通位置参数区大：无默认值的仅关键字参数可以排在带默认值的仅关键字参数之前或之后，都能正常工作，因为它们都是用关键字传参的，不依赖位置顺序。

```python
# 仅关键字参数区内，带默认值和无默认值的前后顺序不影响
def f1(*, a, b=1):
    return f"a={a}, b={b}"

def f2(*, b=1, a):
    return f"a={a}, b={b}"

print(f1(a=10))    # 输出：a=10, b=1
print(f2(a=10))    # 输出：a=10, b=1
```

但为了可读性，仍推荐把无默认值的仅关键字参数放在前面，带默认值的放在后面，和普通位置参数区保持一致的约定。

关于 `*` 标志符，本篇只强调它的"分界"作用。它为什么能强制关键字传参、对 API 设计有什么好处，留到 09 篇展开。

#### 2.2.5 可变关键字参数 \*\*kwargs —— 收尾的容器

可变关键字参数 `**kwargs` 收集所有未被前面参数匹配的多余关键字实参，打包成一个字典。它必须放在签名的最后，任何参数都不能跟在它后面。

```python
# **kwargs 收集多余的关键字实参
def make_request(url, method="GET", **headers):
    print(f"{method} {url}")
    for key, value in headers.items():
        print(f"  {key}: {value}")

make_request("/api/users", method="POST", Authorization="Bearer xxx", Accept="application/json")
# 输出：
# POST /api/users
#   Authorization: Bearer xxx
#   Accept: application/json
```

`**kwargs` 必须放在最后的原因前面已经提过：如果它后面还有参数，那些参数要用关键字传参才能被匹配，但关键字实参会先被 `**kwargs` 收走，导致后面的参数永远接收不到值。因此语法层面直接禁止了这种排列：

```python
# 错误：**kwargs 后面不能有任何参数
def wrong(**kwargs, extra):
    pass
# SyntaxError: arguments cannot follow **kwargs
```

### 2.3 错误顺序报错演示

理解了正确顺序，再来看错误顺序会触发什么报错，这能帮助你在实际编码中快速定位签名问题。下面逐一演示几类典型的顺序错误。

**错误一：`/` 出现在 `*` 之后**

```python
# / 必须在 * 之前，标记仅位置参数区
def bad_positional_only(*args, a, /):
    pass
# SyntaxError: / must appear in scope before *
```

`/` 标记的是仅位置参数区，只能位于签名前段。把它放到 `*args` 后面，等于想让一个"仅位置"参数出现在"仅关键字"区域里，自相矛盾，解释器直接拒绝。

**错误二：带默认值参数后跟无默认值参数（同一区内）**

```python
# 在普通位置参数区内，无默认值参数不能跟在带默认值参数后面
def bad_default(a=1, b):
    pass
# SyntaxError: non-default argument follows default argument
```

```python
# 在仅位置参数区内同样适用
def bad_positional_default(a=1, b, /):
    pass
# SyntaxError: non-default argument follows default argument
```

这条规则在仅关键字参数区内不生效，因为仅关键字参数用关键字传参，不依赖位置顺序匹配，所以 `def f(*, a=1, b)` 是合法的。

**错误三：参数跟在 `**kwargs` 之后\*\*

```python
# **kwargs 必须是最后一个参数
def bad_after_kwargs(**kwargs, extra):
    pass
# SyntaxError: arguments cannot follow **kwargs

def bad_after_kwargs2(**kwargs, *args):
    pass
# SyntaxError: arguments cannot follow **kwargs
```

无论后面跟的是普通参数还是另一个可变参数，都不被允许。`**kwargs` 是签名的终点。

**错误四：`*args` 后面出现普通位置参数**

```python
# *args 之后的参数只能是仅关键字参数，不能用位置传参
# 但语法上，def f(*args, a) 本身是合法的——a 变成仅关键字参数
# 真正的错误是误以为 a 可以用位置传参
def f(*args, a):
    return f"args={args}, a={a}"

print(f(1, 2, 3, a=10))  # 输出：args=(1, 2, 3), a=10
# f(1, 2, 3, 10)         # 报错：TypeError: f() missing 1 required keyword-only argument: 'a'
```

这个例子说明，`*args` 后面的参数在语法上是合法的，但它们的性质变了——自动成为仅关键字参数。如果你在调用时仍然按位置传，就会触发 `TypeError`，提示缺少关键字实参。

**错误五：`*` 出现多次**

```python
# 一个签名里只能有一个 *（*args 或单独 *）
def bad_double_star(*args, *, extra):
    pass
# SyntaxError: * argument may appear only once
```

签名里只能有一个 `*` 形式（无论是 `*args` 还是单独 `*`）。`*` 已经划定了仅关键字参数区的起点，重复出现没有意义，语法直接禁止。同理 `/` 也只能出现一次：

```python
def bad_double_slash(a, /, b, /):
    pass
# SyntaxError: / may appear only once
```

### 2.4 调用时实参的顺序规则

前面讲的都是函数**定义**时形参的排列规则。函数**调用**时，实参也有自己的顺序规则，虽然和形参顺序相关但并不完全相同。调用时实参的合法顺序是：

```
位置实参 → 关键字实参 → *序列解包 → **字典解包
```

也就是说，在同一个调用表达式中，普通位置实参写最前面，接着是关键字实参，然后才是 `*` 解包的序列，最后是 `**` 解包的字典。

**基本规则演示**

```python
def f(a, b, c, d, e):
    return f"a={a}, b={b}, c={c}, d={d}, e={e}"

# 正确：位置实参在前，关键字实参在后
print(f(1, 2, c=3, d=4, e=5))  # 输出：a=1, b=2, c=3, d=4, e=5

# 错误：关键字实参后面不能跟位置实参
# f(1, b=2, 3, 4, 5)
# SyntaxError: positional argument follows keyword argument
```

**混合解包的顺序**

```python
def connect(host, port, user, password):
    return f"{user}@{host}:{port} (pwd: {password})"

# 位置实参 → *序列解包 → **字典解包
args_list = ["localhost", 3306]
kwargs_dict = {"user": "admin", "password": "secret"}
print(connect(*args_list, **kwargs_dict))
# 输出：admin@localhost:3306 (pwd: secret)

# 也可以位置实参与解包混用，但位置实参必须在前
print(connect("localhost", 3306, **kwargs_dict))
# 输出：admin@localhost:3306 (pwd: secret)
```

调用时的解包顺序有几个要点：

1. `*seq` 解包出来的元素按位置依次匹配形参，相当于把这些元素当作多个位置实参。
2. `**dict` 解包出来的键值对按关键字匹配形参，相当于把这些键值对当作多个关键字实参。
3. 位置实参（包括 `*seq` 解包的）整体必须在关键字实参（包括 `**dict` 解包的）之前。
4. `*seq` 和 `**dict` 在一次调用中各自只能出现一次（`**dict` 必须在最后）。

**调用时报错示例**

```python
def f(a, b, c):
    return (a, b, c)

# 关键字实参后跟位置实参 → 语法错误
# f(a=1, 2, 3)
# SyntaxError: positional argument follows keyword argument

# **kwargs 解包后还有其他参数 → 语法错误
# f(**{"a": 1, "b": 2}, c=3, d=4)
# 这里 c=3 在 **dict 之后，语法上其实允许（关键字实参之间），但 **dict 必须是最后一个
```

更精确地说，`**dict` 必须是实参列表的最后一个，它的后面不能再有任何实参：

```python
def f(a, b):
    return (a, b)

d = {"a": 1}
# f(**d, b=2)       # 合法，输出 (1, 2)
# f(b=2, **d)       # 也合法，输出 (1, 2)
# f(**d, 2)         # 不合法：位置实参跟在 **dict 后
# SyntaxError: positional argument follows keyword argument unpacking
```

### 2.5 综合签名案例：逐位讲清

现在把所有参数种类放在一起，用一个完整的综合案例，逐位讲解每个参数属于哪一类、为什么放在这个位置。这个案例是本篇核心的"全种类演示"。

```python
# 同时包含全部六类参数的函数签名
def process_order(
    order_id,           # ① 仅位置参数（/ 之前）
    priority="normal",  # ② 带默认值的仅位置参数
    /,                  # 仅位置参数区结束标志
    customer="默认客户",  # ③ 普通位置参数（因 priority 带默认值，跨 / 需同样带默认值）
    discount=0.0,       # ④ 带默认值的普通位置参数
    *items,             # ⑤ 可变位置参数（同时开启仅关键字区）
    warehouse,          # ⑥ 无默认值的仅关键字参数
    gift_wrap=False,    # ⑦ 带默认值的仅关键字参数
    **metadata          # ⑧ 可变关键字参数
):
    print(f"订单号: {order_id}（优先级: {priority}）")
    print(f"客户: {customer}，折扣: {discount}")
    print(f"商品: {items}")
    print(f"仓库: {warehouse}，礼品包装: {gift_wrap}")
    print(f"元数据: {metadata}")
```

逐位拆解这个签名：

- **① `order_id`**：仅位置参数，位于 `/` 之前，必须按位置传参，且必填。
- **② `priority="normal"`**：仅位置参数，带默认值，仍位于 `/` 之前，调用时可省略（省略时取默认值），但传参时只能按位置传，不能用 `priority=` 传。
- **`/`**：仅位置参数区的结束标志，不是一个真正的参数，只是告诉解释器："前面的参数只能位置传"。
- **③ `customer`**：普通位置参数，位于 `/` 之后、`*items` 之前，可位置传也可关键字传，且必填。
- **④ `discount=0.0`**：普通位置参数，带默认值，可省略，可位置传也可关键字传。
- **⑤ `*items`**：可变位置参数，收集所有多余的位置实参为元组，同时它充当 `*` 的作用，开启仅关键字参数区。
- **⑥ `warehouse`**：仅关键字参数，无默认值，位于 `*items` 之后，必须用 `warehouse=` 传参且必填。
- **⑦ `gift_wrap=False`**：仅关键字参数，带默认值，可省略，必须用关键字传参。
- **⑧ `**metadata`\*\*：可变关键字参数，收集所有多余的关键字实参为字典，必须放最后。

**合法调用示例**

```python
# 全部参数都显式传入
process_order(
    "ORD-001",              # → order_id（仅位置）
    "high",                 # → priority（仅位置，带默认值但此处显式传）
    "张三",                  # → customer（普通位置）
    0.15,                   # → discount（普通位置，带默认值但此处显式传）
    "键盘", "鼠标", "显示器",  # → items（可变位置，收集为元组）
    warehouse="北京仓",       # → warehouse（仅关键字，必填）
    gift_wrap=True,          # → gift_wrap（仅关键字，带默认值）
    note="加急", channel="app"  # → metadata（可变关键字，收集为字典）
)
# 输出：
# 订单号: ORD-001（优先级: high）
# 客户: 张三，折扣: 0.15
# 商品: ('键盘', '鼠标', '显示器')
# 仓库: 北京仓，礼品包装: True
# 元数据: {'note': '加急', 'channel': 'app'}
```

**省略带默认值参数的调用**

```python
# 因为 priority、customer、discount、gift_wrap 都带默认值，只传必填的 order_id 和 warehouse
process_order("ORD-002", warehouse="上海仓")
# 输出：
# 订单号: ORD-002（优先级: normal）
# 客户: 默认客户，折扣: 0.0
# 商品: ()
# 仓库: 上海仓，礼品包装: False
# 元数据: {}
```

注意 `priority` 是仅位置参数，即便它带默认值，也只能按位置传——"张三" 若要作为 `customer` 传入，必须放在 `priority` 的位置之后，或用 `customer=` 关键字传：

```python
# 只省略 priority 不行：它位于仅位置区，后面的位置实参会先填它
# 要把 "张三" 绑定到 customer 而非 priority，得先占住 priority 的位置
process_order("ORD-002b", "normal", "张三", warehouse="上海仓")
# 输出：
# 订单号: ORD-002b（优先级: normal）
# 客户: 张三，折扣: 0.0
# 商品: ()
# 仓库: 上海仓，礼品包装: False
# 元数据: {}

# 或者用关键字传 customer（因为 customer 是普通位置参数，允许关键字传）
process_order("ORD-002c", customer="张三", warehouse="上海仓")
# 输出：
# 订单号: ORD-002c（优先级: normal）
# 客户: 张三，折扣: 0.0
# 商品: ()
# 仓库: 上海仓，礼品包装: False
# 元数据: {}
```

**使用解包语法调用**

```python
# 用 *解包传位置实参，用 **解包传关键字实参
positional_args = ["ORD-003", "urgent", "李四", 0.2, "U盘", "充电器"]
keyword_args = {"warehouse": "深圳仓", "gift_wrap": True, "source": "web"}

process_order(*positional_args, **keyword_args)
# 输出：
# 订单号: ORD-003（优先级: urgent）
# 客户: 李四，折扣: 0.2
# 商品: ('U盘', '充电器')
# 仓库: 深圳仓，礼品包装: True
# 元数据: {'source': 'web'}
```

**非法调用报错示例**

```python
# 报错一：仅位置参数用关键字传参
# process_order(order_id="ORD-004")
# TypeError: process_order() got some positional-only arguments passed as keyword arguments: 'order_id'

# 报错二：仅关键字参数 warehouse 漏传
# process_order("ORD-005", "张三", "鼠标")
# TypeError: process_order() missing 1 required keyword-only argument: 'warehouse'

# 报错三：仅关键字参数用位置传参
# process_order("ORD-006", "normal", "张三", 0.1, "鼠标", "北京仓")
# 这里 "北京仓" 被收进 items 元组，warehouse 仍然缺失，最终同样报 missing keyword-only argument
```

这个综合案例把六类参数的排列、调用方式、省略规则、报错情形全部串了起来，是理解参数顺序规范最直接的范本。实际开发中很少会写出这么"全"的签名，但理解了它，任何实际签名你都能准确判断每个参数的种类和合法位置。

### 2.6 常见组合形态与简化签名

实际开发中，绝大多数函数并不会出现全部六类参数，而是几种常见的组合形态。理解这些组合，有助于你在阅读他人代码时快速判断签名结构，也有助于自己设计签名时按需取舍。

**形态一：纯普通位置参数（最常见）**

```python
# 所有参数都是普通位置参数，可位置传也可关键字传
def add(x, y):
    return x + y
```

这是最朴素的形态，没有 `/`、没有 `*`、没有默认值。适合参数少、含义直观的场景。

**形态二：普通位置参数 + 默认值**

```python
# 部分参数带默认值，调用时可省略
def greet(name, greeting="你好", punctuation="！"):
    return f"{greeting}，{name}{punctuation}"
```

带默认值的参数排在无默认值的之后。这是仅次于形态一的常见写法。

**形态三：普通位置参数 + `**kwargs`（配置型函数）\*\*

```python
# 用 **kwargs 收集可选的配置项，核心参数显式列出
def log(message, level="INFO", **fields):
    print(f"[{level}] {message}", fields)
```

核心参数明确签名，额外配置通过 `**kwargs` 透传，常用于日志、HTTP 客户端等"参数多但通常只传几个"的函数。

**形态四：普通位置参数 + `*args`（聚合型函数）**

```python
# 用 *args 收集不定数量的同类参数
def average(*values):
    return sum(values) / len(values) if values else 0
```

适合处理"同类参数数量不定"的场景，如求和、求平均、拼接。

**形态五：`*` 强制关键字传参（可读性优化型）**

```python
# 用 * 把后续参数设为仅关键字，调用时必须写参数名
def set_timeout(seconds, *, blocking=True):
    ...

set_timeout(30, blocking=False)  # 意图清晰
```

这是现代 Python 代码中越来越推崇的写法，用于在参数较多时强制调用方写出参数名，避免位置语义混淆。

**形态六：`/` + `*`（API 稳健型）**

```python
# 前端用 / 固化参数名不对外暴露，后端用 * 强制关键字传参
def connect(host, port, /, *, timeout=30, retry=3):
    ...

connect("localhost", 3306, timeout=10)  # host/port 必须位置传，timeout 必须关键字传
```

这种形态兼顾了参数名重构自由度（`/` 给予）和调用可读性（`*` 给予），是标准库内置函数常用的设计模式。

**形态七：全种类（综合型）**

就是 2.5 节演示的 `process_order` 那种。实际项目里极少需要，但理解它意味着你已经掌握了参数顺序规范的全部内容。

### 2.7 参数顺序规则速查表

把本篇涉及的所有顺序规则浓缩成一张速查表，方便日后翻阅：

| 规则                   | 内容                                                       | 违反时的报错                                                                |
| ---------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------- |
| `/` 必须在 `*` 之前    | 仅位置参数区整体在可变位置参数之前                         | `SyntaxError: / must appear in scope before *`                              |
| `/` 只能出现一次       | 一个签名最多一个 `/`                                       | `SyntaxError: / may appear only once`                                       |
| `*` 只能出现一次       | `*args` 和单独 `*` 合计最多一个                            | `SyntaxError: * argument may appear only once`                              |
| 默认值后不跟无默认值   | 同一区内无默认值参数不能排在带默认值之后（仅关键字区除外） | `SyntaxError: non-default argument follows default argument`                |
| `**kwargs` 必须最后    | 任何参数不能跟在 `**kwargs` 后                             | `SyntaxError: arguments cannot follow **kwargs`                             |
| 调用时位置实参在前     | 关键字实参后不能跟位置实参                                 | `SyntaxError: positional argument follows keyword argument`                 |
| 调用时 `**dict` 最后   | `**` 解包后不能有其他实参                                  | `SyntaxError: positional argument follows keyword argument unpacking`       |
| 仅位置参数不能关键字传 | `/` 前的参数不能用 `name=` 传                              | `TypeError: got some positional-only arguments passed as keyword arguments` |
| 仅关键字参数不能位置传 | `*` 后的参数不能用位置传                                   | `TypeError: missing required keyword-only argument`                         |

## 3. 最佳实践

**优先用简洁签名，避免过度堆叠参数种类**

虽然 Python 支持把六类参数全部塞进一个签名，但这并不意味着应该这么做。一个函数签名里如果同时出现 `/`、`*args`、仅关键字参数、`**kwargs`，阅读者需要在大脑里同时跑一遍绑定推演才能搞清楚怎么调用。对于绝大多数函数，两到三类参数的组合就够用了：

```python
# 推荐：简洁清晰，普通位置参数 + 仅关键字参数
def send_email(to, subject, *, html=False, cc=None):
    ...

# 不推荐：六类参数全上，调用时要反复推敲
def send_email(to, /, subject, *attachments, html, cc=(), **headers):
    ...
```

仅位置参数（`/`）和仅关键字参数（`*`）是有明确设计诉求时才使用的工具——前者用于允许参数名变动而不破坏调用方代码，后者用于强制某些参数用关键字传以提高可读性。没有这种诉求时，普通位置参数就足够了。

**带默认值的参数放后面，无默认值的放前面**

这条规则在普通位置参数区是强制的（否则语法报错），在仅关键字参数区虽非强制，但仍应遵循，保持签名的可读性和调用直觉：

```python
# 推荐：无默认值在前，有默认值在后
def configure(*, host, port, debug=False, timeout=30):
    ...

# 不推荐：顺序混乱，虽合法但难读
def configure(*, debug=False, host, timeout=30, port):
    ...
```

**用 `*` 强制关键字传参，提高调用可读性**

当一个函数有几个"开关型"参数时，用 `*` 把它们设为仅关键字，可以防止调用时位置实参语义不清：

```python
# 推荐：仅关键字参数，调用时意图清晰
def request(url, *, stream=False, verify_ssl=True, timeout=30):
    ...

request("/api/data", stream=True, timeout=10)  # 一眼看出每个参数含义

# 不推荐：全是位置参数，调用时容易写错位置
def request(url, stream, verify_ssl, timeout):
    ...

request("/api/data", True, True, 10)  # 三个布尔和数字，语义全靠数位置
```

**`/` 用于参数名可能变动的内部参数**

仅位置参数最常见的应用场景是那些"参数名只是占位、调用方不该依赖名字"的参数，比如一些魔术方法或 C 实现的内置函数。在自己的代码里，如果一个参数的名字将来可能重命名而不想影响调用方，就把它设为仅位置：

```python
# 把内部编码用的参数设为仅位置，将来重命名不影响调用方
def normalize(value, /, *, case="lower", strip=True):
    ...

# 将来可以放心地把 value 改成 val、input_value 等
```

**避免在签名中使用过于复杂的默认值计算**

参数的默认值在函数定义时只求值一次（这是"默认参数陷阱"的根源，见第 04 篇）。对于可变默认值（列表、字典、集合），要用 `None` 作哨兵并在函数体内初始化，这一点与参数顺序无关，但在设计多参数签名时更容易被忽略：

```python
# 不推荐：可变对象作为默认值
def append_to(item, target=[]):
    target.append(item)
    return target

# 推荐：用 None 作哨兵
def append_to(item, target=None):
    if target is None:
        target = []
    target.append(item)
    return target
```

**调用时显式关键字传参，降低位置依赖**

当一个函数有多个带默认值的参数时，调用时优先用关键字传参，而不是按位置一个一个传，这样即使签名顺序调整，调用代码也不用改：

```python
def create_server(host, port=80, backlog=128, reuse_addr=True):
    ...

# 不推荐：靠位置，含义不清，签名顺序一改就错
create_server("0.0.0.0", 8080, 256, False)

# 推荐：用关键字，意图清晰，签名调整也安全
create_server("0.0.0.0", port=8080, backlog=256, reuse_addr=False)
```

**签名较长时用换行对齐，保持可读性**

当参数种类多、签名很长时，建议每个参数或逻辑分组的参数独占一行，并按种类分组对齐：

```python
# 推荐：按种类分组，换行对齐
def process(
    order_id, priority="normal", /,
    customer="默认客户", discount=0.0,
    *items,
    warehouse, gift_wrap=False,
    **metadata
):
    ...
```

这种排版让每一类参数的位置一目了然，比挤在一行更易维护。

## 4. 原理

要理解为什么参数顺序必须是"仅位置 → 普通位置 → `*args` → 仅关键字 → `**kwargs`"，需要深入到 Python 的函数签名解析机制和调用时的实参绑定过程。本节从字节码层面和绑定算法层面两个角度展开。

### 4.1 函数签名的内部表示

Python 函数对象内部维护一个 `__text_signature__` 和相关的参数元信息。当解释器编译到 `def` 语句时，会执行一条 `MAKE_FUNCTION` 字节码，它从栈上取出函数的限定名、代码对象、默认值元组、kwonly 默认值字典、注解等信息，组装成一个函数对象。其中参数顺序信息被编码在代码对象（`co_varnames`、`co_argcount`、`co_kwonlyargcount`、`co_posonlyargcount` 等字段）里。

具体来说，CPython 的代码对象用以下字段描述参数布局：

- `co_posonlyargcount`：仅位置参数的数量（`/` 之前的参数个数）。
- `co_argcount`：普通位置参数的数量（`/` 之后、`*` 之前的参数个数，不含仅位置参数）。
- `co_kwonlyargcount`：仅关键字参数的数量（`*` 之后的参数个数）。
- `co_varnames`：所有局部变量的名字元组，参数排在最前。

这几个字段加在一起，就完整记录了函数的参数顺序信息。`MAKE_FUNCTION` 在构建函数对象时，会把默认值按"普通位置参数区的默认值"和"仅关键字参数区的默认值"分成两个容器分别存储（`__defaults__` 和 `__kwdefaults__`），这也是为什么在调用时这两类默认值的填充时机不同。

可以用 inspect 模块直接观察这些信息：

```python
import inspect

def f(a, b=1, /, c=2, d=3, *args, e, f3=4, **kwargs):
    pass

sig = inspect.signature(f)
for name, param in sig.parameters.items():
    print(f"{name}: kind={param.kind.name}, default={param.default!r}")
# 输出：
# a: kind=POSITIONAL_ONLY, default=<class 'inspect._empty'>
# b: kind=POSITIONAL_ONLY, default=1
# c: kind=POSITIONAL_OR_KEYWORD, default=2
# d: kind=POSITIONAL_OR_KEYWORD, default=3
# args: kind=VAR_POSITIONAL, default=<class 'inspect._empty'>
# e: kind=KEYWORD_ONLY, default=<class 'inspect._empty'>
# f3: kind=KEYWORD_ONLY, default=4
# kwargs: kind=VAR_KEYWORD, default=<class 'inspect._empty'>
```

`inspect.Parameter` 的 `kind` 属性把每个参数归入五个类别（对应本篇讲的六类，只是 `POSITIONAL_OR_KEYWORD` 合并了仅位置和仅关键字之间的"普通位置"），这正是 Python 对参数种类的形式化建模。

### 4.2 调用时的实参绑定算法

函数调用时，Python 执行 `CALL_FUNCTION`（或更精确的 `CALL`、`CALL_FUNCTION_KW` 等）字节码。实参绑定的核心算法可以概括为"从前到后、分类匹配、无歧义优先"，具体步骤如下：

1. **解析位置实参序列**：调用方传入的所有位置实参（包括 `*seq` 解包的元素）构成一个有序序列。
2. **填充仅位置参数**：从位置实参序列最前开始，按 `co_posonlyargcount` 数量依次匹配仅位置参数。匹配不足的若该参数有默认值则用默认值，否则报 `missing required positional argument`。
3. **填充普通位置参数**：剩余的位置实参继续依次匹配 `co_argcount` 个普通位置参数。同样，不足的有默认值填默认值，无默认值报错。
4. **填充 `*args`**：如果还有剩余的位置实参，且签名有 `*args`，则全部打包成元组赋给 `args`；如果没有 `*args` 但有多余位置实参，报 `too many positional arguments`。
5. **解析关键字实参**：调用方传入的所有关键字实参（包括 `**dict` 解包的键值对）构成一个名字到值的映射。
6. **匹配普通位置参数**：对每个关键字实参，先看它的名字是否是某个普通位置参数——若是，则用关键字实参值填充（要求该参数未被位置实参填充过，否则报 `multiple values for argument`）。
7. **匹配仅关键字参数**：剩余的关键字实参按名字匹配 `co_kwonlyargcount` 个仅关键字参数。匹配不到且该参数有默认值则用默认值，否则报 `missing required keyword-only argument`。
8. **填充 `**kwargs`**：如果还有剩余的关键字实参，且签名有 `**kwargs`，则打包成字典赋给 `kwargs`；没有 `**kwargs`但有剩余，报`unexpected keyword argument`。
9. **检查仅位置参数**：如果某个仅位置参数的名字出现在关键字实参中，报 `got some positional-only arguments passed as keyword arguments`，拒绝绑定。

**为什么顺序必须如此**

从这个绑定算法可以看出，整个过程的灵魂是"位置实参从前往后消耗、关键字实参按名字匹配"。要让这个过程无歧义地进行，参数的顺序就必须满足：

- **仅位置参数在最前**：它们只能由位置实参匹配，而位置实参从最前面开始消耗，所以它们必须排在能接收位置实参的最前段。
- **`*args` 在位置参数之后**：它要收集"所有剩余的位置实参"，必须在所有按位置匹配的参数之后，否则它会把后面参数的实参也收走。
- **仅关键字参数在 `*` 之后**：因为 `*args` 已经吃掉了所有剩余位置实参，位置实参无法到达 `*` 之后的参数，所以这些参数只能靠关键字匹配——这正是"仅关键字"的由来。
- **`**kwargs` 在最后\*\*：它要收集"所有剩余的关键字实参"，必须在所有按名字匹配的参数之后，否则它会把后面仅关键字参数的实参也收走。
- **默认值参数在同区无默认值之后**：位置实参是按数量消耗的，如果带默认值的参数排在前、无默认值排在后，当实参数量介于两者之间时，解释器无法判断是"给前面参数传了值、后面参数用默认值"还是"前面参数用默认值、后面参数传了值"，产生二义性，所以语法直接禁止。这条约束不仅作用于同一参数区内，还会跨过 `/` 边界：`/` 前若有带默认值的仅位置参数、`/` 后紧跟无默认值的普通位置参数，同样算作"默认值后跟无默认值"，依然非法。唯一能切断这条约束传递的是 `*args`（或单独 `*`）——它把位置参数区和仅关键字区彻底隔开，`*` 之后的仅关键字参数默认值顺序完全自由。

### 4.3 一个完整的绑定推演

用前面那个综合签名的例子，完整推演一次绑定过程，帮助理解算法的每一步：

```python
def process_order(
    order_id,           # 仅位置
    priority="normal",  # 仅位置，带默认值
    /,
    customer="默认客户",  # 普通位置，带默认值（与 priority= 默认值链衔接，保持顺序合法）
    discount=0.0,       # 普通位置，带默认值
    *items,             # 可变位置
    warehouse,          # 仅关键字
    gift_wrap=False,    # 仅关键字，带默认值
    **metadata          # 可变关键字
):
    pass

process_order(
    "ORD-001", "high", "张三", 0.15, "键盘", "鼠标",
    warehouse="北京仓", gift_wrap=True, note="加急"
)
```

绑定过程：

1. 位置实参序列：`["ORD-001", "high", "张三", 0.15, "键盘", "鼠标"]`，共 6 个。
2. 关键字实参映射：`{"warehouse": "北京仓", "gift_wrap": True, "note": "加急"}`，共 3 个。
3. 填充仅位置参数（2 个）：`order_id="ORD-001"`，`priority="high"`。位置实参消耗 2 个，剩余 4 个。
4. 填充普通位置参数（2 个）：`customer="张三"`，`discount=0.15`。位置实参消耗 2 个，剩余 2 个。
5. 填充 `*items`：剩余 2 个位置实参打包，`items=("键盘", "鼠标")`。位置实参消耗完毕。
6. 匹配关键字实参到普通位置参数：`warehouse`、`gift_wrap`、`note` 都不是普通位置参数的名字，跳过。
7. 匹配仅关键字参数（2 个）：`warehouse="北京仓"`（命中），`gift_wrap=True`（命中）。仍有 `note="加急"` 未匹配。
8. 填充 `**metadata`：剩余 `note="加急"` 打包，`metadata={"note": "加急"}`。
9. 检查仅位置参数：`order_id`、`priority` 未出现在关键字实参中，通过。

最终所有形参绑定完成，函数体开始执行。如果调用时违反了绑定规则——比如把 `order_id` 用关键字传、或者漏传 `warehouse`——绑定算法会在相应步骤抛出 `TypeError`，报错信息能精确指出是哪个参数出了问题。

### 4.4 签名解析中的边界标志 `/` 与 `*`

从 `MAKE_FUNCTION` 的角度看，`/` 和 `*` 都不是真正的参数，而是"区段边界标记"。编译时，解释器扫描签名字符串，遇到 `/` 就把它之前的参数归入仅位置区（计入 `co_posonlyargcount`），遇到 `*`（或 `*args`）就把它之后的参数归入仅关键字区（计入 `co_kwonlyargcount`）。这两个标志符本身不会被加入到 `co_varnames` 的参数列表里（但 `*args` 中的 `args` 会作为可变位置参数的名字加入）。

这解释了一个细节：为什么可以用单独的 `*` 而不写 `*args`——因为 `*` 的核心作用是"切换区段"，至于要不要顺便收集多余实参、给收集器起什么名字，是可选的附加行为。`/` 同理，它只负责标记边界，不消耗参数也不收集任何东西。

从字节码反汇编可以看到 `MAKE_FUNCTION` 如何携带这些信息：

```python
import dis

def f(a, b=1, /, c=2, *args, d, **kwargs):
    pass

# 反汇编定义过程（关注 MAKE_FUNCTION 前的栈准备）
dis.dis(f.__code__.co_code, depth=0)
# 可以看到 MAKE_FUNCTION 指令，它从栈上取：
#   - 默认值元组（仅位置 + 普通位置参数区的默认值，如 (1, 2)）
#   - kwonly 默认值字典（仅关键字参数区的默认值，此处为空）
#   - 注解字典
#   - 代码对象（含 co_posonlyargcount=2, co_argcount=1, co_kwonlyargcount=1）
```

`MAKE_FUNCTION` 不会去校验参数顺序的合法性——顺序校验是在编译阶段（解析签名时）完成的。如果签名违反了顺序规则，编译器在生成 `MAKE_FUNCTION` 之前就已经抛出 `SyntaxError`，函数对象根本不会被创建。这就解释了为什么所有顺序错误都是 `SyntaxError`（编译期），而调用时的传参错误才是 `TypeError`（运行期）。

## 5. 总结

### 5.1 本篇内容要点

- Python 函数定义中，参数的完整合法顺序是：仅位置参数（`/` 之前）→ 普通位置参数（`/` 之后、`*` 之前）→ `*args`（或单独 `*`）→ 仅关键字参数（`*` 之后）→ `**kwargs`，共五大区段。
- 默认值不是一个独立的参数种类，而是参数的属性。带默认值的位置参数之后不能再出现无默认值的位置参数，且这条约束会跨过 `/` 边界生效（`/` 前有默认值、`/` 后紧跟无默认值也算非法）；唯一的"断点"是 `*args`，它把约束隔断，`*` 之后的仅关键字参数默认值顺序完全自由。
- `/` 和 `*` 是"区段边界标志"，不是真正的参数。`/` 标记仅位置参数区结束，`*` 标记仅关键字参数区开始，两者各自最多出现一次。
- `**kwargs` 必须放在签名的最后，因为它要收集所有剩余关键字实参；任何参数跟在它后面都会导致语法错误。
- 函数调用时实参的合法顺序是：位置实参 → 关键字实参 → `*` 序列解包 → `**` 字典解包。`**` 解包必须是最后一个实参。
- 常见顺序错误及其报错：`/` 在 `*` 后（`SyntaxError: / must appear in scope before *`）、默认值后跟无默认值（`SyntaxError: non-default argument follows default argument`）、参数跟在 `**kwargs` 后（`SyntaxError: arguments cannot follow **kwargs`）、调用时关键字实参后跟位置实参（`SyntaxError: positional argument follows keyword argument`）。
- 原理上，参数顺序由"从前到后、无歧义匹配"的实参绑定算法决定：位置实参从前消耗，所以仅位置参数在前、`*args` 在其后收尾；关键字实参按名字匹配，所以 `*` 之后的参数只能关键字传、`**kwargs` 在最后收纳剩余。
- `MAKE_FUNCTION` 字节码在编译期通过代码对象的 `co_posonlyargcount`、`co_argcount`、`co_kwonlyargcount` 字段编码参数顺序信息；顺序合法性在编译期校验（`SyntaxError`），传参合法性在运行期校验（`TypeError`）。

### 5.2 读完本文你应能掌握

- 准确写出包含全部六类参数的合法函数签名，并说出每个参数所属的种类。
- 拿到一个陌生函数签名时，能判断每个参数是仅位置、普通位置、可变位置、仅关键字还是可变关键字参数，以及它的合法位置在哪里。
- 写出各类顺序错误会触发什么报错，并在编码遇到这些报错时快速定位签名或调用的问题。
- 用正确的实参顺序调用一个多参数函数，包括位置实参、关键字实参、`*` 解包和 `**` 解包的混合使用。
- 用一句话解释为什么参数顺序必须如此（"从前到后无歧义匹配"），并说清 `*args`、`**kwargs` 为什么必须在各自区段的末尾。
- 在设计函数签名时，根据是否需要参数名对外稳定、是否需要强制关键字传参等诉求，合理选用 `/` 和 `*`，而不是盲目堆砌所有参数种类。
