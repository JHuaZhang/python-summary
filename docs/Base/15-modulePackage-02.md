---
group:
  title: 【15】模块与包管理
  order: 15
order: 2
title: 模块搜索路径 sys.path
nav:
  title: Python
  order: 1
---

## 1. 介绍

### 1.1 什么是 sys.path

当你在 Python 里写下 `import os`、`import numpy` 或者 `from mypkg import utils` 时，解释器并不会凭空"知道"这些模块文件放在哪里。它需要一个查找范围——这个查找范围就是 `sys.path`。

`sys.path` 是一个由字符串组成的**列表**（list），每个字符串是一个目录路径（对于某些特殊项，也可能是 zip 文件路径或其它"路径条目"类型）。Python 在执行 `import` 语句时，会**按这个列表的先后顺序**逐一去每个路径下查找与模块名匹配的文件：先在第一个路径里找，找到了就加载、停止；没找到就去第二个路径，依此类推。如果遍历完整个 `sys.path` 仍然没有命中，就抛出 `ModuleNotFoundError`。

理解 `sys.path` 的关键在于三点：

1. **它是一个普通列表**——你可以在运行时查看它、向它追加（`append`）或插入（`insert`）条目，修改立即生效。
2. **它有固定但可变的初始化逻辑**——解释器启动时会按照一套既定规则往这个列表里填充目录，包括脚本所在目录、`PYTHONPATH` 环境变量、标准库目录、第三方包目录等。
3. **顺序就是优先级**——排在前面的路径会"遮蔽"排在后面的同名模块，这直接决定了你 `import` 的到底是哪一份代码。

本篇承接 `import` 语句本身，回答一个更底层的问题：`import` 去哪找模块？答案就是 `sys.path`。

### 1.2 最基本用法：查看 sys.path

`sys.path` 存放在标准库 `sys` 模块里，导入后直接访问即可。最小的示例只需一行：

```python
import sys

print(type(sys.path))   # 输出：<class 'list'>
print(len(sys.path))    # 输出：视环境而定，通常 5~10 个不等
for p in sys.path:
    print(p)
```

在你的机器上运行这段代码，会看到一串目录被逐行打印出来。这些目录就是当前这块 Python 进程"知道"的模块查找范围。在后面的章节里，我们会逐项拆解这些目录各自的来源，以及如何动态操纵它们。

一个需要刻在脑子里的细节：`sys.path[0]` 在绝大多数交互式场景下是空字符串 `''`，它代表"当前工作目录"。所以如果你在交互式解释器里随手写了 `import myutil`，而当前目录下恰好有一个 `myutil.py`，它会比标准库的同名模块（如果存在）更先被找到。

### 1.3 sys.path 在导入流程中的位置

完整的 `import` 流程其实不止 `sys.path` 这一道关卡。粗略地说，顺序是：

1. 先查 `sys.modules` 缓存——如果这个模块之前已经导入过，直接返回缓存的模块对象，根本不会去碰 `sys.path`。
2. 再查内置模块（`sys.builtin_module_names`，比如 `sys`、`builtins`、`_io` 等），这些由 C 语言直接编译进解释器的模块不走文件查找。
3. 最后才轮到 `sys.path`，按列表顺序在磁盘上找 `.py` / `.pyc` / 包目录（含 `__init__.py`）等。

`sys.path` 是绝大多数"普通模块"（也就是你写得最多的那种 `.py` 文件模块）的最终裁判。本篇聚焦这一层。

## 2. 核心内容

### 2.1 sys.path 的组成逐一拆解

理解 `sys.path` 最直接的方式是把它打印出来，然后对每一项问："这个东西是从哪来的？"我们用一个极简脚本来观察：

```python
# 文件名: observe_path.py
import sys

print("=== sys.path 共", len(sys.path), "项 ===")
for i, p in enumerate(sys.path):
    print(f"[{i}] {p!r}")
```

假设你把文件放在 `/home/user/demo/` 目录下，用 `python observe_path.py` 运行，输出大致是：

```
# 输出：
=== sys.path 共 8 项 ===
[0] '/home/user/demo'
[1] '/usr/lib/python310.zip'
[2] '/usr/lib/python3.10'
[3] '/usr/lib/python3.10/lib-dynload'
[4] '/home/user/.local/lib/python3.10/site-packages'
[5] '/usr/local/lib/python3.10/dist-packages'
[6] '/usr/lib/python3/dist-packages'
[7] '/usr/lib/python3.10/site-packages'
```

具体路径会因操作系统、安装方式、虚拟环境而异，但**结构是稳定的**。下面我们按照上出现的顺序，把每一类来源讲透。

#### 2.1.1 脚本所在目录（sys.path[0]）

列表的第 0 项是最特殊、也是最容易踩坑的一项。它的含义是：**你用 `python xxx.py` 启动程序时，`sys.path[0]` 被设为脚本文件所在的目录**；而当你用 `python -m xxx` 或直接进入交互式解释器时，`sys.path[0]` 被设为空字符串 `''`，空字符串又被解释为"当前工作目录（cwd）"。

先看脚本方式：

```python
# 故意制造一个对比实验
import sys, os

print("cwd =", os.getcwd())
print("sys.path[0] =", repr(sys.path[0]))
print("两者相同吗？", os.getcwd() == (sys.path[0] or os.getcwd()))
```

如果你在 `/home/user/demo/` 目录下，但用 `python /home/user/demo/sub/observe_path.py` 运行（注意脚本在 `sub/` 子目录里），输出会是：

```
# 输出：
cwd = /home/user/demo
sys.path[0] = '/home/user/demo/sub'
两者相同吗？ False
```

这说明 `sys.path[0]` **绑定的是脚本文件所在目录，不是你运行命令时的当前目录**。这是脚本模式下的一条硬规则，很多人踩坑就踩在这里——以为"我在哪个目录敲命令，哪个目录就在 `sys.path` 最前面"，其实不是。

再看 `-m` 模式和交互式：

```python
# 用 python -m observe_path 运行，或者进入 python 交互式后执行
import sys, os

print("sys.path[0] =", repr(sys.path[0]))   # 输出：''（空字符串）
print("cwd =", os.getcwd())                  # 输出：当前你所在的目录
```

注意 `sys.path[0]` 是 `''`，不是 `None`、不是缺失，而是一个实实在在的空字符串。空字符串在路径搜索里被解释为"相对当前工作目录"，因此效果上等同于 cwd。这带来一个直接后果：用 `python -m` 运行时，**当前目录下放的同名模块会被优先导入**，哪怕它不是你"想"导入的那一个。

**为什么要这样设计**

把脚本所在目录放在最前面，是为了让你写 `import myhelper` 时能直接找到和脚本放在一起的 `myhelper.py`，而不需要去 `site-packages` 里找。这是 Python"脚本即程序"的设计哲学：一个目录下的几个 `.py` 文件天然可以互相 import。而 `-m` 模式为"把某个模块当成脚本跑"的场景留出 cwd 优先位，也是一种灵活性。

#### 2.1.2 PYTHONPATH 环境变量

