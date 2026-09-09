---
group:
  title: 【01】初识python
  order: 1
order: 3
title:  venv虚拟环境
nav:
  title: Python基础
  order: 1
---

# venv虚拟环境

## 1. 介绍

### 1.1 什么是虚拟环境

虚拟环境（virtual environment）是 Python 用来**隔离项目依赖**的机制。简单说，它是一份"独立的小 Python"，有自己专属的包安装目录（site-packages），与系统 Python 和其他项目的包互不干扰。你在一个虚拟环境里装的库，别的环境看不见；反过来，系统里装的库，默认也不出现在虚拟环境里。

理解虚拟环境，关键抓住"隔离"二字：

- **没有虚拟环境时**：所有 `pip install` 都装到系统 Python 全局目录。项目 A 要 Django 3，项目 B 要 Django 4，系统只能装一个版本，另一个就用不了——这就是**依赖冲突**。
- **有了虚拟环境**：每个项目建一个虚拟环境，Django 3 装在 A 的环境、Django 4 装在 B 的环境，互不影响。

`venv` 是 Python 3.3+ **标准库自带的虚拟环境工具**，无需额外安装，用 `python -m venv` 即可创建。它是 Python 官方推荐的虚拟环境方案，取代了早期的第三方 `virtualenv` 在多数场景的地位。

### 1.2 为什么需要虚拟环境

很多新手一开始直接 `pip install xxx`，把包装到系统 Python，觉得"能用就行"。但随着项目增多，问题逐渐暴露：

| 问题 | 说明 | 后果 |
|------|------|------|
| 版本冲突 | 项目 A 要 `requests 2.20`，项目 B 要 `requests 2.31`，系统只能装一个 | 一个项目必然用不了 |
| 污染系统 Python | Linux/macOS 系统工具依赖系统自带 Python | 往里乱装包可能搞坏系统工具 |
| 环境不可复现 | 全局装的包杂乱无章，说不清项目到底依赖什么 | 换台机器就装不出一样的环境 |
| 升级牵连全局 | 在全局升级某包，可能破坏多个依赖旧版的项目 | 牵一发动全身 |

虚拟环境把每个项目的依赖关进自己的"小房间"，从根本上解决这些问题。业界共识是：**每个项目一个虚拟环境，这是 Python 工程的基础卫生**。

### 1.3 虚拟环境的本质

虚拟环境并不是"多装了一个 Python 解释器"。它复用系统已装的 Python 解释器二进制，只是**新建了一份 site-packages（第三方包目录）和少量配置**。所以建一个虚拟环境很快、占空间也不大（几 MB 级），只是包目录的一份独立副本。

一个虚拟环境本质上包含以下结构：

```text
.venv/                       # 虚拟环境目录（名字自定，常用 .venv）
├── bin/                     # macOS/Linux: 可执行文件
│   ├── python               # 指向系统 Python 的符号链接（不是副本）
│   ├── pip                  # 该环境专属的 pip
│   └── activate             # 激活脚本
├── Scripts/                 # Windows: 对应 bin 的可执行文件
│   ├── python.exe
│   ├── pip.exe
│   └── Activate.ps1
├── lib/
│   └── python3.12/
│       └── site-packages/   # 该环境专属的第三方包都装这里
├── pyvenv.cfg               # 配置文件，记录基础 Python 路径等
└── include/
```

**关键三点**：

1. **`bin/python`（或 `Scripts/python.exe`）指向系统 Python**，不是完整副本。所以虚拟环境不占大量空间。
2. **`site-packages` 是各环境独立的**：这就是隔离的根源——你 `pip install` 的包装到当前激活环境的 site-packages，别人看不见。
3. **激活的本质**：`source bin/activate` 做的事，是把当前 shell 的 `PATH` 临时改成"优先用 `.venv/bin/` 里的 python/pip"，并设几个环境变量（如 `VIRTUAL_ENV`）。退出（`deactivate`）就还原。激活不改变 Python 本身，只改变 shell 找命令的顺序。

### 1.4 venv 与其他环境工具的对比

虚拟环境生态有多个工具，了解它们的定位便于选型：

