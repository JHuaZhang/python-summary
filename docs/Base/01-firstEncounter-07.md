---
group:
  title: 【01】初识python
  order: 1
order: 7
title: input输入与类型转换
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 input

`input` 是 Python 的内置函数,作用是从**标准输入流**(`sys.stdin`,默认是键盘)读取一行文本。它与 `print` 相对——`print` 负责把数据"送出"到屏幕,`input` 负责把用户敲下的内容"读入"到程序。一个最简单的交互由两者构成:

```python
name = input("请输入你的名字: ")
print("你好,", name)
```

运行时,程序会在屏幕上显示提示语 `请输入你的名字: ` 然后停住,等用户敲字并按回车。用户按回车后,`input` 把刚才那一行(不含换行符)作为字符串返回,赋给 `name`,程序继续往下执行 `print`。

在实际开发中,`input` 的典型用途:

- **命令行交互工具**:让用户输入参数、选择菜单项,无需复杂的命令行解析。
- **教学/练习程序**:猜数字、计算器、问答类小程序,靠 `input` 接收用户作答。
- **脚本中途确认**:批量删除、危险操作前用 `input("确认继续? (y/n) ")` 等待用户确认。
- **快速取值**:调试或临时脚本里临时读一个值进来测试。

需要先厘清两个关键认知:

**第一,`input` 永远返回字符串。** 这是新手最容易踩的坑。无论用户输入的是 `28`、`3.14` 还是 `True`,`input` 拿到的都是 `"28"`、`"3.14"`、`"True"` 这样的**字符串**,而不是数字或布尔值。如果要拿用户输入做数学运算,必须先做类型转换,否则 `"28" + 2` 会报 `TypeError`。这就是为什么"输入"和"类型转换"总绑在一起讲——有了 `input`,几乎必然要接类型转换。

**第二,`input` 是阻塞的。** 调用 `input` 后程序会**停下来等**用户输入,在用户按回车前不会继续执行后续代码。在需要非阻塞输入或后台读取的场景(如服务端、并发程序),`input` 不合适,要用 `select`、线程或专门的终端库。

从分类上看,`input` 和 `print` 一样是**内置函数**(不是关键字),使用时必须加括号。Python 2 里还有一个 `raw_input` 返回字符串、`input` 会当表达式求值;Python 3 把 `raw_input` 改名为 `input`,统一返回字符串——这也是为什么 Python 3 的 `input` 比 Python 2 安全得多(不会执行用户输入的代码)。

### 1.2 基本语法与最小用法

`input` 的函数签名非常简单:

```python
input(prompt='')
```

- `prompt`:可选的提示字符串,会在等待输入前输出到标准输出,**末尾不自动加换行**。若不传,则无提示直接等待。
- 返回值:用户输入的那一行文本(字符串),**不包含结尾的换行符**。

最小用法是不传提示:

```python
s = input()
print("你输入了:", s)
```

更常用的是带提示:

```python
name = input("请输入名字: ")
print("你好, " + name)
```

运行示例(假设用户依次输入 `张三`、`28`):

```python
name = input("请输入名字: ")        # 屏幕显示: 请输入名字: 张三
age = input("请输入年龄: ")         # 屏幕显示: 请输入年龄: 28
print(f"{name} 今年 {age} 岁")      # 输出: 张三 今年 28 岁
```

注意这里 `age` 是字符串 `"28"`,但因为用了 f-string 直接插值(字符串拼接),所以没报错。一旦要拿 `age` 做运算,问题就来了:

```python
age = input("请输入年龄: ")   # 用户输入 28,age 是 "28"
# print(age + 1)             # TypeError: can only concatenate str (not "int") to str
print(int(age) + 1)          # 正确:先把 "28" 转成数字 28,再 + 1,输出 29
```

这个 `TypeError` 几乎是每个 Python 初学者都遇过的报错,根因就是"`input` 返回字符串"。于是类型转换成了不可或缺的下一步。

### 1.3 为什么需要类型转换

计算机里"28"这个文本和数字 28 是两个完全不同的东西:前者是两个字符 `'2'` 和 `'8'` 组成的字符串,后者是内存里一个可以参与算术运算的整数值。`input` 只能给你前者,因为它不知道你输入的 `28` 是年龄、编号、电话号码还是别的什么。把字符串"翻译"成数字、布尔或其他类型的过程,就是**类型转换**(type conversion / type casting)。

Python 提供了一组内置构造函数做显式类型转换:

| 目标类型 | 转换函数 | 示例 |
|----------|----------|------|
| 整数 | `int()` | `int("28")` → `28` |
| 浮点数 | `float()` | `float("3.14")` → `3.14` |
| 字符串 | `str()` | `str(28)` → `"28"` |
| 布尔 | `bool()` | `bool("")` → `False` |
| 列表 | `list()` | `list("abc")` → `['a','b','c']` |
| 元组 | `tuple()` | `tuple([1,2])` → `(1,2)` |
| 集合 | `set()` | `set([1,1,2])` → `{1,2}` |

其中与 `input` 搭配最频繁的是 `int`、`float`、`str`,因为用户输入的数字需要转成数值才能计算。

类型转换分**显式**(程序员主动调用 `int()` 等)和**隐式**(Python 自动完成的,如 `1 + 2.0` 自动得 `3.0`)两种。`input` 场景下用的都是显式转换,因为 `str` 到 `int/float` 不会自动发生——Python 不会自作主张把你输入的 `"28"` 当数字。

### 1.4 input 与 print 的协作

`input` 的 `prompt` 参数其实内部就是先调用 `print`(写 `prompt` 到 `stdout`),再读 `stdin`。所以下面两种写法几乎等价:

```python
# 写法一:用 prompt 参数
name = input("请输入: ")

# 写法二:先 print 再 input
print("请输入: ", end="")    # 注意 end="" 不换行,让光标停在提示后
name = input()
```

差异在于:写法一的提示**紧跟**输入光标,无换行;写法二若忘了 `end=""`,`print` 默认会换行,提示和输入光标就分两行了。所以用 `print` + `input` 拆开写时要记得 `end=""`。一般直接用 `prompt` 参数更简洁。

---

## 2. 核心内容

本章讲解 `input` 的具体行为、`prompt` 参数、返回值特征,以及与各类类型转换函数的搭配,重点是"读入 → 转换 → 校验 → 使用"这条完整链路。

### 2.1 prompt 提示参数

`prompt` 控制在等待输入前显示什么文字,用来引导用户。

**`prompt` 的关键点**:

- 类型是字符串(可传任何能被 `str()` 的对象,但实践中都传字符串字面量)。
- 输出后**不加换行**,光标紧跟在提示文字之后,让用户在同一行输入。
- 不传时(`input()`)无任何提示,光标停在行首等输入——这在交互体验上不友好,通常只在测试或明确上下文时用。
- `prompt` **不影响**返回值;返回值始终是用户输入的那行文本。

不同 prompt 的效果:

```python
# 带明确提示,体验好
name = input("姓名: ")

# 带括号说明格式,引导用户输入规范内容
phone = input("手机号(11位): ")

# 多行提示:prompt 里含 \n,会先输出提示文字并换行,再在同一行等输入
intro = input("请做自我介绍\n> ")
```

最后一个例子里,`prompt` 含 `\n`,屏幕上会先显示"请做自我介绍"并换行,然后显示 `> ` 等待输入——这是命令行程序常见的提示风格(模拟 shell 的 `>`)。

**prompt 与返回值无关的验证**:

```python
# 提示语再花哨,返回的也只是用户敲的那行字
x = input("请输入任意内容(随便写): ")
print(f"你实际输入的是: {x!r}")   # !r 显示 repr,能看清有无前后空格等
```

用 `!r` 是为了把用户输入两侧的空格、特殊字符暴露出来,调试用户输入时很有用。

### 2.2 返回值特征:永远是字符串,且去掉换行

`input` 返回值有两个不变的保证,务必牢记:

1. **类型恒为 `str`**,即使用户输入的是数字、看起来像列表、输 `True`/`False`,统统是字符串。
2. **不含结尾换行符**。用户按回车,`\n` 被 `input` 消费掉了,返回的字符串不含它。这一点区别于直接用 `sys.stdin.readline()`,后者会保留 `\n`。

```python
import sys

# input:自动去掉换行
line = input("输入一行: ")          # 用户输入 hi 并回车
print(repr(line))                   # 'hi'(无 \n)

# sys.stdin.readline:保留换行
# line2 = sys.stdin.readline()
# print(repr(line2))               # 'hi\n'
```

去换行这个细节的好处是:你拿到的字符串直接可用,不必每次 `strip()`。但要注意它**只去结尾的换行**,不会动用户输入前后的空格:

```python
s = input("输入: ")   # 用户输入 "  abc  "(前后有空格)并回车
print(repr(s))        # '  abc  ' —— 前后空格保留,只去掉了末尾换行
```

若要清理前后空格,需自行 `s.strip()`。

### 2.3 转整数:int()

`int()` 把字符串(或其他对象)转成整数,是与 `input` 搭配最高频的转换。

**`int()` 用法**:

- `int("28")` → `28`:把纯数字字符串转成整数。
- `int("  28  ")` → `28`:会自动忽略首尾空白,这点比想象中宽容。
- `int(3.9)` → `3`:浮点转整数是**直接截断**(向零取整),不是四舍五入。
- `int("0x1a", 16)` → `26`:第二参数指定进制,可解析二进制/八进制/十六进制字符串。

**与 input 搭配**:

```python
age_str = input("请输入年龄: ")   # 假设输入 28
age = int(age_str)                 # 转成整数 28
print(f"明年你 {age + 1} 岁")      # 明年你 29 岁
```

通常会合并成一行:

```python
age = int(input("请输入年龄: "))
```

**注意:合并写法下,类型转换失败会让整行报错。** 如果用户输入 `abc`,`int("abc")` 直接抛 `ValueError`,程序中断。所以生产代码里通常要把转换包在 `try` 里(见 3.1)。教学示例图省事常合并写,但要清楚其风险。

**int() 转换失败的边界**:

```python
int("3.14")    # ValueError! "3.14" 不是合法整数文本
int("abc")     # ValueError
int("")        # ValueError,空串不能转
int("12.0")    # ValueError,"12.0" 含小数点,不是纯整数
```

特别留意 `int("3.14")` 会失败:虽然 `3.14` 是个数字,但它不是"整数字符串"。要先把 `"3.14"` 经 `float()` 再 `int()`,即 `int(float("3.14"))` → `3`。这是初学者常困惑的点。

### 2.4 转浮点数:float()

`float()` 把字符串转成浮点数,用于需要小数计算的输入。

**`float()` 用法**:

- `float("3.14")` → `3.14`。
- `float("3")` → `3.0`:整数串也能转成浮点。
- `float("  1.5  ")` → `1.5`:同样忽略首尾空白。
- `float("1e3")` → `1000.0`:支持科学计数法。
- `float("inf")`/`float("nan")` → 无穷/NaN:特殊浮点值。

**与 input 搭配**:

```python
height = float(input("请输入身高(米): "))   # 假设输入 1.75
weight = float(input("请输入体重(kg): "))   # 假设输入 68
bmi = weight / (height ** 2)
print(f"你的 BMI 是 {bmi:.1f}")               # 你的 BMI 是 22.2
```

**float() 比 int() 更宽容一点**:它能接受 `"3"` 和 `"3.14"`,但不能接受 `"abc"`、空串或带其他字符的串:

```python
float("3")      # 3.0,合法
float("3.14")   # 3.14,合法
float("abc")    # ValueError
float("")       # ValueError
float("3,14")   # ValueError! 逗号不是小数点(中文/欧式写法会踩坑)
```

那个 `float("3,14")` 的坑值得注意:某些地区习惯用逗号作小数点,但 Python 只认点号 `.`,输入 `3,14` 会失败。处理多语言输入时需先把逗号替换成点。

### 2.5 转字符串:str()

`str()` 把任意对象转成其字符串表示。和 `input` 搭配时,`str()` 用得不多——因为 `input` 本来就返回字符串。但 `str()` 在"把计算结果转成文本后输出/拼接"时很常用,与 `print` 的字符串化机制呼应。

```python
n = 28
s = "年龄是 " + str(n)      # 手动拼接需先 str()
print(s)                     # 年龄是 28

# 更推荐用 f-string,内部自动调 str(),省去手动转换
print(f"年龄是 {n}")
```

从 `input` 角度看,`str()` 的用途是"把已经转成数字的结果再变回字符串",例如格式化输出或存盘:

```python
age = int(input("年龄: "))    # 输入 28 → 转成 int 28
age_str = str(age)             # 再变回 "28"
print("存档:", age_str + "岁")  # 存档: 28岁
```

### 2.6 转布尔:bool() 与 input 的陷阱

`bool()` 把对象转成布尔值。但它与 `input` 的搭配有一个**经典陷阱**:

```python
answer = input("继续吗? (yes/no): ")    # 用户输入 no
if bool(answer):
    print("继续")                          # 居然打印了"继续"!
```

为什么输入 `no` 还"继续"?因为 `bool("no")` 是 `True`——**任何非空字符串都是 `True`**,哪怕字符串内容是 `"no"`、`"false"`、`"0"`,只要长度大于 0 就是 `True`。`bool()` 只看字符串是否为空,不看内容语义:

```python
bool("")       # False(空串)
bool("no")     # True
bool("false")  # True
bool("0")      # True
bool("False")  # True
bool(" ")      # True(空格也是非空)
```

