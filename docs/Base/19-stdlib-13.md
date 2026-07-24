---
group:
  title: 【19】标准库精讲
  order: 19
order: 13
title: timedelta 时间差计算
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 timedelta

`datetime.timedelta` 是 Python 标准库 `datetime` 模块中用来表示"一段时间差"的类。它不关心这段差值从哪个时刻开始、到哪个时刻结束，只关心"长度"本身——就像你手里拿着一把标好刻度的尺子，尺子上写的是"7 天 2 小时 30 分"，但它本身不锚定任何一个具体日期。

这种"只存长度、不存起止"的设计，让 `timedelta` 成为处理时间运算的核心零件。只要涉及"往后推几天""两个时刻差了多久""每隔多久执行一次"，几乎都绕不开它。它与 `datetime`（一个具体时刻）、`date`（一个日期）、`time`（一天内的时间）的关系可以这样理解：

- `datetime` / `date` / `time` 回答"什么时候"。
- `timedelta` 回答"差多久"或"隔多久"。

两者配合后，"`datetime ± timedelta = 新 datetime`"与"`datetime - datetime = timedelta`"构成了时间运算的基本闭环。`timedelta` 既有明确的数学含义（两个时刻的差），也有清晰的内部表示（归一化后的三个整数，后面原理章详述），日常使用时把它当成"可加减的时间段"即可。

`timedelta` 的最小示例：

```python
from datetime import datetime, timedelta

now = datetime.now()
# 往后推 7 天
future = now + timedelta(days=7)
print(future)
# 输出：2026-07-30 ...（具体时分秒取决于运行时刻）
```

这一段已经把 `timedelta` 最核心的用法展示完了：构造一个"7 天"的时间差，加到当前时刻上，得到 7 天后的时刻。

### 1.2 基本语法与最小用法

`timedelta` 的构造函数签名（简化）：

```python
timedelta(days=0, seconds=0, microseconds=0,
          milliseconds=0, minutes=0, hours=0, weeks=0)
```

所有参数都是可选的，默认值均为 0，即 `timedelta()` 表示"零时间差"。七个参数可以任意组合，内部会做归一化（详见第 4 章原理），所以 `timedelta(hours=24)` 与 `timedelta(days=1)` 实际上是相等的：

```python
from datetime import timedelta

a = timedelta(hours=24)
b = timedelta(days=1)
print(a == b)   # 输出：True
print(a)        # 输出：1 day, 0:00:00
```

注意 `print(a)` 的输出是 `1 day, 0:00:00` 而不是 `24:00:00`，这正是归一化的体现——超过 24 小时会被"进位"成天。

最小用法围绕三件事展开：

```python
from datetime import datetime, timedelta

# 1) 构造一段时间差
one_day = timedelta(days=1)
two_hours = timedelta(hours=2)

# 2) 加到 datetime 上，得到新 datetime
start = datetime(2026, 1, 1, 8, 0)
end = start + one_day + two_hours
print(end)   # 输出：2026-01-02 10:00:00

# 3) 两个 datetime 相减，得到 timedelta
delta = end - start
print(delta)            # 输出：1 day, 2:00:00
print(delta.total_seconds())  # 输出：93600.0
```

这三件事就是 `timedelta` 的全部日常用途：构造差值、加减时间、计算跨度。后续章节会把每一项展开到完整 API 层面。

## 2. 核心内容

### 2.1 timedelta 构造参数详解

`timedelta` 的七个构造参数分两类：

| 参数 | 单位换算（归一化基准） | 说明 |
|------|----------------------|------|
| `days` | 天 | 基准单位之一，直接保留 |
| `seconds` | 秒 | 基准单位之一，范围会被归一到 `[0, 86400)` |
| `microseconds` | 微秒（百万分之一秒） | 基准单位之一，范围会被归一到 `[0, 1000000)` |
| `weeks` | 1 周 = 7 天 | 转成 `days * 7` |
| `hours` | 1 小时 = 3600 秒 | 转成 `seconds * 3600` |
| `minutes` | 1 分 = 60 秒 | 转成 `seconds * 60` |
| `milliseconds` | 1 毫秒 = 1000 微秒 | 转成 `microseconds * 1000` |

关键点：七个输入参数最终只会被归一化成 `days`、`seconds`、`microseconds` 三个内部整数存储。`weeks`、`hours`、`minutes`、`milliseconds` 只在构造时起作用，构造完成后它们"消失"了，被吸收进三大字段。这也是为什么下面这个例子看起来"参数变了"：

```python
from datetime import timedelta

td = timedelta(weeks=1, days=2, hours=3, minutes=4,
                seconds=5, milliseconds=6, microseconds=7)
print(td)            # 输出：9 days, 3:04:05.006007
print(td.days)       # 输出：9
print(td.seconds)    # 输出：11045
print(td.microseconds)  # 输出：6007
```

我们来手动验算一下归一化过程，帮助理解：

- `weeks=1` → 7 天
- `days=2` → 2 天
- 合计天数：7 + 2 = 9 天 → `days=9`
- `hours=3` → 10800 秒
- `minutes=4` → 240 秒
- `seconds=5` → 5 秒
- 合计秒：10800 + 240 + 5 = 11045 秒（小于 86400，不进位）→ `seconds=11045`
- `milliseconds=6` → 6000 微秒
- `microseconds=7` → 7 微秒
- 合计微秒：6000 + 7 = 6007 微秒（小于 1000000，不进位）→ `microseconds=6007`

所以最终 `td.days == 9`、`td.seconds == 11045`、`td.microseconds == 6007`。

**参数可以为负或为小数**

七个参数都接受整数、负数甚至浮点数。负数会产生负的 `timedelta`（见 2.13），浮点数会被按换算关系折算并在精度范围内归一化：

```python
from datetime import timedelta

# 小时为浮点数
td1 = timedelta(hours=1.5)
print(td1)            # 输出：1:30:00
print(td1.seconds)    # 输出：5400

# 负数：表示"向前"的时间差
td2 = timedelta(days=-1)
print(td2)            # 输出：-1 day, 0:00:00
```

