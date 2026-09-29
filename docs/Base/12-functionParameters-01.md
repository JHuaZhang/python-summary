---
group:
  title: 【12】函数参数介绍
  order: 12
order: 1
title: 形参与实参：参数传递的本质
nav:
  title: Python基础
  order: 1
---

# 形参与实参：参数传递的本质

## 1. 介绍

### 1.1 什么是形参与实参

当你调用一个函数时，括号里填写的值和函数定义时括号里写的变量名之间是什么关系？这就引出了参数机制的两个核心概念——**形参**和**实参**。

**形参**（Formal Parameter）是函数定义时在括号中声明的变量名。它是一个"占位符"，函数体内通过它来引用将来传入的值。

**实参**（Actual Argument）是调用函数时在括号中传入的具体值。它是"实际的数据"，被传递给形参使用。

```python
def greet(name):          # name 是形参——定义时的占位变量
    print(f"你好，{name}！")

greet("小明")             # "小明" 是实参——调用时传入的实际数据
```

**类比**：形参就像酒店预订系统中的"客人姓名"栏——它是一个位置，等着被填写。实参就是你入住时写下的"张三"——填进去的具体内容。同一个位置（形参），每次入住可以填不同的名字（实参）。

### 1.2 在 Python 知识体系中的位置

理解形参与实参是掌握 Python 函数参数体系的**第一块基石**。当一个函数接收参数时，数据从调用方到底是如何传递到函数内部的？这个问题直接决定了：

- 你在函数内修改参数，会不会影响外部的变量？
- 为什么不可变对象（如 `int`、`str`）和可变对象（如 `list`、`dict`）的行为不同？
- 后续学习默认参数、可变参数、参数传递顺序等高级话题时，这些都建立在理解"参数到底传递了什么"的基础上。

在函数知识体系中，本篇属于**参数机制的入口**——先理解"传了什么"，后续才能讨论"怎么传""传多少""按什么顺序传"。

### 1.3 最简示例

先看一个最直观的示例，感受形参与实参的关系：

```python
def double(n):            # n 是形参
    return n * 2


x = 10
result = double(x)        # x 是实参，它的值 10 被传给了形参 n
print(result)             # 输出：20
print(x)                  # 输出：10 —— x 本身没有变
```

运行结果：

```text
20
10
```

关键观察：`x` 的值 `10` 被传入了函数，但 `x` 本身没有变化。这说明 Python 传递的**不是变量本身**，而是**变量的值所引用到的对象**。

---

## 2. 核心内容

### 2.1 形参与实参的六个关键区别

形参和实参不只是"定义时"和"调用时"的区别，它们在 Python 运行时有完全不同的身份和生命周期：

| 维度 | 形参 | 实参 |
|------|------|------|
| **出现位置** | 函数定义时的括号内 | 函数调用时的括号内 |
| **本质** | 局部变量（属于函数内部） | 表达式求值后的对象 |
| **生命周期** | 函数执行期间存在，函数返回后销毁 | 独立于函数，调用前就存在 |
| **数量** | 固定（由函数定义决定） | 可变（每次调用可以不同） |
| **命名来源** | 由函数定义者命名 | 由调用者提供（可以是变量、字面量、表达式等） |
| **可见范围** | 仅在函数体内可见 | 在调用方的作用域内可见 |

通过一个带多个参数的例子来感受这些区别：

```python
def compute_bonus(base_salary, performance_rating, years_of_service):
    """计算年终奖金

    base_salary:       形参——接收基本工资数据
    performance_rating: 形参——接收绩效评分
    years_of_service:   形参——接收工龄数据
    """
    bonus_rate = performance_rating / 10 * (1 + years_of_service * 0.05)
    return base_salary * bonus_rate


# 每次调用，实参可以不同
bonus_a = compute_bonus(10000, 8.5, 3)    # 实参：字面量 10000, 8.5, 3
print(f"员工 A 年终奖：¥{bonus_a:.2f}")

salary = 15000
rating = 9.2
years = 5
bonus_b = compute_bonus(salary, rating, years)  # 实参：变量 salary, rating, years
print(f"员工 B 年终奖：¥{bonus_b:.2f}")

# 实参也可以是表达式
bonus_c = compute_bonus(8000 + 2000, 7 + 1.5, 2 * 2)  # 实参：表达式
print(f"员工 C 年终奖：¥{bonus_c:.2f}")
```

