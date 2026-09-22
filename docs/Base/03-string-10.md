---
group:
  title: 【03】字符串介绍
  order: 3
order: 10
title: 字符串与字符编码
nav:
  title: Python基础
  order: 1
---

# 字符串与字符编码

## 1. 介绍

### 1.1 要理解什么

字符编码是计算机处理文本的基础——计算机只认识 0 和 1，而人类使用的是"中""A""😀"这样的字符。字符编码就是连接这两者的桥梁：它定义了每个字符对应哪些字节，以及如何在这些字节和字符之间来回转换。

Python 3 中，`str` 类型内部存储的是 Unicode 码点（人类可读的文本），而 `bytes` 类型存储的是原始字节序列（机器可读的二进制数据）。`encode()` 把 `str` 编码成 `bytes`，`decode()` 把 `bytes` 解码回 `str`。理解编码原理，你才能正确处理中文乱码、多语言文本、文件读写、网络传输中的字符问题。

### 1.2 为什么需要理解它

如果你只会写 `print("Hello")`，编码对你没有影响。但一旦涉及以下场景，不理解编码就会踩坑：

- **中文乱码**：读取文件出现 `ä½ å¥½` 这样的乱码，不知道怎么修复
- **网络传输**：HTTP 请求/响应的编码处理不当，导致数据损坏
- **跨平台兼容**：Windows 默认 GBK，Linux 默认 UTF-8，同一份文件在不同系统上表现不同
- **多语言支持**：处理日文、韩文、阿拉伯文、Emoji 等非 ASCII 字符时出错
- **文件读写**：`open()` 默认编码在不同操作系统上行为不一致，导致读取失败

这些问题的根源都是编码不一致——编码时用了 A 编码，解码时用了 B 编码，结果就对不上。理解编码原理后，你能快速定位"哪个环节用错了编码"，并给出修复方案。

## 2. 整体架构

### 2.1 从字符到字节的完整映射链

计算机处理文本的核心流程：

```text
人类字符  →  Unicode 码点  →  编码(encode)  →  字节序列  →  存储/传输
  '中'        U+4E2D          UTF-8          E4 B8 AD      磁盘/网络

计算机读取  →  字节序列  →  解码(decode)  →  Unicode 码点  →  Python str
  磁盘/网络    E4 B8 AD        UTF-8           U+4E2D          '中'
```

这条链路中有三个关键层：

| 层 | 内容 | 示例 |
|----|------|------|
| 字符层 | 人类可读的文本符号 | `'中'`、`'A'`、`'😀'` |
| 码点层 | Unicode 为每个字符分配的唯一编号 | `U+4E2D`、`U+0041`、`U+1F600` |
| 字节层 | 计算机存储的字节序列 | `E4 B8 AD`、`41`、`F0 9F 98 80` |

### 2.2 编码方案的发展历程

```text
ASCII (1963)
  ↓ 7 位, 128 个字符, 只覆盖英文
ISO 8859-1 / Latin-1 (1986)
  ↓ 8 位, 256 个字符, 覆盖西欧语言
GBK / Shift-JIS / Big5 (1990s)
  ↓ 各国自行扩展, 互不兼容
Unicode (1991)
  ↓ 统一码点空间, 覆盖全世界所有文字
  ↓
UTF-8 / UTF-16 / UTF-32
  ↓ Unicode 的不同编码实现方案
```

### 2.3 Python 3 中的 str 与 bytes

Python 3 明确区分了"文本"和"数据"两种概念，分别用 `str` 和 `bytes` 类型表示：

```text
str  =  Unicode 字符序列   →  人类文本   →  len() 返回字符数
bytes = 字节序列(0~255)    →  机器数据   →  len() 返回字节数

str → bytes :  encode('编码方式')   (编码)
bytes → str :  decode('编码方式')   (解码)
```

### 2.4 各组件职责

| 组件 | 职责 | Python 表示 |
|------|------|-------------|
| Unicode | 定义字符与码点的映射 | `ord('中')` → `20013` |
| UTF-8 | 码点到字节的编码方案 | `'中'.encode('utf-8')` → `b'\xe4\xb8\xad'` |
| UTF-16 | 码点到字节的编码方案（定宽+字节序） | `'中'.encode('utf-16')` → `b'\xff\xfe-D'` |
| `str` | Python 中的文本类型 | `'中文'` |
| `bytes` | Python 中的字节序列类型 | `b'\xe4\xb8\xad\xe6\x96\x87'` |
| `encode()` | str → bytes 的方法 | `'中'.encode('utf-8')` |
| `decode()` | bytes → str 的方法 | `b'\xe4\xb8\xad'.decode('utf-8')` |

## 3. 关键机制拆解

### 3.1 ASCII — 一切的起点

ASCII（American Standard Code for Information Interchange）是最早的字符编码标准，用 7 位二进制数表示 128 个字符，覆盖英文字母、数字和常用符号。

```python
# ord() 查看字符的码点（ASCII 范围内 0~127）
print(f"'A' 的码点: {ord('A')}")    # 65
print(f"'a' 的码点: {ord('a')}")    # 97
print(f"'0' 的码点: {ord('0')}")    # 48
print(f"' ' 的码点: {ord(' ')}")    # 32

# chr() 码点转字符
print(f"码点 65 → '{chr(65)}'")    # A
print(f"码点 97 → '{chr(97)}'")    # a
```

ASCII 的 128 个字符分为两类：

```text
控制字符 (0~31, 共 32 个): 不可打印的控制信号
  0   NUL  空字符
  9   TAB  制表符
  10  LF   换行符 \n
  13  CR   回车符 \r
  ...

可打印字符 (32~127, 共 96 个): 可显示的文本符号
  32       空格
  48~57    数字 0-9
  65~90    大写字母 A-Z
  97~122   小写字母 a-z
  其余      标点符号和运算符
```

用代码查看 ASCII 字符分类：

```python
# ASCII 字符分类
categories = {
    "控制字符 (0-31)": range(0, 32),
    "空格 (32)": range(32, 33),
    "数字 (48-57)": range(48, 58),
    "大写字母 (65-90)": range(65, 91),
    "小写字母 (97-122)": range(97, 123),
    "符号": range(33, 48),
}

for name, codes in categories.items():
    chars = "".join(chr(c) if 32 <= c < 127 else f"\\x{c:02x}" for c in codes)
    print(f"  {name}: [{chars}]")

# 输出:
#   控制字符 (0-31): [\x00\x01\x02\x03...]
#   空格 (32): [ ]
#   数字 (48-57): [0123456789]
#   大写字母 (65-90): [ABCDEFGHIJKLMNOPQRSTUVWXYZ]
#   小写字母 (97-122): [abcdefghijklmnopqrstuvwxyz]
#   符号: [!"#$%&'()*+,-./]
```

