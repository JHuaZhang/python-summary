---
group:
  title: 【20】网络请求与外部服务
  order: 20
order: 8
title: python-dotenv 环境变量管理
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是环境变量、为什么要把配置从代码里分出去

在写 Python 项目时，代码里总会出现一些"和环境有关的、敏感的、会变动"的配置值，例如数据库连接串里的密码、第三方服务的 API Key、加密用的 SECRET_KEY、对象存储的 AccessKey/SecretKey 等。这些东西有一个共同特点：它们**不是代码逻辑的一部分**，而是"这段代码在哪台机器、哪个环境上跑"的参数。同一个项目的代码，开发环境连测试库、生产环境连生产库，密码完全不同，但代码不该因此改一行。

如果把密码硬编码进源码，会带来一连串问题：

- **泄露风险**：代码一旦提交进 Git 仓库并推到远端（GitHub/GitLab），密码就跟着历史记录永久留存，即便后续删除也能从 commit 历史里翻出来。如果是公开仓库，更等于直接把密码贴在互联网上。
- **环境切换困难**：开发、测试、生产用不同的库和密钥，硬编码意味着每次部署都要改代码，极易出错，也说不清"这份代码到底是给哪个环境跑的"。
- **协作冲突**：团队成员各自本地连不同的库，都在改同一个 `config.py`，互相覆盖、合并冲突不断。
- **轮换成本高**：密钥泄露后要换一个，得改代码、重新提交、重新发版，而密钥本应是"换值不换码"的运维操作。