| 工具 | 定位 | 特点 |
|------|------|------|
| **venv** | 标准库自带（3.3+） | 轻量、官方推荐、无需安装 |
| virtualenv | 第三方工具 | 功能更全（支持 Python 2、可指定 Python 版本），venv 出现前是主流 |
| pipenv | pip + venv 的封装 | 自动管理虚拟环境与 Pipfile，近年维护放缓 |
| poetry | 现代化项目管理 | 集依赖管理、虚拟环境、打包发布于一体，适合中大型项目 |
| conda | 数据科学方向 | 自带环境管理，能管非 Python 依赖（C 库等） |
| uv | 新趋势（Rust 编写） | 极快，`uv venv` 创建环境比 venv 快得多，兼容 pip 命令 |

**选型建议**：学习阶段和中小项目用 **venv + pip + requirements.txt** 足够，它是其余所有工具的共同基础，先把 venv 用熟，日后转任何工具都轻松。

### 1.5 在开发流程中的定位

虚拟环境解决"装到哪"的问题，`pip` 解决"装什么"的问题，二者是搭档：

- **venv** 提供隔离的装包目录（某个项目的 `.venv/lib/.../site-packages`）。
- **pip** 往这个目录装具体的包。

正确工作流是：先创建并激活虚拟环境（venv），再用 pip 装包。激活后，pip 自动把包装进当前环境的 site-packages，无需额外指定。

---

## 2. 安装与配置

### 2.1 前提条件

使用 `venv` 需要满足以下前提：

1. **已安装 Python 3.3+**：`venv` 是 Python 3.3 起标准库自带的模块，无需额外安装。用 `python --version` 确认版本。
2. **Linux 上可能需要额外安装 python3-venv 包**：某些 Linux 发行版（如 Ubuntu）将 Python 拆包，`venv` 模块不在默认安装中，需要单独安装：

```bash
# Ubuntu / Debian
sudo apt install python3-venv
```

3. **确认 python 命令指向 3.x**：在 macOS 上，`python` 可能指向系统旧版或不存在，优先用 `python3 -m venv`。

### 2.2 创建虚拟环境

用 `python -m venv <目录名>` 创建虚拟环境。`-m venv` 表示运行标准库的 venv 模块，后跟环境目录名（约定俗成用 `.venv`，隐藏目录、不污染项目树）：

```bash
# 在项目根目录下
python -m venv .venv
```

执行后，当前目录出现 `.venv/` 文件夹，内含上一节所述结构。创建过程通常几秒，因为它只是建目录、拷贝/链接少量文件，不复制整个 Python。

**验证创建成功**：

```bash
# macOS / Linux
ls .venv/bin/activate

# Windows
ls .venv\Scripts\activate.bat
```

预期输出（macOS/Linux）：

```text
.venv/bin/activate
```

如果文件存在，说明环境创建成功。

**指定基础 Python**：`venv` 复用的是执行命令的那个 Python。若系统有多个 Python 版本，要用某特定版本建环境，只需用那个版本的命令：

```bash
python3.11 -m venv .venv       # 基于 Python 3.11 建环境
python3.12 -m venv .venv       # 基于 Python 3.12 建环境
```

### 2.3 激活虚拟环境

创建只是建了目录，**激活**才让当前 shell 切到这个环境。激活命令因平台和 shell 而异：

**macOS / Linux**：

```bash
source .venv/bin/activate
# 或简写
. .venv/bin/activate
```

**Windows - 命令提示符（cmd）**：

```bash
.venv\Scripts\activate.bat
```

**Windows - PowerShell**：

```bash
.venv\Scripts\Activate.ps1
```

激活成功后，命令行提示符前会出现环境名，如 `(.venv) $`，这是视觉提示——现在你在虚拟环境里了。

**验证激活**：

```bash
(.venv) $ which python
```

预期输出（macOS/Linux）：

```text
/Users/用户名/项目路径/.venv/bin/python
```

```bash
(.venv) $ python --version
```

预期输出：

```text
Python 3.12.0
```

`which python`（Windows 用 `where python`）指向 `.venv` 内，是判断"是否真的激活"最可靠的方法——光看提示符前缀偶尔会骗人（如自定义了 PS1）。

