---
group:
  title: 【15】模块与包管理
  order: 15
order: 5
title: 相对导入
nav:
  title: Python
  order: 1
---

## 1. 介绍

### 1.1 什么是相对导入

当一个项目逐渐长大，代码不再能塞进单个 `.py` 文件时，我们会把它拆成一个包（package）：一个目录里放上若干模块，再加一个 `__init__.py`。比如下面这个结构：

```
mypkg/
├── __init__.py
├── core.py
├── utils.py
└── sub/
    ├── __init__.py
    └── helper.py
```

`core.py` 想用 `utils.py` 里的函数，`sub/helper.py` 想用 `core.py` 里的类——这就是"包内模块互相引用"。Python 提供两种写法：一种是从包根开始写全路径，叫**绝对导入**；另一种是以当前模块所在包为参照，用点号 `.` 表示层级关系，叫**相对导入**（relative import）。

相对导入的语法长这样：

```python
from . import sibling          # 从当前包导入兄弟模块 sibling
from .submod import X          # 从当前包的子模块 submod 导入名字 X
from ..parent import Y         # 从上一级包导入 parent 模块里的 Y
from ..parent.sub import Z     # 从上一级包的子模块 sub 导入 Z
```

这里的点不是"当前目录"的意思，而是"当前包"的层级标记。一个点 `.` 代表当前模块所在的包，两个点 `..` 代表上一级包，三个点 `...` 代表上上一级包，依此类推。它和文件系统里的 `./`、`../` 形似，但本质不同——相对导入操作的是**包层级**（package level），不是文件路径。

### 1.2 为什么需要相对导入

先看一个绝对导入的写法。假设 `mypkg/core.py` 想调用 `mypkg/utils.py` 里的 `format_date`：

```python
# mypkg/core.py —— 绝对导入
from mypkg.utils import format_date

def run():
    return format_date("2024-01-01")
```

这能工作，但有个别扭的地方：`core.py` 自己就是 `mypkg` 的一员，却要把自己的包名 `mypkg` 写进导入语句里。一旦哪天这个包要改名——比如从 `mypkg` 改成 `mylib`，或者从 `project/mypkg` 移到 `project/libs/mypkg`——所有这些写死了包名的绝对导入都要逐行修改。

相对导入就是为了解决这个痛点：让包内模块之间的引用**不依赖包的绝对名字**，只依赖彼此在包内的相对位置。改写成相对导入：

```python
# mypkg/core.py —— 相对导入
from .utils import format_date

def run():
    return format_date("2024-01-01")
```

`.utils` 意思是"当前包（`mypkg`）里的 `utils` 模块"。包整体改名、移动到别的目录后，这句不用改——只要 `core.py` 和 `utils.py` 还在同一个包里，`.utils` 永远指对了。

### 1.3 最小可运行示例

为了建立直觉，先用一个尽量小的包跑通相对导入。准备如下文件结构：

```
demo_pkg/
├── __init__.py        # 空文件，标记这是一个包
├── a.py               # 模块 a
└── b.py               # 模块 b，相对导入 a
```

`a.py` 定义一个函数，`b.py` 用相对导入引用它：

```python
# demo_pkg/a.py
def hello():
    return "hello from a"
```

```python
# demo_pkg/b.py
from . import a       # 相对导入：从当前包导入兄弟模块 a

def greet():
    return a.hello() + " & b"
```

在包的外面（与 `demo_pkg/` 同级的位置）运行：

```python
# run.py（与 demo_pkg/ 同级）
from demo_pkg import b
print(b.greet())
# 输出：hello from a & b
```

注意 `run.py` 是作为"使用这个包的外部脚本"来写的，它自己不在包里，用的是绝对导入 `from demo_pkg import b`。真正用到相对导入的是包内的 `b.py`：`from . import a`。

这就是相对导入的最小形态。后面会展开 `.`、`..` 各层级的语义、它和绝对导入的取舍、直接运行包内子模块时为何会报错，以及怎么用 `python -m` 解决。

---

## 2. 核心内容

### 2.1 点的层级语义：一个点、两个点、三个点

相对导入的全部语法，就是通过点号数量来表达"从当前包往上看几层"。把它们和包结构对应起来，理解为一张"层级表"：

| 写法 | 含义 | 对应包层级 |
|------|------|-----------|
| `from . import mod` | 当前包里的 `mod` 模块 | 当前模块所在包 |
| `from .sub import mod` | 当前包的子包/子模块 `sub` 里的 `mod` | 当前包下一层 |
| `from .. import mod` | 上一级包里的 `mod` | 当前模块所在包的父包 |
| `from ..pkg import mod` | 上一级包的子模块 `pkg` 里的 `mod` | 父包下一层 |
| `from ... import mod` | 上上一级包里的 `mod` | 父包的父包 |

关键认知有三条：

1. **一个点等于"往上一层包"**。准确说，一个点 `.` 指向当前模块所在的包本身。`from . import X` 就是"从当前包导入 X"，X 可以是包里的模块、子包，或是 `__init__.py` 里定义的名字。
2. **点的个数 = 向上越过几层包**。`..` 是越过当前包这一层，站在父包视角；`...` 是再越一层，站到祖父包视角。每多一个点，就再往上抬一层。
3. **点之后接名字**，表示从那个视角往下找。`from .. import pkg` 指"父包里的 pkg"，`from ..pkg import mod` 指"父包里的 pkg 包下的 mod 模块"。

用一个三层的包结构来演示三种点层级：

```
app/
├── __init__.py
├── core.py
├── data/
│   ├── __init__.py
│   ├── loader.py
│   └── models/
│       ├── __init__.py
│       └── user.py
```

