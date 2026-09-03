---
group:
  title: 【03】字符串深度剖析
  order: 3
order: 14
title: 字符串替换方法
nav:
  title: Python基础
  order: 1
---

# 字符串替换方法

## 1. 介绍

### 1.1 什么是字符串替换方法

字符串替换方法是 Python `str` 类中用于"将字符串中的某些内容替换为其他内容"的一组内置方法。它们不修改原字符串，而是返回一个替换后的新字符串。Python 提供了两种替换途径——`replace` 按子串匹配替换，`translate` 按字符映射替换，各有适用场景。

```python
# replace：按子串替换
text = "I like cats"
print(text.replace("cats", "dogs"))
# I like dogs

# translate：按字符映射批量替换
table = str.maketrans("abc", "123")
print("abcabc".translate(table))
# 123123
```

两种方法的核心差异：

| 方法 | 匹配方式 | 返回值 | 核心特点 |
|------|---------|--------|---------|
| `replace` | 子串匹配 | 新字符串 | 替换连续的字符串片段 |
| `translate` | 字符映射 | 新字符串 | 逐字符映射，一次扫描完成所有替换 |

### 1.2 最简示例

```python
# replace——替换单个子串
url = "https://www.example.com///"
clean_url = url.rstrip("/")
print(clean_url)
# https://www.example.com

# replace——限制替换次数
text = "a-b-c-d-e"
print(text.replace("-", "+", 2))
# a+b+c-d-e

# translate——批量替换多个不同字符
table = str.maketrans("aeiou", "12345")
print("Hello World".translate(table))
# H2ll4 W4rld

# translate——同时替换和删除
table_del = str.maketrans("ae", "12", "x")
print("aexbxc".translate(table_del))
# 12bc  ← a→1, e→2, x 被删除
```

`replace` 和 `translate` 覆盖了字符串替换的核心需求——"把某个子串换成另一个"和"同时替换/删除多个不同字符"。理解它们的差异和陷阱，能让你在数据清洗、文本处理、字符编码转换等场景中选择正确的工具。

## 2. 核心内容

### 2.1 `replace()` 按子串替换

#### 2.1.1 `replace(old, new)` 基本用法

`replace(old, new)` 将字符串中所有匹配 `old` 的子串替换为 `new`，返回一个新字符串。`old` 可以是单个字符，也可以是多字符的子串。

```python
# 替换所有匹配项
text = "I like cats and cats are cute"
result = text.replace("cats", "dogs")
print(result)
# I like dogs and dogs are cute

# 替换为空串 = 删除指定子串
url = "https://www.example.com///"
cleaned = url.replace("/", "")
print(cleaned)
# https:www.example.com

# old 可以是多字符子串
log = "2024-01-15|INFO|System started"
formatted = log.replace("|", " ")
print(formatted)
# 2024-01-15 INFO System started
```

`replace` 找不到匹配子串时，原样返回不报错：

```python
text = "Hello Python"
result = text.replace("Java", "C++")
print(result)
# Hello Python  ← 原样返回
```

#### 2.1.2 `count` 参数：限制替换次数

`replace(old, new, count)` 的第三个参数 `count` 控制最多替换几处——只替换前 `count` 个匹配项，剩余部分不变。

```python
text = "a-b-c-d-e"

# 不限制：替换所有
print(text.replace("-", "+"))
# a+b+c+d+e

# 只替换前 2 个
print(text.replace("-", "+", 2))
# a+b+c-d-e

# count=0：不替换任何项
print(text.replace("-", "+", 0))
# a-b-c-d-e
```

**典型应用——只替换第一次出现的品牌名**：

```python
article = "iPhone 15 发布了。iPhone 15 Pro 也有更新。iPhone 15 Pro Max 是顶配。"
updated = article.replace("iPhone 15", "Phone-A", 1)
print(updated)
# Phone-A 发布了。iPhone 15 Pro 也有更新。iPhone 15 Pro Max 是顶配。
```

**模板渲染——只替换第一个占位符**：

```python
template = "Hello {name}, welcome {name}!"
rendered = template.replace("{name}", "Alice", 1)
print(rendered)
# Hello Alice, welcome {name}!  ← 第二个占位符保留
```

#### 2.1.3 `replace` 不修改原字符串

Python 字符串是不可变对象，`replace` 返回的是一个新字符串对象，原字符串保持不变：

```python
original = "Hello World"
new_str = original.replace("World", "Python")

print(original)   # Hello World  ← 原字符串不变
print(new_str)    # Hello Python ← 新字符串
print(original is new_str)  # False ← 不同对象
```

