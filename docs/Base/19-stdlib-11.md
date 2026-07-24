---
group:
  title: 【19】标准库精讲
  order: 19
order: 11
title: datetime.strptime：解析字符串为 datetime 对象
nav:
  title: Python
  order: 1
---

## 1. 介绍

### 1.1 什么是 strptime

在上一篇里，我们用 `datetime.strftime` 把一个 `datetime` 对象按指定格式"拼"成了一个人类可读的字符串——这是"时间对象 → 字符串"的方向。本篇讲的是反方向：手里只有一段字符串（比如从日志、CSV、用户表单或第三方接口拿到的 `"2024-01-15 12:30:45"`），怎么把它还原成一个 `datetime` 对象，以便做时间差计算、时区转换、比较排序等操作。这个"字符串 → 时间对象"的解析工作，就由 `datetime.strptime` 完成。

`strptime` 这个名字来自 C 标准库的 `strptime` 函数，是 "string parse time" 的缩写；与之相对的 `strftime` 是 "string format time"。两者共享同一套 `%` 指令（`%Y`、`%m`、`%d`、`%H`、`%M`、`%S`……），只是方向相反：`strftime` 用这些指令做"占位符"去拼接输出字符串，`strptime` 用这些指令做"匹配规则"去解析输入字符串。换句话说，`strptime` 与 `strftime` 互为逆运算——在格式对应的前提下，`datetime.strptime(dt.strftime(fmt), fmt)` 应当还原出原来的 `dt`。

`strptime` 是 `datetime.datetime` 类的类方法（classmethod），不需要实例化就能调用：`datetime.strptime(date_string, format)`。它返回一个新的 `datetime` 对象。解析过程是严格的：格式串里的每一个字符（包括分隔符 `-`、`:`、空格、`T` 等）都必须与待解析字符串里对应位置的字符一一对应，任何一个 `%` 指令所辖的字段值取不到合法整数（比如月份出现 `13`、2 月出现 `30` 号）都会抛 `ValueError`。这种"严格匹配"的特性使得 `strptime` 既可靠（不会悄悄把你认为是 5 月的日期解析成 4 月），也挑剔（格式和字符串稍有出入就拒绝）。

### 1.2 本篇涉及的核心 API 速览

下表列出本篇会详细讲解的 API 与对比对象，先建立整体印象。

| API | 所属 | 作用 |
|-----|------|------|
| `datetime.strptime(date_string, format)` | 标准库 `datetime` | 按指定格式把字符串解析成 `datetime` 对象 |
| `datetime.strftime(fmt)` | 标准库 `datetime` | 把 `datetime` 对象格式化成字符串，`strptime` 的逆运算 |
| `dateutil.parser.parse(timestr)` | 第三方 `python-dateutil` | 自动推断格式解析字符串，宽容但有歧义 |
| `_strptime_time` | `datetime` 内部 C 模块 | 实际执行解析与缓存的底层实现 |

本篇重点讲 `strptime` 本身的用法、格式指令的匹配规则、解析失败的处理、常见格式与陷阱，并简要对比 `dateutil.parser.parse` 的"傻瓜解析"。

### 1.3 最小用法示例

先用最小示例感受 `strptime` 的基本用法：把一段 `"YYYY-MM-DD"` 形式的字符串解析成 `datetime` 对象。

```python
from datetime import datetime

dt = datetime.strptime("2024-01-15", "%Y-%m-%d")
print(dt)
print(type(dt))
print(dt.year, dt.month, dt.day)
```

运行结果：

```
# 输出：
# 2024-01-15 00:00:00
# <class 'datetime.datetime'>
# 2024 1 15
```

可以看到，字符串里只有年月日，所以解析出来的 `datetime` 对象的时、分、秒被默认填成 `0`。格式串 `"%Y-%m-%d"` 里的两个 `-` 必须和输入字符串里的两个 `-` 一一对应，否则就会报错。

再看一个与 `strftime` 互为逆运算的完整闭环：

```python
from datetime import datetime

fmt = "%Y/%m/%d %H:%M:%S"
original = datetime(2024, 1, 15, 12, 30, 45)

# 对象 → 字符串
s = original.strftime(fmt)
print("格式化结果:", s)

# 字符串 → 对象（逆运算）
back = datetime.strptime(s, fmt)
print("还原结果:", back)
print("是否还原成功:", original == back)
```

运行结果：

```
# 输出：
# 格式化结果: 2024/01/15 12:30:45
# 还原结果: 2024-01-15 12:30:45
# 是否还原成功: True
```

这个闭环是 `strptime` 最本质的特征：给定一个格式和一个字符串，只要两者对应，就能精确还原出时间对象。本篇剩下的内容都在讲"怎么保证对应"以及"不对应时会怎样"。

## 2. 核心内容

### 2.1 strptime 的函数签名与基本语义

`strptime` 是 `datetime.datetime` 类的类方法，签名如下：

```python
@classmethod
def strptime(cls, date_string: str, format: str) -> datetime
```

**参数含义**：

- `date_string`：待解析的时间字符串，必须是 `str` 类型。如果是 `bytes`，需要先 `decode` 成字符串；如果是其他类型（比如 `int` 时间戳），不能直接传给 `strptime`，应改用 `datetime.fromtimestamp`。
- `format`：格式串，由 `%` 指令和普通字面字符组成。`%` 指令告诉解析器"这里期望出现一个什么字段"（四位年、两位月、两位日……），普通字面字符（`-`、`/`、`:`、空格、`T` 等）则要求输入字符串在对应位置必须出现完全相同的字符。

**返回值**：一个新的 `datetime` 对象。如果格式串里没有时区相关指令（`%z`、`%Z`），返回的 `datetime` 是 naive（不带时区信息）的；如果含 `%z`，则返回 aware（带 `tzinfo`）的 `datetime`。

**失败行为**：只要格式与字符串对不上，或者解析出的字段值不合法，立即抛 `ValueError`，不会"尽力而为"地返回部分结果。常见的两类错误信息是：

- `ValueError: time data "..." does not match format "%Y-%m-%d"`——字符串与格式结构不匹配（分隔符对不上、字段宽度对不上等）。
- `ValueError: day is out of range for month` 或 `ValueError: unconverted data remains`——结构匹配上了，但数值不合法（2 月 30 号）或字符串末尾有多余字符。

下面用一个 demo 把这几种情况都演示一遍：

