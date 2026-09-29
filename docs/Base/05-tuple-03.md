---
group:
  title: 【05】元组介绍
  order: 5
order: 3
title: 元组的索引与切片
nav:
  title: Python基础
  order: 1
---

# 元组的索引与切片

## 1. 介绍

### 1.1 什么是索引与切片

元组是一个**有序序列**——每个元素都有固定的位置编号（索引）。索引和切片是访问元组元素的两种基本方式：

- **索引（indexing）**：通过单个位置编号取出一个元素，语法 `t[i]`，返回单个元素。
- **切片（slicing）**：通过一个范围取出一段连续元素，语法 `t[start:stop:step]`，返回一个新元组。

```python
# 索引：取一个元素
colors = ("红", "橙", "黄", "绿", "青", "蓝", "紫")
print(colors[0])     # 红（第一个）
print(colors[-1])    # 紫（最后一个）

# 切片：取一段元素
print(colors[1:4])   # ('橙', '黄', '绿')  索引 1 到 3
print(colors[:3])    # ('红', '橙', '黄')  从头到索引 2
print(colors[::-1])  # 反转整个元组
```

元组的索引和切片行为与列表**完全一致**——有序、支持正负索引、支持步长、切片返回同类型。唯一的区别是元组不可变，不能通过索引赋值修改元素。

### 1.2 索引与切片速览

| 操作 | 语法 | 返回类型 | 示例 | 结果 |
|------|------|---------|------|------|
| 正向索引 | `t[i]` | 元素本身 | `("a","b","c")[0]` | `"a"` |
| 负向索引 | `t[-i]` | 元素本身 | `("a","b","c")[-1]` | `"c"` |
| 基本切片 | `t[start:stop]` | tuple | `("a","b","c")[0:2]` | `("a","b")` |
| 带步长切片 | `t[start:stop:step]` | tuple | `(0,1,2,3)[::2]` | `(0,2)` |
| 省略 start | `t[:stop]` | tuple | `(1,2,3)[:2]` | `(1,2)` |
| 省略 stop | `t[start:]` | tuple | `(1,2,3)[1:]` | `(2,3)` |
| 反转 | `t[::-1]` | tuple | `(1,2,3)[::-1]` | `(3,2,1)` |
| 整体拷贝 | `t[:]` | tuple | `(1,2,3)[:]` | `(1,2,3)` |

### 1.3 索引与切片的关键区别

索引和切片虽然都用来访问元组元素，但行为有本质差异：

| 维度 | 索引 `t[i]` | 切片 `t[a:b]` |
|------|-------------|--------------|
| 返回值 | 单个元素 | 新元组 |
| 返回类型 | 元素本身的类型 | tuple |
| 越界行为 | 抛出 `IndexError` | 自动截断，不报错 |
| 是否修改原元组 | 否（只读） | 否（创建新元组） |
| 负数含义 | 从右往左数 | 同索引 |

```python
t = (10, 20, 30, 40, 50)

# 索引返回元素
print(t[0])       # 10（int 类型）
print(type(t[0]))  # <class 'int'>

# 切片返回元组
print(t[0:1])     # (10,)（tuple 类型）
print(type(t[0:1]))  # <class 'tuple'>
```

这个区别很重要——`t[-1]` 返回最后一个**元素**，`t[-1:]` 返回包含最后一个元素的**元组**。

---

## 2. 核心内容

### 2.1 正向索引

元组的正向索引从 `0` 开始，从左到右依次递增。这和列表、字符串的行为完全一致。

```python
weekdays = ("周一", "周二", "周三", "周四", "周五")
print(f"元组: {weekdays}")
print(f"长度: {len(weekdays)}")

# 正向索引
print(f"weekdays[0] = {weekdays[0]}")   # 周一（第一个）
print(f"weekdays[1] = {weekdays[1]}")   # 周二
print(f"weekdays[4] = {weekdays[4]}")   # 周五（最后一个）
```

**运行结果**：

```text
元组: ('周一', '周二', '周三', '周四', '周五')
长度: 5
weekdays[0] = 周一
weekdays[1] = 周二
weekdays[4] = 周五
```

对于长度为 `n` 的元组，有效的正向索引范围是 `0` 到 `n-1`。超出范围会报错：

```python
# 索引越界报错
try:
    weekdays[10]
except IndexError as e:
    print(f"weekdays[10] → IndexError: {e}")
    # tuple index out of range
```

**运行结果**：

```text
weekdays[10] → IndexError: tuple index out of range
```

### 2.2 负向索引

负向索引从 `-1` 开始，从右到左依次递减。`-1` 永远指向最后一个元素，这是 Python 中最常用的"取尾部"技巧。

