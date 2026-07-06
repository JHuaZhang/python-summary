---
group:
  title: 【01】初识python
  order: 1
order: 3
title:  pip包管理器
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 pip

`pip` 是 Python 的官方包管理器(package manager),用来从 Python 包索引(PyPI,Python Package Index)安装、卸载、升级第三方库,以及管理项目的依赖。如果说 Python 标准库是"出厂自带"的工具箱,那 `pip` 就是去"应用商店"(PyPI)下载更多工具的下载器——你想要的几乎所有第三方功能(Web 框架、数据科学、爬虫、AI 等),都能用 `pip` 一条命令装上。

理解 `pip` 的几个关键认知:

- **包(package)**:在 Python 语境里,一个"包"通常指一个可安装的、可复用的代码库,如 `requests`(HTTP 请求)、`numpy`(数值计算)。它由开发者发布到 PyPI,使用者用 `pip` 下载安装。
- **PyPI**:Python 官方的第三方包仓库,网址 https://pypi.org ,目前托管了 40 多万个包。`pip` 默认从这里下载。任何人都能注册账号往 PyPI 发布自己的包。
- **发行版(distribution)**:一个包的一次发布版本,如 `requests 2.31.0`。`pip install` 装的就是某个发行版。

`pip` 从 Python 3.4 起被**默认随 Python 一起安装**,所以装好 Python(见《Python 环境与基础》)就自动有了 `pip`,无需单独安装。这也是为什么本系列把 pip 作为环境基石的一节——它是写 Python 项目绕不开的工具。

在实际开发中,`pip` 的典型用途:

- **装第三方库**:写爬虫装 `requests`、做数据分析装 `pandas`、搭 Web 服务装 `flask`。
- **管理项目依赖**:把项目用到的所有包及版本写进 `requirements.txt`,别人拿到代码后一条命令复现环境。
- **升级/卸载库**:库有新版本时升级,不再用某库时卸载。
- **查看环境**:列出装了哪些包、某包的版本与依赖关系。

### 1.2 pip 与虚拟环境的关系

`pip` 装的包,装到哪里去?这取决于**当前激活的 Python 环境**:

- **没激活虚拟环境时**:`pip install` 装到系统 Python 的全局目录(或用户级目录),所有项目都能 import,但容易版本冲突。
- **激活了虚拟环境(venv)时**:`pip install` 只装到当前虚拟环境,与系统和其他项目隔离。

所以正确的用法是**先激活虚拟环境,再用 pip 装包**——这样每个项目的依赖互不污染,与《Python 环境与基础》里强调的"每个项目一个 venv"理念一致。

验证 pip 装到了哪个环境,用:

```bash
pip --version
# 输出示例(未激活 venv):
# pip 23.3.1 from /usr/local/lib/python3.12/site-packages/pip (python 3.12)
# 输出示例(已激活 venv):
# pip 23.3.1 from .venv/lib/python3.12/site-packages/pip (python 3.12)
```

输出里的 `from ...` 路径就说明 pip 装包会落到哪个环境。`python -m pip`(见 2.1)能更可靠地保证用的是当前 `python` 对应的 pip。

### 1.3 基本命令速览

`pip` 最常用的几条命令:

```bash
pip install <包名>          # 安装包
pip uninstall <包名>        # 卸载包
pip list                    # 列出已装包
pip show <包名>             # 查看某包详情(版本/位置/依赖)
pip install --upgrade <包名> # 升级包
pip freeze > requirements.txt # 导出依赖清单
pip install -r requirements.txt # 按清单安装
```

这是日常 90% 场景会用到的。下文第 2 章逐条详述每个命令的参数与场景。

### 1.4 为什么需要包管理器

没有包管理器,你要用某第三方库怎么办?手动去作者网站下载源码,拷到项目里,有依赖还要再手动下依赖……规模化开发几乎不可行。包管理器解决的核心问题是**依赖的自动化管理**:

- **一键获取**:`pip install pandas` 自动从 PyPI 下载 `pandas` 及其全部依赖,装好即用。
- **版本控制**:能指定装哪个版本,避免新版本破坏兼容性。
- **环境隔离**:配合 venv,不同项目用不同版本的同一包而不冲突。
- **复现环境**:`requirements.txt` 把"装了什么、什么版本"固化,任何机器都能还原一模一样的环境。

可以说,现代 Python 工程的起点就是 `pip` + venv。掌握 pip,是从"写脚本"迈向"做项目"的关键一步。

---

## 2. 核心内容

本章详尽讲解 pip 的每条常用命令、参数、版本指定语法、依赖管理、镜像源配置、常见报错处理,以及从零到发布包的完整链路。

