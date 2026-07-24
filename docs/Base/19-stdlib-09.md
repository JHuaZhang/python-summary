---
group:
  title: 【19】标准库精讲
  order: 19
order: 9
title: 正则常用模式速查
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 本篇定位：工具速查

`re` 是 Python 标准库里最常用的文本处理模块之一。前面两篇（07 讲 `match/search/findall`，08 讲捕获组与分组）已经把正则的底层原理、函数签名、分组机制讲透了。本篇不再重复那些内容，而是把视角放到"拿到一段文本、想提点什么或验证点什么"时，**能直接抄走用的模式**。

换句话说，本篇是一张速查表（cheat sheet）。你不需要从零回想 `.` 怎么写、`\d` 是不是数字、量词贪婪回溯到底怎么走——这些在 07/08 已经讲过。本篇负责的是：把散落在脑子里的元字符、字符类、量词、边界、常用业务模式重新归拢成一份可检索的清单，每个模式都配一段能直接运行、带 `# 输出：` 的示例。

适用读者：已经读过 07/08，知道正则基本语法、知道 `re.match` 和 `re.search` 的区别，但在写业务代码时常常卡在"邮箱到底怎么匹配才合理""身份证校验位要不要自己算""HTML 能不能用正则一刀切"这些问题上。本篇的目标就是让你在这些时刻少翻一次搜索引擎。

**速查表组织方式**

本篇的"速查"体现在三层组织：

- **元字符层**：`. ^ $ * + ? {n}` 这些基本符号，给一张总表，再逐个配最小可运行示例。
- **模式层**：邮箱、URL、IPv4、手机号、身份证、日期、中文、HTML 标签、千分位数字、弱密码强度等业务场景，每个给一段可直接 `import re` 跑起来的代码，并说明模式的适用边界与局限。
- **函数层**：`re.match / search / findall / sub / split / compile` 的速查表，说明每个函数"给什么、返回什么、什么时候选哪个"。

这样组织的好处是：你既可以从"我要验证一个手机号"出发，直接跳到对应小节抄模式；也可以从"我忘了 `*?` 和 `*` 有什么区别"出发，回到元字符小节复习语义。

### 1.2 re 模块函数速查表

先给一张总表，后面 2.7 节会逐个配示例。这张表的作用是：当你不确定该用哪个函数时，一眼能看出"我要的是全量匹配、搜索、查找全部、替换还是切分"。

| 函数 | 签名要点 | 返回值 | 典型场景 |
|------|---------|--------|---------|
| `re.match(pattern, string)` | 从字符串**开头**尝试匹配 | `Match` 对象或 `None` | 校验"整行是否符合某格式" |
| `re.search(pattern, string)` | 扫描**整个**字符串找首个匹配 | `Match` 对象或 `None` | 在长文本里定位某片段 |
| `re.fullmatch(pattern, string)` | 要求**整个**字符串都被匹配 | `Match` 对象或 `None` | 严格校验，等价 `^...$` |
| `re.findall(pattern, string)` | 找出**所有**匹配 | 字符串列表（有组则返回组元组列表） | 提取所有符合条件的片段 |
| `re.finditer(pattern, string)` | 找出所有匹配 | `Match` 对象迭代器 | 需要每个匹配的位置信息时 |
| `re.sub(pattern, repl, string)` | 替换匹配到的内容 | 替换后的字符串 | 脱敏、格式化、清洗 |
| `re.subn(pattern, repl, string)` | 替换并计数 | `(新字符串, 替换次数)` | 需要知道改了几处时 |
| `re.split(pattern, string)` | 按模式切分 | 列表 | 按多种分隔符切分 |
| `re.compile(pattern)` | 预编译模式 | `Pattern` 对象 | 同一模式多次复用 |

**最小用法**

下面这段代码不展开任何业务模式，只是让这张表"活"起来——每个函数各调一次，看返回值形态：

```python
import re

text = "订单号 ORD-2024-001，金额 1200元；订单号 ORD-2024-002，金额 800元。"

# match 只看开头
m = re.match(r"ORD-\d{4}-\d{3}", text)
print(m)                       # 输出：None（开头不是 ORD，是"订单号"）

# search 在全文找第一个
m = re.search(r"ORD-\d{4}-\d{3}", text)
print(m.group())               # 输出：ORD-2024-001

# findall 找全部订单号
print(re.findall(r"ORD-\d{4}-\d{3}", text))
# 输出：['ORD-2024-001', 'ORD-2024-002']

# findall 带组时返回组的列表
print(re.findall(r"金额 (\d+)元", text))
# 输出：['1200', '800']

# sub 替换：把金额脱敏
print(re.sub(r"\d+元", "***元", text))
# 输出：订单号 ORD-2024-001，金额 ***元；订单号 ORD-2024-002，金额 ***元。

# split 按多种分隔符切分
print(re.split(r"[；，]", text))
# 输出：['订单号 ORD-2024-001', '金额 1200元', '订单号 ORD-2024-002', '金额 800元。']

# compile 预编译后复用
order_re = re.compile(r"ORD-\d{4}-\d{3}")
print(order_re.findall(text))
# 输出：['ORD-2024-001', 'ORD-2024-002']
```

这段示例覆盖了表里除 `fullmatch / finditer / subn` 之外的所有函数，后两者在 2.7 节补全。重点是记住：`match` 钉死开头、`search` 全文找首个、`findall` 全量提、`sub` 改、`split` 切。剩下的一切业务模式，都是把这张表里的函数和下面要讲的元字符/字符类拼装起来。

## 2. 核心内容

### 2.1 元字符速查表

正则的"元字符"是那些有特殊含义的符号，本身不表示字面字符。下表是 Python `re`（基于 PCRE 风格）里最常用的元字符，本篇后续小节会逐个配示例。

| 元字符 | 名称 | 语义 | 一句话记忆 |
|--------|------|------|-----------|
| `.` | 点号 | 匹配除换行符 `\n` 外任意一个字符（`re.DOTALL` 下含换行） | "任意一个" |
| `^` | 脱字符 | 匹配字符串开头（`re.MULTILINE` 下匹配每行开头） | 锚定开头 |
| `$` | 美元符 | 匹配字符串结尾（`re.MULTILINE` 下匹配每行结尾） | 锚定结尾 |
| `*` | 星号 | 前一个元素出现 0 次或多次 | "可有可无，多了也行" |
| `+` | 加号 | 前一个元素出现 1 次或多次 | "至少一次" |
| `?` | 问号 | 前一个元素出现 0 次或 1 次 | "可选" |
| `{n}` | 精确量词 | 前一个元素精确出现 n 次 | "恰好 n 次" |
| `{n,}` | 至少量词 | 前一个元素至少 n 次 | "≥ n 次" |
| `{n,m}` | 区间量词 | 前一个元素出现 n 到 m 次 | "n 到 m 次" |
| `[]` | 字符组 | 匹配方括号内任意一个字符 | "多选一" |
| `()` | 分组 | 把多个元素绑成一组，可捕获 | "打包" |
| `(?:...)` | 非捕获分组 | 分组但不捕获 | "打包但不存" |
| `|` | 竖线 | 左右任选其一 | "或" |
| `\` | 反斜杠 | 转义下一个字符，或引出预定义字符类 | "转义/引类" |

**注意几个易混点**

- `^` 在 `[]` 内部首位时表示"取反"，如 `[^0-9]` 表示非数字；在 `[]` 外才表示开头锚点。同一个符号、两种含义，看位置。
- `.` 默认不匹配 `\n`。要跨行匹配任意字符，用 `re.DOTALL` 或写 `[\s\S]`。
- `{n,m}` 之间不能有空格，`{n, m}` 会被当成字面量。
- `|` 的优先级很低，`cat|dog` 是 "cat 或 dog"，不是 "ca(t|d)og"。需要精确范围就加括号。

### 2.2 元字符逐个速查示例

下面把表里的元字符逐个用一个最小示例演示，每个示例都能直接运行、带 `# 输出：`。示例都围绕一个明确的意图，而不是 `a1` 这种占位。

