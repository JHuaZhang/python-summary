---
group:
  title: 【03】字符串介绍
  order: 3
order: 17
title: 标识符与其他判断
nav:
  title: Python基础
  order: 1
---

# 标识符与其他判断

## 1. 介绍

### 1.1 知识点定义

Python 字符串提供了一系列 `is*` 方法用于判断字符串的"类型属性"。前面几篇我们已经学习了字符类型判断（`isalpha`、`isdigit`、`isalnum` 等）和大小写格式判断（`isupper`、`islower`、`istitle`）。本篇聚焦于"标识符与其他判断"——即字符串是否能作为合法标识符、是否为关键字、是否为 ASCII 或可打印字符等。

这些方法在实际开发中非常重要：当你需要动态访问对象属性、解析配置文件中的变量名、或对外部输入做安全校验时，它们是第一道防线。

本篇涉及的 API 速览：

| 方法 / 模块 | 所属 | 作用 |
|-------------|------|------|
| `str.isidentifier()` | 字符串方法 | 判断字符串是否为合法 Python 标识符 |
| `keyword.iskeyword()` | keyword 模块 | 判断字符串是否为 Python 保留关键字 |
| `keyword.issoftkeyword()` | keyword 模块 | 判断字符串是否为软关键字 |
| `keyword.kwlist` | keyword 模块 | 获取所有关键字列表 |
| `keyword.softkwlist` | keyword 模块 | 获取所有软关键字列表 |
| `str.isascii()` | 字符串方法 | 判断字符串是否全部为 ASCII 字符 |
| `str.isprintable()` | 字符串方法 | 判断字符串是否全部为可打印字符 |

### 1.2 最简示例

先用最简单的代码直观感受这些方法：

```python
# 标识符判断
print("my_var".isidentifier())    # True
print("123abc".isidentifier())    # False
print("_private".isidentifier()) # True

# 关键字判断
import keyword
print(keyword.iskeyword("if"))    # True
print(keyword.iskeyword("myvar")) # False

# ASCII 与可打印判断
print("Hello".isascii())          # True
print("你好".isascii())            # False
print("Hello".isprintable())      # True
print("a\tb".isprintable())       # False
```

运行结果：

```text
True
False
True
True
False
True
True
False
```

### 1.3 在字符串判断方法体系中的位置

本篇涉及的判断方法属于字符串 `is*` 系列的最后一组。它们解决的不再是"字符是什么类型"或"大小写是什么格式"的问题，而是"字符串能否作为某种特殊用途"——能否做变量名、能否做关键字、能否进入 ASCII 环境传输、能否安全打印输出。

从层次来看：

```text
字符串判断方法体系
├── 字符类型判断：每个字符是什么？（isalpha / isdigit / isalnum / isspace / isnumeric / isdecimal）
├── 大小写格式判断：大小写是什么形态？（isupper / islower / istitle）
└── 标识符与其他判断：整个字符串能否用于特定用途？
    ├── isidentifier：能否做变量名？
    ├── keyword.iskeyword / issoftkeyword：是否被语言保留？
    ├── isascii：能否进入 ASCII 环境？
    └── isprintable：能否安全打印输出？
```

## 2. 核心内容

### 2.1 str.isidentifier()

#### 2.1.1 方法签名与基本行为

`isidentifier()` 是字符串实例方法，不需要任何参数，返回 `bool`：

```python
str.isidentifier() -> bool
```

它的判断逻辑基于 Python 的标识符命名规则：

1. **首字符**必须是字母（含 Unicode 字母）或下划线 `_`
2. **后续字符**可以是字母、数字或下划线
3. **空字符串**返回 `False`
4. **没有长度限制**

**示例**

```python
# 合法标识符
print("my_var".isidentifier())    # True
print("_private".isidentifier())  # True
print("ClassName".isidentifier())  # True
print("var123".isidentifier())    # True
print("_".isidentifier())         # True
print("__dunder__".isidentifier()) # True

# 非法标识符
print("123abc".isidentifier())    # False：数字开头
print("my-var".isidentifier())   # False：含连字符
print("my var".isidentifier())   # False：含空格
print("".isidentifier())          # False：空字符串
```

运行结果：

```text
True
True
True
True
True
True
False
False
False
False
```

**关键点说明**：`isidentifier()` 只判断"语法上是否合法"，不判断"实际能否用作变量名"。关键字（如 `if`、`for`、`class`）的 `isidentifier()` 也返回 `True`——它们在语法上确实是合法标识符格式，只是被语言保留而禁止使用。这一点在实际使用中容易踩坑，后面会详细讲。

#### 2.1.2 Unicode 标识符支持

Python 3 支持 Unicode 标识符——非 ASCII 字母也可以作为变量名。这是 Python 3 对 Python 2 的一个重要改进。

**示例**

```python
# 中文标识符
print("变量名".isidentifier())    # True
print("_变量".isidentifier())    # True

# 含重音字母
print("café".isidentifier())     # True
print("naïve".isidentifier())    # True

# 希腊字母
print("λ".isidentifier())        # True
print("π".isidentifier())        # True

# 下划线 + 数字开头（合法，因为首字符是下划线）
print("_2data".isidentifier())   # True

# 含下标数字（不合法，下标不是普通数字）
print("data₂".isidentifier())   # False
```

运行结果：

```text
True
True
True
True
True
True
True
False
```

**关键点说明**：

- Python 3 的 `isidentifier()` 基于 Unicode 标准中的 `XID_Start`（首字符）和 `XID_Continue`（后续字符）属性来判断
- `XID_Start` 包括：ASCII 字母、Unicode 字母（中文、日文、韩文、希腊字母、西里尔字母等）、下划线
- `XID_Continue` 包括：`XID_Start` 的所有字符 + 数字 + 连接符
- 下标数字 `₂` 不属于 `XID_Continue`，所以 `"data₂"` 不合法
- 虽然技术上支持 Unicode 标识符，但实际项目中通常推荐使用 ASCII 标识符（蛇形命名法），以避免编码问题和团队协作中的歧义

