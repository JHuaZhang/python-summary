---
group:
  title: 【10】循环结构
  order: 10
order: 10
title: 列表推导式入门
nav:
  title: Python基础
  order: 1
---

# 列表推导式入门

## 1. 介绍

### 1.1 什么是列表推导式

列表推导式（List Comprehension）是 Python 中一种**用一行表达式构建新列表**的语法。它将 `for` 循环的遍历逻辑和列表的构建逻辑压缩到一对方括号中，让你能用更少的代码表达「从一个已有序列，按某种规则生成一个新列表」的意图。

```python
# 传统 for 循环方式：3 行
squares = []
for x in range(1, 6):
    squares.append(x ** 2)

# 列表推导式：1 行
squares = [x ** 2 for x in range(1, 6)]

print(squares)  # [1, 4, 9, 16, 25]
```

这不是一个特殊的语法糖——它借鉴了数学中「集合构造式」的写法：`{ x² | x ∈ {1..5} }`。Python 将其翻译为 `[x ** 2 for x in range(1, 6)]`，读起来就是「对于 1 到 5 中的每个 x，计算 x²」。

### 1.2 列表推导式在 Python 中的定位

列表推导式处于循环体系与数据容器之间的交汇点。它本质上是 for 循环的简洁表达形式，但输出的是一个新列表：

```text
Python 循环体系

  ├── 基础循环结构
  │   ├── for 循环 —— 遍历可迭代对象
  │   └── while 循环 —— 条件驱动
  │
  ├── 流程控制
  │   ├── break / continue / else
  │   └── 嵌套循环的跳出策略
  │
  ├── 辅助工具
  │   ├── enumerate / zip —— 序号与并行
  │   ├── range —— 数值序列
  │   └── 解包语法 —— 多变量赋值
  │
  └── 推导式 ← 循环的表达升级
      ├── 列表推导式 [x for x in seq]        ← 本篇
      ├── 字典推导式 {k: v for k, v in ...}
      ├── 集合推导式 {x for x in seq}
      └── 生成器表达式 (x for x in seq)
```

### 1.3 最简示例

用几个最常用的场景来建立第一印象：

```python
# 映射：将每个元素转换
names = ["alice", "bob", "carol"]
upper = [n.upper() for n in names]
print(upper)  # ['ALICE', 'BOB', 'CAROL']

# 过滤：只保留符合条件的元素
nums = [1, 2, 3, 4, 5, 6, 7, 8]
evens = [n for n in nums if n % 2 == 0]
print(evens)  # [2, 4, 6, 8]

# 混合：先映射再过滤
words = ["hello", "world", "python", "a", "is"]
long_upper = [w.upper() for w in words if len(w) > 3]
print(long_upper)  # ['HELLO', 'WORLD', 'PYTHON']
```

这三行代码覆盖了列表推导式最核心的三种能力：转换、过滤、组合。后面的章节会对每种能力做详细拆解。

---

## 2. 核心内容

### 2.1 基本语法：推导式 vs 传统 for 循环

#### 2.1.1 语法格式

列表推导式的基本语法是：

```text
[<表达式> for <变量> in <可迭代对象>]
```

将它与等价的 for 循环对照：

```python
# 传统 for 循环
result = []
for item in iterable:
    result.append(expression(item))

# 列表推导式
result = [expression(item) for item in iterable]
```

推导式把「遍历什么」「怎么变换」「存到哪里」三步合并到一行。

#### 2.1.2 变量作用域

推导式中的循环变量**不会泄漏到外部作用域**（Python 3 的行为）：

```python
x = 10
result = [x for x in range(3)]  # 推导式内部的 x
print(result)  # [0, 1, 2]
print(x)       # 10 —— 外部 x 不受影响
```

这与普通 for 循环不同——for 循环的变量在循环结束后仍然存在：

```python
for x in range(3):
    pass
print(x)  # 2 —— for 循环变量泄漏到外部
```

#### 2.1.3 与 map/filter 的关系

推导式可以完全替代 `map()` 和 `filter()` 的组合，而且通常更可读：

