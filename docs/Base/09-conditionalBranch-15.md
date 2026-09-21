---
group:
  title: 【09】条件分支
  order: 9
order: 15
title: 条件分支常用技巧与惯用法
nav:
  title: Python基础
  order: 1
---

# 条件分支常用技巧与惯用法

## 1. 介绍

### 1.1 什么是条件分支的技巧与惯用法

写出能跑的 `if` 并不难——`if score >= 60: print("及格")` 谁都会。但同样一个判断，不同人的写法差别很大：有人写 `if len(name) > 0:`，有人写 `if name:`；有人用三行 `if-else` 给变量挑值，有人一行三元表达式搞定；有人在循环里维护一个 `found` 标志位，有人一个 `any()` 直接给答案。**惯用法（idiom）**就是社区公认的、最贴 Python 语言习惯的写法——它不是炫技，而是"Python 圈的人都这么写"的默认答案。

所谓技巧与惯用法，指的是围绕条件分支的一批高价值写法：真值测试（`if x:`）、`is None` 判断、`in` 元组代替 or 长链、链式比较（`0 < x < 10`）、三元表达式、`and`/`or` 短路求值做默认值与前置条件、`dict.get`/`setdefault` 处理存在性分支、条件推导式、`any`/`all`/`max` 代替手写循环分支、海象运算符（`:=`）、EAFP 异常处理风格。它们覆盖了日常编码 80% 的条件判断场景。

先看一个对比，感受一下"能用"和"惯用"的差别：

```python
# 啰嗦写法：能用，但每个判断都在"跟 Python 较劲"
if len(cart) > 0:
    print("有商品")
if status == "paid" or status == "shipped" or status == "completed":
    print("可退货")
found = False
for item in items:
    if item["flash"]:
        found = True
        break

# 惯用写法：顺着 Python 的规则走，代码量和出错面都小一截
if cart:
    print("有商品")
if status in ("paid", "shipped", "completed"):
    print("可退货")
found = any(item["flash"] for item in items)
```

**一句话定位**：条件分支技巧与惯用法，是把"逻辑正确但写法笨重"的判断，替换成 Python 社区标准姿势的一条"翻译规则清单"——每条规则都对应一类高频判断场景。

### 1.2 为什么要掌握惯用法

- **可读性**：惯用法是 Python 使用者的"普通话"。`if not orders:` 一眼是"没订单"；`if orders == [] or orders is None:` 还要停下来解析。写代码是给人读的，顺手是给机器的。
- **少踩坑**：很多惯用法本身就是避坑姿势。比如 `x or default` 这个默认值写法，不理解的人在 `x=0` 合法的场景里会吞掉 0；理解了"or 只认真值、不认业务语义"这一条，坑就不存在了。
- **性能有门道**：`in` 判断配 `set` 是哈希查找（O(1)），配元组是逐项比对（O(n)）。同样的 `in`，数据结构选对了在高频场景差距巨大。
- **少写循环**：`any`/`all`/`max`/`min`/条件推导式把"循环 + 标志位 + 判断"这种三件套压成一个表达式，代码少了，边界情况（提前退出、空序列）还替你处理了。

要强调一点：惯用法不是"越短越好"。`a and b or c`（用逻辑运算符模拟三元）这种"聪明写法"反而是反惯用法——本篇后面的对比会反复出现"什么时候不该用"的边界。

### 1.3 速览

本篇要展开的惯用法整体如下，先建一个总印象，后面逐个拆开：

| 惯用法 | 代替的笨重写法 | 一句话 |
|--------|--------------|--------|
| 真值测试 `if x:` | `if x == True:` / `if len(x) > 0:` | 让 Python 自己问"你是真是假" |
| `is None` / `is not None` | `== None` | None 是单例，用 is 判身份 |
| `x in (a, b, c)` | `x == a or x == b or x == c` | 候选值集中一处 |
| `x not in (a, b)` | `x != a and x != b` | 反向排除 |
| 链式比较 `0 < x < 10` | `0 < x and x < 10` | 数学写法直译，中间只求值一次 |
| 三元 `a if cond else b` | 四行 if-else 挑值 | 简单"二选一取值"压成表达式 |
| `or` 默认值 / `and` 前置 | 显式 if-else 兜底 | 短路求值：右边只在不必要时才碰 |
| `dict.get(k, default)` | `if k in d: ... else: ...` | 存在性分支一步到位 |
| `dict.setdefault(k, 0)` | `if k not in d: d[k] = 0` | 缺键补默认，成组统计常用 |
| 条件推导式 | for 循环 + if 过滤 + append | 过滤、变形写进表达式 |
| `any` / `all` | for + 标志位 + break | "存在一个"和"全部满足"的标准答案 |
| `max` / `min` + `key` | for + 手写比较链 | 挑最大最小值的官方姿势 |
| 海象运算符 `:=` | 先赋值再判断两步走 | 赋值和判断一步完成 |
| EAFP（`try`/`except`） | 先检查权限/存在再操作 | 异常概率低、有竞态时的首选 |

先记住三条总原则，后面逐个验证：

- **惯用法的分母是"意图"**：写出来的代码要在 3 秒内被读懂——`not name` 是"名为空"，而 `len(name) == 0` 是"先把'空'翻译成长度再比较"。
- **每个技巧都有边界**：`or` 默认值遇到 0 会出事，`not x` 判空分不清 `None` 和 `0`，EAFP 遇到"缺省是常态"会变慢——边界记不清时不要用。
- **先保证行为，再追求姿势**：所有技巧的替换都要保证输出不变，尤其是拿不准的语义（`0` 算不算"未设置"）先问清楚业务。

## 2. 核心内容

### 2.1 真值测试：写 if x: 而不是 if x == True:

把一个对象直接放进 `if`，Python 会自动调用 `bool(x)` 问它"你是真是假"，这就是**真值测试**（truth testing）。

非空容器（列表、字典、字符串、集合）是真，空容器是假；非零数字是真，零是假；`True` 是真，`False` 是假；`None` 是假。于是判空、判存在、判开关，都不需要"再翻译一层"：

**示例**

```python
carts = [[], ["鼠标", "键盘"]]
for cart in carts:
    if cart:                      # 空列表为假，非空为真
        print(f"    购物车 {cart} → 有商品，可以结算")
    else:
        print(f"    购物车 {cart} → 空，跳过结算流程")

enabled = True
if enabled:                       # 布尔值本身就是条件
    print("    enabled → 已启用")
```

