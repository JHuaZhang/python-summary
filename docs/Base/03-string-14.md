---
group:
  title: 【03】字符串介绍
  order: 3
order: 14
title: find 与 rfind 方法
nav:
  title: Python基础
  order: 1
---

# find 与 rfind 方法

## 1. 介绍

### 1.1 知识点定义

`find` 和 `rfind` 是 Python 字符串的查找方法，它们在一个字符串中搜索**指定子串**，返回子串所在位置的**索引**——这是两个"告诉我它在哪"的方法。

| 方法 | 签名 | 查找方向 | 找不到时 |
|------|------|---------|---------|
| `str.find(sub[, start[, end]])` | 返回 `int` | 从左端向右，命中**第一次**出现 | 返回 `-1` |
| `str.rfind(sub[, start[, end]])` | 返回 `int` | 从右端向左，命中**最后一次**出现 | 返回 `-1` |

它们解决的核心问题是：**"我想知道某个子串在字符串里的位置，然后基于位置做切割、提取、校验"**。

与临近方法的关系先建立一个大图景，避免混淆：

- `in` 运算符——只回答"在不在"，不给位置
- `find` / `rfind`——给出位置索引，找不到安静地返回 `-1`
- `index` / `rindex`——行为同 `find` / `rfind`，但找不到时抛出 `ValueError`
- `count`——只统计出现次数，不给位置

也就是说，在"查找类"方法中，`find` 与 `rfind` 是**既要存在性、又要位置**时的主力工具。

### 1.2 最简示例

先用最简单的代码直观感受这两个方法：

```python
s = "banana"

# find：从左向右找，返回第一次出现的位置
print(s.find("na"))

# rfind：从右向左找，返回最后一次出现的位置
print(s.rfind("na"))

# 找不到时返回 -1，不报错
print(s.find("xyz"))
```

运行结果：

```text
2
4
-1
```

`"banana"` 的位置关系用索引图直接画出来：

```text
索引:     0    1    2    3    4    5
字符:     b    a    n    a    n    a

find("na")   命中 s[2:4] = "na"  → 返回 2
rfind("na")  命中 s[4:6] = "na"  → 返回 4
```

拿到位置之后，最常见的下一步就是用切片提取内容：

```python
s = "user@example.com"
at = s.find("@")          # at = 4
print(s[:at])             # @ 之前的用户名
print(s[at + 1:])         # @ 之后的域名
```

运行结果：

```text
user
example.com
```

这是 `find` 最典型的使用模式：**`find` 负责定位，切片负责提取**。

## 2. 核心内容

### 2.1 str.find()

#### 2.1.1 方法签名

```python
str.find(sub[, start[, end]]) -> int
```

`find` 接收一个必需参数和两个可选参数：

| 参数 | 必需 | 含义 |
|------|------|------|
| `sub` | 是 | 要查找的子串，可以是任意长度的字符串（包括空串） |
| `start` | 否 | 查找的起始索引（含），默认 `0` |
| `end` | 否 | 查找的结束索引（不含），默认 `len(s)` |

返回值是一个整数：

- 找到时——返回 `sub` 在字符串中**第一次出现的起始索引**
- 找不到时——返回 `-1`

#### 2.1.2 基本查找

最基础的用法：在整串中查找子串的第一次出现。

```python
cases = [
    ("hello world", "world"),   # 存在于中间，返回起始索引 6
    ("banana", "na"),           # 第一次出现在索引 2
    ("abc", "z"),               # 不存在，返回 -1
]
for s, sub in cases:
    print(f"  {s!r}.find({sub!r}) = {s.find(sub)}")
```

运行结果：

```text
  'hello world'.find('world') = 6
  'banana'.find('na') = 2
  'abc'.find('z') = -1
```

**关键点说明**：

- `find("world")` 返回 `6`，正是 `w` 在 `"hello world"` 中的索引（`h0 e1 l2 l3 o4 ␣5 w6`）
- 子串可以是单字符，也可以是多字符
- 匹配的判定是"连续一段完全相同"，`"2024-10-13"` 中 `find("-10")` 能命中，因为它逐字符比对 `-`、`1`、`0`

#### 2.1.3 找不到时返回 -1

`find` 最重要的约定：**找不到不抛异常，返回 `-1`**。

```python
s = "hello world"
print(s.find("xyz"))      # -1
print(s.find("worldd"))   # 多了一个 d，整串都不匹配 → -1
print(s.rfind("xyz"))     # rfind 的约定完全一致
```

运行结果：

```text
-1
-1
-1
```

为什么 `-1` 能充当"不存在"的信号？因为字符串的有效索引范围是 `0` 到 `len(s) - 1`，`-1` 不在这个区间内，不会与任何合法位置冲突。这也是后面所有"判断陷阱"围绕 `-1` 展开的原因——它是一个普通整数，必须**显式地**与 `-1` 比较，不能隐式地当布尔值用（详见 2.5 节）。

#### 2.1.4 返回索引与切片联动

`find` 返回的索引可以直接配合切片使用，恢复出完整的子串：

```python
s = "hello world"
sub = "world"
idx = s.find(sub)
print(f"  {s!r}.find({sub!r}) = {idx}")
print(f"  s[{idx}:{idx + len(sub)}] = {s[idx:idx + len(sub)]!r}")
```

运行结果：

```text
  'hello world'.find('world') = 6
  s[6:11] = 'world'
```

**关键点说明**：

- `idx = 6` 是子串**左端点**的索引，`idx + len(sub)` 是右端点（不含）
- `s[idx:idx + len(sub)]` 一定能切出完整子串——这是"定位后提取"模式的基础
- 更常见的简化写法是只定左边界：`s[idx:]` 取"从子串开始的全部"

#### 2.1.5 大小写敏感与字面匹配

`find` 按照 Unicode 码位逐字符比对，**两个字符必须完全一致**才算匹配：

