---
group:
  title: 【15】模块与包管理
  order: 15
order: 4
title: Package 与 __init__.py
nav:
  title: Python
  order: 1
---

## 1. 介绍

### 1.1 什么是包（Package）

当你的 Python 项目从一个文件长成几十个、上百个文件时，把所有模块都平铺在同一个目录里显然不可行——文件名冲突、职责混乱、难以维护。**包（Package）** 就是 Python 提供的模块分层组织机制：它把一组相关的模块放进一个目录，通过点号路径来引用，比如 `mypkg.core`、`mypkg.utils.logger`。可以说，包是"模块的模块"，是用来收纳模块的目录。

从文件系统角度看，最朴素的包就是一个**包含若干 `.py` 模块文件的目录**。在 Python 3.3 之前，这个目录里必须有一个名为 `__init__.py` 的文件（哪怕内容为空），Python 才会把它当作一个包；否则 `import mypkg` 会报错。`__init__.py` 的存在就是包的"身份证"。从 Python 3.3 起（PEP 420），没有 `__init__.py` 的目录也可以被当作一种特殊包——**命名空间包（namespace package）**——这是后文会讲到的进阶机制。

`__init__.py` 不只是个标识，它本身也是一个模块：当你执行 `import mypkg` 时，Python 会运行 `mypkg/__init__.py` 里的顶层代码，并把执行结果注册成一个**包对象**。这意味着你可以在 `__init__.py` 里做包级别的初始化、暴露公开 API、声明版本号、甚至做兼容性导入。理解 `__init__.py` 的作用，是从"会写模块"到"会组织项目"的关键一步。

### 1.2 最小示例：一个最简单的包

先看一个最小可运行的包结构。假设有如下目录：

```text
project/
└── mypkg/
    ├── __init__.py      # 标识这个目录是一个包
    ├── greet.py         # 子模块
    └── io_tool.py       # 子模块
```

其中 `__init__.py` 可以完全是空的（仅起标识作用），`greet.py` 内容如下：

```python
# mypkg/greet.py

def hello(name):
    return f"Hello, {name}!"

def goodbye(name):
    return f"Bye, {name}!"
```

在 `project/` 目录下启动 Python，就可以通过包路径来导入子模块：

```python
# 在 project/ 目录下运行 python
import mypkg.greet

print(mypkg.greet.hello("Alice"))
# 输出：Hello, Alice!
```

这里 `mypkg` 是包，`mypkg.greet` 是包里的子模块。`__init__.py` 哪怕为空，它的存在也让 Python 认定 `mypkg` 是一个包，从而能用点号路径访问其中的模块。

如果删掉 `__init__.py`（在 Python 3.3 之前的解释器上），`import mypkg.greet` 会直接报错：

```python
# 无 __init__.py 时（Python 3.3 之前）
import mypkg.greet
# 报错：ImportError: No module named mypkg.greet
```

这个最小示例揭示了两个事实：第一，包就是一个目录，里面放了模块；第二，`__init__.py` 是把"普通目录"变成"包"的关键文件。接下来我们展开讲它具体的用法与机制。

---

## 2. 核心内容

### 2.1 __init__.py 的两种姿态：空文件 vs 有内容

`__init__.py` 可以是两种姿态：**空文件**（纯标识）或**有内容的文件**（承担初始化职责）。理解两者的区别是掌握包的第一步。

**空的 __init__.py**

当包里的模块各自独立、彼此没有需要"提升"到包顶层的公开接口时，`__init__.py` 留空是最简单清晰的做法。它只做一件事：告诉 Python "这个目录是包"。

```text
mypkg/
├── __init__.py      # 空文件，0 字节
├── greet.py
└── io_tool.py
```

此时用户必须用完整路径来访问模块里的东西：

```python
import mypkg.greet
print(mypkg.greet.hello("Alice"))
# 输出：Hello, Alice!

from mypkg.greet import hello
print(hello("Bob"))
# 输出：Hello, Bob!
```

这种风格的好处是导入路径与文件结构一一对应，谁都能一眼看出 `hello` 定义在哪个文件里。缺点是包的用户要记得写一长串路径。

**有内容的 __init__.py**

当希望让包对外更"好用"时，可以在 `__init__.py` 里写代码，通常是把子模块里的名字"提升"到包的顶层命名空间。比如把 `greet.py` 里的 `hello` 暴露成 `mypkg.hello`，用户就可以写 `from mypkg import hello` 而不必知道它实际定义在 `greet.py` 中。

```python
# mypkg/__init__.py
from .greet import hello, goodbye
from .io_tool import read_text, write_text
```

这样对外使用就简洁多了：

```python
from mypkg import hello, goodbye

print(hello("Alice"))
# 输出：Hello, Alice!

print(goodbye("Bob"))
# 输出：Bye, Bob!
```

这就是绝大多数第三方库的做法：内部按职责拆成多个子模块，对外却只暴露一个干净的包级 API。用户不需要知道 `hello` 实际来自 `greet.py`，只需 `from mypkg import hello` 即可。

**两种姿态如何选择**

| 场景 | 推荐 | 原因 |
|------|------|------|
| 内部工具包、模块少且各自独立 | 空 `__init__.py` | 结构透明，无额外学习成本 |
| 对外发布的库 | 有内容的 `__init__.py` | 暴露精简 API，隐藏内部结构 |
| 需要包级初始化逻辑 | 有内容的 `__init__.py` | 初始化代码必须放在包的初始化模块里 |
| 纯数据/资源配置包 | 看情况 | 若只是被当容器用，空文件即可 |

### 2.2 包的初始化模块：导入包时执行顶层代码

`__init__.py` 是包的"入口模块"。每次**首次**导入这个包时，Python 会执行 `__init__.py` 里的所有顶层代码，然后把执行结果注册成一个包对象。这意味着你可以在 `__init__.py` 里做包级别的初始化工作。

一个典型场景是打印一句包初始化日志，帮助确认导入时机：

```python
# mypkg/__init__.py
print("[mypkg] 正在初始化包...")

VERSION = "1.2.0"

def get_version():
    return VERSION
```

在解释器里第一次导入这个包：

```python
>>> import mypkg
[mypkg] 正在初始化包...
>>> mypkg.VERSION
'1.2.0'
>>> mypkg.get_version()
'1.2.0'
```

