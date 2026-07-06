---
group:
  title: 【01】初识python
  order: 1
order: 12
title: 常量约定
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是常量

常量(constant)是程序运行过程中**值不可改变**的量。与变量(variable)相对——变量可以被重新赋值,常量一经定义就应保持不变。比如圆周率 `PI = 3.14159`、最大重试次数 `MAX_RETRY = 3`、状态码 `STATUS_OK = 200`,这些都是"一旦确定就不该再变"的值,适合用常量表达。

在 C/Java 等语言里,常量有专门的语法保障:`const int MAX = 10;` 或 `final int MAX = 10;`,语言层面禁止重新赋值,试图改常量会编译报错。这是"硬常量"——由语言机制强制不可变。

**Python 没有真正的常量语法**。这是关键认知。Python 里没有 `const` 关键字,所有"常量"本质上都是普通变量,语言层面**允许**重新赋值。Python 采用的是**约定**(convention)的方式:用全大写命名(`MAX_RETRY`)表示"这是常量,请勿修改",靠程序员自觉与社区共识来维护,而非语言强制。

这种"约定式常量"是 Python 的设计选择——Python 哲学 "we are all consenting adults"(大家都是成年人),信任程序员不乱改约定为常量的值,而不像某些语言用编译器强制。代价是没有编译期保护,误改常量不会报错(除非用额外机制,见 2.4 的 Final、2.6 的 Enum)。好处是简单灵活,无需专门语法。

所以理解 Python 常量,核心是理解"Python 无强制常量,靠约定 + 可选机制(Enum/Final/frozen)模拟"。本节既讲常量的命名约定,也讲如何用枚举、Final、frozen dataclass 等机制获得更强的"不可变"保障。

常量在实际开发中的作用:

- **消除魔法数**:代码里直接写 `if retry > 3` 的 3 是魔法数,改用 `if retry > MAX_RETRY` 清晰且易改。
- **集中配置**:超时、URL、阈值等配置集中在模块顶部常量,改一处全生效,不必散落各处。
- **表达不变语义**:PI、STATUS_OK 这类语义固定的值,用常量表达"它不该变"的意图。
- **可读性**:`MAX_RETRY` 比 `3` 易读;`STATUS_OK` 比 `200` 易懂。

### 1.2 Python 常量的约定形式

Python 常量的主流约定:**全大写 + 下划线分隔**,放在模块顶部:

```python
# config.py
MAX_RETRY = 3
DEFAULT_TIMEOUT = 30
PI = 3.14159
DATABASE_URL = "postgresql://localhost/mydb"
STATUS_OK = 200
STATUS_NOT_FOUND = 404
```

要点:

- **全大写**:`MAX_RETRY` 而非 `max_retry`(变量)或 `MaxRetry`(类)。
- **下划线分隔单词**:`DEFAULT_TIMEOUT`、`DATABASE_URL`。
- **模块顶部**:常量集中在模块开头(import 之后),便于查找与修改。
- **约定不改**:全大写是"别重新赋值我"的视觉信号,大家自觉遵守。

这套约定来自 PEP 8:"Constants are usually defined on a module level and written in all capital letters with underscores separating words."。虽无强制,但全 Python 社区一致遵守,是事实标准。

**类内常量**:类里的常量也全大写,作为类属性:

```python
class Circle:
    PI = 3.14159          # 类常量
    def area(self):
        return Circle.PI * self.r ** 2
```

**实例不常做常量**:常量通常是模块级或类级,不放在实例(`self.X`)上,因实例属性默认可变。

### 1.3 为什么需要常量(约定)

不用常量,代码会出现"魔法数/魔法字符串"漫天飞的问题:

```python
# 坏:魔法数
if retry_count > 3:
    ...
time.sleep(2)
if response.status == 200:
    ...
if user.role == "admin":
    ...
```

这里的 `3`、`2`、`200`、`"admin"` 都是裸值,读时要猜含义,改时要全项目找(可能改漏)。用常量后:

```python
# 好:常量
if retry_count > MAX_RETRY:
    ...
time.sleep(RETRY_INTERVAL)
if response.status == STATUS_OK:
    ...
if user.role == ROLE_ADMIN:
    ...
```

好处:

- **可读**:`MAX_RETRY`/`STATUS_OK`/`ROLE_ADMIN` 自解释,不用猜。
- **可维护**:改最大重试数只改 `MAX_RETRY` 一处,全项目生效。
- **防错**:裸 `200` 易打成 `2000`,常量名打错会 NameError 立即暴露,比静默错误强。
- **文档作用**:常量名本身就是 documentation,`ROLE_ADMIN` 比 `"admin"` 更明确。
- **类型检查辅助**:配合类型注解与 Final,静态检查能发现误改。

常量约定的价值不止"好读",更是提升可维护性与降低 bug 率的工程手段。把散落的裸值集中为命名常量,是代码质量的基础动作。

### 1.4 Python 常量的"不可变"层级

既然 Python 无强制常量,实际有不同强度的"不可变"方案,从弱到强:

| 方案 | 强度 | 机制 | 重新赋值 |
|------|------|------|----------|
| 全大写约定 | 最弱(纯约定) | 命名 + 自觉 | 允许,不报错 |
| `Final` 类型注解 | 弱(静态检查) | mypy/Ruff 检查 | 运行时允许,静态检查报错 |
| `Enum` 枚举 | 中 | 枚举成员只读 | 运行时禁止重新赋值枚举成员 |
| `frozen` dataclass | 中 | 冻结实例不可改属性 | 实例属性不可改 |
| tuple 等不可变容器 | 中 | 容器结构不可变 | 元素引用不可增删,元素本身若可变仍可改 |
| `namedtuple` | 中 | 不可变记录 | 字段不可改 |

**选择**:

- 普通常量(数值、字符串):全大写约定足够,可选加 `Final` 让 mypy 检查误改。
- 一组相关的常量(状态码、角色、颜色):用 `Enum`,语义清晰且运行时只读。
- 配置对象:用 `frozen dataclass` 或 `namedtuple`,属性不可改。
- 不变集合:用 `tuple`/`frozenset`。

本节第 2 章逐一讲解这些方案,第 4 章讲它们的原理(为何运行时仍可能被绕过、各机制的边界)。

---

## 2. 核心内容

本章详解常量的命名约定、模块级/类级常量、Final 注解、Enum 枚举、frozen dataclass/namedtuple、配置常量组织、常量与类型注解、常量模块设计,给出可落地的规范。

### 2.1 模块级常量

最基础的常量形式:模块顶部全大写赋值。

```python
"""数据库连接配置。"""

import os

# 常量集中在模块顶部
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost/app")
MAX_CONNECTIONS = 10
CONNECTION_TIMEOUT = 30       # 秒
RETRY_TIMES = 3
DEFAULT_PAGE_SIZE = 20
```

**约定**:

- 全大写、下划线分隔。
- 放 import 之后、其他代码之前。
- 一个常量一行,可附行内注释说明单位/含义(如 `# 秒`)。
- 相关常量可分组,组间空行:

```python
# === 数据库 ===
DATABASE_URL = "..."
MAX_CONNECTIONS = 10

# === HTTP ===
HTTP_TIMEOUT = 30
HTTP_RETRY = 3
```

**使用**:同模块内直接用名字,跨模块 `from config import DATABASE_URL` 或 `import config; config.DATABASE_URL`。

**为何集中在模块顶部**:便于查找(都在开头)、便于修改(改一处)、明确"这些是配置,运行不变"。散落在函数内的裸值难管理,提为顶部常量是规范动作。

### 2.2 类级常量

类内常量作为类属性,全大写,与该类相关的不变值:

```python
class Circle:
    PI = 3.14159              # 类常量

    def __init__(self, radius):
        self.radius = radius

    def area(self):
        return Circle.PI * self.radius ** 2

print(Circle.PI)              # 3.14159,通过类访问
```

**访问**:`Circle.PI`(类访问)或 `self.PI`(实例访问,但约定用类访问以表常量)。类常量属于类,所有实例共享同一份。

**类常量 vs 实例属性**:类常量(全大写、不变)放类体;实例属性(可变、每实例不同)放 `__init__`。别混淆:

```python
class User:
    ROLE_ADMIN = "admin"      # 类常量,所有 User 共享,不变

    def __init__(self, name):
        self.name = name      # 实例属性,每实例不同,可变
```

**类常量适合**:与类语义相关的不变值,如 `Circle.PI`、`User.ROLE_ADMIN`、`Color.RED`。它让常量"挂在"相关类上,比散在模块更有组织。

### 2.3 常量与类型注解:Final

`Final`(typing,Python 3.8+)给常量加静态保护:声明"此名字不应重新赋值",mypy/Ruff 静态检查会报误改:

```python
from typing import Final

MAX_RETRY: Final[int] = 3
DEFAULT_TIMEOUT: Final[int] = 30
APP_NAME: Final[str] = "MyApp"

MAX_RETRY = 5     # mypy/Ruff 报错:Cannot assign to final name "MAX_RETRY"
```

**机制**:`Final` 是类型注解,告诉静态检查器"这个名字是 final,不可重新赋值"。**运行时 Python 仍允许改**(无强制),但 mypy/Ruff 在检查阶段会报错,CI 拦截误改。

**用法**:`名字: Final[类型] = 值`,或 `名字: Final = 值`(类型可推断省略)。

**类内 Final**:

```python
class Config:
    URL: Final[str] = "http://example.com"
    PORT: Final[int] = 8080
```

**Final 的价值**:把"常量约定"从纯自觉升级为"静态检查可保证"。配合 mypy/Ruff 在 CI 跑,误改常量会在构建阶段暴露,而不是等运行时悄悄出错。这是 Python 里最接近"编译期常量保护"的方案(虽仍是静态检查,非运行时强制)。

**Final 的局限**:只防"重新赋值",不防"对可变常量的就地修改"(如常量是 list,`FINAL_LIST.append(x)` Final 管不到)。要防就地改,用 tuple/frozenset 等不可变容器(2.7)。

### 2.4 用 Enum 表达一组相关常量

当常量是一组相关的命名值(状态码、角色、颜色、选项),用 `Enum` 比裸常量更优:

```python
from enum import Enum

class Status(Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SUCCESS = "success"
    FAILED = "failed"

class Role(Enum):
    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"

# 使用
order_status = Status.PENDING
if order_status == Status.SUCCESS:
    ...
if user.role == Role.ADMIN:
    ...
```