**运行结果**：

```text
    购物车 [] → 空，跳过结算流程
    购物车 ['鼠标', '键盘'] → 有商品，可以结算
    enabled → 已启用
```

**示例**

```python
for name in ("", "小明"):
    if not name:                  # 空字符串是假值
        print(f"    用户名 {name!r} → 为空，提示补填")
    else:
        print(f"    用户名 {name!r} → 格式合法")
```

**运行结果**：

```text
    用户名 '' → 为空，提示补填
    用户名 '小明' → 格式合法
```

三种"不该再见到的"笨重写法和对应原因：

| 笨重写法 | 应替换为 | 为什么啰嗦 |
|----------|---------|-----------|
| `if len(cart) > 0:` | `if cart:` | 空列表本来就是假值，先求长度再比较多绕一圈 |
| `if cart == []:` | `if cart:` | 拿整个列表和空列表逐项比对，又慢又容易类型对不上 |
| `if enabled == True:` | `if enabled:` | 多余的比较；还容易手滑写成 `= True`（赋值），埋下大坑 |

`== True` 还有一个隐蔽的语义问题：`1 == True` 也是成立的，`if x == True:` 在 `x = 1` 时同样为真。如果你要判断的语义是"必须是布尔真"，应该写 `if x is True:`；如果语义是"够真就行（真值测试）"，就直接 `if x:`——两种意图要用不同的写法表达。

**关键点**：真值测试是 Python 判断"有没有、开没开、空不空"的第一反应。养成肌肉记忆的顺序是：先想 `if x:` / `if not x:`，只有语义上"要区分 0 和 None"这类特判时，才往下翻工具箱。

### 2.2 is None：None 的正判法

`None` 在 Python 里是"这里没有值"的官方表示——函数查无结果返回 `None`、参数未传默认 `None`。判断"是不是 None"，惯用写法是 `is None` / `is not None`：

**示例**

```python
def find_vip(user_id, vips):
    if user_id in vips:
        return vips[user_id]
    return None                   # 函数"没查到"时的标准返回值

result = find_vip("u_9999", {"u_1001": "小明"})
if result is None:                # 惯用：None 是单例，is 比较身份
    print("    未找到 VIP → 走普通用户流程")
else:
    print(f"    找到 VIP：{result}")
```

**运行结果**：

```text
    未找到 VIP → 走普通用户流程
```

为什么不写 `== None`？两个原因：

- **身份语义**：`None` 全解释器只有一个实例，`is` 判断"是不是同一个对象"，精确表达"这个值就是 None"。而 `==` 是"相等性比较"，语义过宽。
- **可重载隐患**：`==` 由 `__eq__` 实现，自定义类可以把它改出任何行为（甚至让"任何东西都等于 None"）；`is` 不可重载，永远可靠。

顺带一个常见的复合判断：**"是 None 或空容器"** 场景，写 `if x is None or not x:` 属于逻辑重复——`None` 本身就是假值，如果业务上"空容器和 None 一视同仁"，直接 `if not x:` 即可；只有需要区分"没值"和"值为空"时，才有必要 `is None` 特判。

**关键点**：`is None` / `is not None` 是判断 None 的唯一推荐写法；`is` 还可以用于 `is True` / `is False`（必须严格布尔值的场景），其他类型一般不用 `is` 比较（后面最佳实践详说）。

### 2.3 not x 的陷阱：0 和空串不等于"没填"

`not x` 取反很顺手，但它有一张"假值清单"要背。Python 里的假值不止 `None`，还有一整队：

| 对象 | 真假 |
|------|------|
| `None` | 假 |
| `False` | 假 |
| `0`、`0.0`、`0j` | 假 |
| `""` 空字符串 | 假 |
| `[]`、`()`、`{}`、`set()` 空容器 | 假 |
| 其余一切 | 真 |

大多数 bug 出在 **0 是合法值** 的场景：限速 `0` 表示"不限速"、库存 `0` 表示"真的没货"、页大小 `0` 是一个测试值——它们都是"用户明确填了 0"，不是"没填"。

**示例**

```python
def render_speed_wrong(speed):
    if not speed:                 # 错误：speed=0 是合法的"不限速"，被当成"未设置"
        return "未设置"
    return f"{speed} km/h"

def render_speed_right(speed):
    if speed is None:             # 正确：只有 None 才算"未设置"
        return "未设置"
    return f"{speed} km/h"

print(f"    not 写法    speed=0    → {render_speed_wrong(0)}")
print(f"    is None 写法 speed=0    → {render_speed_right(0)}")
print(f"    is None 写法 speed=80   → {render_speed_right(80)}")
print(f"    is None 写法 speed=None → {render_speed_right(None)}")
```

**运行结果**：

```text
    not 写法    speed=0    → 未设置   ← 0 被误判成未设置
    is None 写法 speed=0    → 0 km/h
    is None 写法 speed=80   → 80 km/h
    is None 写法 speed=None → 未设置
```

两个"反直觉"的边界一并记住：

```python
print(bool("False"))    # 输出：True —— 非空字符串是真值，别被内容骗了
print(bool([0]))        # 输出：True —— 非空列表是真值，哪怕元素是假值
```

**关键点**：`not x` 判空的适用前提是"空值/零值和 None 在业务上同罪"（比如两者都可以视为"没数据"）；一旦 0 或空串是合法值，必须改用 `is None`。写代码前先问一句：**这个位置 0 是不是有效输入？**

### 2.4 in 元组代替 or 长链

判断"x 等于一串候选值中的某一个"时，新手常写 or 长链，老手把候选值收进一个元组里用 `in`：

**示例**

```python
REFUNDABLE = ("paid", "shipped", "completed")   # 可退货状态集中在一处管理

def refundable_verbose(status):
    if status == "paid" or status == "shipped" or status == "completed":
        return "允许退货"
    return "不允许退货"

def refundable_idiomatic(status):
    if status in REFUNDABLE:        # 增删状态只改元组，不动判断逻辑
        return "允许退货"
    return "不允许退货"

for s in ("paid", "shipped", "refunding", "completed"):
    a = refundable_verbose(s)
    b = refundable_idiomatic(s)
    print(f"    {s:12} → {b}    与啰嗦写法一致：{a == b}")
```

