---
group:
  title: 【02】基础数据类型和类型系统
  order: 2
order: 1
title: 基础数据类型汇总
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是基础数据类型

数据类型(data type)是编程语言对一个值所能进行的操作、所占内存方式、以及可取值范围的归类。Python 把"一切皆对象"贯彻到底——每个值都是一个对象,而对象所属的"类(class)"就是它的类型。`10` 是一个 `int` 对象、`3.14` 是一个 `float` 对象、`"hi"` 是一个 `str` 对象。类型决定了这个对象能做什么:例如 `int` 能做整除 `//`,而 `str` 不能;`str` 能做 `.upper()`,而 `int` 不能。

与 C/Java 这类静态类型语言不同,Python 是**动态类型**的:变量没有类型,对象才有类型。同一个名字可以先后贴到不同类型的对象上——`x = 10` 之后 `x = "hello"` 完全合法,因为 `x` 只是名字空间里的一个引用标签,类型随着它指向的对象走。这一点与《变量赋值机制》讲的名字标签模型是一脉相承的。

所谓"基础数据类型",指的是 Python **语言内置(built-in)、开箱即用**的一组核心类型,无需 import 任何模块即可直接使用。它们构成了日常编码 90% 以上场景的数据载体,也是后续所有高级类型(标准库类型、第三方类型、自定义类)的基石。本篇要系统梳理的内置类型包括:

- **数字类**:`int`(整数)、`float`(浮点数)、`complex`(复数)、`bool`(布尔,本质是 int 的子类)。
- **序列类**:`str`(字符串,不可变)、`list`(列表,可变)、`tuple`(元组,不可变)。
- **映射类**:`dict`(字典,键值对,可变)。
- **集合类**:`set`(集合,可变)、`frozenset`(冻结集合,不可变)。
- **空值类**:`NoneType`,只有单例 `None`,表示"没有值"。

掌握基础数据类型,核心是掌握两件事:**每个类型能存什么、能做什么操作**,以及**类型之间如何相互转换**。本篇作为整个"基础数据类型与类型系统"大章节的入门,负责给出全貌与每个类型的核心用法;至于各类型的深度细节(如 `int` 的位运算、`float` 的精度问题、`str` 的编码、`dict` 的底层哈希表),会在本大章节后续的专题笔记中逐一展开。

### 1.2 类型与对象的关系:三件套

在进入具体类型前,先建立"如何观察一个对象类型"的统一工具——`type()`、`isinstance()`、`id()`。每一个对象都有三个根本属性:**身份(identity)**、**类型(type)**、**值(value)**。

- `type(obj)`:返回对象的类型(即它的类)。
- `isinstance(obj, cls)`:判断对象是否属于某类型(含父类/子类关系),比 `type(obj) is cls` 更稳妥,是判断类型的首选方式。
- `id(obj)`:返回对象的身份(内存地址),用于判断"是不是同一个对象"。

```python
x = 10
print(type(x))          # <class 'int'>
print(isinstance(x, int))  # True
print(id(x))            # 某个内存地址,如 4305234992

s = "hello"
print(type(s))          # <class 'str'>
print(isinstance(s, str))  # True
```

为什么强调用 `isinstance` 而非 `type(x) is int`?因为 Python 有继承关系。`bool` 是 `int` 的子类(后面会讲),所以 `isinstance(True, int)` 也会返回 `True`,这正是我们期望的"True 也是一种 int"的语义;但 `type(True) is int` 返回 `False`,因为 `True` 的精确类型是 `bool`。判断类型时几乎总是该用 `isinstance`,它尊重继承链。

另一个常被混淆的点是:类型本身也是对象。

```python
print(type(int))     # <class 'type'>,int 这个类自身的类型是 type
print(type(str))     # <class 'type'>
```

"类"本身也是一个对象,它的类型是 `type`(元类,metaclass)。这一点现在只需有个印象,等学到面向对象时会彻底讲清;此处建立的认知是——**值有类型,类型本身也是对象**。

### 1.3 内置类型速查表

下表给出全部基础内置类型的速览,便于建立全局印象。可变/不可变这一列尤其重要,它决定了类型能否作为 `dict` 的键、能否被 `set` 元素引用、以及共享引用时是否会有副作用(详见《变量赋值机制》)。

| 类型 | 字面量示例 | 用途 | 可变性 | 可哈希(可做 dict 键) |
|------|-----------|------|--------|----------------------|
| `int` | `10` `-5` `0` | 整数 | 不可变 | 是 |
| `float` | `3.14` `-0.5` `2e3` | 浮点数 | 不可变 | 是 |
| `complex` | `1+2j` | 复数 | 不可变 | 是 |
| `bool` | `True` `False` | 布尔值 | 不可变 | 是 |
| `str` | `"abc"` `'x'` | 字符串 | 不可变 | 是 |
| `list` | `[1,2,3]` | 有序可变序列 | 可变 | 否 |
| `tuple` | `(1,2,3)` | 有序不可变序列 | 不可变 | 是(若元素都可哈希) |
| `dict` | `{"a":1}` | 键值映射 | 可变 | 否 |
| `set` | `{1,2,3}` | 无序唯一集合 | 可变 | 否 |
| `frozenset` | `frozenset({1,2})` | 不可变集合 | 不可变 | 是 |
| `NoneType` | `None` | 空值/无值 | 不可变 | 是 |

可哈希性与可变性高度关联:不可变对象的值在生命周期内不变,因此哈希值稳定,可做 `dict` 的键和 `set` 的元素;可变对象的内容随时可改,哈希值不稳,故不可哈希。这条规则贯穿后续所有的容器使用。

### 1.4 动态类型:变量无类型,对象有类型

再次点明动态类型这一特性,因为它会持续影响你写每一行 Python:

```python
x = 10               # x 此刻指向 int
print(type(x))       # <class 'int'>
x = "hello"          # x 改指 str,完全合法
print(type(x))       # <class 'str'>
x = [1, 2, 3]        # x 改指 list
print(type(x))       # <class 'list'>
```

`x` 本身没有类型,它只是个名字。类型始终属于名字当前所指的对象。这意味着你**不需要(也无法)在赋值时声明类型**——这是和 C/Java 最大的书写差异之一。

需要注意的是,动态类型带来灵活,也带来风险:你可能在期望 `int` 的地方意外传入了 `str`,直到运行时才报错。Python 3.5+ 引入的**类型注解(type hints)**可以缓解这个问题,它让你可以标注期望的类型,再用 `mypy` 等工具做静态检查——这属于"类型系统"专题(本大章节第 9~13 篇),本篇聚焦于运行时实际存在的基础类型本身。

---

## 2. 核心内容

