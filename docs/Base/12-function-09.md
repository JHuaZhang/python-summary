---
group:
  title: 【12】函数核心机制
  order: 12
order: 9
title: 仅关键字参数
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是仅关键字参数

在 Python 中，函数参数的传递方式分为两大类：按位置传递（调用时根据参数顺序对应）和按关键字传递（调用时用 `参数名=值` 显式指定）。绝大多数参数既可以用位置传，也可以用关键字传。但有一类参数被语言强制限制为 **只能用关键字传递**——这就是"仅关键字参数"（keyword-only arguments）。

仅关键字参数的标记方式很特别：在函数签名的参数列表中放置一个裸 `*` 号（或 `*args`），那么 **这个 `*` 之后的全部参数都成为仅关键字参数**。调用方必须以 `参数名=值` 的形式传入它们，如果试图按位置传，Python 会在调用时直接抛出 `TypeError`。

看一个最小例子来建立直觉：

```python
def greet(name, *, greeting="你好"):
    print(f"{greeting}, {name}!")

# name 是普通参数，可位置可关键字
greet("张三")                  # 位置传 name，greeting 取默认值
greet("张三", greeting="早上好")  # name 位置传，greeting 用关键字传
# 输出：
# 你好, 张三!
# 早上好, 张三!
```

```python
# 试图把 greeting 按位置传 —— 会报错
greet("张三", "早上好")
# 输出：
# TypeError: greet() takes 1 positional argument but 2 were given
```

从报错信息可以看到，Python 认为 `greet` 只接受 1 个位置参数（`name`），第二个位置参数 `"早上好"` 没有对应的位置槽位。`greeting` 被语言层面"保护"起来，只能通过关键字赋值。

### 1.2 为什么需要仅关键字参数

理解仅关键字参数为什么被引入，比单纯记住语法更重要。它解决的核心问题是 **API 调用时的可读性与安全性**。

当参数列表变长，或者出现多个布尔型"开关"参数时，纯位置传参会让调用点变得难以理解。考虑一个绘图函数：

```python
def draw(text, bold, italic):
    """绘制文本，bold/italic 控制是否加粗/斜体"""
    style = []
    if bold:
        style.append("加粗")
    if italic:
        style.append("斜体")
    print(f"绘制 '{text}'，样式：{style or ['常规']}")

# 调用点——半年后你还能看懂 True/False 各代表什么吗？
draw("标题", True, False)
# 输出：
# 绘制 '标题'，样式：['加粗']
```

`draw("标题", True, False)` 这样的调用，离开函数定义后几乎不可读：那个 `True` 是加粗还是斜体？那个 `False` 呢？如果将来要在 `bold` 和 `italic` 之间再插一个 `underline` 参数，所有按位置调用 `draw` 的地方都会悄无声息地错位——这正是"布尔位置参数"的典型坑。

如果把样式开关设为仅关键字参数，这一切就被根治：

```python
def draw(text, *, bold=False, italic=False):
    """绘制文本；bold/italic 必须用关键字指定"""
    style = []
    if bold:
        style.append("加粗")
    if italic:
        style.append("斜体")
    print(f"绘制 '{text}'，样式：{style or ['常规']}")

draw("标题", bold=True)              # 清晰：只加粗
draw("正文", italic=True)            # 清晰：只斜体
draw("强调", bold=True, italic=True)  # 清晰：既加粗又斜体
# 输出：
# 绘制 '标题'，样式：['加粗']
# 绘制 '正文'，样式：['斜体']
# 绘制 '强调'，样式：['加粗', '斜体']
```

```python
# 试图按位置传 bold —— 编译期之外的调用点立即报错，防止隐患流入生产
draw("标题", True)
# 输出：
# TypeError: draw() takes 1 positional argument but 2 were given
```

因此仅关键字参数的价值可以概括为两点：

- **强制显式命名**：调用点自带文档，参数含义一目了然，代码可读性显著提升。
- **防止位置参数歧义与误用**：尤其对布尔开关、配置开关这类"语义层"参数，强制用关键字可避免顺序错乱、未来增删参数时的静默错位。

### 1.3 最小语法与标记位置

仅关键字参数的标记规则可以浓缩为一句话：**`*` 是一道"分界线"，它之后的参数关键字-only，它之前的参数位置或关键字**。

```python
def f(a, b, *, c, d=10):
    print(a, b, c, d)
```

在这个签名里：

- `*` 之前的 `a`、`b`：普通参数，可位置可关键字。
- `*` 之后的 `c`、`d`：仅关键字参数。`c` 没有默认值（调用时必须显式给值），`d` 有默认值（可不传）。

```python
f(1, 2, c=3)        # a=1, b=2, c=3, d 取默认 10
f(1, 2, c=3, d=40)  # a=1, b=2, c=3, d=40
# 输出：
# 1 2 3 10
# 1 2 3 40
```

```python
f(1, 2, 3)          # 试图把 c 按位置传
# 输出：
# TypeError: f() takes 2 positional arguments but 3 were given
```

把 `*` 理解成"分水岭"是最直观的：水流（位置参数）只能淌到 `*` 之前，过了 `*` 就必须"点名取水"（关键字传参）。这个心智模型在后续理解 `*args` 形式时会再次用到。

## 2. 核心内容

### 2.1 裸 `*` 标记：纯分界符

最基本的仅关键字参数写法就是在参数列表中插入一个裸 `*`。它本身不是参数，不接收任何值，纯粹充当"分界符"——把它后面的参数划入仅关键字区。

签名形态：

```python
def 函数名(普通参数, *, 仅关键字参数1, 仅关键字参数2=默认值, ...):
    ...
```

