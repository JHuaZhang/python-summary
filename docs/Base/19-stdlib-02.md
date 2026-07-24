---
group:
  title: 【19】标准库精讲
  order: 19
order: 2
title: os 模块：环境变量与进程
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 os 模块

`os` 是 Python 标准库中最古老、最基础的模块之一，它的定位非常明确：**操作系统系统调用的薄封装**。所谓"薄封装"，是指它几乎不做什么抽象，只是把 C 语言层面的操作系统接口（POSIX 接口、Windows 接口）逐一暴露给 Python 代码使用。你在终端里敲 `ls`、`cd`、`export`、`kill` 这些命令背后对应的系统调用，在 Python 里基本都能在 `os` 模块中找到同名的或近似的函数。

`os` 模块覆盖的范围非常广：文件与目录操作（`os.mkdir`、`os.remove`、`os.rename`）、路径处理（`os.path`）、权限管理（`os.chmod`、`os.chown`）、进程管理（`os.fork`、`os.execv`、`os.kill`）、环境变量（`os.environ`、`os.getenv`）等等。本篇不打算面面俱到，而是聚焦其中两块职责——**环境变量**与**进程**。文件与路径操作部分已在《pathlib 面向对象路径》及《os 模块文件与路径操作》篇中讲解，本篇与之互补。

之所以把环境变量和进程放在一起讲，是因为这两者在实际开发中经常联动：启动子进程时要决定传哪些环境变量给子进程、读取配置时要从环境变量取值、调试进程问题时要查 PID 和父进程关系。理解了这块，你就能写出能正确读取配置、能安全拉起子进程、能合理退出的工程级 Python 代码。

### 1.2 环境变量与进程：os 模块的两个核心职责

**环境变量**是操作系统为每个进程维护的一组 `"KEY=VALUE"` 字符串。它在进程启动时由父进程传递给子进程，是进程间传递配置信息的最朴素机制。典型用途包括：

- `PATH`：决定 shell 在哪些目录下寻找可执行文件；
- `HOME`：当前用户的家目录；
- `APP_ENV` / `DEBUG`：应用自定义的运行环境标识（开发/测试/生产）；
- `DATABASE_URL`：数据库连接串；
- `LANG` / `LC_ALL`：语言与编码区域设置。

**进程**是操作系统进行资源分配和调度的基本单位。每个 Python 程序运行起来后本身就是一个进程，它有唯一的进程 ID（PID）、一个父进程 ID（PPID）、在 POSIX 系统上还有用户 ID（UID）和组 ID（GID）。`os` 模块提供了查询这些标识的函数，以及创建子进程、替换进程映像、终止进程等操作。

### 1.3 最小用法

先看一个最简的例子，感受 `os` 在这两块职责上的基本用法：

```python
import os

# —— 环境变量 ——
print(os.getenv("HOME"))          # 读取一个环境变量，不存在返回 None
# 输出：/Users/epro    （示例值，实际取决于你的系统）

print(os.environ.get("LANG"))     # 等价于 getenv，字典式访问
# 输出：zh_CN.UTF-8

# —— 进程标识 ——
print("当前进程 PID:", os.getpid())
# 输出：当前进程 PID: 7421

print("父进程 PID:", os.getppid())
# 输出：父进程 PID: 7402   （通常是启动 python 的终端 shell）
```

这段代码几乎不需要额外依赖，复制到任何 Python 解释器里都能跑起来。本篇接下来会逐一展开每个 API 的细节、场景与坑点。

## 2. 核心内容

### 2.1 os.environ：环境变量的字典式访问

`os.environ` 是 `os` 模块里访问环境变量的核心对象。它的类型是 `os._Environ`，行为类似一个 `Mapping`（字典），但并不是真正的 `dict` 子类。你可以像操作字典一样读取、设置、删除环境变量：

```python
import os

# 读取：和普通字典一样用 [] 或 .get()
path = os.environ["PATH"]         # 不存在会抛 KeyError
lang = os.environ.get("LANG")     # 不存在返回 None
lang = os.environ.get("LANG", "C")  # 不存在时给默认值

# 判断是否存在
if "APP_ENV" in os.environ:
    print("已设置运行环境:", os.environ["APP_ENV"])

# 遍历
for key, value in os.environ.items():
    print(f"{key}={value}")
# 输出：（当前进程的全部环境变量，键值对逐行打印）
# 输出：PATH=/usr/local/bin:/usr/bin:...
# 输出：HOME=/Users/epro
# 输出：LANG=zh_CN.UTF-8
# ...
```

`os.environ` 和真正的字典有几个重要差异，必须记住：

- **它是进程启动时的"快照映射"**：Python 启动时把当前进程的 C 层 `environ` 拷贝一份构造出这个对象，后续对它的读写会同步反映到 C 层 `environ`（通过 `putenv`/`unsetenv`）。
- **值类型始终是 `str`**：你不能存 `int`、`bool`，存进去前必须自己转成字符串；读出来也要自己转换。
- **不存在则抛 `KeyError`**：用 `[]` 取一个不存在的键会直接报错，因此读取前最好先 `in` 判断或用 `.get()`。

**何时用 `os.environ`**：需要批量遍历环境变量、判断多个键是否存在、或在脚本里多处复用同一个环境变量对象时，直接用 `os.environ` 最方便。只取单个值时用下面介绍的 `os.getenv` 更省事。

### 2.2 os.getenv：安全读取单个环境变量

`os.getenv(key, default=None)` 是读取单个环境变量的便捷函数。它的本质就是 `os.environ.get(key, default)`，但写起来更短、语义更明确，尤其适合"从环境变量读配置"这种场景：