`data/models/user.py` 想引用其他位置的模块：

```python
# app/data/models/user.py
from . import user_fields        # (A) 当前包 = app.data.models，引用兄弟模块
from .. import loader            # (B) 上一级包 = app.data，引用 data 包下的 loader
from ... import core             # (C) 上上一级包 = app，引用 app 包下的 core
```

对应解读：

- (A) `.` = 当前模块 `user` 所在的包 `app.data.models`，`user_fields` 是同包的兄弟模块（`app/data/models/user_fields.py`）。
- (B) `..` = 从 `app.data.models` 往上一层，即 `app.data`，`loader` 是 `app/data/loader.py`。
- (C) `...` = 再往上一层，即 `app`，`core` 是 `app/core.py`。

可以看到，点的数量和包的嵌套深度直接挂钩。写相对导入时，脑子里先画出包的树状结构，再数当前模块在第几层、要找的模块在第几层，就能确定要写几个点。

**一个常被忽略的限制**

相对导入只能"往上找包、再往下找模块"，不能在同一个点层级里横向跳。比如 `app/data/loader.py` 想引用 `app/core.py`，写 `from .core import X` 其实是对的——因为 `.` 是当前包 `app.data`，`core` 不是 `app.data` 的成员，会报错。正确写法是 `from ..core import X`，先 `..` 跳到 `app`，再 `core` 引到 `app.core`。这一类"同级包"的引用最容易写错点数。

### 2.2 `from . import` 与 `from .mod import` 的区别

两种写法都常见，但导入的对象不同。

`from . import X` —— 从当前包导入一个名字 X。X 可以是：

- 当前包里的某个模块（`from . import utils` 导入 `utils.py`）。
- 当前包里的某个子包（`from . import sub` 导入子包 `sub/`）。
- 在 `__init__.py` 里定义过的变量/函数/类（因为执行 `from . import X` 时，X 会先在包的 `__init__.py` 命名空间里找）。

`from .mod import Y` —— 直接深入到当前包里的 `mod` 模块，从里面导入名字 Y。Y 是 `mod.py` 文件内部定义的函数/类/变量。

两种写法对应两种思路：前者把"模块"当作一个整体拿过来，后者直接拿到模块里的具体名字。看一个对比：

```python
# mypkg/core.py

# 写法一：导入整个模块，通过模块名访问其内部
from . import utils
def show():
    return utils.now()           # 要写 utils.now

# 写法二：导入具体名字，直接用
from .utils import now
def show():
    return now()                 # 直接调用 now
```

写法一的好处是命名空间清晰——`utils.now`、`utils.format` 都挂在 `utils` 名下，一眼能看出来源；写法二的好处是后续调用更短，但若从多个模块各导入同名函数就会冲突。

到底用哪种，主要看风格和冲突风险。一般建议：包内同级模块互相引用时，优先用 `from .pkg import name` 拉具体名字，可读性最好；如果两个模块高度耦合、互相调用的东西很多，用 `from . import mod` 整体导入更省事。

### 2.3 子包引用父包：`from ..` 的真实场景

相对导入在子包引用父包时最有价值。设想一个 web 项目的结构：

```
webapp/
├── __init__.py
├── config.py            # 全局配置
├── db.py                # 数据库连接
└── api/
    ├── __init__.py
    ├── users.py         # 用户接口
    └── posts.py         # 文章接口
```

`api/users.py` 需要用到 `webapp/config.py` 里的配置，以及 `webapp/db.py` 里的数据库连接。用相对导入写：

```python
# webapp/api/users.py
from .. import config       # 上一级包 = webapp，引用 config 模块
from ..db import get_conn   # 上一级包里的 db 模块，导入 get_conn 函数

def list_users():
    conn = get_conn(config.DB_URL)
    return conn.query("SELECT * FROM users")
```

```python
# webapp/config.py
DB_URL = "postgres://localhost/webapp"
```

```python
# webapp/db.py
def get_conn(url):
    class Conn:
        def __init__(self, url):
            self.url = url
        def query(self, sql):
            return f"[result of {sql} on {self.url}]"
    return Conn(url)
```

在 `webapp/` 的上级目录运行：

```python
# run.py（与 webapp/ 同级）
from webapp.api import users
print(users.list_users())
# 输出：[result of SELECT * FROM users on postgres://localhost/webapp]
```

`from .. import config` 的 `..` 把视角抬到 `webapp`，再 `import config` 引到 `webapp/config.py`。这行代码不依赖 `webapp` 这个名字——哪天整个项目从 `webapp/` 改名成 `myapp/`，或者从仓库根移到 `src/webapp/`，这一行都不用改，只要 `api/users.py` 和 `config.py`、`db.py` 依然同属一个包、相对位置不变就行。

如果改成绝对导入：

```python
# 绝对导入版本
from webapp import config
from webapp.db import get_conn
```

包一改名，这两行就要跟着改。这就是相对导入在工程设计上的核心收益。

### 2.4 相对导入 vs 绝对导入：何时用哪个

两种导入并非互斥，而是各有所长。

**相对导入的优点**：

- 包整体改名、迁移目录时，包内引用语句不用动。
- 包内模块互相引用时不用重复写自己的包名，更短。
- 阅读包内代码时，`.utils` 比 `mypkg.utils` 更能体现"这是本包内部的事"。

**相对导入的缺点**：

- 不知道当前模块在哪个包里时，光看 `from .. import X` 搞不清 `..` 到底指谁，需要先看文件位置。
- 不能在顶层脚本里用（后面详述）。
- 点数多了（`from ...` 甚至 `from ....`）可读性很差，容易写错层级。