**点号 `.`：匹配任意一个非换行字符**

```python
import re

# 场景：从一段日志里抓出"前缀-任意3字符-后缀"
log = "FILE-abc-DONE, FILE-xyz-DONE, FILE\nFAIL"
print(re.findall(r"FILE-.{3}-DONE", log))
# 输出：['FILE-abc-DONE', 'FILE-xyz-DONE']
# 第二行 "FILE\nFAIL" 不匹配：. 不匹配换行，且没有 -DONE 结构

# 开启 DOTALL 后 . 也匹配换行
print(re.findall(r"FILE-.{3}-DONE", log, re.DOTALL))
# 输出：['FILE-abc-DONE', 'FILE-xyz-DONE']（本例无跨行匹配，结果相同）
```

**脱字符 `^` 与美元符 `$`：锚定开头与结尾**

```python
import re

lines = ["2024-01-01 开盘", "2024-01-02收盘", "2024-01-03", " 星期天"]

# 只匹配"以日期开头"的行
for line in lines:
    if re.match(r"\d{4}-\d{2}-\d{2}", line):   # match 自带 ^ 语义
        print("日期开头：", line)
# 输出：
# 日期开头： 2024-01-01 开盘
# 日期开头： 2024-01-02收盘
# 日期开头： 2024-01-03

# 用 ^ 与 $ 要求"整行就是一个日期"
for line in lines:
    m = re.fullmatch(r"\d{4}-\d{2}-\d{2}", line)
    if m:
        print("整行是日期：", m.group())
# 输出：
# 整行是日期： 2024-01-03
```

**星号 `*`：0 次或多次**

```python
import re

# 场景：匹配一个可能带前导零的数字串，前导零可有可无
samples = ["007", "42", "", "00"]
for s in samples:
    # 0* 匹配任意多个 0，\d+ 匹配至少一位数字
    m = re.fullmatch(r"0*\d+", s)
    print(f"{s!r:>8} -> {m.group() if m else None}")
# 输出：
#    '007' -> 007
#     '42' -> 42
#      '' -> None（空串不匹配：\d+ 至少要一位）
#     '00' -> 00
```

**加号 `+`：1 次或多次**

```python
import re

# 场景：提取数字序列，至少一位
text = "a1b12c123d"
print(re.findall(r"\d+", text))
# 输出：['1', '12', '123']
```

**问号 `?`：0 次或 1 次**

```python
import re

# 场景：颜色代码，前缀 # 可有可无
colors = ["#FF0000", "00FF00", "##0000FF"]
for c in colors:
    m = re.fullmatch(r"#?[0-9A-Fa-f]{6}", c)
    print(f"{c:>10} -> {m.group() if m else None}")
# 输出：
#   #FF0000 -> #FF0000
#    00FF00 -> 00FF00
#  ##0000FF -> None（两个 #，只能匹配一个 #?）
```

**精确量词 `{n}`**

```python
import re

# 场景：严格的 4 位年份
years = ["2024", "24", "20244", "abcd"]
for y in years:
    m = re.fullmatch(r"\d{4}", y)
    print(f"{y:>6} -> {m.group() if m else None}")
# 输出：
#   2024 -> 2024
#     24 -> None
#  20244 -> None
#   abcd -> None
```

**至少量词 `{n,}`**

```python
import re

# 场景：密码至少 8 位
pwds = ["123", "12345678", "123456789012"]
for p in pwds:
    m = re.fullmatch(r"\w{8,}", p)
    print(f"{p:>12} -> {'通过' if m else '不过'}")
# 输出：
#          123 -> 不过
#     12345678 -> 通过
# 123456789012 -> 通过
```

**区间量词 `{n,m}`**

```python
import re

# 场景：用户名 3 到 16 位
users = ["ab", "abc", "valid_user_name", "this_username_is_way_too_long"]
for u in users:
    m = re.fullmatch(r"\w{3,16}", u)
    print(f"{u:>30} -> {'合法' if m else '非法'}")
# 输出：
#                              ab -> 非法
#                             abc -> 合法
#                  valid_user_name -> 合法
#       this_username_is_way_too_long -> 非法
```

**字符组 `[]`：多选一 / 范围 / 取反**

```python
import re

text = "a1 b2 c3 D4 我"

# [a-z] 小写字母
print(re.findall(r"[a-z]", text))         # 输出：['a', 'b', 'c']

# [a-zA-Z] 大小写
print(re.findall(r"[a-zA-Z]", text))       # 输出：['a', 'b', 'c', 'D']

# [^0-9] 非数字（空格和中文也算非数字）
print(re.findall(r"[^0-9]", text))         # 输出：['a', ' ', 'b', ' ', 'c', ' ', 'D', ' ', '我']

# [a-zA-Z0-9_] 等价于 \w（ASCII 模式下）
print(re.findall(r"[a-zA-Z0-9_]", text))   # 输出：['a', 'b', 'c', 'D']
```

**分组 `()` 与分支 `|`**

```python
import re

# 场景：匹配 cat、dog 或 bird 三种宠物名
pets = "我养了 cat 和 dog，还想要 bird，但不养 fish。"
print(re.findall(r"cat|dog|bird", pets))
# 输出：['cat', 'dog', 'bird']

# 用 () 限制 | 的范围
colors = "red, blue, green, redblue"
print(re.findall(r"(red|blue)green", colors))
# 输出：['blue']（"redgreen" 也在分支内但 colors 里没有）

# () 捕获：把日期的年月日分别取出
date = "2024-01-02"
m = re.match(r"(\d{4})-(\d{2})-(\d{2})", date)
print(m.groups())                          # 输出：('2024', '01', '02')
print(m.group(1), m.group(2), m.group(3))  # 输出：2024 01 02
```

**非捕获分组 `(?:...)`**

```python
import re

# 场景：想用 () 分组但不想影响 findall 返回结构
text = "price: 100USD, 200USD"
# 普通分组时 findall 只返回组
print(re.findall(r"(\d+)USD", text))       # 输出：['100', '200']

# 非捕获分组时 findall 返回整体匹配
print(re.findall(r"(?:\d+)USD", text))     # 输出：['100USD', '200USD']
```

**反斜杠 `\`：转义与引类**

```python
import re

# 场景 1：匹配字面意义的点号（. 是元字符，要转义）
print(re.findall(r"\d+\.\d+", "3.14, 42, 2.718"))
# 输出：['3.14', '2.718']

# 场景 2：匹配字面意义的问号
print(re.findall(r"你\?", "你? 你! 你?"))
# 输出：['你?', '你?']

# 场景 3：匹配路径里的反斜杠
print(re.split(r"\\", r"C:\Users\admin\docs"))
# 输出：['C:', 'Users', 'admin', 'docs']
```

### 2.3 字符类速查

字符类用 `\` 加一个字母表示一组字符，比手写 `[]` 简洁。下表是 Python `re` 里最常用的六组，两两互为补集。

| 字符类 | 含义 | 等价 `[]`（ASCII 模式） | 补集 |
|--------|------|------------------------|------|
| `\d` | 数字 | `[0-9]` | `\D` |
| `\D` | 非数字 | `[^0-9]` | `\d` |
| `\w` | 单词字符：字母、数字、下划线 | `[a-zA-Z0-9_]` | `\W` |
| `\W` | 非单词字符 | `[^a-zA-Z0-9_]` | `\w` |
| `\s` | 空白：空格、制表、换行、回车等 | `[ \t\n\r\f\v]` | `\S` |
| `\S` | 非空白 | `[^ \t\n\r\f\v]` | `\s` |

**Unicode 模式下的注意点**

Python 3 的 `re` 默认是 Unicode 模式，`\d` 会匹配全角数字、`\w` 会匹配中文。如果你只想要 ASCII 范围，加 `re.ASCII` 标志：

```python
import re