注意打印只出现了一次。再次 `import mypkg` 不会重新执行 `__init__.py`：

```python
>>> import mypkg       # 第二次导入，没有再次打印
>>> mypkg.get_version()
'1.2.0'
```

这是因为 Python 的导入系统会把已导入的模块/包对象缓存在 `sys.modules` 里，第二次导入只是从缓存中取回这个对象，不再执行源码。细节在第 4 章原理部分会详细展开。

顶层代码在 `__init__.py` 里执行的顺序也很重要。`__init__.py` 从上到下顺序执行，这与普通模块一致：

```python
# mypkg/__init__.py
print("[1] 最先执行")

from .greet import hello

print("[2] 子模块导入之后执行")

def package_util():
    return "I am at package level"

print("[3] 全部顶层语句按顺序跑完")
```

```python
>>> import mypkg
[1] 最先执行
[2] 子模块导入之后执行
[3] 全部顶层语句按顺序跑完
>>> mypkg.hello("Zoe")
'Hello, Zoe!'
>>> mypkg.package_util()
'I am at package level'
```

可以看到，`__init__.py` 中定义的所有顶层名字（变量、函数、类，以及通过 `from .x import y` 引入的名字）都会成为包对象的属性，可供 `mypkg.xxx` 访问。

### 2.3 暴露公开 API：把子模块的名字提升到包顶层

这是 `__init__.py` 最常见、最重要的用途。设想你正在写一个文本处理库 `textool`，内部按职责拆成三个子模块：

```text
textool/
├── __init__.py
├── clean.py        # 清洗：去空白、去标点
├── split.py        # 分割：按句、按段
└── similarity.py   # 相似度：编辑距离、Jaccard
```

如果没有 `__init__.py` 里的提升，用户要这么用：

```python
from textool.clean import strip_whitespace, remove_punctuation
from textool.split import split_sentences
from textool.similarity import edit_distance
```

这要求用户记住每个函数分别在哪个子模块里——这是典型的"内部实现细节泄漏给用户"。更好的做法是在 `__init__.py` 里统一把这些名字提升到包顶层：

```python
# textool/__init__.py
from .clean import strip_whitespace, remove_punctuation
from .split import split_sentences, split_paragraphs
from .similarity import edit_distance, jaccard_similarity

__all__ = [
    "strip_whitespace",
    "remove_punctuation",
    "split_sentences",
    "split_paragraphs",
    "edit_distance",
    "jaccard_similarity",
]

__version__ = "0.3.1"
```

于是用户的代码就变得干净利落：

```python
from textool import (
    strip_whitespace,
    split_sentences,
    edit_distance,
    __version__,
)

text = "  Hello,   world!  "
cleaned = strip_whitespace(text)
print(cleaned)
# 输出：Hello, world!

sentences = split_sentences("Hi there. How are you? Bye.")
print(sentences)
# 输出：['Hi there', 'How are you', 'Bye']

print(edit_distance("kitten", "sitting"))
# 输出：3

print(__version__)
# 输出：0.3.1
```

**封装的意义**

这种做法的本质是**封装**：包内部如何切分模块是设计师自己的事，用户看到的只有一个统一的 `textool` 命名空间。这样做有几个好处：

1. **内部重构不影响用户**：哪天你把 `split_sentences` 从 `split.py` 挪到 `tokenize.py`，只要 `__init__.py` 里的导入路径同步修改，用户的 `from textool import split_sentences` 一行都不用改。
2. **降低认知负担**：用户只需记一个入口 `textool`，不需要记住包里有哪些子模块。
3. **便于控制公开 API**：配合 `__all__`（见 2.7），可以精确声明哪些名字是对外稳定的接口。

**一个常见模板**

很多成熟库的 `__init__.py` 长这样：

```python
# textool/__init__.py
"""textool —— 一个轻量级文本处理库。

提供清洗、分割、相似度计算等常用功能。
"""

from .clean import strip_whitespace, remove_punctuation
from .split import split_sentences, split_paragraphs
from .similarity import edit_distance, jaccard_similarity

__all__ = [
    "strip_whitespace",
    "remove_punctuation",
    "split_sentences",
    "split_paragraphs",
    "edit_distance",
    "jaccard_similarity",
]

__version__ = "0.3.1"


def __getattr__(name):
    # 懒加载：用到才导入重量级依赖，详见最佳实践
    if name == "Tokenizer":
        from .tokenize import Tokenizer
        return Tokenizer
    raise AttributeError(f"module 'textool' has no attribute {name!r}")
```

这里出现了 `__getattr__`，它让某些子模块可以被"懒加载"——只有在真正访问到时才导入，避免包初始化时拉起一整棵依赖树。这是较大库常用的优化技巧，第 3 章会再提。

### 2.4 包的嵌套：子包

包里可以再嵌套包，就像目录里可以再有子目录。只要每一层包目录里都有自己的 `__init__.py`（或都是命名空间包），Python 就能正确识别整条路径。

设想一个 Web 项目的包结构：

```text
webapp/
├── __init__.py
├── models/
│   ├── __init__.py
│   ├── user.py
│   └── post.py
├── views/
│   ├── __init__.py
│   ├── home.py
│   └── admin.py
└── utils/
    ├── __init__.py
    ├── logger.py
    └── cache.py
```

这里 `webapp` 是顶层包，`webapp.models`、`webapp.views`、`webapp.utils` 是它的三个子包。每一层 `__init__.py` 都各司其职：

```python
# webapp/__init__.py
print("[webapp] 顶层包初始化")
__version__ = "2.0.0"
```

```python
# webapp/models/__init__.py
from .user import User
from .post import Post

__all__ = ["User", "Post"]
```

```python
# webapp/models/user.py
class User:
    def __init__(self, name, email):
        self.name = name
        self.email = email

    def __repr__(self):
        return f"User({self.name!r}, {self.email!r})"
```

```python
# webapp/models/post.py
class Post:
    def __init__(self, title, author):
        self.title = title
        self.author = author

    def __repr__(self):
        return f"Post({self.title!r}, by {self.author.name!r})"
```

使用时可以按需导入到任何一层：

```python
>>> import webapp
[webapp] 顶层包初始化

>>> from webapp.models import User, Post
>>> u = User("Alice", "alice@example.com")
>>> p = Post("Hello", u)
>>> u
User('Alice', 'alice@example.com')
>>> p
Post('Hello', by 'Alice')
```

