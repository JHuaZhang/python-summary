---
group:
  title: 【09】条件分支
  order: 9
order: 13
title: match-case 结构化模式匹配
nav:
  title: Python基础
  order: 1
---

# match-case 结构化模式匹配

## 1. 介绍

### 1.1 什么是 match-case 结构化模式匹配

常见的条件分支工具——`if-elif-else`、嵌套 `if`——都是"比较值"的判断：拿一个值和一个个条件比对，相等或满足就执行。但很多判断不止"值相不相等"，还要看"结构长什么样"：一段命令是"二元的还是三元的"、一条数据"是 Point 对象且 x=0"、一条消息"是带 name 和 age 字段的字典且 age>=18"。这类判断既看值又看结构，用 `if-elif-else` 拼起来又长又容易把"解构取属性"和"判条件"混成一团。Python 3.10 引入的 `match-case` 就是专门解决这类问题的语法。

`match-case`（结构化模式匹配，structural pattern matching）是一种**按"模式"匹配值的语法**：把一个值依次和多个 `case` 后面的模式比对，命中第一个匹配的模式就执行它对应的分支。模式的强大之处在于它不只是"相等比较"——它能在一条 `case` 里同时做"判结构 + 解构取值 + 绑定变量 + 加守卫条件"四件事。一个 `case [x, 0]:` 就同时表达了"匹配长度为 2 的序列 + 第二个元素是 0 + 把第一个元素绑定到 x 上"。

`match-case` 不是"更好的 switch"那么简单。它真正擅长的是**解构**：把列表、元组、字典、对象按结构拆开，同时取出里面的部分。这让处理命令、解析数据、分发消息这类"既看形状又取内容"的逻辑从一串啰嗦的 `if`+`len`+`索引` 压缩成几行清晰的模式。

**一句话定位**：`match-case` 是 Python 3.10+ 的结构化模式匹配语句，按"模式"逐个比对一个值，命中即执行，一条模式可同时表达"判结构 + 解构取值 + 绑定变量 + 守卫条件"。

### 1.2 最简示例

先用一个最小例子看清 `match-case` 的长相：按 HTTP 状态码分发描述。

```python
def http_status(code):
    match code:
        case 200:
            return "成功"
        case 404:
            return "未找到"
        case 500:
            return "服务器错误"
        case _:
            return "其他状态"

print(http_status(404))
```

**运行结果**：

```text
未找到
```

`match code:` 把 `code` 作为被匹配的值；下面每个 `case` 后跟一个模式和分支体。`code` 为 404 时，第一行 `case 200:` 不匹配，往下到 `case 404:` 匹配命中，返回"未找到"。`case _:` 是通配符模式，匹配任何值，用来兜底——和 `if-elif-else` 里的 `else` 角色类似，但这里也是正儿八经的"模式"。把 `code` 改成 403，前三个都不中，落到 `case _:` 返回"其他状态"。这就是 `match` 最基本的形态：把值依次和模式比对，**第一匹配即停**。

### 1.3 速览

`match-case` 的关键写法整体如下，先建个总印象，后面逐个展开：

| 模式 | 写法 | 含义 |
|------|------|------|
| 字面量模式 | `case 200:` / `case "ok":` | 匹配固定值 |
| 通配符模式 | `case _:` | 匹配任何值（兜底） |
| 变量绑定 | `case x:` | 匹配任何值并绑定到 x |
| 序列模式 | `case [x, 0]:` / `case [a, *rest]:` | 解构列表/元组 |
| 映射模式 | `case {"name": n}:` | 解构字典（按键） |
| 或模式 | `case 1 \| 2 \| 3:` | 多个模式之一匹配即可 |
| as 模式 | `case [a, b] as p:` | 匹配并绑定整个值 |
| 守卫 | `case x if x > 0:` | 模式 + 额外条件 |
| 类模式 | `case Point(x=0):` | 按类型 + 属性匹配 |

几个要点先记在心里，后面逐一展开：

- `match` 是**语句**，`case` 也是语句——和 `if`/`else` 一样，命中第一个匹配就执行并跳出，不会继续往下。
- 模式匹配**不只是相等**：它能解构、能绑定变量、能加 `if` 守卫，是 `==` 比不出来的能力。
- 通配符 `_` 是"匹配任何值但不绑定"——和普通变量名 `x` 的区别是 `_` 不真正捕获值，避免不必要的绑定。
- 序列/映射/类模式能"**一边判断结构一边取值**"，是 `match-case` 区别于 `if-elif-else` 的核心能力。
- 模式有**匹配顺序**：具体模式放前、通用模式放后，否则通用模式会把具体的"截胡"。
- `match-case` 需 **Python 3.10+**，老代码里没有，版本兼容性要注意。

## 2. 核心内容

### 2.1 match 语句基本结构

