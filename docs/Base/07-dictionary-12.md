---
group:
  title: 【07】字典深度剖析
  order: 7
order: 12
title: 列表 vs 元组选择指南
nav:
  title: Python基础
  order: 1
---

# 字典推导式与性能优化

## 1. 介绍

### 1.1 从"创建方式之一"到"性能主角"

在《字典创建方式》一篇中，字典推导式（dict comprehension）被作为 12 种创建方式之一做了简要介绍——`{k: v for k, v in items if condition}` 的基本语法。那篇的目标是"知道有这个方法"，本篇的目标是"能用推导式写出高性能、高可读性的字典处理代码，并知道什么时候不该用它"。

字典推导式在 Python 中的地位远不止一种创建语法。它底层使用专用的 `BUILD_MAP` 字节码指令直接构建字典，省去了循环中每次 `d[k] = v` 的方法调用开销和字典 resizing 的抖动。理解这一点是做字典性能优化的基础——在数据转换类操作中，推导式通常是最快的纯 Python 写法。

```python
# 同一个任务：把列表转成 {元素: 元素长度}
words = ["apple", "banana", "cherry", "date", "elderberry"]

# 方式一：推导式（最紧凑，底层 BUILD_MAP 直接构建）
result1 = {w: len(w) for w in words}

# 方式二：dict() + 生成器表达式
result2 = dict((w, len(w)) for w in words)

# 方式三：循环 + d[k] = v
result3 = {}
for w in words:
    result3[w] = len(w)

# 三种写法结果相同
print(result1 == result2 == result3)   # 输出：True
# 但性能不同——推导式最快，循环最慢，dict() 居中。本篇会量化这个差异。
```

本篇的核心脉络：先穷尽推导式的语法能力（不限于基础写法），再系统对比每种替代方案的性能差异及其底层原因，最后给出在不同场景下的选择决策树。

### 1.2 字典推导式的语法骨架

事务所限，先确立完整语法：

```
{键表达式: 值表达式 for 变量 in 可迭代对象 [if 条件]}
{键表达式: 值表达式 for 变量1 in 可迭代对象1 for 变量2 in 可迭代对象2 [if 条件]}
```

关键特点：

- 用花括号 `{}` 包裹（区别于列表推导式的 `[]` 和集合推导式的 `{}`，但花括号内带冒号 `:` 才被解析为字典推导式）。
- 每次迭代产生一个键值对，重复键遵循"后者覆盖前者"。
- `if` 子句可选，用于过滤；不支持下 `elif` 或 `else` 分支（复杂条件放入表达式或用 `if-else` 三元）。
- Python 3.8+ 支持海象运算符 `:=` 在条件或表达式中复用中间计算结果。

```python
# 最简形式
squares = {x: x**2 for x in range(5)}
print(squares)   # 输出：{0: 0, 1: 1, 2: 4, 3: 9, 4: 16}

# 带过滤
even_squares = {x: x**2 for x in range(10) if x % 2 == 0}
print(even_squares)   # 输出：{0: 0, 2: 4, 4: 16, 6: 36, 8: 64}

# 海象运算符（3.8+）：复用计算中间结果
fruits = ["apple", "banana", "cherry"]
reversed_fruits = {f: r for f in fruits if (r := f[::-1]) != f}
print(reversed_fruits)   # 输出：{'apple': 'elppa', 'banana': 'ananab', 'cherry': 'yrrehc'}
# 这里 r := f[::-1] 计算一次，既用于 if 判断又用于值表达式，避免了算两遍 f[::-1]
```

### 1.3 推导式与函数调用的协作

推导式可以在键表达式和值表达式中调用任何函数，这赋予了它极大的表达力：

```python
# 值与键都可以是函数调用的结果
import hashlib

passwords = ["secret123", "admin", "hello"]
# 用户名 → 密码的 SHA256 哈希，同时过滤空密码
hashed = {p: hashlib.sha256(p.encode()).hexdigest() for p in passwords if p}
print({k: v[:16] + "..." for k, v in hashed.items()})
# 输出：{'secret123': 'e2fc714c4727ee93...', 'admin': '8c6976e5b5410415...', ...}
```

函数调用在推导式内部和外部的选择会影响性能——如果函数调用昂贵且只依赖原始数据（不依赖计算结果），应在推导式外预先计算；如果函数依赖当前迭代的变量，则在内部调用。

## 2. 核心内容

### 2.1 基础推导式：五种经典模式

除了最简单的 `{k: f(v) for v in seq}`，有五种模式占据了字典推导式 90% 以上的实际用例。

**模式一：从已有字典筛选**

```python
data = {"a": 10, "b": -5, "c": 0, "d": 7, "e": -2}

# 值大于 0 的项
positive = {k: v for k, v in data.items() if v > 0}
print(positive)   # 输出：{'a': 10, 'd': 7}
```

`if` 可以作用于键也可以作用于值，可以先检查键再检查值：

```python
# 键以特定前缀开头 且 值是某范围
config = {"db_host": "localhost", "db_port": 5432,
          "cache_host": "redis", "cache_port": 6379, "debug": True}

db_config = {k: v for k, v in config.items()
             if k.startswith("db_")}
print(db_config)   # 输出：{'db_host': 'localhost', 'db_port': 5432}
```

**模式二：从已有字典转换**

```python
# 值统一做某种变形，键保持不变
prices = {"apple": 5.5, "banana": 3.2, "cherry": 8.0}
# 所有价格加 10% 税
taxed = {k: round(v * 1.1, 2) for k, v in prices.items()}
print(taxed)   # 输出：{'apple': 6.05, 'banana': 3.52, 'cherry': 8.8}
```

键也可变，且键表达式可与值表达式相关：

```python
# 键和值都变换：产品名 → 产品名大写 + 价格标签
labels = {f"[{k.upper()}]": f"¥{v}" for k, v in prices.items()}
print(labels)   # 输出：{'[APPLE]': '¥5.5', '[BANANA]': '¥3.2', '[CHERRY]': '¥8.0'}
```

**模式三：从序列构建字典**

