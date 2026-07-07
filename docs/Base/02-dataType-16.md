---
group:
  title: 【02】基础数据类型和类型系统
  order: 2
order: 16
title: hash与可哈希类型
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 hash 与可哈希

hash(哈希/散列)是把**任意数据映射成固定大小整数**的函数——给定一个对象,`hash()` 函数返回一个整数,这个整数叫该对象的**哈希值**(hash value)。例如 `hash("hello")` 返回某个整数(如 -627789318),`hash(42)` 返回 42。哈希值是对象的"数字指纹",用于快速比较与定位。

```python
print(hash("hello"))     # 某整数,如 -627789318(不同 Python/版本可能不同)
print(hash(42))          # 42
print(hash((1, 2, 3)))   # 某整数
# hash(list)  # TypeError:list 不可哈希
```

**可哈希(hashable)** 是对象能被 `hash()` 计算哈希值的性质。一个对象可哈希,意味着它满足 hash 协议:实现了 `__hash__` 方法、且哈希值在其生命周期内不变。可哈希对象能做 `dict` 的键、`set`/`frozenset` 的元素——这是可哈希性最直接的实用价值。

```python
# 可哈希对象能做 dict 键 / set 元素
d = {"name": "Alice", 42: "answer"}    # str、int 键,可哈希
s = {1, 2, 3, "hello", (1, 2)}         # int、str、tuple 元素,可哈希
# 不可哈希对象不能做键/元素
# d = {[1, 2]: "value"}    # TypeError:list 不可哈希,不能做 dict 键
# s = {[1, 2], [3, 4]}     # TypeError:list 不可哈希,不能做 set 元素
```

`dict` 和 `set` 底层是**哈希表**(hash table),它们的"O(1) 查找/插入/删除"完全依赖键/元素的哈希值。哈希表用哈希值定位存储槽位——若对象没有哈希值(不可哈希),哈希表无法定位它,故不可哈希对象不能做 dict 键/set 元素。这是可哈希性与 dict/set 的根本关联。

哪些类型可哈希?核心规则:**不可变对象通常可哈希,可变对象不可哈希**。

- **可哈希(不可变)**:`int`、`float`、`complex`、`bool`、`str`、`tuple`(元素都可哈希时)、`frozenset`、`None`、自定义类实例(默认)。
- **不可哈希(可变)**:`list`、`dict`、`set`、`bytearray`。

```python
print(hash(42))          # 42(int 可哈希)
print(hash("hi"))        # 整数(str 可哈希)
print(hash((1, 2)))      # 整数(tuple 元素都可哈希,可哈希)
print(hash(frozenset([1,2])))  # 整数(frozenset 可哈希)
# hash([1, 2])           # TypeError(list 不可哈希)
# hash({"a": 1})         # TypeError(dict 不可哈希)
# hash({1, 2})           # TypeError(set 不可哈希)
# hash((1, [2]))         # TypeError(tuple 含 list,不可哈希)
```

注意 `tuple` 的特殊:tuple 本身不可变,但若**元素含不可哈希对象**(如 `(1, [2])`),该 tuple 不可哈希。可哈希性是"递归"的——容器可哈希要求其所有元素都可哈希。

为什么可变对象不可哈希?因为可变对象内容可改,哈希值应"随内容变"以保持正确性。但若哈希值随内容变,对象存进哈希表后改了内容,哈希值变了,就再也找不到它了(用旧哈希定位,内容已变)。Python 从源头杜绝:可变对象直接设为不可哈希(`__hash__ = None`),禁止做键/元素,避免"存进去后改内容导致丢失"的灾难。

```python
print([].__hash__)       # None —— list 的 __hash__ 被置空,故不可哈希
print((1,).__hash__)     # <method-wrapper ...> —— tuple 有 __hash__
```

`list.__hash__` 是 `None`(显式禁用),故 `hash([])` 报 TypeError。这是可变对象不可哈希的实现机制。

本篇要系统讲透 hash 与可哈希:`hash()` 函数、可哈希性的判定规则、`__hash__`/`__eq__` 的契约(可哈希的核心协议)、tuple/frozenset 的递归可哈希、自定义类的可哈希性、dict/set 哈希表如何用哈希值、哈希冲突处理、可哈希性与不可变性的关系、`__hash__` 重写陷阱。这是本大章节(基础数据类型与类型系统)的收官篇——hash 与可哈希性是理解 dict/set 容器、对象相等性、类型系统的关键机制,贯穿前面多篇(dict 可哈希键、bool 即 int 的哈希、类型判断的 `__hash__` 等)。

### 1.2 可哈希性的核心:__hash__/__eq__ 契约

可哈希不只是"有 `__hash__` 方法"——它还要求与 `__eq__` 满足一条**契约**:**若 `a == b`,则 `hash(a) == hash(b)`**(值相等的对象哈希必相等)。这条契约是 dict/set 正确工作的基石,理解它就理解可哈希性的本质。

**契约内容**:可哈希对象必须满足:

1. **哈希值不变**:对象生命周期内,`hash(obj)` 返回值不变(不可变性保证)。
2. **`__eq__` 一致**:若 `a == b` 为真,则 `hash(a) == hash(b)` 必为真(值相等→哈希相等)。

```python
# 契约演示:值相等的对象哈希相等
print(42 == 42.0)          # True(int 与 float 值相等)
print(hash(42) == hash(42.0))   # True!哈希也相等
print("hi" == "hi")        # True
print(hash("hi") == hash("hi")) # True
```

`42 == 42.0` 为 True(值相等),故 `hash(42) == hash(42.0)` 必为 True。这在 dict 里很重要——`d = {42: "int"}` 后 `d[42.0]` 也能查到(因 42 和 42.0 哈希相等且 `==`,哈希表当作同一键):

```python
d = {42: "用 int 键存的"}
print(d[42])         # 用 int 键存的
print(d[42.0])       # 用 int 键存的!因 42.0 == 42 且 hash 相同,哈希表找到同一槽
```

`d[42.0]` 找到 `d[42]` 的值——因 42 与 42.0 哈希相等且 `==`,哈希表视为同一键。这是契约的实用后果——值相等的对象在 dict/set 里"互通"。

**为何要这条契约**:哈希表用哈希值定位槽位、用 `==` 确认键。若 `a == b` 但 `hash(a) != hash(b)`,a 和 b 会定位到不同槽位——存 a 后用 b 查,定位到 b 的槽(空),查不到 a!这违背"相等对象在 dict 里应互通"的语义。故契约要求"相等→哈希相等",保证相等对象定位到同槽(可能同槽内多元素,再用 == 确认)。

**反方向不要求**:`hash(a) == hash(b)` **不要求** `a == b`——不同对象哈希可相等(哈希冲突,正常)。`hash(1) == hash(1.0)` 且 `1 == 1.0`(都等);但 `hash("a") == hash("b")` 可能偶等(冲突)而 `"a" != "b"`。哈希冲突允许(哈希值空间有限,对象无限),哈希表用 `==` 区分同槽的不同对象。

```python
# 哈希冲突:不同对象哈希可相等(允许)
# hash(某str1) == hash(某str2) 可能,但 str1 != str2
# dict/set 用 == 区分同槽冲突对象
```

**违约的后果**:若自定义类 `__hash__`/`__eq__` 违反契约(`a == b` 但 `hash(a) != hash(b)`),dict/set 行为错乱——相等对象查不到。这是隐蔽 bug:

```python
class Bad:
    def __init__(self, v): self.v = v
    def __eq__(self, o): return self.v == o.v   # 按 v 相等
    def __hash__(self): return id(self)         # 但哈希用 id(不同对象 id 不同)
    # 违约:a == b 但 hash(a) != hash(b)
a, b = Bad(1), Bad(1)
print(a == b)        # True(按 v)
print(hash(a) == hash(b))  # False!id 不同 —— 违约
d = {a: "val"}
print(d[b])          # KeyError!b == a 但 hash 不同,定位不同槽,查不到 a
```