**绝对导入的优点**：

- 自描述——`from mypkg.utils import format_date` 一眼看清来源。
- 在任何位置都能用（顶层脚本、包内模块、交互式环境都行）。
- IDE 的跳转、重命名支持更稳。

**绝对导入的缺点**：

- 包改名后要全量替换导入路径。
- 包名很长时写起来啰嗦。

一个实用的工程决策是：**包内部模块互相引用优先用相对导入；跨包引用、应用层入口脚本、对外提供的 API 用绝对导入**。这样包作为一个整体，搬家成本最低；而包外的使用者用绝对路径，指向明确。

PEP 8 的建议也类似：在包内部推荐用相对导入，能避免让包名意外进入导入路径，也能减少改名时的改动量。

### 2.5 相对导入的合法使用前提

相对导入不是随便哪里都能写，它有一个硬性前提：**当前模块本身必须属于某个包**。换句话说，当前模块的 `__package__` 不为空（或等价地，`__name__` 里含点），相对导入才能生效。

这意味着两种场景下相对导入**不能用**：

1. **顶层脚本**：直接用 `python script.py` 运行的脚本，它的 `__name__` 是 `"__main__"`、`__package__` 是 `None`，没有"所在包"的概念，相对导入无处参照，会报错。
2. **交互式解释器**：在 REPL 里敲 `from . import X` 同样没有上下文，会报同样的错。

来看一个具体的失败例子。准备一个极简包：

```
top/
├── __init__.py
├── main.py        # 里面有相对导入
└── helper.py
```

```python
# top/helper.py
def ping():
    return "pong"
```

```python
# top/main.py
from . import helper        # 相对导入，期望引用兄弟模块

def run():
    return helper.ping()
```

现在直接运行 `top/main.py`：

```bash
$ cd top/
$ python main.py
```

会得到：

```
ImportError: attempted relative import with no known parent package
```

错误信息说得很直白——"attempted relative import with no known parent package"：尝试做相对导入，但找不到"已知的父包"。因为直接运行 `python main.py` 时，Python 把 `main.py` 当成顶层脚本，它的 `__name__` 被设成 `"__main__"`、`__package__` 被设成 `None`，没有"我属于 `top` 这个包"这个信息。`from . import helper` 里的 `.` 不知道该指向谁，于是报错。

这是相对导入最常见的"坑"，后面原理章会详细拆解它的根因。这里先记住结论：**直接运行包内的子模块时，相对导入会失败**。

### 2.6 用 `python -m` 运行解决

解决上面这个报错的标准办法是：不要直接运行那个模块文件，而是让 Python 把它当作包内模块来执行——这需要用 `python -m` 启动。

`-m` 选项的作用是：把后面的名字当成模块来导入并执行，而不是当成文件路径来打开。这听上去只是换种调用方式，但它带来一个关键改变——被运行模块的 `__package__` 会被正确设置，相对导入就有参照系了。

还是上面那个 `top` 包，这次用 `-m` 在 `top/` 的**上一级目录**运行：

```bash
$ cd ..            # 回到 top/ 的上级目录
$ python -m top.main
```

这次不会有 `ImportError`，`run()` 正常返回。因为用 `-m top.main` 运行时：

- Python 先按包路径找到 `top`，执行 `top/__init__.py`，确认它是一个包。
- 再在 `top` 包内找到 `main` 模块，执行它。
- 此时 `main.py` 的 `__package__` 被设成 `"top"`，`from . import helper` 里的 `.` 就明确指向 `top`，`helper` 就是 `top.helper`，导入成功。

下面用一个带输出的完整例子走一遍。文件结构：

```
shop/
├── __init__.py
├── catalog.py
└── pricing/
    ├── __init__.py
    └── discount.py
```

```python
# shop/catalog.py
items = {"apple": 3, "banana": 2}

def list_items():
    return [f"{name}: ${price}" for name, price in items.items()]
```

```python
# shop/pricing/discount.py
from .. import catalog        # 子包模块引用父包模块

def discounted(name, rate=0.1):
    price = catalog.items[name]
    return round(price * (1 - rate), 2)
```

`shop/pricing/discount.py` 里有一行相对导入 `from .. import catalog`。

先尝试直接运行 `discount.py`（失败演示）：

```bash
$ cd shop/pricing/
$ python discount.py
# 报错：ImportError: attempted relative import with no known parent package
```

改用 `-m` 运行（成功）。在 `shop/` 的上级目录写一个启动脚本，或直接命令行：

```bash
$ cd /path/to/parent_of_shop
$ python -c "from shop.pricing import discount; print(discount.discounted('apple'))"
# 输出：2.7
```

或者写一个 `run.py` 放在 `shop/` 的同级位置，用绝对导入来启动：

```python
# run.py（与 shop/ 同级）
from shop.pricing import discount

print(discount.discounted("apple"))
print(discount.discounted("banana", rate=0.5))
# 输出：
# 2.7
# 1.0
```

`run.py` 自己在包外，用绝对导入没问题。它触发 `shop.pricing.discount` 模块的加载，这时 `discount.py` 的 `__package__` 是 `"shop.pricing"`，`from .. import catalog` 的 `..` 解析到 `shop`，`catalog` 就是 `shop.catalog`，顺理成章。

**直接运行 vs `-m` 运行的区别总结**

| 运行方式 | `__name__` | `__package__` | 相对导入 |
|---------|-----------|--------------|---------|
| `python top/main.py` | `"__main__"` | `None` | 失败 |
| `python -m top.main` | `"__main__"`（仍是 main，但 package 已设） | `"top"` | 成功 |
| 被其他模块 `import` 进来 | `"top.main"` | `"top"` | 成功 |