```python
weekdays = ("周一", "周二", "周三", "周四", "周五")

# 负索引
print(f"weekdays[-1] = {weekdays[-1]}")   # 周五（最后一个）
print(f"weekdays[-2] = {weekdays[-2]}")   # 周四（倒数第二个）
print(f"weekdays[-5] = {weekdays[-5]}")   # 周一（-5 等同于 0）
```

**运行结果**：

```text
weekdays[-1] = 周一
weekdays[-2] = 周四
weekdays[-5] = 周一
```

正索引与负索引的对应关系：

```text
元组:  ("周一", "周二", "周三", "周四", "周五")
正索引:   0      1      2      3      4
负索引:  -5     -4     -3     -2     -1

规律: 正索引 i 对应负索引 i - n（n 为元组长度）
      weekdays[0] == weekdays[-5]
      weekdays[4] == weekdays[-1]
```

用代码验证这个对应关系：

```python
weekdays = ("周一", "周二", "周三", "周四", "周五")

for i in range(len(weekdays)):
    neg = i - len(weekdays)
    print(f"  weekdays[{i}] == weekdays[{neg}] → {weekdays[i]}")
```

**运行结果**：

```text
  weekdays[0] == weekdays[-5] → 周一
  weekdays[1] == weekdays[-4] → 周二
  weekdays[2] == weekdays[-3] → 周三
  weekdays[3] == weekdays[-2] → 周四
  weekdays[4] == weekdays[-1] → 周五
```

**索引只读——不能赋值**

元组不可变，不能通过索引修改元素：

```python
try:
    weekdays[0] = "Sunday"
except TypeError as e:
    print(f"weekdays[0] = 'Sunday' → TypeError: {e}")
    # 'tuple' object does not support item assignment
```

### 2.3 混合类型元组的索引

元组可以包含任意类型的元素，索引返回的就是对应位置元素的原始类型：

```python
record = ("张三", 20, "计算机科学", 90.5, True)

print(f"姓名: {record[0]}")           # "张三"（str）
print(f"年龄: {record[1]}")           # 20（int）
print(f"专业: {record[2]}")           # "计算机科学"（str）
print(f"成绩: {record[3]}")           # 90.5（float）
print(f"是否及格: {record[4]}")       # True（bool）
```

这种用元组存"记录"的模式在 Python 中非常常见——字段位置固定、顺序有意义、不可意外修改。配合解包使用更加清晰：

```python
name, age, major, score, passed = record
print(f"{name}, {age}岁, {major}, {score}分, 及格: {passed}")
# 张三, 20岁, 计算机科学, 90.5分, 及格: True
```

### 2.4 切片基础语法：t[start:stop]

切片是最常用的"取一段"操作。基本语法 `t[start:stop]`，返回从索引 `start` 到 `stop-1` 的元素——**左闭右开**。

```python
colors = ("红", "橙", "黄", "绿", "青", "蓝", "紫")
print(f"元组: {colors}")

# 基本切片：左闭右开 [start, stop)
print(f"colors[1:4] = {colors[1:4]}")    # ('橙', '黄', '绿')  索引 1,2,3
print(f"colors[0:3] = {colors[0:3]}")    # ('红', '橙', '黄')
print(f"colors[2:5] = {colors[2:5]}")    # ('黄', '绿', '青')
```

**运行结果**：

```text
元组: ('红', '橙', '黄', '绿', '青', '蓝', '紫')
colors[1:4] = ('橙', '黄', '绿')
colors[0:3] = ('红', '橙', '黄')
colors[2:5] = ('黄', '绿', '青')
```

左闭右开的设计意味着：`colors[1:4]` 取的是索引 1、2、3 的元素，不包含索引 4。这个规则和 `range(start, stop)` 一致——`start` 包含，`stop` 不包含。好处是 `len(colors[1:4]) == 4 - 1 == 3`，切片长度可以直接用 `stop - start` 算出。

### 2.5 省略 start 或 stop

切片的 `start` 和 `stop` 都可以省略，Python 会自动用默认值填充：

| 写法 | 含义 | 默认值 |
|------|------|--------|
| `t[:stop]` | 从开头到 stop-1 | start 默认为 0 |
| `t[start:]` | 从 start 到末尾 | stop 默认为 len(t) |
| `t[:]` | 整个元组 | start=0, stop=len(t) |

```python
colors = ("红", "橙", "黄", "绿", "青", "蓝", "紫")

# 省略 start：从开头到 stop-1
print(f"colors[:3] = {colors[:3]}")      # ('红', '橙', '黄')
print(f"colors[:5] = {colors[:5]}")      # ('红', '橙', '黄', '绿', '青')

# 省略 stop：从 start 到末尾
print(f"colors[3:] = {colors[3:]}")      # ('绿', '青', '蓝', '紫')
print(f"colors[5:] = {colors[5:]}")      # ('蓝', '紫')

# 省略两者：整个元组
print(f"colors[:] = {colors[:]}")        # 完整拷贝
```

