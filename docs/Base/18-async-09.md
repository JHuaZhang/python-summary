---
group:
  title: 【18】异步协程
  order: 18
order: 9
title: aiofiles 异步文件读写
nav:
  title: Python
  order: 1
---

## 1. 介绍

### 1.1 为什么需要异步文件读写

在 Python 异步编程（`asyncio`）中，事件循环（event loop）运行在单一线程里，所有协程任务都由这个线程轮流驱动。当一个协程"让出"控制权（`await`）时，事件循环就去执行其它就绪的协程，这就是并发的来源。这种调度模型有一个前提：**协程在"做事"时不能长时间霸占线程**，否则后面的协程就只能排队干等。

网络 IO 天生符合这个前提——socket 读写有操作系统的 `epoll`/`kqueue` 就绪通知，数据没来时 `await` 会立即挂起协程，事件循环立刻去干别的。但文件 IO 不一样：标准内置的 `open()` 返回的是阻塞型文件对象，调用 `f.read()` 时，当前线程会一直卡在内核的磁盘读取调用上，直到数据返回。这个等待可能只是几毫秒，也可能在机械硬盘、网络盘、NFS 上长达数百毫秒甚至更久。

问题就在这里：如果你的协程直接调用 `f.read()`，在它返回之前，整个事件循环被冻结——网络协程收不了包、定时任务到点跑不了、其它协程全部停滞。一个"读写本地文件"的操作，竟然把整个异步程序卡成同步程序。

```python
import asyncio
import time

async def blocking_file_read(path):
    # 这是错误示范：在内置 open 上直接 read，整段调用是阻塞的
    with open(path, 'r') as f:        # 阻塞打开
        data = f.read()               # 阻塞读取，事件循环在此期间无法切换
    return data

async def tick():
    # 一个每 0.1 秒打印一次的"心跳"协程，用来观察事件循环是否被卡住
    while True:
        print("tick", time.strftime("%H:%M:%S"))
        await asyncio.sleep(0.1)

async def main():
    task = asyncio.create_task(tick())
    await asyncio.sleep(0.3)              # 让心跳先跑起来
    await blocking_file_read('/tmp/big.bin')  # 读取大文件期间，心跳会沉默
    await asyncio.sleep(0.3)
    task.cancel()

# asyncio.run(main())
```

上面这段代码的问题在于：`blocking_file_read` 里用的是内置 `open`，`f.read()` 是一个同步阻塞调用。即使它被写在 `async def` 函数里，也并不会自动变成异步——`async` 关键字只赋予函数"可以被 `await`"的能力，并不会让函数体内的阻塞调用挂起。所以读取大文件的那段时间，事件循环被钉死在 `f.read()` 上，`tick` 协程根本得不到调度。

`aiofiles` 就是为解决这个问题而生的第三方库。它提供了一套与内置 `open` 用法高度一致的异步文件 API：`async with aiofiles.open(...) as f:` 打开文件，`await f.read()` / `await f.write(...)` 读写。在 `await` 的瞬间，事件循环被释放，可以去执行其它协程；当底层文件 IO 完成后，事件循环再回来继续这个协程。

**一句话定位**：aiofiles 把阻塞的文件 IO 包装成 `await` 形式，让文件读写也能参与 asyncio 的并发调度，不再卡住事件循环。

### 1.2 aiofiles 的安装与最小用法

安装：

```bash
pip install aiofiles
```

最小可运行示例——异步写入并读回一个文件：

```python
import asyncio
import aiofiles

async def main():
    # 异步写：async with 管理文件的打开与关闭，await f.write 真正落盘前让出事件循环
    async with aiofiles.open('/tmp/hello.txt', 'w', encoding='utf-8') as f:
        await f.write('aiofiles 你好\n')
        await f.write('这是第二行\n')

    # 异步读：await f.read() 在数据就绪前挂起，事件循环可去跑别的协程
    async with aiofiles.open('/tmp/hello.txt', 'r', encoding='utf-8') as f:
        content = await f.read()
        print(content)

asyncio.run(main())
# 输出：
# aiofiles 你好
# 这是第二行
```

这段代码长得和内置 `open` 几乎一样，只多了三个 `async` / `await` 关键字。但行为上有本质区别：每一次 `await f.write(...)`、`await f.read()` 都是一个可被中断的异步操作，而不是一个把线程钉死的同步调用。这就是 aiofiles 的全部"门面"——用 `async`/`await` 语法包装文件 IO，使其融入 asyncio 事件循环。

## 2. 核心内容

### 2.1 aiofiles.open —— 异步打开文件

`aiofiles.open` 是整个库的入口，作用与内置 `open` 一致：打开（必要时创建）文件，返回一个异步文件对象。它的签名几乎照搬内置 `open`：

```
aiofiles.open(file, mode='r', buffering=-1, encoding=None, errors=None,
              newline=None, closefd=True, opener=None, *, loop=None)
```

**参数说明**：

| 参数 | 含义 | 与内置 `open` 的差异 |
|------|------|---------------------|
| `file` | 文件路径（str/Path）或文件描述符 | 无差异 |
| `mode` | 打开模式，如 `'r'`/`'w'`/`'a'`/`'rb'`/`'wb'` | 无差异 |
| `buffering` | 缓冲策略，`-1` 默认、`0` 无缓冲（仅二进制）、`>0` 行缓冲大小 | 无差异 |
| `encoding` | 文本模式编码，如 `'utf-8'`、`'gbk'` | 无差异 |
| `errors` | 编解码错误处理，如 `'strict'`、`'ignore'`、`'replace'` | 无差异 |
| `newline` | 文本模式换行符处理 | 无差异 |
| `closefd` | 传入文件描述符时是否关闭 fd | 无差异 |
| `opener` | 自定义 opener 可调用对象 | 无差异 |
| `loop` | 指定事件循环（已弃用，新版本自动取当前循环） | aiofiles 独有，一般不传 |