**Enum 的优势**:

- **分组明确**:`Status.PENDING`/`Status.SUCCESS` 同属 Status,比散落的 `STATUS_PENDING`/`STATUS_SUCCESS` 更有组织。
- **运行时只读**:Enum 成员不可重新赋值(`Status.PENDING = "x"` 报错),比纯约定强。
- **防非法值**:函数参数类型注解为 `Status`,mypy 能拦截传入非 Status 值。
- **可迭代**:`for s in Status:` 遍历所有状态;`Status["PENDING"]` 按名取;`Status("success")` 按值取。
- **可读**:`Status.SUCCESS` 比 `"success"` 或 `200` 自解释。

**Enum 的值类型**:`Enum` 成员值可任意;`IntEnum`/`StrEnum` 让成员可当 int/str 用(可与数字/字符串直接比较,3.11+ 有 StrEnum)。`auto()` 自动赋值:

```python
from enum import Enum, auto

class Color(Enum):
    RED = auto()       # 自动 1, 2, 3
    GREEN = auto()
    BLUE = auto()
```

**何时用 Enum**:一组有限、相关、命名的取值(状态、角色、类型、选项),用 Enum;单个独立常量(如 PI)用全大写变量。Enum 是表达"枚举常量集"的最佳方式。

### 2.5 frozen dataclass 与 namedtuple:不可变记录

当常量是**结构化配置对象**(多个字段的不可变组合),用 `frozen dataclass` 或 `namedtuple`:

**frozen dataclass**(Python 3.7+):

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class DbConfig:
    url: str
    max_connections: int = 10
    timeout: int = 30

DB = DbConfig(url="postgresql://localhost/app", max_connections=20)
print(DB.url)            # 访问字段
# DB.url = "x"          # FrozenInstanceError!frozen 禁止改属性
```

`frozen=True` 让 dataclass 实例不可变,改属性抛 `FrozenInstanceError`。适合"一组配置常量"作为不可变对象。

**namedtuple**(更老,轻量):

```python
from collections import namedtuple

DbConfig = namedtuple("DbConfig", ["url", "max_connections", "timeout"])
DB = DbConfig(url="...", max_connections=20, timeout=30)
# DB.url = "x"          # AttributeError,namedtuple 不可变
```

namedtuple 也是不可变记录,但无类型注解、无默认值方法等 dataclass 的现代特性。新项目优先 frozen dataclass。

**何时用**:配置对象(数据库配置、HTTP 配置)用 frozen dataclass 表达"一组不可变配置",比散落常量更有结构、比可变对象更安全。

### 2.6 不可变容器:tuple 与 frozenset

常量若是集合,用不可变容器 `tuple`/`frozenset` 而非可变的 `list`/`set`:

```python
# 好:tuple 不可变
SUPPORTED_LANGUAGES = ("zh", "en", "ja")
ALLOWED_ORIGINS = frozenset({"https://a.com", "https://b.com"})

# 坏:list 可变,常量可能被 append
SUPPORTED_LANGUAGES = ["zh", "en", "ja"]
SUPPORTED_LANGUAGES.append("ko")   # 不报错,常量被改了!
```

**tuple vs list**:tuple 不可变(不能增删元素),list 可变。常量集合用 tuple,防止误 append/修改。

**frozenset vs set**:frozenset 不可变 set,可哈希(能做 dict 键);set 可变。常量集合用 frozenset。

**注意元素可变性**:tuple 本身不可变(结构),但若元素是可变对象,元素内容仍可改:

```python
DATA = ([1, 2], [3, 4])     # tuple 含 list
DATA[0].append(99)          # 合法!改的是 tuple 内的 list 元素
print(DATA)                 # ([1, 2, 99], [3, 4])
```

要真正不可变,元素也需不可变(全部用 tuple/int/str)。这是不可变性的层级:容器不可变≠元素不可变,深层不可变要递归用不可变类型。

### 2.7 配置常量的组织

项目常量多了需要组织。常见模式:

**单配置模块**:`config.py` 集中所有常量,其他模块 `from config import X`:

```python
# config.py
DATABASE_URL = "..."
MAX_RETRY = 3
...

# app.py
from config import DATABASE_URL, MAX_RETRY
```

适合小项目。但大项目常量全堆一个文件会臃肿。

**分领域配置**:`config/db.py`、`config/http.py`、`config/app.py`,按领域分文件:

```python
# config/db.py
URL = "..."
MAX_CONNECTIONS = 10

# config/http.py
TIMEOUT = 30
RETRY = 3
```

按领域分,清晰且可维护。

**环境变量驱动**:常量从环境变量读,适应多环境(开发/生产):

```python
import os
DATABASE_URL = os.getenv("DATABASE_URL", "default")
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
```

环境变量让同一份代码在不同环境用不同配置,是部署的标准做法。配合 `.env` 文件与 `python-dotenv` 加载。

**常量与配置文件**:复杂配置用 YAML/TOML/JSON 文件,程序读取为常量对象(dict/dataclass)。配置与代码分离,改配置不改代码。

组织常量的原则:**小项目单 config 模块,大项目按领域分,环境差异用环境变量/配置文件**。常量集中管理、环境外置,是可维护配置的基础。

### 2.8 常量与类型注解协作

常量配合类型注解,提升可读性与静态检查:

```python
from typing import Final

