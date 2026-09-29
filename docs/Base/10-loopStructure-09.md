---
group:
  title: 【10】循环结构
  order: 10
order: 9
title: 嵌套循环与复杂解包
nav:
  title: Python基础
  order: 1
---

# 嵌套循环与复杂解包

## 1. 介绍

### 1.1 什么是嵌套循环与复杂解包

嵌套循环是指在一个循环体的内部再写一个（或多个）循环。外层循环每走一步，内层循环跑完一整轮。这种方式让程序能够遍历**二维或更高维度的数据**——矩阵的行与列、笛卡尔积的组合、多层嵌套的字典结构等等。

复杂解包则是将「多变量解包」的能力进一步拓展到嵌套结构中：`for i, (a, b) in enumerate(items)` 这种写法里，外层解包分离索引和数据，内层解包把数据中的元组再拆开——一层套一层，让代码在获取数据的同时完成结构拆解。

来看一个最简示例——嵌套循环遍历二维列表：

```python
matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
]

for row in matrix:          # 外层：遍历每一行
    for val in row:         # 内层：遍历行中的每个元素
        print(val, end=" ")
    print()

# 输出：
# 1 2 3
# 4 5 6
# 7 8 9
```

再看一个复杂解包的例子——`enumerate` + 内层解包一步拆到底：

```python
students = [
    ("张三", 85, 92),
    ("李四", 90, 88),
    ("王五", 78, 95),
]

for rank, (name, chinese, math) in enumerate(students, start=1):
    total = chinese + math
    print(f"第{rank}名: {name} 总分{total}")

# 输出：
# 第1名: 张三 总分177
# 第2名: 李四 总分178
# 第3名: 王五 总分173
```

### 1.2 嵌套循环在 Python 中的定位

嵌套循环处于循环体系的最上层——它组合了基础循环结构，是处理多维数据的核心工具：

```text
Python 循环体系

  ├── 基础循环
  │   ├── for 循环 —— 遍历可迭代对象
  │   └── while 循环 —— 条件驱动
  │
  ├── 流程控制
  │   ├── break / continue / else —— 控制循环走向
  │   └── 嵌套中的跳出策略 —— flag / for-else / return
  │
  ├── 辅助工具
  │   ├── enumerate / zip —— 序号与并行遍历
  │   └── 解包语法 —— 多变量一次性赋值
  │
  └── 嵌套循环 ← 组合以上全部
      ├── 二维/三维数组遍历
      ├── 笛卡尔积组合生成
      └── 多层解包（enumerate + zip + 内层结构拆解）
```

### 1.3 为什么需要嵌套循环和复杂解包

很多现实数据天然是多维的：课程表是 (星期 × 课时)、商品 SKU 是颜色 × 尺寸 × 材质、公司组织架构是树状层级。嵌套循环让你用最直观的方式处理这些多维数据。

解包语法的嵌套使用则消除了"一层一层手动拆"的样板代码。对比一下：

```python
# 不用复杂解包——逐层拆
for item in enumerate(students, start=1):
    rank = item[0]
    name = item[1][0]
    chinese = item[1][1]
    math = item[1][2]

# 用复杂解包——一行搞定
for rank, (name, chinese, math) in enumerate(students, start=1):
```

嵌套循环 + 复杂解包 = 处理多维数据的表达能力 × 代码简洁性。

---

## 2. 核心内容

### 2.1 嵌套循环的执行机制

#### 2.1.1 两层嵌套的执行流程

嵌套循环的核心规则：**外层循环每迭代一次，内层循环跑完一整轮**。每次外层进入新的迭代，内层从头开始。

```python
colors = ["红", "绿", "蓝"]
sizes = ["S", "M", "L"]

for color in colors:
    for size in sizes:
        print(f"{color}-{size}", end="  ")
    print()

# 输出：
# 红-S  红-M  红-L
# 绿-S  绿-M  绿-L
# 蓝-S  蓝-M  蓝-L
```

这个过程相当于做了 3 × 3 = 9 次组合，遍历的顺序是「固定外层的当前值，遍历内层的全部值」。总执行次数 = 外层迭代次数 × 内层迭代次数。

用流程图展示这个执行过程：

```text
外层: color="红"
  ├── 内层: size="S" → "红-S"
  ├── 内层: size="M" → "红-M"
  └── 内层: size="L" → "红-L"
外层: color="绿"
  ├── 内层: size="S" → "绿-S"
  ├── 内层: size="M" → "绿-M"
  └── 内层: size="L" → "绿-L"
外层: color="蓝"
  ├── 内层: size="S" → "蓝-S"
  ├── 内层: size="M" → "蓝-M"
  └── 内层: size="L" → "蓝-L"
```

