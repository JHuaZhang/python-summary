---
group:
  title: 【01】初识python
  order: 1
order: 10
title: 标识符命名规范
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是标识符

标识符(identifier)是程序员在代码里自己起的名字——变量名、函数名、类名、模块名、参数名,统统是标识符。当你写 `count = 0`、`def calc_total(items):`、`class User:` 时,`count`、`calc_total`、`User` 就是标识符。它是代码里出现频率最高的元素,几乎每一行都包含若干标识符。

标识符与关键字(keyword)不同:关键字是 Python 语言保留、有固定含义的名字(`if`、`for`、`def`、`class`、`return` 等),你不能用它们做标识符;而标识符是你可以自由命名的名字,只要遵守命名规则。区分二者:`if` 是关键字不能作变量名,`iff`、`condition` 可以。

标识符命名看似是"起名字的小事",实则是代码质量的基础。理由:

- **可读性**:代码读的次数远多于写,好名字让代码自解释,少写注释。
- **可维护性**:命名混乱的代码,后人接手如读天书,维护成本陡增。
- **协作**:团队统一命名风格,代码风格一致,降低沟通成本。
- **避免错误**:坏名字(如 `l`、`O`、单字母)易与数字混淆、易拼错,埋下 bug。

业界有句共识:"命名是计算机科学里两大难题之一"(另一是缓存失效)。起好名字不简单,需要遵循规则与约定,这正是本节要讲的——既讲 Python 标识符的**语法规则**(什么名字合法),也讲**命名规范**(什么名字是好名字)。

### 1.2 标识符的语法规则

Python 对标识符有硬性语法规则,违反就是 `SyntaxError`,代码根本跑不了。规则如下:

**合法字符**:标识符由**字母、数字、下划线**组成,且**不能以数字开头**。

```python
# 合法
count = 1
_user = 2
user2 = 3
总人数 = 4        # Python 3 允许 Unicode 字母,中文可用(但不推荐,见规范)
__init__ = 5
```

```python
# 非法
2count = 1        # SyntaxError: 数字开头
my-var = 2        # SyntaxError: 含连字符(- 会被当减号)
my var = 3        # SyntaxError: 含空格
class = 4         # SyntaxError: class 是关键字
```

**大小写敏感**:`count`、`Count`、`COUNT` 是三个不同的标识符。

```python
count = 1
Count = 2
COUNT = 3
print(count, Count, COUNT)   # 1 2 3
```

**不能是关键字**:关键字列表可用 `keyword.kwlist` 查看:

```python
import keyword
print(keyword.kwlist)
# ['False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', ...]
```

**长度无限制**:理论上标识符可任意长,但实务上应简洁有意义。

**Python 3 的 Unicode 支持**:Python 3 允许标识符含 Unicode 字母(中文、日文等),如 `变量 = 1` 合法。但这**强烈不推荐**——非 ASCII 命名在跨工具(某些 linter、文档工具、旧系统)、国际协作时易出问题,且不符合 PEP 8。除非特殊场景(教学演示),标识符应坚持用 ASCII 字母。

**下划线的特殊含义**:下划线开头的标识符有约定含义(单下划线 `_x`、双下划线 `__x`、前后双下划线 `__x__`),这涉及访问控制与魔法方法,1.4 与第 4 章详述。

记住这套语法规则是"合法"的下限;真正决定代码质量的是"规范",即起什么样的好名字,这是第 2 章重点。

### 1.3 为什么需要命名规范

语法规则只保证名字"合法",规范保证名字"好"。没有规范的命名会出现:

- **含义不明**:`d = get_d(x)` —— `d` 是什么?data?date?distance?看不懂。
- **误导**:`user_list = {"a": 1}` —— 名字说 list 实际是 dict,误导读者。
- **风格混乱**:`getUserData`、`get_user_data`、`getuserdata` 三种风格混用,显得业余。
- **缩写泛滥**:`usr_cnt`、`cfg_mgr` —— 缩写过多,新人看不懂。
- **单字母滥用**:`l = [1,2]; O = 0` —— `l` 易与 `1` 混、`O` 易与 `0` 混。
- **命名冲突/遮蔽**:`list = [1,2]` 遮蔽了内置 `list`,之后 `list()` 用不了。

一套命名规范的价值:

- **统一风格**:全项目一致(studly_case 变量、CamelCase 类),阅读流畅。
- **表意清晰**:名字准确反映含义,代码自解释。
- **避免陷阱**:不遮蔽内置、不用易混单字母。
- **传达约定**:下划线前缀表达"私有"、全大写表达"常量",名字本身携带设计意图。

Python 有 PEP 8 官方命名约定,加上类型注解、社区实践,形成一套成熟规范。本节讲 Python 的命名规则与 PEP 8 命名规范,帮你起出专业的好名字。

### 1.4 命名约定速览:下划线的含义

Python 用下划线的不同形式表达不同约定,这是命名规范的核心,先概览:

| 形式 | 含义 | 示例 |
|------|------|------|
| `name` | 公开(普通) | `count`、`def calc():` |
| `_name` | 内部使用(约定私有) | `_helper`、`_internal_var` |
| `__name` | 类私有,触发名称重整 | `class C: __private` |
| `__name__` | 魔法方法/特殊属性(Python 定义) | `__init__`、`__len__`、`__name__` |
| `_` | 临时/忽略的变量 | `for _ in range(10):` |
| `NAME`(全大写) | 常量 | `MAX_RETRY = 3` |

要点:

- **单下划线前缀 `_x`**:约定"内部使用",提示"别从外部访问我",但 Python 不强制(仍可访问)。多用于模块内私有函数/变量、非公开 API。
- **双下划线前缀 `__x`**(在类内):触发**名称重整**(name mangling),变成 `_ClassName__x`,一定程度避免子类覆盖。比单下划线更强的"私有"。
- **前后双下划线 `__x__`**:Python 保留的"魔法"名字(dunder,double underscore),用于特殊方法/属性,如 `__init__`、`__str__`、`__name__`。**不要自己发明 `__xxx__` 名字**,会与 Python 未来/现有机制冲突。
- **全大写 `NAME`**:约定常量,提示"不应修改"。
- **单独 `_`**:常作"我不关心这个值"的占位,如 `for _ in range(10)` 或解包忽略 `a, _ = pair`。

这套下划线约定是 Python 命名文化的精髓,理解它就能从名字看出设计意图。第 4 章会详述名称重整等机制,第 2 章讲各种标识符的命名规范。

---

## 2. 核心内容

本章详解各类标识符的命名规范(变量/函数/类/常量/模块/包)、PEP 8 命名约定、好名字的特征、常见反模式、下划线约定、类型注解与命名,给出可落地的规范。

### 2.1 变量命名规范

变量名应**小写、单词用下划线分隔**(snake_case),且表意准确:

```python
# 好
user_count = 10
is_valid = True
total_price = 99.5
file_path = "/tmp/data.txt"

# 坏
UserCount = 10      # 类名风格,变量该用 snake_case
x = 10              # 含义不明
usrCnt = 10         # 驼峰+缩写,不符合 Python 风格
```

**命名要点**:

- **snake_case**:全小写,单词间下划线,如 `user_count`。
- **表意准确**:`user_count` 比 `count` 更明确(什么的数量);`is_valid`/`has_permission` 用 is/has 前缀表布尔。
- **避免缩写**:`user_count` 优于 `usr_cnt`,除非缩写是行业通用(如 `url`、`id`、`db`)。
- **布尔变量**:用 `is_`/`has_`/`can_`/`should_` 前缀,如 `is_active`、`has_access`。
- **复数表集合**:`users`(多个用户)、`items`,单数 `user` 表单个。

**匈牙利命名避免**:不要用 `i_count`(int 前缀)、`s_name`(str 前缀)这种带类型前缀的匈牙利命名——Python 有类型注解表达类型,命名应表意而非标类型。

**临时变量**:循环计数 `i`/`j`/`k` 可接受(数学惯例);但 `for item in items` 比 `for i in items` 清晰(除非用索引)。

### 2.2 函数与方法命名

函数/方法名同样 **snake_case**,且应是**动词或动宾短语**(函数做动作):

```python
# 好
def calculate_total(items): ...
def get_user(user_id): ...
def is_valid(email): ...
def send_email(to, subject): ...

# 坏
def data(): ...        # 名词,不像动作
def Getuser(): ...     # 大小写不规范
def calc(): ...        # 过度缩写
```

**要点**:

- **动词开头**:函数做事情,名字应是 `get_`/`set_`/`calculate_`/`send_`/`parse_`/`validate_` 等动词。
- **布尔返回函数**:`is_valid`/`has_access`/`can_execute`,返回 bool 的用 is/has/can。
- **方法命名**:类内方法同样 snake_case。公开方法无前缀,私有方法单下划线 `_helper`。
- **避免与内置/关键字冲突**:别命名 `list`、`dict`、`input`、`type`、`id` 等,会遮蔽内置。

```python
# 坏:遮蔽内置
def sum(items): ...    # 遮蔽内置 sum,后续 sum([1,2]) 调你的函数
# 好
def calculate_sum(items): ...
```

**方法 vs 函数**:类内叫方法(method),模块级叫函数(function),命名风格一致(snake_case)。构造方法用 `__init__`(魔法方法,不改名)。

### 2.3 类命名规范

类名用 **CamelCase**(首字母大写,驼峰),单词不加分隔:

```python
# 好
class User: ...
class ShoppingCart: ...
class HttpRequest: ...
class ValueError(Exception): ...   # 异常也是类

# 坏
class user: ...        # 小写,不像类
class user_info: ...   # snake_case,不符合类名约定
class userinfo: ...    # 多词无分隔,难读
```

**要点**:

- **CamelCase/帕斯卡命名**:每个单词首字母大写,`User`、`ShoppingCart`、`HttpRequest`。缩写词全大写或首大写(`HttpRequest` 或 `HTTPRequest`,项目内统一)。
- **名词**:类通常表"事物",名词,如 `User`、`Order`、`Logger`。
- **异常类**:继承 Exception,名以 `Error` 结尾,如 `ValueError`、`ConnectionError`、自定义 `InvalidUserError`。
- **与变量/函数区分**:变量 snake_case 小写,类 CamelCase 大写,看首字母大小写就知道是类还是变量。