下面是一个网络连接的例子，`host` 和 `port` 是连接的核心信息（位置传即可，语义直观），而 `ssl` 和 `timeout` 是配置开关（强制关键字传，避免调用点出现莫名其妙的布尔/数值）：

```python
def connect(host, port, *, ssl=False, timeout=10):
    """建立网络连接。
    host/port 是连接目标，按位置传；ssl/timeout 是配置项，必须用关键字传。
    """
    scheme = "https" if ssl else "http"
    print(f"连接 {scheme}://{host}:{port}，超时 {timeout}s")

connect("api.example.com", 443, ssl=True, timeout=5)
connect("www.example.com", 80)
# 输出：
# 连接 https://api.example.com:443，超时 5s
# 连接 http://www.example.com:80，超时 10s
```

```python
# 配置项强制命名，杜绝了这种含混不清的调用
connect("api.example.com", 443, True, 5)
# 输出：
# TypeError: connect() takes 2 positional arguments but 4 were given
```

**裸 `*` 的语义重点**

- `*` 只是一个标记，不是参数。它不占参数槽位，调用时也不需要也不能为它传值。
- 它的影响范围是"单向"的：只把它 **之后** 的参数变成仅关键字；它之前的参数行为不变。
- 一个函数签名里最多只能有一个裸 `*`（或 `*args`）充当此分界，写两个会直接语法报错。

### 2.2 `*args` 标记：既收集又分界

如果函数定义了 `*args`（可变位置参数），那么 `*args` 在承担"收集多余位置参数"职责的同时，**天然也充当了仅关键字参数的分界符**——`*args` 之后的参数同样是仅关键字参数。

签名形态：

```python
def 函数名(普通参数, *args, 仅关键字参数1=默认值, 仅关键字参数2=默认值, ...):
    ...
```

这种写法与裸 `*` 的区别在于：`*args` 会把"溢出的位置参数"打包成一个元组，而裸 `*` 不收集任何东西，只是分界。两者在"划定仅关键字区域"这一点上等价，区别就只在是否需要收集多余位置参数。

一个典型场景是日志格式化函数——核心消息按位置传，多余的插值参数按位置收集进 `args`，而输出目标、是否换行等控制项强制用关键字：

```python
import sys

def log(message, *args, file=sys.stdout, newline=True):
    """格式化输出日志。
    message 是日志模板，*args 收集多余位置参数用于格式化，
    file / newline 是输出控制项，必须用关键字传。
    """
    text = message % args if args else message
    end = "\n" if newline else ""
    print(text, file=file, end=end)

log("用户 %s 登录，角色=%s", "张三", "admin", file=sys.stdout, newline=False)
# 输出（不换行）：
# 用户 张三 登录，角色=admin
```

```python
# file/newline 必须用关键字，下面这种调用无法成立
log("启动完成", sys.stderr, False)
# 输出：
# TypeError: log() takes 2 positional arguments but 4 were given
```

注意 `*args` 把 "张三"、"admin" 收进元组用于 `%` 格式化，这属于可变位置参数的正常职责；而 `file` 和 `newline` 在 `*args` 之后，自动成为仅关键字参数，必须显式命名。

### 2.3 裸 `*` 与 `*args` 的区别

既然裸 `*` 与 `*args` 都能划出仅关键字区域，实际写代码时该选哪个？判定的唯一依据是：**函数是否需要收集"不确定数量的位置参数"**。

- 需要 → 用 `*args`，它顺带划出仅关键字区。
- 不需要 → 用裸 `*`，它只划界、不收集，函数体里也拿不到任何"多余位置参数"。

下面两种写法在"仅关键字区"效果上完全等价，但函数能否处理多余位置参数截然不同：

```python
# 写法 A：裸 *，不收集多余位置参数
def make_url_a(host, *, scheme="https"):
    return f"{scheme}://{host}"

# 写法 B：*args，会收集多余位置参数
def make_url_b(host, *args, scheme="https"):
    print("多余位置参数：", args)
    return f"{scheme}://{host}"

print(make_url_a("api.example.com", scheme="http"))
print(make_url_b("api.example.com", scheme="http"))
# 输出：
# http://api.example.com
# 多余位置参数： ()
# http://api.example.com
```

```python
# 写法 A 对多余位置参数"零容忍"——直接报错
make_url_a("api.example.com", "extra", scheme="http")
# 输出：
# TypeError: make_url_a() takes 1 positional argument but 2 positional arguments were given

# 写法 B 会把 "extra" 收进 args 元组，不报错
make_url_b("api.example.com", "extra", scheme="http")
# 输出：
# 多余位置参数： ('extra',)
# http://api.example.com
```

| 对比维度             | 裸 `*`                             | `*args`                                  |
| -------------------- | ---------------------------------- | ---------------------------------------- |
| 是否是参数           | 否，纯标记                         | 是，可变位置参数                         |
| 是否收集多余位置参数 | 否，多余即报错                     | 是，打包为元组                           |
| 是否划定仅关键字区   | 是                                 | 是                                       |
| 函数体内能否访问     | 否（它不是参数）                   | 能（通过 `args` 元组）                   |
| 何时选用             | 仅需强制关键字、不接受多余位置参数 | 既需收集可变位置参数、又需后续强制关键字 |

一个容易混的误区：以为"写了 `*args` 就一定要用 args"。其实完全可能存在单纯想划界、但又怕多收一个参数麻烦的场景——此时更简洁的做法是直接用裸 `*`。反过来，如果你的函数本就有 `*args`，那无需再额外加一个裸 `*`，`*args` 已经帮你把界划好了。

### 2.4 仅关键字参数与默认值结合：构成可选配置项

