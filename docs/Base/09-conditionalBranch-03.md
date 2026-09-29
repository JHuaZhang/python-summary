---
group:
  title: 【09】条件分支
  order: 9
order: 3
title: if 语句基础
nav:
  title: Python基础
  order: 1
---

# if 语句基础

## 1. 介绍

### 1.1 什么是 if 语句

`if` 语句是 Python 中最基本的流程控制结构。它让你根据条件决定"执行这段代码还是跳过它"，程序不再是从上到下顺序执行，而是**有了选择能力**。

在实际编程中，条件判断无处不在：用户登录时判断密码是否正确、购物车结算时判断是否满足满减条件、游戏里判断角色血量是否归零……这些场景全部依赖 `if` 语句来实现。

Python 的 `if` 语句有几个独一无二的特征：

1. **条件不限于布尔值**——任何对象都可以放在 `if` 后面，Python 会通过真值测试来判断
2. **缩进即代码块**——不用花括号 `{}`，缩进本身就是语法
3. **`: ` 冒号是必须的**——忘写冒号是新手最常见的语法错误

### 1.2 最简示例

```python
# 最基本的 if 语句：条件为真时执行缩进块，为假时跳过
temperature = 35
if temperature > 30:
    print("天气炎热，建议开空调")

# if/else 二分支：二选一
age = 16
if age >= 18:
    print("允许进入")
else:
    print("禁止进入")

# if/elif/else 多分支：多选一
score = 82
if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
else:
    grade = "F"
print(f"分数 {score} → 等级 {grade}")
```

**运行结果**：

```text
天气炎热，建议开空调
禁止进入
分数 82 → 等级 B
```

---

## 2. 核心内容

### 2.1 `if` 语句的基本语法

Python 的 `if` 语句由三个核心要素构成：关键字 `if`、条件表达式、以及缩进的代码块。

```text
if <条件>:
    <代码块>
```

**语法规则**：

- `if` 关键字后跟一个条件表达式
- 条件表达式后面必须有冒号 `:`
- 下一行开始必须**缩进**（标准为 4 个空格），缩进内的语句属于 if 的代码块
- 条件为真时执行缩进块，条件为假时整个缩进块被跳过

```python
# 条件为真 → 执行缩进块
score = 85
if score >= 60:
    print(f"分数 {score}，及格")
    print("这是同一代码块的第二行")

# 条件为假 → 缩进块不执行，直接跳到后续代码
if score < 0:
    print("这行不会执行，因为 85 不小于 0")

print("这行总是执行，因为它不在 if 的缩进块内")
```

**运行结果**：

```text
分数 85，及格
这是同一代码块的第二行
这行总是执行，因为它不在 if 的缩进块内
```

#### 2.1.1 条件表达式：任意对象都可以

Python 的 `if` 后面不要求写 `== True`。你可以直接把任何对象作为条件，Python 会自动对其做真值测试。

```python
# 字符串为空 → 假 → 不执行
name = ""
if name:
    print(f"用户 {name} 已登录")  # 不会执行

# 列表非空 → 真 → 执行
items = ["苹果", "牛奶"]
if items:
    print(f"购物车有 {len(items)} 件商品")

# 数字 0 → 假 → 不执行
count = 0
if count:
    print(f"库存 {count}")  # 不会执行

# None → 假 → 不执行
config = None
if config:
    print(config)  # 不会执行
```

**关键点**：`if name:` 比 `if name != ""` 更 Pythonic。前者自动覆盖 `None`、空串、空列表等多种"空"的情况，后者只能判断一种。PEP 8 建议直接用真值测试。

#### 2.1.2 缩进是语法，不是风格

Python 用缩进界定代码块——这与 C/Java/JavaScript 用花括号 `{}` 完全不同。缩进不是可选的编码风格，而是**语法要求**：缩进错了，代码不是不好看，而是根本跑不了。

```python
# 正确：同一代码块内所有行缩进一致（标准 4 空格）
if True:
    print("第一行")
    print("第二行")

# 错误示例（不要运行）：
# if True:
#     print("第一行")
#   print("第二行")    # IndentationError: 缩进不一致

# if True:
# print("缩进哪去了")   # IndentationError: 期望一个缩进块
```

**注意事项**：