`Bad` 违反契约(`a==b` 但 `hash(a)!=hash(b)`),导致 `d[b]` 查不到 `d[a]`(虽 a==b)。这是违约的灾难性后果——dict 语义失效。故自定义类重写 `__eq__` 时,**必须同时正确重写 `__hash__`** 保持契约。

理解 `__hash__`/`__eq__` 契约(值相等→哈希相等、反方向允许冲突、违约致 dict 错乱),就抓住可哈希性的本质——可哈希不是"能算哈希",是"满足契约保证哈希表正确"。

### 1.3 hash 与可哈希速览

讲清定位前,给出全貌速览:

```python
# 1. hash() 取哈希值
print(hash(42))          # 42
print(hash("hello"))     # 某整数
print(hash((1, 2, 3)))   # 某整数(元素都可哈希)
print(hash(None))        # 某整数(None 可哈希)

# 2. 不可哈希类型(报错)
# hash([1, 2])           # TypeError
# hash({"a": 1})         # TypeError
# hash({1, 2})           # TypeError
# hash((1, [2]))         # TypeError(tuple 含不可哈希元素)

# 3. 可哈希作 dict 键 / set 元素
d = {42: "a", "name": "b", (0,0): "c"}   # int/str/tuple 键
s = {1, "x", (1, 2), frozenset([3])}     # 可哈希元素

# 4. 契约:a == b ⇒ hash(a) == hash(b)
print(1 == 1.0, hash(1) == hash(1.0))   # True True

# 5. frozenset 可哈希,set 不可
print(hash(frozenset([1,2])))   # OK
# hash({1, 2})                   # TypeError

# 6. 自定义类默认可哈希(按 id)
class C: pass
print(hash(C()))   # 基于 id 的哈希(不同实例不同)

# 7. 重写 __eq__ 会令 __hash__ 变 None(需手动重写)
class D:
    def __eq__(self, o): return True
print(D().__hash__)   # None(重写 __eq__ 后 __hash__ 被置空,不可哈希)
```

几个关键:

- `hash(对象)`:可哈希则返回整数,不可哈希报 TypeError。
- 可哈希:不可变类型(int/str/tuple-元素可哈希/frozenset/None);不可哈希:可变类型(list/dict/set)。
- 可哈希对象作 dict 键/set 元素。
- 契约:`a == b` ⇒ `hash(a) == hash(b)`(值相等哈希相等)。
- 自定义类默认可哈希(按 id),但重写 `__eq__` 后 `__hash__` 自动变 None(需手动重写)。

最后一条是高频陷阱——重写 `__eq__` 会让类失去可哈希性(自动 `__hash__ = None`),除非你同时重写 `__hash__`。§2.4 详述。

### 1.4 可哈希性与 dict/set 的关联

可哈希性最直接的实用价值,是作为 dict 键/set 元素。理解这层关联,就理解"为何要可哈希"。

**dict 用哈希表存键值**:dict 的键通过哈希值定位存储槽,实现 O(1) 查找/插入/删除。这要求键可哈希(有稳定哈希值用于定位):

```python
d = {}
d["name"] = "Alice"   # hash("name") 定位槽,存 ("name", "Alice")
d["name"]             # hash("name") 定位同槽,== 确认,返回 "Alice"
# 若键不可哈希(list),无法定位槽,TypeError
# d[[1,2]] = "x"      # TypeError:list 不可哈希
```

**set 用哈希表存元素**(set 本质是"只有键无值"的 dict):

```python
s = {1, 2, 3}    # 每个元素 hash() 定位槽存
2 in s           # hash(2) 定位槽,== 确认,O(1)
# 不可哈希元素不能进 set
# {[1,2]}        # TypeError
```

**为何 list 不可哈希(不能做键)**:若 list 可哈希、能做 dict 键:

```python
# 假设 list 可哈希(实际不可)
# d = {[1,2]: "a"}
# d[[1,2]].append(3)   # 改了键 list 内容 → 哈希值应变 → 旧槽找不到
# 这破坏 dict,故 Python 禁止 list 做键
```

若 list 可做键,存进去后改 list 内容,哈希值变,用新哈希查定位到新槽(空),旧键"丢失"。Python 从源头禁:可变对象不可哈希,不能做键/元素。要"用序列做键"用 tuple(不可变,可哈希)。

```python
# 用 tuple 做键(不可变,内容不变,哈希稳定)
grid = {(0, 0): "原点", (1, 1): "对角"}   # tuple 键
# 需要时可 tuple(list) 转换
key = tuple([1, 2])   # list → tuple 做键
grid[key] = "点"
```

可哈希性与不可变性紧密绑定(可哈希 ⇔ 通常不可变),根源就是"哈希值需稳定"——不可变对象内容不变,哈希稳定,可作键;可变对象内容可变,哈希不稳,不可作键。理解这层关联,就理解可哈希性的全部实用动因——为 dict/set 哈希表服务,哈希表要求键哈希稳定,故可哈希性要求不可变。

建立这些认知后,后续章节展开 hash 的完整规则、契约、自定义、哈希表原理。

---

## 2. 核心内容

本章详解 hash 与可哈希的完整用法。每节遵循"规则 → demo → 陷阱 → 场景"展开。`__hash__`/`__eq__` 契约、自定义类可哈希、哈希表原理是重点。

### 2.1 hash() 函数与各类型的哈希

`hash(obj)` 返回对象的哈希值(整数)。可哈希对象返回哈希,不可哈希报 TypeError。各类型的哈希规则不同。

**数字的哈希**:

```python
print(hash(42))          # 42(int 的哈希通常是它自身)
print(hash(-5))          # -5
print(hash(0))           # 0
print(hash(3.14))        # 某整数(float 哈希基于其二进制表示)
print(hash(3.0))         # == hash(3)(因 3.0 == 3,契约要求哈希等)
print(hash(42) == hash(42.0))   # True(值相等哈希相等)
print(hash(1+2j))        # 某整数(complex 哈希基于实虚部)
# bool 是 int 子类
print(hash(True))        # 1(True == 1,哈希相等)
print(hash(False))       # 0
print(hash(True) == hash(1))   # True
```

数字的哈希规律:

- **int**:哈希通常是数值本身(`hash(42)=42`),小整数尤其如此。
- **float**:哈希基于其二进制表示转换,满足 `hash(x) == hash(int_x)` 当 `x == int_x`(如 `hash(3.0)==hash(3)`)。
- **complex**:基于实虚部组合的哈希。
- **bool**:`True`→1、`False`→0(bool 是 int 子类,哈希与 1/0 相同)。

整数哈希"通常是自身"是 CPython 优化——小整数哈希直接用值,省计算。但这不保证(大整数可能不同),只保证 `a == b → hash(a) == hash(b)`。

**字符串的哈希**:str 哈希基于内容(字符序列),相同内容哈希相同:

```python
print(hash("hello"))       # 某整数
print(hash("hello"))       # 同上(同内容同哈希)
print(hash("world"))       # 不同("world" 内容不同)
# str 哈希基于内容,故相等字符串哈希相等(契约)
print("hi" == "hi", hash("hi") == hash("hi"))   # True True
```

str 哈希由内容决定,同内容(同对象驻留或不同对象)哈希相同。这让 str 作 dict 键高效——同字符串键定位同槽。

⚠️ **字符串哈希的随机化**:为防哈希冲突攻击(故意构造同哈希字符串拖慢 dict),Python 3.3+ 默认**随机化字符串哈希**(每次进程启动用随机种子):

```bash
$ python -c "print(hash('hello'))"
-8724231693424341589   # 这次
$ python -c "print(hash('hello'))"
-2696651069835247414   # 下次不同!(同字符串,不同进程哈希不同)
```

同一字符串在不同 Python 进程里哈希不同(随机化)。但**同一进程内**同字符串哈希相同(契约在该进程内成立)。故 dict 在单进程内正确,但不要跨进程依赖具体哈希值(如存哈希到文件再读回,可能不匹配)。数字哈希不随机化(只 str 等部分类型)。

