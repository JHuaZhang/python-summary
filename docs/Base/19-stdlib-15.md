---
group:
  title: 【19】标准库精讲
  order: 19
order: 15
title: random 随机数与采样
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 random 模块

`random` 是 Python 标准库中负责生成伪随机数和执行随机采样的模块。它提供了一个基于 **Mersenne Twister（梅森旋转算法）** 的伪随机数生成器（PRNG, Pseudo-Random Number Generator），能够生成均匀分布的浮点数、整数，以及从序列中随机挑选元素、打乱序列、按特定分布（如正态分布）抽样等能力。

所谓"伪随机"，是指它生成的数并非真正不可预测的随机数，而是由一个确定的算法从一个初始状态（种子 seed）计算出来的确定性序列。给定相同的种子，每次运行都会得到完全相同的序列——这对测试、实验复现、抽奖结果公正性验证非常有用，但也意味着它**不适合用于密码学、安全令牌、加密密钥**等对不可预测性要求极高的场景，这类场景应使用 `secrets` 模块。

`random` 模块在日常开发中极为常见：打乱训练数据、随机抽样验证、模拟实验、抽奖活动、生成测试数据、游戏中的随机事件等，都离不开它。它几乎是 Python 里使用频率最高的标准库之一。

**核心能力一览**

| 能力分类 | 代表函数 | 一句话说明 |
|---------|---------|-----------|
| 基础随机数 | `random()` | 返回 `[0, 1)` 区间内的浮点数 |
| 整数随机数 | `randint(a, b)` | 返回 `[a, b]` 区间内的整数（含两端） |
| 区间浮点 | `uniform(a, b)` | 返回 `[a, b]` 区间内的浮点数 |
| 单选 | `choice(seq)` | 从序列中随机选一个元素 |
| 有放回抽样 | `choices(seq, k, weights)` | 可重复地随机选 k 个，可加权 |
| 无放回抽样 | `sample(seq, k)` | 不重复地随机选 k 个 |
| 原地打乱 | `shuffle(seq)` | 将序列原地随机打乱 |
| 种子控制 | `seed(n)` | 固定随机种子，确保可复现 |
| 分布抽样 | `gauss(mu, sigma)` | 按正态分布抽样 |

### 1.2 基本语法与最小用法

使用前需导入模块：

```python
import random
```

最小可运行示例——生成一个 `[0, 1)` 区间的随机浮点数：

```python
import random

print(random.random())
# 输出：0.7234567890123456 （每次运行不同，除非设置了 seed）
```

固定种子后，序列可复现：

```python
import random

random.seed(42)
print(random.random())
print(random.random())
# 输出：
# 0.6394267984578837
# 0.025010755222666936
# 无论何时何地，只要 seed=42，这两次 random() 的结果完全一样
```

这就是 `random` 模块最基本的使用方式：导入模块、可选地设置种子、调用对应函数获取随机值。下面第 2 章会逐一展开每个 API 的详细用法。

---

## 2. 核心内容

### 2.1 random.random() —— [0,1) 区间浮点数

`random.random()` 是整个模块最底层的随机数生成函数，返回一个 `[0.0, 1.0)` 区间内的浮点数（包含 0.0，不包含 1.0）。它基于 Mersenne Twister 生成均匀分布的浮点数，模块内几乎所有其它函数（如 `randint`、`choice`、`shuffle`）内部都依赖它来决定随机性。

**何时用**：当你需要"一个 0 到 1 之间的随机小数"时直接用；需要做概率判断（如"以 30% 概率执行某操作"）时也非常方便——判断 `random.random() < 0.3` 即可。

**签名**：`random.random()` —— 无参数。

```python
import random

# 生成 5 个随机浮点数
for _ in range(5):
    print(random.random())
# 输出（示例，实际值每次不同）：
# 0.7234567890123456
# 0.1234567890123456
# 0.9876543210987654
# 0.4567890123456789
# 0.6543210987654321
```

**概率判断的典型用法**：

```python
import random

# 模拟以 30% 概率触发事件
def maybe_send_email():
    if random.random() < 0.3:
        print("发送营销邮件")
    else:
        print("本次跳过")

for i in range(5):
    maybe_send_email()
# 输出（示例）：
# 本次跳过
# 发送营销邮件
# 本次跳过
# 本次跳过
# 发送营销邮件
```

注意返回值范围是左闭右开 `[0, 1)`，理论上有极小概率返回 `0.0`，但绝不会返回 `1.0`。如果你需要把区间映射到 `[a, b)`，可以乘以区间宽度再加上起点：`a + (b - a) * random.random()`，不过更直观的做法是直接用下一节的 `uniform`。