紧跟在脚本目录之后的，通常是来自 `PYTHONPATH` 环境变量的若干路径。`PYTHONPATH` 是一个用冒号（Unix）或分号（Windows）分隔的目录列表，你在启动 Python 进程之前就设好了它。

```bash
# 在 shell 里设置 PYTHONPATH，然后启动 Python
export PYTHONPATH=/home/user/mylibs:/opt/shared/pymods
python -c "import sys; [print(p) for p in sys.path if 'mylibs' in p or 'shared' in p]"
```

```
# 输出：
/home/user/mylibs
/opt/shared/pymods
```

`PYTHONPATH` 里列出的多个目录会被按顺序插入到 `sys.path` 中，位置在脚本目录之后、标准库目录之前。这是给开发者提供的一个"半持久"的模块查找入口——比每次在代码里 `sys.path.append` 要方便，但又不至于像 `site-packages` 那样对所有项目都生效。

**适用场景**

- 你有几个项目共享一组本地工具库，又不想把它们装到 `site-packages`。
- 临时切换到某个旧版本库目录下运行某个脚本，`export PYTHONPATH=./legacy_libs` 即可，不动全局环境。
- CI 环境里在虚拟环境之外喂入一组额外的模块路径。

**常见误区**

很多人以为 `PYTHONPATH` 和 `site-packages` 是同一回事，其实不是。`PYTHONPATH` 只是一个"预置路径列表"，它不会被 `pip` 识别，也不会出现在 `site.getsitepackages()` 返回的列表里。它纯粹是解释器启动时的一个输入参数。

#### 2.1.3 标准库与 lib-dynload

接下来的一系列目录是 Python 解释器自身的标准库所在。例如 `/usr/lib/python3.10` 存放的是纯 Python 实现的标准库模块（如 `json`、`collections`、`asyncio`），而 `/usr/lib/python3.10/lib-dynload` 存放的是 C 扩展模块（如 `_socket`、`zlib`、`_ssl` 等，文件后缀为 `.so` / `.pyd`）。

这一类目录由解释器的安装位置决定，普通开发者几乎不需要改它。你应该把它们当作"只读"——不要往标准库目录里塞自己的 `.py` 文件，那会带来难以排查的命名冲突。

可以用 `sys.prefix` 和 `sys.exec_prefix` 看到这些目录的根：

```python
import sys

print("sys.prefix =", sys.prefix)
# 输出：如 /usr  或 /home/user/.venv  （虚拟环境激活时）
print("sys.exec_prefix =", sys.exec_prefix)
```

`sys.prefix` 就是"标准库目录的父目录"，标准库通常位于 `<sys.prefix>/lib/pythonX.Y/` 下。

#### 2.1.4 site-packages（第三方包安装目录）

这是最常打交道的部分。所有用 `pip install` 装的第三方包默认都会落在 `site-packages` 目录里，它通常是 `<sys.prefix>/lib/pythonX.Y/site-packages`（Linux/macOS）或 `<sys.prefix>\Lib\site-packages`（Windows）。

查看 site-packages 具体路径有几个办法：

```python
import site
import sys
import sysconfig

# 方法一：site.getsitepackages() 返回所有"site-packages"类目录
print(site.getsitepackages())

# 方法二：取 site-packages 的纯路径
print(site.getusersitepackages())  # 用户级安装目录 --user 装到这里

# 方法三：sysconfig 给出更精确的路径定位
print(sysconfig.get_paths()["purelib"])
print(sysconfig.get_paths()["platlib"])
```

```
# 输出（虚拟环境 .venv 下示例）：
['/home/user/.venv/lib/python3.10/site-packages']
/home/user/.local/lib/python3.10/site-packages
/home/user/.venv/lib/python3.10/site-packages
/home/user/.venv/lib/python3.10/site-packages
```

`purelib` 和 `platlib` 在大多数系统上指向同一目录；在某些平台（如某些 Linux 发行版把平台相关包和纯 Python 包分开存）会有差异。一般写作时记两点：第三方包默认在 `site-packages`，用 `pip show <包名>` 的 `Location` 字段也能确认。

**为什么虚拟环境的 `site-packages` 和系统的不一样**

虚拟环境的全部意义就是：修改 `sys.prefix`，让它指向一个独立的目录，从而让 `site-packages` 也变成虚拟环境目录下的一个独立目录。于是同一个 `import numpy`，在虚拟环境 A 里找的是 A 的 `site-packages`，在虚拟环境 B 里找的是 B 的，互不干扰。理解了这一点，就不会再问"我明明装了 numpy 为什么 import 不到"这种问题——你装的那个 `site-packages` 根本不在当前解释器的 `sys.path` 里。

#### 2.1.5 .pth 文件扩展

`site-packages` 目录下经常能看到一些以 `.pth` 为后缀的小文件，它们是给 `site` 模块用的"路径扩展清单"。`site` 模块在解释器启动时会扫描这些 `.pth` 文件，把里面列出的目录追加到 `sys.path` 里。

一个 `.pth` 文件的格式很简单：每行一个目录路径，以 `#` 开头的是注释，空行被忽略。例如某个虚拟环境里的 `mytool.pth`：

```
# mytool.pth
/opt/mytool/lib
/home/user/shared/utils
```

重启 Python 后，这两行就会被加进 `sys.path`。这正是 `pip install -e .`（editable 安装）背后机制之一——它会往 `site-packages` 写一个 `.pth` 文件或一个 `*.egg-link`，指向你项目的源码目录，于是你修改源码后无需重新安装，`import` 就能立刻看到新代码。

```python
# 观察 .pth 文件带来的路径
import sys, site

sp = site.getsitepackages()[0]
import os
for fn in os.listdir(sp):
    if fn.endswith('.pth'):
        print(f"--- {fn} ---")
        with open(os.path.join(sp, fn)) as f:
            print(f.read())
```

这段代码会打印出你的虚拟环境 `site-packages` 下所有 `.pth` 文件的内容。你大概率会看到若干 `*.dist-info` 之外的自建 `.pth`，或 editable 包留下的路径项。

**注意**：`.pth` 文件里还可以写 `import` 语句——如果某一行以 `import` 开头，它会被当作代码执行。这是 `site` 模块的一个设计选择，也给了一些打包工具（如老的 `setuptools` 入口点）可乘之机。出于安全考虑，不要往陌生环境里乱拷 `.pth` 文件。

### 2.2 查看与调试 sys.path

光知道 `sys.path` 的组成还不够，实际开发中更常见的需求是："为什么我 `import` 不到这个模块？"这时需要动手去查。

#### 2.2.1 打印 sys.path 并核对

第一步永远是打印它，看看目标目录到底在不在里面：

```python
import sys

target = "/home/user/myproj"
inside = any(p == target or p.rstrip('/') == target.rstrip('/') for p in sys.path)
print("目标目录在 sys.path 中吗？", inside)

if not inside:
    print("提示：检查 PYTHONPATH、虚拟环境是否激活、安装时用的 python -m pip 还是 pip")
```

这里之所以要 `rstrip('/')`，是因为 macOS/Linux 下有些人设路径时带尾斜杠、有些人不带，字符串比较时要先归一化。

