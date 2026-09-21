---
group:
  title: 【10】循环结构
  order: 10
order: 14
title: 循环常见易错点
nav:
  title: Python基础
  order: 1
---

# 循环常见易错点

## 1. 介绍

### 1.1 本篇讲什么

循环是 Python 中使用最频繁的结构，也是出错最频繁的结构。有些错误是**运行时立即报错**的（如 `RuntimeError: dictionary changed size during iteration`），有些是**静默出错的**（如列表边遍历边删除导致的元素跳过），还有些是**看似正确但行为不符预期的**（如闭包中的循环变量延迟绑定）。

本篇按错误类型组织，覆盖七大易错类别。每一类都会展示**错误案例**、解释**出错原因**、给出**修正方案**，以及**如何提前预防**。

```python
# 一个"看起来对"但结果出乎意料的典型错误：
data = [1, 2, 3, 4, 5, 6]
for x in data:
    if x % 2 == 0:
        data.remove(x)
print(data)  # [1, 3, 5]  —— 2、4、6 都没了吗？不，6 没被删！

# 原因：remove 改变了遍历位置的索引，导致元素被跳过。
```

### 1.2 易错点分类总览

```text
循环常见易错点

  ├── 一、遍历时修改集合
  │   ├── 列表边遍历边删 → 跳过元素
  │   ├── 字典边遍历边删 → RuntimeError
  │   └── 遍历时新增 → 潜在无限循环
  │
  ├── 二、for-else 的误解
  │   ├── 以为 else 总是执行
  │   └── 不知道空序列也触发 else
  │
  ├── 三、变量作用域与迭代器陷阱
  │   ├── for 循环变量泄漏
  │   ├── 闭包延迟绑定
  │   └── 迭代器一次性消费
  │
  ├── 四、解包错误与索引陷阱
  │   ├── 解包数量不匹配
  │   └── 删除元素时索引偏移
  │
  ├── 五、循环条件与边界错误
  │   ├── while 死循环
  │   ├── off-by-one
  │   └── 空序列处理
  │
  ├── 六、性能反模式
  │   └── 循环内重复计算、+= 字符串拼接
  │
  └── 七、综合易错场景
      ├── try-except 放错位置
      ├── break 只跳出内层
      └── 推导式中的异常处理
```

---

## 2. 核心内容

### 2.1 遍历时修改集合

这是循环中最高频也最危险的错误类别。

#### 2.1.1 列表：边遍历边删除——跳过元素

```python
data = [1, 2, 3, 4, 5, 6]
for x in data:
    if x % 2 == 0:
        data.remove(x)
print(data)  # [1, 3, 5]  —— 期望 [, 3, 5]？但 6 呢？
```

**为什么 6 没被删除**：列表的 `remove` 改变了元素位置。当遍历到索引 1 的元素 2 时，删除它，后面的 3、4、5、6 全部向前移动一位。但 `for` 循环下一步访问的是索引 2——此时索引 2 指向的是原来的索引 3 的元素（即 4），原来在索引 2 的元素 3 被跳过了。同样，删除 4 后，6 也被向前移动跳过了。

```text
遍历过程追踪（索引视角）：

初始:       [1, 2, 3, 4, 5, 6]  索引 0→1→2→3→4→5
读取 [1]=2 → remove(2)
            [1, 3, 4, 5, 6]      3 移到了索引 1
读取 [2]=4 → remove(4)           但是 3 在索引 1，被跳过了！
            [1, 3, 5, 6]          5 移到了索引 2
读取 [3]=6 → remove(6)
            [1, 3, 5]             5 在索引 2，也被跳过了！
读取 [4]→ 越界，循环结束
```

**修正方案（推荐度递减）**：

方案一——列表推导式（最简单）：

```python
data = [1, 2, 3, 4, 5, 6]
data = [x for x in data if x % 2 != 0]
print(data)  # [1, 3, 5]
```

方案二——遍历副本：

```python
data = [1, 2, 3, 4, 5, 6]
for x in data[:]:        # 遍历的是切片副本
    if x % 2 == 0:
        data.remove(x)   # 修改的是原列表
print(data)  # [1, 3, 5]
```

