---
group:
  title: 【03】字符串介绍
  order: 3
order: 15
title: index 与 rindex 方法
nav:
  title: Python基础
  order: 1
---

# index 与 rindex 方法

## 1. 介绍

### 1.1 知识点定义

`str.index()` 与 `str.rindex()` 是字符串的查找方法：在原字符串里定位一个子串，返回它出现位置的索引。`index` 从左向右找**第一次**出现，`rindex` 从右向左找**最后一次**出现。参数与返回值和 `find`/`rfind` 完全一致，唯独一个行为不同——**找不到子串时不返回 -1，而是直接抛出 `ValueError`**。

| 维度 | 说明 |
|------|------|
| 所属 | `str` 的内置实例方法 |
| 语法 | `s.index(sub[, start[, end]])`、`s.rindex(sub[, start[, end]])` |
| 返回 | `int`，子串首次/最后一次出现处的**左端点**索引 |
| 找不到 | 抛 `ValueError: substring not found`，不返回 -1 |
| 方向 | `index` 认最左一次；`rindex` 认最右一次 |
| 其他 | 大小写敏感、字面匹配；区间遵循切片语义 |

这一对方法解决的核心问题是：**"这个子串必须存在于文本的这个位置附近，请告诉我它的确切索引"**——协议解析必须找到 `://`、配置行必须有 `=`、文件名必须带扩展名，这类"缺失即错误"的定位场景，就是 `index`/`rindex` 的主场。它们把"找不到"从"返回值里的一个特殊数字"升级为"程序当场中断并报告"，让坏数据在第一时间暴露。

先把字符串查找家族的工具放在一起看大图景：

- `in`——判断"有没有"，返回布尔值
- `count`——数"有几个"，返回整数
- `find`/`rfind`——柔性定位，找不到时返回 -1，调用方自己判断
- `index`/`rindex`——强约束定位，找不到时抛异常，逼问题当场暴露

四个维度各管一件事：**存在性、数量、柔性位置、强约束位置**。选型的关键不在语法，而在你如何回答这个问题——"子串找不到时，是正常业务状态，还是数据坏了？"

### 1.2 最简示例

先看一段包括三种行为的最小代码——`index` 定位、`rindex` 定位、找不到时抛异常：

```python
url = "https://example.com/index.html"

scheme_end = url.index("://")     # 定位协议分隔符
print(f"协议名: {url[:scheme_end]!r}")

last_dot = url.rindex(".")        # 定位最后一个点
print(f"扩展名: {url[last_dot + 1:]!r}")

try:
    url.index("ftp")              # 这个 URL 里没有 ftp
except ValueError as e:
    print(f"找不到: {e}")
```

运行结果：

```text
协议名: 'https'
扩展名: 'html'
找不到: substring not found
```

三行输出对应方法的三个面貌：`index("://")` 返回 5，用切片把协议名切了出来；`rindex(".")` 返回 25（最后一个点），`+1` 切出扩展名；`index("ftp")` 找遍整个字符串没有命中，抛出 `ValueError`，异常被 `try/except` 接住。返回的索引直接参与 `s[:idx]`、`s[idx + 1:]` 这类切片运算——**`index` 负责"量出位置"，切片负责"按位置取材"**，这也是这两个方法最常见的使用形态。

## 2. 核心内容

### 2.1 str.index()：返回首次出现的位置

#### 2.1.1 方法签名

完整签名是 `s.index(sub[, start[, end]])`：

| 参数 | 必填 | 含义 |
|------|------|------|
| `sub` | 是 | 要查找的子串，可以是任意字符串（含空串、单字符） |
| `start` | 否 | 查找起点（含），默认 0，支持负数 |
| `end` | 否 | 查找终点（不含），默认到字符串末尾，支持负数 |

返回值是子串**第一次出现**位置上，**第一个字符**在原字符串中的索引。`index` 没有任何关键字参数，所有参数按位置传递。

#### 2.1.2 基本查找与命中位置

子串出现在开头、中间、末尾，`index` 都如实返回起点的索引：

```python
print("hello world".index("hello"))
print("hello world".index("world"))
print("hello world".index("d"))
```

运行结果：

```text
0
6
10
```

配一张索引图看清这三个返回值：

```text
索引:     0    1    2    3    4    5    6    7    8    9   10
字符:     h    e    l    l    o  (空格) w    o    r    l    d
          ↑                              ↑                  ↑
       'hello' 在 0                'world' 在 6          'd' 在 10
```

单字符也是子串——`index("d")` 返回 10，说明它不挑子串长度，从单字符到长文本一视同仁。

多次出现时只认第一次：

```python
s = "banana"
print(s.index("na"))
```

运行结果：

```text
2
```

`'na'` 在 `'banana'` 里出现了两次（索引 2 和 4），`index` 从左向右扫描，停在**最左**的一次：

```text
索引:     0    1    2    3    4    5
字符:     b    a    n    a    n    a
                    ↑              ↑
               index 命中 2    rindex 将命中 4
```

#### 2.1.3 返回索引是左端点：与切片联动

`index` 返回的位置指向**子串的第一个字符**，不是最后一个，更不是右端点之后。这个语义让返回值能直接接入切片体系：

```python
s = "error: disk full"
idx = s.index("disk")
print(idx)
print(s[idx:idx + 4])
print(s[idx + 4:])
```

运行结果：

```text
7
disk
 full
```

`'disk'` 起于索引 7（`e(0)r(1)r(2)o(3)r(4):(5)空格(6)d(7)i(8)s(9)k(10)`），print 的三行分别对应：

- `idx` 是 7——子串左端点的全局位置
- `s[idx:idx + 4]` 完整还原子串——`len("disk")` 恰好是 4，切片右端自然重合
- `s[idx + 4:]` 从子串之后取材——起点越过子串自身，取到 `' full'`

**"左端点 + 子串长度"**是围绕查找结果做切割的标准口诀：从 `idx` 往前切是子串本身，从 `idx + len(sub)` 往后切是子串之后的内容。后面所有解析模板都建立在这条联动之上。

#### 2.1.4 大小写敏感与字面匹配

`index` 做的是**字面匹配**：不区分语义、不做大小写归一化、不认识全角半角的等价关系——写成什么就找什么：

```python
s = "Status: OK"
print(s.index("OK"))
print(s.index("Status"))
try:
    s.index("ok")
except ValueError as e:
    print(f"ValueError: {e}")
```

运行结果：

```text
8
0
ValueError: substring not found
```

`'Status: OK'` 里有 `'OK'`（索引 8）也有 `'Status'`（索引 0），但 `'ok'` 找不到——小写 `o` 与大写 `O` 在 Unicode 里是两个不同的码点。如果你要做"忽略大小写"的查找，正确的姿势是先把两边归一化再查找：

