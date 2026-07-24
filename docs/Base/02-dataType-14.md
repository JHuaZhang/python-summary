---
group:
  title: 【02】基础数据类型和类型系统
  order: 2
order: 14
title: 显式类型转换
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是显式类型转换

显式类型转换(explicit type conversion),又称**类型强制转换**(type casting),是程序员**主动**调用转换函数,把一个值从一种类型转成另一种类型的操作。在 Python 里,显式转换通过各类型的构造函数完成——`int("42")` 把字符串转成整数、`str(3.14)` 把浮点转成字符串、`list((1,2))` 把元组转成列表。转换由你"显式"写出来,语义清晰、意图明确。

```python
# 显式转换:用构造函数主动转类型
age_str = "30"
age = int(age_str)        # str → int,显式
print(age, type(age))     # 30 <class 'int'>
pi = 3.14
pi_str = str(pi)          # float → str,显式
print(pi_str, type(pi_str))  # 3.14 <class 'str'>
```

显式转换是相对**隐式转换**而言的。隐式转换是 Python 在运算时**自动**发生的类型提升——`3 + 0.5` 中 int 自动提升为 float 参与运算,你无需写转换;显式转换则是你**主动调用**转换函数,Python 不会替你做。两者分工:隐式在"运算兼容性"场景自动发生(如 int+float→float),显式在"需要人为指定类型"场景由你调用(如把用户输入的字符串转成数字)。

```python
# 隐式:运算时自动(int 提升为 float)
print(3 + 0.5)        # 3.5(int 3 隐式转 float 3.0)
print(type(3 + 0.5))  # <class 'float'>
# 显式:你主动调
print(int("30"))      # 30(你显式把 str 转 int)
```

为什么需要显式转换?核心场景是**外部数据的类型不可控**:

- **用户输入 / 配置文件**:input()、命令行参数、配置文件读出的都是**字符串**,要参与数值计算必须显式转 `int`/`float`。
- **JSON / 网络数据**:JSON 解析出的数字本是 int/float,但某些场景(如 API 字符串形式传数字)需转回。
- **数据库结果**:ORM 查询结果可能需转特定类型。
- **类型不匹配的运算**:`"count: " + 5` 报错(str 不能 + int),需 `"count: " + str(5)` 显式转。
- **容器类型适配**:函数要 list 但你手里是 tuple/set,需 `list(...)` 转。

```python
# 典型:用户输入是 str,要算术需转
user_input = input("年龄:")    # 输入 "30",类型 str
# age = user_input + 1         # TypeError(str 不能 + int)
age = int(user_input) + 1      # 显式转 int,再运算
```

显式转换在 Python 里无处不在——几乎每个处理外部输入的程序都涉及。掌握各类型间的转换函数、转换规则、失败处理,是写健壮 Python 的基础。

本篇要系统讲透显式类型转换:数字之间的转换(int↔float↔complex,含截断/舍入规则)、数字与字符串的转换(含进制解析)、字符串与字节串的转换(编码/解码)、容器之间的转换(list↔tuple↔set↔dict↔str)、布尔与 None 的转换、转换失败的错误处理,以及显式与隐式的边界。本篇与《隐式类型转换》分工:本篇讲"主动调用的转换",隐式篇讲"运算时自动的提升"。

### 1.2 转换的本质:构造新对象

理解显式转换,先建立一个关键认知:**Python 的显式转换不是"在原对象上改类型",而是"构造一个新对象"**。Python 对象创建后类型固定不可改(参《变量赋值机制》),`int("30")` 不是把字符串 `"30"` 的类型改成 int,而是**用 `"30"` 作为参数,创建一个新的 int 对象 30**。原字符串 `"30"` 不变。

```python
s = "30"
n = int(s)             # 用 s 构造新 int 对象 30
print(s, type(s))      # 30 <class 'str'> —— 原 s 不变,仍是 str
print(n, type(n))      # 30 <class 'int'> —— n 是新 int 对象
print(s is n)          # False(不同对象)
```

`int(s)` 以 `s`("30")为输入,调用 `int` 类的构造逻辑,产出一个全新的 int 对象 30。`s` 本身不受影响。这与 C 的"强制转换"(如 `(int)3.14` 直接 reinterpret 内存)截然不同——Python 转换是"构造",C 转换是"reinterpret/截断"。理解这点,就理解为何 Python 转换可能"失败"(构造不出,如 `int("abc")` 报 ValueError),而 C 的 cast 几乎不失败(只是 reinterpret)。

**转换函数 = 类的构造函数**:Python 的显式转换函数就是各类型的构造函数——`int()`、`float()`、`str()`、`list()`、`tuple()`、`set()`、`dict()`、`bool()`、`complex()`、`bytes()`。调用 `Type(value)` 即"用 value 构造一个 Type 实例",这既是"构造"也是"转换"(若 value 是其他类型)。Python 把"构造"与"转换"统一——`int(3.14)` 是"用 float 3.14 构造 int",`int("42")` 是"用 str '42' 构造 int",`int()` 无参是"构造默认 int 0"。

```python
# 构造=转换的统一
int(3.14)      # float → int(截断为 3)
int("42")      # str → int(解析为 42)
int()          # 无参,构造默认 int 0
int(0b1010)    # int → int(已是 int,返回等价值,实际复用)
```

**转换的接受范围**:每个构造函数接受特定类型的输入做转换,不接受其他类型则报 `TypeError`。如 `int()` 接受 int/float/str(数字串),不接受 list:

```python
int(3.14)        # OK(float→int)
int("42")        # OK(str→int)
# int([1, 2])    # TypeError:int() 不接受 list
# int({"a": 1})  # TypeError
```

各构造函数的接受范围在第 2 章逐一详述。理解"转换=构造新对象、构造函数即转换函数、各有接受范围",就掌握了显式转换的总框架。

### 1.3 显式转换速览

讲清定位前,给出各类转换的速览:

```python
# 数字之间
print(int(3.9))        # 3(float→int,截断)
print(float(5))        # 5.0(int→float)
print(complex(3))      # (3+0j)(int→complex)
print(round(3.9))      # 4(四舍五入,非构造但常用)

# 数字 ↔ 字符串
print(int("42"))       # 42(str→int)
print(int("ff", 16))   # 255(按进制)
print(float("3.14"))   # 3.14(str→float)
print(str(42))         # '42'(int→str)
print(repr(42))        # '42'(repr,代码表示)

# 字符串 ↔ 字节串
print("中文".encode("utf-8"))    # b'\xe4\xb8\xad...' str→bytes(编码)
print(b"abc".decode("ascii"))    # 'abc' bytes→str(解码)

# 容器之间
print(list((1, 2)))         # [1, 2] tuple→list
print(tuple([1, 2]))        # (1, 2) list→tuple
print(set([1, 1, 2]))       # {1, 2} list→set(去重)
print(dict([("a", 1)]))     # {'a': 1} 键值对序列→dict
print(list("abc"))          # ['a', 'b', 'c'] str→list(按字符)
print("".join(['a', 'b']))  # 'ab' list→str(拼接)

# 布尔与 None
print(bool(0))              # False(int→bool)
print(bool([]))             # False(空容器→bool)
print(None)                 # None(None 无转换,是单例)
```

