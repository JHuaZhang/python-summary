---
group:
  title: 【04】运算符和表达式
  order: 4
order: 9
title: in与not in成员判断
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 `in` 与 `not in`

`in` 与 `not in` 是 Python 的**成员运算符**(membership operators),用于判断一个对象是否是某个容器/集合的成员。`x in container` 判断 `x` 是否在 `container` 里(在则 `True`,不在则 `False`),`x not in container` 是其取反(不在则 `True`)。当你写 `if user in users:`、`if key in dict:`、`if "a" in "abc":` 时,`in` 就在判断成员关系。

```python
print(3 in [1, 2, 3])         # True —— 3 在列表里
print(5 in [1, 2, 3])         # False
print("a" in "cat")           # True —— a 是字符串子串
print("name" in {"name": "alice"})  # True —— name 是字典的键
print(3 not in [1, 2])        # True —— 3 不在列表
print(2 in (1, 2, 3))         # True —— 元组
print(3 in {1, 2, 3})         # True —— 集合
```

`in` 是 Python 里表达"成员关系"的统一语法——无论容器是列表、元组、集合、字典、字符串,还是自定义可迭代对象,都用 `x in c` 判断。这种"统一接口"是 Python 简洁性的体现:你不必记"列表用 contains、字典用 has_key、字符串用 find",一个 `in` 全搞定(实际上 Python 2 的字典曾有 `dict.has_key()`,Python 3 移除,统一用 `in`)。

理解 `in`,关键要抓住它**背后的协议与性能差异**:`in` 不是"语法糖",而是调用容器的 `__contains__` 方法(或回退到迭代)。不同容器的 `__contains__` 实现效率天差地别——在**列表**里 `in` 是线性扫描 O(n),在**集合/字典**里 `in` 是哈希查找 O(1)。这意味着同一句 `x in c`,c 是 list 还是 set,性能可能差千万倍。这是 `in` 最重要的工程认知:

```python
import time
big_list = list(range(1_000_000))
big_set = set(big_list)

# 列表 in:线性扫描,慢
t = time.perf_counter()
_ = 999_999 in big_list
print(f"列表 in: {time.perf_counter()-t:.4f}s")   # 慢(O(n))

# 集合 in:哈希查找,快
t = time.perf_counter()
_ = 999_999 in big_set
print(f"集合 in: {time.perf_counter()-t:.6f}s")   # 快得多(O(1))
```

`in` 与 C/Java 的成员判断有几个差异,这也是新手需要注意的:

- **Python 用 `in` 运算符统一所有容器**,C/Java 没有统一运算符(C 要手写循环,Java 用 `contains()` 方法且不同集合方法名各异)。Python 的 `in` 是运算符(关键字),不是方法调用,可读性高。
- **`in` 对字典判断的是键,不是值**。`key in dict` 判断 key 是否是字典的键,不是值。新手常误以为 `3 in {1: "a", 2: "b"}` 判断值 `"a"/"b"`,实际判断键 `1/2`。
- **`in` 对字符串判断的是子串,不是字符**。`"ab" in "abc"` 为 `True`(子串),不仅是单字符。这让字符串 `in` 比 C 的 `strchr`(单字符)更强大。
- **`not in` 是合成运算符**,不是 `not (x in c)` 的简写(虽等价),优先用 `not in` 更清晰。

```python
# 几个易错点
print(3 in {1: "a", 2: "b"})     # False —— in 判断键,3 不是键
print(1 in {1: "a", 2: "b"})     # True —— 1 是键
print("ab" in "xabcy")           # True —— 子串判断,非单字符
print("a" in ["a", "b"])         # True —— 列表元素
# not in 是合成运算符
print(5 not in [1, 2, 3])        # True —— 推荐
print(not (5 in [1, 2, 3]))      # True —— 等价但啰嗦
```

本篇要系统讲透:`in`/`not in` 的语义与求值、对不同容器(列表/元组/集合/字典/字符串/range/自定义)的成员判断规则、`__contains__` 协议与迭代回退、性能差异(list O(n) vs set/dict O(1))及工程优化、`in` 在推导式/`for` 循环的不同角色、可哈希性与 `in` 的关系、常见陷阱(字典判键非值、字符串子串、浮点/`nan` 成员判断),以及背后的协议与哈希原理。这是「运算符与表达式」大章节的第九篇,与《值相等与引用相等》(`in` 用 `==` 比较成员)、《hash 与可哈希类型》(集合/字典 `in` 依赖哈希)互为补充。

### 1.2 `in` 与 `not in` 全表

下面这张表是本篇的总纲,后续每节逐一展开。

| 运算符 | 语义 | 示例 | 结果 |
|--------|------|------|------|
| `x in c` | x 是否是 c 的成员 | `3 in [1,2,3]` | True |
| `x not in c` | x 是否不是 c 的成员 | `5 not in [1,2,3]` | True |

核心认知:

1. **`in` 返回 `bool`**(`True`/`False`),不像 `and`/`or` 返回操作数。
2. **`not in` 是合成运算符**(一个整体),等价 `not (x in c)` 但更清晰,PEP 8 推荐。
3. **`in` 的行为由容器类型决定**:列表线性扫、集合/字典哈希查、字符串子串匹配。

`in` 的"行为因容器而异"是它最需要逐一掌握的部分——同一语法、不同容器,语义和性能都不同。后续每节按容器类型展开。

### 1.3 `in` 的两个角色:运算符 vs `for` 语句

在深入前,先澄清 `in` 的两个不同角色,避免混淆:`in` 作为**成员运算符**(本篇主题)和 `in` 作为 **`for` 循环的迭代关键字**是两个不同的 `in`。

**成员运算符 `in`**(本篇):`x in c` 判断成员关系,返回 bool。

```python
if 3 in [1, 2, 3]:        # 成员判断,返回 True/False
    print("在")
```

**`for` 迭代 `in`**:`for x in c:` 遍历容器,`in` 是迭代语法,不返回值。

```python
for x in [1, 2, 3]:       # 迭代,逐个取元素
    print(x)
```

两者语法位置不同(成员 `in` 在表达式里,迭代 `in` 在 `for` 语句头)、语义不同(判断 vs 遍历),但都基于"容器/可迭代对象"概念。本篇只讲成员运算符 `in`,`for` 迭代详见《流程控制》。理解两者区别,就不会把 `for x in c` 误当成成员判断。

---

## 2. 核心内容

