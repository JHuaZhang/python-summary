---
group:
  title: 【19】标准库精讲
  order: 19
order: 7
title: re 正则：match / search / findall
nav:
  title: Python
  order: 1
---

## 1. 介绍

### 1.1 什么是正则表达式与 re 模块

正则表达式（Regular Expression，简称 regex）是一种描述字符串模式的微型语言。你用它声明"我要找的文本长什么样"，正则引擎替你在目标字符串里把符合该样子的子串找出来。Python 标准库的 `re` 模块就是这套引擎的入口，它提供了正则的编译、查找、替换、分割等一系列函数。

`re` 模块本身不是正则语法的发明者——正则语法是跨语言的通用规范（PCRE 风格），`re` 只是把它接进了 Python。你学会的 pattern 写法，几乎可以原样搬到 Java、JavaScript、Go、grep 里用（细微差异除外）。所以学 `re`，一半在学"正则语法"，一半在学"Python 这个模块的 API 怎么调"。本篇聚焦后者，把 `re` 模块的核心查找函数 `match`、`search`、`findall` 以及配套的匹配对象、`compile`、`flags`、`sub`、`split` 讲透；捕获组、零宽断言等更深的语法细节留给下一篇。

为什么这三个函数最核心？因为几乎所有正则操作的本质都是"找"：校验邮箱是"找"一个能从头匹配到尾的模式，提取 IP 是"找"所有匹配，替换模板变量是先"找"后"换"。`match`、`search`、`findall` 分别对应"从开头找一次""全串找一次""全串找全部"三种最基本的查找策略，理解了它们的起点差异和返回值差异，就掌握了 `re` 的主干。

### 1.2 最小用法：pattern 与 string

`re` 模块的最简调用形态是：传一个 pattern（模式字符串）和一个 string（目标字符串），拿回结果。结果要么是 `None`（没匹配），要么是一个 match 对象（匹配到了）。

```python
import re

text = "订单号: 20250723-XYZ"
# \v 用 r"" 原始字符串写 pattern，避免反斜杠被 Python 先转义
m = re.search(r"\d{8}-[A-Z]+", text)
print(m)
# 输出: <re.Match object; span=(5, 17), match='20250723-XYZ'>
```

这段代码做了三件事：用 `r"\d{8}-[A-Z]+"` 描述"8 位数字 + 横杠 + 大写字母"的模式；在 `text` 里搜索；打印结果。`search` 扫描整个字符串，找到第一个匹配就返回 match 对象，其中 `span=(5, 17)` 说明匹配发生在下标 5 到 17 之间，`match='20250723-XYZ'` 是实际匹配到的文本。

> ** 生长点：r"" 原始字符串**

写正则几乎总是用 `r"..."` 原始字符串。原因是正则里反斜杠非常多（`\d` `\w` `\s` `\b`），而普通字符串中反斜杠是转义符，写 `"\d"` 会被 Python 先解释成……实际上 `\d` 不是合法转义，Python 会保留它，行为勉强能对，但一旦遇到 `\b`（普通字符串里是退格符 `\x08`）或 `\1`（分组反向引用，普通字符串里是八进制转义）就会出错。用 `r"..."` 让反斜杠原样传递给 `re`，是最稳妥、最可读的写法。这个细节在第 2 章和第 3 章会反复强调。

### 1.3 match / search / findall 一眼对比

在展开细节前，先用一张表把三个函数的核心区别立住，后面各节再逐一展开。

| 函数 | 起点 | 找几次 | 返回值 |
|------|------|--------|--------|
| `re.match` | 字符串开头（下标 0） | 一次 | match 对象 或 `None` |
| `re.search` | 全串扫描，第一个匹配处 | 一次 | match 对象 或 `None` |
| `re.findall` | 全串扫描 | 全部非重叠 | 字符串列表 或 元组列表 或 空列表 |

最常踩的坑是以为 `match` 等价于"整体匹配"。它不是——它只锚定起点，不锚定终点。`re.match(r"\d+", "123abc")` 会成功匹配到 `"123"`，因为从开头能对上数字。要真正做到"整串必须完全符合"，得加 `$` 或 `\Z` 锚定结尾，或用 `re.fullmatch`。这个区别在第 2 章详述。

```
>>> import re
>>> re.match(r"\d+", "123abc")        # 从开头匹配到 123，成功
<re.Match object; span=(0, 3), match='123'>
>>> re.match(r"\d+", "abc123")        # 开头不是数字，失败
>>> re.search(r"\d+", "abc123")       # 全串搜，找到 123
<re.Match object; span=(3, 6), match='123'>
>>> re.findall(r"\d+", "a1b22c333")   # 找全部
['1', '22', '333']
```

这三个交互式例子把表格里的区别具象化了：`match` 在 `"abc123"` 上返回 `None`（开头对不上），`search` 能找到，`findall` 把所有数字串都列出来。

---

## 2. 核心内容

### 2.1 re.match：从开头匹配一次

`re.match(pattern, string, flags=0)` 是三个查找函数里限制最强的：它只从字符串的下标 0 开始尝试匹配。注意"尝试匹配"不等于"必须匹配到结尾"——只要从 0 开始能对上 pattern 描述的规则，就算成功，剩下的字符它不管。

函数签名：

```
re.match(pattern, string, flags=0) -> Optional[Match]
```

- `pattern`：正则模式字符串，或一个已编译的 pattern 对象（见 2.8）。
- `string`：目标字符串。
- `flags`：标志位，控制大小写忽略、多行等行为，见 2.9。
- 返回值：匹配成功返回 `re.Match` 对象，失败返回 `None`。

**起点锁定是 match 的全部意义。** 当你校验"这个字符串是否以某种格式开头"时，`match` 比 `search` 更直白，也略快（引擎不必扫描前缀）。典型场景：校验用户输入是否以合法前缀开头、解析固定格式的行首标记。

```python
import re

# 场景：解析日志行，每行以时间戳开头
line = "[2025-07-23 10:15:32] INFO service-a started"

# 从开头匹配时间戳部分
m = re.match(r"\[(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})\]", line)
if m:
    date = m.group(1)
    time = m.group(2)
    print(f"日期={date}, 时间={time}")
# 输出: 日期=2025-07-23, 时间=10:15:32
```

这里 pattern 用了两个捕获组 `(…)` 分别圈住日期和时间，`m.group(1)`、`m.group(2)` 取出它们。捕获组的细节本篇不展开，只强调一点：`match` 返回的 match 对象身上挂了所有匹配信息，组、位置、原串都能取。

**关键陷阱：match 不等于整体匹配。**

