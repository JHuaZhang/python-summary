---
group:
  title: 【01】初识python
  order: 1
order: 1
title: Python介绍及安装
nav:
  title: Python基础
  order: 1
---

# Python介绍及安装

## 1. 介绍

### 1.1 什么是 Python

Python 是一种高级、解释型、通用的编程语言，由 Guido van Rossum 于 1991 年首次发布。它的设计哲学强调代码的可读性和简洁性——同样的功能，Python 往往比 C++ 或 Java 用更少的代码行就能表达。

用一句话概括 Python 的定位：**Python 是一门"写起来快、读起来容易、什么领域都能用"的编程语言。**

**核心特点**：

| 特点 | 说明 | 对开发者的实际影响 |
|------|------|-------------------|
| 简洁易读 | 语法接近自然语言，用缩进表示代码块 | 上手快，维护成本低 |
| 解释型 | 代码由解释器逐行执行，无需预编译 | 改完即跑，调试效率高 |
| 跨平台 | Windows / macOS / Linux 均可运行 | 代码可在不同平台间移植 |
| 动态类型 | 变量类型在运行时确定 | 写代码灵活，不用先声明类型 |
| 丰富的生态 | PyPI 上有 40 多万个第三方库 | 大多数功能都有现成的库可用 |
| 开源免费 | 个人和企业都可免费使用 | 无授权成本 |

**应用领域**：Web 开发（Django、Flask、FastAPI）、数据科学（NumPy、Pandas）、人工智能（PyTorch、TensorFlow）、自动化运维（Ansible）、网络爬虫（Scrapy）、桌面应用（PyQt）等。

### 1.2 Python 解释器

Python 代码需要通过**解释器**来执行。解释器是负责将 Python 源代码转换为机器可执行指令的程序。

主流的 Python 解释器有几种实现：

| 解释器 | 特点 | 适用场景 |
|--------|------|---------|
| **CPython** | 官方标准实现，用 C 语言编写，最广泛使用 | 日常学习和开发，默认选择 |
| PyPy | 集成 JIT 编译器，运行速度比 CPython 快 5-10 倍 | 高性能 Web 服务 |
| Jython | 运行在 JVM 上，可调用 Java 类库 | Java 环境中用 Python |
| MicroPython | 面向嵌入式设备，内存占用极小 | 物联网（IoT）项目 |

日常学习与开发默认选择 **CPython**——从 python.org 下载的就是 CPython。下文所有内容默认指 CPython。

### 1.3 Python 版本选择

Python 目前有 Python 2 和 Python 3 两个主要分支。**2020 年 1 月 1 日，Python 官方正式停止对 Python 2 的支持**，Python 2 不再接收安全更新。

对于新学习者：**毫无疑问，直接学习 Python 3。** 所有新项目都应使用 Python 3。遇到老项目中的 Python 2 代码时，只需了解主要差异即可：

| 特性 | Python 2 | Python 3 |
|------|----------|----------|
| print | `print "hello"` | `print("hello")` |
| 整数除法 | `5/2 = 2` | `5/2 = 2.5` |
| 默认字符编码 | ASCII | UTF-8 |
| 输入函数 | `raw_input()` | `input()` |

Python 3 自 2008 年发布以来经历了多次版本迭代，截至本文写作时最新稳定版为 Python 3.12。建议安装 Python 3.10 或更高版本，以获得更好的性能和新语法支持。

### 1.4 为什么需要单独安装 Python

虽然 macOS 和大多数 Linux 发行版自带 Python，但系统自带的版本通常有两个问题：

1. **版本较旧**：如 macOS Monterey 自带 Python 3.9，无法享受新版本的语法和性能改进。
2. **为系统工具服务**：系统自带的 Python 是给操作系统自身的工具用的，直接往里装包可能破坏系统依赖。

因此，**不建议直接使用系统自带的 Python 做开发**，应该自行安装一个独立管理的版本。本文将详尽讲解在 Windows、macOS、Linux 上安装 Python 的方法，以及用 pyenv 统一管理 Python 版本、用 venv 隔离项目环境、用 pip 安装第三方包的完整流程。

---

## 2. 安装与配置

### 2.1 Windows 系统安装

**下载 Python**：

1. 访问 Python 官方网站：https://www.python.org/downloads/
2. 页面会自动检测你的操作系统，点击 "Download Python 3.x.x" 按钮。
3. 下载 Windows 安装程序（建议下载 64 位版本，除非系统是 32 位）。
4. 文件名类似：`python-3.12.0-amd64.exe`。

**安装步骤**：

1. **运行安装程序**：双击下载的 `.exe` 文件。

**最重要的一步**：在安装界面底部，**务必勾选** `Add Python 3.x to PATH`（将 Python 添加到系统环境变量，这样可以在命令行直接使用 `python` 命令）。如果不勾选，安装完成后命令行会提示 `'python' 不是内部或外部命令`。

