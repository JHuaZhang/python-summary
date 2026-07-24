---
group:
  title: 【15】模块与包管理
  order: 15
order: 7
title: requirements.txt 生成依赖
nav:
  title: Python
  order: 1
---

## 1. 介绍

### 1.1 什么是 requirements.txt

`requirements.txt` 是 Python 生态里最经典的一份**依赖清单文件**：它用纯文本列出项目运行所需要的第三方包及其版本，`pip` 通过专门的命令读取这份清单，一次性把列出的包全部装好。一个项目只要带上一个 `requirements.txt`，别人拿到代码后执行一条 `pip install -r requirements.txt`，就能把运行环境复刻出来，而不必逐个问"你用了哪些库""哪个版本"。

在没有 `requirements.txt` 之前，分发一个 Python 项目常常是这样的对话：

> "你这项目跑不起来啊，缺 requests。"
> "装一下就行。"
> "装了，又报缺 flask。"
> "也装一下。"
> "装完还报错，flask 版本不对……你用的哪个版本？"
> "我忘了。"

`requirements.txt` 就是为了终结这种对话而存在的。它把"依赖什么"和"依赖哪个版本"白纸黑字写进项目代码仓库，任何人、任何机器、任何时间都能还原出一模一样的运行环境。这是 Python 项目可复现性的最基础保障。

一个最小的 `requirements.txt` 长这样：

```text
requests==2.31.0
flask>=2.3.0
```

两行，每行一个包名加可选的版本约束。这就是它的全部"语法"——简单到可以在任何文本编辑器里手写，也可以由工具自动生成。`pip` 逐行读取，按约束去 PyPI（Python 官方包仓库）下载安装。

`requirements.txt` 不是 Python 语法的一部分，也不是某个标准库模块，它是 **pip 约定俗成的文件名**（`-r` 就是 "requirements"）。你完全可以叫别的名字（`deps.txt`），只要 `pip install -r` 指向它就行；但叫 `requirements.txt` 是社区默认约定，几乎所有 CI、部署脚本、教程都认这个名字，擅自改名只会给自己添麻烦。

### 1.2 基本语法与最小用法

`requirements.txt` 的基本格式是**每行一个依赖声明**。最简单的一条，就是纯包名：

```text
requests
```

这表示"装 requests，版本随意，装最新的就行"。`pip install -r` 读到这行会去 PyPI 拿当前最新版本装上。

但生产环境几乎不会这么写——"最新版"意味着不可控。更常见的是给版本加约束：

```text
requests==2.31.0
```

`==` 表示"精确锁定这一版本"，pip 会装且只装 `2.31.0`，不多不少。这是最严格的写法。

下面是一个贴近真实的小项目 `requirements.txt`，混用了几种写法：

```text
# Web 框架，锁定大版本，允许补丁更新
flask>=2.3.0,<3.0.0

# HTTP 客户端，精确锁定
requests==2.31.0

# 数据库驱动，用兼容版本约束
psycopg[binary]~=3.1.0

# 环境变量读取库，只要不低于 1.0
python-dotenv>=1.0.0

# 纯包名，装最新版（不推荐用于生产）
gunicorn
```

保存为 `requirements.txt` 后，在项目根目录执行：

```bash
pip install -r requirements.txt
```

```text
# 输出示意：
Collecting flask>=2.3.0,<3.0.0 (from -r requirements.txt (line 2))
  Downloading flask-2.3.3-py3-none-any.whl (96 kB)
Collecting requests==2.31.0 (from -r requirements.txt (line 5))
  Downloading requests-2.31.0-py3-none-any.whl (62 kB)
Collecting psycopg[binary]~=3.1.0 (from -r requirements.txt (line 8))
  Downloading psycopg-3.1.12-py3-none-any.whl (2.0 MB)
...
Installing collected packages: flask, requests, psycopg, python-dotenv, gunicorn
Successfully installed flask-2.3.3 requests-2.31.0 psycopg-3.1.12 python-dotenv-1.0.0 gunicorn-21.2.0
```

`pip` 会逐行解析约束，结合每个包自己的依赖关系，算出一个都能满足的版本组合，然后下载安装。最后一行 `Successfully installed ...` 后面会列出实际装上的每个包及版本——这就是 `pip install -r` 的最终结果。

**适用场景**

`requirements.txt` 适用于几乎所有需要把依赖固定下来的场景：本地开发环境搭建、团队新成员入职、服务器部署、CI 流水线还原测试环境。只要这个项目的依赖是"固定一批第三方包"，它就够用。

**常见误区**

有人把 `requirements.txt` 当成"项目用到的所有库的清单"，于是手动一行行往上加自己 `import` 过的包——既容易漏（漏了装不上），又容易多（删了代码但没删依赖）。正确做法是让工具替你生成（见下文 `pip freeze`），手写 `requirements.txt` 只适合"我明确知道要哪些包、想精挑细选版本"的场景。

### 1.3 一份完整的真实项目清单长什么样

为了对 `requirements.txt` 有个整体印象，下面贴一份中小型 Web 项目的真实清单（有省略）：

```text
# requirements.txt
# ===== Web 框架 =====
flask==2.3.3
gunicorn==21.2.0

# ===== 数据库 =====
SQLAlchemy==2.0.23
psycopg[binary]==3.1.13
redis==5.0.1

# ===== HTTP 客户端 =====
requests==2.31.0
httpx==0.25.2

# ===== 工具库 =====
python-dotenv==1.0.0
python-dateutil==2.8.2
PyJWT==2.8.0

# ===== 数据校验 =====
pydantic==2.5.2
email-validator==2.1.0
```

注意几件事：第一，文件里可以有**注释**（以 `#` 开头的行被忽略），还可以有空行，合理分块注释能极大提升可读性；第二，每行都用了 `==` 精确锁版本，这是部署到生产时最稳妥的写法；第三，像 `psycopg[binary]` 这种带方括号的写法，是安装带有 `[binary]` 这个**extras**（可选附加组件）的 `psycopg`，`pip` 会连同 `binary` 这个附加项一起装（这里是为了免去本地编译 C 扩展的麻烦）。