```python
s = "Status: OK"
print(s.lower().index("ok"))
```

运行结果：

```text
8
```

一个细节：`lower()` 保持字符串长度不变（大小写转换不改变字符个数），所以归一化后 `index` 到的索引**依然可以直接用于原串的切片**——索引体系没有漂移，`s[8:10]` 在原串上照样切出 `'OK'`。

#### 2.1.5 空串与边界行为

空字符串是一个合法的"子串"查找目标——任何字符串的第 0 个位置都"包含"一个空串：

```python
print("abc".index(""))
print("".index(""))
```

运行结果：

```text
0
0
```

两个 `0` 分别说明：`'abc'.index('')` 在开头即命中（空串"占"的宽度是 0）；空串对空串同样返回 0，不抛异常。这个边界行为与 `find` 完全一致——空串永远"找得到"，所以走不到抛异常的分支。实际业务里几乎不会拿空串做查找目标，但了解这个边界能帮你理解一件事：**`index` 的失败条件是"扫描完成仍无命中"**——空串零宽度、开头即命中，天然不可能走到失败分支。
### 2.2 str.rindex()：返回最后一次出现的位置

#### 2.2.1 签名与方向语义

`rindex` 的签名与 `index` 完全相同：`s.rindex(sub[, start[, end]])`。差异只在扫描方向——**从右向左找，返回最后一次出现的位置**：

```python
s = "banana"
print(s.index("na"))
print(s.rindex("na"))
```

运行结果：

```text
2
4
```

一个抢最左、一个抢最右，方向即语义：

```text
字符:     b    a    n    a    n    a
                    ↑              ↑
                'na' 在 2       'na' 在 4

index  的视线:   [→ → →  从左开始扫... 命中最左的 2, 停
rindex 的视线:   ← ← ]  从右端往回扫... 认最右的 4, 停
```

#### 2.2.2 返回的仍是左端点

`rindex` 最常见的误解是"既然从右边找，返回的应该是右端点"。恰恰不是——**它返回的仍是子串左端点在原字符串中的索引**，方向只决定认哪一次出现，不改变"左端点"的坐标语义：

```python
s = "log/app.tar.gz"
idx = s.rindex(".")
print(idx)
print(s[idx + 1:])
print(s[idx:])
```

运行结果：

```text
11
gz
.gz
```

`l(0)o(1)g(2)/(3)a(4)p(5)p(6).(7)t(8)a(9)r(10).(11)g(12)z(13)`，最后一个点在索引 11。`rindex` 返回 11——是 `.` 自己的位置，不是它右边一格。所以切扩展名时：

- `s[idx + 1:]` 越过分隔符，得到 `'gz'`——正确
- `s[idx:]` 从分隔符自己开始，得到 `'.gz'`——把点也切了进来

**无论 index 还是 rindex，"位置 + 1"都是越过子串的标准起点**。忘了这个 `+1`，切出来的内容就会把分隔符捎上，这是围绕 rindex 做切分最常见的笔误。

#### 2.2.3 只出现一次时两者一致

子串只出现一次时，"第一次"和"最后一次"是同一件事，两个方法的返回值必然相同：

```python
print("hello world".index("world"), "hello world".rindex("world"))
print("monitor.py".index("or"), "monitor.py".rindex("or"))
```

运行结果：

```text
6 6
5 5
```

`'world'` 在 `'hello world'` 里唯一出现；`'or'` 在 `'monitor.py'` 里也唯一出现（`m(0)o(1)n(2)i(3)t(4)o(5)r(6)`——索引 5 是唯一一次）。这种情况两个方向的返回值完全一样——**方向差异只有在多次出现时才会显形**，只有一处命中，方向无从选择。

#### 2.2.4 实战：最后一个点切主名、路径最后一段

方向选错，切分结果完全不同。拿文件名做对照——文件名里可以有任意多个点，扩展名认**最后一个**点：

```python
filename = "report.2026.final.txt"
first_dot = filename.index(".")
last_dot = filename.rindex(".")
print(first_dot, last_dot)
print(filename[:last_dot])
print(filename[last_dot + 1:])
```

运行结果：

```text
6 17
report.2026.final
txt
```

`report` 占 0~5、第一个点在 6、`2026` 在 7~10、第二个点在 11、`final` 在 12~16、最后一个点在 17。用 `index` 的 6 去切主名，得到 `'report'`——主名被拦腰截断，`2026.final` 全丢了；用 `rindex` 的 17 去切，主名 `'report.2026.final'` 完整保留，扩展名 `'txt'` 分毫不差。**"取最后一段"这一类需求，方向必须选 rindex**。

路径场景同理——多级路径取文件名，认最后一个 `/`：

```python
path = "src/utils/helpers/text_utils.py"
idx = path.rindex("/")
print(idx, path[idx + 1:])
```

运行结果：

```text
17 text_utils.py
```

`src` 后第一个 `/` 在 3、`utils` 后在 9、`helpers` 后最后一个 `/` 在 17。`idx + 1` 之后就是最后一段 `'text_utils.py'`。无论前面有多少层级、多少分隔符，`rindex` 永远锁定最右一个——这是"从后往前找分界"类解析的第一选择。

### 2.3 start 与 end：限定查找范围

#### 2.3.1 start：跳过已知位置，找下一次出现

`start` 规定查找的起点（含），最常见的用途是**从上一次命中之后继续找**——定位第二个、第三个分隔符：

```python
s = "key=value&other=123"
first = s.index("=")
second = s.index("=", first + 1)
print(first, second)
```

运行结果：

```text
3 15
```

`key` 后第一个 `=` 在 3、`&other` 后第二个 `=` 在 15。把 `start` 设为 `first + 1`，扫描越过第一个命中点，停在下一个 `=` 上。**"本次结果 + 1"作为下次的 start**，这个推进手法是逐个定位多个出现位置的标准循环骨架——把它套进循环就能找齐全部位置，完整模板在 2.6 节展开。

#### 2.3.2 end：限定右边界

`end` 规定查找的终点（不含）——只在一个区间内找，区间外的命中不算数：

```python
s = "2026-10-14 08:30:00"
print(s.index("-", 0, 10))
print(s[:10].index("-"))
```

运行结果：

```text
4
4
```

两种写法等价：显式传 `end=10` 只在日期段 `'2026-10-14'` 里找 `-`；先切片再 index 也能得到同样的 4。区别在于**区间查找不创建中间字符串**——`s[:10]` 拷贝出一段新字符串，而 `s.index("-", 0, 10)` 原地搜索。数据量大、高频调用的解析循环里，直接传区间比"切片再找"省一次内存分配。

#### 2.3.3 返回值是绝对索引：区间查找的第一大坑

