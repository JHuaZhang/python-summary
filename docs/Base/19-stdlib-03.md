---
group:
  title: 【19】标准库精讲
  order: 19
order: 3
title: pathlib 路径拼接与文件属性
nav:
  title: Python
  order: 1
---

## 1. 介绍

### 1.1 什么是 pathlib（聚焦拼接与属性视角）

`pathlib` 是 Python 3.4 引入的标准库模块，用面向对象的方式操作文件系统路径。在它出现之前，路径处理主要依赖 `os.path`（一堆以字符串为参数的函数）和 `os`（系统调用封装）。`pathlib` 把"一条路径"抽象成一个 `Path` 对象，路径的拼接、分解、查询、变换都变成对象上的方法或运算，代码可读性和跨平台安全性都显著提升。

本篇是「标准库精讲」系列视角，聚焦两个最常用、也最容易踩坑的方向：

- **路径拼接**：如何用 `/` 运算符、`joinpath` 安全地把多段拼成一条路径，不再手写分隔符。
- **文件属性查询**：如何用 `stat()`、`exists()`、`is_file()` 等方法获取文件大小、修改时间、权限等信息，以及如何用 `resolve()` 把路径规范化。

> 关于本篇与项目内其他笔记的关系：本项目【11】文件与路径操作/【07】pathlib 面向对象路径 有一篇 pathlib 全面篇，覆盖了读写、遍历、创建删除、glob 匹配等全量用法。本篇不重复那些内容，而是把"拼接 + 文件属性"这一专题拆出来精讲，把交叉平台分隔符、`/` 运算符重载、`stat_result` 各字段含义、`resolve` 与 `absolute` 的区别等细节讲透。两篇互补：要查 pathlib 全貌看【11】07，要把路径拼接和属性查询用扎实看本篇。

### 1.2 基本语法与最小用法

最小的用法只有三步：构造一个 `Path` 对象、拼接子路径、查询属性。

```python
from pathlib import Path

# 构造：传入一个字符串路径
p = Path("/Users/epro/projects/demo/app.log")

# 拼接：用 / 运算符追加子路径
log_dir = Path("/Users/epro/projects/demo") / "logs" / "2026-07"

# 查询：判断是否存在、取大小
print(log_dir.exists())        # 判断目录是否存在
print(p.stat().st_size if p.exists() else "不存在")  # 取文件字节数
# 输出：
# True  （假设目录存在）
# 2048  （假设日志文件存在且大小为 2048 字节）
```

关键点先记住一句话：**`Path` 对象一旦构造，所有后续操作都不再依赖手写字符串拼接**。分隔符交由对象处理，跨平台自动适配。下面各节展开。

## 2. 核心内容

### 2.1 路径拼接：/ 运算符

`/` 是 `Path` 上重载的运算符（对应 `__truediv__`），用于把当前路径与一段子路径拼接，返回一个新的 `Path` 对象，原对象不变。左侧操作数必须是 `Path`（或 `PurePath`），右侧可以是 `Path`、字符串。

为什么要用它替代 `os.path.join`？最直接的理由是可读性：`base / "src" / "main.py"` 比 `os.path.join(base, "src", "main.py")` 更接近"路径"的视觉直觉。更重要的是跨平台：`/` 运算符内部按当前系统的分隔符（POSIX 是 `/`，Windows 是 `\`）拼接，你永远不需要在代码里写 `"\\"` 或 `os.sep`。

```python
from pathlib import Path

base = Path("/srv/app")

# 逐级拼接，每一步返回新对象
config = base / "config" / "settings.toml"
print(config)
# 输出：/srv/app/config/settings.toml

# 链式拼接等价于一次性 joinpath
cache = base / "var" / "cache" / "session"
print(cache)
# 输出：/srv/app/var/cache/session

# 注意：左侧必须是 Path，右侧可以是字符串
# 下面这行会报错，因为 str / str 没有重载
# wrong = "srv" / "app" / "config"   # TypeError: unsupported operand type(s)
```

**拼接时含多余的斜杠或点**

`/` 运算符在拼接时会规范化多余的连续分隔符，但不会消解 `.`（当前目录）和 `..`（上级目录）这类语义成分——它们是路径逻辑的一部分，需要 `resolve()` 才能化简（见 2.6）。

```python
from pathlib import Path

# 右侧字符串带前导斜杠不会被当成"绝对路径覆盖"
# （在 POSIX 上 os.path.join 遇到绝对路径会丢弃左侧，Path 的 / 不会）
p = Path("/srv/app") / "/etc/hosts"
print(p)
# 输出：/srv/app/etc/hosts

# 多余分隔符被压平
q = Path("/srv/app/") / "config" / "settings.toml"
print(q)
# 输出：/srv/app/config/settings.toml

# . 和 .. 原样保留，不在这里消解
r = Path("/srv/app") / "./config" / "../logs/app.log"
print(r)
# 输出：/srv/app/config/../logs/app.log
```

上面 `p` 的行为值得强调：`os.path.join("/srv/app", "/etc/hosts")` 会返回 `/etc/hosts`（遇到绝对路径分段就丢弃前面），而 `Path` 的 `/` 运算符不会，它把右侧当成"子路径"追加。这是两者一个容易被忽略的区别，在拼接用户输入时要特别留意（见 3.6）。

### 2.2 路径拼接：joinpath

`joinpath(*pathsegments)` 是 `/` 运算符的函数式等价物，用于一次性拼接多段路径。当你拿到一个路径分段的列表/元组时，用 `joinpath` 比连续写 `/` 更顺手。

```python
from pathlib import Path