**关键点：导入子包会先触发父包的 __init__.py**

当你执行 `from webapp.models import User` 时，Python 的导入顺序是：先导入顶层包 `webapp`（执行 `webapp/__init__.py`），再导入子包 `webapp.models`（执行 `webapp/models/__init__.py`），最后才从 `webapp.models.user` 中取出 `User`。这就是为什么上面第一次 `import webapp` 时打印了 `[webapp] 顶层包初始化`，而之后 `from webapp.models import ...` 时顶层日志没有再打印——因为 `webapp` 已经被缓存进 `sys.modules`。

每一级 `__init__.py` 都是为它所在那一层包服务的：

| 文件 | 服务的包 |
|------|----------|
| `webapp/__init__.py` | 顶层包 `webapp` |
| `webapp/models/__init__.py` | 子包 `webapp.models` |
| `webapp/views/__init__.py` | 子包 `webapp.views` |

这意味着你可以把 `webapp.models` 当成一个独立的包来设计：它的 `__init__.py` 只暴露 `User`、`Post` 这些模型类，不关心 `views` 子包里有什么。这种分层让大型项目的结构非常清晰。

### 2.5 导入子模块的两种写法

导入包里的子模块有几种常见写法，它们的语义和可用名字略有不同，初学者容易混淆。这里统一讲清。

**写法一：`import mypkg.submod`**

```python
import mypkg.greet

print(mypkg.greet.hello("Alice"))
# 输出：Hello, Alice!
```

这种写法把整个 `mypkg.greet` 模块对象绑定到 `mypkg` 这个包对象的 `greet` 属性上。使用时必须写全路径 `mypkg.greet.hello`。优点是来源清晰——一眼看出 `hello` 属于 `mypkg.greet`；缺点是调用时啰嗦。

可以用 `as` 给模块起短别名：

```python
import mypkg.greet as g

print(g.hello("Alice"))
# 输出：Hello, Alice!
```

此时本地名字是 `g`，它指向 `mypkg.greet` 模块对象。这是一种很常用的折中：既保留"模块"层级，又避免长路径。

**写法二：`from mypkg import submod`**

```python
from mypkg import greet

print(greet.hello("Alice"))
# 输出：Hello, Alice!
```

这种写法把 `mypkg` 里的 `greet` 这个名字绑定到当前命名空间。使用时用 `greet.hello`。与 `import mypkg.greet` 的区别在于：当前作用域里多了一个 `greet` 名字，但**没有** `mypkg` 这个名字（除非你也 `import mypkg`）。

**写法三：`from mypkg.submod import name`**

```python
from mypkg.greet import hello

print(hello("Alice"))
# 输出：Hello, Alice!
```

这种写法直接把 `hello` 函数绑定到当前命名空间，是最简洁的。但代价是你失去了"它来自 `greet` 模块"这条信息。

**三种写法对比**

| 写法 | 绑定的本地名字 | 调用形式 | 适用场景 |
|------|----------------|----------|----------|
| `import mypkg.greet` | `mypkg` | `mypkg.greet.hello(...)` | 需要完整路径、避免命名冲突 |
| `import mypkg.greet as g` | `g` | `g.hello(...)` | 长路径的折中方案 |
| `from mypkg import greet` | `greet` | `greet.hello(...)` | 只关心子模块、不需要顶层包名 |
| `from mypkg.greet import hello` | `hello` | `hello(...)` | 只用到个别名字、追求简洁 |

**一个容易踩的坑**

`import mypkg.greet` 并不保证把 `greet` 作为 `mypkg` 的属性暴露出来——它只是让 `mypkg.greet` 这个模块对象被导入并缓存。不过由于 CPython 的导入机制会在导入子模块时给父包设置属性，实际上 `mypkg.greet` 这个属性通常是存在的。但如果你只写了 `import mypkg.greet`，想用 `from mypkg import greet`，能否成功取决于 `__init__.py` 是否也显式导入了 `greet`。最佳实践是：要么在 `__init__.py` 里显式 `from . import greet`，要么让用户自行写完整路径，不要依赖隐式行为。

### 2.6 __init__.py 常做的事：版本号、配置、兼容性导入

除了暴露 API，`__init__.py` 还承担几项常见职责。这里逐一举例。

**声明版本号 __version__**

几乎每个库都会在 `__init__.py` 里定义 `__version__`。它是约定的版本标识，方便用户和工具查询：

```python
# mypkg/__init__.py
__version__ = "1.4.2"
```

```python
>>> import mypkg
>>> mypkg.__version__
'1.4.2'
```

有时还会一并定义作者、协议等元信息：

```python
# mypkg/__init__.py
__version__ = "1.4.2"
__author__ = "张三"
__license__ = "MIT"
__all__ = ["hello", "goodbye"]
```

注意版本号最好只在一个地方维护。有些项目会在 `__init__.py` 里写一份，又在 `setup.py` / `pyproject.toml` 里写一份，导致两边不一致。解决方式之一是让 `setup.py` 读取 `__init__.py` 里的 `__version__`（通过正则解析），保证单一来源。

**包级配置初始化**

如果包需要一些全局配置（比如默认日志路径、缓存大小），可以在 `__init__.py` 里设置默认值并提供修改入口：

```python
# mypkg/__init__.py
import os

_CONFIG = {
    "cache_size": 128,
    "log_level": "INFO",
    "data_dir": os.path.expanduser("~/.mypkg"),
}

def configure(**options):
    """更新包级配置。"""
    for key, value in options.items():
        if key not in _CONFIG:
            raise KeyError(f"未知配置项: {key}")
        _CONFIG[key] = value

def get_config(key):
    return _CONFIG[key]
```

```python
>>> import mypkg
>>> mypkg.get_config("cache_size")
128
>>> mypkg.configure(cache_size=256, log_level="DEBUG")
>>> mypkg.get_config("cache_size")
256
>>> mypkg.get_config("log_level")
'DEBUG'
```

这种模式适合配置项不多的中小包。配置很多时通常会单独建一个 `config.py` 子模块，再在 `__init__.py` 里 `from .config import configure, get_config` 暴露出来。

**兼容性导入**

当代码需要在多个 Python 版本间兼容时，常在 `__init__.py` 里做条件导入，对外暴露统一的接口名：

