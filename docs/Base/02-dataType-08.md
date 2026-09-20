---
group:
  title: 【02】基础数据类型和类型系统
  order: 2
order: 8
title: bytes类型详解
nav:
  title: Python基础
  order: 1
---

# bytes类型详解

## 1. 介绍

### 1.1 什么是 bytes

`bytes` 是 Python 中表示**不可变字节序列**的内置类型。每个元素是一个 0~255 的整数（即一个字节），它是 `str` 在二进制世界的对应物——`str` 存的是 Unicode 字符，`bytes` 存的是原始字节。

```python
b = b'hello'
print(type(b))         # <class 'bytes'>
print(b)               # b'hello'
print(b[0])             # 104 —— 取元素返回 int（ASCII 'h' 的码值）
print(b[0:3])           # b'hel' —— 切片返回 bytes
```

为什么需要 `bytes`？计算机底层只认字节（0 和 1），不认"字符"。当你读写文件、发送网络请求、做加密哈希时，数据全都是原始字节。`str` 是给人看的（Unicode 字符），`bytes` 是给机器看的（原始字节）。两者通过编码（encode）和解码（decode）互相转换。

### 1.2 bytes 在 Python 类型体系中的位置

`bytes` 属于 Python 的**内置基础类型**，和 `str` 是平行关系：

```text
Python 内置序列类型
├── 文本序列
│   └── str          不可变 Unicode 字符序列
├── 二进制序列
│   ├── bytes        不可变字节序列（本篇主角）
│   └── bytearray    可变字节序列
└── 通用容器
    ├── list / tuple / range ...
```

三者对比：

| 维度 | `str` | `bytes` | `bytearray` |
|------|-------|---------|-------------|
| 内容 | Unicode 字符 | 字节（0-255 整数） | 字节（0-255 整数） |
| 可变性 | 不可变 | 不可变 | **可变** |
| 取元素返回 | `str`（单字符） | `int`（0-255） | `int`（0-255） |
| 可哈希 | 是 | 是 | 否 |
| 典型用途 | 文本处理 | 二进制数据/I/O | 可变二进制缓冲区 |

### 1.3 最简示例

```python
# 创建 bytes
b = b'Hello'

# str → bytes（编码）
encoded = "你好".encode("utf-8")     # b'\xe4\xbd\xa0\xe5\xa5\xbd'

# bytes → str（解码）
decoded = encoded.decode("utf-8")    # '你好'

# 二进制文件读写
with open('data.bin', 'rb') as f:    # rb = read binary
    data = f.read()                   # data 是 bytes
```

---

## 2. 核心内容

### 2.1 bytes 的创建方式

`bytes` 有多种创建方式，掌握每种的使用场景很重要。

#### 2.1.1 字面量：b 前缀

最直接的方式——在字符串前加 `b` 前缀：

```python
b1 = b'hello'
b2 = b"world"           # 单双引号等价
b3 = b'''multi
line'''                  # 三引号也可以

print(b1)                # b'hello'
print(type(b1))          # <class 'bytes'>
```

⚠️ 字面量中只能直接写 **ASCII 字符**（码值 0-127）。中文字符等非 ASCII 字符不能直接写在 `b''` 中，必须用转义或 `encode()`：

```python
# b'你好'              # SyntaxError: 只允许 ASCII
b'\xe4\xbd\xa0'         # 正确：用十六进制转义
"你好".encode('utf-8')  # 正确：用 encode
```

#### 2.1.2 十六进制转义

当你需要精确指定每个字节值时，用 `\xHH` 转义（HH 是两位十六进制）：

```python
b = b'\x41\x42\x43'     # 等价于 b'ABC'
print(b)                 # b'ABC'

# 非 ASCII 字节
b_raw = b'\x00\xff\x80'  # 3 个字节：0, 255, 128
print(b_raw)             # b'\x00\xff\x80'
```

#### 2.1.3 bytes() 构造函数

`bytes()` 构造函数接受三种参数，对应三种创建方式：

**从整数列表创建**——每个元素必须是 0~255 的整数：

```python
b = bytes([72, 101, 108, 108, 111])
print(b)                 # b'Hello'（对应 ASCII 码 72='H', 101='e', ...）

# 超出范围报错
# bytes([256])           # ValueError: bytes must be in range(0, 256)
```

**指定长度创建全零 bytes**：

```python
b = bytes(5)
print(b)                 # b'\x00\x00\x00\x00\x00'
```

**从可迭代对象创建**（和整数列表类似）：

```python
b = bytes(range(65, 68))    # 65='A', 66='B', 67='C'
print(b)                     # b'ABC'
```