`match` 语句的骨架是：一句 `match <被匹配值>:` 开头，下面跟若干个 `case <模式>:` 分支，每个分支带一个语句体。值从上到下依次和模式比对，命中第一个就执行对应体，不再往下看。

```text
match <值>:
    case <模式1>:
        分支体1
    case <模式2>:
        分支体2
    case <模式3>:
        分支体3
    ...
    case _:                  # 可选的兜底
        兜底分支
```

几条规则先记清楚：

- 一个 `match` 至少要有一个 `case`，没有 `case` 的 `match` 是语法错。
- `case _:` 通配符不是必须的；没有则"全都没匹配时什么都不做"（类似 `if-elif` 没写 `else`）。
- 每个分支体由**缩进**决定归属，和 `if-elif-else` 一致。
- 命中即停——和 `if-elif-else` 一样，不会"穿透"到下一个 `case`（这点和 C 的 switch 不同）。

### 2.2 字面量模式：匹配固定值

字面量模式是最简单的模式——直接匹配一个固定的值，等价于"值等于这个字面量"。支持数字、字符串、`None`、`True`、`False` 这些字面量常量。

**数字字面量**：

```python
def http_status(code):
    match code:
        case 200:
            return "成功"
        case 404:
            return "未找到"
        case 500:
            return "服务器错误"
        case _:
            return "其他状态"

for c in [200, 404, 500, 403]:
    print(f"  {c} → {http_status(c)}")
```

**运行结果**：

```text
  200 → 成功
  404 → 未找到
  500 → 服务器错误
  403 → 其他状态
```

`code` 一次和 200、404、500 三个字面量比对，命中对应的就执行。`403` 不匹配任何一个具体字面量，落到 `case _:` 兜底。

**字符串字面量**：

```python
def greet(name):
    match name:
        case "admin":
            return "管理员你好"
        case "guest":
            return "游客你好"
        case _:
            return f"你好，{name}"

for n in ["admin", "guest", "alice"]:
    print(f"  {n} → {greet(n)}")
```

**运行结果**：

```text
  admin → 管理员你好
  guest → 游客你好
  alice → 你好，alice
```

字符串字面量模式要求**完全相等**，大小写敏感——`"admin"` 不会匹配 `"Admin"`。这种"按离散值分发"的字面量匹配，正是 `match-case` 替代长 `if-elif` 链最直观的用法。

### 2.3 通配符模式 _：兜底

`case _:` 中的下划线 `_` 是**通配符模式**——它匹配任何值，且不绑定变量。它通常放在所有 `case` 的最后充当"兜底"，和 `if-elif-else` 里的 `else` 角色类似。

```python
def classify(n):
    match n:
        case 0:
            return "零"
        case 1:
            return "一"
        case _:
            return "其它"
```

`_` 不匹配任何特定值，只表示"我接受所有没被前面命中的值"，所以它必须放在最后——放前面会把后面的具体模式全截胡。`_` 只在形式上像变量，但它**不绑定**：你不会在分支体里通过 `_` 拿到那个值。这是它和普通变量名（如 `case x:`）的关键区别——避免"我明明只需要兜底，却顺手绑定了一个用不到的变量"。

### 2.4 变量绑定模式：捕获值

如果"兜底"分支里还想用上那个被匹配的值，用**变量绑定模式**——`case x:` 会匹配任何值并把值绑定到 `x`，分支体里就能用 `x`。

```python
def echo(x):
    match x:
        case 0:
            return "零"
        case other:
            return f"非零：{other}"

print(echo(0))
print(echo(42))
```

**运行结果**：

```text
零
非零：42
```

`echo(42)` 不匹配 `case 0:`，往下到 `case other:`——`other` 是一个变量绑定模式，匹配任何值并把 42 绑到 `other`，返回"非零：42"。和 `case _:` 相比，`case other:` 多了"把值拴进变量里供分支体使用"的能力。

**关键陷阱：变量绑定模式会"吃掉"所有值**。因为变量名会匹配任何东西，如果把它放在具体的字面量模式前面，后面的具体模式就永远轮不到——`case other:` 在 `case 200:` 之前，`other` 会先吞掉所有输入，`200` 永远命中不到。所以**变量绑定模式必须放在所有具体模式之后**，否则就变成"提前兜底"。这和"具体模式放前、通用模式放后"的总原则一致。

### 2.5 序列模式：解构列表/元组

序列模式按位置解构列表、元组等序列——一行 `case [a, b]:` 既判"是长度 2 的序列"，又把第 0、1 位绑定到 `a`、`b`。这是 `match-case` 最有价值的模式之一，把"判断形状 + 取元素"压成一句。

**按位置解构二维点**：

```python
def describe_point(p):
    match p:
        case [0, 0]:
            return "原点"
        case [x, 0]:
            return f"x 轴，x={x}"
        case [0, y]:
            return f"y 轴，y={y}"
        case [x, y]:
            return f"普通点 ({x}, {y})"
        case _:
            return "不是二维点"

for pt in [(0, 0), (3, 0), (0, 5), (2, 4), (1, 2, 3)]:
    print(f"  {pt} → {describe_point(pt)}")
```

