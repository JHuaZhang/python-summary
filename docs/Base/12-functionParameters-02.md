---
group:
  title: 【12】函数参数介绍
  order: 12
order: 2
title: 位置参数
nav:
  title: Python基础
  order: 1
---

# 位置参数

## 1. 介绍

### 1.1 什么是位置参数

**位置参数**（Positional Argument）是 Python 中最基础、最常用的参数传递方式。它的规则极其简单：**调用时实参的顺序决定了它对应哪个形参——第 1 个实参传给第 1 个形参，第 2 个实参传给第 2 个形参，以此类推。**

```python
def describe_person(name, age, city):
    print(f"{name}，{age} 岁，来自 {city}")


describe_person("小明", 25, "北京")
# 第1个实参 "小明" → 第1个形参 name
# 第2个实参 25     → 第2个形参 age
# 第3个实参 "北京" → 第3个形参 city
```

运行结果：

```text
小明，25 岁，来自 北京
```

位置参数不需要额外的语法标记，你传值的顺序就是一切。正是这种"无标记、只靠位置"的特性，让它既简单又危险——简单到看一眼就能用，危险到顺序搞错也不会报错。

### 1.2 在 Python 知识体系中的位置

在函数参数体系中，位置参数是**一切参数类型的起点**。关键字参数、默认参数、可变参数等所有更高级的参数形式，都是对位置参数的扩展和补充。理解位置参数的核心规则是理解所有后续话题的前提。

位置参数的上级主题是形参与实参的传递机制：形参拿到的是实参对象的引用，位置参数只规定了"哪个实参传给哪个形参"，不改变传递机制本身。

### 1.3 最简示例

从最简单的单参数函数开始：

```python
def double(n):
    return n * 2


result = double(5)
print(result)  # 输出：10
```

当只有一个参数时，位置参数的行为非常直观——没有顺序问题的困扰。位置参数的复杂性和风险，全部来自**多参数**的情况。

---

## 2. 核心内容

### 2.1 位置参数的工作原理

#### 2.1.1 一一对应规则

位置参数的映射规则用图解可以一目了然：

```text
调用方：  describe_person(  "小明" ,   25  ,   "北京"  )
                              │       │        │
                              ↓       ↓        ↓
定义方：  def describe_person( name ,  age ,   city  )
```

每个实参按位置"对号入座"到对应的形参。Python 解释器在函数调用时按以下步骤完成这个映射：

1. 从左到右逐个读取实参
2. 从左到右逐个读取形参
3. 将第 i 个实参的值绑定到第 i 个形参上
4. 所有形参都绑定完毕后，执行函数体

整个过程没有名称匹配、没有默认值回退、没有类型检查——**纯位置对应**。

#### 2.1.2 实参可以是任意表达式

位置参数作为实参传入时，可以是任何能求值的表达式：

```python
def log_event(timestamp, event_type, message):
    print(f"[{timestamp}] {event_type}: {message}")


from datetime import datetime

# 实参来源非常灵活
now = datetime.now().strftime("%H:%M:%S")
log_event(now, "INFO", "系统启动完成")                      # 变量 + 字面量
log_event("10:30:00", "WARNING", f"磁盘使用率 {85}%")       # 字面量 + f-string
log_event(datetime.now().strftime("%H:%M:%S"), "ERROR",     # 函数调用结果
          "数据库连接失败")
```

运行结果：

```text
[10:53:42] INFO: 系统启动完成
[10:30:00] WARNING: 磁盘使用率 85%
[10:53:42] ERROR: 数据库连接失败
```

Python 在调用函数时，**先对每个实参表达式求值，再把求值结果的引用传给形参**。这个求值发生在函数调用之前，参数传递之前，所以表达式可以任意复杂。

### 2.2 顺序决定含义：位置参数的核心约束

位置参数最关键的规则也是最大的陷阱：**Python 只认位置，不认语义**。

```python
def register_user(username, email, age):
    return {"username": username, "email": email, "age": age}


# ✅ 正确
user = register_user("alice", "alice@example.com", 28)
print(user)
# {'username': 'alice', 'email': 'alice@example.com', 'age': 28}

# ❌ 顺序搞错——Python 不报错，但数据全部错位！
user = register_user("alice@example.com", 28, "alice")
print(user)
# {'username': 'alice@example.com', 'email': 28, 'age': 'alice'}
```

