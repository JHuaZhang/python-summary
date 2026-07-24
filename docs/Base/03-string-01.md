---
group:
  title: 【03】字符串介绍
  order: 3
order: 1
title: 字符串创建与驻留机制
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是字符串的创建与驻留

字符串(str)是 Python 中表示 Unicode 文本序列的内置类型,也是日常编码里使用频率最高的类型之一——日志、用户输入、配置、JSON、HTML、SQL、文件路径,几乎一切文本都是 `str`。本篇聚焦于字符串的**两件底事**:它是怎么被创建出来的(创建方式),以及创建后内存里如何存放与共享(驻留机制)。

先说创建。Python 提供了远比多数语言灵活的字符串创建方式:四种引号字面量、`str()` 构造、从字节解码、从重复生成、从可迭代拼接等。理解各创建方式的写法与适用场景,是写字符串代码的基础。

```python
# 字面量创建(四种引号)
s1 = 'hello'          # 单引号
s2 = "hello"          # 双引号
s3 = '''多行'''        # 三引号
s4 = r"C:\new"        # 原始字符串前缀
s5 = f"value={42}"    # f-string 前缀
# 构造/转换
s6 = str(42)          # str() 从数字构造
s7 = b"hi".decode()   # 字节解码
s8 = "-".join(["a", "b"])  # 拼接
```

再说驻留。你若写两次 `"hello"`,得到的是同一个字符串对象,还是两个独立对象?这看似无关紧要,却影响 `is` 比较、内存占用、性能。Python 为了省内存与加速比较,对一部分字符串做**驻留(interning)**——让值相同的字符串在全局只存一份、所有引用共享同一对象。`a = "hello"; b = "hello"; a is b` 常为 `True`,就是驻留的结果。

```python
a = "hello"
b = "hello"
print(a is b)    # True —— 驻留,同一对象(共享)
c = "hello world!"
d = "hello world!"
print(c is d)    # 看情况 —— 含空格的长串未必驻留,可能 False
```

驻留是 Python 的**实现优化**(CPython 行为,非语言保证),它让常用字符串共享单例,省内存、让 `is` 比较极速(O(1) 指针比)、加速 dict 的字符串键查找。但驻留有规则——哪些字符串自动驻留、哪些不驻留、如何手动驻留,理解这些才能正确使用 `is` 与避免内存陷阱。

本篇作为"字符串深度剖析"大章节的首篇,负责字符串的"出生与住所":创建的全部方式、字面量的引号与前缀、驻留机制的工作规则、手动驻留 `sys.intern`、驻留与 `is`/`==` 比较的关系、内存与性能影响。后续专题(索引切片、转义、原始串、拼接性能、f-string、split/strip/find/replace)展开字符串的各种操作,本篇是地基。

### 1.2 字符串的不可变性与对象模型

理解创建与驻留,先建立字符串的**不可变性**与对象模型认知——这是驻留机制的前提。

**字符串是不可变(immutable)的**:一个 str 对象创建后,它承载的字符序列永不改变。任何"修改"字符串的操作(`.upper()`、`+` 拼接、`.replace()`)都返回一个**新的 str 对象**,原对象不变。

```python
s = "hello"
print(id(s))        # 地址 A
s2 = s.upper()      # upper 返回新串 "HELLO",不 改 s
print(s)            # hello —— 原串不变
print(id(s))        # 地址 A(同,没改)
print(s2)           # HELLO(新对象)
print(s[0])         # h
# s[0] = "H"        # TypeError!str 不支持项赋值(不可变)
```

`s[0] = "H"` 报 TypeError——str 不支持按索引修改项,这是不可变性的直接体现。要"改"字符串只能创建新串(`s = "H" + s[1:]`),不能就地改。这与 list(可变,`lst[0]=x` 合法)形成对比。

**不可变性带来可哈希**:str 不可变 → 值永不变 → 哈希值稳定 → **可哈希**,能做 dict 键/set 元素(详见《hash 与可哈希类型》)。这是 str 可作 dict 键(最常用键类型)的根基。

```python
d = {"name": "Alice"}   # str 键(可哈希)
s = {",", ".", "!"}     # str 元素
```

**对象模型**:字符串是对象,有 `id`(身份)、`type`(str)、`value`(字符序列)。多个变量可指向同一 str 对象(赋值共享引用)。驻留正是利用"值相同的不可变 str 可安全共享"——既然 str 不可变(不会被谁偷偷改),让多个引用共享同一对象就绝对安全(`is` 比较、内存共享都成立)。

```python
a = "hi"
b = a            # b 与 a 指向同一 str 对象
print(a is b)    # True(共享引用)
b = "hi"         # b 改指另一 "hi"(可能同一驻留对象)
```

不可变性 + 对象模型,是驻留机制的土壤:因 str 不可变,共享同值对象安全,驻留才有意义(可变对象如 list 不能驻留共享,否则改一个影响所有)。理解这套前提,后续创建与驻留的细节才有依托。

### 1.3 创建方式速览

讲清定位前,给出字符串创建的全貌速览:

```python
# 1. 字面量(四种引号 + 前缀)
'单引号'; "双引号"; '''三引号跨行'''; """三双引号"""
r"原始串"; f"插值{42}"; b"字节串"(bytes); u"冗余unicode"

# 2. str() 构造(从其他类型)
str(42)          # '42'
str(3.14)        # '3.14'
str([1, 2])      # '[1, 2]'
str(None)        # 'None'

# 3. 从字节解码
"中文".encode().decode()          # str → bytes → str
b"abc".decode("utf-8")            # bytes → str

# 4. 从重复/拼接生成
"ab" * 3         # 'ababab'(重复)
"a" + "b"        # 'ab'(拼接)
"-".join(["a", "b", "c"])   # 'a-b-c'(批量拼接)

# 5. 从可迭代/其他
"".join(["a", "b"])    # 'ab'(列表拼)
str(chr(65))           # 'A'(码点 → 字符 → str)

# 6. 手动驻留
import sys
s = sys.intern("long string")   # 强制驻留
```

各创建方式在第 2 章详述。重点是字面量(引号与前缀)、`str()` 转换、解码、拼接——这四类覆盖 90% 场景。驻留规则(哪些自动驻留)与手动驻留在 §2.5、§4 展开。

### 1.4 驻留:为何值相同却可能是同一对象

驻留是本篇的核心概念,先建立直觉。当你写两处 `"hello"`(字面量),CPython 编译器会发现它们值相同,让两处都引用**同一个** "hello" 对象(驻留池里的一份),而非各创建一份:

```python
a = "hello"
b = "hello"
print(a is b)   # True —— 驻留,同一对象(节省内存,加速 is)
```

若不驻留,`a` 和 `b` 是两个独立的 "hello" 对象(各有内存),`a is b` 为 False。驻留让它们合一——内存省一半,且 `is` 比较瞬完成(指针比)。

**驻留的目的**:

1. **省内存**:值相同的字符串(尤其常重复的,如标识符名、键)只存一份,大量重复时省内存可观。
2. **加速 `is` 比较**:驻留串的 `is` 是 O(1) 指针比较,比 `==`(逐字符比)快,虽 `==` 对短串也快,但 `is` 更快。
3. **加速 dict 字符串键查找**:dict 用哈希+`==`查键。驻留串若 `is` 同(同一对象),dict 可用 `is` 快速短路(对象同必相等),省 `==`。CPython dict 对 str 键有此优化。