```python
import os

# 场景：从环境变量读取应用配置
app_env = os.getenv("APP_ENV", "development")   # 默认开发环境
debug = os.getenv("DEBUG", "false").lower() == "true"  # 布尔转换要自己做
port = int(os.getenv("PORT", "8000"))            # 数字转换要自己做
db_url = os.getenv("DATABASE_URL")               # 没默认值，可能为 None

print(f"运行环境: {app_env}")
print(f"调试模式: {debug}")
print(f"监听端口: {port}")
print(f"数据库: {db_url}")
# 输出：
# 运行环境: development
# 调试模式: False
# 监听端口: 8000
# 数据库: None
```

`os.getenv` 还有一个变体 `os.getenvb(key, default)`，返回的是 `bytes` 而非 `str`。这在某些需要精确控制字节编码（比如环境变量里存的是非 UTF-8 编码的路径）的 POSIX 场景下才用得到，日常几乎用不到。

**常见误区**

很多初学者会写成 `os.getenv("DEBUG") == "true"` 这样硬比对字符串，忽视了大小写、空白和"假值"的多样性。更稳妥的写法是统一 `lower().strip()` 处理后再比较，或者直接用 `distutils.util.strtobool`（已弃用）/ 自定义解析函数。但核心点不变：**环境变量永远是字符串，类型转换是你自己的事**。

### 2.3 修改环境变量：仅影响本进程及子进程

环境变量不是只读的，你可以通过 `os.environ` 直接赋值修改：

```python
import os

# 给当前进程新增/修改一个环境变量
os.environ["MY_TOKEN"] = "abc123"
os.environ["APP_ENV"] = "production"

print(os.getenv("MY_TOKEN"))   # 输出：abc123
print(os.environ["APP_ENV"])   # 输出：production
```

也可以删除：

```python
import os

if "MY_TOKEN" in os.environ:
    del os.environ["MY_TOKEN"]   # 从当前进程环境里移除

print(os.getenv("MY_TOKEN"))     # 输出：None
```

**关键认知**：你在 Python 里修改的环境变量，**只影响当前进程及其后续创建的子进程，无法影响父进程，也无法影响已经运行的兄弟进程**。这是操作系统进程隔离的硬性规则，不是 Python 的限制。下面这个示例能直观验证这一点：

```python
import os
import subprocess

# 在 Python 里设置一个环境变量
os.environ["FROM_PYTHON"] = "hello"

# 启动一个子进程，子进程能继承到这个变量
result = subprocess.run(
    ["python", "-c", "import os; print('子进程看到:', os.getenv('FROM_PYTHON'))"],
    capture_output=True, text=True
)
print(result.stdout)
# 输出：子进程看到: hello

# 但反过来不行：子进程里设置的环境变量，父进程看不到
result = subprocess.run(
    ["python", "-c", "import os; os.environ['CHILD_VAR'] = 'x'; print('子进程已设置')"],
    capture_output=True, text=True
)
print(result.stdout)
print("父进程看到 CHILD_VAR:", os.getenv("CHILD_VAR"))
# 输出：子进程已设置
# 输出：父进程看到 CHILD_VAR: None
```

理解这点非常重要：环境变量的传递是**单向的、从父到子、在子进程启动那一刻定格**。子进程再怎么改，父进程都浑然不觉。这也是为什么你没法用 Python 脚本去"修改终端的 PATH"——你的 Python 进程是终端的子进程，子改不了父。

### 2.4 os.getpid / os.getppid：查看进程标识

每个进程在操作系统里都有唯一的进程 ID（PID）。`os.getpid()` 返回当前 Python 进程的 PID，`os.getppid()` 返回父进程的 PID：

```python
import os

pid = os.getpid()
ppid = os.getppid()

print(f"我是 Python 进程，PID = {pid}")
print(f"我的父进程 PID = {ppid}")
# 输出：
# 我是 Python 进程，PID = 7831
# 我的父进程 PID = 7810   （通常是终端 shell）
```

**实际用途**

- **写日志**：多进程程序里，日志带上 PID 能在排查时区分是哪个子进程输出的；
- **死锁/卡住排查**：拿到 PID 后可以用 `ps`、`top`、`lsof -p <PID>`、`py-spy` 等工具去查看这个进程在干什么；
- **PID 文件**：服务程序启动时把自己的 PID 写到一个文件里，方便后续停止或检查是否还在运行；
- **父子关系确认**：用 `getppid` 配合 `ps` 可以确认脚本是被谁拉起来的（crontab、systemd、supervisor、还是手动 shell）。

下面是一个带场景感的 demo：模拟一个 worker 子进程，在日志里带上自己的 PID 和父 PID，便于运维定位：

```python
import os
import time

def worker(worker_id):
    print(f"[worker {worker_id}] 启动, PID={os.getpid()}, 父PID={os.getppid()}")
    time.sleep(0.5)
    print(f"[worker {worker_id}] 完成任务")

if __name__ == "__main__":
    import threading
    threads = [threading.Thread(target=worker, args=(i,)) for i in range(3)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    print(f"主线程所在进程 PID={os.getpid()}")
# 输出：
# [worker 0] 启动, PID=7831, 父PID=7810
# [worker 1] 启动, PID=7831, 父PID=7810
# [worker 2] 启动, PID=7831, 父PID=7810
# [worker 0] 完成任务
# [worker 1] 完成任务
# [worker 2] 完成任务
# 主线程所在进程 PID=7831
```

注意：线程共享同一个进程，所以三个 worker 的 PID 是相同的；只有真正的子进程（`fork`/`subprocess`）才会有不同 PID。

