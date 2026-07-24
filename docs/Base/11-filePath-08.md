---
group:
  title: 【11】文件与路径操作
  order: 11
order: 8
title: tempfile临时文件与目录
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 tempfile

`tempfile` 是 Python 标准库专门用来创建**临时文件和临时目录**的模块。在程序运行中,我们经常需要一块"用完即弃"的存储——下载一个文件先存到本地处理完就删、解压一个压缩包到一个临时目录用完清理、测试代码需要一个真实文件但跑完不想留痕迹、把内存里装不下的大数据先落盘再读取。这些场景共同的特点是:文件的生命周期很短、用完要清理、名字并不重要、最好能保证不被别的进程误读到。

如果手动去 `open("tmp_xxx", "w")` + 最后 `os.remove(...)`,会踩一系列坑:名字怎么起才不和别人冲突?中途异常了谁来删?多进程同时跑会不会覆盖同一个文件?跨平台路径放哪才安全(不同系统临时目录不同)?`tempfile` 把这些问题都封装好了,它提供一组高层 API,自动在系统临时目录下创建唯一命名的文件/目录,并在关闭或退出作用域时自动清理。

它的四件套是我们讨论的主线:

- **`TemporaryFile`**:匿名临时文件,关闭即删,连文件名都不暴露给你。
- **`NamedTemporaryFile`**:具名临时文件,能拿到 `.name`,可被其他进程通过名字访问(配合 `delete` 控制删除时机)。
- **`SpooledTemporaryFile`**:回滚式临时文件,先在内存里写,超过阈值才落盘。
- **`TemporaryDirectory`**:临时目录,退出作用域自动递归删除整目录。

此外还有 `mkstemp`、`mkdtemp` 等低层接口,以及 `gettempdir` 等查询/设置临时目录的工具。

在现代 Python 中的地位:`tempfile` 是处理临时资源的官方答案,尤其在测试框架、数据处理管线、需要"原子落盘"的中间文件场景里几乎必用。它和 `with` 上下文管理器天然配合,能保证资源清理不泄漏。

### 1.2 基本语法与最小用法

最小用法——创建一个匿名临时文件,写点东西再读回来:

```python
import tempfile

with tempfile.TemporaryFile(mode="w+", encoding="utf-8") as f:
    f.write("hello temp\n")
    f.write("second line\n")
    # 写完要读回来,得先把指针移回开头
    f.seek(0)
    print(f.read())
# with 结束,文件已关闭并删除,磁盘上看不到痕迹
```

```text
# 输出：
hello temp
second line
```

临时目录的最小用法:

```python
import tempfile

with tempfile.TemporaryDirectory() as d:
    print("临时目录:", d)
    # 在里面放点东西
    with open(f"{d}/scratch.txt", "w") as f:
        f.write("some data")
    print("使用完毕")
# with 结束,整个目录及其内容被递归删除
import os
print("退出后还存在?", os.path.exists(d))
```

```text
# 输出（路径每次不同）：
临时目录: /var/folders/xxx/T/tmpabcdef
使用完毕
退出后还存在? False
```

两个例子都体现了 `tempfile` 的核心契约:**在系统临时目录下创建一个唯一命名的资源,退出 `with` 时自动清理**。你不需要操心名字冲突、路径平台差异、异常时残留——这些都被处理好了。

**适用场景**

任何需要"短生命周期文件"的场景:测试夹具、缓存中间结果、解压临时目录、WebView/外部程序要先存盘再打开的文件、接收上传后处理完即删。当你发现自己在手写 `try/finally + os.remove` 时,就该换 `tempfile`。

**常见误区**

有人把 `TemporaryFile` 当成普通文件用,试图靠 `f.name` 把它交给另一个进程读——`TemporaryFile` 在 POSIX 上是匿名的(没有可用的名字),这种交接不成立。需要在进程间通过名字共享,用 `NamedTemporaryFile`。

---

## 2. 核心内容

### 2.1 TemporaryFile:匿名临时文件

`TemporaryFile` 创建一个"匿名"临时文件对象,行为像普通文件对象(可读写、可 seek),关键特性是**关闭即删**,而且你在大多数平台上拿不到一个稳定可用的文件名。

签名(常用):

```python
TemporaryFile(mode='w+b', buffering=-1, encoding=None, newline=None,
              suffix=None, prefix=None, dir=None, *, errors=None)
```

默认 `mode='w+b'` 是**二进制读写**,所以默认拿到的对象要用 `b"..."` 写、`.read()` 返回字节。要用文本模式得显式传 `mode="w+"` 并给 `encoding`。

为什么默认是二进制?因为临时文件常用于和二进制数据(图片、压缩流、pickle 字节)打交道,且二进制模式跨平台行为最可预测(不受 newline 转换、编码影响)。

一个读写二进制的例子:

```python
import tempfile

with tempfile.TemporaryFile() as f:        # 默认 w+b
    f.write(b"\x00\x01\x02 hello")
    f.seek(0)
    data = f.read()
    print(data)                              # 二进制直接打
    print("字节数:", len(data))
```

```text
# 输出：
b'\x00\x01\x02 hello'
字节数: 11
```

文本模式:

```python
import tempfile

with tempfile.TemporaryFile(mode="w+", encoding="utf-8") as f:
    f.write("第一行\n第二行\n")
    f.seek(0)
    for line in f:
        print("行:", line.rstrip())
```

