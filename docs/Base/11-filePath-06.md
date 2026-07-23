---
group:
  title: 【11】文件与路径操作
  order: 11
order: 6
title: os_walk递归遍历目录
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 os.walk

`os.walk` 是 Python 标准库 `os` 模块提供的一个生成器函数，专门用于**递归遍历目录树**。给定一个顶层目录路径，它会自上而下或自下而上地遍历该目录及其所有子目录，逐层产出该目录下的子目录名与文件名。

在写脚本时，我们经常需要"对某个文件夹下的所有文件做点什么"——比如统计项目代码行数、找出所有过期的日志文件、批量给图片加水印、清理空的子目录。如果目录只有一层，用 `os.listdir()` 一次就够了；但真实的项目目录往往嵌套好几层（`src/utils/helpers/...`），此时手动写递归既啰嗦又容易出错。`os.walk` 把"递归走遍整棵目录树"这件事封装好，你只需要在它产出的每一层结果上做处理。

它的关键特点有三：

第一，它是**生成器**。`os.walk(top)` 不会一次性把整棵树读进内存，而是每次 `next()`（或在 `for` 循环里）只产出一层目录的信息。这意味着即便是包含上百万文件的巨型目录，也能以恒定内存逐层处理。

第二，它返回的是一个**三元组** `(dirpath, dirnames, filenames)`：`dirpath` 是当前这一层目录的字符串路径，`dirnames` 是该目录下所有子目录名的列表，`filenames` 是该目录下所有文件名的列表。注意是"名字"而不是完整路径，要拿到完整路径得自己用 `os.path.join(dirpath, name)` 拼。

第三，它允许**就地剪枝**。在自上而下遍历时，你可以在循环体内直接修改 `dirnames` 列表（比如删掉不想进去的子目录名），`os.walk` 就不会递归进入那些目录。这是它相对于手写递归最大的一个便利点。

### 1.2 基本语法与最小用法

签名如下：

```python
os.walk(top, topdown=True, onerror=None, followlinks=False)
```

- `top`：要遍历的顶层目录路径。
- `topdown`：遍历方向，`True`（默认）自上而下，`False` 自下而上。
- `onerror`：可选的回调函数，当访问某目录出错（如无权限）时被调用。
- `followlinks`：是否把符号链接指向的目录当作普通子目录递归进入，默认 `False`。

返回值是一个生成器，迭代它得到 `(dirpath, dirnames, filenames)`。

最小用法——打印某目录下所有文件的完整路径：

```python
import os

# 假设有这样一个目录结构：
# demo_project/
#   main.py
#   utils/
#     helper.py
#     __pycache__/
#       helper.cpython-310.pyc
#   tests/
#     test_helper.py

for dirpath, dirnames, filenames in os.walk("demo_project"):
    for filename in filenames:
        full = os.path.join(dirpath, filename)
        print(full)
```

```text
# 输出：
demo_project/main.py
demo_project/utils/helper.py
demo_project/utils/__pycache__/helper.cpython-310.pyc
demo_project/tests/test_helper.py
```

在这个最小例子里，`os.walk` 自动钻进了 `utils`、`tests`、`__pycache__` 这些子目录，我们不需要自己写任何递归。每到一个目录，它把当前路径交给 `dirpath`、子目录名交给 `dirnames`、文件名交给 `filenames`，我们在循环体里拼接并打印即可。

**适用场景**

当你需要处理一整棵目录树而非单个目录时——比如遍历项目找所有源文件、清理临时文件、同步备份、生成文件清单。只处理单层目录用 `os.listdir()` 更直接；需要对象式路径操作可与 `pathlib.Path.rglob()` 配合。

**常见误区**

很多人第一次用 `os.walk` 会误以为 `filenames` 里给的是完整路径，直接拿去 `open(filenames[0])` 结果报 `FileNotFoundError`。记住：`os.walk` 给的是"名"，要拼接完整路径得自己 `os.path.join(dirpath, name)`。

---

## 2. 核心内容

### 2.1 三元组返回值详解

`os.walk` 每次产出的三元组 `dirpath, dirnames, filenames` 是理解整个函数的钥匙，逐一说清。

`dirpath` 是一个字符串，表示当前正在访问的这一层目录的**完整路径**（相对于你传入的 `top` 的形式——你传相对路径它就给相对路径，你传绝对路径它就给绝对路径）。它是拼接文件完整路径时的"前缀"。

`dirnames` 是一个**列表**（不是元组，这点很重要，因为可修改），元素是当前 `dirpath` 目录下所有**直接子目录**的名字（不含路径，不含子目录的子目录）。".name` 形式的隐藏目录也算在内，不会有特殊过滤。

`filenames` 同样是一个**列表**，元素是当前 `dirpath` 目录下所有**直接文件**的名字。注意：符号链接如果指向文件会出现在 `filenames` 里；指向目录的符号链接默认不出现在 `dirnames` 里（因为是链接不是真目录），除非设了 `followlinks=True`。

一个关键点：`dirnames` 和 `filenames` 互不重叠，且只反映**当前这一层**的直接内容，不包含子目录内部的东西——那些会在后续迭代里以新的三元组形式产出。