text = "abc 123 中文 ＡＢＣ １２３"

# 默认 Unicode：\w 连中文都吃
print(re.findall(r"\w+", text))
# 输出：['abc', '123', '中文', 'ＡＢＣ', '１２３']

# ASCII 模式：只认 a-z A-Z 0-9 _
print(re.findall(r"\w+", text, re.ASCII))
# 输出：['abc', '123', 'A', 'B', 'C', '123']

# 默认 Unicode：\d 连全角数字都吃
print(re.findall(r"\d+", text))
# 输出：['123', '123']（第二个是全角 １２３）

# ASCII 模式
print(re.findall(r"\d+", text, re.ASCII))
# 输出：['123']
```

这个差异经常埋坑：用 `\d` 校验手机号时，如果用户贴进来全角数字，Unicode 模式下会误判通过。处理外部输入时建议显式加 `re.ASCII`，或者在校验前先做全角转半角。

**自定义字符组 `[a-z]` 与取反**

除了预定义类，业务里更常用自定义范围：

```python
import re

# 只认小写十六进制
print(re.findall(r"[0-9a-f]+", "0xFF, 1A2b, deadBEEF"))
# 输出：['ff', '1a2b', 'dead', 'ee']

# 大小写都认
print(re.findall(r"[0-9a-fA-F]+", "0xFF, 1A2b, deadBEEF"))
# 输出：['FF', '1A2b', 'deadBEEF']

# 取反：用户名只允许字母数字下划线，看有没有非法字符
username = "my user@name"
print(re.findall(r"[^a-zA-Z0-9_]", username))
# 输出：[' ', '@']
```

### 2.4 量词：贪婪与非贪婪

量词 `* + ? {n,m}` 默认都是**贪婪**的——在能让整体匹配成功的前提下，尽可能多地吃字符。在量词后面加 `?` 变成**非贪婪**（lazy / 懒惰），即尽可能少地吃。这对 HTML/标签类抽取尤其关键。

下表是四种非贪婪形式：

| 贪婪 | 非贪婪 | 语义差异 |
|------|--------|---------|
| `*` | `*?` | 0+ 次，非贪婪时尽量少 |
| `+` | `+?` | 1+ 次，非贪婪时尽量少 |
| `?` | `??` | 0 或 1 次，非贪婪时优先 0 |
| `{n,m}` | `{n,m}?` | n 到 m 次，非贪婪时取下界 |

**贪婪 vs 非贪婪对比示例**

这是理解正则回溯最直观的例子：

```python
import re

html = '<div>第一段</div><div>第二段</div>'

# 贪婪：.* 尽可能多，一直吃到最后一个 >
print(re.findall(r"<div>.*</div>", html))
# 输出：['<div>第一段</div><div>第二段</div>']
# 只匹配到一次，因为 .* 把中间的 </div><div> 也吞了

# 非贪婪：.*? 一旦后面能匹配就停
print(re.findall(r"<div>.*?</div>", html))
# 输出：['<div>第一段</div>', '<div>第二段</div>']
# 匹配到两次，每次到第一个 </div> 就收手
```

**加号 `+` 的非贪婪**

```python
import re

# 场景：从"key=value;key=value"里提单组 key/value
s = "name=alice;age=30;city=北京"

# 贪婪
print(re.findall(r"(\w+)=(.+);", s))
# 输出：[('name', 'alice;age=30')]
# .+ 吃到倒数第二个分号前，因为整体还要留一个 ; 给模式

# 非贪婪
print(re.findall(r"(\w+)=(.+?);", s))
# 输出：[('name', 'alice'), ('age', '30')]
# 更接近预期，但最后 city=北京 仍漏：它后面没有分号
```

这个例子说明：非贪婪不是万能钥匙，它只是"贪得少一点"。要稳妥地切，更该用 `[^;]+` 这种"否定字符组"来限定边界：

```python
import re

s = "name=alice;age=30;city=北京"
# 用 [^;]+ 显式声明"不含分号的任意字符"，最稳
print(re.findall(r"(\w+)=([^;]+)", s))
# 输出：[('name', 'alice'), ('age', '30'), ('city', '北京')]
```

**问号的非贪婪 `??`**

```python
import re

# 场景：协议前缀可选，但优先不匹配
urls = ["http://a.com", "a.com"]
for u in urls:
    # https??: 优先匹配 0 个 s，但只有后面能成立才加 s
    m = re.match(r"https??:", u)
    print(f"{u:>12} -> {m.group() if m else None}")
# 输出：
#  http://a.com -> http:
#         a.com -> None
```

`??` 用得很少，但能帮助理解"非贪婪 = 满足后续即可停"的本质。

### 2.5 边界与位置锚点

边界不消耗字符，它们只断言"此刻处于某种位置"，称为**零宽断言**。正则里最容易和字符类混淆的就是边界。

| 锚点 | 含义 | 零宽 |
|------|------|------|
| `^` | 字符串开头（`re.MULTILINE` 下每行开头） | 是 |
| `$` | 字符串结尾（`re.MULTILINE` 下每行结尾） | 是 |
| `\b` | 单词边界：`\w` 与 `\W` 的交界处 | 是 |
| `\B` | 非单词边界 | 是 |
| `\A` | 字符串开头（不受 `MULTILINE` 影响） | 是 |
| `\Z` | 字符串结尾（不受 `MULTILINE` 影响） | 是 |

**`\b` 单词边界示例**

`\b` 的定义是：一侧是 `\w`（字母数字下划线），另一侧不是。它不消耗任何字符，常用于"整词匹配"。

```python
import re

text = "cat catalog catch a cat."

# 不加边界：连 catalog、catch 里的 cat 也被算上
print(re.findall(r"cat", text))
# 输出：['cat', 'cat', 'cat', 'cat']

# 加 \b：只匹配独立的 cat
print(re.findall(r"\bcat\b", text))
# 输出：['cat', 'cat']

# 反例：下划线是 \w，所以 user_name 里 user 后面不是边界
code = "user_name username"
# user_name 的 user 后面是下划线（\w），不是边界
# username 的 user 后面是 n（\w），也不是边界
# 两处 user 的右侧都不是 \W，所以 \buser\b 一个都匹配不到
print(re.findall(r"\buser\b", code))   # 输出：[]
# 放宽到只要求左侧边界：两处 user 的左侧（串首、空格）都是边界
print(re.findall(r"\buser", code))     # 输出：['user', 'user']
```

这段示例里有个微妙点值得多看一眼：`user_name` 里的 `user` 后面跟下划线，下划线属于 `\w`，所以这里**不是**单词边界。这就是为什么用 `\b` 切词时，带下划线的标识符会被当成一个整体词。

**`^` 和 `$` 与 `MULTILINE`**

```python
import re

text = """第一行 2024-01-01
第二行 2024-01-02
第三行 no-date"""

# 默认：^ 只匹配整个字符串开头
print(re.findall(r"^\S+行", text))
# 输出：['第一行']

