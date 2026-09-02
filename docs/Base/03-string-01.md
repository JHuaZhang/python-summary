---
group:
  title: 【03】字符串深度剖析
  order: 3
order: 1
title: 字符串创建与驻留机制
nav:
  title: Python基础
  order: 1
---

# 字符串创建与驻留机制

## 1. 介绍

### 1.1 什么是字符串的创建与驻留

字符串（`str`）是 Python 中表示 Unicode 文本序列的内置类型，也是日常编码里使用频率最高的类型之一——日志、用户输入、配置、JSON、HTML、文件路径，几乎一切文本都是 `str`。本篇聚焦于字符串的两件底事：它是怎么被创建出来的（创建方式），以及创建后内存里如何存放与共享（驻留机制）。

先说创建。Python 提供了远比多数语言灵活的字符串创建方式：四种引号字面量、`str()` 构造、从字节解码、从重复生成、从可迭代拼接等。理解各创建方式的写法与适用场景，是写字符串代码的基础。

```python
# 字面量创建（四种引号）
s1 = 'hello'          # 单引号
s2 = "hello"          # 双引号
s3 = '''多行'''       # 三引号
s4 = r"C:\new"         # 原始字符串前缀
s5 = f"value={42}"    # f-string 前缀

# 构造/转换
s6 = str(42)          # str() 从数字构造
s7 = b"hi".decode()  # 字节解码
s8 = "-".join(["a", "b"])  # 拼接
```

再说驻留。你若写两次 `"hello"`，得到的是同一个字符串对象，还是两个独立对象？这看似无关紧要，却影响 `is` 比较、内存占用、性能。Python 为了省内存与加速比较，对一部分字符串做**驻留（interning）**——让值相同的字符串在全局只存一份、所有引用共享同一对象。`a = "hello"; b = "hello"; a is b` 常为 `True`，就是驻留的结果。

```python
a = "hello"
b = "hello"
print(a is b)    # True —— 驻留，同一对象（共享）

c = "hello world!"
d = "hello world!"
print(c is d)    # 看情况 —— 含空格的长串未必驻留，可能 False
```

驻留是 Python 的**实现优化**（CPython 行为，非语言保证），它让常用字符串共享单例，省内存、让 `is` 比较极速（O(1) 指针比）、加速 dict 的字符串键查找。但驻留有规则——哪些字符串自动驻留、哪些不驻留、如何手动驻留，理解这些才能正确使用 `is` 与避免内存陷阱。

### 1.2 字符串的不可变性与对象模型

理解创建与驻留，先建立字符串的**不可变性**与对象模型认知——这是驻留机制的前提。

**字符串是不可变（immutable）的**：一个 str 对象创建后，它承载的字符序列永不改变。任何"修改"字符串的操作（`.upper()`、`+` 拼接、`.replace()`）都返回一个**新的 str 对象**，原对象不变。

```python
s = "hello"
print(id(s))        # 地址 A
s2 = s.upper()      # upper 返回新串 "HELLO"，不改 s
print(s)            # hello —— 原串不变
print(id(s))        # 地址 A（同，没改）
print(s2)           # HELLO（新对象）
print(s[0])         # h
# s[0] = "H"        # TypeError！str 不支持项赋值（不可变）
```

`s[0] = "H"` 报 TypeError——str 不支持按索引修改项，这是不可变性的直接体现。要"改"字符串只能创建新串（`s = "H" + s[1:]`），不能就地改。这与 list（可变，`lst[0]=x` 合法）形成对比。

**不可变性带来可哈希**：str 不可变 → 值永不变 → 哈希值稳定 → **可哈希**，能做 dict 键/set 元素。这是 str 可作 dict 键（最常用键类型）的根基。

```python
d = {"name": "Alice"}   # str 键（可哈希）
s = {",", ".", "!"}     # str 元素
```

**对象模型**：字符串是对象，有 `id`（身份）、`type`（str）、`value`（字符序列）。多个变量可指向同一 str 对象（赋值共享引用）。驻留正是利用"值相同的不可变 str 可安全共享"——既然 str 不可变（不会被谁偷偷改），让多个引用共享同一对象就绝对安全（`is` 比较、内存共享都成立）。

```python
a = "hi"
b = a            # b 与 a 指向同一 str 对象
print(a is b)    # True（共享引用）
b = "hi"         # b 改指另一 "hi"（可能同一驻留对象）
```

不可变性 + 对象模型，是驻留机制的土壤：因 str 不可变，共享同值对象安全，驻留才有意义（可变对象如 list 不能驻留共享，否则改一个影响所有）。理解这套前提，后续创建与驻留的细节才有依托。

### 1.3 创建方式速览

讲清定位前，给出字符串创建的全貌速览：

```python
# 1. 字面量（四种引号 + 前缀）
'单引号'; "双引号"; '''三引号跨行'''; """三双引号"""
r"原始串"; f"插值{42}"; b"字节串(bytes)"; u"冗余unicode"

# 2. str() 构造（从其他类型）
str(42)          # '42'
str(3.14)        # '3.14'
str([1, 2])      # '[1, 2]'
str(None)        # 'None'

# 3. 从字节解码
b"hello".decode("utf-8")   # 'hello'

# 4. 从重复生成
"ab" * 3        # 'ababab'

# 5. 从可迭代拼接
"-".join(["a", "b", "c"])  # 'a-b-c'

# 6. 从码点创建
chr(65)         # 'A'
chr(0x4e2d)     # '中'
```

