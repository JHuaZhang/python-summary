---
group:
  title: 【09】条件分支
  order: 9
order: 2
title: 布尔值与真值测试
nav:
  title: Python基础
  order: 1
---

# 布尔值与真值测试

## 1. 介绍

### 1.1 什么是布尔值与真值测试

布尔值（`bool`）是 Python 中最简单的内置类型之一，只有两个取值：`True` 和 `False`。它来自英国数学家 George Boole 的名字——布尔代数，是计算机科学中条件分支、逻辑推理和状态表示的基础。

真值测试（Truth Value Testing）则是 Python 中将**任意对象**判定为"真"或"假"的一套统一规则。你在 `if` 语句后面放的不一定是 `True` 或 `False`——可以放数字、字符串、列表、甚至自定义对象，Python 都会按同一套规则告诉你结果是"真"还是"假"。

你可以把布尔值想象为计算机的"是/否"开关：一个布尔变量要么表示"开"（`True`），要么表示"关"（`False`）。而真值测试则回答了"任何东西放到 `if` 后面时，Python 怎么看它"。

### 1.2 最简示例

```python
# 布尔值本身就是 True / False
print(bool(1))       # True
print(bool(0))       # False

# 真值测试：任何对象放到 if 后面都会被自动判真假
name = ""
if name:
    print(f"用户名：{name}")
else:
    print("用户名为空")   # 这一行会执行，因为空字符串为假
```

**运行结果**：

```text
True
False
用户名为空
```

这三个例子揭示了本篇的核心：`bool` 类型有 `True`/`False` 两个值，而真值测试让 `if` 语句可以接受任何类型的表达式——你不需要写 `if name == ""`，直接写 `if name` 就够了。

---

## 2. 核心内容

### 2.1 `bool` 类型与两个布尔常量

`bool` 是 Python 内置的布尔类型，只有两个实例：`True` 和 `False`。这两个名字不是普通变量——它们是 Python 3 中的**关键字**，你不能对它们赋值，这和其他内置类型有本质区别。

```python
# True / False 是 bool 类型的唯一实例
print(type(True))   # <class 'bool'>
print(type(False))  # <class 'bool'>

# 它们是关键字，不能赋值——执行下面这行会直接触发 SyntaxError
# True = 1   # SyntaxError: cannot assign to True
```

#### 2.1.1 `bool` 是 `int` 的子类

一个容易被忽视但经常踩坑的细节：`bool` 继承自 `int`。这意味着 `True` 在数值上等于 `1`，`False` 在数值上等于 `0`，它们可以直接参与算术运算。

```python
# bool 是 int 的子类
print(isinstance(True, int))   # True
print(isinstance(False, int))  # True

# 布尔值可直接参与算术运算
print(True + True)             # 2
print(True * 10)               # 10
print(False + 5)               # 5

# 一个实用场景：统计列表中 True 的个数
votes = [True, False, True, True, False]
print(sum(votes))              # 3——快速统计赞同票数
```

**关键点**：`True == 1` 和 `False == 0` 成立，但 `True is 1` 不成立。`True` 是 `bool` 的实例，`1` 是 `int` 的实例，它们的身份不同。不过日常编码中几乎不需要用到 `is` 来区分它们——`==` 比较足够。

#### 2.1.2 创建布尔值的几种方式

布尔值的来源不只是直接写 `True` 和 `False`：

| 来源 | 示例 | 说明 |
|------|------|------|
| 字面量 | `flag = True` | 直接写出 |
| 比较运算 | `3 > 2` → `True` | 所有比较运算的结果都是 `bool` |
| `bool()` 转换 | `bool("hello")` → `True` | 把任意对象转为布尔值 |
| 逻辑运算 | `not 0` → `True` | `not` 总是返回 `bool` |

```python
# 三种常见来源
a = True                  # 直接字面量
b = 3 > 2                 # 比较运算结果
c = bool("hello")         # bool() 构造函数

print(a, b, c)            # True True True
```