base = Path("/srv/app")

# 一次性拼接多段
log_path = base.joinpath("logs", "2026", "07", "app.log")
print(log_path)
# 输出：/srv/app/logs/2026/07/app.log

# 从列表解包拼接（分段来自运行时数据时常用）
parts = ["backups", "db", "dump.sql"]
backup = Path("/data").joinpath(*parts)
print(backup)
# 输出：/data/backups/db/dump.sql
```

**joinpath 与 / 的等价性与选择**

两者底层都调用 `PurePath._make_child`，行为完全一致，包括对前导斜杠、多余分隔符的处理。选择哪一个纯属可读性：

- 固定分段、书面表达路径层级 → 用 `/`，视觉上更像路径。
- 分段来自变量、列表、循环 → 用 `joinpath(*parts)`，避免写一连串 `/` 把代码撑得很长。

```python
from pathlib import Path

base = Path("/srv/app")

# 等价写法
a = base / "logs" / "2026" / "07" / "app.log"
b = base.joinpath("logs", "2026", "07", "app.log")
print(a == b)
# 输出：True
```

### 2.3 路径分解：parts

`Path.parts` 把一条路径按分隔符拆成一个元组，返回的是不可变元组，每一段都是字符串。它是理解路径结构的"底层视图"——所有分解属性（`parent`、`name` 等）本质上都是从 `parts` 派生的。

```python
from pathlib import Path

p = Path("/srv/app/logs/2026-07/app.log")
print(p.parts)
# 输出：('/', 'srv', 'app', 'logs', '2026-07', 'app.log')

# Windows 上的例子（仅供理解，本机为 POSIX）
# Path(r"C:\Users\epro\app.log").parts
# -> ('C:\\', 'Users', 'epro', 'app.log')

# 相对路径不含根
r = Path("src/main.py")
print(r.parts)
# 输出：('src', 'main.py')
```

`parts` 的第一个元素是根：POSIX 绝对路径以 `'/'` 开头，Windows 绝对路径以 `C:\\` 这类盘符根开头；相对路径没有根，第一个元素就是普通分段。

知道 `parts` 后，你可以用切片灵活取段，而不必背一堆方法。比如"取从根开始的前三层"：

```python
from pathlib import Path

p = Path("/srv/app/logs/2026-07/app.log")
# 前三层：根 + srv + app
top = Path(*p.parts[:3])
print(top)
# 输出：/srv/app
```

### 2.4 路径分解：parent 与 parents

`parent` 返回去掉最后一段后的父路径，是个新的 `Path` 对象。`parents` 是一个序列，按从近到远依次给出每一级父路径，支持索引和切片。

```python
from pathlib import Path

p = Path("/srv/app/logs/2026-07/app.log")

# 直接父目录
print(p.parent)
# 输出：/srv/app/logs/2026-07

# parents 序列：从近到远
for i, par in enumerate(p.parents):
    print(i, par)
# 输出：
# 0 /srv/app/logs/2026-07
# 1 /srv/app/logs
# 2 /srv/app
# 3 /srv
# 4 /

# 用索引直接取某一层
print(p.parents[2])
# 输出：/srv/app
```

**用 parents[0] 与 parent 的等价性**

`p.parents[0]` 与 `p.parent` 永远相等。`parents` 的好处是可以用切片拿到一个范围，比如"从当前文件向上直到项目根的所有目录"：

```python
from pathlib import Path

p = Path("/srv/app/src/utils/io.py")
# 从父目录到根的所有上级
for par in p.parents:
    print(par)
# 输出：
# /srv/app/src/utils
# /srv/app/src
# /srv/app
# /srv
# /
```

一个常见场景是"向上查找某个标志文件"（如定位 Git 仓库根），会用到 `parents` 遍历：

```python
from pathlib import Path

def find_git_root(start: Path) -> Path | None:
    """从 start 向上查找第一个含 .git 的目录。"""
    for d in [start, *start.parents]:
        if (d / ".git").exists():
            return d
    return None

# 假设在 /srv/app/src/utils 下运行
current = Path("/srv/app/src/utils")
root = find_git_root(current)
print(root)
# 输出：/srv/app  （假设 /srv/app/.git 存在）
```

### 2.5 路径分解：name、suffix、suffixes、stem

这是分解文件名时最常用的一组属性：

- `name`：最后一段全名（含扩展名），等价于 `parts[-1]`。
- `suffix`：最后一个扩展名（含点），如 `.log`。没有扩展名时为空字符串。
- `suffixes`：所有扩展名列表，如 `file.tar.gz` → `['.tar', '.gz']`。
- `stem`：`name` 去掉最后一个扩展名的部分，如 `app.log` → `app`。

```python
from pathlib import Path

p = Path("/srv/app/logs/2026-07/app.log")
print(p.name)      # 文件全名
print(p.suffix)    # 最后一个扩展名
print(p.suffixes)  # 所有扩展名
print(p.stem)      # 去掉最后扩展名
# 输出：
# app.log
# .log
# ['.log']
# app

# 多重扩展名
arch = Path("backup.tar.gz")
print(arch.name, arch.suffix, arch.suffixes, arch.stem)
# 输出：backup.tar.gz .gz ['.tar', '.gz'] backup.tar

# 无扩展名
noext = Path("/srv/app/CHANGELOG")
print(noext.suffix, noext.stem)
# 输出：  CHANGELOG
```

注意 `stem` 只去掉最后一个扩展名，所以 `backup.tar.gz` 的 `stem` 是 `backup.tar`，不是 `backup`。如果你想去掉所有扩展名，要用 `name` 减去 `''.join(suffixes)`：

```python
from pathlib import Path

