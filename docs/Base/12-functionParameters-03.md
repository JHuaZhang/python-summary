---
group:
  title: 【12】函数参数介绍
  order: 12
order: 3
title: 关键字参数与混合传参
nav:
  title: Python基础
  order: 1
---

# 关键字参数与混合传参

## 1. 介绍

### 1.1 什么是关键字参数

**关键字参数**（Keyword Argument）是调用函数时以 `形参名=实参值` 的形式传递的参数。与位置参数靠"第几个"来匹配不同，关键字参数靠**名称**来匹配——你明确告诉了 Python 这个值是给哪个形参的。

```python
def describe_person(name, age, city):
    print(f"{name}，{age} 岁，来自 {city}")


# 位置参数——靠顺序
describe_person("小明", 25, "北京")

# 关键字参数——靠名称，顺序任意
describe_person(age=25, city="北京", name="小明")
describe_person(city="上海", name="小红", age=22)
```

运行结果：

```text
小明，25 岁，来自 北京
小明，25 岁，来自 北京
小红，22 岁，来自 上海
```

关键字参数带来了两个核心价值：**顺序自由**和**意图自明**。调用 `describe_person(age=25, city="北京", name="小明")` 时，即使不看函数定义，每个值的含义也一目了然。

### 1.2 在 Python 知识体系中的位置

关键字参数是建立在位置参数基础上的升级。位置参数解决了"怎么传"的基本问题，关键字参数解决了"怎么传得更清晰、更安全"的问题。在参数体系中：

- 位置参数 → 靠位置匹配（基础）
- **关键字参数 → 靠名称匹配（本篇）**
- 默认参数 + 关键字参数 → 跳过不想要的默认值
- `*` 分隔符 + 关键字参数 → 强制使用关键字，提升安全性

### 1.3 最简示例

```python
def send_email(to, subject, body):
    print(f"发送邮件给 {to}，主题：{subject}")


send_email(to="admin@example.com",
           subject="系统通知",
           body="服务器将于今晚 22:00 维护")
```

运行结果：

```text
发送邮件给 admin@example.com，主题：系统通知
```

三行调用读起来像三句英文描述——这就是关键字参数的"自文档化"效果。

---

## 2. 核心内容

### 2.1 关键字参数的工作原理

#### 2.1.1 名称匹配替代位置匹配

关键字参数的核心机制是**名称绑定**——你指定了形参的名字，Python 就按照名字把值传进去：

```text
调用方：  describe_person(name="小明", age=25, city="北京")
                            │          │         │
                            ↓          ↓         ↓
定义方：  def describe_person(name,     age,      city)
```

与位置参数的对比如下：

| 维度 | 位置参数 | 关键字参数 |
|------|---------|-----------|
| 匹配方式 | 第 i 个实参 → 第 i 个形参 | 名称 = 实参 → 同名形参 |
| 顺序要求 | 必须按定义顺序 | 可以任意顺序 |
| 可读性 | 依赖位置推导含义 | 名称即含义 |
| 出错风险 | 顺序错→静默错误 | 名称错→TypeError（立即发现） |
| 语法 | `f(x, y, z)` | `f(a=x, b=y, c=z)` |

关键字参数的名称必须与形参名**严格一致**——写错了 Python 会立即抛 `TypeError`：

```python
def send_email(to, subject, body):
    ...

# ❌ 名称不对——形参叫 to，不是 recipient
# send_email(recipient="admin@example.com")
# TypeError: send_email() got an unexpected keyword argument 'recipient'
```

这个行为是关键字参数的一个安全特性：**名称不匹配立即报错，不会像位置参数那样安安静静地把数据传给错误的形参。**

#### 2.1.2 关键字参数的传递流程

```text
调用 describe_person(age=25, name="小明", city="北京")
  ↓
1. Python 解析实参列表，识别出关键字参数：
   [("age", 25), ("name", "小明"), ("city", "北京")]
  ↓
2. 读取函数对象的形参列表：name, age, city
  ↓
3. 逐个处理关键字实参：
   - "name" → 找到形参 name，绑定值 "小明"
   - "age"  → 找到形参 age，绑定值 25
   - "city" → 找到形参 city，绑定值 "北京"
  ↓
4. 所有关键字参数绑定完成 → 执行函数体
```

关键字参数的匹配过程完全由名称驱动，所以在步骤 3 中可以按任意顺序匹配。

### 2.2 关键字参数的核心优势