### 2.2 random.randint(a, b) —— 含端点整数

`random.randint(a, b)` 返回一个整数 N，满足 `a <= N <= b`。注意这里两端都是**闭区间**——`a` 和 `b` 都可能被取到，这与很多语言里常见的左闭右开约定不同，是 Python `random` 模块里一个容易踩坑的点。

**何时用**：模拟掷骰子、随机选取下标、生成随机验证码、随机延时等所有"要一个整数"的场景。

**签名**：`random.randint(a, b)`，`a` 和 `b` 为整数，要求 `a <= b`，否则抛 `ValueError`。

```python
import random

# 模拟掷一颗六面骰子（1~6，含 1 和 6）
print(random.randint(1, 6))
# 输出（示例）：4

# 模拟掷 10 次骰子
results = [random.randint(1, 6) for _ in range(10)]
print(results)
# 输出（示例）：[3, 6, 1, 4, 4, 2, 5, 1, 6, 3]
```

**踩坑提示**：`randint(1, 6)` 能取到 6，但 `randrange(1, 6)`（另一个函数）取不到 6（它遵循左闭右开）。如果你发现骰子永远掷不出 6，多半是把这两个函数搞混了。

**生成随机验证码**：

```python
import random

# 生成 6 位数字验证码（每位 0~9）
code = "".join(str(random.randint(0, 9)) for _ in range(6))
print(code)
# 输出（示例）：3 9 2 8 1 7 拼成 "392817"
```

### 2.3 random.uniform(a, b) —— 区间浮点数

`random.uniform(a, b)` 返回一个 `[a, b]` 区间内的随机浮点数。它本质上就是 `a + (b - a) * random.random()` 的封装，但用起来更直观、更易读。

**何时用**：需要在一个浮点区间内取随机值时，比如生成随机的模拟温度、随机坐标、随机价格波动幅度等。

**签名**：`random.uniform(a, b)`。`a` 和 `b` 大小顺序不限——`uniform(2, 5)` 和 `uniform(5, 2)` 等价，都在 `2` 到 `5` 之间取值。端点是否包含取决于浮点取整，实际使用中不必纠结。

```python
import random

# 生成 5 个 36.0 到 39.0 之间的随机体温（模拟）
for _ in range(5):
    print(round(random.uniform(36.0, 39.0), 1))
# 输出（示例）：
# 37.2
# 38.5
# 36.8
# 39.0
# 36.4
```

**模拟股票日波动幅度**：

```python
import random

# 模拟某股票当日涨跌幅在 -3% 到 +3% 之间随机
daily_change = random.uniform(-0.03, 0.03)
print(f"今日涨跌幅：{daily_change:.2%}")
# 输出（示例）：今日涨跌幅：1.27%
```

### 2.4 random.choice(seq) —— 随机选一个

`random.choice(seq)` 从非空序列中随机挑选一个元素返回。序列可以是列表、元组、字符串、range 等任何支持索引访问的对象。

**何时用**：随机抽奖选一个、随机展示一条广告/标语、游戏中随机出牌、随机选一个代理服务器等——只要"从一堆里挑一个"就用它。

**签名**：`random.choice(seq)`。`seq` 必须是非空序列；若为空会抛 `IndexError`。

```python
import random

# 随机选一名同学回答问题
students = ["张三", "李四", "王五", "赵六", "钱七"]
lucky = random.choice(students)
print(f"本次请 {lucky} 回答问题")
# 输出（示例）：本次请 王五 回答问题
```

**字符串也是序列**，所以可以直接 `choice` 字符串：

```python
import random

# 随机生成一个字母
letter = random.choice("abcdefghijklmnopqrstuvwxyz")
print(letter)
# 输出（示例）：k
```

**注意**：`choice` 不能直接用于集合 `set`，因为集合是无序的、不支持索引。要先转成列表：

```python
import random

colors = {"红", "绿", "蓝"}
# random.choice(colors)  # TypeError: 'set' object is not subscriptable
print(random.choice(list(colors)))  # 正确做法
# 输出（示例）：蓝
```

### 2.5 random.choices(seq, k=, weights=) —— 有放回抽样

`random.choices(population, k=1, weights=None, *, cum_weights=None)` 从序列中**有放回地**随机抽取 `k` 个元素，返回一个长度为 `k` 的列表。因为是有放回，同一个元素可能被多次抽中。还可以通过 `weights` 指定每个元素被抽中的权重（概率比例）。