**类内成员**:

- 公开属性:snake_case,如 `self.name`。
- 私有属性:`_name`(约定)或 `__name`(名称重整)。
- 方法:snake_case,公开无前缀,私有 `_method`。

类名 CamelCase 与变量/函数 snake_case 的区分,是 Python 命名规范最重要的视觉约定,让代码结构一目了然。

### 2.4 常量命名规范

常量用 **全大写、单词下划线分隔**(UPPER_CASE),放在模块顶部:

```python
# 好
MAX_RETRY = 3
DEFAULT_TIMEOUT = 30
PI = 3.14159
DATABASE_URL = "postgresql://..."
STATUS_OK = 200

# 坏
max_retry = 3          # 小写,看不出是常量
MaxRetry = 3           # 类名风格
```

**要点**:

- **全大写 + 下划线**:`MAX_RETRY`、`DEFAULT_TIMEOUT`。
- **模块顶部**:常量集中在模块开头,便于查找。
- **约定不可变**:全大写是"别修改我"的约定(非强制,但大家遵守)。
- **真正的不可变用大写 + tuple/final**:如 `COLORS = ("red", "green", "blue")`(tuple 不可变),或类型注解 `Final`:

```python
from typing import Final
MAX_RETRY: Final[int] = 3   # Final 提示不可重新赋值,静态检查可校验
```

常量全大写让"这是常量"一眼可辨,修改全大写变量会触发读者警觉,是有效的约定。

### 2.5 模块与包命名

模块(`.py` 文件)与包(含 `__init__.py` 的目录)名用**全小写、短、可含下划线**(但尽量不用):

```python
# 好:模块名
user.py
database.py
string_utils.py

# 好:包名
mypackage/
utils/
```

**要点**:

- **全小写**:`user.py` 而非 `User.py`。
- **简短**:模块名一两词,如 `utils`、`models`、`auth`。
- **可含下划线但避免**:PEP 8 建议模块名尽量不用下划线(`string_utils` 可接受,但 `stringutils` 更简短也不错)。避免用下划线开头(下划线开头模块有特殊含义,见 2.8)。
- **避免与标准库/常见包冲突**:别命名 `os.py`、`sys.py`、`requests.py`(会遮蔽同名标准库/第三方包,导致 import 异常)。
- **包名同模块规则**:全小写简短,如 `mypackage`。

**C 扩展模块**:用 `_` 前缀表示底层 C 模块,如 `_socket`,Python 层 `socket` 包装它。这是底层惯例,普通项目不涉及。

模块/包名一旦发布就难改(改名会破坏下游 import),所以起名要慎重、有前瞻性。

### 2.6 类型变量(TypeVar)与泛型命名

类型变量(泛型)用**单大写字母或 CamelCase**,约定首字母大写:

```python
from typing import TypeVar

T = TypeVar("T")           # 单字母,通用类型变量
K = TypeVar("K")           # 字典键
V = TypeVar("V")           # 字典值
NumberT = TypeVar("NumberT", int, float)   # 约束类型变量,CamelCase
```

**要点**:

- 通用类型变量常用单大写字母 `T`、`K`、`V`(源自数学/泛型惯例)。
- 有约束的类型变量用 CamelCase 描述,如 `NumberT`、`UserT`。
- 协变/逆变类型变量加 `_co`/`_contra` 后缀(进阶)。

类型变量命名是类型注解领域的小众约定,知道 `T`/`K`/`V` 等惯例即可,深入见类型系统笔记。

### 2.7 好名字的特征

总结好名字的共同特征,起名时对照:

1. **准确(accurate)**:名字真实反映含义,不误导。`user_list` 就该是 list,不是 dict。
2. **具体(specific)**:`get_user_by_email` 比 `get` 具体;`unpaid_invoices` 比 `invoices` 具体。
3. **简洁(concise)**:在准确前提下尽量短,但不牺牲清晰。`user_count` 够,不必 `the_number_of_users`。
4. **可读(readable)**:符合 snake_case/CamelCase,单词分隔清晰。
5. **一致(consistent)**:同概念全项目用同名字,如都用 `user_id` 而非时而 `uid` 时而 `user_id`。
6. **可搜索(searchable)**:避免单字母(Grep 难找),`user_count` 比 `n` 易搜索。
7. **无歧义(unambiguous)**:`data`、`info`、`temp`、`handler` 这类过于泛的名字尽量具体化。

**起名思考流程**:先想"这个名字代表什么"(语义)→ 选准确词 → 按 snake_case/CamelCase 拼 → 检查是否与内置/已有冲突 → 是否可搜索可读。好名字值得花时间,它在整个代码生命周期被读无数次。

### 2.8 下划线约定详解

1.4 概览了下划线含义,这里详解使用:

**单下划线前缀 `_name`(约定私有)**:

```python
def _internal_helper():
    """模块内部辅助函数,约定不外部调用,但 Python 不强制。"""
    ...

class User:
    def __init__(self):
        self._cache = {}    # 约定私有属性,外部不应直接访问
```