本章逐一讲解各内置类型的核心用法。每个类型遵循"它能存什么 → 字面量怎么写 → 关键操作 → 典型场景"的顺序展开。序列、映射、集合类型的深水区(切片、推导式、哈希表原理)会在各自专题笔记详述,这里只讲足够日常使用、且能体现类型特性的内容。

### 2.1 数字类型:int

`int` 表示整数,没有大小上限。这是 Python 与多数语言的一个显著差异——C 的 `int` 是 32 位有范围(约 ±21 亿),Java 的 `long` 也只有 64 位;而 Python 的 `int` 是**任意精度**的,只要内存够,你可以算任意大的整数。

```python
a = 10
b = -5
big = 10 ** 100          # 10 的 100 次方,一个 101 位的整数,完全不溢出
print(big)               # 1000000000...0(共 101 位)
print(type(big))         # <class 'int'>
```

整数字面量支持多种进制,用前缀区分:

```python
print(0b1010)      # 二进制,前缀 0b → 10
print(0o17)        # 八进制,前缀 0o → 15
print(0xFF)        # 十六进制,前缀 0x → 255
print(1_000_000)   # 下划线分隔,提高可读性 → 1000000(Python 3.6+)
```

下划线分隔符 `1_000_000` 是个实用的小特性,在写大数字(金额、时间戳)时显著提升可读性,等价于 `1000000`。

`int` 的常用运算:

```python
print(7 / 2)       # 3.5   —— / 永远返回 float,即使能整除
print(7 // 2)      # 3     —— // 整除,丢弃小数部分
print(7 % 2)       # 1     —— % 取余
print(2 ** 10)     # 1024  —— ** 幂运算
print(divmod(7, 2)) # (3, 1) —— 同时返回商和余数
```

其中 `/` 与 `//` 的区别是 Python 新手常踩的点:`/` 是"真除法",无论操作数是否整数都返回 `float`;`//` 是"地板除",向下取整。注意负数的地板除是向**负无穷**取整,不是向零:

```python
print(-7 // 2)     # -4(不是 -3!)向负无穷取整
print(-7 % 2)      # 1(余数与除数同号)
```

这条规则与 C/Java 的"向零取整"不同,它会带来一些"反直觉"的结果,但对数学一致性(余数总与除数同号、`a == (a//b)*b + a%b` 恒成立)是有意为之的。日期、分页计算涉及负数时要特别注意。

**场景**:计数、索引、位运算标志、金额(整分表示法,把金额存成"分"而非"元",规避浮点精度问题)。

### 2.2 数字类型:float

`float` 表示浮点数(小数),底层是 IEEE 754 双精度(64 位)。它有范围与精度限制——这是 `float` 最重要的特性,也是它极易踩坑的地方。浮点数无法精确表示大多数十进制小数,会产生微小的舍入误差。

```python
print(0.1 + 0.2)          # 0.30000000000000004 —— 不是 0.3!
print(0.1 + 0.2 == 0.3)   # False
```

这并非 Python 的 bug,而是所有 IEEE 754 浮点实现(C/Java/JS 无一例外)的共性:`0.1`、`0.2` 在二进制下是无限循环小数,存储时被截断,累加后暴露误差。

`float` 字面量多种写法:

```python
print(3.14)       # 3.14
print(.5)         # 0.5(整数部分可省略)
print(2e3)        # 2000.0(科学计数法,2 × 10³)
print(1.5e-3)     # 0.0015
print(float('inf'))  # inf,正无穷
print(float('nan'))  # nan,非数(Not a Number)
```

常见运算:

```python
print(round(3.14159, 2))   # 3.14 —— 四舍五入到 2 位
print(round(2.5))           # 2!银行家舍入,不是 3
print(abs(-3.5))            # 3.5 —— 绝对值
print(3.5 // 2)            # 1.0 —— float 参与的 // 返回 float
```

`round` 有个反直觉细节:它采用"银行家舍入"(round half to even),即 `.5` 时向**最近的偶数**舍入,而非向上。`round(2.5) → 2`、`round(3.5) → 4`。这是为了在大量数据上避免系统性偏差,但和很多人"四舍五入"的直觉冲突,处理金额时容易出错。

**如何规避精度问题**——这是 `float` 的头等实践要点:

```python
# 金额计算:用 int 存"分",而非 float 存"元" —— 推荐
total_cents = 199 + 299 + 499   # 用整数分,精确无误
print(total_cents / 100)        # 仅在展示时转回元

# 或用标准库 decimal 做精确十进制运算
from decimal import Decimal
print(Decimal('0.1') + Decimal('0.2'))   # Decimal('0.3'),精确
```

`float` 的精度、`Decimal` 的使用、`nan`/`inf` 的行为,会在《float 类型与精度问题》专题详细展开。本篇只需建立"`float` 有精度误差,金额等精度敏感场景要规避"的认知。

### 2.3 数字类型:complex

`complex` 表示复数,形式为 `a + bj`,其中 `a` 是实部、`b` 是虚部,`j` 是虚数单位。复数在日常业务编码中较少见,但在信号处理、电气工程、量子计算、科学计算领域是基础数据类型,Python 把它作为内置类型原生支持。

```python
z = 3 + 4j
print(type(z))      # <class 'complex'>
print(z.real)       # 3.0 —— 实部(总是 float)
print(z.imag)       # 4.0 —— 虚部
print(z.conjugate())  # (3-4j) —— 共轭复数
print(abs(z))       # 5.0 —— 模长 √(3²+4²)
```

复数的实部和虚部都是 `float`,即便你写整数 `3`,`.real` 也返回 `3.0`。支持算术运算,符合复数运算法则:

```python
print((1 + 2j) + (3 - 1j))   # (4+1j)
print((1 + 2j) * (3 - 1j))   # (5+5j)
```

**场景**:科学计算(NumPy 的 `complex64`/`complex128`)、傅里叶变换、交流电路分析。一般业务代码用不到,知道它能用、字面量怎么写即可,细节会在《complex 复数类型》专题展开。

### 2.4 布尔类型:bool

`bool` 表示真值,只有两个实例:`True` 和 `False`(注意首字母大写,`true`/`false` 是错的)。`bool` 是 `int` 的子类,`True` 等于 1、`False` 等于 0,这是理解许多 Python 行为的钥匙。

```python
print(type(True))             # <class 'bool'>
print(isinstance(True, int))  # True —— bool 是 int 子类
print(True + True)            # 2 —— 可当整数参与运算
print(True == 1)              # True
print(False == 0)             # True
```

因为 `bool` 继承 `int`,`True + 1` 之类的运算合法,常用于"计数满足条件的项"。但这种写法可读性一般,多数场景应用 `sum()` 配合生成器。

**真相值测试(truthiness)**:任何对象都能在 `if`/`while`/`and`/`or` 等布尔语境中被判定真假。规则是:以下值"为假"(falsy),其余全部"为真"(truthy):