在区间 `[start, end)` 内查找时，返回值**不是区间内的相对位置，而是全局的绝对索引**：

```python
s = "host=example.com"
idx = s.index("p", 6)
print(idx)
print(s[idx])
print(idx - 6)
```

运行结果：

```text
9
p
3
```

`h(0)o(1)s(2)t(3)=(4)e(5)x(6)a(7)m(8)p(9)l(10)e(11).(12)…`，从 6 开始找 `p`，命中全局位置 9。配图看清两套坐标：

```text
全局索引:   0    1    2    3    4    5    6    7    8    9   10   11
字符:       h    o    s    t    =    e    x    a    m    p    l    e
                                     ↑ start=6        ↑ 命中=9
相对索引:                          0    1    2    3
                                          (9 - 6 = 3, 相对位置必须自己手算)
```

返回的 9 直接当 `s` 的下标用没有问题（`s[9]` 就是 `'p'`）；但如果你要的是"命中点在区间内的第几位"，必须自己 `idx - start`——`index` 不会替你换算坐标。**拿区间内的相对位置去操作原字符串，是区间查找错误的高发区**：要么忘了减 start 算错相对位置，要么拿相对位置直接当下标切错了位置。记住一句话：返回值永远面向原字符串负责。

#### 2.3.4 切片式区间语义：右开、越界收紧、完整落位

start/end 的语义完全对齐切片——**右开区间**、**越界自动收紧**、**子串必须完整落在区间内**才算命中：

```python
s = "abcdef"
print(s.index("f", 0, 100))
print(s.index("cd", 0, 4))
try:
    print(s.index("cde", 0, 4))
except ValueError as e:
    print(f"ValueError: {e}")
```

运行结果：

```text
5
2
ValueError: substring not found
```

三个返回值各展示一条规则：

- `end=100` 远超长度 6，被自动收紧为 `len(s)`，照常返回 5——**区间参数可以放心"写大"**，不会越界报错
- `'cd'` 起点 2、终点 3，完整落在 `[0, 4)` 内，命中 2
- `'cde'` 起点 2 在区间内，但终点 4 落在区间外——**超出边界的部分被截掉**，区间内剩下的 `'cd'` 与 `'cde'` 不匹配，抛 `ValueError`

也就是说"完整落位"是硬性要求：子串哪怕只多出区间一个字符，也视同没找到。对 index 家族来说，这条规则直接走异常分支——**区间端点设置错误不会静默错过，而是当场抛异常**，这在调试时反而是好事。

#### 2.3.5 负数 start 与 end

start 和 end 支持负数，语义与切片相同——**从右端倒数**：

```python
s = "2026-10-14"
print(s.index("-", -5))
try:
    s.index("-", -2)
except ValueError as e:
    print(f"ValueError: {e}")
```

运行结果：

```text
7
ValueError: substring not found
```

`len(s)` 是 10，`start=-5` 换算为全局索引 `10 - 5 = 5`，等效于只在最右段 `'10-14'` 里找 `-`，命中段内的 `-`（全局 7）；`start=-2` 换算为全局 8，只在最末段 `'14'` 里找——段内没有 `-`，抛异常。**负数区间等于"从倒数第 N 位起的一段后缀"**，适合"只关心尾部内容"的检查场景，比如只校验文件名末尾的版本号段。
### 2.4 找不到抛 ValueError：index 家族的身份标识

这是 `index`/`rindex` 与 `find`/`rfind` 唯一的行为差异，也是它们存在的根本理由。**找得到时四个方法返回相同的索引；找不到时，index 家族抛异常，find 家族返回 -1**。

#### 2.4.1 直接表现与统一的异常消息

```python
s = "hello world"
try:
    s.index("python")
except ValueError as e:
    print(f"index: {e}")
try:
    s.rindex("xyz")
except ValueError as e:
    print(f"rindex: {e}")
```

运行结果：

```text
index: substring not found
rindex: substring not found
```

两个方法抛的都是 `ValueError`，消息统一是 `substring not found`。注意一个细节：**异常消息里不包含被找的子串内容**——你无法从异常消息得知"是哪个子串没找到"。这不是偷懒，而是设计立场：字符串内容可能携带敏感信息（密码片段、内网地址），异常对象经常要跨越多层调用被记录、打印，底层 API 不擅自把查找目标扩散出去。代价就是原始异常消息的"现场感"很弱——它只说"有个子串没找到"，不说是谁、在哪条数据上。这就给工程处理提出了要求：**捕获后转译，补上业务上下文再上报**（处理模板下面展开）。

#### 2.4.2 与 find 的同输入对照

同一份数据喂给两套方法，看它们的分岔点：

```python
s = "hello world"
print(s.find("world"), s.index("world"))
print(s.find("python"))
try:
    s.index("python")
except ValueError:
    print("index 抛 ValueError，不返回 -1")
```

运行结果：

```text
6 6
-1
index 抛 ValueError，不返回 -1
```

找得到时（`'world'`），`find` 和 `index` 返回同一个 6，行为无任何差别；找不到时（`'python'`），`find` 交出 -1，`index` 拒绝交付任何返回值，直接抛异常。**两个方法在成功路径上完全等价，选择依据只有失败路径：你能接受一个"虚构的索引 -1"，还是希望失败立刻成为一次显式事件？**

#### 2.4.3 fail-fast：-1 的静默渗透 vs 异常的当场暴露

为什么"抛异常"值得专门设计一个方法？看一个 find 翻车的现场：

```python
s = "config file has no marker"
idx = s.find("=")
print(idx, s[idx + 1:])
try:
    s.index("=")
except ValueError as e:
    print(f"ValueError: {e}")
```

运行结果：

```text
-1 config file has no marker
ValueError: substring not found
```

find 这一侧：拿到 -1 后没有检查，`-1 + 1 = 0`，`s[0:]` 切出**整个字符串**——垃圾数据静默流向下游，没有任何报错。而 index 这一侧：同样的输入，程序在查找那一刻就停住，异常信息直指问题。两条失控路径画成图：

```text
find 的失控路径:                                index 的失控路径:

拿 find 结果 -1                                调用 index
     ↓                                              ↓
未检查，直接参与运算                        立刻抛 ValueError
     ↓                                              ↓
-1 + 1 = 0，切片切出整串                  程序在查找现场停下
     ↓                                              ↓
垃圾数据静默流向下游                      堆栈直接指向出错的那一行
     ↓                                              ↓
三天后排查: 数据怎么坏了？             当下即知: 这个字符串里没有它
```

`-1` 的可怕之处在于它是**合法的负索引**——`s[-1]` 取最后一个字符、`s[-1 + 1:]` 取整串，都能跑、不报错，错得悄无声息。而异常**永远不会伪装成数据**——它中断执行、携带堆栈、要求处理。**"让错误在发生的第一时间、第一现场暴露"，这就是 fail-fast（快速失败）**，index 家族是字符串查找里唯一的 fail-fast 工具。