**运行结果**：

```text
    paid         → 允许退货    与啰嗦写法一致：True
    shipped      → 允许退货    与啰嗦写法一致：True
    refunding    → 不允许退货    与啰嗦写法一致：True
    completed    → 允许退货    与啰嗦写法一致：True
```

**not in：反向排除**

判"不允许编辑的字段"，把只读字段收进元组，`field not in READONLY_FIELDS`，比"逐个 != 再 and 起来"干净得多：

**示例**

```python
READONLY_FIELDS = ("id", "created_at")    # 只读字段名单

def is_editable(field):
    return field not in READONLY_FIELDS  # 不在只读名单里，就是可编辑

for field in ("id", "nickname"):
    if is_editable(field):
        print(f"    字段 {field:10} → 可编辑")
    else:
        print(f"    字段 {field:10} → 只读")
```

**运行结果**：

```text
    字段 id         → 只读
    字段 nickname   → 可编辑
```

**高频判断配 set**

`in` 对元组是逐项比对（O(n)），对集合是哈希查找（O(1)）。候选值少、判断少时随便用；名单大、判断频繁（比如每个请求都要查一次 VIP 名单）时用 `set`：

**示例**

```python
vip_users = {"u_1001", "u_1002", "u_1003"}   # 名单这种"反复查询"的数据用 set

def get_discount(user_id):
    if user_id in vip_users:                  # set 的 in 是哈希查找，元组是逐个比对
        return 0.8
    return 1.0

for uid in ("u_1001", "u_9999"):
    print(f"    {uid} → 折扣 {get_discount(uid)}")
```

**运行结果**：

```text
    u_1001 → 折扣 0.8
    u_9999 → 折扣 1.0
```

**关键点**：`in` 惯用法的本质是"**把候选值从代码逻辑里挪进数据结构**"。候选值集中在一处，加一个状态、改一个名单不再需要动判断代码——这就是它比 or 长链好在维护性的根上。

### 2.5 链式比较：区间判断一步到位

`0 < x < 10` 在 Python 里是合法且惯用的**链式比较**（chained comparison），展开等价于 `0 < x and x < 10`，但读起来就是数学式子本身：

**示例**

```python
def shipping_fee_verbose(total):
    if total > 0 and total < 99:
        return "收运费 6 元"
    return "免运费"

def shipping_fee_idiomatic(total):
    if 0 < total < 99:                        # 数学写法直译，读代码像读公式
        return "收运费 6 元"
    return "免运费"

for total in (50, 99, 199):
    fee_verbose = shipping_fee_verbose(total)
    fee_idiomatic = shipping_fee_idiomatic(total)
    assert fee_verbose == fee_idiomatic       # 两种写法行为一致
    print(f"    订单 {total:3} 元 → {fee_idiomatic}")

age = 16
if 13 <= age < 18:
    print(f"    年龄 {age}：青少年价（13 <= age < 18）")
```

**运行结果**：

```text
    订单  50 元 → 收运费 6 元
    订单  99 元 → 免运费
    订单 199 元 → 免运费
    年龄 16：青少年价（13 <= age < 18）
```

链式比较还有一个隐藏福利——**中间表达式只求值一次**。`70 <= score() < 80` 里 `score()` 只被调用一遍；换成 `70 <= score() and score() < 80` 则是两遍。有副作用的调用（打日志、发请求）必须考虑这个差异：

**示例**

```python
calls = []

def get_score():
    calls.append(1)                           # 每次调用留痕
    return 78

if 70 <= get_score() < 80:                    # get_score() 只执行一次，不是两次
    print("    78 分落在 70~79 区间（良好）")
print(f"    get_score 执行次数：{len(calls)}   ← 链式比较对中间表达式只求值一次")
```

**运行结果**：

```text
    78 分落在 70~79 区间（良好）
    get_score 执行次数：1   ← 链式比较对中间表达式只求值一次
```

**关键点**：链式比较适合"连续区间"；反义区间（比如 `x < 0 or x > 100`）不能写成 `0 > x or > 100`（语法错误），也不建议硬凑，老实用 or。三段链如 `13 <= age < 60` 也支持，但超过三段可读性下降，要克制。

### 2.6 三元表达式：二选一取值的惯用位置

Python 的三元写法是 `a if cond else b`——**值在前，条件夹中间**，大声读出来是"a，如果条件成立，否则 b"。它和 if-else 语句的本质区别是：三元是**表达式**（有值，可放进赋值、调用、f-string），if-else 是**语句**（占行数）。

**示例**

```python
def order_state(done, cancelled):
    if cancelled:
        return "已取消"
    return "已完成" if done else "进行中"    # 简单二选一放进 return

print(f"    done=True  → {order_state(True, False)}")
print(f"    done=False → {order_state(False, False)}")
```

**运行结果**：

```text
    done=True  → 已完成
    done=False → 进行中
```

三元最出彩的位置是"为 f-string 或函数参数挑一个值"，少起一个临时变量：

**示例**

```python
def render_vote(agree, against):
    if agree > against:
        verdict = "领先"
    else:
        verdict = "落后"
    plain = f"赞成 {agree} - 反对 {against}（{verdict}）"
    inline = f"赞成 {agree} - 反对 {against}（{'领先' if agree > against else '落后'}）"
    print(f"    if-else + 变量写法：{plain}")
    print(f"    三元内联写法    ：{inline}")

render_vote(5, 2)
render_vote(2, 6)
```

**运行结果**：

```text
    if-else + 变量写法：赞成 5 - 反对 2（领先）
    三元内联写法    ：赞成 5 - 反对 2（领先）
    if-else + 变量写法：赞成 2 - 反对 6（落后）
    三元内联写法    ：赞成 2 - 反对 6（落后）
```

**适用边界**（很重要）：

- 三元适合**一个条件、两个值**。两个条件就该写成 if-else 语句或拆函数——三元套三元（`a if c1 else b if c2 else d` 刚好能读，再多一层就是灾难）。
- 有**副作用**的逻辑（赋值之外还要做什么）不要塞进三元，表达式只能"选值"，不该"干活"。
- `cond and a or b`（用逻辑运算符模拟三元）是历史反模式：`a` 为假值时结果错位。Python 2.5 起有了正规三元，这种写法应清除。

**关键点**：判断标准就一条——"这里是在**挑一个值**吗？"是就用三元；"这里是在**走两段不同的流程**吗？"就是 if-else 语句。

