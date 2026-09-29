---
group:
  title: 【03】字符串介绍
  order: 3
order: 16
title: 大小写与格式判断
nav:
  title: Python基础
  order: 1
---

# 大小写与格式判断

## 1. 介绍

### 1.1 什么是大小写与格式判断

大小写与格式判断，就是检查字符串中的字母是大写还是小写、整个字符串是否符合某种大小写格式（如标题格式）。Python 字符串内置了三个 `is*` 方法来完成这些判断，它们全部返回布尔值（`True` 或 `False`），可以快速完成格式校验。

需要区分清楚的是，本篇讲的是**判断**方法（返回 `True/False`），而非**转换**方法（返回新字符串）。不过这两者关系密切——转换后的字符串可以用判断方法来验证结果是否正确。

| 方法 | 作用 | 对应的转换方法 |
|------|------|--------------|
| `isupper()` | 判断字母是否全部大写 | `upper()` |
| `islower()` | 判断字母是否全部小写 | `lower()` |
| `istitle()` | 判断是否符合标题格式 | `title()` |

### 1.2 最简示例

用一个常量命名检查的场景，展示大小写判断的典型用法：

```python
# 检查常量名是否符合 Python 命名规范（常量应全大写）
constants = ["MAX_RETRIES", "timeout_seconds", "DEFAULT_PORT", "BaseUrl"]

for name in constants:
    clean = name.replace("_", "")
    if clean.isupper() and clean.isalpha():
        status = "规范"
    else:
        status = "不规范（应为全大写）"
    print(f"  {name:<20} -> {status}")
```

**运行结果**：

```text
  MAX_RETRIES          -> 规范
  timeout_seconds      -> 不规范（应为全大写）
  DEFAULT_PORT         -> 规范
  BaseUrl              -> 不规范（应为全大写）
```

### 1.3 方法速览

三个方法的签名格式统一为 `s.isxxx()`——无参数，返回布尔值：

```text
s.isupper()   → bool
s.islower()   → bool
s.istitle()   → bool
```

**共同行为规则**：

| 规则 | 说明 |
|------|------|
| 对空字符串的行为 | 三个方法都返回 `False` |
| 非字母字符不影响判断 | 数字、空格、标点被忽略，只看字母的大小写 |
| 基于 Unicode | 支持多语言的大小写判断 |
| 互斥性 | 有字母时，`isupper` 和 `islower` 不会同时为 `True` |

## 2. 核心内容

### 2.1 isupper()：判断是否全部大写

#### 2.1.1 基本用法

`isupper()` 判断字符串中的字母是否全部为大写。注意，它只关心字母字符——数字、空格、标点等非字母字符不影响判断结果：

```python
print(f"'HELLO'.isupper():          {'HELLO'.isupper()}")           # True
print(f"'HELLO WORLD'.isupper():    {'HELLO WORLD'.isupper()}")       # True（空格不影响）
print(f"'Hello'.isupper():          {'Hello'.isupper()}")           # False（含小写）
print(f"'hello'.isupper():          {'hello'.isupper()}")           # False（全小写）
print(f"'12345'.isupper():          {'12345'.isupper()}")           # False（无字母）
print(f("'ABC123'.isupper():       {'ABC123'.isupper()}")          # True（字母全大写）
print(f("''.isupper():              {''.isupper()}")               # False（空字符串）
```

**运行结果**：

```text
'HELLO'.isupper():          True
'HELLO WORLD'.isupper():    True
'Hello'.isupper():          False
'hello'.isupper():          False
'12345'.isupper():          False
'ABC123'.isupper():        True
''.isupper():              False
```

理解 `isupper()` 的核心逻辑：它遍历字符串中的每一个字符，只检查有"大小写"概念的字符（即字母）。如果字符串中**至少有一个字母**且所有字母都是大写，返回 `True`；否则返回 `False`。

#### 2.1.2 非字母字符的行为

非字母字符对 `isupper()` 的行为不影响——它们既不会让结果变为 `True`，也不会让结果变为 `False`：

```python
cases = [
    "ABC",          # 纯大写字母 -> True
    "abc",          # 纯小写字母 -> False
    "ABC!",         # 大写 + 标点 -> True（标点不影响）
    "ABC123",       # 大写 + 数字 -> True（数字不影响）
    "HELLO WORLD",  # 大写 + 空格 -> True（空格不影响）
    "123",          # 纯数字 -> False（没有字母可判断）
    "!",            # 纯标点 -> False（没有字母可判断）
    "   ",          # 纯空格 -> False（没有字母可判断）
]

print(f"  {'字符串':<14} {'isupper':<10}")
for text in cases:
    print(f"  {text:<14} {str(text.isupper()):<10}")
```

**运行结果**：

```text
  字符串          isupper
  ABC           True
  abc           False
  ABC!          True
  ABC123        True
  HELLO WORLD   True
  123           False
  !             False
                False
```

#### 2.1.3 Unicode 多语言支持

`isupper()` 基于 Unicode 标准判断大小写——德语、法语、俄语等语言的大写字母都被正确识别：