#### 2.2.2 查看某个模块到底是从哪加载的

只看 `sys.path` 还不够，你要确认的是"当前这次 `import` 实际从哪个文件加载的"。两个属性能帮上忙：

```python
import json

print(json.__file__)
# 输出：/usr/lib/python3.10/json/__init__.py
```

`__file__` 是模块对象上的属性，记录了这个模块的源文件路径。如果它指向的不是你期望的那份代码（比如你改了某个包的源码，但 `__file__` 显示的是 `site-packages` 里的旧版本），说明 `sys.path` 把另一个目录排在了前面。

另一个更准确的方式是用 `importlib`：

```python
import importlib.util

spec = importlib.util.find_spec("json")
print(spec.origin)
# 输出：/usr/lib/python3.10/json/__init__.py

print(spec.submodule_search_locations)
# 输出：['/usr/lib/python3.10/json']
```

`find_spec` 不会真正导入模块，它只是用导入机制去"问"一下：如果我要导入这个模块，解释器会从哪里加载？这对排查"遮蔽"问题特别有用——如果 `find_spec` 返回的路径不是你以为的那一个，说明 `sys.path` 顺序有问题。

#### 2.2.3 用 python -v 观察导入过程

`python -v` 会打开导入日志，把每次模块搜索的详细过程打到 stderr。对你手动排查很方便：

```bash
python -v -c "import mymod" 2>&1 | grep mymod
```

你会看到类似这样的输出：解释器在 `sys.path` 的每一项目录下尝试找 `mymod.py` / `mymod/__init__.py` 的过程都被打印出来。这是"最终裁判"级别的证据。

### 2.3 运行时动态修改 sys.path

`sys.path` 是个普通 list，你可以在运行时往里增删条目，改动立刻对后续的 `import` 生效。这是"临时让某个外部目录可被导入"最直接的做法。

#### 2.3.1 sys.path.append 与 sys.path.insert

两者都是往列表里加一个路径，区别在于插入位置：

- `sys.path.append(path)`：加到列表末尾，优先级**最低**——只有前面的所有路径都没找到目标模块时才会到这。
- `sys.path.insert(0, path)`：加到列表最前面，优先级**最高**——下一次 `import` 会首先从这个目录找。

典型场景：你在写一个小实验，需要在 Jupyter 里临时导入一批放在项目外某个目录里的工具模块，又不想装包。

```python
import sys
import os

# 假设工具库放在项目外的一个目录
tool_dir = "/home/user/experiments/common_tools"

# 用 insert 让它最高优先
sys.path.insert(0, tool_dir)

# 现在可以直接 import 这个目录下的模块
import text_utils   # 假设 common_tools/text_utils.py 存在
print("从以下路径加载:", text_utils.__file__)
# 输出：从以下路径加载: /home/user/experiments/common_tools/text_utils.py
```

如果这个目录里恰好有一个和标准库同名的 `json.py`，那么 `insert(0, ...)` 之后 `import json` 会加载到这份你自己的 `json.py`，而不是标准库——这就是"遮蔽"。当你真正想做"替换某个三方包来调试"时这是好事；但当你只是想额外加几个模块、并不想干扰已有导入时，应该用 `append`。

```python
import sys

# 推荐做法：除非要遮蔽，否则用 append，避免影响既有模块解析
sys.path.append("/home/user/experiments/common_tools")
```

#### 2.3.2 sys.path 的修改不是持久的

务必记住：对 `sys.path` 的任何修改只对**当前进程**有效。进程结束、下次再启动 Python，`sys.path` 还是会按既定规则重新初始化——你 `insert` 进去的目录不会被记下来。

如果你希望"永久"地把某个目录加入搜索范围，有几个正式手段：

1. 用 `pip install -e .` 做 editable 安装，本质是写 `.pth`/`egg-link` 进 `site-packages`。
2. 在 `site-packages` 里手动放一个 `myextra.pth` 文件，内容是你的目录路径。
3. 设置 `PYTHONPATH` 环境变量（对当前 shell 会话有效，写进 `.bashrc`/`.zshrc` 后长期有效）。
4. 写一个 `sitecustomize.py` 放进 `site-packages`，`site` 模块启动时会自动执行它，可在里面 `sys.path.append(...)`。

这四种方式按"工程化程度"递增，按"灵活程度"递减。日常调试用 `insert`/`append` 即可，开发期固定依赖用 editable 安装，线上部署依赖强制用 pip 正式安装。

#### 2.3.3 sys.path.pop 与移除条目

既然是列表，当然也能删：

```python
import sys

# 移除末尾条目（如果存在）
if sys.path and sys.path[-1].endswith("temp_libs"):
    sys.path.pop()

# 也可以按值移除
danger_dir = "/opt/legacy/libs"
if danger_dir in sys.path:
    sys.path.remove(danger_dir)
```

极少真的在代码里删 `sys.path` 条目，但在某些测试场景下需要"临时屏蔽某目录看模块是否能从别处加载"，这种做法有用。改完记得恢复——直接操作 `sys.path` 是有副作用的，尤其当测试是跑在同一个进程里的多个用例之间共享 `sys.path` 时。

### 2.4 ModuleNotFoundError 的排查清单

"明明装了包却 import 不到"是 Python 新手最常碰到的困惑。根因几乎都和 `sys.path` 有关。下面是一份排查清单，按出现频率从高到低排列。

#### 2.4.1 虚拟环境没激活，或激活的不是你以为的那个

你用 `pip install numpy` 装到了虚拟环境 A 的 `site-packages`，但运行脚本时虚拟环境没激活，于是用的是系统 Python，它的 `site-packages` 里并没有 numpy。

```python
import sys

# 检查当前解释器
print(sys.executable)
# 输出：如果看到 /usr/bin/python3 而不是 /home/user/.venv/bin/python，说明虚拟环境没激活

# 检查 site-packages 是否包含你期望的包
import site, os
for sp in site.getsitepackages():
    print(sp, "=>", os.path.exists(os.path.join(sp, "numpy")))
```

```
# 输出：
/usr/bin/python3
/usr/lib/python3/dist-packages => False
```

一个正面的习惯：装包永远用 `python -m pip install xxx` 而不是裸 `pip install xxx`，前者保证装到当前 `python` 对应的 `site-packages` 里，"装到了另一个 Python"的事故率会大幅下降。

#### 2.4.2 装到了另一个 Python 版本

系统里同时存在 Python 3.10 和 Python 3.11，你用 `pip3.10 install` 装了包，却用 `python3.11 script.py` 运行。两个版本的 `site-packages` 是分开的目录，互相看不见。

```python
import sysconfig

print(sysconfig.get_paths()["purelib"])
# 输出：/usr/local/lib/python3.11/site-packages
# 如果包装在 python3.10 的 site-packages，这里路径对不上
```

排查时直接对比 `pip show 包名` 的 `Location` 字段和上面 `sysconfig` 打印的路径是否一致即可。

#### 2.4.3 sys.path 不含目标目录

一些非标准的安装方式（比如自己解压了一个 wheel 包到某个目录、或用 `PYTHONPATH` 临时指向的目录被忘了设了）会导致目标目录根本不在 `sys.path` 里。

