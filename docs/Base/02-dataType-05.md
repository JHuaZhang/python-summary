---
group:
  title: 【02】基础数据类型和类型系统
  order: 2
order: 5
title: bool类型与短路逻辑
nav:
  title: Python基础
  order: 1
---

# bool类型与短路逻辑

## 1. 介绍

### 1.1 什么是 bool

`bool` 是 Python 中表示真值的类型，只有两个值：`True` 和 `False`。它用于条件判断（`if`）、循环控制（`while`）、逻辑运算（`and`/`or`/`not`）等场景——可以说，只要代码中有"如果……就……"的逻辑，就离不开 `bool`。

一个独特的事实是：`bool` 是 `int` 的子类。`True` 本质上就是 `1`，`False` 本质上就是 `0`。这意味着 `True + True` 等于 `2`，`sum([True, False, True])` 等于 `2`。这个设计让布尔值可以无缝参与算术运算，但也带来了一些需要警惕的陷阱。

### 1.2 最简示例

```python
# True 和 False 是关键字常量，首字母必须大写
print(True)              # True
print(type(True))        # <class 'bool'>
print(False)             # False
print(type(False))       # <class 'bool'>
```

用 `bool()` 函数可以把任意对象转换为 `True` 或 `False`：

```python
print(bool(0))           # False —— 0 为假
print(bool(42))          # True  —— 非0 为真
print(bool(""))          # False —— 空字符串为假
print(bool("hi"))        # True  —— 非空字符串为真
```

而 `and`/`or` 运算符的短路逻辑，则是 Python 布尔运算最实用也最容易被忽略的特性：

```python
# or 设默认值：name 为 None/'' 时用 "匿名"
name = None
name = name or "匿名"
print(name)              # 匿名
```

### 1.3 在 Python 类型体系中的定位

```text
Python 内置类型
├── 数值类型
│   ├── int      —— 任意精度整数
│   ├── float    —— IEEE 754 双精度浮点数
│   ├── complex  —— 复数
│   └── bool     —— 布尔值（int 的子类，True=1, False=0）
├── 序列类型
│   ├── str / list / tuple
│   └── ...
└── ...
```

`bool` 在类型层次中位于 `int` 之下——`bool` 继承自 `int`，是 Python 类型系统中唯一的"子类型"内置类型。理解这一点，是理解后面 `True + 1 == 2`、`isinstance(True, int)` 等行为的关键。

---

## 2. 核心内容

### 2.1 bool 的字面量与构造

#### 2.1.1 True 和 False 关键字

Python 3 中，`True` 和 `False` 是关键字常量，首字母必须大写：

```python
print(True)                  # True
print(type(True))            # <class 'bool'>
print(False)                 # False
print(type(False))           # <class 'bool'>
```

它们是单例对象——整个解释器中只有一个 `True` 和一个 `False`：

```python
print(True is True)          # True —— 身份比较，同一对象
a = True
b = (1 == 1)
print(a is b)                # True —— 所有 True 引用同一对象
```

因为是关键字，所以不能被赋值：

```python
# True = 1    # SyntaxError: cannot assign to True
```

#### 2.1.2 bool() 构造函数

`bool()` 接受任意对象作为参数，返回 `True` 或 `False`。其转换规则就是"真值测试"——将在下一节详细讲解。

```python
# 数字
print(bool(0))               # False —— 0 为假
print(bool(42))              # True  —— 非0 为真
print(bool(0.0))             # False —— 0.0 为假
print(bool(-1))              # True  —— 负数也真（非0即真）

# 字符串
print(bool(""))              # False —— 空字符串为假
print(bool("hi"))            # True  —— 非空字符串为真

# 容器
print(bool([]))              # False —— 空列表为假
print(bool([0]))             # True  —— 非空列表为真（哪怕元素是 0）
print(bool({}))              # False —— 空字典为假

# 特殊值
print(bool(None))            # False
print(bool(object()))        # True  —— 自定义对象默认为真
```