```python
# mypkg/__init__.py
import sys

if sys.version_info >= (3, 11):
    # 3.11+ 用标准库自带的 tomllib
    from tomllib import load as toml_load, loads as toml_loads
else:
    # 旧版本回退到第三方 tomli
    from tomli import load as toml_load, loads as toml_loads

__all__ = ["toml_load", "toml_loads"]
```

这样用户只需要 `from mypkg import toml_load`，根本不需要关心当前 Python 版本用的是哪个实现：

```python
>>> from mypkg import toml_load
>>> toml_load  # 在 3.11+ 上
<built-in function load>
```

类似地，可选依赖也可以这样处理：

```python
# mypkg/__init__.py
try:
    import ujson as _json
    _has_ujson = True
except ImportError:
    import json as _json
    _has_ujson = False

def dumps(obj):
    return _json.dumps(obj, ensure_ascii=False)
```

**包级日志器**

很多包会为自身创建一个专用的 `logging.Logger`，方便用户在配置日志时按包名过滤：

```python
# mypkg/__init__.py
import logging

logger = logging.getLogger("mypkg")
logger.addHandler(logging.NullHandler())  # 默认不输出，由使用方决定
```

```python
>>> import mypkg
>>> mypkg.logger.warning("这是一条来自 mypkg 的告警")
# （默认不输出任何东西，因为只挂了 NullHandler）
```

这是一个非常值得效仿的最佳实践——它避免了库在被导入时擅自向 stderr 打印日志造成干扰，又把日志器暴露出来让应用层决定怎么处理。

### 2.7 __init__.py 中的 __all__：控制包级星号导入

`__all__` 是一个字符串列表，用来声明一个模块/包的**公开 API 清单**。它的主要作用是：当用户执行 `from mypkg import *` 时，只有 `__all__` 里列出的名字会被导入。

```python
# mypkg/__init__.py
from .greet import hello, goodbye
from .io_tool import read_text, write_text

__all__ = ["hello", "goodbye", "read_text", "write_text"]
```

```python
>>> from mypkg import *
>>> hello("Alice")
'Hello, Alice!'
>>> goodbye("Bob")
'Bye, Bob!'
```

如果 `__all__` 没有声明，`from mypkg import *` 的行为是：导入所有不以下划线开头的顶层名字。这往往会把一些"内部用、不打算对外"的名字也一并暴露出去，容易引发误用。因此给对外发布的包写 `__all__` 是一种好习惯。

不过这里只是简提 `__all__` 的基本作用，关于 `__all__` 在模块级、包级的更详细机制（包括它与 `dir()`、与 IDE 静态分析、与重导入的交互），会专门放在「06 __all__ 控制导出列表」一篇里展开。

一个值得注意的细节：`__all__` 只影响 `import *`，不影响显式导入。即便某个名字不在 `__all__` 里，用户依然可以 `from mypkg import that_name`（只要它确实是包的属性）。所以 `__all__` 是"建议性"的公开清单，而不是访问控制。

### 2.8 命名空间包（Namespace Package，PEP 420）

从 Python 3.3 起（PEP 420），一种新的包形态被引入：**命名空间包**（namespace package）。它最大的特点是：**一个包可以横跨多个目录**，且这些目录里都不需要 `__init__.py`。

**为什么需要命名空间包**

想象多个团队各自维护一个库，但希望它们都挂在同一个顶级命名空间下，比如 `ant.common.logging`、`ant.common.auth`、`ant.common.cache`，分别由三个团队独立打包发布。如果用传统包，`ant` 和 `ant.common` 必须各有一个 `__init__.py`，那这个 `__init__.py` 该由谁维护？谁发布 `ant` 这个包？命名空间包解决了这个"谁拥有顶级命名空间"的治理难题：顶级命名空间不属于任何单个包，它由所有贡献者共同撑起。

**最简示例**

```text
site-packages/
├── ant/
│   └── common/
│       └── logging.py        # 来自团队 A 的包 ant-common-logging
└── ant/
    └── common/
        └── auth.py           # 来自团队 B 的包 ant-common-auth
```

注意两个 `ant/common/` 目录分别属于两个不同的发行版（两个 wheel），里面都没有 `__init__.py`。当 Python 在 `sys.path` 上扫描时，会发现 `ant/` 目录里没有 `__init__.py`，于是把它登记成一个命名空间包，并把后续在别的路径上遇到的同名 `ant/` 也合并进来。

```python
>>> from ant.common import logging as ant_logging
>>> from ant.common import auth as ant_auth
>>> ant_logging.__name__
'ant.common.logging'
>>> ant_auth.__name__
'ant.common.auth'
```

两个来自不同发行版的子模块，在用户看来都同属 `ant.common` 这个包。

**命名空间包 vs 普通包**

| 特性 | 普通包（有 `__init__.py`） | 命名空间包（无 `__init__.py`） |
|------|--------------------------|------------------------------|
| 标识方式 | 目录里有 `__init__.py` | 目录里没有 `__init__.py` |
| 初始化代码 | 有，写在 `__init__.py` 里 | 没有，无初始化模块 |
| 能否横跨多目录 | 不能，一个包只对应一个目录 | 可以，多个目录合并为一个包 |
| `__file__` | 指向 `__init__.py` | 无 `__file__`，只有 `__path__` |
| 适用场景 | 单一项目自有的包 | 多团队共享顶级命名空间、大型集成 |

**容易混淆的点**

命名空间包和"普通包里子目录没有 `__init__.py`"不是一回事。一旦某个目录里放了 `__init__.py`，它就变成了普通包，会"遮蔽"同路径上的命名空间包。也就是说，如果你在 `sys.path` 的某个路径上放了 `ant/__init__.py`，那么 `ant` 就被锁定为普通包，其他路径上无 `__init__.py` 的 `ant/` 目录会被忽略。这也是为什么想用命名空间包就必须保证**所有**路径上的同名目录都不带 `__init__.py`。

第 4 章会进一步讲清命名空间包的查找机制——它和普通包的导入流程在底层有本质区别。

---

## 3. 最佳实践

### 3.1 用 __init__.py 暴露精简的公开 API

推荐做法是：包内部按职责拆分多个子模块，但对外只通过 `__init__.py` 暴露一个干净、稳定的 API 表面。

**推荐**

```python
# mypkg/__init__.py
from .core import greet, farewell
from .io_util import load, dump

__all__ = ["greet", "farewell", "load", "dump"]
__version__ = "1.0.0"
```

