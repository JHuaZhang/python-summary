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

# input输入与类型转换

## 1. 介绍

### 1.1 什么是 input

`input()` 是 Python 的内置函数，用于从**标准输入**（通常是键盘）读取一行文本。它是命令行程序与用户交互的最基础手段——程序通过 `input()` 暂停执行，等待用户在终端键入内容并按下回车，然后将用户输入的内容作为**字符串**返回给程序。

`input()` 与 `print()` 构成了 Python 命令行交互的最小闭环：`print` 负责向用户输出信息，`input` 负责从用户获取信息。一个典型的交互流程如下：

```text
程序 print 提示信息 → 用户看到提示 → 用户键入内容 → input 返回内容 → 程序处理 → print 结果
```

`input()` 最重要的特性是：**无论用户输入什么，返回值永远是 `str` 类型**。哪怕用户输入的是 `42`，`input()` 返回的也是字符串 `"42"`，而不是整数 `42`。这是初学者最容易踩的坑，也是"类型转换"在 `input` 语境下如此重要的原因——你拿到的是字符串，但大多数场景需要的是数字、布尔值或更复杂的数据结构，必须做一步转换。

### 1.2 基本语法与最简示例

`input()` 的函数签名非常简单：

```python
input(prompt='')
```

- `prompt`：可选参数，输入提示信息（一个字符串），会显示在用户输入之前。如果省略，则不显示任何提示。
- **返回值**：永远是 `str` 类型，即用户输入的那一行文本（不含末尾的换行符 `\n`）。

最简用法：

```python
name = input("请输入你的名字: ")
print(f"你好, {name}!")
```

运行时，终端会显示：

```text
请输入你的名字: 张三
你好, 张三!
```

用户键入 `张三` 并回车后，`input()` 返回字符串 `"张三"`，赋值给 `name`。

再看一个容易出错的例子：

```python
age = input("请输入你的年龄: ")
print(f"明年你 {age + 1} 岁")
```

运行结果：

```text
TypeError: can only concatenate str (not "int") to str
```

报错原因：`age` 是字符串 `"25"`，不能直接和整数 `1` 相加。必须先转换类型：

```python
age = input("请输入你的年龄: ")
print(f"明年你 {int(age) + 1} 岁")  # 先转 int 再运算
```

这就是为什么"类型转换"和 `input` 总是一起讲——`input` 拿到的是字符串，几乎每次使用都需要转换。

### 1.3 input 与 print 的交互闭环

一个完整的命令行交互程序通常遵循"提示 → 输入 → 处理 → 输出"的循环：

```python
# BMI 计算器：print 提示 → input 获取 → 转换计算 → print 结果
print("=== BMI 计算器 ===")
height = float(input("请输入身高(米, 如 1.75): "))
weight = float(input("请输入体重(kg, 如 68): "))
bmi = weight / (height ** 2)
print(f"你的 BMI 是 {bmi:.1f}")
```

运行示例：

```text
=== BMI 计算器 ===
请输入身高(米, 如 1.75): 1.75
请输入体重(kg, 如 68): 68
你的 BMI 是 22.2
```

这里 `float()` 把字符串转为浮点数后才能做数学运算。整个流程可以概括为：

```text
print(提示)
  ↓
input() → str（字符串）
  ↓
int() / float() / 其他转换
  ↓
程序逻辑处理
  ↓
print(结果)
```

---

## 2. 核心内容

### 2.1 input() 的返回值永远是无类型字符串

这是 `input()` 最核心的规则：**返回值永远是 `str`，没有任何例外**。

验证这一点的最直接方式：

```python
# 输入数字
s = input("输入一些内容: ")
print(f"  类型: {type(s)}")
print(f"  值: {repr(s)}")
```

不管你输入什么，`type(s)` 始终是 `<class 'str'>`：

```text
输入一些内容: 42
  类型: <class 'str'>
  值: '42'

输入一些内容: True
  类型: <class 'str'>
  值: 'True'

输入一些内容: [1, 2, 3]
  类型: <class 'str'>
  值: '[1, 2, 3]'
```

**为什么这样设计**：`input()` 不知道用户的意图——同样输入 `42`，用户可能想要整数，也可能想要电话号码（不能做数学运算的"42"）。因此 `input()` 选择返回最通用的字符串类型，把"如何解释这串文本"的决定权交给开发者。这是一种"安全默认"策略：字符串不会因为意外运算而出错，但如果你需要数字，就必须显式转换。

**常见错误清单**：

| 用户输入 | `input()` 返回 | 直接运算的结果 | 原因 |
|---------|----------------|---------------|------|
| `25` | `"25"`（str） | `age + 1` 报 TypeError | str 不能和 int 相加 |
| `3.14` | `"3.14"`（str） | `int(s)` 报 ValueError | str 含小数点，不能转 int |
| `True` | `"True"`（str） | `if s:` 永远为真 | 非空字符串都是 True |
| ` ` (空格) | `" "`（str） | 不等于 `""` | 空格也是有效字符 |

