---
group:
  title: 【11】文件与路径操作
  order: 11
order: 7
title: pathlib面向对象路径
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 pathlib

`pathlib` 是 Python 3.4 引入的标准库模块，提供了一套**面向对象**的文件系统路径操作 API。在它出现之前，操作路径主要靠 `os.path` 模块里一串函数——`os.path.join`、`os.path.basename`、`os.path.exists`…… 每个"动作"都是一个独立函数，路径本身是一根普通的字符串。`pathlib` 的核心思想是：**把路径变成一个对象**，路径的"组成部分"是对象的属性，路径的"操作"是对象的方法。

举个直观的对比。拿到一个文件路径，想取它的扩展名再检查它存不存在：

```python
import os.path

p = "/home/user/project/main.py"
stem = os.path.splitext(os.path.basename(p))[0]   # 'main'
ext = os.path.splitext(p)[1]                        # '.py'
exists = os.path.exists(p)
```

```python
from pathlib import Path

p = Path("/home/user/project/main.py")
stem = p.stem        # 'main'
ext = p.suffix       # '.py'
exists = p.exists()
```

第二种写法的好处是：`p` 是个 `Path` 对象，它"知道自己是什么"——想取干名就 `.stem`、想取扩展名就 `.suffix`、想判断存在就 `.exists()`，不必再一层层套 `os.path.xxx` 函数。代码读起来更接近自然语言，也更不容易在"先 basename 还是先 splitext"这种调用顺序上犯错。

`pathlib` 内部分两条主线：**纯路径**（`PurePath` 及其子类 `PurePosixPath`、`PureWindowsPath`）只做字符串层面的路径计算，不碰磁盘，可以跨平台构造任意系统的路径；**具体路径**（`Path` 及其子类 `PosixPath`、`WindowsPath`）继承自纯路径，额外提供真正访问文件系统的方法（`exists`、`mkdir`、`read_text` 等）。

它在现代 Python 中的地位：官方文档明确推荐新代码优先使用 `pathlib` 而非 `os.path`。绝大多数原先需要 `os.path` 几个函数拼接才能完成的任务，`Path` 对象一两个属性或方法就能表达，而且更安全（路径拼接的 `/` 运算符会自动处理类型、避免拼接出非法路径）。

### 1.2 基本语法与最小用法

创建一个 `Path` 对象最简单的方式是 `Path(字符串)`：

```python
from pathlib import Path

p = Path("/home/user/project/main.py")
print(p)            # /home/user/project/main.py
print(type(p))      # <class 'pathlib.PosixPath'>  （在 Linux/macOS 上）
```

```text
# 输出：
/home/user/project/main.py
<class 'pathlib.PosixPath'>
```

在 Linux/macOS 上 `Path(...)` 返回 `PosixPath`，在 Windows 上返回 `WindowsPath`——具体子类由运行平台自动决定，你日常只写 `Path(...` 就够了。

**路径拼接用 `/` 运算符**，这是 `pathlib` 最有特色的设计：

```python
from pathlib import Path

base = Path("/home/user/project")
full = base / "src" / "main.py"
print(full)        # /home/user/project/src/main.py

# 也可以 / 字符串、/ 另一个 Path，混着来
config = base / "config" / Path("settings.json")
print(config)      # /home/user/project/config/settings.json
```

```text
# 输出：
/home/user/project/src/main.py
/home/user/project/config/settings.json
```

`/` 在这里被重新定义（重载了 `__truediv__`），它不是数学除法，而是"把两段路径拼起来"。相比 `os.path.join(a, b, c)`，`a / b / c` 更短、更直观，也更不容易写错参数顺序。而且 `/` 运算符会做类型检查——`Path(...) / 123` 会抛 `TypeError`，避免你意外把数字塞进路径里。

读取整个文件的内容用 `read_text`，一行搞定：

```python
from pathlib import Path

p = Path("/etc/hostname")
content = p.read_text(encoding="utf-8")
print(repr(content))
```

```text
# 输出示意：
'myhost\n'
```

`read_text` 等价于 `open(p, encoding="utf-8").read()` 后自动关闭文件，是读取配置、小文本文件的推荐写法。二进制用 `read_bytes`。

**适用场景**

当你需要对路径做拼接、分解、变换、判断、列举、读写时，`pathlib.Path` 几乎都是首选。特别是需要在不同平台运行、或路径逻辑较复杂（取各部分、换后缀、求相对路径）时，对象式 API 比 `os.path` 函数串清晰得多。

**常见误区**

有人以为 `Path` 对象会"实时反映"磁盘状态——比如删了文件后 `p.exists()` 应该变 `False`。这是对的，每次调用 `exists()` 都会真的去查磁盘;但反过来,`p` 不缓存磁盘信息,把它当成"文件本身"是误解——它本质上只是路径字符串加上一些方法,真正的读写还是要触发系统调用。

---

## 2. 核心内容

### 2.1 创建 Path 对象与 / 拼接

除了 `Path(字符串)`，还有几种常用创建方式。

`Path()` 不传参数得到"当前目录"的表示（一个空路径，`str` 起来是 `.`）:

