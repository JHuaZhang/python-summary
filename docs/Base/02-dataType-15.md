---
group:
  title: 【02】基础数据类型和类型系统
  order: 2
order: 15
title: 隐式类型转换
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是隐式类型转换

隐式类型转换(implicit type conversion),又称**自动类型转换**或**类型强制(coercion)**,是 Python 在运算时**自动**发生的类型提升——当你把不同类型的值放在一起运算,Python 不报错,而是按规则把其中一个"提升"为更宽的类型再算。你无需写任何转换代码,Python 替你完成。

```python
# 隐式转换:运算时自动提升
print(3 + 0.5)        # 3.5 —— int 3 隐式转 float 3.0,再与 0.5 相加
print(type(3 + 0.5))  # <class 'float'> —— 结果是 float
```

`3 + 0.5` 中,`3` 是 int、`0.5` 是 float。int 与 float 不能直接相加(底层表示不同),Python 不报错,而是把 int `3` **隐式提升**为 float `3.0`,再与 `0.5` 相加得 `3.5`(float)。整个过程自动,你只写了 `+`,Python 决定如何转换。这就是隐式转换——运算驱动的、自动的类型提升。

隐式转换是相对**显式转换**而言的。显式转换是你**主动调用** `int()`/`str()` 等构造函数转换(《显式类型转换》主题);隐式转换是 Python **运算时自动**做的。两者本质不同:

```python
# 显式:你主动调
n = int("42")          # str→int,你写 int()
# 隐式:运算自动
r = 3 + 0.5            # int→float,Python 自动,你没写 float()
```

隐式转换发生在"运算符作用于不同类型操作数"时——`+`/`-`/`*`/`/` 等算术运算、比较运算、布尔运算等场景。Python 按一套"哪个类型更宽、往哪提升"的规则,自动统一类型再运算。

为什么需要隐式转换?它让**混合类型运算自然书写**——你写 `3 + 0.5` 直接得 3.5,不必先 `float(3) + 0.5` 显式转。如果没有隐式转换,任何混合类型运算都要显式转,代码会冗长(`float(3) + 0.5`、`int(True) + 1` 等)。隐式转换是"运算兼容性"的便利机制——在类型"语义兼容"(数字间、bool↔int)时自动统一,减少冗余转换代码。

```python
# 没有隐式转换会很冗长
total = float(3) + 0.5          # 假设要显式
flag_count = int(True) + int(False) + 1   # bool 显式转 int
# 有隐式转换,自然书写
total = 3 + 0.5                 # 自动
flag_count = True + False + 1   # 自动(bool→int)
```

但隐式转换也带来**意外行为**——因它自动,你可能没意识到类型变了,产生"结果类型与预期不符"的 bug。理解隐式转换的规则与边界,是写正确 Python 的关键:

```python
# 隐式转换可能意外
print(8 / 2)           # 4.0!不是 4 —— / 总返回 float(隐式提升)
print(True + True)     # 2 —— bool 隐式转 int,可能意外
print([1, 2] * 2)      # [1,2,1,2] —— list * int 重复(非数学乘,但也是隐式协作)
```

`8 / 2` 得 `4.0`(float)而非 `4`——这是 `/` 的规则(总返回 float),新手常意外。`True + True` 得 `2`——bool 隐式转 int。这些"自动发生"的行为,若不理解规则,会写出"看着对实际错"的代码。

本篇要系统讲透隐式类型转换:数值塔与提升规则(int→float→complex)、bool 作为 int 的隐式参与、除法运算的类型规则(`/` vs `//`)、比较与布尔运算的转换、容器与运算符的协作(非数学的"转换")、隐式转换的边界与陷阱、隐式 vs 显式的完整对比。本篇与《显式类型转换》分工:本篇讲"运算自动的提升",显式篇讲"主动调用的转换"。

### 1.2 数值塔:转换的方向

理解隐式转换,先建立**数值塔**(number tower)的概念——它是 Python 数值类型提升方向的依据。Python 的内置数值类型按"宽度"递增构成塔:

```
int(整数) → float(浮点) → complex(复数)
```

- `int`:最窄,精确整数。
- `float`:更宽,含小数(int 的值都能用 float 表示,虽可能丢精度)。
- `complex`:最宽,含虚部(实数都能用复数表示,虚部 0)。

**提升规则**:混合运算时,**向更宽的类型提升**。窄类型自动转成宽类型参与运算,结果是宽类型。

```python
# int + float → float(int 提升为 float)
print(3 + 0.5)            # 3.5 (float)
# int + complex → complex(int 提升为 complex)
print(3 + (1+2j))         # (4+2j) (complex)
# float + complex → complex
print(0.5 + (1+2j))       # (1.5+2j) (complex)
```

规则:参与运算的类型里取最宽的,所有操作数提升到该宽度,结果也是该宽度。`int`+`float`→`float`、`int`+`complex`→`complex`、`float`+`complex`→`complex`。

**没有反向转换**:宽类型不会自动转回窄类型。`complex` 不会自动转 `float`,`float` 不会自动转 `int`——要降级必须显式(显式转换):

```python
# 宽→窄不会自动,需显式
z = 3 + 4j
# float(z)   # TypeError!complex 不能自动/直接转 float
# int(3.5)   # 需显式(隐式不会把 float 截断为 int)
print(z.real)         # 3.0(取实部,显式操作)
print(int(3.5))       # 3(显式截断)
```

complex 不能隐式转 float(会丢虚部),float 不能隐式转 int(会丢小数)——降级有信息损失,Python 不自动做,要你显式决定。这是"向宽提升自动、向窄降级显式"的不对称——保护你不被意外的信息损失坑到。

数值塔是隐式转换的骨架——所有数值隐式转换都沿"向宽提升"这个方向。理解塔与方向,就掌握了数值运算的类型变化规律。

### 1.3 隐式转换速览

讲清定位前,给出隐式转换的全貌速览:

```python
# 1. 数值提升:int → float → complex
print(3 + 0.5)          # 3.5 (int→float)
print(3 + 1j)           # (3+1j) (int→complex)
print(2.5 * 3)          # 7.5 (int→float)

# 2. bool 既是 int,运算时隐式转 int
print(True + 1)         # 2 (bool→int)
print(sum([True, False, True]))  # 2 (bool→int 求和)

# 3. 除法:/ 总返回 float,// 依操作数
print(8 / 2)            # 4.0 (int/int→float)
print(8 // 2)           # 4 (int//int→int)
print(8.0 // 2)         # 4.0 (有 float→float)

# 4. 比较:不同数值类型可比较(隐式统一)
print(3 == 3.0)         # True (int 比较时转 float)
print(3 < 3.5)          # True
print(3 == 3 + 0j)      # True (complex? 不,== 可比)

# 5. 字符串与数字不能隐式运算(不兼容类型,报错)
# "3" + 5     # TypeError(str 不与 int 隐式)
```

几个关键:

- 数值提升(int→float→complex):运算自动向宽统一。
- bool→int:bool 是 int 子类,运算时当 0/1。
- `/` 总 float,`//` 依操作数:除法规则特殊。
- 数值间比较可隐式统一(int vs float vs complex)。
- **不兼容类型不隐式转换**:str 与 int 不会自动互转(`"3"+5` 报错,需显式 `int("3")+5` 或 `"3"+str(5)`)。

后两项是重点:数值内部自由隐式,但跨大类(str↔数值)不隐式,需显式。这是 Python 隐式转换的边界——只在"数值塔内"和"bool↔int"自动,跨大类不自动。

### 1.4 隐式转换的边界:哪些会、哪些不会

理解隐式转换,关键是知道它的**边界**——哪些类型组合会自动转换,哪些必须显式。Python 的隐式转换相当克制,只在"语义明确的兼容类型"间自动。

**会隐式转换的场景**:

1. **数值塔内**:int/float/complex 混合运算,向宽提升。
2. **bool ↔ int**:bool 是 int 子类,运算当 0/1。
3. **数值间比较**:int/float/complex 可相互比较(隐式统一)。
4. **布尔语境(truthiness)**:任何对象在 `if`/`while`/`and`/`or` 隐式转 bool(真值测试)。

```python
# 数值塔内:自动
3 + 0.5            # 3.5
True + 1           # 2
3 == 3.0           # True
if [1, 2]: ...     # list 隐式真值测试(非空→True)
```

**不会隐式转换的场景(报错,需显式)**:

1. **str ↔ 数值**:字符串与数字不会自动互转(`"3"+5` TypeError)。
2. **bytes ↔ str**:字节串与字符串不自动互转(需 encode/decode)。
3. **容器 ↔ 数值**:list/dict 等不自动转数字(`[1]+1` TypeError)。
4. **宽→窄降级**:complex→float、float→int 不自动(需显式)。
5. **不兼容容器**:list + tuple 不自动合并(`[1]+(2,)` TypeError,需显式 `list+(2,)`...实际 [1]+(2,) 报错)。

```python
# 不兼容:报错,需显式
# "3" + 5          # TypeError(str+int)
# "3" + str(5)     # '35'(显式转 str)
# int("3") + 5     # 8(显式转 int)
# [1, 2] + 1       # TypeError(list+int)
# [1] + (2,)       # TypeError(list+tuple)
# b"ab" + "cd"     # TypeError(bytes+str)
```

这个边界很关键:**Python 不在"跨大类"间隐式转换**。str 与 int 看起来"3"和 3 都是"3",但 Python 不自动转——它要求你显式 `int("3")` 或 `str(3)`,明确意图。这与 JavaScript(`"3"+5` 得 `"35"`、`"3"*5` 得 `15`,混乱)截然不同——Python 选择"不兼容就报错",避免隐式转换引入歧义。

```python
# Python 不像 JS 那样隐式(str+num 报错,而非得 "35" 或 8)
# "3" + 5    # Python: TypeError(明确报错)
# JS: "3" + 5 → "35"(字符串拼接,隐式转 str)
# JS: "3" * 5 → 15(数学乘,隐式转 num)
# Python 不做这种隐式,逼你显式
```

这条"跨大类不隐式"是 Python 类型安全的重要设计——它避免 JS 那种"隐式转换致歧义"的坑。理解边界(数值塔内+bool+truthiness 自动,跨大类不自动),就掌握隐式转换何时发生何时不会,从而知道何时需显式转换。

建立这些认知后,后续章节展开各场景的完整规则与陷阱。

---

## 2. 核心内容

本章详解各类隐式转换场景。每节遵循"规则 → demo → 陷阱 → 场景"展开。数值提升、bool 即 int、除法规则是重点。

### 2.1 数值类型提升:int → float → complex

数值塔内的混合运算,Python 按"向宽提升"规则自动转换。详述各组合:

**int + float → float**(int 提升为 float):

```python
print(3 + 0.5)           # 3.5 —— 3 转 3.0,+0.5
print(2 * 3.0)           # 6.0 —— 2 转 2.0,*3.0
print(7 - 2.5)           # 4.5
print(10 / 3)            # 3.333...(float,但这是 / 的规则,见 2.3)
# 凡有 float 参与,结果 float
print(type(3 + 0.5))     # <class 'float'>
```

只要运算中有 float,int 就提升为 float,结果 float。这是最常见的隐式转换——整数与浮点混合,自动统一到浮点。

**int/float + complex → complex**(实数提升为 complex):

```python
print(3 + 1j)            # (3+1j) —— 3 转 (3+0j)
print(2.5 * (1+2j))      # (2.5+5j) —— 2.5 转 (2.5+0j)
print((1+2j) + 0.5)      # (1.5+2j) —— 0.5 转 (0.5+0j)
print(3.0 + (1+2j))      # (4+2j)
# 凡有 complex,结果 complex
print(type(3 + 1j))      # <class 'complex'>
```

complex 参与,所有操作数提升为 complex(实数变虚部0的复数),结果 complex。这与 int+float 同理——向最宽提升。

**纯 int 运算 → int**(不提升):

```python
print(3 + 5)             # 8 (int+int→int,无提升)
print(3 * 5)             # 15
print(7 - 2)             # 5
print(2 ** 10)           # 1024
# 纯 int 运算(除 / 外),结果仍是 int,无隐式转换
print(type(3 + 5))       # <class 'int'>
```

全 int 的 `+ - * // % **`(正指数)结果仍是 int,无隐式转换。只有混合 float/complex 才提升。

**幂运算的隐式转换**:

```python
print(2 ** 3)            # 8 (int**int 正指数→int)
print(2 ** -1)           # 0.5 (int**负指数→float,因负指数表分数)
print(2 ** 0.5)          # 1.414...(int**float→float)
print(2 ** 3 ** 2)       # 512 (右结合:2**(3**2)=2**9)
print((-2) ** 0.5)       # (8.65e-17+1.414j)(负数开方→complex!)
# 负数的非整数次幂 → complex(隐式转 complex)
```

幂运算的特殊隐式:`2 ** -1` 得 float(负指数=分数);`(-2) ** 0.5` 得 complex(负数开方=虚数,Python 自动转 complex)。这些是幂运算的隐式转换规则——根据数学结果类型自动选 int/float/complex。

**复数运算结果的隐式统一**:

```python
print((1+2j) * (3-1j))   # (5+5j) —— 复数乘法,结果 complex
print((1+2j) / (3-1j))   # (0.1+0.7j) —— 复数除法,结果 complex
# complex 间运算恒 complex
```

complex 间运算结果恒 complex(虚部可能为 0,但类型仍是 complex)。不会自动转回实数(即使虚部 0,如 `(3+0j) / (1+0j)` = `(3+0j)` 仍 complex)。

**隐式转换的精度影响**:int→float 提升可能丢精度(int 任意精度,float 受限):

```python
big = 2 ** 60           # int,精确(2^60)
print(big + 0.0)        # 1.152921504606847e+18 —— 转 float,+0.0 后
# 2^60 在 float 精度内仍精确,但更大数会丢
huge = 2 ** 70          # int 精确
print(huge + 0.0)       # 1.1805916207174113e+21 —— float,可能有精度损失
print(huge == int(huge + 0.0))  # 可能 False(float 精度不够,转回 int 不等)
```