Python 看到三个字符串和整数，全部接受了，按照位置一一绑定——它不知道第一个参数"应该"是用户名还是邮箱。这种"静默错误"是位置参数最大的风险：**你写错了顺序，程序照常运行，结果却完全错误**。

#### 2.2.1 顺序错误的风险等级

| 场景 | 风险 | 原因 |
|------|------|------|
| 所有参数类型相同 | **高** | Python 不检查语义，顺序错了也不会抛异常 |
| 参数类型不同 | **中低** | 后续操作可能因类型不匹配而报错，间接暴露问题 |
| 有领域语义（如转账） | **极高** | 顺序错误可能导致业务灾难 |

类型相同时最危险的情况：

```python
def transfer_money(from_account, to_account, amount):
    """转账 —— 如果 from 和 to 写反了，钱就转反了"""
    print(f"从 {from_account} 转出 ¥{amount} → {to_account}")


# 正确
transfer_money("621700001", "621700002", 5000)

# from 和 to 写反——两个都是字符串，Python 完全不觉得有问题
transfer_money("621700002", "621700001", 5000)
```

**缓解策略**：当参数都是同类型且有领域语义时，调用处用含义明确的变量名来标注每个实参的身份：

```python
from_account = "621700001"
to_account = "621700002"
amount = 5000
transfer_money(from_account, to_account, amount)
# 即使只看调用行，也能看出两个账号参数各自的身份
```

调用处的变量名虽然不能阻止 Python 接受错误的顺序，但能让代码审查者和未来的你更容易发现错误。

### 2.3 必选参数与数量匹配

#### 2.3.1 位置参数默认都是必选的

没有默认值的位置参数是**必选参数**（Required Parameter）：调用时必须为每个形参提供对应的实参，缺一不可。

```python
def create_order(product, quantity, price):
    total = quantity * price
    return f"订单：{product} × {quantity}，单价 ¥{price}，总价 ¥{total:.2f}"


print(create_order("机械键盘", 2, 299))  # ✅ 全部提供

# create_order("显示器")     # ❌ TypeError: missing 2 required positional arguments
# create_order("显示器", 1)   # ❌ TypeError: missing 1 required positional argument
# create_order("显示器", 1, 1999, "extra")  # ❌ TypeError: takes 3 but 4 given
```

**错误信息解读**：Python 的 `TypeError` 信息精确地告诉你差了几个参数，这在调试时非常有用：

- `missing 2 required positional arguments: 'quantity' and 'price'` → 少了 2 个，分别是 quantity 和 price
- `missing 1 required positional argument: 'price'` → 少了 1 个：price
- `takes 3 positional arguments but 4 were given` → 定义了 3 个但你传了 4 个

#### 2.3.2 必选参数与可选参数的混合

当函数同时有必选参数和有默认值的可选参数时，**必选参数必须排在可选参数前面**：

```python
# ✅ 正确：必选参数在前，可选参数在后
def send_message(content, recipient="所有人", priority=1):
    print(f"[优先级 {priority}] 发送给 {recipient}：{content}")


send_message("系统维护通知")                         # 只传必选
send_message("服务器异常", "管理员")                  # 必选 + 第1个可选
send_message("紧急漏洞修复", "安全团队", 10)          # 全部传

# ❌ 错误：默认参数不能在必选参数前面
# def broken_func(a=1, b):   # SyntaxError: non-default argument follows default argument
#     pass
```

| 调用方式 | content | recipient | priority | 输出 |
|---------|---------|-----------|----------|------|
| `send_message("系统维护通知")` | "系统维护通知" | "所有人"（默认） | 1（默认） | `[优先级 1] 发送给 所有人：系统维护通知` |
| `send_message("服务器异常", "管理员")` | "服务器异常" | "管理员" | 1（默认） | `[优先级 1] 发送给 管理员：服务器异常` |
| `send_message("紧急漏洞修复", "安全团队", 10)` | "紧急漏洞修复" | "安全团队" | 10 | `[优先级 10] 发送给 安全团队：紧急漏洞修复` |

这个设计有两个好处：
1. 调用时写出来的实参按位置对齐到形参列表，不需要跳过可选参数
2. 语法上保证了"每个必选参数的位置是确定的"——如果可选参数夹在必选参数中间，调用时就无法按位置判断哪个是必选哪个是可选

### 2.4 位置参数的典型应用场景

位置参数在以下场景中特别合适：

**场景一：数学/几何函数——参数序列无歧义**

```python
def distance(x1, y1, x2, y2):
    """两点之间的距离"""
    return ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5


d = distance(0, 0, 3, 4)
print(d)  # 输出：5.0
```