所以**不能用 `bool(input(...))` 来判断用户是否同意**。正确做法是把输入转小写后与具体值比较:

```python
answer = input("继续吗? (yes/no): ").strip().lower()
if answer in ("yes", "y", "是"):
    print("继续")
else:
    print("停止")
```

这里 `.strip()` 去前后空格、`.lower()` 统一小写,再判断是否在同意集合里,才能可靠识别用户意图。这是"读入 → 清洗 → 转换语义 → 校验"链路的典型例子。

### 2.7 多值输入与 split

用户常需要一次输入多个值,如"输入三个用空格隔开的数字"。`input` 一次只返回一行字符串,要拆成多个值,配合 `str.split`:

```python
raw = input("输入三个数字(空格分隔): ")   # 假设输入: 10 20 30
parts = raw.split()                          # ['10', '20', '30']
nums = [int(p) for p in parts]               # [10, 20, 30]
print("总和:", sum(nums))                    # 总和: 60
```

`split()` 不传参时按任意空白(空格/制表/连续空白都算)分割,且自动忽略首尾空白——这正好适合处理用户随手的输入。常见组合写法:

```python
# 一行读入并转成整数列表
nums = list(map(int, input("数字: ").split()))
print(nums, "和 =", sum(nums))
```

**逗号分隔的情况**:如果用户习惯用逗号分隔,`split()` 默认按空白分,会失败,需指定分隔符并清理:

```python
raw = input("输入(逗号分隔): ")          # 输入: 10, 20, 30
parts = raw.replace(" ", "").split(",")    # 去空格再按逗号分 → ['10','20','30']
nums = [int(p) for p in parts]
```

或更稳的方式:`[int(p.strip()) for p in raw.split(",")]`,对每段单独 `strip()`,既兼容 `10,20,30` 也兼容 `10, 20, 30`。

### 2.8 多次输入与循环校验

真实交互中,用户可能输错(输了字母却要数字)。健壮的做法是用循环反复提示,直到拿到合法输入:

```python
while True:
    s = input("请输入年龄(整数): ")
    try:
        age = int(s)
        break                       # 转换成功,跳出循环
    except ValueError:
        print("  输入无效,请输入数字。")
print(f"你的年龄是 {age}")
```

这个模式(`while True` + `try/except` + `break`)是命令行程序读取校验输入的标准范式。可以封装成函数复用:

```python
def read_int(prompt, default=None):
    while True:
        s = input(prompt)
        if s == "" and default is not None:
            return default           # 允许回车用默认值
        try:
            return int(s)
        except ValueError:
            print("  请输入合法整数。")

age = read_int("年龄(回车默认 18): ", default=18)
print("年龄:", age)
```

同理可写 `read_float`、`read_choice`(限定选项)等。把"输入+校验"封装起来,主逻辑就干净了。

### 2.9 input 的阻塞特性与限制

`input` 会阻塞当前线程直到用户回车。这带来几个限制:

- **不能超时**:标准 `input` 没有超时参数,用户不回车程序就一直等。需要超时要用 `signal.alarm`(Unix)或线程+队列等技巧,较繁琐。
- **不能后台读**:阻塞期间整个线程干不了别的。需要边读输入边做事的程序,通常把 `input` 放进单独线程,或改用非阻塞读取。
- **EOF 会报错**:输入流结束时(如管道已关闭、Ctrl+D/Ctrl+Z),`input` 抛 `EOFError`。读管道输入时应捕获它。

```python
# 读取直到 EOF(Ctrl+D 结束)的常见写法
lines = []
while True:
    try:
        line = input()
    except EOFError:
        break
    lines.append(line)
print(f"共读入 {len(lines)} 行")
```

对要处理管道输入的脚本(如 `cat data.txt | python script.py`),这种 `try/except EOFError` 循环是标配。

### 2.10 用 sys.stdin 替代 input

`sys.stdin` 是更底层的输入流对象,`input` 内部就是基于它实现的。直接用 `sys.stdin` 能做 `input` 不便做的事:

- `sys.stdin.read()`:一次性读完所有输入(整个文件/管道),返回一个大字符串。
- `sys.stdin.readlines()`:一次读完所有行,返回列表。
- `for line in sys.stdin:`:逐行迭代,内存友好,适合处理大文件。

```python
import sys

# 逐行处理标准输入(管道场景常用)
total = 0
count = 0
for line in sys.stdin:
    line = line.strip()           # 注意 readline 保留换行,需 strip
    if line:
        total += int(line)
        count += 1
print(f"平均值: {total / count:.2f}")
```

