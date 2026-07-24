---
group:
  title: 【15】模块与包管理
  order: 15
order: 1
title: import 与 from...import —— 模块导入的两种方式
nav:
  title: Python
  order: 1
---

## 1. 介绍

### 1.1 什么是 import 与 from...import

写过 Python 的人，几乎第一行代码就会碰到 `import`。当你写下 `import math` 然后用 `math.sqrt(9)` 算出一个平方根时，背后的动作是：Python 解释器找到 `math` 这个模块文件、把它加载到一个模块对象里、在当前命名空间里用一个叫 `math` 的名字指向这个对象。从此你就可以通过 `math.名字` 的形式访问模块里的任何公开内容。这是最朴素的导入方式——引入一整块模块，再通过"模块名点东西"去取里面的东西。

但有时候你只想要模块里的某一个函数或类，写 `math.sqrt` 又显得啰嗦。于是 Python 提供了第二种语法 `from module import name`：它的意思是"从 module 这个模块里把 name 这个名字拎出来，直接绑到我当前的命名空间里"。这样你写 `sqrt(9)` 就能直接调用，前面不用再加模块名前缀。两种方式本质都是在"借用别人写好的代码"，区别只在于借过来之后这个"名字"以什么形式出现在你的代码里。

理解这两种导入方式的关键，在于搞清楚它们各自在命名空间里创建了什么绑定。`import module` 创建的是"模块名 → 模块对象"的绑定，访问成员必须走 `module.name`；`from module import name` 创建的是"原名字 → 原对象"的绑定，名字直接落在当前命名空间，用起来短但有可能和你自己定义的同名东西冲突。这个区别看起来小，却是后续理解命名污染、遮蔽、循环导入等一系列问题的根。本篇就把这两种方式掰开揉碎讲清楚，为整个"模块与包管理"系列打地基。

### 1.2 基本语法与最小示例

**import 语句的基本形式**

```python
import 模块名
```

执行后，当前命名空间里会多出一个与模块同名的变量，指向被加载的模块对象。访问模块内部的成员时，必须用 `模块名.成员名` 的形式。

```python
import math

# 通过 "math.名字" 访问模块里的内容
print(math.sqrt(9))      # 输出：3.0
print(math.pi)           # 输出：3.141592653589793
print(math.ceil(2.1))    # 输出：3
```

**from...import 语句的基本形式**

```python
from 模块名 import 名字
```

执行后，`名字` 会直接出现在当前命名空间里，指向模块内部那个同名的对象。使用时不再需要加模块名前缀。

```python
from math import sqrt, pi, ceil

# 直接用名字，不用 math. 前缀
print(sqrt(9))     # 输出：3.0
print(pi)          # 输出：3.141592653589793
print(ceil(2.1))   # 输出：3
```

单看结果，两种写法都能算出 `3.0`，似乎只是"写不写前缀"的差别。但它们在命名空间里留下的东西完全不同——用 `globals()` 看一眼就清楚：

```python
import math
print("math" in globals())        # 输出：True，当前命名空间里有了 math 名字
print("sqrt" in globals())        # 输出：False，sqrt 不在这里，藏在 math 里
print(type(math))                 # 输出：<class 'module'>
```

```python
from math import sqrt
print("math" in globals())        # 输出：False，math 这个模块名并不在当前命名空间
print("sqrt" in globals())        # 输出：True，sqrt 直接绑过来了
print(type(sqrt))                 # 输出：<class 'builtin_function_or_method'>
```

这个差别就是本篇要讲的核心。后面所有的取舍、踩坑、原理，都围绕它展开。

## 2. 核心内容

### 2.1 import module —— 引入整个模块对象

`import module` 是最"老实"的导入方式：把整个模块作为一个对象搬进来，你通过模块名当"门牌号"去访问里面的每一个成员。它的好处是来源清晰——谁看到 `math.sqrt` 都知道 `sqrt` 来自 `math` 模块；缺点是每个调用都要带模块名前缀，如果模块名本身又长又多层（比如 `package.subpackage.module.func()`），写起来会比较繁琐。

**基本用法**

```python
import random

# 所有访问都走 random.名字
roll = random.randint(1, 6)         # 掷骰子，返回 1~6 的整数
pick = random.choice(["红", "黄", "蓝"])  # 从列表里随机挑一个
shuffle_list = [1, 2, 3, 4, 5]
random.shuffle(shuffle_list)        # 原地打乱列表
print(roll, pick, shuffle_list)
# 输出示例：3 蓝 [3, 1, 5, 2, 4]
```

**一次导入多个模块**

`import` 语句可以在一行里导入多个模块，用逗号分隔。不过实践中更推荐一行只写一个模块，方便版本管理工具（如 isort）自动排序，也方便阅读。

```python
import os, sys, json   # 语法上允许
```

```python
# 更推荐的写法：一行一个
import os
import sys
import json

print(os.getcwd())                      # 输出：当前工作目录
print(sys.version.split()[0])           # 输出：Python 版本号，如 3.12.0
print(json.dumps({"a": 1}))             # 输出：{"a": 1}
```

**访问成员必须带模块名前缀**

这是 `import module` 最容易让新手困惑的一点：导入的是模块对象，不是模块里的成员。不加前缀直接用成员名会报 `NameError`。

```python
import math

print(math.sqrt(4))   # 输出：2.0，正确
# print(sqrt(4))      # NameError: name 'sqrt' is not defined
```

报错的原因很直接：当前命名空间里只有 `math` 这个名字，并没有 `sqrt` 这个名字。`sqrt` 是模块对象 `math` 的一个属性，得通过 `math.sqrt` 去找。这一点在原理章会从字节码层面再讲一遍。

### 2.2 from module import name —— 导入特定名字

`from module import name` 解决的是"前缀太烦"的问题。它把模块内部你关心的名字"拎"出来，直接绑定到当前命名空间，之后这个名字就像你自己在当前文件里定义过的一样，拿来即用。

**从 collections 导入常用容器**