数学上 `(x1, y1, x2, y2)` 的约定顺序使得位置传参很自然——没有人会把 `x2` 放到 `y1` 的位置上。

**场景二：短小的转换/构造函数**

```python
def rgb_to_hex(r, g, b):
    """RGB 转十六进制"""
    return f"#{r:02x}{g:02x}{b:02x}"


print(rgb_to_hex(255, 128, 0))  # 输出：#ff8000
```

三个参数语义上是均匀的"通道值"，顺序从红到绿到蓝是约定俗成的，位置参数简洁而不容易出错。

**场景三：管道式处理——单参数函数串联**

```python
def extract_domain(email):
    return email.split("@")[1]


def is_company_email(domain):
    free = {"gmail.com", "qq.com", "163.com", "outlook.com"}
    return domain not in free


def score_email_trust(email):
    domain = extract_domain(email)
    return "高" if is_company_email(domain) else "一般"


emails = ["zhangsan@antfin.com", "lisi@gmail.com"]
for e in emails:
    print(f"{e} → 可信度：{score_email_trust(e)}")
```

运行结果：

```text
zhangsan@antfin.com → 可信度：高
lisi@gmail.com → 可信度：一般
```

单参数函数天然适合位置传参——不存在"顺序弄错"的问题。这些函数像一个链式管道，数据从左到右流动，位置参数恰好表达了"输入→处理→输出"的单向流程。

**不适宜用位置参数的场景**：
- 参数超过 3 个且类型相同（容易串位）
- 参数有强语义含义但无法从名称体现（如多个 `bool` 标志）
- 调用者可能经常只需要其中某几个参数（改用关键字参数或默认参数）

**反例分析**：一段"看起来很糟糕"的位置参数代码

```python
def export_report(True, False, "sales", "2026Q3", "pdf", "/reports/", 100, False):
    ...

# 谁能看懂这行调用在做什么？每个参数的含义全被位置吞噬了。
# 即使它语法正确，可读性已经降到了零。
```

同样的函数，用关键字参数改写后：

```python
def export_report(*, include_charts=True, include_raw_data=False,
                  report_name, period, format="pdf",
                  output_dir="/reports/", max_rows=100, compress=False):
    ...

export_report(include_charts=True, report_name="sales", period="2026Q3")
# 现在每一个传参的意图都很清楚
```

位置参数的适用区间可以总结为：

```text
参数个数
  ↑
 5+ │  建议强制关键字参数（* 分隔符）
    │
  4 │  考虑关键字参数或拆分函数
    │
 2-3│  位置参数合适（类型不重复时）
    │
  1  │  位置参数最自然
    └──────────────────────→ 参数复杂度
```

### 2.5 位置参数与关键字参数的分界线

位置参数可以和关键字参数混合使用（这是下一篇笔记的主题），但有一条刚性规则：**位置参数必须在关键字参数之前**。

```python
def configure(host, port, debug=False):
    print(f"连接 {host}:{port}，debug={'开' if debug else '关'}")


# ✅ 位置参数在前，关键字参数在后
configure("192.168.1.1", 8080, debug=True)

# ❌ 位置参数不能跟在关键字参数后面
# configure(host="192.168.1.1", 8080, True)
# SyntaxError: positional argument follows keyword argument
```

这个限制让 Python 能够无歧义地决定每个实参的归属。如果允许关键字参数后面出现位置参数，解释器就无法判断那个位置参数应该对应哪个形参。

---

## 3. 最佳实践

### 3.1 推荐 vs 不推荐写法对比

#### 3.1.1 用变量名标注实参含义

**不推荐**：裸值传参——不知道每个值的含义

```python
# 这些数字分别代表什么？读者需要查看函数定义才知道
create_invoice("INV001", 299, 3, 0.13, 50)
```

**推荐**：调用处用有语义的变量名

```python
product_code = "INV001"
unit_price = 299
quantity = 3
tax_rate = 0.13
shipping = 50
create_invoice(product_code, unit_price, quantity, tax_rate, shipping)
```

**原因**：变量名充当了"行内文档"的角色。即使不看函数定义，调用处的变量名已经透露出每个参数的语义。

#### 3.1.2 参数超过 3 个时考虑改用关键字参数

**不推荐**：5 个以上的位置参数——极易串位

