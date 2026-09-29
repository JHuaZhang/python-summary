---
group:
  title: 【09】条件分支
  order: 9
order: 5
title: if-elif-else 多分支结构
nav:
  title: Python基础
  order: 1
---

# if-elif-else 多分支结构

## 1. 介绍

### 1.1 什么是多分支结构

单分支的 `if` 解决"满足条件就做某事"的问题；二分支的 `if-else` 解决"二选一"的问题。现实里很多判断不止两个方向——成绩分 A/B/C/D/E 五档，HTTP 状态分 1xx 到 5xx 五类，菜单有七八个选项——这时候用一个 `if` 加一个 `else` 就不够了，你需要的是"在好多个互斥的方向里挑一个"的能力。

`if-elif-else` 多分支结构就是为此而生：它把一条判断链拉长成任意多个分支，自上而下逐个判断条件，**命中第一个为真的分支后立即跳出整条链**，只执行那一个分支的代码。它和二分支的关系是"扩展版"——二分支是多分支的一个特例（只有 if 和 else 两支），多分支在中间插入了任意多个 `elif`。

**一句话定位**：`if-elif-else` 是 Python 处理"多于两个互斥方向"的标准语法，它保证一条链里**最多只有一个分支**被执行，让代码逻辑既清晰又高效。

### 1.2 最简示例

先用一个最小例子看清它的长相：根据气温输出体感描述。

```python
temp = 8  # 试试改成 15、35、100 看输出如何变化

if temp <= 0:
    level = "冰点及以下，注意防冻"
elif temp <= 15:
    level = "寒冷，需要保暖"
elif temp <= 28:
    level = "舒适区间"
elif temp <= 40:
    level = "高温，注意防暑"
else:
    level = "极端高温，危险"

print(level)
```

**运行结果**：

```text
寒冷，需要保暖
```

`temp` 为 8 时，第一个条件 `temp <= 0` 不成立，往下走到 `temp <= 15`——成立，于是执行这一支，赋值 `"寒冷，需要保暖"`，然后把后面 `temp <= 28`、`temp <= 40` 和 `else` 全部跳过，直接走到 `print`。这就是多分支最核心的行为：**自上而下，首次命中即停**。

### 1.3 语法骨架总览

多分支的完整骨架如下：

```text
if 第一个条件:
    分支体1（条件为真时执行）
elif 第二个条件:
    分支体2（条件为真时执行）
elif 第三个条件:
    分支体3（条件为真时执行）
# ……可以有任意多个 elif ……
else:
    兜底分支（以上条件全为假时执行）
```

几个要点先记在心里，后面逐一展开：

- `if` 必须有且只有一个，是整条链的开头。
- `elif` 可以有零个、一个或任意多个，夹在 `if` 和 `else` 中间。
- `else` 可写可不写，最多一个，必须放在最后。
- 每个分支体的归属完全由**缩进**决定。
- 只有一个分支会被执行，命中第一个为真的条件后整条链结束。

## 2. 核心内容

### 2.1 基本形态：多于两个的互斥分支

多分支和二分支最大的区别，是中间多了 `elif`。`elif` 是 "else if" 的缩写——它的意思是"否则如果"，即"上面那些条件都不成立时，再来看看我这一条成不成立"。

用一个成绩判定的例子对比三种写法：

**单分支 if**（只处理一种情况，其它都忽略）：

```python
score = 85

if score >= 90:
    grade = "A"
# score < 90 的情况完全没有被处理，grade 根本没定义
```

**二分支 if-else**（只能切两半，硬要分多档就得靠嵌套）：

```python
score = 85

if score >= 60:
    # 及格这一半里还要再细分，只能嵌套 if-else
    if score >= 90:
        grade = "A"
    else:
        grade = "B"
else:
    grade = "C"
```

**多分支 if-elif-else**（一条链拉平，所有档位平铺，可读性好）：

```python
score = 85

if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 60:
    grade = "C"
else:
    grade = "D"

print(grade)
```

**运行结果**：

```text
B
```

三种写法对比下来，多分支的优势很明显：它把"在多个互斥选项里挑一个"的逻辑**铺成一层**，不用层层嵌套，读起来像一份"分支选项表"，扫一眼就知道有哪些可能结果。

**互斥性**是理解多分支的关键——这一条链里的所有分支是相互排斥的，任何一次执行**最多只有一个分支**会跑。这是因为命中即停：只要前面某个条件成立，后面的 `elif` 和 `else` 连看都不看。