本章详解 `in`/`not in` 对各容器的成员判断,每节遵循"规则 → demo → 陷阱 → 场景"展开。重点是性能差异(list vs set/dict)、字典判键、`__contains__` 协议。

### 2.1 `in` 对列表与元组:线性扫描 O(n)

列表(list)和元组(tuple)的 `in` 做**线性扫描**:从第一个元素开始逐个用 `==` 比较,直到找到相等的(返回 True)或扫完(返回 False)。

```python
print(3 in [1, 2, 3])        # True —— 逐个比:1?2?3!找到
print(5 in [1, 2, 3])        # False —— 扫完全部无
print("b" in ["a", "b", "c"])# True
# 元组同理
print(3 in (1, 2, 3))        # True
print(5 in (1, 2, 3))        # False
```

**线性扫描 O(n)**:`in` 的时间复杂度与容器长度成正比——最坏要扫完所有 n 个元素。元素在末尾或不存在时,要扫全部;在开头时快(但平均仍 O(n))。

```python
big = list(range(1_000_000))
# 找开头的元素:快(扫几个就命中)
print(0 in big)              # True(快)
# 找末尾的元素:慢(扫近 100 万)
print(999_999 in big)        # True(慢)
# 找不存在的元素:最慢(扫全部 100 万)
print(-1 in big)             # False(最慢,扫完确认没有)
```

⚠️ **性能陷阱:大列表反复 `in` 很慢**。若你在循环里对大列表做 `in`,复杂度爆炸:

```python
# 危险:循环内对大列表 in,O(n²)
big_list = list(range(100_000))
targets = list(range(50_000, 60_000))
count = 0
for t in targets:            # 1 万次
    if t in big_list:        # 每次扫描 10 万,共 10 亿次比较
        count += 1
# 极慢!应把 big_list 转集合(set),in 变 O(1)
big_set = set(big_list)
for t in targets:
    if t in big_set:         # O(1) 查找,快千万倍
        count += 1
```

判断"一批元素是否在大集合里",把列表转集合(O(1) 查找),而不是对列表反复 `in`。这是 `in` 性能优化的头号原则(§3.1)。

**`in` 用 `==` 比较成员**(不是 `is`),所以数值跨类型相等、容器深度比较都适用:

```python
print(1.0 in [1, 2, 3])      # True —— 1.0 == 1(跨类型数值相等)
print(True in [1, 2, 3])     # True —— True == 1
print([1, 2] in [[1, 2], [3]])  # True —— 列表 == 列表(值相等)
```

`in` 用 `==` 比较,故 `1.0 in [1]` 为 True(1.0==1)、`[1,2] in [[1,2]]` 为 True(列表值相等)。理解 `in` 基于 `==`,就理解了成员比较的真值相等语义。详见《值相等与引用相等》。

### 2.2 `in` 对集合与字典:哈希查找 O(1)(重点)

集合(set)、字典(dict)、冻结集合(frozenset)的 `in` 做**哈希查找**:通过元素的哈希值定位,O(1) 平均时间。这是 `in` 性能的关键分水岭。

**集合 `in`**:

```python
print(3 in {1, 2, 3})        # True —— 哈希查找
print(5 in {1, 2, 3})        # False
big_set = set(range(1_000_000))
print(999_999 in big_set)    # True —— O(1),无论集合多大都几乎瞬时
print(-1 in big_set)         # False —— O(1)
```

**字典 `in`(判断键,重点)**:

```python
d = {"name": "alice", "age": 30}
print("name" in d)           # True —— in 判断键
print("alice" in d)          # False —— "alice" 是值不是键!
print("age" in d)            # True
print(30 in d)               # False —— 30 是值,in 不查值
```

⚠️ **字典 `in` 判断键,不判断值**。这是 `in` 最常见的误解。`key in dict` 判断 key 是否是字典的键。要判断值,用 `value in dict.values()`;要判断键值对,用 `(key, value) in dict.items()`:

```python
d = {"name": "alice", "age": 30}
# 判断键(最常用,默认 in 行为)
print("name" in d)                    # True
# 判断值
print("alice" in d.values())          # True —— 显式查值
# 判断键值对
print(("name", "alice") in d.items()) # True
```

`in dict` 默认查键(因键是字典的"索引",最常用)。查值用 `.values()`(注意 `.values()` 的 `in` 仍是线性扫描 O(n),因值无哈希索引),查键值对用 `.items()`。详见《字典深度剖析》。

**哈希查找 O(1) 的前提:元素可哈希**。集合/字典的 `in` 依赖哈希,故元素必须可哈希(详见《hash 与可哈希类型》)。不可哈希对象(列表、字典、集合)不能做集合元素或字典键:

```python
# 可哈希:int、str、tuple(元素可哈希)、frozenset
print([1, 2] in {(1, 2), (3, 4)})   # False? [1,2] 是列表,与元组比不等
print((1, 2) in {(1, 2), (3, 4)})   # True —— 元组可哈希,是集合元素

# 不可哈希:列表、字典、集合不能做集合元素
# print({[1, 2]})  # TypeError: unhashable type: 'list'
# 故 "列表 in 集合" 也无法用集合存列表
```

集合/字典的元素(键)必须可哈希——这是 `in` 能 O(1) 的代价。可哈希对象(int/str/tuple/frozenset)能做集合元素,不可哈希(list/dict/set)不能。这就是为何"判断列表是否在大列表里"无法通过转集合加速(列表不可哈希),只能线性扫描或转换思路。详见 §2.6、§3.3。

**O(1) 的最坏情况**:哈希冲突严重时,集合/字典 `in` 退化为 O(n)(所有元素哈希到同桶)。但 Python 的哈希策略和随机化(`PYTHONHASHSEED`)使恶意构造冲突困难,实际平均 O(1)。自定义类型若 `__hash__` 实现差(所有对象返回同哈希),会退化——理解 `__eq__`/`__hash__` 契约对维持 O(1) 重要(详见《hash 与可哈希类型》)。

### 2.3 `in` 对字符串:子串匹配

字符串(str)的 `in` 判断**子串**关系:`sub in s` 为 True 当且仅当 `sub` 是 `s` 的连续子串。这比单字符匹配更强大。

```python
print("a" in "cat")           # True —— 单字符子串
print("at" in "cat")          # True —— 多字符子串
print("ct" in "cat")          # False —— "ct" 不是连续子串(c-a-t,c 和 t 不相邻)
print("" in "cat")            # True —— 空串是任何串的子串
print("cat" in "cat")         # True —— 自身是子串
print("Cat" in "cat")         # False —— 大小写敏感
```