`-m` 的本质是"先把包路径补全，再当 `__main__` 跑"。它让被运行的模块既保留"程序入口"的身份（`__name__ == "__main__"`），又拥有"包内成员"的上下文（`__package__` 非空）。这是用相对导入的包做命令行工具时的标准启动方式。

### 2.7 相对导入只能用在包内：边界澄清

有一种常见误解：把相对导入当成"当前目录的快捷写法"。比如在一个随便的 `.py` 文件里写 `from . import util` 期望导入同目录下的 `util.py`——这是不对的。相对导入只在包结构里有效，靠的是 `__package__` 这个属性，而不是文件系统当前目录。

验证一下：准备一个**不是包**的目录（没有 `__init__.py`），里面两个普通脚本：

```
plain/
├── main.py
└── util.py
```

```python
# plain/util.py
def hi():
    return "hi"
```

```python
# plain/main.py
from . import util        # 错！这里没有包，plain 不是包

print(util.hi())
```

`plain/` 没有 `__init__.py`，不是一个包。运行 `python main.py`（不管在 `plain/` 里还是外面）都会报 `attempted relative import with no known parent package`。想引用同目录的 `util.py`，要么用绝对导入（把 `plain` 加到 `sys.path` 后 `import util`），要么干脆把 `plain/` 改造成一个包（加 `__init__.py`）再用相对导入。

另一个边界情况：包的 `__init__.py` 里能不能用相对导入？可以。`__init__.py` 自己就属于这个包，它的 `__package__` 就是当前包名，`from . import sub` 在 `__init__.py` 里表示"在包初始化时把子模块 `sub` 拉进来"——这是包对外暴露子模块的常见手法。

```python
# mypkg/__init__.py
from . import core          # 让 from mypkg import core 直接可用
from .api import get        # 把子包里的 get 提升到包顶层
```

这样外部使用者 `from mypkg import core, get` 就能拿到，而不用深入 `mypkg.core`、`mypkg.api`。`__init__.py` 里的相对导入完全合法，因为它自身在包内、有明确的 `__package__`。

### 2.8 用相对导入组织包的对外 API

一个设计良好的包，通常会把内部模块拆得细碎（便于维护），但对外只暴露少数几个名字。相对导入是组织"对外 API"的常用工具：在 `__init__.py` 里把内部子模块的名字用相对导入拉到包顶层，外部使用者就能拿到一个干净的导入入口。

典型结构：

```
mailer/
├── __init__.py
├── client.py        # 真正的 SMTP 客户端实现
├── message.py       # 邮件正文构造
└── transport.py     # 底层传输
```

```python
# mailer/client.py
class MailClient:
    def __init__(self, host):
        self.host = host

    def send(self, to, body):
        return f"sent to {to} via {self.host}: {body}"
```

```python
# mailer/__init__.py
from .client import MailClient        # 把内部类提升到包顶层
from .message import Message

__all__ = ["MailClient", "Message"]    # 声明对外 API
```

外部使用者只需要写一行：

```python
# 外部脚本
from mailer import MailClient

c = MailClient("smtp.example.com")
print(c.send("alice@example.com", "hello"))
# 输出：sent to alice@example.com via smtp.example.com: hello
```

这里外部用的是绝对导入 `from mailer import MailClient`，而 `__init__.py` 内部用相对导入 `from .client import MailClient` 把内部组织起来。两层职责分明：包内用相对导入做内部装配，包外用绝对导入拿现成的名字。这种"内部相对、外部绝对"的搭配是工业级包最常见的结构。

### 2.9 相对导入与循环导入

包内模块互相引用时，循环导入是个高频问题。相对导入本身不会"制造"循环导入，但因为它让包内互引变得太方便，循环依赖更容易在不经意间写出来。

看一个循环的场景：

```
acct/
├── __init__.py
├── user.py           # 引用了 order
└── order.py          # 引用了 user
```

```python
# acct/user.py
from . import order        # user 依赖 order

class User:
    def __init__(self, name):
        self.name = name

    def latest_order(self):
        return order.Order(self.name, 100)
```

```python
# acct/order.py
from . import user         # order 又依赖 user —— 循环！

class Order:
    def __init__(self, buyer, amount):
        self.buyer = buyer
        self.amount = amount
```

执行 `from acct import user` 时，Python 先开始加载 `user`，遇到 `from . import order` 就转去加载 `order`；`order` 里的 `from . import user` 又要找 `user`，但 `user` 还没加载完（只加载到第 1 行），于是 `order` 拿到的 `user` 是一个部分初始化的模块对象，若在 import 时立刻用到 `user.User` 就会报 `ImportError: cannot import name 'User'`。

解决思路不是避开相对导入，而是调整依赖方向。把互相依赖中的一边改成"延迟引用"——在函数内部才 import，而不是在模块顶层：

```python
# acct/order.py（修改后）
class Order:
    def __init__(self, buyer, amount):
        self.buyer = buyer
        self.amount = amount

    def buyer_obj(self):
        from . import user         # 延迟到调用时才引用，打破循环
        return user.User(self.buyer)
```

```python
# acct/user.py（保持不变）
from . import order

class User:
    def __init__(self, name):
        self.name = name

    def latest_order(self):
        return order.Order(self.name, 100)
```

```python
# 运行验证
# run.py（与 acct/ 同级）
from acct import user
u = user.User("alice")
o = u.latest_order()
print(o.buyer, o.amount)
# 输出：alice 100
```

