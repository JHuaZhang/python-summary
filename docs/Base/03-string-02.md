---
group:
  title: 【03】字符串介绍
  order: 3
order: 2
title: 索引与切片
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是索引与切片

索引(indexing)与切片(slicing)是访问序列(字符串、列表、元组等)元素的两种基本方式。**索引用于取单个元素**——`s[i]` 取序列第 `i` 个位置的字符(对字符串)或元素(对列表)。**切片用于取一段子序列**——`s[a:b]` 取从 `a` 到 `b`(不含 `b`)的一段。它们是处理序列数据最高频的操作,Python 的切片语法尤其强大,简洁到一行能完成其他语言需要循环才能做的事。

```python
s = "hello"
# 索引:取单个字符
print(s[0])      # h —— 第 0 个字符
print(s[-1])     # o —— 倒数第 1 个(负索引)
# 切片:取一段
print(s[1:4])    # ell —— 索引 1 到 3(不含 4)
print(s[:3])     # hel —— 从头到 2
print(s[2:])     # llo —— 从 2 到尾
print(s[::2])    # hlo —— 步长 2(每隔一个取)
```

本篇以**字符串**为主线讲解索引与切片(本大章节是字符串深度剖析),但索引与切片是 Python 所有序列类型(str/list/tuple/range/bytes)的通用操作——语法完全一致,规则统一。理解了字符串的索引切片,也就掌握了 list/tuple 的索引切片(只是元素类型不同)。这是 Python 的优雅之处——一套序列协议,所有序列通用。

```python
# 索引切片语法对 str/list/tuple 通用
"hello"[1:3]    # 'el'(str 切片)
[1,2,3,4][1:3]  # [2, 3](list 切片)
(1,2,3,4)[::2]  # (1, 3)(tuple 切片)
```

索引与切片的差异不仅在"取单 vs 取段",更在结果类型与越界行为:

- **索引 `s[i]`**:返回**单个元素**(str 返回单字符 str,list 返回元素),越界抛 `IndexError`。
- **切片 `s[a:b]`**:返回**同类型子序列**(str 切片还是 str,list 切片还是 list),**越界自动截断不报错**(优雅容错)。

```python
s = "hello"
print(s[0])        # h(单字符 str)
print(s[0:1])      # h(长度1的 str,切片结果)
print(type(s[0]), type(s[0:1]))   # 都 <class 'str'>,但 s[0] 是字符 s[0:1] 是子串
# 越界
# s[10]            # IndexError(索引越界报错)
print(s[0:100])    # hello(切片越界自动截断,不报错)
```

这种"索引严格(越界报错)、切片宽松(越界截断)"的不对称,是 Python 切片设计的核心特点——切片做"取一段,有就取多少算多少"(安全容错),索引做"取指定一个,没有就错"(严格)。

本篇要系统讲透索引与切片:索引(正/负)、切片语法(`[start:stop:step]` 三参数)、省略与默认值、步长(含负步长反转)、切片越界容错、切片赋值(对可变序列)、切片对象 `slice` 与 `__getitem__`、切片与不可变字符串(总是新建)、常见切片模式(取头/尾/反转/隔行)。本篇是字符串操作的地基——后续 split/strip/find/replace 等都建立在索引切片的序列模型上。

### 1.2 索引:正索引与负索引

先讲索引(取单元素)。Python 序列的索引有两套:**正索引**(从 0 开始,从左往右)和**负索引**(从 -1 开始,从右往左)。两套等价,选哪个看方便。

**正索引(0 起)**:

```python
s = "hello"
#  0    1    2    3    4   —— 正索引
# 'h' 'e' 'l' 'l' 'o'
print(s[0])   # h
print(s[1])   # e
print(s[2])   # l
print(s[4])   # o(最后一个,索引 = 长度-1)
# s[5]        # IndexError(越界,长度 5,索引 0-4)
```

正索引从 0 开始(非 1,这是编程惯例),`s[0]` 是首元素,`s[len(s)-1]` 是末元素。越界(≥ len)抛 `IndexError`。

**负索引(-1 起)**:

```python
s = "hello"
#  -5   -4   -3   -2   -1  —— 负索引
# 'h' 'e' 'l' 'l' 'o'
print(s[-1])  # o(倒数第 1)
print(s[-2])  # l(倒数第 2)
print(s[-5])  # h(倒数第 5,即首元素)
# s[-6]       # IndexError(越界)
```