**何时用**：加权抽奖（不同奖品的概率不同）、模拟大量独立试验（如掷骰子 10000 次统计频率）、Bootstrap 重采样等。

**参数说明**：

- `population`：被抽样的序列。
- `k`：抽取个数（因为有放回，k 可以大于序列长度）。
- `weights`：可选的权重列表，长度与 `population` 相同，表示各元素的相对概率，不必归一化。例如 `weights=[1, 1, 3]` 表示第三个元素被抽中的概率是前两者的 3 倍。
- `cum_weights`：累积权重，一般不用，传 `weights` 即可。

```python
import random

# 模拟掷骰子 10 次（有放回）
rolls = random.choices([1, 2, 3, 4, 5, 6], k=10)
print(rolls)
# 输出（示例）：[4, 2, 6, 1, 3, 5, 2, 4, 6, 1]
```

**加权抽奖**——不同奖项概率不同：

```python
import random

# 奖品池，权重对应抽中概率
prizes = ["一等奖", "二等奖", "三等奖", "谢谢参与"]
weights = [1, 5, 20, 74]  # 概率约 1% / 5% / 20% / 74%

# 抽 5 次（同一个账号可能多次中奖，因为是演示）
results = random.choices(prizes, weights=weights, k=5)
print(results)
# 输出（示例）：['谢谢参与', '三等奖', '谢谢参与', '二等奖', '谢谢参与']
```

**验证加权是否生效**——大数次试验统计频率：

```python
import random

prizes = ["一等奖", "二等奖", "三等奖", "谢谢参与"]
weights = [1, 5, 20, 74]

# 抽 10000 次，统计每个奖项的频率
results = random.choices(prizes, weights=weights, k=10000)
for prize in prizes:
    count = results.count(prize)
    print(f"{prize}：{count} 次（约 {count / 100:.1f}%）")
# 输出（示例）：
# 一等奖：98 次（约 1.0%）
# 二等奖：490 次（约 4.9%）
# 三等奖：2010 次（约 20.1%）
# 谢谢参与：7402 次（约 74.0%）
```

可以看到实测频率与权重比例高度吻合，这正是加权抽样的效果。

**有放回的含义**：每次抽取都是独立的，前一次的结果不影响后一次。好比从一个袋子里摸球，摸完再放回去。因此 `k` 可以大于序列长度——比如从 6 面骰子里"抽" 10000 次。

### 2.6 random.sample(seq, k) —— 无放回抽样

`random.sample(population, k)` 从序列中**无放回地**随机抽取 `k` 个不重复元素，返回一个新列表。因为是不重复抽取，所以 `k` 不能超过 `population` 的长度，否则抛 `ValueError`。

**何时用**：抽奖选不重复的多个中奖者、从大数据集里随机抽样一小部分做验证、随机出几道不重复的题、随机选几个不重复的样本做交叉验证等——所有"选出来的不能重复"的场景都用 `sample`。

**签名**：`random.sample(population, k)`。`population` 可以是列表、元组、字符串、range、集合等。`k` 为要抽取的个数，必须 `0 <= k <= len(population)`。

```python
import random

# 从 10 名同学中随机选 3 名获奖（不重复）
students = ["张三", "李四", "王五", "赵六", "钱七",
            "孙八", "周九", "吴十", "郑十一", "王十二"]
winners = random.sample(students, k=3)
print("中奖者：", winners)
# 输出（示例）：中奖者： ['赵六', '王十二', '钱七']
```

**注意**：`sample` 返回的是新列表，原序列不变。

**从 range 抽样**——高效地从大范围里抽几个不重复整数：

```python
import random

# 从 1~10000 中随机抽 5 个不重复的数（不用先建列表，range 很省内存）
lucky_numbers = random.sample(range(1, 10001), k=5)
print(lucky_numbers)
# 输出（示例）：[4521, 873, 9234, 1567, 3902]
```

**字符串抽样**——生成不重复字符的随机码：

```python
import random

# 从字母表中随机取 8 个不重复字符拼成邀请码
chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # 去掉易混淆的 I/O/0/1
code = "".join(random.sample(chars, k=8))
print(code)
# 输出（示例）：K7Q3M9RX
```

**有放回 vs 无放回对比**