#### 2.1.4 `replace` 的链式调用

多次 `replace` 链式调用可以实现多步替换。每次调用都返回新字符串，原对象不变：

```python
# 去掉方括号
log = "[2024-01-15] INFO: System started"
cleaned = log.replace("[", "").replace("]", "")
print(cleaned)
# 2024-01-15 INFO: System started
```

**链式调用的顺序依赖陷阱**——前一次替换的结果可能被后一次匹配，导致意外替换：

```python
text = "把 a 换成 b，把 b 换成 c"

# 目标：a→b，b→c
# 但先执行 a→b 后，原来的 a 已经变成了 b
# 再执行 b→c 时，原来的 a 和原来的 b 都变成了 c
wrong = text.replace("a", "b").replace("b", "c")
print(wrong)
# 把 c 换成 c，把 c 换成 c  ← 全变成 c 了！

# 正确做法：用 translate 一次性映射，互不干扰
correct = text.translate(str.maketrans("ab", "bc"))
print(correct)
# 把 b 换成 c，把 c 换成 c  ← a→b, b→c，互不干扰
```

这个陷阱是 `replace` 和 `translate` 的核心差异之一——`replace` 链式调用有顺序依赖，`translate` 一次性映射无顺序依赖。

#### 2.1.5 实际应用——敏感词过滤

```python
def filter_sensitive_words(text, words):
    """用 replace 过滤敏感词，替换为等长星号"""
    for word in words:
        text = text.replace(word, "*" * len(word))
    return text

comment = "这个游戏真垃圾，客服态度差，简直就是骗局"
sensitive = ["垃圾", "骗局", "差"]
cleaned = filter_sensitive_words(comment, sensitive)
print(cleaned)
# 这个游戏真**，客服态度*，简直就是**
```

每个敏感词替换为等长星号，既过滤了内容又保持了文本结构。

#### 2.1.6 实际应用——模板渲染

```python
def render_template(template, variables):
    """用 replace 实现简单的模板渲染"""
    result = template
    for key, value in variables.items():
        result = result.replace("{" + key + "}", str(value))
    return result

email_template = """Dear {name},

Your order #{order_id} has been confirmed.
Total amount: {amount}

Thank you for shopping with {store_name}!"""

rendered = render_template(email_template, {
    "name": "Alice",
    "order_id": "20240115",
    "amount": 299.00,
    "store_name": "Python Shop",
})
print(rendered)
# Dear Alice,
#
# Your order #20240115 has been confirmed.
# Total amount: 299.0
#
# Thank you for shopping with Python Shop!
```

`replace` 的模板渲染实现简单直观。注意如果变量值中包含另一个变量的占位符，会产生意外替换——对于复杂的模板场景，应使用 `str.format()` 或专门的模板引擎。

### 2.2 `translate()` 按字符映射替换

#### 2.2.1 `str.maketrans()` 创建映射表

`maketrans` 是 `translate` 的配套方法，用于创建字符映射表。`translate` 根据映射表对字符串中的每个字符进行替换或删除。

`maketrans` 有两种参数形式：

**形式一：两个等长字符串**

`str.maketrans(x, y)` —— `x` 中的每个字符分别映射到 `y` 中对应位置的字符。两个字符串长度必须相等。

```python
# 'a'→'1', 'b'→'2', 'c'→'3'
table = str.maketrans("abc", "123")
print(table)
# {97: 49, 98: 50, 99: 51}
# 97 是 'a' 的 Unicode 码点，49 是 '1' 的码点

text = "abcabc"
print(text.translate(table))
# 123123
```

**形式三：三个字符串（含删除字符集合）**

`str.maketrans(x, y, z)` —— 前两个参数同上，第三个参数 `z` 中的字符将被删除：

```python
 # 替换 a→1, b→2, c→3，同时删除空格
table = str.maketrans("abc", "123", " ")
text = "abc abc"
print(text.translate(table))
# 123123  ← 空格被删除
```

**形式二：字典**

`str.maketrans(dict)` —— 字典的键是字符，值是替换内容（字符串）或 `None`（表示删除）：

```python
# 键为字符，值为替换字符串（可以是多字符）或 None（删除）
table = str.maketrans({
    "a": "1",
    "b": "2",
    "c": "3",
    " ": None,  # 删除空格
})
text = "abc abc"
print(text.translate(table))
# 123123
```

字典形式独有的能力——将一个字符映射为多字符子串：

```python
# 两个等长字符串形式只能做 1:1 映射
# 只有字典形式支持单字符→多字符映射
table = str.maketrans({
    "1": "one",
    "2": "two",
    "3": "three",
})
text = "I have 1 cat and 2 dogs"
print(text.translate(table))
# I have one cat and two dogs
```