这份清单由 `pip install -r requirements.txt` 一次性装完，任何人拿到代码 + 这份文件就能把环境搭起来。后续章节会逐项展开"每一行为什么这么写"。

## 2. 核心内容

### 2.1 版本约束符号全解

`requirements.txt` 最核心的知识就是**版本约束符号**。同样是写一行包名，用不同的符号约束，`pip` 的行为完全不同。下面逐个讲清。

**`==`  精确等于（兼容版本锁定）**

```text
requests==2.31.0
```

`==` 是最常用的锁定符号。它要求 pip 安装**精确的 2.31.0**，不装别的。`pip freeze` 导出的清单默认就是这种写法。

有一个细节容易踩坑：`==` 在 pip 里其实有"兼容性发布"的宽松匹配——`requests==2.31` 会匹配 `2.31.0`、`2.31.1`、`2.31.2`……因为 pip 把 `2.31` 当作 `2.31.*` 的前缀缩写。但绝大多数场景你会写全三段版本号 `2.31.0`，避免这种隐式宽松。

**`>=`  大于等于（下限约束）**

```text
flask>=2.3.0
```

表示"装 2.3.0 或更高版本，但不能低于 2.3.0"。pip 会拉取能满足条件的最新版（比如 `2.3.3`）。这种写法的意图是："我需要 2.3.0 引入的某个特性，但更高版本的补丁更新我也能接受。"

**`<=`  小于等于（上限约束）**

```text
six<=1.16.0
```

表示"装 1.16.0 或更低版本"。单独用 `<=` 不常见，更多是和 `>=` 搭配组成区间。

**`>` 与 `<`  严格大于 / 严格小于**

```text
django>4.2.0
django<5.0
```

表示版本**严格**大于 4.2.0（不含 4.2.0）、严格小于 5.0（不含 5.0）。通常只在"我知道某个版本有 bug，必须排除"时使用。

**`~=`  兼容版本（ piscin 兼容锁定）**

```text
psycopg[binary]~=3.1.0
```

这是最容易误解的符号。`~=` 叫"compatible release"，规则是：**锁住除最后一位外的版本前缀，最后一位允许向后更新**。

- `~=3.1.0` 等价于 `>=3.1.0, <3.2.0` —— 允许 3.1.x 的任何补丁版，但不跨到 3.2。
- `~=3.1` 等价于 `>=3.1, <4.0` —— 锁住 3.x 系列（注意只有两段版本号时，锁的是前一段）。

`~=` 借鉴自语义化版本（SemVer）思想："补丁更新应该兼容，小版本更新可能不兼容"。但 Python 生态并非所有包都严格遵循 SemVer，所以 `~=` 在实际项目里用得不如 `==` 多。

**`!=`  排除某个版本**

```text
setuptools!=68.0.0
```

表示"装什么版本都行，但别装 68.0.0"。通常在某个版本有已知 bug、已被撤回时使用。

**逗号组合：多条件 AND**

```text
flask>=2.3.0,<3.0.0
```

多个约束用逗号隔开，表示**同时满足**（AND 关系）。上面这行表示"版本 >=2.3.0 并且 <3.0.0"，也就是锁定 2.x 系列，允许补丁更新但拒绝 3.0。这是生产环境里很常见的"锁大版本"写法。

**不带任何符号：纯包名**

```text
gunicorn
```

表示"随便装个最新版"。pip 每次安装会拉当前最新，今天装的版本和下个月装的版本可能完全不同。开发时图方便可以这么写，**生产部署绝不能留这种"漂浮"依赖**——它会让"同一份代码，今天能跑明天不能跑"。

**对照速查表**

| 符号 | 含义 | 示例 | 实际匹配范围 |
|------|------|------|--------------|
| `==` | 精确等于 | `requests==2.31.0` | 只装 2.31.0 |
| `>=` | 大于等于（下限） | `flask>=2.3.0` | 2.3.0 及以上 |
| `<=` | 小于等于（上限） | `six<=1.16.0` | 1.16.0 及以下 |
| `>` | 严格大于 | `django>4.2.0` | 高于 4.2.0，不含 4.2.0 |
| `<` | 严格小于 | `django<5.0` | 低于 5.0，不含 5.0 |
| `~=` | 兼容版本 | `psycopg~=3.1.0` | 3.1.x，<3.2.0 |
| `!=` | 排除某版本 | `setuptools!=68.0.0` | 任意版本但不装 68.0.0 |
| 无符号 | 最新版 | `gunicorn` | 拉取当前最新 |

**必须理解的点：版本约束是"给 pip 的约束"，不是"给磁盘上文件的约束"。** 你写 `requests==2.31.0`，pip 在安装时会校验"装上的是不是 2.31.0"，但 `requirements.txt` 本身不会阻止你手动 `pip install requests==2.20.0` 把环境改成别的版本——它只在 `pip install -r` 这一刻生效。后续如果手改了环境，`requirements.txt` 不会自动跟着变。要让文件和环境始终一致，得靠 `pip freeze` 重新导出（见下文）。

### 2.2 pip freeze：导出当前环境的全部依赖

光会手写 `requirements.txt` 还不够。真实项目里更常见的场景是：我在自己的虚拟环境里把项目调通了，现在要把"当前环境到底装了哪些包、哪些版本"导成一份清单，让别人原样复刻。`pip freeze` 就是干这个的。

**基本用法**

```bash
pip freeze
```

```text
# 输出示意：
certifi==2023.11.17
charset-normalizer==3.3.2
flask==2.3.3
idna==3.6
itsdangerous==2.1.2
jinja2==3.1.2
markupsafe==2.1.3
requests==2.31.0
urllib3==2.1.0
werkzeug==2.3.8
```

`pip freeze` 不带参数时，会把**当前 Python 环境里所有已安装的包**连同精确版本号打印出来，格式正是 `包名==版本`，每行一个，正好可以直接当 `requirements.txt` 用。