MAX_RETRY: Final[int] = 3
DEFAULT_TIMEOUT: Final[float] = 30.0
APP_NAME: Final[str] = "MyApp"
SUPPORTED_FORMATS: Final[tuple[str, ...]] = ("csv", "json", "xml")
```

**收益**:

- 类型注解让常量类型明确,读者一眼知 `MAX_RETRY` 是 int。
- `Final` 让静态检查保证不被重新赋值。
- 容器常量注解为不可变类型(`tuple[str, ...]` 而非 `list[str]`),表达"不可变集合"意图,mypy 也会阻止 append 等修改尝试。

**推导与显式**:简单常量类型可推断省略(`MAX_RETRY: Final = 3`),复杂或需明确用显式注解。团队统一风格即可。

类型注解 + Final + 不可变容器类型,三者协作把"常量约定"从纯命名升级为静态类型系统可保证的契约,是现代 Python 常量的最佳实践。

### 2.9 常量文档与命名

常量命名与文档:

**命名**:全大写下划线,表意准确:

```python
# 好
MAX_RETRY = 3
DEFAULT_TIMEOUT_SECONDS = 30      # 带单位更清晰
HTTP_STATUS_OK = 200

# 坏
MAX = 3                           # 过于泛
TIMEOUT = 30                      # 不知秒/毫秒
X = 200                           # 含义不明
```

带单位的常量名加单位(`TIMEOUT_SECONDS`/`DELAY_MS`),避免单位歧义(秒还是毫秒是经典坑)。

**文档**:常量密集或含义不直观时,加注释或 docstring:

```python
# 最大重试次数,超过即放弃并抛错
MAX_RETRY = 3

# 心跳间隔(秒),服务端据此判断客户端是否存活
HEARTBEAT_INTERVAL = 15
```

模块级常量可在模块 docstring 说明,枚举可在每个成员加注释:

```python
class Status(Enum):
    PENDING = "pending"        # 已创建,待处理
    PROCESSING = "processing"  # 处理中
    SUCCESS = "success"        # 成功
    FAILED = "failed"          # 失败,含 error 字段
```

常量文档让"为何是这个值""单位是什么""取值含义"清晰,减少后续维护的猜测。

### 2.10 完整示例:规范的常量模块

一个体现各项规范的配置模块:

```python
"""应用配置常量。"""

import os
from dataclasses import dataclass
from enum import Enum
from typing import Final

# === 应用 ===
APP_NAME: Final[str] = "MyApp"
APP_VERSION: Final[str] = "1.0.0"
DEBUG: Final[bool] = os.getenv("DEBUG", "false").lower() == "true"

# === 数据库 ===
DATABASE_URL: Final[str] = os.getenv("DATABASE_URL", "postgresql://localhost/app")
MAX_CONNECTIONS: Final[int] = 10
CONNECTION_TIMEOUT: Final[int] = 30  # 秒


@dataclass(frozen=True)
class HttpConfig:
    """HTTP 客户端不可变配置。"""
    timeout: int = 30          # 秒
    retry: int = 3
    user_agent: str = "MyApp/1.0"


HTTP: Final[HttpConfig] = HttpConfig()


class Status(Enum):
    """订单状态枚举。"""
    PENDING = "pending"
    PROCESSING = "processing"
    SUCCESS = "success"
    FAILED = "failed"


# === 不可变集合 ===
SUPPORTED_LANGUAGES: Final[tuple[str, ...]] = ("zh", "en", "ja")
ALLOWED_ORIGINS: Final[frozenset[str]] = frozenset({"https://a.com", "https://b.com"})
```

此示例体现:模块 docstring、Final 类型注解、分组注释、frozen dataclass 配置、Enum 枚举、不可变容器(tuple/frozenset)、环境变量驱动、带单位注释。是常量约定的范本。

### 2.11 魔法数消除实战

把魔法数逐步替换为常量,是提升可读性的标准动作。看一个对比:

```python
# 重构前:魔法数/字符串漫天飞
def process_order(order):
    if order["status"] == 1:           # 1 是什么?
        time.sleep(2)                  # 2 秒?2 分钟?
        if order["amount"] > 10000:
            order["priority"] = "high"  # "high" 散落多处
    if order["retry"] > 3:
        raise Exception("failed")
    return order

def get_users(page):
    return db.query("SELECT * FROM users LIMIT 20 OFFSET ?", (page * 20,))  # 20 是啥?
```

```python
# 重构后:常量化,自解释
STATUS_PENDING = 1
PRIORITY_HIGH = "high"
PROCESS_DELAY_SECONDS = 2
LARGE_ORDER_THRESHOLD = 10000
MAX_RETRY = 3
PAGE_SIZE = 20

def process_order(order):
    if order["status"] == STATUS_PENDING:
        time.sleep(PROCESS_DELAY_SECONDS)
        if order["amount"] > LARGE_ORDER_THRESHOLD:
            order["priority"] = PRIORITY_HIGH
    if order["retry"] > MAX_RETRY:
        raise Exception("failed")
    return order

def get_users(page):
    return db.query("SELECT * FROM users LIMIT ? OFFSET ?", (PAGE_SIZE, page * PAGE_SIZE))