注意：两个等长字符串形式的 `maketrans` 只能做 1:1 的字符映射。如果两个字符串长度不等，会抛出 `ValueError`：

```python
# 错误：两个字符串长度不等
# str.maketrans("12", "onetwo")  # ValueError!
# 它会尝试 1:1 映射，但 "12" 有 2 个字符，"onetwo" 有 6 个字符，长度不匹配

# 正确：如果只想做 1:1 映射，两个字符串长度必须相等
table = str.maketrans("12", "on")  # '1'→'o', '2'→'n'
print("12".translate(table))
# on
```

#### 2.2.2 `translate(table)` 基本用法

`translate` 根据映射表，对字符串中的每个字符进行替换或删除。核心优势是**一次扫描完成所有字符的替换和删除**，不需要多次遍历字符串。

```python
 # 一次替换多个不同的字符
table = str.maketrans("aeiou", "12345")
print("beautiful".translate(table))
# b2a5t3f5l  ← 所有元音同时替换

# 对比：用 replace 需要链式调用 5 次
result = "beautiful"
for old, new in [("a", "1"), ("e", "2"), ("i", "3"), ("o", "4"), ("u", "5")]:
    result = result.replace(old, new)
print(result)
# b2a5t3f5l  ← 结果相同，但扫描了 5 次
```

#### 2.2.3 `translate` 删除字符

`maketrans` 的第三参数和字典中的 `None` 值都能实现字符删除：

```python
import string

# 删除所有标点符号
table = str.maketrans("", "", string.punctuation)
text = "Hello, World! How's it going?"
print(text.translate(table))
# Hello World Hows it going

# 删除所有空白字符
table_ws = str.maketrans("", "", " \t\n")
text2 = "  Hello   World\t\n"
print(text2.translate(table_ws))
# HelloWorld
```

#### 2.2.4 替换与删除同时进行

`translate` 可以在一次调用中同时完成替换和删除：

```python
 # 替换元音为数字，同时删除空格
text = "Hello Beautiful World"
table = str.maketrans("aeiou", "12345", " ")
print(text.translate(table))
# H2ll4B24t3f5lW4rld

# 等价的字典形式
table_dict = str.maketrans({
    "a": "1", "e": "2", "i": "3", "o": "4", "u": "5",
    " ": None,
})
print(text.translate(table_dict))
# H2ll4B24t3f5lW4rld
```

这是 `translate` 的核心优势——`replace` 需要多次调用才能完成替换+删除的组合操作，而 `translate` 只需要一次扫描。

#### 2.2.5 `translate` 不可变性

和所有字符串方法一样，`translate` 不修改原字符串，返回新对象：

```python
original = "Hello World"
table = str.maketrans("helo", "HELO")
result = original.translate(table)

print(original)  # Hello World ← 不变
print(result)    # HELLO WOrLd ← 新字符串
```

#### 2.2.6 实际应用——ROT13 加密

`translate` 天然适合"逐字符映射"的场景。ROT13 是一种简单的字母位移加密——每个字母在字母表中移动 13 位，加密解密用同一个映射表：

```python
def rot13(text):
    """ROT13 加密：字母位移 13 位，两次 ROT13 还原"""
    table = str.maketrans(
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
        "nopqrstuvwxyzabcdefghijklmNOPQRSTUVWXYZABCDEFGHIJKLM",
    )
    return text.translate(table)

message = "Hello Python Secret"
encrypted = rot13(message)
decrypted = rot13(encrypted)

print(f"原文:   {message}")
print(f"加密后: {encrypted}")
print(f"解密后: {decrypted}")
# 原文:   Hello Python Secret
# 加密后: Urybb Clguba Frperg
# 解密后: Hello Python Secret
```

`translate` 一次完成所有字母的位移，代码简洁高效。

#### 2.2.7 实际应用——全角转半角

中文环境中常有全角字符（如 `Ｈｅｌｌｏ`），用 `translate` 可以批量转换为半角：

```python
full_to_half = str.maketrans(
    "０１２３４５６７８９ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ",
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
)

full_text = "Ｈｅｌｌｏ Ｗｏｒｌｄ ２０２４"
half_text = full_text.translate(full_to_half)
print(f"全角: {full_text}")
print(f"半角: {half_text}")
# 全角: Ｈｅｌｌｏ Ｗｏｒｌｄ ２０２４
# 半角: Hello World 2024
```

#### 2.2.8 实际应用——去除重音符号