```python
names = ["Alice", "Bob", "Carol", "David"]

# 名字 → 名字长度
name_len = {n: len(n) for n in names}
print(name_len)   # 输出：{'Alice': 5, 'Bob': 3, 'Carol': 5, 'David': 5}

# 配合 enumerate：下标 → 值
indexed = {i: n for i, n in enumerate(names)}
print(indexed)    # 输出：{0: 'Alice', 1: 'Bob', 2: 'Carol', 3: 'David'}
```

**模式四：翻转字典（键值互换）**

```python
code_to_name = {200: "OK", 404: "Not Found", 500: "Internal Server Error"}
# 翻转：状态描述 → 状态码
name_to_code = {v: k for k, v in code_to_name.items()}
print(name_to_code)   # 输出：{'OK': 200, 'Not Found': 404, 'Internal Server Error': 500}
```

翻转的致命限制：值必须唯一且可哈希。值重复时后者覆盖前者（静默），值不可哈希（如 list）时直接 TypeError。

```python
# 翻转时值重复：后者覆盖，静默丢数据
grades = {"Alice": 90, "Bob": 85, "Carol": 90}
flipped = {v: k for k, v in grades.items()}
print(flipped)   # 输出：{90: 'Carol', 85: 'Bob'}   ← Alice 被覆盖了！
# 因为 "Alice" 和 "Carol" 的值都是 90，后出现的 "Carol" 覆盖了先出现的 "Alice"
```

如果需要翻转后保留所有值（一对多），应改用 list 聚合而非简单翻转：

```python
# 正确：翻转后用 list 聚合重复值
from collections import defaultdict
flipped_multi = defaultdict(list)
for k, v in grades.items():
    flipped_multi[v].append(k)
print(dict(flipped_multi))   # 输出：{90: ['Alice', 'Carol'], 85: ['Bob']}
```

**模式五：两个序列按条件配对**

```python
products = ["laptop", "mouse", "keyboard", "monitor"]
prices = [5999, 199, 499, 1499]

# 只保留价格低于 1000 的产品
affordable = {p: pr for p, pr in zip(products, prices) if pr < 1000}
print(affordable)   # 输出：{'mouse': 199, 'keyboard': 499}
```

这五种模式覆盖了绝大部分使用场景。记住它们比记住推导式语法本身更有价值——拿到一个问题后，先匹配模式，再套语法。

### 2.2 嵌套推导式：双层 for

字典推导式支持多个 `for` 子句，语法是 `{k: v for x in xs for y in ys if cond}`。执行顺序从左到右：先遍历第一个 `for`，再在其中遍历第二个 `for`（等价于嵌套循环）。

```python
# 生成 3×3 棋盘坐标 → 格子 ID
board = {(x, y): f"cell-{x}-{y}" for x in range(3) for y in range(3)}
print(board[(0, 0)])   # 输出：cell-0-0
print(board[(2, 1)])   # 输出：cell-2-1
print(len(board))      # 输出：9
```

带条件的双层推导式：

```python
# 生成两个列表的笛卡尔积中，只有长度相等的组合
words1 = ["a", "ab", "abc"]
words2 = ["x", "yz", "pqr"]

pairs = {(w1, w2): len(w1) for w1 in words1
                           for w2 in words2
                           if len(w1) == len(w2)}
print(pairs)
# 输出：{('a', 'x'): 1, ('ab', 'yz'): 2, ('abc', 'pqr'): 3}
```

嵌套推导式的易错点是可读性——两层 `for` 加 `if` 之后，"哪个 for 先执行"需要读者在脑中模拟。经验法则：**两层可以，三层就是坏味道**。超过两层嵌套的推导式应改用显式循环：

```python
# ❌ 不推荐：三层嵌套推导式 —— 需要注释才能读懂
# matrix = {(i, j, k): i*j*k for i in range(2) for j in range(3) for k in range(4)}

# ✅ 推荐：三层嵌套用显式循环
matrix = {}
for i in range(2):
    for j in range(3):
        for k in range(4):
            matrix[(i, j, k)] = i * j * k
```

### 2.3 条件表达式与多条件过滤

`if` 子句用于过滤"哪些项参与推导"。这里的 `if` 不支持 `elif`/`else`。但你可以用以下方式表达复杂条件：

**方式一：在 if 中用 and / or / not 组合条件**

```python
scores = {"Alice": 95, "Bob": 62, "Carol": 78, "David": 88, "Eve": 55}

# 多重条件：值在 [60,90) 之间 且 名字不以 'D' 开头
qualified = {k: v for k, v in scores.items()
             if v >= 60 and v < 90 and not k.startswith("D")}
print(qualified)   # 输出：{'Bob': 62, 'Carol': 78}
```

**方式二：在键或值表达式中用三元表达式**

`if-else` 三元不能放在 `if` 过滤子句的位置（那里只接受 `if` 不带 `else`），但可以嵌入键或值表达式：

```python
# 值表达式用三元：及格标 "PASS"，不及格标 "FAIL"
grade_labels = {k: ("PASS" if v >= 60 else "FAIL") for k, v in scores.items()}
print(grade_labels)
# 输出：{'Alice': 'PASS', 'Bob': 'PASS', 'Carol': 'PASS', 'David': 'PASS', 'Eve': 'FAIL'}
```

```python
# 多分支三元（可读性不及 if-elif，但在推导式中只能这么写）
def grade_level(score):
    if score >= 90: return "A"
    elif score >= 75: return "B"
    elif score >= 60: return "C"
    return "D"

levels = {k: grade_level(v) for k, v in scores.items()}
print(levels)
# 输出：{'Alice': 'A', 'Bob': 'C', 'Carol': 'B', 'David': 'B', 'Eve': 'D'}
```

还有一种常见做法是将复杂映射逻辑封装为函数，让推导式只调用它，保持推导式本身干净。

**方式三：海象运算符复用中间结果（3.8+）**

```python
# 场景：只保留"反转后和原串不同"的字符串，同时记录反转结果
words = ["level", "python", "radar", "world", "deified"]

# 不用海象：f(w) 要在 if 和 值表达式中各算一次
# bad = {w: w[::-1] for w in words if w[::-1] != w}

# 用海象：只算一次 w[::-1]，用于判断也用于值
palindromes_info = {w: rev for w in words if (rev := w[::-1]) != w}
print(palindromes_info)   # 输出：{'python': 'nohtyp', 'world': 'dlrow'}
```