**子串连续性**:`"ct" in "cat"` 为 False,因 `c` 和 `t` 在 "cat" 里不相邻(中间有 `a`)。`in` 判断连续子串,不是"所有字符都在"。

**大小写敏感**:字符串 `in` 大小写敏感,`"Cat" in "cat"` 为 False。需要忽略大小写,先统一大小写:

```python
s = "Hello World"
print("world" in s)                  # False(大小写不同)
print("world" in s.lower())          # True —— 统一小写后判断
print("WORLD" in s.upper())          # True
```

**空串的特殊性**:`"" in 任何串` 为 True(空串是任何串的子串,数学约定):

```python
print("" in "cat")           # True
print("" in "")              # True
# 这有时用于"非空判断"的反向逻辑,但通常用 if s: 判空更直观
```

**字符串 `in` 的实现**:CPython 的字符串 `in`(子串查找)用高效算法(Boyer-Moore、Crochemore 等,或快速搜索),平均比朴素 O(n*m) 快,但最坏仍与串长相关。日常子串判断用 `in`,需要位置/多次查找用 `find`/`index`/正则。

```python
# 只判断是否包含:用 in(返回 bool)
print("world" in "hello world")     # True
# 需要子串位置:用 find/index(返回下标)
print("hello world".find("world"))  # 6(下标,找不到 -1)
# print("hello world".index("xyz")) # ValueError(找不到报错)
```

`in` 判断是否包含(返回 bool),`find`/`index` 找位置(返回下标)。只需"有没有"用 `in`,需"在哪"用 `find`/`index`。详见《字符串深度剖析》。

### 2.4 `in` 对 range 与其他可迭代对象

`in` 对 `range` 和其他可迭代对象的判断,有特殊优化或回退到迭代。

**range 的 `in`(数学判断,优化)**:`x in range(start, stop, step)` 不必逐个迭代,而是数学判断 x 是否在等差数列里——O(1)(判断 x 是否在范围且满足步长)。

```python
print(5 in range(10))         # True —— 0..9 含 5
print(15 in range(10))        # False
print(5 in range(0, 10, 2))   # False —— 0,2,4,6,8,5 不在其中
print(6 in range(0, 10, 2))   # True —— 6 在 0,2,4,6,8 中
big_range = range(10**18)
print(999_999_999_999_999_999 in big_range)  # True —— O(1),不必遍历 10^18 个!
```

`range` 的 `in` 用数学计算:`x` 在 range 当且仅当 `start <= x < stop` 且 `(x - start) % step == 0`。这让 `x in range(10**18)` 也是 O(1)(不遍历),是 range 相对 list 的巨大优势。所以"判断大整数是否在连续范围"用 `range` 而非 `list`。

**其他可迭代对象(无 `__contains__`):回退迭代 O(n)**。若对象只实现了 `__iter__`(可迭代)但没实现 `__contains__`,`in` 回退到逐个迭代比较,O(n)。

```python
# 生成器:无 __contains__,in 回退迭代(且消耗生成器!)
gen = (x for x in [1, 2, 3])
print(2 in gen)               # True —— 迭代到 2
print(list(gen))              # [3] —— 生成器已被消耗到 2 之后,只剩 3!
# 注意:对生成器 in 会消耗它,且找不到时要迭代到耗尽

# 文件:in 逐行迭代
# with open("file.txt") as f:
#     if "keyword" in f: ...   # 逐行读,找到停,但消耗文件指针
```

⚠️ **对生成器/迭代器 `in` 会消耗它,且 O(n)**。生成器是"一次性"的,`in` 迭代它会把元素取走(且找不到时要耗尽)。所以对生成器 `in` 后,生成器状态已变,不能复用。文件对象同理(`in` 推进文件指针)。这种场景要么先转 list/set,要么接受一次性消耗。详见 §2.5 协议回退。

### 2.5 `__contains__` 协议与迭代回退

`in` 的底层是**协议方法 `__contains__`**:容器定义 `__contains__` 决定 `in` 行为。若对象没有 `__contains__`,`in` 回退到迭代(`__iter__` 或 `__getitem__`)。

**`x in c` 的求值逻辑**(伪代码):

```
1. type(c) 有 __contains__ 吗?
   有 → 调 type(c).__contains__(c, x),返回其 bool 值
   无 → 回退:遍历 c(用 __iter__ 或 __getitem__),逐个 == x,找到返 True,耗尽返 False
```

- 有 `__contains__`:容器自定义 `in` 行为(集合/字典/列表/字符串/range 都有,各自高效实现)。
- 无 `__contains__`:回退迭代,O(n),且对一次性迭代器(生成器)会消耗。

```python
# 自定义类实现 __contains__,定义 in 行为
class EvenNumbers:
    def __init__(self, max_n): self.max_n = max_n
    def __contains__(self, x):
        # 自定义:偶数且在范围内
        return isinstance(x, int) and 0 <= x < self.max_n and x % 2 == 0

evens = EvenNumbers(10)
print(4 in evens)             # True —— __contains__ 判断
print(3 in evens)             # False(奇数)
print(12 in evens)            # False(超范围)
# 这里 __contains__ 是 O(1)(数学判断),而非迭代
```

自定义类实现 `__contains__` 可定义 `in` 语义,且可实现高效判断(如上 `EvenNumbers` 用数学判断 O(1),而非迭代)。这是 `in` 协议的威力——容器自己决定如何高效判断成员。

**无 `__contains__` 回退迭代**:

```python
class OnlyIterable:
    def __init__(self, data): self.data = data
    def __iter__(self): return iter(self.data)   # 只实现 __iter__,无 __contains__

obj = OnlyIterable([1, 2, 3])
print(2 in obj)               # True —— 回退迭代,逐个 == 比较,O(n)
```

`OnlyIterable` 没 `__contains__`,`in` 回退到 `__iter__` 迭代,O(n)。所以"只实现 `__iter__` 的可迭代对象"`in` 是线性的,且(若是生成器)会消耗。

理解 `__contains__` 协议,就理解了 `in` 为何"行为因容器而异"(各容器 `__contains__` 实现不同)、为何自定义类能定义 `in`、为何生成器 `in` 会消耗(回退迭代)。详见《面向对象 OOP 全套》。

### 2.6 可哈希性与 `in` 的关系(重点)

集合/字典 `in` 的 O(1) 依赖哈希,而哈希要求元素**可哈希**(hashable)。可哈希性是"能否用集合/字典加速 `in`"的关键约束。