# MULTILINE：^ 匹配每行开头
print(re.findall(r"^\S+行", text, re.MULTILINE))
# 输出：['第一行', '第二行', '第三行']

# 用 $ 匹配行尾的日期
print(re.findall(r"\d{4}-\d{2}-\d{2}$", text, re.MULTILINE))
# 输出：['2024-01-01', '2024-01-02']
```

### 2.6 分组与分支进阶

08 篇已详细讲过捕获组、命名组、前后向断言。本篇只给一张速查表加最小示例，方便你写模式时随手对照。

| 写法 | 名称 | 作用 |
|------|------|------|
| `(...)` | 捕获分组 | 分组并按左括号顺序编号捕获 |
| `(?:...)` | 非捕获分组 | 分组但不捕获，不影响 `findall` 返回结构 |
| `(?P<name>...)` | 命名捕获 | 按名字取组，`m.group("name")` |
| `(?P=name)` | 命名反向引用 | 在同一模式里引用已命名组 |
| `\1` `\2` | 编号反向引用 | 引用第 n 个捕获组匹配到的内容 |
| `(?=...)` | 正向先行断言 | 右侧必须匹配（零宽，不消耗） |
| `(?!...)` | 负向先行断言 | 右侧必须不匹配（零宽） |
| `(?<=...)` | 正向后行断言 | 左侧必须匹配（零宽） |
| `(?<!...)` | 负向后行断言 | 左侧必须不匹配（零宽） |

**命名组与反向引用**

```python
import re

# 命名组：解析 KV 对
m = re.search(r"(?P<key>\w+)=(?P<value>\w+)", "port=8080")
print(m.group("key"), m.group("value"))   # 输出：port 8080

# 反向引用：找连续重复词
text = "the the quick brown fox fox jumped"
print(re.findall(r"\b(\w+)\s+\1\b", text))
# 输出：['the', 'fox']
```

**先行/后行断言（零宽）**

```python
import re

# 正向先行：数字后面必须跟着元
text = "金额100元，数量200件，预算300元"
print(re.findall(r"\d+(?=元)", text))
# 输出：['100', '300']

# 负向先行：数字后面不能是元
print(re.findall(r"\d+(?!元)", text))
# 输出：['200']（但实际可能含 '10' '30'，因 \d+ 贪婪……见下）

# 正向后行：前面必须是金额二字
print(re.findall(r"(?<=金额)\d+", text))
# 输出：['100']
```

负向先行那个示例要小心：`\d+(?!元)` 在"金额100元"里会匹配出"10"（因为"10"后面是"0"不是"元"），这是贪婪与断言交互导致的经典陷阱。要严格"整段数字后不跟元"，应该用 `(?:\d+)(?!元)` 配合边界，或干脆先 `findall(r"\d+元?")` 再过滤。本篇不展开，08 篇有专题。

### 2.7 常用业务模式速查

这是本篇的核心。下面每个小节聚焦一个业务场景，给出可直接运行的模式、示例输出、以及模式适用边界。**没有一个模式是万能的**，每个都注明了它在什么场景下够用、什么场景下会翻车。

#### 2.7.1 邮箱

**模式**

```python
import re

# 简易邮箱：本地部分允许字母数字点下划线减号，@ 后至少两段域名
email_re = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")

samples = [
    "alice@example.com",         # 标准
    "bob+tag@sub.example.co.uk", # 带加号、子域、多级 TLD
    "not-an-email",              # 无 @
    "@no-local.com",             # 无本地部分
    "space in@local.com",        # 含空格
    "中文@例子.com",              # 中文域
]

for s in samples:
    m = email_re.fullmatch(s)
    print(f"{s:>26} -> {'通过' if m else '驳回'}")
# 输出：
#        alice@example.com -> 通过
#  bob+tag@sub.example.co.uk -> 通过
#               not-an-email -> 驳回
#            @no-local.com -> 驳回（本地部分要求至少一字符，fullmatch 下被拦）
#          space in@local.com -> 驳回（空格不在字符集）
#               中文@例子.com -> 驳回（默认 ASCII 字符集不含中文）
```

**适用边界**

- 够用场景：表单初筛、从文本里提邮箱字符串、内部系统校验。
- 翻车场景：RFC 5322 允许的引号、注释、IP 域名、Unicode 本地部分等，这个模式一律不认。要严格 RFC 校验，用 `email.utils.parseaddr` 或第三方库 `email-validator`。
- 常见误用：用 `.*@.*` 这种太宽松的模式，会连 `" @ "` 都通过。本地部分一定要限定字符集。

#### 2.7.2 URL

**模式**

```python
import re

# 简易 URL：可选协议、域名、可选端口、可选路径
url_re = re.compile(
    r"(?:https?://)?"             # 协议 http/https，可选
    r"(?:[\w-]+\.)+"              # 至少一段域名
    r"[a-zA-Z]{2,}"               # TLD
    r"(?::\d+)?"                  # 端口可选
    r"(?:/[^\s]*)?"               # 路径可选
)

samples = [
    "https://www.example.com",
    "http://api.example.com:8080/v1/users?id=1",
    "example.com/path",
    "ftp://files.example.com",    # ftp 不在模式内
    "not a url",
]

for s in samples:
    m = url_re.match(s)
    print(f"{s:>40} -> {m.group() if m else None}")
# 输出：
#              https://www.example.com -> https://www.example.com
# http://api.example.com:8080/v1/users?id=1 -> http://api.example.com:8080/v1/users?id=1
#                       example.com/path -> example.com/path
#               ftp://files.example.com -> files.example.com（协议被忽略，域名被提）
#                         not a url -> None
```

**适用边界**

- 够用场景：从日志里抠出疑似 URL、轻量校验。
- 翻车场景：含中文路径、含特殊字符（`#` `;`）、国际化域名（IDN）、不含 `.` 的本地地址（`localhost`）。这些要么要扩模式，要么得用 `urllib.parse.urlparse` 拆解后再逐字段校验。
- `ftp://` 那条示例揭示了正则的一个通病：模式里没显式排除，`match` 又只从头尝试，结果"抠"出了一段不完整的匹配。要严格只认 http/https，应把协议设为必选或用 `fullmatch`。

#### 2.7.3 IPv4 地址

**模式**

```python
import re

# 朴素 IPv4：4 段数字，点分
ipv4_naive = re.compile(r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}")

# 严格 IPv4：每段 0-255
ipv4_strict = re.compile(
    r"(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)"
    r"(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}"
)

samples = ["192.168.1.1", "255.255.255.255", "256.1.1.1", "10.0.0.1", "999.999.999.999"]

for s in samples:
    n = ipv4_naive.fullmatch(s)
    st = ipv4_strict.fullmatch(s)
    print(f"{s:>18}  朴素={bool(n)}  严格={bool(st)}")
# 输出：
#      192.168.1.1  朴素=True  严格=True
#  255.255.255.255  朴素=True  严格=True
#        256.1.1.1  朴素=True  严格=False
#        10.0.0.1  朴素=True  严格=True
#  999.999.999.999  朴素=True  严格=False
```

**模式拆解**

`(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)` 这一段匹配 0-255：

- `25[0-5]`：250-255
- `2[0-4]\d`：200-249
- `1\d\d`：100-199
- `[1-9]?\d`：0-99（前导 0 也允许，如 `09`）

分支顺序很重要：从大到小排，否则 `1\d\d` 会先吃掉 `255` 的前三位导致匹配错误。

**适用边界**

- 朴素版适合在日志里粗定位；严格版适合入参校验。
- IPv6 不在讨论范围，IPv6 用 `ipaddress` 模块校验最稳。
- 任何场景下，`ipaddress.ip_address(s)` 都比正则更可靠——它既能校验 v4/v6，又能直接拿到网络对象。