后续各节逐一展开这些创建方式，并讲清驻留机制。

---

## 2. 核心内容

### 2.1 字面量创建：四种引号

Python 字符串字面量有四种引号写法，它们产生的字符串在类型和值上完全等价，区别只在书写形式：

```python
s1 = 'hello'           # 单引号
s2 = "hello"           # 双引号
s3 = '''多行
字符串'''               # 三引号（可跨行）
s4 = """三双引号
也可以跨行"""            # 三双引号（同三单引号）

print(type(s1))        # <class 'str'> —— 四种引号类型相同
print(s1 == s2)        # True —— 单双引号值完全等价
```

**单引号与双引号完全等价**，选哪个取决于字符串内容含哪种引号——用对方引号包裹可避免转义：

```python
# 含单引号 → 用双引号包裹，避免转义
s1 = "It's a nice day"     # 无需转义，可读性好
# 含双引号 → 用单引号包裹
s2 = 'He said "hello"'     # 无需转义

# 如果字符串同时含单双引号，必须转义其中一种
s3 = "It's \"fine\", he said"   # 转义双引号
s4 = 'It\'s "fine", he said'    # 转义单引号
```

**PEP 8 建议**：同一项目内统一选一种（通常推荐双引号），仅在内容含该引号时切换。但 Python 社区对此没有强制标准，团队可自定。

**三引号（`'''` 或 `"""`）**用于跨多行文本，换行符自动保留在字符串中：

```python
# 三引号：多行文本，换行保留
poem = """静夜思
床前明月光
疑是地上霜"""
print(poem)
# 输出：
# 静夜思
# 床前明月光
# 疑是地上霜

# 三引号也常用于 docstring（函数/类/模块文档）
def add(a, b):
    """返回两个数的和。

    参数：
        a: 第一个数
        b: 第二个数
    """
    return a + b
```

三引号内的换行、缩进都是字符串内容的一部分，写 docstring 时要注意缩进会被包含。PEP 257 对 docstring 缩进有规范（去除公共缩进），但那是对 docstring 提取的处理，字符串本身仍含原始缩进。

### 2.2 字面量前缀：r/f/b/u

字符串字面量可加前缀，改变其行为。四种前缀：

| 前缀 | 含义 | 示例 | 输出 |
|------|------|------|------|
| `r` | 原始字符串，反斜杠不转义 | `r"C:\new"` | `C:\new` |
| `f` | f-string，插值表达式 | `f"值={42}"` | `值=42` |
| `b` | 字节串（bytes），非 str | `b"hi"` | `b'hi'` |
| `u` | Unicode 前缀（冗余） | `u"hi"` | `hi` |

```python
# r 前缀：反斜杠不转义
print(r"C:\new\folder")     # C:\new\folder —— 原样输出
print("C:\new\folder")      # C:
                              # ewolder —— \n \f 被当转义！

# f 前缀：插值表达式（Python 3.6+）
name = "Alice"
print(f"Hello, {name}!")    # Hello, Alice!
print(f"{1 + 2}")           # 3 —— 可放表达式

# b 前缀：字节串（bytes 类型，不是 str）
data = b"hello"
print(type(data))           # <class 'bytes'> —— 不是 str
print(data)                 # b'hello'

# u 前缀：Unicode 前缀（Python 3 冗余，Python 2 遗留）
s = u"hello"
print(type(s))              # <class 'str'> —— Python 3 中 u'' 和 '' 完全等价
```

**前缀可组合**：`rb`/`br`（原始字节串）、`rf`/`fr`（原始 f-string），但不支持 `fb`/`bf`：

```python
# rb：原始字节串（反斜杠不转义 + bytes 类型）
data = rb"C:\new\x00"
print(data)    # b'C:\\new\\x00' —— 反斜杠不转义

# rf：原始 f-string（反斜杠不转义 + 插值）
name = "test"
s = rf"C:\{name}\folder"
print(s)      # C:\test\folder
# 注意：rf 中 {} 仍然插值，但 \ 不转义
```

`u` 前缀在 Python 3 中完全冗余——Python 3 所有字符串默认就是 Unicode，`u"hello"` 和 `"hello"` 完全相同。它存在的唯一原因是兼容从 Python 2 迁移过来的代码。

### 2.3 str() 构造函数

`str()` 是从其他类型创建字符串的通用方法。它接受任意类型的参数，返回该类型的"字符串表示"：

```python
# 数字 → 字符串
print(str(42))          # '42'
print(str(3.14))        # '3.14'
print(str(-5))          # '-5'

# 布尔值 → 字符串
print(str(True))        # 'True' —— 注意不是 '1'！
print(str(False))       # 'False' —— 注意不是 '0'！

# None → 字符串
print(str(None))        # 'None'

# 容器 → 字符串（repr 形式）
print(str([1, 2, 3]))   # '[1, 2, 3]'
print(str({"a": 1}))    # "{'a': 1}"
print(str((1, 2)))      # '(1, 2)'
```