### 2.5 os.getuid / os.getgid（POSIX）

在 POSIX 系统（Linux、macOS）上，每个进程还关联着一组身份标识：

- `os.getuid()`：实际用户 ID（real UID），即启动该进程的用户；
- `os.geteuid()`：有效用户 ID（effective UID），用于权限校验，setuid 程序会把它设为文件属主；
- `os.getgid()`：实际组 ID；
- `os.getegid()`：有效组 ID。

```python
import os

print("实际用户 UID:", os.getuid())
print("有效用户 UID:", os.geteuid())
print("实际组 GID:", os.getgid())
print("有效组 GID:", os.getegid())
# 输出（普通用户示例）：
# 实际用户 UID: 501
# 有效用户 UID: 501
# 实际组 GID: 20
# 有效组 GID: 20
```

对应的还有 `os.setuid`、`os.setgid` 等，但它们需要 root 权限才能调用，主要用于服务程序启动后"降权"到普通用户的安全实践——比如一个 Web 服务以 root 启动以绑定 80 端口，绑定完后立刻 `os.setuid(www_data)` 切到低权限用户运行。

**Windows 不可用**

这些函数在 Windows 上不存在，调用会抛 `AttributeError`。写跨平台代码时要用 `hasattr(os, 'getuid')` 先判断，或者改用 `getpass.getuser()` 这类跨平台的方式获取当前用户名：

```python
import os
import getpass

if hasattr(os, "getuid"):
    uid = os.getuid()        # POSIX
else:
    uid = None               # Windows 没有 UID 概念

username = getpass.getuser()  # 跨平台，返回当前登录用户名
print(uid, username)
# 输出：501 epro   （POSIX）
# 输出：None epro  （Windows）
```

### 2.6 os.system：执行 shell 命令

`os.system(command)` 是 `os` 模块里最古老的执行外部命令的方式。它把传入的字符串交给系统的 shell（`/bin/sh` 或 `cmd.exe`）去解释执行，返回值是命令的"退出状态码"（注意：在 POSIX 上是 wait status，需要右移 8 位才是真正的退出码）。

```python
import os

# 执行一条 shell 命令，输出会直接打到当前进程的 stdout
status = os.system("echo 'hello from shell'")
print("status:", status)
# 输出：
# hello from shell
# status: 0

# 执行失败时返回非零
status = os.system("ls /not/exist/path")
print("status:", status)
# 输出：
# ls: /not/exist/path: No such file or directory
# status: 512   （在 POSIX 上，512 >> 8 == 2，即命令退出码 2）
```

`os.system` 的问题非常多，在现代 Python 代码中基本不推荐使用：

1. **注入风险**：命令是字符串拼接的，一旦拼进去的数据来自外部（比如用户输入、文件名），就有 shell 注入风险；
2. **拿不到输出**：命令的 stdout/stderr 直接混入当前进程的输出流，你没法在代码里拿到结果做后续处理，`os.system` 只返回状态码；
3. **返回值反人类**：POSIX 上返回的是 wait status，需要 `(status >> 8) & 0xFF` 才是退出码，还要用 `os.WIFEXITED` 判断是否正常退出；
4. **无法精细控制**：没法设超时、没法用非 root 用户身份运行、没法单独重定向 stderr。

正因为这些缺陷，Python 官方文档明确推荐优先使用 `subprocess` 模块。下面直接对比。

### 2.7 subprocess：更安全灵活的替代（对比 os.system）

`subprocess` 是 Python 3 推荐的执行外部命令的标准方式，它解决了 `os.system` 的所有痛点。最常用的入口是 `subprocess.run`：

```python
import subprocess

# 推荐写法：参数用列表传入，不经过 shell 解释，天然防注入
result = subprocess.run(
    ["ls", "-l", "/tmp"],
    capture_output=True,   # 捕获 stdout/stderr 而不是直接打到当前进程
    text=True,             # 输出按文本返回（否则是 bytes）
)

print("退出码:", result.returncode)
print("stdout:")
print(result.stdout)
print("stderr:", result.stderr)
# 输出（示例）：
# 退出码: 0
# stdout:
# total 0
# drwxr-xr-x  3 epro  wheel  96 Jul 23 10:02 foo
# ...
# stderr:
```

**安全对比：shell 注入**

`os.system` 的致命问题是字符串拼接成 shell 命令。假设你要删除用户指定的文件，用 `os.system` 大概会写成：

```python
import os

# 不推荐！filename 含分号或反引号就会被当作 shell 命令执行
filename = "foo.txt; rm -rf /"
os.system(f"rm {filename}")
# 这条命令会先把 foo.txt 删了，然后执行 rm -rf /  ——灾难
```

而用 `subprocess` 列表参数，根本不经过 shell，`filename` 哪怕再花哨也只是当成一个文件名传给 `rm`：

```python
import subprocess

filename = "foo.txt; rm -rf /"   # 危险字符串
subprocess.run(["rm", filename], check=False)
# rm 收到的参数就是字面量 "foo.txt; rm -rf /"，不会执行注入命令
# 只是提示找不到这个文件而已
```

**为什么 subprocess 更安全**：核心区别是"是否经过 shell 解释"。用列表参数的 `subprocess.run(["rm", name])` 走的是 `execve` 系统调用，直接把列表元素当作 `argv` 传给目标程序，不经过任何 shell，因此空格、分号、`$`、反引号这些 shell 元字符都是普通字符。只有当你显式传 `shell=True` 时，`subprocess` 才会和 `os.system` 一样注入——所以 `shell=True` 也要谨慎用。

