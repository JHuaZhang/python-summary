---
group:
  title: 【12】函数核心机制
  order: 12
order: 3
title: 位置参数与关键字参数
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是位置参数与关键字参数

Python 函数调用时,实参(实际传入的值)如何与形参(函数定义里的参数变量)对应,有两条路径:**按位置对应**和**按名字对应**。由此实参分为两类——**位置实参(positional argument)**和**关键字实参(keyword argument)**。

- **位置实参**:调用时只写值,不写参数名,Python 按实参出现的顺序,依次绑定到形参定义的顺序上。即第 1 个实参给第 1 个形参,第 2 个实参给第 2 个形参,依此类推。
- **关键字实参**:调用时写 `形参名=值`,Python 按"名字"把值绑定到同名形参,与书写顺序无关。

```python
def greet(name, greeting):
    print(f"{greeting}, {name}!")

# 位置实参:按顺序,第 1 个 "Alice" 给 name,第 2 个 "Hi" 给 greeting
greet("Alice", "Hi")               # Hi, Alice!

# 关键字实参:按名字,name="Alice"、greeting="Hi",顺序无关
greet(name="Alice", greeting="Hi") # Hi, Alice!
greet(greeting="Hi", name="Alice") # Hi, Alice!  顺序换了也对
```

这两条路径可以在同一次调用里混用,这就是绝大多数 Python 函数调用的真实形态——前几个参数大家约定俗成按位置传(大家都会填、顺序不会搞错),后面的参数用关键字传(避免记不住谁是谁)。理解"位置 vs 关键字"的区分,是后续学习默认参数、`*args`、`**kwargs`、仅位置参数、仅关键字参数全部进阶语法的地基。

需要立刻厘清一个术语:**形参与实参的区分**。形参(parameter)是函数定义时括号里写的变量名,如 `def f(name, greeting)` 中的 `name`、`greeting`,它们是函数内部的局部变量。实参(argument)是函数调用时实际填入的值,如 `greet("Alice", "Hi")` 中的 `"Alice"`、`"Hi"`。"位置"和"关键字"都是对**实参**(调用端)的描述——位置实参、关键字实参。形参本身没有"位置形参""关键字形参"之分(但形参可以有默认值、可以标记为仅位置/仅关键字,那是后面几篇的事)。本文通篇说"位置参数""关键字参数"时,若无特别说明,指的都是实参的传递方式。

```python
def connect(host, port, timeout):   # host/port/timeout 是形参(parameter)
    print(f"连接 {host}:{port},超时 {timeout}s")

connect("127.0.0.1", 8080, 5)            # 三个位置实参
connect("127.0.0.1", 8080, timeout=5)    # 前两个位置、第三个关键字
connect(host="127.0.0.1", port=8080, timeout=5)  # 全部关键字
```

### 1.2 基本语法与最小用法

位置实参的最小用法就是大家最早学的那套——按顺序填值:

```python
def add(a, b):
    return a + b

print(add(3, 5))   # 8:'3' 给 a,'5' 给 b,顺序对应
```

关键字实参的最小用法是在实参前加 `形参名=`:

```python
print(add(a=3, b=5))   # 8:按名字,a=3、b=5
print(add(b=5, a=3))   # 8:顺序无关,只要名字对
```

混用的最小用法——位置在前,关键字在后:

```python
print(add(3, b=5))     # 8:3 按位置给 a,5 按名字给 b
```

这就是全部基础语法。难点不在语法本身(就两行规则),而在混用时的约束、易错场景以及"什么时候该用关键字"的判断。下面逐一展开。

---

## 2. 核心内容

### 2.1 位置实参:按顺序对应

位置实参是默认且最常见的传参方式。调用时 Python 把实参按出现顺序,一个对一个地绑定到形参列表的对应位置:第 1 个实参 → 第 1 个形参,第 2 个实参 → 第 2 个形参……整个过程没有任何"名字匹配",纯粹靠顺序。

```python
def create_user(name, role, active):
    print(f"用户 {name},角色 {role},启用 {active}")

# 完全按位置:顺序必须与定义一致
create_user("alice", "admin", True)
# 输出:用户 alice,角色 admin,启用 True
```

位置实参的好处是简洁——参数少、顺序一目了然时,写 `point(3, 4)` 比 `point(x=3, y=4)` 省字、读起来也干净。`min(3, 7)`、`len("abc")`、`abs(-5)` 这类内置调用全是位置传参,大家不会觉得不清晰,因为参数少、含义固定、全世界都这么用。

位置实参的代价是:参数一多、或参数顺序不直观时,调用端就变得难读且易错。看下面这行:

```python
send_email("alice@example.com", "bob@example.com", "周报", "请查收附件", True, False, "high")
```

不看 `send_email` 的定义,你根本不知道第 5 个 `True` 是什么、第 6 个 `False` 又是什么。更要命的是,一旦把两个类型相同的实参顺序写反,Python 不会报错(类型对得上),逻辑就悄悄错了:

```python
def send_email(to, sender, subject, body, html, cc_enabled, priority):
    # 简化实现,只演示参数绑定
    print(f"to={to}, sender={sender}, subject={subject}")

# to 和 sender 都是邮箱字符串,写反了不报错,但发件人收件人颠倒了
send_email("bob@example.com", "alice@example.com", "周报", "正文", False, True, "normal")
# 输出:to=bob@example.com, sender=alice@example.com, subject=周报
# 实际意图可能是 to=alice,sender=bob——这种错误极难排查
```

这正是关键字实参要解决的问题。在展开关键字实参之前,先把位置实参的两条硬规则记牢:

**规则一:位置实参的数量不能少于必填形参的数量。** 如果函数有 3 个无默认值的形参,你只传了 2 个位置实参,Python 报 `TypeError` 缺参数:

