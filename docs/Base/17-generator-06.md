---
group:
  title: 【17】生成器与迭代器
  order: 17
order: 6
title: itertools 常用工具
nav:
  title: Python
  order: 1
---

## 1. 介绍

### 1.1 什么是 itertools

`itertools` 是 Python 标准库中专门提供"迭代器构造工具"的模块。它把日常开发里高频出现的迭代模式——按步长计数、循环遍历、串联多个序列、对元素分组、做排列组合——抽象成一组用 C 实现的函数,每个函数接收可迭代对象、返回一个新的迭代器。

它和手写 `for` 循环或列表推导式的本质区别在于两点:一是**惰性求值**,所有函数都返回迭代器,不到真正被消费时不产生数据,处理超大或无限序列时不会把内存撑爆;二是**组合性强**,这些函数像积木一样可以彼此拼接,用几行代码就能表达原本需要嵌套循环加临时列表才能完成的逻辑。

简单说,当你发现自己在写"先建一个空列表、循环往里 append、再 return"这种套路时,大概率 itertools 里已经有一个现成函数替你把这件事做得更简洁、更省内存。

### 1.2 基本语法与最小用法

所有 itertools 函数的使用范式高度统一:传入可迭代对象(或函数),拿到一个迭代器。拿到后通常配合 `list()` 取回全部结果,或者直接在 `for` 里消费。

```python
import itertools

# 最小的例子:chain 把两个列表串成一个迭代器
it = itertools.chain([1, 2, 3], [4, 5, 6])
print(list(it))
# 输出:[1, 2, 3, 4, 5, 6]

# 返回的是迭代器而非列表,只能消费一次
print(list(it))
# 输出:[]  ← 上一次已经把迭代器耗尽
```

这段代码体现了 itertools 的两个基本事实:第一,函数返回的是迭代器对象,不是 list,需要用 `list()` 或 `for` 触发求值;第二,迭代器是一次性的,消费完就空了,需要重复使用时要重新构造或用 `tee` 复制(后文会讲)。

**模块结构一览**

itertools 的函数按功能大致分为四类,本篇按这个分类逐一讲解:

- **无限迭代器**:count、cycle、repeat——产生不会主动停止的迭代器。
- **有限迭代器**:chain、islice、takewhile、dropwhile、accumulate、starmap、zip_longest、compress、filterfalse、groupby、tee 等——对现有可迭代对象做转换或裁剪。
- **排列组合**:product、permutations、combinations、combinations_with_replacement——生成笛卡尔积或组合序列。
- ** recipes(combinatoric 的进阶等价写法)不是本篇重点**,但会在最佳实践中提到用现有函数组合出常用模式。

下面进入第二章,逐个讲解这些函数。

## 2. 核心内容

### 2.1 无限迭代器:count、cycle、repeat

这三个函数的共同特点是没有自然终点,会产生无限序列,因此**必须配合take、slice等"截断"手段使用**,否则 `for` 循环会永不停止。

#### 2.1.1 count(start, step) 无限计数

`itertools.count(start=0, step=1)` 返回一个从 `start` 开始、每次加 `step` 的无限迭代器。它等价于一个永不停止的 `range`,但 `step` 可以是浮点数甚至复数。

签名:`count(start=0, step=1)`

- `start`:起始值,默认 0。
- `step`:步长,默认 1,可为负数、浮点数。

使用场景:需要一个无限递增的编号序列时,比如给每条记录打自增 id,或者配合 `zip` 给列表元素编号但不想先算长度。

```python
import itertools

# 场景:给数据流打自增序号,只取前 5 个
for idx, value in zip(itertools.count(1), ["a", "b", "c", "d", "e"]):
    print(f"#{idx}: {value}")
# 输出:
# #1: a
# #2: b
# #3: c
# #4: d
# #5: e
```

这里 `zip` 在短的列表耗尽时自动停止,所以 `count` 的"无限"被安全截断——这是 count 最常见的搭配写法。

```python
# step 为浮点数:生成等差小数序列,取前 4 个
seq = itertools.count(0.0, 0.5)
print([next(seq) for _ in range(4)])
# 输出:[0.0, 0.5, 1.0, 1.5]

# step 为负数:倒计数
for n in itertools.islice(itertools.count(10, -2), 4):
    print(n)
# 输出:
# 10
# 8
# 6
# 4
```

**为什么不用 range?** `range` 必须指定 stop,无法表达"我需要多少还不确定、产生一个用一个"的语义。`count` 配合 `islice` 或 `zip` 正是为此而设计。

#### 2.1.2 cycle(iterable) 循环遍历

`itertools.cycle(iterable)` 把一个有限可迭代对象无限复制循环,到末尾后从头再来,永不停歇。和 `count` 一样需要外在截断。

签名:`cycle(iterable)`

- `iterable`:任意可迭代对象,会先被缓存到内存里以便反复输出。

使用场景:需要"轮流"(round-robin)处理时,比如多台服务器轮询、多个值班人轮班、节日按周期重复。

```python
import itertools

# 场景:三台服务器轮流接收请求,模拟前 7 个请求的分配
servers = ["server-A", "server-B", "server-C"]
pool = itertools.cycle(servers)
for req_id in range(1, 8):
    print(f"请求 {req_id} -> {next(pool)}")
# 输出:
# 请求 1 -> server-A
# 请求 2 -> server-B
# 请求 3 -> server-C
# 请求 4 -> server-A
# 请求 5 -> server-B
# 请求 6 -> server-C
# 请求 7 -> server-A
```

这就是典型的文件轮转 / 负载均衡轮询写法。注意 `cycle` 会把整个可迭代对象先存起来,如果传入的是个巨大列表要留意内存占用。

```python
# 场景:生成无限循环的颜色序列,用于给图表数据着色
colors = itertools.cycle(["#e41a1c", "#377eb8", "#4daf4a"])
for _, c in zip(range(4), colors):
    print(c)
# 输出:
# #e41a1c
# #377eb8
# #4daf4a
# #e41a1c
```

#### 2.1.3 repeat(elem, times) 重复

`itertools.repeat(elem, times=None)` 把同一个元素 `elem` 重复若干次。不传 `times` 则无限重复。

签名:`repeat(element, times=None)`

- `element`:要重复的对象,任意类型,重复的是同一个对象引用(不复制)。
- `times`:重复次数,省略则无限。

使用场景:常和 `map`、`starmap`、`zip` 配合,给某个函数固定一个参数,或生成一个定长常量序列。

```python
import itertools

# 场景:给列表每个元素都乘以同一个常数 10
# map(func, iterable1, iterable2) 按位取参数,repeat(10) 提供无限个 10
result = list(map(lambda x, k: x * k, [1, 2, 3], itertools.repeat(10)))
print(result)
# 输出:[10, 20, 30]

# 指定次数:生成 4 个 0,用作占位序列
print(list(itertools.repeat(0, 4)))
# 输出:[0, 0, 0, 0]
```