返回值是一个 `aiofiles.base.AiofilesContextManager`，它既是异步上下文管理器（支持 `async with`），也支持 `await` 直接取文件对象（即 `f = await aiofiles.open(...)`，此时需手动 `await f.close()`）。

**mode 常用取值一览**：

| mode | 含义 | 文件不存在时 | 文件已存在时 |
|------|------|-------------|-------------|
| `'r'` | 只读文本 | 抛 `FileNotFoundError` | 从头读 |
| `'w'` | 只写文本 | 创建 | 清空原内容 |
| `'a'` | 追加文本 | 创建 | 在末尾追加 |
| `'x'` | 独占创建文本 | 创建 | 抛 `FileExistsError` |
| `'r+'` | 读写文本 | 抛错 | 不清空，可读写 |
| `'rb'`/`'wb'`/`'ab'` | 二进制读/写/追加 | 同文本对应模式 | 同文本对应模式 |

最常用的两种打开方式对比：

```python
import asyncio
import aiofiles

async def open_with_context_manager(path):
    # 推荐：async with 自动管理关闭，即使中间抛异常也会关闭
    async with aiofiles.open(path, 'r', encoding='utf-8') as f:
        return await f.read()

async def open_with_await(path):
    # 不推荐：需手动 close，容易在异常路径下漏关
    f = await aiofiles.open(path, 'r', encoding='utf-8')
    try:
        return await f.read()
    finally:
        await f.close()
```

两种写法等价，但 `async with` 更安全、更简洁，实际编码几乎总是用第一种。

**最小 demo：追加写入日志行**

```python
import asyncio
import aiofiles
import time

async def append_log(path, line):
    async with aiofiles.open(path, 'a', encoding='utf-8') as f:
        await f.write(f'{time.strftime("%H:%M:%S")} {line}\n')

async def main():
    await append_log('/tmp/app.log', '服务启动')
    await append_log('/tmp/app.log', '收到请求')
    await append_log('/tmp/app.log', '处理完成')

    async with aiofiles.open('/tmp/app.log', 'r', encoding='utf-8') as f:
        print(await f.read())

asyncio.run(main())
# 输出：
# 14:02:11 服务启动
# 14:02:11 收到请求
# 14:02:11 处理完成
```

这个 demo 展示了 `'a'` 追加模式的典型场景：逐条写日志。每次调用 `append_log` 都以追加方式打开文件、写一行、关闭。多次打开同一文件追加不会互相覆盖，内容按写入顺序累加。

### 2.2 异步文件对象的读方法

`aiofiles.open` 返回的异步文件对象提供了一组与内置文件对象同名的读方法，区别在于它们都是协程，必须 `await` 调用。

**read —— 读取全部或指定长度**

`await f.read(size=-1)`：`size` 省略或为 `-1` 时读取文件全部内容；传入正整数时最多读取 `size` 字节（二进制）或 `size` 字符（文本）。

```python
import asyncio
import aiofiles

async def main():
    # 先准备一个测试文件
    async with aiofiles.open('/tmp/nums.txt', 'w', encoding='utf-8') as f:
        await f.write('0123456789' * 5)   # 50 个字符

    async with aiofiles.open('/tmp/nums.txt', 'r', encoding='utf-8') as f:
        head = await f.read(10)           # 只读前 10 个字符
        print('head =', head)
        rest = await f.read()             # 读剩下的全部
        print('rest length =', len(rest))

asyncio.run(main())
# 输出：
# head = 0123456789
# rest length = 40
```

读方法是"游标式"的——每次 `read` 从上一次读完的位置继续。上面先读 10 个字符，再读剩下的，正好得到全文件。这一点和内置文件对象完全一致。

**readline —— 读一行**

`await f.readline()`：读取到换行符（含换行符）为止。文件末尾返回空字符串 `''`。

```python
import asyncio
import aiofiles

async def main():
    async with aiofiles.open('/tmp/lines.txt', 'w', encoding='utf-8') as f:
        await f.write('第一行\n第二行\n第三行\n')

    async with aiofiles.open('/tmp/lines.txt', 'r', encoding='utf-8') as f:
        while True:
            line = await f.readline()
            if not line:               # 空串表示文件结束
                break
            print('行：', line.rstrip())

asyncio.run(main())
# 输出：
# 行： 第一行
# 行： 第二行
# 行： 第三行
```

`readline` 适合处理行结构清晰但不适合一次性全读入内存的大文件（如日志）。逐行读、逐行处理，内存占用恒定。

**readlines —— 读所有行**

`await f.readlines()`：读取全部行，返回列表。等价于 `list(await f.read().splitlines(keepends=True))`，但更直观。

```python
import asyncio
import aiofiles

async def main():
    async with aiofiles.open('/tmp/lines.txt', 'r', encoding='utf-8') as f:
        lines = await f.readlines()
        print('共', len(lines), '行')
        for i, line in enumerate(lines, 1):
            print(i, repr(line))

asyncio.run(main())
# 输出：
# 共 3 行
# 1 '第一行\n'
# 2 '第二行\n'
# 3 '第三行\n'
```

注意 `readlines` 会把整个文件读进内存并切成列表，文件很大时不适用。大文件请用 `readline` 循环或分块 `read(size)`。

**异步迭代 —— 逐行 await**

异步文件对象本身是异步可迭代的，可以用 `async for line in f:` 逐行读，每一步都是 `await`，事件循环在每行之间可切换：

```python
import asyncio
import aiofiles

async def main():
    async with aiofiles.open('/tmp/lines.txt', 'r', encoding='utf-8') as f:
        async for line in f:
            print('迭代到：', line.rstrip())

asyncio.run(main())
# 输出：
# 迭代到： 第一行
# 迭代到： 第二行
# 迭代到： 第三行
```

`async for` 是处理大文本文件最优雅的写法：既不把文件一次性读进内存，又能在每行之间让出事件循环，让其它协程有机会运行。