各转换的规则、陷阱在第 2 章展开。重点:数字间转换的截断/舍入、字符串解析的进制与失败、str↔bytes 的编码解码、容器转换的元素处理、bool 的真值规则。

### 1.4 显式转换的安全边界

显式转换是有边界的安全操作——它**不会"假装转换成功"**,转换失败时抛明确异常(`ValueError`/`TypeError`),让你立即知道。这与某些语言"静默转换"(如 JavaScript `parseInt("abc")` 返回 NaN)不同,Python 转换要么成功要么报错,行为确定。

```python
# Python:转换失败明确报错
# int("abc")    # ValueError: invalid literal for int() with base 10: 'abc'
# int("12.5")   # ValueError: 含小数点不能直接转 int
# int([1, 2])   # TypeError: int() 参数不接受 list
# JavaScript 对比:parseInt("abc") → NaN(静默,而非报错)
```

这条"失败即报错"是 Python 转换的安全特性——你不会因"`int(x)` 返回了错误值"而不知情,失败必抛异常。处理外部输入时,这逼你显式 try/except 或预校验,避免脏数据潜伏:

```python
# 处理不可靠输入:try/except 捕获转换失败
def parse_age(s):
    try:
        age = int(s)
        if age < 0:
            raise ValueError("年龄不能负")
        return age
    except ValueError:
        return None       # 转换失败返回 None,而非静默错误
print(parse_age("30"))    # 30
print(parse_age("abc"))   # None(失败优雅处理)
```

理解转换的安全边界(失败必报错),就理解为何显式转换适合"处理外部不可靠数据"——它不会藏错,逼你显式处理失败,写出健壮代码。第 2 章详述各转换的失败情况与处理。

建立这些认知后,后续章节展开各转换的完整规则。

---

## 2. 核心内容

本章详解各类显式转换。每节遵循"规则 → demo → 陷阱 → 场景"展开。数字间截断/舍入、字符串进制解析、编码解码是重点。

### 2.1 数字类型之间的转换

数字三类型(int/float/complex)构成数值塔,相互转换用构造函数。关键规则:浮点→整数是**截断**(向零),不是四舍五入。

**int ↔ float**:

```python
print(int(3.9))        # 3(float→int,向零截断,丢弃小数)
print(int(-3.9))       # -3(向零截断,-3.9 → -3,不是 -4)
print(int(3.0))        # 3
print(float(5))        # 5.0(int→float)
print(float(-2))       # -2.0
```

⚠️ **`int(float)` 是截断(向零),不是四舍五入**:`int(3.9) → 3`(丢 0.9)、`int(-3.9) → -3`(向零,不是 -4)。这是高频陷阱——新手常以为 int 转换会四舍五入。要四舍五入用 `round()`,要向下/向上用 `math.floor`/`math.ceil`:

```python
import math
print(int(3.9))         # 3(截断,向零)
print(round(3.9))       # 4(四舍五入)
print(math.floor(3.9))  # 3(向下,向负无穷)
print(math.ceil(3.9))   # 4(向上,向正无穷)
print(math.trunc(3.9))  # 3(向零截断,等同 int)
# 负数差异明显
print(int(-3.9))        # -3(向零)
print(round(-3.9))      # -4(四舍五入)
print(math.floor(-3.9)) # -4(向负无穷)
```

五种"取整"语义不同:`int`/`math.trunc` 向零、`round` 四舍五入(round 还有银行家舍入,见《float 类型与精度问题》)、`floor` 向负无穷、`ceil` 向正无穷。负数下差异明显(`int(-3.9)=-3` vs `floor(-3.9)=-4`)。明确你要哪种语义再选函数。

**float→int 的精度影响**:float 本身可能有精度误差,`int(float)` 基于其存储值截断:

```python
print(int(2.999999999999999))  # 2(看似 3,实际存储略小于 3,截断为 2?需看具体)
# float 精度边界,转换前注意 float 可能略偏
```

**int/float → complex**:

```python
print(complex(3))        # (3+0j)(int→complex,虚部 0)
print(complex(3.5))      # (3.5+0j)(float→complex)
print(complex(3, 4))     # (3+4j)(两参数:实部,虚部)
```

`complex(x)` 把实数转复数(虚部 0);`complex(real, imag)` 两参数直接构造复数。因 complex 是数值塔顶层,int/float 可无损转 complex(实数 = 虚部0 的复数)。

**complex → int/float 不可直接转**:复数不能直接转回实数(因复数一般无对应实数),需先取实部:

```python
z = 3 + 4j
# int(z)     # TypeError:int() 不接受 complex
# float(z)   # TypeError
print(int(z.real))   # 3(取实部 float,再转 int)
print(z.real)        # 3.0(实部)
print(z.imag)        # 4.0(虚部)
```

复数不能 `int(z)`/`float(z)`(TypeError),需 `.real`/`.imag` 取实虚部(都是 float)再转。这是数值塔的方向性——窄→宽(int→float→complex)易,宽→窄(complex→实数)需显式取分量。

**bool 与数字**(bool 是 int 子类):

```python
print(int(True))       # 1(bool→int,True=1)
print(int(False))      # 0
print(float(True))     # 1.0(bool→float)
print(bool(1))         # True(int→bool,非0为真)
print(bool(0))         # False
print(complex(True))   # (1+0j)
```

bool 是 int 子类,转 int 得 0/1,转 float/complex 同理。数字转 bool 走真值测试(0→False,非0→True)。

### 2.2 数字与字符串的转换

数字↔字符串转换是处理外部输入(json/配置/用户输入)的高频操作。重点:字符串→数字的**进制解析**与**失败处理**。

**字符串 → int(进制解析)**:

```python
print(int("42"))          # 42(默认十进制)
print(int("-5"))          # -5(负号)
print(int("  42  "))      # 42(容忍首尾空白)
print(int("ff", 16))      # 255(十六进制)
print(int("FF", 16))      # 255(大小写不敏感)
print(int("1010", 2))     # 10(二进制)
print(int("17", 8))       # 15(八进制)
print(int("z", 36))       # 35(36 进制,z=35)
# 带 0x/0b/0o 前缀?
print(int("0x1f", 0))     # 31(base=0 让 int 自动识别前缀)
print(int("0b101", 0))    # 5
# int("0x1f", 16)         # ValueError!指定 base 时不能带前缀
print(int("1f", 16))      # 31(不带前缀 + 指定 base)
```

`int(str, base)` 第二参数指定进制(2~36)。注意:

- 默认 base=10(十进制)。
- `base=0` 让 int **自动识别**字面量前缀(`0x`/`0b`/`0o`),按前缀的进制解析。
- 指定具体 base(如 16)时,字符串**不能带前缀**(`int("0x1f", 16)` 报错,要 `int("1f", 16)` 或 `int("0x1f", 0)`)。
- 容忍首尾空白,int(" 42 ")合法。

⚠️ **int 转换失败的常见错误**:

```python
# int("abc")      # ValueError:无法解析
# int("12.5")     # ValueError:含小数点,int 不认
# int("0x1f", 16) # ValueError:带前缀 + 指定 base 冲突
# int("42", 2)    # 42 含 4/2?2 不在二进制→ 等价 ValueError:数字超过进制
```