来看一个更细致的例子，把三元组本身打印出来观察：

```python
import os

# 目录结构：
# sample/
#   a.txt
#   b.log
#   sub1/
#     c.txt
#   sub2/
#     d.txt
#     deep/
#       e.txt

for dirpath, dirnames, filenames in os.walk("sample"):
    print(f"dirpath = {dirpath}")
    print(f"  dirnames  = {dirnames}")
    print(f"  filenames = {filenames}")
```

```text
# 输出：
dirpath = sample
  dirnames  = ['sub1', 'sub2']
  filenames = ['a.txt', 'b.log']
dirpath = sample/sub1
  dirnames  = []
  filenames = ['c.txt']
dirpath = sample/sub2
  dirnames  = ['deep']
  filenames = ['d.txt']
dirpath = sample/sub2/deep
  dirnames  = []
  filenames = ['e.txt']
```

可以看到整棵树被拆成了 4 个三元组，每个对应一层目录。顶层 `sample` 先被访问，此时我们能看到它下面有 `sub1`、`sub2` 两个子目录和 `a.txt`、`b.log` 两个文件；接着进入 `sub1`，再进入 `sub2`，最后进入 `sub2/deep`。每个三元组只描述"这一层"。

### 2.2 遍历方向：topdown

`topdown` 参数控制遍历顺序，决定的是**父目录和子目录谁先被产出**，而**不是**"是否进入子目录"——两种模式都会遍历整棵树。

`topdown=True`（默认）是**自上而下**：先产出父目录，再产出它的子目录。也就是父在前、子在后，深度更浅的在前。上面的输出就是自上而下的结果：`sample` → `sample/sub1` → `sample/sub2` → `sample/sub2/deep`。

`topdown=False` 是**自下而上**：先产出最深的子目录，最后才产出根目录。子在前、父在后。对同样的 `sample` 树：

```python
import os

for dirpath, dirnames, filenames in os.walk("sample", topdown=False):
    print(f"dirpath = {dirpath}, filenames = {filenames}")
```

```text
# 输出：
dirpath = sample/sub1, filenames = ['c.txt']
dirpath = sample/sub2/deep, filenames = ['e.txt']
dirpath = sample/sub2, filenames = ['d.txt']
dirpath = sample, filenames = ['a.txt', 'b.log']
```

注意顺序：最深的 `sample/sub1` 和 `sample/sub2/deep` 先出来，然后是 `sample/sub2`，最后才是根 `sample`。

两种方向分别什么场景用？

自上而下适合"边走边建"或"边走边列清单"——比如复制目录树时先创建父目录再往里放文件、生成文件清单时按自然的层级缩进展示。

自下而上适合"自底向上清理或统计"——最经典的场景是**删除空目录**：你必须先把子目录里的内容处理干净，才能判断一个父目录是否已经空了、能不能删。反过来如果自上而下删，可能父目录先删了，子目录还在引用被删的路径，逻辑会乱。另一个场景是**统计每个目录占用的磁盘空间**：要先算出子目录的总大小，才能把它累加到父目录上。

自下而上统计每层目录含子孙的大小：

```python
import os

dir_size = {}  # 记录每个目录自身文件大小之和
tree_size = {}  # 记录每个目录含所有子孙的总大小

for dirpath, dirnames, filenames in os.walk("sample", topdown=False):
    # 当前目录自身文件大小
    self_size = sum(
        os.path.getsize(os.path.join(dirpath, f)) for f in filenames
    )
    dir_size[dirpath] = self_size
    # 总大小 = 自身 + 所有子目录的总大小
    total = self_size
    for d in dirnames:
        sub = os.path.join(dirpath, d)
        total += tree_size[sub]  # 自下而上，子目录一定已经算过
    tree_size[dirpath] = total
    print(f"{dirpath}: 自身 {self_size} 字节, 含子孙 {total} 字节")
```

```text
# 输出（大小取决于实际文件内容，此处为示意）：
sample/sub1: 自身 12 字节, 含子孙 12 字节
sample/sub2/deep: 自身 8 字节, 含子孙 8 字节
sample/sub2: 自身 10 字节, 含子孙 18 字节
sample: 自身 20 字节, 含子孙 50 字节
```

正是因为自下而上保证了"算 `sample/sub2` 之前 `sample/sub2/deep` 已经在 `tree_size` 里"，我们才能直接 `tree_size[sub]` 取值而不需要担心子目录还没被访问。这是自下而上模式的核心价值。

**一个容易混淆的点**：`topdown` 不影响你能否看到子目录的内容，只影响顺序。无论哪个方向，`dirnames` 里都包含所有子目录名。

### 2.3 剪枝：就地修改 dirnames

这是 `os.walk` 最强大的特性。在 `topdown=True` 模式下，每次循环开始时 `dirnames` 是接下来要进入的子目录清单。如果你在循环体内**修改这个列表**（删掉某些名字），`os.walk` 就不会递归进入被删掉的子目录。