#### 2.2.1 顺序自由——不再受位置约束

当函数有很多同类型参数时，位置传参容易搞错顺序且不会报错。关键字参数彻底解决了这个问题：

```python
def create_booking(guest_name, check_in, check_out, room_type, guests):
    return f"{guest_name}，{check_in} 至 {check_out}，{room_type}，{guests} 人"


# 位置传参——5 个参数，顺序必须记准确
create_booking("张三", "2026-10-01", "2026-10-05", "大床房", 2)

# 关键字传参——顺序任意，每个值自带标签
create_booking(
    room_type="双床房",
    check_out="2026-10-06",
    guest_name="李四",
    guests=1,
    check_in="2026-10-02",
)
```

后者即使打乱顺序也不影响正确性——这就是关键字参数的安全感。

#### 2.2.2 跳过不想指定的可选参数

当函数有很多带默认值的可选参数时，位置参数只能按顺序覆盖前面的，关键字参数可以**只覆盖你想改的参数**：

```python
def query_database(table, columns="*", where=None, order_by=None,
                   limit=None, offset=None):
    ...

# 位置参数：必须按顺序传，想传 limit 就必须把前面的全传了
query_database("users", "*", "active=1", "created_at DESC", 10)

# 关键字参数：只指定需要的，其余用默认值
query_database(
    table="users",
    where="active = 1",
    order_by="created_at DESC",
    limit=10,
)
```

试想一个有 10 个默认值参数的函数，调用者只想修改最后一个参数——用位置参数需要把前面 9 个都写出来（而且顺序不能错），用关键字参数只需要写一个名字。

#### 2.2.3 self-documenting——调用处就是文档

```python
# 位置参数——你需要查文档才知道 True/False/10 分别对应什么
connect("db.example.com", 3307, "admin", "secret123", "myapp", True, 10)

# 关键字参数——每一行的含义都清晰可读
connect(
    host="db.example.com",
    port=3307,
    user="admin",
    password="secret123",
    database="myapp",
    use_ssl=True,
    timeout=10,
)
```

六个月后你回来看这段代码，关键字版本不需要查任何文档就能理解每个参数的含义。

#### 2.2.4 有默认值时，只传需要修改的那几个

```python
def format_report(title, content, *, show_date=True, show_author=True,
                  show_footer=True):
    parts = [f"# {title}", "", content]
    if show_date:
        parts.append(f"生成日期：2026-09-22")
    if show_author:
        parts.append(f"作者：系统")
    if show_footer:
        parts.append("---")
    return "\n".join(parts)


# 只想关掉 author 和 footer，其他保持不变
report = format_report("周报", "本周完成 5 个模块开发",
                       show_author=False, show_footer=False)
```

用位置参数不可能实现这个需求——你无法"跳过"前几个参数直接覆盖后面的。

### 2.3 混合传参与三条铁律

当一个调用中同时出现位置参数和关键字参数时，有三条不可违反的规则。

#### 2.3.1 铁律一：位置参数必须在关键字参数之前

```python
def configure(host, port=8080, debug=False):
    print(f"连接 {host}:{port}，debug={'开' if debug else '关'}")


# ✅ 位置在前，关键字在后
configure("192.168.1.1", port=9090, debug=True)

# ✅ 可以混搭：部分用位置，部分用关键字
configure("192.168.1.1", debug=True)

# ❌ 关键字在前，位置在后 → SyntaxError
# configure(host="192.168.1.1", 9090, True)
# SyntaxError: positional argument follows keyword argument
```

这不是 TypeError 而是 **SyntaxError**——在语法层面就被禁止了。原因很简单：如果允许关键字参数后面出现位置参数，解释器无法确定后面的位置参数应该对应哪个没有被关键字覆盖的形参。

#### 2.3.2 铁律二：一个形参不能被赋值两次

```python
def process(a, b, c):
    print(f"a={a}, b={b}, c={c}")


# ✅ 三个参数各赋值一次
process(1, b=2, c=3)  # a=1, b=2, c=3

# ❌ a 先被位置传 1，又被关键字传 2
# process(1, a=2, c=3)
# TypeError: got multiple values for argument 'a'
```

Python 不允许同一个形参同时通过位置和关键字接收到两个值——这是最直接的冲突。

#### 2.3.3 铁律三：关键字的名称必须是定义中的形参名