### 2.7 and / or 短路求值：默认值与前置条件

`and` 和 `or` 有一条关键规则：**从左到右求值，能定结果就不再碰右边**——`x and y`：`x` 为假则右边碰都不碰；`x or y`：`x` 为真则右边碰都不碰。这个"短路"特性让它们能做两类惯用法。

**or 做默认值**

**示例**

```python
def greet(name):
    # name 为 None 或空串时，or 右边的默认值生效
    return f"你好，{name or '匿名用户'}"

print(f"    greet('小明') → {greet('小明')}")
print(f"    greet('')     → {greet('')}")
print(f"    greet(None)   → {greet(None)}")
```

**运行结果**：

```text
    greet('小明') → 你好，小明
    greet('')     → 你好，匿名用户
    greet(None)   → 你好，匿名用户
```

**or 的陷阱：0 是合法值时会被吞**

`or` 只认"真值"，不认业务语义。0 / 空串作为合法输入时，会被当成"没给"替换成默认值：

**示例**

```python
def set_page_size_wrong(size):
    # 错误示范：or 只认"真值"，size=0 是合法值却被默认值 10 吞掉
    return f"每页 {size or 10} 条"

def set_page_size_right(size):
    # 正确写法：只有 None 才算"未设置"，0 原样通过
    page_size = 10 if size is None else size
    return f"每页 {page_size} 条"

print(f"    or 写法    size=0    → {set_page_size_wrong(0)}")
print(f"    正确写法   size=0    → {set_page_size_right(0)}")
print(f"    正确写法   size=None → {set_page_size_right(None)}")
```

**运行结果**：

```text
    or 写法    size=0    → 每页 10 条   ← 0 被吞，页大小变成了 10
    正确写法   size=0    → 每页 0 条
    正确写法   size=None → 每页 10 条
```

**and 做前置条件**

debug 开关没打开时，右侧的动作连执行都不执行——一行实现"条件日志"：

**示例**

```python
def save_log(log_dir, debug):
    # debug 为 False 时，右边的 print 不会执行 —— 短路保护
    debug and print("    [debug] log_dir =", log_dir)
    print("    日志已写入", log_dir)

save_log("/var/log/app", debug=False)   # 第一遍：debug 无输出
save_log("/var/log/app", debug=True)    # 第二遍：debug 行出现
```

**运行结果**：

```text
    日志已写入 /var/log/app
    [debug] log_dir = /var/log/app
    日志已写入 /var/log/app
```

注意输出顺序：第一遍（debug=False）只有"日志已写入"；第二遍（debug=True）是"debug 行在前、写入在后"，因为 `debug and print(...)` 写在 `print("日志已写入")` 之前。

**or 链做多级回退**

多级回退的语义是"谁真用谁，全假用最后一个"——配置优先级（环境变量 → 配置文件 → 内置默认）一行表达：

**示例**

```python
config_env, config_file = "", "app.yaml"
cfg = config_env or config_file or "default.yaml"
print(f"    环境变量为空 → 退到文件：{cfg}")

vals = {"a": 0, "b": [], "c": ""}
print(f"    全部假值时 or 链返回最后一个：{vals['a'] or vals['b'] or vals['c'] or '默认'}")
```

**运行结果**：

```text
    环境变量为空 → 退到文件：app.yaml
    全部假值时 or 链返回最后一个：默认
```

**关键点**：`x or default` 的前置检查清单——(1) 0 / 空串在这个位置是不是合法值？(2) 默认值语义是"任意真值"都接受吗？两问都过了再用。`and` 前置条件适合"一行、一个动作"的日志注入这类场景；动作一多就要回退到 if-else。

### 2.8 get / setdefault：字典的存在性分支

字典最常见的判断是"键在不在，不在给个默认"。`in` 检查 + `[]` 取值是两步，惯用写法把存在性分支交给字典自带的方法。

**dict.get：取值带默认**

**示例**

```python
stock = {"鼠标": 12, "键盘": 5}

def stock_verbose(name):
    if name in stock:           # in 查一次、[] 再取一次，查了两遍
        return stock[name]
    return 0

def stock_get(name):
    return stock.get(name, 0)   # 一步到位，缺键给默认值

for name in ("鼠标", "显示器"):
    a = stock_verbose(name)
    b = stock_get(name)
    print(f"    {name} 库存：啰嗦写法={a}，get 写法={b}，一致：{a == b}")

# get 不传默认值时缺键返回 None，方便配合 is None 再做后续判断：
profile = {"city": "杭州"}
lang = profile.get("lang")
if lang is None:
    lang = "zh-CN"
print(f"    lang 缺键 → get 返回 None，兜底成 {lang}")
```

**运行结果**：

```text
    鼠标 库存：啰嗦写法=12，get 写法=12，一致：True
    显示器 库存：啰嗦写法=0，get 写法=0，一致：True
    lang 缺键 → get 返回 None，兜底成 zh-CN
```

**dict.setdefault：缺键写入 + 返回现有值**

成组统计是 `setdefault` 的经典主场——第一次遇到某键时先放入 0，之后累加：

**示例**

```python
orders = [
    {"user": "小明", "amount": 100},
    {"user": "小红", "amount": 250},
    {"user": "小明", "amount": 300},
]

totals_verbose = {}
for order in orders:
    if order["user"] not in totals_verbose:   # 先查存在性再初始化
        totals_verbose[order["user"]] = 0
    totals_verbose[order["user"]] += order["amount"]

totals = {}
for order in orders:
    # 缺键时先放入 0 并返回；已有键时直接返回现有值
    totals.setdefault(order["user"], 0)
    totals[order["user"]] += order["amount"]

print(f"    啰嗦写法：{totals_verbose}")
print(f"    setdefault 写法：{totals}   一致：{totals_verbose == totals}")
```

**运行结果**：

```text
    啰嗦写法：{'小明': 400, '小红': 250}
    setdefault 写法：{'小明': 400, '小红': 250}   一致：True
```

三个工具的分工：

| 工具 | 语义 | 典型场景 |
|------|------|---------|
| `d[k]` | 取不到就抛 KeyError | 键"必须存在"，缺失说明有 bug——宁崩不错 |
| `d.get(k, default)` | 取不到返回默认，**不写入** | 读取配置、查询库存这类"缺了也能继续" |
| `d.setdefault(k, default)` | 取不到**写入**默认并返回 | 成组统计、分组收集，第一次见到要建档 |