负索引从 -1 开始(末元素),`s[-1]` 是末,`s[-len(s)]` 是首。负索引与正索引等价:``s[-1]` 等价 `s[len(s)-1]`。负索引的实用价值:**从末尾取元素方便**——不需求长度,`s[-1]` 直接取末尾,比 `s[len(s)-1]` 简洁。

```python
# 取末元素:负索引比正索引简洁
last = s[-1]          # o(不需 len)
last = s[len(s)-1]    # o(需 len,啰嗦)
# 文件名取扩展名
filename = "report.csv"
ext = filename[-3:]   # csv(后3字符,负索引切片)
```

**正负索引的换算**:`s[i]`(i 负)等价 `s[len(s) + i]`。`s[-1]` = `s[5 + (-1)]` = `s[4]` = 'o'。理解换算,正负索引可自由选用。

```python
s = "hello"
print(s[-1], s[len(s)-1])    # o o(等价)
print(s[-3], s[5-3])         # l l(等价)
```

**索引越界**:

```python
s = "hello"   # 长度 5
# 正索引越界:≥ 5
# s[5]    # IndexError: string index out of range
# s[10]   # IndexError
# 负索引越界:< -5
# s[-6]   # IndexError
# s[-100] # IndexError
```

索引越界(正 ≥ len,负 < -len)抛 `IndexError: string index out of range`。这是索引"严格"的体现——取不到就报错,不静默返回 None。处理可能越界的索引需 try/except 或先判长度。

### 1.3 切片速览

讲清索引后,给切片全貌速览。切片语法 `s[start:stop:step]`,三参数都可省,极灵活:

```python
s = "hello world"
print(s[0:5])      # hello —— [0,5)
print(s[:5])       # hello —— start 省略(默认 0)
print(s[6:])       # world —— stop 省略(默认末尾)
print(s[:])        # hello world —— 全省略(整个副本)
print(s[::2])      # hlowrd —— step 2(隔一个取)
print(s[::-1])     # dlrow olleh —— step -1(反转!)
print(s[6:-1])     # worl —— 负索引 stop
print(s[-5:-1])    # worl —— 负索引区间
```

几个关键:

- `start:stop` 是**左闭右开**`[start, stop)`——含 start 不含 stop。
- 三参数都可省,`[:]` 是整串副本,`[::2]` 是步长切片。
- `[::-1]` 是经典反转(步长 -1,从尾到头)。
- 切片支持负索引(`s[-5:-1]`)。
- 切片越界自动截断(`s[0:100]` 不报错,截到末尾)。

切片的"左闭右开"设计精妙——`s[a:b]` 与 `s[b:c]` 拼接正好是 `s[a:c]`(`s[0:3] + s[3:6]` = `s[0:6]`),边界不重叠不遗漏。这让切片"拼接友好",是左闭右开的设计动因。

后续章节展开切片的完整规则、步长、越界、赋值等。

### 1.4 索引 vs 切片的本质差异

为聚焦,先点明索引与切片的几处本质差异,这些是初学最易混的:

**结果类型不同**:

```python
s = "hello"
print(s[0])       # h —— 单字符 str(索引)
print(s[0:1])     # h —— 长度1的 str(切片)
# 都是 str,但语义不同:索引取"一个元素",切片取"一段子序列"(长度可为1或0)
print(s[2:2])     # ''(空串,长度0 切片,合法)
# s[5]            # IndexError(索引越界报错)
print(s[5:5])     # ''(切片越界,空串不报错)
```

索引取"一个元素"(str 里是一个字符的 str),切片取"一段子序列"(长度可 0/1/多)。`s[0]` 和 `s[0:1]` 值看似同(都 'h'),但概念不同:前者是"第 0 个元素",后者是"从 0 到 1 的子段"。

**越界行为不同**(最关键):

```python
s = "hello"   # 长度 5
# 索引越界:报错
# s[10]      # IndexError
# 切片越界:截断(不报错)
print(s[0:100])   # hello(截到 5)
print(s[10:20])   # ''(空,起点越界)
print(s[3:100])   # lo(从 3 截到 5)
```

索引越界抛 `IndexError`,切片越界**自动截断到有效范围,不报错**。这是核心差异——切片设计为"取一段,有多少取多少"(容错),索引设计为"取指定一个,没有就错"(严格)。这让切片适合"不确定长度时取头/尾"(安全),索引适合"确知位置取元素"(严格)。

**对可变序列(列表)的赋值差异**:

```python
lst = [1, 2, 3, 4, 5]
# 索引赋值:替换单个元素
lst[0] = 99        # [99, 2, 3, 4, 5]
# 切片赋值:替换一段(长度可不等!)
lst[1:3] = [20, 30, 40, 50]   # [99, 20, 30, 40, 50, 4, 5](替换 2 个为 4 个,长度变)
# 字符串不可变,无赋值(索引/切片赋值都 TypeError)
# s[0] = "H"    # TypeError(str 不可变)
# s[0:1] = "H"  # TypeError
```

对可变序列(list),索引赋值替换单个元素,切片赋值替换一段(且替换段长度可与原段不等,改变列表长度)。对字符串(不可变),索引/切片赋值都抛 TypeError(字符串不可变,只能新建不能改)。本篇虽以字符串为主,但切片赋值在 list 上极强大,§2.5 详述。

理解索引与切片的本质差异(结果类型、越界行为、赋值能力),就抓住切片"安全容错+灵活强大"的设计精髓,避免初学混淆。后续展开完整规则。

---

## 2. 核心内容

本章详解索引与切片的完整用法。每节遵循"规则 → demo → 陷阱 → 场景"展开。切片三参数、步长、切片赋值是重点。

### 2.1 切片基础:左闭右开与边界

切片基本语法 `s[start:stop]`,取 `[start, stop)` 区间——含 start 不含 stop(**左闭右开**):

```python
s = "hello"
# 索引: 0:'h' 1:'e' 2:'l' 3:'l' 4:'o'
print(s[1:4])    # ell —— 索引 1,2,3(含1不含4)
print(s[0:3])    # hel —— 索引 0,1,2
print(s[2:5])    # llo —— 索引 2,3,4
```

`s[1:4]` 取索引 1、2、3(三个元素),不取 4。左闭右开:左端 start 包含,右端 stop 不包含。

**左闭右开的设计优势——拼接友好**:

```python
s = "hello world"
# s[a:b] + s[b:c] == s[a:c](边界不重叠不遗漏)
print(s[0:5] + s[5:11])    # hello + world = hello world = s[0:11]
# 这种"切两段拼接复原"的特性,源于左闭右开边界
```

左闭右开让 `s[a:b]` 和 `s[b:c]` 在 b 处衔接不重叠不遗漏,拼接复原 `s[a:c]`。这让切分字符串(如切行、切字段)方便——边界值复用。若右闭(`[a,b]`),两段会在 b 重叠,需调整。

**切片长度**:`s[a:b]` 长度 = `b - a`(当 0 ≤ a ≤ b ≤ len):

```python
s = "hello world"   # 长度 11
print(len(s[0:5]))    # 5 = 5 - 0
print(len(s[3:8]))    # 5 = 8 - 3
print(len(s[6:11]))   # 5 = 11 - 6
# 切片长度 = stop - start(正向,无越界时)
```

切片长度 = `stop - start`(正向、无越界)。这是估算切片结果的快捷心算。

**stop 等于 start(空切片)**:

```python
print(s[3:3])    # ''(空串,start == stop,长度 0)
print(s[0:0])    # ''
# 合法,返回空序列,不报错
```

`start == stop` 得空切片,合法(不报错)。常用于"占位"或边界计算。

**start 大于 stop(正向得空)**:

```python
print(s[3:1])    # ''(start > stop,正向空)
# 正向切片 start > stop 时,无元素可取,得空
```

正向切片 `start > stop` 得空(无元素满足"从 start 到 stop"且 start≤index<stop)。要"反向取"需负步长(§2.3)。

### 2.2 切片的省略与默认值

切片三参数 `start:stop:step` 都可省,省略时取默认值。这是切片灵活性的来源。

**省略 start(默认从头)**:

```python
s = "hello world"
print(s[:5])     # hello —— start 省略,默认 0,等价 s[0:5]
print(s[:11])    # hello world —— 等价 s[0:11]
print(s[:])      # hello world —— start/stop 都省,整个副本
```

`s[:stop]` 省略 start,默认从头(0)开始。`s[:]` 省略 start 和 stop,取整个序列——**这常用于创建副本**(浅拷贝):

```python
# s[:] 创建副本(str 不可变,但 list/tuple 是浅拷贝副本)
original = [1, 2, 3]
copy = original[:]    # 浅拷贝
copy[0] = 99
print(original)       # [1, 2, 3](原未改,副本独立)
```

`s[:]` 对 list 是浅拷贝(创建新 list),对 str(不可变)虽也是"取整串"但不需副本意义(str 无需拷贝)。这是 list 复制的惯用法。

**省略 stop(默认到尾)**:

```python
print(s[6:])     # world —— stop 省略,默认到末尾
print(s[0:])     # hello world —— 等价 s[0:11]
# s[start:] 取从 start 到末尾
```

`s[start:]` 省略 stop,默认取到末尾。常用于"取后缀"(如文件扩展名 `filename[-3:]`)。

**省略 step(默认 1)**:

```python
print(s[0:5])     # hello —— step 省略,默认 1
print(s[0:5:1])   # hello —— 显式 step 1,等价
# step 默认 1(逐个取)
```

step 省略默认 1(逐个取,正向)。`s[a:b]` 等价 `s[a:b:1]`。

**三参数都省 `s[::]`**:

```python
print(s[::])     # hello world —— 全省,等价 s[:]
# s[::] 等价 s[:],整个副本
```

`[::]` 三参数全省,等价 `[:]`,整个序列。

**省略的边界——越界自动截断**:省略的"默认到头/尾"配合"越界截断",让切片极宽容:

```python
s = "hello"   # 长度 5
print(s[:100])    # hello(stop 100 越界,截到 5)
print(s[2:100])   # llo(从 2 截到 5)
print(s[100:])    # ''(start 100 越界,空)
print(s[-100:3])  # hel(start -100 截到 0,到 3)
```

切片越界(start/stop 超出范围)**自动截断到有效范围**,不报错。`s[:100]` 截到末尾 5,`s[100:]` start 越界得空。这种容错让切片"取头N个""取后N个"等操作安全(不需先判长度):

```python
# 取前 N 个(无需判长度,N 超长自动截断)
print(s[:3])      # hel(前 3)
print(s[:100])    # hello(N=100 超长,自动取全部)
# 这比索引安全(s[100] 会 IndexError,而 s[:100] 不会)
```

切片"取前 N 个" `s[:N]`、"取后 N 个" `s[-N:]` 安全(越界截断),比索引 `s[N]`(越界报错)宽容。这是切片容错的实用价值。

### 2.3 步长 step:含负步长反转

步长(step)是切片第三参数,控制"每 step 个取一个",让切片能"隔行取"甚至"反向取"。

**正步长(隔行取)**:

```python
s = "hello world"
print(s[::2])     # hlowrd —— step 2,每隔一个取(索引 0,2,4,6,8,10)
print(s[::3])     # hlwl —— step 3(索引 0,3,6,9)
print(s[1::2])    # el ol —— 从 1 开始 step 2(索引 1,3,5,7,9)
print(s[0:11:2])  # hlowrd —— start:stop:step 全显式
```

`step=2` 每隔一个取一个(取索引 0,2,4,...)。`step=n` 每 n 个取一个。常用于"隔行采样""取偶/奇位"。

**负步长(反向取)**:

```python
s = "hello"
print(s[::-1])    # olleh —— step -1,从尾到头(经典反转!)
print(s[::-2])    # olh —— step -2,反向每隔一个(索引 4,2,0)
print(s[4:0:-1])  # oll —— 从 4 反向到 1(含4不含0,步长-1)
print(s[-1:-6:-1])# olleh —— 负索引 + 负步长,反转
```

⚠️ **负步长的关键**:step 为负时,**start 应大于 stop**(从大索引往小索引走)。`s[4:0:-1]` 从 4 到 1(stop 0 不含),反向。若 step 负但 start < stop,得空:

```python
print(s[0:4:-1])  # ''(step 负但 start<stop,反向无元素,空)
# 反向应 start > stop
print(s[4:0:-1])  # oll(start 4 > stop 0,反向取)
```

`[::-1]` 是经典反转——start/stop 都省(step 负时默认 start=len-1、stop=前),step -1 反向逐个,得反转序列。这是 Python 反转字符串/列表最优雅的写法。

```python
# 反转的惯用法
text = "hello"
print(text[::-1])      # olleh(反转字符串)
nums = [1, 2, 3]
print(nums[::-1])      # [3, 2, 1](反转列表,新对象,不改原)
# 注意:[::-1] 创建反转副本,不改原;list.reverse() 就地反转改原
```

⚠️ **`[::-1]` vs `.reverse()` vs `reversed()`**:

```python
# [::-1]:创建反转副本(新对象,不改原),适用 str/list/tuple
s = "hello"
r = s[::-1]    # olleh(s 不变)
# .reverse():list 方法,就地反转(改原,返回 None)
lst = [1, 2, 3]
lst.reverse()    # lst 变 [3,2,1],返回 None
# reversed():内置函数,返回反转迭代器(惰性,不改原)
lst = [1, 2, 3]
print(list(reversed(lst)))   # [3, 2, 1](lst 不变)
```

三种反转:`[::-1]`(切片,新副本)、`.reverse()`(list 方法,就地)、`reversed()`(迭代器,惰性)。按"是否改原""是否需列表""性能"选:不可变 str/tuple 只能 `[::-1]`/`reversed()`;可变 list 改原用 `.reverse()`,不改原用 `[::-1]` 或 `reversed()`。

**步长的常见用法**:

```python
# 取偶数位(索引 0,2,4,...)
s = "abcdef"
print(s[::2])    # ace(偶数位)
# 取奇数位(索引 1,3,5,...)
print(s[1::2])   # bdf(奇数位)
# 反转
print(s[::-1])   # fedcba
# 反向隔行
print(s[::-2])   # fdb
# 删除首尾(中间段)
print(s[1:-1])   # bcde(去首尾)
```

步长让切片表达"隔行""反转"等复杂取样,一行完成。

**step 不能为 0**:

```python
# s[::0]   # ValueError:slice step cannot be zero
# step 0 无意义(不前进),Python 禁止
```

step 为 0 抛 `ValueError`(无意义,禁止)。step 必须非 0(正或负)。

### 2.4 负索引切片与越界容错

切片支持负索引,且越界自动截断。这两条让切片极宽容,本节详述。

**负索引切片**:切片的 start/stop 都可用负索引(从末尾计数):

```python
s = "hello world"   # 长度 11
#  0...10 正索引,-11...-1 负索引
print(s[-5:])      # world —— 后 5 个(stop 省略,默认末尾)
print(s[-5:-1])    # worl —— 索引 -5 到 -2(含 -5 不含 -1)
print(s[-5:11])    # world —— 负 start 正 stop 混用
print(s[6:-1])     # worl —— 正 start 负 stop 混用
print(s[:-1])      # hello worl —— 去末尾(从头到倒数第2)
print(s[:-6])      # hello —— 去后 6 个
```

负索引切片常用于"取后 N 个"(`s[-N:]`)、"去掉末尾"(`s[:-1]`)等从末尾计数的场景,不必计算长度。

```python
# 取后 N 个(不需长度)
filename = "report.csv"
print(filename[-3:])   # csv(后 3,扩展名)
# 去末尾字符(如去换行符)
line = "hello\n"
print(line[:-1])       # hello(去末尾 \n)
```

**越界自动截断**:切片的 start/stop 超出范围,自动截到有效边界,**不报错**:

```python
s = "hello"   # 长度 5
# stop 越界(>len):截到 len
print(s[0:100])    # hello(stop 100 → 5)
print(s[3:100])    # lo(stop 100 → 5)
# start 越界(>len):空
print(s[100:200])  # ''(start 越界,空)
print(s[100:])     # ''
# start 负越界(<-len):截到 0
print(s[-100:3])   # hel(start -100 → 0)
print(s[-100:])    # hello(start -100 → 0)
# stop 负越界:截到 0(空,若 stop 负越界小于 start)
print(s[2:-100])   # ''(stop -100 → 0,2 到 0 正向空)
```

截断规则:超出范围的 start/stop 被"夹"到有效区间 `[0, len]`(或反向时 `[len-1, -1]`),然后取。这保证切片永不抛 IndexError(除非 step=0)——总返回某段(可能空)。

**截断的实际简化**:这让"取前 N""取后 N"等操作无需判长度:

```python
# 取前 N(超长自动取全部)
s = "hello"
print(s[:10])      # hello(N=10 > len 5,自动取全部,不报错)
# 对比索引:s[10] 会 IndexError
# 故"安全取前 N"用切片 s[:N],不越界
```

` s[:N]` 取前 N,即使 N 超长也安全截断(不报错),而 `s[N-1]`(索引)可能 IndexError。故"可能越界的取头尾"用切片更安全。

**索引 vs 切片越界对比**:

```python
s = "hello"
# 索引越界:报错
try:
    s[10]