```python
from datetime import datetime

# 正常解析
ok = datetime.strptime("2024-03-08", "%Y-%m-%d")
print("正常:", ok)

# 分隔符不匹配：字符串用 / 但格式用 -
try:
    datetime.strptime("2024/03/08", "%Y-%m-%d")
except ValueError as e:
    print("分隔符不匹配:", e)

# 字段宽度不匹配：%Y 要求四位年，字符串只有两位
try:
    datetime.strptime("24-03-08", "%Y-%m-%d")
except ValueError as e:
    print("年份宽度不匹配:", e)

# 数值不合法：2 月 30 号
try:
    datetime.strptime("2024-02-30", "%Y-%m-%d")
except ValueError as e:
    print("非法日期:", e)

# 末尾有多余字符
try:
    datetime.strptime("2024-03-08extra", "%Y-%m-%d")
except ValueError as e:
    print("多余字符:", e)
```

运行结果：

```
# 输出：
# 正常: 2024-03-08 00:00:00
# 分隔符不匹配: time data '2024/03/08' does not match format '%Y-%m-%d'
# 年份宽度不匹配: time data '24-03-08' does not match format '%Y-%m-%d'
# 非法日期: day is out of range for month
# 多余字符: unconverted data remains: extra
```

这五种结果几乎涵盖了你日常会遇到的所有 `strptime` 异常。理解它们的成因比死记错误信息更重要——后面原理章会逐条说明解析器是怎么走到这些错误的。

### 2.2 format 指令详解：与 strftime 共享同一套语法

`strptime` 使用的 `%` 指令与 `strftime` 完全相同。上一篇里你已经见过 `strftime` 用这些指令拼字符串，本篇重点针对"解析方向"说明每个指令对输入字符串的要求。下面按"常用程度"分组列出。

**最常用的日期与时间指令**：

| 指令 | 含义 | strptime 对输入的要求 | 示例输入 | 示例值 |
|------|------|------------------------|----------|--------|
| `%Y` | 四位年份（如 2024） | 必须匹配 4 位数字（不足 4 位会报错） | `"2024"` | `year=2024` |
| `%y` | 两位年份（如 24） | 匹配 2 位数字，按 POSIX 规则推断世纪（00–68 → 2000–2068，69–99 → 1969–1999） | `"24"` | `year=2024` |
| `%m` | 两位月份 | 01–12，前导零可省略（CPython 实现允许 1 位或 2 位） | `"01"` / `"1"` | `month=1` |
| `%d` | 两位日 | 01–31，受月份与闰年约束 | `"08"` / `"8"` | `day=8` |
| `%H` | 24 小时制小时 | 00–23 | `"14"` | `hour=14` |
| `%I` | 12 小时制小时 | 01–12 | `"02"` | `hour=2`（需配合 `%p` 区分上下午） |
| `%M` | 分钟 | 00–59 | `"30"` | `minute=30` |
| `%S` | 秒 | 00–61（允许闰秒） | `"45"` | `second=45` |
| `%p` | AM/PM 标识 | `AM` 或 `PM`（locale 相关） | `"PM"` | 配合 `%I` 把小时转为 24 小时制 |
| `%z` | 时区偏移 | 形如 `+0800`、`-0530`、`+08:00`（3.7+ 支持冒号） | `"+0800"` | `tzinfo=timezone(timedelta(hours=8))` |
| `%Z` | 时区名称 | 如 `UTC`、`CST`；解析时只识别 `UTC`/`GMT`/空，其余大多数被忽略 | `"UTC"` | `tzinfo=timezone.utc` |

**locale 相关的名称指令**：

| 指令 | 含义 | 说明 |
|------|------|------|
| `%b` | 月份缩写 | `Jan`、`Feb`……`Dec`，locale 相关 |
| `%B` | 月份全称 | `January`……`December`，locale 相关 |
| `%a` | 星期缩写 | `Mon`、`Tue`……`Sun` |
| `%A` | 星期全称 | `Monday`……`Sunday` |
| `%c` | locale 的日期时间表示 | 解析时较脆弱，不建议用于 strptime |

**两个特殊指令**：

- `%%`：匹配字面意义上的百分号字符 `%`。在格式串里写 `%%` 表示"这里期望出现一个 `%` 字符"。
- `%f`：微秒，6 位数字（000000–999999）。`strptime` 接受 1–6 位数字（不足 6 位右侧补零）。

下面用 demo 演示这些指令在解析方向的行为：

```python
from datetime import datetime

# %Y 四位年 vs %y 两位年
a = datetime.strptime("2024-05-01", "%Y-%m-%d")
b = datetime.strptime("24-05-01", "%y-%m-%d")
print("%Y:", a.year, "| %y:", b.year)

# 英文月份缩写 %b 和全称 %B
c = datetime.strptime("Jan 01, 2024", "%b %d, %Y")
d = datetime.strptime("January 01, 2024", "%B %d, %Y")
print("%b:", c, "| %B:", d)

# 12 小时制 %I + %p
e = datetime.strptime("02:30:45 PM", "%I:%M:%S %p")
print("%I+%p:", e.hour, e.minute, e.second)

# 微秒 %f（1-6 位都可）
f1 = datetime.strptime("12:00:00.5", "%H:%M:%S.%f")
f2 = datetime.strptime("12:00:00.123456", "%H:%M:%S.%f")
print("微秒 1 位:", f1.microsecond, "| 6 位:", f2.microsecond)

# 字面 % 用 %%
g = datetime.strptime("100%", "%d%%")
print("字面百分号:", g)
```

运行结果：

```
# 输出：
# %Y: 2024 | %y: 2024
# %b: 2024-01-01 00:00:00 | %B: 2024-01-01 00:00:00
# %I+%p: 14 30 45
# 微秒 1 位: 500000 | 6 位: 123456
# 字面百分号: 1900-01-100 00:00:00
```

最后一行 `1900-01-100` 看起来有点怪——这是因为 `%d` 把 `"100"` 的前两位 `"10"` 当作日解析了，剩下的 `"0"` 和后面的 `%%` 没对上，实际上这条会因 `unconverted data remains` 报错。正确的"匹配带百分号的字符串"很少见，这里只是演示 `%%` 的语义，真实场景中要避免让 `%d` 与字面数字直接相邻产生歧义。

**locale 提醒**：`%b`、`%B`、`%a`、`%A`、`%p` 以及 `%c`、`%x`、`%X` 都是 locale 相关的。在中文 Windows 上，`%b` 可能匹配的是中文月份名而不是 `Jan`。如果想让这段脚本在任何机器上都能解析英文月份名，需要先设置 locale：

