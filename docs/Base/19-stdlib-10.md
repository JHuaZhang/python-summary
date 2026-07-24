---
group:
  title: 【19】标准库精讲
  order: 19
order: 10
title: datetime.now 与 strftime
nav:
  title: Python
  order: 1
---

## 1. 介绍

### 1.1 什么是 datetime

`datetime` 是 Python 标准库 `datetime` 模块中处理"日期+时间"的核心类。它与同模块的另外三个类形成互补：

- `date`：只管日期（年月日），不管时分秒。
- `time`：只管时间（时分秒、时区），不管日期。
- `datetime`：日期 + 时间两者都有，是日常开发中最常用的类型。
- `timedelta`：表示两段时间的差值，用于算术运算。

本篇聚焦 `datetime` 类的两个最高频用法：**取当前时间**（`now` 及其变体）和**把时间格式化成字符串**（`strftime`）。这两个操作几乎出现在每一个 Python 项目里——打日志要取当前时间戳、生成带日期的文件名要格式化输出、用户友好的显示要把时间转成"2024年1月1日 周一"这样的文字。

一个最小示例先建立直觉：

```python
from datetime import datetime

now = datetime.now()                       # 取当前本地时间
print(now)                                 # 默认输出：2024-01-15 10:30:45.123456
print(now.strftime("%Y-%m-%d %H:%M:%S"))   # 格式化为字符串
# 输出：2024-01-15 10:30:45
```

`datetime.now()` 返回一个 `datetime` 对象，它既不是字符串也不是时间戳整数，而是一个结构化的时间对象。`strftime`（string format time）则把这个对象按你指定的格式转换成可读字符串。两者配合，就是"取时间 → 格式化输出"的标准链路。

### 1.2 基本语法与最小用法

**取当前时间的三种入口**

```python
from datetime import datetime

# 入口一：now()，最常用，返回当前本地时间
dt1 = datetime.now()

# 入口二：today()，等价于 now(tz=None)
dt2 = datetime.today()

# 入口三：带时区的 now，返回 UTC 时间（推荐做法）
from datetime import timezone
dt3 = datetime.now(timezone.utc)
```

**格式化的最小用法**

`strftime(format)` 接收一个格式字符串，其中的 `%` 指令会被替换为对应的时间字段，其余字符原样保留：

```python
from datetime import datetime

now = datetime.now()
print(now.strftime("%Y年%m月%d日 %H时%M分%S秒"))
# 输出：2024年01月15日 10时30分45秒

print(now.strftime("%Y/%m/%d"))
# 输出：2024/01/15
```

关键是理解：`%Y`、`%m`、`%d` 这些以 `%` 开头的占位符是"指令"，`datetime` 会用自身对应字段的值替换它们；而 `年`、`月`、`/` 这些普通字符只是字面量，会原样出现在结果里。这也是 `strftime` 名字的由来——**str**ing **f**ormat **time**，用格式串把时间渲染成字符串。

本篇后续章节会展开：`now` 的各变体差异、`strftime` 的全指令速查表、naive 与 aware 时间的陷阱、ISO 格式、时间戳转换，以及日志、文件名、友好显示等真实场景。

## 2. 核心内容

### 2.1 datetime.now()——取当前本地时间

`datetime.now()` 是获取"现在"最直接的方式。它的完整签名是：

```python
datetime.now(tz=None)
```

- 参数 `tz`：可选的时区对象（`tzinfo` 子类的实例）。不传或传 `None` 时，返回的是当前操作系统的本地时间，且**不带时区信息**（naive datetime）。
- 返回值：一个 `datetime` 对象，精确到微秒。

```python
from datetime import datetime

now = datetime.now()
print(now)
# 输出：2024-01-15 10:30:45.123456
print(repr(now))
# 输出：datetime.datetime(2024, 1, 15, 10, 30, 45, 123456)
```

从 `repr` 可以看到，`datetime` 对象内部就是一组整数：年、月、日、时、分、秒、微秒，再加一个可选的 `tzinfo`。`now()` 不传 `tz` 时，`tzinfo` 为 `None`，也就是"我知道本地是几点，但不记得这属于哪个时区了"——这种对象称为 naive datetime，后面会专门讲它的陷阱。

`now()` 返回的时间从哪来？它读取的是操作系统时钟。在大多数系统上，精度可达微秒，但实际精度取决于平台和硬件时钟分辨率。

**何时用 `now()`**：当你只需要"当前几点几分"用于展示、日志、文件名，且不涉及时区换算时，`now()` 足够。一旦你的时间需要跨时区传递、存储、比较，就应该改用带时区的 `now(timezone.utc)`，详见 2.3。

### 2.2 datetime.today() 与 datetime.utcnow()

`datetime` 类还提供了两个看似同类的方法，理解它们的差异能避免踩坑。

**datetime.today()**

```python
from datetime import datetime

t1 = datetime.now()
t2 = datetime.today()
# 两者都返回当前本地时间，且都是 naive（无时区）
print(t1 == t2)   # 通常为 True（同一瞬间，微秒差异除外）
```

`today()` 等价于 `now(tz=None)`，官方文档也明确说明二者行为一致。实际开发中约定俗成用 `now()`，语义更清晰——"我要的是现在"。

**datetime.utcnow()——已弃用**

```python
from datetime import datetime

# 旧写法（Python 3.12 起弃用）
utc_old = datetime.utcnow()
print(utc_old)
# 输出：2024-01-15 02:30:45.123456
print(utc_old.tzinfo)
# 输出：None
```

`utcnow()` 的致命问题在于：它返回的是 UTC 时间的数值，但 `tzinfo` 仍然是 `None`——一个"数值是 UTC、却没戴时区标签"的 naive 对象。这会导致：

- 它和本地 `now()` 看起来都是 naive，但实际差了几个小时，混用比较时会出错。
- 序列化、反序列化时无法判断这到底是 UTC 还是本地时间。