```

重构后每处值的含义一目了然,改阈值只改常量定义一处。这种"魔法数 → 命名常量"的提取是代码质量的基础重构,几乎每个项目都该做一遍。注意常量名要准确表意(`LARGE_ORDER_THRESHOLD` 而非 `THRESHOLD`),否则换汤不换药。

### 2.12 常量与函数默认参数

常量常用作函数默认参数值,但需注意可变常量的陷阱:

**不可变常量作默认参数(安全)**:

```python
DEFAULT_TIMEOUT = 30

def fetch(url, timeout=DEFAULT_TIMEOUT):   # 不可变,安全
    ...
```

int 不可变,作默认参数安全——每次调用都用同一 30,不会累积。

**可变常量作默认参数(陷阱)**:与变量赋值机制里的默认参数陷阱同理,可变常量作默认参数会在多次调用间共享累积:

```python
DEFAULT_TAGS = []          # 可变常量(本身就不该用 list 当常量,见 2.6)

def create_user(name, tags=DEFAULT_TAGS):  # 陷阱!所有调用共享同一 list
    tags.append("new")
    return {"name": name, "tags": tags}

create_user("a")   # {'name': 'a', 'tags': ['new']}
create_user("b")   # {'name': 'b', 'tags': ['new', 'new']}  —— 累积了!
```

修复一:常量用不可变容器 `DEFAULT_TAGS = ()`(tuple),但 `tags.append` 就不适用了。
修复二:用 `None` 哨兵,函数内创建:

```python
def create_user(name, tags=None):
    if tags is None:
        tags = []
    tags.append("new")
    return {"name": name, "tags": tags}
```

**规则**:可变对象(即使是常量)绝不做函数默认参数。常量集合用 tuple/frozenset(既不可变又可作安全默认参数),或用 None 哨兵。这条与《变量赋值机制》的默认参数陷阱一脉相承,常量语境下同样适用。

### 2.13 常量的反模式

汇总常见坏常量用法:

- **可变常量**:`SUPPORTED = ["zh","en"]` 用 list 当常量,易被误改。该用 tuple。
- **散落裸值**:该提常量的地方直接写 3/200/"admin",魔法数残留。
- **常量命名含糊**:`MAX = 3`(什么的 max)、`DATA = ...`(什么 data)。
- **常量不带单位**:`TIMEOUT = 30` 不知秒/毫秒。该 `TIMEOUT_SECONDS`。
- **运行时计算的"常量"**:常量本应编译期/启动期确定,若 `BASE = compute()` 每次不同,它不是常量,是变量。
- **常量值可变对象**:`CONFIG = {"x": [1]}` 内层 list 可改,所谓"常量"可被改内容。
- **过度常量化**:把只在一处用、含义明显的值(如 `range(10)` 的 10)也提常量,反而绕。
- **常量散落多处**:同值常量在多文件重复定义,改时易遗漏。该集中。

识别反模式,常量才能真正发挥可读可维护作用,而非成为新的混乱源。

### 2.14 跨模块常量共享与循环导入

常量常需多模块共享,但放在哪个模块、如何避免循环导入是工程问题:

**集中 config 模块,被各模块 import**(推荐):

```python
# config.py
MAX_RETRY = 3

# service.py
from config import MAX_RETRY    # 单向依赖,无循环
```

`config.py` 不 import 业务模块,业务模块 import config,单向依赖,无循环导入风险。这是最稳妥的常量共享方式。

**避免常量模块反向依赖业务**:若 config.py 里 `import service`(为了某常量),而 service.py 又 `from config import X`,就循环导入。保持 config 模块**只被依赖、不依赖业务**,常量定义自包含。

**分领域 config 同理**:`config/db.py` 不 import 业务,业务 import 它。配置模块永远是依赖图的"叶子",不被反向依赖。

**大值常量与延迟**:若常量需要复杂计算才得到(如加载大字典),可放函数延迟计算或用 lru_cache,避免模块导入即重算。但纯常量应简单,避免在常量模块做重逻辑。

### 2.15 常量在测试中的处理

测试时常需覆盖常量(如把 `MAX_RETRY` 改小加速测试、改 `DATABASE_URL` 指向测试库)。Python 常量可改(无强制),这反而是测试的便利:

```python
import config
from mymodule import retry_function

def test_retry(monkeypatch):
    monkeypatch.setattr(config, "MAX_RETRY", 1)   # 测试时改小
    retry_function()   # 用改后的常量行为
```

`monkeypatch.setattr` 在测试期间改常量,测试后自动还原。这在有强制常量的语言里难做(常量不可改),Python 的"约定式常量"反而利于测试——能临时 monkeypatch。这是 Python 无强制常量的一个意外好处。

**但生产代码勿依赖可改常量**:测试用 monkeypatch 改常量 OK,但别在生产代码里改常量(破坏约定)。常量在生产中应保持不变,可改仅是测试便利,别滥用。

### 2.16 常量的演进与版本化

常量会随项目演进变化(阈值调整、新增状态、URL 变更),如何管理:

- **集中管理易演进**:常量集中在 config,改一处全生效,演进方便。散落多处则改时易遗漏。
- **常量与配置分离**:真正"运行不变"的常量(如 PI、状态码)硬编码在代码;会随环境/部署变的(URL、阈值)用环境变量/配置文件外置,改配置不重发布代码。
- **版本化**:常量相关联的一组(如 API 版本常量)可加版本注释,便于追踪何时为何改。
- **废弃常量缓删**:某常量不再用,先标 `# DEPRECATED` 注释一段时间(过渡),确认无引用再删,避免突然删导致依赖方报错。
- **常量变更需测试**:改常量(尤其阈值、状态)可能影响逻辑,改后跑测试验证,别盲目改。