```python
import sys

target_dir = "/opt/mylibs"
print(target_dir in sys.path)        # 输出：False 表示不在
print(any(p.endswith("mylibs") for p in sys.path))  # 模糊匹配兜底
```

修复方式：用 `sys.path.append(target_dir)` 临时解决，或用 `.pth` 文件 / `PYTHONPATH` 持久解决。

#### 2.4.4 同名模块遮蔽

这是最隐蔽的一类。你的项目目录下有一个 `json.py`（写来练习用的），结果整个项目里所有 `import json` 都拿到了这个练习文件，而不是标准库的 `json`。症状通常是某个原本能跑的代码突然报 `AttributeError`："明明 `json` 模块有 `loads` 方法，为什么说没有？"

```python
# 项目目录结构
# myproj/
# ├── run.py
# └── json.py   ← 这个文件是罪魁祸首

# run.py 内容
import json
print(json.loads('{"a": 1}'))
```

```
# 输出：
# AttributeError: module 'json' has no attribute 'loads'
# （因为 import 到的是同目录下的 json.py，不是标准库）
```

排查线索：看 `json.__file__` 是不是指向了项目目录。修复方式：别用标准库名字命名自己的文件，这是铁规矩。

#### 2.4.5 缓存导致修改了 sys.path 仍 import 到旧模块

你 `sys.path.insert(0, new_dir)` 想让 `import foo` 从新目录加载，但它仍然从旧目录加载——因为 `foo` 已经被之前的某次 `import` 加载进 `sys.modules` 缓存了，后续 `import foo` 直接命中缓存，根本不会再走 `sys.path`。

```python
import sys

# 假设模块 foo 已经被 import 过一次
# 现在想切换到另一个目录的 foo

# 必须先清缓存
if 'foo' in sys.modules:
    del sys.modules['foo']

sys.path.insert(0, '/new/dir')
import foo
print(foo.__file__)
# 输出：/new/dir/foo.py
```

`sys.modules` 缓存的存在不是为了"故意刁难"，而是因为模块可能有副作用（执行时打印、注册东西），重复 `import` 不应该重复执行这些副作用。理解了缓存先于 `sys.path` 这一规则后，这类 bug 就不难解释了。

### 2.5 标准库与第三方库同名时的遮蔽顺序

遮蔽的本质是"先找到的那个赢"。既然 `sys.path` 是有序的，遮蔽顺序就是 `sys.path` 各项的排列顺序。常见的排列是：

```
sys.path[0] = 脚本目录 或 '' (cwd)
sys.path[1..k] = PYTHONPATH
sys.path[k+1..] = 标准库
sys.path[...末尾] = site-packages
```

所以，如果你在脚本目录下放了一个 `time.py`，下次 `import time` 会优先拿到这个文件而不是标准库 `time`。这通常不是你想要的，所以约定的规矩是：

- 永远不要用标准库的名字命名自己的模块文件（`os.py`、`string.py`、`json.py`、`random.py`、`time.py` 都是雷区）。
- 永远不要用常见第三方库名命名自己的模块（`requests.py`、`numpy.py`、`pandas.py` 同样是雷区——即便它们没在你当前项目里用，只要哪天加了 import 就会踩雷）。

第三方包之间的遮蔽更容易出现：你 `pip install` 了两个包 `A` 和 `B`，它们各自在自己的 `site-packages/` 子目录下都定义了一个叫 `utils` 的子模块。在 `sys.path` 层面，由于两者都在同一个 `site-packages` 里，本身不影响；真正的遮蔽发生在"顶层包名"层面——两个包刚好同名，那谁排在 `sys.path` 前面谁赢。

```python
# 演示遮蔽顺序
import sys

# 假设项目目录下有一个 logging.py（这是常见错误）
# 打印标准库 logging 的路径
import logging
print(logging.__file__)
# 如果显示了项目目录下的 logging.py，说明被遮蔽了
# 正常应显示 /usr/lib/python3.X/logging/__init__.py
```

**一个能验证顺序的实验**

手写一个最小遮蔽实验，体会"顺序决定一切"：

```python
# 实验：准备两个目录，每个目录里都有一个 greet.py，内容不同
# /tmp/dir_a/greet.py:  def hello(): return "from A"
# /tmp/dir_b/greet.py:  def hello(): return "from B"

import sys

# 先只加 dir_a，import 到的是 A
sys.path.insert(0, '/tmp/dir_a')
import greet
print(greet.hello())   # 输出：from A

# 想换 B，必须清缓存 + 把 B 放前面
del sys.modules['greet']
sys.path.insert(0, '/tmp/dir_b')
import greet
print(greet.hello())   # 输出：from B
```

这个实验把遮蔽和缓存两个机制都展示了一遍，建议你亲手跑一遍加深印象。

### 2.6 运行方式对 sys.path[0] 的影响（python a.py vs python -m a）

这是 `sys.path` 话题里最容易出面试题也最容易踩坑的地方。同样是运行一个模块，用 `python a.py` 还是 `python -m a`，`sys.path[0]` 是不一样的。

#### 2.6.1 直接运行脚本：python a.py

```python
# a.py
import sys, os

print("sys.path[0] =", repr(sys.path[0]))
print("__name__ =", __name__)
print("__package__ =", repr(__package__))
print("cwd =", os.getcwd())
```

用 `python /home/user/proj/a.py`（在 `/tmp` 目录下敲的命令）运行：

```
# 输出：
sys.path[0] = '/home/user/proj'
__name__ = __main__
__package__ = None
cwd = /tmp
```

注意：`sys.path[0]` 是脚本所在的目录 `/home/user/proj`，**不是 cwd `/tmp`**。这是脚本模式的硬规则。

#### 2.6.2 以模块方式运行：python -m a

```bash
cd /home/user/proj
python -m a
```

```
# 输出：
sys.path[0] = ''
__name__ = __main__
__package__ = ''
cwd = /home/user/proj
```

对比脚本模式，关键差别是 `sys.path[0]` 变成了空字符串 `''`，它代表 cwd。这意味着 `-m` 模式下"当前目录"会被加入搜索路径。

#### 2.6.3 为什么这很重要

考虑一个常见项目结构：

```
proj/
├── main.py
└── utils/
    ├── __init__.py
    └── helper.py
```

`main.py` 里写了 `from utils import helper`。

- 在 `proj/` 目录下运行 `python main.py`：`sys.path[0]='/path/to/proj'`，`from utils import helper` 能找到。
- 在 `proj/` 目录下运行 `python -m main`：`sys.path[0]=''` 等于 cwd=`/path/to/proj`，也能找到。
- 但如果从 `proj/` 的父目录运行 `python proj/main.py`：`sys.path[0]='/path/to/proj'`，仍可找到 utils。
- 如果从 `proj/` 的父目录运行 `python -m proj.main`：`sys.path[0]=''` 等于父目录，`proj` 本身被当作包，`from utils import helper` 会失败（因为现在 utils 必须写成 `proj.utils`）。