```python
cases = [
    ("Python is fun", "python"),   # 全小写搜不到
    ("Python is fun", "Python"),   # 大小写完全一致才能命中
    ("PyThOn", "py"),              # 任何一字符不同都算不匹配
]
for s, sub in cases:
    print(f"  {s!r}.find({sub!r}) = {s.find(sub)}")
```

运行结果：

```text
  'Python is fun'.find('python') = -1
  'Python is fun'.find('Python') = 0
  'PyThOn'.find('py') = -1
```

需要忽略大小写查找时，先统一两边的大小写再 `find`：

```python
s = "Python is fun"
print(s.lower().find("python"))
```

运行结果：

```text
0
```

`find` 也**不支持通配符与正则**——它做的是纯字面匹配：

```python
s = "file1.txt file2.txt"
print(s.find("file*"))   # '*' 是字面字符，字符串里没有这个组合
print(s.find("."))       # '.' 就是普通的点字符，不是正则的"任意字符"
print(s.find(r"\d"))     # '\d' 是两个字面字符，不是正则的数字类
```

运行结果：

```text
-1
5
-1
```

**关键点说明**：`find(".")` 返回 `5`，因为 `"file1.txt"` 中索引 5 处确实是一个真实的 `.` 字符——这证明它在按字面搜索。需要正则能力时应使用 `re` 模块，`find` 只负责字面匹配。

#### 2.1.6 空字符串与边界行为

当 `sub` 是空字符串时，行为有点特殊但完全符合规则：

```python
print("abc".find(""))   # 空串被视为在索引 0 处"存在"
print("".find(""))      # 空串在空串的索引 0 处"存在"
```

运行结果：

```text
0
0
```

**关键点说明**：空字符串被约定为"存在于任何字符串的起始处"，所以 `find("")` 返回 `0` 而不是 `-1`。日常业务中几乎不会依赖这个行为，但写"子串存在性校验"的通用函数时要留意：**传入空串永远返回"找到了"**。

#### 2.1.7 bytes 字符串同样支持 find

`find` / `rfind` 不只属于 `str`——`bytes` 类型同样有这两个方法，处理网络报文、文件二进制内容时会用到：

```python
data = b"hello world"       # bytes 字面量带 b 前缀
print(data.find(b"world"))  # 子串也必须是 bytes
```

运行结果：

```text
6
```

`str` 与 `bytes` 不能混用——`bytes` 里找 `str`（或反过来）都会直接抛 `TypeError`：

```python
try:
    b"abc".find("a")
except TypeError as e:
    print(f"TypeError: {e}")
```

运行结果：

```text
TypeError: argument should be integer or bytes-like object, not 'str'
```

**关键点说明**：`TypeError` 是这里**唯一的**报错来源——它和"找不到返回 -1"是两回事：前者是参数类型用错（程序 bug），后者是正常的查找结果（业务状态）。排查 `find` 相关报错时先分清是哪一类。

### 2.2 start 与 end 参数：区间查找

#### 2.2.1 切片式区间语义

`find` 的三个参数组合 `s.find(sub, start, end)` 在语义上**等价于在切片 `s[start:end]` 中查找**——区间规则、负数、越界处理全部与切片一致。但有一个关键差异：

- 查找范围:  相当于在 s[start:end] 切片里找
- 返回值:    仍然是子串在【原串】中的绝对索引，不是区间内的相对位置

这两句话合起来就是区间查找的全部规则，下面每小节演示其中一面。

#### 2.2.2 start 参数：跳过已知前缀

`start` 指定从哪个索引开始找（含），最常见的用途是**跳过已知前缀、查找后续位置**：

```python
s = "2024-10-13-update.log"
first = s.find("-")               # 第一个 '-' 在索引 4
second = s.find("-", first + 1)   # 从 5 开始继续找第二个 '-'
print(f"第一个 '-' 索引: {first}")
print(f"从 {first + 1} 开始找: {second}")
```

运行结果：

```text
第一个 '-' 索引: 4
从 5 开始找: 7
```

"先定位锚点，再从锚点之后继续找"是区间查找最常见的形态。在稍微真实一点的场景里，`start` 用来跳过 URL 的协议前缀：

```python
url = "https://example.com/path?q=1"
scheme_end = url.find("//") + len("//")   # 跳过 "https://"
print(url.find("/", scheme_end))          # 协议之后的第一个 '/'
```

运行结果：

```text
19
```

**关键点说明**：`find("//")` 定位协议分隔符，`+ len("//")` 把起点推进到主机名开头，再从那里找第一个 `/`——`start` 参数让链式的"锚点定位"成为可能，每一步的返回值加上子串长度，就是下一步的起点。

#### 2.2.3 end 参数：限定右边界

`end` 指定查找的结束索引（不含），子串的匹配**必须完整落在 `start` 到 `end` 之间**：

```python
s = "hello world"
print(s.find("o", 0, 5))   # 只在 'hello' 里找，o 在索引 4
print(s.find("o", 0, 4))   # 只在 'hell' 里找，o 不在其中
```

运行结果：

```text
4
-1
```

**关键点说明**：第二次查找区间是 `s[0:4] = "hell"`，就算字符串后面明明有 `o`，也不会被匹配——匹配必须**完整**落在区间内，索引 4 处那个越界的 `o` 不算。

`end` 的典型场景是"只在前半段找"——比如检查一段报文的头部是否带有某个前缀，而不希望误匹配到正文：

```python
packet = "GET /api HTTP/1.1 marker in body ..."
print(packet.find("marker", 0, 20))   # 只在报文头 20 个字符里找 marker
print(packet.find("marker"))          # 全文找，当然找得到
```

运行结果：

```text
-1
20
```

第一次返回 `-1` 印证了"完整落在区间内才有效"的规则——`marker` 实际在索引 20，而区间只覆盖到 19。