处理多语言文本时，常需要将带重音的字母转换为基本字母（如 `café` → `cafe`）：

```python
accent_map = str.maketrans(
    "àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ",
    "aaaaaaaceeeeiiiidnoooooouuuuytyAAAAAAACEEEEIIIIDNOOOOOOUUUUYTY",
)

names = ["Café", "Hôtel", "Naïve", "Résumé", "Zoë"]
for name in names:
    print(f"  {name:<12} → {name.translate(accent_map)}")

# 输出:
#   Café         → Cafe
#   Hôtel        → Hotel
#   Naïve        → Naive
#   Résumé       → Resume
#   Zoë          → Zoe
```

#### 2.2.9 实际应用——HTML 转义

HTML 中的特殊字符需要转义——`<` → `&lt;`，`>` → `&gt;`，`&` → `&amp;`，`"` → `&quot;`。这是单字符映射为多字符子串的场景，用字典形式的 `maketrans` 实现：

```python
def escape_html(text):
    """用 translate 批量替换 HTML 特殊字符"""
    table = str.maketrans({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
    })
    return text.translate(table)

raw_html = '<div class="content">Tom & Jerry</div>'
escaped = escape_html(raw_html)
print(escaped)
# &lt;div class=&quot;content&quot;&gt;Tom &amp; Jerry&lt;/div&gt;
```

字典形式的 `translate` 支持单字符→多字符映射，这是两等长字符串形式做不到的。

### 2.3 `replace` 与 `translate` 对比

#### 2.3.1 匹配方式对比

`replace` 按**子串**匹配——它寻找连续的字符串片段进行替换；`translate` 按**字符**映射——它对每个字符独立查表替换。这是两者最根本的差异。

```python
# replace：替换子串 "hello" → "hi"
text = "hello world"
print(text.replace("hello", "hi"))
# hi world

# translate：只能映射单个字符，不能映射子串
# translate 无法实现 "hello" → "hi"
```

```python
# translate：批量替换多个不同字符
text = "abcdefg"
# 用 translate 一次完成
print(text.translate(str.maketrans("abc", "123")))
# 123defg

# 用 replace 需要多次调用
result = text.replace("a", "1").replace("b", "2").replace("c", "3")
print(result)
# 123defg
```

#### 2.3.2 顺序依赖对比

`replace` 链式调用有顺序依赖——前一次替换的结果可能被后一次匹配。`translate` 一次性映射，所有字符同时替换，互不干扰：

```python
text = "a b c"

# replace 链式：a→b 后，原来的 a 变成了 b
# 再执行 b→c 时，原来的 a 和原来的 b 都变成了 c
print(text.replace("a", "b").replace("b", "c"))
# c c c  ← 全变成 c

# translate：a→b 和 b→c 同时映射，互不影响
print(text.translate(str.maketrans("ab", "bc")))
# b c c  ← a→b, b→c，互不干扰
```

#### 2.3.3 性能对比

`translate` 在批量替换多个不同字符时性能优于 `replace`——`translate` 只扫描一次字符串，而 `replace` 链式调用每替换一个字符就要完整扫描一遍字符串：

```python
import time

large_text = "The quick brown fox jumps over the lazy dog. " * 10000

# replace：替换 5 个元音，需要 5 次完整扫描
start = time.perf_counter()
for _ in range(100):
    result = large_text
    for old, new in [("a", "1"), ("e", "2"), ("i", "3"), ("o", "4"), ("u", "5")]:
        result = result.replace(old, new)
replace_time = time.perf_counter() - start

# translate：一次扫描完成所有 5 个替换
start = time.perf_counter()
table = str.maketrans("aeiou", "12345")
for _ in range(100):
    result = large_text.translate(table)
translate_time = time.perf_counter() - start

print(f"replace 5次链式 (x100): {replace_time:.4f}s")
print(f"translate 1次     (x100): {translate_time:.4f}s")
print(f"translate 快了约 {replace_time / translate_time:.1f} 倍")
```

**运行结果**：

```text
replace 5次链式 (x100): 0.0729s
translate 1次     (x100): 0.0383s
translate 快了约 1.9 倍
```

实际倍数受文本内容和替换次数影响，但 `translate` 在批量替换场景下始终更快——原因是单次扫描 vs 多次扫描的本质差异。

#### 2.3.4 功能对比一览