```python
# map + filter
result = list(map(str.upper, filter(lambda w: len(w) > 3, words)))

# 列表推导式——更直观
result = [w.upper() for w in words if len(w) > 3]
```

| 维度 | map/filter | 列表推导式 |
|------|-----------|----------|
| 可读性 | 需要从内向外读，lambda 嵌套时很绕 | 从左到右自然阅读 |
| 函数开销 | 每次调用 lambda 有额外开销 | 表达式直接求值 |
| Python 风格 | 函数式风格 | Pythonic 风格 |

### 2.2 带 if 条件的推导式（过滤）

#### 2.2.1 单一过滤条件

语法格式：`[expr for var in iterable if condition]`

`if` 放在 `for` **之后**时，作用是**过滤**——只有 `condition` 为 `True` 的元素才会进入 `expr`：

```python
nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
evens = [n for n in nums if n % 2 == 0]
print(evens)  # [2, 4, 6, 8, 10]
```

等价的 for 循环写法：

```python
evens = []
for n in nums:
    if n % 2 == 0:
        evens.append(n)
```

一个重要的理解——`if` 在 `for` 后的执行流程是「先遍历，再过滤」：

```text
遍历 nums:
  n=1: if 检查 → False → 跳过
  n=2: if 检查 → True  → append(2)
  n=3: if 检查 → False → 跳过
  ...
```

#### 2.2.2 复合过滤条件

多个条件用 `and`/`or` 组合：

```python
# 3 的倍数且是偶数
result = [n for n in range(1, 31) if n % 3 == 0 and n % 2 == 0]
print(result)  # [6, 12, 18, 24, 30]
```

#### 2.2.3 利用真值特性过滤空值

Python 中空字符串、`None`、0 等默认是假值（falsy），可以直接用作过滤条件：

```python
data = ["hello", "", "world", None, "python", "", "code"]
cleaned = [item for item in data if item]
print(cleaned)  # ['hello', 'world', 'python', 'code']
```

### 2.3 if/else 三元表达式（变换）

#### 2.3.1 if 放 for 前 vs 放 for 后——本质区别

这是一个关键区分点，许多初学者会混淆：

```text
[x for x in seq if condition]       ← if 在 for 后：过滤（元素可能被丢弃）
[x if cond else y for x in seq]     ← if 在 for 前：变换（每个元素都会被处理）
```

**if 在 for 后**：`for` 遍历每个元素，`if` 决定是否保留，结果列表长度 ≤ 原列表。

```python
# 过滤：只保留偶数
evens = [n for n in range(1, 7) if n % 2 == 0]
print(evens)  # [2, 4, 6]    长度从 6 变 3
```

**if 在 for 前**：`for` 遍历每个元素，`if-else` 决定每个元素的输出值，结果列表长度 = 原列表。

```python
# 变换：把每个数标记为奇偶
labels = ["偶数" if n % 2 == 0 else "奇数" for n in range(1, 7)]
print(labels)  # ['奇数', '偶数', '奇数', '偶数', '奇数', '偶数']   长度始终是 6
```

#### 2.3.2 多条件三元表达式

三元表达式可以嵌套来实现多分支判断：

```python
scores = [92, 78, 65, 88, 55, 95]
grades = [
    "优秀" if s >= 90 else
    "良好" if s >= 80 else
    "及格" if s >= 60 else
    "不及格"
    for s in scores
]
print(grades)
# ['优秀', '及格', '及格', '良好', '不及格', '优秀']
```

**注意**：三元嵌套超过两层后，可读性会下降。如果分支超过 3 个，考虑抽成函数或在普通 for 循环中处理。

#### 2.3.3 if 在前 + if 在后：同时变换和过滤

两者可以同时使用——`for` 前的 if-else 控制每个元素的输出值，`for` 后的 if 控制哪些元素进入结果：

```python
nums = [-5, -3, -1, 0, 2, 4, 6, 8]
result = ["正" if n > 0 else "非正" for n in nums if n != 0]
print(result)  # ['非正', '非正', '非正', '正', '正', '正', '正']
# 0 被过滤掉了，剩余元素被标记为"正"或"非正"
```