这就是为什么大型项目、包的入口通常推荐用 `python -m pkg.module` 模式跑——它把包结构正确地建立起来了，相对导入能正常工作；而 `python pkg/module.py` 则把 `pkg/module.py` 当成一个独立顶层脚本，包的上下文丢失。

用一个表格总结两种运行方式的差异：

| 维度 | `python a.py` | `python -m a` |
|---|---|---|
| `sys.path[0]` | 脚本所在目录 | `''`（cwd） |
| `__name__` | `__main__` | `__main__` |
| `__package__` | `None`（独立脚本） | `''` 或包名（可相对导入） |
| 相对导入 | 不可用（无包上下文） | 可用 |
| 适用场景 | 简单脚本 | 包入口、需要包上下文 |

#### 2.6.4 对导入行为的实际影响

下面这个 demo 把两种运行方式下 `sys.path` 的差异直接体现出来：

```python
# 文件: proj/demo_run.py
import sys
import os

print("运行方式可由 __package__ 判断:", repr(__package__))
print("sys.path[0] =", repr(sys.path[0]))
print("cwd =", os.getcwd())

# 验证一个关键差异：脚本模式下 sys.path[0] 是脚本目录
# -m 模式下是 cwd
```

然后用两种方式各跑一次，对比输出：

```bash
# 方式一
cd /tmp
python /home/user/proj/demo_run.py
# 输出：
# 运行方式可由 __package__ 判断: None
# sys.path[0] = '/home/user/proj'
# cwd = /tmp

# 方式二
cd /home/user/proj
python -m demo_run
# 输出：
# 运行方式可由 __package__ 判断: ''
# sys.path[0] = ''
# cwd = /home/user/proj
```

看到两次的 `sys.path[0]` 完全不同，就能理解为什么有些脚本能 import 到某些模块、换一种运行方式就 import 不了。

### 2.7 相对路径与绝对路径在 sys.path 里的影响

`sys.path` 里的条目既可以是绝对路径，也可以是相对路径（比如 `'.'` 或 `'./libs'`）。一个常被忽视的细节是：**`sys.path` 里的相对路径是相对于"当前工作目录"解释的，而 cwd 是会变的**。

```python
import sys, os

# 假设运行时 cwd = /home/user/proj
sys.path.append('./libs')   # 等价于 /home/user/proj/libs

# 假设之后 chdir 切换目录
os.chdir('/tmp')
# 现在 './libs' 在 sys.path 里仍然写作 './libs'
# 但解释器下次搜索时会把它解释为 /tmp/libs，不再是原来的 proj/libs！
# 这是一个非常隐蔽的 bug 源
```

更好的做法是：往 `sys.path` 里加的路径永远用 **绝对路径**，用 `os.path.abspath` 归一化：

```python
import sys, os

lib_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'libs'))
sys.path.insert(0, lib_dir)
# 不管 cwd 怎么变，lib_dir 都是绝对路径，行为稳定
```

`__file__` 是当前模块文件的路径，用它来"定位自己旁边的目录"是常见的安全写法。也是为什么很多项目入口脚本会有这么一段看起来"样板"的代码：

```python
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
```

它的意图很明确："把脚本所在目录加到 `sys.path[0]`，保证它优先级最高"。虽然在脚本模式下这本来就会被自动加上，但显式写一遍可以应对某些被打包成可执行文件、或用 `runpy` 间接执行等异常路径的场景。

### 2.8 sys.modules 缓存与 sys.path 的关系

虽然本篇主题是 `sys.path`，但没讲 `sys.modules` 缓存，导入流程就讲不完整。两者是导入机制的两道关卡，`sys.modules` 在前。

`sys.modules` 是一个字典，键是模块名字符串，值是已加载的模块对象。`import foo` 执行时，解释器的真实流程是：

1. 看 `'foo' in sys.modules` 是否成立。如果命中，直接返回 `sys.modules['foo']`，跳过 `sys.path`。
2. 看是否是内置模块（如 `sys`、`builtins`），命中则加载。
3. 走 `sys.path` 查找。

```python
import sys

# 第一次 import，会真的走 sys.path
import collections
print(id(collections))   # 记下对象 id

# 再次 import
import collections
print(id(collections))
# 两次的 id 完全相同，因为第二次直接命中了 sys.modules 缓存
```

```
# 输出：
# 140234567890112
# 140234567890112
```

**对 `sys.path` 修改的影响**：因为缓存优先，所以哪怕你在中途 `sys.path.insert(0, new_dir)`，如果某个名字已经 `import` 过了，新的 `import` 仍会返回缓存里的旧对象。要让修改生效，必须先 `del sys.modules[name]`，或者用 `importlib.reload`。

```python
import sys
import importlib

# 假装 mymod 已经被 import 过一次，来自旧目录
# 现在改了 sys.path，想让它从新目录加载

sys.path.insert(0, '/new/dir')

# 方式一：跳过缓存
if 'mymod' in sys.modules:
    del sys.modules['mymod']
import mymod  # 这次走 sys.path 重新查找

# 方式二：原地重载
importlib.reload(mymod)  # 仍在 sys.modules 里，但重新执行模块文件
```

`reload` 与 `del + import` 的差别：`reload` 保留模块对象的 id，把代码原地再执行一遍；`del + import` 则完全重新创建一个模块对象。绝大多数场景两者效果类似，但如果你有别的对象持有对旧模块的引用，`reload` 会让那些引用看到更新后的内容，`del + import` 不会。

## 3. 最佳实践

**用绝对路径操作 sys.path**

往 `sys.path` 里加路径时，永远先 `os.path.abspath` 归一化。相对路径在 cwd 改变后会指向错误位置，是一个隐蔽且难复现的 bug 源。

```python
# 不推荐
sys.path.insert(0, './libs')
sys.path.append('../common_tools')

# 推荐
import os
sys.path.insert(0, os.path.abspath('./libs'))
sys.path.insert(0, os.path.abspath('../common_tools'))
```

**不要把标准库名、常见三方包名用作自己的文件名**

`json.py`、`time.py`、`os.py`、`logging.py`、`requests.py`、`numpy.py` 这些名字在脚本目录下会**优先级高于**标准库和 `site-packages`，产生遮蔽。一旦你的项目里出现一个 `json.py`，整个项目里的 `import json` 都会拿到这个文件，导致莫名其妙的 `AttributeError`。规规矩矩取一个独立的、有语义的名字，比如 `json_scraper.py`、`time_util.py`。

**优先用 pip 安装，而不是手改 sys.path**

`sys.path.insert` 是临时手段，目的是"我现在要快速试一下"。一旦这个依赖确定要长期存在，正确做法是用 `pip install -e .` 做 editable 安装，或正式 `pip install .` 打包。editable 安装之后，`sys.path` 通过 `.pth` 文件自然包含你的项目目录，不再需要任何运行时 hack。

**装包永远用 `python -m pip install`**

裸 `pip`、`pip3` 在多版本环境里容易指向"另一个 Python"。`python -m pip install xxx` 保证装到当前 `python` 的 `site-packages`，从源头上避免"装了包却 import 不到"。

**虚拟环境隔离项目依赖**