**repeat vs [elem]*n**:写 `[0] * 4` 同样能得到四个 0,而且更直观,这也是多数简单场景的推荐写法。`repeat` 的价值在于它返回迭代器、不预先占用列表内存,且能与 `map`、`starmap` 等接收多迭代器的函数天然搭配(因为 `map` 会按最短迭代器停止,`repeat` 不指定 `times` 时不会成为最短的那个)。

**无限迭代器截断小结**

由于这三个函数都是无限的,实际使用时几乎总要配一个截断机制:

```python
import itertools

# 截断手段一:islice 取前 N 个
print(list(itertools.islice(itertools.count(1), 5)))
# 输出:[1, 2, 3, 4, 5]

# 截断手段二:zip 配合有限序列
print(list(zip(["a", "b", "c"], itertools.cycle([1, 2]))))
# 输出:[('a', 1), ('b', 2), ('c', 1)]

# 截断手段三:指定 times
print(list(itertools.repeat("x", 3)))
# 输出:['x', 'x', 'x']
```

### 2.2 有限迭代器:串联、切片、过滤

这一组函数对已有的可迭代对象做"形状变换"——串联、切片、按条件取舍,它们本身不会无限产生数据,会随输入耗尽而停止。

#### 2.2.1 chain(*iterables) 串联多个迭代器

`itertools.chain(*iterables)` 把多个可迭代对象首尾相连,就像把几段水管接成一根。迭代时先消费第一个,耗尽后自动切到第二个,依此类推。

签名:`chain(*iterables)`

- `*iterables`:任意多个可迭代对象,位置参数传入。

使用场景:合并多个列表/生成器/文件行,但不想先在内存里拼成一个大列表。

```python
import itertools

# 场景:把三个部门的员工名单合并遍历,不去重不排序,只要顺序串联
sales = ["张三", "李四"]
tech = ["王五", "赵六", "钱七"]
hr = ["孙八"]
for name in itertools.chain(sales, tech, hr):
    print(name)
# 输出:
# 张三
# 李四
# 王五
# 赵六
# 钱七
# 孙八
```

**chain.from_iterable 的区别**

`chain` 要求每个被串联的对象作为独立位置参数传入。当被串联的对象本身装在一个容器里(比如一个列表的列表)时,用 `chain.from_iterable` 更合适:

```python
import itertools

# 假设分组数据嵌在一个列表里,数量不定
groups = [["a", "b"], ["c"], ["d", "e", "f"]]

# chain 需要解包,写起来啰嗦且必须知道有几个
flat1 = list(itertools.chain(groups[0], groups[1], groups[2]))

# chain.from_iterable 直接接收"可迭代对象的可迭代对象"
flat2 = list(itertools.chain.from_iterable(groups))
print(flat2)
# 输出:['a', 'b', 'c', 'd', 'e', 'f']
```

`chain.from_iterable` 接收单个可迭代对象(其中每个元素也是可迭代对象),等价于 `chain(*groups)`,但当 `groups` 是生成器或元素很多时,前者更安全——`*` 解包会先把外层序列完全展开,而 `from_iterable` 保持惰性。

#### 2.2.2 islice(iterable, start, stop, step) 迭代器切片

`itertools.islice(iterable, stop)` 或 `itertools.islice(iterable, start, stop, step)` 对迭代器做切片,行为类似列表的 `[start:stop:step]`,但**不支持下标索引、不支持负数索引**(因为迭代器只能向前)。

签名:`islice(iterable, [start,] stop[, step])`

- `iterable`:任意可迭代对象。
- `start`:起始位置(从 0 开始),默认 0。`start` 之前的元素会被消耗丢弃。
- `stop`:结束位置(不含),到此处停止。`None` 表示一直取到耗尽。
- `step`:步长,默认 1。

使用场景:对生成器、文件对象等无法用下标的迭代器做"取前 N 个"或"每隔 K 个取一个"。

**典型场景:分页遍历**

```python
import itertools

# 模拟一个返回大量数据的生成器(这里用 count 当替身)
def all_records():
    """模拟从数据库流式取出的记录,数量很大"""
    return itertools.count(1)

# 分页:每页 5 条,取第 2 页(即第 6~10 条)
page_size = 5
page_no = 2
start = (page_no - 1) * page_size
stop = page_no * page_size

page = list(itertools.islice(all_records(), start, stop))
print(page)
# 输出:[6, 7, 8, 9, 10]
```

注意 `islice` 会把 `start` 之前的元素也调用 `next` 消耗掉,只是不输出。所以上面的写法先把 1~5 取出来丢掉,再取 6~10。在大数据流上,跨越式分页(比如第 1000 页)会白白消耗前面所有元素,这是 islice 分页的局限——真正高效分页还是要在数据源层用 SQL `OFFSET`,islice 分页更适合"顺序翻页、每次接着上次位置继续"的场景。

```python
# step 用法:每隔 2 个取一个,取前 5 个结果
seq = range(1, 20)
picked = list(itertools.islice(seq, 0, None, 2))
print(picked)
# 输出:[1, 3, 5, 7, 9]
```

**islice vs 列表切片**

如果数据已经是 `list`,直接用 `lst[2:10:2]` 更简单清晰。`islice` 的价值只在于处理**不能下标**的迭代器(生成器、文件对象、`map`/`filter` 结果等)。用错地方只会降低可读性。

#### 2.2.3 takewhile / dropwhile 条件取/舍

这两个函数是一对:都在开头根据谓词函数判断,`takewhile` 取满足条件的开头段,`dropwhile` 跳过满足条件的开头段。

签名:
- `takewhile(predicate, iterable)`
- `dropwhile(predicate, iterable)`

- `predicate`:返回布尔值的函数,接收一个元素。
- `iterable`:可迭代对象。

关键语义:**只在序列开头判断**。`takewhile` 一旦遇到首个不满足条件的元素就立刻停止,后面满足的也不再取;`dropwhile` 一旦遇到首个不满足条件的元素就停止跳过、把剩余全部输出,不管后面是否还有满足条件的。

```python
import itertools

# takewhile:取开头连续 < 5 的段
data = [1, 3, 4, 2, 6, 7, 1]
print(list(itertools.takewhile(lambda x: x < 5, data)))
# 输出:[1, 3, 4, 2]
#   ↑ 到 6 时停止,后面那个 1 已经不会被取到

# dropwhile:跳过开头连续 < 5 的段,从首个 >=5 的元素开始全部输出
print(list(itertools.dropwhile(lambda x: x < 5, data)))
# 输出:[6, 7, 1]
#          ↑ 从 6 开始全要,1 虽然 <5 但已经过了判断阶段
```

**适用场景**

`takewhile` 适合处理"有序、开头有效、到某个界限后就该停"的数据,比如读取日志直到遇到第一个错误标记为止:

```python
import itertools

# 模拟按时间排序的日志行,遇到 ERROR 就停止读取(只取 ERROR 之前正常的)
logs = [
    "INFO  service start",
    "INFO  loading config",
    "INFO  ready",
    "ERROR something failed",
    "INFO  retrying",
]
for line in itertools.takewhile(lambda s: not s.startswith("ERROR"), logs):
    print(line)
# 输出:
# INFO  service start
# INFO  loading config
# INFO  ready
```

