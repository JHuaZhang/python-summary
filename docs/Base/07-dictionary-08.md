---
group:
  title: 【07】字典深度剖析
  order: 7
order: 8
title: 字典合并
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是字典合并

字典合并是指将两个或多个字典中的键值对组合成一个新字典的操作。这听起来简单——"把两个字典合在一起"——但实际上，Python 提供了至少七种合并方式，每一种在"冲突时谁覆盖谁""是创建新字典还是原地修改""性能如何""对哪种场景最自然"这些维度上都有不同的取舍。

```python
d1 = {"a": 1, "b": 2}
d2 = {"b": 3, "c": 4}

# 方式一：d1 | d2 (Python 3.9+)
merged1 = d1 | d2
print(merged1)  # 输出：{'a': 1, 'b': 3, 'c': 4}  ← d2 的 b 覆盖了 d1 的 b

# 方式二：{**d1, **d2} (Python 3.5+)
merged2 = {**d1, **d2}
print(merged2)  # 输出：{'a': 1, 'b': 3, 'c': 4}  ← 同上

# 方式三：d1.update(d2) (原地修改)
d1_copy = {"a": 1, "b": 2}
d1_copy.update(d2)
print(d1_copy)  # 输出：{'a': 1, 'b': 3, 'c': 4}  ← d1 被修改

# 方式四：d1 |= d2 (Python 3.9+，等效于 d1.update(d2)，原地修改)
d1_copy2 = {"a": 1, "b": 2}
d1_copy2 |= d2
print(d1_copy2)  # 输出：{'a': 1, 'b': 3, 'c': 4}

# 方式五：ChainMap (链式查找，不合并但可统一访问)
from collections import ChainMap
cm = ChainMap(d1, d2)  # 先查 d1，后查 d2

# 方式六：dict(d1, **d2) (构造函数)
merged6 = dict(d1, **d2)
print(merged6)  # 输出：{'a': 1, 'b': 3, 'c': 4}

# 方式七：手动循环 (最底层但最可控)
merged7 = d1.copy()
for k, v in d2.items():
    merged7[k] = v
print(merged7)  # 输出：{'a': 1, 'b': 3, 'c': 4}
```

上述七种方式的结果在大多数情况下相同——`d2` 的键覆盖 `d1` 的同名键。但差异在于：① 是否创建新字典（返回新对象 vs 原地修改）；② 是否支持多个字典；③ 性能如何；④ 适用场景。理解全部合并方式的目的是：当遇到一个具体需求（配置覆盖、参数合并、多源数据聚合……），你能立刻选出最恰当、最不易出 bug 的那一种。

### 1.2 为什么需要这么多种合并方式

Python 的字典合并方式演进历史直接解释了为什么会有这么多选择：

- **Python 2 时代**：没有现代语法，只能 `d1.update(d2)` 原地修改，或者手动循环。
- **Python 3.5 引入`**：**解包语法 `{**d1, **d2}`**，第一次有了"一行代码创建新合并字典"的能力，但写法稍显冗长。
- **Python 3.9 引入**：**管道运算符 `|` 和 `|=`**，字典终于有了自己专属的合并运算符——和集合/列表的 `|` 不同，字典的 `|` 表示"用右侧覆盖左侧同名键"。这是 PEP 584 的成果，让合并的意图表达更清晰。

新增的运算符不仅让代码更简洁，还带来了"或等于"的形式 `|=`，原地修改不需要先 copy 再 update，一行搞定。于是今天我们有了"创建新对象 vs 原地修改""单行 vs 循环""两个字典 vs 多个字典"等多维度的选择空间。

### 1.3 关键概念：覆盖语义 vs 合并语义 vs 链式查找

在深入各种合并方式之前，先明确三种基本语义：

1. **覆盖语义**：当多个字典有相同键时，某个字典的值"胜出"，成为最终值。这就是 `d1 | d2` / `{**d1, **d2}` / `update()` 的行为——右侧字典的键覆盖左侧的。
2. **合并语义**：不仅仅是覆盖，有时还需要"同类合并"——比如两个字典的值都是列表，希望把两个列表拼接起来（`{"a": [1], "b": 2} + {"a": [3], "c": 4}` → `{"a": [1, 3], "b": 2, "c": 4}`）。这种场景需要自定义合并逻辑（手动循环或自定义函数）。
3. **链式查找**：不真正合并成一个大字典，而是让多个字典形成"查找链"——先在第一个字典里找，找不到再去第二个里找，`ChainMap` 就是这个语义。它适合"优先级字典"场景：用户配置优先于默认配置，找不到再去查默认配置。

本篇主要聚焦前两种语义（覆盖和合并），最后一部分会专门讲链式查找（`ChainMap`）。

## 2. 核心内容

### 2.1 管道运算符：d1 | d2 (Python 3.9+)

`d1 | d2` 返回一个新字典——`d2` 的键值对合并到 `d1` 中，同名键用 `d2` 的值覆盖。左侧是"基础"，右侧是"覆盖层"：

```python
d1 = {"a": 1, "b": 2}
d2 = {"b": 3, "c": 4}