### 2.3 异步文件对象的写方法

**write —— 写入字符串或字节串**

`await f.write(data)`：把 `data` 写入文件。文本模式写 `str`，二进制模式写 `bytes`。返回实际写入的字符数/字节数。

```python
import asyncio
import aiofiles

async def main():
    async with aiofiles.open('/tmp/write_demo.txt', 'w', encoding='utf-8') as f:
        n1 = await f.write('abc')
        n2 = await f.write('中文')
        print('本次写入字符数：', n1, n2)

    async with aiofiles.open('/tmp/write_demo.bin', 'wb') as f:
        n = await f.write(b'\x00\x01\x02ABC')
        print('写入字节数：', n)

asyncio.run(main())
# 输出：
# 本次写入字符数： 3 2
# 写入字节数： 6
```

注意 `write` 只是写入到对象的内部缓冲，**是否立即落盘取决于缓冲模式和操作系统**。普通文本/二进制写入默认有缓冲，数据可能还停在用户态缓冲区里。`async with` 退出时会关闭文件，关闭过程会触发缓冲刷新（flush），所以正常退出上下文后数据是安全的。但在异常或特殊场景下，显式 `await f.flush()` 更稳妥。

**writelines —— 批量写多行**

`await f.writelines(lines)`：把可迭代对象 `lines` 中的每一项依次写出。注意它**不会自动加换行符**——要不要换行由你自己决定，这一点和内置 `writelines` 一致。

```python
import asyncio
import aiofiles

async def main():
    # 准备一批行，每行末尾自己加 \n
    lines = [f'第 {i} 行\n' for i in range(1, 4)]
    async with aiofiles.open('/tmp/wl.txt', 'w', encoding='utf-8') as f:
        await f.writelines(lines)

    async with aiofiles.open('/tmp/wl.txt', 'r', encoding='utf-8') as f:
        print(await f.read())

asyncio.run(main())
# 输出：
# 第 1 行
# 第 2 行
# 第 3 行
```

**flush —— 强制刷新缓冲**

`await f.flush()`：把用户态缓冲区里尚未落盘的数据强制写到操作系统内核缓冲。这只是一个"把数据交给 OS"的动作，并不保证物理落盘（那是 `fsync` 的事），但能保证 `async with` 结束前数据不丢。

```python
import asyncio
import aiofiles

async def main():
    async with aiofiles.open('/tmp/flush_demo.txt', 'w', encoding='utf-8') as f:
        await f.write('重要数据')
        await f.flush()           # 立即把缓冲推到 OS，进程崩溃也不丢这一段
        await f.write('更多数据')
        # 退出 async with 时会自动 flush + close

asyncio.run(main())
```

**seek / tell —— 移动与查询游标**

`await f.seek(offset, whence=0)` 移动读写游标；`await f.tell()` 返回当前游标位置。语义与内置文件对象的 `seek`/`tell` 完全一致，`whence` 取值 `0`（头）、`1`（当前）、`2`（尾）。

```python
import asyncio
import aiofiles

async def main():
    async with aiofiles.open('/tmp/seek.txt', 'wb') as f:
        await f.write(b'ABCDEFGHIJ')      # 10 字节

    async with aiofiles.open('/tmp/seek.txt', 'r+b') as f:
        await f.seek(3)                   # 游标移到第 3 字节 'D'
        print('修改前位置：', await f.tell())
        await f.write(b'XX')              # 覆盖 'DE' -> 'XX'
        await f.seek(0)
        print('修改后内容：', await f.read())

asyncio.run(main())
# 输出：
# 修改前位置： 3
# 修改后内容： b'ABCXXFGHIJ'
```

`seek` 在"随机定位修改"场景下必不可少，比如修改二进制文件的某个固定偏移处，而不重写整个文件。

### 2.4 分块读写大文件

文件很大时（几百 MB 到 GB），一次性 `await f.read()` 会把全部数据塞进内存，既浪费内存，也可能直接 `MemoryError`。正确做法是分块读写：每次只读/写固定大小的块，循环直到完成。

**分块读**

```python
import asyncio
import aiofiles

async def read_in_chunks(path, chunk_size=64 * 1024):
    # 每次最多读 64KB，循环到文件结束
    total = 0
    async with aiofiles.open(path, 'rb') as f:
        while True:
            chunk = await f.read(chunk_size)
            if not chunk:           # 空字节串表示读完
                break
            total += len(chunk)
            # 这里可以对接业务：解压、计算哈希、转发到网络……
    return total

async def main():
    size = await read_in_chunks('/tmp/big.bin')
    print('共读取字节：', size)

# asyncio.run(main())
```

分块读的关键点有两个：一是 `chunk_size` 要适中，太小则 `await` 次数过多、调度开销大，太大则单次阻塞时间长、失去异步意义，一般取 64KB ~ 1MB；二是读到的 `chunk` 要立刻处理或转走，不要在内存里堆积所有块，否则等于没分块。

**分块写**

```python
import asyncio
import aiofiles

async def write_in_chunks(path, data: bytes, chunk_size=64 * 1024):
    async with aiofiles.open(path, 'wb') as f:
        for offset in range(0, len(data), chunk_size):
            chunk = data[offset:offset + chunk_size]
            await f.write(chunk)        # 每写一块让出一次事件循环

async def main():
    payload = b'\x41' * (1024 * 1024)   # 1MB 数据
    await write_in_chunks('/tmp/out.bin', payload)
    print('写完')

# asyncio.run(main())
```

典型场景是"边从网络下载边落盘"：aiohttp 拿到一块响应体就 `await f.write(chunk)` 一块，既不把整个响应攒在内存，也不阻塞网络协程。

### 2.5 与其它异步任务并发

aiofiles 真正的价值不在于"单个文件读写得更快"——单文件读写受磁盘限制，异步并不会让磁盘转得更快。它的价值在于**让文件 IO 不再阻塞事件循环，从而能与其它异步任务（网络请求、定时任务、消息处理）并行推进**。