**灵活性对比**

`subprocess` 还提供了 `os.system` 完全给不了的能力：

- `capture_output=True` / `stdout=PIPE`：拿到输出做后续处理；
- `timeout=10`：超时杀死子进程；
- `check=True`：非零退出码直接抛 `CalledProcessError`，省去手动判断；
- `cwd=`：指定子进程工作目录；
- `env=`：给子进程传自定义环境（见下一节）；
- `subprocess.Popen`：流式处理、管道串联、后台进程。

下面这张对比表总结了二者差异：

| 维度 | `os.system` | `subprocess.run` |
|---|---|---|
| 命令传参 | 字符串（经 shell） | 列表（不经 shell，默认安全） |
| 获取输出 | 不行，输出混入当前进程 | `capture_output=True` 拿到 |
| 返回值 | wait status（需右移 8 位） | `returncode` 直接是退出码 |
| 超时 | 不支持 | `timeout=` |
| 异常处理 | 手动判断状态码 | `check=True` 抛异常 |
| 自定义环境 | 不行 | `env=` |
| 工作目录 | 不行 | `cwd=` |
| 推荐度 | 已弃用，仅极简场景 | 现代标准 |

**结论**：新代码一律用 `subprocess`。`os.system` 只在"快速跑一条临时命令、不在意输出和安全性"的脚本里图个方便时偶尔用，生产代码杜绝。

### 2.8 给子进程传递自定义环境变量（subprocess env=）

默认情况下，`subprocess` 启动的子进程会继承当前 Python 进程的完整 `os.environ`。但很多时候你不想让子进程看到父进程的所有变量（比如父进程里有敏感 token），或者你想给子进程一个完全不同的环境。这时用 `env=` 参数：

**场景一：在父进程基础上增补几个变量传给子进程**

```python
import os
import subprocess

# 在当前环境基础上加一个变量，只传给子进程，不改父进程自己的环境
child_env = os.environ.copy()
child_env["EXTRA_CONFIG"] = "only-for-child"

result = subprocess.run(
    ["python", "-c", "import os; print('EXTRA_CONFIG =', os.getenv('EXTRA_CONFIG'))"],
    env=child_env,
    capture_output=True,
    text=True,
)
print(result.stdout)
# 输出：EXTRA_CONFIG = only-for-child

# 父进程自己并没有这个变量
print("父进程里 EXTRA_CONFIG:", os.getenv("EXTRA_CONFIG"))
# 输出：父进程里 EXTRA_CONFIG: None
```

**场景二：给子进程一个最小化环境（白名单）**

```python
import os
import subprocess

# 只给子进程必要的几个变量，避免泄露敏感信息
minimal_env = {
    "PATH": os.environ["PATH"],       # 子进程要能找到可执行文件
    "HOME": os.environ["HOME"],       # 很多程序依赖 HOME
    "LANG": os.environ.get("LANG", "C"),
    "APP_ENV": "test",                # 业务变量
}

result = subprocess.run(
    ["python", "-c", "import os; print(sorted(os.environ.keys()))"],
    env=minimal_env,
    capture_output=True,
    text=True,
)
print(result.stdout)
# 输出：['APP_ENV', 'HOME', 'LANG', 'PATH']
```

这种白名单做法在生产环境很重要：父进程里可能塞着数据库密码、密钥、CI Token，如果直接用默认继承，这些都会原样传给子进程，子进程一旦被注入或日志泄露，敏感信息就跟着泄露了。**最小权限原则**同样适用于环境变量。

**注意**：一旦你传了 `env=`，子进程的环境就**完全是你给的那份**，不再继承父进程的其他变量。如果你传了一个空字典 `env={}`，子进程里连 `PATH` 都没有，绝大多数命令都跑不起来，这点很容易踩坑。

### 2.9 os.execv 系列：替换当前进程映像

`os.exec*` 系列函数做的是一件很"硬核"的事：**用一个新的程序替换掉当前进程的代码段、数据段、堆栈**。调用成功后，当前 Python 进程就"消失了"——后面的 Python 代码不会执行，进程的 PID 不变，但从这一刻起进程里跑的是新程序。

```python
import os

# os.execv(path, argv)
# path：可执行文件路径
# argv：参数列表，第一个元素习惯上写程序名
os.execv("/bin/echo", ["echo", "I am now echo, Python is gone"])
print("这行永远不会执行")   # 因为当前进程已经被 echo 替换
# 输出：I am now echo, Python is gone
```

`os.exec*` 有不少变体，区别在传参方式和环境处理：

- `os.execv(path, args)`：传列表，沿用当前环境；
- `os.execve(path, args, env)`：传列表，可指定环境；
- `os.execl(path, arg0, arg1, ...)`：参数逐个传；
- `os.execvp(file, args)`：在 `PATH` 中查找 `file`；
- `os.execvpe(file, args, env)`：同上 + 自定义环境。

命名规律：`v` = args 用 list，`l` = args 用散列参数；`e` = 带 env；`p` = 搜 PATH。

**何时会用到 execv**

- **写一个 launcher**：用 Python 做一堆启动前准备（读配置、设环境变量、打日志），然后用 `execv` 把自己替换成真正的服务程序。替换后 PID 不变、文件描述符（未设 `FD_CLOEXEC` 的）保留，对调用方来说就像这个进程一直在跑。
- **配合 `fork` 实现"fork + exec"经典模式**：`fork` 出子进程后，子进程立刻 `execv` 成别的程序——这正是 `subprocess` 底层在做的事。
- **CI/CD 包装器**：算好环境后把控制权交给真正的构建工具。

