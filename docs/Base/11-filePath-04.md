---
group:
  title: 【11】文件与路径操作
  order: 11
order: 3
title: 文件指针操作
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是文件指针

读写文件时，操作系统维护着一个"当前位置"的概念——即文件指针（file pointer）。你可以把它想成光标：读文件时，数据从指针所在位置开始读取，每读一个字节指针就向后移动一格；写文件时，新数据写到指针所在位置，写完指针随之右移。所有 `read()`、`readline()`、`write()` 调用，都隐式地依赖这个指针的位置——它决定了"下一次读从哪里开始读""下一次写从哪里开始写"。

文件指针在 C 标准库层面就是一个整数——文件偏移量（offset），表示从文件开头算起的第几个字节。Python 的文件对象把这件事封装成了两个方法：`tell()` 查询当前指针在哪个字节，`seek()` 把指针移动到指定字节。理解这两个方法，就是理解 Python 文件读写的"位置控制"。

这一点在顺序读写时几乎无感——你调用 `f.read()` 从头读到尾，指针自己往后走，不需要关心它在哪里。但一旦涉及"回读刚写的内容""在二进制文件里随机定位读取某一段""断点续传"，就必须显式操作指针。本篇要讲的，就是如何用 `seek()` 和 `tell()` 精确掌控这个位置。

一个最小示例，先建立直觉：

```python
# 以二进制方式写一段内容，再回读
with open("/tmp/demo.bin", "wb+") as f:
    f.write(b"Hello")        # 写入 5 个字节，指针现在在第 5 字节（文件末尾）
    print(f.tell())          # 查询当前指针位置
    # 输出：5
    f.seek(0)                # 把指针移回文件开头
    print(f.read())          # 从开头读
    # 输出：b'Hello'
```

这个例子展示了文件指针操作的三个核心动作：`tell()` 查、`seek()` 移、`read()`/`write()` 受指针驱动。`wb+` 模式表示"二进制读写"，既可写又可读，这是指针操作最常见的打开模式——因为要同时写和读，就得在两者之间切换指针位置。

### 1.2 基本语法与最小用法

文件指针相关的方法一共有四个，都是文件对象（`io.TextIOWrapper` 或 `io.BufferedReader` 等）的实例方法：

| 方法                       | 作用                                                 | 返回值                                              |
| -------------------------- | ---------------------------------------------------- | --------------------------------------------------- |
| `f.tell()`                 | 返回当前指针位置（字节数）                           | `int`                                               |
| `f.seek(offset, whence=0)` | 把指针移到指定位置                                   | 新位置 `int`（通常是 `offset`，但 whence≠0 时另算） |
| `f.seekable()`             | 判断该文件对象是否支持 seek                          | `bool`                                              |
| `f.truncate(size=None)`    | 把文件截断到指定大小（也影响文件内容，但不移动指针） | 新文件大小 `int`                                    |

最常用的是前两个。第三个用于防御性编程——有些流（如管道、终端、网络套接字）不允许 seek，调用 `seek()` 会直接抛 `io.UnsupportedOperation`，先 `seekable()` 判一下更稳妥。

最小的 seek 用法：

```python
with open("/tmp/p.txt", "w", encoding="utf-8") as f:
    f.write("一二三")          # 写入 3 个汉字

with open("/tmp/p.txt", "r", encoding="utf-8") as f:
    f.seek(0)                  # 文本模式下，seek(0) 永远合法——回到开头
    print(f.read(2))           # 读 2 个字符
    # 输出：一二
    print(f.tell())            # 注意：tell 返回的是"字节位置"而非"字符位置"
    # 输出：6  （每个汉字 UTF-8 占 3 字节，2 个汉字 = 6 字节）
```

注意上面 `tell()` 返回的是字节数而不是字符数——这是文本模式下最容易踩的坑。`seek(0)` 能用，是因为 0 永远是文件开头、没有编码歧义；但 `seek(3)` 在文本模式下就不一定合法（如果 3 落在某个多字节字符的中间字节，会抛错）。为什么文本模式对 seek 有这么多限制、而二进制模式没有——这是本篇"原理"章要讲透的核心。

### 1.3 文件指针在读写中的角色

在进入 API 细节前，先把"指针在读写过程中怎么动"这件事讲清楚，因为后续所有 `seek`/`tell` 的行为都建立在这个模型上。

任何一次读或写，都遵循"从指针当前位置开始 → 操作完毕 → 指针自动右移操作的字节数"这个规律。读和写共用同一个指针——不是读有读指针、写有写指针，而就一个：

```python
import io

buf = io.BytesIO(b"ABCDEFGHIJ")        # 内存中的二进制流，行为与真实文件一致
print(buf.tell())                       # 初始指针在开头
# 输出：0
print(buf.read(3))                      # 读 3 个字节
# 输出：b'ABC'
print(buf.tell())                       # 指针移到第 3 字节
# 输出：3
buf.write(b"XX")                        # 在当前位置写 2 个字节（会覆盖 D、E）
print(buf.tell())                       # 指针移到第 5 字节
# 输出：5
buf.seek(0)                             # 回到开头
print(buf.read())                       # 验证覆盖效果
# 输出：b'ABCXXFGHIJ'
```

读和写都从 `tell()` 指出的位置开始，互相挤占同一个指针。所以"先写后读"或"先读后写"时，必须用 `seek()` 在中间切位置——这是 `+` 模式（`w+`、`r+`、`a+`、`x+`）的核心使用模式。没有 `seek()` 的辅助，`+` 模式几乎无法正确工作。

## 2. 核心内容

### 2.1 tell()：查询当前指针位置

`tell()` 是最简单的指针操作——它不移动指针，只返回当前所在的字节位置。返回值是一个非负整数，表示"下一次读或写将从文件的第几个字节开始"。

**方法签名**：

```python
f.tell() -> int
```

无参数。返回值语义在不同模式下略有差异：

- **二进制模式**（`rb`、`wb`、`r+b` 等）：返回值是真实字节偏移量，可以直接传给 `seek()` 回到这个位置。
- **文本模式**（`r`、`w`、`a`、`r+` 等）：返回值是一个"不透明数字"。CPython 保证它表示字节偏移量，但仅作为 `seek()` 的入参使用——你不能假设它是 UTF-8 编码后的字节数去做算术（虽然在多数情况下确实是）。

**最小用法**：

```python
with open("/tmp/t.txt", "wb") as f:
    f.write(b"0123456789")              # 写 10 个字节
    print(f.tell())                     # 指针在文件末尾
    # 输出：10

with open("/tmp/t.txt", "rb") as f:
    print(f.tell())                     # 刚打开，指针在开头
    # 输出：0
    f.read(4)                           # 读 4 个字节
    print(f.tell())                     # 指针在第 4 字节
    # 输出：4
    f.read()                            # 读剩余所有
    print(f.tell())                     # 指针在文件末尾
    # 输出：10
```

