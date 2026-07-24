---
group:
  title: 【19】标准库精讲
  order: 19
order: 17
title: logging.FileHandler 与日志轮转
nav:
  title: Python
  order: 1
---

## 1. 介绍

### 1.1 什么是 FileHandler

`logging.FileHandler` 是 Python 标准库 `logging` 模块提供的一个 handler，它把日志记录写到磁盘文件而不是控制台。上一篇讲 `basicConfig` 时，默认输出目标是 `sys.stderr`（控制台），而真实项目里日志往往要落盘——服务跑在后台没人盯着屏幕，出了问题得翻日志文件排查，这时候就需要 `FileHandler`。

但只把日志写进一个文件会带来一个工程问题：文件会无限增长。一个跑了一年的服务，日志文件可能大到几十 GB，打开打不开、搜索搜不动、磁盘被撑爆服务直接挂掉。于是又有了"日志轮转"——在文件达到某个条件（大小或时间）时，把当前文件改名归档，开一个新文件继续写，老文件保留若干份后自动删除。标准库为此提供了两个轮转 handler：`RotatingFileHandler`（按大小轮转）和 `TimedRotatingFileHandler`（按时间轮转），都在 `logging.handlers` 子模块下。

本篇承接第 16 篇的基础配置，专讲文件输出与轮转：先从最基础的 `FileHandler` 讲起，再讲为什么需要轮转、两种轮转 handler 怎么用，最后把文件输出、控制台输出、多 handler、级别分层组合到一起，形成一套可落地的日志配置。

### 1.2 基础语法与最小用法

最简单的文件日志，只要把一个 `FileHandler` 加到 logger 上：

```python
import logging

# 创建 logger
logger = logging.getLogger("app")
logger.setLevel(logging.DEBUG)

# 创建 FileHandler，指定文件路径
file_handler = logging.FileHandler("app.log", encoding="utf-8")
file_handler.setFormatter(logging.Formatter(
    "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
))

# 把 handler 挂到 logger
logger.addHandler(file_handler)

logger.info("服务启动")
logger.error("数据库连接失败")
```

运行后，当前目录下会出现 `app.log` 文件，内容如下：

```
# app.log 内容：
2025-01-10 09:00:00,123 - app - INFO - 服务启动
2025-01-10 09:00:00,456 - app - ERROR - 数据库连接失败
```

这就是 `FileHandler` 的骨架：构造时给文件名，`setFormatter` 设格式，`addHandler` 挂上去。控制台不再输出任何东西——因为没有任何 handler 指向 `sys.stdout` 或 `sys.stderr`。如果既想写文件又想看控制台，就再加一个 `StreamHandler`，这就是"多 handler"的雏形，后面会详细讲。

## 2. 核心内容

### 2.1 FileHandler 详解

`FileHandler` 是最基础的文件输出 handler，它的作用只有一个：把日志记录按指定格式写到指定文件。它继承自 `StreamHandler`（这点原理章会展开），把一个打开的文件对象当作流来写。

**构造签名**

```python
logging.FileHandler(
    filename,
    mode="a",
    encoding=None,
    delay=False,
    errors=None,
)
```

各参数含义：

- `filename`：日志文件路径，相对路径相对当前工作目录，生产环境建议用绝对路径。
- `mode`：文件打开模式，默认 `"a"`（追加）。用 `"w"` 会每次启动程序时清空原文件——通常不想要这个行为，除非是临时调试。
- `encoding`：文件编码，默认 `None`（用系统默认编码）。Windows 上系统默认可能是 GBK，写中文日志会乱码或报错，强烈建议显式指定 `encoding="utf-8"`。
- `delay`：延迟打开，默认 `False`。`False` 时构造 handler 就打开文件；`True` 时等到第一次 `emit` 才打开。轮转 handler 默认 `delay=True`，因为轮转会不断开关文件，提前开没意义。
- `errors`：编码错误处理策略（Python 3.9+），如 `"replace"`、`"backslashreplace"`，默认 `None`。

**mode 的选择**

绝大多数场景用默认的 `"a"`（追加）。看一下两种模式的对比：

```python
import logging

logger = logging.getLogger("demo.mode")
logger.setLevel(logging.INFO)

# 模式 a：追加（默认），每次启动程序在文件末尾继续写
handler_a = logging.FileHandler("app_a.log", mode="a", encoding="utf-8")
handler_a.setFormatter(logging.Formatter("%(message)s"))
logger.addHandler(handler_a)

logger.info("第一次启动写入")
# 假设程序重启，再次运行到这行：
logger.info("第二次启动写入")
```

```
# app_a.log 内容（两次运行后）：
第一次启动写入
第二次启动写入
```

如果换成 `mode="w"`：

```python
# 模式 w：覆盖，每次启动程序清空文件从头写
handler_w = logging.FileHandler("app_w.log", mode="w", encoding="utf-8")
```

```
# app_w.log 内容（第二次运行后，第一次的“第一次启动写入”没了）：
第二次启动写入
```

**生产环境永远用 `"a"`**。`"w"` 会丢历史日志，只有在你故意要"每次运行只看本次日志"的临时脚本里才用。

**encoding 必须显式指定**

```python
# 不推荐：依赖系统默认编码，跨平台可能乱码
handler = logging.FileHandler("app.log")

# 推荐：显式 utf-8，任何平台表现一致
handler = logging.FileHandler("app.log", encoding="utf-8")
```

Windows 上不指定 `encoding` 时默认是 GBK，日志里出现 emoji 或生僻字就会抛 `UnicodeEncodeError`，程序直接崩。这是线上事故的常见诱因之一。

**用 FileHandler 实现最基本的文件日志**

把前面的骨架补全成一个可复用的配置函数：