arch = Path("backup.tar.gz")
all_stripped = arch.name[: -len("".join(arch.suffixes))] if arch.suffixes else arch.name
print(all_stripped)
# 输出：backup
```

### 2.6 路径入口：Path.cwd() 与 Path.home()

这两个类方法返回两个最常见的"起点路径"，本身不涉及文件系统查询之外的 I/O：

- `Path.cwd()`：返回当前工作目录的绝对路径，等价于 `os.getcwd()`。
- `Path.home()`：返回当前用户主目录的绝对路径，等价于 `os.path.expanduser("~")`。

```python
from pathlib import Path

cwd = Path.cwd()
print(cwd)
# 输出：/Users/epro/projects/python-demo  （视实际工作目录而定）

home = Path.home()
print(home)
# 输出：/Users/epro  （视当前用户而定）

# 常见搭配：以家目录为起点拼配置文件
cfg = Path.home() / ".config" / "myapp" / "settings.toml"
print(cfg)
# 输出：/Users/epro/.config/myapp/settings.toml
```

**cwd 随进程改变而改变**

`Path.cwd()` 反映的是进程当前的工作目录，它会随 `os.chdir()` 改变。脚本启动时的 cwd 通常等于执行命令时所在的目录，不一定是脚本文件所在目录。如果你想得到"脚本本身所在目录"，应该用 `__file__`：

```python
from pathlib import Path

# 脚本文件所在目录（不受启动时 cwd 影响）
script_dir = Path(__file__).resolve().parent
print(script_dir)
# 输出：/Users/epro/projects/python-demo/scripts  （视实际位置而定）

# 与之对比，cwd 是启动目录
print(Path.cwd())
# 输出：/Users/epro/projects/python-demo  （你在哪个目录运行就在哪）
```

### 2.7 存在性与类型判断：exists / is_file / is_dir / is_symlink

这一组方法都返回布尔值，用于在操作文件前先确认它"是什么"或"在不在"：

- `exists()`：路径是否存在（文件、目录、符号链接指向的目标存在都算）。
- `is_file()`：是否为普通文件（跟随符号链接）。
- `is_dir()`：是否为目录（跟随符号链接）。
- `is_symlink()`：路径本身是否为符号链接（不跟随）。
- `is_socket()` / `is_fifo()` / `is_block_device()` / `is_char_device()`：特殊文件类型判断。

```python
from pathlib import Path

p = Path("/srv/app/logs/app.log")

if p.exists():
    print("存在")
    if p.is_file():
        print("是普通文件，大小", p.stat().st_size, "字节")
    elif p.is_dir():
        print("是目录")
else:
    print("不存在，将新建")
# 输出（假设文件存在）：
# 存在
# 是普通文件，大小 4096 字节
```

**exists 与 is_file/is_dir 的语义差异**

`exists()` 跟随符号链接：如果链接指向的目标存在，返回 `True`，即使链接本身是"断链"指向已删除文件，则返回 `False`。`is_symlink()` 不跟随，只看路径本身是不是链接。一个常见的判别组合：

```python
from pathlib import Path

p = Path("/srv/app/shortcut")

if p.is_symlink():
    target = p.resolve()
    print("是符号链接，指向", target)
    if p.exists():
        print("目标仍然存在")
    else:
        print("目标已失效（断链）")
elif p.exists():
    print("是普通路径，不是链接")
else:
    print("路径不存在")
# 输出（假设 shortcut 指向已删除的 app.log）：
# 是符号链接，指向 /srv/app/logs/app.log
# 目标已失效（断链）
```

**性能提示：避免先 exists 再操作**

很多教程会写 `if p.exists(): open(p)`，但这引入了 TOCTOU（time-of-check to time-of-use）竞态：检查与使用之间文件可能被删除或替换。更稳妥的做法是"直接操作并捕获异常"：

```python
from pathlib import Path

p = Path("/srv/app/data/config.json")

# 不推荐：存在竞态
# if p.exists():
#     data = p.read_text()

# 推荐：直接尝试，处理异常
try:
    data = p.read_text()
except FileNotFoundError:
    data = "{}"  # 默认值
```

### 2.8 文件属性：stat()

`Path.stat()` 返回一个 `os.stat_result` 对象，包含文件系统 inode 中存储的元数据。这是查询"文件多大、什么时候改过、权限是什么"的标准入口，底层调用 `os.stat`。

常用字段一览：

| 字段 | 含义 | 典型用途 |
|------|------|----------|
| `st_size` | 文件大小（字节） | 日志体积监控、下载进度 |
| `st_mtime` | 最后修改时间（时间戳） | 增量同步、过期判断 |
| `st_atime` | 最后访问时间（时间戳） | 冷热数据识别（受挂载选项影响） |
| `st_ctime` | 元数据最后更改时间（POSIX 为 inode 变更；Windows 为创建时间） | 审计、与 mtime 区分 |
| `st_mode` | 权限与类型位 | 权限校验、是否可执行 |
| `st_ino` / `st_dev` | inode 号 / 设备号 | 去重、硬链接识别 |
| `st_nlink` | 硬链接数 | 判断是否有其他名字 |
| `st_uid` / `st_gid` | 所有者 / 所属组 ID | 权限归属 |

```python
from pathlib import Path
import time

p = Path("/srv/app/logs/app.log")
st = p.stat()