```python
from collections import defaultdict, Counter, OrderedDict

# 用 defaultdict 统计单词出现次数
word_count = defaultdict(int)
for word in "the cat sat on the mat the cat".split():
    word_count[word] += 1
print(dict(word_count))
# 输出：{'the': 3, 'cat': 2, 'sat': 1, 'on': 1, 'mat': 1}

# 用 Counter 直接做同样的事，更简洁
c = Counter("the cat sat on the mat the cat".split())
print(c.most_common(2))
# 输出：[('the', 3), ('cat', 2)]

# 用 OrderedDict 记录插入顺序（Python 3.7+ 普通 dict 已保序，这里仅演示导入）
od = OrderedDict()
od["a"] = 1
od["b"] = 2
print(list(od.keys()))
# 输出：['a', 'b']
```

注意这三个名字 `defaultdict`、`Counter`、`OrderedDict` 现在直接可用，不需要写 `collections.defaultdict`。但是 `collections` 这个模块名本身并没有进入当前命名空间：

```python
from collections import Counter
# print(collections.Counter())   # NameError: name 'collections' is not defined
print(Counter("aabbc"))           # 输出：Counter({'a': 2, 'b': 2, 'c': 1})
```

**一次导入多个名字**

和 `import` 一样，`from module import` 后面可以跟多个名字，用逗号分隔：

```python
from math import sqrt, ceil, floor, fabs

print(sqrt(2))      # 输出：1.4142135623730951
print(ceil(2.3))    # 输出：3
print(floor(2.9))   # 输出：2
print(fabs(-5))     # 输出：5.0
```

**from import 的"隐式默认值"陷阱**

有一个细节值得记住：`from module import name` 执行时，如果 `module` 这个模块在当前命名空间里已经有了（比如之前 `import` 过），Python 会复用已经加载好的模块对象，从中取 `name` 这个属性。如果模块里压根没有这个名字，会报 `ImportError`（Python 3.6+ 是 `ImportError` 的子类 `ModuleNotFoundError` 仅针对模块找不到，名字找不到是 `ImportError`）。

```python
from math import not_exist
# ImportError: cannot import name 'not_exist' from 'math' (...)
```

### 2.3 import module as alias —— 模块别名

有时候模块名本身很长，或者你想用一个自己习惯的简写来引用它。`import module as alias` 就是给模块对象在当前命名空间里起一个别名——绑定的还是同一个模块对象，只是访问它的名字换了。

**最常见的例子：数据分析三件套**

```python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# 用别名访问，写起来短得多
arr = np.array([1, 2, 3, 4])
print(arr.mean())            # 输出：2.5
print(np.arange(1, 5))       # 输出：[1 2 3 4]

df = pd.DataFrame({"name": ["Alice", "Bob"], "age": [30, 25]})
print(df.shape)              # 输出：(2, 2)
print(df.columns.tolist())  # 输出：['name', 'age']
```

这三个别名 `np`、`pd`、`plt` 已经是社区约定俗成的标准写法，几乎所有教程和项目都这么用。读者看到 `np.array` 就知道是 numpy，看到 `pd.DataFrame` 就知道是 pandas，可读性反而比写全名更高。这说明别名不只是图省事，用对场景能提升代码的"行业可读性"。

**模块名冲突时用别名规避**

当你自己的模块名不幸和一个标准库重名（比如你自己写了个 `utils.py`，同时又想用某个第三方库也叫 `utils`），别名能让你在同一文件里同时用两者：

```python
import utils as my_utils            # 自己写的本地模块
# 假设还有个第三方库也叫 utils（这里仅演示写法）
# import utils as ext_utils         # 第三方库

print(type(my_utils))               # 输出：<class 'module'>
```

**别名只影响当前命名空间**

`as` 只是改变绑定到当前命名空间的那个名字，模块本身的名字并不会被修改。也就是说，如果你在 A 文件里 `import math as m`，在 B 文件里 `math` 这个名字照常可用，两者互不干扰——因为它们是各自的命名空间。

```python
import math as m

print(m.sqrt(9))          # 输出：3.0
# print(math.sqrt(9))     # NameError: name 'math' is not defined
# 因为当前命名空间里绑定的是 m，不是 math
print(m is __import__("math"))   # 输出：True，m 指向的还是同一个 math 模块对象
```

### 2.4 from module import name as alias —— 名字别名

同样地，`from module import name as alias` 给导入的名字起个别名。它在两种场景下特别有用：一是名字太长或不够直观，想换个更顺手的叫法；二是避免和当前文件里已有的同名变量冲突。

**场景一：名字太长，起个短的**

```python
from itertools import combinations as comb

# 把 [1,2,3] 中取 2 个的所有组合列出来
for pair in comb([1, 2, 3], 2):
    print(pair)
# 输出：
# (1, 2)
# (1, 3)
# (2, 3)
```

**场景二：避免同名遮蔽**

这是个真实的坑。假设你正在写一个绘图脚本，自己定义了一个函数叫 `open`（打开图片文件用），同时又想用 Python 内置的 `open`：

```python
# 自己定义了一个 open，用来专门打开图片
def open(path):
    print(f"打开图片: {path}")

# 现在内置的 open 被遮蔽了，直接用 open() 调的是自己这个
open("photo.jpg")   # 输出：打开图片: photo.jpg

# 如果还想用内置 open，可以从 builtins 导入并起别名
from builtins import open as _open
content = _open("/tmp/data.txt", "r", encoding="utf-8").read()
print(f"通过 _open 读到 {len(content)} 个字符")
```

这个例子虽然有点刻意，但它揭示了 `from import as` 的一个核心价值：当两个不同来源刚好提供了同名的东西时，别名是唯一能同时保留两者的办法。

### 2.5 from module import * —— 导入全部公开名字

`from module import *` 是一种"一把梭"的导入方式：它把模块里所有"公开"名字一股脑儿地灌进当前命名空间。写起来确实省事——什么 `sqrt`、`pi`、`ceil` 全都直接可用，一个前缀都不用加。

```python
from math import *

print(sqrt(16))    # 输出：4.0
print(pi)          # 输出：3.141592653589793
print(factorial(5))  # 输出：120
print(log(e))      # 输出：1.0
```

看起来很爽，但这种写法在实际工程中被强烈不推荐，原因有三条：

**原因一：命名空间被严重污染**

你不知道 `import *` 到底往你的命名空间里灌了多少个名字，更不知道有没有哪个名字恰巧和你自己定义的变量撞车。一旦撞车，后者会无声无息地覆盖前者，代码不报错但行为全错，排查起来非常痛苦。