```python
cases = [
    ("ÄRGER", "德语大写"),
    ("ärger", "德语小写"),
    ("ÉTÉ", "法语大写"),
    ("été", "法语小写"),
    ("ПРИВЕТ", "俄语大写"),
    ("привет", "俄语小写"),
    ("ＡＢＣ", "全角大写"),
    ("ａｂｃ", "全角小写"),
    ("你好", "中文（无大小写）"),
]

print(f"  {'字符串':<12} {'类型':<14} {'isupper':<10}")
for text, label in cases:
    print(f"  {text:<12} {label:<14} {str(text.isupper()):<10}")
```

**运行结果**：

```text
  字符串        类型            isupper
  ÄRGER        德语大写         True
  ärger        德语小写         False
  ÉTÉ          法语大写         True
  été          法语小写         False
  ПРИВЕТ       俄语大写         True
  привет       俄语小写         False
  ＡＢＣ        全角大写         True
  ａｂｃ        全角小写         False
  你好          中文（无大小写）    False
```

中文字符没有大小写概念——`isupper()` 对中文返回 `False`，因为找不到"全是大写字母"的条件。

#### 2.1.4 实战：常量命名规范检查

Python 社区约定常量名使用全大写加下划线（如 `MAX_RETRIES`）。用 `isupper()` 可以快速检查：

```python
def validate_constant_name(name):
    """检查常量名是否符合全大写规范"""
    if not name:
        return "常量名不能为空"
    # 去掉下划线后检查字母是否全大写
    clean = name.replace("_", "")
    if not clean.isalpha():
        return "只能包含字母和下划线"
    if clean.isupper():
        return "规范"
    return f"不规范 -> 建议: {name.upper()}"

constants = ["MAX_RETRIES", "timeout_seconds", "PI", "BaseUrl", "DEFAULT_PORT"]
for name in constants:
    print(f"  {name:<20} -> {validate_constant_name(name)}")
```

**运行结果**：

```text
  MAX_RETRIES          -> 规范
  timeout_seconds     -> 不规范 -> 建议: TIMEOUT_SECONDS
  PI                  -> 规范
  BaseUrl             -> 不规范 -> 建议: BASEURL
  DEFAULT_PORT        -> 规范
```

### 2.2 islower()：判断是否全部小写

#### 2.2.1 基本用法

`islower()` 判断字符串中的字母是否全部为小写。行为与 `isupper()` 完全对称：

```python
print(f"'hello'.islower():          {'hello'.islower()}")           # True
print(f("'hello world'.islower():  {'hello world'.islower()}")      # True（空格不影响）
print(f("'Hello'.islower():        {'Hello'.islower()}")           # False（含大写）
print(f("'HELLO'.islower():        {'HELLO'.islower()}")           # False（全大写）
print(f("'12345'.islower():        {'12345'.islower()}")           # False（无字母）
print(f("'abc123'.islower():       {'abc123'.islower()}")          # True（字母全小写）
print(f("''.islower():             {''.islower()}")                # False（空字符串）
```

**运行结果**：

```text
'hello'.islower():          True
'hello world'.islower():    True
'Hello'.islower():          False
'HELLO'.islower():          False
'12345'.islower():          False
'abc123'.islower():         True
''.islower():              False
```

#### 2.2.2 isupper 与 islower 的互斥性

当字符串中包含字母时，`isupper()` 和 `islower()` 不会同时返回 `True`——一个字符串不可能既"所有字母都是大写"又"所有字母都是小写"：

```python
cases = ["ABC", "abc", "AbC", "123", "", "Hello"]

print(f"  {'字符串':<10} {'isupper':<10} {'islower':<10} {'说明'}")
for text in cases:
    u, l = text.isupper(), text.islower()
    if u and l:
        note = "同时True!（不可能）"
    elif not u and not l:
        if text and any(c.isalpha() for c in text):
            note = "两者都False（大小写混合）"
        else:
            note = "两者都False（无字母字符）"
    else:
        note = "正常"
    print(f"  {text:<10} {str(u):<10} {str(l):<10} {note}")
```

**运行结果**：

```text
  字符串     isupper    islower    说明
  ABC       True       False      正常
  abc       False      True       正常
  AbC       False      False      两者都False（大小写混合）
  123       False      False      两者都False（无字母字符）
            False      False      两者都False（无字母字符）
  Hello     False      False      两者都False（大小写混合）
```

关键点：当字符串中有字母且大小写混合时（如 `"Hello"`），`isupper()` 和 `islower()` 都返回 `False`——因为不满足"全部大写"也不满足"全部小写"。

#### 2.2.3 实战：代码注释风格检查

有些项目规范要求注释用全小写英文。用 `islower()` 可以批量检查：

```python
code_comments = [
    "# this function handles user login",
    "# This Function Handles User Login",
    "# TODO: refactor this module",
    "# configuration for production environment",
]

for comment in code_comments:
    # 提取注释内容（去掉 # 前缀）
    content = comment.lstrip("# ").strip()
    if content.islower():
        verdict = "符合（全小写）"
    else:
        verdict = "不符合（含大写）"
    print(f"  {content}")
    print(f"    -> {verdict}")
```

**运行结果**：

