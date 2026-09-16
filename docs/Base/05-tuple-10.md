---
group:
  title: 【05】元组介绍
  order: 5
order: 10
title: 元组的不可变性深度剖析
nav:
  title: Python基础
  order: 1
---

# 元组的不可变性深度剖析

## 1. 介绍

### 1.1 什么是不可变性

元组最核心的特征就是**不可变**（immutable）——一旦创建，就不能增加、删除或修改其中的元素。这与列表的可变性形成鲜明对比：

```python
# 元组不可变
t = (1, 2, 3)
# t[0] = 10   # TypeError: 'tuple' object does not support item assignment
# t.append(4)  # AttributeError: 'tuple' object has no attribute 'append'

# 列表可变
lst = [1, 2, 3]
lst[0] = 10      # OK
lst.append(4)    # OK
```

不可变性不是"限制"——它是"保证"。当你把一个元组交给另一个函数时，你可以确信它不会被修改。这种"信任"使得元组在配置传递、多线程共享、字典键等场景中比列表更安全。

### 1.2 不可变性的三个层次

元组的不可变性需要从三个层次理解：

| 层次 | 含义 | 示例 |
|------|------|------|
| 浅层不可变 | 不能增删改元组的元素引用 | `t[0] = 99` → `TypeError` |
| 深层可变（条件性） | 如果元素本身是可变对象，元素内容可以被修改 | `t[1].append(99)` 如果 `t[1]` 是列表 |
| 完全不可变 | 所有元素都是不可变类型时，整个元组完全不可变 | `(1, "hello", (2, 3))` |

### 1.3 核心注意事项

**第一：`t += (4,)` 不是修改元组，而是创建新元组。**

```python
t = (1, 2, 3)
t += (4,)  # t 指向了一个新元组 (1, 2, 3, 4, 5)，旧元组被丢弃
```

元组的 `+=` 会创建一个全新的元组对象，然后让变量名重新指向新对象。这与列表的 `+=`（就地扩展）完全不同。

**第二：元组中含可变元素时，"不可变"仅限引用层面。**

```python
t = (1, [2, 3], 4)
t[1].append(99)  # OK — 修改的是列表内容，不是元组的引用
# t[1] = [10]    # TypeError — 不能替换元组中的引用
```

**第三：空元组是全局单例，所有 `()` 都指向同一个对象。**

```python
print(() is ())  # True — CPython 优化
```

---

## 2. 核心内容

### 2.1 不可变性的基本验证

元组创建后，所有试图修改它的操作都会失败：

```python
t = (1, 2, 3)

# 不能赋值修改
try:
    t[0] = 10
except TypeError as e:
    print(f"t[0] = 10 → TypeError: {e}")

# 不能添加元素
try:
    t.append(4)
except AttributeError as e:
    print(f"t.append(4) → AttributeError: {e}")

# 不能删除元素
try:
    del t[0]
except TypeError as e:
    print(f"del t[0] → TypeError: {e}")
```

**运行结果**：

```text
t[0] = 10 → TypeError: 'tuple' object does not support item assignment
t.append(4) → AttributeError: 'tuple' object has no attribute 'append'
del t[0] → TypeError: 'tuple' object doesn't support item deletion
```

元组甚至没有 `append`、`extend`、`insert`、`remove`、`pop`、`clear`、`sort`、`reverse` 这些修改方法——这些方法只存在于列表中。

### 2.2 元组与列表的方法对比

元组只保留了只读方法（`count`、`index`），去掉了所有修改方法：

```python
t = (1, 2, 3)
mutable_methods = ["append", "extend", "insert", "remove", "pop", "clear",
                   "sort", "reverse"]
for method in mutable_methods:
    has_tuple = hasattr(t, method)
    has_list = hasattr([], method)
    if has_list and not has_tuple:
        print(f"  {method}: 列表有, 元组无")
```

**运行结果**：

```text
  append: 列表有, 元组无
  extend: 列表有, 元组无
  insert: 列表有, 元组无
  remove: 列表有, 元组无
  pop: 列表有, 元组无
  clear: 列表有, 元组无
  sort: 列表有, 元组无
  reverse: 列表有, 元组无
```