`dropwhile` 适合跳过开头一段"前导冗余",比如跳过文件开头的注释行:

```python
import itertools

config_lines = [
    "# 这是注释",
    "# 还是注释",
    "host=127.0.0.1",
    "port=8080",
    "# 这行注释在中间,不会被跳过",
]
for line in itertools.dropwhile(lambda s: s.startswith("#"), config_lines):
    print(line)
# 输出:
# host=127.0.0.1
# port=8080
# # 这行注释在中间,不会被跳过
```

中间那行注释没有被跳过,正体现了 `dropwhile` 只在开头判断的特性。如果想跳过所有注释,应当用内置 `filter` 而不是 `dropwhile`。

#### 2.2.4 accumulate(iterable, func) 累积

`itertools.accumulate(iterable, func=None, *, initial=None)` 对序列做累积运算,每一步把"上一步的累积结果"和"当前元素"一起传给 `func`,输出累积值序列。

签名:`accumulate(iterable, func=None, *, initial=None)`

- `iterable`:可迭代对象。
- `func`:二元函数 `func(accumulated, current) -> new_accumulated`。默认是 `operator.add`,即累加。
- `initial`:Python 3.8+ 新增,作为第一个累积值前置在结果开头,使结果长度比输入多 1。

使用场景:算累计和、累计最大值、累计乘积、运行平均等"扫描式"统计。

```python
import itertools
import operator

# 默认:累计求和
daily_sales = [120, 80, 200, 150]
print(list(itertools.accumulate(daily_sales)))
# 输出:[120, 200, 400, 550]
#       120, 120+80=200, 200+200=400, 400+150=550

# 用 operator.mul:累计乘积
print(list(itertools.accumulate([1, 2, 3, 4, 5], operator.mul)))
# 输出:[1, 2, 6, 24, 120]
# 阶乘效果

# 用 max:截至目前的最大值
print(list(itertools.accumulate([3, 1, 4, 1, 5, 9, 2], max)))
# 输出:[3, 3, 4, 4, 5, 9, 9]
```

**用 initial 前置初始值**

```python
import itertools

# 计算"从 0 开始的累计和",结果比输入多一个元素
print(list(itertools.accumulate([1, 2, 3, 4], initial=0)))
# 输出:[0, 1, 3, 6, 10]
#       ↑ initial 前置,后续每个是累加上一个原始元素
```

`initial` 在做"前缀和"类算法、或需要把初始状态也纳入输出时很有用。

**自定义二元函数**

```python
import itertools

# 累计拼接字符串(模拟逐步构建日志前缀)
parts = ["[app]", "[db]", "[query]"]
print(list(itertools.accumulate(parts, lambda acc, s: acc + "." + s)))
# 输出:['[app]', '[app].[db]', '[app].[db].[query]']
```

#### 2.2.5 starmap(func, iterable) 解包映射

`itertools.starmap(func, iterable)` 和内置 `map` 很像,区别在于 `map` 把每个元素作为单个参数传给函数,而 `starmap` 假设每个元素本身是"可解包的序列",把元素解包成多个位置参数传给 `func`。等价于 `itertools.starmap(f, seq)` = `(f(*x) for x in seq)`。

签名:`starmap(func, iterable)`

- `func`:目标函数,接收多个位置参数。
- `iterable`:每个元素是 tuple/list 等可解包序列。

使用场景:你手上有一组"参数元组",想让每个元组对应一次函数调用——最常见的来源是数据库查询结果、CSV 行、`zip` 出来的配对序列。

```python
import itertools

# 场景:一组 (底价, 折扣) 元组,算出实际售价
prices = [(100, 0.8), (200, 0.9), (50, 0.5)]
final = list(itertools.starmap(lambda price, discount: price * discount, prices))
print(final)
# 输出:[80.0, 180.0, 25.0]

# 等价的 map 写法必须额外解包,反而更绕
# map 写法:需要 lambda p: p[0]*p[1],可读性差
```

`starmap` 的优势在参数个数明确时很突出。再比如配合 `zip` 出来的二元组做运算:

```python
import itertools

# 场景:两个序列按位做加法,zip 出二元组后交给 starmap
xs = [1, 2, 3, 4]
ys = [10, 20, 30, 40]
sums = list(itertools.starmap(lambda a, b: a + b, zip(xs, ys)))
print(sums)
# 输出:[11, 22, 33, 44]
```

不过这种简单的按位加法,`map(operator.add, xs, ys)` 写法更直接。`starmap` 真正的用武之地是函数参数超过两个、或参数元组来自外部数据时。

#### 2.2.6 zip_longest(*iterables, fillvalue) 不等长 zip

内置 `zip` 在最短序列耗尽时停止,长的部分被丢弃。`itertools.zip_longest` 正相反,它会一直迭代到最长序列耗尽,短序列不足的位置用 `fillvalue` 填充。

签名:`zip_longest(*iterables, fillvalue=None)`

- `*iterables`:多个可迭代对象。
- `fillvalue`:用于填充短序列缺失位置的值,默认 `None`。

使用场景:合并多个长度不齐的序列且不能丢数据,比如补齐季度数据、对齐多版本配置项。

```python
import itertools

# 场景:两个班级人数不同,要并排打印学号对
class_a = ["小明", "小红", "小刚"]
class_b = ["张三", "李四"]

for a, b in itertools.zip_longest(class_a, class_b, fillvalue="(空)"):
    print(f"{a:6} | {b:6}")
# 输出:
# 小明   | 张三
# 小红   | 李四
# 小刚   | (空)

# 对比内置 zip:会丢掉小刚
print(list(zip(class_a, class_b)))
# 输出:[('小明', '张三'), ('小红', '李四')]
```

**fillvalue 的选择**

`fillvalue` 应选一个不会和真实数据混淆的"哨兵值"。比如处理数值数据时用 `None` 在后续运算里会报错,可以先用 `zip_longest` 配合 `None` 占位,再在消费端判断;或直接用 0 等业务上明确的缺省值。

```python
import itertools

# 场景:四个季度的销售数据,有的部门只报了部分季度,缺失补 0
q1 = [100, 200, 150]
q2 = [110, 190]
q3 = [120, 205, 160, 175]
q4 = [130]

# 想把每个"序号"对应的各部门值对齐
rows = itertools.zip_longest(q1, q2, q3, q4, fillvalue=0)
for i, row in enumerate(rows, 1):
    print(f"序号{i}: {row}")
# 输出:
# 序号1: (100, 110, 120, 130)
# 序号2: (200, 190, 205, 0)
# 序号3: (150, 0, 160, 0)
# 序号4: (0, 0, 175, 0)
```

#### 2.2.7 compress / filterfalse 过滤

这两个都是过滤类函数,和内置 `filter` 同族,但过滤逻辑不同。

**compress(data, selectors) 按布尔序列挑选**

`itertools.compress(data, selectors)` 用一个"选择器序列"决定 `data` 中每个元素是否输出,选择器为真则取、为假则丢。

签名:`compress(data, selectors)`