`str(True)` 返回 `'True'` 而非 `'1'`——这是常见困惑点。`bool` 虽是 `int` 子类，但 `str()` 对布尔值返回其字面名称。若要数值形式，先 `int(True)` 再 `str`：

```python
print(str(True))          # 'True'（字面名称）
print(str(int(True)))    # '1'（先转 int 再转 str）
print(str(float(True)))  # '1.0'
```

**str() 不带参数返回空字符串**：

```python
s = str()
print(s)            # ''（空字符串）
print(len(s))       # 0
print(type(s))      # <class 'str'>
```

### 2.4 str() vs repr()

`str()` 和 `repr()` 都将对象转为字符串，但用途不同：`str()` 面向用户（友好显示），`repr()` 面向开发者（代码表示，可 eval 还原）。

```python
# 字符串：str 去引号，repr 带引号
s = "hello"
print(str(s))     # hello（用户看到的文本）
print(repr(s))    # 'hello'（代码表示，带引号）

# 字符串含转义：repr 显示转义，str 显示效果
s = "line1\nline2"
print(str(s))     # line1（换行）
                  # line2
print(repr(s))    # 'line1\nline2'（\n 可见）

# 浮点数：str 简洁，repr 精确
x = 3.141592653589793
print(str(x))     # 3.141592653589793
print(repr(x))    # 3.141592653589793（对 float 通常相同）
```

对字符串来说，`repr()` 返回带引号的代码表示，让 `"hello"` 与 `hello` 可区分——调试时用 `repr` 不会混淆 `'42'`（字符串）与 `42`（数字）：

```python
# 调试场景：repr 可区分类型
print(repr(42))     # 42（无引号 → int）
print(repr("42"))   # '42'（有引号 → str）

# print 默认用 str，%r 用 repr
data = "hello"
print("data: %s" % data)    # data: hello（str）
print("data: %r" % data)   # data: 'hello'（repr）
```

**`print()` 默认调用 `str()`，交互式解释器默认调用 `repr()`**。调试日志用 `repr`（信息全、能区分类型），显示给用户用 `str`（友好无引号）。

### 2.5 从字节解码创建

`bytes` 类型（`b""` 字面量或 `bytes()` 构造）是字节序列，不是字符串。从字节创建字符串需要"解码"——告诉 Python 用什么编码把字节解释为字符：

```python
# bytes → str：decode 方法
raw = b"hello"            # ASCII 字节序列
s = raw.decode("utf-8")   # 用 UTF-8 解码
print(s)                  # hello
print(type(s))            # <class 'str'>

# 中文：UTF-8 编码的 bytes → str
raw_cn = b"\xe4\xb8\xad\xe6\x96\x87"  # "中文" 的 UTF-8 字节
s_cn = raw_cn.decode("utf-8")
print(s_cn)               # 中文

# 等价：str(bytes, encoding) 也能解码
s2 = str(b"hello", "utf-8")
print(s2)                 # hello
```

解码时编码不匹配会报 `UnicodeDecodeError`——这是中文乱码的根源。编码解码的内容在字符编码专题中详述。

### 2.6 从重复生成：* 运算符

字符串支持 `*` 运算符，将字符串重复 n 次，生成新字符串：

```python
# 基本重复
print("ab" * 3)       # ababab
print("-" * 20)       # --------------------（分隔线）
print("=" * 30)       # ==============================

# 重复 0 次得空字符串
print("x" * 0)        # ''（空字符串）

# 负数当 0 处理
print("x" * -1)       # ''（负数等价于 0）

# 实用场景：生成分隔线、缩进、填充
separator = "-" * 40
print(separator)
# 输出：----------------------------------------

# 生成缩进
indent = " " * 4
print(f"{indent}indented code")

# 生成重复模式
pattern = "ABC" * 2
print(pattern)        # ABCABC
```

`*` 重复生成的是**新字符串**（str 不可变，无法就地修改原串）。重复次数很大时注意内存占用。

### 2.7 从拼接创建：+ 与 join

`+` 运算符拼接字符串，生成新字符串：

```python
# + 拼接
s1 = "Hello" + ", " + "World"
print(s1)             # Hello, World

# += 追加拼接
s = "start"
s += "_middle"
s += "_end"
print(s)              # start_middle_end
```

`+` 每次拼接都创建新字符串（str 不可变），大量拼接时性能差（O(n²)）。批量拼接用 `str.join()` 更高效：

```python
# join：用分隔符拼接可迭代对象
parts = ["Hello", "World", "Python"]
result = " ".join(parts)     # 空格做分隔符
print(result)                # Hello World Python

result2 = "-".join(parts)   # 横线做分隔符
print(result2)               # Hello-World-Python

result3 = "".join(parts)    # 无分隔符
print(result3)               # HelloWorldPython

# join 也可拼接字符序列
print("-".join("abc"))       # a-b-c
```

`join` 的性能优势在于它预先计算总长度，一次性分配内存，而 `+` 每次都复制拼接双方。拼接性能的深入对比在字符串拼接性能专题中详述。

### 2.8 chr() 从码点创建字符