```text
# 输出：
行: 第一行
行: 第二行
```

`TemporaryFile` 的"匿名"在不同平台上实现不同:POSIX 系统上它通过 `os.open(..., O_RDWR|O_CREAT|O_EXCL)` 建文件后立即 `os.unlink` 掉目录项,文件就变成"无名"的——只要你持有的文件描述符还在,文件内容就还在,但文件系统里已经没有指向它的名字,关闭最后一个 fd 时系统回收空间。Windows 上没有这种"先建后删"的等价机制,`TemporaryFile` 在 Windows 上会保留一个文件名(实际退化为类似 `NamedTemporaryFile` 的行为,只是名字按实现细节隐藏)。这就是为什么跨平台代码不该依赖 `TemporaryFile.name`。

`suffix`/`prefix`/`dir` 三个参数控制临时文件名字的"长相"和位置:

```python
import tempfile

with tempfile.TemporaryFile(prefix="upload_", suffix=".tmp") as f:
    # 名字在 Unix 匿名文件上不可用,这里仅示意参数语义
    f.write(b"data")
```

`prefix` 给文件名加前缀、`suffix` 加后缀(常用于按业务给临时文件分类、让运维能认出来历)、`dir` 指定创建在哪个目录(默认系统临时目录)。这三个参数对 `TemporaryFile` 的"匿名"意义不大(反正GetName不到),但对 `NamedTemporaryFile` 和 `TemporaryDirectory` 很有用。

### 2.2 NamedTemporaryFile:具名临时文件

`NamedTemporaryFile` 和 `TemporaryFile` 几乎一样,区别在于它**有名字**——你可以通过 `.name` 拿到文件路径,并把它交给别的进程或函数处理。

签名多了一个关键参数 `delete`:

```python
NamedTemporaryFile(mode='w+b', buffering=-1, encoding=None, newline=None,
                   suffix=None, prefix=None, dir=None, delete=True, *,
                   errors=None)
```

`delete=True`(默认):文件在关闭时自动删除。`delete=False`:关闭时不删,文件留存(需要自己后续清理)。

典型场景——把数据处理写到临时文件,再用外部命令(如 `subprocess` 调 `gzip`、`ImageMagick`)处理这个文件:

```python
import tempfile
import subprocess

# 建一个有名字的临时输入文件
with tempfile.NamedTemporaryFile(suffix=".txt", delete=True) as f:
    f.write(b"some text to process")
    f.flush()                       # 必须刷新,确保数据真落盘,外部进程才读得到
    # 把名字交给外部进程
    result = subprocess.run(["wc", "-c", f.name], capture_output=True, text=True)
    print("外部命令输出:", result.stdout.strip())
# with 结束自动删除
```

```text
# 输出示意：
外部命令输出: 21 /tmp/tmpXXXXXX.txt
```

这里有个**关键工程点**:`f.flush()`。文件对象带缓冲,你 `f.write(...)` 的数据可能还在 Python 的内存缓冲里没写到磁盘,外部进程通过文件名去读就读到一个空文件或不完整文件。所以把名字交出去之前必须 `flush()`(或先 `f.seek`,但 `flush` 语义最清晰)。

`delete=False` 用于"想保留临时文件"的场景——比如处理失败时想留着排查:

```python
import tempfile
import os

f = tempfile.NamedTemporaryFile(suffix=".log", delete=False, mode="w", encoding="utf-8")
try:
    f.write("处理日志...\n")
    # 模拟业务
    raise ValueError("业务出错")
except Exception as e:
    f.flush()
    print(f"出错,临时日志保留在: {f.name} 供排查")
finally:
    f.close()
# 之后某个清理流程再 os.remove(f.name)
```

```text
# 输出示意：
出错,临时日志保留在: /tmp/tmpXXXXXX.log 供排查
```

`delete=False` 配合手动清理是常见的"调试期保留、生产期删除"模式——开发时设 `False`,上线设回 `True`。

**Windows 上的大坑**:在 Windows 上,`NamedTemporaryFile`(默认 `delete=True`)打开的文件被当前进程独占,别的进程无法用名字打开它,会报 `PermissionError`。也就是说上面"交名字给外部进程"的例子在 Windows 默认参数下会失败。解决方案有两个:

方案一(3.12+):使用 `delete_on_close=False` 参数,让文件关闭时不立即删除,而是等 `delete=False` 风格手动清理,且关闭后别的进程能打开:

```python
import tempfile

# Python 3.12+: delete_on_close=False，文件关闭时不删，可被其他进程访问
f = tempfile.NamedTemporaryFile(delete_on_close=False)
f.write(b"data")
f.close()                          # 关闭后文件还在，别的进程可访问
# …外部进程读 f.name…
import os
os.remove(f.name)                  # 最后手动删
```

方案二:直接 `delete=False` 然后手动 `os.remove`,配合 `with` 用不了(因为 `with` 关闭会触发删除逻辑),需要 `try/finally`。

跨平台要写"把临时文件名交给外部进程"的代码,最稳妥是 `delete=False` + 手动清理,或要求 Python 3.12+ 用 `delete_on_close=False`。

### 2.3 SpooledTemporaryFile:回滚式临时文件

`SpooledTemporaryFile` 是个"先内存、后磁盘"的回滚式临时文件。数据量小时它在内存里用一个 `io.BytesIO` / `io.StringIO` 扛着,不碰磁盘;当写入量超过 `max_size` 字节(默认 0,即总是先内存一次写)阈值或调用 `rollover()` 时,它才真正落盘成一个 `TemporaryFile`。