两者共有的只读方法包括 `count`、`index`、`__getitem__`（索引访问）、`__len__`（长度）、`__contains__`（`in` 运算）、`__iter__`（迭代）、`__eq__`（比较）和 `__hash__`（哈希）。

---

### 2.3 浅层不可变与深层不可变

这是理解元组不可变性最关键的一节。

#### 2.3.1 不可变的引用

元组存储的是"指向对象的引用"。不可变性的含义是：**这些引用不能被改变**——你不能让 `t[0]` 指向一个新对象：

```python
t = (1, 2, 3)
try:
    t[0] = 99
except TypeError as e:
    print(f"TypeError: {e}")
```

**运行结果**：

```text
TypeError: 'tuple' object does not support item assignment
```

#### 2.3.2 可变的元素内容

如果元组的某个元素本身是可变对象（如列表），你可以修改那个对象的**内容**——这不违反元组的不可变性，因为你没有改变元组中存储的"引用"，你只是通过那个引用修改了"引用指向的对象"：

```python
t = (1, [2, 3], 4)
print(f"修改前: {t}")

t[1].append(99)
print(f"t[1].append(99) 后: {t}")   # (1, [2, 3, 99], 4)

t[1][0] = 999
print(f"t[1][0] = 999 后: {t}")     # (1, [999, 3, 99], 4)
```

**运行结果**：

```text
修改前: (1, [2, 3], 4)
t[1].append(99) 后: (1, [2, 3, 99], 4)
t[1][0] = 999 后: (1, [999, 3, 99], 4)
```

但如果你尝试替换引用本身——让 `t[1]` 指向一个全新的列表——就会触发 `TypeError`：

```python
try:
    t[1] = [10, 20]
except TypeError as e:
    print(f"TypeError: {e}")
```

**运行结果**：

```text
TypeError: 'tuple' object does not support item assignment
```

#### 2.3.3 图解引用 vs 内容

```text
元组 t  ──────→ [ 引用A, 引用B, 引用C ]
                      │       │       │
                      ↓       ↓       ↓
                      1    [2, 3]    4
                           可变对象

不可变 = 不能改变 [ 引用A, 引用B, 引用C ] 中的任何引用
可变   = 引用B 指向的 [2, 3] 可以变成 [2, 3, 99]
```

用 `id()` 可以验证引用不变：

```python
t = ([1, 2], [3, 4])
print(f"t[0] 的 id: {id(t[0])}")

t[0].append(99)   # 修改内容
print(f"t[0] 的 id: {id(t[0])}  (没变——引用没变，内容变了)")
```

**运行结果**：

```text
t[0] 的 id: 4325216032
t[0] 的 id: 4325216032  (没变——引用没变，内容变了)
```

#### 2.3.4 纯不可变元组

当所有元素都是不可变类型（`int`、`str`、`float`、`tuple`、`bool`、`None`）时，元组完全不可变：

```python
t_immutable = (1, "hello", (2, 3), 3.14)
# 这个元组的任何层面都不能被修改
```

#### 2.3.5 可变元素导致 hash 失败

含可变元素的元组不可哈希：

```python
t = (1, [2, 3], 4)
try:
    hash(t)
except TypeError as e:
    print(f"TypeError: {e}")
```

**运行结果**：

```text
TypeError: unhashable type: 'list'
```

---

### 2.4 增广赋值与元组

`t += (4,)` 是一个常见的"陷阱"——看起来像是在修改元组，实际上是创建了一个新元组并让变量重新指向：

#### 2.4.1 元组 += 创建新对象

```python
t1 = (1, 2, 3)
print(f"id(t1) = {id(t1)}")

t1 += (4, 5)
print(f"id(t1) = {id(t1)}  (变了！)")
print(f"t1 = {t1}")
```

**运行结果**：

```text
id(t1) = 4325216032
id(t1) = 4325216128  (变了！)
t1 = (1, 2, 3, 4, 5)
```