#### 2.4.4 异常帮你定位问题行

抛异常的另一个隐性收益：**堆栈会把问题锁定到具体代码行**。模拟一个解析函数收到坏输入：

```python
def build_greeting(raw):
    idx = raw.index("=")
    return raw[idx + 1:]

try:
    build_greeting("Alen")
except ValueError as e:
    print(f"ValueError: {e}")
```

运行结果：

```text
ValueError: substring not found
```

当原始数据忘了带 `=` 时，程序的失败现场长这样（示意）：

```text
Traceback (most recent call last):
  File "app.py", line 40, in <module>
    build_greeting("Alen")
  File "app.py", line 35, in build_greeting
    idx = raw.index("=")
ValueError: substring not found
```

堆栈逐层写明：`build_greeting` 里调 `raw.index("=")` 的那一行、收到了 `"Alen"` 这个输入。对比 find 翻车的场景——垃圾数据流向下游之后，**报错的位置和真正出错的位置往往隔着好几层调用**。index 的异常把"错误发生地"与"错误暴露地"合二为一，排查省下的是逐层回溯的成本。

#### 2.4.5 失败控制流只能走 try/except

index 的返回值通道里**没有失败消息的位置**——成功就返回 int，失败走异常。这决定了"找不到"的分支逻辑必须用 try/except 表达：

```python
s = "a.txt"
print(s[:s.rindex(".")])
try:
    print(s[:s.rindex("?")])
except ValueError as e:
    print(f"ValueError: {e}")
```

运行结果：

```text
a
ValueError: substring not found
```

成功路径（用最后一个点切主名，得到 `'a'`）不受任何影响；而"想分离 `?` 但字符串里没有"这个失败分支，不可能写成 `if idx == -1:`——因为根本拿不到返回值，异常已经抛出。**使用 index 就等于承诺：缺失出现时用异常机制接住它**。所以下一个要回答的问题是——怎么接才接得规范。
### 2.5 try/except：处理 ValueError 的标准模式

#### 2.5.1 基本姿势：把失败变成可控分支

最朴素的用法——分开处理"结构完整"与"结构缺失"：

```python
s = "192.168.1.100:8080"
try:
    idx = s.index(":")
    print(f"端口: {s[idx + 1:]}")
except ValueError:
    print("没有端口分隔符: 使用默认端口 80")
```

运行结果：

```text
端口: 8080
```

这段代码的逻辑形状值得注意：**try 块里只放"成功路径"的语句**——查找成功后紧接着做切片、取端口；**except 块里只放"失败路径"的对策**——用默认端口兜底。两条路径泾渭分明，读代码的人一眼看清"结构坏了会怎么处理"。`except ValueError` 精确点名捕获类型，是这个模式的底线要求（详细原因下面展开）。

#### 2.5.2 LBYL vs EAFP：两种风格的对照

想安全地处理"可能不存在"，有两套风格，用同一个例子并排写出来：

```python
line = "count=42"

# LBYL: Look Before You Leap —— 先确认存在，再行动
if "=" in line:
    idx = line.index("=")
    print(f"[LBYL] 值: {line[idx + 1:]}")
else:
    print("[LBYL] 没有等号")

# EAFP: Easier to Ask Forgiveness than Permission —— 先行动，失败再处理
try:
    idx = line.index("=")
    print(f"[EAFP] 值: {line[idx + 1:]}")
except ValueError:
    print("[EAFP] 没有等号")
```

运行结果：

```text
[LBYL] 值: 42
[EAFP] 值: 42
```

两种风格结果一致，但成本结构不同：

| 维度 | LBYL（先检查） | EAFP（先行动） |
|------|------|------|
| 扫描次数 | `in` 扫一遍 + `index` 再扫一遍，两次 | `index` 只扫一遍 |
| 逻辑重心 | 先写"没找到怎么办"，再写正事 | 正事在前，失败兜底在后 |
| 读代码的人 | 从 if/else 分支读出全貌 | 成功路径一目了然 |

对字符串这种不可变对象，"检查完数据变了"的竞态风险不存在（两次扫描结果必然一致），但**多扫的一遍是实打实的开销**；在解析高频的循环里，EAFP 的"一遍扫描"优势会累积成可感知的性能差。Python 社区的惯用风格是 EAFP——它让"正常路径"占据代码的黄金位置，异常处理是补丁而不是前摇。这也是 index 存在的另一半意义：**有了会抛异常的版本，EAFP 才有趁手的工具**；只有 find 的话，EAFP 的"失败分支"永远拿不到触发时机——它压根不失败。

#### 2.5.3 异常转译：from None 斩链与 from e 留链

底层异常消息 `substring not found` 没有业务信息，正确的工程姿势是**捕获后转译成带上下文的业务错误**。注意两个方向——

**方向一：from None，主动斩断没有价值的异常链**。原始消息毫无现场感时，直接屏蔽它，换成完整的业务描述：

```python
def parse_port_translated(text):
    try:
        idx = text.index(":")
        return text[:idx], text[idx + 1:]
    except ValueError:
        raise ValueError(
            f"端口解析失败: 输入 {text!r} 缺少 ':' 分隔符，期望 '主机:端口' 格式"
        ) from None

try:
    parse_port_translated("example.com")
except ValueError as e:
    print(e)
```

运行结果：

```text
端口解析失败: 输入 'example.com' 缺少 ':' 分隔符，期望 '主机:端口' 格式
```

对比原始的 `substring not found`，转译后的消息自己就能回答三个排查问题——**哪条数据坏了、为什么坏了、期望什么样**。看到这条报错的人不需要读代码就知道该修哪条数据。`from None` 表示"原始异常链我有意丢弃"——不是忘了处理，而是判断它没有保留价值。

**方向二：from e，保留原始异常链的现场**。当原始异常还有回溯价值（或你不确定要不要留）时，用 `from e` 把它挂到新异常的链条上：

```python
def parse_pair(text):
    try:
        idx = text.index("=")
    except ValueError as e:
        raise ValueError(f"配置行格式错误: {text!r} 缺少 '='") from e
    return text[:idx], text[idx + 1:]

try:
    parse_pair("no_equals_sign")
except ValueError as e:
    print(e)
    print(f"__cause__ = {e.__cause__!r}")
```

运行结果：

```text
配置行格式错误: 'no_equals_sign' 缺少 '='
__cause__ = ValueError('substring not found')
```

新消息负责业务语义，`__cause__` 里还挂着原始异常——排查时两层信息都在：业务层告诉你哪条配置坏了，原始层告诉你底层是个子串查找失败。**from None 是"我知道它没用"，from e 是"先留着现场"**——拿不准就选 from e，多留的信息永远可以忽略，丢了的信息无处寻回。