```python
from pathlib import Path

print(Path())       # .
```

`Path()` 接受多段参数，等价于用 `/` 连起来:

```python
p = Path("usr", "local", "bin")
print(p)            # usr/local/bin
```

`Path.cwd()` 返回当前工作目录,`Path.home()` 返回当前用户家目录:

```python
print(Path.cwd())    # 例如 /Users/epro/zjh/ali-code/python-demo
print(Path.home())   # 例如 /Users/epro
```

`/` 拼接的细节:

第一,绝对路径会"吃掉"前面的相对部分。这跟 `os.path.join` 一致——一旦后半段是绝对路径,前半段就被废弃:

```python
p = Path("relative/dir") / "/absolute/path"
print(p)            # /absolute/path
```

```text
# 输出：
/absolute/path
```

第二,`/` 右边只接受 `str` 或 `os.PathLike` 对象,传别的会 `TypeError`:

```python
Path("a") / 123     # TypeError: unsupported operand type(s) for /: 'PosixPath' and 'int'
```

这种"类型严格"是 `pathlib` 相对 `os.path.join` 的一个安全优势——`os.path.join("a", 123)` 不会在拼接时报错,可能悄悄返回奇怪的结果或后续才崩。

第三,`joinpath` 方法是 `/` 的方法形式,接受多段,适合当你有一串名字列表要拼时:

```python
parts = ["src", "utils", "helper.py"]
p = Path("/project").joinpath(*parts)
print(p)            # /project/src/utils/helper.py
```

### 2.2 路径各部分访问

`Path` 对象把路径拆成一堆**只读属性**,让你像访问对象字段一样取路径的各部分。这是它最舒服的地方。

给定 `p = Path("/home/user/project/main.py")`:

| 属性 | 含义 | 值 |
|------|------|-----|
| `.name` | 最后一个组成部分（含扩展名） | `main.py` |
| `.stem` | 最后一部分的干名（去掉扩展名） | `main` |
| `.suffix` | 最后一部分的扩展名（含点） | `.py` |
| `.suffixes` | 多段扩展名列表 | `['.py']` |
| `.parent` | 父目录 | `/home/user/project` |
| `.parents` | 逐级父目录的可迭代序列 | `.../project`, `.../user`, `.../home`, `/` |
| `.anchor` | 路径的"锚点"（根盘符或 `/`） | `/` |
| `.parts` | 用元组形式给出各组成部分 | `('/', 'home', 'user', 'project', 'main.py')` |

演示:

```python
from pathlib import Path

p = Path("/home/user/project/main.py")

print("name   =", p.name)       # main.py
print("stem   =", p.stem)       # main
print("suffix =", p.suffix)     # .py
print("parent =", p.parent)     # /home/user/project

print("parents逐级:")
for ancestor in p.parents:
    print("  ", ancestor)
```

```text
# 输出：
name   = main.py
stem   = main
suffix = .py
parent = /home/user/project
parents逐级:
   /home/user/project
   /home/user
   /home
   /
```

`.parents` 是个很体贴的设计——以前用 `os.path.dirname` 想往上找多级父目录得反复套 `dirname(dirname(dirname(p)))`,现在一个 `for` 循环就出来了。常用于"从当前文件位置往上找到项目根目录":

```python
from pathlib import Path

# 假设本文件在 /project/src/utils/helper.py
# 想找到含 pyproject.toml 的祖先目录作为项目根
here = Path(__file__).resolve()
for ancestor in here.parents:
    if (ancestor / "pyproject.toml").exists():
        project_root = ancestor
        break
else:
    project_root = None
print("项目根:", project_root)
```

`.suffixes` 当文件名有多段扩展名时有用,比如 `archive.tar.gz`:

```python
p = Path("archive.tar.gz")
print(p.suffix)      # .gz（只取最后一段）
print(p.suffixes)    # ['.tar', '.gz']（所有点分段）
print(p.stem)        # archive.tar（去掉最后一层扩展）
```

```text
# 输出：
.gz
['.tar', '.gz']
archive.tar
```

### 2.3 路径判断与信息获取

具体路径 `Path` 提供一类"查询文件系统"的方法,返回布尔值或信息。这些方法每次调用都会真的访问磁盘,不缓存:

| 方法 | 作用 |
|------|------|
| `.exists()` | 路径是否存在 |
| `.is_file()` | 是否是普通文件 |
| `.is_dir()` | 是否是目录 |
| `.is_symlink()` | 是否是符号链接 |
| `.stat()` | 返回 `os.stat_result`,含大小/时间等 |
| `.lstat()` | 同上但不跟随符号链接（查链接本身） |
| `.is_socket()` / `.is_fifo()` / `.is_block_device()` 等 | 判断特殊文件类型 |

```python
from pathlib import Path

p = Path("/etc/hosts")
print("存在:", p.exists())        # True
print("是文件:", p.is_file())     # True
print("是目录:", p.is_dir())      # False

info = p.stat()
print("大小:", info.st_size, "字节")
print("修改时间:", info.st_mtime)
```

```text
# 输出示意：
存在: True
是文件: True
是目录: False
大小: 736 字节
修改时间: 1690000000.0
```