#### 2.1.4 从 str 编码创建

通过 `str.encode()` 或 `bytes(str, encoding)` 将字符串编码为字节序列：

```python
b1 = "Hello".encode("utf-8")
b2 = bytes("Hello", encoding="utf-8")
# 两者等价

print(b1)                # b'Hello'
```

这是最常用的方式，编码细节在 2.2 节展开。

#### 2.1.5 bytes.fromhex()：从十六进制字符串创建

当数据以十六进制字符串形式存在时（如网络抓包、密钥），用 `fromhex`：

```python
b = bytes.fromhex('48656c6c6f')
print(b)                 # b'Hello'
```

反过来，`bytes.hex()` 把字节转为十六进制字符串：

```python
print(b'Hello'.hex())    # '48656c6c6f'
```

### 2.2 str 与 bytes 的编码与解码

这是 `bytes` 最核心的知识——`str` 与 `bytes` 之间的转换。理解编码/解码，是理解所有文本处理的基础。

#### 2.2.1 编码（encode）：str → bytes

`str.encode(encoding)` 将 Unicode 字符串转为字节序列。编码不同，同一字符串产生的字节数和值不同：

```python
s = "你好A"

# UTF-8 编码：中文 3 字节，英文 1 字节
b_utf8 = s.encode("utf-8")
print(b_utf8)            # b'\xe4\xbd\xa0\xe5\xa5\xbdA'
print(len(b_utf8))       # 7（2 个中文 × 3 + 1 个英文）

# GBK 编码：中文 2 字节，英文 1 字节
b_gbk = s.encode("gbk")
print(b_gbk)             # b'\xc4\xe3\xba\xc3A'
print(len(b_gbk))        # 5（2 个中文 × 2 + 1 个英文）
```

不同编码对同一字符可能产生不同数量的字节。**UTF-8 是最常用的编码**——它兼容 ASCII（英文 1 字节），支持全 Unicode（中文通常 3 字节，emoji 4 字节），且无字节序问题。

#### 2.2.2 解码（decode）：bytes → str

`bytes.decode(encoding)` 将字节序列还原为 Unicode 字符串：

```python
b = "你好".encode("utf-8")
s = b.decode("utf-8")
print(s)                 # 你好
print(s == "你好")       # True
```

**编码和解码必须用相同的编码格式**，否则会乱码或报错：

```python
b = "你好".encode("utf-8")

# 乱码：用 GBK 解码 UTF-8 编码的字节
print(b.decode("gbk"))   # 浣犲ソ（乱码）

# 报错：用 ASCII 解码无法识别的字节
try:
    b.decode("ascii")
except UnicodeDecodeError as e:
    print(e)             # 'ascii' codec can't decode byte 0xe4...
```

#### 2.2.3 errors 参数：处理编解码错误

当数据不完整或编码不匹配时，`decode` 会抛 `UnicodeDecodeError`。通过 `errors` 参数控制错误处理策略：

```python
bad_bytes = b'\x80\x81abc'   # 前 2 个字节不是有效的 UTF-8 / ASCII

# strict（默认）：遇到错误抛异常
# bad_bytes.decode('ascii')  # UnicodeDecodeError

# ignore：跳过无法解码的字节
print(bad_bytes.decode('ascii', errors='ignore'))   # 'abc'

# replace：用 ？ 替换无法解码的字节
print(bad_bytes.decode('ascii', errors='replace'))  # '？？abc'

# backslashreplace：用 \xHH 转义显示
print(bad_bytes.decode('ascii', errors='backslashreplace'))  # '\\x80\\x81abc'
```

| errors 值 | 行为 | 典型场景 |
|-----------|------|---------|
| `strict` | 抛 `UnicodeDecodeError` | 默认，数据应完整正确 |
| `ignore` | 跳过错误字节 | 允许丢少量数据的场景 |
| `replace` | 用 `` 替换 | 给用户显示乱码位置的替代 |
| `backslashreplace` | 用 `\xHH` 转义 | 调试，想看到具体哪些字节有问题 |

#### 2.2.4 常见编码格式对比

| 编码 | 英文字节 | 中文字节 | Emoji 字节 | 特点 |
|------|---------|---------|-----------|------|
| ASCII | 1 | 不支持 | 不支持 | 最早的编码，只支持 0-127 |
| UTF-8 | 1 | 3 | 4 | 最通用，Web 事实标准 |
| UTF-16 | 2 | 2 | 4（或更多） | 固定 2 字节起步，有字节序问题 |
| GBK | 1 | 2 | 不支持 | 中文环境，Windows 中文版默认 |
| ISO-8859-1 | 1 | 不支持 | 不支持 | 又称 Latin-1，单字节编码 |