注意：必须用**就地修改**的方式——`dirnames.remove(...)`、`dirnames[:] = [...]`、`del dirnames[...]`、`dirnames.clear()` 等。直接 `dirnames = [...]` 只是重新绑定本地变量，不会影响 `os.walk` 内部的状态，剪枝不生效。

典型场景是跳过 `.git`、`node_modules`、`__pycache__`、`.venv` 这些不该递归进去的目录：

```python
import os

# 项目目录里混杂了 __pycache__ 和 .git，我们想找所有 .py 源文件
# 但不想进入这两个目录（它们里面有大量无用文件，会很慢）

for dirpath, dirnames, filenames in os.walk("demo_project"):
    # 剪枝：从 dirnames 里删掉不想进入的子目录
    # 用切片赋值就地替换，安全地只保留不想跳过的
    dirnames[:] = [d for d in dirnames if d not in ("__pycache__", ".git", ".venv")]
    
    for filename in filenames:
        if filename.endswith(".py"):
            full = os.path.join(dirpath, filename)
            print(full)
```

```text
# 输出（示意）：
demo_project/main.py
demo_project/utils/helper.py
demo_project/tests/test_helper.py
```

为什么这里要用 `dirnames[:] = ...` 而不是 `dirnames = ...`？因为后者只是让局部变量 `dirnames` 指向一个新列表，`os.walk` 内部持有的还是原来那个列表，没被改，照样会进入 `__pycache__`。`dirnames[:] = ...` 是对原列表做切片赋值，原列表内容真被替换了，`os.walk` 后续看到的就是替换后的版本，从而达到剪枝效果。

剪枝只在 `topdown=True` 时有效。因为自上而下是"先访问父、再访问子"，访问父时拿到 `dirnames` 还是"待进入清单"，删掉就来得及阻止进入。而自下而上是"先访问子、再访问父"，访问父时子目录早就已经遍历完了，改 `dirnames` 没有任何阻断作用。所以**需要剪枝就必须用默认的 `topdown=True`**。

一个更精细的剪枝——按目录名模式跳过，配合正则：

```python
import os
import re

# 跳过所有名字以 "." 开头的隐藏目录（如 .git, .idea, .vscode）
# 以及名为 build、dist 的目录

skip_pattern = re.compile(r"^\.|^(build|dist|node_modules)$")

for dirpath, dirnames, filenames in os.walk("demo_project"):
    dirnames[:] = [d for d in dirnames if not skip_pattern.search(d)]
    # 剩下的 dirnames 才会继续被遍历
    print(f"进入: {dirpath}, 子目录: {dirnames}, 文件数: {len(filenames)}")
```

剪枝带来的不仅是逻辑上的"不进入"，更是**性能上的节省**。`node_modules` 一个目录常常包含数万个文件，如果每次都全量遍历进去再过滤，会很慢；剪枝则让 `os.walk` 从源头就不进去，节省的数量级可能上千倍。这是"提前过滤"优于"事后过滤"的典型体现。

### 2.4 onerror 处理访问错误

遍历时可能遇到访问不了的情况——最常见的是**权限不足**（`PermissionError`）。`os.walk` 默认会**静默忽略**这种错误，直接跳过那个目录继续遍历。这有时是你想要的（容错跑完），有时不是（你想知道哪里出了问题）。

`onerror` 参数接受一个回调函数，签名为 `onerror(os_error_instance)`，当遍历某目录报错时被调用，传入的参数是一个 `OSError` 实例。如果你想让错误"冒泡"中断遍历，在回调里 `raise` 它；如果你只想记录，在回调里打印即可。

最常见的用法是想看到被跳过的目录，但不中断：

```python
import os

def report_error(err):
    # err 是 OSError 实例，err.filename 是访问失败的目录
    print(f"[跳过] {err.filename}: {err.strerror}")

# 遍历系统目录，必然有权限受限的地方
for dirpath, dirnames, filenames in os.walk("/etc", onerror=report_error):
    for f in filenames:
        pass  # 处理文件

print("遍历完成（过程中遇到的错误已打印）")
```

```text
# 输出示意：
[跳过] /etc/sudoers.d: Permission denied
[跳过] /etc/cups/ssl: Permission denied
遍历完成（过程中遇到的错误已打印）
```

如果你希望遇到权限错误就直接停下来排查，而不是继续：

```python
import os

def raise_error(err):
    raise err  # 让错误冒泡，中断整个遍历

try:
    for dirpath, dirnames, filenames in os.walk("/some/protected/path", onerror=raise_error):
        pass
except PermissionError as e:
    print(f"因权限问题中断: {e}")
```

一个坑：`onerror` 只处理**遍历目录本身**的报错（比如 `opendir` 失败），不处理你对文件操作（如 `os.path.getsize`、`open`）引发的错误。后者需要你在循环体里自己 `try/except`。例如某个文件在你拿到它的名字之后、读取它的大小之前被别的进程删了，`getsize` 会抛 `FileNotFoundError`——这不在 `onerror` 管辖范围。

