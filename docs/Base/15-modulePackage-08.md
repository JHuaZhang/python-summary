---
group:
  title: 【15】模块与包管理
  order: 15
order: 8
title: pyproject.toml 现代配置
nav:
  title: Python
  order: 1
---

## 1. 介绍

### 1.1 什么是 pyproject.toml

`pyproject.toml` 是 Python 项目的现代统一配置文件，采用 TOML（Tom's Obvious, Minimal Language）格式。它由 PEP 518（2016 年）首次引入，用于声明"构建这个项目需要哪些构建后端"，随后 PEP 621（2020 年）又为其补充了标准化的项目元数据声明（`[project]` 表）。经过几年的生态消化，如今 `pyproject.toml` 已经取代了 `setup.py` / `setup.cfg`，成为新项目事实上的标配入口。

在 `.py` 代码中，你声明的是"这个程序怎么跑"；在 `pyproject.toml` 中，你声明的是"这个项目是什么、依赖什么、怎么构建、构建工具怎么配置"。一句话概括它的定位：**项目的元信息中枢**。

过去一个 Python 库往往要同时维护好几个配置文件：`setup.py` 写元数据和安装逻辑、`setup.cfg` 存静态字段、`requirements.txt` 列运行依赖、`MANIFEST.in` 控制打包内容、`.flake8` 配置 flake8、`mypy.ini` 配置 mypy……文件多、分散、格式各异。`pyproject.toml` 把这些统统收编成一个文件：构建声明在 `[build-system]`，元数据和依赖在 `[project]`，各类工具（ruff、black、mypy、pytest 等）的配置都挂在各自的 `[tool.*]` 表下。从此一个项目只需要一个配置入口。

### 1.2 TOML 格式速览

`pyproject.toml` 用的是 TOML 格式，理解几个基本语法就能看懂绝大多数配置：

- 表（table）用方括号包裹，如 `[project]`、`[tool.ruff]`，相当于一个配置节。
- 键值对用 `key = value`，字符串用双引号 `"..."`，布尔值是 `true` / `false`，数字直接写。
- 数组用方括号 `[...]`，元素之间逗号分隔，可跨行写。
- 哈希表（内联表）用花括号 `{ ... }`。
- 子表用点号分隔，如 `[project.optional-dependencies]` 是 `[project]` 的子表。

一个最小的 `pyproject.toml` 长这样：

```toml
[build-system]
requires = ["setuptools>=61.0"]
build-backend = "setuptools.build_meta"

[project]
name = "demo-pkg"
version = "0.1.0"
description = "一个用于学习的最小示例包"
```

这五行就构成了一个合法的、可以被 `pip install .` 安装的项目配置。`[build-system]` 告诉 pip："构建本包请用 setuptools"；`[project]` 告诉构建后端："这个包叫 demo-pkg，版本是 0.1.0"。后面几节会逐一展开每一个字段。

**与传统 setup.py 的对比**

```python
# setup.py（传统写法，如今已不推荐新建项目使用）
from setuptools import setup

setup(
    name="demo-pkg",
    version="0.1.0",
    description="一个用于学习的最小示例包",
)
```

同样的信息，`setup.py` 需要写 Python 代码、需要导入 setuptools，而 `pyproject.toml` 是纯声明式的静态配置，不需要执行任何 Python 代码就能被解析，这也让构建过程更安全、更快。下面我们从零开始，一步步把它搭完整。

## 2. 核心内容

### 2.1 [build-system] 表：声明构建后端

`[build-system]` 是 `pyproject.toml` 中最早被规范（PEP 518）定义的部分，它回答一个前置问题：**"要构建这个项目，构建前端（如 pip）需要先准备哪些东西？"** 它有两 个必填字段：

- `requires`：一个字符串数组，列出构建本项目所依赖的包（在构建隔离环境里安装）。哪怕你用 setuptools，也要在这里显式写出来。
- `build-backend`：一个字符串，指定真正的构建后端——即那个真正会去读源码、打包的 Python 模块。

最常见的四种后端选型如下：

| 后端 | build-backend 值 | requires 写什么 | 适用场景 |
|------|------------------|------------------|----------|
| setuptools | `setuptools.build_meta` | `setuptools>=61.0` | 传统生态兼容性最好，从 setup.py 迁移成本低 |
| hatchling | `hatchling.build` | `hatchling` | PEP 621 原生支持好，现代化，Pypa 官方孵化 |
| flit-core | `flit_core.buildapi` | `flit_core>=3.2` | 极简纯 Python 包，无 C 扩展，强调"少配置" |
| poetry-core | `poetry.core.masonry.api` | `poetry-core>=1.0.0` | 配合 Poetry 工具链使用 |

**setuptools 后端的最小写法**

```toml
[build-system]
requires = ["setuptools>=61.0"]
build-backend = "setuptools.build_meta"
```

这段配置的含义：pip 在安装本项目时，会先创建一个隔离的构建环境，里面装上 `setuptools>=61.0`（注意是构建期的依赖，不是运行期），然后调用 `setuptools.build_meta` 这个模块的 PEP 517 接口来构建 wheel。`>=61.0` 不是随便写的——setuptools 从 61 版本开始才完整支持读取 `[project]` 表的元数据。

**hatchling 后端的写法**

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

Hatchling 是 PyPA 旗下 Hatch 工具的默认后端，原生按 PEP 621 读 `[project]`，配置量更少，适合新项目。

**为什么构建后端不直接复用运行环境**

构建隔离环境的存在，是为了避免"你机器上恰好装了某个版本的 setuptools，能构建；别人机器上没装就构建不了"的不确定性。pip 会按照 `requires` 在一个干净環境里重新安装一份，保证可复现。如果你确实想跳过隔离（比如调试时），可以加 `pip install . --no-build-isolation`，但日常不建议。

**如何选择后端**

- 老项目迁移、需要兼容旧的 `setup.py` 扩展逻辑：选 `setuptools`。
- 全新纯 Python 库、想要最少配置：选 `hatchling` 或 `flit-core`。
- 已经在用 Poetry 管理工作流：选 `poetry-core`。
- 包含 C 扩展且需要复杂编译逻辑：`setuptools` 仍是首选（配合 `setuptools.build_meta`）。

本文后续示例统一用 `setuptools` 后端演示，因为它兼容性最好、读者最容易上手。

### 2.2 [project] 表：项目元数据（PEP 621）

`[project]` 表是 PEP 621 定义的标准项目元数据声明区，是 `pyproject.toml` 最核心的部分。构建后端会从这里读取"这个包叫什么、作者是谁、依赖什么"等信息，填充进最终生成的 wheel 元数据。

下面把 `[project]` 表的字段分四类讲：基础元数据、描述性元数据、许可与分类、版本与 Python 要求。

#### 2.2.1 基础元数据