**并发写多个文件**

用 `asyncio.gather` 同时写多个文件，每个文件在各自的线程池任务里落盘，事件循环在它们之间切换：

```python
import asyncio
import aiofiles
import time

async def write_file(path, lines):
    async with aiofiles.open(path, 'w', encoding='utf-8') as f:
        for line in lines:
            await f.write(line + '\n')
    return path

async def main():
    tasks = []
    for i in range(5):
        path = f'/tmp/par_{i}.txt'
        lines = [f'文件{i} 第{j}行' for j in range(1000)]
        tasks.append(write_file(path, lines))

    start = time.perf_counter()
    done = await asyncio.gather(*tasks)
    elapsed = time.perf_counter() - start
    print(f'共写 {len(done)} 个文件，耗时 {elapsed:.3f}s')

asyncio.run(main())
# 输出：
# 共写 5 个文件，耗时 0.012s
```

并发写多个文件时，总耗时大致等于"最慢的那一个"，而不是"五个加起来"。这就是并发相对于串行的收益。

**文件读写不阻塞网络协程**

下面这个对比最能说明问题：一个协程在写大文件，另一个协程在按固定节奏发网络心跳。用阻塞 `open` 写时心跳会被卡住；用 `aiofiles` 写时心跳照常。

```python
import asyncio
import aiofiles
import time

async def heartbeat():
    # 每 0.2 秒打印一次，用来观察事件循环是否被阻塞
    for i in range(8):
        print(f'心跳 {i} {time.strftime("%H:%M:%S.%f")[:-3]}')
        await asyncio.sleep(0.2)

async def write_big_with_aiofiles():
    # 用 aiofiles 写，每次 await f.write 都让出事件循环
    payload = 'x' * 1_000_000
    async with aiofiles.open('/tmp/big_aio.txt', 'w', encoding='utf-8') as f:
        for _ in range(10):
            await f.write(payload)
    print('aiofiles 写完')

async def main():
    t1 = asyncio.create_task(heartbeat())
    t2 = asyncio.create_task(write_big_with_aiofiles())
    await asyncio.gather(t1, t2)

asyncio.run(main())
# 输出（心跳节奏大致稳定，不被写文件打断）：
# 心跳 0 14:05:01.012
# 心跳 1 14:05:01.214
# 心跳 2 14:05:01.417
# 心跳 3 14:05:01.620
# aiofiles 写完
# 心跳 4 14:05:01.823
# 心跳 5 14:05:02.026
# 心跳 6 14:05:02.229
# 心跳 7 14:05:02.432
```

把同样的场景改成阻塞 `open` 试一下：

```python
import asyncio
import time

async def heartbeat():
    for i in range(8):
        print(f'心跳 {i} {time.strftime("%H:%M:%S.%f")[:-3]}')
        await asyncio.sleep(0.2)

async def write_big_blocking():
    # 错误示范：内置 open + 同步 write，事件循环被钉死
    payload = 'x' * 1_000_000
    with open('/tmp/big_blk.txt', 'w', encoding='utf-8') as f:
        for _ in range(10):
            f.write(payload)
    print('阻塞写完')

async def main():
    t1 = asyncio.create_task(heartbeat())
    t2 = asyncio.create_task(write_big_blocking())
    await asyncio.gather(t1, t2)

# asyncio.run(main())
# 输出（心跳在写文件期间出现一段沉默，事件循环被卡）：
# 心跳 0 14:05:10.001
# 心跳 1 14:05:10.204
# 阻塞写完
# 心跳 2 14:05:10.980        <-- 这一下比预期晚了近 0.6 秒
# 心跳 3 14:05:11.182
# ...
```

对比两个输出可以看到：阻塞写期间心跳协程被迫排队；aiofiles 写期间心跳准时。这就是"异步文件 IO 不阻塞事件循环"的含义。

### 2.6 与 aiohttp 配合：下载并发落盘

实际工程中最常见的 aiofiles 用法之一：用 aiohttp 并发下载多个文件，每个响应流式分块写入本地文件。网络读取和磁盘写入都是异步的，互不阻塞。

```python
import asyncio
import aiofiles
import aiohttp

async def download_one(session, url, save_path):
    # 一个文件的下载 + 落盘全部异步，网络等待和磁盘写入都不阻塞事件循环
    async with session.get(url) as resp:
        resp.raise_for_status()
        async with aiofiles.open(save_path, 'wb') as f:
            async for chunk in resp.content.iter_chunked(64 * 1024):
                await f.write(chunk)        # 每拿到一块就落盘，内存占用恒定
    return save_path

async def main():
    urls = [
        ('https://example.com/a.zip', '/tmp/a.zip'),
        ('https://example.com/b.zip', '/tmp/b.zip'),
        ('https://example.com/c.zip', '/tmp/c.zip'),
    ]
    async with aiohttp.ClientSession() as session:
        tasks = [download_one(session, url, path) for url, path in urls]
        results = await asyncio.gather(*tasks)
        print('全部下载完成：', results)

# asyncio.run(main())
# 输出：
# 全部下载完成： ['/tmp/a.zip', '/tmp/b.zip', '/tmp/c.zip']
```

这段代码体现了 aiofiles 的核心价值：**下载任务之间是并发的，下载与落盘之间也是交错的，整个过程中事件循环始终在运转**，没有一个协程被另一个协程的磁盘写入卡住。

### 2.7 与 pathlib 的搭配

`pathlib.Path` 负责路径构造、存在性判断、目录遍历等纯路径逻辑；`aiofiles` 负责实际的读写 IO。两者职责分明，搭配使用非常自然——`aiofiles.open` 接受 `str` 也接受 `Path` 对象。