ASCII 的局限：128 个字符只能覆盖英文。中文、日文、韩文等非拉丁文字的字符远远超过 128 个，ASCII 无法表示它们。

```python
# 码点 128 以上不在 ASCII 范围内
print(f"码点 128 (非 ASCII): {chr(128)}")
print(f"码点 256: {chr(256)}")      # Ā (扩展拉丁字母)

# 中文的码点远超 ASCII 范围
print(f"'中' 的码点: {ord('中')}")   # 20013，远超 127
```

### 3.2 Unicode — 统一码点空间

Unicode 是解决 ASCII 局限性的方案。它为世界上所有文字系统、符号、Emoji 的每个字符都分配了一个唯一的码点，形成统一空间。

#### 3.2.1 码点空间

Unicode 的码点范围是 `U+0000` 到 `U+10FFFF`，共 1,114,112 个码点：

```text
Unicode 码点分区:

  基本多语言平面 BMP (U+0000 ~ U+FFFF)
    → 绝大多数常用字符（中、日、韩、拉丁、阿拉伯、西里尔等）
    → 65,536 个码点

  补充平面 (U+10000 ~ U+10FFFF)
    → Emoji、古文字、罕见汉字等
    → 1,048,576 个码点

  总计: 1,114,112 个码点
```

```python
print("Unicode 码点分区:")
print(f"  BMP (U+0000 ~ U+FFFF): {0x0000} ~ {0xFFFF}")
print(f"  补充平面 (U+10000 ~ U+10FFFF): {0x10000} ~ {0x10FFFF}")
print(f"  总码点数: {0x10FFFF + 1:,}")
# 总码点数: 1,114,112
```

#### 3.2.2 各语言字符的码点

```python
# 中文常用字
print("中文常用字码点:")
for ch in ["中", "文", "编", "码", "字", "符"]:
    print(f"  '{ch}' → U+{ord(ch):04X} (十进制 {ord(ch)})")
# '中' → U+4E2D (十进制 20013)
# '文' → U+6587 (十进制 25991)

# 日文平假名
print("\n日文平假名码点:")
for ch in "あいうえお":
    print(f"  '{ch}' → U+{ord(ch):04X}")
# 'あ' → U+3042

# Emoji (在补充平面，码点超过 U+FFFF)
print("\nEmoji 码点:")
for e in ["😀", "🐍", "❤", "✓", "①"]:
    print(f"  '{e}' → U+{ord(e):05X}")
# '😀' → U+1F600
# '🐍' → U+1F40D
```

#### 3.2.3 Python 3 中 str 的 Unicode 本质

Python 3 的 `str` 类型直接存储 Unicode 码点，每个 Unicode 字符都是 `str` 的一个独立元素：

```python
s = "Hello中文😀"
print(f"字符串: '{s}'")
print(f"长度: {len(s)}")  # 8 (每个 Unicode 字符算 1 个)
print("逐字符码点:")
for i, ch in enumerate(s):
    print(f"  [{i}] '{ch}' → U+{ord(ch):04X}")

# 输出:
#   [0] 'H' → U+0048
#   [1] 'e' → U+0065
#   ...
#   [5] '中' → U+4E2D
#   [6] '文' → U+6587
#   [7] '😀' → U+1F600
```

这与 Python 2 中 `str` 存字节、`unicode` 存码点的设计完全不同。Python 3 中 `str` 就是 Unicode 文本，不再需要区分"字节字符串"和"Unicode 字符串"。

#### 3.2.4 Unicode 转义表示

Python 支持三种 Unicode 转义写法：

```python
# \uXXXX: 4 位十六进制，适用于 BMP 范围 (U+0000 ~ U+FFFF)
print(f"'\\u4e2d\\u6587' = '\u4e2d\u6587'")  # 中文

# \UXXXXXXXX: 8 位十六进制，适用于完整 Unicode 范围 (含补充平面)
print(f"'\\U0001F600' = '\U0001F600'")  # 😀

# \N{name}: 通过 Unicode 字符名称引用
print(f"'\\N{{CJK UNIFIED IDEOGRAPH-4E2D}}' = '\N{CJK UNIFIED IDEOGRAPH-4E2D}'")  # 中
```

#### 3.2.5 Unicode 字符属性

Python 标准库 `unicodedata` 可以查询字符的 Unicode 属性：

```python
import unicodedata

test_chars = [("A", "大写字母"), ("中", "中文"), ("1", "数字"), (" ", "空格"), ("😀", "emoji")]
print("Unicode 属性检查:")
for ch, desc in test_chars:
    name = unicodedata.name(ch, "未知")
    category = unicodedata.category(ch)
    print(f"  '{ch}' ({desc}): 名称={name}, 类别={category}")

# 输出:
#   'A' (大写字母): 名称=LATIN CAPITAL LETTER A, 类别=Lu
#   '中' (中文): 名称=CJK UNIFIED IDEOGRAPH-4E2D, 类别=Lo
#   '1' (数字): 名称=DIGIT ONE, 类别=Nd
#   ' ' (空格): 名称=SPACE, 类别=Zs
#   '😀' (emoji): 名称=GRINNING FACE, 类别=So
```

类别编码的含义：`Lu` = 大写字母，`Lo` = 其他字母（如中文），`Nd` = 十进制数字，`Zs` = 空格分隔符，`So` = 其他符号（如 Emoji）。

### 3.3 UTF-8 — 最常用的编码方案

UTF-8 是 Unicode 的变长编码方案——不同的字符用不同数量的字节编码，从 1 到 4 字节不等。它是 Web 上最广泛使用的编码，也是 Python 3 的默认编码。

#### 3.3.1 UTF-8 的变长编码规则

```text
码点范围           字节数   字节格式
───────────────────────────────────────────────────────
U+0000 ~ U+007F    1 字节   0xxxxxxx
U+0080 ~ U+07FF    2 字节   110xxxxx 10xxxxxx
U+0800 ~ U+FFFF    3 字节   1110xxxx 10xxxxxx 10xxxxxx
U+10000 ~ U+10FFFF 4 字节   11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
```

关键规则：
- 第一个字节的最高位 `1` 的个数表示这个字符占几个字节
- 后续字节都以 `10` 开头（标记为"延续字节"）

用 Python 验证不同字符的 UTF-8 编码：