`chr(n)` 将 Unicode 码点（整数）转为对应字符，是字符串创建的底层方式之一：

```python
# ASCII 码点 → 字符
print(chr(65))        # A
print(chr(97))        # a
print(chr(48))        # 0

# 中文码点 → 字符
print(chr(0x4e2d))    # 中（十六进制码点）
print(chr(20013))     # 中（十进制，同上）
print(chr(0x6587))    # 文

# Emoji（辅助平面，码点 > 65535）
print(chr(0x1F600))   # 😀
print(chr(128512))    # 😀（十进制）

# chr 的逆操作：ord()，字符 → 码点
print(ord('A'))       # 65
print(ord('中'))      # 20013
print(ord('😀'))      # 128512
```

`chr` 与 `ord` 互为逆操作。在字符与码点间转换，用于加密、字符编码处理、Unicode 分析等场景。

### 2.9 隐式拼接（相邻字面量自动合并）

Python 有一个鲜为人知的特性：相邻字符串字面量（中间只有空白/换行）会自动合并为一个字符串，**零运行时开销**：

```python
# 隐式拼接：相邻字面量自动合并
s = "hello" " " "world"
print(s)             # hello world

# 等价于
s2 = "hello world"
print(s == s2)        # True

# 常用于长字符串换行书写（无需 + 号）
url = ("https://api.example.com"
       "/v1/users"
       "/list")
print(url)            # https://api.example.com/v1/users/list

# 多行字符串也可隐式拼接
config = (
    "host=localhost\n"
    "port=5432\n"
    "dbname=mydb\n"
)
print(config)
# 输出：
# host=localhost
# port=5432
# dbname=mydb
```

隐式拼接在**解析期**完成（编译器直接把相邻字面量合并为一个），运行时只有一个 `LOAD_CONST`，无拼接操作。这与 `"a" + "b"` 不同——`+` 是运行时运算，有拼接开销。

**注意**：隐式拼接只对**字面量**有效，变量不行：

```python
a = "hello"
b = "world"
# s = a b          # SyntaxError！变量不能隐式拼接
s = a + " " + b    # 必须用 + 拼接
```

### 2.10 驻留机制：自动驻留规则

驻留（interning）是 CPython 的优化：值相同的字符串共享同一对象，省内存、加速比较。但并非所有字符串都自动驻留——驻留有规则。

**规则一：标识符-like 字面量自动驻留**。由字母、数字、下划线组成的字符串字面量（符合标识符命名规则），编译期自动驻留：

```python
a = "hello"
b = "hello"
print(a is b)    # True —— 标识符-like，自动驻留

a2 = "my_var_42"
b2 = "my_var_42"
print(a2 is b2)  # True —— 含字母/数字/下划线，自动驻留
```

**规则二：含空格、特殊字符的长串不保证驻留**。含空格、特殊符号的长字符串，驻留行为依赖上下文（编译单元、REPL 环境），不保证：

```python
# 含空格的字符串不保证驻留
a = "hello world"
b = "hello world"
print(a is b)    # 模块级代码常为 True（编译器优化），REPL 中可能 False

# 含特殊字符的字符串不保证驻留
c = "a!b@c#"
d = "a!b@c#"
print(c is d)    # 不保证 True
```

**规则三：运行时构造的字符串不驻留**。通过 `+`、`join`、`str()`、`format`、f-string 等运行时创建的字符串，默认不驻留：

```python
# 运行时拼接不驻留
a = "hel" + "lo"
b = "hello"
print(a is b)    # 不保证 True（a 是运行时构造的）

# str() 构造不驻留
c = str(42)
d = "42"
print(c is d)    # 不保证 True

# f-string 构造不驻留
x = "world"
e = f"hello {x}"
f2 = "hello world"
print(e is f2)   # 不保证 True
```

**规则四：空字符串和单字符字符串始终驻留**。`''` 和单个字符的字符串在 CPython 中始终驻留：

```python
a = ''
b = ''
print(a is b)    # True

c = 'x'
d = 'x'
print(c is d)    # True
```

**驻留规则汇总**：

| 情况 | 是否自动驻留 | 示例 |
|------|-------------|------|
| 标识符-like 字面量 | 是（编译期） | `"hello"`、`"my_var_42"` |
| 空字符串 / 单字符 | 是 | `''`、`'x'` |
| 含空格 / 特殊字符的长串 | 不保证 | `"hello world"`、`"a!b"` |
| 运行时构造 | 不保证 | `"hel"+"lo"`、`str(42)`、`f"{x}"` |

理解这些规则，就能解释 `is` 对字符串时 True/False 不稳定的现象——它取决于字符串是否被驻留，而驻留取决于字面量形式与编译上下文。

### 2.11 手动驻留：sys.intern

`sys.intern(s)` 强制将字符串驻留——无论它是字面量还是运行时构造的，无论是否含空格，驻留后同值字符串共享同一对象：

```python
import sys

# 运行时构造的字符串，默认不驻留
a = "hel" + "lo world"
b = "hello world"
print(a is b)    # 不保证 True

# 手动驻留后，同值共享
a = sys.intern("hel" + "lo world")
b = sys.intern("hello world")
print(a is b)    # True —— 驻留后同对象

# 含空格的长串也能驻留
c = sys.intern("a very long string with spaces")
d = sys.intern("a very long string with spaces")
print(c is d)    # True
```