延迟导入的代价是每次调用都要走一次导入查找（Python 有缓存，后续调用很快），但能干净地打破循环。相对导入在延迟导入里同样可用——只要那个模块本身是被正常导入进来的（`__package__` 有值），函数体里的 `from . import X` 就是合法的。

---

## 3. 最佳实践

### 3.1 包内部统一用相对导入，对外用绝对导入

一个包内部模块互相引用，优先用相对导入，让包具备"可整体搬迁"的能力。而包对外暴露的 API（`__init__.py` 的导出、对外文档里的示例）用绝对导入，给使用者明确的路径。这样包内改造不影响自己，包外使用者也不受包内重构影响。

推荐写法：

```python
# webapp/api/users.py（包内部）
from .. import config          # 相对：父包模块
from ..db import get_conn      # 相对：父包子模块
from . import schemas          # 相对：兄弟模块
```

不推荐写法（同一份包内部代码用绝对路径）：

```python
# webapp/api/users.py
from webapp import config
from webapp.db import get_conn
from webapp.api import schemas
```

不推荐的原因：一旦 `webapp` 改名或被移到 `src/webapp`，这三行都得改；而相对导入版一行都不用动。

### 3.2 点数不要超过两个

`from .. import X` 是可读的，`from ... import X` 已经勉强，`from .... import X` 就基本不能读了——读者得在脑子里画四层包结构才能搞懂指向谁，还极易写错。如果发现包内某个模块需要写三个以上的点才能引用到目标，通常说明包的层次太深，应该考虑：

- 把深层子包上提，减少嵌套。
- 在中间包的 `__init__.py` 里做一次转发，把这个深层模块的名字暴露到上一层，让远处引用时不必穿那么多层。
- 实在要跨多层，改用绝对导入（写全路径反而更清楚）。

```python
# 不推荐：点太多，几乎不可读
from ....deep.inner import helper

# 推荐：要么提包，要么用绝对导入
from mypkg.deep.inner import helper
```

### 3.3 命令行入口用 `-m`，别用相对导入写顶层脚本

如果你的包既是一个库（被别人 import），又自带命令行入口，把入口放在包内的 `__main__.py`，用 `python -m mypkg` 启动。

```
mypkg/
├── __init__.py
├── core.py
└── __main__.py       # 命令行入口
```

```python
# mypkg/__main__.py
from . import core        # 相对导入，用 -m 运行时合法

if __name__ == "__main__":
    core.run()
```

运行方式：

```bash
$ python -m mypkg
```

`-m mypkg` 会执行 `mypkg/__main__.py`，这个模块在包内、`__package__` 为 `"mypkg"`，相对导入正常。这是给包加命令行入口的标准做法，比在包外写一个 `run.py` 里做相对导入优雅得多。

如果直接 `python mypkg/__main__.py`，同样会报 "no known parent package"——和直接运行任何包内子模块一个道理。

### 3.4 避免在包内混用相对与绝对导入

一个包内部最好风格统一：要么全相对、要么全绝对，别一半一半。混用的坏处是阅读时要不停切换思维——看到 `from . import X` 要想"当前包是哪个"，看到 `from mypkg import Y` 又要想"我的包叫 mypkg"，徒增负担。更糟的是，混用容易埋下 bug：万一某次重构只改了绝对路径、漏改了相对路径，或反过来，行为就会不一致。

推荐配置：

```python
# 包内所有文件统一相对导入
from . import utils
from .. import config
```

或者：

```python
# 包内所有文件统一绝对导入
from mypkg import utils
from mypkg.config import config
```

二选一，全包一致。

### 3.5 相对导入只写一条 `.`，别和文件系统 `./` 混淆

初学者常把 `from . import util` 理解成"导入当前目录下的 util"，这是按文件系统路径在想 `./util`。正确理解是"导入当前包里的 util 模块"——参照系是包层级，不是文件系统目录。两者在很多情况下重合（当前目录恰好是当前包），但在深层子包、或者当工作目录和包根不一致时就会分叉。保持"点 = 包层级"的认知，能避免很多困惑。

### 3.6 在 `__init__.py` 中谨慎做相对导入

`__init__.py` 里做相对导入是合法且常见的，但要注意循环导入的风险。`from . import sub` 会触发 `sub` 模块的加载，如果 `sub` 内部又反过来相对导入 `__init__.py` 里还没定义完的名字，就会踩到循环导入。

推荐写法：

```python
# mypkg/__init__.py
from .core import main_func      # core 不反向依赖 __init__，安全
```

不推荐写法：

```python
# mypkg/__init__.py
from .core import main_func
# 而 core.py 里有：from . import main_func（反向依赖 __init__）→ 循环导入
```

遇到循环导入的征兆（导入时 `ImportError: cannot import name 'X'` 或部分初始化），优先重构依赖方向，让低层模块不依赖高层，而不是靠延迟导入绕过。

### 3.7 测试时如何运行含相对导入的模块

编写测试时，如果测试文件本身要放在包内（比如 `mypkg/tests/test_core.py`），它同样是包内模块，可以用相对导入引用被测代码。但测试通常由 `pytest`、`unittest` 等工具拉起，直接 `python mypkg/tests/test_core.py` 一样会报 "no known parent package"。

推荐做法是让测试工具按模块路径去发现测试，而不是把测试文件当脚本跑：

```bash
# 推荐：让 pytest 按包导入来发现测试
$ pytest mypkg/tests/test_core.py

# 推荐：用 -m 运行 unittest
$ python -m unittest mypkg.tests.test_core

# 不推荐：直接当脚本跑（相对导入会失败）
$ python mypkg/tests/test_core.py
```