```python
def add(a, b, c):
    return a + b + c

# print(add(1, 2))
# TypeError: add() missing 1 required positional argument: 'c'
```

**规则二:位置实参的数量不能多于形参总数(除非函数定义了 `*args`)。** 多传了同样报 `TypeError`:

```python
def add(a, b):
    return a + b

# print(add(1, 2, 3))
# TypeError: add() takes 2 positional arguments but 3 were given
```

这两条规则的错误信息里都出现了 "positional argument",印证了"位置实参"是 Python 内部对这类实参的正式称呼。

### 2.2 关键字实参:按名字对应

关键字实参在调用时写成 `形参名=值` 的形式。Python 不看实参的出现顺序,而是看 `=` 左边的名字,把值直接绑定到同名形参。

```python
def create_user(name, role, active):
    print(f"用户 {name},角色 {role},启用 {active}")

# 全部用关键字:顺序可以任意
create_user(role="admin", active=True, name="alice")
# 输出:用户 alice,角色 admin,启用 True

create_user(active=False, name="bob", role="guest")
# 输出:用户 bob,角色 guest,启用 False
```

注意上面两次调用,实参书写的顺序完全不同,但输出里 `name`/`role`/`active` 各归各位——这就是"按名字绑定"的力量,顺序不再重要。

关键字实参的 `=` 左边必须是**函数定义中的形参名**,不能随便写一个变量名。写错了 Python 会报"意外的关键字参数":

```python
def create_user(name, role, active):
    pass

# create_user(username="alice", role="admin", active=True)
# TypeError: create_user() got an unexpected keyword argument 'username'
```

上面报错信息里的 "unexpected keyword argument" 是关键字实参写错名字时的标志性错误——Python 找不到叫 `username` 的形参,所以判定这是"意外的"关键字。

关键字实参解决的首要问题是**可读性**。之前那行难读的邮件调用,用关键字重写:

```python
def send_email(to, sender, subject, body, html, cc_enabled, priority):
    print(f"to={to}, sender={sender}, subject={subject}, html={html}, cc={cc_enabled}, pri={priority}")

send_email(
    to="alice@example.com",
    sender="bob@example.com",
    subject="周报",
    body="请查收附件",
    html=False,
    cc_enabled=True,
    priority="high",
)
# 输出:to=alice@example.com, sender=bob@example.com, subject=周报, html=False, cc=True, pri=high
```

每个值前面都有名字解释它是什么,即使不看函数定义也能读懂这行调用在做什么。而且因为按名字绑定,你不用担心 `to` 和 `sender` 谁先谁后——只要名字对,值就绑对。

关键字实参解决的第二个问题是**避免参数过多时顺序出错**。回到前面那个"邮箱写反不报错"的坑,用关键字传就不会错:

```python
send_email(
    to="alice@example.com",      # 明确说这是收件人
    sender="bob@example.com",    # 明确说这是发件人
    subject="周报",
    body="请查收附件",
    html=False,
    cc_enabled=True,
    priority="normal",
)
# 即使你把这两行换个位置,结果也完全一样——名字绑定的,顺序无关
```

关键字实参同样受数量约束,但方向相反:你传的每一个关键字都必须能在形参里找到对应名字(否则就是上面那个 "unexpected keyword argument"),且不能对同一个形参既给位置实参又给关键字实参(下文专讲)。

### 2.3 混用规则:位置参数必须在关键字参数之前

Python 允许同一次调用里既有位置实参又有关键字实参,但有一条铁律:**位置实参必须写在关键字实参之前**。换句话说,一旦你开始写 `名字=值` 的关键字实参,后面就不能再出现裸的值。

```python
def create_user(name, role, active):
    print(f"用户 {name},角色 {role},启用 {active}")

# 合法:位置在前,关键字在后
create_user("alice", role="admin", active=True)
# 输出:用户 alice,角色 admin,启用 True

# 合法:前两个位置,最后一个关键字(常见写法)
create_user("alice", "admin", active=True)
# 输出:用户 alice,角色 admin,启用 True

# 非法:关键字之后又出现位置实参
# create_user(name="alice", "admin", True)
# SyntaxError: positional argument follows keyword argument
```

最后那行是**语法错误**(SyntaxError),连运行都到不了,Python 在解析代码阶段就拦下了。这条规则的直觉解释是:位置实参靠"位置"确定归属,关键字实参靠"名字"确定归属,如果允许关键字实参后面再跟位置实参,Python 就无法无歧义地判断那个位置实参该绑给谁——干脆禁掉。

混用时,已经用关键字绑定的形参,不能再被位置实参"重复覆盖"。具体说:第 1 个位置实参绑给第 1 个形参,如果你又用关键字把某个形参绑一遍,就冲突了。

```python
def create_user(name, role, active):
    pass

# create_user("alice", name="bob", role="admin", active=True)
# TypeError: create_user() got multiple values for argument 'name'
```

这里的错误信息 "got multiple values for argument" 是混用场景下最高频的报错,下一节专门拆解。

混用时判断"哪个位置实参对应哪个形参"的方法很简单:位置实参从左到右数,依次填入还没被关键字占用的形参位。看一个稍复杂的例子:

```python
def f(a, b, c, d):
    print(a, b, c, d)

f(1, 2, c=3, d=4)
# 位置实参 1、2 依次给 a、b;关键字 c=3、d=4 给 c、d
# 输出:1 2 3 4

f(1, b=2, c=3, d=4)
# 位置实参 1 给 a(第一个未被关键字占用的形参);其余按名字
# 输出:1 2 3 4
```