print("大小（字节）:", st.st_size)
print("最后修改时间:", time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(st.st_mtime)))
print("最后访问时间:", time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(st.st_atime)))
print("元数据变更时间:", time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(st.st_ctime)))
print("权限位（八进制）:", oct(st.st_mode))
print("所有者 UID:", st.st_uid, "组 GID:", st.st_gid)
# 输出（假设文件存在）：
# 大小（字节）: 8192
# 最后修改时间: 2026-07-23 14:30:11
# 最后访问时间: 2026-07-23 15:01:09
# 元数据变更时间: 2026-07-23 14:30:11
# 权限位（八进制）: 0o100644
# 所有者 UID: 501 组 GID: 20
```

**st_mode 的结构**

`st_mode` 把"文件类型"和"权限"编码在一个整数里。高位是类型（`S_IFREG` 普通文件、`S_IFDIR` 目录、`S_IFLNK` 符号链接等），低 12 位是权限（rwxrwxrwx + 特殊位）。可以用 `stat` 模块的常量解析：

```python
from pathlib import Path
import stat

p = Path("/srv/app/logs/app.log")
mode = p.stat().st_mode

# 判断类型
print("普通文件:", stat.S_ISREG(mode))
print("目录:", stat.S_ISDIR(mode))
print("符号链接:", stat.S_ISLNK(mode))

# 权限位
perms = stat.filemode(mode)  # 返回 'rwxr-xr-x' 风格字符串
print("权限:", perms)
# 输出：
# 普通文件: True
# 目录: False
# 符号链接: False
# 权限: rw-r--r--
```

**stat() 与 lstat()**

`Path.stat()` 默认跟随符号链接——给你的是目标文件的属性，不是链接本身的。如果要取链接自身的属性（比如链接本身的大小，通常很小），用 `Path.lstat()`：

```python
from pathlib import Path

link = Path("/srv/app/shortcut")  # 假设是符号链接

# stat 跟随，得到目标属性
print("stat 大小:", link.stat().st_size)

# lstat 不跟随，得到链接自身属性
print("lstat 大小:", link.lstat().st_size)
print("是否链接:", link.lstat().st_mode & 0o170000 == 0o120000)
# 输出：
# stat 大小: 8192       （目标文件大小）
# lstat 大小: 12        （链接本身占的字节，存的是目标路径字符串）
# 是否链接: True
```

### 2.9 stat 字段实战：日志文件大小与修改时间

把 `st_size` 和 `st_mtime` 组合起来，是运维和后端开发里最常见的场景之一：扫描日志目录，按修改时间排序，找出最近更新的文件和体积异常的文件。

```python
from pathlib import Path
import time

log_dir = Path("/srv/app/logs")

# 扫描目录下所有 .log 文件，取大小与最后修改时间
records = []
for f in log_dir.glob("*.log"):
    st = f.stat()
    records.append((f.name, st.st_size, st.st_mtime))

# 按修改时间倒序（最近更新的在前）
records.sort(key=lambda r: r[2], reverse=True)

# 打印前 5 个
print(f"{'文件名':<20} {'大小(KB)':>10} {'最后修改':<20}")
for name, size, mtime in records[:5]:
    kb = size / 1024
    t = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(mtime))
    print(f"{name:<20} {kb:>10.1f} {t:<20}")
# 输出：
# 文件名                 大小(KB) 最后修改
# error.log               128.4 2026-07-23 14:30:11
# access.log             2048.1 2026-07-23 13:55:02
# app.log                  8.0 2026-07-23 09:12:45
# debug.log                0.0 2026-07-22 23:59:01
# legacy.log             512.0 2026-07-20 08:00:00
```

这个模式可以扩展：超出阈值就告警、按日期归档、清理超过 N 天未修改的文件等，都建立在 `st_mtime` 之上。

**按时间过滤过期文件**

```python
from pathlib import Path
import time

log_dir = Path("/srv/app/logs")
now = time.time()
seven_days = 7 * 24 * 3600

# 找出超过 7 天未修改的日志
stale = [f for f in log_dir.glob("*.log") if (now - f.stat().st_mtime) > seven_days]
print("待清理文件数:", len(stale))
for f in stale[:3]:
    age_days = (now - f.stat().st_mtime) / 86400
    print(f"  {f.name}  已 idle {age_days:.1f} 天")
# 输出：
# 待清理文件数: 12
#   legacy.log  已 idle 9.5 天
#   old_app.log  已 idle 11.2 天
#   crash.log  已 idle 30.1 天
```

### 2.10 规范化：resolve() 与 absolute()

这两个方法都用于把路径"变成绝对路径"，但深度不同：

- `absolute()`：把相对路径接在 `cwd` 上，返回绝对路径，但**不**解析符号链接，也**不**消解 `..` 和 `.`。纯字符串层面的拼接。
- `resolve()`：调用文件系统，逐段解析符号链接、消解 `..` 和 `.`，返回"真实"的绝对路径。默认严格模式要求路径必须存在（Python 3.6+ 放宽为不存在路径也会尽量解析）。

```python
from pathlib import Path

# 假设 cwd 是 /Users/epro/projects
rel = Path("../python-demo/scripts/run.py")

print("absolute:", rel.absolute())
print("resolve:", rel.resolve())
# 输出：
# absolute: /Users/epro/projects/../python-demo/scripts/run.py
# resolve:  /Users/epro/python-demo/scripts/run.py  （.. 被消解 + 符号链接被跟随）
```

注意 `absolute()` 保留了 `..`，只有 `resolve()` 真正把它化简。

**resolve 的 strict 参数**

`resolve(strict=False)`（默认）对不存在的路径也会返回一个尽量规范化的结果；`strict=True` 在路径任意一段不存在时抛 `FileNotFoundError`。

```python
from pathlib import Path