`pytest` 调用 `importlib` 按模块路径加载测试文件，走的是导入流程，`__package__` 会被设为 `mypkg.tests`，测试文件里的 `from .. import core` 就能解析到 `mypkg.core`。

配合 `conftest.py` 和合理的包结构，测试代码与被测包属于同一包层次，相对导入顺理成章：

```
mypkg/
├── __init__.py
├── core.py
└── tests/
    ├── __init__.py
    ├── conftest.py
    └── test_core.py
```

```python
# mypkg/tests/test_core.py
from .. import core

def test_basic():
    assert core.process("x") == "X"
```

```python
# mypkg/core.py
def process(s):
    return s.upper()
```

在 `mypkg/` 上级目录运行 `pytest mypkg/tests/test_core.py`，测试就能跑通。如果直接 `python mypkg/tests/test_core.py`，还是那个老问题——`__package__` 为 `None`，相对导入失败。

### 3.8 给包加版本号常量时也用相对导入

很多包在 `__init__.py` 里定义 `__version__`，内部某些模块需要引用这个版本号（比如写日志、上报版本）。用相对导入从 `__init__.py` 取值是个常见模式：

```python
# mypkg/__init__.py
__version__ = "2.3.0"
```

```python
# mypkg/cli.py
from . import __version__     # 从当前包的 __init__ 命名空间取 __version__

def banner():
    return f"mypkg v{__version__}"
```

```python
# 运行
# run.py（与 mypkg/ 同级）
from mypkg import cli
print(cli.banner())
# 输出：mypkg v2.3.0
```

`from . import __version__` 看起来有点奇怪——`__version__` 不是模块啊。其实 `from . import X` 的 X 可以是包命名空间里的任何名字，包括 `__init__.py` 里定义的变量。这里 `.` 指向 `mypkg` 包，`__version__` 就是 `mypkg/__init__.py` 里那个字符串。

不过更推荐、更不易混淆的写法是 `from mypkg import __version__` 或直接在子模块里读 `importlib.metadata.version("mypkg")`——前者是绝对导入、更显式；后者利用 `pip` 安装时写入的元数据，连 `__init__.py` 都不用维护 `__version__`。相对导入这用法能用，但不是最佳。

---

## 4. 原理

这一章拆解相对导入在 Python 内部到底怎么工作的：它靠什么找到目标模块、点的数量怎么换算成包层级、为什么直接运行会失败、`-m` 又是怎么修好它的。

### 4.1 相对导入的两个参照属性：`__name__` 与 `__package__`

每个 Python 模块对象在被导入时都会带上两个元信息：`__name__` 和 `__package__`。相对导入能不能生效、点的 `.` 指向谁，完全由这两个属性决定。

- **`__name__`**：模块的"完全限定名"。比如 `mypkg/core.py` 被导入时，它的 `__name__` 是 `"mypkg.core"`——包名加分隔点和模块名。如果它是被直接运行的顶层脚本，则 `__name__` 是 `"__main__"`。
- **`__package__`**：模块所属的包名（字符串），或 `None`。`mypkg/core.py` 的 `__package__` 是 `"mypkg"`；`mypkg/sub/helper.py` 的 `__package__` 是 `"mypkg.sub"`。顶层脚本的 `__package__` 是 `None`。

二者的关系：对包内模块来说，`__package__` 就是 `__name__` 去掉最后一段模块名后剩下的前缀。`"mypkg.sub.helper"` → `__package__ = "mypkg.sub"`。`__init__.py` 是个特例——它的 `__name__` 就是包名本身（比如 `mypkg` 的 `__init__.py` 的 `__name__` 是 `"mypkg"`），而它的 `__package__` 也是 `"mypkg"`，二者相同。

相对导入解析时，Python 只看 `__package__`（Python 3 起以 `__package__` 为准，早期版本会退而用 `__name__` 推算）。`__package__` 为 `None` 或空字符串时，相对导入就失去参照系，直接报错。

验证：

```python
# mypkg/probe.py
print("name:", __name__)
print("package:", __package__)
```

运行 `python -m mypkg.probe`（在 `mypkg` 上级目录）：

```
name: __main__
package: mypkg
```

直接 `python mypkg/probe.py`：

```
name: __main__
package: None
```

同样一段代码、同样 `__name__` 都是 `"__main__"`，但 `__package__` 不同——`-m` 设了，直接运行没设。这就是相对导入一个失败、一个成功的根因。

### 4.2 点的解析：从 `__package__` 往上数层

有了 `__package__`，相对导入的解析过程可以这样描述：

1. 读取当前模块的 `__package__`，得到一个包名字符串（如 `"app.data.models"`）。
2. 把这个包名按 `.` 拆成一段一段的包层级：`["app", "data", "models"]`。
3. 根据导入语句里的点数 N，从当前包向上剥 N 层（即丢弃最后 N 段），得到"参照包名"。一个点 `.` = 向上 0 层 = 当前包本身（参照包 = `__package__`）；两个点 `..` = 向上 1 层 = 父包；三个点 `...` = 向上 2 层 = 祖父包。
4. 把导入语句里点之后的名字拼到参照包后面，得到目标模块的完全限定名，交给 Python 的导入系统去加载。

更精确地：`from .N import X` 中的 N 个点，对照"向上 N-1 层"。即：

- `.`（1 个点）→ 参照包 = `__package__`（向上 0 层）。
- `..`（2 个点）→ 参照包 = `__package__` 的父包（向上 1 层）。
- `...`（3 个点）→ 参照包 = `__package__` 的祖父包（向上 2 层）。

