---
group:
  title: 【03】字符串介绍
  order: 3
order: 25
title: translate 与 maketrans 方法
nav:
  title: Python基础
  order: 1
---

# translate 与 maketrans 方法

## 1. 介绍

### 1.1 知识点定义

`str.maketrans()` 和 `str.translate()` 是 Python 字符串的一对搭档方法——`maketrans` 创建字符映射表，`translate` 使用映射表对字符串进行一次性替换/删除。与 `replace` 的"逐个子串替换"不同，`translate` 在一次遍历中完成所有字符的映射，高效且不会产生连锁替换。

方法签名：

```python
str.maketrans(x, y=None, z=None) -> dict[int, int | str | None]
str.maketrans(mapping_dict) -> dict[int, int | str | None]
str.translate(table) -> str
```

| 方法 | 作用 | 返回值 |
|------|------|--------|
| `maketrans(x, y)` | 从两个等长字符串创建映射表 | `dict[int, int]` |
| `maketrans(x, y, z)` | 创建映射表并指定删除字符 | `dict[int, int \| None]` |
| `maketrans(dict)` | 从字典创建映射表 | `dict[int, str \| None]` |
| `translate(table)` | 使用映射表替换/删除字符 | `str`（新字符串） |

`translate` 的核心特点：

- **单字符映射**——映射表的 key 是单个字符（以 Unicode 序号表示），不是子串
- **一次遍历**——字符串中的每个字符只需遍历一次即可完成所有映射
- **不会连锁替换**——所有映射同时生效，不会像链式 `replace` 那样后续步骤影响前面的结果
- **支持删除**——映射到 `None` 即可删除字符
- **支持多字符映射值**——Python 3 中，单个字符可以映射到多字符字符串（如 `&` -> `&amp;`）

### 1.2 最简示例

先用最简单的代码直观感受这两个方法的配合：

```python
# 创建映射表：a->1, b->2, c->3
table = str.maketrans("abc", "123")

# 使用映射表替换
result = "abcdefabc".translate(table)
print(result)
# 123def123
```

运行结果：

```text
123def123
```

映射表可以同时包含替换和删除：

```python
# 创建映射表：a->1, b->2, c->3, 同时删除 x/y/z
table = str.maketrans("abc", "123", "xyz")
result = "abcxyzabc".translate(table)
print(result)
# 123123
```

运行结果：

```text
123123
```

### 1.3 在字符串方法体系中的位置

`translate` 和 `maketrans` 属于"替换类"字符串操作：

```text
字符串方法体系
├── 查找类：find / rfind / index / count / in
├── 判断类：isalpha / isdigit / isupper / islower ...
├── 拆分与连接类：split / rsplit / splitlines / partition / join
├── 替换类（本篇）：
│   ├── replace          ← 子串替换
│   └── translate / maketrans  ← 单字符映射替换（本篇）
├── 大小写转换类：upper / lower / title / capitalize / swapcase
├── 对齐填充类：ljust / rjust / center / zfill
└── 清洗类：strip / lstrip / rstrip / removeprefix / removesuffix
```

与 `replace` 相比，`translate` 的优势在于：

- **多字符同时映射**——一次调用完成多个单字符的替换，不需要链式调用
- **不会连锁替换**——所有映射同时生效，不会后续替换影响前面
- **支持删除**——映射到 `None` 直接删除字符
- **性能更好**——一次遍历完成所有操作

但 `translate` 也有局限：只支持**单字符**作为映射的 key，不能映射多字符子串（如 `"world"` -> `"Python"`）。

## 2. 核心内容

### 2.1 str.maketrans()

#### 2.1.1 形式1：两个等长字符串

`maketrans(x, y)` 将两个等长字符串中对应位置的字符建立映射——`x` 中的第 i 个字符映射到 `y` 中的第 i 个字符：

```python
table = str.maketrans("abc", "123")
print(f"  str.maketrans('abc', '123') = {table}")
print(f"  含义: a->1, b->2, c->3")
```

运行结果：