```python
# 字典 str 键查找受益于驻留:键 is 同则跳过 ==
d = {"name": "Alice"}
# d["name"] 查找时,若 "name" 与存的键驻留同对象,is 短路,极快
```

**驻留是 CPython 实现优化,非语言保证**:驻留规则属于 CPython 实现细节,不同 Python 实现(PyPy/Jython)或版本可能不同。**绝不能依赖驻留做值相等判断**——`a is b` 对短串常 True 是驻留假象,对长串/运行时构造的串不保证。值相等永远用 `==`,不用 `is`:

```python
# 危险:依赖驻留判值相等
# if a is b: ...   # 长串/动态串可能 False!
# 正确
if a == b: ...     # 始终可靠
```

驻留只用于"已知驻留场景下的 `is` 优化"或"手动 `sys.intern` 后判身份",不用作通用值相等判断。理解驻留的"目的(省内存/加速)+ 限制(实现细节、不保证、勿依赖 is 比值)",就抓住本篇核心。后续展开驻留的完整规则与原理。

---

## 2. 核心内容

本章详解字符串创建与驻留的完整用法。每节遵循"规则 → demo → 陷阱 → 场景"展开。字面量前缀、驻留规则、手动驻留是重点。

### 2.1 字面量:单双引号与三引号

字符串字面量用引号包裹,Python 提供单引号、双引号、三引号三种形式。单双引号**完全等价**,选哪个取决于字符串内容含哪种引号(以减少转义)。

**单引号与双引号(等价)**:

```python
s1 = 'hello'           # 单引号
s2 = "hello"           # 双引号,与 s1 值相同
print(s1 == s2)        # True(单双引号字符串完全等价)
print(s1 is s2)        # True(同字面量,驻留同一对象)
# 按内容含哪种引号选,减少转义
s3 = "it's fine"       # 含单引号 → 用双引号包,无需转义
s4 = 'say "hi"'        # 含双引号 → 用单引号包,无需转义
s5 = 'it\'s fine'      # 也可转义,但不如 s3 清晰
print(s3, s4, s5)
```

单双引号产生的字符串**完全相同**(同一驻留对象),没有"单引号字符串"和"双引号字符串"的区别。原则:**字符串含单引号就用双引号包、含双引号就用单引号包,尽量减少 `\` 转义**。

**三引号(跨多行)**:三个连续单/双引号,字符串内可直接含真实换行:

```python
multi = '''第一行
第二行
第三行'''
print(multi)
# 第一行
# 第二行
# 第三行

doc = """也跨行,
能含 '单引号' 和 "双引号" 而不必转义"""
print(doc)
```

三引号跨多行,源码里的换行成为字符串内的 `\n`。三引号内只要不连续出现三个同种引号,单双引号都不需转义,适合写大段文本。三引号的主要用途:**文档字符串(docstring)**(放函数/类/模块体首行)、多行文本(SQL/HTML 模板/长消息)。

```python
def greet(name):
    """问候用户。

    name: 用户名
    """
    return f"Hello, {name}"
print(greet.__doc__)   # 三引号 docstring
```

**单双三引号的背反**:

```python
# 三引号内含三引号需转义或换种
s = '''含 ''' 内部'''      # SyntaxError(三引号提前结束)
s = '''含 \'\'\' 内部'''   # 转义
s = """含 ''' 内部"""      # 用三双引号包三单引号内容,无需转义
```

三引号内要含三个同种引号,需转义或换另一种三引号包裹。实战中三双引号包三单引号内容(或反之)最简单。

### 2.2 字符串前缀:r、f、b、u

引号前可加**前缀字符**改变字符串解析方式。前缀大小写不敏感(惯例小写),部分可组合。

对应的英文全称和含义为：

| 前缀 | 英文全称 | 含义 | 示例 |
| :--- | :--- | :--- | :--- |
| **`f`** | format | 格式化字符串（f-string），可以在 `{}` 中嵌入变量或表达式 | `f"Hello {name}"` |
| **`r`** | raw | 原始字符串，反斜杠 `\` 不作为转义字符处理 | `r"C:\Users\name"` |
| **`b`** | bytes | 字节串，处理的是二进制数据，而非文本 | `b"hello"` |
| **`u`** | Unicode | Unicode 字符串，在 Python 3 中所有字符串默认就是 Unicode，所以基本用不到 | `u"你好"` |

**原始字符串 `r`/`R`**:反斜杠不作为转义符,按字面处理。处理正则表达式、Windows 路径、含大量反斜杠的文本时不可或缺:

```python
print(r"C:\new\folder\todo.txt")   # C:\new\folder\todo.txt —— \n 不转义成换行
print("C:\new\folder\todo.txt")    # C:                  ← \n\t 变成换行/制表
print(r"\d+\.\d+")                  # \d+\.\d+ —— 正则模式原样保留
print("\d+\.\d+")                   # DeprecationWarning(\d 无效转义)
```

⚠️ 原始字符串的**唯一限制**:不能以单个反斜杠结尾。`r'\'` 是语法错误——即便原始串里,反斜杠仍会"转义后续引号"导致引号未闭合。需以反斜杠结尾时拼接:

```python
# r'C:\folder\'     # SyntaxError: 末尾单反斜杠
path = r"C:\folder" + "\\"    # 拼接一个反斜杠 → C:\folder\
```

原始字符串的转义与字面量规则见《原始字符串》专题,本篇只讲它作为创建方式之一。

**f-string `f`/`F`**(Python 3.6+):在字符串里用 `{表达式}` 插值求值,是格式化字符串的现代首选:

```python
name = "Alice"
age = 30
print(f"姓名:{name}, 年龄:{age}")      # 姓名:Alice, 年龄:30
print(f"明年 {age + 1} 岁")            # 明年 31 岁 —— 支持表达式
print(f"{name!r}")                      # 'Alice' —— !r 调 repr
print(f"{3.14159:.2f}")                 # 3.14 —— :后是格式说明符
```

f-string 的 `{}` 内是真表达式,可调用函数、做运算。f-string 高级用法(格式说明符、对齐、调试 `=`、嵌套)见《f-string 高级格式化》专题。

**字节串 `b`/`B`**:产生 `bytes` 对象(不可变字节序列)而非 str。每个字符必须是 ASCII 或用 `\xHH`:

```python
print(b"abc")            # b'abc' —— type 是 bytes 不是 str
print(type(b"abc"))      # <class 'bytes'>
print(b"\x41\x42")       # b'AB' —— 十六进制指定字节
# b"中文"                # SyntaxError: 字节串不能直接含非 ASCII
print("中文".encode())   # b'\xe4\xb8\xad...' —— 中文需编码
```

`b"..."` 产生 bytes(字节),不是 str(文本)。字节串用于二进制数据(文件二进制读写、网络、加密),文本用 str,二者通过 encode/decode 转换。详见《基础数据类型》《显式类型转换》。

**Unicode 前缀 `u`/`U`**:Python 3 里所有字符串默认就是 Unicode,`u"abc"` 与 `"abc"` 完全相同。主要为兼容 Python 2 代码留存,新代码无需写。

