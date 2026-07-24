---
group:
  title: 【19】标准库精讲
  order: 19
order: 16
title: logging.basicConfig 日志配置
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 logging 模块

`logging` 是 Python 标准库提供的通用日志框架，用来在程序运行过程中记录结构化的诊断信息。它和 `print` 的根本区别在于：`logging` 给每条日志附加了"级别"（这条信息是调试细节、正常提示、还是错误告警）、"时间"（什么时候发生的）、"来源"（哪个模块/函数发出的）等元数据，并允许你把这些信息按统一格式输出到不同目标（终端、文件、远程服务）。

在实际项目中，日志几乎是唯一可靠的线上排障手段。程序在本机跑得好好的，到了测试或生产环境突然报错，你不可能靠 `print` 猜现场——既没有时间戳、又无法区分严重程度、更没法把 DEBUG 级别的絮叨信息和 ERROR 级别的崩溃记录分别送到不同地方。`logging` 模块把这些需求一次性解决：它提供了一整套"记录—过滤—格式化—分发"的处理链，让你用几行配置就能搭起一套够用的日志体系。

`logging` 模块无需安装，直接 `import logging` 即可使用。它是线程安全的，跨模块共享同一套 logger 层级，因此你在不同模块里写的日志最终都汇聚到同一套配置下。

### 1.2 本篇聚焦：basicConfig 与基础日志记录

`logging` 模块功能庞大，包含 logger、handler、filter、formatter、日志轮转、网络日志等高级特性。本篇不贪多，只聚焦最基础也最常用的入口：`logging.basicConfig`——它是一个"一次性配置 root logger"的便捷函数，适合中小脚本、学习阶段、以及不需要分文件分级别输出的场景。

本篇讲清楚以下几件事，就达到目的：

- 日志级别（DEBUG/INFO/WARNING/ERROR/CRITICAL）的含义与级别数值；
- `logging.getLogger(name)` 获取 logger 对象；
- `logging.basicConfig` 的关键参数 `level`、`format`、`datefmt`、`filename`、`handlers`；
- 用 logger 的 `debug/info/warning/error/critical` 方法记录日志；
- 为什么 `basicConfig` 只在"首次调用"生效、第二次再调为啥没反应；
- 不配 `basicConfig` 时的默认行为（WARNING 级、输出到 stderr）；
- 模块级 `logger = logging.getLogger(__name__)` 的最佳实践。

日志轮转（`RotatingFileHandler`）、`FileHandler` 的更多细节、以及自定义 handler/filter 的进阶用法，留到系列第 17 篇展开。本篇打好基础，第 17 篇再往上加东西。

### 1.3 本篇核心 API 速览

下表列出本篇会详细讲解的 API，先建立一个整体印象，后面每节会展开。

| API | 类型 | 作用 |
|-----|------|------|
| `logging.basicConfig(**kwargs)` | 函数 | 一次性配置 root logger（level/format/filename/handlers 等） |
| `logging.getLogger(name)` | 函数 | 按名称获取 logger 对象，同名返回同一实例 |
| `logging.getLogger()` | 函数（无参） | 获取 root logger 本身 |
| `logger.setLevel(level)` | 方法 | 设置该 logger 的最低输出级别 |
| `logger.debug(msg)` | 方法 | 记录 DEBUG 级别日志 |
| `logger.info(msg)` | 方法 | 记录 INFO 级别日志 |
| `logger.warning(msg)` | 方法 | 记录 WARNING 级别日志 |
| `logger.error(msg)` | 方法 | 记录 ERROR 级别日志 |
| `logger.critical(msg)` | 方法 | 记录 CRITICAL 级别日志 |
| `logging.DEBUG/INFO/WARNING/ERROR/CRITICAL` | 常量 | 五个日志级别对应的数值 |
| `logging.getLevelName(level)` | 函数 | 级别数值与名称互转 |

### 1.4 最小用法示例

先用一个最小程序感受 `basicConfig` 的基本用法。下面这个脚本配置了 INFO 级别的日志输出，带时间戳和级别，然后在不同地方打了几条日志：

```python
import logging

# 一次性配置 root logger：级别 INFO、带时间/级别/信息的格式
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

logging.debug("这行不会输出，因为级别低于 INFO")
logging.info("程序启动")
logging.warning("磁盘剩余空间不足 10%")
logging.error("请求失败：连接超时")
logging.critical("数据库主节点宕机，立即人工介入")
```

运行结果：

```
# 输出：
# 2025-07-23 10:15:30,210 [INFO] 程序启动
# 2025-07-23 10:15:30,210 [WARNING] 磁盘剩余空间不足 10%
# 2025-07-23 10:15:30,210 [ERROR] 请求失败：连接超时
# 2025-07-23 10:15:30,211 [CRITICAL] 数据库主节点宕机，立即人工介入
```

从输出可以看到三个关键现象：第一，`debug` 那行没有出现，因为它的级别低于配置的 INFO，被过滤掉了；第二，每条日志都自动带上了时间戳和级别标签，这是 `format` 参数的功劳；第三，这些日志输出到了终端（stderr），因为没指定 `filename`。这三个现象背后分别对应级别过滤、格式化、输出目标三条线，下面逐一展开。

## 2. 核心内容

### 2.1 日志级别：DEBUG / INFO / WARNING / ERROR / CRITICAL

日志级别是 `logging` 的第一道分拣机制。每条日志记录都携带一个级别，代表这条信息的"重要程度"。`logging` 模块定义了五个标准级别，每个级别对应一个整数常量：

| 级别 | 常量 | 数值 | 典型用途 |
|------|------|------|----------|
| DEBUG | `logging.DEBUG` | 10 | 详细的调试信息，正常生产环境关闭 |
| INFO | `logging.INFO` | 20 | 确认程序按预期运行的常规信息 |
| WARNING | `logging.WARNING` | 30 | 表明有意外或潜在问题，程序仍在运行 |
| ERROR | `logging.ERROR` | 40 | 因较严重问题，某些功能未能执行 |
| CRITICAL | `logging.CRITICAL` | 50 | 严重错误，程序本身可能无法继续运行 |

级别的核心规则是"阈值过滤"：当你把 logger 的级别设为某一级，只有数值**大于等于**该数值的日志才会被输出。设成 INFO（20），DEBUG（10）就被挡掉，INFO 及其以上都放行。

**级别数值的设计意图**：用整数而非字符串，是为了让比较变成简单的数字比较，开销极低。`logging` 内部判断一条日志要不要输出，第一步就是 `if record.levelno >= logger.level`，一次整数比较就能决定是否继续后续（格式化、分发等）开销较大的流程。

你可以用 `logging.getLevelName` 在数值与名称之间转换：

```python
import logging

print(logging.getLevelName(logging.WARNING))  # 名称
print(logging.getLevelName("ERROR"))           # 传名称返回数值
print(logging.DEBUG, logging.INFO, logging.WARNING, logging.ERROR, logging.CRITICAL)
```

```
# 输出：
# WARNING
# 40
# 10 20 30 40 50
```

注意 `getLevelName` 是个双向函数：传整数返回名称字符串，传名称字符串返回整数。这个设计在需要根据用户输入的字符串级别（如 `"INFO"`）配置日志时很常用。