### 2.2 执行流程：自上而下，首次命中即停

多分支的执行流程可以用下面这张图概括：

```text
求值 第1个条件(bool)?
    ├─ 真 → 执行分支体1 → 跳出整条链 ───┐
    └─ 假                                   │
        求值 第2个条件(bool)?               │
            ├─ 真 → 执行分支体2 → 跳出 ──┤
            └─ 假                           │
                求值 第3个条件(bool)?       │
                    ├─ 真 → 执行分支体3 → ─┤
                    └─ 假                   │
                        ... 还有 elif 就继续...
                        都为假时：           │
                        有 else → 执行兜底分支 ┤
                        无 else → 整条链什么都不做┤
                                                ↓
                                    链之后的下一条语句
```

这套流程有两个重要推论：

**推论一：条件是自上而下求值的，顺序很重要。** 因为命中即停，把判断写在前面还是后面，直接影响结果（详见 2.4 区间顺序相关讨论）。

**推论二：命中后后面的条件不会被求值——这就是短路求值。** 如果条件表达式本身有副作用（比如调用了某个会打印日志的函数），你会清楚地看到"只有命中条件之前的部分被调用过"。

用一个带副作用的函数来"亲眼"看到短路：

```python
def check(label, value):
    print(f"  → 正在求值条件：{label}")
    return value

http_status = 301  # 第 2 个分支命中

print("开始判断 HTTP 状态分类：")
if check("1xx?", False):
    category = "信息响应"
elif check("3xx 重定向?", http_status // 100 == 3):
    category = "重定向，需要进一步处理"
elif check("4xx 客户端错误?", http_status // 100 == 4):
    category = "客户端错误"
elif check("5xx 服务端错误?", http_status // 100 == 5):
    category = "服务端错误"
else:
    category = "其他状态"

print(f"分类结果：{category}")
```

**运行结果**：

```text
开始判断 HTTP 状态分类：
  → 正在求值条件：1xx?
  → 正在求值条件：3xx 重定向?
分类结果：重定向，需要进一步处理
```

输出里只打印了前两个条件——`301` 命中第 2 个分支后，后面的 4xx、5xx 条件根本没有被求值。这就是短路带来的效率优势：很多情况下不必把所有条件都算一遍。

### 2.3 elif 的本质：else + if 的语法糖

`elif` 不是一个新的关键字组合，它是 `else` 和 `if` 两步的**缩写**。下面两段代码完全等价：

**用 elif（推荐写法，扁平）**：

```python
score = 85

if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 60:
    grade = "C"
else:
    grade = "D"
```

**不用 elif，用 else + if 嵌套展开（等价但难读）**：

```python
score = 85

if score >= 90:
    grade = "A"
else:
    if score >= 80:
        grade = "B"
    else:
        if score >= 60:
            grade = "C"
        else:
            grade = "D"
```

两段代码行为一模一样，但第二段随着分支变多会**不断向右缩进**，深到一定程度就完全没法读了。`elif` 的价值就在这里：它把"否则再判断"压成同一层级，让多分支保持**一层缩进**，既省掉多余的嵌套层次，也让逻辑一眼到底。

记住这个等价关系，能帮你理解后面很多现象：比如为什么 `elif` 后面必须写条件（因为它本质是个 `if`），为什么命中一个 `elif` 后整条链就结束（因为后面的 `elif` 都包在前一个 `else` 里，前面命中了这个 `else` 就没进）。

### 2.4 else 兜底分支：谁都没中就归我

`else` 是多分支里的"保底选手"——它不写条件，当上面所有 `if`/`elif` 条件**全部为假**时，它无条件执行。可以把 `else` 理解为"以上都不满足时的默认归属"。

**场景一：else 让任何输入都有明确归属**。给一周七天编号，输入周末时落到 else：

```python
weekday = 7  # 1~5 是工作日，6~7 是周末

if weekday == 1:
    plan = "周一例会"
elif weekday == 2:
    plan = "周二需求评审"
elif weekday == 3:
    plan = "周三技术分享"
elif weekday == 4:
    plan = "周四代码走查"
elif weekday == 5:
    plan = "周五周报"
else:
    # 6 和 7 都落到这里，统一当作周末
    plan = "周末休息"

print(f"今天是第 {weekday} 天，安排：{plan}")
```