```python
from math import *

# 你自己想定义一个叫 log 的函数，记录日志
def log(message):
    print(f"[LOG] {message}")

log("系统启动")   # 输出：[LOG] 系统启动
# 但此刻 math.log 还在命名空间里吗？已经被覆盖了（后定义的赢）
# 如果 import * 在 def 之后写，则 math.log 会覆盖你的 log
```

**原因二：来源不可追溯**

代码里突然冒出一个 `sqrt(9)`，读者根本不知道它来自 `math` 还是 `numpy` 还是你自己写的一个 `utils` 模块。可读性大打折扣。相比之下，`math.sqrt(9)` 一眼就知道来源，`from math import sqrt` 也至少在文件顶部声明了来源。`import *` 把来源信息全抹掉了。

**原因三：IDE 和静态检查工具抓瞎**

IDE 的自动补全、类型检查器、linter 都依赖明确的导入信息来做静态分析。`import *` 会让它们无法确定某个名字的真正来源，于是补全失效、跳转失效、未使用变量检测失效。一个稍微大点的项目里，这些工具的辅助价值远大于少写几行 `from math import sqrt` 的便利。

**模块可以通过 `__all__` 控制 `*` 的范围**

模块作者可以在模块顶部定义一个 `__all__` 列表，明确声明"`import *` 时只导出这些名字"。这是一条"白名单"机制。关于 `__all__` 的详细用法本系列有专门一篇笔记讲，这里只展示效果：

```python
# 假设有一个模块 mymod.py 内容如下：
#
# __all__ = ["greet", "bye"]
#
# def greet(): return "hi"
# def bye(): return "bye"
# def _internal(): return "secret"
# def shout(): return "HEY"
```

```python
from mymod import *

print(greet())      # 输出：hi
print(bye())        # 输出：bye
# print(shout())    # NameError: shout 没在 __all__ 里，import * 不会导入它
# print(_internal())  # 同样不会，而且下划线开头的本来也不算公开名字
```

如果模块没定义 `__all__`，`import *` 默认会导入所有不以 `_` 开头的名字。这也就是为什么很多模块约定"下划线开头的是私有的"——至少 `import *` 不会把私有的也灌进来。

**一句话总结**：交互式调试时随手 `import *` 无伤大雅，但在任何要长期维护的项目代码里，请老老实实写 `from module import name` 或 `import module`。

### 2.6 导入即执行：模块顶层代码只执行一次

这是一个极其重要但新手常误解的事实：**当你 import 一个模块时，该模块文件顶层的所有可执行代码会被从头到尾运行一遍。** 这意味着模块里写在顶层的 `print`、赋值、函数定义、类定义、循环、条件分支，在导入的瞬间都会执行。

**直观演示**

假设有一个模块 `greet.py`，内容如下：

```python
# greet.py
print(">>> greet 模块正在被加载，顶层代码执行了")

def hello(name):
    return f"你好，{name}"

def goodbye(name):
    return f"再见，{name}"

print(">>> greet 模块加载完成")
```

现在在另一个文件里导入它：

```python
# main.py
import greet   # 输出：>>> greet 模块正在被加载，顶层代码执行了
               #       >>> greet 模块加载完成

print(greet.hello("小明"))   # 输出：你好，小明
```

注意那两行 `print` 是在 `import greet` 那一刻执行的，不是在调用 `hello` 时执行。这就是为什么模块的顶层一般只放函数/类的定义，而把"真正干活的代码"放进函数里或塞到 `if __name__ == "__main__":` 块里——否则只要被导入就会产生副作用。

**重复导入不会重新执行**

更关键的特性来了：如果你在同一个程序运行期间多次导入同一个模块，模块的顶层代码只会在第一次执行，之后所有的 import 都是"从缓存里取现成的模块对象"。

```python
import greet   # 第一次导入，输出两行 print
import greet   # 第二次导入，没有任何输出
import greet   # 第三次，依然静默

print("再次导入后仍可用:", greet.hello("小红"))   # 输出：再次导入后仍可用: 你好，小红
```

第二次和第三次 `import greet` 什么也没打印，说明 `greet.py` 的顶层代码没有重新跑。Python 是通过一个叫 `sys.modules` 的字典来实现这一点的——每个已加载的模块都会被记录在里面，下次再 import 时直接返回缓存里的对象，跳过"查找文件→执行代码"的步骤。这个机制的细节放在原理章讲。

**用 sys.modules 观察缓存**

```python
import sys
import math

# math 已经在 sys.modules 里了
print("math" in sys.modules)          # 输出：True
print(sys.modules["math"] is math)    # 输出：True，就是同一个对象
print(len(sys.modules))               # 输出：一个很大的数字，表明已加载了很多模块
```

**一个验证"只执行一次"的实验**

```python
# counter.py
# print("加载 counter 模块")
```

```python
import sys
import counter              # 第一次：打印 "加载 counter 模块"
import counter              # 第二次：无输出

# 手动从缓存里删掉它，再 import，看会不会重新执行
del sys.modules["counter"]
import counter              # 又打印了 "加载 counter 模块"！
```

这个实验清楚说明：模块是否重新执行，完全取决于它还不在 `sys.modules` 缓存里。删掉缓存后重新 import，模块会被重新加载、顶层代码重新跑一遍。这也是某些热重载（hot reload）方案的实现思路，不过日常开发极少这么做。

### 2.7 导入即绑定：两种方式绑定的是什么

回到本篇最核心的概念：import 的本质是"绑定名字"。两种导入方式创建的绑定是不同的，这一节集中讲清楚。

**import module 创建的是"模块名 → 模块对象"的绑定**

```python
import math
# 等价于在当前命名空间里做了：
# math = <module object>
```

此后 `math` 是一个名指代模块对象的变量。模块里的 `sqrt`、`pi` 等都是这个模块对象的属性，得用 `math.sqrt` 访问。如果你把 `math` 这个变量删了或重新赋值，并不影响模块对象本身，只是你当前命名空间里失去了指向它的名字。

```python
import math
m = math          # m 和 math 指向同一个模块对象
math = "被覆盖了"  # 现在 math 指向字符串，但模块对象还在，m 还指着它
print(m.sqrt(4))  # 输出：2.0，通过 m 还能访问模块
print(math)        # 输出：被覆盖了
```