merged = d1 | d2
print(merged)  # 输出：{'a': 1, 'b': 3, 'c': 4}
print(d1)      # 输出：{'a': 1, 'b': 2}  ← d1 保持不变
print(d2)      # 输出：{'b': 3, 'c': 4}  ← d2 保持不变
```

管道运算符的语义精确规定为：**右侧字典覆盖左侧字典**。这不仅仅是"把两个字典的内容放一起"，而是"用第二个字典去更新第一个，生成一个新字典"。

管道运算符的优先级和结合性：

```python
d1 = {"a": 1}
d2 = {"b": 2}
d3 = {"c": 3}

# | 是左结合的，等价于 (d1 | d2) | d3
result = d1 | d2 | d3
print(result)  # 输出：{'a': 1, 'b': 2, 'c': 3}
```

如果想要"d3 最优先覆盖"的效果，需要调整顺序：`d1 | d3 | d2`，相当于让 d2 最后覆盖。或者更明确地写 `{**d1, **d3, **d2}`，解包顺序从左到右依次覆盖，右边的优先级最高。

如果用 `dict` 子类（如 `OrderedDict`、`Counter`、`defaultdict`）做 `|` 运算，结果仍然是普通 `dict` 而非原来的子类：

```python
from collections import OrderedDict, Counter

od1 = OrderedDict([("a", 1), ("b", 2)])
od2 = OrderedDict([("b", 3), ("c", 4)])
result = od1 | od2
print(type(result))  # 输出：<class 'dict'>  ← 不是 OrderedDict！
print(result)        # 输出：{'a': 1, 'b': 3, 'c': 4}
```

这个行为在 PEP 584 中被明确：运算符合并总是返回普通 `dict`，不会保留子类的特殊方法。如果需要保留子类类型，用 `update()` 或者手动循环并构造对应子类的实例。

### 2.2 管道赋值运算符：d1 |= d2 (Python 3.9+)

`d1 |= d2` 是"先取 `d1 | d2` 的结果，再赋值回 `d1`"的简写。本质等同于 `d1.update(d2)`，但语法更对称（对应 `d1 = d1 | d2`，但不需要临时变量）：

```python
d1 = {"a": 1, "b": 2}
d2 = {"b": 3, "c": 4}

d1 |= d2
print(d1)  # 输出：{'a': 1, 'b': 3, 'c': 4}  ← d1 被原地修改了
```

重要细节：`d1 |= d2` 在行为上**完全等同于** `d1.update(d2)`，但有一点点语义差异：

- `update()` 是显式的"更新"操作——代码意图是"把 d2 的内容合并进 d1"
- `|=` 是"管道赋值"，暗示"把 d2 的内容合并进 d1，把结果存回 d1"

对于日常使用，两者完全可互换——选你更喜欢的方式。`|=` 的优势是"管道"这个语义链更完整：`d1 = d1 | d2` 需要中间变量，`d1 |= d2` 一行搞定。

### 2.3 解包语法：{**d1, **d2}

解包语法是 Python 3.5 引入的，比管道运算符更早出现。它的语义和 `d1 | d2` 完全一致——右侧覆盖左侧：

```python
d1 = {"a": 1, "b": 2}
d2 = {"b": 3, "c": 4}

merged = {**d1, **d2}
print(merged)  # 输出：{'a': 1, 'b': 3, 'c': 4}
```

解包语法的优势在于：**合并多个字典时更直观**，因为你可以连续写多个 `**dict`：

```python
d1 = {"a": 1}
d2 = {"b": 2}
d3 = {"c": 3}
d4 = {"a": 99}   # a 最终会是 99

# 解包语法：按顺序依次覆盖，右边优先级最高
merged = {**d1, **d2, **d3, **d4}
print(merged)  # 输出：{'a': 99, 'b': 2, 'c': 3}
```

管道运算符 `d1 | d2 | d3 | d4` 也能做同样的事，但当有多个字典时，`{**d1, **d2, **d3, **d4}` 的视觉对齐更好看。另外，解包语法可以混合字面量：

```python
merged = {**d1, **d2, "new_key": 999}
```

这种混合写法在"默认配置 + 用户配置 + 运行时覆盖"的场景中很常见——解包语法让覆盖层级一目了然。

解包语法的另一个优势是它**在函数调用中作为关键字参数**的能力：

```python
def foo(a, b, c):
    print(a, b, c)

config = {"a": 1, "b": 2, "c": 3}
foo(**config)  # 把字典解包成关键字参数
```

这实际上是解包的另一个用途——把字典"展开"成函数参数，而不是字典合并本身。但它们共享同样的 `**` 语法，理解这一点有助于你在代码中灵活切换。

### 2.4 update() 方法：原地修改

`dict.update(other)` 把 `other` 的键值对合并进当前字典，返回 `None`。和 `|=` 完全等价，但出现得更早（Python 2 就有）：

```python
d1 = {"a": 1, "b": 2}
d2 = {"b": 3, "c": 4}