**关键点**：`bool([0])` 返回 `True`，因为列表非空。元素是什么不影响真值——只有"空"与"非空"之分。

#### 2.1.3 bool 是 int 的子类

这是 `bool` 最特殊的属性：

```python
print(True == 1)             # True
print(False == 0)            # True
print(isinstance(True, int)) # True
print(issubclass(bool, int)) # True
print(bool.__mro__)          # (<class 'bool'>, <class 'int'>, <class 'object'>)
```

方法解析顺序（MRO）显示 `bool` → `int` → `object`。`bool` 继承了 `int` 的所有算术能力，只是重写了 `__repr__` 和 `__str__` 把显示改成了 `True`/`False`。这个特性会在 2.8 节详细展开。

---

### 2.2 真值测试规则

真值测试（truth testing）是 Python 布尔体系的核心：当你写 `if x:`，Python 内部调用的是 `bool(x)`，而 `bool(x)` 的行为取决于 `x` 的类型和值。

#### 2.2.1 假值（falsy）完整清单

Python 中只有以下对象被视为 `False`，其他一切都是 `True`：

```python
# 布尔值
print(bool(False))           # False

# None
print(bool(None))            # False

# 数值零 —— int / float / complex
print(bool(0))               # False
print(bool(0.0))             # False
print(bool(0j))              # False

# 空序列 —— str / list / tuple
print(bool(''))              # False
print(bool([]))              # False
print(bool(()))              # False

# 空映射 —— dict
print(bool({}))              # False

# 空集合 —— set / frozenset
print(bool(set()))           # False
```

**记忆口诀**：`False`、`None`、所有类型的"零"（0、0.0、0j）、所有"空"容器（""、[]、{}、()、set()）——这就是全部假值。

#### 2.2.2 真值（truthy）示例

任何不在上面清单中的对象都是真值：

```python
print(bool(1))               # True
print(bool(-1))              # True  —— 负数也真（非0即真）
print(bool(0.001))           # True
print(bool('hello'))         # True  —— 非空字符串
print(bool([0]))             # True! —— 非空列表，哪怕元素是 0
print(bool([False]))         # True! —— 非空，哪怕元素是 False
print(bool({'a': 0}))        # True  —— 非空字典
```

**易错点**：`[0]` 和 `[False]` 是真值——容器只看"空不空"，不看"里面是什么"。

#### 2.2.3 判空惯用法

Python 鼓励直接用真值测试来判空，而不是 `len(x) > 0`：

```python
# 推荐：直接 if items
def process(items):
    if items:
        return f"处理 {len(items)} 项"
    return "无数据"

print(process([1, 2, 3]))    # 处理 3 项
print(process([]))           # 无数据

# 不推荐：if len(items) > 0
# if len(items) > 0:   # 啰嗦，不够 Pythonic
#     ...
```

同样的模式适用于字符串、字典、集合等所有容器。

**处理 None 和空值合一的场景**：

```python
def greet(name=None):
    if not name:             # name 是 None 或 '' 都为假
        name = "陌生人"
    return f"Hello, {name}"

print(greet(None))           # Hello, 陌生人
print(greet(""))             # Hello, 陌生人
print(greet("Alice"))        # Hello, Alice
```

**注意事项**：`not name` 会把 `None`、`""`、`0`、`[]` 都视为"没有名字"。如果你只想替换 `None` 而保留空串，需要用 `if name is None`：

```python
name = ""
name = name if name is not None else "匿名"   # 仅 None 替换，空串保留
print(name)   # 空串被保留
```

#### 2.2.4 __bool__ 与 __len__ 机制

对于自定义对象，Python 按以下优先级决定真值：

1. 先调用 `__bool__()` 方法，返回 `True` 或 `False`
2. 如果没有 `__bool__`，调用 `__len__()`，返回 0 则为 `False`，非 0 则为 `True`
3. 如果两者都没有，默认为 `True`