注意看上面的输出：我只 `pip install` 过 `flask` 和 `requests` 两个包，但 `pip freeze` 列出了 10 个包。多出来的 `certifi`、`charset-normalizer`、`idna`、`urllib3` 是 `requests` 的**间接依赖**（requests 依赖它们），`itsdangerous`、`jinja2`、`markupsafe`、`werkzeug` 是 `flask` 的间接依赖。`pip freeze` 把直接依赖和间接依赖一视同仁全部列出——这里既有好处也有坑，后面会专门讲。

**导出到文件**

`pip freeze` 默认输出到屏幕，配合 shell 重定向就能写进文件：

```bash
pip freeze > requirements.txt
```

```text
# 结果：当前目录下生成 requirements.txt，内容就是上面那 10 行
```

这是从零生成 `requirements.txt` 最快的路径：在干净的虚拟环境里把项目跑通，然后一条 `pip freeze > requirements.txt`，依赖清单就有了。

**生成到指定路径**

```bash
pip freeze > requirements.txt
pip freeze > /tmp/dev-deps.txt
```

> 指向任何路径都行，`>` 是 shell 的重定向，与 pip 无关。常见的还有 `pip freeze > deploy/requirements.txt`，把清单放到部署目录里统一管理。

**只导出某个包的依赖链**

有时你只想知道"装 requests 这个包，会带哪些依赖进来"，不想把整个环境都导出去。`pip freeze` 没有直接的参数，但可以借助 `pip show`：

```bash
pip show requests
```

```text
# 输出：
Name: requests
Version: 2.31.0
...
Requires: certifi, charset-normalizer, idna, urllib3
Required-by: 
```

`Requires` 字段告诉你 requests 直接依赖哪几个包，但它只列直接依赖，不递归。要快速看完整依赖树，`pipdeptree` 这个第三方工具更好用（见 2.6 节）。

**freeze 与手写的差别**

理解一个关键点：`pip freeze` 导出的是"**当前环境已经装上的所有包**"，不是"项目代码 import 过的包"。这两个集合并不相等：

- 环境里可能装了 `pip`、`setuptools`、`wheel` 这类 pip 自带的包，但你项目根本没用到；
- 环境里可能装了别的项目用到的包（如果你没为每个项目开独立虚拟环境）；
- 你项目代码 `import` 过的某个包，可能因为版本约束没装上反而是用环境里已有的别的版本在跑。

所以"`pip freeze > requirements.txt`"最适合的用法是：**在一个专门给这个项目准备的干净虚拟环境里执行**，这样导出的清单才纯粹。在一个长期使用、装了几十个乱七八糟包的全局环境里直接 freeze，会把大量项目根本用不上的包也列进去，清单变得肥大且失真。

### 2.3 pip install -r：按清单安装

`pip install -r requirements.txt` 是 `requirements.txt` 的另一半——和 `pip freeze` 配对使用。前者写清单（导出），后者读清单（安装）。`-r` 是 `--requirement` 的缩写，意思是"从文件读取依赖要求"。

**基本用法**

```bash
pip install -r requirements.txt
```

```text
# 输出示意：
Collecting flask==2.3.3 (from -r requirements.txt (line 1))
  Downloading flask-2.3.3-py3-none-any.whl (96 kB)
Collecting requests==2.31.0 (from -r requirements.txt (line 2))
  Downloading requests-2.31.0-py3-none-any.whl (62 kB)
...
Installing collected packages: flask, requests, ...
Successfully installed flask-2.3.3 requests-2.31.0 ...
```

`pip` 会打开 `requirements.txt`，逐行解析包名 + 版本约束，去 PyPI 查每个包满足约束的版本，连同每个包自己的依赖一起下载安装。如果某个包当前环境已经装了且满足约束，pip 默认会跳过；如果已装版本不满足（比如约束 `==2.31.0` 但本地是 2.20.0），pip 会把它**升级或降级**到满足约束的版本。

**指定文件路径**

文件不必非叫 `requirements.txt`，只要 `-r` 指向它就行：

```bash
pip install -r deploy/prod-deps.txt
pip install -r requirements-dev.txt
```

社区约定俗成叫 `requirements.txt` 是为了 CI、部署脚本能自动找到，但本地开发完全可以分多个文件（见 2.5 节）。

**`-r` 嵌套引用**

`requirements.txt` 里可以用 `-r` 引用另一个文件：

```text
# requirements-dev.txt
-r requirements.txt                # 先把运行时依赖全装上
pytest==7.4.3
black==23.12.1
mypy==1.7.1
```

`pip install -r requirements-dev.txt` 会先去读 `requirements.txt` 把运行时依赖装好，再装 `pytest`、`black` 等开发工具。这个语法在管理"基础依赖 + 额外依赖"时非常好用，能避免在两个文件间重复维护同一批包。

**`-c` 约束文件（constraints）**

和 `-r` 很像但语义不同的还有一个 `-c`（`--constraint`）：

```bash
pip install -c constraints.txt flask
```

`-r` 的语义是"**安装**这些包"，`-c` 的语义是"**如果**要装这些包，限制它们的版本；不装也无所谓"。`constraints.txt` 用法和 `requirements.txt` 一模一样（也是 `包名==版本` 的格式），但它的角色是"版本约束清单"而非"待安装清单"。

典型场景：你的依赖树里 `包A` 和 `包B` 都间接依赖 `six`，你想确保它们装的是同一个版本的 `six`，就可以写 `constraints.txt` 里放 `six==1.16.0`，`pip install -r requirements.txt -c constraints.txt`。pip 会保证所有用到 six 的地方都装 1.16.0，避免装出两个不同版本的 six 冲突。

**dry-run 预演：`--dry-run`**

只想看"会装什么"而不真装：

```bash
pip install -r requirements.txt --dry-run
```

```text
# 输出示意：
Would install flask-2.3.3
Would install requests-2.31.0
Would install jinja2-3.1.2
...
```