- 常量:`False`、`None`。
- 数值零:`0`、`0.0`、`0j`。
- 空容器:`''`、`[]`、`{}`、`()`、`set()`、`frozenset()`。

```python
print(bool(0))        # False
print(bool(0.0))      # False
print(bool(''))       # False —— 空字符串
print(bool([]))       # False —— 空列表
print(bool('hello'))  # True
print(bool([0]))      # True!非空,哪怕元素是 0
print(bool(0.1))      # True
```

特别注意 `bool([0])` 是 `True`:只要容器非空就为真,不看元素内容。这是新手常误以为"`[0]` 含 0 应该是 False"的正确答案——容器只看空/非空。

**显式构造 bool**:

```python
print(bool(42))       # True
print(bool(""))       # False
print(bool([1, 2]))   # True
```

`bool(x)` 等价于"在布尔语境里判 x 真假"。`and`/`or` 是短路运算,返回的是操作数本身而非 bool,细节会在《bool 类型与短路逻辑》专题展开。

### 2.5 字符串类型:str

`str` 表示不可变的 Unicode 字符序列。它是 Python 中使用最频繁的类型之一——日志、用户输入、配置、JSON、HTML、SQL,几乎所有文本都是 `str`。`str` 不可变,任何"修改"操作都返回新字符串。

字面量四种写法:

```python
s1 = 'hello'           # 单引号
s2 = "hello"           # 双引号(与单引号等价,按需选用以避免转义)
s3 = '''多行
字符串'''              # 三引号,可跨行
s4 = """also
multiline"""           # 三双引号,同上
s5 = 'it\'s'           # 转义引号;或直接 "it's" 更清晰
s6 = r'C:\new\folder'  # 原始字符串,反斜杠不转义 → C:\new\folder
s7 = f'值是 {s1}'       # f-string(Python 3.6+),插值
```

单引号和双引号在 Python 里完全等价,选择哪个取决于字符串里含哪种引号以避免转义——含单引号用双引号包、含双引号用单引号包。原始字符串 `r''` 在写正则、Windows 路径时非常实用,`\n` 不被当成换行。

常用操作:

```python
s = "Hello, World"
print(len(s))              # 12 —— 长度
print(s[0])                # 'H' —— 索引(0 起,负数从末尾)
print(s[-1])               # 'd'
print(s[0:5])              # 'Hello' —— 切片[起:止)
print(s.lower())           # 'hello, world'
print(s.upper())           # 'HELLO, WORLD'
print(s.split(', '))       # ['Hello', 'World'] —— 按分隔符切分
print(', '.join(['a', 'b']))  # 'a, b' —— 拼接
print(s.replace('World', 'Python'))  # 'Hello, Python'
print('  hi  '.strip())    # 'hi' —— 去首尾空白
print(s.startswith('Hello'))  # True
print('World' in s)        # True —— 成员判断
```

**拼接性能**:大量字符串拼接时,`+` 反复创建新对象(每次都是新 str),效率低;应用 `''.join(list_of_str)`,它一次性分配内存。

```python
# 不推荐:循环用 +
parts = []
for i in range(5):
    parts.append(f"行{i}")
result = ''.join(parts)     # 推荐:join 一次性拼接
```

字符串的深度内容——编码(字节 vs 字符)、格式化方式演进(`%`/`format`/f-string)、正则、切片细节——会在《字符串深度剖析》大章节展开。本篇建立"`str` 不可变 Unicode 文本、`join` 优于循环 `+`、原始字符串处理路径/正则"的认知即可。

### 2.6 列表:list

`list` 是**可变、有序、可含任意类型元素**的序列,是 Python 最常用的容器类型。用方括号 `[]` 创建:

```python
nums = [1, 2, 3, 4, 5]
mixed = [1, "a", True, [2, 3]]   # 元素类型可混合
empty = []
print(len(nums))          # 5
print(nums[0])            # 1 —— 索引
print(nums[-1])           # 5 —— 负索引从末尾
print(nums[1:4])          # [2, 3, 4] —— 切片
```

可变性体现在可就地增删改:

```python
lst = [1, 2, 3]
lst.append(4)             # 末尾追加 → [1, 2, 3, 4]
lst.insert(0, 0)          # 指定位置插入 → [0, 1, 2, 3, 4]
lst.extend([5, 6])        # 扩展(并入另一个序列)→ [0,1,2,3,4,5,6]
lst[0] = 99               # 索引赋值(修改)→ [99,1,2,3,4,5,6]
del lst[0]                # 删除索引 → [1,2,3,4,5,6]
lst.remove(3)             # 按值删除首个匹配 → [1,2,4,5,6]  ← 找不到会 ValeError
lst.pop()                 # 弹出末尾 → 返回新元素,列表少一个
lst.pop(0)                # 弹出指定索引
print(lst)
```

`append` vs `extend` 是经典区分点:`append` 把整个参数作为一个元素追加(`[1].append([2,3]) → [1,[2,3]]`),`extend` 把可迭代对象的元素逐个并入(`[1].extend([2,3]) → [1,2,3]`)。

常用查询与排序:

```python
lst = [3, 1, 4, 1, 5, 9, 2, 6]
print(lst.count(1))       # 2 —— 值出现次数
print(lst.index(4))       # 2 —— 首次出现的索引(找不到 ValueError)
lst.sort()                # 就地升序 → [1, 1, 2, 3, 4, 5, 6, 9]
lst.sort(reverse=True)    # 就地降序
print(sorted([3, 1, 2]))  # [1, 2, 3] —— 返回新列表,不改原列表
lst.reverse()             # 就地反转
```

`sort()` 就地改原列表返回 `None`,`sorted()` 返回新列表——这对所有可迭代对象可用。两者都接受 `key` 函数自定义排序依据:

```python
words = ['banana', 'apple', 'cherry']
words.sort(key=len)            # 按长度排 → ['apple', 'banana', 'cherry']
students = [('Alice', 90), ('Bob', 85)]
students.sort(key=lambda x: x[1], reverse=True)  # 按分数降序
```

**可变性的代价——共享引用陷阱**(见《变量赋值机制》):`b = a` 后改 `b` 会影响 `a`;需要独立副本用 `a.copy()` 或 `a[:]`(浅拷贝)。

```python
a = [1, 2, 3]
b = a
b.append(4)
print(a)     # [1, 2, 3, 4] —— a 也被改了!
```

列表的切片、推导式、`list` vs `tuple` 取舍等深水区在《列表深度剖析》专题展开。

### 2.7 元组:tuple

`tuple` 是**不可变、有序**的序列,用圆括号 `()` 创建。功能上像"不可变的 list",但语义上常用于表示**固定结构的记录**(如坐标 `(x, y)`、RGB `(r, g, b)`、数据库行),而非"会变的集合"。