**运行结果**：

```text
  (0, 0) → 原点
  (3, 0) → x 轴，x=3
  (0, 5) → y 轴，y=5
  (2, 4) → 普通点 (2, 4)
  (1, 2, 3) → 不是二维点
```

序列模式按"整体长度"匹配——`(0, 0)` 命中 `case [0, 0]:`（长度 2 且都为 0），`(3, 0)` 命中 `case [x, 0]:`（长度 2、第二位 0，第一位绑定 `x`），`(1, 2, 3)` 长度 3 不匹配任何长度为 2 的模式，落到 `_:`。**`case [x, y]:` 不会匹配长度 3 的序列**——序列模式要求长度严格一致，这是它和"切片"的本质区别。

**注意：用 `[]` 或 `()` 写模式都行**。模式里的方括号 `[x, 0]` 不代表"只匹配列表"——它匹配的是"序列"，元组也能匹中（上面就用元组 `(0, 0)` 测试并命中了）。这是序列模式的一个易混点：**模式用 `[]` 写，但语义是"任何序列类型"，list 和 tuple 都算**。

**长度可变：星号模式**。`case [first, *rest]:` 用星号捕获"任意多个剩余元素"，可以匹配变长序列：

```python
def describe_cmd(cmd):
    match cmd:
        case []:
            return "空命令"
        case ["quit" | "exit"]:
            return "退出"
        case ["add", x, y]:
            return f"计算 {x} + {y} = {x + y}"
        case [single]:
            return f"单参数：{single}"
        case [first, *rest]:
            return f"其他：首元素 {first}，剩余 {len(rest)} 个"
        case _:
            return "未知"

for cmd in [[], ["quit"], ["help"], ["add", 2, 3], ["deploy", "prod", "v1"]]:
    print(f"  {cmd} → {describe_cmd(cmd)}")
```

**运行结果**：

```text
  [] → 空命令
  ['quit'] → 退出
  ['help'] → 单参数：help
  ['add', 2, 3] → 计算 2 + 3 = 5
  ['deploy', 'prod', 'v1'] → 其他：首元素 deploy，剩余 2 个
```

`["add", 2, 3]` 命中 `case ["add", x, y]:`——首元素匹配字面量 `"add"`、后两位绑定到 `x`、`y`；`["deploy", "prod", "v1"]` 长度 3 但首元素不是 "add"，落到 `case [first, *rest]:`，`first` 绑定 `"deploy"`、`rest` 绑定 `["prod", "v1"]`。**注意这里模式的顺序**：具体模式（`["quit" | "exit"]`、`["add", x, y]`）放在通用的 `[single]`、`[first, *rest]` 前面——如果反过来，`[single]` 会先把"长度 1 的序列"全吞掉，`["quit" | "exit"]` 永远命中不到。这是"具体在前、通用在后"原则在序列模式上的体现。

### 2.6 映射模式：解构字典

映射模式按"键是否存在 + 对应值是否匹配"解构字典。`case {"name": n}:` 表示"是字典且有 `'name'` 这个键，把它的值绑定到 `n`"。

```python
def handle_user(user):
    match user:
        case {"name": name, "age": age} if age >= 18:
            return f"{name} 已成年({age})"
        case {"name": name}:
            return f"{name}（年龄未知，按未成年处理）"
        case _:
            return "未知用户"

for u in [{"name": "张三", "age": 20}, {"name": "李四", "age": 10}, {"name": "王五"}, {}]:
    print(f"  {u} → {handle_user(u)}")
```

**运行结果**：

```text
  {'name': '张三', 'age': 20} → 张三 已成年(20)
  {'name': '李四', 'age': 10} → 李四（年龄未知，按未成年处理）
  {'name': '王五'} → 王五（年龄未知，按未成年处理）
  {} → 未知用户
```

映射模式有两个特性要注意：

**一、多余的键不影响匹配**。`{"name": "张三", "age": 20, "email": "x@y"}` 也能命中 `case {"name": name, "age": age}:`——只要模式要求的键都在，字典里还有其他键不算"不匹配"。这和序列模式（要求长度严格一致）相反。

**二、守卫表达式（`if`）可以叠加在模式后面**。`{"name": name, "age": age} if age >= 18` 表示"先按键解构出 `name` 和 `age`，再判 `age >= 18`"。守卫为假时这次匹配失败，继续往下看下一个 `case`——上面 `李四:10` 就是 `age >= 18` 假、跳到下一条 `{"name": name}:` 命中。

**`匹配模式 + 守卫`是映射（以及其它模式）的常见组合**：模式负责"把字段抽出来"，守卫负责"在抽出来的字段上加判断"。这把原本要"先 if 判 age、再 if 判 name"的多层 `if` 压成一条 `case`，清晰得多。