### 2.2 基础类型转换：int()、float()、str()

要将 `input()` 返回的字符串转为数字，最常用的是 `int()` 和 `float()`。

#### 2.2.1 int()：字符串转整数

`int()` 把字符串解析为整数。它要求字符串内容必须是**合法的整数字面量**，不能含小数点、不能含任何其他字符。

```python
# 基本用法
s = input("请输入年龄(整数): ")
age = int(s)
print(f"  int 转换后: {age}, 明年 {age + 1} 岁")
```

运行示例：

```text
请输入年龄(整数): 25
  int 转换后: 25, 明年 26 岁
```

**int() 能解析什么、不能解析什么**：

| 输入字符串 | `int(s)` 结果 | 说明 |
|-----------|--------------|------|
| `"25"` | `25` | 正常数数 |
| `"-10"` | `-10` | 支持负号 |
| `"  30  "` | `30` | 自动 strip 前后空白 |
| `"3.14"` | ValueError | 含小数点，int 不接受 |
| `"12.0"` | ValueError | 即使小数部分是 0 也不行 |
| `"abc"` | ValueError | 非数字字符 |
| `" twelve"` | ValueError | 英文数字单词不行 |
| `""` | ValueError | 空字符串不行 |

**关键点**：`int("3.14")` 会报错，即使你觉得"3.14 取整就是 3"。`int()` 不会做"先转 float 再截断"的隐式转换——它只接受整数格式的字符串。如果你需要从小数字符串中取整数部分，必须先 `float()` 再 `int()`：

```python
s = "3.14"
# int(s)  # ValueError!
n = int(float(s))  # 先 float 再 int → 3
```

#### 2.2.2 float()：字符串转浮点数

`float()` 把字符串解析为浮点数，比 `int()` 宽容——同时接受整数格式和小数格式。

```python
# 身高体重 → BMI
height = float(input("请输入身高(米, 如 1.75): "))
weight = float(input("请输入体重(kg, 如 68): "))
bmi = weight / (height ** 2)
print(f"  你的 BMI 是 {bmi:.1f}")
```

运行示例：

```text
请输入身高(米, 如 1.75): 1.75
请输入体重(kg, 如 68): 68
  你的 BMI 是 22.2
```

**float() 能解析什么**：

| 输入字符串 | `float(s)` 结果 | 说明 |
|-----------|----------------|------|
| `"3.14"` | `3.14` | 小数 |
| `"25"` | `25.0` | 整数格式也行 |
| `"-1.5"` | `-1.5` | 支持负号 |
| `"1e3"` | `1000.0` | 支持科学计数法 |
| `"inf"` | `inf` | 无穷大 |
| `"nan"` | `nan` | 非数字 |
| `"3.14abc"` | ValueError | 含非数字字符 |

一个实用建议：当你不确定用户会输入整数还是小数时，统一用 `float()` 转换更安全，因为 `float("25")` 和 `float("3.14")` 都能成功，而 `int("3.14")` 会崩。

#### 2.2.3 str()：把数字转回字符串

`str()` 是 `int()`/`float()` 的逆操作，把数字转成字符串。在需要拼接字符串的场景下很常用：

```python
age = int(input("请输入年龄: "))
# 数字转回字符串用于拼接
print("  年龄存档: " + str(age) + "岁")
# 或者直接用 f-string（更推荐）
print(f"  年龄存档: {age}岁")
```

在现代 Python 中，`str()` 用于拼接的场景大多被 f-string 替代了——f-string 会自动调用 `str()` 转换，写法更简洁。但在某些需要显式转换的场景（如 `join` 要求数字列表先转字符串）仍有用：

```python
nums = [1, 2, 3]
# ", ".join(nums)  # TypeError: join 要求 str
print(", ".join(str(n) for n in nums))  # 输出：1, 2, 3
```

#### 2.2.4 三种转换函数对比

| 函数 | 输入类型 | 输出类型 | 能接受的字符串 | 典型场景 |
|------|---------|---------|---------------|---------|
| `int(s)` | str（整数格式） | int | `"25"`、`"-10"` | 年龄、数量、序号 |
| `float(s)` | str（数字格式） | float | `"3.14"`、`"25"` | 身高、体重、价格 |
| `str(x)` | 任意对象 | str | 任意对象 | 拼接、序列化 |

### 2.3 bool(input()) 的经典陷阱

`input()` 返回字符串，而 Python 中**任何非空字符串的布尔值都是 `True`**——包括 `"False"`、`"no"`、`"0"` 这些"看起来像假"的字符串。这是一个极易踩的坑。

**错误写法**：

```python
answer = input("继续吗? (yes/no): ")
if answer:
    print("  -> 继续")   # 即使输入 no 也会走到这里！
else:
    print("  -> 停止")
```

运行示例：