日常编码几乎总是用 UTF-8。只有在处理旧的中文 Windows 系统数据时才会遇到 GBK。

#### 2.2.5 len() 的差异：字符数 vs 字节数

`len(str)` 返回字符数，`len(bytes)` 返回字节数——这是新手最常踩的坑：

```python
s = "你好"
print(len(s))               # 2 —— 2 个字符

b = s.encode("utf-8")
print(len(b))               # 6 —— 6 个字节（每个中文 3 字节）

b_gbk = s.encode("gbk")
print(len(b_gbk))           # 4 —— 4 个字节（每个中文 2 字节）
```

网络传输、文件存储时，长度限制（如 HTTP Content-Length）指的是**字节数**，不是字符数。

### 2.3 bytes 的常用方法

`bytes` 的大部分方法与 `str` 同名，但参数和返回值都是 `bytes` 而非 `str`。

#### 2.3.1 大小写转换

```python
b = b'Hello, World'

print(b.upper())           # b'HELLO, WORLD'
print(b.lower())           # b'hello, world'
print(b.swapcase())        # b'hELLO, wORLD'
print(b.title())           # b'Hello, World'
```

#### 2.3.2 查找与判断

```python
b = b'Hello, World'

print(b.find(b'World'))    # 7 —— 返回首次出现的索引，找不到返回 -1
print(b.index(b'World'))   # 7 —— 同 find，但找不到抛 ValueError
print(b.rfind(b'l'))       # 10 —— 从右查找
print(b.count(b'l'))       # 3 —— 统计出现次数

print(b.startswith(b'Hello'))  # True
print(b.endswith(b'World'))     # True
print(b.isalpha())              # False —— 含逗号空格，不全是字母
print(b'abc'.isalpha())         # True
print(b'123'.isdigit())         # True
```

#### 2.3.3 替换与分割

```python
b = b'Hello, World'

# 替换：注意参数是 bytes，不是 str
print(b.replace(b'World', b'Python'))   # b'Hello, Python'

# 分割
print(b.split(b', '))        # [b'Hello', b'World']
print(b.split(b', ', 1))     # [b'Hello', b'World']（maxsplit=1）

# 拼接
print(b', '.join([b'a', b'b', b'c']))   # b'a, b, c'

# 去空白
print(b'  hi  '.strip())     # b'hi'
print(b'  hi  '.lstrip())    # b'hi  '
print(b'xxhixx'.strip(b'x')) # b'hi' —— 去指定字符
```

#### 2.3.4 bytes 特有方法

```python
# fromhex / hex：十六进制字符串与 bytes 互转
b = bytes.fromhex('deadbeef')
print(b)                     # b'\xde\xad\xbe\xef'
print(b.hex())                # 'deadbeef'

# decode：转 str（bytes 独有，str 没有）
print(b'hello'.decode('ascii'))   # 'hello'

# removeprefix / removesuffix（Python 3.9+）
print(b'hello.py'.removeprefix(b'hello.'))  # b'py'
```

#### 2.3.5 方法参数必须是 bytes

⚠️ 这是新手最常踩的坑——调用 `bytes` 方法时，参数必须是 `bytes`，不能传 `str`：

```python
b = b'Hello, World'

# 正确：参数是 bytes
b.split(b', ')               # [b'Hello', b'World']

# 错误：参数传 str 会报 TypeError
# b.split(', ')              # TypeError: a bytes-like object is required, not 'str'
```

### 2.4 bytes 的索引、切片与运算

#### 2.4.1 取元素返回 int

这是 `bytes` 与 `str` 最显著的区别：`bytes` 取单个元素返回 `int`（0~255），`str` 取单个元素返回 `str`（单字符）：

```python
b = b'hello'
s = 'hello'

print(b[0])               # 104    —— int（ASCII 'h' 的码值）
print(type(b[0]))         # <class 'int'>

print(s[0])               # 'h'   —— str（单字符）
print(type(s[0]))         # <class 'str'>
```

切片则返回自身类型——`bytes` 切片返回 `bytes`，`str` 切片返回 `str`：

```python
print(b[0:3])             # b'hel' —— bytes
print(s[0:3])             # 'hel'  —— str
```

#### 2.4.2 运算符

`bytes` 支持序列类型的通用运算：