### 2.7 或模式：多个模式合一

或模式用 `|` 把多个模式并列——其中任意一个匹配，整体就算匹配。写法是 `case 模式1 | 模式2 | 模式3:`，常用于"几个值都走同一分支"。

```python
def color_category(c):
    match c:
        case "red" | "green" | "blue":
            return "原色"
        case "cyan" | "magenta" | "yellow":
            return "次色"
        case _:
            return "其他"

for c in ["red", "cyan", "purple"]:
    print(f"  {c} → {color_category(c)}")
```

**运行结果**：

```text
  red → 原色
  cyan → 次色
  purple → 其他
```

`"red" | "green" | "blue"` 是三个字面量的或——`c` 等于其中任一个就算命中。和写三条 `case "red":`/`case "green":`/`case "blue":`（再每条返回同一句）相比，或模式把"几个值归一类"压成一行，不重复。

**或模式可以嵌在序列模式里**：`case ["quit" | "exit"]:` 表示"长度 1 的序列、首元素是 `'quit'` 或 `'exit'`"。或模式和序列、映射模式能任意嵌套，组合出"匹配字母或字符串前缀""多种结构都接收"这类表达。

### 2.8 as 模式：匹配并绑定整体

有时你想"既匹配一个结构、又把整个原值绑定下来"，as 模式就是干这个的——`case <模式> as <变量>:`，匹配 `<模式>` 的同时把被匹配的整体值绑定到 `<变量>`。

```python
def first_item(seq):
    match seq:
        case [first, *rest] as whole:
            return f"整体 {whole}，首个 {first}，剩余长度 {len(rest)}"
        case _:
            return "不是序列"

for s in [[1, 2, 3], (10, 20)]:
    print(f"  {s} → {first_item(s)}")
```

**运行结果**：

```text
  [1, 2, 3] → 整体 [1, 2, 3]，首个 1，剩余长度 2
  (10, 20) → 整体 (10, 20)，首个 10，剩余长度 1
```

`[first, *rest] as whole` 同时做两件事：解构出 `first` 和 `rest`、又把原序列整体绑定到 `whole`。分支体里既能用拆开的 `first`/`rest`，也能用整体的 `whole`。常用于"既要用结构里的部分、又要完整地把原值传下去"的场景——比如"匹配成功后把原数据记日志、再做后续处理"。

### 2.9 守卫表达式：模式 + 额外条件

有时候"模式匹配成功"还不够，还要再加一个条件才能确定走这个分支——守卫表达式就是给模式加 `if` 条件。写法是 `case <模式> if <条件>:`：先匹配模式，匹配成功后再判 `if` 条件，两者都成立才命中。

```python
def classify(n):
    match n:
        case x if x > 100:
            return "超大"
        case x if x > 10:
            return "中等"
        case _:
            return "小"

for n in [5, 50, 500]:
    print(f"  {n} → {classify(n)}")
```

**运行结果**：

```text
  5 → 小
  50 → 中等
  500 → 超大
```

`case x if x > 100:` 里 `x` 是变量绑定模式（匹配任何值并绑定），`if x > 100` 是守卫。500 命中第一个分支（绑定 500 且 500>100 成立），50 命中第二个（绑定 50、50>10 但 50>100 不成立跳过第一个），5 两个守卫都不成立落到 `case _:`。

**守卫的关键行为：守卫为假时不算命中，继续往下看**。这是它和"放进模式里"的区别——`if age >= 18` 失败不会报错，只会让这次匹配失败、值继续和下面的 `case` 比对。所以守卫模式后面通常还要有"模式相同但条件不同"的另一条 `case` 兜底（像上面的 `中等` 是 `> 10`、`超大` 是 `> 100`，靠顺序配合）。

**何时用守卫 vs 用模式表达条件**：能用模式写清的就用模式（如 `case [0, 0]:` 比 `case p if p == [0, 0]:` 更清晰），实在表达不了的（大小比较、复杂布尔判断）才用守卫。守卫别滥用——滥用会让模式匹配退化成"换皮的 if-elif-else"，失去模式本身的解构优势。

### 2.10 类模式：匹配对象类型与属性

类模式按"对象的类型 + 它的属性"匹配——`case ClassName(...):` 要求对象是 `ClassName` 的实例，括号里还能进一步约束属性值。这是处理自定义对象的标准模式。

结合 `dataclass` 看最能体会到它的价值——`dataclass` 自动生成的属性正好对应类模式的字段名：

```python
from dataclasses import dataclass

@dataclass
class Point:
    x: int
    y: int

def describe_point(p):
    match p:
        case Point(x=0, y=0):
            return "原点"
        case Point(x=x, y=0):
            return f"x 轴上，x={x}"
        case Point(x=0, y=y):
            return f"y 轴上，y={y}"
        case Point(x=x, y=y):
            return f"普通点 ({x}, {y})"
        case _:
            return "不是点"

for p in [Point(0, 0), Point(3, 0), Point(0, 4), Point(2, 5), "not a point"]:
    print(f"  {p} → {describe_point(p)}")
```

