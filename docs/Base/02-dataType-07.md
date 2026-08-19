---
group:
  title: 【02】基础数据类型和类型系统
  order: 2
order: 7
title: complex复数类型
nav:
  title: Python基础
  order: 1
---

# complex复数类型

## 1. 介绍

### 1.1 什么是 complex 类型

`complex` 是 Python 中表示复数(complex number)的内置类型。复数形如 `a + bj`,其中 `a` 是**实部**(real part)、`b` 是**虚部**(imaginary part),`j`(或 `J`)是虚数单位,满足 `j² = -1`。Python 把复数作为**内置类型原生支持**,无需导入任何模块即可直接使用——这是 Python 相对许多通用语言的一个特色。

```python
z = 3 + 4j
print(z)               # (3+4j)
print(type(z))         # <class 'complex'>
print(z.real)          # 3.0 —— 实部
print(z.imag)          # 4.0 —— 虚部
```

复数在日常业务编码(URL、表单、CRUD)里几乎用不到,但在以下领域是基础数据类型:

- **信号处理**:傅里叶变换(FFT)、频谱分析,信号天然用复数表示(幅度+相位)。
- **电气工程**:交流电路的阻抗、电压相量,复数运算是标配。
- **量子计算**:量子态是复向量,量子门是复矩阵。
- **科学计算与数值方法**:求解多项式根(实系数方程可能有复根)、动力系统稳定性分析。
- **分形图形**:曼德博集合(Mandelbrot)的生成核心是复数迭代 `z = z² + c`。

Python 把复数内置,意味着上述领域的算法可以"开箱即用"地写,无需依赖第三方库(虽然 NumPy 提供了更高性能的复数数组,但纯 Python 的 `complex` 足以应对中小规模计算)。

```python
# 曼德博集合的一次迭代:z = z² + c
z = 0 + 0j
c = -0.7 + 0.27j
for _ in range(3):
    z = z * z + c
print(z)               # 某个复数结果
```

`complex` 的一些关键事实:

- **实部、虚部都是 `float`**:即使你写整数 `3 + 4j`,`.real`/`.imag` 也返回 `3.0`/`4.0`(浮点)。`complex` 内部存两个双精度浮点。
- **不可变(immutable)**:与 `int`/`float` 一样,`complex` 不可变,运算返回新对象,可哈希能做 `dict` 键。
- **遵循 IEEE 754 浮点**:因实虚部是 float,`complex` 继承 float 的精度特性(有 `inf`/`nan` 余噪)。
- **`j` 前缀而非 `i`**:Python(沿袭工程/电气传统)用 `j` 表虚数单位,不是数学常见的 `i`(因 `i` 在工程里常表电流)。
- **无向下取整 `%`/尾运算**:复数不支持 `//`、`%`、`<<`/`>>` 等仅对实数有意义的运算。

本篇要系统讲透 `complex`:复数字面量与构造、实虚部属性、共轭与模长、完整算术运算、复数的比较与不可排序、cmath 复数数学函数、复数在科学计算中的应用,以及 IEEE 754 在复数上的延伸。虽然 `complex` 在业务代码冷门,但它是 Python 类型体系完整的一环,理解它能补全"数值类型"的全貌,也为信号/科学计算打底。

### 1.2 复数基础:实部、虚部与几何意义

要理解 `complex`,先复习复数的数学基础。复数 `z = a + bj` 由两部分组成:

- **实部(real) `a`**:实数部分,对应数轴的横轴(实轴)。
- **虚部(imaginary) `b`**:虚数部分的系数,对应纵轴(虚轴)。注意 `b` 本身是实数(虚部的"系数"),`bj` 才是虚数。

**几何意义**:复数对应二维平面(复平面)上的一个点 `(a, b)`,实部是横坐标、虚部是纵坐标。这给出复数的两种等价表示:

- **直角坐标(代数形式)**:`a + bj`,直接看实虚部。
- **极坐标(三角/指数形式)**:`r·e^(jθ)`,其中 `r` 是模长(到原点距离,`r = √(a²+b²)`),`θ` 是幅角(与实轴夹角,`θ = atan2(b, a)`)。

```python
import math
z = 3 + 4j
# 直角坐标
print(z.real, z.imag)          # 3.0 4.0
# 极坐标:模长与幅角
r = abs(z)                     # 5.0(模长,√(3²+4²))
theta = math.atan2(z.imag, z.real)   # 0.927...(幅角,弧度)
print(r, theta)
```

模长 `abs(z)` = √(3²+4²) = 5,幅角 `atan2(4, 3)` ≈ 0.927 弧度(约 53.13°)。极坐标形式在信号处理中常用(幅度+相位),直角坐标在代数运算中常用。Python 的 `complex` 用直角坐标存储(实虚部),`abs()` 和 `cmath.phase()` 可转极坐标。

**共轭复数(conjugate)**:复数 `a + bj` 的共轭是 `a - bj`(虚部取反)。几何上是复数关于实轴的镜像。共轭在求模长、除法、信号处理(实信号提取)中常用:

```python
z = 3 + 4j
print(z.conjugate())    # (3-4j) —— 共轭,虚部取反
# 模长可用共轭求:|z|² = z · z̅(z 乘其共轭)
print((z * z.conjugate()).real)   # 25.0 —— z·z̅ 的实部 = |z|² = 3²+4²
```

`z * z.conjugate()` 的实部等于 `|z|²`(模长平方),这是求模长的经典方法(避免 sqrt),也是共轭的核心应用之一。`z.conjugate()` 是 `complex` 的内置方法。

### 1.3 complex 与 int/float 的关系

`complex`、`float`、`int` 是 Python 的三个数值类型,构成数值塔(number tower)。理解它们的关系,有助掌握复数运算的类型规则。

**数值类型塔**(从窄到宽):

```
int(整数) → float(浮点) → complex(复数)
```

- `int` 最窄(精确整数)。
- `float` 更宽(含小数,但 `int` 的值都能用 float 表示,虽可能丢精度)。
- `complex` 最宽(实数都能用复数表示,实部为该数、虚部为 0)。

**隐式提升规则**:混合运算时,向更宽的类型提升。`int` 与 `float` 运算 → `float`;`int`/`float` 与 `complex` 运算 → `complex`:

```python
print(3 + 4j)            # (3+4j) —— int + complex → complex
print(3.0 + 4j)          # (3+4j) —— float + complex → complex
print(2 * (1 + 1j))      # (2+2j) —— int * complex → complex
print((1 + 2j) + 3.5)    # (4.5+2j) —— complex + float → complex
```

只要有 `complex` 参与,结果就是 `complex`。这与 `int`/`float` 提升同理(详见《隐式类型转换》)。

**`complex` 是数值类型终点**:没有比 `complex` 更宽的内置数值类型。`complex` 之间运算仍是 `complex`,不会"升级"到别的类型。这也意味着 `complex` 不能再提升——若要更广义的数(四元数),需第三方库(如 `numpy.quaternion`)。

**`complex` 不支持实数独有的运算**:因复数无"大小顺序"和"整除"概念,`complex` 不支持 `<`/`>`/`<=`/`>=`(不可排序)、`//`/`%`(整除取余)、位运算。只支持 `+`/`-`/`*`/`/`/`**`(幂)和 `==`/`!=`:

```python
z1, z2 = 1+1j, 2+2j
print(z1 + z2)           # (3+3j)
print(z1 * z2)           # 4j(复数乘法)
# print(z1 < z2)         # TypeError:复数不可比较大小
# print(z1 // 2)         # TypeError:复数不支持整除
# print(z1 % 2)          # TypeError:复数不支持取余
```