**可哈希对象**(能做集合元素/字典键,能 O(1) `in`):

- 不可变类型:int、float、str、tuple(元素都可哈希)、frozenset、bool、None。
- 实现了 `__hash__` 且 `__eq__` 一致的自定义类。

**不可哈希对象**(不能做集合元素/字典键):

- 可变类型:list、dict、set(其内容可变,哈希会失效)。
- 含不可哈希元素的 tuple(如 `(1, [2])`,因内部 list 不可哈希)。

```python
# 可哈希:能放进集合,集合 in 是 O(1)
s = {1, "a", (1, 2), None, True}
print("a" in s)              # True(快)
print((1, 2) in s)           # True

# 不可哈希:不能放进集合
# { [1, 2] }                 # TypeError: unhashable type: 'list'
# { {"a": 1} }               # TypeError: unhashable type: 'dict'
# 故判断"列表是否在列表集合里"无法用集合
```

⚠️ **陷阱:判断"某个列表是否在一堆列表里"无法用集合加速**:

```python
# 需求:判断 target_list 是否在 lists 集合里
target = [1, 2]
all_lists = [[1, 2], [3, 4], [5, 6]]
# 不能:set(all_lists) 报错(列表不可哈希)
# all_set = set(all_lists)   # TypeError!
# 只能线性扫描
print(target in all_lists)   # True —— O(n),线性
# 优化思路:把列表转元组(可哈希)存集合
all_tuples = {tuple(l) for l in all_lists}
print(tuple(target) in all_tuples)   # True —— O(1)(把列表转元组)
```

列表不可哈希,无法直接用集合 O(1) 查找。若需快速判断"列表成员",把列表转成元组(可哈希)再存集合——`tuple(target) in {tuple(l) for l in all_lists}`。这是处理"不可哈希对象成员判断"的常用思路:转成可哈希等价形式。

**`__hash__` 与 `__eq__` 一致性**:自定义类要可哈希,需 `__hash__` 与 `__eq__` 满足契约(相等的对象哈希相等,详见《值相等与引用相等》§4.4)。否则集合/字典 `in` 会出错(相等的对象因哈希不同散到不同桶,找不到)。

理解可哈希性,就理解了集合/字典 O(1) `in` 的前提与代价:元素必须可哈希,不可哈希对象(列表/字典/集合)只能线性 `in` 或转可哈希形式。详见《hash 与可哈希类型》。

### 2.7 `in` 在推导式与表达式中的用法

`in` 常出现在推导式的**过滤条件**和表达式中,是写出简洁 Python 的关键。

**推导式过滤**:`if x in container` 作为过滤条件。

```python
# 过滤出在白名单里的用户
all_users = ["alice", "bob", "carol", "dave"]
vip = {"alice", "carol"}     # 集合,O(1) in
vip_users = [u for u in all_users if u in vip]
print(vip_users)             # ['alice', 'carol']

# 过滤出大写字母
chars = "Hello World 123"
upper = [c for c in chars if c in "ABCDEFGHIJKLMNOPQRSTUVWXYZ"]
print(upper)                 # ['H', 'W']
```

**多元素判断**:用 `in` 替代多个 `or`。

```python
# 不推荐:多个 or
# if status == "active" or status == "pending" or status == "queued": ...
# 推荐:in
if status in ("active", "pending", "queued"):   # 元组 in,O(n) 但元素少可接受
    process()
# 若判断频繁且元素多,用集合
ACTIVE_STATUSES = {"active", "pending", "queued"}   # 集合,O(1)
if status in ACTIVE_STATUSES:
    process()
```

`x in (a, b, c)` 替代 `x == a or x == b or x == c`,更简洁。元素少用元组(线性但常数小),元素多或判断频繁用集合(O(1))。

**`in` 与链式比较的区别**:`in` 不是链式比较运算符,`a in b in c` 是"a in b 且 b in c"(链式),不是"a 和 b 都 in c":

```python
# 链式 in:a in b 且 b in c(罕见,易读性差)
# print(1 in [1,2] in [[1,2],[3]])  # a=1 in [1,2]=True,且 [1,2] in [[1,2],[3]]=True → True
# 通常不这么写,展开更清晰
print(1 in [1, 2] and [1, 2] in [[1, 2], [3]])  # True(显式 and)
```

`a in b in c` 是链式(详见《链式比较》),语义"a 在 b 里 且 b 在 c 里",通常很反直觉,应展开成显式 `and`。

### 2.8 综合示例:`in` 与 `not in` 实战

下面这个片段集中演示 `in`/`not in` 的典型用法,阅读时对照每段行为:

```python
import time

# 1. 各容器 in
print("=== 各容器 in ===")
print(3 in [1, 2, 3])                # True(列表)
print(3 in (1, 2, 3))                # True(元组)
print(3 in {1, 2, 3})                # True(集合)
print("name" in {"name": "alice"})   # True(字典键)
print("at" in "cat")                 # True(子串)
print(6 in range(0, 10, 2))          # True(range 数学判断)

# 2. not in
print("=== not in ===")
print(5 not in [1, 2, 3])            # True

# 3. 字典:判键 vs 判值
print("=== 字典判键/值 ===")
d = {"name": "alice", "age": 30}
print(f"'name' in d(键): {'name' in d}")           # True
print(f"'alice' in d.values(值): {'alice' in d.values()}")  # True
print(f"('name','alice') in d.items: {('name','alice') in d.items()}")  # True

# 4. 性能:list O(n) vs set O(1)
print("=== 性能 ===")
big_list = list(range(100_000))
big_set = set(big_list)
t = time.perf_counter()
_ = 99_999 in big_list
t_list = time.perf_counter() - t
t = time.perf_counter()
_ = 99_999 in big_set
t_set = time.perf_counter() - t
print(f"列表 in: {t_list:.6f}s, 集合 in: {t_set:.6f}s")

# 5. 字符串子串与大小写
print("=== 字符串 ===")
print("'world' in 'hello world':", "world" in "hello world")   # True
print("'World' in 'hello world'(大小写):", "World" in "hello world")  # False
print("'world' in lower:", "world" in "hello world".lower())   # True
print("''(空串) in 'cat':", "" in "cat")   # True

# 6. 可哈希性:列表不能进集合
print("=== 可哈希 ===")
print((1, 2) in {(1, 2), (3, 4)})    # True(元组可哈希)
# 不可哈希转元组
target = [1, 2]
all_lists = [[1, 2], [3, 4]]
all_tuples = {tuple(l) for l in all_lists}
print("列表成员(转元组):", tuple(target) in all_tuples)  # True

# 7. range O(1) 大数判断
print("=== range ===")
print(10**15 in range(10**18))        # True(O(1),不遍历)

# 8. 推导式过滤 + in
print("=== 推导式 ===")
users = ["alice", "bob", "carol"]
vip = {"alice", "carol"}
print([u for u in users if u in vip])  # ['alice', 'carol']

# 9. in 替代多 or
print("=== in 替代 or ===")
status = "pending"
print(status in ("active", "pending", "queued"))  # True

# 10. in 用 == 比较(跨类型)
print("=== == 比较 ===")
print(1.0 in [1, 2, 3])              # True(1.0==1)
print(True in [1, 2, 3])             # True(True==1)
```