```python
point = (10, 20)
rgb = (255, 128, 0)
single = (5,)          # 单元素元组,逗号必须有!没有逗号是括号表达式不是元组
empty = ()
not_a_tuple = (5)      # 这只是整数 5,加了括号而已,等价 5
print(type(single))    # <class 'tuple'>
print(type(not_a_tuple))  # <class 'int'>
```

`(5,)` 这条规则极易踩坑:单元素元组必须带尾逗号,否则 `(5)` 被解释成"加了括号的整数 5"。函数返回多值时用的是元组——`return x, y` 实际返回 `(x, y)`,此时括号可省略。

元组不可变,故没有 `append`/`insert`/`sort` 等修改方法,只有查询:

```python
t = (1, 2, 3)
print(t[0])            # 1
print(t.count(2))      # 1
print(t.index(3))      # 2
a, b, c = t            # 解包:a=1, b=2, c=3
```

元组最大优势是**可哈希**(元素都可哈希时可做 `dict` 键),且作为记录解包优雅:

```python
# 用元组做 dict 的键(列表不行,因不可哈希)
grid = {}
grid[(0, 0)] = "起点"    # 元组键,合法
# grid[[0, 0]] = "起点"  # TypeError: unhashable type: 'list'

# 解包:函数返回多值的标准写法
def min_max(lst):
    return min(lst), max(lst)   # 返回元组
lo, hi = min_max([3, 1, 4, 1, 5])   # 解包接收
print(lo, hi)          # 1 5
```

何时用 tuple、何时用 list?**数据会增删改 → list**;**数据是固定结构、不修改、要解包或做键 → tuple**。这个心智模型比"tuple 就是不变的 list"更有指导意义。

### 2.8 字典:dict

`dict` 是**键值对映射**,通过键(key)高效查找值(value)。键必须可哈希(不可变类型、或元素都可哈希的 tuple),值无限制。底层是哈希表,查找/插入/删除平均 O(1)——这是它最重要的特性。

```python
person = {"name": "Alice", "age": 30, "city": "杭州"}
print(person["name"])       # 'Alice' —— 按键取值
person["age"] = 31          # 修改
person["email"] = "a@x.com" # 新增键
del person["city"]          # 删除键
print(len(person))          # 3
```

`d[key]` 在键不存在时会 `KeyError`,更安全的方式是用 `.get()`:

```python
d = {"a": 1}
print(d.get("a"))           # 1
print(d.get("b"))           # None —— 键不存在,不报错,返回默认 None
print(d.get("b", 0))        # 0 —— 自定义默认值
print(d.get("a", 0))        # 1 —— 键存在,返回真实值,忽略默认
```

新增/更新键值对的现代写法(Python 3.9+ `|=` 合并,3.7+ 字典保持插入顺序):

```python
d = {"a": 1}
d.update({"b": 2, "c": 3})  # 批量更新/新增
d2 = {"x": 9}
merged = d | d2             # 3.9+ 合并,生成新 dict → {'a':1,'b':2,'c':3,'x':9}
d |= {"y": 10}             # 3.9+ 就地合并
```

遍历的三种方式:

```python
d = {"a": 1, "b": 2}
for k in d:                 # 默认遍历键
    print(k)
for k, v in d.items():      # 遍历键值对 —— 最常用
    print(k, v)
for v in d.values():        # 遍历值
    print(v)
```

```python
d = {"a": 1}
print(d.keys())             # dict_keys(['a']),视图对象,动态反映 dict 变化
print(list(d.keys()))       # ['a'],转 list
```

`.keys()`/`.values()`/`.items()` 返回的是**视图对象**(view),不是列表。视图是动态的——dict 修改后视图自动更新,且支持集合运算(交集并集)。这是 Python 3 相对 2 的一个改动,日常多数场景直接迭代即可,需要列表时 `list(d.keys())`。

⚠️ 遍历时修改 dict 会报错:

```python
d = {"a": 1, "b": 2}
# for k in d:
#     if d[k] < 5:
#         del d[k]    # RuntimeError: 字典在迭代时改变大小
# 正确:先收集要删的键
for k in list(d.keys()):
    if d.get(k, 0) < 5:
        del d[k]
```

字典的哈希表原理、`dict` vs `defaultdict`、有序性保证等在《字典深度剖析》专题展开。本篇记住"键必须可哈希、`.get()` 防 KeyError、`.items()` 遍历键值、遍历时别改结构"。

### 2.9 集合:set 与 frozenset

`set` 是**无序、元素唯一**的可变集合,底层也是哈希表。核心用途:去重、成员判断(O(1))、集合运算(交/并/差/对称差)。元素必须可哈希。

```python
s = {1, 2, 3, 2, 1}     # 字面量,重复自动去重
print(s)                 # {1, 2, 3}
empty = set()            # 空集合必须用 set(),{} 是空 dict!
print(type({}))          # <class 'dict'> —— 注意!

# 从列表去重
nums = [1, 2, 2, 3, 3, 3]
unique = set(nums)       # {1, 2, 3}
print(list(unique))      # [1, 2, 3](顺序不保证)
```

⚠️ `set()` 与 `{}` 的区别是经典坑:`{}` 创建的是空 `dict` 而非空 `set`,空集合必须写 `set()`。

成员判断——`set` 相比 `list` 的核心优势:

```python
big_set = set(range(1000000))
big_list = list(range(1000000))
print(999999 in big_set)   # True —— O(1),哈希查找,极快
print(999999 in big_list)  # True —— O(n),线性扫描,百万级很慢
```

集合运算:

```python
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}
print(a | b)    # {1,2,3,4,5,6} —— 并集(union)
print(a & b)    # {3, 4}          —— 交集(intersection)
print(a - b)    # {1, 2}          —— 差集(difference)
print(a ^ b)    # {1, 2, 5, 6}   —— 对称差(symmetric_difference)
```

增删:

```python
s = {1, 2, 3}
s.add(4)            # 增
s.discard(2)        # 删(不存在不报错)
s.remove(9)         # 删(不存在 KeyError)
print(s)
```

`add` vs `discard` vs `remove`:`add` 加元素;`discard` 删元素、不存在静默忽略;`remove` 删元素、不存在报错。按是否容忍"不存在"选用。

`frozenset` 是不可变集合——创建后不能增删,因此可哈希,可做 `dict` 键或 `set` 元素:

```python
fs = frozenset([1, 2, 3])
# fs.add(4)         # AttributeError: 不可变
d = {fs: "value"}   # 合法!frozenset 可做键
```

何时用 set?**需要去重、高频成员判断、集合运算**。注意 set 无序——若需保持插入顺序的去重,3.7+ 可用 `dict.fromkeys(seq)` 利用字典有序特性,或直接 `list(dict.fromkeys(seq))`。

### 2.10 空值类型:NoneType