except IndexError as e:
    print(f"索引越界: {e}")   # 索引越界: string index out of range
# 切片越界:截断(不报错)
print(s[10:])    # ''(空)
print(s[:10])    # hello(截断到全部)
# 索引严格(确知位置取元素),切片宽容(取段有就取)
```

理解负索引切片与越界容错,就理解切片"安全灵活"的全部边界——它总返回某段(可能空),不报越界错,适合"取头尾""取后N"等可能超长的安全操作。

### 2.5 切片赋值(可变序列)

字符串不可变,索引/切片赋值都报错(TypeError)。但切片赋值在**可变序列(list)**上极强大,本节讲清(虽本大章节是字符串,但切片赋值是 list 核心操作,且与切片语法一脉相承)。

**字符串不可赋值**(TypeError):

```python
s = "hello"
# s[0] = "H"      # TypeError:'str' object does not support item assignment
# s[0:1] = "H"    # TypeError
# str 不可变,任何"修改"都需新建(s = "H" + s[1:])
s = "H" + s[1:]   # Hello(新建,非赋值)
```

字符串不可变,索引/切片赋值都 TypeError。要"改"字符串只能新建拼接。

**list 索引赋值(替换单个)**:

```python
lst = [1, 2, 3, 4, 5]
lst[0] = 99         # [99, 2, 3, 4, 5](替换单个)
lst[-1] = 99        # [99, 2, 3, 4, 99](负索引赋值)
# 长度不变(替换单个)
```

list 索引赋值替换单个元素,长度不变。越界仍 IndexError。

**list 切片赋值(替换一段,长度可变!)**:切片赋值的强大在于——**替换段长度可与原段不等**,改变 list 长度:

```python
lst = [1, 2, 3, 4, 5]
# 等长替换
lst[1:3] = [20, 30]       # [1, 20, 30, 4, 5](替换 2 个为 2 个)
# 变长替换(变长)
lst[1:3] = [20, 30, 40, 50]   # [1, 20, 30, 40, 50, 4, 5](替换2个为4个,长度+2)
# 变短替换(变短)
lst = [1, 2, 3, 4, 5]
lst[1:4] = [99]          # [1, 99, 5](替换3个为1个,长度-2)
# 删除(替换为空)
lst = [1, 2, 3, 4, 5]
lst[1:3] = []            # [1, 4, 5](删除索引1-2)
# 插入(替换空段为元素)
lst = [1, 2, 3]
lst[1:1] = [99, 98]      # [1, 99, 98, 2, 3](在索引1前插入)
```

切片赋值的四大用途:等长替换、变长替换(扩/缩)、删除(赋空)、插入(对空段赋值)。它把"替换/删除/插入一段"统一为"切片赋值",极灵活。

```python
# 切片赋值统一操作
lst = [1, 2, 3, 4, 5]
lst[1:4] = [99]    # 替换+删除(3个→1个)
lst[0:0] = [0]     # 头部插入(空段赋值)
lst[-1:] = [5, 6]  # 末尾追加(替换末元素为多个)
lst[:] = [9, 9]    # 整体替换(s[:] 替换全部内容,改原 list)
```

**带步长的切片赋值**:步长切片赋值时,**替换段长度必须等于原段长度**(严格):

```python
lst = [0, 1, 2, 3, 4, 5]
# step=2 切片赋值,替换段长度须 == 原段长度(3)
lst[::2] = [10, 20, 30]    # [10, 1, 20, 3, 30, 5](替换索引0,2,4)
# lst[::2] = [10, 20]      # ValueError!步长切片赋值长度必须匹配(3 != 2)
```

带步长的切片赋值(`s[::n] = ...`)要求替换段长度严格等于被替换段长度(因步长跳取的元素离散,不能变长),否则 ValueError。无步长切片赋值才允许变长。

**字符串的"切片赋值"替代法**:字符串不可变,需用新建模拟:

```python
s = "hello"
# 模拟 s[0:1] = "H"(替换首字符)
s = "H" + s[1:]      # Hello(新建)
# 模拟删除首尾 s[1:-1]
s = s[1:-1]          # ell(切片新建)
# 字符串"修改"本质都是切片+拼接新建
```

字符串的"切片替换/删除"通过"切片+拼接"新建实现(因不可变)。理解切片赋值在 list 的强大(变长替换/删除/插入),对比字符串的"新建模拟",就理解可变/不可变序列的切片操作差异。

### 2.6 slice 对象与综合示例

切片 `s[a:b:c]` 在内部创建一个 `slice` 对象,传给序列的 `__getitem__`。理解 `slice` 对象,能动态构造切片、自定义类支持切片。

**`slice` 对象**:`s[a:b:c]` 等价 `s[slice(a, b, c)]`:

```python
s = "hello world"
# s[2:8:2] 等价 s[slice(2, 8, 2)]
sl = slice(2, 8, 2)
print(s[sl])      # loo(等价 s[2:8:2])
print(sl.start, sl.stop, sl.step)   # 2 8 2(slice 对象的三属性)
# slice 可存变量,动态构造切片
```

`slice(start, stop, step)` 创建切片对象,有 `.start`/`.stop`/`.step` 属性。`s[sl]` 用 slice 对象切片,等价 `s[a:b:c]`。slice 对象让"切片作为参数传递/存储"可行:

```python
# 动态切片:根据条件选不同切片
def get_part(s, mode):
    if mode == "head":
        sl = slice(0, 3)       # 前3
    elif mode == "tail":
        sl = slice(-3, None)   # 后3
    else:
        sl = slice(None)       # 全部
    return s[sl]
