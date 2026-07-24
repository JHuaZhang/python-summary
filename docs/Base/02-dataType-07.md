---
group:
  title: 【02】基础数据类型和类型系统
  order: 2
order: 7
title: None类型详解
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 None 与 NoneType

`None` 是 Python 中表示"没有值"(no value)的常量,它的类型是 `NoneType`。`None` 类型在整个 Python 体系里只存在**唯一一个实例**——也就是 `None` 这个对象本身,这叫**单例**(singleton)。无论你在代码里多少处写 `None`,它们引用的都是同一个对象。

```python
print(None)             # None
print(type(None))       # <class 'NoneType'>
print(None is None)     # True —— 单例,身份比较
```

`None` 的核心语义是"无值"——它表示"这里本应有个值,但现在没有"。这与"零"(`0`)、"空字符串"(`''`)、"空列表"(`[]`)是不同的概念:`0` 是一个确定的数值(零本身是值),`''` 是长度为零的字符串对象,而 `None` 表示"根本不存在值"。理解这个细微差别很重要:

```python
# 0 是有值(数值零),None 是无值
score = 0               # 有值:分数为 0(真实考了 0 分)
score = None            # 无值:尚未考试/未录入,与 0 分含义不同

# '' 是有对象(空字符串),None 是无值
name = ''               # 有值:名字为空串(用户填了空)
name = None             # 无值:未提供名字(用户没填这一项)
```

这种"无值 vs 零值/空值"的区分在实际开发中非常有用:考试成绩 `None` 与 `0` 含义不同(前者未考、后者零分),可选字段 `None` 与 `''` 含义不同(前者未提交、后者提交了空)。用 `None` 明确表达"缺失",避免与真实的零值/空值混淆。

`None` 在 Python 中的角色极其广泛,几乎无处不在:

- **函数默认返回值**:函数无 `return`、或 `return` 不带值时,返回 `None`。
- **函数默认参数哨兵**:用 `None` 作"未传参"标志(规避可变默认参数陷阱)。
- **变量占位**:变量"尚未赋有效值"时先用 `None` 占位。
- **可选字段的缺失值**:数据结构中可选字段未提供时为 `None`(JSON 的 `null` 对应)。
- **链表/树的终止节点**:数据结构用 `None` 表示链表尾/树叶子的"无下一个"。
- **清空引用**:`x = None` 释放对原对象的引用。

本篇要系统讲透 `None`:它的单例本质、`NoneType` 类型、**为何判断 `None` 必须用 `is` 而非 `==`**、`None` 在布尔语境中的行为、函数返回与默认参数中的 `None`、`None` 与"空值"(0/''/[]) 的语义辨析、`None` 在数据结构中的用法,以及相关陷阱。虽然 `None` 看似简单(就一个值),但围绕它的判断规范、哨兵模式、与空值的辨析,是写好 Python 必须吃透的细节。

### 1.2 None 是单例:身份与唯一性

`None` 是**单例**——整个 Python 解释器在运行期间只创建一次 `None` 对象,所有对 `None` 的引用都指向这同一个对象。这是理解 `None` 一切行为的基础。

```python
a = None
b = None
print(a is b)           # True —— 同一个对象(身份相同)
print(id(a) == id(b))   # True —— 内存地址相同
print(a == b)           # True —— 值也相等
```

无论你多少处写 `None`,`is` 比较都是 `True`——因为只有一个 `None` 对象。这与可变对象不同(两个独立创建的 `[]` 是不同对象,`is` 为 `False`),也与"值相等但身份不同"的情况不同。

单例性带来的最直接后果:**判断一个值是否为 `None`,应该用 `is`(`x is None`),而不是 `==`(`x == None`)**。这是 Python 最重要的小规范之一,§2 会详述原因。简单说:`None` 是单例,`is` 判身份最直接高效;而 `==` 会调用对象的 `__eq__` 方法,可能被自定义类改写而不可靠。

```python
# 推荐(判 None 用 is)
if x is None: ...
if x is not None: ...
# 不推荐(== None 不可靠)
if x == None: ...
```

`NoneType` 是 `None` 的类型,但它没有内置的公开名字——你不能直接写 `NoneType`,要通过 `type(None)` 获取:

```python
print(type(None))           # <class 'NoneType'>
NoneType = type(None)       # 手动绑定名字
print(isinstance(None, NoneType))  # True
```

`NoneType` 没有公开名是故意的——判 `None` 应该用 `is None`,而非 `isinstance(x, NoneType)`,前者更简洁规范。`type(None)` 主要用于类型注解(`-> None` 表示返回 None)或元编程场景。

### 1.3 None 在布尔语境中的行为

`None` 在布尔语境(`if`/`while`/`and`/`or`/`not`)中被判定为**假(falsy)**:

```python
print(bool(None))       # False
if None:
    print("这不会执行")  # None 为假,跳过
else:
    print("None 为假")   # ← 走这里
```

`None` 是 Python 明确定义的"假值"之一(连同 `False`、数值零、空容器)。这让 `if not x:` 之类的判空写法能覆盖 `None`:

```python
def greet(name=None):
    if not name:            # name 为 None 或 '' 都为假
        name = "陌生人"
    return f"Hello, {name}"
print(greet(None))          # Hello, 陌生人
print(greet(""))            # Hello, 陌生人('' 也为假)
print(greet("Alice"))       # Hello, Alice
```

⚠️ **但 `if not x:` 与 `if x is None:` 语义不同,这是 None 使用中最常见的混淆点**:

```python
# if not x:判"是否为假值"(None/0/''/[]/{} 都触发)
# if x is None:仅判"是否为 None"(只 None 触发,0/''/[] 不触发)
```

```python
x = 0
if not x:           # True —— 0 为假
    print("假值")
if x is None:       # False —— 0 不是 None
    print("None")

x = []
if not x:           # True —— 空列表为假
    print("假值")
if x is None:       # False —— 空列表不是 None
    print("None")
```

当你想判"是否为 None"时,用 `is None`;当你想判"是否为假值(含 None)"时,用 `not x`。**二者不可混用**——用 `not x` 去判 None 会把 0/''/[] 也判进去(语义错位),用 `is None` 去判"是否为空"会漏掉空容器(0/''/[] 不是 None)。这条区分是 None 实战的核心要点,§3 会详述。

### 1.4 None 与空值的辨析

