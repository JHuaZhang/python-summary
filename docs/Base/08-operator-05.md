---
group:
  title: 【08】运算符和表达式
  order: 8
order: 5
title: 逻辑运算符与短路求值
nav:
  title: Python基础
  order: 1
---

# 逻辑运算符与短路求值

## 1. 介绍

### 1.1 什么是逻辑运算符

逻辑运算符（logical operators）是 Python 中用来组合多个条件、做"并且""或者""非"判断的运算符。一共有三个：`and`（与）、`or`（或）、`not`（非）。

如果说比较运算符是"对两个值做判断、前后是否成立"，那么逻辑运算符就是"把多个判断组合成更复杂的判断"。比如"年龄满 18 岁 **并且** 有票才能入场"，比较运算符给出两个独立的判断（`age >= 18`、`has_ticket`），逻辑运算符 `and` 把它们组合起来。

三个运算符一览：

| 运算符 | 含义 | 判断为真的条件 | 示例 |
|--------|------|----------------|------|
| `and` | 与 | 两边都为真才真 | `True and False` → `False` |
| `or` | 或 | 至少一边为真就真 | `True or False` → `True` |
| `not` | 非 | 对操作数取反 | `not True` → `False` |

逻辑运算符最关键的两个特性是本文的核心：

- **返回值不是简单的 `True`/`False`**：`and` 和 `or` 返回的是"操作数本身"（按真值性短路后的那个值），不是新的布尔对象。这和很多语言不同，是新手最容易踩坑的地方。
- **短路求值**：`and` 遇假就停、`or` 遇真就停，后面的表达式不会被求值。这既是性能优势，也是一种"保护"机制，能把可能出错的判断放右边靠左边短路保命。

**本章的学习路径**

```text
三个运算符基本用法
        ↓
真值性与 bool() 转换
        ↓
and / or 返回操作数本身
        ↓
短路求值机制
        ↓
运算符优先级
        ↓
最佳实践 + 短路求值原理
```

### 1.2 最简示例

用一个最小的例子先建立直觉：判断是否可以入场。

```python
age = 20
has_ticket = True
if age >= 18 and has_ticket:
    print("可以入场")
```

**运行结果**：

```text
可以入场
```

`age >= 18` 为 `True`，`has_ticket` 为 `True`，两个用 `and` 连接，都真才真，所以进了 `if` 分支。这就是逻辑运算符最日常的用法。

## 2. 核心内容

### 2.1 三个逻辑运算符总览

先用一组真值表把三个运算符的行为完整列出来，先建立整体全貌。

```python
print("and 真值表")
print(f"True  and True  -> {True and True}")    # True
print(f"True  and False -> {True and False}")  # False
print(f"False and True  -> {False and True}")  # False
print(f"False and False -> {False and False}") # False
```

**运行结果**：

```text
and 真值表
True  and True  -> True
True  and False -> False
False and True  -> False
False and False -> False
```

```python
print("or 真值表")
print(f"True  or True  -> {True or True}")     # True
print(f"True  or False -> {True or False}")   # True
print(f"False or True  -> {False or True}")   # True
print(f"False or False -> {False or False}")  # False
```

**运行结果**：

```text
or 真值表
True  or True  -> True
True  or False -> True
False or True  -> True
False or False -> False
```

```python
print("not 真值表")
print(f"not True  -> {not True}")    # False
print(f"not False -> {not False}")  # True
```

**运行结果**：

```text
not 真值表
not True  -> False
not False -> True
```

注意：上面这些例子只展示了 `True`/`False` 字面量参与运算的情况。当操作数是其他对象（数字、字符串、列表）时，行为会变得更丰富、也更反直觉。

### 2.2 and 运算符

`and` 表示"并且"，两边都为真时整体才为真。最常见的用法是在 `if` 里把多个条件串起来：

```python
age = 20
has_ticket = True
print(age >= 18 and has_ticket)   # True
print(age < 18 and has_ticket)    # False（第一个就假）
```

**运行结果**：

```text
True
False
```

**关键点**：