```python
import locale
from datetime import datetime

# 临时切换到英文 locale（不同平台名称不同， Linux 用 "en_US.UTF-8"）
try:
    locale.setlocale(locale.LC_TIME, "english")
    m = datetime.strptime("Jan 01, 2024", "%b %d, %Y")
    print("英文月份解析:", m)
finally:
    locale.setlocale(locale.LC_TIME, "")  # 恢复默认
```

运行结果：

```
# 输出：
# 英文月份解析: 2024-01-01 00:00:00
```

由于 locale 名称跨平台不一致且会影响全局状态，工程实践中更推荐：要么统一用纯数字格式（`%Y-%m-%d`）规避 locale 依赖，要么用后面要讲的 `dateutil.parser.parse` 做一次性容错解析。

### 2.3 常见格式的解析实践

掌握了指令表，下面针对几种最常见的真实字符串格式给出解析写法。每种格式都标注了它的典型来源场景，方便你遇到时直接套用。

**格式一：ISO 日期 `2024-01-15`**

最常见的国际通用格式，来自数据库 `DATE` 字段、CSV 导出、API 返回。

```python
from datetime import datetime

s = "2024-01-15"
dt = datetime.strptime(s, "%Y-%m-%d")
print(dt)
# 输出：2024-01-15 00:00:00
```

**格式二：带时间的本地格式 `2024/01/15 12:30:45`**

日志文件、国产系统常输出这种用 `/` 分隔的格式。

```python
from datetime import datetime

dt = datetime.strptime("2024/01/15 12:30:45", "%Y/%m/%d %H:%M:%S")
print(dt)
print("小时:", dt.hour, "秒:", dt.second)
# 输出：
# 2024-01-15 12:30:45
# 小时: 12 秒: 45
```

**格式三：英文月份缩写 `Jan 15, 2024`**

英文 RSS、新闻 feed、邮件头常见。

```python
import locale
from datetime import datetime

# 确保能匹配 Jan（Windows 用 "english"，Linux 用 "en_US.UTF-8"）
locale.setlocale(locale.LC_TIME, "english")
dt = datetime.strptime("Jan 15, 2024", "%b %d, %Y")
print(dt)
# 输出：2024-01-15 00:00:00
locale.setlocale(locale.LC_TIME, "")
```

**格式四：ISO 8601 带时区 `2024-01-15T12:30:45+08:00`**

REST API、ISO 8601、`datetime.isoformat()` 输出的标准格式。用 `%z` 解析时区偏移。

```python
from datetime import datetime

dt = datetime.strptime("2024-01-15T12:30:45+08:00", "%Y-%m-%dT%H:%M:%S%z")
print(dt)
print("时区:", dt.tzinfo)
print("UTC 偏移:", dt.utcoffset())
# 输出：
# 2024-01-15 12:30:45+08:00
# 时区: UTC+08:00
# UTC 偏移: 8:00:00
```

这里 `%z` 同时支持 `+0800`、`+08:00` 两种写法（自 Python 3.7 起）。解析后得到的 `dt` 是 aware 的，可以直接与其它 aware datetime 做比较或运算。

**格式五：带毫秒/微秒 `2024-01-15 12:30:45.123456`**

数据库 `DATETIME`、高精度日志常见。

```python
from datetime import datetime

dt = datetime.strptime("2024-01-15 12:30:45.123456", "%Y-%m-%d %H:%M:%S.%f")
print(dt)
print("微秒:", dt.microsecond)
# 输出：
# 2024-01-15 12:30:45.123456
# 微秒: 123456
```

**格式六：仅时间 `12:30:45`**

只关心时间、不关心日期的场景（如排班表）。解析后日期默认为 `1900-01-01`。

```python
from datetime import datetime

t = datetime.strptime("12:30:45", "%H:%M:%S")
print(t)
print("默认日期:", t.year, t.month, t.day)
# 输出：
# 1900-01-01 12:30:45
# 默认日期: 1900 1 1
```

注意这个 `1900-01-01` 是 C 标准库的"零点"约定，不是真实日期。如果你的逻辑依赖日期部分，记得显式补上真实日期，不要直接拿这个默认值入库。

### 2.4 解析失败的处理：ValueError 与容错策略

`strptime` 是严格解析器，任何不匹配都抛 `ValueError`。在处理真实数据（尤其是用户输入、外部文件）时，必须把解析包在 `try` 里，并决定失败后的兜底策略。

**最常见的四种失败原因**：

1. **结构不匹配**：分隔符、字段顺序、字段宽度对不上。比如格式是 `%Y-%m-%d` 但字符串是 `2024/01/01`。
2. **数值越界**：结构对了但值不合法，如 `2024-02-30`、`2024-13-01`、`25:00:00`。
3. **末尾有多余字符**：`%Y-%m-%d` 解析完 `"2024-01-01"` 后，字符串还剩 ` extra` 没消费。
4. **locale 不匹配**：用 `%b` 解析 `"Jan"` 但当前 locale 是中文，找不到对应月份名。

**兜底策略一：直接跳过坏数据（日志批量解析场景）**

处理日志时，个别行格式异常是常态，不应让一行坏数据中断整个批处理。

```python
from datetime import datetime

raw_lines = [
    "2024-01-15 12:30:45 INFO  start",
    "2024-01-15 12:31:02 ERROR timeout",   # 故意把分隔符改错
    "2024-01-15/12:31:10 WARN retry",       # 用 / 分隔日期时间
    "2024-01-15 12:31:30 INFO  done",
]

fmt = "%Y-%m-%d %H:%M:%S"
parsed = []
skipped = 0
for line in raw_lines:
    # 只取前 19 个字符作为时间字段，避开后面的日志级别和正文
    ts = line[:19]
    try:
        dt = datetime.strptime(ts, fmt)
        parsed.append(dt)
    except ValueError:
        skipped += 1

print("成功解析:", len(parsed), "条")
print("跳过:", skipped, "条")
print("第一条:", parsed[0])
# 输出：
# 成功解析: 3 条
# 跳过: 1 条
# 第一条: 2024-01-15 12:30:45
```

那条 `2024-01-15/12:31:10` 因为日期和时间之间用了 `/` 而非空格，与格式不匹配，被跳过。实际工程中，被跳过的行可以写入"坏数据"文件待人工排查。

**兜底策略二：多格式尝试**

当输入数据来源多样、格式不统一时，可以按优先级依次尝试一组候选格式，命中即返回。