d1.update(d2)
print(d1)  # 输出：{'a': 1, 'b': 3, 'c': 4}  ← d1 被修改
```

`update()` 的参数非常灵活：

```python
# 方式一：从另一个字典更新
d = {}
d.update({"a": 1})          # 字典
print(d)                     # {'a': 1}

# 方式二：从可迭代的键值对更新
d.update([("b", 2), ("c", 3)])  # list of tuples
print(d)                     # {'a': 1, 'b': 2, 'c': 3}

# 方式三：从关键字参数更新
d.update(d=4, e=5)
print(d)                     # {'a': 1, 'b': 2, 'c': 3, 'd': 4, 'e': 5}

# 方式四：混合
d.update([("f", 6)], g=7)
print(d)                     # {'a': 1, 'b': 2, 'c': 3, 'd': 4, 'e': 5, 'f': 6, 'g': 7}
```

这种灵活性让 `update()` 在动态构建字典时非常好用——你可以把多个来源（字典、列表、元组、关键字参数）混在一起，一次 `update()` 全部合并进去。

### 2.5 ChainMap：链式查找而非真正合并

`ChainMap` 是 `collections` 模块提供的一个类，它把**多个字典组成一个"视图链"**，查找时按顺序在这些字典中逐个查找——和"合并"有本质区别：它不创建新字典，而是创建一个"代理"对象，按优先级顺序查找各个底层的字典。

```python
from collections import ChainMap

defaults = {"theme": "dark", "lang": "en", "timeout": 30}
user_config = {"theme": "light", "email": "user@example.com"}
env_config = {"debug": True}

# 链式查找：user_config 优先级最高，其次是 env_config，最后是 defaults
cm = ChainMap(user_config, env_config, defaults)

print(cm["theme"])   # 输出：light        ← user_config 最优先
print(cm["lang"])    # 输出：en           ← defaults
print(cm["timeout"]) # 输出：30           ← defaults
print(cm["email"])   # 输出：user@example.com  ← user_config
print(cm["debug"])   # 输出：True         ← env_config
print(cm["notex"])   # KeyError          ← 全部找不到 → KeyError
```

`ChainMap` 的查找顺序由构造函数中传入的字典顺序决定——**第一个字典优先级最高**，找不到再去第二个，以此类推。

它特别适合这些场景：

1. **配置优先级链**：默认配置 → 环境变量 → 用户配置 → 命令行参数
2. **命名空间查找**：局部变量 → 全局变量 → 内置变量
3. **多层继承**：子类属性 → 父类属性 → 默认属性

```python
# 典型配置优先级场景
default_config = {"host": "0.0.0.0", "port": 8080, "debug": False}
env_overrides = {}  # 可以从环境变量加载
user_overrides = {"port": 9000}  # 用户自定义配置

config = ChainMap(user_overrides, env_overrides, default_config)
```

`ChainMap` 的"不合并"特性有一个关键优势：**它不占用额外内存来存储键值对**，只是维护了一个字典引用的列表 + 一个"父链"指针。这对层级深的配置系统非常友好——你只需要维护各个原始字典，不需要每次配置合并都申请一个新的大字典。

`ChainMap` 的其他常用操作：

```python
cm = ChainMap(user_config, env_config, defaults)

# 遍历：遍历所有键（去重，优先取第一个找到的）
for k in cm:
    print(k, cm[k])

# 成员检查
print("theme" in cm)  # True，按链的顺序查找

# maps 属性：访问底层字典列表
print(cm.maps)        # [user_config, env_config, defaults]

# new_child()：在链的前面插入一个新的空字典（作为新的最高优先级）
child_cm = cm.new_child()  # 相当于 ChainMap({}, *cm.maps)
child_cm["temp"] = "value"
print(child_cm["temp"])    # value
print(cm["temp"])          # KeyError（原有 cm 不受影响）

# 取出当前最高优先级的字典
current = cm.maps[0]  # user_config
```

### 2.6 dict() 构造函数：dict(d1, \*\*d2)

`dict()` 构造函数可以接受一个位置参数（作为基础字典）和任意数量的关键字参数。关键字参数会覆盖位置参数中的同名键：

```python
d1 = {"a": 1, "b": 2}
d2 = {"b": 3, "c": 4}

merged = dict(d1, **d2)
print(merged)  # 输出：{'a': 1, 'b': 3, 'c': 4}
```

这条写法和 `{**d1, **d2}` 等价，但有一个关键限制：**关键字参数不支持非标识符字符作为键**。如果你的键不是有效的 Python 标识符（如数字、带空格的字符串、符号），就不能用 `dict(d1, **d2)` 的写法，只能用解包或管道：

```python
d1 = {"a": 1}
d2 = {"0key": 2, "with space": 3}