注意这里 `(rev := w[::-1])` 需要括号包裹，因为海象运算符的优先级较低。不用括号会被解析为 `if rev := (w[::-1] != w)`，语义错误。

海象运算符在值表达式中也能复用：

```python
# 值表达式中的计算结果，在 if 中也能引用
# 注意：值表达式在 if 之后求值（推导式执行顺序更微妙）
# 安全用法：只在值表达式中用 :=，if 引用

# 例如：把列表元素平方后，只保留平方值 > 10 的项
nums = [2, 3, 4, 5]
power_map = {n: sq for n in nums if (sq := n ** 2) > 10}
print(power_map)   # 输出：{4: 16, 5: 25}
```

### 2.4 推导式中处理键冲突的几种策略

推导式中出现重复键时，**后者覆盖前者**，不报错。这在某些场景是期望行为（"后出现的优先级高"），在另一些场景是 bug。

```python
# 后者覆盖前者：从 HTTP 头列表中取最后一个值
headers = [("Host", "a.com"), ("Accept", "json"), ("Host", "b.com")]
host_map = {k: v for k, v in headers}
print(host_map)   # 输出：{'Host': 'b.com', 'Accept': 'json'}   ← b.com 覆盖 a.com
```

若需要"保留第一个值"而非"后覆盖前"：

```python
# 技巧：反转原序列再建推导式（此时后覆盖前 实际保留了原序列的第一个）
host_map_first = {k: v for k, v in reversed(headers)}
print(host_map_first)   # 输出：{'Host': 'a.com', 'Accept': 'json'}   ← a.com 被保留
```

若需要"冲突时报错或报警"：

```python
# 推导式内无法优雅地处理冲突报告，应用显式循环
seen = {}
for k, v in headers:
    if k in seen:
        print(f"警告：键 '{k}' 重复，旧值={seen[k]}，新值={v}")
    seen[k] = v
print(seen)
# 输出：
# 警告：键 'Host' 重复，旧值=a.com，新值=b.com
# {'Host': 'b.com', 'Accept': 'json'}
```

若需要"把冲突的值聚合成列表"：

```python
# 又回到 defaultdict 模式，推导式做不到，用循环
from collections import defaultdict
multi = defaultdict(list)
for k, v in headers:
    multi[k].append(v)
print(dict(multi))   # 输出：{'Host': ['a.com', 'b.com'], 'Accept': ['json']}
```

这引出一条重要经验：**推导式是"一个键对应一个值"的模型，涉及一对多、冲突处理、状态累积等需求时，循环更合适**。

### 2.5 推导式与其他字典创建方式的场景分工

前面在创建篇已经把每种方式适合什么场景讲清楚了，这里聚焦于推导式相对于其他方式的**性能与可读性取舍**。

```
需求 → 推荐方式 → 原因
──────────────────────────────
从序列 K/V 直接配对         → dict(zip(keys, values))       → 最简洁，C 层直接构建，最快
从已有字典筛选              → {k:v for k,v in d.items() if...} → 推导式最自然
从已有字典转换键或值        → {f(k): g(v) for k,v in ...}    → 推导式最直接
从序列构建（需计算键或值）  → {calc_key(x): calc_val(x) for x in seq} → 推导式的本职
批量同默认值               → dict.fromkeys(keys, val)        → 语义清晰，一次调用完成
合并多源                   → {**d1, **d2} 或 d1 | d2          → 语法更短，不依赖推导式
复杂逻辑/多分支/状态累积   → 显式 for 循环                  → 推导式力不从心
```

以"从两个序列配对"为例，详细对比：

```python
keys = [str(i) for i in range(1000)]
vals = list(range(1000))

# 方式一：dict(zip(...)) — 最简洁 + 最快
d1 = dict(zip(keys, vals))

# 方式二：推导式 — 稍慢但允许附加条件
d2 = {k: v for k, v in zip(keys, vals)}

# 方式三：循环 — 最慢，但可嵌入复杂逻辑
d3 = {}
for k, v in zip(keys, vals):
    d3[k] = v
```

三者在"无附加条件"场景下的性能顺序：`dict(zip(...))` > 推导式 > 循环。`dict(zip(...))` 最快是因为 `zip` 返回迭代器、`dict()` 构造函数直接 C 层遍历并插入，无需 Python 层的推导式字节码循环。但这个差异在 1000 个元素时也仅约 10%~20%，远不如"哪个写法更好读"重要。

```python
import timeit

# 在 10000 个元素的规模下做基准（演示差异方向，非精密测量）
setup = "keys = [str(i) for i in range(10000)]; vals = list(range(10000))"
t_zip = timeit.timeit("dict(zip(keys, vals))", setup, number=10000)
t_comp = timeit.timeit("{k:v for k, v in zip(keys, vals)}", setup, number=10000)
t_loop = timeit.timeit(
    "d={}; [d.__setitem__(k, v) for k, v in zip(keys, vals)]",
    setup, number=10000
)
print(f"dict(zip): {t_zip:.3f}s")
print(f"推导式:    {t_comp:.3f}s")
print(f"循环:      {t_loop:.3f}s")
# 趋势：dict(zip) 最快，推导式次之，循环最慢（差异约 10%~40%）
```

这个对比更多是建立直觉，而非让你在每次写代码时都追求极致——记住"对的路用对的方法，性能往往也最不差"。

### 2.6 推导式与 genexpr + dict() 的性能细节

`dict((k, v) for k, v in items)` 和 `{k: v for k, v in items}` 在语义上等价，但底层路径不同：

- 推导式 `{k: v for ...}` 使用专用字节码 `BUILD_MAP` + `MAP_ADD`，直接在 C 层构建字典。
- `dict(genexpr)` 先生成生成器对象，再传入 `dict()` 构造函数——多了一层生成器对象的创建和逐元素的 Python → C 调度。