**前缀组合**:`r` 与 `b`、`r` 与 `f` 可组合,顺序不限。常见 `rb`(原始字节串)与 `rf`(原始 f-string,3.12+):

```python
print(rb"C:\new")        # b'C:\\new' —— 原始字节串,反斜杠不转义
# rf"{name}\n"           # 3.12+ —— 原始 f-string,\n 是字面反斜杠加 n
```

| 前缀      | 含义                   | 结果类型 |
| --------- | ---------------------- | -------- |
| 无        | 普通字符串             | `str`    |
| `r`       | 原始(反斜杠不转义)     | `str`    |
| `f`       | f-string 插值          | `str`    |
| `b`       | 字节串                 | `bytes`  |
| `u`       | Unicode(Python 3 冗余) | `str`    |
| `rb`/`br` | 原始字节串             | `bytes`  |
| `rf`/`fr` | 原始 f-string(3.12+)   | `str`    |

### 2.3 str() 构造与从其他类型创建

字面量外,`str()` 构造函数从其他类型创建字符串,是显式转换的主力(详见《显式类型转换》)。

**`str()` 从各类型构造**:

```python
print(str(42))          # '42' —— int → str
print(str(-5))          # '-5'
print(str(3.14))        # '3.14' —— float → str
print(str(True))        # 'True' —— bool(注意:True 不是 '1')
print(str(None))        # 'None'
print(str([1, 2, 3]))   # '[1, 2, 3]' —— list 的 repr 形式
print(str({"a": 1}))    # "{'a': 1}" —— dict
print(str((1, 2)))      # '(1, 2)'
```

`str(x)` 给 x 的"用户友好显示":数字转数字串、True/False/None 转其名、容器转类似 repr 的形式。`str(True)` 是 `'True'`(不是 `'1'`)——bool 转字符串是其名字非数值。

**`str()` vs `repr()`**:

```python
print(str("hi"))        # hi —— 用户友好显示
print(repr("hi"))       # 'hi' —— 带引号的代码表示(可 eval 回来)
print(str(3.14))        # 3.14
print(repr(3.14))       # 3.14
print(str("\n"))        # (换行,显示为空行)
print(repr("\n"))       # '\\n'(转义形式,可见)
```

- `str(x)`:给用户看的友好显示(字符串无引号、换行真实换行)。
- `repr(x)`:给开发者看的代码表示(字符串带引号、换行显 `\n`),理想可 `eval` 回来。

调试/日志用 `repr`(信息全、能区分类型如 `1` vs `'1'`),显示给用户用 `str`。

**从字节解码创建(str)**:bytes → str 用 `decode`:

```python
b = b"hello"
s = b.decode("utf-8")       # bytes → str
print(s)                    # hello
# 中文
b_zh = "中文".encode("utf-8")
print(b_zh.decode("utf-8"))    # 中文(用对的编码解码)
# 编码必须匹配,否则乱码或 UnicodeDecodeError
# b_zh.decode("ascii")          # UnicodeDecodeError
```

`.decode(encoding)` 把字节按编码转 str。编码必须匹配(用对的编码解,详见《显式类型转换》编码部分)。

**从重复生成(`*`)**:`str * int` 重复字符串:

```python
print("ab" * 3)         # ababab(重复 3 次)
print("=" * 20)         # ====================(生成分隔线)
print("0" * 8)         # 00000000
# 重复是创建新串(str 不可变)
```

`"ab" * 3` 重复生成新串。常用于生成分隔线、占位填充。

**从拼接生成(`+` 与 `join`)**:

```python
print("a" + "b" + "c")    # abc(+ 拼接少量)
print("-".join(["a", "b", "c"]))  # a-b-c(join 批量拼接)
# join 是批量拼接的标准方式,+ 适合少量
```

`+` 拼接少量,`join` 批量(性能差异见《字符串拼接性能对比》专题)。

**从可迭代拼接(`"".join`)**:

```python
print("".join(["a", "b", "c"]))    # abc(无分隔拼接)
print("".join(c for c in "hello" if c != "l"))  # heo(过滤拼接)
# join 接受任意可迭代(元素须 str)
nums = [1, 2, 3]
print(",".join(str(n) for n in nums))   # 1,2,3(非 str 先转)
```

`"".join(可迭代)` 是"从字符/片段序列拼成串"的通用方式,元素须都是 str(非 str 用生成器先 `str()` 转)。

**从码点创建(`chr`)**:

```python
print(chr(65))          # A —— 码点 65 → 字符 'A'
print(chr(0x4e2d))      # 中 —— 码点 U+4E2D → '中'
print(chr(128512))      # 😀 —— 码点 → emoji
# chr(int) 单码点 → 单字符 str
# 多码点用 "".join(chr(c) for c in codes)
```

`chr(码点)` 把 Unicode 码点转单字符 str。配合 `ord`(字符→码点)在字符与码点间转换。

理解这些创建方式(字面量、`str()`、解码、重复、拼接、`chr`),就掌握字符串"怎么来"的全部途径,按场景选最合适的创建方式。

### 2.4 驻留机制:哪些字符串会自动驻留

驻留(interning)是 CPython 的自动优化,但**并非所有字符串都驻留**——它有规则,只对"值得驻留"的字符串自动驻留。理解规则,才能预判 `a is b` 的结果(虽不该依赖,但理解有助于排查)。

**规则一:字面量中符合标识符规则的字符串自动驻留**。这是最核心的规则——字面量里"看起来像标识符"(只含字母、数字、下划线)的字符串,编译期自动驻留:

```python
a = "hello"
b = "hello"
print(a is b)        # True —— "hello" 是标识符-like,字面量驻留
c = "hello_world"
d = "hello_world"
print(c is d)        # True —— 含下划线仍是标识符-like,驻留
e = "abc123"
f = "abc123"
print(e is f)        # True —— 字母数字也是标识符-like
```

只含字母/数字/下划线(且不以数字开头?实际字面量驻留不严格要求标识符首字符,但符合标识符整体特征的驻留)的字面量,编译期驻留。这是最常见的驻留场景——代码里的字符串字面量多为这类(键名、标识符)。

**规则二:含特殊字符(空格、符号、长串)的字面量不一定驻留**:

```python
a = "hello world!"
b = "hello world!"
print(a is b)        # 不保证 True —— 含空格/!,可能不驻留(交互式常 False)
c = "this is a long string with spaces"
d = "this is a long string with spaces"
print(c is d)        # 不保证 —— 含空格的长串,交互式常 False
```

⚠️ 含空格、特殊符号、长串的字面量,**不一定自动驻留**(CPython 版本与执行上下文影响)。在**模块顶层/编译单元内**可能驻留(编译器优化),在**交互式 REPL** 常不驻留。这是"不保证"的区域——别依赖。

```python
# 模块内(编译单元):部分含空格字面量可能驻留
# 交互式:含空格长串通常不驻留
# 故 "hello!" is "hello!" 的结果依赖环境,不保证
```

**规则三:运行时构造的字符串(非字面量)默认不驻留**:`str()`、`+`、`join`、`%`、`format`、解码等**运行时**产生的字符串,默认不驻留(即使值与某字面量同):