```text
  str.maketrans('abc', '123') = {97: 49, 98: 50, 99: 51}
  含义: a->1, b->2, c->3
```

**关键点说明**：

- 映射表的 key 是字符的 Unicode 序号（`ord('a')` = 97），value 是目标字符的序号（`ord('1')` = 49）
- `x` 和 `y` 的长度必须相同，否则抛出 `ValueError`

再来一个元音字母替换的例子：

```python
table = str.maketrans("aeiou", "12345")
print(f"  str.maketrans('aeiou', '12345') = {table}")
print(f"  含义: a->1, e->2, i->3, o->4, u->5")
```

运行结果：

```text
  str.maketrans('aeiou', '12345') = {97: 49, 101: 50, 105: 51, 111: 52, 117: 53}
  含义: a->1, e->2, i->3, o->4, u->5
```

#### 2.1.2 长度不匹配报错

两个字符串长度不同时，`maketrans` 抛出 `ValueError`：

```python
try:
    table = str.maketrans("abc", "12")
except ValueError as e:
    print(f"  str.maketrans('abc', '12') -> ValueError: {e}")
```

运行结果：

```text
  str.maketrans('abc', '12') -> ValueError: the first two maketrans arguments must have equal length
```

#### 2.1.3 形式2：第三参数指定删除字符

`maketrans(x, y, z)` 在建立映射的同时，指定要删除的字符集 `z`——`z` 中每个字符映射到 `None`（即删除）：

```python
table = str.maketrans("abc", "123", "xyz")
print(f"  str.maketrans('abc', '123', 'xyz') = {table}")
print(f"  含义: a->1, b->2, c->3, 同时删除 x/y/z")

result = "abcxyzabc".translate(table)
print(f"  'abcxyzabc'.translate(table) = {result!r}")
```

运行结果：

```text
  str.maketrans('abc', '123', 'xyz') = {97: 49, 98: 50, 99: 51, 120: None, 121: None, 122: None}
  含义: a->1, b->2, c->3, 同时删除 x/y/z
  'abcxyzabc'.translate(table) = '123123'
```

**关键点说明**：

- 第三参数 `z` 是一个字符串，其中每个字符都会被映射到 `None`（删除）
- `"abcxyzabc"` 经过映射后，`a/b/c` 变成 `1/2/3`，`x/y/z` 被删除，结果为 `"123123"`

#### 2.1.4 形式3：字典形式

`maketrans(dict)` 接受一个字典，key 是字符，value 是目标字符或 `None`（删除）：

```python
# 映射到字符串
table = str.maketrans({"a": "1", "b": "2", "c": "3"})
print(f"  str.maketrans({{'a':'1','b':'2','c':'3'}}) = {table}")
```

运行结果：

```text
  str.maketrans({'a':'1','b':'2','c':'3'}) = {97: '1', 98: '2', 99: '3'}
```

字典形式更灵活——可以映射到多字符字符串、可以映射到 `None` 删除字符：

```python
# 混合：映射 + 删除
table = str.maketrans({"a": "1", "e": None, "i": "!"})
print(f"  含 None 的字典: {table}")
print("  a->1, e->删除, i->!")
result = "aeiou".translate(table)
print(f"  'aeiou'.translate(table) = {result!r}")
```

运行结果：

```text
  含 None 的字典: {97: '1', 101: None, 105: '!'}
  a->1, e->删除, i->!
  'aeiou'.translate(table) = '1!ou'
```

**关键点说明**：

- 字典形式中，value 可以是字符串（包括多字符）、`None`（删除）、或整数（Unicode 序号）
- `"aeiou"` 经过映射后：`a` -> `1`，`e` 被删除，`i` -> `!`，`o` 和 `u` 不在映射表中保持不变，结果为 `"1!ou"`

#### 2.1.5 映射表的内部结构

`maketrans` 返回的是一个字典，key 是 Unicode 序号（`int`），value 可以是：
- `int`：目标字符的 Unicode 序号（两等长字符串形式）
- `str`：目标字符串（字典形式，可以是多字符）
- `None`：表示删除该字符