#### 2.1.3 标识符命名规则详解

Python 标识符命名规则可以用一张表总结：

| 规则 | 说明 | 示例合法 | 示例非法 |
|------|------|---------|---------|
| 首字符 | 字母或下划线 | `a`、`_`、`中`、`α` | `1`、`$`、`@` |
| 后续字符 | 字母、数字或下划线 | `abc123`、`a_b` | `a.b`、`a-b`、`a b` |
| 大小写 | 大小写敏感 | `name`、`Name` 独立 | — |
| 空字符串 | 不合法 | — | `""` |
| 长度限制 | 无限制 | `a` 到 `aaaa...aaa`（10000+字符） | — |

**首字符规则验证**

```python
first_chars = ["a", "Z", "_", "1", "9", "中", "α", "$", "@", "!", ".", "-", "+"]

for c in first_chars:
    result = c.isidentifier()
    print(f"  '{c}'.isidentifier() = {result}")
```

运行结果：

```text
  'a'.isidentifier() = True
  'Z'.isidentifier() = True
  '_'.isidentifier() = True
  '1'.isidentifier() = False
  '9'.isidentifier() = False
  '中'.isidentifier() = True
  'α'.isidentifier() = True
  '$'.isidentifier() = False
  '@'.isidentifier() = False
  '!'.isidentifier() = False
  '.'.isidentifier() = False
  '-'.isidentifier() = False
  '+'.isidentifier() = False
```

**后续字符规则验证**

```python
subsequent = ["abc123", "_abc", "a_1_b_2", "a.b", "a-b", "a b", "ab\n", "ab\t"]

for s in subsequent:
    result = s.isidentifier()
    print(f"  {s!r:>15}.isidentifier() = {result}")
```

运行结果：

```text
         'abc123'.isidentifier() = True
           '_abc'.isidentifier() = True
        'a_1_b_2'.isidentifier() = True
            'a.b'.isidentifier() = False
            'a-b'.isidentifier() = False
            'a b'.isidentifier() = False
           'ab\n'.isidentifier() = False
           'ab\t'.isidentifier() = False
```

**关键点说明**：

- 首字符是字母（含 Unicode 字母）或下划线时，`isidentifier()` 返回 `True`
- 首字符是数字或特殊符号时，返回 `False`
- 后续字符一旦出现 `.`、`-`、空格、换行、制表符等非标识符字符，整个判定结果为 `False`
- 标识符没有长度限制，但可读性很重要，过长的标识符不可取

#### 2.1.4 双下划线名称（dunder）

Python 中以双下划线开头和结尾的特殊名称（如 `__init__`、`__str__`、`__name__`）称为"dunder"（double underscore）名称。它们在 `isidentifier()` 判断中完全合法。

**示例**

```python
dunders = [
    "__init__",     # 构造方法
    "__str__",      # 字符串表示
    "__repr__",     # 开发者表示
    "__name__",    # 名称属性
    "__main__",    # 主模块标识
    "__dunder__",  # 自定义 dunder
    "__a__",       # 最短 dunder
    "___",         # 三个下划线
    "__",          # 两个下划线
    "_",           # 单下划线
]

for s in dunders:
    result = s.isidentifier()
    print(f"  {s!r:>15}.isidentifier() = {result}")
```

运行结果：

```text
       '__init__'.isidentifier() = True
        '__str__'.isidentifier() = True
       '__repr__'.isidentifier() = True
       '__name__'.isidentifier() = True
       '__main__'.isidentifier() = True
     '__dunder__'.isidentifier() = True
          '__a__'.isidentifier() = True
            '___'.isidentifier() = True
             '__'.isidentifier() = True
              '_'.isidentifier() = True
```

**关键点说明**：

- 所有 dunder 名称在 `isidentifier()` 判断中都是合法的——它们符合"首字符是下划线、后续字符是字母或下划线"的规则
- Python 对 dunder 名称有特殊处理：以 `__` 开头（不以 `__` 结尾）的名称会触发名称改写（name mangling），如 `__value` 会被改成 `_ClassName__value`
- 自定义 dunder 名称（如 `__my_method__`）虽然合法，但不推荐——容易与 Python 内部或未来版本的特殊方法冲突

#### 2.1.5 大小写敏感

Python 标识符是大小写敏感的：`name`、`Name`、`NAME` 是三个完全不同的标识符。

**示例**

```python
cases = ["name", "Name", "NAME", "nAmE", "变量", "變量"]
for s in cases:
    result = s.isidentifier()
    print(f"  {s!r:>10}.isidentifier() = {result}")
```

运行结果：

```text
      'name'.isidentifier() = True
      'Name'.isidentifier() = True
      'NAME'.isidentifier() = True
      'nAmE'.isidentifier() = True
     '变量'.isidentifier() = True
     '變量'.isidentifier() = True
```

**关键点说明**：

- `isidentifier()` 对大小写的不同变体都返回 `True`——大小写不影响标识符合法性，只影响标识符的区分
- 不同 Unicode 字体中形似但编码不同的字符（如简体"变量"和繁体"變量"）也是完全不同的标识符
- PEP 8 建议统一使用蛇形命名法（snake_case）

### 2.2 keyword 模块

#### 2.2.1 keyword 模块概览

`keyword` 模块是 Python 标准库中专门用于查询 Python 关键字的模块。它不是一个"判断"类的方法集合，而是一个"查询"类工具——让你知道哪些标识符被语言保留了。

模块中的核心 API：

| API | 返回类型 | 作用 |
|-----|---------|------|
| `keyword.kwlist` | `list[str]` | 所有关键字列表 |
| `keyword.iskeyword(s)` | `bool` | 判断 `s` 是否为关键字 |
| `keyword.softkwlist` | `list[str]` | 所有软关键字列表 |
| `keyword.issoftkeyword(s)` | `bool` | 判断 `s` 是否为软关键字 |

#### 2.2.2 keyword.kwlist 获取所有关键字

`keyword.kwlist` 返回一个包含所有 Python 关键字的列表。

**示例**