- `and` 从左到右判断，只要中间出现一个假值，整体结果就一定是假，右边不会再判断。
- 任何"非真值性为假"的对象都会让 `and` 提前结束，不只是布尔 `False`，连 `0`、`""`、`[]`、`None` 也能触发短路。

### 2.3 or 运算符

`or` 表示"或者"，至少一边为真时整体就为真。典型用法是"任一条件成立即可"：

```python
is_vip = False
has_coupon = True
print(is_vip or has_coupon)   # True（第二个为真）
```

**运行结果**：

```text
True
```

**关键点**：

- `or` 从左到右判断，只要中间出现一个真值，整体就一定是真，右边不会再判断。
- `or` 在工程里最常用的不是"二选一判断"，而是**默认值惯用法**：`x or default`——如果 `x` 为假就用后面的默认值。

### 2.4 not 运算符

`not` 表示"取反"，把真值性翻过来。它的结果**永远是布尔值** `True` 或 `False`（这一点和 `and`/`or` 不同，是三者中唯一保证返回布尔的）。

```python
print(not True)        # False
print(not False)       # True
print(not 0)            # True（0 为假，取反为真）
print(not "abc")        # False（非空字符串为真，取反为假）
print(not [])           # True（空列表为假）
```

**运行结果**：

```text
False
True
True
False
True
```

`not` 也可以直接作用于复合表达式：

```python
print(not (3 == 3))   # False，先比较再取反
```

**运行结果**：

```text
False
```

**关键点**：

- `not` 等价于 `not bool(x)`：先把操作数转成布尔，再取反。
- 判空时常用 `if not data:`（空容器为假，取反为真），这是 Python 的惯用法，比 `if len(data) == 0:` 更简洁。
- 但判 `None` 不要用 `not x`：`not 0` 和 `not None` 都是真，语义会混在一起。精确判 `None` 仍要用 `x is None`。

### 2.5 and/or 返回操作数本身而非布尔值（反直觉）

这是逻辑运算符里最容易让人误解的一条特性。先看一组"反直觉"的例子：

```python
print(1 and 2)          # 2
print(0 and 2)          # 0
print(2 and 1)          # 1
print('a' and 'b')      # b
```

**运行结果**：

```text
2
0
1
b
```

`1 and 2` 的结果是 `2`，而不是 `True`！这条规律可以这样表达：

```text
and 的求值规则
    ├─ 如第 1 个为假 → 直接返回【第 1 个】，第 2 个不求值
    └─ 如第 1 个为真 → 整体取决于第 2 个，返回【第 2 个】
```

`or` 的规则正好镜像：

```python
print(1 or 2)           # 1
print(0 or 2)           # 2
print(0 or '')          # ''
print(None or 0)        # 0
```

**运行结果**：

```text
1
2

0
```

```text
or 的求值规则
    ├─ 如第 1 个为真 → 直接返回【第 1 个】，第 2 个不求值
    └─ 如第 1 个为假 → 整体取决于第 2 个，返回【第 2 个】
```

把这一条翻译成直觉：

- `a and b`：要两个都真才真，反正结果都看后面那一个，所以返回"决定结果的那个值"。
- `a or b`：要有一个真就真，谁是真就返回谁；都假才返回最后一个。

**为什么 if 里看起来像返回了 True/False**

因为 `if` 不是直接看 `and`/`or` 返回的对象，而是先把它转成"真值性"再判断。`0 and 1` 返回 `0`，`0` 是假值，于是 `if 0 and 1:` 不成立；`1 and 2` 返回 `2`，`2` 是真值，于是 `if 1 and 2:` 成立。表面效果上和"返回 `True`/`False`"一致，但本质完全不同。

```python
name = "" or "匿名"
if name:                  # name 是 "匿名"，真值
    print(f"使用名字: {name}")
```

**运行结果**：

```text
使用名字: 匿名
```

**关键点**：

- 想拿到布尔结果，就显式用 `bool(...)` 包一下，比如 `bool([] and 'x')` 得到 `False`。
- 利用这条特性可以写出"返回第一个真值"或"取默认值"这类精炼的写法，但也要清楚它带来的坑：`x or default` 中如果 `x` 是 `0`，会被当成"假"而走默认，与"想保留 0"的意图相冲突。

### 2.6 真值性与 bool() 转换