#### 2.7.4 手机号

**模式**

```python
import re

# 中国大陆手机号：1 开头，第二位 3-9，共 11 位
phone_re = re.compile(r"1[3-9]\d{9}")

# 带可选 +86 前缀、可选空格/横线
phone_loose = re.compile(r"(?:\+86[-\s]?)?1[3-9]\d{9}")

samples = [
    "13800138000",
    "15912345678",
    "12345678901",   # 第二位是 2，不符合
    "1380013800",    # 10 位
    "138001380001",  # 12 位
    "+86 138-0013-8000",
    "8613800138000",
]

for s in samples:
    strict = phone_re.fullmatch(s)
    loose = phone_loose.fullmatch(s)
    print(f"{s:>22}  strict={bool(strict)}  loose={bool(loose)}")
# 输出：
#           13800138000  strict=True  loose=True
#           15912345678  strict=True  loose=True
#          12345678901  strict=False  loose=False
#            1380013800  strict=False  loose=False
#          138001380001  strict=False  loose=False
#   +86 138-0013-8000  strict=False  loose=True
#          8613800138000  strict=False  loose=False
```

**适用边界**

- 模式按现行号段粗划（1[3-9]），不覆盖新增号段时会漏判，需定期更新。
- 不做校验位——手机号本身没有数学校验位，只靠号段和长度。
- 真正的入网校验得靠短信验证码，正则只负责"格式上像不像"。
- 容易踩坑：`fullmatch` 比 `match` 更合适，否则 `match` 会在 12 位号码上匹配前 11 位并返回成功，让脏数据溜过去。

#### 2.7.5 邮政编码

**模式**

```python
import re

# 中国邮政编码：6 位数字
zipcode_re = re.compile(r"[1-9]\d{5}")

samples = ["100000", "518052", "010000", "12345", "1234567"]

for s in samples:
    m = zipcode_re.fullmatch(s)
    print(f"{s:>10} -> {bool(m)}")
# 输出：
#    100000 -> True
#    518052 -> True
#    010000 -> False（首位不能是 0）
#     12345 -> False
#  1234567 -> False
```

**适用边界**

- 模式只验格式，不验"这个邮编是否真实存在"。要查真实性得用邮编数据库。
- 首位 `[1-9]` 排除前导 0，符合现行编码规则。

#### 2.7.6 身份证号

**模式**

```python
import re

# 18 位身份证：6 位地区码 + 8 位生日 + 3 位顺序 + 1 位校验（数字或 X）
id_re = re.compile(
    r"\d{6}"                                    # 地区码
    r"(?:18|19|20)\d{2}"                        # 年份 1800-2099
    r"(?:0[1-9]|1[0-2])"                        # 月
    r"(?:0[1-9]|[12]\d|3[01])"                  # 日
    r"\d{3}"                                    # 顺序码
    r"[0-9Xx]"                                  # 校验位
)

samples = [
    "11010119900101001X",   # 合法格式
    "11010119900230001X",   # 2 月 30 日，格式过但语义错
    "11010119901301001X",   # 13 月，被拦
    "11010119900101001",    # 17 位
    "1101011990010100IX",   # 顺序码含字母
]

for s in samples:
    m = id_re.fullmatch(s)
    print(f"{s:>22} -> {bool(m)}")
# 输出：
#    11010119900101001X -> True
#    11010119900230001X -> True（格式过，但 2/30 不存在）
#    11010119901301001X -> False（月份 13 被拦）
#     11010119900101001 -> False
#    1101011990010100IX -> False
```

**校验位校验**

正则只能验格式。18 位身份证最后一位是按前 17 位通过 ISO 7064 MOD 11-2 算出的校验码，要严格校验得自己算：

```python
def id_check(id18: str) -> bool:
    if not re.fullmatch(r"\d{17}[0-9Xx]", id18):
        return False
    weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
    codes = "10X98765432"
    total = sum(int(c) * w for c, w in zip(id18[:17], weights))
    return codes[total % 11] == id18[-1].upper()

print(id_check("11010119900101001X"))   # 需真实校验码才返回 True
print(id_check("110101199001010019"))   # 输出：True（用对应校验码）
```

**适用边界**

- 正则管"长什么样"，校验位管"是不是真的算出来的"，两者结合才完整。
- 15 位旧版身份证已基本退出使用，如需兼容可再加一段模式。
- 地区码是否真实存在、生日是否合法（闰月、2/30 等）都不能光靠正则，需配合字典库和 `datetime`。

#### 2.7.7 日期 yyyy-mm-dd

**模式**

```python
import re

# 朴素日期
date_naive = re.compile(r"\d{4}-\d{2}-\d{2}")

# 带月份合法性
date_month = re.compile(r"\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])")

samples = ["2024-01-01", "2024-13-01", "2024-02-30", "2024-00-10", "abcd-01-01"]

for s in samples:
    n = date_naive.fullmatch(s)
    mt = date_month.fullmatch(s)
    print(f"{s:>14}  朴素={bool(n)}  带月={bool(mt)}")
# 输出：
#     2024-01-01  朴素=True  带月=True
#     2024-13-01  朴素=True  带月=False
#     2024-02-30  朴素=True  带月=True（格式过，但 2/30 不存在）
#     2024-00-10  朴素=True  带月=False
#     abcd-01-01  朴素=False  带月=False
```

**适用边界**

- 正则无法判断闰年、大小月。`2024-02-30` 在正则里"像日期"，但 `datetime.strptime` 会直接抛 `ValueError`。
- 生产代码里推荐：先用正则粗筛格式，再用 `datetime.strptime(s, "%Y-%m-%d")` 精校。两步结合既快又准。

#### 2.7.8 中文字符

**模式**

```python
import re

# 基本汉字范围：U+4E00 - U+9FFF（最常用）
han_bmp = re.compile(r"[一-鿿]+")

# 扩展 A/B/... 也要覆盖时（更全，但仍非全 Unicode 汉字）
han_wide = re.compile(
    r"[一-鿿㐀-䶿\U00020000-\U0002a6df\U0002a700-\U0002b73f]+"
)

text = "Python 学习笔记，第 19 篇。_mix 中英混排。"

print(han_bmp.findall(text))
# 输出：['学习笔记', '第', '篇', '中英混排']

print(han_wide.findall(text))
# 输出：['学习笔记', '第', '篇', '中英混排']（本例都在基本平面）
```

**关于 `[一-龥]` 等价写法**

有人习惯写 `[一-龥]`，它等价于 `[一-龥]`，只到 U+9FA5，比 `鿿` 略窄。两者覆盖范围几乎一致，日常用都没问题，但写 `一-鿿` 更直观、范围更全一点。

**适用边界**

- 这个范围只含"汉字"本身，不含中文标点（`，。！`）和全角符号。
- 生僻字、甲骨文等超出基本平面的字符需要扩展范围，但即便 `han_wide` 也不能 100% 覆盖所有 Unicode 汉字。
- 要做中文分词、NLP，正则只够粗筛，真正切词得上 `jieba` 之类。

#### 2.7.9 HTML 标签

**模式（够用版）**

```python
import re

html = '<div class="box"><p>段落一</p><p>段落二</p></div>'

# 提取所有 <p>...</p> 内容（用非贪婪）
print(re.findall(r"<p>(.*?)</p>", html))
# 输出：['段落一', '段落二']

# 提取标签名
print(re.findall(r"<(\w+)[^>]*>", html))
# 输出：['div', 'p', 'p']

# 提取 class 属性值
print(re.findall(r'class="([^"]*)"', html))
# 输出：['box']
```