- 标准缩进为 **4 个空格**（PEP 8 推荐）
- 同一个代码块内所有行的缩进必须**完全一致**
- 混用空格和 Tab 是新手最常见错误，建议编辑器设置"Tab 自动转 4 空格"
- 缩进可以嵌套——内层代码块比外层多缩进一级

---

### 2.2 `if/else` 二分支

`if/else` 提供"二选一"的分支逻辑：条件为真执行 if 块，条件为假执行 else 块。两条路径**互斥**——每次只执行其中一条，不可能同时执行。

```text
if <条件>:
    <为真时执行>
else:
    <为假时执行>
```

```python
# 基本二分支
balance = 100
if balance > 0:
    print(f"余额 {balance} 元，可以继续消费")
else:
    print("余额不足，请充值")

# 条件可以是复杂逻辑表达式
username = "admin"
password = "123456"
if username == "admin" and password == "123456":
    print("管理员登录成功")
else:
    print("用户名或密码错误")
```

#### 2.2.1 `else` 是可选的

`else` 子句不是必须的。没有 `else` 时，条件为假就什么都不做——程序安静地继续往下走。

```python
# 有时候只需要"条件满足时做点什么"，不满足时不需要任何操作
error_count = 0
if error_count > 0:
    print(f"检测到 {error_count} 个错误，请检查日志")
# error_count 为 0，什么都不发生，合理

# 有 else 的版本：条件不满足时也需要给出反馈
if error_count > 0:
    print(f"检测到 {error_count} 个错误")
else:
    print("一切正常")
```

**选择原则**：如果"条件不满足"本身是一个有意义的状态且需要通知用户，加 `else`；如果"条件不满足"意味着什么都不做，省略 `else`。

---

### 2.3 `if/elif/else` 多分支

当有超过两个互斥条件时，用 `if/elif/else` 链。Python 从上到下依次检查每个条件，命中第一个真值后执行对应的代码块，然后**跳过所有剩余的 `elif` 和 `else`**。

```text
if <条件1>:
    <条件1为真时执行>
elif <条件2>:
    <条件1为假且条件2为真时执行>
elif <条件3>:
    <条件1、2均为假且条件3为真时执行>
else:
    <以上条件均为假时执行>
```

```python
score = 82

if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
elif score >= 60:
    grade = "D"
else:
    grade = "F"

print(f"分数 {score} → 等级 {grade}")  # 分数 82 → 等级 B
```

**关键点**：`score=82` 同时满足 `>=80`、`>=70` 和 `>=60`，但由于从上到下检查，`score >= 80` 最先命中，所以结果为 B。一旦命中，后面的 `>=70` 和 `>=60` 根本不会被评估。

#### 2.3.1 条件顺序至关重要

`if/elif` 链的执行结果依赖于条件的排列顺序。同一组条件，顺序不同可能导致不同的输出。

```python
# 正确顺序：从严格到宽松（高值到低值）
def grade_correct(s):
    if s >= 90: return "A"
    elif s >= 80: return "B"
    elif s >= 70: return "C"
    elif s >= 60: return "D"
    else: return "F"

# 错误顺序：从宽松到严格
def grade_wrong(s):
    if s >= 60: return "D"
    elif s >= 70: return "C"
    elif s >= 80: return "B"
    elif s >= 90: return "A"
    else: return "F"

print(grade_correct(82))  # B——正确
print(grade_wrong(82))    # D——被第一个 >=60 拦截了！
```

**原则**：排列条件时从"最严格/最窄"到"最宽松/最广"，确保更精确的判断在更模糊的判断之前。

#### 2.3.2 `elif` 的数量和 `else` 的位置

- `elif` 可以有**任意多个**（0 到 N 个）
- `else` 只能有 **0 或 1 个**，且必须放在最后
- `elif` 不能出现在 `else` 之后

```python
# elif 有多个
weather = "rain"
if weather == "sunny":
    tip = "出门记得防晒"
elif weather == "rain":
    tip = "出门带伞"
elif weather == "snow":
    tip = "穿暖和点"
else:
    tip = "查看天气预报"

# 也可以没有 else——不匹配时什么都不做
role = "guest"
if role == "admin":
    print("欢迎管理员")
elif role == "vip":
    print("欢迎 VIP 用户")
# guest 不匹配，无输出，程序继续
```