可选勾选 `Install for all users`（为所有用户安装，需要管理员权限）。

2. **选择安装方式**：
   - `Install Now`（推荐，使用默认设置，适合初学者）
   - `Customize installation`（自定义安装路径和组件）

3. **等待安装完成**：安装程序会自动安装 Python，完成后显示 "Setup was successful"。

**验证安装**：

按 `Win + R`，输入 `cmd`，打开命令提示符，输入以下命令：

```bash
python --version
```

预期输出：

```text
Python 3.12.0
```

再验证 pip（Python 的包管理器）是否可用：

```bash
pip --version
```

预期输出类似：

```text
pip 24.0 from C:\Users\用户名\AppData\Local\Programs\Python\Python312\Lib\site-packages\pip (python 3.12)
```

**测试交互环境**：在命令提示符中输入 `python` 进入交互式环境（REPL）：

```python
>>> print("Hello, Python!")
Hello, Python!
>>> 1 + 2
3
>>> exit()
```

按 `Ctrl + Z` 然后回车也可以退出交互环境。

### 2.2 macOS 系统安装

macOS 上安装 Python 有三种主流方式，推荐程度从高到低：

| 方式 | 适合谁 | 优点 | 缺点 |
|------|--------|------|------|
| **pyenv**（强烈推荐） | 所有开发者 | 多版本自由切换，不污染系统，项目级版本控制 | 需要配置环境变量 |
| Homebrew | 只需一个 Python 版本 | 一条命令搞定，自动管理更新 | 多版本切换不方便 |
| 官方安装包 | 完全初学者 | 图形化操作，最简单 | 不利于后续多版本管理 |

**方法一：pyenv 安装（强烈推荐）**

pyenv 是 Python 版本管理工具，允许你在同一台机器上安装多个 Python 版本，并随时切换。无论你是初学者还是有经验的开发者，pyenv 都能帮你避免"系统自带 Python 版本太旧""多个项目需要不同 Python 版本"等常见痛点。

完整的 pyenv 使用方法见 2.4 节，这里给出最简安装流程：

**1. 安装 pyenv**

通过 Homebrew 安装（需要先装 Homebrew，见方法二中的 Homebrew 安装步骤）：

```bash
brew install pyenv
```

**2. 配置 Shell 环境变量**

macOS 默认 Shell 是 zsh，编辑 `~/.zshrc`，在文件末尾添加以下三行：

```bash
export PYENV_ROOT="$HOME/.pyenv"
[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"
```

如果你的 Shell 是 bash，则编辑 `~/.bash_profile`，内容相同。

**3. 使配置生效**

```bash
source ~/.zshrc
```

**4. 验证 pyenv 安装**

```bash
pyenv --version
```

预期输出：

```text
pyenv 2.x.x
```

**5. 安装目标 Python 版本**

```bash
# 查看可安装的版本
pyenv install --list | grep 3.12

# 安装 Python 3.12
pyenv install 3.12.0

# 设为全局默认版本
pyenv global 3.12.0

# 验证
python --version
```

预期输出：

```text
Python 3.12.0
```

配置完成后，`python` 命令就指向 pyenv 管理的 3.12.0，而不再是系统自带的旧版本。更详细的多版本管理、项目级切换等用法见 2.4 节。

**方法二：Homebrew 安装**

Homebrew 是 macOS 上的包管理器，适合只需要一个 Python 版本、不想折腾多版本管理的用户。

**1. 安装 Homebrew**（如果还没有）：

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

国内网络访问 GitHub 可能较慢或被墙，可使用中科大源安装，安装后按提示配置：`https://unicom.mirrors.ustc.edu.cn/help/brew.git.html`。

**2. 安装 Python**：

```bash
brew install python
```

Homebrew 会自动安装最新版 Python 3，并配置好 PATH。

**3. 验证安装**：

```bash
python3 --version
pip3 --version
```

**4. 配置命令别名**（可选，想直接用 `python` 命令而不是 `python3` 的话）：在 `~/.zshrc` 中添加：

```bash
alias python='python3'
alias pip='pip3'
```

然后运行 `source ~/.zshrc` 使配置生效。

**方法三：官方安装包**

适合完全不熟悉命令行、只想用图形化方式安装的用户。

1. 访问 https://www.python.org/downloads/macos/，下载最新的 macOS 安装包（`.pkg` 文件）。
2. 双击 `.pkg` 文件，按安装向导完成安装，安装程序会自动配置 PATH。
3. 验证安装：

```bash
python3 --version
pip3 --version
```

这种方式安装的 Python 不方便做多版本管理，后续如果需要多版本，建议迁移到 pyenv。

### 2.3 Linux 系统安装

**Ubuntu / Debian**：