---

### 2.2 `bool()` 函数与类型转换

`bool(x=False)` 是布尔类型的内置构造函数。调用它时本质上是针对参数 `x` 做真值测试，然后返回 `True` 或 `False`。

**签名**：`bool(x=False)`——不传参数时等同于 `bool(False)`，返回 `False`。

#### 2.2.1 数值类型转布尔

规则非常简洁：**`0` 值为假，非 `0` 值为真**。这条规则适用于 `int`、`float`、`complex` 等所有数值类型。

```python
# 0 = 假，非 0 = 真（包括负数和小浮点数）
for n in [0, 1, -1, 0.0, 0.5, -3.14, 0j, 5j]:
    print(f"bool({n!r:8}) = {bool(n)}")
```

**运行结果**：

```text
bool(0       ) = False
bool(1       ) = True
bool(-1      ) = True
bool(0.0     ) = False
bool(0.5     ) = True
bool(-3.14   ) = True
bool(0j      ) = False
bool(5j      ) = True
```

注意：`0.0` 和 `-0.0` 都是 `False`，因为它们在数值上等于 0。负数并不特殊——`-1` 是真值。

#### 2.2.2 字符串转布尔

**空字符串为假，任何非空字符串都为真**——哪怕字符串内容是 `"False"` 或 `"0"`。`bool()` 只检查字符串的"长度是否为零"，不会去解析内容。

```python
# 只有空串为假
for s in ["", " ", "False", "0", "None", "hello"]:
    print(f"bool({s!r:8}) = {bool(s)}")
```

**运行结果**：

```text
bool(''      ) = False
bool(' '     ) = True
bool('False' ) = True
bool('0'     ) = True
bool('None'  ) = True
bool('hello' ) = True
```

**关键点**：`bool("False")` 是 `True`，因为它是一个非空字符串，内容并不会被解析成布尔值。同理，`bool("0")` 也是 `True`。这是很多初学者容易踩的坑——总以为字符串内容会参与判定，但实际上只有"空与否"这条规则。

#### 2.2.3 容器转布尔

所有容器类型遵循同一规则：**空容器为假，有元素即为真**。即使元素本身是假值（如 `None`、空串、0），只要容器里有一个元素，真值测试就返回 `True`。

```python
# 空容器 → False，非空容器 → True（不管元素是什么）
containers = [
    [], [0], [""], [None], [[]],
    {}, {"k": None}, set(), {0}, (),
    (0,), "", "0",
]
for c in containers:
    print(f"  bool({c!r:14}) = {bool(c)}")
```

**运行结果**：

```text
  bool([]           ) = False
  bool([0]          ) = True
  bool(['']         ) = True
  bool([None]       ) = True
  bool([[]]         ) = True
  bool({}           ) = False
  bool({'k': None}  ) = True
  bool(set()        ) = False
  bool({0}          ) = True
  bool(()           ) = False
  bool((0,)         ) = True
  bool(''           ) = False
  bool('0'          ) = True
```

#### 2.2.4 `None` 转布尔

`None` 代表"没有值"，真值测试恒为 `False`。

```python
print(bool(None))  # False
```

---

### 2.3 真值与假值规则

真值测试是 Python 中**所有条件判断的底层基础**。当你写 `if obj:` 时，Python 内部会调用 `bool(obj)`——等同于对 `obj` 做真值测试。

#### 2.3.1 完整的假值清单

Python 官方定义了一个明确的"假值"列表。以下对象在真值测试中恒为 `False`，其余一切对象默认为 `True`：