```python
# 拼接
print(b'ab' + b'cd')         # b'abcd'

# 重复
print(b'ab' * 3)              # b'ababab'

# 成员判断
print(b'ell' in b'hello')     # True
print(b'xyz' in b'hello')     # False

# 比较运算（按字节逐个比较）
print(b'abc' < b'abd')        # True
print(b'abc' == b'abc')       # True
print(b'ABC' < b'abc')        # True（大写字母码值 < 小写）
```

#### 2.4.3 可迭代

`bytes` 是可迭代对象，迭代时每次取出一个 `int`：

```python
b = b'ABC'
for byte in b:
    print(byte, end=' ')      # 65 66 67

print(list(b))                # [65, 66, 67]
```

### 2.5 bytearray：可变的 bytes

`bytearray` 是 `bytes` 的可变版本——和 `bytes` 一样存字节序列，但可以就地增删改。它和 `bytes` 的关系，就像 `list` 之于 `tuple`。

#### 2.5.1 创建与基本操作

```python
ba = bytearray(b'hello')
print(type(ba))                # <class 'bytearray'>
print(ba)                      # bytearray(b'hello')
```

#### 2.5.2 就地修改

```python
ba = bytearray(b'hello')

# 通过索引修改单个字节
ba[0] = 72                     # 'h' → 'H'（ASCII 72 = 'H'）
print(ba)                      # bytearray(b'Hello')

# 追加字节
ba.append(33)                  # 33 = '!'
print(ba)                      # bytearray(b'Hello!')

# 扩展
ba.extend(b'!!')
print(ba)                      # bytearray(b'Hello!!!')

# 插入
ba.insert(0, 62)              # 62 = '>'
print(ba)                      # bytearray(b'>Hello!!!')

# 删除
ba.pop()
del ba[0]
print(ba)                      # bytearray(b'Hello!!')

# 反转
ba.reverse()
print(ba)                      # bytearray(b'!!olleH')
```

#### 2.5.3 bytes vs bytearray 对比

| 维度 | `bytes` | `bytearray` |
|------|---------|-------------|
| 可变性 | 不可变 | **可变** |
| 创建方式 | `b'...'` 字面量 | `bytearray(b'...')` |
| 就地修改 | 不支持（TypeError） | 支持（`ba[0] = 72`） |
| 可哈希 | 是 | 否（不能做 dict 键） |
| 拼接 | `+` 返回新 `bytes` | `+` 返回新 `bytearray` |
| 何时用 | 大多数只读场景 | 需要频繁修改的缓冲区 |

```python
# bytes 不可变——任何"修改"操作返回新对象
b = b'hello'
b2 = b + b'!'               # b2 是新对象，b 不变
# b[0] = 72                 # TypeError: 'bytes' object does not support item assignment

# bytearray 可变——就地修改
ba = bytearray(b'hello')
ba[0] = 72                  # 就地修改，id 不变
ba.append(33)               # 就地追加
```

#### 2.5.4 互相转换

```python
ba = bytearray(b'hello')
b = bytes(ba)               # bytearray → bytes

b2 = b'world'
ba2 = bytearray(b2)          # bytes → bytearray
```

#### 2.5.5 何时用 bytearray

`bytearray` 适合需要频繁修改二进制数据的场景：

```python
# 场景：逐步构建二进制数据包
buf = bytearray(1024)       # 预分配 1KB 缓冲区
buf[0:4] = b'\x00\x01\x02\x03'   # 写入头部
buf[4:8] = b'\xff\xfe\xfd\xfc'   # 写入数据

# 比反复用 bytes + bytes 更高效，因为 + 每次创建新对象
result = b''
for chunk in [b'a', b'b', b'c']:
    result += chunk          # 每次创建新 bytes 对象

# 用 bytearray 更高效
buf = bytearray()
for chunk in [b'a', b'b', b'c']:
    buf.extend(chunk)        # 就地扩展
result = bytes(buf)          # 最终转回 bytes
```

### 2.6 二进制文件读写

文件 I/O 是 `bytes` 最常见的应用场景。以 `'rb'`/`'wb'` 模式打开的文件读写的是 `bytes`，`'r'`/`'w'` 模式读写的是 `str`。

#### 2.6.1 写入二进制文件

```python
data = b'\x89PNG\r\n\x1a\n'   # 伪 PNG 文件头

with open('image.png', 'wb') as f:    # wb = write binary
    f.write(data)
    f.write(b'\x00\x01\x02\x03')     # 可多次写入
```

二进制写入时，`write()` 的参数必须是 `bytes` 或 `bytearray`，不能是 `str`：

```python
# with open('data.bin', 'wb') as f:
#     f.write("hello")    # TypeError: a bytes-like object is required
#     f.write("hello".encode())   # 正确
```