```text
能力              replace                    translate
---------------------------------------------------------------------------
替换子串            支持                       不支持（只能映射单字符）
同时替换多个字符     需多次链式调用                一次调用完成
删除字符            替换为空串                   maketrans 第三参数或字典 None
单字符→多字符       支持（replace("a", "abc")）  字典形式支持
无顺序依赖          有顺序依赖                   无顺序依赖
count 参数         支持                        不支持
性能（多替换）      较慢（多次扫描）              较快（单次扫描）
适用场景           替换单个或少量子串             批量字符映射/删除
```

#### 2.3.5 场景选择指南

```python
# 场景 1：替换单个子串 → replace
print("hello world".replace("world", "python"))
# hello python

# 场景 2：限制替换次数 → replace with count
print("a-b-c-d".replace("-", "+", 2))
# a+b+c-d

# 场景 3：批量替换单字符 → translate
table = str.maketrans("aeiou", "12345")
print("beautiful".translate(table))
# b2a5t3f5l

# 场景 4：删除特定字符 → translate with delete
table = str.maketrans("", "", " \t\n")
print("  a b c  ".translate(table))
# abc

# 场景 5：单字符映射为多字符 → translate with dict
table = str.maketrans({"1": "one", "2": "two"})
print("1+2=3".translate(table))
# one+two=3
```

### 2.4 综合实战

#### 2.4.1 文本标准化流水线

综合使用 `replace` + `translate` 清洗和标准化文本：

```python
def standardize_text(text):
    """综合使用 replace + translate 标准化文本"""
    # Step 1: replace 逐个替换全角标点为半角
    punct_map = {
        "，": ",", "。": ".", "！": "!", "？": "?",
        "；": ";", "：": ":", "（": "(", "）": ")",
        "【": "[", "】": "]", "\u2018": "'", "\u2019": "'",
        "\u201c": '"', "\u201d": '"',
    }
    for full, half in punct_map.items():
        text = text.replace(full, half)

    # Step 2: translate 删除制表符
    text = text.translate(str.maketrans("", "", "\t"))

    # Step 3: replace 合并连续空格
    while "  " in text:
        text = text.replace("  ", " ")

    # Step 4: strip 去首尾
    text = text.strip()

    # Step 5: replace 统一引号为单引号
    text = text.replace('"', "'")

    return text

raw = "  这是一个　测试文本，　包含　全角空格和　标点符号。  "
standardized = standardize_text(raw)
print(f"原文: '{raw}'")
print(f"标准化后: '{standardized}'")
# 原文: '  这是一个　测试文本，　包含　全角空格和　标点符号。  '
# 标准化后: '这是一个　测试文本,　包含　全角空格和　标点符号.'
```

这个流水线展示了 `replace` 和 `translate` 的分工——`replace` 处理需要逐个对应的全角标点替换（因为全角标点是特殊字符，用 `replace` 更清晰），`translate` 处理需要批量删除的制表符（一次调用比多次 `replace` 更高效）。

#### 2.4.2 HTML 转义与反转义

```python
def escape_html(text):
    """用 translate 批量替换 HTML 特殊字符"""
    table = str.maketrans({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
    })
    return text.translate(table)

def unescape_html(text):
    """用 replace 反转义 HTML 字符"""
    # 注意：反转义有顺序要求——先转 &amp; 避免二次替换
    replacements = [
        ("&amp;", "&"),
        ("&lt;", "<"),
        ("&gt;", ">"),
        ("&quot;", '"'),
    ]
    for entity, char in replacements:
        text = text.replace(entity, char)
    return text

raw = '<div class="content">Tom & Jerry</div>'
escaped = escape_html(raw)
unescaped = unescape_html(escaped)

print(f"原文:   {raw}")
print(f"转义后: {escaped}")
print(f"还原后: {unescaped}")
# 原文:   <div class="content">Tom & Jerry</div>
# 转义后: &lt;div class=&quot;content&quot;&gt;Tom &amp; Jerry&lt;/div&gt;
# 还原后: <div class="content">Tom & Jerry</div>
```

转义时用 `translate`（单字符→多字符映射），反转义时用 `replace`（多字符子串→单字符替换，`translate` 无法按子串匹配）。注意反转义时 `&amp;` 必须最先处理——否则 `&lt;` 中的 `&` 会先被 `&amp;` 替换干扰。

#### 2.4.3 密码脱敏

```python
def mask_password(password, visible_chars=2):
    """保留首尾 visible_chars 个字符，中间替换为星号"""
    if len(password) <= visible_chars * 2:
        return "*" * len(password)

    middle = password[visible_chars:-visible_chars]
    # 用 translate 将中间部分的每个字符替换为 *
    star_table = str.maketrans(middle, "*" * len(middle))
    middle_masked = middle.translate(star_table)
    return password[:visible_chars] + middle_masked + password[-visible_chars:]

passwords = ["mypassword123", "P@ssw0rd!", "a1"]
for pwd in passwords:
    print(f"  {pwd:<15} → {mask_password(pwd)}")

# 输出:
#   mypassword123   → my*********23
#   P@ssw0rd!       → P@*****d!
#   a1              → **
```