| 假值 | 类型 | 说明 |
|------|------|------|
| `None` | `NoneType` | 空值 |
| `False` | `bool` | 布尔假 |
| `0` | `int` | 整数零 |
| `0.0` | `float` | 浮点零（含 `-0.0`） |
| `0j` | `complex` | 复数零 |
| `""` | `str` | 空字符串 |
| `[]` | `list` | 空列表 |
| `()` | `tuple` | 空元组 |
| `{}` | `dict` | 空字典 |
| `set()` | `set` | 空集合 |
| `frozenset()` | `frozenset` | 空不可变集合 |
| `range(0)` | `range` | 空 range |

```python
# 逐一验证假值清单
falsy = [
    None, False, 0, 0.0, 0j, "", [], (), {}, set(), frozenset(), range(0)
]
for v in falsy:
    assert bool(v) is False, f"{v!r} 应为假值"
print("全部假值验证通过")
```

#### 2.3.2 一切非空 / 非 0 对象为真

除了上述假值之外，其余所有对象在真值测试中都为 `True`——即使它们"看起来像空的"。

```python
# 这些看起来"包含假值"的容器，本身是真值
truthy = [
    [0],          # 列表中有一个 0——但列表非空
    [""],         # 列表中有一个空串——但列表非空
    [None],       # 列表中有一个 None——但列表非空
    {"k": ""},    # 字典的值为空串——但字典非空
    {0},          # 集合含 0——但集合非空
]
for v in truthy:
    print(f"bool({v!r:14}) = {bool(v)}")
```

**运行结果**：

```text
bool([0]          ) = True
bool(['']         ) = True
bool([None]       ) = True
bool({'k': ''}    ) = True
bool({0}          ) = True
```

**关键点**：真值测试判断的是"对象自身是否为空"，不是"对象内部是否包含假值"。一个装着 `None` 的非空列表是真值，因为列表本身有元素。

#### 2.3.3 实用理解：把真值测试当作"是否有内容"

你可以把真值测试简化为一个直觉：**"这个对象有没有'东西'"**。

- 数字有非零的内容 → 真
- 字符串有至少一个字符 → 真
- 容器有至少一个元素 → 真
- `None` 代表"不存在" → 假

这个直觉覆盖了绝大多数场景。

---

### 2.4 逻辑运算符与短路求值

Python 的逻辑运算符有三个：`not`、`and`、`or`。它们的优先级从高到低是：`not` > `and` > `or`。

它们有一个区别于很多语言的关键特征：`and` 和 `or` **返回的是参与运算的操作数本身**，并不强制返回 `bool`。这种设计天然支持短路求值。

#### 2.4.1 `not`：恒返回布尔值

`not` 先对操作数做真值测试，然后取反。结果一定是 `True` 或 `False`。

```python
# not 永远返回 bool
print(not True)    # False
print(not False)   # True
print(not 0)       # True
print(not "x")     # False
print(not [])      # True
```

#### 2.4.2 `and`：返回第一个假或最后一个真

`and` 的求值逻辑是：从左到右逐项检查，遇到第一个假值就**立即返回该值**；如果所有值都为真，**返回最后一个值**。

```python
# and：左真返回右，左假短路返回左
print("a" and "b")          # 'b'  ← 左真，返回右
print("" and "b")           # ''   ← 左假，短路返回左
print([1] and [2])          # [2]  ← 左真，返回右
print(0 and "never")        # 0    ← 左假，右不会求值
```

用真值表理解：

| 左操作数 | `and` 返回 | 原因 |
|---------|-----------|------|
| 真 | 右操作数 | 需要右来决定整体结果 |
| 假 | 左操作数 | 已经确定为假，短路 |

#### 2.4.3 `or`：返回第一个真或最后一个假

`or` 的求值逻辑与 `and` 对称：从左到右逐项检查，遇到第一个真值就**立即返回该值**；如果所有值都为假，**返回最后一个值**。

```python
# or：左真短路返回左，左假返回右
print("a" or "b")           # 'a'  ← 左真，短路返回左
print("" or "b")            # 'b'  ← 左假，返回右
print(0 or "default")       # 'default'
print(None or 0)            # 0  ← 左假，返回右（0 本身也是假，但 or 只看左）
```