`tell()` 在顺序读写时看起来是冗余的——你能凭"读了几个字符"自己算出来。但它在以下场景不可替代：

**场景一：记录断点位置以便后续恢复读取**。

```python
# 模拟"读了一半，要保存进度，下次从这里继续"
def read_chunk_with_checkpoint(path, chunk_size=1024):
    """每次读 chunk_size 字节，返回读到的数据和当前指针位置。
    下次调用时可以把返回的 position 传给 seek，从断点继续。"""
    with open(path, "rb") as f:
        data = f.read(chunk_size)
        position = f.tell()             # 记录这次读到哪里
        return data, position

# 第一次读
data1, pos1 = read_chunk_with_checkpoint("/tmp/t.txt", chunk_size=4)
print(data1, pos1)
# 输出：b'0123' 4

# 模拟下次调用：从 pos1 继续读
with open("/tmp/t.txt", "rb") as f:
    f.seek(pos1)                        # 从上次断点继续
    print(f.read(4))
    # 输出：b'4567'
```

**场景二：诊断"为什么读出来的是空"**。

很多人遇到过 `f.read()` 返回空字符串，以为是文件坏了。其实多半是"指针已经在文件末尾"——上一个操作读完了所有内容，没 seek 回去就再 read，自然读到空。`tell()` 是最快排查手段：

```python
with open("/tmp/t.txt", "r") as f:
    print(f.read())                     # 第一次读全部
    # 输出：0123456789
    print(f.tell())                     # 指针已经在末尾
    # 输出：10
    print(f.read())                     # 再读就是空
    # 输出：（空字符串）
    # 排查：tell 返回文件大小，说明指针到底了，不是文件坏
```

### 2.2 seek(offset, whence)：移动指针

`seek()` 是指针操作的核心。它把指针移动到指定位置，之后的下一次读或写就从那里开始。

**方法签名**：

```python
f.seek(offset, whence=0) -> int
```

两个参数：

- `offset`：偏移量，整数。可以是正数、零、负数（取决于 `whence`）。单位是**字节**，不是字符——这一点无论文本还是二进制模式都一样。
- `whence`：定位基准，三选一：
  - `0`（默认，可用 `os.SEEK_SET` 表示）：相对**文件开头**定位。`offset` 必须 ≥ 0。
  - `1`（`os.SEEK_CUR`）：相对**当前指针位置**定位。`offset` 可正可负可零。
  - `2`（`os.SEEK_END`）：相对**文件末尾**定位。`offset` 可正可负可零。

返回值是移动后指针所在的新位置（即 `f.tell()` 会返回的值），通常等于基于文件开头的绝对字节偏移。

`whence` 的三档语义，可以用一张表锚定：

| whence | 名称       | 含义       | offset 限制 | 典型用途                                    |
| ------ | ---------- | ---------- | ----------- | ------------------------------------------- |
| 0      | `SEEK_SET` | 从文件头   | ≥ 0         | 回到开头 `seek(0)`；跳到第 N 字节           |
| 1      | `SEEK_CUR` | 从当前位置 | 任意        | 前进 N 字节；后退 N 字节；原地 `seek(0, 1)` |
| 2      | `SEEK_END` | 从文件末尾 | 任意        | 跳到末尾 `seek(0, 2)`；距末尾 N 字节处      |

逐一展开。

**whence=0：相对文件头定位**

这是默认值，也是最常用的基准。`seek(0)` 表示"回到文件开头"，`seek(100)` 表示"跳到第 100 字节"。

```python
with open("/tmp/t.txt", "wb") as f:
    f.write(b"0123456789")

with open("/tmp/t.txt", "rb") as f:
    f.seek(3)                           # 跳到第 3 字节
    print(f.read(4))                    # 从 '3' 开始读 4 个字节
    # 输出：b'3456'
    f.seek(0)                           # 回到开头
    print(f.read(2))                    # 读头 2 个字节
    # 输出：b'01'
    f.seek(100)                         # 越过文件末尾——在二进制模式下合法
    print(f.tell())                     # 指针停在第 100 字节（文件大小才 10）
    # 输出：100
    print(f.read())                     # 读到空，因为后面没内容
    # 输出：b''
```

`whence=0` 的 `offset` 不能为负，否则抛 `ValueError`：

```python
f.seek(-1)          # ValueError: negative seek value -1
```

注意上面的"越过文件末尾"——`seek` 允许把指针移到文件长度之外的位置，此时读会返回空、写会在末尾与指针之间填充零字节（二进制模式）。这个行为在"预分配文件空间"场景有用，但在日常读写中通常是 bug。

**whence=1：相对当前指针位置定位**

`whence=1` 允许 offset 为负——这是它和 `whence=0` 最大的区别。它适合"我想后退几个字节再读一遍刚才跳过的内容"这种相对移动。

```python
with open("/tmp/t.txt", "rb") as f:
    f.read(5)                           # 读 5 个字节，指针在第 5
    f.seek(-2, 1)                       # 从当前位置后退 2 字节，指针在第 3
    print(f.read(2))                    # 读 2 个字节，应该读到 b'34'
    # 输出：b'34'

    f.seek(2, 1)                        # 从当前位置前进 2 字节
    print(f.read())                     # 指针现在在第 7，读到末尾
    # 输出：b'89'

    f.seek(0, 1)                        # 相对位移为 0，相当于"原地不动"
    print(f.tell())                     # 指针仍在第 7
    # 输出：7
```

`whence=1` 在文本模式下有严格限制——见 2.3 节。二进制模式下完全自由，是"在数据流里来回滑动"的主力。

**whence=2：相对文件末尾定位**

`whence=2` 把基准设在文件末尾（EOF）。`seek(0, 2)` 表示"跳到文件末尾"，`seek(-5, 2)` 表示"从末尾后退 5 字节"——这是读取"文件尾部 N 字节"的经典写法。

```python
with open("/tmp/t.txt", "rb") as f:
    f.seek(0, 2)                        # 跳到文件末尾
    print(f.tell())                     # 指针位置 = 文件大小
    # 输出：10

    f.seek(-5, 2)                       # 从末尾后退 5 字节
    print(f.read())                     # 读最后 5 字节
    # 输出：b'56789'
```

`whence=2` 配合 `os.path.getsize` 可以验证"指针位置 == 文件大小"：

```python
import os

size = os.path.getsize("/tmp/t.txt")
with open("/tmp/t.txt", "rb") as f:
    end_pos = f.seek(0, 2)              # seek 返回新位置
    print(end_pos == size)              # 两者一致
    # 输出：True
```