```python
import re

# 校验"是否是纯数字"的错误写法
def is_number_wrong(s):
    return re.match(r"\d+", s) is not None

print(is_number_wrong("123"))      # True，正确
print(is_number_wrong("123abc"))   # True！但其实不对，混入了字母
print(is_number_wrong(" 123"))     # None → False，开头空格导致失败
# 输出:
# True
# True
# False
```

`is_number_wrong("123abc")` 返回 `True`，因为 `\d+` 从开头匹配到了 `"123"` 就满足了。要真正校验"整串是纯数字"，必须锚定结尾：

```python
import re

def is_number_right(s):
    # 用 \A 和 \Z 锚定首尾，或用 ^ $ 配合无换行场景
    return re.match(r"\A\d+\Z", s) is not None

print(is_number_right("123"))      # True
print(is_number_right("123abc"))   # False
print(is_number_right(" 123"))     # False
# 输出:
# True
# False
# False
```

`\A` 锚定字符串绝对开头，`\Z` 锚定绝对结尾（`\Z` 在有末尾换行时仍能匹配，`$` 则会匹配末尾换行前的位置，细节见 flags 一节）。或者直接用 `re.fullmatch`，它等价于 `match` + 首尾锚定，语义最清晰：

```python
import re
print(bool(re.fullmatch(r"\d+", "123abc")))  # False
# 输出: False
```

**小结**：`match` 的语义是"从 0 开始能不能对上"，不是"整串符不符合"。当你想校验整串时，加 `\A\Z`、加 `^$`（注意多行模式），或改用 `fullmatch`。

### 2.2 re.search：全串扫描第一个匹配

`re.search(pattern, string, flags=0)` 与 `match` 的唯一区别是起点：它扫描整个字符串，在第一个能匹配上的位置返回。如果全串没有任何位置能匹配，返回 `None`。

```
re.search(pattern, string, flags=0) -> Optional[Match]
```

`search` 是日常用得最多的查找函数。当你"不确定模式出现在字符串的哪里"时，用 `search`。例如从一段自然语言里抽电话号码、从报错信息里找错误码、从 URL 里取 host——匹配位置不固定，都得靠 `search`。

```python
import re

# 场景：从客服对话里提取手机号（位置不固定）
dialogue = "客户反馈：我下午用 13800138000 打过电话，没人接。"

m = re.search(r"1[3-9]\d{9}", dialogue)
if m:
    print("找到手机号:", m.group())
    print("位置:", m.span())
# 输出:
# 找到手机号: 13800138000
# 位置: (15, 26)
```

`m.span()` 返回 `(15, 26)`，说明手机号从下标 15 开始、26 结束。注意 `search` 只找第一个：如果对话里有两个手机号，它只返回第一个。要全找，用 `findall` 或 `finditer`。

**match vs search 的等价关系**：`re.match(pattern, string)` 等价于 `re.search("^" + pattern, string)`（在非多行模式下，`^` 锚定字符串开头）。反过来，`search` 不锚定任何位置。理解了"match 就是带了个隐式 `^` 的 search"，两者的边界就清楚了：

```python
import re

s = "abc123"
# match 从头尝试，开头是字母不是数字，失败
print(re.match(r"\d+", s))         # None
# 等价的 search 写法，加 ^ 锚定开头，同样失败
print(re.search(r"^\d+", s))       # None
# 不加锚的 search，全串扫，找到 123
print(re.search(r"\d+", s).group())  # 123
# 输出:
# None
# None
# 123
```

**为什么有了 search 还要 match？** 语义清晰和微小性能：当你明确要"从头匹配"，`match` 直接把起点锁在 0，引擎不做前缀扫描；`search` 则会从下标 0 开始逐位置尝试，遇到不匹配才后移。在长字符串、高频调用的场景下，`match` 略有优势。但更重要的是可读性——`re.match(r"GET ", line)` 一眼能看出"我在校验这行是不是以 GET 开头"。

### 2.3 re.findall：返回所有非重叠匹配

`re.findall(pattern, string, flags=0)` 把全串所有匹配都找出来，以列表形式返回。它是 `search` 的"批量版"。

```
re.findall(pattern, string, flags=0) -> list
```

`findall` 最容易让人困惑的是返回值形态——它不是固定的"字符串列表"，而是随 pattern 里有没有捕获组而变化：

- **pattern 无捕获组**：返回匹配到的完整字符串列表。
- **pattern 有 1 个捕获组**：返回该组内容的字符串列表。
- **pattern 有多个捕获组**：返回元组列表，每个元组对应一组匹配的各捕获组内容。

这个规则是 `findall` 的最大坑点，也直接关系到"我到底拿到的是什么"。第 4 章会从引擎实现角度解释为什么这么设计；这里先用 demo 把三种情况立清楚。

```python
import re

log = '192.168.1.1 - - [23/Jul/2025:10:15:32] "GET /api HTTP/1.1" 200'

# 1) 无捕获组：返回完整匹配字符串
print(re.findall(r"\d+\.\d+\.\d+\.\d+", log))
# 输出: ['192.168.1.1']

# 2) 有一个捕获组：返回组内容
print(re.findall(r"(\d+\.\d+\.\d+\.\d+)", log))
# 输出: ['192.168.1.1']  —— 看起来一样，但返回的是"组"而非"整匹配"

# 3) 多个捕获组：返回元组列表
ips_and_codes = re.findall(r'(\d+\.\d+\.\d+\.\d+).*?" (\d{3})', log)
print(ips_and_codes)
# 输出: [('192.168.1.1', '200')]
```

注意第 1 种和第 2 种在这个例子里打印结果一样，但语义不同：无组时列表元素是整段匹配文本，有组时是组内文本。当 pattern 同时匹配了整串前后还有别的内容时，差异就显现了——组让你只"摘"出你关心的那部分。

**典型场景：提取日志里所有 IP。**

```python
import re

log_lines = """
10.0.0.1 - GET /index 200
10.0.0.2 - POST /login 401
10.0.0.1 - GET /home 200
10.0.0.3 - DELETE /item 403
"""

# 想统计有哪些 IP 访问过
ips = re.findall(r"\b\d{1,3}(?:\.\d{1,3}){3}\b", log_lines)
print("所有 IP:", ips)
unique = sorted(set(ips))
print("去重后:", unique)
# 输出:
# 所有 IP: ['10.0.0.1', '10.0.0.2', '10.0.0.1', '10.0.0.3']
# 去重后: ['10.0.0.1', '10.0.0.2', '10.0.0.3']
```

这里用 `(?:...)` 是非捕获组——它只起分组作用（让 `{3}` 重复整个 `\.\d{1,3}`），但不进入 `findall` 的返回值。这是一个常用技巧：当你需要用括号分组但不想影响 `findall` 返回值时，用 `(?:...)` 而不是 `(...)`。