| 左操作数 | `or` 返回 | 原因 |
|---------|----------|------|
| 真 | 左操作数 | 已经确定为真，短路 |
| 假 | 右操作数 | 需要右来决定整体结果 |

#### 2.4.4 短路求值的实际验证

短路意味着：右侧表达式可能完全不会被求值。用带副作用的函数可以直观验证：

```python
side_effect = []

def record(msg):
    side_effect.append(msg)
    return msg

# and：左边为假 → 右边不执行
side_effect.clear()
result = [] and record("右侧被执行")
print(f"[] and record(...) → result={result!r}, 副作用={side_effect}")
# 输出：result=[], 副作用=[]  ← record 没被调用

# or：左边为真 → 右边不执行
side_effect.clear()
result = [1] or record("右侧被执行")
print(f"[1] or record(...) → result={result!r}, 副作用={side_effect}")
# 输出：result=[1], 副作用=[]  ← record 没被调用
```

#### 2.4.5 利用短路求值的惯用法

Python 社区广泛使用短路求值来写简洁但意图清晰的代码：

**惯用法一：提供默认值**。用 `or` 在变量为空时回退到默认值。

```python
user_nickname = ""                     # 用户没填昵称
display_name = user_nickname or "匿名用户"
print(display_name)                    # 匿名用户

config = None
timeout = config or 30                 # config 为空时回退到 30
print(timeout)                         # 30
```

**惯用法二：安全链式取值**。用 `and` 在容器非空时才取元素，避免空列表越界。

```python
def safe_first(items):
    """安全地获取列表第一个元素，items 为空时返回 None"""
    return items and items[0]

print(safe_first([10, 20]))   # 10
print(safe_first([]))         # None——不会报 IndexError
```

**惯用法三：逐层判空取属性**。用 `and` 链式判空，避免 `NoneType` 属性访问报错。

```python
def get_user_city(data):
    return data and data.get("address") and data["address"].get("city")

print(get_user_city(None))                         # None
print(get_user_city({"address": {"city": "杭州"}})) # 杭州
```

#### 2.4.6 优先级与可读性

`not > and > or` 的优先级在高密度表达式中容易让人迷惑。建议：组合 `not`/`and`/`or` 时**显式加括号**，让意图一目了然。

```python
# 不加括号——依赖于优先级记忆
result = True or True and False    # True（等价于 True or (True and False)）

# 加括号——意图清晰，不需要想优先级
result = (True or True) and False  # False
```

---

### 2.5 自定义对象的真值

默认情况下，任何自定义类的实例真值测试都为 `True`。要让自定义对象像内置容器一样"按内容判真假"，需要实现 `__bool__` 或 `__len__` 协议方法。

#### 2.5.1 默认行为：实例恒为真

```python
class Account:
    def __init__(self, name):
        self.name = name

acc = Account("未注销账号")
print(bool(acc))  # True——没有定义协议方法，默认为真
```

#### 2.5.2 `__bool__`：精确控制真值

在类中定义 `__bool__(self)`，它会在真值测试时被调用。你必须返回 `True` 或 `False`（`bool` 类型），否则会抛出 `TypeError`。

```python
class ShoppingCart:
    def __init__(self, items):
        self.items = items

    def __bool__(self):
        return len(self.items) > 0      # 购物车是否"有内容"

empty_cart = ShoppingCart([])
full_cart = ShoppingCart(["苹果", "牛奶"])
print(bool(empty_cart))  # False——空购物车
print(bool(full_cart))   # True——有商品

# 可以直接用在 if 语句中，语义自然
if full_cart:
    print("用户有未结账商品")
```

#### 2.5.3 `__len__`：让容器行为参与真值测试

如果类没有 `__bool__`，但定义了 `__len__`，Python 会退回用 `__len__()` 的返回值来判真假——返回 `0` 为假，非 `0` 为真。