```python
def process(a, b, c):
    ...

# ❌ d 不是形参名
# process(1, 2, 3, d=4)
# TypeError: got an unexpected keyword argument 'd'
```

### 2.4 `*` 分隔符：强制使用关键字参数

#### 2.4.1 基本语法

在形参列表中单独放一个 `*`，它**之后**的所有形参都变成"仅关键字参数"（keyword-only argument）——只能通过关键字传递，不能通过位置传递。

```python
def register_user(username, email, *, role="user", notify=True):
    pass

# ✅ 关键字传 * 之后的参数
register_user("alice", "alice@example.com", role="admin", notify=False)

# ❌ 位置传 * 之后的参数 → TypeError
# register_user("bob", "bob@example.com", "admin", True)
# TypeError: takes 2 positional arguments but 4 were given
```

`username` 和 `email`（`*` 之前）可以用位置也可以用关键字。`role` 和 `notify`（`*` 之后）**必须**用关键字。

**仅关键字参数的绑定机制**：

```text
调用 register_user("alice", "alice@ex.com", role="admin", notify=False)
  ↓
1. 处理位置实参："alice" → username，"alice@ex.com" → email
2. 处理关键字实参：role="admin" → role，notify=False → notify
3. role 和 notify 因为位于 * 之后，不接受位置绑定
4. 形参列表解析完毕 → 执行函数体
```

注意当 `*` 存在时，即使你尝试通过位置多传参数，它们也不会被分配给 `*` 后面的形参——直接报 TypeError。`*` 是**硬边界**。

**多个 `*` 的使用限制**：形参列表中最多只能有一个独立的 `*`。但如果有可变位置参数 `*args`，它后面的参数也会自动成为仅关键字参数：

```python
# *args 后面的参数自动是仅关键字参数
def func(a, b, *args, c, d=10):
    print(f"a={a}, b={b}, args={args}, c={c}, d={d}")


func(1, 2, 3, 4, 5, c=100, d=200)  # a=1, b=2, args=(3, 4, 5), c=100, d=200
# c 和 d 在 *args 之后，只能通过关键字传
```

#### 2.4.2 仅关键字参数的默认值

仅关键字参数可以有默认值（此时可选），也可以没有默认值（此时必须传）：

```python
def move_file(source, destination, *, overwrite):
    """overwrite 没有默认值——调用时必须明确表态"""
    action = "覆盖" if overwrite else "拒绝覆盖"
    print(f"移动 {source} → {destination}（{action}）")


# ✅ 必须通过关键字明确指定
move_file("/tmp/a.txt", "/data/a.txt", overwrite=True)
move_file("/tmp/b.txt", "/data/b.txt", overwrite=False)

# ❌ 不传 overwrite
# move_file("/tmp/c.txt", "/data/c.txt")
# TypeError: missing 1 required keyword-only argument: 'overwrite'
```

这种设计特别适合那些"不表态就是隐患"的参数——比如 `overwrite`（是否覆盖已有文件）、`force`（是否强制执行）——调用者必须明确说出自己的意图。

#### 2.4.3 何时使用 `*` 分隔符

| 场景 | 是否使用 `*` | 原因 |
|------|-------------|------|
| bool 标志（`overwrite`, `verbose` 等） | ✅ 使用 | `True/False` 在调用处无法自解释 |
| 多个有默认值的可选参数 | ✅ 使用 | 调用者需要跳过部分默认值 |
| 参数超过 4 个且有语义混淆风险 | ✅ 使用 | 减少位置传参的出错概率 |
| 单参数或双参数的简单函数 | ❌ 不需要 | 位置传参更简洁 |
| 数学/算法类有天然顺序的参数 | ❌ 不需要 | x, y 的序列关系本身就很清晰 |

### 2.5 关键字参数的适用场景总结

```text
参数特征
  ↑
  │  bool 参数、无天然顺序的配置
  │     → 必须用关键字（加 * 分隔符）
  │
  │  可选配置、有默认值的参数
  │     → 强烈建议用关键字（便于跳过）
  │
  │  参数多（4+个）且类型相同
  │     → 建议用关键字（避免顺序错误）
  │
  │  有明确顺序的参数（数学、坐标等）
  │     → 位置参数即可
  │
  │  单参数函数
  │     → 位置参数最自然
  │
  └────────────────────────→ 参数复杂度
```

---

## 3. 最佳实践

### 3.1 推荐 vs 不推荐写法对比

#### 3.1.1 bool 参数必须用关键字传