```python
from datetime import datetime

CANDIDATES = [
    "%Y-%m-%d %H:%M:%S",   # 2024-01-15 12:30:45
    "%Y/%m/%d %H:%M:%S",   # 2024/01/15 12:30:45
    "%Y-%m-%dT%H:%M:%S",   # ISO 无时区
    "%Y-%m-%d",            # 仅日期
    "%b %d, %Y",           # Jan 15, 2024
]

def parse_any(s):
    for fmt in CANDIDATES:
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    raise ValueError(f"无候选格式能解析: {s!r}")

for s in ["2024-01-15 12:30:45", "2024/01/15 12:30:45", "Jan 15, 2024", "2024-01-15"]:
    print(parse_any(s))
# 输出：
# 2024-01-15 12:30:45
# 2024-01-15 12:30:45
# 2024-01-01 00:00:00
# 2024-01-15 00:00:00
```

（`"Jan 15, 2024"` 能否匹配 `%b` 仍取决于 locale，在中文 locale 下需要额外处理。）这种"多格式探测"其实就是 `dateutil.parser.parse` 内部做的事，只不过它更宽容、覆盖面更广，下面马上对比。

### 2.5 对比 dateutil.parser.parse：傻瓜解析 vs 显式格式

标准库 `strptime` 要求你必须提前写好格式串，这在对付"格式五花八门、事先不知道长啥样"的数据时很烦。第三方库 `python-dateutil` 提供的 `parser.parse` 则是"傻瓜解析"——你把字符串丢给它，它自动推断格式并返回 `datetime`。

**安装**：

```bash
pip install python-dateutil
```

**基本用法**：

```python
from dateutil import parser

# 不用写格式串，自动推断
print(parser.parse("2024-01-15"))
print(parser.parse("2024/01/15 12:30:45"))
print(parser.parse("Jan 15, 2024"))
print(parser.parse("2024-01-15T12:30:45+08:00"))
# 输出：
# 2024-01-15 00:00:00
# 2024-01-15 12:30:45
# 2024-01-15 00:00:00
# 2024-01-15 12:30:45+08:00
```

同一个函数，四种格式都能吃下，看起来非常舒服。但"宽容"是一把双刃剑：

**歧义问题：`01-02-2024` 到底是 1 月 2 日还是 2 月 1 日？**

`parser.parse` 默认遵循"月在前、日在后"的美式惯例（`monthfirst=True`），所以 `"01-02-2024"` 被解析成 1 月 2 日。但欧洲习惯是日在前。你可以用 `dayfirst=True` 切换：

```python
from dateutil import parser

print(parser.parse("01-02-2024"))                 # 默认：1月2日
print(parser.parse("01-02-2024", dayfirst=True))   # 欧洲：2月1日
# 输出：
# 2024-01-02 00:00:00
# 2024-02-01 00:00:00
```

而 `strptime` 因为格式串 `%m-%d-%Y` 或 `%d-%m-%Y` 是你显式指定的，根本不存在这种"猜"的成分，写法不同会得到不同结果，但每一步都是可预测的。

**性能差异**

`parser.parse` 内部要尝试大量候选格式、做模糊匹配，单次解析比 `strptime` 慢一个数量级左右。在批量解析上万条日志时，差距会被放大。下面用一个简单对比感受一下：

```python
import time
from datetime import datetime
from dateutil import parser

data = ["2024-01-15 12:30:45"] * 20000

# strptime：显式格式
t0 = time.perf_counter()
for s in data:
    datetime.strptime(s, "%Y-%m-%d %H:%M:%S")
t1 = time.perf_counter()
print(f"strptime: {t1 - t0:.3f}s")

# dateutil：自动推断
t0 = time.perf_counter()
for s in data:
    parser.parse(s)
t1 = time.perf_counter()
print(f"dateutil: {t1 - t0:.3f}s")
# 输出（具体数字随机器而定，量级关系稳定）：
# strptime: 0.025s
# dateutil: 0.180s
```

**选用建议**：

| 场景 | 推荐 | 原因 |
|------|------|------|
| 格式固定、批量大 | `strptime` | 快、可控、无歧义 |
| 格式未知、一次性脚本、容错解析 | `parser.parse` | 省去写格式串的成本 |
| 含歧义（日月不分）的国际化数据 | `strptime` 显式指定 | 避免 `parser.parse` 猜错 |
| 需要精确还原（与 `strftime` 闭环） | `strptime` | 显式格式是契约 |

一句话总结：`strptime` 是"我告诉你格式，你严格按格式解析"，`parser.parse` 是"你自己猜格式，猜错算我的"。生产代码优先用前者，探查性脚本可以用后者。

### 2.6 批量解析日志时间字段

这是 `strptime` 最典型的工程场景。下面模拟一段 Nginx 风格的访问日志，提取每条的时间戳，解析成 `datetime`，再统计时间跨度。

```python
from datetime import datetime

# 模拟日志：IP - - [dd/Mon/YYYY:HH:MM:SS +0800] "METHOD /path" code size
logs = [
    '10.0.0.1 - - [15/Jan/2024:12:30:45 +0800] "GET /api HTTP/1.1" 200 5123',
    '10.0.0.2 - - [15/Jan/2024:12:31:02 +0800] "POST /login HTTP/1.1" 401 89',
    '10.0.0.1 - - [15/Jan/2024:12:31:55 +0800] "GET /static HTTP/1.1" 304 0',
    '10.0.0.3 - - [15/Jan/2024:12:32:10 +0800] "GET /api HTTP/1.1" 500 24',
]

# Nginx 时间格式：15/Jan/2024:12:30:45 +0800
fmt = "%d/%b/%Y:%H:%M:%S %z"

records = []
for line in logs:
    # 用方括号定位时间字段
    start = line.index("[") + 1
    end = line.index("]")
    ts = line[start:end]
    dt = datetime.strptime(ts, fmt)
    records.append(dt)

# 统计时间跨度
earliest = min(records)
latest = max(records)
span = latest - earliest
print("最早:", earliest)
print("最晚:", latest)
print("跨度:", span)
print("条数:", len(records))
# 输出：
# 最早: 2024-01-15 12:30:45+08:00
# 最晚: 2024-01-15 12:32:10+08:00
# 跨度: 0:01:25
# 条数: 4
```

解析出 aware datetime 后，即便日志来自不同时区（比如部分行是 `+0000`），也能在统一的时间轴上正确排序和求差。这正是 `strptime` + `%z` 的价值所在：把带时区的字符串变成可计算的对象。

**注意**：`%b` 匹配英文月份缩写仍受 locale 影响。在 Linux 服务器上若 locale 不是 `en_US`，解析 `Jan` 可能失败。生产环境批处理日志前，通常先 `locale.setlocale(locale.LC_TIME, "C")` 或改用纯数字格式预处理。

### 2.7 strptime 比 split 拼装更稳健