```bash
# 更新包列表
sudo apt update

# 安装 Python 3 和 pip
sudo apt install python3 python3-pip -y

# 安装开发工具（编译 Python 扩展需要）
sudo apt install python3-dev python3-venv -y

# 验证安装
python3 --version
pip3 --version
```

**CentOS / RHEL**：

```bash
sudo yum install python3 python3-pip -y

python3 --version
pip3 --version
```

**Fedora**：

```bash
sudo dnf install python3 python3-pip -y

python3 --version
pip3 --version
```

**从源码编译安装**（用于安装特定版本，如系统仓库里没有 Python 3.12）：

```bash
# 安装编译依赖
sudo apt update
sudo apt install -y build-essential zlib1g-dev libncurses5-dev libgdbm-dev \
    libnss3-dev libssl-dev libreadline-dev libffi-dev libsqlite3-dev wget \
    libbz2-dev

# 下载 Python 源码
cd /tmp
wget https://www.python.org/ftp/python/3.12.0/Python-3.12.0.tgz
tar -xf Python-3.12.0.tgz
cd Python-3.12.0

# 配置、编译、安装
./configure --enable-optimizations
make -j $(nproc)
sudo make altinstall

# 验证安装
python3.12 --version
```

用 `altinstall` 而不是 `install`，是为了避免覆盖系统自带的 Python。

**重要提示**：Linux 系统通常自带 Python，且系统工具依赖 Python，因此**不要卸载系统自带的 Python**，否则可能导致系统问题。使用 `python3` 命令运行 Python 3（`python` 通常指向旧版）。

### 2.4 pyenv：统一管理 Python 版本

**什么是 pyenv**

pyenv 是一个 Python 版本管理工具，让你在同一台机器上安装和管理多个 Python 版本，并能在全局、项目级甚至 Shell 级别灵活切换。它通过在 PATH 前面插入 "shims"（拦截层）来实现版本切换——当你运行 `python` 时，pyenv 的 shim 会根据当前目录的 `.python-version` 文件或全局设置，决定实际调用哪个版本的 Python。

**pyenv 的核心概念**：

| 概念 | 说明 | 设置方式 |
|------|------|---------|
| **shims（拦截层）** | pyenv 在 PATH 前插入的代理，拦截 `python` 等命令，决定实际调用哪个版本 | `eval "$(pyenv init -)"` 自动创建 |
| **global（全局版本）** | 全局默认使用的 Python 版本，当没有 local/shell 版本时生效 | `pyenv global 3.12.0` |
| **local（项目级版本）** | 在当前目录下设置的 Python 版本，写入 `.python-version` 文件 | `pyenv local 3.11.5` |
| **shell（会话级版本）** | 仅在当前 Shell 会话有效的版本，优先级最高 | `pyenv shell 3.10.0` |

**版本优先级**：shell > local > global。即如果当前 Shell 设了 shell 版本就用 shell 版本；没设但当前目录有 `.python-version` 文件就用 local 版本；都没有就用 global 版本。

用一张图说明版本选择流程：

```text
运行 python 命令
       ↓
  pyenv shim 拦截
       ↓
  检查 shell 版本 ——有——→ 使用 shell 版本
       ↓ 无
  检查 local 版本 ——有——→ 使用 local 版本
       ↓ 无
  使用 global 版本
```

**安装 pyenv**

如果已经在 2.2 节安装了 pyenv，跳过此步。否则通过 Homebrew 安装：

```bash
brew install pyenv
pyenv --version
```

**配置 Shell 环境变量（关键步骤）**

pyenv 安装后需要配置 Shell 才能生效。macOS 默认 Shell 是 zsh：

```bash
# 编辑 ~/.zshrc，在文件末尾添加以下三行
export PYENV_ROOT="$HOME/.pyenv"
[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"
```

这段配置做了什么：

- 第 1 行：设置 pyenv 的根目录，所有 pyenv 管理的 Python 版本都装在 `~/.pyenv/versions/` 下。
- 第 2 行：把 pyenv 的可执行文件目录加到 PATH 前面。
- 第 3 行：`pyenv init -` 输出一段 Shell 脚本，会在 PATH 最前面插入 shims 目录（`~/.pyenv/shims`），这样 `python`/`pip` 等命令会先走 pyenv 的 shim，再由 shim 决定调用哪个版本。

配置后让设置生效：

```bash
source ~/.zshrc
```

验证配置是否生效：

```bash
# 查看 PATH 中是否包含 .pyenv/shims
echo $PATH | tr ':' '\n' | grep pyenv
```

预期输出类似：

```text
/Users/mac/.pyenv/shims
```

**安装 Python 版本**

```bash
# 查看所有可安装的版本（列表很长，可用 grep 过滤）
pyenv install --list | grep 3.12

# 安装 Python 3.12.0
pyenv install 3.12.0

# 查看已安装的版本
pyenv versions
```

预期输出：