**运行结果**：

```text
colors[:3] = ('红', '橙', '黄')
colors[:5] = ('红', '橙', '黄', '绿', '青')
colors[3:] = ('绿', '青', '蓝', '紫')
colors[5:] = ('蓝', '紫')
colors[:] = ('红', '橙', '黄', '绿', '青', '蓝', '紫')
```

`t[:]` 看起来和 `t` 一样，但它创建了一个新元组对象。对于不可变的元组来说，这个拷贝通常没有实际意义（因为共享引用是安全的），但在需要确保获得独立对象时可以用到。

### 2.6 负索引在切片中的使用

切片中的 `start` 和 `stop` 同样支持负索引，这让"取尾部"和"去掉尾部"变得极其简洁：

```python
colors = ("红", "橙", "黄", "绿", "青", "蓝", "紫")

# 取最后 3 个
print(f"colors[-3:] = {colors[-3:]}")     # ('青', '蓝', '紫')

# 去掉最后 2 个
print(f"colors[:-2] = {colors[:-2]}")     # ('红', '橙', '黄', '绿', '青')

# 倒数第 4 到倒数第 2
print(f"colors[-4:-1] = {colors[-4:-1]}")  # ('绿', '青', '蓝')

# 去掉首尾
print(f"colors[1:-1] = {colors[1:-1]}")   # ('橙', '黄', '绿', '青', '蓝')
```

**运行结果**：

```text
colors[-3:] = ('青', '蓝', '紫')
colors[:-2] = ('红', '橙', '黄', '绿', '青')
colors[-4:-1] = ('绿', '青', '蓝')
colors[1:-1] = ('橙', '黄', '绿', '青', '蓝')
```

`colors[1:-1]` 是一个非常实用的惯用法——去掉首尾元素，只取中间部分。这里的 `-1` 指的是"倒数第一个的索引"，因为左闭右开，所以不包含最后一个元素。

### 2.7 step 参数：t[start:stop:step]

切片的第三个参数 `step` 控制取元素的步长——每隔 `step-1` 个元素取一个。

```python
numbers = tuple(range(10))
print(f"元组: {numbers}")

# 步长 2：隔一个取一个（偶数索引位）
print(f"numbers[::2] = {numbers[::2]}")      # (0, 2, 4, 6, 8)

# 步长 3：隔两个取一个
print(f"numbers[::3] = {numbers[::3]}")      # (0, 3, 6, 9)

# 从索引 1 开始，步长 2（奇数索引位）
print(f"numbers[1::2] = {numbers[1::2]}")    # (1, 3, 5, 7, 9)

# 指定完整范围 + 步长
print(f"numbers[0:8:2] = {numbers[0:8:2]}")  # (0, 2, 4, 6)
```

**运行结果**：

```text
元组: (0, 1, 2, 3, 4, 5, 6, 7, 8, 9)
numbers[::2] = (0, 2, 4, 6, 8)
numbers[::3] = (0, 3, 6, 9)
numbers[1::2] = (1, 3, 5, 7, 9)
numbers[0:8:2] = (0, 2, 4, 6)
```

| 写法 | 含义 | 典型用途 |
|------|------|---------|
| `t[::2]` | 隔一个取一个 | 取偶数索引位 |
| `t[1::2]` | 从索引 1 开始隔一个取 | 取奇数索引位 |
| `t[::3]` | 隔两个取一个 | 稀疏采样 |
| `t[start:stop:step]` | 完整指定三参数 | 精确控制取值范围和步长 |

### 2.8 负步长：从右往左取

当 `step` 为负数时，切片从右往左取元素。最经典的用法是 `t[::-1]` 反转元组。

```python
numbers = tuple(range(10))
print(f"元组: {numbers}")

# 反转
print(f"numbers[::-1] = {numbers[::-1]}")       # (9, 8, 7, ..., 0)

# 反转 + 步长 2
print(f"numbers[::-2] = {numbers[::-2]}")       # (9, 7, 5, 3, 1)

# 从索引 8 往左到索引 3（不含 2）
print(f"numbers[8:2:-1] = {numbers[8:2:-1]}")   # (8, 7, 6, 5, 4, 3)

# 最后 5 个反转
print(f"numbers[-1:-6:-1] = {numbers[-1:-6:-1]}")  # (9, 8, 7, 6, 5)
```

**运行结果**：

```text
元组: (0, 1, 2, 3, 4, 5, 6, 7, 8, 9)
numbers[::-1] = (9, 8, 7, 6, 5, 4, 3, 2, 1, 0)
numbers[::-2] = (9, 7, 5, 3, 1)
numbers[8:2:-1] = (8, 7, 6, 5, 4, 3)
numbers[-1:-6:-1] = (9, 8, 7, 6, 5)
```