### 2.4 嵌套推导式

#### 2.4.1 嵌套 for 的推导式

推导式中可以包含多个 `for` 子句，相当于嵌套循环。**书写顺序与 for 循环的嵌套顺序一致**：

```python
# 笛卡尔积组合
colors = ["红", "绿"]
sizes = ["S", "M"]
combos = [f"{c}-{s}" for c in colors for s in sizes]
print(combos)  # ['红-S', '红-M', '绿-S', '绿-M']
```

等价的嵌套 for 循环：

```python
combos = []
for c in colors:      # 外层
    for s in sizes:   # 内层
        combos.append(f"{c}-{s}")
```

**执行顺序**：外层的 `for c` 先绑定一个值，然后内层 `for s` 跑完一整轮，回到外层的下一个值——这跟嵌套 for 循环的执行顺序完全相同。

#### 2.4.2 展平二维列表

嵌套推导式最经典的用途是展平（flatten）二维列表：

```python
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
flat = [val for row in matrix for val in row]
print(flat)  # [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

**理解技巧**：把推导式中的 `for` 子句按书写顺序「翻译」为嵌套的 for 循环，翻译后就是：

```text
for row in matrix:
    for val in row:
        append(val)
```

#### 2.4.3 嵌套推导式中加过滤条件

可以在外层或内层分别加过滤：

```python
# 内层过滤：展平时只保留正数
data = [[1, -2, 3], [-4, 5, -6], [7, -8, 9]]
positives = [v for row in data for v in row if v > 0]
print(positives)  # [1, 3, 5, 7, 9]

# 外层过滤：跳过空行
matrix = [[1, 2], [], [3, 4, 5], [], [6]]
result = [v for row in matrix if row for v in row]
print(result)  # [1, 2, 3, 4, 5, 6]
```

#### 2.4.4 嵌套推导式的可读性警告

嵌套超过两层 `for` 后，推导式的可读性急剧下降。一个判断标准：

```python
# 可读：两层 for，展平矩阵
flat = [v for row in matrix for v in row]

# 勉强可读：两层 for + 过滤
result = [v for row in matrix if row for v in row if v > 0]

# 不可读：应该用普通 for 循环
mess = [x for a in list1 for b in list2 if cond1 for c in b if cond2]
```

如果自己需要回头读两遍才能理解，就该改用普通的 for 循环。

### 2.5 在推导式中使用函数与表达式

#### 2.5.1 调用内置函数

表达式部分可以调用任意内置函数：

```python
import math

values = [1, -4, 9, -16, 25]
roots = [math.sqrt(abs(v)) for v in values]
print(roots)  # [1.0, 2.0, 3.0, 4.0, 5.0]
```

#### 2.5.2 调用自定义函数

复杂的转换逻辑可以抽成函数，推导式中直接调用：

```python
def celsius_to_fahrenheit(c):
    return c * 9 / 5 + 32

temps_c = [0, 10, 20, 30, 40]
temps_f = [celsius_to_fahrenheit(c) for c in temps_c]
print(temps_f)  # [32.0, 50.0, 68.0, 86.0, 104.0]
```

这种方式在逻辑稍复杂时比直接写在推导式里更可读——函数名本身就解释了变换的语义。

#### 2.5.3 方法链式调用

字符串处理中常见的方法链：

```python
raw = ["  hello  ", "WORLD", " python "]
cleaned = [w.strip().lower().capitalize() for w in raw]
print(cleaned)  # ['Hello', 'World', 'Python']
```

### 2.6 推导式的适用边界——什么时候不用

推导式不是银弹。有些场景强行用推导式反而降低可读性。

**不应该用推导式的情况**：

1. **逻辑复杂、分支多**。如果一条推导式需要 80 个字符以上才能写完，或者包含嵌套三元表达式，应该拆成普通 for 循环。

```python
# 不适合：逻辑藏在一行里难以理解和调试
result = [process(x) if validate(x) else fallback(x) for x in data
          if x is not None and x.status == "active" and x.score > 0]