**None 的哈希**:

```python
print(hash(None))    # 某固定整数(None 单例,哈希固定)
# None 是单例,哈希基于其身份(但 None 只有一个,故固定)
```

None 可哈希(哈希值固定),能做 dict 键/set 元素:`{None: "空值"}`、`{None, 1, 2}`。

**bytes/bytearray 的哈希**:

```python
print(hash(b"hello"))     # 整数(bytes 可哈希,基于内容)
# hash(bytearray(b"hello"))  # TypeError(bytearray 可变,不可哈希)
```

bytes(不可变)可哈希,bytearray(可变)不可哈希——再次体现"不可变↔可哈希"绑定。

### 2.2 可哈希性的判定:__hash__ 方法

判定对象是否可哈希,看它的类是否定义了有效的 `__hash__` 方法(非 None)。

**`__hash__` 的存在性**:

```python
print(int.__hash__)        # <slot wrapper '__hash__' ...>(int 有 __hash__,可哈希)
print(str.__hash__)        # 有(str 可哈希)
print(tuple.__hash__)      # 有(tuple 可哈希)
print(list.__hash__)       # None!(list 的 __hash__ 被置空,不可哈希)
print(dict.__hash__)       # None
print(set.__hash__)        # None
```

可哈希类型的 `__hash__` 是方法对象(int/str/tuple 有),不可哈希类型的 `__hash__` 是 `None`(list/dict/set 显式置空)。`hash(obj)` 内部调 `type(obj).__hash__(obj)`,若 `__hash__` 是 None,抛 TypeError。

**`hash(obj)` 的内部**:

```python
# hash(x) 等价于:
# type(x).__hash__(x)  —— 调用类的 __hash__ 方法
# 若 __hash__ is None → TypeError
```

`hash(x)` 调用 `type(x).__hash__(x)`。故可哈希性由类决定(类定义 `__hash__`),而非实例。这是为何"同类型所有实例都可哈希或都不可"——`__hash__` 是类属性。

**判定可哈希的实用方式**:

```python
def is_hashable(obj):
    """判定对象是否可哈希。"""
    try:
        hash(obj)
        return True
    except TypeError:
        return False
print(is_hashable(42))       # True
print(is_hashable([1, 2]))   # False
print(is_hashable((1, 2)))   # True
print(is_hashable((1, [2]))) # False(含不可哈希元素)
# 或查 __hash__ 是否 None(但容器递归含不可哈希元素时 __hash__ 有但调用报错)
print(type([1]).__hash__ is None)   # True(list 类 __hash__ 是 None)
```

判定可哈希最可靠是 try `hash(obj)`(处理含不可哈希元素的 tuple——tuple 类有 `__hash__`,但元素含 list 时调用报错)。查 `__hash__ is None` 只判定类级别,不判递归元素。

### 2.3 容器的递归可哈希性

容器(tuple/frozenset)可哈希,要求其**所有元素都可哈希**——这是"递归可哈希"。理解这点避免"tuple 可哈希却 hash 报错"的困惑。

**tuple 的递归可哈希**:

```python
print(hash((1, 2, 3)))      # OK(元素 int 都可哈希)
print(hash(("a", "b")))     # OK(str 元素可哈希)
print(hash((1, (2, 3))))    # OK(嵌套 tuple,内层可哈希)
# hash((1, [2]))            # TypeError!元素 [2] 是 list 不可哈希
# hash((1, {"a": 1}))       # TypeError!元素 dict 不可哈希
```

tuple 可哈希 ≠ 任意 tuple 都能 hash——只有**元素全部可哈希**的 tuple 才能 hash。`(1, [2])` 含 list,tuple 的 `__hash__` 在计算时对元素 `[2]` 调 `hash`,list 不可哈希报错。故 tuple 的可哈希性递归依赖元素。

```python
# tuple __hash__ 递归算元素哈希再组合
print(type((1,2)).__hash__)  # 有(tuple 类有 __hash__)
# 但 hash((1, [2])) 报错:tuple __hash__ 内部对 [2] hash 失败
```

**frozenset 的递归可哈希**:同理,frozenset 元素全部可哈希才可哈希:

```python
print(hash(frozenset([1, 2, 3])))       # OK(int 元素)
print(hash(frozenset(["a", "b"])))      # OK(str 元素)
# hash(frozenset([[1, 2], [3]]))        # TypeError!元素 list 不可哈希
```

frozenset 元素必须可哈希(set/frozenset 元素本就要求可哈希,故 frozenset 构造时已拒不可哈希元素:`frozenset([[1]])` 直接 TypeError)。frozenset 自身可哈希(不可变),元素可哈希则它可哈希。

**递归可哈希的实际意义**:这让"嵌套不可变结构"可作 dict 键:

```python
# 复合键:tuple of tuples
grid = {(0, 0): "原点", (0, (1, 0)): "复合"}
# frozenset 作键(集合作键,需 frozenset 不可变)
counts = {frozenset(["a", "b"]): 2, frozenset(["c"]): 1}
# frozenset 嵌套 frozenset
nested = {frozenset([frozenset([1,2]), frozenset([3])]): "x"}
```

复合键(多字段标识)用 tuple of tuples;集合作键用 frozenset。这些"嵌套可哈希结构"能作 dict 键,源于递归可哈希。

**list → tuple 转换做键**:list 不可哈希不能做键,但可转 tuple(不可变)做键:

```python
# list 不能做键,转 tuple
points_list = [[0, 0], [1, 1], [2, 2]]
# 用 list 做键需转 tuple
d = {tuple(p): f"点{p}" for p in points_list}
print(d[(0, 0)])    # 点[0, 0]
# 注意:若 list 元素含不可哈希(如 list of lists),转 tuple 后仍不可哈希
# tuple([[1,2], [3,4]]) 的元素 [1,2]/[3,4] 是 list,该 tuple 不可哈希
```

`tuple(list)` 把 list 转 tuple 做键。但若 list 元素本身是 list(`[[1,2],[3,4]]`),转 tuple 后元素仍 list,该 tuple 仍不可哈希——需递归转(tuple of tuples)。

理解递归可哈希(容器可哈希要求元素都可哈希、tuple/frozenset 含不可哈希元素则不可哈希),就理解"tuple 可哈希但 (1,[2]) 不能 hash"的现象,及如何构造复合可哈希键。

### 2.4 自定义类的可哈希性

自定义类的可哈希性有三档:默认可哈希(按 id)、重写 `__eq__` 后变不可哈希、显式重写 `__hash__` 恢复可哈希。这节讲清这三档与正确做法。

**默认可哈希(按 id)**:不重写任何方法的类,默认可哈希,`__hash__` 基于 id(对象身份):

```python
class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y
p1 = Point(1, 2)
p2 = Point(1, 2)
print(hash(p1))         # 某整数(基于 id)
print(hash(p2))         # 不同(不同对象 id 不同)
print(p1 == p2)         # False(默认 __eq__ 按 id 比较)
# 默认:按 id 哈希与相等,不同实例不同(即使内容同)
d = {p1: "A"}
print(d[p1])            # A
# d[p2]                # KeyError(p2 != p1,不同键)
```

默认类 `__eq__` 按 id 比(`p1 == p2` False,即便内容同),`__hash__` 基于 id。故默认类实例按身份区分——同内容不同实例是不同键。这适合"对象身份即标识"的场景(如缓存对象本身)。

**重写 `__eq__` 后变不可哈希(陷阱!)**:重写 `__eq__`(按内容比相等)后,Python **自动把 `__hash__` 置 None**,类变不可哈希:

```python
class Point:
    def __init__(self, x, y): self.x, self.y = x, y
    def __eq__(self, o): return (self.x, self.y) == (o.x, o.y)   # 按内容相等
    # 未重写 __hash__!Python 自动置 __hash__ = None
p = Point(1, 2)
print(p.__hash__)       # None!重写 __eq__ 后 __hash__ 被置空
# hash(p)              # TypeError!class Point 现在不可哈希
# d = {p: "A"}         # TypeError(不可哈希做键)
```