```python
import asyncio
import aiofiles
from pathlib import Path

async def dump_dir_to_log(dir_path: Path, log_path: Path):
    # 用 pathlib 做路径操作：列目录、判断存在
    if not dir_path.is_dir():
        raise FileNotFoundError(dir_path)

    file_list = sorted(p.name for p in dir_path.iterdir() if p.is_file())

    # 用 aiofiles 做实际写入：异步、不阻塞事件循环
    async with aiofiles.open(log_path, 'w', encoding='utf-8') as f:
        await f.write(f'{dir_path} 目录清单\n')
        for name in file_list:
            await f.write(f'- {name}\n')

async def main():
    base = Path('/tmp/aiofiles_demo')
    base.mkdir(exist_ok=True)
    (base / 'a.txt').write_text('hello', encoding='utf-8')   # 这里只是准备数据，用同步即可
    (base / 'b.txt').write_text('world', encoding='utf-8')

    await dump_dir_to_log(base, base / 'listing.txt')

    async with aiofiles.open(base / 'listing.txt', 'r', encoding='utf-8') as f:
        print(await f.read())

asyncio.run(main())
# 输出：
# /tmp/aiofiles_demo 目录清单
# - a.txt
# - b.txt
# - listing.txt
```

分工原则：**凡是要"碰磁盘读写数据"的地方用 aiofiles，凡是要"拼路径、判断存在、遍历目录"的地方用 pathlib**。`Path.exists()`、`Path.is_file()` 这类元信息查询是阻塞的同步调用，但在简单脚本里影响不大；如果在意，可以换成 `aiofiles.os` 模块（见下）。

### 2.8 aiofiles.os —— 异步的 os 模块

aiofiles 还附带一个 `aiofiles.os` 子模块，把常用的 `os.path` / `os.remove` / `os.rename` / `os.mkdir` 等阻塞操作包装成协程，避免这些"元信息查询 + 文件管理"调用也卡住事件循环。

```python
import asyncio
import aiofiles
import aiofiles.os as aios

async def main():
    path = '/tmp/aio_os_demo.txt'

    # 异步判断是否存在
    if await aios.path.exists(path):
        await aios.remove(path)

    # 异步创建目录
    await aios.makedirs('/tmp/aio_os_sub', exist_ok=True)

    # 写一个文件
    async with aiofiles.open(path, 'w', encoding='utf-8') as f:
        await f.write('hello aiofiles.os')

    # 异步改名
    await aios.rename(path, '/tmp/aio_os_demo_renamed.txt')

    # 异步取文件大小
    size = await aios.path.getsize('/tmp/aio_os_demo_renamed.txt')
    print('大小：', size)

asyncio.run(main())
# 输出：
# 大小： 18
```

`aiofiles.os` 覆盖了 `os.path.exists`、`os.path.isfile`、`os.path.isdir`、`os.path.getsize`、`os.remove`、`os.rename`、`os.makedirs`、`os.mkdir`、`os.listdir`、`os.stat` 等常用函数，API 名字与 `os` 一致，只多了 `await`。

### 2.9 编码与文本/二进制模式选择

aiofiles 在文本模式下使用 UTF-8 还是其它编码，完全由 `encoding` 参数决定，行为与内置 `open` 一致。不传 `encoding` 时使用平台默认编码（Linux/macOS 通常是 UTF-8，Windows 可能是 GBK/cp936），**强烈建议显式传 `encoding='utf-8'`**，避免跨平台行为不一致。

```python
import asyncio
import aiofiles

async def main():
    # 文本模式：传 encoding，明确按 UTF-8 读写 str
    async with aiofiles.open('/tmp/enc.txt', 'w', encoding='utf-8') as f:
        await f.write('中文测试 ✅')

    async with aiofiles.open('/tmp/enc.txt', 'r', encoding='utf-8') as f:
        print(await f.read())

    # 二进制模式：读写 bytes，不涉及编码
    async with aiofiles.open('/tmp/enc.bin', 'wb') as f:
        await f.write('中文'.encode('utf-8'))

    async with aiofiles.open('/tmp/enc.bin', 'rb') as f:
        raw = await f.read()
        print(raw, '->', raw.decode('utf-8'))

asyncio.run(main())
# 输出：
# 中文测试 ✅
# b'\xe4\xb8\xad\xe6\x96\x87' -> 中文
```

何时用二进制：处理图片、压缩包、影音、其它已知二进制格式，或需要精确控制字节时。何时用文本：处理日志、配置、CSV/JSON 等"可读文本"时。二进制模式没有编码问题，文本模式则需要指定编码。

## 3. 最佳实践

**别在内置 open 上假装异步**

把同步 `open` + `f.read()` 写在 `async def` 里，并不会让它变成异步——`async` 关键字只让函数能被 `await` 调用，不会把函数体内的阻塞调用变成非阻塞。在事件循环线程里直接读写文件，这段时间整个循环被冻结。推荐写法是用 `aiofiles`；若实在不想引入依赖，也要用 `await asyncio.to_thread(...)`（见第 4 章）把阻塞调用丢到线程池。

```python
# 不推荐：写在 async def 里的阻塞调用，仍会卡住事件循环
async def bad_read(path):
    with open(path, 'rb') as f:
        return f.read()

# 推荐：用 aiofiles
async def good_read(path):
    async with aiofiles.open(path, 'rb') as f:
        return await f.read()

# 也可接受：用 to_thread 把同步调用丢进线程池
async def acceptable_read(path):
    def _read():
        with open(path, 'rb') as f:
            return f.read()
    return await asyncio.to_thread(_read)
```

**大文件务必分块或分块**

一次 `await f.read()` 把整个文件读进内存，对大文件是灾难。读大文件用 `async for line in f:` 逐行，或 `while chunk := await f.read(size)` 分块；写大文件用 `for chunk in ...: await f.write(chunk)` 分块。`chunk_size` 一般取 64KB ~ 1MB，太小调度频繁、太大单次阻塞长。