负步长的关键理解：当 `step < 0` 时，`start` 默认为末尾，`stop` 默认为开头。元素从 `start` 往左取，直到越过 `stop`（不包含 `stop`）。

**反转元组的两种方式对比**：

```python
t = ("a", "b", "c", "d", "e")

# 方式1：切片反转（最 Pythonic）
reversed_t = t[::-1]
print(f"t[::-1] = {reversed_t}")             # ('e', 'd', 'c', 'b', 'a')

# 方式2：reversed() 函数 + tuple()
reversed_t2 = tuple(reversed(t))
print(f"tuple(reversed(t)) = {reversed_t2}")  # ('e', 'd', 'c', 'b', 'a')
```

两种方式结果相同。`t[::-1]` 更简洁，是 Python 社区的惯用写法。`reversed()` 返回一个迭代器，需要 `tuple()` 物化。

### 2.9 切片边界处理

切片和索引在越界行为上有本质差异——索引越界抛 `IndexError`，切片越界自动截断，永不报错。

```python
colors = ("红", "橙", "黄", "绿", "青", "蓝", "紫")

# 切片不会越界报错，超出部分自动截断
print(f"colors[0:100] = {colors[0:100]}")      # 整个元组（超出部分忽略）
print(f"colors[5:100] = {colors[5:100]}")      # ('蓝', '紫')（只取到末尾）
print(f"colors[100:200] = {colors[100:200]}")  # ()  范围完全超出 → 空元组
```

**运行结果**：

```text
colors[0:100] = ('红', '橙', '黄', '绿', '青', '蓝', '紫')
colors[5:100] = ('蓝', '紫')
colors[100:200] = ()
```

这个设计让切片操作非常安全——你不需要先检查长度再切片。`t[:10]` 即使元组只有 3 个元素也不会报错，只是返回全部。

**切片边界细节**

```python
t = (1, 2, 3, 4, 5)

# start >= stop 且 step > 0 → 空元组
print(f"t[3:1] = {t[3:1]}")         # ()  start > stop，空
print(f"t[2:2] = {t[2:2]}")         # ()  start == stop，空

# start >= stop 且 step < 0 → 有结果
print(f"t[3:1:-1] = {t[3:1:-1]}")   # (4, 3)  从索引 3 往左到索引 2
print(f"t[4:0:-1] = {t[4:0:-1]}")   # (5, 4, 3, 2)

# step 为 0 会报错
try:
    t[::0]
except ValueError as e:
    print(f"t[::0] → ValueError: {e}")
    # slice step cannot be zero
```

**运行结果**：

```text
t[3:1] = ()
t[2:2] = ()
t[3:1:-1] = (4, 3)
t[4:0:-1] = (5, 4, 3, 2)
t[::0] → ValueError: slice step cannot be zero
```

`step` 不能为 0，因为步长为 0 意味着"不前进"，会陷入无限循环。Python 在底层检查到 `step == 0` 时直接抛出 `ValueError`。

### 2.10 切片创建新元组

切片操作总是返回一个**新元组**，原元组不受影响。即使是 `t[:]` 也会创建新对象（虽然对于不可变元组来说意义不大）。

```python
original = (1, 2, 3, 4, 5)
sliced = original[1:4]

print(f"原元组: {original}")         # (1, 2, 3, 4, 5)  不变
print(f"切片结果: {sliced}")         # (2, 3, 4)
print(f"original is sliced: {original is sliced}")  # False
```

**运行结果**：

```text
原元组: (1, 2, 3, 4, 5)
切片结果: (2, 3, 4)
original is sliced: False
```

### 2.11 索引 vs 切片的返回类型

这是初学者最容易混淆的一点——`t[i]` 返回元素，`t[i:i+1]` 返回包含该元素的元组。

```python
data = (3.14, 2.72, 1.41, 1.73, 0.58, 2.24)

# 索引返回元素本身
print(f"data[-1] = {data[-1]}")
print(f"类型: {type(data[-1])}")

# 切片返回元组
print(f"data[-1:] = {data[-1:]}")
print(f"类型: {type(data[-1:])}")
```

**运行结果**：

```text
data[-1] = 2.24
类型: <class 'float'>
data[-1:] = (2.24,)
类型: <class 'tuple'>
```

| 操作 | 返回 | 类型 |
|------|------|------|
| `t[i]` | 第 i 个元素 | 元素本身的类型 |
| `t[i:]` | 从 i 到末尾的元组 | tuple |
| `t[-1]` | 最后一个元素 | 元素本身的类型 |
| `t[-1:]` | 含最后一个元素的元组 | tuple |
| `t[:1]` | 含第一个元素的元组 | tuple |