**运行结果**：

```text
今天是第 7 天，安排：周末休息
```

**场景二：没有 else 时，无命中则静默跳过**。去掉 else 后，输入不命中任何条件，整条链什么都不会做：

```python
user_role = "unknown"  # 不是 admin / editor / viewer 中的任何一个

if user_role == "admin":
    print("管理员权限")
elif user_role == "editor":
    print("编辑权限")
elif user_role == "viewer":
    print("只读权限")
# 没写 else —— user_role 为 unknown 时上面整条链不会有任何输出
print("判断结束")
```

**运行结果**：

```text
判断结束
```

`unknown` 没命中任何条件，又没有 else 兜底，于是中间一个分支都没执行，只打印了"判断结束"。这正是 else 的价值：**有它就能保证"无论如何都有个结果"，没它就可能出现意料之外的"什么都不发生"**。

**场景三：else 常用于兜底报错**。当输入"不应该出现"时，与其静默吞掉，不如在 else 里主动抛错，让问题尽早暴露：

```python
op = "delete"  # 试试改成支持的操作 add / update / query

try:
    if op == "add":
        result = "执行新增"
    elif op == "update":
        result = "执行更新"
    elif op == "query":
        result = "执行查询"
    else:
        # 兜底分支里抛错，比静默忽略更早暴露问题
        raise ValueError(f"不支持的操作：{op}")
    print(f"操作 {op!r} 的结果：{result}")
except ValueError as e:
    print(f"操作 {op!r} 触发兜底报错：{e}")
```

**运行结果**：

```text
操作 'delete' 触发兜底报错：不支持的操作：delete
```

`else` 的几条硬性规则：

| 规则 | 说明 | 违反的后果 |
|------|------|----------|
| 不写条件 | `else` 后面直接跟冒号，不能写表达式 | 语法错误 |
| 最多一个 | 一条 if 链里至多一个 else | 语法错误 |
| 必须放最后 | else 只能跟在 if 或最后一个 elif 后面 | 语法错误 |
| 可省略 | 没有也不会报错，只是没人兜底 | 无命中时静默跳过 |

### 2.5 条件表达式：任意对象都能当条件

`if`、`elif` 后面的条件不一定是 `True`/`False`，也**不一定非要写比较运算**。Python 会用一套"真值测试"规则把任意对象转成布尔值，再决定走哪一支。能被判定为真值的对象很多，先看一个混合示例：

```python
value = 0  # 试试改成 "" / [] / None / "hello" / [1,2] 看分支如何切换

if value:                       # 直接把 value 当条件
    print(f"{value!r} 被判定为真")
elif value is None:
    print("是 None")
else:
    print(f"{value!r} 被判定为假")
```

**运行结果**（`value = 0` 时）：

```text
0 被判定为假
```

**真值判断规则**：解释器对条件对象调用 `bool()`，规则是先找对象的 `__bool__()` 方法，没有再找 `__len__()`，返回 0 视为假。内置类型的常见假值归纳如下：

| 对象 | 为假（Falsy）的情况 | 为真（Truthy）的情况 |
|------|--------------------|--------------------|
| 数字 | `0`、`0.0`、`0j` | 非零数值 |
| 字符串 | 空串 `""` | 非空字符串 |
| 容器（list/tuple/dict/set） | 空容器 `[]`/`()`/`{}`/`set()` | 至少有一个元素 |
| `None` | 恒为假 | —— |
| 自定义对象 | 定义了 `__bool__` 返回 False 或 `__len__` 返回 0 | 其他情况 |

**一个常见误区**：想判断"列表非空"时，不必写 `if len(xs) != 0`，直接 `if xs:` 更 Pythonic。想判断"列表为空"则用 `if not xs:`。下面两个写法等价，但后者更简洁：

```python
items = [1, 2, 3]

# 啰嗦写法
if len(items) > 0:
    print("有数据")

# Pythonic 写法
if items:
    print("有数据")
```

在多分支里，把"真值测试"和"显式比较"混用时要注意顺序。下面这个例子，`0` 进入第一个 `if value:` 时被判定为假，再由 `elif value is None:` 判断（0 不是 None），最终落到 else——这正是上例输出"0 被判定为假"的原因。

### 2.6 分支体：缩进决定归属

和所有 Python 控制流一样，冒号后面属于这一支的代码，**全部靠缩进**来界定。缩进相同的多条语句属于同一个分支体，缩进回到与 `if`/`elif`/`else` 对齐就代表这一支结束。