```python
print("UTF-8 编码字节数:")
# 1 字节: ASCII 字符
b = 'A'.encode('utf-8')
print(f"  'A' → {list(b)} (1 字节, 0x41)")

# 2 字节: 拉丁扩展字符
b = 'é'.encode('utf-8')
print(f"  'é' → {list(b)} (2 字节, 0xC3 0xA9)")

# 3 字节: 中文字符 (中文在 BMP 范围 U+0800 ~ U+FFFF)
b = '中'.encode('utf-8')
print(f"  '中' → {list(b)} (3 字节, 0xE4 0xB8 0xAD)")

# 4 字节: Emoji (在补充平面 U+10000 ~ U+10FFFF)
b = '😀'.encode('utf-8')
print(f"  '😀' → {list(b)} (4 字节, 0xF0 0x9F 0x98 0x80)")
```

#### 3.3.2 UTF-8 字节前缀验证

通过查看二进制形式，可以清楚地看到 UTF-8 的字节前缀规则：

```python
print("UTF-8 字节前缀验证:")
for ch in ["A", "中", "é", "😀"]:
    b = ch.encode('utf-8')
    byte_list = list(b)
    hex_str = " ".join(f"0x{byte:02X}" for byte in byte_list)
    binary_str = " ".join(f"{byte:08b}" for byte in byte_list)
    print(f"  '{ch}' (U+{ord(ch):04X}):")
    print(f"    十六进制: {hex_str}")
    print(f"    二进制:   {binary_str}")

# 输出:
#   'A' (U+0041):
#     十六进制: 0x41
#     二进制:   01000001          ← 0 开头 = 1 字节
#   '中' (U+4E2D):
#     十六进制: 0xE4 0xB8 0xAD
#     二进制:   11100100 10111000 10101101   ← 1110 开头 = 3 字节
#   '😀' (U+1F600):
#     十六进制: 0xF0 0x9F 0x98 0x80
#     二进制:   11110000 10011111 10011000 10000000   ← 11110 开头 = 4 字节
```

可以看到字节前缀的规律：`0` 开头是 1 字节，`110` 开头是 2 字节的第一字节，`1110` 开头是 3 字节的第一字节，`11110` 开头是 4 字节的第一字节。后续字节都以 `10` 开头。

#### 3.3.3 UTF-8 与 ASCII 的兼容性

UTF-8 的一个重要设计决策是向下兼容 ASCII——所有 128 个 ASCII 字符的 UTF-8 编码就是它本身（1 字节，值相同）：

```python
print("UTF-8 与 ASCII 兼容性:")
for code in range(128):
    char = chr(code)
    utf8_bytes = char.encode('utf-8')
    if len(utf8_bytes) == 1 and utf8_bytes[0] == code:
        pass  # 兼容
    else:
        print(f"  不兼容! code={code}")
        break
else:
    print("  所有 128 个 ASCII 字符的 UTF-8 编码与 ASCII 编码完全一致")
```

这意味着一份纯英文的 ASCII 文件同时就是一份合法的 UTF-8 文件——UTF-8 编码的英文文本和 ASCII 编码的英文文本在字节层面完全相同。这保证了 UTF-8 对遗留系统的向后兼容。

#### 3.3.4 UTF-8 与 UTF-16 编码效率对比

不同的编码方案对同一字符的字节消耗不同：

```python
print("UTF-8 vs UTF-16 编码字节数对比:")
samples = [
    ("A", "ASCII 字符"),
    ("中", "中文"),
    ("é", "拉丁扩展"),
    ("😀", "Emoji"),
    ("𠮷", "CJK 扩展B"),
]

for ch, desc in samples:
    utf8 = ch.encode('utf-8')
    utf16 = ch.encode('utf-16')
    utf16le = ch.encode('utf-16-le')
    print(f"  '{ch}' ({desc}, U+{ord(ch):04X}):")
    print(f"    UTF-8:    {len(utf8)} 字节 {list(utf8)}")
    print(f"    UTF-16:   {len(utf16)} 字节 {list(utf16)} (含BOM)")
    print(f"    UTF-16LE: {len(utf16le)} 字节 {list(utf16le)} (无BOM)")
```

**运行结果**：

```text
  'A' (ASCII 字符, U+0041):
    UTF-8:    1 字节 [65]
    UTF-16:   4 字节 [255, 254, 65, 0] (含BOM)
    UTF-16LE: 2 字节 [65, 0] (无BOM)
  '中' (中文, U+4E2D):
    UTF-8:    3 字节 [228, 184, 173]
    UTF-16:   4 字节 [255, 254, 45, 78] (含BOM)
    UTF-16LE: 2 字节 [45, 78] (无BOM)
  'é' (拉丁扩展, U+00E9):
    UTF-8:    2 字节 [195, 169]
    UTF-16:   4 字节 [255, 254, 233, 0] (含BOM)
    UTF-16LE: 2 字节 [233, 0] (无BOM)
  '😀' (Emoji, U+1F600):
    UTF-8:    4 字节 [240, 159, 152, 128]
    UTF-16:   6 字节 [255, 254, 61, 216, 0, 222] (含BOM)
    UTF-16LE: 4 字节 [61, 216, 0, 222] (无BOM)
```

**编码效率对比**：

| 字符类型 | UTF-8 | UTF-16 (无BOM) | 更优 |
|---------|-------|---------------|------|
| ASCII 字符 | 1 字节 | 2 字节 | UTF-8 |
| 拉丁扩展 | 2 字节 | 2 字节 | 持平 |
| 中日韩字符 | 3 字节 | 2 字节 | UTF-16 |
| Emoji | 4 字节 | 4 字节 | 持平 |

UTF-8 对英文最优，UTF-16 对中文略优。但 UTF-8 的 ASCII 兼容性和无字节序问题使其成为 Web 上的默认选择。

### 3.4 encode() / decode() — 编码与解码

`encode()` 和 `decode()` 是 Python 中 `str` 与 `bytes` 之间转换的桥梁。

#### 3.4.1 encode() 编码

`str.encode(encoding)` 将字符串按指定编码编码为 `bytes` 对象：

```python
# 编码: str → bytes
text = "Hello中文"
encoded = text.encode('utf-8')
print(f"编码: '{text}' → {encoded}")
print(f"类型: {type(encoded)}")      # <class 'bytes'>
print(f"字节列表: {list(encoded)}")   # [72, 101, 108, 108, 111, 228, 184, 173, 230, 150, 135]
```

`encode` 找不到编码方式时抛出 `LookupError`，编码失败（字符不在编码范围内）时抛出 `UnicodeEncodeError`：