对比 `input`:逐行用 `for line in sys.stdin` 比 `while True: input()` 更 Pythonic,且能处理任意大输入。`input` 适合交互式弹提示,`sys.stdin` 适合批量管道数据处理,各有所长。

### 2.11 进制转换:int 的 base 参数

`int` 第二参数 `base` 可解析非十进制字符串,在处理颜色码、权限位、网络地址等场景很常用:

```python
int("1010", 2)     # 二进制 → 10
int("17", 8)       # 八进制 → 15
int("1a", 16)      # 十六进制 → 26
int("0x1a", 16)    # 带 0x 前缀,base=16 也认 → 26
int("0o17", 8)     # 带 0o 前缀,base=8 → 15
int("0b1010", 2)   # 带 0b 前缀,base=2 → 10
```

注意:指定 `base` 时,字符串可带对应前缀(`0x`/`0o`/`0b`),Python 会识别。但 `base=0` 是个特殊值——它会根据前缀自动判断进制:

```python
int("0x1a", 0)    # 26,按 0x 前缀识别为十六进制
int("0b1010", 0)  # 10
int("10", 0)      # 10,无前缀按十进制
```

与 `input` 搭配读取十六进制:

```python
hex_str = input("输入颜色码(如 ffff00): ").strip()
try:
    code = int(hex_str, 16)
    print(f"颜色码 {hex_str} = {code}")
except ValueError:
    print("不是合法的十六进制")
```

反向把数字转成各进制字符串,用 `bin`/`oct`/`hex` 或格式化:

```python
n = 26
print(bin(n))        # 0b11010
print(oct(n))        # 0o32
print(hex(n))        # 0x1a
print(f"{n:#b}")      # 0b11010(#b 带 0b 前缀)
print(f"{n:08b}")     # 00011010(8 位宽二进制,前补零)
```

### 2.12 int 截断 vs round 四舍五入

`int()` 把浮点转整数是**向零截断**,与四舍五入不同,处理用户输入的浮点时要注意:

```python
int(3.9)      # 3(截断,不是 4)
int(-3.9)     # -3(向零截断,不是 -4)
int(3.1)      # 3

# 要四舍五入用 round
round(3.5)    # 4( Banking rounding 下 3.5→4,2.5→2,注意)
round(3.9)    # 4
round(-3.9)   # -4
```

注意 Python 3 的 `round` 用"银行家舍入"(四舍六入五成双),`round(2.5)` 是 `2` 而非 `3`。需要明确"四舍五入"可在转换前加 0.5(对正数):

```python
# 从 input 拿到金额,要四舍五入到整元
money = float(input("金额: "))          # 输入 3.5
print(int(money))                        # 3(int 直接截断)
print(int(money + 0.5) if money >= 0 else int(money - 0.5))  # 4(对正数近似四舍五入)
```

选 `int` 截断还是 `round`,取决于业务语义:分账取整通常截断(不四舍五入多发钱),显示用值通常四舍五入。混用会出差错。

### 2.13 安全转换列表/字典:ast.literal_eval

有时用户要输入结构化数据,如 `[1, 2, 3]` 或 `{"a": 1}`。直接当字符串没用,需要"还原"成 Python 对象。这里有个**危险坑**:很多人用 `eval()`:

```python
# 危险:eval 会执行任意代码!
data = eval(input("输入: "))
# 若用户输入 __import__('os').system('rm -rf /') —— 后果严重
```

`eval` 会执行任意 Python 表达式,处理用户输入等于把电脑交给用户操控,**绝不能用于转换不可信输入**。正确做法是 `ast.literal_eval`,它只解析字面量(数字、字符串、列表、字典、元组、布尔、None),不执行函数调用或表达式,安全:

```python
import ast

raw = input("输入列表(如 [1,2,3]): ")   # 输入 [1,2,3]
try:
    data = ast.literal_eval(raw)
    print(data, type(data))               # [1, 2, 3] <class 'list'>
except (ValueError, SyntaxError):
    print("输入不是合法的列表字面量")
```

`ast.literal_eval` 对 `"[1, 2, 3]"` 返回真列表,对 `"__import__('os')"` 直接报错(因为它不是纯字面量)。处理用户输入的结构化数据,永远用 `literal_eval` 而非 `eval`。

### 2.14 菜单式交互

命令行工具常有"列出选项让用户选"的需求,可用编号菜单 + `input` 实现:

```python
def show_menu():
    print("=== 请选择操作 ===")
    print("1. 添加记录")
    print("2. 删除记录")
    print("3. 查询记录")
    print("0. 退出")

while True:
    show_menu()
    choice = input("请输入选项: ").strip()
    if choice == "1":
        print("-- 添加 --")
    elif choice == "2":
        print("-- 删除 --")
    elif choice == "3":
        print("-- 查询 --")
    elif choice == "0":
        print("再见")
        break
    else:
        print("无效选项,请重新输入")
```