在没接触 `strptime` 之前，不少初学者会用字符串 `split` + `int()` 手工拼装 datetime：

```python
from datetime import datetime

# ❌ 不推荐：手工 split 拼装
def parse_naive(s):
    parts = s.split(" ")
    y, m, d = parts[0].split("-")
    H, M, S = parts[1].split(":")
    return datetime(int(y), int(m), int(d), int(H), int(M), int(S))

# ✅ 推荐：strptime
def parse_proper(s):
    return datetime.strptime(s, "%Y-%m-%d %H:%M:%S")

s = "2024-01-15 12:30:45"
print(parse_naive(s))
print(parse_proper(s))
# 输出：
# 2024-01-15 12:30:45
# 2024-01-15 12:30:45
```

表面看结果一样，但 `split` 拼装有几个隐患：

1. **不校验合法性**。`parse_naive("2024-02-30 12:30:45")` 会在调用 `datetime(...)` 构造时抛 `ValueError`，错误信息指向 `day is out of range`；但如果你漏传日期参数、或字段顺序写错（把月当成年），错误可能更隐蔽。`strptime` 的校验是内置且统一的。
2. **格式描述即文档**。`"%Y-%m-%d %H:%M:%S"` 一眼就能看出期望的字符串长什么样；`split(" ")` + `split("-")` 要读完整个函数体才能逆推出格式。
3. **格式一变就得改逻辑**。如果日志格式从 `-` 分隔换成 `/` 分隔，`split` 版要改多处；`strptime` 版只改格式串一个地方。
4. **扩展性差**。要加时区、微秒、英文月份名，`split` 版越写越乱；`strptime` 只是多写一个 `%z`、`%f`、`%b`。

所以只要字符串有明确格式，一律用 `strptime`，把 `split` 留给那些真正没有结构、只能逐字符切的场景。

### 2.8 与 strftime 的逆运算关系

前面反复提到 `strptime` 与 `strftime` 互为逆运算，这里用一个闭环 demo 把这个关系讲透，并指出一个常见的认知误区。

**正确闭环**：

```python
from datetime import datetime

fmt = "%Y-%m-%d %H:%M:%S"
original = datetime(2024, 1, 15, 12, 30, 45)

# 对象 → 字符串
s = original.strftime(fmt)
# 字符串 → 对象
back = datetime.strptime(s, fmt)

assert original == back
print("闭环验证通过:", back)
# 输出：闭环验证通过: 2024-01-15 12:30:45
```

**认知误区：格式串能在两个方向通用，不等于所有字符串都能被同格式解析回去**

`strftime` 是"对象 → 字符串"，对象的所有字段都有确定值，格式串只是决定显示哪些、怎么显示，不会失败。但 `strptime` 是"字符串 → 对象"，字符串必须"恰好"落在格式串描述的形状里。一个典型的例子是 `%c`（locale 的默认日期时间表示）：`dt.strftime("%c")` 能输出字符串，但 `datetime.strptime(dt.strftime("%c"), "%c")` 经常失败，因为 `%c` 输出的字符串里可能含有 `%c` 没在解析侧定义好的成分（如中文"2024年1月15日"）。

另一个例子是 `%Z`：`dt.strftime("%Z")` 能输出时区名 `CST`，但 `strptime` 用 `%Z` 只能识别 `UTC`、`GMT` 和空字符串，遇到 `CST` 会报错或被忽略。所以"互为逆运算"是在"格式串由 `strptime` 支持的指令组成"这个前提下成立的——对于 `%c`、`%Z` 等 locale/名称类指令，逆运算不保证成立。

**实操结论**：如果你需要"序列化保存 → 日后还原"的时间存储格式，用一个 `strptime` 也能解析的格式串（推荐 ISO 8601：`%Y-%m-%dT%H:%M:%S%z`），不要用 `%c` 这种"只能格式化、解析不稳定"的指令。或者更省事——直接用 `datetime.isoformat()` 生成、`datetime.fromisoformat()` 还原，自 Python 3.7+ 起 `fromisoformat` 能无损还原 `isoformat` 的输出。

## 3. 最佳实践

**用 strptime 而非 split 拼装**

如 2.7 所述，只要字符串有明确格式，优先 `strptime`。`split` 手工拼装在合法性校验、可读性、扩展性上都更差，只在没有固定结构时才用。

**格式串写成常量，集中管理**

批处理脚本里，格式串会被多处引用（解析、错误信息、文档注释）。把它写成模块级常量，一处改处处生效：

```python
LOG_TS_FMT = "%d/%b/%Y:%H:%M:%S %z"

def parse_log_ts(s: str):
    return datetime.strptime(s, LOG_TS_FMT)
```

**生产数据解析必包 try**

任何来自用户输入、文件、网络的字符串都可能有意外格式。裸调 `strptime` 会让整个程序崩在一行坏数据上。统一用 `try/except ValueError` 包裹，并决定兜底：跳过、记日志、用 `None` 占位、还是上报到坏数据队列。

**优先 ISO 8601，优先 fromisoformat**

如果格式由你设计（比如自己定义 API 返回），直接用 ISO 8601（`2024-01-15T12:30:45+08:00`）。解析时优先用 `datetime.fromisoformat()`（Python 3.7+），它专为 ISO 设计、比 `strptime` 更快、且能解析所有 `isoformat()` 输出。`strptime` 留给那些格式非 ISO 的历史数据。

```python
from datetime import datetime

dt = datetime.fromisoformat("2024-01-15T12:30:45+08:00")
print(dt)
# 输出：2024-01-15 12:30:45+08:00
```

**用 %z 而非 %Z 解析时区**

`%z` 解析数字偏移（`+0800`、`+08:00`），可靠且能生成正确的 `tzinfo`。`%Z` 解析时区名称，但只认 `UTC`/`GMT`/空，其余大多被忽略，容易留下 naive datetime 当 aware 用，引发隐性 bug。需要时区名→偏移时，用 `zoneinfo`（3.9+）查表更可靠。

**时区混用要小心**

解析出 aware datetime（含 `%z`）后，与 naive datetime 混做运算会抛 `TypeError: can't compare offset-naive and offset-aware datetimes`。要么把所有 datetime 统一成 aware（给 naive 的补上时区），要么统一成 naive（把 aware 的 `.replace(tzinfo=None)`）。

```python
from datetime import datetime, timezone

# 统一成 UTC naive 的常见写法
aware = datetime.strptime("2024-01-15T12:30:45+08:00", "%Y-%m-%dT%H:%M:%S%z")
utc_naive = aware.astimezone(timezone.utc).replace(tzinfo=None)
print(utc_naive)
# 输出：2024-01-15 04:30:45
```