- `name`（必填）：包名（分发名），必须是小写字母、数字、`-`、`_`、`.` 的组合，且不能以数字开头。它是 PyPI 上的唯一标识，也是 `pip install` 时的名字。
- `version`（除非用 `dynamic` 否则必填）：版本字符串，建议遵循 PEP 440（如 `1.2.3`、`2.0.0a1`）。

```toml
[project]
name = "markdown-tools"
version = "0.3.1"
```

注意 `name` 不一定要和 `import` 时的模块名一致。例如分发名 `markdown-tools`（带连字符），实际导入的模块可以是 `markdown_tools`（带下划线）——PyPI 规范会把 `-` 归一化为 `_`，但你在代码里 `import` 的必须是实际的目录/文件名。

#### 2.2.2 描述性元数据

```toml
[project]
description = "一组 Markdown 处理小工具：标题统计、链接提取、表格校验"
readme = "README.md"
authors = [
    { name = "张三", email = "zhangsan@example.com" }
]
maintainers = [
    { name = "李四", email = "lisi@example.com" }
]
keywords = ["markdown", "text-processing", "cli"]
```

逐字段说明：

- `description`：一句话简介，会显示在 PyPI 搜索结果和 `pip show` 的 `Summary` 字段。
- `readme`：可以是字符串（指向 README 文件路径），也可以是内联表 `{ file = "README.md", content-type = "text/markdown" }` 或纯文本 `{ text = "...", content-type = "text/plain" }`。它的内容会被打包进 wheel 作为长描述，显示在 PyPI 详情页。
- `authors`：作者列表，每个元素是含 `name` 和 `email` 的内联表。这些信息会写入包元数据的 `Author` 字段。
- `maintainers`：维护者列表，格式同 `authors`。和 `authors` 的区别是语义上的：`authors` 表示"原始创作者"，`maintainers` 表示"当前负责维护的人"。
- `keywords`：关键词数组，用于 PyPI 搜索。

`authors` 和 `maintainers` 都可以省略 `email` 只留 `name`，或反过来。但建议两者都填，便于联系。

#### 2.2.3 classifiers（分类标签）

`classifiers` 是一个字符串数组，用来给 PyPI 提供结构化的分类信息——Python 版本、操作系统、许可证、开发阶段、主题等。PyPI 维护一个完整的分类器列表（可在 https://pypi.org/classifiers/ 查询），值必须是其中已有的，不能自造。

```toml
[project]
classifiers = [
    "Development Status :: 4 - Beta",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: MIT License",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.9",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
    "Operating System :: OS Independent",
    "Topic :: Text Processing :: Markup :: Markdown",
]
```

几个常用的分类器分类：

- `Development Status`：开发阶段，`3 - Alpha` / `4 - Beta` / `5 - Production/Stable` 等。
- `License`：许可证，如 `MIT License`、`Apache Software License`、`BSD License`。新项目也可以用 PEP 639 的 `License-Expression` 字段（后文 2.2.5 讲）。
- `Programming Language :: Python :: 3` 和具体的 `:: 3.10`：声明支持的 Python 版本。这里的版本范围最好和 `requires-python` 保持一致。
- `Operating System`：支持的操作系统，`OS Independent` 表示不限。
- `Topic`：主题分类，如 `Text Processing`、`Scientific/Engineering` 等。

classifiers 不影响 `pip install` 的依赖解析（那由 `requires-python` 和 `dependencies` 控制），它只是元数据，供 PyPI 检索和展示。

#### 2.2.4 requires-python（Python 版本要求）

```toml
[project]
requires-python = ">=3.9"
```

`requires-python` 是一个版本 specifier 字符串，声明本项目能运行的最小 Python 版本（以及可选的上限）。pip 在安装时会检查当前环境的 Python 版本是否符合，不符合就直接拒绝安装，不会进入依赖解析阶段。

常见的写法：

- `>=3.9`：只要 3.9 及以上。
- `>=3.9,<4`：3.9 到 4 以前（通常 `<4` 是一种防止未来大版本兼容性断裂的保守措施）。
- `>=3.9,<3.13`：限定到某个区间，适合用到了特定版本特性的项目。

这个字段和 `classifiers` 里的 `Programming Language :: Python :: 3.X` 应当保持一致：如果你声明 `requires-python = ">=3.9"`，那 classifiers 里至少应列出 3.9 以及更高的版本。

#### 2.2.5 license（许可证声明）

PEP 621 定义了两种写法：

**传统写法（配合 classifiers）**

```toml
[project]
license = { file = "LICENSE" }
classifiers = ["License :: OSI Approved :: MIT License"]
```

或用纯文本：

```toml
[project]
license = { text = "MIT License" }
```

`license = { file = "LICENSE" }` 表示许可证内容在项目根目录的 `LICENSE` 文件里，构建时会被读进元数据。`{ text = "..." }` 则直接把许可证名写死在配置里。

**PEP 639 新写法（推荐，需要较新工具链支持）**

```toml
[project]
license = "MIT"
```

PEP 639 简化为一个 SPDX 许可证表达式字符串（如 `"MIT"`、`"Apache-2.0"`、`"BSD-3-Clause"`），更简洁也更标准化。注意这要求构建后端和 pip 版本较新（大致 2024 年后），老环境可能仍需走传统写法。

#### 2.2.6 dynamic（动态元数据）

有些元数据不适合写死在 `pyproject.toml` 里——最典型的就是 `version`。很多项目习惯把版本号写在 `__init__.py` 的 `__version__` 变量里，方便代码里运行时读取；如果 `pyproject.toml` 再写一份，就要维护两处，容易不一致。`dynamic` 字段就是用来声明"这个字段我不在这里写死，由构建后端从别处动态读取"。

```toml
[project]
name = "markdown-tools"
dynamic = ["version"]
```

上面的配置表示 `version` 字段是动态的，`[project]` 表里就不能再写 `version = "..."`，否则报错。具体怎么"动态"取值，取决于构建后端和它的额外配置：

**setuptools 从文件读取版本**

```toml
[tool.setuptools.dynamic]
version = { attr = "markdown_tools.__version__" }
```

这告诉 setuptools：构建时去读 `markdown_tools/__init__.py` 里的 `__version__` 变量。假设模块里有 `__version__ = "0.3.1"`，构建出的 wheel 版本就是 `0.3.1`。

这个写法的好处是：版本号只维护在源码里一处，`pyproject.toml` 和 `import markdown_tools.__version__` 两种读取路径都能拿到同一个值。代价是构建后端必须真的能 import 到这个模块（或能静态解析出这个赋值），所以项目结构要规范。

**哪些字段可以 dynamic**

PEP 621 允许以下字段标记为 dynamic：`version`、`description`、`readme`、`authors`、`maintainers`、`keywords`、`classifiers`、`license`、`requires-python`、`dependencies`、`optional-dependencies`、`urls`、`scripts`、`gui-scripts`、`entry-points`。实践中最常用的是 `version`，其次是 `description`（从 README 第一行读取）。能写死的尽量写死，把字段标记成 dynamic 会增加构建复杂度。

