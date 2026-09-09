---
group:
  title: 【01】初识python
  order: 1
order: 4
title: pip包管理器
nav:
  title: Python基础
  order: 1
---

# pip包管理器

## 1. 介绍

### 1.1 什么是 pip

`pip` 是 Python 的官方包管理器（package manager），用来从 Python 包索引（PyPI，Python Package Index）安装、卸载、升级第三方库，以及管理项目的依赖。如果说 Python 标准库是"出厂自带"的工具箱，那 `pip` 就是去"应用商店"（PyPI）下载更多工具的下载器——你想要的几乎所有第三方功能（Web 框架、数据科学、爬虫、AI 等），都能用 `pip` 一条命令装上。

理解 `pip` 需要先搞清楚几个关键概念：

- **包（package）**：在 Python 语境里，一个"包"通常指一个可安装的、可复用的代码库，如 `requests`（HTTP 请求）、`numpy`（数值计算）。它由开发者发布到 PyPI，使用者用 `pip` 下载安装。
- **PyPI**：Python 官方的第三方包仓库，网址 `https://pypi.org`，目前托管了 40 多万个包。`pip` 默认从这里下载。任何人都能注册账号往 PyPI 发布自己的包。
- **发行版（distribution）**：一个包的一次发布版本，如 `requests 2.31.0`。`pip install` 装的就是某个发行版。

### 1.2 为什么需要包管理器

没有包管理器，你要用某第三方库怎么办？手动去作者网站下载源码，拷到项目里，有依赖还要再手动下依赖……规模化开发几乎不可行。包管理器解决的核心问题是**依赖的自动化管理**：

- **一键获取**：`pip install pandas` 自动从 PyPI 下载 `pandas` 及其全部依赖，装好即用。
- **版本控制**：能指定装哪个版本，避免新版本破坏兼容性。
- **环境隔离**：配合 venv，不同项目用不同版本的同一包而不冲突。
- **复现环境**：`requirements.txt` 把"装了什么、什么版本"固化，任何机器都能还原一模一样的环境。

现代 Python 工程的起点就是 `pip` + venv。掌握 pip，是从"写脚本"迈向"做项目"的关键一步。

### 1.3 pip 在开发流程中的定位

在 Python 开发流程中，`pip` 处于**依赖管理层**——它连接 PyPI 包仓库与本地 Python 环境，是项目环境搭建的第一步：

```text
Python 开发流程的层次结构

├── Python 解释器（基础运行时）
│   └── pip（包管理器）          ← 你在这里
│       ├── 从 PyPI 下载包
│       ├── 安装到虚拟环境
│       └── 管理依赖清单
├── 虚拟环境（venv）
│   └── 独立的 site-packages
└── 项目代码
    └── import 第三方包
```

`pip` 从 Python 3.4 起被**默认随 Python 一起安装**，所以装好 Python 就自动有了 `pip`，无需单独安装。它的典型用途：

- **装第三方库**：写爬虫装 `requests`、做数据分析装 `pandas`、搭 Web 服务装 `flask`。
- **管理项目依赖**：把项目用到的所有包及版本写进 `requirements.txt`，别人拿到代码后一条命令复现环境。
- **升级/卸载库**：库有新版本时升级，不再用某库时卸载。
- **查看环境**：列出装了哪些包、某包的版本与依赖关系。

### 1.4 pip 与虚拟环境的关系

`pip` 装的包，装到哪里去？这取决于**当前激活的 Python 环境**：

- **没激活虚拟环境时**：`pip install` 装到系统 Python 的全局目录（或用户级目录），所有项目都能 import，但容易版本冲突。
- **激活了虚拟环境（venv）时**：`pip install` 只装到当前虚拟环境，与系统和其他项目隔离。

所以正确的用法是**先激活虚拟环境，再用 pip 装包**——这样每个项目的依赖互不污染。

验证 pip 装到了哪个环境，用以下命令：

```bash
python3 -m pip --version
```

**未激活 venv 时的输出示例**：

```text
pip 26.1.2 from /opt/homebrew/lib/python3.12/site-packages/pip (python 3.12)
```

**已激活 venv 时的输出示例**：

```text
pip 26.1.2 from .venv/lib/python3.12/site-packages/pip (python 3.12)
```

`from` 路径若是 `.venv/...`，说明装进了虚拟环境，符合预期；若是系统路径，说明可能没激活 venv。

---

## 2. 安装与配置