`t1 += (4, 5)` 等价于 `t1 = t1 + (4, 5)`——先创建新元组 `(1, 2, 3, 4, 5)`，然后让 `t1` 指向新对象。旧元组 `(1, 2, 3)` 如果没有其他引用，会被垃圾回收。

#### 2.4.2 列表 += 就地修改

```python
lst = [1, 2, 3]
print(f"id(lst) = {id(lst)}")

lst += [4, 5]
print(f"id(lst) = {id(lst)}  (没变！)")
print(f"lst = {lst}")
```

**运行结果**：

```text
id(lst) = 4325216032
id(lst) = 4325216032  (没变！)
lst = [1, 2, 3, 4, 5]
```

列表的 `+=` 调用的是 `__iadd__`（就地扩展），在原对象上修改，不创建新对象。

#### 2.4.3 函数中的行为差异

这个差异在函数传参时尤为明显：

```python
def modify_tuple(t):
    t += (99,)
    return t

def modify_list(lst):
    lst += [99]
    return lst

original_t = (1, 2, 3)
new_t = modify_tuple(original_t)
print(f"原元组: {original_t} (未变！)")

original_lst = [1, 2, 3]
returned_lst = modify_list(original_lst)
print(f"原列表: {original_lst} (被修改了!)")
print(f"是同一对象? {original_lst is returned_lst}")
```

**运行结果**：

```text
原元组: (1, 2, 3) (未变！)
原列表: [1, 2, 3, 99] (被修改了!)
是同一对象? True
```

元组传入函数后，`t += (99,)` 创建了新元组，原元组不受影响。列表传入后，`lst += [99]` 就地修改，原列表被改了——这就是"不可变传递"的安全性。

---

### 2.5 不可变性的内存优势

不可变性不仅是安全特性，还带来了内存优化：

#### 2.5.1 空元组单例

CPython 对空元组做了全局单例优化——所有 `()` 都指向同一个对象：

```python
print(() is ())  # True
```

因为空元组不可变、没有元素、不可能被修改，所以共享一个实例完全安全。

#### 2.5.2 元组 vs 列表的内存占用

```python
import sys
sizes = [0, 1, 3, 5, 10, 20, 50, 100]
for n in sizes:
    t = tuple(range(n))
    lst = list(range(n))
    print(f"长度={n:>3}  元组={sys.getsizeof(t):>4}  列表={sys.getsizeof(lst):>4}  差异={sys.getsizeof(lst) - sys.getsizeof(t):>+4}")
```

**运行结果**：

```text
长度=  0  元组=  40  列表=  56  差异= +16
长度=  1  元组=  48  列表=  64  差异= +16
长度=  3  元组=  64  列表=  88  差异= +24
长度=  5  元组=  80  列表= 104  差异= +24
长度= 10  元组=120  列表=152  差异= +32
长度= 20  元组=200  列表=216  差异= +16
长度= 50  元组=440  列表=464  差异= +24
长度=100  元组=840  列表=872  差异= +32
```

元组比列表省 16~32 字节——列表需要额外的容量管理字段（过度分配策略），元组不需要。

#### 2.5.3 列表的过度分配

列表在 `append` 时会预分配额外空间以减少频繁的内存重分配：

```python
lst = []
for i in range(10):
    lst.append(i)
    print(f"  len={len(lst):>2}, sizeof={sys.getsizeof(lst):>4} bytes")
```

**运行结果**：

```text
  len= 1, sizeof=  64 bytes
  len= 2, sizeof=  64 bytes
  len= 3, sizeof=  64 bytes
  len= 4, sizeof=  64 bytes
  len= 5, sizeof= 104 bytes
  len= 6, sizeof= 104 bytes
  len= 7, sizeof= 104 bytes
  len= 8, sizeof= 104 bytes
  len= 9, sizeof= 104 bytes
  len=10, sizeof= 104 bytes
```

列表容量是跳跃式增长的（64→104→...），而元组创建后大小固定，没有容量管理开销。

---

### 2.6 综合场景实战

#### 2.6.1 保护配置不被修改