#### 2.1.2 字典：边遍历边删——RuntimeError

字典对遍历中修改大小的检测更严格——直接抛异常：

```python
d = {"a": 1, "b": 0, "c": 3, "d": 0}

for key in d:
    if d[key] == 0:
        del d[key]  # RuntimeError: dictionary changed size during iteration
```

**原因**：字典的迭代器内部维护了版本号。当字典添加或删除键时，版本号变化，迭代器下次访问时检测到不一致，抛出 `RuntimeError`。这是一个防御机制——Python 宁愿报错也不让你静默出 bug。

**修正方案**：

方案一——收集后批量删除：

```python
to_delete = [k for k, v in d.items() if v == 0]
for k in to_delete:
    del d[k]
```

方案二——字典推导式（推荐）：

```python
d = {k: v for k, v in d.items() if v != 0}
```

#### 2.1.3 遍历时向列表新增元素——无限循环风险

```python
items = [1, 2, 3]
for x in items:
    items.append(x * 10)    # 每次迭代都在增长！
    # 这个循环永远不会结束（或直到内存耗尽）
```

对于列表，`for` 遍历的是**迭代器**，它会一直尝试取下一个元素直到 `StopIteration`。如果你不断往末尾追加，迭代器就不断有"下一个"，变成无限循环。

**修正**：如果需要基于已有元素生成新元素，用新列表：

```python
original = [1, 2, 3]
new_items = [x * 10 for x in original if some_condition(x)]
```

#### 2.1.4 安全操作：只修改值（不增删）

修改已有索引的值不改变列表长度，是安全的：

```python
arr = [1, 2, 3, 4, 5]
for i in range(len(arr)):
    arr[i] = arr[i] * 10   # 安全：长度不变
print(arr)  # [10, 20, 30, 40, 50]
```

同样的，修改字典已有键的值（不增删键）也是安全的：

```python
for k, v in d.items():
    d[k] = v * 2   # 安全：只改值，键数量不变
```

#### 2.1.5 高亮总结

| 操作 | 列表 | 字典 |
|------|------|------|
| 删除元素 | 静默跳过（危险！） | RuntimeError（阻止你） |
| 新增元素 | 可能无限循环 | RuntimeError |
| 修改已有元素的值 | ✅ 安全 | ✅ 安全 |
| 推荐修正方式 | 列表推导式 | 字典推导式或 list(keys()) |

### 2.2 for-else 的误解

#### 2.2.1 最核心的误解：else 不是"循环后总会执行"

`for-else` 是 Python 中最被误解的语法之一。它的正确含义是：**else 块在循环没有被 break 打断时才执行**。

```python
# break 打断 → else 不执行
for x in [1, 2, 3, 4, 5]:
    if x == 3:
        break
else:
    print("不会执行")  # ← 不执行
```

```python
# 正常结束 → else 执行
for x in [1, 2, 3]:
    print(x)
else:
    print("循环正常结束")

# 输出：1, 2, 3, "循环正常结束"
```

#### 2.2.2 空序列也会触发 else

这是第二个常见的误解——很多人以为空序列不触发 else。实际上空序列是"正常结束"：

```python
for x in []:
    print("不会执行")
else:
    print("else 执行了！")

# 输出：else 执行了！
```

#### 2.2.3 continue 不影响 else

`continue` 跳过本次迭代的剩余部分，但不会打断循环，所以 `else` 照常执行：

```python
for x in [1, 2, 3]:
    if x == 2:
        continue
    print(x)
else:
    print("else 照常执行")

# 输出：1, 3, "else 照常执行"
```

#### 2.2.4 规则总结

| 循环结束方式 | else 是否执行 |
|-------------|-------------|
| 遍历完所有元素 | ✅ 执行 |
| 遇到 `break` | ❌ 不执行 |
| 空序列 | ✅ 执行（也算遍历完） |
| 有 `continue` | ✅ 不影响 |

### 2.3 变量作用域与迭代器陷阱

#### 2.3.1 for 循环变量泄漏

这是 Python 与许多语言不同的地方——`for` 循环的迭代变量在循环结束后**仍然存在**：

```python
for i in range(3):
    pass
print(i)  # 2 —— 变量 i 没有被销毁！
```