**from module import name 创建的是"名字 → 原对象"的绑定**

```python
from math import sqrt
# 等价于在当前命名空间里做了：
# sqrt = math.sqrt    （取模块的 sqrt 属性，赋给当前命名空间的 sqrt 名字）
```

注意这里绑定的是 `sqrt` 这个函数对象本身，和 `math` 模块没有任何"持续的联系"。换句话说，导入之后即便 `math` 模块对象被从 `sys.modules` 删掉，你当前命名空间的 `sqrt` 依然可用——因为它持有的是函数对象的引用，不是模块的引用。

```python
from math import sqrt
import sys

print(sqrt(4))              # 输出：2.0
del sys.modules["math"]     # 从缓存删掉 math 模块
print(sqrt(4))              # 输出：2.0，依然可用！sqrt 已经绑定到函数对象，不受影响
```

这个细节解释了一个现象：你没法通过 `from module import name` 之后再去"更新"模块——因为绑定的是导入那一瞬间的对象，模块后续被重新加载并不会同步更新你手里的 `name`。

**两种绑定方式的可视化对比**

```python
import math
from math import sqrt

# 看看当前命名空间里有什么
for name in ["math", "sqrt"]:
    print(f"{name}: {type(globals()[name]).__name__}")
# 输出：
# math: module
# sqrt: builtin_function_or_method

# math 是模块对象，sqrt 是函数对象，二者访问路径不同
print(math.sqrt is sqrt)    # 输出：True，它们指向同一个函数对象
# 但 "sqrt" 这个名字直接可见，"math.sqrt" 要先有 math 才能访问
```

理解了"导入即绑定"，后面讲到的命名遮蔽、循环导入就都顺理成章了。

### 2.8 两种导入方式的取舍

既然两种方式都能达到"使用模块内代码"的目的，那实际写代码时该选哪种？这一节给出实用的取舍建议，不展开长篇大论，只讲经验性的判断准则。

**优先用 import module 的场景**

1. 模块名短、好记，前缀写起来不烦人：`import os`、`import re`、`import sys`。
2. 同一文件里要使用模块的大量成员，用 `from import` 会写一长串名字，不划算。
3. 团队规范要求来源清晰可查，`module.name` 天然带前缀，一眼就知道出处。

```python
# 推荐：os 的成员多、前缀短，用 import os 最舒服
import os
path = os.path.join("a", "b", "c")      # os.path.join，来源一目了然
exists = os.path.exists(path)
print(os.path.dirname(path))            # 输出：a/b
```

**优先用 from import 的场景**

1. 只用模块里的一两个名字，写前缀反而啰嗦：`from math import sqrt, pi`。
2. 名字本身就是一个"工具函数"性质的东西，加前缀反而降低可读性：`from collections import defaultdict`。
3. 社区有约定俗成的导入方式，照着做就行：`from django.shortcuts import render`。

```python
# 推荐：只用 defaultdict 一个东西，from import 干净利落
from collections import defaultdict

stats = defaultdict(list)
stats["fruit"].append("apple")
stats["fruit"].append("banana")
print(dict(stats))   # 输出：{'fruit': ['apple', 'banana']}
```

**一个具体的对比**

同样是统计一段文本里字符出现次数，两种写法的差别立见高下：

```python
# 写法一：import collections，全程带前缀
import collections
text = "hello world"
freq = collections.Counter(text)
print(freq.most_common(3))
# 读起来：collections.Counter...collections...有点重
```

```python
# 写法二：from collections import Counter，只用 Counter
from collections import Counter
text = "hello world"
freq = Counter(text)
print(freq.most_common(3))
# 输出：[('l', 3), ('o', 2), ('h', 1)]
# 读起来：Counter...Counter...顺
```

这种"只用一个类"的场景，`from import` 明显更顺手。但如果一个文件里一会儿用 `Counter`、一会儿用 `defaultdict`、一会儿又用 `OrderedDict`，那不如 `import collections` 然后统一用 `collections.Counter`——一行导入搞定，来源还清楚。

**遮蔽风险对比**

`from import` 把名字直接放进当前命名空间，最大的风险是遮蔽——你后写的一个同名变量会无声覆盖导入的名字。`import module` 因为访问要带前缀，遮蔽风险只发生在你覆盖模块名本身时（比如 `math = 1`），这种 mistakes 相对少见且容易发现。

```python
from math import sqrt

def compute(values):
    sqrt = 0      # 不小心定义了同名局部变量，遮蔽了 from import 的 sqrt
    for v in values:
        sqrt += v * v
    # return math.sqrt(sqrt)   # 这样也得 import math 才有 math 名字
    return sqrt ** 0.5          # 用 ** 0.5 绕开

print(compute([3, 4]))   # 输出：5.0
# 上面只是演示遮蔽，实际想用 sqrt() 的话已经被局部变量覆盖了
```

只要稍加注意，这种坑完全可以避免，这也是为什么规范文档通常会强调"导入名字后不要在当前作用域定义同名变量"。

### 2.9 循环导入（circular import）的成因与规避

循环导入是模块导入里最让人头疼的问题，新手第一次遇到往往一脸懵。这一节专门讲它怎么产生、怎么复现、怎么修。

**什么是循环导入**

当模块 A 在导入时需要模块 B，而模块 B 在导入时又需要模块 A，就形成了循环。Python 的模块加载机制没法处理这种"鸡生蛋蛋生鸡"的情况，通常会报 `ImportError` 或 `AttributeError`。

**最简单的复现**

```python
# a.py
import b

def func_a():
    return b.func_b()

print("a 模块加载完成")
```

```python
# b.py
import a

def func_b():
    return a.func_a()

print("b 模块加载完成")
```

现在运行 `a.py`，注意观察报错：

```python
# 执行：python a.py
# 报错（部分）：
#   File ".../b.py", line 1, in <module>
#     import a
#   File ".../a.py", line 1, in <module>
#     import b
# ImportError: cannot import name 'func_b' from partially initialized module 'b'
# (most likely due to a circular import)
```

报错信息里那句"partially initialized module"（部分初始化的模块）是关键线索。它说明问题不是"模块不存在"，而是"模块正在加载、还没加载完，内部成员还没准备好就被人急着用了"。原理章会从 `sys.modules` 的角度详细解释为什么会这样。

**from import 形式的循环导入**