部署前先 `--dry-run` 看一眼要装哪些版本，能避免装到一半才发现某版本拉不下来、CI 卡死。

### 2.4 版本锁定：为什么要锁、怎么锁

`requirements.txt` 之所以值得专门写一章，核心价值就一句话：**锁定版本，让环境可复现**。这一节专门讲清"为什么要锁"。

**问题现场：不锁版本会发生什么**

假设你的 `requirements.txt` 写成：

```text
flask
requests
```

月初你在自己机器上调通项目：

```bash
pip install -r requirements.txt
# 结果：装上 flask-2.3.3、requests-2.31.0
```

月中你把项目 push 到 Git，CI 流水线跑 `pip install -r requirements.txt`，结果 CI 上拉到的是刚发布没几天的 `flask-2.4.0`。问题来了：`flask-2.4.0` 删掉了你代码里用到的某个函数，于是 CI 报错：

```text
ImportError: cannot import name 'locked_cached_property' from 'flask'
```

你本地还能跑，CI 跑不了——同一个 `requirements.txt`，两个环境装出了不同版本，行为不一致。这就是"漂浮依赖"（floating dependency）的典型症状。排查时你盯着代码看了半天，根本想不到是 Flask 版本变了导致的。

**锁定版本解决问题**

把清单改成：

```text
flask==2.3.3
requests==2.31.0
```

无论何时何地 `pip install -r requirements.txt`，装上的永远是 `2.3.3` 和 `2.31.0`，没有歧义。这就是版本锁定的价值——**让"环境"作为代码的一部分被冻结**。

锁定版本带来的好处至少有三条：

1. **可复现**。今天、下周、半年后，同一份 `requirements.txt` 装出来的环境完全一致。bug 复现、修复验证、回归测试都建立在"环境不变"的前提上。
2. **避免兼容性破坏**。第三方包的更新并不总是向后兼容。一个看似无害的小版本更新（`2.3.3 → 2.4.0`）可能悄悄改了 API、删了函数、调了默认行为。锁版本等于把这些不确定性挡在门外。
3. **提高供应链可审计性**。出问题时（比如某个版本被植入恶意代码——这并非假设，PyPI 历史上发生过多次"恶意包事件"），你能立刻判断"我的环境里有没有这个版本"，而不需要去翻 pip log。

**何时该锁、锁到多细**

不是所有场景都要锁得死死的。

- **生产部署**：锁到补丁版本（`==2.31.0`）。这是默认推荐，最严格、最安全。
- **库 / SDK 开发**：如果你写的是一个要被别人 `pip install` 的包，你反而**不能锁太死**——否则使用者的环境里可能装了别的版本的依赖，你的硬锁会冲突。库的依赖约束一般写到 `>=下限,<上限` 形式（见 2.1 节），留出兼容空间。也就是说，**`requirements.txt` 主要是给"应用"用的，库更多在 `pyproject.toml` 里写依赖范围**（见 2.7 节）。
- **快速原型 / 试验阶段**：可以不锁，先跑通，跑通后再 `pip freeze` 锁一次。

**锁定的代价**

锁版本不是没有代价：它意味着你主动放弃了"自动获得新版本修复"的好处。一个被锁在 `cryptography==3.4.8` 的项目，不会自动拿到 `3.4.10` 里修复的安全漏洞——你得定期手动升级。这引出后面"最佳实践"里要讲的"定期升级 + 重新锁定"的流程。

### 2.5 文件变体：requirements-dev.txt、constraints.txt

`requirements.txt` 只是一份清单，但真实项目往往不止一份。"运行时依赖"、"开发依赖"、"测试依赖"、"部署约束"常常需要分开管理。社区形成了几套约定俗成的变体方案。

**变体一：requirements-dev.txt（开发依赖）**

最常见的变种。把"开发时需要、生产部署时不需要"的工具单独放一个文件：

```text
# requirements-dev.txt
-r requirements.txt                # 继承运行时依赖
pytest==7.4.3
pytest-cov==4.1.0
black==23.12.1
mypy==1.7.1
flake8==7.0.0
ipython==8.18.1
```

开发者本地 `pip install -r requirements-dev.txt` 一次搞定全部依赖；服务器部署时只 `pip install -r requirements.txt`，不装 pytest、black 这些运维根本用不上的东西。这是"分层依赖"的最朴素做法，靠两份文件 + `-r` 互相引用实现。

**变体二：分环境文件**

再细分，可以按环境拆多个：

```text
requirements.txt            # 生产运行时（最小集）
requirements-dev.txt        # 本地开发（含测试工具、lint、formatter）
requirements-test.txt       # CI 测试（只含测试相关）
requirements-cpu.txt        # CPU 版机器学习依赖
requirements-gpu.txt        # GPU 版机器学习依赖
```

机器学习项目尤为常见：CPU 环境和 GPU 环境的 `torch`、`tensorflow` 包是不同的发行版，不能写进同一份 `requirements.txt`，必须拆开。

**变体三：constraints.txt（约束文件）**

`constraints.txt` 用法和 `requirements.txt` 一模一样，但语义是"约束"而非"待装"：

```text
# constraints.txt
# 统一限定一个会到处被间接依赖的包的版本，避免冲突
six==1.16.0
setuptools>=68.0.0,<70.0.0
urllib3==2.1.0
```

```bash
# 部署时同时指定 -r 和 -c
pip install -r requirements.txt -c constraints.txt
```

`-c` 的意义在于：当你的依赖树里多个包都间接依赖同一个底层包（比如 `six`、`urllib3`），你想强制它们用同一版本，但又不想把这些底层包写进 `requirements.txt` 主体（因为它们不是你"直接想装"的）。`constraints.txt` 把"约束"从"要装什么"里剥离出来，清单更清晰。

**变体四：extras 表达开发依赖**

有些项目不在文件层面拆，而是用包的 extras 机制。比如设一个虚拟的"项目自身"包：

```text
# requirements.txt
-e .[dev,test]
```