```python
import random

pool = ["A", "B", "C", "D"]

# 有放回：可能重复
print(random.choices(pool, k=5))
# 输出（示例）：['B', 'B', 'D', 'A', 'B']  （B 出现 3 次）

# 无放回：不可能重复（但 k 不能超过 len(pool)）
print(random.sample(pool, k=4))
# 输出（示例）：['C', 'A', 'D', 'B']  （每个出现 1 次）
```

### 2.7 random.shuffle(seq) —— 原地打乱

`random.shuffle(x)` 将可变序列 `x` **原地**随机打乱顺序，返回 `None`。因为是原地操作，所以只能用于列表这类可变序列，不能用于元组、字符串等不可变序列。

**何时用**：打乱训练数据顺序、洗牌、随机排列展示顺序、打乱选择题选项等。

**签名**：`random.shuffle(x)`。`x` 必须是支持切片赋值的可变序列（通常是列表）。

```python
import random

# 洗牌模拟
cards = list(range(1, 11))  # 1~10 代表十张牌
random.shuffle(cards)
print(cards)
# 输出（示例）：[7, 2, 9, 1, 5, 10, 3, 8, 4, 6]
```

**打乱训练数据**：

```python
import random

# 模拟一个数据集（特征 + 标签）
data = [
    ("样本1", 1), ("样本2", 0), ("样本3", 1),
    ("样本4", 0), ("样本5", 1), ("样本6", 0),
]
random.shuffle(data)
print(data)
# 输出（示例）：[('样本3', 1), ('样本6', 0), ('样本1', 1), ('样本5', 1), ('样本2', 0), ('样本4', 0)]
```

**返回 None 是常见坑**：很多人误以为 `shuffle` 返回打乱后的新列表，写成 `new = random.shuffle(lst)`，结果 `new` 是 `None`：

```python
import random

lst = [1, 2, 3, 4, 5]
new = random.shuffle(lst)  # 错误用法
print(new)  # 输出：None
print(lst)  # 输出（示例）：[3, 1, 5, 2, 4]  原列表已被打乱
```

**想要返回新列表而不改动原序列**：先复制再打乱，或用 `sample`：

```python
import random

original = [1, 2, 3, 4, 5]
# 方式一：复制后打乱
shuffled = original[:]
random.shuffle(shuffled)
# 方式二：直接 sample 全量
shuffled2 = random.sample(original, k=len(original))
print(original)   # 输出：[1, 2, 3, 4, 5]  原序不变
print(shuffled)   # 输出（示例）：[4, 2, 5, 1, 3]
print(shuffled2)  # 输出（示例）：[3, 5, 1, 4, 2]
```

### 2.8 random.seed(n) —— 固定随机种子

`random.seed(a=None, version=2)` 用于初始化随机数生成器的种子。传入相同的种子，后续生成的随机序列就会完全一致，从而实现**可复现**。

**何时用**：单元测试里需要固定的"随机"结果做断言、科学实验需要可复现的随机过程、机器学习里固定数据打乱顺序以便对比模型、教学演示中固定输出便于讲解、抽奖活动事后公正性验证等。

**签名**：`random.seed(a=None, version=2)`。`a` 可以是整数、浮点数、字符串、字节、字节数组；传 `None` 时使用系统时间（或 `os.urandom`）作为种子，每次都不同。

```python
import random

# 第一次运行
random.seed(42)
print(random.randint(1, 100))
print(random.choice(["甲", "乙", "丙"]))
print(random.random())
# 输出：
# 82
# 乙
# 0.007931432105809327

# 第二次运行（完全一致）
random.seed(42)
print(random.randint(1, 100))
print(random.choice(["甲", "乙", "丙"]))
print(random.random())
# 输出：
# 82
# 乙
# 0.007931432105809327
```

**在测试中固定随机结果**：

```python
import random

def test_shuffle_preserves_elements():
    random.seed(0)
    original = list(range(10))
    data = original[:]
    random.shuffle(data)
    # 断言：打乱后元素集合不变，只是顺序变了
    assert sorted(data) == original
    # 因为 seed 固定，data 的顺序也是确定的，可以精确断言
    assert data == [8, 4, 7, 3, 9, 0, 1, 5, 2, 6]

test_shuffle_preserves_elements()
print("测试通过")
# 输出：测试通过
```

**不传 seed 的默认行为**：程序启动时 `random` 模块会自动用系统时间初始化种子，所以平时不调用 `seed` 也能得到"看起来随机"的结果——但想要复现就必须显式设种子。

**一句话原则**：调试和测试时设种子（可复现），生产环境里一般不设（要随机性）。

### 2.9 random.randrange(start, stop, step) —— 左闭右开整数