常量演进是长期维护的一部分,集中管理 + 配置外置 + 谨慎变更,让常量随项目健康发展而不成为债。

---

## 3. 最佳实践

### 3.1 常量全大写、模块顶部、集中管理

常量全大写下划线,放模块顶部,集中在配置模块/类。便于查找修改,符合 PEP 8 与社区共识。散落函数内的裸值提为顶部常量。

### 3.2 用 Final 加静态保护

`名字: Final[类型] = 值` 让 mypy/Ruff 检查误改,把约定升级为静态保证。配合 CI 跑 mypy/Ruff,误改常量构建期暴露。

### 3.3 一组相关常量用 Enum

状态码、角色、颜色等有限命名取值集,用 `Enum` 而非散落全大写常量。Enum 分组明确、运行时只读、可迭代、防非法值,是枚举常量最佳方式。

### 3.4 配置对象用 frozen dataclass

结构化配置(多字段不可变组合)用 `@dataclass(frozen=True)`,不可改属性,比散落常量有结构、比可变对象安全。新项目优先 dataclass 而非 namedtuple。

### 3.5 集合常量用 tuple/frozenset

常量集合用 `tuple`/`frozenset` 而非 `list`/`set`,防止误 append/修改,且可哈希(能做 dict 键)。注意元素可变性,深层不可变递归用不可变类型。

### 3.6 常量带单位与注释

数值常量带单位(`TIMEOUT_SECONDS`/`DELAY_MS`)避免单位歧义;含义不直观的加注释说明取值依据。常量文档减少维护猜测。

### 3.7 环境差异用环境变量/配置文件

部署相关常量(URL、DEBUG、密钥)从环境变量读,适应多环境;复杂配置用 YAML/TOML 文件外置。代码与配置分离,改配置不改代码。

### 3.8 不依赖运行时强制,但用工具补强

Python 常量无运行时强制,接受"约定为主",但用 Final(静态检查)+ Enum/frozen(运行时只读)+ Ruff(规范检查)层层补强。不指望编译器,但用工具把误改概率降到最低。

### 3.9 常量命名表意准确,避免魔法数

`MAX_RETRY` 优于 `3`,`STATUS_OK` 优于 `200`。消除魔法数/魔法字符串,常量名自解释。这是常量最基本的用途。

### 3.10 类相关常量挂类上

与类语义相关的不变值(如 `Circle.PI`)作类常量,而非散落模块,让常量在结构上归属相关类,更有组织。

### 3.11 常量与类型注解配合

常量加类型注解 + Final,类型明确且静态保护。容器常量注解为不可变类型(`tuple[str, ...]`),表达并保证不可变集合意图。

### 3.12 定期审视常量,清理无用

项目演进中常量会过时(不再用的配置、废弃的状态)。定期审视常量模块,删除无用常量,保持精简。常量模块臃肿会增加维护负担,保持只含真正在用的。

---

## 4. 原理

### 4.1 Python 为何无常量语言机制(需理解,详述)

Python 没有 `const`/`final` 这种语言级常量机制(运行时强制不可变),这是有意的设计选择,理解其缘由有助于把握 Python 哲学。

**对比 C/Java 的硬常量**:C 的 `const int MAX = 10;` 由编译器强制,`MAX = 20` 编译报错;Java 的 `final` 同理。这是"语言层面不可变",编译期保护,试图改即报错,常量安全有保障。

**Python 的选择**:Python 不提供这种运行时强制的常量。所有名字都是普通变量,可重新赋值。Python 用"约定"(全大写命名)+ 程序员自觉来维护常量,而非语言强制。

**设计缘由**:

1. **"Consenting adults" 哲学**:Python 信任程序员是成年人,自觉遵守约定,不用编译器当保姆。若你坚持要改一个全大写常量,Python 不阻拦(可能你有特殊理由,如测试时 monkeypatch)。这降低语言复杂度(无需 const 语义)。
2. **动态语言本性**:Python 是动态语言,变量无固定类型、可在运行时重新绑定,强制的"不可变绑定"与动态本性 somewhat 张力。Python 选择保持动态一致,常量靠约定。
3. **简单优先**:无 const 语法,语言更简单。需要强不可变时,用 Enum/frozen/tuple 等机制针对性实现,而非通用 const。

**后果与应对**:

- **无编译期保护**:误改常量不报错(运行时)。应对:用 `Final`(静态检查)+ mypy/Ruff 在 CI 拦截。
- **约定靠自觉**:全大写常量可被改,只是"不该改"。应对:团队规范 + 工具检查 + code review。
- **需要真不可变时用专门机制**:Enum 成员只读、frozen dataclass 禁改属性、tuple 结构不可变——这些是"局部强制不可变",针对特定场景提供保障。

理解"Python 无通用常量机制,靠约定 + 针对性不可变类型",就能解释为何全大写常量仍可被改、为何要 Final/Enum/frozen 这些"补丁"机制。Python 的常量是"约定为主、机制为辅"的工程实践,而非语言保证。