### 2.1 前提条件

使用 `pip` 需要满足以下前提：

1. **已安装 Python 3.4+**：pip 从 Python 3.4 起随 Python 一起安装，无需单独装。
2. **能访问网络**：默认从 PyPI 下载包，国内用户建议配置镜像源（见 2.5）。
3. **建议已创建虚拟环境**：在 venv 中使用 pip 是最佳实践，避免污染系统 Python。

检查 pip 是否已安装：

```bash
python3 -m pip --version
```

**预期输出**：

```text
pip 26.1.2 from /path/to/python3.12/site-packages/pip (python 3.12)
```

如果报错 `No module named pip`，说明 Python 安装时未包含 pip，需手动安装。

### 2.2 确认与使用正确的 pip

`pip` 命令本身可能指向多个 Python 环境，这是新手常困惑的根源。以下是几种调用方式对比：

| 调用方式 | 命令 | 特点 | 推荐度 |
|---------|------|------|-------|
| 裸 pip | `pip install xxx` | 可能指向任意解释器，多版本时不安全 | 不推荐 |
| pip3 | `pip3 install xxx` | 指向 Python3 的 pip，但仍可能不精准 | 一般 |
| python -m pip | `python3 -m pip install xxx` | 明确绑定当前 python3 对应的 pip | **推荐** |
| 指定版本 | `python3.12 -m pip install xxx` | 绑定指定版本解释器 | 最精准 |

**为什么推荐 `python3 -m pip`**：它明确用"当前这条 `python3` 命令"对应的 pip 模块，装包一定进到这个 Python 环境。而裸 `pip` 在多版本/多 venv 时可能指向别的解释器，导致"装了却 import 不到"。

```bash
# 推荐写法
python3 -m pip install requests

# 验证当前 pip 绑定的环境
python3 -m pip --version
```

### 2.3 升级 pip 自身

`pip` 也是个包，会随 Python 一起装但版本可能旧。某些 PyPI 包要求较新 pip 才能装（报错信息会提示），所以遇到安装失败先试试升级 pip：

```bash
python3 -m pip install --upgrade pip
```

**预期输出**：

```text
Requirement already satisfied: pip in /path/to/.venv/lib/python3.12/site-packages (version 26.1.2)
```

如果显示 `Successfully installed pip-xx.x.x`，说明升级成功。

### 2.4 镜像源配置（国内加速）

PyPI 官方源在国内访问慢甚至超时，配国内镜像能大幅提速。

**常用国内镜像源**：

| 镜像名称 | 地址 | 特点 |
|---------|------|------|
| 清华大学 | `https://pypi.tuna.tsinghua.edu.cn/simple` | 最稳定、最常用 |
| 阿里云 | `https://mirrors.aliyun.com/pypi/simple` | 速度快 |
| 中科大 | `https://pypi.mirrors.ustc.edu.cn/simple` | 高校用户友好 |
| 腾讯云 | `https://mirrors.cloud.tencent.com/pypi/simple` | 腾讯内网更快 |

**临时使用某镜像**（单次安装时指定）：

```bash
python3 -m pip install requests -i https://pypi.tuna.tsinghua.edu.cn/simple
```

`-i` / `--index-url` 指定索引地址，只对本次命令生效。

**永久配置默认镜像**（推荐，一次设置长期生效）：

```bash
python3 -m pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
```

之后所有 `pip install` 默认走清华源。

**配置文件位置**：pip 的配置存于 `pip.ini`（Windows，在 `%APPDATA%\pip\`）或 `pip.conf`（macOS/Linux，在 `~/.config/pip/` 或 `~/.pip/`）。也可用 `pip config` 命令读写，不必手改文件。手动编辑时的示例 `pip.conf` 内容：

```ini
[global]
index-url = https://pypi.tuna.tsinghua.edu.cn/simple
trusted-host = pypi.tuna.tsinghua.edu.cn
```

`trusted-host` 在用 HTTP（非 HTTPS）镜像或证书有问题时避免 SSL 报错。

### 2.5 pip config 配置管理

`pip config` 命令管理 pip 的全局配置，常用操作如下：

| 命令 | 作用 | 示例 |
|------|------|------|
| `pip config list` | 查看所有配置 | `pip config list` |
| `pip config get <key>` | 查看某项配置 | `pip config get global.index-url` |
| `pip config set <key> <value>` | 设置某项配置 | `pip config set global.timeout 60` |
| `pip config unset <key>` | 删除某项配置 | `pip config unset global.timeout` |
| `pip config edit` | 用编辑器打开配置文件 | `pip config edit` |

配置有三个级别，pip 按优先级合并（高优先级覆盖低优先级）：

```text
配置优先级（从高到低）：