⚠️ **重写 `__eq__` 会让类失去可哈希性**——这是高频陷阱。Python 如此设计是因为:重写 `__eq__` 改变了"相等"语义(按内容而非 id),若仍用默认 `__hash__`(按 id),会违反契约(`a == b` 但 `hash(a) != hash(b)`,因内容同 id 不同)。Python 宁可置 None(不可哈希),逼你显式决定 `__hash__` 如何与新的 `__eq__` 匹配,避免静默违约。

**显式重写 `__hash__` 恢复可哈希**:重写 `__eq__` 后,要恢复可哈希,需同时重写 `__hash__`,使其与 `__eq__` 一致(相等→哈希等):

```python
class Point:
    def __init__(self, x, y): self.x, self.y = x, y
    def __eq__(self, o): return (self.x, self.y) == (o.x, o.y)
    def __hash__(self): return hash((self.x, self.y))   # 基于内容的哈希
    # __eq__ 按内容,__hash__ 也按内容(用 tuple 哈希),契约保持
p1, p2 = Point(1, 2), Point(1, 2)
print(p1 == p2)            # True(内容同)
print(hash(p1) == hash(p2))  # True(哈希同,契约保持)
d = {p1: "A"}
print(d[p2])               # A!p2 == p1 且 hash 同,dict 找到同键
```

重写 `__hash__` 基于"决定相等的内容"(这里是 (x, y)),用 `hash((self.x, self.y))` 复用 tuple 哈希。这样 `a == b` → `(a.x,a.y) == (b.x,b.y)` → `hash(tuple) 相同` → `hash(a) == hash(b)`,契约保持。故 `d[p2]` 能找到 `d[p1]`(虽不同对象,但相等且哈希同)。

**`__hash__` 必须基于 `__eq__` 用到的属性**:`__hash__` 应只依赖 `__eq__` 判断相等用到的属性(如 (x,y)),不能依赖其他属性(否则契约可能破):

```python
class Point:
    def __init__(self, x, y, color):
        self.x, self.y = x, y
        self.color = color
    def __eq__(self, o): return (self.x, self.y) == (o.x, o.y)   # 只按 x,y 相等
    def __hash__(self): return hash((self.x, self.y))   # 也只按 x,y(不含 color)
    # 若 __hash__ 含 color,但 __eq__ 不含,会违约:
    # a = Point(1,2,"red"), b = Point(1,2,"blue")
    # a == b(True,只比 x,y),但 hash(a) != hash(b)(color 不同)—— 违约!
    # 故 __hash__ 只含 __eq__ 的属性
```

`__hash__` 必须只用 `__eq__` 用到的属性。若 `__eq__` 按 (x,y) 但 `__hash__` 含 color,则两个 (1,2) 但 color 不同的对象 `==`(True)但哈希不同(违约)。这是契约的核心——哈希与相等基于相同属性。

**显式设 `__hash__ = None` 不可哈希**:若你想让类不可哈希(如可变值类),显式设:

```python
class MutablePoint:
    def __init__(self, x, y): self.x, self.y = x, y
    def __eq__(self, o): return (self.x, self.y) == (o.x, o.y)
    __hash__ = None   # 显式不可哈希(值可变,不应做键)
# hash(MutablePoint(1,2))   # TypeError
```

值可变的类(实例内容会改)应不可哈希(类似 list),显式 `__hash__ = None`。这避免"内容改后哈希失效"。

理解自定义类可哈希三档(默认 id 可哈希、重写 `__eq__` 后 None 不可哈希、显式 `__hash__` 恢复)与"`__hash__` 基于 `__eq__` 属性"原则,就掌握自定义可哈希类的正确写法。

### 2.5 契约违约的后果与重写陷阱

§1.2 讲了 `__hash__`/`__eq__` 契约,这节详述违约后果与常见重写陷阱。

**违约后果一:dict/set 语义错乱**(键丢失/重复):

```python
class Bad:
    def __init__(self, v): self.v = v
    def __eq__(self, o): return self.v == o.v
    def __hash__(self): return id(self)   # 违约:__eq__ 按 v,__hash__ 按 id
a, b = Bad(1), Bad(1)
print(a == b)        # True(按 v)
print(hash(a) == hash(b))  # False(id 不同,违约)
d = {a: "val"}
print(d.get(b))      # None!b==a 但哈希不同,dict 找不到 a 的槽 → KeyError/None
s = {a, b}           # {a, b} 两个元素(本应去重为1,因 a==b)
print(len(s))        # 2!违约致 set 未去重
```

违约(`a==b` 但 `hash(a)!=hash(b)`)致:dict `d[b]` 找不到 `d[a]`(定位不同槽)、set `{a,b}` 未去重(两槽)。dict/set 语义彻底错乱——相等对象不被当作同一键。这是违约的核心危害。

**违约后果二:不可预测的行为**:违约对象的 dict/set 行为依赖哈希冲突(恰好哈希同则可能找对,不同则错):

```python
# 偶尔哈希碰巧相同(id 同?不可能),行为"看似对"
# 多数情况哈希不同,行为错
# 这种"时对时错"最难调试
```

违约致"时对时错"(取决于哈希是否碰巧同),极难调试。故**绝不能违约**——重写 `__eq__` 必配 `__hash__` 保持一致。

**陷阱一:重写 `__eq__` 忘重写 `__hash__`**(最常见):

```python
class Trap:
    def __init__(self, v): self.v = v
    def __eq__(self, o): return self.v == o.v
    # 忘了 __hash__!Python 置 None,类不可哈希
# t = Trap(1)
# hash(t)        # TypeError —— 想用 dict/set 时才发现不可哈希
```

重写 `__eq__` 忘 `__hash__`,类变不可哈希,用 dict/set 时 TypeError 才暴露。修复:补 `__hash__`(基于 v)。

**陷阱二:`__hash__` 含 `__eq__` 不比的属性**(违约):

```python
class Bad2:
    def __init__(self, x, tag): self.x, self.tag = x, tag
    def __eq__(self, o): return self.x == o.x       # 只比 x
    def __hash__(self): return hash((self.x, self.tag))  # 含 tag!违约
a, b = Bad2(1, "A"), Bad2(1, "B")
print(a == b)        # True(只比 x)
print(hash(a) == hash(b))  # False(tag 不同)—— 违约
```

`__hash__` 含 tag 但 `__eq__` 不含,违约。修复:`__hash__` 只含 `__eq__` 的属性(h creates只 hash(self.x))。

**陷阱三:`__hash__` 基于可变属性**(哈希不稳):

```python
class Bad3:
    def __init__(self, x): self.x = x   # x 可变(没保护)
    def __eq__(self, o): return self.x == o.x
    def __hash__(self): return hash(self.x)
b = Bad3([1, 2])   # x 是 list
# hash(b)          # TypeError(list 不可哈希,hash(self.x) 失败)
# 且若 x 是可哈希但可变(如 list 转 tuple?不),改 x 后哈希变 → 做键后丢失
```

`__hash__` 基于可变属性:若属性不可哈希(如 list),`hash` 直接 TypeError;若属性可哈希但可变(理论上),改后哈希变致键丢失。修复:`__hash__` 基于不可变属性,或类设计为不可变。

**正确范式**(不可变值对象 + 正确 `__eq__`/`__hash__`):

```python
class Color:
    """不可变颜色值对象,正确 __eq__/__hash__。"""
    __slots__ = ('_r', '_g', '_b')
    def __init__(self, r, g, b):
        self._r, self._g, self._b = r, g, b
    def __eq__(self, o):
        return isinstance(o, Color) and (self._r, self._g, self._b) == (o._r, o._g, o._b)
    def __hash__(self):
        return hash((self._r, self._g, self._b))   # 基于 __eq__ 的属性
    # __slots__ 防加属性(不可变),值对象标准做法
c1, c2 = Color(255, 0, 0), Color(255, 0, 0)
print(c1 == c2, hash(c1) == hash(c2))   # True True(契约保持)
d = {c1: "红"}; print(d[c2])   # 红(可哈希,正确做键)
```