#### 2.2.4 负数与越界的处理规则

`start` 与 `end` 支持负数索引，也允许越界，规则完全遵循切片：

```python
s = "2024-10-13"
print(s.find("-", -5))        # -5 表示从倒数第 5 个字符开始
print(s.rfind("-", 0, -5))     # 只在 s[0:-5] 里找最后一个 '-'
```

运行结果：

```text
7
4
```

越界时也和切片一样"温柔收窄"，不抛异常：

```python
s = "abc"
print(s.find("a", 10))      # 起点越界，区间为空 → -1
print(s.find("c", 0, 100))   # 终点越界自动收窄到 len(s)，能找到
print(s.find("b", 1, 1))     # 空区间 → -1
```

运行结果：

```text
-1
2
-1
```

**关键点说明**：

- `-5` 按切片规则折算为 `len(s) - 5 = 5`，所以第一次是在 `"0-13"` 这段里找，找到的 `-` 在原串索引 `7`
- `end = 100` 超出长度但不会报错，等价于 `end = 3`
- `start == end` 时区间为空，任何子串都找不到（空串除外）

#### 2.2.5 返回值是绝对索引：区间查找的第一大坑

新手最常见的误区：以为区间内查到的返回值是**相对区间起点的偏移**。实际返回的是**原串的绝对索引**：

```python
s = "one two three"
idx = s.find("two", 4)   # 从索引 4 开始找 'two'
print(f"  s.find('two', 4) = {idx}")
print(f"  s[4:7] = {s[idx:idx + 3]!r}")
```

运行结果：

```text
  s.find('two', 4) = 4
  s[4:7] = 'two'
```

**关键点说明**：要把返回值当"原串位置"用：直接切片 `s[idx:...]`、直接和 `len(s)` 比较都是正确的；只有当你确实需要"区间内的第几个"时，才用 `idx - start` 手动换算相对位置。设计上这是有意为之——绝对索引让 `find` 的返回值**永远可以直接喂给切片**，不用每次都记得加偏移。

### 2.3 str.rfind()

#### 2.3.1 方法签名

```python
str.rfind(sub[, start[, end]]) -> int
```

参数与返回值约定和 `find` 完全相同，唯一的差异在查找方向：`rfind` 从右端向左扫描，命中**最后一次出现**的位置。

#### 2.3.2 从右端找最后一次出现

```python
cases = [
    ("banana", "a"),        # 最后一个 a 在索引 5
    ("a-b-c-d", "-"),       # 最后一个 - 在索引 5
    ("abc", "z"),           # 不存在返回 -1，与 find 一致
]
for s, sub in cases:
    print(f"  {s!r}.rfind({sub!r}) = {s.rfind(sub)}")
```

运行结果：

```text
  'banana'.rfind('a') = 5
  'a-b-c-d'.rfind('-') = 5
  'abc'.rfind('z') = -1
```

`rfind` 存在的意义很直接：**当目标分隔符可能出现多次、而你只关心"最后那一刀"时**，一步到位，省去"循环找完再取最后一个"的麻烦。

#### 2.3.3 返回索引仍是左端点

`rfind` 虽然从右向左扫，但返回的**仍是匹配区域左端点的索引**：

```python
s = "banana"
idx = s.rfind("na")
print(f"  s = {s!r}")
print(f"  s.rfind('na') = {idx}")
print(f"  s[{idx}:{idx + len('na')}] = {s[idx:idx + len('na')]!r}")
```

运行结果：

```text
  s = 'banana'
  s.rfind('na') = 4
  s[4:6] = 'na'
```

**关键点说明**：这个约定让 `find` 和 `rfind` 的返回值**可以直接互换使用**——拿到索引后，切片逻辑完全一致，不需要因为方向不同而换算。

#### 2.3.4 rfind 的区间查找

`rfind` 同样支持 `start` 和 `end`，语义是"在区间内找最后一次出现"：

```python
s = "a-b-c-d-e"
print(s.rfind("-", 0, 5))   # 只在 s[0:5] = 'a-b-c' 里找最后一个 '-'
print(s.rfind("-"))          # 不限范围时取全局最后一个
```

运行结果：

```text
3
7
```

**关键点说明**：区间内的 `rfind` 并不是"在整个字符串里找完再过滤"，而是真的只把 `s[start:end]` 作为搜索空间——这保证了长字符串上的查找不会做无谓的扫描。

#### 2.3.5 典型场景：取路径最后一段

`rfind` 的另一高频场景是从路径中切出"目录 + 文件名"——路径里可以有任意多个 `/`，文件名永远是最后一个 `/` 之后的部分：

```python
path = "/usr/local/bin/python3"
slash = path.rfind("/")             # 最后一个 /
print(f"目录: {path[:slash]!r}")
print(f"文件名: {path[slash + 1:]!r}")
```

运行结果：

```text
目录: '/usr/local/bin'
文件名: 'python3'
```

**关键点说明**：注意 `path[slash + 1:]` 中 `slash + 1` 从分隔符**之后**开始切——找到分隔符之后"越过"它，是 `find` / `rfind` 定位后提取的标准动作。取扩展名、取域名、取查询串，用的都是这同一个套路。

### 2.4 find 与 rfind 的方向差异

#### 2.4.1 方向对比

用同一组数据并排查看两者的输出：

```python
cases = [
    ("banana", "an"),
    ("report_2024.final.backup", "."),
    ("key=value=extra", "="),
]
for s, sub in cases:
    print(f"  {s!r}:")
    print(f"    .find({sub!r})    = {s.find(sub)}   # 第一次出现")
    print(f"    .rfind({sub!r})   = {s.rfind(sub)}   # 最后一次出现")
```

运行结果：