print(get_part("hello world", "head"))   # hel
print(get_part("hello world", "tail"))   # rld
```

slice 对象用于"参数化切片"——把切片规则作参数传递/存储,比传 a/b/c 三参数清晰。

**自定义类支持切片**:自定义序列类实现 `__getitem__` 接受 int 或 slice:

```python
class MySeq:
    def __init__(self, data): self.data = data
    def __getitem__(self, key):
        if isinstance(key, slice):
            # 切片:key 是 slice 对象,用其 start/stop/step
            return self.data[key.start:key.stop:key.step]
        else:
            # 索引:key 是 int
            return self.data[key]
seq = MySeq("hello")
print(seq[1:4])    # ell(__getitem__ 收 slice)
print(seq[0])      # h(__getitem__ 收 int)
```

`__getitem__` 收到 int(索引)或 slice(切片)对象,自定义类据类型分别处理。这是自定义序列支持索引切片的协议(详见面向对象专题)。

**综合示例:切片模式大全**:

```python
s = "Hello, World!"

# 1. 取头/尾
print(f"前3: {s[:3]}")          # Hel
print(f"后3: {s[-3:]}")         # ld!

# 2. 去头/尾
print(f"去首: {s[1:]}")         # ello, World!
print(f"去尾: {s[:-1]}")        # Hello, World
print(f"去首尾: {s[1:-1]}")     # ello, World

# 3. 步长取样
print(f"隔行: {s[::2]}")        # Hlo ol!
print(f"偶数位: {s[1::2]}")     # el,Wrd

# 4. 反转
print(f"反转: {s[::-1]}")       # !dlroW ,olleH

# 5. 越界截断(安全)
print(f"前100: {s[:100]!r}")    # 'Hello, World!'(截断)
print(f"100后: {s[100:]!r}")    # ''(空)

# 6. 负索引区间
print(f"倒数5到2: {s[-5:-2]}")  # orl

# 7. 删指定字符(切片拼接)
print(f"去首字母: {'H' + s[1:] if False else s[1:]}")  # ello, World!