`int("12.5")` 报错(含小数点 int 不认)——要字符串小数转 int 需先 `float` 再 `int`:`int(float("12.5"))` → 12。`int("42", 2)` 报错(4 不在二进制字符)。这些是字符串转 int 的高频失败点,处理外部输入需 try/except。

**字符串 → float**:

```python
print(float("3.14"))      # 3.14
print(float("-0.5"))      # -0.5
print(float("2e3"))       # 2000.0(科学计数法)
print(float("  3.14  "))  # 3.14(容忍空白)
print(float("inf"))       # inf(特殊值)
print(float("nan"))       # nan
# float("3.14.15")        # ValueError:多个小数点
# float("abc")            # ValueError
```

`float(str)` 解析字符串为浮点,支持小数、科学计数法、inf/nan。失败(非法格式)抛 ValueError。

**int/float → str**:

```python
print(str(42))            # '42'(int→str)
print(str(-5))            # '-5'
print(str(3.14))          # '3.14'
print(str(2e3))           # '2000.0'
print(str(True))          # 'True'(注意:True 不是 '1')
print(repr(42))           # '42'(repr,代码表示)
print(repr("hi"))         # "'hi'"(repr 给带引号的代码表示)
```

`str(x)` 把数字转字符串(显示形式)。`str(True)` 是 `'True'`(不是 `'1'`)。`repr(x)` 给"代码表示"(字符串带引号、可 eval 回来),调试用。

**进制转换函数**(int → 各进制字符串):

```python
print(bin(42))      # '0b101010'(int→二进制字符串,带 0b)
print(oct(42))      # '0o52'(八进制)
print(hex(42))      # '0x2a'(十六进制)
print(bin(42)[2:])  # '101010'(去前缀)
print(format(42, 'b'))   # '101010'(format 不带前缀)
print(format(255, 'x'))  # 'ff'
print(f"{42:#x}")   # '0x2a'(f-string 格式化)
```

`bin`/`oct`/`hex` 把 int 转进制字符串(带前缀),`format`/f-string 不带前缀或用 `#` 加前缀。

**str 与数字拼接的场景**(典型显式转换需求):

```python
count = 5
# "共 " + count + " 个"   # TypeError(str 不能 + int)
print("共 " + str(count) + " 个")     # 共 5 个(显式转 str)
print(f"共 {count} 个")               # 共 5 个(f-string 自动转,更推荐)
```

str 与 int 拼接需显式 `str(count)`,或用 f-string(自动调 str 转换,更简洁)。

### 2.3 字符串与字节串的转换

`str`(文本,Unicode)与 `bytes`(字节序列)是不同类型,通过**编码**(encode,str→bytes)与**解码**(decode,bytes→str)转换。这是处理二进制数据/网络/文件的核心。

**str → bytes(编码)**:

```python
s = "hello"
b = s.encode("utf-8")       # str→bytes,UTF-8 编码
print(b)                    # b'hello'
print(type(b))              # <class 'bytes'>
print(s.encode("ascii"))    # b'hello'(ASCII 编码)
# 中文
print("中文".encode("utf-8"))     # b'\xe4\xb8\xad\xe6\x96\x87'(UTF-8 三字节/汉字)
# "中文".encode("ascii")          # UnicodeEncodeError:ASCII 不能编中文
```

`.encode(encoding)` 把 str 按指定编码转 bytes。UTF-8 是默认且最通用(支持全部 Unicode),ASCII 只支持英文。中文用 ASCII 编码会 `UnicodeEncodeError`(ASCII 范围不够)。

**bytes → str(解码)**:

```python
b = b"hello"
s = b.decode("utf-8")       # bytes→str,UTF-8 解码
print(s)                    # hello
print(b.decode("ascii"))    # hello
# 中文
b_zh = "中文".encode("utf-8")
print(b_zh.decode("utf-8"))    # 中文(用对的编码解码,正常)
# print(b_zh.decode("ascii"))  # UnicodeDecodeError:ASCII 解不开 UTF-8 的中文字节
# 编码不匹配
print(b_zh.decode("gbk"))      # 乱码或 UnicodeDecodeError(GBK 解 UTF-8 字节)
```

`.decode(encoding)` 把 bytes 按指定编码转 str。**编码与解码必须用同一套编码**,否则乱码或 `UnicodeDecodeError`。UTF-8 编码的中文,要用 UTF-8 解码(用 GBK 解会乱码/报错)。

⚠️ **编码不匹配的后果**:

```python
b = "中文".encode("utf-8")
print(b.decode("utf-8"))   # 中文(匹配,正常)
print(b.decode("gbk", errors="replace"))   # 涓枃(GBK 解 UTF-8,乱码)
# b.decode("ascii")        # UnicodeDecodeError(ASCII 解不开)
```

- **乱码**:用错误编码解出"看起来像文本但无意义"的字符(如 GBK 解 UTF-8 中文)。
- **报错**:编码范围不够(`UnicodeDecodeError`,如 ASCII 解非 ASCII 字节)。

**`errors` 参数控制错误处理**:

```python
b = "中文".encode("utf-8")
print(b.decode("ascii", errors="ignore"))    # ''(忽略解不开的字节)
print(b.decode("ascii", errors="replace"))   # '��'(用替换符代替)
print(b.decode("ascii", errors="backslashreplace"))  # '\xe4\xb8\xad...'(转义)
# 默认 errors="strict"(报错)
```

`errors` 控制 encode/decode 遇到无法处理字符的行为:`strict`(默认,报错)、`ignore`(忽略)、`replace`(用替换符)、`backslashreplace`(转义)等。处理不可靠编码数据时用非 strict 避免崩溃。

**默认编码**:Python 3 默认 UTF-8(源码、`.encode()`/`.decode()` 无参时):

```python
"中文".encode()        # 等价 .encode("utf-8"),默认 UTF-8
b"abc".decode()        # 等价 .decode("utf-8")
```

`.encode()`/`.decode()` 无参默认 UTF-8。现代项目统一用 UTF-8,避免编码混乱。

**bytes 构造(其他方式)**:

```python
print(bytes([72, 73]))      # b'HI'(从字节值列表)
print(b"\x48\x49")          # b'HI'(字面量,十六进制)
print(bytes("AB", "ascii")) # b'AB'(从 str + 编码)
```

`bytes()` 可从字节值列表、字面量、或 `bytes(str, encoding)` 构造。encode 是最常用的 str→bytes 方式。

理解 str↔bytes 的编码/解码、编码匹配的必要性、errors 错误处理,是处理文件/网络二进制数据的基础。编码深入见《字符串深度剖析》。

### 2.4 容器类型之间的转换

容器类型(list/tuple/set/dict/str)之间可相互转换,核心是构造函数接受"可迭代对象"或"键值对序列"。这是适配函数接口、去重、改可变性的常用操作。

**list ↔ tuple**(改可变性):

```python
print(list((1, 2, 3)))      # [1, 2, 3] tuple→list(转可变)
print(tuple([1, 2, 3]))     # (1, 2, 3) list→tuple(转不可变)
# tuple 作 dict 键时需 list→tuple(因 list 不可哈希)
```

`list(tuple)` / `tuple(list)` 互转,主要用途是切换可变性——需要可变改 list,需要可哈希(做键/元素)改 tuple。

**list/tuple → set(去重)**:

```python
print(set([1, 1, 2, 3, 3]))   # {1, 2, 3}(去重)
print(set((1, 2, 2)))         # {1, 2}
# set 元素必须可哈希
# set([[1], [2]])             # TypeError:set 元素不可哈希(list 不可哈希)
```

`set(可迭代)` 去重 + 转集合。元素必须可哈希(不可变),含 list 不能转 set。去重后转回 list:`list(set([1,1,2]))` → `[1,2]`(顺序不保证)。

**键值对序列 → dict**:

```python
print(dict([("a", 1), ("b", 2)]))   # {'a': 1, 'b': 2}(键值对列表)
print(dict((("a", 1), ("b", 2))))   # {'a': 1, 'b': 2}(嵌套元组)
# 双元素可迭代,每个元素是 (键, 值) 二元组
print(dict([["a", 1], ["b", 2]]))   # {'a': 1, 'b': 2}(列表二元组也行)
# dict([("a", 1, 2)])               # ValueError:每个元素必须是二元组(长度2)
```

`dict(键值对序列)` 把"键值对的序列"转字典——每个元素必须是二元组(键, 值)。元素长度不是 2 报错。这是从配对数据构造字典的方式。

**dict → list/tuple(取键/值/项)**:

```python
d = {"a": 1, "b": 2}
print(list(d))               # ['a', 'b'](默认取键)
print(list(d.keys()))        # ['a', 'b'](显式取键)
print(list(d.values()))      # [1, 2](取值)
print(list(d.items()))       # [('a', 1), ('b', 2)](取键值对元组)
print(tuple(d.items()))      # (('a', 1), ('b', 2))
```

dict 直接转 list 默认取键;`.keys()`/`.values()`/`.items()` 分别的视图,转 list 取对应。`list(d.items())` 得键值对元组列表——这与 `dict(键值对序列)` 互逆。

**str → list/tuple/set(按字符拆)**:

```python
print(list("abc"))           # ['a', 'b', 'c'](按字符拆)
print(tuple("abc"))          # ('a', 'b', 'c')
print(set("abca"))           # {'a', 'b', 'c'}(去重,顺序不保证)
```

`list(str)` 把字符串按字符拆成列表(每个字符一个元素)。这是"字符串→字符序列"的转换。

**list → str(拼接,要 join)**:

```python
parts = ["a", "b", "c"]
# str(list) 只是表示:['a', 'b', 'c'](不是拼接)
print(str(parts))            # "['a', 'b', 'c']"(repr 形式,非拼接)
# 拼接用 join(元素必须都是 str)
print("".join(parts))        # 'abc'(无分隔拼接)
print(",".join(parts))       # 'a,b,c'(逗号分隔)
# 元素非 str 需先转
nums = [1, 2, 3]
print(",".join(str(n) for n in nums))  # '1,2,3'(先 str 转换)
```

⚠️ **list→str 不是 `str(list)`**:`str([1,2])` 得 `"['a', 'b', 'c']"`(列表的字符串表示,含括号引号),不是拼接。拼接用 `"分隔符".join(列表)`,且元素必须都是 str(非 str 元素要先 `str()` 转换)。这是高频陷阱——`str(list)` 与 `join` 完全不同。

**容器转换的元素类型要求**:

```python
# set/dict 键要求可哈希(不可变)
# set([[1, 2]])              # TypeError(元素 list 不可哈希)
# dict([([1], "v")])         # TypeError(键 list 不可哈希)
print(set([(1, 2), (3, 4)])) # {(1,2),(3,4)} OK(tuple 可哈希)
# 转换保持元素不变,只改变容器
```

set 元素、dict 键必须可哈希(不可变类型)。含 list/dict 的可迭代转 set 会 TypeError(tuple 元素可,因 tuple 不可变)。

**综合容器转换示例**:

```python
# list 去重保序(3.7+ dict 有序)
nums = [3, 1, 4, 1, 5, 9, 2, 6]
unique_ordered = list(dict.fromkeys(nums))   # [3,1,4,5,9,2,6](保序去重)
print(unique_ordered)
# tuple 作 dict 键
grid = {}
grid[(0, 0)] = "原点"   # tuple 键(若用 list 键报错)
# str 拆字符 + 过滤 + 拼回
s = "hello world"
clean = "".join(c for c in s if c != " ")   # 'helloworld'(去空格)
print(clean)
```

容器转换核心:**构造函数接受可迭代/键值对序列**,转 list/tuple/set 接受任意可迭代,转 dict 接受键值对序列,str→list 按字符拆,list→str 用 join(非 str())。

### 2.5 布尔与 None 的转换

**bool() 转换(真值测试)**:`bool(x)` 把任意对象按真值规则转 True/False(详见《bool 类型与短路逻辑》):

```python
print(bool(0))          # False(数值零)
print(bool(0.0))        # False
print(bool(42))         # True(非零)
print(bool(""))         # False(空字符串)
print(bool("hi"))       # True(非空)
print(bool([]))         # False(空容器)
print(bool([0]))        # True(非空容器,元素 0 不影响)
print(bool(None))       # False
print(bool(object()))   # True(默认对象为真)
```

bool 转换走真值测试:False/None/数值零/空容器为 False,其余 True。注意 `[0]` 为 True(容器非空,不看元素)。`bool()` 转换多数场景隐式发生(`if x:` 自动 bool),显式 `bool(x)` 用于"强制取 bool 值"(如 `return bool(result)` 明确返回 bool)。

**数字 ↔ bool**:

```python
print(int(True))        # 1
print(int(False))       # 0
print(float(True))      # 1.0
print(bool(1))          # True
print(bool(0))          # False
print(bool(-1))         # True(负数非零,为真)
# 用 bool 计数(sum([True,True,False]))
print(sum([1 > 0, 2 > 0, 3 < 0]))   # 2(True 当 1 求和)
```

bool 是 int 子类,转 int 得 0/1。数字转 bool 走真值(0→False,非0→True,含负数)。

**None 的"转换"**——None 是单例,无"转成 None"操作(`x = None` 是赋值不是转换)。但其他类型与 None 的关系:

```python
# None 不能转数字/字符串/容器
# int(None)      # TypeError
# str(None)      # 'None'(None 的字符串表示)
print(str(None))        # 'None'
print(repr(None))       # 'None'
print(bool(None))       # False(None 是假值)
# None 作默认值,需先判 None 再转
val = None
n = int(val) if val is not None else 0   # 先判 None,避免 TypeError
```

`str(None)` 得 `'None'`(字符串表示),`bool(None)` 得 False。但 `int(None)`/`float(None)` 报 TypeError(None 无数值意义)。处理"可能 None 的值"转数字,要先 `is not None` 判断再转。

### 2.6 转换失败的处理与综合示例

显式转换失败抛 `ValueError`(格式不符)或 `TypeError`(类型不符),处理外部不可靠数据时必须捕获或预校验。

**转换失败的异常类型**:

```python
# ValueError:格式能理解但无法转换
# int("abc")      # ValueError:invalid literal
# int("12.5")     # ValueError:含小数点
# float("3.14.15")# ValueError:多小数点
# "中文".encode("ascii")  # UnicodeEncodeError(ValueError 子类)

# TypeError:类型根本不接受
# int([1, 2])     # TypeError:int() 不接受 list
# int(None)       # TypeError
# list(42)        # TypeError:int 不可迭代(不能转 list)
```

