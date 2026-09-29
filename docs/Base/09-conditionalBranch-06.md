---
group:
  title: 【09】条件分支
  order: 9
order: 6
title: 嵌套 if 语句
nav:
  title: Python基础
  order: 1
---

# 嵌套 if 语句

## 1. 介绍

### 1.1 什么是嵌套 if 语句

单分支 `if` 解决"满足条件就做某事"的问题；二分支 `if-else` 解决"二选一"的问题；多分支 `if-elif-else` 解决"多选一"的问题。但现实里很多判断不是一层就能说清的——会员先看身份，再看金额；登录先看用户名在不在，再看密码对不对，还要看账号有没有被禁用；坐标先看 x 正负，再看 y 正负才能定象限。这类判断的特点是：**外层条件成立后，还要再做一次（甚至多次）判断才能确定最终走向**。

嵌套 `if` 语句就是用来处理这种"判断里有判断"的语法：把一个完整的 `if` 结构整个放进另一个 `if` 的分支体里，让判断层层递进。外层先做一次筛选，筛掉一批不满足的情况；留下的再进内层做更细的判断。

**一句话定位**：嵌套 `if` 是把一个 `if` 语句完整地放在另一个 `if` 的分支体内，用"先外后内、逐层下钻"的方式表达"满足 A 之后还要满足 B"这类分层判断逻辑。

### 1.2 最简示例

先用一个最小例子看清嵌套 `if` 的长相：商场会员折扣，先判会员身份，再按金额分档。

```python
is_vip = True
amount = 1500  # 试试改成 False、100、2000 看走向如何变化

if is_vip:
    # 外层命中"是会员"后，内部再做金额分档
    if amount >= 1000:
        discount = 0.8    # 会员 + 大额 → 八折
    elif amount >= 500:
        discount = 0.85   # 会员 + 中额 → 八五折
    else:
        discount = 0.9    # 会员 + 小额 → 九折
else:
    # 非会员走另一支
    if amount >= 1000:
        discount = 0.95   # 普通用户大额 → 九五折
    else:
        discount = 1.0    # 普通用户小额 → 不打折

print(f"实付金额：{amount * discount}")
```

**运行结果**：

```text
实付金额：1200.0
```

`is_vip` 为 `True` 时进入外层 `if` 的分支体，里面又是一个完整的 `if-elif-else`，按 `amount` 分出三档折扣。如果 `is_vip` 改成 `False`，外层直接走 `else`，里面"是会员"那一整段金额分档**根本不会被求值**——这就是嵌套的核心行为：外层不命中，内层压根不执行。

### 1.3 语法骨架总览

嵌套 `if` 的完整骨架如下，把一个 `if` 结构整体缩进到另一个 `if` 的分支体里：

```text
if 外层条件:
    if 内层条件1:
        内层分支体1
    elif 内层条件2:
        内层分支体2
    else:
        内层兜底分支
else:
    外层不命中时执行的分支体
```

几个要点先记在心里，后面逐一展开：

- 内层 `if` 必须整体缩进到外层某个分支体内部，缩进几格就属于哪一层。
- 外层条件不成立时，内层的所有条件**一次都不会被求值**。
- 嵌套层数没有硬性上限，但层数越多越难读，实际开发通常控制在 2~3 层。
- `elif`、`else` 在嵌套里的用法和单层完全一致，只是多了一层"外层壳"。
- 内层和外层各自有完整的 `if-elif-else` 结构，互不干扰。

## 2. 核心内容

### 2.1 基本形态：外层判断里再套一层判断

嵌套 `if` 和单层 `if` 最大的区别，是分支体内部**又是一个完整的判断结构**。外层负责第一次筛选，内层在筛选结果里再做细分。

用一个登录场景对比单层和嵌套：

**单层 if（用 and 拼条件，扁平但条件会很长）**：

```python
username = "alice"
password = "123456"

# 把两个判断用 and 拼成一个条件
if username == "alice" and password == "123456":
    print("登录成功")
else:
    print("登录失败")
```

**运行结果**：

```text
登录成功
```

**嵌套 if（分层判断，每层只关心一件事）**：

```python
username = "alice"
password = "123456"

if username == "alice":
    # 先确认用户名，对了再往下看密码
    if password == "123456":
        print("登录成功")
    else:
        print("密码错误")
else:
    print("用户名不存在")
```

**运行结果**：

```text
登录成功
```

两种写法结果一样，但信息量不同：单层 `if` 只能告诉你"成功/失败"，失败时不知道是用户名错了还是密码错了；嵌套 `if` 把每一层的失败原因都区分开——用户名不对说"用户名不存在"，用户名对了密码不对说"密码错误"。这正是嵌套的价值：**每一层负责一个判断维度，能区分出更细的失败原因**。

**分层判断**是理解嵌套的关键——外层筛掉一批情况，剩下的进入内层再筛。每一层只关注一个维度，逻辑被自然地拆成"先确认 A，A 成立后再确认 B"的递进结构，而不是把所有条件揉成一个又长又难读的 `and` 表达式。