业界对此的标准解法是：**把配置和环境变量放进运行环境，而不是塞进代码库**。这就是著名的 [12-factor app](https://12factor.net/zh_cn/config) 方法论中的第三条"配置"所强调的原则——配置应存在于环境变量中，代码本身不包含任何与环境有关的硬编码值。

操作系统层面的"环境变量"正是承载这些配置的天然容器。Linux/macOS 下用 `export DB_PASSWORD=xxx` 设置的环境变量，能被该 shell 启动的任何子进程继承；Windows 下同样有环境变量机制。Python 标准库 `os.environ` / `os.getenv()` 就是用来读取这些环境变量的接口。

但直接用系统环境变量有个不便：**设置起来麻烦且不持久**。你总不能让每个开发者在每次开机后手敲十几条 `export`。于是 `.env` 文件这种约定俗成的做法出现了：把所有环境变量写进一个名为 `.env` 的文本文件里，项目启动时由代码自动读取并注入到 `os.environ`，开发者只需要维护本地这份 `.env`，团队里每个人各写各的、互不干扰，也不进版本库。

`python-dotenv` 就是 Python 生态里读取 `.env` 文件的事实标准库。它做的事一句话就能概括：**把 `.env` 文件里的 `KEY=VALUE` 解析出来，塞进 `os.environ`（或仅以 dict 形式返回），让程序里后续用 `os.getenv("KEY")` 就能读到**。它不加密、不远程下发、不做权限管控——它只是"一个把文件里配置搬到环境变量里"的搬运工，但因这个需求如此普遍，它成了几乎所有 Python Web 项目（Flask、FastAPI、Django）配置管理的起点。

### 1.2 .env 文件长什么样、python-dotenv 的最小用法

先看一个最简单的 `.env` 文件内容：

```ini
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_USER=myapp
DB_PASSWORD=s3cret-pwd-2024

# 第三方服务
API_KEY=sk-abc123def456
```

这就是 `.env` 的全部形态：一个纯文本文件，每行一个变量，`KEY=VALUE` 形式，`#` 开头是注释，等号两边不要加空格（加了也能解析，但不规范）。文件名固定为 `.env`（开头是点、没有扩展名），放在项目根目录。

安装 python-dotenv：

```bash
pip install python-dotenv
```

最小可用代码：

```python
import os
from dotenv import load_dotenv

# 把同目录下的 .env 文件内容加载进 os.environ
load_dotenv()

# 之后像读系统环境变量一样读取
db_host = os.getenv("DB_HOST")
db_password = os.getenv("DB_PASSWORD")
api_key = os.getenv("API_KEY")

print(db_host)      # 输出：localhost
print(db_password)  # 输出：s3cret-pwd-2024
print(api_key)      # 输出：sk-abc123def456
```

这就是 python-dotenv 的全部"口号"：**`load_dotenv()` 调一次，后续 `os.getenv()` 全程可用**。注意 `load_dotenv()` 返回 `True/False`（表示是否成功找到并加载了 `.env`），但绝大多数场景里你不需要关心这个返回值——找不到文件它也只是安静地什么都不注入，程序继续跑，只是 `os.getenv` 会拿到 `None`。

### 1.3 与系统环境变量的关系：不覆盖是默认行为

一个关键细节必须一开始就讲清：`load_dotenv()` 默认**不会覆盖** `os.environ` 里已经存在的同名变量。也就是说，如果操作系统层面已经设了 `DB_PASSWORD=from-system`，那么 `.env` 里写的 `DB_PASSWORD=xxx` 不会被加载进来，`os.getenv("DB_PASSWORD")` 拿到的是系统那份。

这个设计是有意为之的——它让生产环境（通常通过容器编排平台如 K8s、CI/CD 变量、云平台环境变量注入真实配置）能"盖过"项目里的 `.env`，而 `.env` 只在没有系统级配置时生效，充当开发环境默认值。换句话说：**系统环境变量优先级 > .env 文件**。

如果你确实想让 `.env` 强制覆盖系统变量（比如本地调试时想临时用 `.env` 里的值盖掉系统值），可以传 `override=True`：

```python
load_dotenv(override=True)  # .env 里的值会覆盖 os.environ 中已有的同名变量
```

这个参数是面试和实战中最容易踩的坑之一，后面会详细展开。

---

## 2. 核心内容

### 2.1 .env 文件格式详解

`.env` 文件虽然看起来简单，但 python-dotenv 对它的解析有一套完整规则，理解这些规则能避免实际项目里"明明写了但读不到/读到的不对"的怪问题。

**基本格式**

每行一个变量，`KEY=VALUE`，等号两边不加空格（加了会连同空格一起算进 value，除非 value 用引号包裹）。变量名（KEY）按惯例全大写、用下划线分隔（如 `DATABASE_URL`），但这只是约定，小写也能读取。VALUE 是字符串，python-dotenv 不会自动把 `"5432"` 转成 int——读到的是字符串 `"5432"`，需要数字得自己 `int()` 转换。

**注释**

`#` 开头的行是注释，整行忽略。行内注释需要小心：`API_KEY=sk-abc # 这是key` 这种写法，python-dotenv 会把 ` # 这是key` 视为 value 的一部分吗？答案是——如果 value 没用引号包裹，行内 `#` 后的内容（含前导空格）**会被剥离**当作注释，最终 value 是 `sk-abc`。但如果 value 用引号包了起来（`API_KEY="sk-abc # 这段保留"`），则 `#` 作为字面内容保留。为了避免歧义，推荐：**需要注释就单独起一行写，不要写在 value 后面**。

**引号的用法**

VALUE 可以用双引号或单引号包裹，作用有二：一是保留首尾空格，二是让 value 里能包含 `#`、`=`、空格等特殊字符。加了引号后，解析时会把引号去掉，只保留内部内容。

```ini
# 不加引号：首尾空格被忽略
GREETING=hello world

# 加引号：首尾空格保留
GREETING="  hello world  "

# 引号里可以含等号、# 等特殊字符
CONN_STR="host=db port=5432 # 非注释，是字面内容"
```

**多行值**

当一个 value 需要跨多行（比如一段 RSA 私钥、一段多行 JSON）时，用双引号包裹并在内部换行即可：

```ini
PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAxxxxxx...
-----END RSA PRIVATE KEY-----"
```

单引号同样支持多行。注意多行值里不要出现未转义的同类引号，否则会在该处提前闭合。

**转义**

在双引号包裹的 value 里，python-dotenv 支持 `\n`（换行）、`\t`（制表符）、`\\`（反斜杠）等转义序列；单引号包裹则不做转义，所见即所得。这是单双引号的一个重要区别：

```ini
# 双引号：\n 会被解释成换行符
LOG_LINE="line1\nline2"

# 单引号：\n 原样保留为两个字符 \ 和 n
LOG_LINE='line1\nline2'
```

**导出关键字（兼容 shell）**

为了和 shell 的 `export` 语法兼容，python-dotenv 允许在 KEY 前加 `export`，解析时会忽略它：

```ini
export DATABASE_URL=postgresql://user:pwd@localhost:5432/mydb
export API_KEY=sk-xxx
```

这在你想直接 `source .env` 把变量灌进当前 shell 调试时会很有用（不过 `source` 对带引号/多行的解析不如 python-dotenv 完整，仅对简单 `KEY=VALUE` 友好）。

**一个相对完整的 .env 示例**

下面是一个接近真实项目的 `.env`，覆盖了上述各种格式：

```ini
# ===== 数据库 =====
DB_HOST=localhost
DB_PORT=5432
DB_USER=appuser
DB_PASSWORD="P@ss w0rd!#123"
DATABASE_URL=postgresql://appuser:P@ssw0rd@localhost:5432/myapp

# ===== Web 服务 =====
HOST=0.0.0.0
PORT=8000
DEBUG=true
SECRET_KEY=django-insecure-change-me-in-production-9f8a7b

# ===== 第三方 API =====
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_yyyyyyyyyy

# ===== 多行值示例：私钥 =====
RS256_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIICeAIBADANBgkqhkiG9w0BAQEFAASCAmIwggJeAgEAAoGBALxxxxxx
-----END PRIVATE KEY-----"

# ===== export 形式（等价于不带 export）=====
export REDIS_URL=redis://localhost:6379/0
```

读取并验证：

```python
import os
from dotenv import load_dotenv

load_dotenv()

print(os.getenv("DB_PORT"))           # 输出：5432（注意是字符串）
print(os.getenv("DB_PASSWORD"))       # 输出：P@ss w0rd!#123
print(repr(os.getenv("DEBUG")))       # 输出：'true'
print(os.getenv("RS256_PRIVATE_KEY")[:30])  # 输出：-----BEGIN PRIVATE KEY-----
print(os.getenv("REDIS_URL"))         # 输出：redis://localhost:6379/0
```

注意 `DB_PORT` 读出来是字符串 `"5432"`，要当端口号用还得 `int(os.getenv("DB_PORT"))`。`DEBUG` 也是字符串 `"true"`，不是布尔值，需要自己判断 `os.getenv("DEBUG", "false").lower() == "true"`。

### 2.2 load_dotenv()：加载 .env 到 os.environ

`load_dotenv()` 是这个库最核心的函数。完整签名：

```python
load_dotenv(
    dotenv_path=None,       # .env 文件路径；不传则自动查找
    stream=None,            # 传入文件流而非路径（用于非文件来源）
    verbose=False,          # 找不到文件时是否打印警告
    override=False,         # 是否覆盖 os.environ 中已有的同名变量
    interpolate=True,       # 是否对 value 做变量插值
    encoding="utf-8",       # 读取文件用的编码
)
```

**自动查找逻辑（dotenv_path=None）**

不传 `dotenv_path` 时，python-dotenv 会从"调用 `load_dotenv()` 的那个文件所在目录"开始，逐级向上查找 `.env` 文件，直到找到或到达文件系统根为止。这个"向上查找"行为在很多项目结构里很方便——无论你的入口是 `app/main.py` 还是 `scripts/run_worker.py`，它都能定位到项目根目录的 `.env`。

但这也意味着：如果你在不同的子目录下各放了不同内容的 `.env`，谁先被发现就用谁，可能不是你以为的那一份。这种情况建议显式传 `dotenv_path` 避免歧义。

**显式指定路径**

更稳妥的做法是显式传入 `.env` 的绝对路径，尤其在多模块、多入口项目里：

```python
from pathlib import Path
from dotenv import load_dotenv
import os

# 用 Path 构造绝对路径，跨平台稳妥
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

print(os.getenv("DB_HOST"))  # 输出：localhost
```

这里 `Path(__file__).resolve().parent.parent` 表示"当前文件所在目录的上一级"。假设你的 `settings.py` 在 `app/settings.py`，`.env` 在项目根 `myproject/.env`，那么 `parent.parent` 正好指向 `myproject/`。

**stream 参数：从非文件来源加载**

有时配置不是来自磁盘上的 `.env`，而是一个字符串、一个网络响应、一段内嵌配置。这时用 `stream` 传一个类文件对象（`io.StringIO`）进去即可，`dotenv_path` 此时可有可无：

```python
import io
import os
from dotenv import load_dotenv

# 模拟从配置中心拿到的环境变量文本
env_text = """
API_ENDPOINT=https://api.example.com
API_TIMEOUT=30
API_TOKEN=token-from-remote
"""

load_dotenv(stream=io.StringIO(env_text))

print(os.getenv("API_ENDPOINT"))  # 输出：https://api.example.com
print(os.getenv("API_TIMEOUT"))   # 输出：30
```

这种用法在"开发用本地 .env、生产用配置中心下发"的混合架构里能统一代码路径——只要最终拿到一段 `KEY=VALUE` 文本，都能灌进去。

**verbose 参数**

默认 `verbose=False`，找不到 `.env` 文件时静默忽略（返回 `False`，但不打印任何东西）。设 `verbose=True` 后，找不到会打印一条警告到 stderr，便于排查"为什么我的配置没生效"。

```python
load_dotenv(verbose=True)
# 若 .env 不存在，stderr 输出类似：
# No .env file found in ... . Loading environment variables from system.
```

**override 参数（重点）**

这是实际项目里最需要理解的参数，再强调一次：

- `override=False`（默认）：`os.environ` 里已有的同名变量**不被覆盖**。生产环境通过系统环境变量注入的值会保留，`.env` 只补位。
- `override=True`：`.env` 里的值**强制覆盖** `os.environ`。

一个对比例子，假设运行前系统里已经设了 `DEBUG=false`：

```python
import os
from dotenv import load_dotenv

# 假设 .env 里写的是 DEBUG=true

load_dotenv(override=False)
print(os.getenv("DEBUG"))  # 输出：false（系统值保留，.env 被忽略）

load_dotenv(override=True)
print(os.getenv("DEBUG"))  # 输出：true（.env 强制覆盖）
```

何时该用 `override=True`？典型场景是**本地调试时想临时用 `.env` 里的值盖掉系统/容器里的值**，验证完再改回 `False`。生产部署几乎总是用默认 `False`，让运维注入的环境变量享有最高优先级。

**load_dotenv 的返回值**

返回 `bool`：找到并加载了 `.env` 返回 `True`，没找到返回 `False`。多数场景无需关心，但如果你想"找不到 .env 就报错退出"，可以这样：

```python
import sys
from dotenv import load_dotenv

if not load_dotenv():
    print("找不到 .env 文件，请先复制 .env.example 为 .env 并填写")
    sys.exit(1)
```

### 2.3 dotenv_values()：不污染 os.environ 只返回 dict

`load_dotenv()` 把变量灌进 `os.environ` 是"全局副作用"——一旦加载，整个进程任何地方 `os.getenv` 都能读到，好处是方便，坏处是"污染了全局环境"。有些场景你不希望这样：

- **测试隔离**：单测里只想在本测试函数内拿到 `.env` 的值，不想影响其他用例的 `os.environ`。
- **同时读取多份配置**：比如想在一个脚本里对比 dev 和 prod 两份 `.env` 的差异，分别读成两个 dict 比较，而不是互相覆盖着灌进 `os.environ`。
- **库代码**：你写的是一个被别人 import 的库，不该在 import 时就改动调用方的 `os.environ`。

这时用 `dotenv_values()`，它和 `load_dotenv` 解析逻辑完全一样，但**只返回 dict、不写 `os.environ`**：

```python
from dotenv import dotenv_values
import os

config = dotenv_values(".env")

print(type(config))           # 输出：<class 'dotenv.compat.Dict'>
print(config["DB_HOST"])      # 输出：localhost
print(config.get("DB_PORT"))  # 输出：5432

# os.environ 里不会有这些 key（除非系统本来就设了）
print(os.environ.get("DB_HOST"))  # 输出：None（假设系统未设）
```

`dotenv_values` 签名：

```python
dotenv_values(
    dotenv_path=None,
    stream=None,
    verbose=False,
    interpolate=True,
    encoding="utf-8",
)
```

注意它**没有 `override` 参数**——因为它压根不碰 `os.environ`，不存在覆盖问题。返回的 dict 是普通映射，你可以 `.get()`、可以遍历、可以传给别的函数。

**对比 load_dotenv 与 dotenv_values**

| 特性 | `load_dotenv()` | `dotenv_values()` |
|---|---|---|
| 是否写入 `os.environ` | 是 | 否 |
| 返回值 | `bool`（是否加载成功） | `dict`（变量名→值） |
| 后续读取方式 | `os.getenv("KEY")` | `config["KEY"]` 或 `config.get("KEY")` |
| 作用范围 | 全局进程 | 仅拿到的 dict |
| 有 `override` 参数 | 有 | 无 |
| 典型场景 | 应用启动加载配置 | 测试/库/多份配置对比 |

一个实用模式是**两者结合**：应用主入口用 `load_dotenv()` 让全局都能 `os.getenv`；而工具脚本、测试用例用 `dotenv_values()` 局部读取，避免副作用。下面这个例子同时读 dev 和 prod 两份配置做对比：

```python
from dotenv import dotenv_values

dev_cfg = dotenv_values(".env.dev")
prod_cfg = dotenv_values(".env.prod")

# 找出 prod 有而 dev 没有的 key
missing_in_dev = set(prod_cfg) - set(dev_cfg)
print("dev 缺失的配置项：", missing_in_dev)

# 找出值不同的 key
diff = {k: (dev_cfg[k], prod_cfg[k]) for k in dev_cfg if k in prod_cfg and dev_cfg[k] != prod_cfg[k]}
print("值不同的配置项：", diff)
```

### 2.4 变量插值（interpolate）

python-dotenv 支持"在 value 里引用另一个变量"，类似 shell 的 `$VAR` / `${VAR}`。默认 `interpolate=True` 开启。这个特性在"一个基础值被多个配置复用"时很有用，避免重复硬编码。

```ini
# .env
DB_USER=myapp
DB_PASSWORD=s3cret
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp_db

# 用 ${VAR} 引用上面已定义的变量拼出连接串
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}

# 也可以引用系统已有的环境变量
HOME_DIR=${HOME}
LOG_DIR=${HOME_DIR}/logs/myapp
```

读取：

```python
import os
from dotenv import load_dotenv

load_dotenv()

print(os.getenv("DATABASE_URL"))
# 输出：postgresql://myapp:s3cret@localhost:5432/myapp_db

print(os.getenv("LOG_DIR"))
# 输出：/Users/yourname/logs/myapp（HOME 来自系统环境变量）
```

插值规则要点：

- `${VAR}` 和 `$VAR` 两种写法都支持，但 `${VAR}` 更清晰、能避免和相邻字符粘连歧义，推荐统一用 `${}`。
- 被引用的变量查找顺序：先在本 `.env` 文件已解析的变量里找，找不到再去 `os.environ` 里找。
- 如果引用的变量不存在，且没有默认值，结果为**空字符串**（不会报错）。
- 支持 bash 风格的默认值语法 `${VAR:-default}`：`VAR` 未定义或为空时用 `default`。

```ini
# CACHE_HOST 未定义时，用 redis-fallback
CACHE_URL=redis://${CACHE_HOST:-redis-fallback}:6379/0
```

```python
import os
from dotenv import load_dotenv

load_dotenv()
print(os.getenv("CACHE_URL"))
# 输出：redis://redis-fallback:6379/0
```

如果你想关闭插值（比如 value 里确实需要字面的 `$` 符号），传 `interpolate=False`：

```python
load_dotenv(interpolate=False)
```

此时 `.env` 里的 `${DB_HOST}` 会被原样当作字符串 `"${DB_HOST}"` 加载，不做替换。

**插值顺序依赖**

插值是"边解析边替换"的，因此被引用的变量必须**在引用之前出现**。下面这种顺序会失效：

```ini
# 错误：DATABASE_URL 在前，此时 DB_USER 还未定义
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost
DB_USER=myapp
DB_PASSWORD=s3cret
```

`DATABASE_URL` 拿到的会是 `postgresql://:@localhost`（`DB_USER` 还没读到，按未定义处理成空）。正确做法是把"基础变量"放前面、"组合变量"放后面。

### 2.5 加载后用 os.getenv 读取：默认值与类型处理

`.env` 加载进 `os.environ` 后，读取就用标准库的 `os.getenv`，这和读系统环境变量完全一样。但有几个实战要点：

**`os.getenv` vs `os.environ`**

- `os.getenv("KEY")`：不存在时返回 `None`，不会抛异常，最常用。
- `os.getenv("KEY", "default")`：不存在时返回 `"default"`，适合给"可选配置"一个默认值。
- `os.environ["KEY"]`：不存在时抛 `KeyError`，适合"必填配置"，缺失就让它直接报错，早暴露问题。

```python
import os
from dotenv import load_dotenv

load_dotenv()

# 可选配置，有默认值
port = int(os.getenv("PORT", "8000"))
debug = os.getenv("DEBUG", "false").lower() == "true"

# 必填配置，缺失就抛 KeyError 早 실패
api_key = os.environ["API_KEY"]  # 缺了直接崩
db_url = os.environ["DATABASE_URL"]
```

**类型转换**

`os.getenv` 永远返回 `str` 或 `None`，所有类型转换要自己做。常见的几个模式：

```python
import os

# 整数
port = int(os.getenv("PORT", "8000"))

# 布尔：把各种"真值"字符串统一成 bool
def as_bool(val: str | None) -> bool:
    return str(val).strip().lower() in ("1", "true", "yes", "y", "on")

debug = as_bool(os.getenv("DEBUG", "false"))

# 列表：用逗号分隔
allowed_origins = os.getenv("ALLOWED_ORIGINS", "").split(",")
allowed_origins = [o.strip() for o in allowed_origins if o.strip()]

# 浮点
timeout = float(os.getenv("TIMEOUT", "30.0"))
```

对应的 `.env`：

```ini
PORT=8000
DEBUG=true
ALLOWED_ORIGINS=https://a.com,https://b.com,https://c.com
TIMEOUT=30.0
```

```python
print(port)              # 输出：8000
print(debug)             # 输出：True
print(allowed_origins)   # 输出：['https://a.com', 'https://b.com', 'https://c.com']
print(timeout)           # 输出：30.0
```

**集中式 settings 模块**

随着配置项变多，散落在各处 `os.getenv` 会很难维护——你不知道项目总共依赖哪些环境变量、缺了哪个在哪报错。推荐做法是**集中到一个 `settings.py` 模块**统一读取、统一类型转换、统一校验，其他代码只 import 这个模块的常量：

```python
# settings.py
import os
from pathlib import Path
from dotenv import load_dotenv

# 启动时加载一次 .env
load_dotenv(Path(__file__).resolve().parent.parent / ".env")


def _as_bool(val: str | None, default: bool = False) -> bool:
    if val is None:
        return default
    return val.strip().lower() in ("1", "true", "yes", "y", "on")


# ===== 基础 =====
ENV = os.getenv("APP_ENV", "dev")
DEBUG = _as_bool(os.getenv("DEBUG"), default=False)
SECRET_KEY = os.environ["SECRET_KEY"]  # 必填，缺失即崩

# ===== 数据库 =====
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_USER = os.getenv("DB_USER", "app")
DB_PASSWORD = os.environ["DB_PASSWORD"]
DATABASE_URL = os.environ["DATABASE_URL"]

# ===== 第三方服务 =====
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
```

使用方：

```python
# app/db.py
from settings import DATABASE_URL, DB_PORT, DEBUG
import psycopg2

conn = psycopg2.connect(DATABASE_URL)
print(f"连接已建立，端口 {DB_PORT}，调试模式={DEBUG}")
```

这样所有"读环境变量"的逻辑只存在于 `settings.py`，配置项清单一目了然，缺必填项在 import `settings` 时就立刻报错，不会拖到运行中某个时刻才崩。

### 2.6 .env.example 模板与 .gitignore：团队协作的标配

`.env` 装的是真实密钥，**绝对不能进版本库**。但团队协作时，新人怎么知道项目需要哪些环境变量？答案是用一份 `.env.example` 模板代替真实 `.env` 进版本库，里面只写"有哪些 key、值的格式是什么样的"，不写真实值。

`.env.example` 示例：

```ini
# ===== 基础 =====
APP_ENV=dev
DEBUG=true
SECRET_KEY=请生成一个随机字符串：python -c "import secrets; print(secrets.token_urlsafe(32))"

# ===== 数据库 =====
DB_HOST=localhost
DB_PORT=5432
DB_USER=app
DB_PASSWORD=填你本地的数据库密码
DATABASE_URL=postgresql://app:你的密码@localhost:5432/myapp

# ===== 第三方 =====
OPENAI_API_KEY=sk-在这里填你的 OpenAI key
STRIPE_SECRET_KEY=sk_test_填测试环境 key
REDIS_URL=redis://localhost:6379/0
```

新人 clone 仓库后的标准流程：

```bash
cp .env.example .env     # 复制模板
vim .env                 # 按提示填入本地真实值
```

`.env` 本身要写进 `.gitignore`，确保永远不会被提交：

```gitignore
# .gitignore
.env
.env.*
!.env.example
```

这三行的含义：

- `.env`：忽略主文件。
- `.env.*`：忽略 `.env.dev`、`.env.prod`、`.env.local` 等所有变体。
- `!.env.example`：例外，把 `.env.example` 重新纳入版本库（`!` 表示取反）。

**防止误提交的额外保险**

即使写了 `.gitignore`，仍可能有人手滑 `git add -f .env` 强制提交。一个进制是给 `.env` 加个"自毁"前缀注释，例如首行写：

```
# !! 此文件含真实密钥，绝不提交版本库 !!
```

更可靠的工程做法是配合 git hooks 或 pre-commit 钩子，在提交前扫描暂存区是否包含 `.env`（不含 `.example`），有则拒绝。也可以用 `git secrets` 这类工具扫描密钥模式。

**验证 .env 是否已被忽略**

提交前先确认：

```bash
git check-ignore -v .env
# 若被忽略，输出类似：
# .gitignore:2:.env    .env
```

如果 `git check-ignore .env` 没有任何输出，说明 `.env` 没被忽略规则覆盖，**危险**，赶紧补 `.gitignore`。

### 2.7 在 Web 框架中的典型用法

python-dotenv 在 Web 框架里几乎是"新项目第一步"。不同框架接入方式略有差别，但本质都是"在配置读取之前调用 `load_dotenv()`"。

**通用模式：在入口模块顶部加载**

无论什么框架，最朴素也最稳妥的写法是在"早被 import 的入口模块"顶部调一次 `load_dotenv()`，保证后续所有 `os.getenv` 都能读到：

```python
# app/__init__.py 或 manage.py 或 main.py 顶部
from dotenv import load_dotenv
load_dotenv()  # 必须在 import 应用配置之前
```

注意顺序：`load_dotenv()` 要写在 import 业务模块**之前**，因为业务模块 import 时可能立刻就读了 `os.getenv`（尤其是 `settings.py` 集中读取模式）。写反面例子：

```python
# 错误顺序：先 import 了 settings，此时 .env 还没加载
from app.settings import DATABASE_URL  # 拿到 None 或默认值，不是 .env 里的
from dotenv import load_dotenv
load_dotenv()  # 太晚了
```

正确顺序：

```python
from dotenv import load_dotenv
load_dotenv()  # 先加载
from app.settings import DATABASE_URL  # 再 import 配置，此时能读到
```

**Flask**

Flask 自身就支持从文件加载配置，可以不用 python-dotenv 直接 `app.config.from_file`、`app.config.from_pyfile`。但用 `.env` 加 python-dotenv 的组合更通用（和 12-factor 一致、和其它工具一致），而且 Flask 官方文档也推荐：在 `flask run` 前加载 `.env`。典型 `app.py`：

```python
import os
from dotenv import load_dotenv
from flask import Flask

load_dotenv()  # 顶部加载

app = Flask(__name__)

# 直接从环境变量读
app.config["SECRET_KEY"] = os.environ["SECRET_KEY"]
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ["DATABASE_URL"]
app.config["DEBUG"] = os.getenv("DEBUG", "false").lower() == "true"

@app.route("/")
def index():
    return f"DB: {app.config['SQLALCHEMY_DATABASE_URI'][:25]}..."

if __name__ == "__main__":
    app.run(host=os.getenv("HOST", "0.0.0.0"), port=int(os.getenv("PORT", "5000")))
```

Flask 还有个细节：`flask` CLI（`flask run`）本身内置了对 `.env` 和 `.flaskenv` 的支持——只要你装了 python-dotenv，CLI 启动时会自动加载项目根目录的 `.flaskenv`（放 FLASK_APP、FLASK_ENV 等 CLI 设置）和 `.env`（放应用配置）。所以用 CLI 开发时你甚至不用在代码里写 `load_dotenv()`，CLI 帮你读了。但这只在 CLI 启动时生效，用 `gunicorn app:app` 生产部署时不会自动加载，仍需在代码里显式 `load_dotenv()`。为统一行为，**所有入口都建议显式写**。

**FastAPI / Uvicorn**

FastAPI 没有内置 `.env` 自动加载，必须在代码里调 `load_dotenv()`，且要在 `Settings` 类实例化之前。一个清晰的写法是把配置用 `pydantic-settings`（见 2.8）管理，并在创建 `Settings` 前加载 `.env`：

```python
# main.py
import os
from dotenv import load_dotenv
from fastapi import FastAPI

load_dotenv()  # 顶部加载

app = FastAPI(
    title=os.getenv("APP_TITLE", "My API"),
    debug=os.getenv("DEBUG", "false").lower() == "true",
)

@app.get("/")
def root():
    return {"db": os.getenv("DB_HOST"), "env": os.getenv("APP_ENV")}
```

启动：

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

Uvicorn 本身有 `--env-file .env` 参数能加载 `.env`，但它加载的变量只用于 uvicorn 进程自身（如 `HOST`、`PORT`），**不会**自动注入到你的应用代码的 `os.environ` 里。因此应用代码仍需自己 `load_dotenv()`，别依赖 `--env-file`。

**Django**

Django 的 `settings.py` 是天然的集中配置点。把 `load_dotenv()` 放在 `settings.py` 最顶部：

```python
# myproject/settings.py
from pathlib import Path
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")  # 顶部加载

SECRET_KEY = os.environ["SECRET_KEY"]
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "").split(",")

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME", "myapp"),
        "USER": os.getenv("DB_USER", "app"),
        "PASSWORD": os.environ["DB_PASSWORD"],
        "HOST": os.getenv("DB_HOST", "localhost"),
        "PORT": os.getenv("DB_PORT", "5432"),
    }
}
```

注意 Django 4.x 之后 `manage.py` 默认会 import `dotenv` 并调用 `load_dotenv()`（如果装了的话），但行为可能随版本变，仍建议在 `settings.py` 顶部显式写一次，保证不受 `manage.py` 改动影响。

**后台任务（Celery / RQ / APScheduler）**

后台 worker 进程和 Web 进程一样需要读 `.env`，写法相同——在 worker 入口顶部 `load_dotenv()`。Celery 的典型写法是放在 `celery_app.py` 顶部：

```python
# celery_app.py
import os
from dotenv import load_dotenv
from celery import Celery

load_dotenv()  # 顶部加载，后续 broker_url 等都能读到

app = Celery("myapp")
app.conf.broker_url = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
app.conf.result_backend = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1")
```

启动 worker 时 `.env` 就被加载，worker 跑的任务函数里 `os.getenv` 也能读到。

### 2.8 与 pydantic-settings 搭配：类型安全的配置层

裸用 `os.getenv` + 手动类型转换在项目变大后会显得脆弱：没有类型校验、没有缺失项的统一报错、没有默认值的集中声明。`pydantic-settings`（Pydantic v2 的配置库，前身是 `pydantic.BaseSettings`）是当前 Python 生态里"环境变量配置"的最佳搭档，它把 `.env` 加载和类型校验/默认值/转换合为一体。

安装：

```bash
pip install pydantic-settings
```

最小例子：

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",          # 自动读 .env
        env_file_encoding="utf-8",
        extra="ignore",           # .env 里多余的 key 不报错
    )

    # 字段名即变量名，类型即校验规则
    app_env: str = "dev"
    debug: bool = False
    secret_key: str              # 无默认值 = 必填，缺失启动即报错
    db_host: str = "localhost"
    db_port: int = 5432
    db_password: str
    openai_api_key: str | None = None  # 可选