### 2.3 [project] 的依赖声明

依赖声明是 `[project]` 表最常用的功能之一，分三部分：运行时依赖 `dependencies`、可选依赖 `optional-dependencies`（分组）、以及如何表达版本约束。

#### 2.3.1 dependencies（运行时依赖）

`dependencies` 是一个字符串数组，每个元素是一个 PEP 508 依赖说明符，格式为 `包名 [extras] 版本约束 ; 环境标记`。

```toml
[project]
dependencies = [
    "click>=8.0,<9",
    "rich>=13.0",
    "pyyaml~=6.0",
    "tomli>=2.0; python_version < '3.11'",
]
```

逐个说明：

- `"click>=8.0,<9"`：需要 click 8.x 系列（>=8.0 且 <9）。同时给下限和上限，是为了避免未来 click 9 破坏性改动影响本项目。
- `"rich>=13.0"`：只要 rich 13 及以上，不限上限。适合对向后兼容性比较放心的情况。
- `"pyyaml~=6.0"`：兼容版本操作符 `~=`，表示">=6.0 且 <7.0"（即允许 6.x 的补丁更新，但不跨大版本）。`~=6.0` 等价于 `>=6.0,<7`；`~=6.0.1` 则等价于 `>=6.0.1,<6.1`。
- `"tomli>=2.0; python_version < '3.11'"`：带环境标记，仅在 Python 3.11 以下才依赖 tomli（因为 Python 3.11 起 `tomllib` 进了标准库）。分号后是条件，满足时该依赖才生效。

**版本约束操作符速查**

| 操作符 | 含义 | 示例 |
|--------|------|------|
| `==` | 精确版本（通常含补丁） | `requests==2.31.0` |
| `>=` | 大于等于 | `rich>=13.0` |
| `>` | 严格大于 | `click>8.0` |
| `<=` | 小于等于 | `urllib3<=2.0` |
| `<` | 严格小于 | `click<9` |
| `~=` | 兼容版本（上界为去掉最后一段+1） | `pyyaml~=6.0` 等价 `>=6.0,<7` |
| `!=` | 排除某版本 | `urllib3!=1.26.0` |

多个约束用逗号连接，表示 AND 关系：`>=8.0,<9` 即"同时满足"。多个依赖项之间是 OR 不存在的——数组里每一项独立有效，pip 解析时是"所有依赖都要满足"。

**extras（可选功能依赖）**

```toml
[project]
dependencies = [
    "requests[socks]>=2.28",
]
```

方括号里的 `socks` 是 requests 包提供的一个 extras（额外功能集），它会额外把 socks 代理所需的 PySocks 等依赖一起装上。一个包可以提供多个 extras，逗号分隔：`"requests[security,socks]"`。

#### 2.3.2 optional-dependencies（可选依赖分组）

`optional-dependencies` 是 `[project]` 的子表，用来定义"按需安装的依赖分组"。每个键是一个组名（如 `dev`、`test`、`docs`），值是一个依赖数组。用户安装时可以写 `pip install <包名>[<组名>]` 来额外装上这个组的依赖。

```toml
[project.optional-dependencies]
dev = [
    "ruff>=0.4",
    "black>=24.0",
    "mypy>=1.10",
]
test = [
    "pytest>=8.0",
    "pytest-cov>=5.0",
    "pytest-mock>=3.12",
]
docs = [
    "sphinx>=7.0",
    "sphinx-rtd-theme>=2.0",
    "myst-parser>=3.0",
]
```

上面定义了三个组：

- `dev`：开发时用的工具（lint/format/typecheck）。
- `test`：测试时用的框架。
- `docs`：构建文档时用的 Sphinx 套件。

安装方式：

```bash
# 只装运行时依赖（dependencies）
pip install markdown-tools

# 运行时依赖 + dev 组
pip install "markdown-tools[dev]"

# 运行时依赖 + dev + test 组
pip install "markdown-tools[dev,test]"

# 本地开发：可编辑安装 + 全部开发依赖
pip install -e ".[dev,test]"
```

注意引号：在 zsh 等会解释方括号的 shell 里，`markdown-tools[dev]` 要加引号，否则 shell 会尝试做 glob 匹配。`pip install -e ".[dev,test]"` 这一行是日常开发最常用的命令——可编辑安装当前目录（`.`），同时装上 dev 和 test 两组依赖。

**组名规范**

组名是小写，只允许字母、数字、`-`、`_`、`.`。常见命名约定：

- `dev`：开发工具链总集。
- `test`：测试相关。
- `docs`：文档相关。
- `lint` / `format` / `typecheck`：更细分的工具组（也可以都塞进 `dev`）。
- `extra-feature-name`：当某个功能是可选的（比如"支持 Excel 导出"），可以用功能名做组名，用户按需开启。

**组之间互相引用**

一个组可以引用另一个组，避免重复声明：

```toml
[project.optional-dependencies]
test = [
    "pytest>=8.0",
]
dev = [
    "ruff>=0.4",
    "markdown-tools[test]",   # 引用本包的 test 组
]
```

这样 `pip install markdown-tools[dev]` 会连带装上 test 组的依赖。注意写法是 `markdown-tools[test]`（本包分发名 + extras 组名），不是直接写 `test`。

#### 2.3.3 完整依赖声明的实战示例

把上面几节合起来，给一个有真实含义的依赖配置：

```toml
[project]
name = "markdown-tools"
version = "0.4.0"
requires-python = ">=3.9"
dependencies = [
    "click>=8.1,<9",            # CLI 框架，限定 8.x
    "rich>=13.7",               # 终端美化输出
    "pyyaml~=6.0",              # 解析 YAML front-matter
    "tomli>=2.0; python_version < '3.11'",  # 3.11 前用 tomli 读 toml
    "regex>=2024.4",            # 比 re 更强的正则
]

[project.optional-dependencies]
dev = [
    "ruff>=0.4",
    "black>=24.4",
    "mypy>=1.10",
    "pre-commit>=3.7",
]
test = [
    "pytest>=8.2",
    "pytest-cov>=5.0",
    "pytest-mock>=3.14",
    "coverage>=7.4",
]
docs = [
    "sphinx>=7.3",
    "myst-parser>=3.0",
    "sphinx-rtd-theme>=2.0",
]
```

这份配置传达的信息很清晰：运行时必须 click/rich/pyyaml，开发时加 ruff/black/mypy/pre-commit，测试时加 pytest 套件，文档时加 sphinx 套件。一份文件把所有依赖场景讲清楚。

### 2.4 入口点：project.scripts 与 entry-points

入口点（entry points）是 Python 打包体系里一个非常重要的机制：它声明"安装这个包后，在 `site-packages/bin` 下生成哪些命令行命令"或"注册哪些插件"。