### 2.2 执行流程：先外后内，逐层下钻

嵌套 `if` 的执行流程可以用下面这张图概括，关键是"外层不命中，内层直接跳过"：

```text
求值 外层条件(bool)?
    ├─ 真 → 进入外层分支体
    │         求值 内层条件(bool)?
    │             ├─ 真 → 执行内层分支体1
    │             └─ 假 → 求值下一个内层条件/兜底
    │         （内层整段结束后，回到外层分支体之外的代码）
    └─ 假 → 跳过整个内层结构
              执行外层 else 分支体（若有）
                                    ↓
                          嵌套结构之后的下一条语句
```

这套流程有两个重要推论：

**推论一：外层不命中时，内层条件根本不会被求值。** 这意味着内层可以安全地依赖"外层已经成立"这个前提——比如外层判断了列表非空，内层就可以直接取 `list[0]` 而不用担心 `IndexError`。

**推论二：内层的执行完全嵌在外层分支体里，外层分支体结束，内层才结束。** 要看清这一点：内层 `if` 整体属于外层某个分支，不会"漏"到外层之外。

用一个带打印标记的例子"亲眼"看到内层是否执行：

```python
age = 15

print("开始判断：")
if age >= 18:
    print("  外层 → 成年分支")
    if age >= 60:
        print("    内层 → 老年")
    else:
        print("    内层 → 成年非老年")
else:
    print("  外层 → 未成年分支")

print("  （外层没命中时，内层的两个条件一次都没被求值）")
```

**运行结果**：

```text
开始判断：
  外层 → 未成年分支
  （外层没命中时，内层的两个条件一次都没被求值）
```

输出里只打印了外层"未成年分支"，内层的"老年/成年非老年"两个判断压根没出现——因为 `age` 为 15 时外层 `age >= 18` 不成立，内层整段被跳过。这就是"先外后内"的直接体现。

### 2.3 缩进决定归属：else 归属于哪个 if

嵌套 `if` 里最容易出错的地方，就是搞不清某个 `else` 到底属于哪一层的 `if`。规则其实很简单：**`else` 与哪个 `if` 在缩进上对齐，就归属于谁**。缩进不同，归属就不同，执行结果也会跟着变。

先看内层 `if-else` 完整嵌在外层 `if` 里的标准写法：

```python
age = 22
has_ticket = True

if age >= 18:
    print(f"  成年({age}岁)，进入内层判断")
    if has_ticket:
        print("  有票 → 入场")
    else:
        print("  无票 → 请先购票")
else:
    print(f"  未成年({age}岁)，需家长陪同")
```

**运行结果**：

```text
  成年(22岁)，进入内层判断
  有票 → 入场
```

这里的 `else: print("  无票 → 请先购票")` 缩进在内层，属于内层 `if has_ticket`；最后的 `else: print(...未成年...)` 缩进退回到外层，属于外层 `if age >= 18`。靠的就是缩进对齐。

**缩进错位的陷阱**：同一段代码，把内层 `else` 向左退一级（让它属于外层），含义就完全变了。看下面两种写法的对比：

```python
age = 18
has_ticket = False

# 写法A：内层 else 缩进在内层，属于内层 if (has_ticket)
if age >= 18:
    if has_ticket:
        result_a = "成年且有票"
    else:
        result_a = "成年但无票"     # 这个 else 属于内层 has_ticket
else:
    result_a = "未成年"
print(f"写法A → {result_a}")
```

**运行结果**：

```text
写法A → 成年但无票
```

写法 A 里，`has_ticket` 为 `False` 命中内层 `else`，得到"成年但无票"。再看写法 B，把内层 `else` 去掉、让 `else` 退到外层对齐：

```python
age = 18
has_ticket = False

# 写法B：去掉了内层 else，外层 else 直接接住"未成年"
if age >= 18:
    if has_ticket:
        result_b = "成年且有票"
    # 这里没有内层 else，has_ticket 为假时内层什么都不赋值
else:
    result_b = "未成年"
print(f"写法B → result_b 未被赋值，else 已被外层接走")
```

**运行结果**：

```text
写法B → result_b 未被赋值，else 已被外层接走
```

写法 A 命中"成年但无票"；写法 B 里内层没有 `else`，`has_ticket` 为 `False` 时内层 `if` 什么都不做，`result_b` 压根没被赋值（这里只是演示归属，不真正访问 `result_b`，否则会 `NameError`）。同一个"成年 + 无票"的输入，因为 `else` 归属不同，行为天差地别。

记住这条规则，能帮你排查大量"逻辑怎么跑出来跟想的不一样"的 bug：**看缩进，找归属**。

### 2.4 嵌套层级：可以多层，但越深越要小心

嵌套不止两层。外层判断之后，内层命中了还可以再嵌一层，层层递进。层数没有硬性上限，但每多一层缩进就多一层心智负担，实际很少超过三层。