---

### 2.4 嵌套 `if` 与条件组合

当需要在某个条件内部再做更细粒度的判断时，可以嵌套 `if`。但嵌套层数过深时，代码变得难以阅读——你需要权衡"嵌套"和"展平"两种写法。

#### 2.4.1 嵌套 `if` 的基本用法

```python
is_login = True
is_admin = True

if is_login:
    print("用户已登录")
    if is_admin:
        print("  → 具有管理员权限")
    else:
        print("  → 普通用户")
else:
    print("请先登录")
```

#### 2.4.2 用 `and` 将嵌套展平

当内层 `if` 的条件和外层条件之间是"且"的关系时，可以用 `and` 合并成一个条件：

```python
# 嵌套写法
if is_login:
    if is_admin:
        print("管理员已登录")

# and 展平写法——更简洁
if is_login and is_admin:
    print("管理员已登录")
```

#### 2.4.3 深层嵌套 vs 提前 `return`

在函数中，用"不满足条件就提前 `return`"可以彻底消除嵌套。这是业界公认的最佳实践，被称为**卫语句（Guard Clause）**：

```python
# 反例：4 层嵌套
def can_participate(user):
    if user:
        if user.get("age", 0) >= 18:
            if user.get("vip"):
                if user.get("balance", 0) > 300:
                    return True
    return False

# 推荐：提前 return，逐层排除——阅读时只需从上往下扫
def can_participate(user):
    if not user:
        return False
    if user.get("age", 0) < 18:
        return False
    if not user.get("vip"):
        return False
    if user.get("balance", 0) <= 300:
        return False
    return True
```

**判断标准**：

| 场景 | 推荐写法 | 理由 |
|------|---------|------|
| 条件之间有先后依赖（先判断有没有用户，再判断属性） | 嵌套 1~2 层 | 层级关系本身就是信息 |
| 条件之间是并列的（各项独立检查） | `and` 展平或提前 return | 减少缩进，提高可读性 |
| 嵌套超过 2 层 | 提取函数 + 提前 return | 深层嵌套 = 认知负担重 |

---

### 2.5 三元表达式（条件表达式）

Python 的条件表达式（俗称"三元表达式"）语法为：

```text
<真值结果> if <条件> else <假值结果>
```

它把简单的 `if/else` 赋值压缩为一行，适用于"根据条件选一个值"的场景。

```python
# 基本用法
age = 20
status = "成年" if age >= 18 else "未成年"
print(status)  # 成年

# 等价于：
# if age >= 18:
#     status = "成年"
# else:
#     status = "未成年"
```

#### 2.5.1 三元表达式是表达式，不是语句

三元表达式可以出现在任何需要表达式的位置——函数参数、列表推导、字典值、f-string 中：

```python
# 函数参数中
print(f"权限：{'允许' if age >= 18 else '拒绝'}")

# 列表推导式中
scores = [55, 72, 90, 43, 88]
labels = ["及格" if s >= 60 else "不及格" for s in scores]
print(labels)  # ['不及格', '及格', '及格', '不及格', '及格']

# 字典值中
config = {
    "timeout": 30 if age >= 18 else 10,
    "mode": "adult" if age >= 18 else "child",
}
```

#### 2.5.2 不要嵌套三元表达式

语法上三元表达式可以嵌套，但可读性急剧下降：

```python
score = 75

# 反例：嵌套三元——需要用力解析
bad = "A" if score >= 90 else "B" if score >= 80 else "C" if score >= 70 else "F"

# 推荐：多条件用 if/elif/else，清晰直观
if score >= 90:
    good = "A"
elif score >= 80:
    good = "B"
elif score >= 70:
    good = "C"
else:
    good = "F"
```

**原则**：三元表达式适合**二选一**的简单场景。一旦涉及三个及以上分支，用 `if/elif/else`。

#### 2.5.3 三元表达式 vs `or` 惯用法

`or` 惯用法（`value or default`）只能覆盖"值为假时回退"的场景；三元表达式则可以判断任意条件：

```python
# or 惯用法：适合"空值回退"
name = user_input or "匿名用户"

# 三元表达式：适合任意条件判断
# 下面这个场景 or 无法处理——balance 为 200 时 or 不会触发
balance = 200
message = "余额充足" if balance >= 100 else "余额不足"
```