**适用场景一：大量重复字符串省内存**。当程序要处理大量重复的字符串（如读取词典、配置、日志中的重复标签），用 `sys.intern` 让它们共享同一对象，大幅省内存：

```python
import sys

# 从文件读取大量重复标签
tags = ["error", "warning", "info", "error", "warning", "info", ...]
# 不驻留：每个 "error" 是独立对象，N 个 "error" 占 N 份内存
# 驻留：N 个 "error" 共享 1 个对象
tags_interned = [sys.intern(tag) for tag in tags]
# 如果有 100000 个标签但只有 3 种值，驻留后内存从 ~5MB 降到 ~0.8KB
```

**适用场景二：海量比较加速**。驻留后的字符串 `is` 比较是 O(1) 指针比，比 `==`（O(n) 逐字符比）快。海量字符串匹配场景（NLP 词匹配、大量键查找），驻留 + `is` 可加速：

```python
import sys

# NLP 场景：大量词匹配
word_list = [sys.intern(w) for w in large_word_list]
target = sys.intern("apple")

# 匹配：用 is（O(1)）比 ==（O(n)）快
for word in word_list:
    if word is target:      # 驻留后 is 快
        found = True
        break
```

**注意事项**：

- `sys.intern` 驻留的字符串**不会被 GC 回收**（驻留池持有引用），驻留后常驻内存直到解释器退出。因此**只驻留长期使用的重复字符串**，不驻留一次性字符串（否则内存泄漏）。
- `is` 比较要求**双方都驻留**才行。如果一方是运行时构造未驻留的，`is` 仍可能 False：

```python
import sys
a = sys.intern("hello world")
b = "hello world"       # 可能未驻留（看上下文）
print(a is b)            # 不保证 True（b 未驻留）

# 需双方都 intern
c = sys.intern("hello world")
d = sys.intern("hello world")
print(c is d)            # True（双方驻留）
```

### 2.12 综合示例：创建方式与驻留现象

通过一个综合片段，把创建方式与驻留现象串起来：

```python
import sys

# 1. 各种创建方式
s1 = "hello"                      # 字面量
s2 = str(42)                      # 构造
s3 = b"world".decode()            # 解码
s4 = "-" * 5                      # 重复
s5 = ", ".join(["a", "b"])        # 拼接
s6 = chr(65) + chr(66) + chr(67)  # 码点
s7 = "hello" " " "world"          # 隐式拼接

print(s1, s2, s3, s4, s5, s6, s7)
# 输出：hello 42 world ----- a, b ABC hello world

# 2. 驻留现象观察
a = "hello"           # 标识符-like，驻留
b = "hello"            # 同上
print(f"'hello' is 'hello': {a is b}")   # True

c = "hello world"     # 含空格，不保证
d = "hello world"      # 同上
print(f"'hello world' is 'hello world': {c is d}")  # 看环境

# 3. sys.intern 强制驻留
e = sys.intern("hello world")
f = sys.intern("hello world")
print(f"intern 后 is: {e is f}")   # True

# 4. 不可变性验证
s = "hello"
print(id(s))
s += "!"           # 创建新对象
print(id(s))        # 不同（新对象）
```

---

## 3. 最佳实践

### 3.1 值相等永远用 ==，不用 is

```python
# 推荐
if a == b:
    ...

# 不推荐
if a is b:       # 驻留可能让 is 为 True，但不保证
    ...
```

**原因**：驻留是 CPython 实现优化，非语言保证。`is` 对短字面量常为 True 是缓存假象，对长串/运行时构造串不保证。`==` 比较值，所有情况都可靠。

### 3.2 单双引号按内容选择，项目内统一

```python
# 推荐：含单引号用双引号包裹
s1 = "It's ok"
# 推荐：含双引号用单引号包裹
s2 = 'He said "hi"'
# 不推荐：不必要的转义
s3 = "He said \"hi\""    # 能用单引号包裹就不用转义
```

PEP 8 建议项目内统一一种引号风格（通常双引号），仅在内容含该引号时切换。

### 3.3 多行文本用三引号，不用 \n 拼接

```python
# 推荐：三引号
text = """
line1
line2
line3
"""

# 不推荐：用 \n 拼接
text = "line1\nline2\nline3"    # 可读性差
```

三引号保留换行格式，可读性远好于 `\n` 拼接。注意三引号开头的换行会包含在字符串中，不等价。

### 3.4 反斜杠多的场景用 r 前缀

```python
# 推荐：原始字符串
path = r"C:\Users\admin\new\test"
regex = r"\d+\.\d+"

# 不推荐：大量转义
path = "C:\\Users\\admin\\new\\test"    # 需双写每个反斜杠
regex = "\\d+\\.\\d+"                    # 几乎不可读
```

正则表达式、Windows 路径等含大量反斜杠的场景，`r` 前缀让代码可读性大幅提升。

### 3.5 批量拼接用 join，不用循环 +

