---
group:
  title: 【09】条件分支
  order: 9
order: 8
title: 逻辑运算符与条件组合
nav:
  title: Python基础
  order: 1
---

# 逻辑运算符与条件组合

## 1. 介绍

### 1.1 什么是逻辑运算符

单个比较运算符能表达的只是一个关系——"年龄够不够 18"、"密码对不对"。但真实的判断往往要组合多个关系："成年**且**有票才放行"、"是会员**或**有券就能优惠"、"**不是**管理员就限制权限"。要把几个条件拼成一个复合条件，或把一个条件的结果"反过来"用，就需要**逻辑运算符**。

Python 提供三个逻辑运算符：`and`（与）、`or`（或）、`not`（非）。`and` 表示"两边都真才真"，`or` 表示"一边真就真"，`not` 表示"取反"。它们是构造复合条件的核心工具——`if` 后面的条件，很多都是由比较运算符先算出一个个布尔值，再用 `and`/`or`/`not` 拼装而成的。

逻辑运算符有一个在 Python 里特别重要、但很多人没意识到的特性：**`and`/`or` 的返回值不是 `True`/`False`，而是它求值过程中"决定结果的那一个操作数"**。这让它既能当布尔逻辑用，又能衍生出"提供默认值"之类的实用惯用法。

**一句话定位**：逻辑运算符把多个条件按"且/或/非"的方式组合成复合条件，是 `if` 表达多条件判断的标准工具，且 `and`/`or` 会短路求值并返回操作数本身。

### 1.2 最简示例

先用一个最小例子看清逻辑运算符在条件里怎么用：成年且有票才放行。

```python
age = 22
has_ticket = True

if age >= 18 and has_ticket:        # 两个条件都满足才进 if
    print("成年且有票，允许入场")
else:
    print("条件不足，拒绝入场")
```

**运行结果**：

```text
成年且有票，允许入场
```

`age >= 18` 是 `True`，`has_ticket` 是 `True`，`and` 要求两边都真才算真，于是整体为真，`if` 命中。把 `has_ticket` 改成 `False`，`and` 整体变假，走 `else`。`and` 在这里扮演的角色是"把两个独立的条件用一个'且'关系连成一条复合条件"，这正是逻辑运算符的核心用途。

### 1.3 三个运算符速览

Python 的三个逻辑运算符整体如下，先建个总印象，后面逐个展开：

| 运算符 | 含义 | 成立条件 | 典型场景 |
|--------|------|---------|---------|
| `and` | 与（且） | 两边都真 → 真 | 多个条件同时满足 |
| `or` | 或 | 一边真就真（含两边都真） | 多个条件满足其一即可 |
| `not` | 非（取反） | 取反操作数的布尔值 | 否定判断、排除情况 |

几个要点先记在心里，后面逐一展开：

- `and` 两边都为真时返回**右边那个操作数**，否则返回决定结果的那一边；`or` 同理返回决定结果的操作数，而不是 `True`/`False`。
- `and` 看到**左边为假就停手**（结果已定），右边压根不求值；`or` 看到**左边为真就停手**——这叫短路求值。
- `not` 永远返回真正的 `True`/`False`，它是三个里唯一结果恒为 `bool` 的。
- 运算符优先级是 `not` > `and` > `or`，混用时建议加括号。
- 逻辑运算符配合真值测试工作：`0`、`""`、`None`、空容器都被当成"假"参与判断。

## 2. 核心内容

### 2.1 and：两边都真才真

`and` 表示"且"关系：只有两边都为真，整体才为真；只要有一边为假，整体就是假。它最常用来表达"这几个条件必须同时满足"。

**基本用法**：

```python
print(True and True)      # True，两边都真
print(True and False)     # False，右边为假
print(False and True)     # False，左边为假
print(False and False)    # False，两边都假
```

**运行结果**：

```text
True
False
False
False
```

**与比较运算符组合**（最常见的用法）：

```python
age = 25
income = 12000

if age >= 18 and income >= 5000:
    print("符合贷款条件")
else:
    print("不符合条件")
```

**运行结果**：

```text
符合贷款条件
```

`age >= 18` 为 `True`，`income >= 5000` 为 `True`，两个真用 `and` 连起来还是真，整体命中。`and` 的价值在于把"年龄够"和"收入够"两个独立判断合成一条复合条件，一行就能表达"两者都要满足"。