带入前面那个三层结构例子。`app/data/models/user.py` 的 `__package__` 是 `"app.data.models"`，分层 `["app", "data", "models"]`：

- `from . import user_fields`：1 个点，参照包 = `app.data.models`，目标 = `app.data.models.user_fields`。
- `from .. import loader`：2 个点，向上 1 层 → 剥掉 `"models"` → 参照包 = `app.data`，目标 = `app.data.loader`。
- `from ... import core`：3 个点，向上 2 层 → 剥掉 `"models"`、`"data"` → 参照包 = `app`，目标 = `app.core`。

目标完全限定名就是绝对导入里要写的全路径。相对导入本质上是"用当前包做锚点，生成绝对路径再交给导入系统"的一种语法糖。

一个点之后的复合路径（`from ..pkg import mod`）也是同理：算出参照包（如 `..` → `app`），再拼上 `pkg.mod` → 目标 = `app.pkg.mod`。

### 4.3 为什么直接运行子模块会失败

现在能精确解释 `python top/main.py` 报错的原因了。

Python 启动一个脚本时，分两种模式：

**文件模式**（`python top/main.py`）：解释器把 `top/main.py` 当成顶层脚本，不走"按包导入"的流程。它直接读文件、执行字节码，并把模块对象挂在 `sys.modules["__main__"]` 下。此时：

- `__name__` 被设成 `"__main__"`。
- `__package__` 被设成 `None`（没有包上下文）。
- 文件所在目录 `top/` 被加到 `sys.path[0]`，但包 `top` 本身没有被导入——`top/__init__.py` 没有被执行，`top` 不是一个"已存在的包模块"。

当 `main.py` 里执行 `from . import helper` 时，导入系统要解析 `.`，需要读当前模块的 `__package__`。可它现在是 `None`——没有参照系，算不出 `.` 指向哪个包，于是抛出：

```
ImportError: attempted relative import with no known parent package
```

"no known parent package"——不知道父包是谁。不是 `helper` 不存在，而是"当前模块属于哪个包"这件事 Python 根本没有记录。

**一个常见误会**：有人以为把工作目录设对、或把 `sys.path` 加上 `top` 的上级就能解决，其实不行。问题的根子不在路径，而在于"直接运行的脚本没有包身份"。`__package__` 是解释器在启动脚本时设定的，之后再改 `sys.path` 也改不动它（除非手动 hack `__package__`，但那不是推荐做法）。

### 4.4 `python -m` 如何修好相对导入

`python -m top.main` 的执行流程是这样的：

1. 解释器把 `top.main` 当成一个**模块名**而不是**文件路径**。
2. 按导入规则，先找 `top`——发现 `top/__init__.py`，确认它是一个包，执行 `__init__.py`，把包对象放进 `sys.modules["top"]`。
3. 在 `top` 包里找 `main` 子模块，加载 `top/main.py`，模块对象放进 `sys.modules["top.main"]`。
4. 把 `top.main` 的 `__package__` 设成 `"top"`（来自它所属的包），`__name__` 设成 `"__main__"`（因为它是被 `-m` 指定执行的入口模块）。
5. 执行 `top/main.py` 的字节码。

关键在第 4 步：因为走的是"导入路径"，`main.py` 的 `__package__` 被正确设为 `"top"`，不再是 `None`。随后 `from . import helper` 要解析 `.`，读 `__package__` 得到 `"top"`，目标完全限定名 = `top.helper`，Python 去 `top/` 下找 `helper.py`，找到，加载，成功。

所以 `-m` 做了两件关键的事：

- **先导入包**（执行 `top/__init__.py`），让包对象在 `sys.modules` 里就位。
- **给被运行的模块设置正确的 `__package__`**，让相对导入有参照系。

这两件事在文件模式下都没有发生，这就是两种运行方式的本质差异。`-m` 保留了"当作脚本执行"（`__name__ == "__main__"`）的语义，同时补上了"当作模块导入"的上下文，两边都得兼。

### 4.5 相对导入绑定的是真实模块名，不是文件位置

还有一点要说清：相对导入解析出来的目标，是包里的**真实模块名**（完全限定名），不是相对于当前文件的文件路径。这意味着：

- 相对导入的解析不会因当前工作目录改变而变。你在哪运行 `python -m top.main`，`top.main` 的 `__package__` 都是 `"top"`，`.` 都指 `top`。
- 相对导入若找不到目标模块（即包里确实没这个子模块），报的是 `ModuleNotFoundError: No module named 'top.helper'`，而不是文件找不到。它走的是标准的导入查找流程。
- 符号链接、ZIP 包里的包、被钩子改造过的导入路径，相对导入都按包名解析，和文件系统布局是否一致无关。

这进一步说明为什么相对导入不算"路径语法"——它是用包名空间来定位的，文件的物理位置只是导入系统查找的底层细节之一。

### 4.6 `__package__` 何时为空：边界情况小结

把 `__package__` 为空（或 `None`）的几种情况列全，便于排查：

1. **直接运行的顶层脚本**：`python foo.py`，foo 的 `__package__` 为 `None`。
2. **交互式 REPL**：在 `>>>` 提示符里 `from . import X` 也有同样错误，因为 REPL 没有当前模块、没有包上下文。
3. **`python -c "from . import X"`**：命令行同样没有包上下文。
4. **约定包但被当成普通脚本运行的模块**：比如包里某个子模块被 `os.system("python xxx.py")` 直接拉起来，同样进入文件模式，`__package__` 为 `None`。

只要确认了"被运行模块是否经过了导入流程"，就能判断相对导入是否可用。经过了导入（`-m`、被 import、被 `runpy` 按模块跑）→ `__package__` 有值 → 可用；直接当文件跑 → `__package__` 为 `None` → 不可用。