```python
import logging

def setup_file_logger(log_path="app.log", level=logging.INFO):
    """配置一个写文件的 logger。"""
    logger = logging.getLogger("app")
    logger.setLevel(level)

    # 避免重复添加 handler（函数被多次调用时）
    if not logger.handlers:
        handler = logging.FileHandler(
            log_path,
            mode="a",
            encoding="utf-8",
        )
        handler.setFormatter(logging.Formatter(
            "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        ))
        logger.addHandler(handler)

    return logger

logger = setup_file_logger()
logger.info("服务启动")
logger.warning("缓存命中率低于 50%")
logger.error("订单 12345 创建失败")
```

```
# app.log 内容：
2025-01-10 09:00:00 | INFO     | app | 服务启动
2025-01-10 09:00:00 | WARNING  | app | 缓存命中率低于 50%
2025-01-10 09:00:00 | ERROR    | app | 订单 12345 创建失败
```

注意 `%(levelname)-8s` 里的 `-8` 表示左对齐占 8 个字符，这样不同级别名的长度不一也能对齐，排查时视觉上更整齐。

### 2.2 为什么需要日志轮转

`FileHandler` 简单好用，但它有一个致命问题：**文件只增不减**。每次启动程序都在 `"a"` 模式下追加，运行越久文件越大。来看一个真实的反面案例：

假设一个服务每秒写 100 条日志，每条平均 200 字节，一天就是 `100 × 200 × 86400 ≈ 1.6 GB`，一个月 48 GB。这个文件会带来三个问题：

1. **磁盘撑爆**：磁盘满了之后日志写不进去，更糟的是数据库、临时文件也都写不进去，整个服务崩溃。
2. **排查困难**：grep 一个几十 GB 的文件极慢，甚至 `tail` 都卡顿，定位某一天的报错要等很久。
3. **无法按时间归档**：所有日志混在一个文件里，想看"上周三的报错"没法直接拿，得按时间戳过滤整个巨文件。

日志轮转就是解决这三个问题的机制：在文件达到某个条件时，把当前文件改名归档（比如 `app.log` → `app.log.1`），然后开一个新的空 `app.log` 继续写。归档的文件保留若干份，超出数量后最旧的自动删除。这样磁盘占用有上限，排查时按归档编号或时间定位，归档文件天然按时间/大小分片。

标准库在 `logging.handlers` 模块里提供了两种轮转：

- `RotatingFileHandler`：按文件大小轮转，适合不关心时间、只关心体积的场景。
- `TimedRotatingFileHandler`：按时间轮转（每天/每小时/每分钟），适合需要按时间归档排查的场景，也是线上服务最常用的方式。

### 2.3 RotatingFileHandler：按大小轮转

`RotatingFileHandler` 在每次写日志时检查当前文件大小，超过 `maxBytes` 就触发一次轮转：关闭当前文件、把所有归档文件编号往后挪一位（`.1` → `.2`，`.log` → `.1`）、删除超过 `backupCount` 的最旧文件、打开新的空文件继续写。

**构造签名**

```python
from logging.handlers import RotatingFileHandler

RotatingFileHandler(
    filename,
    mode="a",
    maxBytes=0,
    backupCount=0,
    encoding=None,
    delay=False,
    errors=None,
)
```

关键参数：

- `maxBytes`：单个文件最大字节数，超过就轮转。设为 `0` 表示不轮转（退化成普通 `FileHandler`，没意义）。
- `backupCount`：保留的归档文件份数。例如 `backupCount=3` 时，磁盘上最多有 `app.log`（当前）+ `app.log.1` + `app.log.2` + `app.log.3` 共 4 个文件，更老的会被删除。
- `mode`：注意这里虽然接受 `mode` 参数，但轮转 handler 实际只在第一次打开时用，轮转后总是以 `"a"` 开新文件。传 `"w"` 也只在初始那一次生效，不要指望它每次轮转都清空。
- `delay`：默认 `False`，但 `RotatingFileHandler` 实际建议让它延迟打开（原理章会解释为何），不过日常使用默认值也能工作。

**轮转的编号规则**

假设 `filename="app.log"`，`backupCount=3`，触发轮转时按这个顺序操作：

1. 如果 `app.log.3` 存在，删除它（最旧的被丢弃）。
2. `app.log.2` 改名为 `app.log.3`。
3. `app.log.1` 改名为 `app.log.2`。
4. `app.log`（当前文件）改名为 `app.log.1`。
5. 创建新的空 `app.log`，继续写。

所以编号越小越新：`.1` 是最近一次轮转下来的，`.3` 是最老的。磁盘上同时存在的文件数量上限是 `backupCount + 1`（当前文件 + backupCount 份归档）。

**用 1KB 阈值演示轮转**

为了直观看到轮转效果，把 `maxBytes` 设得很小（1024 字节 = 1KB），然后多写几条日志触发轮转：

```python
import logging
from logging.handlers import RotatingFileHandler

logger = logging.getLogger("rotate.size")
logger.setLevel(logging.DEBUG)

# maxBytes=1024：文件超过 1KB 就轮转
# backupCount=3：保留 3 份归档（app.log.1/2/3）
handler = RotatingFileHandler(
    "app.log",
    maxBytes=1024,
    backupCount=3,
    encoding="utf-8",
)
handler.setFormatter(logging.Formatter(
    "%(asctime)s - %(levelname)s - %(message)s"
))
logger.addHandler(handler)

# 写足够多的日志，触发多次轮转
for i in range(50):
    logger.info(f"第 {i:03d} 条日志，这是一段用来占点篇幅的文本，"
                f"确保每条记录有一定的体积，好让轮转早点触发。")
```

运行后看磁盘上的文件：

```
# ls -la 结果：
-rw-r--r--  app.log        # 当前正在写的文件（最新的）
-rw-r--r--  app.log.1      # 上一份归档
-rw-r--r--  app.log.2      # 更早一份
-rw-r--r--  app.log.3      # 最老的归档，再老的已被删除
```