### 2.12 嵌套元组的索引

元组可以嵌套——元素本身也是元组。访问嵌套元素需要用连续的索引操作：`t[外层索引][内层索引]`。

```python
# 3x3 矩阵
matrix = (
    (1, 2, 3),
    (4, 5, 6),
    (7, 8, 9),
)

# 先取行，再取列
print(f"matrix[0] = {matrix[0]}")         # (1, 2, 3)  第一行
print(f"matrix[0][0] = {matrix[0][0]}")    # 1          第一行第一列
print(f"matrix[1][2] = {matrix[1][2]}")    # 6          第二行第三列
print(f"matrix[2][-1] = {matrix[2][-1]}")  # 9          最后一行最后一列
```

**运行结果**：

```text
matrix[0] = (1, 2, 3)
matrix[0][0] = 1
matrix[1][2] = 6
matrix[2][-1] = 9
```

嵌套索引的内存图解：

```text
matrix = ((1, 2, 3), (4, 5, 6), (7, 8, 9))

         外层索引 0        外层索引 1        外层索引 2
         ↓                ↓                ↓
matrix → (1, 2, 3)       (4, 5, 6)       (7, 8, 9)
          ↑  ↑  ↑          ↑  ↑  ↑          ↑  ↑  ↑
内层索引: 0  1  2          0  1  2          0  1  2

matrix[1][2]:
  先取 matrix[1] → (4, 5, 6)
  再取 [2]       → 6
```

### 2.13 嵌套元组的切片

切片同样适用于嵌套元组，但要注意切片只作用在"外层"——对行切片，不对列切片。

```python
matrix = (
    (1, 2, 3),
    (4, 5, 6),
    (7, 8, 9),
)

# 对行切片
print(f"matrix[0:2] = {matrix[0:2]}")       # ((1,2,3), (4,5,6))  前两行
print(f"matrix[-2:] = {matrix[-2:]}")       # ((4,5,6), (7,8,9))  后两行
print(f"matrix[::-1] = {matrix[::-1]}")     # 反转行顺序
```

**运行结果**：

```text
matrix[0:2] = ((1, 2, 3), (4, 5, 6))
matrix[-2:] = ((4, 5, 6), (7, 8, 9))
matrix[::-1] = ((7, 8, 9), (4, 5, 6), (1, 2, 3))
```

如果需要对"列"切片，要先取出行再对行内元素切片：

```python
# 先取第一行，再对行内元素切片
print(f"matrix[0][0:2] = {matrix[0][0:2]}")    # (1, 2)  第一行的前两个
print(f"matrix[1][::2] = {matrix[1][::2]}")    # (4, 6)  第二行隔一个取
print(f"matrix[2][::-1] = {matrix[2][::-1]}")  # (9, 8, 7) 第三行反转
```

**运行结果**：

```text
matrix[0][0:2] = (1, 2)
matrix[1][::2] = (4, 6)
matrix[2][::-1] = (9, 8, 7)
```

### 2.14 三层嵌套的索引

对于更深层的嵌套，只需继续追加索引：

```python
# 三维坐标
space = (
    ((1, 2), (3, 4), (5, 6)),       # 第一层
    ((7, 8), (9, 10), (11, 12)),    # 第二层
    ((13, 14), (15, 16), (17, 18)), # 第三层
)

# 三层索引
print(f"space[0] = {space[0]}")              # ((1,2), (3,4), (5,6))
print(f"space[0][1] = {space[0][1]}")         # (3, 4)
print(f"space[0][1][0] = {space[0][1][0]}")   # 3
print(f"space[2][2][1] = {space[2][2][1]}")   # 18
```

**运行结果**：

```text
space[0] = ((1, 2), (3, 4), (5, 6))
space[0][1] = (3, 4)
space[0][1][0] = 3
space[2][2][1] = 18
```

### 2.15 元组中包含可变元素的索引

元组本身不可变，但如果元素是可变对象（如 list），可以通过索引访问该可变对象，然后修改其内部：

```python
# 元组中包含 list
mixed = (1, [2, 3, 4], "hello")
print(f"原始: {mixed}")

# 通过索引访问元组内的 list
print(f"mixed[1] = {mixed[1]}")           # [2, 3, 4]
print(f"mixed[1][0] = {mixed[1][0]}")     # 2
print(f"mixed[1][-1] = {mixed[1][-1]}")   # 4

# 修改元组内的 list（合法！元组只持有引用，不约束引用指向的对象）
mixed[1].append(99)
print(f"修改后: {mixed}")                  # (1, [2, 3, 4, 99], 'hello')
```

**运行结果**：