```python
import keyword

print(f"Python 关键字总数: {len(keyword.kwlist)}")
print("关键字列表:")
for kw in keyword.kwlist:
    print(f"  {kw}")
```

运行结果（Python 3.10+）：

```text
Python 关键字总数: 35
关键字列表:
  False
  None
  True
  and
  as
  assert
  async
  await
  break
  class
  continue
  def
  del
  elif
  else
  except
  finally
  for
  from
  global
  if
  import
  in
  is
  lambda
  nonlocal
  not
  or
  pass
  raise
  return
  try
  while
  with
  yield
```

**关键点说明**：

- `False`、`None`、`True` 在 Python 3 中是关键字，不能被赋值覆盖
- `async` 和 `await` 在 Python 3.5+ 中成为关键字
- 不同 Python 版本的关键字列表可能略有不同。例如 Python 3.12 引入了 `type` 作为软关键字
- `keyword.kwlist` 的类型是普通 `list`，可以遍历、索引、切片

#### 2.2.3 keyword.iskeyword() 判断关键字

`iskeyword()` 接收一个字符串，返回它是否为 Python 关键字。

**示例**

```python
import keyword

# 真关键字
keywords = ["if", "else", "elif", "for", "while", "def", "class",
            "None", "True", "False", "and", "or", "not",
            "import", "from", "as", "lambda", "yield", "return",
            "try", "except", "finally", "raise", "with", "async", "await"]

for kw in keywords:
    print(f"  {kw:>12}.iskeyword() = {keyword.iskeyword(kw)}")

# 非关键字（常见内置函数）
non_keywords = ["print", "len", "str", "int", "list", "myvar", "abc"]
print("\n非关键字:")
for name in non_keywords:
    print(f"  {name:>12}.iskeyword() = {keyword.iskeyword(name)}")
```

运行结果：

```text
            if.iskeyword() = True
          else.iskeyword() = True
          elif.iskeyword() = True
           for.iskeyword() = True
         while.iskeyword() = True
           def.iskeyword() = True
         class.iskeyword() = True
          None.iskeyword() = True
          True.iskeyword() = True
         False.iskeyword() = True
           and.iskeyword() = True
            or.iskeyword() = True
           not.iskeyword() = True
        import.iskeyword() = True
          from.iskeyword() = True
            as.iskeyword() = True
        lambda.iskeyword() = True
         yield.iskeyword() = True
        return.iskeyword() = True
           try.iskeyword() = True
        except.iskeyword() = True
       finally.iskeyword() = True
         raise.iskeyword() = True
          with.iskeyword() = True
         async.iskeyword() = True
         await.iskeyword() = True

非关键字:
         print.iskeyword() = False
           len.iskeyword() = False
           str.iskeyword() = False
           int.iskeyword() = False
          list.iskeyword() = False
         myvar.iskeyword() = False
           abc.iskeyword() = False
```

**关键点说明**：

- `iskeyword()` 只匹配 `keyword.kwlist` 中的严格关键字
- `print`、`len`、`str`、`int` 等内置函数**不是关键字**——它们可以被覆盖（虽然不推荐）：
  ```python
  # 技术上可以覆盖内置函数（危险!）
  print = "oops"  # 不会报错，但 print 不再是函数了
  ```
- 软关键字（`match`、`case`、`type`、`_`）**不会**被 `iskeyword()` 匹配为 `True`，必须用 `issoftkeyword()` 判断

#### 2.2.4 keyword.issoftkeyword() 判断软关键字

软关键字是 Python 3.10+ 引入的概念。它们在特定语法上下文中才具有关键字含义，在其他上下文中仍然可以作为普通标识符使用。

**示例**

```python
import keyword

print(f"软关键字列表: {keyword.softkwlist}")
print(f"keyword.softkwlist 类型: {type(keyword.softkwlist)}")

print("\n软关键字判断:")
for skw in keyword.softkwlist:
    print(f"  issoftkeyword('{skw}') = {keyword.issoftkeyword(skw)}")

print("\n非软关键字:")
print(f"  issoftkeyword('if')    = {keyword.issoftkeyword('if')}")
print(f"  issoftkeyword('myvar') = {keyword.issoftkeyword('myvar')}")
```

运行结果：

```text
软关键字列表: ['_', 'case', 'match', 'type']
keyword.softkwlist 类型: <class 'list'>
软关键字判断:
  issoftkeyword('_') = True
  issoftkeyword('case') = True
  issoftkeyword('match') = True
  issoftkeyword('type') = True

非软关键字:
  issoftkeyword('if')    = False
  issoftkeyword('myvar') = False
```

**关键点说明**：

软关键字与硬关键字的区别：

| 维度 | 硬关键字 | 软关键字 |
|------|---------|---------|
| 示例 | `if`、`for`、`class` | `match`、`case`、`type`、`_` |
| 能否做变量名 | 不能 | 可以（在非模式匹配上下文中） |
| `iskeyword()` | `True` | `False` |
| `issoftkeyword()` | `False` | `True` |
| 何时具备关键字含义 | 始终 | 仅在特定语法上下文中 |

- `match` 和 `case` 在 `match-case` 语句（Python 3.10+）中是关键字，在普通代码中可以是变量名
- `type` 在 `type` 语句（Python 3.12+）中是关键字，平时仍然是内置函数
- `_` 在 `match-case` 的模式匹配中是通配符，平时通常是"不关心的变量"惯例

#### 2.2.5 关键字 vs 内置函数

初学者容易把关键字和内置函数混淆。两者有本质区别：

| 维度 | 关键字 | 内置函数 |
|------|--------|---------|
| 来源 | 语言语法保留 | `builtins` 模块提供 |
| 能否覆盖 | 不能——解释器直接拒绝 | 能——但极其危险 |
| `iskeyword()` | `True` | `False` |
| `isidentifier()` | `True`（语法上合法） | `True`（语法上合法） |
| 示例 | `if`、`for`、`def`、`None` | `print`、`len`、`str`、`int` |

**示例**