跑一遍这段示例,对照输出:各容器 `in`(列表/元组/集合/字典键/字符串子串/range)、`not in`、字典判键vs值、list O(n) vs set O(1) 性能、字符串子串与大小写、可哈希(列表转元组)、range O(1) 大数、推导式过滤、`in` 替代 or、`==` 跨类型比较——`in`/`not in` 的完整图景就清晰了。核心结论:**判断键用 `in dict`、值用 `.values()`;大集合 `in` 用 set/dict(O(1))不用 list(O(n));字典 in 判键非值、字符串判子串;不可哈希对象转元组;range in 是 O(1);`in` 用 `==` 比较**。

---

## 3. 最佳实践

### 3.1 反复/大量成员判断用集合,不用列表

```python
# 推荐:判断集合成员,转 set,O(1) 查找
valid_ids = set(load_all_ids())      # 一次转集合
for item in items:
    if item.id in valid_ids: ...     # O(1) 查找,快

# 危险:对大列表反复 in,O(n) 每次累加 O(n²)
# valid_ids = load_all_ids()  # list
# for item in items:
#     if item.id in valid_ids: ...  # 每次 O(n),极慢
```

判断"元素是否在大量数据里",把数据转集合(O(1) `in`),而不是对列表反复 `in`(O(n))。一次 `set()` 转换的代价,换来后续每次 O(1) 查找——元素多或判断频繁时收益巨大。这是 `in` 性能优化的头号原则。

### 3.2 字典判键用 `in`,判值用 `.values()`,别混淆

```python
d = {"name": "alice", "age": 30}
# 判键(默认 in 行为,最常用)
if "name" in d: ...                  # True
if "height" not in d: d["height"] = 0  # 键不存在则设默认

# 判值(显式 .values(),但 O(n))
if "alice" in d.values(): ...        # True

# 判键值对
if ("name", "alice") in d.items(): ...  # True
```

`in dict` 判键(因键是索引,最常用、O(1))。判值用 `.values()`(O(n),因值无哈希索引)。判键值对用 `.items()`。最常见的错是把判值误当判键——记住 `in dict` 永远是键。

### 3.3 不可哈希对象成员判断,转可哈希等价形式

```python
# 列表不可哈希,不能进集合,转元组
target = [1, 2]
all_lists = [[1, 2], [3, 4], [5, 6]]
# 不能:set(all_lists) 报错
# 优化:转元组存集合
all_set = {tuple(l) for l in all_lists}
print(tuple(target) in all_set)      # True,O(1)

# 不优化:线性扫
print(target in all_lists)           # True,O(n)
```

判断"列表/字典等不可哈希对象是否在集合里"无法用集合(不可哈希)。把不可哈希对象转成可哈希等价形式(列表→元组),存集合 O(1) 查找。这是处理不可哈希成员判断的标准思路。

### 3.4 用 `in` 替代多个 `==`/`or`

```python
# 推荐:in
if status in ("active", "pending", "queued"): ...
if char in "aeiou": ...              # 元音判断
if key in ("name", "age", "email"): ...

# 不推荐:多 or
# if status == "active" or status == "pending" or status == "queued": ...
```

`x in (a, b, c)` 替代 `x == a or x == b or x == c`,更简洁、易扩展。元素少用元组(线性但常数小),元素多或判断频繁用集合/`frozenset`(O(1))。

### 3.5 `not in` 优于 `not ... in`

```python
# 推荐:not in(合成运算符,清晰)
if key not in d: ...
if item not in blacklist: ...

# 不推荐:not ... in(啰嗦,PEP 8 不推荐)
# if not key in d: ...
```

`not in` 是合成比较运算符,比 `not (x in c)` / `not x in c` 更清晰,PEP 8 推荐。同理 `is not` 优于 `not ... is`。

### 3.6 对生成器/迭代器 `in` 会消耗,慎用

```python
# 危险:in 消耗生成器,且找不到时迭代到耗尽
gen = (x for x in [1, 2, 3])
print(2 in gen)            # True
print(list(gen))           # [3] —— 已消耗,只剩 3
print(5 in gen)            # False(已耗尽)

# 推荐:需多次判断先转 list/set
data = list(gen)           # 物化
if 2 in data: ...          # 可重复判断
```

生成器/迭代器是一次性的,`in` 会迭代消耗它,且找不到时要耗尽。对生成器 `in` 后状态已变,不能复用。需多次成员判断,先 `list()`/`set()` 物化。

### 3.7 字符串 `in` 判子串,大小写敏感

```python
# 大小写敏感
print("World" in "hello world")   # False
# 忽略大小写:统一大小写
print("world" in "hello world".lower())  # True

# 只判有无用 in,需位置用 find/index
if "error" in log_text: ...       # 有无
pos = log_text.find("error")     # 位置(找不到 -1)
```

字符串 `in` 判连续子串、大小写敏感。忽略大小写先 `.lower()`/`.upper()`。只需"有没有"用 `in`,需"在哪"用 `find`/`index`。

### 3.8 range 的 `in` 是 O(1),判断大范围优先用 range

```python
# 推荐:大范围判断用 range(数学判断 O(1))
if x in range(10**18): ...        # O(1),不遍历
if x in range(0, 1_000_000, 7): ...  # O(1),判断是否在等差数列

# 不推荐:转 list 判断(占内存且 O(n) in)
# big = list(range(10**18))  # 内存爆炸,不可能
# if x in big: ...
```

`range` 的 `in` 是数学判断 O(1),判断"整数是否在连续/等差范围"用 `range` 而非 `list`(后者占内存且 O(n))。`range(10**18)` 不占内存(惰性),`in` 仍 O(1)。