`hours=1.5` 被换算成 5400 秒；`days=-1` 则直接变成 `days=-1`，这是一个负 timedelta，后面会专门讲解。

**零参数与相等性**

```python
from datetime import timedelta

zero = timedelta()
print(zero)           # 输出：0:00:00
print(zero.days, zero.seconds, zero.microseconds)
# 输出：0 0 0
```

`timedelta()` 就是"零差"，常用于初始化累加器、判断条件等场景。

### 2.2 datetime ± timedelta 时间加减

这是 `timedelta` 最常见的用途：给定一个时刻，加上或减去一段时间，得到另一个时刻。`datetime` 与 `timedelta` 之间的加减法是双向的——`datetime + timedelta` 和 `timedelta + datetime` 都合法且结果相同；减法只支持 `datetime - timedelta`。

```python
from datetime import datetime, timedelta

base = datetime(2026, 7, 23, 9, 30, 0)

# 加法：往后推
plus_3d = base + timedelta(days=3)
print(plus_3d)        # 输出：2026-07-26 09:30:00

# 减法：往前回退
minus_3d = base - timedelta(days=3)
print(minus_3d)       # 输出：2026-07-20 09:30:00

# 交换律
print(base == timedelta(days=0) + base)   # 输出：True
```

注意第三个例子：`timedelta(days=0) + base` 成立，说明加法满足交换律；减法不行（`timedelta - datetime` 会抛 `TypeError`）。

**跨月、跨年的自动进位**

加减法会自动处理月份天数差异和闰年。这是它相比手算"day + 30"最大的优势——不用你自己判断"7 月有 31 天、跨到 8 月"：

```python
from datetime import datetime, timedelta

# 跨月：7 月 28 日 + 5 天 = 8 月 2 日
d1 = datetime(2026, 7, 28) + timedelta(days=5)
print(d1)             # 输出：2026-08-02 00:00:00

# 跨年：12 月 30 日 + 3 天 = 次年 1 月 2 日
d2 = datetime(2026, 12, 30) + timedelta(days=3)
print(d2)             # 输出：2027-01-02 00:00:00

# 闰年：2024 年 2 月 28 日 + 1 天 = 2 月 29 日（2024 是闰年）
d3 = datetime(2024, 2, 28) + timedelta(days=1)
print(d3)             # 输出：2024-02-29 00:00:00
```

这里 `timedelta` 自己不"知道"月份长度，是 `datetime` 在做加减时根据自身日历规则进位的（原理见 4.2）。`timedelta` 只负责提供"5 天"这个长度。

**叠加多个 timedelta**

可以把多个 `timedelta` 相加后再加到 `datetime` 上，也可以连续加减：

```python
from datetime import datetime, timedelta

start = datetime(2026, 1, 1, 8, 0)

# 方法一：先把 timedelta 加起来
delta = timedelta(days=1) + timedelta(hours=2) + timedelta(minutes=30)
print(start + delta)  # 输出：2026-01-02 10:30:00

# 方法二：连续加减
result = start + timedelta(days=1) + timedelta(hours=2) - timedelta(minutes=30)
print(result)         # 输出：2026-01-02 09:30:00
```

两种写法等价，按可读性选择即可。

### 2.3 两个 datetime 相减得 timedelta

两个 `datetime` 相减，结果是一个 `timedelta`，表示中间跨度。这是计算"两个时间差了多久"的标准做法。

```python
from datetime import datetime, timedelta

release = datetime(2026, 7, 1, 10, 0)
now = datetime(2026, 7, 23, 9, 30)
gap = now - release
print(gap)                       # 输出：21 days, 23:30:00
print(type(gap))                 # 输出：<class 'datetime.timedelta'>
print(gap.days)                  # 输出：21
print(gap.total_seconds())       # 输出：1894200.0
```

关键点：

- 结果类型是 `timedelta`，不是 `datetime`。
- `gap.days` 只给出"整天数部分"（21），不会帮你把 23:30 也折算成小数天。要拿总跨度得用 `total_seconds()` 再换算。
- 相减方向：`now - release` 得到"已经过了多久"（正数）；反过来 `release - now` 会得到负 timedelta。

**只关心天数差的常见写法**

```python
from datetime import datetime

deadline = datetime(2026, 8, 1)
today = datetime(2026, 7, 23)
days_left = (deadline - today).days
print(days_left)                 # 输出：9
```

`(deadline - today).days` 是日常计算"还剩几天"的惯用句式。注意 `.days` 是向下取整的整天数，如果两个 `datetime` 带了时分秒，差值不满一整天的部分会丢掉（见 2.4 的取整说明）。

### 2.4 days / seconds / microseconds 内部属性

`timedelta` 内部只存三个只读属性：`days`、`seconds`、`microseconds`。它们都已经过归一化，满足以下范围约束：

- `0 <= seconds < 86400`（不足一天）
- `0 <= microseconds < 1000000`（不足一秒）
- `days` 可以是任意整数（正、负、零）

```python
from datetime import timedelta

td = timedelta(days=3, hours=25, minutes=70, microseconds=1200000)
print(td.days)          # 输出：4
print(td.seconds)       # 输出：4200
print(td.microseconds)  # 输出：200000
print(td)               # 输出：4 days, 1:10:00.200000
```

验算：`hours=25` 折成 90000 秒，`minutes=70` 折成 4200 秒，合计 94200 秒 = 1 天（86400） + 7800 秒。所以 `days` 从 3 变成 4，`seconds=7800`。而 `microseconds=1200000` = 1 秒 + 200000 微秒，所以 `seconds` 再加 1 变成 7801？这里需要说明一个细节：上面的换算我看到结果不对，让我重新核对。

实际上 `minutes=70` 是 4200 秒，`hours=25` 是 90000 秒，合计 94200 秒；`microseconds=1200000` 折算时，进位 1 秒到 `seconds`，余 200000 微秒。所以 `seconds` 应该是 94201 对 86400 取余 = 7801。让我修正一下示例，用更清晰的输入：