**级别只是"建议"，不强制语义**：`logging` 无法判断你的某条信息到底算 INFO 还是 WARNING，它只提供级别载体，语义由你决定。一个常见约定是：正常业务流程关键节点用 INFO，可恢复的异常用 WARNING，导致某功能失败的异常用 ERROR，影响整体运行的根本故障用 CRITICAL，开发期排查问题时用 DEBUG。团队内统一约定即可。

### 2.2 logging.getLogger(name)：获取 logger 对象

`logger` 是真正"发日志"的对象。你调用 `logger.info("xxx")` 时，一条日志记录就被创建并送入处理链。`getLogger` 用来按名称获取 logger，**同名总是返回同一个实例**——这是模块间共享 logger 配置的基础。

```python
import logging

logger_a = logging.getLogger("app")
logger_b = logging.getLogger("app")
print(logger_a is logger_b)  # 同名返回同一对象
```

```
# 输出：
# True
```

**关键概念：root logger**。当你不传参数调用 `logging.getLogger()` 时，返回的是一个特殊的"根 logger"，名字叫 `"root"`。`logging.basicConfig` 的所有配置都是作用在 root logger 上的。

更有意思的是：你直接调用模块级的 `logging.info(...)`、`logging.warning(...)` 这些方法时，本质也是先拿到 root logger 再记录。换句话说，`logging.info("x")` 等价于 `logging.getLogger().info("x")`，即 `logging.getLogger("root").info("x")`。

```python
import logging

# 以下两种写法等价，都在操作 root logger
logging.warning("直接调模块级方法")
logging.getLogger().warning("显式拿 root 再调")
```

这也是为什么 `basicConfig` 改了 root logger 的配置后，你在代码里不显式 `getLogger`、直接写 `logging.info(...)` 也能生效——所有模块级便捷方法都走的是 root。

**为什么实际项目里不直接用模块级函数、而要 `getLogger(name)`**：因为模块级方法全部写到 root 上，你无法区分某条日志来自哪个模块。`getLogger(name)` 给 logger 取一个有业务含义的名字，这个名字会出现在日志格式里（通过 `%(name)s`），让你一眼看出是哪个模块打的。这一点在最佳实践章会展开。

### 2.3 logging.basicConfig：一次性配置 root logger

`basicConfig` 是 `logging` 提供的"开箱配置"便捷函数。它的作用是在 root logger 还没有任何 handler 时，给它装上一个 StreamHandler（输出到 stderr）或 FileHandler（输出到文件），并配上你指定的 Formatter 和 level。**它的定位是"一次性、够用就行"**——适合中小脚本，不适合需要多 handler、多 logger 分级控制的复杂工程。

**函数签名**：

```python
logging.basicConfig(
    filename=None,     # 不写=输出到 stderr；写文件路径=输出到该文件
    filemode="a",      # 配合 filename，默认追加 "a"，可改为 "w" 覆盖
    format=...,        # 日志格式字符串
    datefmt=...,       # 时间格式，配合 format 里的 %(asctime)s
    style="%",         # 格式占位符风格，默认 "%"，可选 "{" 或 "$"
    level=logging.WARNING,  # root logger 的最低级别，默认 WARNING
    stream=None,       # 输出流，与 filename 二选一
    handlers=...,      # 手动指定 handler 列表，优先级高于 filename/stream
    force=False,       # 为 True 时强制覆盖已有 handler 重新配置
    encoding=None,     # 文件编码，3.9+ 才支持
    errors="backslashreplace",  # 编码错误处理，3.9+ 才支持
)
```

下面对照表说明各参数的默认值与常用取值：

| 参数 | 默认值 | 常用取值 | 作用 |
|------|--------|----------|------|
| `level` | `WARNING` | `logging.DEBUG/INFO/WARNING/ERROR` | root logger 最低级别 |
| `format` | `%(levelname)s:%(name)s:%(message)s` | 自定义 | 日志行格式 |
| `datefmt` | 默认含毫秒的 `%Y-%m-%d %H:%M:%S,mmm` | `"%Y-%m-%d %H:%M:%S"` | `%(asctime)s` 的时间格式 |
| `filename` | `None`（输出 stderr） | `"app.log"` | 输出到文件则不输出到终端 |
| `filemode` | `"a"` | `"w"` | 仅 filename 有效 |
| `handlers` | `None` | `[StreamHandler(), FileHandler()]` | 多个输出目标 |
| `force` | `False` | `True` | 强制重配，覆盖旧 handler |

下面逐个讲最常用的几个参数。

#### 2.3.1 level：设置最低输出级别

`level` 决定 root logger 接受哪些级别的日志。设置后，低于该级别的记录会被直接丢弃，不会走格式化和输出流程。

```python
import logging

logging.basicConfig(level=logging.WARNING)

logging.info("这条 INFO 会被丢弃")       # 20 < 30，不输出
logging.warning("这条 WARNING 会输出")   # 30 >= 30，输出
logging.error("这条 ERROR 也会输出")     # 40 >= 30，输出
```

```
# 输出：
# WARNING:root:这条 WARNING 会输出
# ERROR:root:这条 ERROR 也会输出
```

注意此时没配 `format`，所以用的是默认格式 `级别:logger名:信息`，logger 名是 `root`（因为没有显式 getLogger）。

开发期把 level 设成 DEBUG 能看到全部细节，生产环境通常设成 INFO 或 WARNING 以减少日志量和噪音。

#### 2.3.2 format：日志行格式

`format` 是一个带有 `%` 占位符的格式字符串，用来控制每条日志长什么样。下面列出最常用的占位符：

| 占位符 | 含义 | 示例值 |
|--------|------|--------|
| `%(asctime)s` | 时间，配合 `datefmt` 可定制 | `2025-07-23 10:15:30,210` |
| `%(levelname)s` | 级别名 | `INFO` |
| `%(levelno)s` | 级别数值 | `20` |
| `%(name)s` | logger 名 | `app.payment` |
| `%(message)s` | 日志正文 | `支付成功` |
| `%(module)s` | 模块名（不含后缀） | `payment` |
| `%(funcName)s` | 函数名 | `process_order` |
| `%(lineno)d` | 调用所在行号 | `42` |
| `%(process)d` | 进程 ID | `12345` |
| `%(thread)d` | 线程 ID | `140735` |
| `%(filename)s` | 文件名 | `payment.py` |
| `%(pathname)s` | 完整文件路径 | `/app/src/payment.py` |
| `%(created)f` | 创建时间，浮点时间戳 | `1753256130.21` |

下面这个示例把时间、级别、logger 名、函数名、行号、正文都拼进格式：

```python
import logging

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(funcName)s:%(lineno)d | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger("app")

def process_order(order_id):
    logger.debug("开始处理订单 order_id=%s", order_id)
    logger.info("订单 %s 处理完成", order_id)

process_order("ORD-2025-0001")
```

```
# 输出：
# 2025-07-23 10:15:30 | DEBUG   | app | process_order:11 | 开始处理订单 order_id=ORD-2025-0001
# 2025-07-23 10:15:30 | INFO    | app | process_order:12 | 订单 ORD-2025-0001 处理完成
```