### 2.1 确认与使用正确的 pip

`pip` 命令本身可能指向多个 Python 环境,这是新手常困惑的根源。三种调用方式:

```bash
pip install requests          # 方式一:直接 pip
pip3 install requests         # 方式二:macOS/Linux 上 python3 对应的 pip
python -m pip install requests # 方式三(推荐):用当前 python 调 pip
python3 -m pip install requests
```

**为什么推荐 `python -m pip`**:它明确用"当前这条 `python` 命令"对应的 pip 模块,装包一定进到这个 python 的环境。而裸 `pip` 在多版本/多 venv 时可能指向别的解释器,导致"装了却 import 不到"。

验证用的是哪个 pip:

```bash
python -m pip --version
# pip 23.3.1 from /path/to/.venv/lib/python3.12/site-packages/pip (python 3.12)
```

`from` 路径若是 `.venv/...`,说明装进了虚拟环境,符合预期;若是系统路径,说明可能没激活 venv,或该用 `python3 -m pip`。

**升级 pip 自身**:`pip` 也是个包,会随 Python 一起装但版本可能旧。升级它:

```bash
python -m pip install --upgrade pip
```

某些 PyPI 包要求较新 pip 才能装(报错信息会提示),所以遇到安装失败先试试升级 pip。

### 2.2 安装包:install

`pip install` 是最高频命令。基本形态:

```bash
pip install requests                  # 装最新版
pip install requests==2.31.0          # 装指定版本
pip install "requests>=2.25,<3"       # 装满足版本范围的版本
pip install requests flask            # 一次装多个
```

**版本指定语法**(PEP 440):

- `requests` :不指定,装最新。
- `requests==2.31.0` :精确版本,用双等号。
- `requests>=2.25` :不低于 2.25。
- `requests>=2.25,<3` :区间,2.25(含)到 3(不含)之间。注意逗号分隔多个约束,且引号包裹(因为 `<` 在 shell 里有特殊含义)。
- `requests~=2.31.0` :兼容版本,等价 `>=2.31.0,<2.32`(只允许最后一位变),适合库开发保证小版本兼容。
- `requests!=2.30.0` :排除某版本(如该版本有 bug)。

**为什么版本控制重要**:`requests` 从 2.x 升到 3.x 可能有不兼容改动,你的代码可能依赖旧行为。`requirements.txt` 锁定 `requests==2.31.0`,保证所有环境装同一版本,行为一致,避免"我这能跑你那报错"。

**安装中的进度与输出**:`pip install` 会输出下载进度、依赖解析过程、安装结果。看到 `Successfully installed requests-2.31.0` 即装成功。若装多个包,pip 先解析依赖树再统一安装,避免冲突。

### 2.3 安装来源

`pip install` 默认从 PyPI 装,但也支持其他来源:

**从 PyPI 装**(默认):

```bash
pip install requests
```

**从指定 URL/文件装**:

```bash
pip install ./downloads/SomePackage-1.0.tar.gz   # 本地压缩包
pip install ./mylocalpkg/                         # 本地源码目录(开发模式见 2.10)
```

**从 Git 仓库装**(适合用尚在开发、未发布 PyPI 的库):

```bash
pip install git+https://github.com/psf/requests.git            # 默认分支
pip install git+https://github.com/psf/requests.git@v2.31.0     # 指定 tag/分支/commit
pip install "git+https://github.com/psf/requests.git@main#egg=requests"
```

**从其他索引(如私有源)装**:

```bash
pip install somepackage --index-url https://private.pypi/simple
```

开发时常会遇到"这个 bug 的修复还没发版,但作者已合并到 main",这时从 git 仓库装最新代码就能用上修复。理解来源多样性,能应对各种非标准 PyPI 安装场景。

### 2.4 卸载包:uninstall

```bash
pip uninstall requests              # 卸载,会提示确认 y/n
pip uninstall requests -y           # 卸载,跳过确认
pip uninstall requests flask -y     # 一次卸载多个
```

卸载会移除该包,但**不会自动卸载它的依赖**(依赖可能被别的包共用,贸然删会破坏其他包)。所以卸载后 site-packages 里可能残留已无用的依赖,需要时手动卸或用 `pip-autoremove` 等第三方工具。

`pip uninstall` 同样应先确认当前环境:

```bash
python -m pip uninstall requests -y
```

### 2.5 升级包:install --upgrade

```bash
pip install --upgrade requests      # 升级到最新版(简写 -U)
pip install -U requests
pip install "requests>=2.31"        # 指定更高版本也会触发升级
```