settings = Settings()  # 一次性加载+校验+转换
```

对应的 `.env`：

```ini
APP_ENV=prod
DEBUG=true
SECRET_KEY=abcdef123456
DB_HOST=db.internal
DB_PORT=5432
DB_PASSWORD=real-pwd
OPENAI_API_KEY=sk-xxx
```

使用：

```python
print(settings.app_env)        # 输出：prod
print(settings.debug)          # 输出：True（自动从 "true" 转 bool）
print(settings.db_port)        # 输出：5432（自动从 "5432" 转 int）
print(settings.openai_api_key) # 输出：sk-xxx
```

`pydantic-settings` 帮你做了几件 `os.getenv` 做不好的事：

1. **类型校验与转换**：`debug: bool` 自动把 `"true"/"1"/"yes"` 识别为 `True`；`db_port: int` 自动转 int；写错了（`DB_PORT=abc`）启动时直接抛 `ValidationError`，而不是运行到一半才 `ValueError`。
2. **必填项校验**：无默认值的字段（如 `secret_key`）在 `.env` 缺失时启动即报错，错误信息明确指出缺哪个字段。
3. **默认值集中声明**：所有默认值写在类里，一眼看清。
4. **字段名与变量名映射**：默认 `debug` 字段对应 `.env` 里的 `DEBUG`（不区分大小写），也可以通过 `alias` 自定义映射。
5. **不污染 `os.environ`**：它内部用 `dotenv_values` 读 `.env`，不写 `os.environ`，配置只活在 `settings` 对象里，更干净。

注意 `pydantic-settings` 读取时的优先级（从高到低）：

1. 初始化时显式传参：`Settings(secret_key="xxx")`
2. 真实环境变量 `os.environ`
3. `.env` 文件
4. 字段默认值

也就是说，生产环境通过系统环境变量注入的值会盖过 `.env`，这和 `load_dotenv(override=False)` 的语义一致，符合 12-factor。

**何时该用 pydantic-settings**

- 项目配置项较多（10 个以上）、需要类型校验、缺一不可的项目 → 用它。
- 只是写个小脚本、两三个配置 → 裸 `load_dotenv` + `os.getenv` 足够，不必引入 pydantic。
- 团队里有人不熟 pydantic、对启动速度极敏感（pydantic-settings 会多花几毫秒）→ 权衡后再定。

两者并不互斥：你完全可以 `load_dotenv()` 把 `.env` 灌进 `os.environ`（给那些没走 pydantic 的老代码用），同时再用 `pydantic-settings` 管理主配置。python-dotenv 是"把 .env 搬到环境变量"的搬运工，pydantic-settings 是"把环境变量变成类型安全配置对象"的封装层，分工不同。

### 2.9 与 12-factor app 规范的呼应

12-factor app 第三条"配置"明确提出：**配置应存储在环境变量中**，代码与配置严格分离。判断标准是"代码是否能开源而不影响部署"——如果代码开源会泄露任何生产凭据，说明配置混进了代码，不合格。

python-dotenv 是这个理念在 Python 开发环境里的落地工具：

- **开发环境**：用 `.env` 文件模拟"环境变量"，让本地开发体验接近生产（都是"从环境读配置"），但又不至于每次开机手敲 `export`。
- **生产环境**：不依赖 `.env` 文件，而是由部署平台（K8s Secret、Docker `-e`、云平台环境变量、CI 变量）把真实值注入到容器进程的环境变量里。代码里 `load_dotenv(override=False)` 只是"兜底"——没系统变量时读 `.env`，有系统变量时系统优先。

一个完整的"开发-生产"配置流可以这样描述：

```
开发：开发者本地维护 .env（不进 git）→ load_dotenv() 灌入 os.environ → os.getenv 读到
生产：CI/CD 或 K8s 把 Secret 注入容器环境变量 → os.environ 已有值 →
      load_dotenv(override=False) 不覆盖 → os.getenv 读到的是系统注入的生产值