注意几个细节：第一，`%(levelname)-7s` 的 `-7` 是左对齐并占 7 字符宽度，这样不同长度级别名也能让后面的列对齐，看起来像表格；第二，`logger.debug("开始处理订单 order_id=%s", order_id)` 用的是延迟格式化——传位置参数，由 logging 在确实要输出该日志时才做 `%` 格式化，比 `f"..."` 提前格式化更省开销（被过滤掉的日志完全不会格式化）；第三，`datefmt` 用的是 `strftime` 的格式字符串。

**延迟格式化的好处**：

```python
# 推荐：被过滤时不做字符串拼接
logger.debug("大列表内容: %s", expensive_serializer(big_list))

# 不推荐：无论是否输出都会先算出字符串
logger.debug(f"大列表内容: {expensive_serializer(big_list)}")
```

当 level 设为 INFO 时，上面的 DEBUG 日志被丢弃，推荐写法完全不会调用 `expensive_serializer`，而不推荐写法无论如何都会先算出那个字符串再丢弃，白白浪费。这点在 best practice 里会再强调。

#### 2.3.3 datefmt：时间格式

`%(asctime)s` 默认显示成 `2025-07-23 10:15:30,210` 这种带逗号毫秒的形式。如果想要别的格式，用 `datefmt` 指定一个 `strftime` 风格的格式串：

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%Y/%m/%d %H:%M:%S",   # 没有毫秒
)

logging.info("服务器启动")
```

```
# 输出：
# 2025/07/23 10:15:30 INFO 服务器启动
```

`datefmt` 接受的就是 `time.strftime` 用的那些占位符：`%Y` 四位年、`%m` 月、`%d` 日、`%H` 时、`%M` 分、`%S` 秒、`%f` 微秒（6 位）、`%A` 星期名等。

有一个细节坑：一旦你显式写了 `datefmt`，默认带的毫秒部分（`,210`）就没了，因为毫秒是通过 logging 内部用 `,` 拼到默认格式里的，而不是 `%f`。如果还想保留毫秒，自己在 `datefmt` 里加 `,%f` 或 `.%f`：

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(message)s",
    datefmt="%H:%M:%S.%f",   # 用 .%f 显式带上微秒（6 位）
)

logging.info("带微秒的时间")
```

```
# 输出：
# 10:15:30.210492 带微秒的时间
```

注意 `%f` 是 6 位微秒而非 3 位毫秒，多数情况够用。

#### 2.3.4 filename 与 filemode：输出到文件

默认不写 `filename` 时，日志输出到 stderr 终端。写上 `filename` 后，`basicConfig` 会给 root logger 挂一个 `FileHandler`，日志全部写入该文件，**不再输出到终端**。

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    filename="app.log",      # 写文件
    filemode="w",            # 每次运行覆盖；省略则默认 "a" 追加
    encoding="utf-8",        # 3.9+ 支持，保证中文不乱码
)

logging.info("这条会写到 app.log，终端上看不到")
logging.warning("中文日志也安全")
```

```
# 终端无输出，文件 app.log 内容：
# 2025-07-23 10:15:30 INFO 这条会写到 app.log，终端上看不到
# 2025-07-23 10:15:30 WARNING 中文日志也安全
```

**filemode 选 `a` 还是 `w`**：默认 `"a"` 追加，意味着程序每次启动写的日志会接在文件末尾不丢失，最常用；`"w"` 覆盖，每次启动清空重写，只适合调试期想保持文件干净的场景。生产环境永远用 `"a"`，否则一次重启就把历史日志洗白了。

**filename 和 stream/handlers 互斥**：`basicConfig` 里 `filename` 和 `stream` 不能同时给（会抛 `ValueError`）。如果你既想输出到终端又想写到文件，就得用 `handlers` 参数显式传两个 handler，而不是靠 `filename`。

```python
# 同时写终端和文件（推荐用 handlers）
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[
        logging.StreamHandler(),                       # 终端
        logging.FileHandler("app.log", encoding="utf-8"),  # 文件
    ],
)

logging.info("这条同时出现在终端和文件里")
```

```
# 终端输出：
# 2025-07-23 10:15:30 INFO 这条同时出现在终端和文件里
# 文件 app.log 内容相同
```

handler 的细节（FileHandler、StreamHandler、RotatingFileHandler）留到第 17 篇展开，这里只需要知道 `handlers` 参数让你能同时配多个输出目标。

#### 2.3.5 handlers：显式指定 handler 列表

`handlers` 参数优先级高于 `filename` 和 `stream`：只要给了 `handlers`，`filename`/`stream`/`filemode` 都被忽略。这个参数常用于"既输出到终端又写到文件"或"不同级别走不同文件"的场景。

```python
import logging

# 一个 handler 负责终端、一个负责文件
console = logging.StreamHandler()
console.setLevel(logging.WARNING)   # 终端只显示 WARNING 及以上

file_handler = logging.FileHandler("error.log", encoding="utf-8")
file_handler.setLevel(logging.ERROR)  # 文件只记 ERROR 及以上

logging.basicConfig(
    level=logging.DEBUG,   # root 设最低，让各 handler 自己决定阈值
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[console, file_handler],
)

logging.info("INFO：终端看不到（console 要 WARNING），文件看不到（file 要 ERROR）")
logging.warning("WARNING：终端看得到，文件看不到")
logging.error("ERROR：终端、文件都看得到")
```

```
# 终端输出（StreamHandler，>= WARNING）：
# 2025-07-23 10:15:30 WARNING WARNING：终端看得到，文件看不到
# 2025-07-23 10:15:30 ERROR ERROR：终端、文件都看得到
# 文件 error.log 内容（FileHandler，>= ERROR）：
# 2025-07-23 10:15:30 ERROR ERROR：终端、文件都看得到
```

这里出现了"logger level"和"handler level"两层阈值，原理章会详细解释——简单说就是 logger 先按自己的 level 过滤一遍，通过的再交给每个 handler 按各 handler 的 level 再过滤一遍。这两层独立，能组合出"终端只 warning 以上、文件只 error 以上"这种分发效果。

#### 2.3.6 force：强制重新配置（3.8+）

`basicConfig` 默认只在 root logger 没有 handler 时才生效，否则静默忽略。这就是为什么"第二次调用 `basicConfig` 没反应"——首次调用已经把 handler 挂上去了，再调一次被跳过。

`force=True`（Python 3.8 新增）会先把 root logger 已有的所有 handler 移除，再重新配置。这在测试、Jupyter notebook、需要中途切配置的场景里有用：

```python
import logging

logging.basicConfig(level=logging.INFO, format="%(message)s")
logging.info("第一次配置生效")
# 再调一次，默认无效
logging.basicConfig(level=logging.DEBUG, format="%(levelname)s %(message)s")
logging.debug("这行不会出现——第二次被跳过")