**适用边界与警告**

- 正则处理 HTML 只在"结构非常规整、范围非常小"时勉强可用。
- 翻车的典型场景：嵌套标签（`<div><div>x</div></div>` 用 `<div>.*?</div>` 只匹配到最内层）、属性含 `>`（`<a title="a>b">`）、注释 `<!-- -->`、`<script>` 内含 `</...>` 字样、自闭合 `<br/>`、CDATA 段等。
- 解析 HTML 请用 `html.parser`（标准库）或 `BeautifulSoup`（第三方）。它们用状态机解析，能正确处理嵌套和转义。
- 这条是本篇最重要的"何时不用正则"警示，详见第 3 章。

#### 2.7.10 带千分位数字

**模式**

```python
import re

# 千分位整数：从右往左每三位一个逗号
thousands_re = re.compile(r"\d{1,3}(?:,\d{3})+")

# 兼容小数
thousands_float_re = re.compile(r"\d{1,3}(?:,\d{3})+(?:\.\d+)?")

samples = ["1,234", "12,345,678", "123,45", "1,234.56", "1234"]

for s in samples:
    m = thousands_float_re.fullmatch(s)
    print(f"{s:>12} -> {bool(m)}")
# 输出：
#        1,234 -> True
#  12,345,678 -> True
#      123,45 -> False（只两位，不合千分位）
#    1,234.56 -> True
#        1234 -> False（没有逗号，不满足 (?:,\d{3})+ 至少一次）
```

**还原为数字**

```python
import re

def to_number(s: str) -> float | int:
    """把 '1,234.56' 还原成数值。"""
    if re.fullmatch(r"\d{1,3}(?:,\d{3})+", s):
        return int(s.replace(",", ""))
    if re.fullmatch(r"\d{1,3}(?:,\d{3})+(?:\.\d+)?", s):
        return float(s.replace(",", ""))
    raise ValueError(f"不是千分位数字: {s}")

print(to_number("12,345"))      # 输出：12345
print(to_number("1,234.56"))    # 输出：1234.56
```

**适用边界**

- 这是对"西方千分位"（三位一组）的模式。中文有的场景用四位一组（万、亿分隔），那需要另行处理。
- `1234` 不带逗号会被 `fullmatch` 拒绝；若你希望"可带可不带"，可把 `+` 改成 `*`，但那样会放过 `123,4567` 这种不规整写法。

#### 2.7.11 弱密码强度

正则不擅长"强度评分"这种连续判断，但能快速做"是否踩到几条红线"的离散判定。

**模式**

```python
import re

def password_strength(p: str) -> str:
    rules = {
        "长度>=8":   len(p) >= 8,
        "含小写":     bool(re.search(r"[a-z]", p)),
        "含大写":     bool(re.search(r"[A-Z]", p)),
        "含数字":     bool(re.search(r"\d", p)),
        "含符号":     bool(re.search(r"[!@#$%^&*()\-_=+]", p)),
    }
    score = sum(rules.values())
    level = ["极弱", "弱", "中", "较强", "强", "很强"][score]
    return f"{level}  规则：{rules}"

for p in ["123", "abcdefgh", "Abcdefgh", "Abcdefg1", "Abcdefg1!"]:
    print(f"{p:>12} -> {password_strength(p)}")
# 输出：
#          123 -> 极弱  规则：{'长度>=8': False, '含小写': False, '含大写': False, '含数字': True, '含符号': False}
#   abcdefgh -> 弱  规则：{'长度>=8': True, '含小写': True, '含大写': False, '含数字': False, '含符号': False}
#   Abcdefgh -> 中  规则：{'长度>=8': True, '含小写': True, '含大写': True, '含数字': False, '含符号': False}
#   Abcdefg1 -> 较强  规则：{'长度>=8': True, '含小写': True, '含大写': True, '含数字': True, '含符号': False}
#  Abcdefg1! -> 强  规则：{'长度>=8': True, '含小写': True, '含大写': True, '含数字': True, '含符号': True}
```

**适用边界**

- 这种基于规则计数的判定只防"弱密码"，不防"符合规则的坏密码"（如 `Abcdefg1!` 照样会被词典攻击命中）。
- 真正的强度评估应结合黑名单库、熵估计、用户历史，正则只承担第一道筛子。
- 一个常见的反模式是写一条几十字符的巨型正则把所有规则塞进去，可读性极差。拆成多条小正则、分别 `search` 再汇总，维护成本低得多。

### 2.8 re 函数逐一速查

2.1 节给了函数总表，这里把还没配完整示例的几个补齐。

**fullmatch：整体校验**

```python
import re

# fullmatch 要求整个字符串都被匹配，等价 ^...$ 但更直观
print(re.fullmatch(r"\d{4}-\d{2}-\d{2}", "2024-01-01"))   # 输出：<re.Match object>
print(re.fullmatch(r"\d{4}-\d{2}-\d{2}", "2024-01-01 额外"))  # 输出：None
```

做"格式校验"时，`fullmatch` 几乎总是比 `match` 更合适——`match` 只看开头，会让"后面跟一串脏字符"的输入蒙混过关。

**finditer：需要位置信息时**

```python
import re

text = "a1 b2 c3"
for m in re.finditer(r"\w\d", text):
    print(f"匹配到 {m.group()!r}，位置 {m.start()}-{m.end()}")
# 输出：
# 匹配到 'a1'，位置 0-2
# 匹配到 'b2'，位置 3-5
# 匹配到 'c3'，位置 6-8
```

`findall` 只给字符串，丢了位置；`finditer` 给 `Match` 对象，能拿到 `start/end/span`。需要高亮、定位行号时用它。

**subn：替换并计数**

```python
import re

new, n = re.subn(r"\d+", "#", "a1b2c3")
print(new, n)   # 输出：a#b#c# 3
```

**sub 配函数：动态替换**

```python
import re

# 把每个数字乘 2
text = "a1b2c3"
print(re.sub(r"\d", lambda m: str(int(m.group()) * 2), text))
# 输出：a2b4c6
```

`repl` 参数既可以传字符串，也可以传函数；函数接收 `Match` 对象，返回替换字符串。这个能力让 `sub` 远比"字符替换"强大，许多清洗逻辑都能用它一行写完。

**split 的捕获组行为**

```python
import re

# 不带组：分隔符被丢弃
print(re.split(r"\s*[,;]\s*", "a, b;c, d"))
# 输出：['a', 'b', 'c', 'd']

# 带组：分隔符保留在结果里
print(re.split(r"\s*([,;])\s*", "a, b;c, d"))
# 输出：['a', ',', 'b', ';', 'c', ',', 'd']

# 限制切分次数
print(re.split(r",", "a,b,c,d", maxsplit=2))
# 输出：['a', 'b', 'c,d']
```

**compile 的复用与标志**

```python
import re

# 预编译可在循环里复用，且能固化标志
date_re = re.compile(r"\d{4}-\d{2}-\d{2}", re.ASCII)
print(date_re.findall("2024-01-01 和 ２０２４－０１－０２"))
# 输出：['2024-01-01']（全角日期被 ASCII 模式排除）

# Pattern 对象的方法与 re 模块函数一一对应
print(date_re.search("日期 2024-01-01").group())   # 输出：2024-01-01
```

同一模式在循环或热路径上大量使用时，`compile` 能省去重复解析开销（虽然 Python 的 `re` 内部本身有缓存，但显式 `compile` 更清晰、可避免缓存被挤掉）。

## 3. 最佳实践

### 3.1 优先用专项解析器，而非正则