### 3.9 集合/字典 `in` 的 O(1) 依赖良好 `__hash__`

```python
# 自定义类做集合元素/字典键,需 __hash__ 与 __eq__ 一致
class Point:
    def __init__(self, x, y): self.x, self.y = x, y
    def __eq__(self, o): return isinstance(o, Point) and (self.x,self.y)==(o.x,o.y)
    def __hash__(self): return hash((self.x, self.y))   # 与 __eq__ 同字段
# 这样 Point 可做集合元素,且 in 是 O(1)
print(Point(1,2) in {Point(1,2), Point(3,4)})  # True

# 危险:__hash__ 差(所有对象同哈希),in 退化为 O(n)
# class Bad:
#     def __hash__(self): return 1   # 全同哈希,冲突严重,O(n)
```

自定义类做集合元素/字典键,`__hash__` 要与 `__eq__` 一致(相等的对象哈希相等),基于同字段。差的 `__hash__`(全同哈希)会让 `in` 退化为 O(n)。详见《hash 与可哈希类型》《值相等与引用相等》。

### 3.10 `in` 用 `==` 比较,注意跨类型相等与 `nan`

```python
# in 用 == 比较,跨类型数值相等
print(1.0 in [1, 2])      # True(1.0==1)
print(True in [1, 2])     # True(True==1)

# nan 陷阱:nan != nan,故 nan in [nan] 行为特殊
nan = float('nan')
print(nan in [nan])       # True —— 列表 in 用 ==,但 nan==nan 为 False?
# 实际:CPython 列表 in 对相同对象用 is 快速判断,故 nan in [nan] 是 True(同一对象)
print(nan in [float('nan')])  # False —— 不同的 nan 对象,== 失败
```

`in` 用 `==` 比较成员。数值跨类型相等(1.0==1)。`nan` 特殊:`nan == nan` 为 False,故 `nan in [另一个nan]` 为 False(不同 nan 对象);但 `nan in [同一个nan]` 为 True(CPython 列表 `in` 先用 `is` 快速判断同对象)。处理含 `nan` 的成员判断要小心,详见《float 类型与精度问题》。

### 3.11 `in` 返回 bool,可直接用于条件,勿与 `and`/`or` 返回值混淆

```python
# in 返回 True/False(bool),可直接 if
if "admin" in users: ...
result = x in collection     # result 是 bool,不是操作数

# 对比:and/or 返回操作数,in 返回 bool
print(3 in [1,2,3])          # True(bool)
print(3 and [1,2,3])         # [1,2,3](and 返回操作数)
```

`in` 永远返回 `bool`(`True`/`False`),可直接用于 `if` 条件,也可赋值给变量。不像 `and`/`or` 返回操作数本身。这点与比较运算符一致(`<`/`==` 也返回 bool)。

---

## 4. 原理

本章讲清 `in`/`not in` 背后的机制:`__contains__` 协议与迭代回退、各容器 `__contains__` 的实现差异(list 线性扫 vs set/dict 哈希查 vs str 子串 vs range 数学判断)、可哈希性如何决定能否 O(1)、`in` 用 `==` 比较的语义。这些是"`in` 为何如此"的根基。

### 4.1 `__contains__` 协议:`in` 的统一接口

`in` 在 Python 对象模型里通过**协议方法 `__contains__`** 实现:`x in c` 调用 `type(c).__contains__(c, x)`,返回其布尔值。这是 `in` 的统一接口——不同容器通过各自的 `__contains__` 实现不同行为。

```
x in c 的求值:
1. type(c) 有 __contains__ 吗?
   有 → return bool(type(c).__contains__(c, x))
   无 → 回退:迭代 c,逐个 == x,找到 True,耗尽 False
```

各内置容器的 `__contains__` 实现:

- **list/tuple**:`__contains__` 线性扫描,逐个 `==` 比较,O(n)。
- **set/frozenset/dict**:`__contains__` 哈希查找,先 `hash(x)` 定位桶,再 `==` 桶内元素,O(1) 平均。
- **str**:`__contains__` 子串查找(高效字符串搜索算法)。
- **range**:`__contains__` 数学判断(`start <= x < stop and (x-start)%step==0`),O(1)。

```python
# 验证各容器有 __contains__
print([].__contains__)              # <method '__contains__' of 'list'>
print({}.__contains__)              # dict 也有
print("".__contains__)              # str 也有
print(range(10).__contains__)       # range 也有
# 自定义类可重载
class C:
    def __contains__(self, x): return x == 42
print(42 in C(), 7 in C())          # True False
```

**回退机制**:若对象没 `__contains__`,`in` 回退到迭代——用 `__iter__`(优先)或 `__getitem__`(旧式,按索引取直到 IndexError)。这让"任何可迭代对象"都能用 `in`(虽 O(n) 且可能消耗)。

```python
# 只有 __iter__,无 __contains__,in 回退迭代
class Iterable:
    def __iter__(self): return iter([1, 2, 3])
obj = Iterable()
print(2 in obj)              # True —— 回退迭代,O(n)
# 生成器同理,且会消耗
```

理解 `__contains__` 协议,就理解了 `in` 为何"统一语法、行为各异"(各容器各自实现 `__contains__`)、为何自定义类能定义 `in`、为何生成器/迭代器 `in` 会消耗且 O(n)(回退迭代)。这是 `in` 灵活性的根源。详见《面向对象 OOP 全套》。

### 4.2 list O(n) vs set/dict O(1):线性扫与哈希查

`in` 在 list 与 set/dict 上的性能天差地别,根源于 `__contains__` 的实现:线性扫描 vs 哈希查找。

**list/tuple 的 `__contains__`:线性扫描 O(n)**

```
list.__contains__(lst, x):
    for item in lst:              # 逐个遍历
        if item == x:             # == 比较
            return True
    return False
```

线性扫描:从第一个元素逐个 `==` 比较,最坏扫完 n 个。元素在末尾或不存在时扫全部。复杂度 O(n),与列表长度成正比。

**set/dict 的 `__contains__`:哈希查找 O(1)**

```
set.__contains__(s, x):
    h = hash(x)                   # 算哈希
    bucket = h % len(s.__table)   # 定位桶
    for item in s.__table[bucket]:  # 只查该桶(通常很少元素)
        if item == x:
            return True
    return False
```

哈希查找:先算 `hash(x)` 定位到桶(bucket),只在该桶内 `==` 比较(桶内元素通常很少或 0)。平均 O(1)(哈希分布良好时)。这是集合/字典 `in` 极快的根源——不必扫描全部,哈希直接定位。