```python
class Team:
    def __init__(self, members):
        self.members = members

    def __len__(self):
        return len(self.members)

empty_team = Team([])
small_team = Team(["张三"])
print(bool(empty_team))   # False  ← __len__ 返回 0
print(bool(small_team))   # True   ← __len__ 返回 >0
```

#### 2.5.4 优先级与边界情况

Python 的真值测试判定顺序是：

1. 有 `__bool__` → 调用 `__bool__`，用它返回的 `bool` 值
2. 没有 `__bool__` 但有 `__len__` → 调用 `__len__`，返回 0 为假，非 0 为真
3. 都没有 → 默认为 `True`

```python
class Confusing:
    """同时定义两个方法，看谁生效"""
    def __bool__(self):
        return False
    def __len__(self):
        return 10   # 如果按 __len__ 判定，这里是真

obj = Confusing()
print(bool(obj))    # False——__bool__ 优先
```

**必须注意返回值类型**：

- `__bool__` 必须返回 `True` 或 `False`，返回字符串 `"是"` 等非布尔值会触发 `TypeError`
- `__len__` 必须返回 `int`，返回 `"5"` 等非整数也会触发 `TypeError`

```python
class BadBool:
    def __bool__(self):
        return "是"     # TypeError: __bool__ should return bool

class BadLen:
    def __len__(self):
        return "5"      # TypeError: 'str' object cannot be interpreted as an integer
```

#### 2.5.5 实战示例：有内容才有效的缓存对象

```python
class Cache:
    def __init__(self):
        self._store = {}

    def set(self, key, value):
        self._store[key] = value

    def __bool__(self):
        return len(self._store) > 0

    def __len__(self):
        return len(self._store)

cache = Cache()
if cache:
    print("从缓存读取数据")
else:
    print("缓存为空，走默认逻辑")
# 输出：缓存为空，走默认逻辑

cache.set("hot_key", 42)
if cache:
    print(f"缓存命中，共 {len(cache)} 条记录")
# 输出：缓存命中，共 1 条记录
```

---

## 3. 最佳实践

### 3.1 直接用真值测试，不写多余的 `== True`

Python 中判断一个值是否"真"，最地道的写法是 `if value:`，而非 `if value == True:`。后者不仅是多余的，还会引入潜在 bug——`1 == True` 成立而 `2 == True` 不成立，但 `if 2:` 和 `if True:` 都表示真。

| 不推荐 | 推荐 | 原因 |
|--------|------|------|
| `if flag == True:` | `if flag:` | `== True` 多余，且数值 `2` 的真值与 `2 == True` 不同 |
| `if items == []:` | `if not items:` | 用真值测试统一处理空容器 |
| `if len(items) > 0:` | `if items:` | PEP 8 推荐，更 Pythonic |
| `if name == "" or name is None:` | `if not name:` | `not` 一视同仁 |

```python
# 典型场景对比
items = []

# ❌ 不推荐：啰嗦且可能出错
if len(items) > 0:
    print(items[0])

# ✅ 推荐：简洁、意图清晰
if items:
    print(items[0])

# ❌ 不推荐：两种空值分开判断
def validate(name):
    if name == "" or name is None:
        return "名字不能为空"

# ✅ 推荐：真值测试一次覆盖
def validate(name):
    if not name:
        return "名字不能为空"
```

### 3.2 警惕 `or` 默认值的陷阱

`or` 提供默认值是 Python 的惯用法，但在某些场景下它会意外吞掉合法的假值。例如：

```python
# 0 是合法的数量，但 or 会把它判为"假"而回退到默认值
quantity = 0
result = quantity or 10
print(result)  # 10——可能不是用户想要的

# 如果 0、空串等是合法值，改用三目运算符更安全
result = quantity if quantity is not None else 10
```