`NoneType` 只有一个实例 `None`,表示"没有值"或"空"。它常作函数的默认返回值(无 `return` 或 `return` 不带值时返回 `None`)、函数默认参数的哨兵、变量"尚未赋值"的占位。

```python
x = None
print(type(x))          # <class 'NoneType'>
print(None == None)     # True
```

**判断是否为 None,必须用 `is`,不要用 `==`**:这是 Python 最重要的小规范之一。

```python
x = None
if x is None:           # ✅ 正确
    print("x 是空")
if x == None:           # ❌ 不推荐(虽此处可行,但有隐患)
    pass
```

为什么用 `is`?首先 `None` 是单例,全解释器只有一个 `None` 对象,`is` 判身份最直接高效;其次 `==` 会调用对象的 `__eq__`,某些自定义类可能把 `__eq__` 实现成"和任意值都相等"或抛异常,导致 `x == None` 行为不可控;`is None` 永远只判身份,可靠。这条规范要刻进习惯。

**函数默认参数哨兵**(见《变量赋值机制》):

```python
def process(data, cache=None):    # None 作哨兵,而非可变默认
    if cache is None:
        cache = []
    cache.append(data)
    return cache
```

用 `None` 作"未传参"的标志,函数体内检测到 `None` 再创建实际容器,规避可变默认参数陷阱。

`None` 在布尔语境里为假,但**不要用 `if x:` 代替 `if x is None:`**——前者把 `0`/`''`/`[]` 等也判为假,语义不同。当且仅当你要判"是否为假值"用 `if x:`;要判"是否为 None"用 `if x is None:`。混淆这两者是隐蔽 bug 的高发源。

### 2.11 类型之间的转换

基础类型之间可通过内置构造函数相互转换。理解转换规则是日常编码的高频需求——外部输入(如 `input()` 返回 `str`)、JSON 解析、配置读取,几乎都要做类型转换。

**数字 ↔ 字符串**:

```python
print(int("42"))       # 42 —— str → int
print(int("0xff", 16)) # 255 —— 按进制解析
print(float("3.14"))   # 3.14 —— str → float
print(str(42))         # '42' —— int → str
print(str(3.14))       # '3.14'
```

**int ↔ float**:

```python
print(int(3.9))        # 3 —— 截断小数(向零),不是四舍五入
print(int(-3.9))       # -3
print(float(5))        # 5.0
```

注意 `int(3.9)` 直接截断为 3,不是四舍五入到 4。要四舍五入用 `round()`。

**容器之间转换**:

```python
print(list("abc"))         # ['a', 'b', 'c'] —— str → list
print(list((1, 2, 3)))     # [1, 2, 3] —— tuple → list
print(tuple([1, 2, 3]))    # (1, 2, 3) —— list → tuple
print(set([1, 2, 2, 3]))   # {1, 2, 3} —— list → set(去重)
print(dict([("a", 1), ("b", 2)]))  # {'a': 1, 'b': 2} —— 键值对序列 → dict
print(''.join(['a', 'b'])) # 'ab' —— list → str
```

`dict()` 的输入必须是"键值对的序列"(每个元素是二元组),这是个实用的从配对数据构造字典的方式。

**转换失败的处理**:转换不合法会抛 `ValueError`,实际编码常需 try/except 或先校验:

```python
print(int("abc"))      # ValueError: 字符串无法转 int
print(int("12.5"))     # ValueError: 含小数点无法直接转 int
print(int(float("12.5")))  # 12 —— 先转 float 再截断,绕过
```

显式类型转换的完整规则、与隐式转换(运算时自动发生的转换,如 `int + float → float`)的区别,在《显式类型转换》《隐式类型转换》专题展开。本篇记住:**类型转换用构造函数、失败抛 ValueError、容器转换是常用套路**。

### 2.12 综合示例:用一个数据分析片段串起各类型

下面这个片段模拟一次小型数据处理,几乎用到了上面所有类型,阅读时可对照每种类型的用途:

```python
# 模拟"若干学生的成绩记录",演示基础类型的协作
records = [
    ("Alice", "math", 90),
    ("Alice", "english", 85),
    ("Bob", "math", 78),
    ("Bob", "english", 92),
    ("Carol", "math", 90),
]

# 1. tuple(记录) + dict(按学生聚合) + list(收集分数)
scores = {}
for name, subject, score in records:        # tuple 解包
    scores.setdefault(name, []).append(score)

# 2. int 运算 + float 平均 + round
for name, sc in scores.items():             # dict.items()
    avg = round(sum(sc) / len(sc), 2)        # sum 是 int,/ 返回 float
    print(f"{name}: 平均 {avg}")            # str f-string

# 3. set 去重 + 成员判断
all_subjects = {s for _, s, _ in records}   # 集合推导去重
print("科目:", all_subjects)

# 4. None 作默认 + bool 判断
def has_failed(sc_list, threshold=60):
    if sc_list is None:                     # None 哨兵判断
        return False
    return any(s < threshold for s in sc_list)  # any 接受真值序列

print("Bob 是否有挂科:", has_failed(scores.get("Bob")))

# 5. tuple 作 dict 键(网格定位式用法)
counter = {}
for name, subject, score in records:
    counter[(name, subject)] = score        # tuple 键
print("Alice 的数学:", counter[("Alice", "math")])
```

跑一遍这段示例,对照输出理解每个类型的角色:`tuple` 当记录和解包、`dict` 聚合与做键、`list` 收集、`int/float` 算术、`set` 去重、`None` 哨兵、`str` 输出——基础数据类型的协作图景就清晰了。

---

## 3. 最佳实践

### 3.1 判断类型用 isinstance,不用 type() is

```python
# 推荐
if isinstance(x, int): ...
# 不推荐
if type(x) is int: ...
```

`isinstance` 尊重继承链(`bool` 是 `int` 子类、子类是父类),且未来你的代码用上自定义子类时不会失效。`type() is` 只判精确类型,过于严格。除非你确需区分"精确类型而非子类"(罕见),否则一律 `isinstance`。

### 3.2 判断是否为 None 用 is None,不用 == None

```python
# 推荐
if x is None: ...
if x is not None: ...
# 不推荐
if x == None: ...
```

`None` 是单例,`is` 判身份最可靠高效;`==` 可能被自定义 `__eq__` 改写。同理判断单例 `True`/`False` 也用 `is`。但要判断"是否为假值"用 `if not x:`,判断"是否为 None"用 `if x is None:`——二者语义不同,不要混用。

### 3.3 精度敏感场景避免 float

金额、利率、税率等精度敏感计算禁用 `float`。两条出路:`int` 存最小单位(金额存分)、或 `decimal.Decimal` 做十进制精确运算。绝不要用 `float` 存金额然后指望 `round` "修好"误差——`round` 本身也基于 float。

### 3.4 处理 floor 除与取余注意负数