# 不存在的路径
ghost = Path("/srv/app/does/not/exist/file.txt")

print(ghost.resolve())                # 默认 strict=False
# 输出：/srv/app/does/not/exist/file.txt （存在的部分被解析，不存在的部分原样保留）

try:
    ghost.resolve(strict=True)
except FileNotFoundError as e:
    print("strict 模式报错:", e)
# 输出：strict 模式报错: ... （具体消息视系统而定）
```

**resolve 与符号链接**

```python
from pathlib import Path

# 假设 /srv/app/realdir 是真实目录
# /srv/app/link -> /srv/app/realdir  是符号链接
link = Path("/srv/app/link/file.txt")

print("absolute:", link.absolute())   # 不跟随链接
print("resolve:", link.resolve())     # 跟随到真实路径
# 输出：
# absolute: /srv/app/link/file.txt
# resolve:  /srv/app/realdir/file.txt
```

什么时候该用哪个？绝大多数场景用 `resolve()`，它给你的是"文件真正在哪"的答案。`absolute()` 更轻量、不碰文件系统，适合你只想要"在当前 cwd 下这条相对路径的绝对写法"、且明确不关心符号链接时。

### 2.11 变换：with_name 和 with_suffix

这两个方法返回一个"改了某一部分"的新 `Path`，原对象不变——`Path` 是不可变对象，所有变换都是生成新实例。

- `with_name(name)`：替换最后一段全名。
- `with_suffix(suffix)`：替换最后一个扩展名。`suffix` 必须以 `.` 开头（如 `.txt`），或为空字符串（表示去掉扩展名）。

```python
from pathlib import Path

p = Path("/srv/app/logs/app.log")

# 改文件名（含扩展名）
print(p.with_name("error.log"))
# 输出：/srv/app/logs/error.log

# 改扩展名
print(p.with_suffix(".txt"))
# 输出：/srv/app/logs/app.txt

# 去掉扩展名
print(p.with_suffix(""))
# 输出：/srv/app/logs/app

# 给没有扩展名的文件加扩展名
noext = Path("/srv/app/CHANGELOG")
print(noext.with_suffix(".md"))
# 输出：/srv/app/CHANGELOG.md
```

**with_suffix 的边界规则**

`with_suffix` 要求传入的扩展名要么以单个 `.` 开头，要么为空。传 `.`（单个点）或 `..txt` 会抛 `ValueError`。此外，如果原路径没有扩展名，传入的扩展名会被追加；如果原路径有扩展名，会被替换。

```python
from pathlib import Path

p = Path("archive.tar.gz")
print(p.with_suffix(".zip"))   # 只替换最后一个 .gz
# 输出：archive.tar.zip

# 以下都会抛 ValueError
# p.with_suffix("zip")    # 缺少前导点
# p.with_suffix("..zip")  # 双点
# p.with_suffix(".")      # 单个点
```

### 2.12 批量变换：改后缀的典型场景

把 `with_suffix` 与 `glob` 组合，可以很自然地实现"批量改后缀"。下面是一个把目录下所有 `.txt` 改成 `.md` 的脚本（演示用，仅打印不实际改名）：

```python
from pathlib import Path

notes_dir = Path("/srv/app/notes")

# 查找所有 .txt，生成对应的 .md 路径
renames = []
for txt in notes_dir.glob("*.txt"):
    md = txt.with_suffix(".md")
    renames.append((txt, md))

for old, new in renames[:3]:
    print(f"{old.name} -> {new.name}")
# 输出：
# todo.txt -> todo.md
# readme.txt -> readme.md
# draft.txt -> draft.md
```

实际改名用 `Path.rename`：

```python
from pathlib import Path

notes_dir = Path("/srv/app/notes")
for txt in notes_dir.glob("*.txt"):
    txt.rename(txt.with_suffix(".md"))

# 改完后目录里只剩 .md
print([p.name for p in notes_dir.glob("*.md")][:3])
# 输出：['todo.md', 'readme.md', 'draft.md']
```

### 2.13 相对路径 vs 绝对路径

判断与转换：

- `Path.is_absolute()`：是否以根开头（POSIX 以 `/`，Windows 以盘符）。
- `Path.resolve()` / `absolute()`：相对转绝对（见 2.10）。
- `Path.is_relative_to(other)`（Python 3.9+）：当前路径是否在 `other` 之下。
- `Path.relative_to(other)`：求相对于 `other` 的相对路径。

```python
from pathlib import Path

abs_p = Path("/srv/app/logs/app.log")
rel_p = Path("logs/app.log")

print(abs_p.is_absolute())   # True
print(rel_p.is_absolute())   # False
# 输出：
# True
# False

# 相对化
base = Path("/srv/app")
print(abs_p.relative_to(base))
# 输出：logs/app.log

# is_relative_to（3.9+）安全判断
print(abs_p.is_relative_to(base))     # True
print(abs_p.is_relative_to("/etc"))   # False
# 输出：
# True
# False
```

`relative_to` 要求路径必须是 `other` 的子路径，否则抛 `ValueError`。在 3.12+ 可以传 `walk_up=True` 允许产生 `..`：

```python
from pathlib import Path

a = Path("/srv/app/logs/app.log")
b = Path("/srv/app/config")