**关键点**：`get` 适合"只读兜底"，`setdefault` 适合"缺则建档"。别用 `try/except KeyError` 平替 `get`——try/except 有它的场景（异常是少数情况时），但在"缺省是常态"的配置读取里，`get` 更直白也更快。

### 2.9 条件推导式：把 if 写进表达式

推导式（comprehension）里的条件有两个位置，语义完全不同，混用的 bug 挺常见——**末尾的 if 是"过滤"，开头的三元是"变形"**。

**末尾 if：过滤（不满足的整项扔掉）**

**示例**

```python
products = [
    {"name": "鼠标", "price": 99, "stock": 0},
    {"name": "键盘", "price": 220, "stock": 14},
    {"name": "显示器", "price": 899, "stock": 3},
    {"name": "鼠标垫", "price": 19, "stock": 60},
]

in_stock_verbose = []
for p in products:
    if p["stock"] > 0:
        in_stock_verbose.append(p["name"])

in_stock = [p["name"] for p in products if p["stock"] > 0]

print(f"    循环 + if 过滤：{in_stock_verbose}")
print(f"    推导式一行版 ：{in_stock}")
```

**运行结果**：

```text
    循环 + if 过滤：['键盘', '显示器', '鼠标垫']
    推导式一行版 ：['键盘', '显示器', '鼠标垫']
```

**开头三元：变形（每项都保留，值随条件变化）**

**示例**

```python
labels = [
    f"{p['name']}:({'有货' if p['stock'] else '缺货'})"
    for p in products
]
for label in labels:
    print(f"    {label}")

# 变形 + 过滤组合拳：开头三元变形，末尾 if 过滤
cheap_in_stock = [
    p["name"] for p in products if p["stock"] > 0 and p["price"] < 300
]
print(f"    变形+过滤组合：{cheap_in_stock}")
```

**运行结果**：

```text
    鼠标:(缺货)
    键盘:(有货)
    显示器:(有货)
    鼠标垫:(有货)
    变形+过滤组合：['键盘', '鼠标垫']
```

字典推导式同样支持条件，直接"带条件建表"：

**示例**

```python
price_map = {p["name"]: p["price"] for p in products if p["stock"] > 0}
print(f"    有货商品价格表：{price_map}")

sale_map = {
    p["name"]: p["price"] * 0.8 if p["price"] > 200 else p["price"]
    for p in products if p["stock"] > 0
}
print(f"    大件八折价目表：{sale_map}")
```

**运行结果**：

```text
    有货商品价格表：{'键盘': 220, '显示器': 899, '鼠标垫': 19}
    大件八折价目表：{'键盘': 176.0, '显示器': 719.2, '鼠标垫': 19}
```

**关键点**：位置口诀——**if 在末尾挑人（过滤），三元在开头整容（变形）**，两者可以同时出现（先过滤再变形）。推导式超过两行请回退 for 循环——推导式的使命是让选择逻辑一眼看穿，不是考验排版的极限。

### 2.10 内置函数 any / all / max / min / sum：把循环判断压成表达式

"循环 + 标志位 + 判断"是判断类需求的三件套，Python 把几个最高频的形态做成了内置函数。

先给一组贯穿的数据，后面反复用：

```python
items = [
    {"name": "鼠标", "price": 99, "flash": False, "stock": 0},
    {"name": "键盘", "price": 220, "flash": True, "stock": 14},
    {"name": "显示器", "price": 899, "flash": False, "stock": 3},
    {"name": "秒杀硬盘", "price": 299, "flash": True, "stock": 8},
]
```

**any：有没有至少一个满足**

**示例**

```python
has_flash_verbose = False
for item in items:
    if item["flash"]:
        has_flash_verbose = True
        break                          # 记得提前退出，否则白扫一遍

has_flash = any(item["flash"] for item in items)   # 找到第一个真的就停
print(f"    购物车含秒杀商品：{has_flash}   与啰嗦写法一致：{has_flash_verbose}")
```

**运行结果**：

```text
    购物车含秒杀商品：True   与啰嗦写法一致：True
```

手写版容易丢 `break`（白白扫完全列表），`any` 替你处理了提前退出，还把"存在满足条件的项"这个意图写在函数名上。

**all：是不是全部满足**

**示例**

```python
def all_in_stock_verbose(items):
    for item in items:
        if item["stock"] == 0:         # 发现一个不满足，立刻否决
            return False
    return True

all_in_stock = all(item["stock"] > 0 for item in items)
print(f"    全部有货：{all_in_stock}   与啰嗦写法一致：{all_in_stock_verbose(items)}")
print(f"    all([14, 3, 8])  → {all([14, 3, 8])}（全真）")
print(f"    all([14, 0, 8])  → {all([14, 0, 8])}（一个 0 全盘否）")
```

**运行结果**：

```text
    全部有货：False   与啰嗦写法一致：False
    all([14, 3, 8])  → True（全真）
    all([14, 0, 8])  → False（一个 0 全盘否）
```

顺带记住空序列的行为约定：`all([])` 是 `True`（"没有反例"），`any([])` 是 `False`（"找不到例子"）——数理逻辑来的默认值，写校验代码时很关键。

**max / min + key：代替手写比较链**

**示例**

```python
top_verbose = items[0]
for item in items[1:]:
    if item["price"] > top_verbose["price"]:
        top_verbose = item

top = max(items, key=lambda it: it["price"])
print(f"    最贵商品 {top_verbose['name']}，与 max+key 一致：{top_verbose == top}")

cheapest_in_stock = min(
    (it for it in items if it["stock"] > 0),   # 先过滤再挑最小，一个表达式
    key=lambda it: it["price"],
)
print(f"    有货中最便宜：{cheapest_in_stock['name']}")
```

**运行结果**：

```text
    最贵商品 显示器，与 max+key 一致：True
    有货中最便宜：键盘
```

**max / min 的 default 参数：空序列不炸**

空列表是筛选后的常见产物（比如"筛选 VIP 再挑最贵的"），`max([])` 会直接抛异常，`default` 参数让这个边界不用额外包一层 if：

**示例**