#### 2.6.2 读取二进制文件

```python
with open('image.png', 'rb') as f:    # rb = read binary
    data = f.read()                    # 一次性读取全部，返回 bytes

print(type(data))     # <class 'bytes'>
print(len(data))      # 文件字节数
print(data[:8])       # 前 8 个字节
```

#### 2.6.3 分块读取

大文件一次读取可能占用大量内存。用分块读取处理流式数据：

```python
with open('large.bin', 'rb') as f:
    while True:
        chunk = f.read(4096)        # 每次读 4KB
        if not chunk:               # 读到空 = 文件结束
            break
        print(f"读取 {len(chunk)} 字节")
```

#### 2.6.4 文本模式 vs 二进制模式

| 模式 | 打开方式 | 读写类型 | 编码处理 |
|------|---------|---------|---------|
| 文本模式 | `'r'` / `'w'` | `str` | 自动编码/解码 |
| 二进制模式 | `'rb'` / `'wb'` | `bytes` | 原始字节，不编码 |

```python
# 文本模式：自动编码/解码
with open('text.txt', 'w', encoding='utf-8') as f:
    f.write("你好")                # 写入 str，自动编码为 UTF-8
with open('text.txt', 'r', encoding='utf-8') as f:
    print(f.read())                 # '你好'，自动解码

# 二进制模式：直接读写 bytes
with open('text.txt', 'rb') as f:
    raw = f.read()                   # bytes
    print(raw)                       # b'\xe4\xbd\xa0\xe5\xa5\xbd'
    print(raw.decode('utf-8'))       # '你好'，手动解码
```

什么时候用哪种模式？处理文本用文本模式（自动编解码），处理二进制数据（图片、视频、压缩包、网络协议）用二进制模式。

### 2.7 struct 模块：二进制打包与解包

`struct` 模块用于将 Python 值（整数、浮点数等）打包成 `bytes`，或将 `bytes` 解包回 Python 值。这是处理二进制协议、网络通信、二进制文件格式的核心工具。

#### 2.7.1 pack：打包为 bytes

`struct.pack(format, *values)` 将值按格式打包成字节序列：

```python
import struct

# 格式字符：I = 无符号 4 字节整数
packed = struct.pack('I', 42)
print(packed)               # b'*\x00\x00\x00'（42 的小端表示）
print(len(packed))          # 4 字节

# 多个值：I（4字节整数）+ f（4字节浮点）
packed = struct.pack('If', 42, 3.14)
print(len(packed))          # 8 字节（4 + 4）
```

#### 2.7.2 字节序

二进制数据有字节序问题——多字节值的低位在前（小端 LE）还是高位在前（大端 BE）。用格式字符串的首字符指定：

| 字符 | 字节序 | 场景 |
|------|--------|------|
| `<` | 小端（LE） | x86/ARM CPU 默认 |
| `>` | 大端（BE） | 网络协议、部分文件格式 |
| `!` | 网络字节序（=大端） | TCP/IP 网络协议 |
| `=` | 本机字节序 | 默认 |
| `@` | 本机字节序 + 本机对齐 | 默认 |

```python
print(struct.pack('<I', 1))    # b'\x01\x00\x00\x00'（小端）
print(struct.pack('>I', 1))    # b'\x00\x00\x00\x01'（大端）
print(struct.pack('!I', 1))    # b'\x00\x00\x00\x01'（网络序）
```

#### 2.7.3 常用格式字符

| 字符 | C 类型 | Python 类型 | 大小 |
|------|--------|------------|------|
| `B` | unsigned char | int | 1 字节 |
| `H` | unsigned short | int | 2 字节 |
| `I` | unsigned int | int | 4 字节 |
| `Q` | unsigned long long | int | 8 字节 |
| `f` | float | float | 4 字节 |
| `d` | double | float | 8 字节 |
| `s` | char[] | bytes | 1 字节/字符 |
| `x` | padding | - | 1 字节填充 |

#### 2.7.4 unpack：解包为 Python 值

```python
packed = struct.pack('If', 42, 3.14)

# 解包返回元组
values = struct.unpack('If', packed)
print(values)               # (42, 3.140000104904175)
```

#### 2.7.5 实际场景：构造二进制协议头

```python
import struct

# 自定义协议头：版本(1B) + 类型(1B) + 长度(2B) + 数据(4B)
# ! 表示网络字节序（大端）
header = struct.pack('!BBHI', 1, 0x0A, 512, 99999)
print(header)               # b'\x01\n\x02\x00\x00\x01\x86\x9f'
print(len(header))          # 8 字节（1+1+2+4）

# 解包
ver, typ, length, payload = struct.unpack('!BBHI', header)
print(f"版本={ver}, 类型=0x{typ:02X}, 长度={length}, 数据={payload}")
# 版本=1, 类型=0x0A, 长度=512, 数据=99999
```