```python
# ASCII 无法编码中文
try:
    "中文".encode('ascii')
except UnicodeEncodeError as e:
    print(f"编码失败: {e}")
# 'ascii' codec can't encode character '\u4e2d' in position 0: ordinal not in range(128)
```

#### 3.4.2 decode() 解码

`bytes.decode(encoding)` 将字节序列按指定编码解码为 `str`：

```python
# 解码: bytes → str
encoded = "Hello中文".encode('utf-8')
decoded = encoded.decode('utf-8')
print(f"解码: {encoded} → '{decoded}'")
print(f"类型: {type(decoded)}")      # <class 'str'>
print(f"往返一致: {text == decoded}") # True
```

`decode` 在字节序列不符合编码规则时抛出 `UnicodeDecodeError`——这是中文乱码的核心原因。

#### 3.4.3 常用编码方式对比

```python
print("常用编码方式对比:")
text = "A中"
encodings = ["utf-8", "utf-16", "gbk", "gb2312", "big5", "ascii"]
for enc in encodings:
    try:
        b = text.encode(enc)
        print(f"  {enc:>10}: {list(b)} ({len(b)} 字节)")
    except UnicodeEncodeError as e:
        print(f"  {enc:>10}: 编码失败 - {e}")

# 输出:
#       utf-8: [65, 228, 184, 173] (4 字节)
#      utf-16: [255, 254, 65, 0, 45, 78] (6 字节)
#         gbk: [65, 214, 208] (3 字节)
#      gb2312: [65, 214, 208] (3 字节)
#        big5: [65, 164, 164] (3 字节)
#       ascii: 编码失败 (无法编码 '中')
```

各编码的特点：

| 编码 | 字节序 | 中文编码 | 英文编码 | 支持范围 |
|------|--------|---------|---------|---------|
| UTF-8 | 无 | 3 字节 | 1 字节 | 全部 Unicode |
| UTF-16 | 有 (LE/BE) | 2 字节 | 2 字节 | 全部 Unicode |
| GBK | 无 | 2 字节 | 1 字节 | 中文 + ASCII |
| Big5 | 无 | 2 字节 | 1 字节 | 繁体中文 + ASCII |
| ASCII | 无 | 不支持 | 1 字节 | 仅 128 个 ASCII 字符 |

#### 3.4.4 errors 参数 — 编解码错误处理

`encode()` 和 `decode()` 都支持 `errors` 参数控制遇到错误时的行为：

**encode 的 errors 参数**：

```python
print("encode errors 参数:")

# strict (默认): 编码失败抛异常
try:
    "中文".encode('ascii')
except UnicodeEncodeError as e:
    print(f"  strict: 抛异常 - {e}")

# ignore: 跳过无法编码的字符
result = "中文".encode('ascii', errors='ignore')
print(f"  ignore: {result}")        # b''（空字节）

# replace: 用 ? 替代无法编码的字符
result = "中文".encode('ascii', errors='replace')
print(f"  replace: {result}")       # b'??'

# xmlcharrefreplace: 用 XML 实体 &#NNNN; 替代
result = "中文".encode('ascii', errors='xmlcharrefreplace')
print(f"  xmlcharrefreplace: {result}")  # b'&#20013;&#25991;'

# backslashreplace: 用 \uXXXX 转义替代
result = "中文".encode('ascii', errors='backslashreplace')
print(f"  backslashreplace: {result}")   # b'\\u4e2d\\u6587'
```

**decode 的 errors 参数**：

```python
print("decode errors 参数:")

# 制造一个包含非法字节的序列
bad_bytes = b'Hello\xc3(\xe6\x96\x87'  # \xc3 后面应该跟延续字节，但跟了 '('

# strict: 解码失败抛异常
try:
    bad_bytes.decode('utf-8')
except UnicodeDecodeError as e:
    print(f"  strict: 抛异常 - {e}")

# ignore: 跳过非法字节
result = bad_bytes.decode('utf-8', errors='ignore')
print(f"  ignore: '{result}'")      # 'Hello(文'

# replace: 用 替代非法字节
result = bad_bytes.decode('utf-8', errors='replace')
print(f"  replace: '{result}'")     # 'Hello(文'（用替换标记）

# backslashreplace: 用转义序列替代
result = bad_bytes.decode('utf-8', errors='backslashreplace')
print(f"  backslashreplace: '{result}'")  # 'Hello\xc3(文'
```

各 `errors` 参数的行为对比：

| errors 值 | encode 行为 | decode 行为 | 适用场景 |
|-----------|------------|------------|---------|
| `strict` | 抛异常 | 抛异常 | 默认，要求严格正确 |
| `ignore` | 跳过字符 | 跳过字节 | 容忍丢失少量数据 |
| `replace` | `?` 替代 | 替代 | 可视化展示损坏区域 |
| `xmlcharrefreplace` | XML 实体替代 | 不适用 | HTML/XML 生成 |
| `backslashreplace` | `\uXXXX` 转义 | `\xXX` 转义 | 调试和日志 |

#### 3.4.5 编码不一致导致乱码

乱码的根本原因：编码用的 A 编码，解码用的 B 编码，两者规则不一致，导致字节被错误解析。

```python
print("编码不一致导致乱码:")

# 场景1: GBK 编码 + UTF-8 解码 → 解码失败
text = "你好世界"
gbk_bytes = text.encode('gbk')
print(f"原文: '{text}'")
print(f"GBK 编码: {list(gbk_bytes)}")
try:
    wrong = gbk_bytes.decode('utf-8')
    print(f"UTF-8 解码: '{wrong}'")
except UnicodeDecodeError:
    print("UTF-8 解码: 解码失败")
# UTF-8 严格的字节规则不允许 GBK 的字节模式

# 正确解码
right = gbk_bytes.decode('gbk')
print(f"GBK 解码: '{right}'")  # 你好世界
```

三种最典型的乱码场景：

```python
# 场景2: UTF-8 编码 + GBK 解码 → 阉字
original = "你好"
utf8_encoded = original.encode('utf-8')
garbled = utf8_encoded.decode('gbk', errors='replace')
print(f"UTF-8编码 + GBK解码: '{garbled}'")
# '浣犲ソ' ← 6 个 UTF-8 字节被 GBK 解析为 3 个字符

# 场景3: UTF-8 编码 + Latin-1 解码 → 西欧乱码 (HTTP 常见问题)
garbled = utf8_encoded.decode('latin-1')
print(f"UTF-8编码 + Latin-1解码: '{garbled}'")
# 'ä½ å¥½' ← 每个字节被当作一个 Latin-1 字符
```

场景 3 的修复方法——先按错误编码回到字节，再按正确编码解码：