# 用 force 强制重配
logging.basicConfig(level=logging.DEBUG, format="%(levelname)s %(message)s", force=True)
logging.debug("这次出现了——force=True 清掉旧 handler 重新配")
```

```
# 输出：
# 第一次配置生效
# DEBUG 这次出现了——force=True 清掉旧 handler 重新配
```

注意 `force` 会丢弃旧 handler（包括可能被别的代码加的），生产代码里慎用，一般在测试或脚本 starting 阶段使用。

### 2.4 logger 的五个记录方法

拿到 logger 对象后，调用它的 `debug/info/warning/error/critical` 方法即可记录对应级别的日志。这五个方法签名一致，只是预设级别不同：

```python
logger.debug(msg, *args, **kwargs)
logger.info(msg, *args, **kwargs)
logger.warning(msg, *args, **kwargs)
logger.error(msg, *args, **kwargs)
logger.critical(msg, *args, **kwargs)
```

- `msg`：日志正文，可以是字符串，也可以是任意对象（会调 `str()`）；
- `*args`：用于 `%`-style 延迟格式化的参数；
- `**kwargs`：最常用的是 `exc_info=True`，把当前异常的 traceback 也打出来；`stack_info=True` 打调用栈。

#### 2.4.1 基本记录

```python
import logging

logging.basicConfig(level=logging.DEBUG, format="%(levelname)s: %(message)s")

logger = logging.getLogger("app.order")

logger.info("订单创建成功")
logger.warning("库存仅剩 %d 件，需要补货", 3)   # 延迟格式化
logger.debug("用户对象: %r", {"id": 42, "name": "张三"})
```

```
# 输出：
# INFO: 订单创建成功
# WARNING: 库存仅剩 3 件，需要补货
# DEBUG: 用户对象: {'id': 42, 'name': '张三'}
```

`logger.warning("库存仅剩 %d 件，需要补货", 3)` 这种写法把格式串和数据分开传，由 logging 在确实要输出时才做 `%d` 替换。它的好处是：被级别过滤掉的日志根本不发生字符串拼接开销。

#### 2.4.2 exc_info=True：记录异常堆栈

这是 `error` 方法最常用的进阶用法。在 `except` 块里调用 `logger.error(..., exc_info=True)`，会把完整的异常 traceback 跟在日志后面，等于 `traceback.print_exc()` 的效果，但统一进了 logging 体系。

```python
import logging

logging.basicConfig(level=logging.ERROR, format="%(asctime)s %(levelname)s %(message)s")

logger = logging.getLogger("app")

def divide(a, b):
    return a / b

try:
    result = divide(10, 0)
except ZeroDivisionError:
    logger.error("除零异常发生，被除数=%d", 10, exc_info=True)
```

```
# 输出：
# 2025-07-23 10:15:30 ERROR 除零异常发生，被除数=10
# Traceback (most recent call last):
#   File "<stdin>", line 2, in <module>
#     result = divide(10, 0)
#   File "<stdin>", line 2, in divide
#     return a / b
# ZeroDivisionError: division by zero
```

`exc_info=True` 等价于 `exc_info=sys.exc_info()`，它会自动捕获当前正在处理的异常。在没有异常的上下文里设 `exc_info=True` 没意义（`sys.exc_info()` 返回全 None）。

也有更便捷的 `logger.exception(msg)` 方法，等价于 `logger.error(msg, exc_info=True)`，语义上是"记录一个 ERROR 并附上当前异常堆栈"：

```python
try:
    risky_operation()
except Exception:
    logger.exception("risky_operation 失败")   # 自带 exc_info=True
```

`logger.exception` 一定是 ERROR 级别，不能改；如果要在别的级别打堆栈，用对应方法加 `exc_info=True`。

### 2.5 setLevel：动态调整级别

`logger.setLevel(level)` 用于动态调整某个 logger 的最低级别。`basicConfig` 的 `level` 参数最终就是通过 `root.setLevel(...)` 落到 root 上。运行期调整级别很常见——比如开调试模式时临时把 root 级别降到 DEBUG。

```python
import logging

logging.basicConfig(level=logging.WARNING, format="%(levelname)s: %(message)s")

logger = logging.getLogger("app")

logger.debug("默认 WARNING，看不到 DEBUG")
logger.warning("能看到 WARNING")

# 运行期临时调成 DEBUG，便于排查
logging.getLogger().setLevel(logging.DEBUG)
logger.debug("现在 DEBUG 也能看到了")
```

```
# 输出：
# WARNING: 能看到 WARNING
# DEBUG: 现在 DEBUG 也能看到了
```

注意 `setLevel` 也是按 logger 对象生效——可以给 root、给 `"app"`、给 `"app.payment"` 分别设不同级别，配合 logger 层级形成精细控制（层级在原理章详述）。

### 2.6 不配 basicConfig 时的默认行为

如果程序从头到尾没调用 `basicConfig`，也没手动给 root 加 handler，那日志会是什么样？这有个"最后的 handler"兜底机制：

- root logger 的默认级别是 WARNING（30），所以低于 WARNING 的 INFO/DEBUG 默认全部被丢弃；
- 当一条日志要被记录、但 root logger 没有 handler 时，logging 模块会临时用 `sys.stderr` 输出一行"级别:logger名:信息"格式的日志，相当于 `logging.basicConfig()` 调用一次默认参数。

```python
import logging

# 不调 basicConfig
logging.debug("DEBUG 默认被丢弃")       # root 默认 WARNING，丢弃
logging.info("INFO 默认也丢弃")         # 同上
logging.warning("WARNING 会输出到 stderr")  # 兜底 handler 输出
```

```
# 输出（到 stderr）：
# WARNING:root:WARNING 会输出到 stderr
```

这个兜底行为解释了为什么有些初学者"明明没调 basicConfig，warning 也能看到"——表面上看像 logging 自带输出，其实是"没 handler 时调用最后通牒 handler"的机制在起作用。一旦你调过 `basicConfig`（哪怕只配了 level），root 就有了 handler，兜底机制就不再触发，日志只走你配的 handler。

**默认输出到 stderr 不是 stdout**：这点容易踩，下面演示的脚本里如果用 `2>` 重定向 stderr，terminal 上就只剩你 print 的内容：

```python
import logging
logging.warning("到 stderr")
print("到 stdout")
```

```bash
python demo.py 1>out.txt 2>err.txt
# out.txt: 到 stdout
# err.txt: WARNING:root:到 stderr
```

正因为 logging 默认走 stderr，`print` 走 stdout，两者可以独立重定向——这让日志和正常程序输出能分别处理，比如把 stdout 导给下游程序、stderr 留给人看报错。

### 2.7 basicConfig 只在"首次调用"生效

这是 `basicConfig` 最容易被踩的坑：**它只在 root logger 还没有 handler 时才执行配置，已有 handler 时再调用会被静默忽略**。

```python
import logging

# 第一次调用：root 无 handler，生效
logging.basicConfig(level=logging.INFO, format="%(message)s")
logging.info("第一次配置生效")