`seek(-5, 2)` 这种"负 offset + whence=2"在二进制模式很常用——比如读取文件的魔数、tail 命令的实现。但在文本模式下，`whence=2` 同样受限（见 2.3）。

**返回值的语义**

`seek()` 返回移动后的新位置。这个返回值在 `whence=0` 时就是 `offset` 本身，但在 `whence=1` 和 `whence=2` 时不那么直观，是与文件头的绝对偏移：

```python
with open("/tmp/t.txt", "rb") as f:
    f.read(3)                           # 指针在第 3
    r = f.seek(2, 1)                    # 从当前位置前进 2 字节
    print(r)                            # 返回的是绝对位置（3 + 2 = 5）
    # 输出：5

with open("/tmp/t.txt", "rb") as f:
    r = f.seek(-3, 2)                   # 从末尾后退 3 字节
    print(r)                            # 返回 10 - 3 = 7
    # 输出：7
```

这个返回值让 `f.seek(0, 2)` 成了"一行获取文件大小"的惯用法（返回值就是文件字节数），不必再调 `os.path.getsize`。

### 2.3 文本模式与二进制模式下 seek 的差异

这是本篇最关键的一节，几乎所有人第一次踩 seek 的坑都是在文本模式。

打开模式决定了 `seek()` 能做什么：

| 打开模式                     | whence=0                                      | whence=1                                 | whence=2       |
| ---------------------------- | --------------------------------------------- | ---------------------------------------- | -------------- |
| 二进制（`rb`/`wb`/`r+b` 等） | ✅ 自由                                       | ✅ 自由                                  | ✅ 自由        |
| 文本（`r`/`w`/`a`/`r+` 等）  | ✅ 仅 offset=0 或 offset=上一次 tell 的返回值 | ❌ 仅 `seek(0, 1)`（原地不动，意义不大） | ✅ 仅 offset=0 |

为什么文本模式限制这么多？一句话：**文本模式按字符读写，但 seek 按字节定位，两者单位不一致**。多字节编码（UTF-8、GBK 等）下一个字符不一定对应一个字节，如果把指针移到某个字符的中间字节，再尝试解码就会报错。为了避免这种情况，CPython 对文本模式的 seek 做了严格约束——只允许移到那些"保证能正确解码"的位置上。

**文本模式只能 seek 到 0 或 tell() 返回过的值**

```python
with open("/tmp/cn.txt", "w", encoding="utf-8") as f:
    f.write("你好世界")                  # 4 个汉字，UTF-8 下占 12 字节

with open("/tmp/cn.txt", "r", encoding="utf-8") as f:
    f.read(2)                           # 读 2 个字符，指针在第 6 字节
    pos = f.tell()
    print(pos)
    # 输出：6

    f.seek(0)                           # seek 到开头，合法
    print(f.read(1))
    # 输出：你

    f.seek(pos)                         # seek 到 tell() 返回过的位置，合法
    print(f.read(1))
    # 输出：世

    f.seek(3)                           # ❌ 3 不是字符边界，会报错
    # OSError/UnicodeDecodeError: can't decode ...
```

这段代码里的 `f.seek(3)` 在多数系统上会抛 `io.UnsupportedOperation: can't do nonzero cur-relative seeks` 或者 `UnicodeDecodeError`，因为 3 字节落在第一个汉字"你"（占 3 字节：0-2）和第二个汉字"好"（占 3 字节：3-5）的中间——指针停在第 3 字节意味着下次 `read` 要从"好"的首字节开始解码，但 CPython 不知道这个位置对应哪个字符，干脆拒绝。

实践中这条限制的应对方法是：**文本模式下只 seek 到 0（回到开头）或 seek 到之前 `tell()` 保存过的位置**，其他位置的跳转用二进制模式做。

**文本模式下 whence=1 几乎不可用**

```python
with open("/tmp/cn.txt", "r", encoding="utf-8") as f:
    f.read(2)
    f.seek(-3, 1)                       # ❌ 文本模式禁止非 0 的 whence=1
    # io.UnsupportedOperation: can't do nonzero cur-relative seeks
```

文本模式下唯一合法的 `whence=1` 操作是 `seek(0, 1)`——相对当前位置移动 0 字节，等于啥也不干（但能清掉"未读"标志，某些 C 实现里有用）。要后退 N 字节，只能先 `tell()` 拿到当前位置 `p`，然后 `seek(p - N, 0)`——但这又回到了"只能 seek 到字符边界"的问题。

**文本模式下 whence=2 只允许 offset=0**

```python
with open("/tmp/cn.txt", "r", encoding="utf-8") as f:
    f.seek(0, 2)                        # ✅ 跳到文件末尾，合法
    print(f.tell())
    # 输出：12
    f.seek(-3, 2)                       # ❌ 文本模式禁止 whence=2 + 非 0 offset
    # io.UnsupportedOperation: can't do nonzero end-relative seeks
```

`seek(0, 2)` 在文本模式下仍然可用——它跳到文件末尾，这是"追加模式需要先跳到末尾再写"的常用做法（虽然 `a` 模式会自动这么做，但 `r+` 模式要手动跳）。

**二进制模式：完全自由**

```python
with open("/tmp/cn.txt", "rb") as f:
    f.seek(3)                           # ✅ 可跳到任意字节
    f.seek(-3, 1)                       # ✅ 可相对当前位置后退
    f.seek(-6, 2)                       # ✅ 可从末尾后退
    f.seek(2, 1)                        # ✅ 可相对当前前进
    print(f.tell())
    # 输出：（取决于前面 seek 的累积效应，这里是 2）
```

二进制模式之所以自由，是因为它不涉及解码——`rb` 读出来的是 `bytes`，每字节独立，不存在"中间字节"问题。需要"按字符"处理 UTF-8 文本但又需要随机定位时，标准做法是 **用 `rb` 打开、手动 `data.decode("utf-8")`**，把解码工作放在 seek 之后：

```python
with open("/tmp/cn.txt", "rb") as f:
    raw = f.read()                      # 一次性读全部字节
    text = raw.decode("utf-8")          # 再整体解码
    # 现在可以任意切片操作 text 字符串，不受 seek 限制
```

这种"二进制读 + 手动解码"的模式，是处理大文件随机访问的标准思路（如 UTF-8 日志文件的反向解析）。

### 2.4 seekable()：判断是否支持 seek

不是所有文件对象都能 seek。来自管道（pipe）、终端（终端 stdin/stdout）、网络套接字、`/dev/stdin` 这类"流式"来源的文件对象，底层就不支持随机访问——数据只能顺序读，不能倒退。对这类对象调 `seek()` 会直接抛 `io.UnsupportedOperation`。

`seekable()` 让你在调用 `seek()` 之前先探一下：

