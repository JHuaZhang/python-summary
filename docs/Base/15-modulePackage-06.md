---
group:
  title: 【15】模块与包管理
  order: 15
order: 6
title: __all__ 控制导出列表
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 `__all__`

如果一个模块里写了十几个函数、类、常量，但其中只有三四个是对外公开的"官方 API"，其余都是内部实现细节，那么你大概会希望：当别人用 `from your_module import *` 把你的模块"整个倒进来"时，只倒进那三四个公开名字，而不是把所有名字一股脑全倒进他的命名空间——那既会污染他的环境，也等于把你的内部实现"承诺"给了外部使用者。

`__all__` 就是 Python 提供给模块作者的这个开关。它是一个**字符串列表**，定义在模块的顶层（也就是模块全局作用域），用来显式声明："本模块的公开 API，就是这里列出的这些名字。"它的唯一作用，是控制 `from module import *` 这一种语句到底会导入哪些名字。

```python
# module_a.py
__all__ = ["public_func", "PUBLIC_VALUE"]

def public_func():
    return "对外公开"

def _internal_helper():
    return "内部实现"

PUBLIC_VALUE = 42
_HIDDEN_VALUE = -1
```

```python
# 使用方
from module_a import *

print(public_func())   # 可用：在 __all__ 里
# 输出：对外公开

print(PUBLIC_VALUE)    # 可用：在 __all__ 里
# 输出：42

print(_internal_helper())  # NameError：不在 __all__ 里，没有被 * 导入
print(_HIDDEN_VALUE)       # NameError：同样是 _ 开头，没被 * 导入
```

这就是 `__all__` 最核心的含义：**它是模块作者写给"星号导入"的一份白名单**。在这份白名单上的名字，`from module import *` 会导入；不在这份名单上的名字，即便模块里确实定义了，也不会被星号导入带进来。

### 1.2 它解决的是什么问题

要先理解 `__all__` 的价值，得先看"没有 `__all__`"时 `from m import *` 会发生什么。当一个模块没有定义 `__all__`，`from m import *` 的默认行为是：把模块命名空间里**所有不以单下划线 `_` 开头的、已绑定的名字**全部导入到当前命名空间。也就是说，单下划线开头的名字（`_internal`）默认会被星号导入"过滤掉"，而其余所有名字——无论你是不是想公开——都会被倒进来。

这个"以下划线为隐私约定"的默认规则，大部分时候够用：你只要把内部函数命名成 `_helper`、把内部常量命名成 `_config`，星号导入自然就不带它们了。但它有几个不够好的地方：

1. **依赖命名约定，而非显式声明**。公开面是"所有非下划线名字"反向推导出来的，等于"没主动说什么是公开的，只是说了什么不是"。模块一变大，公开面就成了一个不断膨胀的模糊集合。
2. **容易把"不想公开但也不想加下划线"的名字泄露出去**。比如你 `from os.path import join` 进来用，`join` 就成了你模块里的一个非下划线名字，星号导入会把它也倒给使用者——但 `join` 根本不是你想提供的 API，只是你顺手借用的。
3. **文档和工具无法识别公开面**。`help(module)`、文档生成器、IDE 的自动补全，在没有 `__all__` 时只能把所有非下划线名字都当作"可能的公开 API"展示，公开面不清晰。

`__all__` 把"公开 API 是什么"从隐式约定变成了显式声明。你列出来的就是公开的，没列出来的就不是；工具和文档也能精确地知道这个模块对外承诺了哪些名字。

### 1.3 最基本的语法形式

`__all__` 是一个模块级的列表，写法非常朴素：

```python
# mymod.py
__all__ = ["create_user", "delete_user", "USER_ROLES"]

def create_user(name): ...
def delete_user(name): ...
def _validate(name): ...   # 内部实现，不进 __all__

USER_ROLES = ("admin", "staff", "guest")
```

```python
# 使用方
from mymod import *

print(dir())  # 看 * 到底导入了什么
# 输出：['__builtins__', ..., 'create_user', 'delete_user', 'USER_ROLES']
```

要点：

- `__all__` 必须是一个**字符串序列**（最规范是 `list[str]`），每个字符串是模块里一个名字。
- 它必须定义在**模块的顶层作用域**（模块全局变量），写在函数里、类里都不算数——导入机制只看模块的 `__dict__` 顶层。
- 它**只在 `from module import *` 这一种语句**中生效，对 `import module`、`from module import some_name`（显式导入某个具体名字）一律没影响。
- 没有 `__all__` 时退回到"以下划线为隐私约定"的默认规则。

这四句话构成了 `__all__` 的全部行为契约。后面的章节就是把这四句话逐条展开、讲透。

## 2. 核心内容

### 2.1 `__all__` 的定义形式与位置

`__all__` 本质上就是模块命名空间里的一个普通变量，名字是 `__all__`（前后各两个下划线）。导入机制会特意去模块的 `__dict__` 里找这个变量，找到了就按它的内容来执行星号导入；找不到就走默认规则。

它的定义有两个"硬要求"和一个"规范"：

- **硬要求一：必须是序列**。Python 执行星号导入时，会把 `__all__` 当作可迭代对象去遍历，逐个取出名字字符串。所以列表、元组甚至集合都能被识别，不会报错。
- **硬要求二：元素必须是字符串**。每个元素会被当成一个"模块里已有的名字"，导入机制会用这个字符串去模块的 `__dict__` 里查找对象。如果元素不是字符串（比如写成了 `__all__ = [public_func]` 把函数对象本身放进去），会在执行星号导入时抛 `TypeError`。
- **规范：用列表**。虽然元组、集合都能跑，但 PEP 8 与社区惯例统一用列表来写 `__all__`。一方面列表是"可变的、可追加的"序列，符合"公开 API 会随版本演进追加"的直觉；另一方面大量标准库、第三方库都遵循这个约定，保持一致便于读者一眼识别。

**位置上**，`__all__` 通常写在模块靠近顶部的位置——一般在 `import` 语句之后、主要定义之前。这不是语法强制（只要在模块加载完毕时它存在即可），但把它写在顶部有两点好处：一是读者打开文件第一眼就能看到"这个模块对外提供什么"，二是避免被某个有副作用的代码块提前触发星号导入而此时 `__all__` 还未定义的边角问题。

```python
# 推荐写法：__all__ 紧跟 import 之后
"""用户管理模块。"""

import threading
from typing import Sequence

__all__ = ["User", "create_user", "list_users"]

class User:
    ...

def create_user(name: str) -> User:
    ...

def list_users() -> Sequence[User]:
    ...

def _next_id():   # 内部实现
    ...
```

**一个常见疑问**：`__all__` 里的字符串要不要包含模块自己 `import` 进来的名字？一般情况下**不要**。`__all__` 列的应该是"本模块定义、并对外公开"的名字。如果你把 `from os.path import join` 写在了模块里、又不希望 `join` 被 `from m import *` 重新导出，那就不要把 `"join"` 放进 `__all__`；只要不放进去，星号导入就不会把它带出去（哪怕 `join` 在你的模块命名空间里确实存在，是个非下划线名字）。这恰恰是 `__all__` 相对于"以下划线为约定"的默认规则的一大优势——它可以让"非下划线名字"也不被星号导出。