这是本篇最重要的实践条目。正则的强度在于"扁平、规则、线性"的文本；一旦文本带有递归结构（嵌套）或语义层级，正则就会力不从心。下表列出"常见误用正则的场景"和推荐替代：

| 场景 | 不要用正则 | 推荐工具 | 原因 |
|------|-----------|---------|------|
| 解析 HTML / XML | `<tag>.*?</tag>` | `html.parser` / `BeautifulSoup` / `lxml` | HTML 可嵌套，正则无法表达递归 |
| 解析 URL | 手写协议/域名/参数正则 | `urllib.parse.urlparse` / `urlsplit` | URL 各字段有转义规则，正则拿不稳 |
| 解析日期 | 自写年月日闰年正则 | `datetime.strptime` / `dateutil.parser` | 闰年、时区、月份天数不是正则能表达的 |
| 解析 JSON | 自写键值正则 | `json.loads` | JSON 允许字符串里含任意转义，正则会错 |
| 严格校验邮箱 | 自写全套 RFC 正则 | `email.utils.parseaddr` / `email-validator` | RFC 5322 允许的格式极其复杂 |
| 校验 IP | `\d{1,3}\.\d{1,3}...` | `ipaddress.ip_address` | 还要兼顾 IPv6、掩码、网络对象 |
| 解析 CSV | `split(",")` 或正则 | `csv` 模块 | 字段内可含引号、换行 |
| 表达式求值 | 正则切 token | `ast.literal_eval` / `pyparsing` | 数值表达式有优先级和括号嵌套 |

**原则**：正则做"格式筛查"和"线性抽取"，专项解析器做"语义解析"。两者配合，正则在前做粗筛，解析器在后做精校，通常是最省心的组合。

**典型配合示例：日期校验**

```python
import re
from datetime import datetime

def parse_date(s: str):
    # 第一步：正则粗筛格式，挡掉明显错误
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", s):
        raise ValueError(f"格式不对: {s}")
    # 第二步：strptime 精校语义，挡掉 2/30 之类
    return datetime.strptime(s, "%Y-%m-%d")

print(parse_date("2024-01-01"))   # 输出：2024-01-01 00:00:00
# parse_date("2024-02-30")        # 抛 ValueError: day is out of range for month
# parse_date("abcd-01-01")        # 抛 ValueError: 格式不对
```

正则那一步的价值在于：它把"根本不是日期格式"的输入迅速挡在 `strptime` 之外，避免 `strptime` 报出难以区分的 `ValueError`——格式错和语义错在 `strptime` 里是同一类异常，先正则筛一下能让错误定位更清晰。

### 3.2 校验用 fullmatch，抽取用 findall

最常见的函数误用是用 `match` 做校验：

```python
import re

# 反例：用 match 校验手机号
bad = re.match(r"1[3-9]\d{9}", "13800138000垃圾尾巴")
print(bool(bad))   # 输出：True —— 脏尾巴被放过了

# 正例：用 fullmatch 校验
good = re.fullmatch(r"1[3-9]\d{9}", "13800138000垃圾尾巴")
print(bool(good))  # 输出：False
```

`match` 只关心开头是否匹配，适合"判断开头是不是某种格式"。做"整个输入是否合法"的校验，几乎总应该用 `fullmatch`。抽取场景则相反，应该用 `findall / finditer`，让正则在全文里游走。

### 3.3 用原始字符串写正则

正则模式里大量的 `\`，如果用普通字符串，Python 会先把 `\b` 解释成退格符、`\d` 在新版 Python 里虽然不报错但行为不稳。**始终用 `r"..."` 原始字符串**写模式：

```python
import re

# 反例：不用原始字符串
# re.findall("\bword\b", "a word here")  # \b 变成退格，匹配不到
# 正例：
print(re.findall(r"\bword\b", "a word here"))   # 输出：['word']
```

### 3.4 复杂模式拆开、加注释

一条上百字符的正则几乎是不可维护的。两个手段：

**用 `re.VERBOSE` 加空格和注释**

```python
import re

phone_re = re.compile(r"""
    (?:\+86[-\s]?)?    # 可选 +86 前缀
    1[3-9]\d{9}        # 主体：11 位手机号
""", re.VERBOSE)

print(phone_re.fullmatch("+86 13800138000"))   # 输出：<re.Match object>
```

`re.VERBOSE` 下，模式里的空白被忽略，`#` 后到行尾是注释。复杂模式一律写成这种形式。

**拆成多条小正则**

弱密码示例（2.7.11）就是这种思路：与其写一条巨正则，不如每条规则一个小 `search`。可读、可测、可单独调整阈值。

### 3.5 预编译与标志固化

同一模式在循环、热路径、被多个函数调用时，显式 `compile` 并把标志固化进去，比反复写字符串模式更稳：

```python
import re

# 配置里反复用到的标识符校验
ident_re = re.compile(r"[A-Za-z_][A-Za-z0-9_]*", re.ASCII)

def is_valid_ident(s: str) -> bool:
    return bool(ident_re.fullmatch(s))

print(is_valid_ident("user_id"))   # 输出：True
print(is_valid_ident("1bad"))      # 输出：False
print(is_valid_ident("名前"))      # 输出：False（ASCII 模式拒中文）
```

把标志放在 `compile` 里，可以避免每次调用都重复传参，也防止漏传导致 Unicode 模式下行为漂移。

### 3.6 小心全角字符与 Unicode 行为

前面 2.3 节已提到：`\d` 在 Unicode 模式下会匹配全角数字。处理用户输入时，要么显式 `re.ASCII`，要么先做全角转半角：

```python
import re

def to_halfwidth(s: str) -> str:
    """全角数字/字母转半角。"""
    return "".join(
        chr(ord(c) - 0xFEE0) if "０" <= c <= "ｚ" else c
        for c in s
    )

phone = "１３８００１３８０００"
print(re.fullmatch(r"1[3-9]\d{9}", phone))                 # 输出：None
print(re.fullmatch(r"1[3-9]\d{9}", to_halfwidth(phone)))   # 输出：<re.Match object>
```

### 3.7 避免灾难性回溯

正则引擎在贪婪量词嵌套时可能产生指数级回溯，典型陷阱是 `(a+)+b` 这类模式匹配一长串 `a` 但结尾没有 `b`。经验法则：

- 不要写形如 `(a+)+`、`(a*)*` 这种"量词套量词"且没明显终止条件的模式。
- 对长输入设置超时（Python 没有原生正则超时，可用信号或第三方 `regex` 模块）。
- 能用否定字符组 `[^x]+` 表达的，别用 `.*?x`——前者一步到位，后者靠回溯。

```python
import re

# 反例：在 30 个 a 上会明显卡，100 个 a 可能卡死
# re.fullmatch(r"(a+)+b", "a" * 30)

# 正例：用否定字符组或不嵌套量词
print(re.fullmatch(r"a+b", "a" * 30 + "b"))   # 输出：<re.Match object>
```

## 4. 原理

本篇是速查篇，原理只点明四个关键点，帮助你在模式不工作时知道往哪里想。深入的状态机理论、NFA/DFA 构造在编译原理教材里都有，这里只讲对"写正则"有直接帮助的部分。

### 4.1 元字符的状态机语义

一个正则在引擎内部被编译成一个**非确定有限状态自动机（NFA）**。每个元字符对应状态机上的一种转移规则：

- 字面字符 `a`：当前状态读入 `a` 转到下一状态。
- `.`：读入任意非换行字符都转移。
- `*`：对应一个带自环的状态——读入 0 次或多次后继续。
- `|`：对应状态的分支——同时探索两条路径。
- `()`：划出一个"子自动机"，可在匹配完成后回溯到子段。