```python
# 自定义对象默认为真
class Empty:
    pass
print(bool(Empty()))         # True —— 无 __bool__/__len__，默认真

# 定义 __bool__ 自定义真值
class Box:
    def __init__(self, items):
        self.items = items
    def __bool__(self):
        return len(self.items) > 0

print(bool(Box([])))         # False —— __bool__ 返回 False
print(bool(Box([1])))        # True
```

**__bool__ 优先于 __len__**：

```python
class Both:
    def __bool__(self):
        print("  __bool__ called")
        return False
    def __len__(self):
        print("  __len__ called")
        return 10

print(bool(Both()))          # False —— __bool__ 优先，__len__ 未调用
```

**__bool__ 必须返回 bool 类型**：

```python
class Bad:
    def __bool__(self):
        return 1           # 错！必须返回 bool

try:
    bool(Bad())
except TypeError as e:
    print(f"TypeError: {e}")
```

---

### 2.3 and 运算符

`and` 是 Python 的逻辑与运算符。它的行为与 C/Java 中的 `&&` 类似，但有一个关键区别：**and 返回的是操作数本身，而不是布尔值**。

#### 2.3.1 基本行为与返回值

`and` 的求值规则：如果第一个操作数为假（falsy），直接返回它（短路）；如果为真（truthy），返回第二个操作数。

```python
print(0 and 5)               # 0    —— 0 为假，短路返回 0，5 未被评估
print(3 and 5)               # 5    —— 3 为真，返回 5
print(3 and 0)               # 0    —— 3 为真，返回 0
print(3 and 5 and 7)         # 7    —— 多个 and，全真返回最后一个
print(0 and 5 and 7)         # 0    —— 遇到第一个假短路，返回 0
```

**关键理解**：`and` 不一定返回 `True`/`False`，它返回的是"决定结果的操作数"。`3 and 5` 返回 `5`（int 类型），不是 `True`。

#### 2.3.2 短路求值

`and` 的短路意味着：如果第一个操作数为假，第二个操作数**根本不会被评估**。这在避免副作用和昂贵计算时非常有用：

```python
def expensive_check():
    print("  昂贵检查执行了")
    return True

cheap = False
if cheap and expensive_check():   # cheap 为 False 短路，expensive 不执行
    print("通过")
print("昂贵检查未执行（短路）")
```

**运行结果**：

```text
昂贵检查未执行（短路）
```

`expensive_check()` 没有被调用——`cheap` 为 `False`，`and` 直接短路了。

#### 2.3.3 and 的惯用法

**安全访问**：先判 None 再调方法，避免 `AttributeError`：

```python
obj = None
result = obj and obj.method()    # None 为假短路，返回 None
print(result)                    # None，安全
```

**注意事项**：空容器 `{}`、`[]`、`''` 也为假，会误短路：

```python
empty_cfg = {}
val = empty_cfg and empty_cfg.get("key")   # {} 为假，短路返回 {}
print(val)                                 # {} —— 不是 get 结果，是空 dict 本身
```

如果只想对 `None` 做保护，应该用 `if obj is not None and obj.method()`。

---

### 2.4 or 运算符

`or` 是逻辑或运算符，同样返回操作数本身而非布尔值。

#### 2.4.1 基本行为与返回值

`or` 的求值规则：如果第一个操作数为真（truthy），直接返回它（短路）；如果为假（falsy），返回第二个操作数。

```python
print(3 or 5)                # 3    —— 3 为真，短路返回 3，5 未被评估
print(0 or 5)                # 5    —— 0 为假，返回 5
print(0 or '' or 7)          # 7    —— 多个 or，前两个假，返回第一个真
print(3 or 0 or 5)           # 3    —— 遇到第一个真短路，返回 3
```

**与 and 对称**：`and` 在遇到"假"时短路，`or` 在遇到"真"时短路。

#### 2.4.2 返回操作数本身

```python
print('' or 'default')       # 'default' —— 返回字符串，不是 True
print('x' or 'default')      # 'x'
print(0 or None)             # None      —— 0 为假，返回 None
print(1 and 'hello')         # 'hello'   —— 1 为真，返回 'hello'
```