**激活做了什么**：`activate` 脚本把 `.venv/bin` 加到 `PATH` 最前面，并设 `VIRTUAL_ENV` 环境变量。这样 shell 调 `python`/`pip` 时优先找到环境内的版本，装包也进环境的 site-packages。它**不改变**系统 Python，只是临时改变当前 shell 的查找路径。

### 2.4 退出虚拟环境

退出用 `deactivate`（无需参数，这是激活脚本定义的 shell 函数）：

```bash
(.venv) $ deactivate
$
```

退出后，`PATH` 还原，`python`/`pip` 回到系统版本，`VIRTUAL_ENV` 变量清除。验证退出：

```bash
$ which python
# /usr/local/bin/python    ← 回到系统 python
```

注意：**退出不删除环境**，`.venv` 目录还在，下次再 `source .venv/bin/activate` 即可重新进入，之前装的包都还在。也可以直接关掉终端退出——激活只对当前 shell 生效，新开终端默认是系统环境。

### 2.5 删除虚拟环境

`venv` 没有"删除环境"的命令——**直接删目录即可**：

```bash
deactivate                   # 先退出（可选，但建议）
rm -rf .venv                 # macOS/Linux
```

Windows 下用资源管理器删除或命令 `rmdir /s /q .venv`。

删掉 `.venv` 目录，环境连同里面所有包都没了。重装的话，重新 `python -m venv .venv` 再 `pip install -r requirements.txt` 即可。这正是虚拟环境的优势：**环境可随时销毁重建，而项目的依赖清单保证能还原**。

### 2.6 安装常见问题排查表

| 问题 | 可能原因 | 解决方案 |
|------|---------|---------|
| `No module named venv` | Python 未安装 venv 模块 | Linux 执行 `sudo apt install python3-venv`；确认使用的是 Python 3.3+ |
| `python` 指向 Python 2 | macOS/Linux 系统自带旧版 | 用 `python3 -m venv .venv` 代替 `python -m venv` |
| 激活后 `which python` 仍指向系统 | 激活未生效 | 检查 `.venv/bin/activate` 文件是否存在；确认 `source` 命令未报错；检查 shell 配置是否覆盖 PATH |
| Windows PowerShell 激活报"禁止运行脚本" | PowerShell 执行策略限制 | 以管理员执行 `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`，或改用 cmd 的 `activate.bat` |
| 创建环境时报 `error: the following arguments are required: ENV_DIR` | 忘了传目录名 | 正确写法是 `python -m venv .venv`，`.venv` 不能省略 |
| `import` 不到装好的包 | 装到了系统全局而非 venv | `pip show 包名` 看 Location 是否含 `.venv`；规范做法是激活后再装，或用 `python -m pip` |

---

## 3. 核心命令与参数

### 3.1 venv 命令参数速查表

`python -m venv` 支持以下选项：

| 选项 | 作用 | 默认行为 |
|------|------|---------|
| `ENV_DIR`（位置参数） | 虚拟环境目录路径 | 必须提供 |
| `--without-pip` | 不在环境中安装 pip | 默认安装 pip |
| `--system-site-packages` | 允许访问系统 site-packages | 默认不访问（完全隔离） |
| `--clear` | 若目录已存在，先清空再建 | 默认保留已有目录内容 |
| `--upgrade` | 升级环境到当前 Python 版本 | 默认不升级 |
| `--copies` | 拷贝 Python 二进制而非符号链接 | macOS/Linux 默认用符号链接 |
| `--prompt <名称>` | 自定义激活后提示符前缀 | 默认用目录名 |
| `--help` | 查看所有选项 | — |

### 3.2 各参数详解

**`--system-site-packages`**

默认情况下，虚拟环境**看不到**系统装的全局包，完全独立。加这个选项后，环境能"看到"系统 site-packages 里的包（只读借用）：

```bash
python -m venv .venv --system-site-packages
```

用得少，偶尔用于"想复用系统装的大包（如 numpy）又不重装"的场景，但会破坏隔离性，一般不推荐。

**`--copies`**

默认 venv 用符号链接（macOS/Linux）指向系统 Python 二进制；`--copies` 改为复制二进制：

```bash
python -m venv .venv --copies
```

拷贝使环境更自包含（系统 python 变动不影响它），但占空间稍大。常用于：某些文件系统不支持符号链接（如旧 FAT）、需要环境完全可移植的场合。Windows 上默认就是拷贝。