运行结果：

```text
员工 A 年终奖：¥9775.00
员工 B 年终奖：¥17250.00
员工 C 年终奖：¥10200.00
```

实参可以是**字面量**（`10000`、`3`）、**变量**（`salary`、`rating`）、**表达式**（`8000 + 2000`）——任何能求值出一个对象的代码都可以作为实参。Python 在调用函数时，**先对实参表达式求值，然后把求值结果传入函数**。

### 2.2 Python 参数传递的本质：传对象引用

这是 Python 参数机制中最核心的概念，也是最容易混乱的地方。

#### 2.2.1 三种经典传递方式

在编程语言中，参数传递主要有三种经典模式：

**传值（Pass by Value）**：函数拿到的是实参的**副本**。函数内修改参数不影响外部变量。C 语言默认使用这种方式。

**传引用（Pass by Reference）**：函数拿到的是实参变量**本身的引用**。函数内修改参数会直接影响外部变量。C++ 中的 `&` 引用参数、Pascal 的 `var` 参数属于这种。

**传对象引用（Pass by Object Reference）/ 传共享（Pass by Sharing）**：函数拿到的是实参**所引用对象的引用**。函数内能否影响外部变量，取决于对象本身是否可变。Python、Java、JavaScript、Ruby 等都使用这种方式。

#### 2.2.2 Python 的选择：传对象引用

Python 的参数传递既不是传值，也不是传引用，而是第三种模式——**传对象引用**。它的核心机制是：

```text
调用 func(x)
  ↓
1. Python 对实参表达式 x 求值，得到它引用的对象（比如整数 10 或列表 [1, 2, 3]）
2. Python 把"指向这个对象的引用"传递给函数的形参
3. 形参和外部变量现在指向同一个对象
4. 但形参本身是一个独立变量——重新给形参赋值不会影响外部变量
```

用一句话概括：**Python 把实参对象的引用复制了一份传给形参，形参和实参指向同一个对象，但形参和外部变量本身是独立的。**

用图解来理解：

```text
# 对于不可变对象（如 int）
x = 10
def modify(n):
    n = 20       # 形参重新绑定到新对象 20

modify(x)
# 执行过程：
# 调用前：  x ──→ [10]
# 调用时：  n ──→ [10]  ← x 也指向它
# n = 20：  n ──→ [20]  ← n 重新绑定了，x 仍然指向 [10]
# 调用后：  x ──→ [10]  ← 不受影响


# 对于可变对象（如 list）
x = [1, 2, 3]
def modify(lst):
    lst.append(4)  # 通过引用修改对象内部状态

modify(x)
# 执行过程：
# 调用前：  x ──→ [1, 2, 3]
# 调用时：  lst ──→ [1, 2, 3]  ← x 指向同一个对象
# lst.append(4)：  lst ──→ [1, 2, 3, 4]  ← 通过引用修改了对象内容，x 也指向它
# 调用后：  x ──→ [1, 2, 3, 4]  ← 受到了影响！
```

#### 2.2.3 关键验证

用代码验证 Python 的传递机制：

```python
def try_modify_int(n):
    """尝试'修改'一个整数参数"""
    print(f"  进入函数时 n 的 id：{id(n)}")
    n = 999
    print(f"  重新赋值后 n 的 id：{id(n)}")


x = 42
print(f"调用前 x 的 id：{id(x)}")
try_modify_int(x)
print(f"调用后 x 的值：{x}，id：{id(x)}")
```

运行结果：

```text
调用前 x 的 id：4373494512
  进入函数时 n 的 id：4373494512
  重新赋值后 n 的 id：4406112848
调用后 x 的值：42，id：4373494512
```

分析：`n` 进入函数时和 `x` 指向同一个对象（id 相同）。`n = 999` 这行代码并没有修改原来的整数对象，而是让 `n` 指向了一个新对象 `999`（id 变了）。`x` 始终指向原始的 `42`，不受影响。

```python
def try_modify_list(lst):
    """尝试'修改'一个列表参数"""
    print(f"  进入函数时 lst 的 id：{id(lst)}")
    lst.append(4)
    print(f"  append 后 lst 的 id：{id(lst)} —— 对象本身没变")
    lst = ["全新的列表"]
    print(f"  重新赋值后 lst 的 id：{id(lst)} —— 变成了新对象")


data = [1, 2, 3]
print(f"调用前 data 的 id：{id(data)}，内容：{data}")
try_modify_list(data)
print(f"调用后 data 的 id：{id(data)}，内容：{data}")
```