Python 3.12 起，`datetime.utcnow()` 被标记为 `DeprecationWarning`，正确替代写法是：

```python
from datetime import datetime, timezone

utc_now = datetime.now(timezone.utc)   # aware，带 utc 时区
print(utc_now)
# 输出：2024-01-15 02:30:45.123456+00:00
print(utc_now.tzinfo)
# 输出：datetime.timezone.utc
```

注意输出末尾的 `+00:00`——这正是"aware"的标志，明确告诉任何人这个时间是 UTC。下表总结三者差异：

| 方法 | 返回值 | tzinfo | 是否推荐 |
|------|--------|--------|----------|
| `datetime.now()` | 本地时间 | None（naive） | 纯本地展示可用 |
| `datetime.today()` | 本地时间 | None（naive） | 等价 now，建议统一用 now |
| `datetime.utcnow()` | UTC 数值 | None（naive） | 3.12 弃用，勿用 |
| `datetime.now(timezone.utc)` | UTC 时间 | utc（aware） | 推荐写法 |

### 2.3 datetime.now(timezone.utc)——推荐带时区的写法

**为什么要带时区**

设想这样的场景：你的服务部署在东京（UTC+9），但用户在上海（UTC+8）。日志里如果只写 `10:30:45`，没人知道这是东京时间还是上海时间。带时区的 datetime 在对象层面就携带了"我是哪个时区的时间"这一信息，跨机器、跨时区传递时不会产生歧义。

**UTC 作为存储基准**

最佳实践是：**存储和内部计算一律用 UTC，只在展示给用户时才转成本地时区**。UTC 没有夏令时、没有时区偏移，是最安全的存储格式。

```python
from datetime import datetime, timezone, timedelta

# 1. 取当前 UTC 时间（aware）
utc_now = datetime.now(timezone.utc)
print(utc_now)
# 输出：2024-01-15 02:30:45.123456+00:00

# 2. 转成东八区（上海）时间展示
shanghai_tz = timezone(timedelta(hours=8))
shanghai_now = utc_now.astimezone(shanghai_tz)
print(shanghai_now)
# 输出：2024-01-15 10:30:45.123456+08:00

# 3. 转成东九区（东京）时间展示
tokyo_tz = timezone(timedelta(hours=9))
tokyo_now = utc_now.astimezone(tokyo_tz)
print(tokyo_now)
# 输出：2024-01-15 11:30:45.123456+09:00
```

同一个 UTC 瞬间，用 `astimezone` 可以转成任意时区的本地时间，且每次转换都是 aware 对象，不会丢失时区信息。这就是"存 UTC、按需转"模式的基础。

**now() 与 now(timezone.utc) 的关系**

```python
from datetime import datetime, timezone

local = datetime.now()
utc = datetime.now(timezone.utc)
# local 是 naive，utc 是 aware，二者不能直接比较：
# local == utc  会抛 TypeError 或得到意外结果
# 必须先把 local 变成 aware 或把 utc 转成本地 naive 再比
```

一个常见错误是拿 `datetime.now()`（naive）和 `datetime.now(timezone.utc)`（aware）直接相减，这在某些 Python 版本会抛 `TypeError`，因为 naive 和 aware 不能混合算术。处理时间差时，确保两边都是 aware 或都是 naive。

### 2.4 strftime——格式化为字符串

`strftime(format)` 是把 `datetime` 对象转成字符串的核心方法。名字来自 C 标准库的同名函数，Python 沿用了它的指令体系。

**基本机制**

`format` 是一个普通字符串，其中 `%` 加一个字母的序列是指令，会被替换为 datetime 对应字段的格式化值；其余字符原样保留。如果想输出字面的百分号，用 `%%`。

```python
from datetime import datetime

dt = datetime(2024, 1, 15, 10, 30, 45)

print(dt.strftime("%Y-%m-%d %H:%M:%S"))
# 输出：2024-01-15 10:30:45

print(dt.strftime("%Y/%m/%d"))
# 输出：2024/01/15

print(dt.strftime("现在是 %Y 年 %m 月 %d 日")
# 输出：现在是 2024 年 01 月 15 日

print(dt.strftime("完成度 100%%"))
# 输出：完成度 100%
```

**格式化指令速查表**

下表是 `strftime` 支持的主要指令，按"日期 / 时间 / 星期月份名 / 其他"分组。这是本篇最值得收藏的参考表。

| 指令 | 含义 | 示例（2024-01-15 10:30:45 周一） | 说明 |
|------|------|----------------------------------|------|
| 日期类 | | | |
| `%Y` | 四位年份 | `2024` | 补零到四位 |
| `%y` | 两位年份 | `24` | 00-99，注意千年虫问题 |
| `%m` | 月份 | `01` | 01-12，补零 |
| `%d` | 日 | `15` | 01-31，补零 |
| `%j` | 年内天数 | `015` | 001-366，三位补零 |
| `%U` | 年内周数（周日为周一） | `02` | 00-53 |
| `%W` | 年内周数（周一为周一） | `03` | 00-53 |
| 时间类 | | | |
| `%H` | 24小时制小时 | `10` | 00-23，补零 |
| `%I` | 12小时制小时 | `10` | 01-12，补零 |
| `%M` | 分钟 | `30` | 00-59，补零 |
| `%S` | 秒 | `45` | 00-59，补零 |
| `%f` | 微秒 | `000000` | 六位补零 |
| `%p` | AM/PM | `AM` | 配合 %I 使用 |
| 星期/月份名 | | | |
| `%a` | 星期缩写 | `Mon` | 受 locale 影响 |
| `%A` | 星期全称 | `Monday` | 受 locale 影响 |
| `%b` | 月份缩写 | `Jan` | 受 locale 影响 |
| `%B` | 月份全称 | `January` | 受 locale 影响 |
| 其他 | | | |
| `%c` | 本地日期时间完整表示 | `Mon Jan 15 10:30:45 2024` | 受 locale 影响 |
| `%x` | 本地日期表示 | `01/15/24` | 受 locale 影响 |
| `%X` | 本地时间表示 | `10:30:45` | 受 locale 影响 |
| `%%` | 字面百分号 | `%` | 转义 |
| `%z` | 时区偏移 | `+0800` | aware 对象才有 |
| `%Z` | 时区名称 | `UTC` / `CST` | aware 对象才有 |