```text
继续吗? (yes/no): no
  -> 继续
```

用户输入了 `no`，但程序仍然"继续"了。原因是 `bool("no")` 是 `True`——`"no"` 是非空字符串，在布尔上下文中为真。

验证这个行为：

```python
print(bool("no"))     # True
print(bool("false"))  # True
print(bool("0"))      # True
print(bool("False"))  # True
print(bool(""))       # False —— 只有空字符串才是 False
```

**正确写法**：先 `strip()` 去掉空白，再 `lower()` 统一大小写，最后用集合判断：

```python
answer = input("继续吗? (yes/no): ").strip().lower()
if answer in ("yes", "y", "是"):
    print("  -> 继续")
else:
    print("  -> 停止")
```

运行示例：

```text
继续吗? (yes/no): no
  -> 停止
```

**bool 与 input 的行为总结**：

| 用户输入 | `bool(input())` | `input() == ""` | `input().strip() == ""` |
|---------|-----------------|------------------|------------------------|
| `"yes"` | True | False | False |
| `"no"` | True | False | False |
| `"0"` | True | False | False |
| `""` (直接回车) | False | True | True |
| `"   "` (空格) | True | False | True |

结论：千万不要用 `bool(input())` 来判断"用户是否同意"。正确的做法是匹配具体的肯定词或否定词。

### 2.4 多值输入与 split 拆分

有时候需要一次输入多个值（比如多个数字），`input()` 只返回一行字符串，需要用 `split()` 拆分后逐个转换。

#### 2.4.1 空格分隔的多值输入

```python
raw = input("请输入三个数字(空格分隔): ")
parts = raw.split()  # 按任意空白字符分割
nums = [int(p) for p in parts]
print(f"  解析结果: {nums}")
print(f"  总和: {sum(nums)}, 平均值: {sum(nums) / len(nums)}")
```

运行示例：

```text
请输入三个数字(空格分隔): 10 20 30
  解析结果: [10, 20, 30]
  总和: 60, 平均值: 20.0
```

`str.split()` 不传参数时，按**任意空白字符**（空格、Tab、多个连续空格）分割，且自动忽略首尾空白。这比 `split(" ")`（按单个空格分割）更健壮——后者遇到连续空格会产生空字符串元素。

#### 2.4.2 逗号分隔的多值输入（兼容中英文逗号）

```python
raw = input("请输入数字(逗号分隔, 如 10,20,30): ")
# 替换中文逗号→英文逗号，再分割
nums = [int(x.strip()) for x in raw.replace("，", ",").split(",")]
print(f"  解析结果: {nums}, 总和: {sum(nums)}")
```

运行示例：

```text
请输入数字(逗号分隔, 如 10,20,30): 10, 20, 30
  解析结果: [10, 20, 30], 总和: 60

请输入数字(逗号分隔, 如 10,20,30): 10，20，30
  解析结果: [10, 20, 30], 总和: 60
```

这里做了两步处理：
1. `replace("，", ",")` 把中文逗号统一为英文逗号——用户可能用中文输入法，逗号是全角 `，`。
2. `x.strip()` 去掉每个值两边的空格——用户可能输入 `10, 20, 30`（逗号后有空格）。

#### 2.4.3 split 的两种模式对比

| 写法 | 分隔依据 | 对连续空格的处理 | 典型场景 |
|------|---------|----------------|---------|
| `split()` | 任意空白字符 | 合并为一个分隔 | 空格分隔的值 |
| `split(",")` | 指定字符 | 保留空元素 | CSV、固定分隔符 |
| `split(" ")` | 单个空格 | 产生空元素 | 不推荐，不健壮 |

### 2.5 循环校验：while True + try/except

实际开发中，用户输入不可靠——可能输入字母而非数字、可能留空、可能输入范围外的值。直接 `int(input(...))` 一旦遇到非法输入就会崩溃。健壮的输入需要"循环校验"模式：不断提示，直到用户输入合法为止。

#### 2.5.1 基本循环校验

```python
while True:
    s = input("请输入年龄(整数): ")
    try:
        age = int(s)
        break                    # 转换成功，跳出循环
    except ValueError:
        print("  输入无效, 请输入数字。")
print(f"  你的年龄是 {age}")
```

运行示例：

```text
请输入年龄(整数): abc
  输入无效, 请输入数字。
请输入年龄(整数): 25
  你的年龄是 25
```

核心模式：`while True` 无限循环 → `try` 尝试转换 → 成功就 `break` → 失败就 `except` 捕获并提示 → 继续循环。这是一个极其通用的范式，不仅适用于 `int`，任何可能失败的转换都可以用这个模式。

#### 2.5.2 封装成可复用函数（支持默认值）

当多处需要读取整数时，封装成函数更优雅。还可以支持"直接回车使用默认值"：