**务必用 async with，别裸 await open**

`f = await aiofiles.open(...)` 之后忘记 `await f.close()` 是常见漏关来源，尤其在异常分支。`async with aiofiles.open(...) as f:` 在退出时（包括异常退出）自动关闭，是唯一推荐的打开方式。

**显式指定 encoding**

不传 `encoding` 时用平台默认编码，跨平台行为不一致——同一份代码在 Linux 正常、在 Windows 可能乱码或抛 `UnicodeDecodeError`。习惯成自然：文本模式一律显式写 `encoding='utf-8'`，除非有明确的其它编码需求。

**文件并发不是越多越快**

aiofiles 通过默认线程池执行阻塞 IO，线程池大小有限（默认 `concurrent.futures.ThreadPoolExecutor`，Python 3.8+ 默认 `min(32, os.cpu_count() + 4)`）。并发写 5 个文件能加速，并发写 500 个文件不会让磁盘快 500 倍——磁盘有物理 IOPS 上限，SSD 也好机械盘也好，线程池任务会排队，且线程切换本身有开销。对大批量文件并发，建议用 `asyncio.Semaphore` 限流到一个合理并发数（比如 16~64）。

```python
import asyncio
import aiofiles

async def write_one(sem, path, data):
    async with sem:                  # 限制同时打开的文件数
        async with aiofiles.open(path, 'w', encoding='utf-8') as f:
            await f.write(data)

async def main():
    sem = asyncio.Semaphore(32)      # 同时最多 32 个文件在写
    tasks = [
        write_one(sem, f'/tmp/b_{i}.txt', f'数据{i}')
        for i in range(500)
    ]
    await asyncio.gather(*tasks)

# asyncio.run(main())
```

**写完要落到磁盘物理介质才用 fsync**

`await f.flush()` 只把数据推到 OS 内核缓冲，进程崩溃不丢但机器断电仍可能丢。对"绝对不能丢"的数据（如数据库 WAL、关键审计日志），要在 `flush` 后再 `await f.fileno()` 取 fd 配合 `os.fsync` 真正同步到磁盘。普通日志不需要这么重，默认缓冲 + 正常关闭即可。

**记录耗时 IO 的处理位置**

异步程序里一旦某段意外变慢（比如某次 NFS 读取卡了几秒），最好能在日志里看到是哪个文件、哪个操作耗时。对关键文件 IO 包一层计时日志，定位问题会快很多。

## 4. 原理

这一章讲清楚 aiofiles 内部到底是怎么把"阻塞的文件 IO"变成"await 形式的异步操作"的。要理解的核心不是 aiofiles 的源码细节，而是它依赖的两个机制：**事件循环的 `run_in_executor`** 和 **磁盘文件 IO 没有 epoll 就绪通知这一事实**。

### 4.1 磁盘文件 IO 没有"就绪通知"

异步 IO 的理想形态是：协程发起 IO 请求后挂起，操作系统在数据就绪时通知事件循环，事件循环再唤醒协程。网络 IO 能做到这一点——Linux 的 `epoll`、macOS 的 `kqueue` 都能监听 socket，数据到达时事件循环被唤醒。

但普通磁盘文件没有这个机制。原因是内核文件 IO 几乎总是"立刻就绪"——数据已经在页缓存（page cache）里时，`read` 立即返回；数据不在缓存里时，内核发起磁盘 IO，当前线程被挂起到 IO 完成。`epoll` 对普通文件 fd 也不回报 `EPOLLIN`/`EPOLLOUT`，因为它假设"读普通文件不会阻塞很久"或"你本来就可以同步读"。实际上网络盘、慢磁盘、大文件场景下这个假设不成立，但操作系统没有提供针对普通文件的异步就绪通知机制（Linux 的 `io_uring`/`AIO` 是另一个话题，Python 标准库和 asyncio 没有直接用它们）。

结论：**在 asyncio 的事件循环线程里，没法靠"事件通知"异步地等一个普通文件 IO 完成**。文件 IO 要么在当前线程阻塞完成，要么放到别的线程去阻塞完成。

### 4.2 aiofiles 的解法：把阻塞调用委托到线程池

aiofiles 选择了第二条路：在事件循环线程里不直接调用阻塞的 `os.read` / `os.write`，而是用事件循环的 `run_in_executor` 把这些阻塞调用丢到默认线程池去执行。

调用链大致是：

1. 你调用 `await f.read(size)`，`f` 是 aiofiles 的异步文件对象。
2. aiofiles 内部构造一个可调用对象（本质是对底层阻塞文件对象的 `read` 方法的包装），调用 `loop.run_in_executor(None, func)`，把这次阻塞 `read` 提交给事件循环的默认线程池（`None` 表示用默认 executor）。
3. `run_in_executor` 返回一个 `asyncio.Future`。当前协程 `await` 这个 Future，立即挂起，把控制权交还给事件循环。
4. 事件循环继续跑其它协程——网络协程、心跳协程、其它文件 IO 协程……同时线程池里的工作线程在执行真正的阻塞 `read`。
5. 工作线程的 `read` 完成，结果被填进 Future。事件循环在后续某次迭代中检测到 Future 就绪，唤醒等待它的协程。
6. 协程恢复，`await f.read(size)` 拿到数据返回。

用伪代码示意这个流程（省略类型与异常处理）：

```python
# aiofiles 内部 read 的核心，简化版伪代码
class AsyncFile:
    def __init__(self, file_obj, loop):
        self._file = file_obj          # 底层阻塞文件对象
        self._loop = loop

    async def read(self, size=-1):
        # 把阻塞的 self._file.read(size) 丢到线程池
        future = self._loop.run_in_executor(None, self._file.read, size)
        # await 这个 future，挂起协程，等线程池完成
        return await future
```