一个实用心法:**位置实参填的是"还没被关键字认领的前几个形参位"**。只要某个形参已经被关键字实参认领(如 `b=2`),它就从位置实参的候选列表里移除,后面的位置实参顺次往后填剩余的空位。

### 2.4 TypeError: got multiple values for argument 的成因

这个报错是位置参数与关键字参数混用时最经典的错误,几乎是每个 Python 学习者必踩的坑。理解它需要先看清 Python 绑定参数的内部顺序。

**报错成因**:当一次调用里,同一个形参既被位置实参按顺序绑定了一次,又被关键字实参按名字绑定了一次,Python 就报 `TypeError: <函数名>() got multiple values for argument '<形参名>'`。也就是说,同一个形参不能被绑定两次——位置绑一次、关键字再绑一次就算"多值"。

最典型的触发场景:你想用关键字给某个后面的参数赋值,却不小心把前面的位置实参也填了,导致第一个形参被两次绑定。

```python
def greet(name, greeting):
    print(f"{greeting}, {name}!")

# 错误:位置实参 "Alice" 已经按顺序给了第 1 个形参 name,
# 紧接着又用 name="Bob" 给 name 绑了一次——name 被绑两次
# greet("Alice", name="Bob", greeting="Hi")
# TypeError: greet() got multiple values for argument 'name'
```

怎么理解这个报错?按绑定顺序拆开看:

1. 位置实参 `"Alice"` 出现在第 1 位,按顺序绑定到第 1 个形参 `name`。此时 `name = "Alice"`。
2. 关键字实参 `name="Bob"` 又试图把 `name` 绑成 `"Bob"`。
3. Python 发现 `name` 已经有值了,拒绝重复绑定,抛出 TypeError。

这个错误的"欺骗性"在于:很多人以为 `name="Bob"` 会"覆盖"掉位置实参 `"Alice"` 给的值,Python 不这么干——它认为这是你写错了,直接报错让你改,而不是默默用后面的覆盖前面的。这是一种"拒绝猜测意图"的设计哲学。

**修复方法**:要么把那个位置实参删掉(让 `name` 只由关键字绑定),要么把关键字去掉(让 `name` 只由位置绑定),二选一。

```python
def greet(name, greeting):
    print(f"{greeting}, {name}!")

# 修复一:去掉位置实参,全用关键字
greet(name="Bob", greeting="Hi")    # Hi, Bob!

# 修复二:去掉重复的关键字,name 用位置
greet("Bob", greeting="Hi")         # Hi, Bob!

# 修复三:两个都用位置
greet("Bob", "Hi")                  # Hi, Bob!
```

再看一个参数更多时的同类错误,帮助加深直觉:

```python
def configure(host, port, timeout, retry):
    print(f"{host}:{port} timeout={timeout} retry={retry}")

# 错误:位置实参 "0.0.0.0" 给 host,"8080" 给 port,
# 然后又用 port=80 给 port 绑第二次——port 多值
# configure("0.0.0.0", "8080", port=80, timeout=5, retry=3)
# TypeError: configure() got multiple values for argument 'port'
```

规律一致:**数一下位置实参的个数 N,它们会占掉前 N 个形参位;如果你又在关键字实参里写了这前 N 个形参中的任何一个名字,就 multiple values**。避免这个错误的最稳妥办法是养成习惯:决定用关键字传的参数,它在位置上必须排在所有位置实参之后,且不要写成位置实参。

### 2.5 关键字实参可任意顺序的深入理解

"关键字实参顺序可以任意"这条性质,初学者容易半信半疑:真的随便换顺序都对吗?答案是肯定的——只要 `=` 左边名字写对,右边值绑定的目标就完全确定,与这行关键字实参在第几位毫无关系。

```python
def register(username, email, age, country):
    print(f"{username} | {email} | {age} | {country}")

# 四种顺序,结果完全一致
register(username="alice", email="a@x.com", age=30, country="CN")
register(country="CN", username="alice", email="a@x.com", age=30)
register(age=30, country="CN", email="a@x.com", username="alice")
register(email="a@x.com", age=30, username="alice", country="CN")
# 四行全部输出:alice | a@x.com | 30 | CN
```

之所以能这样,是因为关键字实参的绑定是"按名查找"而非"按序计数"。Python 在处理调用时,先处理所有位置实参(按序填入形参位),再处理所有关键字实参(按名字填入对应形参),关键字实参之间的相对顺序不影响"按名字填入"的结果。

但有一条限制要注意:**关键字实参可以任意顺序,是针对"纯关键字实参之间"而言的**。一旦和位置实参混用,位置实参必须整体在前。所以"任意顺序"的有效范围是关键字实参那一块内部,不能跨过位置实参随意插队。

```python
def f(a, b, c, d):
    print(a, b, c, d)

# 合法:位置实参 1、2 在前;关键字 c=3、d=4 顺序随意
f(1, 2, d=4, c=3)   # 1 2 3 4  (c、d 顺序换了也无所谓)

# 非法:位置实参 2 出现在关键字之后
# f(1, c=3, 2, d=4)
# SyntaxError: positional argument follows keyword argument
```

关键字实参顺序无关这一特性,在重构时很有价值:当函数新增一个形参,调用端如果是全关键字传参,不需要调整任何已有调用的实参顺序,直接加一行新的 `新参=值` 即可。这降低了参数表变动带来的修改成本。

### 2.6 用关键字实参提升可读性的典型场景

什么时候应该用关键字实参?不是"总是",而是当位置传参会让调用端含义模糊时。下面是几个高价值场景。

**场景一:多个同类型参数,顺序难记。** 典型如坐标、颜色、日期——`point(x, y)` 或 `point(y, x)` 读起来都是两个数,分不清。