**最常用的几个组合**

```python
from datetime import datetime

dt = datetime(2024, 1, 15, 10, 30, 45)

# 标准日期
dt.strftime("%Y-%m-%d")
# 输出：2024-01-15

# 标准时间
dt.strftime("%H:%M:%S")
# 输出：10:30:45

# 日期+时间（日志最常用）
dt.strftime("%Y-%m-%d %H:%M:%S")
# 输出：2024-01-15 10:30:45

# 带毫秒（截断微秒前三位）
dt.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
# 输出：2024-01-15 10:30:45.000

# 文件名安全（无分隔符）
dt.strftime("%Y%m%d_%H%M%S")
# 输出：20240115_103045

# 12小时制带 AM/PM
dt.strftime("%Y-%m-%d %I:%M:%S %p")
# 输出：2024-01-15 10:30:45 AM

# 中文友好显示
dt.strftime("%Y年%m月%d日 %A")
# 输出：2024年01月15日 Monday（默认英文 locale 下）
```

注意 `%I` 和 `%p` 的搭配：`%I` 是 12 小时制的小时（01-12），必须配合 `%p`（AM/PM）才能消除歧义；如果用 `%H`（24 小时制），就不需要 `%p`。

**%Y vs %y 的千年虫陷阱**

```python
from datetime import datetime

dt = datetime(2024, 1, 15)
print(dt.strftime("%y"))
# 输出：24

# 反向解析时，%y 按 POSIX 规则映射到 1969-2068 区间
# 即 "68" → 2068，"69" → 1969
# 生产环境日期格式务必用 %Y 四位年份，避免歧义
```

### 2.5 isoformat——ISO 8601 标准格式

除了 `strftime`，`datetime` 还有一个专门输出 ISO 8601 标准格式的方法 `isoformat()`。ISO 8601 是国际标准日期时间表示法，格式固定、无歧义，非常适合机器间交换和存储。

```python
from datetime import datetime, timezone, timedelta

# naive 对象
dt = datetime(2024, 1, 15, 10, 30, 45)
print(dt.isoformat())
# 输出：2024-01-15T10:30:45

# aware 对象（UTC）
utc_dt = datetime.now(timezone.utc)
print(utc_dt.isoformat())
# 输出：2024-01-15T02:30:45.123456+00:00

# aware 对象（东八区）
shanghai_tz = timezone(timedelta(hours=8))
local_dt = datetime.now(shanghai_tz)
print(local_dt.isoformat())
# 输出：2024-01-15T10:30:45.123456+08:00
```

`isoformat()` 的特点：

- 日期和时间之间用 `T` 分隔（也可传参数 `sep=" "` 改成空格）。
- aware 对象会在末尾附上时区偏移（如 `+08:00`），UTC 用 `+00:00`。
- 微秒为 0 时省略小数部分，否则保留 6 位。

**isoformat vs strftime("%Y-%m-%dT%H:%M:%S")**

```python
from datetime import datetime, timezone

dt = datetime(2024, 1, 15, 10, 30, 45, tzinfo=timezone.utc)

# 手写 strftime 模拟 ISO 格式
print(dt.strftime("%Y-%m-%dT%H:%M:%S%z"))
# 输出：2024-01-15T10:30:45+0000

# isoformat 更规范，偏移带冒号
print(dt.isoformat())
# 输出：2024-01-15T10:30:45+00:00
```

需要 ISO 标准输出时优先用 `isoformat()`，它处理了时区偏移格式、微秒省略等细节，比手写 `strftime` 更可靠。`strftime` 则适合自定义人类可读格式。

### 2.6 时间戳转换：timestamp 与 fromtimestamp

时间戳（timestamp）是自 1970-01-01 00:00:00 UTC 起经过的秒数（浮点数，含小数部分为微秒）。它是跨语言、跨平台通用的时间表示，数据库、API、日志里都常见。

**datetime → 时间戳：timestamp()**

```python
from datetime import datetime, timezone

# naive datetime：按本地时区解释
local_dt = datetime(2024, 1, 15, 10, 30, 45)
ts = local_dt.timestamp()
print(ts)
# 输出：1705285845.0（值取决于你的本地时区）

# aware datetime：按其时区解释
utc_dt = datetime(2024, 1, 15, 2, 30, 45, tzinfo=timezone.utc)
ts2 = utc_dt.timestamp()
print(ts2)
# 输出：1705285845.0
# 同一瞬间的 UTC 和本地时间，timestamp 相同
```

关键点：`timestamp()` 返回的是"绝对瞬间"——无论这个 datetime 是 UTC 还是本地时间，只要它指的是同一时刻，时间戳就相同。naive datetime 在转时间戳时，会按操作系统本地时区来解释，这正是 naive 的隐患所在。

**时间戳 → datetime：fromtimestamp()**

```python
from datetime import datetime, timezone

ts = 1705285845.0

# 不传 tz：返回本地时区的 naive datetime
local_dt = datetime.fromtimestamp(ts)
print(local_dt)
# 输出：2024-01-15 10:30:45

# 传 tz：返回 aware datetime
utc_dt = datetime.fromtimestamp(ts, tz=timezone.utc)
print(utc_dt)
# 输出：2024-01-15 02:30:45+00:00
```