```

同一个 `settings.py`、同一份代码，两个环境跑出不同配置，代码零改动——这正是 12-factor 想要的。

**几个反模式**

- 把 `.env` 提交进 git，哪怕是"内部仓库"。只要仓库被 clone 一次，密钥就失控。
- 生产环境也靠 `.env` 文件，且把它打进镜像。镜像一旦泄露，密钥跟着泄露。生产应走"平台注入环境变量"。
- 在 `.env` 里写多个环境的配置（`DEV_DB_PASSWORD=...`、`PROD_DB_PASSWORD=...`），代码里按 `ENV` 选一个。这违背 12-factor——配置又混回了代码逻辑。正确做法是每个环境各有自己的环境变量集合，代码只认一个 `DB_PASSWORD`。
- 用 `.env` 存超大段配置（几千行的 YAML）。`.env` 适合扁平 `KEY=VALUE`，大结构化配置用专门配置文件 + pydantic 解析更合适。

---

## 3. 最佳实践

### 3.1 .env 的位置与查找策略

把 `.env` 放在**项目根目录**，这是约定俗成的位置，`load_dotenv()` 不传参时也能自动找到。避免在子目录里再放 `.env`，否则"向上查找"可能找到的不是你想要的那一份，排查起来很费时。

如果项目结构特殊、入口分散，建议**显式传 `dotenv_path`** 并用 `Path(__file__)` 推算绝对路径，不依赖自动查找：

```python
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")
```

这样无论从哪个目录、用什么方式启动（`python -m`、`uvicorn`、`celery`），路径都确定。

### 3.2 load_dotenv 的调用时机与位置

- **只调一次**：在进程最早的入口模块顶部调用。重复调用没有额外好处（第二次调用变量已在 `os.environ` 里，`override=False` 时不会更新），反而混淆。
- **在所有 `os.getenv` 之前**：特别是 `settings.py` 集中读取模式下，`load_dotenv()` 必须在 `settings.py` 被 import 之前执行。最稳妥是把它写在 `settings.py` 自己的顶部——这样只要 import 了 settings，`.env` 必已加载，顺序问题自动消失。

```python
# settings.py 顶部
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