```python
empty_cart = []
try:
    max(empty_cart)                    # 空序列没有最大值，直接抛异常
except ValueError as e:
    print(f"    max([]) 抛出 ValueError: {e}")

top_or_none = max(empty_cart, default=None)    # default 兜住空序列
print(f"    max([], default=None) 安心返回：{top_or_none}")
```

**运行结果**：

```text
    max([]) 抛出 ValueError: max() iterable argument is empty
    max([], default=None) 安心返回：None
```

**sum + 条件：计数与条件求和**

**示例**

```python
sold_out_count = sum(1 for item in items if item["stock"] == 0)
flash_value = sum(it["price"] for it in items if it["flash"])
stock_total = sum(it["stock"] for it in items)
print(f"    缺货商品数：{sold_out_count}")
print(f"    秒杀商品总面值：{flash_value}")
print(f"    总库存件数：{stock_total}")
```

**运行结果**：

```text
    缺货商品数：1
    秒杀商品总面值：519
    总库存件数：25
```

**关键点**：这批内置函数的共性是**把"判断 + 循环"折叠成一个名实相符的表达式**——`any(...)` 的读法就是"有没有"，`all(...)` 就是"是不是都"，`max(..., key=...)` 就是"谁最大"。代码读出来的顺序和脑子想问题的顺序一致，这就是它们比手写循环惯用的原因。

### 2.11 海象运算符：赋值即判断

一个数据要先用、后判、再用，传统写法是"先赋值、再判断"两步走：

```python
n = len(data)          # 第一步：赋值
if n > 10:             # 第二步：判断
    process(data, n)   # 第三步：分支里还要用 n
```

海象运算符 `:=`（Python 3.8+）把"赋值 + 判断"并成一步——**在条件表达式里完成赋值**，分支里直接用：

**示例**

```python
data = list(range(25))

if (n := len(data)) > 10:          # 括号里完成赋值，条件用 n 继续比较
    print(f"    数据量 {n} 条 > 10，走批量导入通道")
else:
    print(f"    数据量 {n} 条，走单条通道")
```

**运行结果**：

```text
    数据量 25 条 > 10，走批量导入通道
```

**while + 海象：流式读取的标配**

读取数据流的模式是"取一块、判空、处理、再取"——传统写法要把"取"写两遍（循环前一次、循环尾一次），海象写成一行：

**示例**

```python
def make_stream(chunks):
    yield from chunks             # 先产出真实数据块
    while True:
        yield ""                  # 之后一直产出空串，模拟 EOF

stream = make_stream(["chunk-1", "chunk-2"])

# 传统写法：chunk = next(...); while chunk: ...; chunk = next(...)，读两遍
while (chunk := next(stream)):    # 一行管赋值、判断、续批
    print(f"    收到数据块：{chunk}")
print("    流读取完毕（空串自动跳出循环）")
```

**运行结果**：

```text
    收到数据块：chunk-1
    收到数据块：chunk-2
    流读取完毕（空串自动跳出循环）
```

**海象 + next 默认值：找第一条**

**示例**

```python
logs = ["INFO start", "ERROR db timeout", "INFO done"]
first_error = next((l for l in logs if l.startswith("ERROR")), None)
if (err := first_error) is not None:
    print(f"    首条错误日志：{err}")
else:
    print("    没有错误日志")
```

**运行结果**：

```text
    首条错误日志：ERROR db timeout
```

这个组合里 `next(..., None)` 负责找"第一条或 None"，海象让"找到的东西"可以直接在 then 分支里用，不用再起一个变量名。

**适用边界**：

- 圆括号别忘：`if (n := len(data)) > 10:` 里的括号是语法要求的一部分，少写会报语法错误。
- 海象适用于"**这个值在条件里新产生、在分支里还要用**"。值早就存在、或分支里用不上时，普通赋值更平铺直叙。
- 不要为了"一行写完"硬塞。海象的甜点区是 while 读流、if 判长度、列表推导式里复用这类有"值复用"诉求的位置。

**关键点**：海象是赋值**表达式**——`if x := ...:` 里的 `:=` 绑定的变量在包含它的作用域里生效（不是 if 块局部），分支外也能继续访问，这是它和"临时变量"在作用域上的唯一差别。

### 2.12 EAFP 与 LBYL：先做认错，还是先查再做

处理"可能失败的操作"有两派哲学，Python 社区给它们起了名字：

- **LBYL**（Look Before You Leap，三思而后行）：先检查能不能做，能做再做。`if os.path.exists(p): open(p)`
- **EAFP**（Easier to Ask Forgiveness than Permission，先斩后奏）：直接做，失败当场接住。`try: ... except FileNotFoundError: ...`

**字典场景的两种姿势**

**示例**

```python
config = {"timeout": 30}

# LBYL：先检查，再使用
if "timeout" in config:
    timeout = config["timeout"]   # in 查一次、[] 又查一次
else:
    timeout = 5
print(f"    LBYL 拿到 timeout={timeout}")

# EAFP：直接使用，异常兜底
try:
    retries = config["retries"]   # 大概率成功时，别预检，直接干
except KeyError:
    retries = 3
print(f"    EAFP 拿到 retries={retries}（缺键被 KeyError 捕获）")

# 字典场景最顺手的其实是 get：一行等价上面整段
retries = config.get("retries", 3)
print(f"    get 一行拿到 retries={retries}")
```

**运行结果**：

```text
    LBYL 拿到 timeout=30
    EAFP 拿到 retries=3（缺键被 KeyError 捕获）
    get 一行拿到 retries=3
```

**EAFP 真正高光的场景：检查和使用之间状态会变**

LBYL 有个结构性缺陷——**检查通过那一刻 ≠ 使用那一刻仍然成立**。多进程/多线程/网络对端，随时可能在你"看"和"跳"之间掀桌子：

**示例**

```python
import os

path = "will_be_gone_demo.txt"
if os.path.exists(path):
    os.remove(path)               # 演示前先清掉，确保文件不存在

# LBYL 版：检查通过 ≠ 一定能打开，检查完到 open 之间文件可能被别的进程删掉
def read_config_lbyl(p):
    if os.path.exists(p):
        with open(p) as f:
            return f.read()
    return None

# EAFP 版：open 失败当场捕获，检查和打开是一个原子动作，没有竞态窗口
def read_config_eafp(p):
    try:
        with open(p) as f:
            return f.read()
    except FileNotFoundError:      # 失败的那一刻才知道失败，不会有"检查过期"问题
        return None

print(f"    LBYL 读不存在的文件：{read_config_lbyl(path)}（多一层 except 才敢说稳）")
print(f"    EAFP 读不存在的文件：{read_config_eafp(path)}（open 失败当场兜住）")
```