`None`、`0`、`''`、`[]`、`{}`、`False` 这几个值在布尔语境里同为"假",但它们的语义和类型完全不同。辨析它们是理解 `None` 的关键:

| 值 | 类型 | 语义 | 布尔值 |
|----|------|------|--------|
| `None` | `NoneType` | 无值/缺失 | False |
| `0` | `int` | 数值零(是值) | False |
| `0.0` | `float` | 浮点零 | False |
| `''` | `str` | 空字符串(有对象) | False |
| `[]` | `list` | 空列表(有对象) | False |
| `{}` | `dict` | 空字典(有对象) | False |
| `False` | `bool` | 布尔假 | False |

关键区分:`None` 表示"缺失",其余表示"存在但为空/零"。它们虽同为假值,但代表的状态不同:

- **考试分数**:`None`(未考试)vs `0`(考了零分)——截然不同的状态,系统里必须区分。
- **可选字段**:`None`(未填)vs `''`(填了空)vs `"Alice"`(有值)——三态。
- **缓存查找**:`None`(键不存在)vs `0`(键存在且值为 0)——不能混。

```python
# 三态字段的正确处理
def format_name(name):
    if name is None:          # 未提供
        return "(未填写)"
    if name == "":            # 提供了空
        return "(名字为空)"
    return name
print(format_name(None))      # (未填写)
print(format_name(""))        # (名字为空)
print(format_name("Alice"))   # Alice
```

正因为 `None` 与空值语义不同,**判 `None` 必须用 `is None`**(精确),而判"为空或 None"才用 `not x`(宽松)。混用会导致把 0/''/[] 误当 None,或把 None 漏判,产生隐蔽 bug。这是 None 使用的第一原则。

理解了 None 的单例性、`is` 判断规范、布尔假值、与空值的辨析,就掌握了 None 的核心。后续章节展开各 API 细节与实战场景。

---

## 2. 核心内容

本章详解 `None` 的全部用法与陷阱。每节遵循"规则 → demo → 陷阱 → 场景"展开。`is None` 判断规范、函数返回与默认参数哨兵、None 与空值辨析是重点,因为它们最易在生产环境出问题。

### 2.1 判断 None:必须用 is,不用 ==

这是 `None` 使用最核心的规范:**判断一个值是否为 `None`,必须用 `is`(`x is None` / `x is not None`),不要用 `==`(`x == None`)**。

```python
x = None
# 推荐
if x is None:
    print("x 是 None")
if x is not None:
    print("x 非 None")
# 不推荐
if x == None:        # 虽此处可行,但有隐患
    print("x 是 None")
```

**为什么必须用 `is`?** 三个原因:

**原因一:None 是单例,`is` 判身份最直接高效。** `None` 全解释器只有一个对象,`is` 直接比内存地址(id),无需调用任何方法,是 O(1) 的指针比较。`==` 则要调用 `x.__eq__(None)`,多一层方法调用开销。对单例而言,`is` 既正确又高效。

**原因二:`==` 可能被自定义 `__eq__` 改写,行为不可靠。** `==` 调用对象的 `__eq__` 方法,而 `__eq__` 可被自定义类重写。一个类如果把 `__eq__` 实现成"和任意值都相等"或"抛异常",`x == None` 就会失控:

```python
class AlwaysEqual:
    def __eq__(self, other):
        return True       # 与任意值都"相等"
    # 注意:重写 __eq__ 后 __hash__ 默认变 None(不可哈希),此处省略

obj = AlwaysEqual()
print(obj == None)        # True! —— 误判,但 obj 根本不是 None
print(obj is None)        # False —— is 不受 __eq__ 影响,可靠
```

`obj == None` 返回 `True`(被 `__eq__` 欺骗),但 `obj is None` 正确返回 `False`。`is` 只判身份,不受任何方法影响,永远可靠。这是判 None 用 `is` 的根本理由——**身份判断不应被值相等逻辑干扰**。

**原因三:PEP 8 明确规定。** Python 官方风格指南 PEP 8 写道:"Comparisons to singletons like None should always be done with is or is not, never the equality operators."(与 None 等单例的比较永远应用 is/is not,绝不用相等运算符)。这是社区共识。

**`is not None`(否定形式)** 同样用 `is not`:

```python
# 推荐
if x is not None: ...
# 不推荐
if not x is None: ...     # 啰嗦,且易读错
if x != None: ...         # 不可靠(同 == None 的隐患)
```

`is not None` 是 `is None` 的否定,一体适用。`not x is None` 虽语法合法(等价 `is not None`),但啰嗦且易与 `not (x is None)` 混淆,用 `is not None` 更地道。

**这条规范要刻进肌肉记忆**:**判 None 永远 `is None` / `is not None`**。同样,判 `True`/`False` 单例也用 `is`,但判 None 是最高频、最重要的应用。

### 2.2 None 的属性访问与方法

`None` 作为 `NoneType` 的唯一实例,方法极少——它几乎没有公开方法,试图调用方法或访问属性会报 `AttributeError`:

```python
x = None
# x.foo()          # AttributeError: 'NoneType' object has no attribute 'foo'
# x[0]             # TypeError: 'NoneType' object is not subscriptable(不可索引)
# len(x)           # TypeError: object of type 'NoneType' has no len()
# x + 1            # TypeError: unsupported operand type(s) for +: 'NoneType' and 'int'
```

`None` 不能调用方法、不能索引、无长度、不参与算术——它只是个"无值"标记。这些报错是 None 相关 bug 最常见的表现形式:当你对某个本该有值、实际却是 None 的对象操作时,会撞上这些错误。

```python
# 典型 None bug:函数返回 None 却被当结果操作
def get_user(id):
    if id == 1:
        return {"name": "Alice"}
    return None         # 找不到返回 None

user = get_user(999)    # None(用户不存在)
# print(user["name"])  # TypeError: 'NoneType' is not subscriptable
# 正确做法:先判 None
if user is not None:
    print(user["name"])
else:
    print("用户不存在")
```

`'NoneType' object has no attribute ...` / `'NoneType' is not subscriptable` 是 Python 最高频的错误之一——几乎都源于"对 None 做了需要值的操作"。预防方法:凡是可能返回 None 的函数(查找类、解析类),调用后先判 None 再用。

**`NoneType` 的方法**(很少,但有几个):