**对比**：列表推导式中的循环变量**不会泄漏**：

```python
x = 10
_ = [x for x in range(3)]    # 推导式内部的 x
print(x)  # 10 —— 外部 x 不受影响
```

#### 2.3.2 闭包中的延迟绑定——经典陷阱

这是 Python 面试和实际开发中都高频出现的陷阱：

```python
# 可能出错的写法
funcs = []
for i in range(3):
    funcs.append(lambda: i)  # lambda 中的 i 是引用，不是值！

for f in funcs:
    print(f())  # 2, 2, 2 —— 全部输出 2！
```

**原因**：`lambda` 中的 `i` 是**延迟绑定**的——它引用的是变量名 `i`，而不是创建 lambda 时 `i` 的当前值。循环结束后 `i = 2`，所有 lambda 调用时查到的都是这个最终值。

**修正**：用默认参数在定义时捕获当前值：

```python
funcs = []
for i in range(3):
    funcs.append(lambda i=i: i)  # 默认参数在定义时求值

for f in funcs:
    print(f())  # 0, 1, 2
```

#### 2.3.3 迭代器只能消费一次

生成器、`zip` 对象、`map` 对象、`filter` 对象，以及文件对象——这些都是**一次性迭代器**。消费完之后就空了：

```python
gen = (x for x in range(3))
print(list(gen))  # [0, 1, 2]
print(list(gen))  # [] —— 第二次是空的！

z = zip([1, 2, 3], ["a", "b", "c"])
print(list(z))    # [(1, 'a'), (2, 'b'), (3, 'c')]
print(list(z))    # [] —— 第二次是空的！
```

**什么时候会踩坑**：当你把同一个迭代器对象传给两个不同的消费者时：

```python
numbers = (x for x in range(100))
# sum 消耗了迭代器
total = sum(numbers)      # 正常
# 然后想再遍历一次——不行了
for n in numbers:         # 循环 0 次！
    process(n)
```

**预防**：如果需要多次使用，先用 `list()` 或 `tuple()` 物化。

### 2.4 解包错误与索引陷阱

#### 2.4.1 解包数量不匹配

```python
# enumerate 返回二元组 (index, value)
for i, x, y in enumerate(data):  # ValueError: not enough values to unpack
    ...

# 嵌套结构中的元素长度不一致
items = [("张三", 85), ("李四", 92, "优秀")]
for name, score in items:        # 第二个元组有 3 个元素
    ...
```

**预防**：在解包前确保数据结构一致。如果数据来源不可控（如外部输入），先用 `len()` 检查或用 `try-except` 包裹。

#### 2.4.2 删除元素时的索引偏移

用索引列表指定要删除哪些元素时，从前往后删会导致索引偏移：

```python
items = ["a", "b", "c", "d", "e"]
indices = [1, 3]      # 想删除索引 1 和 3 —— "b" 和 "d"

# 错误：从前往后删
for idx in indices:
    del items[idx]    # 删了 [1] 后，后面的索引全变了！

print(items)  # ['a', 'c', 'e'] —— 删成了 "b" 和 "d" 吗？不，"c" 被误删了！
```

**修正**：从后往前删，前面的索引不受影响：

```python
items = ["a", "b", "c", "d", "e"]
for idx in sorted(indices, reverse=True):
    del items[idx]

print(items)  # ['a', 'c', 'e'] —— 正确
```

### 2.5 循环条件与边界错误

#### 2.5.1 while 死循环

最常见的原因——**忘记更新循环变量**：

```python
i = 0
while i < 5:
    print(i)
    # 忘记 i += 1  ← 死循环
```

**预防**：写 `while` 循环时，先写清楚循环条件在什么情况下会变为 `False`，再在循环体中找到对应的更新语句。

#### 2.5.2 off-by-one：差一错误

```python
# range(n) 产生 0 到 n-1
items = ["a", "b", "c"]
for i in range(len(items)):
    print(items[i])        # 正确：0, 1, 2

# 但如果你写成
# for i in range(1, len(items)+1):  → 越界
```

#### 2.5.3 空序列的处理

内置函数对空序列的默认行为不一致：