#### 2.1.2 三层及更多层嵌套

嵌套的层数没有硬性限制，但每加一层就增加一个维度的组合：

```python
# 三维坐标遍历
for x in range(1, 3):
    for y in range(1, 3):
        for z in range(1, 3):
            print(f"({x}, {y}, {z})", end=" ")
    print()
```

三层嵌套的执行流程：

```text
x=1
  ├── y=1
  │   ├── z=1 → (1,1,1)
  │   └── z=2 → (1,1,2)
  └── y=2
      ├── z=1 → (1,2,1)
      └── z=2 → (1,2,2)
x=2
  ├── y=1
  │   ├── z=1 → (2,1,1)
  │   └── z=2 → (2,1,2)
  └── y=2
      ├── z=1 → (2,2,1)
      └── z=2 → (2,2,2)
```

**复杂度提醒**：三层嵌套的总迭代次数 = N₁ × N₂ × N₃，如果每层都有 100 个元素，那就是 1,000,000 次。嵌套层数增加时，要考虑数据规模是否可控。

#### 2.1.3 内层循环依赖外层变量

内层循环可以**动态地**参考外层变量来控制行为——这是嵌套循环最灵活的地方：

```python
# 内层范围随外层变化：生成左下三角形
for i in range(1, 6):
    for j in range(1, i + 1):  # 内层长度 = i
        print(f"{j} ", end="")
    print()

# 输出：
# 1
# 1 2
# 1 2 3
# 1 2 3 4
# 1 2 3 4 5
```

内层的 `range(1, i + 1)` 使用了外层变量 `i`，所以内层长度每次都不同。这种「内层依赖外层变量」的模式是用嵌套循环生成非矩形模式的核心技巧。

---

### 2.2 用嵌套循环生成二维模式

#### 2.2.1 实心矩形与空心矩形

**实心矩形**：内层循环不区分边界，每个位置都打印字符。

```python
# 4 行 × 6 列的实心矩形
for row in range(4):
    for col in range(6):
        print("*", end=" ")
    print()
```

**空心矩形**：在内层用条件判断，只有边界位置打印字符：

```python
# 5 行 × 7 列的空心矩形
height, width = 5, 7
for i in range(height):
    for j in range(width):
        # 边界条件：第一行、最后一行、第一列、最后一列
        if i == 0 or i == height - 1 or j == 0 or j == width - 1:
            print("*", end=" ")
        else:
            print(" ", end=" ")
    print()
```

```text
* * * * * * *
*           *
*           *
*           *
* * * * * * *
```

**关键点**：`i` 是行索引，`j` 是列索引。边界条件是：`i == 0`（首行）、`i == height - 1`（末行）、`j == 0`（首列）、`j == width - 1`（末列）。

#### 2.2.2 左直角三角形

让内层循环长度随外层索引增长：

```python
for i in range(1, 6):
    for j in range(i):    # 第 i 行打印 i 个星号
        print("*", end=" ")
    print()

# 输出：
# *
# * *
# * * *
# * * * *
# * * * * *
```

#### 2.2.3 等腰三角形（金字塔）

等腰三角形需要两层逻辑：先打印前导空格、再打印星号：

```python
rows = 5
for i in range(1, rows + 1):
    # 前导空格：第 i 行需要 rows - i 个空格
    print(" " * (rows - i) * 2, end="")
    # 星号：第 i 行需要 2*i - 1 个星号
    print("* " * (2 * i - 1))
```

```text
        *
      * * *
    * * * * *
  * * * * * * *
* * * * * * * * *
```

这个模式可以拆成两个独立的循环逻辑来看：
- 外层 `i` 控制行号（1 到 rows）
- 前导空格数 = `rows - i`（第一行最多空格，最后一行零空格）
- 星号数 = `2 * i - 1`（第 1 行 1 个，第 2 行 3 个……）

#### 2.2.4 菱形

菱形是「正金字塔 + 倒金字塔」的组合：

```python
n = 4
# 上半部分：从 1 行到 n 行
for i in range(1, n + 1):
    spaces = "  " * (n - i)
    stars = "* " * (2 * i - 1)
    print(spaces + stars)

# 下半部分：从 n-1 行到 1 行
for i in range(n - 1, 0, -1):
    spaces = "  " * (n - i)
    stars = "* " * (2 * i - 1)
    print(spaces + stars)
```