**非重叠**：`findall` 找到的匹配之间不重叠。一旦某段文本被匹配消耗，引擎就从匹配结束处继续往后找，不会回头。

```python
import re
# 想找所有 "aa" —— 在 "aaaa" 里
print(re.findall(r"aa", "aaaa"))
# 输出: ['aa', 'aa']  —— 不是三个
```

`"aaaa"` 被切成两段 `"aa"`：第一段匹配下标 0-2，第二段从下标 2 开始匹配 2-4。下标 1-3 那段虽然也是 "aa"，但与前一段重叠，不会被重复报告。要找重叠匹配，`re` 标准库不直接支持，得用 lookahead 零宽断言（`\b` 一类）手工构造，本篇不展开。

### 2.4 re.finditer：返回匹配对象迭代器

`re.finditer(pattern, string, flags=0)` 是 `findall` 的"对象版"：它返回一个迭代器，每个元素是 match 对象，而不是字符串或元组。

```
re.finditer(pattern, string, flags=0) -> Iterator[Match]
```

为什么需要 `finditer`？因为 `findall` 丢了位置信息——它只给你匹配到的文本，不告诉你每段匹配在原串的哪里、每个捕获组的起止下标。当你需要位置（比如做高亮、做替换定位、做范围裁剪），或匹配量很大（一次全加载成列表占内存）时，用 `finditer`。

```python
import re

text = '错误码 E101、E202 和 E303 均已记录'
# findall 只给文本
print(re.findall(r"E\d{3}", text))
# 输出: ['E101', 'E202', 'E303']

# finditer 给完整 match 对象
for m in re.finditer(r"E\d{3}", text):
    print(f"{m.group()} @ {m.span()}")
# 输出:
# E101 @ (4, 8)
# E202 @ (10, 14)
# E303 @ (17, 21)
```

`finditer` 返回的是惰性迭代器，匹配在大字符串上特别多时不会一次性把结果全塞进内存，适合处理日志文件这类场景。配合 `finditer` 你还能拿到每个匹配的捕获组、命名组、原串上下文，做更精细的处理。

### 2.5 match 对象：group / groups / span / start / end

前面四个查找函数里，`match`、`search`、`finditer` 都返回 match 对象（`re.Match`）。match 对象是"一次成功匹配的完整快照"，你从它身上能取到：匹配到的文本、每个捕获组的文本、各组的起止下标、原字符串本身。

**核心方法一览**：

| 方法/属性 | 作用 |
|-----------|------|
| `m.group(n=0)` | 取第 n 组文本，`0` 表示整匹配；可传多个组号返回元组 |
| `m.group(name)` | 取命名组的文本 |
| `m.groups(default=None)` | 返回所有捕获组（不含整匹配）的元组 |
| `m.groupdict(default=None)` | 返回所有命名组的字典 |
| `m.span(n=0)` | 返回第 n 组的 `(start, end)` 元组 |
| `m.start(n=0)` | 第 n 组的起始下标 |
| `m.end(n=0)` | 第 n 组的结束下标 |
| `m.string` | 原目标字符串 |
| `m.re` | 编译此 match 的 pattern 对象 |
| `m[0]`、`m[1]` | 等价于 `m.group(0)`、`m.group(1)` |

逐个演示：

```python
import re

text = "2025-07-23"
m = re.match(r"(\d{4})-(\d{2})-(\d{2})", text)

# group(0) 是整匹配
print(m.group(0))   # 2025-07-23
# group(1..3) 是各捕获组
print(m.group(1), m.group(2), m.group(3))   # 2025 07 23
# 一次取多组，返回元组
print(m.group(1, 2, 3))   # ('2025', '07', '23')
# groups() 一次性拿全部组
print(m.groups())   # ('2025', '07', '23')
# 位置信息
print(m.span(0))    # (0, 10)
print(m.span(1))    # (0, 4)
print(m.start(2), m.end(2))   # 5 7
# 原串与 pattern
print(m.string)     # 2025-07-23
print(m.re.pattern) # (\d{4})-(\d{2})-(\d{2})
# 输出:
# 2025-07-23
# 2025 07 23
# ('2025', '07', '23')
# ('2025', '07', '23')
# (0, 10)
# (0, 4)
# 5 7
# 2025-07-23
# (\d{4})-(\d{2})-(\d{2})
```

**命名组**让捕获组有名字，可读性远胜裸数字编号：

```python
import re

m = re.match(r"(?P<year>\d{4})-(?P<month>\d{2})-(?P<day>\d{2})", "2025-07-23")
print(m.group("year"), m.group("month"), m.group("day"))
print(m.groupdict())
# 输出:
# 2025 07 23
# {'year': '2025', 'month': '07', 'day': '23'}
```

命名组的写法是 `(?P<名字>子模式)`，取值用 `m.group("名字")`，`m.groupdict()` 一次性把所有命名组按名字存进字典。命名组同时仍保留数字编号，`m.group(1)` 也能取到 year。

**最大的运行时陷阱：匹配为 None 时调 group 会抛异常。**

```python
import re

m = re.search(r"\d+", "abc")   # 没数字，返回 None
print(m.group())  # AttributeError: 'NoneType' object has no attribute 'group'
```

只要查找函数可能返回 `None`，就必须先判断再取 group。规范写法：

```python
import re

m = re.search(r"\d+", "abc")
if m:                      # 或 if m is not None:
    print(m.group())
else:
    print("无匹配")
# 输出: 无匹配
```

这一条在第 3 章最佳实践里会反复强调，因为它是正则相关代码崩线上最常见的根因之一。

### 2.6 re.sub：替换

`re.sub(pattern, repl, string, count=0, flags=0)` 是"找到 + 换掉"。它扫描 `string`，把所有（或前 `count` 个）匹配 `pattern` 的子串替换为 `repl`，返回替换后的新字符串。

```
re.sub(pattern, repl, string, count=0, flags=0) -> str
```

- `repl` 可以是字符串，也可以是函数。
  - 字符串：支持反斜杠引用捕获组，如 `\1`、`\g<name>`。
  - 函数：对每个匹配调用一次，入参是 match 对象，返回值作为替换文本。
- `count`：最多替换多少处，默认 0 表示全部。

**简单替换：脱敏手机号。**

```python
import re

msg = "联系我: 13800138000 或 13900139000"
masked = re.sub(r"(1[3-9]\d)\d{4}(\d{4})", r"\1****\2", msg)
print(masked)
# 输出: 联系我: 138****8000 或 139****9000
```

pattern 用两个捕获组分别圈住前 3 位和后 4 位，`repl` 里的 `\1` 和 `\2` 引用它们，中间塞 `****`。`\g<1>` 是等价但更清晰的写法（避免 `\1` 与后续数字粘连歧义）：