**三个以上条件也能连写**：

```python
weekday = "周六"
hour = 10

if weekday in ("周六", "周日") and 9 <= hour <= 18:
    print("周末且营业时间内")
```

**运行结果**：

```text
周末且营业时间内
```

`and` 可以连多个，从左到右依次求值，要求全部为真。条件多时，靠 `and` 把它们一条条串起来，逻辑就是"这些都得满足"。

### 2.2 or：一边真就真

`or` 表示"或"关系：只要有一边为真，整体就为真；只有两边都假，整体才是假。它最常用来表达"满足其中任一条件即可"。

**基本用法**：

```python
print(True or True)       # True
print(True or False)      # True，左边真就够了
print(False or True)      # True，右边真
print(False or False)     # False，两边都假才假
```

**运行结果**：

```text
True
True
True
False
```

**与比较运算符组合**：

```python
is_vip = False
has_coupon = True

if is_vip or has_coupon:       # 是会员或有券，任一满足就优惠
    print("享受优惠")
else:
    print("无优惠资格")
```

**运行结果**：

```text
享受优惠
```

`is_vip` 为 `False` 但 `has_coupon` 为 `True`，`or` 只要一边真就真，整体命中。`or` 表达的是"多选其一"的宽松关系：满足任何一个条件就放行。

**注意 `or` 包含两边都真的情况**：有人说"或"应该是"二选一"，但 Python 的 `or` 是"至少一个为真"——两边都真时结果也是真。这是逻辑运算里"或"的标准定义（inclusive or），不是"非此即彼"的 exclusive or。需要"两者恰好其一"时，要用 `^`（按位异或）或显式判断，而不是 `or`。

### 2.3 not：取反

`not` 是一元运算符，作用是把操作数的布尔值取反：真变假、假变真。它是三个逻辑运算符里唯一**结果恒为 `True`/`False`** 的——不管操作数是什么类型，`not` 都会先做真值测试，再取反，最终返回一个真正的 `bool`。

**基本用法**：

```python
print(not True)        # False
print(not False)       # True
print(not 0)           # True，0 为假，取反 → True
print(not 1)           # False，1 为真，取反 → False
print(not "")          # True，空串为假 → True
print(not "a")         # False，非空串为真 → False
```

**运行结果**：

```text
False
True
True
False
True
False
```

`not` 不要求操作数是布尔——它会先按真值测试把操作数转成布尔，再取反。`not 0` 为 `True`，因为 0 是假值；`not "a"` 为 `False`，因为非空字符串是真值。

**用于否定判断**：

```python
is_admin = False

if not is_admin:           # 不是管理员 → 限制权限
    print("非管理员，权限受限")
```

**运行结果**：

```text
非管理员，权限受限
```

`not is_admin` 等价于"不是管理员"，比写 `if is_admin == False:` 更简洁，也更符合阅读习惯。

**not 与比较运算符**：比较运算符的优先级高于 `not`，所以 `not score >= 60` 会先算 `score >= 60` 再取反，等价于 `not (score >= 60)`。但为了清晰，建议显式加括号 `not (score >= 60)`，尤其当条件较复杂时。

```python
score = 55

if not (score >= 60):       # 不及格
    print(f"成绩 {score}，不及格")
```

**运行结果**：

```text
成绩 55，不及格
```

需要特别区分两组写法：`not a == b` 等价于 `not (a == b)`（"不相等"），而 `not a is None` 等价于 `a is not None`——后者才是判断"不是 None"的推荐写法，更清晰也更自然。

### 2.4 短路求值：and 遇假停、or 遇真停

短路求值是逻辑运算符最关键的执行特性，理解它才能用好 `and`/`or`。规则可以归纳成两条：

- **`and` 看到左边为假就停**：左边既然是假，整体必为假，右边算不算都不影响结果，所以右边直接不求值。
- **`or` 看到左边为真就停**：左边既然是真，整体必为真，右边同样跳过。

短路求值能"亲眼"看到——用一个带副作用的函数，观察右边有没有被求值：

```python
def side_effect(label, value):
    print(f"    → 求值了：{label}")
    return value

print("and 短路（左边为假）：")
result = side_effect("左", False) and side_effect("右", True)
print(f"  结果：{result}")
```

**运行结果**：

```text
and 短路（左边为假）：
    → 求值了：左
  结果：False
```