**和 subprocess 的区别**：`subprocess` 是"当前进程派生一个子进程去跑命令，父进程还在"；`execv` 是"当前进程自己变成那个命令，Python 部分就此结束"。两者用途完全不同，不要混用。

### 2.10 os.fork（POSIX）

`os.fork()` 是 POSIX 系统的 `fork` 系统调用封装，用于创建当前进程的副本。调用一次返回两次：在父进程中返回子进程的 PID（>0），在子进程中返回 0。

```python
import os

pid = os.fork()

if pid == 0:
    # 子进程分支
    print(f"[子进程] PID={os.getpid()}, 父PID={os.getppid()}")
elif pid > 0:
    # 父进程分支
    print(f"[父进程] PID={os.getpid()}, 创建了子进程 PID={pid}")
else:
    # pid < 0 表示失败
    print("fork 失败")
# 输出：
# [父进程] PID=7901, 创建了子进程 PID=7902
# [子进程] PID=7902, 父PID=7901
```

`fork` 之后，子进程是父进程的几乎完全拷贝（写时复制），包括内存、文件描述符、环境变量。子进程可以继续跑 Python 代码，也可以用 `os.execv` 换成别的程序。

**Windows 不可用**：`os.fork` 在 Windows 上不存在。要写跨平台的"启动子进程跑代码"逻辑，直接用 `multiprocessing` 模块，它在 POSIX 上用 `fork`、在 Windows 上用 `spawn`，对上层透明。

**现代代码慎用 fork**

直接用 `os.fork` 的场景在新代码里越来越少，原因：

1. `fork` 会拷贝父进程的全部内存，大内存进程开销大；
2. `fork` 后子进程里只有当前线程存活，其他线程凭空消失，持有锁的情况下会死锁（这是著名的 "fork + 锁" 坑）；
3. `multiprocessing`、`subprocess` 已经把常见需求封装好了，没必要手写。

了解 `fork` 仍然有意义：它是 Unix 进程模型的灵魂，`subprocess`、`multiprocessing`、`gunicorn`、`uwsgi` 这些工具底层都依赖它。

### 2.11 os._exit vs sys.exit：退出码与清理

进程退出 position 有两个容易混淆的 API：`os._exit(code)` 和 `sys.exit([code])`。

**sys.exit(code)**

`sys.exit` 是日常用的退出方式。准确地讲，它不是"立即终止进程"，而是**抛出一个 `SystemExit` 异常**。这个异常会像普通异常一样向上传播，在传播过程中触发清理逻辑：`finally` 块、`atexit` 注册的回调、上下文管理器的 `__exit__`、缓冲区 flush 等等。如果异常没被 `try/except SystemExit` 截住，解释器最终以你给的 code（或默认 0）作为退出码退出。

```python
import sys

def cleanup():
    print("执行清理")

try:
    print("准备退出")
    sys.exit(3)        # 抛 SystemExit(3)
except SystemExit:
    print("被 try 截到了，但还是要退出")
    raise              # 重新抛出，让进程真正退出
finally:
    cleanup()
# 输出：
# 准备退出
# 被try 截到了，但还是要退出
# 执行清理
# （进程退出码 3）
```

**os._exit(code)**

`os._exit` 是直接调用操作系统的 `_exit` 系统调用，**立即终止进程，不做任何清理**：不抛异常、不跑 `finally`、不调 `atexit`、不 flush stdio 缓冲区。它通常只在两种场景下用：

1. **`fork` 出来的子进程里**：子进程继承了父进程的 stdio 缓冲区，如果用 `sys.exit` 退出，缓冲区会被 flush 一次，导致和父进程重复输出；而且 `atexit` 回调是父进程注册的，在子进程里跑会乱套。所以子进程通常用 `os._exit`。
2. **需要立刻硬退出的极端情况**：比如进程已经处于不可恢复状态，任何清理都可能再出问题。

```python
import os
import sys

print("这条会打印并 flush")
sys.stdout.write("这条在缓冲区里")   # 不带换行，未 flush
os._exit(7)                          # 立即退出，缓冲区里那条丢失
print("这条不会执行")
# 输出：这条会打印并 flush
# （缓冲区里那条被丢弃，进程退出码 7）
```

**对比表**

| 维度 | `sys.exit` | `os._exit` |
|---|---|---|
| 本质 | 抛 `SystemExit` 异常 | 调用 OS `_exit` 系统调用 |
| 清理 | 执行 `finally`、`atexit`、flush 缓冲 | 不做任何清理 |
| 缓冲区 | flush 后退出 | 直接丢弃 |
| 退出码 | `sys.exit(0)` / `sys.exit(None)` → 0；`sys.exit(N)` → N | `os._exit(N)` → N |
| 适用 | 绝大多数正常退出 | fork 出的子进程、致命错误硬退出 |
| 可被捕获 | 能被 `except SystemExit` 截住 | 不可捕获 |

日常代码一律用 `sys.exit`。`os._exit` 留给 `fork` 子进程和极端情况。

## 3. 最佳实践

**配置走环境变量，用 `os.getenv` + 显式默认值**

读取配置时，永远给一个合理的默认值，避免环境变量未设置时程序行为不可预期。同时把类型转换显式做掉，因为环境变量永远是字符串：

```python
# 推荐
port = int(os.getenv("PORT", "8000"))
debug = os.getenv("DEBUG", "false").strip().lower() in ("1", "true", "yes")
```

```python
# 不推荐：没默认值、不转类型，出问题很难排查
port = os.environ["PORT"]   # 没设直接 KeyError 崩溃
debug = os.getenv("DEBUG")  # 是字符串 "false" 还是布尔？含糊
```