**`--clear`**

如果 `.venv` 目录已存在，`--clear` 会先清空再建：

```bash
python -m venv .venv --clear
```

适合"环境坏了，重建一个干净的"场景，省去手动 `rm -rf`。

**`--prompt`**

自定义激活后提示符前缀，方便区分多个环境：

```bash
python -m venv .venv --prompt "myproject"
# 激活后提示符变为 (myproject) $
```

### 3.3 venv 生命周期命令速查

从创建到销毁的完整命令链：

| 阶段 | macOS / Linux | Windows |
|------|---------------|---------|
| 创建 | `python -m venv .venv` | `python -m venv .venv` |
| 激活 | `source .venv/bin/activate` | `.venv\Scripts\activate.bat`（cmd）<br>`.venv\Scripts\Activate.ps1`（PowerShell） |
| 装包 | `pip install <包名>` | `pip install <包名>` |
| 退出 | `deactivate` | `deactivate` |
| 删除 | `rm -rf .venv` | `rmdir /s /q .venv` |

### 3.4 检测当前是否在虚拟环境

代码里常需判断"是否运行在 venv 中"，有两种方法：

```python
import sys
import os

# 方法一：检查 prefix 与 base_prefix 是否不同（最可靠）
in_venv = sys.prefix != sys.base_prefix
print("在 venv 中:", in_venv)

# 方法二：检查 VIRTUAL_ENV 环境变量（仅激活后有）
in_venv = "VIRTUAL_ENV" in os.environ
print("在 venv 中:", in_venv)
```

`sys.prefix` 是当前 Python 的前缀目录（venv 里指向 `.venv`），`sys.base_prefix` 是基础 Python 的前缀。venv 中二者不同，系统环境中相同。方法二依赖激活设置了 `VIRTUAL_ENV`，用全路径调用 venv python 但未"激活"时可能无此变量，故方法一更可靠。

### 3.5 pyvenv.cfg 配置文件

每个 venv 根目录有个 `pyvenv.cfg` 文本文件，记录环境的关键信息：

```text
home = /usr/local/bin
include-system-site-packages = false
version = 3.12.0
prompt = .venv
```

各字段含义：

| 字段 | 含义 |
|------|------|
| `home` | 基础 Python 解释器所在目录（venv 复用的那个 Python） |
| `include-system-site-packages` | 是否允许访问系统 site-packages（对应 `--system-site-packages`） |
| `version` | 创建时的 Python 版本 |
| `prompt` | 激活后提示符前缀显示的内容 |

这个文件是 venv 的"身份证"。一般不用手动改——改 `home` 指向别的 Python 可能导致环境失灵。但读它有助于排查"环境突然不能用"的问题（往往是 base Python 被升级/卸载导致 `home` 失效）。

### 3.6 依赖清单：requirements.txt

虚拟环境本身是"可抛弃"的，真正能复现环境的是依赖清单。完整工作流如下：

**导出依赖清单**：

```bash
# 激活环境后
pip freeze > requirements.txt
```

`requirements.txt` 内容形如：

```text
flask==3.0.0
requests==2.31.0
```

`pip freeze` 会列出当前环境装的**所有**包（含传递依赖）及精确版本，保证复现一致。

**按清单复现环境**：

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

**核心原则**：`.venv` 不入 git，`requirements.txt` 入 git。环境可销毁重建，清单是复现的依据。

### 3.7 在 IDE 中使用 venv

**VS Code**：

1. 打开项目后，按 `Ctrl+Shift+P`（macOS 用 `Cmd+Shift+P`），输入 `Python: Select Interpreter`。
2. 选择 `.venv` 中的 Python 解释器。如果列表中没有，点 `Enter interpreter path` 手动选 `.venv/bin/python`。
3. 选好后，VS Code 的终端会自动激活该 venv，智能提示也基于该环境的包。

**PyCharm**：

1. 新建项目时，解释器选 "New environment using Virtualenv"，PyCharm 自动创建 venv。
2. 已有项目：`Settings → Project → Python Interpreter`，点齿轮图标选 `Add Interpreter → Add Local Interpreter`，选 `.venv` 中的 python。
3. PyCharm 底部 Terminal 打开后**已自动激活**当前 venv（提示符前有 `(venv)`），直接 `pip install` 即装到项目环境。