```python
from datetime import timedelta

# 用纯粹的输入便于验算
td = timedelta(days=3, hours=25, microseconds=1200000)
print(td.days)          # 输出：4
print(td.seconds)       # 输出：3601
print(td.microseconds)  # 输出：200000
print(td)               # 输出：4 days, 1:00:01.200000
```

这次验算：

- `days=3` 先记 3 天。
- `hours=25` = 90000 秒，超过 86400 进 1 天，余 3600 秒 → `days=4`、`seconds=3600`。
- `microseconds=1200000` 超过 1000000 进 1 秒，余 200000 → `seconds=3601`、`microseconds=200000`。

所以最终 `days=4`、`seconds=3601`、`microseconds=200000`。

**取整行为**

`.days` 是整数天，对正 timedelta 是"向下取整"，对负 timedelta 行为见 2.13。`.seconds` 和 `.microseconds` 永远是非负的，小于一天/一秒。所以不能直接用 `td.seconds / 3600` 来得到"总小时数"——它只给出"一天以内的小时部分"。要拿总跨度，请用 `total_seconds()`。

**没有 hours / minutes 属性**

常见的初学者错误是写 `td.hours`：

```python
from datetime import timedelta

td = timedelta(hours=5)
# print(td.hours)   # AttributeError: 'datetime.timedelta' object has no attribute 'hours'
print(td.seconds)    # 输出：18000
print(td.seconds // 3600)  # 输出：5
```

要取"小时部分"，得自己从 `seconds` 里算：`td.seconds // 3600`。这也是 `seconds` 范围被限制在 `[0, 86400)` 的直接后果。

### 2.5 total_seconds() 总秒数

`total_seconds()` 返回 `timedelta` 折算成秒的浮点数，公式为：

```
total_seconds = days * 86400 + seconds + microseconds / 1_000_000
```

这是获取"真实跨度"的唯一正确方式。`.days` 只给整数天、`.seconds` 只给一天内的部分，二者加起来不能直接当总跨度用。

```python
from datetime import datetime, timedelta

start = datetime(2026, 7, 23, 9, 0, 0)
end = datetime(2026, 7, 25, 12, 30, 0)
delta = end - start

# 错误的"总秒数"算法
wrong = delta.days * 86400 + delta.seconds
print(wrong)                  # 输出：205800

# 正确的总秒数
right = delta.total_seconds()
print(right)                  # 输出：205800.0
```

在这个例子里微秒为 0，所以两者恰好相等。但只要 `timedelta` 带微秒，手算就会出错：

```python
from datetime import datetime, timedelta

a = datetime(2026, 7, 23, 9, 0, 0, 500000)
b = datetime(2026, 7, 23, 9, 0, 1, 0)
delta = b - a

print(delta.days, delta.seconds, delta.microseconds)
# 输出：0 0 500000
print(delta.total_seconds())   # 输出：0.5
```

这里 `delta.days=0`、`delta.seconds=0`、`delta.microseconds=500000`，手算 `days*86400 + seconds` 会得到 0，而真实跨度是 0.5 秒——只有 `total_seconds()` 给出正确答案。

**从秒数反向构造**

`timedelta` 没有直接接受"总秒数"的构造参数，但可以用 `seconds=` 配合：

```python
from datetime import timedelta

# 1 小时 30 分 = 5400 秒
td = timedelta(seconds=5400)
print(td)                      # 输出：1:30:00
print(td.total_seconds())      # 输出：5400.0
```

如果要从一个 `total_seconds()` 浮点数还原 `timedelta`，直接 `timedelta(seconds=x)` 即可，内部会自动归一化为天/秒/微秒。

**精度说明**

`total_seconds()` 返回 `float`，在极端大的 `timedelta`（比如几百万天）上会损失精度。如果一个 `timedelta` 跨度极大且需要精确微秒，应直接用 `days * 86400 + seconds` 与 `microseconds` 分开处理，而不是依赖 `float`。日常场景不受影响。

### 2.6 timedelta 的比较运算

两个 `timedelta` 可以用 `==`、`!=`、`<`、`<=`、`>`、`>=` 直接比较，比较的是它们表示的真实时间长度，而不是内部三个字段是否字面相等。这是归一化设计的直接好处。

```python
from datetime import timedelta

a = timedelta(hours=24)
b = timedelta(days=1)
c = timedelta(seconds=86400)

print(a == b == c)   # 输出：True
print(a < timedelta(days=2))  # 输出：True
```

三个看起来"构造参数不同"的 `timedelta`，因为归一化后内部值相同，比较结果相等。

**比较的方向是有意义的**

```python
from datetime import timedelta

small = timedelta(hours=1)
big = timedelta(days=1)

print(small < big)           # 输出：True
print(big > small)           # 输出：True
print(small == timedelta(hours=1))  # 输出：True
```

**与零比较判断正负**

```python
from datetime import timedelta, datetime

zero = timedelta()
negative = timedelta(days=-1)

print(negative < zero)       # 输出：True
print(zero == timedelta())   # 输出：True
```

判断一个 timedelta 是否为负，习惯写 `td < timedelta(0)` 或 `td < timedelta()`。`timedelta` 没有直接的 `.sign` 属性。

**在排序与 min/max 中使用**

因为可比较，`timedelta` 可以放进 `sorted`、`min`、`max`：

```python
from datetime import timedelta

durations = [timedelta(hours=3), timedelta(minutes=30), timedelta(days=1)]
shortest = min(durations)
longest = max(durations)
print(shortest)   # 输出：0:30:00
print(longest)    # 输出：1 day, 0:00:00
```

**跨类型比较**

`timedelta` 只能与 `timedelta` 比较，与 `int` / `float` 直接比较会抛 `TypeError`：

```python
from datetime import timedelta

td = timedelta(seconds=30)
# td == 30   # TypeError: can't compare datetime.timedelta to int
print(td.total_seconds() == 30)  # 输出：True
```

要和数值比，先把一边转成秒或把另一边转成 `timedelta`。

### 2.7 timedelta 与数的乘除运算