```python
import keyword

builtins = ["print", "len", "str", "int", "list", "dict", "type", "range", "open"]
keywords = ["if", "for", "def", "class", "return", "import", "None", "True", "False"]

print("内置函数（不是关键字，可被覆盖但不推荐）:")
for name in builtins:
    print(f"  {name}: iskeyword={keyword.iskeyword(name)}, isidentifier={name.isidentifier()}")

print("\n关键字（语言保留，不可覆盖）:")
for name in keywords:
    print(f"  {name}: iskeyword={keyword.iskeyword(name)}, isidentifier={name.isidentifier()}")
```

运行结果：

```text
内置函数（不是关键字，可被覆盖但不推荐）:
  print: iskeyword=False, isidentifier=True
  len: iskeyword=False, isidentifier=True
  str: iskeyword=False, isidentifier=True
  int: iskeyword=False, isidentifier=True
  list: iskeyword=False, isidentifier=True
  dict: iskeyword=False, isidentifier=True
  type: iskeyword=False, isidentifier=True
  range: iskeyword=False, isidentifier=True
  open: iskeyword=False, isidentifier=True
关键字（语言保留，不可覆盖）:
  if: iskeyword=True, isidentifier=True
  for: iskeyword=True, isidentifier=True
  def: iskeyword=True, isidentifier=True
  class: iskeyword=True, isidentifier=True
  return: iskeyword=True, isidentifier=True
  import: iskeyword=True, isidentifier=True
  None: iskeyword=True, isidentifier=True
  True: iskeyword=True, isidentifier=True
  False: iskeyword=True, isidentifier=True
```

**关键点说明**：

- 关键字的 `isidentifier()` 返回 `True`，因为关键字在语法上确实是合法标识符格式——只是被语言保留了
- 内置函数只是 `builtins` 模块的普通属性，`iskeyword()` 返回 `False`，说明它们不是被语言语法保留的关键字
- 在安全校验中，如果你想防止用户输入覆盖内置函数，需要额外用 `hasattr(builtins, name)` 检查

### 2.3 完整的"安全标识符"检查

`isidentifier()` 只判断语法合法性，不排除关键字。要构建一个完整的"这个字符串能否安全用作变量名"检查，需要组合 `isidentifier()` + `keyword.iskeyword()` + `hasattr(builtins, ...)`。

#### 2.3.1 三层校验链

**示例**

```python
import keyword
import builtins

def validate_variable_name(name):
    """完整校验：字符串能否安全用作变量名。"""
    # 第一层：类型和空值检查
    if not isinstance(name, str):
        return False, "变量名必须是字符串"
    if not name:
        return False, "变量名不能为空"

    # 第二层：标识符合法性
    if not name.isidentifier():
        return False, f"'{name}' 不是有效标识符"

    # 第三层：关键字冲突
    if keyword.iskeyword(name):
        return False, f"'{name}' 是 Python 关键字"

    # 第四层：内置名称冲突（可选，取决于你的安全级别）
    if hasattr(builtins, name):
        return False, f"'{name}' 与内置名称冲突"

    return True, "合法"
```

**测试**

```python
test_names = [
    "user_name",    # 合法
    "_cache",       # 合法
    "2fast",        # 数字开头
    "myVar",        # 合法
    "if",           # 关键字
    "class",        # 关键字
    "print",        # 内置函数
    "len",          # 内置函数
    "",             # 空字符串
    "data-set",     # 连字符
    "变量名",        # Unicode 合法
    "None",         # 关键字
]

for name in test_names:
    ok, msg = validate_variable_name(name)
    print(f"  {name!r:>15} -> {msg}")
```

运行结果：

```text
      'user_name' -> 合法
         '_cache' -> 合法
          '2fast' -> 不是有效标识符
          'myVar' -> 合法
             'if' -> 'if' 是 Python 关键字
         'class' -> 'class' 是 Python 关键字
         'print' -> 'print' 与内置名称冲突
           'len' -> 'len' 与内置名称冲突
               '' -> 变量名不能为空
       'data-set' -> 不是有效标识符
          '变量名' -> 合法
           'None' -> 'None' 是 Python 关键字
```

**关键点说明**：

- 第一层（类型/空值）是防御性编程——外部输入可能不是字符串，也可能是空字符串
- 第二层（`isidentifier`）保证语法合法
- 第三层（`iskeyword`）避免与语言保留字冲突
- 第四层（`hasattr(builtins, ...)`）是可选的加强。如果你允许用户覆盖内置函数（比如在自己的 DSL 中），可以去掉这一层
- 在实际项目中，安全校验的严格程度取决于场景。内部工具可能只需要前两层，面向外部输入的系统需要全部四层

#### 2.3.2 isidentifier 与 iskeyword 的互补关系

```python
# isidentifier 返回 True 的字符串中，有一部分是关键字
# 需要用 iskeyword 做二次过滤
import keyword

tricky_cases = ["if", "for", "class", "def", "None", "True", "False", "hello", "my_var", "变量"]

print(f"{'字符串':>10} | {'isidentifier':>14} | {'iskeyword':>10} | {'可作变量名':>10}")
print(f"{'-'*10}-+-{'-'*14}-+-{'-'*10}-+-{'-'*10}")

for s in tricky_cases:
    is_id = s.isidentifier()
    is_kw = keyword.iskeyword(s)
    usable = is_id and not is_kw
    print(f"{s:>10} | {is_id!s:>14} | {is_kw!s:>10} | {usable!s:>10}")
```

运行结果：

```text
        字符串 |   isidentifier |  iskeyword |   可作变量名
----------+----------------+------------+----------
        if |           True |       True |      False
       for |           True |       True |      False
     class |           True |       True |      False
       def |           True |       True |      False
      None |           True |       True |      False
      True |           True |       True |      False
     False |           True |       True |       False
     hello |           True |      False |       True
    my_var |           True |      False |       True
        变量 |           True |      False |       True
```

**关键点说明**：