- **ValueError**:格式问题(字符串无法解析为数字、编码不匹配)。
- **TypeError**:类型不接受(int 不收 list、不可迭代对象转容器)。

处理外部输入的两种模式:

**模式一:try/except(转换+捕获,EAFP)**——推荐:

```python
def parse_int(s):
    """安全解析整数字符串,失败返回 None。"""
    try:
        return int(s)
    except (ValueError, TypeError):
        return None
print(parse_int("42"))     # 42
print(parse_int("abc"))    # None(失败优雅)
print(parse_int(None))     # None(类型不符)
print(parse_int(""))       # None(空串)
```

try/except 是 Python 推荐(EAFP,请求原谅比许可容易)。优点:转换成功路径无额外开销(只在失败时 catch),代码清晰。

**模式二:预校验(LBYL)**——看情况:

```python
def parse_int_lbyl(s):
    # 先校验字符串是否是合法整数
    if isinstance(s, str) and s.lstrip("-").isdigit():
        return int(s)
    return None
print(parse_int_lbyl("42"))   # 42
print(parse_int_lbyl("abc"))  # None
# 缺点:校验逻辑可能与 int 的解析不完全一致(如 " 42 " 有空白 isdigit 假)
# 且成功路径多一次校验开销
```

预校验(LBYL,先查后做)用 `str.isdigit()` 等。缺点:校验逻辑易与实际转换规则不符(如 `isdigit` 不认空白/负号,而 `int` 认),且成功路径有校验开销。故**校验场景优先 try/except**,预校验仅在特殊情况(如批量预过滤)用。

**综合示例:解析用户输入的配置**:

```python
# 模拟从配置文件/用户输入读的字符串,需转各种类型
config_lines = [
    "port=8080",
    "debug=true",
    "ratio=0.85",
    "tags=a,b,c",
    "timeout=",        # 缺值
    "max=-1",
]

def parse_config(lines):
    result = {}
    for line in lines:
        if "=" not in line:
            continue
        key, _, raw = line.partition("=")
        key, raw = key.strip(), raw.strip()
        # 按键名智能转换类型(显式转换 + 失败处理)
        if key == "port":
            try:
                result[key] = int(raw) if raw else 80   # 缺值用默认
            except ValueError:
                result[key] = 80
        elif key == "debug":
            result[key] = raw.lower() in ("true", "1", "yes")   # str→bool
        elif key == "ratio":
            try:
                result[key] = float(raw)
            except ValueError:
                result[key] = 0.0
        elif key == "tags":
            result[key] = raw.split(",") if raw else []   # str→list
        elif key == "max":
            try:
                v = int(raw)
                result[key] = v if v > 0 else None   # 负值转 None
            except ValueError:
                result[key] = None
    return result

cfg = parse_config(config_lines)
print(cfg)
# {'port': 8080, 'debug': True, 'ratio': 0.85, 'tags': ['a','b','c'], 'timeout': 80, 'max': None}
# 各类型显式转换 + 失败兜底,健壮解析
```

这个综合示例展示了显式转换的实战:字符串配置解析成 int(str→int)、bool(str→bool)、float(str→float)、list(str→list,split)、None(无效值),每个转换都 try/except 兜底。这是处理外部配置/输入的典型模式——**显式转换 + 失败兜底**,把不可靠的字符串输入转成程序内确定类型的值。

核心结论:**显式转换用构造函数(int/float/str/list/...),转换=构造新对象,失败抛 ValueError/TypeError,处理外部输入用 try/except 兜底,数字间 int(float) 是截断非四舍五入,str↔bytes 需编码匹配,容器转换 list→str 用 join 非 str()**。

---

## 3. 最佳实践

### 3.1 处理外部输入转换用 try/except,别假设输入合法

```python
# 推荐:try/except 兜底
def to_int(s):
    try: return int(s)
    except (ValueError, TypeError): return None
# 避免:假设合法(脏数据致崩)
# n = int(user_input)   # 输入 "abc" 直接崩
```

外部输入(用户/配置/JSON/网络)类型与格式不可控,转换可能失败。用 try/except 兜底(EAFP),失败返回默认或 None,而非让脏数据致崩。这是健壮代码的基本要求。

### 3.2 int(float) 是截断非四舍五入,按需选取整函数

```python
# 截断(向零)
int(3.9)          # 3
# 四舍五入
round(3.9)        # 4
# 向下/向上
math.floor(3.9)   # 3
math.ceil(3.9)    # 4
```

`int(float)` 向零截断(丢小数),不是四舍五入。明确你要截断/四舍五入/向下/向上,选对应函数,负数下差异明显(`int(-3.9)=-3` vs `floor(-3.9)=-4`)。别误用 int 当四舍五入。

### 3.3 字符串小数转 int 先 float 再 int,不能直接 int

```python
# 正确:先 float 再 int(或 round)
n = int(float("12.5"))     # 12
n2 = round(float("12.5"))  # 12 或 13(银行家)
# 错误:int 不认小数点
# int("12.5")   # ValueError
```

`int("12.5")` 报错(int 不解析小数)。字符串小数转整数:`int(float(s))`(截断)或 `round(float(s))`(四舍五入)。

### 3.4 str↔bytes 编解码必须匹配,统一用 UTF-8

```python
# 推荐:统一 UTF-8
s = "中文"
b = s.encode("utf-8")       # 编码
s2 = b.decode("utf-8")      # 解码(匹配,正常)
# 避免:编码不匹配(乱码或 UnicodeDecodeError)
# b.decode("gbk")   # 用错编码解 UTF-8,乱码
```

str↔bytes 的 encode/decode 必须用同一编码,否则乱码或报错。现代项目统一 UTF-8(默认且通用),避免 ASCII/GBK 等编码混乱。处理不可靠编码数据用 `errors="replace"/"ignore"` 兜底。

### 3.5 list→str 用 join,绝不用 str(list)

```python
# 推荐:join(元素须 str,非 str 先转)
parts = ["a", "b", "c"]
result = ",".join(parts)              # 'a,b,c'
nums_str = ",".join(str(n) for n in [1,2,3])  # '1,2,3'
# 避免:str(list) 是 repr 表示,非拼接
# str(["a","b"])   # "['a', 'b']"(含括号引号)
```

list 拼成字符串用 `"分隔符".join(list)`,元素须都是 str(非 str 先 `str()` 转)。`str(list)` 只给列表的 repr 表示(含 `[]`/引号),不是拼接。这是高频陷阱。

### 3.6 容器转换注意可哈希性(set 元素/dict 键)

```python
# set/dict 键要可哈希(不可变)
set([1, 2, 3])           # OK(int 可哈希)
set([(1,2), (3,4)])      # OK(tuple 可哈希)
# set([[1,2]])           # TypeError(list 不可哈希,不能做 set 元素)
# dict([([1], "v")])     # TypeError(list 不能做 dict 键)
# 需要时先 list→tuple
```

set 元素、dict 键必须可哈希(不可变)。含 list/dict 的可迭代转 set 报 TypeError。需用 list 作键/元素时先转 tuple。