**%Y 与 %y 不要混用**

`%Y` 要四位年、`%y` 要两位年且按 69/68 规则推断世纪。用 `%Y` 解析 `"24-01-15"` 会失败；用 `%y` 解析 `"2024-01-15"` 会因字段宽度不符失败。批量数据前先抽几条样本确认年份位数，再决定用哪个。

**locale 相关指令慎用**

`%b`、`%B`、`%a`、`%A`、`%p`、`%c`、`%x`、`%X` 都受 `LC_TIME` 影响。脚本在开发机（英文 locale）能跑，部署到中文 locale 服务器就解析 `Jan` 失败的情况屡见不鲜。对策：批处理前显式 `locale.setlocale(locale.LC_TIME, "C")`，或把月份名预映射成数字再用 `%m` 解析。

**批量解析注意缓存复用**

`strptime` 内部会缓存"格式串 → 编译后的解析器"（`_strptime_time` 的 `cache`），所以同一个 `fmt` 反复传给 `strptime` 时，第二次起就走缓存、很快。但如果你每次都拼接新的格式串字符串（哪怕内容相同但 `id` 不同），缓存仍能按值命中。无需手动管理缓存，但避免在循环里构造"每次都不同的格式串"，那会让缓存失效率上升。

**坏数据要留痕**

跳过的坏行别默默丢弃，连同原始行号、字符串、错误信息写到一个"坏数据"文件，事后能复盘是格式变了、还是数据源真的脏了。

## 4. 原理

### 4.1 strptime 的整体执行流程

`datetime.strptime` 的实际工作是委托给 CPython 内部的 `_strptime` 模块完成的。整个解析流程可以拆成五步：

1. **编译格式串**：把 `format` 字符串解析成一个"指令序列"。每个 `%` 指令被翻译成一个 `(directive_key, regex_or_field_spec)` 元组，普通字面字符被当作"期望出现的固定字符"。这份编译结果会按 `format` 的字符串值缓存，下次相同格式串复用。
2. **组装正则**：把指令序列拼成一个大正则表达式，每个 `%` 指令对应一段捕获组（如 `%Y` 对应 `\d{4}`、`%d` 对应 `3[0-1]|\d` 之类），字面字符对应转义后的普通字符。
3. **整体匹配**：用 `re.match` 把这个大正则作用到 `date_string` 上。注意是 `match`（从开头匹配）而非 `search`（任意位置），所以字符串开头必须对得上。
4. **提取并转换字段**：匹配成功后，从各捕获组取出字符串片段，逐个转换成整数（年份、月份、日、小时……）或时区偏移对象。这一步还会处理 `%b/%B` 的月份名→数字映射、`%z` 的偏移解析。
5. **构造并校验**：把所有提取出的字段传给 `datetime` 构造函数。构造函数内部会做合法性校验（月份 1–12、日在月份范围内、闰年 2 月 29 日是否合法、小时 0–23 等）。校验通过则返回新对象，否则抛 `ValueError`。

最后还有一步"尾巴检查"：匹配完 `date_string` 后，如果原字符串末尾还有未被消费的字符（正则没覆盖到末尾），会抛 `unconverted data remains: <剩余>`。这就是为什么 `strptime("2024-01-01extra", "%Y-%m-%d")` 报的是 `unconverted data remains` 而不是"格式不匹配"——前半截其实匹配上了。

### 4.2 format 指令作为 grammar 逐段匹配

`strptime` 的核心思想是："把 format 串当作描述字符串形状的文法（grammar），用它逐段切分并匹配 date_string"。这一点和 `strftime` 用 format 当"模板拼接"恰好相反。

具体看一个例子：`format = "%Y-%m-%d %H:%M:%S"`，`date_string = "2024-01-15 12:30:45"`。

编译器把 format 翻译成这样的指令序列：

| 位置 | format 片段 | 类型 | 对 date_string 的要求 |
|------|-------------|------|------------------------|
| 0 | `%Y` | 指令 | 4 位数字 |
| 1 | `-` | 字面字符 | 必须是 `-` |
| 2 | `%m` | 指令 | 2 位（或 1 位）数字，1–12 |
| 3 | `-` | 字面字符 | 必须是 `-` |
| 4 | `%d` | 指令 | 2 位（或 1 位）数字，1–31 |
| 5 | ` ` | 字面字符 | 必须是空格 |
| 6 | `%H` | 指令 | 2 位数字，0–23 |
| 7 | `:` | 字面字符 | 必须是 `:` |
| 8 | `%M` | 指令 | 2 位数字，0–59 |
| 9 | `:` | 字面字符 | 必须是 `:` |
| 10 | `%S` | 指令 | 2 位数字，0–61 |

字面字符不作捕获，只参与匹配；指令段捕获出的字符串后会被 `int()` 转成对应字段。整个序列拼成一个正则后，相当于：

```
^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$
```

（实际 CPython 实现里 `%d`、`%m` 等允许 1–2 位，所以正则更宽松些，这里简化说明。）匹配 `2024-01-15 12:30:45` 后，捕获组分别是 `2024`、`01`、`15`、`12`、`30`、`45`，转成整数后交给 `datetime(2024, 1, 15, 12, 30, 45)` 构造。

**为什么分隔符不匹配会报"does not match format"**

如果 `date_string` 是 `2024/01/15`，format 是 `%Y-%m-%d`，那么匹配到位置 1（字面 `-`）时，字符串里对应位置是 `/`，`-` != `/`，整体正则不匹配，`re.match` 返回 `None`。CPython 检测到匹配失败，抛 `time data "2024/01/15" does not match format "%Y-%m-%d"`。所有"结构对不上"的错误都会走到这条信息。

**为什么字段宽度不符也会报"does not match"**

`%Y` 在编译时正则写的是 `\d{4}`（严格 4 位）。用 `%Y` 解析 `"24-01-15"` 时，`24-` 的 `24` 虽然是数字，但只有 2 位，`\d{4}` 要求 4 位，匹配失败。所以错误信息也是"does not match format"。这是 `%Y` 和 `%y` 必须严格区分的根本原因——它们在编译出的正则里宽度不同。

### 4.3 数值合法性校验：从字段到 datetime 的构造

正则匹配成功、各字段转成整数后，`strptime` 并不会直接 `return datetime(year, month, day, hour, minute, second)`，而是先把这些值交给 `datetime` 的构造函数，由后者完成合法性校验。`datetime` 构造函数的校验包括：

