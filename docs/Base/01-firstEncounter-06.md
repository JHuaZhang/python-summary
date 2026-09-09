---
group:
  title: 【01】初识python
  order: 1
order: 6
title: VSCode配置
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 VS Code

Visual Studio Code(简称 VS Code)是微软开源的、跨平台的**轻量级代码编辑器**。它与 PyCharm 这类"开箱即用的重 IDE"不同,VS Code 本身只是一个精简的编辑器内核,真正让它强大的是**扩展(extension)**生态——按需安装扩展,把编辑器逐步武装成你需要的开发环境。装好 Python 扩展,VS Code 就能智能补全、调试、运行 Python,体验接近专业 IDE,同时保持轻量、启动快、占资源少。

理解 VS Code 的定位,关键抓住"编辑器 + 扩展"的模式:

- **核心极简**:VS Code 安装包仅几十 MB,启动几乎瞬时,对机器配置要求低,这点胜过 PyCharm 这类动辄几 GB、占内存大的 IDE。
- **扩展驱动**:智能补全、调试、语言支持、主题、Git 增强等功能都由扩展提供。你想支持什么语言/框架,装对应扩展即可,不装就不会有——这是它"轻"的根源,也是它需要配置的原因。
- **通用**:同 VS Code 写 Python、前端、Go、Rust、Markdown……多语言项目无需切换工具。这是它相对 PyCharm(Python 专属)的优势。

VS Code 当前是**全球最受欢迎的代码编辑器**(Stack Overflow 开发者调查多年第一),尤其在同时做 Python 后端与前端的团队、轻量脚本开发、远程开发场景,VS Code 是主流选择。

在实际开发中,VS Code 配合 Python 扩展的典型用途:

- **编写 Python 代码**:智能补全、语法高亮、错误提示、格式化、跳转定义。
- **运行与调试**:一键运行脚本、断点调试、变量查看。
- **虚拟环境管理**:自动识别并选用项目的 venv/conda 解释器。
- **集成终端与 Git**:在编辑器内开终端、装包、提交代码,不必外切。
- **远程开发**:通过 SSH/容器/WSL 在远程环境写代码,本地编辑远程执行(这是 VS Code 强于 PyCharm 社区版的杀手锏)。

### 1.2 VS Code 与 PyCharm 的对比

读者常在两者间选择,这里给出客观对比(与《PyCharm 开发环境配置》呼应):

| 维度 | VS Code(+Python 扩展) | PyCharm(社区版) |
|------|------------------------|------------------|
| 启动速度/资源占用 | 轻量,启动快,省内存 | 较重,启动慢,占内存大 |
| 开箱即用程度 | 需装扩展并配置解释器 | 装完即用,零配置 |
| 智能提示/调试 | 装好 Pylance 后很好 | Python 深度优化,体验略胜 |
| 多语言支持 | 通吃几乎所有语言 | 专注 Python(专业版支持更多) |
| 扩展生态 | 极其丰富,万物皆可扩展 | 插件生态相对小 |
| 远程/容器开发 | 官方 Remote 扩展,免费强大 | 社区版不支持,专业版才有 |
| 价格 | 完全免费开源 | 社区版免费,专业版付费 |
| 学习/配置成本 | 中(需了解扩展与设置) | 低(开箱即用) |

**选择建议**:纯学 Python、想要零配置开箱即用、重视重度调试重构 → PyCharm 社区版;既写 Python 又写前端/多语言、机器资源有限、需要远程/WSL/容器开发、喜欢高度可定制 → VS Code。两者不互斥,可都装,不同项目用不同工具。本节讲 VS Code,与 PyCharm 笔记互补。

VS Code 真正的甜点场景是**远程开发**:在本地 VS Code 编辑,代码和运行环境在远程服务器/容器/WSL 里。这一能力社区版 PyCharm 没有,是很多团队选 VS Code 的关键原因。

### 1.3 为什么需要配置 VS Code

VS Code 的"轻"是双刃剑:开箱不会自动配置 Python 解释器、不会智能补全——这些都要你**主动配置**。相比 PyCharm 装完即用,VS Code 需要一段配置过程才能成为顺手的 Python IDE。

需要配置的核心几项:

- **装 Python 扩展**:让 VS Code 认识 Python,提供补全/调试/Linter。
- **选 Python 解释器**:告诉 VS Code 用哪个 Python(系统/venv/conda)运行和解析代码。这是最关键一步——没选对解释器,补全失效、运行报错。
- **配置 Linter/Formatter**:选 pylint/flake8/ruff 做检查,black/autopep8 做格式化。
- **调试配置**:写 `launch.json` 定义怎么调试(参数、环境变量等)。
- **设置与快捷键**:个性化编辑器行为。

这套配置一次性做好,之后用起来极顺。本节带你完整走一遍,把 VS Code 武装成专业 Python 开发环境。理解"VS Code 需要配置"这一前提,就不会在"为什么装了 VS Code 还不能补全 Python"上困惑——它需要你先装扩展、选解释器。

### 1.4 VS Code 与 Python 环境的关系

与 PyCharm 一样,**VS Code 不自带 Python**——它只是编辑器,真正执行代码的是你之前装好的 Python 解释器(系统 Python、venv 或 conda 环境)。VS Code 通过"选择解释器"把外部 Python 接进来。

分工:

- **Python 解释器**(前几节装好的):真正运行代码的引擎。
- **VS Code**(本节):写代码、调用解释器运行/调试的"驾驶舱",外加通过扩展提供智能补全等能力。

新建/打开一个 Python 项目时,VS Code 会让你"Select Python Interpreter"(选择解释器),这一步就是把项目与某个 Python 环境(venv/conda/系统)绑定。选好后,运行、调试、补全都基于该解释器及其装的包。理解这个分工,VS Code 的配置逻辑就清晰了——大部分配置围绕"用哪个解释器""怎么检查/格式化""怎么调试"展开。

### 1.5 VS Code 的配置文件体系概览

VS Code 高度可配置,配置散在几类文件里,先建立整体认知,后续各节再深入。核心配置文件:

- **settings.json**:编辑器与语言行为设置(主题、字体、Linter、Formatter、解释器路径等)。分用户级(全局个人偏好)与工作区级(`.vscode/settings.json` 项目约定)两层。
- **launch.json**:`.vscode/launch.json`,调试配置——怎么调试(哪个脚本、参数、环境变量)。本文 2.7 详述。
- **tasks.json**:`.vscode/tasks.json`,任务定义——可重复的构建/测试/运行命令。本文 2.25 详述。
- **keybindings.json**:自定义快捷键,覆盖默认。
- **extensions.json**:`.vscode/extensions.json`,给团队推荐扩展。
- **.editorconfig**:跨编辑器的风格约定(缩进/换行/编码),非 VS Code 专属但被其识别。