**不推荐**：bool 值通过位置传递

```python
# True/False 分别代表什么？
create_file("data.txt", True, False)
# 读者需要查定义才知道：第一个 True 是 overwrite，第二个 False 是...backup? 还是 compress?
```

**推荐**：bool 参数强制为仅关键字参数

```python
def create_file(name, *, overwrite=False, backup=True):
    ...

create_file("data.txt", overwrite=True, backup=False)
# 每个参数的意图都清清楚楚
```

#### 3.1.2 用关键字参数减少 API 变更的破坏性

**不推荐**：依赖位置传递的新参数直接插入形参列表中间

```python
# 旧版本
def search(keyword, case_sensitive=False, max_results=10):
    ...

# 新版本——page 插入在中间位置
def search(keyword, case_sensitive=False, page=1, max_results=10):
    ...
# 所有用位置传参的旧代码：search("Python", True, 20) 的含义全变了！
```

**推荐**：新增的参数加在仅关键字参数区域

```python
# 旧版本
def search(keyword, case_sensitive=False, *, max_results=10):
    ...

# 新版本——新增 page，在仅关键字区域，不影响旧调用
def search(keyword, case_sensitive=False, *, page=1, max_results=10):
    ...

# 旧代码 search("Python", case_sensitive=True, max_results=20) 不受影响
```

#### 3.1.3 不要滥用关键字参数

**不推荐**：简单函数也用关键字

```python
# 画蛇添足——两个参数还能搞错顺序吗？
result = add(a=1, b=2)
flag = is_even(n=42)
```

**推荐**：简单场景用位置参数

```python
result = add(1, 2)
flag = is_even(42)
```

**判断标准**：如果你在调用处读代码时，不看形参名也能立即理解每个值的含义——那就不需要关键字参数。如果每个值都看起来像"裸数据"，那关键字参数就是必要的。

### 3.2 常见错误模式及修正

**错误一：给用位置传参的地方传了不对的关键字**

```python
def send_email(to, subject, body):
    ...

# ❌ 形参叫 to，你用了 recipient
# send_email(recipient="admin@ex.com")  # TypeError
```

修正：检查函数签名中的形参名，确保关键字名称一致。IDE 的自动补全可以有效减少这类错误。

**错误二：同一个参数被传了两次**

```python
def process(a, b, c):
    ...

# ❌ 位置传了 a=1，关键字又传了一次 a=2
# process(1, b=2, a=3)
# TypeError: got multiple values for argument 'a'
```

修正：当混合传参时，确保通过位置传入的值不会被关键字重复覆盖。通常把必选参数放在位置，只对可选参数使用关键字。

**错误三：`*` 分隔符放错位置**

```python
# ❌ * 放在第一个参数前面——所有参数都是仅关键字
def func(*, a, b, c):  # 调用时不能写 func(1, 2, 3)，必须写 func(a=1, b=2, c=3)
    pass
```

修正：把那些有明确调用顺序需要的参数放在 `*` 前面。

**错误四：忘记关键字参数可以不按顺序**

有些人习惯了位置参数的思维方式，即使使用关键字参数也会按定义顺序书写。实际上关键字参数没有这个限制——按语义分组比按定义顺序更有意义：

```python
# 按语义分组比按定义顺序更清晰
create_user(
    # 身份信息
    username="alice",
    email="alice@example.com",
    # 权限配置
    role="admin",
    active=True,
    verified=True,
)
```

**错误五：用关键字参数覆盖未提供的默认值时思维混乱**

```python
def search(query, page=1, size=20, sort_by="relevance"):
    ...

# 想只改 size——位置参数做不到
# search("Python", 1, 50)  # sort_by 也被迫传了"relevance"这不叫覆盖

# 关键字参数干净利落
search("Python", size=50)  # 只改 size，page 和 sort_by 用默认值
```

### 3.3 关键字参数何时不适用

关键字参数虽然强大，但并非处处适用。以下场景反而应该坚持用位置参数：

**场景一：单参数函数**

```python
def double(n):
    return n * 2

# 👍 位置参数即可
double(21)

# 👎 过度使用关键字
double(n=21)  # 多此一举
```

**场景二：参数有天然、固定的语义顺序**

```python
# 坐标转换——x, y 的顺序是数学家也认可的约定
def translate(x, y, dx, dy):
    return (x + dx, y + dy)

translate(10, 20, 5, -3)  # 位置传参毫无歧义
```