输出里只打印了"左"被求值——右边那个 `side_effect("右", True)` 根本没执行，因为左边为假时 `and` 已经能确定整体为假，直接短路返回了。

再看 `or` 的短路：左边为真时右边被跳过：

```python
result = side_effect("左", True) or side_effect("右", False)
print(f"  结果：{result}")
```

**运行结果**：

```text
    → 求值了：左
  结果：True
```

同样只求值了左边。短路求值有两个直接好处：**一是效率**——不必把所有条件都算一遍；**二是安全**——可以利用短路做"先判空再访问"的保护性判断。这是短路最实用的场景：

```python
data = []

if data and data[0] > 0:       # 空列表时 data[0] 不会求值，避免 IndexError
    print(f"首元素 {data[0]} 为正")
else:
    print("数据为空，安全跳过")
```

**运行结果**：

```text
数据为空，安全跳过
```

`data` 为空时是假值，`and` 短路，右边 `data[0]` 不会被求值——如果没有短路，`data[0]` 在空列表上会直接 `IndexError`。这种"`if 容器 and 容器[i]`"的保护性写法在处理可能为空的数据时极其常见，正是短路的功劳。

### 2.5 返回值是操作数而不是 bool

这是 Python 逻辑运算符**最特别、也最容易踩坑**的特性：`and`/`or` 求值后返回的不是 `True`/`False`，而是"决定结果的那一个操作数"本身。只有 `not` 永远返回真正的 `bool`。

先看现象：

```python
print(1 and 2)         # 2，不是 True
print(0 and 2)         # 0，不是 False
print(1 or 2)          # 1，不是 True
print(0 or 2)          # 2，不是 False
print("" or "默认")     # "默认"，空串为假，返回右边
print(None or 0)       # 0，None 为假，返回右边
```

**运行结果**：

```text
2
0
1
2
默认
0
```

规则可以归纳成两句：

- **`a and b`**：如果 `a` 为真，结果就是 `b`；如果 `a` 为假，结果就是 `a`（短路时停在哪儿就返回哪个）。
- **`a or b`**：如果 `a` 为真，结果就是 `a`；如果 `a` 为假，结果就是 `b`。

为什么这样设计？因为 `and`/`or` 的工作方式是"求值到能确定结果为止，并返回最后求值的那个操作数"。`and` 两边都为真才能确定结果为真，所以必须把右边也求了，返回右边；左边为假时停在左边，返回左边（那个假值）。`or` 同理——左边为真就停在左边返回左边，左边为假才去看右边并返回右边。

**为什么在 `if` 条件里不会有感觉**：虽然 `and`/`or` 返回的是操作数，但当它出现在 `if` 条件里时，`if` 会对这个结果再做一次真值测试——返回 `0` 时 `if 0:` 命中 `else`，返回 `2` 时 `if 2:` 命中 `if`。所以从 `if` 的角度看，"返回操作数"和"返回布尔"行为一致，感觉不到差别。

**这个特性的实用价值：用 `or` 提供默认值**。这是 Python 里最经典的习惯用法之一：

```python
name = ""                    # 假设来自用户输入，可能为空
display = name or "匿名用户"  # name 为空 → 用默认值
print(f"显示名：{display!r}")

name = "张三"
display = name or "匿名用户"  # name 有值 → 用真实值
print(f"显示名：{display!r}")
```

**运行结果**：

```text
显示名：'匿名用户'
显示名：'张三'
```

`name or "匿名用户"` 的意思是"如果 `name` 是真值就用 `name`，否则用'匿名用户'"——一行就实现了"给可能为空的值提供默认值"。这个惯用法在很多代码里随处可见，理解了返回值机制就明白它为什么能这么用。

### 2.6 运算符优先级：not > and > or

三个逻辑运算符的优先级是 **`not` 最高，`and` 次之，`or` 最低**。混用时不加括号很容易踩坑，因为直觉上 `or` 像"或"应该和 `and` 同级，但实际上 `and` 比 `or` 绑得更紧。

**优先级对比**：

```python
print(not True or False)        # (not True) or False = False or False = False
print(True or True and False)   # True or (True and False) = True or False = True
```

**运行结果**：

```text
False
True
```