这说明 `and`/`or` 本质上是"选择器"——从操作数中选一个返回，而不是做布尔运算。

#### 2.4.3 or 的惯用法：设默认值

这是 `or` 最常见的使用场景：

```python
def greet(name):
    name = name or "陌生人"    # name 为 None/'' 时用默认
    return f"Hello, {name}"

print(greet(None))           # Hello, 陌生人
print(greet(""))             # Hello, 陌生人（'' 也为假，被替换）
print(greet("Alice"))        # Hello, Alice
```

**注意陷阱**：`or` 会把所有 falsy 值都替换掉。如果你只想替换 `None` 而```保留空串、0 等，要用 `if ... is not None`。

---

### 2.5 not 运算符

`not` 是一元取反运算符。与 `and`/`or` 不同，`not` **始终返回真正的 `bool` 类型**（`True` 或 `False`）。

#### 2.5.1 基本行为

```python
print(not True)              # False
print(not False)             # True
print(not 0)                 # True  —— 0 为假，not 0 为真
print(not 1)                 # False —— 1 为真
print(not [])                # True  —— 空列表为假
print(not "")                # True  —— 空串为假
print(not [0])               # False —— 非空列表为真
```

验证 `not` 返回 `bool` 类型：

```python
print(type(not 0))           # <class 'bool'>
print(type(not True))        # <class 'bool'>
```

对比 `and`/`or` 返回操作数本身，`not` 一定返回 `bool`——这是因为 `not` 语义上是"取反"，只有 `True`/`False` 能表达这个含义。

#### 2.5.2 not 的优先级

`not` 的优先级高于 `and` 和 `or`，但低于比较运算符：

```python
print(not True or False)     # False —— (not True) or False = False or False
print(not (True or False))   # False —— 括号先算 or 得 True，not 得 False
print(not 1 == 1)            # False —— 1==1 先算得 True，not 得 False
print(True and not False)    # True  —— not False 得 True，True and True
```

运算符优先级从高到低：

```text
比较运算符（== != < > <= >=）> not > and > or
```

#### 2.5.3 not 的常见用法

```python
# 判空
items = []
if not items:
    print("无数据")           # 无数据

# 判不存在
d = {"a": 1}
if "b" not in d:
    d["b"] = 0
    print(f"添加 b: {d}")     # 添加 b: {'a': 1, 'b': 0}

# 取反布尔变量
done = False
if not done:
    print("未完成")           # 未完成
```

**避免 not 与比较运算符混排**：

```python
# 不推荐：if not x == y（容易读错）
# 推荐：if x != y 或 if not (x == y)
x, y = 1, 2
if x != y:
    print("x 不等于 y")       # x 不等于 y
```

---

### 2.6 比较运算符

比较运算符是生成 `bool` 值的主要来源之一。

#### 2.6.1 基本比较

```python
print(3 > 2)                 # True
print(3 == 3)                # True
print(3 != 4)                # True
print(3 <= 3)                # True
print('a' in 'abc')          # True
print('x' not in 'abc')      # True
print([1, 2] == [1, 2])      # True —— 值相等
```

#### 2.6.2 链式比较（Python 独有特性）

Python 允许将多个比较运算符串联在一起，语义上等价于用 `and` 连接，但每个操作数只被评估一次：

```python
x = 5
print(1 < x < 10)            # True  —— 等价 1 < x and x < 10，但只评估 x 一次
print(1 < x < 3)             # False
print(0 <= x < 100)          # True
print(1 < x != 5)            # True  —— x>1 且 x!=5
print(1 == 1 == 1)           # True
```

**链式比较 vs 传统写法**：

```python
print(1 < x and x < 10)      # True  —— 等价但评估 x 两次
```

链式比较更简洁，且对有副作用的表达式更安全（只评估一次）。

#### 2.6.3 不同类型的比较

```python
# 数字按值比较
print(3 < 5)                 # True

# 字符串按字典序比较
print('a' < 'b')             # True
print('abc' < 'abd')         # True