# 第二次调用：root 已有 handler，被忽略
logging.basicConfig(level=logging.DEBUG, format="%(levelname)s %(message)s")
logging.debug("看不到这行——第二次配置没生效")
```

```
# 输出：
# 第一次配置生效
```

`DEBUG` 那行没出现，说明第二次 `basicConfig` 完全没改 level、也没改 format。原因就在原理章会详述的机制：`basicConfig` 入口处的判断是"如果 root.handlers 非空，直接 return 1"。

**规避方式**：

1. 把 `basicConfig` 调用集中在程序入口（`main.py` / `__main__.py`）的最顶层，调一次就够，让其他模块只 `import logging; logger = logging.getLogger(__name__)` 然后直接打日志；
2. 测试或 Jupyter notebook 场景用 `force=True` 强制重配；
3. 复杂工程改用显式构造 handler+formatter+setLevel 的方式，不依赖 `basicConfig` 的"一次性"机制。

## 3. 最佳实践

### 3.1 模块级 logger = getLogger(__name__)

这是 `logging` 最该养成的习惯：每个模块文件顶部，写一行

```python
import logging

logger = logging.getLogger(__name__)
```

然后该模块内所有日志都走这个 `logger`。

**为什么用 `__name__` 作 logger 名**：`__name__` 是模块的"点分限定名"。在 `myproj/payment/checkout.py` 里，`__name__` 是 `myproj.payment.checkout`；在直接运行的 `main.py` 里，`__name__` 是 `__main__`。用 `__name__` 当 logger 名，logger 自动按模块结构形成层级（`myproj` → `myproj.payment` → `myproj.payment.checkout`），层级带来的好处在原理章详述。

**对比演示**：

```python
# 不推荐：直接调模块级函数，所有日志都堆在 root
import logging
logging.basicConfig(level=logging.INFO, format="%(message)s")
logging.info("发生了一件事")   # 看不出来自哪个模块

# 推荐：模块级 logger
import logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(name)s | %(message)s")
logger.info("发生了一件事")   # 格式里 %(name)s 显示模块名
```

```
# 输出：
# 发生了一件事
# __main__ | 发生了一件事
```

`%(name)s` 能让你一眼看出日志来自哪个模块，在多模块工程里这是命根子。

### 3.2 日志配置集中到程序入口

`basicConfig` 只生效一次的特性，决定了它必须放在程序入口处调用，不能每个模块各调各的。推荐的工程结构：

```python
# main.py（程序入口）
import logging

def main():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        filename="app.log",
        encoding="utf-8",
    )
    logger = logging.getLogger(__name__)
    logger.info("程序启动")
    # 调各业务模块
    from myproj.payment import checkout
    checkout.run()

if __name__ == "__main__":
    main()
```

```python
# myproj/payment/checkout.py（业务模块）
import logging

logger = logging.getLogger(__name__)   # 自动拿到 myproj.payment.checkout

def run():
    logger.info("checkout.run 开始")
    ...
```

业务模块**只取 logger、不调 basicConfig**。配置统一在 `main.py` 里调一次。这样无论你以后改 format、改 level、改输出文件，都只动 `main.py` 一处。

```python
# 错误写法：业务模块自己调 basicConfig
import logging
logging.basicConfig(level=logging.INFO)   # 只在第一个被 import 的模块生效，其他都被忽略

logger = logging.getLogger(__name__)
```

错误写法的问题：业务模块间 import 顺序不确定，"谁第一次 import 谁 basicConfig 生效"，结果就是项目实际生效的配置取决于 import 顺序，极不可控。

### 3.3 用延迟格式化而非 f-string

`logging` 的延迟格式化（`%`-style 传参）在被级别过滤的日志上完全不做字符串拼接，省开销。f-string 无论是否输出都会先算字符串。

推荐：

```python
logger.debug("复杂对象: %s", expensive_to_string(obj))
```

不推荐：

```python
logger.debug(f"复杂对象: {expensive_to_string(obj)}")
```

当 level=INFO 时，`DEBUG` 被丢弃。推荐写法根本不调用 `expensive_to_string`，不推荐写法无论如何都先算字符串再丢弃，浪费 CPU。在 DEBUG 多、生产 INFO/ERROR 的场景里这点差距会被放大。

**但有一个例外**：如果参数本身很简单（一个整数、一个短字符串），用 f-string 更直观、性能差异可忽略，可以酌情用。判断标准是"被过滤掉的那次字符串拼接是否开销大"——大就用 `%`，小就用 f-string。团队一致即可。

### 3.4 异常日志用 exc_info=True 或 exception

在 `except` 块里记录异常时，务必带上 traceback，否则只看日志你根本不知道异常发生在哪一行。

推荐：

```python
try:
    risky_call()
except Exception:
    logger.exception("risky_call 执行失败")   # 等价 error + exc_info=True
```

不推荐：

```python
try:
    risky_call()
except Exception as e:
    logger.error(f"risky_call 失败: {e}")   # 只有异常消息字符串，没有堆栈
```

不推荐写法丢失了 traceback，线上排查时你只知道"出了个 KeyError"，却不知道在哪个文件哪个函数第几行出的，等于什么都没记。

### 3.5 级别选择约定

团队内统一级别约定，避免"看心情打"。一个常见的约定：

- DEBUG：开发期排查用，包含临时变量、循环中间态、详细入参出参；生产关闭。
- INFO：业务流程关键节点，如"订单创建""任务开始/完成""用户登录"。生产环境大部分日志是这一级。
- WARNING：可恢复的异常或不影响主流程的问题，如"重试成功""降级到默认值""配置项缺失用默认"。
- ERROR：某功能失败但程序可继续，如"某接口超时返回默认值失败""单个任务处理失败"。
- CRITICAL：影响整体运行的故障，如"数据库连接断开""主循环崩溃"。

照此约定写日志，线上按级别 grep、按级别分告警（ERROR 走值班、CRITICAL 立即电话）才可行。

### 3.6 不要用 print 做正式日志

`print` 缺少 logging 的所有关键能力：

| 能力 | print | logging |
|------|-------|---------|
| 级别过滤 | 无 | 有，五级 + 自定义 |
| 时间戳 | 无 | `%(asctime)s` 自动 |
| 来源定位 | 无 | `%(name)s`/`%(module)s`/`%(funcName)s`/`%(lineno)d` |
| 输出目标控制 | `file=` 参数可改但有限 | 多 handler 自由组合终端/文件/网络 |
| 格式统一 | 手拼字符串 | Formatter 一次配置处处生效 |
| 运行期改级别 | 无 | `setLevel` 动态调 |
| 异常堆栈 | `traceback.print_exc` 散乱 | `exc_info=True` 一体化 |

简单脚本里 `print` 够用，但凡有一项需求（想过滤 DEBUG、想写文件、想统一格式、想线上 grep 级别），就该切到 logging。一开始就用 logging 比后期把 print 全替换成 logging 成本低得多。

### 3.7 basicConfig 的局限：知道何时该升级

`basicConfig` 适合"配一遍、所有日志都按这套走"的简单场景。当出现以下任一需求，就该跳出 basicConfig、改用显式 handler 构造（第 17 篇主题）：

- 需要日志轮转（按大小或日期切文件）；
- 需要不同级别日志写不同文件；
- 需要同时输出到终端和文件，且两者格式不同；
- 需要 socket/http 等网络 handler；
- 需要给不同子模块设不同 level。

`basicConfig` 的设计哲学就是"够用就好"，强行让它做复杂工程会各种踩坑（如 handlers 参数要自己写 handler、错过 basicConfig 调用顺序、force 难管理）。识别升级时机、及时切到显式 handler 配置，是工程化的标志。

## 4. 原理

本章解释 `basicConfig` 与 logger 体系背后的几个关键机制：logger 的层级命名与 handler 传播、`basicConfig` 给 root 装 StreamHandler+Formatter 的过程、logger level 与 handler level 的双层过滤、为什么首次配置后再调 `basicConfig` 无效、一条日志从 `logger.info` 到最终输出的完整处理链、以及 `__name__` 如何让 logger 自动归属模块层级。理解这些原理，才能在"配置没生效""日志两条重复""child logger 级别不受 root 控制"这类怪现象出现时一眼看穿原因。

### 4.1 logger 的层级命名与点分父子关系

`logging` 的 logger 不是扁平的一群对象，而是按"点分名字"形成的树形层级。名字 `"a.b.c"` 的 logger 是 `"a.b"` 的子，`"a.b"` 又是 `"a"` 的子，`"a"` 的父是 root。root 是树根，名字固定 `"root"`，对应 `logging.getLogger()` 的返回。

层级树的关键规则是：**日志记录的传播（propagation）默认沿父链向上**。一条记录在某个 logger 上生成后，先经该 logger 自己的 handler 处理，然后传给父 logger 的 handler，再传给祖父……一直传到 root 的 handler。这种"向上传播"让一个挂在 root 上的 handler 能接收到所有 child logger 发出的日志。

为什么 `basicConfig` 只配 root、却在 `logger = getLogger("app.payment")` 里 `logger.info(...)` 也能看到日志？就是因为这条日志记录从 `app.payment` logger 生成后，沿 `app.payment → app → root` 一路传播上来，最终被 root 的 StreamHandler 输出。child logger 没自己的 handler，全靠传播到 root 才有输出。

**一个具象示例**：

```python
import logging