# ❌ dict(d1, **d2) 报错：关键字参数必须是有效的标识符
# merged = dict(d1, **d2)  ← SyntaxError: keyword can't be an expression

# ✅ 解包语法可以（键不需要是标识符）
merged = {**d1, **d2}
print(merged)  # 输出：{'a': 1, '0key': 2, 'with space': 3}

# ✅ 管道运算符也可以
merged2 = d1 | d2
print(merged2)  # 输出：{'a': 1, '0key': 2, 'with space': 3}
```

### 2.7 合并多个字典

当需要合并多个（两个以上）字典时，不同方式的写法差异：

```python
d1 = {"a": 1}
d2 = {"b": 2}
d3 = {"c": 3}
d4 = {"a": 99}  # a 最后会是 99

# 方式一：解包（最直观）
merged = {**d1, **d2, **d3, **d4}
# 输出：{'a': 99, 'b': 2, 'c': 3}

# 方式二：管道链式
merged = d1 | d2 | d3 | d4
# 输出：{'a': 99, 'b': 2, 'c': 3}

# 方式三：reduce 风格（适合动态数量的字典列表）
dicts = [d1, d2, d3, d4]
from functools import reduce
merged = reduce(lambda x, y: x | y, dicts)
# 输出：{'a': 99, 'b': 2, 'c': 3}

# 方式四：逐个 update（原地修改）
merged = d1.copy()
merged.update(d2)
merged.update(d3)
merged.update(d4)
# 输出：{'a': 99, 'b': 2, 'c': 3}  ← 但 d1 被污染了
```

如果字典数量是动态的（列表中任意数量），用 `reduce` 或循环解包比较自然；如果数量固定，解包或管道最简洁。

关于性能：对少量字典（2-4 个），几种方式的差异可以忽略；对大量字典（如几十个配置源合并），解包方式会生成一个包含所有键的大字典，而 `ChainMap` 根本不合并、直接链式查找——后者内存效率更高。

### 2.8 自定义合并：合并同类值

上面讨论的所有合并方式都是"右侧覆盖左侧"的简单覆盖。但有时业务逻辑需要"同类合并"——如果两个字典对同一个键的值是列表，希望拼接；如果是数值，希望累加；如果是嵌套字典，希望递归合并。

```python
# 需要合并同类值的场景示例
default_config = {
    "features": ["auth", "logging"],
    "max_retries": 3,
    "settings": {"debug": False, "verbose": True}
}
user_config = {
    "features": ["dashboard"],
    "max_retries": 5,
    "settings": {"debug": True}
}

# 默认的 {**d1, **d2} 只会让 user_config 完全覆盖 default_config
# 结果：features 变成 ["dashboard"] 而不是 ["auth", "logging", "dashboard"]
print({**default_config, **user_config})
# 输出：{'features': ['dashboard'], 'max_retries': 5, 'settings': {'debug': True}}
#       ↑ settings.debug 被覆盖，verbose 丢失！
```

解决方法是写一个自定义合并函数：

```python
def deep_merge(base: dict, override: dict) -> dict:
    """递归合并 override 到 base，同名键如果是 dict 则递归合并"""
    result = base.copy()  # 复制一份基准
    for k, v in override.items():
        if k in result and isinstance(result[k], dict) and isinstance(v, dict):
            result[k] = deep_merge(result[k], v)  # 递归合并
        else:
            result[k] = v  # 覆盖
    return result

default_config = {
    "features": ["auth", "logging"],
    "max_retries": 3,
    "settings": {"debug": False, "verbose": True}
}
user_config = {
    "features": ["dashboard"],
    "max_retries": 5,
    "settings": {"debug": True}
}

merged = deep_merge(default_config, user_config)
print(merged)
# 输出：
# {'features': ['dashboard'], 'max_retries': 5, 'settings': {'debug': True, 'verbose': True}}
```

这是深度合并（deep merge）的简单实现。如果需要"列表拼接"而非"列表覆盖"，进一步修改 `deep_merge`：

```python
def deep_merge_append_lists(base: dict, override: dict) -> dict:
    result = base.copy()
    for k, v in override.items():
        if k in result and isinstance(result[k], list) and isinstance(v, list):
            result[k] = result[k] + v  # 列表拼接
        elif k in result and isinstance(result[k], dict) and isinstance(v, dict):
            result[k] = deep_merge_append_lists(result[k], v)
        else:
            result[k] = v
    return result

merged = deep_merge_append_lists(default_config, user_config)
print(merged)
# 输出：
# {'features': ['auth', 'logging', 'dashboard'], 'max_retries': 5, 'settings': {...}}
```

这种自定义合并在处理多层配置、嵌套字典合并、特性开关列表累加等场景中非常实用。它不是 Python 内置语法，而是基于"循环遍历 + 条件合并"的理念实现的。

### 2.9 经典范式一：配置覆盖（默认 → 用户 → 命令行）

```python
# 默认配置
default_config = {
    "host": "0.0.0.0",
    "port": 8080,
    "debug": False,
    "log_level": "INFO",
    "timeout": 30,
}