最大价值:**小数据走内存零 IO、无磁盘碎片;大数据超过阈值自动降级到磁盘,不会因为数据稍大就 OOM**。

签名:

```python
SpooledTemporaryFile(max_bytes=0, mode='w+b', buffering=-1, encoding=None,
                     newline=None, suffix=None, prefix=None, dir=None, *,
                     errors=None)
```

`max_bytes` 是回滚阈值。设为 0 表示"不设阈值,始终留在内存"(除非手动 `rollover`)。注意:`max_bytes` 在文本模式下按"字符"近似估,二进制按字节估,且阈值检查是在每次写之后,所以实际可能略超阈值。

小数据走内存:

```python
import tempfile

with tempfile.SpooledTemporaryFile(max_bytes=1024, mode="w+", encoding="utf-8") as f:
    f.write("少量文本\n" * 10)
    f.seek(0)
    print(f.read())
    # 此时还在内存,没产生磁盘文件
```

大数据触发回滚:

```python
import tempfile

with tempfile.SpooledTemporaryFile(max_bytes=100) as f:   # 默认 w+b
    f.write(b"x" * 200)                                     # 超过 100 字节,触发落盘
    # 现在底层已从 BytesIO 换成 TemporaryFile(匿名磁盘文件)
    f.seek(0)
    print("读回字节数:", len(f.read()))
```

```text
# 输出：
读回字节数: 200
```

怎么知道当前到底在内存还是磁盘?`SpooledTemporaryFile` 有个 `rollover()` 方法能强制落盘,也有个内部属性 `_file` 指向当前底层对象(BytesIO 或 TemporaryFile)。`rollover()` 返回落盘后的底层文件对象:

```python
import tempfile
import io

f = tempfile.SpooledTemporaryFile(max_bytes=1_000_000)   # 阈值很大,基本不会自动落盘
f.write(b"small")
print("类型:", type(f._file).__name__)                   # BytesIO（还在内存）
f.rollover()                                             # 强制落盘
print("类型:", type(f._file).__name__)                   # TemporaryFile（已落盘）
f.close()
```

```text
# 输出：
类型: BytesIO
类型: _TemporaryFileWrapper
```

一个**重要陷阱**:`SpooledTemporaryFile` 在回滚之前(仍用 BytesIO 时),底层不是真 `TemporaryFile`,因此 `name` 属性不可用(早期版本直接抛 `AttributeError`,Python 3.12 起回滚前 `name` 为 `None`)。如果你代码依赖 `.name` 交给外部进程,要么先 `rollover()` 强制落盘,要么直接用 `NamedTemporaryFile`。

另一个细节:回滚是不可逆的——一旦从内存降到磁盘,不会因为后续 `seek/写小数据` 再回内存。回滚发生时,内存里已写的内容会被搬到磁盘文件里。

### 2.4 TemporaryDirectory:临时目录

`TemporaryDirectory` 创建一个临时目录,退出 `with` 时**递归删除**整目录及里面所有内容。它是替代"手动 `mkdtemp` + `shutil.rmtree`"的高层 API。

签名:

```python
TemporaryDirectory(suffix=None, prefix=None, dir=None, ignore_cleanup_errors=False)
```

基本用法已在介绍章演示。它的 `cleanup()` 方法可手动触发清理(在 `with` 内提前清,或配合 `finally`):

```python
import tempfile

d = tempfile.TemporaryDirectory()
tmpdir = d.name
print("创建:", tmpdir)
# 用完手动清
d.cleanup()
print("清理后存在?", __import__("os").path.exists(tmpdir))
```

```text
# 输出：
创建: /tmp/tmpXXXXXX
清理后存在? False
```

`ignore_cleanup_errors`(3.10+):清理时若个别文件删不掉(比如只读文件、被占用),默认会抛错中断清理;设为 `True` 则忽略这些错误继续删剩下的,尽力而为。这在 Windows 上删临时目录时很实用——有时文件被杀软占用或权限位锁定,设这个能避免清理流程整体失败:

```python
import tempfile

with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as d:
    # 往里放点什么,包括只读文件
    target = f"{d}/readonly.txt"
    with open(target, "w") as f:
        f.write("x")
    import os
    os.chmod(target, 0o444)      # 只读
# 退出时即便只读文件不好删,ignore_cleanup_errors 也尽量清完不报错
```

经典场景——解压压缩包到临时目录处理后清理:

```python
import tempfile
import zipfile
import shutil

def extract_and_process(zip_path):
    with tempfile.TemporaryDirectory(prefix="unzip_") as workdir:
        with zipfile.ZipFile(zip_path) as zf:
            zf.extractall(workdir)
        # 遍历处理解压出来的文件
        for root, _, files in shutil.os.walk(workdir):
            for name in files:
                full = shutil.os.path.join(root, name)
                print("处理:", full)
        # with 结束整个 workdir 自动删除,无论处理中是否异常
```

这个模式比"解压到固定目录再记得删"安全得多——哪怕处理代码抛异常,`with` 退出也会清理,不会留垃圾目录占磁盘。

### 2.5 低层接口:mkstemp / mkdtemp

`mkstemp` 和 `mkdtemp` 是低层的手动管理接口。高层 API(上面四个)底层都建立在它们之上。绝大多数时候你不需要直接用它们,但理解它们的差异有助于理解高层 API 的清理机制,以及在需要"完全自己控制生命周期"时选对工具。