# 8. list 切片赋值(对比可变序列)
lst = [1, 2, 3, 4, 5]
lst[1:3] = [20, 30, 40]    # 变长替换
print(f"list 切片赋值: {lst}")   # [1, 20, 30, 40, 4, 5]
lst[::2] = [0, 0, 0, 0]    # 步长赋值(长度匹配)
print(f"步长赋值: {lst}")        # [0, 20, 0, 40, 0, 5]

# 9. slice 对象
sl = slice(0, 5, 2)
print(f"slice 对象: {s[sl]}")    # Hlo

# 10. 字符串"替换"用新建(不可变)
old = "hello"
new = "H" + old[1:]   # 模拟 old[0]='H'
print(f"字符串替换: {old} → {new}")   # hello → Hello
```

跑一遍这段示例,对照输出:取头尾/去头尾、步长/隔行、反转、越界截断、负索引区间、list 切片赋值(变长/步长)、slice 对象、字符串新建替换——索引与切片的全貌就清晰了。

核心结论:**索引取单个(正/负,越界报错),切片取一段(左闭右开 [start:stop:step],三参数可省,step 表步长/反转,越界截断不报错),切片结果同类型子序列,list 切片赋值可变长替换/删除/插入,str 不可变用新建模拟,slice 对象可参数化切片**。

---

## 3. 最佳实践

### 3.1 取末元素/后 N 个用负索引,不需求长度

```python
s = "hello"
# 推荐:负索引
last = s[-1]          # o(不需求 len)
tail3 = s[-3:]        # llo(后3)
# 避免:正索引 + len
# last = s[len(s)-1]
# tail3 = s[len(s)-3:]
```

取末元素 `s[-1]`、取后 N 个 `s[-N:]`,负索引不需求长度,简洁。文件扩展名(`filename[-3:]`)、去换行(`line[:-1]`)等从末尾计数的场景用负索引。

### 3.2 取前 N 个用切片 [:N],越界安全

```python
s = "hello"
# 推荐:切片取前 N(越界截断,安全)
head3 = s[:3]         # hel
head100 = s[:100]     # hello(N 超长自动截断,不报错)
# 避免:索引取前 N(越界报错)
# s[2]   # OK,但 s[100] IndexError
# 故"取前 N"用切片,不用索引
```

"取前 N 个"用切片 `s[:N]`,N 超长自动截断(不报错),比索引 `s[N-1]`(越界 IndexError)安全。取后 N 同理 `s[-N:]`。

### 3.3 反转用 s[::-1],不改原

```python
# 推荐:[::-1] 创建反转副本(不改原,适用 str/list/tuple)
rev = s[::-1]
# list 就地反转用 .reverse()(改原,返回 None)
lst.reverse()
# 需迭代反转(惰性)用 reversed()
for x in reversed(lst): ...
# 别混:s[::-1] 是新对象,.reverse() 改原,reversed() 是迭代器
```

三种反转按需选:`[::-1]`(新副本,通用)、`.reverse()`(list 就地改原)、`reversed()`(迭代器惰性)。不可变 str/tuple 只能 `[::-1]`/`reversed()`。别混用。

### 3.4 字符串不可变,"修改"用切片+拼接新建

```python
s = "hello"
# 字符串不可变,不能 s[0]='H'
# 改首字符:切片+拼接
s = "H" + s[1:]      # Hello
# 删首尾:s[1:-1]
# 替换一段: s[:a] + new + s[b:]
# 大量"修改"用 list 缓冲或 StringIO
```

字符串不可变,索引/切片赋值都 TypeError。"修改"靠切片+拼接新建。大量修改用 list 收集后 join,或 io.StringIO。

### 3.5 list 切片赋值做插入/删除/替换,比单独方法统一

```python
lst = [1, 2, 3, 4, 5]
# 插入(空段赋值)
lst[1:1] = [99]      # [1, 99, 2, 3, 4, 5]
# 删除(赋空)
lst[1:3] = []        # 删除一段
# 替换(变长)
lst[1:2] = [20, 30]  # 替换+扩
# 比 .insert/.remove/.extend 统一,且支持"一段"操作
# 但步长切片赋值长度须匹配
```

list 切片赋值统一"插入/删除/替换一段",比 .insert/.remove 等单独方法灵活(尤其"一段"操作)。注意步长切片赋值(`[::n]=`)长度须严格匹配。

### 3.6 切片结果是新对象(浅拷贝),改切片不影响原

```python
lst = [[1, 2], [3, 4]]
sub = lst[:1]        # [[1, 2]](切片是浅拷贝新 list)
sub[0] = [99]        # 改 sub 的元素(替换引用)
print(lst)           # [[1,2],[3,4]](原未变,sub 是新 list)
# 但浅拷贝:sub[0] 与 lst[0] 若是同一对象,改其内部会互相影响
sub = lst[:1]
sub[0][0] = 99       # 改 sub[0] 内部(与 lst[0] 同对象)
print(lst)           # [[99,2],[3,4]](内部被改,浅拷贝共享)
```

切片是浅拷贝(新容器,元素引用共享)。改切片的"元素引用"(sub[0]=x)不影响原,但改"元素内部"(sub[0][0]=x)影响原(浅拷贝共享元素)。深独立用 copy.deepcopy。详见《变量赋值机制》。

### 3.7 [:] 创建副本,浅拷贝惯用法

```python
# list 浅拷贝惯用法
copy = lst[:]        # 等价 lst.copy()/list(lst)
# 字符串 s[:] 也"取整"但 str 不可变无需拷贝(str 共享无风险)
# 注:lst[:] 与 lst.copy() 等价,选哪个看风格
```

`lst[:]` 是 list 浅拷贝惯用法(等价 `.copy()`)。创建独立副本(浅),避免共享引用。str 不可变,`s[:]` 无拷贝意义(但语法合法)。

### 3.8 步长切片注意负步长方向(start > stop)

```python
# 正步长:start < stop
s[0:5]      # 正向
s[::2]      # 正向隔行
# 负步长:start > stop(从大到小)
s[4:0:-1]   # 反向(4到1)
s[::-1]     # 全反转(start/stop 省,负步长默认尾到头)
# 负步长但 start < stop → 空
# s[0:4:-1]   # ''(方向矛盾,空)
```

负步长时 start 须大于 stop(从大索引往小走),否则空。`[::-1]` 全反转(省略时负步长默认从尾到头)。注意方向,避免"负步长 + start<stop 得空"的意外。

### 3.9 step 不能为 0,负步长反向前注意 start/stop 默认

```python
# s[::0]   # ValueError(step 不能 0)
# 负步长省略 start/stop:s[::-1] 默认 start=len-1,stop=前(反转全部)
# 负步长显式:s[4:1:-1] 从 4 到 2(不含1)
```

step 不能为 0(ValueError)。负步长省略 start/stop 时,start 默认 len-1(末)、stop 默认"前"(反向到头),故 `[::-1]` 全反转。

### 3.10 用 slice 对象参数化切片,清晰传递

```python
# 切片规则作参数:用 slice 对象
def process(data, region):
    # region 是 slice 对象,如 slice(0, 10) 或 slice(-5, None)
    return data[region]