#### 2.5.4 吞异常的代价

失败处理最危险的姿势：捕获之后一声不吭，返回一个"看起来正常"的值继续跑：

```python
def extract_version_silent(metadata):
    try:
        idx = metadata.index("v")
        return metadata[idx + 1:]
    except ValueError:
        return ""      # 吞掉: 静默返回空串, 调用方无从分辨'真没有'还是'解析坏了'

def extract_version_explicit(metadata):
    try:
        idx = metadata.index("v")
        return metadata[idx + 1:]
    except ValueError as e:
        raise ValueError(f"元数据缺少版本标识 'v': {metadata!r}") from e

print(repr(extract_version_silent("app-2.1.0")))
try:
    extract_version_explicit("app-2.1.0")
except ValueError as e:
    print(e)
```

运行结果：

```text
''
元数据缺少版本标识 'v': 'app-2.1.0'
```

静默版把"数据坏了"伪装成"版本是空串"——下游拿着 `''` 继续运行，产出缺失版本号的数据；等发现报表异常再回溯，中间隔着的每一步都是嫌疑现场。显式版在坏数据进来的当下就报错，消息直指输入 `'app-2.1.0'`。**except 的作用是"处理异常"，不是"消灭异常"**——把异常吞掉返回默认值，等于亲手把 index 唯一的优势（当场暴露）烧开。如果空版本号真的可以接受，那这个"可以接受"也应该由 except 里一句显式的、有名字的代码来表达，而不是让它随 `return ""` 静默通过。

#### 2.5.5 捕获要精确：别用裸 except

`except` 后面必须点名 `ValueError`，这不仅是风格，还是功能边界——**其他类型的异常必须能畅通无阻地穿越你的 except**：

```python
def unsafe_len(data):
    return len(data)

for item in ["ok", None]:
    try:
        print(f"{item!r} -> {unsafe_len(item)!r}")
    except ValueError:
        print(f"{item!r} -> 预期内的 ValueError")
    except TypeError as e:
        print(f"{item!r} -> TypeError: {e}")
```

运行结果：

```text
'ok' -> 2
None -> TypeError: object of type 'NoneType' has no len()
```

`len(None)` 抛的是 `TypeError`——完全不在我们约定处理的范围内。如果 except 写成裸 `except:`，这个 `TypeError` 会被误当成"查找失败"消化掉：本该修的是上游传参错误，却被"数据里没有这个子串"的分支糊弄过去。精确捕获的价值在于**让 except 块只对自己的那一类失败负责**：`ValueError` 是"字符串里没有这个子串"，其他任何异常都是别的病——病了一定要让它去挂别的科。
### 2.6 index、find、in、count：定位工具的选型

#### 2.6.1 语义决定选型：缺失的三种含义

同一份数据、不同的业务语义，选用的工具完全不同。先看"缺失是正常状态"的场景——商品标签里有没有`'热销'`，没有太常见了：

```python
tags = ["热销", "无标签", "4K-144Hz"]
for name, tag in zip(["无线鼠标", "机械键盘", "显示器"], tags):
    if "热销" in tag:
        print(f"{name} 带'热销'标识")
    else:
        print(f"{name} 不带'热销'标识")
```

运行结果：

```text
无线鼠标 带'热销'标识
机械键盘 不带'热销'标识
显示器 不带'热销'标识
```

没有标签是每个商品都可能处的正常业务状态，用 `in` 表达"包含与否"最达意。再看"缺失是错误状态"的场景——商品编号必须携带地区码，没有就是坏数据：

```python
codes = ["SKU-CN-9001", "SKU-CN-9002", "SKU-9003"]   # 第三条少了地区码
for code in codes:
    try:
        idx = code.index("CN")
        print(f"{code!r} -> 合规, 地区码 {code[idx:idx + 2]!r}")
    except ValueError:
        print(f"{code!r} -> ValueError: 编号缺少地区码, 坏数据立即暴露")
```

运行结果：

```text
'SKU-CN-9001' -> 合规, 地区码 'CN'
'SKU-CN-9002' -> 合规, 地区码 'CN'
'SKU-9003' -> ValueError: 编号缺少地区码, 坏数据立即暴露
```

**同一个动作"找不找得到"，业务含义变了，工具就得跟着变**。归纳成一张选型表：

| 缺失意味着 | 典型例子 | 首选工具 |
|------|------|------|
| 正常业务状态 | 评论里没提到"推荐"、商品没有某标签 | `in`（纯判断）或 `find` + `-1` 判断（要位置） |
| 数据格式错误 | 配置行没有 `=`、编号没有地区码 | `index` + `try/except` |
| 只需要统计数量 | 统计分隔符个数 | `count` |

#### 2.6.2 index + start 推进：定位全部出现位置

`index` 配合 `start` 参数逐位推进，可以把**全部出现位置**找齐——循环的终止条件恰恰是那个"找不到"的 ValueError：

```python
text = "2026/10/14 08/30/00"

positions = []
start = 0
while True:
    try:
        idx = text.index("/", start)   # 成功: 记录位置, 起点前推
        positions.append(idx)
        start = idx + 1
    except ValueError:                  # 失败: 位置找完了, 终止循环
        break

print(positions)
```

运行结果：

```text
[4, 7, 13, 16]
```

这个循环的骨架值得品味：**try 块是"推进主体"，except 是"天然终止位"**——不额外维护计数器、不用预先 `count` 一遍、不靠 `len` 找越界。`ValueError` 在这里不是错误，而是循环的**终止信号**：字符串里的位置终会找完，"找完"的表现就是"再也找不到了"。这个模式也佐证了一点：设计在抛异常机制里的失败分支，拿来做循环控制是 EAFP 最漂亮的用法之一——逻辑干干净净，不需要一行防御性检查。

#### 2.6.3 四工具同台对照

同一个字符串，把家族工具全部过一遍：

```python
s = "txn-id=A2026, flag=PAID"
print("PAID" in s)
print(s.count("="))
print(s.find("flag"), s.index("flag"))
print(s.rfind("="), s.rindex("="))
```

运行结果：

```text
True
2
14 14
18 18
```

`'txn-id=A2026, flag=PAID'`——`in` 回答"PAID 在不在"（True）；`count` 说出 `=` 有几个（2）；`find`/`index` 定位 `'flag'`（都报 14，成功路径一致）；`rfind`/`rindex` 抢最后一个 `=`（都报 18）。找得到时四件工具的结论互相印证。汇总成一张全景表：