仅关键字参数最常见的落地形态是 **"带默认值的可选配置项"**：把一个函数的"主体输入"放在 `*` 之前按位置传，把"配置/开关/选项"放在 `*` 之后并赋予默认值。调用方平时只需传主体输入，配置项用到时才显式指定。

这种结构在标准库里随处可见，它解决了"一个函数既要简单调用、又要灵活配置"的张力。来看一个自定义文本渲染函数：

```python
def render(template, *values, sep=", ", trim=False, uppercase=False):
    """把 value 用 sep 拼接进模板，可选去空格、转大写。
    template / values 是主体输入；sep / trim / uppercase 是配置项，必须关键字传。
    """
    body = sep.join(str(v) for v in values)
    result = template.format(body)
    if trim:
        result = result.strip()
    if uppercase:
        result = result.upper()
    return result

# 主体输入按位置传，配置项默认即可
print(render("结果：[{}]", "a", "b", "c"))
# 输出：结果：[a, b, c]

# 需要配置时，逐项用关键字打开
print(render("结果：[{}]", "a", "b", "c", sep=" | ", uppercase=True))
# 输出：结果：[A | B | C]

# 也可只调整一项
print(render("结果：[{}]", "  x  ", trim=True))
# 输出：结果：[x]
```

```python
# 配置项试图按位置传 —— 被强制拦截
render("结果：[{}]", "a", "b", " | ", True)
# 输出：
# TypeError: render() takes 2 positional arguments but 5 were given
```

这里 `sep`、`trim`、`uppercase` 都是仅关键字参数且有默认值，它们共同构成"可选配置面板"。这种写法的好处是：

- **默认调用极简**：`render("结果：[{}]", "a", "b", "c")` 只关心主体输入，配置项全是默认值。
- **按需开启配置**：要改哪项就显式写哪项，绝不影响其它配置。
- **未来增删配置安全**：在配置区末尾新增一个带默认值的仅关键字参数，既有调用点的行为完全不变，没有位置错位风险。

### 2.5 强制关键字的实战场景

理解了机制，下面用几个贴近真实工程的场景演示什么时候你应该主动把参数设计成仅关键字。

**场景一：布尔开关必须显式命名**

当一个函数的开关参数不止一个，或调用点离函数定义很远，布尔位置参数的可读性灾难就特别明显。强制关键字能把"看不懂的 True/False"变成"自解释的开关名"：

```python
def send_email(to, subject, body, *, html=False, cc=None, bcc=None):
    """发送邮件。to/subject/body 是邮件正文核心，按位置传；
    html/cc/bcc 是发送选项，必须关键字传，避免 True/False 含义不清。
    """
    fmt = "HTML" if html else "纯文本"
    print(f"收件人：{to}")
    print(f"主题：{subject}")
    print(f"格式：{fmt}")
    if cc:
        print(f"抄送：{cc}")
    if bcc:
        print(f"密送：{bcc}")
    print(f"正文：{body[:20]}...")

# 半年后回来看，调用点仍然一目了然
send_email(
    "alice@example.com",
    "项目周报",
    "<h1>本周进展</h1>...",
    html=True,
    cc="lead@example.com",
)
# 输出：
# 收件人：alice@example.com
# 主题：项目周报
# 格式：HTML
# 抄送：lead@example.com
# 正文：<h1>本周进展</h1>......
```

如果没有 `*`，调用可能写成 `send_email("alice@example.com", "周报", "...", True, "lead@example.com")`——那个 `True` 到底是 html 还是别的什么？第三个位置参数又对应哪一项？强制关键字后这些问题归零。

**场景二：可选配置项随版本积累**

某些函数随着需求增长会不断增加配置项。如果这些配置项是位置参数，每加一个就可能破坏既有调用；设成仅关键字参数且有默认值，就可以平滑扩展：

```python
def download(url, *, chunk_size=8192, retries=3, timeout=30, verify_ssl=True):
    """下载文件。主体输入只有 url，其余全是可选配置项。"""
    print(f"下载 {url}")
    print(f"分块 {chunk_size} 字节，重试 {retries} 次，超时 {timeout}s，校验 SSL={verify_ssl}")

# 默认配置
download("https://example.com/file.zip")
# 输出：
# 下载 https://example.com/file.zip
# 分块 8192 字节，重试 3 次，超时 30s，校验 SSL=True

# 精确调整需要的配置项，其余仍默认
download("https://example.com/file.zip", retries=5, timeout=60)
# 输出：
# 下载 https://example.com/file.zip
# 分块 8192 字节，重试 5 次，超时 60s，校验 SSL=True
```

未来再加一个 `progress=False` 配置项，只需在 `*` 之后的配置区末尾追加，既有调用一行都不用改。

**场景三：避免调用点参数顺序误记**

当函数有多个同类型（如同为字符串、同为数值）的位置参数，调用方容易记错顺序。把"非核心、易混"的参数设为仅关键字，可以彻底消除顺序误用：

```python
def set_timeout(callback, *, seconds=None, milliseconds=None):
    """注册超时回调。seconds/milliseconds 必须显式命名，避免与 callback 的位置混淆。"""
    total_ms = 0
    if seconds is not None:
        total_ms += seconds * 1000
    if milliseconds is not None:
        total_ms += milliseconds
    print(f"注册回调 {callback.__name__}，超时 {total_ms} 毫秒")

import time
set_timeout(time.sleep, seconds=2, milliseconds=500)
# 输出：注册回调 sleep，超时 2500 毫秒

set_timeout(time.sleep, milliseconds=100)
# 输出：注册回调 sleep，超时 100 毫秒
```