把选项校验也封装一下,可复用:

```python
def read_choice(prompt, options):
    """options: dict,如 {'1':'添加','0':'退出'}"""
    while True:
        s = input(prompt).strip()
        if s in options:
            return s
        print(f"  无效,可选: {list(options.keys())}")

opt = {"1": "添加", "2": "删除", "0": "退出"}
c = read_choice("选择: ", opt)
print(f"你选择了 {opt[c]}")
```

这种"菜单+校验+分发"是命令行程序的标准骨架。

### 2.15 多行输入

`input` 一次只读一行。需要多行输入时,有几种做法:

**做法一:读到结束符**。约定一个结束标记(如空行或 `EOF`),循环读到为止:

```python
print("输入多行内容,单独一行输入 END 结束:")
lines = []
while True:
    line = input()
    if line.strip().upper() == "END":
        break
    lines.append(line)
text = "\n".join(lines)
print(f"--- 你输入了 {len(lines)} 行 ---\n{text}")
```

**做法二:读固定行数**:

```python
n = int(input("要输入几行? "))
lines = [input(f"第{i+1}行: ") for i in range(n)]
print("\n".join(lines))
```

**做法三:用 `sys.stdin.read()` 读到底**(管道友好,见 2.10)。

多行输入在交互场景建议用结束符约定,且在提示里说明清楚,否则用户不知道何时停止。

### 2.16 密码输入:getpass

输入密码时,敲的字符不应回显到屏幕(防止旁边人看到)。标准 `input` 会回显,不适合输密码。`getpass` 模块提供不回显的输入:

```python
import getpass

username = input("用户名: ")
password = getpass.getpass("密码: ")   # 输入时不显示字符
print(f"登录用户 {username},密码长度 {len(password)}")
```

`getpass.getpass` 默认提示是 `"Password: "`,可传 `prompt` 自定义。它在多数终端能正确关闭回显;某些 IDE 的运行窗口不是真终端,可能无法关闭回显(会回退到可见输入,并给出 warning),生产环境在真终端运行即可。

注意 `getpass` 仍返回字符串,后续校验逻辑与 `input` 一致,只是读入阶段不显示。

### 2.17 字符串输入的清洗工具

用户输入常常需要清洗后再转换或使用,常用字符串方法:

```python
s = input("输入: ")

s.strip()           # 去首尾空白
s.lstrip()          # 只去左空白
s.rstrip()          # 只去右空白(也常用于去换行)
s.lower()           # 全小写,大小写不敏感判断时用
s.upper()           # 全大写
s.replace(" ", "")  # 去掉所有空格
s.replace("，", ",") # 中文逗号转英文逗号,统一分隔符
```

这些方法返回新字符串(原串不变),常链式调用:

```python
# 典型清洗链:去空白 → 中文逗号转英文 → 按逗号拆 → 逐段去空白转数字
raw = input("数字(逗号分隔): ")
nums = [int(x.strip()) for x in raw.replace("，", ",").split(",")]
print(nums)
```

清洗是"读入 → 转换"之间的重要一环,健壮的输入处理往往 70% 代码在清洗。

---

## 3. 最佳实践

### 3.1 转换务必包 try,给用户改错机会

```python
# 不推荐:用户输错直接崩溃
n = int(input("数字: "))      # 输入 abc → ValueError 程序挂

# 推荐:捕获异常,提示重输
while True:
    try:
        n = int(input("数字: "))
        break
    except ValueError:
        print("  不是合法数字,请重输。")
```

交互程序绝不能因用户手误而崩溃,`try/except` 是底线。

### 3.2 先清洗再转换

用户输入常带前后空格、大小写不一,转换前先 `.strip()`(必要时 `.lower()`):

```python
# 不推荐:用户输了空格就转换失败
n = int(input("数字: "))        # 输入 " 28 " → 不报错(int 会 strip),但语义不清

# 推荐:显式清洗
raw = input("数字: ").strip()
n = int(raw)

# 布尔判断类:清洗+小写+集合判断
ans = input("(y/n): ").strip().lower()
if ans in ("y", "yes"):
    ...
```

显式 `strip()` 让代码意图清晰,也避免依赖"某函数恰好会 strip"这种隐式行为。

### 3.3 不要用 bool(input()) 判断意图

如 2.6 所述,`bool("no")` 是 `True`。判断用户意图要比较具体内容,而非依赖 `bool()`:

```python
# 错误
if bool(input("继续? ")):
    ...

# 正确
if input("继续? ").strip().lower() in ("y", "yes"):
    ...
```

### 3.4 多值输入优先 split + 推导式

```python
# 一次读多个值,用 split 拆分后转换
nums = [int(x) for x in input("数字(空格分隔): ").split()]
```

比反复调多次 `input` 让用户分多行输入更友好。

### 3.5 交互式用 input,管道用 sys.stdin

- 需要给用户提示、等用户回应 → `input`(带 prompt)。
- 处理文件/管道批量数据 → `for line in sys.stdin` 或 `sys.stdin.read()`。

混用会丢体验:`for line in sys.stdin` 不会显示提示,交互场景不友好;`input` 读大管道又慢又繁琐。按场景选对工具。

### 3.6 提示语要明确格式

```python
# 模糊
x = input("输入: ")

# 明确:告诉用户期望的格式和单位
age = input("年龄(整数,岁): ")
height = input("身高(如 1.75,米): ")
choice = input("选择 [1]/[2]/[3]: ")
```

提示越具体,用户输错越少,程序越不需要复杂的校验逻辑。

### 3.7 处理 EOFError

读管道/重定向输入时,务必捕获 `EOFError`,避免输入流意外结束导致崩溃:

```python
try:
    s = input("内容: ")
except EOFError:
    s = ""
    print("\n(输入已结束)")
```

---

## 4. 原理

### 4.1 input 的执行链路(底层支持,简略)

`input` 是内置函数,底层(CPython)实现是先输出 `prompt` 到 `stdout`,再从 `sys.stdin` 读一行。抛开 C 细节,其行为可用等价 Python 模型描述:

```python
def my_input(prompt=""):
    import sys
    sys.stdout.write(prompt)            # 输出提示,不换行
    sys.stdout.flush()                  # 立即刷出,让用户看到提示
    line = sys.stdin.readline()         # 读一行(含末尾换行)
    if not line:                        # 读到 EOF
        raise EOFError("EOF when reading a line")
    return line.rstrip("\n")            # 去掉结尾换行后返回
```

核心就是"写 prompt → flush → readline → 去换行"。其中 `flush` 很关键:不刷缓冲用户可能迟迟看不到提示。`readline` 遇到 EOF(输入结束)返回空串,`input` 据此抛 `EOFError`。底层细节无需深究,记住这个模型即可解释 `input` 的阻塞、去换行、EOF 报错等行为。

### 4.2 类型转换的协议:__int__ / __float__ / __str__(需手动实现,详述)

`int()`、`float()`、`str()` 这些转换函数,本质是在调用对象类型上的**双下划线协议方法**。理解这条调用链,才能解释"为什么有的对象能转、有的不能",并能自定义类支持类型转换。

**int(obj) 的调用链**:

1. 若 `obj` 是字符串,走字符串解析逻辑:去除首尾空白后,按整数文法(可选正负号 + 数字,或带进制的 `0x`/`0o`/`0b` 前缀)逐字符解析。任一字符不合法就抛 `ValueError`。
2. 若 `obj` 是浮点数,直接截断小数取整(`int(3.9)` → `3`)。
3. 若 `obj` 是其他类型,查找并调用其 `__int__` 方法,用返回值(须为 int)作为结果;若无 `__int__`,抛 `TypeError`。

这解释了 2.3 的几个现象:`int("3.14")` 失败是因字符串解析阶段 `"3.14"` 不符合整数文法(出现了点和小数);`int(" 28 ")` 成功是因解析前先去了空白;`int(float("3.14"))` 成功是因先转成浮点 3.14,再走浮点截断分支。

**自定义类支持 int 转换**:

```python
class Price:
    def __init__(self, cents):
        self.cents = cents          # 内部以分为单位存
    def __int__(self):
        return self.cents           # int(price) 返回分

p = Price(9990)
print(int(p))                       # 9990
```

实现了 `__int__`,`int(p)` 才能正常工作。同理,要让对象能被 `float()` 转换,实现 `__float__`;能被 `str()` 转换,实现 `__str__`(这和 print 的字符串化是同一套机制,详见 print 笔记原理章)。

**float(obj) 与 str(obj) 的链路**:

- `float()`:字符串走浮点文法解析(`"3.14"`、`"1e3"`、`"inf"` 等合法);其他类型调用 `__float__`。
- `str()`:调用 `__str__`,没有则回退 `__repr__`,都没有用默认 `object` 表示。见 print 笔记 4.2 节详述。