`and`/`or`/`not` 判断的依据都是"真值性"（truthiness）：每个对象在布尔上下文中都有一个"真"或"假"的归类。可以用 `bool()` 函数把任意对象显式转成 `True`/`False`。

```python
falsy = [0, 0.0, "", [], {}, set(), None, False, 0j]
for x in falsy:
    print(f"bool({x!r:8}) -> {bool(x)}")
```

**运行结果**：

```text
bool(0       ) -> False
bool(0.0     ) -> False
bool(''      ) -> False
bool([]      ) -> False
bool({}      ) -> False
bool(set()   ) -> False
bool(None    ) -> False
bool(False   ) -> False
bool(0j      ) -> False
```

```python
truthy = [1, -1, 0.1, "a", [0], {"k": 0}, (0,), True, 1j]
for x in truthy:
    print(f"bool({x!r:10}) -> {bool(x)}")
```

**运行结果**：

```text
bool(1         ) -> True
bool(-1        ) -> True
bool(0.1       ) -> True
bool('a'       ) -> True
bool([0]       ) -> True
bool({'k': 0}  ) -> True
bool((0,)      ) -> True
bool(True      ) -> True
bool(1j        ) -> True
```

**真值规则要点**：

- 数值类：`0`、`0.0`、`0j`、`False` 都为假；其他（含负数）都为真。
- 容器类：空容器（空字符串 `""`、空列表 `[]`、空字典 `{}`、空集合 `set()`、空元组 `()`）都为假；非空就为真（哪怕元素是 `0`）。
- 单例：`None` 为假。
- 其他对象默认为真。

**自定义对象的真值**

如果对象所在类定义了 `__bool__` 方法，就用它的返回值；没有 `__bool__` 但有 `__len__`，就用长度是否大于 0；两者都没有，则默认为真。

```python
class Box:
    def __init__(self, items):
        self.items = items

    def __bool__(self):
        return len(self.items) > 0


print(bool(Box([])))     # False
print(bool(Box([1])))    # True
```

**运行结果**：

```text
False
True
```

```python
class Plain:
    pass


print(bool(Plain()))     # True（没定义任何方法，默认真）
```

**运行结果**：

```text
True
```

**关键点**：自定义容器类想要"`if obj:` 判空"行为，定义 `__bool__` 或 `__len__` 即可，不要靠 `if len(items) > 0:` 反复手写。

### 2.7 短路求值机制

短路求值（short-circuit evaluation）指的是"`and`/`or` 在能确定结果的那一刻就停，后面的表达式不求值"。这一条既能优化性能，更是"在右边放危险判断、靠左边放前置校验"的安全写法的依据。

**and 的短路：遇假即停**

```python
log = {"called": False}

def true_side():
    log["called"] = True
    return True

result = False and true_side()
print(f"False and true_side() -> {result}")
print(f"true_side 被调用了吗？ -> {log['called']}")
```

**运行结果**：

```text
False and true_side() -> False
true_side 被调用了吗？ -> False
```

第一个是 `False` 已经决定整体为假，`true_side()` 完全没被调用。换 `True` 开头：

```python
log["called"] = False
result = True and true_side()
print(f"True and true_side() -> {result}")
print(f"true_side 被调用了吗？ -> {log['called']}")
```

**运行结果**：

```text
True and true_side() -> True
true_side 被调用了吗？ -> True
```

**or 的短路：遇真即停**

```python
log = {"called": False}

def false_side():
    log["called"] = True
    return False

result = True or false_side()
print(f"True or false_side() -> {result}")
print(f"false_side 被调用了吗？ -> {log['called']}")
```

**运行结果**：

```text
True or false_side() -> True
false_side 被调用了吗？ -> False
```

**短路最经典的实用：把"可能出错的判断"放右边**

最广泛的用法是在写除法、取下标前先校验。直接写 `y / x > 1` 在 `x = 0` 时会 `ZeroDivisionError`；用 `and` 把"安全检查"放左边就能短路保护：

```python
x = 0
y = 10
safe = x != 0 and y / x > 1
print(safe)
```

**运行结果**：

```text
False
```