```text
原始: (1, [2, 3, 4], 'hello')
mixed[1] = [2, 3, 4]
mixed[1][0] = 2
mixed[1][-1] = 4
修改后: (1, [2, 3, 4, 99], 'hello')
```

元组的不可变性约束的是"引用结构"——`mixed[1]` 必须永远指向同一个 list 对象，不能换成另一个对象。但这个 list 对象自己内部怎么变，元组管不了。

### 2.16 切片速查表

下表汇总了常用切片操作，方便快速查阅：

| 切片写法 | 含义 | 示例（t = (0,1,2,3,4,5,6,7,8,9)） | 结果 |
|---------|------|----------------------------------|------|
| `t[:]` | 整体拷贝 | `t[:]` | `(0,1,2,3,4,5,6,7,8,9)` |
| `t[:n]` | 前 n 个 | `t[:3]` | `(0,1,2)` |
| `t[-n:]` | 后 n 个 | `t[-3:]` | `(7,8,9)` |
| `t[n:]` | 跳过前 n 个 | `t[3:]` | `(3,4,5,6,7,8,9)` |
| `t[:-n]` | 去掉后 n 个 | `t[:-2]` | `(0,1,2,3,4,5,6,7)` |
| `t[::2]` | 隔一个取 | `t[::2]` | `(0,2,4,6,8)` |
| `t[1::2]` | 从 1 开始隔一个取 | `t[1::2]` | `(1,3,5,7,9)` |
| `t[::-1]` | 反转 | `t[::-1]` | `(9,8,7,6,5,4,3,2,1,0)` |
| `t[a:b]` | 取 [a, b) | `t[2:6]` | `(2,3,4,5)` |
| `t[1:-1]` | 去掉首尾 | `t[1:-1]` | `(1,2,3,4,5,6,7,8)` |

---

## 3. 最佳实践

### 3.1 推荐 vs 不推荐写法

**取最后一个元素**

```python
t = ("a", "b", "c", "d", "e")

# 推荐：用 -1
last = t[-1]
print(last)   # e

# 不推荐：用 len 计算
last = t[len(t) - 1]
print(last)   # e（啰嗦）
```

**取最后 N 个元素**

```python
# 推荐：用负索引切片
recent = t[-3:]

# 不推荐：用 len 计算
recent = t[len(t) - 3:]
```

**反转元组**

```python
# 推荐：切片反转
reversed_t = t[::-1]

# 不推荐：先转列表再反转再转元组
reversed_t = tuple(list(t)[::-1])
```

**去掉首尾**

```python
# 推荐：用 1 和 -1
middle = t[1:-1]

# 不推荐：用索引拼接
middle = t[1: len(t) - 1]
```

### 3.2 注意索引与切片的返回类型差异

```python
t = (10, 20, 30)

# 不推荐：需要元素但用了切片
x = t[0:1]    # (10,) —— 得到元组，不是 int
if x == 10:   # 永远为 False！（元组 != int）
    print("永远不会到达这里")

# 推荐：需要元素用索引
x = t[0]      # 10 —— 得到 int
if x == 10:   # True
    print("正确")

# 反过来：需要元组用切片
result = t[-1:]   # (30,) —— 切片保证返回元组，即使只有一个元素
```

### 3.3 常见错误模式及修正

| 错误 | 原因 | 修正 |
|------|------|------|
| `t[len(t)]` 越界 | 最大索引是 `len(t)-1` | 用 `t[-1]` |
| `t[::-1]` 后以为原元组变了 | 切片创建新元组 | 赋值给变量 `rev = t[::-1]` |
| `t[0] == t[0:1]` 为 False | 索引返回元素，切片返回元组 | 按需选择索引或切片 |
| `t[::0]` 报错 | step 不能为 0 | 用正整数或负整数 |
| `t[3:1]` 得空元组 | step 默认为 1，start > stop 时为空 | 加负步长 `t[3:1:-1]` |
| 修改 `matrix[0][0]` 报错 | 元组不可变 | 元组不能修改，考虑用列表 |

### 3.4 实战惯用法

**分页**

```python
# 用切片实现分页——非常简洁
data = tuple(range(20))  # 20 条数据

def get_page(data, page_num, page_size=5):
    start = (page_num - 1) * page_size
    return data[start:start + page_size]

print(get_page(data, 1))  # (0, 1, 2, 3, 4)
print(get_page(data, 2))  # (5, 6, 7, 8, 9)
print(get_page(data, 3))  # (10, 11, 12, 13, 14)
```

**取奇偶位**

```python
values = (10, 20, 30, 40, 50, 60, 70, 80)

even_positions = values[::2]   # (10, 30, 50, 70)  偶数索引位
odd_positions = values[1::2]   # (20, 40, 60, 80)  奇数索引位
```

**分段对比**