```python
score = 85

if score >= 90:
    grade = "A"          # 属于 if 分支
    remark = "优秀"       # 属于 if 分支
elif score >= 60:
    grade = "B"          # 属于 elif 分支
    remark = "合格"       # 属于 elif 分支
else:
    grade = "C"          # 属于 else 分支
    remark = "不合格"     # 属于 else 分支

print(f"{grade}，{remark}")  # 缩进与 if 对齐：不属于任何分支，总会执行
```

**运行结果**：

```text
B，合格
```

无论命中哪一支，最后的 `print` 都会执行，因为它缩进已经在分支之外。判断"某行是不是属于某个分支"，看的就是缩进——这一点和单独的 `if` 规则完全一致。

#### 2.6.1 两种最常见的缩进错误

**错误一：同一个分支体内缩进不一致**。分支体内部各行缩进必须相同，少一格多一格都会让解释器困惑：

```python
# 非法示例（不要运行）——分支体两行缩进不一致：
# if True:
#     print("第一行")
#   print("第二行")
```

会报 `IndentationError: unindent does not match any outer indentation level`。

**错误二：分支头下一行忘了缩进**。`if:`/`elif:`/`else:` 后面必须跟一个有缩进的语句体，哪怕只有一条语句：

```python
# 非法示例（不要运行）——else 后直接顶格写语句：
# if x > 0:
#     print("正")
# else:
# print("非正")
```

会报 `IndentationError: expected an indented block`。如果暂时不想写任何语句，用 `pass` 占位（见 2.7）。

### 2.7 分支暂时为空：pass

有时候某个分支"暂时不需要做事"，但为了结构完整又必须写一个分支体。Python 不允许空的语句体，这时用 `pass` 占位——它什么都不做，单纯满足"这里要有语句"的语法要求。

```python
amount = 88

if amount > 100:
    print("大额，需要审批")
elif amount > 0:
    # 正常金额直接放行，暂无额外处理
    pass
else:
    print("金额为 0 或负数，请检查")
```

`pass` 常见于这几种场合：搭代码骨架时先占位、某个分支"按设计就不需要动作"、以后再补逻辑的占位符。一个分支体里 `pass` 可以和别的语句共存，但只要分支体里有任何一条真实语句，`pass` 就不再是必需的。

### 2.8 典型应用场景

多分支在实际开发里出现频率极高，几个最典型的场景如下。每个场景的写法模式都可以照搬。

#### 2.8.1 分档判定（区间判断）

成绩、温度、价格……凡是"把一个连续数值切成几段"的需求，都用多分支。**关键点是按严格度从高到低排序**，否则宽松条件会吃掉严格条件：

```python
def grade_of(score):
    if not 0 <= score <= 100:
        return "非法成绩"
    if score >= 90:
        return "A 优秀"
    elif score >= 80:
        return "B 良好"
    elif score >= 70:
        return "C 中等"
    elif score >= 60:
        return "D 及格"
    else:
        return "E 不及格"

for s in [95, 83, 72, 60, 45, 120]:
    print(f"  {s:>4} → {grade_of(s)}")
```

**运行结果**：

```text
    95 → A 优秀
    83 → B 良好
    72 → C 中等
    60 → D 及格
    45 → E 不及格
   120 → 非法成绩
```

注意这里把"非法成绩"放在最前面单独用 `if`，因为它的判断维度（范围是否合法）和后面（合法范围内的档位）不同，先排除非法输入能让后面的 `elif` 只关注合法情况。

#### 2.8.2 菜单 / 指令分发

CLI 工具、交互式菜单、命令处理器都是"根据一个离散的输入走不同逻辑"，用多分支最自然：

```python
def handle_menu(choice):
    if choice == "1":
        return "执行：查看余额"
    elif choice == "2":
        return "执行：存款"
    elif choice == "3":
        return "执行：取款"
    elif choice == "4":
        return "执行：转账"
    elif choice in ("q", "Q"):
        return "退出系统"
    else:
        return "无效输入，请重新选择"

for ch in ["1", "3", "9", "q"]:
    print(f"  输入 {ch!r} → {handle_menu(ch)}")
```

**运行结果**：

```text
  输入 '1' → 执行：查看余额
  输入 '3' → 执行：取款
  输入 '9' → 无效输入，请重新选择
  输入 'q' → 退出系统
```