一个常见的注意点:`is_file()` 和 `is_dir()` **会跟随符号链接**——如果一个符号链接指向某文件,`link.is_file()` 返回 `True`(因为跟随过去确实是文件)。如果想判断"这个东西本身是不是链接",用 `is_symlink()`;想判断链接指向的目标是否存在而不被断链误导,用 `exists()`(它也跟随链接,断链返回 `False`)。

`exists()` 与 `is_file()`/`is_dir()` 的搭配场景:

```python
from pathlib import Path

def classify(path_str):
    p = Path(path_str)
    if not p.exists():
        return "不存在"
    if p.is_dir():
        return "目录"
    if p.is_file():
        return "文件"
    return "其它"

print(classify("/etc"))         # 目录
print(classify("/etc/hosts"))   # 文件
print(classify("/no/such/path"))# 不存在
```

```text
# 输出：
目录
文件
不存在
```

注意先判 `exists` 再判 `is_dir`/`is_file` 是稳妥的做法——对于一个被并发删掉的东西,`exists` 可能返回 `False` 但紧接着 `is_file` 又被调用;没有"`exists` 通过就一定安全"的保证(经典 TOCTOU),但日常脚本里这样写足够清晰。

### 2.4 路径变换:resolve / absolute / relative_to / with_xxx

这类方法产出"基于当前路径的新路径",不修改原对象（`Path` 是不可变的）。

`.resolve()` 把路径**绝对化并解析所有符号链接**,返回规范化的绝对路径。常用于把 `..`、`.`、软链接都展开,得到"真实位置":

```python
from pathlib import Path

p = Path("../project/./src/../src/main.py")
print("原始   :", p)
print("resolve:", p.resolve())
```

```text
# 输出（假设当前工作目录是 /Users/epro/zjh）：
原始   : ../project/./src/../src/main.py
resolve: /Users/epro/zjh/project/src/main.py
```

`.absolute()` 类似 `resolve`,但**只加绝对前缀、不解符号链接、不消 `..`**,更快:

```python
p = Path("src/main.py")
print(p.absolute())       # /Users/epro/.../src/main.py（不解 .. ，但这里没有）
p2 = Path("../main.py")
print(p2.absolute())      # /Users/epro/.../src/../main.py （仍保留 ..）
print(p2.resolve())       # /Users/epro/.../main.py （消掉 ..）
```

`.relative_to(walkable)` 求相对路径——给出"相对于某个基目录"的表示:

```python
from pathlib import Path

base = Path("/home/user/project")
file = Path("/home/user/project/src/main.py")
print(file.relative_to(base))    # src/main.py
```

```text
# 输出：
src/main.py
```

`.relative_to` 要求参数确实是当前路径的祖先前缀,否则抛 `ValueError`:

```python
Path("/a/b/c").relative_to("/a/x")   # ValueError: '/a/b/c' does not start with '/a/x'
```

从 Python 3.12 起,`relative_to` 增加了 `walk_down` 参数,允许"向下"求相对（即结果可能以 `..` 开头）；旧版本想做跨目录相对路径得用 `os.path.relpath`:

```python
import os.path
print(os.path.relpath("/a/b/c", "/a/x"))   # ../b/c
```

`.with_name(new_name)` 换最后一部分的名字(保留父目录,换掉 `name`),`.with_suffix(new_suffix)` 换扩展名:

```python
from pathlib import Path

p = Path("/project/src/main.py")

print(p.with_name("app.py"))          # /project/src/app.py
print(p.with_suffix(".pyc"))          # /project/src/main.pyc
print(p.with_suffix(""))              # /project/src/main （去掉扩展名）
print(p.with_name("app.py").with_suffix(".txt"))  # /project/src/app.txt
```

```text
# 输出：
/project/src/app.py
/project/src/main.pyc
/project/src/main
/project/src/app.txt
```

`with_suffix("")` 去扩展名这种用法要注意:如果原路径没有扩展名会抛 `ValueError`;日常想去扩展名更常用 `p.with_suffix("")` 不如 `p.parent / p.stem` 直观稳妥。

`with_name` 不能作用在根路径上(`Path("/").with_name("x")` 报错),因为根没有"名字"可换。

### 2.5 目录与文件操作

`Path` 把 `os` 和 `os.path` 里的文件系统操作方法都收编了,语义一致但写法是对象式的:

| 方法 | 对应旧 API | 作用 |
|------|-----------|------|
| `.mkdir(mode, parents, exist_ok)` | `os.mkdir`/`os.makedirs` | 创建目录 |
| `.rmdir()` | `os.rmdir` | 删除空目录 |
| `.unlink(missing_ok)` | `os.remove`/`os.unlink` | 删除文件 |
| `.rename(target)` | `os.rename` | 改名/移动 |
| `.replace(target)` | `os.replace` | 原子改名(目标存在则覆盖) |
| `.touch(mode, exist_ok)` | —— | 创建空文件 / 更新时间戳 |
| `.chmod(mode)` | `os.chmod` | 改权限 |
| `.hardlink_to(target)` | `os.link` | 创建硬链接 |
| `.symlink_to(target)` | `os.symlink` | 创建符号链接 |