--venv / --site    ← 当前虚拟环境（最高优先级）
      ↓
--user             ← 当前用户
      ↓
--global           ← 全局所有用户（最低优先级）
```

**常用配置项**：

| 配置项 | 作用 | 推荐值 | 说明 |
|-------|------|-------|------|
| `global.index-url` | 默认索引地址 | 清华/阿里镜像 URL | 国内必须配 |
| `global.timeout` | 下载超时秒数 | `120` | 网络差时调大避免超时报错 |
| `global.trusted-host` | 信任的主机 | 镜像域名 | 非 HTTPS 源或证书问题时用 |

```bash
# 设置超时为 120 秒（网络差时避免超时报错）
python3 -m pip config set global.timeout 120
```

### 2.6 安装常见问题排查

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| `No module named pip` | Python 安装时未包含 pip | 用 `ensurepip` 恢复：`python3 -m ensurepip --upgrade` |
| `pip: command not found` | pip 不在 PATH 中 | 用 `python3 -m pip` 替代裸 `pip` |
| `WARNING: You are using pip version xx.x` | pip 版本过旧 | `python3 -m pip install --upgrade pip` |
| `ConnectionError` / SSL 证书错误 | 网络问题或镜像证书 | 换镜像源；加 `--trusted-host`；增大 `--timeout` |
| `Permission denied` | 往系统级目录装没权限 | **激活虚拟环境**装到 venv；或用 `--user`；**绝不用 `sudo pip`** |
| `Could not find a version` | 包名写错 / 版本不存在 / 镜像未同步 | 检查包名拼写；确认版本号；换镜像或加 `--index-url` |
| `error: Microsoft Visual C++` (Windows) | 缺编译工具 | 装 Visual C++ Build Tools；或装预编译 wheel 版 |

---

## 3. 核心命令与参数

### 3.1 命令速查表

下表列出 pip 最常用的命令与核心参数，供日常速查：

| 命令 | 作用 | 常用参数/示例 |
|------|------|-------------|
| `pip install` | 安装包 | `==` `>=` `<` `~=` `!=` 指定版本；`-r` 按清单装；`-e` 可编辑模式 |
| `pip uninstall` | 卸载包 | `-y` 跳过确认 |
| `pip install --upgrade` | 升级包 | `-U` 简写 |
| `pip list` | 列出已装包 | `--outdated` 列出过时包 |
| `pip show` | 查看某包详情 | 显示版本/位置/依赖 |
| `pip freeze` | 导出依赖清单 | 输出 `包名==版本` 格式 |
| `pip config` | 管理配置 | `set` / `get` / `list` / `unset` |
| `pip cache` | 管理缓存 | `dir` / `list` / `purge` |
| `pip download` | 只下载不安装 | `-d` 指定下载目录 |
| `pip install -e` | 开发模式安装 | 本地源码实时生效 |

### 3.2 安装包：install

`pip install` 是最高频命令。基本形态：

```bash
# 装最新版
python3 -m pip install requests

# 装指定版本
python3 -m pip install requests==2.31.0

# 装满足版本范围的版本
python3 -m pip install "requests>=2.25,<3"

# 一次装多个
python3 -m pip install requests flask
```

**版本指定语法**（PEP 440 标准）：

| 语法 | 含义 | 适用场景 |
|------|------|---------|
| `requests` | 不指定，装最新 | 临时测试 |
| `requests==2.31.0` | 精确版本，双等号 | **生产环境锁定** |
| `requests>=2.25` | 不低于 2.25 | 最低版本要求 |
| `requests>=2.25,<3` | 区间 2.25(含)到 3(不含) | 允许小版本更新但不跨大版本 |
| `requests~=2.31.0` | 兼容版本，等价 `>=2.31.0,<2.32` | 库开发保证小版本兼容 |
| `requests!=2.30.0` | 排除某版本 | 该版本有 bug |

**注意事项**：

- `>=2.25,<3` 中逗号分隔多个约束，shell 中必须用引号包裹（因为 `<` 在 shell 里有特殊含义）。
- 版本控制的重要性：`requests` 从 2.x 升到 3.x 可能有不兼容改动，锁定版本保证所有环境行为一致，避免"我这能跑你那报错"。

**安装中的进度与输出**：

`pip install` 会输出下载进度、依赖解析过程、安装结果。看到以下输出即装成功：

```text
Successfully installed requests-2.31.0
```

若装多个包，pip 先解析依赖树再统一安装，避免冲突。

### 3.3 安装来源

`pip install` 默认从 PyPI 装，但也支持其他来源：

**从 PyPI 装**（默认行为）：

```bash
python3 -m pip install requests
```

**从本地压缩包装**：

```bash
python3 -m pip install ./downloads/SomePackage-1.0.tar.gz
```

**从本地源码目录装**：

```bash
python3 -m pip install ./mylocalpkg/
```

**从 Git 仓库装**（适合用尚在开发、未发布 PyPI 的库）：

```bash
# 默认分支
python3 -m pip install git+https://github.com/psf/requests.git