**判断标准**：当假值是"有意义"的数据（如 0 表示"零个"、空串表示"特意留空"）时，用三目运算符判断 `is None`；当假值确实代表"无效/未设置"时（如 `None`、未传入的参数），`or` 惯用法没有问题。

### 3.3 用 `any()` 和 `all()` 做批量真值判断

不要手动写循环去检查"列表中是否存在真值"或"列表中是否全部为真"——`any()` 和 `all()` 是为这个场景设计的。

```python
scores = [85, 92, 0, 78]

# 检查是否至少有一人得分
if any(scores):
    print("有至少一人得分")

# 检查是否全员得分（没有人得 0 分）
if all(scores):
    print("全员得分")
else:
    print("存在 0 分成绩")

# any/all 可与生成器表达式搭配
has_pass = any(s >= 60 for s in scores)
all_pass = all(s >= 60 for s in scores)
print(f"有人及格: {has_pass}, 全员及格: {all_pass}")
```

### 3.4 短路求值做前置判空而非全部替代

`and`/`or` 短路的代码量很少，但如果链条过长，可读性会急剧下降。当一个表达式 `and`/`or` 超过两段时，考虑拆成显式的 `if-else`：

```python
# ✅ 两段短路，意图清晰
name = user_input or "匿名用户"

# ❌ 三段以上短路，可读性下降
result = a or b or c or d or "fallback"

# ✅ 同样逻辑，用 if-else 更清晰
result = a if a is not None else (b if b is not None else (c or "fallback"))
```

### 3.5 过滤列表中的空值

清洗数据时经常需要剔除空串、`None` 等无效项。利用 `filter(None, ...)` 或列表推导式 + 真值测试，一行搞定。

```python
raw = ["张三", "", None, "  ", "李四", [], "王五"]

# 方法一：列表推导式 + 真值测试（滤除空串和 None，保留纯空白）
cleaned = [item for item in raw if item]
print(cleaned)  # ['张三', '  ', '李四', '王五']

# 方法二：filter(None, ...) 等价效果
cleaned2 = list(filter(None, raw))
print(cleaned2) # ['张三', '  ', '李四', '王五']

# 如果还要滤掉纯空白字符串，需要额外 strip
cleaned3 = [item for item in raw if item and str(item).strip()]
print(cleaned3) # ['张三', '李四', '王五']
```

### 3.6 真值测试 vs `is None` 的场景选择

| 场景 | 推荐写法 | 说明 |
|------|---------|------|
| 判断变量是否有效（非空非 None） | `if value:` | 用真值测试，一次覆盖多种"空"的情况 |
| 判断变量是否"根本没传"（区别于传 0、空串等合法假值） | `if value is None:` | 只检查 None，不误判 "0" 等合法假值 |
| 函数参数的默认值逻辑 | `if value is None: value = default` | 防止 0 和空串被默认值覆盖 |
| 表单/用户输入校验 | `if not value:` | 用户没填就是"空"，真值测试即可 |

```python
def fetch_data(limit=None):
    # ❌ 错误：limit=0 也会被默认值覆盖
    # limit = limit or 50

    # ✅ 正确：只有"没传"时才用默认值
    if limit is None:
        limit = 50
    print(f"查询 limit={limit}")

fetch_data()      # limit=50
fetch_data(0)     # limit=0 —— 保留合法值
fetch_data(20)    # limit=20
```

---

## 4. 原理

### 4.1 真值测试的内部机制

当你写 `if obj:` 时，Python 解释器内部执行的步骤如下：

```text
if obj:                     # 用户看到的代码
  ↓
__bool__ = type(obj).__bool__  # 1. 从类型的 tp_as_number 查 __bool__
  ↓
if __bool__ is not None:
    result = __bool__(obj)     # 2. 有 __bool__ → 调用，必须返回 True/False
else:
    __len__ = type(obj).__len__  # 3. 没有 __bool__ → 查 __len__
    if __len__ is not None:
        n = __len__(obj)       # 4. 有 __len__ → 调用，返回 0 为假，非 0 为真
        result = (n != 0)
    else:
        result = True          # 5. 都没有 → 默认 True
  ↓
if result:
    执行 if 块
else:
    执行 else 块
```