循环导入在 `from import` 形式下更容易暴雷，因为 `from import` 要求目标名字在导入时就已经定义好：

```python
# a.py
from b import func_b          # 导入时就要拿到 b.func_b

def func_a():
    return func_b()

print("a loaded")
```

```python
# b.py
from a import func_a          # 导入时就要拿到 a.func_a

def func_b():
    return func_a()

print("b loaded")
```

运行 `python a.py` 会直接报 `ImportError: cannot import name 'func_b'` 或类似错误。原因是 Python 先开始加载 `a`，`a` 第一行就要 `from b import func_b`，于是暂停 `a` 去加载 `b`；`b` 第一行又要 `from a import func_a`，于是去 `sys.modules` 找 `a`——`a` 这个 key 已经在 `sys.modules` 里（因为加载过程中就先注册了），但此时 `a` 只是一个空壳模块对象，`func_a` 还没定义，于是 `from a import func_a` 取不到名字，报错。

**规避方法一：把循环依赖拆掉**

最根本的解法是重构代码，消除循环依赖。通常循环依赖的出现意味着两个模块"耦合过紧"，应该把共享的部分提取到一个第三方模块：

```python
# shared.py
def func_shared():
    return "shared logic"
```

```python
# a.py
from shared import func_shared

def func_a():
    return func_shared() + " + a"
```

```python
# b.py
from shared import func_shared

def func_b():
    return func_shared() + " + b"
```

```python
# main.py
from a import func_a
from b import func_b

print(func_a())   # 输出：shared logic + a
print(func_b())   # 输出：shared logic + b
```

这是最干净的解法，因为循环依赖本身消失了。

**规避方法二：把 import 移到函数内部**

如果实在拆不开，可以把 `import` 语句从模块顶层移到函数体内部。这样导入时机被推迟到函数被调用时，此时另一个模块早已加载完毕：

```python
# a.py
def func_a():
    import b              # 调用时才 import，此时 b 已经能完整加载
    return b.func_b()

print("a loaded")
```

```python
# b.py
def func_b():
    return "hello from b"

print("b loaded")
```

```python
# main.py
from a import func_a

print(func_a())   # 输出：hello from b
```

这种写法能绕开循环导入，但代价是每次调用函数都会多一次 import 查找（虽然不会重新执行模块，只是查 `sys.modules`，开销很小）。它是"治标不治本"的方案，适合临时应急或重构成本过高的老项目。

**规避方法三：只引用模块，不在导入时取名字**

把 `from b import func_b` 改成 `import b`，然后在函数里用 `b.func_b()`。这样导入时只要模块对象存在就行，不需要具体名字已经定义好。原理章会讲为什么这能部分缓解循环导入：

```python
# a.py
import b              # 只引用模块对象，不取成员

def func_a():
    return b.func_b()  # 实际调用时才去取 func_b，那时 b 已加载完
```

```python
# b.py
import a              # 同理

def func_b():
    return "hello from b"
```

这个办法比"import 放函数内"更优雅一点，因为它仍然在文件顶部声明了依赖，只是把"取成员"的动作推迟了。

### 2.10 动态导入 importlib.import_module 简介

`import` 语句是静态的——你必须在代码里写死要导入的模块名。但有时候模块名是运行时才知道的，比如根据用户输入、配置文件或插件目录决定加载哪个模块。这时就要用动态导入。

Python 标准库提供了 `importlib.import_module` 来做这件事：

```python
import importlib

# 动态导入 math 模块，效果等价于 import math
math_mod = importlib.import_module("math")
print(math_mod.sqrt(9))   # 输出：3.0
print(type(math_mod))     # 输出：<class 'module'>
```

**按字符串动态加载的好处**

最典型的场景是插件系统：你的程序设计了一套接口规范，第三方可以写自己的实现模块。主程序在启动时扫描插件目录，根据文件名或配置动态加载：

```python
import importlib

# 假设 plugins 目录下有 logger.py、notifier.py 等插件
available_plugins = ["logger", "notifier"]

loaded = {}
for name in available_plugins:
    try:
        # 动态导入 plugins 包下的各个模块
        mod = importlib.import_module(f"plugins.{name}")
        loaded[name] = mod
        print(f"已加载插件: {name}")
    except ModuleNotFoundError:
        print(f"插件 {name} 不存在，跳过")

# 之后通过 loaded["logger"].some_func() 调用
# 输出示例：
# 已加载插件: logger
# 已加载插件: notifier
```

如果用静态 `import`，你必须在代码里写死 `import plugins.logger`、`import plugins.notifier`，每加一个插件就得改代码。动态导入让"加插件"变成"放文件"就能搞定，扩展性大大提升。

**导入子模块**

`importlib.import_module` 也能导入包的子模块，传完整点分路径即可：

```python
import importlib

# 等价于 from os import path
os_path = importlib.import_module("os.path")
print(os.path.join("a", "b"))
# 输出：a/b
```

**和 __import__ 的关系**

Python 内置有个 `__import__` 函数也能做动态导入，但它的 API 设计偏给 `import` 语句内部使用，参数语义复杂、对子模块的处理不够直观。一般应用层推荐用 `importlib.import_module`，它是对 `__import__` 的高层封装，接口友好很多。本节只做一个简介，理解"import 不止是语句还能用函数动态做"就够了。

**动态导入的注意事项**

动态导入因为名字是运行时拼出来的，静态分析工具同样抓瞎——IDE 不知道你要导入什么模块，自然也没法补全和检查拼写。所以它只该用在"确实需要运行时决定"的场景，别为了炫技把所有 import 都改成动态的，那样代码会变得难以维护。

## 3. 最佳实践

### 3.1 导入语句放在文件顶部

Python 官方风格指南 PEP 8 明确建议：所有 `import` 语句放在文件开头，紧跟模块文档字符串和 `__all__` 之后，在全局变量和函数定义之前。这样做的好处是依赖关系一目了然，读者打开文件扫一眼顶部就知道这段代码依赖哪些模块。

```python
# 推荐写法：顶部统一导入
import os
import sys
from collections import defaultdict
from math import sqrt

def main():
    ...
```

唯一的例外是前面讲过的"把 import 放函数内以规避循环导入"，那是不得已的妥协，应该带注释说明原因。

### 3.2 导入顺序：标准库 → 第三方 → 本地