```python
a = "hello!"
b = "hel" + "lo!"     # 运行时拼接产生
print(a is b)         # 不保证 True —— b 是运行时构造,可能不驻留
c = "!".join(["hello", ""])  # 运行时 join
d = "hello!"
print(c is d)         # 不保证 —— c 运行时构造
# 解码
e = b"hello!".decode()
f = "hello!"
print(e is f)         # 不保证 —— e 解码构造
```

运行时构造的字符串(拼接/join/解码/`str()` 等)默认是**新对象**,不自动驻留——即便值与已有字面量相同,也可能是独立对象。`is` 比较可能 False。

**规则四:`*` 重复、`%`/`format`/f-string 结果通常不驻留**:

```python
a = "ab" * 2          # 'abab'
b = "abab"
print(a is b)         # 不保证 —— * 重复产生的新串不驻留
name = "x"
c = f"hello{name}"    # 'hellox'
d = "hellox"
print(c is d)         # 不保证 —— f-string 运行时构造
```

`*` 重复、f-string/format/% 格式化的结果,运行时构造,不自动驻留。

**驻留规则的实用结论**:

```python
# 这些场景 is 常为 True(驻留):
# 1. 字面量(标识符-like)在编译单元内的多次出现
"hello" is "hello"           # True(字面量驻留)
# 这些场景 is 不保证(不驻留或依赖环境):
# 1. 含空格/符号/长串的字面量(交互式常 False)
# 2. 运行时构造(+ / join / str() / 解码 / f-string)
"hel"+"lo" is "hello"        # 不保证(运行时拼接)
# 故:值相等永远用 ==,is 只用于明确驻留/单例场景
```

⚠️ **核心实践:绝不在通用代码用 `is` 比字符串值**。驻留规则复杂且依赖实现/环境,`a is b` 对字符串可能 True 也可能 False,取决于驻留。值相等**永远用 `==`**:

```python
# 危险:依赖驻留
# if a is b: ...   # 不保证!长串/运行时构造可能 False
# 正确
if a == b: ...     # 始终可靠
# is 仅用于:已知驻留(如 sys.intern 后)、单例(None)
```

理解驻留规则(标识符-like 字面量驻留、含空格/长串/运行时构造不保证),就理解"`is` 对字符串时 True 时 False"的现象,从而恪守"字符串值相等用 `==`"。

### 2.5 手动驻留:sys.intern

需要"确保多个值相同的字符串共享同一对象"时(如大量重复字符串的内存优化、需要 `is` 快速比较),可手动驻留——`sys.intern`。

**`sys.intern(string)`**:把字符串加入全局驻留池,返回驻留对象(若已驻留则返回已有对象):

```python
import sys
a = sys.intern("a long string with spaces")
b = sys.intern("a long string with spaces")
print(a is b)    # True!手动驻留,同一对象(即便含空格、运行时构造)
# 对比不驻留
c = "a long string with spaces"
d = "a long string with spaces"
print(c is d)    # 不保证(交互式常 False,含空格不自动驻留)
```

`sys.intern(s)` 把 s 加入驻留池,之后对同值字符串 `sys.intern` 返回同一对象。这让"含空格/运行时构造"的字符串也能强制驻留,`is` 比较可靠 True。

**`sys.intern` 的用途一:大量重复字符串省内存**。处理大量重复字符串(如解析日志的固定字段、词典查询的同名键)时,手动驻留让所有重复值共享一份,省内存:

```python
import sys
# 假设从日志解析出大量重复的状态字符串
statuses = ["ERROR timeout"] * 100000   # 模拟大量重复
# 不驻留:每行可能独立对象(若运行时构造),内存膨胀
# 驻留:同值共享一份
interned = [sys.intern(s) for s in statuses]   # 全部共享同一 "ERROR timeout" 对象
# 驻留后内存:1 份字符串 + 100000 个引用(指针),省 100000 份字符串内存
```

**`sys.intern` 的用途二:`is` 快速比较**。驻留后,字符串比较可用 `is`(O(1) 指针比)代替 `==`(逐字符比),对海量比较提速:

```python
import sys
# 海量字符串比较场景(如字典词查找)
words = [sys.intern(w) for w in load_dictionary()]   # 词典驻留
target = sys.intern("someword")
# 用 is 比较(驻留保证同值则同对象)
found = any(w is target for w in words)   # is 比 == 快
# 对比 == :逐字符比每个词,慢
```

驻留让词典查找可用 `is`——同值必同对象(驻留保证),`is` 瞬完成。这是驻留的性能价值。

**`sys.intern` 的注意事项**:

1. **驻留池不释放**:驻留的字符串进全局池,生命周期内不释放(即使无引用),除非解释器退出。故**只驻留"确实大量重复、长期使用"的字符串**,别驻留一次性/临时字符串(驻留后不释放,泄漏内存)。
2. **驻留有开销**:`sys.intern` 调用本身有开销(查池/入池),只对"会被大量重复比较"的字符串值得,少量字符串驻留收益小于开销。
3. **`is` 优化需双方都驻留**:用 `is` 比较需双方都 `sys.intern` 过(同值才同对象)。只驻留一方,`is` 仍可能 False(另一方是新对象)。

```python
import sys
a = sys.intern("word")
b = "word"            # 未 sys.intern(可能字面量驻留,但不保证)
print(a is b)         # 可能 True(若 b 字面量驻留)或 False(b 运行时构造)
b = sys.intern(b)     # 双方都驻留
print(a is b)         # True(双方驻留,同值同对象)
```

**何时用 `sys.intern`**:

- 解析大量重复字符串(日志、配置、词典)→ 驻留省内存。
- 海量字符串比较(词库查找、NLP)→ 驻留后 `is` 加速。
- **不用**于:少量字符串(开销不划算)、一次性字符串(驻留不释放致泄漏)、通用代码(默认 `==` 够用)。

```python
# 合理:大量重复配置值驻留
import sys
CONFIG_VALUES = {k: sys.intern(v) for k, v in load_config() if v in COMMON_VALUES}
# 不合理:每个临时变量驻留
# for line in f:
#     s = sys.intern(line.strip())   # 一次性,驻留不释放,泄漏
```

`sys.intern` 是高级优化工具,仅在"大量重复/海量比较"的明确瓶颈场景用,日常字符串操作用 `==` 即可。

### 2.6 综合示例:创建与驻留在实战中的表现

下面这个片段综合演示字符串创建方式与驻留现象:

```python
import sys

# 1. 创建方式对比
print("=== 创建方式 ===")
# 注意：Python 3.9-3.11 的 f-string 不支持在 {} 内部使用反斜杠转义，下面这种写法会报错
print(f"字面量: {'hello'} / {\"hello\"}")
print(f"str(): {str(42)}, {str([1,2])}")
print(f"重复: {'=' * 10}")
print(f"拼接: {'a' + 'b'}, join: {'-'.join(['x','y','z'])}")
print(f"解码: {b'abc'.decode()}")
print(f"码点: {chr(65)}{chr(0x4e2d)}")

# 2. 驻留现象:标识符-like 字面量驻留
print("\n=== 驻留(标识符-like) ===")
a, b = "python", "python"
print(f"  'python' is 'python': {a is b}")   # True(驻留)

# 3. 驻留不保证:含空格/运行时构造
print("\n=== 驻留不保证 ===")
c, d = "hello world", "hello world"
print(f"  'hello world' is 'hello world'(顶层): {c is d}")   # 看环境
e = "hel" + "lo"
print(f"  运行时拼接 'hel'+'lo' is 'hello': {e is 'hello'}")  # 不保证

# 4. sys.intern 强制驻留
print("\n=== sys.intern 强制驻留 ===")
s1 = sys.intern("a long string with spaces!")
s2 = sys.intern("a long string with spaces!")
print(f"  intern 后 is: {s1 is s2}")   # True(强制驻留)

# 5. 值相等始终用 ==
print("\n=== 值相等用 == ===")
x = "hello"
y = "hel" + "lo"    # 运行时构造
print(f"  x is y: {x is y}(不保证)")   # 可能 False
print(f"  x == y: {x == y}(可靠)")     # True

# 6. 驻留省内存演示(概念)
print("\n=== 驻留省内存 ===")
# 模拟大量重复状态
statuses = ["TIMEOUT ERROR"] * 5
interned = [sys.intern(s) for s in statuses]
print(f"  未驻留对象数: {len(set(id(s) for s in statuses))}")      # 可能多个
print(f"  驻留后对象数: {len(set(id(s) for s in interned))}")     # 1(全共享)

# 7. 不可变性:任何"修改"产生新对象
print("\n=== 不可变性 ===")
s = "hello"
print(f"  s id: {id(s)}")
s2 = s.upper()
print(f"  s(原): {s}, id 不变: {id(s)}")
print(f"  s2(新): {s2}, id 不同: {id(s2)}")
```

跑一遍这段示例(注意驻留结果可能因环境略异),对照输出:各类创建方式、标识符-like 驻留(True)、含空格/运行时构造不保证、`sys.intern` 强制驻留(True)、`==` 可靠 vs `is` 不保证、驻留省内存、不可变性产生新对象——字符串创建与驻留的全貌就清晰了。

核心结论:**字符串创建用字面量(引号+前缀)/str()构造/解码/重复/拼接,字面量标识符-like 自动驻留(省内存加速 is),含空格/运行时构造不保证驻留,值相等永远用 == 不用 is,大量重复/海量比较场景用 sys.intern 手动驻留优化**。

---

## 3. 最佳实践

### 3.1 字符串值相等永远用 ==,不用 is

```python
# 推荐
if a == b: ...
# 避免(依赖驻留,不保证)
# if a is b: ...   # 长串/运行时构造可能 False
```

驻留规则复杂且依赖实现/环境,`a is b` 对字符串可能 True 也可能 False。值相等**永远用 `==`**。`is` 仅用于明确驻留(`sys.intern` 后)或单例(None)场景。这条是本篇头号实践。

### 3.2 单双引号按内容含哪种选,减少转义

```python
# 推荐:按内容选引号减少转义
"it's fine"        # 含单引号用双引号包
'say "hi"'         # 含双引号用单引号包
# 避免:不必要的转义
# 'it\'s fine'      # 转义,不如双引号清晰
```

单双引号等价,按字符串含哪种引号选另一种包裹,减少 `\` 转义,提升可读性。项目内可统一风格(如全用双引号)。

### 3.3 多行文本与 docstring 用三引号

```python
# 三引号:多行文本/docstring
def f():
    """这是 docstring,
    跨多行。"""
    ...
sql = """
    SELECT * FROM users
    WHERE id = 1
"""
# 避免:用 \n 拼多行(难读)
# sql = "SELECT * FROM users\nWHERE id = 1"
```

多行文本(SQL/HTML/长消息)与函数/类/模块的 docstring 用三引号,源码换行即字符串换行,清晰。别用 `\n` 拼多行。

### 3.4 含反斜杠的字符串(正则/路径)用 r 前缀

```python
# 推荐:原始串处理反斜杠
regex = r"\d+\.\d+"
path = r"C:\Users\new\data"
# 避免:转义地狱
# regex = "\\d+\\.\\d+"
# path = "C:\\Users\\new\\data"   # \n 会被误转义!
```

正则、Windows 路径、LaTeX 等含大量反斜杠的字符串,一律 `r"..."`。既避免 `DeprecationWarning`,又杜绝 `\n`/`\t` 被误转义的隐蔽 bug。注意原始串不能以单反斜杠结尾。

### 3.5 格式化优先 f-string,简短插值最直观

```python
# 推荐(Python 3.6+)
msg = f"用户 {name} 余额 {balance:.2f}"
# 避免(旧式,易错位/啰嗦)
# msg = "用户 %s 余额 %.2f" % (name, balance)
# msg = "用户 {} 余额 {:.2f}".format(name, balance)
```

f-string 最直观(变量就地、表达式直接)、最快(编译期优化)、最不易错。除非兼容旧版本或模板延迟填充,字符串格式化优先 f-string。

### 3.6 批量拼接用 join,循环 + 性能差

```python
# 推荐:join 批量拼接
result = "".join(parts)
result = ",".join(str(p) for p in parts)
# 避免:循环 +(每次新建,O(n²))
# result = ""
# for p in parts:
#     result += p
```

`join` 一次性分配拼接,循环 `+` 每次新建字符串(O(n²))。批量拼接一定 `join`。详见《字符串拼接性能对比》。

### 3.7 不要跨进程依赖 hash(str) 或具体驻留对象

```python
# str 哈希随机化(跨进程不同),不要持久化
# 不要 hash(s) 存文件再比对(跨进程不匹配)
# 需确定性跨进程哈希用 hashlib
import hashlib
digest = hashlib.sha256(s.encode()).hexdigest()   # 跨进程一致
# 驻留对象也同理:不保证跨进程(不同进程驻留池独立)
```

str 哈希随机化(防冲突攻击),驻留池是进程级,均不跨进程。需跨进程确定性(存哈希、对象序列化)用 `hashlib`,不依赖内置 `hash`/驻留。

### 3.8 sys.intern 仅用于大量重复/海量比较的瓶颈场景

```python
# 合理:大量重复状态驻留
import sys
statuses = [sys.intern(s) for s in load_many_statuses()]  # 重复值共享
# 不合理:一次性/少量字符串驻留
# for line in f:
#     s = sys.intern(line)   # 驻留不释放,泄漏内存
```

`sys.intern` 适合"大量重复字符串省内存"或"海量比较用 is 加速"。一次性/少量字符串别驻留(进池不释放,泄漏;开销不划算)。它是高级优化,非默认操作。

### 3.9 str() 转换注意 True/None/容器的表示

```python
str(True)    # 'True'(非 '1')
str(None)    # 'None'
str([1,2])   # '[1, 2]'(容器 repr 形式)
str(3.14)    # '3.14'
# 注意:str(True) 是 'True',布尔转字符串是其名非数值
```

`str()` 转换注意:bool 转其名(`'True'`/`'False'` 非 `'1'`/`'0'`),None 转 `'None'`,容器转 repr 形式(含括号)。需数值形式先 `int(True)` 再 `str`。

### 3.10 调试用 repr,显示给用户用 str

```python
# 调试/日志用 repr(信息全,可区分类型)
log.debug("data: %r", data)    # %r 调 repr,字符串带引号、换行显 \n
# 显示给用户用 str(友好,无引号)
print(data)   # str 显示
# print(repr("hi"))  # 'hi'(带引号,调试用)
# print(str("hi"))   # hi(无引号,显示用)
```

`repr` 给代码表示(带引号、转义可见、可 eval),调试/日志用它(信息全、能区分 `1` vs `'1'`)。`str` 给用户友好显示。按用途选。

### 3.11 字符串不可变,大量修改用 list 缓冲或 io.StringIO

```python
# 避免:大量字符串"修改"(每次新建)
# s = ""
# for chunk in chunks:
#     s = s + chunk   # O(n²)
# 推荐:用 list 收集再 join,或 StringIO
parts = []
for chunk in chunks:
    parts.append(chunk)