#### 2.4.1 project.scripts（CLI 命令）

`[project.scripts]` 是 `[project]` 的子表，每个键值对定义一个命令行命令：键是命令名（用户在终端敲的名字），值是 `模块:函数` 格式，指定这个命令调用哪个 Python 函数。

先看项目结构假设：

```
markdown-tools/
├── pyproject.toml
├── README.md
├── LICENSE
└── src/
    └── markdown_tools/
        ├── __init__.py
        ├── cli.py
        ├── stats.py
        └── extract.py
```

其中 `src/markdown_tools/cli.py` 里有一个命令函数：

```python
# src/markdown_tools/cli.py
import click

@click.command()
@click.argument("path", type=click.Path(exists=True, dir_okay=False))
def main(path):
    """统计 Markdown 文件的标题、链接、代码块数量。"""
    # 具体实现省略
    click.echo(f"统计 {path} …")
```

在 `pyproject.toml` 里注册命令：

```toml
[project.scripts]
mdtools = "markdown_tools.cli:main"
```

这表示：安装本包后，在 `$PATH` 里会生成一个 `mdtools` 命令，执行时等价于调用 `markdown_tools.cli` 模块的 `main` 函数。用户安装后：

```bash
mdtools README.md
# 输出：统计 README.md …
```

入口点的底层原理：pip 安装时，会在 `site-packages/bin/`（Windows 是 `Scripts/`）生成一个同名可执行脚本，内容大致是：

```python
#!/usr/bin/env python
from markdown_tools.cli import main
main()
```

（确切实现由构建后端决定，但行为一致：import 指定模块的指定函数并调用。）

**函数必须是无参可调用的**

`project.scripts` 指向的函数必须可以无参调用（`func()`）。Click 的 `@click.command()` 装饰器会把 `main` 包成一个 `Command` 对象，调用它时会从 `sys.argv` 读参数，所以也能无参调用——这正是 click/typer 命令能直接作为入口点的原因。

**多个命令的定义**

```toml
[project.scripts]
mdtools = "markdown_tools.cli:main"
mdstats = "markdown_tools.stats:main"
mdextract = "markdown_tools.extract:main"
```

每个命令独立声明，一个包可以提供多个 CLI 命令。

#### 2.4.2 project.gui-scripts

`[project.gui-scripts]` 用于 GUI 程序，和 `scripts` 的区别只是：在某些平台上，GUI scripts 生成的启动器不会弹出终端窗口（例如 Windows 上用 `pythonw.exe` 而不是 `python.exe`）。语法完全一样：

```toml
[project.gui-scripts]
mdtools-gui = "markdown_tools.gui:main"
```

日常库项目很少用，主要面向 Tkinter / PyQt 等桌面 GUI 应用。

#### 2.4.3 project.entry-points（插件注册）

`[project.entry-points]` 是一个更通用的插件注册表。它的子表名是"插件组名"（由消费方约定），键是该插件的标识名，值仍是 `模块:对象`。

最常见的场景是 pytest 插件：

```toml
[project.entry-points."pytest11"]
markdown_tools_plugin = "markdown_tools.pytest_plugin"
```

这表示向 pytest 的 `pytest11` 插件组注册一个名为 `markdown_tools_plugin` 的插件，实现位于 `markdown_tools.pytest_plugin` 模块。pytest 启动时会自动发现并加载它。

另一个常见场景是注册 console_scripts 之外的自定义插件组，比如给自己写一个可扩展的插件体系：

```toml
[project.entry-points."markdown_tools.exporters"]
html = "markdown_tools.exporters:HtmlExporter"
pdf = "markdown_tools.exporters:PdfExporter"
epub = "markdown_tools.exporters:EpubExporter"
```

消费侧用 `importlib.metadata.entry_points(group="markdown_tools.exporters")` 即可枚举所有已注册的导出器，实现插件化。注意当组名里含点号（如 `"markdown_tools.exporters"`）时，整个组名必须用引号包裹，否则 TOML 解析器会把点号当成表的层级分隔。

### 2.5 [project.urls]：项目链接

```toml
[project.urls]
Homepage = "https://github.com/example/markdown-tools"
Documentation = "https://markdown-tools.readthedocs.io"
Repository = "https://github.com/example/markdown-tools.git"
"Bug Tracker" = "https://github.com/example/markdown-tools/issues"
Changelog = "https://github.com/example/markdown-tools/blob/main/CHANGELOG.md"
```

`[project.urls]` 是一组键值对，键是链接类型（自由命名，但有几个约定俗成的名字），值是 URL。这些链接会显示在 PyPI 详情页的"Project links"侧栏。

常见键名：`Homepage`、`Repository`、`Documentation`、`Bug Tracker`、`Changelog`、`Source`、`Download`。键名含空格或特殊字符时要加引号，如 `"Bug Tracker"`。

### 2.6 [tool.*] 表：集中配置各类工具

`pyproject.toml` 的另一大价值：把各种工具的配置都收进 `[tool.*]` 命名空间下。每个工具认自己的子表，互不干扰。下面挑几个高频工具讲清楚怎么配。

#### 2.6.1 [tool.ruff]：代码检查与格式化

Ruff 是当下最流行的 Python linter/formatter（用 Rust 写，极快），配置都放在 `[tool.ruff]` 和它的子表。

```toml
[tool.ruff]
line-length = 100
target-version = "py39"
exclude = ["tests/fixtures", ".venv"]

[tool.ruff.lint]
select = [
    "E",    # pycodestyle errors
    "W",    # pycodestyle warnings
    "F",    # pyflakes
    "I",    # isort (import 排序)
    "B",    # flake8-bugbear
    "UP",   # pyupgrade
]
ignore = ["E501"]   # 行长度由 formatter 管，lint 阶段忽略

[tool.ruff.lint.per-file-ignores]
"tests/*" = ["B011"]  # 测试里允许 assert False 之类

[tool.ruff.format]
quote-style = "double"
indent-style = "space"
docstring-code-format = true
```

- `line-length`：一行最长字符数，ruff format 会按此折行。
- `target-version`：目标 Python 版本，影响 UP（pyupgrade）规则会建议哪些语法升级。
- `exclude`：忽略的路径。
- `[tool.ruff.lint]`：lint 规则开关，`select` 启用、`ignore` 禁用。每个字母前缀是一组规则集。
- `[tool.ruff.format]`：formatter 行为，类似 black 但更可定制。

运行命令举例：

```bash
ruff check .          # 检查问题
# 输出：Found 0 errors in 12 files.
ruff format .         # 格式化
# 输出：12 files already formatted.
```

#### 2.6.2 [tool.black]：代码格式化（传统选择）

如果还没迁到 ruff，仍可以用 Black。配置很简短：

```toml
[tool.black]
line-length = 100
target-version = ["py39", "py310", "py311"]
skip-string-normalization = false
```