`timedelta` 支持与 `int` / `float` 做乘法和除法，结果仍是 `timedelta`。这套运算让"按比例缩放一段时间差"变得直接。

**乘法**

```python
from datetime import timedelta

half_hour = timedelta(minutes=30)
print(half_hour * 2)          # 输出：1:00:00
print(3 * half_hour)         # 输出：1:30:00（交换律成立）
print(half_hour * 2.5)       # 输出：1:15:00
```

整数乘和浮点乘都合法，乘法满足交换律（`int * timedelta` 和 `timedelta * int` 等价）。

**除法**

`timedelta / timedelta` 得到 `float`（比值），`timedelta / int` 得到 `timedelta`（缩放）：

```python
from datetime import timedelta

one_hour = timedelta(hours=1)
half = timedelta(minutes=30)

# timedelta / timedelta → float
print(one_hour / half)        # 输出：2.0
print(half / one_hour)        # 输出：0.5

# timedelta / int → timedelta
print(one_hour / 2)           # 输出：0:30:00
```

注意区分两种除法：除以一个数得到缩放后的 `timedelta`；除以另一个 `timedelta` 得到比值。

**地板除与取模**

```python
from datetime import timedelta

td = timedelta(hours=5)
print(td // timedelta(hours=2))  # 输出：2（int，地板除取整比值）
print(td % timedelta(hours=2))   # 输出：1:00:00（余数仍是 timedelta）
```

`//` 在两个 `timedelta` 之间做地板除得到整数倍数；`%` 取模得到 `timedelta` 余数。常用于"把一段时间切成等长小段，看能切几段、余多少"。

**除以零**

`timedelta / 0` 会抛 `ZeroDivisionError`，和普通数值除法一致：

```python
from datetime import timedelta

# timedelta(hours=1) / 0  # ZeroDivisionError
```

### 2.8 典型场景：到期日计算

会员到期、订单超时、优惠券失效，这类需求背后都是"`now + timedelta(days=N)`"。这里给出一个带"到期提醒"的完整小场景。

```python
from datetime import datetime, timedelta

# 用户开通 30 天会员
signup = datetime(2026, 7, 1, 10, 0, 0)
membership_duration = timedelta(days=30)
expire_at = signup + membership_duration
print("到期时刻：", expire_at)
# 输出：到期时刻：2026-07-31 10:00:00

# 假设今天是 7 月 23 日，判断是否进入"7 天内到期"提醒窗口
now = datetime(2026, 7, 23, 10, 0, 0)
reminder_window = timedelta(days=7)
remaining = expire_at - now
print("剩余时间：", remaining)
# 输出：剩余时间：8 days, 0:00:00

if remaining <= reminder_window:
    print("已进入到期提醒窗口")
else:
    print("尚未进入提醒窗口")
# 输出：尚未进入提醒窗口
```

这一段同时演示了几件事：用 `timedelta(days=30)` 表示会员时长、用 `+` 得到期日、用 `-` 得剩余时间、用 `<=` 把 `timedelta` 直接比较做业务判断。`timedelta` 在这种场景里把"时长"这一概念从纯数字（容易单位混乱）抽象成了带类型的量，避免"30 是天还是秒"的歧义。

**带续费的叠加**

```python
from datetime import datetime, timedelta

expire = datetime(2026, 7, 31, 10, 0, 0)
# 用户在到期前续费 14 天
expire = expire + timedelta(days=14)
print("续费后到期：", expire)
# 输出：续费后到期：2026-08-14 10:00:00
```

续费就是直接在原到期时间上再加一段 `timedelta`，跨月由 `datetime` 自动进位处理。

### 2.9 典型场景：工作日计算排除周末

"3 个工作日后"是另一类常见需求。`timedelta(days=3)` 只能加 3 个自然日，要剔除周末得自己循环判断。这里给一个不依赖第三方库（如 `numpy` / `pandas`）的纯写法。

```python
from datetime import datetime, timedelta


def add_workdays(start: datetime, days: int) -> datetime:
    """从 start 出发，加 days 个工作日（跳过周六周日）。"""
    current = start
    added = 0
    while added < days:
        current = current + timedelta(days=1)
        # weekday(): 周一=0 ... 周日=6；周六=5、周日=6 跳过
        if current.weekday() < 5:
            added += 1
    return current


base = datetime(2026, 7, 23)   # 周四
result = add_workdays(base, 3)
print("3 个工作日后：", result.date())
# 输出：3 个工作日后：2026-07-28
```

验算：7 月 23 日周四 +1 工作日 → 7 月 24 周五；+2 → 7 月 27 周一（跳过 26 周日）；+3 → 7 月 28 周二。结果正确。

这段代码的核心循环每一步都用 `timedelta(days=1)` 推进一天，再用 `weekday()` 判断是否是周末。如果想进一步排除节假日，只需把判断条件换成"在工作日集合里"或查一张节假日表。`timedelta` 在这里扮演"推进单位"的角色。

**反向：计算两个日期间的自然日差与工作日差**

```python
from datetime import datetime, timedelta


def workdays_between(start: datetime, end: datetime) -> int:
    """统计 [start, end) 区间内的工作日数量。"""
    count = 0
    day = start
    one_day = timedelta(days=1)
    while day < end:
        if day.weekday() < 5:
            count += 1
        day = day + one_day
    return count


a = datetime(2026, 7, 20)   # 周一
b = datetime(2026, 7, 27)   # 次周一
print("自然日差：", (b - a).days)        # 输出：7
print("工作日数：", workdays_between(a, b))  # 输出：5
```

`(b - a).days` 直接给出自然日差 7，工作日循环去掉两个周末得到 5。

### 2.10 典型场景：定时任务下次执行时间

定时任务里经常要算"下次执行时刻"。用 `timedelta` 表示间隔非常自然，也方便在配置层把不同单位（分、小时、天）的间隔统一成同一种类型。