`x != 0` 为 `False`，`and` 立刻短路，`y / x` 这一句根本不会执行，所以没有报错。同理，取列表第一个元素前先判空：

```python
data = []
first_ok = bool(data) and data[0] > 0
print(first_ok)
```

**运行结果**：

```text
False
```

空列表为假，短路后 `data[0]` 不执行，避免 `IndexError`。

**链式 and：从左到右第一个假就停**

```python
steps = []

def ok(val, name):
    steps.append(name)
    return val

r = ok(True, "a") and ok(False, "b") and ok(True, "c")
print(f"链式结果: {r}")
print(f"执行的步骤: {steps}")
```

**运行结果**：

```text
链式结果: False
执行的步骤: ['a', 'b']
```

`b` 返回 `False` 后整体结果已定，后面的 `c` 不会执行。

**关键点**：把"可能抛异常 / 带副作用 / 较重计算"的判断放右边，左边放轻量的前置校验，是工程里非常实用的写法。

### 2.8 or 的默认值惯用法与 0 假值的坑

`a or b` 的语义是"如果 `a` 为真返回 `a`，否则返回 `b`"。它天然适合"取可用值或回退默认值"的场景。

```python
user_input = ""
name = user_input or "匿名"
print(name)              # 匿名
```

**运行结果**：

```text
匿名
```

连续用 `or` 还能做"配置层层回退"：

```python
config = None
fallback = None
default = 8080
port = config or fallback or default
print(port)              # 8080（前两个都为假，取最后的默认）
```

**运行结果**：

```text
8080
```

**0 是假值，用 or 给默认值要当心**

这条是默认值惯用法里最隐蔽的坑。`0` 是假值，`0 or default` 不会保留 `0`，而是走默认值：

```python
port = 0
print(port or 8080)      # 8080，丢失了"端口就是 0"这个合法信息
```

**运行结果**：

```text
8080
```

如果"0"本身是合法值，就不能用 `or`，要用"是否为 None"做显式回退：

```python
port = 0
real_port = port if port is not None else 8080
print(real_port)         # 0
```

**运行结果**：

```text
0
```

**关键点**：`or` 默认值惯用法只对"`None` / 空值 / 排除 0"这类语义成立；如果 0/0.0 是合法值，必须改用 `is None` 判断或三元表达式。

### 2.9 运算符优先级与结合性

逻辑运算符之间有固定优先级：`not` > `and` > `or`。在不加括号时，按这个顺序结合。

```python
a, b, c = True, True, False
print(not a or b)        # (not a) or b
print(not (a or b))      # not (a or b)，完全不同
```

**运行结果**：

```text
False or True -> True
not (a or b) -> False
```

更完整的优先级顺序对比如下：

| 表达式 | 等价拆解 | 解释 |
|--------|----------|------|
| `not a or b` | `(not a) or b` | `not` 比 `or` 高 |
| `a or b and c` | `a or (b and c)` | `and` 比 `or` 高 |
| `not a or b and c` | `(not a) or (b and c)` | 先 `not`，再 `and`，最后 `or` |
| `not x == 1` | `not (x == 1)` | 比较运算符 `==` 比 `not` 高 |

`a or b and c` 的拆解是 `a or (b and c)`，加括号反过来就是 `(a or b) and c`，结果不同：

```python
a, b, c = True, True, False
print(a or b and c)      # True or (True and False) = True or False = True
print((a or b) and c)    # (True or True) and False = True and False = False
```

**运行结果**：

```text
True
False
```

**关键点**：可读性优先。多人协作代码里，逻辑运算优先级靠记忆容易出错，建议该加括号的地方显式加括号，把意图写清楚。

**比较运算符比 not 优先：not x == 1 与 not (x == 1)**
比较运算符（大于、小于、等于、不等于）的优先级都高于 `not`。所以 `not x == 1` 不是 `(not x) == 1`，而是 `not (x == 1)`：

```python
x = 0
print(not x == 1)        # not (0 == 1) = not False = True
print(not (x == 1))      # 同上
print((not x) == 1)      # 注意：not 0 = True，True == 1 也 True；但这绕
```

**运行结果**：

```text
True
True
True
```