### 3.8 venv 与 .gitignore

`.venv` 目录**绝不**提交 git，原因有三：

1. 体积大（含所有第三方包，可能数百 MB）。
2. 与机器相关（绝对路径、平台特定的二进制）。
3. 可重建（有 requirements.txt 就能还原），提交它毫无意义且有害。

`.gitignore` 里加：

```text
.venv/
venv/
env/
__pycache__/
*.pyc
```

只提交 `requirements.txt`（或其他依赖声明文件）。这是 Python 项目的标准约定。

---

## 4. 实战工作流与 FAQ

### 4.1 完整实战：从零搭建项目环境

把前面各节串起来，演示一个新项目从零搭环境到跑起来的完整流程（以 macOS 为例，Windows 请替换激活命令）：

**步骤 1：建项目目录并创建虚拟环境**

```bash
mkdir myproject && cd myproject
python -m venv .venv
```

**步骤 2：激活虚拟环境**

```bash
source .venv/bin/activate
# 提示符变为 (.venv)
```

**步骤 3：升级 pip 并配置国内镜像加速**

```bash
python -m pip install --upgrade pip
python -m pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
```

**步骤 4：安装项目依赖**

```bash
python -m pip install flask requests
```

**步骤 5：写代码并运行**

```python
# app.py
from flask import Flask

app = Flask(__name__)

@app.route("/")
def hello():
    return "Hello, venv!"

if __name__ == "__main__":
    app.run(debug=True)
```

运行：

```bash
python app.py
```

输出：

```text
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

**步骤 6：固化依赖清单**

```bash
python -m pip freeze > requirements.txt
```

**步骤 7：配置 git 忽略并提交**

创建 `.gitignore`：

```text
.venv/
__pycache__/
*.pyc
```

```bash
git init
git add .gitignore app.py requirements.txt
git commit -m "init: 项目骨架与依赖"
```

注意：不 `git add .venv`。

**步骤 8：队友 / CI 复现环境**

别人拿到项目后，只需：

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

整个流程可以用一张图概括：

```text
python -m venv .venv         建环境
       ↓
source .venv/bin/activate    激活
       ↓
pip config set ...           配镜像（国内）
       ↓
python -m pip install ...    装依赖
       ↓
python app.py                写代码 & 运行
       ↓
pip freeze > requirements.txt  固化清单
       ↓
git: 提交清单, 忽略 .venv      协作
```

这套流程是 Python 项目的标准开场。掌握它，任何新项目都能照此起步，环境干净、可复现、可协作。

### 4.2 在脚本与服务中使用 venv

venv 不只用于交互式开发，部署、定时任务、后台服务也要用。

**脚本直接用 venv 的 python**：不激活，用全路径调用，最干净：

```bash
# cron 定时任务，用 venv 的 python 跑脚本
0 9 * * * /path/to/project/.venv/bin/python /path/to/project/run.py
```

**systemd 服务**：

```bash
# ExecStart 指向 venv 的 python
ExecStart=/path/to/.venv/bin/python /path/to/app.py
```

**shebang 指向 venv python**：

```python
#!/path/to/.venv/bin/python
print("用 venv 的 python 运行")
```

这样脚本运行时自动用 venv 的解释器和依赖，无需手动激活，适合自动化场景。

**CI/CD**：GitHub Actions 等 CI 环境里，用 `actions/setup-python`（自带 venv 创建）或手动执行：

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

保证 CI 环境干净可复现。

### 4.3 何时重建虚拟环境

venv 是可抛弃的，遇到以下情况重建比逐个升级省心：

| 场景 | 为何重建 | 重建命令 |
|------|---------|---------|
| 依赖装乱了 | 试装了各种包，环境一团乱 | `rm -rf .venv` 后重建 |
| Python 版本升级 | 旧 venv 可能异常 | `rm -rf .venv` 后用新版本重建 |
| 换机器/部署 | 新机器应按清单重建，不拷旧环境 | 在新机器上 `python -m venv .venv` + `pip install -r requirements.txt` |
| 排查诡异问题 | 怀疑环境被污染 | 重建一个干净环境验证 |

重建流程：

```bash
deactivate
rm -rf .venv
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