`random.randrange(start, stop=None, step=1)` 返回从 `range(start, stop, step)` 中随机选取的一个元素。它和 `randint` 的区别在于遵循**左闭右开**约定——`stop` 取不到。

**何时用**：当你需要遵循"左闭右开"习惯时（和切片、range 一致），或者需要按步长抽样时。

```python
import random

# randrange(1, 6) 只能取 1~5，取不到 6
print(random.randrange(1, 6))   # 输出（示例）：3

# 按步长 0~10 中取偶数
print(random.randrange(0, 11, 2))  # 输出（示例）：6

# 只传一个参数：等同于 range(0, n)
print(random.randrange(100))  # 输出（示例）：57
```

### 2.10 分布抽样函数 —— gauss / normalvariate 等

除了均匀分布，`random` 模块还提供多种特定分布的抽样函数，最常用的是正态分布。

**`random.gauss(mu, sigma)`**：返回服从均值 `mu`、标准差 `sigma` 的高斯分布（正态分布）的随机数。它比 `normalvariate` 略快，但不是线程安全。

**`random.normalvariate(mu, sigma)`**：功能与 `gauss` 相同，线程安全，稍慢。

**何时用**：模拟自然界大量呈正态分布的现象（身高、考试成绩、测量误差、噪声）、蒙特卡洛模拟、统计学实验等。

```python
import random

# 模拟 5 名学生的身高，均值 170cm，标准差 6cm
for _ in range(5):
    height = random.gauss(170, 6)
    print(f"{height:.1f} cm")
# 输出（示例）：
# 168.3 cm
# 175.4 cm
# 169.1 cm
# 162.7 cm
# 171.9 cm
```

**验证均值趋近理论值**——大数次抽样：

```python
import random

# 抽 10000 次，均值为 50，标准差为 10
samples = [random.gauss(50, 10) for _ in range(10000)]
avg = sum(samples) / len(samples)
print(f"样本均值：{avg:.2f}（理论 50）")
print(f"样本标准差：{(sum((x - avg) ** 2 for x in samples) / len(samples)) ** 0.5:.2f}（理论 10）")
# 输出（示例）：
# 样本均值：49.98（理论 50）
# 样本标准差：10.03（理论 10）
```

**其他分布函数（了解）**

| 函数 | 分布 | 典型用途 |
|------|------|---------|
| `uniform(a, b)` | 均匀分布 | 区间内等概率取值 |
| `gauss(mu, sigma)` | 正态分布 | 模拟自然现象 |
| `expovariate(lambd)` | 指数分布 | 模拟等待时间 |
| `betavariate(alpha, beta)` | Beta 分布 | 概率分布建模 |
| `gammavariate(alpha, beta)` | Gamma 分布 | 等待时间累加 |
| `triangular(low, high, mode)` | 三角分布 | 简单近似 |

这些分布函数在科学计算、模拟仿真中很有用，日常业务开发用得不多，知道有这些即可。需要大规模分布抽样时，优先用 `numpy.random`，性能会高得多。

### 2.11 其它实用函数速览

**`random.getrandbits(k)`**：返回一个 `k` 位随机整数（非负）。

```python
import random

print(random.getrandbits(8))  # 输出（示例）：167 （0~255 之间）
```

**`random.random()` 与 `random.uniform()` 的关系**：`uniform(a, b)` 等价于 `a + (b - a) * random.random()`，只是封装得更友好。

**`random.getstate()` / `random.setstate(state)`**：获取/恢复生成器内部状态，用于在多个阶段间切换随机序列。高级用法，日常少用。

---

## 3. 最佳实践

**3.1 测试与调试时设种子，生产环境慎用**

写单元测试时，随机性是"敌人"——你没法对一个每次不同的结果做断言。这时应在测试开始处 `random.seed(0)` 固定序列，让 `shuffle`、`sample` 的结果确定，才能精确断言。同理，调试一个依赖随机数的 bug 时，固定种子才能稳定复现。

但生产环境里，如果业务确实需要不可预测的随机性（如抽奖、游戏发牌），就**不要**设固定种子——否则每次部署后行为完全一致，可被预测，甚至可被攻击者利用。

```python
import random

# 推荐：测试里设种子
def test_sample_size():
    random.seed(123)
    result = random.sample(range(100), k=5)
    assert len(result) == 5
    assert len(set(result)) == 5  # 无重复

# 推荐：生产里让它默认用系统时间种子
def real_lottery():
    return random.sample(range(1000), k=3)
```