```text
  'banana':
    .find('an')    = 1   # 第一次出现
    .rfind('an')   = 3   # 最后一次出现
  'report_2024.final.backup':
    .find('.')    = 11   # 第一次出现
    .rfind('.')   = 17   # 最后一次出现
  'key=value=extra':
    .find('=')    = 3   # 第一次出现
    .rfind('=')   = 9   # 最后一次出现
```

#### 2.4.2 只出现一次时两者相同

当子串只出现一次时，两个方法必然返回同一个索引：

```python
cases = [
    ("hello world", "world"),
    ("2024-10-13", "2024"),
    ("abc", "b"),
]
for s, sub in cases:
    left, right = s.find(sub), s.rfind(sub)
    same = "相同" if left == right else "不同"
    print(f"  {s!r}: find={left}, rfind={right} ({same})")
```

运行结果：

```text
  'hello world': find=6, rfind=6 (相同)
  '2024-10-13': find=0, rfind=0 (相同)
  'abc': find=1, rfind=1 (相同)
```

**关键点说明**：这个特性有个实用的推论——`find` 与 `rfind` 的返回值不同，说明子串**至少出现了两次**；返回值相同则可能是恰好一次（也可能是零次：两者都返回 `-1`）。这常被用作快速判断"是否重复出现"的手段。

```python
def appears_multiple_times(s, sub):
    """find 与 rfind 不一致 = 至少出现两次（排除都不存在的 -1 情况）"""
    left, right = s.find(sub), s.rfind(sub)
    return left != right and left != -1

print(appears_multiple_times("a-b-b-c", "b"))   # 出现两次 → True
print(appears_multiple_times("a-b-c", "-"))     # 只出现一次 → False
print(appears_multiple_times("abc", "z"))        # 都不存在 → False
```

运行结果：

```text
True
False
False
```

#### 2.4.3 方向选择的实战差异：文件名切分

同一个文件名，`find` 和 `rfind` 切出来的东西完全不同——选错方向，程序依然"能跑"，只是结果错：

```python
filenames = [
    "report.tar.gz",     # 双扩展名，取最后一个 . 之后
    "笔记.md",
    "noext",             # 没有点
    "archive.2024.zip",  # 文件名中间带点
]
for name in filenames:
    dot = name.rfind(".")
    if dot == -1:
        print(f"  {name!r}: 无扩展名")
    else:
        print(f"  {name!r}: 主名={name[:dot]!r}, 扩展名={name[dot:]!r}")
```

运行结果：

```text
  'report.tar.gz': 主名='report.tar', 扩展名='.gz'
  '笔记.md': 主名='笔记', 扩展名='.md'
  'noext': 无扩展名
  'archive.2024.zip': 主名='archive.2024', 扩展名='.zip'
```

如果这场景误用 `find`，取到的是**第一个**点，`archive.2024.zip` 会被错误地解析：

```python
# 方向选错的连锁结果
name = "archive.2024.zip"
dot = name.find(".")
print(f"错误切分: 主名={name[:dot]!r}, 扩展名={name[dot:]!r}")
```

运行结果：

```text
错误切分: 主名='archive', 扩展名='.2024.zip'
```

**关键点说明**：

- 判断条件 `dot == -1 or dot == 0` 需要一起挡掉两类情况：没有点（`-1`）与以点开头的隐藏文件（如 `".gitignore"` 中 `rfind(".") == 0`，主名为空）
- 方向选择的口诀：**"取右段从右找"——要最后一个分隔符之后就用 `rfind`；反之要第一个就用 `find`**。方向由"你想要哪一段"直接决定

### 2.5 返回值 -1 的语义与判断陷阱

`-1` 让 `find` 在"可能找不到"的场景下足够宽容，但它是一个普通整数，会参与一切整数运算——这正是所有陷阱的来源。

#### 2.5.1 真值判断陷阱：if s.find(x) 是错的

`find` 返回 `0` 的场景（子串恰好在开头）会让布尔条件**完全反转**：

```python
url = "https://example.com"
print(url.find("https"))

# 错误写法：把 find 的返回值直接当布尔值用
if url.find("https"):
    print("找到了")
else:
    print("没找到")
```

运行结果：

```text
0
没找到
```

明明 `"https"` 在 `url` 的开头，程序却走进了"没找到"分支——因为 `find` 返回的 `0` 在布尔上下文里是 `False`。更隐蔽的是，这个 bug 只在**子串位于索引 0 时触发**：

```python
cases = [
    ("hello world", "hello"),    # 开头命中，find 返回 0
    ("error: something", "error"),
    ("2024-10-13", "2024"),
]
for s, sub in cases:
    idx = s.find(sub)
    verdict = "被误判为未找到" if idx == 0 else "碰巧正常"
    print(f"  {s!r}: find={idx} -> {verdict}")
```

运行结果：

```text
  'hello world': find=0 -> 被误判为未找到
  'error: something': find=0 -> 被误判为未找到
  '2024-10-13': find=0 -> 被误判为未找到
```

这类代码在测试中常常"偶尔正常"（测试数据凑巧不在开头），上线后才在真实数据上翻车。

**正确写法是显式与 `-1` 比较**：

```python
url = "https://example.com"
if url.find("https") != -1:
    print("写法一：找到了")

if "https" in url:
    print("写法二：找到了")
```

运行结果：

```text
写法一：找到了
写法二：找到了
```

#### 2.5.2 -1 参与索引运算的静默错乱

判断分支之外，"使用环节"同样会踩坑——如果拿到 `-1` 不检查就直接当索引用，负索引语义会**悄悄接管**：

```python
s = "no marker here"
idx = s.find("-")        # -1
print(s[idx])            # s[-1] 是最后一个字符！
print(s[idx + 1:])        # -1 + 1 = 0，切出整个字符串
```

运行结果：

```text
e
no marker here
```

想要的分隔符不存在，结果：

- 用 `s[idx]` 想取分隔符数据，拿到了**最后一个字符** `'e'`
- 用 `s[idx + 1:]` 想取分隔符之后的内容，把**整个字符串**切了出来