- `line-length`：行宽，和 ruff 保持一致。
- `target-version`：目标版本数组。
- `skip-string-normalization`：是否跳过引号规范化（默认 false，即把单引号统一改成双引号）。如果你项目喜欢保留单引号，设为 true。

运行：

```bash
black .
# 输出：reformatted 3 files, left 9 files unchanged.
```

#### 2.6.3 [tool.mypy]：静态类型检查

```toml
[tool.mypy]
python_version = "3.9"
strict = true
warn_unused_ignores = true
warn_redundant_casts = true
disallow_untyped_defs = true
ignore_missing_imports = true

[tool.mypy.overrides]
module = "tests.*"
disallow_untyped_defs = false
```

- `python_version`：mypy 假设的目标 Python 版本。
- `strict = true`：开启严格模式（一组高严格规则的集合）。
- `disallow_untyped_defs`：禁止函数不写类型注解。
- `ignore_missing_imports`：第三方库没有类型存根时不要报错（避免噪音）。
- `[tool.mypy.overrides]`：按模块覆盖配置，这里给 `tests.*` 放宽要求（测试代码不强制类型注解）。

运行：

```bash
mypy src/markdown_tools
# 输出：Success: no issues found in 14 source files
```

#### 2.6.4 [tool.pytest.ini_options]：pytest 配置

pytest 约定把配置放在 `[tool.pytest.ini_options]` 子表，等价于旧的 `pytest.ini`。

```toml
[tool.pytest.ini_options]
minversion = "8.0"
testpaths = ["tests"]
addopts = [
    "-ra",
    "--strict-markers",
    "--cov=markdown_tools",
    "--cov-report=term-missing",
]
markers = [
    "slow: 标记跑得慢的测试",
    "network: 需要网络访问的测试",
]
```

- `testpaths`：pytest 仅在这些目录里收集测试。
- `addopts`：默认追加的命令行参数。这里加了覆盖率（`--cov`）、严格 markers 校验（`--strict-markers`，未注册的 marker 会报错）。
- `markers`：注册自定义 marker，测试用 `@pytest.mark.slow` 标注。

运行：

```bash
pytest
# 输出：14 passed in 1.23s
# ---------- coverage: platform darwin, python 3.11 ----------
# Name                        Stmts   Miss  Cover
# markdown_tools\stats.py       42      3    93%
# ...
```

#### 2.6.5 [tool.coverage]：覆盖率配置

```toml
[tool.coverage.run]
source = ["markdown_tools"]
branch = true
omit = ["*/tests/*", "*/_version.py"]

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "if TYPE_CHECKING:",
    "raise NotImplementedError",
    "if __name__ == .__main__.:",
]
show_missing = true
```

- `source`：统计哪些包的覆盖率。
- `branch`：开启分支覆盖（不只行覆盖）。
- `omit`：排除的文件。
- `exclude_lines`：匹配这些模式的行不计入未覆盖（如类型检查块、`pragma: no cover`）。

#### 2.6.6 [tool.setuptools]：setuptools 专属配置

setuptools 后端有自己的一些专属配置放在 `[tool.setuptools]`。最常用的是声明包发现规则和动态字段。

**包发现（自动发现 src 布局）**

```toml
[tool.setuptools.packages.find]
where = ["src"]
```

这告诉 setuptools 去 `src/` 目录下扫描子目录作为包。配合 `src/markdown_tools/...` 的目录结构，会自动发现 `markdown_tools` 这个包，不需要再写 `packages=["markdown_tools"]`。

**指定包含的包（显式枚举）**

```toml
[tool.setuptools]
packages = ["markdown_tools", "markdown_tools.exporters"]
```

适合包结构比较特殊、自动发现不准确时显式列出。

**包含数据文件**

```toml
[tool.setuptools.package-data]
markdown_tools = ["py.typed", "data/*.json"]
```

把 `markdown_tools/py.typed`（PEP 561 标记文件）和 `data/` 下所有 json 一起打包进 wheel，安装后 `importlib.resources` 能读到。

### 2.7 从零搭一个完整可用的 pyproject.toml

把前面所有部件拼起来，演示从零开始为一个真实小项目配出完整的 `pyproject.toml`。

**项目背景**：我们要做一个叫 `markdown-tools` 的 CLI 小工具集，功能是统计 Markdown 文件。它有命令行入口 `mdtools`，依赖 click 和 rich；开发时用 ruff + mypy + pytest；代码放在 `src/markdown_tools/` 下；版本号维护在 `__init__.py` 的 `__version__` 里。

**第 1 步：建立项目骨架**

```bash
mkdir -p markdown-tools/src/markdown_tools
cd markdown-tools
touch pyproject.toml README.md LICENSE
touch src/markdown_tools/__init__.py src/markdown_tools/cli.py
```

**第 2 步：写入最小 pyproject.toml 先跑通**

```toml
[build-system]
requires = ["setuptools>=61.0"]
build-backend = "setuptools.build_meta"

[project]
name = "markdown-tools"
version = "0.1.0"
description = "Markdown 文件统计小工具"
```

先 `pip install -e .` 跑通一个最小可安装的版本：

```bash
pip install -e .
# 输出：Successfully installed markdown-tools-0.1.0
```

至此项目已经能装上了，但没有依赖、没有命令、没有工具配置。下面逐步加内容。

**第 3 步：补全元数据和依赖**

```toml
[build-system]
requires = ["setuptools>=61.0"]
build-backend = "setuptools.build_meta"

[project]
name = "markdown-tools"
version = "0.1.0"
description = "Markdown 文件统计小工具：标题、链接、代码块计数"
readme = "README.md"
requires-python = ">=3.9"
license = { file = "LICENSE" }
authors = [{ name = "张三", email = "zhangsan@example.com" }]
keywords = ["markdown", "cli", "statistics"]
classifiers = [
    "Development Status :: 3 - Alpha",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: MIT License",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.9",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
    "Topic :: Text Processing :: Markup :: Markdown",
]
dependencies = [
    "click>=8.1,<9",
    "rich>=13.7",
]

[project.optional-dependencies]
dev = ["ruff>=0.4", "mypy>=1.10", "black>=24.4"]
test = ["pytest>=8.2", "pytest-cov>=5.0"]

[project.urls]
Homepage = "https://github.com/example/markdown-tools"
"Bug Tracker" = "https://github.com/example/markdown-tools/issues"
```

**第 4 步：添加 CLI 入口点**

在 `cli.py` 写一个简单命令：

```python
# src/markdown_tools/cli.py
import click
from rich.console import Console

console = Console()

@click.command()
@click.argument("path", type=click.Path(exists=True, dir_okay=False))
def main(path):
    """统计 Markdown 文件的标题、链接、代码块数量。"""
    with open(path, encoding="utf-8") as f:
        content = f.read()
    headings = sum(1 for line in content.splitlines() if line.lstrip().startswith("#"))
    links = content.count("](")
    code_blocks = content.count("```") // 2
    console.print(f"[bold]{path}[/bold]")
    console.print(f"  标题数: {headings}")
    console.print(f"  链接数: {links}")
    console.print(f"  代码块: {code_blocks}")