```python
def draw_line(x1, y1, x2, y2):
    print(f"从 ({x1},{y1}) 画到 ({x2},{y2})")

# 位置传参:四个数字挤一起,看不出谁是起点谁是终点
draw_line(10, 20, 30, 40)
# 输出:从 (10,20) 画到 (30,40)  ← 对不对得数着位置猜

# 关键字传参:每个数有名字,意图清晰
draw_line(x1=10, y1=20, x2=30, y2=40)
# 输出:从 (10,20) 画到 (30,40)  ← 一眼看懂
```

**场景二:布尔型参数。** 布尔值只有 `True`/`False` 两个值,裸写在调用端时,读者完全不知道这个 `True` 控制的是什么开关。这是关键字实参最该出场的场景。

```python
def send_email(to, subject, body, html, cc_enabled, verbose):
    print(f"to={to} html={html} cc={cc_enabled} verbose={verbose}")

# 纯位置:第 4、5、6 个 True/False 各管什么?读不懂
send_email("a@x.com", "主题", "正文", False, True, True)

# 关键字:布尔值前的名字说明它控制的开关
send_email(
    "a@x.com", "主题", "正文",
    html=False,        # 是否 HTML 格式
    cc_enabled=True,   # 是否开启抄送
    verbose=True,      # 是否打印详细日志
)
# 输出:to=a@x.com html=False cc=True verbose=True
```

上面这种"布尔参数一定用关键字传"的写法,在很多代码规范里是明确推荐的一条。Python 标准库里很多函数甚至通过"仅关键字参数"语法强制你这么做(那是另一篇的内容),这里先建立直觉:看到布尔实参就本能想用关键字。

**场景三:`open(file, mode)` 用 `mode=` 提升清晰度。** 内置 `open` 是大家最熟悉的函数之一,第二个参数 `mode` 控制读写模式(`"r"` 读、`"w"` 写、`"a"` 追加等)。很多人写 `open("a.txt", "r")` 习以为常,但当你把多个 `open` 摆在一起时,用关键字会让模式更醒目。

```python
# 不用关键字:每个 open 的第二个字符串都得猜是 mode
f1 = open("log.txt", "r")
f2 = open("out.txt", "w")
f3 = open("err.txt", "a")

# 用关键字:mode= 明示这是模式,扫一眼就知道每个文件是读是写
f1 = open("log.txt", mode="r")
f2 = open("out.txt", mode="w")
f3 = open("err.txt", mode="a")
```

`open` 是一个很好的"视情况而定"的例子:参数少(就两个),纯位置 `open("a.txt", "r")` 也勉强能读;但当调用密集出现或想强调模式时,加 `mode=` 会让代码更自解释。这引出一条判断原则——**关键字实参不是非用不可,而是一种按需提升可读性的手段,参数少且含义固定时纯位置更简洁,参数多或含义易混时关键字更清晰**。

**场景四:`sorted` 的 `key` 与 `reverse`。** 内置 `sorted(iterable, key, reverse)` 有三个形参,实际使用中第一个几乎总是位置传,`key` 和 `reverse` 几乎总是关键字传,这是社区约定。

```python
data = [("alice", 30), ("bob", 25), ("carol", 35)]

# 纯位置:第二个 lambda 是 key,第三个 False 是 reverse——读起来吃力
sorted(data, lambda x: x[1], False)

# 关键字:key= 和 reverse= 一目了然
sorted(data, key=lambda x: x[1], reverse=False)
# 输出:[('bob', 25), ('alice', 30), ('carol', 35)]  按年龄升序

sorted(data, key=lambda x: x[1], reverse=True)
# 输出:[('carol', 35), ('alice', 30), ('bob', 25)]  按年龄降序
```

`sorted` 这种"主参数位置传、开关/配置参数关键字传"的混合风格,是 Python 社区最主流的传参风格,值得刻意模仿。

### 2.7 形参与实参对照表

把前面零散提到的概念集中成一张表,帮助建立完整的心智模型:

| 概念                 | 定义位置                  | 举例                         | 说明                                  |
| -------------------- | ------------------------- | ---------------------------- | ------------------------------------- |
| 形参(parameter)      | 函数定义 `def` 行的括号内 | `def f(a, b):` 中的 `a`、`b` | 函数内部的局部变量名,调用时被实参赋值 |
| 实参(argument)       | 函数调用的括号内          | `f(3, 5)` 中的 `3`、`5`      | 调用时实际传入的值                    |
| 位置实参(positional) | 调用端,裸值               | `f(3, 5)` 中的 `3`、`5`      | 按顺序绑定到形参                      |
| 关键字实参(keyword)  | 调用端,`名=值`            | `f(a=3, b=5)`                | 按名字绑定到形参,顺序无关             |
| 必填形参             | 定义端,无默认值           | `def f(a, b):`               | 调用时必须传值,否则 TypeError         |
| 混用                 | 调用端                    | `f(3, b=5)`                  | 位置在前,关键字在后                   |

再看一个把"形参/实参/位置/关键字"全部展示一遍的完整 demo:

```python
def order(item, quantity, discount):               # item/quantity/discount 是形参
    print(f"商品 {item},数量 {quantity},折扣 {discount}")

# 全位置实参
order("笔记本", 10, 0.8)
# 输出:商品 笔记本,数量 10,折扣 0.8

# 全关键字实参(顺序任意)
order(discount=0.8, item="笔记本", quantity=10)
# 输出:商品 笔记本,数量 10,折扣 0.8

# 混用:前两个位置,最后一个关键字(常见,因为 discount 写在最后用关键字更醒目)
order("笔记本", 10, discount=0.8)
# 输出:商品 笔记本,数量 10,折扣 0.8
```