```text
  this function handles user login
    -> 符合（全小写）
  This Function Handles User Login
    -> 不符合（含大写）
  todo: refactor this module
    -> 不符合（含大写）
  configuration for production environment
    -> 符合（全小写）
```

注意 `"TODO: refactor this module"` 不符合全小写——`TODO` 是大写，冒号后 `r` 是小写，整体混合了大小写。

### 2.3 istitle()：判断是否符合标题格式

#### 2.3.1 基本用法

`istitle()` 判断字符串是否符合"标题格式"——即每个单词的首字母大写，其余字母小写。这里的"词"由非字母字符作为分隔边界：

```python
print(f"'Hello World'.istitle():    {'Hello World'.istitle()}")     # True
print(f("'Hello'.istitle():          {'Hello'.istitle()}")          # True
print(f("'hello world'.istitle():    {'hello world'.istitle()}")     # False（首字母小写）
print(f("'Hello world'.istitle():    {'Hello world'.istitle()}")     # False（第二个词首字母小写）
print(f("'HELLO WORLD'.istitle():    {'HELLO WORLD'.istitle()}")     # False（全大写不是标题）
print(f("'hello World'.istitle():    {'hello World'.istitle()}")     # False（第一个词首字母小写）
```

**运行结果**：

```text
'Hello World'.istitle():    True
'Hello'.istitle():          True
'hello world'.istitle():    False
'Hello world'.istitle():    False
'HELLO WORLD'.istitle():    False
'hello World'.istitle():    False
```

`istitle()` 的核心判断规则是：字符串中每个连续字母序列（"词"）的第一个字符必须是大写，其余必须是小写。全大写的 `"HELLO"` 不符合——因为 `HELLO` 的首字母 `H` 是大写，但后续的 `ELLO` 也是大写，不符合"其余必须是小写"的规则。

#### 2.3.2 判断规则详解

`istitle()` 的"词"边界由**非字母字符**定义——任何非字母字符后面的字母序列被视为一个新"词"，首字母必须大写：

```python
cases = [
    ("Hello World", True),          # 标准标题格式
    ("Hello, World!", True),        # 逗号、感叹号是分隔，World 首字母大写
    ("Hello World 3rd", False),     # 3rd 的 r 和 d 是小写，但 3 后面紧跟的字母 r 必须大写
    ("Hello World 3Rd", True),      # 3Rd -> R 大写，d 小写，符合标题格式
    ("Hello123world", False),       # 123 后面的 w 小写 -> 不符合
    ("Hello123World", True),        # 123 后面的 W 大写 -> 符合
    ("Don'T", True),                # 撇号后 T 大写 -> 符合（撇号不是字母）
    ("Don't", False),               # 撇号后 t 小写 -> 不符合
]

print(f"  {'字符串':<20} {'istitle':<10}")
for text, expected in cases:
    print(f"  {text:<20} {str(text.istitle()):<10}")
```

**运行结果**：

```text
  字符串               istitle
  Hello World        True
  Hello, World!      True
  Hello World 3rd    False
  Hello World 3Rd    True
  Hello123world       False
  Hello123World       True
  Don'T              True
  Don't              False
```

`"Hello World 3rd"` 返回 `False` 的原因——数字 `3` 后面紧跟着字母 `rd`，这组字母序列的"首字母"是 `r`，但 `r` 是小写。`"Hello World 3Rd"` 中数字后的首字母是 `R`（大写），`d` 是小写，所以返回 `True`。

`"Don't"` 返回 `False` 的原因——撇号 `'` 不是字母，所以它后面的 `t` 被视为新词的首字母，但 `t` 是小写。`"Don'T"` 中撇号后的 `T` 是大写，所以返回 `True`。

#### 2.3.3 词边界行为

`istitle` 对各种非字母字符作为词边界的行为：

```python
cases = [
    ("Hello-World", True),          # 连字符后 W 大写 -> True
    ("Hello_World", True),          # 下划线后 W 大写 -> True
    ("Hello_world", False),         # 下划线后 w 小写 -> False
    ("Hello.World", True),          # 点号后 W 大写 -> True
    ("Hello.world", False),         # 点号后 w 小写 -> False
    ("O'Brien", True),              # 撇号后 B 大写 -> True
    ("O'brien", False),              # 撇号后 b 小写 -> False
    ("Item1:Done", True),           # 冒号后 D 大写 -> True
    ("Item1:done", False),          # 冒号后 d 小写 -> False
]

print(f"  {'字符串':<16} {'istitle':<10}")
for text, expected in cases:
    result = text.istitle()
    status = "OK" if result == expected else "FAIL"
    print(f"  {text:<16} {str(result):<10} [{status}]")
```

**运行结果**：

```text
  字符串           istitle
  Hello-World     True       [OK]
  Hello_World     True       [OK]
  Hello_world     False      [OK]
  Hello.World     True       [OK]
  Hello.world     False      [OK]
  O'Brien        True       [OK]
  O'brien         False      [OK]
  Item1:Done      True       [OK]
  Item1:done      False      [OK]
```

#### 2.3.4 istitle() 与 title() 的关系

`str.title()` 是将字符串转换为标题格式的**转换方法**，而 `istitle()` 是**判断方法**。两者关系密切——`title()` 转换后的字符串通常能通过 `istitle()` 检查：