### 2.2 没有 `__all__` 时 `from m import *` 的默认行为

要真正理解 `__all__` 在做什么，必须先看清"没有它"时的默认行为。下面准备一个不写 `__all__` 的模块：

```python
# default_mod.py（不定义 __all__）
import os                    # 导入进来的名字 os
from collections import defaultdict   # 导入进来的名字 defaultdict

def public_func():
    return "公开函数"

def _private_func():
    return "下划线开头，默认被过滤"

PUBLIC_CONST = 100
_PRIVATE_CONST = -1

class PublicClass:
    pass

class _PrivateClass:
    pass
```

```python
# 使用方
from default_mod import *

print(sorted(name for name in dir() if not name.startswith("__")))
# 输出：['PublicClass', 'PUBLIC_CONST', 'defaultdict', 'os', 'public_func']
```

可以观察到，没定义 `__all__` 时，`from m import *` 带进来的名字包括：

- `public_func`、`PublicClass`、`PUBLIC_CONST`：本模块定义的、非下划线开头的名字——这些是你"可能想公开"的。
- `os`、`defaultdict`：模块自己 `import` 进来的、非下划线开头的名字——这些通常**不是**你想公开的，但默认规则照样把它们倒了出来。
- 而 `_private_func`、`_PrivateClass`、`_PRIVATE_CONST` 因为以下划线开头，被默认规则过滤掉了。

这就是默认规则的全部内容：**遍历模块命名空间，所有不以 `_` 开头的已绑定名字，统统导入**。这个规则简单但粗放，它有两个实际痛点：

第一，由模块自身 `import` 进来的名字会被"再导出"。使用者 `from default_mod import *` 后，突然发现自己的环境里冒出来一个 `os`、一个 `defaultdict`，这通常是意料之外的污染，也等于让 `default_mod` 的公开 API 平白沾了 `os` 和 `defaultdict` 的边。

第二，公开面是"反向"推导出来的。你不主动声明公开什么，只是隐式地通过"加了下划线"来排除不想公开的——剩下没加下划线的全部默认公开。模块越写越大，公开面就越糊。

`__all__` 就是用来纠正这两点的。

### 2.3 定义 `__all__` 后 `from m import *` 只导入白名单

现在给上面的模块加上 `__all__`，看星号导入的行为怎么变化：

```python
# curated_mod.py（定义 __all__）
import os
from collections import defaultdict

__all__ = ["public_func", "PublicClass", "PUBLIC_CONST"]

def public_func():
    return "公开函数"

def _private_func():
    return "下划线开头，默认被过滤"

PUBLIC_CONST = 100
_PRIVATE_CONST = -1

class PublicClass:
    pass

class _PrivateClass:
    pass
```

```python
# 使用方
from curated_mod import *

print(sorted(name for name in dir() if not name.startswith("__")))
# 输出：['PUBLIC_CONST', 'PublicClass', 'public_func']
```

对比一下两组输出：

- 没有 `__all__` 时带进来 5 个名字（含 `os`、`defaultdict`）。
- 定义 `__all__` 后只带进来 3 个名字，正好是 `__all__` 里列出来的那三个；`os` 和 `defaultdict` 不再被星号导出，即便它们在 `curated_mod` 的命名空间里依然存在、且不是下划线开头。

这就是 `__all__` 的核心效果：**星号导入完全只看 `__all__` 这份名单**。名单上有的才导入，名单上没有的一律不动；模块里其他以 `_` 开头的名字、模块自己 `import` 进来的名字，统统不会再被 `from m import *` 带出去。

进一步看一个细节：`__all__` 里列出的名字，即便本身以下划线开头，也会被星号导入带出来。也就是说，`__all__` 的优先级高于"下划线约定"——名单里写什么就导出什么。

```python
# odd_case.py
__all__ = ["_weird_but_exported"]

def _weird_but_exported():
    return "虽然下划线开头，但 __all__ 点名要导出"

def normal_name():
    return "不在 __all__ 里，星号导入不会带我走"
```

```python
from odd_case import *

print(sorted(name for name in dir() if not name.startswith("__")))
# 输出：['_weird_but_exported']

print(_weird_but_exported())
# 输出：虽然下划线开头，但 __all__ 点名要导出

print(normal_name())   # NameError：没被 * 导入
```

这是个边角但能说明机制的例子：一旦 `__all__` 出场，"下划线开头"这个默认过滤规则就被完全取代了，名单才是唯一的依据。当然，实际项目中我们不会故意把下划线开头的名字写进 `__all__`——这违背了下划线作为"隐私"标记的直觉，只会让读者困惑。这里提它，只是为了强调"`__all__` 说了算"。

### 2.4 `__all__` 不影响 `import m` 与显式 `from m import name`

`__all__` 的作用域非常窄——它只对 `from module import *` 这一种语句生效。另两种导入语句完全不读 `__all__`：

**`import module`**：这是把整个模块对象绑定到一个名字上。要拿到模块里的任何东西，都得通过 `module.xxx` 去访问。`__all__` 与此无关——模块对象上所有已绑定的属性（不管下划线开头、不管是否在 `__all__` 里）都能通过属性访问拿到。

```python
import curated_mod

# 任何在模块命名空间里的名字，都能 module.xxx 取到，与 __all__ 无关
print(curated_mod.public_func())     # 在 __all__ 里
# 输出：公开函数

print(curated_mod._private_func())   # 不在 __all__ 里、下划线开头，照样能访问
# 输出：下划线开头，默认被过滤

print(curated_mod.os.getcwd())       # 模块自己 import 的 os 也能拿到
```

**`from module import name`**（显式指定一个或多个名字）：这是按"名字去模块里取对象"的语义，**名字不穿越 `__all__` 的过滤**——只要你点名要，模块里确实有这个对象，就给你；即便这个对象不在 `__all__` 里、即便它以下划线开头，也一样能显式导入。`__all__` 是为"星号导入"准备的开关，不是"访问控制"或"权限限制"——它不会、也无法阻止使用者显式拿走任意一个名字。

```python
from curated_mod import _private_func, PUBLIC_CONST, os

print(_private_func())   # 显式导入 _ 开头名字，不被 __all__ 阻挡
# 输出：下划线开头，默认被过滤

print(PUBLIC_CONST)      # 在 __all__ 里，也能显式导入
# 输出：100

print(os.getcwd())       # 模块 import 的 os 也能被显式导入
```

这一点很关键：`__all__` 不是"私有/公开"的访问控制机制，它**只控制星号导入这一个场景**。把一个名字不放进 `__all__`，挡住的只是"`from m import *` 这条路"，挡不住"`from m import that_name`"这条路。如果你真的想阻止外部访问某个名字，Python 没有内置的访问控制可以做到——约定上靠下划线"建议"别用，强一致地隔离靠把内部实现放进以 `_` 开头的子模块或私有的包路径。

**一个小对比**