```python
def search_items(category, min_price, max_price, sort_by, ascending, page, page_size):
    ...

# 这 7 个参数分别对应什么？读代码的人只能靠数数
results = search_items("electronics", 100, 5000, "rating", False, 1, 20)
```

**推荐**：多参数时强制或鼓励使用关键字参数（配合 `/` 和 `*` 分隔符）

```python
def search_items(category, /, min_price=0, max_price=None, *,
                 sort_by="relevance", ascending=True,
                 page=1, page_size=20):
    ...

# 调用时意图清晰
results = search_items("electronics", min_price=100, max_price=5000,
                       sort_by="rating", page_size=20)
```

**原因**：位置参数超过 3 个后，人类的大脑很难准确追踪一一对应关系。Python 3.8+ 的 `/`（仅位置分隔符）和 `*`（仅关键字分隔符）给了你精确控制参数传递方式的工具。

#### 3.1.3 顺序一致的参数放在一起

**不推荐**：同类型参数交替排列

```python
# str、int、str、int 交替——传参时容易搞混
def process_data(name, timeout, url, retries):
    ...
```

**推荐**：相关参数分组

```python
# url 和 name 属于连接信息，timeout 和 retries 属于策略参数
def process_data(url, name, timeout=30, retries=3):
    ...
```

**原因**：分组让调用者按"块"来记忆参数顺序，降低出错概率。

#### 3.1.4 多 bool 参数用关键字或枚举替代

**不推荐**：多个 bool 位置参数——完全看不出含义

```python
# True/False 分别对应什么？只能去查函数定义
def create_file(filename, overwrite, backup, compress, encrypt):
    """创建文件——4 个布尔标志位"""
    ...

create_file("data.txt", True, False, True, False)  # 这是什么语义？
```

**推荐**：对 bool 标志使用关键字参数或拆分为多个行为明确的小函数

```python
# 方式一：bool 参数用关键字传递
def create_file(filename, *, overwrite=False, backup=False,
                compress=False, encrypt=False):
    ...

create_file("data.txt", overwrite=True, compress=True)
# 意图清晰：覆盖模式 + 压缩

# 方式二：拆分为独立函数
def create_file_overwrite_compressed(filename):
    """创建覆盖式压缩文件——语义内化到函数名中"""
    ...
```

**原因**：`True/False` 在调用处不具备自解释能力。`f(x, True, False, False, True)` 这样的代码即使立即看也可能看不懂。关键字参数 `overwrite=True` 消除了这个问题。

### 3.2 常见错误模式及修正

**错误一：同类型多参数顺序颠倒——静默错误**

这是位置参数最危险的 bug——程序不报错，结果却错误。用一个具体的 bug 场景来说明：

```python
def charge_subscription(user_id, plan_id, months):
    """用户订阅——按 user_id、plan_id、months 扣费"""
    print(f"为用户 {user_id} 订阅 {plan_id}，时长 {months} 个月")


# 实际调用时，两个字符串参数的顺序如果写反了：
charge_subscription("pro_plan", "user_888", 12)
# 程序输出：为用户 pro_plan 订阅 user_888，时长 12 个月
# 不会报错！但用户 ID 和套餐 ID 完全错位了
```

修正方法：
- 用变量名标注实参身份
- 参数超过 3 个时考虑转换为关键字参数
- 使用类型别名或数据类来增加类型安全性

**错误二：默认参数的位置陷阱**

有默认值的参数仍然是位置参数——你可以通过位置传参覆盖它：

```python
def configure(host, port=8080):
    print(f"连接 {host}:{port}")

configure("192.168.1.1")        # port 用默认值
configure("192.168.1.1", 9090)  # port 被位置传参覆盖
```

如果你只看到 `configure("192.168.1.1", 9090)` 这行调用，你需要知道第二个位置参数是 port 还是其他什么东西。当有默认值的参数较多时，位置传参的意图会变得模糊。

**错误三：位置参数和关键字参数混用时顺序不对**

```python
def func(a, b, c):
    print(f"a={a}, b={b}, c={c}")

# ✅ 位置在前、关键字在后
func(1, c=3, b=2)   # a=1, b=2, c=3

# ❌ 关键字在前、位置在后 → SyntaxError
# func(b=2, 1, c=3)  # SyntaxError: positional argument follows keyword argument
```

**错误四：把"使用过"的函数调用当作"定义模板"**

当你习惯于某个函数的调用方式后，可能会在定义新函数时无意中照搬参数顺序，导致新函数的参数顺序不符合直觉：