每个文件都不会超过 1024 字节（最后一次写入可能略超，因为轮转是写之前检查、写之后超阈值，下次再写才轮转）。`app.log.4` 不会出现——当试图轮转出第 4 份时，原 `.3` 先被删掉，所以最多就 3 份归档。

**maxBytes 设多大合适**

经验值：

- 小服务、调试期：`maxBytes=10 * 1024 * 1024`（10 MB），`backupCount=5`，总占用上限约 60 MB。
- 中型线上服务：单文件 100 MB，保留 10 份，上限约 1 GB。
- 高频日志服务：单文件 500 MB，保留 20 份，上限约 10 GB。

注意 `maxBytes` 是单文件大小，总磁盘占用上限约 `maxBytes × (backupCount + 1)`。设值时要结合磁盘容量评估。

### 2.4 TimedRotatingFileHandler：按时间轮转

`TimedRotatingFileHandler` 不看文件大小，而是按时间间隔轮转：每到时间边界（每天零点、每小时整点等）就轮转一次。这是线上服务最常用的方式，因为排查问题习惯按时间定位——"昨晚 3 点的报错"，按天切分的日志一眼就能找到。

**构造签名**

```python
from logging.handlers import TimedRotatingFileHandler

TimedRotatingFileHandler(
    filename,
    when="h",
    interval=1,
    backupCount=0,
    encoding=None,
    delay=False,
    utc=False,
    atTime=None,
    errors=None,
)
```

关键参数：

- `when`：轮转的时间单位，决定 `interval` 的含义。可选值见下表。
- `interval`：时间间隔数量，默认 `1`。`when="D"` 且 `interval=1` 即每天轮转一次，`interval=7` 即每 7 天一次。
- `backupCount`：保留归档份数，含义同 `RotatingFileHandler`。
- `utc`：是否用 UTC 时间计算边界，默认 `False`（用本地时间）。跨时区服务建议 `utc=True`，避免服务器时区改动影响切分点。
- `atTime`：只对 `when="midnight"` 有意义，指定每天轮转的具体时刻，默认 `datetime.time(0, 0, 0)` 即零点。可以传 `datetime.time(4, 0, 0)` 表示每天凌晨 4 点轮转。

**when 的取值**

| when 值 | 含义 | interval 单位 | 归档文件后缀示例 |
|---|---|---|---|
| `"S"` | 秒 | 秒 | `app.log.2025-01-10_09-00-00` |
| `"M"` | 分钟 | 分 | `app.log.2025-01-10_09-00` |
| `"H"` | 小时 | 小时 | `app.log.2025-01-10_09` |
| `"D"` | 天 | 天 | `app.log.2025-01-09` |
| `"midnight"` | 每天 0 点轮转（推荐） | 天 | `app.log.2025-01-09` |
| `"W0"`~`"W6"` | 每周指定星期（0=周一） | - | `app.log.2025-01-05` |
| `when="W0"` 且 `interval=2` | 每 2 周一次，周一轮转 | - | 同上 |

`"midnight"` 和 `"D"` 的区别：`"D"` 是"每隔 interval 天的当前时刻"轮转，启动后 24 小时轮转一次，边界跟启动时刻有关；`"midnight"` 强制在每天 `atTime`（默认零点）轮转，边界固定，排查时更直观。**按天切分推荐用 `"midnight"` 而不是 `"D"`**。

**按天轮转配置（最常用）**

线上服务的标准配置：每天 0 点切一份，保留 30 天：

```python
import logging
from logging.handlers import TimedRotatingFileHandler

logger = logging.getLogger("app")
logger.setLevel(logging.INFO)

handler = TimedRotatingFileHandler(
    "app.log",
    when="midnight",
    interval=1,
    backupCount=30,       # 保留 30 天归档
    encoding="utf-8",
)
handler.setFormatter(logging.Formatter(
    "%(asctime)s | %(levelname)-8s | %(message)s"
))
logger.addHandler(handler)

logger.info("服务启动")
```

```
# app.log 内容（1月10日白天写的）：
2025-01-10 09:00:00 | INFO     | 服务启动
...
```

到了 1 月 11 日 0 点，触发轮转：`app.log` 改名为 `app.log.2025-01-10`，新建空 `app.log` 继续 1 月 11 日的日志。30 天前的归档会被自动删除。归档文件名里的日期是被归档的那一天（1月10日），不是新的一天，排查时按"我要看哪天的日志"找对应后缀即可。

**按小时轮转配置**

高频服务一天日志太多，可以按小时切：

```python
handler = TimedRotatingFileHandler(
    "app.log",
    when="H",
    interval=1,
    backupCount=48,       # 保留 48 小时
    encoding="utf-8",
)
```

```
# 磁盘文件：
app.log                      # 当前小时的日志
app.log.2025-01-10_08        # 8 点那小时的归档
app.log.2025-01-10_07        # 7 点
...
```

按小时切分排查更细，适合交易类、风控类需要精确到小时回溯的服务。

**自定义轮转时刻**

不想 0 点切，想凌晨 4 点切（业务低谷期）：

```python
import datetime

handler = TimedRotatingFileHandler(
    "app.log",
    when="midnight",
    backupCount=30,
    encoding="utf-8",
    atTime=datetime.time(4, 0, 0),   # 每天 4:00 轮转
)
```

这样归档边界是每天 4 点到次日 4 点，避开业务高峰期切文件的瞬时开销。

### 2.5 多 handler：文件 + 控制台双输出

线上服务开发时，往往想既把日志写到文件（供事后排查），又实时在控制台看到（开发调试）。这就要给同一个 logger 挂多个 handler——一个 `FileHandler` 写文件，一个 `StreamHandler` 写控制台。logger 产生的一条日志，会被分发给所有挂着的 handler，各自独立格式化、独立输出。