### 4.2 Final 的静态检查机制(需理解,详述)

`Final` 是如何"防重新赋值"的?它是**类型注解**,被静态类型检查器(非运行时)消费。

**机制**:`x: Final = 10` 把 `x` 标记为"final 名字",记录在类型信息里。Python 运行时**忽略** Final(它只是个注解,不产生运行时行为)——`x = 20` 运行时仍合法执行。但**静态检查器**(mypy、pyright、Ruff)读取这个注解,在检查阶段发现"对 final 名字重新赋值"就报错:

```python
from typing import Final
MAX: Final[int] = 3
MAX = 5     # 运行时:正常执行,MAX 变 5
            # mypy: error: Cannot assign to final name "MAX"
```

故 Final 的保护是**静态的、可选的**(需跑 mypy/Ruff 才生效),非运行时强制。不跑类型检查,Final 等于无物。

**Final 防什么、不防什么**:

- **防重新赋值**:`MAX = 5` 被 Final 拦截(静态)。
- **不防就地修改可变对象**:`FINAL_LIST: Final = [1,2]; FINAL_LIST.append(3)` Final 管不到——它防"名字重新绑定",不防"对象内容修改"。要防内容改,用 tuple 等不可变容器。

**类属性 Final**:类内 `URL: Final[str] = "..."` 同理,静态防重新赋值类属性。

**Final 的价值与边界**:Final 把常量约定升级为"静态类型系统可检查",在有 mypy/Ruff CI 的项目里有效拦截误改。但它本质是静态检查,运行时无常量保护——不跑检查器或用反射(`setattr`、修改 `__dict__`)仍能改。理解 Final 是"静态约定强化"而非"运行时强制",才能正确使用(配 CI 才有效)。

### 4.3 Enum 的运行时只读机制(需理解,详述)

Enum 成员的"只读"是**运行时强制**的,比 Final 的静态检查更强,值得了解其机制。

**Enum 成员不可重新赋值**:

```python
class Color(Enum):
    RED = 1
    GREEN = 2

Color.RED = 99     # AttributeError: cannot reassign member 'RED'
Color.RED.value = 99   # AttributeError: cannot set 'value'
```

Enum 类在创建时,通过**元类**(`EnumMeta`)的 `__setattr__`/`__delattr__` 拦截对枚举成员的修改:试图重新赋值成员或改成员属性,抛 `AttributeError`。这是运行时强制,非静态检查。

**Enum 的数据模型**:Enum 类的每个成员是枚举类的一个**单例实例**(如 `Color.RED` 是 Color 的实例),成员的值存为实例属性。元类在类创建时锁定这些成员,禁止后续修改。

**边界**:

- **成员值只读**:不能改 `Color.RED.value`。
- **不能增删成员**:类创建后不能加新成员或删已有。
- **但成员值对象若可变仍可改内容**(与 tuple 同理):若成员值是 list,`Color.X.value.append(...)` 可行(因改的是 value 对象内容,非成员绑定)。故 Enum 成员值宜用不可变类型(int/str/tuple)。

**Enum vs Final vs 全大写**:

- 全大写:纯约定,运行时可改。
- Final:静态检查防改,运行时可改。
- Enum 成员:**运行时强制只读**(元类拦截),最强。

理解 Enum 的运行时只读机制(元类 `__setattr__` 拦截),就知道它是 Python 里"常量"保障最强的方案——不是约定、不是静态检查,而是运行时由元类强制。这解释了为何"一组相关常量推荐用 Enum":它真正在运行时保证了不可变。

### 4.4 frozen dataclass 与 namedtuple 的不可变机制(需理解,简述)

`@dataclass(frozen=True)` 与 `namedtuple` 的不可变也是运行时强制的,机制类似:

**frozen dataclass**:`frozen=True` 让 dataclass 在生成 `__setattr__`/`__delattr__` 时加上"抛 `FrozenInstanceError`"的逻辑。故试图改实例属性时,`__setattr__` 拦截并报错:

```python
@dataclass(frozen=True)
class C:
    x: int = 1

c = C()
c.x = 2     # FrozenInstanceError: cannot assign to field 'x'
```

**namedtuple**:namedtuple 是 tuple 子类,字段访问靠 `__getattr__`,因 tuple 不可变且 namedtuple 不提供 `__setattr__`(继承 tuple 的不可变),改字段抛 `AttributeError`。

**边界(与 tuple 同)**:frozen/namedtuple 防"改字段绑定",不防"字段对象内容修改"(若字段是可变对象,改其内容仍可行)。深层不可变需字段也是不可变类型。

**机制共性**:frozen dataclass/namedtuple/Enum/tuple 的运行时不可变,都靠"拦截 `__setattr__`/`__delattr__` 或容器结构不可变"实现。这是 Python 在无通用 const 机制下,用专门类型针对性提供运行时不可变的方案。理解这套"拦截赋值"的机制,就理解了 Python 各类"不可变对象"的统一原理。

### 4.5 常量在字节码与内存的简述(底层,简略)

从字节码看,常量与变量无异——`MAX = 3` 同样是 `LOAD_CONST` + `STORE_NAME`,运行时就是普通名字空间赋值。常量的"不可变"纯靠约定/类型检查/元类拦截,字节码层面无特殊处理。