每个项目一个虚拟环境，激活后再装依赖。这样 `sys.path` 干净，`site-packages` 里只有当前项目用得着的包。不要往系统 Python 的 `site-packages` 里装项目级依赖，那会在项目间互相污染。

**调试导入问题三步走**

1. 打印 `sys.executable` 和 `sys.path`，确认当前用的是哪个 Python、`sys.path` 是否包含目标目录。
2. 看 `importlib.util.find_spec("包名")` 返回的路径，确认实际加载的位置。
3. 看模块的 `__file__`，确认它就是你想加载的那份代码。

三步走下来，99% 的"装了包却 import 不到"都能定位。

**不要在库代码里改 sys.path**

如果你在写一个会被别人 import 的库，绝不要在库顶部 `sys.path.insert(...)`——这是侵略性极强的行为，会污染调用方的环境，还可能触发遮蔽。库代码应该假设它已经通过正常途径（pip 安装）被 import 到，所有依赖都已经在 `sys.path` 里。只有脚本入口（main script）才允许动 `sys.path`。

**-m 模式适合包入口，脚本模式适合独立工具**

项目是多文件包结构、需要相对导入 → 用 `python -m pkg.main`。单文件脚本、入口独立 → `python tool.py` 即可。理解两者的 `sys.path[0]` 差异后，你会自然地知道每种场景该选哪种运行方式。

**用 sys.path 不如用 PYTHONPATH，用 PYTHONPATH 不如用 pip**

临时调试用 `sys.path.insert`。想做"半持久"（本 shell 会话内不重复写）用 `PYTHONPATH`。想做"持久稳定"用 pip 正式安装或 `.pth`。优先级越靠后的方式越正式、越不容易出错。

## 4. 原理

### 4.1 import 语句的完整执行流程

`import foo` 这一行代码背后，Python 解释器执行的远不止"去目录里找文件"这么简单。它走的是一个称作"导入系统"的协议，由 finder（查找器）和 loader（加载器）两部分组成。理解了这套协议，你才真正理解 `sys.path` 在其中扮演的角色。

粗略的步骤如下：

1. **查 `sys.modules` 缓存**：如果 `'foo'` 已经在 `sys.modules` 这个字典里，直接返回缓存对象，整个流程到此终止。这是为什么"重复 import 不会重复执行模块代码"的根本原因。

2. **查内置模块**：在 `sys.builtin_module_names` 中查找 `foo`。内置模块是编译进解释器内部的 C 模块（如 `sys`、`builtins`、`_io`、`_thread` 等），不走文件查找。

3. **调用 finder 查找模块规格**：解释器按顺序调用一系列"查找器"对象，问它们"你知道 foo 这个模块在哪吗？"。每个查找器实现了 `find_spec(name, path, target)` 方法，返回一个 `ModuleSpec` 对象或 `None`。

   - 第一个出场的查找器是 `BuiltinImporter`，负责内置模块（这一步实际上和步骤 2 是同一件事的不同入口）。
   - 第二个是 `FrozenImporter`，负责"冻结模块"（编译进二进制的模块，常见于嵌入式打包如 PyInstaller）。
   - 第三个是最重要的 `PathFinder`，它就是**遍历 `sys.path` 的那个家伙**。

4. **PathFinder 遍历 sys.path**：对 `sys.path` 列表里每一项（一个路径字符串、zip 文件路径或其它"路径条目"），PathFinder 依次调用对应的"路径条目查找器"去那一个目录里找 `foo.py` / `foo/__init__.py` / `foo.so` 等。一旦在某一项找到目标，就创建一个 `FileLoader`（或对应类型的 loader），返回 `ModuleSpec`。

5. **调用 loader 加载模块**：解释器拿到 `ModuleSpec` 后，调用 `spec.loader.exec_module(module)` 把模块文件源代码读进来、编译并执行。模块顶层代码在这个阶段执行，模块的函数、类、变量在这个阶段被定义出来。

6. **写入 `sys.modules` 缓存**：加载完成后，把模块对象存到 `sys.modules['foo']`。这一步发生在 loader 执行模块代码的时机附近（具体在 `importlib._bootstrap._find_and_load` 里），是为了处理循环导入——如果模块在执行过程中又 `import` 了回来，能从缓存里拿到半初始化的对象。

7. **绑定名字**：把模块对象绑定到当前命名空间的 `foo` 这个名字上。这才是 `import foo` 之后你能直接用 `foo.xxx` 的原因。

第 3 步里的查找器列表在 `sys.meta_path` 里，第 3 步遍历的 `sys.path` 是 `PathFinder` 内部用的数据源。两者不要混淆：`sys.meta_path` 是查找器对象列表，`sys.path` 是路径字符串列表。

```python
import sys

# meta_path：查找器列表（决定"用谁来找"）
print("meta_path 中的查找器:")
for finder in sys.meta_path:
    print(" -", finder)

# path：路径列表（决定"在哪里找"）
print("path 中的路径数:", len(sys.path))
```

```
# 输出：
# meta_path 中的查找器:
#  - <class '_frozen_importlib.BuiltinImporter'>
#  - <class '_frozen_importlib.FrozenImporter'>
#  - <class '_frozen_importlib_external.PathFinder'>
# path 中的路径数: 8
```

### 4.2 PathFinder 如何遍历 sys.path

PathFinder 是真正"消费" `sys.path` 的角色。它的工作流程用伪代码描述大致是：

```
for entry in sys.path:
    # 1. 为这个 entry 找到合适的 path entry finder
    finder = path_importer_cache[entry]   # 有缓存
    if finder is None:
        # 默认走文件系统查找
        for suffix in ['.py', '.pyc', package_dir, '.so', '.pyd']:
            candidate = os.path.join(entry, module_name + suffix)
            if 存在:
                return 创建 ModuleSpec
    else:
        spec = finder.find_spec(module_name)
        if spec is not None:
            return spec
return None   # 所有 entry 都没找到 → ModuleNotFoundError
```

这里有三个值得记住的优化和细节：

1. **`sys.path_importer_cache`**：PathFinder 会把"每个 path 条目对应的查找器"缓存起来，避免每次 import 都重新构造。这就是为什么在运行时改 `sys.path` 之后，某些缓存的查找器可能仍然指向旧的路径——你 `sys.path.insert` 一个新目录，PathFinder 会为新目录新建查找器，但如果一个目录从 `sys.path` 里移走了，它的缓存项不会自动清理。需要 `importlib.invalidate_caches()` 来清。

2. **路径条目查找器的多样性**：每个 `sys.path` 条目不一定都是普通文件系统目录。它也可以是一个 zip 文件路径（Python 支持从 zip 导入，这就是 `python zipfile` 单文件可执行的原理之一），也可以是一个自定义的"路径条目钩子"。这给了 Python 导入系统很大的扩展空间。

3. **命中即停**：一旦某个 path 条目找到了模块，PathFinder 立刻返回，不再继续查后面的条目。这就是"遮蔽"的根源——排在前面的条目有机会先找到模块，排在后面的即便有同名文件也访问不到。

### 4.3 sys.path 各组成部分的来源