**字符串解析为何严格**:字符串到数字的转换必须"逐字符合法",因为字符串里可能混入任何字符,Python 不会猜你的意图。`int("12个")` 失败不是因为不会处理"个",而是文法规定整数串只允许数字和正负号。这种"严格解析 + 失败抛 ValueError"的设计,迫使程序员显式处理非法输入,比"悄悄返回 0"或"取前面能转的部分"更安全。

理解这条协议链后,你能解释所有类型转换的成功/失败,也能让自定义类自然地参与 `int()`/`float()`/`str()` 转换。

### 4.3 input 与 input() 阻塞的底层(底层支持,简略)

`input` 的阻塞来自 `sys.stdin.readline`,它最终调用操作系统的阻塞式读终端系统调用——没数据来时线程被内核挂起,直到用户回车产生数据才唤醒。这是 OS 级别的 I/O 阻塞,Python 层面无法设超时,故标准 `input` 不支持超时。需要超时/非阻塞只能绕道 `signal`、线程或 `select`,底层细节不必深究。

### 4.4 显式转换为何不自动发生

Python 在数值运算时会做**隐式转换**(`1 + 2.0` → `3.0`,int 自动提升为 float),但 `str` 与 `int` 之间**不会隐式转换**——`"28" + 2` 直接报错。原因是:字符串到数字的转换有"可能失败"的风险(用户输入未必是数字),若 Python 猜测式自动转换,会掩盖错误、产生隐蔽 bug。Python 选择"危险/可能失败的转换必须显式声明"(`int(input(...))`),让程序员明确为这种不确定性负责。这是 Python 类型系统的一条设计哲学:**显式优于隐式**。

---

## 5. 总结

### 5.1 本文内容回顾

- **input 定位**:从 `sys.stdin` 读一行文本的内置函数,与 `print` 相对;阻塞式,用户回车才返回。
- **核心特性**:返回值恒为字符串、不含结尾换行;`prompt` 参数输出提示且不换行。
- **类型转换必要性**:input 只给字符串,做数值运算必须显式转换。
- **转换函数**:`int()`(整数,支持进制、会 strip、字符串可能 ValueError)、`float()`(浮点,支持科学计数法)、`str()`(任意→字符串)、`bool()`(注意非空串恒真陷阱)。
- **多值输入**:`input().split()` + 推导式/`map` 拆分转换,兼容逗号分隔需指定分隔符。
- **循环校验**:`while True` + `try/except` + `break` 的健壮输入范式,可封装成 `read_int` 等函数。
- **阻塞与限制**:input 不支持超时、不能后台读、EOF 抛 `EOFError`;管道批量数据改用 `sys.stdin`。
- **进阶用法**:int 的 `base` 参数解析二/八/十六进制及 `base=0` 自动识别;`int` 截断与 `round` 银行家舍入的差异;`ast.literal_eval` 安全还原列表/字典字面量(替代危险的 `eval`);菜单式交互与封装;多行输入(结束符/固定行数/读到底);`getpass` 不回显输密码;字符串清洗工具链(strip/lower/replace)。
- **最佳实践**:转换包 try、先 strip 清洗、不用 bool 判断意图、交互用 input/管道用 stdin、提示语明确格式、捕获 EOFError。
- **原理**:input 的"写 prompt→flush→readline→去换行"模型;类型转换走 `__int__`/`__float__`/`__str__` 协议链,字符串解析严格故可能失败;阻塞源于 OS 级阻塞 I/O;str→int 不自动转换体现"显式优于隐式"。

### 5.2 读完本文你应能掌握

- 说明 `input` 返回值恒为字符串、去结尾换行的行为,并解释为何 `int(input())` 拿用户输入做运算时常报 `TypeError`/`ValueError`。
- 正确使用 `prompt` 参数,以及用 `print(end="") + input()` 等价拆分写法。
- 用 `int`/`float`/`str`/`bool` 对 input 结果转换,并说明各函数的合法输入边界(`int("3.14")` 为何失败、`float("1e3")` 如何处理)。
- 识别并规避 `bool(input())` 判断用户意图的陷阱,改用 strip+lower+集合比较。
- 用 `split` + 推导式一次读入并转换多个值,兼容空格/逗号分隔。
- 编写 `while True` + `try/except` 的健壮输入校验循环,并封装成可复用函数。
- 在交互场景用 `input`、在管道场景用 `for line in sys.stdin`,并正确捕获 `EOFError`。
- 说明类型转换背后的 `__int__`/`__float__`/`__str__` 协议链,让自定义类支持相应转换。
- 阐述 Python 为何不在 str 与 int 间做隐式转换("显式优于隐式"设计哲学)。