这些文件大多放在项目的 `.vscode/` 目录(项目级,可提交 git 共享),少数放用户目录(全局个人)。理解"哪些配置项目级共享、哪些用户级个人",是配置管理的核心。本节后续逐一讲解这些文件怎么写,读者可先记住这个全景,再随章节深入。

**命令面板是一切配置的入口**:`Ctrl+Shift+P`(`Cmd+Shift+P`)打开命令面板,几乎所有操作(选解释器、选 Linter、开设置、跑任务)都能搜到。VS Code 的设计哲学是"命令面板可达一切",记不住菜单位置就搜命令,这是用熟 VS Code 的关键习惯。

---

## 2. 核心内容

本章详尽讲解 VS Code 的安装、Python 扩展、解释器选择、运行调试、Linter/Formatter 配置、设置与快捷键、Git 集成、远程开发等,让读者照着把 VS Code 配成顺手的 Python IDE。

### 2.1 下载与安装

**下载**:访问 https://code.visualstudio.com/ ,官网自动检测操作系统,点 Download 下载对应平台安装包(Windows `.exe`、macOS `.zip`、Linux `.deb`/`.rpm` 或 tarball)。

**Windows 安装**:双击 `.exe` 运行向导,关键选项:

- **添加到 PATH**:勾选"将 VS Code 添加到 PATH"(重要,之后可在命令行用 `code` 命令打开文件/目录)。
- 其他默认即可,完成安装。

**macOS 安装**:解压下载的 zip,把 Visual Studio Code 拖到 Applications。也可用 Homebrew:`brew install --cask visual-studio-code`。

**Linux 安装**:用包管理器装 `.deb`(Ubuntu/Debian,`sudo dpkg -i code_*.deb`)或 `.rpm`(Fedora/RHEL);或解压 tarball。装后在终端输 `code` 启动。

**首次启动**:打开 VS Code,左侧是活动栏(图标列),顶部菜单,中间编辑区,底部状态栏。首次会有欢迎页和"新建文件/打开文件夹"引导。

**`code` 命令**:装时勾选了 PATH 后,可在终端用 `code .` 打开当前目录、`code file.py` 打开文件,十分方便。若 `code` 命令不可用:Windows 重装勾选 PATH;macOS 在 VS Code 内 `Cmd+Shift+P` → "Shell Command: Install 'code' command in PATH"。

### 2.2 以文件夹为工作单元

VS Code 以**文件夹(folder)**为工作单元——打开一个文件夹即打开一个项目。这与"单文件编辑器"不同,VS Code 的很多功能(项目设置、终端默认目录、Git)都以当前打开的文件夹为基准。

**打开文件夹**:File → Open Folder,选项目目录。左侧资源管理器(EXPLORER)显示该文件夹的文件树。

**为何用文件夹而非单文件**:打开文件夹后,VS Code 能识别项目结构、自动检测其中的 `.venv`、`.vscode` 配置目录、`.git`,智能提示基于整个项目。只打开单文件则少了这些上下文。所以**养成"用 Open Folder 打开项目目录"的习惯**,而非双击单个 `.py`。

**多根工作区(Multi-root Workspace)**:可把多个文件夹加入一个工作区(File → Add Folder to Workspace),适合一个工程含多个子项目。保存为 `.code-workspace` 文件,下次直接开。一般单项目用单文件夹即可。

**`.vscode` 目录**:打开的文件夹里若有 `.vscode/` 子目录,里面放项目级配置(`settings.json`/`launch.json`/`tasks.json`),只对该项目生效。这是项目级配置的存放处,可提交 git 让团队共享配置。

### 2.3 安装 Python 扩展

VS Code 装好后默认不认识 Python,需装**Python 扩展**:

1. 左侧活动栏点扩展图标(或 `Ctrl+Shift+X`/`Cmd+Shift+X`)。
2. 搜索 "Python",发布者为 Microsoft 的那个(下载量最高),点 Install。
3. 装好后,VS Code 支持 Python 语法高亮、智能补全(由 Pylance 提供)、调试、运行等。

**Python 扩展实际是一个扩展包**,装它会连带装几个相关扩展:

- **Pylance**:微软的 Python 语言服务器,提供极速、精准的智能补全与类型检查(基于静态分析)。是当前 Python 补全体验的核心。
- **Python Debugger**:调试器,支持断点调试。
- 其他如 Jupyter(若装)、Pylint 等可选。

只需装 "Python" 这一个,它会把必要的依赖扩展带上。装完重启或重载窗口(`Cmd+Shift+P` → "Reload Window")确保生效。

**其他常用扩展**(按需装):

- **中文语言包**:官方 Chinese (Simplified) 包,界面中文化。
- **GitLens**:增强 Git,显示每行最后修改者(blame)、提交历史。
- **Python Indent**:改进 Python 缩进回车行为。
- **autoDocstring**:自动生成函数 docstring 模板。
- **Jupyter**:在 VS Code 里编辑运行 `.ipynb`(数据科学场景)。
- **Ruff**:若用 ruff,装官方 Ruff 扩展做检查与格式化。
- **Prettier**:若兼写前端,格式化 JS/CSS 等。

扩展按需装,装太多会拖慢启动。新手先装 "Python" + 中文包,够用再补。

### 2.4 选择 Python 解释器

这是 VS Code 配置 Python **最关键一步**:告诉 VS Code 用哪个 Python 解释器。没选对,补全不准、运行用错环境。

**选择方法**:

1. `Ctrl+Shift+P`(`Cmd+Shift+P`)打开命令面板。
2. 输入 "Python: Select Interpreter",回车。
3. VS Code 列出它检测到的解释器:系统 Python、项目的 `.venv`、conda 环境等。选你要的那个。
4. 选好后,窗口左下角状态栏显示当前解释器(如 `Python 3.12.0 ('.venv')`),点击它也能快速重新选择。

**自动识别 venv/conda**:若项目目录下有 `.venv`,VS Code 通常会提示"是否选用该虚拟环境",点 yes 即绑定。conda 环境也会在解释器列表里出现(若 conda 在 PATH)。

**验证选对解释器**:

```python
# test.py
import sys
print(sys.executable)     # 输出当前解释器路径
```

按 2.5 运行,看输出路径是否是预期的 venv/conda 路径。若输出系统 Python 路径,说明解释器没选对,重选。