- `data`:被过滤的数据。
- `selectors`:布尔值序列,长度可与 `data` 不同(按短的停)。

```python
import itertools

# 场景:有一组成绩和一组"是否参加决赛"的标志位,挑出参加决赛的人
names = ["张三", "李四", "王五", "赵六", "钱七"]
finalists = [True, False, True, False, True]
print(list(itertools.compress(names, finalists)))
# 输出:['张三', '王五', '钱七']
```

`compress` 的选择器可以是任何能产生布尔值的迭代器,常和 `accumulate`、`count` 等搭配构造周期性选择模式。

**filterfalse(predicate, iterable) 取反过滤**

`itertools.filterfalse(predicate, iterable)` 和内置 `filter` 行为完全相反:`filter` 保留谓词返回真的元素,`filterfalse` 保留谓词返回假的元素。

签名:`filterfalse(predicate, iterable)`

- `predicate`:返回布尔值的函数。传 `None` 时保留所有"假值"(空串、0、None 等),和 `filter(None, ...)` 对应的反操作。

```python
import itertools

# 场景:从一组请求结果中挑出失败的(状态码 != 200)
status_codes = [200, 404, 200, 500, 200, 403]
failed = list(itertools.filterfalse(lambda c: c == 200, status_codes))
print(failed)
# 输出:[404, 500, 403]

# 对比内置 filter:保留成功的
ok = list(filter(lambda c: c == 200, status_codes))
print(ok)
# 输出:[200, 200, 200]
```

**何时用 filterfalse 而非把条件取反?** 写 `filter(lambda c: c != 200, codes)` 效果完全一样。`filterfalse` 的价值在于:谓词函数本身可能很复杂,你已经有了一个 `is_ok` 函数,想取"不 ok"的,用 `filterfalse(is_ok, data)` 比再写一个 `is_not_ok` 更省事也更不易出错。

#### 2.2.8 groupby(iterable, key) 分组

`itertools.groupby(iterable, key=None)` 把**连续**相同 key 的元素归为一组,返回一个产生 `(key, group)` 的迭代器,其中 `group` 本身也是个迭代器。

签名:`groupby(iterable, key=None)`

- `iterable`:可迭代对象。
- `key`:分组依据函数,接收一个元素返回分组 key。默认为恒等函数(按元素本身分组)。

**最重要的语义陷阱:groupby 只对"连续相同"的元素分组**。如果输入里相同 key 的元素不连续,它们会被分到不同的组里。因此**使用前通常要先按 key 排序**。

```python
import itertools

# 场景:按部门对员工分组,先按部门排序是关键步骤
employees = [
    ("张三", "技术"),
    ("李四", "销售"),
    ("王五", "技术"),
    ("赵六", "销售"),
    ("钱七", "技术"),
    ("孙八", "人事"),
]

# 按"部门"这一列排序,保证同部门连续
employees_sorted = sorted(employees, key=lambda e: e[1])

for dept, members in itertools.groupby(employees_sorted, key=lambda e: e[1]):
    names = [m[0] for m in members]
    print(f"{dept}: {names}")
# 输出:
# 人事: ['孙八']
# 技术: ['张三', '王五', '钱七']
# 销售: ['李四', '赵六']
```

如果省略排序,结果会支离破碎:

```python
import itertools

# 不排序,直接 groupby:同部门不连续会被拆成多个组
for dept, members in itertools.groupby(employees, key=lambda e: e[1]):
    print(f"{dept}: {[m[0] for m in members]}")
# 输出:
# 技术: ['张三']
# 销售: ['李四']
# 技术: ['王五']
# 销售: ['赵六']
# 技术: ['钱七']
# 人事: ['孙八']
```

**group 对象是迭代器且一次性**

`groupby` 返回的每个 `group` 是个迭代器,取完就空,不能重复遍历。如果要在多处使用某组的成员,先 `list(group)` 存下来:

```python
import itertools

data = sorted([("a", 1), ("a", 2), ("b", 3)], key=lambda x: x[0])
groups = {}
for key, group in itertools.groupby(data, key=lambda x: x[0]):
    groups[key] = list(group)  # 必须立即固化成列表
print(groups)
# 输出:{'a': [('a', 1), ('a', 2)], 'b': [('b', 3)]}
```

如果不 `list`,`group` 在下一次循环时已被耗尽,`groups[key]` 指向的是一个空迭代器。这是 groupby 最常见的踩坑点。

**key 函数的灵活用法**

```python
import itertools

# 场景:按成绩段(及格/不及格)对学生分组
students = [("张三", 85), ("李四", 58), ("王五", 72), ("赵六", 45), ("钱七", 90)]
# 先按"是否及格"排序,保证同段连续
students_sorted = sorted(students, key=lambda s: s[1] >= 60)
for passed, group in itertools.groupby(students_sorted, key=lambda s: s[1] >= 60):
    label = "及格" if passed else "不及格"
    print(f"{label}: {[s[0] for s in group]}")
# 输出:
# 不及格: ['李四', '赵六']
# 及格: ['张三', '王五', '钱七']
```

这里 key 函数返回布尔值,`groupby` 同样适用。关键是排序也要用相同的 key 函数。

#### 2.2.9 tee(iterable, n) 复制迭代器

`itertools.tee(iterable, n=2)` 把一个迭代器复制成 n 个独立的迭代器,每个都能各自向前迭代而不互相干扰。

签名:`tee(iterable, n=2)`

- `iterable`:要复制的可迭代对象。
- `n`:复制份数,默认 2。

使用场景:你只有一个迭代器,却需要从头到尾遍历多次。直接复用同一个迭代器第二次会得到空序列,`tee` 解决这个问题。

```python
import itertools

# 场景:一次生成,既要求最大值又要求和,不想先转成列表
def numbers():
    """模拟一个生成器,流式产生数据"""
    yield from [3, 1, 4, 1, 5, 9, 2, 6]

# 拆成两份独立迭代器
it_for_max, it_for_sum = itertools.tee(numbers(), 2)
print(max(it_for_max))   # 输出:9
print(sum(it_for_sum))   # 输出:31
```

**tee 的代价**

`tee` 内部会用一个队列缓存"一个迭代器已消费但另一个还没消费"的元素。如果两个复制体消费速度差异很大(一个先跑完、另一个还没动),缓冲区会堆积大量元素,内存占用和直接 `list()` 差不多。因此 `tee` 适合"几个消费方同步推进"的场景,不适合"一个先全跑完、另一个再开始"——后者不如直接 `data = list(it)`。

**并行的 tee 消费**

```python
import itertools

# 两份复制同时交错消费,缓冲区不会堆积
it_a, it_b = itertools.tee(range(5))
for a, b in zip(it_a, it_b):
    print(a, b)
# 输出:
# 0 0
# 1 1
# 2 2
# 3 3
# 4 4
```

但当两个复制体被前后使用时(如上面的 max/sum),`tee` 实际上会把数据全部缓存一遍,与 `list()` 无异,这种场景下更建议直接 `list`。

### 2.3 排列组合:product、permutations、combinations