第二行最容易被误解：`True or True and False` 看起来像 `True or True`（=True）`and False`（=False），但实际是 `True or (True and False)` = `True or False` = `True`，因为 `and` 优先级高，先算了右边的 `True and False`。

**经典坑：以为 `or` 优先级高**：

```python
a, b, c = True, True, False

# 想 (a or b) and c，但写成 a or b and c 会被解析成 a or (b and c)
result_wrong = a or b and c       # True or (True and False) = True or False = True
result_right = (a or b) and c     # (True or True) and False = True and False = False
print(f"  a or b and c → {result_wrong}")
print(f"  (a or b) and c → {result_right}")
```

**运行结果**：

```text
  a or b and c → True
  (a or b) and c → False
```

语义完全不同——一个 `True` 一个 `False`。这正是优先级坑的典型。**当你混用 `and`/`or` 时，最稳妥的做法是加括号**，把意图显式表达出来，既避免优先级误解，也提升可读性。

**`not` 与比较运算符**：比较运算符（`==` `<` 等）的优先级高于 `not`，所以 `not score >= 60` 等价于 `not (score >= 60)`，不是 `(not score) >= 60`。但写复杂条件时仍建议显式括号。

### 2.7 与比较运算符组合构造复杂条件

逻辑运算符和比较运算符是天然的搭档：比较运算符把"两个值的关系"算成布尔，逻辑运算符再把这些布尔按"且/或/非"拼装起来。掌握它们的组合，就能表达任意复杂的条件判断。

**多条件"且"**：

```python
age = 25
income = 12000
credit_score = 720

if age >= 18 and income >= 5000 and credit_score >= 600:
    print("贷款审批通过")
else:
    print("条件不满足")
```

**运行结果**：

```text
贷款审批通过
```

三个比较结果用 `and` 串起来，要求全部成立，正是"多项硬性条件都要达标"的标准写法。

**多条件"或"**：

```python
status = "vip_expired"

if status == "vip" or status == "trial" or status == "guest":
    print("允许访问")
else:
    print("拒绝访问")
```

**运行结果**：

```text
拒绝访问
```

多个相等性判断用 `or` 串起来表达"等于其中之一"。这种"判断一个值在不在某几个选项里"的场景，用 `in` 更简洁——`if status in ("vip", "trial", "guest"):` 比 `or` 连写更清晰，应优先选 `in`。

**"且"和"或"混合**：

```python
is_vip = True
amount = 1500
has_coupon = False

# 会员且大额，或者有券，任一满足就优惠
if (is_vip and amount >= 1000) or has_coupon:
    print("满足优惠条件")
else:
    print("不满足")
```

**运行结果**：

```text
满足优惠条件
```

混用 `and`/`or` 时，把每一组用括号括起来，意图一目了然："(是会员且金额够) 或者 (有券)"。括号在这里不只是装饰，而是把语义结构显式表达出来，避免别人（包括未来的你）去猜优先级。

**"且"与"非"复合**：

```python
logged_in = True
is_admin = False

if logged_in and not is_admin:      # 已登录但不是管理员
    print("普通用户视角")
```

**运行结果**：

```text
普通用户视角
```

`not is_admin` 把"是管理员"取反成"不是管理员"，再用 `and` 接上"已登录"，表达"登录的非管理员"。`not` 在复合条件里很常用，记住它告诉读者的就是"否定"。

### 2.8 典型应用场景

逻辑运算符的应用模式可以照搬到很多业务场景。

#### 2.8.1 多条件同时满足（and）

需要所有条件都成立才放行，用 `and`：

```python
def can_login(user):
    return user["active"] and not user["locked"] and user["password"] is not None

user = {"active": True, "locked": False, "password": "123"}
if can_login(user):
    print("允许登录")
```

**运行结果**：

```text
允许登录
```

#### 2.8.2 多条件满足其一即可（or）

满足任一条件就放行，用 `or`：

```python
def free_shipping(amount, is_vip):
    return amount >= 99 or is_vip

print(free_shipping(80, False))   # False，既不满额又不是会员
print(free_shipping(50, True))    # True，是会员免邮
print(free_shipping(120, False)) # True，满额免邮
```

**运行结果**：

```text
False
True
True
```

#### 2.8.3 提供默认值（or 惯用法）

利用 `or` 返回操作数的特性，给"可能为空"的值提供默认值，是逻辑运算符最实用的副作用：