```

在 `pyproject.toml` 加入口点：

```toml
[project.scripts]
mdtools = "markdown_tools.cli:main"
```

**第 5 步：声明包发现规则**

```toml
[tool.setuptools.packages.find]
where = ["src"]
```

**第 6 步：配工具链**

```toml
[tool.ruff]
line-length = 100
target-version = "py39"

[tool.ruff.lint]
select = ["E", "W", "F", "I", "UP"]
ignore = ["E501"]

[tool.ruff.format]
quote-style = "double"

[tool.mypy]
python_version = "3.9"
ignore_missing_imports = true

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = ["-ra", "--strict-markers"]

[tool.coverage.run]
source = ["markdown_tools"]
branch = true
```

**第 7 步：把版本号改成动态**

把 `__init__.py` 改成 `__version__ = "0.1.0"`，然后在 `pyproject.toml` 里：

```toml
[project]
name = "markdown-tools"
dynamic = ["version"]
# 不再写 version = "0.1.0"

[tool.setuptools.dynamic]
version = { attr = "markdown_tools.__version__" }
```

**第 8 步：重新安装并验证**

```bash
pip install -e ".[dev,test]"
# 输出：Successfully installed markdown-tools-0.1.0 ... (附带装上 ruff/mypy/pytest 等)

mdtools README.md
# 输出：
# README.md
#   标题数: 7
#   链接数: 3
#   代码块: 2
```

至此一个从零搭起来的完整 `pyproject.toml` 就跑通了——有元数据、依赖、分组、CLI 命令、工具链、动态版本。下一节聚焦使用流程。

### 2.8 安装与使用：pip install . 与 pip install -e .

`pyproject.toml` 写好之后，安装命令只有两条，但理解它们的区别很重要。

**普通安装：`pip install .`**

```bash
pip install .
```

pip 会读取当前目录的 `pyproject.toml`，在隔离环境里用声明好的构建后端构建一个 wheel，然后装进当前环境。安装后，包的源码被复制进 `site-packages`，之后你改源码，已安装的版本不会变——要重新 `pip install .` 才会更新。

**可编辑安装：`pip install -e .`**

```bash
pip install -e .
```

`-e` 表示 editable（可编辑）。pip 会在 `site-packages` 里放一个"指向你源码目录"的链接（通常是 `.pth` 文件或 `__editable__` 包），而不是复制源码。之后你改源码，立即生效，不需要重新安装。这是本地开发最常用的方式。

**带 extras 的安装**

```bash
pip install -e ".[dev,test]"      # 可编辑 + dev 和 test 组
pip install ".[docs]"             # 非可编辑 + docs 组
```

注意方括号在 zsh/bash 里会被当 glob，必须加引号。`-e ".[dev]"` 这种写法在日常工作中出现频率非常高——一次把运行依赖和开发依赖都装好。

**从 PyPI / git 安装**

`pyproject.toml` 不影响"怎么消费包"那条路径。别人 `pip install markdown-tools` 仍然从 PyPI 装；要从 git 装就是 `pip install git+https://github.com/example/markdown-tools.git`，pip 会先 clone、读 `pyproject.toml`、构建再装。

**构建 wheel 和 sdist**

除了直接 `pip install`，你还可以让构建后端产出分发包文件：

```bash
pip install build
python -m build
# 结果：在 dist/ 下生成 markdown_tools-0.1.0-py3-none-any.whl 和 .tar.gz
```

`python -m build` 会调用 `pyproject.toml` 里声明的后端，先构建源码分发包（sdist，.tar.gz），再构建 wheel（.whl）。这两个产物可以直接上传到 PyPI（`twine upload dist/*`），也可以被别人用 `pip install dist/xxx.whl` 离线安装。

### 2.9 pyproject.toml 与 requirements.txt / setup.py 的分工

许多人会问：既然 `pyproject.toml` 已经能声明依赖，那 `requirements.txt` 是不是可以扔了？答案是：**它们职责不同，仍然并存**。

**pyproject.toml 声明"这个包依赖什么"**

`[project].dependencies` 描述的是这个包要能跑起来最少需要哪些库，通常只给版本下限或兼容范围（如 `click>=8.1,<9`），不锁定具体补丁版本。它面向的是"将这个包发布给别人用"的场景——别人 `pip install markdown-tools` 时，pip 会按这个范围去解析出合适的依赖。

**requirements.txt 锁定"环境装成什么样"**

`requirements.txt` 描述的是一个具体部署环境的精确快照，通常每个依赖都写死到精确版本（`click==8.1.7`），加上 hash 更佳。它面向的是"把这个应用部署到生产服务器"的场景——保证开发、测试、生产三套环境的依赖版本完全一致。

**两者的关系类比**

- `pyproject.toml` 像"菜谱"：写着这道菜需要"盐 适量、酱油 适量"。
- `requirements.txt` 像"采购清单"：写着"海天老抽 2.5L 一瓶，精确到品牌型号"。

发布一个库给别人用，主菜谱（`pyproject.toml`）；部署一个应用上线，主采购清单（`requirements.txt`）。两者经常同时存在：

```text
my-library/
├── pyproject.toml        # 声明运行时依赖范围
├── requirements.txt      # 锁定本应用部署的精确版本（可选）
├── requirements-dev.txt  # 开发环境锁定
└── src/
    └── my_library/
```

生成 `requirements.txt` 的常见方式是用 `pip-compile`（pip-tools 工具）或 `uv pip compile`，它会读 `pyproject.toml` 里的依赖，解析出满足所有约束的精确版本，写到 txt：

```bash
pip install pip-tools
pip-compile
# 输出：Written to requirements.txt
# requirements.txt 内容示例：
#   click==8.1.7
#   rich==13.7.1
#   ...
```

**setup.py 的命运**

`setup.py` 在新项目中已经基本退场——`pyproject.toml` 的 `[project]` 表能覆盖 `setup.py` 绝大多数静态字段。还有少数场景需要 `setup.py`：

- 需要 C 扩展编译定制逻辑（`setup` 里写 `ext_modules`，配合 `cmdclass` 定制 build）。
- 需要在构建时执行 Python 逻辑（动态生成文件等）。

即便这些场景，推荐的做法也是"配置尽量放 `pyproject.toml`，只有必须用 Python 写的部分留在精简的 `setup.py`"。一个"只剩两行"的兼容性 `setup.py` 现在也看不到了——纯静态项目连这个文件都不需要。

### 2.10 现代工具如何使用 pyproject.toml（Poetry / uv 简提）