上半部分 `range(1, n + 1)` 递增，下半部分 `range(n - 1, 0, -1)` 递减，两者加起来形成对称。注意下半部分用 `-1` 步长反向遍历，且从 `n - 1` 开始以避免和上半部分的中间行重复。

---

### 2.3 九九乘法表——嵌套循环的经典应用

#### 2.3.1 左下三角格式（标准形式）

```python
for i in range(1, 10):
    for j in range(1, i + 1):
        print(f"{j}×{i}={i*j:2d}", end="  ")
    print()

# 输出（部分）：
# 1×1= 1
# 1×2= 2  2×2= 4
# 1×3= 3  2×3= 6  3×3= 9
# ...
```

`{i*j:2d}` 中的 `:2d` 保证了结果以两位数字宽度对齐，即使是 `1` 也会显示为 ` 1`。

#### 2.3.2 完整矩阵格式（9×9）

如果不限内层范围，就是一个完整的 9×9 方阵：

```python
for i in range(1, 10):
    for j in range(1, 10):
        print(f"{i}×{j}={i*j:2d}", end="  ")
    print()
```

#### 2.3.3 变换思路：用不同格式练习循环控制

同一个乘法表可以变出多种输出格式——调整内层循环的 `range` 起点和终点、添加前导空格：

| 格式 | 内层范围 | 特点 |
|------|---------|------|
| 左下三角 | `range(1, i+1)` | 每行列数递增，最常用 |
| 完整矩阵 | `range(1, 10)` | 固定 9×9 |
| 右上三角 | `range(i, 10)` + 前导空格 | 对称于左下三角 |

---

### 2.4 嵌套结构中的复杂解包

#### 2.4.1 列表中包含元组：单层解包 × enumerate

```python
students = [
    ("张三", 85, 92),
    ("李四", 90, 88),
    ("王五", 78, 95),
]

for rank, (name, chinese, math) in enumerate(students, start=1):
    print(f"第{rank}名: {name} 语文{chinese} 数学{math}")
# 输出：
# 第1名: 张三 语文85 数学92
# 第2名: 李四 语文90 数学88
# 第3名: 王五 语文78 数学95
```

解包拆分的层次：

```text
enumerate(students, start=1) 每次产出一个 (序号, 元组)

  ┌─── rank ────────────── (name, chinese, math) ───┐
  │                                                   │
  (1,                    ("张三", 85, 92))
   ↑ 外层 enumerate 解包   ↑ 内层元组解包（括号表示）
```

#### 2.4.2 字典嵌套字典：两层 items 解包

```python
departments = {
    "研发部": {"张三": 15000, "李四": 18000},
    "市场部": {"王五": 12000, "赵六": 11000},
}

for dept, members in departments.items():
    print(f"[{dept}]")
    for name, salary in members.items():
        print(f"  {name}: ¥{salary}")

# 输出：
# [研发部]
#   张三: ¥15000
#   李四: ¥18000
# [市场部]
#   王五: ¥12000
#   赵六: ¥11000
```

外层 `.items()` 拆出部门名和成员字典，内层 `.items()` 再拆出姓名和薪资。两层解包各司其职，层级清晰。

#### 2.4.3 矩阵中的行列解包

结合 `enumerate` 给每个元素加行列坐标：

```python
matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
]

for row_idx, row in enumerate(matrix):
    row_total = 0
    for col_idx, val in enumerate(row):
        row_total += val
        print(f"  [{row_idx}][{col_idx}] = {val}")
    print(f"  第{row_idx}行合计: {row_total}")
```

#### 2.4.4 最复杂的嵌套解包：enumerate + zip + 内层解包

当多个数据源需要同时处理时，可以链式组合：

```python
names = ["Alice", "Bob", "Carol"]
info = [("研发", 3), ("市场", 5), ("研发", 1)]

# enumerate 返回 (序号, zip配对结果)
# zip 返回 (名称, (部门, 年限))
# 内层再次解包 (部门, 年限)
for idx, (name, (dept, years)) in enumerate(zip(names, info), start=1):
    print(f"#{idx} {name}: {dept}部门, {years}年经验")

# 输出：
# #1 Alice: 研发部门, 3年经验
# #2 Bob: 市场部门, 5年经验
# #3 Carol: 研发部门, 1年经验
```

这种写法把三层信息（序号、姓名、(部门, 年限)）在 `for` 头部一步拆解完成。虽然括号较多，但一旦建立了解包结构的心智模型，代码的表达力远高于手动逐层索引：