两个操作**都不报错**，程序带着垃圾值继续往下跑。请记住这个推论：**`-1` 参与任何索引运算（取下标、切片、加偏移）都会产生静默的垃圾值**，唯一安全的用法是先判断再使用。

#### 2.5.3 安全的使用模式：先判断、封装返回 None

工程上推荐的两种防护写法。

先判断再使用（最小改动，业务代码内最常用）：

```python
s = "state=ready"
idx = s.find("=")
if idx != -1:
    print(s[idx + 1:])
else:
    print("这不是键值对格式的字符串")
```

运行结果：

```text
ready
```

封装成函数时，用一个明确的"不存在"信号（`None`）代替 `-1`，让调用方**无法误用**：

```python
def extract_after(s, marker):
    """返回 marker 之后的内容；marker 不存在时返回 None"""
    idx = s.find(marker)
    if idx == -1:
        return None
    return s[idx + len(marker):]

print(extract_after("state=ready", "=") is not None)
print(extract_after("no marker here", "="))
```

运行结果：

```text
True
None
```

**关键点说明**：`None` 是一个"无法参与索引运算"的对象——调用方若忘了判空直接用，会立刻抛 `TypeError` 而不是产出垃圾值，把错误从"下游静默污染"提前到"当场报错"。这不是过度设计：判定逻辑写在一个函数里，业务侧就再也不用重复 `-1` 约定。

#### 2.5.4 只匹配位置时：startswith 更达意

有一种需求经常被写成 `find`：判断字符串是否以某个前缀开头。

```python
url = "https://example.com"
print(url.find("https") == 0)     # 用 find 的返回值和 0 比较
print(url.startswith("https"))    # 语义化方法直接表达"以...开头"
```

运行结果：

```text
True
True
```

两种写法结果一致，但第二种**说出了意图**。`find` 的本职是"告诉我位置"，位置恰好是 `0` 是一种巧合式的利用；`startswith` 的本职就是"判断前缀"。同理，判断后缀用 `endswith`。巧合式代码的共同问题：**它成立依赖的是一个恰好为真的副作用，而不是语义本身**。

### 2.6 find 与 in / index / count 的关系

#### 2.6.1 find vs in

`in` 运算符只回答"在不在"，`find` 回答"在哪里"：

```python
log = "WARNING: memory usage 92%"
print("96" in log)          # in：只判断存在性
idx = log.find("92%")
print(idx)                  # find：给出位置
print(log[idx:])            # 位置可以继续用于切片
```

运行结果：

```text
False
22
92%
```

选择依据就一句话：**需要位置就用 `find`，只需要存在性就用 `in`**。`in` 的语义更直白，编译器也会把它优化成与 `find` 同级的 C 层扫描，不存在"用 in 更慢"的性能负担。

#### 2.6.2 find vs index

`index` 的行为与 `find` 完全一致，唯一差异是"找不到"的表现：

```python
s = "invite token"
print(s.find("token"))   # 7
print(s.find("xyz"))     # 找不到 → 静默返回 -1
print(s.index("token"))  # 7
try:
    s.index("xyz")       # 找不到 → 抛 ValueError
except ValueError as e:
    print(f"ValueError: {e}")
```

运行结果：

```text
7
-1
7
ValueError: substring not found
```

两套行为对应两种场景，细节在 4.2 节展开，这里先记结论：**"不存在是正常业务状态"用 `find`，"不存在说明数据已经坏了"用 `index`**。

#### 2.6.3 四方法对比表

| 维度 | find / rfind | index / rindex | in | count |
|------|-------------|----------------|-----|-------|
| 返回类型 | `int`（位置） | `int`（位置） | `bool`（存在性） | `int`（次数） |
| 找不到时 | 返回 `-1` | 抛 `ValueError` | 返回 `False` | 返回 `0` |
| 支持区间 | 支持（start/end） | 支持（start/end） | 不支持 | 支持（start/end） |
| 典型场景 | 可能不存在，需要位置 | 不存在即数据错误 | 只判断在不在 | 统计出现次数 |
| 方向版本 | `rfind` 从右向左 | `rindex` 从右向左 | 无 | 无 |

验证一下 `r` 前缀家族的对应关系：

```python
s = "a-b-b-c"
print(s.find("b"), s.rfind("b"))    # 2 4：第一次与最后一次
print(s.index("b"), s.rindex("b"))  # 2 4：行为一致，差异只在找不到时
```

运行结果：

```text
2 4
2 4
```

**记忆方式**：四个位置查找方法两两组队——方法名加 `r` 前缀 = 从右端往左找；`find` 与 `index` 语义相同，只是"找不到"一个还 `-1`、一个抛异常。

#### 2.6.4 find 与 count 的配合

`count` 告诉你"出现了几次"，`find` / `rfind` 告诉你"位置在哪"，两者配合能快速建立全局认知：

```python
s = "2026-10-13-and-10-14"
print(s.count("10"))     # 出现次数
print(s.find("10"))      # 第一次位置
print(s.rfind("10"))     # 最后一次位置
```

运行结果：

```text
2
5
15
```

**关键点说明**：`count("10")` 返回 `2`（一次在日期里、一次在结尾），而 `find` 和 `rfind` 分别拿到 `5` 与 `15`，正好把两处的位置都交代了——需要**所有**出现的位置时，则要换用 3.5 节的扫描循环；`count` 只给数量、不给中间位置，不能假设"求两次 find 就够用"。

#### 2.6.5 find 与 partition 的协作选择

`find` 与"拆分类"的 `partition` 方法经常能解决同一类问题——"在分隔符处切开并提取两侧"。它们的关系值得专门对比，因为**选择依据不是能力，而是你更愿意在哪一层处理"不存在"**：