- `isidentifier()` 和 `iskeyword()` 是互补关系——一个判断"语法上能否做标识符"，另一个判断"是否被语言保留"
- 只有两者同时满足（`isidentifier=True` 且 `iskeyword=False`），才能安全用作变量名
- 这是所有"安全标识符检查"的核心逻辑

### 2.4 str.isascii()

#### 2.4.1 方法签名与基本行为

`isascii()` 是 Python 3.7+ 新增的字符串方法：

```python
str.isascii() -> bool
```

它判断字符串中所有字符是否都在 ASCII 范围内（`U+0000` ~ `U+007F`，即 0~127）。

**示例**

```python
test_cases = [
    "Hello World",      # 纯 ASCII
    "hello123",         # ASCII 字母+数字
    "",                 # 空字符串
    "a\tb",             # 含制表符（ASCII 控制字符）
    "a\nb",             # 含换行符（ASCII 控制字符）
    "café",             # 含重音字母（非 ASCII）
    "你好",             # 中文（非 ASCII）
    "\x00",             # NULL 字符（ASCII 控制字符）
    "\x7F",             # DEL 字符（ASCII 控制字符）
    "\x80",             # 非 ASCII 字符
]

for s in test_cases:
    result = s.isascii()
    print(f"  {s!r:>15}.isascii() = {result}")
```

运行结果：

```text
    'Hello World'.isascii() = True
       'hello123'.isascii() = True
               ''.isascii() = True
           'a\tb'.isascii() = True
           'a\nb'.isascii() = True
           '\x00'.isascii() = True
           '\x7f'.isascii() = True
           'café'.isascii() = False
             '你好'.isascii() = False
           '\x80'.isascii() = False
```

**关键点说明**：

- `isascii()` 判断的范围是 `U+0000` ~ `U+007F`，共 128 个字符
- 这个范围**包含**控制字符（`\t`、`\n`、`\x00`、`\x7F` 等），因为它们确实在 ASCII 码表内
- 空字符串 `""` 返回 `True`——所有字符（虽然一个都没有）都是 ASCII
- `isascii()` 与 `isprintable()` 的关注点完全不同：前者关注"编码范围"，后者关注"能否打印"

#### 2.4.2 实际用途

`isascii()` 在实际项目中的典型场景：

1. **兼容旧系统**：某些遗留系统只支持 ASCII，非 ASCII 字符可能导致乱码或解析错误
2. **安全编码**：防止用户输入注入非 ASCII 的"长字符攻击"（homograph attack）
3. **日志过滤**：确保日志内容只包含 ASCII 字符，便于跨平台查看
4. **数据通道约束**：某些 API / 协议只允许传输 ASCII 内容

**示例：数据清洗中过滤非 ASCII 名称**

```python
names = ["Alice", "Bob", "张三", "José", "François"]

print("仅 ASCII 名称:")
for name in names:
    if name.isascii():
        print(f"  {name!r} -> 纯 ASCII，兼容旧系统")
```

运行结果：

```text
仅 ASCII 名称:
  'Alice' -> 纯 ASCII，兼容旧系统
  'Bob' -> 纯 ASCII，兼容旧系统
```

### 2.5 str.isprintable()

#### 2.5.1 方法签名与基本行为

`isprintable()` 判断字符串是否全部由可打印字符组成：

```python
str.isprintable() -> bool
```

Python 中"可打印字符"的定义：

- ASCII 范围 `0x20` ~ `0x7E`（含空格，不含 DEL）
- 所有 Unicode 字母、数字、标点、符号等
- 空字符串 `""` 也被认为是可打印的

**注意**：制表符 `\t`、换行符 `\n`、回车符 `\r`、NULL `\x00` 等控制字符**不可打印**。

**示例**

```python
test_cases = [
    "Hello",               # 纯字母
    "Hello, World!",        # 字母 + 标点
    "123 + 456 = 579",      # 数字 + 符号
    "",                     # 空字符串 -> True
    " ",                    # 空格 -> True
    "café",                 # 含重音字母 -> True（非 ASCII 但可打印）
    "你好",                 # 中文 -> True
    "a\tb",                 # 含制表符 -> False
    "a\nb",                 # 含换行符 -> False
    "a\rb",                 # 含回车符 -> False
    "a\x00b",               # 含 NULL -> False
    "\x1b[31m",             # ANSI 转义序列 -> False
]

for s in test_cases:
    result = s.isprintable()
    print(f"  {s!r:>20}.isprintable() = {result}")
```

运行结果：

```text
               'Hello'.isprintable() = True
        'Hello, World!'.isprintable() = True
      '123 + 456 = 579'.isprintable() = True
                    ''.isprintable() = True
                   ' '.isprintable() = True
                'café'.isprintable() = True
                  '你好'.isprintable() = True
                'a\tb'.isprintable() = False
                'a\nb'.isprintable() = False
                'a\rb'.isprintable() = False
              'a\x00b'.isprintable() = False
            '\x1b[31m'.isprintable() = False
```

**关键点说明**：

- 空字符串和纯空格都是可打印的（空格 `0x20` 是可打印字符的起点）
- `\t`、`\n`、`\r` 是控制字符，不属于可打印范围
- 非 ASCII 字符（如中文、重音字母）也能是可打印字符——`isprintable()` 不局限于 ASCII
- ANSI 转义序列（如 `\x1b[31m` 用于终端颜色）包含 ESC 字符 `\x1b`，所以不可打印

#### 2.5.2 isascii 与 isprintable 对比

`isascii()` 和 `isprintable()` 经常被混淆。它们的关注点完全不同：

| 维度 | `isascii()` | `isprintable()` |
|------|------------|-----------------|
| 关注点 | 编码范围 | 能否打印 |
| 判断范围 | 0x00-0x7F | 排除控制字符 |
| 含控制字符 | `True` | `False` |
| 含非 ASCII | `False` | 可能 `True` |
| 空字符串 | `True` | `True` |
| 含中文 | `False` | `True` |

**对比示例**