`translate` 将中间部分的每个字符映射为 `*`，比用 `replace` 逐个替换更高效。

#### 2.4.4 CSV 数据清洗

```python
def clean_csv_data(records):
    """综合使用 replace + translate 清洗 CSV 数据"""
    # translate 删除不可见控制字符
    invisible_chars = str.maketrans("", "", "\x00\x01\x02\x03\x04\x05")

    cleaned = []
    for row in records:
        clean_row = {}
        for key, value in row.items():
            if isinstance(value, str):
                # translate 删除不可见字符
                value = value.translate(invisible_chars)
                # replace 统一换行
                value = value.replace("\r\n", " ").replace("\n", " ")
                # strip 去首尾空白
                value = value.strip()
            clean_row[key] = value
        cleaned.append(clean_row)
    return cleaned

raw_records = [
    {"name": "Alice\x00", "email": "alice@test.com", "bio": "Hello\r\nWorld"},
    {"name": "Bob\x03", "email": "bob@test.com", "bio": "Python\nDeveloper"},
]

cleaned_records = clean_csv_data(raw_records)
for r in cleaned_records:
    print(f"  {r}")

# 输出:
#   {'name': 'Alice', 'email': 'alice@test.com', 'bio': 'Hello World'}
#   {'name': 'Bob', 'email': 'bob@test.com', 'bio': 'Python Developer'}
```

`translate` 负责删除不可见控制字符（一次扫描批量删除），`replace` 负责将换行符替换为空格（子串替换）。两者分工配合，清洗逻辑清晰。

#### 2.4.5 方法对比总结

```python
text = "a=1&b=2&c=3"

# replace：替换单个子串
print(text.replace("&", ", "))
# a=1, b=2, c=3

# replace with count：只替换第一个
print(text.replace("&", ", ", 1))
# a=1, b=2&c=3

# translate：批量替换字符
table = str.maketrans("=&", ":,")
print(text.translate(table))
# a:1,b:2,c:3

# translate：同时替换和删除
table_del = str.maketrans("=&", ":,", "123")
print(text.translate(table_del))
# a:,b:,c:
```

## 3. 最佳实践

### 3.1 选择正确的替换方法

| 需求 | 推荐方法 | 原因 |
|------|---------|------|
| 替换单个子串 | `replace(old, new)` | 简单直接 |
| 限制替换次数 | `replace(old, new, count)` | `count` 参数控制 |
| 批量替换不同字符 | `translate` | 一次扫描完成 |
| 删除字符 | `translate` with delete | `maketrans` 第三参数 |
| 单字符→多字符 | `replace` 或 `translate`（字典形式） | 两者都可以 |
| 子串→多字符 | `replace(old, new)` | `translate` 无法按子串匹配 |
| 无顺序依赖的多替换 | `translate` | 同时映射，互不干扰 |
| 有顺序要求的多替换 | `replace` 链式 | 控制替换顺序 |

### 3.2 推荐 vs 不推荐写法

```python
# ---- 替换单个子串 ----

# 推荐：replace 一步到位
clean = text.replace("old", "new")

# 不推荐：手动循环逐字符替换（太啰嗦）
result = ""
for ch in text:
    if text[i:i+3] == "old":
        result += "new"
    else:
        result += ch

# ---- 批量替换多个不同字符 ----

# 推荐：translate 一次完成
table = str.maketrans("aeiou", "12345")
result = text.translate(table)

# 不推荐：replace 链式调用（多次扫描 + 顺序依赖风险）
result = text.replace("a", "1").replace("e", "2").replace("i", "3").replace("o", "4").replace("u", "5")

# ---- 删除字符 ----

# 推荐：translate with delete
result = text.translate(str.maketrans("", "", " \t\n"))

# 不推荐：replace 替换为空串（需要多次调用）
result = text.replace(" ", "").replace("\t", "").replace("\n", "")

# ---- 单字符→多字符 ----

# 推荐：translate with dict（一次完成所有映射）
table = str.maketrans({"<": "&lt;", ">": "&gt;", "&": "&amp;"})
result = text.translate(table)

# 不推荐：replace 链式调用（多次扫描 + 顺序依赖）
result = text.replace("<", "&lt;").replace(">", "&gt;").replace("&", "&amp;")
# 注意：上面这行还有顺序问题！如果 & 先被替换，&lt; 中的 & 会被二次替换

# ---- 限制替换次数 ----

# 推荐：replace with count
result = text.replace("{name}", "Alice", 1)

# 不推荐：split + join 手动控制
parts = text.split("{name}")
result = parts[0] + "Alice" + "{name}".join(parts[1:])
```