| 导入形式 | 是否读 `__all__` | 能否拿到不在 `__all__` 里的名字 |
| --- | --- | --- |
| `import module` | 否 | 能（通过 `module.name` 访问任意属性） |
| `from module import name` | 否 | 能（按名字显式取） |
| `from module import *` | 是 | 不能（只拿 `__all__` 列出的名字） |

这张表浓缩了 `__all__` 的全部行为边界，值得记住。

### 2.5 `__all__` 与下划线隐私约定的配合

"下划线表示隐私"和 "`__all__` 显式声明公开面"其实是两套互补的机制，理解它们怎么配合，才能写出干净的模块公开接口。

**单一机制各自的盲区**：

- 只用下划线约定：公开面是"非下划线名字"的反向集合。你无法把"非下划线但不想公开"的名字挡在星号导入之外（例如自己 `import` 进来的 `os`、`defaultdict`）。
- 只用 `__all__` 而不顾下划线：公开面是清晰的，但模块内部仍会出现大量"我以为它该是隐私、却没加下划线"的名字。虽然星号导入不会带它们出去（因为不在 `__all__` 里），但读者打开源码时无法一眼分辨哪些是"内部用的"、哪些是"公开但漏列进 `__all__` 的"。

**推荐的双层配合**：模块内部的实现细节，无论是否定义 `__all__`，都按惯例加下划线前缀；在此之上，再用 `__all__` 把"真正对外公开的名字"显式列出来。这样你在两层都设置了信号——下划线告诉读者"这是内部实现"，`__all__` 告诉工具与文档"这是公开 API"。两层叠加，公开面最清晰、误用风险最低。

```python
# utils.py ——双层配合的推荐写法
import re
from typing import Pattern

__all__ = ["split_tokens", "TOKEN_PATTERN"]

TOKEN_PATTERN = r"\w+"

def split_tokens(text: str):
    return _compile(TOKEN_PATTERN).findall(text)

def _compile(pattern: str) -> Pattern:
    # 下划线开头：内部实现
    return re.compile(pattern)

def _strip_borders(text: str) -> str:
    # 下划线开头：内部实现
    return text.strip()
```

这里 `_compile`、`_strip_borders` 既以下划线开头、又不在 `__all__` 里，双重标记"这是内部实现"；`split_tokens`、`TOKEN_PATTERN` 既无下划线、又在 `__all__` 里，双重标记"这是公开 API"。哪怕读者只看其中一层信号，也能正确判断每个名字的角色。

### 2.6 `__all__` 用于显式声明公开 API

即便你的模块**不会被星号导入**（工程规范里很多团队明确禁止 `from m import *`），定义 `__all__` 仍然有意义。它的第二重价值是：**作为模块公开面的显式声明，供工具、文档、IDE 识别**。

这一点往往被忽视。下面看几个"`__all__` 不依赖星号导入也发挥作用"的场景：

**场景一：文档生成器**。像 Sphinx、pdoc 这类工具，会优先读取 `__all__` 来决定"这个模块要为哪些名字生成文档"。没有 `__all__` 时，它们退回到"所有非下划线名字"，于是你的文档里就会混入模块自己 `import` 进来的 `os`、`defaultdict` 之类，看起来像你的 API 实则不是。有 `__all__` 时，文档干净、公开面精确。

**场景二：IDE 与静态分析**。某些 IDE 在"自动补全模块成员"时，优先生成 `__all__` 列出的名字；某些静态分析工具在做"未使用导入"检查时，也会参考 `__all__` 来判断"这个 import 是模块自身的实现细节、还是对外 API 的一部分"。

**场景三：代码可读性**。读者打开你的模块文件，第一眼看到 `__all__ = ["xxx", "yyy"]`，立刻知道"这个模块对外只承诺这两件事"。这比让读者翻遍整个文件、自己推断哪些是公开哪些是内部，要友好得多。

```python
# config_loader.py
"""配置加载模块。

即便团队规范禁止 ``from config_loader import *``，
__all__ 仍作为对外 API 的显式声明，供文档与 IDE 识别。
"""

import json
from pathlib import Path

__all__ = ["load_config", "ConfigError"]

class ConfigError(Exception):
    """配置加载失败的异常类型。"""

def load_config(path: Path):
    """加载 JSON 配置文件。"""
    text = path.read_text(encoding="utf-8")
    try:
        return _parse(text)
    except ValueError as e:
        raise ConfigError(str(e)) from e

def _parse(text: str):
    # 内部实现：实际解析 JSON
    return json.loads(text)
```

这里 `load_config` 和 `ConfigError` 是公开 API，`_parse` 是内部实现。即便没有人会 `from config_loader import *`，`__all__` 的存在也让 Sphinx、pdoc、IDE 都知道"这个模块的文档只要写这两项"，读者也一眼看清模块的角色。

### 2.7 用 `__all__` 给包 `__init__.py` 定义公开 API

`__all__` 最有威力的一个场景，是包的 `__init__.py`。一个包往往由多个子模块组成，每个子模块有自己的函数和类；而对外使用者通常只写 `import mypkg` 或 `from mypkg import xxx`——他们面对的是包的 `__init__.py`，而不是包内部的子模块。这时候，`__init__.py` 里的 `__all__` 就成了"整个包的公开 API 清单"。

看一个典型结构：

```
mypkg/
├── __init__.py
├── api.py
├── models.py
└── _internal.py
```

```python
# mypkg/api.py
def create_user(name):
    return f"User({name})"

def delete_user(name):
    return f"deleted {name}"
```

```python
# mypkg/models.py
class User:
    def __init__(self, name):
        self.name = name
```

```python
# mypkg/_internal.py
def hash_password(pw):
    return f"hashed-{pw}"   # 内部实现，不对外
```

```python
# mypkg/__init__.py
from .api import create_user, delete_user
from .models import User

__all__ = ["create_user", "delete_user", "User"]
```

使用方：

```python
import mypkg

print(sorted(mypkg.__all__))
# 输出：['User', 'create_user', 'delete_user']

print(mypkg.create_user("alice"))
# 输出：User(alice)

print(mypkg.User("bob").name)
# 输出：bob

print(mypkg.delete_user("alice"))
# 输出：deleted alice
```

```python
from mypkg import *

print(sorted(name for name in dir() if not name.startswith("__")))
# 输出：['User', 'create_user', 'delete_user']
```

这个写法的几个要点：

1. **`__init__.py` 把对外名字"提上来"**。`create_user`、`delete_user` 定义在 `api.py` 里，但通过 `from .api import create_user` 把它们绑定到了包的命名空间上。使用者写 `mypkg.create_user` 就能拿到，无需关心它在哪个子模块。
2. **`__init__.py` 的 `__all__` 是包级公开面**。它列出的就是 `import mypkg`、`from mypkg import *` 会看到的对外清单。子模块里还有什么名字、`_internal.py` 里有什么实现，使用者一概不必知道。
3. **内部实现用下划线子模块**。`_internal.py` 以下划线开头，连模块名本身都是"隐私"信号——使用者即便看到它，也知道"这是内部用的，别依赖"。