---

## 3. 最佳实践

### 3.1 直接用真值测试，不写多余的比较

Python 中 `if` 后面的表达式不需要是 `bool` 类型。把对象直接作为条件，比显式和 `None`、空串、`0` 比较更简洁、更健壮。

| 不推荐 | 推荐 | 原因 |
|--------|------|------|
| `if name != "" and name is not None:` | `if name:` | 真值测试一次覆盖多种"空"情况 |
| `if len(items) > 0:` | `if items:` | PEP 8 推荐，语义更自然 |
| `if flag == True:` | `if flag:` | `== True` 多余且可能引入 bug（`1 == True` 成立但 `2 == True` 不成立） |
| `if found is False:` | `if not found:` | `not` 更简洁 |

```python
# 典型场景
items = []

# ❌ 不推荐
if len(items) > 0:
    print(items[0])

# ✅ 推荐
if items:
    print(items[0])
```

### 3.2 深层嵌套用提前 `return` 消除

超过 2 层的嵌套需要对读者的脑力征税——每多一层缩进，读者需要在脑中维护多一层上下文。用"不满足就提前 return"的卫语句模式，可以消除几乎所有嵌套：

```python
# ❌ 深层嵌套：阅读时需要记住每一层条件
def process_order(order):
    if order:
        if order.status == "paid":
            if order.amount > 0:
                if order.inventory_check():
                    return "发货成功"
    return "发货失败"

# ✅ 卫语句：从上到下，每个条件一目了然
def process_order(order):
    if not order:
        return "发货失败"
    if order.status != "paid":
        return "发货失败"
    if order.amount <= 0:
        return "发货失败"
    if not order.inventory_check():
        return "发货失败"
    return "发货成功"
```

### 3.3 `elif` 条件从严格到宽松排列

`if/elif` 链的检查顺序决定了输出结果。永远把最精确、最严格的条件放在前面。

```python
# ❌ 错误：宽松条件在前，吞掉了后面的精确条件
if score >= 60:
    grade = "D"       # 82 被这里拦截，永远不会走到 >=80
elif score >= 80:
    grade = "B"

# ✅ 正确：严格条件在前
if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"       # 82 命中这里
elif score >= 70:
    grade = "C"
```

### 3.4 利用 `elif` 的互斥性减少重复判断

因为 `elif` 只在前面条件都为假时才被评估，你可以省略掉"隐式已知"的条件：

```python
# ❌ 冗余写法：在 elif 中重复了"前面已排除"的条件
if score >= 90:
    grade = "A"
elif score < 90 and score >= 80:  # "score < 90" 是冗余的——走到这里时它必然成立
    grade = "B"

# ✅ 简洁写法：利用 elif 的互斥性
if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"  # 走到这里时 score < 90 自动成立
```

### 3.5 `if` 块尽量短，复杂逻辑抽取为函数

当一个 `if` 块的代码超过约 8~10 行时，读代码的人容易忘记"当前处于哪个条件之下"。把复杂逻辑抽取为函数，让 `if` 块保持简短。

```python
# ❌ if 块过于臃肿
if user.is_vip:
    # 30 行 VIP 逻辑...
    pass
else:
    # 30 行普通用户逻辑...
    pass

# ✅ 抽取为函数
if user.is_vip:
    handle_vip(user)
else:
    handle_normal(user)
```

### 3.6 常见错误模式

| 错误 | 原因 | 修正 |
|------|------|------|
| `if score >= 80 and < 90:` | 语法错误，`and` 两边必须是完整表达式 | `if 80 <= score < 90:` 或 `if score >= 80 and score < 90:` |
| 忘记冒号 `:` | 冒号是 Python 的语法要求 | 每行 `if`/`elif`/`else` 结尾都要加冒号 |
| `elif` 写在 `else` 之后 | `else` 必须是最后一个子句 | 把 `elif` 移到 `else` 之前 |
| 缩进不一致 | 混用空格和 Tab | IDE 设置 Tab 自动转 4 空格 |
| 缩进层级混乱 | `elif` 和前面的 `if` 没有对齐 | `if`、`elif`、`else` 必须在同一缩进层级 |

---

## 4. 原理

### 4.1 `if` 语句的字节码实现