**性能差异的量级**:对 100 万元素的容器,`in` 末尾元素:

- list:扫近 100 万次比较,毫秒级。
- set:哈希定位 + 桶内比较(几次),微秒级。

差上千倍。故"大量成员判断"必须用 set/dict,不用 list。

**O(1) 的前提与退化**:

- **元素可哈希**:set/dict 的 `__contains__` 第一步 `hash(x)`,若 x 不可哈希会报错(故不可哈希对象不能进集合)。
- **哈希分布良好**:若哈希冲突严重(多个元素同桶),桶内扫描退化,最坏 O(n)。Python 的哈希策略 + 随机化(`PYTHONHASHSEED`)使冲突罕见,平均 O(1)。
- **自定义 `__hash__` 差**:若自定义类 `__hash__` 返回常量(全同哈希),所有对象同桶,`in` 退化 O(n)。故 `__hash__` 要分布良好(基于字段)。

理解线性扫 vs 哈希查,就理解了 `in` 性能差异的根源,以及"为何集合/字典 O(1) 需要可哈希元素 + 良好哈希"。详见《hash 与可哈希类型》。

### 4.3 str 的子串查找与 range 的数学判断

str 和 range 的 `__contains__` 各有特殊实现,不是朴素线性扫,提供了高效或 O(1) 的 `in`。

**str 的 `__contains__`:子串查找**:

```
str.__contains__(s, sub):
    # 判断 sub 是否是 s 的连续子串
    # 用高效字符串搜索(如 Crochemore-Perrin / 快速搜索),非朴素 O(n*m)
    return sub in s  # 子串匹配
```

str 的 `in` 判断子串(连续),实现用高效字符串搜索算法(比朴素 `O(n*m)` 快,平均接近 O(n+m))。故 `"abc" in "xxxabcyyy"` 高效。子串连续性源于"在 s 中找 sub 的首次出现"——找不到连续匹配则 False。

**range 的 `__contains__`:数学判断 O(1)**:

```
range.__contains__(r, x):
    # x in range(start, stop, step) 当且仅当:
    #   1. start <= x < stop(在范围内,考虑 step 正负)
    #   2. (x - start) % step == 0(在等差数列上)
    # O(1) 数学计算,不遍历
```

range 的 `in` 是数学判断:`x` 在 range 当且仅当 `x` 在范围 `[start, stop)`(方向考虑 step)且 `(x - start) % step == 0`(落在等差数列点上)。这让 `10**15 in range(10**18)` 也是 O(1)——不遍历 10^18 个数,只算两个条件。这是 range 相对 list(物理存所有元素)的核心优势:range 惰性存(只存 start/stop/step),`in` 数学判断。

```python
# range in 的数学判断
r = range(0, 20, 3)    # 0,3,6,9,12,15,18
print(9 in r)          # True(9 在范围,9%3==0)
print(10 in r)         # False(10 在范围但 10%3≠0)
print(21 in r)         # False(超 stop)
```

理解 str 子串查找(高效搜索)和 range 数学判断(O(1)),就理解了这两个容器 `in` 为何高效且行为特殊——它们有优化的 `__contains__`,非朴素线性扫。

### 4.4 `in` 用 `==` 比较:成员相等语义

`in` 判断成员时用 `==`(不是 `is`)比较,故成员关系遵循值相等语义。这决定了 `in` 的若干行为。

**`x in c` 的比较逻辑**(list 为例):

```
for item in c:
    if item is x or item == x:   # CPython 优化:先 is 快速判同对象
        return True
```

CPython 的 `in` 实现里,先 `is` 快速判断"是否同一对象"(同对象必相等,免去 `==` 调用),再 `==` 比较。这让 `in` 既高效(同对象快速命中)又遵循值相等(`==`)。

**跨类型数值相等**:`1.0 in [1]` 为 True,因 `1.0 == 1`(`==` 跨数值类型相等)。

```python
print(1.0 in [1, 2, 3])      # True —— 1.0 == 1
print(True in [1, 2, 3])     # True —— True == 1
```

**容器深度比较**:`[1,2] in [[1,2]]` 为 True,因列表 `==` 是值比较。

```python
print([1, 2] in [[1, 2], [3]])  # True —— [1,2] == [1,2]
```

**`nan` 特殊性**:因 `nan != nan`,`nan in [其他nan]` 为 False(`==` 失败);但 `nan in [同一nan]` 为 True(CPython 先 `is` 判断同对象快速命中)。

```python
nan = float('nan')
print(nan in [nan])              # True —— 同一对象,is 快速命中
print(nan in [float('nan')])     # False —— 不同 nan 对象,== 失败(is 不同,== 也 False)
```

`nan in [同一nan]` 为 True 是 CPython `is` 优化的副作用——同对象 `is` 命中,跳过 `==`。而 `nan in [另一nan]` 因 `is` 不同、`==`(nan≠nan)也 False,故 False。这解释了 `nan` 成员判断的特殊行为。详见《float 类型与精度问题》。

理解 `in` 用 `==` 比较(配合 `is` 优化),就理解了 `in` 的值相等语义、跨类型相等、容器深度比较、`nan` 特殊性。详见《值相等与引用相等》。

### 4.5 可哈希性:`in` 能否 O(1) 的约束

set/dict 的 `in` 依赖哈希(`__contains__` 第一步 `hash(x)`),这要求元素可哈希——可哈希性是 `in` 能否 O(1) 的硬约束。

**可哈希的对象**:实现了 `__hash__`(返回稳定 int)且 `__eq__` 满足契约(相等则哈希相等)。可哈希对象能做集合元素/字典键,其 `in` 是 O(1)。

- 不可变内置类型(int/str/tuple/frozenset/bool/None)可哈希。
- 自定义类默认可哈希(默认 `__hash__` 基于 id),但重载 `__eq__` 后需自定义 `__hash__`。

**不可哈希的对象**:可变类型(list/dict/set)不可哈希,因其内容可变——若可哈希,内容改变后哈希应变,但对象身份不变,会破坏"对象哈希稳定"的假设,导致集合/字典内部错乱。故可变类型禁止哈希(`__hash__ = None`),不能做集合元素/字典键。

```python
# 不可哈希:不能进集合
# { [1, 2] }          # TypeError: unhashable type: 'list'
# { {"a": 1} }        # TypeError: unhashable type: 'dict'
# 含不可哈希元素的 tuple 也不可哈希
# hash((1, [2]))      # TypeError
```