```python
import re
print(re.sub(r"(1[3-9]\d)\d{4}(\d{4})", r"\g<1>****\g<2>", "13800138000"))
# 输出: 138****8000
```

**函数替换：模板变量插值。**

```python
import re

template = "你好 {name}，订单 {order_id} 已发货。"
context = {"name": "张三", "order_id": "A20250723-01"}

def render(m):
    key = m.group(1)
    return context.get(key, m.group(0))   # 找不到 key 就保留原占位符

result = re.sub(r"\{(\w+)\}", render, template)
print(result)
# 输出: 你好 张三，订单 A20250723-01 已发货。
```

pattern `\{(\w+)\}` 匹配 `{变量名}`，捕获组圈住变量名。`repl` 是 `render` 函数：每个匹配调一次，`m.group(1)` 是变量名，去 `context` 取值；取不到就原样保留占位符（`m.group(0)` 是整段匹配，如 `{unknown}`）。函数替换比字符串替换灵活得多，能处理任意复杂的替换逻辑。

**count 限定替换次数。**

```python
import re
s = "a-b-c-d"
print(re.sub(r"-", "/", s))        # 全替换
print(re.sub(r"-", "/", s, count=2))  # 只换前 2 处
# 输出:
# a/b/c/d
# a/b/c-d
```

**subn 返回替换次数。** `re.subn` 与 `sub` 完全一致，只多返回一个替换计数：

```python
import re
new, n = re.subn(r"-", "/", "a-b-c-d")
print(new, n)
# 输出: a/b/c/d 3
```

### 2.7 re.split：分割

`re.split(pattern, string, maxsplit=0, flags=0)` 用 pattern 作为分隔符切分字符串，返回字符串列表。比 `str.split` 强在：分隔符可以是任意正则模式，而不只是固定字符。

```
re.split(pattern, string, maxsplit=0, flags=0) -> list[str]
```

```python
import re

# 用连续的空白/逗号/分号分割，str.split 做不到这种"混合分隔符"
parts = re.split(r"[,;\s]+", "a, b;; c   d")
print(parts)
# 输出: ['a', 'b', 'c', 'd']
```

**捕获组会被保留在结果里。** 这是 `re.split` 一个需要记住的规则：如果 pattern 里有捕获组，匹配到的分隔符文本也会作为独立元素出现在结果列表中。

```python
import re

# 无捕获组：分隔符被丢弃
print(re.split(r"\d+", "a1b22c333d"))
# 输出: ['a', 'b', 'c', 'd']

# 有捕获组：分隔符被保留
print(re.split(r"(\d+)", "a1b22c333d"))
# 输出: ['a', '1', 'b', '22', 'c', '333', 'd']
```

这个特性在做"按分隔符切分同时保留分隔符"时很有用，例如解析带分隔标记的文本流。如果想分组又不想要分隔符进结果，用非捕获组 `(?:...)`。

**maxsplit 限制切分次数。**

```python
import re
# 只在第一个分隔符处切，其余保留
print(re.split(r"-", "a-b-c-d", maxsplit=1))
# 输出: ['a', 'b-c-d']
```

**空匹配的 split 行为**：从 Python 3.7 起，`re.split` 能处理空匹配（之前会报错），规则是空匹配产生的分割会按字符推进。这个边角行为一般不依赖，遇到再说。

### 2.8 re.compile：预编译 pattern

`re.compile(pattern, flags=0)` 把一个 pattern 字符串编译成一个正则对象（`re.Pattern`），之后可以反复调用它的 `match`、`search`、`findall` 等方法，省去每次重新编译的开销。

```
re.compile(pattern, flags=0) -> re.Pattern
compiled.match(string) / .search(string) / .findall(string) / .sub(repl, string) / ...
```

```python
import re

# 编译一次
phone_re = re.compile(r"1[3-9]\d{9}")

# 多次复用
for line in ["13800138000", "不是号码", "13900139000"]:
    m = phone_re.search(line)
    if m:
        print("hit:", m.group())
# 输出:
# hit: 13800138000
# hit: 13900139000
```

编译后的对象上挂了和 `re` 模块同名的方法，调用时少传一个 pattern 参数。

**何时该 compile？**

- 同一个 pattern 在循环里、热点路径上反复使用时，编译一次能显著提升性能——`re.search(pattern, string)` 内部也会缓存一份编译结果（`re` 维护一个 pattern 缓存），但显式 compile 更明确、更可控，且不受缓存淘汰影响。
- pattern 较复杂、编译耗时时，compile 收益更大。
- 想给 pattern 绑定 flags 又不想每次调用都传时，compile 时传一次即可。

**可读性收益**：把 pattern 命名成一个对象，相当于给它起了个"语义名字"。`phone_re.search(line)` 比 `re.search(r"1[3-9]\d{9}", line)` 更易读，模式与用途一目了然。

```python
import re

# compile 时绑定 flags
case_insensitive_word = re.compile(r"hello", re.IGNORECASE)
print(case_insensitive_word.findall("Hello HELLO heLLo"))
# 输出: ['Hello', 'HELLO', 'heLLo']
```

编译对象的属性：`compiled.pattern`（原模式字符串）、`compiled.flags`（生效的 flags），便于调试。

### 2.9 flags：控制匹配行为

flags 是 `re` 模块里一组常量，改变正则引擎的匹配规则。最常用的几个：

| flag | 简写 | 作用 |
|------|------|------|
| `re.IGNORECASE` | `re.I` | 忽略大小写，`a` 匹配 `A` 也匹配 `a` |
| `re.DOTALL` | `re.S` | 让 `.` 匹配换行符 `\n`（默认不匹配） |
| `re.MULTILINE` | `re.M` | 让 `^`、`$` 匹配每一行的首尾，而非仅整个字符串的首尾 |
| `re.VERBOSE` | `re.X` | 允许在 pattern 里写空白和注释，提升可读性 |
| `re.ASCII` | `re.A` | 让 `\w` `\d` `\s` 等只匹配 ASCII 字符（默认匹配 Unicode） |

flags 可以用 `|` 组合，如 `re.I | re.M`。

**re.IGNORECASE：忽略大小写。**

```python
import re
print(re.findall(r"yes", "Yes YES yes", re.I))
# 输出: ['Yes', 'YES', 'yes']
```

**re.DOTALL：让 `.` 跨行。** 默认 `.` 匹配除换行外任意字符，处理多行文本时常常想让它跨行匹配整段。