```python
table = str.maketrans("ab", "12")
print(f"  str.maketrans('ab', '12') = {table}")
print(f"  ord('a')={ord('a')}, ord('b')={ord('b')}")
print(f"  ord('1')={ord('1')}, ord('2')={ord('2')}")
```

运行结果：

```text
  str.maketrans('ab', '12') = {97: 49, 98: 50}
  ord('a')=97, ord('b')=98
  ord('1')=49, ord('2')=50
```

**关键点说明**：

- 映射表的 key 是 `97`（`ord('a')`），不是字符 `'a'` 本身
- 两等长字符串形式返回 `{int: int}` 结构，值是目标字符的序号
- 字典形式返回 `{int: str | None}` 结构，值是字符串或 `None`

### 2.2 str.translate()

#### 2.2.1 基本用法

`translate(table)` 接受 `maketrans` 创建的映射表，对字符串中的每个字符进行映射：

```python
table = str.maketrans("aeiou", "12345")
s = "hello world"
result = s.translate(table)
print(f"  映射: a->1, e->2, i->3, o->4, u->5")
print(f"  {s!r}.translate(table) = {result!r}")
```

运行结果：

```text
  映射: a->1, e->2, i->3, o->4, u->5
  'hello world'.translate(table) = 'h2ll4 w4rld'
```

**关键点说明**：

- `e` -> `2`，`o` -> `4`，其余字符不在映射表中保持不变
- `"hello world"` -> `"h2ll4 w4rld"`

#### 2.2.2 映射到多字符字符串

Python 3 中，`translate` 支持将单个字符映射为多字符字符串。这在 HTML 转义等场景中非常有用：

```python
table = str.maketrans({"a": "XY"})
result = "abc".translate(table)
print(f"  maketrans({{'a':'XY'}}), 'abc'.translate(table) = {result!r}")
```

运行结果：

```text
  maketrans({'a':'XY'}), 'abc'.translate(table) = 'XYbc'
```

`a` 被映射为 `"XY"`（两个字符），其余字符不变。

#### 2.2.3 不可变性

`translate` 不会修改原字符串——它返回一个新字符串：

```python
original = "hello"
table = str.maketrans("h", "H")
result = original.translate(table)
print(f"  原始: {original!r}")
print(f"  替换后: {result!r}")
print(f"  原始未被修改: {original == 'hello'}")
```

运行结果：

```text
  原始: 'hello'
  替换后: 'Hello'
  原始未被修改: True
```

#### 2.2.4 空映射表

空映射表（`maketrans("", "")`）不替换任何字符。`translate` 对空映射表返回内容相同的新字符串：

```python
table = str.maketrans("", "")
s = "hello world"
result = s.translate(table)
print(f"  {s!r}.translate(maketrans('', '')) = {result!r}")
print(f"  内容相同: {s == result}")
print(f"  同一对象: {s is result}")
```

运行结果：

```text
  'hello world'.translate(maketrans('', '')) = 'hello world'
  内容相同: True
  同一对象: False
```

**关键点说明**：

- 空映射表返回内容相同的新字符串，但不是同一对象（`is` 为 `False`）
- 这与 `replace(old, new, 0)` 不同——后者在 `count=0` 时返回原对象本身

#### 2.2.5 中文字符替换

`translate` 支持 Unicode 字符映射，包括中文：

```python
table = str.maketrans({"你": "我", "好": "棒"})
s = "你好世界"
result = s.translate(table)
print(f"  原始: {s}")
print(f"  替换: {result}")
```

运行结果：

```text
  原始: 你好世界
  替换: 我棒世界
```

### 2.3 translate 删除字符

#### 2.3.1 映射到 None 删除字符

字典形式中，value 为 `None` 表示删除该字符：

```python
table = str.maketrans({" ": None, ",": None, ".": None, "!": None, "?": None})
s = "Hello, World! How are you?"
result = s.translate(table)
print(f"  原始: {s!r}")
print(f"  删除标点和空格后: {result!r}")
```

运行结果：