```python
import sys

print(sys.stdin.seekable())             # 终端或管道输入通常不可 seek
# 输出：False（重定向自管道时）
print(sys.stdout.seekable())            # 输出流同样不可 seek
# 输出：False

with open("/tmp/t.txt", "rb") as f:
    print(f.seekable())                 # 真实文件肯定可 seek
    # 输出：True
```

**场景：写一个对"文件或标准输入"都兼容的处理函数**

```python
def process_stream(f):
    """读取并处理一个二进制流，可兼容真实文件与管道输入。"""
    if f.seekable():
        f.seek(0, 2)                    # 可 seek：跳到末尾获取大小
        size = f.tell()
        f.seek(0)
        print(f"文件大小：{size} 字节")
    else:
        print("不可 seek，使用流式读取")

    while True:
        chunk = f.read(4096)
        if not chunk:
            break
        # 处理 chunk ...

import io
# 模拟不可 seek 的流
process_stream(io.BytesIO(b"hello").__class__(b"hello"))  # BytesIO 可 seek
# 输出：文件大小：5 字节
```

`seekable()` 是防御性编程的好习惯，尤其是在写库函数、要接受任意 file-like 对象时。

### 2.5 二进制文件随机读取场景

二进制模式下 seek 最能发挥威力——可以"想读哪一段就读哪一段"，无需把整个文件读进内存。这在处理固定结构二进制文件（如二进制索引、固定宽度记录、BMP/PNG 头部）时是核心技巧。

**场景一：固定宽度记录的随机访问**

假设有一份二进制数据文件，每条记录 16 字节：4 字节 ID（int）+ 8 字节时间戳（double）+ 4 字节状态（int）。要读第 N 条记录，不需要扫前面所有记录，直接 seek 到 `N * 16`：

```python
import struct

record_fmt = "<IdL"                     # 小端：4字节int + 8字节double + 4字节unsigned int
record_size = struct.calcsize(record_fmt)   # 16

with open("/tmp/records.bin", "wb") as f:
    # 写入 3 条记录
    for i in range(3):
        f.write(struct.pack(record_fmt, i, 1_700_000_000.0 + i * 86400, i * 10))

def read_record(path, index):
    """随机读取第 index 条记录（0-based），无需扫描前面的记录。"""
    with open(path, "rb") as f:
        f.seek(index * record_size)     # 直接跳到目标记录位置
        raw = f.read(record_size)
        return struct.unpack(record_fmt, raw)

print(read_record("/tmp/records.bin", 0))
# 输出：(0, 1700000000.0, 0)
print(read_record("/tmp/records.bin", 2))
# 输出：(2, 1700172800.0, 20)
```

这种"每条记录定长 → 用索引乘以记录长度 seek 到目标"的思路，是数据库索引、日志随机访问的基础。如果把记录读进内存再切片，N 大时就浪费内存——seek 直接在磁盘上跳，最省。

**场景二：只读文件头/文件尾**

很多文件格式把元数据放在头部或尾部。BMP 文件头 14 字节、前两字节是签名 `BM`；ZIP 文件把中央目录放在文件末尾。只读头部或尾部，不必读整个文件：

```python
def is_bmp(path):
    """只读文件头 2 字节判断是否 BMP，不读整个文件。"""
    with open(path, "rb") as f:
        signature = f.read(2)           # read 前 seek(0) 不必显式调，刚打开就在 0
        return signature == b"BM"

def read_zip_central_dir_size(path):
    """ZIP 末尾 22 字节是 End of Central Directory Record，读取它获取文件数。"""
    with open(path, "rb") as f:
        f.seek(-22, 2)                  # 从末尾后退 22 字节
        eocd = f.read(22)
        if eocd[:4] != b"PK\x05\x06":
            return None
        import struct
        return struct.unpack("<H", eocd[10:12])[0]   # 打包的文件数
```

`seek(-22, 2)` 这一行比"读整个文件再切最后 22 字节"省多少——取决于文件多大。1GB 的 ZIP 也只读 22 字节就够。

**场景三：tail -f 的核心思路**

Linux 的 `tail -f` 命令不断读取追加到文件末尾的新内容。它的核心就是 seek 到文件末尾，然后轮询"文件大小是否增加"，增加了就 seek 到上次位置继续读。简化版：

```python
import os
import time

def follow(path):
    """持续读取文件新增内容，模拟 tail -f。"""
    with open(path, "rb") as f:
        f.seek(0, 2)                    # 先跳到当前末尾
        last_pos = f.tell()
        while True:
            f.seek(0, 2)                # 重新跳到末尾，获取最新大小
            cur_end = f.tell()
            if cur_end > last_pos:
                f.seek(last_pos)        # 回到上次读完的位置
                new_data = f.read(cur_end - last_pos)
                yield new_data
                last_pos = cur_end
            time.sleep(0.1)

# 测试：在另一个进程往文件 append 数据
# for chunk in follow("/tmp/log.txt"):
#     print(chunk)
```

这里有两个关键的 seek：`seek(0, 2)` 跳到末尾拿到当前大小（用于判断是否有新数据），`seek(last_pos)` 回到上次读的位置开始读新数据。如果不能用 seek，tail-f 就没法实现——它需要"在末尾和上次位置之间反复跳"。

### 2.6 回读刚写的内容（redo 场景）

`w+`、`r+`、`wb+` 这些"读写"模式下，刚写完一段数据想立刻读回来验证，就必须在中间 seek——因为写完指针在写入内容的末尾，不 seek 回去就读不到刚写的内容。

**场景：写入并校验**

```python
import io

# 用 BytesIO 演示，行为与真实文件一致
buf = io.BytesIO()
buf.write(b"CHECKSUM:0x1234")           # 写入 13 字节，指针在第 13
print(buf.tell())
# 输出：13

buf.seek(9)                             # 跳到校验和字段起始位置
checksum = buf.read(4)                  # 读出校验和
print(checksum)
# 输出：b'0x12'

# 写入新校验和覆盖老的
buf.seek(9)
buf.write(b"0xABCD")                    # 覆盖写入

buf.seek(0)                             # 回到开头读全部，验证覆盖效果
print(buf.read())
# 输出：b'CHECKSUM:0xABCD'
```

read 和 write 之间必须显式 seek，这是"先写后读"的铁律。很多人误以为 `w+` 模式下读写指针是独立维护的——不是，它们共用同一个指针。

**场景：边读边改（r+ 模式的回读）**

```python
import io

# 准备一个已有内容的文件对象
buf = io.BytesIO(b"ID=001,NAME=AAA,AGE=20")

# 读取 NAME 段
buf.seek(12)
old_name = buf.read(3)
print(old_name)                         # 读出 b'AAA'，指针现在在第 15
# 输出：b'AAA'

# 改写 NAME 段（长度恰好一致，可以原位覆盖）
buf.seek(12)
buf.write(b"BBB")                       # 用 BBB 覆盖 AAA

buf.seek(0)
print(buf.read())                       # 验证修改
# 输出：b'ID=001,NAME=BBB,AGE=20'
```