### 2.8 位置实参与关键字实参的"对应"对比

为强化"按序 vs 按名"的区别,用一个完全相同的调用意图,分别用两种方式写,对比绑定过程:

```python
def config(host, port, debug, timeout):
    print(f"host={host}, port={port}, debug={debug}, timeout={timeout}")

# 方式 A:全位置——背住顺序,4 个实参依次给 4 个形参
config("127.0.0.1", 8080, True, 30)
# 绑定:host←"127.0.0.1", port←8080, debug←True, timeout←30
# 输出:host=127.0.0.1, port=8080, debug=True, timeout=30

# 方式 B:全关键字——不必背顺序,按名字直接对应
config(debug=True, host="127.0.0.1", timeout=30, port=8080)
# 绑定:host←"127.0.0.1"(按名), port←8080(按名), debug←True(按名), timeout←30(按名)
# 输出:host=127.0.0.1, port=8080, debug=True, timeout=30
```

两种方式结果相同,但维护成本不同。假设某天函数定义把 `port` 和 `debug` 的位置互换了:

```python
def config(host, debug, port, timeout):   # debug 和 port 位置换了
    print(f"host={host}, port={port}, debug={debug}, timeout={timeout}")
```

方式 A 的调用 `config("127.0.0.1", 8080, True, 30)` 现在 `8080` 会绑给 `debug`、`True` 绑给 `port`——逻辑全错,而且因为类型不同(数字 vs 布尔)可能不报错却埋雷。方式 B 的调用 `config(debug=True, host="127.0.0.1", timeout=30, port=8080)` 完全不受影响——名字绑定,位置换了无所谓。

这个对比例子揭示了一条工程经验:**对可能变动顺序的参数表,关键字实参比位置实参更"抗重构"**。这也是为什么大型项目里,参数较多的函数倾向于要求调用方用关键字传参。

### 2.9 参数过多时的顺序出错与关键字解药

把前面几个场景叠加起来看一个真实问题:一个函数参数超过 4、5 个,位置传参的出错概率会陡升,且错误极难发现。关键字实参正是这个问题的标准解药。

构造一个参数较多、且有几个同类型参数的函数:

```python
def send_email(to, sender, subject, body, html, cc, bcc, priority, retry, timeout):
    print(f"to={to} sender={sender} subject={subject} html={html} cc={cc} pri={priority}")

# 纯位置传参:10 个实参,谁能保证顺序都对?
send_email("a@x.com", "b@x.com", "主题", "正文", False, "c@x.com", "d@x.com", "high", 3, 30)
# 输出看着没错,但 cc 和 bcc 是否写反了?html 和 retry 是否对了?全靠数位置
```

纯位置传参这里的问题有三层:一是难读(每个值是什么含义要数位置),二是易错(同类型参数写反不报错),三是脆(函数调整参数顺序后所有调用都受影响)。换成关键字:

```python
send_email(
    to="a@x.com",
    sender="b@x.com",
    subject="主题",
    body="正文",
    html=False,
    cc="c@x.com",
    bcc="d@x.com",
    priority="high",
    retry=3,
    timeout=30,
)
# 输出:to=a@x.com sender=b@x.com subject=主题 html=False cc=c@x.com pri=high
```

每个值都有名字标注,顺序不复重要,重构时增删参数只改对应那行。这就是"参数越多越该用关键字"的底气所在。

实际工程里,当参数多到这个程度,往往说明函数本身可能职责过重(那个"长参数列表"的坏味道),但那是设计层面的话题;在不得不调用这类函数时,关键字实参是你手上最实用的防错工具。

### 2.10 布尔与数字参数:关键字可读性场景集中演示

把"布尔/数字参数用关键字提升可读性"这条单独展开,配一组场景化 demo 加深印象。

**布尔场景:复制文件是否覆盖、是否保留元数据。**

```python
def copy_file(src, dst, overwrite, preserve_metadata, follow_symlinks):
    print(f"{src} -> {dst} overwrite={overwrite} meta={preserve_metadata} link={follow_symlinks}")

# 纯位置:三个布尔,含义全靠猜
copy_file("a.txt", "b.txt", True, False, True)
# 输出:a.txt -> b.txt overwrite=True meta=False link=True  ← 读懂了吗?

# 关键字:每个布尔自带说明书
copy_file(
    src="a.txt",
    dst="b.txt",
    overwrite=True,
    preserve_metadata=False,
    follow_symlinks=True,
)
# 输出同上,但每行含义一目了然
```

**数字场景:HTTP 请求的超时、重试、并发数。**

```python
def http_get(url, timeout, retry, concurrency):
    print(f"{url} timeout={timeout} retry={retry} conc={concurrency}")

# 纯位置:三个数字,谁是谁?
http_get("https://api.x.com", 30, 3, 10)
# 输出:https://api.x.com timeout=30 retry=3 conc=10  ← 顺序对不对得查定义

# 关键字:数字前的名字说明它的角色
http_get("https://api.x.com", timeout=30, retry=3, concurrency=10)
# 第一个 url 用位置(URL 是主参数,位置传很自然),三个配置用关键字
```

**混合场景:数据库连接。** 主参数(URL)位置传,配置项关键字传,这是最自然的写法:

```python
def connect_db(url, port, user, password, pool_size, timeout, ssl):
    print(f"{url}:{port} user={user} pool={pool_size} ssl={ssl}")

connect_db(
    "postgres://localhost:5432/mydb",   # URL 是主参数,位置传
    port=5432,
    user="admin",
    password="secret",
    pool_size=10,
    timeout=30,
    ssl=True,
)
# 输出:postgres://localhost:5432/mydb:5432 user=admin pool=10 ssl=True
```