**运行结果**：

```text
  Point(x=0, y=0) → 原点
  Point(x=3, y=0) → x 轴上，x=3
  Point(x=0, y=4) → y 轴上，y=4
  Point(x=2, y=5) → 普通点 (2, 5)
  not a point → 不是点
```

类模式有两条规则要记清：

**一、`Point(x=0, y=0)` 同时表达了"是 Point 类型 + x 等于 0 + y 等于 0"**。`Point(...)` 之外的值（如字符串 `"not a point"`）类型对不上，整条 `case` 就不匹配，直接落到 `case _:`。

**二、想要"匹配类型并取出属性"用 `属性名=绑定变量` 写法**：`Point(x=x, y=0)` 把 `x` 这个属性的值绑定到同名的变量 `x`（变量名和属性同名只是惯例，不同名也行）。这样分支体里就能用 `x` 这个值。`Point(x=0, y=0)` 里的 `x=0` 是"约束 x 必须等于 0"（不绑定），`Point(x=x, y=0)` 里的 `x=x` 是"取出 x 绑定到变量"（不约束值），两种写法常混用，注意区分。

类模式让"按类型分发 + 按属性细分"一气呵成，处理多态对象、解析 AST、分发事件类型时特别顺手。老式写法是 `if isinstance(p, Point) and p.x == 0 and p.y == 0:`，类模式把它压成一句，可读性高得多。

### 2.11 典型应用场景

`match-case` 的应用模式大多围绕"解构 + 分发"展开，可以照搬到很多场景。

#### 2.11.1 命令分发

把"命令 + 参数"形式的输入解析成结构、再分发到对应处理，是 `match-case` 的强项：

```python
def handle(cmd):
    match cmd.split():
        case ["quit"]:
            return "退出"
        case ["show", target]:
            return f"展示 {target}"
        case ["move", x, y]:
            return f"移动到 ({x}, {y})"
        case _:
            return "未知命令"

for c in ["quit", "show log", "move 3 4", "unknown"]:
    print(f"  {c!r} → {handle(c)}")
```

**运行结果**：

```text
  'quit' → 退出
  'show log' → 展示 log
  'move 3 4' → 移动到 (3, 4)
  'unknown' → 未知命令
```

`cmd.split()` 把字符串切成词表，模式按"长度 + 首词字面量 + 参数"匹配——`"show log"` 切成 `["show", "log"]` 命中 `["show", target]`。用 `if-elif-else` 写这种命令解析要反复 `len()`、`cmd[0]=="show"`、`cmd[1]`，繁琐易错；序列模式把"分成多少段 + 每段是什么"压成一行。

#### 2.11.2 数据解构（响应解析）

API 返回的数据常是嵌套字典/列表，按结构解出需要的字段，是映射模式 + 序列模式的经典搭档：

```python
def parse_response(resp):
    match resp:
        case {"status": "ok", "data": [first, *_]}:
            return f"成功，首条数据：{first}"
        case {"status": "error", "message": msg}:
            return f"失败：{msg}"
        case _:
            return "未知响应格式"
```

**运行结果**（以 `{"status": "ok", "data": [1, 2, 3]}` 为例）：

```text
成功，首条数据：1
```

一次 `case` 同时做"判 status 字段字符串、解 data 是个非空序列、取首元素、忽略其余"四件事，是 `if-elif-else` + `dict.get` + 索引的紧凑等价写法。

#### 2.11.3 状态机分发

按"当前状态 + 输入事件"决定下一步，用映射模式拼成"状态字典"匹配是清晰的写法：

```python
def next_state(state, event):
    match (state, event):
        case ("idle", "start"):
            return "running"
        case ("running", "pause"):
            return "paused"
        case ("running", "stop"):
            return "idle"
        case ("paused", "resume"):
            return "running"
        case _:
            return "未知转移"
```

把 `(state, event)` 作为一个二元组匹配，每个 `case` 是一条"状态转移规则"。这种写法把状态机的"规则表"平铺出来，新增一条规则就是加一行 `case`，比一堆 `if state == "idle" and event == "start":` 直观得多。

#### 2.11.4 兼顾类型与结构（多态处理）

面对"可能是几种不同形状的对象"时，类模式让"按类型走不同处理"自然成文：

```python
from dataclasses import dataclass

@dataclass
class Circle:
    radius: float

@dataclass
class Rectangle:
    width: float
    height: float

def area(shape):
    match shape:
        case Circle(radius=r):
            return round(3.14159 * r * r, 2)
        case Rectangle(width=w, height=h):
            return w * h
        case _:
            return "未知形状"
```