head = slice(0, 5)
print(process(s, head))    # 前5
# 比传 (start, stop, step) 三参数清晰,slice 对象直接 data[sl]
```

切片规则需作参数/存储时,用 `slice` 对象(直接 `data[sl]`),比传三参数 (start,stop,step) 清晰,且支持 None(省略)语义。

### 3.11 索引可能越界用 try/except 或先判长度,切片不用

```python
s = "hello"
# 索引可能越界:try/except 或先判
try:
    c = s[10]
except IndexError:
    c = ""    # 默认
# 或
c = s[10] if len(s) > 10 else ""
# 切片越界自动截断,无需判
sub = s[10:]   # ''(空,不报错)
sub = s[:10]   # hello(截断)
# 故"可能越界取段"用切片,安全
```

索引可能越界时,try/except 或先判长度。切片越界自动截断(不报错),无需判——"取前/后 N 可能超长"用切片更安全简洁。

### 3.12 切片拼接复原 s[a:b]+s[b:c]==s[a:c](左闭右开优势)

```python
s = "hello world"
# 左闭右开让切分拼接复原
part1 = s[0:5]    # hello
part2 = s[5:11]   # world
print(part1 + part2 == s[0:11])   # True(拼接复原)
# 利用:按字段切分,边界复用
fields = [s[0:5], s[5:11], s[11:]]   # 切三段,边界复用
```

左闭右开让 `s[a:b] + s[b:c] == s[a:c]`(边界 b 复用不重叠不遗漏)。按字段切分时边界值复用,拼接复原。这是左闭右开的设计优势。

---

## 4. 原理

本章讲清索引与切片的底层机制:序列协议(`__getitem__`/`__len__`)、slice 对象的创建与传递、切片越界截断的算法、负索引的换算、切片为何创建新对象(浅拷贝)、字符串切片的不可变新建、步长切片的取元素算法。这些是"索引切片为何如此"的根基。

### 4.1 序列协议与 __getitem__(需理解,详述)

索引与切片的底层是 Python 的**序列协议**(sequence protocol)——序列类型实现 `__getitem__` 和 `__len__`,解释器据此支持 `s[i]`/`s[a:b]` 语法。

**`__getitem__` 接收 int 或 slice**:

```python
# s[i] 内部:调 s.__getitem__(i)
# s[a:b:c] 内部:先创建 slice(a,b,c),再调 s.__getitem__(slice对象)
print("hello".__getitem__(0))        # 实际方法(等价 s[0])
sl = slice(1, 4)
print("hello".__getitem__(sl))       # ell(等价 s[1:4])
```

`s[i]` 调用 `s.__getitem__(i)`(i 是 int);`s[a:b:c]` 先把 `a:b:c` 包装成 `slice(a,b,c)` 对象,再调 `s.__getitem__(slice对象)`。序列的 `__getitem__` 据参数类型(int/slice)分别处理:

- int:取单元素(按索引,越界 IndexError)。
- slice:取子序列(按 slice 的 start/stop/step,越界截断)。

```python
# 自定义 __getitem__ 示意
class MySeq:
    def __init__(self, data): self.data = data
    def __getitem__(self, key):
        if isinstance(key, int):
            if key < -len(self.data) or key >= len(self.data):
                raise IndexError("out of range")
            return self.data[key]      # 索引
        elif isinstance(key, slice):
            return self.data[key]      # 切片(委托给底层)
```

序列通过 `__getitem__` 统一处理索引(int)与切片(slice)。这是 Python 序列协议的关键——索引和切片是同一协议的两种参数形式。

**`__len__` 与索引验证**:索引越界检查依赖 `__len__`——`s[i]` 若 `i >= len(s)` 或 `i < -len(s)` 抛 IndexError。`len(s)` 由 `__len__` 提供。

**`__getitem__` 与 `for` 迭代**:有趣的是,只实现 `__getitem__`(int 索引)的类,`for` 也能迭代——Python 对无 `__iter__` 的类,`for` 用 `__getitem__(0)`、`__getitem__(1)`、... 直到 IndexError 停止。这是旧的迭代协议(现推荐 `__iter__`)。这侧面说明 `__getitem__` 是序列的基础协议。

理解序列协议(`__getitem__` 收 int/slice、`__len__` 支持越界检查),就理解索引与切片的实现根源——它们不是独立语法,是 `__getitem__` 协议的两种参数。

### 4.2 slice 对象的创建与传递(需理解,详述)

§2.6 提到切片创建 slice 对象,这里讲清其完整机制。

**切片表达式的求值**:`s[a:b:c]` 的求值过程:

1. Python 解析 `a:b:c` 为切片表达式。
2. 创建 `slice(a, b, c)` 对象(start=a, stop=b, step=c,任一可为 None 表示省略)。
3. 调用 `s.__getitem__(slice对象)`。
4. 序列的 `__getitem__` 用 slice 对象的 start/stop/step 取子序列。

```python
# s[1:4] 的求值
# 1. 创建 slice(1, 4, None)(step None 表默认1)
# 2. 调 s.__getitem__(slice(1,4,None))
# 3. str.__getitem__ 据 slice 取 s[1:4]
sl = slice(1, 4, None)
print(sl.start, sl.stop, sl.step)   # 1 4 None
print("hello"[sl])                  # ell(等价 "hello"[1:4])
```

slice 对象的三属性 `.start`/`.stop`/`.step`,省略的参数为 `None`。`s[1:4]` 的 slice 是 `slice(1, 4, None)`(step 省略为 None,运行时默认 1)。`s[::2]` 的 slice 是 `slice(None, None, 2)`(start/stop 省略为 None)。

**省略用 None 表示**:`s[:b]`(start 省)的 slice 是 `slice(None, b, None)`,`s[a::c]`(stop 省)是 `slice(a, None, c)`。None 在序列 `__getitem__` 里被解释为"默认"(start 默认 0、stop 默认 len、step 默认 1)。

```python
sl = slice(None, 4, None)    # s[:4] 的 slice
print(sl.start)    # None(省略)
# 序列 __getitem__ 把 None 当默认:start→0, stop→len, step→1
```

**slice 对象的可复用性**:slice 对象是普通对象,可存变量、传参、复用:

```python
HEAD = slice(0, 3)        # 前3 切片规则
TAIL = slice(-3, None)    # 后3
def process(data):
    return data[HEAD], data[TAIL]   # 复用 slice