```text
  system
* 3.12.0 (set by /Users/mac/.pyenv/version)
```

`*` 表示当前活跃的版本。

安装速度慢时，可以设置国内镜像加速：

```bash
export PYTHON_BUILD_MIRROR_URL=https://mirrors.huaweicloud.com/python
pyenv install 3.12.0
```

**设置全局默认版本**

```bash
pyenv global 3.12.0

# 验证当前使用的 Python 版本
python --version
```

预期输出：

```text
Python 3.12.0
```

验证 python 命令指向的路径：

```bash
which python
```

预期输出：

```text
/Users/mac/.pyenv/shims/python
```

注意：不再是 `/usr/bin/python` 或 `/usr/local/bin/python3`，而是 pyenv 的 shim 路径。

**项目级版本切换**

当不同项目需要不同 Python 版本时，用 `pyenv local` 设置项目级版本：

```bash
# 进入项目目录
cd myproject

# 设置该项目使用 Python 3.11.5
pyenv local 3.11.5
# 这会在当前目录创建一个 .python-version 文件，内容为 3.11.5

# 验证：在该目录下 python 版本已切换
python --version
```

预期输出：

```text
Python 3.11.5
```

退出该目录后，版本恢复为 global 版本：

```bash
cd ..
python --version
```

预期输出：

```text
Python 3.12.0
```

`.python-version` 文件可以提交到 git，这样团队成员 clone 后 pyenv 会自动使用对应版本（前提是已安装该版本）。

**会话级版本切换**

临时在当前终端切换版本，不影响其他终端：

```bash
pyenv shell 3.10.0
python --version
# 输出: Python 3.10.0
# 关闭终端后失效
```

### 2.5 环境变量配置

**PATH 环境变量**

PATH 环境变量告诉操作系统在哪些目录中查找可执行文件。Python 安装后，需要将其添加到 PATH 中才能在命令行直接使用 `python` 和 `pip` 命令。

**Windows 系统**：安装时若勾选 "Add Python to PATH" 会自动配置。忘记勾选则手动添加：

1. 找到 Python 安装路径（默认 `C:\Users\你的用户名\AppData\Local\Programs\Python\Python312`）和 Scripts 路径（`...\Python312\Scripts`）。
2. 右键"此电脑" → 属性 → 高级系统设置 → 环境变量。
3. 在"用户变量"或"系统变量"中找到 "Path" → "编辑" → "新建"，添加上述两个路径。
4. 确定保存，重开命令提示符验证 `python --version`。

**macOS / Linux 系统**：Python 安装后通常会自动配置 PATH。需要手动配置时，先用 `which python3` 确定安装路径（通常 `/usr/local/bin/python3` 或 `/usr/bin/python3`），再编辑配置文件（macOS 默认 zsh 用 `~/.zshrc`，bash 用 `~/.bash_profile`）：

```bash
export PATH="/usr/local/bin:$PATH"
export PATH="/Library/Frameworks/Python.framework/Versions/3.12/bin:$PATH"
```

使配置生效：

```bash
source ~/.zshrc
```

**`python` vs `python3` 的区别**

在 macOS 和 Linux 上，`python` 可能指向系统自带的旧版 Python，`python3` 才是 Python 3。务必确认你用的命令对应 3.x 版本，建议统一用 `python3`/`pip3`，或在 shell 配置里设别名。Windows 上一般 `python` 直接就是 Python 3。

如果用了 pyenv，`python` 和 `python3` 都会指向 pyenv 管理的版本，无需区分。

### 2.6 安装常见问题排查表

| 问题 | 可能原因 | 解决方案 |
|------|---------|---------|
| Windows: `'python' 不是内部或外部命令` | 安装时未勾选 "Add Python to PATH" | 重新安装勾选，或手动添加 Python 安装路径和 Scripts 路径到系统 PATH |
| Windows: 安装权限不足 | 需要管理员权限 | 右键安装程序，选择"以管理员身份运行" |
| Windows: 多个 Python 版本冲突 | 系统装了多个 Python，PATH 指向不确定 | 用 `py -3.12` 指定特定版本，或使用虚拟环境隔离 |
| macOS: `python --version` 仍显示系统旧版本 | pyenv 配置未生效或 PATH 顺序不对 | 确认 `eval "$(pyenv init -)"` 在 `~/.zshrc` 末尾，运行 `source ~/.zshrc`，检查 `which python` 是否指向 `~/.pyenv/shims/python` |
| macOS: `pyenv: command not found` | pyenv 未安装或 PATH 未配置 | 确认 `brew install pyenv` 已执行，且 `~/.zshrc` 中有 `export PATH="$PYENV_ROOT/bin:$PATH"` |
| macOS/Linux: `pyenv install` 报编译错误 | 缺少编译依赖 | macOS 上执行 `brew install openssl readline sqlite3 xz zlib tcl-tk` 后重试 |
| macOS/Linux: `pyenv install` 速度慢 | 从源码编译 + 网络下载慢 | 设置镜像 `export PYTHON_BUILD_MIRROR_URL=https://mirrors.huaweicloud.com/python`，或用 `brew install python@3.12` |
| Linux: 不要卸载系统 Python | 系统工具依赖 Python | 保留系统 Python，用 pyenv 或 altinstall 安装独立版本 |
| 所有平台: `pip` 装的包找不到 | pip 指向了别的解释器 | 用 `python -m pip install xxx` 代替裸 `pip install`，确保装进当前解释器 |