这条"不支持比较和整除"是复数特性决定的——复数无自然序(不能说 1+2j "小于" 3+4j),整除取余对复数无定义。`complex` 的运算集比 `float` 更窄,理解这点就不会对其限制困惑。

理解了复数的数学基础、几何意义、与实数的关系,就掌握了 `complex` 的全局。后续章节展开 API 细节与实战。

---

## 2. 核心内容

本章详解 `complex` 的全部用法。每节遵循"规则 → demo → 陷阱 → 场景"展开。复数字面量、算术运算、cmath 函数是重点,因为它们的规则与实数有差异。

### 2.1 复数字面量与构造

`complex` 字面量用虚数后缀 `j`/`J` 标识。两种形式:纯虚数、实部+虚部。

**纯虚数字面量**:数字加 `j` 后缀,表示纯虚数(实部为 0):

```python
print(3j)            # 3j —— 纯虚数,实部 0
print(type(3j))      # <class 'complex'>
print(3j.real)       # 0.0 —— 实部为 0
print(3j.imag)       # 3.0 —— 虚部 3
print(2.5j)          # 2.5j —— float 系数 + j
print(1e2j)          # 100j —— 科学计数法虚部
```

⚠️ **`j` 必须前面有数字**:`j` 单独不是虚数,`3 - j` 会被解析成 `3 - j`(j 当变量名,NameError)。必须写 `3 - 1j`:

```python
# 3 + j           # NameError:'j' 当成未定义变量!
print(3 + 1j)      # (3+1j) —— 正确,1j 是虚数
print(3 - 1j)      # (3-1j)
```

这是复数字面量最易踩的语法点:`j` 是后缀不是独立标识符,必须配数字(`1j`、`2j`、`0.5j`)。

**实部 + 虚部表达式**:复数通常写 `"实部 + 虚部j"`,但严格说这是**表达式**(实部字面量 + 虚部字面量),不是单一字面量:

```python
z = 3 + 4j         # 表达式:int 3 + 虚数 4j
print(z)           # (3+4j)
# 等价:虚部系数为负时的写法
print(3 - 4j)      # (3-4j)
print(-3 + 4j)     # (-3+4j)
print(-3 - 4j)     # (-3-4j)
```

**`complex()` 构造函数**:从实部、虚部或字符串构造:

```python
# 1. 两个参数:实部, 虚部
print(complex(3, 4))     # (3+4j)
print(complex(0, 1))     # 1j(纯虚数)
print(complex(3, 0))     # (3+0j)(虚部 0,仍是 complex 不是 int)
print(complex(3.5, -2.1))# (3.5-2.1j)

# 2. 一个参数(实部,虚部默认 0)
print(complex(5))        # (5+0j)
print(complex(5.5))      # (5.5+0j)

# 3. 从字符串(含完整复数表达式)
print(complex('3+4j'))   # (3+4j)
print(complex('-2-3j'))  # (-2-3j)
print(complex('5'))      # (5+0j) —— 字符串实数也可
# complex('3 + 4j')      # ValueError!字符串含空格会报错
print(complex('1e2j'))   # 100j
```

⚠️ **`complex()` 字符串构造的陷阱**:

1. **字符串内不能有空格**:`complex('3 + 4j')`(带空格)抛 `ValueError`,而 `complex('3+4j')`(无空格)正常。这与 `float()` 容忍空白不同。
2. **字符串构造只接受单个参数**:`complex('3', '4')` 报错——字符串形式只能整体传一个字符串。

```python
# 错误
# complex('3 + 4j')     # ValueError(含空格)
# complex('3', '4')     # TypeError(字符串不能配第二参数)
# 正确
complex('3+4j')         # (3+4j)
complex(3, 4)           # (3+4j)(两个数字参数)
```

构造复数:`complex(real, imag)` 最通用(数字参数),`complex(string)` 解析字符串(注意无空格)。

**从实数提升**:任何实数都可视作虚部为 0 的复数,`complex(x)` 把实数 `x` 转复数:

```python
print(complex(3.14))     # (3.14+0j)
print(complex(7))        # (7+0j)
```

`complex(int/float)` 给出虚部为 0 的复数。这在需要统一用复数计算的算法里(如把实信号转复信号)有用。

### 2.2 实部、虚部与共轭

每个 `complex` 对象有三个核心属性:`.real`(实部)、`.imag`(虚部)、`.conjugate()`(共轭)。这是访问和操作复数的基本接口。

**`.real` 和 `.imag`**:

```python
z = 3 + 4j
print(z.real)          # 3.0 —— 实部(float)
print(z.imag)          # 4.0 —— 虚部(float)
print(type(z.real))    # <class 'float'> —— 实虚部恒为 float
```

⚠️ **实虚部恒为 `float`**,即便你写整数 `3 + 4j`。`.real`/`.imag` 返回 `3.0`/`4.0`(float),不是 `3`/`4`(int)。这是因为 `complex` 内部用双精度浮点存储两部分。若你需要整数形式的实虚部,要显式 `int(z.real)`:

```python
z = 3 + 4j
print(z.real, type(z.real))     # 3.0 <class 'float'>
print(int(z.real), int(z.imag)) # 3 4 —— 转 int(若确需整数)
# 纯实数的复数
print((5+0j).imag)              # 0.0 —— 虚部 0,但仍是 float
```

这一"实虚部恒 float"的特性要记牢——它意味着 `complex` 本质是两个 float 的组合,继承 float 的精度特性(有舍入误差、有 inf/nan)。

**`.conjugate()`**:返回共轭复数(虚部取反):

```python
z = 3 + 4j
print(z.conjugate())   # (3-4j) —— 共轭
# 反复共轭回到自身
print(z.conjugate().conjugate())  # (3+4j) —— 共轭的共轭 = 原数
# 共轭的应用:求模长平方
print((z * z.conjugate()))    # (25+0j) —— z·z̅,实部=|z|²=25,虚部=0
print((z * z.conjugate()).real)  # 25.0 —— 模长平方,避免 abs 的 sqrt
```

共轭的关键应用:`z * z.conjugate()` 的**实部是模长平方**(`a² + b²`)、虚部恒为 0。这在不调用 `abs()`(它内部做 sqrt,有开销且可能丢精度)的情况下求模长平方很有用——比较两个复数模长时,比 `|z|²` 比 `|z|` 更高效且精确:

```python
# 比较两个复数模长:比模长平方,避免 sqrt
z1, z2 = 3+4j, 5+12j
# 用 abs(需 sqrt)
print(abs(z1) < abs(z2))     # True (5 < 13)
# 用模长平方(无 sqrt,更高效)
sq1 = (z1 * z1.conjugate()).real   # 25.0
sq2 = (z2 * z2.conjugate()).real   # 169.0
print(sq1 < sq2)             # True
```

**纯实数/纯虚数的共轭**:

```python
print((5+0j).conjugate())    # (5+0j) —— 实数的共轭=自身(虚部 0 取反仍 0)
print((0+3j).conjugate())    # -3j —— 纯虚数共轭取反
```

实数的共轭是自身(虚部 0,取反仍 0)。这符合"实数关于实轴的镜像是自身"的几何含义。

### 2.3 模长与极坐标转换

复数的模长(magnitude/absolute value)和幅角(phase/argument)是极坐标表示的两要素,Python 通过 `abs()` 和 `cmath` 模块提供。