result = "".join(parts)
# 或
from io import StringIO
buf = StringIO()
for chunk in chunks:
    buf.write(chunk)
result = buf.getvalue()
```

字符串不可变,大量追加/修改别反复 `+`(每次新建)。用 list 收集后 `join`,或 `io.StringIO` 流式累积。这是处理大文本的标准模式。

### 3.12 字面量驻留别依赖,可作常识理解

```python
# 知道有驻留(理解 is 现象),但代码不依赖
"a" is "a"          # True(驻留,但不写这种判等)
# 长串/运行时构造不保证,故 == 才可靠
if word == target:  # 用 ==,不依赖驻留
    ...
```

了解驻留(知道为何短字面量 `is` 常 True、长串不保证),但**代码不依赖驻留**做判等。`==` 是通用可靠方式,驻留只作"理解现象、高级优化"的知识储备。

---

## 4. 原理

本章讲清字符串创建与驻留的底层机制:字符串的内部表示(紧凑 Unicode)、字面量编译期处理与隐式拼接、驻留池(interned dict)的实现、驻留规则的字节码根源、驻留为何省内存加速比较、`sys.intern` 的实现、与其他"小对象缓存"(小整数)的对比。这些是"创建与驻留为何如此"的根基。

### 4.1 字符串的内部表示:紧凑 Unicode(需理解,详述)

要理解驻留,先理解字符串在内存里是什么样。Python 3 的 str 是 **Unicode 字符序列**,内部用"紧凑表示"——根据字符串里最大字符的码点,选最省的字节宽度存储:

- **ASCII(latin1,1 字节/字符)**:字符串全 ASCII(码点 ≤ 255)时,每字符 1 字节存。
- **UCS-2(2 字节/字符)**:含 BMP 字符(码点 ≤ 65535,如中文)时,每字符 2 字节。
- **UCS-4(4 字节/字符)**:含辅助平面字符(码点 > 65535,如 emoji 😀)时,每字符 4 字节。

```python
# 不同内容字符串内部字节宽度不同
import sys
print(sys.getsizeof("a"))          # ~50(ASCII,1字节/字符 + 对象头)
print(sys.getsizeof("中文"))        # ~76(UCS-2,2字节/字符)
print(sys.getsizeof("😀"))          # ~76(UCS-4,4字节/字符)
# 字节宽度由字符串内最大码点决定,选最省的
```

CPython 的 str 对象按内容自动选 1/2/4 字节宽度——这让 ASCII 字符串省内存(1 字节),只在需要时升级到 2/4 字节。这是 Python 3.3+ 的 PEP 393"灵活字符串表示",相对早期固定宽度省内存。

**字符串对象的结构**:str 对象 = 对象头(ob_refcnt 引用计数、ob_type 指向 str 类、hash 缓存哈希值)+ 长度+ 字节宽度标志 + 字符数据(紧凑数组)。

```python
# str 对象结构(概念)
# struct {
#     ob_refcnt, ob_type,    # 对象头
#     hash,                  # 缓存的哈希值(懒计算,首次 hash() 后存)
#     length,                # 字符数
#     char_width,            # 1/2/4 字节
#     char_data[]            # 紧凑字符数组
# }
```

**哈希缓存**:str 对象缓存哈希值——首次 `hash(s)` 计算后存入对象,后续 `hash(s)` 直接返回缓存(O(1))。这让 str 作 dict 键时哈希计算几乎零成本(首算后复用),是 dict str 键高效的原因之一。

理解字符串内部表示(紧凑 Unicode 1/2/4 字节、对象头含哈希缓存),就理解字符串的内存占用、为何 ASCII 省内存、为何 dict str 键快(哈希缓存)——这是驻留"省内存加速"的物理基础。

### 4.2 字面量的编译期处理与隐式拼接(需理解,详述)

字符串字面量在 Python **编译期**就被处理,这产生两个重要优化:驻留决策、隐式拼接。

**编译期驻留决策**:源码里的字面量字符串,在编译期由编译器决定是否驻留。规则(参 §2.4):

```python
# 编译期:编译器扫描字面量 "hello",决定驻留(标识符-like)
# 生成字节码:LOAD_CONST 指向驻留池中的 "hello" 对象
a = "hello"   # 字节码:LOAD_CONST (驻留的 "hello")
b = "hello"   # 同一 LOAD_CONST(同一驻留对象)→ a is b True
```

编译器遇到字面量 `"hello"`,查驻留池——若已有同值驻留串,复用;若无,创建并驻留。生成的字节码是 `LOAD_CONST` 指向该驻留对象。故同字面量在编译单元内引用同一驻留对象,`is` 为 True。这是"标识符-like 字面量驻留"的编译期根源——编译器在编译期完成驻留,运行时直接 LOAD_CONST。

**隐式拼接(相邻字面量自动合并)**:相邻字符串字面量(中间只空白/换行)在**解析期**合并为一个字面量,然后编译期驻留:

```python
# 源码
s = "hello" " " "world"
# 解析期:合并为 "hello world"(单一字面量)
# 编译期:驻留 "hello world"(若符合规则)
# 字节码:LOAD_CONST ("hello world"),无运行时拼接
print(s)   # hello world
```

相邻字面量在解析期合并(详见《字面量详解》),故 `"hello" " " "world"` 等价 `"hello world"` 单字面量,**零运行时开销**(无拼接操作)。这是隐式拼接"零成本"的编译期根源——解析期已合并成单字面量,运行时只 LOAD_CONST。

**对比运行时拼接**:`"hel" + "lo"` 是运行时运算(`+`),产生新 str 对象,不驻留:

```python
# 编译期:不在解析期合并(因有 + 运算符)
# 字节码:LOAD_CONST "hel", LOAD_CONST "lo", BINARY_ADD
# 运行时:执行 + 创建新 str "hello"(不驻留,新对象)
a = "hel" + "lo"
b = "hello"
print(a is b)   # 不保证(a 运行时构造,可能不驻留)
```

`+` 是运算符,不在解析期合并,运行时执行 `BINARY_ADD` 创建新 str。新 str 默认不驻留(§2.4 规则三),故 `a is b` 不保证。这是"字面量驻留 vs 运行时拼接不驻留"的字节码根源——字面量编译期驻留,`+` 运行时构造不驻留。

理解字面量编译期处理(驻留决策 + 隐式拼接)与运行时拼接的差异,就理解"`'hello' is 'hello'` True 但 `'hel'+'lo' is 'hello'` 不保证"的编译期根源。

### 4.3 驻留池与驻留规则的字节码根源

§2.4 讲了驻留规则,这里讲清驻留池(interned dict)的实现与规则根源。

**驻留池(interned dict)**:CPython 维护一个全局的"已驻留字符串"集合(概念上是个 dict,键值都是字符串对象)。驻留的字符串进此池,所有同值驻留引用指向池中同一对象。

```python
# sys.intern(s) 的内部(概念)
def intern(s):
    if s in 驻留池:
        return 驻留池[s]      # 已驻留,返回已有对象
    驻留池[s] = s             # 未驻留,加入池
    return s