```python
# 用户代码
from mypkg import greet, load
```

**不推荐**

```python
# 用户代码
from mypkg.core import greet
from mypkg.io_util import load
```

不推荐的原因不是"这样会报错"，而是它让用户依赖了包的内部结构（`core`、`io_util` 这两个子模块名）。一旦设计师把 `greet` 从 `core.py` 挪到别的文件，用户代码就要跟着改。通过 `__init__.py` 暴露一层间接，可以把内部重构和对外 API 解耦。

### 3.2 别在 __init__.py 里放重活

`__init__.py` 在包首次被导入时执行，而且往往会被很多使用者触发。如果里面放了耗时操作（读大文件、连数据库、做网络请求），会显著拖慢所有第一次导入这个包的代码。

**不推荐**

```python
# mypkg/__init__.py  —— 反面教材
import pandas as pd

_DATA = pd.read_csv(" huge_dataset.csv ")   # 每次首次导入都读一个大 CSV
print("[mypkg] 数据已加载")
```

这段代码会让任何 `import mypkg` 的程序都先读一个巨大文件、还要拉起 `pandas` 这个重量级依赖，哪怕用户只是想用包里的一个纯函数。

**推荐**

把重活挪到显式的函数里，让用户主动调用：

```python
# mypkg/__init__.py
def load_dataset():
    import pandas as pd
    return pd.read_csv("huge_dataset.csv")
```

或者用懒加载（lazy import），直到真正用到时才触发：

```python
# mypkg/__init__.py
def __getattr__(name):
    if name == "DataFrame":
        import pandas as pd
        return pd.DataFrame
    raise AttributeError(f"module 'mypkg' has no attribute {name!r}")
```

```python
>>> import mypkg           # 此时不会导入 pandas
>>> df = mypkg.DataFrame()  # 访问时才触发 pandas 导入
```

`__getattr__` 这个模块级钩子（PEP 562，Python 3.7+）非常适合做包级懒加载，它能显著减轻大包的导入负担。

### 3.3 __init__.py 中避免循环导入

包的 `__init__.py` 经常需要导入子模块，而子模块又可能反过来需要包里的某些东西，这时容易陷入循环导入的死结。

**典型坑**

```python
# pkg/__init__.py
from .a import A
```

```python
# pkg/a.py
from . import b
class A:
    def use_b(self):
        return b.B()
```

```python
# pkg/b.py
from . import a    # 又要回头拿 a.A
class B:
    def use_a(self):
        return a.A()
```

执行 `import pkg` 时，`__init__.py` 先导入 `a`，`a` 又想 `from . import b`，`b` 又想 `from . import a`，而此时 `a` 还没导入完（`A` 还没定义），于是 `a.A` 就拿不到，抛出 `ImportError`。

**规避方式一：把共享的东西下沉到一个不依赖任何人的底层模块**

```python
# pkg/_base.py
class Base: ...
```

```python
# pkg/a.py
from ._base import Base
class A(Base): ...
```

```python
# pkg/b.py
from ._base import Base
class B(Base): ...
```

这样 `a` 和 `b` 都不互相依赖，只依赖 `_base`，循环就断了。

**规避方式二：把跨模块引用放到函数内部，延迟导入**

```python
# pkg/b.py
class B:
    def use_a(self):
        from .a import A    # 用到才导入，避免导入时循环
        return A()
```

延迟导入让"模块加载"和"使用模块里的名字"在时间上分开，循环依赖在加载阶段就不成立了。代价是每次调用都有一次极小的导入开销（已被 `sys.modules` 缓存，所以只是字典查找，几乎无开销）。

### 3.4 版本号单一来源

很多项目会同时在 `pyproject.toml`、`setup.py`、`pkg/__init__.py` 三处写版本号，没过多久就会三处不一致。

**推荐**

只在 `pkg/__init__.py` 里维护 `__version__`，构建配置从那里读取：

```python
# pkg/__init__.py
__version__ = "1.4.2"
```

```python
# pyproject.toml（配合 setuptools 动态读取版本）
[project]
name = "pkg"
dynamic = ["version"]

[tool.setuptools.dynamic]
version = {attr = "pkg.__version__"}
```

这样版本号只有一处真相，改了就改了。

### 3.5 以 NullHandler 为默认日志处理器

如果你的包会打印日志，请不要在 `__init__.py` 里给 logger 加 `StreamHandler`——那会在用户的应用里打印出他们没预期的日志行。

**推荐**

```python
# pkg/__init__.py
import logging

logging.getLogger("pkg").addHandler(logging.NullHandler())
```

`NullHandler` 什么也不做，只是占个位。用户在使用你的包时，可以自己配置 `pkg` 这个 logger 的 handler 和级别，你的包只管发出日志，不管怎么显示。这是 Python 官方文档明确推荐的库日志最佳实践。

### 3.6 命名空间包的使用建议

命名空间包虽好，但不是所有场景都该用。它主要是为"跨组织共享顶级命名空间"设计的，个人项目或单一组织内部的项目用普通包（带 `__init__.py`）更简单。

**推荐使用命名空间包的情况**

- 多个独立发布 wheel 需要共享一个顶级前缀（如 `ant.common.*`）。
- 大型企业里多个业务团队各自发布组件，但希望对外体现统一的品牌命名空间。

**不推荐使用命名空间包的情况**

- 单一项目、单一仓库——普通包更直观、调试更简单。
- 团队不熟悉 PEP 420 机制——误把 `__init__.py` 放进某个分支会破坏命名空间合并。

如果决定用命名空间包，务必保证：所有贡献方都不在该命名空间的任何目录里放 `__init__.py`，并在打包配置（如 `pyproject.toml` 的 `[tool.setuptools.packages.find]`）里正确声明命名空间。

---

## 4. 原理

本章深入 Python 导入系统的底层机制，讲清"为什么 `__init__.py` 能让目录变成包"、"导入包时到底发生了什么"、"命名空间包是怎么在没有 `__init__.py` 的情况下被找到的"。

### 4.1 包在导入系统中也是一个"模块对象"

很多人以为"模块（module）"和"包（package）"是两种截然不同的东西。其实从 Python 导入系统的角度看，包是模块的一种特例：**包本身就是一个模块对象，只不过它的 `__path__` 属性指向一个目录，而不是 `None`**。

可以在解释器里直接验证：