# 列表/元组逐元素比较
print([1, 2] < [1, 3])       # True
print((1, 2) < (1, 3))       # True
```

**Python 3 禁止数字与字符串直接比较**：

```python
try:
    3 < '5'
except TypeError as e:
    print(f"TypeError: {e}")
```

Python 2 中 `'3' > 2` 是合法的（结果不可预测），Python 3 修复了这个设计缺陷，直接报 `TypeError`。

---

### 2.7 == 与 is

`==` 和 `is` 是 Python 中两个最容易混淆的比较方式。

#### 2.7.1 == 比较值，is 比较身份

```python
a = [1, 2]
b = [1, 2]
print(a == b)                # True  —— 值相等
print(a is b)                # False —— 不是同一对象
print(id(a) == id(b))        # False —— 不同内存地址

c = a
print(a is c)                # True  —— c 和 a 指向同一对象
```

**决策规则**：

| 场景 | 使用 | 原因 |
|------|------|------|
| 判值相等 | `==` | 比较内容是否相同 |
| 判是否同一对象 | `is` | 比较内存地址是否相同 |
| 判 None | `is None` / `is not None` | None 是单例，规范写法 |
| 判 True/False | `is True` / `is False` | 单例，但通常直接 `if x:` |
| 比数字/字符串值 | `==` | 绝不用 `is` |

#### 2.7.2 判 None 用 is

```python
n = None
print(n is None)             # True
print(n is not None)         # False
```

这是 Python 官方推荐写法（PEP 8），因为 `None` 是单例，`is` 比 `==` 更高效也更安全。

#### 2.7.3 小整数缓存陷阱

Python 缓存了 `-5` 到 `256` 的小整数，这些整数在整个解释器中只有一个实例。这会导致 `is` 在某些情况下"碰巧"可用，但在大整数上失效：

```python
x1 = 256
x2 = 256
print(x1 is x2)              # True —— 256 在缓存范围（-5~256），同一对象

x3 = 1000000
x4 = 1000000
print(x3 is x4)              # 不保证 True —— 大整数未必缓存

# 值相等永远用 ==，不用 is
print(x3 == x4)              # True —— 始终可靠
```

**教训**：比较数值永远用 `==`，不要用 `is`——小整数缓存只是 CPython 的实现细节，不是语言规范保证的行为。

---

### 2.8 bool 是 int 的子类

#### 2.8.1 bool 继承链

```python
print(True == 1)             # True
print(False == 0)            # True
print(isinstance(True, int)) # True
print(issubclass(bool, int)) # True
print(bool.__mro__)          # (<class 'bool'>, <class 'int'>, <class 'object'>)
```

`bool` 在内部其实就是 `int`——`True` 的 `int` 值是 `1`，`False` 是 `0`。`bool` 只重写了 `__repr__`/`__str__` 让显示变成 `True`/`False`，算术运算完全继承自 `int`。

#### 2.8.2 bool 参与算术

```python
print(True + True)                  # 2
print(True + False)                 # 1
print(True * 5)                     # 5
print(False * 100)                  # 0
print(sum([True, True, False, True]))  # 3
```

算术运算会把 `bool` 提升为 `int`：

```python
print(True + 1)                     # 2
print(type(True + 1))               # <class 'int'> —— 结果是 int 不是 bool
print(True + 1.0)                   # 2.0 —— 进一步提升为 float
```

#### 2.8.3 惯用法：sum 统计满足条件的项数

利用 `True` 就是 `1` 的特性，可以用 `sum` 快速统计满足条件的元素个数：

```python
nums = [1, 2, 3, 4, 5, 6, 7, 8]

# 利用 bool 即 int（True 当 1 求和）
even_count = sum(n % 2 == 0 for n in nums)
print(f"偶数个数: {even_count}")   # 4

# 显式写法（可读性更好）
even_count2 = sum(1 for n in nums if n % 2 == 0)
print(f"偶数个数: {even_count2}")  # 4