| 工具 | 返回 | 找不到时的表现 | 面向的语义 |
|------|------|------|------|
| `in` | `bool` | `False` | 存在性判断 |
| `count` | `int` | `0` | 出现次数 |
| `find` / `rfind` | `int` 索引 | 返回 `-1` | 柔性定位——缺失是正常状态 |
| `index` / `rindex` | `int` 索引 | 抛 `ValueError` | 强约束定位——缺失是错误状态 |

#### 2.6.4 决策的三个问题

选型时依次自问三个问题，答案自然浮出：

```text
① 要位置吗? ── 不要 ──→ 存在判断用 in, 统计数量用 count
      ↓ 要
② 缺失正常吗? ── 正常（缺失是预期内的业务状态）──→ find / rfind
      ↓ 不正常（缺失意味着数据坏了）
③ 当场拦下它 ──→ index / rindex + try/except 转译
```

问题①筛掉"根本不需要位置"的场景，问题②把柔性定位与强约束定位分开，问题③提醒你抛出后要接转译。**先定语义，再选方法**——工具没有优劣，用错场景才是错误。

## 3. 最佳实践

### 3.1 存在判断：用 in，不用 index

第一组推荐对照。只想知道"有没有"，不要让这次判断背上异常处理的包袱：

| 语义 | 推荐写法 | 不推荐写法 | 原因 |
|------|------|------|------|
| 判断包含 | `if "ftp" not in url:` | 用 try/except 包 `index` | in 一步到位，返回值就是答案 |
| 判断不包含 | `if "ftp" not in url:` | 用 try/except 包 `index` | 不该为布尔问题启动异常机制 |

代码对照：

```python
url = "https://example.com"

# 不推荐: 用 index 判存在 —— 为一个布尔结论启用整套异常机制
try:
    url.index("ftp")
    print("含 ftp")
except ValueError:
    print("不含 ftp")

# 推荐: in 直接表达"包含"语义
print("含 ftp" if "ftp" in url else "不含 ftp")
```

运行结果：

```text
不含 ftp
不含 ftp
```

两种写法结论一致，但第一种要读四个关键词（try/index/except/ValueError）才能拼出"判断包含"这件小事；第二种一个 `in` 直达语义。**index 的异常机制是给"需要位置的强约束场景"准备的**，拿它做纯存在判断是高射炮打蚊子：代码更长、语义更弯，而且在"预期会缺失"的数据上，异常机制的开销恰恰会被高频触发。

### 3.2 强约束解析模板：index 定位 + 异常转译 + 独立报告

index 最能发挥价值的场景：**解析"必须有分隔符"的强格式文本**。先看一个初版模板，它已经比"手动切片"安全很多：

```python
def parse_config_line(line):
    idx = line.index("=")          # '=' 是配置行语法的硬性要求, 缺失即格式错误
    key = line[:idx].strip()
    value = line[idx + 1:].strip()
    if not key:
        raise ValueError(f"配置行 {line!r} 的键为空")
    return key, value

lines = ["host=192.168.1.1", "port=8080", "broken line no equals"]
for line in lines:
    try:
        key, value = parse_config_line(line)
        print(f"通过: {key!r} = {value!r}")
    except ValueError as e:
        print(f"拒绝: {line!r} -> {e}")
```

运行结果：

```text
通过: 'host' = '192.168.1.1'
通过: 'port' = '8080'
拒绝: 'broken line no equals' -> substring not found
```

模板的工作方式：**index 负责把守第一关**（`=` 必须存在）、**手工校验负责第二关**（键不能为空）、**调用方负责逐行独立报告**（try/except 环绕单行解析，坏一行不拖垮全部）。但注意拒绝行的错误消息——还是裸的 `substring not found`，得读代码才知道是哪条规则没过。按转译思想升级一版：

```python
def parse_config_line(line):
    try:
        idx = line.index("=")
    except ValueError as e:
        raise ValueError(f"配置行 {line!r} 缺少 '=' 分隔符") from e
    key = line[:idx].strip()
    value = line[idx + 1:].strip()
    if not key:
        raise ValueError(f"配置行 {line!r} 的键为空")
    return key, value
```

同样三条输入的运行结果：

```text
通过: 'host' = '192.168.1.1'
通过: 'port' = '8080'
拒绝: 'broken line no equals' -> 配置行 'broken line no equals' 缺少 '=' 分隔符
```

升级点只有一处——**把"语法硬要求"直接写进错误消息**。这就是完整的强约束解析模板，三个组成部分各司其职：

- **定位关**：`index` 守住"分隔符必须存在"，缺失当场抛出
- **校验关**：位置拿到后的其他质量问题（键为空等）用显式 `raise` 表达
- **报告关**：调用方 try/except 单行环绕，好数据通过、坏数据带着完整原因被拒绝，批量处理不中断

扩展名解析是同一模板的 rindex 变体——分隔符从"必须存在"升级为"必须是**最后一个**点"：

```python
def split_filename(name):
    dot = name.rindex(".")        # 文件名可以有很多点, 扩展名认最后一个
    return name[:dot], name[dot + 1:]

for name in ["report.txt", "photo.2026.final.jpg", "README"]:
    try:
        stem, ext = split_filename(name)
        print(f"{name!r} -> {stem!r} + {ext!r}")
    except ValueError:
        print(f"{name!r} -> 拒绝: 无扩展名, 按需求非法")
```

运行结果：

```text
'report.txt' -> 'report' + 'txt'
'photo.2026.final.jpg' -> 'photo.2026.final' + 'jpg'
'README' -> 拒绝: 无扩展名, 按需求非法
```

`'photo.2026.final.jpg'` 三个点只认最后一个——主名 `'photo.2026.final'` 完整保留；`'README'` 没有点，`rindex` 直接抛出，走拒绝分支。URL 校验则展示了"定位一次、切分两段"的高效形态：

```python
def split_scheme(url):
    idx = url.index("://")        # 定位 + 校验一次完成
    scheme = url[:idx]
    rest = url[idx + 3:]          # '://' 长度 3, 越过整个分隔符
    if not scheme:
        raise ValueError(f"URL {url!r} 缺少协议名")
    return scheme, rest

for url in ["https://example.com/path", "ftp://192.168.0.1/files", "example.com/only-host"]:
    try:
        scheme, rest = split_scheme(url)
        print(f"通过: {scheme!r} + {rest!r}")
    except ValueError:
        print(f"拒绝: {url!r} 不是合法 URL")
```

运行结果：

```text
通过: 'https' + 'example.com/path'
通过: 'ftp' + '192.168.0.1/files'
拒绝: 'example.com/only-host' 不是合法 URL
```

`index("://")` 一次调用同时完成"校验协议头存在"与"量出切分点"两件事——`idx + 3` 利用分隔符已知长度跳过它本身。**"这一次调用里同时藏着校验和定位"是 index 在解析场景高效的本质**：不需要一个 `in` 先检查、再一个查找取位置，一遍扫描全部办完。
### 3.3 柔性定位：用 find，不用 index