### 3.3 综合推荐 vs 不推荐对照表

| 场景 | 推荐写法 | 不推荐写法 | 原因 |
|------|---------|-----------|------|
| 子串替换 | `s.replace("a", "b")` | 手动循环 | `replace` 一行搞定 |
| 批量字符替换 | `s.translate(maketrans(...))` | `replace` 链式 | `translate` 单次扫描，无顺序依赖 |
| 删除字符 | `s.translate(maketrans("", "", chars))` | `s.replace("x", "").replace("y", "")` | `translate` 一次删除所有 |
| 替换+删除 | `maketrans(x, y, z)` | `replace` 链式 | `translate` 一次完成 |
| 限制替换次数 | `s.replace(old, new, count)` | `split` + `join` | `count` 参数更直观 |
| HTML 转义 | `translate` with dict | `replace` 链式 | `translate` 无顺序依赖 |
| 全角→半角 | `translate` | `replace` 链式 | `translate` 一次完成 |
| 敏感词过滤 | `replace` | `translate`（不适合） | 敏感词是子串不是单字符 |

### 3.4 常见错误与注意事项

**`replace` 链式调用的顺序依赖**

```python
# 错误：a→b 后再 b→c，原来的 a 变成了 c
text = "a b c"
result = text.replace("a", "b").replace("b", "c")
print(result)
# c c c  ← 全变成 c

# 正确：用 translate 一次性映射
result = text.translate(str.maketrans("ab", "bc"))
print(result)
# b c c  ← a→b, b→c，互不干扰
```

**`maketrans` 两字符串长度必须相等**

```python
# 错误：长度不等会报 ValueError
# str.maketrans("ab", "abc")  # ValueError!

# 正确：两字符串长度必须相同
table = str.maketrans("ab", "cd")
# a→c, b→d

# 多字符映射用字典形式
table = str.maketrans({"a": "abc", "b": "def"})
```

**`translate` 无法替换子串**

```python
# translate 只能映射单个字符，不能映射子串
# 以下无法实现 "hello" → "hi"
table = str.maketrans("hello", "hi???")  # 长度也不等

# 子串替换必须用 replace
result = "hello world".replace("hello", "hi")
```

**HTML 反转义的顺序问题**

```python
# 错误：先替换 &lt; 会把 &amp;lt; 中的 & 也替换了
# 以下顺序有问题——先替换 &amp; 是正确的
def unescape_wrong(text):
    # 先替换 &lt;，但 &amp;lt; 中的 & 还没处理，不会出问题
    # 但如果先替换 &amp; 为 &，&lt; 中的 & 会被错误替换
    text = text.replace("&lt;", "<")
    text = text.replace("&gt;", ">")
    text = text.replace("&amp;", "&")   # 这时 &lt; 的 & 已经变成了 <
    # 但上一步替换出的 < 不会被这一步影响
    return text
# 上面的顺序实际是安全的，但容易搞混

# 正确：先替换 &amp;，避免后续替换出的 & 被二次替换
def unescape_correct(text):
    text = text.replace("&amp;", "&")   # 先处理 &amp;
    text = text.replace("&lt;", "<")
    text = text.replace("&gt;", ">")
    text = text.replace("&quot;", '"')
    return text
```

## 4. 原理

### 4.1 `replace` 的底层实现

`replace` 在 CPython 底层逐字符扫描字符串，寻找与 `old` 匹配的子串。每次找到匹配就复制到结果中（替换为 `new`），然后从匹配后的位置继续扫描。

```text
replace("ab", "X") 处理 "abcabd" 的过程：

  位置 0: a (匹配 ab 的第 1 个字符) → 检查位置 1: b (匹配!) → 替换为 X
  位置 2: c (不匹配 a) → 复制 c
  位置 3: a (匹配 ab 的第 1 个字符) → 检查位置 4: b (匹配!) → 替换为 X
  位置 5: d (不匹配 a) → 复制 d

  结果: "XcdX"
```

`count` 参数的实现是一个计数器——每完成一次替换，计数器递减。计数器归零后，剩余部分直接复制到结果中，不再扫描匹配。

```text
replace("ab", "X", 1) 处理 "abcabd" 的过程：

  位置 0: 匹配 ab → 替换为 X，计数: 1/1
  计数归零 → 剩余 "cabd" 直接复制
  结果: "Xcabd"
```