**为何关键**:VS Code 的智能补全(Pylance)基于所选解释器的包环境——选了 `.venv`,它能补全 `.venv` 里装的包(如 `import requests` 能补全);选错到系统 Python,系统没装 requests 就补全不出。调试运行也用所选解释器执行。所以"选解释器"是把 VS Code 与你的 Python 环境正确绑定的核心动作。

### 2.5 运行 Python 代码

选好解释器后,运行 Python 有几种方式:

**方式一:点击运行按钮**。打开 `.py` 文件,右上角有"运行"三角形按钮,点它(或旁边的调试按钮)即用当前解释器运行该文件。输出显示在下方的"终端"(Terminal)面板。

**方式二:命令面板**。`Ctrl+Shift+P` → "Python: Run Python File",运行当前文件。

**方式三:终端直接跑**。在 VS Code 内置终端(`Ctrl+`` 或菜单 Terminal → New Terminal),手动 `python file.py`。终端会自动激活当前选的 venv/conda(提示符前有 `(.venv)`),所以直接 `python` 就是用对环境。

**方式四:Run Python File in Terminal / 选区运行**。可右键选代码 → "Run Selection/Line in Python Terminal" 只跑选中部分,适合试片段。

最常用是方式一(点按钮)。运行后内置终端显示输出,且终端已激活项目环境,可继续交互或装包。

### 2.6 调试(Debug)

VS Code 的 Python 调试依赖 Python Debugger 扩展(随 Python 扩展安装)。基本流程:

**设断点**:代码行号左侧(gutter)点一下,出现红点即断点。

**启动调试**:

- 点运行按钮旁的"调试"按钮(Run and Debug),或 `F5`。
- 首次按 `F5` 会让你选调试器,选 "Python File"(调试当前文件)。VS Code 生成默认调试配置并开始调试。

**调试界面**:程序到断点暂停,顶部出现调试工具栏,左侧"运行与调试(Run and Debug)"面板显示:

- **Variables**:当前作用域变量值。
- **Watch**:添加表达式监视。
- **Call Stack**:调用栈。
- **Breakpoints**:断点列表。

**控制按钮**(调试工具栏):

- Continue(`F5`):继续到下一断点。
- Step Over(`F10`):执行当前行,不进入函数。
- Step Into(`F11`):进入函数。
- Step Out(`Shift+F11`):跳出当前函数。
- Restart(`Ctrl+Shift+F5`):重启调试。
- Stop(`Shift+F5`):停止。

**调试控制台(Debug Console)**:调试暂停时可输入表达式求值,如输入变量名看值,或试表达式。

**条件断点**:右键断点红点 → Edit Breakpoint,填条件表达式(如 `i == 5`),满足条件才暂停。

调试相比 print 的优势与 PyCharm 相同:能暂停交互查看、不污染代码、支持条件。养成用断点调试的习惯是进阶关键。

### 2.7 launch.json 调试配置

要传命令行参数、设环境变量、指定工作目录等,需写 `launch.json` 调试配置。

**生成**:运行与调试面板 → "创建 launch.json 文件" → 选 "Python File"。VS Code 在 `.vscode/launch.json` 生成模板:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Python: 当前文件",
            "type": "debugpy",
            "request": "launch",
            "program": "${file}",
            "console": "integratedTerminal"
        }
    ]
}
```

**常用字段**:

- `program`:要运行的脚本,`${file}` 表示当前文件,也可写固定路径如 `${workspaceFolder}/main.py`。
- `args`:命令行参数列表,如 `["alice", "25"]`,脚本用 `sys.argv` 接收。
- `env`:环境变量字典,如 `{"API_KEY": "xxx"}`。
- `cwd`:工作目录,默认 `${workspaceFolder}`。
- `console`:输出位置,`integratedTerminal`(集成终端,推荐,支持输入)或 `internalConsole`。
- `justMyCode`:是否只调试自己的代码(跳过库代码),默认 `true`。

**多配置**:configurations 数组可放多套,如一套带参数 `--debug`、一套带 `--release`,在调试下拉切换。示例带参数与环境变量的配置:

```json
{
    "name": "带参数调试",
    "type": "debugpy",
    "request": "launch",
    "program": "${file}",
    "args": ["--input", "data.csv"],
    "env": {"LOG_LEVEL": "DEBUG"},
    "console": "integratedTerminal",
    "justMyCode": true
}
```

`launch.json` 放 `.vscode/` 可提交 git 共享,团队成员拉下即有相同调试配置。

### 2.8 智能补全与 Pylance

VS Code 的 Python 智能补全由 **Pylance** 扩展提供(随 Python 扩展安装)。它的特点:

- **极速**:基于 Pyright 静态类型检查器,补全响应快。
- **精准**:结合类型推断,补全更准(知道某变量是 list,就补 list 方法)。
- **类型提示支持**:写类型注解(`def f(x: int) -> str:`)后,补全与检查更准,调用处还能提示参数类型。

**补全触发**:输入时自动弹出;`Ctrl+Space` 手动触发补全列表;Tab/回车选择。

**快速修复**:有错误/警告时,光标移到波浪线处,左侧出现灯泡(或 `Ctrl+.`),点开看修复建议(如 import 缺失模块、加类型注解)。相当于 PyCharm 的 Alt+Enter。

**跳转定义**:`F12` 或 `Ctrl+点击`(`Cmd+点击`)跳到函数/变量定义;`Alt+F12` (`Option+F12`) peek 定义不跳转;`Shift+F12` 查找所有引用。

**悬停文档**:鼠标悬停在函数/类上,显示其 docstring 与签名,快速查用法。

Pylance 默认配置已很好,无需调。若要 stricter 的类型检查,在 settings 里设 `"python.analysis.typeCheckingMode": "strict"`(默认 basic),会报告更多潜在类型问题,适合严格类型化项目。

### 2.9 Linter 代码检查

Linter 实时检查代码风格与潜在问题,在编辑器里用波浪线标出。VS Code 的 Python 扩展支持多种 Linter:

**选用 Linter**:`Ctrl+Shift+P` → "Python: Select Linter",从列表选(pylint/flake8/ruff/mypy 等)。选后在 settings 里记录。

**常用 Linter**:

- **Pylint**:检查全面但较啰嗦,默认 Linter 之一。
- **Flake8**:轻量,PEP 8 风格检查主流选择。
- **Ruff**:Rust 编写,极快,集 flake8+isort+pyupgrade 等于一身,是新趋势。装 Ruff 扩展并选用,体验最佳。
- **Mypy**:类型检查(非风格),配合类型注解用。

**配置示例**(settings.json,选用 Ruff):

```json
{
    "[python]": {
        "editor.defaultFormatter": "charliermarsh.ruff",
        "editor.codeActionsOnSave": {
            "source.fixAll.ruff": "explicit",
            "source.organizeImports.ruff": "explicit"
        }
    }
}
```

Linter 装 Linter 对应的包(如 `pip install ruff` 或它自带)。Ruff 扩展自带 ruff 二进制,无需 pip 装,开箱即用,推荐。

**检查等级**:不同 Linter 可在 settings 调严格度或忽略规则(如 `.flake8`/`ruff.toml` 配置文件)。初学用默认即可,不必纠结规则细节。

### 2.10 Formatter 代码格式化

Formatter 自动按风格(Python 通常 PEP 8/black 风格)格式化代码,统一团队风格。

**选用 Formatter**:`Ctrl+Shift+P` → "Python: Select Formatter"(或在 settings 设 `python.formatting.provider`),从 black/autopep/yapf/ruff 选。**推荐 Ruff**(兼做 Linter 与 Formatter,快且零配置)或 **black**(事实标准的格式化工具)。

**格式化操作**:

- 格式化当前文件:`Shift+Alt+F`(`Shift+Option+F`)。
- 格式化选中:`Ctrl+K Ctrl+F`。
- **保存时自动格式化**(推荐):settings 设:

```json
{
    "[python]": {
        "editor.formatOnSave": true,
        "editor.defaultFormatter": "charliermarsh.ruff"
    }
}
```

保存即自动格式化,从此代码风格永远统一,无需手动。这是提升代码质量与一致性的高效配置。

black 需 `pip install black`,Ruff 扩展自带。配置好后,养成保存即格式化的习惯,团队风格自然统一。

### 2.11 settings.json 配置

VS Code 的设置分图形界面(Settings)和 JSON(`settings.json`)两种,JSON 更精确、可提交共享。打开:`Ctrl+`,(`Cmd+`,)开 Settings 图形界面,右上角图标切到 JSON。

**设置层级**:

- **用户级**(`settings.json` 在 `~/.config/Code/User/`):所有项目共用,个人偏好(主题、字体)。
- **工作区级**(`.vscode/settings.json`):仅当前项目,项目相关(解释器、Linter)。可提交 git 共享。

**Python 项目常用 settings.json**(放 `.vscode/`):

```json
{
    "python.defaultInterpreterPath": "${workspaceFolder}/.venv/bin/python",
    "python.analysis.typeCheckingMode": "basic",
    "python.analysis.autoImportCompletions": true,
    "[python]": {
        "editor.defaultFormatter": "charliermarsh.ruff",
        "editor.formatOnSave": true,
        "editor.codeActionsOnSave": {
            "source.organizeImports.ruff": "explicit"
        },
        "editor.tabSize": 4,
        "editor.insertSpaces": true
    },
    "python.terminal.activateEnvironment": true,
    "files.autoSave": "afterDelay"
}
```

各字段含义:`defaultInterpreterPath` 指定默认解释器(可省,手动选);`typeCheckingMode` 类型检查严格度;`[python]` 段是 Python 文件专属设置(格式化、保存格式化、organize imports、4 空格);`terminal.activateEnvironment` 终端自动激活 venv;`files.autoSave` 自动保存。

**`.vscode/settings.json` 提交 git**:让团队共享项目配置(Linter、Formatter、解释器路径约定)。个人偏好(主题字体)放用户级,不必提交。这种"项目级共享 + 用户级个人"的分层是 VS Code 配置管理的规范做法。

### 2.12 内置终端

VS Code 内置终端(`Ctrl+`` /菜单 Terminal),打开即在项目根目录,且若选了 venv/conda 解释器,**终端会自动激活该环境**(提示符前有 `(.venv)`):

```bash
(.venv) $ pip install requests       # 装到当前 venv
(.venv) $ python app.py              # 用 venv 的 python 跑
```

终端与编辑器同窗口,写代码、装包、运行无需切外。终端默认 shell 可在 settings 设(`terminal.integrated.defaultProfile.osx/linux/win`),如 macOS 用 zsh、Windows 用 PowerShell 或 Git Bash。

`python.terminal.activateEnvironment: true`(默认)是终端自动激活 venv 的开关。若发现终端没自动激活环境,检查此项是否被关、解释器是否选对。

### 2.13 快捷键速查

VS Code 快捷键丰富,常用(Windows/Linux,macOS 把 Ctrl 换 Cmd):

| 操作 | 快捷键(Win/Linux) | 快捷键(macOS) |
|------|--------------------|---------------|
| 命令面板 | Ctrl+Shift+P | Cmd+Shift+P |
| 打开文件 | Ctrl+O | Cmd+O |
| 打开文件夹 | Ctrl+K Ctrl+O | Cmd+O(文件夹) |
| 搜索文件 | Ctrl+P | Cmd+P |
| 全局搜索 | Ctrl+Shift+F | Cmd+Shift+F |
| 内置终端 | Ctrl+` | Ctrl+` |
| 资源管理器 | Ctrl+Shift+E | Cmd+Shift+E |
| 扩展 | Ctrl+Shift+X | Cmd+Shift+X |
| 运行/调试 | F5(调试)/点按钮 | F5 |
| 格式化 | Shift+Alt+F | Shift+Option+F |
| 跳转定义 | F12 | F12 |
| 快速修复 | Ctrl+. | Cmd+. |
| 注释切换 | Ctrl+/ | Cmd+/ |
| 复制行 | Shift+Alt+Down/Up | Shift+Option+Down |
| 多光标 | Alt+点击 | Option+点击 |
| 命令行开 VS Code | code . | code . |

最核心是**命令面板 `Ctrl+Shift+P`**——VS Code 几乎所有操作都能在命令面板搜到执行,记不住快捷键时搜命令即可。先把命令面板、搜索文件、终端、运行调试几个用熟。

快捷键可在 `Cmd+K Cmd+S`(`Ctrl+K Ctrl+S`)的 Keyboard Shortcuts 里改,或装对应 IDE 的键位包(如 "PyCharm Keymap" 让 VS Code 用 PyCharm 快捷键)。

### 2.14 Git 集成

VS Code 内置 Git,可视化版本控制:

**初始化/克隆**:打开文件夹后,源代码管理(SCM,`Ctrl+Shift+G`)面板提示初始化仓库;或命令面板 "Git: Clone" 克隆远程仓库到本地。

**提交**:在 SCM 面板输入提交信息,点 √(Commit)。改动文件以颜色区分(M 修改/U 新增/D 删除),点文件查看 diff(左右对比)。

**暂存(Stage)**:改动文件可单独 "+" 暂存,或全部暂存,再提交;也可直接提交所有改动。

**分支与历史**:SCM 面板下方状态栏点分支名切换/新建;装 GitLens 扩展后,每行显示最后修改者(blame)、提交历史时间线可视化,大幅增强 Git 体验。

**合并冲突**:拉取/合并遇冲突,VS Code 用三栏(当前/结果/传入)展示,点按钮选择保留哪边,可视化解决。

**忽略文件**:`.venv/`、`__pycache__/`、`.vscode/`(部分,若含个人偏好)等加 `.gitignore`,不提交。`.vscode/settings.json` 视情况提交(项目共享配置可提,个人偏好不提)。

VS Code 的 Git 体验对日常提交、查看 diff、解决冲突足够,大型操作(rebase/cherry-pick)才需切命令行。

### 2.15 虚拟环境与 conda 集成

VS Code 对 venv/conda 都有良好支持:

**venv**:项目目录有 `.venv`,VS Code 自动检测并提示选用;或在 Select Interpreter 列表选 `.venv/bin/python`。选后运行、调试、终端、补全都基于该 venv。

**conda**:`Ctrl+Shift+P` → "Python: Select Interpreter",列表会显示 conda 环境(若 conda 在 PATH)。选某 conda 环境的 python 即绑定。终端激活 conda 环境需 conda 已 `conda init` shell。

**指定默认解释器路径**:在 settings.json 设 `python.defaultInterpreterPath`,如 `"${workspaceFolder}/.venv/bin/python"` 或 conda 路径 `~/miniconda3/envs/myenv/bin/python`,打开项目自动用该解释器,省去每次手选。

**验证环境正确**:新建 `test.py` 写 `import sys; print(sys.executable)`,运行看输出路径是否预期环境。这是排查"补全失效/运行用错环境"的标准手段——90% 此类问题是解释器没选对。

### 2.16 远程开发(SSH/容器/WSL)

这是 VS Code 相对 PyCharm 社区版的核心优势:在本地编辑,代码与运行环境在远程。

**三种远程方式**(需装官方 "Remote Development" 扩展包):

- **Remote - SSH**:连接远程服务器,本地 VS Code 编辑服务器上的代码,用服务器上的 Python 运行/调试。适合代码要跑在服务器(有 GPU、特殊依赖)但本地编辑的场景。
- **Dev Containers**:把运行环境放进 Docker 容器,VS Code 连进容器开发,保证开发环境与部署完全一致。
- **WSL**(Windows):Windows 上连 WSL(Windows Subsystem for Linux)里的 Linux 环境,享受 Linux 开发又用 Windows 桌面。Windows 做 Python 开发强烈推荐用 WSL。

**使用**:装 Remote Development 扩展包后,左下角绿色按钮或命令面板 "Remote-SSH: Connect to Host" 等,按提示连接。连接后,VS Code 界面不变,但所有操作(编辑、终端、运行、调试)都在远程,宛如本地。

远程开发让"本地轻量编辑 + 远程重环境"成为可能,对服务器开发、GPU 计算、跨平台一致部署极有价值。PyCharm 社区版无此能力,这是很多团队选 VS Code 的决定性因素。

### 2.17 Jupyter Notebook 支持

做数据科学时,VS Code 的 Jupyter 扩展(随 Python 扩展可选装)让在 VS Code 内编辑运行 `.ipynb`:

- 新建/打开 `.ipynb` 文件,出现单元格编辑界面,类似 Jupyter Lab。
- 选 Python 解释器(venv/conda)作为内核,运行单元格、查看输出与图表。
- 支持变量查看器(Variables),调试 notebook 单元格。

VS Code 写 notebook 的优势:IDE 级补全、与项目代码同窗口、可用 Git 管理 notebook。数据科学场景可把 VS Code 作为统一的 Jupyter + Python IDE。

### 2.18 折叠、代码片段与多光标

提升编辑效率的几个特性:

**代码折叠**:行号区点点折叠/展开函数、类、块,长文件导航方便。

**代码片段(Snippets)**:输入缩写按 Tab 展开模板。如 `def`、`class`、`if` 等 Python 内置 snippets;可自定义(用户 snippets,`Cmd+Shift+P` → "Configure User Snippets")。例如自定义 `main` snippet 一键展开 `if __name__ == "__main__":` 块。

**多光标**:`Alt+点击`(macOS `Option+点击`)加光标,多处同步编辑;`Ctrl+D` 选下一处相同词(`Cmd+D`),批量修改变量名;`Shift+Alt+I` 在选中多行末尾加光标。

**列选择**:`Shift+Alt+拖动` 选方块区域。

这些与 PyCharm 类似,熟练后批量编辑、重构极快。

### 2.19 常见问题排查

**问题一:Python 没有智能补全**

最常见,根因是解释器没选对或 Pylance 未装。检查:Python 扩展是否装(含 Pylance);Select Interpreter 选了正确的 venv/conda;查看输出路径 `sys.executable` 是否预期。重选解释器或重载窗口(`Cmd+Shift+P` → Reload Window)。

**问题二:运行报 "No Python interpreter"**

没选解释器。`Ctrl+Shift+P` → Select Interpreter 选一个。或 settings 设 `python.defaultInterpreterPath`。

**问题三:终端没自动激活 venv**

检查 `python.terminal.activateEnvironment` 是否 `true`(默认是);解释器是否选了 venv;终端默认 shell 是否被改。手动在终端 `source .venv/bin/activate` 也可。

**问题四:中文乱码**

文件编码。settings 设 `"files.encoding": "utf8"`;运行输出乱码在终端设环境变量 `PYTHONIOENCODING=utf-8`,或 launch.json 的 env 加 `"PYTHONIOENCODING": "utf-8"`。

**问题五:Linter/Formatter 报错或不生效**

确认装了对应工具(black 需 `pip install black`,Ruff 用扩展自带);Select Linter/Formatter 选了正确的;settings 的 `[python]` 段配置正确。Ruff 扩展自带二进制,最省心。

**问题六:扩展装多导致卡顿**

禁用/卸载不用的扩展;部分扩展可设只在特定工作区启用。VS Code 启动慢多半是扩展拖累,精简扩展是提速主要手段。

排查总思路:**命令面板 `Ctrl+Shift+P`** 搜相关命令验证功能;**Output 面板**看 Python 扩展日志;**Select Interpreter** 确认环境。多数问题(补全、运行、Linter)都指向"解释器选错"这一根因。

### 2.20 完整实战:从零配置一个 Python 项目

把各节串起来,演示从零到能用的全流程:

1. **装 VS Code**:官网下载安装,勾选加 PATH。
2. **装 Python 扩展**:`Ctrl+Shift+X` 搜 Python(微软),Install。
3. **建项目**:终端 `mkdir myproject && cd myproject && python -m venv .venv`。
4. **打开文件夹**:VS Code → File → Open Folder → 选 myproject。
5. **选解释器**:`Ctrl+Shift+P` → Python: Select Interpreter → 选 `.venv` 里的 python。状态栏显示 `Python 3.x ('.venv')`。
6. **新建 main.py**:写 `print("Hello VS Code")`,点右上角运行按钮,终端输出 Hello,说明环境通了。
7. **配 Linter/Formatter**:Select Linter 选 Ruff;settings.json(工作区)配 `[python]` 段 formatOnSave + Ruff。保存即格式化。
8. **配调试**:.vscode/launch.json 加配置,args/env 按需。`F5` 断点调试。
9. **配 Git**:SCM 面板初始化,`.gitignore` 加 `.venv/`、`__pycache__/`,提交。
10. **(可选)远程**:Remote-SSH 连服务器,在服务器上跑同一项目。

这套流程后,VS Code 成为顺手的 Python IDE:补全、运行、调试、格式化、Git 全部就绪,且配置(`.vscode/`)可提交共享。

### 2.21 工作区与多根工作区

VS Code 的"工作区(workspace)"概念值得厘清:

- **单文件夹工作区**:最常见, Open Folder 打开一个目录即一个工作区,配置存该目录 `.vscode/`。
- **多根工作区(Multi-root)**:File → Add Folder to Workspace 把多个目录加进来,适合一个工程跨多个 repo 或含子项目。配置存 `.code-workspace` 文件。
- **工作区设置优先级**:默认设置 < 用户设置 < 工作区(文件夹)设置, latter 覆盖前者。在工作区 settings.json 里设的只影响当前项目。

多根工作区的用途:如一个全栈项目,前端、后端、共享类型定义在不同目录,加进一个工作区,同窗口编辑三者,共享一套调试/终端配置。一般单项目用单文件夹即可,多根工作区是进阶用法。

### 2.22 settings.json 全层级与优先级

VS Code 设置有四个层级,优先级从低到高:

1. **默认设置**(Default Settings):VS Code 内置默认值,不可改。
2. **用户设置**(User Settings,`~/.config/Code/User/settings.json`):所有项目共用,个人偏好。
3. **工作区设置**(Workspace Settings,`.vscode/settings.json`):仅当前项目,覆盖用户设置。
4. **文件夹设置**(Folder Settings,多根工作区时各文件夹的设置):最高优先级。

打开 Settings 图形界面时,每项右侧标注它来自哪个层级(用户/工作区),改动会写进对应层级的 JSON。

实践原则:**个人偏好(主题、字体、tab 宽度个人习惯)放用户设置;项目约定(Linter、解释器路径、特定 Formatter)放工作区设置并提交 git**。这样换机器带个人偏好、团队带项目约定,互不冲突。

### 2.23 代码导航与符号搜索

大项目里快速定位代码,VS Code 导航能力:

- **Go to File**(`Ctrl+P`/`Cmd+P`):按文件名找文件。
- **Go to Symbol in File**(`Ctrl+Shift+O`/`Cmd+Shift+O`):当前文件的函数/类列表,跳转。
- **Go to Symbol in Workspace**(`Ctrl+T`/`Cmd+T`):跨整个工作区找符号(函数/类)。
- **Go to Definition**(`F12`):跳到定义。
- **Go to Implementation**(`Ctrl+F12`):接口跳到实现(面向对象时)。
- **Find All References**(`Shift+F12`):找所有引用。
- **Rename Symbol**(`F2`):安全重命名,更新所有引用(Pylance 支持 Python 重命名重构)。
- **Peek**(`Alt+F12`):不跳转,内联 peek 定义。

这些导航操作配合 Pylance 的语义理解,大型 Python 项目里穿梭自如。`Ctrl+P`(找文件)和 `Ctrl+Shift+O`(找符号)是最常用两个。

### 2.24 重构操作

VS Code(Pylance)支持若干 Python 重构,选中代码后右键 → Refactor 或快捷键:

- **Rename(`F2`)**:重命名变量/函数/类,更新所有引用。
- **Extract Method**:选中代码块提取为方法(右键 Refactor → Extract Method)。
- **Extract Variable**:选中表达式提取为变量。
- **Convert to f-string / format string**:在字符串字面量上右键,转换为 f-string 等现代写法。
- **Sort Imports**:配合 Ruff/isort,自动排序整理 import。

VS Code 的重构不如 PyCharm 全面(如 Change Signature、Move 较弱),但 Rename、Extract 等常用重构够用。复杂重构可结合 Ruff(自动改 import/字符串写法等)与手动。

### 2.25 tasks.json 任务系统

要定义可重复的构建/测试/运行任务(如"跑全部测试""构建项目"),用 `tasks.json`:

**生成**:命令面板 → "Tasks: Configure Task" → 选 "Create tasks.json from template" → Others 或 Python。生成 `.vscode/tasks.json`:

```json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "运行测试",
            "type": "shell",
            "command": "pytest",
            "args": ["-v"],
            "group": {"kind": "test", "isDefault": true},
            "problemMatcher": []
        }
    ]
}
```

之后命令面板 → "Tasks: Run Task" → "运行测试",或绑定快捷键,一键执行。`group: test` 让该任务成为默认测试任务,可用快捷键跑。

tasks.json 适合封装团队常用命令(测试/构建/lint),配合快捷键自动化重复操作,减少记忆命令负担。与 launch.json 区别:tasks.json 是"跑任务"(不需要调试),launch.json 是"调试运行"(可断点)。

### 2.26 测试集成

VS Code 的 Python 扩展内置测试支持(unittest/pytest):

**配置测试**:命令面板 → "Python: Configure Tests" → 选框架(unittest/pytest)→ 选测试目录。生成测试配置到 settings。

**测试资源管理器**:左侧"测试"(Testing)面板,树形列出所有测试用例,每个旁边有运行/调试按钮。点运行跑单个/全部,失败标红,点失败跳到断言。

**unittest/pytest 支持**:两者都支持。pytest 写法更简洁,选 pytest 后 gutter 出现运行按钮。运行测试用所选解释器(venv),故需先 `pip install pytest` 装到项目环境。

测试集成让"写测试 → 跑测试 → 看结果"全在 IDE 内,无需切终端。配合 tasks.json 可把"跑全测试"定为默认任务,快捷键一键回归测试。

### 2.27 扩展管理与工作区启用

VS Code 扩展可按工作区启用/禁用,避免全局装一堆影响所有项目:

- **在当前工作区禁用某扩展**:扩展面板找到该扩展 → 右键 → Disable (Workspace)。它只在你当前项目不生效,其他项目照常。
- **只在工作区启用**:某些扩展设为"只在某工作区启用",减少全局启动负担。

实践:特定项目专用的扩展(如某项目的专用工具)设为工作区启用;通用扩展(Python、GitLens)全局启用。这样不同项目加载不同扩展集,启动快、互不干扰。

扩展配置也可通过 `.vscode/extensions.json` 给团队推荐扩展:里面列推荐扩展 ID,打开项目时 VS Code 提示队友安装,统一团队工具链。

### 2.28 性能优化与排查

VS Code 卡顿或慢,几点排查优化:

- **扩展太多**:禁用不用的扩展,尤其重型扩展拖慢启动。扩展面板按安装时间/类型审视,精简。
- **大项目索引慢**:Pylance 对超大项目索引耗时,可设 `"python.analysis.diagnosticMode": "openFilesOnly"` 只分析打开文件(默认 pushd 整项目);或排除大目录 `"python.analysis.exclude": ["**/node_modules", "**/data"]`。
- **禁用 GPU 渲染**:界面卡顿可 `--disable-gpu` 启动(命令面板搜 "Configure Runtime Arguments")。
- **查看性能**:命令面板 → "Help: Process Explorer",看各扩展/进程占资源,定位拖累项。
- **重载窗口**:`Cmd+Shift+P` → Reload Window,清理临时状态,常解决莫名卡顿。
- **清缓存**:极端情况删 `~/.config/Code/Cache`。

多数卡顿由重型扩展或大项目索引造成,精简扩展 + 调 Pylance 分析范围即可显著改善。VS Code 本身轻量,保持扩展精简是性能关键。

---

## 3. 最佳实践

### 3.1 用 Open Folder 打开项目,而非单文件

打开文件夹让 VS Code 获取项目上下文(结构、venv、.vscode 配置),补全与项目管理才正确。养成"用 Open Folder 打开项目目录"的习惯,不双击单文件。

### 3.2 务必选对 Python 解释器

Select Interpreter 选项目的 venv/conda,是一切正常的前提。补全失效、运行报错、装包 import 不到,90% 是解释器没选对。用 `import sys; print(sys.executable)` 验证。

### 3.3 项目配置放 .vscode/,共享配置提交 git

`.vscode/settings.json`(Linter/Formatter/解释器约定)、`launch.json`(调试配置)放项目目录,提交 git 让团队共享。个人偏好(主题字体)放用户级 settings,不提交。分层管理配置。

### 3.4 保存即格式化

settings 设 `editor.formatOnSave: true` + 选 Ruff/black 作 Formatter。保存自动统一风格,团队代码永远一致,免去手动格式化与风格争论。

### 3.5 Linter/Formatter 首选 Ruff

Ruff 极快、兼 Linter+Formatter、扩展自带二进制零配置,是当前 Python 代码质量工具的新标准。新项目直接上 Ruff,省心高效。老项目可继续 black+flake8,但 Ruff 是趋势。

### 3.6 善用命令面板 Ctrl+Shift+P

VS Code 几乎所有操作都能在命令面板搜到,记不住快捷键就搜命令。命令面板是 VS Code 的"万能入口",熟用它比背快捷键更实用。

### 3.7 扩展按需装,保持精简

装太多扩展拖慢启动、可能冲突。只装确有用的,装了不用就禁用/卸载。Python + GitLens + 中文包起步,够用再补。

### 3.8 优先断点调试而非 print

`F5` 设断点调试,可暂停交互查看、条件断点、调用栈,优于 print。养成用调试器的习惯,复杂问题排查效率倍增。

### 3.9 远程开发用 Remote 扩展

代码跑服务器/GPU/容器时,用 Remote-SSH/Dev Containers/WSL,本地编辑远程执行,免去同步代码麻烦,享受本地编辑器体验。这是 VS Code 的杀手锏,善用。

### 3.10 .venv 与 __pycache__ 不入 git

`.gitignore` 加 `.venv/`、`__pycache__/`、`*.pyc`。`.vscode/settings.json` 视内容(项目共享 vs 个人偏好)决定是否提交。环境不入 git,依赖清单(`requirements.txt`)入 git。

### 3.11 配 .editorconfig 跨编辑器统一

项目根放 `.editorconfig`(缩进/换行/编码),VS Code(装 EditorConfig 扩展)与多数编辑器自动读取,跨工具风格一致。这是比 `.vscode/settings.json` 更通用的风格约定,团队多编辑器混用时尤其有用。

### 3.12 Windows 开发用 WSL

Windows 上做 Python(尤其涉及编译包/路径/脚本),强烈推荐 WSL + VS Code Remote-WSL,在 Linux 子系统里开发,避免 Windows 路径与编码坑,体验接近原生 Linux。这是 Windows Python 开发的最佳实践。

### 3.13 用 extensions.json 统一团队扩展

在 `.vscode/extensions.json` 列出推荐扩展 ID:

```json
{
    "recommendations": [
        "ms-python.python",
        "charliermarsh.ruff",
        "ms-python.vscode-pylance",
        "eamodio.gitlens"
    ]
}
```

队友打开项目时 VS Code 提示安装这些推荐扩展,一键统一团队工具链,避免"你用 Ruff 我用 flake8"的不一致。提交此文件到 git,工具链约定随之共享。

### 3.14 个人键位与 PyCharm 键位包

若从 PyCharm 转 VS Code,可不重学快捷键——装 "IntelliJ IDEA Keybindings" 扩展,VS Code 用 PyCharm/IntelliJ 键位,迁移成本接近零。或反之,在 PyCharm 装 VS Code 键位。键位是肌肉记忆,跨工具时复用旧键位能省大量适应时间。`Cmd+K Cmd+S` 可进一步自定义任意快捷键。

### 3.15 配合 Ruff 统一 Lint+Format

新项目 Linter 与 Formatter 统一用 Ruff:装 Ruff 扩展,settings 配 `defaultFormatter` 与 lint,保存即格式化+修 import。一套工具兼顾检查与格式化,比 flake8+black+isort 三件套更轻快。团队统一 Ruff,代码质量与风格问题在编辑期就被消除大半。这是当前 Python VS Code 配置的最优解。

### 3.16 项目配置最小化与可移植

`.vscode/` 里只放**团队必需、跨机器可移植**的配置(项目约定的 Linter、Formatter、推荐扩展、调试配置),不放含绝对路径或个人偏好的设置(如写死的解释器绝对路径,改用相对 `${workspaceFolder}/.venv/...` 或不写让各人自选)。这样配置提交 git 后,队友拉下即可用,无需改路径。可移植的项目配置是团队协作顺畅的基础。

### 3.17 定期审视扩展与设置

每隔一段时间审视装了哪些扩展、设置了什么——卸载不再用的扩展、清理过时设置。VS Code 用久了扩展与设置会累积冗余,定期精简保持轻快。可用 "Help: Process Explorer" 看哪些扩展占资源,优先审视重型项。保持工具精简,是把注意力留给代码本身的前提。

### 3.18 善用命令面板而非死记菜单位置

VS Code 功能庞杂,菜单层级多,死记"某功能在哪个菜单"低效。养成习惯:**想做什么,先 `Ctrl+Shift+P` 搜命令**——选解释器、选 Linter、格式化、开终端、Reload Window、配置任务,全能在命令面板搜到执行。这比翻菜单快得多,也是 VS Code 设计的预期用法。配合少数高频快捷键(F5 调试、Ctrl+P 找文件、Ctrl+`终端),日常操作行云流水。新手最该建立的习惯就是"遇事开命令面板",它能化解"不知道功能在哪"的绝大多数困惑。