运行结果：

```text
调用前 data 的 id：4375012224，内容：[1, 2, 3]
  进入函数时 lst 的 id：4375012224
  append 后 lst 的 id：4375012224 —— 对象本身没变
  重新赋值后 lst 的 id：4375127232 —— 变成了新对象
调用后 data 的 id：4375012224，内容：[1, 2, 3, 4]
```

分析：`lst.append(4)` 通过引用**修改了对象的内容**——这个修改对外部可见，因为 `data` 和 `lst` 指向同一个列表对象（id 不变）。但 `lst = ["全新的列表"]` 让 `lst` 指向了一个新对象（id 变了），这只是改变了形参这个局部变量，对外部 `data` 没影响。

### 2.3 不可变对象 vs 可变对象：行为差异的本质

理解了 Python 传递的是**对象引用**之后，不可变和可变对象在参数传递中的不同表现就很容易解释了。

#### 2.3.1 为什么不可变对象"像传值"？

不可变对象（`int`、`float`、`str`、`tuple`、`frozenset`、`bool`、`None`）的共同特性是：**对象一旦创建，其内容就不能被修改**。

```python
def add_prefix(text, prefix="[重要] "):
    text = prefix + text    # 字符串拼接创建了一个新字符串对象
    return text

msg = "你好，欢迎参加会议"
new_msg = add_prefix(msg)
print(msg)       # 输出：你好，欢迎参加会议 —— 原字符串没变
print(new_msg)   # 输出：[重要] 你好，欢迎参加会议
```

`text = prefix + text` 这行代码对字符串进行拼接，由于字符串是不可变对象，拼接操作**创建了一个全新的字符串对象**，`text` 被重新绑定到了这个新对象上。原始的 `msg` 引用的字符串毫无变化。

**核心结论**：对于不可变对象，函数内**任何**试图"修改"参数的操作，实际上都是创建新对象并重新绑定形参——对外部变量不会有任何影响。这看起来像"传值"，但本质是"传对象引用 + 对象不可变"的组合效果。

#### 2.3.2 为什么可变对象"像传引用"？

可变对象（`list`、`dict`、`set`、自定义类的实例）的内容可以在原对象上直接修改：

```python
def add_score(student_scores, subject, score):
    """将新的成绩添加到学生成绩单中"""
    student_scores[subject] = score    # 修改 dict 的内容——原对象被改变了


grades = {"语文": 85, "数学": 92}
print(f"修改前：{grades}")

add_score(grades, "英语", 88)
print(f"修改后：{grades}")  # 外部变量也被影响了！
```

运行结果：

```text
修改前：{'语文': 85, '数学': 92}
修改后：{'语文': 85, '数学': 92, '英语': 88}
```

`student_scores[subject] = score` 是**通过引用修改了字典对象的内部内容**，并没有创建新字典。因为 `grades` 和 `student_scores` 指向的是同一个字典对象，所以修改对外部可见。

**核心结论**：对于可变对象，函数内通过引用**修改对象内容**的操作会影响到外部变量。但这仍然不是"传引用"——因为对形参本身的重新赋值不会影响外部：

```python
def replace_list(lst):
    lst = [4, 5, 6]      # 重新赋值形参——不影响外部


data = [1, 2, 3]
replace_list(data)
print(data)  # 输出：[1, 2, 3] —— 没变！
```

如果是真正的传引用，`data` 应该变成 `[4, 5, 6]`。但 Python 中 `lst = [4, 5, 6]` 只是让形参重新绑定，外部 `data` 保持不变。

#### 2.3.3 行为差异对照表

| 操作 | 对不可变对象 (如 int) | 对可变对象 (如 list) |
|------|---------------------|---------------------|
| 重新赋值形参 `param = 新值` | 外部不受影响 | 外部不受影响 |
| 修改对象内容 `param[key] = val` | 不可变对象不支持此操作 | **外部受影响** |
| 调用对象方法 `param.method()` | 不修改原对象（返回新对象） | 可能修改原对象（取决于方法） |
| 对形参进行运算 `param + 1` | 返回新对象，外部不受影响 | N/A |