`r+` 下既能读又能写，但每次切换方向都要 seek。不 seek 直接写会从"上一次读到的位置"开始写，往往不是想要的位置。

### 2.7 追加模式 a/a+ 下的指针行为

追加模式（`a`、`a+`、`ab`、`a+b`）有个反直觉的特性：**写操作会忽略当前指针位置，永远写到文件末尾**。也就是说，即使 `seek()` 把指针移到文件中间，`write()` 仍然追加到末尾，而不是覆盖中间内容。

这一点和 `r+`、`w+` 截然不同——后两者是"在指针处写"。

```python
with open("/tmp/a.txt", "w") as f:
    f.write("ABCDEFGHIJ")               # 先准备一个 10 字节文件

with open("/tmp/a.txt", "a+") as f:
    f.seek(5)                           # 把指针移到第 5 字节
    f.write("XY")                       # ❌ 期望覆盖，实际是追加到末尾！
    f.seek(0)
    print(f.read())
    # 输出：ABCDEFGHIJXY           ← XY 在末尾，不是 FG 被覆盖
```

`a+` 模式下的指针位置对 write 完全无效。这是操作系统层面的 `O_APPEND` 标志位决定的——每次 write 系统调用前，内核都会先把指针自动定位到文件末尾。这是为了保证多个进程同时追加同一文件时不互相覆盖。

但**读操作受指针影响**：

```python
with open("/tmp/a.txt", "a+") as f:
    f.read(5)                           # 从开头读 5 字节，受 seek 控制
    print(f.tell())
    # 输出：5（如果你刚打开文件、没 seek 过）
```

这里要区分两种"指针"：内核维护的文件偏移量（用于 read）和 `O_APPEND` 的特殊写入路径（用于 write）。`a+` 模式下 read 用前者、write 用后者，看起来怪但合理。

**什么时候用 a+ 模式**

`a+` 实际上很少用到——多数需要"随时追加又随时读"的场景应该用 `r+`（允许覆盖写），或者用两个文件对象分别打开读和写。`a+` 适合"日志文件既要追加新条目、又要回看历史"这种纯追加型场景。

```python
# 日志文件：追加新日志 + 断点回看
def append_and_show_tail(path, new_line):
    with open(path, "a+", encoding="utf-8") as f:
        f.write(new_line + "\n")        # 追加新行（无视指针位置）
        f.seek(-50, 2)                  # 回到最后 ~50 字节
        # 注意：文本模式下 seek(-50, 2) 会报错，必须用 0
        # 这里仅示意，实际应先 seek(0,2) 再 seek 到 tell() - 50
```

不要在文本模式下 `seek(-50, 2)`——会抛 `io.UnsupportedOperation`。正确做法是先 `seek(0, 2)` 到末尾、`pos = f.tell()`、再用二进制模式或别的方式定位。

### 2.8 truncate()：截断文件

`truncate(size=None)` 是和 seek 关系密切的一个方法。它把文件截断到 `size` 字节——如果 `size` 比当前文件小，文件被砍掉一部分；如果 `size` 比当前文件大，文件被零字节填充扩展。`size` 不传时默认截断到当前指针位置。

**签名**：

```python
f.truncate(size: int | None = None) -> int
```

返回值是截断后的新文件大小。

**最基本的用法：截断到指定大小**

```python
with open("/tmp/tr.txt", "wb") as f:
    f.write(b"0123456789")               # 10 字节

with open("/tmp/tr.txt", "r+b") as f:
    f.truncate(4)                        # 截断到 4 字节

with open("/tmp/tr.txt", "rb") as f:
    print(f.read())
    # 输出：b'0123'                       # 只剩前 4 字节
```

**默认截断到当前指针位置**

```python
with open("/tmp/tr.txt", "rb+") as f:
    f.seek(3)                            # 指针移到第 3 字节
    f.truncate()                         # 不传参数，截断到第 3 字节
    print(f.tell())                      # 注意：truncate 不移动指针
    # 输出：3

with open("/tmp/tr.txt", "rb") as f:
    print(f.read())
    # 输出：b'012'
```

注意 `truncate()` 本身**不改变指针位置**——它只动文件大小、不动指针。如果之后还要读，通常要自己 `seek(0)`。

**扩展文件（用零字节填充）**

```python
with open("/tmp/tr.txt", "wb") as f:
    f.write(b"ABC")

with open("/tmp/tr.txt", "r+b") as f:
    f.truncate(8)                        # 扩展到 8 字节

with open("/tmp/tr.txt", "rb") as f:
    print(f.read())
    # 输出：b'ABC\x00\x00\x00\x00\x00'   # 后 5 字节是零填充
```

零填充在某些二进制格式预分配场景有用——比如数据库初始化时先把文件扩展到目标大小，再用 seek 在里面填实际数据，避免频繁扩展文件。

`truncate` 在 `w` 模式打开时被自动调用——`open(path, "w")` 会立即 `truncate(0)`，把文件清空。这是 `w` 模式会清空文件的本质原因。

### 2.9 tell 与 seek 的配合使用模式

把 `tell` 和 `seek` 组合起来，能完成几类常见任务。

**模式一：保存当前位置 → 跳到别处 → 跳回**

需要"先去文件别的地方读点东西，再回来继续原来位置的工作"时，用 tell 保存当前位置，事毕 seek 回去：

```python
import io

buf = io.BytesIO(b"0123456789")
pos = buf.tell()                         # 保存当前位置（0）
buf.read(3)                              # 读 3 字节，指针到 3
saved = buf.tell()                       # 保存当前位置（3）

# 跳到末尾去做点事
buf.seek(0, 2)
print(buf.tell())                        # 10，确认在末尾
# 输出：10

# 事毕，跳回保存的位置继续工作
buf.seek(saved)
print(buf.read())                        # 从第 3 字节读到末尾
# 输出：b'3456789'
```

**模式二：peek（偷看）——读下一段但不消耗指针**

编程语言 IO 库里常有 `peek()` 方法——读下一段数据但指针不动。Python 标准库没直接提供，但用 tell+seek 可以模拟：

```python
import io

def peek(f, n):
    """偷看下 n 个字节，但不移动指针。"""
    pos = f.tell()
    data = f.read(n)
    f.seek(pos)                          # 读完后跳回去
    return data

buf = io.BytesIO(b"ABCDEFGHIJ")
print(peek(buf, 3))                      # 偷看，指针不动
# 输出：b'ABC'
print(buf.tell())                        # 指针仍为 0
# 输出：0
print(buf.read(2))                       # 真正读取，指针前进
# 输出：b'AB'
print(buf.tell())                        # 指针在 2
# 输出：2
```