# 3.12 之前：不在子树下会报错
# a.relative_to(b)  # ValueError

# 3.12+ 用 walk_up 允许 ..
print(a.relative_to(b, walk_up=True))
# 输出：../logs/app.log
```

### 2.14 安全拼接用户输入

把外部输入拼进路径时，最大的风险是路径穿越（path traversal）：用户传 `../../etc/passwd` 这类值，拼出来的路径跑到了预期目录之外。`Path` 本身不做安全校验，需要你显式检查。典型安全写法是用 `resolve()` 后判断是否仍在允许的根目录下：

```python
from pathlib import Path

ALLOWED_ROOT = Path("/srv/app/uploads").resolve()

def safe_join(user_input: str) -> Path:
    """把用户输入安全地拼到允许目录下，禁止越界。"""
    # 拼接后解析为真实绝对路径，消解 .. 和符号链接
    candidate = (ALLOWED_ROOT / user_input).resolve()
    # 必须仍在允许目录内（含自身）
    if not candidate.is_relative_to(ALLOWED_ROOT):
        raise ValueError(f"非法路径: {user_input}")
    return candidate

print(safe_join("avatars/2026/07/face.png"))
# 输出：/srv/app/uploads/avatars/2026/07/face.png

try:
    safe_join("../../etc/passwd")
except ValueError as e:
    print("拦截:", e)
# 输出：拦截: 非法路径: ../../etc/passwd
```

这一个模式覆盖了绝大多数"用户上传文件名"、"用户指定子目录"的场景。核心两步：`resolve()` 消解越界尝试，`is_relative_to()` 判断是否仍在允许范围。

### 2.15 构建项目目录路径：综合场景

把前面几节组合起来，看一个贴近真实开发的例子：在一个项目里，根据当前脚本位置找到项目根，再拼出 `data/`、`logs/`、`output/` 等目录，并在缺失时创建。

```python
from pathlib import Path

# 1. 定位项目根：脚本在 src/utils/ 下，项目根是上两级
script = Path(__file__).resolve()           # 脚本绝对路径
project_root = script.parents[2]            # src/utils -> src -> 项目根

# 2. 拼出各业务目录
data_dir = project_root / "data" / "raw"
log_dir = project_root / "logs"
output_dir = project_root / "output" / "2026-07"

# 3. 确保目录存在（exist_ok 避免已存在时报错）
for d in (data_dir, log_dir, output_dir):
    d.mkdir(parents=True, exist_ok=True)

# 4. 拼具体文件
raw_file = data_dir / "users.csv"
log_file = log_dir / "etl.log"
out_file = output_dir / "report.csv"

print("项目根:", project_root)
print("原始数据:", raw_file)
print("日志:", log_file)
print("输出:", out_file)
# 输出：
# 项目根: /Users/epro/projects/python-demo
# 原始数据: /Users/epro/projects/python-demo/data/raw/users.csv
# 日志: /Users/epro/projects/python-demo/logs/etl.log
# 输出: /Users/epro/projects/python-demo/output/2026-07/report.csv
```

这个例子串起了 `resolve`、`parents`、`/` 拼接、`mkdir`。注意它完全不依赖 `os.path`，也不需要手写分隔符，在 Windows 上跑同样正确。

## 3. 最佳实践

### 3.1 永远用 Path，别再手拼字符串

```python
# 不推荐
log_path = base_dir + "/" + "logs" + "/" + "2026-07" + "/" + "app.log"
config_path = base_dir + os.sep + "config.ini"

# 推荐
log_path = Path(base_dir) / "logs" / "2026-07" / "app.log"
config_path = Path(base_dir) / "config.ini"
```

手拼字符串在 Windows 上会得到错误的分隔符，在含空格的路径上可能因引号处理出错。`Path` 的 `/` 运算符让这些问题消失。

### 3.2 区分 cwd 与脚本目录

需要"脚本旁边的数据文件"时用 `Path(__file__).resolve().parent`，需要"用户启动命令时所在目录"时用 `Path.cwd()`。两者经常被混用，导致脚本换个目录跑就找不到文件。明确你的需求对应哪一个。

### 3.3 优先 resolve 后再比较

两条路径是否指向同一文件，不能直接比字符串：`/srv/app/link/file.txt` 和 `/srv/app/realdir/file.txt` 字符串不同但可能指向同一文件；`./logs/app.log` 和 `/srv/app/logs/app.log` 写法不同但等价。比较前先 `resolve()`：

```python
from pathlib import Path

a = Path("/srv/app/link/file.txt").resolve()
b = Path("/srv/app/realdir/file.txt").resolve()
print(a == b)   # 若 link 确实指向 realdir，则 True
# 输出：True
```

### 3.4 stat 字段要分清 ctime 的平台差异

`st_ctime` 在 POSIX 上是 inode 元数据变更时间（改权限、改名、改归属会更新），在 Windows 上是创建时间。跨平台脚本里不要假定它的语义，需要"创建时间"在 POSIX 上没有标准获取方式。

### 3.5 不要用字符串方法处理路径

```python
# 不推荐
name = path_str.split("/")[-1]
base = path_str.rsplit(".", 1)[0]