```python
def get_name(raw_name):
    return raw_name or "匿名"     # raw_name 为空/None → 用默认值

print(get_name(""))
print(get_name("张三"))
```

**运行结果**：

```text
匿名
张三
```

#### 2.8.4 否定判断（not）

需要表达"不满足某条件"时，用 `not` 比写反向条件更自然：

```python
def validate(score):
    if not (0 <= score <= 100):
        return "成绩不在合法范围"
    return "成绩合法"

print(validate(85))
print(validate(-5))
```

**运行结果**：

```text
成绩合法
成绩不在合法范围
```

`not (0 <= score <= 100)` 比 `score < 0 or score > 100` 更接近"不在 0 到 100 之间"的自然语言表述，也避免了写出两个边界比较容易写错一边的风险。

## 3. 最佳实践

### 3.1 优先级不确定就加括号

`not` > `and` > `or` 的优先级不直观，混用时凭记忆推断很容易出错。最稳妥的做法是**只要 `and`/`or` 同时出现，就用括号把每一组括起来**，把意图显式表达给读代码的人。

```python
a, b, c = True, True, False

# ❌ 不推荐：依赖优先级记忆，读者要去猜 a or b and c 先算谁
if a or b and c:
    print("命中")

# ✅ 推荐：括号把意图讲清楚，写的人和读的人都不用猜
if a or (b and c):         # 就是 a 或者(b 且 c)
    print("命中")
if (a or b) and c:         # 如果你要的是(a 或 b)且 c
    print("命中")
```

**运行结果**：

```text
命中
命中
```

括号不只是规避优先级陷阱，更是把语义结构写在代码里。读者一眼看到 `(a or b) and c`，就明白意图是"(a 或 b)且 c"，不必去回忆运算符优先级表。

### 3.2 用 or 提供默认值要小心 0/空串

`x or default` 是优雅的默认值惯用法，但它有暗坑：**所有假值（`0`、`""`、`None`、空容器）都会触发默认值**，哪怕这些值本身可能是合法的。

```python
# ❌ 不推荐：0 是合法的"免费"价格，却被 or 当成假值吞掉
price = 0
show = price or 100          # 0 被吞，变成 100
print(show)
```

**运行结果**：

```text
100
```

本意是"没设价格就用 100"，但 `price = 0` 是合法的"免费"，`or` 却把它当成假值，把 100 替了上来，语义就错了。这种情况下要区分"`None`（真的没设）"和"0（有值且为 0）"，用显式判断：

```python
# ✅ 推荐：只想区分 None 时，用 is None 显式判断
price = 0
show = 100 if price is None else price
print(show)                  # 0，保留了合法的 0
```

**运行结果**：

```text
0
```

口诀：**`or` 默认值适合"无非就是空/None，用默认值顶上"的场景；一旦 0、空串、空列表本身是合法值，就别用 `or`，改用显式判断"**。

### 3.3 not 放对位置，别写反条件

`not` 用来取反，但有些场景写反向比较比 `not` 更清晰。判断"不在范围内"，用 `not (0 <= score <= 100)` 比写 `score < 0 or score > 100` 自然；但判断"不是 None"，推荐用 `is not None`，而不是 `not x is None`。

```python
value = None

# ❌ 不推荐：not x is None 读起来绕（虽然能跑）
if not value is None:
    print("不是 None")

# ✅ 推荐：用 is not None，更符合阅读习惯
if value is not None:
    print("不是 None")
```

**运行结果**：

```text
（无输出，value 是 None，两个 if 都不命中）
```

`is not None` 是 Python 里判断"变量不是 None"的事实标准写法，比 `not x is None` 更地道。判断"列表不空"同理，用 `if items:` 比 `if not len(items) == 0:` 简洁得多——前者直接用真值测试，后者啰嗦还容易写错。

### 3.4 复杂条件抽变量提升可读性

当条件里 `and`/`or`/`not` 混用、比较运算好几个时，一行 `if` 会挤成一长串，谁都看不懂。把每个子条件抽成有名字的布尔变量，条件就变成了"读懂变量名"的问题。

```python
# ❌ 不推荐：一行塞满条件，要逐个拆才知道在判什么
if (user["age"] >= 18 and user["verified"]) and (user["vip"] or user["balance"] >= 1000) and not user["banned"]:
    grant_access()
```