正确范式:不可变值对象(`__slots__` 防改属性)、`__eq__` 按值、`__hash__` 基于 `__eq__` 属性。这样契约保持,可安全做 dict/set 键。

理解违约后果(dict/set 错乱、时对时错难调试)与三类重写陷阱(忘 `__hash__`、含非 `__eq__` 属性、基于可变),就掌握"为何必须正确重写 `__hash__`/`__eq__`"——契约是 dict/set 正确的基石,违约致灾难。

### 2.6 综合示例:可哈希类的正确实现与应用

下面这个片段综合演示可哈希性的正确实现与应用场景:

```python
# 1. 不可变值对象:正确 __eq__/__hash__
class Point:
    """二维点,不可变值对象,可哈希。"""
    __slots__ = ('_x', '_y')
    def __init__(self, x, y):
        object.__setattr__(self, '_x', x)   # __slots__ + 禁改(简化)
        object.__setattr__(self, '_y', y)
    @property
    def x(self): return self._x
    @property
    def y(self): return self._y
    def __eq__(self, o):
        return isinstance(o, Point) and (self._x, self._y) == (o._x, o._y)
    def __hash__(self):
        return hash((self._x, self._y))   # 基于 __eq__ 属性
    def __repr__(self):
        return f"Point({self._x}, {self._y})"

p1, p2 = Point(1, 2), Point(1, 2)
print(f"p1 == p2: {p1 == p2}, hash 相等: {hash(p1) == hash(p2)}")  # True True

# 2. 可哈希对象做 dict 键(网格)
grid = {Point(0, 0): "原点", Point(1, 1): "对角", Point(2, 2): "远点"}
print(grid[Point(0, 0)])         # 原点(用新 Point 查,因相等哈希同)
print(grid.get(Point(1, 1)))     # 对角

# 3. set 去重(可哈希对象)
points = [Point(1,2), Point(1,2), Point(3,4), Point(1,2)]
unique = set(points)             # 利用 Point 可哈希去重
print(f"去重后: {unique}")       # {Point(1,2), Point(3,4)}(2 个,去重)

# 4. 复合键:tuple of values
students = {("Alice", 2020): 90, ("Bob", 2020): 85}
print(students[("Alice", 2020)])  # 90(tuple 复合键)

# 5. 验证契约:值相等哈希相等
print(f"1 == 1.0: {1 == 1.0}, hash 相等: {hash(1) == hash(1.0)}")  # True True
d = {1: "int"}
print(d[1.0])                    # int(1.0 == 1,哈希同,找到)

# 6. 不可哈希类型(对比)
try:
    hash([1, 2])
except TypeError as e:
    print(f"list 不可哈希: {e}")
# tuple 含不可哈希元素也不可哈希
try:
    hash((1, [2]))
except TypeError as e:
    print(f"含 list 的 tuple 不可哈希: {e}")

# 7. 重写 __eq__ 忘 __hash__ 的陷阱
class Trap:
    def __init__(self, v): self.v = v
    def __eq__(self, o): return self.v == o.v
    # 忘 __hash__!
print(f"Trap.__hash__: {Trap.__hash__}")  # None(不可哈希)
```

跑一遍这段示例,对照输出:不可变值对象 Point 的正确 `__eq__`/`__hash__`、可哈希作 dict 键(新 Point 查出值)、set 去重、tuple 复合键、契约验证(1==1.0 哈希等、d[1.0] 找到 d[1])、不可哈希类型报错、重写 `__eq__` 忘 `__hash__` 陷阱——hash 与可哈希的全貌就清晰了。

核心结论:**可哈希 = 有 `__hash__` 且哈希值稳定(不可变),核心是 `__eq__`/`__hash__` 契约(值相等→哈希相等),不可变类型默认可哈希、可变类型不可哈希(防内容改后哈希失效),自定义类重写 `__eq__` 必须配 `__hash__` 基于相同属性,可哈希对象可作 dict 键/set 元素(哈希表 O(1) 定位)**。

---

## 3. 最佳实践

### 3.1 重写 __eq__ 必须同时重写 __hash__(基于相同属性)

```python
class Point:
    def __init__(self, x, y): self.x, self.y = x, y
    def __eq__(self, o): return (self.x, self.y) == (o.x, o.y)
    def __hash__(self): return hash((self.x, self.y))   # 配套,基于 __eq__ 属性
# 不要重写 __eq__ 后忘 __hash__(Python 置 None,类不可哈希)
# 不要 __hash__ 含 __eq__ 不比的属性(违约)
```

重写 `__eq__` 必配 `__hash__`,且 `__hash__` 只基于 `__eq__` 用到的属性(用 `hash(tuple(属性))` 复用)。这是自定义可哈希类的铁律,违反致不可哈希或契约违约。

### 3.2 值可变的类设 __hash__ = None(不可哈希,类似 list)

```python
class MutableBag:
    def __init__(self, items): self.items = list(items)
    def add(self, x): self.items.append(x)   # 可变
    def __eq__(self, o): return self.items == o.items
    __hash__ = None   # 显式不可哈希(内容可变,不应做键)
```

值可变的类(实例内容会改)应 `__hash__ = None` 不可哈希,避免"做键后改内容致哈希失效丢失"。这与 list/dict/set 设计一致(可变不可哈希)。

### 3.3 不可变值对象用 __slots__ 防改属性,保证哈希稳定

```python
class Color:
    __slots__ = ('_r', '_g', '_b')   # 防加/改属性
    def __init__(self, r, g, b): self._r, self._g, self._b = r, g, b
    def __eq__(self, o): return (self._r, self._g, self._b) == (o._r, o._g, o._b)
    def __hash__(self): return hash((self._r, self._g, self._b))
```

不可变值对象(值决定相等哈希)用 `__slots__` 防止加/改实例属性,保证哈希值稳定(不被意外修改)。这降低"做键后内容变"的风险,是值对象标准做法。

### 3.4 用 tuple 作复合键,不用 list

```python
# 推荐:tuple 作复合键(不可变可哈希)
d = {(user_id, date): record for ...}
# 避免:list 不可哈希不能做键
# d = {[user_id, date]: record}   # TypeError
# 临时 list 转 tuple 做键
key = tuple([user_id, date])
d[key] = record
```

多字段复合键(dict 键)用 tuple(不可变可哈希),不用 list(不可哈希)。手里是 list 时 `tuple(list)` 转换做键。这是用序列做键的标准方式。

### 3.5 集合作键用 frozenset,不用 set

```python
# 推荐:frozenset 作键(不可变可哈希)
d = {frozenset(["a", "b"]): 2}
# 避免:set 不可哈希不能做键
# d = {{"a", "b"}: 2}   # TypeError
```

集合作 dict 键用 frozenset(不可变可哈希),不用 set(可变不可哈希)。这是"集合做键"的唯一方式。

### 3.6 注意 tuple 含不可哈希元素则不可哈希(递归)

```python
hash((1, 2))        # OK(元素 int 可哈希)
# hash((1, [2]))    # TypeError(元素 list 不可哈希)
# 嵌套 list 需递归转 tuple
data = [[1, 2], [3, 4]]
key = tuple(tuple(sub) for sub in data)   # 递归转 tuple of tuples,可哈希
```

tuple 可哈希≠任意 tuple 可 hash,元素须都可哈希。含 list 的 tuple 转 tuple of tuples(递归转)才能哈希。构造复合键时确保各层都不可变。

### 3.7 __hash__ 基于不可变属性,避免可变致哈希失效

```python
class Good:
    def __init__(self, x): self._x = x   # 不可变(约定/property 无 setter)
    def __eq__(self, o): return self._x == o._x
    def __hash__(self): return hash(self._x)
# 避免 __hash__ 基于可改属性
# class Bad:
#     def __init__(self, x): self.x = x   # 可改
#     def __hash__(self): return hash(self.x)   # 改 x 后哈希变,做键后丢失
```