#### 2.7.6 pack_into / unpack_from：操作预分配缓冲区

当你需要往已有的 `bytearray` 缓冲区中写入数据时，用 `pack_into`/`unpack_from`：

```python
import struct

buf = bytearray(8)                          # 预分配 8 字节缓冲区
struct.pack_into('II', buf, 0, 100, 200)    # 在偏移 0 写入两个 int
print(bytes(buf))                           # b'd\x00\x00\x00\xc8\x00\x00\x00'

v1, v2 = struct.unpack_from('II', buf, 0)   # 从偏移 0 读出
print(v1, v2)                               # 100 200
```

### 2.8 加密与哈希场景

加密和哈希操作处理的都是原始字节，因此 `hashlib`、`hmac`、`ssl` 等模块都接收 `bytes` 而非 `str`。

#### 2.8.1 hashlib 哈希

```python
import hashlib

# hashlib 接收 bytes，不接收 str
try:
    hashlib.md5("hello")           # TypeError: Strings must be encoded before hashing
except TypeError as e:
    print(e)

# 正确：先 encode
md5 = hashlib.md5("hello".encode('utf-8'))
print(md5.hexdigest())            # 5d41402abc4b2a76b9719d911017c592

# 直接传 bytes 也可以
md5 = hashlib.md5(b'hello')
print(md5.hexdigest())            # 5d41402abc4b2a76b9719d911017c592
```

#### 2.8.2 分块哈希（大文件场景）

处理大文件时，不能一次读入内存。用 `update()` 分块传入：

```python
import hashlib

h = hashlib.sha256()

# 模拟分块读取
chunks = [b'chunk1-', b'chunk2-', b'chunk3']
for chunk in chunks:
    h.update(chunk)               # 分块更新哈希

# 验证：分块哈希 = 整体哈希
full = hashlib.sha256(b'chunk1-chunk2-chunk3')
print(h.hexdigest() == full.hexdigest())   # True
```

#### 2.8.3 HMAC 带密钥哈希

```python
import hmac
import hashlib

key = b'secret_key'
msg = b'important message'

# 生成 HMAC
hmac_digest = hmac.new(key, msg, hashlib.sha256).hexdigest()
print(hmac_digest)

# 验证（防篡改）：用 compare_digest 而非 == 防时序攻击
expected = hmac.new(key, msg, hashlib.sha256).digest()
print(hmac.compare_digest(expected, hmac.new(key, msg, hashlib.sha256).digest()))  # True
```

#### 2.8.4 base64 编码

`base64` 是把二进制数据编码为 ASCII 文本的方案——让二进制数据能通过只支持文本的通道（如 JSON、HTTP 头）传输。输入输出都是 `bytes`：

```python
import base64

raw = b'\x00\x01\x02\x03\xff'

# 编码：bytes → bytes（全是 ASCII 字符）
encoded = base64.b64encode(raw)
print(encoded)                   # b'AAECA/8='

# 解码
decoded = base64.b64decode(encoded)
print(decoded == raw)            # True
```

---

## 3. 最佳实践

### 3.1 str 和 bytes 不要混用

```python
# 推荐：str 和 bytes 明确区分
text = "hello"
data = b'hello'

# 不推荐：混用会报错
# text + data               # TypeError: can't concat str to bytes
# data.startswith('h')      # TypeError: a bytes-like object is required
```

函数参数是 `str` 还是 `bytes` 要明确。若函数期望 `bytes`，传入 `str` 会报 `TypeError`，反之亦然。

### 3.2 编码/解码总是显式指定 encoding

```python
# 推荐：显式指定编码
text = "你好"
b = text.encode("utf-8")         # 明确
s = b.decode("utf-8")            # 明确

# 不推荐：依赖默认编码
b = text.encode()                # 用系统默认编码，不同平台可能不同
s = b.decode()                    # 同上

# 文件操作同理
with open('file.txt', 'r', encoding='utf-8') as f:  # 明确
    ...
```

Python 3 中 `encode()`/`decode()` 的默认编码是 UTF-8，但显式指定是好习惯——避免跨平台问题和阅读歧义。

### 3.3 处理编解码错误时用 errors 参数