**模长 `abs(z)`**:`abs()` 对复数返回模长(到原点距离,`√(a²+b²)`):

```python
z = 3 + 4j
print(abs(z))          # 5.0 —— 模长 √(3²+4²)
print(type(abs(z)))    # <class 'float'> —— 模长是 float 实数
```

`abs(complex)` 返回 `float`(实数),与 `abs(int/float)` 一致地"返回数值的大小"。这让你能用同一 `abs()` 处理实数和复数。

**幅角 `cmath.phase(z)`**:复数与实轴的夹角(弧度),用 `cmath` 模块:

```python
import cmath
z = 3 + 4j
print(cmath.phase(z))      # 0.9272... 弧度(约 53.13°)
print(math.atan2(z.imag, z.real))  # 等价:用 math.atan2 手算
```

幅角范围 `(-π, π]`,`cmath.phase` 等价 `math.atan2(imag, real)`。注意第二象限、第三象限的象限区分靠 `atan2`(而非 `atan`),它根据实虚部正负确定正确象限。

**直角坐标 ↔ 极坐标互转**:

```python
import cmath
z = 3 + 4j
# 直角 → 极(cmath.polar 返回 (模长, 幅角) 元组)
r, theta = cmath.polar(z)
print(r, theta)        # 5.0 0.9272... —— (模长, 幅角)
# 极 → 直角(cmath.rect 由模长、幅角构造复数)
z2 = cmath.rect(r, theta)
print(z2)              # (3+4j)(约等,有浮点误差)
```

`cmath.polar(z)` 返回 `(abs(z), phase(z))` 元组;`cmath.rect(r, theta)` 反向构造。这套互转在信号处理(频域实虚部 ↔ 幅度相位)中常用。

**幅角转角度**(若需):

```python
import math
theta = cmath.phase(3 + 4j)
print(math.degrees(theta))   # 53.1301...度
```

`math.degrees` 把弧度转角度,日常显示角度时用(内部计算仍用弧度)。

**模长与幅角的几何理解**:复数 `z = a + bj` 在复平面对应点 `(a, b)`,模长是该点到原点距离 `√(a²+b²)`,幅角是该点与原点连线和实轴(正方向)的夹角。模长+幅角完全确定一个复数(极坐标),实部+虚部也完全确定(直角坐标),二者等价可互转:

```python
# 验证互转的等价性
z = 1 + 1j                  # 45° 方向,模长 √2
r, theta = cmath.polar(z)
print(r, theta)             # 1.4142... 0.7853...(45°=π/4)
print(cmath.rect(r, theta)) # (1+1j)(约等)
```

`1 + 1j` 在 45° 方向,模长 √2,幅角 π/4(45°),极坐标转回直角坐标恢复原数。理解这套直角↔极互转,就掌握了复数的两套等价表示。

### 2.4 复数算术运算

`complex` 支持四则运算 `+ - * /` 和幂 `**`,遵循复数运算法则。理解这些运算的结果,需要回到复数的代数定义 `z = a + bj`。

**加减法**:实部、虚部分别相加减。

```python
z1 = 1 + 2j
z2 = 3 - 1j
print(z1 + z2)        # (4+1j) —— (1+3) + (2-1)j
print(z1 - z2)        # (-2+3j) —— (1-3) + (2-(-1))j
```

加减直观:对应分量运算。

**乘法**:`(a+bj)(c+dj) = (ac - bd) + (ad + bc)j`(展开后用 `j²=-1`):

```python
z1 = 1 + 2j
z2 = 3 - 1j
print(z1 * z2)        # (5+5j)
# 验证:(1·3 - 2·(-1)) + (1·(-1) + 2·3)j = (3+2) + (-1+6)j = 5+5j
```

复数乘法几何意义:**模长相乘、幅角相加**。`z1·z2` 的模长 = `|z1|·|z2|`,幅角 = `θ1 + θ2`。这使乘法在旋转变换(乘 `e^(jθ)` 是旋转 θ 角)中核心。

**除法**:复数除法通过"分子分母同乘分母共轭"实现,把分母实数化:

```python
z1 = 1 + 2j
z2 = 3 - 1j
print(z1 / z2)        # (0.1+0.7j)
# 推导:分母 3-1j,共轭 3+1j
# (1+2j)(3+1j) / ((3-1j)(3+1j)) = (1+7j)/(9+1) = (1+7j)/10 = 0.1+0.7j
```

Python 自动处理复数除法的有理化,你只需写 `/`,结果正确。复数除法几何意义:**模长相除、幅角相减**。

**幂运算 `**`**:支持整数、浮点、甚至复数指数:

```python
z = 1 + 1j
print(z ** 2)         # 2j —— (1+1j)² = 1 + 2j + j² = 1 + 2j - 1 = 2j
print(z ** 0.5)       # (1.09868411346781+0.45508986056222733j) —— 复数平方根
print(z ** -1)        # (0.5-0.5j) —— 倒数(乘法逆元)
```

`z ** 0.5` 是复数平方根——复数开方总有两解(平方根),Python 返回"主值"(principal value,幅角在 (-π/2, π/2] 的那个)。复数幂运算用极坐标形式计算:`z^w = r^w · e^(jθw)`。

**复数幂的复数指数**(`z ** complex`)是完整复分析定义,Python 支持:

```python
print((1+1j) ** (2j))    # 某复数结果(复数复数幂,用 e^(w·ln z))
# 等价 cmath.exp(2j * cmath.log(1+1j))
```

**取负与绝对值**:

```python
z = 3 + 4j
print(-z)             # (-3-4j) —— 取负(实虚部都取反)
print(abs(z))         # 5.0 —— 模长
```

**与实数混合运算**(隐式提升):

```python
z = 2 + 3j
print(z + 5)          # (7+3j) —— complex + int → complex,5 当 (5+0j)
print(z * 2)          # (4+6j) —— 实数缩放
print(z / 2)          # (1+1.5j) —— 实数除
print(2 ** z)         # (-0.3998...-0.9199...j) —— 实数复数幂
```

实数与复数运算,实数被当虚部 0 的复数。`2 ** z`(实数复数幂)有意义(2 的复数次方),用 `e^(z·ln2)` 计算。

**复合赋值**:

```python
z = 1 + 1j
z += 2j               # (1+3j)
z *= 2                # (2+6j)
z **= 2               # (-32+24j) —— 就地(实为新建,complex 不可变)
```

`+=`/`*=` 等对 complex 是"创建新对象并重新绑定"(因 complex 不可变),值正确。语义同 `z = z + 2j`。

### 2.5 复数的比较与不可排序

`complex` 只支持相等比较 `==`/`!=`,**不支持大小比较** `<`/`>`/`<=`/`>=`——复数不可排序。这是复数与实数的关键差异。

**相等比较 `==`**:实虚部都相等才相等:

```python
print((1 + 2j) == (1 + 2j))   # True —— 实虚部都相等
print((1 + 2j) == (1 + 3j))   # False —— 虚部不同
print((1 + 2j) == 1)          # False —— 复数与实数,1 当 (1+0j),虚部 0≠2
print((3 + 0j) == 3)          # True!复数 (3+0j) 与 int 3 相等(实部同、虚部都 0)
```

⚠️ 注意 `(3 + 0j) == 3` 为 `True`——复数与实数比较时,实数提升为虚部 0 的复数,实虚部都相等则相等。`(3+0j)` 实部 3 虚部 0,与 `3`(当 `3+0j`)相等。这让"实部为实数、虚部 0 的复数"能与原实数 `==` 互通:

```python
z = complex(5, 0)      # (5+0j)
print(z == 5)          # True —— 虚部 0 的复数与对应实数相等
print(z == 5.0)        # True —— 与 float 也相等
```

⚠️ **但 `==` 比较仍受 float 精度影响**(因实虚部是 float):

```python
# float 的精度问题在 complex 上延续
a = 0.1 + 0.2j
b = 0.3 + 0j
print(a == b)          # False!实部 0.1+0.2 ≠ 0.3(float 精度)
# 需用模长差容差比较,见下方
```

`0.1 + 0.2j` 的实部是 `0.1+0.2`(float 精度,=`0.30000000000000004`),不等于 `0.3`。复数继承 float 的精度问题,精确相等比较同样不可靠,需容差。

**大小比较不支持**:

```python
z1, z2 = 1 + 1j, 2 + 2j
# print(z1 < z2)       # TypeError: '<' not supported between 'complex' and 'complex'
# print(z1 > z2)       # TypeError
# print(z1 <= z2)      # TypeError
```

复数没有自然的"大小序"——复平面是二维的,无法定义全局的线性顺序(任何排序都会违反某些性质,如与乘法兼容性)。故 Python 禁止复数大小比较,直接 `TypeError`。

**需要"比较"复数时的替代**:

```python
import cmath
z1, z2 = 1 + 1j, 2 + 2j
# 比模长(实数,可比)
print(abs(z1) < abs(z2))     # True (√2 < 2√2)
# 比实部
print(z1.real < z2.real)     # True
# 容差判等(复数版 isclose:实虚部都在容差内)
import math
def complex_close(a, b, rel=1e-9):
    return math.isclose(a.real, b.real, rel_tol=rel) and \
           math.isclose(a.imag, b.imag, rel_tol=rel)
print(complex_close(0.1+0.2j, 0.3+0j))   # True —— 容差判等,处理 float 误差
```

复数排序、比较模长;复数判等、用容差(实虚部分别 isclose)。这是处理复数"序"与"相等"的正确方式——不强求整体比较,按所需维度(模长/实部/容差)衡量。

**`complex` 不可哈希?不,可哈希**:`complex` 不可变,可哈希,能做 `dict` 键/`set` 元素:

```python
d = {1+2j: "点A", 3+4j: "点B"}
print(d[1+2j])        # 点A —— complex 可做 dict 键
s = {1+1j, 2+2j, 1+1j}
print(s)              # {(1+1j), (2+2j)} —— 去重
```

`complex` 哈希基于实虚部,值相同的复数哈希相同(可去重)。这使得复数能作容器的键/元素——这是相对"可变"类型的优势。

### 2.6 cmath:复数数学函数

`math` 模块的函数(如 `sqrt`、`log`、`sin`)只接受实数,对负数开方等会报错或返回 nan。`cmath`(complex math)模块提供复数版本的数学函数,处理复数输入并返回复数结果。

**`cmath.sqrt`**:复数平方根,对负数也能开方(返回纯虚数):

```python
import cmath, math
# math.sqrt 对负数报错
# math.sqrt(-1)        # ValueError
print(cmath.sqrt(-1))    # 1j —— 复数平方根,√(-1) = j
print(cmath.sqrt(-4))    # 2j
print(cmath.sqrt(2))     # (1.4142135623730951+0j) —— 正数开方,虚部 0
print(cmath.sqrt(1+1j))  # (1.098...+0.455...j) —— 复数开方
```

`cmath.sqrt` 是处理"负数开方"的标准方式——实数域无解的运算,复数域有解。这是复数最直观的应用之一。

**指数与对数**:

```python
import cmath
# e^z(cmath.exp)
print(cmath.exp(1j * cmath.pi))   # (-1+1.2246467991473532e-16j) ≈ -1
# 欧拉公式:e^(jπ) = -1(虚部应为 0,1.2e-16 是浮点误差)
# 自然对数 ln(z)(cmath.log)
print(cmath.log(1+1j))    # (0.34657359027997264+0.7853981633974483j)
# 指定底的对数
print(cmath.log(8, 2))    # (3+0j) —— log₂8 = 3
# log10
print(cmath.log10(1000))  # (2.9999999999999996+0j) ≈ 3
```

`cmath.exp(1j * π)` 验证欧拉公式 `e^(jπ) = -1`(虚部近 0,1.2e-16 是 float 误差)。`cmath.log` 求复数对数(多值函数,返回主值)。

**三角与双曲函数**(复数版):

```python
import cmath
z = 1 + 1j
print(cmath.sin(z))    # (1.2984575814159773+0.6349639147847361j)
print(cmath.cos(z))    # (0.8337300251311491-0.9888977057628651j)
print(cmath.tan(z))    # (0.2717525853195117+1.0839233273386948j)
# 双曲函数
print(cmath.sinh(z))   # (0.6349639147847361+1.2984575814159773j)
print(cmath.cosh(z))   # (0.8337300251311491+0.9888977057628651j)
# 反三角函数
print(cmath.asin(z))   # (0.6662394324925153+1.0612750619050357j)
```

`cmath` 有完整的 sin/cos/tan、asin/acos/atan、sinh/cosh/tanh 等,全部接受复数返回复数。复数三角函数在信号处理(频域变换)中核心。

**常量**:`cmath.pi`、`cmath.e`、`cmath.tau`(2π)、`cmath.inf`、`cmath.nan`、`cmath.infj`(复无穷)、`cmath.nanj`(复 nan):

```python
import cmath
print(cmath.pi)        # 3.141592653589793
print(cmath.tau)       # 6.283185307179586(2π)
print(cmath.infj)      # infj —— 复数无穷(虚部 inf)
print(cmath.nanj)      # nanj —— 复数 nan
```

**`cmath` vs `math` 决策**:

| 需求 | 用 |
|------|-----|
| 实数运算(正数开方、实对数) | `math` |
| 复数运算、负数开方、复三角 | `cmath` |
| 实部虚部、模长幅角 | `cmath`(phase/polar/rect)或 `abs` |
| 复数判 nan/inf | `cmath.isnan`/`cmath.isinf`/`cmath.isfinite` |

```python
import cmath
# 复数判 nan/inf
print(cmath.isnan(complex(float('nan'), 0)))   # True
print(cmath.isinf(complex(0, float('inf'))))   # True(虚部 inf)
print(cmath.isfinite(1+1j))                    # True(实虚部都有限)
```

`cmath` 提供复数版的 isnan/isinf/isfinite,检查复数的实虚部是否有 nan/inf。处理含 nan/inf 的复数计算(数值算法中常见)时用。

理解 `cmath` 是 `math` 的复数补全,就掌握了复数数学函数的全套——实数用 `math`,复数(或可能负数开方)用 `cmath`。

### 2.7 复数的典型应用场景

`complex` 在业务代码冷门,但在以下领域是核心工具。理解这些场景,能体会复数为何被 Python 内置。

**场景一:多项式求根(实系数方程的复根)**。实系数二次方程 `ax²+bx+c=0` 判别式 `b²-4ac < 0` 时无实根,但有共轭复根。用复数直接算:

```python
import cmath
def quadratic(a, b, c):
    """求 ax²+bx+c=0 的两根(可能复数)。"""
    disc = cmath.sqrt(b*b - 4*a*c)   # 复数开方,负判别式也成立
    return ((-b + disc) / (2*a), (-b - disc) / (2*a))
# x² + 1 = 0 → ±j
print(quadratic(1, 0, 1))    # (1j, -1j)
# x² - 2x + 5 = 0 → 1±2j
print(quadratic(1, -2, 5))   # ((1+2j), (1-2j))
```

用 `cmath.sqrt` 一次处理所有判别式情况(正/负/零),无需分支——这是复数简化数学计算的经典体现。

**场景二:曼德博集合(Mandelbrot fractal)**。分形图形的生成核心是复数迭代 `z_{n+1} = z_n² + c`,判断迭代是否发散:

```python
def mandelbrot(c, max_iter=50):
    """判断复数 c 是否在曼德博集合内(迭代不发散)。"""
    z = 0 + 0j
    for _ in range(max_iter):
        z = z * z + c          # 复数迭代
        if abs(z) > 2:          # 模长超 2 视为发散
            return False
    return True
print(mandelbrot(0+0j))        # True(0 在集合内)
print(mandelbrot(2+0j))        # False(2 发散)
print(mandelbrot(-0.7+0.27j))  # True(边界附近的点)
```

复数让分形、混沌迭代代码极简洁——`z*z + c` 一行表达复数乘法加法,Python 自动处理实虚部。这是复数在图形/算法中的典型用法。

**场景三:信号处理(频域表示)**。信号可用复数表示(幅度+相位),傅里叶变换在频域操作复数:

```python
import cmath
# 一个复数信号点:幅度 1,相位 π/4(45°)
amp, phase = 1.0, cmath.pi / 4
signal = amp * cmath.rect(1, phase)    # 极坐标 → 复数信号
print(signal)            # (0.707...+0.707...j)
# 提取幅度与相位
print(abs(signal))       # 1.0(幅度)
print(cmath.phase(signal))  # 0.785...(π/4,相位)
```

用复数的极坐标表示信号(幅度+相位),是信号处理的标准做法。`cmath.rect`/`polar` 在幅度相位 ↔ 实虚部间转换。

**场景四:交流电路(阻抗)**。电阻、电感、电容的阻抗用复数表示,复数运算简化交流电路分析:

```python
# 阻抗:电阻 R 实部,电抗 X 虚部
R = 100         # 电阻(Ω)
XL = 50         # 感抗(Ω,正虚部)
XC = 30         # 容抗(Ω,负虚部)
Z = complex(R, XL - XC)    # 总阻抗 100+20j Ω
print(Z)                # (100+20j)
print(abs(Z))           # 101.98(阻抗模长,即视在阻抗)
print(cmath.phase(Z))   # 0.197...(阻抗角,弧度)
```

电感阻抗 `jωL`(正虚部)、电容阻抗 `-j/(ωC)`(负虚部),复数让 RLC 电路分析成代数运算。电气工程的标准工具。

**场景五:旋转(2D 几何)**。复数乘 `e^(jθ)` 是旋转 θ 角,用于 2D 旋转计算:

```python
import cmath
# 把点 (1, 0) 旋转 90°
point = 1 + 0j
rotated = point * cmath.rect(1, cmath.pi/2)   # 乘 e^(jπ/2)
print(rotated)   # (0+1j) → 点 (0,1),即旋转 90° 后位置
```

复数乘法即 2D 旋转+缩放,用 `cmath.rect(1, θ)` 生成单位旋转因子,简洁实现旋转。比矩阵乘法代码更紧凑。

这些场景说明:`complex` 不是"摆设",在科学/工程计算中是直观的核心工具。Python 内置它,让这些领域的算法"开箱即写"。即便你日常不用,理解它能拓宽"数值类型"视野,在遇到相关问题时知道用复数简化。

### 2.8 综合示例:复数运算全貌

下面这个片段综合演示复数的构造、属性、运算、cmath 函数:

```python
import cmath

# 1. 构造与属性
z1 = 3 + 4j
z2 = complex(1, -2)
print(f"z1={z1}, z2={z2}")
print(f"z1 实{z1.real} 虚{z1.imag} 共轭{z1.conjugate()} 模长{abs(z1)}")

# 2. 算术运算
print(f"加:{z1+z2}, 减:{z1-z2}, 乘:{z1*z2}, 除:{z1/z2}")
print(f"幂 z1²:{z1**2}, 平方根:{cmath.sqrt(z1)}")

# 3. 极坐标
r, theta = cmath.polar(z1)
print(f"极坐标:模长{r:.4f} 幅角{theta:.4f}弧度({cmath.degrees not in dir() and __import__('math').degrees(theta):.1f}°)")
# 修正:用 math.degrees
import math
print(f"幅角转角度:{math.degrees(theta):.2f}°")

# 4. cmath 数学函数
print(f"e^(jπ)={cmath.exp(1j*cmath.pi):.4f}(欧拉公式≈-1)")
print(f"√(-1)={cmath.sqrt(-1)}(复数开方)")
print(f"ln(1+1j)={cmath.log(1+1j):.4f}")

# 5. 比较与判等
print(f"z1==z2? {z1==z2}")
print(f"(3+0j)==3? {(3+0j)==3}(虚部0的复数与实数等)")
# 复数不可排序,只能比模长
print(f"|z1|<|z2|? {abs(z1)<abs(z2)}")

# 6. 应用:二次方程求根
def quad(a, b, c):
    d = cmath.sqrt(b*b - 4*a*c)
    return ((-b+d)/(2*a), (-b-d)/(2*a))
print(f"x²+1=0 的根:{quad(1,0,1)}")

# 7. 应用:曼德博迭代
def in_mandelbrot(c, n=30):
    z = 0j
    for _ in range(n):
        z = z*z + c
        if abs(z) > 2: return False
    return True
print(f"c=-0.7+0.27j 在曼德博集? {in_mandelbrot(-0.7+0.27j)}")

# 8. 容差判等(处理 float 精度)
def cclose(a, b, rel=1e-9):
    return math.isclose(a.real, b.real, rel_tol=rel) and math.isclose(a.imag, b.imag, rel_tol=rel)
print(f"0.1+0.2j ≈ 0.3+0j? {cclose(0.1+0.2j, 0.3+0j)}(容差判等)")
```

跑一遍这段示例(注意修正 math.degrees 的使用),对照输出:复数构造属性、四则幂运算、极坐标互转、cmath 函数、欧拉公式、复数开方、二次方程求根、曼德博迭代、容差判等——`complex` 的完整图景就清晰了。核心:**复数用 j 字面量或 complex() 构造,实虚部恒 float,支持四则幂与 ==,不支持排序,cmath 提供复数数学函数,在科学/工程计算中是核心工具**。

---

## 3. 最佳实践

### 3.1 虚数单位用 j(非 i),且必须配数字

```python
# 正确(Python 用 j,需配数字)
z = 3 + 4j          # 4j 是虚数
z = complex(3, 4)
# 错误(j 单独无效,i 不是虚数单位)
# z = 3 + j         # NameError:j 当变量
# z = 3 + 4i        # SyntaxError:Python 用 j 不用 i
```

Python(工程传统)用 `j` 表虚数单位,且 `j` 必须前面有数字(`4j` 不是 `j`)。从数学/物理背景来的注意用 `j` 不是 `i`,且别写裸 `j`。

### 3.2 访问实虚部用 .real/.imag,记住恒为 float

```python
z = 3 + 4j
print(z.real, z.imag)   # 3.0 4.0 —— float,不是 int
# 若需 int,显式转换
print(int(z.real), int(z.imag))   # 3 4
```