这一组函数都用于枚举式的组合数学场景,返回的也是迭代器,但因为是有限集合,通常可以直接 `list()` 取完。

#### 2.3.1 product(*iterables, repeat) 笛卡尔积

`itertools.product(*iterables, repeat=1)` 计算多个可迭代对象的笛卡尔积,等价于嵌套 for 循环。结果按"最右边的元素变化最快"的字典序排列。

签名:`product(*iterables, repeat=1)`

- `*iterables`:多个可迭代对象。
- `repeat`:把同一个可迭代对象重复参与积的次数,如 `product(range(2), repeat=3)` 等价于 `product(range(2), range(2), range(2))`。

使用场景:参数网格搜索、生成所有位组合、多维度选项枚举。

```python
import itertools

# 场景:生成参数网格,用于暴力试参
lrs = [0.01, 0.1]
batch_sizes = [32, 64]
epochs = [5, 10]

grid = itertools.product(lrs, batch_sizes, epochs)
for lr, bs, ep in grid:
    print(f"训练配置: lr={lr}, batch={bs}, epochs={ep}")
# 输出:
# 训练配置: lr=0.01, batch=32, epochs=5
# 训练配置: lr=0.01, batch=32, epochs=10
# 训练配置: lr=0.01, batch=64, epochs=5
# 训练配置: lr=0.01, batch=64, epochs=10
# 训练配置: lr=0.1, batch=32, epochs=5
# 训练配置: lr=0.1, batch=32, epochs=10
# 训练配置: lr=0.1, batch=64, epochs=5
# 训练配置: lr=0.1, batch=64, epochs=10
```

这比写三层嵌套 `for` 更紧凑,而且能直接作为迭代器传给下游处理。

**repeat 用法:位组合**

```python
import itertools

# 场景:生成 3 位二进制的所有组合(共 8 种)
bits = itertools.product([0, 1], repeat=3)
for combo in bits:
    print(combo)
# 输出:
# (0, 0, 0)
# (0, 0, 1)
# (0, 1, 0)
# (0, 1, 1)
# (1, 0, 0)
# (1, 0, 1)
# (1, 1, 0)
# (1, 1, 1)
```

`product(A, repeat=n)` 是生成"长度为 n 的所有可能序列"的标准写法,常用于状态空间枚举。

**product vs 嵌套 for**

```python
# 嵌套 for 写法
for lr in lrs:
    for bs in batch_sizes:
        for ep in epochs:
            ...

# product 写法
for lr, bs, ep in itertools.product(lrs, batch_sizes, epochs):
    ...
```

层数越多,`product` 的可读性优势越明显。但只有一层时还是直接 `for` 更直观。

#### 2.3.2 permutations(iterable, r) 排列

`itertools.permutations(iterable, r=None)` 产生所有长度为 `r` 的排列,顺序敏感(即 `(1,2)` 和 `(2,1)` 视为不同),不放回。

签名:`permutations(iterable, r=None)`

- `iterable`:可迭代对象。
- `r`:排列长度,默认 `None` 表示取和输入长度相同的全排列。

使用场景:生成测试用例的所有顺序组合、密码穷举、赛程排列。

```python
import itertools

# 场景:3 名选手参加比赛,排所有可能的领奖顺序(金银铜)
athletes = ["甲", "乙", "丙"]
for order in itertools.permutations(athletes, 2):
    print(order)
# 输出:
# ('甲', '乙')
# ('甲', '丙')
# ('乙', '甲')
# ('乙', '丙')
# ('丙', '甲')
# ('丙', '乙')
# 共 3*2=6 种,顺序敏感、不放回
```

注意 `permutations` 把输入当作"不重复"处理,即便输入里有相同元素也会按位置当作不同:

```python
import itertools

# 输入有重复元素,但 permutations 按位置区分
print(list(itertools.permutations([1, 1, 2])))
# 输出:
# [(1, 1, 2), (1, 2, 1), (1, 1, 2), (1, 2, 1), (2, 1, 1), (2, 1, 1)]
# 有重复结果,因为两个 1 被当成不同位置
```

如果不希望重复,可外包 `set` 去重:`set(itertools.permutations([1, 1, 2]))`,但代价是要先把全部结果算出来。

#### 2.3.3 combinations(iterable, r) 组合

`itertools.combinations(iterable, r)` 产生所有长度为 `r` 的组合,顺序无关、不放回。即从 n 个里选 r 个的所有方案。

签名:`combinations(iterable, r)`

- `iterable`:可迭代对象。
- `r`:组合长度,**必填**。

使用场景:从一组事物里"任选 K 个"的所有方案——抽奖、特征选择、两两配对。

```python
import itertools

# 场景:5 个候选特征里选 2 个做对比测试
features = ["A", "B", "C", "D", "E"]
pairs = itertools.combinations(features, 2)
for a, b in pairs:
    print(f"对比: {a} vs {b}")
# 输出:
# 对比: A vs B
# 对比: A vs C
# 对比: A vs D
# 对比: A vs E
# 对比: B vs C
# 对比: B vs D
# 对比: B vs E
# 对比: C vs D
# 对比: C vs E
# 对比: D vs E
# 共 C(5,2)=10 种
```

对比 `permutations`:`combinations` 把 `(A,B)` 和 `(B,A)` 视为同一种,只保留一种;`permutations` 保留两种。当"顺序无关"时用 `combinations`,结果少一半。

```python
import itertools

# 场景:从 4 个学生中选 3 个组队参赛,只看选谁不看顺序
students = ["张三", "李四", "王五", "赵六"]
teams = itertools.combinations(students, 3)
for team in teams:
    print(team)
# 输出:
# ('张三', '李四', '王五')
# ('张三', '李四', '赵六')
# ('张三', '王五', '赵六')
# ('李四', '王五', '赵六')
# 共 C(4,3)=4 种
```

#### 2.3.4 combinations_with_replacement(iterable, r) 可重组合

`itertools.combinations_with_replacement(iterable, r)` 和 `combinations` 类似,但允许同一个元素被重复选中(放回),顺序仍无关。

签名:`combinations_with_replacement(iterable, r)`

- `iterable`:可迭代对象。
- `r`:组合长度,必填。

```python
import itertools

# 场景:在 {1,2,3} 上做长度为 2 的可重组合
# 适用于"可重复取、不分顺序"的选取
result = list(itertools.combinations_with_replacement([1, 2, 3], 2))
print(result)
# 输出:
# [(1, 1), (1, 2), (1, 3), (2, 2), (2, 3), (3, 3)]
# 共 C(3+2-1, 2)=C(4,2)=6 种
```

观察 `(1,1)` 出现了,说明同一个 1 被取了两次,这是和 `combinations` 的本质区别。

**四种组合函数对比**

| 函数 | 顺序敏感 | 放回 | 典型用途 |
|------|---------|------|---------|
| `product` | 是 | 是 | 笛卡尔积、参数网格 |
| `permutations` | 是 | 否 | 排列、顺序敏感的方案 |
| `combinations` | 否 | 否 | 选取、配对、组合数 |
| `combinations_with_replacement` | 否 | 是 | 多重集组合、同元素可重选 |