`--upgrade` 让 pip 在已装版本基础上升级。注意升级可能引入不兼容改动,生产环境升级前应测试。锁定 `requirements.txt` 的项目,升级某包后要同步更新清单并测试。

**降级**:装一个比当前更低的版本即降级:

```bash
pip install "requests==2.28.0"      # 当前若是 2.31,此命令降级到 2.28
```

### 2.6 查看包:list / show / freeze

**列出已装包**:

```bash
pip list
# 输出示例:
# Package    Version
# ---------- -------
# pip        23.3.1
# requests   2.31.0
# setuptools 68.0.0

pip list --outdated                  # 列出有新版本可升级的包
pip list --uptodate                  # 列出已是最新版的包
```

`--outdated` 很实用:查看哪些包过时了,决定是否升级。

**查看某包详情**:

```bash
pip show requests
# Name: requests
# Version: 2.31.0
# Summary: Python HTTP for Humans.
# Home-page: https://requests.readthedocs.io
# Author: Kenneth Reitz
# Location: /path/to/site-packages
# Requires: charset-normalizer, idna, urllib3, certifi
# Required-by: ...
```

`Requires` 显示该包依赖哪些包,`Required-by` 显示哪些包依赖它,`Location` 显示装在哪——排查"装哪了""依赖谁"很有用。

**freeze 导出清单**:

```bash
pip freeze
# 输出(包名==版本 的列表):
# requests==2.31.0
# urllib3==2.0.4
# ...

pip freeze > requirements.txt        # 重定向到文件
```

`pip freeze` 输出精确到版本号的清单,适合固化环境。`pip list` 输出更易读(表格)但不含版本锁定语义,`freeze` 才是给 `install -r` 用的格式。

### 2.7 requirements.txt 依赖管理

`requirements.txt` 是 Python 项目记录依赖的事实标准文件。其语法与 `pip install` 的版本指定一致:

```
# 注释行
requests==2.31.0              # 精确版本
flask>=2.0                    # 最低版本
numpy>=1.21,<2.0              # 版本区间
python-dotenv                 # 不指定版本(一般不推荐,见 3.x)
-r other-requirements.txt     # 引用另一份清单
git+https://github.com/org/repo.git@v1.0  # git 来源
```

**安装清单**:

```bash
pip install -r requirements.txt
```

pip 逐行解析并安装,自动处理依赖关系与版本约束。

**开发依赖与生产依赖分离**:项目常把"运行必需"与"开发/测试必需"分开,如:

```
# requirements.txt(生产)
flask==3.0.0
requests==2.31.0

# requirements-dev.txt(开发,在里面引用生产清单)
-r requirements.txt
pytest==7.4.0
black==23.0
mypy==1.5
```

开发时 `pip install -r requirements-dev.txt`,既装生产依赖又装测试工具;部署只装 `requirements.txt`,保持环境精简。

**固定版本的意义**:`requests==2.31.0` 把版本写死,任何机器装出完全一致的环境,这是可复现(reproducible)的基础。不写版本(只写 `requests`)的话,今天装是 2.31、明天 PyPI 发了 3.0 装成 3.0,可能突然不兼容——这是"它能跑我那不能跑"的常见根源。生产项目务必锁版本。

### 2.8 镜像源配置(国内加速)

PyPI 官方源在国内访问慢甚至超时,配国内镜像能大幅提速。

**临时使用某镜像**:

```bash
pip install requests -i https://pypi.tuna.tsinghua.edu.cn/simple
```

`-i` / `--index-url` 指定索引地址。

**永久配置默认镜像**:

```bash
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
```

之后所有 `pip install` 默认走清华源。

**常用国内镜像**:

| 镜像 | 地址 |
|------|------|
| 清华大学 | https://pypi.tuna.tsinghua.edu.cn/simple |
| 阿里云 | https://mirrors.aliyun.com/pypi/simple |
| 中科大 | https://pypi.mirrors.ustc.edu.cn/simple |
| 腾讯云 | https://mirrors.cloud.tencent.com/pypi/simple |