# 下面再写各配置项
DB_HOST = os.getenv("DB_HOST")
```

- **不要在库代码的 import 时副作用里调 load_dotenv**：你写的库被别人 import 时，不应该擅自改动调用方的 `os.environ`。库内部要用配置，应让调用方传参，或用 `dotenv_values()` 局部读取。

### 3.3 必填 vs 可选：用 KeyError 早暴露

对"缺了就不能跑"的配置（数据库密码、SECRET_KEY、API Key），用 `os.environ["KEY"]` 而非 `os.getenv("KEY")`。前者缺失立即抛 `KeyError`，启动即失败、错误信息明确；后者返回 `None`，程序可能带着 `None` 跑一阵子才在某个深处崩掉，排查困难。

```python
# 推荐：必填项缺失立即崩
SECRET_KEY = os.environ["SECRET_KEY"]
DB_PASSWORD = os.environ["DB_PASSWORD"]

# 可选项给默认值
PORT = int(os.getenv("PORT", "8000"))
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
```

如果用 pydantic-settings，把必填字段不写默认值即可，效果相同且错误信息更友好。

### 3.4 布尔值解析的坑

`.env` 里所有值都是字符串，`DEBUG=true` 读到的是 `"true"` 而不是 `True`。直接 `if os.getenv("DEBUG"):` 会因为非空字符串都为真而判断错误——`DEBUG=false` 也会被当成真（因为 `"false"` 是非空字符串）。

```python
# 错误：DEBUG=false 也会进调试分支
debug = os.getenv("DEBUG")
if debug:
    print("调试模式")  # 实际上 false 也会打印