```text
  原始: 'Hello, World! How are you?'
  删除标点和空格后: 'HelloWorldHowareyou'
```

#### 2.3.2 第三参数删除字符集

`maketrans("", "", z)` 可以只删除字符不做替换——前两个参数传空字符串：

```python
# 删除所有数字
table = str.maketrans("", "", "0123456789")
cases = [
    ("phone: 138-1234-5678", "删除数字"),
    ("price: $99.99", "删除数字"),
    ("ID: 2024-001", "删除数字"),
]
for s, label in cases:
    result = s.translate(table)
    print(f"  {s!r} -> {result!r} ({label})")
```

运行结果：

```text
  'phone: 138-1234-5678' -> 'phone: --' (删除数字)
  'price: $99.99' -> 'price: $.' (删除数字)
  'ID: 2024-001' -> 'ID: -' (删除数字)
```

#### 2.3.3 translate 删除 vs replace 删除

删除多种字符时，`translate` 一次调用完成，`replace` 需要链式调用多次：

```python
s = "a1b2c3d4"
# translate 一次性删除所有数字
table = str.maketrans("", "", "1234")
t_result = s.translate(table)
# replace 需要链式调用
r_result = s.replace("1", "").replace("2", "").replace("3", "").replace("4", "")
print(f"  原始: {s!r}")
print(f"  translate: {t_result!r}")
print(f"  replace链式: {r_result!r}")
print(f"  结果相同: {t_result == r_result}")
```

运行结果：

```text
  原始: 'a1b2c3d4'
  translate: 'abcd'
  replace链式: 'abcd'
  结果相同: True
```

`translate` 只需一次调用，而 `replace` 需要四次链式调用——当需要删除的字符种类很多时，`translate` 的优势更加明显。

### 2.4 同时替换和删除

#### 2.4.1 第三参数形式

`maketrans(x, y, z)` 可以同时替换字符（x->y）和删除字符（z）：

```python
table = str.maketrans("aeiou", "12345", "xyz")
s = "hello xyz world"
result = s.translate(table)
print(f"  原始: {s!r}")
print(f"  替换元音+删除xyz: {result!r}")
```

运行结果：

```text
  原始: 'hello xyz world'
  替换元音+删除xyz: 'h2ll4  w4rld'
```

**关键点说明**：

- `e` -> `2`，`o` -> `4`，元音被替换
- `x`/`y`/`z` 被删除，`"xyz"` 变为空字符串
- `"hello xyz world"` -> `"h2ll4  w4rld"`（注意有两个空格，原文本中 xyz 两侧的空格保留）

#### 2.4.2 字典形式

字典形式也可以同时指定替换和删除：

```python
table = str.maketrans({"a": "@", "o": "0", " ": None})
s = "hello world app"
result = s.translate(table)
print(f"  原始: {s!r}")
print(f"  替换a/o+删除空格: {result!r}")
```

运行结果：

```text
  原始: 'hello world app'
  替换a/o+删除空格: 'hell0w0rld@pp'
```

**关键点说明**：

- `o` -> `0`，`a` -> `@`
- 空格被删除
- `"hello world app"` -> `"hell0w0rld@pp"`

### 2.5 映射到多字符字符串

#### 2.5.1 HTML 实体转义

`translate` 的多字符映射值在 HTML 转义场景中非常实用——多个特殊字符可以一次性替换为各自的 HTML 实体：

```python
html_table = str.maketrans({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
})
raw = '<div class="x">A & B</div>'
escaped = raw.translate(html_table)
print(f"  原始: {raw}")
print(f"  转义: {escaped}")
```

运行结果：

```text
  原始: <div class="x">A & B</div>
  转义: &lt;div class=&quot;x&quot;&gt;A &amp; B&lt;/div&gt;
```

**关键点说明**：

- `<` -> `&lt;`，`>` -> `&gt;`，`"` -> `&quot;`，`&` -> `&amp;`
- 一次 `translate` 调用完成所有转义，不需要链式 `replace`
- 如果用 `replace` 实现同样的效果，需要四次链式调用，且 `&` 的替换需要放在最前面（否则会将后续替代的实体中的 `&` 再次替换）