这种模式在"语法解析需要先看下一个 token 才能决定如何处理当前 token"的场景常用——比如 JSON 解析器、表达式求值器。

**模式三：回卷重读——读完一遍后回开头重读**

```python
with open("/tmp/cn.txt", "rb") as f:
    first_pass = f.read()
    # 处理一遍 ...

    f.seek(0)                            # 回到开头
    second_pass = f.read()               # 再次完整读
    assert first_pass == second_pass     # 内容一致（文件未变）
```

看似无用，但在"第一次扫一遍得到统计信息、第二次再据此精读"的场景很常见。比如先扫一遍统计每行长度用于分配缓冲，再 seek(0) 重读按行处理。

### 2.10 边界与异常情况

**seek 到负位置**

`whence=0` 下 offset 为负会立即抛 `ValueError`：

```python
with open("/tmp/t.txt", "rb") as f:
    f.seek(-1)
    # ValueError: negative seek value -1
```

`whence=1`、`whence=2` 下可以负，但不能让最终位置为负：

```python
with open("/tmp/t.txt", "rb") as f:
    f.seek(0)
    f.seek(-5, 1)                        # 最终位置 = 0 + (-5) = -5，非法
    # OSError: [Errno 22] Invalid argument
```

**seek 越过文件末尾**

二进制模式下合法，读返回空，写则填充零字节：

```python
with open("/tmp/t.txt", "wb+") as f:
    f.write(b"hi")                       # 2 字节
    f.seek(10)                           # 跳到第 10 字节，越过末尾
    f.write(b"END")                      # 写入：在 2-10 之间填充 8 个零字节
    f.seek(0)
    print(f.read())
    # 输出：b'hi\x00\x00\x00\x00\x00\x00\x00\x00END'
```

文本模式下同样允许 seek 越过末尾（`seek(0, 2)` 之后再 seek 还可以），但写入行为在 Windows 上依赖于具体实现，跨平台不可靠。

**对关闭的文件调 seek/tell**

```python
f = open("/tmp/t.txt", "rb")
f.close()
f.tell()
# ValueError: I/O operation on closed file.
```

每次读写、seek、tell 前都应确保文件未关闭，用 `with` 是最稳的——出了 `with` 块自动关闭，也不会用到关闭后的对象。

**对 seekable() 为 False 的流调 seek**

```python
import sys
sys.stdin.seek(0)
# io.UnsupportedOperation: underlying stream is not seekable
```

提前 `seekable()` 判断可以兜底。

## 3. 最佳实践

- **能用二进制模式就用二进制模式**。文本模式的 seek 限制多、坑深，除非你确定只在 tell 返回过的位置之间 seek，否则一律用 `rb`/`wb`/`r+b`。要读 UTF-8 文本时，二进制读取后手动 `decode` 更可控：

  ```python
  with open("/tmp/log.txt", "rb") as f:
      raw = f.read()
      text = raw.decode("utf-8")
  ```

  不推荐在 `r` 模式下 `seek(5)` 这种"猜字节位置"的写法——一旦遇上多字节字符就崩。

- **读写切换之间显式 seek**。在 `r+`、`w+`、`a+`、`r+b` 等读写模式下，read 和 write 共用同一指针，切换方向前必须 seek。不要依赖"上次读到哪，下次接着写"的隐式行为——它往往不是你以为的位置：

  ```python
  # 不推荐：依赖隐式指针位置
  with open("/tmp/x", "r+b") as f:
      f.read(5)
      f.write(b"XX")          # 究竟写在哪？不直观，要数字节才知

  # 推荐：每次写前显式 seek 到目标位置
  with open("/tmp/x", "r+b") as f:
      f.read(5)
      f.seek(5)               # 明确写到第 5 字节起
      f.write(b"XX")
  ```

- **追加场景用 a 模式，不要用 r+ 模拟**。很多人为了"追加日志"用 `r+` 模式 + `seek(0, 2)` 跳到末尾再写，这能工作但有竞态条件——如果两个进程同时做这件事，可能互相覆盖。`a` 模式由内核 `O_APPEND` 标志保证原子追加，多进程并发安全：

  ```python
  # 不推荐：r+ + seek 末尾写，多进程不安全
  with open("/tmp/log", "r+") as f:
      f.seek(0, 2)
      f.write("new line\n")

  # 推荐：a 模式，O_APPEND 保证原子追加
  with open("/tmp/log", "a") as f:
      f.write("new line\n")
  ```

- **大文件用 seek 分段读取而非全读**。处理 GB 级文件时，不要 `f.read()` 一次性读进内存——用 seek 切分块读：

  ```python
  def process_large_file(path, chunk_size=64 * 1024):
      """分块处理大文件，避免内存爆。"""
      import os
      size = os.path.getsize(path)
      with open(path, "rb") as f:
          for offset in range(0, size, chunk_size):
              f.seek(offset)
              chunk = f.read(min(chunk_size, size - offset))
              # 处理 chunk ...
  ```

- **频繁小 seek 不一定快**。理论上 seek 跳到任意位置直接读取很高效，但每次 `seek` 在 Python 层是一次系统调用、`read` 又一次，频繁小 seek 在性能敏感场景可能比"一次读大块到内存再切片"慢。如果记录很小且总数巨大，先 `read()` 整段再切片往往更快：

  ```python
  # 不推荐：每条记录都 seek + read
  for i in range(10000):
      f.seek(i * 16)
      rec = f.read(16)

  # 推荐：一次性读到内存再切片
  data = f.read()
  for i in range(10000):
      rec = data[i * 16 : (i + 1) * 16]
  ```

  临界点取决于记录大小、文件大小、是否热点路径——做性能测量再决定，不要凭直觉。

- **seekable() 写库函数时优先用**。写工具函数接受 file-like 对象时，先 `seekable()` 判断，提供 seek 和流式两条路径，能兼容真实文件和管道/stdin：

  ```python
  def robust_line_reader(f):
      if f.seekable():
          f.seek(0)
      for line in f:
          yield line.rstrip("\n")
  ```

- **text mode 不要 seek 非零位置**。如果实在需要在文本文件中随机访问，最稳的方案是先用二进制读取、整体解码后用字符串切片：

  ```python
  # 想从文件中间某个字符开始读，不要这样做：
  # with open("file", "r") as f:
  #     f.seek(6)        # 6 是字节数，但 read 之后解码可能崩

  # 这样做：
  with open("file", "rb") as f:
      raw = f.read()
  text = raw.decode("utf-8")
  middle = text[6:]       # 按字符数切片，不是字节，不会崩
  ```