# 指定 tag/分支/commit
python3 -m pip install git+https://github.com/psf/requests.git@v2.31.0
```

**从其他索引装**（如私有源）：

```bash
python3 -m pip install somepackage --index-url https://private.pypi/simple
```

开发时常会遇到"这个 bug 的修复还没发版，但作者已合并到 main"，这时从 git 仓库装最新代码就能用上修复。

### 3.4 卸载包：uninstall

```bash
# 卸载，会提示确认 y/n
python3 -m pip uninstall requests

# 卸载，跳过确认
python3 -m pip uninstall requests -y

# 一次卸载多个
python3 -m pip uninstall requests flask -y
```

**关键特性**：卸载会移除该包，但**不会自动卸载它的依赖**。依赖可能被别的包共用，贸然删会破坏其他包。所以卸载后 site-packages 里可能残留已无用的依赖，需要时手动卸或用 `pip-autoremove` 等第三方工具。

### 3.5 升级与降级

**升级**：

```bash
# 升级到最新版（--upgrade 或 -U 简写）
python3 -m pip install --upgrade requests
python3 -m pip install -U requests

# 指定更高版本也会触发升级
python3 -m pip install "requests>=2.31"
```

**降级**：装一个比当前更低的版本即降级：

```bash
# 当前若是 2.31，此命令降级到 2.28
python3 -m pip install "requests==2.28.0"
```

升级可能引入不兼容改动，生产环境升级前应在测试环境验证。锁定 `requirements.txt` 的项目，升级某包后要同步更新清单并测试。

### 3.6 查看包：list / show / freeze

**列出已装包**：

```bash
python3 -m pip list
```

**预期输出**：

```text
Package    Version
---------- -------
pip        23.3.1
requests   2.31.0
setuptools 68.0.0
```

**实用过滤器**：

```bash
# 列出有新版本可升级的包
python3 -m pip list --outdated

# 列出已是最新版的包
python3 -m pip list --uptodate
```

`--outdated` 很实用：查看哪些包过时了，决定是否升级。

**查看某包详情**：

```bash
python3 -m pip show requests
```

**预期输出**：

```text
Name: requests
Version: 2.31.0
Summary: Python HTTP for Humans.
Home-page: https://requests.readthedocs.io
Author: Kenneth Reitz
Location: /path/to/site-packages
Requires: charset-normalizer, idna, urllib3, certifi
Required-by: ...
```

各字段含义：

| 字段 | 含义 | 排查用途 |
|------|------|---------|
| `Name` | 包名 | 确认 |
| `Version` | 当前版本 | 版本问题排查 |
| `Location` | 安装路径 | 确认装在哪个环境 |
| `Requires` | 该包依赖哪些包 | 依赖排查 |
| `Required-by` | 哪些包依赖它 | 卸载前确认是否被依赖 |

**freeze 导出清单**：

```bash
python3 -m pip freeze
```

**预期输出**：

```text
requests==2.31.0
urllib3==2.0.4
...
```

导出到文件：

```bash
python3 -m pip freeze > requirements.txt
```

`pip freeze` 输出精确到版本号的清单，适合固化环境。`pip list` 输出更易读（表格）但不含版本锁定语义，`freeze` 才是给 `install -r` 用的格式。

### 3.7 开发模式安装：editable

在开发自己的包时，希望改代码立即生效而不必反复重新安装，用可编辑模式（`-e`）：

```bash
python3 -m pip install -e ./mypackage
```

`-e`（editable）在 site-packages 里建一个指向源码目录的链接，而不是复制文件。之后你改源码，被安装的包立即反映改动，无需重装。这是开发库/共享模块的标准做法。

前提是项目里有 `setup.py` 或 `pyproject.toml` 声明包元数据。在此结构下，`pip install -e .` 让本地包"可导入且实时更新"。

### 3.8 下载缓存与离线安装

pip 默认会**缓存**下载的包文件，再次安装同一版本时优先用缓存，免去重复下载。

**缓存管理命令**：

| 命令 | 作用 |
|------|------|
| `pip cache dir` | 显示缓存目录路径 |
| `pip cache list` | 列出缓存中的包 |
| `pip cache purge` | 清空缓存（磁盘紧张时） |

```bash
python3 -m pip cache dir
```

**预期输出**：

```text
/Users/username/Library/Caches/pip
```

**利用缓存做"半离线"安装**：在能联网的机器装过某包后，缓存里就有该文件；后续即使断网，只要缓存还在，pip 仍能从缓存安装。

**完全离线安装**：在外网机器下载 wheel 文件，拷到内网机器本地安装：

```bash
# 外网机器：只下载不安装
python3 -m pip download requests -d ./wheels/
python3 -m pip download -r requirements.txt -d ./wheels/