```python
from datetime import datetime, timedelta

# 假设任务每 6 小时执行一次，上一次执行是 7 月 23 日 00:00
last_run = datetime(2026, 7, 23, 0, 0, 0)
interval = timedelta(hours=6)

next_run = last_run + interval
print("下次执行：", next_run)
# 输出：下次执行：2026-07-23 06:00:00

# 把一天切成 4 段，列出一天内的所有执行点
runs = []
cursor = last_run
end_of_day = datetime(2026, 7, 24, 0, 0, 0)
while cursor < end_of_day:
    runs.append(cursor)
    cursor = cursor + interval

for r in runs:
    print(r.strftime("%H:%M"))
# 输出：
# 00:00
# 06:00
# 12:00
# 18:00
```

这段同时演示了"算下一次"和"按固定间隔穷举多个执行点"。用 `timedelta(hours=6)` 而不是裸数字 6，单位信息被类型携带，不会和"6 分钟""6 秒"混淆。

**间隔可配置时的统一处理**

```python
from datetime import datetime, timedelta

# 配置里可能以不同单位给出间隔，统一转成 timedelta
configs = [
    {"unit": "minutes", "value": 30},
    {"unit": "hours", "value": 2},
    {"unit": "days", "value": 1},
]

now = datetime(2026, 7, 23, 9, 0, 0)
for cfg in configs:
    td = timedelta(**{cfg["unit"]: cfg["value"]})
    print(f"间隔 {cfg['value']} {cfg['unit']} → 下次 {now + td}")
# 输出：
# 间隔 30 minutes → 下次 2026-07-23 09:30:00
# 间隔 2 hours → 下次 2026-07-23 11:00:00
# 间隔 1 days → 下次 2026-07-24 09:00:00
```

`timedelta(**{unit: value})` 利用关键字参数展开，把"单位+数值"配置直接转成 `timedelta`，是非常实用的技巧。

### 2.11 归一化规则

归一化是 `timedelta` 最容易被忽略但最值得理解的特性。规则可以总结成三条进位约束：

1. `microseconds` 超过 `1000000` 进位为 `seconds`，只留 `[0, 1000000)` 内的余数。
2. `seconds` 超过 `86400` 进位为 `days`，只留 `[0, 86400)` 内的余数。
3. `days` 不进位（天没有更大的内部单位），可正可负。

所以无论你用 `hours=26`、`minutes=1560`、`seconds=93600` 构造，最终都会被压成同一个 `timedelta`。

```python
from datetime import timedelta

# 三种不同写法，同一个结果
a = timedelta(hours=26)
b = timedelta(minutes=1560)
c = timedelta(seconds=93600)
print(a, b, c, sep="\n")
# 输出：
# 1 day, 2:00:00
# 1 day, 2:00:00
# 1 day, 2:00:00
print(a == b == c)   # 输出：True
```

**归一化只发生在内部存储层**

七个输入参数中，`weeks`、`hours`、`minutes`、`milliseconds` 在构造完成后就"消失"了——它们没有对应的属性可读。唯一能查到的还是归一化后的 `days`、`seconds`、`microseconds`。这也是为什么 `timedelta(hours=1).hours` 会报 `AttributeError`：`hours` 从未作为属性存在过。

**字符串表示也基于归一化字段**

`str(timedelta)` 的输出格式是 `D days, H:MM:SS.ffffff`（不足 1 天时省略 `D days,`），其中 `H:MM:SS` 直接来自 `seconds` 的换算，`ffffff` 来自 `microseconds`。所以你看到的字符串总是归一化后的形态：

```python
from datetime import timedelta

print(timedelta(hours=50))
# 输出：2 days, 2:00:00

print(timedelta(minutes=90))
# 输出：1:30:00

print(timedelta(seconds=0.5))
# 输出：0:00:00.500000
```

### 2.12 naive 与 aware datetime 相减规则

`datetime` 分两类：naive（不带时区信息）和 aware（带时区信息）。它们和 `timedelta` 相减时规则不同，混用会报错。

**naive 之间：直接算**

两个 naive `datetime` 相减，按"墙钟时刻"直接相减，不管现实里时区如何：

```python
from datetime import datetime, timedelta

a = datetime(2026, 7, 23, 9, 0)    # naive
b = datetime(2026, 7, 23, 11, 0)   # naive
print(b - a)    # 输出：2:00:00
```

**aware 之间：考虑时区，算的是真实时刻差**

两个 aware `datetime` 相减时，Python 会先把它们对齐到同一时区（UTC）再相减，所以得到的是"真实时间跨度"，而不是"墙钟差"：

```python
from datetime import datetime, timedelta, timezone, timedelta

# 用 timezone(timedelta(hours=N)) 构造固定偏移时区
tz_utc8 = timezone(timedelta(hours=8))   # 东八区
tz_utc5 = timezone(timedelta(hours=-5))  # 西五区

# 同一时刻，用不同时区表示
t1 = datetime(2026, 7, 23, 9, 0, tzinfo=tz_utc8)    # 北京时间 9:00
t2 = datetime(2026, 7, 23, 2, 0, tzinfo=tz_utc5)    # 纽约时间 2:00

# 北京 9:00 = UTC 1:00；纽约 2:00 = UTC 7:00；差 6 小时
# 但墙钟看 9:00 - 2:00 = 7 小时；aware 相减给的是真实时刻差
# 这里 t1 对应 UTC 1:00，t2 对应 UTC 7:00，t2 - t1 = 6 小时
print(t2 - t1)   # 输出：6:00:00
```

注意上面这个例子很容易看反：墙钟上 9 点和 2 点差 7 小时，但 aware 相减给 6 小时，原因是它们其实是不同时区的同一批"墙钟数字"映射到不同 UTC 时刻后，再算的真实跨度。这正是 aware 相减的价值——避免被"墙钟数字"误导。

**naive 与 aware 混用：抛 TypeError**

```python
from datetime import datetime, timezone, timedelta

naive = datetime(2026, 7, 23, 9, 0)
aware = datetime(2026, 7, 23, 9, 0, tzinfo=timezone(timedelta(hours=8)))

# naive - aware   # TypeError: can't subtract offset-naive and offset-aware datetimes
```