```python
# 推荐：明确处理错误
text = raw_bytes.decode('utf-8', errors='replace')

# 不推荐：让它崩溃
text = raw_bytes.decode('utf-8')  # 遇到非法字节就抛异常
```

处理外部数据（网络、用户上传、未知来源文件）时，数据可能不完整或编码错误。用 `errors='replace'` 或 `errors='ignore'` 避免程序崩溃。

### 3.4 频繁拼接 bytes 用 bytearray

```python
# 推荐：用 bytearray 构建大量二进制数据
buf = bytearray()
for chunk in data_chunks:
    buf.extend(chunk)
result = bytes(buf)

# 不推荐：反复 bytes + bytes
result = b''
for chunk in data_chunks:
    result += chunk            # 每次创建新对象，O(n²) 复杂度
```

`bytes` 不可变，`+` 每次创建新对象并复制全部数据。`bytearray` 就地扩展，O(n) 复杂度。

### 3.5 二进制文件总是用 rb/wb 模式

```python
# 推荐：处理非文本文件用二进制模式
with open('image.png', 'rb') as f:
    data = f.read()

# 不推荐：用文本模式读二进制文件
# with open('image.png', 'r') as f:  # 可能 UnicodeDecodeError
#     data = f.read()
```

文本模式会自动做编码/解码和换行符转换，这在处理二进制文件时会破坏数据。

### 3.6 不要用 bytes 做字符串拼接展示

```python
# 推荐：需要显示文本时先 decode
print(b'hello'.decode())         # hello

# 不推荐：直接打印 bytes
print(b'hello')                  # b'hello'（带 b'' 前缀，不适合用户展示）
```

`bytes` 的 `repr` 带 `b'...'` 前缀，给用户看时应先 `decode()`。

### 3.7 取元素加 chr() 转字符

```python
b = b'hello'
char = chr(b[0])                  # 104 → 'h'，int 转回字符

# 或直接切片（切片返回 bytes，包含字符信息）
char = b[0:1]                    # b'h'
```

`bytes` 取元素返回 `int`，如果你需要字符而非码值，用 `chr()` 转换或用切片。

---

## 4. 原理

### 4.1 bytes 与 str 在内存中的存储差异

`str` 和 `bytes` 在内存中的表示完全不同：

```text
str "hello" 在内存中（CPython 3）：
┌───────────────────────┐
│ PyUnicode 对象         │
│ ├── refcount           │
│ ├── type ptr → str     │
│ ├── length = 5         │
│ └── 数据: H e l l o    │  ← 每个字符按 Unicode 码点存储
│         (不一定连续1字节)│  ← CPython 3.3+ 用紧凑表示
└───────────────────────┘

bytes b'hello' 在内存中：
┌───────────────────────┐
│ PyBytes 对象           │
│ ├── refcount           │
│ ├── type ptr → bytes   │
│ ├── length = 5         │
│ └── 数据: 48 65 6C 6C 6F │  ← 每个字节连续 1 字节存储
│         (ASCII 码值)    │
└───────────────────────┘
```

`str` 的每个字符是一个 Unicode 码点（可能占 1/2/4 字节，取决于 CPython 内部表示），`bytes` 的每个元素恰好 1 字节（0-255 的整数）。

验证：同一文本，`str` 和 `bytes` 消耗的内存不同：

```python
import sys

s = "你好"        # 2 个字符
b = s.encode('utf-8')  # 6 个字节

print(sys.getsizeof(s))   # ~75 字节（对象头 + 2 个字符的紧凑存储）
print(sys.getsizeof(b))   # ~63 字节（对象头 + 6 字节数据）
```

### 4.2 编码的本质：码点 → 字节序列

编码就是把 Unicode 码点（整数）映射为字节序列的规则。以 UTF-8 为例：

```text
UTF-8 编码规则：
┌────────────┬───────────────────┬───────────┐
│ 码点范围     │ UTF-8 字节模式      │ 字节数    │
├────────────┼───────────────────┼───────────┤
│ U+0000-007F│ 0xxxxxxx          │ 1 字节    │ ← ASCII 范围
│ U+0080-07FF│ 110xxxxx 10xxxxxx  │ 2 字节    │
│ U+0800-FFFF│ 1110xxxx 10xxxxxx  │ 3 字节    │ ← 中文多在此
│            │         10xxxxxx   │           │
│ U+10000+   │ 11110xxx 10xxxxxx  │ 4 字节    │ ← emoji 在此
│            │         10xxxxxx   │           │
│            │         10xxxxxx   │           │
└────────────┴───────────────────┴───────────┘
```

以中文 "你"（码点 U+4F60 = 20320）为例：