```python
import re

html = "<div>\nhello\n</div>"
# 默认 . 不匹配 \n，只能匹配 <div>\nhello\n</div> 里的单行片段
print(re.search(r"<div>(.*?)</div>", html).group(1))
# 输出: \nhello\n   —— 这里其实能匹配是因为 \n 在 (.*) 之外被字面匹配
# 真正需要 . 跨行的场景：
multiline = "<div>\nline1\nline2\n</div>"
m = re.search(r"<div>(.*?)</div>", multiline, re.DOTALL)
print(repr(m.group(1)))
# 输出: '\nline1\nline2\n'
```

**re.MULTILINE：`^` `$` 跨行。** 默认 `^` 只匹配字符串最开头、`$` 只匹配最末尾（或末尾换行前）。开了 `MULTILINE`，它们匹配每一行的开头和结尾。

```python
import re

text = """line1
line2
line3"""

# 默认 ^ 只匹配整串开头
print(re.findall(r"^line\d", text))
# 输出: ['line1']

# MULTILINE 下 ^ 匹配每行开头
print(re.findall(r"^line\d", text, re.MULTILINE))
# 输出: ['line1', 'line2', 'line3']
```

**re.VERBOSE：写带注释的 pattern。** 复杂正则可读性极差，`VERBOSE` 允许在 pattern 里随意加空白（被忽略）和 `#` 注释，是写复杂正则时的救星。

```python
import re

# 校验邮箱格式的简化 pattern，用 VERBOSE 写注释
email_re = re.compile(r"""
    ^                   # 字符串开头
    [\w.+-]+            # 用户名：字母数字下划线及 . + -
    @                   # @
    [\w-]+              # 域名主体
    \.                  # 点号（需转义）
    [a-zA-Z]{2,}        # 顶级域
    $                   # 字符串结尾
""", re.VERBOSE)

print(email_re.match("user@example.com") is not None)  # True
print(email_re.match("bad-email@") is not None)        # False
# 输出:
# True
# False
```

**re.ASCII：限制预定义类只匹配 ASCII。** 默认 Python 3 的 `\w` 会匹配汉字、`à` 等 Unicode 字母。做纯英文/数字校验时可能不希望这样：

```python
import re
print(re.findall(r"\w+", "hello 世界"))           # Unicode 模式
# 输出: ['hello', '世界']
print(re.findall(r"\w+", "hello 世界", re.ASCII))  # 只匹配 ASCII
# 输出: ['hello']
```

flags 也能内嵌到 pattern 里，如 `(?i)` 等价于 `re.I`、`(?m)` 等价于 `re.M`、`(?s)` 等价于 `re.S`、`(?x)` 等价于 `re.X`，放在 pattern 开头或相应位置生效：

```python
import re
print(re.findall(r"(?i)yes", "Yes YES yes"))
# 输出: ['Yes', 'YES', 'yes']
```

### 2.10 re.fullmatch：整串完全匹配

`re.fullmatch(pattern, string, flags=0)` 是 `match` 的严格版：它要求整个字符串从头到尾完全符合 pattern，才算匹配成功。

```
re.fullmatch(pattern, string, flags=0) -> Optional[Match]
```

```python
import re

print(re.fullmatch(r"\d+", "123"))      # 匹配，整串都是数字
print(re.fullmatch(r"\d+", "123abc"))   # None，结尾有字母
print(re.fullmatch(r"\d+", " 123"))     # None，开头有空格
# 输出:
# <re.Match object; span=(0, 3), match='123'>
# None
# None
```

`fullmatch` 等价于 `re.match(r"\A" + pattern + r"\Z", string)`，但语义直白、不易写错。**做"格式校验"类需求（整串必须符合某种格式）时，优先用 `fullmatch`**，比 `match` + 手动加锚更安全。

### 2.11 原始字符串 r"" 与普通字符串写正则的区别

前面多处提到用 `r""`，这里集中讲清两者的差别，因为它是写正则时第一个、也是最常踩的坑。

Python 字符串字面量里，反斜杠是转义符：`\n` 是换行、`\t` 是 tab、`\b` 是退格（`\x08`）。正则里反斜杠是元字符：`\d` 是数字类、`\b` 是单词边界、`\1` 是反向引用。两套规则共用同一个反斜杠，冲突不可避免。

**普通字符串写正则的陷阱**：

```python
import re

# 想匹配单词边界 \b，但用了普通字符串
# "\b" 在普通字符串里是退格符 \x08，不是单词边界！
pattern_wrong = "\bword\b"
print(repr(pattern_wrong))   # 看到实际是什么
# 输出: '\x08word\x08'

# 引擎拿到的是退格符，匹配不到 "word" 的边界
print(re.findall(pattern_wrong, "a word here"))
# 输出: []
```

`\x08` 不是单词边界，正则引擎找不到匹配。用原始字符串就对了：

```python
import re
pattern_right = r"\bword\b"      # r"" 里 \b 原样保留给 re
print(repr(pattern_right))
# 输出: '\\bword\\b'
print(re.findall(pattern_right, "a word here"))
# 输出: ['word']
```

**`\d` `\w` `\s` 为什么在普通字符串里"看起来没事"？** 因为它们不是合法的 Python 转义序列，Python 在解析普通字符串时会保留反斜杠原样（带个 DeprecationWarning），所以 `"\d"` 和 `r"\d"` 实际内容碰巧一样。但这是"碰巧"，`"\b"`、`"\1"`、`"\12"`（八进制转义）一类就会真出问题。所以规则是：**写正则一律用 `r""`**，不要依赖"碰巧没事"。

**反斜杠数量对比表**：

| 你想要的正则 | 普通字符串写法 | 原始字符串写法 |
|--------------|----------------|----------------|
| `\d` | `"\\d"` 或 `"\d"`（碰巧） | `r"\d"` |
| `\b`（单词边界） | `"\\b"` | `r"\b"` |
| `\1`（反向引用） | `"\\1"` | `r"\1"` |
| `\\`（字面反斜杠） | `"\\\\"` | `r"\\"` |

最后一行最直观：想匹配一个字面反斜杠，正则要写 `\\`（两个反斜杠转义出一个），普通字符串要把每个反斜杠再翻倍变成 `\\\\`（四个），原始字符串只需 `r"\\"`（两个）。差距一目了然。

### 2.12 贪婪与非贪婪（懒惰）量词

量词（`*` `+` `?` `{n,m}`）默认是"贪婪"的——尽可能多地匹配。在后面加 `?` 变成"非贪婪"（也叫懒惰），尽可能少地匹配。

| 贪婪 | 非贪婪 | 含义 |
|------|--------|------|
| `*` | `*?` | 0 次或多次 / 尽可能少 |
| `+` | `+?` | 1 次或多次 / 尽可能少 |
| `?` | `??` | 0 或 1 次 / 尽可能少 |
| `{n,m}` | `{n,m}?` | n 到 m 次 / 尽可能少 |