```python
DB_CONFIG = ("localhost", 5432, "myapp", "readonly")
# DB_CONFIG[1] = 3306  # TypeError — 配置被保护
```

用元组存储配置信息，任何试图修改配置的代码都会立即报错——"快速失败"比"静默修改"安全得多。

#### 2.6.2 多返回值

```python
def min_max_avg(numbers):
    return (min(numbers), max(numbers), sum(numbers) / len(numbers))

low, high, avg = min_max_avg([3, 1, 4, 1, 5, 9, 2, 6])
print(f"最小值={low}, 最大值={high}, 平均值={avg:.2f}")
```

**运行结果**：

```text
最小值=1, 最大值=9, 平均值=3.88
```

函数返回多个值时用元组打包，调用方用解包接收——这是 Python 最惯用的多返回值模式。

#### 2.6.3 线程安全的数据共享

```python
import threading

SHARED_DATA = ("2024-01-15", "production", "v2.3.1")

def read_config(thread_id):
    for i in range(3):
        # 多个线程同时读取元组，无需加锁
        _ = SHARED_DATA
```

元组天生线程安全——多个线程读取同一个元组不需要同步锁，因为没有任何线程能修改它。

#### 2.6.4 历史快照

```python
snapshots = []
snapshots.append(("2024-01-15 10:30:00", 45, 60, 200))
snapshots.append(("2024-01-15 10:31:00", 52, 65, 180))
snapshots.append(("2024-01-15 10:32:00", 48, 62, 220))
```

系统监控快照用元组存储，保证历史记录不被篡改——出了问题时可以信任快照数据的完整性。

---

## 3. 最佳实践

### 3.1 推荐写法 vs 不推荐写法

**配置常量用元组，不用列表**

```python
# 推荐：元组保护配置不被修改
ALLOWED_METHODS = ("GET", "POST", "PUT", "DELETE")

# 不推荐：列表可以被意外修改
# allowed_methods = ["GET", "POST", "PUT", "DELETE"]
# allowed_methods.append("HACK")  # 静默修改，不报错
```

**需要"修改"元组时，用拼接创建新元组**

```python
# 推荐：创建新元组
t = (1, 2, 3)
t = t + (4,)  # 新元组 (1, 2, 3, 4)

# 不推荐：试图修改元组（会报错）
# t.append(4)
```

**不要在元组中存储可变元素（除非有特殊需求）**

```python
# 推荐：用嵌套元组
grid = ((1, 2), (3, 4), (5, 6))

# 不推荐：元组中存列表（破坏不可变性）
# grid = ([1, 2], [3, 4], [5, 6])
# grid[0].append(99)  # 元组内容变了！
```

### 3.2 常见错误模式

**错误模式1：以为 `t += (4,)` 是修改元组**

```python
t = (1, 2, 3)
t += (4,)  # t 变成了 (1,2,3,4)，但这是新对象
# 如果其他变量引用了旧元组，它们不受影响
```

**错误模式2：在元组中放列表然后当作"不可变"使用**

```python
t = (1, [2, 3])
# t 看起来不可变，但 t[1] 是列表，可以被修改
t[1].append(99)  # 元组内容变了
```

**错误模式3：期望元组有 append/extend 等方法**

```python
t = (1, 2, 3)
# t.append(4)  # AttributeError
# 需要用 t = t + (4,) 代替
```

### 3.3 何时用元组 vs 列表

| 场景 | 推荐 | 原因 |
|------|------|------|
| 配置常量 | 元组 | 不需要修改，防误改 |
| 多返回值 | 元组 | 惯用模式，不可变更安全 |
| 字典键 | 元组 | 需要可哈希 |
| 需要增删改的数据 | 列表 | 元组做不到 |
| 需要排序的数据 | 列表 | 元组没有 sort 方法 |
| 大量只读数据 | 元组 | 内存更省 |
| 多线程共享只读数据 | 元组 | 线程安全 |

---

## 4. 原理

### 4.1 CPython 中元组的内存结构

在 CPython 实现中，元组是一个 C 结构体 `PyTupleObject`：