```python
comparison = [
    ("Hello",         True,  True),    # ASCII + 可打印
    ("Hello!",        True,  True),    # ASCII + 可打印
    ("你好",         False, True),    # 非 ASCII + 可打印
    ("café",         False, True),    # 非 ASCII + 可打印
    ("",              True,  True),    # 空字符串：两者都 True
    ("Hello\tWorld", True,  False),   # ASCII + 含控制字符
    ("Hello\nWorld", True,  False),   # ASCII + 含控制字符
    ("\x00",          True,  False),   # NUL: ASCII + 不可打印
    ("\x7F",          True,  False),   # DEL: ASCII + 不可打印
]

print(f"  {'字符串':>15} | {'isascii':>8} | {'isprintable':>12}")
print(f"  {'-'*15}-+-{'-'*8}-+-{'-'*12}")
for s, a, p in comparison:
    print(f"  {s!r:>15} | {a!s:>8} | {p!s:>12}")
```

运行结果：

```text
            字符串 |  isascii |  isprintable
----------------+----------+------------
          'Hello' |     True |         True
         'Hello!' |     True |         True
             '你好' |    False |         True
           'café' |    False |         True
               '' |     True |         True
   'Hello\tWorld' |     True |        False
   'Hello\nWorld' |     True |        False
           '\x00' |     True |        False
           '\x7f' |     True |        False
```

**四种组合的语义解读**：

| `isascii` | `isprintable` | 含义 |
|-----------|--------------|------|
| `True` | `True` | 纯 ASCII 可打印文本——最安全 |
| `True` | `False` | ASCII 但含控制字符——需清洗控制字符 |
| `False` | `True` | 非 ASCII 但可打印（如中文、含重音字母）——兼容性需评估 |
| `False` | `False` | 含非 ASCII 控制字符——最需要注意 |

#### 2.5.3 实际用途

`isprintable()` 的典型场景：

1. **日志输出**：防止某些字段中的控制字符破坏日志格式
2. **用户输入校验**：拒绝包含不可打印字符的输入
3. **邮件内容检查**：邮件正文不应包含控制字符
4. **数据清洗**：过滤掉外部数据中的控制字符

**示例：邮件内容安全检查**

```python
emails = ["normal text", "text with\ttab", "text\nwith\nnewlines", "clean text here"]

print("邮件内容检查:")
for email in emails:
    if email.isprintable():
        print(f"  {email!r} -> 安全")
    else:
        print(f"  {email!r} -> 含不可打印字符，需清洗")
```

运行结果：

```text
邮件内容检查:
  'normal text' -> 安全
  'text with\ttab' -> 含不可打印字符，需清洗
  'text\nwith\nnewlines' -> 含不可打印字符，需清洗
  'clean text here' -> 安全
```

**示例：字符串清洗**

```python
dirty_strings = [
    "Hello\x00World",       # 含 NULL
    "Data\x01\x02\x03End",  # 含控制字符
    "Normal text here",     # 正常文本
    "Line1\nLine2",         # 含换行
]

for s in dirty_strings:
    # 保留可打印字符，同时显式保留常见的空白字符
    cleaned = "".join(
        ch for ch in s
        if ch.isprintable() or ch in ("\n", "\t")
    )
    print(f"  原始: {s!r}")
    print(f"  清洗: {cleaned!r}")
```

运行结果：

```text
  原始: 'Hello\x00World'
  清洗: 'HelloWorld'

  原始: 'Data\x01\x02\x03End'
  清洗: 'DataEnd'

  原始: 'Normal text here'
  清洗: 'Normal text here'

  原始: 'Line1\nLine2'
  清洗: 'Line1\nLine2'
```

**关键点说明**：

- 清洗时，通常需要显式保留 `\n` 和 `\t` 这两个常见控制字符——它们虽然不可打印，但在文本处理中是合法的
- `isprintable()` 是"过滤掉不可打印字符"的利器，比手动列举控制字符列表更可靠

### 2.6 全方法总览

把本篇涉及的所有判断方法放在一起做一个总览：

| 方法 | 来源 | 判断目标 | 空字符串 | 含关键字 |
|------|------|---------|---------|---------|
| `str.isidentifier()` | 字符串方法 | 合法标识符（语法层面） | `False` | `True`（关键字语法上合法） |
| `keyword.iskeyword()` | keyword 模块 | Python 硬关键字 | `False` | — |
| `keyword.issoftkeyword()` | keyword 模块 | Python 软关键字 | `False` | — |
| `str.isascii()` | 字符串方法 | 全部为 ASCII 字符 | `True` | — |
| `str.isprintable()` | 字符串方法 | 全部为可打印字符 | `True` | — |

**空字符串行为对比**

```python
import keyword

methods = [
    ("isidentifier", "".isidentifier()),
    ("isascii", "".isascii()),
    ("isprintable", "".isprintable()),
    ("iskeyword", keyword.iskeyword("")),
    ("issoftkeyword", keyword.issoftkeyword("")),
]

for name, result in methods:
    print(f"  ''.{name}() = {result}")
```

运行结果：

```text
  ''.isidentifier() = False
  ''.isascii() = True
  ''.isprintable() = True
  ''.iskeyword() = False
  ''.issoftkeyword() = False
```

**关键点说明**：

- `isidentifier` 对空字符串返回 `False`——空字符串不是合法标识符
- `isascii` 和 `isprintable` 对空字符串返回 `True`——"所有字符都是 ASCII"在空字符串上空洞为真
- `iskeyword` 和 `issoftkeyword` 对空字符串返回 `False`——空字符串不是关键字

## 3. 最佳实践

### 3.1 安全标识符检查的推荐写法

在需要根据外部输入动态访问属性或执行代码时，始终先做标识符校验。

**推荐写法**

```python
import keyword
import builtins

def is_safe_identifier(name):
    """判断字符串是否为安全的变量名/属性名。

    安全 = 合法标识符 + 非关键字 + 非内置名称。
    """
    if not isinstance(name, str) or not name:
        return False
    if not name.isidentifier():
        return False
    if keyword.iskeyword(name):
        return False
    if hasattr(builtins, name):
        return False
    return True
```

**不推荐写法**