```python
import dis

# 推导式：BUILD_MAP + MAP_ADD 专用字节码
print("=== 推导式字节码 ===")
dis.dis(compile("{k: v for k, v in [('a', 1)]}", "<s>", "eval"))

print("\n=== dict(genexpr) 字节码 ===")
dis.dis(compile("dict((k, v) for k, v in [('a', 1)]))", "<s>", "eval"))
```

推导式的字节码路径更短，这意味着**推导式始终比 `dict(genexpr)` 略快**。在实际项目中，这个差异很小（通常 < 10%），但如果在百万级热循环中，推导式是更优选择。

```python
# 微基准：推导式 vs dict(genexpr)
setup = "pairs = [(i, i*2) for i in range(1000)]"
t1 = timeit.timeit("{k: v for k, v in pairs}", setup, number=100000)
t2 = timeit.timeit("dict((k, v) for k, v in pairs)", setup, number=100000)
print(f"推导式:     {t1:.3f}s")
print(f"dict(gen): {t2:.3f}s")
# 趋势：推导式略快（差异通常 5%~15%）
```

不过 `dict(genexpr)` 有一个不可替代的场景——当键值对序列已经以生成器的形式存在（比如来自某个函数调用、map/filter 链），你只需要包一层 `dict()`。此时没必要再为推导式拆开重写：

```python
# 如果已经有了一个生成键值对的生成器，dict() 更自然
def read_rows():
    """模拟：从 CSV 逐行读，每行产生 (id, name)"""
    for i in range(1000):
        yield (i, f"user-{i}")

# ✅ 推荐：已有的生成器直接喂 dict()
users = dict(read_rows())

# ❌ 不推荐：多此一举写成推导式
# users = {i: name for i, name in read_rows()}
# 这里推导式并没更好（生成器已产出二元组，dict() 直接接收即可）
```

### 2.7 推导式与 map/filter 组合的对比

在函数式风格中，很多人会用 `map` + `filter` 搭配 `dict()` 完成同样的转换。推导式和函数式风格各有拥趸，本篇不讨论审美偏好，只列事实差异：

```python
words = ["apple", "", "banana", "", "cherry"]

# 推导式：一个表达式完成过滤 + 转换
result1 = {w: len(w) for w in words if w}

# 函数式：map + filter + dict
result2 = dict(map(lambda w: (w, len(w)), filter(None, words)))

print(result1 == result2)   # 输出：True
```

两者的关键差异：

| 维度             | 推导式                     | map/filter + dict()                           |
| ---------------- | -------------------------- | --------------------------------------------- |
| 可读性（多数人） | 更直观                     | 需要函数式思维                                |
| 性能             | 略快（无 lambda 调用开销） | 略慢（每个元素多一次 lambda 调用）            |
| 表达复杂逻辑     | 三元 + 海象够用            | `lambda` 中只能单表达式，多步骤需单独定义函数 |
| 惰性             | 否（立即构建字典）         | 是（map/filter 返回迭代器，dict() 时才求值）  |

```python
# 函数式风格在多步骤流水线中有优势
# 例如：取文件路径 → 过滤现存 → 取文件名 → 读大小 → 建字典
import os
# 假设有个文件列表
file_paths = ["/etc/hosts", "/tmp/test.txt", "/nonexistent"]

# 函数式：流水线清晰，每一步是一个独立的变换
# existing_files = filter(os.path.exists, file_paths)
# sizes = map(lambda p: (os.path.basename(p), os.path.getsize(p)), existing_files)
# result = dict(sizes)

# 推导式：全部塞在一起
# result = {os.path.basename(p): os.path.getsize(p) for p in file_paths if os.path.exists(p)}
# 同样可读，但 `os.path.basename(p)` 在 if 过滤和值表达式中出现了，若不用海象就得算两次
```

最终建议：**用推导式写出 Pythonic 的代码**。除非团队统一采用函数式风格，或流水线步骤确实是独立的（每步产出给下一步用），推导式在绝大多数场景更清晰。

## 3. 最佳实践

### 3.1 推导式 vs 循环：选择决策树

```
能否用推导式清晰表达？
├── 是 → 使用推导式
│   ├── 逻辑 > 2 层嵌套 if/for？ → 考虑拆为函数或循环
│   ├── 需要异常处理？ → 用循环
│   ├── 需要中间状态/变量累积？ → 用循环
│   └── 否则 → 推导式是最佳选择
└── 否 → 使用显式循环
```

```python
# ✅ 推导式合适：简单、无副作用、无异常
active_users = {u["id"]: u["name"] for u in users if u["status"] == "active"}

# ✅ 循环合适：需要异常处理
def safe_load_config(keys):
    result = {}
    for k in keys:
        try:
            result[k] = os.environ[k]
        except KeyError:
            result[k] = "MISSING"
    return result

# ✅ 循环合适：需要累积状态（如分组、聚合）
grouped = {}
for item in data:
    key = item["category"]
    if key not in grouped:
        grouped[key] = []
    grouped[key].append(item)
```

### 3.2 推荐写法 vs 不推荐写法

**过滤并转换：推导式 vs 先全量再删**

```python
data = {"a": 10, "b": -3, "c": 0, "d": 7, "e": -2}

# ✅ 推荐：推导式一步完成过滤 + 转换
positive_doubled = {k: v * 2 for k, v in data.items() if v > 0}
print(positive_doubled)   # 输出：{'a': 20, 'd': 14}

# ❌ 不推荐：先建完整字典再删除不想要的
result = {k: v * 2 for k, v in data.items()}
for k in list(result.keys()):
    if result[k] <= 0:
        del result[k]
# 性能差（遍历两次），代码臃肿，且删除时可能 RuntimeError
```

**翻转字典：注意值的唯一性**

```python
# ✅ 推荐：值唯一且可哈希时用推导式翻转
status_map = {200: "OK", 404: "Not Found", 500: "Error"}
reversed_map = {v: k for k, v in status_map.items()}

# ❌ 不推荐：值可能重复时不加检查直接翻转（丢数据）
grades = {"Alice": 90, "Bob": 85, "Carol": 90}
# flipped = {v: k for k, v in grades.items()}   # Alice 被静默覆盖

# ✅ 正确：值重复时的翻转 + 冲突检测
def safe_flip(d):
    result = {}
    for k, v in d.items():
        if v in result:
            raise ValueError(f"重复值 {v!r}: 键 {result[v]!r} 和 {k!r} 冲突")
        result[v] = k
    return result
```