```

驻留池是"值 → 对象"的映射。`sys.intern(s)` 查池:有则返回已有(共享),无则加入。自动驻留(字面量)在编译期同样操作驻留池。

**自动驻留规则的字节码根源**:为何标识符-like 字面量驻留、含空格长串不保证?

- **标识符-like 字面量驻留**:编译器对"符合标识符规则"的字面量(字母/数字/下划线),在编译期主动调用驻留逻辑加入池。这是因标识符-like 字符串最常重复(变量名、键名、方法名),驻留收益大,CPython 主动优化。

```python
# 字节码层面:标识符-like 字面量编译期驻留
a = "hello"   # LOAD_CONST (驻留对象)
b = "hello"   # LOAD_CONST (同一驻留对象)
# 编译器在 CODE Object 创建时,对这些常量调用 PyUnicode_InternFromString
```

- **含空格/长串不保证驻留**:CPython 对"非常量字面量"(含空格、特殊字符、长串)的驻留策略随版本/上下文变化。某些上下文(编译单元、特定优化)驻留,某些(交互式 REPL)不驻留。CPython 不保证对所有字面量驻留,只对"标识符-like"明确驻留。

```python
# 含空格:"hello world" 的驻留依赖上下文
# 模块编译单元内:可能驻留(编译器优化)
# 交互式 REPL:常不驻留(REPL 执行上下文不同)
# 故 "hello world" is "hello world" 不保证
```

这解释了为何"`'hello' is 'hello'` 稳定 True"(标识符-like,明确驻留)而 `'"hello world" is "hello world"'` 看环境——CPython 只对标识符-like 保证驻留,其余是"尽力而为"的优化,依赖实现。

**运行时构造不驻留的根源**:`+`/`join`/`str()`/解码等运行时创建的 str,默认**不进驻留池**(CPython 不自动驻留运行时新串):

```python
s = "hel" + "lo"    # BINARY_ADD 创建新 str,不调用 PyUnicode_Intern
# 新 str 不在驻留池,is 比较可能 False
```

运行时构造的 str 是"普通 str 对象",CPython 不自动驻留它(驻留有开销,且多数运行时串不重复,驻留无收益)。故运行时构造串 `is` 不保证。要驻留运行时串,显式 `sys.intern`。

理解驻留池(全局值→对象映射)与规则根源(标识符-like 编译期主动驻留、含空格/运行时不保证),就理解驻留现象的全部规律——它不是魔法,是 CPython 编译器对"高频重复字面量"的主动优化,对低频/运行时串不优化。

### 4.4 驻留为何省内存与加速比较

§1.4 讲了驻留的目的,这里讲清省内存与加速的量化机制。

**省内存的机制**:不驻留时,N 个同值字符串 = N 个 str 对象(N 份字符数据 + N 个对象头)。驻留后,N 个引用共享 1 个 str 对象(1 份字符数据 + 1 个对象头 + N 个指针)。

```
不驻留:N 个 "hello" 对象,各 ~50 字节 = 50N 字节
驻留:1 个 "hello" 对象(50 字节)+ N 个指针(每 8 字节)= 50 + 8N 字节
N=100000:不驻留 5MB,驻留 0.8MB —— 省 80%
```

驻留让大量重复字符串共享一份字符数据,省内存。N 越大、字符串越长(字符数据越大),省越明显。这是处理大量重复字符串(日志、词典、配置)用 `sys.intern` 省内存的量化依据。

**加速 `is` 比较的机制**:`is` 是身份比较(指针/id 比),O(1)。`==` 是值比较(逐字符比 + 哈希可能辅助),对长串 O(n)。

```
驻留串比较:is(指针比)O(1)
普通串比较:==(逐字符)O(n),虽 str 有哈希缓存可加速,但仍比 is 多步
# 海量比较场景,is 比 == 快
```

驻留串 `is` 是纯指针比较(O(1)),比 `==`(要逐字符或哈希)快。海量比较(词典查找、NLP 词匹配)用驻留 + `is` 加速。但因 CPython str `==` 有优化(先比哈希/长度/指针,哈希同且长度同可能快速判定),`==` 对短串也接近 O(1),`is` 优势主要在海量长串比较。

**加速 dict str 键查找的机制**:dict 查找用哈希定位槽 + `==` 确认键。CPython 对 str 键有特殊优化——若两 str `is` 同对象(同驻留对象),直接判等(跳过 `==` 逐字符):

```python
# dict[str, ...] 查找,CPython 优化:
# d[key]:
#   1. hash(key) 定位槽
#   2. 槽内键 k:if key is k(同对象,驻留):判等(跳过 ==)
#      else: key == k(逐字符比)
# 驻留让 is 短路,省 == 逐字符
```

dict 查 str 键时,若 key 与槽内键是同对象(驻留),`is` 短路判等,省 `==`。这让"用驻留 str 作 dict 键"的查找更快。CPython 字节码对 dict str 键查找有此优化(LOAD_ATTR/STORE_SUBSCR 等)。

理解驻留省内存(N 份→1 份共享)与加速(`is` O(1) vs `==` O(n)、dict str 键 is 短路)的量化机制,就理解驻留的价值与适用场景——大量重复省内存、海量比较/字典查找加速。

### 4.5 sys.intern 的实现与生命周期

§2.5 讲了 `sys.intern` 用法,这里讲清其实现与生命周期。

**`sys.intern` 的实现**:`sys.intern(s)` 调用 CPython 的 `PyUnicode_InternInPlace`——查驻留池,有则返回已有对象,无则把 s 加入池返回 s:

```python
# 内部概念
def sys_intern(s):
    if not isinstance(s, str):
        raise TypeError("intern() argument must be str")
    existing = 驻留池.get(s)
    if existing is not None:
        return existing   # 已驻留,返回已有
    驻留池[s] = s         # 加入池
    return s
```

`sys.intern` 保证:对同值字符串(无论何时何处调用),返回同一对象(驻留池共享)。这让"不同地方构造的同值串"经 inter 后合一。

**驻留池的生命周期——不释放**:驻留池里的字符串对象,在解释器生命周期内**不释放**(即使无外部引用),除非解释器退出。这是"驻留不释放"的根源:

```python
import sys
def leak():
    s = sys.intern("temporary long string" * 100)
    # s 出函数后无引用,但因驻留在池里,不释放!
    # 内存泄漏式占用(直到解释器退出)