Python 的 `re` 用的是**回溯型 NFA**（PCRE 风格），不是 DFA。回溯型 NFA 的特点是：它按"尝试-失败-回退-再尝试"的方式搜索，能支持反向引用、零宽断言这些 DFA 难以实现的功能，代价是在某些模式上可能指数级慢（见 3.7）。

理解这一点，就能解释很多现象：

- `.*` 为什么贪婪：NFA 默认先尝试"多走一步"，走不通再回退。
- `.*?` 为什么非贪婪：NFA 先尝试"少走一步"，后续走不通再多走。
- `(?=...)` 为什么零宽：它只检查"从此刻起能否走通子自动机"，不实际推进主自动机位置。

### 4.2 字符类与字符集匹配

`[abc]`、`\d`、`\w` 在状态机层面都是同一种东西：一个**字符集断言**。当前状态读入一个字符后，检查它是否在集合内——在则转移，不在则失败。

- `[a-z]` 是连续范围，本质是用码点序构造的集合。
- `[^abc]` 是补集，等价于"全集减去 {a,b,c}"。
- `\d` 在 Unicode 模式下集合很大（所有 Unicode 数字字符），在 ASCII 模式下只是 `[0-9]`。

字符类只匹配**一个**字符，不消耗多个字符。`[abc]+` 表示"一个 a/b/c，接着一个 a/b/c，……"一一尝试。把它当成"匹配一个子串"是常见的初学者误解。

### 4.3 量词的回溯机制

量词 `* + ? {n,m}` 决定前一个元素重复几次。回溯型 NFA 对量词的处理是：

1. 贪婪量词先把能吃的都吃掉（重复到不能再重复）。
2. 然后尝试匹配后续部分。
3. 若后续失败，回退一步（少吃一个），再尝试。
4. 直到后续成功，或回退到 0 仍失败。

非贪婪量词反过来：先吃最少，再逐步多吃。

这就是 2.4 节那段 `<div>.*</div>` 为什么匹配到一整段的根本原因：`.*` 先把所有字符吃光，引擎发现后面 `</div>` 没字符可匹配，于是回退；退到倒数第一个 `</div>` 后续成立，于是匹配到这里——也就是最后一个 `</div>`。

理解回溯，就能主动用"否定字符组"代替"点星非贪婪"来规避性能问题：`[^<]+` 一次匹配到下一个 `<`，没有回溯，比 `.*?` 在长文本上快得多。

### 4.4 边界 \b 的位置匹配（零宽）

`\b` 不是一个字符，而是一个**位置断言**。它断言"此刻左侧是 `\w`、右侧是 `\W`（或反过来），或在字符串首尾的 `w` 处"。因为它不消耗字符，所以叫零宽。

状态机上看，`\b` 对应一个不推进读入位置的转移——引擎检查两侧字符类别是否符合，符合则"通过"但不前进，不符合则失败。

这也解释了：

- `\bcat\b` 为什么能区分 `cat` 和 `catalog`：`catalog` 里 `cat` 后面是 `a`（`\w`），`\b` 断言失败。
- 为什么 `user_name` 里 `user` 后面不是边界：下划线是 `\w`，两侧都是 `\w`，没有边界。
- `\B` 是 `\b` 的补集，断言"此刻两侧同为 `\w` 或同为 `\W`"。

### 4.5 为什么 HTML / URL 不该用正则

这是第 3 章那条最佳实践的原理依据。HTML 不是正则语言——它属于上下文无关文法（CFG），而且实际浏览器解析的 HTML 还允许很多 CFG 都表达不了的容错（标签可选闭合、属性可无引号、`<script>` 内容有特殊规则）。

正则表达式对应的是正则文法，表达能力弱于 CFG。用正则处理 HTML，本质是用一个能力不足的工具去描述一个更复杂的语言，结果就是：

- **嵌套**：`<div><div>x</div></div>` 需要配对计数，正则没有"栈"概念，无法表达任意深度嵌套。`<div>.*?</div>` 只能匹配最近一对，无法保证开闭配对。
- **属性中的 `>`**：`<a title="x>y">` 里 `>` 在属性值内，不是标签结束，但 `[^>]*` 会提前截断。
- **注释与 CDATA**：`<!-- <tag> -->` 里 `<tag>` 是注释内容，不该被当成标签，正则没有"我在注释里"这种状态。
- **`<script>`/`<style>` 内容**：这些元素的正文是纯文本，里面可以出现 `</...>` 字样，正则会误判。

URL、日期、邮箱的情况类似——它们的语法都带层级、转义或语义约束，超出正则文法的表达范围。Python 标准库为此提供了专门的解析器（`urllib.parse`、`datetime`、`email`、`html.parser`），它们用状态机或递归下降解析，能力上对应 CFG 或更强，能正确处理这些结构。

**取舍**：不是"绝对不能用正则碰 HTML"——在一个完全受控、结构固定的小片段里抽取一两个属性，正则够用且快。但只要涉及任意网页、嵌套标签、用户输入的 HTML，就应当立刻转向解析器。

## 5. 总结

**本文内容要点**

- 本篇是 `re` 模块的速查篇，承接 07（`match/search/findall`）和 08（捕获组与分组）的原理讲解，聚焦"能直接抄走用的模式"。
- 元字符速查：`. ^ $ * + ? {n} {n,} {n,m} [] () | \`，逐个配可运行示例。
- 字符类速查：`\d \D \w \W \s \S` 两两补集，Unicode 模式与 ASCII 模式的差异，自定义 `[]` 与取反。
- 量词速查：贪婪 `* + ?` 与非贪婪 `*? +? ??`，对照示例演示回溯差异。
- 边界速查：`^ $ \b \B \A \Z`，`\b` 的零宽位置语义与下划线边界陷阱。
- 分组与断言速查：`() (?:) (?P<>) \1 (?=) (?!) (?<=) (?<!)`，一张表 + 命名组与断言示例。
- 业务模式速查：邮箱、URL、IPv4、手机号、邮编、身份证（含校验位）、日期、中文、HTML、千分位数字、弱密码强度，每个给可运行模式、输出与适用边界。
- 函数速查：`match / search / fullmatch / findall / finditer / sub / subn / split / compile`，含 `sub` 函数替换、`split` 捕获组保留、`finditer` 位置信息等进阶用法。
- 最佳实践：优先用专项解析器而非正则（HTML/URL/日期/邮箱/IP/JSON/CSV），`fullmatch` 校验、`findall` 抽取，原始字符串，`re.VERBOSE` 拆注释，预编译固化标志，全角字符处理，避免灾难性回溯。
- 原理：正则对应 NFA 状态机，元字符即转移规则，字符类即字符集断言，量词靠回溯实现，`\b` 零宽位置匹配，HTML 不属正则文法故不该用正则解析。

**读完应能掌握**

- 拿到一段文本，能从本篇速查表里选对元字符/字符类/量词，组合出可用的模式，而不是从零拼凑。
- 对邮箱、手机号、身份证、日期、IPv4 等常见场景，能直接抄走模式并说明它的适用边界与翻车条件。
- 能根据任务选对 `re` 函数：校验用 `fullmatch`、定位用 `search`、全量提用 `findall/finditer`、改用 `sub/subn`、切分用 `split`、复用用 `compile`。
- 面对 HTML、URL、日期、邮箱等带层级或语义的解析任务，能判断"到此为止用正则、再往下换解析器"，并说出原理层面为什么。
- 看到一条复杂正则时，能通过 `re.VERBOSE`、拆分小模式、否定字符组替代 `.*?` 等手段让它变得可维护、抗回溯。