**复杂表达式：提取为辅助函数**

```python
import re

# ❌ 不推荐：把复杂转换塞进推导式
# result = {url: len(re.findall(r'http[s]?://(?:[a-zA-Z]|[0-9]|...)', html))
#           for url, html in pages.items() if html}

# ✅ 推荐：提取辅助函数，推导式只负责"套模板"
def count_links(html):
    return len(re.findall(r'https?://[^\s"\'<>]+', html))

link_counts = {url: count_links(html) for url, html in pages.items() if html}
```

**海象运算符：不滥用**

```python
# ✅ 推荐：用海象复用昂贵计算
expensive = {x: result for x in data if (result := expensive_func(x)) is not None}

# ❌ 不推荐：用海象仅为省一行代码，损害可读性
# weird = {x: v for x in range(10) if (v := f(x)) and (w := g(v)) and w > 0}
# 没人想读两个海象嵌套的推导式
```

### 3.3 性能优化清单

**优化一：在推导式外预先计算不变的值**

```python
import re
pattern = re.compile(r'\d+')   # 编译一次，不在每次迭代中重复

# ✅ 推荐：预编译在推导式外
numbers = {line: pattern.findall(line) for line in text_lines}

# ❌ 不推荐：每次迭代都 re.compile / re.findall
# numbers = {line: re.findall(r'\d+', line) for line in text_lines}
```

**优化二：使用 items() 而非 keys()+[] 取值**

```python
d = {"a": 1, "b": 2, "c": 3}

# ✅ 推荐：items() 一次取出键值对
result = {k.upper(): v * 2 for k, v in d.items()}

# ❌ 不推荐：先取键再单独取值，多一次哈希查找
# result = {k.upper(): d[k] * 2 for k in d.keys()}
```

虽然只需键时 `for k in d` 比 `for k in d.keys()` 更简洁（实际开销基本相同，但前者是惯用法），但需要值时绝不能只用键再 `d[k]`——那是两次哈希查找。

**优化三：预知大小时用推导式而非循环——让 BUILD_MAP 批量构建**

```python
# 对于大量数据，推导式比循环插入更快
# 原因：推导式的 BUILD_MAP 预分配了接近最终大小的数组，减少了 resize

# ✅ 推荐：大量数据的转换用推导式
big_map = {x: x ** 2 for x in range(100000)}

# ❌ 不推荐：用循环逐个插入
# big_map = {}
# for x in range(100000):
#     big_map[x] = x ** 2
# 循环会触发多次 resize（需要从 8→16→32→...→131072），推导式预分配减少 resize
```

**优化四：避免在推导式条件中重复计算**

```python
# ❌ 不推荐：if 和值表达式各算一次
# slow = {name: hashlib.sha256(name.encode()).hexdigest()
#         for name in names if hashlib.sha256(name.encode()).hexdigest().startswith("00")}

# ✅ 推荐：先计算一次，用海象复用
fast = {name: h for name in names
        if (h := hashlib.sha256(name.encode()).hexdigest()).startswith("00")}
```

### 3.4 可读性最后一道防线：超过 3 个表达式就拆

推导式在语法上允许你写得很长，但可读性有上限。当一行推导式超过 ~80 个字符，或包含超过 3 个"表达式组件"（键表达式、值表达式、for 子句、if 子句、海象），就应该考虑拆分。

```python
# 勉强可读：3 个组件
users = {u["id"]: u["email"] for u in api_response["data"] if u["verified"]}

# 接近极限：4 个组件（键表达式、值表达式、for、if）→ 考虑换行
high_risk = {
    txn["id"]: txn["amount"]
    for txn in transactions
    if txn["amount"] > 10000 and txn["country"] in high_risk_countries
}

# 过了极限：海象 + 多条件 → 拆成循环或辅助函数
# 这种就不要写了：
# bad = {k: v for k in items if (v := complex_fn(k)) and v > 0 and k not in cache}
```

记住：三个月后的你（或同事）需要能在 3 秒内看懂这行代码。如果做不到，就拆开。

### 3.5 推导式中不要产生副作用

推导式不是为了副作用设计的。在推导式中调用有副作用的函数（打印、写文件、修改外部状态）违反最小惊讶原则，且行为可能出乎意料（例如推导式的执行顺序是确定的，但用副作用去表达"执行某种操作"不如用 for 循环意图清晰）。

```python
# ❌ 不推荐：推导式中产生副作用
# 虽然能运行，但混淆了"构建字典"和"申请资源"两个意图
# resources = {name: open_resource(name) for name in resource_names}

# ✅ 推荐：用循环分离副作用的意图
resources = {}
for name in resource_names:
    resources[name] = open_resource(name)
```

同理，不要在推导式中 `print`——推导式是"计算一个值"，不是"执行一个操作链"。这两者的分离能让代码意图一目了然。

## 4. 原理

### 4.1 推导式字节码：BUILD_MAP + MAP_ADD

字典推导式不是语法糖——它有自己的字节码路径。核心指令是：

- `BUILD_MAP`：创建空字典并预分配一定大小的空间。
- `MAP_ADD`：向字典追加一个键值对，跳过 `dict.__setitem__` 的方法查找。

```python
import dis

# 查看推导式的字节码
def make_dict():
    return {x: x ** 2 for x in range(5)}

dis.dis(make_dict)
```

典型输出：

```
  LOAD_CONST          (<code object <dictcomp> ...>)
  LOAD_CONST          ('make_dict.<locals>.<dictcomp>')
  MAKE_FUNCTION       0
  ...
  GET_ITER
  CALL_FUNCTION       1        # 调用内部的 <dictcomp> 代码对象
  RETURN_VALUE
```

在 `<dictcomp>` 内部：