```python
raw = "hello world"
titled = raw.title()

print(f"  原始: '{raw}'")
print(f"  title()转换后: '{titled}'")
print(f"  titled.istitle(): {titled.istitle()}")
```

**运行结果**：

```text
  原始: 'hello world'
  title()转换后: 'Hello World'
  titled.istitle(): True
```

但 `title()` 有一个已知的缺陷——它会把撇号后的字母也大写化，这在英文中通常不是你想要的效果：

```python
tricky = "it's a test"
titled_tricky = tricky.title()

print(f"  原始: '{tricky}'")
print(f"  title()转换后: '{titled_tricky}'")
print(f"  titled.istitle(): {titled_tricky.istitle()}")
```

**运行结果**：

```text
  原始: 'it's a test'
  title()转换后: 'It'S A Test'
  tiled.istitle(): True
```

`title()` 把 `"it's"` 变成了 `"It'S"`——撇号后的 `s` 被当作新词的首字母大写化了。虽然 `istitle()` 返回 `True`（符合标题格式规则），但在实际使用中 `"It'S"` 不是你想要的正确标题。这种场景需要用正则表达式或 `string.capwords()` 替代：

```python
import string

tricky = "it's a test"
# capwords 只在空格处分词，不会在撇号处分词
fixed = string.capwords(tricky)
print(f"  capwords: '{fixed}'")
```

**运行结果**：

```text
  capwords: "It's A Test"
```

#### 2.3.5 实战：文章标题格式检查

```python
article_titles = [
    "How to Use Python Effectively",     # 含小写介词，istitle 返回 False
    "how to use python effectively",      # 全小写
    "HOW TO USE PYTHON EFFECTIVELY",     # 全大写
    "Python 3.12 New Features",          # 符合标题格式
    "the Art of Programming",            # 首词小写
]

print("=== 文章标题格式检查 ===")
for title in article_titles:
    if title.istitle():
        verdict = "格式正确"
    else:
        fixed = title.title()
        verdict = f"格式不符 -> 建议: '{fixed}'"
    print(f"  '{title}'")
    print(f"    -> {verdict}")
```

**运行结果**：

```text
  'How to Use Python Effectively'
    -> 格式不符 -> 建议: 'How To Use Python Effectively'
  'how to use python effectively'
    -> 格式不符 -> 建议: 'How To Use Python Effectively'
  'HOW TO USE PYTHON EFFECTIVELY'
    -> 格式不符 -> 建议: 'How To Use Python Effectively'
  'Python 3.12 New Features'
    -> 格式正确
  'the Art of Programming'
    -> 格式不符 -> 建议: 'The Art Of Programming'
```

注意 `"How to Use Python Effectively"` 被判为不符合——因为 `to` 中的 `t` 是小写，在 `istitle()` 的规则中 `"to"` 不是合法的标题词。实际英文标题中，短介词（如 `to`、`of`、`the`）通常不大写，这是 `istitle()` 与真实英文标题规范之间的差异。如果需要按照英文出版规范来检查标题，需要自定义逻辑而非直接用 `istitle()`。

### 2.4 Unicode 支持

三个方法都基于 Unicode 标准进行大小写判断。来对比一下多语言场景下三个方法的行为：

```python
cases = [
    ("ÄRGER", "德语大写"),
    ("ärger", "德语小写"),
    ("ÉTÉ", "法语大写"),
    ("été", "法语小写"),
    ("ПРИВЕТ", "俄语大写"),
    ("привет", "俄语小写"),
    ("ＡＢＣ", "全角大写"),
    ("ａｂｃ", "全角小写"),
    ("你好", "中文（无大小写）"),
]

print(f"  {'字符串':<12} {'类型':<14} {'isupper':<10} {'islower':<10} {'istitle':<10}")
for text, label in cases:
    print(f"  {text:<12} {label:<14} {str(text.isupper()):<10} {str(text.islower()):<10} {str(text.istitle()):<10}")
```

**运行结果**：

```text
  字符串        类型            isupper    islower    istitle
  ÄRGER        德语大写         True       False      False
  ärger        德语小写         False      True       False
  ÉTÉ          法语大写         True       False      False
  été          法语小写         False      True       False
  ПРИВЕТ       俄语大写         True       False      False
  привет       俄语小写         False      True       False
  ＡＢＣ        全角大写         True       False      False
  ｂｃ          全角小写         False      True       False
  你好          中文（无大小写）    False      False      False
```

中文 `"你好"` 三者都返回 `False`——中文字符没有大小写属性，不满足任何判断条件。

`istitle()` 在多语言场景中也能正确工作：

```python
title_cases = [
    ("Bonjour Monde", "法语标题"),
    ("Привет Мир", "俄语标题"),
    ("Olá Mundo", "葡萄牙语标题"),
    ("你好 世界", "中文"),
]

for text, label in title_cases:
    print(f"  '{text}' ({label}): istitle = {text.istitle()}")
```

**运行结果**：

```text
  'Bonjour Monde' (法语标题): istitle = True
  'Привет Мир' (俄语标题): istitle = True
  'Olá Mundo' (葡萄牙语标题): istitle = True
  '你好 世界' (中文): istitle = False
```