这条命令的意思是"以可编辑模式安装当前目录（`.`）的项目，并带上 `[dev,test]` 这两个 extras"——而 `dev`、`test` 里装哪些包，写在项目的 `pyproject.toml` 的 `[project.optional-dependencies]` 段里（见 2.7 节）。这种写法把"开发依赖"和"运行时依赖"的区分收口到 `pyproject.toml` 一处，是现代项目的趋势。

**给变体起名的注意事项**

`requirements-XXX.txt` 是约定俗成的命名模式（连字符 + 后缀），`requirements_dev.txt`（下划线）虽然也能用但不符合主流惯例。CI 脚本、部署文档、新成员的肌肉记忆都认连字符版本，统一风格能省下解释成本。

### 2.6 pip-tools：生成精确锁定清单

原生的 `pip freeze` 有个明显短板：它把"直接依赖"和"间接依赖"混在一起平铺出来。回顾 2.2 节那张清单——你会看到 `certifi`、`idna` 这些你根本没主动装过的包混在 `requests`、`flask` 之间。结果是：清单读起来费劲（"这包我装过吗？"）、想升级某个直接依赖时不知该改哪行、留下的间接依赖版本是当时 pip 解析的快照而非自己有意识的选择。

`pip-tools` 这个第三方工具就是为解决这个问题而生的，核心是 `pip-compile` 命令。它的工作模式是：

1. 你手写一份**只列直接依赖**的"高层"清单（通常叫 `requirements.in`），可以不锁版本或只写下限；
2. `pip-compile` 解析这批直接依赖及其全部间接依赖，算出满足所有约束的精确版本组合，生成一份**完整且锁死版本**的 `requirements.txt`。

**安装 pip-tools**

```bash
pip install pip-tools
```

**写一份 requirements.in**

```text
# requirements.in
flask>=2.3.0
requests>=2.31.0
psycopg[binary]~=3.1.0
python-dotenv
```

只列顶层依赖，可以给宽松约束（也可以完全不给，让 pip-compile 自己挑最新版）。

**运行 pip-compile**

```bash
pip-compile requirements.in
```

```text
# 输出示意：
#
# This file is autogenerated by pip-compile with Python 3.11
# by the following command:
#
#    pip-compile requirements.in
#
certifi==2023.11.17
    # via requests
charset-normalizer==3.3.2
    # via requests
click==8.1.7
    # via flask
flask==2.3.3
    # via -r requirements.in
idna==3.6
    # via requests
itsdangerous==2.1.2
    # via flask
jinja2==3.1.2
    # via flask
markupsafe==2.1.3
    # via jinja2
psycopg[binary]==3.1.13
    # via -r requirements.in
python-dotenv==1.0.0
    # via -r requirements.in
requests==2.31.0
    # via -r requirements.in
urllib3==2.1.0
    # via requests
werkzeug==2.3.8
    # via flask
```

`pip-compile` 生成的 `requirements.txt` 有两个关键特点：

1. **每个间接依赖都带注释标明"它是被谁带进来的"**（`# via requests`、`# via flask`）。这是 `pip freeze` 给不了的可读性——你一眼能看出某个包是真正的顶层依赖还是某个包的间接依赖。
2. **所有版本都被精确锁定**，并且锁定结果是 pip-compile 在那一刻能找到的、所有约束都能同时满足的最新组合。

**升级时非常方便**

要升级某些包，`pip-compile` 提供 `--upgrade` 选项：

```bash
pip-compile requirements.in --upgrade
```

它会重新去 PyPI 查最新版本，重新算一遍满足约束的组合，覆盖更新 `requirements.txt`。

如果你只想升级某个包而保留其它不升：

```bash
pip-compile requirements.in --upgrade-package requests
```

`pip-tools` 配套的还有一个 `pip-sync` 命令，把当前环境**精确同步**到 `requirements.txt` 描述的状态——会卸载清单里没有的包、安装清单里有的包，使环境和清单完全一致。但 `pip-sync` 会卸载当前环境下没在清单里的包，用起来要小心，初次使用建议加 `--dry-run` 预演。

**为什么推荐 pip-tools**

中大型项目从 `pip freeze` 迁移到 `pip-compile` 的收益明显：清单结构清晰（直接/间接依赖一目了然）、升级流程标准化（改 `requirements.in` 再 compile）、间接依赖来源可追溯（via 注释）。对从零搭建项目，把 `requirements.in` + `pip-compile` 作为日常流程已经成了不少团队的标配。

### 2.7 requirements.txt 与 pyproject.toml 的分工

近几年 Python 打包生态明显向 `pyproject.toml` 倾斜，PEP 517、PEP 518、PEP 621 把"项目元数据、构建系统、依赖声明"统统收口到这一个文件里。这很容易让初学者产生疑问：`requirements.txt` 是不是要被淘汰了？我该用哪个？这一节简短讲清两者的分工，详细展开留给 08 篇。

**两份文件的本质角色不同**

| 维度 | requirements.txt | pyproject.toml |
|------|------------------|-----------------|
| 角色 | 安装清单（pip 直接消费） | 项目元数据（构建/打包系统消费） |
| 目的 | 让 `pip install -r` 复刻环境 | 声明项目元信息 + 给打包工具读 |
| 依赖描述粒度 | 通常是最终解析结果（含间接依赖） | 通常只列直接依赖 + 版本范围 |
| 是否被 pip 当包 | 否，纯文本清单 | 是（`pip install .` 会按它来打包） |
| 主要消费者 | 部署脚本、CI、开发者复刻环境 | 构建工具（pip、build、Poetry、uv 等） |

简单概括：**`pyproject.toml` 描述"这个项目是什么、需要什么"，`requirements.txt` 描述"这个项目部署到某个环境要装哪些精确版本"**。

**一个项目的典型分工**

`pyproject.toml` 里写明项目的直接依赖（依赖范围，而非精确版本）：