可以看到，`read` 本身的"做事"（真正读磁盘）从未在事件循环线程里发生——它都发生在工作线程里。事件循环线程只是发起一个委托、拿到一个 Future、挂起协程、等通知。这正是"事件循环不被阻塞"的来源：**卡住的是线程池里的某个工作线程，不是事件循环线程**。

`write`、`flush`、`seek`、`readline` 等所有方法的套路完全一样：把对应的阻塞调用交给 `run_in_executor`，协程 `await` Future 等结果。

### 4.3 open 本身也是委托

`aiofiles.open` 的打开动作也是异步的——同样通过 `run_in_executor` 把内置 `open` 调用丢到线程池。这就是为什么 `aiofiles.open(...)` 返回的是一个"上下文管理器"对象，需要 `async with` 进入——因为真正打开文件的阻塞操作发生在 `await` 进入上下文时，而不是 `aiofiles.open(...)` 调用时。

```python
# 简化伪代码
async def open_async(file, mode, **kwargs):
    loop = asyncio.get_event_loop()
    # 把内置 open 丢到线程池执行
    file_obj = await loop.run_in_executor(None, open, file, mode, **kwargs)
    return AsyncFile(file_obj, loop)
```

`open` 虽然通常很快，但对网络盘、慢盘仍可能阻塞。aiofiles 把它也委托出去，保证"任何阻塞都不发生在事件循环线程"。

### 4.4 为什么这是"用线程池模拟异步"

理想的真异步 IO 是单线程内、靠操作系统就绪通知驱动的 IO——整个流程没有额外的线程，CPU 没有线程切换开销，事件循环线程只负责"发请求 + 收通知"。

aiofiles 不是这种模式：

- 它的真正 IO 工作发生在**额外的线程**里（线程池的工作线程），不是事件循环线程。
- 每一次文件 IO 要经历"事件循环 → 提交任务到线程池 → 线程切换 → 阻塞 IO 完成 → 回填 Future → 事件循环唤醒协程"的往返，有线程切换与 Future 调度开销。
- 它没有从操作系统拿到"文件 IO 就绪"的通知——它只是"把阻塞 IO 放到一边去等，完了再叫我"。

所以 aiofiles 是"**用线程池模拟异步**"：从协程视角看是 `await` 形式的异步 IO；从底层看是阻塞 IO + 线程池委托。它的异步性体现在"不阻塞事件循环"，而不是"没有阻塞线程"。

**与网络真异步的对比**：

| 维度 | 网络 socket + asyncio（真异步） | aiofiles（线程池模拟） |
|------|------------------------|---------------------|
| 就绪通知机制 | 有（epoll/kqueue 通知 socket 可读/可写） | 无（普通文件无就绪通知） |
| 真正 IO 执行者 | 事件循环线程（在通知驱动下做非阻塞读写） | 线程池的工作线程（阻塞调用） |
| 是否引入额外线程 | 不引入 | 引入（默认线程池） |
| 单次 IO 开销 | 小（一次事件循环回调） | 较大（线程切换 + Future 调度） |
| 是否能"真并发" | 单线程内事件驱动，多 socket 并发 | 受线程池大小限制 |

正因为有这层差异，aiofiles 不是"魔法加速器"——它让文件 IO 不阻塞事件循环，但不会让单次文件 IO 变快，甚至有少量额外开销。它的价值是**在并发场景下让事件循环保持响应**，而不是提升单次读写性能。

### 4.5 并发写多文件为什么能并行

理解了"每次 IO 委托到线程池"之后，并发写多文件的原理就清楚了：每个文件的 `await f.write(...)` 都向默认线程池提交了一个阻塞 `write` 任务，多个任务被分配到线程池的多个工作线程上，在工作线程层面真正并行执行——线程 A 写文件 1、线程 B 写文件 2、线程 C 写文件 3，互不等待。事件循环线程则在这些 Future 之间轮转，谁先完成就唤醒谁。

```python
# 简化伪代码：并发写三个文件
async def write_three():
    # 三个 open + write 各自提交线程池任务
    f1 = await aiofiles.open('/tmp/p1.txt', 'w')
    f2 = await aiofiles.open('/tmp/p2.txt', 'w')
    f3 = await aiofiles.open('/tmp/p3.txt', 'w')
    # 三个 write 任务在工作线程上并行执行
    await asyncio.gather(f1.write('a'), f2.write('b'), f3.write('c'))
```

并行的上限是线程池大小。如果同时打开的文件数 > 线程池工作线程数，多出来的任务在线程池队列里排队，此时并发收益停止增长。这也是第 3 章建议用 `Semaphore` 限流的原因——与其让任务排队占着 Future，不如显式控制并发数到磁盘与线程池能消化的水平。

### 4.6 await f.read(size) 详解：从协程到线程池再回来

把上面几节串起来，一次 `await f.read(size)` 的完整旅程：

1. 协程调用 `await f.read(size)`，进入 aiofiles 的 `read` 协程。
2. aiofiles 取到当前事件循环，构造一个"执行 `self._file.read(size)`"的可调用对象。
3. 调用 `loop.run_in_executor(None, callable)`：事件循环把 callable 提交给默认 `ThreadPoolExecutor` 的工作线程，立即返回一个 `concurrent.futures.Future`。
4. asyncio 把这个 `concurrent.futures.Future` 包装成 `asyncio.Future`（通过 `asyncio.wrap_future`），让协程可以 `await`。
5. 当前协程 `await` 这个 `asyncio.Future`，挂起，事件循环线程获得自由。
6. 事件循环去跑其它就绪协程——可能是另一个文件的 `await f.read`，也可能是网络协程。
7. 在工作线程上，底层 `os.read` 阻塞执行，真正读磁盘。完成后 callable 返回数据。
8. 工作线程把结果填入 `concurrent.futures.Future`，触发它的回调（asyncio 注册的桥接回调）。
9. 桥接回调把结果转给 `asyncio.Future`，事件循环在下次迭代中把它标记为就绪。
10. 事件循环唤醒挂起的协程，`await f.read(size)` 返回数据，协程继续执行。