`mkstemp(suffix=None, prefix=None, dir=None, text=False)` 返回一个**元组 `(fd, path)`**:`fd` 是已打开的文件描述符(整数),`path` 是文件名字符串。

关键:`mkstemp` 返回的是**裸 fd**,不是 Python 文件对象,你得自己 `os.fdopen(fd)` 包装,自己负责 `close`,自己负责删除(它**不会自动删除**)。

```python
import tempfile
import os

fd, path = tempfile.mkstemp(suffix=".dat")
try:
    with os.fdopen(fd, "wb") as f:      # 把 fd 包成文件对象
        f.write(b"manual control")
    # 此时已写完并关闭 fd
    print("文件:", path)
finally:
    os.remove(path)                     # 必须自己删
```

```text
# 输出示意：
文件: /tmp/tmpXXXXXX.dat
```

`mkstemp` 的价值在于"最高级的安全保证":它用 `O_CREAT | O_EXCL` 原子创建,保证不会和已有文件冲突,且你拿到的是 fd 而非名字,避免了"ATOC-TOU"(检查名字存在 → 再打开的时间窗竞态)。安全敏感场景(如写入可执行脚本、处理用户上传的敏感文件)有时偏好它。

`mkdtemp` 类似,但创建的是目录,返回目录路径(不自动删除):

```python
import tempfile
import os
import shutil

d = tempfile.mkdtemp(prefix="job_")
try:
    # …在 d 里放东西…
    pass
finally:
    shutil.rmtree(d)                    # 自己清
```

对比关系:

| API | 自动删除 | 返回 | 适合 |
|-----|---------|------|------|
| `TemporaryFile` | 关闭即删 | 文件对象 | 匿名,单进程内用 |
| `NamedTemporaryFile` | 关闭即删(可关) | 文件对象(有 `.name`)|需名字,跨进程 |
| `SpooledTemporaryFile` | 关闭即删 | 文件对象|小数据先内存 |
| `TemporaryDirectory` | 退出即删 | 目录名(上下文)|临时目录 |
| `mkstemp` | 不删 | (fd, path)|手动控制,安全敏感 |
| `mkdtemp` | 不删 | dir path|手动目录 |

经验:能用高层就别用低层。只有当你需要"关闭后还保留 fd"、或生命周期与 `with` 块完全不能对应、或对创建原子性有特殊要求时,才考虑 `mkstemp`/`mkdtemp`。

### 2.6 临时目录查询与全局设置

`tempfile` 提供几个查询/设置临时目录位置的函数:

- `gettempdir()`:返回当前生效的临时目录路径(字符串)。
- `gettempdirb()`:`bytes` 版本。
- `gettempprefix()`:返回临时文件名前缀(通常是 `'tmp'`)。

它们返回的就是高层 API 默认存放位置。在 Linux/macOS 上通常是 `/tmp`,在 Windows 上通常是 `%TEMP%`(如 `C:\Users\xxx\AppData\Local\Temp`)。

更强大的是 `tempfile.tempdir`——一个可写的模块级变量,设它就能临时改变后续所有 `tempfile` 调用的存放目录:

```python
import tempfile

print("默认临时目录:", tempfile.gettempdir())

# 指向自己的目录(必须是已存在的目录)
tempfile.tempdir = "/tmp/myapp_tmp"   # 需要先确保该目录存在
with tempfile.NamedTemporaryFile(prefix="job_") as f:
    print("新建在:", f.name)
```

```text
# 输出示意：
默认临时目录: /var/folders/xxx/T
新建在: /tmp/myapp_tmp/job_XXXXXX
```

一个更优雅的临时切换方式是 `contextlib` 风格(3.10+ 的 `tempfile.TemporaryDirectory` 也可配合,但真正"切换全局临时目录"推荐显式赋值或用环境变量):

通过环境变量 `TMPDIR` 影响也可以——程序启动前设好 `TMPDIR=/path`,所有 `tempfile` 调用就落在那。这在容器化部署里很常见,给临时文件单独挂个 tmpfs 卷:

```bash
# 容器里
export TMPDIR=/dev/shm   # 内存盘,临时文件极快但重启即失
```

设置临时目录的场景:

第一,磁盘空间——系统 `/tmp` 可能很小,临时大文件应放到有空间的工作盘。
第二,性能——把临时目录设到 `tmpfs`(内存盘)能极大加速小临时文件读写。
第三,安全/隔离——不同租户的临时文件分到各自目录,避免互相看见。
第四,清理可控——固定到一个目录方便脚本统一清理。

### 2.7 典型场景一:测试夹具

单元测试经常需要一个"真实文件"来测文件读写逻辑,但跑完不该留垃圾。`TemporaryDirectory` 作 pytest fixture 很自然:

```python
import tempfile
import pytest

@pytest.fixture
def workdir():
    with tempfile.TemporaryDirectory(prefix="test_") as d:
        yield d          # 测试函数在这个目录里跑
    # yield 之后自动清理

def test_save_config(workdir):
    from pathlib import Path
    cfg = Path(workdir) / "config.json"
    cfg.write_text('{"k": 1}', encoding="utf-8")
    assert cfg.exists()
    assert cfg.read_text(encoding="utf-8") == '{"k": 1}'
# 测试结束 workdir 自动清空,不残留
```