`.mkdir` 的 `parents` 和 `exist_ok` 把旧时 `os.makedirs(path, exist_ok=True)` 直接做进了方法,语义清晰:

```python
from pathlib import Path

# 创建多级目录,已存在不报错
p = Path("workspace/cache/tmp/runs")
p.mkdir(parents=True, exist_ok=True)
print(p.exists())      # True

# 不设 parents 时,父目录不存在会抛 FileNotFoundError
try:
    Path("a/b/c").mkdir()
except FileNotFoundError as e:
    print("缺父目录:", e)

# exist_ok=False(默认)时目录已存在会抛 FileExistsError
try:
    p.mkdir(exist_ok=False)
except FileExistsError as e:
    print("已存在:", e)
```

```text
# 输出示意：
True
缺父目录: [Errno 2] No such file or directory: 'a/b/c'
已存在: [Errno 17] File exists: 'workspace/cache/tmp/runs'
```

删文件用 `unlink`,`missing_ok=True` 让"不存在不报错",这是 Python 3.8 新增,省去手写 `if p.exists()` 判断:

```python
from pathlib import Path

p = Path("workspace/cache/tmp/runs/old.log")
p.unlink(missing_ok=True)    # 文件不在也不抛 FileNotFoundError
```

`replace` 用于原子性改名/覆盖,跨平台比 `rename` 稳:

```python
from pathlib import Path

# 写临时文件,完成后原子替换为正式文件——避免读到写一半的半成品
tmp = Path("config.json.tmp")
tmp.write_text('{"version": 2}', encoding="utf-8")
tmp.replace("config.json")   # 等价于把 tmp 改名为 config.json,目标存在则覆盖
print(Path("config.json").read_text(encoding="utf-8"))
```

```text
# 输出：
{"version": 2}
```

### 2.6 列举目录:iterdir / glob / rglob / walk

这一组方法用来列出目录里的内容,是 `os.listdir`、`glob.glob`、`os.walk` 的对象式替代。

`.iterdir()` 列出当前目录的直接子项(`Path` 对象),不递归,顺序不保证:

```python
from pathlib import Path

for child in Path("/etc").iterdir():
    if child.is_file():
        print("文件:", child.name)
```

```text
# 输出示意：
文件: hosts
文件: passwd
文件: group
```

`.glob(pattern)` 按通配符在本目录及内部匹配,`**` 表示任意层级递归:

```python
from pathlib import Path

# 列出 project 下所有直接 .py 文件
for f in Path("project").glob("*.py"):
    print(f)

# ** 表示任意深度的子目录,实现递归
for f in Path("project").glob("**/*.py"):
    print(f)
```

`.rglob(pattern)` 相当于 `glob("**/" + pattern)`,直接递归:

```python
from pathlib import Path

# 递归找出项目里所有 .py 文件
for f in Path("project").rglob("*.py"):
    print(f)
```

```text
# 输出示意：
project/main.py
project/src/utils/helper.py
project/tests/test_helper.py
```

`.walk(top_down, on_error, follow_symlinks)` 是 Python 3.12 新增,提供与 `os.walk` 一致的目录树遍历,但产出的子目录名和文件名是 `Path` 对象,而且**支持就地剪枝**(改 `dirnames` 列表),补齐了 `rglob` 不能复杂剪枝的短板:

```python
from pathlib import Path

# 跳过 .git 和 __pycache__
for dirpath, dirnames, filenames in Path("project").walk():
    dirnames[:] = [d for d in dirnames if d.name not in (".git", "__pycache__")]
    for f in filenames:
        if f.suffix == ".py":
            print(dirpath / f)
```

注意 `rglob` / `glob` 不能像 `os.walk` 那样在遍历中动态剪枝,它们是一次性匹配完。当你需要"按目录名跳过整棵子树"时,优先用 `Path.walk()`(3.12+)或回退到 `os.walk`。

`glob` 通配符说明:`*` 匹配任意非分隔符字符,`?` 匹配单个字符,`[seq]` 匹配字符集,`**` 递归任意层。从 3.13 起 `glob` 还支持 `recursion` 参数控制是否递归,以及 `case_sensitive` 参数。

### 2.7 读写便捷方法

`Path` 提供"一次性读/写整个文件"的便捷方法,内部自动开关文件:

| 方法 | 作用 |
|------|------|
| `.read_text(encoding, errors, newline)` | 读全部内容为字符串 |
| `.write_text(data, encoding, errors, newline)` | 写字符串,覆盖 |
| `.read_bytes()` | 读全部为字节 |
| `.write_bytes(data)` | 写字节,覆盖 |
| `.open(mode, ...)` | 返回普通文件对象,需要更细控制时用 |

```python
from pathlib import Path

# 写配置
Path("config.txt").write_text("host=localhost\nport=8080\n", encoding="utf-8")

# 读回来
text = Path("config.txt").read_text(encoding="utf-8")
print(text)
```

```text
# 输出：
host=localhost
port=8080
```

二进制场景，比如读写一张图片:

```python
from pathlib import Path

data = Path("logo.png").read_bytes()
print(f"图片大小: {len(data)} 字节, 前几字节: {data[:8]}")
```

几个要点:

第一,`write_text` 是**覆盖**写——目标存在会被截断重写,不是追加。要追加得用 `.open("a")`。

第二,`write_text` / `write_bytes` 会返回写入的字符数 / 字节数,这不是文件大小（文本模式字符数≠字节数）,需要注意。

第三,这些便捷方法只适合"小文件整体读写"。大文件还是要用 `.open()` 分块读或逐行读,避免一次性吃进内存:

```python
from pathlib import Path

# 逐行处理大日志,不一次性 read_text
with Path("huge.log").open(encoding="utf-8") as f:
    for line in f:
        if "ERROR" in line:
            print(line.rstrip())
```

`.open()` 的参数和内置 `open` 完全一致（mode、encoding、errors 等）,本系列第一篇已详述,这里只是强调 `Path` 对象可以直接当 `open` 的参数(它实现了 `os.PathLike` 协议)。

### 2.8 PurePath 与跨平台路径

`PurePath` 及其子类 `PurePosixPath`、`PureWindowsPath` 是"纯路径"——只做字符串路径计算,不访问文件系统,因此**可以在任何平台上构造任意系统的路径**。

在 Linux 上构造一个 Windows 路径:

```python
from pathlib import PureWindowsPath

wp = PureWindowsPath("C:/Users/admin/Documents/report.docx")
print(wp.drive)       # C:
print(wp.root)        # \
print(wp.anchor)      # C:\
print(wp.parts)       # ('C:\\', 'Users', 'admin', 'Documents', 'report.docx')
print(wp.parent)      # C:\Users\admin\Documents
```

```text
# 输出（在 Linux/macOS 上运行）：
C:
\
C:\
('C:\\', 'Users', 'admin', 'Documents', 'report.docx')
C:\Users\admin\Documents
```

`PurePath` 多出来的属性 `.drive`(盘符)和 `.root`(根)在具体 `Path` 上也有,只是 POSIX 系统上 `drive` 恒为空、`root` 是 `/`。

`PurePath` 的价值在于"路径分析"场景——比如解析用户提供的路径字符串、做跨平台路径转换、单元测试里不碰磁盘地验证路径拼接逻辑:

```python
from pathlib import PurePosixPath, PureWindowsPath

# 把 Windows 风格路径转成 POSIX 风格
win = PureWindowsPath(r"C:\project\src\main.py")
parts = win.parts[2:]    # 去掉 'C:\'
posix = PurePosixPath(*parts)   # 重新拼
print(posix)            # project/src/main.py
```

`PurePath` 没 `exists`、`read_text` 等方法,因为那些需要文件系统；想既分析又能访问,用对应平台的具体 `Path` 即可。

### 2.9 与 os.path 的对比与迁移

下表把常见 `os.path` / `os` 操作和 `Path` 对应方法对齐,方便迁移:

| 旧 API | pathlib 等价 |
|--------|-------------|
| `os.path.join(a, b)` | `Path(a) / b` |
| `os.path.exists(p)` | `Path(p).exists()` |
| `os.path.isfile(p)` | `Path(p).is_file()` |
| `os.path.isdir(p)` | `Path(p).is_dir()` |
| `os.path.basename(p)` | `Path(p).name` |
| `os.path.dirname(p)` | `Path(p).parent` |
| `os.path.splitext(p)` | `(Path(p).stem, Path(p).suffix)` |
| `os.path.abspath(p)` | `Path(p).resolve()` 或 `Path(p).absolute()` |
| `os.path.realpath(p)` | `Path(p).resolve()` |
| `os.path.getsize(p)` | `Path(p).stat().st_size` |
| `os.path.getmtime(p)` | `Path(p).stat().st_mtime` |
| `os.getcwd()` | `Path.cwd()` |
| `os.mkdir(p)` / `os.makedirs(p)` | `Path(p).mkdir(parents=True)` |
| `os.remove(p)` | `Path(p).unlink()` |
| `os.listdir(p)` | `Path(p).iterdir()` |
| `glob.glob(pattern)` | `Path().glob(pattern)` |
| `os.walk(p)` | `Path(p).walk()` (3.12+)|

迁移建议:

第一,新代码一律用 `pathlib`,字符串路径只在边界(对接外部库要求 `str` 时)用 `str(p)` 转出。绝大多数现代库都接受 `os.PathLike`,不必预先转字符串。

第二,不必一次性大规模重写。可以在新增函数、重构老函数时,把签名里的路径参数从 `str` 换成 `Path`,内部逐步替换。

第三,`Path` 和 `os.path` 可以混用——`Path(p).stat()` 拿到的 `os.stat_result` 和 `os.stat(p)` 一样,二者不存在隔离。

一个迁移对照实例,改写一段"找最大文件"的脚本:

```python
# 旧 os.path 版
import os
def largest_file_old(root):
    best, best_size = None, -1
    for dp, _, fns in os.walk(root):
        for f in fns:
            full = os.path.join(dp, f)
            s = os.path.getsize(full)
            if s > best_size:
                best, best_size = full, s
    return best, best_size
```