```python
print(NoneType := type(None))
# NoneType 继承 object,有 object 的通用方法
print(None.__bool__())      # False —— 真值测试(实现为返回 False)
print(None.__repr__())      # 'None' —— 字符串表示
print(None.__class__)       # <class 'NoneType'>
# 没有业务方法,就是个值标记
```

`None` 继承 `object`,有 `__bool__`(返回 False,故 None 为假)、`__repr__`/`__str__`(返回 `'None'`)等基础方法,但没有业务方法。它就是个"无值常量",行为极简。

### 2.3 函数返回值与 None

`None` 是函数的默认返回值——当函数没有 `return` 语句、或 `return` 不带值时,函数返回 `None`。这是 `None` 最常见的来源。

```python
# 无 return 语句 → 返回 None
def greet(name):
    print(f"Hello, {name}")    # 只打印,不 return
result = greet("Alice")        # 打印 Hello, Alice
print(result)                  # None —— 函数返回 None

# return 不带值 → 返回 None
def do_something():
    print("doing")
    return                    # 等价 return None
r = do_something()
print(r)                      # None

# 显式 return None(明确表达"无返回值")
def not_found():
    return None               # 显式,语义清晰
```

理解这条规则很重要——很多新手不知道"没有 return 的函数返回 None",导致对返回值误用:

```python
def append_item(lst, item):
    lst.append(item)          # 就地修改,无 return
data = [1, 2]
result = append_item(data, 3)
print(result)                 # None!不是 [1,2,3]
# list.append 返回 None(就地修改类方法都不返回新对象)
print(data)                   # [1, 2, 3] —— 原列表被改了,但返回值是 None
```

`list.append`、`list.sort`、`list.extend`、`dict.update`、`set.add` 等"就地修改"方法都返回 `None`(Python 的统一约定:就地修改的方法不返回新对象,避免误用链式调用滋生 bug)。新手常误以为 `lst.append(x)` 返回追加后的列表,实则返回 None。这条 `None` 返回约定要牢记。

**查找类函数返回 None 表"未找到"**:

```python
def find_user(user_id):
    users = {1: "Alice", 2: "Bob"}
    if user_id in users:
        return users[user_id]
    return None           # 找不到返回 None(表"缺失")

name = find_user(999)
if name is not None:      # 先判 None
    print(f"找到:{name}")
else:
    print("未找到")
```

查找/查询类函数,"找不到"时返回 `None` 是 Python 的惯例(如 `dict.get` 在键缺失时返回 `None`)。调用方必须判 None 处理"缺失"分支,否则对 None 操作会报错。

**显式 return None vs 隐式**:

```python
# 隐式(无 return 或 return 不带值):返回 None,但意图不够明确
def process(x):
    if x < 0:
        return            # 隐式 None,啥也没处理
    # ... 无 return

# 显式 return None:语义清晰(明确表达"这里返回空")
def process(x):
    if x < 0:
        return None       # 明确:负数不处理,返回 None
    return x * 2
```

当函数语义上确实要"返回无值"(如查找失败的哨兵、处理跳过)时,用显式 `return None` 比隐式更清晰,让读代码者明白返回 None 是有意为之。而"无返回值的副作用函数"(如 `print`、`append`)用隐式(不写 return 或空 return)即可——它们本就不该被期望有返回值。按意图选择显式与否。

### 2.4 None 作函数默认参数哨兵(重点)

`None` 作函数默认参数的**哨兵(sentinel)**,是 Python 最经典、最重要的设计模式之一。它解决两个问题:可变默认参数陷阱、区分"未传参"与"传了假值"。

**问题一:可变默认参数陷阱**(详见《变量赋值机制》)。用可变对象(`[]`/`{}`/`set()`)做默认参数会出 bug:

```python
# 危险:可变默认参数
def add_item(item, target=[]):    # 默认 target 是同一个 list!
    target.append(item)
    return target
print(add_item(1))    # [1]
print(add_item(2))    # [1, 2] —— 不是 [2]!默认 list 被多次调用共享累积
print(add_item(3))    # [1, 2, 3]
```

函数默认参数在**函数定义时求值一次**,之后所有调用共享同一个默认 list。这是 Python 最经典的 bug。**修复:用 None 哨兵,函数内创建**:

```python
# 正确:None 哨兵
def add_item(item, target=None):
    if target is None:
        target = []        # 每次调用未传参时,新建 list
    target.append(item)
    return target
print(add_item(1))    # [1]
print(add_item(2))    # [2] —— 正确!每次 None 则新建
print(add_item(3, [9]))  # [9, 3] —— 传了则用传入的
```

`None` 哨兵模式:`def f(x=None): if x is None: x = []`。这是 Python 处理"可变默认参数"的标准范式,要刻进 DNA:**可变对象绝不做函数默认参数,用 None 哨兵替代**。

**问题二:区分"未传参"与"传了假值"**。有时默认参数的合法值包含假值(如 `0`/`''`/`False`),你需要在"用户没传"和"用户传了 0"之间区分:

```python
# 用 None 区分"未传 timeout"和"传了 timeout=0"
def fetch(url, timeout=None):
    if timeout is None:         # 未传参 → 用默认 30
        timeout = 30
    # 若用户传 timeout=0,这里 timeout=0,不会被替换(is None 为 False)
    print(f"超时:{timeout}s")
fetch("a.com")            # 超时:30s(未传,用默认)
fetch("a.com", timeout=0) # 超时:0s(传了 0,0 是合法值,保留)
fetch("a.com", timeout=10)# 超时:10s
```

若用 `def fetch(url, timeout=30)` 配 `if timeout:`(判假值),`timeout=0` 会被当"假值"替换成 30——把合法的 0 吞了。用 None 哨兵 + `is None` 判断,精确区分"未传"(None)与"传了0"(0)。这对"0/False/'' 是合法输入"的参数至关重要。

⚠️ **哨兵判断必须用 `is None`,不能用 `if not timeout`**:

```python
# 错误:if not timeout 会把 0/''/False 也当"未传"
def fetch_bad(url, timeout=None):
    if not timeout:        # timeout 为 0/None/'' 都触发!
        timeout = 30       # 把合法的 0 也换成 30
# 正确:if timeout is None 只在真 None 时触发
def fetch_good(url, timeout=None):
    if timeout is None:    # 仅 None 触发
        timeout = 30
```