一个被广泛遵循的惯例是把导入按"远近"分组，顺序为：标准库、第三方库、本地应用/库模块，每组之间空一行。这种排序让依赖层次一眼可辨：

```python
# 标准库
import os
import sys
from collections import defaultdict

# 第三方库
import requests
from flask import Flask

# 本地模块
from myproject.config import Config
from myproject.utils import helper
```

工具 `isort` 能自动按这个规则格式化你的 import，很多 CI 流水线会集成它来保证团队风格一致。

### 3.3 不要用 from module import * 在项目代码里

前面讲 `import *` 时已经详细说明了它的三大危害：污染命名空间、来源不可追溯、静态工具抓瞎。这里再强调一次落地准则：除了交互式 REPL 里随手用用，任何进版本控制的项目代码都禁用 `from module import *`。如果你的团队还没立这条规则，建议在 linter 配置里把它开成 error。

### 3.4 导入名字后不要再定义同名变量

`from module import name` 把名字直接放进了当前命名空间，它没有任何"防覆盖"机制。如果你后续在同一个作用域里定义了同名变量，导入的名字会被静默覆盖，且不报错。养成习惯：导入了什么名字，当前作用域就别再拿这个名字做别的用途。

```python
# 不推荐：导入后又定义同名变量，容易混淆
from math import log
def log(msg):             # 这个 log 覆盖了 math.log
    print(msg)

# 推荐：要么换名字，要么把 math.log 起个别名
from math import log as math_log
def log(msg):
    print(msg)

print(math_log(10))       # 输出：2.302585...
log("hi")                 # 输出：hi
```

### 3.5 慎用 import 放函数内部来"提速"

有个流传甚广的误解：把 import 放到函数内部能加速程序启动。理由是"延迟加载，用到才导入"。这个说法只在极少数情况下成立：模块本身很重、且当前调用路径不见得会用到它。否则，把轻量级的标准库 import 塞进函数里只会让每次函数调用多一次 sys.modules 字典查找，得不偿失。

真正想优化启动速度，应该先做测量（用 `python -X importtime` 看每个 import 花了多少时间），找到真正的瓶颈模块，再有针对性地延迟导入。盲目地把 import 往函数里塞是过早优化。

### 3.6 利用 as 体现社区约定别名

前面提到的 `import numpy as np`、`import pandas as pd`、`import matplotlib.pyplot as plt`、`import django.conf as conf` 等别名是社区约定。在写这类"事实标准"模块时，直接采用社区别名叫法，能让其他 Python 开发者读你的代码更顺。反过来，如果给 numpy 起个 `import numpy as numerical_computation_library` 的别名，反而会让所有读者困惑。

### 3.7 注意 from import 与 reload 的"错位"

在开发调试时可能用到 `importlib.reload` 重新加载模块。但要注意：`reload` 只会刷新模块对象本身的内容，并不会更新你之前 `from module import name` 已经绑定的名字。也就是说，你 reload 之后，通过 `module.name` 能取到新版本，但你手里 `name` 这个变量还是旧版本。

```python
# 假设 mymod.py 内容为：def greet(): return "v1"
from mymod import greet
import importlib

print(greet())           # 输出：v1

# 此刻你手动把 mymod.py 改成：def greet(): return "v2"

importlib.reload(__import__("mymod"))
print(greet())           # 仍然输出：v1！greet 这个名字还绑着旧函数对象
# 要拿到新版本，得重新 from mymod import greet
import mymod
print(mymod.greet())     # 输出：v2，通过模块对象访问的是新版本
```

这种"错位"是 `from import` 绑定语义的副产物，在 Jupyter 这类交互式环境调试时尤其容易踩到。理解了原理章的绑定语义后，这个现象就完全不神秘了。

## 4. 原理

前面讲了"怎么用"和"怎么避坑"，这一章深入到底层，把 import 语句的执行机制、字节码、模块缓存、循环导入报错的根因逐一讲透。理解了这些，前面所有的"奇怪行为"都能对上号。

### 4.1 import 语句的完整执行流程

当 Python 遇到一条 `import math` 语句时，它并不是简单地"读一下 math.py"。实际发生的是一个分阶段的流程，每一步都值得知道：

**第一步：在 sys.modules 缓存里查找**

Python 先去 `sys.modules` 这个字典里查有没有 `"math"` 这个键。`sys.modules` 是解释器全局维护的"已加载模块登记表"，键是模块全名，值是模块对象。如果命中缓存，import 流程到此结束，直接把缓存里的模块对象绑定到当前命名空间——这就是为什么重复 import 不会重新执行模块代码。

**第二步：查找模块文件**

如果缓存没有，Python 就要去找对应的模块文件。查找顺序由 `sys.path` 决定，它是一个路径列表，包含当前目录、标准库目录、第三方库目录等。查找器（finder）会按顺序在这些路径里找名为 `math.py`、`math` 包目录（内含 `__init__.py`）或内置模块 `math` 的目标。找到后返回一个加载器（loader）。

**第三步：创建空模块对象并登记到 sys.modules**

在执行模块代码之前，Python 会先创建一个空的模块对象，并把 `"math" → 模块对象` 这个登记塞进 `sys.modules`。这一步非常关键——它解释了为什么循环导入时对方能"看到"模块存在但模块是空的。先登记再执行，是为了打破无限递归（否则 A 导 B、B 导 A 会一直递归下去）。

**第四步：执行模块顶层代码**

加载器开始执行模块文件的顶层代码。函数定义、类定义把这些名字填进模块对象的 `__dict__`；顶层的 print、赋值等副作用代码也会在这时执行。如果这一步发生异常，刚才登记的空模块对象会被从 `sys.modules` 撤回（大部分情况下），仿佛导入从没成功过。

**第五步：在当前命名空间绑定名字**

顶层代码跑完，模块对象已经"长好"了。最后一步是在 import 语句所在的作用域里绑定名字：
- 对 `import math`，绑定的是 `"math" → 模块对象`，即 `globals()["math"] = <module>`。
- 对 `from math import sqrt`，绑定的是 `"sqrt" → 模块对象的 sqrt 属性`，即 `globals()["sqrt"] = <module>.sqrt`。
- 对 `import math as m`，绑定的是 `"m" → 模块对象`。

整个流程可以用一段代码直观演示：