### 4.2 `translate` 的底层实现

`translate` 在 CPython 底层只扫描字符串一次。对每个字符，查映射表（字典或数组）是否有对应的替换值：

- 有映射值 → 替换为映射值（可以是多字符子串）
- 映射值为 `None` → 删除该字符
- 无映射（不在表中）→ 保留原字符

```text
translate(maketrans("ab", "12", "x")) 处理 "axb xc" 的过程：

  位置 0: a → 查表: 97 → 49 ('1') → 输出 '1'
  位置 1: x → 查表: 120 → None（删除） → 不输出
  位置 2: b → 查表: 98 → 50 ('2') → 输出 '2'
  位置 3: ' ' → 查表: 无映射 → 保留 ' '
  位置 4: x → 查表: 120 → None（删除） → 不输出
  位置 5: c → 查表: 无映射 → 保留 'c'

  结果: "12 c"
```

`maketrans` 创建的映射表在底层是一个字典（键为 Unicode 码点，值为字符串或 `None`）。`translate` 的查找操作是 O(1) 的哈希查找，因此整体时间复杂度为 O(n)——n 是字符串长度，与需要替换的字符种类数量无关。

### 4.3 为什么 `translate` 比 `replace` 链式调用更快

`replace` 链式调用时，每调用一次 `replace` 就完整扫描一遍字符串。如果要替换 5 个不同字符，需要 5 次完整扫描：O(5n)。

`translate` 只扫描一次字符串，对每个字符查一次映射表：O(n) + 查表开销。查表是 O(1) 的哈希查找，因此总体为 O(n)。

```text
replace 链式调用 (5次) 的扫描次数:

  第1次 replace: 扫描整个字符串 → 替换 a→1
  第2次 replace: 扫描整个替换后的字符串 → 替换 e→2
  第3次 replace: 扫描整个替换后的字符串 → 替换 i→3
  第4次 replace: 扫描整个替换后的字符串 → 替换 o→4
  第5次 replace: 扫描整个替换后的字符串 → 替换 u→5
  总扫描次数: 5n

translate (1次) 的扫描次数:

  扫描整个字符串一次 → 每个字符查一次表
  总扫描次数: n + 查表开销（O(1) per char）
  ≈ n
```

### 4.4 `maketrans` 与 `translate` 的设计哲学

`maketrans` 和 `translate` 的分离设计源于 Python 早期——映射表的创建和使用分离，使得同一个映射表可以复用于多个字符串，避免重复构建映射表的开销：

```python
# 映射表创建一次，用于多个字符串
table = str.maketrans("aeiou", "12345")

texts = ["hello", "world", "python", "beautiful"]
for text in texts:
    print(text.translate(table))
# h2ll4
# w4rld
# pyth4n
# b2a5t3f5l
```

如果把映射表创建和使用合并在一个方法中（如 `str.replace_all(chars, mapping)`），每次调用都要重建映射表，性能反而下降。分离设计是 Python 字符串方法中"创建一次、多次使用"模式的典型体现。

## 5. 总结

本文围绕 Python 字符串的替换方法展开，主要介绍了以下内容：

- **`replace()` 方法**：按子串匹配替换，支持 `count` 参数限制替换次数；替换为空串等于删除；链式调用有顺序依赖陷阱（前一次的结果可能被后一次匹配）
- **`translate()` 方法**：按字符映射批量替换，配合 `maketrans` 创建映射表；支持三种映射形式（两等长字符串、三字符串含删除集、字典）；一次扫描完成所有替换和删除；无顺序依赖
- **`maketrans()` 方法**：创建字符映射表，两等长字符串形式做 1:1 映射，字典形式支持单字符→多字符映射和 `None` 删除
- **对比与选择**：`replace` 适合替换单个子串或少量替换（支持 `count` 限制次数）；`translate` 适合批量字符映射/删除（单次扫描、无顺序依赖、性能更优）；子串替换只能用 `replace`，字符映射优先用 `translate`
- **最佳实践**：批量字符替换用 `translate` 替代 `replace` 链式；删除字符用 `translate` 的删除参数；HTML 转义用 `translate` 字典形式；敏感词过滤用 `replace`（子串匹配）；注意 `replace` 链式的顺序依赖和 `maketrans` 两字符串长度相等的要求
- **底层原理**：`replace` 多次扫描字符串（链式调用时每次完整扫描），`translate` 单次扫描 + O(1) 查表；`maketrans` 与 `translate` 分离的设计使映射表可复用，避免重复构建开销