`complex` 的 `.real`/`.imag` 恒返回 `float`(即便写整数)。需要 int 形式显式 `int(z.real)`。理解这点避免"实部类型困惑"。

### 3.3 负数开方用 cmath.sqrt,不用 math.sqrt

```python
# 正确:复数开方用 cmath
import cmath
print(cmath.sqrt(-1))    # 1j
# 错误:math.sqrt 对负数报错
# math.sqrt(-1)          # ValueError
```

`math.sqrt` 只处理非负实数,负数开方报错;`cmath.sqrt` 处理任意复数(含负实数)。涉及"可能负数开方"的算法(如二次方程)用 `cmath.sqrt` 一次覆盖所有情况,无需分支。

### 3.4 复数数学函数用 cmath,实数用 math

```python
# 复数运算:cmath
cmath.sqrt(1+1j); cmath.sin(1+1j); cmath.log(1+1j)
# 实数运算:math(对正实数更快更直接)
math.sqrt(2); math.sin(1.0); math.log(math.e)
```

`cmath` 是 `math` 的复数补全。复数输入(或可能产生复数结果,如负数开方)用 `cmath`;确定是正实数用 `math`(更直接,且某些函数实数版优化更好)。别对复数用 `math`(报错)。

### 3.5 复数判等用容差,不用 ==

```python
import math
def cclose(a, b, rel=1e-9):
    return math.isclose(a.real, b.real, rel_tol=rel) and \
           math.isclose(a.imag, b.imag, rel_tol=rel)
# 复数实虚部是 float,有精度误差
print((0.1+0.2j) == (0.3+0j))   # False(float 精度)
print(cclose(0.1+0.2j, 0.3+0j)) # True(容差判等)
```

复数实虚部是 float,`==` 会因 float 精度失败(如 `0.1+0.2j == 0.3+0j` 为 False)。像 float 一样用容差判等:实虚部分别 `math.isclose`。

### 3.6 复数不可排序,比较用模长或实部

```python
# 复数无大小序
# z1 < z2      # TypeError
# 按需比维度
abs(z1) < abs(z2)      # 比模长
z1.real < z2.real      # 比实部
z1.imag < z2.imag      # 比虚部
sorted(points, key=abs)  # 按模长排序
```

复数无自然序,不能直接 `<`/`>`。需要比较时明确按哪个维度:模长(大小)、实部、虚部。排序用 `key=abs`/`key=lambda z: z.real` 等。

### 3.7 complex 字符串构造不能含空格

```python
# 正确:无空格
complex('3+4j')        # (3+4j)
# 错误:含空格报错
# complex('3 + 4j')    # ValueError
# 数字参数构造更稳健
complex(3, 4)          # (3+4j),推荐用数字参数
```

`complex('字符串')` 解析时不容忍空格(与 `float` 容忍空白不同)。解析外部字符串复数时,先 `s.replace(' ', '')` 去空格,或更稳地用 `complex(real, imag)` 数字参数构造。

### 3.8 模长平方用 z·共轭,避免 abs 的 sqrt

```python
z = 3 + 4j
# 比较模长:比模长平方(无 sqrt,更快更精确)
sq = (z * z.conjugate()).real   # 25.0 = |z|²
# 而非
# abs(z) ** 2     # 多一次 sqrt 再平方,有精度损失和开销
```

比较两复数模长时,比 `|z|²`(=`z·z̅.real`)比 `|z|` 高效且精确(避免 sqrt)。性能敏感的模长比较用共轭法。

### 3.9 复数可哈希可做 dict 键,利用此特性

```python
# complex 不可变可哈希,能做键
grid = {0+0j: "原点", 1+0j: "东", 0+1j: "北"}
print(grid[1+0j])   # 东
points = {1+1j, 2+2j, 1+1j}   # set 去重
```

`complex` 可哈希,能作 `dict` 键/`set` 元素。处理"复平面坐标→值"映射(网格、点集去重)时利用这一特性,比用 `(real, imag)` 元组更直接。

### 3.10 处理复数 nan/inf 用 cmath 的判断函数

```python
import cmath
z = complex(float('nan'), 0)
print(cmath.isnan(z))     # True —— 复数判 nan
print(cmath.isinf(complex(0, float('inf'))))  # True(虚部 inf)
print(cmath.isfinite(1+1j))   # True
```

复数实虚部是 float,可能有 nan/inf。用 `cmath.isnan`/`isinf`/`isfinite` 检测(检查实虚部),而非 `math.isnan`(只接受实数)。数值算法中清洗复数 nan/inf 用 cmath 版。

### 3.11 大规模复数计算用 NumPy,纯 complex 适合中小规模

```python
# 中小规模:纯 complex 即可
points = [complex(x, y) for x, y in data]
# 大规模/向量化:用 NumPy 的 complex128
import numpy as np
arr = np.array([1+2j, 3+4j], dtype=np.complex128)   # 向量化复数运算,快得多
```

纯 Python `complex` 适合中小规模复数计算(简洁、无依赖)。大规模信号处理/科学计算用 NumPy 的 `complex64`/`complex128` 数组,向量化运算快几个数量级。按规模选工具。

### 3.12 复数运算注意 float 精度,欧拉公式等留余噪

```python
import cmath
# e^(jπ) 应为 -1,但 float 误差留极小虚部
print(cmath.exp(1j * cmath.pi))   # (-1+1.22e-16j) ≈ -1
# 计算结果接近理论值但有 float 余噪,判等用容差
```

复数运算继承 float 精度,理论值(如 `e^(jπ)=-1`)计算结果带极小余噪(`1.2e-16j`)。这是 float 特性,非 bug。需精确判等用容差(§3.5),显示时四舍五入去噪。

---

## 4. 原理

本章讲清 `complex` 背后的机制:Python 复数的内部表示(两个 C double)、实虚部恒 float 的根源、`j` 而非 `i` 的工程传统、不可排序的数学根源、复数运算的几何意义、`cmath` 与 `math` 的关系、IEEE 754 在复数上的延伸。这些是"complex 为何如此"的根基。

### 4.1 complex 的内部表示:两个 double(需理解,详述)

CPython 的 `complex` 对象内部就是**两个 C `double`(双精度浮点)**——一个存实部、一个存虚部。源码层(`complexobject.c`),`PyComplexObject` 结构大致:

```c
// 概念性 C 结构
typedef struct {
    PyObject_HEAD
    double real;    // 实部(C double)
    double imag;    // 虚部(C double)
} PyComplexObject;
```

这就是为何 `.real`/`.imag` 恒返回 `float`——它们直接是两个存好的 double。无论你写 `3 + 4j`(整数)还是 `3.0 + 4.0j`(浮点),存储的都是 double `3.0`、`4.0`。`complex` 没有像 `int` 那样的"任意精度"版本——它就是两个固定 64 位的 IEEE 754 double。

**这一表示的意义**:

1. **复数运算由硬件加速**:加减乘除是两个 double 的运算,CPU 的浮点单元直接处理,极快。这比用 Python 对象模拟复数快得多。
2. **继承 float 的精度与范围**:实虚部都是 double,故 complex 有 float 的 ~15~17 位精度、±1.8×10³⁰⁸ 范围、inf/nan 特性。复数精度问题本质是 float 精度问题(§4.6)。
3. **内存紧凑**:一个 complex 对象 = 对象头 + 两个 double ≈ 32+ 字节。比"两个 Python float 对象"紧凑(避免了两次对象头开销)。