```python
sum([])          # 0       —— 返回 0
max([])          # ValueError —— 报错！
max([], default=0)  # 0   —— 提供了 default 才安全
min([])          # ValueError —— 报错！
```

**预防**：在数据来源不可控时，给 `max`/`min` 提供 `default` 参数，或先检查序列是否为空。

### 2.6 性能反模式

这一节收录循环中常见的不必要性能损失。

#### 2.6.1 循环内重复计算

```python
import math

# 不推荐：每次循环重新计算 sqrt(2)
results = [x * math.sqrt(2) for x in data]

# 推荐：提取到循环外
SQRT2 = math.sqrt(2)
results = [x * SQRT2 for x in data]
```

同样的，`len(data)` 在 `while` 循环中每次判断都调用一次——如果这个值不变，提到外面：

```python
# 不推荐（while 场景）
i = 0
while i < len(data):     # len(data) 每次判断都调用
    process(data[i])
    i += 1

# 推荐（while 场景）
i, n = 0, len(data)
while i < n:
    process(data[i])
    i += 1
```

注意：`for i in range(len(data))` 中的 `len` **只在开始时计算一次**，所以不需要额外优化。只有 `while` 需要手动提取。

#### 2.6.2 循环中字符串 += 拼接

```python
# 不推荐：每次 += 创建新字符串对象（O(n²)）
result = ""
for word in words:
    result += word + " "

# 推荐：join 一次性分配（O(n)）
result = " ".join(words)
```

#### 2.6.3 不必要的中间列表

```python
# 不推荐：sum 内部先创建完整列表再求和
total = sum([x ** 2 for x in range(1_000_000)])   # ~8 MB 临时内存

# 推荐：生成器表达式，不创建中间列表
total = sum(x ** 2 for x in range(1_000_000))      # 常数内存
```

### 2.7 综合易错场景

#### 2.7.1 try-except 的放置位置

这是数据处理循环中最常见的逻辑错误——`try` 放到循环外面，一个异常就中断了所有后续处理：

```python
data = ["10", "20", "abc", "30", "xyz", "40"]

# 错误：try 在外面，遇到异常后 30、40 全丢了
results = []
try:
    for s in data:
        results.append(int(s))
except ValueError:
    pass
print(results)  # [10, 20] —— 只处理了前两个！

# 正确：try 在里面，跳过异常项继续处理
results = []
for s in data:
    try:
        results.append(int(s))
    except ValueError:
        pass
print(results)  # [10, 20, 30, 40] —— 正常！
```

**规则**：如果你想跳过异常项继续处理剩余数据，`try` 必须放在**循环内部**。

#### 2.7.2 break 只跳出内层

```python
for i in range(5):
    for j in range(5):
        if condition(i, j):
            break  # 只跳出内层 j 循环，外层 i 继续！
```

如果意图是找到第一个匹配就完全停止，需要在外层也加 `break`，或者封装为函数用 `return`。

#### 2.7.3 推导式中的异常处理

推导式不能直接使用 `try-except`。需要异常处理时，将逻辑抽取为函数：

```python
def safe_int(s):
    try:
        return int(s)
    except ValueError:
        return None

raw = ["1", "2", "three", "4"]
parsed = [safe_int(x) for x in raw]
valid = [x for x in parsed if x is not None]
print(valid)  # [1, 2, 4]
```

#### 2.7.4 换行符和空字符串陷阱

```python
# 字符串 split 后，末尾可能有空串
text = "hello\nworld\npython\n"
lines = text.split("\n")
print(lines)  # ['hello', 'world', 'python', '']
#                                        ↑ 空串！

# 清理
lines = [l for l in lines if l]
```

---

## 3. 最佳实践

### 3.1 防御性编程 Checklist

用以下清单逐项检查你的循环代码：

- [ ] **遍历中是否修改了集合**？如果删或增元素，是否用了副本/推导式？
- [ ] **for-else 用得是否正确**？else 是「没 break 时执行」，不是「总是执行」
- [ ] **是否有闭包捕获循环变量**？lambda 中的循环变量是否用默认参数捕获？
- [ ] **迭代器是否被多次使用**？zip/map/filter/generator 只能消费一次
- [ ] **while 条件是否必然能变为 False**？循环变量是否在循环体内被更新？
- [ ] **try-except 是否放在循环内**？如果需要跳过异常继续处理后续元素
- [ ] **字符串拼接是否用了 join**？循环中不要用 +=
- [ ] **常量计算是否外提**？循环内不重复计算不变的值
- [ ] **max/min 对空序列是否给了 default**？