下面是一个三层嵌套的折扣计算，逐层解读每一层的归属：

```python
level = 2        # 用户等级
vip = True       # 是否会员
amount = 800     # 消费金额

if level >= 1:
    print(f"  L1: level={level} >= 1 命中")
    if vip:
        print("  L2: 是 VIP")
        if amount >= 500:
            print("  L3: 金额够，叠加会员折上折")
            final = amount * 0.8
        else:
            print("  L3: 金额不足，只享会员折扣")
            final = amount * 0.9
    else:
        print("  L2: 非会员，走普通价")
        final = amount * 0.95
else:
    print("  L1: level=0，新用户不发折扣")
    final = amount

print(f"  最终金额：{final}")
```

**运行结果**：

```text
  L1: level=2 >= 1 命中
  L2: 是 VIP
  L3: 金额够，叠加会员折上折
  最终金额：640.0
```

三个维度 `level`、`vip`、`amount` 像漏斗一样逐层筛选：先看等级够不够，再看是不是会员，最后看金额大不大，每过一关才进下一关。层数很深的嵌套读起来要"逐层下钻"，像剥洋葱——一层层往里看，哪一层没命中就跳到对应层的 `else`，不再往里走。

**互斥性**在嵌套里同样成立：内层 `if-elif-else` 自身的互斥规则不变，命中一个内层分支后内层结束；外层也是命中一个分支后结束。嵌套只是把多套互斥判断套在一起，各层各管各的互斥关系。

### 2.5 嵌套 if 与 elif 链的等价转换

很多场景下，嵌套 `if` 和 `elif` 链是等价的，可以互相转换。理解这种等价关系，能帮你判断"什么时候该用嵌套、什么时候该用 `elif`"。

以成绩等级为例，同一件事两种写法：

**嵌套写法：先及格/不及格，及格的内部再细分**：

```python
score = 83

if score >= 60:
    if score >= 90:
        grade1 = "A"
    elif score >= 80:
        grade1 = "B"
    else:
        grade1 = "C"
else:
    grade1 = "D"
print(f"嵌套写法：{score} → {grade1}")
```

**运行结果**：

```text
嵌套写法：83 → B
```

**elif 链写法：拉平，所有档位平铺一层**：

```python
score = 83

if score >= 90:
    grade2 = "A"
elif score >= 80:
    grade2 = "B"
elif score >= 60:
    grade2 = "C"
else:
    grade2 = "D"
print(f"elif 写法：{score} → {grade2}")
```

**运行结果**：

```text
elif 写法：83 → B
```

两种写法结果完全一致。区别在于：嵌套写法把"及格"作为一个显式的分组，及格内部再分 A/B/C，结构上更强调"及格线"这个分界；`elif` 链把所有档位拉平成一列，少一层缩进，更简洁。

**什么时候两者等价**：当内层判断和外层判断针对的是**同一个变量**（都是 `score`），且内层条件隐含了外层条件成立时（外层 `score >= 60` 成立，内层就只需在 `>= 60` 里继续分），嵌套和 `elif` 链等价，此时优先用 `elif` 链，更扁平、更好读。

**什么时候只能用嵌套**：当内层判断依赖外层判断成立的**前提**，或者内层用的是**不同变量**时，`elif` 链替代不了。比如外层判断"列表非空"，内层才能安全取首元素：

```python
items = [3, 1, 4]

if items:                  # 先确认列表非空，才能安全访问 items[0]
    if items[0] > 2:
        print(f"首元素 {items[0]} 大于 2")
    else:
        print(f"首元素 {items[0]} 不大于 2")
else:
    print("空列表，无法取首元素")
```

**运行结果**：

```text
首元素 3 大于 2
```

这里内层 `items[0] > 2` 依赖外层 `items` 非空这个前提——如果不先判空就直接 `items[0]`，空列表会抛 `IndexError`。这种"保护性嵌套"没法用 `elif` 拉平，因为内层动作的合法性建立在外层成立之上。

### 2.6 什么时候该用嵌套，什么时候该用 elif

把嵌套与 `elif` 的取舍规律整理成一张决策表，写代码时可以对照选择：

| 场景特征 | 更适合的写法 | 原因 |
|---------|------------|------|
| 单变量分档（成绩、温度区间） | `elif` 链 | 同一变量，命中即停，拉平更简洁 |
| 多变量组合（先会员后金额、先类型后值） | 嵌套 `if` | 维度不同，一层管一个变量更清晰 |
| 内层依赖外层成立的前提（先判空再取元素） | 嵌套 `if` | 内层动作的合法性依赖外层，`elif` 无法表达 |
| 内层需要在外层结果内进一步细分但变量相同 | 二者等价，优先 `elif` | 减少缩进层级 |
| 每层失败原因不同，需要分别报错 | 嵌套 `if` | 每层 `else` 能给出该层特有的失败信息 |
| 条件能用 `and` 一次拼完且不需要区分失败原因 | `if ... and ...` | 最扁平，无需嵌套 |