```python
>>> import mypkg
>>> type(mypkg)
<class 'module'>
>>> mypkg.__name__
'mypkg'
>>> mypkg.__file__
'/path/to/mypkg/__init__.py'
>>> mypkg.__path__
['/path/to/mypkg']
>>> mypkg.__package__
'mypkg'
```

对比一个普通模块：

```python
>>> import mypkg.greet
>>> type(mypkg.greet)
<class 'module'>
>>> mypkg.greet.__name__
'mypkg.greet'
>>> mypkg.greet.__file__
'/path/to/mypkg/greet.py'
>>> mypkg.greet.__path__
Traceback (most recent call last):
  ...
AttributeError: module 'mypkg.greet' has no attribute '__path__'
```

可以看到：

- 两者 `type()` 都是 `module`——包和模块在 Python 内部用同一种对象表示。
- 包的 `__file__` 指向它的 `__init__.py`；普通模块的 `__file__` 指向它自己的 `.py` 文件。
- 包有一个特殊的 `__path__` 属性（一个列表），表示"这个包的子模块应该去哪些目录里找"。普通模块没有 `__path__`。

这个统一的"模块对象"模型是理解很多包机制的关键：导入系统对包和模块一视同仁，`sys.modules` 里存放的都是 `module` 对象，只是包多了 `__path__` 这条线索。

### 4.2 __init__.py 就是包对象的代码

既然包是一个 `module` 对象，那它的"代码"从哪里来？答案就是 `__init__.py`。对于普通模块，`.py` 文件的源码会被编译成代码对象（`code object`）然后执行，执行结果填充到模块的 `__dict__` 里；对于包，`__init__.py` 的源码就是它的代码对象，执行 `__init__.py` 的过程就是把其中的顶层名字填到包对象的 `__dict__` 里。

可以这样观察：

```python
# mypkg/__init__.py
PI = 3.14159

def area(r):
    return PI * r * r
```

```python
>>> import mypkg
>>> "PI" in mykg.__dict__
Traceback (most recent call last):
  ...
NameError: name 'mykg' is not defined
>>> "PI" in mypkg.__dict__
True
>>> mypkg.__dict__["area"]
<function area at 0x...>
```

`mypkg.__dict__` 里能看到 `PI` 和 `area`——它们正是 `__init__.py` 顶层定义的名字。这和普通模块把顶层名字存进 `__dict__` 的机制完全一样，因为包本质上就是"源码来自 `__init__.py` 的模块"。

这也解释了为什么 `__init__.py` 里的所有顶层定义（`__version__`、`configure`、`from .x import y` 引入的名字）都能通过 `mypkg.xxx` 访问——它们就是包对象的属性。

### 4.3 导入包时的执行流程与 sys.modules 缓存

当你在代码里写 `import mypkg` 时，导入系统会走一套固定流程。理清这套流程，很多"为什么只执行一次""为什么导入子包会先初始化父包"的疑问就迎刃而解了。

**完整流程**

1. **查 `sys.modules` 缓存**：导入系统先看 `sys.modules` 这个大字典里有没有 `"mypkg"` 这个键。如果有，直接返回缓存的对象，流程结束——**不会再次执行 `__init__.py`**。
2. **查找器（Finder）阶段**：如果缓存里没有，导入系统会遍历 `sys.meta_path` 上的一系列查找器（`PathFinder` 是默认的其中一个），让它根据 `sys.path` 去找 `mypkg`。`PathFinder` 会扫描 `sys.path` 里的每个目录：
   - 如果在某目录下看到 `mypkg/__init__.py`，就认定这是一个**普通包**，返回一个 `ModuleSpec`，指明源文件就是该 `__init__.py`。
   - 如果看到 `mypkg/` 目录但没有 `__init__.py`，就尝试把它登记为**命名空间包**（见 4.5）。
   - 如果看到 `mypkg.py` 文件，就当作普通模块处理。
3. **加载器（Loader）阶段**：拿到 `ModuleSpec` 后，加载器创建一个新的 `module` 对象，把它先**放进 `sys.modules`**（这是关键：先放进去再执行代码，防止循环导入时重复创建），然后执行 `__init__.py` 的顶层代码，把结果名字填到 `module.__dict__` 里。
4. **返回**：导入语句把 `sys.modules["mypkg"]` 绑定到当前命名空间的名字（`import mypkg` 绑定 `mypkg`；`import mypkg.greet` 绑定 `mypkg` 且在其上挂一个 `greet` 属性）。

**为什么顶层代码只执行一次**

因为第 1 步的 `sys.modules` 缓存。第一次 `import mypkg` 时缓存里没有，走完整流程执行 `__init__.py`；第二次 `import mypkg` 时缓存里已经有了，直接返回旧对象，`__init__.py` 不会再跑。这跟普通模块的行为完全一致：

```python
>>> import mypkg
[mypkg] 正在初始化包...
>>> import mypkg          # 没有再次打印
>>> import mypkg          # 依然没有
```

如果你确实需要强制重新执行，可以用 `importlib.reload`：

```python
>>> import importlib
>>> importlib.reload(mypkg)
[mypkg] 正在初始化包...
<module 'mypkg' from '/path/to/mypkg/__init__.py'>
```

`reload` 会清掉缓存的模块对象、重新执行源码并更新原对象（而不是创建新对象）。但注意 `reload` 不会递归重载子模块，子模块的重新加载需要单独处理。

**为什么 import 子包会先初始化父包**

当执行 `import mypkg.models.user` 时，导入系统会按从左到右的顺序逐级导入：

1. 先导入 `mypkg`——执行 `mypkg/__init__.py`，缓存到 `sys.modules["mypkg"]`。
2. 再导入 `mypkg.models`——执行 `mypkg/models/__init__.py`，缓存到 `sys.modules["mypkg.models"]`。
3. 最后导入 `mypkg.models.user`——读 `mypkg/models/user.py`，缓存到 `sys.modules["mypkg.models.user"]`。

每一级的导入都会先查 `sys.modules`，所以如果 `mypkg` 已经被导入过，第 1 步会命中缓存，不会再次执行 `__init__.py`，但第 2、3 步仍会按需执行。这就解释了为什么"第一次 `import mypkg.models` 会触发 `mypkg/__init__.py` 执行"，而"已经导入过 `mypkg` 之后再 `import mypkg.models` 只会执行 `models/__init__.py`"。