# 正确：显式判断
debug = os.getenv("DEBUG", "false").lower() in ("1", "true", "yes", "y", "on")
```

统一一个 `_as_bool` 工具函数在项目里复用，或直接交给 pydantic-settings 的 `bool` 字段处理。

### 3.5 .env 不要承担过多职责

`.env` 适合扁平的 `KEY=VALUE` 配置。一旦出现以下情况，就该换成专门的配置文件 + 解析：

- 单个 value 是几百行的结构化文本（YAML/JSON/TOML）。
- 需要嵌套、列表、字典等复杂结构。
- 配置项超过几十上百个，且分组明确。

这些场景可以把"配置文件路径"作为环境变量放进 `.env`，配置本身另放一个 `config.yaml`，代码里用 `yaml.safe_load` 读：

```ini
# .env
APP_ENV=prod
CONFIG_PATH=/etc/myapp/config.yaml
```

```python
import os
import yaml
from dotenv import load_dotenv

load_dotenv()
with open(os.environ["CONFIG_PATH"]) as f:
    cfg = yaml.safe_load(f)
```

### 3.6 多环境配置：.env.dev / .env.prod 的处理

有些团队喜欢为每个环境维护一份 `.env.dev`、`.env.test`、`.env.prod`，用 `APP_ENV` 切换加载哪份。这可以，但要遵守两条：

1. **除 `.env.example` 外，所有 `.env.*` 都进 `.gitignore`**（见 2.6）。
2. **生产环境最终仍应靠平台注入环境变量**，`.env.prod` 只是"运维手填的本地缓存"，不应打进镜像、不应长期留在服务器磁盘。

按环境选择加载：

```python
import os
from pathlib import Path
from dotenv import load_dotenv