logging.basicConfig(level=logging.DEBUG, format="%(name)s | %(levelname)s | %(message)s")

# 三层 logger，都未配自己的 handler
a = logging.getLogger("a")
b = logging.getLogger("a.b")
c = logging.getLogger("a.b.c")

c.info("来自 a.b.c 的日志")
```

```
# 输出：
# a.b.c | INFO | 来自 a.b.c 的日志
```

`c` 没有自己的 handler，但日志还是输出了——因为记录从 `c` 传播到 `a.b`、再到 `a`、再到 root，被 root 的 handler 输出。`%(name)s` 显示的是记录的"原始 logger 名"（`a.b.c`），不会因为传播变成父名。

**关闭传播**：`logger.propagate = False` 可以让某个 logger 不向父传播。需求场景常见于"某模块日志只想去自己的文件、不混入 root 输出"。

```python
import logging

logging.basicConfig(level=logging.DEBUG, format="%(name)s: %(message)s")

special = logging.getLogger("special")
special_handler = logging.FileHandler("special.log", encoding="utf-8")
special_handler.setFormatter(logging.Formatter("%(message)s"))
special.addHandler(special_handler)
special.propagate = False   # 不再向 root 传播

special.info("只进 special.log，不进终端")
logging.getLogger("other").info("other 仍进终端")
```

```
# 终端输出：
# other: other 仍进终端
# 文件 special.log：
# 只进 special.log，不进终端
```

`special.info` 那条没在终端出现，因为 `propagate=False` 阻止了向上传播到 root。这正是"让某模块日志独立到一个文件、不在主输出里出现"的常规做法。

**层级对 level 的影响**：每个 logger 有自己的 effective level（有效级别）。如果一个 logger 没显式 `setLevel`，它的有效级别沿父链向上找，直到找到第一个设过 level 的祖先；如果一路找到 root 都没设过，用 root 的默认 WARNING。这就是为什么"你只 `getLogger("app")` 而没给它设 level，它默认级别仍是 root 的 WARNING"——child 自动继承祖先的 level。

```python
import logging

logging.getLogger().setLevel(logging.INFO)   # root

a = logging.getLogger("a")                    # 未设 level
print(a.getEffectiveLevel())                  # 沿父链找到 root 的 INFO

b = logging.getLogger("a.b")
b.setLevel(logging.DEBUG)
print(b.getEffectiveLevel())                  # 自己设过，DEBUG

c = logging.getLogger("a.b.c")
print(c.getEffectiveLevel())                  # 沿父链找到 b 的 DEBUG
```

```
# 输出：
# 20
# 10
# 10
```

`getEffectiveLevel` 返回数值。`a` 没设过 level，向上找到 root 的 INFO（20）；`b` 设了 DEBUG（10）；`c` 沿父链找到 `b` 的 DEBUG。

### 4.2 basicConfig 给 root logger 装的到底是什么

`basicConfig` 名字叫"basic"，但它内部做的不是简单的"设几个参数"——它真正做的是：构造 handler、构造 formatter、把 formatter 挂到 handler、把 handler 挂到 root、再给 root 设 level。一句话，它在 root 上搭了一条最简处理链。

**`basicConfig(level=INFO, format=fmt, filename="app.log")` 的内部步骤大致是**：

1. 检查 `root.handlers` 是否为空，非空则直接 return（这就是"只生效一次"的来源）；
2. 根据 `filename` 是否给出，决定构造 `FileHandler(filename, mode=filemode, encoding=encoding)` 还是 `StreamHandler(stream)`；
3. 构造 `Formatter(format, datefmt, style)`；
4. `handler.setFormatter(formatter)`；
5. 若给了 `handlers` 列表，则改用这些 handler（跳过 2-4，每个 handler 自带 formatter 或后续手动设）；
6. `root.addHandler(handler)`（把 handler 挂到 root）；
7. `root.setLevel(level)`（设阈值）。

所以"basicConfig 的 level"本质是 `root.setLevel(level)`；"basicConfig 的 format"本质是挂在 handler 上的 Formatter；"basicConfig 的 filename"本质是装 FileHandler 而非 StreamHandler。理解了这个等价关系，再看"为什么 child logger 的日志能输出"就清楚——其实因为记录传播到了 root，被 root 上这个 handler 输出。

**等价的显式配置代码**：

```python
import logging

# 等价于：
# logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s", filename="app.log")

handler = logging.FileHandler("app.log", encoding="utf-8")
formatter = logging.Formatter("%(asctime)s %(levelname)s %(message)s")
handler.setFormatter(formatter)

root = logging.getLogger()
root.addHandler(handler)
root.setLevel(logging.INFO)
```

显式写法的好处：每个 step 都在你手里，可分别调整（比如给 handler 单独设 level、给 root 加多个 handler、给 child logger 加独立 handler）。第 17 篇会重点讲这种显式构造的进阶用法。

### 4.3 双层过滤：logger level 与 handler level

日志能否被输出，要过两道关卡，这是 logging 最容易让人困惑的一点。理解了双层过滤，"为什么 root 设了 DEBUG、某个 FileHandler 还是看不到 INFO"这类问题就豁然。

**第一道：logger level**

当 `logger.info(...)` 被调用，logging 先比较"这条记录的 levelno"和"该 logger 的 effective level"。`levelno < effective_level` 直接丢弃，连 LogRecord 对象都不创建（准确说创建与否取决于实现，但都不会走后续流程）。这是 logger 层的过滤。

**第二道：handler level**

通过第一关的记录会被该 logger 的所有 handler 处理；又因为传播，还会被父链上每个 logger 的 handler 处理。每个 handler 有自己的 level，`record.levelno < handler.level` 的记录被该 handler 跳过——但只是这一个 handler 不输出，不会阻止同记录走其他 handler 或上层 handler。

**综合示例**：

```python
import logging