#### 2.5.2 删除 Unicode 字符

`translate` 可以删除任何 Unicode 字符，包括中文标点：

```python
# 删除中文全角标点
table = str.maketrans("", "", "\u3000\u3001\u3002\uff0c\uff1b\uff1a\uff01\uff1f")
s = "\u3000你好\uff0c世界\uff01"
result = s.translate(table)
print(f"  原始: {s!r}")
print(f"  删除中文标点: {result!r}")
```

运行结果：

```text
  原始: '\u3000你好，世界！'
  删除中文标点: '你好世界'
```

### 2.6 translate vs replace 对比

#### 2.6.1 链式 replace 的连锁替换问题

链式 `replace` 的核心缺陷——后续替换可能影响前面步骤的结果：

```python
s = "abc"
# 想把 a->b, b->c
result = s.replace("a", "b").replace("b", "c")
print(f"  原始: {s!r}")
print(f"  replace('a','b').replace('b','c') = {result!r}")
print("  期望 'bcc'，实际 'ccc'（连锁替换）")

table = str.maketrans("ab", "bc")
result2 = s.translate(table)
print(f"  translate(maketrans('ab','bc')) = {result2!r}")
print("  translate 一次性映射，不会连锁")
```

运行结果：

```text
  原始: 'abc'
  replace('a','b').replace('b','c') = 'ccc'
  期望 'bcc'，实际 'ccc'（连锁替换）
  translate(maketrans('ab','bc')) = 'bcc'
  translate 一次性映射，不会连锁
```

#### 2.6.2 replace 支持多字符子串

`replace` 的优势——支持多字符子串替换，`translate` 无法做到：

```python
s = "hello world"
# replace 可以替换多字符子串
r_result = s.replace("world", "Python")
print(f"  replace('world', 'Python'): {r_result!r}")
# translate 只能映射单个字符，无法把 "world" 作为整体替换
```

运行结果：

```text
  replace('world', 'Python'): 'hello Python'
```

#### 2.6.3 完整对比表

| 维度 | `translate` | `replace` |
|------|-------------|-----------|
| 替换类型 | 单字符映射 | 子串替换 |
| 多字符 old | 不支持 | 支持 |
| 多字符 new | 支持（Python 3） | 支持 |
| 删除字符 | 映射 `None` 或第三参数 | `new=""` |
| 同时替换+删除 | 一次调用完成 | 需要多次链式调用 |
| 连锁替换问题 | 不会连锁 | 可能连锁 |
| 替换次数限制 | 不支持 | 支持 `count` |
| 性能（多字符映射） | 更好（一次遍历） | 较差（多次创建新串） |
| 使用前提 | 需先 `maketrans` 建表 | 直接调用 |

## 3. 最佳实践

### 3.1 推荐 vs 不推荐写法

| 场景 | 不推荐 | 推荐 | 原因 |
|------|--------|------|------|
| 同时替换多个单字符 | `s.replace("a","1").replace("b","2")` | `s.translate(str.maketrans("ab","12"))` | translate 一次完成，避免连锁 |
| 删除多种字符 | `s.replace("1","").replace("2","")...` | `s.translate(str.maketrans("","",chars))` | translate 一次完成 |
| 替换子串 | `s.translate(...)` | `s.replace(old, new)` | translate 不支持多字符子串 |
| 限制替换次数 | `s.translate(...)` | `s.replace(old, new, count)` | translate 不支持 count |
| HTML 转义 | `s.replace("&","&amp;").replace("<","&lt;")...` | `s.translate(str.maketrans({...}))` | translate 一次完成，且避免 `&` 连锁 |
| ROT13 密码 | `s.replace("a","n").replace("b","o")...` | `s.translate(str.maketrans(...))` | translate 一次完成所有字母偏移 |

### 3.2 常见错误模式

**错误1：用 translate 替换多字符子串**