如果把 `seconds`/`milliseconds` 也设为位置参数，`set_timeout(time.sleep, 2)` 到底是 2 秒还是 2 毫秒？只有一个位置参数时极易写错。强制关键字后，调用点自带单位，再无歧义。

### 2.6 与位置参数、默认参数、`**kwargs` 的完整组合

实际函数签名往往是多种参数形态的组合。仅关键字参数可位置在参数链的尾段，理解它在整体中的位置规则至关重要。

完整参数顺序的语法骨架是：

```python
def f(普通参数, 默认参数="x", *args, 仅关键字参数, 仅关键字参数="y", **kwargs):
    ...
```

即从左到右依次为：

1. 普通必需参数（可位置可关键字）。
2. 带默认值的位置参数（可位置可关键字，但有默认值）。
3. `*args`（收集多余位置参数，同时充当分界）。
4. 仅关键字参数（必需或带默认值）。
5. `**kwargs`（收集多余关键字参数）。

一条铁律：`*`（或 `*args`）之后、`**kwargs` 之前的参数，全部是仅关键字参数。

```python
def build_profile(name, age=0, *tags, height=None, weight=None, **extra):
    """构建用户档案。
    name/age 是位置参数；*tags 收集兴趣标签；
    height/weight 是仅关键字参数；extra 收集其余关键字。
    """
    profile = {"name": name, "age": age, "tags": tags}
    if height is not None:
        profile["height"] = height
    if weight is not None:
        profile["weight"] = weight
    profile.update(extra)
    return profile

print(build_profile("张三", 28, "摄影", "徒步", height=175, weight=68, city="杭州"))
# 输出：
# {'name': '张三', 'age': 28, 'tags': ('摄影', '徒步'), 'height': 175, 'weight': 68, 'city': '杭州'}
```

```python
# height/weight 必须用关键字；下面这种调用会报错
build_profile("张三", 28, "摄影", 175, 68)
# 输出：
# TypeError: build_profile() got multiple values for argument 'height'
# （175/68 被 *tags 收进 tags，而 height/weight 依然只能关键字传）
```

这里 `175`、`68` 被 `*tags` 当作兴趣标签收掉了，`height`/`weight` 仍然是仅关键字参数，所以 Python 报的是 `*tags` 与仅关键字区域之间的规则冲突——这也顺带印证了 `*args` 不会"吞噬"仅关键字参数的槽位，仅关键字区域始终受分界符保护。

### 2.7 用 `inspect.signature` 解读仅关键字参数

当一个函数来自第三方库，光看 `help()` 或源码有时不够直观。Python 的 `inspect` 模块提供了 `signature`，可以把函数签名解析成结构化对象，清晰呈现每个参数的类别（位置/仅位置/仅关键字/可变等）。

```python
import inspect

def connect(host, port, *, ssl=False, timeout=10):
    pass

sig = inspect.signature(connect)
for name, param in sig.parameters.items():
    print(f"{name:10} -> {param.kind.name}, 默认值={param.default!r}")
# 输出：
# host       -> POSITIONAL_OR_KEYWORD, 默认值=<class 'inspect.Parameter.empty'>
# port       -> POSITIONAL_OR_KEYWORD, 默认值=<class 'inspect.Parameter.empty'>
# ssl        -> KEYWORD_ONLY, 默认值=False
# timeout    -> KEYWORD_ONLY, 默认值=10
```

`param.kind` 是一个枚举，对仅关键字参数它会返回 `inspect.Parameter.KEYWORD_ONLY`。这正是判断一个参数是否仅关键字的标准编程方式——比手写正则解析函数签名稳健得多。

结合 `*args` 的情况：

```python
import inspect

def log(message, *args, file=None, newline=True, **kwargs):
    pass

sig = inspect.signature(log)
print("仅关键字参数有：", [
    n for n, p in sig.parameters.items()
    if p.kind == inspect.Parameter.KEYWORD_ONLY
])
# 输出：仅关键字参数有：['file', 'newline']
```

可以看到 `*args` 之后的 `file`、`newline` 被正确识别为仅关键字参数，而 `**kwargs` 的 `kwargs` 本身属于 `VAR_KEYWORD`，不算仅关键字。这种结构化视图在写装饰器、参数校验、自动文档生成时非常有用。

### 2.8 典型 API 案例：标准库中的仅关键字参数

仅关键字参数不是某个学术概念，它是被 Python 标准库广泛采用的工程实践。下面看几个典型例子，从别人的 API 设计里汲取"什么时候该用仅关键字"的直觉。

**案例一：`sorted` 的 `reverse` / `key`**

`sorted` 把可迭代对象作为必需位置参数，而 `key` 和 `reverse` 都是仅关键字——准确说是带默认值的位置或关键字参数，但官方约定用关键字传。这背后的考量是：`sorted(numbers, True)` 的含义几乎不可读，而 `sorted(numbers, reverse=True)` 自解释。

```python
numbers = [3, 1, 4, 1, 5, 9, 2, 6]

# 不推荐的写法：reverse 按位置传，含义不明
# sorted(numbers, True)  —— 实际上 sorted 的 reverse 不是纯仅关键字，
# 但社区惯例与可读性强烈建议用关键字。

# 推荐写法：关键字传，意图清晰
print(sorted(numbers, reverse=True))          # 降序
print(sorted(numbers, key=lambda x: -x))      # 自定义排序键
# 输出：
# [9, 6, 5, 4, 3, 2, 1, 1]
# [9, 6, 5, 4, 3, 2, 1, 1]
```

**案例二：`open` 的 `encoding` 等**