root = logging.getLogger()
root.setLevel(logging.DEBUG)   # root 设 DEBUG，第一关全放行

console = logging.StreamHandler()
console.setLevel(logging.WARNING)   # 终端只要 WARNING 及以上
file_h = logging.FileHandler("all.log", encoding="utf-8")
file_h.setLevel(logging.DEBUG)      # 文件全部

formatter = logging.Formatter("%(levelname)s: %(message)s")
console.setFormatter(formatter)
file_h.setFormatter(formatter)

root.addHandler(console)
root.addHandler(file_h)

logger = logging.getLogger("app")

logger.info("INFO 记录")
logger.error("ERROR 记录")
```

```
# 终端输出（StreamHandler，level=WARNING）：
# ERROR: ERROR 记录
# 文件 all.log（FileHandler，level=DEBUG）：
# INFO: INFO 记录
# ERROR: ERROR 记录
```

`logger.info` 的记录：过 root 的第一关（root 设 DEBUG，INFO 20 >= 10 通过）；到 console handler 时第二关失败（INFO 20 < WARNING 30），跳过；到 file_h 时第二关通过（INFO 20 >= DEBUG 10），写入文件。所以 INFO 只在文件、不在终端。`logger.error` 两关都通过，两边都出。

这就是"终端只显示 WARNING、文件记全部"这种分发效果的实现机制——root 设最低级别让记录能通过第一关，再靠各 handler 自己的 level 做第二关细分。

**basicConfig 里设的 level 是哪一层**：`basicConfig(level=...)` 设的是 root 的 logger level，不是 handler level。handler level 这时没显式设（默认 0，表示"不过滤"，所有通过 logger level 的都接受）。所以"basicConfig 设了 WARNING 之后没有 WARNING 以下日志"的真相是：第一关 root.logger.level=WARNING 把 DEBUG/INFO 都挡掉了，根本到不了 handler。

### 4.4 为什么第二次 basicConfig 无效：root.handlers 非空就 return

`basicConfig` 源码（CPython `Lib/logging/__init__.py`）入口附近有这段判断（简化伪代码）：

```python
def basicConfig(**kwargs):
    if kwargs.get("force"):
        # force=True 时先清空 root.handlers
        for h in root.handlers[:]:
            root.removeHandler(h)
            h.close()

    if root.handlers:    # 关键判断：已有 handler 就 return
        return

    # ... 真正的配置流程（构造 handler、setFormatter、addHandler、setLevel）...
```

关键就是 `if root.handlers: return`——只要 root 已经有 handler，配置就被跳过。`basicConfig` 第一次调用后 root 已经被加上了 StreamHandler/FileHandler，所以第二次调用走不进配置流程。

**哪些情况会让 root 已经有 handler**：

1. 之前调过一次 `basicConfig`（最常见）；
2. 某段代码显式 `root.addHandler(...)` 给 root 加了 handler；
3. 在调 `basicConfig` 之前，已经调用过 `logging.warning(...)` 等模块级方法——这会触发"最后通牒 handler"（`_handlers` 之外的特殊路径），在 root 上挂一个 StreamHandler，之后 `basicConfig` 找到 root.handlers 非空，又被跳过。

第 3 点是另一个常见坑：

```python
import logging

logging.warning("我先打了一条日志")   # 触发兜底，给 root 挂了 StreamHandler
logging.basicConfig(level=logging.DEBUG, format="%(message)s")  # 被跳过
logging.debug("这行看不到")          # root.level 还是默认 WARNING
```

```
# 输出：
# WARNING:root:我先打了一条日志
```

`debug` 那行不出现，因为 `basicConfig` 被跳过、root.level 没被设成 DEBUG、还是默认 WARNING。规避方式：永远在打任何日志之前先调 `basicConfig`。

**`force=True` 的作用就是把 root.handlers 清空再继续走配置流程**，所以能强制重配。但要注意 `force` 会把已有的 handler 都 `close` 掉——如果某个 handler 是别人（比如某个库）加的、或者关联着打开的文件，强制关可能造成意外。生产代码里慎用，多用于测试。

### 4.5 一条日志的完整处理链

把前面几节串起来，看一条 `logger.info("hello")` 从调用到最终输出经过的全部环节。假设配置是 `basicConfig(level=INFO, format="%(asctime)s %(levelname)s %(message)s")`，logger = `getLogger("app")`。

1. **调用** `logger.info("hello")`。这其实是个便捷方法，内部调用 `logger.log(INFO, "hello")`，进而调用 `logger.handle(LogRecord(...))`。
   - 但在构造 LogRecord 之前，先做第一道过滤：`if INFO < logger.getEffectiveLevel(): return`。`app` 没设 level，effective level 沿父链找到 root 的 INFO（20），`INFO(20) < 20` 为假，放行。
2. **构造 LogRecord**：logging 创建一个 `LogRecord` 对象，填入 name="app"、levelno=20、levelname="INFO"、msg="hello"、创建时间、调用栈上的文件名/函数名/行号、process/thread id 等。
3. **调用 logger 自身的 handler**：`app` 没 addHandler 过，跳过。
4. **传播到父**：`app.propagate=True`（默认），记录传给 `app` 的父 logger——即 root。
5. **调用 root 的 handler**：root 有一个 StreamHandler（basicConfig 给加的）。logging 调它的 `handle(record)`。
6. **handler 第二道过滤**：`if record.levelno < handler.level: return`。handler.level 默认 0（NOTSET），`20 < 0` 为假，放行。
7. **格式化**：handler 调 `self.format(record)`，内部用其 Formatter 执行 `fmt % record.__dict__`——把 `%(asctime)s` 替换成格式化时间、`%(levelname)s` 替换成 "INFO"、`%(message)s` 替换成 "hello"，拼出最终字符串。
8. **输出**：StreamHandler 调 `self.stream.write(formatted + "\n")`，stream 是 `sys.stderr`，一行日志出现在终端。

这就是完整链路。理解了它，就能解释以下常见现象：

- **同一日志输出两遍**：通常是 child logger 自己 addHandler 了，又因 propagate 默认 True，记录被 child handler 输出一次、再传到 root 被输出一次。解决：`child.propagate = False` 或不在 child 上挂 handler；
- **某 child logger 的 DEBUG 不输出**：root 的 level 是 INFO，第一关就被 root 卡住——`app.child` 没设 level 时 effective level 沿链到 root 的 INFO；
- **改了 format 没反应**：第二次 basicConfig 被跳过，formatter 没换；
- **handler level 似乎没限制**：handler 没显式 setLevel 时是 NOTSET(0)，第二关不过滤。

### 4.6 __name__ 让 logger 自动归属模块层级的机制

`__name__` 是 Python 模块的内置属性：当模块被 `import` 时，`__name__` 是模块的点分限定名（如 `myproj.payment.checkout`）；当模块作为主程序直接运行时，`__name__` 是 `"__main__"`。

`logging` 内部维护一个全局字典，键是 logger 名、值是 logger 对象。`getLogger("myproj.payment.checkout")` 第一次调用时，会做这几件事：

1. 查字典，`"myproj.payment.checkout"` 不存在；
2. 构造一个 Logger 实例，名字就是 `"myproj.payment.checkout"`；
3. **自动设置父引用**：根据名字按 `rpartition(".")` 切分，父名 = `"myproj.payment"`；调 `getLogger("myproj.payment")`（如果它不存在会递归创建），把它的返回作为当前 logger 的 parent；
4. 把新 logger 存入字典并返回。

所以你写 `logger = logging.getLogger(__name__)` 时，logger 名按点分自动形成树——`myproj.payment.checkout` 的父是 `myproj.payment`，再上是 `myproj`，再上是 root。这种自动建树让你在各模块独立写 `getLogger(__name__)` 时，整个项目的 logger 自然按模块目录结构组织成层级，无需手动维护树。

**直接运行 vs 被导入的差异**：直接运行 `main.py` 时 `__name__ == "__main__"`，所以 `main.py` 里的 logger 名是 `"__main__"`。被 import 的模块 logger 名是其完整点分路径。这意味着同一个模块在被直接运行和被导入时，logger 名不同，可能影响 `%(name)s` 输出和按名 setLevel 的效果。多数情况影响不大，但偶尔在跨模块统一控级别时要留意。

**按前缀批量设级别**：因为层级树的存在，你可以用 `logging.getLogger("myproj").setLevel(logging.WARNING)` 一次性把所有 `myproj.*` 模块的日志级别都调到 WARNING（前提这些 child 没自己 setLevel）。这比逐个模块设方便得多，是层级树最大的工程价值之一。

```python
import logging