一个 `area` 函数对 `Circle` 和 `Rectangle` 两种类型分别处理，类模式 + `dataclass` 让"类型分发 + 取属性"一步到位，无需 `isinstance` 嵌套 `if`。新增 `Triangle` 时加一条 `case Triangle(a=a, b=b, c=c):` 即可，扩展性强。

## 3. 最佳实践

### 3.1 match vs if-elif-else 何时选哪个

`match-case` 和 `if-elif-else` 都是"多分支选择"工具，但擅长的事不同。判断用哪个的关键是看："这是单纯比值的相等，还是要看结构 / 类型 / 解构？"

| 场景 | 更适合 | 原因 |
|------|--------|------|
| 按离散值分发（HTTP 状态码、菜单选项） | 二者皆可，`match` 略清爽 | `match` 把"被匹配的值"放在开头，分支更聚焦在模式上 |
| 按结构/长度解构序列 | `match` 序列模式 | `if` 要反复 `len()` + 索引，`match` 一条解构搞定 |
| 按键解构字典 + 字段判断 | `match` 映射模式 | `if` 要 `get()` + 多次判 None，`match` 解构一步到位 |
| 按类型 + 属性分发对象 | `match` 类模式 | `if` 要 `isinstance` 嵌套，`match` 把类型和属性压成一条 |
| 大小比较、组合布尔条件（`a > 0 and b < 10`） | `if-elif-else` | 这类"纯条件"不是模式擅长的事，`match` 退化成 `case x if 条件` 反而绕 |
| 简单一两个分支 | `if-else` | `match` 的样板开销（`match` + 多个 `case`）对小判断不划算 |

口诀：**有"解构"用 `match`，有"判大小/判组合布尔"用 `if-elif-else`**。两者不是替代关系，是各有所长——别把所有 `if-elif-else` 都改写成 `match`，那只会让纯条件判断绕进守卫里。

```python
# ❌ 不推荐：纯大小判断强行用 match，守卫塞条件反而绕
def bucket(score):
    match score:
        case x if x >= 90:
            return "A"
        case x if x >= 60:
            return "B"
        case _:
            return "C"

# ✅ 推荐：纯大小判断用 if-elif-else 更直白
def bucket(score):
    if score >= 90:
        return "A"
    elif score >= 60:
        return "B"
    else:
        return "C"
```

### 3.2 别忘了通配符 _ 兜底

`match` 没有 `case _:` 兜底时，"全都没匹配"会静默跳过整个 `match`（什么都不做），容易埋下"某个分支没被覆盖、结果返回了 `None`"的难查 bug。养成习惯：**只要逻辑期望对任何输入都有明确归属，都补上 `case _:` 兜底**。

```python
# ❌ 不推荐：没有兜底，未知输入返回 None（隐患）
def status_of(code):
    match code:
        case 200:
            return "成功"
        case 404:
            return "未找到"
        # 403、500 等 → 静默 None

# ✅ 推荐：补 case _ 兜底，明确未知状态归属
def status_of(code):
    match code:
        case 200:
            return "成功"
        case 404:
            return "未找到"
        case _:
            return "其他状态"
```

补 `case _:` 的好处不只是"不会返回 `None`"，更是把"我考虑过所有情况"写进了代码——后续维护者一眼能看出"未知输入会被怎样处理"。只在"全都不匹配就什么也不做"是意图时，才省略 `case _:`，且最好加注释说明。

### 3.3 具体模式放前，通用模式放后

`match` 按从上到下顺序比对、命中第一个就停。这意味着**越具体、越严格的模式越要放前面，越通用、越能"吃"的模式越要放后面**——否则通用模式会把后面的具体模式截胡，让它们永远命中不到。

```python
# ❌ 不推荐：通用模式 [single] 放在具体模式 ["quit"] 前面，后者永不命中
def parse(cmd):
    match cmd.split():
        case [single]:
            return f"单参数：{single}"      # 吞掉所有长度为 1 的序列
        case ["quit"]:
            return "退出"                   # 永远到不了这里

# ✅ 推荐：具体模式 ["quit"] / ["add", ...] 放前，通用放后
def parse(cmd):
    match cmd.split():
        case ["quit"]:
            return "退出"
        case ["add", x, y]:
            return f"计算 {x}+{y}"
        case [single]:
            return f"单参数：{single}"
        case [first, *rest]:
            return f"其他：首元素 {first}"
        case _:
            return "未知"
```

通用程度排序：通配符 `_` > 普通变量绑定 `x` > 序列 `[first, *rest]`/映射 `{"k": v}` > 具体字面量。具体放前、通用放后，是写 `match-case` 的基本卫生习惯。

### 3.4 守卫表达式而非复杂嵌套模式

守卫 `case <模式> if <条件>:` 是"模式 + 条件"。但别把守卫当"把所有 `if` 都塞进 `match`"的口子——滥用守卫会让模式匹配退化成"换皮的 if-elif-else"，失去模式的解构优势。