这套写法是 Python 包组织的"标准范式"：公开的子模块通过 `__init__.py` 聚合，内部实现藏进下划线子模块或干脆不 `from .xxx import` 进 `__init__.py`，`__all__` 把对外清单写得明明白白。

**一个补充**：如果某个子模块的某些名字你想原样暴露给使用者（让他能 `from mypkg import something_that_actually_lives_in_submodule`），只要在 `__init__.py` 里 `from .submodule import something` 并且把 `"something"` 放进 `__all__` 即可。包的 `__init__.py` 就是"对外门面"，`__all__` 是门面上挂的"营业目录"。

### 2.8 把内部实现挡在星号导入之外

把前几节合起来，看一个更完整的例子——如何用 `__all__ 把"内部实现"干净地挡在 `from m import *` 之后"。

设想一个图片处理模块，对外只要提供"读图、写图、缩放"三个能力，内部则有大量辅助函数、缓存、第三方库的引用。我们希望写完之后，使用者 `from imgtool import *` 只拿到三个公开名字，其余一概不带。

```python
# imgtool.py
"""图片处理模块。公开 API：load_image, save_image, resize。"""

import io
import struct
from typing import Tuple

__all__ = ["load_image", "save_image", "resize"]

# ---- 内部实现：缓存与常量，不进 __all__ ----
_CACHE = {}

_HEADER_MAGIC = b"IMG1"

def _read_header(data: bytes) -> Tuple[int, int]:
    # 内部：解析图片头
    if data[:4] != _HEADER_MAGIC:
        raise ValueError("bad header")
    width, height = struct.unpack(">II", data[4:12])
    return width, height

def _make_header(width: int, height: int) -> bytes:
    # 内部：构造图片头
    return _HEADER_MAGIC + struct.pack(">II", width, height)

# ---- 公开 API：进 __all__ ----
def load_image(path: str):
    """加载图片，返回 (像素数据, 宽, 高)。"""
    raw = _read_file(path)
    if path in _CACHE:
        return _CACHE[path]
    w, h = _read_header(raw)
    pixels = raw[12:]
    _CACHE[path] = (pixels, w, h)
    return pixels, w, h

def save_image(path: str, pixels, width: int, height: int):
    """保存图片。"""
    blob = _make_header(width, height) + bytes(pixels)
    _write_file(path, blob)

def resize(pixels, width: int, height: int, new_w: int, new_h: int):
    """最近邻缩放（示意）。"""
    stepped = _nearest_sample(pixels, width, height, new_w, new_h)
    return stepped

# ---- 内部 IO：不进 __all__ ----
def _read_file(path: str) -> bytes:
    with open(path, "rb") as f:
        return f.read()

def _write_file(path: str, blob: bytes):
    with open(path, "wb") as f:
        f.write(blob)

def _nearest_sample(pixels, w, h, nw, nh):
    # 内部：最朴素的采样
    return pixels  # 这里仅为示意，不做真正采样
```

```python
# 使用方
from imgtool import *

print(sorted(name for name in dir() if not name.startswith("__")))
# 输出：['load_image', 'resize', 'save_image']
```

可以看到，虽然模块内部定义了 `_CACHE`、`_HEADER_MAGIC`、`_read_header`、`_make_header`、`_read_file`、`_write_file`、`_nearest_sample` 这些实现细节，也 `import` 了 `io`、`struct`、`Tuple`，但 `from imgtool import *` 之后使用者环境里只有三个名字：`load_image`、`save_image`、`resize`。所有内部细节都被 `__all__` 干净地挡在了星号导入之外——既没有靠"给每个名字都加下划线"来实现，也阻止了 `io`、`struct` 被"再导出"。

这就是 `__all__` 在中型、大型模块里最实际的价值：**它让你的公开 API 是一份主动维护的清单，而不是"非下划线名字"的被动合集**。

### 2.9 `__all__` 写法的常见错误

`__all__` 的写法虽然简单，但有几个反复出现的错误模式，初学者很容易踩。这里集中列出来，逐个剖析。

**错误一：把对象本身放进 `__all__`，而不是名字字符串**。

```python
# wrong_obj.py
def greet():
    return "hi"

__all__ = [greet]   # 错：放的是函数对象，不是字符串 "greet"
```

```python
from wrong_obj import *
# 抛出：TypeError: Item in __all__ must be str, not function
```

星号导入会逐个取 `__all__` 里的元素，拿它当作"模块里的名字字符串"去 `getattr`。如果元素是函数对象而不是字符串，`getattr` 这一步就会报 `TypeError`。修正：`__all__ = ["greet"]`。

**错误二：漏写名字（字符串写错或拼错）**。

```python
# wrong_name.py
__all__ = ["create_user", "delete_usr"]   # 拼错了 delete_user

def create_user(name): return name
def delete_user(name): return name
```

```python
from wrong_name import *
# 抛出：AttributeError: module 'wrong_name' has no attribute 'delete_usr'
```

星号导入按 `__all__` 里的每个字符串去模块 `__dict__` 查找；查不到对应名字就抛 `AttributeError`。这种错误往往在模块刚加了一个公开函数、但忘了把它同步进 `__all__`，或者拼错时发生。正因为这个，`__all__` 最好和公开定义放得近一点，便于同步维护；必要时可以用静态分析工具或单元测试去校验"`__all__` 中每个名字在模块里都能 `getattr` 到"。

**错误三：写成元组、集合等非列表形式（能跑但不符合规范）**。

```python
# wrong_form.py
__all__ = ("read", "write")   # 元组：能被识别，但不符合规范
__all__ = {"read", "write"}   # 集合：能被识别，但顺序不确定，更不推荐
```

因为导入机制只是"遍历 `__all__`"，所以元组、集合甚至范围对象都能让它跑起来。但社区惯例和 PEP 8 都使用列表。一方面，列表表达"有序、可追加"的语义，符合公开 API 随版本演进追加的实际情况；另一方面，集合的无序性会让 `__all__` 看起来飘忽不定——每次看模块源码，名字顺序可能都不同，不利于稳定阅读。推荐：**始终用列表**。

**错误四：把 `__all__` 写在函数或类里**。

```python
# wrong_scope.py
def setup():
    __all__ = ["read"]   # 错：这不是模块级 __all__，只是函数里的局部变量

def read(): ...
```

```python
from wrong_scope import *
# 不会按 __all__=["read"] 过滤，因为模块的 __dict__ 里没有 __all__
```

`__all__` 必须存在于**模块的顶层命名空间**，也就是要写进模块的 `__dict__`。写在函数里的 `__all__` 只是那个函数的局部变量，函数执行完就丢了，模块的 `__dict__` 里根本没这个东西。导入机制找不到模块级 `__all__`，就退回到"以下划线为约定"的默认规则。修正：把 `__all__` 直接写在模块顶层，通常放在 `import` 语句之后。

**错误五：以为 `__all__` 能阻止 `from m import some_name`**。

```python
# wrong_expect.py
__all__ = ["public"]   # 期望 _private 被彻底封禁

def public(): return "公开"
def _private(): return "内部"
```

```python
from wrong_expect import _private   # 能拿到！__all__ 不挡显式导入