---

## 4. 总结

### 4.1 本文内容回顾

- **VS Code 定位**:微软开源轻量编辑器,扩展驱动;轻量、启动快、多语言、远程开发强;与 PyCharm(开箱即用重 IDE)互补。
- **与 PyCharm 对比**:VS Code 轻量可定制、远程免费;PyCharm 开箱即用、Python 深度优化。按场景选。
- **需配置**:VS Code 开箱不认 Python,需装扩展、选解释器、配 Linter/Formatter/调试。
- **与 Python 环境关系**:VS Code 不自带 Python,通过"选择解释器"绑定外部 Python(venv/conda/系统)。
- **安装**:三平台安装,`code` 命令加 PATH,首启界面。
- **以文件夹为工作单元**:Open Folder 打开项目,`.vscode/` 放项目级配置。
- **Python 扩展**:装微软 Python 扩展(含 Pylance 补全、Python Debugger),及其他常用扩展。
- **选解释器**:Python: Select Interpreter,选 venv/conda/系统,左下角状态栏显示,最关键一步。
- **运行代码**:点运行按钮/命令面板/终端,终端自动激活 venv。
- **调试**:断点、F5、Step Over/Into/Out、Variables/Watch/Call Stack、条件断点、Debug Console。
- **launch.json**:program/args/env/cwd/justMyCode 等字段,多配置切换,可提交共享。
- **Pylance 补全**:极速精准、类型提示、快速修复(Ctrl+.)、跳转定义(F12)、悬停文档。
- **Linter/Formatter**:选用 Ruff/black/flake8/pylint,settings 配置;Ruff 推荐(兼 Linter+Formatter,快)。
- **settings.json**:用户级 vs 工作区级分层,Python 项目常用配置项,工作区配置可提交 git。
- **内置终端**:自动激活 venv/conda,与编辑器同窗口。
- **工作区/设置层级**:单文件夹 vs 多根工作区;默认<用户<工作区<文件夹四级设置优先级;个人偏好用户级、项目约定工作区级。
- **导航与重构**:找文件/符号、跳转定义、查找引用、Rename、Extract 等重构。
- **tasks.json 与测试集成**:自定义任务(测试/构建)、unittest/pytest 测试资源管理器。
- **扩展管理**:工作区启用/禁用扩展、extensions.json 团队推荐。
- **性能优化**:扩展精简、Pylance 分析范围、Process Explorer、重载窗口。
- **快捷键**:命令面板(Ctrl+Shift+P)为万能入口,核心快捷键速查。
- **Git 集成**:SCM 面板提交/diff/分支,GitLens 增强,可视化解决冲突。
- **venv/conda 集成**:自动检测、Select Interpreter、defaultInterpreterPath。
- **远程开发**:Remote-SSH/Dev Containers/WSL,VS Code 杀手锏,本地编辑远程执行。
- **Jupyter**:VS Code 内编辑运行 .ipynb,数据科学统一 IDE。
- **折叠/片段/多光标**:提效特性。
- **常见问题**:补全失效、无解释器、终端未激活、乱码、Linter 不生效的排查,多数指向解释器选错。
- **完整实战**:从零配置 Python 项目全流程。