理解了 PathFinder 遍历 `sys.path` 的机制，下一步要回答：`sys.path` 这一坨字符串到底是怎么被填进去的？答案是：解释器启动时，由 `site` 模块和解释器自身的初始化代码协作填充。来源可以这样拆解：

#### 4.3.1 脚本目录 / cwd（解释器自己加的）

这一项在解释器启动阶段就被塞进去，发生在 `site` 模块运行**之前**。规则是：

- 如果是 `python script.py` 模式，把 `os.path.dirname(script_path)` 作为 `sys.path[0]`。
- 如果是 `python -m module` 或交互式模式，把 `''` 作为 `sys.path[0]`（空字符串，意为 cwd）。

这部分代码写死在 CPython 的 `Modules/main.c` 和 `Lib/importlib/__init__.py` 里，跟 `site` 无关。所以你能确定：哪怕你禁用 `site`（用 `python -S`），`sys.path[0]` 仍然存在。

```bash
# 用 -S 跳过 site 模块，看 sys.path
python -S -c "import sys; print(sys.path[:3])"
```

```
# 输出：
['', '/usr/lib/python310.zip', '/usr/lib/python3.10']
```

注意 `sys.path[0]` 是 `''`，因为这是 `python -c` 模式（类似交互式，cwd 优先）。

#### 4.3.2 PYTHONPATH（解释器自己加的）

紧跟在脚本目录之后被加入。解释器读环境变量 `PYTHONPATH`，按系统分隔符切分（Unix 是 `:`，Windows 是 `;`），按顺序插入 `sys.path`。这部分也在 `site` 运行之前完成。

```bash
PYTHONPATH=/aa:/bb python -S -c "import sys; print(sys.path[:5])"
```

```
# 输出：
['', '/aa', '/bb', '/usr/lib/python310.zip', '/usr/lib/python3.10']
```

可以看到 `/aa` / `/bb` 紧跟在 `''` 之后。

#### 4.3.3 标准库目录（解释器自己加的）

`sys.prefix` 和 `sys.exec_prefix` 决定。标准库根目录下有几个固定子目录：

- `<prefix>/lib/pythonX.Y/` —— 纯 Python 标准库
- `<prefix>/lib/pythonX.Y/lib-dynload/` —— C 扩展模块

这些目录在 `site` 运行前就由解释器初始化加好。`sys.prefix` 的值又由解释器启动时的"定位安装根目录"逻辑决定——CPython 在启动时会先找 `lib/pythonX.Y/os.py`，找到这个文件的目录往上反推 `prefix`。

#### 4.3.4 site-packages（site 模块加的）

这是 `site` 模块的"功劳"。`site` 在解释器启动时被自动 import（除非你用 `-S` 禁用）。它的工作有：

1. 计算 `site-packages` 的位置，通常是 `<prefix>/lib/pythonX.Y/site-packages`。
2. 扫描这个目录下的所有 `.pth` 文件，把里面列出的额外路径加到 `sys.path`。
3. 把用户级 `site-packages`（`~/.local/lib/pythonX.Y/site-packages`）也加上（除非用 `-s` 禁用）。

```bash
# 对比有 site 和无 site 时的 sys.path 长度
python -c "import sys; print('with site:', len(sys.path))"
python -S -c "import sys; print('-S:', len(sys.path))"
```

```
# 输出：
with site: 8
-S: 4
```

少了的那 4 项就是 site 模块加上去的 `site-packages` 各种路径。

#### 4.3.5 .pth 文件的处理

`site` 模块在扫描 `site-packages` 时，对每个 `.pth` 文件按行处理：

- 空行、以 `#` 开头的注释行：跳过。
- 以 `import` 开头的行：当作代码执行（这是历史遗留的可扩展点，用于动态注册查找器等）。
- 其它行：当作目录路径，加到 `sys.path`。如果该路径不存在，会跳过（不报错）。

`sys.path` 最终顺序大致是：

```
[脚本目录/cwd]
[PYTHONPATH...]
[标准库]
[lib-dynload]
[site-packages 主目录]
[.pth 文件中的额外路径...]
[user site-packages]
```

不同 Python 版本的具体顺序可能有微调，但"脚本目录 → PYTHONPATH → 标准库 → site-packages"这四个层次的相对顺序是稳定的。

### 4.4 为什么顺序是"脚本目录优先"

把脚本目录放在 `sys.path[0]`，是有意为之的设计。原因可以追溯到 Python 早期的"脚本哲学"：

- 一个程序就是一组放在同一个目录下的 `.py` 文件，它们之间应该能互相 import 而不需要任何打包/安装步骤。
- 用户写的代码优先级应该高于系统安装的库——如果你在项目目录下放了一个修过 bug 的 `xxx.py`，应该被优先使用，而不是被 `site-packages` 里的旧版本遮蔽。

这条规则在大多数时候是好事，但也埋下了"标准库被同名文件遮蔽"的雷。它的反面教训就是著名的 Python 2 时代 `import json` 在某些项目里会报错的案例——某项目目录下有个练习用的 `json.py`，结果整个项目的 `import json` 全部拿到那份练习文件。Python 3 之后这条规则没改，仍保持"脚本目录优先"，只是社区通过约定（不要起标准库名字的文件名）来规避。

### 4.5 sys.modules 缓存早于 sys.path 查找

PathFinder 在开始遍历 `sys.path` 之前，导入系统就已经做了一次缓存检查——这是性能优化的需要，也是语义的需要。

- **性能**：模块导入是昂贵操作（读文件、编译字节码、执行顶层代码）。重复 import 不应该重复触发这些操作。
- **语义**：模块可能有副作用。比如 `import logging` 会注册一些全局 handler，重复执行会重复注册。缓存保证"每个模块在进程内只完整执行一次顶层代码"。

`sys.modules` 是一个普通 dict，你可以直接观察它：

```python
import sys

# 看缓存里已有多少模块
print("已加载模块数:", len(sys.modules))
# 输出：通常是几百个（解释器启动就 import 了大量标准库）

# 看 logging 是否在缓存里
import logging
print('logging' in sys.modules)   # 输出：True

# 看 logging 模块对象的来源
print(logging.__file__)
# 输出：/usr/lib/python3.10/logging/__init__.py

# 假设我们刻意改 sys.path，影响不到已缓存的 logging
sys.path.insert(0, '/fake/path/with/logging.py')
import logging  # 第二次 import，命中缓存，根本没去 sys.path
print(logging.__file__)   # 输出：仍是标准库的路径，没变化
```

这套缓存机制也解释了"为什么循环导入有时能工作、有时挂掉"——如果在 A 还没初始化完时 B 触发了 `import A`，`sys.modules['A']` 已经存在（是个半初始化的对象），B 拿到的是这个半成品，访问 A 顶层已定义的名字是 OK 的，访问还没执行到的名字就 `AttributeError`。

### 4.6 -m 模式如何把 cwd 加入 sys.path

`python -m module` 模式下，`sys.path[0]` 是 `''`（cwd），而不是脚本所在目录。这套逻辑在 `runpy` 模块里实现：