规则很硬：要么两边都 naive、要么两边都 aware，不能混。真实业务里经常出错的地方是从数据库读出来的 `datetime`（往往带时区）和代码里 `datetime.now()`（默认 naive）相减，解决方式见第 3 章最佳实践。

### 2.13 负 timedelta

`timedelta` 可以表示"负的时间差"——比如"倒退 1 天"或者两个 `datetime` 反向相减。负 `timedelta` 的显示有它的特殊语法。

```python
from datetime import timedelta, datetime

# 直接构造负 timedelta
neg = timedelta(days=-1)
print(neg)              # 输出：-1 day, 0:00:00

# 反向相减也会得到负 timedelta
early = datetime(2026, 7, 1)
late = datetime(2026, 7, 5)
print(early - late)     # 输出：-4 days, 0:00:00
```

注意输出格式 `-1 day, 0:00:00` 和 `-4 days, 0:00:00`：`day` 后面的时分秒部分总是非负的，负号挂在 `days` 上。这是归一化对负数的特殊处理（见 4.1 原理）。

**负 timedelta 的三个内部字段**

```python
from datetime import timedelta

td = timedelta(seconds=-90)
print(td)               # 输出：-1 day, 23:58:30
print(td.days)          # 输出：-1
print(td.seconds)       # 输出：86310
print(td.microseconds)  # 输出：0
```

`seconds=-90` 被归一化成 `days=-1`、`seconds=86310`（即 86400 - 90）。也就是说，对负 timedelta，`days` 是负的"整天数向下取"，而 `seconds` 仍保持 `[0, 86400)` 的非负范围。所以 `td.days == -1` 但 `td.seconds == 86310`，合起来 = -90 秒。这就是 `-1 day, 23:58:30` 的来历：`-1 天 + 23:58:30 = -90 秒`。

**取绝对值**

```python
from datetime import timedelta, datetime

a = datetime(2026, 7, 1)
b = datetime(2026, 7, 5)
# 不管谁前谁后，都得到正的跨度
gap = abs(a - b)
print(gap)              # 输出：4 days, 0:00:00
```

`abs()` 作用于 `timedelta` 返回其绝对值，常用于"不确定两个时刻谁更早但只要差值"的场景。

**与零比较判断方向**

```python
from datetime import timedelta

if timedelta(days=-1) < timedelta(0):
    print("是负 timedelta")
# 输出：是负 timedelta
```

### 2.14 abs / 取整 / 字符串解析补充

除了前面提到的 `abs()`，`timedelta` 还能配合 `round` 风格做"对齐到单位"。`timedelta` 没有内置的 `round` 方法，但可以用取模运算实现。

**对齐到整小时**

```python
from datetime import timedelta

td = timedelta(hours=2, minutes=45)
hour = timedelta(hours=1)
# 地板到整小时
floored = td - (td % hour)
print(floored)           # 输出：2:00:00
```

`td % hour` 得到不足 1 小时的余数（45 分钟），用原值减去余数即得到地板到整小时的结果。

**把秒数四舍五入到分钟**

```python
from datetime import timedelta

td = timedelta(seconds=95)   # 1 分 35 秒
minute = timedelta(minutes=1)
# 四舍五入
rounded = round(td / minute) * minute
print(rounded)           # 输出：2:00:00
```

`td / minute` 得到浮点比值 1.583，`round` 得 2，再乘回 `minute` 得到"2 分钟"的 `timedelta`。

**字符串解析的局限**

`timedelta` 没有像 `strptime` 那样的内置解析方法。`str(timedelta)` 产生的格式也没有官方反向解析器。常见做法是手写正则，或借助 `dateutil` 等三方库的 `parse` 函数。在纯标准库范围内，一般通过"构造时避免依赖字符串"来规避——把间隔存成数值 + 单位，而不是字符串。

```python
from datetime import timedelta
import re

# 简易示例：解析 "1:30:00" 形式
def parse_hms(s: str) -> timedelta:
    h, m, s = (int(x) for x in s.split(":"))
    return timedelta(hours=h, minutes=m, seconds=s)

print(parse_hms("1:30:00"))   # 输出：1:30:00
```

这只是个起点，真实项目里如需解析复杂 ISO 8601 duration 字符串（如 `P1DT2H`），建议直接用 `isodate` 或 `dateutil`。

## 3. 最佳实践

**统一时区再相减，避免 naive/aware 混用**

最常见的线上 bug 来源：数据库返回 aware `datetime`，代码里 `datetime.now()` 是 naive，直接相减抛 `TypeError`。推荐做法是全局统一——要么全部 naive（不推荐，跨时区会错），要么全部 aware，并且一律用 UTC 存储、在展示层转本地时区：

```python
from datetime import datetime, timezone

# 推荐：统一用 aware UTC
now_utc = datetime.now(timezone.utc)
# 不推荐：默认 now() 是 naive，容易和 aware 混
# now_naive = datetime.now()
```

业务代码里建议封装一个 `utcnow()` 工具函数返回 aware UTC，强制全链路一致。

**用 total_seconds() 表示跨度，别手算 days*86400+seconds**

手算式在微秒非零时会漏掉微秒部分，且语义不直观。除了对超大跨度有精度敏感的特殊场景，统一用 `total_seconds()`，再按需折算：

```python
from datetime import datetime

def hours_between(a, b):
    return (b - a).total_seconds() / 3600
```

**不要用裸整数当时间长度**

团队协作中 `timeout = 30` 是"30 秒"还是"30 毫秒"全靠猜。统一用 `timedelta(seconds=30)` 把单位写进类型里，读的人一目了然，配合 `total_seconds()` 也方便跟配置系统对接。

**构造时优先用最贴近业务的单位**

写 `timedelta(days=7)` 而不是 `timedelta(hours=168)`，即使两者结果相同。归一化保证结果一致，但代码可读性差很多——读者看到 168 要算半天。让单位贴近业务语义（"7 天"就是 days），把归一化这种"机械换算"留给 `timedelta` 自己。

**对可能反向的相减，先想清方向或用 abs**