几条命令还你一个干净一致的环境。这种"环境即弃即建"的能力，是虚拟环境相比系统全局安装的核心优势。

### 4.4 虚拟环境与系统 Python 的关系澄清

新手常有几个困惑，这里逐一明确：

**困惑一：删了 venv 会影响系统 Python 吗？**

不会。venv 只是复用系统 Python 的链接/配置，删掉 venv 目录不影响系统 Python 本身。反之，删/升级系统 Python 可能影响已建的 venv（因为 venv 依赖系统 Python 二进制），所以 base Python 宜稳定。

**困惑二：venv 里有标准库吗？**

有。标准库随 Python 解释器走，venv 复用系统 Python，所以 `import os`、`import json` 等标准库在 venv 里照常用。venv 隔离的是**第三方包**（site-packages），不是标准库。

**困惑三：不激活能用 venv 里的 python 吗？**

能，直接用全路径：`.venv/bin/python script.py`（Windows: `.venv\Scripts\python.exe script.py`）。这绕过激活，直接用环境内的解释器运行。某些场景（如 cron、systemd 服务、脚本调用）不便激活，用全路径是干净的做法。

**困惑四：不同 venv 之间共享包吗？**

不共享。每个 venv 有独立 site-packages，A 里装的包 B 看不见。

### 4.5 venv 的限制与边界

venv 强大，但有边界，知道何时它不够用：

| 限制 | 说明 | 升级方案 |
|------|------|---------|
| 不能装不同 Python 版本 | venv 依赖系统已有的 Python | 用 pyenv 安装多版本，再基于指定版本建 venv |
| 不能隔离非 Python 依赖 | 某包依赖系统的 C 库（如 libpq），venv 管不到 | 用 conda（能管非 Python 依赖）或 Docker |
| 不解决跨平台兼容 | Windows 建的 venv 不能拷到 Linux 用 | 跨平台部署用 Docker 或目标平台重建 |
| 不自动管理依赖锁定 | venv 只管隔离，不分析依赖冲突 | 用 poetry/pip-tools 做依赖锁定 |

理解这些边界，能在 venv 不够用时正确升级工具栈。

### 4.6 venv vs Docker 的环境隔离对比

虚拟环境与 Docker 都做"环境隔离"，但层次不同：

| 维度 | venv | Docker |
|------|------|--------|
| 隔离层次 | Python 包（site-packages） | 整个操作系统（含 Python、系统库） |
| 能隔离非 Python 依赖 | 否 | 是 |
| 跨平台一致性 | 弱 | 强 |
| 资源占用 | 小（MB 级） | 大（镜像常 GB 级） |
| 启动速度 | 快 | 较慢 |
| 适用场景 | 本地开发、纯 Python 项目 | 部署、含系统依赖的项目 |

常见组合是**本地开发用 venv，生产部署用 Docker**：开发时 venv 快速迭代，部署时 Dockerfile 里 `python -m venv` + `pip install` 构建一致镜像，两者用同一份 requirements.txt。

### 4.7 最佳实践

**每个项目一个独立 venv**

绝不多个项目共用一个 venv，否则失去隔离的意义，依赖冲突迟早发生。

**用 `.venv` 作为目录名**

约定俗成用 `.venv`（隐藏、短、IDE 与多数工具默认识别）。整个团队统一名字，`.gitignore` 写死 `.venv/` 即可。

**装包前先激活**

```bash
source .venv/bin/activate        # 先激活
pip install xxx                  # 再装，确保装到 venv 而非全局
```

养成"开终端第一件事是激活项目 venv"的习惯。推荐用 `python -m pip` 代替裸 `pip`，即使激活状态有偏差，它仍绑定当前 `python` 对应的 pip。

**`.venv` 不入 git，`requirements.txt` 入 git**

这是环境可复现、可协作的基础。

**路径避免中文与空格**

venv 内的脚本、shebang 含路径，含中文/空格路径在某些工具/终端会莫名报错。

**不用 sudo pip**

虚拟环境装在用户目录，完全不需要 sudo。`sudo pip` 往系统目录写、污染系统 Python，可能搞坏系统工具。