### 4.4 子模块按需导入机制

一个常见疑问：`import mypkg` 时，Python 会不会把 `mypkg/` 目录下的**所有**子模块都自动导入？答案是**不会**。`__init__.py` 只执行自己那一层的内容，不会递归导入子模块。

验证一下。保持这样的结构：

```text
mypkg/
├── __init__.py
├── greet.py
└── io_tool.py
```

```python
# mypkg/greet.py
print("[greet] 被导入")
def hello(name): return f"Hello, {name}!"
```

```python
# mypkg/io_tool.py
print("[io_tool] 被导入")
def read_text(path): ...
```

```python
# mypkg/__init__.py
print("[mypkg] 初始化")
```

现在执行：

```python
>>> import mypkg
[mypkg] 初始化
```

可以看到 `[greet]` 和 `[io_tool]` 都没有被打印——它们没有被执行。只有显式导入时才会触发：

```python
>>> import mypkg.greet
[greet] 被导入
```

此时 `io_tool.py` 依然没被导入。这就是"按需导入"：子模块只有在被显式 `import` 或在 `__init__.py` 里被 `from .x import y` 提及的时候才会被加载。

**一个例外：__init__.py 里显式导入子模块**

如果 `__init__.py` 里写了：

```python
# mypkg/__init__.py
from .greet import hello
```

那么执行 `import mypkg` 时，`__init__.py` 的第一行就会触发 `greet` 的导入，`[greet]` 就会被打印。这正是"暴露公开 API"用法的底层原理——提升名字到包顶层的代价是导入包时就要导入那些子模块。这也是 3.2 节强调"别在 `__init__.py` 里放重活"的原因：`__init__.py` 里的每一个 `from .x import y` 都会让 `import mypkg` 变得更重。

### 4.5 命名空间包（PEP 420）的查找机制

命名空间包的查找流程与普通包有本质不同，关键在于"找不到 `__init__.py` 时该怎么办"。

**查找算法**

当 `PathFinder` 在 `sys.path` 上查找一个名为 `mypkg` 的模块/包时，它会依次扫描每个路径条目：

1. 如果某个目录 `X` 下存在 `mypkg/__init__.py`：直接认定 `mypkg` 是一个**普通包**，返回基于该 `__init__.py` 的 `ModuleSpec`，**后续路径不再扫描**。
2. 如果某目录 `X` 下存在 `mypkg/` 目录但没有 `__init__.py`：先把 `X/mypkg` 记录到一个候选列表里，**继续扫描剩余路径**，看有没有别的路径上也存在同名 `mypkg/` 目录。
3. 如果扫完所有路径后，候选列表非空，且没有任何一个路径上有 `mypkg/__init__.py` 或 `mypkg.py`：就把所有候选目录合并成一个**命名空间包**，它的 `__path__` 就是所有候选目录的列表。
4. 如果扫完发现既有候选目录又有 `__init__.py`：**`__init__.py` 胜出**，命名空间候选被丢弃——这就是 2.8 节强调的"一旦某个分支放了 `__init__.py` 就会遮蔽命名空间"。

**观察命名空间包的 __path__**

```text
/pathA/ant/common/logging.py
/pathB/ant/common/auth.py
```

`/pathA` 和 `/pathB` 都在 `sys.path` 里，且都没有 `__init__.py`。

```python
>>> import ant.common
>>> ant.common.__path__
_NamespacePath(['/pathA/ant/common', '/pathB/ant/common'])
>>> ant.common.__file__
Traceback (most recent call last):
  ...
AttributeError: module 'ant.common' has no attribute '__file__'
```

注意两个细节：

- `__path__` 是一个 `_NamespacePath` 对象，包含两个目录——这正是"包横跨多目录"的体现。
- 命名空间包没有 `__file__`，因为它没有对应的 `__init__.py` 源文件。这也是它"没有初始化代码"的原因——没有源码可执行。

**子模块的查找**

当执行 `from ant.common import logging` 时，导入系统会从 `ant.common.__path__`（那两个目录）里依次找 `logging.py`：先在 `/pathA/ant/common/logging.py` 找到，就导入它。如果再 `from ant.common import auth`，则在 `/pathA/ant/common/` 里没找到 `auth.py`，于是继续在 `/pathB/ant/common/` 里找，找到 `auth.py` 并导入。这样，来自两个不同目录的子模块就被统一组织在 `ant.common` 这个命名空间包下。

**为什么要"先放 `sys.modules` 再执行代码"**

前面提到加载器在第 3 步会先把新模块对象放进 `sys.modules` 再执行源码。这个顺序对解决循环导入至关重要。考虑：

```python
# pkg/__init__.py
from .a import A
```

```python
# pkg/a.py
from . import b
```

```python
# pkg/b.py
from . import a
```

执行 `import pkg` 时：

1. 创建 `pkg` 模块对象，放进 `sys.modules["pkg"]`。
2. 执行 `pkg/__init__.py`，遇到 `from .a import A`，开始导入 `pkg.a`。
3. 创建 `pkg.a` 模块对象，放进 `sys.modules["pkg.a"]`。
4. 执行 `pkg/a.py`，遇到 `from . import b`，开始导入 `pkg.b`。
5. 创建 `pkg.b` 模块对象，放进 `sys.modules["pkg.b"]`。
6. 执行 `pkg/b.py`，遇到 `from . import a`，此时 `sys.modules["pkg.a"]` 已经存在（第 3 步放入，虽然还没执行完），于是 `from . import a` 直接拿到那个半初始化的 `pkg.a` 对象。
7. `pkg/b.py` 执行完毕，`pkg.b` 完成。
8. 回到 `pkg/a.py` 继续执行，`pkg.a` 完成。
9. 回到 `pkg/__init__.py` 继续执行，`pkg` 完成。

虽然这个流程能跑通，但注意第 6 步拿到的是"半初始化的 `pkg.a`"——如果此时 `b` 里立即访问 `a.A`，而 `A` 还没定义，就会报错。所以前面 3.3 节强调：把跨模块引用放进函数体内延迟导入，能彻底绕开这种时序陷阱。

### 4.6 __init__.py 顶层代码执行时机与一次执行特性

把前面几节的机制合在一起，可以总结出 `__init__.py` 顶层代码的几条硬性规律：