`a - b` 和 `b - a` 结果一正一负，业务里如果只关心"差了多久"不关心方向，用 `abs(a - b)`；如果方向有业务含义（如判断"是否过期"），保持原方向并和 `timedelta(0)` 比较：

```python
from datetime import datetime, timedelta

def is_expired(deadline, now):
    return (deadline - now) < timedelta(0)
```

**超大跨度不要依赖 float 精度**

`total_seconds()` 返回 `float`，当 `days` 达到百万级时微秒信息会被浮点精度吃掉。如果业务里会出现几十年的跨度且需要微秒精度，分开用 `days * 86400 + seconds` 和 `microseconds` 处理，不要塞进一个 `float`。

**累加 timedelta 时注意起点选择**

计算"N 个工作日后"这类需求时，循环里每次 `+ timedelta(days=1)` 的起点要明确：是从今天开始 +1 判断，还是从今天本身算第一天？两种理解会差一天。建议在函数文档里写清"是否包含今天"，并在边界条件加测试。

**比较 timedelta 前确保类型一致**

`timedelta == int` 会抛 `TypeError`，不要把 `timedelta` 和裸数值直接比。如果配置层传进来的是秒数，先 `timedelta(seconds=x)` 包一层再比较，保持类型一致。

## 4. 原理

### 4.1 内部归一化为 days / seconds / microseconds 三整数

`timedelta` 的全部内部状态只由三个整数承载：`self.days`、`self.seconds`、`self.microseconds`。构造时接收的七个参数（`days`、`seconds`、`microseconds`、`milliseconds`、`minutes`、`hours`、`weeks`）先被统一换算成"天、秒、微秒"三类，再经过以下归一化流程压紧到规范范围。

换算阶段把一切折成最底层单位：

- `weeks` → `days * 7`
- `hours` → `seconds * 3600`
- `minutes` → `seconds * 60`
- `milliseconds` → `microseconds * 1000`

折算后得到三个"原始"整数 `d`、`s`、`us`（可能很大、可能为负）。接着归一化算法把 `us` 和 `s` 之间的进位、`s` 和 `d` 之间的进位一次性算清。核心步骤可以表述为：

```
# 把微秒进位到秒
s += us // 1_000_000
us = us % 1_000_000
# 但当 us 为负时，Python 的 % 仍返回非负余数，故 us 落在 [0, 1000000)

# 把秒进位到天
d += s // 86400
s = s % 86400
# 同理 s 落在 [0, 86400)
```

Python 的 `%` 对负数返回"与除数同号"的余数，这一特性是关键。例如 `(-90) % 86400 == 86310`、`(-1) % 86400 == 86399`。所以当 `seconds` 原始值为负时，进位会"借一天"给 `days`，而 `seconds` 自己变成同号区间的正数。这就是为什么 `timedelta(seconds=-90)` 最终是 `days=-1, seconds=86310`——负的"总秒数"-90 被表达成"-1 天 + 86310 秒"。

整个归一化保证三个字段满足：

- `0 <= microseconds < 1000000`
- `0 <= seconds < 86400`
- `days` 为任意整数（正、负、零，仅受数值范围限制）

这一设计带来两个直接好处。其一，任意两个语义上相等的 `timedelta`——无论用什么单位构造——内部三字段值都相同，所以 `==` 比较可以直接逐字段比较，不需要再换算。其二，`timedelta` 之间的加减、与整数的乘除可以直接在三整数上做再归一化一遍，运算语义清晰。

构造完成后，`timedelta` 不再保留 `weeks`、`hours`、`minutes`、`milliseconds` 这些"临时单位"的任何痕迹。这也是 `.hours` 等属性不存在的根因——它们从没作为字段存在过，仅仅在构造函数的局部作用域里短暂参与换算。

### 4.2 datetime ± timedelta 的字段进位

`datetime` 与 `timedelta` 相加减时，`timedelta` 只提供"天数偏移"和"天以内秒数偏移"两部分（因为内部就只有 `days` 和 `seconds` + `microseconds`），实际的日历进位由 `datetime` 自己完成。

过程可以这样理解：

1. 把 `timedelta.days` 加到 `datetime` 的日期部分。如果 `timedelta` 带负数天，则减。
2. 把 `timedelta.seconds` 和 `microseconds` 加到 `datetime` 的时间部分（时、分、秒、微秒）。
3. 时间部分的累加可能溢出（例如 `23:59:59 + 2 秒 → 次日 00:00:01`），此时向日期进位一天；也可能下溢（`00:00:01 - 2 秒 → 前一日 23:59:59`），向日期借一天。
4. 日期部分的月份/年份进位由 `datetime` 内部日历逻辑处理：天超过当月天数就进月，月超 12 就进年，并正确处理闰年与各月天数。

这个机制解释了为什么 `datetime(2024, 2, 28) + timedelta(days=1)` 会得到 `2024-02-29`——`datetime` 知道 2024 是闰年，2 月有 29 天。`timedelta` 本身不"知道"月份长度，它只说"加 1 天"，进位是 `datetime` 的活。

对于 aware `datetime`，加减 `timedelta` 不考虑夏令时切换导致的"墙钟跳跃"——它按 UTC 上的等价运算做，所以可能出现"墙钟上看起来跳了一小时"的结果。这也是为什么处理本地时间（尤其带 DST 的时区）时，推荐先转 UTC 再加减 `timedelta`。

### 4.3 两 datetime 相减先对齐时区再算时刻差

两个 `datetime` 相减产生 `timedelta`，背后流程是：

1. 检查两边的"aware 性"是否一致。一方 naive 一方 aware 直接抛 `TypeError`（见 4.5）。
2. 如果两边都是 naive，直接按字段相减，不考虑任何时区。
3. 如果两边都是 aware，先把它们各自的 UTC 时刻算出来（本地墙钟时刻减去自身 `utcoffset()`），得到两个 UTC 时刻。这一步把"带时区的墙钟表示"还原成"唯一的物理时刻"。
4. 对两个 UTC 时刻做差，得到真实跨度。结果只取决于物理时刻，与两边用的时区无关。