**固定 base Python 版本**

venv 依赖建它时的系统 Python，系统 Python 升级/卸载可能破坏已建 venv。生产环境 base Python 宜稳定锁定版本（用 pyenv 管理多版本并指定）。

**生产/开发依赖分离**

```text
requirements.txt        # 生产依赖
requirements-dev.txt    # 开发依赖（含 -r requirements.txt + 测试工具）
```

部署只装生产依赖，环境精简；开发多装测试/格式化工具。

### 4.8 FAQ

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| 激活后还是用系统 python | PATH 未正确更新 | 检查 `source .venv/bin/activate` 是否报错；用 `which python` 确认指向；检查 shell 配置是否覆盖 PATH |
| PowerShell 激活报"禁止运行脚本" | 默认执行策略限制 | `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| `No module named venv` | Python 未含 venv 模块 | Linux 装 `python3-venv`；确认 Python 3.3+；用 `python3` 而非 `python` |
| 装了包但 `import` 不到 | 包装到系统全局而非 venv | 激活后再装；用 `python -m pip` 绑定当前 python；`pip show 包名` 检查 Location |
| 创建环境失败报 `ENV_DIR` 错误 | 忘了传目录名参数 | 正确写法：`python -m venv .venv`，`.venv` 不能省 |
| 多人/多机拷 venv 目录后失效 | venv 含绝对路径与平台二进制 | 不要拷 venv 目录，只迁移 `requirements.txt`，在新机器重建 |
| 系统安装旧 Python 导致 venv 异常 | base Python 被升级/卸载 | 用 pyenv 固定 base Python 版本；重建 venv |
| conda 与 venv 混用导致冲突 | 两个环境体系互相干扰 | 同一项目只用一套，选定 conda 或 venv+pip |
| venv 占用空间太大 | 装了很多包 | 删除重建：`rm -rf .venv && python -m venv .venv && pip install -r requirements.txt` |
| 激活后提示符没变化 | 自定义了 PS1 | 用 `which python` 验证而非看提示符；或用 `--prompt` 自定义 |

---

## 5. 总结

本文围绕 venv 虚拟环境展开，主要介绍了以下内容：

- **虚拟环境定位**：隔离项目依赖的机制，每个 venv 有独立 site-packages，与系统和其他项目互不干扰；venv 是 Python 3.3+ 标准库自带工具，无需额外安装。
- **为什么需要**：解决系统级安装的版本冲突、污染系统 Python、环境不可复现、升级牵连全局等问题；每个项目一个 venv 是 Python 工程的基础卫生。
- **虚拟环境本质**：复用系统 Python 解释器，新建独立 site-packages；激活的本质是临时改 PATH，让 shell 优先用 venv 内的 python/pip。
- **工具对比**：venv（官方自带）、virtualenv、pipenv、poetry、conda、uv 的定位差异；学习阶段用 venv + pip + requirements.txt 足够。
- **创建与激活**：`python -m venv .venv` 创建，各平台激活命令不同，用 `which python` 验证激活是否生效。
- **退出与删除**：`deactivate` 退出（不删除环境），`rm -rf .venv` 彻底删除。
- **参数速查**：`--system-site-packages`、`--copies`、`--clear`、`--upgrade`、`--prompt` 等选项的用途，99% 场景裸建即可。
- **依赖清单**：`pip freeze > requirements.txt` 固化，`pip install -r requirements.txt` 复现；`.venv` 不入 git，清单入 git。
- **IDE 集成**：VS Code 和 PyCharm 中选择/创建 venv 的操作方法。
- **脚本与服务部署**：用 venv python 全路径跑（cron/systemd/shebang），不依赖手动激活。
- **检测与配置**：代码里用 `sys.prefix != sys.base_prefix` 判断是否在 venv；`pyvenv.cfg` 记录环境关键信息。
- **限制与边界**：venv 不能装不同 Python 版本、不管非 Python 依赖、不跨平台、不锁定依赖；不够用时升级到 pyenv/conda/Docker/poetry。
- **完整实战**：从零搭建项目环境（建 venv → 激活 → 配镜像 → 装依赖 → 写代码 → 固化清单 → 提交）的标准流程，以及队友复现环境的方法。