```python
# ❌ 不推荐：守卫塞了大小判断又嵌套结构，可读性差
def classify(account):
    match account:
        case {"name": n} if isinstance(n, str) and len(n) > 5 and n.startswith("vip_"):
            return f"VIP：{n}"
        case _:
            return "普通"

# ✅ 推荐：模式负责抽字段，守卫只放模式表达不了的简单条件
import re

def classify(account):
    match account:
        case {"name": n} if n.startswith("vip_"):       # 模式抽 name，守卫只判前缀
            return f"VIP：{n}"
        case {"name": n}:
            return f"普通：{n}"
        case _:
            return "未知账号"
```

口诀：**能写进模式里的就写进模式，写不通的才用守卫，且守卫尽量简短**。守卫一旦塞了多层 `and`、嵌套判断，就考虑拆成"先抽数据、再用普通 `if` 判条件" 两步走——别在守卫里堆复杂逻辑。

### 3.5 常见错误模式速查表

把 `match-case` 里高频踩的坑汇总成一张速查表，写代码时可以对照检查：

| 错误模式 | 错误示例 | 后果 | 正确做法 |
|---------|---------|------|---------|
| 漏 `case _:` 兜底 | 没有 `_:` | 未知输入返回 `None` | 补通配符兜底，明确归属 |
| 通用模式放前面 | `case x:` 在 `case 200:` 之前 | 具体模式被截胡、永不命中 | 具体放前、通用放后 |
| 序列模式误以为匹配列表 | 用 `[x, y]` 只想匹 list | list 和 tuple 都会命中（语义是"序列"） | 要严格区分类型用类模式 |
| 变量名与字面量混淆 | `case 200:` 写成 `case ok:`（意图是常量） | `ok` 被当成变量绑定，永远命中且吞所有 | 字面量直接写值，常量加注释或用枚举 |
| 在守卫里堆复杂判断 | `case x if x > 0 and x < 10 and isinstance(x, int):` | 退化成换皮 if-elif | 简短守卫，复杂条件拆出用 `if` |
| 把大小比较硬塞 match | `case x if x >= 90: ...` 一路串 | 失去模式优势、可读性差 | 纯大小比较回 `if-elif-else` |
| 平铺 switch 当成"必走一个" | 以为无 `case _:` 也覆盖所有情况 | 实际静默不匹配返回 None | 显式兜底或穷尽列举 |

## 4. 原理

### 4.1 match-case 是语句：第一匹配即停

`match-case` 在结构上属于**语句**（statement），不是表达式——它没有"返回值"，不能像三元 `x if c else y` 那样塞进赋值右侧、函数参数里。每个 `match` 语句是一段控制流：开头 `match <值>:` 把值"固定"下来供下面所有 `case` 用，下面每个 `case <模式>:` 是一条独立的"匹配试一次"。

它的执行流程是**第一匹配即停**（first-match wins）：从第一个 `case` 开始，把值和它的模式比对，命中就执行那个分支体、执行后跳出整个 `match`——后面所有 `case` 都不再试。和 `if-elif-else` 完全一致，也和 C 的 switch **不一样**（C 的 switch 没写 `break` 会"穿透"到下一个 `case`，Python 的 `match` 不会）。

```text
match 值:
  试 1: 模式1 → 命中？ ├─ 命中 → 执行分支1 → 跳出 match ─┐
                       └─ 失败                                  │
  试 2: 模式2 → 命中？ ├─ 命中 → 执行分支2 → 跳出 ────────────┤
                       └─ 失败                                  │
  ...                                                    第一命中的就停
  全失败 → 有 _ 兜底就执行 _ 分支                           ↓
        无 _ 兜底则整个 match 不做任何事        match 之后的下一条语句
```

因为命中即停，**case 的顺序决定了行为**——这是"具体模式放前、通用模式放后"原则的根因：先放通用模式，后面具体模式永远轮不到试，等于"被静默屏蔽"。理解"第一匹配即停"，就能解释为什么顺序错误会导致 bug。

### 4.2 模式匹配 vs 值相等

模式匹配和 `==` 比较"值相等"是两套机制，不能等同。`==` 只回答"两个值是否相等"一个问题；模式匹配是**一组规则**，回答"被匹配的值是否满足某种结构条件 + 同时把里面的部分绑定出来"。

```python
# 用 == 比较，只能问"相等"
if point == (0, 0):
    ...

# 用模式，一次同时问"形状 + 取值"
match point:
    case (x, 0):
        # 这里 x 已经是 point[0] 了，不用再索引
```

模式匹配的本质是对"值的形状"做归纳式判断：序列模式看"是不是序列、多长、各位置上是什么"；映射模式看"有没有这些键、键的值是什么"；类模式看"是不是这类实例、属性各是什么"。它一边判断一边把匹配到的部分"绑定"到名字上，这是 `==` 做不到的——`==` 不会顺带把 `(0, 5)` 里的 0 和 5 拆出来给你。