`fromtimestamp` 和 `timestamp` 互为逆运算。注意 `fromtimestamp(ts)` 不传时区时返回的是本地时间 naive 对象，同样有 naive 的隐患；推荐传 `tz=timezone.utc` 得到 aware 对象，再按需 `astimezone` 转换。

**完整往返示例**

```python
from datetime import datetime, timezone

# 1. 取当前 UTC 时间
now_utc = datetime.now(timezone.utc)
print(now_utc)
# 输出：2024-01-15 02:30:45.123456+00:00

# 2. 转时间戳（用于存储/传输）
ts = now_utc.timestamp()
print(ts)
# 输出：1705285845.123456

# 3. 从时间戳恢复（用 UTC 时区，避免本地时区歧义）
restored = datetime.fromtimestamp(ts, tz=timezone.utc)
print(restored)
# 输出：2024-01-15 02:30:45.123456+00:00

# 4. 转成本地时区展示
shanghai = restored.astimezone(timezone(__import__('datetime').timedelta(hours=8)))
print(shanghai.strftime("%Y年%m月%d日 %H:%M:%S"))
# 输出：2024年01月15日 10:30:45
```

### 2.7 naive datetime 与 aware datetime

这是 `datetime` 最容易出错的维度，单独展开。

**定义**

- **naive datetime**：`tzinfo` 为 `None` 的对象。它"不知道自己属于哪个时区"，只是一个年月日时分秒的数值组合。
- **aware datetime**：`tzinfo` 不为 `None` 的对象。它携带了时区信息，能明确回答"这是哪个时区的几点"。

```python
from datetime import datetime, timezone, timedelta

# naive
naive = datetime(2024, 1, 15, 10, 30, 45)
print(naive.tzinfo)
# 输出：None

# aware
tz_shanghai = timezone(timedelta(hours=8))
aware = datetime(2024, 1, 15, 10, 30, 45, tzinfo=tz_shanghai)
print(aware.tzinfo)
# 输出：datetime.timezone(datetime.timedelta(seconds=28800))
```

**判断方法**

```python
from datetime import datetime

dt = datetime.now()
print(dt.tzinfo is None)   # True 表示 naive

# Python 3.9+ 有 utcoffset 方法
print(dt.utcoffset())      # naive 返回 None，aware 返回 timedelta
```

`utcoffset()` 返回 `None` 即 naive，返回 `timedelta` 即 aware，这是程序化判断最可靠的方式。

**混合比较的陷阱**

```python
from datetime import datetime, timezone

naive = datetime(2024, 1, 15, 10, 30, 45)
aware = datetime(2024, 1, 15, 2, 30, 45, tzinfo=timezone.utc)

# 两者其实是同一瞬间（东八区 10:30 == UTC 02:30）
# 但直接比较会抛错：
naive == aware
# 抛出 TypeError: can't compare offset-naive and offset-aware datetimes
```

Python 不允许 naive 和 aware 直接比较——因为它无法判断 naive 到底是哪个时区。解决办法是把两者统一到同一侧：

```python
from datetime import datetime, timezone

naive = datetime(2024, 1, 15, 10, 30, 45)
aware = datetime(2024, 1, 15, 2, 30, 45, tzinfo=timezone.utc)

# 方式一：把 aware 转成本地 naive（假设本地是东八区）
aware_naive = aware.astimezone().replace(tzinfo=None)
print(naive == aware_naive)
# 输出：True（本地时区为东八区时）

# 方式二：把 naive 假设为本地时区再变 aware（需知道本地偏移）
# 推荐方式二用 dateutil 或 zoneinfo，见下文
```

更稳妥的做法是**全程使用 aware datetime**，避免 naive 混入比较。

**算术运算的差异**

```python
from datetime import datetime, timezone, timedelta

# naive 的算术：纯数值加减，不考虑夏令时
naive1 = datetime(2024, 3, 31, 1, 30)   # 假设本地时区有夏令时切换
naive2 = naive1 + timedelta(hours=1)
print(naive2)
# 输出：2024-03-31 02:30:00（纯数值 +1 小时）

# aware 的算术：考虑时区规则（如夏令时跳变）
# 用 zoneinfo 的时区做算术会反映真实的时间流逝
```

naive 的 `+ timedelta` 只是字段数值加减，不反映"真实经过的时间"（在夏令时切换时会有偏差）。aware 配合 `zoneinfo` 时区做算术，才能正确处理夏令时。

**zoneinfo（Python 3.9+）**

`timezone(timedelta(hours=8))` 只能表示固定偏移时区，无法处理夏令时。Python 3.9 内置了 `zoneinfo` 模块，能用系统时区数据库：

```python
from datetime import datetime
from zoneinfo import ZoneInfo

# 用真实时区名创建 aware datetime
tz = ZoneInfo("Asia/Shanghai")
now_shanghai = datetime.now(tz)
print(now_shanghai)
# 输出：2024-01-15 10:30:45.123456+08:00

# 夏令时时区
tz_ny = ZoneInfo("America/New_York")
now_ny = datetime.now(tz_ny)
print(now_ny)
# 输出：2024-01-14 21:30:45.123456-05:00

# 跨时区转换
print(now_shanghai.astimezone(tz_ny))
# 输出：2024-01-14 21:30:45.123456-05:00
```

`zoneinfo` 是处理真实世界时区（含夏令时、历史变更）的推荐方案，`timezone(timedelta(...))` 适合固定偏移的简单场景。

### 2.8 常用格式化场景

理论讲完，看四个真实场景，体会 `now` + `strftime` 在工程中的用法。

**场景一：日志时间戳**

日志里每一条都要带时间，格式通常是 `ISO 8601` 或 `YYYY-MM-DD HH:MM:SS`，便于排序和检索。