```python
import logging

logger = logging.getLogger("app")
logger.setLevel(logging.DEBUG)

# 文件 handler：写文件，级别 INFO
file_handler = logging.FileHandler("app.log", encoding="utf-8")
file_handler.setLevel(logging.INFO)
file_handler.setFormatter(logging.Formatter(
    "%(asctime)s | %(levelname)-8s | %(message)s"
))

# 控制台 handler：输出到 stderr，级别 DEBUG（更细）
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)
console_handler.setFormatter(logging.Formatter(
    "%(levelname)s: %(message)s"
))

logger.addHandler(file_handler)
logger.addHandler(console_handler)

logger.debug("调试细节，只出现在控制台")
logger.info("正常信息，控制台和文件都有")
logger.error("报错，两边都有")
```

```
# 控制台输出：
DEBUG: 调试细节，只出现在控制台
INFO: 正常信息，控制台和文件都有
ERROR: 报错，两边都有

# app.log 内容（没有 debug 那条，因为 file_handler 的 level 是 INFO）：
2025-01-10 09:00:00 | INFO     | 正常信息，控制台和文件都有
2025-01-10 09:00:00 | ERROR    | 报错，两边都有
```

关键点是 handler 各自 `setLevel`：`file_handler` 设了 `INFO`，所以 `DEBUG` 记录它不收；`console_handler` 设了 `DEBUG`，全收。这就是"handler 级别过滤"——一条记录要先后通过 logger 的级别和 handler 的级别两层过滤，只有两边都放行才会真正输出。

### 2.6 handler 级别与 logger 级别的双层过滤

这是初学者最容易混淆的点，单独拎出来讲。

日志记录从产生到输出，经过两层级别检查：

1. **logger 级别**（`logger.setLevel`）：logger 自己的门槛。记录的级别低于这个值，logger 直接丢弃，根本不分发给 handler。这是第一道闸。
2. **handler 级别**（`handler.setLevel`）：handler 的门槛。logger 把记录分发过来后，handler 再检查一次，级别低于自己设定的就丢弃，不输出。这是第二道闸。

所以一条记录要真正被某个 handler 输出，必须同时满足：`记录级别 >= logger 级别` 且 `记录级别 >= 该 handler 级别`。

用一张表说明：

| logger 级别 | handler 级别 | 记录级别 | 是否输出 |
|---|---|---|---|
| INFO | DEBUG | DEBUG | 否（被 logger 拦） |
| INFO | DEBUG | INFO | 是 |
| DEBUG | INFO | DEBUG | 否（被 handler 拦） |
| DEBUG | INFO | INFO | 是 |
| WARNING | ERROR | ERROR | 是 |
| WARNING | WARNING | INFO | 否（被 logger 拦） |

**典型用法：logger 放宽到 DEBUG，handler 分层收**

```python
logger = logging.getLogger("app")
logger.setLevel(logging.DEBUG)   # logger 放宽，让所有记录都能流到 handler

# 文件只记 INFO 及以上（避免 debug 刷爆文件）
file_handler.setLevel(logging.INFO)
# 控制台看 DEBUG 及以上（开发时想看细节）
console_handler.setLevel(logging.DEBUG)

logger.debug("这条只进控制台")
logger.info("这条两边都进")
```

这样做的好处是：logger 是"总闸"，handler 是"分闸"。开发期把总闸开到 DEBUG，分闸各自决定收什么；上线时只要把某个 handler 的级别调高，不用动 logger，灵活控制不同输出目标的详细程度。

### 2.7 addHandler / removeHandler 动态管理

handler 不是只能在初始化时挂一次，运行中也可以动态增删。这在一些场景下有用：比如调试某个函数时临时加个控制台 handler，结束后移除；或者运行中根据配置热切换日志目标。

```python
import logging

logger = logging.getLogger("app")
logger.setLevel(logging.DEBUG)

# 运行中临时加一个控制台 handler 调试
debug_handler = logging.StreamHandler()
debug_handler.setLevel(logging.DEBUG)
debug_handler.setFormatter(logging.Formatter("DEBUG: %(message)s"))
logger.addHandler(debug_handler)

logger.info("这条会同时进入原本的 handler 和新加的 debug_handler")

# 调试结束，移除
logger.removeHandler(debug_handler)

logger.info("这条不再进入 debug_handler")
```

`removeHandler` 后，后续记录不再分发给被移除的 handler。注意 handler 对象本身不会被关闭，如果你不再用它了，应调用 `handler.close()` 释放文件句柄：

```python
debug_handler.close()
```

**避免重复添加**

同一个 logger 上 `addHandler` 多次同一个 handler 对象，会在每次记录时输出多次：

```python
logger.addHandler(file_handler)
logger.addHandler(file_handler)   # 重复了！

logger.info("hi")
# app.log 里会出现两行 "hi"
```

这在循环初始化、函数被多次调用的场景容易踩到。前面 `setup_file_logger` 函数里用 `if not logger.handlers` 做了防护，更稳妥的做法是检查是否已存在同一类型的 handler。

### 2.8 常见配置模式：应用日志按天切 + 保留 30 天 + 双 handler

把前面讲的组合起来，给一个完整的可落地的配置函数，这是大多数 Web 服务的标配：

```python
import logging
from logging.handlers import TimedRotatingFileHandler

def setup_logging(log_dir="logs", app_name="app"):
    """配置应用日志：按天切文件 + 控制台双输出，文件保留 30 天。"""
    logger = logging.getLogger(app_name)
    logger.setLevel(logging.DEBUG)

    # 避免重复配置
    if logger.handlers:
        return logger

    log_path = f"{log_dir}/{app_name}.log"

    # 文件 handler：按天轮转，INFO 级别，保留 30 天
    file_handler = TimedRotatingFileHandler(
        log_path,
        when="midnight",
        backupCount=30,
        encoding="utf-8",
    )
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    ))

    # 控制台 handler：DEBUG 级别，开发期看细节
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG)
    console_handler.setFormatter(logging.Formatter(
        "%(levelname)s: %(message)s"
    ))

    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    return logger

# 使用
logger = setup_logging()
logger.debug("启动调试模式")
logger.info("监听 0.0.0.0:8080")
logger.warning("连接池接近上限")
logger.error("处理请求失败", exc_info=True)
```

