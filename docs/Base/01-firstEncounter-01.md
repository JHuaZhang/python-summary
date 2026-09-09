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

## 1. 介绍

### 1.1 什么是 Python

Python 是一种高级、解释型、通用的编程语言,由 Guido van Rossum 于 1991 年首次发布。Python 的设计哲学强调代码的可读性和简洁性,其语法允许程序员用更少的代码行表达概念,相比 C++ 或 Java 等语言,让开发者能够更快地编写代码。

**Python 的核心特点**:

1. **简洁易读**:Python 的语法设计追求简洁和清晰,代码看起来更像伪代码,非常适合初学者学习。Python 强制使用缩进来表示代码块,这虽然没有花括号那么灵活,但确保了代码的统一风格。

2. **解释型语言**:Python 代码不需要编译成二进制代码,而是由 Python 解释器逐行解释执行。这使得开发和调试更加快速便捷,可以立即看到代码执行结果。虽然这会导致运行速度比编译型语言慢,但现代 Python 通过 JIT(即时编译)等技术不断优化性能。

3. **跨平台性**:Python 解释器已经移植到多种平台,包括 Windows、macOS、Linux、Unix 等。Python 代码可以在任何安装了 Python 解释器的平台上运行,无需修改,这大大提高了代码的可移植性。

4. **动态类型系统**:Python 是动态类型语言,变量的类型在运行时确定,不需要在编写代码时声明变量类型。这为开发提供了极大的灵活性,但也要求开发者更加注意类型相关的错误。

5. **自动内存管理**:Python 具有自动垃圾回收机制,开发者不需要手动管理内存,这减少了内存泄漏等问题的发生。Python 使用引用计数为主,标记-清除和分代回收为辅的垃圾回收机制。

6. **丰富的标准库**:Python 拥有一个庞大的标准库,涵盖了网络编程、文件操作、正则表达式、数据库接口、GUI 开发等多个领域。标准库的丰富程度被称为"自带电池"(batteries included),开发者可以直接使用这些库完成大部分常见任务。

7. **多范式编程**:Python 支持面向过程、面向对象和函数式编程范式。开发者可以根据项目需求选择最适合的编程风格,或者在一个项目中混合使用多种范式。

8. **可扩展性**:Python 可以调用 C/C++ 编写的扩展模块,也可以将 Python 嵌入到 C/C++ 程序中。这使得 Python 在性能关键的场合可以与 C/C++ 协同工作,在保持开发效率的同时获得接近 C/C++ 的性能。

**Python 的应用领域**:

- **Web 开发**:Django、Flask、FastAPI 等框架使 Python 成为 Web 开发的热门选择。
- **数据科学**:NumPy、Pandas、Matplotlib 等库让 Python 成为数据分析的首选语言。
- **人工智能**:TensorFlow、PyTorch 等深度学习框架主要使用 Python 接口。
- **机器学习**:Scikit-learn 提供了完整的机器学习工具链。
- **自动化运维**:Ansible、SaltStack 等 DevOps 工具使用 Python 编写。
- **网络爬虫**:Scrapy、BeautifulSoup 等库让网络数据采集变得简单。
- **游戏开发**:Pygame 等库支持游戏开发。
- **桌面应用**:Tkinter、PyQt、PySide 等支持 GUI 应用开发。
- **科学计算**:SciPy、SymPy 等库支持科学研究和工程计算。

### 1.2 Python 的历史与发展

**诞生背景**:

Python 的诞生可以追溯到 1989 年的圣诞节。当时,Guido van Rossum 在荷兰国家数学与计算机科学研究中心(CWI)工作,为了打发圣诞节假期的无聊时光,他决定开发一个新的脚本解释器。Guido 希望创建一个能够继承 ABC 语言(一种教学编程语言)优点,同时吸取 Unix shell 和 C 语言特性的新语言。

**版本演进**:

1. **Python 0.9.0(1991 年)**:第一个公开发布版本,已具备类、异常处理、函数、模块等特性,引入了模块系统,这是 Python 的核心特性之一。
2. **Python 1.0(1994 年)**:添加了 lambda、map、filter、reduce 等函数式编程特性,引入了关键字参数,增加了对复数的支持。
3. **Python 2.0(2000 年)**:引入了列表推导式(List Comprehension),添加了垃圾回收机制,支持 Unicode 字符串,引入了统一的类系统。
4. **Python 2.7(2010 年)**:Python 2 系列的最后一个主要版本,引入了许多 Python 3 的特性作为过渡,官方支持持续到 2020 年。
5. **Python 3.0(2008 年)**:重大版本更新,不完全向后兼容。`print` 从语句变为函数;整数除法 `5/2` 从 `2` 变为 `2.5`;默认字符串为 Unicode;改进了异常处理语法;后续引入了 asyncio 异步编程框架。
6. **Python 3.6(2016 年)**:引入 f-string 格式化字符串,添加类型注解(Type Hints),异步生成器和推导式,新增 `secrets` 模块。
7. **Python 3.7(2018 年)**:数据类(dataclasses),字典保持插入顺序,`async`/`await` 作为保留关键字。
8. **Python 3.8(2019 年)**:海象运算符 `:=`、仅位置参数 `/`、f-string 支持 `=` 调试、字典的 `|` 合并运算符。
9. **Python 3.9(2020 年)**:字典合并运算符 `|` 和 `|=`、类型注解泛型语法 `list[int]` 代替代 `List[int]`、字符串方法 `removeprefix()`/`removesuffix()`。
10. **Python 3.10(2021 年)**:结构模式匹配 `match-case`、联合类型运算符 `int | str` 代替代 `Union[int, str]`、更好的错误提示。
11. **Python 3.11(2022 年)**:显著的性能提升(比 3.10 快 10-60%)、异常组 `except*`、精确错误位置信息、`tomllib` 标准库。
12. **Python 3.12(2023 年)**:改进的 f-string 语法、类型参数语法、性能进一步优化。

**设计哲学**:

Python 的设计哲学可以用"The Zen of Python"(Python 之禅)来概括,这是由 Tim Peters 编写的一组指导原则:

```
Beautiful is better than ugly.
Explicit is better than implicit.
Simple is better than complex.
Complex is better than complicated.
Flat is better than nested.
Sparse is better than dense.
Readability counts.
Special cases aren't special enough to break the rules.
Although practicality beats purity.
Errors should never pass silently.
Unless explicitly silenced.
In the face of ambiguity, refuse the temptation to guess.
There should be one-- and preferably only one --obvious way to do it.
Although that way may not be obvious at first unless you're Dutch.
Now is better than never.
Although never is often better than *right* now.
If the implementation is hard to explain, it's a bad idea.
If the implementation is easy to explain, it may be a good idea.
Namespaces are one honking great idea -- let's do more of those!
```

在解释器里输入 `import this` 即可看到这段原文。

### 1.3 为什么学习 Python

**易于学习**:Python 的语法接近自然语言,代码可读性极高。对于编程初学者来说,Python 是最佳的入门语言之一。代码往往比其他语言更简洁——同样的功能,Java 可能需要 100 行,Python 可能只要 20 行;缩进强制要求使代码结构一目了然;交互式解释器(REPL)能立即执行代码并看到结果,对学习和实验非常便利;学习资源与活跃社区也极其丰富。

**应用广泛**:从 Web 开发到人工智能,从自动化脚本到科学计算,Python 几乎无所不能,学习 Python 可以打开多个职业发展方向。

**市场需求旺盛**:根据 Stack Overflow、GitHub 等平台的统计数据,Python 连续多年位居最受欢迎编程语言前列。在数据科学、人工智能、机器学习等热门领域,Python 更是占据主导地位。Google、Facebook、Netflix、NASA 等都在大量使用 Python。

**生态系统完善**:Python 拥有 PyPI(Python Package Index),这是世界上最大的软件仓库之一,包含 40 多万个第三方库。无论想做什么,都可能在 PyPI 找到现成的库。

**开源免费**:Python 是完全开源的,个人和企业都可以免费使用、修改和分发 Python 及其库,降低了学习和使用门槛。

### 1.4 Python 解释器

**什么是解释器**:Python 解释器是将 Python 源代码转换为机器可以执行指令的程序。与编译型语言(如 C、C++)不同,Python 代码不需要预先编译成二进制文件,而是由解释器逐行读取代码、解释并执行。

**主流 Python 解释器**:

1. **CPython**:官方标准实现,用 C 语言编写,最广泛使用。从 python.org 下载的就是 CPython。使用 GIL(全局解释器锁)保证线程安全,但也限制了多线程性能。生态最完善,本文所有内容默认指 CPython。
2. **PyPy**:用 Python 自身编写的 Python 解释器(自我托管),集成 JIT(Just-In-Time)编译器,运行速度比 CPython 快 5-10 倍。完全兼容 CPython 的标准库,适合长时间运行的 Python 程序,如 Web 服务。启动较慢、占用内存较大。
3. **Jython**:运行在 Java 虚拟机(JVM)上的 Python 解释器,可将 Python 代码编译成 Java 字节码,能直接调用 Java 类库。适合在 Java 环境中使用 Python,目前活跃度较低。
4. **IronPython**:运行在 .NET 平台上的 Python 解释器,可以调用 .NET Framework 类库。适合在 Windows 环境下开发,目前活跃度较低。
5. **MicroPython**:专为嵌入式设备设计的 Python 解释器,能在微控制器上运行,内存占用极小。适合物联网(IoT)项目开发。

日常学习与开发默认选择 **CPython**,下文涉及"Python 解释器"除非特别说明,均指 CPython。

### 1.5 Python 2 vs Python 3

Python 2 和 Python 3 是 Python 语言的两个主要版本分支。Python 3 于 2008 年发布,引入了许多不向后兼容的改变。**2020 年 1 月 1 日,Python 官方正式停止对 Python 2 的支持**:Python 2 不再接收安全更新,不再有官方技术支持,第三方库逐渐停止支持 Python 2。

**对于新学习者:毫无疑问,直接学习 Python 3。** Python 2 已经退出历史舞台,所有新项目都应使用 Python 3。在老项目中遇到 Python 2 代码时,只需了解主要差异即可。

**主要差异对比**:

| 特性 | Python 2 | Python 3 |
|------|----------|----------|
| print | `print "hello"` | `print("hello")` |
| 整数除法 | `5/2 = 2` | `5/2 = 2.5` |
| 整数类型 | int 和 long 两种 | 只有 int,自动处理大整数 |
| 字符串类型 | str 是字节串,unicode 是文本 | str 是文本,bytes 是字节串 |
| 默认字符编码 | ASCII | UTF-8 |
| range | 返回列表 | 返回迭代器(节省内存) |
| 输入函数 | `raw_input()` 返回字符串 | `input()` 返回字符串 |
| 异常语法 | `except Error, e:` | `except Error as e:` |

**迁移工具(仅需维护老代码时了解)**:`2to3`(Python 3 自带的自动转换工具)、`six` 库(兼容层)、`future` 库(Python 3 特性 backport 到 Python 2)。新项目直接用 Python 3,无需兼容 Python 2。

### 1.6 第一个程序:Hello World

安装好 Python 后(具体安装见第 2 章),写第一个程序。最直接的方式是用交互式解释器:

```bash
python          # 或 python3,进入交互式环境(>>> 提示符)
>>> print("Hello, World!")
Hello, World!
>>> exit()      # 或按 Ctrl+D,退出
```

更规范的方式是写进文件。新建 `hello.py`,内容为一行:

```python
print("Hello, World!")
```

然后在终端运行该文件:

```bash
python hello.py
# 输出: Hello, World!
```

这行 `print("Hello, World!")` 调用内置函数 `print`,把字符串 `Hello, World!` 输出到屏幕。注意三点:必须用**英文引号**(`"` 或 `'`)包裹文本,中文引号会报语法错误;必须加**括号**(Python 3 里 `print` 是函数,`print "Hello"` 是 Python 2 写法会报 `SyntaxError`);行尾**不需要分号**(加了不报错,但不符合 Python 风格)。这三点是新手第一道坎,几乎所有人都在这儿卡过。

---

## 2. 核心内容

本章详尽讲解 Python 在各操作系统上的安装、pyenv 版本管理、环境变量配置、包管理器与虚拟环境,以及基础语法骨架。作为新手入门的第一章,环境安装是重点,务必让读者能照着把环境搭起来。

### 2.1 Windows 系统安装

**下载 Python**:

1. 访问 Python 官方网站:https://www.python.org/downloads/
2. 页面会自动检测你的操作系统,点击 "Download Python 3.x.x" 按钮。
3. 下载 Windows 安装程序(建议下载 64 位版本,除非系统是 32 位)。
4. 文件名类似:`python-3.12.0-amd64.exe`。