`//` 和 `%` 对负数是向负无穷取整(余数与除数同号),与 C/Java 的向零取整不同。做分页、日期差、索引计算涉及负数时,务必验证边界,或显式用 `int(a/b)` 实现向零取整。不要用其他语言的直觉套 Python。

### 3.5 字符串拼接用 join,不用循环 +

```python
# 推荐
result = ''.join(parts)
# 不推荐
result = ''
for p in parts:
    result += p     # 每次循环都创建新 str,O(n²)
```

`+` 在循环里反复创建新字符串,数量大时性能急剧下降。`join` 一次性分配。少量拼接用 `+` 无妨,循环累积一定 `join`。

### 3.6 容器选型:可变/不可变 + 查找特征

- 会增删改、按下标访问 → `list`。
- 固定结构、要解包或做键 → `tuple`。
- 键值映射、按 key 查 → `dict`。
- 去重、高频成员判断、集合运算 → `set`。
- 需要有序去重 → 3.7+ 用 `dict.fromkeys(seq)` 保序去重。

按用途选类型,而非随手都用 list。数据结构选对,代码自然简洁高效。

### 3.7 访问 dict 用 .get() 防止 KeyError

```python
# 推荐
val = d.get(key, default_value)
# 不推荐
val = d[key] if key in d else default_value   # 查两次
# 也不推荐(掩盖问题)
try:
    val = d[key]
except KeyError:
    val = default_value
```

`d[key]` 适用"键一定存在"的确定场景;键可能缺失时 `.get()` 最简洁。但不要用 `.get()` 去"容忍本不该缺失的键"——那会掩盖数据 bug,键缺失本应在早期暴露。

### 3.8 遍历容器时不要修改它的结构

遍历 `list`/`dict`/`set` 时增删元素会导致索引错乱或 `RuntimeError`。要边遍历边删除,先复制一份迭代(或收集待删项再统一删):

```python
# 遍历时删 list:基于副本迭代
for item in list(lst):
    if should_remove(item):
        lst.remove(item)
# dict:先收键
for key in list(d.keys()):
    if d[key] is None:
        del d[key]
```

### 3.9 用字面量/推导式创建容器,少用构造函数

```python
# 推荐(字面量更直观高效)
lst = [1, 2, 3]
d = {"a": 1}
s = {1, 2, 3}
# 推导式
squares = [x*x for x in range(10)]
# 仅在"转换"时用构造函数
lst = list(other_iterable)
```

字面量和推导式是 Python 的惯用法,可读性和性能都优于"先建空容器再循环填充"。空容器例外:空 list `[]`、空 dict `{}` 都用字面量,但空 set 必须用 `set()`。

### 3.10 小心可变对象共享,需要独立副本时显式拷贝

`a = b` 共享引用,可变对象(`list`/`dict`/`set`)的就地修改会波及所有引用者。需要独立副本用浅拷贝(`.copy()`/`[:]`),含可变嵌套要全独立用 `copy.deepcopy`。详见《变量赋值机制》,此处只强调:基础类型里 `list`/`dict`/`set` 是可变类型,共享引用时务必警觉。

### 3.11 大整数放心用,int 无上限

Python `int` 任意精度,不必担心溢出。加密、组合数学、大数计算可直接用 `int`,不必引入大数库。但极 大整数的运算会随位数增长变慢,密码学场景仍可能需专用库(如 `gmpy2`)优化。

### 3.12 原始字符串处理路径和正则,避免反斜杠转义地狱

```python
# 推荐
path = r'C:\new\folder\todo.txt'
pattern = r'\d+\.\d+'
# 不推荐(容易错)
path = 'C:\\new\\folder\\todo.txt'
```

`r''` 里反斜杠是字面量,写 Windows 路径和正则表达式时少一半心智负担。注意:原始字符串**不能以单个反斜杠结尾**(`r'\'` 语法错误),需变通。

---

## 4. 原理

本章讲清基础类型背后的关键机制:可变/不可变如何由类型实现决定、可哈希性的来源、对象模型下"类型也是对象"的含义、`bool` 为何能当 `int` 用、`int` 任意精度的实现思路、`float` 精度误差的根源、`dict`/`set` 为何 O(1)。这些是"为什么这样能用/不能这样用"的根基。

### 4.1 可变与不可变的本质:由类型实现决定

可变(mutable)与不可变(immutable)的根本区别,在于"修改对象时身份(id)是否改变",而这由类型是否提供就地修改操作决定。

**不可变类型**(`int`/`float`/`str`/`tuple`/`frozenset`/`bool`/`NoneType`):类型的所有"修改"都返回**新对象**,原对象在生命周期内值、id 永不变化。以 `str` 为例,`s.upper()` 不改 `s`,而是返回一个新字符串:

```python
s = "abc"
print(id(s))        # A
s = s.upper()       # 返回新对象 "ABC",s 改指
print(id(s))        # B(不同),原 "abc" 对象不变
```

正是因为不可变对象的值永不变,它的哈希值稳定,才能做 `dict` 键/`set` 元素;也才能被多个名字安全共享——谁都无法"偷偷改"它,要"改"只能改自己的指向,不影响别人。

**可变类型**(`list`/`dict`/`set`):类型提供就地修改操作(`list.append`、`dict.__setitem__`、`set.add`),**不换对象**就改内容,id 不变:

```python
lst = [1, 2]
print(id(lst))      # A
lst.append(3)       # 就地改,id 不变
print(id(lst))      # A(同)
```

可变性带来灵活(省拷贝、可原地增删),代价是不可哈希(内容可变→hash 不稳→不能做键)、共享需谨慎(就地改波及所有引用者)。

**tuple 的微妙边界**:tuple 本身不可变(不能增删元素、不能重新赋值元素),但若元素是可变对象,元素**内容**可变:

```python
t = ([1, 2],)
t[0].append(3)      # 合法!改的是 tuple 内 list 元素的内容
print(t)            # ([1, 2, 3],)
# t[0] = [9]        # 非法!不能重新赋值 tuple 的元素引用
```

tuple 的不可变是"结构不可变"——元素引用不变;不是"深层不可变"。这条边界解释了"tuple 可哈希"有个前提:**元素都必须可哈希**(若 tuple 含 list,该 tuple 不可哈希)。

```python
print(hash((1, 2)))       # 可哈希,返回整数
# hash(([1, 2],))         # TypeError: 元素含不可哈希的 list
```

理解可变/不可变的本质(修改是否换身份)、它对哈希与共享的影响,是掌握 Python 数据模型的关键,也为后续容器专题(深拷贝、默认参数陷阱)奠基。

### 4.2 可哈希性的来源:__hash__ 与 __eq__

一个对象能做 `dict` 键/`set` 元素(可哈希),条件是它实现了 `__hash__` 方法返回一个整数,且该整数在对象生命周期内不变。规则是:**不可变对象默认可哈希,可变对象默认不可哈希**。