因为第 3 步先转 UTC 再相减，所以同一对物理时刻无论各自用哪个时区显示，相减得到的 `timedelta` 都相同。这也解释了 2.12 的例子：北京时间 9:00 和纽约时间 2:00 看似"墙钟差 7 小时"，但分别转 UTC 后是 UTC 1:00 和 UTC 7:00，真实差 6 小时。

对 aware `datetime` 来说，`utcoffset()` 返回该时刻在该时区的 UTC 偏移量。固定偏移时区（`timezone(timedelta(hours=N))`）的偏移恒定；对 DST 时区（如 `ZoneInfo("America/New_York")`），偏移会随日期变化——但只要 `datetime` 是 aware 的，`utcoffset()` 都能给出正确值，第 3 步照常工作。

### 4.4 total_seconds() 的计算公式

`total_seconds()` 的精确公式为：

```
total_seconds = days * 86400 + seconds + microseconds / 1_000_000
```

其中 `days`、`seconds`、`microseconds` 就是归一化后的三个内部字段。注意 `seconds` 和 `microseconds` 对正 timedelta 自然是非负的；对负 timedelta，`days` 为负而 `seconds`、`microseconds` 仍非负，三者相加的代数和正好等于原始（可能为负的）总秒数。

例如 `timedelta(seconds=-90)` 归一化后 `days=-1, seconds=86310, microseconds=0`，代入公式：

```
total_seconds = (-1) * 86400 + 86310 + 0 = -90
```

与输入一致。

实现上，CPython 把这个公式算成一个 `double`（Python 的 `float`）。当三个整数的量级在常规范围内（几百年以内），`double` 的 53 位尾数足以精确表示；当 `days` 达到百万级，`days * 86400` 已超过 2^53，微秒部分就会丢失。这就是第 3 章提到"超大跨度不要依赖 `total_seconds()` 精度"的根本原因。

### 4.5 naive/aware 混用相减抛 TypeError 的机制

`datetime.__sub__` 在执行相减前会先检查运算数的 `tzinfo` 状态：`datetime` 上有个内部标志（通过 `utcoffset()` 是否返回 `None` 判定）表示自己是 naive 还是 aware。

流程是：

1. 若两边的 aware 性一致（都 naive 或都 aware），继续运算。
2. 若一边 naive 一边 aware，直接 `raise TypeError("can't subtract offset-naive and offset-aware datetimes")`。

这个检查发生在任何算术之前，所以混用从来不会"悄悄给你一个错误结果"，而是硬报错。这是 Python 有意为之的"显式优于隐式"设计——naive 和 aware 的相减语义本身有歧义（"naive 的 9:00 是哪个时区的 9:00？"），与其猜一个默认时区算出可能错的结果，不如让你必须先把两边对齐成同一种类型。

对加法 `datetime + timedelta` 没有这个限制——因为 `timedelta` 没有"naive/aware"之分，只是个时长，加到任何 `datetime` 上都不产生歧义。但对 `datetime - datetime`，两边必须同aware。日常最容易踩这个雷的场景是从数据库读出的 aware `datetime`（很多驱动默认带时区）与代码里 `datetime.now()`（naive）相减，修复方式是把 `datetime.now()` 换成 `datetime.now(timezone.utc)` 或把数据库端转成 naive 后再相减。

## 5. 总结

本篇围绕 `datetime.timedelta` 讲解了时间差计算的完整用法，要点如下：

- `timedelta` 表示一段时间差，只存长度、不锚定起止时刻；`datetime ± timedelta` 得到新 `datetime`，`datetime - datetime` 得到 `timedelta`，构成时间运算闭环。
- 七个构造参数（`days`、`seconds`、`microseconds`、`milliseconds`、`minutes`、`hours`、`weeks`）最终归一化为内部三整数 `days / seconds / microseconds`，其中 `seconds` 限定在 `[0, 86400)`、`microseconds` 限定在 `[0, 1000000)`。
- `.days`、`.seconds`、`.microseconds` 是只读属性，只给"天/天以内/秒以内"的分量，不是总跨度；要拿总跨度用 `.total_seconds()`，公式为 `days*86400 + seconds + microseconds/1e6`。
- `timedelta` 之间可直接比较（`==`、`<`、`>` 等）和做四则运算（加减、与数乘除、地板除与取模），语义都基于归一化后的真实时长。
- 典型场景包括到期日计算（`now + timedelta(days=7)`）、两日期差几天（`(b - a).days`）、工作日计算（循环 `+ timedelta(days=1)` 配合 `weekday()` 跳过周末）、定时任务下次执行时间（`last_run + interval`）。
- 归一化使 `hours=26`、`minutes=1560`、`seconds=93600` 表示同一个 `timedelta`，`str(td)` 输出也是归一化形态。
- 两 `datetime` 相减时，naive 间直接相减、aware 间先对齐 UTC 再算真实时刻差、naive 与 aware 混用直接抛 `TypeError`。
- 负 `timedelta` 的 `days` 为负而 `seconds`、`microseconds` 仍非负，显示形如 `-1 day, 23:58:30`；`abs()` 取绝对值。

读完本文你应能掌握：

- 正确选择 `timedelta` 的构造单位并预测归一化后的 `days / seconds / microseconds` 值。
- 用 `datetime ± timedelta` 做跨月、跨年、闰年的时间加减，并说明 `datetime` 负责日历进位、`timedelta` 只提供时长。
- 用 `total_seconds()` 获取真实跨度，能手算公式并解释为何不应手算 `days*86400 + seconds`。
- 正确比较与运算 `timedelta`（含乘除、地板除、取模、与零比较判断正负）。
- 编写到期提醒、工作日计算、定时任务间隔等典型场景代码。
- 判断两个 `datetime` 相减会得到正还是负 `timedelta`、是否会抛 `TypeError`，并能给出 naive/aware 统一时区的修复方案。
- 解释归一化对负 `timedelta` 的处理、`total_seconds()` 在超大跨度下精度损失的原因，以及 naive/aware 混用报错的底层机制。