**对 `in` 的影响**:

- 判断"可哈希对象在大集合里"→ 转集合,O(1) `in`。
- 判断"不可哈希对象(如列表)在集合里"→ 不能转集合(报错),只能线性扫,或转可哈希等价形式(列表→元组)。

```python
# 列表不可哈希,不能进集合
# set([[1,2],[3,4]])  # TypeError
# 故判断列表成员只能线性
print([1,2] in [[1,2],[3,4]])   # True,O(n)
# 转元组(可哈希)存集合
print((1,2) in {(1,2),(3,4)})   # True,O(1)
```

理解可哈希性,就理解了"为何不可哈希对象不能享受 O(1) `in`"——`__contains__` 的哈希查找需 `hash(x)`,不可哈希对象无 `__hash__`。这是 set/dict O(1) 的代价:元素必须可哈希。详见《hash 与可哈希类型》。

---

## 5. 总结

### 5.1 本文内容回顾

- **什么是 `in`/`not in`**:成员运算符,判断 x 是否是容器成员;`in` 返回 bool,`not in` 是合成运算符(优于 `not ... in`);统一所有容器的成员判断语法。
- **两个角色**:成员运算符 `in`(`x in c` 判断,本篇)vs `for` 迭代 `in`(遍历,见《流程控制》),语法位置与语义不同。
- **list/tuple 的 in**:线性扫描 O(n),逐个 `==` 比较;大列表反复 in 极慢(O(n²)),应转集合;用 `==` 比较(跨类型相等、容器深度比较)。
- **set/dict 的 in(重点)**:哈希查找 O(1) 平均,通过 `hash(x)` 定位桶;前提是元素可哈希、哈希分布良好;dict 的 in 判断**键**(不是值),判值用 `.values()`(O(n))、键值对用 `.items()`。
- **str 的 in**:判断**连续子串**(非单字符),大小写敏感;`"" in s` 恒 True;高效搜索算法;只判有无用 in、需位置用 find/index。
- **range 的 in**:数学判断 O(1)(`x` 在范围且 `(x-start)%step==0`),不遍历;判断大范围优先用 range 而非 list。
- **其他可迭代对象(无 `__contains__`)**:回退迭代 O(n);对生成器/迭代器 in 会消耗且 O(n),需多次判断先物化。
- **`__contains__` 协议**:`in` 调用 `__contains__`,各容器各自实现(线性/哈希/子串/数学);无 `__contains__` 回退迭代;自定义类可重载定义 in 行为。
- **可哈希性(重点)**:set/dict 的 O(1) in 依赖哈希,元素必须可哈希;不可哈希(list/dict/set)不能进集合,只能线性 in 或转可哈希等价形式(列表→元组);`__hash__` 与 `__eq__` 要一致。
- **推导式与表达式**:in 作过滤条件;`x in (a,b,c)` 替代多 `==`/`or`(元素少用元组、多/频繁用集合);`a in b in c` 是链式(语义反直觉,展开为 and)。
- **最佳实践**:大量成员判断用集合不用列表、字典判键用 in 判值用 values、不可哈希转可哈希等价、in 替代多 or、用 not in、生成器 in 慎用先物化、字符串 in 判子串大小写敏感、大范围用 range、自定义类好 `__hash__`、in 用 == 含 nan 陷阱、in 返回 bool。
- **原理**:`__contains__` 协议(统一接口,各容器各自实现,无则回退迭代);list 线性扫 O(n) vs set/dict 哈希查 O(1)(`hash(x)` 定位桶,需可哈希+分布良好,差哈希退化 O(n));str 子串查找(高效搜索)与 range 数学判断(O(1));in 用 `==` 比较(CPython 先 `is` 优化),值相等语义、跨类型、深度比较、nan 同对象 `is` 命中;可哈希性是 O(1) in 的硬约束(可变类型不可哈希)。

### 5.2 读完本文你应能掌握

- 说明 `in`/`not in` 的成员判断语义,`in` 返回 bool、`not in` 是合成运算符(优于 `not ... in`)。
- 说明 `in` 对 list/tuple(线性扫描 O(n))与 set/dict(哈希查找 O(1))的性能差异,在大量成员判断时正确选用集合而非列表。
- 说明 dict 的 `in` 判断键(非值),用 `.values()` 判值、`.items()` 判键值对,指出判值是 O(n)。
- 说明 str 的 `in` 判断连续子串、大小写敏感,用 `.lower()`/`.upper()` 忽略大小写,区分 `in`(有无)与 `find`/`index`(位置)。
- 说明 range 的 `in` 是数学判断 O(1),判断大范围用 range 而非 list。
- 说明 `__contains__` 协议:各容器各自实现 `__contains__`,无则回退迭代(生成器会消耗且 O(n)),自定义类可重载。
- 说明可哈希性:set/dict 的 O(1) `in` 依赖哈希,元素必须可哈希;不可哈希对象(list/dict/set)不能进集合,转可哈希等价形式(列表→元组)查询。
- 用 `x in (a,b,c)` 替代多 `==`/`or`,在推导式中用 `in` 过滤,识别 `a in b in c` 链式语义陷阱。
- 说明 `in` 用 `==` 比较(配合 `is` 优化)带来的跨类型相等、深度比较、`nan` 同对象 `is` 命中行为。
- 阐述 `__contains__` 协议、list 线性 vs set/dict 哈希、str 子串与 range 数学判断、`==` 比较语义、可哈希性约束。

### 5.3 延伸方向

- **值相等与引用相等**:`in` 用 `==` 比较成员、`__eq__`/`__hash__` 契约,见《值相等与引用相等》。
- **hash 与可哈希类型**:可哈希性、`__hash__` 实现、哈希冲突,见《hash 与可哈希类型》。
- **集合与冻结集合**:set/frozenset 的哈查找、去重、集合运算,见《集合与冻结集合》。
- **字典深度剖析**:dict 的键查找 O(1)、`in` 判键、`.values()`/`.items()`,见《字典深度剖析》。
- **字符串深度剖析**:子串查找、`find`/`index`、`in` 的大小写与编码,见《字符串深度剖析》。
- **列表深度剖析**:列表线性扫描、`in`/`index`、性能特性,见《列表深度剖析》。
- **链式比较**:`a in b in c` 的链式语义,见《链式比较》。
- **流程控制**:`for x in c:` 的迭代 `in`(与成员 `in` 区分),见《流程控制》。