- `year`：`MINYEAR(1)` 到 `MAXYEAR(9999)`。
- `month`：1–12。
- `day`：1 到 `monthrange(year, month)` 返回的天数。这里会调用闰年判断。
- `hour`：0–23。
- `minute`、`second`：0–59（second 允许 60、61 以表示闰秒）。
- `microsecond`：0–999999。

任何一个范围越界，构造函数抛 `ValueError: day is out of range for month`、`ValueError: month must be in 1..12` 之类的信息，`strptime` 原样向上抛出。

**闰年与 2 月 29 日的校验**

`datetime` 内部用 `monthrange(year, month)` 查这个月有多少天。对于 2 月，它判断 `year` 是否为闰年：

- 能被 4 整除但不能被 100 整除，或能被 400 整除 → 闰年，2 月 29 天。
- 否则 2 月 28 天。

所以：

```python
from datetime import datetime

# 2024 是闰年，2 月 29 日合法
ok = datetime.strptime("2024-02-29", "%Y-%m-%d")
print(ok)
# 输出：2024-02-29 00:00:00

# 2023 不是闰年，2 月 29 日非法
try:
    datetime.strptime("2023-02-29", "%Y-%m-%d")
except ValueError as e:
    print(e)
# 输出：day is out of range for month

# 2100 能被 100 但不能被 400 整除，非闰年
try:
    datetime.strptime("2100-02-29", "%Y-%m-%d")
except ValueError as e:
    print(e)
# 输出：day is out of range for month

# 2000 能被 400 整除，是闰年
ok2 = datetime.strptime("2000-02-29", "%Y-%m-%d")
print(ok2)
# 输出：2000-02-29 00:00:00
```

这条校验链解释了为什么 `strptime` 在"结构匹配后还能抛非法日期错误"——结构层只管"是不是数字、是不是两位"，语义层的"这一天存不存在"留给 `datetime` 构造函数判断。两层校验合起来，`strptime` 才能做到既严格又准确。

### 4.4 %z 解析时区偏移为 tzinfo

当 format 含 `%z` 时，`strptime` 在字段转换阶段会把匹配到的偏移字符串（如 `+0800`、`-0530`、`+08:00`）解析成一个 `timezone(timedelta(hours=..., minutes=...))` 对象，挂到最终 `datetime` 的 `tzinfo` 上，得到 aware datetime。

`%z` 接受的偏移格式（自 3.7 起）：

- `+0800` / `-0530`（无冒号，紧贴符号）
- `+08:00` / `-05:30`（带冒号）
- `+08`（仅小时，3.7+）
- `Z`（3.11+ 视为 UTC，等价于 `+0000`）

解析过程：

1. 从捕获组取出字符串，识别符号 `+`/`-`，分离小时和分钟部分。
2. 计算总偏移秒数：`sign * (hours*3600 + minutes*60)`。
3. 构造 `timedelta(seconds=总偏移)`，再包成 `timezone(timedelta)`。
4. 把这个 `timezone` 作为 `tzinfo` 传给 `datetime` 构造函数。

```python
from datetime import datetime, timezone, timedelta

dt1 = datetime.strptime("2024-01-15T12:30:45+08:00", "%Y-%m-%dT%H:%M:%S%z")
dt2 = datetime.strptime("2024-01-15T12:30:45-05:00", "%Y-%m-%dT%H:%M:%S%z")

# 两个 aware datetime 的差是它们 UTC 时刻的真实差
diff = dt1 - dt2
print("dt1:", dt1)
print("dt2:", dt2)
print("UTC 时刻差:", diff)
# 输出：
# dt1: 2024-01-15 12:30:45+08:00
# dt2: 2024-01-15 12:30:45-05:00
# UTC 时刻差: 13:00:00
```

两个当地时间相同（都是 12:30:45）但时区不同（+08 vs -05），UTC 时刻相差 13 小时，`dt1 - dt2` 直接给出这个真实差。这正是 aware datetime 的威力——解析时用 `%z` 把时区信息保留下来，后续运算才不会丢真。

**`%Z` 为什么不可靠**

`%Z` 期望匹配时区**名字**（`UTC`、`GMT`、`CST`、`PST`…），但 `strptime` 内部只认识 `UTC`、`GMT` 和空字符串，会生成对应的 `timezone.utc` / `timezone.utc` / `None`；其它名字（如 `CST`）既无法映射成固定偏移（`CST` 在美国是 -6、在中国是 +8，二义），就直接被忽略，返回的 `datetime` 是 naive 的。很多人以为写了 `%Z` 就拿到 aware datetime，其实并没有——这是 %`Z` 最坑的地方。生产里要解析时区，坚持用 `%z`（数字偏移），要解析名字就用 `zoneinfo` 查表。

### 4.5 _strptime_time 的缓存机制

CPython 的 `_strptime` 模块内部用一个全局字典 `_cache` 缓存"格式串 → 编译结果"。`strptime` 第一次遇到某个 `format` 时，要经历"拆指令、组装正则、locale 查表"这套完整编译流程，开销不小；编译完的结果（一个 `TimeRE` 对象及其生成的正则）按 `format` 字符串的值存入缓存。后续所有相同 `format` 的调用，直接从缓存取出编译好的正则做 `re.match`，跳过编译阶段。

```python
# 伪代码示意（非真实源码，仅说明思路）
_cache = {}

def _strptime_time(date_string, format):
    compiled = _cache.get(format)
    if compiled is None:
        compiled = compile_format(format)   # 拆指令、组正则
        _cache[format] = compiled
    regex = compiled.regex
    m = regex.match(date_string)
    if m is None:
        raise ValueError(...)
    # 从 m.groups() 提取字段、构造 datetime ...
```

**缓存的几个工程含义**：

1. **同一格式批量解析很快**。循环里反复用同一个 `fmt` 调 `strptime`，编译只发生一次，后续都是纯匹配+构造。2.6 的日志批处理 demo 之所以能很快跑完两万行，就是靠这个缓存。
2. **无需手动"预热"**。缓存是模块级的、自动的，你不需也不应手动操作它。
3. **动态拼接格式串不影响命中**。缓存的 key 是格式串的**值**，不是 `id`。所以 `f"{sep}".join([...])` 拼出的格式串，只要值与之前一致，仍能命中缓存。
4. **不同 format 会导致多次编译**。如果你的代码因数据格式多样而频繁切换 `format`，每种新格式首次调用都要编译一次。2.4 的"多格式探测"策略要遍历一组候选格式，每个候选首次出现都要编译。若候选集固定，编译成本是一次性的，可以接受。
5. **缓存无上限但有 locale 失效机制**。当 `LC_TIME` 改变时，`%b`/`%B`/`%a`/`%A` 的月份/星期名映射变了，`_strptime` 会清空缓存以避免用旧映射解析新 locale 下的字符串。这就是为什么动态切换 locale 后，第一次 `strptime` 会稍慢——缓存被清了，要重新编译。