`pyproject.toml` 是标准，但围绕它有多个上层工具链，它们都得能读 `pyproject.toml` 的标准部分（`[build-system]`、`[project]`），同时各自会加一些 `[tool.*]` 专属配置。

#### 2.10.1 Poetry

Poetry 是较早推行 `pyproject.toml` 的工具链，自己的依赖管理逻辑放在 `[tool.poetry]` 下。它历史上用 `poetry-core` 后端（`build-backend = "poetry.core.masonry.api"`），但 Poetry 1.2+ 也支持改用别的后端。一个典型 Poetry 项目的 `pyproject.toml` 可能长这样：

```toml
[tool.poetry]
name = "markdown-tools"
version = "0.1.0"
description = "Markdown 文件统计小工具"
authors = ["张三 <zhangsan@example.com>"]

[tool.poetry.dependencies]
python = "^3.9"
click = "^8.1"
rich = "^13.7"

[tool.poetry.group.dev.dependencies]
ruff = ">=0.4"
mypy = ">=1.10"

[build-system]
requires = ["poetry-core>=1.0.0"]
build-backend = "poetry.core.masonry.api"
```

注意 Poetry 用的是自己的 `[tool.poetry.dependencies]` 表，而不是标准的 `[project].dependencies`——这是历史原因（Poetry 早于 PEP 621 落地）。新版 Poetry 也开始支持把元数据迁到标准 `[project]` 表，但老项目仍常见 `[tool.poetry]` 风格。

常用命令：

```bash
poetry install          # 装 pyproject.toml 声明的所有依赖
poetry add rich         # 加一个运行依赖
poetry add --group dev ruff  # 加到 dev 组
poetry build            # 构建 wheel 和 sdist
poetry publish          # 发布到 PyPI
```

#### 2.10.2 uv

uv 是 Astral（ruff 同公司）出品的极速 Python 工具链，用 Rust 写，命令兼容 pip/pip-tools，但速度快一两个数量级。uv 完全认标准的 `[project]` 表，不需要任何 `[tool.uv]` 专属配置就能用；需要定制时再加 `[tool.uv]`。

```toml
# 标准 [project] 配置即可，uv 直接读
[project]
name = "markdown-tools"
version = "0.1.0"
dependencies = ["click>=8.1", "rich>=13.7"]

[tool.uv]
dev-dependencies = ["ruff>=0.4", "pytest>=8.2"]
```

常用命令（和 pip 风格镜像）：

```bash
uv pip install -e .             # 等价 pip install -e .
uv pip install -e ".[dev]"      # 等价 pip install -e ".[dev]"
uv pip compile -o requirements.txt   # 等价 pip-compile
uv pip sync requirements.txt    # 按锁定文件对齐环境
uv build                        # 构建分发包
uv publish                      # 发布到 PyPI
```

uv 的优势主要是速度和一体性——一条命令覆盖 venv/安装/锁定/构建/发布全流程，不再需要分别装 pip、pip-tools、build、twine。

#### 2.10.3 选择建议

- 想要最通用、最少锁定：直接用标准 `[project]` + `pip`。CI 里加 `pip install build && python -m build` 出包，再 `twine upload` 发布。
- 喜欢一体化工作流、习惯命令式管理依赖：用 Poetry（社区成熟、模板多）或 uv（更快、更新）。
- 团队已统一在某工具：跟随团队选择即可，`pyproject.toml` 的标准部分可以无缝迁移。

无论选哪个上层工具，`[build-system]` 和 `[project]` 的标准部分都通用——这是 PEP 518 / PEP 621 带来的最大好处：配置中心化了，工具可替换。

### 2.11 常见字段速查表

把前面分散讲的字段汇总成一张表，方便写配置时对照：

| 位置 | 字段 | 作用 | 是否必填 |
|------|------|------|----------|
| `[build-system]` | `requires` | 构建期依赖（隔离环境里装） | 是 |
| `[build-system]` | `build-backend` | 构建后端模块 | 是 |
| `[project]` | `name` | 分发名 | 是 |
| `[project]` | `version` | 版本（除非 dynamic） | 是* |
| `[project]` | `dynamic` | 哪些字段动态取值 | 否 |
| `[project]` | `description` | 一句话简介 | 否 |
| `[project]` | `readme` | README 文件 | 否 |
| `[project]` | `requires-python` | Python 版本范围 | 否 |
| `[project]` | `license` | 许可证 | 否（强烈建议） |
| `[project]` | `authors` | 作者列表 | 否（建议） |
| `[project]` | `maintainers` | 维护者列表 | 否 |
| `[project]` | `keywords` | 搜索关键词 | 否 |
| `[project]` | `classifiers` | PyPI 分类 | 否（建议） |
| `[project]` | `dependencies` | 运行时依赖 | 否 |
| `[project]` | `urls` | 项目链接 | 否 |
| `[project.optional-dependencies]` | `<组名>` | 可选依赖分组 | 否 |
| `[project.scripts]` | `<命令名>` | CLI 命令 | 否 |
| `[project.gui-scripts]` | `<命令名>` | GUI 命令 | 否 |
| `[project.entry-points]` | `<组名>` | 插件注册 | 否 |
| `[tool.setuptools]` | `packages` / `package-data` 等 | setuptools 专属 | 否 |

`version` 在 `dynamic` 包含 `version` 时不必填。

## 3. 最佳实践

### 3.1 能用标准 [project] 就别用工具专属表

PEP 621 的 `[project]` 表是标准，所有现代构建后端都认它。如果你只有 `name`、`version`、`dependencies`、`optional-dependencies` 这些标准字段，就别用 `[tool.poetry]`、`[tool.flit]` 之类的工具专属元数据表——标准字段保证了你的 `pyproject.toml` 在不同后端之间可迁移。一旦把元数据塞进 `[tool.poetry]`，换工具就要重写一遍配置。

反例：

```toml
# 不推荐：元数据塞进 Poetry 专属表
[tool.poetry]
name = "demo"
version = "0.1.0"
```

推荐：

```toml
# 推荐：用标准 [project] 表
[project]
name = "demo"
version = "0.1.0"
```

### 3.2 依赖加合理的版本上下界，别裸写包名

`dependencies` 里直接写 `"click"` 意味着"任意版本都行"，未来 click 出一个不兼容的大版本，你的项目突然在某一天装不上或运行报错。给一段合理的约束：

- 大多数库依赖：给下限（`>=8.1`），最好再给上限（`<9` 或 `~=8.1`）。
- 只在特定 Python 版本需要的依赖：加环境标记（`"tomli>=2.0; python_version < '3.11'"`）。
- 带可选功能的依赖：用 extras（`"requests[socks]>=2.28"`）。

但也要避免过度限制——比如把上限设得太死（`>=8.1.0,<=8.1.3`）会让别人很难在你的依赖图里和你共存。原则：宽到能容纳合理变化，窄到能挡住已知不兼容。