# 用户配置文件
user_config = {
    "debug": True,
    "port": 9000,  # 用户想换端口
}

# 命令行参数
cmd_args = {}

# 合并顺序：default <- user <- cmd（后者优先级最高）
final_config = {**default_config, **user_config, **cmd_args}
print(final_config)
# {'host': '0.0.0.0', 'port': 9000, 'debug': True, 'log_level': 'INFO', 'timeout': 30}
```

这种"层层覆盖"的模式在 Web 框架（Flask、Django 的配置系统）、CLI 工具、环境驱动的应用中最常见。每个来源有不同的优先级，按顺序解包即可。

### 2.10 经典范式二：默认参数 + 传入参数

```python
# 函数默认参数用空字典
def fetch_data(url, params=None):
    default_params = {"method": "GET", "timeout": 10}
    # 合并：default <- params（如果传了 params 的话）
    merged = {**default_params, **(params or {})}
    return do_fetch(url, merged)

# 用法
fetch_data("/api/users")  # 用默认参数
fetch_data("/api/search", params={"page": 1, "limit": 10})  # 覆盖部分
```

函数的"默认配置 + 运行时参数"模式是解包语法最高频的使用场景之一。每次调用都创建了一个新字典——不会修改原始的 `default_params`。

### 2.11 经典范式三：多源数据聚合

```python
# 多个数据源的字段聚合
source_a = {"name": "Alice", "age": 30}
source_b = {"age": 31, "city": "Beijing", "email": "alice@example.com"}
source_c = {"email": "alice.work@example.com", "department": "Engineering"}

# 聚合所有字段
merged = {**source_a, **source_b, **source_c}
print(merged)
# {'name': 'Alice', 'age': 31, 'city': 'Beijing', 'email': 'alice.work@example.com', 'department': 'Engineering'}
#                                       ↑ 最后出现的覆盖
```

## 3. 最佳实践

### 3.1 推荐写法 vs 不推荐写法

**合并两个字典 → 用管道运算符或解包**

```python
d1 = {"a": 1}
d2 = {"b": 2}

# ✅ 推荐：Python 3.9+ 管道运算符（最简洁）
merged = d1 | d2

# ✅ 也推荐：解包语法（兼容性更好，3.5+ 就能用）
merged = {**d1, **d2}
```

**合并多个字典 → 用解包，优先级从左到右明确**

```python
defaults = {"a": 1}
user = {"b": 2}
runtime = {"c": 3}

# ✅ 解包语法：按顺序覆盖，右边优先级最高
final = {**defaults, **user, **runtime}
```

**原地修改 → 用 update 或 |==**

```python
d1 = {"a": 1}
d2 = {"b": 2}

# ✅ 推荐：|= 更现代
d1 |= d2

# ✅ 也 OK：update()
# d1.update(d2)
```

**配置链式查找 → 用 ChainMap**

```python
from collections import ChainMap

# ✅ 推荐：配置优先级场景用 ChainMap，不创建新字典
config = ChainMap(user_config, env_config, default_config)
```

**❌ 不推荐：先 copy 再 update（多此一举）**

```python
# ❌ 啰嗦：copy 一份再 update，和 |= 等价但多一行
# d1 = d1.copy()
# d1.update(d2)
```

### 3.2 不要混淆"返回新字典"和"原地修改"

```python
d1 = {"a": 1, "b": 2}
d2 = {"b": 3}

# ✅ 返回新字典：d1 和 d2 都不变
new_d = d1 | d2

# ✅ 原地修改：d1 被改变
d1 |= d2
# 或 d1.update(d2)
```

在函数参数中传入字典时要注意：如果函数内部需要"不影响原调用方数据"的合并，用 `{**d1, **d2}` 或 `d1 | d2`；如果允许修改原字典，用 `d1 |= d2` 或 `d1.update(d2)`。

### 3.3 管道运算符不支持多个位置参数

```python
# ❌ 错误：| 运算符只能用于两个字典之间
# merged = |(d1, d2, d3)  # 语法错误

# ✅ 正确：链式使用
merged = d1 | d2 | d3
# ✅ 也可以
merged = {**d1, **d2, **d3}
```

### 3.4 解包语法在函数参数中的特殊用法

```python
def greet(name, greeting="Hello"):
    print(f"{greeting}, {name}!")

config = {"name": "Alice", "greeting": "Hi"}
greet(**config)  # Hi, Alice!

# 变量关键字参数 TIPS:
# **dict 解包后作为关键字参数传递，不是字典合并！
# greet(**config) 等价于 greet(name="Alice", greeting="Hi")
```

### 3.5 ChainMap 的"兄弟"：词典更新优先级

```python
from collections import ChainMap

# ChainMap 的查找顺序是 maps[0] -> maps[1] -> ...
# 如果你想把一个字典的优先级提最高（插入到最前面），用 new_child()

base = {"a": 1, "b": 2}
cm = ChainMap(base)