**安装步骤**:

1. **运行安装程序**:双击下载的 `.exe` 文件。**重要**:在安装界面底部,**务必勾选** `Add Python 3.x to PATH`(将 Python 添加到系统环境变量,这样可以在命令行直接使用 `python` 命令);可选勾选 `Install for all users`(为所有用户安装,需要管理员权限)。
2. **选择安装方式**:`Install Now`(推荐,使用默认设置,适合初学者)或 `Customize installation`(自定义安装路径和组件)。
3. **等待安装完成**:安装程序会自动下载并安装 Python,完成后显示 "Setup was successful"。
4. **验证安装**:按 `Win + R`,输入 `cmd`,打开命令提示符,输入:

```bash
python --version        # 应显示类似 Python 3.12.0
python -V               # 同上
pip --version           # 验证 pip,应显示 pip 版本与所属 python
```

5. **测试交互环境**:在命令提示符中输入 `python` 进入 REPL:

```python
>>> print("Hello, Python!")
Hello, Python!
>>> 1 + 2
3
>>> exit()              # 或按 Ctrl+Z 然后回车退出
```

**常见问题**:

**问题一:`python` 不是内部或外部命令**

原因:安装时忘记勾选 "Add Python to PATH"。解决:重新安装勾选,或手动添加环境变量——右键"此电脑" → 属性 → 高级系统设置 → 环境变量,在"系统变量"中找到 "Path" 点击"编辑",添加 Python 安装路径(如 `C:\Users\你的用户名\AppData\Local\Programs\Python\Python312`)和 Scripts 路径(`...\Python312\Scripts`),确定保存,重开命令提示符。

**问题二:安装权限不足**

解决:右键安装程序,选择"以管理员身份运行"。

**问题三:多个 Python 版本冲突**

解决:用 `py -3.12` 指定特定版本,或使用虚拟环境(venv)隔离不同项目(见 2.6)。

### 2.2 macOS 系统安装

**背景:macOS 自带 Python 的问题**

macOS 系统自带一个 Python(通常是较旧版本,如 macOS Monterey 自带 3.9.6),但它有两个问题:第一,版本较旧,无法享受新版本的语法和性能改进;第二,系统自带的 Python 是为系统工具服务的,直接用 `pip` 往里装包可能破坏系统依赖。因此,**不建议直接使用系统自带的 Python 做开发**,应该自行安装一个独立管理的版本。

macOS 上安装 Python 有三种主流方式,推荐程度从高到低:

| 方式 | 适合谁 | 优点 | 缺点 |
|------|--------|------|------|
| **pyenv**(强烈推荐) | 所有开发者 | 多版本自由切换,不污染系统,项目级版本控制 | 需要配置环境变量 |
| Homebrew | 只需一个 Python 版本 | 一条命令搞定,自动管理更新 | 多版本切换不方便 |
| 官方安装包 | 完全初学者 | 图形化操作,最简单 | 不利于后续多版本管理 |

**方法一:pyenv 安装(强烈推荐)**

pyenv 是 Python 版本管理工具,允许你在同一台机器上安装多个 Python 版本,并随时切换。这是 macOS 上最推荐的 Python 安装方式,无论你是初学者还是有经验的开发者,pyenv 都能帮你避免"系统自带 Python 版本太旧""多个项目需要不同 Python 版本"等常见痛点。

完整的 pyenv 使用见 2.4 章,这里给出最简安装流程:

**1. 安装 pyenv**

通过 Homebrew 安装(需要先装 Homebrew,见方法二中的 Homebrew 安装步骤):

```bash
brew install pyenv
```

**2. 配置 Shell 环境变量**

macOS 默认 Shell 是 zsh,编辑 `~/.zshrc`,在文件末尾添加以下三行:

```bash
export PYENV_ROOT="$HOME/.pyenv"
[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"
```

> 如果你的 Shell 是 bash,则编辑 `~/.bash_profile`,内容相同。

**3. 使配置生效**

```bash
source ~/.zshrc
```

**4. 验证 pyenv 安装**

```bash
pyenv --version
# 输出: pyenv 2.x.x
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
# 输出: Python 3.12.0
```

配置完成后,`python` 命令就指向 pyenv 管理的 3.12.0,而不再是系统自带的旧版本。更详细的多版本管理、项目级切换等用法见 2.4 章。

**方法二:Homebrew 安装**

Homebrew 是 macOS 上的包管理器,适合只需要一个 Python 版本、不想折腾多版本管理的用户。

**1. 安装 Homebrew**(如果还没有):

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

> 国内网络访问 GitHub 可能较慢或被墙,可使用中科大源安装,安装后按提示配置:`https://unicom.mirrors.ustc.edu.cn/help/brew.git.html`。

**2. 安装 Python**:

```bash
brew install python
```

Homebrew 会自动安装最新版 Python 3,并配置好 PATH。

**3. 验证安装**:

```bash
python3 --version
pip3 --version
```

**4. 更新 Python**(后续需要时):

```bash
brew update
brew upgrade python
```

**5. 配置命令别名**(可选,想直接用 `python` 命令而不是 `python3` 的话):在 `~/.zshrc` 中添加:

```bash
alias python='python3'
alias pip='pip3'
```

然后运行 `source ~/.zshrc` 使配置生效。

**方法三:官方安装包**

适合完全不熟悉命令行、只想用图形化方式安装的用户。

1. 访问 https://www.python.org/downloads/macos/,下载最新的 macOS 安装包(`.pkg` 文件)。
2. 双击 `.pkg` 文件,按安装向导完成安装,安装程序会自动配置 PATH。
3. 验证安装:

```bash
python3 --version
pip3 --version
```

> 这种方式安装的 Python 不方便做多版本管理,后续如果需要多版本,建议迁移到 pyenv。

### 2.3 Linux 系统安装

**Ubuntu/Debian**:

```bash
# 更新包列表
sudo apt update

# 安装 Python 3 和 pip
sudo apt install python3 python3-pip -y

# 验证安装
python3 --version
pip3 --version

# 安装开发工具(编译 Python 扩展需要)
sudo apt install python3-dev python3-venv -y
```

**CentOS/RHEL/Fedora**:

```bash
# CentOS/RHEL
sudo yum install python3 python3-pip -y

# Fedora
sudo dnf install python3 python3-pip -y

# 验证安装
python3 --version
pip3 --version
```