**子进程一律用 subprocess，不用 os.system**

新代码里把 `os.system` 从你的工具箱里划掉。`subprocess.run` 在安全性、可观测性、可控性上全面碾压：

```python
# 推荐
result = subprocess.run(
    ["git", "rev-parse", "HEAD"],
    capture_output=True, text=True, check=True, timeout=5
)
commit = result.stdout.strip()
```

```python
# 不推荐
status = os.system("git rev-parse HEAD > /tmp/commit.txt")
with open("/tmp/commit.txt") as f:
    commit = f.read().strip()
# 多了临时文件、没超时、状态码难解析、注入风险
```

**传给子进程的环境变量用白名单，不要全量继承**

父进程里往往有数据库密码、API Key 这类敏感信息。默认 `env=None`（全量继承）会让子进程也看到这些。生产代码里给子进程构造最小环境：

```python
# 推荐：白名单
child_env = {
    "PATH": os.environ["PATH"],
    "HOME": os.environ["HOME"],
    "LANG": os.environ.get("LANG", "C.UTF-8"),
}
subprocess.run(["some-tool"], env=child_env, check=True)
```

**记住改环境变量不影响父进程**

这是最常见的一个误解：在脚本里 `os.environ["PATH"] = ...` 之后，退出脚本发现自己的终端 `PATH` 没变。这是因为脚本只是终端的子进程，子改不了父。要"持久"地改环境变量，得靠 shell 配置文件（`.bashrc`/`.zshrc`）或 `source` 一个会 export 的脚本，而不是靠 Python。

**跨平台代码先判断可用性**

`os.getuid`、`os.fork`、`os.execv` 这些都是 POSIX 专属，Windows 上直接调用会 `AttributeError`。跨平台代码养成 `hasattr` 判断或用更上层抽象的习惯：

```python
import os
import getpass

def current_uid():
    if hasattr(os, "getuid"):
        return os.getuid()
    return None    # Windows 没有

def current_user():
    return getpass.getuser()   # 跨平台
```

**退出码用 0 表示成功，非 0 表示失败**

`sys.exit(0)` 是成功，`sys.exit(1)`/`sys.exit(2)` 等是失败。在 shell 里 `echo $?` 看到的就是这个码。写 CLI 工具时务必遵守这个约定，否则上游脚本和 CI 系统会判断错：

```python
import sys

def main():
    if not parse_args():
        sys.exit(2)     # 参数错误，约定用 2
    try:
        run()
    except RuntimeError as e:
        print(f"错误: {e}", file=sys.stderr)
        sys.exit(1)     # 一般失败
    sys.exit(0)         # 成功
```

**PID 写日志，方便排查**

多进程服务里，日志带上 PID 能在出问题时快速定位是哪个 worker：

```python
import os
import logging

logging.basicConfig(
    format="[pid=%(process)d] %(levelname)s %(message)s",
    level=logging.INFO,
)
log = logging.getLogger(__name__)
log.info("服务启动")
# 输出：[pid=7901] INFO 服务启动
```

`logging` 模块的 `%(process)d` 就是当前 PID，等价于 `os.getpid()`。

**fork 子进程里用 os._exit，不要用 sys.exit**

这点在 2.11 节已展开。简言之：`fork` 出的子进程如果要退出，直接 `os._exit(code)`，避免触发父进程注册的 `atexit` 和重复 flush 缓冲区。

**不要把密钥直接明文塞进环境变量再传给子进程**

环境变量虽然比硬编码进代码好，但用 `ps e`（显示环境）或读 `/proc/<pid>/environ` 仍可能被同机其他用户看到（取决于权限）。更安全的做法是放在只读的密钥文件里，或用专门的密钥管理服务。环境变量适合配置类信息，不适合高敏感凭证。

## 4. 原理

### 4.1 os.environ：启动时的 C environ 快照

要真正理解 `os.environ`，需要从操作系统的进程环境说起。每个 C 程序的 `main` 函数除了 `argc`/`argv`，还接收一个第三个参数 `environ`——它是一个以 `NULL` 结尾的字符串数组，每个元素形如 `"KEY=VALUE"`。这个数组就是进程的环境变量，由操作系统在进程启动时从父进程拷贝而来，存放在进程的内存空间里。

Python 解释器启动时，会把 C 层的这个 `environ` 数组"扫描一遍"，对每个 `"KEY=VALUE"` 字符串做一次切分，构造成 Python 的 `os._Environ` 对象。这个对象内部维护了两个映射：一个用 `str` 作键值（给 `os.environ` 用），一个用 `bytes` 作键值（给 `os.environb` 用）。

```python
import os

# os.environ 的真实类型
print(type(os.environ))
# 输出：<class 'os._Environ'>

# 它不是 dict，但实现了 Mapping 协议
from collections.abc import Mapping
print(isinstance(os.environ, Mapping))
# 输出：True
```

关键点在于：`os.environ` 是"启动时一次性拷贝"出来的视图，并不是每次访问都去扫一遍 C 层的 `environ`。但它的 `__getitem__` / `__setitem__` / `__delitem__` 内部会调用 C 层的 `getenv` / `putenv` / `unsetenv`，所以**对这个对象做的修改会同步反映到本进程的 C environ**——这点在 4.2 节展开。

### 4.2 putenv / setenv：修改本进程的 C environ

POSIX 提供两个修改环境变量的 C 接口：`setenv(name, value, overwrite)` 和 `putenv(string)`。Python 的 `os.putenv(name, value)` 对应前者（语义上是"设置一个键值"），而 `os.environ[name] = value` 内部也会调用 `putenv` 来同步 C 层。