# 统计合格人数
scores = [85, 90, 55, 78, 92]
pass_count = sum(score >= 60 for score in scores)
print(f"合格人数: {pass_count}")   # 4
```

两种写法等价，第二种 `sum(1 for ... if ...)` 更显式，推荐在团队项目中使用。

#### 2.8.4 bool 做索引（不推荐）

因为 `True == 1`、`False == 0`，`bool` 可以直接做列表索引——但这极易出错：

```python
lst = ['a', 'b', 'c']
print(lst[True])              # 'b' —— True 当 1
print(lst[False])             # 'a' —— False 当 0
```

**不要这么写**——用 `lst[1]` 或 `lst[0]` 远比 `lst[True]` / `lst[False]` 清晰。

#### 2.8.5 isinstance 陷阱

`isinstance(True, int)` 返回 `True`，因为 `bool` 是 `int` 的子类。在需要区分 `bool` 和 `int` 的场景中，必须先检查 `bool`：

```python
val = True

# 正确：先判 bool 短路
if isinstance(val, bool):
    print(f"是 bool: {val}")
elif isinstance(val, int):
    print(f"是 int: {val}")
```

**运行结果**：

```text
是 bool: True
```

如果先判 `int`，`True` 会被错误归类为 `int`。

---

## 3. 最佳实践

### 3.1 条件判断的推荐写法

| 场景 | 不推荐 | 推荐 | 原因 |
|------|--------|------|------|
| 判空 | `if len(items) > 0:` | `if items:` | Pythonic，适用所有容器 |
| 判 None | `if x == None:` | `if x is None:` | PEP 8 规范，None 是单例 |
| 判非 None | `if x != None:` | `if x is not None:` | PEP 8 规范 |
| 判布尜值 | `if flag == True:` | `if flag:` | 简洁，避免多余比较 |
| 判布爮假 | `if flag == False:` | `if not flag:` | 简洁，避免多余比较 |
| 判字符串非空 | `if len(s) > 0:` | `if s:` | 统一的真值测试 |
| 判集合非空 | `if len(d) > 0:` | `if d:` | 统一的真值测试 |

### 3.2 and/or 惯用法的推荐与不推荐

**推荐**：用 `or` 设默认值，但注意 falsy 值的陷阱：

```python
# 推荐：简单场景下用 or 设默认值
name = input_name or "匿名"

# 不推荐：需要区分 None 和空串时用 or
value = data or "default"   # 0、''、[] 都会被替换！

# 推荐：需要精确控制时用条件表达式
value = data if data is not None else "default"
```

**推荐**：用 `and` 做安全访问，但注意空容器陷阱：

```python
# 推荐：对 None 做保护
if obj is not None and obj.ready():
    process(obj)

# 不推荐：用 and 对空容器做保护（空容器会短路）
result = cfg and cfg.get("key")   # cfg={} 时短路返回 {}，不是 get 结果
```

### 3.3 三目运算符优先于 and/or 模拟

在需要"二选一"时，用条件表达式（三目运算符）而非 `and/or` 拼凑：

```python
# 推荐：条件表达式（清晰）
age = 20
status = "成年" if age >= 18 else "未成年"
print(status)               # 成年

# 不推荐：and/or 模拟三目（容易理解错）
# status = age >= 18 and "成年" or "未成年"  # 虽然能用但不推荐
```

### 3.4 常见错误模式

| 错误模式 | 后果 | 修正方式 |
|---------|------|---------|
| `if x == None:` | 可能触发 `__eq__` 副作用 | `if x is None:` |
| `if len(lst) > 0:` | 啰嗦，非 Pythonic | `if lst:` |
| `isinstance(True, int)` 先判 int | `True` 被误判为 int | 先判 `bool` |
| `lst[True]` 做索引 | 极易读错 | `lst[1]` |
| `x = a or b` 当 a=0 时 | `0` 被误替换 | `x = a if a is not None else b` |
| `not x == y` | 优先级歧义 | `x != y` |
| `is` 比较大整数 | 缓存范围外不可靠 | `==` |
| `if flag == True:` | 多余比较 | `if flag:` |

---

## 4. 原理：短路逻辑与布尔运算的字节码

### 4.1 and 的字节码：JUMP_IF_FALSE_OR_POP

`and` 的短路行为在字节码层面体现为条件跳转指令：

```python
import dis
dis.dis(compile("a and b", "", "eval"))
```

**运行结果**：

```text
  0 LOAD_NAME                0 (a)
  2 JUMP_IF_FALSE_OR_POP    10
  4 LOAD_NAME                1 (b)
  6 RETURN_VALUE
      ...