# 内网机器：从本地文件安装，--no-index 禁止连 PyPI
python3 -m pip install --no-index --find-links=./wheels/ requests
python3 -m pip install --no-index --find-links=./wheels/ -r requirements.txt
```

`--find-links`（简写 `-f`）指定本地目录找包，`--no-index` 不访问任何在线索引。这套组合是内网/气隙环境部署 Python 项目的标准做法。

### 3.9 wheel 与 sdist

从 PyPI 装包时，实际下载的是两种发行文件之一：

| 类型 | 扩展名 | 特点 | 安装速度 |
|------|--------|------|---------|
| wheel | `.whl` | 预编译二进制包，直接解压到 site-packages | 快 |
| sdist | `.tar.gz` | 源码包，需本地编译 | 慢，可能失败 |

pip 优先找 wheel。为什么有的包装得快（`numpy` 有预编译 wheel，秒装）、有的装得慢还报错（只有 sdist，本地编译）：就是 wheel 与 sdist 的区别。

查看某包装的是哪种：

```bash
python3 -m pip install numpy -v
```

`-v` 详细输出，能看到下载的是 `.whl` 还是 `.tar.gz`。

**wheel 文件名与平台标签**：

```text
numpy-1.26.0-cp312-cp312-manylinux_2_17_x86_64.whl
       版本    解释器  ABI        平台
```

| 标签 | 含义 |
|------|------|
| `cp312` | CPython 3.12 专用（不同 Python 版本的 wheel 不通用） |
| `manylinux_x86_64` | 适用于 x86_64 架构的 Linux |
| `win_amd64` | Windows 64 位 |
| `macosx_*` | macOS |

**跨平台问题**：在 macOS 上 `pip freeze` 导出的包，若含只有 macOS wheel 的包，直接拿到 Linux 服务器 `pip install -r` 可能装不上（平台不匹配）。应对方法：`requirements.txt` 只列纯 Python 包或确认有多平台 wheel 的包。

### 3.10 依赖解析与冲突

pip 安装时会**解析依赖**：某包声明依赖某些包的某些版本，pip 要找到一组互不冲突的版本组合。

**查看依赖树**（用 `pipdeptree` 第三方工具）：

```bash
# 先安装 pipdeptree
python3 -m pip install pipdeptree

# 查看依赖树
pipdeptree
```

**预期输出**：

```text
requests==2.31.0
  - certifi [required: >=2017.4.17, installed: 2023.7.22]
  - charset-normalizer [required: >=2,<4, installed: 3.2.0]
  - idna [required: >=2.5,<4, installed: 3.4]
  - urllib3 [required: >=1.21.1,<3, installed: 2.0.4]