```text
# 输出（pytest 运行）：
test_save_config PASSED
```

这种 fixture 让测试互不干扰(每个测试有自己的临时目录)、跑完不留痕、即使断言失败 `yield` 之后的清理也照常执行。

### 2.8 典型场景二:接收上传后处理即删

Web 应用收到用户上传的文件,常常先落盘再处理(因为上传内容可能很大、不宜全放内存),处理完即删。用 `NamedTemporaryFile` 配合手动清理:

```python
import tempfile
import os

def handle_upload(data: bytes) -> str:
    # data 可能很大,先落盘
    with tempfile.NamedTemporaryFile(prefix="upload_", delete=True, suffix=".bin") as f:
        f.write(data)
        f.flush()
        # 模拟处理:逐块读后做点什么
        f.seek(0)
        total = 0
        while chunk := f.read(8192):
            total += len(chunk)
        return f"处理了 {total} 字节"
    # with 结束临时文件删除,不残留上传内容,节省磁盘
```

这种模式相比"保存到固定 upload 目录再定时清理"更主动——文件生命周期和业务处理严格绑定,不会出现清理脚本误删正在使用的文件,也不会长时间占磁盘。

### 2.9 典型场景三:先写临时文件再原子改名

写重要文件(配置、数据库状态、缓存快照)时,直接写目标文件中途崩溃会留下损坏文件。安全做法是先写临时文件,写完再原子改名到目标:

```python
import tempfile
import os

def atomic_write(target_path, content: str):
    target = os.path.abspath(target_path)
    target_dir = os.path.dirname(target)
    # 临时文件建在与目标同目录,保证 rename 在同一文件系统上(原子性前提)
    with tempfile.NamedTemporaryFile(
        mode="w", encoding="utf-8", dir=target_dir,
        prefix=".tmp_", delete=False        # 不让 with 自动删,改名接管
    ) as f:
        f.write(content)
        f.flush()
        os.fsync(f.fileno())                # 强制刷到磁盘,防掉电丢数据
        tmp_path = f.name
    # 原子改名:要么旧文件、要么新文件,不会半成品
    os.replace(tmp_path, target)
```

```python
# 调用
atomic_write("important.json", '{"version": 2}')
```

要点:

第一,临时文件要建在和目标**同一个目录**(用 `dir=...`),因为 `os.replace` 在同一文件系统上才是原子的,跨文件系统它会退化成"复制再删",失去原子性。
第二,用 `delete=False` 接管清理,因为我们要手动 `replace` 而不是让 `with` 删它。
第三,`os.fsync(f.fileno())` 把内核页缓存刷到磁盘,保证改名前数据真的持久化,这对数据库类写至关重要。

`tempfile` 在这里的贡献是"保证临时文件名不冲突、自动选对目录权限",比手写 `tmp_xxx` 名字靠谱得多。

### 2.10 典型场景四:SpooledTemporaryFile 缓存代谢

爬虫或 ETL 把页面/记录先攒到 `SpooledTemporaryFile`,攒够一批再批量处理;数据小时全在内存快速处理,数据大时自动落盘不 OOM:

```python
import tempfile
import json

def collect_records(records):
    # max_bytes 1MB:小批次在内存,爆量自动落盘
    with tempfile.SpooledTemporaryFile(max_bytes=1_048_576, mode="w+", encoding="utf-8") as buf:
        for r in records:
            buf.write(json.dumps(r, ensure_ascii=False) + "\n")
        buf.seek(0)
        # 此时小数据在内存、大数据已落盘,统一按"文件"迭代处理
        for line in buf:
            yield json.loads(line)
```

这个模式用一个对象同时覆盖"内存快路径"和"磁盘兜底",代码不需要写两套分支。

**常见搭配 / 进阶用法**

`tempfile` 在实战中常与这些搭配:

- `subprocess`:把 `NamedTemporaryFile.name` 作为外部命令参数(交名字前记得 `flush`)。
- `shutil`:`TemporaryDirectory` 内用 `shutil.copy`/`make_archive` 操作、用 `shutil.rmtree` 配合 `mkdtemp` 清理。
- `os.fsync`:原子写场景刷盘。
- `pathlib.Path`:把临时目录名包成 `Path` 做后续路径操作。
- 测试框架 fixture:pytest 里 `yield` 临时目录,见场景一。

---

## 3. 最佳实践

### 3.1 永远用 with 管理临时资源

```python
# 推荐
with tempfile.TemporaryDirectory() as d:
    work_in(d)
# 自动清理

# 不推荐：手动 mkdtemp + try/finally，啰嗦易漏
d = tempfile.mkdtemp()
try:
    work_in(d)
finally:
    shutil.rmtree(d)
```

**原因**:`with` 让清理和生命周期严格绑定,即便业务代码抛异常也会清理。手动 `try/finally` 容易在重构时漏掉分支、或异常路径上忘记 `rmtree`,导致 `/tmp` 堆满垃圾。能用 `with` 的就别手写清理。

### 3.2 交名字给外部进程前必须 flush

```python
# 推荐
with tempfile.NamedTemporaryFile(delete=False) as f:
    f.write(payload)
    f.flush()                 # 确保数据落盘
    subprocess.run(["xx", f.name])
```