#### 2.8.3 分段计费

水费、电费、快递费常采用阶梯价格，分段计算天然适合多分支：

```python
def water_fee(tons):
    # 阶梯水价：0~12 吨 2.5 元、12~20 吨 3.5 元、超过 20 吨 4.5 元
    if tons <= 12:
        fee = tons * 2.5
    elif tons <= 20:
        fee = 12 * 2.5 + (tons - 12) * 3.5
    else:
        fee = 12 * 2.5 + 8 * 3.5 + (tons - 20) * 4.5
    return round(fee, 2)

for t in [8, 15, 26]:
    print(f"  用水 {t} 吨 → 应缴 {water_fee(t)} 元")
```

**运行结果**：

```text
  用水 8 吨 → 应缴 20.0 元
  用水 15 吨 → 应缴 40.5 元
  用水 26 吨 → 应缴 85.0 元
```

分段计费里 `elif` 之所以能省掉下界判断，正是靠"命中即停"——到了 `elif tons <= 20` 时，`tons > 12` 已经隐含成立（否则会在前一个分支命中），所以不用写 `12 < tons <= 20`。

#### 2.8.4 按对象类型分发

处理一个"类型不确定"的输入时，先按类型分流到不同处理逻辑，`else` 收尾未知类型：

```python
def describe(obj):
    if isinstance(obj, str):
        return f"字符串，长度 {len(obj)}"
    elif isinstance(obj, (int, float)):
        return f"数字，是否为正：{obj > 0}"
    elif isinstance(obj, (list, tuple)):
        return f"序列，元素个数 {len(obj)}"
    elif isinstance(obj, dict):
        return f"字典，键个数 {len(obj)}"
    elif obj is None:
        return "空值 None"
    else:
        return f"其他类型：{type(obj).__name__}"

for o in ["hello", 42, [1, 2, 3], {"a": 1}, None, {1, 2}]:
    print(f"  {o!r:24} → {describe(o)}")
```

**运行结果**：

```text
  'hello'                  → 字符串，长度 5
  42                       → 数字，是否为正：True
  [1, 2, 3]                → 序列，元素个数 3
  {'a': 1}                 → 字典，键个数 1
  None                     → 空值 None
  {1, 2}                   → 其他类型：set
```

## 3. 最佳实践

### 3.1 互斥多分支必须用 elif，而不是多个独立 if

这是多分支里**最经典也最危险**的错误。当你想要"在多个互斥选项里挑一个"时，必须用 `if-elif-...-else` 串成一条链。如果写成多个独立的 `if`，命中即停的特性就没了——每个 `if` 都会被独立判断，重叠的范围会**多次命中**，得到非预期的结果。

```python
score = 85

# ❌ 不推荐：用多个独立 if 表达互斥
# 85 会同时命中后三个分支，grade 被覆盖成最后一个
if score >= 60:
    grade = "及格"
if score >= 75:
    grade = "良好"
if score >= 90:
    grade = "优秀"
print(grade)  # 输出"良好"，但执行了 3 次判断，且语义混乱
```

```python
score = 85

# ✅ 推荐：互斥用 elif，命中即停，语义清晰
if score >= 90:
    grade = "优秀"
elif score >= 75:
    grade = "良好"
elif score >= 60:
    grade = "及格"
else:
    grade = "不及格"
print(grade)  # 输出"良好"，且只判断到第二个分支就停了
```

**为什么独立 if 会出错**：每个 `if` 都是独立的判断，前面命中并不阻止后面继续判断。当多个条件**可以同时为真**时（比如 85 同时 `>= 60`、`>= 75`），赋值会一次次被覆盖，最后留下的是最后一个命中分支的结果——这通常不是你想要的"选一个"语义。

**何时才算"真的该用独立 if"**：只有当这些判断**彼此独立、互不影响、可能同时都要执行**时，才用多个独立 `if`。比如"检查多个独立的校验项"：每个 if 处理自己的情况，互不排斥，对应的就该是独立 `if`，而不是 elif。

### 3.2 区间判断要按顺序写，避免条件重叠与顺序错乱

分档判定最容易踩两个坑：**条件写重叠**和**顺序排错了**。

**坑一：条件重叠导致边界归属混乱**。想表达"0-59 不及格、60-79 及格、80-100 优秀"，如果用两个 `if` 而不是 `elif`，边界 60 附近的值会同时命中多个条件：