# 在前面插入一个空字典作为新的最高优先级层
cm2 = cm.new_child()
# 现在 cm2.maps = [{}, base]

# 给新层加内容
cm2["c"] = 3
print(cm2["c"])   # 3
print(cm2["a"])   # 1 ← 继续从 base 往下找
print(cm["a"])    # 1 ← 原 ChainMap 不受影响

# 想"提升"某个已有字典的优先级？
# 方法：重建 ChainMap，把目标字典放第一位
cm = ChainMap(user_settings, {}, default_settings)  # 中间空字典作为当前活动层
```

### 3.6 性能提示：对大字典合并的考量

| 合并方式        | 时间复杂度        | 空间复杂度                | 适用场景                     |
| --------------- | ----------------- | ------------------------- | ---------------------------- | ------------------ |
| `{**d1, **d2}`  | O(n1 + n2)        | O(n1 + n2) 返回新字典     | 少量字典、固定数量           |
| `d1 \| d2`      | O(n1 + n2)        | O(n1 + n2) 返回新字典     | 少量字典、Python 3.9+        |
| `d1.update(d2)` | O(n2)             | O(1) 原地修改             | 需要原地修改时               |
| `ChainMap`      | O(n) 查找时逐层查 | O(m)，m = 层数            | 需要保持各层独立、动态优先级 |
| `reduce(x       | y, dicts)`        | O(k \* n_avg)，k = 字典数 | O(n) 累积                    | 动态数量的字典列表 |

如果字典很大（几百 KB 或 MB 级），每次 `{**d1, **d2}` 都会拷贝一遍键值对，内存峰值翻倍。如果内存敏感或字典很大，优先用 `ChainMap`（不拷贝）或循环 `update()`（只拷贝一次被合并的字典）。

### 3.7 字典子类 + 运算符合并会丢失子类类型

```python
from collections import OrderedDict, defaultdict

# OrderedDict 用管道合并后变成普通 dict
od1 = OrderedDict([("a", 1)])
od2 = OrderedDict([("b", 2)])
result = od1 | od2
print(type(result))  # <class 'dict'>  ← 不是 OrderedDict

# defaultdict 同样
dd = defaultdict(int, a=1)
dd2 = {"b": 2}
result2 = dd | dd2
print(type(result2))  # <class 'dict'>
```

如果需要保留子类类型，用 `update()` 或手动构造子类：

```python
# 保留 OrderedDict
result = OrderedDict(od1)
result.update(od2)
# 或 result = OrderedDict({**dict(od1), **dict(od2)})
```

### 3.8 合并有非标识符键的字典

```python
d1 = {"key with spaces": 1}
d2 = {"0leading": 2}

# ✅ 解包可以
print({**d1, **d2})

# ✅ 管道运算符可以
print(d1 | d2)

# ❌ dict(d1, **d2) 不可以（语法错误）
# merged = dict(d1, **d2)  ← SyntaxError
```

## 4. 原理

### 4.1 管道运算符 | 的实现

在 Python 3.9 中，`dict.__or__`（对应 `|`）和 `dict.__ior__`（对应 `|=`）被添加到 `dict` 类中：

```python
# dict.__or__ 的等价实现
def __or__(self, other):
    if not isinstance(other, dict):
        return NotImplemented
    merged = self.copy()
    merged.update(other)  # 右侧覆盖左侧
    return merged

# dict.__ior__ 的等价实现
def __ior__(self, other):
    self.update(other)  # 原地更新
    return self
```

核心就是：先 copy 左边（对 `__or__`）或不 copy 直接修改（对 `__ior__`），然后用 `update()` 合并右边。语义简单清晰。

### 4.2 {**d1, **d2} 的解包原理

`{**d1, **d2}` 这种解包语法在编译时被转换成一系列 `dict.__setitem__` 调用，最终生成一个新的字典对象：

```python
# {**d1, **d2} 的等价实现
def merge_dicts(d1, d2):
    result = {}           # 创建空字典
    result.update(d1)     # 先放 d1
    result.update(d2)     # 再放 d2（覆盖同名键）
    return result
```

所以 `{**d1, **d2}` 和 `d1 | d2` 的运行时行为完全等价，只是语法不同。编译器把它们转换成相同的底层操作。

### 4.3 ChainMap 的内部结构

`ChainMap` 内部维护一个 `maps` 列表（存放所有底层字典的引用）和一个 `parents` 引用（指向其余部分）：

```python
# ChainMap 简化结构
class ChainMap:
    def __init__(self, *maps):
        self.maps = list(maps)  # 字典引用列表，按优先级排序

    def __getitem__(self, key):
        for m in self.maps:     # 按顺序查找
            if key in m:
                return m[key]
        raise KeyError(key)

    def __contains__(self, key):
        return any(key in m for m in self.maps)