```python
import os

for dirpath, dirnames, filenames in os.walk("logs", onerror=lambda e: print(f"目录错误: {e.filename}")):
    for f in filenames:
        full = os.path.join(dirpath, f)
        try:
            size = os.path.getsize(full)
        except OSError as e:
            print(f"文件 {full} 读大小失败: {e}")
            continue
        # 正常处理 size
```

### 2.5 followlinks 处理符号链接

`followlinks` 决定是否把指向目录的符号链接当作普通子目录递归进去。默认 `False`：符号链接只作为名字出现在 `dirnames` 里，但 `os.walk` 不会顺着它往下走。设为 `True` 则会走进去。

为什么默认是 `False`？为了安全。符号链接可能形成**环**——比如 `a/link -> a`，如果无脑跟随，`os.walk` 就会无限递归下去直到栈溢出或耗尽资源。默认不跟随就避开了这个陷阱。

看一个制造循环链接的例子：

```python
import os

# 制造一个会自循环的符号链接
os.makedirs("cycle/sub", exist_ok=True)
# 在 cycle 目录下建一个 link 指向 cycle 自身（模拟环）
# 注意：实际生产中别这么干，这里只是演示 os.walk 的保护
try:
    os.symlink("cycle", "cycle/loop")  # cycle/loop -> cycle
except FileExistsError:
    pass

# 默认 followlinks=False：安全，不会陷入循环
count = 0
for dirpath, dirnames, filenames in os.walk("cycle"):
    count += 1
print(f"followlinks=False 访问了 {count} 个目录")
# 会访问 cycle 本身和 cycle/sub，但不会进入 cycle/loop 指向的 cycle
```

```text
# 输出：
followlinks=False 访问了 2 个目录
```

如果你确实需要跟随链接（比如遍历一个由符号链接组织起来的虚拟目录树），务必意识到环的风险，最好自己加一个"已访问路径集合"做防环保护：

```python
import os

seen = set()
file_count = 0

for dirpath, dirnames, filenames in os.walk("with_links", followlinks=True):
    real = os.path.realpath(dirpath)
    if real in seen:
        # 已经通过别的路径访问过这个真实目录，剪枝避免循环
        dirnames[:] = []
        continue
    seen.add(real)
    file_count += len(filenames)

print(f"共发现 {file_count} 个文件（已防环）")
```

`os.path.realpath` 把符号链接解析成真实物理路径，这样无论从哪条链接路径进来，同一个真实目录都映射到同一个 `real`，用集合去重就能挡住环。

### 2.6 典型场景一：统计文件总数与按扩展名分类

实战中最常见的需求之一——遍历项目，统计每种扩展名有多少个文件。结合 `collections.Counter` 配合 `os.walk` 非常顺手：

```python
import os
from collections import Counter

# 遍历项目，统计各扩展名文件数量，跳过 .git 和 __pycache__
counter = Counter()
total = 0

for dirpath, dirnames, filenames in os.walk("demo_project"):
    # 剪枝：不进入版本控制和缓存目录
    dirnames[:] = [d for d in dirnames if d not in (".git", "__pycache__", ".venv")]
    
    for f in filenames:
        # os.path.splitext 取扩展名，如 'main.py' -> ('main', '.py')
        ext = os.path.splitext(f)[1].lower() or "(无扩展名)"
        counter[ext] += 1
        total += 1

print(f"文件总数: {total}")
print("按扩展名分布:")
for ext, n in counter.most_common():
    print(f"  {ext:12s} {n}")
```

```text
# 输出示意：
文件总数: 8
按扩展名分布:
  .py          4
  .md          2
  .txt         1
  (无扩展名)    1
```

注意 `os.path.splitext` 对无扩展名文件返回 `('README', '')`，空字符串作为 key 不直观，这里用 `or` 替换成展示性字符串。`most_common()` 按数量降序输出，方便看主次。

### 2.7 典型场景二：按条件筛选并处理文件

"找出 7 天前修改过的日志文件并删除"是运维脚本的经典任务。组合 `os.walk` 和 `os.path` 的判断函数：

```python
import os
import time

# 当前时间戳
now = time.time()
# 7 天的秒数
seven_days = 7 * 24 * 3600

deleted = 0
for dirpath, dirnames, filenames in os.walk("logs"):
    for f in filenames:
        if not f.endswith(".log"):
            continue
        full = os.path.join(dirpath, f)
        try:
            mtime = os.path.getmtime(full)
        except OSError:
            continue
        if now - mtime > seven_days:
            os.remove(full)
            deleted += 1
            print(f"已删除过期日志: {full}")

print(f"共删除 {deleted} 个过期日志文件")
```

```text
# 输出示意：
已删除过期日志: logs/old/2024-01-01.log
已删除过期日志: logs/old/2024-01-02.log
共删除 2 个过期日志文件
```

这里有几个工程细节：一是用 `try/except` 保护 `getmtime`，避免文件被并发删掉时崩溃；二是只删 `.log` 文件，不误删别的；三是先 `continue` 过滤再做事，循环体保持扁平。

### 2.8 典型场景三：自下而上清理空目录

删除空目录必须自下而上。`os.rmdir` 只能删**空**目录，如果目录里还有子目录会报错。自下而上保证了删父目录时其子目录已经被删空。