# 适合：逻辑多步走，每步清晰
result = []
for x in data:
    if x is None or x.status != "active" or x.score <= 0:
        continue
    result.append(process(x) if validate(x) else fallback(x))
```

2. **有副作用**。推导式中不应调用 `print()`、写文件、发网络请求等副作用操作——推导式的语义是「构建数据」，不是「执行操作」。

```python
# 错误用法：推导式用于副作用
[print(x) for x in range(3)]  # 虽然能运行，但语义错误

# 正确用法
for x in range(3):
    print(x)
```

3. **需要中途 break 或复杂的流程控制**。推导式不支持 `break`/`continue`。

**选择指南**：

```text
用推导式：
  ✓ 简单映射 [f(x) for x in seq]
  ✓ 简单过滤 [x for x in seq if cond]
  ✓ 简单展平 [v for row in m for v in row]

用 for 循环：
  ✓ 逻辑超过 2-3 行
  ✓ 需要 break / continue
  ✓ 有副作用（print、文件操作）
  ✓ 多个不相关的操作穿插
```

---

## 3. 最佳实践

### 3.1 推荐 vs 不推荐写法对比

| 场景 | 不推荐 | 推荐 | 原因 |
|------|--------|------|------|
| 创建新列表 | `for x in seq: result.append(f(x))` | `[f(x) for x in seq]` | 推导式一行完成，意图清晰 |
| map+filter | `list(map(f, filter(p, seq)))` | `[f(x) for x in seq if p(x)]` | 推导式从左到右读，更直观 |
| 简单过滤 | `[x for x in seq if x > 0]` | 同左，很好 | — |
| 展平二维 | 嵌套 for + append | `[v for row in m for v in row]` | 一层表达式可读 |
| 三层以上嵌套 | 推导式 | 普通 for 循环 | 三层推导式几乎不可能读 |
| 副作用操作 | `[print(x) for x in seq]` | `for x in seq: print(x)` | 推导式用于构建数据，不是执行操作 |

#### 3.1.1 典型对比示例

**从字典列表中提取字段**

不推荐——手动 for 循环多行但意图简单：

```python
names = []
for user in users:
    names.append(user["name"])
```

推荐——推导式一行表达同样的意图：

```python
names = [user["name"] for user in users]
```

**map + filter 组合**

不推荐——从内向外读，lambda 嵌套不直观：

```python
result = list(map(lambda x: x.upper(), filter(lambda x: len(x) > 2, words)))
```

推荐——从左到右自然阅读：

```python
result = [w.upper() for w in words if len(w) > 2]
```

### 3.2 常见错误模式及修正

**错误一：混淆 if 位置的含义**

```python
# 错误意图：想保留偶数，标记为"偶数"
result = ["偶数" if n % 2 == 0 for n in nums]
# SyntaxError: 缺少 else！
```

修正——区分两种 if：
- `if` 在 `for` 后 = 过滤，不需要 `else`
- `if` 在 `for` 前 = 三元表达式，必须有 `else`

```python
# 过滤：只保留偶数
result = [n for n in nums if n % 2 == 0]

# 变换：每个数标记奇偶
result = ["偶数" if n % 2 == 0 else "奇数" for n in nums]
```

**错误二：推导式的执行顺序搞反**

```python
# 误解：以为先执行内层 for
[f"{c}-{s}" for s in sizes for c in colors]  # 顺序反了！
```

修正——推导式中 `for` 的书写顺序与嵌套 for 循环的外→内顺序一致：

```python
# 正确：for c in colors（外层）→ for s in sizes（内层）
[f"{c}-{s}" for c in colors for s in sizes]
```

**错误三：在推导式中写多语句**

```python
# 错误：推导式中无法执行多条语句
result = [x * 2; log(x) for x in data]  # 语法错误
```

修正——多语句逻辑放函数里：

```python
def transform(x):
    log(x)
    return x * 2