# 推荐
name = Path(path_str).name
base = Path(path_str).stem
```

字符串 `split` 在 Windows 路径（`\`）和含多个点（`file.tar.gz`）上都会出错。`Path` 的分解属性跨平台且语义明确。

### 3.6 拼接用户输入必须校验

见 2.14。任何把外部字符串拼进路径的场景，都要 `resolve()` + `is_relative_to()` 校验，防止穿越。不要依赖黑名单过滤 `..`，黑名单容易漏。

### 3.7 批量操作先用 glob 收集再处理

改名、删文件等批量操作，先 `glob` 出列表、检查内容，再执行副作用，避免边遍历边修改目录导致的行为不确定：

```python
from pathlib import Path

# 推荐：先收集
tmp_files = list(Path("/srv/app").glob("*.tmp"))
for f in tmp_files:
    f.unlink()
print("清理了", len(tmp_files), "个文件")
# 输出：清理了 5 个文件
```

### 3.8 exists 不要当操作的前置条件

如 2.7 所述，`if p.exists(): read()` 有竞态。直接读并捕获 `FileNotFoundError` 更稳。`exists()` 适合做"展示用"判断（如决定显示哪种 UI），不适合做"操作用"守卫。

## 4. 原理

### 4.1 Path 的类层次：PurePath 与具体 Path

`pathlib` 把路径分成两层抽象：

- `PurePath`：纯粹的路径计算，完全不碰文件系统。`PurePosixPath`、`PureWindowsPath` 是它的两个子类，分别对应两种分隔符规则。`PurePath` 的所有方法（`/`、`parts`、`parent`、`name`、`suffix`、`with_name` 等）都只做字符串层面的处理，不检查文件是否存在。
- `Path`：继承自 `PurePath`，在纯路径能力之外增加了与文件系统交互的方法（`exists`、`stat`、`resolve`、`mkdir`、`glob` 等）。`PosixPath`、`WindowsPath` 是对应平台的 `Path` 子类。

```python
from pathlib import Path, PurePath, PurePosixPath, PureWindowsPath

# PurePath 不碰文件系统
pp = PurePosixPath("/srv/app") / "logs" / "app.log"
print(pp)
# 输出：/srv/app/logs/app.log

# 用 PureWindowsPath 在任何平台上都能算 Windows 风格路径
wp = PureWindowsPath(r"C:\Users\epro") / "logs" / "app.log"
print(wp)
# 输出：C:\Users\epro\logs\app.log

# Path 在你的平台上选对应子类
p = Path("/srv/app/logs/app.log")
print(type(p).__name__)
# 输出：PosixPath  （在 macOS/Linux 上）
```

这种分层带来两个好处：一是"纯计算"可以跨平台进行（比如在 Linux 上解析 Windows 路径），二是 `PurePath` 的操作没有 I/O 开销，适合只做路径构造与分解的场景。

### 4.2 / 运算符的重载：__truediv__

`Path` 能用 `/` 拼接，是因为 `PurePath` 重载了 `__truediv__`（以及 `__rtruediv__` 用于右侧）。当你写 `a / b`，Python 实际调用的是 `a.__truediv__(b)`。

简化后的核心逻辑：把 `b` 转成字符串，按当前类的分隔符规则，与 `a` 的字符串表示拼接，然后构造一个新的同类型对象。关键细节是它**不**做 `os.path.join` 的"绝对路径丢弃左侧"行为——它把右侧视为子路径追加。

```python
from pathlib import Path

# 手动模拟 / 的效果
a = Path("/srv/app")
b = "logs/app.log"
# a / b ≈ a._make_child(b) ≈ Path(str(a) + "/" + b) 然后规范化分隔符
print(a / b)
# 输出：/srv/app/logs/app.log

# 右侧操作数是 Path 也能工作
c = Path("logs") / Path("app.log")
print(c)
# 输出：logs/app.log
```

`__rtruediv__` 处理 `"str" / Path` 的情况——不过这里要求左侧能被理解成路径上下文，否则会抛错。实践中一般让左侧总是 `Path`。

**为什么选 / 而不是 +**

选 `/` 是因为它是"路径分隔符"的视觉隐喻，且 `+` 在 Python 里已是字符串拼接，语义上容易和"字符串相连"混淆。`/` 的重载让路径拼接在代码里一眼可辨。

### 4.3 stat() 与 os.stat_result

`Path.stat()` 底层调用 `os.stat(path)`，返回一个 `os.stat_result` 命名元组。这个对象本质上是 C 层 `struct stat` 的 Python 封装，各 `st_xxx` 字段直接对应 inode 中存储的元数据：

- `st_size`：文件字节长度，来自 inode 的 `i_size` 字段（对于目录是目录项占用的逻辑大小）。
- `st_mtime` / `st_atime` / `st_ctime`：三个时间戳，来自 inode 的 `mtime`/`atime`/`ctime`。POSIX 下 `ctime` 是 inode 变更时间（改权限、改名会更新），Windows 下 `ctime` 被复用为创建时间。
- `st_mode`：16 位以上整数，高位编码文件类型（普通文件、目录、字符设备、符号链接等），低位编码权限（owner/group/other 的 rwx + setuid/setgid/sticky）。
- `st_ino` / `st_dev`：inode 号 + 设备号，二者组合能在文件系统内唯一标识一个文件，可用于识别硬链接（两个路径 `st_ino` 和 `st_dev` 相同即同一文件）。
- `st_nlink`：硬链接数，目录至少为 2（自身 `.` 和子目录的 `..` 各算一次）。

```python
from pathlib import Path

p = Path("/srv/app/logs/app.log")
st = p.stat()

# stat_result 是命名元组，可按名或索引访问
print(st.st_size, st[6])   # 索引访问也行，但不推荐，可读性差
# 输出：8192 8192