env = os.getenv("APP_ENV", "dev")  # 这里的 APP_ENV 来自系统，先于 .env 设置
env_file = Path(__file__).resolve().parent.parent / f".env.{env}"
load_dotenv(env_file)

# 之后正常读其它配置
print(os.getenv("DB_HOST"))
```

注意这里有先有鸡还是蛋：要按 `APP_ENV` 选 `.env` 文件，`APP_ENV` 本身得先用系统环境变量设定，而不是写在 `.env` 里。这是合理的——环境标识应该是"部署平台给的最外层参数"，不靠文件自指。

### 3.7 .env 文件的权限与位置安全

在服务器上即便不靠 `.env` 跑生产，也可能短期放一份用于调试。此时注意：

- **权限收紧**：`chmod 600 .env`，只有属主能读写。
- **位置**：别放在 web 根目录下（如 `/var/www/html/.env`），避免被 web 服务器当作静态文件直接返回——这曾是多起泄露事件的成因。放在项目根但 web root 之外，或放进 `/etc/myapp/` 这类系统配置目录。
- **及时清理**：调试完即删，不留长期副本。

### 3.8 配合 Docker / K8s 的正确姿势

**Docker**

开发用 docker-compose 时，可以用 `env_file` 把 `.env` 灌进容器环境变量：

```yaml
# docker-compose.yml
services:
  web:
    image: myapp:latest
    env_file:
      - .env
    ports:
      - "8000:8000"
```

此时容器内 `os.environ` 已有值，代码里 `load_dotenv(override=False)` 不会覆盖，应用正常读到。**不要把 `.env` COPY 进镜像**——镜像会被推送、分发，`.env` 就跟着泄露。开发用 `env_file` 注入、生产用编排平台注入。

如果开发时想让容器内代码也能读到一份 `.env`（比如 pydantic-settings 的 `env_file=".env"`），可以挂载卷 `-v ./ .env:/app/.env:ro`，只读挂载，不入镜像。

**Kubernetes**

K8s 用 Secret 保存敏感配置，通过 `envFrom` 一次性把整个 Secret 注入容器环境变量：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  template:
    spec:
      containers:
      - name: myapp
        image: myapp:latest
        envFrom:
        - secretRef:
            name: myapp-env   # K8s Secret 里的每个 key/value 都会变成容器环境变量
```

此时容器内 `os.environ` 已有全部配置，代码里 `load_dotenv()` 找不到 `.env`（因为镜像里没打）也无所谓——它只是"找不到就什么都不加载"，不影响生产。生产配置完全由 K8s Secret 注入，符合 12-factor。

### 3.9 单元测试里的隔离用法

测试代码里需要读 `.env` 配置但又不想污染全局 `os.environ`（影响其他用例），用 `dotenv_values()`：

```python
# tests/test_db.py
from dotenv import dotenv_values

def test_db_url_built_correctly():
    cfg = dotenv_values(".env.test")  # 只读进 dict，不动 os.environ
    assert cfg["DB_HOST"] == "localhost"
    assert cfg["DB_PORT"] == "5432"
```