result = [transform(x) for x in data]
```

### 3.3 可读性建议

**控制推导式长度**：超过约 80 字符的推导式考虑换行或改用 for 循环：

```python
# 换行写法（保持可读）
result = [
    f"{user['name']} ({user['role']})"
    for user in users
    if user["active"] and user["role"] != "guest"
]
```

**慎用嵌套三元**：嵌套三元不超过两层。如果逻辑更复杂，把分支逻辑封装成一个独立函数。

**变量命名要有语义**：`[x.name for x in users]` 比 `[u[0] for u in users]` 好得多。推导式中变量名同样要讲道理。

---

## 4. 原理

### 4.1 推导式的执行过程

列表推导式本质上是构建了一个**临时列表**，在方括号内隐式地调用 `append`：

```text
[x*2 for x in range(3)]

Python 内部执行过程：
1. 创建一个空列表 []
2. for x in range(3):     → x=0 → 计算 0*2 → append(0)
3.                         → x=1 → 计算 1*2 → append(2)
4.                         → x=2 → 计算 2*2 → append(4)
5. 返回 [0, 2, 4]
```

用 Python 代码模拟推导式的执行等价于：

```python
def comprehension_equivalent():
    result = []                     # 隐式创建空列表
    for x in range(3):              # for 遍历
        result.append(x * 2)        # append 当前结果
    return result                   # 返回完整列表
```

### 4.2 推导式的性能优势

推导式比等价的 for + append 更快，主要原因是**减少了 Python 层面的操作**：

- `result.append` 的查找在每次迭代中都会发生（查找 `append` 属性），而推导式内部直接用 C 层面的 `LIST_APPEND` 字节码指令
- 推导式不需要在 Python 层面维护 `result` 变量和 `append` 方法引用

```text
for + append:
  LOAD_FAST result      # Python 层面查找 result
  LOAD_METHOD append    # Python 层面查找 append 方法
  ...call...
  CALL_METHOD           # Python 层面调用

推导式:
  LIST_APPEND           # C 层面直接追加
```

这个差异在小数据集上不明显，但对百万级数据，推导式通常比等价 for 循环快 10-20%。

### 4.3 推导式与生成器表达式的区别

列表推导式用方括号 `[...]`，**立即求值**，一次性构建整个列表并占用内存：

```python
squares = [x**2 for x in range(10)]  # 立即创建包含 10 个元素的列表
```

生成器表达式用圆括号 `(...)`，**惰性求值**，只在需要时才逐个产出元素：

```python
squares = (x**2 for x in range(10))  # 生成器对象，还没开始计算
print(next(squares))  # 1
print(next(squares))  # 4
```

| 场景 | 用什么 | 原因 |
|------|--------|------|
| 需要多次遍历 | 列表推导式 | 生成器只能消费一次 |
| 数据量很大 | 生成器表达式 | 惰性求值，省内存 |
| 需要 len/索引 | 列表推导式 | 生成器不支持 |
| 作为函数参数传给 sum/max | 生成器表达式 | sum(x**2 for x in data) 省略一对括号 |

当生成器表达式作为**唯一的函数参数**时，可以省略外层的圆括号：

```python
total = sum(x**2 for x in range(10))    # sum((x**2 for x in range(10))) 的简写
```

---

## 5. 总结

本文围绕列表推导式入门，主要介绍了以下内容：

- 列表推导式是「一行表达式构建新列表」的语法，基本格式 `[expr for var in iterable]`
- 推导式比等价的 for + append 更简洁，且在性能上通常快 10-20%
- `if` 在 `for` 后是过滤（结果列表可能比原列表短），`if` 在 `for` 前是三元变换（结果列表长度不变）
- 嵌套推导式可以展平二维列表和生成笛卡尔积，书写顺序与嵌套 for 循环的外→内一致
- 推导式中可以调用任意内置函数、自定义函数、方法链
- 推导式不适用于复杂逻辑（拆成 for 循环）、有副作用（如 print）、需要 break 的场景
- 推导式中的循环变量不会泄漏到外部作用域（与普通 for 循环不同）
- 控制推导式长度在约 80 字符以内，三层以上嵌套用普通 for 循环
- 生成器表达式 `(...)` 与推导式 `[...]` 的区别：惰性求值 vs 立即求值
- 推导式内部使用 C 层的 `LIST_APPEND` 指令，比 Python 层的 append 方法调用更高效