```python
def read_int(prompt, default=None):
    """读取整数，支持默认值和错误重试。

    Args:
        prompt: 输入提示文本
        default: 用户直接回车时返回的默认值

    Returns:
        用户输入的整数，或默认值
    """
    while True:
        s = input(prompt)
        if s == "" and default is not None:
            return default
        try:
            return int(s)
        except ValueError:
            print("  请输入合法整数。")

# 使用：带默认值
age = read_int("年龄(回车默认 18): ", default=18)
print(f"  最终年龄: {age}")
```

运行示例：

```text
年龄(回车默认 18): 
  最终年龄: 18

年龄(回车默认 18): 25
  最终年龄: 25
```

#### 2.5.3 支持范围校验的增强版

在基本校验基础上加入范围限制，例如年龄必须在 0~150 之间：

```python
def read_int_range(prompt, min_val=None, max_val=None, default=None):
    """读取整数，支持范围校验和默认值。"""
    while True:
        s = input(prompt)
        if s == "" and default is not None:
            return default
        try:
            val = int(s)
        except ValueError:
            print("  请输入合法整数。")
            continue
        if min_val is not None and val < min_val:
            print(f"  不能小于 {min_val}。")
            continue
        if max_val is not None and val > max_val:
            print(f"  不能大于 {max_val}。")
            continue
        return val

age = read_int_range("年龄(0-150): ", min_val=0, max_val=150)
print(f"  年龄: {age}")
```

运行示例：

```text
年龄(0-150): -5
  不能小于 0。
年龄(0-150): 200
  不能大于 150。
年龄(0-150): 25
  年龄: 25
```

### 2.6 进制转换：int() 的 base 参数

`int()` 有一个不太常用的第二参数 `base`，可以把字符串按指定进制解析为十进制整数。

```python
# 把字符串按不同进制解析
print(f"  int('1010', 2)  = {int('1010', 2)}")   # 二进制 → 10
print(f"  int('17', 8)    = {int('17', 8)}")     # 八进制 → 15
print(f"  int('1a', 16)   = {int('1a', 16)}")    # 十六进制 → 26
print(f"  int('ff', 16)   = {int('ff', 16)}")    # 十六进制 → 255
```

运行结果：

```text
  int('1010', 2)  = 10
  int('17', 8)    = 15
  int('1a', 16)   = 26
  int('ff', 16)   = 255
```

**实际场景**：解析十六进制颜色码（如 `#ff00aa`）。

```python
hex_str = input("输入十六进制颜色码(如 ff00aa): ").strip()
try:
    code = int(hex_str, 16)
    print(f"  颜色码 {hex_str} = {code} (十进制)")
except ValueError:
    print("  不是合法的十六进制")
```

运行示例：

```text
输入十六进制颜色码(如 ff00aa): ff00aa
  颜色码 ff00aa = 16711850 (十进制)
```

**反向转换**：把十进制数字转为各进制字符串表示，用 `bin()`、`oct()`、`hex()` 或格式化：

```python
n = 26
print(f"  {n} 的二进制: {bin(n)}")       # 0b11010
print(f"  {n} 的八进制: {oct(n)}")       # 0o32
print(f"  {n} 的十六进制: {hex(n)}")     # 0x1a
print(f"  {n} 的8位二进制: {n:08b}")     # 00011010
```

**进制转换速查表**：

| 操作 | 函数/方法 | 示例 | 结果 |
|------|----------|------|------|
| 字符串→十进制 | `int(s, base)` | `int('1a', 16)` | `26` |
| 数字→二进制串 | `bin(n)` | `bin(26)` | `'0b11010'` |
| 数字→八进制串 | `oct(n)` | `oct(26)` | `'0o32'` |
| 数字→十六进制串 | `hex(n)` | `hex(26)` | `'0x1a'` |
| 格式化二进制 | `f"{n:0Nb}"` | `f"{26:08b}"` | `'00011010'` |
| 格式化十六进制 | `f"{n:0Nx}"` | `f"{255:02x}"` | `'ff'` |

### 2.7 int() 截断 vs round() 四舍五入

从浮点数取整数时，`int()` 和 `round()` 的行为不同，混用会导致难以察觉的 bug。

**int() 的行为——向零截断**：直接丢弃小数部分，不四舍五入。

```python
print(f"  int(3.9)   = {int(3.9)}")    # 3
print(f"  int(-3.9)  = {int(-3.9)}")   # -3
```

注意 `int(-3.9)` 得到 `-3` 而不是 `-4`——`int()` 是向零截断，不是向下取整。`math.floor(-3.9)` 才是 `-4`。

**round() 的行为——四舍六入五成双**（银行家舍入）：

```python
print(f"  round(3.9) = {round(3.9)}")  # 4
print(f"  round(3.5) = {round(3.5)}")  # 4
print(f"  round(2.5) = {round(2.5)}")  # 2 ← 不是 3！
```