**运行结果**：

```text
    LBYL 读不存在的文件：None（多一层 except 才敢说稳）
    EAFP 读不存在的文件：None（open 失败当场兜住）
```

两派选型参考：

| 维度 | LBYL（先检查） | EAFP（先做认错） |
|------|--------------|-----------------|
| 异常概率低（大概率成功） | 白付一次预检成本 | 直接成功，最快路径零开销 |
| 有竞态（检查后状态会变） | 天生有窗口，失败要兜两层 | 一次动作一次结果，最稳 |
| 缺省是常态（经常缺键） | in 检查成本低，分支清晰 | 异常构造有开销，except 噪音 |
| 有现成兜底 API（get/setdefault） | 直接用 API，最简 | try/except 反而多余 |
| 检查本身很贵（权限、网络探测） | 能省就省不了 | 先试最便宜 |

**关键点**：EAFP 是 Python 文化里占上风的哲学（官方词汇表都收录了），但**不是无脑 try**——except 只接"预期中的失败"（FileNotFoundError、KeyError、AttributeError 这种点名的），裸 `except:` 接一切是反模式，会把真正的 bug（拼写错误、类型错误）也一并吞掉。

## 3. 最佳实践

### 3.1 推荐 vs 不推荐写法对照

一行一对照，左边清出历史舞台，右边是标准答案：

| 不推荐写法 | 推荐写法 | 原因 |
|-----------|---------|------|
| `if len(items) > 0:` | `if items:` | 空容器本来就是假值 |
| `if x == True:` | `if x:` / `if x is True:` | 视语义选其一；`== True` 还易手滑成赋值 |
| `if x == None:` / `if x != None:` | `if x is None:` / `is not None` | None 是单例，is 判身份 |
| `if s == "a" or s == "b":` | `if s in ("a", "b"):` | 候选值集中，可维护 |
| `if x > 0 and x < 10:` | `if 0 < x < 10:` | 数学直译，中间只求值一次 |
| `found = False; for ...: break` | `any(...)` / `all(...)` | 意图进名字，提前退出内置 |
| `if k in d: v = d[k] else: v = 0` | `v = d.get(k, 0)` | 一次查找，一行表达 |
| `if os.path.exists(p): open(p)` | `try: open(p) except FileNotFoundError:` | 消除竞态窗口 |
| `cond and a or b`（模拟三元） | `a if cond else b` | a 为假值时前者结果错位 |
| `n = len(data); if n > 0: use(n)` | `if (n := len(data)) > 0: use(n)` | 赋值即判断，值即刻可复用 |

### 3.2 常见错误模式及修正

**错误模式一：not / or 判空误伤合法零值**

```python
# bug：page=0 表示"不分页"，却被替换成默认 10
page = request_arg or 10

# 修正：只有 None 算"未传"
page = 10 if request_arg is None else request_arg
```

判定办法：写下 or / not 之前自问——**0、空串、空列表在这个语义里是不是合法值？** 是，就走 is None 这条线。

**错误模式二：is 用于普通数值比较**

```python
# 危险：恰好"工作"是因为 CPython 缓存了 -5~256 的小整数
a = 256
b = 256
print(a is b)    # 输出：True（小整数缓存，纯属实现细节）

a = 257
b = 257
# a is b 在不少环境是 False —— 缓存边界之外就是两个对象
```

`is` 比较的是"同一个对象"，整数缓存是解释器实现细节，版本一变结论就变。规则化：**is 只给 None / True / False 和显式单例用**，数值字符串一律 `==`。

**错误模式三：裸 except 吞掉一切**

```python
try:
    price = get_price(item_id)
except:                      # 反模式：连代码 bug（NameError/TypeError）也一起吞了
    price = 0
```

修正成点名异常，让 bug 以崩的方式暴露：

```python
try:
    price = get_price(item_id)
except PriceNotFoundError:   # 只接预期中的失败
    price = 0
```

**错误模式四：三元嵌套过深**

```python
# 一层还能读，两层已经很勉强
level = "高" if score >= 80 else "中" if score >= 60 else "低"
```

两个以上条件，回退 if-elif 链：

```python
def grade(score):
    if score >= 80:
        return "高"
    if score >= 60:
        return "中"
    return "低"
```

**错误模式五：EAFP 用在"缺省是常态"的场景**

```python
# 每次循环都大概率 KeyError，异常构造开销白白放大
for key in ("city", "lang", "theme"):
    try:
        value = settings[key]
    except KeyError:
        value = None
```

改成 get，一行更便宜：

```python
for key in ("city", "lang", "theme"):
    value = settings.get(key)
```

### 3.3 技巧选择速查表

按场景查答案：

| 我要判断…… | 首选惯用法 | 备选与备注 |
|-----------|----------|-----------|
| 列表/字符串/字典是不是空 | `if not x:` | 需区分 0 时 `is None` 特判 |
| 是不是 None | `x is None` | —— |
| 等于几个候选值之一 | `x in (a, b, c)` | 名单大/高频 → `set` |
| 落在某区间内 | `low < x < high` | 复杂区间 if-elif |
| 变量二选一赋值 | `a if cond else b` | 条件多 → if-elif |
| 没传就用默认 | `10 if x is None else x` | 确认 0 不是合法值才可用 `x or 10` |
| 存在任意一项满足 | `any(genexp)` | 空序列默认 False |
| 全部满足 | `all(genexp)` | 空序列默认 True |
| 字典缺键读默认 | `d.get(k, default)` | 缺则建档 → `setdefault` |
| 挑最大/最小 | `max(it, key=...)` | 空序列可能 → `default=` |
| 边查长度边判值 | `if (n := len(x)) > max:` | Python 3.8+ |
| 文件/权限/网络等会变的资源 | `try/except 点名异常` | 检查很便宜时 LBYL |

**关键点**：速查表的用法是"先看左列找场景"，而不是"背右列的语法"。每个惯用法的行为边界（0 陷阱、空序列默认值、求值次数）才是真正要内化的部分——语法错了 IDE 会提醒，边界错了只有生产环境会提醒。

## 4. 原理简析