```python
# pathlib 版
from pathlib import Path
def largest_file_new(root):
    best, best_size = None, -1
    for dirpath, _, filenames in Path(root).walk():
        dirnames_keeped = []  # 这里仅演示,实际可剪枝
        for f in filenames:
            full = dirpath / f
            try:
                s = full.stat().st_size
            except OSError:
                continue
            if s > best_size:
                best, best_size = full, s
    return best, best_size
```

**常见搭配 / 进阶用法**

`pathlib` 在实际项目里常与这些搭配:

- 与 `shutil` 搭配做复制/移动:`shutil.copy2(Path("a"), Path("b"))`——`shutil` 接受 `PathLike`。
- 与 `json` / `tomllib` 读写:`json.loads(Path("config.json").read_text(encoding="utf-8"))`。
- 当作 `open` 的参数:`with Path("data.txt").open(encoding="utf-8") as f: ...`。
- 用 `Path` 做"项目根"的统一入口,后续所有路径都从 `Path(__file__).resolve().parent` 推导,避免散落的相对路径。

---

## 3. 最佳实践

### 3.1 用 / 拼接，别用字符串加法

```python
# 推荐
full = base / "src" / "main.py"

# 不推荐
full = str(base) + "/" + "src/main.py"
full = f"{base}/src/main.py"
```

**原因**:`/` 运算符跨平台自动选用正确分隔符、做类型检查、处理 Path 和 str 混用;字符串拼接硬编码 `/` 在 Windows 上出错,且不校验类型。当拼接片段里混着 Path 和字符串常量时,`/` 也比 `os.path.join(a,b,c)` 读起来更轻。

### 3.2 resolve 与 absolute 各有用处，别混用

```python
# 推荐：需要规范绝对路径(消 .. 、解链接)时用 resolve
real = Path("../a/b").resolve()

# 推荐：只要绝对前缀、不碰链接、追求快，用 absolute
abs_p = Path("a/b").absolute()
```

**原因**:`resolve()` 要访问文件系统解析符号链接,开销大;`absolute()` 只在前面拼上当前目录,不碰磁盘,快得多。当你只是想把相对路径变绝对用于显示、而不需要"真实物理位置"时,用 `absolute` 够了;需要消除 `..` / 解软链接时才上 `resolve`。误用 `resolve` 在大量路径上会显著变慢。

### 3.3 全量读写用便捷方法，大文件用 open

```python
# 推荐：小文件
text = Path("config.json").read_text(encoding="utf-8")
Path("out.txt").write_text(content, encoding="utf-8")

# 推荐：大文件
with Path("big.log").open(encoding="utf-8") as f:
    for line in f:
        process(line)
```

**原因**:`read_text` / `write_text` 一次性把整个文件读进内存或写出去,对几 MB 的配置很合适,对几 GB 的日志就会吃光内存。`open` 配合逐行迭代才是大文件的正确打开方式。判断标准不明确时,"文件可能很大"就用 `open`。

### 3.4 unlink 用 missing_ok，省掉 exists 判断

```python
# 推荐(3.8+)
Path(target).unlink(missing_ok=True)

# 不推荐：手工存在判断，存在 TOCTOU 竞态
p = Path(target)
if p.exists():
    p.unlink()
```

**原因**:`if p.exists(): p.unlink()` 两次调磁盘之间存在竞态(检查通过后文件被删,`unlink` 又报错)。`missing_ok=True` 把"不存在视为成功"内建,逻辑更简洁也更接近原子意图。对应的,目录删除 `rmdir` 没有这个参数且必须空,删非空目录用 `shutil.rmtree`。

### 3.5 原子写用临时文件 + replace

```python
from pathlib import Path

# 推荐：先写临时文件，再原子替换，避免读到写一半的内容
target = Path("data.json")
tmp = target.with_suffix(".json.tmp")
tmp.write_text(payload, encoding="utf-8")
tmp.replace(target)
```

**原因**:直接 `target.write_text(...)` 如果中途崩溃(断电、异常),会留下写了一半的损坏文件,别的进程读到就是错的。先写临时文件再 `replace`(操作系统层面通常是原子 rename),要么旧文件完整、要么新文件完整,不会出现中间态。这是写配置、持久化状态的通用模式。

### 3.6 遍历需要剪枝优先 walk，简单匹配用 rglob

```python
# 推荐：要跳过 .git / __pycache__ 整棵子树
for dirpath, dirnames, fnames in Path("project").walk():
    dirnames[:] = [d for d in dirnames if d.name not in (".git", "__pycache__")]
    ...

# 推荐：只递归找某类文件，无复杂剪枝
for f in Path("project").rglob("*.py"):
    print(f)
```

**原因**:`rglob` / `glob` 写法简洁,但不支持遍历中剪枝,会把 `node_modules`、`.git` 这种巨型子目录也全量匹配，性能差。`walk`(3.12+)支持就地改 `dirnames` 剪枝,语义和 `os.walk` 一致。低版本回退 `os.walk`。简单需求不要过度用 walk,代码会变啰嗦。