### 2.7 第一个程序：Hello World

安装好 Python 后，写第一个程序。最直接的方式是用交互式解释器：

```bash
python
```

进入交互式环境后（`>>>` 提示符），输入：

```python
>>> print("Hello, World!")
Hello, World!
```

更规范的方式是写进文件。新建 `hello.py`，内容为一行：

```python
print("Hello, World!")
```

然后在终端运行该文件：

```bash
python hello.py
```

输出：

```text
Hello, World!
```

这行 `print("Hello, World!")` 调用内置函数 `print`，把字符串 `Hello, World!` 输出到屏幕。注意三点：

1. 必须用**英文引号**（`"` 或 `'`）包裹文本，中文引号会报语法错误。
2. 必须加**括号**（Python 3 里 `print` 是函数，`print "Hello"` 是 Python 2 写法会报 `SyntaxError`）。
3. 行尾**不需要分号**（加了不报错，但不符合 Python 风格）。

---

## 3. 核心命令与工具

### 3.1 pip 包管理器

`pip` 是 Python 的包管理器，从 PyPI（Python Package Index）安装第三方包。

**常用命令**：

| 命令 | 作用 | 示例 |
|------|------|------|
| `pip install <包名>` | 安装最新版 | `pip install requests` |
| `pip install <包名>==<版本>` | 安装指定版本 | `pip install requests==2.31.0` |
| `pip install "<包名>>=<版本>"` | 安装不低于某版本 | `pip install "requests>=2.25"` |
| `pip install -r requirements.txt` | 按依赖清单批量安装 | `pip install -r requirements.txt` |
| `pip uninstall <包名>` | 卸载包 | `pip uninstall requests` |
| `pip list` | 列出已装包 | `pip list` |
| `pip show <包名>` | 查看某包详情（版本/位置/依赖） | `pip show requests` |
| `pip freeze > requirements.txt` | 导出当前环境依赖清单 | `pip freeze > requirements.txt` |
| `pip install --upgrade <包名>` | 升级到最新版 | `pip install --upgrade requests` |

**requirements.txt**

把依赖写进这个文件，别人 `pip install -r requirements.txt` 就能复现环境，是 Python 项目的标准做法。典型内容：

```text
requests==2.31.0
numpy>=1.21
pandas
```

**国内换源加速**

PyPI 官方源在国内访问慢，可换成国内镜像：

```bash
# 临时使用某镜像安装
pip install requests -i https://pypi.tuna.tsinghua.edu.cn/simple

# 永久配置默认镜像
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
```

常用国内镜像：

| 镜像 | URL |
|------|-----|
| 清华 | `https://pypi.tuna.tsinghua.edu.cn/simple` |
| 阿里 | `https://mirrors.aliyun.com/pypi/simple` |
| 中科大 | `https://pypi.mirrors.ustc.edu.cn/simple` |

**强烈建议在虚拟环境里用 pip**（见 3.2 节），避免污染系统 Python。多环境时用 `python -m pip` 而非裸 `pip`，确保装进当前解释器的环境。

**推荐 vs 不推荐写法**：

```bash
# 不推荐：可能装到别的解释器环境
pip install requests

# 推荐：明确绑定当前 python 的环境
python -m pip install requests
```

### 3.2 venv 虚拟环境

真实开发中，不同项目依赖不同版本的第三方包（项目 A 要 Django 3，项目 B 要 Django 4），全装在系统全局会冲突。`venv` 是 Python 标准库提供的虚拟环境工具，为每个项目建一个独立的包安装目录，隔离互不影响。

**创建并激活虚拟环境**：

```bash
# 在项目目录下创建名为 .venv 的虚拟环境
python -m venv .venv

# 激活（macOS/Linux）
source .venv/bin/activate

# 激活（Windows 命令提示符）
.venv\Scripts\activate.bat

# 激活（Windows PowerShell）
.venv\Scripts\Activate.ps1
```

激活后，命令行提示符前会出现 `(.venv)`，表示当前在虚拟环境中。此时 `pip install` 装的包只进 `.venv`，不影响系统：

```bash
(.venv) $ pip install requests
```

退出虚拟环境：

```bash
deactivate
```

**PowerShell 执行策略问题**：Windows PowerShell 首次激活可能报"无法加载文件，因为在此系统上禁止运行脚本"。解决：以管理员身份打开 PowerShell，执行：