```python
import os

removed = 0
# topdown=False：先处理最深的子目录
for dirpath, dirnames, filenames in os.walk("empty_tree", topdown=False):
    if dirnames == [] and filenames == []:
        # 当前目录既无子目录也无文件，是个空目录
        try:
            os.rmdir(dirpath)
            removed += 1
            print(f"已删除空目录: {dirpath}")
        except OSError as e:
            print(f"删除失败 {dirpath}: {e}")
    else:
        print(f"保留 {dirpath}（含 {len(dirnames)} 子目录, {len(filenames)} 文件）")

print(f"共清理 {removed} 个空目录")
```

```text
# 输出示意：
已删除空目录: empty_tree/a/b/c
已删除空目录: empty_tree/a/b
已删除空目录: empty_tree/a
保留 empty_tree（含 0 子目录, 1 文件）
共清理 3 个空目录
```

看这个顺序：`c` 最深先删，删完 `b` 就空了能删，再 `a` 空了能删，最后根目录因为还剩一个文件被保留。这正是自下而上才能做到的"逐级掏空"。如果用自上而下，`os.rmdir("empty_tree/a")` 时 `a` 里还有 `b`，直接报错。

### 2.9 典型场景四：批量改名 / 重构文件

把项目里所有 `.txt` 文件改成 `.md`——但要小心，不能改 `__pycache__` 之类。结合剪枝和安全改名：

```python
import os

renamed = 0
for dirpath, dirnames, filenames in os.walk("notes"):
    dirnames[:] = [d for d in dirnames if d != "__pycache__"]
    
    for f in filenames:
        if not f.endswith(".txt"):
            continue
        old = os.path.join(dirpath, f)
        new = os.path.join(dirpath, f[:-4] + ".md")
        # 用 os.replace 原子性改名，目标存在也会覆盖
        os.replace(old, new)
        renamed += 1

print(f"共重命名 {renamed} 个 txt -> md")
```

```text
# 输出：
共重命名 5 个 txt -> md
```

用 `os.replace` 而非 `os.rename` 的好处：跨平台更稳定，且目标已存在时是覆盖而非报错（在 Windows 上 `os.rename` 目标存在会失败）。

### 2.10 与手写递归遍历的对比

不用 `os.walk`，自己用 `os.listdir` 写递归也能达到同样目的：

```python
import os

def manual_walk(path):
    """手写递归遍历，模拟 os.walk 的自上而下行为"""
    entries = os.listdir(path)
    dirnames, filenames = [], []
    for e in entries:
        full = os.path.join(path, e)
        if os.path.isdir(full):
            dirnames.append(e)
        else:
            filenames.append(e)
    yield path, dirnames, filenames
    for d in dirnames:
        yield from manual_walk(os.path.join(path, d))

# 用法跟 os.walk 一样
for dirpath, dirnames, filenames in manual_walk("sample"):
    print(dirpath, filenames)
```

```text
# 输出：
sample ['a.txt', 'b.log']
sample/sub1 ['c.txt']
sample/sub2 ['d.txt']
sample/sub2/deep ['e.txt']
```

对比下来，`os.walk` 的优势在于：

第一，**剪枝更自然**。手写递归要剪枝得给函数加参数或在生成器里特殊处理，而 `os.walk` 只需就地改 `dirnames`，一行搞定。

第二，**方向切换一行参数**。手写递归要改自下而上，得把 `yield` 挪到递归之后，重写生成器逻辑；`os.walk` 只需 `topdown=False`。

第三，**错误处理统一**。`onerror` 给了统一的错误回调点，手写递归要在多处 `try/except`。

第四，**更不容易出 bug**。手写递归容易在"文件 vs 目录判断""符号链接""路径拼接"上踩坑，`os.walk` 这些都处理好了。

但手写递归也有它的价值：当你需要**完全自定义的遍历策略**（比如带最大深度限制、按目录大小排序进入、边遍历边过滤内容），手写会更灵活。`os.walk` 是个"够用且顺手"的默认选择，不是万能的。

### 2.11 用 maxdepth 模拟受限深度遍历

`os.walk` 本身没有 `maxdepth` 参数。需要限制深度时，可以靠 `dirpath` 相对 `top` 的层级数来剪枝：

```python
import os

top = "demo_project"
top_abs = os.path.abspath(top)

for dirpath, dirnames, filenames in os.walk(top):
    # 计算当前目录相对于根的深度
    rel = os.path.relpath(dirpath, top)
    depth = 0 if rel == "." else rel.count(os.sep) + 1
    
    if depth >= 2:
        # 已经到了第 2 层，不再深入更深的子目录
        dirnames[:] = []
    
    print(f"[深度 {depth}] {dirpath}")
    for f in filenames:
        print(f"    {f}")
```

```text
# 输出示意（只到第 2 层，不进入更深的子目录）：
[深度 0] demo_project
    main.py
[深度 1] demo_project/utils
    helper.py
[深度 1] demo_project/tests
    test_helper.py
```