```python
# 用 find 定位 + 手工切片：能拿到精确位置，但要自己处理不存在
s = "id=42,name=Ada"
eq = s.find("=")
comma = s.find(",", eq)
print(f"第一个键值对在 s[:{comma}], 其中的值: {s[eq + 1:comma]!r}")
```

运行结果：

```text
第一个键值对在 s[:5], 其中的值: '42'
```

同样的提取，用 `partition` 一行完成，不需要算偏移：

```python
key, sep, value = "name=Ada".partition("=")
print(f"键: {key!r}, 值: {value!r}")
```

运行结果：

```text
键: 'name', 值: 'Ada'
```

两者的取舍：

| 维度 | find + 切片 | partition |
|------|------------|-----------|
| 返回信息 | 位置索引（可作后续多个锚点复用） | 切好的三段内容 |
| 不存在时 | 返回 `-1`，可以精确分支处理 | 返回 `(原串, '', '')`，靠空段判断 |
| 多个分隔符方向 | `find`（取第一处）/ `rfind`（取最后一处）自由控制 | `partition`（第一处）/ `rpartition`（最后一处） |
| 代码形态 | 要写 `idx + 1`、`idx + len(marker)` 等偏移 | 不用算任何偏移 |

**关键点说明**：

- 需要**位置本身**（后续还要在它周围做别的切片、比较、推进）→ 用 `find`
- 只需要**分隔符两侧的内容**、嫌偏移量容易写错 → 用 `partition`，省心且不抛异常
- 两者都找不到时不报错（`find` 给 `-1`，`partition` 给空段），都不属于"快速失败"工具；确需快速失败改用 `index`

## 3. 最佳实践

### 3.1 存在判断：用 in 而非 find

判断"包不包含"时，明确推荐 `in` 运算符：

```python
config = "host=db.internal;port=5432"

# 推荐: in 直接表达"包含"语义
if "timeout" in config:
    print("配置了 timeout")

# 不推荐: 用 find 判断存在，必须记得 != -1，一疏忽就翻车
if config.find("timeout") != -1:
    print("配置了 timeout")
```

运行结果：

```text
配置了 timeout
配置了 timeout
```

两种写法在这里都正确，但第一种**不可能写出真值陷阱**，而第二种在每个新写法处都要重复一次 `-1` 约定。规则：**只要分支里不需要位置信息，就用 `in`**。

### 3.2 位置提取：先判断、再使用

需要位置信息时，遵循"定位 → 判断 → 使用"三步，绝不让 `-1` 参与后续运算：

```python
# 推荐: 显式判断 idx 的有效性后再切片
s = "https://example.com/path"
idx = s.find("://")
if idx != -1:
    host_end = s.find("/", idx + 3)
    if host_end != -1:
        print(s[idx + 3:host_end])
```

运行结果：

```text
example.com
```

对应的错误写法没有任何判断，`-1` 会通过 `+ 3` 变成 `2`，产出静默的错误结果：

```python
# 不推荐: 不判断直接用，s.find('://') == -1 时整段逻辑错乱
s = "example.com"
idx = s.find("://")
print(s[idx + 3:s.find("/", idx + 3)])
```

运行结果：

```text
.com
```

对比两个输出：当字符串里根本没有 `://` 时，未判断版本输出了莫名其妙的 `'.com'`——它既不是空也不是报错，是最难排查的一类结果。两个 `find` 的嵌套判断在真实代码中很常见（内层用外层位置作起点），层数多时更要把每个 `-1` 分支想清楚。

### 3.3 多分隔符取右段：用 rfind

从"可能包含多个分隔符"的字符串中提取最后一段时，用 `rfind`：

```python
# 推荐: rfind 一步定位最后一个点，扩展名稳定正确
name = "archive.2024.zip"
dot = name.rfind(".")
ext = "" if dot == -1 else name[dot:]
print(ext)
```

运行结果：

```text
.zip
```

如果误用 `find`，取到的是**第一个**点，文件名会被错误地解析：

```python
# 不推荐: find 定位第一个点，多分隔符场景结果完全错误
name = "archive.2024.zip"
dot = name.find(".")
print(name[:dot], "/ 错误的切分:", name[dot:])
```

运行结果：

```text
archive / 错误的切分: .2024.zip
```

规则一句话：**取右段用 rfind，取左段用 find**——方向与"你要哪一段"直接对应。多段路径同理：目录在最后一个 `/` 之前，文件名在之后，具体演示见 2.3.5 节。

### 3.4 查找第 N 次出现：find + start 推进

`find` 本身只返回第一次出现，配合 `start` 参数循环推进即可查找任意第 N 次：

```python
def find_nth(s, sub, n):
    """返回 sub 第 n 次出现的索引，不存在返回 -1（n 从 1 开始）"""
    idx = -1
    for _ in range(n):
        idx = s.find(sub, idx + 1)
        if idx == -1:
            return -1
    return idx

s = "ab-cd-ef-gh"
for n in (1, 2, 3, 4, 5):
    print(f"  '-' 第 {n} 次出现: {find_nth(s, '-', n)}")
```

运行结果：

```text
  '-' 第 1 次出现: 2
  '-' 第 2 次出现: 5
  '-' 第 3 次出现: 8
  '-' 第 4 次出现: -1
  '-' 第 5 次出现: -1
```

这里有两处可迁移的小设计：

1. **推进量为 `idx + 1`**——不是 `idx + len(sub)`，这允许匹配**重叠出现**的子串（如 `"aaa"` 中第二个 `"aa"` 从索引 1 开始）；若业务上重叠不算数，改用 `idx + len(sub)` 跳过整个命中
2. **函数信守 find 的约定**——超出存在次数时也返回 `-1`，调用方继续沿用与 `find` 相同的判断模式，不用学新约定

重叠与不重叠的差别直接对比：