**场景三：数学/算法类函数**

```python
# copy 操作的 (source, dest) 顺序是全行业约定
import shutil
shutil.copy("a.txt", "b.txt")  # 位置传参从来没人传错
```

**反例：滥用关键字参数会让简洁的代码变啰嗦**

```python
# 过度工程化——3 个参数，有明确语义，但全用了仅关键字
def calculate_area(*, length, width, unit="cm²"):
    return f"{length * width} {unit}"

# area = calculate_area(5, 10)          # ❌ TypeError!
area = calculate_area(length=5, width=10)  # 可以，但比位置写法啰嗦
```

### 3.4 关键字参数设计检查清单

定义函数时，用以下问题自检：

1. **哪些参数是 bool？** → 全部放到 `*` 之后作为仅关键字参数
2. **哪些参数调用者可能经常跳过？** → 给默认值，放到 `*` 之后
3. **哪些参数有固定的语义顺序？** → 放到 `*` 之前，作为位置参数
4. **新增参数会破坏已有调用吗？** → 加到 `*` 之后，已有调用不受影响
5. **调用方看不懂函数签名的参数顺序？** → 把容易混淆的参数移到 `*` 之后

---

## 4. 原理

### 4.1 参数绑定的执行顺序

当调用 `func(1, b=2, c=3)` 时，Python 内部按以下步骤绑定参数：

1. 处理所有位置实参（`1`），按位置绑定到形参（`a=1`）
2. 处理所有关键字实参（`b=2, c=3`），按名称绑定到形参（`b=2, c=3`）
3. 检查每个形参是否被多次赋值
4. 对未赋值的形参填充默认值
5. 检查所有必选形参是否都有值

这个顺序解释了"位置在前、关键字在后"的语法约束：步骤 1 先于步骤 2 执行，所以位置参数不能出现在关键字参数后面——解释器在处理关键字参数时，已经无法判断后面的裸值应该属于哪个位置。

### 4.2 仅关键字参数的内部标记

Python 通过函数对象的 `__code__` 属性在底层区分不同类型的参数。通过字节码可以观察到：

```python
def demo(a, b, *, c, d=10):
    pass

# 可以看到函数对象中的参数计数信息
print(demo.__code__.co_argcount)       # 2 —— * 之前的普通参数个数
print(demo.__code__.co_kwonlyargcount) # 2 —— * 之后的仅关键字参数个数
print(demo.__code__.co_varnames)       # ('a', 'b', 'c', 'd')
```

`co_argcount` = 2 表示有两个位置参数（`a` 和 `b`），`co_kwonlyargcount` = 2 表示有两个仅关键字参数（`c` 和 `d`）。Python 解释器在调用函数时读取这些元数据来决定如何解析实参。

### 4.3 关键字参数与 `**kwargs` 的关系

关键字参数和可变关键字参数 `**kwargs` 共享名称匹配机制：

```python
def demo(a, b, **kwargs):
    print(f"a={a}, b={b}, kwargs={kwargs}")


demo(a=1, b=2, c=3, d=4)  # a=1, b=2, kwargs={'c': 3, 'd': 4}
demo(1, 2, c=3, d=4)       # a=1, b=2, kwargs={'c': 3, 'd': 4}
demo(1, b=2, c=3)           # a=1, b=2, kwargs={'c': 3}
```

`**kwargs` 收集所有通过关键字传入但未被前面形参匹配的实参。对于显式声明的形参 `a` 和 `b`，无论是通过位置还是关键字传入，都会被自身的形参接收，不会落入 `kwargs`。

---



## 5. 总结

本文围绕 Python 的关键字参数与混合传参展开，主要介绍了以下内容：

- 关键字参数以 `形参名=值` 的形式传递，靠名称而非位置匹配形参
- 关键字参数的四大优势：顺序自由、跳过可选参数、自文档化、有默认值时只传需要的
- 混合传参三条铁律：位置在前关键字在后、一个形参不传两次、关键字名必须与形参名一致
- `*` 分隔符标记仅关键字参数——之后的参数只能通过关键字传递，适用于 bool 标志和易混淆的配置参数
- 最佳实践：bool 参数强制关键字、用关键字参数保护 API 向下兼容、不滥用关键字（简单函数用位置即可）
- 底层机制：参数绑定先位置后关键字，`co_argcount` / `co_kwonlyargcount` 记录参数类型，`**kwargs` 收集未匹配的关键字参数