```
  BUILD_MAP           0        # 创建新的空字典
  LOAD_FAST           .0
  FOR_ITER            ...
  STORE_FAST          x
  LOAD_FAST           x
  LOAD_FAST           x
  LOAD_CONST          2
  BINARY_POWER
  MAP_ADD             2        # 追加 {x: x**2} 到字典
  JUMP_ABSOLUTE       ...
  RETURN_VALUE
```

`MAP_ADD` 的关键优势在于：它直接操作字典的内部 C API，避开了 `dict.__setitem__` 的 Python 方法调用路径。这是推导式比循环更快的根源——循环的 `d[k] = v` 每次都要经过 `LOAD_ATTR`（查找 `__setitem__`）+ 方法调用，而 `MAP_ADD` 一步直达 C 层。

```python
# 对比循环的字节码：
def make_dict_loop():
    d = {}
    for x in range(5):
        d[x] = x ** 2
    return d

dis.dis(make_dict_loop)
# 循环体中看到：
# LOAD_FAST x, BINARY_POWER  → 计算值
# STORE_SUBSCR               → d[x] = value（走 __setitem__ 协议）
# 每次 STORE_SUBSCR 都要做方法查找和参数准备，比 MAP_ADD 慢
```

### 4.2 BUILD_MAP 的预分配策略

`BUILD_MAP` 在创建字典时会根据可迭代对象的大小（如果能提前知道）预分配容量。对于 `range(n)` 这种支持 `__length_hint__` 的迭代器，推导式能预估最终大小并一次性分配接近的槽位。对于不支持长度估算的通用迭代器，则以默认初始大小开始、触发 resize 时按需增长——这和循环插入的行为一致。

```python
# range 提供了 __length_hint__，推导式能预分配
# {x: x**2 for x in range(100000)}
# BUILD_MAP 阶段会预分配 ~100000 条的容量，避免中间 resize

# 通用生成器无法预估大小，行为与循环相同
def unknown_gen():
    for i in range(100000):
        yield i
# {x: x**2 for x in unknown_gen()}
# BUILD_MAP 以默认大小开始，过程中 resize
```

这是推导式在"已知大小"场景下遥遥领先循环的原因——循环即使预先知道要插入 10 万个元素，也只会从默认大小 8 开始逐步扩容，而推导式的 `BUILD_MAP` 能一步到接近最终大小。

```python
# 实证：大量数据的推导式 vs 循环
import timeit

# 推导式：BUILD_MAP 预分配
t_comp = timeit.timeit(
    "{x: x**2 for x in range(100000)}",
    number=1000
)

# 循环：逐个插入，经历多次 resize
t_loop = timeit.timeit(
    "d={}; [d.__setitem__(x, x**2) for x in range(100000)]",
    number=1000
)

print(f"推导式: {t_comp:.3f}s")
print(f"循环:   {t_loop:.3f}s")
# 趋势：推导式快 20%~50%，差异随数据量增大而增大
```

### 4.3 推导式内部作用域与变量泄露

Python 3 中的字典推导式有自己的局部作用域，不会像 Python 2 的列表推导式那样泄露迭代变量到外部。

```python
x = "outer"
d = {x: x * 2 for x in range(3)}
print(x)         # 输出：outer   ← 外部 x 不受推导式内部 x 影响
print(d)         # 输出：{0: 0, 1: 2, 2: 4}
```

这与 `lambda` 和 `def` 的行为一致——推导式内部是一个隐式的嵌套函数（通过 `<dictcomp>` 代码对象实现）。这一点在 Python 2 到 Python 3 的迁移中变化很大：Python 2 的列表推导式会泄露变量，Python 3 全部推导式（列表、字典、集合、生成器）都不泄露。

### 4.4 推导式创建字典时的内存分配模式

用 `sys.getsizeof` 追踪推导式构建字典时的内存变化，能看到 `BUILD_MAP` 预分配的效果：

```python
import sys

# 推导式创建后的字典大小
d_comp = {x: x for x in range(1000)}
print(f"推导式 sizeof: {sys.getsizeof(d_comp)}")

# 等量数据用循环逐个插入
d_loop = {}
for x in range(1000):
    d_loop[x] = x
print(f"循环 sizeof: {sys.getsizeof(d_loop)}")

# 两者最终大小相同（字典结构本身相同）
print(f"大小相同: {sys.getsizeof(d_comp) == sys.getsizeof(d_loop)}")   # 输出：True
# 推导式的优势不在最终内存大小，而在创建过程中减少了 resize 次数和中间内存分配抖动
```

最终内存占用相同，因为无论怎么创建，字典最终的结构是一样的。推导式的优势全在"创建过程"——减少 resize 带来的临时内存分配和哈希重算。

### 4.5 与列表推导式、集合推导式的性能关系

三种推导式共享相同的底层机制（专用字节码 + `_ADD` 指令），但性能有细微差异：

- **列表推导式**：`BUILD_LIST` + `LIST_APPEND`，最快——因为 list 只需追加，无哈希计算。
- **集合推导式**：`BUILD_SET` + `SET_ADD`，比列表慢——因为 set 也是哈希表，每次 `SET_ADD` 要计算哈希。
- **字典推导式**：`BUILD_MAP` + `MAP_ADD`，比集合略快——因为 `MAP_ADD` 直接援引 `__setitem__` 的 C 实现，而 `SET_ADD` 经历了集合的独立插入逻辑。

```python
import timeit

n = 100000
t_list = timeit.timeit(f"[x for x in range({n})]", number=100)
t_set = timeit.timeit(f"{{x for x in range({n})}}", number=100)
t_dict = timeit.timeit(f"{{x: x for x in range({n})}}", number=100)

print(f"列表推导式: {t_list:.3f}s")
print(f"集合推导式: {t_set:.3f}s")
print(f"字典推导式: {t_dict:.3f}s")
# 趋势：列表 < 字典 ≈ 集合（列表最快，因为无哈希开销）
```

理解这个层次差异有助于在"需要快速去重且有序"时选择正确的数据结构——列表推导 + 字典 `fromkeys` 的组合有时比集合推导式更快：