**贪婪的典型坑：提取 HTML 标签内容。**

```python
import re

html = "<b>粗体1</b> 普通 <b>粗体2</b>"

# 贪婪：.* 会一直吃到最后一个 </b> 前面
greedy = re.findall(r"<b>(.*)</b>", html)
print(greedy)
# 输出: ['粗体1</b> 普通 <b>粗体2']

# 非贪婪：.*? 遇到第一个 </b> 就停
lazy = re.findall(r"<b>(.*?)</b>", html)
print(lazy)
# 输出: ['粗体1', '粗体2']
```

贪婪版 `(.*)` 把中间那段 `粗体1</b> 普通 <b>粗体2` 全吞了，因为 `.*` 会一直往后吃直到最后一个 `</b>` 能让整模式匹配成功。非贪婪版 `(.*?)` 一遇到第一个 `</b>` 就满足、停止，所以能逐个提取。

**何时用非贪婪？** 当你希望匹配在"第一个能结束的地方"就结束，而不是"最后一个还能继续的地方"才结束。提取引号字符串、提取标签内容、分割配对标记，通常都要非贪婪。

```python
import re
# 提取双引号字符串
s = 'name="Tom" age="18"'
print(re.findall(r'"(.*?)"', s))
# 输出: ['Tom', '18']

# 用贪婪就错了：
print(re.findall(r'"(.*)"', s))
# 输出: ['Tom" age="18']
```

非贪婪并非永远正确——它只是"尽量短"。在需要精确控制长度时，用具体的量词 `{n,m}` 或字符类边界更可靠。第 4 章会从回溯角度解释两种模式对性能的不同影响。

### 2.13 常用正则速查

把本篇涉及的正则元字符集中列一次，方便查阅。

| 元字符 | 含义 |
|--------|------|
| `.` | 除换行外任意字符（DOTALL 下含换行） |
| `\d` / `\D` | 数字 / 非数字 |
| `\w` / `\W` | 单词字符（字母数字下划线）/ 非单词字符 |
| `\s` / `\S` | 空白 / 非空白 |
| `\b` / `\B` | 单词边界 / 非边界 |
| `^` / `$` | 行/串开头 / 行/串结尾（MULTILINE 影响行为） |
| `\A` / `\Z` | 字符串绝对开头 / 绝对结尾 |
| `*` | 0 次或多次 |
| `+` | 1 次或多次 |
| `?` | 0 或 1 次 |
| `{n}` / `{n,m}` | 恰好 n 次 / n 到 m 次 |
| `[...]` | 字符类 |
| `(...)` | 捕获组 |
| `(?:...)` | 非捕获组 |
| `(?P<name>...)` | 命名捕获组 |
| `(?=...)` / `(?!...)` | 正向 / 负向先行断言 |
| `(?<=...)` / `(?<!...)` | 正向 / 负向后行断言 |
| `a\|b` | 或 |

本篇聚焦查找函数，这些元字符只作速查，断言、反向引用等细节留后续篇章。

---

## 3. 最佳实践

### 3.1 永远先判 None 再取 group

这是正则代码"上生产"前必须刻进肌肉记忆的规则。`match`、`search` 在没匹配时返回 `None`，对 `None` 调 `group` 直接抛 `AttributeError`，崩线。

```python
# 不推荐：未判空，匹配失败即崩
m = re.search(r"\d+", text)
print(m.group())   # text 无数字时崩

# 推荐：先判断
m = re.search(r"\d+", text)
if m:
    print(m.group())
else:
    print("无数字")
```

`findall` 和 `finditer` 不返回 `None`（前者返回空列表，后者返回空迭代器），无需判 None，但仍要处理"没匹配到任何东西"的逻辑分支。

### 3.2 一律用 r"" 写 pattern

不要在正则里混用普通字符串。即使用 `\d` 这种"碰巧没事"的情况，也用 `r"\d"`，保持一致性、避免 `\b` `\1` 这类碰巧出事。

```python
# 不推荐
re.search("\d{4}-\d{2}-\d{2}", date_str)

# 推荐
re.search(r"\d{4}-\d{2}-\d{2}", date_str)
```

### 3.3 校验整串用 fullmatch，不要用 match

`match` 只锁开头，做格式校验时极易漏过"前缀合法、后缀非法"的输入。`fullmatch` 锁首尾，语义明确。

```python
# 不推荐：123abc 会被判为 True
is_digit = re.match(r"\d+", s) is not None

# 推荐
is_digit = re.fullmatch(r"\d+", s) is not None
```

### 3.4 复用 pattern 要 compile

循环里、高频调用路径上的 pattern，编译一次复用，避免反复编译与缓存抖动。

```python
# 不推荐：循环里反复传 pattern 字符串
for line in lines:
    m = re.search(r"\d{4}-\d{2}-\d{2}", line)

# 推荐
DATE_RE = re.compile(r"\d{4}-\d{2}-\d{2}")
for line in lines:
    m = DATE_RE.search(line)
```

把编译后的 pattern 放到模块级常量，既复用又自带"语义命名"。

### 3.5 复杂正则用 VERBOSE 加注释

一个长到几十字符的正则，三天后你自己都看不懂。用 `re.VERBOSE` 拆行加注释，可读性天差地别。

```python
# 不推荐：一行天书
re.match(r"^(?:\+86)?1[3-9]\d{9}$", phone)

# 推荐：拆开注释
PHONE_RE = re.compile(r"""
    \A
    (?:\+86)?       # 可选的 +86 国际区号
    1[3-9]\d{9}     # 大陆手机号
    \Z
""", re.VERBOSE)
```

### 3.6 能用字符类和锚定就不要用 .* 

`.*` 是"匹配任意内容"的万金油，但它也是回溯的万恶之源——引擎会不断尝试扩展再回退，在大字符串上极慢。能用具体字符类（如 `[^<]+` 匹配到下一个 `<` 之前）就别用 `.*`，能让引擎更精准地停。

```python
# 不推荐：.* 让引擎多吃再吐
re.search(r'<a href="(.*)">', html)

# 推荐：用 [^"] 限定到下一个引号，精准停
re.search(r'<a href="([^"]+)">', html)
```

### 3.7 提取数据优先用非捕获组控制 findall 返回值

`findall` 的返回值随捕获组数量变化，是常见困惑源。当你只想提取整段匹配文本时，用 `(?:...)` 而非 `(...)`，避免返回值莫名变成元组列表。

```python
# 不推荐：意外引入捕获组，findall 返回元组列表
re.findall(r"(\d+)\.(\d+)\.(\d+)\.(\d+)", log)

# 只想要整段 IP：用非捕获组
re.findall(r"\d+(?:\.\d+){3}", log)
```