```bash
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

之后即可激活。

**`.venv` 不要提交到 git**：虚拟环境目录体积大且与机器相关，应加进 `.gitignore`，只提交依赖清单 `requirements.txt`（`pip freeze > requirements.txt`），别人拿到项目后 `pip install -r requirements.txt` 复现环境。

### 3.3 pyenv 常用命令速查表

| 命令 | 作用 | 示例 |
|------|------|------|
| `pyenv install --list` | 列出所有可安装版本 | `pyenv install --list \| grep 3.12` |
| `pyenv install <ver>` | 安装指定版本 | `pyenv install 3.12.0` |
| `pyenv uninstall <ver>` | 卸载指定版本 | `pyenv uninstall 3.10.0` |
| `pyenv versions` | 列出已安装版本（`*` 标记当前版本） | `pyenv versions` |
| `pyenv version` | 显示当前版本 | `pyenv version` |
| `pyenv global <ver>` | 设置全局版本 | `pyenv global 3.12.0` |
| `pyenv local <ver>` | 设置项目级版本（写入 `.python-version`） | `pyenv local 3.11.5` |
| `pyenv shell <ver>` | 设置会话级版本 | `pyenv shell 3.10.0` |
| `pyenv which python` | 显示当前 python 实际指向的路径 | `pyenv which python` |
| `pyenv rehash` | 刷新 shims（安装新包后执行） | `pyenv rehash` |

### 3.4 三种运行方式

Python 解释器有三种常见运行方式：

**1. 交互式模式（REPL）**

终端输入 `python`（无参数）进入，出现 `>>>` 提示符，逐行输入立即执行并看到结果，适合快速试验、查 API、当计算器用：

```bash
$ python
>>> 2 + 3
5
>>> "a" * 3
'aaa'
>>> import math
>>> math.sqrt(16)
4.0
>>> exit()
```

**2. 脚本模式**

把代码写进 `.py` 文件，用 `python 文件名` 运行整份代码，适合写完整程序。这是最常用的方式：

```bash
$ python myscript.py
```

**3. 模块方式 `-m`**

用 `python -m 模块名` 把模块当脚本运行，常用于运行标准库工具：

```bash
python -m venv .venv          # 运行 venv 模块创建虚拟环境
python -m http.server 8000    # 启动一个简易 HTTP 服务器
python -m json.tool data.json # 格式化 JSON 文件
python -m pip install xxx     # 用 -m 调 pip，确保用的是当前解释器的 pip
```

`-m` 的好处是"用当前这个 python 对应的模块"，避免 `pip` 命令指向别的解释器装错地方。

### 3.5 查看环境信息

开发中常需确认环境信息，几个实用命令：

```bash
python --version              # Python 版本
python -c "import sys; print(sys.executable)"   # 当前解释器路径
python -c "import sys; print(sys.path)"         # 模块搜索路径
pip list                      # 已装包列表
pip show requests             # 某包版本/位置/依赖
```

`python -c "代码"` 用 `-c` 直接运行一行代码，适合快速查信息而不建文件。`sys.executable` 显示当前 python 的真实路径，多环境排错时极有用——能确认 `pip` 装的包是不是进对了解释器。

在脚本里查版本和平台信息：

```python
import sys, platform