```python
from datetime import datetime, timezone

def log(msg, level="INFO"):
    # 用 UTC 时间打日志，避免服务器时区混乱
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{ts}] [{level}] {msg}")

log("服务启动")
log("收到请求", "DEBUG")
log("连接超时", "ERROR")
# 输出：
# [2024-01-15 02:30:45] [INFO] 服务启动
# [2024-01-15 02:30:45] [DEBUG] 收到请求
# [2024-01-15 02:30:45] [ERROR] 连接超时
```

如果需要更精确的时间戳（含毫秒），可以取微秒前三位：

```python
from datetime import datetime, timezone

ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
print(ts)
# 输出：2024-01-15 02:30:45.123
```

`[:-3]` 是因为 `%f` 固定输出 6 位微秒，截掉后 3 位留下毫秒。

**场景二：文件名带日期**

按日期分文件、生成带时间戳的导出文件，用无分隔符格式最安全（避免路径问题）。

```python
from datetime import datetime

# 每日日志文件名
today = datetime.now().strftime("%Y-%m-%d")
log_file = f"/var/log/app_{today}.log"
print(log_file)
# 输出：/var/log/app_2024-01-15.log

# 精确到秒的导出文件名（避免重名）
export_ts = datetime.now().strftime("%Y%m%d_%H%M%S")
backup_file = f"backup_{export_ts}.sql"
print(backup_file)
# 输出：backup_20240115_103045.sql

# 按月归档
month = datetime.now().strftime("%Y-%m")
archive_dir = f"/data/archive/{month}"
print(archive_dir)
# 输出：/data/archive/2024-01
```

文件名用 `%Y%m%d_%H%M%S`（无冒号、无空格）是有意为之——冒号在 Windows 路径里非法，空格在 shell 里需要转义，无分隔符最通用。

**场景三：用户友好的中文显示**

给用户看的日期往往要"2024年1月1日 周一"这样的人话，而不是 `2024-01-01`。

```python
from datetime import datetime

dt = datetime(2024, 1, 15, 10, 30, 45)

# 中文格式
friendly = dt.strftime("%Y年%m月%d日 %H:%M")
print(friendly)
# 输出：2024年01月15日 10:30

# 去掉月份日前导零需要手动处理（strftime 无"不补零"指令）
# 方式：用 %-m / %-d（Linux/macOS 支持，Windows 不支持）
print(dt.strftime("%Y年%-m月%-d日"))
# 输出（Linux/macOS）：2024年1月15日
# Windows 上 %-m 无效，需要用 replace 或先用数值拼接

# 跨平台稳妥写法：用 f-string 拼接数值字段
friendly2 = f"{dt.year}年{dt.month}月{dt.day}日 {dt.hour}:{dt.minute:02d}"
print(friendly2)
# 输出：2024年1月15日 10:30
```

`strftime` 的 `%m`、`%d` 等"数值类"指令**强制补零**，且标准里没有"不补零"的指令。Linux/macOS 上的 `%-m`、`%-d` 是平台扩展，Windows 不支持。要跨平台去掉前导零，最稳妥的是直接读 `dt.month`、`dt.day` 这些整数属性用 f-string 拼。

**中文星期/月份名**

`strftime` 的 `%A`（星期全称）、`%B`（月份全称）输出受 locale 影响，默认是英文。要输出中文需要切换 locale：

```python
import locale
from datetime import datetime

dt = datetime(2024, 1, 15, 10, 30, 45)

# 默认 locale（通常是 C/POSIX，英文）
print(dt.strftime("%A %B"))
# 输出：Monday January

# 切到中文 locale（系统需安装 zh_CN.UTF-8）
try:
    locale.setlocale(locale.LC_TIME, "zh_CN.UTF-8")
    print(dt.strftime("%A %B"))
    # 输出：星期一 一月
finally:
    locale.setlocale(locale.LC_TIME, "")  # 恢复
```

由于 locale 依赖系统安装且是全局状态，生产代码里更推荐**自建映射表**而非依赖 `setlocale`：

```python
from datetime import datetime

WEEKDAYS_CN = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"]
MONTHS_CN = ["一月", "二月", "三月", "四月", "五月", "六月",
             "七月", "八月", "九月", "十月", "十一月", "十二月"]

dt = datetime(2024, 1, 15, 10, 30, 45)
# isoweekday(): 周一=1 ... 周日=7
cn_str = f"{dt.year}年{MONTHS_CN[dt.month - 1]}{dt.day}日 {WEEKDAYS_CN[dt.isoweekday() - 1]}"
print(cn_str)
# 输出：2024年一月15日 星期一
```

这种方式不依赖系统 locale，跨平台稳定，且可控。

**场景四：ISO 8601 用于 API 与存储**

对外 API、数据库时间字段、JSON 序列化，用 ISO 8601 最通用。

```python
from datetime import datetime, timezone
import json

# 模拟一个 API 响应里的时间字段
event_time = datetime.now(timezone.utc)
payload = {
    "event": "user_login",
    "timestamp": event_time.timestamp(),       # 时间戳（数字）
    "iso": event_time.isoformat(),             # ISO 字符串
}
print(json.dumps(payload, indent=2))
# 输出：
# {
#   "event": "user_login",
#   "timestamp": 1705285845.123456,
#   "iso": "2024-01-15T02:30:45.123456+00:00"
# }

# 反序列化恢复（配合 11 篇 strptime 或 fromisoformat）
restored = datetime.fromisoformat(payload["iso"])
print(restored)
# 输出：2024-01-15T02:30:45.123456+00:00
```

`fromisoformat` 是 `isoformat` 的逆运算（Python 3.7+），解析 ISO 格式比手写 `strptime` 更简洁。本篇聚焦"输出"，解析部分见同系列第 11 篇。

## 3. 最佳实践

**一律用 aware，避免 naive 的跨时区歧义**

- 推荐：`datetime.now(timezone.utc)` 或 `datetime.now(ZoneInfo("Asia/Shanghai"))`，永远带着时区。
- 不推荐：`datetime.now()`（naive）用于存储、跨服务器传递、比较。
- 原因：naive 看起来和 aware 数值一样，但 `timestamp()`、比较、算术都隐式依赖"本地时区"假设，换一台时区不同的机器结果就变了。