`if not x:` 判"假值"(含 None/0/''),`if x is None:` 仅判 None。哨兵场景必须用后者,否则会吞掉合法的假值输入。这条与 §1.3 一致,是 None 哨兵的正确写法。

**多参数哨兵**:

```python
def configure(host=None, port=None, debug=None):
    host = host or "localhost"        # None/'' 都用默认(若 '' 非合法)
    if port is None:                  # 仅 None 用默认(0 是合法端口?这里 port 0 罕见,依场景)
        port = 8080
    if debug is None:                 # debug 用 is None,因 False 是合法调试值
        debug = False
    print(host, port, debug)
configure()                           # localhost 8080 False
configure(port=0, debug=False)        # localhost 0 False(0 和 False 被保留)
```

多可选参数各自用 None 哨兵,按"该参数的合法值是否含假值"选用 `is None`(含假值,如 debug=False 合法)或 `or`(不含假值或欢迎 falsy 替换,如 host)。这种"逐参数哨兵"是构造灵活 API 的标准模式。`None` 哨兵是 Python 函数设计的高频核心技巧,务必熟练。

### 2.5 None 的安全访问与"可选链"

`None` 的最大风险是"对 None 操作导致 TypeError"。Python 没有 `?.`(可选链)运算符(不像 JavaScript/Kotlin),但有几种安全的 None 处理模式。

**模式一:先判 None 再访问**(最基本):

```python
user = get_user(999)          # 可能返回 None
# user["name"]                # 若 user 是 None,TypeError
if user is not None:
    print(user["name"])
else:
    print("无用户")
```

**模式二:用容器方法避免对 None 操作**。若 None 来自"查找失败",改用返回空容器或用 `.get()`:

```python
# dict.get 在键缺失时返回 None(或指定默认),不抛错
d = {"a": 1}
print(d.get("b"))          # None —— 键不存在,安全
print(d.get("b", 0))       # 0 —— 自定义默认值
# 但若 dict 本身可能是 None,仍要先判 None
config = None
# config.get("x")          # TypeError:None 没有 get
val = config.get("x") if config is not None else None   # 安全
```

**模式三:`or` 提供默认**(注意 falsy 覆盖,见 §3):

```python
# None 或空都用默认(若默认语义可接受 falsy 替换)
name = get_name() or "匿名"   # None/'' 都 → "匿名"
# 注意:若 '' 是合法值(不该被替换),用 is None 而非 or
name = get_name() if get_name() is not None else "匿名"
```

**模式四:`and` 短路链式访问**(None 为假短路):

```python
# obj 为 None 时,and 短路返回 None,不调 .method()
obj = None
result = obj and obj.method()    # None —— 短路,不调 method(避免 AttributeError)
# 但注意:空容器([]/{}/'')也为假,会误短路(见 §3.8)
```

⚠️ `and` 链式访问只对 None/falsy-非容器对象可靠。对可能为空容器的对象,空容器会短路返回自身而非进入方法。更稳妥仍是显式 `if obj is not None:`。

**模式五:封装为函数/工具**(模拟可选链):

```python
def safe_get(obj, *keys, default=None):
    """安全地沿 keys 链取值,任一层为 None/不存在返回 default。"""
    for k in keys:
        if obj is None:
            return default
        if isinstance(obj, dict):
            obj = obj.get(k, default)
        else:
            obj = getattr(obj, k, default)
    return obj

user = {"profile": {"name": "Alice"}}
print(safe_get(user, "profile", "name"))      # Alice
print(safe_get(user, "profile", "age"))       # None —— 安全
print(safe_get(None, "profile"))              # None —— 安全
print(safe_get(user, "profile", "age", default=0))  # 0
```

`safe_get` 沿键链逐层取,任一层 None/缺失返回默认——模拟了 `?.` 链。处理深层嵌套的可选数据(JSON、配置、API 响应)时,这类工具能避免大量 `is not None` 嵌套判断。也可用第三方库(如 `glom`、`pydantic`)处理复杂嵌套。

Python 没有原生可选链,但"判 None + 容器方法 + 工具函数"组合能安全处理绝大多数 None 访问场景。核心原则:**对可能为 None 的对象,先判 None 再操作**(EAFP 即 try/except 也是一种,见 §3)。

### 2.6 None 在数据结构中的用途

`None` 是构建数据结构的常用"终止/空白"标记。

**链表/树的终止节点**:用 `None` 表示链表末尾、树叶子节点的"无子节点":

```python
# 单链表节点:next 为 None 表末尾
class Node:
    def __init__(self, value, next=None):
        self.value = value
        self.next = next      # None 表链尾

head = Node(1, Node(2, Node(3, None)))   # 1→2→3→None(尾)
# 遍历
cur = head
while cur is not None:        # 遇 None 停止
    print(cur.value)
    cur = cur.next
```

`while cur is not None:` 是链表遍历的标准写法——`is not None` 精确判"是否到末尾"。注意不能用 `while cur:`(判假值),若节点 value 为 0/[] 等假值不影响(因 cur 是 Node 对象非假),但用 `is not None` 更明确意图、更稳健。

**二叉树的空子节点**:

```python
class TreeNode:
    def __init__(self, val, left=None, right=None):
        self.val = val
        self.left = left      # None 表无左子
        self.right = right    # None 表无右子

def traverse(node):
    if node is None:          # 空节点,返回
        return
    traverse(node.left)
    print(node.val)
    traverse(node.right)
```

树/递归算法中,`if node is None: return` 是终止条件的标准写法。`None` 表示"没有子树",让递归自然终止。

**占位/延迟赋值**:变量先声明为 `None`,后续再赋有效值:

```python
result = None             # 占位,先无值
for candidate in candidates:
    if is_valid(candidate):
        result = candidate # 找到才赋值
        break
if result is not None:    # 判断是否找到
    use(result)
```

`result = None` 占位 + `if result is not None` 判断,是"搜索/查找"逻辑的标准结构。比"先不定义变量"更好(后者在未找到时 `result` 不存在,NameError)。

**清空引用**:用 `None` 释放对原对象的引用(配合垃圾回收):

```python
big_data = load_huge()    # 大对象
process(big_data)
big_data = None           # 解除引用,若无人引用,对象可被 GC 回收
# 不能用 del big_data?也可,但 = None 更温和(只解除引用,不删名字)
```