`__hash__` 基于不可变属性(或类设计为不可变),避免"属性改后哈希变、做键后丢失"。值对象的哈希属性应不可变(私有化 + property 无 setter 或 `__slots__`)。

### 3.8 不要跨进程依赖具体哈希值(str 哈希随机化)

```python
# str 哈希随机化(每次进程不同),不要存哈希到文件/跨进程用
# 同进程内同字符串哈希相同(契约成立),但跨进程不同
# 跨进程需确定性哈希用 hashlib(如 hashlib.sha256)
import hashlib
print(hashlib.sha256(b"hello").hexdigest())   # 确定性,跨进程一致
```

Python str 哈希随机化(防冲突攻击),跨进程不同。不要存 str 哈希到文件再读回比对(会不匹配)。需确定性/跨进程哈希用 `hashlib`(SHA256 等),不用内置 `hash()`。

### 3.9 判可哈希用 try hash(),不用查 __hash__ is None(递归)

```python
def is_hashable(obj):
    try: hash(obj); return True
    except TypeError: return False
# 比 type(obj).__hash__ is None 可靠(后者不判 tuple 含 list 的递归不可哈希)
```

判定可哈希用 try `hash(obj)`(可靠,处理 tuple 含不可哈希元素的递归情况)。查 `__hash__ is None` 只判类级别,不判递归元素(tuple 类有 `__hash__` 但含 list 时 hash 报错)。

### 3.10 利用契约:值相等对象在 dict/set 互通

```python
d = {1: "int"}
d[1.0]   # 找到 d[1](1.0 == 1 哈希同)
d[True]  # 找到 d[1](True == 1 哈希同)
# 利用:用 1/1.0/True 互查同值键
# 但注意:这可能导致意外(d[1]=..., d[1.0]=... 覆盖同键)
d[1] = "a"; d[1.0] = "b"
print(d[1])   # b(1.0 覆盖了 1,因等价键)
```

值相等的对象(1/1.0/True)在 dict/set 互通(契约:相等哈希等)。利用这点灵活查询,但注意"等价键互相覆盖"(d[1]=a; d[1.0]=b 后 d[1] 是 b)。理解契约的实用后果。

### 3.11 哈希冲突不可避免,不要追求"无冲突哈希"

```python
# 哈希值空间有限,对象无限,冲突必然(不同对象哈希可等)
# dict/set 用 == 处理冲突,无需"完美无冲突哈希"
# __hash__ 返回值均匀分布即可,冲突由 == 兜底
def __hash__(self): return hash((self.x, self.y))   # 复用 tuple 哈希,分布够好
```

哈希冲突不可避免(有限哈希空间)。`__hash__` 不需"无冲突",只需分布均匀(减少冲突)。dict/set 用 `==` 区分同槽冲突对象。复用 `hash(tuple)` 通常分布足够好,别自作聪明写"完美哈希"。

### 3.12 数据类用 @dataclass(frozen=True) 自动处理 __eq__/__hash__

```python
from dataclasses import dataclass
@dataclass(frozen=True)
class Point:
    x: int
    y: int
# frozen=True 自动:不可变 + 生成 __eq__/__hash__(基于字段,契约正确)
p1, p2 = Point(1, 2), Point(1, 2)
print(p1 == p2, hash(p1) == hash(p2))   # True True(自动正确)
# 不可变值对象首选 @dataclass(frozen=True),省去手写 __eq__/__hash__
```

不可变值对象用 `@dataclass(frozen=True)`——自动生成不可变性 + 正确的 `__eq__`/`__hash__`(基于字段),省去手写且保证契约。这是现代 Python 写值对象的首选,避免手写 `__eq__`/`__hash__` 的陷阱。

---

## 4. 原理

本章讲清 hash 与可哈希的底层机制:哈希函数的算法、`__hash__`/`__eq__` 契约的数学基础、可变对象不可哈希的设计动因、dict/set 哈希表如何用哈希值(定位槽+==确认+冲突处理)、字符串哈希随机化的安全考虑、`__eq__` 重写致 `__hash__` 置 None 的机制。这些是"hash 为何如此"的根基。

### 4.1 哈希函数与哈希值的性质(需理解,详述)

哈希函数把任意对象映射为固定大小整数。Python 的 `hash()` 返回一个机器字长的整数(64 位系统 64 位)。哈希函数的关键性质:

**性质一:确定性(同对象同哈希)**:同一对象(或值相等的不可变对象)在同一进程内,哈希值相同:

```python
print(hash("hello") == hash("hello"))   # True(同内容同哈希)
print(hash(42) == hash(42))             # True
```

同一进程内,值相等的不可变对象哈希相同(契约的"值相等→哈希相等")。这是哈希表正确的基础——同键定位同槽。

**性质二:值相等→哈希相等(契约)**:`a == b` ⇒ `hash(a) == hash(b)`。这是可哈希对象的强制契约(§1.2)。哈希表依赖此定位——相等键定位同槽。

**性质三:哈希冲突允许(不同对象哈希可等)**:`hash(a) == hash(b)` ⇏ `a == b`。不同对象哈希可相等(冲突,因哈希空间有限)。哈希表用 `==` 区分冲突对象。

**性质四:哈希值不变(不可变性)**:可哈希对象的哈希值在其生命周期不变。这要求对象不可变(内容不变→哈希不变)。可变对象违反此(内容变哈希应变),故设不可哈希。

**哈希函数的算法**:各类型的 `__hash__` 算法不同:

- **int**:通常 `hash(n) == n`(小整数直接用值,优化)。大整数可能 `n mod (2^61 - 1)`(Mersenne 素数,分布好)。
- **float**:基于其二进制位转换,保证 `hash(x) == hash(int(x))` 当 `x == int(x)`(如 `hash(3.0) == hash(3)`)。
- **str**:SipHash 算法(Python 3.4+),抗冲突攻击,带随机种子(防构造冲突)。
- **tuple**:组合元素哈希(如 `hash((a,b)) = f(hash(a), hash(b))`,递归)。
- **自定义默认**:`__hash__` 基于 id(`id(obj) >> 4` 之类,身份哈希)。

```python
print(hash(42))         # 42(int 直接用值)
print(hash(3) == hash(3.0))   # True(float 与对应 int 哈希等)
print(hash((1, 2)))     # 组合 hash(1)、hash(2)
```

**哈希分布的重要性**:好哈希函数让不同对象的哈希值均匀分布(减少冲突)。Python 的 SipHash/tuple 组合算法设计为分布均匀——这让 dict/set 冲突少,接近 O(1)。劣质 `__hash__`(如总是返回常数)致所有对象同槽(退化为 O(n) 链表),dict/set 极慢。故自定义 `__hash__` 应保证分布均匀(复用 `hash(tuple)` 通常够)。

理解哈希函数的四性质(确定性、契约、冲突允许、不变性)与各类型算法,就理解哈希值如何产生、为何要契约、为何可变不可哈希——这些性质是哈希表正确高效运转的数学基础。

### 4.2 哈希表:dict/set 的 O(1) 机制(需理解,详述)

dict/set 底层是哈希表,理解其机制就理解"为何要可哈希""哈希值如何用"。

**哈希表的结构**:哈希表是一个数组(槽位数组),存键值对(dict)或键(set)。用哈希值定位槽:

```
槽位数组:[ _ | (k1,v1) | _ | (k2,v2) | (k3,v3) | _ | ... ]
              ↑                    ↑
         hash(k1)%size=1     hash(k2)%size=3
```

每个键的哈希值对槽位数取模,定位到槽位,存入。

**查找 O(1) 的原理**:查 `d[key]`:

1. 算 `hash(key)`。
2. `hash(key) % 槽数` 定位槽。
3. 槽内用 `==` 确认键(处理冲突)。
4. 找到则返回值。

```python
d = {"name": "Alice", 42: "answer"}
# d["name"]:
# 1. hash("name") → 某整数 H
# 2. H % 槽数 → 槽位 i
# 3. 槽 i 内 == "name" 确认 → 找到值 "Alice"
# 全程 O(1)(哈希计算 + 取模 + 槽内 ==,常数时间,不遍历)
```