镜像的另一面：预期内会大量缺失的场景，index 反而是麻烦制造者。扫关键词做热度统计——没有关键词是常态：

```python
comments = ["强烈推荐购入！", "一般般吧", "性价比还行，也推荐"]

# 不推荐: index 版 —— 预期内的大量缺失, 全靠 try/except 消化,
# 循环的重心跑偏到"怎么别让它炸"
hits = 0
for c in comments:
    try:
        c.index("推荐")
        hits += 1
    except ValueError:
        pass
print(hits)

# 推荐: find 版 —— -1 就是"没有", 一句判断与语义严丝合缝
hits = sum(1 for c in comments if c.find("推荐") != -1)
print(hits)
```

运行结果：

```text
2
2
```

两种写法统计结果一致，但清晰度天差地别。index 版要求读者在 try/except 的嵌套里穿行才能找到真正的意图（`hits += 1`）；find 版一行表达式直说了"带`推荐`字样的评论数"。**当"缺失"在场景里是日常而非事故，异常机制就从报警器变成了噪音源**——每一次正常的缺失都触发一次"抛出-捕获"的完整流程，代码为高频路径套上了防御铠甲。此时 -1 不是陷阱，而是 find 家族与你达成的契约：它就是这个语义里的"没有"，`!= -1` 读起来毫无歧义。

### 3.4 try 范围最小化、except 类型精确化

处理环绕的尺度同样讲究。看"大 try"如何把不相关的错误一并吞掉：

```python
log_line = "ERROR disk usage 95%"

# 不推荐: try 包住一大片逻辑, 这一个 except 会吞掉范围内所有的 ValueError
try:
    level, message = log_line.split(" ", 1)
    watermark = float(message)        # 这一行抛的是 ValueError —— 但不是查找的锅
    print(level, watermark)
except ValueError:
    print("只当是查找失败处理 -> 把类型转换错误也吞了, 排查方向全错")

# 推荐: try 只包 index 一行, except 的职责边界清晰
level, message = log_line.split(" ", 1)
try:
    stamp = log_line.index("95%")
except ValueError as e:
    raise ValueError(f"日志行缺少水位标识: {log_line!r}") from e
print(f"级别 {level!r}, 水位标识在索引 {stamp}")
```

运行结果：

```text
只当是查找失败处理 -> 把类型转换错误也吞了, 排查方向全错
级别 'ERROR', 水位标识在索引 17
```

大 try 版本的病灶：`float("disk usage 95%")` 抛出的 `ValueError`（类型转换失败）与 index 找不到的 `ValueError` 是**同一个类型**——大范围的 except 无法区分它们，转换错误被"查找失败"的分支吞掉，报出来的信息引导排查者走向完全错误的方向。小 try 版本只围住 index 一行，except 精确对这一个调用负责；其余代码在 try 外面自由工作，抛什么异常都原样上抛。**"try 的范围 = 你愿意且有能力解释的失败范围"**——超出解释能力的范围放进 try 内，就是把错误处理权拱手让给运气。

### 3.5 方法选择决策速查表

把选型结论收进一张速查表：

| 需求 | 首选写法 |
|------|----------|
| 只判断有没有 | `sub in s` |
| 数子串出现次数 | `s.count(sub)` |
| 取位置——缺失正常，拿 -1 自己分支 | `s.find(sub)` / `s.rfind(sub)` |
| 取位置——缺失即错误，需当场拦截 | `s.index(sub)` / `s.rindex(sub)` + `try/except` |
| 找最后一处（扩展名、路径末段、最后分隔符） | `s.rindex(sub)` |
| 定位全部出现位置 | `index` + `start` 推进，`ValueError` 作终止信号 |
| 只在某个区间内查找 | `s.index(sub, start, end)`，不切片省一次拷贝 |
| 强格式解析（配置行、URL、文件名） | `index` 定位 + `raise` 转译 + 调用方逐行报告 |

使用心法一句话：**先回答"缺失是不是错误"，写法自动浮出水面**——答案是"不是"，find 家族；答案是"是"，index 家族加一套完整的异常处理；压根不需要位置，in 与 count。
## 4. 原理

### 4.1 为什么找不到要抛异常：哨兵值方案的不可行

`index` 找不到时为什么非要抛异常？为了看清这个设计，先试着替它设计"不抛异常"的方案，看每种方案各自的致命伤。

**方案一：返回 -1（find 的路线）**。-1 恰恰是 Python 里一个**合法的负索引**——`s[-1]` 是最后一个字符；参与运算时 `-1 + 1 = 0`，`s[-1 + 1:]` 切出整串。拿它表示"没找到"，等于把失败伪装成一种正常数据：

```python
# 若 index 也返回 -1，这两步都会"成功"
idx = s.index("missing")     # 拿到 -1
tail = s[idx + 1:]            # 切出整个字符串，垃圾数据静默诞生
sub = s[idx]                  # 取出最后一个字符，给出悄悄错掉的答案
```

失败无法渗透进正常路径？恰恰相反——它渗透得悄无声息。负索引的存在让 -1 从"哨兵"变成了"陷阱"。

**方案二：返回 None**。调用方对"查找成功"的期待是拿到一个整数索引——`s[idx:...]`、`idx + len(sub)` 这些算式全建立在"`idx` 是 int"之上。返回 None 意味着**每一次使用前都要先判空**，否则把 None 带进算式就是新的 TypeError。int 与 None 的类型混乱，把一次检查分散成了调用点的无数次检查。

**方案三：抛异常（index 的路线）**。"成功"与"失败"被彻底分置两条通道——返回值通道里**只有 int**，类型干净、算式放心；失败走异常通道，中断执行、携带堆栈、强制处理。失败不占用返回值的带宽，也无法伪装成任何数据。对"失败必须被当回事"的语义来说，这是唯一两头都干净的方案。

更巧妙的是，这个设计与整个 Python 生态的 API 约定严丝合缝——**"严格版抛异常，容错版给默认值"是 Python 元素级 API 的通用模式**：

| 返回目标 | 严格版（失败抛异常） | 容错版（失败给默认） |
|------|------|------|
| 序列里元素的位置 | `list.index` / `tuple.index` → `ValueError` | 自行用 `in` 判断或循环查找 |
| 字符串里子串的位置 | `str.index` / `str.rindex` → `ValueError` | `str.find` / `str.rfind` → `-1` |
| 字典里键对应的值 | `dict[key]` → `KeyError` | `dict.get(key, 默认值)` → 默认值 |