`x = None` 让 `x` 改指 None,原对象引用计数减一,若无其他引用则被回收。这用于"主动释放大对象内存"。

### 2.7 None 与 JSON / null

JSON 是数据交换的标准格式,JSON 的 `null` 对应 Python 的 `None`,`json` 模块自动转换:

```python
import json
# Python → JSON:None 变 null
data = {"name": "Alice", "age": None, "scores": [90, None]}
js = json.dumps(data)
print(js)                    # {"name": "Alice", "age": null, "scores": [90, null]}

# JSON → Python:null 变 None
parsed = json.loads('{"name": "Bob", "age": null}')
print(parsed)                # {'name': 'Bob', 'age': None}
print(parsed["age"])         # None
print(parsed["age"] is None) # True
```

JSON `null` ⇄ Python `None` 是 `json` 模块的自动映射。处理来自前端/API 的 JSON 数据时,缺失字段常表现为 `null`→`None`,需用 `is None` 判断。

⚠️ **JSON 字段缺失 vs 字段值为 null 是两回事**:

```python
# 字段值为 null
{"name": "Alice", "age": null}   # age 字段存在,值为 None
# 字段缺失
{"name": "Alice"}                # 没有 age 字段

# 解析后区分
d1 = {"name": "Alice", "age": None}
d2 = {"name": "Alice"}
print("age" in d1, d1.get("age"))    # True None(字段存在,值 None)
print("age" in d2, d2.get("age"))    # False None(字段缺失,get 返回 None)
# 用 in 区分"字段缺失"与"值为 null",用 .get 都返回 None 无法区分
```

`d["age"]` 在字段缺失时抛 `KeyError`,`d.get("age")` 在字段缺失和值为 None 时都返回 None(无法区分)。要区分"字段缺失"和"值是 null",用 `in` 运算符(`"age" in d`)而非 `.get`。这是处理 JSON/可变数据时区分"三态"的细节。

### 2.8 综合示例:None 在实战中的全貌

下面这个片段综合演示 None 的各类用法与陷阱:

```python
# 1. 函数默认返回 None + 哨兵默认参数
def find(items, key, default=None):
    """查找 key,找到返回值,否则返回 default。"""
    for k, v in items:
        if k == key:
            return v
    return default            # 找不到返回 default(None 或自定义)

data = [("a", 1), ("b", 2)]
print(find(data, "b"))        # 2
print(find(data, "z"))        # None(默认)
print(find(data, "z", 0))     # 0(自定义默认,即便 0 是合法返回也能区分"找到0"和"未找到")

# 2. None 哨兵:区分未传参与传了假值
def connect(host=None, port=None, timeout=None):
    host = host or "localhost"      # None/'' 用默认
    if port is None:                # 仅 None(0 是合法端口?此处假设 0 用默认)
        port = 8080
    if timeout is None:             # 仅 None(0 是合法超时?此处 0 保留)
        timeout = 30
    print(f"{host}:{port} timeout={timeout}")
connect()                          # localhost:8080 timeout=30
connect(port=0, timeout=0)         # localhost:0 timeout=0(0 被保留,因 is None 判断)

# 3. 判 None 用 is,与空值区分
values = [None, 0, "", [], False, "x"]
for v in values:
    if v is None:
        print(f"{v!r:8} -> None(无值)")
    elif not v:
        print(f"{v!r:8} -> 假值(但有对象)")
    else:
        print(f"{v!r:8} -> 真值")

# 4. 安全访问:判 None 再操作
def get_email(user):
    if user is None:                # 先判 None
        return "无用户"
    return user.get("email", "无邮箱")
print(get_email(None))              # 无用户
print(get_email({"name": "A"}))     # 无邮箱

# 5. JSON null ⇄ None
import json
js = '{"name": "Alice", "age": null, "city": "杭州"}'
obj = json.loads(js)
print(obj["age"] is None)           # True(null → None)
print("city" in obj, "phone" in obj) # True False(用 in 区分字段存在/缺失)

# 6. 数据结构:链表用 None 作终止
class Node:
    def __init__(self, v, nxt=None):
        self.v, self.next = v, nxt
head = Node(1, Node(2, Node(3)))
cur = head
while cur is not None:              # is not None 判终止
    print(cur.v, end=" ")           # 1 2 3
    cur = cur.next
print()
```

跑一遍这段示例,对照输出:None 作默认返回、哨兵区分未传参与假值、`is None` 与空值辨析、安全访问、JSON null 互转、链表终止——None 的完整实战全貌就清晰了。核心:**判 None 用 is、哨兵用 is None 区分假值、对 None 先判再操作、None 表缺失与空值有别**。

---

## 3. 最佳实践

### 3.1 判 None 必须用 is None / is not None,不用 == None

```python
# 推荐
if x is None: ...
if x is not None: ...
# 不推荐
if x == None: ...      # 可能被自定义 __eq__ 改写,不可靠
if x != None: ...      # 同上
```

`None` 是单例,`is` 判身份最直接可靠高效;`==` 调 `__eq__` 可能被改写。PEP 8 明确规定判 None 用 is。这条是 None 使用的第一规范,刻进肌肉记忆。

### 3.2 区分 "判 None" 与 "判假值",别混用

```python
# 判 None(精确,只 None 触发)
if x is None: ...
# 判假值(宽松,None/0/''/[]/False 都触发)
if not x: ...
```

`is None` 与 `not x` 语义不同:前者只判 None,后者把 0/''/[] 也判进去。要"是否为 None"用 is None,要"是否为空或无值"用 not x。按真实意图选,混用会产生 0/''/[] 被误当 None 的 bug。

### 3.3 哨兵判断用 is None,不用 if not x(避免吞假值)

```python
# 正确:哨兵用 is None,保留合法的 0/False/'' 输入
def f(timeout=None):
    if timeout is None:
        timeout = 30
# 错误:if not timeout 会把 timeout=0 也当"未传"换成 30
def f_bad(timeout=None):
    if not timeout:        # 0/None/'' 都触发!
        timeout = 30
```

默认参数哨兵必须用 `is None` 判断,这样 `timeout=0`(合法值)能被保留,只有真未传参(None)才用默认。`if not x` 会吞掉 0/False/'' 等合法假值输入。

### 3.4 可变对象绝不做默认参数,用 None 哨兵