```python
# translate 无法把 "world" 作为整体替换
# 错误想法：maketrans("world", "Python")
# 这会把 w->P, o->y, r->t, l->h, d->o，而不是把 "world" 替换为 "Python"

# 正确做法：用 replace
result = "hello world".replace("world", "Python")
```

**错误2：maketrans 两个字符串长度不匹配**

```python
# 长度不同会报错
try:
    table = str.maketrans("abc", "12")  # ValueError!
except ValueError as e:
    print(f"Error: {e}")

# 正确做法：两个字符串必须等长
table = str.maketrans("abc", "123")
```

**错误3：用链式 replace 做多字符映射导致连锁替换**

```python
# a->b, b->c，但产生了连锁替换
s = "abc"
result = s.replace("a", "b").replace("b", "c")
print(result)  # 'ccc' 而非 'bcc'

# 正确做法：用 translate
table = str.maketrans("ab", "bc")
print(s.translate(table))  # 'bcc'
```

**错误4：HTML 转义时 & 的替换顺序错误**

```python
# 如果先替换 < -> &lt;，再替换 & -> &amp;
# 那 &lt; 中的 & 也会被替换成 &amp;lt;
s = '<a>A & B</a>'

# 错误顺序
wrong = s.replace("<", "&lt;").replace("&", "&amp;")
print(wrong)  # '&lt;a&gt;A &amp; B&lt;/a&gt;'...'  乱套了

# 正确做法：先替换 & 再替换其他，或用 translate
table = str.maketrans({"&": "&amp;", "<": "&lt;", ">": "&gt;"})
print(s.translate(table))  # 一次完成，没有顺序问题
```

### 3.3 实战示例：ROT13 密码

ROT13 是一种简单的字母偏移密码——每个字母偏移 13 位，加密和解密使用同一个操作：

```python
import string

lower_from = string.ascii_lowercase
lower_to = lower_from[13:] + lower_from[:13]
upper_from = string.ascii_uppercase
upper_to = upper_from[13:] + upper_from[:13]
table = str.maketrans(
    lower_from + upper_from,
    lower_to + upper_to,
)

text = "Hello, Python!"
encoded = text.translate(table)
decoded = encoded.translate(table)  # ROT13 是自逆的
print(f"  原始: {text}")
print(f"  加密: {encoded}")
print(f"  解密: {decoded}")
print(f"  加解密一致: {text == decoded}")
```

运行结果：

```text
  原始: Hello, Python!
  加密: Uryyb, Clguba!
  解密: Hello, Python!
  加解密一致: True
```

**关键点说明**：

- 26 个字母偏移 13 位，`a` -> `n`，`n` -> `a`，再偏移一次就回来了
- `maketrans` 一次建立所有 52 个映射（26 小写 + 26 大写）
- 如果用 `replace` 实现，需要 52 次链式调用，且会产生连锁替换问题

### 3.4 实战示例：密码强度检查

用 `translate` 快速统计字符串中各类字符的数量——将某类字符删除后比较长度差：

```python
digit_only = str.maketrans("", "", "0123456789")
lower_only = str.maketrans("", "", "abcdefghijklmnopqrstuvwxyz")
upper_only = str.maketrans("", "", "ABCDEFGHIJKLMNOPQRSTUVWXYZ")
special_only = str.maketrans("", "", "!@#$%^&*()_+-=[]{}|;:',.<>?/`~")

passwords = ["123456", "password", "Pass123!", "P@ssw0rd!", "weak"]
for pwd in passwords:
    digits = len(pwd) - len(pwd.translate(digit_only))
    lowers = len(pwd) - len(pwd.translate(lower_only))
    uppers = len(pwd) - len(pwd.translate(upper_only))
    specials = len(pwd) - len(pwd.translate(special_only))
    types = sum(1 for c in [digits, lowers, uppers, specials] if c > 0)
    score = "弱" if types <= 1 else ("中" if types <= 2 else "强")
    print(f"  {pwd:<12} 长度={len(pwd)} 数字={digits} 小写={lowers} 大写={uppers} 特殊={specials} [{score}]")