```

slice 对象让"切片规则"成为一等公民(可存储/传递/复用),比每次写 `s[0:3]` 更参数化。

**slice 与 indices 方法**:slice 对象有 `.indices(length)` 方法,把切片(含 None/负值)针对指定长度解析为具体 (start, stop, step)(都已规范化为正、无越界):

```python
sl = slice(None, None, -1)    # [::-1] 的 slice
print(sl.indices(5))          # (4, -1, -1)(长度5:start=4,stop=-1,step=-1)
# indices 把省略/负值规范化,并处理越界
sl2 = slice(-3, 100, 2)
print(sl2.indices(5))         # (2, 5, 2)(start-3→2, stop100截5, step2)
```

`.indices(length)` 把 slice 针对 length 解析为具体三参数(处理 None、负索引、越界截断),返回 (start, stop, step)。自定义 `__getitem__` 实现切片时可用 `.indices` 规范化,避免手写边界逻辑。这是 slice 对象的高级用途。

理解 slice 对象(切片表达式创建 slice、省略为 None、可复用、`.indices` 规范化),就理解切片的运行时表示与自定义序列支持切片的方式。

### 4.3 越界截断的算法(需理解,详述)

§2.4 讲了切片越界截断,这里讲清其算法——切片如何把越界的 start/stop 截到有效范围。

**截断算法(正步长)**:对 `s[start:stop:step]`(step > 0),处理 start/stop 越界:

1. start 若 None → 0;若 < 0 → start + len(转正);若仍 < 0 → 0(负越界截到 0);若 > len → len(正越界截到 len,空)。
2. stop 若 None → len;若 < 0 → stop + len(转正);若仍 < 0 → 0;若 > len → len。
3. 取索引从 start 到 stop(不含),每 step 个。

```python
s = "hello"   # len 5
# s[0:100]:start 0,stop 100→截5;取 [0,5) → "hello"
# s[100:200]:start 100→截5,stop 200→5;取 [5,5) → ""(空)
# s[-100:3]:start -100+5=-95→仍负→截0;取 [0,3) → "hel"
# s[2:-100]:stop -100+5=-95→仍负→截0;取 [2,0) → ""(空,2>0)
```

截断把 start/stop 夹到 `[0, len]`,再取 `[start, stop)`(正步长)。这保证切片永不越界报错——超出的边界被夹到 0 或 len,取有效部分。

**负步长的截断**:step < 0 时,start/stop 的默认与截断方向不同:

1. start 若 None → len-1(末);若 < 0 → start+len;若 > len-1 → len-1(截末)。
2. stop 若 None → "前"(stop 到 -1 表到头,概念);若 < 0 → stop+len;处理使 stop 在合适位置。
3. 从 start 反向到 stop(不含 stop),每 |step| 个。

```python
s = "hello"   # len 5
# s[::-1]:step-1,start None→4,stop None→-1(到头);取 4,3,2,1,0 → "olleh"
# s[4:0:-1]:start4,stop0;取 4,3,2,1(不含0)→ "oll"
```

负步长时 start 默认末(len-1)、stop 默认"前",反向取。截断同样夹到有效范围。

**为何切片容错而索引严格**:切片截断算法保证"总返回某段"(空或非空),不报越界——因切片语义是"取一段,有多少取多少",越界截断符合语义。索引则"取指定一个",无元素即错(IndexError)——索引严格保证"取到确切的那个"。这语义差异决定行为差异:切片宽容(取段),索引严格(取单)。

```python
# 切片:越界截断(取段,容错)
s[0:100]   # hello(截断)
# 索引:越界报错(取单,严格)
# s[100]   # IndexError
```

理解截断算法(start/stop 夹到 [0,len]、正负步长方向、为何切片容错而索引严格),就理解切片"永不越界报错"的机制根源——截断算法把越界边界夹到有效范围,符合"取段"的容错语义。

### 4.4 切片为何创建新对象(浅拷贝)

切片总返回**新对象**(同类型子序列),而非原序列的视图。这与 NumPy 的"视图切片"不同,Python 切片是拷贝(浅)。

**切片创建新对象**:

```python
lst = [1, 2, 3, 4, 5]
sub = lst[1:4]      # [2, 3, 4](新 list 对象)
print(sub is lst)   # False(不同对象)
sub[0] = 99         # 改 sub
print(lst)          # [1,2,3,4,5](原未变,sub 独立)
```

`lst[1:4]` 创建新 list([2,3,4]),与 lst 不同对象。改 sub 不影响 lst(外层独立)。这是切片"拷贝"语义——总产生新容器。

**浅拷贝(元素引用共享)**:虽外层容器是新,但元素是**引用拷贝**(浅)——若元素是可变对象,改元素内部会影响原:

```python
lst = [[1, 2], [3, 4], [5, 6]]
sub = lst[0:2]      # [[1,2],[3,4]](新 list,元素是 lst[0]/lst[1] 的引用)
sub[0][0] = 99      # 改 sub[0] 内部(sub[0] 与 lst[0] 同对象)
print(lst)          # [[99,2],[3,4],[5,6]](lst[0] 内部被改!浅拷贝共享)
```

`sub[0]` 与 `lst[0]` 是同一对象(浅拷贝共享元素引用),改 `sub[0][0]` 影响 `lst[0]`。这是浅拷贝——外层独立、内层共享。深独立(内外全独立)用 `copy.deepcopy`。

**为何切片是拷贝而非视图**:Python 序列(str/list/tuple)切片选择拷贝(浅)而非视图(像 NumPy)。原因:

1. **简单性**:拷贝语义直观——切片是新序列,改它不影响原(外层)。视图语义复杂(改切片影响原,需理解共享)。
2. **不可变序列(str/tuple)无视图意义**:str/tuple 不可变,切片必须新建(无法"视图"不可变数据)。为统一,str/list/tuple 切片都新建(拷贝)。
3. **list 切片拷贝的性能取舍**:list 切片拷贝有 O(k) 开销(k 切片长度),但保证了"切片独立"的简单语义。NumPy 为性能用视图(大数据不拷贝),但增加共享复杂度。Python list 选择简单(拷贝)。

```python
# Python 切片拷贝(独立),NumPy 切片视图(共享)
lst = [1,2,3]; sub = lst[:]; sub[0]=9   # lst 不变(拷贝)
# import numpy as np; a=np.array([1,2,3]); b=a[:]; b[0]=9  # a 变 [9,2,3](视图)
```

理解切片是浅拷贝(新容器、元素引用共享、改外层不影响原/改内层影响原、NumPy 视图不同),就理解切片结果的独立性与共享边界,及需深拷贝的场景。

### 4.5 字符串切片的不可变新建

字符串切片与 list 切片机制相似(创建新 str),但因 str 不可变,有特殊性。

**字符串切片新建 str**:

```python
s = "hello"
sub = s[1:4]      # "ell"(新 str 对象)
print(sub is s)   # False(不同对象)
# str 不可变,切片新建的 str 也不可变
```

字符串切片创建新 str(子串)。因 str 不可变,新 str 也不可变,无"改切片影响原"问题(str 本就不能改)。

**字符串切片的内存优化**:虽切片新建 str,但 CPython 对短子串可能有内部优化(如引用原 str 的字符数据区间,非真正复制),但这属实现细节,语义上是"新 str 对象"。对使用者,切片是 O(k)(k 切片长度)新对象。

```python
# 语义:切片是新 str
s = "hello"
sub = s[1:3]    # "el"(新 str)
# 实现可能优化(共享原字符数据),但 id(sub) != id(s),是不同对象
print(sub is s)   # False
```

**字符串"修改"为何必须新建**:str 不可变,索引/切片赋值都 TypeError。"修改"靠切片+拼接新建:

```python
s = "hello"
# 改首字符:新建("H" + s[1:])
new = "H" + s[1:]   # Hello(新对象)
# 这每次都新建,O(n)
# 大量"修改"应转 list(可变)处理,再 join 回 str
```

字符串"修改"(替换/删除/插入字符)每次新建 str,O(n)。大量修改应转 list(可变,`list(s)` 后改 list 元素,O(1) 改),最后 `"".join(list)` 回 str。这是处理大量字符串修改的标准优化:

```python
# 大量修改:str → list(可变)→ 改 → join 回 str
s = "hello"
chars = list(s)        # ['h','e','l','l','o'](可变)
chars[0] = "H"         # O(1) 改 list
chars.append("!")
result = "".join(chars)   # Hello!(join 回 str)
# 比 s = "H" + s[1:] + "!"(多次新建 O(n))高效
```

理解字符串切片的新建(不可变、新建 str、修改靠新建、大量修改转 list),就理解字符串操作的性能特性与"为何 str 修改慢、要转 list"的优化根源。

### 4.6 步长切片的取元素算法

§2.3 讲了步长,这里讲清取元素的算法——按 step 间隔取索引。

**正步长取元素**:`s[start:stop:step]`(step > 0),取索引 `start, start+step, start+2*step, ...`,直到 `< stop`:

```python
s = "abcdefgh"   # 索引 0-7
# s[::2]:start0,stop8,step2 → 索引 0,2,4,6 → "aceg"
# s[1::3]:start1,stop8,step3 → 索引 1,4,7 → "beh"
# 算法:从 start,每 +step,直到 >= stop
```

正步长:索引序列 start, start+step, ...,直到 ≥ stop(不含)。`s[::2]` 取偶数索引。

**负步长取元素**:step < 0,取索引 start, start+step(减小),直到 > stop:

```python
s = "hello"   # 索引 0-4
# s[::-1]:start4,stop-1,step-1 → 索引 4,3,2,1,0 → "olleh"
# s[4:1:-1]:start4,stop1,step-1 → 索引 4,3,2(不含1)→ "oll"
# 算法:从 start,每 +step(减小),直到 <= stop(不含)
```

负步长:索引从 start 反向(减小 |step|),直到 ≤ stop(不含)。stop 在反向时是"下界"(不含)。

**step 与元素数**:切片元素数 = `len(range(start, stop, step))`(切片与 range 同构):

```python
s = "abcdefgh"   # len 8
# s[1:7:2]:等价 range(1,7,2) = [1,3,5],3 个元素
print(s[1:7:2])   # bdf(3 个)
print(len(range(1, 7, 2)))   # 3
# 切片元素数 = range(start,stop,step) 的长度
```

切片的元素索引 = `range(start, stop, step)` 的值(range 同构)。故切片元素数 = `len(range(start, stop, step))`。这揭示了切片与 range 的本质联系——切片是"按 range 的索引取元素"。

**step 的方向与结果**:

- step > 0:start < stop 时非空(正向),start ≥ stop 空。
- step < 0:start > stop 时非空(反向),start ≤ stop 空。

```python
s = "hello"
print(s[0:4:1])   # hell(step1,正向,start<stop,非空)
print(s[0:4:-1])  # ''(step-1,反向,但 start<stop,空)
print(s[4:0:-1])  # oll(step-1,反向,start>stop,非空)
print(s[4:0:1])   # ''(step1,正向,但 start>stop,空)
```

step 方向与 start/stop 大小关系决定非空:同向(step 正 & start<stop,或 step 负 & start>stop)非空,反向空。这是步长切片"方向匹配"的算法规则。

理解步长切片算法(按 step 取索引、与 range 同构、方向匹配决定非空),就理解步长切片的取元素逻辑,及"负步长 start<stop 得空"的方向根源。

---

## 5. 总结

### 5.1 本文内容回顾

- **索引与切片定义**:索引取单个元素(越界 IndexError),切片取一段子序列(越界截断不报错);序列通用语法(str/list/tuple 一致)。
- **索引**:正索引(0 起)、负索引(-1 末,等价 `len+i`);越界(正≥len,负<-len)抛 IndexError;负索引取末/后N 方便(不需求 len)。
- **切片基础**:左闭右开 `[start,stop)`(含 start 不含 stop,拼接友好 `s[a:b]+s[b:c]==s[a:c]`);长度 `stop-start`;start==stop 空;start>stop 正向空。
- **省略与默认**:start 省→0、stop 省→len、step 省→1;`[:]` 整个副本(浅拷贝惯用法);越界自动截断(start/stop 夹到 [0,len],不报错)。
- **步长 step**:正步长隔行取(`[::2]`),负步长反向(`[::-1]` 反转,负步长需 start>stop);step 不能 0;三种反转对比(`[::-1]` 副本/`.reverse()` 就地/`reversed()` 迭代器)。
- **负索引切片与越界容错**:切片支持负索引(`s[-N:]` 后N、`s[:-1]` 去尾);越界截断(取前N `s[:N]` 安全,索引 `s[N]` 越界报错);切片宽容 vs 索引严格。
- **切片赋值(可变 list)**:list 索引赋值替换单个(长度不变);切片赋值替换一段(变长!等长/变长/删除/插入);步长切片赋值长度须严格匹配;str 不可变赋值 TypeError。
- **slice 对象**:切片创建 slice(start,stop,step)传 __getitem__;省略为 None;可复用/参数化;`.indices(len)` 规范化;自定义类 __getitem__ 支持 int/slice。
- **原理**:序列协议(__getitem__ 收 int/slice、__len__ 越界检查);slice 对象创建(切片表达式→slice对象→__getitem__)与省略(None)与 .indices;越界截断算法(start/stop 夹到 [0,len]、正负步长方向、切片容错 vs 索引严格的语义根源);切片浅拷贝(新容器、元素引用共享、改外层独立/改内层影响、NumPy 视图对比);字符串切片不可变新建(修改靠新建、大量修改转 list);步长算法(按 step 取索引、与 range 同构、方向匹配决定非空)。
- **最佳实践**:取末/后N 用负索引、取前N 切片安全、反转 `[::-1]` 不改原、str 修改用切片拼接、list 切片赋值统一操作、切片浅拷贝改内层影响原、`[:]` 浅拷贝惯用法、负步长方向、step 不为0、slice 对象参数化、索引越界 try/except 切片不用、左闭右开拼接复原。

### 5.2 读完本文你应能掌握

- 说明索引(正/负、越界报错)与切片(左闭右开、越界截断)的差异,正确使用 `s[i]` 与 `s[a:b:c]`。
- 用负索引取末/后N(`s[-1]`/`s[-N:]`),用切片 `s[:N]` 安全取前N(越界截断)。
- 用切片三参数 `start:stop:step` 与省略默认,用步长隔行(`[::2]`)与反转(`[::-1]`),区分三种反转方式。
- 说明切片越界截断(不报错)vs 索引越界报错的差异,按需选用。
- 对 list 做切片赋值(等长/变长/删除/插入),说明步长切片赋值长度须匹配;对 str 用切片拼接新建模拟"修改"。
- 用 slice 对象参数化切片(s[sl]),自定义类 __getitem__ 支持 int/slice。
- 阐述序列协议、slice 对象创建与传递、越界截断算法、切片浅拷贝、字符串不可变新建、步长取元素算法等原理。

### 5.3 延伸方向

- **字符串创建与驻留机制**:字符串的对象模型、不可变性根源,见《字符串创建与驻留机制》。
- **列表深度剖析**:list 的索引/切片/赋值的完整用法、list 专属切片操作,见《列表深度剖析》大章节。
- **序列协议与 __getitem__/__len__**:自定义序列类、抽象基类(Sequence/Iterable),见《类型判断与 type 系统》、面向对象专题。
- **变量赋值机制**:浅拷贝/深拷贝、切片浅拷贝的元素引用共享,见《变量赋值机制》。
- **split/strip/find/replace**:基于索引切片序列模型的具体字符串操作,见本大章节后续专题。