1. **执行时机**：在"首次"导入该包的语句被解析时执行。无论这条导入语句是 `import mypkg`、`import mypkg.sub`、`from mypkg import x` 中的哪一种，只要 Python 需要这个包对象而 `sys.modules` 里还没有，就会触发执行 `__init__.py`。
2. **一次执行**：Python 进程内，同一个包的 `__init__.py` 顶层代码最多执行一次。之后所有对该包的导入都从 `sys.modules` 缓存返回，不会再跑源码。除非显式调用 `importlib.reload`。
3. **顺序执行**：`__init__.py` 的顶层语句从上到下依次执行，与普通模块一致。位于文件顶部的 `from .x import y` 会立即触发子模块 `x` 的导入，而不仅仅是"登记一个引用"。
4. **先注册后执行**：加载器会先把空的包对象放进 `sys.modules` 再执行顶层代码，这一点让循环导入至少能在"拿到半成品对象"层面不死锁。
5. **副作用持久**：`__init__.py` 顶层执行的所有副作用（修改的全局变量、注册的日志器、创建的单例）都会伴随包对象存活到进程结束，除非显式清理。

下面用一个综合例子把这几条规律展示清楚。包结构：

```text
demo/
├── __init__.py
└── sub.py
```

```python
# demo/__init__.py
print("[demo] 1. 开始执行 __init__.py")
REGISTRY = []
print("[demo] 2. 准备导入子模块 sub")
from .sub import register_self   # 这里会触发 sub 的导入
print("[demo] 3. sub 已导入，REGISTRY =", REGISTRY)

def hello():
    return "hello from demo"
```

```python
# demo/sub.py
print("[sub] 开始执行 sub.py")
REGISTRY_REF = None  # 占位，稍后填

def register_self():
    # 这个函数会在 demo/__init__.py 完成后被外部调用
    return "registered"
```

在解释器里演示"一次执行"和"顺序执行"：

```python
>>> import demo
[demo] 1. 开始执行 __init__.py
[demo] 2. 准备导入子模块 sub
[sub] 开始执行 sub.py
[demo] 3. sub 已导入，REGISTRY = []
>>> import demo
>>>  # 第二次没有任何输出：sys.modules 命中缓存
>>> demo.hello()
'hello from demo'
>>> demo.register_self()
'registered'
>>> "REGISTRY" in demo.__dict__
True
```

观察要点：

- 打印顺序严格自上而下：`[demo] 1` → `[demo] 2` → `[sub]` → `[demo] 3`。这印证了"顺序执行"以及"`from .sub import ...` 会立即触发 sub 导入"。
- 第二次 `import demo` 没有任何输出，印证了"一次执行"。
- `demo.__dict__` 里有 `REGISTRY` 和 `hello`，印证了"顶层名字都成为包对象属性"。
- `demo.register_self` 可用，因为 `from .sub import register_self` 把它提升到了包顶层。

理解了这五条规律，就能解释几乎所有"`__init__.py` 相关的怪现象"：为什么某个副作用只发生一次、为什么 `import` 顺序会影响结果、为什么 `reload` 后某些单例没被重置——都可以从"执行时机 + 一次执行 + 顺序执行 + 先注册后执行 + 副作用持久"这五条规律推出。

---

## 5. 总结

### 5.1 本文内容要点

- 包（Package）是把一组相关模块组织在一个目录里的机制，通过点号路径（如 `mypkg.core`）分层访问。
- `__init__.py` 是包的"身份证"：在 Python 3.3 之前必须有，它把普通目录标识为包。
- `__init__.py` 同时是包的初始化模块：导入包时执行其顶层代码，顶层定义的名字成为包对象的属性。
- 最常见的用法是在 `__init__.py` 里 `from .submod import X`，把子模块的名字"提升"到包顶层，对外暴露精简的公开 API，隐藏内部结构。
- `__init__.py` 常做的事：暴露公开 API、声明 `__version__`、包级配置初始化、兼容性/可选依赖导入、创建包级日志器。
- 空的 `__init__.py` 也非常常见，适用于纯标识、子模块各自独立的场景。
- 包可以嵌套：每一层包目录都有自己的 `__init__.py`，各自服务自己那一层。
- 导入子模块有三种主要写法：`import mypkg.sub`、`from mypkg import sub`、`from mypkg.sub import name`，区别在于绑定的本地名字和调用形式。
- `__all__` 控制包级 `from mypkg import *` 的导出清单，是"建议性"的公开 API 声明，不是访问控制。
- 命名空间包（PEP 420）允许无 `__init__.py` 的目录被当包，且一个包可以横跨多个目录，适合多团队共享顶级命名空间。
- 原理层：包在导入系统中也是一个 `module` 对象，`__init__.py` 就是它的源码；导入包时先查 `sys.modules` 缓存，未命中则创建包对象、先放进缓存、再执行 `__init__.py`；子模块按需导入，不会递归加载；命名空间包通过扫描 `sys.path` 上所有同名目录合并而成，没有 `__file__`，只有 `__path__`。
- `__init__.py` 顶层代码的五条规律：执行时机在首次导入、一次执行、顺序执行、先注册后执行、副作用持久。

### 5.2 读完本文你应能掌握

- 说清"包"和"模块"的关系，以及 `__init__.py` 在其中的角色。
- 为一个包含多个子模块的包编写合适的 `__init__.py`：既能纯空标识，也能暴露公开 API、声明版本号、做兼容性导入。
- 区分 `import mypkg.sub`、`from mypkg import sub`、`from mypkg.sub import name` 三种写法的语义差异，并在不同场景下正确选用。
- 理解包的嵌套结构，能为多层级项目设计 `webapp/models/__init__.py` 这种子包初始化文件。
- 解释 `__all__` 对 `import *` 的影响，知道它是"建议"而非"访问控制"。
- 说清命名空间包与普通包的区别、各自适用场景，以及"一旦放了 `__init__.py` 就遮蔽命名空间"这一坑点。
- 描述导入包时的完整流程：查 `sys.modules` → `PathFinder` 查找 → `Loader` 加载 → 先注册后执行 → 子模块按需导入。
- 解释为什么 `__init__.py` 顶层代码只执行一次、为什么导入子包会先初始化父包、为什么 `__init__.py` 里不宜放重活。
- 能判断并规避 `__init__.py` 中的循环导入陷阱，会用"下沉共享依赖"和"函数内延迟导入"两种方式破解循环。