这种"主参数位置、配置参数关键字"的混用,是真实代码里最常见、最推荐的传参风格。它兼顾了简洁(URL 一个位置实参省事)和清晰(一堆配置都有名字标注)。

### 2.11 位置参数也讲"顺序对应"的边界

位置实参按顺序对应形参,这条规则有一个隐含的边界:它只负责把实参填进形参位,不负责检查"这个值对这个形参是否合理"。类型不匹配时,只有在函数内部用到该值时才可能报错,绑定阶段不查。这正是位置传参容易埋雷的深层原因。

```python
def greet(name, times):
    for _ in range(times):       # times 需要是 int
        print(f"Hi {name}")

# 位置传参:把 times 误传成字符串,绑定时不报错
# greet("alice", "3")
# 运行到 range("3") 时才报:
# TypeError: 'str' object cannot be interpreted as an integer
```

如果用关键字传,至少在书写时名字会提醒你 `times=` 后面该接数字,降低笔误概率:

```python
greet(name="alice", times=3)   # 名字提示 times 是次数,该写 int
# 输出:Hi alice (打印 3 次)
```

这不是关键字实参的"语法保护",而是它的"可读性保护"——名字像标签一样提示每个位置该填什么类型的值,笔误概率自然下降。

### 2.12 位置实参与关键字实参的等效与不等效

同一个调用意图,用位置或用关键字,结果上等价;但在"可读性、抗重构性、出错提示"上不等价。把两者放在同一张表里对比:

| 维度     | 位置实参                 | 关键字实参                        |
| -------- | ------------------------ | --------------------------------- |
| 绑定依据 | 实参顺序                 | 形参名                            |
| 顺序要求 | 必须与形参定义顺序一致   | 可任意                            |
| 可读性   | 参数少时简洁,多时难读    | 每个值有名字,多参数时清晰         |
| 抗重构   | 形参顺序变则调用全错     | 形参顺序变不影响调用              |
| 出错提示 | 同类型参数写反不报错     | 名字写错立刻报 unexpected keyword |
| 与默认值 | 不利于省略中间参数       | 可只给需要的参数赋值              |
| 重复绑定 | 不会触发 multiple values | 与位置混用易触发 multiple values  |

这张表回答了"什么时候用哪种"的判断框架:追求简洁、参数少且固定 → 位置;追求清晰、参数多或易混 → 关键字;两者兼有 → 混用,主参数位置、配置参数关键字。

### 2.13 调用风格演化的整体示例

把前面讲的渐进式地放在同一个函数上,展示从"全位置"到"混用"到"全关键字"的演化,帮助建立完整观感。函数是一个简化版的日志记录器:

```python
def log(message, level, to_file, timestamp, color):
    print(f"[{level}] {message} | file={to_file} ts={timestamp} color={color}")
```

**初级写法:全位置。** 新手刚学函数时最容易写成这样,五个实参挤一行,几个月后自己也看不懂:

```python
log("服务启动", "INFO", True, False, "green")
# 输出:[INFO] 服务启动 | file=True ts=False color=green
```

**进阶写法:主参数位置,其余关键字。** 这是社区主流风格,`message` 作为主信息用位置,其他配置用关键字:

```python
log("服务启动", level="INFO", to_file=True, timestamp=False, color="green")
# 输出:[INFO] 服务启动 | file=True ts=False color=green
```

**保守写法:全关键字。** 当参数表频繁变动、或想让每次调用都自带文档时,全关键字最稳:

```python
log(
    message="服务启动",
    level="INFO",
    to_file=True,
    timestamp=False,
    color="green",
)
# 输出:[INFO] 服务启动 | file=True ts=False color=green
```

三种写法结果相同,但适用场景不同:参数极少且稳定时第一种可接受;参数中等、主从分明时第二种最自然;参数多且易变时第三种最保险。没有绝对优劣,按场景选。

---

## 3. 最佳实践

### 3.1 布尔实参一律用关键字

布尔实参是关键字传参的最高价值场景,应形成肌肉记忆:看到调用端出现 `True`/`False` 裸值,就本能想给它加个名字。原因前面讲过——裸布尔既不表达含义,也不表达归属,纯位置时几乎是"代码粪味"的标志。

```python
def set_permission(user, read, write, execute):
    print(f"{user}: read={read} write={write} exec={execute}")

# 不推荐:三个布尔裸值,含义不明
set_permission("alice", True, False, True)
# 输出:alice: read=True write=False exec=True  ← 读懂靠数位置

# 推荐:布尔一律关键字,每个开关自带说明
set_permission("alice", read=True, write=False, execute=True)
# 输出同上,但每个布尔管什么一目了然
```

这条规则在团队规范里经常被写成硬性约定,部分库甚至用"仅关键字参数"语法(后续篇章讲)强制执行,可见其重要程度。

### 3.2 主参数位置、配置参数关键字

社区最主流的传参风格:把"调用必然要给、含义固定"的主参数用位置传,把"可有可无、起配置作用"的参数用关键字传。这样既保持简洁,又突出可读性。

```python
def request(url, method, timeout, retry, verify_ssl):
    print(f"{method} {url} timeout={timeout} retry={retry} ssl={verify_ssl}")

# 推荐:url、method 是主参数(位置),其余是配置(关键字)
request("https://api.x.com", "GET", timeout=30, retry=3, verify_ssl=True)
# 输出:GET https://api.x.com timeout=30 retry=3 ssl=True
```

判断一个参数是不是"主参数":如果拿掉它调用就没意义,那它是主参数,适合位置;如果是"让它有不同表现"的可选项,那它是配置参数,适合关键字。

### 3.3 同类型相邻参数务必用关键字