```toml
[project]
name = "my-web-app"
version = "0.3.1"
dependencies = [
    "flask>=2.3,<3.0",
    "requests>=2.31",
    "psycopg[binary]~=3.1.0",
    "python-dotenv>=1.0",
]

[project.optional-dependencies]
dev = ["pytest>=7.4", "black>=23.12", "mypy>=1.7"]
```

部署或本地复刻环境时，仍然用 `requirements.txt`：

```bash
# 方案A：直接用 requirements.txt（pip freeze 或 pip-compile 生成）
pip install -r requirements.txt

# 方案B：依赖 pyproject.toml，让 pip 现场解析
pip install .
# 或：pip install .[dev]
```

两种方案的差异：

- 方案 A 走 `requirements.txt`，装的是"当时被解析出的精确版本"，可复现性强，但与 `pyproject.toml` 是两份需要手动保持一致的维护负担。
- 方案 B 让 pip 现场读 `pyproject.toml` 里写的版本范围去解析，每次解析都可能装出不同版本（除非有锁文件），不容易复现。

**现代折中：用 lock 文件**

现代工具链（Poetry 的 `poetry.lock`、uv 的 `uv.lock`、Hatch + pip-tools 结合）给出的折中方案是：

- `pyproject.toml` 写**依赖范围**（给开发者看"这个项目大概需要什么"）；
- 由工具自动生成一份**锁文件**（`poetry.lock` / `uv.lock` / `requirements.txt`）记录解析后的精确版本；
- 安装时优先按锁文件装，保证可复现；锁文件需要更新时改 `pyproject.toml` 后让工具重新生成。

**对 requirements.txt 的影响**

结论是：`requirements.txt` 不会立刻消失，它依然是 pip 原生支持的最简单依赖清单格式，CI、Docker 镜像、服务器部署脚本里到处都是。但随着 `pyproject.toml` 生态成熟，`requirements.txt` 越来越倾向于被工具**自动生成**，而不是手写——手写的工作量正在往 `pyproject.toml` 转移。本篇关注 `requirements.txt` 的用法本身，`pyproject.toml` 的细节放到 08 篇。

### 2.8 常见文件内写法补充

`requirements.txt` 除了最基本的"包名 + 版本"，还支持几种不太常见但偶尔会用到的写法。

** 直接装本地路径 / git 仓库**

```text
# 装本地目录（可编辑模式 -e）
-e ./libs/my-private-lib

# 装 git 仓库
git+https://github.com/psf/requests.git@main
git+ssh://git@github.com/myorg/myrepo.git@v1.2.0

# 装 git 仓库的某个子目录
git+https://github.com/myorg/monorepo.git@main#subdirectory=packages/api
```

这些写法在用内网私有包、monorepo 子模块时常见。`-e` 表示"可编辑安装"——包以软链接形式装上，源码改动立即生效，适合本地开发依赖。`@分支名` / `@tag` 锁定到某个 git 引用，相当于版本锁定的等价物。

**环境标记**

```text
# 只在 Windows 装 pywin32
pywin32==306 ; sys_platform == 'win32'

# 只在 Python 3.11 及以下装某个老包
old-pkg==1.0.0 ; python_version < '3.12'

# 只在需要 GPU 时装
torch==2.1.0 ; extra == 'gpu'
```

`;` 后面跟的是**环境标记**（environment marker），表示这行只在满足条件时生效。对于一份清单要适配多平台、多 Python 版本时很有用，但写多了清单会变得难读，复杂条件分支更适合拆成多个文件（见 2.5 节）。

**行内注释与空行**

```text
# 这是一个注释，整行被忽略
flask==2.3.3  # 行尾注释，从 # 到行尾被忽略
requests==2.31.0

# 空行被忽略，可以用来分段
```

注释和空行让清单可读性大增，建议生产项目的 `requirements.txt` 都按"分类 + 注释"组织，而不是干列二十几个包名。

**extras（附加组件）**

```text
psycopg[binary]==3.1.13
fastapi[all]==0.104.1
celery[redis,auth]==5.3.6
```

方括号里是包提供的"extras"——同一份包代码，按需附带不同的可选依赖。比如 `psycopg[binary]` 让 pip 同时装 psycopg + 它的预编译二进制依赖，免去本地编译；`celery[redis,auth]` 让 pip 同时装 celery + redis + auth 相关的额外包。要装哪些 extras，看包文档。这种写法在现代化打包中越来越常见。

## 3. 最佳实践

### 3.1 生产环境一律精确锁版本

最首要的一条经验：**用于部署的 `requirements.txt` 里，每一行都用 `==` 精确锁定补丁版本**。

推荐写法：

```text
flask==2.3.3
requests==2.31.0
psycopg[binary]==3.1.13
```

不推荐写法：

```text
flask>=2.3.0
requests
~psycopg
```

原因前面 2.4 节已经讲过：不锁版本意味着同一份清单在不同时间、不同机器装出来的环境不一样，部署等于在玩"今天能不能跑"的抽奖。`>=` 看似更新更灵活，但当某天上游出了一个不兼容的小版本，CI 会突然挂掉而你盯着代码找不到原因。

如果锁版本带来的"不会自动获得新版安全修复"让你不放心，正确做法是建立**定期升级流程**（3.4 节），而不是放弃锁版本。

### 3.2 永远在独立虚拟环境里 pip freeze

`pip freeze > requirements.txt` 的前提是"当前环境只服务于这一个项目"。在全局环境里 freeze，会把你装过的所有乱七八糟的包都写进清单，别人 `pip install -r` 时会装一堆项目根本用不到的东西，清单失真、装得慢、还可能因为某个无关包的版本冲突导致整份清单装不上。

推荐流程：

```bash
# 1. 为项目开一个干净的虚拟环境
python -m venv .venv
source .venv/bin/activate

# 2. 在干净环境里只装这个项目需要的包
pip install flask requests psycopg[binary] python-dotenv

# 3. 把项目跑通、验证依赖齐全后，再 freeze
pip freeze > requirements.txt
```

不推荐：