```python
# 推荐：join 一次性拼接
parts = ["a", "b", "c", "d"]
result = "".join(parts)

# 不推荐：循环 + 拼接（O(n²)）
result = ""
for p in parts:
    result += p          # 每次创建新字符串，性能差
```

`join` 预计算总长度一次性分配，`+` 每次复制。数据量大时性能差距可达百倍。

### 3.6 sys.intern 仅用于瓶颈场景

```python
import sys
# 合理用法：大量重复字符串省内存
tags = [sys.intern(t) for t in huge_tag_list]

# 不合理用法：一次性字符串驻留（内存泄漏）
def process(data):
    s = sys.intern(data)    # data 用完即弃，驻留后反而不释放
    ...
```

`sys.intern` 的字符串常驻内存不释放。只驻留"长期使用、大量重复"的字符串，不驻留一次性字符串。

### 3.7 str() 注意 True/None/容器的表示

```python
# 易错：str(True) 是 'True' 不是 '1'
print(str(True))     # 'True'
print(str(int(True)))  # '1' —— 需先转 int

# str(None) 是 'None' 不是 ''
print(str(None))     # 'None'

# str([1, 2]) 是 '[1, 2]' 不是 '1 2'
print(str([1, 2]))   # '[1, 2]'
```

从 `bool`/`None`/容器类型转字符串时，注意 `str()` 的返回值不是"内容文本"，而是"表示形式"。

### 3.8 调试用 repr，显示给用户用 str

```python
# 调试/日志用 repr（信息全，可区分类型）
data = "42"
print(f"data: {data!r}")     # data: '42'（带引号，知是 str）
print(f"data: {data}")      # data: 42（无引号，分不清是 str 还是 int）

# 显示给用户用 str
message = "Hello, World!"
print(message)              # Hello, World!（友好，无引号）
```

`!r` 在 f-string 中调用 `repr`，调试时用它能看到类型边界。`print` 默认用 `str`，面向用户。

### 3.9 大量修改用 list 缓冲或 io.StringIO

```python
# 不推荐：大量字符串"修改"（每次新建，O(n²)）
# s = ""
# for chunk in chunks:
#     s = s + chunk

# 推荐：用 list 收集再 join
parts = []
for chunk in chunks:
    parts.append(chunk)
result = "".join(parts)

# 推荐：或用 io.StringIO 流式累积
from io import StringIO
buf = StringIO()
for chunk in chunks:
    buf.write(chunk)
result = buf.getvalue()
```

字符串不可变，大量追加/修改别反复 `+`。用 list 收集后 `join`，或 `io.StringIO` 流式累积。

### 3.10 驻留作常识理解，不依赖

```python
# 知道有驻留（理解 is 现象），但代码不依赖
"a" is "a"          # True（驻留，但不写这种判等）
# 长串/运行时构造不保证，故 == 才可靠
if word == target:  # 用 ==，不依赖驻留
    ...
```

了解驻留（知道为何短字面量 `is` 常 True、长串不保证），但代码**不依赖驻留**做判等。`==` 是通用可靠方式，驻留只作"理解现象、高级优化"的知识储备。

---

## 4. 原理

本章讲清字符串创建与驻留的底层机制：字符串的内部表示（紧凑 Unicode）、字面量编译期处理与隐式拼接、驻留池的实现、驻留规则的字节码根源、驻留为何省内存加速比较、`sys.intern` 的实现与生命周期、驻留与小整数缓存的对比。

### 4.1 字符串的内部表示：紧凑 Unicode

Python 3 的 str 是 Unicode 字符序列，内部用"紧凑表示"——根据字符串里最大字符的码点，选最省的字节宽度存储：

```python
import sys

# 不同内容字符串内部字节宽度不同
print(sys.getsizeof("a"))          # ~50（ASCII，1字节/字符 + 对象头）
print(sys.getsizeof("中文"))        # ~76（UCS-2，2字节/字符）
print(sys.getsizeof("😀"))         # ~76（UCS-4，4字节/字符）
```

CPython 的 str 对象按内容自动选 1/2/4 字节宽度——这让 ASCII 字符串省内存（1 字节），只在需要时升级到 2/4 字节。这是 Python 3.3+ 的 PEP 393"灵活字符串表示"。

三种字节宽度：

- **1 字节（latin1）**：全 ASCII（码点 ≤ 255），每字符 1 字节
- **2 字节（UCS-2）**：含 BMP 字符（码点 ≤ 65535，如中文），每字符 2 字节
- **4 字节（UCS-4）**：含辅助平面字符（码点 > 65535，如 emoji），每字符 4 字节

```text
str 对象内存结构：

┌─────────────────────────────────────────┐
│ 对象头                                    │
│   ob_refcnt (引用计数)                    │
│   ob_type   (指向 str 类)                 │
├─────────────────────────────────────────┤
│ hash (缓存的哈希值，懒计算)                │
│ length (字符数)                           │
│ char_width (1/2/4 字节标志)               │
├─────────────────────────────────────────┤
│ char_data[] (紧凑字符数组)                │
│   [c0][c1][c2]...                        │
└─────────────────────────────────────────┘
```

**哈希缓存**：str 对象缓存哈希值——首次 `hash(s)` 计算后存入对象，后续直接返回缓存（O(1)）。这让 str 作 dict 键时哈希计算几乎零成本，是 dict str 键高效的原因之一。