**优先级链**：`__bool__` > `__len__` > 默认 `True`。这三层回退设计让自定义对象在真值测试中的行为灵活可控——你可以精确实现 `__bool__`，也可以仅通过实现 `__len__` 让容器"看起来像内置容器"，甚至什么都不做，默认接受"永远为真"的行为。

### 4.2 `and` / `or` 为什么返回操作数而非 `bool`

很多语言（如 Java、JavaScript 的 `&&`/`||`）的逻辑运算符强制返回布尔值。Python 选择返回操作数本身，这是一个有意图的设计——它让短路求值天然支持"默认值回退"和"安全链式取值"这两类惯用法：

```python
# 如果 and/or 返回 bool，这种写法就不成立
name = user_name or "匿名"       # 需要的是字符串，不是 True/False
first = items and items[0]       # 需要的是元素，不是 True/False
```

如果 Python 的 `and`/`or` 强制返回 `bool`，你就得这样写：

```python
# 假想的"返回 bool"世界 —— 更啰嗦
name = user_name if user_name else "匿名"
first = items[0] if items else None
```

返回操作数本身，是 Python 在"正确性"和"便利性"之间的取舍——它让初学者看 `and`/`or` 的行为时可能困惑，但赋予老手更简洁的表达力。

### 4.3 为什么默认对象恒为真

Python 语言设计者选择"任何自定义对象默认为真"，背后的考量是**最小意外原则**：如果你创建了一个对象，在没有显式定义"什么算空"之前，Python 假设它"存在即有值"。这避免了"类刚定义好实例就假"的困惑。

当你需要"空即假"的语义时，定义 `__bool__` 或 `__len__`。这让"假"成为一个有意识的设计选择，而非默认行为。

### 4.4 自定义真值的类型安全

`__bool__` 强制返回 `True`/`False`（`bool` 类型），`__len__` 强制返回 `int`——这些约束不是随意加上的，而是为了防止真值测试的三层回退机制在逻辑上断裂：

```text
如果 __bool__ 返回 "是"（字符串）
→ Python 无法把它当作 T/F 判定
→ 回退到 __len__ 吗？不行，因为 __bool__ 已经"存在"
→ 只能报错

如果 __len__ 返回 "5"（字符串）
→ Python 无法判断 "5" == 0 吗？
→ 这种隐式规则会引入更多隐蔽 bug
→ 报错是最清晰的反馈
```

---

## 5. 总结

本文围绕 Python 的布尔值类型与真值测试机制展开，主要介绍了以下内容：

- `bool` 类型是 `int` 的子类，只有 `True` 和 `False` 两个实例，它们同时是 Python 的关键字，不能被赋值
- `bool()` 构造函数对任意对象做真值测试，规则统一：假值列表之外的一切皆为真
- 假值包括 `None`、`False`、各种零值（`0`/`0.0`/`0j`）、空字符串和空容器，共 12 种
- `not`、`and`、`or` 三个逻辑运算符中，`not` 总是返回 `bool`，而 `and`/`or` 返回参与运算的操作数本身，支持短路求值
- 短路求值衍生出默认值回退（`a or default`）和安全链式取值（`a and a[0]`）等惯用法
- 自定义对象可通过 `__bool__` 和 `__len__` 协议方法参与真值测试，优先级为 `__bool__` > `__len__` > 默认真
- 真值测试的最地道写法是直接 `if obj:`，而不是 `if obj == True:` 或 `if len(obj) > 0:`
- 在使用 `or` 提供默认值时需注意假值陷阱——当 `0`、空串是合法数据时，改用 `is None` 判断