**3.2 选择正确的函数：choice / choices / sample / shuffle 别混用**

这四个函数语义不同，用错会导致 bug：

| 需求 | 正确函数 | 说明 |
|------|---------|------|
| 选一个 | `choice(seq)` | 等价于 `choices(seq, k=1)[0]`，但更直观 |
| 选多个，可重复 | `choices(seq, k=n)` | 有放回，可加权 |
| 选多个，不重复 | `sample(seq, k=n)` | 无放回，k 不能超长 |
| 打乱整个序列 | `shuffle(seq)` | 原地，不返回新列表 |

常见错误：
- 想要"不重复中奖"，却用了 `choices`，结果同一个人中了两次。
- 想要"返回打乱后的新列表"，却写 `new = random.shuffle(lst)`，得到 `None`。
- 对空列表调用 `choice`，抛 `IndexError`，忘了先判空。

**3.3 `choice` 不支持 set，要先转 list**

集合是无序的、不支持索引，`random.choice` 内部要做 `seq[int(random() * len(seq))]`，所以传 set 会报错。养成习惯：随机选元素前先 `list(your_set)`。

**3.4 大规模随机数请用 numpy.random**

`random` 模块是逐个生成，适合少量随机数。当你需要生成几十万、上百万个随机数（如数据科学、数值模拟），用 `numpy.random` 会快几十倍，因为它是向量化批量生成：

```python
import random
import numpy as np

# 生成 100 万个随机数：random 慢
data1 = [random.random() for _ in range(1_000_000)]  # 较慢

# 生成 100 万个随机数：numpy 快
data2 = np.random.random(1_000_000)  # 快得多，且是 ndarray
```

**3.5 安全场景必须用 secrets，不要用 random**

凡是涉及密码、token、session id、加密密钥、验证码（用于安全校验的）、API key、密码重置链接等场景，**绝对不要**用 `random`。它的输出可被预测，攻击者只要猜到种子就能重现整条序列。这类场景用 `secrets` 模块，它底层调用操作系统的真随机源 `os.urandom`，不可预测。

```python
import secrets

# 安全地生成一个 16 字节的随机 token
token = secrets.token_hex(16)
print(token)
# 输出（示例）：9b4e1f2a8c3d7e6f5a1b2c3d4e5f6a7b

# 安全地生成一个 0~999 的随机数（用于安全场景的抽奖/验证）
secure_num = secrets.randbelow(1000)
print(secure_num)
# 输出（示例）：617

# 用 random.choice 生成密码（不推荐，容易预测）
# 用 secrets 选择字符（推荐）
alphabet = "abcdefghijklmnopqrstuvwxyz0123456789"
password = "".join(secrets.choice(alphabet) for _ in range(12))
print(password)
# 输出（示例）：k3m7q2x9p1w8
```

**3.6 复现实验时的"全局种子"陷阱**

`random.seed()` 设置的是全局状态。但在多线程、多模块环境下，全局状态会被各方共享、互相干扰，单靠 `seed` 不一定能保证实验完全复现。更严谨的做法是用独立的 `random.Random` 实例：

```python
import random

# 创建独立的随机数生成器实例，不污染全局状态
rng = random.Random(42)
print(rng.randint(1, 100))  # 输出（示例）：82

# 全局 random 不受影响
print(random.randint(1, 100))  # 输出（每次不同）
```

在库代码、多人协作项目里，推荐用独立实例而不是直接操作全局 `random`，避免互相干扰。

**3.7 shuffle 不支持不可变序列**

`random.shuffle` 只能用于列表。元组、字符串等不可变序列会抛 `TypeError`。要对元组"打乱"，先转列表：

```python
import random

t = (1, 2, 3, 4, 5)
# random.shuffle(t)  # TypeError
lst = list(t)
random.shuffle(lst)
print(lst)  # 输出（示例）：[3, 1, 5, 2, 4]
```

---

## 4. 原理

### 4.1 伪随机数生成器（PRNG）的本质

`random` 模块的底层是一个**伪随机数生成器**（PRNG）。所谓"伪随机"，是指它生成的数列看起来随机、统计上接近均匀分布，但本质上是**确定性的**——由一个初始状态（种子）通过一个确定的算法一步步计算出来的。给定相同的种子，得到的序列完全相同。

这与"真随机"有本质区别。真随机数来自物理过程（如放射性衰变、电路热噪、鼠标移动时序等），不可预测、不可复现。`random` 模块不依赖真随机源，它只是一个数学算法。

**为什么叫"伪随机"**