print(_private())
# 输出：内部
```

如 2.4 节所述，`__all__` 只对星号导入生效，显式 `from m import name` 不受任何限制。把一个名字不放进 `__all__`，挡住的只是"`from m import *`"这一条路；使用者照样可以 `from m import that_name` 显式取走。如果你误以为"不在 `__all__` 里就取不到"，就会在面对这种显式导入时感到意外。记住：`__all__` 不是访问控制，只是星号导入的白名单。

**错误六：在 `__all__` 里列了模块根本没定义、也没 import 进来的名字**。

```python
# wrong_missing.py
__all__ = ["useful_thing"]   # 模块里压根没有这个名字
```

```python
from wrong_missing import *
# 抛出：AttributeError: module 'wrong_missing' has no attribute 'useful_thing'
```

和"拼错名字"是同一类问题：导入机制拿着 `"useful_thing"` 去模块 `__dict__` 里查，查不到就抛 `AttributeError`。这种错误往往发生在"你打算加一个公开函数、先把名字写进 `__all__` 但函数还没实现"的提前声明场景里。如果一定要这么写，就确保在模块加载到使用之前，这个名字已经在模块命名空间里出现（定义出来或导入进来）。

### 2.10 `__all__` 不控制 `from m import` 具体名字——再强调

前面 2.4 已经提过这点，由于它是初学者对 `__all__` 最大的误解之一，这里再单独用一个小节展开一次。

"`__all__` 控制导出列表"——这句话里的"导出"是**专门指"被 `from m import *` 导出"**，不是泛指"模块对外提供"。模块对外提供的名字，归根到底是由"模块的命名空间里有什么"决定的；使用者用 `import m` 或 `from m import name` 总能取走任意一个存在于模块命名空间的名字。`__all__` 只是在"`from m import *` 把哪些名字带过来"这件事上做了一次过滤，它不会删掉模块里的任何名字、不会阻止对任何名字的显式访问。

```python
# api_mod.py
__all__ = ["published"]

def published(): return "对外"

def unpublished(): return "不在 __all__，但照样能被显式导入取走"

def _hidden(): return "下划线开头，也能被显式导入取走"
```

```python
# 三种导入，三种结果
import api_mod
print(api_mod.published())     # 输出：对外
print(api_mod.unpublished())   # 输出：不在 __all__，但照样能被显式导入取走
print(api_mod._hidden())       # 输出：下划线开头，也能被显式导入取走

from api_mod import unpublished, _hidden
print(unpublished())           # 能拿到
print(_hidden())               # 能拿到

from api_mod import *
print(published())             # 只有这一个被 * 带进来
print(unpublished())           # NameError：没被 * 带进当前命名空间
```

这段对比把"显式导入不受限"和"星号导入受 `__all__` 限制"切得很清楚。`__all__` 的全部作用，只体现在最后一组 `from api_mod import *` 上。

## 3. 最佳实践

### 3.1 养成"每个公开模块都写 `__all__`"的习惯

在工程实践中，建议给每一个"对外的模块"都写 `__all__`，哪怕你确定不会有人对它 `from m import *`。原因前面提过：它是一份"模块公开面"的显式声明，既给读者看，也给工具看。没有它，公开面是"非下划线名字"的反向推导，扩充快了就容易混入不应公开的名字；有了它，公开面是一份主动维护的清单，谁加公开 API 谁就同步更新 `__all__`，责权清晰。

**推荐写法**：把 `__all__` 写在模块顶部、`import` 之后、主要定义之前；元素按某种稳定顺序排列（字母序是常见选择，便于查找）。

```python
# 推荐结构
"""模块的简短职责说明。"""

import os
from typing import List

__all__ = [
    "load",
    "save",
    "Config",
    "ConfigError",
]

# ---- 下面才是具体实现 ----
class ConfigError(Exception): ...
class Config: ...
def load(path): ...
def save(path, cfg): ...
```

**不推荐写法**：把 `__all__` 散落在模块各处、每写一个公开函数就 `__all__.append("xxx")` 一行。

```python
# 不推荐：__all__ 分散追加
__all__ = []

def load(path): ...
__all__.append("load")

def save(path, cfg): ...
__all__.append("save")
```

虽然这在功能上完全等价，但它让"公开面"这张清单被拆得七零八落，读者要扫遍整个文件才能知道 `__all__` 最终长什么样。把 `__all__` 集中在顶部，一份清单整整齐齐，远远胜过分散追加。

### 3.2 `__all__` 里只放"自己定义并对外公开"的名字

`__all__` 应当列的是"本模块主动提供、对外承诺"的名字，而不是"本模块顺手 `import` 进来"的名字。如果模块顶部写了 `from typing import List` 只是用来做类型注解，就不应该把 `"List"` 放进 `__all__`——那是 `typing` 的 API，不是你的。

**推荐**：

```python
# mymod.py
from typing import List

__all__ = ["process"]

def process(items: List[str]) -> List[str]:
    return [x.upper() for x in items]
```

`List` 没进 `__all__`，于是 `from mymod import *` 不会把 `List` 带出去——这正是 `__all__` 相对默认规则的优势。

**不推荐**：

```python
# 不推荐：把 import 进来的名字也放进 __all__
from typing import List

__all__ = ["process", "List"]   # List 并不是你的 API
```

这种写法等于"再发布" `typing.List`，既无必要，也容易让使用者误以为 `List` 是你的模块提供的。只在极少数"有意做门面转出"的场景才把 import 进来的名字放进 `__all__`（例如包的 `__init__.py` 把子模块的名字"提上来"对外暴露），普通模块不应这么做。

### 3.3 模块内部名字一律加下划线，公开名字同时进 `__all__`

这是 2.5 节"双层配合"的工程化版本：让"下划线约定"和 "`__all__` 声明"双重保护公开面。

**推荐**：

```python
# service.py
__all__ = ["handle_request", "ServiceError"]

class ServiceError(Exception):
    """对外公开的异常。"""

def handle_request(req):
    """对外公开的入口。"""
    parsed = _parse(req)
    return _dispatch(parsed)

def _parse(req):
    # 内部实现
    ...

def _dispatch(parsed):
    # 内部实现
    ...
```

读者看这段代码时，有两个独立信号可以判断每个名字的角色：下划线与否、是否在 `__all__` 里。两个信号一致时（下划线且不在 `__all__`、无下划线且在 `__all__`），读者就能放心地判断"这是内部"或"这是公开"。这种一致性才是干净的公开面。

**不推荐**：混用——内部函数不加下划线、公开函数不下划线但漏写 `__all__`。两者都会让公开面变模糊，增大后续维护者误判"这是不是对外 API"的概率。

### 3.4 包的 `__init__.py` 用 `__all__` 定义包级公开面

如 2.7 节所示，包的 `__init__.py` 应当通过 `__all__` 明确列出包的对外清单，把"哪些子模块、哪些名字对使用者可见"这件事写清楚。一个包内部可能有十几个子模块、上百个类函数，使用者面对的不应是"全部内部细节"，而是一份精选的"对外门面"。

**推荐**：

```python
# mypkg/__init__.py
from .api import create_user, delete_user
from .models import User
from .errors import UserError