### 4.1 真值测试的底层：__bool__ 与 __len__ 协议

`if x:` 到底调用了什么？Python 向对象问真假时按固定顺序找两个方法：

- 优先找 `__bool__(self)`：返回 True/False，直接作为真假。
- 没有则退到 `__len__(self)`：返回 0 当假，非 0 当真。
- 都没有：默认为真。

内置类型的假值清单正是这么来的——数字靠"数值为 0 即假"，容器靠"长度为 0 即假"（它们实现了对应的协议）。自定义类也走这条规则：

**示例**

```python
class ShoppingCart:
    def __init__(self, goods):
        self.goods = goods

    def __len__(self):               # 购物车"有多满"由长度说了算
        return len(self.goods)

empty = ShoppingCart([])
full = ShoppingCart(["鼠标"])
print(f"    bool(empty) = {bool(empty)}   ← 长度 0，为假")
print(f"    bool(full)  = {bool(full)}   ← 长度 1，为真")
print(f"    要结算吗：{'结算' if full else '跳过'}")
```

**运行结果**：

```text
    bool(empty) = False   ← 长度 0，为假
    bool(full)  = True   ← 长度 1，为真
    要结算吗：结算
```

这也解释了 `if cart:` 的精确语义是"调 `__bool__` 或 `__len__` 的结果"，而不是魔法——真值测试对自定义容器天然生效，自己写的类只要实现 `__len__` 或 `__bool__`，就能无缝接进 `if x:` 这套判断体系。

### 4.2 and / or 返回的是什么：不是布尔值，是操作数

短路求值有个非常实用又常被忽略的细节：**`and`/`or` 返回的是"决定结果的那一个操作数"本身，而不是 True/False**。

- `x or y`：`x` 真返回 `x`，否则返回 `y`（不是布尔化后的值）。
- `x and y`：`x` 假返回 `x`，否则返回 `y`。

**示例**

```python
print(f"    0 or '默认'       → {0 or '默认'!r}   ← 0 是假值，返回右边的操作数")
print(f"    '配置' or '默认'  → {'配置' or '默认'!r}   ← 左边真，短路返回左边")
print(f"    2 and 3           → {2 and 3}   ← 左右都真，返回右边")
print(f"    [0] and 7         → {[0] and 7}   ← [0] 非空即真，返回右边")
```

**运行结果**：

```text
    0 or '默认'       → '默认'   ← 0 是假值，返回右边的操作数
    '配置' or '默认'  → '配置'   ← 左边真，短路返回左边
    2 and 3           → 3   ← 左右都真，返回右边
    [0] and 7         → 7   ← [0] 非空即真，返回右边
```

`x or default` 能直接当"默认值开关"用，正是因为 or 返回原封不动的操作数；反过来，`0` 会被 or 当假值吞掉，也是同一条规则的另一面——**收益和陷阱同源**，懂这一条原理就能同时记住"什么时候好用"和"什么时候危险"，不用死背两张表。

### 4.3 链式比较与海象的求值细节

**链式比较的展开规则**

`a < b < c` 不是"先算 `a < b` 再独立算 `b < c`"，而被编译成近似 `a < b and b < c` 的结构，其中**中间项 b 只求值一次**：

```python
print(1 < get_score() < 100)
# 概念上等价（注意 b 只算一次）：
temp = get_score()        # 只调用这一次
result = 1 < temp and temp < 100
```

这也解释了两件事：一是链式比较天然比"and 两段式"少求值一次（有副作用的调用很在意）；二是 `a < b <= c != d` 这种混搭虽然语法合法，但语义立刻脱离"数学区间"的直觉，不值得用——工具留着表达区间，别的场合让位。

**海象是表达式，作用域跟着包含块走**

`n := len(data)` 与普通赋值 `n = len(data)` 绑定的是同一个 `n`——它落在包含它的函数/模块作用域里，而不是 if/while 的块级局部：

**示例**

```python
data = list(range(25))
if (n := len(data)) > 10:
    print(f"    if 块内访问 n：{n}")
print(f"    if 块外 n 仍然存在：{n}   ← 并非块级作用域，外泄按设计行为处理")
```

**运行结果**：

```text
    if 块内访问 n：25
    if 块外 n 仍然存在：25   ← 并非块级作用域，外泄按设计行为处理
```

**设计意图**：海象被引入（PEP 572）的核心动因就是消灭"重复书写表达式"——while 读两遍取值、if 判两次调函数、推导式里同一表达式算两遍。凡是"表达式结果要即用又后用"的位置，就是海象的座位。

## 5. 总结

本文围绕条件分支常用技巧与惯用法展开，主要介绍了以下内容：

- **真值测试**：`if x:` / `if not x:` 是判空、判开关的第一反应；`== True`、`len(x) > 0`、`== []` 都是多余的翻译层。
- **is None**：None 是单例，判断一律 `is None` / `is not None`；`not x` 判空前先确认 0 和空串不是合法值，否则要特判。
- **in 成员测试**：候选值收进元组代替 or 长链，反向用 `not in`；高频判断配 `set` 享哈希查找。
- **链式比较**：`0 < x < 10` 直译数学区间，中间表达式只求值一次；反义区间和超长链条该回退 if/or。
- **三元表达式**：`a if cond else b` 用于"挑值"场景（赋值、f-string、return）；流程分叉和深嵌套应该回退 if-elif。
- **and / or 短路**：`or` 做默认值（0 合法时会吞值）、`and` 做前置条件、`or` 链做多级回退。
- **字典方法**：`get` 只读兜底、`setdefault` 缺则建档、`d[k]` 缺键即崩——三者按"错误该不该发生"分工。
- **条件推导式**：末尾 if 过滤、开头三元变形，两者可组合；字典推导式带条件建表。
- **内置函数**：`any`/`all` 替代循环 + 标志位，`max`/`min` + `key` 替代手写比较链，空序列用 `default` 兜底。
- **海象运算符**：`:=` 在条件表达式里"赋值即判断"，while 读流是它的招牌场景。
- **EAFP 与 LBYL**：异常概率低、有竞态、检查白费时用 try/except 点名异常；缺省是常态时 get/setdefault 更直白。
- **原理侧**：真值测试走 `__bool__`/`__len__` 协议；`and`/`or` 返回原操作数而非布尔值（默认值和它的陷阱同源）；链式比较中间项只求值一次；海象绑定在包含作用域。