记住这张表,选错函数会得多余或少一半的结果。

### 2.4 更多有限迭代器补遗

itertools 里还有一些函数,出现频率略低但场景明确,这里一并覆盖。

#### 2.4.1 filterfalse 与 compress 的选择

前面 2.2.7 已讲过 `filterfalse` 和 `compress`,这里补充一个对比视角,帮你在过滤类需求里选对工具:

- 用**谓词函数**判断去留 → `filter`(留真)或 `filterfalse`(留假)。
- 用**外部布尔序列**判断去留 → `compress`。
- 用**位置区间**判断去留 → `islice`。
- 用**连续开头条件**判断去留 → `takewhile` / `dropwhile`。

四种过滤手段本质都不同,选错会出现"行为像、结果错"的 bug。

#### 2.4.2 accumulate 的 func 多样性

`accumulate` 的 `func` 可以是任意二元函数,Python 内置 `operator` 模块提供了常用运算的函数形式,配合 `accumulate` 很顺手:

```python
import itertools
import operator

nums = [2, 3, 4, 5]

# 累加(默认)
print(list(itertools.accumulate(nums)))
# 输出:[2, 5, 9, 14]

# 累乘
print(list(itertools.accumulate(nums, operator.mul)))
# 输出:[2, 6, 24, 120]

# 累计位与(逐步收窄)
print(list(itertools.accumulate([0b1110, 0b1010, 0b1100], operator.and_)))
# 输出:[14, 10, 8]
# 1110 & 1010 = 1010(10), 1010 & 1100 = 1000(8)

# 累计字符串拼接
print(list(itertools.accumulate(["a", "b", "c"], operator.add)))
# 输出:['a', 'ab', 'abc']
```

`operator.add/mul/and_/or_/xor` 等都是 `accumulate` 的天然搭档,比自己写 `lambda` 快也清晰。

### 2.5 典型综合场景

把上面学到的函数组合起来,解决几个贴近真实开发的综合问题。

#### 2.5.1 分页遍历生成器(islice)

需求:有一个会持续产生数据的生成器(比如日志文件行),要分页展示,每页 N 条,直到数据耗尽。

```python
import itertools

def log_stream():
    """模拟一个源源不断的日志生成器"""
    for i in range(1, 23):  # 共 22 条
        yield f"line-{i:02d}"

page_size = 5
page_no = 1
total = 0
stream = log_stream()

while True:
    # 每次取 page_size 条;islice 在数据耗尽时会返回更短或空列表
    page = list(itertools.islice(stream, page_size))
    if not page:
        break
    print(f"--- 第 {page_no} 页 ---")
    for line in page:
        print(line)
        total += 1
    page_no += 1

print(f"总共读出 {total} 条")
# 输出:
# --- 第 1 页 ---
# line-01
# line-02
# line-03
# line-04
# line-05
# --- 第 2 页 ---
# line-06
# line-07
# line-08
# line-09
# line-10
# --- 第 3 页 ---
# line-11
# line-12
# line-13
# line-14
# line-15
# --- 第 4 页 ---
# line-16
# line-17
# line-18
# line-19
# line-20
# --- 第 5 页 ---
# line-21
# line-22
# 总共读出 22 条
```

要点:用 `islice(stream, page_size)` 每次截一段,因为 `stream` 是同一个迭代器,下次会从上次位置继续。这就是"顺序翻页"的正确写法——不回头、不跳页,但每次接着上次的位置。

#### 2.5.2 按部门分组(groupby)

需求:把一批员工数据按部门聚合成 dict,每个部门是员工列表。

```python
import itertools

people = [
    {"name": "张三", "dept": "技术"},
    {"name": "李四", "dept": "销售"},
    {"name": "王五", "dept": "技术"},
    {"name": "赵六", "dept": "人事"},
    {"name": "钱七", "dept": "技术"},
    {"name": "孙八", "dept": "销售"},
]

# 第一步:按 dept 排序(groupby 的前置条件)
people_sorted = sorted(people, key=lambda p: p["dept"])

# 第二步:groupby 分组并立即固化成 list
by_dept = {}
for dept, group in itertools.groupby(people_sorted, key=lambda p: p["dept"]):
    by_dept[dept] = list(group)

for dept, members in by_dept.items():
    print(f"{dept}({len(members)} 人): {[m['name'] for m in members]}")
# 输出:
# 技术(3 人): ['张三', '王五', '钱七']
# 人事(1 人): ['赵六']
# 销售(2 人): ['李四', '孙八']
```

**为什么不直接用循环 + dict?** 你当然可以用 `defaultdict(list)` 手动分组,而且不用排序。`groupby` 适用于两种情况:一是数据本身已经有序(比如流式日志按时间已排好),用 `groupby` 不需额外排序;二是只想在循环里逐组处理,不想在内存里持有完整 dict。否则 `defaultdict` 往往更实用。

#### 2.5.3 生成参数网格(product)

需求:做一组对比实验,3 个超参数各有若干取值,要跑遍所有组合。

```python
import itertools

# 三个维度的取值
models = ["cnn", "rnn"]
datasets = ["mnist", "cifar"]
optimizers = ["sgd", "adam"]

# 笛卡尔积生成全部配置
configs = itertools.product(models, datasets, optimizers)
config_list = list(configs)
print(f"共 {len(config_list)} 组配置")
# 输出:共 8 组配置

# 给每个配置编号,输出成表格
for idx, (m, d, o) in enumerate(config_list, 1):
    print(f"#{idx:02d}  model={m:4} dataset={d:6} optimizer={o}")
# 输出:
# #01  model=cnn  dataset=mnist  optimizer=sgd
# #02  model=cnn  dataset=mnist  optimizer=adam
# #03  model=cnn  dataset=cifar  optimizer=sgd
# #04  model=cnn  dataset=cifar  optimizer=adam
# #05  model=rnn  dataset=mnist  optimizer=sgd
# #06  model=rnn  dataset=mnist  optimizer=adam
# #07  model=rnn  dataset=cifar  optimizer=sgd
# #08  model=rnn  dataset=cifar  optimizer=adam
```

#### 2.5.4 文件轮转(cycle)

需求:有 3 个日志文件按顺序轮流写,第 N 条日志写到第 `N % 3` 个文件,但用 `cycle` 实现更优雅。

```python
import itertools

files = ["app1.log", "app2.log", "app3.log"]
file_pool = itertools.cycle(files)

# 模拟写入 7 条日志
logs = ["boot", "load", "run", "save", "run", "run", "shutdown"]
assignment = {}
for log in logs:
    target = next(file_pool)
    assignment.setdefault(target, []).append(log)

for f, items in assignment.items():
    print(f"{f}: {items}")
# 输出:
# app1.log: ['boot', 'save', 'shutdown']
# app2.log: ['load', 'run']
# app3.log: ['run', 'run']
```

`cycle` 的"轮询"语义比手动 `idx % len(files)` 更不容易写错(尤其是要跳过某些位置、或 files 列表动态变化时)。

#### 2.5.5 生成测试排列(permutations)