这就引出一个常被问到的问题：**既然 `os.environ[name] = value` 会同步到 C environ，那为什么还要单独有 `os.putenv`？** 区别在于"对象视图"和"C 层"的同步方向：

- `os.environ[name] = value`：同时更新 Python `os._Environ` 内部映射和 C environ，两边一致，推荐用这个；
- `os.putenv(name, value)`：只改 C environ，**不会更新 `os.environ` 的内部映射**，于是 `os.environ.get(name)` 可能还看到旧值——这是 `putenv` 不推荐直接用的原因。

```python
import os

# 直接用 putenv，os.environ 不会同步
if os.getenv("FOO") is None:
    os.putenv("FOO", "bar")
    print("putenv 之后 os.environ.get:", os.environ.get("FOO"))
    # 在某些实现下输出：None   （os.environ 内部映射没更新）
    # 但子进程通过 getenv 能看到，因为 C environ 已改
```

Python 官方文档明确建议：**用 `os.environ` 赋值，不要直接用 `os.putenv`**。前者保证 Python 视图和 C 视图一致，后者只有一个方向。`os.unsetenv` 同理，用 `del os.environ[name]` 更稳妥。

### 4.3 子进程如何继承本进程的 environ

子进程继承环境变量的机制是操作系统层面的：当父进程通过 `fork` 创建子进程时，子进程获得父进程内存空间的副本，其中就包括 C environ 数组；随后子进程如果 `exec`，`execve` 系统调用会接收一个新的 `envp` 参数——如果不显式指定，默认用当前进程（即 fork 出来的那个）的 environ。

`subprocess` 在 POSIX 上的底层流程大致是：

1. `fork` 出子进程；
2. 子进程里根据你传的 `env=` 决定环境：没传就沿用继承来的；传了就清空再用 `execvpe`/`execve` 把新环境塞进去；
3. 子进程 `exec` 成目标程序，目标程序拿到的 environ 就是上一步定的那份。

```python
import os
import subprocess

# 父进程设置一个变量
os.environ["INHERITED"] = "yes"

# 不传 env：子进程继承父进程的 environ
out = subprocess.run(
    ["python", "-c", "import os; print('INHERITED =', os.getenv('INHERITED'))"],
    capture_output=True, text=True
).stdout
print(out)
# 输出：INHERITED = yes

# 传一个全新的 env：子进程用这份，原有继承被丢弃
out = subprocess.run(
    ["python", "-c", "import os; print('INHERITED =', os.getenv('INHERITED'))"],
    env={"PATH": os.environ["PATH"]},
    capture_output=True, text=True
).stdout
print(out)
# 输出：INHERITED = None
```

这个机制解释了为什么"改环境变量只影响本进程及子进程"——子进程拿的是本进程 environ 的拷贝，本进程改了之后才 fork 的子进程能拿到新值；但 fork 之后子进程再怎么改，改的也只是它自己的那份拷贝，回不到父进程。

### 4.4 为何改环境变量不影响父进程

这是初学者最困惑的一点，本质是**进程间内存隔离**。现代操作系统给每个进程独立的虚拟地址空间，进程 A 的内存进程 B 看不到也改不了。环境变量就是进程内存里的一段数据，自然也隔离。

具体到 shell 场景：你在终端里跑 `python script.py`，进程关系是：

```
shell (PID 1000)  ──fork+exec──>  python script.py (PID 1001)
```

`script.py` 里 `os.environ["FOO"] = "bar"` 只动了 PID 1001 自己内存里的 environ 拷贝。PID 1000（shell）自己的 environ 没人碰。等 `script.py` 跑完退出，它的 environ 跟着进程一起消失，shell 的 environ 自始至终没变，所以你在脚本里 `export` 的效果在脚本退出后就"没了"。

这也解释了一个经典面试题："怎么用 Python 脚本修改当前 shell 的环境变量？"答案是**做不到**，除非你在 shell 里 `source` 这个脚本（让脚本内容在当前 shell 进程里执行，而不是 fork 子进程去执行）。Python 脚本是独立进程，注定改不了父 shell。

环境变量的"持久化"只能靠两种方式：

1. 写到 shell 启动文件（`.bashrc`、`.zshrc`、`.profile`），让 shell 下次启动时自己加载；
2. 在当前 shell 里直接 `export VAR=value`，或 `source` 一个只含 export 语句的脚本。

Python 脚本只能写文件、不能改当前 shell，这是进程模型的硬限制。

### 4.5 os 模块作为系统调用薄封装的定位

回头看 `os` 模块的设计哲学：它是**操作系统系统调用的薄封装**，不是高抽象框架。证据随处可见：

- `os.getpid` ↔ `getpid(2)` 系统调用，1:1 映射；
- `os.getuid`/`os.setuid` ↔ `getuid(2)`/`setuid(2)`；
- `os.fork` ↔ `fork(2)`；
- `os.execv` ↔ `execve(2)`；
- `os.environ` ↔ C `environ` 全局变量 + `getenv`/`putenv`。

这种"薄封装"定位带来三个后果：

1. **平台差异裸露给你**：`fork`、`getuid`、`execv` 这些在 Windows 上根本没有对应系统调用，`os` 模块干脆就不提供，调用直接 `AttributeError`。它不做跨平台抽象，跨平台是 `subprocess`、`multiprocessing`、`pathlib` 这些上层模块的事。
2. **错误形式是 OSError**：系统调用失败时 `os` 模块抛 `OSError`（或其子类如 `PermissionError`、`FileNotFoundError`），errno 直接来自 C 层，没有额外的 Python 层包装。
3. **文档要看 man page**：很多 `os` 函数的语义细节（比如 `wait status` 要右移 8 位、`fork` 后只有当前线程存活）都写在对应的 Unix man page 里，Python 文档只点一下。