### 3.2 易错点对照速查表

| 错误现象 | 原因 | 正确做法 |
|---------|------|---------|
| 列表遍历时删除，元素被跳过 | remove 改变了索引 | 推导式 / 遍历副本 `for x in data[:]:` |
| 字典遍历时删除，抛 RuntimeError | 字典迭代器检测到大小变化 | `{k:v for k,v in d.items() if ...}` |
| for-else 中 else 没执行 | break 阻止了 else | else 只在未 break 时执行 |
| 闭包全部输出相同值 | 循环变量延迟绑定 | `lambda i=i: i` 用默认参数捕获 |
| 生成器二次遍历为空 | 迭代器一次性 | 先用 `list()` 物化 |
| while 死循环 | 条件永远为 True | 确保循环变量被更新 |
| try 放在循环外导致中断 | 一个异常停止所有处理 | try 放在循环内 |

---

## 4. 原理

### 4.1 为什么列表的"边删边遍历"会跳过元素

核心原因是 `for` 循环依赖的是**索引位置的移动**，而不是元素本身。删除一个元素后，后续元素全部向前移动一位，但 `for` 循环的"下一步"仍然按原定索引前进——这导致紧跟在被删元素后面的元素被跳过：

```text
关键机制：

for x in data:  # 等价于：
    it = iter(data)
    while True:
        try:
            x = next(it)
        except StopIteration:
            break
        # 循环体

iter(data) 内部维护一个索引指针。
remove() 改变了列表内容但迭代器不知道，
迭代器继续按原索引前进 → 跳过元素。
```

### 4.2 为什么字典直接抛出 RuntimeError

Python 字典的迭代器设计者选择了一个**更安全的策略**——维护一个修改计数器（modification counter）。每次字典增删键时计数器 +1，迭代器每次 `next()` 时检查计数器是否与创建时一致。不一致就抛异常。这避免了列表那种"静默跳过元素"的危险行为——同样是修改集合，dict 选择「宁可报错也不给你潜在 bug」的路线。

### 4.3 闭包延迟绑定的原理

```python
funcs = []
for i in range(3):
    funcs.append(lambda: i)
```

每个 lambda 内部没有**存储** `i` 的值，而是存储了**对变量名 `i` 的引用**。当 lambda 被调用时，它去查找当前作用域中 `i` 的值——此时循环早已结束，`i = 2`。这就是"延迟绑定"：变量的值在函数被调用时才确定，而不是在函数被定义时。

默认参数则不同——`lambda i=i: i` 中的 `i=i` 是默认参数，它的值在函数定义时就被求值并保存了。

---

## 5. 总结

本文围绕循环的常见易错点，主要介绍了以下内容：

- **遍历时修改集合**：列表用 `remove` 会跳过元素（熔断索引），字典直接抛 RuntimeError，修正方式是推导式或遍历副本
- **for-else 误解**：else 只在循环未被 break 打断时执行，空序列算正常结束也会触发，continue 不影响
- **闭包延迟绑定**：lambda 中的循环变量捕获的是引用而非值，用默认参数 `lambda i=i: ...` 修正
- **一次性迭代器**：生成器、zip、map 对象都只能消费一次，需要多次使用先 `list()` 物化
- **解包错误**：解包变量数量必须与元素数量匹配，数据来源不可控时加检查
- **索引偏移**：在列表中按索引删除时，必须从后往前删（`sorted(indices, reverse=True)`）
- **while 死循环和 off-by-one**：确保条件能变为 False、边界编号正确、max/min 对空序列加 default
- **性能反模式**：循环不变式外提、用 join 代替 +=、sum 中不用中间列表
- **try-except 位置**：要跳过异常继续处理用内层 try，要遇异常全停用外层 try
- 防御性编程 checklist：逐一过一遍你的循环代码，每个项问自己"会不会出这个问题"