- "伪"：它不是真正不可预测的，算法和种子确定后，整条序列就唯一确定了。
- "随机"：它生成的数列在统计意义上满足随机性的各项检验（均匀性、独立性等），对人来说"看起来是随机的"。

对绝大多数日常场景（游戏、抽奖、模拟、打乱数据），伪随机完全够用。但对密码学场景，"可复现"恰恰是致命缺陷——攻击者能预测。

### 4.2 Mersenne Twister 算法

`random` 模块默认使用 **Mersenne Twister（梅森旋转）** 算法，学名 MT19937。它是目前应用最广的通用伪随机算法之一，有如下特点：

- **周期极长**：理论周期为 `2^19937 - 1`，这是一个天文数字，实际使用中绝不会出现"循环"。
- **统计性能优良**：在大多数统计随机性检验中表现良好，分布均匀，独立性接近理想。
- **速度快**：基于位运算和数组旋转，生成效率高。
- **状态较大**：内部维护一个 624 个 32 位整数的状态数组。

**简化工作流程**

1. 初始化：根据种子填充一个 624 元素的状态数组。
2. 生成：每次需要随机数时，从状态数组里"旋转"出一个新的 32 位整数，并更新状态。
3. 当 624 个数用完后，再次旋转生成下一批 624 个。

`random.random()` 就是把这个 32 位整数进一步处理成 `[0, 1)` 的浮点数（通常是取 53 位精度拼接）。

**种子的作用**

种子的本质是 PRNG 的初始状态。`random.seed(42)` 把 MT19937 的 624 个状态用一个确定性的算法从整数 42 扩展填充——这个过程是确定的，所以相同种子必然得到相同初始状态，进而得到相同序列。

```python
import random

# 同一种子，同一序列
random.seed(2024)
seq1 = [random.random() for _ in range(3)]

random.seed(2024)
seq2 = [random.random() for _ in range(3)]

print(seq1 == seq2)  # 输出：True
```

如果不传种子（`seed(None)`），模块会用系统时间或 `os.urandom` 提供的随机字节作为种子，从而每次运行得到不同序列——但这依然是伪随机，只是初始状态不可事先预测而已。

### 4.3 choice / sample / shuffle 的内部逻辑

`random` 模块里那些"从序列中取元素"的函数，底层都依赖 `random.random()`（或等价的随机整数生成）来决定取哪些元素。理解这一点有助于用好它们。

**`choice(seq)` 的原理**

`choice` 本质上是"随机一个下标，再取那个元素"。简化等价：

```python
def choice(seq):
    return seq[int(random.random() * len(seq))]
```

它假设序列支持索引访问，所以 set 这种无序集合用不了——没有"第几个"的概念。

**`sample(seq, k)` 的原理（无放回）**

无放回抽样的核心是"选过的不能再选"。一种直观实现是**池子删除法**：维护一个可选元素池，每次随机选一个，选完就从池子里删除，下一轮在剩下的里面继续选：

```python
def sample(pool, k):
    pool = list(pool)           # 复制一份，避免改原序列
    result = []
    for _ in range(k):
        i = int(random.random() * len(pool))
        result.append(pool.pop(i))  # 选完就移除，保证不重复
    return result
```

这就是 `choices` 和 `sample` 的根本区别：
- `choices`：每次都在完整的序列里选，选过的下轮还能选——有放回，可重复。
- `sample`：选过的从池子里删掉，下轮只能在剩下的里选——无放回，不重复。

这也解释了为什么 `sample` 的 `k` 不能超过序列长度——池子删空了就没得选了。

**`shuffle(seq)` 的原理**

`shuffle` 采用 **Fisher-Yates 洗牌算法**：从后往前，每个位置和它前面（含自己）的某个随机位置交换。这样每种排列恰好出现一次，概率完全均匀：

```python
def shuffle(x):
    for i in range(len(x) - 1, 0, -1):
        j = int(random.random() * (i + 1))  # j 在 0~i 之间
        x[i], x[j] = x[j], x[i]             # 原地交换
```

因为是原地交换，所以必须传入可变序列（列表），且返回 `None`。

### 4.4 为何 random 不安全，secrets 才安全

这是理解 `random` 模块最重要的一点：**它是伪随机的、可预测的，不能用于安全场景**。

**可预测性的来源**

- PRNG 的输出完全由种子决定。
- 如果攻击者能推断出种子（或内部状态），就能完整重现后续所有"随机"输出。
- 即使种子用系统时间，攻击者只要大致知道程序启动时间，就能在很小的范围内枚举猜测种子。
- 更进一步，攻击者只要观察到足够多的连续输出（约 624 个），就能反推出 MT19937 的内部状态，从而预测后续所有输出——这是已知的攻击方法。