```python
# 等价于但不推荐的写法
for idx, pair in enumerate(zip(names, info), start=1):
    name = pair[0]
    dept = pair[1][0]
    years = pair[1][1]
    print(f"#{idx} {name}: {dept}部门, {years}年经验")
```

---

### 2.5 从嵌套循环中跳出

`break` 只能跳出**当前所在的那一层**循环，无法直接跳出外层。当嵌套循环需要在满足某个条件时完全终止，有几种策略。

#### 2.5.1 策略一：标志变量（flag）

最直接的方式——用一个布尔标志跨层传递"该停"的信号：

```python
data = [
    [1, 2, 3],
    [4, 0, 6],   # 找到 0 就停
    [7, 8, 9],
]

found = False
for i, row in enumerate(data):
    for j, val in enumerate(row):
        if val == 0:
            print(f"在 [{i}][{j}] 找到 0")
            found = True
            break       # 跳出内层
    if found:
        break           # 跳出外层
```

**流程图**：

```text
外层 i=0
  └── 内层 j=0→2: 1, 2, 3（全通过）
外层 i=1
  └── 内层 j=0: 4
       j=1: 0 → 发现目标！
           found=True, break 内层
  ← 外层检查 found=True, break 外层
  终止。
```

**适用场景**：逻辑简单、不想拆函数的场合。缺点是多了 `found` 变量和两处 `if found: break`。

#### 2.5.2 策略二：for-else + break

利用 `for-else` 的特性——`else` 块在循环**没有被 break 打断时才执行**：

```python
matrix = [[1,2,3], [4,5,6], [7,8,9]]
target = 5

for i, row in enumerate(matrix):
    for j, val in enumerate(row):
        if val == target:
            print(f"找到 {target} 在 [{i}][{j}]")
            break
    else:
        continue      # 内层没找到 → 继续外层
    break             # 内层找到了 → 跳出外层
else:
    print(f"未找到 {target}")
```

**执行逻辑**：内层 `break` 时，内层的 `else` 不执行，所以 `continue` 被跳过，外层 `break` 执行。内层正常跑完时（没 break），内层 `else` 执行 `continue`，继续外层的下一次迭代。

**适用场景**：适合「找第一个匹配项」场景。但可读性不如策略三。

#### 2.5.3 策略三：封装为函数 + return（最推荐）

把嵌套循环的逻辑封装到一个函数中，用 `return` 一次性跳出所有循环：

```python
def find_position(matrix, target):
    """在二维矩阵中查找目标值的位置"""
    for i, row in enumerate(matrix):
        for j, val in enumerate(row):
            if val == target:
                return i, j   # 直接返回，跳出所有循环层
    return None               # 没找到

matrix = [[10,20,30], [40,50,60], [70,80,90]]
pos = find_position(matrix, 50)
print(pos)  # (1, 1)
```

**为什么这是最佳方案**：
- `return` 一次性跳出所有层级，不需要标志变量、不需要层层的 `break` 检查
- 函数名明确了意图
- 函数可被复用和独立测试
- 代码结构更清晰——嵌套循环的跳出逻辑不再污染主流程

| 策略 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| 标志变量 | 直观，无需拆函数 | 多出变量和判断，代码膨胀 | ⭐⭐ |
| for-else + break | 无需额外变量 | 可读性一般，不直观 | ⭐⭐⭐ |
| 函数 + return | 最干净，可复用 | 需要拆函数 | ⭐⭐⭐⭐⭐ |

---

### 2.6 二维列表的常见操作

二维列表（list of lists）是嵌套循环最常处理的数据结构。下面以学生成绩表为例，展示几个核心操作。

```python
scores = [
    [1, "张三", 85, 92, 88],
    [2, "李四", 90, 88, 95],
    [3, "王五", 78, 85, 80],
    [4, "赵六", 92, 90, 91],
]
```

#### 2.6.1 行遍历：计算每行的汇总值

```python
for sid, name, *subject_scores in scores:
    total = sum(subject_scores)
    avg = total / len(subject_scores)
    print(f"{name}: 总分{total} 平均{avg:.1f}")

# 输出：
# 张三: 总分265 平均88.3
# 李四: 总分273 平均91.0
# 王五: 总分243 平均81.0
# 赵六: 总分273 平均91.0
```

用 `*subject_scores` 一次性收集所有科目成绩，省去逐个索引。

#### 2.6.2 列遍历：计算每列的值