同一个家族、同一个约定：**需要容错语义时，永远存在一个"失败给默认"的孪生方法**；而严格版的存在，是给"失败不该被低声下气地咽下"的语义留的正式通道。理解了 `dict[key]` 与 `dict.get` 的取舍，你在 `str.index` 与 `str.find` 之间做选择时会发现逻辑完全同构——语言的设计在用同一个声音说话。

### 4.2 fail-fast 与 EAFP：两套错误处理世界观

index 的异常行为背后，是 Python 社区两套成对出现的错误处理思想：

- **LBYL**（Look Before You Leap，三思而后行）：行动前先检查——先 `in` 确认存在，再取位置
- **EAFP**（Easier to Ask Forgiveness than Permission，请求宽恕比请求许可更容易）：直接行动，失败了用异常机制接住——直接 `index`，用 `ValueError` 处理缺失

EAFP 被认为是更 Python 化的风格，理由有三：其一，**性能**——检查往往就是行动本身的重复，`in` 扫一遍、`index` 再扫一遍，代价双倍；EAFP 只为实际发生的失败付费。其二，**成功路径干净**——常见情形（数据是好的）就是主线代码本身，异常分支退居补丁位置，读代码时第一眼看到的全是"正事"。其三，**消除时间窗**——在"检查"与"行动"两步之间，对象状态理论上可能被改变（并发场景）；EAFP 把检查与行动合并为一个原子步骤，根本不存在时间窗。字符串不可变、单线程下 LBYL 与 EAFP 行为等价，但在文件、数据库、网络这些会"动"的世界里，EAFP 的正确性是天然的。

index 家族正是 EAFP 在字符串查找领域的**实体化**——如果没有"会抛异常的版本"，EAFP 就只是空谈：工具从不失败，你也就无从"请求宽恕"。

把 fail-fast 的完整价值链画成一张图：

```text
                       index 找不到时发生了什么

调用 index ──→ 内部扫描无命中 ──→ 抛 ValueError
                                      │
                       ┌──────────────┴──────────────┐
                       ↓                             ↓
                 有 try/except 接住              没有 try 接住
                       │                             │
                 转译成业务错误               程序当场中断
                 （哪条数据坏了、               堆栈直达问题行
                  为什么坏了、                  第一时间暴露
                  期望什么格式）
                       │                             ↓
                       └──→ 坏数据被拦截在这一层，永远到不了下游的存储与分析
```

坏数据的两种结局——被接住并转译上报，或者顶穿执行流立即中断——共同点是**都不会以数据的面目流向下游**。这正是 fail-fast 的定义：错误止步于发生地，而非污染沿途。

### 4.3 实现与性能：index 是 find 的严格版

在 CPython 的实现里，`str.index` 与 `str.find` 的关系可以用一句话概括：**先按 find 的方式搜索，搜不到再抛异常**。两个方法调用同一套子串搜索算法，index 只是在算法返回 -1 之后多了一个动作——按索引家族的规则抛 `ValueError`。

这个实现关系有两个直接推论：

1. **性能特征完全一致**。成功时 index 不比 find 快，失败时也不比 find 慢——它们扫的是同一片区间、跑的是同一套算法。找不到时两者都要把候选区间扫完才能宣布失败，这是所有子串搜索的共同代价，与抛不抛异常无关；异常构造的开销只在失败那一刻发生一次，与扫描本身相比可以忽略。
2. **选型是纯粹的语义决策**。既然性能同源，你选择 index 还是 find 的全部理由就只剩一条：**缺失在你的场景里是什么**。正常状态选 find，数据错误选 index——没有第三种考量。

负责任地收束这个设计回顾：index 并不是"更好的 find"，find 也不是"打折扣的 index"——它们是**同一套搜索能力**在两种失败语义上的投影。一个山峰朝北坡与朝南坡的投影，山还是同一座山；理解了这一点，四个方法（find/rfind/index/rindex）在你眼里就只剩两个自由度：**方向**（左到右还是右到左）与**失败语义**（柔性还是强约束）。

## 5. 总结

本文围绕 `index` 与 `rindex` 方法展开，主要介绍了以下内容：

- `index`/`rindex` 是 `str` 的定位方法：`index` 从左向右返回子串**首次**出现的索引，`rindex` 从右向左返回**最后一次**出现的索引；签名 `s.index(sub[, start[, end]])`，返回值是子串**左端点**的绝对索引
- 多次出现时 `index` 认最左、`rindex` 认最右——文件名扩展名、多级路径末段这类"取最后一段"的需求必须用 `rindex`；子串只出现一次时两者返回值一致
- 返回索引直接联动切片体系：左端点 + 子串长度还原子串、越过子串取后续内容是最常用的两把刀；`rindex` 后记得 `+1` 越过分隔符
- `start`/`end` 限定查找区间：语义对齐切片（右开、越界收紧、负数支持），返回值是**绝对索引**——相对位置必须自己 `idx - start`；区间查找比"切片再找"省一次字符串拷贝
- 核心身份：**找不到抛 `ValueError: substring not found`**——与 `find` 返回 -1 是两条失败语义的分岔，成功路径上两套方法完全等价；异常消息不携带子串内容（安全立场），转译补上下文是工程必修动作
- `-1` 是合法负索引，能把失败渗透成整串切片、末字符取值的静默错乱；index 的异常让它当场中断、堆栈直指问题行——fail-fast 让错误止步于发生地
- 失败控制流的模式：try 块只放成功路径、except 只放对策；`from None` 斩断无价值的原始链、`from e` 保留现场挂到 `__cause__`；吞异常返回默认值是亲手废掉 index 唯一优势；捕获必须精确点名 `ValueError`，让别人的病穿越你的 except
- LBYL（先 `in` 后 `index`，双倍扫描）与 EAFP（直接 `index`，异常接失败）对照：字符串上 EAFP 胜在扫描一遍与成功路径干净；**有了会抛异常的版本，EAFP 才有趁手工具**
- 选型三分法：纯存在判断用 `in`、纯计数用 `count`、位置需求再回答"缺失正不正常"——正常用 `find`/`rfind`，错误用 `index`/`rindex` 加 try/except 转译
- 强约束解析模板定型：`index` 定位（校验与定位一次完成）+ `raise` 转译业务错误 + 调用方逐行 try/except 独立报告；配置行、扩展名、URL 校验是三大经典应用
- `index` + `start` 推进可定位全部出现位置，`ValueError` 充当循环的天然终止信号——EAFP 最漂亮的用法之一
- 设计原理：-1 方案受困于负索引的合法性、None 方案制造类型破洞，异常是唯一让"位置"与"失败"彻底分道的方案；"严格抛异常、容错给默认"与 `dict[key]` vs `dict.get` 一脉相承；实现上 index 是 find 的严格版——同源算法、同种性能，**选型只关乎语义，无关性能**