### 4.6 与 dateutil 自动推断的差异

`dateutil.parser.parse` 走的是完全不同的路线。它不要求你提供格式串，而是内部维护一张庞大的"候选格式/正则"表，对输入字符串依次尝试匹配，命中即返回。这带来几个本质差异：

**1. 宽容 vs 严格**

`strptime` 是"一对一"匹配：一个 format 必须完整覆盖整段字符串，否则失败。`parser.parse` 是"一对多"尝试：一个字符串可以匹配多种格式，挑第一个能解释它的返回。所以 `parser.parse("2024-01-15")` 能成功，是因为它表里有 `%Y-%m-%d` 这个候选；`parser.parse("Jan 15, 2024")` 能成功，是因为表里有 `%b %d, %Y`。

**2. 歧义**

因为是一对多，`"01-02-2024"` 既能解释成 `%m-%d-%Y`（1 月 2 日）也能解释成 `%d-%m-%Y`（2 月 1 日）。`parser.parse` 用一个固定默认（`monthfirst=True`）来消歧，消错了也不报错，只是结果"看起来对、实际错"。`strptime` 没这个烦恼——格式串 `%m-%d-%Y` 已经把"月在前"写死了，不存在歧义。

**3. 性能**

`parser.parse` 每次都要在内部表里做一轮尝试，且很多尝试涉及复杂的正则回溯，单次解析比 `strptime` 慢一个数量级（见 2.5 的对比）。`strptime` 依靠 `_strptime` 缓存，同格式重复解析几乎只剩构造对象的开销。

**4. 校验深度**

`parser.parse` 的校验不如 `strptime` 严格。某些"轻微不合法"的日期它可能宽容通过（如 `"2024-02-30"` 在某些 dateutil 版本里会被默默推到 `"2024-03-01"`，或抛错，行为随版本和参数而变）。`strptime` 则一律交给 `datetime` 构造函数做硬校验，`2024-02-30` 必抛 `ValueError`。

**5. locale 敏感度不同**

两者都受 locale 影响（英文月份名解析），但 `parser.parse` 内部还有一套自己的 fallback，相对更"皮实"一些。

**选用总结**：要"可信、可控、快、无歧义"，用 `strptime`；要"省事、容错、一次性"，用 `parser.parse`。理解了原理层的差异，你就明白为什么生产代码几乎都偏好 `strptime`——确定性比省事重要。

## 5. 总结

### 5.1 本文内容要点

- `datetime.strptime(date_string, format)` 是把字符串解析成 `datetime` 对象的类方法，与 `strftime` 互为逆运算，共享同一套 `%` 指令。
- format 串中的 `%` 指令描述"这里期望出现什么字段"，字面字符要求字符串对应位置出现完全相同的字符。任何不匹配都抛 `ValueError`。
- 常用指令：`%Y` 四位年、`%y` 两位年（69/68 世纪规则）、`%m` 月、`%d` 日、`%H` 24 小时、`%I`+`%p` 12 小时、`%M` 分、`%S` 秒、`%f` 微秒、`%z` 时区偏移、`%b`/`%B` 英文月份名。
- 常见格式解析：ISO 日期 `%Y-%m-%d`、本地带时间 `%Y/%m/%d %H:%M:%S`、英文月份 `%b %d, %Y`、ISO 带时区 `%Y-%m-%dT%H:%M:%S%z`、带微秒 `%Y-%m-%d %H:%M:%S.%f`、仅时间 `%H:%M:%S`。
- 解析失败必包 `try/except ValueError`，常见原因：结构不匹配、字段宽度不符、数值越界、末尾多余字符、locale 不匹配。兜底策略有跳过坏数据、多格式探测。
- `dateutil.parser.parse` 提供傻瓜解析（自动推断格式），适合一次性探查脚本；但因歧义、慢、校验宽松，生产批量场景仍优先 `strptime`。
- `strptime` 比手工 `split`+`int()` 拼装更稳健：内置合法性校验、格式即文档、扩展性强。
- 批量解析日志时间字段是 `strptime` + `%z` 的典型场景，解析出 aware datetime 后可在统一时间轴上排序求差。

### 5.2 原理要点回顾

- `strptime` 把 format 当 grammar，编译成指令序列再拼成正则，对 `date_string` 从头 `match`。
- 字面字符参与匹配但不捕获；`%` 指令对应捕获组，提取的字符串转成整数或时区偏移后交给 `datetime` 构造函数做合法性校验（月份天数、闰年、小时范围）。
- 匹配失败抛"does not match format"，数值越界抛"day is out of range"等，末尾多余抛"unconverted data remains"。
- `%z` 把数字偏移解析成 `timezone(timedelta)` 挂到 `tzinfo` 上得到 aware datetime；`%Z` 只认 UTC/GMT/空，名字不可靠。
- `_strptime_time` 按 format 的值缓存编译结果，同格式重复解析极快；切换 `LC_TIME` 会清空缓存。
- 与 `dateutil.parser.parse` 的差异在于：`strptime` 一对一严格匹配、无歧义、快、强校验；`parser.parse` 一对多尝试、宽容、慢、弱校验、易有歧义。

### 5.3 读完本文你应能掌握

- 写出 `datetime.strptime(date_string, format)` 的正确调用，根据已知字符串格式选择合适的 `%` 指令组合，并预判它能否解析成功。
- 区分 `%Y` 与 `%y`、`%H` 与 `%I+%p`、`%z` 与 `%Z` 的差异，避免年份宽度、12/24 小时制、时区解析的常见坑。
- 解释 `strptime` 抛出的三类 `ValueError`（does not match、out of range、unconverted data remains）的成因并写出对应的兜底代码。
- 用 `strptime` + `%z` 批量解析带时区的日志时间字段，并做跨时区的排序与求差。
- 说明 `strptime` 与 `strftime` 互为逆运算的前提（格式串由 `strptime` 支持的指令组成），并用 `isoformat`/`fromisoformat` 实现更可靠的闭环。
- 在 `strptime`（显式格式、严格、快）与 `dateutil.parser.parse`（自动推断、宽容、慢）之间按场景正确取舍。
- 说清 `_strptime_time` 的缓存机制对批量解析性能的影响，以及 locale 切换会清空缓存的行为。
- 写出生产可用的格式串常量化、try 兜底、坏数据留痕、locale 显式设置的批处理代码骨架。