- **truncate 之后要 seek**。`truncate()` 不移动指针，截断后读写得自己安排指针位置。容易忘的坑：

  ```python
  with open("/tmp/x", "r+b") as f:
      f.seek(5)
      f.truncate()        # 截断到第 5 字节，但指针还在第 5
      # 此时 f.read() 读到空（指针已在文件末尾）
      f.seek(0)           # 截断后通常需要 seek(0) 准备重新读
  ```

- **用 `with` 管文件生命周期**。手动 `open`/`close` 容易遗漏关闭，留下未关闭的文件对象调 `seek` 会抛异常。`with` 保证退出块时自动关闭，是最稳的写法。

## 4. 原理

### 4.1 文件指针的操作系统基础

文件指针本质上是操作系统为每个打开的文件描述符（file descriptor，fd）维护的一个整数——文件偏移量（file offset）。这个偏移量存在内核的 `struct file` 中，每打开一次文件就有一个独立的偏移量，即便两个 fd 指向同一个文件：

```python
import os

with open("/tmp/t.txt", "wb") as f:
    f.write(b"0123456789")

# 两个独立 fd，各有独立指针
fa = open("/tmp/t.txt", "rb")
fb = open("/tmp/t.txt", "rb")
print(fa.fileno(), fb.fileno())          # 不同的 fd 号
# 输出：3 4 （具体数字看系统状态）

fa.read(3)                               # fa 指针到 3
print(fa.tell(), fb.tell())              # fa 在 3，fb 还在 0
# 输出：3 0
```

`fileno()` 返回的就是这个 fd。`fa.read(3)` 后 `fa` 的指针移动了 3，但 `fb` 的指针不动——因为它们是不同的 fd，内核里独立维护。

`seek()` 在 Python 层最终调到的是 C 标准库的 `lseek(fd, offset, whence)` 系统调用。这个调用直接修改内核里那个偏移量整数。所以 `seek` 才有"读不影响"+"写不影响"+"任意跳"的特性——它就是设置一个整数，与读写本身解耦。

### 4.2 为什么文本模式的 seek 受编码限制

文本模式的 seek 限制，根源在于"字符≠字节"。

Python 3 的 `str` 是 Unicode 字符串，一个字符在内存中是 1-4 个码元（取决于编码）。但磁盘上的文本文件是按字节存的——一个汉字"你"在 UTF-8 下占 3 字节、在 GBK 下占 2 字节、在 UTF-32 下占 4 字节。文本模式打开文件时，Python 做的是"按字节读 + 增量解码成字符"，把字节流转换成 str 流：

```
磁盘字节流: [E4 BD A0] [E5 A5 BD] [E4 B8 96] [E7 95 8C]
解码后字符:   你         好         世          界
```

关键问题：解码过程需要一个**起始点**——从这个字节开始往后解码。如果 seek 把指针停在第 2 字节（"你"的中间字节），下次 read 时 Python 试图从 `0xA0` 开始解码，这个字节本身不是合法 UTF-8 起始字节，解码失败：

```python
# 文本模式 seek 到字符中间字节的后果
with open("/tmp/cn.txt", "w", encoding="utf-8") as f:
    f.write("你好")

with open("/tmp/cn.txt", "r", encoding="utf-8") as f:
    f.seek(1)                            # 第 1 字节是"你"的中间字节
    f.read()                             # 尝试从这里解码，必然失败
    # UnicodeDecodeError: 'utf-8' codec can't decode byte 0xbd in position 0
```

CPython 的应对策略是**文本模式禁止 whence=1 的非 0 seek、禁止 whence=2 的非 0 seek**，唯一允许的 seek 是 whence=0（绝对位置）。

但 whence=0 也不能跳到任意字节——如果允许跳到字符中间，下次读还是解码失败。CPython 进一步加了一条限制：**文本模式 seek 到非 0 位置时，要求这个 offset 之前必须已经通过 tell() 返回过**。换句话说，Python 记住"哪些位置是字符边界"，你只能 seek 到这些被验证过的边界位置：

```python
# 文本模式 seek 仅允许 seek 到此前 tell() 报告过的位置
with open("/tmp/cn.txt", "r", encoding="utf-8") as f:
    f.read(1)                # 读"你"，指针到第 3 字节
    p = f.tell()             # 告诉 Python "第 3 字节是字符边界"
    f.read(1)                # 读"好"，指针到第 6
    q = f.tell()

    f.seek(p)                # ✅ seek 到 tell 记录过的边界
    f.seek(q)                # ✅
    f.seek(6)                # 大多数情况下也行（6 恰好是好|世的边界）
    f.seek(4)                # 可能 ❌——4 不是字符边界，且没被 tell 记录过
```

CPython 的具体实现（在 `Modules/_io/textio.c`）逻辑大致是：

1. 文本 IO 对象维护一个"已知字符边界位置"的集合（用哈希表或简单记录最近一次 tell 的位置）。
2. seek(offset, 0) 调用时，先把 offset 解析为字节位置；如果 offset 是已知的边界，直接跳过去；否则按文本模式下"行扫描+解码"的方式找最近的合法起点，重新增量解码到 offset 位置（性能差）。
3. seek(x, 1) 和 seek(x, 2) 对非 0 x 直接报 `can't do nonzero cur-relative/end-relative seeks`。

之所以文本模式的 seek 严格，是为了杜绝"刚 seek 完 read 就崩"的隐蔽 bug——宁可让你显式用二进制模式自己处理编码，也不让你以为能 seek 实际却崩。

### 4.3 缓冲与指针的同步

Python 文件对象的指针，其实有两层：内核里的文件偏移量（`lseek` 控制的那个）和 Python 缓冲区里逻辑上的"读指针"。

为什么有缓冲？因为系统调用昂贵——读 1 字节也走一次 `read()` 系统调用的话，1MB 文件要 100 万次系统调用。Python 的 BufferedIOBase 默认会一次读 8KB 进内部缓冲区，后续 read 从缓冲区取，缓冲区空了再发起下一次系统调用读下一个 8KB。

这层缓冲对用户透明，但对 seek 有副作用：seek 不一定立即触发 `lseek` 系统调用——如果新位置在当前缓冲区范围内，只需调整缓冲区内的指针即可；如果跳出缓冲区，才废弃缓冲区、调用 `lseek` 重新读。

```python
# 缓冲对 tell/seek 的影响（在 CPython 上观察）
with open("/tmp/t.txt", "wb") as f:
    f.write(b"x" * 100000)              # 一个 100KB 的文件

with open("/tmp/t.txt", "rb") as f:
    f.read(100)                         # 读 100 字节，但缓冲区实际读了 8KB
    print(f.tell())                     # tell 返回 100，逻辑指针
    # 输出：100
    # 但内核里的偏移量其实是 8192（缓冲区预读了 8KB）
    f.seek(50)                          # seek 到第 50 字节
    # 这时候其实不用重新调系统调用——50 在已缓冲范围内
    print(f.read(5))
    # 输出：b'xxxxx'
```