int→float 隐式转换,对超大整数可能丢精度(因 float 只有约 15~17 位有效数字)。`huge + 0.0`(int 隐式转 float)可能丢精度,转回 int 不等于原值。这是隐式转换的潜在风险——大整数与 float 混算可能意外丢精度。

### 2.2 bool 隐式作为 int

bool 是 int 的子类(详见《bool 类型与短路逻辑》《int 类型详解》),运算时 bool **隐式当作 int**(True=1,False=0)。这是 bool 参与数值运算的隐式转换。

**bool 与 int 运算**:

```python
print(True + 1)          # 2 (True 当 1)
print(False + 1)         # 1 (False 当 0)
print(True * 5)          # 5
print(False * 100)       # 0
print(True - False)      # 1
# bool 隐式转 int 参与算术
print(type(True + 1))    # <class 'int'> —— 结果 int(bool 提升为 int)
```

bool 与 int 运算,bool 当 0/1,结果 int。这是因为 bool 是 int 子类——bool 对象"就是一个 int"(True 的 int 值是 1),故 `True + 1` 走 int+int,得 int 2。

**bool 与 float/complex 运算**:

```python
print(True + 0.5)        # 1.5 (True 当 1,提升为 1.0)
print(False + 0.5)       # 0.5
print(True * 3.0)        # 3.0
print(True + 2j)         # (1+2j) (True 当 1,转 (1+0j))
# bool 提升路径:bool → int → float → complex(按需)
```

bool 经 int 提升到 float/complex:`True+0.5` 经 `True→1→1.0` 提升,得 1.5。bool 沿数值塔逐级提升。

**bool 计数(常用技巧)**:

```python
# 统计满足条件的个数:bool 隐式转 int 求和
nums = [1, 2, 3, 4, 5, 6]
even_count = sum(n % 2 == 0 for n in nums)   # 3 (True=1 求和)
pass_count = sum(score >= 60 for score in [55, 90, 70])  # 2
# sum([True, False, True]) = 2
```

`sum(条件 for ...)` 利用 bool 隐式转 int(True=1)统计为真的项数。这是 bool 即 int 的典型应用——简洁计数。

**bool 在索引/切片(隐式当 int)**:

```python
lst = ['a', 'b', 'c']
print(lst[True])         # 'b' (True 当 1)
print(lst[False])        # 'a' (False 当 0)
# bool 隐式当 int 索引(合法但可读性差,不推荐)
```

bool 当索引(True=1, False=0)合法(bool 是 int),但极易误读,不推荐——要索引 1 直接写 1,别用 True。

**bool 算术的意外**:

```python
# bool 参与算术可能产生意外类型
result = True + True     # 2 (int,不是 bool!)
print(type(result))      # <class 'int'>
# bool 运算结果是 int 而非 bool
is_even = (4 % 2 == 0)   # True (bool)
# is_even + 1            # 2 (int)
```

bool 运算结果是 int 而非 bool——`True + True` 得 int 2(不是 bool)。`==`/`<` 等比较返回 bool,但 `+`/`*` 等算术返回 int。理解这点,避免"以为 bool 运算还是 bool"。

### 2.3 除法的类型规则:/ vs //

除法是隐式转换的高频场景,且 `/` 与 `//` 类型规则不同,是重点。Python 3 的除法设计明确:

**`/`(真除法,truediv)**:**永远返回 float**,即使操作数都是 int 且能整除。

```python
print(8 / 2)             # 4.0! —— int/int → float(即使整除)
print(7 / 2)             # 3.5
print(10 / 3)            # 3.333...
print(type(8 / 2))       # <class 'float'>
# / 永远 float,这是 Python 3 的规则
```

⚠️ **`8 / 2` 得 `4.0` 不是 `4`**——这是 Python 3 的除法规则(`/` 总返回 float)。新手常意外(以为整除得 int)。要整数结果用 `//`。

**`//`(地板除,floordiv)**:向负无穷取整,返回类型依操作数——全 int 返回 int,有 float 返回 float。

```python
print(8 // 2)            # 4 (int//int → int)
print(7 // 2)            # 3 (int//int → int,地板除)
print(8.0 // 2)          # 4.0 (float//int → float)
print(7.5 // 2)          # 3.0 (float//int → float)
print(8 // 2.0)          # 4.0 (int//float → float)
# 有 float 参与,// 返回 float(但值是地板取整的)
print(type(8 // 2))      # <class 'int'>
print(type(8.0 // 2))    # <class 'float'>
```

`//` 的返回类型:全 int → int,有 float → float。注意 `8.0 // 2` 得 `4.0`(float,值是地板取整的 4)。这与 `/`(永远 float)不同——`//` 依操作数决定类型。

**负数的地板除**(向负无穷,参《int 类型详解》):

```python
print(-7 / 2)            # -3.5 (/ 真除)
print(-7 // 2)           # -4! (// 地板,向负无穷,-3.5 → -4)
print(-7 % 2)            # 1 (% 余数与除数同号)
print(7 // -2)           # -4
print(7 % -2)            # -1
# 负数地板除向负无穷,与 C/Java 向零不同
```

`-7 // 2` = -4(向负无穷,不是 -3)。这是 Python `//`/`%` 的负数规则(与 C/Java 不同),隐式转换不涉及,但与除法类型规则相关。

**`%` 取余的类型规则**(同 `//`):

```python
print(7 % 2)             # 1 (int%int → int)
print(7.5 % 2)           # 1.5 (float%int → float)
print(7 % 2.0)           # 1.0 (int%float → float)
# % 类型规则同 //:全 int → int,有 float → float
```

`%` 的类型规则同 `//`(全 int→int,有 float→float)。

**`divmod` 同时取商余**(类型规则同 `//`):

```python
print(divmod(7, 2))      # (3, 1) (int,int)
print(divmod(7.5, 2))    # (3.0, 1.5) (float,float)
print(divmod(8, 2))      # (4, 0) (int,int)
# divmod 返回 (商, 余),类型依操作数
```

**除法规则总结**:

| 运算 | 全 int | 有 float | 有 complex |
|------|--------|---------|-----------|
| `/` | float | float | complex |
| `//` | int | float | 不支持(complex 无 //) |
| `%` | int | float | 不支持(complex 无 %) |

`/` 恒 float(complex 时 complex);`//`/`%` 全 int→int、有 float→float、complex 不支持。理解这张规则表,就能预判任何除法/取余结果的类型。

⚠️ **complex 不支持 // 和 %**:

```python
# (3+4j) // 2    # TypeError:complex 无 //
# (3+4j) % 2    # TypeError:complex 无 %
# complex 只支持 / (复数除法)
print((3+4j) / 2)        # (1.5+2j) (complex)
```

复数无"整除""取余"概念(无自然序/无整除定义),故 `//`/`%` 对 complex 报 TypeError。complex 只支持 `/`(复数除法,返回 complex)。

### 2.4 比较与布尔运算的隐式转换

比较运算(`==`/`!=`/`</>`/`<=`/`>=`)和布尔运算(`and`/`or`/`not`)也涉及隐式转换,规则各有特点。

**数值间比较(隐式统一)**:int/float/complex 间可比较,Python 隐式统一后比:

```python
print(3 == 3.0)          # True (int 与 float 比较,值相等)
print(3 == 3 + 0j)       # True (int 与 complex,实数=虚部0复数)
print(3.0 == 3 + 0j)     # True
print(3 < 3.5)           # True (int<float,隐式统一)
print(3 < 3.5 + 0j)      # False?complex 不可排序,见下
# 数值间 == 比值,隐式统一
```

`==`/`!=` 在数值间比"值"(隐式统一,3==3.0==3+0j 都真)。但 `</>`/`<=`/`>=` **只对实数**(int/float)有意义,complex 不可排序:

```python
print(3 < 3.5)           # True (int/float 可比)
# (1+2j) < (3+4j)        # TypeError:complex 不可排序
# 3 < (1+2j)             # TypeError
# == 可比(complex),< 不可比
print((1+2j) == (1+2j))  # True (complex == 比)
```

complex 支持 `==`/`!=`(比实虚部),不支持 `</>`(无序)。这是比较的隐式边界。

**== 的隐式统一细节**:`3 == 3.0` 时,Python 把 3 提升为 3.0 比较(或反之),值相等故 True。`(3+0j) == 3` 时,complex 与 int 比,比实虚部(3+0j 实部3虚部0,与 int 3 等价)故 True。这是比较时的隐式统一。

**bool 与数值比较**(bool 是 int):

```python
print(True == 1)         # True (bool 当 1)
print(False == 0)        # True
print(True > 0)          # True (bool 当 1,>0)
print(True + 1 == 2)     # True (True+1 → 2,== 2)
```

bool 与数值比较/运算,bool 当 0/1。`True == 1` True(True 是 int 子类,值1)。

**布尔运算的真值隐式**(`and`/`or`/`not`):

```python
# and/or/not 接受任意对象,隐式真值测试(truthiness)
print(0 and "x")         # 0 (0 为假,返回 0,短路)
print(5 and "x")         # 'x' (5 为真,返回 'x')
print("" or "default")   # 'default' ('' 为假,返回 default)
print(not [])            # True ([] 为假,not → True)
# and/or/not 把操作数隐式转 bool(真值测试),但返回操作数本身(and/or)
```

`and`/`or`/`not` 对任意对象做**真值测试**(隐式转 bool 判真假),`and`/`or` 返回操作数本身(非 bool 值),`not` 返回 bool。这是布尔运算的隐式转换——任意对象隐式判真假。详见《bool 类型与短路逻辑》。

**`if`/`while` 条件的隐式真值**:

```python
if 0: ...           # 0 隐式转 bool,False
if [1,2]: ...       # 非空 list 隐式转 True
if "": ...          # 空串隐式 False
if None: ...        # None 隐式 False
# if 条件隐式真值测试(任意对象→bool)
```

`if`/`while` 条件接受任意对象,隐式真值测试转 bool。这是最常见的隐式转换——每个 `if x:` 都隐式把 x 转 bool。

**`in` 成员判断的隐式**:容器 `in` 不"转类型",但要求类型匹配:

```python
print(3 in [1, 2, 3])     # True
print("3" in [1, 2, 3])   # False!("3" 是 str,与 int 元素不相等,不隐式转)
print(3 in {"3": 1})      # False(3 是 int,key "3" 是 str,不匹配)
# in 不隐式转类型,str "3" 不会转 int 3 去匹配
```

⚠️ `in` **不隐式转类型**——`"3" in [1,2,3]` 是 False(字符串 "3" 与 int 元素不等,不自动转 int)。这与某些语言不同,Python `in`/`==` 在"数值 vs 字符串"不隐式转换(必须显式)。这是跨大类不隐式的体现。

### 2.5 不发生隐式转换的场景(报错)

Python 隐式转换克制,跨大类不自动。这节列举**不隐式转换**(报错,需显式)的场景,这是边界的关键。

**str 与数值不隐式**:

```python
# "3" + 5          # TypeError(str + int)
# "3" * 5           # '33333'?这是 str*int(重复,非数学),合法但非隐式转换
# "3" + str(5)      # '35'(显式转 str)
# int("3") + 5      # 8(显式转 int)
# "3" == 3          # False(str 与 int 不隐式比,值不等)
print("3" * 5)      # '33333'(str*int 是"重复"运算,非隐式转换,是 str 的 __mul__)
```

`"3" + 5` TypeError(str 的 `__add__` 不接 int,int 的 `__radd__` 不接 str,无隐式转换)。`"3" * 5` 得 `'33333'`——但这不是"隐式转换",是 str 的 `*` 定义为"重复"(str 的 `__mul__` 接 int 表重复次数),是 str 类的方法行为,不是类型转换。`"3" == 3` False(str 与 int 比较不隐式转,直接判不等)。

**bytes 与 str 不隐式**:

```python
# b"ab" + "cd"      # TypeError(bytes + str)
# b"ab" == "ab"     # False(bytes 与 str 不等,不隐式)
print(b"ab".decode() + "cd")   # 'abcd'(显式 decode 转 str)
```

bytes 与 str 不隐式互转(需 encode/decode 显式)。`b"ab" + "cd"` TypeError,`b"ab" == "ab"` False(不隐式比)。

**容器与数值不隐式**:

```python
# [1,2] + 1         # TypeError(list + int)
# [1,2] + 3.0       # TypeError
# [1] + (2,)        # TypeError(list + tuple,不同容器不隐式合并)
# {"a":1} + {"b":2} # TypeError(dict 无 +)
# [1,2] * 2         # [1,2,1,2](list*int 重复,非隐式转换,是 list.__mul__)
print([1,2] * 2)    # [1, 2, 1, 2](重复,不是转换)
```

容器与数值、不同容器间不隐式合并(`[1]+1` TypeError)。`[1,2]*2` 是 list 重复(非隐式转换,是 list 的 `__mul__`)。dict 无 `+`(不能合并,3.9+ 用 `|`)。

**宽→窄不隐式降级**:

```python
z = 3 + 4j
# float(z)    # TypeError(complex 不直接转 float,需取 .real)
# int(z)      # TypeError
# int(3.5)    # 这是显式(隐式不会 float→int)
print(z.real)         # 3.0(显式取实部)
print(int(3.5))       # 3(显式截断)
# 降级有信息损失,Python 不自动,需显式
```

complex→float、float→int 不自动(降级丢信息),需显式。`int(3.5)` 是显式转换(非隐式)。

**比较的跨大类不隐式**:

```python
# 3 < "5"        # TypeError(int 与 str 不可比,Python 3)
# [1] < (1,)     # TypeError(list 与 tuple 不可比?实际可比同类型元素?
print([1] < [2])     # True(同类型 list 比)
# [1] < (1,)     # TypeError(Python 3:不同序列类型... 实际 list 与 tuple 比较报错)
```

Python 3 禁止跨大类比较(`3 < "5"` TypeError,数字与字符串不比;list 与 tuple 不比)。同类型可比(`[1]<[2]`)。这是 Python 3 的改进(2 允许混乱跨类比较)。

理解这些"不隐式"场景(str↔数值、bytes↔str、容器↔数值、宽→窄、跨大类比较均不自动),就掌握隐式转换的边界——Python 只在数值塔内+bool+truthiness 自动,其余需显式,避免 JS 式隐式混乱。

### 2.6 综合示例:隐式转换在各运算中的表现

下面这个片段综合演示隐式转换与不转换的边界:

```python
# 1. 数值提升:int → float → complex
print("数值提升:")
print(f"  3 + 0.5 = {3 + 0.5} ({type(3+0.5).__name__})")      # 3.5 float
print(f"  3 + 1j = {3 + 1j} ({type(3+1j).__name__})")        # (3+1j) complex
print(f"  2 ** -1 = {2 ** -1} ({type(2**-1).__name__})")      # 0.5 float(负指数)
print(f"  (-2)**0.5 = {(-2)**0.5} ({type((-2)**0.5).__name__})")  # complex(负数开方)

# 2. bool 即 int
print("bool 隐式:")
print(f"  True + 1 = {True + 1} ({type(True+1).__name__})")   # 2 int
print(f"  sum([T,F,T]) = {sum([True, False, True])}")          # 2
counts = sum(n > 2 for n in [1,2,3,4,5])   # 3(>2 的个数)
print(f"  >2 的个数 = {counts}")

# 3. 除法规则
print("除法规则:")
print(f"  8/2 = {8/2} ({type(8/2).__name__})")    # 4.0 float
print(f"  8//2 = {8//2} ({type(8//2).__name__})")   # 4 int
print(f"  8.0//2 = {8.0//2} ({type(8.0//2).__name__})")  # 4.0 float
print(f"  -7//2 = {-7//2}, -7%2 = {-7%2}")    # -4, 1(向负无穷)

# 4. 比较(数值间隐式统一)
print("比较:")
print(f"  3 == 3.0: {3 == 3.0}")      # True
print(f"  3 == 3+0j: {3 == 3+0j}")    # True
print(f"  3 < 3.5: {3 < 3.5}")        # True
# complex 不可排序(报错,注释)
# 5. 不隐式转换(报错场景,注释展示)
print("不隐式(需显式):")
# "3" + 5    # TypeError
# "3" == 3   # False(不隐式)
print(f"  '3' == 3: {'3' == 3}")      # False(str 与 int 不隐式)
print(f"  int('3') + 5 = {int('3') + 5}")  # 8(显式)
# 6. 大整数与 float 混算丢精度
huge = 2 ** 70
print(f"  2^70 (int) = {huge}")
print(f"  2^70 + 0.0 (float) = {huge + 0.0}")
print(f"  转回 int 相等? {huge == int(huge + 0.0)}")  # 可能 False(精度)
```

跑一遍这段示例(注意不隐式场景的报错注释),对照输出:数值提升(int→float→complex)、bool 当 int、除法 `/` float/`//` 依操作数、比较隐式统一、str↔int 不隐式、大整数 float 精度损失——隐式转换的全部表现与边界就清晰了。

核心结论:**隐式转换只在数值塔内(int→float→complex)与 bool↔int 及 truthiness 自动发生,`/` 恒 float、`//`/% 依操作数,跨大类(str/bytes/容器)与宽→窄降级不自动(需显式),大整数与 float 混算可能丢精度**。

---

## 3. 最佳实践

### 3.1 知道 `/` 恒返回 float,要整数结果用 //

```python
# / 恒 float(即使整除)
avg = 10 / 2          # 5.0(float)
# 要 int 商
count = 10 // 2       # 5(int)
page = total // page_size   # 整数页码(// 得 int)
```

`/` 永远 float,`8/2` 得 `4.0`。要整数结果(页码、索引、计数)用 `//`。`/` 适合需精确商(含小数)。别误用 `/` 期望整数。

### 3.2 大整数与 float 混算注意精度损失

```python
huge = 2 ** 70        # int 精确
# huge + 0.0          # 转 float,可能丢精度(2^70 超 float 精度)
# 保留 int 精度:别让大 int 与 float 混算
# 需大数浮点用 Decimal,或全 int 运算
```

int 任意精度,float 约 15~17 位有效。大整数(>2^53)与 float 混算(int→float 提升)会丢精度。保留大整数精度:别与 float 混算,或用 Decimal。这是隐式转换的潜在坑。

### 3.3 跨大类(str/bytes/数值)不隐式,显式转换明确意图

```python
# Python 不隐式(str+num 报错),显式明确:
# "count:" + 5          # TypeError(不隐式)
"text:" + str(5)        # 'text:5'(显式转 str)
int("42") + 5           # 47(显式转 int)
b"ab".decode() + "cd"   # 'abcd'(显式 decode)
```

Python 跨大类不隐式转换(str↔int、bytes↔str 等需显式)。这是优点(避免 JS 式歧义),但要求你显式写转换——`str(5)`/`int("42")`/`.decode()` 等。明确意图,别期望自动。

### 3.4 bool 参与运算当 int,计数可用 sum(条件),但注意类型

```python
# 简洁计数
even = sum(n % 2 == 0 for n in nums)   # bool 隐式 int
# 注意:bool 运算结果是 int 不是 bool
flag = True + True   # 2 (int,不是 bool)
# 需 bool 结果用 and/or/not 或比较,不是算术
```

bool 隐式 int(True=1),`sum(条件)` 计数简洁。但 bool 算术结果是 int 不是 bool——`True+True` 是 int 2。需 bool 结果用布尔运算,不用算术。

### 3.5 真值测试隐式转 bool,判别注意 0/''/[] 与 None

```python
# if x: 隐式 bool(0/''/[]/None 为假)
if items: ...          # 非空容器为真
if not x: ...          # x 是 0/''/[]/None 都为假(注意 None 与 0 都触发)
# 区分:判 None 用 is None,判假值用 if x
if x is None: ...      # 仅 None(不把 0/'' 误判)
```

`if x:`/`if not x:` 隐式真值测试,0/''/[]/None 都为假。要精确判 None 用 `is None`(不把 0/'' 误当 None)。区分"判假值"与"判 None"。

### 3.6 负数整除 // 与取余 % 向负无穷,与 C/Java 不同

```python
# Python(向负无穷)
-7 // 2   # -4
-7 % 2    # 1
# C/Java(向零)
# -7 / 2 = -3, -7 % 2 = -1
# 需向零用 int(a/b) 或 math.trunc
```

Python `//`/`%` 负数向负无穷(余数与除数同号),与 C/Java 向零不同。分页/日期/索引涉及负数时验证,需向零用 `int(a/b)`/`math.trunc`。别套其他语言直觉。

### 3.7 complex 不支持 // 和 %,需实数运算先取实部

```python
z = 3 + 4j
# z // 2    # TypeError(complex 无 //)
# z % 2     # TypeError
# 需实数运算取 .real
int(z.real) // 2    # 1
```

complex 无整除/取余概念,`//`/`%` 报 TypeError。需实数运算取 `.real`/`.imag`(float)再算。理解 complex 的运算限制。

### 3.8 == 在数值间隐式统一,但跨大类(str/数值)不隐式

```python
3 == 3.0         # True(数值间隐式)
3 == 3 + 0j      # True
"3" == 3         # False(str 与 int 不隐式,直接不等)
# 注意:in 也不隐式("3" in [1,2,3] 是 False)
```

`==` 在数值间(int/float/complex)隐式统一比真值。但 str 与数值不隐式比(`"3"==3` False,不转)。`in` 同理不隐式(`"3" in [1,2,3]` False)。别期望字符串"3"自动匹配数字 3。

### 3.9 混合类型运算理解提升方向,预判结果类型

```python
# 向宽提升:int → float → complex
int + float → float
int + complex → complex
float + complex → complex
# 预判结果类型,避免意外
result = 3 + 0.5 + 1j   # (3.5+1j) complex(最宽)
```

混合运算向宽提升,结果是参与类型中最宽的。预判:`int+float+complex` → complex。理解提升方向,就预判结果类型,避免"以为得 int 实得 float/complex"的意外。

### 3.10 不依赖隐式转换写含糊代码,必要时显式更清晰

```python
# 含糊(依赖隐式,读者需推类型)
total = some_bool + some_int + some_float
# 清晰(显式,类型明确)
total = int(some_bool) + some_int + some_float   # 或保持隐式但注释
# 隐式转换方便,但复杂表达式显式更易读
```

简单混合运算用隐式(`3+0.5`)自然。但复杂表达式(多类型混合)显式转换或注释更清晰,避免读者纠结类型。平衡便利与可读。

### 3.11 布尔运算 and/or 返回操作数本身非 bool,理解真值

```python
x = 0 and "x"      # 0(0 为假,返回 0,非 bool)
y = 5 or "default" # 5(5 为真,返回 5,非 bool)
z = not []         # True(not 返回 bool)
# and/or 真值测试但返回操作数,用作默认值: x or default
```

`and`/`or` 隐式真值测试但返回操作数本身(非 bool),`not` 返回 bool。`x or default`(设默认值)利用这点。理解区别,正确用作控制流/默认值。

### 3.12 浮点精度问题源自 float,隐式转换放大注意

```python
# int 与 float 混算 → float,继承精度问题
print(0.1 + 0.2)         # 0.30000000000000004
# 全 int 运算无此问题
print(1 + 2)             # 3 精确
# 金额用 int(分)避免 float 精度,别让金额隐式转 float
```

int 与 float 混算隐式转 float,继承 float 精度问题(`0.1+0.2!=0.3`)。金额等精度敏感场景用 int(分)全程整数,别让金额隐式转 float(如 `price * 0.85` 利率计算变 float)。详见《float 类型与精度问题》。

---

## 4. 原理

本章讲清隐式转换的机制:数值塔与子类型关系、运算符重载(`__add__`/`__radd__`/`__mul__`)如何驱动转换、`/` 恒 float 的 Python 3 设计、bool 继承 int 的转换路径、truthiness 的 `__bool__`/`__len__`、为何跨大类不隐式(运算符 protocol 不匹配)。这些是"隐式转换为何如此"的根基。

### 4.1 数值塔与子类型关系(需理解,详述)

隐式转换的方向由**数值塔**与**子类型关系**决定。Python 的数值类型有明确的"宽度"与继承关系,int→float→complex。

**数值塔的抽象**:Python 的数值抽象基类层级(numbers 模块):

```
Number
 ├─ Complex(complex)
 │   ├─ Real(float)
 │   │   ├─ Rational(Fraction)
 │   │   │   ├─ Integral(int)
```

`int` 是 `Integral` 子类,`Integral` 是 `Rational` 子类,... 最终 `int <: float <: complex`(子类型关系)。`float` 比 `int` 宽(能表示 int 的值,加小数),`complex` 比 `float` 宽(加虚部)。子类型关系决定了提升方向——窄类型(int)是宽类型(float)的"子集",运算时向宽提升。

**提升规则的子类型根源**:`int + float` 时,int 是"实数的一个子集"(整数),float 是更一般的实数。为统一运算,int "提升"为 float(整数可作 float 表示),然后 float+float。这是"窄类型提升为宽类型"的子类型逻辑——窄的是宽的特例,提升无损(整数能精确转 float,虽大数丢精度但语义上无损)。

```python
# 提升链:int → float → complex
# 每步是"窄类型作为宽类型的特例"
# int (整数) 是 float (实数) 的特例(整数是实数)
# float (实数) 是 complex (复数) 的特例(实数是虚部0的复数)
```

**不降级的子类型逻辑**:complex→float、float→int 不自动,因降级有损失(complex 丢虚部、float 丢小数)。子类型关系下,"子类型(窄)可安全提升为父类型(宽)"(无损),但"父类型(宽)降为子类型(窄)"有损,故需显式。这是"向宽自动、向窄显式"的子类型根源——保护信息不丢失。

**bool <: int <: float <: complex 的完整链**:

```python
# bool 是 int 子类,int 是 float 子类(数值上),float 是 complex 子类(数值上)
# 提升链:bool → int → float → complex
# True + 0.5 经:True(bool) → 1(int) → 1.0(float) → +0.5 = 1.5
print(True + 0.5)   # 1.5
```

bool 参与运算,沿 `bool→int→float→complex` 链提升:`True+0.5` 经 True→1(int)→1.0(float)+0.5=1.5。这是 bool 即 int 的提升路径根源——bool 是 int 子类,先当 int,再按数值塔提升。

理解数值塔(int→float→complex)与子类型关系(窄是宽的特例、向宽提升无损、向窄降级有损需显式),就理解隐式转换方向的全部逻辑——它不是任意规则,是子类型关系的自然推导。

### 4.2 运算符重载:__add__/__radd__ 驱动转换(需理解,详述)

隐式转换的实际发生,在运算符重载层面——每个类型的运算符方法(`__add__` 等)决定如何处理其他类型操作数。讲清这套机制就理解"转换在哪发生、为何跨大类报错"。

**运算符的方法查找**:`a + b` 时,Python 先试 `a.__add__(b)`,若返回 `NotImplemented`(a 不知如何加 b),再试 `b.__radd__(a)`(反射加法):

```python
# 3 + 0.5 的内部:
# 1. int.__add__(3, 0.5) —— int 不直接加 float,返回 NotImplemented
# 2. float.__radd__(0.5, 3) —— float 知道加 int,把 3 转 1.0(float),1.0+0.5=1.5
# 结果 1.5(float)
```

`3 + 0.5`:int 的 `__add__(0.5)` 不知直接加 float(返回 NotImplemented),Python 转 `float.__radd__(3)`——float 的反射加法,把 int 3 转 float 3.0,相加得 3.5。这是数值隐式转换的方法查找机制——通过 `__add__`/`__radd__` 协作,由"更宽类型"(float)的方法处理混合运算,实现隐式提升。

**int/float/complex 的运算符协作**:数值类型重写了 `__add__`/`__radd__` 等,接受数值类型并提升:

```python
# int.__add__(float) → NotImplemented → float.__radd__(int) → float
# float.__add__(complex) → NotImplemented → complex.__radd__(float) → complex
# 通过 __radd__ 反射,由宽类型的运算符处理,实现自动提升
```

这套 `__add__`/`__radd__` 协作,让 int+float 由 float 处理(提 int 升 float)、float+complex 由 complex 处理(提 float 升 complex)。是隐式转换的运算符机制。

**跨大类不隐式的机制——运算符返回 NotImplemented 且无反射处理**:

```python
# "3" + 5 的内部:
# 1. str.__add__("3", 5) —— str 的 __add__ 只接 str,接 int 返回 NotImplemented
# 2. int.__radd__(5, "3") —— int 的 __radd__ 只接数值,接 str 返回 NotImplemented
# 3. 两都 NotImplemented → Python 抛 TypeError
```

`"3" + 5`:str 的 `__add__(5)` 不接 int(NotImplemented),int 的 `__radd__("3")` 不接 str(NotImplemented),两都失败,Python 抛 TypeError。这就是跨大类不隐式的机制根源——**两边运算符都不接受对方类型,无隐式转换发生**。str 不"自动转 int",int 不"自动转 str",因各自的 `__add__`/`__radd__` 未实现跨类处理。

**对比:为何 str * int 合法**:

```python
# "3" * 5 的内部:
# str.__mul__("3", 5) —— str 的 __mul__ 接受 int 表示"重复 5 次",返回 "33333"
# 不需要 __rmul__,因 str.__mul__ 直接处理了
print("3" * 5)   # '33333'
```

`"3" * 5` 合法,因 str 的 `__mul__` **特意实现了接 int 表重复**(str 类的方法设计)。这不是"隐式转换"(str 没转 int),是 str 的 `__mul__` 定义了"str * int = 重复"。同理 list * int 重复。这些是类的方法行为,非类型转换。

理解运算符重载(`__add__`/`__radd__`/`__mul__` 协作、NotImplemented 触发反射、跨类无处理则 TypeError),就理解隐式转换的机制根源与边界——**转换是否发生,取决于运算符方法是否实现了跨类处理**,数值类型实现了(隐式提升),str/bytes/容器未实现(跨类报错)。

### 4.3 / 恒返回 float 的 Python 3 设计

§2.3 讲了 `/` 恒返回 float,这里讲清其设计根源——Python 3 对 Python 2 除法的重要改动。

**Python 2 的 `/`**:对整数操作数,`/` 做**整除**(地板除):

```python
# Python 2:
# 7 / 2 == 3 (int/int → int,整除)
# 7.0 / 2 == 3.5 (有 float → float)
# 问题:7/2 在 int 得 3,有 float 得 3.5,行为不一致,易错
```

Python 2 的 `/` 对全 int 做整除(7/2=3),有 float 做真除(7.0/2=3.5)。这导致 `/` 行为依赖操作数类型,易错(写 `7/2` 以为 3.5 实得 3)。

**Python 3 的 `/` 改为恒真除**:PEP 238 把 `/` 改为**永远真除**(返回 float),新增 `//` 表整除:

```python
# Python 3:
# 7 / 2 == 3.5 (永远 float,真除)
# 7 // 2 == 3 (整除,新运算符)
# 7.0 / 2 == 3.5
# 7.0 // 2 == 3.0
```

Python 3 的设计:`/` 恒真除(float,语义明确"除法得商"),`//` 表整除(地板,语义"取整商")。这消除了 Python 2 `/` 的类型依赖歧义——`/` 永远给精确商(float),要整数用 `//`。这是 PEP 238 的核心改进,虽让 `8/2=4.0`(新手意外),但语义一致清晰。

**为何 `/` 恒 float 而非"能整除则 int"**:`8/2` 能整除,为何不返回 int 4?一致性——`/` 若"能整除返回 int、不能返回 float",则 `/` 结果类型依赖值(是否整除),又回到 Python 2 的不一致。Python 3 选择 `/` 恒 float(类型只依赖运算符不依赖值),最一致。要 int 用 `//`(类型依操作数但不依值)。这是"一致性优先"的设计选择。

理解 `/` 恒 float 是 PEP 238 的刻意设计(消除 Python 2 类型依赖、一致性优先),就理解为何 `8/2=4.0`——不是 bug,是为了一致性而明确的设计。

### 4.4 bool 继承 int 的转换路径

§2.2 讲了 bool 隐式当 int,这里讲清其转换路径根源——bool 继承 int,在数值塔中位于 int 之下。

**bool <: int 的子类关系**:

```python
print(issubclass(bool, int))   # True —— bool 是 int 子类
print(bool.__mro__)            # (bool, int, object)
```

bool 继承 int,MRO 是 `bool → int → object`。这意味着 bool 对象"就是一个 int"(True 的 int 值 1)。在数值运算中,bool 被当作 int(最靠近的数值类型),再按数值塔提升。

**bool 的转换路径**:bool 参与数值运算时,沿 `bool → int → float → complex` 提升:

```python
# True + 0.5 的提升路径
# 1. True(bool) 当作 int 1(bool 是 int 子类)
# 2. 1(int) 与 0.5(float) 混算,int 提升为 float → 1.0
# 3. 1.0 + 0.5 = 1.5(float)
print(True + 0.5)   # 1.5
```

True+0.5:True 先当 int 1(子类当父类),1 再提升为 float 1.0(数值塔),+0.5=1.5。bool 在数值塔最底层(int 之下),逐级提升。

**bool 算术结果是 int 而非 bool 的原因**:

```python
print(type(True + True))   # <class 'int'> —— 结果 int 非 bool
# bool 的 __add__ 未重写,继承 int.__add__,返回 int
# 故 bool 运算走 int 运算,得 int(不强制回 bool)
```

bool 未重写 `__add__`(继承 int 的),故 bool+bool 走 int+int,得 int(2),而非 bool。这解释"bool 算术结果是 int"——bool 沿继承用 int 的运算符,结果自然 int。要 bool 结果需布尔运算(and/or/not/比较),非算术。

**bool 在比较中的隐式**:`True == 1` 时,bool 沿继承当 int 1,与 int 1 比,相等。`True > 0` 当 1>0。这都是 bool<:int 的体现——bool 在数值语境自动作 int。

理解 bool <: int 的子类关系与转换路径(bool→int→float→complex 逐级提升、算术继承 int 得 int),就理解 bool 在数值运算中的全部行为根源。

### 4.5 truthiness 的 __bool__/__len__ 与跨类不隐式的协议根源

§2.4 讲了 truthiness(if/and/or 隐式真值)与跨类不隐式,这里讲清其协议根源。

**truthiness 的 `__bool__`/`__len__` 协议**:任意对象在布尔语境(if/while/and/or/not)隐式转 bool,通过:

1. 调 `type(obj).__bool__(obj)`(若定义),返回 bool。
2. 否则调 `type(obj).__len__(obj)`(若定义),非0→True,0→False。
3. 否则默认 True。

```python
# if [1,2]: 的内部
# 1. list 无 __bool__,转 2
# 2. list.__len__([1,2]) = 2,非0 → True
# 故 if [1,2]: 真
# if []: list.__len__([]) = 0 → False
```

`if [1,2]:` 通过 `list.__len__`(=2,非0)→ True。空容器 `__len__`=0→False。这是 truthiness 的协议——容器靠 `__len__`,自定义类靠 `__bool__`/`__len__`。任意对象都能 truthiness,这是"隐式转 bool"的统一协议。

**truthiness 是"隐式转 bool"但非"类型转换"**:truthiness 把任意对象转 bool(用于条件),但它不改变对象本身——`and`/`or` 返回操作数本身(非 bool 值),`if x:` 只用 x 的真值不存 x。这与数值隐式转换(int→float 提升产生新 float)不同——truthiness 是"判断"非"转换产生新对象"。但广义上,它属隐式"类型适配"(任意→bool 判定),归入隐式转换讨论。

**跨类不隐式的协议根源**:为何 str+int 报错而 int+float 不?根源是**运算符协议**——数值类型实现了跨数值的运算符(int 的 `__add__` 接 float 表提升),str/bytes/容器未实现跨类运算符:

```python
# int.__add__ 接受 int/float(数值,实现提升)?实际 int.__add__ 对 float 返回 NotImplemented,由 float.__radd__ 处理
# str.__add__ 只接 str(不接 int,返回 NotImplemented)
# int.__radd__ 只接数值(不接 str,返回 NotImplemented)
# 故 str+int 两边 NotImplemented → TypeError
```

str+int 报错,因 str 的 `__add__` 不接 int、int 的 `__radd__` 不接 str(两 NotImplemented)。这是"跨类运算符未实现"的协议根源——Python 不在跨类间隐式转换,因各类型的运算符方法只处理"语义兼容"的类型(数值处理数值、str 处理 str),不跨类。

**与 JS 的设计哲学对比**:JavaScript 在跨类隐式转换(`"3"+5`→"35"、`"3"*5`→15、`[]+[]`→""),通过复杂的隐式 coercion 规则。Python 选择**不跨类隐式**——运算符方法不跨类处理,直接报错,逼显式。这是"显式优于隐式"(PEP 20:Explicit is better than implicit)的体现——Python 宁可让你写 `str(5)`/`int("3")`,也不让 `"3"+5` 歧义地得 "35" 或 8。

理解 truthiness 的 `__bool__`/`__len__` 协议、跨类不隐式的运算符协议根源、与 JS 的哲学对比,就彻底理解隐式转换的边界——**Python 只在运算符方法实现了跨类处理的类型间隐式(数值),其余跨类不隐式(报错逼显式),这是"显式优于隐式"的设计**。

---

## 5. 总结

### 5.1 本文内容回顾

- **隐式转换定义**:运算时 Python 自动的类型提升,相对显式(主动调用);发生在运算符作用于不同类型时;让混合运算自然书写但可能意外。
- **数值塔**:int→float→complex 宽度递增;提升规则向宽提升(int+float→float 等);宽→窄不自动(complex→float、float→int 需显式,因有损);bool <: int <: float <: complex。
- **数值提升**:int+float→float、int/float+complex→complex、纯 int 运算→int;幂运算特殊(int**负指数→float、负数开方→complex);大整数与 float 混算丢精度。
- **bool 即 int**:bool 是 int 子类,运算当 0/1;True+1=2、sum(条件)计数;算术结果是 int 非 bool;bool 当索引(不推荐)。
- **除法规则**:`/` 恒 float(Python 3 PEP 238,即使整除 8/2=4.0);`//`/% 依操作数(全 int→int,有 float→float);负数向负无穷(与 C/Java 不同);complex 不支持 // 和 %。
- **比较/布尔**:数值间 == 隐式统一比真值(3==3.0==3+0j);complex 不可排序(无 </>);and/or/not 真值测试(and/or 返回操作数非 bool);if/while 隐式 truthiness;in 不隐式转类型。
- **不隐式(报错)**:str↔数值(bytes↔str、容器↔数值、宽→窄、跨大类比较均不自动;需显式转换);Python 选择不跨类隐式(显式优于隐式,避免 JS 式歧义)。
- **原理**:数值塔与子类型关系(窄是宽特例、向宽提升无损、向窄降级有损需显式);运算符重载 `__add__`/`__radd__`/`__mul__` 驱动转换(NotImplemented 触发反射、数值类实现跨数值处理故隐式、str/bytes 未实现故跨类报错);`/` 恒 float 是 PEP 238 一致性设计(消除 Python 2 类型依赖);bool <: int 转换路径(bool→int→float→complex 逐级、算术继承 int 得 int);truthiness 的 `__bool__`/`__len__` 协议、跨类不隐式的运算符协议根源(显式优于隐式哲学)。
- **最佳实践**:`/` 恒 float 要 int 用 //、大整数忌 float 混算、跨大类显式转换、bool 计数注意类型、truthiness 区分 None/假值、负数整除向负无穷、complex 无 // %、== 数值间隐式跨类不隐式、预判提升方向、复杂表达式显式更清、and/or 返回操作数、金额用 int 防 float 精度。

### 5.2 读完本文你应能掌握

- 说明隐式转换的定义,区分隐式(运算自动)与显式(主动调用)。
- 阐述数值塔(int→float→complex)与提升规则,预判混合运算结果类型(int+float→float 等),说明宽→窄不自动的原因。
- 说明 bool 即 int 的隐式表现(True+1=2、sum 计数、算术得 int 非 bool)。
- 区分 `/`(恒 float)与 `//`/%(依操作数)的类型规则,预判 `8/2=4.0`、`8//2=4`、`8.0//2=4.0`,说明负数向负无穷。
- 说明数值间比较的隐式统一(3==3.0==3+0j)、complex 不可排序、truthiness 隐式转 bool。
- 识别不隐式转换的场景(str↔数值、bytes↔str、跨大类、宽→窄 报错需显式),说明 Python 不跨类隐式的设计(显式优于隐式)。
- 阐述数值塔子类型关系、运算符重载驱动转换、`/` PEP 238 设计、bool 继承 int 路径、truthiness 协议、跨类不隐式的协议根源等原理。

### 5.3 延伸方向

- **显式类型转换**:主动调用的转换(int/str/encode 等),与隐式互补,见《显式类型转换》。
- **各类型专题**:`int` 任意精度、`float` 精度问题(隐式转 float 的精度风险)、`complex` 运算限制、`bool` 继承 int,见对应专题。
- **运算符与表达式**:运算符重载(`__add__`/`__radd__`/`__mul__` 等)、运算符优先级、表达式求值,见《运算符与表达式》大章节。
- **bool 类型与短路逻辑**:truthiness 规则、and/or 短路与返回操作数、bool 即 int 完整行为,见《bool 类型与短路逻辑》。
- **变量赋值机制**:数值塔的子类型关系、对象模型与类型,以及 Python 2→3 除法演进历史,深入类型系统。