```

`JUMP_IF_FALSE_OR_POP` 的含义：看栈顶（`a`）——如果为假，保留 `a` 在栈上并跳到结束（短路返回 `a`）；如果为真，弹出 `a`（POP），继续加载 `b`。

### 4.2 or 的字节码：JUMP_IF_TRUE_OR_POP

```python
dis.dis(compile("a or b", "", "eval"))
```

**运行结果**：

```text
  0 LOAD_NAME                0 (a)
  2 JUMP_IF_TRUE_OR_POP     10
  4 LOAD_NAME                1 (b)
  6 RETURN_VALUE
      ...
```

`JUMP_IF_TRUE_OR_POP` 是 `and` 的镜像：栈顶为真时保留并跳转（短路返回 `a`）；为假时弹出并加载 `b`。

这两条指令解释了为什么 `and`/`or` 返回操作数本身而非布尔值——它们只是在栈上选择保留或弹出，没有做任何布尔转换。

### 4.3 not 的字节码：UNARY_NOT

```python
dis.dis(compile("not x", "", "eval"))
```

**运行结果**：

```text
  0 LOAD_NAME                0 (x)
  2 UNARY_NOT
  4 RETURN_VALUE
```

`UNARY_NOT` 对栈顶值做真值测试后取反，结果恒为 `bool`。这就是 `not` 始终返回 `True`/`False` 的底层原因。

### 4.4 链式比较的字节码：DUP_TOP

```python
dis.dis(compile("a < b < c", "", "eval"))
```

链式比较使用 `DUP_TOP` 指令复制中间操作数（`b`），让两次比较共享同一个 `b` 值。这解释了为什么链式比 `a < b and b < c` 更高效——`b` 只被评估一次。

### 4.5 True/False 在字节码中的表示

`True` 和 `False` 在字节码中是 `LOAD_CONST` 指令加载的常量，不需要查找名字空间：

```python
dis.dis(compile("x = True", "", "exec"))
```

`True` 直接作为常量加载（`LOAD_CONST True`），而不是作为变量名查找（`LOAD_NAME`），这保证了 `True`/`False` 的高效访问和不可赋值特性。

---

## 5. 总结

本文围绕 `bool` 类型与短路逻辑展开，主要介绍了以下内容：

- `bool` 的字面量写法（`True`/`False` 关键字、`bool()` 构造函数）及其作为 `int` 子类的特殊身份
- 真值测试规则：完整的假值清单（`False`、`None`、数值零、空容器）、`__bool__`/`__len__` 的优先级机制、判空惯用法
- `and` 运算符的返回值规则（假则返回第一个操作数，真则返回第二个）和短路求值机制
- `or` 运算符的返回值规则（真则返回第一个操作数，假则返回第二个）和设默认值的惯用法
- `not` 运算符的特殊性（始终返回 `bool` 类型）及其优先级关系
- 比较运算符和链式比较（Python 独有的 `a < b < c` 写法）
- `==` 与 `is` 的区别：`==` 比较值、`is` 比较身份、判 `None` 用 `is`、小整数缓存陷阱
- `bool` 作为 `int` 子类的实际影响：参与算术运算、`sum` 统计惯用法、`isinstance` 陷阱
- 条件判断的推荐写法（`if x:` 优于 `if len(x) > 0:`、`if x is None:` 优于 `if x == None:`）
- `and`/`or`/`not` 的字节码实现：`JUMP_IF_FALSE_OR_POP`、`JUMP_IF_TRUE_OR_POP`、`UNARY_NOT` 指令如何实现短路和返回操作数本身