```
# 控制台输出：
DEBUG: 启动调试模式
INFO: 监听 0.0.0.0:8080
WARNING: 连接池接近上限
ERROR: 处理请求失败
Traceback (most recent call last):
  ...

# logs/app.log 内容（无 DEBUG 那条）：
2025-01-10 09:00:00 | INFO     | app | 监听 0.0.0.0:8080
2025-01-10 09:00:00 | WARNING  | app | 连接池接近上限
2025-01-10 09:00:00 | ERROR    | app | 处理请求失败
...
```

这个配置的特点：文件端按天切、保留 30 天、只记 INFO 以上（避免 debug 刷爆磁盘）；控制台端看 DEBUG（开发调试用）。上线时把 `console_handler.setLevel` 改成 `WARNING` 甚至 `ERROR`，减少控制台噪音。

## 3. 最佳实践

### 3.1 路径用绝对路径，目录提前创建

```python
# 不推荐：相对路径，依赖运行目录
handler = logging.FileHandler("app.log")

# 推荐：绝对路径，目录不存在则创建
import os
log_dir = "/var/log/myapp"
os.makedirs(log_dir, exist_ok=True)
handler = logging.FileHandler(f"{log_dir}/app.log", encoding="utf-8")
```

相对路径相对的是"启动程序时的当前工作目录"，用 systemd、Docker、cron 启动时 cwd 往往不是你以为的那个，日志会写到意想不到的地方。绝对路径避免歧义。`FileHandler` 不会自动创建父目录，目录不存在会抛 `FileNotFoundError`，所以要 `os.makedirs(..., exist_ok=True)`。

### 3.2 永远显式指定 encoding="utf-8"

这一条前面强调过，再重复一次因为它太常见：

```python
# 不推荐
handler = logging.FileHandler("app.log")

# 推荐
handler = logging.FileHandler("app.log", encoding="utf-8")
```

不指定时用 `locale.getpreferredencoding()`，Windows 上常是 cp936/GBK。日志里出现一个 emoji 或生僻字，写入时 `UnicodeEncodeError`，handler 抛异常，根据 `logging` 的内部处理（默认 `lastResort`），可能直接打到 stderr 还可能丢日志。指定 `utf-8` 一劳永逸。

### 3.3 不要在循环里 addHandler

```python
# 不推荐：每次请求都调 setup，可能重复加 handler
def handle_request():
    logging.basicConfig(...)   # basicConfig 只在第一次生效，但 addHandler 没这保护
    logger = logging.getLogger("app")
    handler = logging.FileHandler("app.log")
    logger.addHandler(handler)  # 调 1000 次就有 1000 个 handler，每条日志写 1000 遍
    ...

# 推荐：初始化一次，全局复用
def setup():   # 启动时调一次
    ...

def handle_request():
    logger = logging.getLogger("app")
    logger.info("处理请求")
```

`addHandler` 重复挂同一个 handler 类型（哪怕不是同一对象）也会导致一条记录被写多次。日志初始化应在程序入口做一次，业务代码只拿 logger 用。

### 3.4 轮转参数结合磁盘容量评估

```python
# 不推荐：拍脑袋设值，不看磁盘
handler = RotatingFileHandler("app.log", maxBytes=10*1024*1024, backupCount=100)
# 100 份 × 10MB = 1GB，但服务器只有 500MB 余量 → 撑爆

# 推荐：先算总占用上限，再定参数
# 假设磁盘给日志 2GB 配额
total_quota = 2 * 1024 * 1024 * 1024   # 2GB
backupCount = 5
maxBytes = total_quota // (backupCount + 1)   # ≈ 340MB
handler = RotatingFileHandler(
    "app.log",
    maxBytes=maxBytes,
    backupCount=backupCount,
    encoding="utf-8",
)
```

总占用上限 ≈ `maxBytes × (backupCount + 1)`。先定磁盘配额，再反推参数，而不是随便填。

### 3.5 按天轮转优先用 midnight 而非 D

```python
# 不推荐：when="D"，轮转边界跟启动时刻有关，不固定
handler = TimedRotatingFileHandler("app.log", when="D", backupCount=30)

# 推荐：when="midnight"，固定每天 0 点切，排查时按日期找文件即可
handler = TimedRotatingFileHandler("app.log", when="midnight", backupCount=30)
```

`"D"` 是"启动后每隔 24 小时切一次"，如果你下午 3 点启动服务，以后每天下午 3 点切，文件名后缀里的日期是"被归档的那一天"，但实际跨度是前一天 15:00 到当天 15:00，跟人脑里的"自然天"对不上。`"midnight"` 强制 0 点切，归档文件天然对应一个自然天。

### 3.6 多进程同写一个日志文件要避免标准库轮转

标准库的 `RotatingFileHandler` 和 `TimedRotatingFileHandler` **不是进程安全的**——多个进程同时往同一个日志文件写并触发轮转，会互相覆盖、丢日志、甚至损坏归档文件。原因是轮转要做"检查大小 → 关闭 → 重命名 → 开新文件"这一串操作，不是原子的；进程 A 刚把 `app.log` 改名为 `app.log.1`，进程 B 还在往原 fd（现在指向 `app.log.1`）写，就串了。

```python
# 多进程部署（gunicorn 多 worker、multiprocessing）下不安全：
handler = RotatingFileHandler("app.log", maxBytes=100*1024*1024, backupCount=10)
```