一个典型对比——订单状态判定，`submitted` 和 `paid` 两个布尔变量：

```python
submitted = True
paid = True

# 套层写法：两层 if，能区分三种失败/成功
if submitted:
    if paid:
        state1 = "已完成"
    else:
        state1 = "待支付"
else:
    state1 = "未提交"
print(f"套层写法 → {state1}")
```

**运行结果**：

```text
套层写法 → 已完成
```

```python
submitted = True
paid = True

# 扁平写法：用 if-elif 对照，逻辑更直白
if not submitted:
    state2 = "未提交"
elif not paid:
    state2 = "待支付"
else:
    state2 = "已完成"
print(f"扁平写法 → {state2}")
```

**运行结果**：

```text
扁平写法 → 已完成
```

两种写法结果一致。当条件只是几个布尔值的组合、且不需要"前置保护"时，用 `if-elif-else` 扁平展开往往比嵌套更清爽。**嵌套的价值体现在"外层是内层的前提"时**——没有这种依赖关系，就别硬套层。

### 2.7 真值测试在嵌套中的复用

`if` 后面的条件不一定是 `True`/`False`，Python 会用真值测试把任意对象转成布尔。这条规则在嵌套里同样适用，而且常常配合"保护性嵌套"一起用——外层用真值测试挡住空对象，内层再安全使用。

```python
value = ""  # 试试改成 None、0、[]、"hello"、[1,2] 看走向如何变化

if value:
    # 外层用真值测试挡住所有假值，进到这里 value 一定是真值
    print(f"值 {value!r} 非空，进一步处理")
    if isinstance(value, str):
        print(f"  是字符串，长度 {len(value)}")
    elif isinstance(value, (list, tuple)):
        print(f"  是序列，元素个数 {len(value)}")
    else:
        print(f"  其他真值类型：{type(value).__name__}")
else:
    # 所有假值（"", 0, None, [] 等）都落到这里统一处理
    print(f"值 {value!r} 为假值，跳过处理")
```

**运行结果**（`value = ""` 时）：

```text
值 '' 为假值，跳过处理
```

这种写法的好处是：外层 `if value:` 一行就挡住了空字符串、`0`、`None`、空列表等所有假值，内层不必再重复判断"是不是空"，可以直接假设 `value` 有内容，再按类型分流。如果外层不挡，内层对空对象取长度、取元素就可能出错或得到无意义结果。

**真值测试的假值清单**（在嵌套的外层判断里会反复用到）：

| 对象 | 为假（Falsy） | 为真（Truthy） |
|------|--------------|---------------|
| 数字 | `0`、`0.0`、`0j` | 非零数值 |
| 字符串 | 空串 `""` | 非空字符串 |
| 容器（list/tuple/dict/set） | 空容器 `[]`/`()`/`{}`/`set()` | 至少一个元素 |
| `None` | 恒为假 | —— |

### 2.8 分支暂时为空：pass 在嵌套中的占位

嵌套结构越复杂，越容易出现"某个分支暂时不需要做事"的情况。Python 不允许空的分支体，这时用 `pass` 占位——它什么都不做，单纯满足"这里要有语句"的语法要求。

```python
is_admin = False
has_perm = True

if is_admin:
    print("管理员，拥有全部权限")
elif has_perm:
    # 有权限但不是管理员，先放行，以后再补细粒度控制
    pass
else:
    print("无权限，拒绝访问")
```

**运行结果**：

```text
无权限，拒绝访问
```

`pass` 在嵌套里常见的用途：搭代码骨架时先占位、某个分支"按设计就不需要动作"、以后再补逻辑的占位符。如果分支体里已经有任何一条真实语句，`pass` 就不再是必需的。嵌套越深，骨架搭得越多，`pass` 出现的频率也越高——它保证结构完整，又不引入多余行为。

### 2.9 典型应用场景

嵌套 `if` 在实际开发里出现频率很高，下面几个场景的写法模式可以直接照搬。

#### 2.9.1 多重前置条件把关（登录校验）

登录往往要依次检查用户名是否存在、密码是否正确、账号是否被禁用，每一步失败都给出对应原因——这正是嵌套（或串行 `if`）"逐层把关"的典型用法：

```python
def login(users_db, username, password):
    # 第一层：用户名是否存在
    if username not in users_db:
        return "用户名不存在"
    # 第二层：密码是否正确
    if users_db[username]["password"] != password:
        return "密码错误"
    # 第三层：账号是否被禁用
    if users_db[username].get("disabled", False):
        return "账号已被禁用"
    return "登录成功"

users_db = {
    "alice": {"password": "123456", "disabled": False},
    "bob": {"password": "888888", "disabled": True},
}

for name, pwd in [("alice", "123456"), ("alice", "wrong"), ("bob", "888888"), ("david", "x")]:
    print(f"  {name:6} / {pwd:6} → {login(users_db, name, pwd)}")
```