print(sys.version)            # 完整版本信息字符串
print(sys.version_info)       # 结构化版本
print(sys.platform)           # 平台，如 'win32'/'darwin'/'linux'
print(platform.system())      # 'Windows'/'Darwin'/'Linux'
print(platform.python_version())
```

输出示例（macOS）：

```text
3.12.0 (main, Oct  2 2023, 12:00:00) [Clang 15.0.0]
sys.version_info(major=3, minor=12, micro=0, releaselevel='final', serial=0)
darwin
Darwin
3.12.0
```

### 3.6 conda / Anaconda（数据科学方向）

`conda` 是另一个流行的包与环境管理器，常以 Anaconda（完整发行版，含大量数据科学包）或 Miniconda（仅含 conda 与 Python，精简版）形式安装。与 pip/venv 的区别：

| 维度 | pip + venv | conda |
|------|-----------|-------|
| 管理范围 | 只管 Python 包 | 能管 Python 包 + 非 Python 依赖（C 库、CUDA 等） |
| 环境管理 | venv 独立工具 | conda 自带环境管理 |
| 适合场景 | 通用 Web/脚本开发 | 数据科学、机器学习 |

常用命令：

```bash
conda create -n myenv python=3.12     # 创建环境
conda activate myenv                  # 激活
conda install numpy pandas            # 装包
conda env list                        # 列出所有环境
conda deactivate                      # 退出环境
```

**选 conda 还是 pip/venv**：做数据科学、机器学习，且常装带编译依赖的包，用 conda（或直接装 Miniconda）省心；做通用 Web/脚本开发，pip + venv 更轻量标准。两者不要混用（同一环境里既 conda install 又 pip install 容易冲突），选定一套坚持用。

---

## 4. 实战工作流与 FAQ

### 4.1 从零搭建项目环境

把前面各节串起来，演示一个新项目从零搭环境到跑起来的完整流程（以 macOS + pyenv 为例）：

**步骤 1：确认 pyenv 已装且已配置**

```bash
pyenv --version
# 输出: pyenv 2.x.x
```

**步骤 2：安装项目所需的 Python 版本并设为项目级**

```bash
pyenv install 3.12.0                 # 如果还没装过
cd myproject                         # 进入项目目录
pyenv local 3.12.0                   # 设项目级版本，生成 .python-version
python --version                     # 确认: Python 3.12.0
```

**步骤 3：创建虚拟环境**

```bash
python -m venv .venv
```

**步骤 4：激活虚拟环境**

```bash
source .venv/bin/activate           # macOS/Linux
# .venv\Scripts\activate            # Windows
# 提示符变为 (.venv)
```

**步骤 5：配置 pip 镜像加速（国内）**

```bash
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
```

**步骤 6：安装项目依赖**

```bash
python -m pip install requests
```

**步骤 7：把依赖固化到 requirements.txt**

```bash
python -m pip freeze > requirements.txt
```

**步骤 8：写第一个脚本并运行**

```python
# hello.py
print("环境就绪")
```

```bash
python hello.py
# 输出: 环境就绪
```

**步骤 9：配置 git 忽略虚拟环境**

在 `.gitignore` 中添加：

```text
.venv/
```

提交 `.python-version` 和 `requirements.txt`，不提交 `.venv`。

**步骤 10：别人拿到项目后复现环境**

```bash
pyenv install $(cat .python-version)  # 自动安装 .python-version 指定的版本
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python hello.py
```

这套流程是 Python 工程的标准开场：用 pyenv 定版本 → 建虚拟环境 → 激活 → 配镜像 → 装依赖 → 固化清单 → 写代码 → 提交（不含环境，含版本文件）。掌握它，后续任何 Python 项目都能照此起步。

整个流程可以用一张图概括：

```text
pyenv install <ver>     定版本
       ↓
pyenv local <ver>       项目级绑定
       ↓
python -m venv .venv    建虚拟环境
       ↓
source .venv/bin/activate    激活
       ↓
pip config set ...     配镜像
       ↓
python -m pip install  装依赖
       ↓
pip freeze > requirements.txt  固化清单
       ↓
python hello.py        写代码 & 运行
       ↓
git: 提交版本文件+清单, 忽略 .venv
```

### 4.2 最佳实践

**每个项目先建虚拟环境**

```bash
python -m venv .venv
source .venv/bin/activate      # 或 Windows 的 Activate.ps1
pip install -r requirements.txt
```

全装在系统全局迟早冲突，venv 隔离是 Python 工程的基础卫生习惯。

**用 `python -m pip` 而非裸 `pip`**

多版本/多环境时，裸 `pip` 指向不确定，`python -m pip` 明确绑定当前 `python`。

**确认 python 命令指向 3.x**

macOS/Linux 上 `python` 可能指向旧版，务必用 `python3`、设别名或用 pyenv 接管，并在安装后用 `python --version` 确认是 3.x。

**用 pyenv 统一管理 Python 版本**

macOS 上不要直接使用系统自带的 Python 做开发（版本旧且为系统工具服务）。推荐用 pyenv 安装和管理 Python 版本，通过 `pyenv global` 设全局版本、`pyenv local` 设项目级版本。`.python-version` 文件可提交到 git，实现团队版本统一。

**统一用 4 空格缩进，禁混 Tab**

PEP 8 规定 4 空格缩进，且不要混用 Tab 和空格。建议编辑器设置"Tab 键插入 4 空格"，从源头避免 `TabError`。

**源文件统一 UTF-8**

源码默认 UTF-8，源文件里可直接写中文。读写文件、网络文本一律 `encoding="utf-8"`，不要依赖系统默认编码（Windows 默认 GBK，macOS/Linux 默认 UTF-8），避免跨平台乱码。

**读异常从最后一行起**

```text
Traceback (most recent call last):
  File "demo.py", line 3, in <module>
    n = int("abc")