```python
score = 60

# ❌ 不推荐：独立 if + 重叠区间，60 会命中前两个分支
if 0 <= score < 60:
    g = "不及格"
if 60 <= score < 80:
    g = "及格"
if 80 <= score <= 100:
    g = "优秀"
print(g)
```

```python
score = 60

# ✅ 推荐：elif 串成互斥链，边界只归属第一个命中的区间
if 0 <= score < 60:
    g = "不及格"
elif 60 <= score < 80:
    g = "及格"
elif 80 <= score <= 100:
    g = "优秀"
else:
    g = "成绩不在 0~100 范围内"
print(g)  # 60 → 及格
```

**坑二：区间顺序写反，宽松条件挡住严格条件**。分档时如果从小到大排（宽松在前），大值会被第一个宽松条件吃掉，永远到不了后面的严格条件：

```python
score = 85

# ❌ 不推荐：从小到大排，85 命中 score >= 60 就停了，到不了 >= 90
if score >= 60:
    grade = "及格"
elif score >= 75:
    grade = "良好"
elif score >= 90:
    grade = "优秀"
print(grade)  # 输出"及格"，把 85 错判成及格
```

```python
score = 85

# ✅ 推荐：从严格到宽松排，严格条件先被检查
if score >= 90:
    grade = "优秀"
elif score >= 75:
    grade = "良好"
elif score >= 60:
    grade = "及格"
else:
    grade = "不及格"
print(grade)  # 输出"良好"，正确
```

**口诀**：分档判断时，把**最严格（门槛最高）的条件放最前**。这样每个 `elif` 才能靠"前面没命中"隐式获得下界，不必再写 `and` 拼区间。

如果两个区间有明确的上下界，写成完全互斥的区间也可以，此时顺序不影响正确性，但仍建议保持阅读顺序自然。

### 3.3 把最可能命中的分支放前面

多分支是自上而下短路求值的——前面的条件先被算，命中即停。这意味着**把最可能命中的分支放前面，可以减少不必要的条件求值**，在分支很多、条件较重的场景下能带来可感知的性能差异。

```python
# 假设绝大多数请求是 200，少量是 404，极少数是 500
status = 200

# ✅ 推荐：高频分支在前，绝大多数请求一次判断就结束
if status == 200:
    result = "成功"
elif status == 404:
    result = "未找到"
elif status == 500:
    result = "服务器错误"
else:
    result = "其他"
```

这条建议是"优化层面"的，不是"正确性层面"的——顺序写反不会让结果出错（只要区间不重叠），但会让平均判断次数变多。当分支数量少、条件很简单时，优先考虑**可读性和业务逻辑的自然顺序**，不必为了性能牺牲清晰度。

### 3.4 分支体保持短，复杂逻辑抽函数

多分支的价值在于"一眼看出有哪些决策方向"。如果某个分支体塞了十几行细节逻辑，决策结构就被埋没了。更好的做法是**分支体只保留"判断 + 派发"，细节交给函数**。

```python
# ❌ 不推荐：分支体塞满细节，扫一眼看不出决策结构
def handle_order(order):
    if order.status == "paid":
        # 一堆发货细节……
        warehouse = pick_warehouse(order.address)
        items = check_stock(order.items, warehouse)
        shipment = create_shipment(items, warehouse)
        send_email(order.user, shipment)
        return shipment
    elif order.status == "refunded":
        # 一堆退款细节……
        refund = calc_refund(order)
        update_balance(order.user, refund)
        notify_refund(order.user, refund)
        return refund
    elif order.status == "cancelled":
        ...
```

```python
# ✅ 推荐：分支只保留"判断 + 派发"，细节交给函数
def handle_order(order):
    if order.status == "paid":
        return ship_order(order)
    elif order.status == "refunded":
        return process_refund(order)
    elif order.status == "cancelled":
        return cancel_order(order)
    else:
        raise ValueError(f"未知订单状态：{order.status}")
```

抽函数后，多分支本身只剩几行，决策逻辑一目了然；每个分支的具体实现独立存放、独立测试，也更便于维护。

### 3.5 用字典分发替代过长的 elif 链

当 elif 链长到几十个，且每个分支都是"根据一个键走对应处理"的相同模式时，把它改造成**字典分发**通常更清爽：把"键 → 处理函数"放进一个字典，运行时查表调用。