**原因**:文件对象有缓冲,`write` 后数据可能还在 Python 缓冲/内核页缓存里没写到磁盘文件,外部进程通过名字打开读到的会是空或不完整。`flush()` 把 Python 缓冲冲到操作系统(再配合 `os.fsync` 进一步冲到磁盘)。这是"跨进程共享临时文件"最常见的故障点。

### 3.3 优先高层 API，只在必要时下沉

```python
# 推荐：用 NamedTemporaryFile
f = tempfile.NamedTemporaryFile()

# 不推荐（除非真有 fd 级控制需求）：用 mkstemp
fd, path = tempfile.mkstemp()
```

**原因**:`mkstemp` 返回裸 fd,你要自己 `os.fdopen`、自己关、自己删,任何一步漏掉就泄漏 fd 或残留文件。高层 API 把这些封装干净。只有当你需要"拿到 fd 而非文件对象"、或对创建原子性、文件权限有特殊控制时,才下沉到 `mkstemp`。

### 3.4 跨平台给外部进程用，注意 Windows 锁定

```python
# 推荐（跨平台）：delete=False + 手动清理,或 3.12+ delete_on_close=False
f = tempfile.NamedTemporaryFile(delete=False, suffix=".txt")
try:
    f.write(data); f.flush()
    subprocess.run(["tool", f.name])
finally:
    f.close()
    os.remove(f.name)

# 不推荐：默认 delete=True 在 Windows 上外部进程打不开
with tempfile.NamedTemporaryFile() as f:
    f.write(data); f.flush()
    subprocess.run(["tool", f.name])   # Windows 上 PermissionError
```

**原因**:Windows 默认 `delete=True` 让文件被当前进程独占锁定,外部进程无法以名字打开。要么 `delete=False` 配手动清理,要么用 3.12 的 `delete_on_close=False`。如果你的代码要在 Windows 跑且必须交名字给外部进程,这是必须处理的。

### 3.5 原子写要把临时文件建在目标同目录

```python
# 推荐
with tempfile.NamedTemporaryFile(dir=os.path.dirname(target), delete=False) as f:
    ...
    os.replace(f.name, target)

# 不推荐：建在默认 /tmp，再 rename 到别的文件系统
with tempfile.NamedTemporaryFile(delete=False) as f:   # 可能在 /tmp
    ...
    os.replace(f.name, "/data/important.json")           # 跨文件系统，退化成复制+删
```

**原因**:`os.replace`/`rename` 只有在**同一文件系统**上才是原子的;跨文件系统它退化成"复制再删",中间窗口若有崩溃或断电,可能两边都不完整,原子性丧失。把临时文件建在目标同目录(`dir=` 目标目录),保证 `replace` 在同文件系统,才有真正原子保证。

### 3.6 SpooledTemporaryFile 别依赖 .name

```python
# 推荐：需要名字就 rollover 或直接用 NamedTemporaryFile
f = tempfile.SpooledTemporaryFile(max_bytes=1_000_000)
f.rollover()                 # 强制落盘
do_something(f.name)

# 不推荐：回滚前直接用 .name
f = tempfile.SpooledTemporaryFile(max_bytes=1_000_000)
f.write(b"small")
print(f.name)                # 3.12 前可能 AttributeError，3.12 是 None
```

**原因**:`SpooledTemporaryFile` 在内存阶段底层是 `BytesIO`/`StringIO`,没有文件名属性。回滚前 `.name` 不可用。如果你的逻辑要靠文件名交给外部进程,强制 `rollover()` 落盘,或干脆用 `NamedTemporaryFile`——后者一开始就在磁盘。

### 3.7 留意临时目录的磁盘与权限

```python
# 推荐：显式指定 dir 指向有空间/权限的目录
with tempfile.TemporaryDirectory(dir="/data/tmp") as d:
    produce_big_files(d)

# 不推荐：盲目用系统 /tmp：可能小、可能满了、可能被定时清理脚本误删
with tempfile.TemporaryDirectory() as d:
    produce_big_files(d)
```

**原因**:系统 `/tmp` 常是小分区,写大临时文件可能撑爆它进而影响整机。生产环境应把临时目录指向有足够空间且你自己掌控清理节奏的位置。同时注意权限——存放敏感临时文件的目录权限要收紧,避免其他用户读到。

---

## 4. 原理

### 4.1 TemporaryFile 为什么"匿名"：POSIX 的先建后删

`TemporaryFile` 在 POSIX 系统上的"匿名"实现,充分体现了 Unix 文件系统的精妙:一个文件可以**没有名字但仍然存在**。

实现路径大致是:

1. 用 `os.open` 在临时目录创建一个唯一文件,flags 含 `O_RDWR | O_CREAT | O_EXCL`。`O_EXCL` 保证只有当文件不存在时才创建成功——这避免了和并发别的 `tempfile` 调用撞名,是原子安全的关键。
2. 创建成功后,**立即 `os.unlink`** 这个文件。`unlink` 删的是"目录项"(文件名字),但只要还有进程持有打开的文件描述符(fd),文件的 inode 和数据就继续存在。
3. `TemporaryFile` 把这个 fd 包成 Python 文件对象返回给你。
4. 你正常读写、seek。
5. 当你关闭文件(或进程退出,fd 被回收),最后一个指向 inode 的引用消失,系统**自动回收文件占用的磁盘空间**。

结果就是:文件从创建到删除之间,文件系统里**没有任何名字指向它**——别人 `ls /tmp` 看不到它、别的进程无法通过路径打开它(因为没路径),但你的程序通过 fd 仍能用它。这就是"匿名临时文件"。