需求:为一个函数的 3 个参数生成所有顺序的测试输入,确保顺序无关性。

```python
import itertools

# 3 个不同取值,测所有排列,看结果是否稳定
values = ["x", "y", "z"]
for order in itertools.permutations(values):
    # 假设被测函数签名为 f(a, b, c)
    print(f"调用 f({', '.join(order)})")
# 输出:
# 调用 f(x, y, z)
# 调用 f(x, z, y)
# 调用 f(y, x, z)
# 调用 f(y, z, x)
# 调用 f(z, x, y)
# 调用 f(z, y, x)
# 共 6 种
```

#### 2.5.6 批量处理(chunk via islice)

需求:把一个长序列按每 N 个一批切分,逐批处理(比如批量入库)。

```python
import itertools

def chunked(iterable, size):
    """把任意可迭代对象切成 size 大小的批次,惰性产出。"""
    it = iter(iterable)
    while True:
        chunk = list(itertools.islice(it, size))
        if not chunk:
            break
        yield chunk

# 模拟 1000 条数据,每批 100 条入库
ids = range(1, 1001)
for batch_idx, batch in enumerate(chunked(ids, 100), 1):
    print(f"批次 {batch_idx}: [{batch[0]} ... {batch[-1]}],共 {len(batch)} 条")
# 输出:
# 批次 1: [1 ... 100],共 100 条
# 批次 2: [101 ... 200],共 100 条
# 批次 3: [201 ... 300],共 100 条
# 批次 4: [301 ... 400],共 100 条
# 批次 5: [401 ... 500],共 100 条
# 批次 6: [501 ... 600],共 100 条
# 批次 7: [601 ... 700],共 100 条
# 批次 8: [701 ... 800],共 100 条
# 批次 9: [801 ... 900],共 100 条
# 批次 10: [901 ... 1000],共 100 条
```

这个 `chunked` 是 itertools recipes 的经典模式,`islice` 在这里的作用是"无副作用地一次取定长切片"。对比 `list` + 下标的切法,`chunked` 保留惰性,适合数据源是生成器的场景。

## 3. 最佳实践

### 3.1 永远记得结果是迭代器

itertools 所有函数返回的都是一次性迭代器。这是最基础也最容易踩的坑:同一个结果对象被遍历两次后第二次是空的。

```python
import itertools

pairs = itertools.combinations([1, 2, 3], 2)

# 第一次消费
print(list(pairs))
# 输出:[(1, 2), (1, 3), (2, 3)]

# 第二次消费:已经空了
print(list(pairs))
# 输出:[]
```

**推荐写法**:如果结果要多次使用,在消费前先 `list()` 固化。

```python
pairs = list(itertools.combinations([1, 2, 3], 2))  # 固化成列表,可反复使用
```

如果结果很大、只想遍历一次,就保持迭代器形态,但确保只有一处消费。

**不推荐**:把迭代器当列表用,在多处隐式遍历。

```python
# 不推荐:多处隐式遍历,第二处会拿到空结果
result = itertools.chain(big_gen_a, big_gen_b)
count = sum(1 for _ in result)        # 这里把 result 耗尽
sample = list(itertools.islice(result, 10))  # 这里拿到空列表
```

### 3.2 groupby 使用三连:排序、分组、固化

`groupby` 的三个坑前面都讲过,这里集中强调,因为它是 itertools 里出错率最高的函数:

1. **必须先按 key 排序**,否则同 key 的不连续元素会被拆到多个组。
2. **group 对象是迭代器且一次性**,消费后即空,需要保留就立即 `list()`。
3. **key 函数在排序和分组时必须一致**,否则分组结果与排序预期不符。

```python
import itertools

# 推荐写法:三步一气呵成
data = [...]
key_fn = lambda x: x.some_field

# 1. 排序(用同一个 key_fn)
sorted_data = sorted(data, key=key_fn)
# 2. 分组
# 3. 立即 list() 固化每组的成员
result = {k: list(g) for k, g in itertools.groupby(sorted_data, key=key_fn)}
```

**不推荐**:不排序直接 groupby,或把 `group` 对象存进字典待后续遍历——两种都会得到看似能跑、实则错误的结果。

### 3.3 无限迭代器一定要截断

`count`、`cycle`、`repeat(无 times)` 产生的序列没有终点,直接 `for` 会死循环。务必配合 `islice`、`zip`、`takewhile` 等机制截断。

```python
# 不推荐:依赖"恰好会被某条件打断",一旦条件没触发就死循环
for n in itertools.count():
    if some_condition(n):
        break

# 推荐:用 islice 明确给最大次数,即使逻辑有 bug 也能停
for n in itertools.islice(itertools.count(), 10000):
    if some_condition(n):
        break
```

`islice` 加一个"上限"是防御性写法,尤其在线上服务里,逻辑 bug 导致的死循环可能拖垮整个进程。

### 3.4 优先用 operator 里的函数,而非 lambda

`accumulate`、`starmap`、`groupby` 等都接收函数参数。能用 `operator.add/mul/itemgetter/attrgetter` 表达的,优先用它们——既快(底层 C 实现)又清晰。

```python
import itertools
import operator

# 推荐:operator.add,意图直白、C 实现
result = list(itertools.accumulate([1, 2, 3], operator.add))

# 次选:lambda,只在 operator 没有对应函数时用
result = list(itertools.accumulate([1, 2, 3], lambda a, b: a + b))

# itemgetter 用于按字段取值,常配合 sorted / groupby 的 key
get_dept = operator.itemgetter("dept")
people = [{"dept": "技术"}, {"dept": "销售"}]
for dept, g in itertools.groupby(sorted(people, key=get_dept), key=get_dept):
    print(dept, list(g))
```

### 3.5 大数据量注意 tee 的缓冲

`tee` 复制迭代器时会缓存"已消费但其他副本未消费"的元素。如果几个副本消费速度差异大,内存会膨胀到与 `list()` 相当甚至更多。

```python
import itertools

# 不推荐:两份消费速度极不均匀,等同把整个序列缓存一遍
it_a, it_b = itertools.tee(huge_generator(), 2)
total_a = sum(it_a)   # 先把 a 全跑完,b 一个还没动 → 全部进缓存
first_b = next(it_b)  # 只取 b 第一个

# 推荐:这种场景直接 list 更诚实(内存反正要用)
data = list(huge_generator())
total_a = sum(data)
first_b = data[0]
```

`tee` 的正确用法是几个副本**同步**推进(比如在 `zip` 里平行消费),缓冲区不会堆积。

### 3.6 排列组合注意输入规模

`permutations`、`combinations` 的结果数随输入规模爆炸式增长:`permutations(range(10), 10)` 有 362 万种,`product(range(10), repeat=6)` 有百万级。直接 `list()` 可能瞬间撑爆内存。

```python
# 不推荐:无脑 list 取全部
all_perms = list(itertools.permutations(range(12)))  # 4.79 亿种,直接 OOM

# 推荐:迭代消费,只取需要的部分
for i, perm in enumerate(itertools.permutations(range(12))):
    if i >= 100:        # 只看前 100 个
        break
    process(perm)

# 或先估算规模再决定
import math
n, r = 12, 3
total = math.perm(n, r)   # 1320,规模可控
print(f"共 {total} 种,可以 list")
```