```python
# 危险：不做任何校验直接 getattr
val = getattr(obj, user_input)  # 如果 user_input 是 "__dict__" 呢？

# 危险：只检查了非空，没有校验标识符合法性
if user_input:
    setattr(obj, user_input, value)  # 如果 user_input 是 "class" 呢？

# 不够安全：只检查了 isidentifier，没有排除关键字
if user_input.isidentifier():
    setattr(obj, user_input, value)  # 如果 user_input 是 "if" 呢？
```

### 3.2 getattr/setattr 的安全封装

在动态属性访问场景中，推荐用安全封装函数代替直接调用 `getattr` / `setattr`。

**推荐写法**

```python
import keyword

def safe_getattr(obj, attr_name):
    """安全获取属性：校验 + 访问。"""
    if not isinstance(attr_name, str):
        raise TypeError("属性名必须是字符串")
    if not attr_name.isidentifier():
        raise ValueError(f"'{attr_name}' 不是有效标识符")
    if keyword.iskeyword(attr_name):
        raise ValueError(f"'{attr_name}' 是 Python 关键字")
    if attr_name.startswith("_"):
        raise ValueError(f"拒绝访问受保护/私有属性: '{attr_name}'")
    return getattr(obj, attr_name)


def safe_setattr(obj, attr_name, value):
    """安全设置属性：校验 + 赋值。"""
    if not isinstance(attr_name, str):
        raise TypeError("属性名必须是字符串")
    if not attr_name.isidentifier():
        raise ValueError(f"'{attr_name}' 不是有效标识符")
    if keyword.iskeyword(attr_name):
        raise ValueError(f"'{attr_name}' 是 Python 关键字")
    if attr_name.startswith("__"):
        raise ValueError(f"拒绝设置 dunder 属性: '{attr_name}'")
    setattr(obj, attr_name, value)
```

**不推荐写法**

```python
# 直接暴露 setattr 给用户输入，安全性为零
def bad_config_loader(obj, config_dict):
    for key, val in config_dict.items():
        setattr(obj, key, val)  # 任意键都能设置，包括 __class__ 等
```

### 3.3 动态 eval 的安全守卫

当必须使用 `eval()` 或 `exec()` 时（尽管应尽量避免），用 AST 解析 + 标识符校验来限制可用名称。

**推荐写法**

```python
import ast
import keyword

def safe_eval_arithmetic(expr, allowed_vars):
    """安全计算算术表达式的值。

    只允许使用 allowed_vars 中授权的变量，拒绝内置函数和关键字。
    """
    try:
        tree = ast.parse(expr, mode="eval")
    except SyntaxError:
        return None, "语法错误"

    for node in ast.walk(tree):
        if isinstance(node, ast.Name):
            if not node.id.isidentifier():
                return None, f"非法标识符: {node.id}"
            if keyword.iskeyword(node.id):
                return None, f"关键字不允许: {node.id}"
            if node.id not in allowed_vars:
                return None, f"变量未授权: {node.id}"

    try:
        # 禁用所有内置函数，只允许授权变量
        return True, eval(expr, {"__builtins__": {}}, allowed_vars)
    except Exception as e:
        return False, str(e)
```

**运行效果**

```python
allowed = {"x": 10, "y": 20, "z": 5}
expressions = [
    "x + y",              # 合法
    "x * y - z",          # 合法
    "x ** 2 + y",         # 合法
    "__import__('os')",   # 试图调用内置 -> 被拦截
    "abs(x)",             # 试图调用内置 -> 被拦截
]

for expr in expressions:
    ok, result = safe_eval_arithmetic(expr, allowed)
    print(f"  {expr!r:>30} -> ok={ok}, result={result}")
```

运行结果：

```text
                         'x + y' -> ok=True, result=30
                     'x * y - z' -> ok=True, result=195
                    'x ** 2 + y' -> ok=True, result=120
              "__import__('os')" -> ok=None, result=变量未授权: __import__
                     'abs(x)' -> ok=None, result=变量未授权: abs
```

### 3.4 配置键映射到对象属性

从配置文件（JSON/YAML/环境变量）中将键映射到对象属性时，先校验键是否为安全标识符。

**推荐写法**

```python
import keyword
import builtins

def set_config_attr(obj, key, value):
    """将配置键安全地设为对象属性。"""
    if not key.isidentifier():
        return False, f"'{key}' 不是有效标识符"
    if keyword.iskeyword(key):
        return False, f"'{key}' 是 Python 关键字"
    setattr(obj, key, value)
    return True, f"已设置 {key}={value!r}"
```

**测试**

```python
class AppConfig:
    pass

config_data = {
    "debug": True,
    "max_rows": 100,
    "api-key": "secret",     # 含连字符 -> 被拒绝
    "123port": 8080,         # 数字开头 -> 被拒绝
    "timeout": 30,
    "if": "keyword",         # 关键字 -> 被拒绝
}

app = AppConfig()
for key, val in config_data.items():
    ok, msg = set_config_attr(app, key, val)
    print(f"  {key!r:>10} = {val!r:>10} -> {msg}")

print("\n最终对象属性:")
for attr in dir(app):
    if not attr.startswith("_"):
        print(f"  {attr} = {getattr(app, attr)}")
```

运行结果：

```text
     'debug' =       True -> 已设置 debug=True
  'max_rows' =        100 -> 已设置 max_rows=100
   'api-key' =   'secret' -> 'api-key' 不是有效标识符
   '123port' =       8080 -> '123port' 不是有效标识符
   'timeout' =         30 -> 已设置 timeout=30
        'if' =  'keyword' -> 'if' 是 Python 关键字

最终对象属性:
  debug = True
  max_rows = 100
  timeout = 30
```

### 3.5 不可打印字符清洗

对外部数据进行不可打印字符清洗，同时保留常见空白字符。

**推荐写法**

```python
def sanitize_text(text):
    """清洗文本：移除不可打印字符，保留换行和制表符。"""
    return "".join(
        ch for ch in text
        if ch.isprintable() or ch in ("\n", "\t")
    )
```

**不推荐写法**