当函数有多个类型相同的相邻形参(如两个字符串、两个数字、两个邮箱地址),位置传参极易写反且不报错,这类参数必用关键字。

```python
def transfer(from_account, to_account, amount):
    print(f"从 {from_account} 转 {amount} 到 {to_account}")

# 不推荐:两个账号都是字符串,写反了不报错却转账方向颠倒
transfer("ACC1001", "ACC2002", 500)
# 输出:从 ACC1001 转 500 到 ACC2002  ← 对不对全凭信任

# 推荐:用关键字明示谁是 from、谁是 to
transfer(from_account="ACC1001", to_account="ACC2002", amount=500)
# 输出同上,方向明确
```

这类"同类型相邻参数"是位置传参的重灾区,出现时请优先考虑关键字,哪怕类型不同也建议关键字,因为类型不一致只是"可能报错",不是"一定报错"。

### 3.4 不要对同一形参既给位置又给关键字

这是一个低级但高频的错误,报错信息 `got multiple values for argument` 已经很明确,但还是有人反复踩。根因是"想用关键字强调某个参数,却忘了把它从位置实参里去掉"。

```python
def update_profile(name, email, age):
    print(f"{name} | {email} | {age}")

# 错误:name 既被位置 "alice" 绑,又被关键字 name="al" 绑
# update_profile("alice", name="al", email="a@x.com", age=30)
# TypeError: update_profile() got multiple values for argument 'name'

# 正确:想用关键字给 name,就不要再把它写进位置实参
update_profile(name="alice", email="a@x.com", age=30)
# 输出:alice | a@x.com | 30
```

心法再强调一次:**决定用关键字传某参数,就把它整体从位置实参里移走,不要两头都给**。

### 3.5 参数多到难读就该全关键字

当函数形参超过 4、5 个,纯位置传参几乎一定难读,这时宁可全部关键字,牺牲一点简洁换取安全。判断临界点:如果你写完一行调用,自己都要回头数"第 3 个参数是什么",就该用关键字了。

```python
def create_order(buyer, seller, item, quantity, price, currency, discount, shipping):
    print(f"{buyer} 买 {item} x{quantity} @ {price} {currency}")

# 不推荐:8 个位置实参,维护噩梦
create_order("alice", "bob", "笔记本", 10, 99.9, "CNY", 0.9, 12)

# 推荐:全关键字,一眼读懂,增删参数只改对应行
create_order(
    buyer="alice",
    seller="bob",
    item="笔记本",
    quantity=10,
    price=99.9,
    currency="CNY",
    discount=0.9,
    shipping=12,
)
# 输出:alice 买 笔记本 x10 @ 99.9 CNY
```

### 3.6 谨慎对待参数顺序频繁变动的函数

如果你维护的是一个参数顺序经常调整的函数(比如仍在迭代期的内部 API),把所有调用端改成关键字传参,能极大降低顺序变动导致的连锁错误。反之,如果形参顺序已经稳定且参数很少,没必要硬加关键字徒增字符。

```python
# 假设 config 的参数顺序在迭代期常变
def config(host, port, debug, timeout):
    print(f"{host}:{port} debug={debug} timeout={timeout}")

# 位置传参:顺序一改,所有调用都得跟着改,还容易漏
config("127.0.0.1", 8080, True, 30)

# 关键字传参:顺序怎么变都不影响,只关心名字对不对
config(host="127.0.0.1", port=8080, debug=True, timeout=30)
# 输出:127.0.0.1:8080 debug=True timeout=30
```

### 3.7 关键字实参的 `=` 两侧不要加空格

PEP 8 对关键字实参有一条具体格式建议:`=` 两侧**不加空格**,以区别于赋值语句(赋值语句 `=` 两侧加空格)。这样 `f(a=1)` 是函数调用、`a = 1` 是赋值,视觉上一眼区分。

```python
# 推荐:关键字实参 = 两侧无空格
send_email(to="a@x.com", subject="hi", body="正文")

# 不推荐:= 两侧加空格(会被部分 linter 标红)
# send_email(to = "a@x.com", subject = "hi", body = "正文")
```

这条规则纯粹是格式约定,不影响运行,但符合它能让你代码与社区主流一致,代码审查时不会被挑格式。

### 3.8 优先用关键字实参实现"只传需要的参数"

当函数有默认值参数(下一篇详讲)时,关键字实参可以让你只给需要的参数赋值、跳过其他用默认值的参数。位置传参做不到这点——你只能从左到右依次填,想跳过中间某个用默认值的参数是不可能的。

```python
def render(template, title, width, height, theme, border):
    print(f"{template}: {title} {width}x{height} theme={theme} border={border}")

# 假设 width/height/theme/border 都有默认值(本篇先不写默认值语法)
# 用关键字时,你可以只给关心的几个参数
render(
    "page.html",
    title="首页",
    theme="dark",   # 只改 theme,其余用默认
)
# 这里仅为示意;真实场景需配合默认值,下一篇详讲
```

这条实践的核心是:**关键字实参让"选择性传参"成为可能**,而位置实参只能"按序全填"。这就是为什么带默认值的参数几乎总是用关键字传——这是下一篇的内容,这里先建立感性认识。

---

## 4. 原理

### 4.1 函数调用时参数绑定的内部机制

Python 在执行一次函数调用时,实参与形参的绑定按固定流程进行。理解这个流程,前面所有规则和报错都会变得理所当然。

**绑定流程分三步**:

第一步,Python 收集调用端的所有实参,分为两组:位置实参(裸值,按出现顺序排列)和关键字实参(`名=值`,按出现顺序排列)。