这里的思路是：用 `os.path.relpath` 算出相对根的路径，数其中分隔符的个数得到深度。当深度达到上限时，`dirnames[:] = []` 把待进入的子目录清空，阻止继续往下钻。注意第 2 层本身的文件还是会被处理（剪的是再往下一层），如果连第 2 层都不想处理，把判断改成 `depth > max_depth` 并配合更早的 `continue`。

**常见搭配 / 进阶用法**

实际项目里，`os.walk` 很少单独使用，常与以下工具搭配：

- `os.path` 系列：`join` 拼路径、`getsize` 取大小、`getmtime` 取修改时间、`splitext` 取扩展名，这是 `os.walk` 循环体里最常调用的几个。
- `pathlib.Path`：在 `os.walk` 外层套一层 `Path(dirpath)` 做 `.glob`、`.rglob` 时，注意两者各有所长——`Path.rglob` 写法更优雅但剪枝不如 `os.walk` 直接。
- `collections.Counter`：统计场景天然搭子。
- `fnmatch` 或 `glob` 模块：当文件名匹配模式复杂（含通配符）时，用 `fnmatch.fnmatch(filename, "*.py")` 过滤。

---

## 3. 最佳实践

### 3.1 拼接完整路径用 os.path.join，别用字符串拼接

```python
# 推荐
full = os.path.join(dirpath, filename)

# 不推荐
full = dirpath + "/" + filename      # Windows 上会错
full = f"{dirpath}/{filename}"       # 同上，跨平台不安全
```

**原因**：不同操作系统的路径分隔符不同（Linux/macOS 是 `/`，Windows 是 `\`）。`os.path.join` 会自动选用当前系统正确的分隔符，而字符串拼接硬编码 `/` 在 Windows 上要么报错要么路径失效。即便你的脚本只跑在 Linux 上，养成跨平台习惯也能避免日后移植的麻烦。另一个细节是 `os.path.join` 能正确处理 `dirpath` 末尾是否带分隔符的情况，手拼则要自己担心。

### 3.2 需要剪枝就必须 topdown=True

```python
# 推荐：用默认 topdown=True 配合就地修改
for dirpath, dirnames, filenames in os.walk(top):
    if "node_modules" in dirnames:
        dirnames.remove("node_modules")
    ...

# 不推荐：topdown=False 还想剪枝——不生效
for dirpath, dirnames, filenames in os.walk(top, topdown=False):
    dirnames.remove("node_modules")  # 子目录早已遍历完，删了也没用
```

**原因**：自下而上是"先访问子、再访问父"，访问到父目录时子目录的内容早就产出了，改 `dirnames` 无法回头阻挡。剪枝的实现依赖"在进入子目录之前先修改列表"，这只有自上而下能满足。若既有剪枝需求又想自下而上（如清理空目录），通常应分两遍：先自上而下收集要清理的目标，再按需处理；或放弃剪枝接受全量遍历。

### 3.3 就地修改 dirnames，不要重新赋值

```python
# 推荐：切片赋值就地替换
dirnames[:] = [d for d in dirnames if d != "__pycache__"]

# 也推荐：用 remove 删特定项
if "__pycache__" in dirnames:
    dirnames.remove("__pycache__")

# 不推荐：重新绑定本地变量——剪枝不生效
dirnames = [d for d in dirnames if d != "__pycache__"]
```

**原因**：`os.walk` 内部持有的是同一个列表对象的引用。`dirnames[:] = ...` 是对原列表做切片赋值、改变其内容，`os.walk` 后续看到的就是改过的。而 `dirnames = ...` 只是让函数局部的 `dirnames` 名字指向新列表，原列表没变，`os.walk` 仍然按原始列表继续遍历。这是新手用 `os.walk` 最常犯的错，表现为"明明写了过滤却还是进去了"。

### 3.4 文件操作要容错，别假设文件还在

```python
# 推荐
for f in filenames:
    full = os.path.join(dirpath, f)
    try:
        size = os.path.getsize(full)
    except OSError as e:
        print(f"跳过 {full}: {e}")
        continue

# 不推荐：假设文件一定还在、一定能读
for f in filenames:
    full = os.path.join(dirpath, f)
    size = os.path.getsize(full)  # 可能 FileNotFoundError
```

**原因**：`os.walk` 给你 `filenames` 是在"遍历目录的那一刻"，但你拿这个名字去操作文件是"稍后"。在并发环境（别的进程在写日志、用户在删文件）下，文件可能在你拿到名字之后、操作之前就消失或权限变了。`onerror` 只管目录访问错误，不管你对单个文件的操作，所以文件级容错要自己在循环体里 `try/except`。

### 3.5 大目录注意内存与性能

```python
# 推荐：逐个处理，不先把所有结果攒起来
total = 0
for dirpath, dirnames, filenames in os.walk(huge_dir):
    dirnames[:] = [d for d in dirnames if d != ".git"]
    total += len(filenames)
print(total)

# 不推荐：把所有路径先收集到列表——目录巨大时会吃光内存
all_files = []
for dirpath, dirnames, filenames in os.walk(huge_dir):
    all_files.extend(os.path.join(dirpath, f) for f in filenames)