这种设计带来两个直接好处:

第一,**自动清理绝对可靠**。不需要在 `finally` 里 `os.remove`,只要你关闭 fd(哪怕进程崩溃、被 `kill -9`),操作系统都会回收空间。不存在"忘了删导致垃圾堆积"的可能。
第二,**安全隔离**。别的进程无法通过名字抢先打开你的临时文件做坏事(经典的临时文件符号链接攻击在你这里无效,因为根本没名字可被替换)。

为什么创建后能立刻 `unlink` 而文件还在?这是 Unix 文件系统的核心分离:文件名(目录项)和文件实体(inode)是分开的,一个 inode 可以有零到多个名字(硬链接),`unlink` 只减一个引用计数,计数到 0 且无 fd 引用才真删。`O_EXCL` + 立即 `unlink` 把引用计数在创建瞬间就降到 0,但你的 fd 维持了"fd 引用",所以文件存活。

Windows 上没有"`unlink` 后 fd 仍可用"的等价机制(Windows 删一个被打开的文件会失败),所以 `TemporaryFile` 在 Windows 上保留文件名、退化为类似 `NamedTemporaryFile` 的实现,只是名字细节被封装不暴露。这就是平台差异的根源——同一 API、不同实现机理。

### 4.2 NamedTemporaryFile 的 delete 时机与 Windows 锁定

`NamedTemporaryFile` 因为要暴露名字,不能走"立即 unlink"那条路——名字得留着给外部进程用。它的实现是创建文件并保留目录项,删除交给"关闭时"。

`delete=True`(默认)时,关闭文件对象的 `close` 会触发删除:`os.unlink(self.name)`。这个删除发生在 `with` 退出或显式 `.close()` 时。问题就在 Windows:Windows 不允许删除一个仍被打开的文件,而 `with` 块里文件一直开着,所以你在 `with` 内部就不可能把它交给另一个会试图独占打开/删除它的流程;更麻烦的是你把名字给外部进程,外部进程想打开它,Windows 会因为你的进程还开着它而拒绝(默认共享模式拒绝他人打开)。

`delete_on_close`(3.12 新增)正是为解决这个:它把"删除文件"和"关闭文件"解耦。设 `delete_on_close=False` 时,`close` 不删文件,文件留存且已被关闭,此时外部进程能正常打开它(不再被你独占);文件最终由你手动 `os.remove`,或由操作系统在重启时清 `/tmp`(取决于位置)。

这个演进的深层教训是:**临时文件"自动删除"和"跨进程共享"在 Windows 上天然冲突**,因为 Windows 文件锁定模型和 POSIX 的 `unlink` 模型不同。理解这一点,你就能在不同平台选对 `delete` / `delete_on_close` / `delete=False` 的组合,而不是被"为什么 Windows 上报错"绊住。

### 4.3 SpooledTemporaryFile 的回滚机制

`SpooledTemporaryFile` 内部维护一个 `_file` 属性,初始指向 `io.BytesIO`(二进制模式)或 `io.StringIO`(文本模式)。这是一种"装饰器/代理"结构——`SpooledTemporaryFile` 自己实现了文件对象的接口(`write`、`read`、`seek` 等),内部把调用转发给 `_file`。

每次 `write` 后,它检查已写数据量是否超过 `max_bytes`:

```python
def write(self, data):
    self._file.write(data)
    if self._max_size and self._file.tell() > self._max_size:
        self.rollover()
    return ...
```

`rollover()` 做的是"内存 → 磁盘"的迁移:

1. 创建一个新的 `TemporaryFile`(底层走第一节那套匿名机制)。
2. 把当前 `_file`(BytesIO)的内容写到新磁盘文件。
3. 把 `_file` 重新指向那个磁盘文件对象。
4. 后续所有操作都转发给磁盘文件。

迁移完成后,原来在内存里的数据已经被"拷贝"到磁盘,内存那部分可以释放。迁移是**一次性、不可逆**的——一旦落盘,即便你后续 `seek(0)` 重写更少数据,也不会再回内存(回内存没意义,因为已经突破过阈值说明数据可能大)。

这个设计精妙之处在于:**对用户透明**。用户的代码无论 `SpooledTemporaryFile` 处于内存还是磁盘阶段,用的都是同一套 `write/read/seek` 接口,不需要写分支。`SpooledTemporaryFile` 把"小数据快路径"和"大数据兜底"用一个对象统一起来,代价是回滚时的拷贝开销(一次性,通常可接受)。

回滚的阈值检查有个细节:它用 `tell()` 估算当前大小,对二进制是精确字节,对文本模式是字符数(不完全等于字节数,因为多字节编码)。所以文本模式下的 `max_bytes` 只是近似——可能会在略超过字节数时才触发,或提前触发。实践中 `max_bytes` 通常设大一点的整数(如 1MB、10MB)以留余量,不必精确。

### 4.4 mkstemp 的原子安全与 O_EXCL

低层 `mkstemp` 的安全核心是 `O_EXCL` flag。它的语义是:"仅当文件**不存在**时才创建,否则失败"。加上 `O_CREAT`,这给了我们一个**原子的"创建新文件"操作**——检查存在和创建文件是同一个系统调用完成,中间没有窗口。

这为什么重要?想象一个不安全的临时文件创建:

```python
import os
name = "/tmp/myapp_tmp"
if not os.path.exists(name):       # 步骤1:检查不存在
    f = open(name, "w")             # 步骤2:创建——但有窗口!
```