### 3.7 函数参数类型用 Path 而非 str

```python
# 推荐
def load_config(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))

# 不推荐
def load_config(path: str) -> dict:
    return json.loads(Path(path).read_text(encoding="utf-8"))
```

**原因**:把参数标注成 `Path`,调用方传 `str` 时仍可用(`Path` 接受 `PathLike`,且很多库会自动转换),但能从类型上提醒"这里期望的是路径对象",推动整个代码库统一到 `Path` 风格。配合 `PathLike` 入口转换(`Path(path)`),既兼容字符串输入,又统一内部表示。

---

## 4. 原理

### 4.1 PurePath 与 Path 的继承关系

`pathlib` 的类层级是:

```
PurePath
├── PurePosixPath
└── PureWindowsPath
Path(PurePath)
├── PosixPath(PurePosixPath, Path)
└── WindowsPath(PureWindowsPath, Path)
```

也就是说,`Path` 继承自 `PurePath`,`PosixPath` 既是个 `Path` 又是个 `PurePosixPath`。这个设计的关键意图:**把"纯路径计算"和"文件系统访问"两层职责分开**。

`PurePath` 只含字符串层面的路径处理:拼接、分解、变换、比较、匹配——这些操作不需要碰磁盘,纯数学计算,因此在任何平台上都能针对任意系统的路径工作。`Path` 在此之上增加了一组需要文件系统的方法:`exists`、`stat`、`mkdir`、`read_text` 等。这些方法底层委托给 `os` 模块的系统调用。

为什么 `PosixPath` 不能在 Windows 上实例化(反之亦然)?因为 `Path` 的具体子类绑定了运行平台的真实文件系统语义——`PosixPath` 假设 POSIX 权限模型和分隔符,`WindowsPath` 假设盘符和反斜杠。在错平台上实例化具体 `Path` 会在 `__init__` 里直接抛 `NotImplementedError`。而 `PurePosixPath` / `PureWindowsPath` 因为不碰磁盘,可以在任意平台自由实例化,这正是"纯"的含义。

`Path(...)` 这一工厂调用本身会根据 `os.name` 选择返回 `PosixPath` 还是 `WindowsPath`,所以你日常只写 `Path(...)` 就自动拿到了对的子类。

### 4.2 为什么 / 能拼接路径：__truediv__ 运算符重载

`Path` 之所以能用 `/` 做路径拼接,是因为 `PurePath` 重载了 `__truediv__` 方法(Python 里 `/` 运算符对应 `__truediv__`):

```python
class PurePath:
    def __truediv__(self, key):
        return self.__class__(self, key)
    __rtruediv__ = __truediv__
```

大致就是这样——把 `/` 定义成"以自身和右操作数为参数,构造一个同类新对象"。`__class__(self, key)` 调用 `Path` 的构造器,而 `Path` 构造器接受多段路径参数并把它们连起来,所以 `a / b` 等价于 `Path(a, b)`,即 `Path(str(a), str(b))` 的拼接结果。

`__rtruediv__` 也指向同一函数,是为了支持 `str / Path` 这种左操作数是字符串的情况(`"base" / Path("sub")`),让反向调度也走同一逻辑。

类型检查藏在构造器里:`Path(self, key)` 里 `key` 必须是 `str` 或 `PathLike`,否则抛 `TypeError`。这就解释了为什么 `Path("a") / 123` 会报错——不是 `/` 报的,是构造器在解析参数时发现 `int` 不是合法路径段。

这种"用运算符重载打造 DSL"是 Python 面向对象能力的体现:把一个领域概念(路径拼接)映射到一个直观符号(`/`),让代码读起来像领域语言。代价是不熟悉的人第一次看 `a / b` 不一定能想到是路径,所以不少团队在风格上要求只对 `Path` 对象用 `/`,不用 `str / str`,以减少误读。

### 4.3 为什么推荐 pathlib 而非 os.path

官方推荐 `pathlib` 的理由分布在几个层面:

**一致性**。`os.path` 是函数集合,路径是字符串,操作是独立函数;`Path` 把路径及其操作收进一个对象,数据和行为绑定,调用形式统一(`p.method()`),不会出现"先 basename 还是先 splitext"的顺序迷惑。

**安全性**。`Path` 的拼接做类型检查(`/` 只接 `str`/`PathLike`),`os.path.join(a, 123)` 会悄悄返回奇怪结果或延迟报错;`Path` 的不可变性也让路径不会被意外修改。

**表达力**。`Path` 一条链式调用 `p.parent.with_suffix(".bak")` 能表达 `os.path` 三四个函数组合,可读性更高;`rglob` / `glob` 把通配符匹配做成对象方法,与 `iterdir` 统一。

**现代特性**。`Path` 实现了 `os.PathLike` 协议(`__fspath__`),能被 `open`、`shutil`、`json` 等所有支持 `PathLike` 的标准库直接接受,不需要手动 `str(p)`。

**跨平台**。`Path` 自动选 `PosixPath`/`WindowsPath`,分隔符由对象内部处理,代码无需写 `os.sep`。