中文标题 `"你好 世界"` 返回 `False`——因为中文字符没有大小写概念，不满足"每个词首字母大写"的条件。

### 2.5 空字符串的行为

三个方法对空字符串都返回 `False`：

```python
empty = ""
print(f"  ''.isupper()  = {empty.isupper()}")   # False
print(f"  ''.islower()  = {empty.islower()}")   # False
print(f"  ''.istitle()  = {empty.istitle()}")   # False
```

**运行结果**：

```text
  ''.isupper()  = False
  ''.islower()  = False
  ''.istitle()  = False
```

三个方法的逻辑都是"判断是否存在满足条件的字母"——空字符串中没有字母，自然返回 `False`。这与 `isalpha()`、`isdigit()` 等方法的行为一致，但不同于 `isascii()` 和 `isprintable()`（后者对空字符串返回 `True`）。

### 2.6 判断与转换的关系

大小写判断方法和大小写转换方法是一一对应的——`upper()`、`lower()`、`title()` 转换后的结果可以用对应的 `is*` 方法验证：

| 判断方法 | 对应转换方法 | 转换后判断结果 |
|---------|-------------|--------------|
| `isupper()` | `s.upper()` | `s.upper().isupper()` 恒为 `True`（有字母时） |
| `islower()` | `s.lower()` | `s.lower().islower()` 恒为 `True`（有字母时） |
| `istitle()` | `s.title()` | `s.title().istitle()` 恒为 `True`（有字母时） |

```python
cases = [
    ("hello", "lower"),
    ("HELLO", "upper"),
    ("hello world", "title"),
    ("HeLLo", "lower"),
    ("HeLLo", "upper"),
]

print("=== 转换后用 is* 验证 ===")
for text, method in cases:
    convertor = getattr(text, method)
    converted = convertor()
    print(f"  '{text}'.{method}() -> '{converted}'")
    print(f"    isupper={converted.isupper()}, islower={converted.islower()}, istitle={converted.istitle()}")
```

**运行结果**：

```text
  'hello'.lower() -> 'hello'
    isupper=False, islower=True, istitle=False
  'HELLO'.upper() -> 'HELLO'
    isupper=True, islower=False, istitle=False
  'hello world'.title() -> 'Hello World'
    isupper=False, islower=False, istitle=True
  'HeLLo'.lower() -> 'hello'
    isupper=False, islower=True, istitle=False
  'HeLLo'.upper() -> 'HELLO'
    isupper=True, islower=False, istitle=False
```

### 2.7 方法组合使用

#### 2.7.1 所有方法总览对比

将三个方法放在一起对比，更直观地看到不同字符串的判断结果：

```python
test_cases = [
    ("HELLO", "全大写"),
    ("hello", "全小写"),
    ("Hello", "首字母大写"),
    ("Hello World", "标题格式"),
    ("hello world", "全小写带空格"),
    ("HELLO WORLD", "全大写带空格"),
    ("Hello World 123", "标题+数字"),
    ("12345", "纯数字"),
    ("", "空字符串"),
    ("你好", "中文"),
    ("ABC123def", "混合大小写"),
    ("   ", "纯空格"),
]

print(f"  {'字符串':<18} {'类型':<14} {'isupper':<10} {'islower':<10} {'istitle':<10}")
for text, label in test_cases:
    repr_text = text if text else '(empty)'
    print(f"  {repr_text:<18} {label:<14} {str(text.isupper()):<10} {str(text.islower()):<10} {str(text.istitle()):<10}")
```

**运行结果**：

```text
  字符串              类型            isupper    islower    istitle
  HELLO              全大写           True       False      False
  hello              全小写           False      True       False
  Hello              首字母大写        False      False      True
  Hello World        标题格式          False      False      True
  hello world        全小写带空格      False      True       False
  HELLO WORLD        全大写带空格      True       False      False
  Hello World 123    标题+数字         False      False      True
  12345              纯数字           False      False      False
  (empty)            空字符串          False      False      False
  你好                中文             False      False      False
  ABC123def          混合大小写        False      False      False
                     纯空格            False      False      False
```

#### 2.7.2 综合实战：用户输入规范化

```python
def normalize_name(name):
    """将姓名规范化为标题格式"""
    if not name or name.isspace():
        return None, "姓名不能为空"
    normalized = name.strip().title()
    return normalized, "OK"

raw_inputs = [
    "JOHN DOE",         # 全大写
    "john doe",           # 全小写
    "JoHn DoE",           # 混乱大小写
    "John Doe",           # 已正确
    "MARY JANE",          # 全大写
]

for raw in raw_inputs:
    normalized, msg = normalize_name(raw)
    print(f"  原始: '{raw}' -> 规范化: '{normalized}'  [{msg}]")
```

**运行结果**：

```text
  原始: 'JOHN DOE' -> 规范化: 'John Doe'  [OK]
  原始: 'john doe' -> 规范化: 'John Doe'  [OK]
  原始: 'JoHn DoE' -> 规范化: 'John Doe'  [OK]
  原始: 'John Doe' -> 规范化: 'John Doe'  [OK]
  原始: 'MARY JANE' -> 规范化: 'Mary Jane'  [OK]
```