```python
s = "adasdarada"          # "ada" 出现在 0、4、7（第 3 处与前一处重叠于 a）
print(s.find("ada", 1))    # 步进 1: 从索引 1 起找，命中 4
print(s.find("ada", 8))    # 步进过严: 从 8 起找，重叠区命中不到
```

运行结果：

```text
4
-1
```

**关键点说明**：`s.find("ada", 8)` 返回 `-1` 并不是"没有了"——索引 7 处还有一处与索引 4 命中区域**重叠**的 `"ada"`。扫描类代码要按业务确认"重叠算不算一次出现"，并相应选择步进量。

### 3.5 关键词扫描：收集所有出现位置

把 `find` 放进 `while` 循环，即可收集一个关键词在全文中的所有位置：

```python
text = "error in layer A, error again, last error"
keyword = "error"
positions = []
idx = text.find(keyword)
while idx != -1:
    positions.append(idx)
    idx = text.find(keyword, idx + len(keyword))   # 跳过本次命中，不统计重叠
print(positions)
```

运行结果：

```text
[0, 18, 36]
```

**关键点说明**：

- 循环驱动条件就是 `find` 的哨兵值：查不到时 `find` 返回 `-1`，`while` 自然终止——**不需要也不要**借助 `count` 预先算次数来控制循环
- 步进量 `idx + len(keyword)` 保证每次前进至少一个完整关键词，死循环不可能发生；同时避免关键词内部重叠导致的重复报点
- 这个扫描模式是"手工替换"的基础：把 `positions.append(idx)` 换成在命中位置前后切片拼接，就能实现一次定向替换；在 `re` 模块出场之前，理解这层机制比直接背模板更可靠

### 3.6 URL 拆解：find 与 rfind 的接力实战

把前面所有模式串起来：一个用 `find` + `start` 接力、`rfind` 收尾的真实任务——把 URL 拆成协议、主机、路径、查询串：

```python
url = "https://example.com/products/item?id=7"

# 接力第一棒: find 定位协议分隔符
scheme_sep = url.find("://")
scheme = url[:scheme_sep]

# 接力第二棒: 从分隔符 + 3 处开始找第一个 '/'，得到主机段右边界
path_start = url.find("/", scheme_sep + 3)
host = url[scheme_sep + 3:path_start]

# 收尾一棒: rfind 从右端找 '?'，切出路径与查询串
query_sep = url.rfind("?")
path = url[path_start:query_sep]
query = url[query_sep + 1:]

print(f"协议={scheme!r}")
print(f"主机={host!r}")
print(f"路径={path!r}")
print(f"查询={query!r}")
```

运行结果：

```text
协议='https'
主机='example.com'
路径='/products/item'
查询='id=7'
```

**关键点说明**：

- 每一次定位的返回值都直接充当**下一次查找的起点**或切片边界——这是锚点接力的典型节奏
- 路径和查询串的切分用 `rfind("?")` 而不是 `find("?")`：万一查询参数里还嵌了 `?`，从右找不至于把查询串错切一刀；对"结构化字符串的尾部字段"用 `rfind` 是稳妥习惯
- 生产代码里这个任务更适合 `urllib.parse.urlparse`；这里手工版的价值在于：当字符串不是标准 URL（如内部协议串 `db://user:pass@host:port`）时，`find` / `rfind` 的锚点接力是唯一可控的解析手段

### 3.7 日志行解析：链式限定提取字段

第二个综合场景：解析空格分隔的日志行——首段是级别，第二段是日期，剩余全部是消息：

```python
line = "ERROR 2026-10-13 disk full on /dev/sda1"

# 第一棒: 定位第一个空格，左侧是级别
level_end = line.find(" ")
level = line[:level_end]

# 第二棒: 从空格之后继续找下一个空格，得到日期段
date_end = line.find(" ", level_end + 1)
date = line[level_end + 1:date_end]

# 尾段: 第二个空格之后的全部内容是消息
message = line[date_end + 1:]

print(f"level={level!r}, date={date!r}")
print(f"message={message!r}")
```

运行结果：

```text
level='ERROR', date='2026-10-13'
message='disk full on /dev/sda1'
```

**关键点说明**：

- 两次 `find` 之间的切分是模式化的：前一个锚点 + 1 是新字段的起点，下一个锚点是右边界
- 这种"固定空格数"的解析对字段内**含空格**的消息段天然友好——消息段包含 /dev/sda1 前后的所有空格，无需特殊处理；这是它比 `split(" ")` 更可控的地方（后者无法直接表达"前两段固定，余下全归第三段"，得配 `maxsplit` 参数）

### 3.8 方法选择决策表

| 需求 | 首选方法 | 避免使用 |
|------|---------|---------|
| 只判断"在不在" | `in` | `find(...) != -1`（多一层心智负担） |
| 要位置，可能不存在 | `find` / `rfind` + 显式判断 | `index`（会把正常缺失变成异常） |
| 要位置，缺失即数据错误 | `index` / `rindex` 快速失败 | `find`（错误被静默吞掉） |
| 最后一次出现的位置 | `rfind` | 循环调用 `find` 再取结果 |
| 第 N 次出现 | `find` + `start` 推进 | 手写逐字符扫描 |
| 所有可能的出现位置 | `while` 循环 `find` 逐位推进 | 反复推演偏移量的切片算式 |
| 只要分隔符两侧内容 | `partition` / `rpartition` | `find` + 手工偏移切片 |
| 出现次数 | `count` | 扫描循环里顺便数（啰嗦低效） |
| 判断前缀 / 后缀 | `startswith` / `endswith` | `find(...) == 0`（巧合式代码） |

## 4. 原理

按工具选择的深度，`find` 属于"语言层直接提供的能力"——理解两个设计决策就足够日常驾驭它：为什么返回 `-1`，以及为什么同时存在 `find` 和 `index` 两套方法。

### 4.1 为什么找不到返回 -1 而不是抛异常