logging.basicConfig(level=logging.DEBUG, format="%(name)s | %(levelname)s | %(message)s")

# 给整个 myproj.* 设 WARNING，等价于默认开 INFO 但 myproj 这棵子树降到 WARNING
logging.getLogger("myproj").setLevel(logging.WARNING)

a = logging.getLogger("myproj.a")
b = logging.getLogger("myproj.b")
c = logging.getLogger("lib.c")

a.info("myproj.a INFO：被 ancestor=myproj 的 WARNING 挡掉")
a.warning("myproj.a WARNING：通过")
c.info("lib.c INFO：lib 没 setLevel，沿到 root=DEBUG，通过")
```

```
# 输出：
# myproj.a | WARNING | myproj.a WARNING：通过
# lib.c | INFO | lib.c INFO：lib 没 setLevel，沿到 root=DEBUG，通过
```

`myproj.a` 的 INFO 没出现——它的 effective level 沿父链找到 `myproj` 的 WARNING（30），`INFO(20) < 30` 被第一关挡掉。`lib.c` 的 INFO 出现——`lib` 没 setLevel，沿链到 root 的 DEBUG(10)，`INFO(20) >= 10` 放行。

这种"在前缀 logger 上一次设级别、影响整棵子树"的能力，是 logging 层级体系的核心价值，也是为什么"模块级 `getLogger(__name__)`"写法能在工程上 scale 的根本原因。

## 5. 总结

### 5.1 本文内容要点

- `logging` 模块提供带级别、时间、来源的结构化日志，替代 `print` 用于正式日志。
- 五个标准级别 DEBUG(10)/INFO(20)/WARNING(30)/ERROR(40)/CRITICAL(50)，按阈值过滤：`levelno >= logger.level` 才输出。
- `logging.getLogger(name)` 按名获取 logger，同名返回同一实例；`getLogger()` 返回 root logger；模块级 `logging.info(...)` 等价于 root.info。
- `logging.basicConfig` 是一次性配置 root logger 的便捷函数，关键参数：`level`（最低级别）、`format`（行格式，含 `%(asctime)s`/`%(levelname)s`/`%(name)s`/`%(message)s` 等占位符）、`datefmt`（时间格式）、`filename`（写文件，默认追加）、`handlers`（多输出目标）。
- `filemode="a"` 追加、`"w"` 覆盖；`encoding="utf-8"`（3.9+）保证中文不乱码。
- `force=True`（3.8+）强制重配，清空旧 handler。
- logger 的 `debug/info/warning/error/critical` 记录对应级别日志；`exc_info=True` 或 `logger.exception` 附带异常堆栈。
- 不配 `basicConfig` 时默认行为：root 级别 WARNING，且有"最后通牒 handler"兜底输出到 stderr。
- `basicConfig` 只在 root.handlers 为空时生效，已有 handler 则跳过——"第二次调没反应"的根因。
- 模块级 `logger = logging.getLogger(__name__)` 是最佳实践，`__name__` 让 logger 自动按模块结构形成层级树。
- 配置集中在程序入口的 `basicConfig` 一处调用，业务模块只取 logger、不调 basicConfig。
- 双层过滤：logger level 是第一关、handler level 是第二关，两者独立。
- logger 按"点分名"形成树，child logger 默认向父传播（`propagate=True`），root 上的 handler 能收到所有 child 的日志；`propagate=False` 关闭传播。
- effective level 沿父链查找：child 未设 level 时继承最近的已设祖先的 level，全未设则用 root 默认 WARNING。
- 用 `%(message)s` 配合 `%`-style 延迟格式化（`logger.debug("x=%s", x)`）比 f-string 省开销，被过滤的日志不发生字符串拼接。

### 5.2 读完本文你应能掌握

- 说出五个日志级别及其数值、解释"设某级别后低于该级别被过滤"的机制；
- 用 `logging.basicConfig` 配置 root logger 的 level、format、datefmt、filename/handlers，输出带时间戳和级别标签的日志到终端或文件；
- 写出模块级 `logger = logging.getLogger(__name__)` 并说明为何用 `__name__`；
- 用 `logger.debug/info/warning/error/critical` 记录日志，并在异常处用 `exc_info=True` 或 `logger.exception` 附带 traceback；
- 解释 `basicConfig` 为什么"只在首次调用生效"，知道用 `force=True` 强制重配的场景；
- 区分 logger level 与 handler level 两层过滤，会用 handler.setLevel 实现不同级别走不同输出；
- 说明 logger 层级树与传播机制，能用 propagate 和 effective level 解释"child logger 默认继承父级别""root handler 收到 child 日志""按前缀批量设级别"等现象；
- 识别 `basicConfig` 的适用边界，知道何时该升级到第 17 篇的显式 handler 配置（日志轮转、多级别分文件等）。

---

**下一篇预告**：第 17 篇讲 `logging.FileHandler` 与日志轮转（`RotatingFileHandler`/`TimedRotatingFileHandler`），覆盖按大小切文件、按日期切文件、备份保留数量、以及显式构造 handler+formatter 替代 basicConfig 的进阶写法。本篇的 `basicConfig` 是"配一遍够用"，第 17 篇是"工程化日志体系"。