```python
# 修复: 把错误解码的字符串按错误编码重新变回字节，再正确解码
fixed = garbled.encode('latin-1').decode('utf-8')
print(f"修复: '{fixed}'")
# '你好' ← 恢复原文
```

#### 3.4.6 安全解码策略

当不知道字节的编码方式时，可以采用"逐个尝试"策略——UTF-8 最严格，先试它；失败试 GBK；再失败用 Latin-1 兜底：

```python
def safe_decode(raw_bytes):
    """安全解码: 逐个尝试常用编码"""
    for encoding in ['utf-8', 'gbk', 'latin-1']:
        try:
            return raw_bytes.decode(encoding), encoding
        except UnicodeDecodeError:
            continue
    # 最终兜底: Latin-1 不会失败
    return raw_bytes.decode('utf-8', errors='replace'), 'utf-8(replace)'

test_samples = [
    '你好'.encode('utf-8'),
    '你好'.encode('gbk'),
    b'Hello\xc3\xc3',  # 纯 Latin-1 字节
]

for b in test_samples:
    result, enc = safe_decode(b)
    print(f"  {list(b)} → '{result}' (用 {enc} 解码)")
# [228, 189, 160, 229, 165, 189] → '你好' (用 utf-8 解码)
# [196, 227, 186, 195]            → '你好' (用 gbk 解码)
# [72, 101, 108, 108, 111, 195, 195] → 'Hello妹' (用 gbk 解码)
```

UTF-8 是最严格的编码——它的字节前缀规则使得随机字节串恰好是合法 UTF-8 的概率很低。因此，如果 UTF-8 解码成功，几乎可以确定就是 UTF-8 编码。这是 UTF-8 的自同步特性。

### 3.5 bytes 与 str 的区别

Python 3 中 `str` 和 `bytes` 是两个完全不同的类型，不能直接混用。理解它们的区别是处理编码问题的基础。

#### 3.5.1 类型的本质差异

```python
s = "Hello中文"           # str: Unicode 字符序列
b = s.encode('utf-8')     # bytes: 字节序列

print(f"str: {s!r}")
print(f"  类型: {type(s)}")
print(f"  长度: {len(s)} (字符数)")
print(f"  每个元素是字符: {[c for c in s]}")

print(f"\nbytes: {b!r}")
print(f"  类型: {type(b)}")
print(f"  长度: {len(b)} (字节数)")
print(f"  每个元素是整数(0-255): {[x for x in b]}")

# 输出:
# str: 'Hello中文'
#   类型: <class 'str'>
#   长度: 7 (字符数)
#   每个元素是字符: ['H', 'e', 'l', 'l', 'o', '中', '文']
#
# bytes: b'Hello\xe4\xb8\xad\xe6\x96\x87'
#   类型: <class 'bytes'>
#   长度: 11 (字节数)
#   每个元素是整数(0-255): [72, 101, 108, 108, 111, 228, 184, 173, 230, 150, 135]
```

核心差异：

| 维度 | str | bytes |
|------|-----|-------|
| 内部表示 | Unicode 码点 | 原始字节 (0~255) |
| 元素类型 | 字符 (str) | 整数 (int) |
| `len()` | 字符数 | 字节数 |
| 字面量 | `'...'` / `"..."` | `b'...'` / `b"..."` |
| 可变性 | 不可变 | 不可变（`bytearray` 可变） |

#### 3.5.2 bytes 字面量

`bytes` 字面量用 `b'...'` 前缀表示，有三种创建方式：

```python
# 方式1: ASCII 字符直接写
b1 = b'Hello'
print(f"  b'Hello' = {b1}, 类型={type(b1)}")

# 方式2: 十六进制转义（用于非 ASCII 字节）
b2 = b'\xe4\xb8\xad'  # '中' 的 UTF-8 编码
print(f"  b'\\xe4\\xb8\\xad' = {b2}")

# 方式3: bytes() 构造（从整数列表创建）
b3 = bytes([0x48, 0x65, 0x6c, 0x6c, 0x6f])  # 'Hello'
print(f"  bytes([0x48,...]) = {b3}")

# 方式4: 从 str 编码创建
b4 = "中文".encode('utf-8')
print(f"  '中文'.encode('utf-8') = {b4}")
```

#### 3.5.3 bytearray — 可变的 bytes

`bytearray` 是 `bytes` 的可变版本，可以修改元素和追加字节：

```python
ba = bytearray(b'Hello')
print(f"  创建: {ba}")
print(f"  类型: {type(ba)}")  # bytearray

# 可修改单个字节
ba[0] = ord('h')     # 把 'H' 改成 'h'
print(f"  修改后: {ba}")     # bytearray(b'hello')

# 可追加字节
ba.append(ord('!'))
print(f"  追加后: {ba}")     # bytearray(b'hello!')

# bytes 不可变
b = b'Hello'
# b[0] = ord('h')  # TypeError: 'bytes' 对象不支持赋值
print("  bytes 不可变: b'Hello' 的 b[0] 不能赋值")
```

#### 3.5.4 索引与切片差异

```python
s = "Hello"
b = b'Hello'

print("索引差异:")
# str 索引返回字符
print(f"  s[0] = '{s[0]}' (str 返回字符)")

# bytes 索引返回整数
print(f"  b[0] = {b[0]} (bytes 返回整数)")

print("切片差异:")
# str 切片返回 str
print(f"  s[1:3] = '{s[1:3]}' (str 切片)")

# bytes 切片返回 bytes
print(f"  b[1:3] = {b[1:3]} (bytes 切片)")
```

这个差异在实际使用中非常重要——`bytes[0]` 返回的是整数（0~255），而不是字符。要获取字符需要用 `chr(b[0])` 或 `b[0:1].decode('ascii')`。

#### 3.5.5 拼接限制

`str` 和 `bytes` 不能直接拼接——必须先通过 `encode()` / `decode()` 统一类型：

```python
print("拼接限制:")

# bytes + bytes: 允许
result = b'Hello' + b' ' + b'World'
print(f"  bytes + bytes: {result}")  # b'Hello World'

# str + str: 允许
result = 'Hello' + ' ' + 'World'
print(f"  str + str: {result}")      # Hello World

# bytes + str: 不允许
# b'Hello' + 'World'  # TypeError
print("  bytes + str: TypeError (不兼容)")

# 如果需要拼接，先统一类型
fixed = b'Hello' + 'World'.encode('utf-8')
print(f"  统一后: {fixed}")  # b'HelloWorld'
```

#### 3.5.6 比较与查找