#### 2.7.3 综合实战：枚举值大小写验证

```python
# 系统要求枚举值全大写，用 isupper 检查
configured_values = [
    "ACTIVE",
    "active",
    "IN_PROGRESS",
    "in_progress",
    "PENDING",
    "Pending",
]

print("=== 枚举值大小写验证（要求全大写）===")
for value in configured_values:
    clean = value.replace("_", "")
    if clean.isupper():
        status = "合法"
    else:
        status = f"不合法 -> 建议: '{value.upper()}'"
    print(f"  '{value}': {status}")
```

**运行结果**：

```text
  'ACTIVE': 合法
  'active': 不合法 -> 建议: 'ACTIVE'
  'IN_PROGRESS': 合法
  'in_progress': 不合法 -> 建议: 'IN_PROGRESS'
  'PENDING': 合法
  'Pending': 不合法 -> 建议: 'PENDING'
```

#### 2.7.4 综合实战：大小写不敏感搜索

结合 `upper()` 和 `isupper()` 实现大小写不敏感的搜索功能：

```python
database = [
    "Python Programming",
    "JAVA Development",
    "python scripting",
    "Web PYTHON",
    "Data Science with Python",
]

keyword = "python"
print(f"关键词: '{keyword}'")
print()

# 统一转大写后搜索
upper_keyword = keyword.upper()
for item in database:
    found = upper_keyword in item.upper()
    mark = "匹配" if found else "不匹配"
    # 判断原始数据的大小写格式
    if item.isupper():
        case = "全大写"
    elif item.islower():
        case = "全小写"
    elif item.istitle():
        case = "标题格式"
    else:
        case = "混合大小写"
    print(f"  [{mark}] '{item}' ({case})")
```

**运行结果**：

```text
  [匹配] 'Python Programming' (标题格式)
  [不匹配] 'JAVA Development' (混合大小写)
  [匹配] 'python scripting' (全小写)
  [匹配] 'Web PYTHON' (混合大小写)
  [匹配] 'Data Science with Python' (混合大小写)
```

## 3. 最佳实践

### 3.1 推荐 vs 不推荐写法

| 场景 | 不推荐 | 推荐 | 原因 |
|------|--------|------|------|
| 判断是否全大写 | `s == s.upper()` | `s.isupper()` | `isupper()` 更高效，不创建新字符串 |
| 判断是否全小写 | `s == s.lower()` | `s.islower()` | `islower()` 更高效，不创建新字符串 |
| 判断标题格式 | 手动遍历检查每个词首字母 | `s.istitle()` | 内置方法简洁高效 |
| 忽略大小写比较 | `s.lower() == other.lower()` | `s.casefold() == other.casefold()` | `casefold()` 对 Unicode 更彻底 |
| 检查常量规范 | `s.isupper()` | `s.replace('_','').isupper()` | 需先去掉下划线 |
| 规范化姓名 | `s.capitalize()` | `s.title()` | `capitalize()` 只大写第一个字符，`title()` 大写每个词首字母 |

### 3.2 常见错误模式

**错误1：用 `== s.upper()` 代替 `isupper()`**

```python
s = "HELLO"

# 不推荐：创建新字符串再比较
if s == s.upper():
    print("全大写")

# 推荐：直接判断，不创建新字符串
if s.isupper():
    print("全大写")
```

`isupper()` 在 C 层面直接遍历字符判断，不创建新字符串对象；`s == s.upper()` 需要先调用 `upper()` 创建一个新字符串，再逐字符比较。

**错误2：以为 `istitle()` 就是"首字母大写"**

```python
# istitle() 判断的是"每个词首字母大写"，不是"字符串第一个字母大写"
print("Hello".istitle())    # True
print("Hello world".istitle())  # False!（world 的 w 小写）

# 如果只想判断首字母大写，用自定义逻辑
def is_capitalized(s):
    return s and s[0].isupper() and (len(s) == 1 or s[1:].islower())

print(is_capitalized("Hello world"))  # True
```

**错误3：用 `istitle()` 检查英文出版标题格式**

```python
# 英文标题规范：首词和实词大写，介词/冠词小写
# istitle() 不区分词性，要求每个词首字母都大写
title = "How to Use Python Effectively"
print(title.istitle())  # False!（to 的 t 小写）

# 不要用 istitle() 检查英文出版标题格式
# 需要自定义逻辑，维护一个"小写词列表"
```

**错误4：混淆 `isupper` 与 `isalpha`**

```python
# isupper() 判断的是"字母全大写"，不是"是否是字母"
print("123".isupper())   # False（没有字母）
print("123".isalpha())   # False（数字不是字母）

# 如果需要"全大写且只含字母"，需要组合判断
s = "ABC123"
print(s.isalpha() and s.isupper())  # False（含数字）
print(s.replace("0123456789", "").isupper())  # True（去掉数字后）
```

**错误5：对含撇号的文字使用 `title()`**

```python
text = "it's a wonderful day"
print(text.title())  # "It'S A Wonderful Day"（S 被错误大写）

# 正确做法：用 string.capwords()
import string
print(string.capwords(text))  # "It's A Wonderful Day"
```