- `int`/`float`/`str`/`bool`/`None`:不可变,`__hash__` 返回基于值的哈希,稳定可哈希。
- `tuple`:不可变,若所有元素可哈希则 tuple 可哈希;含不可哈希元素则不可哈希。
- `list`/`dict`/`set`:可变,`__hash__` 被设为 `None`,显式不可哈希。

```python
print([].__hash__)      # None —— list 的 __hash__ 被置空,故不可哈希
print((1, 2).__hash__)  # <method-wrapper ...> —— tuple 有 __hash__
```

为什么可变对象不可哈希?因为哈希表依赖"键的哈希值在表内不变"。如果 list 可哈希,你把它当键存进去后,改了 list 内容,哈希值变了,就再也找不到它了——表会乱。Python 直接禁止可变对象做键,从源头杜绝。

此外,可哈希对象还应满足:`a == b` 则 `hash(a) == hash(b)`(值相等的对象哈希必相等,反之不必)。这条契约保证哈希表查找正确:用 `==` 判等价于用哈希定位。自定义类若重写 `__eq__`,默认 `__hash__` 会被置空(变不可哈希),需同时重写 `__hash__` 维持契约。

### 4.3 类型也是对象:type 元类简介

"一切皆对象"在 Python 里是字面意义上的——连"类"本身也是对象。`int`、`str`、`list` 这些类,自身也是对象,它们的类型是 `type`:

```python
print(type(10))     # <class 'int'>    —— 10 的类型是 int
print(type(int))    # <class 'type'>   —— int 这个类的类型是 type
print(type(str))    # <class 'type'>
print(type(type))   # <class 'type'>   —— type 自身的类型还是 type(自举)
```

`type` 是"类的类",称为**元类(metaclass)**。普通实例的创建路径是 `type → class → instance`:`type` 创建了 `int` 这个类对象,`int` 又创建了 `10` 这个实例对象。`type` 自身的类型是它自己,形成自举的闭环。

这条知识现在不必深究,但建立"类也是对象、有类型 `type`"的认知,能解释几个现象:

- 为什么能写 `int("42")`?因为 `int` 是个对象(可调用对象),调用它就是"创建/转换一个 int 实例"。
- 为什么 `isinstance(x, int)` 传的是 `int` 这个类对象本身?因为类对象就是"类型"在运行时的载体。
- 后续面向对象里自定义类、元类编程,都建立在这套"`type` 造类、类造实例"的模型上。

### 4.4 bool 为何是 int 的子类:继承与真值约定

`bool` 继承自 `int`,这并非偶然,而是 Python 沿袭 C 语言"真值即整数(0/1)"约定的设计。`bool` 在 CPython 里大致是:

```python
# 概念性伪代码
class bool(int):
    def __repr__(self):
        return 'True' if self else 'False'
    # ... 重写字符串表示,但算术行为继承 int

True = bool(1)    # 单例
False = bool(0)   # 单例
```

因此 `True == 1`、`True + True == 2`、`sum([True, False, True]) == 2`——`bool` 在算术上完全沿用 `int` 语义,只是固定了取值范围(0 或 1)和显示形式。

这个继承关系带来两条实用后果:

1. **`isinstance(True, int)` 为真**:任何接受 `int` 的地方都能传 `bool`,如 `list[True]` 等价 `list[1]`。
2. **`True`/`False` 是单例**:全解释器只有一个 `True`、一个 `False`,故 `x is True` 可靠判"是否正是 True"(注意区别于"是否为真值"——`1 is True` 为 `False`,虽然 `1 == True`)。

也正因此,判断布尔值时不要用 `if x == True:`(会把 `1` 也判为真,语义偏),而用 `if x:`(判真值)或 `if x is True:`(精确判 True 单例)。

### 4.5 int 任意精度的实现思路

C/Java 的整数是定长(32/64 位),溢出回绕或报错;Python 的 `int` 任意精度,靠的是动态扩展存储。原理简述:`int` 内部用一个**数字数组**(如 30 位为一组的"位段")表示任意大小的整数,数组长度随数值增大而增长,加法/乘法按数组逐段进位实现。

```python
# 没有溢出,大数运算正常
print(2 ** 1000)   # 一个 302 位的整数,精确
print(10 ** 100 + 10 ** 100)   # 精确
```

代价是:大整数运算比硬件定长整数慢(软件实现的逐段进位,无 CPU 单指令加速)。日常小整数运算 CPython 有优化(小整数缓存,见《变量赋值机制》),与定长性能接近;但天文级整数运算会明显变慢。密码学(大素数、模幂)等高频大数场景,有时需 `gmpy2` 等基于 GMP 的高速库。

这条设计的实用意义:你无需担心 `int` 溢出,可以放心算阶乘、组合数、大幂次——这在 C 系语言里需要专门的大数处理。但要知道"任意精度"不是"无限快",极大整数有性能成本。

### 4.6 float 精度误差的根源:IEEE 754 二进制浮点

`float` 底层是 IEEE 754 双精度:1 位符号 + 11 位指数 + 52 位尾数,共 64 位。它用二进制科学计数法表示数,故只能精确表示"分母是 2 的幂"的小数(如 0.5、0.25、0.125),其余十进制小数(0.1、0.2、0.3)都是无限循环二进制小数,存储时被截断到 52 位尾数,产生舍入误差。

以 `0.1` 为例:它的二进制是 `0.0001100110011...`(无限循环),存入 64 位时被截断,实际存储值略大于 0.1。两个略大的 0.1 相加,误差暴露为 `0.30000000000000004`。

```python
print(f"{0.1:.20f}")   # 0.10000000000000000555 —— 实际存储值
print(f"{0.3:.20f}")   # 0.29999999999999998890
```

这解释了 `0.1 + 0.2 != 0.3`:两个对象的实际存储值不等于真值。这不是 Python 的 bug,是所有 IEEE 754 实现的共通特性。

规避路径:
- **金额存 int(分)**:用整数单位彻底绕开小数。
- **`decimal.Decimal`**:十进制运算,精确表示 `0.1`,"存什么是什么"。
- **`fractions.Fraction`**:分数运算,精确有理数。
- 比较 float 相等不要用 `==`,而用容差:`abs(a - b) < 1e-9`。

`float` 的精度细节、`inf`/`nan`、`Decimal` 实战在《float 类型与精度问题》专题展开,此处确立"误差源于二进制无法精确表示十进制小数"的根因认知。

### 4.7 dict 与 set 为何 O(1):哈希表原理

`dict` 和 `set` 底层都是**哈希表**(hash table),这是它们查找/插入/删除平均 O(1) 的根源。原理简述:

1. **哈希函数**:对键调用 `hash(key)` 得到一个整数哈希值。
2. **定位桶**:用哈希值对表大小取模,定位到存储槽位(bucket)。
3. **存取**:键值对存入对应槽位;查找时重算哈希定位槽位,再用 `==` 比对键确认。

```python
d = {}
d["name"] = "Alice"
# 存:hash("name") → 某整数 → 定位槽位 → 存 ("name","Alice")
# 取 d["name"]:hash("name") → 同槽位 → == 比对键 → 返回 "Alice"
```

因为哈希定位是 O(1) 算术,再配一个通常 O(1) 的键比对,整体平均 O(1)——无需遍历,这就是 `dict`/`set` 比 `list` 查找快几个数量级的原因。`set` 本质是"只有键、没有值"的 `dict`,故同样 O(1) 成员判断。

**冲突处理**:不同键可能哈希到同一槽位(哈希冲突),CPython 用**开放寻址法**(探测下一个空槽)处理冲突。冲突少时仍 O(1),极端情况(所有键哈希相同,哈希攻击)退化为 O(n),但正常使用不会遇到。

**可哈希性为何关键**:这正是 §4.2 的应用——`dict`/`set` 依赖键的哈希值稳定不变。若键可变,存进去后内容变了哈希就变了,再也找不到它,表会错乱。Python 强制键可哈希(不可变),从源头保证哈希表正确。

哈希表的扩容、加载因子、Python 3.7+ `dict` 有序的实现(用两个数组分离索引与条目)等深水区,在《字典深度剖析》专题展开。本篇确立"哈希表使 dict/set 平均 O(1),这是它们相对 list 的根本优势"的认知。

---

## 5. 总结

### 5.1 本文内容回顾

- **基础数据类型定义**:Python 一切皆对象,类型是对象的类;动态类型下变量无类型、对象有类型。基础类型是语言内置、开箱即用的核心类型集合。
- **观察工具**:`type()` 看类型、`isinstance()` 判类型(推荐)、`id()` 看身份;类型本身也是对象,类型是 `type`。
- **内置类型速览**:数字(`int`/`float`/`complex`/`bool`)、序列(`str`/`list`/`tuple`)、映射(`dict`)、集合(`set`/`frozenset`)、空值(`NoneType`);可变性决定可哈希性与共享行为。
- **int**:任意精度无溢出,多进制字面量与下划线分隔,`/` 真除 vs `//` 整除(负数向负无穷取整)。
- **float**:IEEE 754 双精度有精度误差(`0.1+0.2!=0.3`),金额等用 int 或 Decimal,`round` 银行家舍入。
- **complex**:`a+bj` 复数,实虚部为 float,科学计算用。
- **bool**:`int` 子类(`True==1`),真相值测试规则(空/零为假),`bool` 算术沿用 int。
- **str**:不可变 Unicode,四种字面量(含原始串 `r''`、f-string),`join` 优于循环 `+`。
- **list**:可变有序序列,append/extend/insert 区分,sort 就地 vs sorted 返回新表,共享引用需拷贝。
- **tuple**:不可变有序,单元素需尾逗号,作记录解包与 dict 键,可哈希前提是元素都可哈希。
- **dict**:键值映射平均 O(1),键必可哈希,`.get()` 防 KeyError,`.items()` 遍历,遍历时勿改结构。
- **set/frozenset**:无序唯一集合,O(1) 成员判断,集合运算交并差对称差,空集用 `set()`;frozenset 不可变可哈希。
- **NoneType**:单例 `None` 表无值,作函数默认哨兵,判 None 用 `is None`。
- **类型转换**:构造函数互转,失败抛 ValueError,容器转换是常用套路。
- **原理**:可变/不可变由类型实现决定、可哈希性源于 `__hash__`/`__eq__` 契约、类型也是对象(type 元类)、bool 继承 int、int 任意精度数组实现、float 误差源于二进制无法精确表示十进制小数、dict/set 由哈希表实现 O(1)。
- **最佳实践**:`isinstance` 判类型、`is None` 判空、金额避 float、负数注意整除、拼接用 join、按用途选容器、`.get()` 防 KeyError、遍历不改结构、字面量/推导式优先、可变对象共享需拷贝、大整数放心用、原始串处理路径正则。

### 5.2 读完本文你应能掌握

- 说明 Python"一切皆对象、变量是名字标签"模型下类型的概念,用 `type`/`isinstance`/`id` 观察对象。
- 列举全部基础内置类型,指出各自可变性与可哈希性,说明可哈希性对能否做 dict 键/set 元素的影响。
- 正确使用 `int` 的多进制字面量与 `/`、`//`、`%` 运算,预判负数整除取余的结果。
- 说明 `float` 精度误差的根源,在金额等精度敏感场景选择 int 或 Decimal 规避。
- 说明 `bool` 是 `int` 子类带来的后果,列举真相值测试规则(`bool([0])` 为真等)。
- 用 `str` 的字面量、原始字符串、f-string,说明为何循环拼接应用 `join`。
- 对 `list` 进行增删改查与排序,区分 `append`/`extend`、`sort`/`sorted`,识别可变共享陷阱。
- 区分 `list` 与 `tuple` 的选用场景,正确创建单元素元组,用 tuple 解包与做 dict 键。
- 用 `dict` 增删改查与 `.get()`/`.items()`/`.update()`,说明键必可哈希,规避遍历时改结构的错误。
- 用 `set`/`frozenset` 去重、O(1) 成员判断、集合运算,区分空 set 与空 dict 的创建。
- 说明 `None` 的单例语义与哨兵用途,正确用 `is None` 判断。
- 用构造函数在各基础类型间转换,处理转换失败。
- 阐述可变/不可变的本质、可哈希性的 `__hash__`/`__eq__` 契约、`type` 元类、bool 继承 int、int 任意精度、float 误差根源、dict/set 哈希表 O(1) 原理。

### 5.3 延伸方向

- **类型判断与 type 系统**:`type()`、`isinstance()`、`issubclass()` 的完整用法,继承链与抽象基类(ABC),见《类型判断与 type 系统》。
- **各类型深度专题**:《int 类型详解》(位运算、进制)、《float 类型与精度问题》(Decimal、容差比较)、《bool 类型与短路逻辑》、《None 类型详解》、《complex 复数类型》,逐个深入。
- **类型注解与静态检查**:`type hints`、`Union`/`Optional`/`TypeVar`、`mypy`,把"运行时类型"延伸到"开发期静态保障",见本大章节第 9~13 篇。
- **类型转换机制**:显式转换(`int()` 等构造函数)与隐式转换(运算时 `int→float`、`bool→int`)的完整规则,见《显式类型转换》《隐式类型转换》。
- **哈希与可哈希类型**:`hash()` 的语义、`__hash__`/`__eq__` 契约、自定义可哈希类,见《hash 与可哈希类型》。