```python
import sys
z = 3 + 4j
print(sys.getsizeof(z))    # 32(左右)—— complex 对象大小
print(sys.getsizeof(3.0))  # 24 —— 单个 float 对象
# complex ≈ 对象头 + 2 double,比两个独立 float 对象省
```

理解 complex 是"两个 double 的打包",就理解了它的所有特性来源:实虚部恒 float(存的就是 double)、运算快(硬件 double)、精度受限(float 精度)、可哈希(不可变,两个 double 决定哈希)。这与 `int`(任意精度数组)形成对比——complex 牺牲精度换速度,适合科学计算的大规模浮点运算。

### 4.2 为何实虚部恒为 float

§2.2 已述 `.real`/`.imag` 恒返回 float,这里讲清设计原因。根源是 §4.1 的内部表示——complex 存两个 `double`,不存 int。即便构造 `complex(3, 4)`(int 参数),C 层会先把 int 转 double 再存:

```c
// complex(3, 4) 的 C 层(简化)
real = PyFloat_AsDouble(3);   // int 3 → double 3.0
imag = PyFloat_AsDouble(4);   // int 4 → double 4.0
// 存 double 3.0, 4.0
```

故 `.real` 取出的是 `3.0`(double→Python float),不是 `3`(int)。这是 complex 内部统一用 double 的必然结果——它不区分"实虚部是整数还是浮点",统统按 double 存。

**为何如此设计?**

1. **统一性**:complex 的实虚部统一 double,运算实现简单(无需分支处理 int/float 实虚部)。一套 double 运算代码覆盖所有。
2. **与 float 一致**:complex 是 float 的扩展(实数 = 虚部 0 的复数),实虚部用 float 保持类型一致,`3+0j == 3` 这种比较才自然(都是 double)。
3. **科学计算需求**:复数主要用于科学计算,本就需要浮点(实数测量值)。整数实虚部的复数罕见,用 double 不损失。

代价:整系数复数(如 `3+4j`)实虚部变 `3.0`/`4.0`,若需整数形式要 `int(z.real)`。但这在复数应用场景无碍——复数计算本就浮点。理解"complex 实虚部恒 double"的设计,就理解了它与 int 的边界。

### 4.3 j 而非 i:工程传统的选择

Python 用 `j`(而非数学常见的 `i`)表虚数单位,这非任意,而是沿袭**工程/电气传统**。在电气工程中,`i` 已用于表示电流(electric current),为避免冲突,工程界用 `j` 表虚数单位。这一约定源自电气工程,后扩展到信号处理、控制论等工程领域,Python 沿用:

- 数学/物理:常用 `i`(imaginary 的首字母)。
- 电气/工程/Python:用 `j`(因 `i` 被电流占用)。

Python 选 `j` 是因为复数在工程(信号、电路)中应用最广,跟随工程约定。这也意味着从数学背景来的人需适应 `j`——记住 "Python 复数用 j"。

**`j` 必须配数字的语法根源**:`j` 在 Python 词法里是"数字后缀"(像浮点的 `e`),不是独立标识符。词法分析器见到 `4j` 解析为"虚数字面量"(4 的虚数),但裸 `j` 解析为"名字(标识符)"(因 j 前无数字)。故 `3 + j` 中 `j` 是变量名(NameError),`3 + 4j` 中 `4j` 才是虚数。这与浮点 `e` 类似(`2e3` 是数字,裸 `e` 是名字):

```python
# 词法:j 是数字后缀,需前置数字
4j      # 虚数字面量
2.5j    # 虚数
j       # 标识符(变量名),NameError 未定义
# 对比 e:
2e3     # 浮点字面量
e       # 标识符(math.e 是常量名,非字面量)
```

理解 `j` 是"数字后缀"而非独立符号,就理解了"为何必须 `4j` 不能裸 `j`"的词法根源——这与 `1.0` 必须有数字、`.5` 可省整数部分但需小数点的规则一脉相承(数字 token 的语法)。

### 4.4 复数不可排序的数学根源

`complex` 不支持 `<`/`>`/`<=`/`>=`,根源是复数**没有自然的线性序**。这要回到数学:复数是二维的(实部+虚部对应平面点),而"大小比较"要求一维线性序。给二维对象定义"全局谁大谁小"会违反序的基本性质。

**为何不能定义复数序?** 任何给复数定义大小的方法都会破坏序的性质或与运算不兼容:

- **按模长排序**:违反乘法兼容——若 `a < b`(按模长),`a·c < b·c` 应成立,但 `c` 旋转可能改变模长关系。
- **字典序(先实部再虚部)**:违反乘法——`(0,1)·(0,1) = (-1,0)`,若 `(0,1) > (0,0)` 且 `(-1,0) < (0,0)`,正数乘正数得负数,破坏序与乘法兼容。
- **幅角序**:周期性,`θ=0` 和 `θ=2π` 是同一数但序里不相邻,矛盾。

数学上,复数域 `C` 不是**有序域**(ordered field)——无法定义一个与域运算(加乘)兼容的全序。这是复数与实数(有序域)的本质代数差异。Python 尊重这一数学事实,直接禁止复数大小比较,抛 `TypeError`,避免用户误用无意义的"复数大小"。

```python
# TypeError 是有意的:复数无自然序,不应比大小
# z1 < z2   # TypeError: '<' not supported
# 正确:按所需维度(模长/实部)比,这些是实数可比
abs(z1) < abs(z2)
```

理解复数不可排序是数学事实(非 Python 限制),就不会试图比较复数大小,而是按具体需求选可比的维度(模长、实部、虚部)。

### 4.5 复数运算的几何意义(需理解,详述)

复数运算不仅是代数规则,更有清晰的**几何意义**,理解它能在信号/图形算法中直觉运用。

**加法=平移**:`z1 + z2` 几何上是把 `z1` 按 `z2` 的向量平移。`z1 + z2` 对应点 = `z1` 点 + `z2` 点的向量合成(平行四边形法则)。

**乘法=旋转+缩放**:`z1 · z2` 的模长 = `|z1|·|z2|`,幅角 = `θ1 + θ2`。即"模长相乘、幅角相加"。特别地,乘 `e^(jθ)`(模长 1、幅角 θ 的复数)是**纯旋转 θ 角**(无缩放):

```python
import cmath
# 把 1+0j 旋转 90°(乘 e^(jπ/2))
p = 1 + 0j
rot = p * cmath.rect(1, cmath.pi/2)   # e^(jπ/2) = j
print(rot)   # 6.12e-17+1j ≈ 1j(点 (0,1),旋转 90°)
```

`1·e^(jπ/2) = j`,点 (1,0) 旋转 90° 到 (0,1)。复数乘法 = 2D 旋转+缩放,这是它在图形/信号中核心的几何价值。

**除法=反向旋转+缩放**:`z1/z2` 模长 = `|z1|/|z2|`,幅角 = `θ1 - θ2`。除以 `e^(jθ)` 是反向旋转 θ。

**共轭=实轴镜像**:`z.conjugate()` 几何上是 z 关于实轴的镜像(虚部取反)。`(a+bj) → (a-bj)`,点 (a,b) 镜像到 (a,-b)。

**模长=到原点距离**:`abs(z) = √(a²+b²)`,复平面上 z 点到原点的欧氏距离。`z·z̅` 的实部 = `|z|²`(距离平方),这是共轭求模长平方的几何依据。