```python
# 去重并保留顺序：dict.fromkeys 比 set 推导式快
items = [3, 1, 2, 1, 3, 4, 2, 5]

# 方式一：set 推导式 → 去重但丢失顺序
unique_unordered = {x for x in items}   # {1, 2, 3, 4, 5}

# 方式二：dict.fromkeys → 去重且保留顺序
unique_ordered = list(dict.fromkeys(items))
print(unique_ordered)   # 输出：[3, 1, 2, 4, 5]   ← 保留首次出现顺序
# fromkeys 在 C 层执行插入，比 set 推导式稍快（3.7+）
```

### 4.6 Python 版本演进对推导式性能的影响

几个关键版本对推导式性能有显著影响：

- **Python 3.6**：紧凑字典引入，`MAP_ADD` 受益于更紧凑的哈希表结构，插入速度提升 ~20%。
- **Python 3.8**：海象运算符 `:=` 引入，允许在推导式中复用中间结果，间接优化了"在 if 和值表达式各算一次"的冗余。
- **Python 3.10**：推导式使用更高效的内联路径，部分场景提升 ~10%。
- **Python 3.11**：自适应解释器（specializing adaptive interpreter）对 `FOR_ITER` + `MAP_ADD` 的组合做了专门优化，字典推导式在 3.11 上有约 10~25% 的额外提速。

```python
import sys
print(f"Python 版本: {sys.version}")
# 在 3.11+ 上运行下面这段，比 3.9 快约 15~25%
# {x: x**2 for x in range(100000)}
```

这意味着如果你维护的代码运行在较新的 Python 版本上，推导式相对于循环的优势会更大。但不要为了这点性能差异而升级 Python——升级的理由应该是其他更重要的语言特性和安全修复。

## 5. 总结

### 5.1 推导式模式速查

```
模式              写法                                                   适用场景
─────────────────────────────────────────────────────────────────────────────────────
筛选已有字典      {k: v for k, v in d.items() if cond}                  清洗、过滤
转换已有字典      {f(k): g(v) for k, v in d.items()}                    键值变形
序列建字典        {calc_key(x): calc_val(x) for x in seq}               从列表建映射
翻转字典          {v: k for k, v in d.items()}                         值唯一且可哈希时
索引字典          {i: x for i, x in enumerate(seq)}                    保留下标映射
配对建字典        {k: v for k, v in zip(keys, vals) if cond}           两序列按条件配对
笛卡尔积          {(x, y): f(x, y) for x in xs for y in ys if cond}    双层嵌套映射
海象复用          {k: v for x in seq if (v := expensive(x)) is valid}  复用昂贵计算
```

### 5.2 性能优化速查

```
场景                       最佳选择                      原因
────────────────────────────────────────────────────────────────────────
已知大小的集合转换         推导式                        BUILD_MAP 预分配，避免中间 resize
简单筛选/转换              推导式                        最 Pythonic，字节码优化最充分
键值已配对                  dict(zip(...))               C 层直接构建，跳过 Python 循环
需异常处理                  for 循环                     推导式不能优雅处理异常
需累积/分组/多分支          for 循环                     推导式不支持状态累积
函数式流水线                map/filter + dict()          懒惰求值，步骤独立
预知大小                   推导式 > 循环                 循环的 resize 次数多于预分配的 BUILD_MAP
无大小估算的迭代器         推导式 ≈ 循环                 此时 BUILD_MAP 无法预分配，行为与循环相同
```

### 5.3 核心要点回顾

- 字典推导式的语法为 `{键: 值 for 变量 in 可迭代对象 [if 条件]}`，支持多个 `for` 和 `if` 子句。
- 推导式底层使用 `BUILD_MAP` + `MAP_ADD` 专用字节码，绕过 `__setitem__` 的方法调用路径，这是它比循环快的根本原因。
- `BUILD_MAP` 在迭代器提供 `__length_hint__` 时预分配容量，避免中间 resize，性能优势显著。
- Python 3 推导式有自己的作用域，不会泄露迭代变量到外部。
- 海象运算符 `:=` 允许在推导式中复用中间计算结果，避免在 `if` 和值表达式中重复计算。
- 推导式是"一个键一个值"的模型——遇到键冲突（后者覆盖前者）、一对多、状态累积等需求时，用循环。
- 推导式不应产生副作用（打印、写文件、修改外部状态），保持"纯计算"语义。
- 超过 ~80 字符或 ~3 个表达式组件的推导式应考虑换行或拆成辅助函数。
- `dict(zip(...))` 在纯配对场景比推导式更快；推导式在"需要过滤、转换"时不可替代。
- 3.7+ 字典有序——通过推导式筛选后，顺序保持原 `items()` 的迭代顺序。

### 5.4 读完应能掌握

- 能手写 5 种经典推导式模式（筛选、转换、序列建字典、翻转、配对），并说出每种的最佳适用场景。
- 能解释推导式比循环快的底层原因（`BUILD_MAP` 预分配 + `MAP_ADD` 跳过方法调用）。
- 能在"推导式 vs 循环 vs dict(zip) vs map/filter"之间做出符合场景的正确选择。
- 能识别何时不应该用推导式（异常处理、状态累积、副作用、超长或超复杂表达式）。
- 能用海象运算符消除推导式中的重复计算。
- 能写出可读性与性能兼顾的字典推导式代码——不滥用嵌套、不滥用海象、不为了省一行而牺牲清晰度。

### 5.5 常见面试问题

**问题一：字典推导式和循环有什么区别？哪个快？为什么？**

推导式通常比循环快 20%~50%。原因：推导式使用 `BUILD_MAP` + `MAP_ADD` 专用字节码直接操作 C 层字典结构，而循环中的 `d[k] = v` 每次都要走 `LOAD_ATTR`（查找 `__setitem__`）→ 方法调用 → C 层插入的路径，方法调用有额外开销。此外，推导式的 `BUILD_MAP` 在迭代器提供大小估算时能预分配接近最终大小的容量，减少 resize 次数。

**问题二：Python 3 的字典推导式会泄露变量到外部作用域吗？**