```

运行结果：

```text
  123456       长度=6 数字=6 小写=0 大写=0 特殊=0 [弱]
  password     长度=8 数字=0 小写=8 大写=0 特殊=0 [弱]
  Pass123!     长度=8 数字=3 小写=3 大写=1 特殊=1 [强]
  P@ssw0rd!    长度=9 数字=1 小写=5 大写=1 特殊=2 [强]
  weak         长度=4 数字=0 小写=4 大写=0 特殊=0 [弱]
```

### 3.5 方法选择决策

```text
你需要做什么？
  ├── 替换一个子串为新子串？
  │     → replace(old, new)
  │     （old 可以是多字符）
  │
  ├── 只替换前 N 个匹配？
  │     → replace(old, new, count=N)
  │     （translate 不支持次数限制）
  │
  ├── 同时映射多个单字符？
  │     → translate(maketrans(old_chars, new_chars))
  │     （一次调用，避免连锁替换）
  │
  ├── 删除多个字符？
  │     → translate(maketrans("", "", chars))
  │     （一次调用完成）
  │
  ├── 同时替换和删除？
  │     → translate(maketrans(x, y, z))
  │     or translate(maketrans({char: target_or_None}))
  │
  ├── 担心链式 replace 连锁？
  │     → translate
  │     （一次性映射，不会连锁）
  │
  └── 多字符子串替换？
        → replace
        （translate 只支持单字符映射）
```

## 4. 原理

### 4.1 maketrans 的映射表构建逻辑

`maketrans` 的三种参数形式最终都返回一个 `dict[int, int | str | None]`：

```text
形式1：maketrans(x, y)
  遍历 x 和 y 中每对对应字符 (xi, yi):
    table[ord(xi)] = ord(yi)
  返回 {int: int}

形式2：maketrans(x, y, z)
  先做形式1的映射
  再遍历 z 中每个字符 zi:
    table[ord(zi)] = None
  返回 {int: int | None}

形式3：maketrans(dict)
  遍历字典每对 {key: value}:
    if value 是 str:
      table[ord(key)] = value
    elif value 是 int:
      table[ord(key)] = value
    elif value 是 None:
      table[ord(key)] = None
  返回 {int: str | int | None}
```

**关键点说明**：

- 三种形式最终都返回 `dict[int, ...]`，key 统一是 Unicode 序号
- 形式1和形式2返回的是 `int` 值（序号），形式3可以返回 `str` 或 `None`
- `translate` 在实际处理时，会统一处理 `int`、`str`、`None` 三种值类型

### 4.2 translate 的一次遍历逻辑

`translate` 的核心优势在于**一次遍历**完成所有字符的映射：

```text
函数 translate(s, table):
    result = []                     # 结果用可变列表收集
    for char in s:
        codepoint = ord(char)
        if codepoint in table:
            mapped = table[codepoint]
            if mapped is None:
                continue            # 跳过（删除该字符）
            elif isinstance(mapped, int):
                result.append(chr(mapped))   # 转回字符
            elif isinstance(mapped, str):
                result.append(mapped)        # 直接追加字符串
        else:
            result.append(char)     # 不在映射表中，保持原样
    return ''.join(result)
```

**关键点说明**：

- `translate` 只遍历字符串**一次**，每个字符查一次映射表
- 如果字符在表中：映射为 `int`（转回字符）、`str`（直接追加）、`None`（删除）
- 如果字符不在表中：保持原样
- 用可变列表 `result` 收集结果，最后 `''.join()` 合并——避免频繁创建中间字符串

### 4.3 为什么 translate 不会连锁替换

`translate` 不会连锁替换的原因在于：映射表中所有映射关系是**预定义**的，在实际遍历时是**同时生效**的。

```text
链式 replace 的执行过程（会连锁）：
  第1步：s.replace("a", "b")    → "bbc"  （a 变成了 b）
  第2步："bbc".replace("b", "c") → "ccc"  （上一步产生的 b 也被替换了）