`_` 前缀是"君子协定":提示"内部使用,别依赖"。Python 不阻止访问(`user._cache` 仍可访问),但 linter 会警告从外部访问 `_` 前缀成员,`from module import *` 也不导入 `_` 前缀名字。用于:非公开 API、实现细节、临时辅助。

**双下划线前缀 `__name`(名称重整)**:仅在类内有效,触发名称重整(第 4 章详述):

```python
class Counter:
    def __init__(self):
        self.__count = 0    # 实际存为 self._Counter__count
    def inc(self):
        self.__count += 1
```

`__count` 被重整为 `_Counter__count`,一定程度避免子类同名属性覆盖。比 `_` 更强的私有,但仍有办法访问(`obj._Counter__count`),非真正私有。少用,多数场景 `_` 足够。

**前后双下划线 `__name__`(魔法名字)**:Python 定义的特殊方法/属性:

```python
__init__     # 构造
__str__      # 字符串表示
__len__      # 长度
__name__     # 函数/类/模块名
__file__     # 模块文件路径
```

这些是 Python 协议预留的,**不要自创 `__xxx__` 名字**(可能冲突)。只在你实现某协议时用对应的魔法名(如定义 `__str__` 让 print 友好)。

**单独 `_`(忽略/临时)**:

```python
for _ in range(10):     # 循环变量不用,用 _ 占位
    print("hi")

a, _ = (1, 2)           # 只取 a,忽略第二个

_ = compute()           # 故意忽略返回值
```

`_` 表"我不关心这个值",是 Pythonic 的忽略占位。REPL 里 `_` 还特指上一个表达式的结果。

这套下划线约定让名字携带设计意图:私有、常量、忽略、魔法,从名字形态即可判断,是 Python 命名文化的精髓。

### 2.9 避免遮蔽内置名

Python 有大量内置名(built-in):`list`、`dict`、`str`、`int`、`id`、`type`、`input`、`sum`、`max`、`min`、`file`、`input` 等,以及关键字。用它们作标识符会**遮蔽**(shadow)内置,导致后续用不了该内置功能:

```python
# 坏:遮蔽 list
list = [1, 2, 3]
# later
new_list = list(range(5))   # TypeError: 'list' object is not callable
                              # 因 list 现在是 [1,2,3],不是内置 list()
```

修复:避免用内置名作变量,改个名:

```python
my_list = [1, 2, 3]
new_list = list(range(5))    # OK,list 仍内置
```

**常见易遮蔽的内置**:`list`、`dict`、`set`、`str`(作变量名遮蔽类型)、`id`、`type`、`input`、`file`、`sum`、`max`、`min`、`len`、`map`、`filter`。起名时自问"这是不是内置名",是则换。

**IDE/linter 帮助**:PyCharm/VS Code(Pylint/pyflakes)会高亮遮蔽内置的命名,Ruff 也能检查。借助工具避免无意遮蔽。

### 2.10 类型注解与命名

类型注解引入新标识符(`List`、`Dict`、`Optional` 等),命名有约定:

- **类型别名**:全大写或 CamelCase,如 `UserId = int`、`JSON = dict[str, Any]`。
- **typing 模块的泛型**:`List`/`Dict`/`Optional`/`Union` 是 typing 提供的(Python 3.9+ 可直接用小写 `list`/`dict` 作泛型,更推荐):
  ```python
  # Python 3.9+
  def f(items: list[int]) -> dict[str, int]: ...   # 用小写内置类型作泛型
  ```
- **变量类型注解**:变量名本身仍是 snake_case,注解在冒号后:`count: int = 0`。

类型注解的标识符遵循类型世界的约定(类型名 CamelCase/大写),与变量(小写)区分,看注解就知道是类型。

### 2.11 命名反模式集合

汇总常见坏命名,自查避免:

- **单字母滥用**:除循环计数 `i/j/k`、数学公式变量,避免 `a`/`b`/`x`/`y`。
- **易混字符**:`l`(小写 L)、`O`(大写 o)、`I`(大写 i)易与 `1`/`0`/`l` 混,避免。
- **泛名**:`data`/`info`/`temp`/`value`/`handler`/`manager` 过于泛,具体化。
- **匈牙利命名**:带类型前缀 `i_count`/`s_name`,Python 不需要。
- **缩写泛滥**:`usr_cnt`/`cfg_mgr`,除通用缩写(id/url/db)外,用全词。
- **误导名**:`user_list` 实际是 dict。
- **遮蔽内置**:`list = [...]`。
- **风格混用**:同项目 `getUser`/`get_user`/`getuser` 混。
- **`__dunder__` 自创**:`__my_method__` 与 Python 协议冲突风险。
- **过长**:`the_number_of_users_in_the_system`,在准确前提下缩短。
- **否定布尔**:`not_found` 不如 `is_missing`/`found`(正向更易读)。

识别反模式是起好名的前提。code review 专门审视命名,能显著提升代码质量。

### 2.12 完整示例:规范命名的模块

一个体现规范的完整模块:

```python
"""订单处理模块。"""

from typing import Final

# 常量:全大写
MAX_ORDER_ITEMS: Final[int] = 100
DISCOUNT_RATE: Final[float] = 0.1
STATUS_PENDING: Final[str] = "pending"


def calculate_total(items: list[dict]) -> float:
    """计算订单总金额。

    Args:
        items: 订单项列表,每项含 'price' 和 'quantity'

    Returns:
        总金额
    """
    total = 0.0
    for item in items:
        total += item["price"] * item["quantity"]
    return total


def _apply_discount(total: float, rate: float) -> float:
    """应用折扣(内部辅助)。"""
    return total * (1 - rate)


class Order:
    """订单。"""

    def __init__(self, order_id: int, items: list[dict]):
        self.order_id = order_id        # 公开属性
        self.items = items
        self._total = 0.0               # 私有属性(约定)

    def process(self) -> float:
        """处理订单,返回折扣后金额。"""
        self._total = calculate_total(self.items)
        return _apply_discount(self._total, DISCOUNT_RATE)


class InvalidOrderError(Exception):
    """无效订单异常。"""
    pass
```

此示例体现:模块 docstring、常量全大写(+Final)、函数 snake_case 动词、私有函数 `_` 前缀、类 CamelCase、属性 snake_case、私有属性 `_`、异常以 Error 结尾、类型注解。命名规范齐全,是范本。

### 2.13 命名与作用域的相互作用

标识符命名需考虑作用域宽窄:作用域越宽,名字需越具体;作用域越窄,可越简短。

**全局/模块级**:作用域宽,被多处引用,名字要完整具体:

```python
# 模块级,需具体
user_session_timeout = 1800
def calculate_monthly_revenue(records): ...
```

**函数内局部**:作用域窄,上下文明确,可适当简短:

```python
def process_user(user):
    # 局部变量,上下文是 user,不必 user_xxx
    name = user.name
    age = user.age
    # 而不是 user_name = user.name (前缀冗余,因已在 user 上下文)
```

**循环/推导局部**:更可短:

```python
for item in items:        # item 在循环上下文,简短可接受
    process(item)

total = sum(p * q for p, q in pairs)   # p, q 在推导上下文
```

原理:名字的"信息量"要匹配它被理解所需的上下文。全局无明确上下文,名字自带全部信息要具体;局部有函数/循环提供上下文,重复上下文信息(如函数内 `user_name` 当参数已是 user)是冗余。这条原则让名字既不冗长也不含糊,恰如其分。

### 2.14 命名一致性与项目词汇表

一致性是好命名的高阶要求:同概念全项目用同一名字,避免同义混用。

**建立项目词汇表**(glossary):团队约定核心业务概念的统一用词,如:

- 用户统一叫 `user`(不忽 `user` 忽 `account` 忽 `member`)
- 用户标识统一 `user_id`(不忽 `uid` 忽 `user_id` 忽 `userId`)
- 订单统一 `order`(不忽 `order` 忽 `purchase`)

```python
# 一致(好)
def get_user(user_id): ...
def delete_user(user_id): ...
def update_user(user_id, data): ...

# 不一致(坏,同义混用)
def get_user(uid): ...
def delete_account(user_id): ...
def update_member(user_id, data): ...
```

词汇表的价值:降低认知负担(读者不必猜 account/member/user 是否同义)、便于搜索(一个概念一个词,Grep 一次找全)、减少 bug(同义混用易导致接对接错)。建立项目词汇表(可写在 CONTRIBUTING 或 docstring),新人入项先读,命名就有据可依。

### 2.15 命名在重构中的角色

命名是重构的信号与手段:

**坏命名是重构信号**:`data2`、`temp`、`handle_stuff` 这类名往往暗示函数职责不清、动机不明,是拆分/重命名重构的候选。

**重命名是最值钱的重构**:好名字让代码自解释,常比改结构更有效。重构时优先重命名,把 `proc` → `process_payment`、`d` → `daily_revenue`,代码可读性立刻提升。

**安全重命名**:IDE(PyCharm/VS Code)的重命名重构安全更新所有引用,改动可控。对公开 API 重命名需谨慎(破坏下游),内部重命名可大胆。

```python
# 重构前
def calc(d):
    r = 0
    for i in d:
        r += i
    return r

# 重构后(重命名+具体化,清晰百倍)
def calculate_total(prices: list[float]) -> float:
    total = 0.0
    for price in prices:
        total += price
    return total
```

命名重构成本低、收益高,是提升遗留代码可读性的首选手段。勇于重命名,别让坏名字沉淀。

### 2.16 特定场景的命名约定

一些特定编程场景有约定命名:

**回调/高阶函数参数**:回调函数参数名常叫 `callback`、`fn`、`func`、`key`(排序键):

```python
def apply(items, func):        # func 是对每项应用的函数
    return [func(item) for item in items]

sorted(users, key=lambda u: u.age)   # key 是排序键函数
```

**装饰器**:装饰器函数名通常小写动词,被装饰函数名不变:

```python
def log_calls(func):          # 装饰器,名表"记录调用"
    def wrapper(*args, **kwargs):
        print(f"call {func.__name__}")
        return func(*args, **kwargs)
    return wrapper

@log_calls
def send_email(): ...         # 被装饰函数名仍 send_email
```

**property**:property 名是名词(属性),getter 方法通常不单独命名(用 `@property`):