```

关键特性：**它不复制任何字典，只是持有了多个字典的引用**。这就是为什么 `ChainMap` 的内存效率极高——如果你有 5 个配置源，每个 1KB，合并成一个大字典需要 ~5KB，而 `ChainMap` 只占用很小的固定开销（存 5 个引用 + 元数据）。

### 4.4 合并与链式查找的取舍

| 维度     | 真正的合并（大字典）                 | ChainMap 链式查找                   |
| -------- | ------------------------------------ | ----------------------------------- |
| 内存     | O(n) — 复制所有键值对到新字典        | O(1) — 只存引用                     |
| 查找     | O(1) 一次哈希定位                    | O(m) — m = 链的层数，逐层查找       |
| 修改影响 | 合并后和原字典无关                   | 底层的原字典变了，ChainMap 也跟着变 |
| 适用场景 | 需要把结果传给不理解 ChainMap 的代码 | 优先链、层层覆盖、动态配置系统      |

典型的取舍场景：Web 框架处理请求，用 `ChainMap` 合并 default_config → route_config → session_data，查找高效且各层独立；但最终传给业务逻辑前，可能需要 `dict(cm)` 把结果转成普通 dict，消除对底层的引用依赖。

### 4.5 时间复杂度总表

| 操作                    | 时间复杂度 | 空间复杂度 | 说明                       |
| ----------------------- | ---------- | ---------- | -------------------------- |
| `d1 \| d2`              | O(n1 + n2) | O(n1 + n2) | copy + update              |
| `{**d1, **d2}`          | O(n1 + n2) | O(n1 + n2) | 同上，编译器转换成相同逻辑 |
| `d1.update(d2)`         | O(n2)      | O(1)       | 原地修改，n2 为 d2 的键数  |
| `d1 \|= d2`             | O(n2)      | O(1)       | 同 update，Python 3.9+     |
| `dict(d1, **d2)`        | O(n1 + n2) | O(n1 + n2) | 同 {**d1, **d2}            |
| `ChainMap(d1, d2).查找` | O(m) 查找  | O(m)       | m = 字典数量，查找逐层扫描 |
| 合并 k 个字典（链式）   | O(k \* n)  | O(k)       | 每个字典遍历一次           |

## 5. 总结

### 5.1 字典合并速查

```
合并方式选择：

返回新字典（不修改原字典）：
- d1 | d2                     Python 3.9+，管道运算符，最简洁
- {**d1, **d2}                Python 3.5+，解包语法，兼容性好，可多个
- dict(d1, **d2)              同上，但键不能是非标识符
- dict(d1, **d2, new_k=v)    混合字面量

原地修改：
- d1.update(d2)              经典方式，Python 2 就有
- d1 |= d2                   Python 3.9+，和 update 等价

链式查找（不合并）：
- ChainMap(d1, d2, d3)        按顺序查找，不创建新字典，优先级从左到右

自定义合并（同类型值合并）：
- def deep_merge(base, override): 递归合并嵌套 dict 或拼接 list

覆盖优先级：
- {**low, **mid, **high}     右边覆盖左边，右边优先级最高
- ChainMap(high, mid, low)   左边优先级最高

注意事项：
- 管道运算符和 | 和 |== 不保留子类类型（OrderedDict → dict）
- 解包语法支持任意键（无标识符限制）
- ChainMap 不复制底层字典，修改会相互影响
- 大字典场景注意内存：真正的合并 O(n) 空间，ChainMap O(1)
```

### 5.2 核心要点回顾

- `d1 | d2`（Python 3.9+）和 `{**d1, **d2}`（Python 3.5+）都返回新字典，语义相同：右侧覆盖左侧。
- `d1 |= d2` 和 `d1.update(d2)` 都是原地修改，两者等价。
- 解包语法 `{**d1, **d2, **d3}` 适合多个字典合并，优先级从左到右一目了然。
- `ChainMap` 不真正合并，创建链式查找视图，按优先级顺序逐层查找，内存效率最高但查找是 O(m)（m = 层数）。
- 自定义深度合并（deep merge）需要递归处理嵌套字典。
- 管道运算符会丢失子类的特殊方法（`OrderedDict` → `dict`），需要保留子类时用 `update()`。
- `dict(d1, **d2)` 写法有键的标识符限制，解包和管道没有。

### 5.3 读完应能掌握

- 能在给定场景下快速选出最合适的合并方式：两个字典合并用管道、多个字典用解包、原地修改用 `|=` 或 `update`、配置优先级链用 `ChainMap`。
- 能解释 `d1 | d2` 和 `{**d1, **d2}` 内部等价、为什么右侧覆盖左侧。
- 能写一个简单的 `deep_merge` 函数处理嵌套字典的递归合并。
- 能识别 `ChainMap` 的链式查找特性和适用场景，及其与真正合并的取舍。
- 能在涉及字典子类时注意"运算符合并丢失子类类型"的陷阱。

### 5.4 常见面试问题

**问题一：`d1 | d2` 和 `{**d1, **d2}` 有什么区别？**

```python
d1 = {"a": 1}; d2 = {"b": 2}