**运行结果**：

```text
  alice  / 123456 → 登录成功
  alice  / wrong  → 密码错误
  bob    / 888888 → 账号已被禁用
  david  / x      → 用户名不存在
```

这里三步判断是**串行的前置条件**，不是 `if-elif-else` 的多选一——每一个 `if` 都是一个"守卫"，不满足就立刻返回。这种写法在后面"提前返回"小节会更详细地讨论。

#### 2.9.2 多维度组合判断（坐标象限）

坐标要先看 x 正负，再看 y 正负，两个维度组合出象限。外层按 x 分三类，内层各自再按 y 分三类：

```python
def quadrant(x, y):
    if x > 0:
        if y > 0:
            return "第一象限"
        elif y < 0:
            return "第四象限"
        else:
            return "x 正半轴"
    elif x < 0:
        if y > 0:
            return "第二象限"
        elif y < 0:
            return "第三象限"
        else:
            return "x 负半轴"
    else:
        if y > 0:
            return "y 正半轴"
        elif y < 0:
            return "y 负半轴"
        else:
            return "原点"

for px, py in [(3, 4), (-3, 4), (-3, -4), (3, -4), (0, 5), (0, 0)]:
    print(f"  ({px:>2}, {py:>2}) → {quadrant(px, py)}")
```

**运行结果**：

```text
  ( 3,  4) → 第一象限
  (-3,  4) → 第二象限
  (-3, -4) → 第三象限
  ( 3, -4) → 第四象限
  ( 0,  5) → y 正半轴
  ( 0,  0) → 原点
```

这是"多维度"判断的标准模板：外层管一个维度，内层管另一个维度，组合出所有情况。每一层只关心一个变量，逻辑清晰且不重不漏。

#### 2.9.3 保护性前置判断（安全访问）

访问可能为空的对象前，先用 `if` 判空做保护，确认非空再在内层安全使用——这种"保护性嵌套"在处理容器、可选值时极为常见：

```python
data = []  # 试试改成 [7, 2] 看区别

if data:                       # 先确认非空，才能安全访问 data[0]
    if data[0] >= 5:
        print(f"首元素 {data[0]} 够大，直接用")
    else:
        print(f"首元素 {data[0]} 不够大，需要补值")
else:
    print("数据为空，跳过首元素判断")
```

**运行结果**（`data = []` 时）：

```text
数据为空，跳过首元素判断
```

如果把外层 `if data:` 去掉，空列表执行 `data[0]` 会直接 `IndexError`。外层判断是内层安全访问的"许可证"，没有它内层就崩了。

#### 2.9.4 多条件叠加优惠

优惠规则常按"身份 × 行为 × 金额"几个维度叠加，嵌套能自然表达"先身份后金额"的优先级：

```python
def final_price(is_vip, is_first_order, amount):
    if is_vip:
        if is_first_order:
            return round(amount * 0.7, 2)   # VIP 首单七折
        elif amount >= 1000:
            return round(amount * 0.8, 2)   # VIP 大额八折
        else:
            return round(amount * 0.9, 2)   # VIP 普通九折
    else:
        if is_first_order:
            return round(amount * 0.85, 2)  # 普通首单八五折
        else:
            return round(amount * 0.95, 2)  # 普通用户九五折

for vip, first, amt in [(True, True, 1200), (True, False, 1200), (False, True, 300)]:
    print(f"  VIP={str(vip):5} 首单={str(first):5} 金额={amt:>4} → 实付 {final_price(vip, first, amt)}")
```

**运行结果**：

```text
  VIP=True 首单=True 金额=1200 → 实付 840.0
  VIP=True 首单=False 金额=1200 → 实付 960.0
  VIP=False 首单=True 金额= 300 → 实付 255.0
```

外层分会员/非会员两条路，每条路内部再按"首单/金额"细分。优惠力度从高到低排列，命中一个就停，保证用到最高一档可享优惠。

#### 2.9.5 成绩与出勤双重评定

当评定标准涉及多个独立维度，且每个维度都有"达标/不达标"两种结果时，嵌套能把 2×2 的四种组合都覆盖：

```python
def evaluate(score, attendance):
    if score >= 60:
        if attendance >= 0.8:
            return "通过"
        else:
            return "成绩达标但出勤不足，需补勤"
    else:
        if attendance >= 0.8:
            return "出勤达标但成绩不足，可补考"
        else:
            return "成绩与出勤均不达标，需重修"

for s, a in [(85, 0.9), (85, 0.5), (50, 0.9), (50, 0.4)]:
    print(f"  分数={s} 出勤={a} → {evaluate(s, a)}")
```

**运行结果**：

```text
  分数=85 出勤=0.9 → 通过
  分数=85 出勤=0.5 → 成绩达标但出勤不足，需补勤
  分数=50 出勤=0.9 → 出勤达标但成绩不足，可补考
  分数=50 出勤=0.4 → 成绩与出勤均不达标，需重修
```