# 同一文件的两个硬链接：ino/dev 相同
link2 = Path("/srv/app/logs/app_hardlink.log")
st2 = link2.stat()
print(st.st_ino == st2.st_ino, st.st_dev == st2.st_dev)
# 输出：True True  （若是硬链接）
```

`stat()` 跟随符号链接（调用 `os.stat`），`lstat()` 不跟随（调用 `os.lstat`）。这是两者唯一的实现差异。

### 4.4 resolve() 如何查询文件系统

`Path.resolve()` 不是纯字符串操作，它会逐段访问文件系统：沿路径从根开始，对每一段检查是否是符号链接，若是则读取链接目标并替换，循环处理直到没有符号链接为止，同时消解 `.` 和 `..`。这涉及多次系统调用（`os.readlink`、`os.lstat`），因此比 `absolute()` 慢，但结果是"真实物理路径"。

Python 3.6 以前的 `resolve()` 要求路径必须存在（`strict=True` 为默认），3.6 起默认 `strict=False`：对不存在的尾段，原样保留，对已存在的中间段照常解析。

```python
from pathlib import Path

# 假设 /srv/app/link -> /srv/app/realdir
# /srv/app/realdir 存在，file.txt 不存在
p = Path("/srv/app/link/file.txt")
print(p.resolve(strict=False))
# 输出：/srv/app/realdir/file.txt
# 已存在的 link 段被解析，不存在的 file.txt 原样保留
```

底层在各平台上调用 `os.path.realpath` 或等价的系统调用序列，Windows 上调用 `GetFinalPathNameByHandle` 等 API 来解析符号链接。

### 4.5 os.PathLike 协议与 __fspath__

`Path` 实现了 `os.PathLike` 协议，提供 `__fspath__()` 方法返回路径的字符串形式。这意味着 `Path` 对象可以被所有接受"路径型"参数的函数直接使用：`open`、`os.stat`、`shutil.copy`、`json.load` 等——它们内部会调用 `os.fspath()` 把 `Path` 转成字符串。

```python
from pathlib import Path
import os

p = Path("/srv/app/data/config.json")

# open 直接接受 Path
with open(p, "r", encoding="utf-8") as f:
    print(f.readline())

# os.fspath 显式转换
print(os.fspath(p))
# 输出：/srv/app/data/config.json

# __fspath__ 是协议方法
print(p.__fspath__())
# 输出：/srv/app/data/config.json
```

`os.fspath` 的规则：传字符串原样返回，传 `os.PathLike` 调用其 `__fspath__()`，传其他类型抛 `TypeError`。这保证了一个统一接口，让"字符串路径"和"Path 对象"可以无缝互换。

```python
from pathlib import Path
import os

print(os.fspath("/srv/app/log.txt"))          # str 原样返回
print(os.fspath(Path("/srv/app/log.txt")))    # Path 调 __fspath__
# 输出：
# /srv/app/log.txt
# /srv/app/log.txt

# 以下会抛 TypeError
# os.fspath(123)
# os.fspath(["a", "b"])
```

正因为这个协议，`Path` 对象可以直接传给 `open`、`shutil` 系列、`subprocess` 的 `cwd` 参数等，不必先 `str()` 转换。这是 `pathlib` 能"接管"全流程路径操作的关键。

## 5. 总结

本文聚焦 pathlib 的两个核心专题——路径拼接与文件属性查询，覆盖了：

- **构造与入口**：`Path()` 构造、`Path.cwd()` / `Path.home()` 两个起点路径。
- **拼接**：`/` 运算符与 `joinpath`，跨平台分隔符处理，与 `os.path.join` 在"绝对路径分段"上的行为差异。
- **分解**：`parts` / `parent` / `parents` / `name` / `suffix` / `suffixes` / `stem`，把路径拆成可用结构。
- **判断**：`exists` / `is_file` / `is_dir` / `is_symlink` 的语义与 TOCTOU 注意点。
- **属性**：`stat()` 返回 `os.stat_result`，各 `st_xxx` 字段含义，`st_mode` 的类型与权限解析，`lstat` 对符号链接的差异。
- **规范化**：`resolve()` 与 `absolute()` 的差异，`strict` 参数，`..` 与符号链接的消解。
- **变换**：`with_name` / `with_suffix` 的规则与边界，批量改后缀场景。
- **相对与绝对**：`is_absolute` / `relative_to` / `is_relative_to`，`walk_up`（3.12+）。
- **安全**：用户输入拼接的 `resolve` + `is_relative_to` 模式。
- **原理**：`PurePath`/`Path` 类层次、`__truediv__` 重载、`stat()` 对接 `os.stat` 与 inode 元数据、`resolve` 逐段查询文件系统、`os.PathLike` 与 `__fspath__` 协议。

读完本文你应能：

- 用 `/` 和 `joinpath` 正确拼接多段路径，并解释与 `os.path.join` 的行为区别。
- 用 `parts`/`parent`/`name`/`suffix`/`stem` 分解任意路径，不会误用字符串 `split`。
- 用 `stat()` 取得文件大小、三个时间戳、权限位，并说明 `st_ctime` 在 POSIX 与 Windows 上的语义差异。
- 区分 `resolve()` 与 `absolute()`，在需要"真实物理路径"时选用 `resolve`。
- 用 `with_name`/`with_suffix` 变换路径，实现批量改后缀。
- 对用户输入路径做 `resolve` + `is_relative_to` 安全校验，拦截路径穿越。
- 解释 `Path` 能被 `open` 直接接受的原因：`os.PathLike` 协议与 `__fspath__`。