```

反向查看谁依赖了某包：

```bash
pipdeptree --reverse --packages requests
```

**依赖冲突**：若包 A 要 `urllib3<2`，包 B 要 `urllib3>=2`，两者同时装会冲突。新版 pip（21+）有**依赖解析器**，会把冲突报出来（`ResolutionImpossible`），而不是装出一个坏环境。

**如何解决冲突**：

1. 升级某个包到与其他包兼容的版本。
2. 用主项目自己 pin 住冲突包的版本（`pip install urllib3==1.26.16`），但其他包可能不兼容。
3. 复杂项目考虑用 `pip-tools` 或 `poetry`/`uv` 做更精细的依赖锁定。

### 3.11 requirements.txt 依赖管理

`requirements.txt` 是 Python 项目记录依赖的事实标准文件。其语法与 `pip install` 的版本指定一致：

```text
# 注释行
requests==2.31.0              # 精确版本
flask>=2.0                    # 最低版本
numpy>=1.21,<2.0              # 版本区间
python-dotenv                 # 不指定版本（一般不推荐）
-r other-requirements.txt     # 引用另一份清单
git+https://github.com/org/repo.git@v1.0  # git 来源
```

**安装清单**：

```bash
python3 -m pip install -r requirements.txt
```

pip 逐行解析并安装，自动处理依赖关系与版本约束。

**开发依赖与生产依赖分离**：项目常把"运行必需"与"开发/测试必需"分开：

```text
# requirements.txt（生产）
flask==3.0.0
requests==2.31.0
```

```text
# requirements-dev.txt（开发，在其中引用生产清单）
-r requirements.txt
pytest==7.4.0
black==23.0
mypy==1.5
```

开发时 `pip install -r requirements-dev.txt`，既装生产依赖又装测试工具；部署只装 `requirements.txt`，保持环境精简。

**固定版本的意义**：`requests==2.31.0` 把版本写死，任何机器装出完全一致的环境，这是可复现（reproducible）的基础。不写版本（只写 `requests`）的话，今天装是 2.31、明天 PyPI 发了 3.0 装成 3.0，可能突然不兼容——这是"它能跑我那不能跑"的常见根源。生产项目务必锁版本。

**环境标记**（条件安装）：

```text
pywin32==306; sys_platform == 'win32'     # 仅 Windows 装
uvloop==0.19.0; sys_platform != 'win32'   # 仅非 Windows 装
dataclasses==0.8; python_version < '3.7'  # 仅 Python<3.7 装
```

分号 `;` 后跟条件，使同一份清单能跨平台/跨版本用，自动按环境装合适的包。

### 3.12 约束文件 constraints.txt

当项目依赖多个内部包、又想统一约束它们的共同依赖版本时，用**约束文件**（`-c`）：

```text
# constraints.txt
urllib3==2.0.4
numpy==1.26.0
```

```bash
python3 -m pip install -c constraints.txt requests flask
```

`-c`（constraints）与 `-r`（requirements）的区别：

| 参数 | 含为 | 是否强制安装 | 适用场景 |
|------|------|------------|---------|
| `-r` | 必须安装这些包 | 是 | 项目依赖清单 |
| `-c` | 如果要装这些包，版本必须如此约束 | 否 | 大型组织统一管控通用依赖版本 |

约束文件不强制安装某包，只在你装到的包恰好涉及该约束时生效。

### 3.13 哈希校验保证完整性

`requirements.txt` 可附带每个包的**哈希值**，确保下载的包与预期完全一致，防止包被篡改或镜像同步出错（supply-chain 安全）：

```text
requests==2.31.0 \
    --hash=sha256:xxxx... \
    --hash=sha256:yyyy...
```

启用哈希校验后安装：

```bash
python3 -m pip install --require-hashes -r requirements.txt
```

pip 会校验每个下载文件的实际哈希与清单里的是否一致，不符就拒绝安装。生成哈希最便捷的方式是用 `pip-tools` 的 `pip-compile --generate-hashes`。

对于安全要求高的项目（金融、企业核心系统），哈希校验能把"装了被篡改的包"风险降到接近零。普通学习项目可不用，但要知道这套机制存在。

### 3.14 pip 之外的依赖管理工具

pip 是基础但较简陋，生态里有更现代的工具解决 pip 的痛点（依赖锁定、解析慢等）：

| 工具 | 定位 | 核心优势 | 适用场景 |
|------|------|---------|---------|
| **pip-tools** | pip 增强插件 | `pip-compile` 编译精确锁定文件，`pip-sync` 同步环境 | 基于 pip，增强锁定能力 |
| **Poetry** | 一体化工具 | 自动虚拟环境、依赖锁定、打包发布 | 中大型项目，体验接近 npm/cargo |
| **uv** | 极快替代品 | Rust 编写，兼容 pip 命令，速度十倍以上 | 追求速度，当前新趋势 |
| **conda** | 科学计算环境 | 能管非 Python 依赖（C 库等） | 数据科学，与 pip 体系并存 |

选型建议：小/中项目用 pip + venv + requirements.txt 足够；复杂依赖锁定上 poetry 或 pip-tools；追求速度用 uv。

---

## 4. 实战工作流与 FAQ

### 4.1 完整实战：从零搭建项目依赖

把前面各节串起来，演示一个真实项目从无到有的依赖管理全流程：

```bash
# 1. 建项目目录与虚拟环境
mkdir webdemo && cd webdemo
python3 -m venv .venv
source .venv/bin/activate