**存储用 UTC，展示才转本地时区**

- 推荐：数据库、日志、API 传输统一存 UTC（时间戳或 ISO 带 `+00:00`）。前端展示时用 `astimezone` 按用户时区转换。
- 不推荐：存"本地时间字符串"且不带时区，日后无法判断它属于哪个时区。

```python
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

# 存
stored = datetime.now(timezone.utc).isoformat()
# 取并展示
dt = datetime.fromisoformat(stored)
local = dt.astimezone(ZoneInfo("Asia/Shanghai"))
print(local.strftime("%Y-%m-%d %H:%M:%S"))
```

**不要用 utcnow()**

- Python 3.12 起弃用，且它返回 naive 对象。
- 替代：`datetime.now(timezone.utc)`。

**格式化优先 isoformat，展示才用 strftime**

- 机器交换、存储：`isoformat()`，格式固定规范。
- 人类可读展示：`strftime`，按需自定义。
- 原因：手写 ISO 格式的 `strftime` 容易漏时区偏移或冒号格式，`isoformat` 已处理好这些细节。

**文件名用无分隔符格式**

- 推荐：`%Y%m%d_%H%M%S`，避免冒号（Windows 非法）和空格（shell 转义）。
- 不推荐：`%Y-%m-%d %H:%M:%S` 用于文件名。

**跨平台去掉前导零用字段拼接，不用 %-m**

- Linux/macOS 的 `%-m`、`%-d` 是扩展，Windows 不支持。
- 推荐：`f"{dt.month}月{dt.day}日"` 直接用整数属性。
- 原因：保证代码在任何平台跑出一致结果。

**中文星期/月份用自建映射表，不依赖 locale**

- 推荐：`WEEKDAYS_CN[dt.isoweekday() - 1]`。
- 不推荐：`locale.setlocale(LC_TIME, "zh_CN.UTF-8")` 后用 `%A`。
- 原因：locale 依赖系统安装的 locale 数据，且是全局状态，多线程下不安全。

**比较和算术前先确认两边awareness一致**

- naive 与 aware 不能直接比较（抛 `TypeError`）。
- 做 `dt1 - dt2` 前，确保两者都是 aware 或都是 naive；最好都转成 aware UTC。

**timestamp() 与 fromtimestamp() 成对使用**

- 存时间戳时记录它来自 UTC，恢复时用 `fromtimestamp(ts, tz=timezone.utc)`。
- 不建议 `fromtimestamp(ts)` 不传 tz，会变成本地 naive，再次存取可能出错。

**时区用 zoneinfo，不要硬编码固定偏移**

- 推荐：`ZoneInfo("Asia/Shanghai")`，能处理夏令时和历史变更。
- 不推荐：`timezone(timedelta(hours=8))` 用于真实时区场景（夏令时地区会错）。
- 例外：UTC 本身是固定偏移零，`timezone.utc` 完全可以。

## 4. 原理

### 4.1 datetime 对象的内部结构

`datetime` 对象在内部是一组整数字段加一个可选的时区信息。从 `repr` 和属性访问可以看出它的构成：

```python
from datetime import datetime, timezone, timedelta

dt = datetime(2024, 1, 15, 10, 30, 45, 123456, tzinfo=timezone.utc)
print(repr(dt))
# 输出：datetime.datetime(2024, 1, 15, 10, 30, 45, 123456, tzinfo=datetime.timezone.utc)

# 各字段属性
print(dt.year, dt.month, dt.day)        # 2024 1 15
print(dt.hour, dt.minute, dt.second)    # 10 30 45
print(dt.microsecond)                   # 123456
print(dt.tzinfo)                         # UTC
```

底层是 C 实现的结构体，但逻辑上等价于：

```python
class datetime:
    year: int          # 1-9999
    month: int         # 1-12
    day: int           # 1-31
    hour: int          # 0-23
    minute: int        # 0-59
    second: int        # 0-59
    microsecond: int   # 0-999999
    tzinfo: tzinfo | None   # 时区信息对象或 None
```

`tzinfo` 是一个抽象基类，真正的时区对象（如 `timezone.utc`、`ZoneInfo("Asia/Shanghai")`）是它的子类实例，提供 `utcoffset()`、`dst()`、`tzname()` 等方法。`tzinfo` 为 `None` 即 naive，非 `None` 即 aware。

这种"整数字段 + 可选 tzinfo"的设计决定了 naive / aware 的本质差异：naive 只是"一堆数字"，aware 是"一堆数字 + 时区解释规则"。

### 4.2 now() 如何从系统时钟取时间

`datetime.now()` 的执行过程大致是：

1. 调用操作系统的时钟接口获取当前时间。CPython 在 POSIX 系统上调用 `clock_gettime(CLOCK_REALTIME)`，在 Windows 上调用 `GetSystemTimeAsFileTime`，得到的是自 Unix 纪元（1970-01-01 00:00:00 UTC）起的秒数+纳秒。
2. 将这个 UTC 瞬间转换成本地时区的时间字段（年月日时分秒微秒）。本地时区从环境变量 `TZ`、系统配置（`/etc/localtime`）或 C 库的 `localtime` 函数获取。
3. `tz` 参数为 `None` 时，构造 naive datetime（只填数值字段，不挂 tzinfo）。
4. `tz` 参数给出时区对象时，先得到 UTC 瞬间，再用该时区的 `utcoffset` 把数值字段调整到目标时区，并把这个 tzinfo 挂到对象上，得到 aware datetime。

这就解释了几个行为：