### 3.8 警惕 ReDoS：别在用户输入上跑复杂正则

正则引擎对某些"病态"pattern + 输入会触发指数级回溯（见第 4 章），表现为一条正则把 CPU 跑满、请求超时。规则：

- 不要把复杂正则直接用在不可信输入上（用户提交的字符串、网络抓取的 HTML）。
- 避免嵌套量词如 `(a+)+`、`(a*)*`，它是回溯爆炸的典型结构。
- 给 `re` 调用加超时或放到独立线程/进程里，限制最坏影响。
- Python 3.11+ 的 `re` 在某些场景有内部优化，但不能消除所有病态回溯。

### 3.9 字符串方法能做就别上正则

正则强大但慢、且易错。能用 `str.startswith`、`str.split`、`in`、`str.replace` 解决的，别动用 `re`。正则的定位是"模式匹配"，固定字符串操作用字符串方法更快更清晰。

```python
# 不推荐：用正则判前缀
if re.match(r"https://", url):
    ...

# 推荐
if url.startswith("https://"):
    ...
```

### 3.10 优先用命名组提高可读性

裸数字组 `group(1) group(2) group(3)` 在 pattern 调整后编号会错位，维护痛苦。命名组 `(?P<name>…)` 用名字取值，语义清晰、抗改动。

```python
# 不推荐
m = re.match(r"(\d{4})-(\d{2})-(\d{2})", s)
year = m.group(1)

# 推荐
m = re.match(r"(?P<year>\d{4})-(?P<month>\d{2})-(?P<day>\d{2})", s)
year = m.group("year")
```

---

## 4. 原理

### 4.1 正则引擎如何工作：NFA 与回溯

正则引擎大致分两类：DFA（确定性有限自动机）和 NFA（非确定性有限自动机）。Python 的 `re` 模块（以及 PCRE、Java、JavaScript、.NET 等）使用的是**回溯型 NFA**。理解回溯，是理解 `match`/`search`/`findall` 行为、性能、乃至 ReDoS 的关键。

**NFA 与 DFA 的区别**：DFA 在每一步根据当前状态和输入字符能确定唯一下一个状态，匹配时间是线性的 O(n)，但能表达的正则特性受限（不支持反向引用、捕获组等）。NFA 在某一步可能有多个候选下一个状态，引擎需要"尝试一条路，走不通就退回来换另一条"——这就是回溯。回溯型 NFA 功能强（支持反向引用、零宽断言），但最坏情况时间复杂度可能是指数级。

**编译做了什么**：`re.compile(pattern)` 把 pattern 字符串解析成一棵语法树，再转换成一个 NFA 状态机对象（内部是 C 实现的 `SRE` 机器码式的指令序列）。这个状态机对象就是 `re.Pattern`。之后每次 `search`/`match` 都是在这个状态机上跑字符串，不必重新解析 pattern 字符串。这也是 compile 复用能提速的根本原因：省掉"字符串解析 + 状态机构造"，直接进入"状态机运行"。

### 4.2 回溯的具体过程

用一个具体例子看回溯。pattern `a\w+b` 在字符串 `axc` 上匹配（`\w+` 匹配字母数字下划线，一次或多次）：

1. `a` 匹配位置 0 的 `a`，成功，状态前进。
2. `\w+` 是贪婪量词，尽可能多吃。它吃掉位置 1 的 `x`，还想吃，但位置 2 是 `c`……不对，`c` 也是 `\w`，继续吃。吃掉位置 2 的 `c`，到位置 3（字符串末尾）。
3. 接下来要匹配 `b`，但字符串已经没了。回溯：`\w+` 吐回一个字符，退到位置 2（只匹配了 `x`，当前停在 `c`）。
4. 尝试匹配 `b`，位置 2 是 `c`，不匹配。再回溯：`\w+` 再吐，但它至少要匹配 1 个，已经退到只剩 `x`，不能再吐。匹配失败。

整个过程引擎试了两条路："匹配 xc" 和 "只匹配 x"，都不行。这就是回溯——走不通就退一步换条路。

**贪婪量词的回溯策略**：先尽量多吃，失败时从右往左逐个吐。

**非贪婪量词的回溯策略**：先尽量少吃（只匹配 1 个），失败时逐个多吃。所以 `a\w+?b` 在 `axxb` 上：先 `\w+?` 只匹配 `x`，试 `b` 不行；多吃一个匹配 `xx`，试 `b` 成功。

### 4.3 match 与 search 的起点差异：引擎层面

从引擎角度看，两者的区别就是"从哪个位置开始尝试 NFA"。

- `re.match(pattern, string)`：直接把 NFA 的起点对准字符串下标 0，运行一次。不扫前缀。
- `re.search(pattern, string)`：从下标 0 开始，把 NFA 跑一次；如果失败，整体后移一位，从下标 1 再跑一次；如此循环，直到某次成功或到字符串末尾。

所以 `search` 最坏情况下要在 n 个位置各跑一次 NFA，而 `match` 只跑一次。这也是 `match` 略快、且 `match` 等价于"`search` 带隐式 `^`"的引擎层面解释。

`findall` 和 `finditer` 则是：成功匹配一次后，从匹配结束处继续 `search`，重复直到字符串末尾。它们共享 `search` 的起点扫描逻辑，只是把"找一次"扩展成"找全部"。

### 4.4 findall 返回值为什么随捕获组变化

`findall` 的返回值规则（无组返回字符串、有组返回元组列表）不是任意的 API 设计，而是 NFA 捕获机制的直接体现。

回溯型 NFA 在运行时维护一组"捕获寄存器"，每个捕获组 `(…)` 对应一对寄存器，记录该组在当前匹配中实际捕获到的起止位置。一次匹配跑完后，这些寄存器存着各组的捕获结果。

- 当 pattern 无捕获组时，引擎只记录整匹配（`group(0)`）的起止位置。`findall` 把每次整匹配的文本塞进列表返回——所以是字符串列表。
- 当 pattern 有捕获组时，引擎额外记录每个组的捕获。`findall` 的设计选择是：既然你用括号"圈出了关心的子部分"，就把这些子部分作为每次匹配的代表返回。一个组返回字符串，多个组返回元组。
- 非捕获组 `(?:…)` 不分配捕获寄存器，所以不影响返回值——这是它"非捕获"的本质含义。

`finditer` 返回 match 对象而不是裸字符串，正是因为 match 对象身上挂着完整的捕获寄存器结果，调用方可以自由取 `group(0)`、`group(1)` 或 `span()`，信息无损。

### 4.5 回溯爆炸与 ReDoS

前面说回溯型 NFA 最坏情况是指数级。这个"最坏情况"不只是理论——它是真实的安全风险，称作 **ReDoS**（Regular Expression Denial of Service）。