当然 `os.path` 不会被废弃——它是更底层的字符串 API,性能敏感或需要极细控制时仍有用;大量历史代码也依赖它。新项目优先 `pathlib` 是发展方向,不代表 `os.path` 错。

### 4.4 glob / rglob 的底层与递归实现

`Path.glob(pattern)` 底层用的是 `pathlib._normal_accessor` 提供的 `scandir`,逐目录匹配通配符。关键在 `**` 的处理:`**` 在 pattern 里被识别为"递归任意层"标记,内部展开为对每个子目录的深度遍历。

简化逻辑是:

```python
def _recursive_glob(self, pattern):
    # 把 pattern 里的 ** 展开成对每层子目录的递归匹配
    for dirpath in self.walk_like_iterator():
        for match in match_pattern(dirpath, pattern_without_stars):
            yield match
```

`rglob(pattern)` 等价于 `glob("**/" + pattern)`,所以 `rglob("*.py")` 会从当前目录起,逐层下钻,匹配每一层里所有 `.py` 文件。

`glob` / `rglob` 不支持遍历中剪枝的原因就在这里:它们是一次性把匹配结果算完再逐个 `yield`,没有"访问一个父目录后暂停、让调用方决定要不要进子目录"的交互点。这与 `os.walk`/`Path.walk` 的生成器+可变 `dirnames` 模式本质不同。所以需要剪枝时,`Path.walk`(3.12+)或 `os.walk` 才是正确选择。

`glob` 的匹配用的是 `fnmatch` 的规则（大小写敏感性在 POSIX 上默认敏感、在 Windows 上默认不敏感，3.13 起可用 `case_sensitive` 参数显式指定）。`*` 不跨 `/`,所以 `Path("a").glob("*")` 不会匹配 `a/b/c`,要跨层得用 `**`。

### 4.5 PathLike 协议

`Path` 能被 `open`、`shutil.copy`、`os.path.exists` 等几乎所有标准库直接接受,靠的是 `os.PathLike` 协议。这个协议(PEP 519)只要求一个方法:

```python
class PathLike:
    def __fspath__(self) -> str: ...
```

任何实现了 `__fspath__` 的对象都能被当作路径。`PurePath` 实现了 `__fspath__`,返回路径的字符串形式。当 `open(p)` 发现 `p` 不是 `str` 时,会调用 `os.fspath(p)`,后者检测到 `p` 是 `PathLike` 就调 `p.__fspath__()` 拿到字符串,再用它打开文件。

这个协议让"路径对象"成为全标准库统一接受的一类参数,`Path`、`os.DirEntry`、第三方路径库只要实现 `__fspath__` 就能互通。你 `str(p)` 转 Path 为字符串的需求几乎只出现在对接不接受 `PathLike` 的老库时;现代代码应直接传 `Path` 对象。

---

## 5. 总结

- `pathlib` 提供面向对象的路径 API,把路径变成 `Path` 对象:组成部分是属性(`.name`/`.stem`/`.suffix`/`.parent`/`.parents`/`.parts`/`.anchor`),操作是方法(`.exists()`/`.stat()`/`.mkdir()`...)。
- 用 `/` 运算符或 `.joinpath()` 拼接路径,跨平台自动处理分隔符并做类型校验;`Path.cwd()`/`Path.home()` 是常用入口。
- 路径变换:`.resolve()` 规范绝对并解链接、`.absolute()` 仅加绝对前缀、`.relative_to()` 求相对、`.with_name()`/`.with_suffix()` 换名/换扩展名,均返回新对象,原对象不可变。
- 文件系统操作:`.mkdir(parents, exist_ok)`、`.unlink(missing_ok)`、`.replace()`(原子改名)、`.touch()` 等,语义与 `os` 对应函数一致但更整洁。
- 列举目录:`.iterdir()` 列直接子项、`.glob()`/`.rglob()` 通配符匹配、`.walk()`(3.12+)支持就地剪枝。
- 读写便捷:`.read_text/bytes`、`.write_text/bytes` 适合小文件整体读写,大文件用 `.open()` 逐行。
- `PurePath`/`PurePosixPath`/`PureWindowsPath` 是纯路径,不碰磁盘,可跨平台分析任意系统路径;具体 `Path` 在其上加文件系统访问。
- 常与 `shutil`、`json`、`open` 搭配;`Path` 实现 `os.PathLike`(`__fspath__`),被标准库普遍接受,极少需要手动 `str(p)`。
- 原理上 `Path` 继承 `PurePath` 拆分"纯计算/文件系统"两层;`/` 来自 `__truediv__` 重载;`PathLike` 协议让路径对象全标准库互通;`glob`/`rglob` 一次性匹配无法剪枝,需剪枝用 `walk`/`os.walk`。
- 读完本文你应能掌握:用 `Path` 创建/拼接/分解路径;按场景选 `resolve` vs `absolute`、`read_text` vs `open`;用 `walk` 剪枝遍历、用 `rglob` 简单匹配;安全地原子写(`tmp + replace`)、容错删(`unlink(missing_ok)`);把 `os.path` 老代码迁移到 `pathlib`;并说清 `/` 为何能拼接、`Path` 为何能直接传给 `open`。