在步骤 1 和步骤 2 之间,攻击者可以抢先创建一个指向敏感文件的符号链接 `/tmp/myapp_tmp → /etc/passwd`,于是你的步骤 2 会**覆盖 `/etc/passwd`**(典型的"符号链接攻击")。这就是 TOCTOU(time-of-check-to-time-of-use)竞态。

`mkstemp` 把"检查不存在"和"创建"合一,中间没有可被插入的窗口,攻击者无法抢占。这就是为什么它返回的是 `(fd, path)`——它能认证"这个 fd 就是我原子创建的文件",不给任何人掉包机会。

高层 API(`TemporaryFile` 等)底层也都用 `mkstemp` 或等价的 `O_EXCL` 机制,因此继承了这层安全。这也是 `tempfile` 相对手写 `open("/tmp/xxx","w")` 的重要胜利——它默认抗符号链接攻击和名字竞态。

理解了这个原理,你就明白为什么"临时文件创建一定要用 `tempfile` 而不是手写名字":手写名字几乎一定会有竞态窗口,而 `tempfile` 用 `O_EXCL` 把它堵死。

### 4.5 TemporaryDirectory 的清理与 ignore_cleanup_errors

`TemporaryDirectory` 在 `__exit__`(或 `cleanup`)时调用 `shutil.rmtree(self.name)` 递归删除整目录。`shutil.rmtree` 内部是"先列条目 → 逐个删 → 删子目录 → 删自身"的深度优先删除。

清理最常失败在两处:

第一,**只读文件**。POSIX 上删一个只读文件,如果父目录可写,`unlink` 仍能成功(权限看父目录不看文件本身)。但 Windows 上文件只读会导致删除失败。
第二,**被占用文件**。Windows 上文件被某进程打开则不可删。

`ignore_cleanup_errors=True`(3.10+)的处理是:遍历删除时,对每个碰到 `OSError` 的条目,捕获并跳过,继续删剩下的。它还可能在必要时 `os.chmod` 改写权限再删。这把"清理"从"全部删成或整体失败"变成"尽力删,删不掉的忽略",显著提升 Windows 上的鲁棒性。

代价是:`ignore_cleanup_errors=True` 可能让部分文件残留(删不掉的)。它在"不让清理流程拖垮主流程"和"彻底清理"之间偏向前者,所以名字叫"忽略清理错误"而非"保证清理"。生产里对 Windows 临时目录清理常开这个;对严格要求不留痕迹的场景(比如含敏感数据)则宁可让清理抛错暴露问题,反而要关掉它。

清理顺序也有个细节:`TemporaryDirectory` 的 `cleanup` 默认会在 Python 正常退出时通过 `atexit` 注册再清一次(防止用户忘了 `with` 或 `cleanup`)。这意味着即便你忘了 `with`,解释器退出时也会尝试清理——这是最后一道防线,虽然不如 `with` 及时可靠。

---

## 5. 总结

- `tempfile` 是处理短生命周期临时资源的官方模块,自动在系统临时目录创建唯一文件/目录、自动清理、抗名字竞态。
- 四件套:`TemporaryFile`(匿名、关闭即删)、`NamedTemporaryFile`(具名、可交外部进程、`delete` 控制删除)、`SpooledTemporaryFile`(先内存后磁盘、超过 `max_size` 回滚)、`TemporaryDirectory`(临时目录、退出递归删除)。
- 默认模式 `w+b`(二进制读写)跨平台最稳;文本模式要显式传 `mode="w+", encoding=...`。
- `prefix`/`suffix`/`dir` 控制名字形式与位置,`gettempdir`/`tempfile.tempdir` 查询或全局切换临时目录。
- 低层 `mkstemp`(返回 fd+path、不自动删、`O_EXCL` 原子安全)和 `mkdtemp`(目录、不自动删)只在需要 fd 级控制或手动生命周期时用。
- 典型场景:测试 fixture、上传先落盘后删、原子写(`tmp + fsync + replace`,临时文件须与目标同目录)、Spooled 缓存代谢。
- 原理:`TemporaryFile` 借 POSIX `open + 立即 unlink` 实现"匿名+关闭即自动回收";Windows 无此机制故保留名字;`NamedTemporaryFile` 的 delete/delete_on_close 在 Windows 上与跨进程共享存在锁定冲突;`SpooledTemporaryFile` 用代理转发 `_file`、`rollover` 时把内存内容搬到磁盘文件;`mkstemp` 用 `O_EXCL` 原子创建抗符号链接攻击;`TemporaryDirectory` 用 `shutil.rmtree` 递归删、`ignore_cleanup_errors` 在 Windows 上尽力删。
- 最佳实践:用 `with` 管理、交外部进程前 `flush`、优先高层 API、跨平台注意 Windows 锁定、原子写临时文件与目标同目录、`SpooledTemporaryFile` 别回滚前依赖 `.name`、临时目录留意磁盘空间与权限。
- 读完本文你应能掌握:按场景在四件套与低层 API 间正确选型;解释 `TemporaryFile` 为何"匿名"及平台差异来源;跨平台安全地用临时文件给外部进程;用 `tmp + fsync + os.replace` 做原子写;设置临时目录位置;并说清 `delete`/`delete_on_close`/`max_size`/`ignore_cleanup_errors` 各参数的机理与取舍。