多进程场景的几种方案：

1. **每进程独立日志文件**：文件名带 pid 或 worker 序号，如 `app-{pid}.log`，各自轮转，互不干扰。简单但排查时要合并多个文件。
2. **独立日志进程 + 队列**：所有业务进程把日志丢到 `Queue`，单独一个进程消费写文件，只有它在写文件所以轮转安全。标准库 `logging.handlers.QueueHandler` + `QueueListener` 就是干这个的。
3. **第三方库 `concurrent-log-handler`**：用文件锁保证多进程轮转的原子性，API 跟标准库接近。
4. **专业日志收集**：业务进程只输出到 stdout/文件（不轮转），由独立的 Filebeat/Fluentd 采集汇总到 ELK，轮转交给 logrotate（系统级工具，原子 mv + signal reopen）。

简单提一句 `concurrent-log-handler`：

```python
# pip install concurrent-log-handler
from cloghandler import ConcurrentRotatingFileHandler

handler = ConcurrentRotatingFileHandler(
    "app.log",
    maxBytes=100 * 1024 * 1024,
    backupCount=10,
    encoding="utf-8",
)
```

它在多进程下用 `portalocker` 文件锁串行化轮转操作，保证安全。但性能比标准库略低（每次写要加锁），单进程场景没必要用。

### 3.7 exc_info=True 让文件记录完整 traceback

```python
# 不推荐：只记消息，丢了堆栈
try:
    do_something()
except Exception as e:
    logger.error(f"失败了: {e}")

# 推荐：exc_info=True 记完整 traceback，排查时有调用栈
try:
    do_something()
except Exception:
    logger.error("处理失败", exc_info=True)
    # 或等价写法 logger.exception("处理失败")
```

文件日志是事后排查的主要依据，没有 traceback 等于只知道"错了"不知道"哪错了"。`exc_info=True` 会把当前异常的完整调用栈格式化进日志。

### 3.8 handler 用完要 close 释放句柄

```python
# 临时 handler 用完不 close，文件句柄泄漏
def debug_once():
    h = logging.StreamHandler()
    logging.getLogger("app").addHandler(h)
    ...
    logging.getLogger("app").removeHandler(h)
    h.close()   # 别忘了

# 或用 with（FileHandler 实现了 __exit__）
with logging.FileHandler("temp.log") as h:
    ...
```

程序短期能退还行，长期跑的服务如果反复 add/remove handler 而不 close，文件描述符会耗尽，最终打不开新文件。

## 4. 原理

### 4.1 FileHandler 继承 StreamHandler：把流绑到文件对象

理解 `FileHandler` 的原理要先看它的继承链：`BaseHandler` → `StreamHandler` → `FileHandler`。`StreamHandler` 的核心是持有一个"流"（`stream` 属性），`emit` 时把格式化后的记录写进这个流；`FileHandler` 的特殊之处只在于它构造时把这个流绑成一个文件对象。

简化版的内部结构：

```python
class StreamHandler(logging.Handler):
    def __init__(self, stream=None):
        super().__init__()
        if stream is None:
            stream = sys.stderr
        self.stream = stream

    def emit(self, record):
        msg = self.format(record)
        stream = self.stream
        stream.write(msg + self.terminator)   # 写入流
        self.flush()                          # 刷新缓冲

class FileHandler(StreamHandler):
    def __init__(self, filename, mode="a", encoding=None, delay=False, errors=None):
        super().__init__()   # 不传 stream，stream 暂时为 None
        self.filename = filename
        self.mode = mode
        self.encoding = encoding
        self.delay = delay
        if not delay:
            # 立即打开文件，赋值给 self.stream
            self._open()

    def _open(self):
        # 用指定 mode/encoding 打开文件，返回文件对象
        stream = open(self.filename, self.mode, encoding=self.encoding, errors=errors)
        self.stream = stream
        return stream
```

所以 `FileHandler` 本质就是"构造时 open 文件赋给 stream，emit 时 write"。`delay=True` 时把 `_open()` 推迟到第一次 `emit`——第一次写日志时才真正 open。这点对轮转 handler 很重要：轮转 handler 会反复开关文件，提前 open 没意义还可能在文件路径配置错时一上来就报错。

`emit` 里调 `flush()` 是为了把缓冲区的内容刷到磁盘。默认文件对象是行缓冲或块缓冲，不 flush 进程崩溃时可能丢最后几条日志。但每次 emit 都 flush 也有性能代价，高频日志场景下会变慢。这是个吞吐 vs 可靠性的权衡，标准库默认偏向可靠性（每次 flush）。

### 4.2 RotatingFileHandler 的 emit：检查大小 → 滚动重命名 → 开新文件

`RotatingFileHandler` 重写了 `emit`，在写之前加一步"检查文件大小，超阈值则轮转"。核心逻辑（简化）：

```python
class RotatingFileHandler(BaseRotatingHandler):
    def __init__(self, filename, mode="a", maxBytes=0, backupCount=0, ...):
        super().__init__(filename, mode, ...)
        self.maxBytes = maxBytes
        self.backupCount = backupCount

    def emit(self, record):
        try:
            # 1. 确保文件已打开（delay 模式下首次会 open）
            if self.stream is None:
                self._open()
            # 2. 检查当前文件大小是否超阈值
            if self._should_rollover(record):
                self._do_rollover()   # 执行轮转
            # 3. 轮转后 stream 可能变了（被 reopen），重新写入
            logging.FileHandler.emit(self, record)   # 复用父类的写逻辑
        except Exception:
            self.handleError(record)

    def _should_rollover(self, record):
        if self.maxBytes > 0:
            # 检查当前文件大小
            self.stream.seek(0, 2)   # seek 到末尾
            if self.stream.tell() >= self.maxBytes:
                return True
        return False

    def _do_rollover(self):
        # 1. 关闭当前文件
        self.stream.close()
        self.stream = None
        # 2. 删除最旧的归档（.backupCount）
        if self.backupCount > 0:
            for i in range(self.backupCount, 0, -1):
                sfn = f"{self.baseFilename}.{i}"
                if os.path.exists(sfn):
                    if i == self.backupCount:
                        os.remove(sfn)           # 最旧的删掉
                    else:
                        os.rename(sfn, f"{self.baseFilename}.{i+1}")
        # 3. 当前文件改名为 .1
        dfn = f"{self.baseFilename}.1"
        if os.path.exists(dfn):
            os.remove(dfn)
        os.rename(self.baseFilename, dfn)
        # 4. 重新打开新文件（a 模式）
        self._open()
```