**从源码编译安装**(用于安装特定版本):

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
make -j $(nproc)                       # 使用所有 CPU 核心加速编译
sudo make altinstall                   # 用 altinstall 避免覆盖系统 Python

# 验证安装
python3.12 --version
```

**重要提示**:Linux 系统通常自带 Python,且系统工具依赖 Python,因此**不要卸载系统自带的 Python**,否则可能导致系统问题;使用 `python3` 命令运行 Python 3(`python` 通常指向旧版);建议使用虚拟环境,避免污染系统 Python 环境。

### 2.4 pyenv:统一管理 Python 版本

**什么是 pyenv**

pyenv 是一个 Python 版本管理工具,让你在同一台机器上安装和管理多个 Python 版本,并能在全局、项目级甚至 Shell 级别灵活切换。它通过在 PATH 前面插入 "shims"(拦截层)来实现版本切换——当你运行 `python` 时,pyenv 的 shim 会根据当前目录的 `.python-version` 文件或全局设置,决定实际调用哪个版本的 Python。

**为什么用 pyenv 而不是直接用系统自带的 Python**

以 macOS 为例,系统自带 Python 3.9.6,但你可能想用 3.12。没有 pyenv 时,你可能想到用 Homebrew 装一个 3.12,但这样 `python3` 到底指向系统的还是 Homebrew 的,取决于 PATH 顺序,容易混乱。pyenv 解决了这个问题:它接管 `python`/`python3`/`pip` 等命令的版本路由,让你一条命令切换全局或项目级 Python 版本,且不干扰系统自带的 Python。

**pyenv 的核心概念**

| 概念 | 说明 | 设置方式 |
|------|------|---------|
| **shims（拦截层）** | pyenv 在 PATH 前插入的代理,拦截 `python` 等命令,决定实际调用哪个版本 | `eval "$(pyenv init -)"` 自动创建 |
| **global（全局版本）** | 全局默认使用的 Python 版本,当没有 local/shell 版本时生效 | `pyenv global 3.12.0` |
| **local（项目级版本）** | 在当前目录下设置的 Python 版本,写入 `.python-version` 文件 | `pyenv local 3.11.5` |
| **shell（会话级版本）** | 仅在当前 Shell 会话有效的版本,优先级最高 | `pyenv shell 3.10.0` |

**版本优先级**:shell > local > global。即如果当前 Shell 设了 shell 版本就用 shell 版本;没设但当前目录有 `.python-version` 文件就用 local 版本;都没有就用 global 版本。

**安装 pyenv**

如果已经在 2.2 章安装了 pyenv,跳过此步。否则:

```bash
# 通过 Homebrew 安装
brew install pyenv