**配置文件位置**:pip 的配置存于 `pip.ini`(Windows,在 `%APPDATA%\pip\`)或 `pip.conf`(macOS/Linux,在 `~/.config/pip/` 或 `~/.pip/`)。也可用 `pip config` 命令读写,不必手改文件。示例 `pip.conf`:

```
[global]
index-url = https://pypi.tuna.tsinghua.edu.cn/simple
trusted-host = pypi.tuna.tsinghua.edu.cn
```

`trusted-host` 在用 HTTP(非 HTTPS)镜像或证书有问题时避免 SSL 报错。

### 2.9 pip config 配置管理

`pip config` 命令管理 pip 的全局配置:

```bash
pip config list                  # 查看所有配置
pip config get global.index-url  # 查看某项
pip config set global.timeout 60 # 设置超时为 60 秒
pip config unset global.timeout  # 删除某项
pip config edit                  # 用编辑器打开配置文件
```

`--global`(全局,所有用户)、`--user`(当前用户)、`--site` / `--venv`(当前环境)三个级别,pip 按优先级合并。常用配置项:

- `global.index-url`:默认索引地址。
- `global.timeout`:下载超时秒数,网络差时调大(如 `120`)避免超时报错。
- `global.trusted-host`:信任的主机(用于非 HTTPS 源)。

把镜像和超时配好,pip 用起来才顺畅。

### 2.10 开发模式安装:editable

在开发自己的包时,希望改代码立即生效而不必反复重新安装,用可编辑模式(`-e`):

```bash
pip install -e ./mypackage        # 项目目录里有 setup.py 或 pyproject.toml
```

`-e`(editable)在 site-packages 里建一个指向源码目录的链接,而不是复制文件。之后你改源码,被安装的包立即反映改动,无需重装。这是开发库/共享模块的标准做法。

开发自己包的前提是项目里有 `setup.py` 或 `pyproject.toml` 声明包元数据(见 2.13)。在此结构下,`pip install -e .` 让本地包"可导入且实时更新"。

### 2.11 依赖解析与冲突

pip 安装时会**解析依赖**:某包声明依赖某些包的某些版本,pip 要找到一组互不冲突的版本组合。

**查看依赖树**(用 `pipdeptree` 第三方工具,先 `pip install pipdeptree`):

```bash
pipdeptree
# 输出示例:
# requests==2.31.0
#   - certifi [required: >=2017.4.17, installed: 2023.7.22]
#   - charset-normalizer [required: >=2,<4, installed: 3.2.0]
# ...

pipdeptree --reverse --packages requests   # 反向:谁依赖了 requests
```

**依赖冲突**:若包 A 要 `urllib3<2`,包 B 要 `urllib3>=2`,两者同时装会冲突。新版 pip(21+)有**依赖解析器**,会把冲突报出来(`pip install` 报 `ResolutionImpossible`),而不是装出一个坏环境。

**如何解决冲突**:

- 升级某个包到与其他包兼容的版本。
- 用主项目自己 pin 住冲突包的版本(强制 `pip install urllib3==1.26.16`),但其他包可能不兼容。
- 复杂项目考虑用 `pip-tools` 或 `poetry`/`uv` 等(见 2.14)做更精细的依赖锁定。

理解依赖解析,能在装包报错时读懂"哪个包要求哪个版本、谁和谁冲突",而非对着冗长报错束手无策。

### 2.12 常见报错处理

**报错一:Could not find a version that satisfies the requirement xxx**

包名写错,或该版本不存在,或镜像源没同步。检查包名拼写(用 `pip search` 在线或上 PyPI 网站);确认版本号真实存在;换镜像或加 `--index-url`。

**报错二:ConnectionError / SSL 证书错误**

网络问题或镜像证书。增大超时 `pip install xxx --timeout 120`;换镜像;HTTPS 证书问题加 `--trusted-host`。

**报错三:Permission denied(权限不足)**

往系统级目录装没权限。**正确做法是先激活虚拟环境**,装到 venv 不需要 sudo。若坚持系统级装,加 `--user` 装到用户目录(`pip install xxx --user`)而非系统目录;**绝不用 `sudo pip`**(会污染系统 Python,可能导致系统工具崩溃)。

**报错四:Compiling failed / 需要 build 工具**

某些包是源码发行,安装时本地编译,缺编译器或头文件。Linux 装 `python3-dev`/`build-essential`;macOS 装 Xcode Command Line Tools;或尽量装该包的预编译 wheel 版(pip 优先用 wheel,无需编译)。

**报错五:EnvironmentError / pip 版本过旧**

升级 pip:`python -m pip install --upgrade pip`,重试。

排查报错的总思路:**读最后几行错误**——pip 的报错通常会把根本原因(哪个包、什么版本约束、什么冲突)写在最后。先定位原因,再针对性处理。

### 2.13 发布自己的包到 PyPI(了解)

把自己写的库发布到 PyPI,别人就能 `pip install` 你的包。流程概览:

1. **组织项目结构**:包目录、`pyproject.toml`(声明包名、版本、依赖等元数据)。

```
mypackage/
├── pyproject.toml
├── src/
│   └── mypackage/
│       ├── __init__.py
│       └── core.py
└── README.md
```

2. **写元数据**(`pyproject.toml`,现代打包标准 PEP 621):

```toml
[build-system]
requires = ["setuptools"]
build-backend = "setuptools.backends._legacy:_Backend"

[project]
name = "mypackage"
version = "0.1.0"
dependencies = ["requests>=2.25"]
```

3. **构建发行版**:`pip install build && python -m build`,生成 `dist/` 下的 `.whl` 和 `.tar.gz`。
4. **上传到 PyPI**:`pip install twine && twine upload dist/*`,首次需在 https://pypi.org 注册账号并用 API token 认证。

发布后,全世界都能 `pip install mypackage`。这是开源协作的基础。初学了解流程即可,真要发布时再细究打包规范。

### 2.14 pip 之外的依赖管理工具

pip 是基础但较简陋,生态里有更现代的工具解决 pip 的痛点(依赖锁定、解析慢等),了解便于选型:

- **pip-tools**:`pip-compile` 把 `requirements.in` 里的顶层依赖编译成精确锁定的 `requirements.txt`(含所有子依赖及哈希),`pip-sync` 让实际环境与清单完全一致。仍是基于 pip,增强锁定能力。
- **Poetry**:一体化工具,`pyproject.toml` 管理依赖,自动生成锁定文件,自带虚拟环境管理,体验接近 npm/cargo。
- **uv**(Astral 出品,Rust 编写):极快的 pip 替代,兼容 pip 命令(`uv pip install`),依赖解析与安装速度比 pip 快十倍以上,是当前的新趋势。
- **conda**:能管非 Python 依赖(C 库等),适合数据科学,与 pip 体系并存但独立。

选型:小/中项目用 pip + venv + requirements.txt 足够;复杂依赖锁定上 poetry 或 pip-tools;追求速度用 uv。本系列以 pip 为主,它是其余工具的共同基础。

### 2.15 wheel 与 sdist

从 PyPI 装包时,实际下载的是两种发行文件之一:

- **wheel**(`.whl`):预编译的二进制包,装时无需本地编译,直接解压到 site-packages,速度快。pip 优先找 wheel。
- **sdist**(`.tar.gz`):源码包,装时需要本地编译(若有 C 扩展),慢且可能失败。

为什么有的包装得快(`numpy` 有预编译 wheel,秒装)、有的装得慢还报错(只有 sdist,本地编译):就是 wheel 与 sdist 的区别。包作者发版时最好同时上传 wheel(尤其含 C 扩展的包),使用者才能享受快速安装。

查看某包装的是哪种:

```bash
pip install numpy -v     # -v 详细输出,能看到下载的是 .whl 还是 .tar.gz
```

理解 wheel/sdist,能在"这包装不上要编译"时报错时知道原因,并寻找预编译 wheel 途径。

### 2.16 pip 在不同环境的最佳配置

把前面配置统筹起来,一个推荐的 pip 使用环境:

```bash
# 1. 进入项目,建并激活虚拟环境
python -m venv .venv
source .venv/bin/activate           # Windows: .venv\Scripts\activate

# 2. 配置 pip(国内,加速)
python -m pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
python -m pip config set global.timeout 120

# 3. 升级 pip 自身
python -m pip install --upgrade pip

# 4. 装项目依赖
python -m pip install -r requirements.txt

# 5. 开发中装新包后,同步到清单
python -m pip install newpackage
python -m pip freeze > requirements.txt
```

这套流程是 Python 工程的标准开场,与《Python 环境与基础》《PyCharm 开发环境配置》呼应,把命令行与 IDE 两侧的环境管理打通。

### 2.17 下载缓存与离线安装

pip 默认会**缓存**下载的包文件,再次安装同一版本时优先用缓存,免去重复下载,提速明显。

**查看缓存目录**:

```bash
pip cache dir              # 显示缓存目录路径
pip cache list             # 列出缓存中的包
pip cache purge            # 清空缓存(磁盘紧张时)
```

**利用缓存做"半离线"安装**:在能联网的机器装过某包后,缓存里就有该文件;后续即使断网,只要缓存还在,pip 仍能从缓存安装。这在内网受限、外网不稳定的环境很有用。

**完全离线安装**:在外网机器下载 wheel 文件,拷到内网机器本地安装:

```bash
# 外网机器:只下载不安装
pip download requests -d ./wheels/        # 下载 requests 及其依赖到 ./wheels/
pip download -r requirements.txt -d ./wheels/  # 按清单下载全部

# 内网机器:从本地文件安装,--no-index 禁止连 PyPI
pip install --no-index --find-links=./wheels/ requests
pip install --no-index --find-links=./wheels/ -r requirements.txt
```

`--find-links`(简写 `-f`)指定本地目录找包,`--no-index` 不访问任何在线索引。这套组合是内网/气隙环境部署 Python 项目的标准做法。

### 2.18 用哈希校验保证完整性

`requirements.txt` 可附带每个包的**哈希值**,确保下载的包与预期完全一致,防止包被篡改或镜像同步出错(supply-chain 安全):

```
requests==2.31.0 \
    --hash=sha256:xxxx... \
    --hash=sha256:yyyy...
```

启用哈希校验后安装:

```bash
pip install --require-hashes -r requirements.txt
```

pip 会校验每个下载文件的实际哈希与清单里的是否一致,不符就拒绝安装。生成哈希最便捷的方式是用 `pip-tools` 的 `pip-compile --generate-hashes`。

对于安全要求高的项目(金融、企业核心系统),哈希校验能把"装了被篡改的包"风险降到接近零。普通学习项目可不用,但要知道这套机制存在。

### 2.19 约束文件 constraints.txt

当项目依赖多个内部包、又想统一约束它们的共同依赖版本时,用**约束文件**(`-c`):

```
# constraints.txt
urllib3==2.0.4
numpy==1.26.0
```

```bash
pip install -c constraints.txt requests flask
```

`-c`(constraints)与 `-r`(requirements)不同:`-r` 是"必须安装这些",`-c` 是"如果要装这些包,版本必须如此约束"。约束文件不强制安装某包,只在你装到的包恰好涉及该约束时生效,适合在大型组织里统一管控通用依赖版本。

### 2.20 平台标签与 wheel 兼容

wheel 文件名含平台标签,决定它在哪些环境可装:

```
numpy-1.26.0-cp312-cp312-manylinux_2_17_x86_64.whl
#       版本    解释器  ABI        平台
```

- `cp312`:CPython 3.12 专用(不同 Python 版本的 wheel 不通用)。
- `manylinux_x86_64`:适用于 x86_64 架构的 Linux。
- 还有 `win_amd64`(Windows 64 位)、`macosx_*`(macOS)等。

**跨平台问题**:在 macOS 上 `pip freeze` 导出的包,若含只有 macOS wheel 的包,直接拿到 Linux 服务器 `pip install -r` 可能装不上(平台不匹配)。同理 Windows 导出的清单在 Linux 也有此风险。

**应对**:对跨平台项目,`requirements.txt` 只列**纯 Python 包**或确认有多平台 wheel 的包;含 C 扩展的包确认其在目标平台有预编译 wheel,否则需在目标平台本地编译。这正是 docker 化部署流行的原因之一——统一目标平台,避免 wheel 标签不匹配。

### 2.21 完整实战:从零搭建一个项目的依赖

把各节串起来,演示一个真实项目从无到有的依赖管理:

```bash
# 1. 建项目目录与虚拟环境
mkdir webdemo && cd webdemo
python -m venv .venv
source .venv/bin/activate

# 2. 配 pip 镜像与超时(国内)
python -m pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
python -m pip config set global.timeout 120

# 3. 升级 pip
python -m pip install --upgrade pip

# 4. 装核心依赖
python -m pip install "flask==3.0.0" "requests==2.31.0"

# 5. 装开发依赖
python -m pip install "pytest==7.4.0" "black==23.12.0"

# 6. 写代码(假设已写好 app.py 用 flask)

# 7. 固化生产依赖与开发依赖
#    requirements.txt(生产)
python -m pip freeze | grep -E "flask|requests" > requirements.txt
#    更规范:手写顶层依赖,避免 freeze 带入过多传递依赖
cat > requirements.txt <<EOF
flask==3.0.0
requests==2.31.0
EOF

#    requirements-dev.txt(开发,引用生产)
cat > requirements-dev.txt <<EOF
-r requirements.txt
pytest==7.4.0
black==23.12.0
EOF

# 8. 配 git 忽略
cat > .gitignore <<EOF
.venv/
__pycache__/
*.pyc
EOF

# 9. 提交(只提交源码与清单,.venv 被忽略)
git init && git add . && git commit -m "init project"

# 10. 别人/CI 复现环境
#     python -m venv .venv && source .venv/bin/activate
#     python -m pip install -r requirements-dev.txt  # 开发
#     python -m pip install -r requirements.txt       # 部署
```

第 7 步体现了最佳实践:**手写顶层依赖**(flask/requests/pytest/black)而非用 `freeze` 直接全量导出。因为 `freeze` 会把 flask 的所有传递依赖(jinja2、werkzeug 等)及精确版本一并列出,清单冗长且耦合具体环境;手写顶层依赖,让 pip 自动解析传递依赖,清单简洁、聚焦项目真正声明的内容。需要绝对精确锁定时再用 `pip-compile` 生成锁定文件。这一权衡是依赖管理的进阶认知。

### 2.22 requirements.txt 的进阶写法

除基本版本约束,`requirements.txt` 还有若干实用写法:

**环境标记**(platform/python 版本条件安装):

```
pywin32==306; sys_platform == 'win32'     # 仅 Windows 装
uvloop==0.19.0; sys_platform != 'win32'   # 仅非 Windows 装
dataclasses==0.8; python_version < '3.7'  # 仅 Python<3.7 装(兼容旧版)
```

分号 `;` 后跟条件,使同一份清单能跨平台/跨版本用,自动按环境装合适的包。这是 2.20 跨平台问题在清单层面的优雅解法。

**引用多份清单**:

```
-r requirements-base.txt
-r requirements-test.txt
```

**直接写 git/VCS 来源**(见 2.3):

```
git+https://github.com/org/repo.git@v1.2.3#egg=repo
```

**注释组织**:

```
# === Web 框架 ===
flask==3.0.0

# === 数据库 ===
sqlalchemy==2.0.0
```

用注释分组,大清单也能读得明白。`requirements.txt` 虽是纯文本,但善用这些语法能让它同时满足"人读得懂"和"机器装得上"。

---

## 3. 最佳实践

### 3.1 永远先激活虚拟环境再 pip

```bash
# 推荐
source .venv/bin/activate
pip install xxx

# 不推荐(污染全局,易冲突)
pip install xxx
```

未激活 venv 时 pip 装到全局,项目间冲突迟早发生。每开项目先激活 venv 是不可动摇的习惯。

### 3.2 用 python -m pip 而非裸 pip

```bash
python -m pip install xxx   # 确保 pip 绑定当前 python
```

多版本/多环境时裸 `pip` 指向不确定,`python -m pip` 明确绑定,避免装错环境。

### 3.3 requirements.txt 锁定精确版本

```
requests==2.31.0
urllib3==2.0.4
```

写死版本才能复现环境。只写 `requests`(不锁版本)会随 PyPI 更新而变,埋下"昨天能跑今天报错"的雷。

### 3.4 生产与开发依赖分离

```
# requirements.txt        生产
# requirements-dev.txt    开发(含 -r requirements.txt + 测试工具)
```

部署只装生产依赖,环境精简;开发多装测试/格式化工具,互不污染。

### 3.5 国内配镜像源

`pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple`,大幅加速,设一次长期生效。这是国内 Python 开发的基础配置。

### 3.6 绝不用 sudo pip

`sudo pip install` 往系统目录写,污染系统 Python,可能导致系统工具(依赖系统 Python)崩溃。要隔离就激活 venv;非要系统装用 `--user`。**永远不要 sudo pip**。

### 3.7 升级前测试,更新后同步清单

升级某包可能引入不兼容改动,生产环境升级前在测试环境验证。升级后及时 `pip freeze > requirements.txt` 同步版本,并提交,保证团队环境一致。

### 3.8 报错先看最后几行

pip 报错冗长,但根本原因(包名/版本约束/冲突)在最后。先读最后几行定位原因,再针对性处理(升级 pip、换镜像、装编译依赖、改版本约束),勿被开头一大堆下载日志吓到。

### 3.9 卸载注意残留依赖

`pip uninstall` 不删依赖。卸主包后若有大量无用依赖堆积,定期审视 `pip list`,或用 `pip-autoremove` 工具自动清理无主依赖,保持环境整洁。

### 3.10 大项目考虑现代工具

依赖复杂、需精确锁定与多平台一致性时,pip + requirements.txt 力不从心,上 `pip-tools`(锁定)或 `poetry`/`uv`(一体化)。但先用熟 pip——这些工具都建立在 pip 之上,理解 pip 后转他者更顺。

### 3.11 .venv 与 requirements.txt 不入 git,清单入 git

`.venv/` 目录大且环境相关,加进 `.gitignore`;但 `requirements.txt` 是项目复现的关键,**必须**提交。别人/CI 拉代码后 `pip install -r requirements.txt` 还原环境。这正是清单存在的意义。

### 3.12 定期升级 pip 与包

`pip install --upgrade pip` 升级 pip 自身(新解析器更准、bug 更少);`pip list --outdated` 看哪些包过时,有计划地升级。但生产环境升级要谨慎测试,不盲目追新。

---

## 4. 总结

### 4.1 本文内容回顾

- **pip 定位**:Python 官方包管理器,从 PyPI 安装/卸载/升级第三方库,管理项目依赖;Python 3.4+ 默认自带。
- **与虚拟环境关系**:激活 venv 后 pip 装到当前环境,隔离项目;`pip --version` 的 `from` 路径可确认装到哪。
- **确认正确 pip**:推荐 `python -m pip` 确保绑定当前解释器;升级 pip 自身用 `pip install --upgrade pip`。
- **install**:基本安装、版本指定语法(`==`/`>=`,`<`/`~=`/`!=`)、多包安装、版本控制的重要性。
- **安装来源**:PyPI(默认)、本地文件/目录、git 仓库、私有索引。
- **uninstall / upgrade**:`-y` 跳过确认、`-U/--upgrade` 升级、降级即装更低版本、卸载不删依赖。
- **查看命令**:`list`(含 `--outdated`/`--uptodate`)、`show`(Requires/Required-by/Location)、`freeze`(导出清单)。
- **requirements.txt**:语法、生产/开发分离、`-r` 引用、精确锁版本的意义、复现环境。
- **镜像源**:国内镜像(清华/阿里/中科大)、`-i` 临时、`pip config set` 永久、`trusted-host` 解决 SSL。
- **pip config**:`list`/`get`/`set`/`unset`/`edit`、global/user/venv 级别、常用配置项(index-url/timeout)。
- **editable 开发模式**:`pip install -e .` 实时反映源码改动,开发自己包用。
- **依赖解析**:依赖树(`pipdeptree`)、冲突识别与解决、新版解析器。
- **常见报错**:找不到版本、网络/SSL、权限、编译失败、pip 过旧的处理思路。
- **发布包**:项目结构、`pyproject.toml`、`build`、`twine upload` 流程(了解)。
- **其他工具**:pip-tools/poetry/uv/conda 的定位与选型。
- **wheel 与 sdist**:预编译 wheel 快、源码 sdist 需编译,pip 优先 wheel。
- **缓存与离线**:`pip cache` 管理、`pip download` 预下载、`--no-index --find-links` 内网离线安装。
- **哈希校验**:`--hash` 与 `--require-hashes` 保证包完整性,防供应链篡改。
- **约束文件**:`-c constraints.txt` 统一管控通用依赖版本而不强制安装。
- **平台标签**:wheel 文件名的 cp312/manylinux/win_amd64 等标签决定跨平台兼容,及跨平台清单的注意点。
- **完整实战**:从零建项目依赖的全流程,及"手写顶层依赖 vs freeze 全量导出"的权衡。
- **requirements 进阶**:环境标记(`; sys_platform==`)条件安装、引用多清单、VCS 来源、注释组织。
- **完整配置流程**:venv→配镜像→升 pip→装依赖→固化清单的标准开场。

### 4.2 读完本文你应能掌握

- 说明 pip 是什么、与 PyPI/venv 的关系,并用 `pip --version` 确认包装到哪个环境。
- 用 `python -m pip` 正确安装/卸载/升级包,并用版本指定语法(`==`/`>=`/`~=` 等)控制版本。
- 从 PyPI、本地文件、git 仓库、私有索引不同来源安装包。
- 用 `list`/`show`/`freeze` 查看已装包、依赖关系、导出环境清单。
- 编写并使用 `requirements.txt`,分离生产/开发依赖,精确锁定版本实现环境复现。
- 配置国内镜像源与 pip 全局设置(timeout/index-url),加速并解决常见网络问题。
- 用 `pip install -e .` 可编辑模式开发自己的包。
- 用 `pipdeptree` 查看依赖树,识别并解决依赖冲突。
- 排查并处理找不到版本、网络/SSL、权限、编译失败等常见报错。
- 阐述发布包到 PyPI 的流程,以及 wheel/sdist、pip-tools/poetry/uv 等的定位与选型。
- 在 venv 内按标准流程管理项目依赖,做到环境隔离、版本锁定、清单复现。

### 4.3 延伸方向

- **虚拟环境 venv**:配合 pip 的隔离基础设施(《Python 环境与基础》已述,可深入)。
- **poetry / uv**:现代化的依赖管理与打包工具,解决 pip 痛点的进阶选择。
- **pyproject.toml 与 PEP 517/621**:现代 Python 打包标准,统一的元数据与构建后端规范。
- **私有 PyPI**:企业内部搭建包仓库(devpi/nexus),管理私有库与代理公网 PyPI。
- **CI/CD 中的依赖管理**:在 GitHub Actions 等里用 pip 缓存、锁定文件保证可复现构建。