`d["name"]` 不遍历 dict,直接哈希定位槽,O(1)。这是 dict/set 快的根本——哈希值直接算出位置,无需线性查找。对比 list 查找 O(n)(逐个比),dict O(1) 快几个数量级(大集合明显)。

**哈希冲突处理**:不同键哈希可同(冲突),或哈希不同但对槽数取模同(也冲突),落同槽。Python 用**开放寻址法**(open addressing)处理——冲突时探测下一个空槽:

```
若 hash(k1)%size == hash(k2)%size(同槽):
  k1 存槽 i,k2 探测下一槽 i+1(或 i+2,...),存
  查 k2:从槽 i 开始,== 比对,不匹配则探测下一槽,直到找到或空槽
```

开放寻址:冲突时找下一空槽存,查找时从原槽顺探。冲突少时仍 O(1),冲突多(劣质哈希或满载)退化。Python dict 用开放寻址 + 动态扩容(装载因子达阈值翻倍槽数,重哈希),保持低冲突、近 O(1)。

**装载因子与扩容**:哈希表满到一定程度(装载因子 = 元素数/槽数 达阈值,Python dict 约 2/3),扩容(槽数翻倍)+ 把所有元素重新哈希定位(rehash):

```python
# 装 1000 元素,槽数从 1024 → 2048(达阈值扩容)
# 扩容后所有元素 hash() % 新槽数 重新定位
# 扩容是 O(n) 但摊还到每次插入仍 O(1) 摊还
```

扩容保证装载因子低(冲突少),摊还 O(1)。这解释了 dict 内存占用(槽数 > 元素数,有空槽)与偶尔的插入卡顿(扩容 rehash)。

**set 与 dict 的关系**:set 本质是"只有键、无值"的 dict——同样的哈希表结构,只存键(无值槽)。故 set 与 dict 共享哈希表机制,O(1) 查找/插入/删除,同样要求元素可哈希。

**为何可哈希性是 dict/set 的前提**:哈希表用哈希值定位槽——若对象无哈希值(不可哈希),无法定位,哈希表失效。故 dict 键、set 元素必须可哈希。这是可哈希性与 dict/set 的根本关联——可哈希性是"能被哈希表管理"的资格。

理解哈希表(数组+哈希定位+开放寻址冲突+扩容),就理解 dict/set 为何 O(1)、为何要可哈希、为何劣质哈希致退化、为何内存有空槽——这是可哈希性存在的全部实用动因。

### 4.3 可变对象不可哈希的设计动因

§1.1 讲了可变对象不可哈希,这里讲清其设计动因——为何 Python 干脆禁止可变对象哈希,而非"哈希随内容变"。

**问题根源——可变对象做键的灾难**:假设允许 list 可哈希做 dict 键:

```python
# 假设 list 可哈希(实际禁)
key = [1, 2]
d = {key: "value"}     # hash([1,2]) 定位槽 i,存
key.append(3)          # 改 list 内容 → [1,2,3]
# 现在 hash([1,2,3]) 不同于 hash([1,2])(内容变哈希变)
d[key]                 # hash([1,2,3]) 定位槽 j(≠ i)→ 空槽 → KeyError!
# 原 "value" 在槽 i,但用新哈希查到槽 j,找不到!"丢失"
```

若 list 可哈希做键,存进去后改内容,哈希值变,用新哈希查定位到新槽(空),原键"丢失"在旧槽。这破坏 dict 语义("存进去就该能查到")。且"丢失"的键占内存却无法访问,内存泄漏式灾难。

**Python 的选择——可变对象禁止哈希**:Python 从源头杜绝:可变对象(list/dict/set/bytearray)的 `__hash__` 设为 None,直接不可哈希,禁止做键/元素:

```python
print(list.__hash__)   # None(显式禁用)
# hash([])             # TypeError
# {[]: "x"}            # TypeError
```

可变对象 `__hash__ = None`,`hash()` 报 TypeError,做键/元素直接报错。这把"存后改内容致丢失"的灾难从源头掐灭——不让可变对象进哈希表,就没后续问题。

**为何不"哈希随内容动态变"**:理论上可让可变对象哈希随内容变(每次 hash 重算),但这无解——存进哈希表用的是"存时的哈希"定位槽,改内容后哈希变,但槽位还是旧的(基于旧哈希),查用新哈希定位新槽,对不上。除非哈希表每次访问全表扫描(失 O(1)),否则"动态哈希"无法工作。故 Python 选"禁止可哈希"而非"动态哈希"。

**不可变↔可哈希的绑定**:由此,可哈希性与不可变性紧密绑定:

- 不可变对象(内容不变)→ 哈希值稳定 → 可哈希(可做键)。
- 可变对象(内容可变)→ 哈希值不稳 → 不可哈希(禁止做键)。

```python
# 不可变可哈希:int/str/tuple(元素可哈希)/frozenset
# 可变不可哈希:list/dict/set/bytearray
```

这条绑定是设计必然——可哈希要求哈希稳定,稳定要求不可变。Python 内置类型严格遵守:int/str/tuple/frozenset 不可变可哈希,list/dict/set 可变不可哈希。自定义类默认可哈希(按 id,身份不变故"稳定"),但若重写 `__eq__` 按内容比,需配 `__hash__` 且类应不可变(值对象),否则风险(§3.7)。

理解可变对象不可哈希的设计动因(防"存后改内容致丢失"灾难、动态哈希无解、不可变↔可哈希绑定),就理解 Python 为何如此设计——这是保证哈希表正确性的必然选择,而非任意限制。

### 4.4 __eq__ 重写致 __hash__ 置 None 的机制

§2.4 讲了"重写 `__eq__` 后 `__hash__` 自动变 None",这里讲清其机制与动因。

**机制**:Python 的类创建机制中,若类定义了 `__eq__` 但未定义 `__hash__`,解释器**自动设 `__hash__ = None`**:

```python
class C:
    def __eq__(self, o): return True
    # 未定义 __hash__
print(C.__hash__)   # None(自动置空)
```

类 `C` 定义 `__eq__` 未定义 `__hash__`,Python 创建类时检测到此情况,自动 `C.__hash__ = None`,使 C 不可哈希。这是 `type.__init__`(元类创建类时)的逻辑。

**动因——防止契约违约**:默认 `__hash__` 基于 id(身份哈希)。若重写 `__eq__` 按内容比(内容相等视为相等),但仍用默认 `__hash__`(按 id),则:

- `a == b`(内容同,`__eq__` 返回 True)
- `hash(a) != hash(b)`(id 不同,默认哈希不同)
- **违约!**(`a == b` 但 `hash(a) != hash(b)`)

Python 为防此违约,在重写 `__eq__` 时自动置 `__hash__ = None`(不可哈希),逼开发者显式决定 `__hash__`:

- 要可哈希:显式重写 `__hash__`(基于 `__eq__` 属性,保持契约)。
- 不要可哈希:留 `__hash__ = None`(值可变类)。

这把"违约风险"转化为"显式决策"——不让你"无意中违约",要么显式正确,要么显式不可哈希。

**对比:不重写 `__eq__` 时**:默认 `__eq__` 按 id(`a is b` 或 `id` 比),与默认 `__hash__`(按 id)一致——`a == b`(id 同)→ `hash(a) == hash(b)`(id 同哈希同),契约自然保持。故不重写 `__eq__` 时,默认 `__hash__` 保留(可哈希,按 id)。只有重写 `__eq__` 破坏了"id 哈希配 id 相等"的默认一致,才触发置 None。

**`__hash__` 恢复**:重写 `__eq__` 后,显式定义 `__hash__` 恢复可哈希:

```python
class C:
    def __init__(self, v): self.v = v
    def __eq__(self, o): return self.v == o.v
    def __hash__(self): return hash(self.v)   # 显式定义,恢复可哈希(基于 v)
print(C.__hash__)   # <method ...>(有,不再是 None)
```