translate 的执行过程（不会连锁）：
  映射表：{97: 98, 98: 99}   （a->b, b->c）
  遍历 "abc"：
    字符 'a' (97) → 查表 → 映射为 98 ('b') → 追加 'b'
    字符 'b' (98) → 查表 → 映射为 99 ('c') → 追加 'c'
    字符 'c' (99) → 不在表中 → 保持 'c'
  结果：'bcc'

  原始的 'a' 被映射为 'b'，这个 'b' 是结果一部分，
  但不会被再次查表映射——因为 translate 在遍历原始字符串，
  不是遍历已替换的结果。
```

这就是 `translate` 不会连锁替换的本质——它在遍历原始字符串时查表，映射结果直接输出，不会被二次处理。

### 4.4 性能对比

`translate` 一次遍历完成所有操作，而链式 `replace` 每次都创建一个新字符串并完整扫描。当需要映射/删除的字符种类较多时，性能差异显著：

```text
假设字符串长度为 n，需要映射的字符种类为 k

translate 的时间复杂度：O(n)
  → 不管 k 多大，只遍历一次，每个字符查一次表

链式 replace 的时间复杂度：O(n * k)
  → 每次 replace 扫描整个字符串（O(n)），共调用 k 次
  → 且每次都创建一个长度为 O(n) 的新字符串
```

对于常见的"删除所有标点"场景（需要删除约 20 种标点字符），`translate` 只需一次扫描，而 `replace` 需要扫描 20 次。

### 4.5 多字符映射值的实现

Python 3 中，`translate` 支持将单个字符映射为多字符字符串。这在 CPython 中的实现是：当映射值是 `str` 类型时，直接将整个字符串追加到结果列表中：

```python
table = str.maketrans({"&": "&amp;"})
result = "A & B".translate(table)
print(f"  {result!r}")
# 'A &amp; B'
```

运行结果：

```text
  'A &amp; B'
```

这一特性使得 HTML 转义等场景可以用 `translate` 一次性完成——每个特殊字符映射到各自的多字符实体，不需要链式 `replace`。

## 5. 总结

本文围绕 `str.maketrans()` 和 `str.translate()` 方法展开，主要介绍了以下内容：

- `str.maketrans()` 有三种参数形式：两等长字符串 `maketrans(x, y)`、带删除集 `maketrans(x, y, z)`、字典形式 `maketrans(dict)`
- `maketrans` 返回 `dict[int, int | str | None]` 映射表——key 是 Unicode 序号，value 是目标序号、字符串或 `None`
- `str.translate(table)` 使用映射表对字符串进行一次遍历完成所有字符的替换和删除
- `translate` 只支持单字符映射（key 是单个字符的序号），不支持多字符子串替换——这是与 `replace` 的核心区别
- Python 3 中 `translate` 支持多字符映射值——单个字符可以映射为多字符字符串（如 `&` -> `&amp;`）
- 映射到 `None` 删除字符——字典形式中 `"e": None` 或第三参数 `maketrans(x, y, z)` 中的 `z` 字符
- 第三参数形式 `maketrans("", "", z)` 只删除不替换——前两个参数传空字符串
- `translate` 可以同时替换和删除——一次调用完成，不需要链式调用
- `translate` 不会连锁替换——所有映射在遍历原始字符串时同时生效，映射结果不会被二次处理
- `translate` vs `replace`：多字符子串替换用 `replace`、单字符多字符映射用 `translate`、限制替换次数用 `replace` 的 `count`、删除多种字符用 `translate`
- 链式 `replace` 连锁替换问题：`"abc".replace("a","b").replace("b","c")` 得到 `"ccc"` 而非 `"bcc"`，用 `translate` 可以避免
- HTML 转义场景：用 `translate` + 多字符映射值一次完成所有特殊字符的转义，且不会有 `&` 的替换顺序问题
- ROT13 密码：用 `maketrans` 建立 52 个字母的偏移映射，`translate` 一次完成加密/解密
- 密码强度检查：用 `translate` 删除特定字符类型后比较长度差，快速统计各类字符数量
- `translate` 的性能优势：一次遍历 O(n) 完成所有操作，链式 `replace` 为 O(n*k)，映射种类多时差距显著