# 此时 all_files 可能有几百万元素
```

**原因**：`os.walk` 本身是生成器、内存友好，但如果你把所有结果先塞进列表再处理，就抵消了这个好处。逐层处理、边遍历边消费才不额外占内存。另外善用剪枝跳过 `node_modules`、`.git` 这类超大目录，能避免遍历几万个无用文件。

### 3.6 符号链接默认别跟随，防环

```python
# 推荐：默认 followlinks=False，需要跟随时再加防环保护
for dirpath, dirnames, filenames in os.walk(top):
    ...

# 仅在确有必要时
seen = set()
for dirpath, dirnames, filenames in os.walk(top, followlinks=True):
    real = os.path.realpath(dirpath)
    if real in seen:
        dirnames[:] = []
        continue
    seen.add(real)
```

**原因**：符号链接环会导致无限递归，`os.walk` 自己不查环（哪怕设了 `followlinks=True` 也不查）。默认 `False` 是安全的；一旦开 `True`，必须自己用 `realpath` 去重防环，否则脚本可能挂死或把磁盘塞满快照。

### 3.7 用相对路径还是绝对路径取决于用途

```python
# 生成给用户看的清单、做幂等校验——用绝对路径
for dirpath, dirnames, filenames in os.walk(os.path.abspath(top)):
    ...
    # 无论从哪个工作目录运行，结果一致

# 项目内部脚本、输出可移植——用相对路径
for dirpath, dirnames, filenames in os.walk("src"):
    ...
    # 输出如 src/main.py，更易阅读和跨机器复用
```

**原因**：`os.walk` 产出路径的形态跟你传入 `top` 的形态一致。传绝对路径产出绝对路径，传相对路径产出相对路径。这决定了你后续拼接出来的完整路径是绝对还是相对，进而影响脚本的"工作目录依赖性"。要写不依赖工作目录的健壮脚本，开头先 `os.path.abspath` 转成绝对路径最稳妥。

---

## 4. 原理

### 4.1 os.walk 是生成器函数

`os.walk` 被调用时并不立即遍历任何东西，而是返回一个**生成器对象**。真正的遍历发生在你迭代它的时候——每次 `next()`（或 `for` 循环拉取一次）才访问一个目录并产出一个三元组。

这从签名就能看出来：它没有一次性返回列表，而是用 `yield` 产出。在 CPython 实现里，`os.walk` 大致是这样一个生成器函数（简化伪代码）：

```python
def walk(top, topdown=True, onerror=None, followlinks=False):
    try:
        scandir_it = os.scandir(top)  # 用 scandir 高效读目录
    except OSError as err:
        if onerror is not None:
            onerror(err)
        return  # 出错且未抛出，直接结束这个生成器
    
    dirs = []
    nondirs = []
    for entry in scandir_it:
        if entry.is_dir(follow_symlinks=followlinks):
            dirs.append(entry.name)
        else:
            nondirs.append(entry.name)
    
    if not topdown:
        # 自下而上：先递归子目录，再 yield 自己
        for dirname in dirs:
            yield from walk(os.path.join(top, dirname), topdown, onerror, followlinks)
        yield top, dirs, nondirs
    else:
        # 自上而下：先 yield 自己，再递归子目录
        yield top, dirs, nondirs
        # 注意：用索引遍历 dirs，这样循环体里对 dirs 的就地修改会影响后续递归
        islink = os.path.islink
        join = os.path.join
        i = 0
        while i < len(dirs):
            new_path = join(top, dirs[i])
            yield from walk(new_path, topdown, onerror, followlinks)
            i += 1