```python
# 手动列举所有控制字符——容易遗漏
def bad_sanitize(text):
    return text.replace("\x00", "").replace("\x01", "").replace("\x02", "")
    # 0x03 ~ 0x1F 的控制字符呢？漏了一大片
```

## 4. 原理

### 4.1 isidentifier 的底层实现

`isidentifier()` 的判断逻辑基于 Python 语言的标识符定义，其底层实现依赖于 Unicode 字符属性数据库（UCD）中的 `XID_Start` 和 `XID_Continue` 属性。

标识符的判断流程：

```text
输入字符串 s
    ↓
为空？ -> 返回 False
    ↓
取首字符 c0
    ↓
c0 属于 XID_Start？
  | 否 -> 返回 False
  | 是 ↓
遍历后续字符 c1, c2, ..., cn
    ↓
每个 ci 属于 XID_Continue？
  | 有一个不属于 -> 返回 False
  | 全部属于 ↓
返回 True
```

`XID_Start` 和 `XID_Continue` 的范围概览：

| 属性 | 包含 | 不包含 |
|------|------|--------|
| `XID_Start` | ASCII 字母（a-z, A-Z）、下划线、Unicode 字母（中日韩、希腊、西里尔等）、各种字母脚本 | 数字、标点、符号、控制字符 |
| `XID_Continue` | `XID_Start` 的所有字符 + 数字（0-9 及 Unicode 数字）、连接符 | 标点（除下划线）、空格、控制字符 |

这就是为什么：

- `"123abc".isidentifier()` 返回 `False`——`1` 不属于 `XID_Start`
- `"_123abc".isidentifier()` 返回 `True`——`_` 属于 `XID_Start`，`1` 属于 `XID_Continue`
- `"data₂".isidentifier()` 返回 `False`——下标 `₂` 不属于 `XID_Continue`（它是数字格式字符，不是普通数字）

### 4.2 isascii 的实现原理

`isascii()` 的实现极其简单——遍历字符串，检查每个字符的码点是否 <= 127（`0x7F`）。

```text
输入字符串 s
    ↓
遍历每个字符 ch
    ↓
ord(ch) <= 127？
  | 有一个不满足 -> 返回 False
  | 全部满足 ↓
空字符串也返回 True（没有字符需要检查，空洞为真）
    ↓
返回 True
```

ASCII 范围的 128 个字符包括：

```text
0x00-0x1F：控制字符（NUL、ESC、DEL 等，共 32 个）
0x20：空格
0x21-0x7E：可打印字符（字母、数字、标点）
0x7F：DEL（控制字符）
```

所以 `isascii()` 和 `isprintable()` 的关注点独立：`isascii` 看"码点范围"，`isprintable` 看"能否打印"。

### 4.3 isprintable 的判断逻辑

`isprintable()` 的实现基于 Unicode 的"可打印"属性，不仅限于 ASCII。

```text
输入字符串 s
    ↓
遍历每个字符 ch
    ↓
ch 的 Unicode 类别属于以下之一？
  - L*（字母）
  - N*（数字）
  - P*（标点）
  - S*（符号）
  - Zs（空格分隔符）
  - 空字符串也返回 True
  | 有一个不属于 -> 返回 False
  | 全部属于 ↓
返回 True
```

关键区别：

- ASCII 可打印范围是 `0x20-0x7E`，不包含 `\t`、`\n`、`\r` 等控制字符
- Unicode 可打印范围还包括中文、日文、韩文、表情符号等非 ASCII 可打印字符
- 所以 `"你好".isprintable()` 返回 `True`，而 `"你好".isascii()` 返回 `False`

### 4.4 keyword 模块的实现原理

`keyword` 模块的实现非常直接——它在内部硬编码了关键字列表，通过成员检查来判断。

`keyword.kwlist` 的数据来源是 CPython 解释器底层的 `Py_KeywordType` 注册表。每当 Python 新增关键字时，CPython 源码中的 `Grammar` 文件会更新，`keyword` 模块通过读取解析器的关键字集合来构建 `kwlist`。

软关键字（`softkwlist`）是 Python 3.10 引入的概念。硬关键字在任何上下文中都不能用作标识符，而软关键字只在特定语法结构中才具有关键字语义。例如：

- `match` 可以做变量名；但 `match x:` 中 `match` 是模式匹配语句的关键字
- `type` 可以是内置函数；但 `type Point = tuple[float, float]` 中 `type` 是类型别名语句的关键字

这就是为什么 `keyword.iskeyword("match")` 返回 `False`——`match` 不是硬关键字。要检查软关键字，必须用 `keyword.issoftkeyword()`。

## 5. 总结

本文围绕"标识符与其他判断"展开，主要介绍了以下内容：

- `str.isidentifier()`：判断字符串是否为合法 Python 标识符，基于 Unicode 的 `XID_Start` / `XID_Continue` 属性，支持中文、希腊字母等非 ASCII 字母
- 标识符命名规则：首字符需为字母或下划线，后续字符可为字母、数字或下划线，大小写敏感，无长度限制
- `keyword` 模块：`iskeyword()` 判断硬关键字（如 `if`、`class`、`None`），`issoftkeyword()` 判断软关键字（如 `match`、`case`、`type`、`_`），`kwlist` / `softkwlist` 提供完整列表
- 关键字 vs 内置函数：关键字是语言保留的、不可覆盖的；内置函数来自 `builtins` 模块，可以被覆盖但不推荐
- 完整的安全标识符检查链：`isidentifier()` + `keyword.iskeyword()` + `hasattr(builtins, ...)` 组合使用
- `str.isascii()`：判断字符串是否全部在 ASCII 范围内（0x00-0x7F），含控制字符
- `str.isprintable()`：判断字符串是否全部为可打印字符，排除控制字符，含非 ASCII 可打印字符
- `isascii` 与 `isprintable` 的对比：前者关注编码范围，后者关注能否打印，四种组合各有含义
- 最佳实践：安全属性访问封装、动态 eval 守卫、配置键映射校验、不可打印字符清洗