所以用 `random` 生成的密码、token、验证码、密钥，在攻击者面前都是可预测的，安全性形同虚设。

**secrets 模块为什么安全**

`secrets` 模块底层调用 `os.urandom`，而 `os.urandom` 读取的是操作系统维护的**真随机源**（在 Linux 上是 `/dev/urandom`，吸收硬件噪声、中断时序等不可预测的物理事件）。这种随机数不具备"种子-序列"的确定性关系，攻击者无法通过任何方式预测，适合所有安全场景。

**两类模块的定位对比**

| 维度 | `random` | `secrets` |
|------|---------|-----------|
| 性质 | 伪随机（PRNG） | 密码学安全随机（CSPRNG） |
| 来源 | 算法计算 | 操作系统真随机源 |
| 可复现 | 设种子可复现 | 不可复现 |
| 速度 | 快 | 相对慢一些 |
| 适用 | 模拟、游戏、抽样、打乱 | 密码、token、密钥、安全校验 |
| 可预测 | 内部状态泄露即可预测 | 不可预测 |

一句话记忆：**`random` 图快图可复现，`secrets` 图不可预测。安全无小事，security 场景永远别用 random。**

### 4.5 复现性对测试与实验的意义

伪随机的"可复现"既是缺点（不安全），也是优点（可复现）。在工程和科研中，可复现性极其重要：

- **单元测试**：随机过程的输出必须可断言，固定种子才能精确比较。
- **Bug 调试**：随机触发的 bug，不固定种子就难以稳定复现。
- **模型评估**：打乱训练集的顺序固定后，不同模型才能在完全相同的数据划分上公平对比。
- **科研复现**：论文里的随机实验，别人要能用相同种子复现出相同数据，研究才可信。

固定种子是把这些"随机"过程纳入确定性控制的手段。理解了 PRNG 的确定性本质，就会明白为什么 `seed` 在测试和实验里如此关键——它把"随机"变成了"可复现的确定序列"。

---

## 5. 总结

**本文内容要点**

- `random` 是 Python 标准库的伪随机数生成模块，底层基于 Mersenne Twister 算法，适用于模拟、抽样、打乱、游戏、抽奖等非安全场景。
- `random.random()` 返回 `[0, 1)` 浮点；`randint(a, b)` 返回含端点整数；`uniform(a, b)` 返回区间浮点。
- `choice(seq)` 随机选一个；`choices(seq, k, weights)` 有放回抽样（可加权，可重复）；`sample(seq, k)` 无放回抽样（不重复，k 不超长）；`shuffle(seq)` 原地打乱（返回 None）。
- `seed(n)` 固定种子实现可复现，测试/调试必用，生产需谨慎。
- `gauss/normalvariate` 等提供正态及其他分布抽样，大规模分布抽样优先用 `numpy.random`。
- 伪随机本质：算法+种子决定整条序列，给定相同种子完全可复现；`choice/sample/shuffle` 内部均基于 `random()` 决定索引。
- 安全警告：`random` 不适用于密码学/安全场景（输出可预测），密码、token、密钥等必须用 `secrets` 模块（基于 `os.urandom` 真随机源）。
- 最佳实践：测试设种子、生产慎设；choice/choices/sample/shuffle 别混用；set 要先转 list；不返回新列表的 shuffle 别赋值；大规模用 numpy；独立实验用 `random.Random` 实例避免全局污染。

**读完本文你应能掌握**

- 能说明 `random()` / `randint()` / `uniform()` 各自的返回区间差异，并按场景正确选用。
- 能区分 `choices`（有放回、可加权、可重复）与 `sample`（无放回、不重复）的本质不同，并知道二者分别用于什么场景。
- 能正确使用 `shuffle` 打乱列表（不赋值给返回值），并知道如何"返回新列表而不改原序"。
- 能用 `seed` 固定随机序列实现测试断言与实验复现，并说明为什么这样能复现。
- 能用 `gauss` 进行正态分布抽样，并知道大规模抽样该转向 `numpy.random`。
- 能说清伪随机与真随机的区别，为什么 `random` 不安全，什么场景必须用 `secrets`，并能正确生成安全的 token 与密码。
- 能在实际编码中避开 `shuffle` 返回 None、`choice` 不能用 set、`sample` 的 k 超长等常见坑。