不会。Python 3 中的所有推导式（列表、字典、集合、生成器）都在自己的局部作用域内执行（通过 `<dictcomp>`、`<listcomp>` 等内部代码对象），不污染外部命名空间。这与 Python 2 的列表推导式不同（Python 2 会泄露迭代变量）。

**问题三：`{k: v for k, v in items}` 和 `dict(items)` 哪个更快？**

`dict(items)` 更快，因为它直接将迭代器传给 C 层处理，不需要 Python 层的推导式字节码循环。但当需要过滤（加 `if`）或转换键/值时，`dict()` 做不到，必须用推导式。选择原则：纯"包装已有键值对"用 `dict()`，需要"在创建过程中做逻辑"用推导式。

**问题四：翻转字典时有什么坑？**

```python
d = {"a": 1, "b": 1, "c": 2}
flipped = {v: k for k, v in d.items()}
print(flipped)   # 输出：{1: 'b', 2: 'c'}   ← 'a' 被静默覆盖
```

如果原字典的值有重复，翻转时会丢失数据（后者覆盖前者）。若值不可哈希（如 list），直接 TypeError。应对：要么确保值的唯一性，要么在翻转时做冲突检测，要么改用 `defaultdict(list)` 聚合重复值。

**问题五：什么时候不应使用字典推导式？**

三种情况：(1) 需要异常处理——推导式内无法 try/except；(2) 需要累积状态或多分支逻辑——推导式是"每个元素独立计算"的模型，无法实现分组、聚合等依赖"已处理的元素"的逻辑；(3) 表达式过于复杂——超过 ~3 个组件、理解需要超过 3 秒的推导式应拆成循环或辅助函数。

### 5.6 实战串讲：一个数据清洗管道的性能优化

以下是贴近真实场景的数据清洗管道：从原始日志记录中提取 IP 地址和响应时间，过滤出慢请求（响应用时 > 500ms），然后将 IP 映射到出现次数和平均响应时间。我们分别用"普通循环写法"和"优化写法"实现，并对比性能差异。

```python
import timeit
import random
import statistics


# ----- 模拟数据 -----
# 10 万条日志记录：每条是 {"ip": ..., "time_ms": ...}
random.seed(42)
logs = [
    {"ip": f"192.168.1.{random.randint(1, 254)}", "time_ms": random.randint(10, 2000)}
    for _ in range(100000)
]


# ----- 方式一：普通循环写法（最直接但也最慢）-----
def pipeline_naive(logs):
    # 步骤 1：过滤慢请求，提取 (ip, time_ms)
    slow_requests = {}
    for log in logs:
        if log["time_ms"] > 500:
            slow_requests[log["ip"]] = log["time_ms"]
    # 问题：同一个 IP 多次出现时，后者覆盖前者（丢数据）

    # 步骤 2：统计每个 IP 的出现次数和总时间
    ip_stats = {}
    for log in logs:
        if log["time_ms"] > 500:
            ip = log["ip"]
            if ip not in ip_stats:
                ip_stats[ip] = {"count": 0, "total_time": 0}
            ip_stats[ip]["count"] += 1
            ip_stats[ip]["total_time"] += log["time_ms"]

    # 步骤 3：计算平均值
    result = {}
    for ip, stats in ip_stats.items():
        result[ip] = stats["total_time"] / stats["count"]

    return result


# ----- 方式二：优化写法（推导式 + dict grouping）-----
def pipeline_optimized(logs):
    # 步骤 1：用推导式过滤 + 提取，只保留 time_ms > 500 的 (ip, time_ms) 列表
    slow = [(log["ip"], log["time_ms"]) for log in logs if log["time_ms"] > 500]

    # 步骤 2+3：用 defaultdict 聚合 + 推导式计算平均值
    from collections import defaultdict
    ip_times = defaultdict(list)
    for ip, t in slow:
        ip_times[ip].append(t)

    # 一步计算平均值字典
    result = {ip: statistics.mean(times) for ip, times in ip_times.items()}
    return result


# ----- 方式三：single-pass 最优写法 -----
def pipeline_single_pass(logs):
    """一次遍历完成所有操作：过滤 + 聚合"""
    from collections import defaultdict
    ip_stats = defaultdict(lambda: {"count": 0, "total_time": 0})

    for log in logs:
        t = log["time_ms"]
        if t > 500:
            s = ip_stats[log["ip"]]
            s["count"] += 1
            s["total_time"] += t

    # 推导式计算最终平均值
    return {ip: s["total_time"] / s["count"] for ip, s in ip_stats.items()}


# ----- 性能对比 -----
n_runs = 100

t_naive = timeit.timeit(lambda: pipeline_naive(logs), number=n_runs)
t_opt = timeit.timeit(lambda: pipeline_optimized(logs), number=n_runs)
t_single = timeit.timeit(lambda: pipeline_single_pass(logs), number=n_runs)

print(f"普通循环:    {t_naive:.3f}s")
print(f"推导式+聚合:  {t_opt:.3f}s")
print(f"Single-pass:  {t_single:.3f}s")
# 趋势：single-pass 最快（只遍历一次），普通循环最慢（多次遍历 + 多次 [] 取值）

# ----- 验证结果一致性 -----
r1 = pipeline_naive(logs)
r2 = pipeline_optimized(logs)
r3 = pipeline_single_pass(logs)
# 注意 r1 的统计有 bug（同 IP 覆盖），因此只比较 r2 和 r3
print(f"结果一致: {r2 == r3}")   # 输出：True
```

这段代码的核心教训：

1. **推导式擅长"过滤 + 提取"**——`[(log["ip"], log["time_ms"]) for log in logs if log["time_ms"] > 500]` 一行完成了两件事，且列表推导式本身也享受 `LIST_APPEND` 字节码优化。
2. **聚合类操作不适合推导式**——`defaultdict` + 循环是分组聚合的正确工具，硬塞进推导式只会更慢更难读。
3. **减少遍历次数是最大的性能增益**——`single_pass` 只遍历一次数据，比"先过滤再聚合再计算均值"的三次遍历快得多。这个优化远大于"推导式 vs 循环"之间的微差异。
4. **最终产出字典仍可用推导式**——`{ip: mean for ...}` 在最后一步，计算简洁、语义清晰。