如果测试必须改 `os.environ`，用 `monkeypatch`（pytest 内置）临时改、用例结束自动恢复，不要直接 `os.environ["X"] = "y"` 留下副作用：

```python
def test_debug_default(monkeypatch):
    monkeypatch.setenv("DEBUG", "true")
    from app.settings import DEBUG  # 重新 import 或调用读取函数
    assert DEBUG is True
    # 用例结束 pytest 自动恢复 os.environ
```

如果 `settings.py` 是模块级常量（import 时一次性读），测试里改 `os.environ` 不会让它重读，需要用 `importlib.reload` 或把读取逻辑包成函数再调：

```python
import importlib
import app.settings

def test_port_override(monkeypatch):
    monkeypatch.setenv("PORT", "9090")
    importlib.reload(app.settings)  # 重新执行 settings.py，重读环境变量
    assert app.settings.PORT == 9090
```

### 3.10 优先级心智模型

把"配置从哪来、谁盖谁"理清是实战关键。默认（`override=False`）优先级从高到低：

1. `os.environ` 已有的值（含系统 `export`、Docker `-e`、K8s 注入、CI 变量）。
2. `.env` 文件里的值（仅当 `os.environ` 没有同名 key 时才写入）。
3. 代码里 `os.getenv("KEY", "default")` 的默认值（前两者都没有时才用）。

`override=True` 时，第 2 项盖过第 1 项。pydantic-settings 的优先级是"显式传参 > 系统环境变量 > .env 文件 > 字段默认值"，与上面 1>2>3 一致（pydantic 的"字段默认值"对应这里的第 3 项）。

记住一句话："**生产靠系统注入，开发靠 .env，默认值兜底**"。

### 3.11 推荐写法 vs 不推荐写法

| 场景 | 不推荐 | 推荐 | 原因 |
|---|---|---|---|
| 存密码 | 写在 `config.py` 里 | 写在 `.env`，`config.py` 只 `os.getenv` | 密码不进版本库 |
| `.env` 提交 | 直接 `git add .env` | `.gitignore` 忽略 `.env`，提交 `.env.example` | 防泄露 |
| 必填配置 | `os.getenv("KEY")` 后判 None | `os.environ["KEY"]` 让它早崩 | 早暴露问题 |
| 布尔配置 | `if os.getenv("DEBUG"):` | `os.getenv("DEBUG","false").lower() in (...)` | `"false"` 非空也是真 |
| 类型转换 | 各处散写 `int(os.getenv(...))` | 集中到 `settings.py` 或用 pydantic-settings | 可维护、可校验 |
| load_dotenv 位置 | 在某个深嵌套模块里调 | 在入口/`settings.py` 顶部调一次 | 保证早于所有读取 |
| 生产配置 | 把 `.env` 打进镜像 | 平台注入环境变量 | 镜像泄露不泄密 |

---

## 4. 总结

本文围绕"如何用 .env 管理配置"讲了 python-dotenv 这个工具链库的完整用法。要点回顾：

- **为什么要用 .env**：把数据库密码、API Key、SECRET_KEY 等敏感/环境相关配置从代码分离到 `.env` 文件，不进版本库，代码与配置解耦，符合 12-factor app 的"配置存环境"原则。
- **.env 文件格式**：`KEY=VALUE` 每行一个，支持 `#` 注释、单双引号（保留空格/特殊字符）、多行值、转义（双引号内 `\n` 等）、`export` 前缀、变量插值 `${VAR}` 与 `${VAR:-default}`。
- **load_dotenv()**：把 `.env` 加载进 `os.environ`，签名含 `dotenv_path`/`stream`/`verbose`/`override`/`interpolate`/`encoding`。默认从调用文件所在目录向上查找 `.env`，默认 `override=False` 不覆盖系统环境变量，返回 `bool` 表示是否找到。
- **dotenv_values()**：只返回 dict 不写 `os.environ`，适合测试、库代码、多份配置对比，没有 `override` 参数。
- **加载后读取**：用 `os.getenv`（不存在返回 None 或默认值）或 `os.environ[KEY]`（缺失抛 KeyError，适合必填项）；所有值都是字符串，需自行 `int`/`bool`/列表转换，布尔判断要显式。
- **.env.example 模板 + .gitignore**：`.env.example` 提交进版本库作模板，`.env` 及 `.env.*` 进 `.gitignore`，用 `!.env.example` 取反保留模板，`git check-ignore` 验证忽略生效。
- **优先级心智模型**：默认系统环境变量 > .env 文件 > 代码默认值；生产靠平台注入、开发靠 .env、默认值兜底。
- **框架接入**：Flask/FastAPI/Django/Celery 都是在入口或 `settings.py` 顶部 `load_dotenv()`，且必须在任何 `os.getenv` 之前；Flask CLI 和 uvicorn `--env-file` 不能替代应用代码显式加载。
- **与 pydantic-settings 搭配**：用类型注解+`env_file=".env"` 自动加载并校验，类型转换、必填校验、默认值集中声明一步到位，优先级与 `override=False` 一致。
- **Docker/K8s**：开发用 `env_file` 挂载、生产用 K8s Secret `envFrom` 注入，不要把 `.env` 打进镜像。
- **测试隔离**：`dotenv_values()` 或 pytest `monkeypatch.setenv` + `importlib.reload`，避免污染全局 `os.environ`。

读完本文你应能掌握：

- 能说明 `.env` 文件格式规则（引号、注释、多行、插值、转义）并正确书写一份 `.env`。
- 能区分 `load_dotenv()` 与 `dotenv_values()` 的作用域差异，并按场景选用。
- 能说明 `override` 参数对优先级的影响，说明"系统环境变量 > .env > 默认值"的默认优先级模型。
- 能在 Flask/FastAPI/Django 项目里正确接入 `load_dotenv()`，把加载放在所有配置读取之前。
- 能搭出 `.env.example` + `.gitignore` 的团队协作流程，并用 `git check-ignore` 验证 `.env` 已被忽略。
- 能用 `os.environ[KEY]` 处理必填项、`os.getenv(KEY, default)` 处理可选项，正确做布尔/整数/列表的类型转换。
- 能配合 pydantic-settings 写出类型安全、缺项即报错的 `Settings` 类，并说明它相较于裸 `os.getenv` 的优势。
- 能在 Docker/K8s 部署里选对配置注入方式（`env_file` / Secret `envFrom`），避免把 `.env` 打进镜像这类反模式。