1. 解释器收到 `-m module` 参数，调用 `runpy._run_module_as_main(module, ...)`。
2. `runpy` 用导入系统定位 `module`：因为 `-m` 模式下没有"脚本所在目录"这个概念，解释器初始 `sys.path[0]` 被设为 `''`，意为 cwd。
3. `runpy` 通过正常导入流程把 `module` 加载进来，拿到它的代码对象。
4. 把 `module.__name__` 设为 `'__main__'`，把 `module.__package__` 设为模块本身所在的包（如果 `module` 是 `pkg.sub`，则 `__package__='pkg.sub'`）。
5. 在新命名空间里执行 `module` 的代码。

因为这个流程，`-m` 模式有几个跟脚本模式不同的特性：

- **`__package__` 不为 None**，所以模块内可以用相对导入（`from . import sibling`）。
- **cwd 被加入 sys.path**，所以"在哪个目录敲命令"会影响能 import 到的模块。
- **不是从文件路径启动**，所以"脚本目录"这个概念消失，没有遮蔽脚本目录的风险，但反过来也意味着：如果你期望"项目目录下的文件能自动互相 import"，需要保证 cwd 就是项目目录。

`runpy` 也支持 `python -m package` 这种写法，会执行 `package/__main__.py`。这是为什么很多库（如 `python -m http.server`、`python -m json.tool`）都能用 `-m` 直接跑起来——它们各自在包里放了一个 `__main__.py`。

### 4.7 finder / loader 协议与 importlib

如果你想自定义"导入行为"——比如从数据库导入模块、从加密文件导入模块、从网络导入模块——`sys.path` 不够用，得自己写查找器。这就是 `importlib` 提供的扩展点。

一个最小的自定义查找器：

```python
import sys
import importlib.abc
import importlib.util

class MyFinder(importlib.abc.MetaPathFinder):
    def find_spec(self, fullname, path, target=None):
        # 假设我们用一个特殊前缀 'magic_' 来表示从特殊源头加载
        if fullname.startswith('magic_'):
            # 这里我们偷懒直接返回一个空 spec，真实场景要写 loader
            return importlib.util.spec_from_loader(fullname, loader=None)
        return None

# 把自定义查找器插到 meta_path 最前面
sys.meta_path.insert(0, MyFinder())
```

这个 demo 只是骨架，没真正加载模块（loader=None 会让 import 失败），但它展示了原理：你往 `sys.meta_path` 里塞一个实现了 `find_spec` 的对象，解释器在导入任何模块时都会**先问它**（因为我们 insert 到了第 0 位）。利用这个机制，可以实现：

- `zipimporter`：从 zip 文件导入模块（标准库自带）。
- `pkgutil` 的 "namespace package" 支持。
- 各种打包工具（PyInstaller、cx_Freeze）的"从冻结资源加载模块"逻辑。
- 自己公司内部的"从私有仓库直接 import"插件。

而 `sys.path` 是 PathFinder 这一个特定 finder 的数据源。两者的关系是：

```
sys.meta_path = [BuiltinImporter, FrozenImporter, PathFinder(用 sys.path), 自定义finders...]
                      ↓
PathFinder.find_spec() 内部遍历 sys.path
```

所以完整地说："Python 去哪找模块"这个问题的精确答案不是 `sys.path`，而是"先查 `sys.modules` 缓存，再依次询问 `sys.meta_path` 里每个 finder，其中 PathFinder 这一个 finder 才是去查 `sys.path`"。`sys.path` 是这个流程里最常打交道的环节，但不是全部。

## 5. 总结

**本文内容要点**

- `sys.path` 是一个由目录路径字符串组成的列表，Python 执行 `import` 时按列表顺序查找模块，第一个命中的条目赢，全部没命中抛 `ModuleNotFoundError`。
- `sys.path` 的组成按顺序包括：脚本所在目录（或 cwd）、`PYTHONPATH` 环境变量、标准库目录、`lib-dynload`（C 扩展）、`site-packages`（第三方包），以及由 `.pth` 文件扩展出来的额外路径。
- `sys.path[0]` 在脚本模式下是脚本所在目录，在 `-m` 模式或交互式下是 `''`（cwd）。这条规则直接决定了"在哪个目录下敲命令"是否影响导入行为。
- 查看 `sys.path` 用 `import sys; sys.path`，查看某个模块实际加载位置用 `module.__file__` 或 `importlib.util.find_spec()`。
- 运行时可用 `sys.path.append` / `sys.path.insert` 动态加入临时目录，修改对后续 import 立即生效，但仅限当前进程、不持久。要让修改"半持久"或"持久"，用 `PYTHONPATH` 或 `.pth` 文件，或正式用 pip 安装。
- `ModuleNotFoundError` 的常见根因：虚拟环境没激活、装到了另一个 Python 版本、目标目录不在 `sys.path` 里、同名模块遮蔽、`sys.modules` 缓存让旧的 import 仍生效。
- 标准库 / 第三方库同名遮蔽的根因是 `sys.path` 顺序——脚本目录优先于标准库优先于 `site-packages`。规避手段是永远不要用标准库或常见三方库名命名自己的文件。
- `python a.py` 与 `python -m a` 的关键差异是 `sys.path[0]` 和 `__package__`，前者适合独立脚本，后者适合包入口、需要相对导入的场景。
- `sys.path` 里的相对路径会随 cwd 变化而指向不同位置，推荐往 `sys.path` 加路径时一律用 `os.path.abspath` 归一化。
- `sys.modules` 缓存早于 `sys.path` 查找，重复 import 不会重新执行模块代码；要重新加载用 `importlib.reload` 或先 `del sys.modules[name]` 再 import。
- 导入系统的完整链路是：`sys.modules` 缓存 → `sys.builtin_module_names` → `sys.meta_path` 里的 finder 依次尝试，其中 `PathFinder` 才是真正遍历 `sys.path` 的角色；finder 命中后由 loader 执行模块代码。`site` 模块在启动时填充 `site-packages` 及 `.pth` 扩展路径。

**读完本文你应能掌握**

- 能说出 `sys.path` 各组成部分的来源，并能解释"`-S` 启动会少哪些项"。
- 能说出 `python a.py` 与 `python -m a` 下 `sys.path[0]` 的差异，并据此选择正确的运行方式。
- 遇到 `ModuleNotFoundError` 时，能用 `sys.executable`、`sys.path`、`importlib.util.find_spec`、`__file__` 四件套定位根因。
- 能解释"同名遮蔽"的成因，并知道永远不要用标准库名命名自己的模块。
- 能正确使用 `sys.path.insert` 与 `sys.path.append` 做临时导入，并知道用绝对路径、清缓存、`PYTHONPATH` / `.pth` / pip 等更正式的替代手段。
- 能描述 import 系统的完整流程：`sys.modules` 缓存 → 内置模块 → `sys.meta_path` finder 链 → `PathFinder` 遍历 `sys.path` → loader 执行模块代码 → 写入缓存 → 绑定名字。
- 能区分 `sys.meta_path` 与 `sys.path` 的角色：前者是查找器列表（决定"用谁找"），后者是路径列表（决定"在哪找"，只对 PathFinder 这一个 finder 有意义）。