`open` 的签名可简化为 `open(file, mode='r', ..., encoding=None, ...)`. 其中 `encoding`、`errors`、`newline` 这类"文本模式控制项"强烈建议用关键字传——因为它们的取值都是字符串，如果按位置传，`open("a.txt", "r", "utf-8")` 会让读者困惑第三个字符串究竟是 `encoding` 还是 `errors`。

```python
# 推荐写法：encoding 必须关键字传，意图清晰
with open("/tmp/demo.txt", "w", encoding="utf-8") as f:
    f.write("你好，世界")

with open("/tmp/demo.txt", encoding="utf-8") as f:
    print(f.read())
# 输出：你好，世界
```

**案例三：`dataclasses.field` 的字段配置**

`dataclasses.field` 是把仅关键字参数发挥到极致的范例：它的几乎所有参数（`default`、`default_factory`、`init`、`repr`、`compare`、`hash`、`metadata`）都是仅关键字参数。因为这些都是字段的"配置开关"，按位置传必然混乱。

```python
from dataclasses import dataclass, field

@dataclass
class Product:
    name: str
    price: float
    tags: list = field(default_factory=list, repr=False)
    stock: int = field(default=0, compare=False)

p = Product("笔记本", 9.9, tags=["文具", "热销"], stock=100)
print(p)
# 输出：Product(name='笔记本', price=9.9, stock=100)
```

注意 `field(default_factory=list, repr=False)` 全部用了关键字——这正是 `field` 把这些配置项设计成仅关键字参数的直接效果。如果它们是位置参数，`field(list, False)` 这样的调用将完全不可读。

```python
import inspect
print([
    n for n, p in inspect.signature(dataclass).parameters.items()
    if p.kind == inspect.Parameter.KEYWORD_ONLY
])
# 输出：['init', 'repr', 'eq', 'order', 'unsafe_hash', 'frozen', 'match_args', 'kw_only', 'slots', 'weakref_slot']
```

可以看到 `dataclass` 装饰器自身的配置参数（`init`、`repr`、`frozen` 等）也全是仅关键字参数。这不是巧合——凡是"配置项多、语义独立、默认值多"的场景，Python 标准库都会用仅关键字参数来保证调用点可读性。

**案例四：`open` 的姊妹——`io.open` 与 `print` 的 `flush`**

```python
import inspect

# print 的 sep/end/file/flush 全是仅关键字参数
print([
    n for n, p in inspect.signature(print).parameters.items()
    if p.kind == inspect.Parameter.KEYWORD_ONLY
])
# 输出：['sep', 'end', 'file', 'flush']
```

`print` 的 `sep`、`end`、`file`、`flush` 都是仅关键字参数。想象一下如果 `flush` 是位置参数：`print("x", True)` 到底是改变结尾符还是立即刷新？强制关键字消除了这个隐患，并把"写出来的代码就是文档"这一理念贯彻到底。

## 3. 最佳实践

### 3.1 何时应该把参数设计为仅关键字

适合设为仅关键字参数的典型信号：

- **布尔开关**：`ssl=True`、`reverse=True` 这类参数按位置传会丢失含义，必须显式命名。
- **可选配置项且有默认值**：`timeout=10`、`encoding="utf-8"` 这类"平时不传、用时才传"的参数。
- **同类型多参数易混顺序**：如 `seconds` / `milliseconds`、`width` / `height`，强制命名后调用点自带单位。
- **预期会随版本增长的字段列表**：放在 `*` 之后的配置区，未来加项不破坏既有调用。
- **与主体输入语义分离**：主体输入（如要处理的数据）按位置传，衍生的控制项按关键字传，让函数"主菜"和"调料"各居其位。

反过来，不适合设为仅关键字的情况：

- 仅有一个参数、语义一目了然的简单函数，没必要增加调用方负担。
- 在性能敏感的极热路径上大量调用，且调用点本就直观——关键字传参每次都要构造 `LOAD_CONST` + `KW_NAMES`，虽差异极小，但超大规模循环中值得留意。

### 3.2 推荐写法 vs 不推荐写法

**推荐：配置项一律放在 `*` 之后并用关键字传**

```python
def create_window(title, *, width=800, height=600, fullscreen=False):
    """窗口标题按位置传，尺寸/全屏开关按关键字传。"""
    print(f"{title} ({width}x{height}, fullscreen={fullscreen})")

create_window("主窗口", width=1280, fullscreen=True)
# 输出：主窗口 (1280x600, fullscreen=True)
```

**不推荐：配置项沿用位置参数，调用点变成"猜谜游戏"**

```python
def create_window_bad(title, width=800, height=600, fullscreen=False):
    print(f"{title} ({width}x{height}, fullscreen={fullscreen})")

# 这行代码半年后没人看得懂
create_window_bad("主窗口", 1280, 600, True)
# 输出：主窗口 (1280x600, fullscreen=True)
```

两种写法行为相同，但前者调用点是"自解释文档"，后者是"顺序谜题"。代价仅仅是定义处加一个 `*`，收益巨大。

### 3.3 仅关键字参数与默认值的搭配建议

仅关键字参数常常带默认值，这里有两条实用经验：

**第一，必选的仅关键字参数应该谨慎使用。** 一个没有默认值的仅关键字参数，意味着调用方每次都必须显式传值，语义上和"必选配置"并无二致。只在确实需要"强制显式声明"时才这么做（例如安全相关的 `verify=True` 必须显式确认），否则给它一个默认值更友好。

```python
# 过度强制：每次调用都要写 mode，即使大部分场景都是 "r"
def read_file(path, *, mode):
    return open(path, mode)

# 更友好：默认 "r"，按需覆盖
def read_file(path, *, mode="r"):
    return open(path, mode)
```