__all__ = [
    "create_user",
    "delete_user",
    "User",
    "UserError",
]
```

**不推荐**：包 `__init__.py` 空 `__all__` 或干脆不写，让使用者在 `from mypkg import *` 时拿到一锅粥——既包含你"提到包命名空间"的名字，也包含 `__init__.py` 自己 `import` 进来的各种第三方库名字。

### 3.5 审慎对待 `from m import *`

即便 `__all__` 让星号导入变得可控，工程上仍然建议**慎用 `from m import *`**。原因不在 `__all__` 本身，而在星号导入这个语法本身的两个固有问题：

1. **污染当前命名空间**。星号导入会把一批名字平铺到当前作用域，容易和当前作用域已有的名字冲突，而且冲突是"静默覆盖"——你不会收到任何提示。
2. **可读性差**。`from m import *` 之后，代码里突然出现的一些函数名，读者无法直接判断它们来自哪个模块；显式 `import m` 或 `from m import specific_name` 则一目了然。

`__all__` 解决的是"万一要星号导入，至少别把垃圾也倒进来"，而不是"鼓励大家多用星号导入"。团队规范里通常允许在交互式解释器里 `from m import *` 图个省事，但生产代码里仍然以显式导入为主。

**推荐**：

```python
# 生产代码：显式导入
import mymod
mymod.process(items)

# 或
from mymod import process
process(items)
```

**不推荐**：

```python
# 生产代码里慎用
from mymod import *
process(items)   # process 从哪来的？读者得翻 mymod 才知道
```

### 3.6 单元测试或静态校验里检查 `__all__` 的一致性

`__all__` 里列了不存在的名字、或公开函数漏写进 `__all__`，都是容易发生的疏忽。可以在测试里加一条很轻的检查：

```python
# test_public_api.py
import importlib
import mymod

def test_all_entries_exist():
    """__all__ 里的每个名字都必须能在模块上 getattr 到。"""
    for name in mymod.__all__:
        assert hasattr(mymod, name), f"{name} in __all__ but not in module"

def test_all_list_is_list_of_str():
    """__all__ 必须是字符串列表。"""
    assert isinstance(mypkg.__all__, list)
    assert all(isinstance(x, str) for x in mymod.__all__)
```

这两条测试非常便宜，但能拦住"拼错名字""漏写定义""`__all__` 用错类型"三类常见错误。成熟项目往往会把这种检查沉淀进 CI。

### 3.7 公开面变化要走"两步更新"

当你新增一个公开函数 `new_feature` 时，正确的更新顺序是：

1. 在模块里定义出 `new_feature`。
2. 把 `"new_feature"` 加进 `__all__`。

两步缺一不可。只做第一步、忘了第二步，`new_feature` 就不能被 `from m import *` 带出去——对使用者来说等于"没公开"。只做第二步、忘了第一步，星号导入就会 `AttributeError` 抛错。把 `__all__` 放在模块顶部、和公开定义近一些，能降低漏写的概率；写单元测试时顺手检查"`__all__` 中的名字都存在"也能兜底。删除一个公开函数时同理：先从 `__all__` 里移掉，再删定义，避免中间状态出现"星号导入会抛 AttributeError"。

## 4. 原理

### 4.1 `from m import *` 的执行过程

要讲清 `__all__` 在原理层面的作用，必须看清 `from m import *` 这条语句在 CPython 里到底是怎么执行的。抛开边角细节，它的核心流程可以概括为：

1. **找到并执行模块**。无论哪种导入语句，第一步都是"在 `sys.modules` 里查、找不到就定位模块文件、执行模块代码、把模块对象注册进 `sys.modules`"。这一步与 `__all__` 无关，所有导入形式都一样。
2. **拿到模块对象的命名空间**。模块对象有一个 `__dict__`，存着模块加载过程中绑定的所有名字（函数、类、变量、`import` 进来的名字，以及可能存在的 `__all__` 本身）。
3. **判断模块有没有 `__all__`**。导入机制去模块的 `__dict__` 里找 `__all__` 这个键。
4. **走"有 `__all__`"或"没有 `__all__`"的两条分支之一**，决定要从模块命名空间里复制哪些名字到当前命名空间。
5. **把选中的名字逐个复制**到当前命名空间（实际上是往当前作用域的 `globals()` 里写入键值对）。

`__all__` 的全部影响，集中在第 3、第 4 步。

### 4.2 有 `__all__` 时的分支：只导入名单中的名字

当模块的 `__dict__` 里存在 `__all__`，导入机制就完全按名单来：

- 遍历 `__all__` 里的每个元素。
- 每个元素必须是一个字符串。如果不是字符串，抛 `TypeError: Item in __all__ must be str, not <类型>`。
- 把这个字符串当作"模块里的名字"`name`，执行等价于 `value = module.__dict__[name]` 的查找——实际上是 `getattr(module, name)`，拿不到就抛 `AttributeError: module '<模块名>' has no attribute '<name>'`。
- 把 `name -> value` 写入当前作用域（通常是调用方的 `globals()`）。

这条分支有两个关键点要注意：

第一，**它只看名单，名单就是唯一的依据**。名单上列什么、就导入什么；没上的、但客观存在于模块命名空间的，一律不导入。这同时意味着：即便某个名字以下划线开头，只要它在 `__all__` 里（虽然这种写法不合常规），也会被导入——`__all__` 的优先级高于"下划线过滤"（在"有 `__all__`"分支里，下划线过滤根本不参与）。

第二，**它不区分"本模块定义的名字"和"本模块 import 进来的名字"**。对导入机制来说，模块 `__dict__` 里的所有键值对都是一视同仁的"名字 -> 对象"映射；一个名字是你在模块里 `def` 出来的还是 `from x import` 进来的，对它没有任何区别。所以如果名单里写了 `"os"`，而模块里恰好 `import os`，星号导入也会把 `os` 带给使用者。这正是一再强调"`__all__` 里只放自己对外提供的名字"的原因——导入机制不会替你筛掉"顺手 import 进来的"。

用一个贴近底层的等价伪代码来描述这条分支：

```python
# 等价伪代码：from m import * 在有 __all__ 时的行为
module = sys.modules["m"]            # 已经加载好的模块对象
g = globals()                       # 当前命名空间

if "__all__" in module.__dict__:
    for name in module.__dict__["__all__"]:
        if not isinstance(name, str):
            raise TypeError(f"Item in __all__ must be str, not {type(name).__name__}")
        if not hasattr(module, name):
            raise AttributeError(f"module 'm' has no attribute '{name}'")
        g[name] = getattr(module, name)