```text
struct PyTupleObject {
    PyObject_VAR_HEAD   // 引用计数 + 类型 + 大小
    PyObject **ob_item  // 指向 PyObject 指针数组的指针
}
```

元组的 `ob_item` 是一个固定大小的指针数组，大小在创建时确定，之后不改变。这就是不可变性的底层来源——数组大小固定，无法增删；元素指针没有赋值入口，无法修改。

列表的 `PyListObject` 额外有一个 `allocated` 字段记录分配容量，`ob_item` 指向的数组可以重新分配——这就是列表可变性的来源。

### 4.2 为什么 += 对元组和列表行为不同

Python 的 `+=` 操作调用 `__iadd__` 方法（如果存在）：

- **列表**实现了 `__iadd__`，就地扩展数组，不创建新对象。
- **元组**没有实现 `__iadd__`，Python 退化为 `t = t + (4,)`——调用 `__add__` 创建新元组。

这是语言设计的选择：元组不可变，所以不提供 `__iadd__`；列表可变，所以提供 `__iadd__` 实现就地修改以提升性能（避免创建新数组）。

### 4.3 空元组单例的内存优化

CPython 在启动时创建一个全局的空元组单例 `tuple_empty`。所有 `()` 字面量和 `tuple()` 调用都返回这个单例的引用。

这完全安全——空元组没有元素，不可能被修改（也无处可改），共享一个实例节省了每次创建空元组的内存分配开销。

### 4.4 浅层不可变的设计哲学

"元组不可变但元素可能可变"看起来是一个"漏洞"，但实际上是合理的设计：

1. **元组不拥有元素的语义**：元组只是存储引用，不"拥有"引用指向的对象。对象的可变性由对象自身的类型决定，不是元组的职责。
2. **一致性**：如果元组强制要求所有元素不可变，你就无法在元组中存储任何包含列表的复杂对象，这太限制了。
3. **实用性**：很多时候你需要一个"固定结构"但"元素内容可更新"的容器——比如一个 `(header, data)` 元组，`header` 固定但 `data` 可以更新。

如果你需要"完全不可变"，确保所有元素都是不可变类型即可——这是使用者的责任，不是语言的强制。

---

## 5. 总结

本文围绕元组的不可变性展开深度剖析，主要介绍了以下内容：

- **不可变性的基本验证**：元组创建后不能赋值修改元素（`TypeError`）、不能添加元素（无 `append` 等方法）、不能删除元素。元组只有 `count` 和 `index` 两个只读方法，没有列表的 `append`/`extend`/`insert`/`remove`/`pop`/`clear`/`sort`/`reverse` 等修改方法。

- **浅层不可变与深层不可变**：元组的不可变性是"浅层"的——不能改变元组中存储的引用，但如果引用指向的是可变对象（如列表），对象自身的内容可以被修改。`t[1].append(99)` 可以执行，但 `t[1] = [10]` 不行。纯不可变元组（所有元素都是不可变类型）完全不可变。含可变元素的元组不可哈希。

- **增广赋值的行为差异**：`t += (4,)` 对元组创建新对象（`__add__`），对列表就地修改（`__iadd__`）。在函数中元组传参不会被修改（创建新对象返回），列表传参会被就地修改——这是元组"不可变传递"的安全性。

- **内存优势**：空元组是全局单例（所有 `()` 指向同一对象）。元组内存占用比列表小 16~32 字节（无容量管理开销）。列表有过度分配策略（容量跳跃增长），元组大小固定。

- **最佳实践**：配置常量用元组防误改，多返回值用元组是惯用模式，不要在元组中放可变元素（除非有特殊需求），线程共享只读数据用元组（天生线程安全）。

- **底层原理**：CPython 中元组的 `ob_item` 是固定大小的指针数组（不可增删），列表有 `allocated` 容量字段（可动态扩展）。元组不实现 `__iadd__`，所以 `+=` 退化为创建新对象的 `__add__`。"浅层不可变"是设计选择——元组只存储引用，不拥有元素，元素的可变性由自身类型决定。