**第二，配置项默认值应为不可变对象。** 与普通默认参数一样，仅关键字参数的默认值如果是可变对象（列表、字典），同样会触发"默认值共享"陷阱：

```python
# 陷阱：默认值是可变列表，多次调用共享同一对象
def append_log(msg, *, queue=[]):
    queue.append(msg)
    return queue

print(append_log("a"))   # 输出：['a']
print(append_log("b"))   # 输出：['a', 'b'] —— 意外！两次调用共享同一个列表
```

推荐用 `None` 作哨兵，在函数体内初始化：

```python
def append_log(msg, *, queue=None):
    if queue is None:
        queue = []
    queue.append(msg)
    return queue

print(append_log("a"))   # 输出：['a']
print(append_log("b"))   # 输出：['b'] —— 每次独立
```

### 3.4 调用仅关键字参数函数的规范

调用方也有讲究：

- 始终用 `参数名=值` 传仅关键字参数，不要试图"绕过"——语言层面会拦截，不应抱侥幸心理。
- 关键字参数传参顺序可以与定义顺序不同，这是关键字的天然优势，但也不要滥用：保持与定义顺序一致更利于阅读。

```python
def render(text, *, bold=False, italic=False, underline=False):
    return f"{text} [bold={bold}, italic={italic}, underline={underline}]"

# 顺序与定义一致——可读性最佳
print(render("hi", bold=True, italic=False))
# 输出：hi [bold=True, italic=False, underline=False]

# 顺序打乱——合法但可读性下降，不推荐
print(render("hi", italic=False, bold=True))
# 输出：hi [bold=True, italic=False, underline=False]
```

### 3.5 在 API 演进中善用仅关键字参数

仅关键字参数是 API 平滑演进的利器。一个经验法则：**公开 API 的"可选配置项"几乎都应设为仅关键字参数**。这样你在未来新增配置项时，既有调用点完全不用改，向后兼容自然成立。

```python
# v1 版本
def fetch(url, *, timeout=30):
    ...

# v2 版本：新增 retries，既有调用点不动
def fetch(url, *, timeout=30, retries=3):
    ...

# v3 版本：再加 verify_ssl，既有调用点仍不动
def fetch(url, *, timeout=30, retries=3, verify_ssl=True):
    ...
```

如果这些配置项是位置参数，每次新增都要警惕既有调用是否因为顺序错位而被误判——仅关键字参数把这个心智负担彻底卸掉了。

### 3.6 用 `/`（仅位置）与 `*`（仅关键字）协同

Python 3.8 引入仅位置参数（用 `/` 标记）后，一个函数签名可以同时表达三种参数类别：仅位置、位置或关键字、仅关键字。设计公开 API 时，合理组合这两道分界符能让接口意图最清晰：

```python
def configure(address, port, /, *, ssl=False, timeout=10):
    """address/port 仅位置（语义直观、不依赖参数名）；
    ssl/timeout 仅关键字（配置开关必须显式命名）。"""
    print(f"{address}:{port} ssl={ssl} timeout={timeout}")

configure("127.0.0.1", 8080, ssl=True, timeout=5)
# 输出：127.0.0.1:8080 ssl=True timeout=5
```

这种写法让"主体输入"和"配置开关"的边界格外分明：主体输入走位置（调用简洁），配置开关走关键字（调用清晰）。两者各司其职，互不干扰。

## 4. 原理

### 4.1 `*` 标记在函数对象上的存储

理解仅关键字参数的原理，要从函数对象的创建说起。Python 函数在 `def` 执行时，字节码层面会构造一个函数对象，其中与参数相关的元信息被拆分存储在两处：

- **`__code__` 属性**：一个 `code` 对象，记录了参数数量、名称、类别等编译期元信息。
- **`__defaults__` 与 `__kwdefaults__` 属性**：分别存储位置参数默认值元组与仅关键字参数默认值字典。

`*` 标记本身不是一个参数槽位，它的影响体现在 `__code__` 的几个字段上：`co_argcount`（位置或关键字参数数量）、`co_kwonlyargcount`（仅关键字参数数量）、`co_posonlyargcount`（仅位置参数数量）。

```python
def connect(host, port, *, ssl=False, timeout=10):
    pass

code = connect.__code__
print("位置或关键字参数数量 co_argcount:", code.co_argcount)
print("仅关键字参数数量 co_kwonlyargcount:", code.co_kwonlyargcount)
print("参数名 co_varnames:", code.co_varnames)
print("仅关键字默认值 __kwdefaults__:", connect.__kwdefaults__)
# 输出：
# 位置或关键字参数数量 co_argcount: 2
# 仅关键字参数数量 co_kwonlyargcount: 2
# 参数名 co_varnames: ('host', 'port', 'ssl', 'timeout')
# 仅关键字默认值 __kwdefaults__: {'ssl': False, 'timeout': 10}
```

可以看到：

- `co_argcount` 是 2，只统计 `host`、`port` 这两个 `*` 之前的参数。
- `co_kwonlyargcount` 是 2，专门统计 `*` 之后的 `ssl`、`timeout`。
- `co_varnames` 把所有参数名按定义顺序放在一起，但 `co_argcount` 与 `co_kwonlyargcount` 的拆分让你能判别哪些是仅关键字。
- `__kwdefaults__` 只收仅关键字参数的默认值，位置参数默认值则放在 `__defaults__`。

如果函数有默认值的位置参数，`__defaults__` 也会被填充，与 `__kwdefaults__` 形成对照：

```python
def f(a, b=1, *, c=2, d=3):
    pass

print("__defaults__:", f.__defaults__)
print("__kwdefaults__:", f.__kwdefaults__)
# 输出：
# __defaults__: (1,)
# __kwdefaults__: {'c': 2, 'd': 3}
```