```python
# ❌ 不推荐：elif 链太长，每个分支结构雷同
def calc(op, a, b):
    if op == "add":
        return a + b
    elif op == "sub":
        return a - b
    elif op == "mul":
        return a * b
    elif op == "div":
        return a / b
    elif op == "mod":
        return a % b
    elif op == "pow":
        return a ** b
    else:
        raise ValueError(f"不支持的操作：{op}")
```

```python
# ✅ 推荐：字典分发，结构清晰，新增操作只改字典
def calc(op, a, b):
    ops = {
        "add": lambda x, y: x + y,
        "sub": lambda x, y: x - y,
        "mul": lambda x, y: x * y,
        "div": lambda x, y: x / y,
        "mod": lambda x, y: x % y,
        "pow": lambda x, y: x ** y,
    }
    if op not in ops:
        raise ValueError(f"不支持的操作：{op}")
    return ops[op](a, b)
```

**何时该换成字典分发**：

| 情况 | 更适合的写法 |
|------|------------|
| 分支少于 5 个 | if-elif-else，直观 |
| 分支 5~10 个，结构雷同 | 可考虑字典分发，但 if-elif 也能接受 |
| 分支超过 10 个，且都是"键 → 处理"模式 | 字典分发，明显更优 |
| 各分支条件是复杂范围判断（非等值匹配） | 仍用 if-elif-else，字典不适合区间匹配 |

注意：字典分发只适合"等值匹配 + 每个分支结构相似"的场景。如果条件是区间判断（`score >= 90`）、组合判断（`x > 0 and y < 0`）等复杂逻辑，老老实实用 if-elif-else 更合适。

### 3.6 常见错误模式速查表

把多分支里高频踩的坑汇总成一张速查表，写代码时可以对照检查：

| 错误模式 | 错误示例 | 后果 | 正确做法 |
|---------|---------|------|---------|
| 互斥分支用独立 if | 多个 `if x>0:` `if x>2:` | 重叠范围多次命中 | 用 `if-elif-else` 串成链 |
| 分档区间顺序写反 | 先 `if s>=60:` 后 `elif s>=90:` | 大值被吃了，到不了严格条件 | 严格条件放前面 |
| 区间边界重叠 | 多个独立 if 写重叠区间 | 边界归属混乱 | 用 elif 互斥，边界只归一处 |
| else 后面加条件 | `else (x < 0):` | 语法错误 | else 不写条件 |
| 多个 else 串联 | `if: ... else: ... else:` | 语法错误 | 一条链最多一个 else |
| elif 前面没有 if | 单独 `elif x > 0:` | 语法错误 | elif 必须跟在 if 或 elif 后 |
| 分支体忘了缩进 | `else:` 下一行顶格 | IndentationError | 冒号后必须缩进，空体用 pass |
| 区间靠顺序隐式下界 | 既想独立可读又省略下界 | 顺序一错就出 bug | 靠 elif 顺序或显式写上下界 |
| 空对象判断写太啰嗦 | `if len(xs) != 0:` | 冗余 | `if xs:` 更简洁 |
| 兜底静默吞掉意外输入 | else 里 `pass` | 隐藏 bug | else 里抛错或记日志 |

## 4. 原理

### 4.1 字节码视角：一组条件跳转

多分支到底是怎么执行的？用 `dis` 模块看一看字节码就能明白。Python 把 `if-elif-else` 编译成一组"求值条件 → 条件跳转"的指令，本质就是一连串跳转。

```python
import dis

def grade(score):
    if score >= 90:
        return "A"
    elif score >= 80:
        return "B"
    elif score >= 60:
        return "C"
    else:
        return "D"

dis.dis(grade)
```

**运行结果**（节选关键指令）：

```text
  3           0 RESUME 0
  4           2 LOAD_FAST 0 (score)
              4 LOAD_CONST 1 (90)
              6 COMPARE_OP 4 (>=)
             10 POP_JUMP_IF_FALSE ... (跳到下一个 elif)
             ...执行 return "A"
  6     -->  求值 score >= 80
              POP_JUMP_IF_FALSE ... (跳到再下一个)
             ...执行 return "B"
  8     -->  求值 score >= 60
              POP_JUMP_IF_FALSE ... (跳到 else)
             ...执行 return "C"
 10     -->  执行 return "D"
```