```python
class Circle:
    def __init__(self, radius):
        self.radius = radius

    @property
    def area(self):           # property 名 area,名词,像属性
        return 3.14 * self.radius ** 2
```

**上下文管理器**:`with` 用的对象/函数名常叫 `xxx_ctx` 或表资源:

```python
with open(path) as f: ...     # f 表文件
with lock: ...                # lock 表锁
```

**生成器**:生成器函数名常以产出物复数 or 动词:

```python
def read_lines(path):         # 动词,产出各行
    with open(path) as f:
        yield from f
```

这些场景约定让代码更易读(看到 `key=` 知是排序键,看到 `@property` 知是属性),遵循它们融入 Pythonic 风格。

### 2.17 国际化与 ASCII 命名

Python 3 允许 Unicode 标识符(中文可命名),但工程上坚持 ASCII:

**不推荐 Unicode 命名的原因**:

- **跨工具风险**:某些 linter、文档生成器、旧系统、CI 环境对非 ASCII 标识符支持不一,可能乱码或报错。
- **国际协作**:开源/跨国团队,ASCII 命名全球可读,中文命名对非中文母语者是障碍。
- **输入便利**:ASCII 在任何键盘直接输入,中文需切换输入法,降低效率。
- **PEP 8 建议**:PEP 8 明确建议模块/变量名用 ASCII。

**例外**:教学演示(向初学者直观展示概念)、纯内部非长期脚本,可用中文命名辅助理解。但生产代码、库、协作项目,坚持 ASCII。

**字符串内容可 Unicode**:注意区分——标识符(名字)用 ASCII,但字符串内容(用户可见文本、注释)可中文,这两者不冲突:

```python
greeting = "你好,世界"     # 标识符 greeting 是 ASCII,内容是中文,OK
# 总用户数 = 100            # 标识符中文,不推荐
```

原则:**标识符 ASCII,字符串/注释可中文**。这是国际化的稳妥实践。

### 2.18 命名检查工具实战

用工具自动保证命名规范,比人工盯守可靠:

**Ruff(含 pep8-naming 规则)**:Ruff 集成 pep8-naming,检查:

- 函数是否 snake_case、类是否 CamelCase、常量是否全大写。
- 函数名与函数内变量名混乱(`__` 自创 dunder 警告)。
- 继承 Exception 的类是否 Error 结尾。

配置(`ruff.toml` 或 `pyproject.toml`):

```toml
[tool.ruff.lint]
select = ["N"]            # 启用 pep8-naming 规则集
```

**Pylint**:更全面的命名检查(变量/函数/类/常量/方法各规则),可配置严格度。

**pydocstyle**:配合检查 docstring 风格。

**IDE 实时检查**:PyCharm/VS Code(Pylance)实时高亮不合规命名(如类小写、遮蔽内置),写时即纠正。

实战配置:项目用 Ruff 启用 N 规则 + IDE 实时检查,CI 跑 Ruff 不合格拒合并。这样命名规范机器保证,人专注起好名而非记规则。

---

## 3. 最佳实践

### 3.1 遵循 PEP 8 命名约定

变量/函数 snake_case、类 CamelCase、常量全大写、模块全小写——PEP 8 是 Python 命名的事实标准,全项目统一遵循。用 Ruff/black 自动检查风格,保证一致。

### 3.2 名字表意准确具体,避免泛名

`user_count` 优于 `count`,`unpaid_invoices` 优于 `invoices`。起名时想清楚"代表什么",选准确具体词。`data`/`info`/`temp`/`handler` 这类泛名尽量具体化。

### 3.3 不遮蔽内置名与关键字

避免 `list`/`dict`/`id`/`type`/`input` 等作标识符,起名时自问"是不是内置"。IDE/Ruff 高亮遮蔽,借助工具避免。

### 3.4 用下划线传达意图:私有/常量/忽略/魔法

`_x` 私有、`__x` 重整(慎用)、`__x__` 只用 Python 定义的魔法、`_` 忽略占位、`NAME` 常量。让名字形态携带设计意图,是 Pythonic 命名精髓。不自创 `__dunder__`。

### 3.5 布尔用 is/has/can 前缀,集合用复数

`is_active`/`has_access`/`can_edit` 表布尔;`users`/`items` 复数表集合。命名形态反映类型语义,提升可读。

### 3.6 避免易混单字母与否定布尔

不用 `l`/`O`/`I`(易与数字混);除循环计数/数学公式避免单字母。布尔用正向(`found` 比 `not_found` 易读)。

### 3.7 团队统一命名,避免风格混用

项目内 `getUser`/`get_user` 不混;同概念统一名字(`user_id` 始终用 `user_id`,不忽 `uid`)。统一风格让代码专业、可读。用 Ruff + 命名规范文档保证。

### 3.8 模块/包名慎重,避免与标准库冲突

模块/包全小写简短,不与 `os`/`sys`/`requests` 等重名(遮蔽致 import 异常)。模块名一旦发布难改,起名有前瞻性。

### 3.9 异常类以 Error 结尾,继承 Exception

`InvalidUserError`、`ConnectionError`,名以 Error 结尾、继承 Exception(或其子类),让异常从命名即可辨识。