`tell()` 返回的是"逻辑指针"位置——用户视角下"下一次 read 从第几字节开始"，与缓冲实现细节无关。这就是为什么 `tell()` 和 `seek()` 总是配套可信的——它们俩用同一个逻辑指针，缓冲对它们透明。

但 `os.path.getsize`、`os.stat` 这些走的是 inode 信息，与 fd 的偏移量、缓冲无关。混用时要分清：`tell()` 是"逻辑读位置"，`os.path.getsize` 是"文件实际大小"，两者完全独立。

### 4.4 文本模式下 tell 返回的不透明值

在文本模式下，`tell()` 返回的不仅是一个字节偏移量，CPython 还在内部编码了一个"cookie"——能从中恢复解码器状态。这是因为文本模式可能在文件中途（比如某行的中间）调过 tell，要 seek 回来时得能恢复"正好处于半行 half-state"的解码器状态。

具体上，文本模式 tell 返回值结构是 64 位整数，里面打包了：

- 字节偏移量
- 在当前 UTF-8 序列中的位置（处理跨 chunk 的多字节字符）
- 编码器/解码器的内部状态位

这就是为什么文本模式 seek 的合法 offset 偏窄——它要解析这个 cookie，cookie 没记录过的位置它无法恢复解码器状态，只能拒绝（或退化到"全文件重新解码到这个位置"的慢路径）。

这个细节对日常编程影响不大，但理解了能解释一个怪现象：文本模式下 `tell()` 的返回值，"理论上"不保证等于 UTF-8 字节偏移——虽然 99% 的情况下它就是字节偏移。不要拿它做按字符数下标的换算（如"tell 返回 6，所以前 2 个字符占 6 字节"），这是个反模式——多个字符占多少字节取决于字符本身。

### 4.5 a 模式的内核实现

为什么 a 模式下 seek 对 write 无效？答案是 `O_APPEND` 这个 open 标志位。

```c
// CPython 在打开 a 模式文件时调用 open 的近似形式
int fd = open(path, O_WRONLY | O_APPEND);
```

`O_APPEND` 告诉内核："每次 write 之前，自动把偏移量设为文件末尾"。这个动作是原子的——在 `seek` 和真正 `write` 之间不会有间隙被别的进程插入。这就是 a 模式多进程并发追加安全的内核保证。

C 标准库的 `fopen("a")` 还多了一条特殊处理：第一次 fwrite 之前自动 `fseek(fp, 0, SEEK_END)`。Python 的 BufferedIO 在模式串包含 `a` 时打开就走类似路径。这两层共同决定了 a 模式的"无论怎么 seek，write 永远追加到末尾"行为。

### 4.6 seek 在不同平台上的细节差异

- **Linux/macOS**：lseek 完全支持 whence=0/1/2、负 offset（最终位置非负即可）、超过文件末尾的 seek。
- **Windows**：基本一致，但在文本模式下 CPython 必须显式处理 `\r\n` 换行——文本模式默认会把 `\r\n` 翻译成 `\n`，导致"字符位置"和"字节位置"复杂对应。CPython 文本模式在 Windows 上 seek 行为更保守，可能比 Linux 更频繁抛 `UnsupportedOperation`。
- **管道/套接字/终端**：底层 fd 不支持 lseek，`seekable()` 返回 False，seek 抛错。这是流式 IO 的本质——没有"前面"可回去。
- **网络文件系统（NFS/SMB）**：理论上支持 seek，但性能可能差，且并发写入时一致性依赖服务器实现。

## 5. 总结

### 5.1 本文内容要点

- **文件指针**是文件对象维护的"当前读写位置"，是一个字节偏移量整数，决定下次 read/write 的起点。
- **`tell()`** 返回当前指针位置，无副作用；文本模式返回值是"不透明 cookie"，二进制模式是真实字节偏移。
- **`seek(offset, whence=0)`** 把指针移到指定位置；whence 三档：`0` 相对文件头、`1` 相对当前位置、`2` 相对文件末尾。返回新位置。
- **文本模式下 seek 受编码限制**：只允许 whence=0 的非负 offset，且需要是字符边界；whence=1 仅允许 0、whence=2 仅允许 0。根源是"字符≠字节"，skip 到非字符边界会令解码崩溃。
- **二进制模式下 seek 完全自由**：任意 offset、任意 whence、可负可零可正。要随机访问 UTF-8 文本，用 `rb` 读取后手动 decode 更可控。
- **`seekable()`** 判断流是否支持 seek；管道、终端、网络流不支持，提前判断避免异常。
- **`truncate(size=None)`** 截断文件到指定大小；不传参时截断到当前指针位置；不移动指针。
- **追加模式 a/a+** 下 write 无视指针位置、由内核 O_APPEND 保证原子追加到文件末尾；read 仍受 seek 影响。
- **回读刚写的内容、随机读取二进制记录、断点续传、tail -f 模拟** 等场景必须配合 seek 与 tell 完成。
- **最佳实践**：能用二进制就用二进制；读写切换显式 seek；追加用 a 模式而非 r+ 模拟；大文件 seek 分块读；写库时用 seekable() 兜底。

### 5.2 读完应掌握

读完本文你应能掌握：

- 说明 `seek(offset, whence)` 三个 whence 值各自语义，能根据"想从哪开始移动"选用正确的 whence。
- 区分文本模式与二进制模式下 seek 的行为差异，理解文本模式为何只能 seek 到 0 或 tell 返回过的位置。
- 用 `seek(0, 2)` + `tell()` 一行获取文件大小，用 `seek(-N, 2)` 读取文件末尾 N 字节。
- 用 `seek` + `read` 实现"固定宽度二进制记录的随机访问"——直接 seek 到 `N * record_size` 读取第 N 条记录，无需扫描前面所有记录。
- 在 `r+`/`w+` 模式下正确地"先写后读"或"先读后写"——读写切换之间显式 seek，知道为什么不能依赖隐式指针。
- 用 tell + seek 实现"保存当前位置 → 跳到别处 → 跳回"以及"peek 偷看不消耗指针"两个常用模式。
- 说明 `a` 模式下"seek 对 write 无效"的原因（内核 O_APPEND 标志），并知道多进程并发追加为何要用 a 而非 r+。
- 用 `seekable()` 写出兼容真实文件和管道/stdin 的库函数。
- 解释文本模式 seek 受限的底层原因——字符与字节单位不一致、解码器需要合法起始字节、CPython 用 cookie 记录字符边界。
- 判断何时该用二进制模式处理文本文件，何时用文本模式即可——避免在文本模式下猜字节位置踩编码坑。