可以看出多分支在字节码层面的形状：每个条件先求值成布尔，再用 `POP_JUMP_IF_FALSE`（为假则跳走）指令跳到下一个分支的去处。命中即停体现为——一旦某个条件为真，就执行对应分支体并 `return`/跳到链尾，后面所有 `POP_JUMP_IF_FALSE` 都不会再执行。`else` 没有条件，所以它前面没有 `COMPARE_OP` 和 `POP_JUMP_IF_FALSE`，只是一个"前面都没跳进任何分支就自然落到这里"的落脚点。

### 4.2 为什么 elif 要写成单独关键字

很多语言的多分支用的是 `else if` 两个词（如 C、Java、JavaScript），Python 却把 `else if` 合并成了 `elif` 一个关键字。这背后有明确的设计考量：

| 维度 | `else if`（两词） | `elif`（一词） |
|------|------------------|---------------|
| 缩进层级 | 每多一个分支多一层缩进 | 始终保持一层 |
| 可读性 | 分支多时"向右漂移" | 扁平，像选项列表 |
| 输入成本 | 要打两个词 | 一个词 |
| 嵌套展开 | 和嵌套 if-else 等价 | 等价但更紧凑 |

Python 的一大理念是用**缩进**表达块结构，这也带来一个副作用：如果用 `else if`，每个分支都要再缩进一层，几层下来代码就漂到屏幕右边了。`elif` 把"再判断"压在同一层级，避免缩进军备竞赛。这正是前面 2.3 节"嵌套展开 vs elif 扁平"对比的字节码级原因——两者编译出的指令完全相同，区别只在书写时的缩进层级。

### 4.3 多分支 vs 独立 if 的执行差异

"用 elif 串成链"和"用多个独立 if"在执行层面有本质区别。用一段代码把两者的执行路径都画出来：

```python
score = 85

# 方式一：elif 链（命中即停）
print("--- elif 链 ---")
if score >= 90:
    print("命中 >=90")
elif score >= 80:
    print("命中 >=80")   # 命中这里后，下面不再判断
elif score >= 60:
    print("命中 >=60")   # 不会执行
else:
    print("命中 else")

# 方式二：独立 if（每个都判断）
print("--- 独立 if ---")
if score >= 90:
    print("命中 >=90")
if score >= 80:
    print("命中 >=80")   # 命中
if score >= 60:
    print("命中 >=60")   # 也命中
```

**运行结果**：

```text
--- elif 链 ---
命中 >=80
--- 独立 if ---
命中 >=80
命中 >=60
```

`elif` 链只输出一行——命中 `>=80` 后整条链结束；独立 `if` 输出两行——后面 `>=60` 仍被独立判断并再次命中。字节码上，`elif` 链里每个分支体执行后会跳到"整条链结束"的位置（通过 `JUMP_FORWARD` 类指令），所以命中后再也不会走到下面的条件求值；独立 `if` 之间没有这种跳转关系，每个都是独立的判断块，互不影响。

这不仅是"性能差异"，更是"语义差异"：`elif` 表达"多选一"（互斥），独立 `if` 表达"各自判断"（可能都做）。写代码时要想清楚你要的是哪种语义，再选对应语法——选错语义比写错缩进更难发现。

## 5. 总结

本文围绕 `if-elif-else` 多分支结构展开，主要介绍了以下内容：

- 多分支是什么：在多个互斥方向中挑一个的语法，是二分支的扩展版，中间插入任意多个 `elif`
- 执行流程：自上而下逐个求值条件，命中第一个为真的分支后立即跳出整条链，具有短路特性
- elif 的本质：`else if` 两步的缩写，把"再判断"压在同一层级，避免嵌套导致的缩进军备竞赛
- else 兜底分支：不写条件、最多一个、放最后，负责"以上都不满足时的默认归属"，没它会静默跳过
- 条件表达式：任意对象都能当条件，靠真值测试规则转布尔，空串/0/None/空容器为假
- 分支体归属：完全由缩进决定，冒号后必须有缩进语句体，暂空用 `pass` 占位
- 典型场景：分档判定、菜单分发、分段计费、按类型分发，都有可照搬的写法模式
- 最佳实践：互斥用 elif 而非独立 if、分档按严格度排序、高频分支前置、分支体抽函数、过长 elif 链改字典分发
- 原理：字节码层面是一组"求值 + 条件跳转"，`elif` 与 `else if` 嵌套编译结果相同，区别只在书写层级