```python
# ✅ 推荐：每个判断抽成有名字的变量，条件变成自然语言
is_adult = user["age"] >= 18
is_verified = user["verified"]
is_eligible = user["vip"] or user["balance"] >= 1000
is_banned = user["banned"]

if is_adult and is_verified and is_eligible and not is_banned:
    grant_access()
```

抽变量后，`if` 那行读起来就是"成年且已认证且有资格且没被封禁"——每个子条件是什么含义一目了然，逻辑也更便于调试（每个布尔变量可以单独打印）。**条件超过 3 个、或同行出现 `and`/`or` 混用时，就该考虑抽变量了**。

### 3.5 常见错误模式速查表

把逻辑运算符里高频踩的坑汇总成一张速查表，写代码时可以对照检查：

| 错误模式 | 错误示例 | 后果 | 正确做法 |
|---------|---------|------|---------|
| 以为 `or` 优先级高于 `and` | `a or b and c` 当成 `(a or b) and c` | 语义错误 | 加括号显式表达 |
| `or` 默认值吞掉合法的 0 | `price = 0; price or 100` → 100 | 0 被误替换 | 用 `x if x is not None else d` |
| 以为 `and`/`or` 返回 `True`/`False` | `result = a and b` 后当 bool 比较 | 结果是操作数 | 条件里用无所谓，需严格 bool 用 `bool(...)` |
| `not x == y` 读错成 `(not x) == y` | 误以为先 not 再比较 | 实际是 `not (x == y)` | 加括号 `not (x == y)` |
| `if flag == False:` 判假 | 啰嗦且 `1 == False` 不命中但可读性差 | 冗余 | 用 `if not flag:` |
| 忘了 `or` 是"至少一个真"包含两边真 | 以为两边都真时 `or` 为假 | 逻辑判断错 | 需要"恰好其一"用 `^` 或显式判断 |
| 短路依赖搞反 | 想用 `or` 保护访问却用 `and` | 还是会报错 | "先判空再访问"用 `容器 and 容器[i]` |
| 重复判断相同条件 | `if not is_admin == False` 等冗余表达 | 难读易错 | 直接 `if is_admin:` |

## 4. 原理

### 4.1 短路求值的字节码：条件跳转

逻辑运算符的短路求值，在字节码层面就是一组"求值左边 → 条件跳转 → 可能跳过右边"的指令。用 `dis` 模块可以看清 `and` 是怎么"看到左边为假就跳走"的。

```python
import dis

def check(x):
    return x and x > 0      # and 的短路行为

dis.dis(check)
```

**运行结果**（节选关键指令）：

```text
  3           0 RESUME 0
  4           2 LOAD_FAST 0 (x)
              4 COPY 1
              6 POP_JUMP_IF_FALSE ... (跳到 and 之后的指令)
  5     -->   8 LOAD_FAST 0 (x)
             10 LOAD_CONST 1 (0)
             12 COMPARE_OP 4 (>)
             18 RETURN_VALUE
  6     -->  16 LOAD_FAST 0 (x)        # 这里是 x 为假时直接返回 x 的路径
             18 RETURN_VALUE
```

可以看到 `and` 编译出的形状：先加载左边的 `x`，然后 `POP_JUMP_IF_FALSE`——如果 `x` 为假，直接跳到返回 `x`（短路返回），右边那段 `x > 0` 根本不会执行。只有 `x` 为真时，才会继续求值右边的 `x > 0` 并返回它的结果。

`or` 的字节码形状对称：先加载左边，`POP_JUMP_IF_TRUE`——左边为真就短路返回左边，左边为假才求值右边。短路求值不是什么特殊机制，就是"条件跳转"指令带出来的自然结果：一旦能确定结果，就跳过剩余部分。

### 4.2 返回值机制：返回最后求值的操作数

`and`/`or` 返回"决定结果的操作数"而不是 `True`/`False`，这个机制在字节码里也能看明白。短路返回时返回的是那个"让循环停下来"的操作数本身（上面 `and` 在左边为假时返回 `x`，正是返回操作数而非布尔）。

这条机制的根源在于 Python 的真值测试哲学：**任何对象都能参与布尔判断，没必要非把它转成 `True`/`False`**。`and`/`or` 于是直接返回"决定结果的那个对象"，让调用方决定怎么用：