字符串的有效索引范围是 `0` 到 `len(s) - 1`，`-1` 是这个范围之外**最小的整数**，它与任何合法位置都不冲突，是一个天然的位置哨兵。

这套设计延续了 C 语言 `strstr` 返回 `NULL` 的传统——"查找失败"被视作查找操作的**正常结果**而非错误状态。在文本处理场景中"子串不存在"往往正如其字面含义一样普通（日志里没有 error、URL 里没有查询参数），若 `find` 在这些场景抛异常，几乎所有查找调用都要包一层 `try/except`，代码将变得极其啰嗦。

但对 `-1` 的信任必须建立在**显式比较**之上：它是一个普通整数，Python 的真值规则（`0` 为假、非零为真）与负索引规则（`s[-1]` 取尾部）都会"配合"它制造隐蔽 bug——这正是 2.5 节所有陷阱的根源，也是"用 `in` 做存在判断"这一最佳实践成立的原因。

### 4.2 为什么同时保留 find 和 index

Python 同时提供"返回 `-1`"和"抛异常"两套查找方法，看似重复，实际服务两种截然不同的程序意图：

```python
# 语义一: 缺失是正常的业务状态 → 用 find，调用方自己分支
nickname = "张三（后端）"
paren = nickname.find("（")
if paren == -1:
    display_name = nickname          # 没有括号备注，很正常
else:
    display_name = nickname[:paren]
```

第一段是"预期中可以优雅降级"的场景；第二段恰好相反——缺失本身就是事故：

```python
# 语义二: 缺失意味着数据已经坏了 → 用 index 立刻暴露
required = "user_id=42"
key_pos = required.index("user_id=")   # 必填字段缺失就不是正常业务了
```

两段代码在各自场景下都能正确执行；但把第二段的 `index` 换成 `find`，缺失场景会拿到 `-1` 继续往下算，错误被推迟到难以追溯的下游；反过来把第一段换成 `index`，"没有备注"这种正常情况也会炸——两种混用都让代码变得更糟。

这就是 Python 社区常说的两种风格：`find` 是"宽容的返回值约定"（预期中可能不存在），`index` 是"许可式快速失败"（不存在即程序错误）。两者共享同一套 C 层查找实现，只是结果分发策略不同，性能无差异，可以放心按语义选择。

### 4.3 底层实现与性能要点

`find` / `rfind` 由 CPython 在 C 层实现（`stringlib` 的 fastsearch 算法），核心思路是：**从查找起点开始单趟扫描，用启发式规则跳过不可能匹配的位置**——它混合了 Boyer–Moore–Horspool 风格的"坏字符跳跃"与一个类似布隆过滤器的字符存在性快查表，较新版本的 Python 对长模式串还引入了更优的 Two-Way 算法来避开最坏情况。

对日常使用，记住三个结论即可：

- **单次调用的开销**与"字符串长度 × 模式串长度"相关，日常文本规模下可以视为线性，不必担心
- **用 C 层的 `find` 而不是手写 Python 循环逐字符比对**——后者每次比较都解释一次字节码，长文本上是数量级差距
- **`in` 与 `find` 共用底层扫描实现**，判断存在性时不存在"换用 `in` 会更快或更慢"的问题，两者只有语义差别

一个对照实验可以直接感知差距：

```python
import timeit

s = "x" * 10_000_000 + "needle"
print("str.find       :", timeit.timeit(lambda: s.find("needle"), number=100))
print("手写逐字符扫描 :", timeit.timeit(
    lambda: next(
        (i for i in range(len(s)) if s.startswith("needle", i)),
        -1,
    ),
    number=1,
))
```

运行结果（数量级示意，因机器而异）：

```text
str.find       : 0.1 秒级别（100 次查找的总耗时）
手写逐字符扫描 : 数秒级别（1 次查找的耗时）
```

**关键点说明**：内置方法把扫描循环完全放进了 C 层，Python 只负责发起调用——这也是所有内置字符串方法共同的设计回报：**能用内置完成的文本匹配，不要用 Python 循环重写**。

## 5. 总结

本文围绕 `find` 与 `rfind` 方法展开，主要介绍了以下内容：

- `find` / `rfind` 是字符串查找方法：返回子串第一次 / 最后一次出现的**起始索引**，找不到返回 **-1** 而不报错；`bytes` 类型同样支持这两个方法，但 `str` 与 `bytes` 的参数不能混用
- `find` 按字面逐字符匹配：大小写敏感、不支持通配符与正则；忽略大小写需先 `lower()` 统一两边；空字符串永远在索引 0 处"找到"
- `start` 与 `end` 参数提供切片式区间查找：负数与越界遵循切片规则，返回值始终是**原串的绝对索引**，可以直接喂给切片
- `rfind` 从右端向左扫描，命中最后一次出现，但返回的仍是匹配区域**左端点**的索引；`find` 与 `rfind` 返回值不同即说明子串至少出现了两次
- `-1` 判断必须显式比较：`if s.find(x)` 在子串位于索引 0 时必然出错；`-1` 参与索引运算会产生静默垃圾值，正确模式是"先判断、再使用"，或封装为返回 `None`
- 临近方法各司其职：存在判断用 `in`、次数统计用 `count`、缺失即快速失败用 `index` / `rindex`、前缀后缀判断用 `startswith` / `endswith`、只要分隔符两侧内容时用 `partition` / `rpartition`
- 工程模式化用法：`find` + `start` 推进查找第 N 次出现（步进量决定是否统计重叠）；`while` + `find` 循环收集所有出现位置；多分隔符取右段、路径取文件名用 `rfind`；URL 与日志解析中"锚点接力"是标准节奏
- 设计层面：`-1` 哨兵延续"缺失是正常结果"的宽容语义，`index` 提供"缺失即快速失败"的断言语义，两套方法共享底层 C 实现，按业务语义按需选用