# 2. 配置 pip 镜像与超时（国内加速）
python3 -m pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
python3 -m pip config set global.timeout 120

# 3. 升级 pip 自身
python3 -m pip install --upgrade pip

# 4. 装核心依赖
python3 -m pip install "flask==3.0.0" "requests==2.31.0"

# 5. 装开发依赖
python3 -m pip install "pytest==7.4.0" "black==23.12.0"
```

**固化依赖清单**——手写顶层依赖而非用 `freeze` 全量导出：

```text
# requirements.txt（生产）
flask==3.0.0
requests==2.31.0
```

```text
# requirements-dev.txt（开发，引用生产清单）
-r requirements.txt
pytest==7.4.0
black==23.12.0
```

**配置 git 忽略文件**：

```text
# .gitignore
.venv/
__pycache__/
*.pyc
```

```bash
# 提交（只提交源码与清单，.venv 被忽略）
git init && git add . && git commit -m "init project"

# 别人/CI 复现环境
python3 -m venv .venv && source .venv/bin/activate
python3 -m pip install -r requirements-dev.txt  # 开发
python3 -m pip install -r requirements.txt       # 部署
```

**最佳实践图解**：

```text
项目依赖管理标准流程：

创建 venv → 配镜像源 → 升级 pip → 装依赖 → 固化清单 → 提交代码
    │           │          │         │         │          │
    │           │          │         │         │          └─ .venv/ 被忽略
    │           │          │         │         │             requirements.txt 被提交
    │           │          │         │         └─ 手写顶层依赖（非 freeze 全量导出）
    │           │          │         └─ pip install -r requirements.txt
    │           │          └─ pip install --upgrade pip
    │           └─ pip config set global.index-url 镜像地址
    └─ python -m venv .venv && source .venv/bin/activate
```

**手写顶层依赖 vs freeze 全量导出的权衡**：`freeze` 会把 flask 的所有传递依赖（jinja2、werkzeug 等）及精确版本一并列出，清单冗长且耦合具体环境；手写顶层依赖，让 pip 自动解析传递依赖，清单简洁、聚焦项目真正声明的内容。需要绝对精确锁定时再用 `pip-compile` 生成锁定文件。

### 4.2 最佳实践速查

| 序号 | 最佳实践 | 说明 |
|------|---------|------|
| 1 | 永远先激活虚拟环境再 pip | 未激活 venv 时 pip 装到全局，项目间冲突迟早发生 |
| 2 | 用 `python -m pip` 而非裸 pip | 确保绑定当前解释器，避免装错环境 |
| 3 | requirements.txt 锁定精确版本 | 写死版本才能复现环境，避免"昨天能跑今天报错" |
| 4 | 生产与开发依赖分离 | 部署只装生产依赖，环境精简 |
| 5 | 国内配镜像源 | 大幅加速，设一次长期生效 |
| 6 | 绝不用 `sudo pip` | 污染系统 Python，可能导致系统工具崩溃 |
| 7 | 升级前测试，更新后同步清单 | 升级可能引入不兼容改动，测试后同步 `requirements.txt` |
| 8 | 报错先看最后几行 | pip 报错冗长，但根本原因在最后 |
| 9 | 卸载注意残留依赖 | `pip uninstall` 不删依赖，定期审视 `pip list` |
| 10 | `.venv` 不入 git，`requirements.txt` 入 git | venv 大且环境相关，清单是项目复现的关键 |

### 4.3 常见问题 FAQ

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| `pip install` 报 `Could not find a version` | 包名写错 / 版本不存在 / 镜像未同步 | 检查包名拼写（上 PyPI 网站确认）；确认版本号；换镜像或加 `--index-url` |
| `ConnectionError` / SSL 证书错误 | 网络问题或镜像证书 | 增大超时 `--timeout 120`；换镜像；HTTPS 证书问题加 `--trusted-host` |
| `Permission denied` | 往系统级目录装没权限 | **激活虚拟环境**装到 venv 不需要 sudo；若坚持系统级装加 `--user`；**绝不用 `sudo pip`** |
| `error: command 'gcc' failed` | 源码包需本地编译，缺编译器或头文件 | Linux 装 `python3-dev`/`build-essential`；macOS 装 Xcode Command Line Tools；或装预编译 wheel 版 |
| `pip` 报版本过旧警告 | pip 版本低，部分包要求新 pip | `python3 -m pip install --upgrade pip` 重试 |
| 装了包却 `import` 不到 | pip 指向了错误的解释器 | 用 `python3 -m pip install` 确保 pip 绑定当前 python；检查 `pip --version` 的 `from` 路径 |
| `pip freeze` 导出的清单在别的平台装不上 | 含平台特定 wheel 的包 | `requirements.txt` 只列纯 Python 包；含 C 扩展的包确认目标平台有预编译 wheel |
| 装了多个包后有版本冲突 | 包之间的依赖版本约束互斥 | 升级某包到兼容版本；或 pin 住冲突包版本；复杂项目用 pip-tools/poetry |
| 卸载某包后残留大量无用依赖 | `pip uninstall` 不删依赖 | 定期审视 `pip list`；或用 `pip-autoremove` 工具自动清理 |
| `pip config set` 不生效 | 配置级别优先级覆盖问题 | 检查 `pip config list` 确认当前生效值；注意 `--venv` > `--user` > `--global` 优先级 |

### 4.4 发布包到 PyPI（了解）

把自己写的库发布到 PyPI，别人就能 `pip install` 你的包。流程概览：

**第一步：组织项目结构**：

```text
mypackage/
├── pyproject.toml
├── src/
│   └── mypackage/
│       ├── __init__.py
│       └── core.py
└── README.md
```

**第二步：写元数据**（`pyproject.toml`，现代打包标准 PEP 621）：

```toml
[build-system]
requires = ["setuptools"]
build-backend = "setuptools.backends._legacy:_Backend"