```python
# 一个学期的成绩
scores = (85, 90, 78, 92, 88, 76, 95, 89, 91, 87, 93, 82)

# 期中（前 6 周） vs 期末（后 6 周）
midterm = scores[:6]
final = scores[6:]
print(f"期中均分: {sum(midterm)/len(midterm):.1f}")  # 84.8
print(f"期末均分: {sum(final)/len(final):.1f}")      # 89.5
```

---

## 4. 原理

### 4.1 索引的底层实现：直接指针访问

元组的索引操作 `t[i]` 在 CPython 中是 O(1) 的——它直接通过指针偏移量访问元素，不需要遍历。

```text
元组 t = ("a", "b", "c", "d") 在内存中的结构：

PyTupleObject
├── ob_size = 4
└── ob_item (指向指针数组的指针)
        ↓
    [0] → "a"     ← t[0] → ob_item[0] → 偏移 0 字节
    [1] → "b"     ← t[1] → ob_item[1] → 偏移 8 字节
    [2] → "c"     ← t[2] → ob_item[2] → 偏移 16 字节
    [3] → "d"     ← t[3] → ob_item[3] → 偏移 24 字节

索引计算：t[i] = *(ob_item + i)
         t[-i] = *(ob_item + ob_size - i)
```

因为元组的 `ob_item` 是一个连续的指针数组，索引操作只需要一次指针运算——`ob_item + i`，然后解引用。无论元组有 3 个元素还是 300 万个元素，索引耗时相同。

### 4.2 负索引的转换

在 CPython 内部，负索引会被自动转换为正索引。转换逻辑：

```text
如果 i < 0:
    i = i + ob_size
如果 i < 0 或 i >= ob_size:
    抛出 IndexError
```

```python
# 验证负索引的转换
t = ("a", "b", "c", "d", "e")  # ob_size = 5

# t[-1] → -1 + 5 = 4 → t[4] → "e"
# t[-3] → -3 + 5 = 2 → t[2] → "c"
# t[-5] → -5 + 5 = 0 → t[0] → "a"
# t[-6] → -6 + 5 = -1 → < 0 → IndexError

print(t[-1] == t[4])   # True
print(t[-3] == t[2])   # True
print(t[-5] == t[0])   # True
```

### 4.3 切片的底层实现：slice 对象

切片操作 `t[start:stop:step]` 在 Python 内部被编译为一个 `slice` 对象，然后传给元组的 `__getitem__` 方法。

```python
# 切片在内部等价于创建 slice 对象
t = (0, 1, 2, 3, 4, 5, 6, 7, 8, 9)

# 这两种写法完全等价
result1 = t[2:8:2]
result2 = t[slice(2, 8, 2)]
print(result1 == result2)   # True
print(result1)              # (2, 4, 6)
```

`slice` 对象在创建时会处理默认值：

| 参数 | 默认值 | 说明 |
|------|--------|------|
| start | 0（step > 0）或 len-1（step < 0） | 起始位置 |
| stop | len(t)（step > 0）或 "before 0" | 结束位置 |
| step | 1 | 步长 |

### 4.4 切片不越界的底层原因

切片不会抛 `IndexError`，因为 CPython 在执行切片时会将 `start` 和 `stop` 钳制（clamp）到有效范围内：

```text
切片 t[start:stop:step] 的内部流程：

1. 解析 slice 对象的 start, stop, step
2. 处理默认值（None → 根据 step 正负确定）
3. 钳制范围：
   if step > 0:
       start = max(0, min(start, len))     ← 不小于 0，不大于 len
       stop  = max(0, min(stop, len))      ← 不小于 0，不大于 len
   if step < 0:
       start = min(len-1, max(start, -1))  ← 不大于 len-1
       ...
4. 按 step 遍历 [start, stop) 范围，逐个取元素
5. 创建新元组
```

这就是为什么 `t[0:100]` 不报错——`stop = 100` 被钳制为 `len(t)`，只取到末尾就停了。

### 4.5 索引与切片的字节码对比

索引和切片在字节码层面是不同的指令：

```python
import dis

code = compile("(t[0], t[0:3], t[::2])", "<test>", "eval")
dis.dis(code)
```

**运行结果**：

```text
  0 LOAD_NAME                0 (t)
  2 LOAD_CONST               0 (0)
  4 BINARY_SUBSCR                     ← 索引用 BINARY_SUBSCR

  6 LOAD_NAME                0 (t)
  8 LOAD_CONST               1 (0)
 10 LOAD_CONST               2 (3)
 12 BUILD_SLICE                2     ← 切片用 BUILD_SLICE
 14 BINARY_SUBSCR

 16 LOAD_NAME                0 (t)
 18 LOAD_CONST               3 (None)
 20 LOAD_CONST               3 (None)
 22 LOAD_CONST               4 (2)
 24 BUILD_SLICE                3     ← 三参数切片 BUILD_SLICE 3
 26 BINARY_SUBSCR
 28 BUILD_TUPLE              3
 30 RETURN_VALUE
```