理解这层定位，你就能预判 `os` 模块的行为：它的函数要么直接对应一个系统调用，要么对应一组 C 库函数，行为和 C 程序里调它们一样。这也是为什么学了 `os` 模块的人在写 C 时会觉得亲切——概念是同一套。

### 4.6 subprocess 相对 os.system 的安全与灵活性

前面在核心内容章已对比过二者的 API 差异，这里从原理上解释为什么 `subprocess` 更安全、更灵活。

**安全性的根源：是否经过 shell**

`os.system(cmd)` 的实现是：调用 C 库 `system(cmd)`，后者等价于 `fork` + `execl("/bin/sh", "sh", "-c", cmd, NULL)`。也就是说，`cmd` 这个字符串会被 `/bin/sh` 完整地解释一遍——分号、管道、`$()`、反引号、通配符全部生效。你拼进去的任何外部数据，只要含 shell 元字符，就会被当 shell 语法执行，这就是注入。

`subprocess.run(args)` 在 `shell=False`（默认）时，直接走 `fork` + `execve`，把 `args` 列表的每个元素原封不动作为目标进程的 `argv`，不经过 `/bin/sh`。目标程序收到的就是字面量字符串，没有任何二次解释，注入无从谈起。

**灵活性的根源：对子进程的全要素可控**

`subprocess` 用 `subprocess.Popen` 暴露了子进程的全部可控要素：

- `stdin`/`stdout`/`stderr` 可以分别接到管道、文件、`DEVNULL`；
- `env` 可以自定义；
- `cwd` 可以切目录；
- `close_fds` 控制 fd 是否继承；
- `start_new_session` 让子进程脱离父进程的进程组（守护进程化）；
- `preexec_fn` 在 fork 后、exec 前执行一段代码（POSIX，慎用）；
- `timeout` 配合 `Popen.communicate(timeout=...)` 实现超时杀进程。

`os.system` 只有一个字符串参数和一个返回状态码，这些要素它一个都控制不了。本质上 `os.system` 是"最省事的临时工具"，`subprocess` 才是"工程级别的子进程管理库"。

**性能层面**

`os.system` 每次都要起一个 `/bin/sh` 来解释命令，多一层进程；`subprocess` 默认不走 shell，直接 fork+exec 目标程序，少一个进程、少一次解释。对高频调用的场景这点开销也值得考虑。

综上，`subprocess` 在安全、灵活、性能、可观测四个维度都优于 `os.system`，新代码统一用 `subprocess`。

## 5. 总结

### 5.1 本文内容要点

- `os` 模块是操作系统系统调用的薄封装，环境变量与进程是它的两大职责，与文件路径操作篇互补。
- `os.environ` 是进程启动时从 C environ 拷贝出的字典式视图，用 `[]`/`.get()` 读写，修改会同步到本进程 C environ。
- `os.getenv(key, default)` 是读取单个环境变量的便捷函数，等价于 `os.environ.get`，环境变量值永远是字符串，类型转换要自己做。
- 修改环境变量只影响本进程及其后续子进程，无法影响父进程和已运行的兄弟进程——这是进程内存隔离的硬性规则。
- `os.getpid`/`os.getppid` 查看进程 PID 和父 PID；`os.getuid`/`os.getgid`/`os.geteuid`/`os.getegid` 是 POSIX 上的身份标识，Windows 不可用。
- `os.system` 执行 shell 命令字符串，有注入风险、拿不到输出、返回值难解析，不推荐使用；`subprocess` 是现代标准，默认不经 shell、可捕获输出、可设超时和自定义环境。
- 给子进程传环境用 `subprocess` 的 `env=` 参数，推荐白名单最小化传递，避免泄露父进程的敏感变量。
- `os.execv` 系列用新程序替换当前进程映像，PID 不变、Python 代码不再执行，常用于 launcher 和 fork+exec 模式。
- `os.fork` 是 POSIX 进程复制，调用一次返回两次，Windows 不可用；现代代码优先用 `multiprocessing`/`subprocess`。
- `sys.exit` 抛 `SystemExit` 走清理流程，日常用它退出；`os._exit` 直接调 OS `_exit` 不清理，用于 fork 子进程和硬退出场景。

### 5.2 读完应能掌握

- 能说明 `os.environ` 的快照机制与 `putenv`/`setenv` 的同步关系，解释为何改环境变量不影响父进程。
- 能用 `os.getenv` 带默认值读取配置，并对字符串值做正确的类型转换。
- 能用 `os.getpid`/`os.getppid` 在日志和排查中标识进程，在 POSIX 上用 `os.getuid` 判断权限。
- 能说出 `os.system` 的四个缺陷并改用 `subprocess.run` 列表参数写出安全调用，能解释 `shell=False` 为何防注入。
- 能用 `subprocess` 的 `env=` 给子进程构造白名单最小环境，并说明为何不全量继承。
- 能区分 `os.execv`（替换当前进程）与 `subprocess`（派生子进程）的用途差异。
- 能区分 `sys.exit`（抛异常走清理）与 `os._exit`（立即不清理）的适用场景，正确选择退出方式。
- 能在跨平台代码里用 `hasattr` 判断 POSIX 专属 API 的可用性，写出在 Windows 和 Linux 上都能跑的进程相关逻辑。