**典型病态结构**：嵌套量词，如 `(a+)+`、`(a*)*`、`(a|a)*`。配上精心构造的输入（如 `a` 重复很多次后跟一个不匹配的字符），引擎会尝试指数级数量的回溯路径。

具体看 `(a+)+` 匹配 `aaaaaaaaaaaaaaaaaaaaaaa!`（24 个 a 加一个感叹号）：

- 外层 `+` 让 `(a+)+` 尝试把整个 a 串作为一个段，失败。
- 引擎回溯：把最后那个 a 拆成单独一段，再试，仍失败。
- 再回溯：拆成不同分段组合，每一种都试。
- 24 个 a 的分段方式有 2^23 种左右，引擎会近乎全部尝试，CPU 直接打满。

`re` 模块对此没有根本性防护——它不会自动检测病态 pattern。缓解手段：

- **避免嵌套量词**：`(a+)+`、`(a*)*b` 这类结构能改写就改写。`(a+)+` 在绝大多数语境下等价于 `a+`。
- **用占有量词或原子组**（简提）：标准 `re` 模块对占有量词 `(?>…)`、`(?>a+)` 等支持有限，`regex` 第三方库提供更完整的占有量词 `(a++)` 和原子组支持，能禁止回溯、杜绝对应路径的爆炸。在 ReDoS 敏感场景可考虑改用 `regex`。
- **限制输入长度**：对用户输入预先做长度/字符集限制，不让"病态输入"有机会喂给复杂正则。
- **加超时/隔离**：把不可信输入上的正则放到独立线程/进程，配超时，最坏情况下杀掉而不是拖垮主服务。
- **静态分析**：一些工具（如 `safe-regex`、 Reflex）能静态检测 pattern 是否存在病态回溯风险，CI 里可接入。

Python 3.11 对 `re` 做了一些内部优化（如对简单 pattern 的快速路径），但回溯爆炸的根本机制未变。生产代码里务必对"正则 + 不可信输入"保持警惕。

### 4.6 flags 的引擎影响

flags 不是单纯的"API 开关"，它们实质改变 NFA 的状态转移规则：

- `re.IGNORECASE`：字符比较时加入大小写等价判断（用 Unicode 大小写折叠），状态机的字符匹配分支增多。
- `re.DOTALL`：改变 `.` 元字符的字符集，从"除 `\n` 外任意字符"变成"任意字符"。这是对 `.` 转移规则的修改。
- `re.MULTILINE`：改变 `^` `$` 的锚定语义，让它们在每行边界都触发，而非只在整个字符串边界。这是对锚定断言的修改。
- `re.VERBOSE`：这个比较特殊，它影响的是 pattern 的解析阶段——编译时忽略空白和 `#` 注释，不影响已编译状态机的运行行为。
- `re.ASCII`：改变 `\w` `\d` `\s` 等预定义字符类的字符集范围，从 Unicode 缩到 ASCII。

flags 在 `compile` 阶段就融入了状态机，所以编译后的对象运行时不再需要每次判断 flag——这也是 compile 能绑 flags 的原因。

### 4.7 `re` 内部的 pattern 缓存

即使你不显式 `compile`，`re.search(pattern, …)` 内部也会缓存最近编译的 pattern 对象（CPython 实现里是一个 LRU 式缓存，容量默认 512）。同一 pattern 字符串反复调用 `re.search`，第二次起实际是复用缓存里的编译对象，不会重复编译。

所以"compile 复用"的性能收益主要在两种场景：一是 pattern 数量很多、超过缓存容量导致反复淘汰重编译；二是你想明确控制生命周期、或给 pattern 绑定 flags 和名字提高可读性。对少量 pattern 的偶尔调用，`re.search(pattern, …)` 的开销与 compile 后调用几乎无差。

---

## 5. 总结

### 5.1 本文内容要点

- `re.match` 只从字符串开头匹配一次，不等于整体匹配；要整体匹配加 `\A\Z` 或用 `re.fullmatch`。
- `re.search` 扫描全串，返回第一个匹配的 match 对象；`match` 等价于带隐式 `^` 的 `search`。
- `re.findall` 返回全部非重叠匹配，返回值形态随捕获组数量变化：无组返回字符串列表、有组返回元组列表；用 `(?:…)` 非捕获组可避免影响返回值。
- `re.finditer` 返回 match 对象迭代器，保留位置信息和捕获组，惰性求值适合大文本。
- match 对象的核心方法：`group`/`groups`/`groupdict`/`span`/`start`/`end`，命名组 `(?P<name>…)` 提升可读性。
- `re.sub` 支持字符串替换（`\1` 引用捕获组）和函数替换（match 对象入参）；`subn` 多返回替换次数。
- `re.split` 用正则做分隔符，捕获组会被保留进结果。
- `re.compile` 预编译 pattern 复用，提升性能、绑定 flags、命名 pattern。
- flags：`IGNORECASE` 忽略大小写、`DOTALL` 让 `.` 跨行、`MULTILINE` 让 `^$` 跨行、`VERBOSE` 支持注释、`ASCII` 限制预定义类范围。
- 一律用 `r""` 原始字符串写 pattern，避免反斜杠转义陷阱。
- 贪婪量词 `* + ?` 尽可能多匹配，非贪婪 `*? +? ??` 尽可能少匹配，提取配对内容时通常用非贪婪。
- 原理：`re` 用回溯型 NFA，`compile` 把 pattern 编译成状态机对象，`search` 逐位置扫描而 `match` 锚定 0，`findall` 返回值形态源于 NFA 捕获寄存器，回溯爆炸是 ReDoS 的根因，需避免嵌套量词并对不可信输入保持警惕。

### 5.2 读完应能掌握

- 说清 `match`/`search`/`findall` 三者在起点、次数、返回值上的差异，并能根据需求选用。
- 解释 `match` 不等于整体匹配，能用 `fullmatch` 或锚定符正确做格式校验。
- 正确从 match 对象取 `group`/`groups`/`span`，并在调用前判 None 避免崩线。
- 写出带捕获组、命名组、非捕获组的 pattern，并预测 `findall` 的返回值形态。
- 用 `re.sub` 做字符串替换和函数替换，用 `re.split` 按复杂分隔符切分。
- 用 `re.compile` 配合 flags（`IGNORECASE`/`DOTALL`/`MULTILINE`/`VERBOSE`）写出可复用、可读的正则对象。
- 用 `r""` 原始字符串书写 pattern，说清它与普通字符串的差异。
- 区分贪婪与非贪婪量词的匹配行为，按场景选用。
- 从 NFA 回溯角度解释 `search` 的起点扫描、`findall` 返回值设计、以及 ReDoS 的成因与基本缓解方式。