索引直接用 `BINARY_SUBSCR`（二元下标操作），而切片先用 `BUILD_SLICE` 构建 `slice` 对象，再传给 `BINARY_SUBSCR`。所以切片比索引多了一步构建 slice 对象的开销——但这在大多数场景下可以忽略不计。

### 4.6 切片创建新元组的内存分配

切片创建新元组时，需要分配新内存并复制指针。时间复杂度为 O(k)，k 为切片长度。

```python
import sys

t = tuple(range(100))

# 不同切片长度的内存占用
for k in [10, 30, 50, 100]:
    s = t[:k]
    print(f"切片长度 {k:3d}: {sys.getsizeof(s):4d} 字节")
```

**运行结果**：

```text
切片长度  10:  136 字节
切片长度  30:  296 字节
切片长度  50:  456 字节
切片长度 100:  856 字节
```

元组每增加一个元素增加 8 字节（一个指针），加上对象头部的固定开销。切片的时间复杂度和空间复杂度都是 O(k)，k 为切片的实际长度。

### 4.7 索引与切片在序列协议中的位置

Python 的"序列协议"定义了 `__getitem__` 方法来支持索引和切片。元组通过 `PyTuple_Type` 注册了 `tp_as_mapping->mp_subscript`，这个函数同时处理整数索引和 slice 对象：

```text
t[key] 的内部流程：

1. 调用 t.__getitem__(key)
2. 检查 key 的类型：
   ├── key 是 int → 索引操作
   │   ├── 处理负索引（key += len if key < 0）
   │   ├── 检查范围（0 <= key < len）
   │   ├── 越界 → IndexError
   │   └── 返回 ob_item[key] 指向的对象
   │
   └── key 是 slice → 切片操作
       ├── 解析 start, stop, step
       ├── 钳制到有效范围
       ├── 计算结果长度
       ├── 分配新 PyTupleObject
       ├── 按 step 遍历，逐个复制指针
       └── 返回新元组
```

这就是为什么索引和切片用相同的方括号语法 `t[...]`——它们都走 `__getitem__`，只是参数类型不同。

---

## 5. 总结

本文围绕"元组的索引与切片"展开，主要介绍了以下内容：

- **正向索引**：从 `0` 开始，从左到右依次递增。长度为 `n` 的元组有效索引范围是 `0` 到 `n-1`，越界抛 `IndexError`。索引返回元素本身，类型为元素的原类型。

- **负向索引**：从 `-1` 开始，`-1` 永远指向最后一个元素。正索引 `i` 对应负索引 `i - n`。`t[-1]` 是最常用的"取尾部"技巧。

- **索引只读**：元组不可变，`t[i] = x` 会抛 `TypeError`。索引只能读取元素，不能修改。

- **切片基础** `t[start:stop]`：左闭右开，返回从 `start` 到 `stop-1` 的新元组。`start` 和 `stop` 都可省略——省略 `start` 从头开始，省略 `stop` 取到末尾，都省略取全部。

- **step 参数** `t[start:stop:step]`：控制步长。`t[::2]` 隔一个取一个，`t[1::2]` 从索引 1 开始隔一个取。负步长从右往左取，`t[::-1]` 反转元组是最常用惯用法。`step` 不能为 0。

- **切片的边界安全**：切片不越界报错，超出范围自动截断。`t[0:100]` 只取到末尾，`t[100:200]` 返回空元组。`start >= stop` 且 `step > 0` 时返回空元组。

- **索引与切片的区别**：索引返回单个元素，切片返回新元组。`t[-1]` 返回元素，`t[-1:]` 返回含一个元素的元组。`t[i]` 越界报错，`t[i:j]` 越界截断。

- **负索引在切片中**：`t[-3:]` 取最后 3 个，`t[:-2]` 去掉最后 2 个，`t[1:-1]` 去掉首尾，都是高频惯用法。

- **嵌套元组的索引**：连续索引 `t[外层][内层]` 逐层访问。切片只作用于外层（对行切片），需对内层切片时先取出行再切片。三层嵌套用 `t[a][b][c]`。

- **底层原理**：索引是 O(1) 的指针偏移访问（`ob_item + i`），负索引内部转换为正索引。切片创建 `slice` 对象传给 `__getitem__`，内部钳制范围后逐个复制指针创建新元组，时间复杂度 O(k)。索引和切片在字节码中分别对应直接 `BINARY_SUBSCR` 和 `BUILD_SLICE` + `BINARY_SUBSCR`。