四种组合各有对应的处理建议——这正是嵌套的强项：每个叶子分支都能表达一种特定的组合结果，而不是笼统的"通过/不通过"。

## 3. 最佳实践

### 3.1 控制嵌套深度，能用 and/elif 拉平就别套层

嵌套每多一层，代码就多一层缩进，读起来要多记一层"我现在在哪一分支里"。当条件之间没有"前置依赖"关系时，硬套层只会让代码向右漂移。能用 `and` 一次拼完、或能用 `elif` 拉平的，就不要套层。

```python
hour = 14

# ❌ 不推荐：单变量分档硬套三层，毫无必要地向右漂移
if hour >= 6:
    if hour < 12:
        period1 = "上午"
    else:
        if hour < 18:
            period1 = "下午"
        else:
            period1 = "晚上"
else:
    period1 = "凌晨"
print(period1)
```

```python
hour = 14

# ✅ 推荐：单变量分档用 elif 链拉平，一层搞定
if hour < 6:
    period2 = "凌晨"
elif hour < 12:
    period2 = "上午"
elif hour < 18:
    period2 = "下午"
else:
    period2 = "晚上"
print(period2)
```

两段代码结果一样，但第二段只有一层缩进，扫一眼就知道有哪些时段。判断要不要套层的标准很简单：**内层条件是否依赖外层成立的前提**。依赖就套层，不依赖就拉平。

### 3.2 避免重复判断：外层已保证的条件内层别再写

嵌套的一个天然优势是内层可以"免费"使用外层已经成立的前提。但很多人写的时候没利用这个优势，在外层已经判断过的条件，内层又重复写一遍，既冗余又容易出错。

```python
score = 85

# ❌ 不推荐：外层已保证 score >= 60，内层还写 60 <= score < 80，多余的 60<= 是冗余
if score >= 60:
    if score >= 90:
        grade1 = "A"
    elif 60 <= score < 80:   # 60<=score 已被外层保证，写 60<= 是废话
        grade1 = "C"
    else:
        grade1 = "B"
else:
    grade1 = "D"
print(grade1)
```

```python
score = 85

# ✅ 推荐：内层不必重复外层已保证的条件，直接用隐含前提
if score >= 60:
    if score >= 90:
        grade2 = "A"
    elif score >= 80:
        grade2 = "B"
    else:
        grade2 = "C"
else:
    grade2 = "D"
print(grade2)
```

进入内层时 `score >= 60` 已经是铁定的事实，内层只需在 `>= 60` 的基础上继续细分。重复写 `60 <= score` 不仅多余，一旦外层条件改了（比如改成 `>= 70`），内层没跟着改就会出 bug。

### 3.3 用提前返回（卫语句）减少嵌套层级

当嵌套是用来"逐层把关、不满足就退出"时，把"不满足就退出"提到最前面用 `return`/`continue` 提前返回，能把深层嵌套压扁成一层。这种写法叫"卫语句"（guard clause）。

以登录校验为例，对比嵌套和卫语句：

```python
# ❌ 不推荐：用嵌套层层包，正常逻辑被埋在最深处，要读好几层缩进才知道成功路径
def login_nested(users_db, username, password):
    if username in users_db:
        if users_db[username]["password"] == password:
            if not users_db[username].get("disabled", False):
                return "登录成功"
            else:
                return "账号已被禁用"
        else:
            return "密码错误"
    else:
        return "用户名不存在"
```

```python
# ✅ 推荐：用提前返回把异常情况一层层挡在门外，正常路径留在最外层，扁平清晰
def login_guard(users_db, username, password):
    if username not in users_db:
        return "用户名不存在"
    if users_db[username]["password"] != password:
        return "密码错误"
    if users_db[username].get("disabled", False):
        return "账号已被禁用"
    return "登录成功"
```

两种写法结果完全一样，但卫语句版本没有嵌套——每个失败条件单独一行 `if ... return`，一眼看到所有被挡的情况，最后的 `return "登录成功"` 是"所有关卡都过了"的自然结果。**当嵌套的每一层都是"不满足就 `else` 退出"时，多半能改成卫语句。**

### 3.4 复杂嵌套抽函数，保持分支体短小

嵌套的价值在于一眼看出"有哪些决策维度"。如果某个分支体塞了十几行细节逻辑，决策结构就被埋没了。更好的做法是分支体只保留"判断 + 派发"，细节交给函数。

```python
# ❌ 不推荐：分支体塞满细节，看不出决策结构
def handle_order(order):
    if order["status"] == "paid":
        warehouse = pick_warehouse(order["address"])
        items = check_stock(order["items"], warehouse)
        shipment = create_shipment(items, warehouse)
        send_email(order["user"], shipment)
        return shipment
    elif order["status"] == "refunded":
        refund = calc_refund(order)
        update_balance(order["user"], refund)
        notify_refund(order["user"], refund)
        return refund
    else:
        raise ValueError(f"未知状态：{order['status']}")
```