```python
# 第 2 列 = 语文，第 3 列 = 数学，第 4 列 = 英语
subjects = ["语文", "数学", "英语"]
for col_idx, subject in enumerate(subjects, start=2):
    total = sum(row[col_idx] for row in scores)
    avg = total / len(scores)
    print(f"{subject}: {avg:.1f}")
```

列遍历本质上是「对每一列，遍历每一行的对应位置」。表达为：外循环控制列号，内循环（生成器表达式）聚合每一行该列的值。

#### 2.6.3 对角线遍历

```python
square = [[1,2,3], [4,5,6], [7,8,9]]

main = [square[i][i] for i in range(len(square))]          # 主对角线
anti = [square[i][len(square)-1-i] for i in range(len(square))]  # 副对角线

print(main)  # [1, 5, 9]
print(anti)  # [3, 5, 7]
```

**对角线的索引规律**：
- 主对角线（左上→右下）：行索引 = 列索引，即 `[i][i]`
- 副对角线（右上→左下）：行索引 + 列索引 = n - 1，即 `[i][n-1-i]`

#### 2.6.4 寻找极值

```python
max_avg = -1
top_student = None
for sid, name, *subjects in scores:
    avg = sum(subjects) / 3
    if avg > max_avg:
        max_avg = avg
        top_student = name
print(f"最高分: {top_student} ({max_avg:.1f})")
```

---

## 3. 最佳实践

### 3.1 推荐 vs 不推荐写法对比

| 场景 | 不推荐 | 推荐 | 原因 |
|------|--------|------|------|
| 二维列表遍历 | 用索引 `for i in range(len(m)): for j in range(len(m[i]))` | `for row in m: for val in row:` | 直接用元素更简洁 |
| 需要行列索引时 | 手动维护 `row_idx = 0` | `for row_idx, row in enumerate(m):` | enumerate 自动管理索引 |
| 嵌套结构取值 | `item[0]`, `item[1][0]`, `item[1][1]` | `rank, (name, score) = item` 或 for 头部解包 | 变量名有语义 |
| 跳出多层循环 | 多层 flag + break | 封装为函数 + return | 最干净 |
| 多维数据聚合 | 多层 for + 手动累加 | 生成器表达式 / sum 配合推导式 | 一行聚合 |
| 三层以上嵌套 | 直接写三层 for | 考虑拆函数或使用 itertools.product | 控制复杂度 |

#### 3.1.1 典型对比示例

**二维列表行列遍历**

不推荐——索引方式，容易越界且可读性差：

```python
for i in range(len(matrix)):
    for j in range(len(matrix[i])):
        val = matrix[i][j]
        print(val, end=" ")
```

推荐——直接遍历元素，需要索引时用 enumerate：

```python
for row in matrix:
    for val in row:
        print(val, end=" ")
```

### 3.2 常见错误模式及修正

**错误一：忘记重置内层状态**

```python
# 错误：count 在外面定义，内层一直累加不会重置
count = 0
for row in matrix:
    for val in row:
        count += 1  # 所有行的元素混在一起计数了
```

修正方式——每行需要独立计数时，在外层循环内部初始化：

```python
for row_idx, row in enumerate(matrix):
    row_count = 0    # 每行重新初始化
    for val in row:
        row_count += 1
    print(f"第{row_idx}行有{row_count}个元素")
```

**错误二：多层解包时括号层级写错**

```python
# 错误：忘加内层括号
for idx, name, dept, years in enumerate(zip(names, info), start=1):
    # zip 返回的是 (name, (dept, years))，不是 (name, dept, years)
```

修正方式——检查数据结构，加正确的括号：

```python
for idx, (name, (dept, years)) in enumerate(zip(names, info), start=1):
```

**错误三：试图用 break 一次性跳出所有嵌套层**

```python
# 错误：break 只跳出内层，外层继续执行
for i in range(10):
    for j in range(10):
        if data[i][j] == target:
            break  # 只出了内层！外层 i 继续递增
```

修正方式——使用函数 `return`（最佳）或标志变量。

**错误四：对不等长的二维列表用索引遍历**

```python
# 危险：假设每行长度相同
data = [[1,2], [3], [4,5,6]]
for i in range(len(data)):
    for j in range(len(data[0])):  # 假设每行和第一行一样长——错了！
        print(data[i][j])  # 可能越界
```

修正方式——直接遍历元素：

```python
for row in data:
    for val in row:
        print(val)  # 安全：每行按自身长度遍历
```