```

这段伪代码揭示了几件关键的事：

第一，**为什么修改 `dirnames` 能剪枝**。注意自上而下分支里递归用的是 `dirs[i]`——这是循环体里你正握着的那个列表。你在循环体内 `dirnames.remove("x")` 或 `dirnames[:] = [...]` 之后，下一次迭代 `i` 自增、`len(dirs)` 重新计算，被删掉的子目录就不会再被 `walk` 递归。这就是"就地修改生效"的根源：`os.walk` 递归进入子目录时从同一个 `dirs` 列表里按索引取名字，你动了这个列表，后续取值就跟着变。

第二，**为什么自下而上不能剪枝**。自下而上分支是"先 `yield from walk(子)` 再 `yield 自己`"——递归进入子目录这件事在 `yield` 自己**之前**就发生了。等你拿到三元组、想改 `dirs` 时，子目录早就遍历完了，为时已晚。

第三，**`onerror` 为什么只管目录级错误**。错误处理在 `scandir(top)` 那一步——即"打开这个目录读它的内容"这一动作上。如果打开目录失败（权限不足、目录不存在），才会触发 `onerror`。至于目录打开后单个文件能不能读、文件随后还在不在，那是后续你的操作，不在 `os.walk` 的职责内。

### 4.2 用 scandir 而非 listdir 获取性能

从 Python 3.5 起，`os.walk` 的实现从 `os.listdir` 换成了 `os.scandir`。差别在于：

`os.listdir(path)` 只返回名字字符串列表，想知道某个名字是文件还是目录，你得对每个名字再调一次 `os.path.isdir(os.path.join(path, name))`——这每个调用都是一次系统调用（`stat`），N 个条目就是 N+1 次系统调用。

`os.scandir(path)` 返回的 `DirEntry` 对象在读取目录时**顺便缓存了文件类型信息**（来自底层 `opendir`/`readdir` 在多数系统上返回的 `d_type` 字段）。这样判断 `entry.is_dir()` 通常不需要额外的 `stat` 系统调用，N 个条目只 1 次系统调用（外加少数需要回退 `stat` 的情况）。

对包含大量条目的目录，这个差别能带来显著的性能提升（在某些系统上速度差几倍）。所以++];
你看到 `os.walk` 的核心循环用 `for entry in scandir_it` 而不是 `for name in listdir`，这是有意的优化。也正因此，`os.walk` 的 `dirnames`/`filenames` 顺序通常是目录条目的"原始顺序"（取决于文件系统），不保证排序——如果你需要排序，得自己 `sorted()`。

### 4.3 生成器协程式的"参数可变性"

更深一层看，`os.walk` 其实利用了生成器对外暴露可变状态的能力，形成了一种介于"函数"和"协程"之间的模式。

通常的生成器是"只产出、不接收外部修改"的——生成器内部有状态，外部只能读取它 `yield` 出来的值，不能回头改它内部的状态。但 `os.walk` 的三元组里 `dirnames` 是个可变列表，外部循环体修改它，生成器内部下一次迭代会看到修改后的版本，进而改变自己的后续行为（是否递归进入某些目录）。

这相当于生成器把"要不要递归进入哪些子目录"这个决策权**部分交还给了调用方**。调用方通过修改 `dirnames` 实现"反馈式控制"——不是事先传一个参数决定遍历策略，而是在遍历过程中动态、逐层地决定。

这种"返回可变对象让调用方影响后续行为"的设计在标准库里不算常见，一旦理解了，就能解释清楚所有那些"为什么改 `dirnames` 有效"的现象。也正因为如此，`dirnames` 故意做成列表而非元组——元组不可变就没法实现这种反馈控制了。

### 4.4 递归与生成器的组合：yield from

`os.walk` 用 `yield from walk(子目录)` 来递归。`yield from` 是 Python 3.3 引入的语法，作用是"把另一个可迭代对象（这里是子生成器）的产出逐个委托给当前生成器"。

这等价于：

```python
for item in walk(子目录):
    yield item
```

但 `yield from` 还额外正确处理了 `.send()`、`.throw()` 等生成器协议的传递，对纯遍历场景两者等价。

重要的是 `yield from` 让递归不必把所有结果先收集再返回，而是"边递归边产出"。整棵目录树的每一层都是一次 `walk` 生成器调用，它们通过 `yield from` 像管道一样串起来，调用方的 `for` 循环就能源源不断拿到所有结果，而链路上任何时刻只有当前那条递归路径上的生成器是活跃的，内存占用与目录深度成正比（O(深度)），与目录总文件数无关。这就是 `os.walk` 能处理超大树而内存恒定的根本原因。

---

## 5. 总结

- 本文围绕 `os.walk(top, topdown=True, onerror=None, followlinks=False)` 这个目录树遍历生成器展开，它是处理嵌套目录的瑞士军刀。
- 核心数据结构是三元组 `(dirpath, dirnames, filenames)`：当前目录路径、子目录名列表、文件名列表——拿到名字后要自己 `os.path.join` 拼完整路径。
- `topdown` 决定遍历方向：`True` 先父后子（默认，支持剪枝、适合列清单和复制），`False` 先子后父（适合自底向上统计、清理空目录）。
- 在 `topdown=True` 时，**就地修改 `dirnames`**（用切片赋值或 `remove`）可实现剪枝，跳过 `.git`、`node_modules` 等不该进的目录；重新赋值局部变量不生效。
- `onerror` 回调处理目录访问错误（如权限不足），默认静默跳过；文件级操作错误要自己在循环体里 `try/except`。
- `followlinks=False` 默认不跟随符号链接以防环；设 `True` 时必须自己用 `realpath` 去重防无限递归。
- 实战场景：统计扩展名分布（配 `Counter`）、筛选并处理过期文件、自下而上清理空目录、批量改名（用 `os.replace` 更稳）。
- 原理上 `os.walk` 是一个返回可变 `dirnames` 的生成器，借助 `os.scandir` 高效读目录类型，用 `yield from` 把递归链接成内存恒定的产出流水线，并通过对同一个就地可变列表的索引访问实现"调用方反馈式剪枝"。
- 读完本文你应能掌握：正确解析三元组并拼接完整路径；按场景选 `topdown` 方向；用就地修改 `dirnames` 做剪枝跳过指定目录；用 `onerror` 容错且不中断遍历；安全处理符号链接防环；写出统计、筛选、清理、改名四类遍历脚本；并能说清剪枝为何只在自上而下时生效、为何必须就地修改而非重新赋值。