```python
print("比较与查找:")

# bytes 之间的比较
print(f"  b'Hello' == b'Hello': {b'Hello' == b'Hello'}")  # True
print(f"  b'Hello' > b'World': {b'Hello' > b'World'}")    # False

# in 检查: bytes 中查的是字节子序列
b = "Hello中文".encode('utf-8')

# str 中用字符查找
print(f"  '中' in 'Hello中文': {'中' in 'Hello中文'}")    # True

# bytes 中不能用 str 查找
# '中' in b  # TypeError: a bytes-like object is required

# 必须用字节序列查找
print(f"  '中'.encode() in bytes: {'中'.encode('utf-8') in b}")  # True
```

#### 3.5.7 文件读写模式

Python 文件读写有两种模式，分别对应 `str` 和 `bytes`：

```python
import io

print("文件读写模式:")

# 文本模式 (r/w): 返回/接收 str
print("  文本模式 (r/w):")
with io.StringIO() as f:
    f.write("Hello中文\n")
    f.seek(0)
    content = f.read()
    print(f"    读出: '{content.strip()}' (类型: {type(content).__name__})")
# 读出: 'Hello中文' (类型: str)

# 二进制模式 (rb/wb): 返回/接收 bytes
print("  二进制模式 (rb/wb):")
with io.BytesIO() as f:
    f.write("Hello中文".encode('utf-8'))
    f.seek(0)
    raw = f.read()
    print(f"    读出: {raw} (类型: {type(raw).__name__})")
    # 二进制模式需要手动 decode
    decoded = raw.decode('utf-8')
    print(f"    解码: '{decoded}'")
# 读出: b'Hello\xe4\xb8\xad\xe6\x96\x87' (类型: bytes)
# 解码: 'Hello中文'
```

实际使用 `open()` 时，文本模式会自动按系统默认编码（或指定编码）处理 decode/encode。但二进制模式不做任何编码处理，你完全自己控制。

### 3.6 BOM — 字节序标记

BOM（Byte Order Mark）是 Unicode 字符 `U+FEFF`，用在字节流的开头来标识编码方式和字节序。

#### 3.6.1 BOM 的几种形式

```python
print("BOM 的几种形式:")

# UTF-8 BOM: 3 字节 EF BB BF
print(f"  UTF-8 BOM:    {list(b'\xef\xbb\xbf')} → EF BB BF")

# UTF-16 LE BOM: 2 字节 FF FE (小端序)
print(f"  UTF-16 LE BOM: {list(b'\xff\xfe')} → FF FE")

# UTF-16 BE BOM: 2 字节 FE FF (大端序)
print(f"  UTF-16 BE BOM: {list(b'\xfe\xff')} → FE FF")
```

BOM 的核心作用是标识**字节序**——多字节编码（如 UTF-16）需要知道高位字节在前还是低位字节在前。

#### 3.6.2 UTF-16 的字节序问题

UTF-16 用 2 字节表示 BMP 字符，但"高位在前还是低位在前"在不同 CPU 架构上不同：

```python
print("UTF-16 字节序:")
text = "AB"

# UTF-16-LE: 小端序，低字节在前
le_bytes = text.encode('utf-16-le')
print(f"  UTF-16-LE: {list(le_bytes)} (A→41 00, B→42 00)")

# UTF-16-BE: 大端序，高字节在前
be_bytes = text.encode('utf-16-be')
print(f"  UTF-16-BE: {list(be_bytes)} (A→00 41, B→00 42)")

# 不指定字节序时，UTF-16 会自动加 BOM
u16_bytes = text.encode('utf-16')
print(f"  UTF-16 (含BOM): {list(u16_bytes)} (FF FE 是LE的BOM)")
```

Python 的 `utf-16` 默认使用小端序（LE），并在开头添加 BOM。接收方看到 `FF FE` 就知道这是小端序。UTF-8 没有字节序问题——它是按字节顺序处理的，所以 UTF-8 的 BOM 没有字节序标识的意义，仅用于标识"这是一份 UTF-8 文件"。

#### 3.6.3 UTF-8 的 BOM 处理

UTF-8 的 BOM 是 `EF BB BF`，不代表字节序，只是一个标记。有些编辑器（如 Windows Notepad）会在 UTF-8 文件开头自动加 BOM，可能导致读取时出现多余字符：

```python
print("UTF-8 BOM 检测与处理:")

# 制造一个带 BOM 的 UTF-8 字节序列
text_with_bom = "Hello中文"
bom_bytes = b'\xef\xbb\xbf'  # UTF-8 BOM
utf8_with_bom = bom_bytes + text_with_bom.encode('utf-8')

print(f"  带BOM的UTF-8字节: {list(utf8_with_bom[:6])}...")
print(f"  前三字节 = BOM? {utf8_with_bom[:3] == b'\\xef\\xbb\\xbf'}")

# 方法1: 手动去除 BOM 后解码
if utf8_with_bom[:3] == b'\xef\xbb\xbf':
    clean = utf8_with_bom[3:].decode('utf-8')
    print(f"  去除BOM解码: '{clean}'")  # 'Hello中文'
```

Python 提供了 `utf-8-sig` 编码——编码时自动加 BOM，解码时自动去 BOM，省去手动处理：

```python
print("\nutf-8-sig 自动处理 BOM:")

# encode: utf-8-sig 会在开头添加 BOM
encoded_sig = "Hello中文".encode('utf-8-sig')
print(f"  encode('utf-8-sig'): {list(encoded_sig[:6])}... (含BOM)")

# 对比普通 utf-8 (无BOM)
encoded_plain = "Hello中文".encode('utf-8')
print(f"  encode('utf-8'):    {list(encoded_plain[:6])}... (无BOM)")

# decode: utf-8-sig 自动去 BOM
print(f"  utf-8-sig 解码: '{encoded_sig.decode('utf-8-sig')}'")   # Hello中文

# 普通 utf-8 也能处理带 BOM 的数据（Python 自动跳过 BOM）
print(f"  utf-8 解码BOM版: '{encoded_sig.decode('utf-8')}'")      # Hello中文
```

#### 3.6.4 中文乱码场景分析

将三种最典型的中文乱码场景汇总：

```text
场景                       编码  解码    现象
──────────────────────────────────────────────────
GBK 编码 + UTF-8 解码       GBK   UTF-8  解码失败 (GBK 字节不符合 UTF-8 规则)
UTF-8 编码 + GBK 解码       UTF-8 GBK    乱码 '浣犲ソ' (6 字节解析为 3 个 GBK 字符)
UTF-8 编码 + Latin-1 解码   UTF-8 Latin-1 乱码 'ä½ å¥½' (每字节当一个 Latin-1 字符)
```