```python
z = 3 + 4j
print(abs(z))              # 5.0 —— 到原点距离
print((z*z.conjugate()).real)  # 25.0 —— 距离平方
```

**幂=模长幂、幅角倍**:`z^n` 模长 = `|z|^n`,幅角 = `n·θ`(棣莫弗公式)。`z^2` 模长平方、幅角加倍——曼德博迭代 `z²+c` 的发散性由此(模长>2 后平方放大发散)。

理解这些几何意义,复数运算就不再是抽象代数,而是直观的平面变换:加法平移、乘法旋转缩放、共轭镜像、模长距离。这让信号处理(旋转=相移)、图形(旋转)、分形(迭代放大)等算法的复数运用有几何直觉支撑。

### 4.6 IEEE 754 在复数上的延伸与精度

`complex` 实虚部是 float,故 IEEE 754 的所有特性(精度误差、inf、nan)都延伸到复数。理解这点能预判复数的精度行为。

**精度误差**:复数运算的误差 = 两次 float 运算的误差。`0.1+0.2j + 0.3+0j` 的实部受 `0.1+0.2` 的 float 误差影响:

```python
print((0.1+0.2j) + (0.3+0j))   # (0.4+0.2j)?实部 0.1+0.3=0.4(此处恰好),但
print((0.1+0.2j) == (0.3+0j))  # 不保证(实部 0.1+0.2≠0.3 的误差可出现)
```

复数判等受 float 误差影响(§3.5 容差判等)。

**复数 inf**:`complex(inf, 0)` 是复无穷(实部 inf):

```python
import cmath
z = complex(float('inf'), 0)
print(z)               # (inf+0j)
print(z + 1)           # (inf+0j) —— 加有限仍无穷
print(z * 0)           # (nan+nanj) —— inf·0 无定义,得 nan
```

复数 inf 遵循"实虚部分别处理 inf"的规则,某些运算(如 `inf·0`)得 nan。

**复数 nan**:`complex(float('nan'), 1)` 实部是 nan,整个复数"污染":

```python
z = complex(float('nan'), 1)
print(z + (1+1j))      # (nan+2j) —— 实部 nan 污染
print(cmath.isnan(z))  # True —— cmath.isnan 检测
# 复数 nan 比较也失效(继承 float nan 特性)
print(z == z)          # False?复实部 nan 不等自身
```

复数 nan 的 `==` 也可能失效(实部 nan 不等自身),与 float nan 一致。检测用 `cmath.isnan`。

**模长/幅角的精度**:`abs(z)` 内部做 `√(a²+b²)`,有 sqrt 的精度损失;`cmath.phase` 做 `atan2`,精度较好。极端情况(实虚部量级差异大)模长可能丢精度:

```python
# 大实部+小虚部:模长主要由实部决定,小虚部可能被吞
z = 1e16 + 1j
print(abs(z))          # 1e+16 —— 1j 的贡献被大实部吞(精度)
print(abs(z) - 1e16)   # 0.0 —— 看不到 1j 的影响
```

这是 float "大数吞噬小数"(见《float 类型与精度问题》)在复数模长上的体现。需要精确模长平方时用 `z·z̅.real`(避免 sqrt)。

理解 IEEE 754 延伸到复数,就理解了复数的精度、inf、nan 行为均源于 float——complex 是 "两个 float 的打包",继承 float 的全部数值特性。这也是为何复数判等要容差、大规模复数计算要 NumPy(更高精度控制)。

---

## 5. 总结

### 5.1 本文内容回顾

- **complex 定义**:Python 内置复数类型,形如 `a+bj`(j 表虚数单位),实部 a、虚部 b;内置原生支持,用于信号处理、电气、量子、科学计算、分形。
- **基础**:实部虚部对应复平面点 (a,b);模长 `√(a²+b²)`、幅角 `atan2(b,a)`;共轭 `a-bj`;数值塔 int→float→complex,混合运算向 complex 提升。
- **字面量与构造**:`3j` 纯虚数、`3+4j` 表达式(j 须配数字,裸 j 是变量);`complex(real, imag)` 数字构造、`complex('3+4j')` 字符串构造(字符串不能含空格、不能配第二参数)。
- **属性**:`.real`/`.imag` 恒为 float(即便写整数);`.conjugate()` 共轭;`z·z̅.real` 是模长平方(避免 abs 的 sqrt)。
- **模长与极坐标**:`abs(z)` 模长(float);`cmath.phase` 幅角;`cmath.polar`/`cmath.rect` 直角↔极坐标互转。
- **算术**:`+ - * / **` 遵复数法则(乘法模长相乘幅角相加=旋转缩放,除法模长相除幅角相减);复合赋值创建新对象(complex 不可变);与实数混合隐式提升为 complex。
- **比较**:只支持 `==`/`!=`(实虚部都等才等,`(3+0j)==3` 为 True);不支持 `<`/`>` 等(复数不可排序);判等受 float 精度影响需容差;可哈希能做 dict 键。
- **cmath**:复数数学函数(`sqrt` 负数开方、`exp`/`log`、三角双曲、`polar`/`rect`/`phase`);常量 pi/e/tau/infj/nanj;isnan/isinf/isfinite 复数版;math 处理实数、cmath 处理复数。
- **应用**:多项式求根(cmath.sqrt 一次覆盖所有判别式)、曼德博分形(z²+c 迭代)、信号处理(幅度相位)、交流电路(阻抗)、2D 旋转(乘 e^(jθ))。
- **原理**:complex 内部两个 C double(故实虚部恒 float、运算硬件加速、继承 float 精度范围、内存紧凑);j 非 i 源于电气工程传统(i 被电流占用)、j 是数字后缀须配数字(词法);复数不可排序因复数非有序域(任何序都与乘法不兼容);运算几何意义(加法平移、乘法旋转缩放、共轭镜像、模长距离、幂模长幂幅角倍);IEEE 754 延伸到复数(实虚部 float 带精度误差、复 inf/nan、大数吞噬影响模长)。
- **最佳实践**:j 配数字、实虚部恒 float、负数开方用 cmath、复数函数用 cmath、判等容差、不可排序比模长/实部、字符串构造去空格、模长平方用共轭、可哈希做键、nan/inf 用 cmath 判、大规模用 NumPy、注意 float 精度余噪。

### 5.2 读完本文你应能掌握

- 说明 `complex` 的定义与 `a+bj` 形式,指出 Python 用 `j`(非 `i`),`j` 须配数字。
- 用 `3j`/`3+4j`/`complex(real,imag)`/`complex('字符串')` 构造复数,指出字符串构造的无空格限制。
- 用 `.real`/`.imag`/`.conjugate()`/`abs()`/`cmath.phase`/`cmath.polar`/`cmath.rect` 访问属性与极坐标转换,说明实虚部恒 float。
- 进行复数四则与幂运算,说明乘法"模长相乘幅角相加"的几何意义(旋转缩放)。
- 说明复数只支持 `==` 不支持排序,用容差判等(实虚部 isclose),按模长/实部比较或排序。
- 用 `cmath` 的 sqrt(负数开方)、exp/log、三角双曲函数,区分 `cmath`(复数)与 `math`(实数)的用途。
- 用复数解决多项式求根、曼德博迭代、2D 旋转等场景,体会复数在科学计算的价值。
- 阐述 complex 两个 double 的内部表示、j 的工程传统与词法、不可排序的有序域数学根源、运算几何意义、IEEE 754 延伸的精度与 inf/nan 等原理。