leak()
# "temporary long string..." 仍在驻留池,占内存
```

`sys.intern` 的字符串进池后,即使原引用消失,池仍持有它,不释放(GC 不回收驻留池对象,除非解释器退出)。这是 `sys.intern` 的代价——驻留的字符串常驻内存。故 `sys.intern` 只用于"长期使用、大量重复"的字符串,不用于一次性串(驻留后泄漏)。

**gc 与驻留**:驻留池是 CPython 内部结构,不受分代 GC 管理(普通引用计数/GC 不清理驻留池)。故驻留字符串的回收依赖解释器退出,而非 GC。这区别于普通 str(引用计数归零即回收)。

**自动驻留 vs 手动驻留的生命周期**:自动驻留的字面量(如 `"hello"`)也在驻留池,但其生命周期与代码对象(CODE Object)绑定,代码对象回收时驻留串可能随之回收(细节依赖实现)。手动 `sys.intern` 的串生命周期更"全局"(池持有)。两者都不像普通 str 那样引用计数回收。

理解 `sys.intern` 的实现(查池/入池返同对象)与生命周期(池持有、不释放、GC 不理),就理解为何"只驻留长期重复串、不驻留一次性串"——驻留的常驻性是其代价,误用致内存泄漏。

### 4.6 驻留与小整数缓存的对比

驻留不是 Python 唯一的对象缓存优化——还有"小整数缓存"(详见《基础数据类型》《变量赋值机制》)。对比两者,加深理解。

**小整数缓存**:CPython 预创建并缓存 -5~256 的 int 对象,所有引用这些值的变量指向同一缓存对象:

```python
a = 256
b = 256
print(a is b)   # True —— 小整数缓存,同一对象
a = 1000000
b = 1000000
print(a is b)   # 不保证 —— 大整数未必缓存,可能 False
```

小整数缓存与字符串驻留类似(值相同共享对象),但:

| 对比 | 字符串驻留                      | 小整数缓存       |
| ---- | ------------------------------- | ---------------- |
| 对象 | str                             | int(-5~256)      |
| 时机 | 字面量编译期 / sys.intern       | 解释器启动预创建 |
| 规则 | 标识符-like 自动驻留,其余不保证 | -5~256 固定缓存  |
| 手动 | sys.intern                      | 无(固定范围)     |
| 释放 | 驻留池不释放                    | 启动到退出常驻   |

两者都是"高频值共享对象省内存/加速 is"的优化,但实现与规则不同。共同点:**都是 CPython 实现优化,非语言保证,不应依赖 `is` 比值**:

```python
# 都不该依赖 is 比值
# a is b  # 对小整数/驻留串可能 True,但大数/长串不保证
# 值相等永远用 ==
```

**共性教训**:无论是字符串驻留还是小整数缓存,`is` 对"值"的 True 都是优化假象。**值相等永远用 `==`,`is` 只判身份/单例**。这是贯穿两者的核心实践——优化是 `is` 偶然为 True 的原因,但代码逻辑不该依赖优化,要用语义正确的 `==`。

理解驻留与小整数缓存的对比(同为对象缓存优化、规则不同、都是实现细节),就理解 Python 对象缓存的整体设计模式,以及"为何 `is` 对值不可靠"的统一根源——缓存的实现依赖性。

---

## 5. 总结

### 5.1 本文内容回顾

- **创建与驻留定义**:创建=字符串怎么来(字面量/构造/拼接等);驻留=值相同字符串共享同一对象的 CPython 优化(省内存、加速 is、加速 dict str 键)。
- **不可变性**:str 不可变,任何"修改"返回新对象;不可变→可哈希→可作 dict 键;不可变让共享(驻留)安全。
- **字面量创建**:单双引号等价(按内容选减少转义);三引号跨多行(docstring/多行文本);四种前缀(r 原始/f 插值/b 字节/u 冗余),可组合(rb/rf)。
- **构造/转换创建**:str() 从各类型(True→'True' 非 '1'、None→'None'、容器→repr 形式);str() vs repr()(显示 vs 代码表示);解码(bytes→str);重复(`*`);拼接(`+`/join);chr(码点→字符)。
- **驻留规则**:标识符-like 字面量(字母/数字/下划线)编译期自动驻留;含空格/符号/长串字面量不保证(依赖环境);运行时构造(`+`/join/str()/解码/f-string)默认不驻留。值相等永远用 ==,不用 is。
- **手动驻留 sys.intern**:强制驻留(含空格/运行时串也能共享同对象);用途(大量重复省内存、海量比较 is 加速);注意(驻留不释放、只驻留长期重复串、is 需双方都驻留)。
- **原理**:紧凑 Unicode 内部表示(1/2/4 字节自适应、哈希缓存);字面量编译期处理(驻留决策 LOAD_CONST、隐式拼接解析期合并零开销)vs 运行时拼接(BINARY_ADD 新对象不驻留);驻留池(全局值→对象映射、标识符-like 编译期主动驻留、含空格/运行时不保证);驻留省内存(N份→1份共享)与加速(is O(1) vs == O(n)、dict str 键 is 短路);sys.intern 实现(查池/入池)与生命周期(池持有不释放、GC 不理、勿驻留一次性串);驻留 vs 小整数缓存对比(同为对象缓存优化、规则不同、均实现细节勿依赖 is)。
- **最佳实践**:值相等用 == 不用 is、单双引号按内容选、多行/docstring 用三引号、反斜杠用 r 前缀、格式化用 f-string、批量拼接用 join、不跨进程依赖 hash/驻留、sys.intern 仅瓶颈场景、str() 注意 True/None/容器表示、调试用 repr 显示用 str、大量修改用 list/StringIO、驻留作常识不依赖。

### 5.2 读完本文你应能掌握

- 说明字符串的创建方式(字面量单双三引号、r/f/b/u 前缀及组合、str() 构造、解码、重复、拼接、chr),按场景选合适方式。
- 说明字符串不可变性及其与可哈希、驻留安全的关系。
- 阐述驻留机制(标识符-like 字面量编译期自动驻留、含空格/运行时构造不保证),解释 `is` 对字符串时 True 时 False 的现象。
- 恪守"字符串值相等永远用 ==,不用 is",说明驻留是 CPython 实现细节不可依赖。
- 用 sys.intern 手动驻留(大量重复省内存、海量比较加速),说明其注意事项(不释放、只驻留长期串、双方驻留 is 才可靠)。
- 区分 str() 与 repr()(显示 vs 代码表示),按用途选用。
- 阐述紧凑 Unicode 内部表示、字面量编译期处理与隐式拼接、驻留池实现、驻留省内存/加速机制、sys.intern 生命周期、驻留与小整数缓存对比等原理。

### 5.3 延伸方向

- **索引与切片**:字符串的索引/切片操作、切片语法,见《索引与切片》。
- **转义字符与原始字符串**:转义序列、r 前缀的完整规则与限制,见《转义字符与跨平台换行》《原始字符串》。
- **拼接性能对比**:`+`/`join`/`%`/format/f-string 的性能与选择,见《字符串拼接性能对比》。
- **f-string 高级格式化**:格式说明符、对齐、调试 `=`、嵌套,见《f-string 高级格式化》。
- **编码与 Unicode**:str↔bytes 的编码解码、Unicode 码点、乱码治理,见《基础数据类型》《显式类型转换》及字符串编码专题。
- **hash 与可哈希类型**:str 的哈希缓存、可哈希性、dict str 键优化,见《hash 与可哈希类型》。