### 4.2 字面量的编译期处理与隐式拼接

字符串字面量在 Python **编译期**就被处理，这产生两个重要优化：驻留决策和隐式拼接。

**编译期驻留决策**：源码里的字面量字符串，在编译期由编译器决定是否驻留：

```python
# 编译期：编译器扫描字面量 "hello"，决定驻留（标识符-like）
# 生成字节码：LOAD_CONST 指向驻留池中的 "hello" 对象
a = "hello"   # 字节码：LOAD_CONST (驻留的 "hello")
b = "hello"   # 同一 LOAD_CONST（同一驻留对象）→ a is b True
```

编译器遇到字面量 `"hello"`，查驻留池——若已有同值驻留串，复用；若无，创建并驻留。生成的字节码是 `LOAD_CONST` 指向该驻留对象。故同字面量在编译单元内引用同一驻留对象。

**隐式拼接的编译期根源**：相邻字符串字面量在**解析期**合并为一个字面量，然后编译期驻留：

```python
# 源码
s = "hello" " " "world"
# 解析期：合并为 "hello world"（单一字面量）
# 编译期：驻留 "hello world"（若符合规则）
# 字节码：LOAD_CONST ("hello world")，无运行时拼接
print(s)   # hello world
```

相邻字面量在解析期合并，故 `"hello" " " "world"` 等价 `"hello world"` 单字面量，**零运行时开销**（无拼接操作）。

**对比运行时拼接**：`"hel" + "lo"` 是运行时运算（`+`），产生新 str 对象，不驻留：

```python
# 编译期：不在解析期合并（因有 + 运算符）
# 字节码：LOAD_CONST "hel", LOAD_CONST "lo", BINARY_ADD
# 运行时：执行 + 创建新 str "hello"（不驻留，新对象）
a = "hel" + "lo"
b = "hello"
print(a is b)   # 不保证（a 运行时构造，可能不驻留）
```

`+` 是运算符，不在解析期合并，运行时执行 `BINARY_ADD` 创建新 str。新 str 默认不驻留，故 `a is b` 不保证。

### 4.3 驻留池与驻留规则的字节码根源

**驻留池（interned dict）**：CPython 维护一个全局的"已驻留字符串"集合（概念上是个 dict，键值都是字符串对象）。驻留的字符串进此池，所有同值驻留引用指向池中同一对象。

```text
驻留池工作流程：

sys.intern(s) 或编译器自动驻留
    │
    ├─→ 查驻留池：有同值串？
    │       ├─ 有 → 返回已有对象（共享）
    │       └─ 无 → 加入池，返回 s
    │
    └─→ 结果：同值字符串共享同一对象
```

**自动驻留规则的字节码根源**：

- **标识符-like 字面量驻留**：编译器对"符合标识符规则"的字面量（字母/数字/下划线），在编译期主动调用驻留逻辑加入池。因为标识符-like 字符串最常重复（变量名、键名、方法名），驻留收益大，CPython 主动优化。
- **含空格/长串不保证驻留**：CPython 对"非常量字面量"（含空格、特殊字符、长串）的驻留策略随版本/上下文变化。某些上下文（编译单元）驻留，某些（交互式 REPL）不驻留。CPython 不保证对所有字面量驻留，只对"标识符-like"明确驻留。
- **运行时构造不驻留**：`+`/`join`/`str()`/解码等运行时创建的 str，默认不进驻留池（驻留有开销，且多数运行时串不重复，驻留无收益）。

```python
# 运行时构造不驻留的字节码根源
s = "hel" + "lo"
# 字节码：BINARY_ADD → 创建新 str，不调用 PyUnicode_Intern
# 新 str 不在驻留池，is 比较可能 False
```

### 4.4 驻留为何省内存与加速比较

**省内存机制**：不驻留时，N 个同值字符串 = N 个 str 对象（N 份字符数据 + N 个对象头）。驻留后，N 个引用共享 1 个 str 对象（1 份字符数据 + 1 个对象头 + N 个指针）。

```text
不驻留：N 个 "hello" 对象，各 ~50 字节 = 50N 字节
驻留：  1 个 "hello" 对象(50 字节) + N 个指针(每 8 字节) = 50 + 8N 字节

N = 100000 时：
  不驻留: ~5MB
  驻留:   ~0.8MB
  节省:   ~80%
```

**加速 `is` 比较机制**：`is` 是身份比较（指针/id 比），O(1)。`==` 是值比较（逐字符比 + 哈希可能辅助），对长串 O(n)。驻留串 `is` 是纯指针比较，比 `==` 快。

**加速 dict str 键查找机制**：dict 查找用哈希定位槽 + `==` 确认键。CPython 对 str 键有特殊优化——若两 str `is` 同对象（同驻留对象），直接判等，跳过 `==` 逐字符比较：

```text
dict[str, ...] 查找流程：
  1. hash(key) 定位槽
  2. 槽内键 k：
     if key is k（同对象，驻留）→ 判等（跳过 ==）
     else → key == k（逐字符比）
  3. 命中 → 返回值
```