```python
# ✅ 推荐：分支只保留"判断 + 派发"，细节交给函数
def handle_order(order):
    if order["status"] == "paid":
        return ship_order(order)
    elif order["status"] == "refunded":
        return process_refund(order)
    else:
        raise ValueError(f"未知状态：{order['status']}")
```

抽函数后，分支体只剩几行，决策逻辑一目了然；每个分支的具体实现独立存放、独立测试，也更便于维护。嵌套越深，越要警惕"分支体太长"——长分支体加深层嵌套是最难读的组合。

### 3.5 保护性判断放在最外层

当内层操作依赖某个前置条件（比如"列表非空才能取首元素""对象非 None 才能调用方法"）时，保护性判断一定要放在最外层，先把危险情况挡掉，让内层可以放心使用。

```python
# ❌ 不推荐：不先判空就直接取元素，空列表会 IndexError
# values = []
# if values[0] > 0:       # 空列表在这里直接崩
#     print(values[0])

# ✅ 推荐：外层判空做保护，内层安全访问
values = [5, 2]
if values:
    if values[0] > 0:
        print(f"首元素 {values[0]} 为正")
    else:
        print(f"首元素 {values[0]} 非正")
else:
    print("列表为空，跳过判断")
```

**运行结果**：

```text
首元素 5 为正
```

这和"卫语句"思路一致：把可能出错的危险情况先用外层判空挡住，内层就能在"安全区"里直接操作，不用到处写防御性代码。

### 3.6 常见错误模式速查表

把嵌套 `if` 里高频踩的坑汇总成一张速查表，写代码时可以对照检查：

| 错误模式 | 错误示例 | 后果 | 正确做法 |
|---------|---------|------|---------|
| else 缩进错位归属错 | 内层 `else` 被写成外层 `else` | 逻辑跑出非预期分支 | 看缩进找归属，else 对齐哪个 if 就属谁 |
| 重复判断外层已保证的条件 | 外层 `>=60`，内层又写 `60<=x<80` | 冗余且外层改了内层易漏改 | 内层直接用隐含前提，不重复写 |
| 单变量分档过度嵌套 | 成绩分档套三层 if | 向右漂移，难读 | 用 elif 链拉平为一层 |
| 访问元素前不判空 | 直接 `if items[0]:` 不先判 `items` | 空容器 IndexError | 外层先判空做保护 |
| 该用卫语句却层层嵌套 | 多重前置条件都套在 if 里 | 正常路径埋在最深处 | 不满足就提前 return，压扁成一层 |
| 能用 and 一次拼完却硬套层 | `if a: if b: ...`（无依赖） | 多余缩进 | `if a and b:` 一次表达 |
| 嵌套太深不抽函数 | 每层分支体塞十几行细节 | 决策结构被埋没 | 分支只保留判断+派发，细节抽函数 |

## 4. 原理

### 4.1 字节码视角：嵌套 if 是如何跳转的

嵌套 `if` 到底是怎么执行的？用 `dis` 模块看一看字节码就能明白。和单层 `if` 一样，Python 把每个条件编译成"求值条件 → 条件跳转"的指令，嵌套只是把这些指令按缩进层级组织在一起，外层的跳转目标指向"整段嵌套结束之后"。

```python
import dis

def discount(is_vip, amount):
    if is_vip:
        if amount >= 1000:
            return 0.8
        else:
            return 0.9
    else:
        return 1.0

dis.dis(discount)
```

**运行结果**（节选关键指令）：

```text
  3           0 RESUME 0
  4           2 LOAD_FAST 0 (is_vip)
              4 POP_JUMP_IF_FALSE ... (跳到外层 else)
  5     -->   6 LOAD_FAST 1 (amount)
              8 LOAD_CONST 2 (1000)
             10 COMPARE_OP 4 (>=)
             12 POP_JUMP_IF_FALSE ... (跳到内层 else)
  6          14 LOAD_CONST 3 (0.8)
             16 RETURN_VALUE
  8     -->  18 LOAD_CONST 4 (0.9)
             20 RETURN_VALUE
 10     -->  22 LOAD_CONST 5 (1.0)
             24 RETURN_VALUE
```

可以看出嵌套在字节码层面的形状：外层先 `POP_JUMP_IF_FALSE` 跳到外层 `else`，命中后才执行内层的 `amount >= 1000` 求值，内层再 `POP_JUMP_IF_FALSE` 跳到内层 `else`。外层不成立时，那段指向内层的指令**根本不会执行**——这正对应了"外层不命中，内层不求值"的行为。跳转目标随着嵌套层级嵌套在一起，外层跳转跨过整个内层结构，内层跳转只跨过内层自己的分支体。

### 4.2 嵌套 if 与 elif 链的字节码等价性