虽然 `not 0` 为 `True` 且 `True == 1` 恰好也 `True`，但写成 `(not x) == 1` 几乎不可能是你想要的语义。记得比较永远先于 `not`，惯用写法是 `not (x == 1)` 或更直接的 `x != 1`。

### 2.10 与比较运算符的组合

逻辑运算符真正常用的场景，是把比较运算符给出的多个布尔值组合起来。几个典型模式如下。

**多个条件同时成立用 `and`**：

```python
score = 88
if 60 <= score <= 100:    # 链式比较，等价 60 <= score and score <= 100
    print("合格")
```

**运行结果**：

```text
合格
```

**多个候选值任一匹配用 `or`**——但也别堆 `or`，用 `in` 更简洁：

```python
status = "200"
# 不推荐
if status == "200" or status == "201" or status == "204":
    print("成功类状态")
# 推荐
if status in ("200", "201", "204"):
    print("成功类状态（用 in）")
```

**运行结果**：

```text
成功类状态
成功类状态（用 in）
```

**否定用 `not`**——但要注意 `not` 是按真值取反，不是"非等于"：

```python
val = None
# 不是 not val == None，而是 val is None
print(val is None)       # True
print(not val)            # True，但这里 0/'' 也会 True，不够精确
```

**运行结果**：

```text
True
True
```

## 3. 最佳实践

### 3.1 推荐 vs 不推荐写法对比

把逻辑运算符的高频场景做一组正反对比，便于记忆。

| 场景 | 不推荐 | 推荐 | 原因 |
|------|--------|------|------|
| 判空容器 | `if len(lst) == 0:` | `if not lst:` | 容器非空即为真，惯用 `not` 判空，更简洁 |
| 判 None | `if x == None:` 或 `if not x:` | `if x is None:` | `is` 不受 `__eq__` 干扰；`not x` 会把 0/空串都判进来 |
| 默认值（OK 用 0） | `port = port or 8080` | `port = port if port is not None else 8080` | 0 是假值会被 `or` 替换 |
| 多值等值判断 | `x == "a" or x == "b"` | `x in ("a", "b")` | `in` 可读性高，扩展容易 |
| 除零保护 | `if y / x > limit:` | `if x != 0 and y / x > limit:` | 用 `and` 短路避免除零 |
| 多余布尔比较 | `if (x > 0) == True:` | `if x > 0:` | 布尔值直接当条件 |
| 复杂优先级 | `not a or b and c` | `(not a) or (b and c)` | 显式括号避免歧义 |
| 取第一个真值 | `x = a or b or c`（正确） | 同左 | 这就是推荐写法 |
| `not x` 判 0 | `if not x:`（你想判 0） | `if x == 0:` | `not x` 还会判空串/None |

逐个看一组代码对照：

```python
# 1) 判空
data = []
if not data:            # 好
    print("空")

# 2) 判 None
x = None
if x is None:            # 好
    print("是 None")

# 3) 默认值，0 也合法
port = 0
real_port = port if port is not None else 8080   # 好，保留 0
bad_port = port or 8080                          # 坏，0 被替换
print(real_port, bad_port)
```

**运行结果**：

```text
空
是 None
0 8080
```

### 3.2 常见错误模式及修正

**错误一：用 not x 判 None**

```python
# 坏：not 0、not ''、not []、not None 都为真，语义混乱
def badge(x):
    if not x:
        return "空"
    return x
```

`badge(0)`、`badge("")`、`badge(None)` 全都返回"空"，但你可能只想判 `None`。修正：

```python
def badge(x):
    if x is None:
        return "空"
    return x
```

如果想判"`None` 或空容器"且明确不把 `0` 当空，也用更显式的写法。

**错误二：用 or 给 0 合法的默认值**

```python
# 坏：0 是假值会被替换
def get_port(config):
    return config or 8080
get_port(0)        # 期望 0，返回 8080
```

修正：

```python
def get_port(config):
    return config if config is not None else 8080
```

**错误三：优先级记错**

```python
# 期望"非 (a 或 b)"，写成 not a or b
if not a or b:           # 错，是 (not a) or b
    ...
```

修正：加括号明确意图。

```python
if not (a or b):
    ...
```