显式 `__hash__` 覆盖自动的 None,恢复可哈希。开发者责任:让 `__hash__` 与 `__eq__` 一致(基于相同属性)。

理解"重写 `__eq__` → 自动 `__hash__ = None`"的机制(类创建时检测置空)与动因(防默认 id 哈希与内容 `__eq__` 违约),就理解这个高频陷阱的根源——它是 Python 的保护机制,逼你显式维护契约。

### 4.5 字符串哈希随机化:安全考虑

§2.1 提到 str 哈希随机化,这里讲清其安全动因。

**哈希冲突攻击**:若 str 哈希确定(不随机),攻击者可构造大量"同哈希字符串",让 dict/set 退化为 O(n)(所有键同槽,开放寻址链长):

```python
# 假设哈希确定,攻击者算出 1000 个哈希同的字符串
# buckets = {"k1":1, "k2":2, ..., "k1000":1000}  # 全同槽,查每个 O(n)
# 攻击者把这 1000 键作 HTTP 查询参数发服务器
# 服务器存进 dict,每次查 O(n),1000 键 O(n²) 致 CPU 100% 拒绝服务
```

这是**哈希冲突 DoS 攻击**——构造同哈希键,让目标 dict/set 退化,耗尽 CPU。2003~2011 年间,多种语言(含 Python 早期)的 web 服务受此类攻击。

**Python 的防御——SipHash + 随机种子**:Python 3.4+ 用 **SipHash** 算法(抗碰撞),并在**每次进程启动时随机选哈希种子**(默认),使 str/bytes 哈希值随机化:

```python
# 进程 A
$ python -c "print(hash('hello'))"
-8724231693424341589   # 这次
# 进程 B(同字符串,不同哈希)
$ python -c "print(hash('hello'))"
-2696651069835247414
```

随机种子使攻击者**无法预测**哈希值(每次进程不同),无法预先构造同哈希键集。即便攻击者算出某进程的冲突键,换个进程(重启)又失效。这有效防御哈希冲突 DoS。

**随机化的影响**:

- **同进程内**契约成立:同字符串哈希相同(同种子),dict 正常。
- **跨进程**哈希不同:不同进程(不同种子)同字符串哈希不同。
- **不要持久化哈希值**:存 str 哈希到文件再读回(可能跨进程)会不匹配。需持久化/跨进程用 `hashlib`(确定性密码学哈希)。

```python
# 持久化/跨进程用 hashlib(确定性)
import hashlib
hashlib.sha256(b"hello").hexdigest()   # 跨进程一致(确定性)
# 不用 hash()(随机,跨进程不同)
```

**关闭随机化(特殊场景)**:测试/调试需确定哈希,可用 `PYTHONHASHSEED=0` 环境变量关闭:

```bash
PYTHONHASHSEED=0 python -c "print(hash('hello'))"   # 每次相同(确定性)
# 仅测试/调试用,生产保留随机化(安全)
```

`PYTHONHASHSEED=0` 关闭随机化(确定哈希),仅测试/调试用。生产保留默认随机化(安全)。

理解字符串哈希随机化的安全动因(防哈希冲突 DoS)、SipHash + 随机种子机制、跨进程影响(不持久化 hash,用 hashlib),就理解为何 str 哈希"每次不同"——这是安全设计,非缺陷。这也是 Python 哈希与某些语言(如 Java String.hashCode 确定性)的差异根源。

---

## 5. 总结

### 5.1 本文内容回顾

- **hash 与可哈希定义**:hash 把对象映射为固定整数(哈希值);可哈希=有 `__hash__` 且哈希值稳定(不可变);可哈希对象作 dict 键/set 元素(哈希表要求)。
- **__hash__/__eq__ 契约**(核心):`a == b ⇒ hash(a) == hash(b)`(值相等哈希相等);反方向不要求(冲突允许);违约致 dict/set 错乱(相等键查不到、去重失效);哈希表用哈希定位槽+`==`确认。
- **各类型哈希**:int(通常自身)、float(与对应 int 哈希等)、complex、bool(True=1);str(SipHash+随机化,跨进程不同)、bytes;None;tuple/frozenset 递归组合。
- **可哈希判定**:有 `__hash__`(非 None)则可哈希;list/dict/set `__hash__=None` 不可哈希;判定用 try `hash()`(处理递归)。
- **递归可哈希**:tuple/frozenset 元素全部可哈希才可哈希(`(1,[2])` 不可哈希);复合键用 tuple of tuples/frozenset。
- **自定义类可哈希三档**:默认可哈希(按 id);重写 `__eq__` 自动 `__hash__=None`(不可哈希,防违约);显式 `__hash__` 恢复(基于 `__eq__` 属性)。
- **重写陷阱**:忘 `__hash__`(不可哈希);`__hash__` 含非 `__eq__` 属性(违约);基于可变属性(哈希失效);值可变类应 `__hash__=None`。
- **原理**:哈希函数四性质(确定性、契约、冲突允许、不变性)+ 各类型算法;哈希表 O(1) 机制(哈希定位槽+开放寻址冲突+扩容 rehash,set 同 dict);可变不可哈希的设计动因(防存后改内容丢失、动态哈希无解、不可变↔可哈希绑定);重写 `__eq__` 致 `__hash__=None` 机制(类创建时检测置空,防默认 id 哈希与内容 `__eq__` 违约);str 哈希随机化(SipHash+随机种子防冲突 DoS,跨进程不同勿持久化,用 hashlib)。
- **最佳实践**:重写 `__eq__` 必配 `__hash__` 同属性、值可变类 `__hash__=None`、值对象 `__slots__` 防改、tuple 作复合键、frozenset 作集合键、注意 tuple 递归可哈希、`__hash__` 基不可变属性、不跨进程依赖 hash、判可哈希用 try hash、利用契约值相等互通、不追求无冲突哈希、`@dataclass(frozen=True)` 自动处理。

### 5.2 读完本文你应能掌握

- 说明 hash 与可哈希的定义,阐述 `__hash__`/`__eq__` 契约(`a == b ⇒ hash(a) == hash(b)`)及其对 dict/set 正确性的意义。
- 用 `hash()` 取各类型哈希值,说明 int/float/complex/bool/str/None/tuple/frozenset 的哈希规律,解释 str 哈希随机化。
- 判定对象可哈希性(try `hash()`、`__hash__ is None`),说明可变类型为何不可哈希。
- 说明 tuple/frozenset 的递归可哈希性,用 tuple of tuples/frozenset 构造复合可哈希键。
- 正确实现自定义可哈希类:默认 id 可哈希、重写 `__eq__` 后配 `__hash__`(同属性)、值可变类 `__hash__=None`。
- 识别并修复重写陷阱(忘 `__hash__`、含非 `__eq__` 属性违约、基于可变属性、重写 `__eq__` 致不可哈希)。
- 阐述哈希函数性质与算法、哈希表 O(1) 机制(定位槽+开放寻址+扩容)、可变不可哈希设计动因、`__eq__` 致 `__hash__=None` 机制、str 哈希随机化安全等原理。
- 用 `@dataclass(frozen=True)` 正确生成不可变可哈希值对象。

### 5.3 延伸方向

- **字典深度剖析**:dict 哈希表实现细节(开放寻址、装载因子、3.7+ 有序性、内存布局),见《字典深度剖析》。
- **集合与冻结集合**:set/frozenset 哈希表、集合运算、frozenset 可哈希性,见《集合与冻结集合》。
- **变量赋值机制**:可变/不可变、对象身份与值相等(`==`/`is`)、可哈希性根源,见《变量赋值机制》。
- **类型判断与 type 系统**:`__hash__`/`__eq__` 作为类型协议、Hashable ABC、自定义协议方法,见《类型判断与 type 系统》。
- **dataclass 与值对象**:`@dataclass(frozen=True)` 自动生成 `__eq__`/`__hash__`、`__slots__`、现代值对象模式,见面向对象与标准库专题。