### 3.7 int(str, base) 带 0x/0b 前缀用 base=0,指定 base 不带前缀

```python
# base=0:自动识别前缀
int("0x1f", 0)    # 31(0x 前缀,按十六进制)
int("0b101", 0)   # 5
# 指定 base:不带前缀
int("1f", 16)     # 31
# int("0x1f", 16) # ValueError(指定 base 不能带前缀)
```

`int(str, base)`:带进制前缀(0x/0b/0o)用 `base=0` 自动识别;指定具体 base(如 16)时字符串不能带前缀。混用报 ValueError。

### 3.8 处理"可能 None"的值转数字,先判 None

```python
val = get_value()    # 可能 None
# int(val)           # 若 val 是 None,TypeError
n = int(val) if val is not None else 0   # 先判 None
# 或用 or(val 为 None/'' 用默认)
n = int(val or 0) if val else 0           # 注意 falsy 覆盖
```

None 不能直接转数字(`int(None)` TypeError)。处理"可能 None"的值:先 `is not None` 判断,或用 `val or 默认`(注意 or 会把 0/'' 也当 falsy 替换,若 0 合法用 is None)。

### 3.9 str() vs repr():显示用 str,调试用 repr

```python
print(str("hi"))    # hi(用户友好显示)
print(repr("hi"))   # 'hi'(带引号,代码表示,可 eval)
# 调试/日志用 repr(能区分类型,如 repr(1)='1' vs repr('1')="'1'")
# 显示给用户用 str
```

`str(x)` 给用户友好显示,`repr(x)` 给代码表示(带引号、可 eval,调试能区分类型如 1 vs '1')。日志/调试用 repr(信息全),显示用 str。

### 3.10 去重保序用 dict.fromkeys,不用 set(丢序)

```python
nums = [3, 1, 4, 1, 5]
# 推荐:保序去重(3.7+ dict 有序)
unique = list(dict.fromkeys(nums))   # [3,1,4,5](保序)
# set 去重丢序
unique_unordered = list(set(nums))   # 顺序不保证
```

`set` 去重不保序。需保序去重(3.7+)用 `list(dict.fromkeys(seq))`(利用 dict 有序性)。顺序重要时别用 set 去重。

### 3.11 bool 计数可用 sum(条件),简洁但注意可读性

```python
# 简洁:bool 当 int 求和计数
even_count = sum(n % 2 == 0 for n in nums)
# 显式
even_count = sum(1 for n in nums if n % 2 == 0)
```

`sum(条件 for ...)` 利用 bool 即 int(True=1)计数,简洁。团队不熟用 `sum(1 for ... if 条件)` 更显式。按可读性选。

### 3.12 不要滥用转换,保持类型一致避免不必要转换

```python
# 推荐:保持类型一致,少转换
def process(nums: list[int]) -> int:
    return sum(nums)          # 直接用 int 列表
# 避免:无必要的来回转换
# total = int(str(sum(nums)))   # 多余的 int→str→int
```

转换有开销且易出错,不必要时别转。设计时保持类型一致(如全程用 int 而非 int↔str 来回),减少转换点。转换用于"外部输入/接口适配"等必要场景,不滥用。

---

## 4. 原理

本章讲清显式转换的机制:转换=构造新对象(非改类型)、构造函数的 `__init__`/`__new__` 接受范围、int截断 vs round舍入的算法差异、字符串解析的词法、编码解码的字节级、容器转换的可迭代协议、转换安全的异常设计。这些是"显式转换为何如此"的根基。

### 4.1 转换即构造:__new__ 与 __init__(需理解,详述)

显式转换 `Type(value)` 的本质是调用 `Type` 类的构造机制(`__new__` + `__init__`),用 value 产出一个新的 `Type` 实例。理解这套机制就理解"转换=构造新对象,原对象不变"。

**`Type(value)` 的调用链**:

```python
n = int("42")
# 等价于:
# 1. int.__new__(int, "42") —— 创建新 int 对象(解析 "42" → 值 42)
# 2. int.__init__(新对象) —— 初始化(int 不可变,通常无操作)
# 3. 返回新 int 对象 42
```

`int("42")` 触发 `int.__new__(int, "42")`——`int.__new__` 解析字符串 "42" 为整数值 42,创建并返回新 int 对象。原 "42" 字符串不变(它只是 `__new__` 的输入参数)。这是"转换=构造新对象"的机制根源——`__new__` 读取输入 value,构造一个全新的 Type 实例。

**int 不可变与转换**:`int` 不可变,`__new__` 创建后值固定,`__init__` 基本空操作(不可变类型初始化在 `__new__` 完成)。可变类型(如 list)的 `__init__` 会填充内容:

```python
lst = list((1, 2, 3))
# list.__new__(list) 创建空 list 容器
# list.__init__(lst, (1,2,3)) 把 (1,2,3) 元素填入 lst
# 返回 lst(含 [1,2,3])
```

`list(可迭代)` 的 `__new__` 创建空 list,`__init__` 把可迭代元素填入。容器转换是"创建新容器 + 填充元素",原可迭代不变。

**构造函数的接受范围由 `__new__`/`__init__` 决定**:每个类型的 `__new__`/`__init__` 定义接受哪些类型:

```python
# int.__new__ 接受:int/float/str(数字串)
int(42)        # int→int(__new__ 直接返回等价 int)
int(3.14)      # float→int(__new__ 截断)
int("42")      # str→int(__new__ 解析字符串)
# int([1,2])   # TypeError:int.__new__ 不接受 list
```

`int.__new__` 知道处理 int/float/str,不接受 list(报 TypeError)。各类型的接受范围是其 `__new__`/`__init__` 实现决定——这就解释了"为何 int 收 str 不收 list、list 收可迭代、dict 收键值对序列"。

理解转换=构造(`__new__`+`__init__` 产新对象、原对象不变、接受范围由构造方法决定),就理解显式转换的全部行为根源:它不是"改类型",是"用 value 作原料构造新对象",失败因"原料不被接受/无法解析"。

### 4.2 int 截断与 round 舍入的算法差异

§2.1 讲了 int(float) 截断、round 四舍五入,这里讲清二者算法差异的根源。

**int(float) 的截断算法**:`int.__new__(int, float_value)` 对 float 取整是**向零截断**(truncate toward zero)——丢弃小数部分,保留整数部分:

```
int(3.9):  3.9 的整数部分是 3 → 3
int(-3.9): -3.9 的整数部分是 -3(向零) → -3
# 实现:取 float 的整数部分,丢弃小数(向零方向)
```

向零截断:正数向下取整(3.9→3)、负数向上取整(-3.9→-3),都朝零方向。这是 C 的 `(int)3.9` 同款行为(直接取整数部分)。

**round 的舍入算法**:`round(x)` 用**银行家舍入**(round half to even)——.5 时向最近偶数舍入:

```
round(2.5):  2.5 在 2 和 3 间,.5 向偶数 → 2
round(3.5):  3.5 在 3 和 4 间,.5 向偶数 → 4
round(3.9):  非 .5,正常四舍五入 → 4
```

round 的"银行家"规则:.5 时向最近偶数(2.5→2,3.5→4),避免长期系统性偏差(总向上会偏正)。但配合 float 精度(round(2.675,2)=2.67 因 2.675 实际略小),round 行为受精度干扰。