- 在 `if` 条件里用：`if` 会再对返回值做一次真值测试，0 命中 `else`、2 命中 `if`，行为和返回 bool 一致。
- 想拿真实值用：`name or "默认"` 直接拿到字符串，能当字符串处理。

这种设计避免了"先转 bool 再用"的冗余转换，也让 `or` 默认值这种惯用法成为可能。如果 `and`/`or` 严格返回 bool，`name or "默认"` 就只会得到 `True`/`False`，根本拿不到 `"默认"` 这个字符串，那套惯用法就不成立了。

需要严格拿到 `True`/`False` 时，可以显式 `bool(x and y)` 或用 `not not x`（双重否定转 bool），但绝大多数场景不需要——真值测试已经能正确驱动 `if`/`while` 等条件判断。

### 4.3 真值测试与逻辑运算符的关系

逻辑运算符的工作底座是**真值测试**——把任意对象按一套规则转成布尔，再据此刻决定真假、决定短路。这套规则不仅驱动逻辑运算符，也驱动 `if`、`while` 等所有条件判断。

**真值测试规则**：解释器对一个对象先找 `__bool__()` 方法，没有再找 `__len__()`，返回 0 视为假；都没有就视为真。

```python
print(bool(0))           # False，数字 0 为假
print(bool(""))          # False，空串为假
print(bool([]))          # False，空容器为假
print(bool(None))       # False，None 恒为假
print(bool(1))           # True，非零数字为真
print(bool("a"))         # True，非空串为真
print(bool([0]))         # True，含元素容器为真（即使元素是 0）
```

**运行结果**：

```text
False
False
False
False
True
True
True
```

理解了真值测试，逻辑运算符的很多行为就串联起来了：

- `and`/`or` 短路时判断的是"操作数的真值"，所以 `0 and x` 在左边为 0（假）时短路——这正是 0 参与布尔逻辑被视为假的原因。
- `not x` 返回 `True`/`False`，是因为它先做 `bool(x)` 再取反，结果必然是严格布尔。
- `if 容器 and 容器[i]` 能做保护，是因为空容器的真值是假，`and` 在左边为假时短路，右边那个会出错的访问被跳过。

这套"真值测试 + 逻辑运算符"的组合，让 Python 的条件表达式既简洁（直接 `if items:` 即可判空）又强大（短路能做安全保护）。记住一句话：**Python 的"假"不是只有 `False`/`0`，还包括空容器、空串、None；逻辑运算符靠真值测试来决定真假和短路**。

## 5. 总结

本文围绕逻辑运算符与条件组合展开，主要介绍了以下内容：

- 逻辑运算符是什么：把多个条件按"且/或/非"组合成复合条件的三个符号 `and`/`or`/`not`，配合真值测试工作，且 `and`/`or` 会短路求值
- 三个运算符速览：`and` 两边都真才真、`or` 一边真就真（含两边都真）、`not` 取反且恒返回 `bool`
- `and` 与：用于多条件同时满足，可以连多个，从左到右依次求值
- `or` 或：用于多条件满足其一即可，包容性"或"（两边都真时也为真），需要"恰好其一"要用 `^` 或显式判断
- `not` 非：取反操作数真值，结果恒为 `True`/`False`，常用于否定判断
- 短路求值：`and` 遇到左边为假就停、`or` 遇到左边为真就停，右边不求值，可用于"先判空再访问"的安全保护
- 返回值是操作数而非 bool：`and`/`or` 返回"决定结果的操作数"本身，是 `or` 默认值惯用法的根基；`not` 永远返回严格 bool
- 优先级 `not` > `and` > `or`：混用建议加括号，避免"以为 `or` 优先级高"这类误解
- 与比较运算符组合：比较算成布尔、逻辑拼装成复合条件，括号把语义结构显式表达
- 典型场景：多条件同时满足、多条件满足其一、`or` 提供默认值、否定判断，都有可照搬的写法
- 最佳实践：优先级不确定就加括号、`or` 默认值小心 0/空串被吞、`not` 放对位置（用 `is not None` 判非 None）、复杂条件抽变量提升可读性
- 原理：短路在字节码层是"求值左边 + 条件跳转 + 可能跳过右边"；返回操作数而非 bool 是真值测试哲学的体现，也让 `or` 默认值惯用法成立；逻辑运算符底层依赖真值测试规则（`__bool__`/`__len__`），空容器/空串/None/0 在判断中都被视为假