### 4.7 用代码验证解析过程

相对导入的解析规则可以用代码直接观察。下面这段脚本在自己的 `__package__` 已知时，模拟"点数 → 参照包"的换算，帮助把抽象规则落成具体步骤：

```python
# demo_resolve.py —— 模拟相对导入的目标解析（仅演示规则，非真实导入）
def resolve_relative(current_package: str, dots: int, target: str) -> str:
    """
    current_package: 当前模块的 __package__，如 "app.data.models"
    dots:            点的数量，1 表示当前包、2 表示父包……
    target:          点之后写的名字，如 "loader" 或 "pkg.mod"
    返回目标模块的完全限定名。
    """
    parts = current_package.split(".") if current_package else []
    up = dots - 1                       # N 个点 = 向上 N-1 层
    if up > len(parts):
        raise ValueError("点数超出包层级，无法向上回溯")
    base = parts[: len(parts) - up]     # 剥掉向上层
    if base:
        return ".".join(base) + "." + target
    else:
        return target                  # 回溯到顶层，目标就是绝对名

# 当前模块 __package__ = "app.data.models"
print(resolve_relative("app.data.models", 1, "user_fields"))
# 输出：app.data.models.user_fields

print(resolve_relative("app.data.models", 2, "loader"))
# 输出：app.data.loader

print(resolve_relative("app.data.models", 3, "core"))
# 输出：app.core

print(resolve_relative("app.data.models", 2, "sub.helper"))
# 输出：app.data.sub.helper

# 向上超出包层级
try:
    resolve_relative("app.data.models", 5, "x")
except ValueError as e:
    print(e)
# 输出：点数超出包层级，无法向上回溯
```

真实导入系统遇到点数超层时也会报错，错误信息类似 `ImportError: attempted relative import beyond top-level package`。意思是相对导入想往上回溯，但当前包已经是顶层、没有更上层的包了。理解了"点 = 向上回溯包层级"这条规则，这类报错就能一眼看懂。

### 4.8 相对导入与 importlib 的等价关系

Python 的导入系统在底层由 `importlib` 实现。相对导入最终也会被翻译成对 `importlib.import_module` 的调用。理解这种等价关系，能进一步确认"相对导入不过是绝对导入的语法糖"。

```python
# 相对导入
from .utils import format_date

# 在导入系统内部，它等价于（假设当前 __package__ 为 "mypkg"）：
# import_module("mypkg.utils")，再从结果里取 format_date
```

可以用 `importlib` 手工模拟相对导入的完整流程：

```python
# demo_importlib.py
import importlib

def relative_import(current_package: str, dots: int, target_module: str):
    parts = current_package.split(".") if current_package else []
    up = dots - 1
    base = parts[: len(parts) - up]
    full = ".".join(base + [target_module]) if base else target_module
    return importlib.import_module(full)

# 假设存在包 webapp，其 __package__ 信息如下
# 当前模块是 webapp.api.users，__package__ = "webapp.api"
mod = relative_import("webapp.api", 2, "config")
print(mod)
# 输出：<module 'webapp.config' from '.../webapp/config.py'>
```

这个手工版的 `relative_import` 做的事情，和 `from .. import config` 一模一样：拿到 `__package__`、按点数回溯、拼出完全限定名、调用 `importlib.import_module`。真实导入系统多了缓存查找、finder 调度、字节码缓存等步骤，但核心流程就是这个。

这也能解释为什么相对导入找不到目标时报的是 `ModuleNotFoundError: No module named '...'`——因为最终它就是用拼出来的完全限定名去走标准导入路径，找不到就是标准导入的"模块不存在"错误，和相对导入语法本身无关。

---

## 5. 总结

### 5.1 本文内容要点

- 相对导入用点号表达包层级：`.` 当前包、`..` 父包、`...` 祖父包，点数 = 向上越过的包层数。
- `from . import mod` 导入当前包里的模块/子包；`from .mod import X` 导入当前包某模块里的具体名字。
- 子包引用父包用 `from .. import X`，整包改名/迁移时包内引用不变，这是相对导入相对绝对导入的主要优势。
- 相对导入有硬性前提：当前模块的 `__package__` 非空（即当前模块属于某个包）。
- 直接运行包内子模块（`python pkg/mod.py`）时 `__package__` 为 `None`，相对导入报 "attempted relative import with no known parent package"。
- 解决办法是用 `python -m pkg.mod` 运行，`-m` 会先导入包、并设好被运行模块的 `__package__`，相对导入即可生效。
- 相对导入解析的本质是：用 `__package__` 做锚点、按点数向上回溯、拼出目标完全限定名，再交给标准导入系统查找。
- 包内部推荐统一用相对导入，对外 API 用绝对导入；点数不要超过两个；命令行入口放 `__main__.py` 配合 `python -m`。

### 5.2 读完应能掌握

- 能正确写出当前包、父包、祖父包三种层级的相对导入语句，不写错点数。
- 能说明 `from . import X` 与 `from .mod import X` 的区别并按场景选用。
- 能解释为什么直接 `python pkg/mod.py` 会报 "no known parent package"，并能用 `python -m pkg.mod` 修复。
- 能说清 `__package__`、`__name__` 在"直接运行"与"`-m` 运行"两种模式下分别是什么值，以及这对相对导入意味着什么。
- 能为包做命令行入口设计：把入口放进 `__main__.py`，用 `python -m mypkg` 启动。
- 能判断一个相对导入报错是"包名/层级写错"还是"没有包上下文"，并给出对应修法。