**滚动重命名的顺序很关键**：从最老的编号往新的方向处理。先删 `.backupCount`（最旧），然后把 `.backupCount-1` 改名成 `.backupCount`，… 最终把当前文件改名成 `.1`，再开新文件。这个顺序保证了任何时刻不会有两个文件同名，重命名不会冲突。

注意轮转是"写之前检查"`_should_rollover` 在 `emit` 开头判断当前文件大小是否已达 `maxBytes`，是的话先轮转再写。所以单条记录可能让文件略微超过 `maxBytes`——上一条写完后达到阈值，下一条到来时先轮转，新文件第一条记录写进去；但如果你单条记录本身就比 `maxBytes` 大，文件会超过阈值很多（轮转后开新文件写这一条，写完已经超了，但下一条到来才会再轮转）。设 `maxBytes` 时要预估单条记录大小，别设得比单条还小。

**delay 默认值的变化**

普通 `FileHandler` 默认 `delay=False`（构造即 open），但 `RotatingFileHandler` 实际把 `delay` 默认也设为 `False`。不过轮转 handler 在 `delay=False` 时构造即 open 第一个文件，轮转后每次 `_do_rollover` 会 close 再 open。如果联动多进程或文件被外部工具移动，`delay=True` 会更稳——每次 emit 前确保 stream 有效。但日常单进程用默认 `False` 没问题。

### 4.3 TimedRotatingFileHandler 的定时器：基于日志记录的时间触发

`TimedRgingFileHandler` 不看大小，看时间。它的轮转触发点在 `emit` 里计算"当前时间是否已跨越下一个轮转边界"。核心逻辑：

```python
class TimedRotatingFileHandler(BaseRotatingHandler):
    def __init__(self, filename, when="h", interval=1, backupCount=0, ...):
        super().__init__(filename, ...)
        self.when = when
        self.backupCount = backupCount
        # 根据 when 计算时间间隔（秒）和后缀格式
        self.interval, self.suffix, self.rotator = self._compute(...)
        # 计算下一个轮转时间点
        self.rolloverAt = self._compute_rollover(time.time())

    def emit(self, record):
        try:
            if self.stream is None:
                self._open()
            # 检查当前时间是否到了/过了下一个轮转点
            if self._should_rollover(record):
                self._do_rollover()
            logging.FileHandler.emit(self, record)
        except Exception:
            self.handleError(record)

    def _should_rollover(self, record):
        # record.created 是日志记录产生的时间（time.time()）
        if record.created >= self.rolloverAt:
            return True
        return False
```

关键点：**轮转判断用的是 `record.created`（日志记录的产生时间），不是"墙上时钟"**。这意味着如果一段时间没有日志产生，轮转不会触发——即使墙上时间已经过了好几天。比如服务周末完全没流量、一条日志都没有，那么即使到了下周一，因为没有任何 `emit` 调用，轮转也不会发生，要等到周一第一条日志到来时才触发一次轮转。

这带来一个副作用：长时间空闲后的第一条日志会触发一次轮转，归档文件名后缀的日期是"最后一条日志所在的时段"，可能跟实际日期有出入。对绝大多数持续运行的服务这个不是问题，但要心里有数：**`TimedRotatingFileHandler` 的轮转精度依赖于有日志产生**。

**rolloverAt 的计算**

`_compute_rollover` 根据 `when` 算下一个边界：

- `when="S"`/`"M"`/`"H"`/`"D"`：`rolloverAt = 当前时间 + interval × 单位秒数`，简单累加。
- `when="midnight"`：算今天 `atTime` 时刻的 unix 时间戳，如果当前已过这个时刻，rolloverAt 是明天的这个时刻。即固定每天 0 点（或 `atTime`）。
- `when="W0"`~`"W6"`：算下一个指定星期几的 0 点。

`midnight` 比 `D` 更"固定边界"的原因就在这里：`D` 是累加 24 小时，起点是启动时刻；`midnight` 是对齐到自然天的 0 点。

**归档文件名后缀**

`_do_rollover` 里用 `time.strftime(self.suffix, time.localtime(rolloverAt - self.interval))` 生成归档文件名，比如 `app.log.2025-01-09`。时间取的是 `rolloverAt - interval`，即"刚结束的这段时间段"的代表时刻，所以归档名对应的是被归档的那一天。

### 4.4 多 handler 的处理链：各自独立 format / level

logger 的 `handle` 方法把一条记录分发给所有 handler，每个 handler 独立处理。简化结构：

```python
class Logger:
    def handle(self, record):
        if (not self.disabled
                and record.levelno >= self.getEffectiveLevel()):
            self.callHandlers(record)

    def callHandlers(self, record):
        c = self
        found = 0
        while c:
            for hdlr in c.handlers:
                found += 1
                hdlr.handle(record)          # 分发给每个 handler
            if not c.propagate:
                break
            c = c.parent                       # 沿父链向上传播

class Handler:
    def handle(self, record):
        # handler 自己的级别过滤
        if record.levelno >= self.level:
            self.acquire()                     # 线程锁
            try:
                self.emit(record)
            finally:
                self.release()
```