```python
# 场景1: GBK编码 + UTF-8解码 → 解码失败
original = "你好"
gbk_encoded = original.encode('gbk')
print(f"  场景1: GBK编码 + UTF-8解码")
print(f"    原文: '{original}'")
print(f"    GBK字节: {list(gbk_encoded)}")
try:
    garbled = gbk_encoded.decode('utf-8')
    print(f"    乱码: '{garbled}'")
except UnicodeDecodeError:
    print(f"    解码失败")

# 场景2: UTF-8编码 + GBK解码 → 阉字乱码
utf8_encoded = original.encode('utf-8')
print(f"  场景2: UTF-8编码 + GBK解码")
print(f"    原文: '{original}'")
print(f"    UTF-8字节: {list(utf8_encoded)}")
garbled = utf8_encoded.decode('gbk', errors='replace')
print(f"    乱码: '{garbled}'")

# 场景3: UTF-8编码 + Latin-1解码 → 西欧乱码
print(f"  场景3: UTF-8编码 + Latin-1解码 (HTTP常见问题)")
garbled = utf8_encoded.decode('latin-1')
print(f"    原文: '{original}'")
print(f"    乱码: '{garbled}'")
# 修复: 重新编码再正确解码
fixed = garbled.encode('latin-1').decode('utf-8')
print(f"    修复: '{fixed}'")
```

#### 3.6.5 综合编码检测与修复工具

结合 BOM 检测、逐个尝试和兜底策略，实现一个实用的编码检测工具：

```python
def detect_and_decode(raw_bytes):
    """检测编码并安全解码字节序列"""
    # 1. 检查 BOM
    if raw_bytes[:3] == b'\xef\xbb\xbf':
        return raw_bytes[3:].decode('utf-8'), 'UTF-8 (BOM)'
    if raw_bytes[:2] == b'\xff\xfe':
        return raw_bytes[2:].decode('utf-16-le'), 'UTF-16 LE'
    if raw_bytes[:2] == b'\xfe\xff':
        return raw_bytes[2:].decode('utf-16-be'), 'UTF-16 BE'

    # 2. 尝试 UTF-8 (最严格, 能成功基本就是 UTF-8)
    try:
        return raw_bytes.decode('utf-8'), 'UTF-8'
    except UnicodeDecodeError:
        pass

    # 3. 尝试 GBK
    try:
        return raw_bytes.decode('gbk'), 'GBK'
    except UnicodeDecodeError:
        pass

    # 4. 尝试 Big5
    try:
        return raw_bytes.decode('big5'), 'Big5'
    except UnicodeDecodeError:
        pass

    # 5. 退化: Latin-1 不会失败
    return raw_bytes.decode('latin-1'), 'Latin-1 (fallback)'
```

测试检测工具：

```python
test_data = [
    (b'\xef\xbb\xbf' + "Hello".encode('utf-8'), "UTF-8 with BOM"),
    ("你好".encode('utf-8'), "Pure UTF-8"),
    ("你好".encode('gbk'), "GBK"),
    ("你好".encode('big5'), "Big5"),
    (b'\xff\xfe' + "你好".encode('utf-16-le'), "UTF-16 LE with BOM"),
]

print("编码检测测试:")
for raw, expected in test_data:
    result, detected = detect_and_decode(raw)
    print(f"  期望:{expected:<20} → 检测:{detected:<20} → '{result}'")

# 输出:
#   期望:UTF-8 with BOM        → 检测:UTF-8 (BOM)           → 'Hello'
#   期望:Pure UTF-8            → 检测:UTF-8                 → '你好'
#   期望:GBK                   → 检测:GBK                   → '你好'
#   期望:Big5                  → 检测:Big5                  → '你好'
#   期望:UTF-16 LE with BOM   → 检测:UTF-16 LE            → '你好'
```

#### 3.6.6 安全读写中文文件

```python
import io

print("安全读写中文文件:")
content = "这是一段中文内容\n包含多行文本\n第三行"

# 写入: 始终使用 UTF-8
with io.StringIO() as f:
    f.write(content)
    f.seek(0)
    raw = f.read().encode('utf-8')
    print(f"  写入内容: '{content}'")
    print(f"  UTF-8字节: {list(raw[:20])}...")

# 读取: 自动检测编码
result, encoding = detect_and_decode(raw)
print(f"  读取结果: '{result}' (用 {encoding} 解码)")
```

#### 3.6.7 Python 源文件编码声明

Python 3 默认使用 UTF-8 编码源文件，不需要在文件顶部声明编码。但在某些特殊场景（如旧系统兼容）中需要显式声明：

```python
# 以下声明方式都是合法的:
#   # -*- coding: utf-8 -*-    (Emacs 风格)
#   # coding: utf-8           (简洁风格)
#   # coding=utf-8            (等号风格)

# Python 3 默认源文件编码: UTF-8
# 不需要显式声明编码
# 中文可以作为变量名 (不推荐)
```

Python 2 默认使用 ASCII 编码源文件，所以 Python 2 的 `.py` 文件中如果有中文，必须在顶部加 `# -*- coding: utf-8 -*-`。Python 3 改为默认 UTF-8，基本不需要再声明。

## 4. 设计决策与权衡

### 4.1 为什么 Python 3 用 str + bytes 而不是 Python 2 的 str + unicode

| 维度 | Python 2 (str + unicode) | Python 3 (str + bytes) |
|------|--------------------------|------------------------|
| 默认字符串类型 | `str`（字节串） | `str`（Unicode） |
| Unicode 类型 | `unicode`（独立类型） | `str`（就是 Unicode） |
| 字节串 | `str` | `bytes`（独立类型） |
| 自动转换 | `str` 与 `unicode` 自动转换 | `str` 与 `bytes` 严格隔离 |
| 隐式拼接 | `str + unicode` 会隐式 encode | 抛出 `TypeError` |

Python 2 的设计问题：`str` 本质是字节序列，但在很多 API 中被当作字符串使用。当字符串只有 ASCII 字符时一切正常；一旦出现非 ASCII 字符，自动隐式转换就会触发 `UnicodeDecodeError`。

Python 3 的改进：明确分离"文本"（`str`，Unicode）和"数据"（`bytes`，字节序列）。`str` 就是 Unicode 文本，`bytes` 就是原始字节，两者不能隐式转换，必须显式 `encode()` / `decode()`。这使得编码问题在开发阶段就暴露出来，而不是在生产环境随机出现。

### 4.2 为什么 UTF-8 是最佳默认选择