[project]
name = "mypackage"
version = "0.1.0"
dependencies = ["requests>=2.25"]
```

**第三步：构建发行版**：

```bash
python3 -m pip install build
python3 -m build
```

生成 `dist/` 下的 `.whl` 和 `.tar.gz`。

**第四步：上传到 PyPI**：

```bash
python3 -m pip install twine
twine upload dist/*
```

首次需在 `https://pypi.org` 注册账号并用 API token 认证。发布后，全世界都能 `pip install mypackage`。这是开源协作的基础。初学了解流程即可，真要发布时再细究打包规范。

---

## 5. 总结

本文围绕 pip 包管理器展开，主要介绍了以下内容：

- **pip 定位**：Python 官方包管理器，从 PyPI 安装/卸载/升级第三方库，管理项目依赖；Python 3.4+ 默认自带，与虚拟环境配合实现项目隔离。
- **安装与配置**：推荐 `python3 -m pip` 确保绑定当前解释器；升级 pip 自身用 `pip install --upgrade pip`；国内配镜像源加速；`pip config` 管理全局配置（index-url、timeout、trusted-host）。
- **核心命令**：`install`（版本指定语法 `==`/`>=`/`<`/`~=`/`!=`）、`uninstall`（不删依赖）、`list`/`show`/`freeze`（查看与导出）、`install -e`（开发模式）、`cache`/`download`（缓存与离线安装）。
- **安装来源**：PyPI（默认）、本地压缩包/目录、git 仓库、私有索引，覆盖各种非标准安装场景。
- **依赖管理**：`requirements.txt` 语法与生产/开发分离、环境标记条件安装、约束文件、哈希校验保证完整性。
- **依赖解析**：`pipdeptree` 查看依赖树、冲突识别与解决、新版解析器报 `ResolutionImpossible`。
- **wheel 与 sdist**：预编译 wheel 快、源码 sdist 需编译，pip 优先 wheel；平台标签决定跨平台兼容。
- **工具生态**：pip-tools（锁定增强）、Poetry（一体化）、uv（极快）、conda（科学计算）的定位与选型。
- **实战工作流**：从零搭建项目依赖的标准流程——创建 venv、配镜像、升 pip、装依赖、手写顶层依赖清单、提交代码。
- **常见问题**：找不到版本、网络/SSL、权限、编译失败、装了 import 不到、跨平台不兼容、依赖冲突等问题的排查与解决。