另外一个细节：模式匹配用 `==` 来比较字面量部分（`case 5:` 走 `__eq__`），但"是否是序列""是否能解构"看的是类型契约（序列模式要求 `__iter__`/`Sequence` 协议、映射模式要求 `__getitem__` + 键集合、类模式要求 `isinstance`）。所以模式匹配是"部分用相等、部分用结构协议"的混合机制——这点和 C 的 switch（纯相等跳转）有本质区别。

### 4.3 变量绑定（捕获）的机制

"模式匹配成功 + 把值绑定到变量"是模式最神奇的能力。它的机制其实很简单：**模式里出现的"裸名字"被当作绑定目标**——匹配成功后，名字这个变量被赋值为"它那个位置匹配到的值"，存进当层作用域。

```python
match (10, 20):
    case (a, b):
        print(a, b)        # 10 20 —— a、b 被 (10, 20) 各位置绑定
```

绑定规则几条记清楚：

**一、名字在模式里既是"占位"也是"目标"**。`case [x, 0]:` 里 `x` 是绑定名，匹配成功后 `x = 该序列第 0 位`；`0` 是字面量，要求和该位置相等。一个名字既"接收任意值（绑定）"，一个字面量既"要求相等"，是模式里两类构件。

**二、下划线 `_` 是"绑但不留"**。`case _:` 在技术上是个变量绑定，但它专门表示"我接受所有值但不绑定到任何可用的名字"——`_` 在 Python 里是"丢弃变量"惯例，模式里约定它绑定的值也不重新进入作用域。这是 `_` 和 `case x:` 的关键区别：`x` 留、`_` 不留。

**三、同一模式里不能让一个名字绑定两次**。`case [a, a]:` 不是"两个位置都等于 a"，而是"把第一个 a 绑了，第二个 a 又要求等于第一位置绑的值"——它表达的是"`a == a`（即两位置相等）"，而非"绑定两次"。要表达"两个位置都绑定"得用不同名字（`[a, b]`）；要表达"两个位置必须相等"才用 `[a, a]`。

**四、匹配失败时绑定不生效**。如果一条 `case` 守卫为假匹配失败，它在模式阶段绑的变量也不会保留——它们像从没被赋值过。所以下面分支里不会误用到一个"上一个 case 半途绑定的旧值"。

这套"模式匹配 + 同步绑定 + 失败回滚"的机制，让模式既像"按结构归纳"，又像"在归纳里顺手取出"，是 `match-case` 区别于其它条件工具的根本来源。

## 5. 总结

本文围绕 `match-case` 结构化模式匹配展开，主要介绍了以下内容：

- `match-case` 是什么：Python 3.10+ 的结构化模式匹配语句，按"模式"逐个比对一个值，命中第一个就执行，一条模式可同时表达"判结构 + 解构取值 + 绑定变量 + 守卫条件"
- 语句基本结构：`match <值>:` + 多个 `case <模式>:` 分支，命中即停（不穿透），各分支体由缩进归属
- 字面量模式：`case 200:` / `case "ok":` 匹配固定值，按离散值分明档是最直观用法
- 通配符 `_`：匹配任何值但不绑定，常作兜底放最后，和 `case x:` 的区别是 `_` 不留绑定
- 变量绑定模式 `case x:`：匹配任意值并绑定到 `x`，必须放具体模式之后否则截胡
- 序列模式 `case [x, 0]:`：按位置解构 list/tuple（语义是"序列"两种都匹配），要求长度严格一致，可用 `*rest` 捕获变长剩余
- 映射模式 `case {"name": n}:`：按键解构字典，多余键不影响匹配，常配合守卫做"抽字段+判值"
- 或模式 `|`：多个模式合一，任一匹配即命中，能嵌进序列/映射模式组合
- as 模式 `case <模式> as whole`：匹配的同时把原值整体绑定下来，便于"既用结构、又留整体"
- 守卫 `case <模式> if <条件>`：模式 + 额外条件的组合，守卫为假算匹配失败、继续往下
- 类模式 `case Point(x=0):`：按类型 + 属性匹配对象，配合 `dataclass` 让"类型分发 + 取属性"一行表达
- 典型场景：命令分发、数据解构、状态机转移、多态类型处理，都是"解构 + 分发"的照搬写法
- 最佳实践：有解构用 `match`、有大小/组合布尔判断用 `if-elif-else`、必补 `case _:` 兜底、具体模式放前通用放后、守卫简短别滥用
- 原理：`match` 是语句、第一匹配即停（顺序敏感）、模式匹配是"判结构 + 同步绑定 + 守卫"的混合机制（literals 走 `==`、结构走类型协议）、绑定机制里名字既占位又捕获、`_` 约绑不留、同名表达"相等"而非"双绑"、失败回滚不残留旧绑定