```text
20320 = 0100 1111 0110 0000 (二进制)
分配到 3 字节模板 1110xxxx 10xxxxxx 10xxxxxx：
  1110 0100   10 111101   10 100000
= 0xE4       0xBD        0xA0
→ bytes: b'\xe4\xbd\xa0'
```

```python
# 验证
print("你".encode('utf-8'))     # b'\xe4\xbd\xa0'
print(ord("你"))                # 20320（码点）
```

### 4.3 bytes 的不可变性

`bytes` 和 `str` 一样是不可变对象。任何"修改"操作（如 `+`、`replace()`、`upper()`）都返回一个**新对象**，原对象不变：

```python
b = b'hello'
b2 = b + b' world'
print(b is b2)               # False —— 不同对象
print(b)                     # b'hello' —— 原对象不变

# 不可变意味着可哈希
print(hash(b'hello'))        # 有值，可做 dict 键
d = {b'key': 'value'}       # 合法

# bytearray 不可哈希
# hash(bytearray(b'hello'))  # TypeError: unhashable type: 'bytearray'
```

不可变性的好处和 `tuple` 一样：线程安全（无需加锁）、可哈希（做 dict 键）、可安全共享（不用担心被修改）。

### 4.4 bytes 与 bytearray 的继承关系

```python
print(isinstance(b'hi', bytes))        # True
print(isinstance(bytearray(b'hi'), bytearray))  # True
print(isinstance(bytearray(b'hi'), bytes))      # False —— bytearray 不继承 bytes

# 但它们共享一些行为
from collections.abc import ByteString
print(isinstance(b'hi', ByteString))           # True
print(isinstance(bytearray(b'hi'), ByteString)) # True
```

`bytes` 和 `bytearray` 都注册为 `collections.abc.ByteString` 的虚拟子类。当你想接受这两种类型时，用 `ByteString` 做 isinstance 判断。

---

## 5. 总结

本文围绕 Python 的 `bytes` 类型展开，主要介绍了以下内容：

- **bytes 定义**：不可变字节序列，每个元素是 0~255 的整数，是 `str` 在二进制世界的对应物。
- **bytes 创建方式**：字面量 `b'...'`、十六进制转义 `\xHH`、`bytes()` 构造函数（整数列表/指定长度/从 str 编码）、`bytes.fromhex()`。
- **str 与 bytes 编码解码**：`str.encode()` 将字符编码为字节，`bytes.decode()` 将字节解码为字符；不同编码（UTF-8/GBK/ASCII）产生不同字节序列；`errors` 参数处理编解码错误（ignore/replace/backslashreplace）；`len(str)` 返回字符数，`len(bytes)` 返回字节数。
- **bytes 常用方法**：与 `str` 同名（upper/lower/split/join/replace/find/startswith 等参数和返回值都是 `bytes`）；bytes 特有方法（`fromhex`/`hex`/`decode`）；参数传 `str` 会报 TypeError。
- **bytes 索引与运算**：取元素返回 `int`（与 `str` 返回单字符 `str` 不同），切片返回 `bytes`；支持 `+`/`*`/`in`/比较运算；可迭代（迭代出 `int`）。
- **bytearray 可变字节序列**：`bytes` 的可变版本，支持 `append`/`extend`/`insert`/`pop`/`del`/索引赋值；不可哈希；频繁拼接用 bytearray 比反复 `bytes + bytes` 更高效。
- **二进制文件读写**：`'rb'`/`'wb'` 模式读写 `bytes`，`'r'`/`'w'` 模式读写 `str`（自动编解码）；大文件用分块读取；二进制文件不能用文本模式打开。
- **struct 二进制打包**：`pack`/`unpack` 在 Python 值与 `bytes` 间转换；格式字符（`I`/`f`/`d`/`s` 等）指定类型和大小；字节序（`<` 小端 / `>` 大端 / `!` 网络序）；`pack_into`/`unpack_from` 操作预分配缓冲区。
- **加密与哈希场景**：`hashlib`/`hmac` 接收 `bytes` 不接收 `str`；分块哈希用 `update()`；`base64` 把二进制编码为 ASCII 文本。
- **最佳实践**：str 和 bytes 不混用；编解码显式指定 encoding；处理外部数据用 errors 参数；频繁拼接用 bytearray；二进制文件用 rb/wb；展示给用户先 decode。
- **原理**：str 按 Unicode 码点存储，bytes 按单字节存储；UTF-8 编码将码点映射为 1~4 字节序列；bytes 不可变可实现哈希和线程安全；bytes 和 bytearray 都是 `ByteString` 虚拟子类。