`round(2.5)` 得到 `2` 而不是 `3`——这就是"银行家舍入"（四舍六入五成双）：当小数部分正好是 0.5 时，向最近的**偶数**取整。`2.5` 向 `2` 取整（2 是偶数），`3.5` 向 `4` 取整（4 是偶数）。

**对比表**：

| 输入值 | `int()` | `round()` | `math.floor()` | `math.ceil()` |
|--------|---------|-----------|----------------|---------------|
| `3.9` | 3 | 4 | 3 | 4 |
| `3.5` | 3 | 4 | 3 | 4 |
| `3.1` | 3 | 3 | 3 | 4 |
| `2.5` | 2 | 2 | 2 | 3 |
| `-3.9` | -3 | -4 | -4 | -3 |
| `-3.5` | -3 | -4 | -4 | -3 |

**实际场景**：处理金额时要特别小心。

```python
money = float(input("请输入金额(如 3.5): "))
print(f"  int 截断: {int(money)}")
print(f"  round 四舍五入: {round(money)}")
```

运行示例：

```text
请输入金额(如 3.5): 3.5
  int 截断: 3
  round 四舍五入: 4
```

如果用 `int()` 来"四舍五入"金额，`3.9` 元会变成 `3` 元——损失了 0.9 元。正确做法是用 `round()`。

### 2.8 ast.literal_eval：安全解析复杂数据

当用户需要输入列表、字典等复杂结构时，字符串拆分和逐个转换太繁琐。`ast.literal_eval` 可以安全地把字符串解析为 Python 字面量对象。

```python
import ast

raw = input("输入列表(如 [1, 2, 3]): ")
try:
    data = ast.literal_eval(raw)
    print(f"  解析结果: {data}, 类型: {type(data).__name__}")
except (ValueError, SyntaxError):
    print("  输入不是合法的列表字面量")
```

运行示例：

```text
输入列表(如 [1, 2, 3]): [1, 2, 3]
  解析结果: [1, 2, 3], 类型: list

输入列表(如 [1, 2, 3]): {"name": "张三", "age": 25}
  解析结果: {'name': '张三', 'age': 25}, 类型: dict

输入列表(如 [1, 2, 3]): aaa
  输入不是合法的列表字面量
```

**为什么不用 eval()**：`eval()` 可以执行任意 Python 代码，包括 `__import__('os').system('rm -rf /')` 这样的危险操作。如果用户输入恶意代码，`eval()` 会真的执行它。`ast.literal_eval` 只解析字面量（数字、字符串、列表、字典、元组、布尔值、None），不执行任何表达式，是安全的替代方案。

| 函数 | 能解析什么 | 安全性 | 是否执行代码 |
|------|-----------|--------|-------------|
| `eval(s)` | 任意 Python 表达式 | **不安全** | 是，会执行代码 |
| `ast.literal_eval(s)` | 仅字面量（数字、字符串、容器） | 安全 | 否，只解析不执行 |

**能解析的类型**：

```python
ast.literal_eval("42")           # → 42 (int)
ast.literal_eval("3.14")         # → 3.14 (float)
ast.literal_eval("True")         # → True (bool)
ast.literal_eval("None")         # → None
ast.literal_eval("'hello'")      # → 'hello' (str)
ast.literal_eval("[1, 2, 3]")     # → [1, 2, 3] (list)
ast.literal_eval("(1, 2)")       # → (1, 2) (tuple)
ast.literal_eval("{'a': 1}")    # → {'a': 1} (dict)
ast.literal_eval("{1, 2, 3}")    # → {1, 2, 3} (set)
```

### 2.9 菜单式交互程序

将 `input()` 与 `while` 循环结合，可以实现命令行菜单交互——这是命令行工具最常见的交互模式。

```python
def read_int(prompt, default=None):
    """读取整数，支持默认值和错误重试。"""
    while True:
        s = input(prompt)
        if s == "" and default is not None:
            return default
        try:
            return int(s)
        except ValueError:
            print("  请输入合法整数。")

records = []  # 模拟数据存储

while True:
    print("\n=== 记录管理 ===")
    print("1. 添加记录")
    print("2. 删除记录")
    print("3. 查看所有记录")
    print("0. 退出")

    choice = input("请输入选项: ").strip()
    if choice == "1":
        record = input("  输入记录内容: ").strip()
        records.append(record)
        print(f"  已添加: {record}")
    elif choice == "2":
        if not records:
            print("  没有记录可删")
            continue
        for i, r in enumerate(records):
            print(f"  [{i}] {r}")
        idx = read_int("  输入要删除的序号: ")
        if 0 <= idx < len(records):
            removed = records.pop(idx)
            print(f"  已删除: {removed}")
        else:
            print("  序号超出范围")
    elif choice == "3":
        if not records:
            print("  (空)")
        for i, r in enumerate(records):
            print(f"  [{i}] {r}")
    elif choice == "0":
        print("再见")
        break
    else:
        print("  无效选项, 请重新输入")
```

运行示例：