步骤 6 是"事件循环不被阻塞"的关键——在此期间事件循环线程是自由的，能服务其它协程。步骤 7 是"真正阻塞发生的地方"——工作线程，不是事件循环线程。整个机制从头到尾没有依赖"文件 IO 就绪通知"，只依赖"把阻塞工作丢到另一线程 + Future 桥接回事件循环"。

### 4.7 run_in_executor 的默认线程池与可替换性

`loop.run_in_executor(None, ...)` 里的 `None` 表示用事件循环的默认 executor，它在 Python 3.8+ 默认是 `ThreadPoolExecutor(min(32, os.cpu_count() + 4))`。aiofiles 默认就用这个池。

如果需要自定义线程池（比如想限制并发线程数、或想用 `ProcessPoolExecutor` 做真正 CPU 密集的事），可以把自定义 executor 传给 `loop.run_in_executor`，但 aiofiles 当前的 API 并没有直接暴露 executor 参数。替代做法是设置事件循环的默认 executor：

```python
import asyncio
import aiofiles
from concurrent.futures import ThreadPoolExecutor

async def main():
    loop = asyncio.get_running_loop()
    # 把默认线程池换成自定义大小
    loop.set_default_executor(ThreadPoolExecutor(max_workers=8))
    async with aiofiles.open('/tmp/x.txt', 'w', encoding='utf-8') as f:
        await f.write('自定义线程池下的写入')

asyncio.run(main())
```

这种替换对 aiofiles 透明，因为它取的就是当前循环的默认 executor。一般不需要改，理解机制即可。

### 4.8 asyncio.to_thread 是同思路的"官方版"

Python 3.9 引入了 `asyncio.to_thread(func, *args, **kwargs)`，它的实现思路与 aiofiles 完全一致：把阻塞调用丢到默认线程池，返回可 `await` 的协程。区别在于 `to_thread` 是通用工具，aiofiles 是专为文件 IO 做的封装——提供了 `async with`、`async for`、`read`/`write`/`readline` 等文件 API，使用更顺手。

等价的写法：

```python
import asyncio
import aiofiles

# 方式一：aiofiles，文件 API 友好
async def with_aiofiles(path):
    async with aiofiles.open(path, 'r', encoding='utf-8') as f:
        return await f.read()

# 方式二：to_thread + 内置 open，无额外依赖
async def with_to_thread(path):
    def _read():
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    return await asyncio.to_thread(_read)
```

两者底层都是"线程池委托"，事件循环都不会被阻塞。aiofiles 的优势在于：API 与内置文件对象一致、`async with`/`async for` 开箱即用、`read`/`write` 分块仍是异步的（`to_thread` 方式下分块读要么整块读出去、要么每次块都 `to_thread` 一次开销更大）。长期跑异步项目推荐 aiofiles；偶尔一两次文件读写用 `to_thread` 也合理。

## 5. 总结

### 5.1 本文内容要点

- 标准内置 `open` 是阻塞的，在 asyncio 事件循环线程里直接读写文件会卡住整个循环，网络协程、定时任务、其它协程全部被迫排队。
- aiofiles 把阻塞文件 IO 包装成 `async with aiofiles.open(...) as f:` + `await f.read()/write()/readline()/seek()` 的异步 API，使用方式与内置 `open` 高度一致。
- 读方法：`await f.read(size)` 读取全部或指定长度，`await f.readline()` 读一行，`await f.readlines()` 读所有行，`async for line in f` 逐行异步迭代。
- 写方法：`await f.write(data)` 写字符串/字节，`await f.writelines(lines)` 批量写，`await f.flush()` 强制刷新缓冲，`await f.seek/tell` 移动与查询游标。
- 大文件用分块读写：`while chunk := await f.read(chunk_size)` 读、`await f.write(chunk)` 写，`chunk_size` 取 64KB ~ 1MB。
- aiofiles 的价值在并发：并发写多文件靠 `asyncio.gather`，文件 IO 不阻塞网络协程，与 aiohttp 配合做"边下载边落盘"。
- 与 pathlib 分工：pathlib 负责路径构造与查询，aiofiles 负责实际 IO；`aiofiles.os` 提供异步的 `os` 模块函数。
- 原理：磁盘文件 IO 无 epoll 就绪通知，aiofiles 靠 `loop.run_in_executor` 把阻塞 `read`/`write`/`open` 委托到默认线程池，协程 `await` 一个 Future 等线程池完成回调；这是"用线程池模拟异步"，与网络 socket 的真异步（epoll 驱动）有本质差异。
- 局限：文件 IO 本质受磁盘 IOPS 与带宽限制，线程池有切换开销，并发写受线程池大小约束；aiofiles 让文件 IO 不阻塞事件循环，但不提升单次读写速度。

### 5.2 读完应能掌握

- 能说清"为什么在事件循环线程里直接用内置 `open` 读写文件会出问题"，并用一个心跳协程对比演示阻塞写与 aiofiles 写的差异。
- 能正确使用 `async with aiofiles.open(...) as f:` 打开文件，`await f.read()/write()/readline()` 完成读写，显式指定 `encoding='utf-8'`，避免漏关与编码问题。
- 能用分块 `await f.read(chunk_size)` / `await f.write(chunk)` 处理大文件，说明 `chunk_size` 的合理取值范围与原因。
- 能用 `asyncio.gather` 并发写多个文件、与 aiohttp 配合做下载落盘，并用 `Semaphore` 对大批量文件并发限流。
- 能说清 aiofiles 的线程池委托原理：阻塞调用经 `loop.run_in_executor` 提交到默认线程池，协程 `await` Future 等回调，事件循环线程在此期间自由，并说清它与网络真异步（epoll）的本质差异。
- 能在"引入 aiofiles"、"用 `asyncio.to_thread` + 内置 open"两种方案之间根据依赖与场景做出合理取舍。