```bash
# 在装了几十个历史项目的全局环境里
pip freeze > requirements.txt
# 结果清单里有 pandas、jupyter、tensorflow……项目根本没用到
```

如果你没法保证环境纯净，`pip-tools` 的 `pip-compile` 是更好的选择——它从你指定的 `requirements.in` 出发解析，不受当前环境状态影响。

### 3.3 区分直接依赖与间接依赖

`pip freeze` 把直接依赖和间接依赖混在一起平铺，这带来一个隐患：你想升级 `requests`，改 `requirements.txt` 里 `requests==2.31.0` 到 `requests==2.32.0`，但其实假装"升级"了行——那些间接依赖（`certifi`、`urllib3`……）的版本并没有跟着动，而你又不知道哪些间接依赖会被新版 `requests` 拉进来，结果装出的环境是"半新半旧"的组合，行为无法预期。

两种正确做法：

**做法一：用 pip-compile 替代 pip freeze（推荐）**

写一份只列直接依赖的 `requirements.in`，用 `pip-compile` 重新生成完整 `requirements.txt`。改动时只改 `requirements.in`，再 compile，间接依赖会一并更新。

**做法二：手动只保留直接依赖 + 用 pip check 校验**

如果不想引入 pip-tools，至少在 `requirements.txt` 里**只保留你项目代码真正 import 过的直接依赖**，间接依赖交给 pip 自己解析。改清单时也只改直接依赖。这样清单短、可读，但缺点是丢失了间接依赖的精确版本记录——可复现性会差一点。

配合校验：

```bash
pip check
```

```text
# 输出示意（无冲突时）：
no broken requirements found.

# 输出示意（有冲突时）：
requests 2.31.0 requires urllib3<3,>=1.21.1, but you have urllib3 2.2.0 which is incompatible.
```

`pip check` 报告当前环境里有没有违反依赖声明的情况，是 freeze 之外的轻量校验手段。

### 3.4 建立定期升级流程

锁定版本不是"锁一次就再也不动"，依赖需要主动维护。推荐节奏：每月或每季度跑一次升级流程。

```bash
# 方案一：pip-tools 流程
pip-compile requirements.in --upgrade               # 全部升到最新兼容版本
pip-compile requirements.in --upgrade-package requests   # 只升级 requests

# 方案二：原生 pip 流程
pip install --upgrade -r requirements.txt
pip freeze > requirements.txt
```

每次升级后务必**跑一遍完整测试**再合并到主分支。升级带来的不兼容往往出现在新版本被解析出来的那一刻——跑测试能立刻发现，靠肉眼读 release notes 永远会漏。

**不推荐：甩手不管**

```bash
# 一次 freeze 后２年不更新
```

两年不动的依赖等于背着定时炸弹：某个依赖可能早就存在安全漏洞（甚至被撤回）、某个包可能已经不兼容新版 Python、某天需要在新机器上重装环境时发现某个旧版本的 wheel 已经从 PyPI 下架（PyPI 允许作者撤回版本）。定期升级成本低、收益大，不要省这一步。

### 3.5 把 requirements.txt 纳入版本控制

`.gitignore` 不要忽略 `requirements.txt`。它和源码同等重要，每个 commit 都应该能还原出当时项目运行所需的精确依赖。

```bash
# 推荐：每次新增/升级依赖都单独一个 commit
git add requirements.txt
git commit -m "deps: 升级 requests 到 2.32.0"
```

把"升级依赖"这件事单独留 commit，未来排查时一眼能看出"哪次提交动了依赖"——很多诡异 bug 都发生在依赖升级的那次 commit 之后，能快速定位就能快速回滚。

### 3.6 别把 pip 工具自己写进清单

`pip freeze` 默认会把 `pip` 自身、`setuptools`、`wheel` 这几个包也列出来（取决于你怎么建的虚拟环境）：

```text
pip==23.3.1
setuptools==69.0.0
wheel==0.42.0
```

这几个是"装包的工具"，不是你项目的运行时依赖。清单里带着它们的意义不大——别人 `pip install -r requirements.txt` 时 pip 已经在运行了，不需要再装一次 pip；setuptools 和 wheel 更是只在打包场景才需要。

推荐手动从 `requirements.txt` 里删掉这三个，或者用 `pip-compile`（它默认不会把 pip 自己列进生成结果）。

### 3.7 在容器与 CI 中固定基础镜像 + 一次性装齐

`requirements.txt` 配合 Docker / CI 使用时，最佳实践是**先固定一个 Python 基础镜像版本，再 `pip install -r`**：

```dockerfile
FROM python:3.11.7-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
CMD ["gunicorn", "app:app"]
```

```text
# 输出示意（构建日志）：
Step 1/6 : FROM python:3.11.7-slim
Step 2/6 : WORKDIR /app
Step 3/6 : COPY requirements.txt .
Step 4/6 : RUN pip install --no-cache-dir -r requirements.txt
 ---> Using cache
 ---> 5a3b2c1d4e5f
Successfully built ...
```

几个细节值得注意：

- 基础镜像 `python:3.11.7-slim` 精确锁到补丁版本，避免"今天 3.11.7 明天 3.11.8" 的漂移；
- `--no-cache-dir` 让 pip 不保留下载缓存，镜像更小；
- `COPY requirements.txt` 放在 `COPY . .` 前面——这样只要源码变、依赖没变，Docker 会命中缓存层不必重装依赖，构建更快。

CI 流水线里类似：先 `pip install -r requirements.txt`，再跑测试。锁版本 + 缓存 = 又快又稳。

### 3.8 敏感版本号要核对 release notes

升级到某个大版本（如 `flask 2.3 → 3.0`、`django 4.x → 5.0`）之前，务必读一遍 release notes。大版本号变更在 Python 生态里几乎总是伴随**破坏性改动**——API 被删、默认行为变更、最低 Python 版本提高。直接把 `requirements.txt` 里 `flask==2.3.3` 改成 `flask==3.0.0` 然后期望"应该没事"，大概率会被现实打脸。