```

这段伪代码把"`__all__` 说了算"的机制落到实处：遍历名单、按名字取对象、写入当前作用域，仅此而已。

### 4.3 没有 `__all__` 时的分支：导入所有非下划线名字

当模块的 `__dict__` 里没有 `__all__` 时，导入机制走另一条分支：遍历模块的 `__dict__`，对所有**不以单下划线 `_` 开头**、并且**不属于"以单下划线开头的模块 `import` 名字"**的已绑定名字，逐个复制到当前命名空间。

具体来说，这条分支的规则可以拆成两部分：

- **过滤掉以下划线开头的名字**。无论这个名字是模块自己定义的（`_helper`）、还是 `import` 进来的（`from x import _thing as _t`），只要它以下划线开头，就不会被星号导入带出。
- **过滤掉"虽然没下划线、但来自一个以下划线开头的模块"的名字**。这是一个容易忽略的细节：如果你在模块里写了 `import _internal`，那么 `_internal` 会被过滤（因为它以下划线开头）；但如果你写的是 `from _internal import thing`，那 `thing` 本身不以单下划线开头，原则上会被星号导入带出来。对这条边角规则的不同实现细节，CPython 在 `import *` 时会把"来自以单下划线开头的模块"的那些导入名字也一并过滤掉。

等价伪代码：

```python
# 等价伪代码：from m import * 在没有 __all__ 时的行为
module = sys.modules["m"]
g = globals()

if "__all__" not in module.__dict__:
    for name, value in module.__dict__.items():
        if name.startswith("_"):
            continue                                   # 过滤掉 _ 开头
        if name in getattr(module, "__name__", ""):
            pass
        # 过滤掉"来自以单下划线开头的模块"的名字（CPython 的实现细节）
        # 具体通过 module.__dict__ 里记录的"导入来源"信息判断
        g[name] = value
```

这里要强调一个常被问到的问题：**"模块自己 `import` 进来、以下划线开头的名字"会不会被星号导出？** 答案是"不会"——因为它以下划线开头，第一条过滤就把它排掉了。**"模块自己 `import` 进来、没下划线的名字"会不会被星号导出？** 答案是"会"——默认规则没有"排除自己 import 的名字"这条，它只看下划线。这就是为什么"没有 `__all__`"时模块公开面会混入 `os`、`defaultdict` 之类名字的根因。

再来看"`__all__` 在两条分支之间的切换"：`module.__dict__` 里有没有 `__all__` 这个键，决定了走哪一条。一旦你定义了 `__all__`，"没有 `__all__`"那条"遍历所有非下划线名字"的规则就**完全不应用**了——连"下划线过滤"都一并失效，因为这条分支根本没被选中。这也是 2.3 节那个"下划线开头的名字在 `__all__` 里也会被导出"的例子背后的原理——不是"下划线过滤被下划线名字穿透"，而是"`__all__` 分支根本不读下划线过滤那套规则"。

### 4.4 `__all__` 只作用于 `from m import *` 一个场景

从 4.1 的流程可以看出，`__all__` 的读取发生在"`from m import *` 决定带哪些名字"这一步。其他导入形式压根不进入这个流程分支：

- **`import m`**：导入机制做的事情是"确保 `m` 已加载、把 `m` 这个名字绑定到当前作用域"。它不关心 `m` 里有哪些名字，更不会去读 `m.__all__`。使用者要拿 `m` 里的任何东西，都通过 `m.xxx` 这个属性访问来取，而属性访问与 `__all__` 毫无关系——属性访问只是 `m.__dict__[xxx]` 或其 `__getattr__` 的查找。
- **`from m import name1, name2`**：导入机制做的事情是"确保 `m` 已加载、按 `name1`、`name2` 这两个字符串去 `m.__dict__` 里取对象、把它们绑定到当前作用域"。它同样是按名字直取，不经过 `__all__` 这道过滤。名单有没有 `name1`、`name1` 是不是下划线开头，都不影响显式导入——只要 `m` 里确实有这个名字，就能取走。

所以"`__all__` 控制导出"这句话里的"导出"，严格来说只能是"`from m import *` 意义上的导出"。在其他导入语义下，`__all__` 不参与。这也解释了为什么 `__all__` 不能当"访问控制"用——它根本不在 `import m` 或 `from m import name` 的代码路径上。

### 4.5 `__all__` 作为普通属性被特殊识别

一个有趣的视角是：`__all__` 在 Python 的对象模型里没有任何"魔法"地位。它不是关键字、不是特殊方法、不是描述符、不是协议——它就是一个普通的列表对象，作为模块 `__dict__` 里的一个键值对存在，键是字符串 `"__all__"`，值是一个字符串序列。

它"有意义"，完全是因为 `from m import *` 的实现代码里特意去读了这个名字。换句话说：是导入机制给了 `__all__` 意义，而不是 `__all__` 本身有什么魔力。你可以自己验证这一点：

```python
# probe.py
__all__ = ["inspect_this"]

def inspect_this():
    return "I'm exported"
```

```python
import probe

# __all__ 就是一个普通属性
print(type(probe.__all__))      # 输出：<class 'list'>
print(probe.__all__)            # 输出：['inspect_this']

# 你甚至可以运行时改它
probe.__all__.append("another")
print(probe.__all__)            # 输出：['inspect_this', 'another']

# 但要另一段代码现在执行 from probe import * 才会用到改后的名单
```

`__all__` 之所以能被导入机制识别，是因为 CPython 在实现 `IMPORT_STAR` 这条字节码时，写了"去模块 `__dict__` 里找 `__all__`、找到就按它来"的逻辑。它和 `__init__`、`__call__` 这类"由语言协议保证会被特殊调用"的属性不同——`__all__` 没有任何"被自动调用"的机制，它只是被"特定语句的特定代码路径主动读一次"。

这个视角也解释了"`__all__` 必须在模块顶层"的要求：导入机制只会去模块的 `__dict__`（模块全局命名空间）里找它。如果 `__all__` 藏在某个函数里、某个类里，那它只是那个函数或类的局部变量，没进模块的 `__dict__`，导入机制自然找不到——走"没有 `__all__`"的默认分支。

### 4.6 `__all__` 与星号导入语义的耦合

把前面几节合起来，可以看清 `__all__` 与星号导入之间是一种"强耦合"关系：

- `__all__` 的语义**只在这一种语句**中有定义。离开了 `from m import *`，`__all__` 只是一个"约定上表示公开 API"的普通变量，没有任何语言语义。
- `from m import *` 的语义**也只在受 `__all__` 影响时才"可控"**。没有 `__all__` 时，星号导入是粗放的"倒所有非下划线名字"；有了 `__all__`，它才变成"按名单倒"的精细行为。

这两件事彼此依赖、互为语境。因此，理解 `__all__` 的正确姿势是把它视作"为星号导入这个语法量身定做的开关"，而不是一个通用的"模块元信息"——尽管实践中我们经常把它当"公开面清单"给工具看，但那是对它的二次利用，不是它原生的语言语义。

这层耦合也带来一些工程上的连带后果：

1. **即便不用星号导入，也写 `__all__`** 是一种"借它的约定含义，给工具和读者提供公开面信号"的做法。这个做法之所以有效，是因为大量工具（Sphinx、pdoc、IDE）都沿用了"`__all__` 表示公开面"这个约定；但本质上，这是约定层面的二次利用，不是语言层面的强语义。
2. **`__all__` 的任何写错都只在星号导入时才暴露**。如果项目里从来不写 `from m import *`，那么 `__all__` 里列了不存在的名字、写错类型、写错作用域，都不会被运行时触发——这些错误会"潜伏"到某天有人真的去 `from m import *`、或者某个工具去读 `__all__` 时才暴露。这也是 3.6 节建议写单元测试检查 `__all__` 一致性的原因。
3. **想拿 `__all__` 做"访问控制"是行不通的**。因为显式 `from m import name` 完全不读 `__all__`，使用者总能点名取走任何名字。`__all__` 给的是"白名单指引"，不是"权限墙"。

### 4.7 一个把两条分支都走一遍的对照实验

用一段贴近字节码语义的代码，把"有 `__all__`"和"没有 `__all__`"两条分支在同一段逻辑里都复现一次，帮助直观对照。这段代码不真的去执行 `from m import *`，而是用 `getattr` / `__dict__` 手工模拟星号导入的内部逻辑。

```python
# 模块：sim_mod.py
import os
from collections import defaultdict