```python
import sys

# 观察整个加载过程
before = "math" in sys.modules
print(f"加载前，math 在 sys.modules 吗：{before}")   # 输出：False

import math
after = "math" in sys.modules
print(f"加载后，math 在 sys.modules 吗：{after}")    # 输出：True
print(f"math 模块的 __name__：{math.__name__}")      # 输出：math
print(f"math 模块的 __file__：{math.__file__}")      # 输出：math 所在路径（如果是纯 Python 模块）
print(f"math 模块的字典里有 sqrt 吗：{'sqrt' in math.__dict__}")   # 输出：True
```

### 4.2 IMPORT_NAME 字节码与 from import 的绑定语义

Python 源码被编译成字节码后才执行。`import` 语句对应的核心字节码叫 `IMPORT_NAME`，它负责"找到模块、确保被加载到 sys.modules、拿到模块对象"。`from module import name` 在这之后还会多几条字节码来"取属性并绑定"。用 `dis` 模块能直接看到：

```python
import dis

print("--- import math 的字节码 ---")
def f1():
    import math
dis.dis(f1)
# 关键几行（简化示意，实际还有连带操作）：
#   IMPORT_NAME math
#   STORE_FAST math
```

```python
print("\n--- from math import sqrt 的字节码 ---")
def f2():
    from math import sqrt
dis.dis(f2)
# 关键几行：
#   IMPORT_NAME math          # 加载 math 模块对象
#   IMPORT_FROM sqrt          # 从模块对象上取 sqrt 属性
#   STORE_FAST sqrt           # 把取到的属性绑定到当前作用域的 sqrt
#   POP_TOP                   # 弹掉临时的模块对象
```

对比之下两种导入方式的差异在字节码层面就非常清楚：

- `import math` 只做一件主事：把模块对象存到一个叫 `math` 的变量里。
- `from math import sqrt` 在加载模块之后，额外用 `IMPORT_FROM` 从模块对象上取出 `sqrt` 属性，然后把"模块对象"丢掉（POP_TOP），只保留"sqrt 这个名字 → 函数对象"的绑定。这就是为什么 `from math import sqrt` 之后 `math` 这个名字不在当前命名空间——它被弹出去了。

`IMPORT_FROM` 的一个细节：它内部走的是 `getattr`，也就是模块对象的属性查找。所以 `from module import name` 等价于"先加载 module 拿到模块对象 obj，再 `name = getattr(obj, 'name')`"。这也解释了为什么 `__all__` 不能完全阻止 `from module import 特定名字`——`__all__` 只控制 `import *` 的范围，而对于显式写出名字的 `from module import name`，只要 `getattr` 能取到就行（甚至包括下划线开头的"私有"名字，语法上照样能 from import，只是约定上不推荐）。

```python
# 即便模块作者把名字写成下划线开头表示"私有"，from import 语法上仍能取到
from collections import _collections_abc  # 虽然不推荐，但能导入成功
print(type(_collections_abc))             # 输出：<class 'module'>
```

### 4.3 sys.modules 缓存机制：模块只执行一次

"模块顶层代码只执行一次"这个特性的根基就是 `sys.modules`。它是个普通的字典，键是模块名字符串，值是模块对象。`import` 语句在走完查找阶段、要执行模块代码之前，先把空模块对象塞进这个字典。之后任何地方再 import 同一模块，`IMPORT_NAME` 会先查这个字典，命中就直接复用，跳过"查找+执行"的整套流程。

可以看一个更细节的追踪：

```python
import sys

# 先清场：确保 math 没被加载
if "math" in sys.modules:
    del sys.modules["math"]

print("1. math 在缓存里吗：", "math" in sys.modules)   # 输出：False

import math
print("2. 导入后，math 在缓存里吗：", "math" in sys.modules)   # 输出：True
print("3. 缓存里的对象和 math 变量是同一个吗：", sys.modules["math"] is math)  # 输出：True

# 再次 import，用 id 验证是同一个对象
import math as m2
print("4. 两次导入的模块对象 id 相同吗：", id(m2) == id(math))  # 输出：True
```

**缓存机制的好处**

1. 性能：模块只加载一次，后续 import 是字典查找，O(1) 开销。
2. 一致性：整个程序里 `math` 模块只有一份，所有用到的地方共享同一份函数、类、全局变量。这对"模块里的全局变量充当配置"这种模式至关重要——改一处就是改所有引用处。
3. 副作用只发生一次：模块顶层的 print、注册、初始化代码不会因为多次 import 重复执行，避免副作用累积。

**缓存机制的"坑"**

缓存也让"模块热更新"变得不容易。如果你改了模块源码，希望在已经运行的程序里生效，单纯重新 `import` 是没用的，必须走 `importlib.reload`：

```python
import importlib
import mymod           # 第一次加载
# 手动改 mymod.py 内容...
importlib.reload(mymod)   # 重新执行模块顶层代码，原地更新 mymod 对象
```

但 `reload` 有个微妙之处：它更新的是 `sys.modules` 里的模块对象的 `__dict__`，并不会替换模块对象本身（仍然是同一个对象，只是 contents 变了）。同时，前面 3.7 节提到过，`from module import name` 已经绑定的旧名字不会被 reload 同步更新。这些都是绑定语义带来的副作用。

### 4.4 循环导入为何报 AttributeError / ImportError

在 2.9 节我们复现了循环导入的报错，现在从原理角度完整剖析。循环导入的根因出在"先登记空模块对象，再执行顶层代码"这个设计上。用 `a.py` 导入 `b.py`、`b.py` 又导入 `a.py` 为例，追踪整个流程：

1. 运行 `python a.py`。Python 开始加载模块 `a`。
2. `a` 还不在 `sys.modules`。Python 创建空模块对象 `obj_a`，登记 `sys.modules["a"] = obj_a`。
3. 开始执行 `a.py` 顶层代码。第一行是 `from b import func_b`。
4. Python 发现 `b` 也不在 `sys.modules`，于是开始加载 `b`。
5. 创建空模块对象 `obj_b`，登记 `sys.modules["b"] = obj_b`。
6. 开始执行 `b.py` 顶层代码。第一行是 `from a import func_a`。
7. Python 去 `sys.modules` 查 `a`——命中了！拿到 `obj_a`。但此刻 `obj_a` 是个空壳，`a.py` 的代码刚执行到第一行就跳去加载 `b` 了，`func_a` 这个名字还根本没定义。
8. `from a import func_a` 等价于 `getattr(obj_a, "func_a")`，而 `obj_a.__dict__` 里没有 `func_a`，于是抛 `ImportError: cannot import name 'func_a'`。