`if` 语句在 CPython 内部被编译为一系列条件跳转指令。理解这个机制有助于你理解为什么 `elif` 是互斥的、为什么条件顺序很重要。

一条 `if/elif/else` 链被编译后的核心指令是：

- `POP_JUMP_IF_FALSE`：条件为假时跳转到指定位置
- `JUMP_FORWARD`：无条件跳转（用于跳过 `else` 块）

```text
if score >= 90:
    → 执行 A
elif score >= 80:
    → 执行 B
else:
    → 执行 C

编译后的逻辑等价于：

1. 计算 score >= 90
2. 如果为假 → 跳转到 4（检查下一个条件）
3. 执行 A → 跳转到 8（整个 if 结束）
4. 计算 score >= 80
5. 如果为假 → 跳转到 7（执行 else）
6. 执行 B → 跳转到 8
7. 执行 C
8. if 结束，继续后续代码
```

这个流程解释了 `elif` 链的两个核心行为：① 一旦某个条件为真，后续条件根本不会被求值（互斥性）；② 条件是**按编写顺序**检查的，顺序决定了结果。

### 4.2 为什么 Python 用缩进而不用花括号

Guido van Rossum 在设计 Python 时有意省略了花括号，只保留冒号和缩进。核心动机有两个：

1. **强制可读性**：在 C/Java 中，缩进只是风格建议，代码可以写成一行但难以阅读。Python 把缩进提升为语法，让"可读"从"建议"变成"必须"。
2. **减少视觉噪声**：去掉 `{}` 后，代码密度更低，视觉上更干净。`if x: ` 比 `if (x) {` 少了一个字符但多了很多呼吸感。

同时这个设计也带来了代价——缩进错误会导致程序直接崩溃（`IndentationError`），不像花括号语言那样只是"排版不好看"。

### 4.3 三元表达式的求值顺序

三元表达式 `A if cond else B` 的求值顺序是：

1. 先计算 `cond`
2. 如果 `cond` 为真，计算 `A`（`B` 不会被计算）
3. 如果 `cond` 为假，计算 `B`（`A` 不会被计算）

这意味着三元表达式也有短路行为——只有被选中的分支会被求值：

```python
# cond 为真时 expensive_fallback() 不会被调用
result = cheap_value if flag else expensive_fallback()

# 这一点和 if/else 的行为一致
```

### 4.4 `if/elif` vs `match/case` 的选择边界

Python 3.10 引入了 `match/case` 结构匹配。在与 `if/elif` 链的功能重叠区（多分支选择），选择标准是：

| 场景 | 推荐 | 原因 |
|------|------|------|
| 判断数值范围（`score >= 90`） | `if/elif` | `match` 的 case 守卫语法更累赘 |
| 判断精确值（`weather == "rain"`） | `if/elif` 或 `match` 均可 | 看团队偏好 |
| 解构复杂数据结构（列表、字典、类实例） | `match/case` | `match` 原生支持模式解构 |
| 条件涉及多个不同类型的对象 | `if/elif` | `match` 的类型匹配在动态场景下有限 |

`match/case` 可以视作 `if/elif` 在某些场景下的增强替代，但它不取代 `if/elif`——复杂的数值比较、跨多个变量的逻辑组合仍然是 `if` 的主场。

---

## 5. 总结

本文围绕 Python 的 `if` 条件语句展开，主要介绍了以下内容：

- `if` 语句的核心三要素：关键字 `if`、条件表达式和缩进代码块，其中缩进是 Python 的语法要求而非风格建议
- `if/else` 二分支提供互斥的"二选一"逻辑，`else` 是可选的
- `if/elif/else` 链实现多分支选择，从上到下依次检查条件并执行第一个命中的分支，条件顺序直接决定结果
- 嵌套 `if` 用于表达条件之间的层级依赖，但超过 2 层建议用 `and` 展平或提取函数 + 提前 `return` 消除
- 三元表达式 `A if cond else B` 将简单的 if/else 赋值压缩为一行，适合二选一场景，不适合嵌套
- 最佳实践包括用真值测试替代 `== True`、利用 `elif` 互斥性省略冗余条件、将臃肿的 `if` 块抽取为函数
- `if` 语句在底层通过条件跳转指令实现互斥和短路语义；Python 用缩进而非花括号界定代码块的设计源自强制可读性的理念