### 3.7 别为了 itertools 而 itertools

itertools 是工具不是目的。有些场景用列表推导式或内置 `for` 更清晰,强行用 itertools 反而降低可读性。

```python
import itertools

# 反面:简单需求套 itertools,显得绕
evens = list(itertools.filterfalse(lambda x: x % 2, range(10)))

# 正面:列表推导式一目了然
evens = [x for x in range(10) if x % 2 == 0]
```

判断标准:当你想表达"串联、切片、分组、笛卡尔积、轮询"这类**结构化迭代模式**时,itertools 是利器;当逻辑就是普通的"遍历+条件判断"时,内置语法更直接。

## 4. 原理

### 4.1 全部用 C 实现,返回惰性迭代器

itertools 模块在 CPython 中是用纯 C 实现的(`Modules/_itertoolsmodule.c`),每个函数内部都构造一个对应的迭代器类型对象并返回。这意味着两点:一是求值是惰性的,函数返回时并不立即处理输入,只有被 `next()` 或 `for` 消费时才一次次产生元素,处理无限或超大序列时不会预先占用内存;二是单步开销低于等价的 Python 生成器,因为 C 层没有 Python 字节码执行和帧调度的额外成本。

可以把 itertools 函数理解为"预编译好的迭代模式":同样的逻辑用 Python 生成器写出来(例如 `chain` 等价于 `def chain(*it): for x in it: yield from x`)在语义上完全等价,但运行更慢、字节码也要现写现解释。

### 4.2 chain / zip_longest 等内部维护多迭代器状态

`chain` 内部持有"所有输入迭代器组成的列表"和一个"当前正在消费的迭代器指针"。每产生一个元素:如果当前迭代器没耗尽就 `next` 它;耗尽就推进到下一个迭代器,直到全部用完。

`zip_longest` 内部为每个输入维护一个独立的迭代器状态和一个"该迭代器是否已耗尽"的标志。每次产出时,对每个未耗尽的迭代器 `next` 取值,耗尽的填 `fillvalue`;当**所有**迭代器都耗尽时才停止——这正是它和内置 `zip`(任一耗尽即停)的区别所在。

`cycle` 内部先把输入转成列表缓存,然后维护一个包绕该列表的位置指针,走到末尾绕回开头。这也解释了 `cycle` 的内存特性:输入越大,缓存越大。

### 4.3 groupby 依赖输入有序的机制

`groupby` 的实现是一次性向前扫描,仅比较"当前元素的 key"与"上一个元素的 key"是否相等:相等就并入当前组,不等就开新组。它**不会**回头扫描、也不会预先收集所有同 key 的元素。

正因如此,如果输入中同 key 的元素不连续,`groupby` 看到它们时"上一个 key"已经被别的 key 打断,自然会开新组——这就是"必须先排序"的底层原因。排序之后,同 key 的元素物理上排在一起,`groupby` 的单次扫描就能正确归并。

group 的迭代器也巧妙:它会在被消费时持续 `next` 底层迭代器,直到遇到 key 变化或底层耗尽才停。但一旦主循环推进到下一个组,上一个 group 如果还没被消费完,其剩余元素会被丢弃——这又回到了"必须立即固化 group"的实践要求。

### 4.4 tee 的共享缓冲机制

`tee` 内部用一个共享的 deque 队列保存"被某个副本消费但还没被所有副本消费"的元素。每个副本维护各自的读指针,指向队列中的不同位置。当最慢的副本也追上某元素时,该元素才能从队列头部弹出。

这解释了两条实践规律:一是同步消费时队列长度始终很小,内存友好;二是某个副本远超其他时,队列会堆积到与完整数据量相当。也正因如此,`tee` 不能用于"复制一个已经生成了一半的迭代器"——它只能从调用 `tee` 那一刻起记录后续元素,之前已经产出的元素无法追回。

### 4.5 惰性与内存的权衡

itertools 的惰性不是免费的午餐。惰性带来的好处是处理无限/海量序列时不爆内存,代价是:结果不能随机访问(无下标)、不易并行(元素只能顺序产出)、调试时看不到完整结果。在数据量已知较小、且需要多次访问的场景,先 `list()` 转成列表往往是更实用的选择。itertools 的价值真正体现在数据量大、只需一次消费、或需要组合多个转换的场景。

## 5. 总结

### 5.1 本文内容要点

- **无限迭代器**:`count(start, step)` 无限计数、`cycle(iterable)` 循环、`repeat(elem, times)` 重复,三者都需外在截断。
- **有限迭代器**:
  - `chain(*it)` / `chain.from_iterable` 串联多个迭代器。
  - `islice(iter, start, stop, step)` 对迭代器做不支持负索引的切片,适合分页、按步长抽样。
  - `takewhile` / `dropwhile` 只在序列开头判断的条件取/舍。
  - `accumulate(iter, func, initial)` 累积扫描,默认累加,可换 `operator` 函数。
  - `starmap(func, iter)` 把每个元素解包成多参数调用 `func`。
  - `zip_longest(*it, fillvalue)` 不等长 zip,短位填充。
  - `compress(data, selectors)` 按外部布尔序列挑选;`filterfalse(pred, iter)` 取反过滤。
  - `groupby(iter, key)` 按 key 对**连续相同**元素分组,需先排序,group 需立即固化。
  - `tee(iter, n)` 复制迭代器,同步消费时内存友好。
- **排列组合**:`product` 笛卡尔积、`permutations` 排列(顺序敏感、不放回)、`combinations` 组合(顺序无关、不放回)、`combinations_with_replacement` 可重组合。
- **典型场景**:islice 顺序分页、groupby 按字段分组、product 生成参数网格、cycle 轮询负载、permutations 生成测试排列、islice 切批批量处理。
- **原理**:全部 C 实现返回惰性迭代器;chain/zip_longest 维护多迭代器状态;cycle 缓存输入;groupby 单次扫描依赖输入有序;tee 共享 deque 缓冲。

### 5.2 读完应能掌握

- 能区分三类 itertools 函数(无限、有限、排列组合),并按需求选对工具。
- 能用 `islice` 对生成器做分页和切片,理解其负索引不支持的局限。
- 能正确使用 `groupby`,包括"先按 key 排序、立即 `list()` 固化 group、key 函数一致"三条要点。
- 能用 `product` / `permutations` / `combinations` 生成参数网格和组合,并能估计结果规模避免内存爆炸。
- 能说明 `takewhile` 与 `filter`、`dropwhile` 与 `filterfalse`、`chain` 与 `chain.from_iterable`、`zip` 与 `zip_longest` 的语义差别,并据此选择。
- 能解释 itertools 为何省内存(惰性迭代器)、为何 `tee` 异步消费会膨胀、为何 `groupby` 必须先排序。
- 能在生产代码中识别"迭代器一次性、无限迭代器需截断、排列组合规模爆炸"三类常见陷阱并写出防御性代码。