推荐做法：大版本升级时，先把约束改成允许新版本的区间并单独拉一条分支：

```bash
# 在 upgrade-flask 分支上试验
git checkout -b upgrade-flask-3
# 改 requirements.txt: flask>=3.0,<4.0
pip install -r requirements.txt
# 跑测试，逐个修复不兼容点
pytest
```

确认测试全绿再合并。每个"大版本 +1"都按这个流程走一遍，远比"一口气升个大的"安全。

### 3.9 依赖冲突时的排查思路

`pip install -r` 报依赖冲突是日常。典型报错：

```text
ERROR: Cannot install pillow==10.0.0 because these package versions have conflicting dependencies.
The conflict is caused by:
    The user requested pillow==10.0.0
    torchvision 0.16.0 depends on pillow>=8.3.2  (but newer versions are incompatible)
    some-other-pkg 1.2.0 depends on pillow<10,>=5.0

To fix this you could try to:
1. loosen the range of allowed versions for pillow
2. remove the explicit version constraint on pillow
```

排查思路：

1. 看报错里"谁要求什么"——上例是 `torchvision` 要 `pillow>=8.3.2`，`some-other-pkg` 要 `pillow<10`，区间不交集。
2. 判断两个要求者哪个更"硬"——通常直接依赖（你写的那个）比间接依赖优先级高。
3. 调约束：要么把 `pillow==10.0.0` 改成 `pillow<10` 让 `some-other-pkg` 满意；要么升级 `some-other-pkg` 到支持 pillow 10 的版本。
4. 用 `pipdeptree`（见 2.6 提到）或 `pipdeptree --reverse-dependency` 可视化依赖树，看清"谁拖了谁进来"。

```bash
# 装 pipdeptree
pip install pipdeptree

# 看整棵依赖树
pipdeptree

# 反查某个包是被谁带进来的
pipdeptree --reverse-dependency --packages pillow
```

```text
# 输出示意：
Warning: Possibly conflicting dependencies:
torchvision==0.16.0
  - pillow>=8.3.2 [requires: >=8.3.2]
some-other-pkg==1.2.0
  - pillow<10 [requires: <10,>=5.0]
```

定位清楚谁要什么，冲突的解法就清楚了。

### 3.10 别用 sudo pip install

哪怕是在服务器、容器里，也尽量别 `sudo pip install -r requirements.txt`。系统自带的 Python（macOS 的 `/usr/bin/python`、Linux 的 `/usr/bin/python3`）是系统工具依赖的，全局装一堆包可能覆盖系统期望的版本，导致 `yum`、`apt` 自己出问题。

正确做法：

```bash
# 推荐：虚拟环境
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 或：用 pipx/user 安装到用户级
pip install --user -r requirements.txt
```

容器里（Dockerfile 默认以 root 运行）更推荐建一个非 root 用户：

```dockerfile
RUN useradd -m appuser
USER appuser
RUN pip install --user -r requirements.txt
ENV PATH="/home/appuser/.local/bin:$PATH"
```

虚拟环境永远是最省心的隔离方式，连服务器部署都推荐 venv 而非全局装。

## 4. 总结

### 4.1 本篇内容要点

- `requirements.txt` 是 pip 约定俗成的依赖清单文件，每行一条 `包名+版本约束`，供 `pip install -r` 一次性复刻环境。
- 版本约束符号是核心：`==`（精确锁定）、`>=`（下限）、`<=`（上限）、`>`、`<`（严格大小）、`~=`（兼容版本）、`!=`（排除）、无符号（最新版）；多个约束用逗号组合为 AND。
- `pip freeze > requirements.txt` 把当前环境所有已装包（含间接依赖）按 `==版本` 格式导出，是从零生成清单最快的路径；前提是环境足够干净。
- `pip install -r requirements.txt` 按清单读取约束并安装，是 `pip freeze` 的逆操作；支持 `-r` 嵌套引用、`-c` 约束文件、`--dry-run` 预演。
- 版本锁定的价值：可复现环境、避免兼容性破坏、提升供应链可审计性；生产环境一律精确锁版本，库开发则用范围约束。
- 单文件有局限：不区分运行时/开发依赖、直接/间接依赖混在一起；通过变体解决——`requirements-dev.txt`（开发依赖）、分环境文件、`constraints.txt`（约束文件）、extras 机制。
- `pip-tools` 的 `pip-compile` 从只列直接依赖的 `requirements.in` 生成完整且带 `via` 注释的精确锁定清单，是 `pip freeze` 的升级替代。
- `requirements.txt` 与 `pyproject.toml` 分工：前者是 pip 直接消费的安装清单（精确锁定、可复现），后者是项目元数据（描述依赖范围、给打包工具读）；现代方案常用 `pyproject.toml` + 自动生成的锁文件组合。
- 最佳实践：生产精确锁版本、在干净虚拟环境里 freeze、区分直接/间接依赖、定期升级 + 跑测试、纳入版本控制、容器场景固定基础镜像、依赖冲突用 `pipdeptree` 排查、别用 sudo pip。

### 4.2 读完应能掌握

- 会写一份涵盖各种约束符号的 `requirements.txt`，并能解释每个符号的匹配范围。
- 能用 `pip freeze` 从干净虚拟环境导出依赖清单，用 `pip install -r` 在新环境复刻。
- 能说清楚"为什么要锁版本"、"锁定版本的代价"、"何时该用范围约束而非精确锁定"。
- 会用 `requirements-dev.txt`、`constraints.txt`、`-r` 嵌套引用组织多套依赖；会用 `pip-compile` 生成带间接依赖来源注释的精确清单。
- 能说清 `requirements.txt` 与 `pyproject.toml` 各自角色，并选择正确的文件承载不同信息。
- 能按"建立虚拟环境 → 装直接依赖 → freeze/compile → 纳入版本控制 → 定期升级 + 测试"的流程管理项目依赖。
- 遇到依赖冲突能按"看报错谁要求什么 → 调约束或升级某包 → 用 pipdeptree 可视化"的思路排查解决。