# 验证
pyenv --version
# 输出: pyenv 2.x.x
```

**配置 Shell 环境变量（关键步骤）**

pyenv 安装后需要配置 Shell 才能生效。macOS 默认 Shell 是 zsh:

```bash
# 编辑 ~/.zshrc,在文件末尾添加以下三行
export PYENV_ROOT="$HOME/.pyenv"
[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"
```

> 如果你的 Shell 是 bash,则编辑 `~/.bash_profile`,内容相同。

**这段配置做了什么**:
- 第 1 行:设置 pyenv 的根目录,所有 pyenv 管理的 Python 版本都装在 `~/.pyenv/versions/` 下。
- 第 2 行:把 pyenv 的可执行文件目录加到 PATH 前面。
- 第 3 行:`pyenv init -` 输出一段 Shell 脚本,会在 PATH 最前面插入 shims 目录(`~/.pyenv/shims`),这样 `python`/`pip` 等命令会先走 pyenv 的 shim,再由 shim 决定调用哪个版本。

配置后让设置生效:

```bash
source ~/.zshrc
```

**验证配置是否生效**:

```bash
# 查看 PATH 中是否包含 .pyenv/shims
echo $PATH | tr ':' '\n' | grep pyenv
# 应输出类似: /Users/mac/.pyenv/shims
```

**安装 Python 版本**

```bash
# 查看所有可安装的版本（列表很长,可用 grep 过滤）
pyenv install --list | grep 3.12

# 安装 Python 3.12.0
pyenv install 3.12.0

# 查看已安装的版本
pyenv versions
# 输出:
#   system
# * 3.12.0 (set by /Users/mac/.pyenv/version)
# * 表示当前活跃的版本
```

> **安装速度慢？** pyenv 安装 Python 是从源码编译,首次安装可能需要几分钟。国内网络可以从 Python 官方 FTP 下载速度较慢,可以设置镜像加速:
>
> ```bash
> export PYTHON_BUILD_MIRROR_URL=https://mirrors.huaweicloud.com/python
> pyenv install 3.12.0
> ```
>
> 或者通过 Homebrew 安装预编译版本(不需要编译,速度更快):
>
> ```bash
> brew install python@3.12
> ```

**设置全局默认版本**

```bash
# 设置全局默认版本为 3.12.0
pyenv global 3.12.0

# 验证当前使用的 Python 版本
python --version
# 输出: Python 3.12.0

# 验证 python 命令指向的路径
which python
# 输出: /Users/mac/.pyenv/shims/python
# 注意:不再是 /usr/bin/python 或 /usr/local/bin/python3
```

**项目级版本切换**

当不同项目需要不同 Python 版本时,用 `pyenv local` 设置项目级版本:

```bash
# 进入项目目录
cd myproject

# 设置该项目使用 Python 3.11.5
pyenv local 3.11.5
# 这会在当前目录创建一个 .python-version 文件,内容为 3.11.5

# 验证:在该目录下 python 版本已切换
python --version
# 输出: Python 3.11.5

# 退出该目录后,版本恢复为 global 版本
cd ..
python --version
# 输出: Python 3.12.0
```

`.python-version` 文件可以提交到 git,这样团队成员 clone 后 pyenv 会自动使用对应版本(前提是已安装该版本)。

**会话级版本切换**

临时在当前终端切换版本,不影响其他终端:

```bash
pyenv shell 3.10.0
python --version
# 输出: Python 3.10.0

# 关闭终端后失效
```

**常用命令速查表**

| 命令 | 作用 | 示例 |
|------|------|------|
| `pyenv install --list` | 列出所有可安装版本 | `pyenv install --list \| grep 3.12` |
| `pyenv install <ver>` | 安装指定版本 | `pyenv install 3.12.0` |
| `pyenv uninstall <ver>` | 卸载指定版本 | `pyenv uninstall 3.10.0` |
| `pyenv versions` | 列出已安装版本(* 标记当前版本) | `pyenv versions` |
| `pyenv version` | 显示当前版本 | `pyenv version` |
| `pyenv global <ver>` | 设置全局版本 | `pyenv global 3.12.0` |
| `pyenv local <ver>` | 设置项目级版本(写入 `.python-version`) | `pyenv local 3.11.5` |
| `pyenv shell <ver>` | 设置会话级版本 | `pyenv shell 3.10.0` |
| `pyenv which python` | 显示当前 python 实际指向的路径 | `pyenv which python` |
| `pyenv rehash` | 刷新 shims（安装新包后执行） | `pyenv rehash` |

**常见问题与排查**

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| `python --version` 仍显示系统版本 | `.zshrc` 配置未生效或 PATH 顺序不对 | 确认 `eval "$(pyenv init -)"` 在 `~/.zshrc` 末尾,运行 `source ~/.zshrc`,检查 `which python` 是否指向 `~/.pyenv/shims/python` |
| `pyenv: command not found` | pyenv 未安装或 PATH 未配置 | 确认 `brew install pyenv` 已执行,且 `~/.zshrc` 中有 `export PATH="$PYENV_ROOT/bin:$PATH"` |
| `pyenv install` 报编译错误 | 缺少编译依赖 | macOS 上执行 `brew install openssl readline sqlite3 xz zlib tcl-tk` 后重试 |
| `pyenv install` 速度慢 | 从源码编译 + 网络下载慢 | 设置镜像 `export PYTHON_BUILD_MIRROR_URL=https://mirrors.huaweicloud.com/python`,或用 `brew install python@3.12` |
| `pyenv global` 后 `pip` 不可用 | 新装的 Python 还没有 pip | 确认安装的是完整版 Python(非嵌入式),运行 `python -m ensurepip --upgrade` |
| shim 没有正确拦截命令 | 安装新版本后未 rehash | 运行 `pyenv rehash` 刷新 shims |

### 2.5 环境变量配置

**PATH 环境变量**:PATH 环境变量告诉操作系统在哪些目录中查找可执行文件。Python 安装后,需要将其添加到 PATH 中才能在命令行直接使用 `python` 和 `pip` 命令。

**Windows 系统**:安装时若勾选 "Add Python to PATH" 会自动配置。忘记勾选则手动添加:找到 Python 安装路径(默认 `C:\Users\你的用户名\AppData\Local\Programs\Python\Python312`)和 Scripts 路径(`...\Python312\Scripts`),右键"此电脑" → 属性 → 高级系统设置 → 环境变量,在"用户变量"或"系统变量"中找到 "Path" → "编辑" → "新建",添加上述两个路径,确定保存,重开命令提示符验证 `python --version`。

**macOS/Linux 系统**:Python 安装后通常会自动配置 PATH。需要手动配置时,先用 `which python3` 确定安装路径(通常 `/usr/local/bin/python3` 或 `/usr/bin/python3`),再编辑配置文件(macOS 默认 zsh 用 `~/.zshrc`,bash 用 `~/.bash_profile`):

```bash
export PATH="/usr/local/bin:$PATH"
export PATH="/Library/Frameworks/Python.framework/Versions/3.12/bin:$PATH"
```

使配置生效:`source ~/.zshrc`(或 `source ~/.bash_profile`)。

**`python` vs `python3` 的区别**:在 macOS 和 Linux 上,`python` 可能指向系统自带的旧版 Python,`python3` 才是 Python 3。务必确认你用的命令对应 3.x 版本,建议统一用 `python3`/`pip3`,或在 shell 配置里设别名。Windows 上一般 `python` 直接就是 Python 3。

### 2.6 虚拟环境 venv

真实开发中,不同项目依赖不同版本的第三方包(项目 A 要 Django 3,项目 B 要 Django 4),全装在系统全局会冲突。`venv` 是 Python 标准库提供的虚拟环境工具,为每个项目建一个独立的包安装目录,隔离互不影响。

**创建并激活虚拟环境**:

```bash
# 在项目目录下创建名为 .venv 的虚拟环境
python -m venv .venv           # Windows 可能是 python -m venv .venv

# 激活(macOS/Linux)
source .venv/bin/activate

# 激活(Windows 命令提示符)
.venv\Scripts\activate.bat

# 激活(Windows PowerShell)
.venv\Scripts\Activate.ps1

# 激活后命令行提示符前会出现 (.venv),表示当前在虚拟环境中
# 此时 pip install 装的包只进 .venv,不影响系统
(.venv) $ pip install requests

# 退出虚拟环境
deactivate
```

激活后,`python` 和 `pip` 都指向虚拟环境内的版本,`pip install` 装的包也只在该环境里。这样每个项目的依赖就彼此隔离了。养成"每个项目先建 venv 再开发"的习惯,能省去大量环境冲突的麻烦。

**PowerShell 执行策略问题**:Windows PowerShell 首次激活可能报"无法加载文件,因为在此系统上禁止运行脚本"。解决:以管理员身份打开 PowerShell,执行 `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`,之后即可激活。

**`.venv` 不要提交到 git**:虚拟环境目录体积大且与机器相关,应加进 `.gitignore`,只提交依赖清单 `requirements.txt`(`pip freeze > requirements.txt`),别人拿到项目后 `pip install -r requirements.txt` 复现环境。

### 2.7 pip 包管理

`pip` 是 Python 的包管理器,从 PyPI 安装第三方包。常用命令:

```bash
pip install requests             # 安装最新版
pip install requests==2.31.0     # 安装指定版本
pip install "requests>=2.25"     # 安装不低于 2.25 的版本
pip install -r requirements.txt  # 按依赖清单批量安装
pip uninstall requests           # 卸载
pip list                         # 列出已装包
pip show requests                # 查看某包详情(版本/位置/依赖)
pip freeze > requirements.txt    # 导出当前环境依赖清单
pip install --upgrade requests   # 升级到最新版
```

**`requirements.txt`**:把依赖写进这个文件,别人 `pip install -r requirements.txt` 就能复现环境,是 Python 项目的标准做法。典型内容:

```
requests==2.31.0
numpy>=1.21
pandas
```

**强烈建议在虚拟环境里用 pip**(见 2.6),避免污染系统 Python。多环境时用 `python -m pip` 而非裸 `pip`,确保装进当前解释器的环境——这点在多版本/多 venv 时极重要,否则容易装错地方。

**国内换源加速**:PyPI 官方源在国内访问慢,可换成国内镜像:

```bash
# 临时使用某镜像安装
pip install requests -i https://pypi.tuna.tsinghua.edu.cn/simple

# 永久配置默认镜像
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
```

常用国内镜像:

- 清华:`https://pypi.tuna.tsinghua.edu.cn/simple`
- 阿里:`https://mirrors.aliyun.com/pypi/simple`
- 中科大:`https://pypi.mirrors.ustc.edu.cn/simple`

### 2.8 三种运行方式

Python 解释器有三种常见运行方式:

**1. 交互式模式(REPL)**:终端输入 `python`(无参数)进入,出现 `>>>` 提示符,逐行输入立即执行并看到结果,适合快速试验、查 API、当计算器用:

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

**2. 脚本模式**:把代码写进 `.py` 文件,用 `python 文件名` 运行整份代码,适合写完整程序:

```bash
$ python myscript.py
```

这是最常用的方式。

**3. 模块方式 `-m`**:用 `python -m 模块名` 把模块当脚本运行,常用于运行标准库工具:

```bash
python -m venv .venv          # 运行 venv 模块创建虚拟环境
python -m http.server 8000    # 启动一个简易 HTTP 服务器
python -m json.tool data.json # 格式化 JSON 文件
python -m pip install xxx     # 用 -m 调 pip,确保用的是当前解释器的 pip
```

`-m` 的好处是"用当前这个 python 对应的模块",避免 `pip` 命令指向别的解释器装错地方。

### 2.9 基础语法骨架

正式写代码前,先建立 Python 语法的基本骨架认知,后续笔记会逐项深入。Python 语法与 C/Java 最显著的区别有两点:**用缩进表示代码块**、**不需要语句结束符**。

**用缩进表示代码块**:Python 不用 `{}` 包裹块,而是用行首空格的多少来界定一个块属于哪个控制结构:

```python
x = 5
if x > 0:
    print("正数")        # 这行缩进 4 空格,属于 if 块
    print("处理中")      # 同样缩进,也属于 if 块
print("结束")            # 不缩进,不属于 if 块,总会执行
```

`if x > 0:` 后面、缩进相同的几行构成 if 的代码块;回到顶层(不缩进)的 `print("结束")` 就不属于 if 了。缩进必须**一致**(同一块内缩进相同),混用空格和 Tab 会报 `TabError` 或 `IndentationError`。约定用 **4 个空格**缩进(PEP 8 规范)。

**不需要语句结束符**:每条语句独占一行,行尾不写分号:

```python
a = 1
b = 2
c = a + b
```

一行写多条语句可用分号(`a=1; b=2`),但不推荐。一条语句跨多行可用反斜杠 `\` 或括号续行:

```python
total = 1 + 2 + 3 + \
        4 + 5         # 反斜杠续行

names = ["alice", "bob",
         "carol"]     # 括号内可直接换行,更推荐
```

**注释**:用 `#` 开头,该行后续内容被解释器忽略:

```python
# 这是单行注释
x = 5  # 行尾也可加注释
"""这是多行字符串,
通常用作模块/函数/类的文档说明(docstring),
常被当多行注释用。"""
```

**标识符命名规则**:变量名、函数名等标识符由字母、数字、下划线组成,不能以数字开头,区分大小写,不能用关键字(`if`/`for`/`class` 等)。约定:变量函数用 `snake_case`(小写下划线),类名用 `CamelCase`(首字母大写),常量用 `UPPER_CASE`。

### 2.10 字符串字面量与引号

Python 字符串可用单引号 `'...'`、双引号 `"..."` 或三引号 `'''...'''`/`"""..."""` 表示,效果等价,选用规则看内容:

```python
s1 = 'hello'           # 单引号
s2 = "hello"           # 双引号,与 s1 完全一样
s3 = "it's a pen"      # 内含单引号,用双引号包裹,避免转义
s4 = 'she said "hi"'   # 内含双引号,用单引号包裹
s5 = "it\'s ok"        # 用反斜杠转义引号也可,但不如换引号清晰
```

**三引号**用于跨多行的字符串,也用作文档字符串(docstring):

```python
poem = """静夜思
床前明月光
疑是地上霜"""
print(poem)            # 输出保留换行

def add(a, b):
    """返回 a 与 b 的和。"""
    return a + b

help(add)              # 会显示上面那段 docstring
```

**原始字符串 `r"..."`**:反斜杠不转义,适合写正则、Windows 路径:

```python
path = r"C:\new\folder"   # 原样,不会把 \n 当换行
```

### 2.11 基础输入输出

构建交互的最小闭环靠 `input`(读)和 `print`(写):

```python
name = input("你叫什么? ")           # 读入,返回字符串
print("你好,", name)                  # 输出
age = int(input("几岁? "))            # 读入并转整数
print(f"明年 {age + 1} 岁")           # 格式化输出
```

`input` 永远返回字符串,做运算要先 `int()`/`float()` 转换;`print` 的 `sep`/`end` 控制分隔与结尾。这两者有专门笔记详述。

### 2.12 查看环境信息

开发中常需确认环境信息,几个实用命令:

```bash
python --version              # Python 版本
python -c "import sys; print(sys.executable)"   # 当前解释器路径
python -c "import sys; print(sys.path)"         # 模块搜索路径
pip list                      # 已装包列表
pip show requests             # 某包版本/位置/依赖
```

`python -c "代码"` 用 `-c` 直接运行一行代码,适合快速查信息而不建文件。`sys.executable` 显示当前 python 的真实路径,多环境排错时极有用——能确认 `pip` 装的包是不是进对了解释器。

在脚本里查版本信息:

```python
import sys, platform
print(sys.version)            # 完整版本信息字符串
print(sys.version_info)       # 结构化版本
print(sys.platform)           # 平台,如 'win32'/'darwin'/'linux'
print(platform.system())      # 'Windows'/'Darwin'/'Linux'
print(platform.python_version())
```

判断平台做条件逻辑(如选不同路径分隔符)时,`sys.platform` 或 `platform.system()` 很有用。

### 2.13 shebang 与可执行脚本

在 macOS/Linux 上,可以给脚本加上 **shebang** 行,让它能像原生命令一样直接执行(不用写 `python` 前缀)。shebang 是脚本第一行以 `#!` 开头,告诉系统用哪个解释器运行:

```python
#!/usr/bin/env python3
# 上面这行是 shebang,推荐用 env 定位 python3,跨发行版更通用
print("我可直接执行")
```

`#!/usr/bin/env python3` 比 `#!/usr/bin/python3` 更推荐,因为它通过 `env` 在 PATH 里找 `python3`,不依赖 Python 装在固定路径。Windows 不认 shebang(靠文件关联),这行在 Windows 上会被当注释忽略,所以加了不影响跨平台。赋予执行权限后直接运行:

```bash
chmod +x demo.py       # 赋予可执行权限(只做一次)
./demo.py              # 直接执行,无需写 python 前缀
```

### 2.14 交互式调试:python -i 与断点

**`python -i`**:运行完脚本后不退出,进入交互式环境,保留脚本里定义的所有变量,便于事后排查:

```bash
python -i myscript.py
# 脚本执行完后,停留在 >>> 提示符
# 此时所有变量还在,可直接查看
>>> x        # 查看脚本里 x 的值
>>> func()   # 可继续调用脚本里的函数
```

这对调试尤其实用:脚本跑到出错或结束,变量现场还在,能交互式地探查状态,而不必在源码里加一堆 `print`。

**`breakpoint()`**(Python 3.7+):在代码里插入 `breakpoint()` 会启动调试器(默认 `pdb`),程序运行到这行暂停,可逐行查看:

```python
def calc(x):
    y = x * 2
    breakpoint()      # 运行到这里暂停,进入 pdb
    return y + 1
```

进入 pdb 后可用命令:`n`(下一行)、`s`(步入)、`c`(继续)、`p 变量`(打印)、`l`(看代码)、`q`(退出)。相比 `print` 调试,断点能停下来交互查看任意表达式,适合复杂问题排查。

### 2.15 编辑器与 IDE 选择

写 Python 不必只用记事本,选个趁手的编辑器/IDE 能事半功倍:

- **VS Code**:免费、轻量、插件生态强,装 Python 扩展后支持智能提示、调试、虚拟环境识别,是目前最流行的通用选择。新手推荐。
- **PyCharm**:JetBrains 出品的专业 Python IDE,社区版免费,开箱即用的项目管理、调试、重构能力强,适合大型项目,但较重。
- **Jupyter Notebook**:以"单元格"形式交替写代码与文档,适合数据科学探索,能即时看到每步输出和图表。
- **IDLE**:Python 自带的简易 IDE,装完 Python 就有,功能基础,适合最初期练手。
- **Sublime Text / Vim / Emacs**:轻量编辑器,配合插件可写 Python,适合有偏好的开发者。

新手起步建议 **VS Code + Python 扩展**,并在设置里指定虚拟环境的解释器,这样编辑器的智能提示与终端用的解释器一致。

### 2.16 conda / Anaconda(数据科学方向)

`conda` 是另一个流行的包与环境管理器,常以 Anaconda(完整发行版,含大量数据科学包)或 Miniconda(仅含 conda 与 Python,精简版)形式安装。与 pip/venv 的区别:

- `conda` 既能管 Python 包,也能管**非 Python 依赖**(如 C 库、CUDA),装 numpy/scipy 这类带编译依赖的包更省心。
- `conda` 自带环境管理(`conda create -n 环境名 python=3.12`),与 venv 并存但独立。

常用命令:

```bash
conda create -n myenv python=3.12     # 创建环境
conda activate myenv                  # 激活
conda install numpy pandas            # 装包
conda env list                        # 列出所有环境
conda deactivate                      # 退出环境
```

**选 conda 还是 pip/venv**:做数据科学、机器学习,且常装带编译依赖的包,用 conda(或直接装 Miniconda)省心;做通用 Web/脚本开发,pip + venv 更轻量标准。两者不要混用(同一环境里既 conda install 又 pip install 容易冲突),选定一套坚持用。

### 2.17 从零搭建项目环境(实战串讲)

把前面各节串起来,演示一个新项目从零搭环境到跑起来的完整流程(macos + pyenv 为例):

```bash
# 1. 确认 pyenv 已装且已配置
pyenv --version                      # 如 pyenv 2.x.x

# 2. 安装项目所需的 Python 版本并设为项目级
pyenv install 3.12.0                 # 如果还没装过
cd myproject                         # 进入项目目录
pyenv local 3.12.0                   # 设项目级版本,生成 .python-version
python --version                     # 确认: Python 3.12.0

# 3. 创建虚拟环境
python -m venv .venv

# 4. 激活虚拟环境
source .venv/bin/activate           # macOS/Linux
# .venv\Scripts\activate            # Windows
# 提示符变为 (.venv)

# 5. (国内)配置 pip 镜像加速
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple

# 6. 安装项目依赖(假设要 requests)
python -m pip install requests

# 7. 把依赖固化到 requirements.txt
python -m pip freeze > requirements.txt

# 8. 写第一个脚本 hello.py
#    print("环境就绪")
python hello.py                     # 输出: 环境就绪

# 9. 配置 git 忽略虚拟环境
#    在 .gitignore 加一行: .venv/
#    提交 .python-version 和 requirements.txt,不提交 .venv

# 10. 别人拿到项目后复现环境
pyenv install $(cat .python-version)  # 自动安装 .python-version 指定的版本
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python hello.py
```

这套流程是 Python 工程的标准开场:用 pyenv 定版本 → 建虚拟环境 → 激活 → 配镜像 → 装依赖 → 固化清单 → 写代码 → 提交(不含环境,含版本文件)。掌握它,后续任何 Python 项目都能照此起步。

---

## 3. 最佳实践

### 3.1 每个项目先建虚拟环境

```bash
python -m venv .venv
source .venv/bin/activate      # 或 Windows 的 Activate.ps1
pip install -r requirements.txt
```

全装在系统全局迟早冲突,venv 隔离是 Python 工程的基础卫生习惯。`.venv` 目录不要提交到 git(加进 `.gitignore`)。

### 3.2 用 python -m pip 而非裸 pip

```bash
# 不推荐(可能装到别的解释器环境)
pip install xxx

# 推荐(确保装进当前 python 的环境)
python -m pip install xxx
```

多版本/多环境时,裸 `pip` 指向不确定,`python -m pip` 明确绑定当前 `python`。

### 3.3 确认 python 命令指向 3.x

macOS/Linux 上 `python` 可能指向旧版,务必用 `python3` 或设别名,并在安装后用 `python --version` 确认是 3.x,避免误用已停止维护的 Python 2。

### 3.4 用 pyenv 统一管理 Python 版本

macOS 上不要直接使用系统自带的 Python 做开发(版本旧且为系统工具服务)。推荐用 pyenv 安装和管理 Python 版本(见 2.4),通过 `pyenv global` 设全局版本、`pyenv local` 设项目级版本。`pyenv local` 生成的 `.python-version` 文件可提交到 git,让项目自动使用指定 Python 版本。

### 3.5 统一用 4 空格缩进,禁混 Tab

PEP 8 规定 4 空格缩进,且**不要混用 Tab 和空格**。建议编辑器设置"Tab 键插入 4 空格",从源头避免 `TabError`。

### 3.6 源文件统一 UTF-8,文件操作显式指定编码

源码默认 UTF-8,源文件里可直接写中文;读写文件、网络文本一律 `encoding="utf-8"`,不要依赖系统默认编码(Windows 默认 GBK,macOS/Linux 默认 UTF-8),避免跨平台乱码。

### 3.7 代码风格遵循 PEP 8

PEP 8 是 Python 官方风格指南,核心几条:缩进 4 空格,每行不超 79 字符(可放宽到 120);变量函数用 `snake_case`,类名用 `CamelCase`,常量用 `UPPER_CASE`;运算符两侧、逗号后加空格,括号内侧不加;import 顺序标准库→第三方→本地,各组间空行;避免 `from module import *`。用 `ruff`/`flake8`/`black` 自动检查和格式化。

### 3.8 善用 docstring 与注释

函数/类/模块写 docstring(说明"做什么、怎么用"),代码里写解释"为什么"(非显而易见的逻辑),而不是逐行翻译代码。好代码注释少而精。

### 3.9 读异常从最后一行起

```python
Traceback (most recent call last):
  File "demo.py", line 3, in <module>
    n = int("abc")
ValueError: invalid literal for int() with base 10: 'abc'
```

异常栈从上往下是调用顺序,**最后一行是错误本质**(`ValueError...`),倒数几行是出错位置。先读最后一行判断类型,再往上找位置。处理用 `try/except` 兜住可预期的错误。

### 3.10 入门阶段先跑通再优化

新手常陷在"如何写得最好"里不敢动手。正确顺序:先用最直白的方式让程序跑起来(哪怕代码丑),再逐步重构优化。能运行的烂代码胜过写不出的完美设计。

### 3.11 国内开发配上镜像源

装包慢时第一时间配国内 PyPI 镜像(见 2.7),Homebrew 也配中科大源,可避免大量等待时间,这是国内 Python 开发的基础配置。

---

## 4. 总结

### 4.1 本文内容回顾

- **Python 定位**:高级、解释型、通用语言,强调可读性与简洁;Python 2 已 EOL,全系列基于 Python 3。
- **历史与版本**:从 1991 年 0.9.0 到 3.12 的演进脉络,以及 Python 2/3 的主要差异(2 已停止支持,新学者直接学 3)。
- **解释器实现**:CPython(主流)、PyPy(JIT)、Jython/IronPython/MicroPython;学习默认用 CPython。
- **Windows 安装**:官网下载安装包,**务必勾选 Add Python to PATH**,验证 `python --version`,常见问题(PATH/权限/多版本)的处理。
- **macOS 安装**:pyenv(强烈推荐)、Homebrew、官方安装包三种方式;macOS 不建议直接用系统自带 Python 做开发。
- **Linux 安装**:apt/yum/dnf 包管理器安装,以及从源码编译安装特定版本;不卸载系统 Python。
- **pyenv 版本管理**:通过 shims 拦截 `python`/`pip` 命令,支持 global(全局)、local(项目级)、shell(会话级)三种版本切换;`.python-version` 文件可提交 git 实现团队版本统一。
- **环境变量配置**:Windows 与 macOS/Linux 的 PATH 配置方法,`python` vs `python3` 的区别。
- **虚拟环境 venv**:`python -m venv` 创建隔离环境,避免包冲突,每个项目必备;`.venv` 不入 git。
- **pip 包管理**:安装/卸载/清单 `requirements.txt`,建议 venv 内用 `python -m pip`,国内换源加速。
- **三种运行方式**:REPL(交互试语句)、脚本(运行整份代码)、`-m`(运行模块/标准库工具)。
- **语法骨架**:缩进表示代码块(4 空格)、无语句结束符、`#` 注释、标识符命名规则。
- **字符串与输入输出**:引号选用、docstring、原始字符串;`input` 返回字符串、`print` 输出。
- **查看环境信息**:`sys`/`platform` 查版本与平台,`-c` 跑一行代码,`sys.executable` 排查多环境。
- **进阶环境工具**:shebang 让脚本可直接执行;`python -i` 与 `breakpoint()` 交互式调试;编辑器/IDE 选择(VS Code/PyCharm/Jupyter);conda/Anaconda 在数据科学方向的管理方式及其与 pip/venv 的取舍。
- **项目环境搭建全流程**:确认版本→建 venv→激活→配镜像→装依赖→固化 `requirements.txt`→写代码→提交(不含环境)的标准开场。
- **最佳实践**:项目先建 venv、用 `python -m pip`、确认 python 指向 3.x、用 pyenv 统一管理 Python 版本、统一 4 空格缩进、UTF-8 编码、PEP 8 风格、读异常最后一行、先跑通再优化、配国内镜像源。

### 4.2 读完本文你应能掌握

- 说明 Python 的定位与核心特点,以及为什么新学者直接学 Python 3。
- 在 Windows/macOS/Linux 上完成 Python 安装,并解决 PATH、权限、多版本等常见问题。
- 用 pyenv 安装和管理多个 Python 版本,在全局和项目级别切换版本,理解 shims 的工作原理。
- 用 `python -m venv` 创建虚拟环境并激活/退出,理解为何要隔离项目依赖。
- 用 `pip` 安装/卸载/导出/复现依赖,在 venv 内用 `python -m pip`,并配置国内镜像加速。
- 根据场景选用 REPL、脚本、`-m` 三种运行方式,并用 `sys.argv` 接收命令行参数。
- 正确使用 Python 语法骨架:缩进块、无分号、注释、标识符命名。
- 用合适的引号写字符串,用三引号写 docstring,用 `r"..."` 写路径。
- 用 `sys`/`platform` 查版本与平台信息,排查多环境下的解释器归属问题。
- 看懂常见异常,用 `try/except` 处理可预期错误,从最后一行定位问题。