驻留让 `is` 短路判等，省 `==` 逐字符比较。这让"用驻留 str 作 dict 键"的查找更快。

### 4.5 sys.intern 的实现与生命周期

`sys.intern(s)` 调用 CPython 的 `PyUnicode_InternInPlace`——查驻留池，有则返回已有对象，无则把 s 加入池返回 s：

```python
# 内部概念性伪代码
def sys_intern(s):
    if not isinstance(s, str):
        raise TypeError("intern() argument must be str")
    existing = interned_pool.get(s)
    if existing is not None:
        return existing   # 已驻留，返回已有
    interned_pool[s] = s   # 加入池
    return s
```

**驻留池的生命周期——不释放**：驻留池里的字符串对象，在解释器生命周期内**不释放**（即使无外部引用），除非解释器退出。这是"驻留不释放"的根源：

```python
import sys

def leak():
    s = sys.intern("temporary long string" * 100)
    # s 出函数后无引用，但因驻留在池里，不释放！
    # 内存泄漏式占用（直到解释器退出）
    return

leak()
# "temporary long string..." 仍在驻留池，占内存
```

驻留池不受分代 GC 管理（普通引用计数/GC 不清理驻留池）。这是 `sys.intern` 的代价——驻留的字符串常驻内存。故 `sys.intern` 只用于"长期使用、大量重复"的字符串，不用于一次性串。

### 4.6 驻留与小整数缓存的对比

驻留不是 Python 唯一的对象缓存优化——还有小整数缓存（-5~256 的 int 对象预创建常驻）。对比两者：

```python
# 小整数缓存
a = 256
b = 256
print(a is b)   # True —— 小整数缓存，同一对象

# 大整数不一定缓存
a = 1000000
b = 1000000
print(a is b)   # 不保证 —— 大整数未必缓存
```

| 对比维度 | 字符串驻留 | 小整数缓存 |
|---------|---------------------------|----------------|
| 对象类型 | str | int (-5~256) |
| 时机 | 字面量编译期 / sys.intern | 解释器启动预创建 |
| 规则 | 标识符-like 自动，其余不保证 | -5~256 固定缓存 |
| 手动控制 | sys.intern | 无（固定范围） |
| 释放 | 驻留池不释放 | 启动到退出常驻 |

两者都是"高频值共享对象省内存/加速 is"的优化，但实现与规则不同。**共性教训**：无论是字符串驻留还是小整数缓存，`is` 对"值"的 True 都是优化假象。值相等永远用 `==`，`is` 只判身份/单例。这是贯穿两者的核心实践——优化是 `is` 偶然为 True 的原因，但代码逻辑不该依赖优化。

---

## 5. 总结

本文围绕 Python 字符串的创建方式与驻留机制展开，主要介绍了以下内容：

- **创建与驻留定义**：创建是字符串怎么来（字面量/构造/拼接等）；驻留是值相同字符串共享同一对象的 CPython 优化（省内存、加速 `is`、加速 dict str 键）。
- **不可变性**：str 不可变，任何"修改"返回新对象；不可变带来可哈希（可作 dict 键）；不可变让共享（驻留）安全。
- **字面量创建**：单双引号等价（按内容选减少转义）；三引号跨多行（docstring/多行文本）；四种前缀（r 原始/f 插值/b 字节/u 冗余），可组合（rb/rf）。
- **构造/转换创建**：`str()` 从各类型构造（`True` 转为 `'True'` 非 `'1'`、`None` 转为 `'None'`、容器转为 repr 形式）；`str()` vs `repr()`（显示 vs 代码表示）；解码（bytes → str）；重复（`*`）；拼接（`+`/join）；`chr()`（码点 → 字符）。
- **驻留规则**：标识符-like 字面量编译期自动驻留；含空格/符号的长串不保证；运行时构造默认不驻留；空字符串和单字符始终驻留。值相等永远用 `==`，不用 `is`。
- **手动驻留 `sys.intern`**：强制驻留（含空格/运行时串也能共享）；用途（大量重复省内存、海量比较加速）；注意（驻留不释放、只驻留长期重复串、`is` 需双方都驻留）。
- **隐式拼接**：相邻字面量解析期合并为零开销单字面量，运行时 `+` 则有拼接开销且不驻留。
- **原理**：紧凑 Unicode 内部表示（1/2/4 字节自适应、哈希缓存）；字面量编译期处理（驻留决策 LOAD_CONST、隐式拼接解析期合并）vs 运行时拼接（BINARY_ADD 新对象不驻留）；驻留池（全局值→对象映射）；驻留省内存（N份→1份共享）与加速（`is` O(1) vs `==` O(n)、dict str 键 is 短路）；`sys.intern` 生命周期（池持有不释放、GC 不理）；驻留 vs 小整数缓存对比（同为对象缓存优化、均实现细节勿依赖 `is`）。
- **最佳实践**：值相等用 `==` 不用 `is`、单双引号按内容选、多行用三引号、反斜杠多场景用 `r` 前缀、批量拼接用 `join`、`sys.intern` 仅瓶颈场景、`str()` 注意 `True`/`None`/容器表示、调试用 `repr` 显示用 `str`、大量修改用 list/StringIO、驻留作常识不依赖。