当嵌套 `if` 和 `elif` 链在逻辑上等价时，它们编译出的字节码也几乎相同。用成绩等级的两种写法对比：

```python
import dis

# 嵌套写法
def grade_nested(score):
    if score >= 60:
        if score >= 80:
            return "B"
        else:
            return "C"
    else:
        return "D"

# elif 链写法
def grade_elif(score):
    if score >= 80:
        return "B"
    elif score >= 60:
        return "C"
    else:
        return "D"

print("--- 嵌套写法 ---")
dis.dis(grade_nested)
print("--- elif 链写法 ---")
dis.dis(grade_elif)
```

两种写法的字节码都是"求值条件 → POP_JUMP_IF_FALSE → return"的重复，指令数量和跳转结构高度相似。这说明**当逻辑等价时，嵌套和 elif 链在执行层面没有本质区别**——选择哪种写法，完全是可读性和表达意图的考量，而不是性能考量。

理解这一点很重要：前面说"单变量分档优先用 elif 链"，不是因为 `elif` 跑得更快，而是因为 `elif` 链少一层缩进、更扁平、更能体现"多选一"的意图。嵌套则在"外层是内层前提"时更自然地表达"先 A 再 B"的递进关系，两种写法各有所长。

### 4.3 为什么 Python 需要嵌套而不是只有 elif

有人会问：既然 `elif` 链已经能表达多分支，为什么还需要嵌套 `if`？答案在于 `elif` 链只能表达"同一个层级的多选一"，而**有些判断天然是分层的**，硬用 `elif` 拉平反而会丢失结构信息或让条件变得冗长。

对比两种写法表达"先判列表非空，再判首元素大小"：

```python
items = [5, 2]

# 嵌套写法：外层判空，内层安全取首元素，层次关系清楚
if items:
    if items[0] > 0:
        print("首元素为正")
    else:
        print("首元素非正")
else:
    print("空列表")
```

```python
items = [5, 2]

# 硬用 elif 拉平：条件变冗长，且 items[0] 的安全性靠顺序隐式保证
if not items:
    print("空列表")
elif items[0] > 0:      # 到这里 items 一定非空，但这个保证是被顺序带来的
    print("首元素为正")
else:
    print("首元素非正")
```

第二种写法虽然能跑（因为 `not items` 命中时不会走到 `items[0]`），但"先判空"和"再判值"的层次关系被压平了，读者要从条件顺序里反推出"走到 `items[0]` 时列表一定非空"这个隐含前提。嵌套则把这个前提**显式地**写在缩进结构里——外层判空是内层取值的许可证，一眼可见。

这就是 Python 同时保留 `elif` 链和嵌套 `if` 的原因：`elif` 链擅长"同级多选一"，嵌套擅长"分层递进判断"。两者互补，各管一类结构。写代码时把判断的逻辑层次想清楚——是"平级多个选项"还是"先 A 再 B 的递进"——再选对应的写法，代码才能既正确又好读。

## 5. 总结

本文围绕嵌套 `if` 语句展开，主要介绍了以下内容：

- 嵌套 `if` 是什么：把一个 `if` 结构整体放进另一个 `if` 的分支体里，用"先外后内、逐层下钻"表达分层判断逻辑
- 执行流程：外层先求值，命中后才进入内层求值；外层不命中时内层条件一次都不会被求值，内层可安全依赖外层成立的前提
- 缩进决定归属：`else` 与哪个 `if` 缩进对齐就归属谁，缩进错位会直接改变语义，是嵌套里最常见的 bug 来源
- 嵌套层级：可以多层递进，但层数越多越难读，实际通常控制在 2~3 层
- 嵌套与 `elif` 链的等价转换：单变量分档两者等价优先用 `elif`；多维度组合、保护性前置判断只能用嵌套
- 何时用嵌套：内层依赖外层成立的前提、多个维度需要分别把关、每层失败原因不同需要分别报错时，用嵌套；条件无依赖时用 `and` 或 `elif` 拉平
- 真值测试在嵌套中的复用：外层用真值测试挡住所有假值，内层可直接假设对象有内容再按类型分流
- `pass` 占位：嵌套越深越常出现"某分支暂不需要做事"，用 `pass` 满足"分支体不能为空"的语法要求
- 典型场景：多重前置条件把关、多维度组合判断、保护性前置判空、多条件叠加优惠、成绩出勤双重评定，都有可直接照搬的写法模板
- 最佳实践：控制嵌套深度、避免重复判断、用卫语句提前返回减少层级、复杂嵌套抽函数、保护性判断放最外层
- 原理：字节码层面嵌套是"外层跳转跨过整个内层、内层跳转只跨过自己分支体"的条件跳转组合；逻辑等价时嵌套与 `elif` 链的字节码高度相似，选哪种是可读性考量而非性能考量；Python 保留两者是因为 `elif` 擅长同级多选一、嵌套擅长分层递进，二者互补