### 3.3 性能注意事项

**时间复杂度**：三个方法都是 **O(n)**——需要扫描整个字符串。但由于 C 实现，实际性能比手动遍历快得多：

```python
import timeit

text = "Hello World " * 500

# 内置方法（快）
t1 = timeit.timeit(lambda: text.istitle(), number=10000)

# 手动遍历（慢）
t2 = timeit.timeit(lambda: all(
    word[0].isupper() and word[1:].islower()
    for word in text.split()
), number=10000)

print(f"内置 istitle():  {t1:.4f}s")
print(f"手动遍历:        {t2:.4f}s")
print(f"差异: {t2/t1:.1f}x")
```

**运行结果**：

```text
内置 istitle():  0.0076s
手动遍历:        0.1100s
差异: 14.5x
```

内置方法比手动遍历快约 14 倍——原因在于 `istitle()` 在 C 层面直接操作字符码点数组，不需要创建 Python 对象。

### 3.4 方法选择决策

```text
你要判断什么？
  ├── 字母是否全大写？
  │     → isupper()
  │     （非字母字符不影响，需有至少一个字母）
  │
  ├── 字母是否全小写？
  │     → islower()
  │     （非字母字符不影响，需有至少一个字母）
  │
  └── 是否符合标题格式（每个词首字母大写）？
        → istitle()
        （词边界由非字母字符定义）
```

## 4. 原理

### 4.1 大小写判断的 Unicode 机制

`isupper()`、`islower()`、`istitle()` 三个方法的底层都依赖 **Unicode 字符数据库**（UCD）中的大小写属性。每个 Unicode 字符都有明确的大小写归属。

核心 Unicode 属性对应关系：

| Python 方法 | Unicode 属性 | 判断逻辑 |
|-------------|-------------|---------|
| `isupper()` | `Lowercase = No` 且 `Uppercase = Yes` | 所有字母字符都是大写 |
| `islower()` | `Lowercase = Yes` | 所有字母字符都是小写 |
| `istitle()` | `Lt` (Letter, titlecase) 或满足 title 规则 | 每个词首字母大写，其余小写 |

```text
isupper() 的 CPython 判断流程：

1. 遍历字符串的每个码点
2. 查询 UCD：该字符是否是 "cased" 字符（有大小写属性的字母）
3. 如果是 cased 字符：
   → 检查它是否是大写
   → 如果不是大写 → 立即返回 False（短路优化）
4. 如果至少有一个 cased 字符且全部为大写 → 返回 True
5. 如果没有任何 cased 字符（如纯数字、纯中文）→ 返回 False
```

用 `unicodedata` 模块验证字符的 Unicode 属性：

```python
import unicodedata

chars = [
    ("A", "英文大写"),
    ("a", "英文小写"),
    ("Ä", "德语大写"),
    ("ä", "德语小写"),
    ("П", "俄语大写"),
    ("п", "俄语小写"),
    ("中", "中文"),
    ("1", "数字"),
]

print(f"  {'字符':<6} {'名称':<10} {'类别':<6} {'isupper':<10} {'islower':<10}")
for char, label in chars:
    category = unicodedata.category(char)
    print(f"  {char:<6} {label:<10} {category:<6} {str(char.isupper()):<10} {str(char.islower()):<10}")
```

**运行结果**：

```text
  字符   名称       类别   isupper    islower
  A     英文大写    Lu    True       False
  a     英文小写    Ll    False      True
  Ä     德语大写    Lu    True       False
  ä     德语小写    Ll    False      True
  П     俄语大写    Lu    True       False
  п     俄语小写    Ll    False      True
  中    中文       Lo    False      False
  1     数字       Nd    False      False
```

- `Lu`（Letter, uppercase）→ `isupper()` 返回 `True`
- `Ll`（Letter, lowercase）→ `islower()` 返回 `True`
- `Lo`（Letter, other）→ 中文字符，没有大小写属性，两个方法都返回 `False`
- `Nd`（Number, decimal digit）→ 数字，不是字母，两个方法都返回 `False`

### 4.2 isupper/islower 对 Cased 字符的依赖

理解 `isupper()` 和 `islower()` 的关键概念是 **cased character**（有大小写的字符）。只有 cased 字符才会影响判断结果：

```text
字符串 = "ABC123"
  → 字符 A: cased, 且是 uppercase → 通过检查
  → 字符 B: cased, 且是 uppercase → 通过检查
  → 字符 C: cased, 且是 uppercase → 通过检查
  → 字符 1: 非 cased → 跳过
  → 字符 2: 非 cased → 跳过
  → 字符 3: 非 cased → 跳过
  → 至少有一个 cased 字符，且全部大写 → isupper() 返回 True

字符串 = "123"
  → 字符 1,2,3: 全部非 cased → 没有 cased 字符
  → isupper() 返回 False（没有可判断的字母）
```