```python
# 完整的行为对比
def demonstrate_behavior(lst_param, int_param, dict_param):
    # 操作1：重新赋值——都不影响外部
    lst_param = [999]
    int_param = 999

    # 操作2：修改内容——只有可变对象才可能影响外部
    dict_param["new_key"] = "new_value"


my_list = [1, 2, 3]
my_int = 42
my_dict = {"a": 1}

demonstrate_behavior(my_list, my_int, my_dict)

print(f"my_list:  {my_list}")   # 输出：[1, 2, 3] —— 重新赋值不影响
print(f"my_int:   {my_int}")    # 输出：42 —— 重新赋值不影响
print(f"my_dict:  {my_dict}")   # 输出：{'a': 1, 'new_key': 'new_value'} —— 内容修改影响了！
```

### 2.4 形参与实参的命名关系

#### 2.4.1 形参名和实参名是独立的

一个常见的误解是认为形参和实参必须同名。实际上，**形参是函数内部的局部变量，它的名字和外部变量没有任何关联**。

```python
def process_data(data):        # 形参名叫 data
    data = data.upper()
    return data

# 调用方式一：实参变量名和形参不同名
text = "hello"
result = process_data(text)    # text 被传给了形参 data
print(result)  # 输出：HELLO

# 调用方式二：实参变量名和形参同名
data = "world"                 # 这个 data 是模块级变量
result = process_data(data)    # 传入的是模块级 data 的值，和形参 data 是两个变量
print(f"模块级 data: {data}")  # 输出：world —— 模块级 data 没变
print(f"返回值: {result}")     # 输出：WORLD
```

即使外部变量和形参**恰好同名**，它们也是两个不同的变量——一个属于模块作用域，一个属于函数局部作用域。同名的唯一效果是让人容易混淆，Python 本身不认为它们有任何关联。

#### 2.4.2 数量必须匹配（基本情况下）

在没有默认参数、可变参数等高级特性的基本情况下，**调用时传入的实参数量必须等于定义时的形参数量**。

```python
def register_user(name, email, age):
    print(f"注册用户：{name}，邮箱：{email}，年龄：{age}")


# ✅ 数量匹配：3 个形参，3 个实参
register_user("张三", "zhangsan@example.com", 25)

# ❌ 数量不匹配
# register_user("李四")                     # TypeError: 缺少 2 个参数
# register_user("李四", "lisi@example.com")  # TypeError: 缺少 1 个参数
# register_user("李四", "lisi@example.com", 25, "extra")  # TypeError: 多了 1 个参数
```

### 2.5 参数传递的完整生命周期

把一次函数调用中参数从"出生"到"消亡"的全过程串起来：

```text
1. 调用 execute_command("backup", dry_run=True)
   ↓
2. Python 解释器：
   a. 对实参表达式求值 → "backup"（str 对象）、True（bool 对象）
   b. 将这两个对象的引用传递给形参 name 和 dry_run
   c. 创建新的局部命名空间
   d. 将 name 绑定到 str 对象 "backup"
   e. 将 dry_run 绑定到 bool 对象 True
   ↓
3. 函数体执行：
   - 所有对 name 和 dry_run 的读写，都操作的是步骤 2 绑定的对象
   - name.upper() → 创建新 str 对象，不影响原始 "backup"
   - dry_run = False → 将 dry_run 重新绑定到 False，不影响外部传入 True
   - 如果参数是可变对象 list.append(x) → 修改的是原对象，外部可见
   ↓
4. 函数返回：
   - 局部命名空间被销毁
   - name 和 dry_run 这两个变量名不再存在
   - 但它们指向过的对象仍然存在（只要外部还有其他引用）
```

理解这个生命周期后，关于"函数内外关系"的很多疑惑就自然消散了。

---

## 3. 实践示例

### 3.1 参数传递的场景化演示

下面用一个"数据处理管道"的例子来综合展示不同对象类型在参数传递中的行为：