**错误四：把 not x == y 当成 (not x) == y**

```python
x = 0
# 期望 (not x) == True，写成 not x == True
print(not x == True)     # 实际是 not (x == True)，结果是 True（x==True 为 False）
```

修正：要么直接 `x != True`，要么显式 `not x and <...>`。

**错误五：漏掉短路导致带副作用的判断被悄悄执行/不执行**

```python
# 坏：把"会写日志"的判断放左边，遇到假就把日志丢了
def log_and_check(x):
    return log(x) and validate(x)   # log 返回 False 时 validate 不会执行
```

这里 `log` 失败会让 `validate` 不执行，可能不是期望行为。修正：把两个副作用拆开调用，别用短路混在一起。

### 3.3 性能与惯用法的取舍

- **短路是优化，也是契约**：不要随意在 `and`/`or` 的操作数里塞有副作用的逻辑。一旦短路，右边函数的副作用不会发生，难以排查。
- **多条件等值判断优先 `in`**：`x in (a, b, c)` 比 `x == a or x == b or x == c` 更短、更快、更不易错。
- **能链式比较就链式**：`60 <= score <= 100` 比 `score >= 60 and score <= 100` 更简洁，且 `score` 只求值一次。
- **`not` 用于判空、`is None` 用于判 `None`**：两者是不同的语义，不要混用，更不要用 `not x` 替代 `x is None`。
- **复杂逻辑表达式加括号**：可读性 > 节省字符。多人协作的代码里，把意图写清楚比让读者去背优先级重要。

## 4. 原理

### 4.1 短路求值的执行流

`and`/`or` 的求值流程可以用一张图描述，`and` 为例：

```text
求值 a and b
      │
      ▼
  求值 a
      │
  ┌───┴───┐ 假
 是 ──→ 返回 a（短路，b 不求值）┐
 真                              │
  └───┬───┘                      │
      │ 真                       │
      ▼                          │
  求值 b                          │
      │                          │
      ▼                          │
  返回 b ◄────────────────────────┘
```

`or` 镜像：

```text
求值 a or b
      │
      ▼
  求值 a
      │
  ┌───┴───┐ 真
 是 ──→ 返回 a（短路，b 不求值）┐
 假                              │
  └───┬───┘                      │
      │ 假                       │
      ▼                          │
  求值 b                          │
      │                          │
      ▼                          │
  返回 b ◄────────────────────────┘
```

这两张图同时解释了两件事：

- **短路如何实现**：第一操作数一旦能决定结果，第二操作数的字节码根本不会被生成调用。
- **为什么返回的是操作数本身**：图里"返回 a"、"返回 b"指的是返回那个对象本身，而不是再做一次布尔转换生成新对象。

**字节码视角**

用 `dis` 模块看一下 `a and b` 的字节码，能看到 `and` 是通过 `JUMP_IF_FALSE_OR_POP` 这类带条件的跳转实现的，遇到假直接跳到结尾，不求值后续。

```python
import dis
dis.dis(lambda a, b: a and b)
```

**运行结果**（字节码片段，不同 Python 版本稍有差异）：

```text
  LOAD_FAST               0 (a)
  JUMP_IF_FALSE_OR_POP    6 (to 12)
  LOAD_FAST               1 (b)
>> RETURN_VALUE
```

`JUMP_IF_FALSE_OR_POP` 的含义就是："如果栈顶（这里即 `a`）为假，跳到 12 直接返回 `a`；否则弹出 `a` 继续往下加载 `b` 再返回。"这正是执行流图的实现层面。`or` 对应的是 `JUMP_IF_TRUE_OR_POP`，镜像逻辑。

### 4.2 and/or 为何返回操作数本身

Python 选择"返回决定结果的操作数本身"，而不是"统一返回 `True`/`False`"，背后有几条考量：

```text
设计取舍
├─ 选项 A：返回 True/False
│    优点：和大多数语言直觉一致
│    缺点：丢失原对象信息（如 0『匿名』、空列表这类假值的身份）
│
└─ 选项 B：返回操作数本身（Python 的选择）
     优点：可以写出 `x = a or b` 这类默认值惯用法
     优点：能配合真值性，等价于布尔判断但保留对象
     缺点：新手容易误以为结果是 True/False
```