### 3.10 借助工具检查命名

Ruff(含 pep8-naming 规则)、Pylint 能检查命名是否符合 PEP 8(如函数 snake_case、类 CamelCase、常量大写)。提交前/CI 跑,机器保证规范比人工盯守可靠。

### 3.11 code review 专门审视命名

命名是代码质量基础,review 时专门看名字是否准确、是否遮蔽、是否一致、是否泛。好名字值得在 review 中反复打磨,它在代码生命周期被读无数次。

### 3.12 重构时勇于改名

发现名字不准、误导、过时,勇敢重构改名(IDE 重命名重构安全更新引用)。代码演进中名字会过时,及时改名保持代码清晰,别让坏名字沉淀。

---

## 4. 原理

### 4.1 标识符的词法规则与 Unicode(底层,简略)

Python 标识符合法性由词法分析器(lexer)按规则判定:字母/数字/下划线组成、非数字开头、非关键字。Python 3 的标识符定义遵循 UAX-31(Unicode 标准附件),允许 Unicode 字母类别字符(如中文),但开头必须是字母/下划线(不能数字)。这套词法规则是 Python 语法层面规定,日常无需深究其实现,记住"字母数字下划线、非数字开头、非关键字"即可。Unicode 命名虽合法但 PEP 8 不推荐,因跨工具/国际协作风险,坚持 ASCII。

### 4.2 名称重整 name mangling 机制(需理解,详述)

双下划线前缀 `__name` 在类内的名称重整机制,是命名规范里涉及"私有"语义的核心,值得详述。

**机制**:在类定义体内,任何形如 `__name`(至少两个前导下划线、至多一个尾随下划线)的标识符,Python 解释器会**自动把它改写为 `_ClassName__name`**——即加上下划线 + 类名前缀。

```python
class Counter:
    def __init__(self):
        self.__count = 0        # 被 mangling 成 self._Counter__count

    def inc(self):
        self.__count += 1       # 类内 __count 都被改写为 _Counter__count

c = Counter()
print(c._Counter__count)        # 0 —— 可从外部用重整名访问
# print(c.__count)             # AttributeError,外部用原名访问不到
```

`self.__count` 在类内被解释器改写为 `self._Counter__count`,外部用原名 `__count` 访问不到(因实际属性名是 `_Counter__count`),需用重整全名才能访问。

**为何要重整**:重整主要用于**避免子类与父类的属性名冲突**。若子类也定义 `__count`,经重整变成 `_Subclass__count`,与父类的 `_Counter__count` 是不同属性,互不覆盖:

```python
class Base:
    def __init__(self):
        self.__value = "base"      # _Base__value

class Sub(Base):
    def __init__(self):
        super().__init__()
        self.__value = "sub"       # _Sub__value,不覆盖父类的!

s = Sub()
print(s._Base__value)             # base
print(s._Sub__value)              # sub
```

子类的 `__value` 重整为 `_Sub__value`,不覆盖父类 `_Base__value`,二者共存。无重整的话(用单下划线 `_value`),子类 `_value` 会直接覆盖父类同名属性。重整提供了"各类有自己的私有命名空间"的隔离。

**重整的边界**:

- **非真正私有**:重整后仍可用 `_ClassName__name` 从外部访问,Python 无真正的访问控制,只是增加访问难度与"别这么干"的信号。
- **仅在类内触发**:模块级的 `__name`(非类内)不重整,只是普通双下划线名字。
- **`__name__`(前后双下划线)不重整**:重整只针对 `__name`(前导无尾随或单个尾随),dunder 不重整。
- **少用**:重整增加复杂度(调试时看到 `_Counter__count` 困惑),多数场景单下划线 `_name` 约定私有足够。重整适合需要避免子类覆盖的特定场景。

**重整条数规则**:确切说,标识符若有至少两个前导下划线且至多一个尾随下划线(textually),触发重整。`__spam`→`_ClassName__spam`;`__spam__`(双尾随)是 dunder,不重整;`_spam`(单前导)不重整。

理解名称重整,能解释"为何 `__attr` 外部访问不到但 `_Class__attr` 可以""为何子类 `__attr` 不覆盖父类"等现象,并审慎决定何时用 `__`(重整)vs `_`(约定私有)。

### 4.3 单下划线 `_` 前缀的"私有"约定(需理解,简述)

单下划线前缀 `_name` 是"约定私有",无语言机制强制,但有几处实际效果:

- **`from module import *` 不导入 `_` 前缀名**:星号导入跳过 `_` 开头的名字,除非模块 `__all__` 显式列出。即 `_helper` 不会被 `from m import *` 带入,起到"不暴露内部 API"的作用。
- **linter 警告外部访问**:Pylint/Ruff 对从外部访问 `obj._attr` 报 warning(protected-access),提示"这是内部"。
- **不成文约定**:社区共识"`_` 开头 = 内部,别依赖",虽可访问但视为实现细节。

这套"约定 + 工具提示 + import 控制"的组合,使单下划线前缀成为 Python 表达"内部使用"的主流方式。它不强制(仍可访问),但提供足够信号。理解"私有靠约定不靠强制"是 Python 设计哲学的体现(we are all consenting adults)。