- `datetime.now()` 和 `datetime.now(timezone.utc)` 在同一时刻调用，数值字段不同（前者是本地时、后者是 UTC 时），但指的是同一瞬间。
- `datetime.now(timezone.utc)` 比 `datetime.utcnow()` 更正确：前者构造 aware 对象（数值是 UTC、tzinfo 是 utc），后者构造 naive 对象（数值是 UTC、tzinfo 是 None）——后者丢失了"我是 UTC"这个事实。
- 系统时区改变时，`now()` 的结果会随之变化，而 `now(timezone.utc)` 的数值始终是 UTC。

`datetime.today()` 内部就是 `now(tz=None)`，无独立实现。

### 4.3 strftime 的指令替换机制

`strftime` 的工作原理是逐字符扫描 format 字符串：

1. 遇到普通字符（非 `%`）：原样追加到输出。
2. 遇到 `%` 加一个字母的序列：查指令表，取出 datetime 对应字段，按指令要求的格式格式化成字符串，追加到输出。
3. 遇到 `%%`：输出字面 `%`。

例如 `dt.strftime("%Y-%m-%d")` 的处理过程：

- 读到 `%Y` → 取 `dt.year`（2024）→ 格式化为四位字符串 "2024"。
- 读到 `-` → 原样输出 "-"。
- 读到 `%m` → 取 `dt.month`（1）→ 格式化为两位补零 "01"。
- 读到 `-` → 原样输出 "-"。
- 读到 `%d` → 取 `dt.day`（15）→ 格式化为两位补零 "15"。
- 拼接得 "2024-01-15"。

不同指令的字段来源和格式化规则有差异：

- **数值类指令**（`%Y`、`%m`、`%d`、`%H`、`%M`、`%S`、`%j` 等）：直接读对应整数字段，按指定宽度补零。`%Y` 补到 4 位、`%m`/`%d`/`%H`/`%M`/`%S` 补到 2 位、`%j` 补到 3 位、`%f` 补到 6 位。
- **名称类指令**（`%a`、`%A`、`%b`、`%B`、`%p`）：从 `dt.date().weekday()` 或 `dt.month` 等字段算出索引，再查名称表（受 locale 影响选不同语言表）。
- **时区类指令**（`%z`、`%Z`）：调用 `tzinfo.utcoffset()` 和 `tzinfo.tzname()`，naive 对象的 tzinfo 为 None，这些指令返回空字符串。
- **组合类指令**（`%c`、`%x`、`%X`）：等价于一组预设指令的组合，具体格式受 locale 影响。

这个机制解释了：
- 为什么 `%m` 总是补零（格式化阶段固定补零，没有"不补零"指令）。
- 为什么 `%A` 在不同 locale 下输出不同（名称表随 locale 切换）。
- 为什么 naive 对象 `%z` 输出空（tzinfo 为 None，无法提供偏移）。
- 为什么 `%%` 能输出字面 `%`（转义规则）。

### 4.4 isoformat 的格式规则

`isoformat()` 不是用 `strftime` 实现的，而是直接按 ISO 8601 规范构造字符串：

1. 日期部分：`YYYY-MM-DD`，固定 4-2-2 位补零。
2. 分隔符：默认 `T`，可用 `sep` 参数改。
3. 时间部分：`HH:MM:SS`，固定 2-2-2 位补零。
4. 微秒：若 `microsecond != 0`，追加 `.ffffff`（6 位）；为 0 则省略。
5. 时区偏移：aware 对象追加 `+HH:MM` 或 `-HH:MM`；UTC 偏移零可输出 `+00:00`；naive 对象无偏移。

```python
from datetime import datetime, timezone

# 无微秒、naive
print(datetime(2024, 1, 15, 10, 30, 45).isoformat())
# 输出：2024-01-15T10:30:45

# 有微秒、aware UTC
print(datetime(2024, 1, 15, 2, 30, 45, 123456, tzinfo=timezone.utc).isoformat())
# 输出：2024-01-15T02:30:45.123456+00:00
```

`strftime` 手写模拟 ISO 格式时，容易在时区偏移格式（`+0000` vs `+00:00`）、微秒省略等细节上出错，`isoformat` 在 C 层面直接按规范组装，更可靠。

### 4.5 naive 与 aware 在比较和算术上的内部差异

**比较**

两个 datetime 比较时，CPython 先检查双方的 `tzinfo`：

- 都为 None（都 naive）：直接逐字段比较数值。
- 都非 None（都 aware）：先调用 `utcoffset()` 把双方都换算成 UTC 数值，再比较——这样不同时区但同一瞬间的两个 aware 对象判等。
- 一方 None 一方非 None：抛 `TypeError`，因为无法把 naive 归入任何时区。

```python
from datetime import datetime, timezone, timedelta

# 同一瞬间的两个 aware（UTC 和东八区）
a = datetime(2024, 1, 15, 2, 30, tzinfo=timezone.utc)
b = datetime(2024, 1, 15, 10, 30, tzinfo=timezone(timedelta(hours=8)))
print(a == b)
# 输出：True（比较时换算成 UTC，都是 02:30 UTC）

# naive 之间纯数值比较
n1 = datetime(2024, 1, 15, 10, 30)
n2 = datetime(2024, 1, 15, 2, 30)
print(n1 > n2)
# 输出：True（不管时区，10 > 2）
```

**算术**

`dt + timedelta` 的行为取决于 aware / naive：

- naive：直接对数值字段加减，不涉及时区规则。即使本地时区在那段跨度内有夏令时跳变，结果也只是"字面上加了 N 小时"。
- aware 配合真实时区（`ZoneInfo`）：`datetime` 算术是"墙钟时间算术"（wall time arithmetic），即按 datetime 自身时区的本地时间加减，算出结果后再用该时区的 `utcoffset` 重新确定瞬间。遇到夏令时跳变时，跳变那一小时内的结果可能无法对应唯一瞬间（fold/ambiguity）。