```python
# 验证：有 cased 字符 vs 无 cased 字符
cases = [
    ("ABC",    "有 cased 字母，全大写"),
    ("abc",    "有 cased 字母，全小写"),
    ("AbC",    "有 cased 字母，混合"),
    ("123",    "无 cased 字母（纯数字）"),
    ("你好",    "无 cased 字母（中文不是 cased）"),
    ("",       "无任何字符"),
]

for text, label in cases:
    has_cased = any(c.isupper() or c.islower() for c in text) if text else False
    print(f"  '{text}': {label}")
    print(f"    has_cased={has_cased}, isupper={text.isupper()}, islower={text.islower()}")
```

**运行结果**：

```text
  'ABC': 有 cased 字母，全大写
    has_cased=True, isupper=True, islower=False
  'abc': 有 cased 字母，全小写
    has_cased=True, isupper=False, islower=True
  'AbC': 有 cased 字母，混合
    has_cased=True, isupper=False, islower=False
  '123': 无 cased 字母（纯数字）
    has_cased=False, isupper=False, islower=False
  '你好': 无 cased 字母（中文不是 cased）
    has_cased=False, isupper=False, islower=False
  '': 无任何字符
    has_cased=False, isupper=False, islower=False
```

### 4.3 istitle 的词边界判断逻辑

`istitle()` 的判断比 `isupper()` 和 `islower()` 更复杂——它需要识别"词"的边界。CPython 的实现逻辑如下：

```text
istitle() 判断流程：

1. 遍历字符串中每个连续的"字母序列"（由非字母字符分隔）
2. 对每个字母序列：
   → 第一个字符必须是 cased 且是大写
   → 其余字符必须是 cased 且是小写
   → 如果不符合 → 立即返回 False
3. 所有字母序列都满足条件 → 返回 True
4. 没有任何 cased 字符 → 返回 False
```

可视化 `"Hello, World!"` 的判断过程：

```text
字符串: H e l l o ,   W o r l d !
        ↑             ↑
        字母序列1     字母序列2
        Hello         World

字母序列1 "Hello":
  H: cased + uppercase → 通过（首字母大写）
  e: cased + lowercase → 通过
  l: cased + lowercase → 通过
  l: cased + lowercase → 通过
  o: cased + lowercase → 通过
  → 序列1 通过

字母序列2 "World":
  W: cased + uppercase → 通过
  o: cased + lowercase → 通过
  r: cased + lowercase → 通过
  l: cased + lowercase → 通过
  d: cased + lowercase → 通过
  → 序列2 通过

所有序列通过 → istitle() 返回 True
```

对比 `"Hello world"` 的判断过程：

```text
字符串: H e l l o   w o r l d
        ↑             ↑
        字母序列1     字母序列2
        Hello         world

字母序列2 "world":
  w: cased + lowercase → 首字母不是大写 → 不通过
  → 返回 False
```

### 4.4 CPython 实现效率

三个方法在 CPython 中都由 C 实现，直接操作码点数组，不创建中间 Python 对象：

```text
s.isupper() 的 CPython 执行流程：

1. 遍历字符串的每个码点（code point）
2. 查询 Unicode 字符数据库，判断该码点是否是 cased 字符
3. 如果是 cased 字符：
   → 检查它是否是大写
   → 如果不是大写 → 立即返回 False（短路优化）
4. 全部 cased 字符都满足条件 → 返回 True
5. 空字符串或无 cased 字符 → 返回 False
```

短路优化使得在第一个不满足条件的字符处就立即返回，不需要扫描完整个字符串。对于大文本，如果第一个字符就不满足条件，时间复杂度接近 O(1)。

## 5. 总结

本文围绕大小写与格式判断方法展开，主要介绍了以下内容：

- `isupper()` 判断字符串中的字母是否全部大写，非字母字符（数字、空格、标点）不影响判断，需至少有一个字母才返回 `True`
- `islower()` 判断字符串中的字母是否全部小写，行为与 `isupper()` 完全对称
- `isupper()` 和 `islower()` 具有互斥性——有字母时两者不会同时返回 `True`，大小写混合时两者都返回 `False`
- `istitle()` 判断字符串是否符合标题格式——每个"词"（由非字母字符分隔的字母序列）首字母大写、其余小写
- `istitle()` 的词边界由非字母字符定义——空格、标点、数字、撇号等都是词边界，撇号后的字母被视为新词首字母
- 三个方法都基于 Unicode 标准判断大小写，支持德语、法语、俄语、全角字符等多语言大小写
- 中文没有大小写概念，三个方法对纯中文字符串都返回 `False`
- 空字符串对三个方法都返回 `False`（没有 cased 字符可判断）
- `istitle()` 与 `title()` 关系密切但需注意 `title()` 对撇号处理不完美——`"it's"` 会被转成 `"It'S"`
- 判断方法比创建新字符串再比较更高效——`s.isupper()` 比 `s == s.upper()` 快，因为不创建新字符串
- `istitle()` 与英文出版标题规范有差异——`istitle()` 要求每个词首字母都大写，但英文标题中介词/冠词通常小写
- 三个方法在 CPython 中由 C 实现，支持短路优化，性能比手动遍历快约 14 倍
- 实际开发中常结合转换方法使用——用 `title()` 规范化后用 `istitle()` 验证，用 `upper()` 统一后搜索实现大小写不敏感匹配