```python
def process_data_series(raw_data, metadata, config):
    """
    模拟一个数据处理流程

    raw_data: 输入数据列表（可变对象——会被修改）
    metadata: 元数据字典（可变对象——会被修改）
    config:   配置元组（不可变对象——不会被修改）
    """
    print("=== 处理开始 ===")
    print(f"  raw_data: {raw_data}")
    print(f"  metadata: {metadata}")
    print(f"  config:   {config}")

    # 修改可变对象——这会影响外部变量
    raw_data.append(sum(raw_data))      # 追加总和
    metadata["processed"] = True        # 标记已处理
    metadata["count"] = len(raw_data)   # 记录处理条数

    # "修改"不可变对象——这只改变了形参的绑定
    config = config + ("batch_mode",)   # 创建新元组，形参重新绑定
    print(f"  config 在函数内变成了：{config}")   # 但外部不受影响

    # 重新赋值形参——不影响外部
    raw_data = []                       # 形参重新绑定，外部变量不受影响

    print("=== 处理结束 ===")


# 调用方
numbers = [10, 20, 30]
info = {"source": "sensor-a", "unit": "celsius"}
settings = ("sampling_rate=1s", "precision=high")

print("调用前：")
print(f"  numbers:  {numbers}")
print(f"  info:     {info}")
print(f"  settings: {settings}")
print()

process_data_series(numbers, info, settings)

print()
print("调用后：")
print(f"  numbers:  {numbers}")   # 列表被 append 了，但重新赋值 raw_data = [] 没影响
print(f"  info:     {info}")      # 字典被修改了
print(f"  settings: {settings}")  # 元组没变——config 的新元组是局部的
```

运行结果：

```text
调用前：
  numbers:  [10, 20, 30]
  info:     {'source': 'sensor-a', 'unit': 'celsius'}
  settings: ('sampling_rate=1s', 'precision=high')

=== 处理开始 ===
  raw_data: [10, 20, 30]
  metadata: {'source': 'sensor-a', 'unit': 'celsius'}
  config:   ('sampling_rate=1s', 'precision=high')
  config 在函数内变成了：('sampling_rate=1s', 'precision=high', 'batch_mode')
=== 处理结束 ===

调用后：
  numbers:  [10, 20, 30, 60]
  info:     {'source': 'sensor-a', 'unit': 'celsius', 'processed': True, 'count': 4}
  settings: ('sampling_rate=1s', 'precision=high')
```

这个例子的关键观察：

- `numbers`：`raw_data.append()` 修改了列表内容（外部可见），但 `raw_data = []` 只是让形参另有所指（外部不受影响）
- `info`：`metadata["processed"] = True` 修改了字典内容（外部可见）
- `settings`：`config = config + (...)` 创建了新元组，形参重新绑定了，外部原封不动

### 3.2 如何避免意外修改外部数据

了解参数传递机制后，当你确实**不希望**函数修改外部传入的可变对象时，有两种保护策略：

**策略一：传入副本**

```python
def analyze_scores(scores):
    """分析成绩——内部可能排序等操作"""
    scores.sort()          # 会修改原列表
    avg = sum(scores) / len(scores)
    return {"average": avg, "lowest": scores[0], "highest": scores[-1]}


original = [85, 92, 78, 95, 88]
backup = original.copy()  # 传入副本，保护原数据
result = analyze_scores(backup)

print(f"原始数据：{original}")  # [85, 92, 78, 95, 88] —— 没被修改
print(f"分析结果：{result}")
```

**策略二：函数内部创建副本**

```python
def analyze_scores_safe(scores):
    """安全地分析成绩——内部操作不影响外部"""
    scores = scores.copy()  # 先用副本，后续操作不影响外部
    scores.sort()
    avg = sum(scores) / len(scores)
    return {"average": avg, "lowest": scores[0], "highest": scores[-1]}


original = [85, 92, 78, 95, 88]
result = analyze_scores_safe(original)

print(f"原始数据：{original}")  # [85, 92, 78, 95, 88] —— 没被修改
print(f"分析结果：{result}")
```

策略二更优——它把保护逻辑封装在函数内部，调用者不需要关心"要不要传副本"这件事。

---

## 4. 常见误区与边界

**误区一：Python 是传值/传引用**

这是最常见的误解。有人看到不可变对象的行为说"Python 是传值"，又看到可变对象说"Python 是传引用"。实际上 Python 既不是传值也不是传引用，而是**传对象引用**。"传值"意味着有拷贝发生——Python 不拷贝对象。"传引用"意味着形参是外部变量的别名——Python 中重新赋值形参不影响外部。

做一个快速的自测来检验你的理解：