# 行为完全相同：返回一个新字典，d2 覆盖 d1 的同名键
r1 = d1 | d2             # Python 3.9+
r2 = {**d1, **d2}        # Python 3.5+

print(r1 == r2)  # True

# 区别：| 只能用于两个 dict；{**} 可以连续写多个
r3 = d1 | d2 | {"c": 3}     # OK，链式
r4 = {**d1, **d2, "c": 3}   # OK，混合字面量
```

**问题二：Pipeline 配置覆盖如何实现？**

```python
default = {"host": "0.0.0.0", "port": 8080}
env = {"port": 9000}
user = {"debug": True}

# 层层覆盖：default <- env <- user
config = {**default, **env, **user}
print(config)
# {'host': '0.0.0.0', 'port': 9000, 'debug': True}
```

**问题三：合并两个 Counter 会发生什么？**

```python
from collections import Counter

c1 = Counter(a=3, b=1)
c2 = Counter(a=1, b=2, c=1)

# 普通字典的 | 运算符：按右侧覆盖左侧
# 但 Counter 定义的 | 是 multiset 交集语义（见前一篇）
# 所以 dict | 会丢失 Counter 的特殊行为！

result = dict(c1) | dict(c2)   # 转成普通 dict 再合并
print(result)  # {'a': 1, 'b': 2, 'c': 1}
```

### 5.5 实战串讲：Web 框架配置系统

把本篇的合并方式串进一个完整场景——Flask/Django 风格的多层配置系统：

```python
from collections import ChainMap

# 1. 内置默认配置（框架自带的最底层默认）
builtin_defaults = {
    "DEBUG": False,
    "SECRET_KEY": None,
    "DATABASE_URL": "sqlite:///app.db",
    "MAX_CONTENT_LENGTH": 16 * 1024 * 1024,
    "JSON_SORT_KEYS": True,
}

# 2. 应用级默认配置（项目自己的默认值）
app_defaults = {
    "DEBUG": False,
    "SECRET_KEY": "default-secret-change-me",
    "DATABASE_URL": "postgresql://localhost/mydb",
    "LOG_LEVEL": "INFO",
}

# 3. 环境变量覆盖（从 OS 环境读取）
env_overrides = {}
import os
if os.getenv("DEBUG"):
    env_overrides["DEBUG"] = os.getenv("DEBUG").lower() == "true"
if os.getenv("SECRET_KEY"):
    env_overrides["SECRET_KEY"] = os.getenv("SECRET_KEY")

# 4. 运行时配置（命令行参数、代码中手动设置）
runtime_config = {
    # "DEBUG": True  # 假设用户通过 CLI 传了 --debug
}

# 方案一：真正合并后使用（适合最终传给不理解 ChainMap 的代码）
final_config = {**builtin_defaults, **app_defaults, **env_overrides, **runtime_config}
print("最终配置（合并后）:", final_config)

# 方案二：链式查找（适合配置可能还会变动、希望改一处全局生效）
config_chain = ChainMap(runtime_config, env_overrides, app_defaults, builtin_defaults)
print("配置 chain:", dict(config_chain))

# 演示：在代码的任何地方修改配置
runtime_config["DEBUG"] = True  # 通过命令行覆盖
print("运行时修改后生效:", config_chain["DEBUG"])  # True ← 立即生效

# 如果需要把最终配置传给一个"只看 dict"的库：
plain_dict = dict(config_chain)  # 转成普通 dict
```

这个场景展示了两种思路的取舍：**方案一**生成一个独立的大字典，适合"一次性写入、后续只读"的场景；**方案二**保持链式引用，适合"配置还会动态变化、期望改一处全局立即生效"的场景。两种都用到本篇的核心 API：`{**}` 解包合并、ChainMap 链式查找。

### 5.6 延伸

字典合并是 Python 日常使用最高频的操作之一。把本篇和前面的内容串联起来：

- **配置层层覆盖**场景 → 本篇的 `{**defaults, **user}` 解包 或 ChainMap
- **需要重排键顺序** → 前一篇 `OrderedDict` 的 `move_to_end`（重排不影响合并，但合并后可能需要重排）
- **合并时计数累加** → 前前篇 `Counter` 的 `+` 运算符（和普通 dict 的 `|` 是不同的语义）
- **批量合并默认值** → 前前前篇 `defaultdict` 的 `|` 或 `|=`（但子类会丢失）

字典家族的"合并与覆盖"主题已经讲完。下一站可以进入字典的性能与安全维度：`【10】字典的in操作时间复杂度` — 聚焦 `key in d` 为什么是 O(1)，以及为什么不要在遍历中修改；或者 `【11】字典底层原理哈希表` — 从底层理解为什么字典这么快、哈希冲突怎么处理、resize 何时发生。

最后记住一条贯穿所有合并方式的判据：**先问是需要"真正的合并产物"还是只需要"优先级链上的统一视图"**——前者用 `{**}` / `|` / `update`，后者用 `ChainMap`。问完这个问题，合并方式的选择瞬间收敛。