整个过程的关键在第 7 步：缓存里"有"模块 `a` 但它是"半成品"，只有壳没有内容。`from a import func_a` 试图从这个半成品上取属性，自然取不到，于是报错。

**为什么 import a 不报错，from a import func_a 才报错**

理解了上面的流程，这个面试常问的问题就好回答了。如果 `b.py` 写的是 `import a` 而不是 `from a import func_a`，那么第 7 步只是拿 `obj_a` 这个壳模块对象赋值给名字 `a`，并不需要访问 `obj_a.func_a`。壳对象本身是存在的，所以 `import a` 能成功。等 `b.py` 顶层执行完，控制权回到 `a.py`，`a.py` 继续往下执行，`func_a` 也就定义好了。这时候只要 `b.py` 内部使用 `a.func_a` 的代码不在"模块加载时"立刻执行，而是在"函数被调用时"才执行，那时 `a` 已加载完，就不会出错。

这恰好是 2.9 节"规避方法三"的原理依据：把 `from a import func_a` 改成 `import a` 后用 `a.func_a()`，能绕开循环导入，因为它把"取属性"的时机从加载时推迟到了调用时。

**用代码验证"半成品模块"的存在**

```python
# tracked_a.py
import sys
print(">>> a 开始加载，此时 b 在缓存里吗：", "tracked_b" in sys.modules)   # 输出：False
import tracked_b
print(">>> a 加载完，b 也在缓存里了：", "tracked_b" in sys.modules)   # 输出：True

def func_a():
    return "from a"
```

```python
# tracked_b.py
import sys
print(">>> b 开始加载，此时 a 在缓存里吗：", "tracked_a" in sys.modules)   # 输出：True
print(">>> a 模块此时的属性列表：", [n for n in sys.modules["tracked_a"].__dict__ if not n.startswith("__")])
# 输出：[]  —— a 是空壳，func_a 还没定义
# （如果 tracked_b.py 用 from tracked_a import func_a 会报错）

def func_b():
    return "from b"
```

```python
# run_tracked.py
import tracked_a
import tracked_b
print(tracked_a.func_a())   # 输出：from a
print(tracked_b.func_b())   # 输出：from b
```

运行 `python run_tracked.py`，你会看到 `tracked_b` 加载时 `tracked_a` 确实在缓存里但里面没有任何用户定义的属性，这就是"半成品模块"的直接证据。只要 `tracked_b.py` 不在加载阶段立刻去 `from tracked_a import func_a`，循环就能化解。

**循环导入报错的几种表现**

根据具体情况，循环导入可能表现为：
- `ImportError: cannot import name 'X' from partially initialized module 'Y'`：`from Y import X` 形式下，X 还没定义。
- `AttributeError: partially initialized module 'Y' has no attribute 'X'`：用 `from Y import X` 或在加载时就 `module.X` 访问。
- 不报错但行为异常：`import Y` 形式下，Y 是空壳但没人立即取属性，等加载完才用，能侥幸跑通但依赖顺序脆弱。

理解原理后，遇到这些报错信息就知道根因都是同一个——模块加载是分步的，"已登记"不等于"已就绪"。

## 5. 总结

### 5.1 本篇内容要点

- `import module` 把整个模块对象引入当前命名空间，访问成员须用 `module.name` 前缀；`from module import name` 把模块内特定名字直接绑到当前命名空间，用名字即可。
- 两种方式都支持 `as` 起别名：`import module as alias` 给模块起别名，`from module import name as alias` 给名字起别名。
- `from module import *` 一把导入全部公开名字，看似省事实则严重污染命名空间、丢失来源信息、让静态工具抓瞎，项目代码里应禁用。
- 导入模块时顶层代码会被执行一次，重复 import 不会重新执行，因为模块被缓存在 `sys.modules` 字典里；手动删缓存再 import 会重新加载。
- 导入的实质是"绑定名字"：`import` 绑定模块对象到模块名，`from import` 绑定目标对象到导入名字；这两类绑定的差异是后续所有现象的根。
- 两种方式各有取舍：`import` 来源清晰、避免遮蔽，适合成员用得多或前缀短的模块；`from import` 简洁，适合只用一两个名字的场景。
- 循环导入产生于"A 加载时需要 B、B 加载时又需要 A"，根因是模块被"先登记空壳、再执行代码"，对方取属性时取到的是半成品。规避方式包括拆分依赖、import 放函数内、用 `import module` 代替 `from import` 推迟取属性。
- `importlib.import_module` 支持运行时按字符串动态导入，常用于插件系统，但缺失静态检查，不可滥用。
- import 的底层流程是：查 `sys.modules` 缓存 → 没命中则查找模块文件 → 创建空模块对象并登记 → 执行顶层代码 → 在当前命名空间绑定名字。
- `import` 对应 `IMPORT_NAME` 字节码；`from import` 在其后多 `IMPORT_FROM`（取属性）和 `STORE_FAST`（绑定名字）、`POP_TOP`（丢弃模块对象），这正是两种方式绑定语义不同的字节码层面原因。

### 5.2 读完应能掌握的能力

- 能说清 `import module` 与 `from module import name` 在命名空间里各自创建了什么绑定，并能用 `globals()` 验证。
- 能根据场景在两种导入方式间做合理取舍，说明前缀清晰与简洁易用之间的权衡。
- 能正确使用 `as` 给模块或成员起别名，并能用别名避免同名遮蔽冲突。
- 能解释 `from module import *` 为何不推荐，并列举至少三条具体原因。
- 能解释模块顶层代码"只执行一次"的机制，指出 `sys.modules` 缓存在其中的作用。
- 能复现循环导入的报错，并说出至少两种规避方案及其背后的原理。
- 能描述 import 语句从源码到字节码再到执行的完整流程，包括 `IMPORT_NAME`、`IMPORT_FROM` 的作用。
- 能用 `importlib.import_module` 实现一个简单的动态插件加载逻辑，并知晓其静态检查局限。