`b=1` 是带默认值的位置参数，默认值进 `__defaults__` 元组；`c=2`、`d=3` 是仅关键字参数，默认值进 `__kwdefaults__` 字典。两者存储结构不同（元组 vs 字典），本身就反映了"位置参数按顺序绑定、仅关键字参数按名绑定"的机制差异。

### 4.2 `MAKE_FUNCTION` 字节码与仅关键字区域的编码

`def` 语句在字节码层面对应 `MAKE_FUNCTION` 指令（不同 Python 版本细节略有差异，但截取的元信息结构一致）。函数对象的构造过程中，解释器从 `*` 标记的位置把参数列表切成两段：

- 前半段写入 `co_argcount`（位置或关键字参数）。
- 后半段写入 `co_kwonlyargcount`（仅关键字参数）。

而 `*` 这个标记本身并不对应任何参数槽位，它在编译期完成"划界"职责后就消失了——这也是为什么调用时无法、也不需要为 `*` 传值。

可以用 `dis` 模块观察 `MAKE_FUNCTION` 附近的字节码，不过更值得关注的是：函数对象的 `co_kwonlyargcount` 字段在 `def` 执行完毕后就固定下来，成为后续每次调用时参数绑定的依据。

```python
import dis

def sample(a, *, b):
    pass

# 仅看函数对象层面，不展开整个字节码
print("co_kwonlyargcount:", sample.__code__.co_kwonlyargcount)
print("co_varnames:", sample.__code__.co_varnames)
# 输出：
# co_kwonlyargcount: 1
# co_varnames: ('a', 'b')
```

`co_kwonlyargcount` 为 1，意味着 `b` 被锁定为仅关键字参数，这个信息会指导 `CALL` 指令的参数绑定逻辑。

### 4.3 调用时的参数绑定机制：为何 `*` 之后不能按位置绑定

函数调用的核心是参数绑定：把传入的实参对应到形参变量。Python 解释器在处理一次 `CALL` 指令时，会把实参分成两部分——位置实参序列与关键字实参映射（如果把关键字拆出来）。

绑定过程大致经历以下步骤（简化版，聚焦仅关键字部分）：

1. **位置实参填充**：从前到后依次填入 `co_argcount` 个位置或关键字参数槽位。一旦位置实参数量超过 `co_argcount`，多余的位置实参要么进 `*args`（如果有），要么直接报错。
2. **关键字实参绑定**：关键字实参按名字匹配形参。对仅关键字形参，只能通过这一步绑定。
3. **仅关键字参数检查**：所有 `co_kwonlyargcount` 个仅关键字参数必须要么有默认值，要么已经在关键字实参中被赋值，否则报错。

关键在第 1 步：位置实参能填充的槽位 **只来自 `co_argcount`**，根本不涵盖 `co_kwonlyargcount`。这就是"为什么 `*` 之后的参数不能按位置传"的底层原因——位置绑定的边界被编译期写入的 `co_argcount` 硬性限制住了，`*` 之后的参数槽位根本不参与位置绑定。

```python
def f(a, *, b):
    return a, b

# 位置实参只有一个槽位 a，多余的位置实参无处可填 → 报错
f(1, 2)
# 输出：
# TypeError: f() takes 1 positional argument but 2 were given
```

报错信息 "takes 1 positional argument but 2 were given" 正是 `co_argcount == 1` 的直接体现：解释器告知调用方，这个函数只接受 1 个位置实参（`a`），第二个位置实参 `2` 没有位置槽位可绑定。而 `b` 属于仅关键字区域，必须等到第 2 步关键字绑定阶段才会被处理，永远不会被位置实参"误填"。

对比 `*args` 的情况，差异就在第 1 步的多余处理：

```python
def f(a, *args, b):
    return a, args, b

# 多余位置实参 2、3 被 *args 收集，b 仍需关键字
print(f(1, 2, 3, b=4))
# 输出：(1, (2, 3), 4)

# b 仍未用关键字传 → 报错（缺少仅关键字参数 b 的值）
f(1, 2, 3)
# 输出：
# TypeError: f() missing 1 required keyword-only argument: 'b'
```

`*args` 把"溢出的位置实参"收进元组，避免了一上来就报"位置参数过多"的错；但 `b` 依然走关键字绑定，缺失时报的是 "missing 1 required keyword-only argument"——注意"keyword-only"这个措辞，正是 `co_kwonlyargcount` 检查的产物。

### 4.4 默认值的填充：`__kwdefaults__` 的作用

仅关键字参数的默认值存储在函数对象的 `__kwdefaults__` 字典里，键是参数名，值是默认对象。调用时如果某个仅关键字参数没有被关键字实参赋值，解释器就从 `__kwdefaults__` 取值填入，函数体内自然能读到默认值。

```python
def connect(host, *, ssl=False, timeout=10):
    return (host, ssl, timeout)

print(connect.__kwdefaults__)
# 输出：{'ssl': False, 'timeout': 10}
```

这也解释了一个重要特性：**仅关键字参数的默认值在 `def` 执行时被求值并固化到 `__kwdefaults__`**。因此与普通默认参数一样，默认值若为可变对象，会在多次调用间共享——这就是第 3.3 节"可变默认值陷阱"的根源。底层来看，`__kwdefaults__` 是函数对象上的一个属性，所有调用共享同一个字典、字典里又指向同一个可变对象，自然就共享了。

### 4.5 `*args` 不吞噬仅关键字槽位的原理解释

一个容易产生的疑问：既然 `*args` 会收集多余位置实参，会不会把本该属于仅关键字参数的位置也"吃掉"？答案是不会，原因正是上述绑定机制的职责分离：