### 4.2 读完本文你应能掌握

- 说明 VS Code 的定位与扩展驱动模式,及与 PyCharm 的取舍。
- 安装 VS Code 并配置 `code` 命令,以 Open Folder 打开项目。
- 安装 Python 扩展(含 Pylance)及其他常用扩展。
- 用 Python: Select Interpreter 正确选择 venv/conda/系统解释器,并用 `sys.executable` 验证。
- 用运行按钮/终端运行 Python,终端自动激活虚拟环境。
- 用断点、F5、单步、变量查看、条件断点调试程序,并用 Debug Console 求值。
- 编写 launch.json 配置调试参数(args/env/cwd),多配置切换。
- 配置 Linter 与 Formatter(推荐 Ruff),启用保存即格式化。
- 区分用户级与工作区级 settings.json,把项目配置放 .vscode/ 并提交共享。
- 使用命令面板、核心快捷键、内置终端高效操作。
- 用 SCM 面板与 GitLens 完成 Git 提交/diff/分支/冲突解决。
- 用 Remote-SSH/Dev Containers/WSL 进行远程开发,说明其价值。
- 在 VS Code 内编辑运行 Jupyter notebook。
- 用导航(找文件/符号/定义)与重构(Rename/Extract)大型项目里高效定位与改代码。
- 编写 tasks.json 定义测试/构建任务,用测试资源管理器跑 unittest/pytest。
- 管理扩展(工作区启用/禁用、extensions.json 推荐),并排查/优化性能(精简扩展、调 Pylance 范围)。
- 排查补全失效、无解释器、终端未激活、乱码等常见问题,多数根因是解释器选错。
- 按最佳实践配置:Open Folder、选对解释器、Ruff+格式化、远程开发、WSL、.gitignore、.editorconfig、extensions.json、可移植配置。