```text
=== 记录管理 ===
1. 添加记录
2. 删除记录
3. 查看所有记录
0. 退出
请输入选项: 1
  输入记录内容: 学习 Python
  已添加: 学习 Python

=== 记录管理 ===
1. 添加记录
2. 删除记录
3. 查看所有记录
0. 退出
请输入选项: 1
  输入记录内容: 写笔记
  已添加: 写笔记

=== 记录管理 ===
1. 添加记录
2. 删除记录
3. 查看所有记录
0. 退出
请输入选项: 3
  [0] 学习 Python
  [1] 写笔记

=== 记录管理 ===
1. 添加记录
2. 删除记录
3. 查看所有记录
0. 退出
请输入选项: 0
再见
```

菜单式交互的结构清晰：外层 `while True` 维持菜单循环 → `input` 读取选项 → `if/elif` 分发到不同操作 → `0` 选项 `break` 退出。这是一个可扩展的模式——添加功能只需增加一个 `elif` 分支。

### 2.10 密码输入：getpass 模块

`input()` 会在用户输入时回显内容到终端——这在输入用户名时没问题，但输入密码时不应回显，否则旁边的人能看到密码。Python 标准库提供了 `getpass` 模块来解决这个问题。

```python
import getpass

username = input("用户名: ")
password = getpass.getpass("密码: ")
print(f"  登录用户: {username}, 密码长度: {len(password)}")
```

运行时，用户名正常显示，密码输入时不回显（终端看不到输入内容）：

```text
用户名: admin
密码: 
  登录用户: admin, 密码长度: 6
```

**getpass 与 input 的区别**：

| 特性 | `input()` | `getpass.getpass()` |
|------|-----------|-------------------|
| 回显输入 | 是 | 否 |
| 返回类型 | str | str |
| 提示信息 | 支持 | 支持 |
| 标准库 | 内置函数 | 需要 `import getpass` |
| 典型场景 | 普通输入 | 密码、令牌等敏感信息 |

### 2.11 多行输入

`input()` 每次只读一行。如果需要输入多行文本（比如录入一段文章），可以用循环读取，直到用户输入一个"结束标记"。

```python
print("输入多行内容, 单独一行输入 END 结束:")
lines = []
while True:
    line = input()
    if line.strip().upper() == "END":
        break
    lines.append(line)

text = "\n".join(lines)
print(f"--- 共 {len(lines)} 行 ---")
print(text)
```

运行示例：

```text
输入多行内容, 单独一行输入 END 结束:
第一行内容
第二行内容
第三行内容
END
--- 共 3 行 ---
第一行内容
第二行内容
第三行内容
```

**关键设计点**：
1. `input()` 不传 `prompt` 参数——多行输入时只在最开始提示一次，每行不重复显示提示符。
2. 结束标记用 `line.strip().upper() == "END"` 判断，兼容大小写和前后空格——用户输入 `end`、`END`、`  end  ` 都能触发结束。
3. 用 `"\n".join(lines)` 拼接，保留每行的换行。

### 2.12 sys.stdin 与管道输入

除了 `input()`，还可以通过 `sys.stdin` 读取输入。`sys.stdin` 是标准输入流对象，支持逐行读取，并且能通过管道接收其他程序的输出。

```python
print("逐行输入数字, Ctrl+D (Mac/Linux) 或 Ctrl+Z (Windows) 结束:")
total = 0
count = 0
while True:
    try:
        line = input()
        num = int(line.strip())
        total += num
        count += 1
    except EOFError:
        break
    except ValueError:
        print(f"  跳过非数字: {line}")

if count > 0:
    print(f"  共输入 {count} 个数字, 总和 {total}, 平均值 {total / count:.2f}")
else:
    print("  未输入任何数字")
```

交互式运行示例：

```text
逐行输入数字, Ctrl+D (Mac/Linux) 或 Ctrl+Z (Windows) 结束:
10
20
30
^D
  共输入 3 个数字, 总和 60, 平均值: 20.00
```

管道模式运行（通过 `echo` 和管道传入数据）：

```bash
echo -e "10\n20\n30" | python demo.py
```

管道模式输出：

```text
  共输入 3 个数字, 总和 60, 平均值: 20.00
```

**EOFError 的来源**：当 `input()` 读到输入流的末尾（EOF，End Of File）时，会抛出 `EOFError`。在交互式终端中，用户按 `Ctrl+D`（Mac/Linux）或 `Ctrl+Z`（Windows）会产生 EOF；在管道模式中，管道数据读完也会产生 EOF。用 `except EOFError: break` 来捕获并退出循环。

**input() vs sys.stdin 逐行读取对比**：

| 特性 | `input()` | `sys.stdin` 循环 |
|------|-----------|-----------------|
| 读一行 | `line = input()` | `line = sys.stdin.readline()` |
| EOF 行为 | 抛 `EOFError` | 返回空字符串 `""` |
| 去换行 | 自动去掉 `\n` | 保留 `\n`，需手动 `strip()` |
| 提示信息 | 支持 `prompt` 参数 | 不支持 |
| 管道兼容 | 兼容 | 兼容 |