第二步,Python 按形参定义顺序,把位置实参依次绑定到形参位上——第 1 个位置实参绑给第 1 个形参,第 2 个绑给第 2 个,直到位置实参用完或形参位填满。

第三步,Python 处理关键字实参,按 `=` 左边的名字查找同名形参,把值绑定上去。如果某个名字找不到对应形参,报 `unexpected keyword argument`;如果某个形参在第二步已经被位置实参绑过,这里又被关键字绑一次,报 `got multiple values for argument`。

```python
def f(a, b, c):
    print(a, b, c)

f(1, b=2, c=3)
# 第一步:位置实参 [1],关键字实参 [b=2, c=3]
# 第二步:位置实参 1 绑给第 1 个形参 a → a=1
# 第三步:关键字 b=2 绑给 b → b=2;关键字 c=3 绑给 c → c=3
# 结果:a=1, b=2, c=3
# 输出:1 2 3
```

### 4.2 位置参数按形参顺序绑定

第二步是"按序填空位"。Python 维护一个形参列表 `[a, b, c, ...]`,从位置实参列表里依次取值填进去。填的过程不关心值是什么、类型对不对,只管"第 i 个位置实参 → 第 i 个形参"。

```python
def f(a, b, c):
    print(a, b, c)

f(10, 20, 30)
# 形参列表 [a, b, c],位置实参 [10, 20, 30]
# a←10, b←20, c←30
# 输出:10 20 30
```

如果位置实参比形参多,第二步就填不下,报 `takes N positional arguments but more were given`;如果位置实参比必填形参少,且后面的形参没有默认值或关键字实参补齐,报 `missing required positional argument`。这两条错误的 "positional" 字样都来自第二步。

### 4.3 关键字参数按名字绑定到形参

第三步是"按名查找"。Python 遍历关键字实参,对每一个 `名=值`,在形参列表里找同名形参。找到就把值绑上去;形参如果已经被位置实参占位(第二步绑过),就触发 multiple values;如果名字在形参列表里压根不存在,触发 unexpected keyword。

```python
def f(a, b, c):
    print(a, b, c)

f(a=1, c=3, b=2)
# 第三步按名:a←1, b←2, c←3,顺序无关紧要
# 输出:1 2 3
```

关键字实参顺序无关的根源就在这里——第三步是"按名查表",不是"按序填空",所以 `b=2, c=3` 还是 `c=3, b=2` 结果一样。

### 4.4 混用时位置参数先绑、关键字参数后绑

绑定流程的顺序固定是"先位置后关键字"。这解释了语法上"位置实参必须在关键字实参之前"的根源——Python 先处理位置实参填空位,再用关键字实参补漏,如果允许关键字实参穿插在位置实参中间,处理顺序就无法确定,干脆在语法层禁止。

```python
def f(a, b, c):
    print(a, b, c)

f(1, 2, c=3)
# 先位置:a←1, b←2(两个位置实参填前两个形参位)
# 后关键字:c←3(第三个形参 c 还空着,用关键字补上)
# 输出:1 2 3
```

这就是混用时"位置在前、关键字在后"的底层原因:它对应的是"先位置填空、后关键字补漏"的绑定顺序。

### 4.5 重复绑同一形参报错

multiple values 的成因在原理层面就是:**第二步(位置实参)已经把某形参绑了,第三步(关键字实参)又试图绑同一个,Python 拒绝二次绑定**。Python 不做"后者覆盖前者"的猜测,而是直接报错,逼调用端把意图写明确。

```python
def f(a, b):
    print(a, b)

# f(1, a=2)
# 第二步:位置实参 1 绑给 a → a=1
# 第三步:关键字 a=2 又要绑 a,但 a 已被占 → multiple values for argument 'a'
# TypeError: f() got multiple values for argument 'a'
```

这条机制保证了绑定的唯一性:每个形参在一次调用里最多被绑定一次,无论位置还是关键字。理解了这条,multiple values 报错就再也不会让你困惑——数一下位置实参占了前几个形参位,只要关键字实参的名字落在这几个里,就一定报错。

---

## 5. 总结

### 5.1 本文内容要点

- 实参分两类:**位置实参**按书写顺序绑定形参,**关键字实参**按名字绑定形参,二者可在同一调用混用。
- 位置实参简洁但依赖顺序,参数多时难读、易错、抗重构性差;关键字实参牺牲一点字符换取可读性、抗重构性和防错能力。
- 混用铁律:**位置实参必须写在关键字实参之前**,违反报 `SyntaxError: positional argument follows keyword argument`。
- 关键字实参**顺序任意**,因为绑定是"按名查找"而非"按序填空"。
- `TypeError: got multiple values for argument` 的成因:同一形参既被位置实参绑、又被关键字实参绑,Python 拒绝二次绑定。
- 形参是定义端的变量名,实参是调用端的值;"位置/关键字"是对实参传递方式的描述。
- 布尔实参、同类型相邻参数、参数过多的函数,是关键字实参的高价值场景;`send_email`、`open` 的 `mode=`、`sorted` 的 `key=`/`reverse=` 是典型示例。

### 5.2 读完应能掌握的能力

- 能区分形参与实参,说清"位置实参""关键字实参"各自按什么对应到形参。
- 能正确混用位置与关键字实参,不触发 `SyntaxError` 和 `multiple values` 报错。
- 看到 `got multiple values for argument` 时,能定位是哪个形参被重复绑定并修复。
- 能根据参数个数、类型、变动频率,判断一次调用该用纯位置、纯关键字还是混用,并给出理由。
- 能识别布尔实参、同类型相邻参数等"该用关键字"的场景,主动写出可读性更高的调用代码。
- 能复述参数绑定的三步机制(收集、按序填位置、按名填关键字),并据此解释所有相关报错的成因。

---