```python
# 你可能经常这样调 print()：
print("用户:", name, "年龄:", age)

# 然后在定义自己的函数时无意中模仿了 print 的参数顺序
def log_user_info(prefix1, value1, prefix2, value2):  # 不够直观
    ...

# 更好的设计：
def log_user_info(name, age):  # 核心数据在前，格式化在函数内部做
    print(f"用户: {name}, 年龄: {age}")
```

### 3.3 位置参数的设计检查清单

在定义函数时，用以下问题自检参数设计：

1. **参数超过 3 个且类型相同？** → 考虑引入关键字参数或 `*` 分隔符
2. **包含多个 bool 标志？** → 全部改为仅关键字参数
3. **参数有天然的固定顺序**（如 x1, y1, x2, y2）？→ 位置参数非常合适
4. **调用者可能只关心其中某几个参数？** → 给不常用的参数加默认值
5. **参数的语义能从名称自然推断吗？** → 如果调用处的变量名就能说明一切，位置参数就够用

这是位置参数最危险的 bug——程序不报错，结果却错了。

修正方法：
- 用变量名标注实参
- 参数超过 3 个时转换为关键字参数或使用 NamedTuple
- 代码审查时重点关注同类型多参数的调用处

**错误二：认为"有默认值的参数就可以不传位置也行"**

有默认值的位置参数仍然可以通过位置传参：

```python
def configure(host, port=8080):
    ...

configure("192.168.1.1")     # port 用默认值 8080
configure("192.168.1.1", 9090)  # port 被位置传参覆盖为 9090
```

但如果你只想传第二个参数而不传第一个，位置参数做不到——这时必须用关键字参数（`configure(port=9090)` 仍然需要 host）。

**错误三：混用位置参数和关键字参数时顺序不对**

```python
def func(a, b, c):
    ...

func(1, c=3, b=2)   # ✅ a 位置传 1，c 和 b 关键字传
func(b=2, 1, c=3)   # ❌ SyntaxError: 位置参数不能跟在关键字参数后面
```

---

## 4. 原理

### 4.1 位置参数的绑定机制

当你调用 `func(1, 2, 3)` 时，Python 内部是如何把实参映射到形参的？这个过程发生在函数调用的起始阶段，由解释器的参数绑定机制完成。

```text
调用 func(1, 2, 3)
  ↓
1. 解析实参列表：[1, 2, 3]
2. 读取函数对象中的形参定义信息
3. 判断每个实参的传递方式：
   - 没有 keyword=value 格式 → 按位置处理
   - 将位置 i 的实参绑定到位置 i 的形参
4. 形成形参到实参对象的绑定关系：
   a=1, b=2, c=3
5. 进入函数体执行
```

这个过程的核心是**位置到位置的线性映射**，没有名称参与。这意味着在绑定阶段，Python 完全不关心你的形参叫什么名字——只关心位置编号。

### 4.2 位置参数与 `*args` 的关系

位置参数和可变位置参数 `*args` 共享同一套位置绑定机制。当函数定义为 `def func(a, b, *args)` 时：

1. 前 2 个位置实参绑定到 `a` 和 `b`
2. 剩余的位置实参全部被打包进 `args` 元组

```python
def demo(a, b, *args):
    print(f"a={a}, b={b}, args={args}")


demo(1, 2)           # a=1, b=2, args=()
demo(1, 2, 3, 4, 5)  # a=1, b=2, args=(3, 4, 5)
```

这解释了为什么 `*args` 也被称为"可变位置参数"——它收集的是"所有通过位置传入但未被前面形参匹配的实参"。位置参数的"先到先得"规则决定了形参列表中 `*args` 之前的参数会优先拿走位置实参。

---

## 5. 总结

本文围绕 Python 位置参数展开，主要介绍了以下内容：

- 位置参数按调用时的顺序一一对应到形参，第 1 个实参 → 第 1 个形参，依次类推
- 位置参数的核心规则：顺序决定含义，Python 只认位置不认语义
- 没有默认值的位置参数是必选参数，调用时缺一不可；必选参数必须排在可选参数前面
- 位置参数顺序搞错不会报错（当类型相同时），这是最隐蔽的 bug 来源，可用变量名标注实参作为缓解策略
- 位置参数适合短小、无歧义的函数（数学计算、转换函数、单参数管道），超过 3 个同类型参数时建议改用关键字参数
- 位置参数必须在关键字参数之前，Python 的位置绑定是纯线性映射
- 位置参数和可变位置参数 `*args` 共享同一套位置绑定机制