内存上,常量通常指向不可变对象(int/str/tuple),这些对象本身值不变(不可变类型),但名字到对象的绑定可改(除非 Final/Enum 拦截)。小整数/字符串缓存(见变量赋值机制笔记)让常量 `MAX_RETRY = 3` 的 3 可能与别处 3 共享对象,这是优化,与常量语义无关。这些底层细节日常无需深究,知道"常量在字节码层面无特殊待遇,不可变靠上层机制"即可。

---

## 5. 总结

### 5.1 本文内容回顾

- **常量定位**:值不可改变的量;Python **无常量语言机制**(无 const),靠约定(全大写)+ 可选机制(Enum/Final/frozen)模拟;"consenting adults"哲学。
- **约定形式**:全大写下划线、模块顶部、集中管理;类内常量作类属性。
- **为何需常量**:消除魔法数/魔法字符串、集中配置、可读可维护、防错、文档作用。
- **不可变层级**:全大写约定(最弱)→ Final(静态检查)→ Enum/frozen/namedtuple/tuple(运行时只读)。
- **模块级常量**:顶部集中、分组、带注释。
- **类级常量**:类属性全大写,与类语义相关的不变值。
- **Final 类型注解**:静态检查防重新赋值,配 mypy/Ruff/CI 有效;不防就地修改可变对象。
- **Enum 枚举**:一组相关命名常量,运行时只读(元类强制)、可迭代、防非法值,枚举常量最佳方式。
- **frozen dataclass / namedtuple**:不可变配置对象,字段不可改,适合结构化配置。
- **不可变容器**:tuple/frozenset 防误改集合,注意元素可变性,深层不可变递归用不可变类型。
- **配置组织**:单 config 模块(小项目)/分领域(大项目)/环境变量+配置文件(多环境)。
- **常量与类型注解**:Final + 类型注解 + 不可变容器类型协作,静态系统可保证契约。
- **常量文档命名**:全大写表意、带单位、注释取值依据。
- **魔法数消除实战**:逐步将裸值提为命名常量,重构示例。
- **常量与默认参数**:不可变常量可作默认参数,可变常量(默认参数陷阱)用 None 哨兵或 tuple。
- **反模式**:可变常量、散落裸值、命名含糊、不带单位、运行时计算、过度常量化、重复定义。
- **跨模块共享**:集中 config 模块单向被依赖,避免循环导入,config 是依赖图叶子。
- **测试处理**:monkeypatch 临时改常量便利测试,生产勿依赖可改常量。
- **演进版本化**:集中易演进、配置外置、废弃缓删、变更需测试。
- **完整示例**:规范常量配置模块范本。
- **原理**:Python 为何无通用常量机制(consenting adults/动态本性/简单优先,详述);Final 静态检查机制(注解被 mypy 消费、运行时忽略、防重新赋值不防就地改,详述);Enum 运行时只读机制(元类 `__setattr__` 拦截,最强,详述);frozen/namedtuple 不可变机制(拦截 `__setattr__`,简述);字节码/内存层面常量无特殊待遇(简略)。
- **最佳实践**:全大写顶部集中、Final 加保护、相关常量用 Enum、配置用 frozen dataclass、集合用 tuple/frozenset、带单位注释、环境变量外置、工具补强、表意准确、类相关挂类上、类型注解配合、定期清理。

### 5.2 读完本文你应能掌握

- 说明 Python 无常量语言机制,靠约定 + 可选机制模拟,及"consenting adults"设计哲学。
- 用全大写约定在模块/类级定义常量,消除魔法数,集中管理配置。
- 用 `Final` 类型注解让静态检查器防误改,说明其"静态、需 CI、防重新赋值不防就地改"的边界。
- 用 `Enum` 表达一组相关命名常量,说明其运行时只读(元类强制)与可迭代/防非法值优势。
- 用 `frozen dataclass`/`namedtuple` 表达不可变配置对象,用 `tuple`/`frozenset` 表达不可变集合常量。
- 说明容器不可变与元素不可变的区别,递归用不可变类型实现深层不可变。
- 按项目规模组织常量(单模块/分领域/环境变量+配置文件),实现配置与代码分离。
- 用类型注解 + Final + 不可变容器类型,把常量约定升级为静态可保证契约。
- 阐述 Final(静态检查)、Enum(元类运行时强制)、frozen(拦截 `__setattr__`)各机制原理与强弱差异。
- 按最佳实践写出规范、有保障、可维护的常量定义。

### 5.3 延伸方向

- **类型系统与 Final/ClassVar**:`Final`、`ClassVar`、`Literal` 等类型注解在常量与类属性中的应用,静态保证更精细。
- **Enum 进阶**:`IntEnum`/`StrEnum`/`Flag`/`IntFlag`、`auto` 自定义、`aio` 枚举方法,枚举的高级用法。
- **dataclass 进阶**:frozen dataclass 的 `__post_init__`、`slots`、与 `attrs` 库,不可变数据建模。
- **配置管理库**:`pydantic-settings`、`dynaconf`、`python-dotenv`,环境变量与配置文件的工程化方案。
- **不可变数据结构**:`frozendict`、`pyrsistent` 等持久化数据结构,函数式编程的不可变数据。