```python
# 正确
def f(items=None):
    if items is None:
        items = []
# 错误(可变默认陷阱)
def f(items=[]):
    ...
```

可变默认参数(`[]`/`{}`/`set()`)在函数定义时求值一次,多次调用共享导致累积 bug。一律用 None 哨兵,函数内创建。Python 函数设计的铁律。

### 3.5 对可能返回 None 的对象,先判 None 再操作

```python
# 推荐:查找类返回 None,先判
user = get_user(id)
if user is not None:
    print(user["name"])
else:
    print("不存在")
# 不推荐:直接操作,可能 TypeError
print(user["name"])   # user 为 None 时崩溃
```

查找/解析类函数常用 None 表"未找到/失败"。调用后先 `is not None` 判断再访问属性/索引,避免 `'NoneType' has no attribute` / `NoneType is not subscriptable` 错误。

### 3.6 None 作"缺失值"与 0/'' 的"零值/空值"语义别混

```python
# 区分三态:未提供(None)、空('')、有值
if name is None:      # 未提供
elif name == "":      # 提供了空
else:                 # 有值
```

`None`(缺失)、`0`/`''`/`[]`(存在但空)、有值,是三种不同状态(如考试未考 vs 0 分)。用 `is None` 精确判缺失,别用 `not x` 把三者混为一谈。需要区分时逐态判断。

### 3.7 区分 JSON 字段缺失与值为 null,用 in 不用 get

```python
# 字段缺失 vs 值为 null 是两回事
d = {"name": "Alice", "age": None}
if "age" in d:        # True —— 字段存在(值是 null/None)
    ...
if "phone" in d:      # False —— 字段缺失
    ...
# .get 在缺失和 null 都返回 None,无法区分
```

JSON/null 处理中,字段缺失与字段值为 null 不同。用 `"key" in d` 区分,`.get` 两者都返回 None 无法分辨。处理 API/配置数据的"三态"时用 in。

### 3.8 and 链式访问只对 None 可靠,空容器会误短路

```python
# None 安全(可靠)
val = obj and obj.method()      # obj 为 None 短路
# 但 obj 为空容器([]/{}/'')时,也会短路返回空容器本身(非方法结果)
# 稳妥:显式判 None 或直接用容器方法
val = obj.method() if obj is not None else None
```

`and` 链式访问对 None 可靠,但空容器为假会误短路。对可能为空容器的对象,用 `is not None` 判断或直接调无副作用的容器方法(如 `{}.get(x)` 空 dict 也不报错)。

### 3.9 显式 return None 表"有意无返回值",副作用函数用隐式

```python
# 查找失败:显式 return None,语义清晰
def find(x):
    if x in data:
        return data[x]
    return None        # 明确:找不到返回 None
# 副作用函数(append/print):隐式(无 return),本就无返回值
def log(msg):
    print(msg)         # 隐式返回 None,无歧义
```

函数语义上"返回无值"(查找失败哨兵、跳过处理)时用显式 `return None` 让意图清晰;副作用函数(无返回值)用隐式。按意图选择,提升可读性。

### 3.10 EAFP:对 None 操作可 try/except,但 is None 通常更清晰

```python
# LBYL(先查):先判 None
if user is not None:
    user.do()
# EAFP(请求原谅):直接试,捕获
try:
    user.do()
except AttributeError:
    ...
```

处理 None 有两种风格:LBYL(先 `is not None` 判断)和 EAFP(直接操作,捕获 AttributeError)。Python 倾向 EAFP,但对 None 这一明确的单例,LBYL 的 `is not None` 通常更清晰高效(避免异常开销)。判断 None 用 `is`,别滥用 try/except 替代明确判断。

### 3.11 链表/树遍历用 is not None 判终止,意图明确

```python
cur = head
while cur is not None:     # 明确:判"未到尾"
    ...
    cur = cur.next
# 虽 while cur: 也常可行(Node 对象非假),但 is not None 意图更明确
```

数据结构遍历用 `is not None` 判终止,比 `while cur:`(判假值)意图更明确——前者直说"没到 None 终止",后者依赖"Node 非假"的隐含假设。明确表达意图优先。

### 3.12 配置/可选字段用 None 表"未设置",配合 is None 与默认值

```python
def serve(host=None, port=None, retries=None):
    host = host or "0.0.0.0"        # None/'' 用默认
    port = port if port is not None else 8080   # 0 是合法端口,用 is None
    retries = retries if retries is not None else 3
```

可选配置字段用 None 表"未设置"。按"该字段合法值是否含假值"选 `is None`(含假值,如 port=0)或 `or`(不含或欢迎替换)。逐字段哨兵构造灵活 API。

---

## 4. 原理

本章讲清 `None` 背后的机制:`None` 单例的实现、`NoneType` 没有公开名的原因、`is` vs `==` 判 None 的内部差异(`LOAD_CONST`+`IS_OP` vs `__eq__`)、`None` 布尔假值的实现、函数默认返回 None 的字节码。这些是"None 为何如此"的根基。

### 4.1 None 的单例实现(需理解,详述)

`None` 是单例——CPython 在解释器初始化时创建**唯一一个** `None` 对象,此后所有对 `None` 的引用都指向它。源码层(`object.c`),`_Py_NoneStruct` 是那个唯一的 None 对象,`None` 这个名字绑定到它。

```python
# 验证单例:所有 None 引用同一对象
a = None
b = None
c = (lambda: None)()
print(a is b is c)         # True —— 全是同一对象
print(id(a) == id(b))      # True —— 同一内存地址
```

无论 None 从何而来(字面量、函数默认返回、变量赋值、`dict.get` 缺失),都是同一个对象。这与"每次写 `[]` 创建新列表"截然不同——`None` 只有一个。

**单例的内存意义**:所有 `None` 引用共享一个对象,内存里不存在"多个 None 副本"。一千万个变量都赋 `None`,它们指向同一个对象,内存开销极小(一个对象的指针)。这是 None 设计成单例的实用理由之一——"无值"如此常见,共用一个对象最省。

**`NoneType` 没有公开名的原因**:`None` 的类型 `NoneType` 没有像 `int`/`str` 那样的内置名(你不能直接写 `NoneType`)。这是故意的——判 None 应该用 `is None`(简洁、规范、高效),而非 `isinstance(x, NoneType)`(啰嗦且需先 `type(None)` 取类型)。`NoneType` 的"无名"引导开发者用正确的 `is None` 判断:

```python
# 规范(被引导的写法)
if x is None: ...
# 不推荐(需绕弯取类型)
NoneType = type(None)
if isinstance(x, NoneType): ...
```

`type(None)` 主要用于类型注解元编程(如 `-> None`)或框架内部,日常判 None 一律 `is None`。

**None 的不可变性**:`None` 不可变且无属性可改——你不能给 None 加属性、不能改它的"值"(它就是个常量标记)。这与单例配合,保证 None 永远是那个唯一的"无值"对象,行为绝对确定。任何代码都无法伪造或改变 None,这让 `is None` 判断永远可靠。

### 4.2 is vs == 判 None 的内部差异(需理解,详述)

§2.1 讲了判 None 用 `is` 而非 `==`,这里讲清字节码层的差异,理解了就知为何 `is` 更优。

**`x is None` 的实现**——身份比较,直接比指针:

```python
import dis
dis.dis(compile("x is None", "", "eval"))
# LOAD_NAME x
# LOAD_CONST None            —— 加载 None 单例常量
# IS_OP 0                    —— 身份比较(直接比指针/id),结果 bool
```

`is None` 的字节码:`LOAD_NAME x` 加载 x,`LOAD_CONST None` 加载 None 单例(编译期常量,直接拿那个唯一对象),`IS_OP` 比较两个指针是否指向同一对象。全程是**指针比较**,不调用任何方法,O(1),极快,且结果确定(True/False)。

**`x == None` 的实现**——值相等,调用 `__eq__`:

```python
dis.dis(compile("x == None", "", "eval"))
# LOAD_NAME x
# LOAD_CONST None
# IS_OP 0 / COMPARE_OP ==    —— 实际调用 x.__eq__(None)(及反射 None.__eq__(x))
```

`== None` 的字节码走 `COMPARE_OP ==`,内部会调用 `x.__eq__(None)`(若 x 未定义或返回 NotImplemented,再试 `None.__eq__(x)`)。这条路径:

- **可能被自定义 `__eq__` 改写**:如 §2.1 的 `AlwaysEqual`,`x == None` 返回 True(被欺骗)。
- **多一层方法调用开销**:比 `is` 的指针比较慢(虽差异极小)。
- **结果可能不确定**:取决于 `__eq__` 实现,甚至可能抛异常。

这就是 `is None` 优于 `== None` 的字节码根源:**身份比较(IS_OP,指针,确定)vs 值比较(COMPARE_OP,方法,可能被改)**。对 None 这种单例,身份比较才是语义正确的判断方式——"是不是那个 None",本就应是身份问题,不是值相等问题。

**PEP 8 的依据**:正因为 `== None` 可能被 `__eq__` 干扰而 `is None` 不会,PEP 8 规定判 None 用 is。这不是风格偏好,是基于语言语义的正确性要求。

### 4.3 None 布尔假值的实现

`None` 在布尔语境为假,底层是 `NoneType.__bool__` 返回 `False`:

```python
print(type(None).__bool__)      # <slot wrapper '__bool__' of 'object' objects> 或类似
print(bool(None))               # False
# NoneType 定义了 __bool__ 返回 False(或等价的"非真"实现)
```

`NoneType` 实现了 `__bool__`(继承自 object 或自定义),返回 `False`,故 `bool(None)` 为 `False`,`if None:` 不执行。这是 None 作为假值的字节码依据——`if x:` 等价 `if bool(x):`(实际用 `POP_JUMP_IF_FALSE` 等指令 + 真值测试),None 走 `__bool__` 得 False。

**与"空容器靠 `__len__` 为假"的对比**:None 没有长度(`len(None)` 报错),它为假靠的是 `__bool__` 直接返回 False,而非 `__len__==0`。这是 None 真值测试的精确实现:NoneType 自身明确"我永远是假",不依赖长度推断。

理解 None 的 `__bool__` 返回 False,就理解了 `if not x:` 为何能覆盖 None——None 走 `__bool__` 得 False,`not False` 为 True。但这也提醒:`if not x:` 判的是"假值"(None/0/'' 都触发),与 `if x is None:`(只 None)不同,§3 已强调不要混用。

### 4.4 函数默认返回 None 的字节码

函数无 `return` 时返回 None,字节码层体现为函数末尾隐式 `RETURN_CONST None`:

```python
import dis
def f(x):
    print(x)
dis.dis(f)
# ...
# LOAD_CONST None            —— 隐式加载 None
# RETURN_VALUE               —— 返回 None
```

函数体末尾,CPython 自动插入 `LOAD_CONST None; RETURN_VALUE`——若无显式 return,函数返回 None 单例。`return`(不带值)同样展开为 `return None`。这就是"无 return 的函数返回 None"的字节码根源——不是运行时决定,是编译期就在函数末尾放好了返回 None 的指令。

**就地修改方法返回 None 的约定**:`list.append`、`list.sort` 等就地修改方法,其 C 实现明确 `return None`(C 层 `Py_RETURN_NONE`)。这是 Python 的有意约定:就地修改的方法返回 None,而非返回修改后的对象(或 self),目的是**防止链式调用滋生 bug**。若 `lst.append(x)` 返回 lst,用户可能误以为它返回新列表(像函数式风格),导致 `result = lst.append(x)` 把 None 赋给 result。Python 选择让就地方法返回 None,强制用户区分"就地修改"(返回 None)与"返回新对象"(如 `sorted` 返回新列表):

```python
lst = [3, 1, 2]
print(lst.sort())      # None —— 就地修改,返回 None
print(sorted(lst))     # [1, 2, 3] —— 返回新列表
```

`lst.sort()`(就地,返回 None)vs `sorted(lst)`(返回新列表)是这一约定的典型对照。理解就地方法返回 None 是有意设计,就能正确选择"就地 vs 返回新"两种方法,避免对返回值误用。

### 4.5 None 作哨兵的语义根基

`None` 作函数默认参数哨兵为何可靠?根基在于 None 的三个性质:

1. **单例**:None 只有一个对象,作"未传参标志"不会与其他值冲突——任何调用中 `arg is None` 都精确判"是否未传"(传了 None 本身除外,见下)。
2. **不可伪造**:用户代码无法创建"另一个 None 对象",`x is None` 永远只对真 None 为 True。哨兵安全性由此保证。
3. **布尔假值但不等于其他假值**:None 与 0/''/[]/False 在 `is` 比较下严格区分(`0 is None` 为 False),让哨兵能用 `is None` 精确区分"未传(None)"与"传了假值(0/False/...)"。

这三条性质让 None 成为完美的"未传参哨兵":单例保证唯一性、不可伪造保证安全性、`is` 区分保证精确性。§2.4 的 `def f(timeout=None): if timeout is None: timeout = 30` 正是利用这三条,精确区分"未传"(None→用默认)与"传了0"(0→保留)。

⚠️ **哨兵的唯一局限:无法区分"未传参"与"调用者显式传了 None"**。若用户明确写 `f(timeout=None)`,哨兵 `is None` 会把它当"未传",用默认值覆盖——无法区分"用户没传"和"用户传了 None"。这种罕见需求(需区分两种 None)要用**私有哨兵对象**:

```python
_MISSING = object()    # 私有哨兵,唯一对象,用户不可能传入

def f(timeout=_MISSING):
    if timeout is _MISSING:    # 用私有哨兵判"是否未传"
        timeout = 30
    # 这样 f(None) 显式传 None 不会被当"未传"(None is not _MISSING)
f()           # 未传 → 用 30
f(None)       # 显式 None → 保留 None(不再被默认覆盖)
```

`_MISSING = object()` 创建一个唯一的私有对象,用它而非 None 作哨兵,能区分"未传参"与"传了 None"。这是高级用法,仅当 None 可能是合法显式输入时才需要——绝大多数场景 None 哨兵已足够。理解 None 哨兵的语义根基(单例、不可伪造、is 区分)与这一局限,就能在需要时正确升级到私有哨兵。

---

## 5. 总结

### 5.1 本文内容回顾

- **None 定义**:Python 表示"无值"的常量,类型 NoneType,全解释器唯一单例;语义为"缺失",区别于 0/''/[] 的"零值/空值"。
- **单例性**:所有 None 引用同一对象,故 `is None` 判身份可靠;NoneType 无公开名,引导用 `is None` 判断。
- **布尔行为**:None 是假值(`if not x:` 覆盖),但 `if not x:`(判假值)与 `if x is None:`(判 None)语义不同,不可混用。
- **None 与空值辨析**:`None`(缺失)/`0`/`''`/`[]`(存在但空)语义不同,用 `is None` 精确判缺失。
- **判 None 用 is**:`x is None`/`x is not None`,不用 `== None`(`__eq__` 可能被改写不可靠,PEP 8 规定)。
- **None 属性/方法**:几乎无方法,对 None 调方法/索引/算术抛 AttributeError/TypeError;这是 None bug 高频来源。
- **函数返回 None**:无 return/return 不带值返回 None;就地修改方法(append/sort 等)返回 None 是有意约定;查找类用 None 表"未找到"。
- **None 哨兵(重点)**:可变默认参数用 None 哨兵规避陷阱;区分"未传参"与"传了假值"用 `is None`(不用 `if not x`,避免吞 0/False/'');多参数逐个哨兵。
- **安全访问**:先判 None 再操作、用容器方法(.get)、`and` 短路链(空容器误短路)、工具函数模拟可选链;Python 无原生 `?.`。
- **数据结构用法**:链表/树终止节点、占位/延迟赋值、清空引用(释放大对象)。
- **JSON null ⇄ None**:`json` 模块自动映射;字段缺失 vs 值为 null 用 `in` 区分(`.get` 无法区分)。
- **原理**:None 单例实现(唯一对象,共享省内存,不可变不可伪造);`is None` 用 IS_OP 指针比(确定),`== None` 用 COMPARE_OP 调 `__eq__`(可能被改);None 假值靠 `__bool__` 返回 False;函数默认返回 None 是编译期末尾隐式 RETURN CONST None;就地方法返回 None 是防链式 bug 的有意约定;None 哨兵可靠源于单例+不可伪造+is 区分,局限是无法区分未传与显式传 None(用私有 `object()` 哨兵解决)。
- **最佳实践**:判 None 用 is、区分判 None 与判假值、哨兵用 is None、可变默认用 None 哨兵、先判 None 再操作、None 与空值语义别混、JSON 缺失/null 用 in、and 链防空容器、显式 return None 表意、EAFP 与 is 取衡、遍历用 is not None、配置字段逐个哨兵。

### 5.2 读完本文你应能掌握

- 说明 `None` 的定义与单例性,区分"无值(None)"与"零值/空值(0/''/[])"的语义。
- 说明判 None 必须用 `is None`/`is not None`,阐述 `== None` 因 `__eq__` 改写不可靠的原因(PEP 8)。
- 区分 `if x is None:`(判 None)与 `if not x:`(判假值)的语义,避免混用。
- 用 None 作可变默认参数哨兵,修复可变默认陷阱,用 `is None` 区分"未传参"与"传了假值"。
- 说明函数默认返回 None 的规则,理解就地修改方法返回 None 的约定(append/sort vs sorted)。
- 对可能返回 None 的对象安全访问(先判 None、用 .get、工具函数),避免 'NoneType' 错误。
- 用 None 作链表/树终止节点、占位变量、清空引用。
- 处理 JSON null 与 None 的互转,用 `in` 区分字段缺失与值为 null。
- 阐述 None 单例实现、is/== 判 None 的字节码差异、None 假值的 `__bool__`、函数默认返回 None 的编译机制、None 哨兵的语义根基与私有哨兵升级。

### 5.3 延伸方向

- **bool 类型与短路逻辑**:None 作为假值、`and`/`or` 短路与 None、`not x` 与 `is None` 的取舍,见《bool 类型与短路逻辑》。
- **变量赋值机制**:可变默认参数陷阱的完整原理(定义时求值一次)、引用计数与 None 释放,见《变量赋值机制》。
- **类型判断与 type 系统**:`is` vs `==`、单例判断、`NoneType` 与元编程,见《类型判断与 type 系统》。
- **int 类型详解**:None 与 0/False 等假值的辨析、可选数值字段的处理,见《int 类型详解》。
- **类型注解**:Optional 类型(`Optional[X]` = `X | None`)、可空字段的静态标注,见《类型注解基础》《Union 与 Any 类型》。