**为何 int 截断而非四舍五入?** 设计选择。int(float) 的语义是"取整数部分"(截断,确定性、与 C 一致),round 的语义是"数学舍入"(四舍五入/银行家)。Python 让 int 截断、round 舍入,两者分工明确——int 是"丢弃小数",round 是"近似舍入"。理解这分工,就理解为何 `int(3.9)=3` 而 `round(3.9)=4`——不同算法,不同语义,按需选。

**math.floor/ceil 的算法**:floor 向负无穷(3.9→3,-3.9→-4),ceil 向正无穷(3.9→4,-3.9→-3)。它们是数学上的 floor/ceil 函数,方向固定(不随正负变),与 int(向零)、round(偶数)都不同。四种取整(int 向零、round 偶数、floor 负无穷、ceil 正无穷)各有数学定义,Python 按定义实现,适用不同场景。

### 4.3 字符串解析的词法机制

`int("42")`、`float("3.14")` 把字符串解析为数字,这背后是词法解析——`__new__` 扫描字符串,按数字文法解析。

**int 解析的词法**:`int.__new__(int, str, base)` 扫描字符串:

1. 跳过首尾空白(`int(" 42 ")` 合法)。
2. 可选符号(`+`/`-`)。
3. 按 base 解析数字字符(0-9, a-z/A-Z 对应各进制)。
4. 若遇非法字符(如 "42" 中混字母非合法进制字符)→ ValueError。
5. 整串必须完整解析(不能 "42abc" 部分解析)。

```python
int("  -42  ")   # 跳空白 + 负号 + 解析 42 → -42
int("ff", 16)    # 按 16 进制解析 f/f → 255
# int("42x")     # ValueError:整串含非数字字符 'x'
# int("")        # ValueError:空串
```

int 解析要求"整串是合法数字字面量"(允许首尾空白、符号),部分解析报错。base 决定合法字符集(2 进制只 0/1,16 进制 0-9a-f)。

**float 解析的词法**:类似,但接受小数点、指数:

1. 跳空白、可选符号。
2. 数字部分(可含一个小数点)、可选指数(e/E + 可选符号 + 数字)。
3. 特殊值:inf/nan(及大小写变体)。
4. 非法格式 → ValueError。

```python
float("3.14")    # 小数
float("2e3")     # 指数
float("-0.5")    # 负数
float("inf")     # 特殊值
# float("3.14.15")  # ValueError:多小数点
# float("3e")       # ValueError:指数后无数
```

float 解析按"可选符号 + 数字.数字 + 可选指数"文法,多小数点/缺指数数字等格式错报 ValueError。

**为什么 int("12.5") 报错**:int 的词法不接受小数点(int 是整数,文法无小数点)。`"12.5"` 含小数点,不在 int 文法内,ValueError。要解析小数串需 float 词法(float("12.5")),再转 int。这是文法决定接受范围——int 文法只整数,float 文法含小数。

**base=0 的前缀识别**:`int(str, 0)` 时,词法分析器识别 `0x`/`0b`/`0o` 前缀,按前缀的进制解析:

```python
int("0x1f", 0)   # 识别 0x 前缀 → 按 16 进制解析 "1f" → 31
int("0b101", 0)  # 0b → 二进制 → 5
int("42", 0)     # 无前缀 → 十进制 → 42
```

base=0 让词法器按"字面量前缀规则"(与源码字面量一致)解析,自动判断进制。这是 base=0 的词法机制——复用源码字面量的进制前缀文法。

理解字符串解析的词法(int/float 各有文法、整串解析、base 决定字符集、base=0 识别前缀),就理解"转换为何接受某些格式拒绝某些"——文法决定,非任意。

### 4.4 编码解码的字节级机制

§2.3 讲了 str↔bytes 编码解码,这里讲清其字节级机制。

**编码(encode)——str→bytes**:str 是 Unicode 字符序列(每个字符有码点),encode 把每个字符按编码规则转成字节序列:

```python
"ABC".encode("ascii")    # b'ABC'(ASCII:每字符1字节,A=0x41,B=0x42,C=0x43)
"中文".encode("utf-8")    # b'\xe4\xb8\xad\xe6\x96\x87'(UTF-8:中文每字3字节)
# '中' 码点 U+4E2D,UTF-8 编码为 3 字节 e4 b8 ad
# '文' 码点 U+6587,UTF-8 编码为 3 字节 e6 96 87
```

不同编码把同一字符转不同字节:ASCII 用 1 字节(只支持 0-127 码点),UTF-8 用 1-4 字节(变长,兼容 ASCII 且支持全 Unicode),UTF-16/UTF-32 用 2/4 字节。中文在 UTF-8 是 3 字节、GBK 是 2 字节。encode 按编码规则映射字符→字节。

**解码(decode)——bytes→str**:decode 把字节序列按编码规则解析回字符:

```python
b'\xe4\xb8\xad\xe6\x96\x87'.decode("utf-8")   # '中文'(按 UTF-8 解析字节→字符)
# e4 b8 ad 三字节按 UTF-8 规则 → 字符 '中'
# e6 96 87 → '文'
```

decode 按"编码规则"把字节分组映射回字符。**关键:编解码必须用同一规则**——UTF-8 编码的字节,要 UTF-8 解码(Unicode 码点正确还原);用 GBK 解 UTF-8 字节,字节分组与 GBK 规则不符,解出错误字符(乱码)或解不开(报错)。

**编码不匹配的两种结果**:

```python
b = "中文".encode("utf-8")   # UTF-8 字节 e4 b8 ad e6 96 87(6 字节)
b.decode("utf-8")    # 中文(匹配,正确)
b.decode("gbk")      # 涓枃(GBK 按 2 字节/字解析 6 字节成 3 字符,但映射错,乱码)
# b.decode("ascii")  # UnicodeDecodeError(ASCII 不认 >0x7f 的字节)
```

- **乱码**:用错误编码解出"合法但错误"的字符(GBK 把 UTF-8 字节按 2 字节分组,解出 GBK 字符表里对应的错字)。
- **报错**:编码范围不够(ASCII 只认 0-127,UTF-8 中文字节 >127 解不开,UnicodeDecodeError)。

**errors 参数的错误处理**:decode 遇到解不开的字节,按 errors 处理:

```python
b"ab\xff".decode("ascii", errors="ignore")     # 'ab'(忽略 0xff)
b"ab\xff".decode("ascii", errors="replace")    # 'ab�'(用替换符 U+FFFD)
b"ab\xff".decode("ascii", errors="backslashreplace")  # 'ab\\xff'(转义)
# errors="strict"(默认):报 UnicodeDecodeError
```

errors 控制"解不开字节"的行为:strict 报错、ignore 丢弃、replace 替换符、backslashreplace 转义。处理不可靠编码数据(如损坏的网页)用非 strict 避免崩溃,但会损失信息(忽略/替换不还原原字符)。

**编码与字符集**:编码(encoding,如 UTF-8/GBK)定义"字符↔字节"的映射规则。理解编码是字节级的——字符在内存是码点(统一),存盘/传输是字节(按编码),编解码是码点↔字节的转换。深入见《字符串深度剖析》。

### 4.5 容器转换的可迭代协议与异常设计