Python 取了选项 B，并配合"所有对象都有真值性"这条设计，让 `and`/`or` 能同时承担"逻辑判断"和"取值/取默认值"两种用途。代价是新手初次接触会困惑，但一旦理解就能写出非常简练的表达。

这也解释了"`bool(x and y)` 与 `x and y` 在 `if` 里等价"的原因：`if` 用真值性判断，而 `and` 返回的操作数正好自带真值性。`bool()` 包一层是为了拿显式的布尔对象（比如要存进列表做统计时），普通条件判断下不必包。

### 4.3 not 为何返回布尔（设计考量）

和 `and`/`or` 不同，`not` 永远返回 `True`/`False`。这个差异与 `not` 的语义有关：

```text
not 的语义：对"真值性"取反
├─ 输入：任意对象 x
├─ 第一步：用 bool(x) 得到布尔
└─ 第二步：取反得到 True / False
```

`not` 表达的是"对真值性的否定"，本质是一个一元判断，结果是布尔非常自然。如果 `not []` 返回 `[]` 而不是 `True`，语义就崩了：`[]` 是"假"的"否定"应当是"真"，而非"回到原对象"。

所以三者各司其职：

| 运算符 | 返回 | 原因 |
|--------|------|------|
| `and` / `or` | 操作数本身 | 配合真值性，既能判真假又能取值 |
| `not` | `True`/`False` | 语义就是"真值性的否定"，必须布尔 |

理解了这个设计差异，就能解释实践中的一种混淆："`not x` 判断 `None`" 看起来可行但语义不准——因为 `not` 否定的是"真值性"，而 `None`、`0`、空串、空容器有相同的"假"真值性，`not` 无法区分它们。要精确区分 `None`，必须用 `is None`，绕过真值性这条判断链。

## 5. 总结

本文围绕 Python 的逻辑运算符与短路求值展开，主要介绍了以下内容：

- 逻辑运算符共有三个：`and`（与）、`or`（或）、`not`（非）。`and` 两边都真才真，`or` 至少一边为真就真，`not` 对真值性取反；`not` 的结果永远是 `True`/`False`，而 `and`/`or` 返回的是"决定结果的操作数本身"。
- 真值性规则：`0`、`0.0`、`0j`、空容器、`None`、`False` 为假，其余为真。可以用 `bool()` 显式转换；自定义对象由 `__bool__` 决定真值，没有则退看 `__len__`，都没有默认为真。
- 短路求值：`and` 遇假即停返回那个假值，`or` 遇真即停返回那个真值，后面的表达式（含函数调用、除法、取下标）不会被求值；把"可能出错的判断"放右边、靠左边前置校验短路，是工程里非常实用的安全写法（避免除零、`IndexError` 等）。
- `and`/`or` 返回操作数本身而非 `True`/`False`，在 `if` 里因为真值性判断看起来与布尔等价；好处是支持 `x or default` 默认值惯用法和"配置层层回退"，坏处是 `0` 这类合法假值会被 `or` 默认值替换。
- 运算符优先级：`not` > `and` > `or`，且比较运算符高于 `not`；建议复杂表达式显式加括号，避免靠记忆出现 `not (a or b)` 误写成 `not a or b` 这类 bug。
- 最佳实践：判空用 `if not lst:`、判 `None` 用 `is None`、多值匹配用 `in`、除零保护用 `and` 短路、默认值需要区分 0 时用三元而不是 `or`、多余 `== True` 比较要删掉。
- 短路求值的底层是字节码中 `JUMP_IF_FALSE_OR_POP` / `JUMP_IF_TRUE_OR_POP` 这类带条件的跳转：第一操作数一旦决定结果就直接跳到返回，不求值后续，这也解释了短路为何能同时保性能与保安全。
- `and`/`or` 返回对象本身而非布尔的取舍，是 Python 兼顾"逻辑判断"与"取默认值"两种用途的设计；`not` 返回布尔是因为它的语义就是"真值性的否定"。这条设计差异决定了"`not x` 判 `None` 语义不准"——精确判 `None` 必须用 `is None`。