```python
def test(a, b):
    a = a + 1          # 操作一
    b.append(1)        # 操作二

x = 10
y = [10]
test(x, y)
print(x)  # 输出：10  （没变——如果是传引用，应该变成 11）
print(y)  # 输出：[10, 1] （变了——如果是传值，应该还是 [10]）
```

如果 Python 是传值，`y` 不应该变——但它变了。如果 Python 是传引用，`x` 应该变——但它没变。这个自相矛盾的结果恰恰说明了 Python 是第三种模式：传对象引用。

**误区二：`int` 和 `list` 的区别是因为传递方式不同**

`int` 和 `list` 使用的传递方式完全相同——都是传对象引用。行为差异的根源在于对象本身是否可变，而非传递方式不同。

为了彻底理解这一点，试着用同一种方式操作它们：

```python
def operate_on_param(param):
    # 对任何类型的 param 都做同一件事：重新赋值
    param = None


x = 42
y = [1, 2, 3]
operate_on_param(x)
operate_on_param(y)
print(x)  # 输出：42 —— 没变
print(y)  # 输出：[1, 2, 3] —— 也没变！因为重新赋值不影响外部
```

当操作是"重新赋值"时，`int` 和 `list` 的表现完全一致——都不影响外部。行为差异只出现在"修改对象内部内容"这个操作上，而 `int` 恰好不支持这种操作。

**误区三：CPython 的小整数和短字符串复用机制意味着参数传递有特殊处理**

CPython 对小整数（-5 到 256）和短字符串有对象复用机制，这有时会让人误认为参数传递有特殊行为：

```python
def check_identity(n):
    print(f"n is 100: {n is 100}")   # 小整数复用
    print(f"n is 1000: {n is 1000}") # 大整数不复用


check_identity(100)
# n is 100: True —— 100 是缓存的同一个对象
# n is 1000: True —— 也是 True！因为引用被传递了，指向同一个对象

a = 1000
b = 1000
print(a is b)  # 可能是 False —— 两个独立的 1000 字面量可能创建不同对象
```

关键在于区分**变量赋值时的复用**和**参数传递时的引用**。参数传递永远是把对象引用传进去——与这个对象是否被复用无关。`id()` 应作为辅助验证工具而不是理论依据。

**误区四：形参名必须和实参变量名一致**

形参名和实参名称是两个独立的命名空间——即使同名，它们也是不同的变量。给形参和实参用相同的名字是合法的，但容易造成混淆，特别是对于初学者。

用作用域的观点来看：形参活在函数内部的局部作用域里，实参变量活在调用方的作用域里。两个作用域隔离后，同名的两个变量只不过碰巧指向同一个对象（且仅当对象被传入时），修改形参的绑定不影响实参的绑定。

**误区五：只要不 `return`，函数内修改外部就不可见**

函数是否影响外部与有没有 `return` 无关：可变对象的内部修改在函数返回后仍然可见，即使函数不返回那个对象。`return` 控制的是"有没有数据传递出来"，而可变对象的修改是"在原对象上留下了痕迹"。

```python
def append_item_no_return(lst, item):
    lst.append(item)   # 只修改，不返回——但外部仍然能感知到


data = [1, 2, 3]
result = append_item_no_return(data, 4)
print(data)    # 输出：[1, 2, 3, 4] —— 外部被影响了
print(result)  # 输出：None —— 函数确实没有返回有意义的值
```

**误区六：将默认参数中的可变对象行为归因于传对象引用**

可变默认参数（如 `def func(lst=[])`）产生的"共享状态"陷阱和传对象引用是两个不同的问题。可变默认参数的问题源自"默认值在函数定义时求值且只求值一次"，而非参数传递机制。这两个概念常常被混为一谈，但需要分开理解。

---

## 5. 总结

本文围绕 Python 函数参数传递的本质展开，主要介绍了以下内容：

- 形参是函数定义时的占位变量（局部变量），实参是函数调用时传入的具体数据
- 形参和实参在位置、本质、生命周期、数量、命名来源、可见范围六个方面有明确区别
- Python 的参数传递既不是传值也不是传引用，而是**传对象引用**——将实参对象的引用复制给形参
- 不可变对象和可变对象在参数传递中的行为差异，根源于对象本身是否可修改，而非传递方式不同
- 重新赋值形参永远不影响外部变量；通过引用修改可变对象的内容，会影响外部变量
- 保护数据不被意外修改的策略：传入副本或函数内部创建副本