```python
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

# 纽约 2024-03-10 凌晨 2 点进入夏令时（时钟跳到 3 点）
tz_ny = ZoneInfo("America/New_York")

# aware 算术：墙钟时间 +1 小时
dt = datetime(2024, 3, 10, 1, 30, tzinfo=tz_ny)   # 夏令时前
dt2 = dt + timedelta(hours=1)
print(dt2)
# 输出：2024-03-10 03:30:00-04:00（夏令时后，墙钟 03:30）

# 真实经过的时间
delta_real = dt2.timestamp() - dt.timestamp()
print(delta_real)
# 输出：3600.0（实际只过了 1 小时，因为夏令时跳变被算术消化）
```

对比 naive 的纯数值算术：

```python
from datetime import datetime, timedelta

# naive，同样的数值
dt = datetime(2024, 3, 10, 1, 30)
dt2 = dt + timedelta(hours=1)
print(dt2)
# 输出：2024-03-10 02:30:00（字面 +1，走到 02:30）
# 但 02:30 在纽约夏令时跳变中是不存在的时刻
# naive 不知道这一点，照算不误
```

这种差异是 naive / aware 最核心的内部区别：aware 携带的 tzinfo 让算术和比较都能"按真实时间规则"进行，而 naive 只是一组孤立的数字。

### 4.6 timestamp() 与 fromtimestamp() 的换算原理

`timestamp()` 把 datetime 换成 Unix 时间戳的过程：

1. 若 aware：用 `tzinfo.utcoffset()` 得到相对 UTC 的偏移，把本地字段数值减去偏移得到 UTC 字段，再算自 1970-01-01 UTC 起的总秒数。
2. 若 naive：假设它属于**操作系统本地时区**，调用 C 库的 `mktime` 来算时间戳——`mktime` 用系统本地时区信息解释 naive 的数值。换台时区不同的机器，同一个 naive 的 `timestamp()` 结果不同。

```python
from datetime import datetime

naive = datetime(2024, 1, 15, 10, 30, 45)
# 在东八区机器上
print(naive.timestamp())
# 输出：1705285845.0

# 同一对象在 UTC 机器上会输出 1705314645.0（差 8 小时）
```

`fromtimestamp(ts, tz=None)` 是反过程：

1. `ts` 是 UTC 纪元起的秒数，这是绝对瞬间。
2. 不传 `tz`：调用 C 库的 `localtime` 把这个瞬间转成本地时区字段，构造 naive 对象。换机器时区，结果数值不同。
3. 传 `tz`：把瞬间转换成 `tz` 时区的字段，构造 aware 对象，挂上这个 tzinfo。结果是确定的，与时区无关。

```python
from datetime import datetime, timezone

ts = 1705285845.0

# 不传 tz：本地时区 naive
print(datetime.fromtimestamp(ts))
# 东八区机器输出：2024-01-15 10:30:45
# UTC 机器输出：2024-01-15 02:30:45

# 传 UTC：确定的 aware
print(datetime.fromtimestamp(ts, tz=timezone.utc))
# 任何机器都输出：2024-01-15 02:30:45+00:00
```

这就是为什么"存时间戳、恢复时传 UTC 时区"是最稳妥的数据交换方式——它彻底绕开了操作系统的本地时区依赖。

## 5. 总结

### 5.1 本文内容要点

- `datetime.now()` 返回当前本地时间的 naive datetime，适合纯本地展示。
- `datetime.today()` 等价 `now(tz=None)`，约定俗成用 `now()`。
- `datetime.utcnow()` 已在 3.12 弃用，返回的 naive UTC 对象有歧义，勿用。
- `datetime.now(timezone.utc)` 返回 aware UTC 时间，是推荐的"取现在"写法。
- `strftime(format)` 按 `%` 指令把 datetime 渲染成字符串；指令分日期类、时间类、名称类、时区类、组合类，名称类受 locale 影响。
- `isoformat()` 输出 ISO 8601 标准格式，适合机器交换和存储，比手写 strftime 更可靠。
- `timestamp()` / `fromtimestamp()` 实现 datetime 与 Unix 时间戳互转；naive 在转时间戳时隐式按本地时区解释。
- naive datetime（无 tzinfo）vs aware datetime（有 tzinfo）：naive 不能与 aware 直接比较；aware 算术与比较能反映真实时区规则（含夏令时），naive 只是数值加减。
- `zoneinfo`（Python 3.9+）提供真实时区数据库，是处理夏令时和历史时区变更的推荐方案。
- 实战场景：日志时间戳用 UTC + `strftime`、文件名用无分隔符格式、用户友好显示用 f-string 拼接中文字段、API 与存储用 ISO 格式或时间戳。

### 5.2 读完应能掌握

- 能说出 `datetime.now()`、`datetime.today()`、`datetime.utcnow()`、`datetime.now(timezone.utc)` 四者的区别，并知道为何推荐最后一种。
- 能用 `strftime` 配合常用指令（`%Y %m %d %H %M %S %A %B %j %p %z` 等）把 datetime 格式化成任意目标字符串，且能查阅速查表使用不常用指令。
- 能用 `isoformat()` 输出标准 ISO 8601 字符串，并说明它与手写 `strftime` 模拟 ISO 格式的差异。
- 能在 datetime 与 Unix 时间戳之间用 `timestamp()` / `fromtimestamp()` 正确互转，且知道何时该传 `tz=timezone.utc`。
- 能判断一个 datetime 是 naive 还是 aware，能解释二者在比较与算术上的行为差异，并知道混合比较会抛 `TypeError`。
- 能为日志、文件名、中文友好显示、API 序列化四个场景各写出正确的"取时间 + 格式化"代码。
- 能说明 `strftime` 指令替换、`isoformat` 格式构造、`timestamp` 本地时区换算的内部原理。
- 能在代码中贯彻"存储用 UTC aware、展示才转本地时区"的最佳实践，避免 naive 跨时区陷阱。