- 位置绑定阶段，`*args` 收集的是"填满 `co_argcount` 个位置槽位之后的多余位置实参"。
- 仅关键字参数从来不在位置槽位里，它的槽位属于 `co_kwonlyargcount`，只能通过关键字映射绑定。

因此 `*args` 再贪婪，也只在自己的"位置溢出区"活动，碰不到仅关键字区域。这就是为什么 `def f(a, *args, b)` 中，`args` 不会吞噬 `b` 的绑定机会——`b` 始终等待关键字实参，而位置实参再多也只影响 `args`。

### 4.6 `inspect` 如何还原仅关键字区域

`inspect.signature` 能把函数签名结构化呈现，它底层读取的正是 `__code__` 的 `co_argcount`、`co_kwonlyargcount`、`co_posonlyargcount` 以及 `__defaults__`、`__kwdefaults__`。以仅关键字参数为例：解释器知道 `co_argcount` 之后、`co_kwonlyargcount` 个参数名属于仅关键字区域，于是把它们标记为 `KEYWORD_ONLY`，默认值从 `__kwdefaults__` 取。

```python
import inspect

def f(a, b=1, *args, c, d=2, **kwargs):
    pass

sig = inspect.signature(f)
for name, param in sig.parameters.items():
    print(f"{name:8} kind={param.kind.name:20} default={param.default!r}")
# 输出：
# a        kind=POSITIONAL_OR_KEYWORD   default=<class 'inspect.Parameter.empty'>
# b        kind=POSITIONAL_OR_KEYWORD   default=1
# args     kind=VAR_POSITIONAL          default=<class 'inspect.Parameter.empty'>
# c        kind=KEYWORD_ONLY            default=<class 'inspect.Parameter.empty'>
# d        kind=KEYWORD_ONLY            default=2
# kwargs   kind=VAR_KEYWORD             default=<class 'inspect.Parameter.empty'>
```

`c` 没有默认值（`empty`），所以是"必选仅关键字参数"；`d` 有默认值 2，来自 `__kwdefaults__`。这种结构化视图其实就是把函数对象上分散的几处元信息重新拼装成人类可读的签名。

### 4.7 仅关键字参数与函数签名的不可变性

函数对象上的 `__kwdefaults__` 理论上可被改写（它是普通属性），但这绝对是反模式。修改它会绕过 `def` 的语义，让函数行为变得不可预测：

```python
def f(*, x=1):
    return x

# 不推荐的"魔法修改"：直接改 __kwdefaults__
f.__kwdefaults__["x"] = 999
print(f())
# 输出：999
```

虽然技术上可行，但这种写法会让后续维护者完全无法理解 `x` 的值从何而来。仅关键字参数的默认值一旦定义就应该视为不可变契约，需要变化时通过显式传关键字实参来实现，而不是篡改函数对象。

## 5. 总结

### 5.1 本文内容要点

- **仅关键字参数的定义**：函数签名中 `*`（或 `*args`）之后的参数，调用时必须用关键字传，不能按位置传。
- **标记方式**：裸 `*` 充当纯分界符，不收集任何实参；`*args` 既是可变位置参数，又顺带充当分界符。两者在"划出仅关键字区"上等价，区别在于是否收集多余位置实参。
- **核心价值**：强制显式命名提升调用点可读性，避免布尔位置参数歧义（如 `draw("hi", True)` 的语义不清），并配合默认值构成平滑扩展的可选配置项。
- **常见组合**：仅关键字参数常带默认值，与普通位置参数、`*args`、`**kwargs` 按固定顺序组合，位于参数链尾段。
- **标准库实践**：`sorted`、`open`、`print`、`dataclasses.field` / `dataclass` 等都把配置开关设计为仅关键字参数，让调用点"写出来就是文档"。
- **底层原理**：`*` 标记在 `MAKE_FUNCTION` 时把 `co_argcount` 与 `co_kwonlyargcount` 分开存储，默认值进 `__kwdefaults__`；调用时位置实参只填 `co_argcount` 个槽位，越过即报"位置参数过多"，仅关键字参数只能走关键字绑定——这就是"`*` 之后不能按位置传"的根本原因。
- **工程经验**：公开 API 的可选配置项几乎都应设为仅关键字参数；默认值用不可变对象或 `None` 哨兵；调用时关键字顺序与定义顺序保持一致；用 `inspect.signature` 结构化解读签名。

### 5.2 读完本文你应能掌握

- 准确识别函数签名中 `*` 与 `*args` 的作用差异，并说明二者在"划定仅关键字区"上的等价性与在"收集多余位置实参"上的区别。
- 能说明为什么 `connect(host, port, *, ssl=False, timeout=10)` 中 `ssl`/`timeout` 不能按位置传，并能在真实报错信息（"takes N positional arguments" / "missing required keyword-only argument"）中定位到 `co_argcount` / `co_kwonlyargcount` 的检查逻辑。
- 能为真实业务函数（如 `send_email`、`download`、`render`）合理设计仅关键字参数，把布尔开关与可选配置项放在 `*` 之后并赋予默认值，使调用点自解释且向后兼容。
- 能用 `inspect.signature` 解读任意函数的仅关键字参数列表与默认值，用于参数校验、自动文档或装饰器开发。
- 能说清 `__code__.co_kwonlyargcount` 与 `__kwdefaults__` 在函数对象上的存储方式，并解释调用时位置绑定与关键字绑定的职责分离如何保证"`*` 之后的参数不被位置实参误填"。
- 能识别可变默认值在 `__kwdefaults__` 上的共享陷阱，并用 `None` 哨兵规避。