__all__ = ["public_func", "PUBLIC_VALUE"]

def public_func(): return "公开"
def _private_func(): return "内部"
def public_helper(): return "非下划线但不在 __all__"

PUBLIC_VALUE = 42
_PRIVATE = -1
```

```python
# 模拟星号导入：把"要带进当前命名空间的名字"收集到 imported 这个字典里
import sim_mod

def simulate_star_import(module):
    """重现 from module import * 的内部逻辑，返回"会被导入的名字 -> 对象"。"""
    namespace = module.__dict__
    imported = {}

    if "__all__" in namespace:
        # 有 __all__：只按名单
        for name in namespace["__all__"]:
            if not isinstance(name, str):
                raise TypeError(f"Item in __all__ must be str, not {type(name).__name__}")
            if not hasattr(module, name):
                raise AttributeError(f"module has no attribute '{name}'")
            imported[name] = getattr(module, name)
    else:
        # 没有 __all__：所有非下划线名字
        for name, value in namespace.items():
            if name.startswith("_"):
                continue
            imported[name] = value

    return imported

# 跑一次"有 __all__"的模拟
result_with_all = simulate_star_import(sim_mod)
print(sorted(result_with_all.keys()))
# 输出：['PUBLIC_VALUE', 'public_func']
```

可以看到，模拟器拿到的名字集合，和真正执行 `from sim_mod import *` 的结果一致——只有 `__all__` 里点名的两个名字。现在，如果把 `__all__` 这行注释掉，模拟器会走"没有 `__all__`"分支：

```python
# 把 __all__ 拿掉再模拟
sim_mod.__dict__.pop("__all__", None)

result_without_all = simulate_star_import(sim_mod)
print(sorted(result_without_all.keys()))
# 输出：['defaultdict', 'os', 'public_func', 'public_helper', 'PUBLIC_VALUE']
```

这次拿到的名字多得多——包括 `os`、`defaultdict`（模块自己 import 进来的）、`public_helper`（非下划线但不在 `__all__`），但排除了所有 `_` 开头的名字，如 `_private_func`、`_PRIVATE`。

这段对照实验把两条分支的差异摆得很直白：同一个模块、同一份命名空间，有没有 `__all__`，星号导入带出去的名字集合完全不同。`__all__` 把"公开面"从"非下划线名字的被动合集"变成了"名单的主动勾选"，原理就落在这个分支切换上。

### 4.8 `__all__` 与模块加载时机的互动

再补一个关于时机的细节。`from m import *` 是在"调用方执行到这条语句时"才去读 `__all__` 的，不是在"模块第一次被加载时"就把 `__all__` 固定下来。也就是说，如果在模块加载完毕后、调用方执行星号导入前，模块的 `__all__` 被修改了（比如别的代码 `mymod.__all__.append("xxx")`），那么调用方看到的 `__all__` 就是修改后的版本。

```python
# timing_mod.py
__all__ = ["early"]

def early(): return "一开始就在 __all__"
def late(): return "后来才被加进 __all__"
```

```python
import timing_mod

# 在星号导入前，外部修改模块的 __all__
timing_mod.__all__.append("late")

# 然后再执行星号导入
from timing_mod import *

print(sorted(name for name in dir() if not name.startswith("__")))
# 输出：['early', 'late']
```

`late` 被带进来了——因为星号导入读的是"被修改后的 `__all__`"。这个边角场景再次印证了 4.5 的观点：`__all__` 没什么魔法，它就是模块 `__dict__` 里的一个普通可变列表，星号导入只是在执行那一刻读它的快照。生产代码当然不会依赖这种运行时修改 `__all__` 的做法，但理解这一点能帮你看清 `__all__` 的本质：它不是模块的"元属性"，而是一个"被特定语句在执行时读取的普通属性"。

## 5. 总结

- `__all__` 是定义在模块顶层的字符串列表，作用是显式声明"本模块的公开 API 是哪些名字"。
- 它**只在 `from m import *` 这一种语句**中生效：有 `__all__` 时，星号导入只导入名单上的名字；没有 `__all__` 时，退回到"导入所有不以单下划线开头的已绑定名字"的默认规则。
- `__all__` 不影响 `import m`、也不影响 `from m import name`——这两种显式导入按名字直取，完全不读 `__all__`，也挡不住使用者显式取走任何名字。
- `__all__` 与"下划线表示隐私"是互补的两层信号：内部名字加下划线，公开名字放进 `__all__`；两层一致时公开面最清晰。
- `__all__` 的第二重价值是"作为公开面的显式声明供工具和文档识别"，即便项目不使用星号导入，写 `__all__` 仍有意义。
- 包的 `__init__.py` 用 `__all__` 定义包级公开面，是 Python 包组织的标准范式：公开子模块的名字通过 `__init__.py` 提上来，内部实现藏进下划线子模块。
- 常见错误：把对象本身（非字符串）放进 `__all__`、拼错或漏写名字、写成元组/集合而非列表、把 `__all__` 写进函数/类里、误以为 `__all__` 能阻止显式导入。
- 原理上，星号导入在 CPython 的 `IMPORT_STAR` 字节码里实现：它去模块 `__dict__` 找 `__all__`，有则只导入名单中的名字、无则遍历所有非下划线名字；`__all__` 只在这一条代码路径上被读取，因此只对 `from m import *` 生效。

读完本文你应能掌握：

- 能说明 `__all__` 的定义形式、位置要求、以及它**只对 `from m import *` 生效**这一行为边界。
- 能写出"有 `__all__`"与"没有 `__all__`"两种情况下 `from m import *` 的不同导入结果，并解释为什么会这样。
- 能讲清 `__all__` 不影响显式 `from m import name` 和 `import m` 的原因，并据此判断"`__all__` 不是访问控制"这一结论。
- 能用 `__all__` 为模块和包 `__init__.py` 定义干净、可维护的公开 API，配合下划线约定让公开面双层清晰。
- 能识别 `__all__` 的常见写法错误，并能用单元测试或静态检查兜住这些错误。
- 能从字节码 / `__dict__` 层面解释星号导入如何读取 `__all__`、两条分支如何切换，以及"`__all__` 是被星号导入特殊识别的普通属性"这一本质。