ValueError: invalid literal for int() with base 10: 'abc'
```

异常栈从上往下是调用顺序，**最后一行是错误本质**（`ValueError...`），倒数几行是出错位置。先读最后一行判断类型，再往上找位置。

**入门阶段先跑通再优化**

正确顺序：先用最直白的方式让程序跑起来（哪怕代码丑），再逐步重构优化。能运行的烂代码胜过写不出的完美设计。

**国内开发配上镜像源**

装包慢时第一时间配国内 PyPI 镜像，Homebrew 也配中科大源，可避免大量等待时间。

### 4.3 编辑器与 IDE 选择

写 Python 不必只用记事本，选个趁手的编辑器/IDE 能事半功倍：

| 工具 | 特点 | 适合谁 |
|------|------|--------|
| **VS Code** | 免费、轻量、插件生态强，装 Python 扩展后支持智能提示、调试、虚拟环境识别 | 新手推荐，目前最流行的通用选择 |
| **PyCharm** | JetBrains 出品的专业 Python IDE，社区版免费，开箱即用的项目管理、调试、重构能力强 | 大型项目开发者 |
| **Jupyter Notebook** | 以"单元格"形式交替写代码与文档，能即时看到每步输出和图表 | 数据科学探索 |
| **IDLE** | Python 自带的简易 IDE，装完 Python 就有，功能基础 | 最初期练手 |

新手起步建议 **VS Code + Python 扩展**，并在设置里指定虚拟环境的解释器，这样编辑器的智能提示与终端用的解释器一致。

### 4.4 FAQ

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| 安装后 `python` 命令找不到 | PATH 未配置 | Windows: 重新安装勾选 "Add Python to PATH"；macOS/Linux: 检查 `~/.zshrc` 或 `~/.bash_profile` 中的 PATH 配置 |
| `pip install` 很慢 | 使用的是 PyPI 官方源，国内访问慢 | 换国内镜像：`pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple` |
| `pip install` 装的包找不到 | pip 指向了别的解释器 | 用 `python -m pip install xxx` 代替裸 `pip install` |
| 不同项目包版本冲突 | 全装在系统全局环境 | 每个项目用 `python -m venv .venv` 创建虚拟环境 |
| pyenv 安装 Python 很慢 | 从源码编译 + 网络下载慢 | 设置镜像 `export PYTHON_BUILD_MIRROR_URL=https://mirrors.huaweicloud.com/python`，或用 `brew install python@3.12` |
| pyenv `global` 后 `python --version` 没变 | 配置未生效 | 运行 `source ~/.zshrc`，检查 `which python` 是否指向 `~/.pyenv/shims/python` |
| Windows PowerShell 激活 venv 报错 | 执行策略限制 | 以管理员身份执行 `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| `pyenv install` 报编译错误 | 缺少编译依赖 | macOS 执行 `brew install openssl readline sqlite3 xz zlib tcl-tk` 后重试 |
| `python` 和 `python3` 命令指向不同版本 | macOS/Linux 系统自带旧版 Python | 用 pyenv 接管后两者统一；或统一用 `python3`/`pip3` |
| conda 和 pip 混用导致冲突 | 两个包管理器互相覆盖 | 同一环境只用一套，选定 conda 或 pip+venv |
| shebang 脚本无法直接执行 | 未赋予执行权限 | `chmod +x script.py` 后再 `./script.py`（仅 macOS/Linux） |

---

## 5. 总结

本文围绕 Python 介绍及安装展开，主要介绍了以下内容：

- **Python 定位**：高级、解释型、通用编程语言，强调可读性与简洁；Python 2 已停止支持，全部使用 Python 3；学习默认使用 CPython 解释器。
- **Windows 安装**：官网下载安装包，务必勾选 "Add Python to PATH"，用 `python --version` 验证安装。
- **macOS 安装**：推荐 pyenv（多版本管理）、Homebrew（一条命令）、官方安装包（图形化）三种方式；macOS 不建议直接用系统自带 Python 做开发。
- **Linux 安装**：apt/yum/dnf 包管理器安装，以及从源码编译安装特定版本；不要卸载系统 Python。
- **pyenv 版本管理**：通过 shims 拦截 `python`/`pip` 命令，支持 global（全局）、local（项目级）、shell（会话级）三种版本切换；`.python-version` 文件可提交 git 实现团队版本统一。
- **环境变量配置**：Windows 与 macOS/Linux 的 PATH 配置方法，`python` vs `python3` 的区别。
- **pip 包管理**：安装/卸载/清单 `requirements.txt`，建议 venv 内用 `python -m pip`，国内换源加速。
- **venv 虚拟环境**：`python -m venv` 创建隔离环境，避免包冲突，每个项目必备；`.venv` 不入 git。
- **三种运行方式**：REPL（交互试语句）、脚本（运行整份代码）、`-m`（运行模块/标准库工具）。
- **查看环境信息**：`sys`/`platform` 查版本与平台，`sys.executable` 排查多环境下的解释器归属问题。
- **conda/Anaconda**：数据科学方向的包与环境管理器，与 pip/venv 的取舍选择。
- **项目环境搭建全流程**：pyenv 定版本 → 建 venv → 激活 → 配镜像 → 装依赖 → 固化 `requirements.txt` → 写代码 → 提交（不含环境，含版本文件）的标准开场。