所以一条记录的处理链是：
1. logger 自己检查级别（`getEffectiveLevel`），不够直接丢。
2. logger 调 `callHandlers`，遍历自己的 handlers 列表，再向上到父 logger 的 handlers（除非 `propagate=False`）。
3. 每个 handler 在 `handle` 里再做一次级别检查（`record.levelno >= self.level`）。
4. 通过的 handler 调 `emit`，emit 里 `self.format(record)` 用自己的 formatter 格式化，然后输出到自己的目标。

这就解释了为什么多个 handler 可以"同源异构"：同一条记录到了文件 handler 用详细格式、到了控制台 handler 用精简格式，互不影响——因为 formatter 是 handler 的属性，每个 handler 各自格式化一份。

`acquire`/`release` 是线程锁，保证多线程同时调 `emit` 时不会写交错。但这个锁是**线程级**的，不是进程级，所以多进程同写一个 handler 仍然不安全（见 3.6）。

### 4.5 轮转的原子性与并发限制

标准库轮转的"非原子性"是它不能多进程共用的根本原因。一次轮转涉及多步文件操作：

```
1. close(app.log 的 fd)
2. remove(app.log.backupCount)   # 删最旧
3. rename(app.log.backupCount-1 → app.log.backupCount)
...
4. rename(app.log → app.log.1)
5. open(new app.log)
```

这几步不是原子的，中间任何一步被打断都可能留下不一致状态。两个进程同时触发轮转时：

- 进程 A 刚 `rename(app.log → app.log.1)`，进程 B 还持有旧的 fd（指向已被改名为 `.1` 的文件），继续往里写——写到了归档文件而不是当前文件。
- 进程 B 也尝试 `rename(app.log → app.log.1)`，但 `app.log` 已经被 A 拿走了（或 B 的 fd 还指向旧路径），rename 失败或覆盖错误文件。
- 极端情况：A 和 B 都执行 remove 阶段，可能删掉不该删的归档。

所以标准库文档明确说：`RotatingFileHandler` 和 `TimedRotatingFileHandler` **只适用于单进程**。多进程方案的原理是"把写文件收敛到单一执行者"：

- `QueueHandler` + `QueueListener`：业务进程用 `QueueHandler.put` 把记录塞进 `multiprocessing.Queue`（队例操作是进程安全的），单监听进程从队列取记录写到文件——只有监听进程在调 handler 的 emit，所以轮转安全。
- `concurrent-log-handler`：每次 emit 用文件锁（`portalocker.flock`）串行化"检查 + 轮转 + 写"。进程 A 拿到锁，完整做完轮转并写入，释放锁；进程 B 等到锁再进。代价是并发度退化成串行写，但正确性有保证。
- 系统级 `logrotate`：外部工具按大小/时间 mv 文件（mv 在同一文件系统下是原子的），然后给进程发 `SIGHUP` 让它 reopen 文件。但这要 handler 支持 reopen，标准库 FileHandler 不直接支持，要自己实现或用第三方。

记住这条结论：**标准库日志轮转 = 单进程安全，多进程必须换方案**。

## 5. 总结

本篇围绕"日志怎么写文件、怎么不撑爆磁盘"展开，核心内容回顾：

- `logging.FileHandler(filename, mode, encoding)` 是最基础的文件输出 handler，构造时 open 文件、emit 时 write。`mode` 默认 `"a"`（追加）务必用，`encoding="utf-8"` 务必显式指定。
- 单文件无限增长会撑爆磁盘、排查困难，因此需要日志轮转：达条件时改名归档、开新文件、保留若干份后自动删最旧的。
- `logging.handlers.RotatingFileHandler(filename, maxBytes, backupCount)` 按大小轮转。每次 emit 检查文件大小，超 `maxBytes` 就把 `.log → .log.1 → .log.2 …`、删掉超过 `backupCount` 的最旧文件、开新文件。总占用上限约 `maxBytes × (backupCount + 1)`。
- `logging.handlers.TimedRotatingFileHandler(filename, when, interval, backupCount)` 按时间轮转。`when="midnight"` 每天固定时刻切（最常用），`"H"` 每小时切，`"D"` 不推荐（边界跟启动时刻有关）。轮转判断基于日志记录的产生时间，无日志则不触发。
- 多 handler：logger 挂多个 handler，一条记录分发给所有 handler，各自独立 format 和 level。文件 handler 写文件、`StreamHandler` 写控制台，组合成"既落盘又实时看"的配置。
- 级别双层过滤：logger 级别是总闸、handler 级别是分闸，记录要同时通过两层才会输出。典型做法是 logger 放宽到 DEBUG，handler 各自决定收什么级别，灵活控制不同输出的详细程度。
- `addHandler`/`removeHandler` 可动态增删 handler，移除后不再分发，但 handler 对象要 `close()` 释放文件句柄。
- 多进程同写一个日志文件不能用标准库轮转（非原子），需改用每进程独立文件、QueueHandler+QueueListener 单进程消费、`concurrent-log-handler` 文件锁，或外部 logrotate + ELK 收集。

读完本文你应能掌握：

- 能用 `FileHandler` 把日志写到文件并正确指定 `mode`/`encoding`。
- 能说明为何需要轮转，并选用 `RotatingFileHandler`（按大小）或 `TimedRotatingFileHandler`（按时间）配置日志切分，合理设置 `maxBytes`/`when`/`backupCount`。
- 能给一个 logger 配多个 handler，实现文件 + 控制台双输出，并让各 handler 用不同级别和格式。
- 能说清 logger 级别与 handler 级别的双层过滤机制，正确设计级别分层。
- 能说明标准库轮转在多进程下不安全的原因，并给出至少一种多进程日志方案的原理。