| 维度 | UTF-8 | UTF-16 | UTF-32 |
|------|-------|--------|--------|
| ASCII 兼容 | 完全兼容 | 不兼容 | 不兼容 |
| 英文存储 | 1 字节 | 2 字节 | 4 字节 |
| 中文存储 | 3 字节 | 2 字节 | 4 字节 |
| Emoji 存储 | 4 字节 | 4 字节 | 4 字节 |
| 字节序问题 | 无 | 有 (LE/BE) | 有 (LE/BE) |
| 自同步性 | 有 | 无 | 无 |
| Web 使用率 | ~98% | ~少量 | 几乎不用 |

UTF-8 的核心优势：

- **ASCII 兼容性**：纯英文的 ASCII 文件就是合法的 UTF-8 文件，保证了向后兼容
- **无字节序问题**：按字节顺序处理，不需要 BOM，跨平台无忧
- **自同步性**：从字节流的任意位置开始扫描，只要遇到非延续字节（不以 `10` 开头），就能找到下一个字符的起始位置。这使得 UTF-8 在截断、拼接、搜索时具有天然优势
- **节省空间**：对于以英文为主的文本，UTF-8 比 UTF-16 节省一半空间

UTF-16 对中文存储略优（2 字节 vs 3 字节），但多出的字节序复杂性和 ASCII 不兼容问题使得它在 Web 上的收益远不抵成本。

### 4.3 GBK 等区域编码的局限性

GBK、Big5、Shift-JIS 等区域编码各自定义了本语言的字符编码，但它们彼此不兼容：

| 问题 | 说明 |
|------|------|
| 互不兼容 | GBK 编码的文件在 Big5 环境下会乱码，反之亦然 |
| 覆盖范围有限 | GBK 只支持中文 + ASCII，不支持日文、韩文等 |
| 不支持 Emoji | GBK 编码空间没有 Emoji 的位置 |
| 自定义扩展混乱 | 各厂商对 GBK 有不同扩展（微软 GBK vs 标准 GBK） |
| 国际化困难 | 日文系统读取中文文件会乱码 |

Unicode 和 UTF-8 的出现解构了这些问题——统一码点空间 + 可变字节编码，一套编码覆盖全世界。现代系统应该一律使用 UTF-8，GBK 等区域编码仅用于兼容遗留数据。

### 4.4 errors 参数的设计权衡

`errors` 参数体现了 Python 的一个设计理念——**让开发者选择失败策略**，而不是强制一种方式：

| 策略 | 适合场景 | 代价 |
|------|---------|------|
| `strict`（默认） | 需要严格保证数据完整性的场景 | 遇到错误就终止 |
| `ignore` | 可以接受少量数据丢失 | 数据静默丢失，开发者可能不自知 |
| `replace` | 可视化展示（如日志显示） | 替换字符有歧义 |
| `xmlcharrefreplace` | 生成 HTML/XML | 增加文件体积 |
| `backslashreplace` | 调试和日志 | 转义序列不易阅读 |
| `surrogateescape` | 处理操作系统路径名 | 保持原始字节，可无损往返 |

默认 `strict` 的选择：编码错误通常是 bug 的信号（如文件编码不一致、网络数据处理不当），默认抛异常能让问题在开发阶段暴露。但在特定场景（如 OS 路径名解码）中，`strict` 会导致正常文件读取失败，此时 `surrogateescape` 可以无损处理未知字节。

### 4.5 UTF-8 自同步特性的价值

UTF-8 的字节前缀规则带来了一个关键特性——**自同步性**（self-synchronization）。从字节流的任意位置开始，遇到以 `0` 或 `11` 开头的字节就是一个字符的起始字节；遇到以 `10` 开头的字节就是延续字节。

```text
字节流: [E4 B8 AD] 41 [C3 A9] ...

从位置 0 开始:
  E4 (1110xxxx) → 3 字节字符的起始 → 读取 E4 B8 AD → '中'
  41 (0xxxxxxx) → 1 字节字符的起始 → 读取 41 → 'A'
  C3 (110xxxxx) → 2 字节字符的起始 → 读取 C3 A9 → 'é'

从位置 1 开始 (误入 '中' 的中间):
  B8 (10xxxxxx) → 续字节，跳过一个 → 下一个 10xxxxxx → 继续跳过
  AD (10xxxxxx) → 续字节，跳过
  41 (0xxxxxxx) → 1 字节字符起始 → 正确恢复同步
```

这个特性的实际价值：
- **随机访问**：从文件中间开始读取，几个字节内就能找到字符边界
- **截断安全**：截断字节流不会产生半个字符的乱码
- **错误隔离**：一个字节损坏只会影响当前字符，不会波及后续

UTF-16 没有这个特性——截断 2 字节序列可能产生半个字符，后续解析可能全部出错。

## 5. 总结

本文深入讲解了 Python 字符串与字符编码的底层原理，主要介绍了以下内容：

- **ASCII 编码**：7 位编码标准，128 个字符覆盖英文；通过 `ord()` 和 `chr()` 可以查看字符与码点的对应关系
- **Unicode 码点空间**：统一的世界字符集，码点范围 U+0000 ~ U+10FFFF，Python 3 的 `str` 直接存储 Unicode 码点，每个字符是 `str` 的独立元素
- **UTF-8 编码原理**：UTF-8 是变长编码方案（1~4 字节），向下兼容 ASCII，无字节序问题，有自同步特性；通过字节前缀规则（`0` / `110` / `1110` / `11110`）区分字符边界
- **encode() / decode()**：`encode()` 将 `str` 编码为 `bytes`，`decode()` 将 `bytes` 解码为 `str`；`errors` 参数控制编解码错误行为（`strict` / `ignore` / `replace` 等）
- **bytes 与 str 的区别**：`str` 是 Unicode 字符序列（`len()` 返回字符数），`bytes` 是字节序列（`len()` 返回字节数）；两者不能直接拼接，必须通过 `encode()` / `decode()` 转换
- **BOM 与字节序**：UTF-16 有字节序问题（LE/BE），需要 BOM 标识；UTF-8 无字节序问题；`utf-8-sig` 编码自动处理 BOM
- **中文乱码**：乱码的根源是编码不一致（编码用 A、解码用 B）；UTF-8 编码 + GBK 解码产生阉字乱码，UTF-8 编码 + Latin-1 解码产生西欧乱码；通过"逐个尝试"策略可以安全解码未知编码的数据
- **设计决策**：Python 3 明确分离 `str`（文本）和 `bytes`（数据），避免了 Python 2 的隐式转换问题；UTF-8 是最佳默认编码（ASCII 兼容、无字节序问题、自同步性）；GBK 等区域编码应仅用于兼容遗留数据