### 4.4 魔法方法 `__dunder__` 与协议(需理解,简述)

前后双下划线 `__name__`(dunder)是 Python 为**协议/特殊方法**预留的命名空间。Python 的很多行为通过协议实现:对象 `print` 调 `__str__`、`len()` 调 `__len__`、`[]` 调 `__getitem__`、`for` 调 `__iter__`、`+` 调 `__add__`、`with` 调 `__enter__`/`__exit__`……这些 `__x__` 名字由 Python 定义、由解释器在特定时机调用。

**为何不要自创 `__x__`**:Python 未来可能引入新的 dunder 协议,若你自创了同名,可能与 Python 行为冲突或被误触发。dunder 命名空间是 Python 的"保留字",只用来实现已有协议,不自创。

**约定与机制**:dunder 既是命名约定(看 `__x__` 就知是特殊方法),也是机制(这些名字被解释器查找调用)。理解这套协议命名,是掌握 Python 数据模型(对象如何参与运算/迭代/上下文等)的入口,详见面向对象笔记。

---

## 5. 总结

### 5.1 本文内容回顾

- **标识符定位**:程序员自起的名字(变量/函数/类/模块/参数),区别于关键字;命名是代码质量基础。
- **语法规则**:字母数字下划线、非数字开头、大小写敏感、非关键字;Python 3 允许 Unicode 但不推荐;长度无限制。
- **为何需规范**:避免含义不明/误导/风格混乱/缩写泛滥/单字母滥用/遮蔽内置;统一风格、表意清晰、避免陷阱、传达意图。
- **下划线约定速览**:`name` 公开、`_name` 私有、`__name` 重整、`__name__` 魔法、`_` 忽略、`NAME` 常量。
- **变量命名**:snake_case、表意准确、is/has 前缀布尔、复数表集合、避免缩写与匈牙利。
- **函数/方法命名**:snake_case、动词开头、布尔返回用 is/has、不遮蔽内置。
- **类命名**:CamelCase、名词、异常以 Error 结尾;类大写与变量小写区分。
- **常量命名**:全大写下划线、模块顶部、Final/tuple 表真不可变。
- **模块/包命名**:全小写简短、避免下划线、不与标准库冲突。
- **TypeVar 命名**:T/K/V 或 CamelCase 约束类型变量。
- **好名字特征**:准确、具体、简洁、可读、一致、可搜索、无歧义。
- **下划线详解**:`_` 私有约定+import 控制、`__` 重整、`__x__` 协议不自创、`_` 忽略占位。
- **避免遮蔽内置**:不用 list/dict/id/type/input 等作标识符,IDE/Ruff 检查。
- **类型注解命名**:类型别名 CamelCase/大写,泛型用小写内置类型(3.9+)。
- **反模式集合**:单字母滥用、易混字符、泛名、匈牙利、缩写、误导、遮蔽、风格混用、自创 dunder、过长、否定布尔。
- **命名与作用域**:作用域宽名字具体、作用域窄可简短,名字信息量匹配上下文。
- **命名一致性**:建立项目词汇表,同概念统一用词,避免同义混用。
- **命名与重构**:坏命名是重构信号,重命名是最值钱重构,IDE 安全重命名。
- **特定场景约定**:回调 func/key、装饰器、property 名词、上下文管理器、生成器命名。
- **国际化**:标识符坚持 ASCII(跨工具/协作/PEP8),字符串内容可中文。
- **检查工具实战**:Ruff(pep8-naming)、Pylint、IDE 实时检查,CI 保证。
- **完整示例**:规范命名模块范本。
- **原理**:标识符词法规则与 Unicode(底层简略);名称重整 mangling 机制——`__name`→`_ClassName__name`、避免子类覆盖、非真私有、规则边界(详述);单下划线私有约定(import 控制+linter,简述);dunder 协议命名与不自创(简述)。
- **最佳实践**:遵循 PEP 8、表意准确具体、不遮蔽内置、下划线传意图、布尔/集合命名约定、避免易混单字母、团队统一、模块名慎重、异常 Error 结尾、Ruff 检查、review 审命名、勇于改名。

### 5.2 读完本文你应能掌握

- 说明标识符的语法规则(字符/开头/关键字/大小写/Unicode),区分标识符与关键字。
- 按 PEP 8 给变量/函数/类/常量/模块/包/异常/TypeVar 起规范名字。
- 用下划线约定传达意图:`_` 私有、`__` 重整、`__x__` 魔法(不自创)、`_` 忽略、`NAME` 常量。
- 说明名称重整机制(`__name`→`_ClassName__name`)、为何能避免子类覆盖、其非真私有的边界。
- 说明单下划线"私有"的约定与实际效果(`import *` 不导入、linter 警告)。
- 避免遮蔽内置名,识别常见易遮蔽的内置并改名。
- 识别并避免常见命名反模式(单字母、泛名、匈牙利、误导、否定布尔等)。
- 用 Ruff/pylint 检查命名规范,在 review 中审视命名质量。
- 阐述 dunder 协议命名空间为何不自创、Python 私有"靠约定不靠强制"的设计哲学。
- 按最佳实践写出规范、表意、一致的标识符命名。