容器转换(list/tuple/set/dict 接受可迭代)背后是 Python 的**可迭代协议**(iterator protocol)——`__new__`/`__init__` 调用输入的 `__iter__` 取元素。

**可迭代协议**:list/tuple/set 转换要求输入是"可迭代对象"(实现 `__iter__`):

```python
list((1, 2, 3))   # 元组可迭代(有 __iter__)→ list 取其元素
list("abc")       # 字符串可迭代(按字符)→ ['a','b','c']
list(range(3))    # range 可迭代 → [0, 1, 2]
# list(42)        # TypeError:int 不可迭代(无 __iter__),list 无法取元素
```

`list(x)` 调用 `x.__iter__()` 获取迭代器,逐个取元素填入新 list。int 不可迭代(无 `__iter__`),故 `list(42)` TypeError。这是"容器转换要求可迭代"的协议根源——通过 `__iter__` 取元素。

**set 转换的元素可哈希要求**:set 不仅是可迭代,元素还须可哈希(因 set 内部用哈希表存):

```python
set([1, 2, 3])        # OK(int 元素可哈希)
# set([[1, 2]])       # TypeError:元素 [1,2] 是 list 不可哈希
# set 转换时,对每个元素 hash(),list 无 __hash__ 报错
```

set 转换时,对每个元素调 `hash(elem)`(放哈希表),元素无 `__hash__`(list/dict)报 TypeError。这是 set/dict 键要求可哈希的机制。

**dict 转换的键值对协议**:dict 接受"键值对序列"——每个元素须是二元组:

```python
dict([("a", 1), ("b", 2)])   # OK(每元素是 2 元组)
# dict([("a", 1, 2)])        # ValueError:每元素必须 2 元组(不是 3)
dict({"a": 1})               # dict→dict(复制,接受 dict 本身)
```

dict 转换时,对每个元素"解包为 (键, 值)"——元素长度非 2 报 ValueError(无法解包成键值)。这是 dict 转换要求"键值对序列"的机制。

**转换安全——异常设计**:Python 转换失败抛明确异常(ValueError/TypeError),不静默返回错误值,这是有意设计:

```python
int("abc")      # ValueError(格式错,不返回 0 或 NaN)
list(42)        # TypeError(类型错,不返回空 list)
```

对比 JavaScript(`parseInt("abc")` 返回 NaN、`Number([])` 返回 0 等静默),Python 选择"失败必报错"。设计哲学:**显式转换应确定成功或明确失败,不模糊**——这让 bug 早暴露(转换失败立即知道,而非脏数据潜伏)。处理不可靠输入时,你用 try/except 显式决定失败行为(返回默认/None),而非转换函数静默决定。这是 Python 类型转换的安全设计——确定性优先于"宽容"。

理解容器转换的协议(可迭代 `__iter__`、可哈希 `__hash__`、键值对解包)与异常设计(失败必报错、不静默),就理解"转换接受什么、拒绝什么、为何不静默"的机制根源。

---

## 5. 总结

### 5.1 本文内容回顾

- **显式转换定义**:程序员主动调用构造函数把值转类型(int("42") → int);相对隐式转换(运算自动提升);转换=构造新对象(原对象不变),构造函数即转换函数,各有接受范围;失败抛 ValueError/TypeError 不静默。
- **数字间转换**:int(float) 向零截断(非四舍五入);int/float↔complex(int/float→complex 易,complex→实数需取 .real);bool 是 int 子类(True=1)。五种取整(int/round/floor/ceil/trunc)语义不同。
- **数字↔字符串**:int(str,base) 进制解析(base=0 识别前缀、指定 base 不带前缀、容忍空白);float(str) 支持小数/指数/inf/nan;int("12.5") 报错(需先 float);str(int) / repr;bin/oct/hex/format 进制转串。
- **字符串↔字节串**:encode(str→bytes)/decode(bytes→str) 按编码;UTF-8 默认通用;编码必须匹配否则乱码/UnicodeDecodeError;errors(strict/ignore/replace)控制错误处理。
- **容器间转换**:list↔tuple(改可变性)、set(去重要可哈希)、dict(键值对序列,每元素二元组)、str→list(按字符拆)、list→str 用 join(非 str())、容器转换走可迭代协议。
- **bool/None**:bool() 真值测试(0/空→False);None 单例无转换(str(None)='None',int(None) TypeError);可能 None 转 数字先判 None。
- **失败处理**:ValueError(格式错)/TypeError(类型错);try/except(EAFP 推荐)兜底外部输入;预校验(LBYL)易与转换规则不符。
- **原理**:转换=构造(`__new__`+`__init__` 产新对象、原对象不变、接受范围由构造方法决定);int 截断(向零,取整数部分)vs round 银行家舍入(向偶数)的算法差异;字符串解析词法(int/float 文法、整串解析、base 决定字符集、base=0 识别前缀);编码解码字节级(字符码点↔字节按编码规则、不匹配乱码/报错、errors 处理);容器转换可迭代协议(`__iter__` 取元素、set/dict 需可哈希、dict 键值对解包);转换安全设计(失败必报错、不静默,确定性优先)。
- **最佳实践**:外部输入 try/except 兜底、int(float) 截断非四舍五入、小数串先 float 再 int、编解码匹配统一 UTF-8、list→str 用 join、注意可哈希性、int 前缀 base=0、None 先判、str/repr 区分、去重保序用 dict.fromkeys、bool 计数、不滥用转换保持类型一致。

### 5.2 读完本文你应能掌握

- 说明显式转换的定义与"转换=构造新对象、构造函数即转换函数"的本质,区分显式与隐式转换。
- 进行数字间转换(int↔float↔complex),说明 int(float) 截断 vs round 舍入的差异,选用正确取整函数。
- 用 int(str,base)/float(str) 解析字符串为数字(含进制、base=0 前缀识别),处理解析失败。
- 用 bin/oct/hex/format/str 进行数字转字符串,说明 str() vs repr()。
- 用 encode/decode 进行 str↔bytes 转换,说明编码匹配的必要性,用 errors 处理错误。
- 进行容器间转换(list↔tuple↔set↔dict↔str),说明 list→str 用 join,容器转换的可哈希/键值对要求。
- 用 bool() 真值转换,处理 None 与数字转换(先判 None)。
- 用 try/except 处理转换失败(ValueError/TypeError),解析外部输入。
- 阐述转换=构造机制、int/round 算法差异、字符串解析词法、编码解码字节级、容器可迭代协议、转换安全设计等原理。

### 5.3 延伸方向

- **隐式类型转换**:运算时自动的类型提升(int→float、bool→int)、运算符重载与类型,见《隐式类型转换》。
- **各类型专题**:`int` 多进制、`float` 精度(Decimal 替代)、`complex`、`str` 编码深水、`bool`/`None`,见对应专题。
- **字符串深度剖析**:Unicode/码点、编码(UTF-8/16/32/GBK)完整机制、乱码治理,见《字符串深度剖析》大章节。
- **数据校验/解析**:JSON 解析、配置文件解析、Pydantic 数据校验(注解驱动类型转换),见标准库与第三方库专题。
- **类型注解与转换**:注解描述期望类型、运行时类型转换(cast/isinstance)、与显式构造转换的关系,见《类型注解基础》《类型注解运行时行为》。