### 3.3 src 布局优于 flat 布局

新项目推荐 `src/` 布局（代码放在 `src/包名/` 下，pyproject.toml 配 `[tool.setuptools.packages.find] where = ["src"]`），而不是 flat 布局（代码直接放在项目根的 `包名/` 下）。原因：

- src 布局强制你"先安装再测"——测试时 import 的是已安装版本，能更早暴露"打包漏了文件"类问题。
- flat 布局下，测试可能 import 到当前目录的源码，掩盖打包配置错误。

### 3.4 把版本号写在一处，用 dynamic 同步

如果版本号既要写在源码里（方便运行时 `__version__` 读取），又要让 `pyproject.toml` 用，就用 `dynamic = ["version"]` 加 `[tool.setuptools.dynamic] version = { attr = "pkg.__version__" }` 让构建后端从源码读取，避免两处版本号不一致。绝对不要在 `__init__.py` 和 `[project].version` 里各写一份、再靠手工同步——迟早会忘。

### 3.5 dev / test / docs 分清楚

`[project.optional-dependencies]` 至少分出 `dev`、`test`、`docs` 三个组，每个组只装该场景真正需要的工具。这样做的好处：

- CI 里可以只装 `test` 组跑测试，不必装文档工具，CI 更快。
- 别人想给你的项目改文档，只装 `docs` 组即可，不必拉一整套 lint 工具。
- `pip install -e ".[dev,test,docs]"` 一行就能本地全装。

避免把所有东西都塞进一个 `dev` 组——那会让只想跑测试的人也被迫装 sphinx 一堆东西。

### 3.6 classifiers 和 requires-python 要一致

如果你写 `requires-python = ">=3.9"`，classifiers 就要把 3.9、3.10、3.11、3.12 都列出来。不一致会让 PyPI 页面显示的信息和实际安装行为不符，用户看 classifiers 以为支持 3.8，装的时候却被 `requires-python` 挡掉，体验很差。

### 3.7 入口点函数保持无参可调用

`[project.scripts]` 指向的函数必须是 `func()` 这种无参形式。如果你用 argparse 写了 `def main(args=None):`（带可选参数），click 写了 `@click.command()` 装饰的 `main`，或 typer 的 `app` 对象（注意 typer 要写 `typer.run` 或写个 thin wrapper），都可以无参调用。但如果你写的是 `def main(path, verbose):`（必填参数），就不能直接做入口点——必须包一层 wrapper，或换用 click/typer/argparse 的从 argv 读参数的写法。

### 3.8 让 [tool.*] 成为工具配置唯一入口

一个原则：某个工具如果能放 `[tool.xxx]`，就别再维护 `.flake8`、`mypy.ini`、`pytest.ini`、`.isort.cfg` 这些老配置文件。多一份配置文件就多一处可能忘记提交、可能和 `pyproject.toml` 冲突的地方。除非某个老工具完全不认 `pyproject.toml`（越来越少了），否则都应该迁过来。

### 3.9 给 PyPI 用户准备的 README 要认真写

`readme = "README.md"` 会把 README 内容塞进 wheel 的长描述，在 PyPI 详情页直接渲染。所以 README 不仅是给 GitHub 读者看的，更是给 PyPI 读者看的——里面应当有：一句话功能描述、安装命令、最小使用示例、许可证声明。渲染时 PyPI 只支持有限的 HTML/CSS（出于安全），所以别在 README 里塞 iframe、未受信链接， Suk块 也建议用 markdown 而不是 reST（除非你保持 reST 兼容）。

### 3.10 锁定 CI 的构建后端版本

`[build-system].requires` 里写 `setuptools>=61.0` 是个下限，但没上限——如果 setuptools 出了个破坏性大版本，你的 CI 可能某天突然构建失败。给关键项目加个保守的上限或锁定到主版本：

```toml
requires = ["setuptools>=61.0,<70"]
```

或者更彻底——用 `pip-compile` 生成一份 `requirements-build.txt` 把构建期依赖也锁死，CI 里 `pip install -r requirements-build.txt` 后 `--no-build-isolation` 构建。这种过度严谨对生产级核心库才有必要，普通项目给个上限足矣。

## 4. 总结

本文围绕 `pyproject.toml` —— Python 项目的现代统一配置文件 —— 系统讲清了它怎么配、怎么用、各字段干嘛。要点回顾：

- `pyproject.toml` 采用 TOML 格式，由 PEP 518（构建系统声明）和 PEP 621（项目元数据）共同定义，正在取代 `setup.py` / `setup.cfg`，是每个新项目的事实标准入口。
- `[build-system]` 表声明"构建本项目要哪些后端包和后端模块"，常见后端有 setuptools、hatchling、flit-core、poetry-core；构建在隔离环境里跑，保证可复现。
- `[project]` 表是核心：基础元数据（`name`/`version`/`description`/`readme`）、描述性元数据（`authors`/`maintainers`/`keywords`/`classifiers`/`urls`）、`license`/`requires-python`、动态字段 `dynamic`（让版本等字段从源码读取）。
- 依赖声明：`dependencies` 是运行时依赖，用 PEP 508 说明符配版本约束；`[project.optional-dependencies]` 是分组可选依赖（`dev`/`test`/`docs` 等），用 `pip install 包名[组名]` 按需安装。
- 入口点：`[project.scripts]` 定义 CLI 命令（`命令名 = "模块:函数"`），`[project.gui-scripts]` 用于 GUI，`[project.entry-points]` 注册插件（如 pytest 插件）。
- `[tool.*]` 命名空间收编各类工具配置：ruff、black、mypy、pytest、coverage、setuptools 都有自己的子表，一份文件管全部。
- 安装：`pip install .` 是普通安装（复制源码），`pip install -e .` 是可编辑安装（源码改了立即生效，本地开发用）；`python -m build` 产出 wheel 和 sdist。
- 与 `requirements.txt` 的分工：`pyproject.toml` 声明"这个包依赖什么"（范围），`requirements.txt` 锁定"环境装成什么样"（精确快照）。库用前者为主，应用部署用后者为主。
- 现代工具链 Poetry / uv 都基于 `pyproject.toml` 工作并提供自己的命令行工作流，但标准部分 `[build-system]` / `[project]` 跨工具通用。

读完本文你应能掌握：为新项目从零写出一份覆盖元数据、依赖、分组、CLI 入口、工具链配置的完整 `pyproject.toml`；在 `pip install` / `pip install -e .` / `pip install ".[dev]"` 之间根据场景正确选型；准确说明 `dependencies` 与 `[project.optional-dependencies]` 的区别、`[project.scripts]` 的函数契约；把 ruff/mypy/pytest/black 等工具的配置无歧义地收进 `[tool.*]` 表；并判断什么场景应保留 `requirements.txt`、什么场景一份 `pyproject.toml` 足够。