---

## 3. 最佳实践

### 3.1 永远校验用户输入

用户输入是不可控的——可能输错、可能故意输入非法值。直接转换不校验是最常见的崩溃来源。

```python
# 不推荐：直接转换，用户输错就崩溃
age = int(input("年龄: "))
print(f"明年 {age + 1} 岁")

# 推荐：try/except 校验，给用户重新输入的机会
while True:
    s = input("年龄: ")
    try:
        age = int(s)
        break
    except ValueError:
        print("  请输入数字。")
print(f"明年 {age + 1} 岁")
```

### 3.2 用 strip() 清理输入空白

用户可能在输入前后多打了空格而不自知。养成 `strip()` 习惯可以避免很多奇怪问题。

```python
# 不推荐：直接使用原始 input
choice = input("继续? (y/n): ")
if choice == "y":   # 用户输入 " y" 就匹配不到
    print("继续")

# 推荐：strip 后再判断
choice = input("继续? (y/n): ").strip()
if choice == "y":
    print("继续")
```

### 3.3 不要用 eval() 解析用户输入

```python
# 不推荐：eval 执行任意代码，安全风险极高
data = eval(input("输入: "))
# 用户输入 __import__('os').system('rm -rf /') 就会真的执行！

# 推荐：ast.literal_eval 只解析字面量，不执行代码
import ast
data = ast.literal_eval(input("输入列表: "))
```

### 3.4 用函数封装重复的输入逻辑

多处需要"读取整数并校验"时，封装成函数，避免到处复制粘贴 `while True + try/except`。

```python
# 不推荐：每次都写完整的校验循环
while True:
    s = input("年龄: ")
    try:
        age = int(s)
        break
    except ValueError:
        print("请输入数字")

while True:
    s = input("体重: ")
    try:
        weight = int(s)
        break
    except ValueError:
        print("请输入数字")

# 推荐：提取函数，一处定义，多处调用
def read_int(prompt, default=None):
    while True:
        s = input(prompt)
        if s == "" and default is not None:
            return default
        try:
            return int(s)
        except ValueError:
            print("  请输入合法整数。")

age = read_int("年龄: ")
weight = read_int("体重: ")
```

### 3.5 bool(input()) 判断的用户意图时要匹配关键词

```python
# 不推荐：bool(input()) 永远为 True（除非空字符串）
if input("继续? (y/n): "):
    do_something()   # 输入 "n" 也会执行！

# 推荐：匹配具体的关键词
answer = input("继续? (y/n): ").strip().lower()
if answer in ("y", "yes", "是"):
    do_something()
```

### 3.6 多值输入统一处理分隔符

```python
# 不推荐：假设用户一定用空格或一定用逗号
nums = input("输入数字: ").split()  # 逗号分隔时无法处理

# 推荐：先替换中文逗号，再按逗号或空格统一分割
raw = input("输入数字: ").replace("，", ",")
# 同时兼容空格和逗号
parts = raw.replace(",", " ").split()  # 先把逗号换成空格，再统一 split
nums = [int(p) for p in parts]
print(nums)
```

### 3.7 密码输入用 getpass 而非 input

```python
# 不推荐：input 回显密码，旁边人能看到
password = input("密码: ")

# 推荐：getpass 不回显，保护隐私
import getpass
password = getpass.getpass("密码: ")
```

### 3.8 int() 取整和 round() 四舍五入不要混用

```python
# 不推荐：用 int() 做"四舍五入"——实际上是截断
price = 3.9
print(int(price))   # 3，损失了 0.9

# 推荐：需要四舍五入用 round()
print(round(price))  # 4

# 注意 round 的银行家舍入行为
print(round(2.5))    # 2，不是 3
print(round(3.5))    # 4
```

---

## 4. 原理

### 4.1 input() 的底层行为

`input()` 的底层实现可以简化为以下等价模型：

```python
def my_input(prompt=""):
    import sys
    if prompt:
        sys.stdout.write(prompt)
        sys.stdout.flush()
    line = sys.stdin.readline()   # 从标准输入读一行
    if not line:                  # 读到 EOF
        raise EOFError("EOF when reading a line")
    return line.rstrip("\n")     # 去掉末尾换行符后返回
```

核心步骤：
1. **写提示**：如果有 `prompt`，先写到 `sys.stdout`，并 `flush` 确保立即显示。
2. **读一行**：调用 `sys.stdin.readline()` 阻塞等待，直到用户输入一行（以 `\n` 结尾）。
3. **处理 EOF**：如果 `readline()` 返回空字符串，说明输入流已结束（管道关闭或 Ctrl+D），抛出 `EOFError`。
4. **去换行**：`rstrip("\n")` 去掉行末换行符，返回纯内容字符串。