### 3.3 可读性与性能取舍建议

**别让嵌套超过三层**：三层嵌套的代码可读性已经显著下降，超过三层应优先考虑拆分函数或使用 `itertools.product`：

```python
from itertools import product

# 替代三层 for 嵌套
for color, size, material in product(["红","绿"], ["S","M"], ["棉","涤纶"]):
    print(f"{color}-{size}-{material}")
```

**复杂解包加括号分组**：括号帮助读者快速识别解包层级。`for (rank, (name, score)) in ...` 比 `for rank, name, score in ...` 更能让读者注意到 `name` 和 `score` 是一组的。

**列遍历的性能提示**：对大型二维列表的列遍历（如计算每列均值），用生成器表达式 `sum(row[col] for row in data)` 比先 `zip(*data)` 再遍历更直观且内存占用更低，因为 `zip(*)` 会把所有行一起解压到内存中。

---

## 4. 原理

### 4.1 嵌套循环的迭代器模型

每个 `for` 循环背后都是一个迭代器。嵌套循环就是两层（或多层）迭代器的嵌套推进：

```text
for row in matrix:          → iter(matrix) 创建矩阵的迭代器 A
    for val in row:         → iter(row)    创建当前行的迭代器 B
        ...
```

执行流程：

```text
1. A = iter(matrix)
2. A.__next__() → [1, 2, 3] 赋给 row
3.     B = iter([1, 2, 3])
4.     B.__next__() → 1    → 循环体
5.     B.__next__() → 2    → 循环体
6.     B.__next__() → 3    → 循环体
7.     B.__next__() → StopIteration → 内层结束
8. A.__next__() → [4, 5, 6] 赋给 row
9.     B = iter([4, 5, 6])  ← 注意：每次外层迭代都创建新的行迭代器
10.    ...（重复 4-7）
11. A.__next__() → StopIteration → 外层结束
```

关键洞察：**外层每走一步，内层都会创建一个全新的迭代器并跑完整个迭代生命周期**。这也解释了为什么 `break` 只能跳出自己所在的那一层——每层有独立的状态空间。

### 4.2 解包的求值顺序

复杂解包 `for rank, (name, score) in enumerate(data)` 的执行分为两步：

1. `enumerate(data)` 产生 `(0, ("张三", 85))`
2. 解包：`rank = 0`，`(name, score) = ("张三", 85)`，再内层解包 `name = "张三"`, `score = 85`

解包是**递归的**——Python 检查右侧值的结构，发现它是一个 `(int, tuple)` 的模式，于是先把 int 赋值给 `rank`，再把 tuple 内部继续拆解。这个过程在每次迭代开始前完成，任何解包失败（如结构不匹配）都会在对应迭代中抛出异常。

### 4.3 时间复杂度思维

嵌套循环的时间复杂度直接由各层大小的乘积决定：

| 嵌套层数 | 每层大小 N | 迭代次数 | 时间复杂度 |
|---------|----------|---------|-----------|
| 2 层 | N | N² | O(N²) |
| 3 层 | N | N³ | O(N³) |
| K 层 | N | N^K | O(N^K) |

在实际编码中，有两个优化方向：
- **减少不必要的嵌套深度**：能用 `itertools.product` 或推导式扁平化的地方，不要写深层 for
- **早退出**：如果嵌套循环是做「查找第一个」，找到了就用 `return` 立即退出，不要等到遍历完

---

## 5. 总结

本文围绕嵌套循环与复杂解包，主要介绍了以下内容：

- 嵌套循环的核心机制：外层每走一步，内层跑完一整轮，总迭代次数 = 各层大小之积
- 内层循环可以动态参考外层变量（如 `range(1, i+1)`），这是生成非矩形模式的关键
- 二维模式生成：实心/空心矩形、左直角三角形、等腰三角形、菱形
- 九九乘法表是嵌套循环的经典练习，左下三角格式最常用
- 复杂解包在嵌套结构中的用法：`for rank, (name, s1, s2) in enumerate(data)` 一步拆多层
- 字典嵌套字典用两层 `.items()` 解包，矩阵遍历用两层 `enumerate` 解包
- 嵌套循环跳出策略：标志变量 → for-else → 函数 return（推荐度递增）
- 二维列表常见操作：行遍历、列遍历、对角线遍历、极值查找
- 三层以上嵌套考虑用 `itertools.product` 替代，多列聚合用生成器表达式
- `break` 只能跳出当前层的原因：每层有独立的迭代器，`break` 只作用于最内层迭代器的终止