这就是为什么 `input()` 返回的字符串**不含换行符**——它在返回前已经去掉了。这也解释了为什么 `input()` 永远返回字符串——它操作的最小单位就是"一行文本"，不关心文本内容的语义。

### 4.2 int() 解析字符串的内部逻辑

`int()` 把字符串转为整数时，内部经历以下步骤：

1. 如果参数不是字符串，走数值转换逻辑（如 `int(3.9)` 直接截断）。
2. 如果是字符串，先 `strip()` 去掉首尾空白。
3. 检查可选的符号位（`+` 或 `-`）。
4. 按 `base` 参数（默认 10）逐字符解析每个数字位。
5. 如果任何字符不在当前进制的合法范围内，抛出 `ValueError`。

这解释了为什么 `int("3.14")` 会报错——遇到小数点 `.` 后，第 4 步的逐字符解析发现 `.` 不是十进制数字（0-9），立即抛出 `ValueError`。`int()` 不会"智能地"先转 float 再取整。

````text
int("3.14") 的解析过程：

  字符 '3' → 合法十进制数字 → 累积值 = 3
  字符 '.' → 不是合法十进制数字 → 抛出 ValueError！
  
int("  -25  ") 的解析过程：

  strip → "-25"
  字符 '-' → 符号位，记录为负数
  字符 '2' → 合法 → 累积值 = 2
  字符 '5' → 合法 → 累积值 = 25
  最终结果 = -25
````

### 4.3 bool(input()) 为什么永远为 True

Python 中 `bool()` 的判断规则对字符串是：**空字符串 `""` 为 `False`，任何非空字符串为 `True`**。这来自于 `str` 类的 `__bool__` 魔术方法实现。

```python
# 等价行为
bool("")     == False   # 空字符串 → False
bool("0")    == True    # 非空 → True（"0"是一个字符，不是数字零）
bool("False") == True   # 非空 → True
bool("no")   == True    # 非空 → True
bool(" ")    == True    # 空格也是非空 → True（注意和 "" 不同）
```

关键理解：`bool("0")` 为 `True` 是因为 `"0"` 是一个**字符串**，其中包含字符 `'0'`。字符串的 `__bool__` 只看长度——长度为 0（空串）才返回 `False`，长度 > 0 一律返回 `True`。它不会去解析字符串内容是否"看起来像 False"。

这与 `bool(0)` 完全不同：

```python
bool(0)      == False   # 整数 0 → False
bool("0")    == True    # 字符串 "0" → True（完全不同的类型和行为）
```

这就是 `if input("继续? (y/n)")` 陷阱的根源——`input()` 返回字符串，字符串的 `bool()` 只看长度，不看内容。

---

## 5. 总结

本文围绕 `input()` 函数与类型转换展开，主要介绍了以下内容：

- **input() 的核心行为**：从标准输入读取一行文本，返回值永远是 `str` 类型，不管用户输入的是数字还是其他内容。
- **基础类型转换**：`int()` 把整数字符串转为整数，`float()` 把数字字符串转为浮点数，`str()` 把任意对象转为字符串。三者各有能接受和不能接受的输入格式。
- **bool(input()) 陷阱**：非空字符串在布尔上下文中永远为 `True`，包括 `"no"`、`"0"`、`"False"` 等——判断用户意图时要匹配具体关键词，而非直接 `bool()`。
- **多值输入**：用 `split()` 将一行输入拆分为多个值，支持空格分隔和逗号分隔，注意兼容中文逗号。
- **循环校验范式**：`while True` + `try/except` 是健壮输入的标准模式，可封装为函数支持默认值和范围校验。
- **进制转换**：`int(s, base)` 按指定进制解析字符串，`bin()`/`oct()`/`hex()` 做反向转换。
- **int() 截断 vs round() 四舍五入**：`int()` 向零截断（丢弃小数），`round()` 银行家舍入（四舍六入五成双），处理金额时要注意区分。
- **ast.literal_eval**：安全解析列表、字典等 Python 字面量，替代危险的 `eval()`。
- **菜单式交互**：`while` 循环 + `input()` + `if/elif` 分发，构建命令行菜单程序。
- **getpass 模块**：密码输入不回显，保护敏感信息。
- **多行输入**：循环读取 `input()` 直到结束标记，适用于批量文本录入。
- **sys.stdin 与管道输入**：通过管道接收数据，`EOFError` 标志输入结束。
- **最佳实践**：永远校验输入、`strip()` 清理空白、禁用 `eval()`、封装输入函数、`getpass` 输密码、区分 `int()` 和 `round()` 的取整行为。
- **原理**：`input()` 底层通过 `sys.stdin.readline()` 读取并去掉换行符；`int()` 逐字符解析，遇到非法字符即报错；字符串的 `bool()` 只看长度不看内容，这是 `bool(input())` 陷阱的根源。
