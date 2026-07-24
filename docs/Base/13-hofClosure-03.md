---
group:
  title: 【13】高阶函数与闭包
  order: 13
order: 3
title: filter 过滤函数
nav:
  title: Python
  order: 1
---

## 1. 介绍

### 1.1 什么是 filter

`filter` 是 Python 的一个内置函数，作用是"按条件从可迭代对象里筛选元素"。你给它一个判断函数和一个可迭代对象，它会逐个把元素交给判断函数检验：判断函数对某个元素返回"真"（truthy），这个元素就被保留；返回"假"（falsy），就被丢弃。最终返回的是一个 `filter` 迭代器，里面只包含被保留的元素。

`filter` 与 `map` 一样属于函数式编程风格的工具：`map` 负责"变换"每个元素，`filter` 负责"筛选"元素，两者经常配合使用。在数据处理、清洗、筛选合法记录等场景里，`filter` 是一个非常顺手的工具。

理解 `filter` 的关键有三点：

第一，判断函数（第一个参数）接收的是元素本身，返回值会被当作真值来判定，而不是非要严格等于 `True`。只要返回值在布尔上下文里为真（非零数字、非空字符串、非空列表等），对应元素就会被保留。

第二，当判断函数传 `None` 时，`filter` 会退化为"真值过滤"——直接用元素本身的真假来决定去留，等价于把所有 falsy 元素（`0`、`""`、`None`、`False`、空容器等）过滤掉。

第三，`filter` 返回的是迭代器而非列表，它是惰性的（lazy）：只有在被消费（比如 `list()`、`for` 循环）时才真正执行过滤，而且只能迭代一次。

### 1.2 基本语法与最小用法

`filter` 的函数签名如下：

```python
filter(function_or_None, iterable, /)
```

- `function_or_None`：判断函数，接收一个元素，返回值用于真值判定；传 `None` 表示直接用元素本身的真值。
- `iterable`：可迭代对象（列表、元组、字符串、集合、字典、生成器等）。
- 返回值：一个 `filter` 对象（迭代器）。

最小的用法示例：

```python
# 从一组数字里挑出偶数
nums = [1, 2, 3, 4, 5, 6]


def is_even(n):
    return n % 2 == 0


evens = filter(is_even, nums)
print(list(evens))
# 输出：[2, 4, 6]
```

这里 `is_even` 对偶数返回 `True`、对奇数返回 `False`，于是 `filter` 只保留了 `2, 4, 6`。注意必须用 `list()` 把 `filter` 对象转成列表才能一次性"看到"结果，否则直接 `print(evens)` 只会显示一个 `<filter object at 0x...>`，因为迭代器还没有被消费。

再来看一个 `None` 的最小用法：

```python
# 用 None 过滤掉所有 falsy 元素
data = [0, 1, "", "hello", None, [], [1, 2], False, 3.14]


result = filter(None, data)
print(list(result))
# 输出：[1, 'hello', [1, 2], 3.14]
```

`filter(None, data)` 把 `0`、`""`、`None`、`[]`、`False` 这些在布尔上下文里为假的元素全部丢掉了，只留下了"真"的元素。这个写法在清理数据、去掉空值时非常常用。

## 2. 核心内容

### 2.1 判断函数的基本工作方式

`filter` 的判断函数（下文称为 predicate）接收一个参数——就是迭代过程中的当前元素。`filter` 会把这个元素传给 predicate，然后对返回值做真值判定：

- 返回值为真（truthy）→ 保留该元素。
- 返回值为假（falsy） → 丢弃该元素。

这里的"真值"判定遵循 Python 的布尔上下文规则，而不是严格要求返回 `True`。也就是说，predicate 返回 `1`、`"yes"`、`[1]` 这类 truthy 值时元素也会被保留，返回 `0`、`""`、`[]` 时会被丢弃。

来看一个判断函数返回非布尔值的例子：

```python
# 用一个返回字符串的判断函数：非空字符串为真则保留
words = ["apple", "", "banana", "  ", "cherry"]


def non_empty(word):
    # 返回去掉首尾空格后的字符串；空字符串为假
    return word.strip()


result = filter(non_empty, words)
print(list(result))
# 输出：['apple', 'banana', 'cherry']
```

`non_empty("  ")` 返回 `""`（空字符串，falsy），所以 `"  "` 被丢弃；它返回的并不是 `True`/`False`，而是一个字符串，但 `filter` 照样能正确工作，因为判定依据是"真值"而非"严格等于 True"。

这一点容易被忽略，也会带来副作用：判断函数的返回值如果是某种带信息的对象，`filter` 只用它来判定去留，并不会把返回值本身放进结果里——结果里放的始终是原始元素。所以上面的结果里是 `'apple'` 而不是 `'apple'.strip()` 的返回值（尽管这里两边相等，但语义不同）。

### 2.2 func 为 None 时的真值过滤

当第一个参数传 `None` 时，`filter` 的行为会变成"用每个元素自身的真值来过滤"。换句话说，`filter(None, iterable)` 等价于"只保留 truthy 元素，丢掉所有 falsy 元素"。

这是 `filter` 最特殊的一种用法，专门用来批量去除"空"或"假"的值。常见的 falsy 值包括：

- `None`
- `False`
- 数字 `0`、`0.0`
- 空字符串 `""`、空字节串 `b""`
- 空容器 `[]`、`()`、`{}`、`set()`
- 自定义对象中定义了 `__bool__` 返回 `False` 或 `__len__` 返回 `0` 的实例

一个综合示例：

```python
# 清洗一批从接口返回的数据，去掉所有"空"记录
raw_records = [
    {"id": 1, "name": "Alice"},
    None,
    {"id": 2, "name": ""},
    {"id": 3, "name": "Bob"},
    "",
    0,
    {"id": 4, "name": "Carol"},
    [],
]


# 注意：这里的字典本身非空（truthy），即便 name 为空也不会被 None 过滤掉
clean = list(filter(None, raw_records))
print(clean)
# 输出：[{'id': 1, 'name': 'Alice'}, {'id': 2, 'name': ''}, {'id': 3, 'name': 'Bob'}, {'id': 4, 'name': 'Carol'}]
```

可以看到 `None`、`""`、`0`、`[]` 都被丢掉了，但 `{"id": 2, "name": ""}` 这个字典保留了下来，因为字典本身是非空容器，在布尔上下文里为真。`filter(None, ...)` 只看"元素本身真假"，并不会深入元素内部去判断字段。

如果想去掉字段为空的字典，就需要写一个真正的判断函数：

```python
records = [
    {"id": 1, "name": "Alice"},
    {"id": 2, "name": ""},
    {"id": 3, "name": "Bob"},
    {"id": 4, "name": None},
]


def has_name(record):
    return record.get("name")  # 名字为空字符串或 None 时为假


valid = list(filter(has_name, records))
print(valid)
# 输出：[{'id': 1, 'name': 'Alice'}, {'id': 3, 'name': 'Bob'}]
```

这里 `has_name` 返回的是 `record.get("name")`——`"Alice"`、`"Bob"` 是 truthy 字符串被保留，`""` 和 `None` 是 falsy 被丢弃。这就是 `func=None`（看元素本身）和 `func=判断函数`（看函数返回值）的核心区别。

### 2.3 filter 返回的是迭代器（惰性、一次性）

`filter` 返回的 `filter` 对象是一个迭代器（iterator），这意味着两点：

1. **它是惰性的**：在你实际消费它（`list()`、`for` 循环、`next()`、解包等）之前，过滤动作并不会执行。
2. **它是一次性的**：迭代器只能遍历一次，遍历完就耗尽了，再次遍历会得到空结果。

如果不消费就打印，只会看到一个对象地址：

```python
nums = [1, 2, 3, 4]
evens = filter(lambda n: n % 2 == 0, nums)
print(evens)
# 输出：<filter object at 0x10abcdef0>
```

迭代器一次性消费的例子：

```python
nums = [1, 2, 3, 4, 5, 6]
evens = filter(lambda n: n % 2 == 0, nums)

# 第一次消费
print(list(evens))
# 输出：[2, 4, 6]

# 第二次消费——已经空了
print(list(evens))
# 输出：[]
```

第一次 `list(evens)` 把迭代器里的元素全部取走，迭代器耗尽；第二次再 `list(evens)` 时已经没有元素可取，得到空列表。如果需要多次使用过滤结果，应该在第一次就转成列表保存下来：

```python
nums = [1, 2, 3, 4, 5, 6]
evens = list(filter(lambda n: n % 2 == 0, nums))  # 立刻物化成列表

print(evens)  # 可以反复用
# 输出：[2, 4, 6]
print(evens)
# 输出：[2, 4, 6]
```

也可以用 `next()` 逐个取元素，提前感知过滤是否"命中"：

```python
nums = [1, 3, 5, 2, 4]
evens = filter(lambda n: n % 2 == 0, nums)

print(next(evens))
# 输出：2
print(next(evens))
# 输出：4
# 再 next 就会抛 StopIteration
```

### 2.4 filter 接收不同类型的可迭代对象

`filter` 的第二个参数不限于列表，任何可迭代对象都可以传入：元组、字符串、集合、字典、`range`、生成器、文件对象等。返回值统一是 `filter` 迭代器，与输入类型无关。

过滤字符串里的元音字母：

```python
sentence = "Hello World"


def is_vowel(ch):
    return ch.lower() in "aeiou"


consonants = filter(lambda ch: ch.lower() not in "aeiou", sentence)
print("".join(consonants))
# 输出：Hll Wrld
```

这里把字符串传给 `filter`，过滤掉元音后再 `join` 成新字符串。`filter` 会逐字符处理 `"Hello World"`（包括空格），空格不是元音所以被保留。

过滤字典的键：

```python
user_ages = {"Alice": 30, "Bob": 17, "Carol": 25, "Dave": 15, "Eve": 40}


# 直接迭代字典得到的是键
adult_keys = filter(lambda name: user_ages[name] >= 18, user_ages)
print(list(adult_keys))
# 输出：['Alice', 'Carol', 'Eve']
```

直接对字典调用 `filter`，迭代的是键。如果要同时用键和值，应该用 `.items()`：

```python
user_ages = {"Alice": 30, "Bob": 17, "Carol": 25, "Dave": 15, "Eve": 40}


adults = filter(lambda item: item[1] >= 18, user_ages.items())
print(dict(adults))
# 输出：{'Alice': 30, 'Carol': 25, 'Eve': 40}
```

直接过滤生成器也是合法的，`filter` 自己也是惰性的，所以可以嵌在生成器管道里：

```python
# 一个产生大范围数字的生成器，filter 只在消费时才逐个判断
def gen_numbers(n):
    for i in range(n):
        yield i


# 先 filter 偶数，再消费前 5 个
evens = filter(lambda n: n % 2 == 0, gen_numbers(1000))
for i, e in enumerate(evens):
    if i >= 5:
        break
    print(e)
# 输出：
# 0
# 2
# 4
# 6
# 8
```

### 2.5 与列表推导式的对比

绝大多数 `filter` 的用法都能用列表推导式改写，而且后者通常更 Pythonic：

```python
nums = [1, 2, 3, 4, 5, 6]

# filter 写法
evens_a = list(filter(lambda n: n % 2 == 0, nums))

# 列表推导式写法
evens_b = [n for n in nums if n % 2 == 0]

print(evens_a, evens_b)
# 输出：[2, 4, 6] [2, 4, 6]
```

两者结果相同，但列表推导式 `[x for x in seq if cond(x)]` 更直观，条件直接写在表达式里，不需要额外的 lambda 和函数嵌套。

`func=None` 的场景同样可以改写：

```python
data = [0, 1, "", "hi", None, 3.14]

# filter(None, ...)
clean_a = list(filter(None, data))

# 列表推导式等价写法
clean_b = [x for x in data if x]

print(clean_a, clean_b)
# 输出：[1, 'hi', 3.14] [1, 'hi', 3.14]
```

那么什么时候还该用 `filter`？主要有两类场景：

第一，已经有一个现成的判断函数（尤其是定义好的、有名字的函数），直接 `filter(func, seq)` 比 `[x for x in seq if func(x)]` 更简洁，意图也更明确——"用这个函数过滤"。

```python
import re


# 一个已经定义好的、有明确名字的判断函数
def is_valid_email(s):
    return re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", s) is not None


emails = ["a@b.com", "bad", "x@y.org", "no-at-sign", "z@w.io"]

# 用现成函数过滤——filter 更顺
valid = list(filter(is_valid_email, emails))
print(valid)
# 输出：['a@b.com', 'x@y.org', 'z@w.io']
```

第二，当你想要惰性求值、节省内存时，`filter` 配合迭代器比列表推导式更合适。列表推导式会一次性把全部结果放进内存，而 `filter` 始终是迭代器，按需产出：

```python
# 处理一个非常大的序列，只需找到前几个符合条件的值就停下
big = range(10_000_000)

# filter 是惰性的，找到 3 个质数就停
def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(n ** 0.5) + 1):
        if n % i == 0:
            return False
    return True


primes = filter(is_prime, big)
found = []
for p in primes:
    found.append(p)
    if len(found) >= 3:
        break
print(found)
# 输出：[2, 3, 5]
```

如果用列表推导式 `[p for p in big if is_prime(p)]`，它会先把 1000 万个数里所有质数全算出来再放进列表，即使你只想要前 3 个，也会做大量无用功。`filter` 的惰性在这里优势明显。

### 2.6 与生成器表达式的对比

生成器表达式 `(x for x in seq if cond(x))` 和 `filter` 的返回行为非常接近——都是惰性迭代器，都按需产出。两者的取舍主要看可读性和习惯：

```python
nums = [1, 2, 3, 4, 5, 6]

# filter 写法
evens_a = filter(lambda n: n % 2 == 0, nums)

# 生成器表达式写法
evens_b = (n for n in nums if n % 2 == 0)

print(list(evens_a), list(evens_b))
# 输出：[2, 4, 6] [2, 4, 6]
```

生成器表达式同样惰性、同样一次性，写法上和列表推导式只差一个方括号换成圆括号。在条件比较复杂、涉及多行表达式或需要解包时，生成器表达式通常更清晰：

```python
students = [
    {"name": "Alice", "score": 88},
    {"name": "Bob", "score": 45},
    {"name": "Carol", "score": 72},
    {"name": "Dave", "score": 30},
]


# 按条件筛选——可以同时做解包和筛选，表达力强
passers = (s for s in students if s["score"] >= 60)
print(list(passers))
# 输出：[{'name': 'Alice', 'score': 88}, {'name': 'Carol', 'score': 72}]
```

用 `filter` 写同样的逻辑需要 lambda：

```python
students = [
    {"name": "Alice", "score": 88},
    {"name": "Bob", "score": 45},
    {"name": "Carol", "score": 72},
    {"name": "Dave", "score": 30},
]


passers = filter(lambda s: s["score"] >= 60, students)
print(list(passers))
# 输出：[{'name': 'Alice', 'score': 88}, {'name': 'Carol', 'score': 72}]
```

对比下来结论很清楚：

- 条件简单、已有判断函数、或想用 `None` 做真值过滤 → `filter` 更合适。
- 条件涉及字段访问、解包、复合判断 → 生成器表达式更直观。
- 两者都是惰性迭代器，性能差异通常可以忽略，选择以可读性为准。

### 2.7 与 fnmatch / re 等条件函数配合

`filter` 的判断函数可以是任意"接收一个参数、返回真值"的函数，这让它能很自然地和标准库里那些"判断函数工厂"配合，比如 `fnmatch.fnmatch`、`re.compile().match` 等。

**配合 fnmatch 做通配符过滤**

`fnmatch.fnmatch(name, pattern)` 判断文件名是否匹配某个通配符模式，返回布尔值。用 `functools.partial` 把模式固定下来，就能当作 `filter` 的判断函数：

```python
import fnmatch
from functools import partial


files = [
    "report.pdf",
    "photo_001.jpg",
    "notes.txt",
    "photo_002.jpg",
    "data.csv",
    "photo_summer.png",
]


# 固定 pattern，得到一个只接收文件名的判断函数
is_jpg = partial(fnmatch.fnmatch, pattern="*.jpg")
jpgs = list(filter(is_jpg, files))
print(jpgs)
# 输出：['photo_001.jpg', 'photo_002.jpg']
```

也可以配合更复杂的通配模式：

```python
import fnmatch
from functools import partial


files = ["app.log", "error.log", "app.log.1", "error.log.bak", "trace.txt"]


is_log = partial(fnmatch.fnmatch, pattern="*.log*")
logs = list(filter(is_log, files))
print(logs)
# 输出：['app.log', 'error.log', 'app.log.1', 'error.log.bak']
```

**配合 re 做正则过滤**

`re.compile(pattern).match` 返回 `Match` 对象（匹配成功）或 `None`（不匹配），`Match` 对象是真值，`None` 是假值，所以可以直接当判断函数用：

```python
import re


lines = [
    "2024-01-01 INFO start",
    "broken line",
    "2024-01-01 ERROR something failed",
    "no timestamp here",
    "2024-01-02 WARN check",
]


# 编译一次正则，复用 match 方法作为判断函数
log_pattern = re.compile(r"^\d{4}-\d{2}-\d{2} ")
valid_logs = list(filter(log_pattern.match, lines))
print(valid_logs)
# 输出：['2024-01-01 INFO start', '2024-01-01 ERROR something failed', '2024-01-02 WARN check']
```

注意这里把 `.match` 方法直接作为判断函数传给 `filter`，它接收一个字符串参数（当前行），返回 `Match` 或 `None`。这正是 `filter` 判断函数"返回值做真值判定"的典型应用——`Match` 对象本身是 truthy，不需要再转成布尔值。

**配合 str 方法和简单的内联函数**

`filter` 也常和字符串方法本身配合，比如过滤掉空白行：

```python
lines = ["first", "", "second", "   ", "third", "\t", "fourth"]


# str.strip 返回去掉空白的字符串，空字符串为假，会被过滤
non_blank = list(filter(str.strip, lines))
print(non_blank)
# 输出：['first', 'second', 'third', 'fourth']
```

`str.strip` 是个方法对象，传给 `filter` 时，每一行作为参数传进去。`"  ".strip()` 返回 `""`（假），`"first".strip()` 返回 `"first"`（真），于是空白行被丢弃。这种写法既简洁又高效，是清理文本时常用的惯用法。

### 2.8 典型场景一：过滤 None / 空值

去掉列表里的 `None` 是 `filter(None, ...)` 的招牌用法之一。注意 `filter(None, ...)` 会同时去掉所有 falsy 值，如果你的本意只是去掉 `None` 本身（保留 `0`、`""`、`False`），就不能用 `None`，要写明确的判断函数：

```python
data = [1, None, 0, "text", "", None, 2, False, 3]


# 错误做法：filter(None, ...) 会把 0、""、False 也一起丢掉
too_aggressive = list(filter(None, data))
print(too_aggressive)
# 输出：[1, 'text', 2, 3]


# 正确做法：只去 None，保留 0、""、False
only_none_removed = list(filter(lambda x: x is not None, data))
print(only_none_removed)
# 输出：[1, 0, 'text', '', 2, False, 3]
```

这里也可以用 `functools.partial` 配合 `operator.is_`，但直接 `lambda x: x is not None` 更直白。成语是：**想清空值用 `None`，想去 None 用 `is not None`**。

### 2.9 典型场景二：过滤偶数 / 满足数值条件的元素

数值过滤是 `filter` 最直观的用法，配合 lambda 写起来很短：

```python
nums = list(range(1, 11))

# 偶数
evens = list(filter(lambda n: n % 2 == 0, nums))
print(evens)
# 输出：[2, 4, 6, 8, 10]

# 大于 5 的数
big = list(filter(lambda n: n > 5, nums))
print(big)
# 输出：[6, 7, 8, 9, 10]

# 3 的倍数
mult_of_3 = list(filter(lambda n: n % 3 == 0, nums))
print(mult_of_3)
# 输出：[3, 6, 9]
```

更贴近现实的场景是"保留超过阈值的数据"，比如传感器读数：

```python
# 一批传感器读数，只保留大于阈值的有效读数
readings = [12.5, 13.0, 9.8, 14.2, 10.1, 11.9, 8.5, 15.0]
threshold = 10.0

valid = list(filter(lambda r: r > threshold, readings))
print(valid)
# 输出：[12.5, 13.0, 14.2, 11.9, 15.0]
```

### 2.10 典型场景三：筛选合法数据

更接近工程场景的用法是，从一批结构化记录里筛选出合法的：

```python
users = [
    {"name": "Alice", "age": 30, "active": True},
    {"name": "", "age": 25, "active": True},     # 名字为空，非法
    {"name": "Bob", "age": -1, "active": True},  # 年龄为负，非法
    {"name": "Carol", "age": 28, "active": False},  # 未激活
    {"name": "Dave", "age": 35, "active": True},
]


def is_valid_user(user):
    if not user.get("name"):
        return False
    if not (0 <= user.get("age", -1) <= 150):
        return False
    if not user.get("active"):
        return False
    return True


valid_users = list(filter(is_valid_user, users))
print(valid_users)
# 输出：[{'name': 'Alice', 'age': 30, 'active': True}, {'name': 'Dave', 'age': 35, 'active': True}]
```

这里判断函数逻辑较长，用 `filter` 配合一个有名字的函数比硬塞进列表推导式更清晰：

```python
# 用列表推导式写同样的逻辑——条件塞进一行会很长
valid = [u for u in users
         if u.get("name") and 0 <= u.get("age", -1) <= 150 and u.get("active")]
```

当判断规则有多个步骤、需要分步说明时，把规则封装成命名函数再用 `filter` 调用，可读性明显更好。

### 2.11 filter 与 map 链式调用

`filter` 和 `map` 都返回迭代器，可以很自然地串起来组成"过滤 → 映射"或"映射 → 过滤"的管道。两个函数的返回值都能直接作为下一个的输入，整个管道都是惰性的。

**先过滤后映射**

先筛选出合法数据，再把每条数据变换成需要的形态。比如先把及格的成绩挑出来，再换算成等级：

```python
scores = [45, 78, 52, 90, 33, 67, 88, 12]


def to_grade(score):
    if score >= 85:
        return "A"
    if score >= 70:
        return "B"
    if score >= 60:
        return "C"
    return "D"


# 先过滤出及格（>=60），再映射成等级
passed = filter(lambda s: s >= 60, scores)
grades = list(map(to_grade, passed))
print(grades)
# 输出：['B', 'A', 'C', 'A']
```

也可以写成嵌套调用的形式，但很多人觉得从内往外读不顺：

```python
scores = [45, 78, 52, 90, 33, 67, 88, 12]


def to_grade(score):
    if score >= 85:
        return "A"
    if score >= 70:
        return "B"
    if score >= 60:
        return "C"
    return "D"


# 嵌套写法：先 map 再 filter 不对，这里要外层 map 内层 filter
grades = list(map(to_grade, filter(lambda s: s >= 60, scores)))
print(grades)
# 输出：['B', 'A', 'C', 'A']
```

**先映射后过滤**

也可以先变换数据，再筛掉不合法的变换结果。比如把一批字符串转成整数，再丢掉转换失败的（用 `None` 标记失败）：

```python
raw = ["10", "20", "abc", "30", "??", "40"]


def safe_int(s):
    try:
        return int(s)
    except ValueError:
        return None


# 先映射成 int 或 None，再过滤掉 None
parsed = filter(lambda x: x is not None, map(safe_int, raw))
print(list(parsed))
# 输出：[10, 20, 30, 40]
```

这里注意 `filter(None, map(...))` 不行，因为 `0` 也是 falsy，会被误删（比如 `"0"` 转成 `0` 后会被丢掉）。所以判断函数必须用 `x is not None` 显式区分"转换失败"和"值为 0"。

**长链的惰性优势**

把多步 `filter` 和 `map` 串起来的管道，整个只在实际消费时才执行，任何一步都不会先把中间结果攒成列表：

```python
# 模拟大数据处理管道：过滤 → 过滤 → 映射 → 过滤
big_range = range(1, 1_000_001)

step1 = filter(lambda n: n % 2 == 0, big_range)     # 偶数
step2 = filter(lambda n: n % 3 == 0, step1)          # 且是 3 的倍数
step3 = map(lambda n: n * 10, step2)                 # 乘 10
step4 = filter(lambda n: n > 60, step3)              # 大于 60

# 只取前 5 个就停，不会处理全部 100 万
result = []
for x in step4:
    result.append(x)
    if len(result) >= 5:
        break
print(result)
# 输出：[120, 180, 240, 300, 360]
```

整个管道在 `for` 拉取时才逐级往前要数据，`break` 一旦触发，前面的 `filter`/`map` 也都停止迭代，避免了无谓的计算。这正是函数式管道风格的核心收益。

### 2.12 filter 的惰性与内存优势

回到惰性的本质。`filter` 不会把输入或输出复制成新的列表，它只是在迭代过程中"看一个、判一个、決定留不留"。这对处理大文件、大流数据尤其有用。

逐行过滤大日志文件：

```python
# 模拟一个会产生很多行的文件对象（这里用 StringIO 代替真实文件）
from io import StringIO


log_text = """2024-01-01 INFO start
2024-01-01 DEBUG debug msg
2024-01-01 ERROR something failed
2024-01-01 INFO running
2024-01-01 WARN check
2024-01-01 DEBUG another debug
"""
fake_file = StringIO(log_text)


# 只保留 ERROR 和 WARN 行
important = filter(lambda line: "ERROR" in line or "WARN" in line, fake_file)
for line in important:
    print(line.rstrip())
# 输出：
# 2024-01-01 ERROR something failed
# 2024-01-01 WARN check
```

即使 `fake_file` 是一个有上百万行的真实文件，`filter` 也只在 `for` 循环每迭代一次时才读一行、判一行，内存里始终只占着当前这一行，不会把整个文件读进来。换成列表推导式 `[line for line in file if cond(line)]` 则会一次性把所有满足条件的行都加载进内存。

不过要提醒：如果最终结果本来就需要全部放进内存（要 `list()` 整体输出），惰性的内存优势就不明显了——因为物化的那一刻内存还是会涨起来。惰性的真正价值在"中途可以提前终止"、"流式处理"和"避免不必要的中间列表"这三类场景。

### 2.13 判断基于真值而非严格 ==True

这是一个容易踩坑的点：`filter` 判定元素是否保留，依据是"判断函数返回值的真值"，而不是"返回值严格等于 `True`"。

这意味着：

- 返回 `1`、`"x"`、`[1]`、`{"a": 1}`、`3.14` 等任何 truthy 值 → 保留。
- 返回 `0`、`""`、`[]`、`{}`、`None`、`False` 等任何 falsy 值 → 丢弃。

看一个反直觉的例子：

```python
nums = [0, 1, 2, 3, 4]


# 判断函数返回的是 "n % 2" 的余数——偶数时返回 0（假），奇数时返回 1（真）
odds = list(filter(lambda n: n % 2, nums))
print(odds)
# 输出：[1, 3]
```

`n % 2` 在偶数时返回 `0`（falsy，丢弃），在奇数时返回 `1`（truthy，保留），所以结果就是奇数。这之所以能工作，正是因为 `filter` 用真值而非 `== True` 判定。但如果判断函数的返回值有"既是真值但不是预期含义"的情况，就可能踩坑：

```python
words = ["apple", "banana", "apricot", "cherry", "avocado"]


# 本意是保留以 'a' 开头的单词，但 startswith 返回的是布尔值，没问题
# 假如这里手滑写成了 find：
result = list(filter(lambda w: w.find("a"), words))
print(result)
# 输出：['banana', 'apricot', 'cherry', 'avocado']
```

这里本意是"保留包含 a 的单词"，但 `str.find` 在 `"apple"` 里 `"a"` 在索引 0，返回 `0`（falsy），于是 `apple` 反而被丢了！这是一个典型的"真值判定导致误判"的例子。要避免这个坑，判断函数应使用返回布尔值的 API（如 `in`、`startswith`），或显式转成布尔：

```python
words = ["apple", "banana", "apricot", "cherry", "avocado"]


# 正确写法：用 in 或 bool(...) 明确含义
result = list(filter(lambda w: "a" in w, words))
print(result)
# 输出：['apple', 'banana', 'apricot', 'avocado']
```

养成习惯：把判断函数写成"明确返回 `True`/`False`"的形式，能让 `filter` 的意图最清晰，也避免类似 `find` 这种"返回位置"的 API 被误当判断条件。

### 2.14 用生成器表达式替代 filter 的取舍

既然生成器表达式同样惰性，而且写法更接近自然语言，很多场景下可以替代 `filter`。下面把常见用法逐个换成生成器表达式，对照取舍。

**用 None 过滤空值**

```python
data = [0, 1, "", "hi", None, 3.14, [], [1]]

# filter 写法
a = list(filter(None, data))

# 生成器表达式写法
b = list(x for x in data if x)

print(a, b)
# 输出：[1, 'hi', 3.14, [1]] [1, 'hi', 3.14, [1]]
```

`filter(None, data)` 更短、意图更明确（"去掉假值"是它的招牌行为）；生成器表达式的 `if x` 也清楚。两者都可以，取舍看团队习惯。

**用 lambda 过滤**

```python
nums = list(range(1, 11))

# filter + lambda
a = list(filter(lambda n: n % 2 == 0, nums))

# 生成器表达式
b = list(n for n in nums if n % 2 == 0)

print(a, b)
# 输出：[2, 4, 6, 8, 10] [2, 4, 6, 8, 10]
```

这里生成器表达式明显更易读，lambda 在 `filter` 里反而显得啰嗦。当条件简单且只写一次时，生成器表达式胜出。

**已有命名函数作为判断**

```python
import re


def is_valid_email(s):
    return re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", s) is not None


emails = ["a@b.com", "bad", "x@y.org"]

# filter + 现成函数
a = list(filter(is_valid_email, emails))

# 生成器表达式
b = list(e for e in emails if is_valid_email(e))

print(a, b)
# 输出：['a@b.com', 'x@y.org'] ['a@b.com', 'x@y.org']
```

当判断函数已经有名字且语义明确时，`filter(is_valid_email, emails)` 更像一句声明"用这个函数过滤"，比生成器表达式里再写一遍 `is_valid_email(e)` 更简洁。

**综合取舍建议**

| 场景 | 推荐写法 | 原因 |
|------|----------|------|
| 去掉所有 falsy 值 | `filter(None, seq)` | 招牌用法，最短最直白 |
| 已有命名判断函数 | `filter(func, seq)` | 声明式，函数名即语义 |
| 简单条件，临时写 | 生成器表达式 `(x for x in seq if cond)` | 不用写 lambda，更接近自然语言 |
| 需要解包或字段访问 | 生成器表达式 | 可以直接 `for k, v in d.items()`，lambda 做不到 |
| 复杂多步条件 | 命名函数 + `filter` | 把规则封装成函数可读性更好 |

## 3. 最佳实践

### 3.1 永远记得消费 filter 对象

`filter` 返回迭代器，不消费就是一堆没用的对象。最常见的坑是把它当作列表直接打印或者反复使用：

```python
# 不推荐：忘记 filter 是迭代器
nums = [1, 2, 3, 4]
evens = filter(lambda n: n % 2 == 0, nums)
# 直接 print 看不到内容
print(evens)  # <filter object at 0x...>
# 第二次想再遍历已经空了
for e in evens:
    print(e)
# （已被前面某次消费耗尽时这里是空的）
```

推荐：要么直接用 `for` 消费，要么用 `list()` 物化保存，并明确这个列表是结果而不是迭代器：

```python
# 推荐：要么立刻 list，要么明确只迭代一次
evens = list(filter(lambda n: n % 2 == 0, [1, 2, 3, 4]))
print(evens)
# 输出：[2, 4]
```

### 3.2 判断函数尽量返回布尔值

虽然 `filter` 只看真值，但判断函数返回布尔值能让意图最清晰，也避免 `find`、`index` 这类"返回位置"的 API 被误当条件：

```python
# 不推荐：find 返回 0 时会被当成假，导致误判
words = ["apple", "banana"]
wrong = list(filter(lambda w: w.find("a"), words))
print(wrong)
# 输出：['banana']  # apple 里的 a 在位置 0，被误删


# 推荐：用 in 或 startswith，返回真正的布尔值
right = list(filter(lambda w: "a" in w, words))
print(right)
# 输出：['apple', 'banana']
```

### 3.3 区分"去 None"和"去空值"

只在想去 `None` 时用 `lambda x: x is not None`，在做"清洗掉所有空值"时才用 `None`。两者语义不同，混用会丢数据：

```python
data = [0, None, "", 1]


# 去 None：保留 0、""、1
list(filter(lambda x: x is not None, data))  # [0, '', 1]

# 去全部 falsy：只保留 1
list(filter(None, data))  # [1]
```

### 3.4 条件复杂时优先用命名函数

条件超过两步、或需要 try/except、或需要多个字段联合判断时，把判断逻辑抽成命名函数再传给 `filter`，比塞一行 lambda 更易维护：

```python
# 不推荐：把复杂判断塞进 lambda
valid = list(filter(
    lambda u: u.get("name") and 0 <= u.get("age", -1) <= 150 and u.get("active"),
    users,
))


# 推荐：抽成命名函数，注释和分支都清晰
def is_valid_user(u):
    if not u.get("name"):
        return False
    if not (0 <= u.get("age", -1) <= 150):
        return False
    return bool(u.get("active"))


valid = list(filter(is_valid_user, users))
```

命名函数可以加 docstring、可以被单独测试、也可以被其他地方复用，这些都是塞在 lambda 里的条件做不到的。

### 3.5 大数据量时利用惰性提前终止

当只需要前几个匹配结果时，不要先 `list()` 再切片，应直接在 `filter` 迭代器上 `break`，让惰性帮你省掉后面的计算：

```python
# 不推荐：把全部质数都算出来再切片
import itertools


def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(n ** 0.5) + 1):
        if n % i == 0:
            return False
    return True


big = range(2, 10_000_000)
first_five_primes = list(filter(is_prime, big))[:5]  # 会算出所有质数再丢掉


# 推荐：在迭代器上提前终止，只算必要的部分
primes_iter = filter(is_prime, big)
first_five = list(itertools.islice(primes_iter, 5))
print(first_five)
# 输出：[2, 3, 5, 7, 11]
```

`itertools.islice(filter(...), n)` 是"只取前 n 个匹配"的标准写法，配合 `filter` 的惰性可以避免海量无用计算。

### 3.6 不要在判断函数里修改输入数据

`filter` 的判断函数应当是"纯查询"的——只读、不改。如果判断函数里有副作用（.append、修改字典、修改全局变量等），不仅可读性差，还容易因为惰性求值的时机而产生难以排查的 bug：

```python
# 不推荐：在判断函数里收集"被过滤掉的"元素
seen = []


def keep_and_record(x):
    if x < 0:
        seen.append(x)  # 副作用
        return False
    return True


data = [1, -2, 3, -4, 5]
result = filter(keep_and_record, data)
# 此时 seen 仍然是 []，因为 filter 还没被消费！
print(seen)
# 输出：[]

# 只有消费了迭代器，副作用才会发生
list(result)
print(seen)
# 输出：[-2, -4]
```

惰性求值让副作用的执行时机变得不直观：消费之前什么都不发生，消费之后才"突然"执行。判断函数应保持无副作用，需要副作用时改用显式循环。

## 4. 原理

### 4.1 filter 对象的本质

在 Python 3 中，`filter(func, iterable)` 返回的是一个 `filter` 类型的对象，它实现了迭代器协议（`__iter__` 和 `__next__`）。换句话说，`filter` 对象本身就是一个迭代器。

可以用类型验证这一点：

```python
f = filter(lambda x: x, [1, 2, 3])
print(type(f))
# 输出：<class 'filter'>

print(iter(f) is f)
# 输出：True  # 迭代器的 __iter__ 返回自身

print(next(f))
# 输出：1
```

`iter(f) is f` 为 `True`，说明 `filter` 对象的 `__iter__` 返回的是自己，这是迭代器的标志性特征。`next()` 可以直接在它上面调用，每调一次就推进过滤一步。

### 4.2 惰性求值机制

`filter` 的惰性来自它的 `__next__` 实现。粗略地说，它的迭代逻辑等价于下面这段伪代码：

```python
# filter 迭代器的 __next__ 行为（伪码示意）
class filter:
    def __init__(self, func, iterable):
        self.func = func
        self.iterator = iter(iterable)

    def __iter__(self):
        return self

    def __next__(self):
        # 每次被 next() 调用时，循环往后取元素
        while True:
            element = next(self.iterator)  # 从底层迭代器取一个
            if self.func is None:
                verdict = bool(element)    # func=None 时用元素本身
            else:
                verdict = bool(self.func(element))  # 否则用函数返回值
            if verdict:
                return element            # 为真就 Return，交给调用方
        # 底层迭代器抛 StopIteration 时，next(self.iterator) 会向上抛
        # filter 也跟着结束迭代
```

关键点：`__next__` 每次被调用，`filter` 才会从底层迭代器拉取下一个元素并判断。如果判断为假，它会继续拉下一个，直到找到一个判断为真的元素才返回；如果底层迭代器耗尽（抛 `StopIteration`），`filter` 也一并停止。

这就是惰性的来源：没有 `next()` 触发，`filter` 什么都不会做。消费多少次，就判断多少次。所以你可以随时 `break` 提前停，后面没被取到的元素根本不会被处理。

来观察这个行为：

```python
def trace(n):
    print(f"  判断 {n}")
    return n % 2 == 0


nums = [1, 2, 3, 4, 5]
f = filter(trace, nums)

# 第一次 next：会判断 1（丢）、2（留），返回 2
print("第一次:", next(f))
# 输出：
#   判断 1
#   判断 2
# 第一次: 2

# 第二次 next：从 3 继续，判断 3（丢）、4（留），返回 4
print("第二次:", next(f))
# 输出：
#   判断 3
#   判断 4
# 第二次: 4
```

`print` 的输出顺序证明：`trace` 只在 `next()` 被调用时才执行，而且跳过的元素（1、3）也会被真实调用一次（只是结果为假被丢弃）。`filter` 不是"先全部判断好再返回"，而是"边取边判"。

### 4.3 func=None 时的真值过滤实现

当 `func` 为 `None` 时，`filter` 跳过"调用函数"这一步，直接用 `bool(element)` 作为去留判定。这跟"判断函数返回 `element` 本身"是等价的：

```python
# 这两行在效果上完全等价
filter(None, seq)
filter(lambda x: x, seq)
```

区别只在于前者省了一次函数调用，效率略高。底层实现里，`func is None` 是一个分支判断：走到这个分支就直接 `bool(element)`，不走函数调用路径。

这就是为什么 `filter(None, seq)` 总是等价于 `[x for x in seq if x]`（或 `x for x in seq if x` 的生成器版本）——它们用的都是同一个"元素本身的真值"判定。

来观察 `bool` 的判定规则：

```python
# filter(None, ...) 的保留规则就是 bool(element) 为真
print(bool(0))        # False → 被 filter(None) 丢弃
print(bool(0.0))      # False
print(bool(""))       # False
print(bool([]))       # False
print(bool({}))       # False
print(bool(None))     # False
print(bool(False))    # False
print(bool(1))        # True  → 保留
print(bool("a"))      # True
print(bool([0]))      # True  # 非空容器，哪怕里面只有 0
print(bool(3.14))     # True
```

`bool(x)` 在背后调用的是 `x.__bool__()`（优先），如果没有定义 `__bool__` 就退而用 `x.__len__()`，长度非零即为真。如果两者都没定义，对象默认为真。所以自定义类的实例是否会被 `filter(None, ...)` 保留，取决于它的 `__bool__` 或 `__len__` 实现：

```python
class Empty:
    def __bool__(self):
        return False


class Full:
    def __bool__(self):
        return True


items = [Empty(), Full(), Empty(), Full()]
kept = list(filter(None, items))
print(len(kept))
# 输出：2  # 只保留了两个 Full 实例
```

### 4.4 与 Python 2 返回列表的历史差异

在 Python 2 中，`filter` 返回的不是迭代器，而是直接返回一个列表（如果传入的是列表/元组/字符串，就返回对应类型的容器）：

```python
# Python 2 的行为（仅供对照，不要在 Python 3 里期望同样结果）
# filter(lambda x: x % 2 == 0, [1, 2, 3, 4])  → [2, 4]   # 返回 list
# filter(None, [0, 1, 2])                       → [1, 2]   # 返回 list
# filter(str.isupper, "aBcD")                   → "BD"     # 返回 str
```

Python 3 把 `filter` 改为返回迭代器，原因是：

1. **惰性更省内存**：处理大序列时不必一次性把全部结果放进列表，按需产出。
2. **与 `map`、`zip` 统一**：这些"组合/变换"工具在 Python 3 中都改成了迭代器风格，避免无谓的中间列表。
3. **强制显式消费**：调用方必须显式 `list()` 或迭代，意图更清晰，也避免"我以为是个列表但其实是一次性迭代器"的隐藏 bug。

这个改动带来的迁移影响是：旧的 Python 2 代码里直接把 `filter(...)` 当列表用的地方，在 Python 3 会变成迭代器，第二次迭代就是空的。迁移时需要在外面包一层 `list()`。反过来，Python 3 的代码如果习惯性地以为结果可以反复遍历，也会踩同样的坑。

了解这个历史差异，能帮你理解为什么 `filter` 必须显式消费，以及为什么 PEP 8 风格上更推荐"能直接出列表的列表推导式"——列表推导式的语义在 Python 2 和 Python 3 里都一样（总是返回列表），没有"版本不同导致行为不同"的坑。

### 4.5 filter 与其它迭代器工具的协作关系

`filter` 属于 Python 内置的三个"迭代器工具"之一，和它一组的还有 `map` 和 `zip`。它们的共同特征是：

- 接收可迭代对象作为输入。
- 返回迭代器（Python 3）。
- 惰性求值、一次性消费。
- 底层都用 C 实现，迭代开销很低。

`filter` 在这条工具链里的角色是"筛选"——保留部分元素；`map` 是"变换"——把每个元素变成另一个值；`zip` 是"配对"——把多个序列按位置拼成元组。三者都能互相嵌套，组成处理管道：

```python
# 一个综合管道：zip 配对 → filter 筛选 → map 变换
names = ["Alice", "Bob", "Carol", "Dave"]
scores = [88, 45, 72, 30]

# 1. zip 成 (name, score) 对
pairs = zip(names, scores)
# 2. filter 出及格的
passed = filter(lambda p: p[1] >= 60, pairs)
# 3. map 成 "name: grade" 字符串
lines = map(lambda p: f"{p[0]}: {'PASS' if p[1] >= 85 else 'OK'}", passed)

print(list(lines))
# 输出：['Alice: PASS', 'Carol: OK']
```

这种管道的好处在于：每一步都是迭代器，不会产生中间列表，整条链路在最终 `list()` 消费时才一次性"流"过去一遍。

## 5. 总结

### 5.1 本文内容要点

- `filter(func, iterable)` 按判断函数的返回真值保留元素，返回 `filter` 迭代器；`filter` 是惰性的、一次性的，必须消费才能拿到结果。
- `func` 为 `None` 时等价于"用元素自身的真值过滤"，会把 `0`、`""`、`None`、`False`、空容器等 falsy 值全部丢掉；这是去掉空值的招牌写法。
- 判断函数的返回值做"真值判定"而非严格 `== True`，所以返回 `1`、`"x"`、`[1]` 等任何 truthy 值都能保留对应元素，返回 `0`、`""`、`[]` 等任何 falsy 值都会丢弃。
- `filter` 接收任何可迭代对象（列表、字符串、字典、生成器、文件对象等），返回统一是迭代器，与输入类型无关。
- 列表推导式 `[x for x in seq if cond]` 是 `filter` + lambda 的可读替代；生成器表达式 `(x for x in seq if cond)` 是 `filter` 的惰性替代。条件简单时优先用推导式/生成器表达式，已有命名函数或做 `None` 真值过滤时用 `filter` 更顺。
- `filter` 和 `map`、`zip` 同属迭代器工具，都能串成惰性管道，配合 `itertools.islice` 等可以做到"按需产出、提前终止"，在大数据量时省内存。
- `filter` 和 `fnmatch`、`re.compile().match`、`str.strip` 等条件函数配合，可以做通配符过滤、正则行过滤、去空白行等场景，写法简洁。
- 典型陷阱：`filter` 对象不消费就看不到内容、二次迭代会空、判断函数返回位置数字（如 `find`）会因 0 被误判为假、`filter(None, ...)` 会把 `0` 也去掉不适合"只去 None"。

### 5.2 读完应能掌握的能力

- 能说明 `filter(func, iterable)` 的两个参数各自作用、返回值类型，并解释为什么必须用 `list()` 或 `for` 消费才能拿到结果。
- 能说出 `func=None` 时的真值过滤行为，列出常见 falsy 值，并区分"去 None"和"去空值"两种需求该用哪种写法。
- 能在 `filter`、列表推导式、生成器表达式之间根据场景正确取舍，并说出各自的可读性和惰性差异。
- 能把 `filter` 和 `map` 串成惰性管道，配合 `break` 或 `itertools.islice` 实现提前终止，避免大数据量的无用计算。
- 能识别 `str.find` 这类"返回位置"的 API 被误用为判断条件时带来的 bug，并改用返回布尔值的 API。
- 能解释 `filter` 迭代器的惰性求值机制（`__next__` 边取边判、一次性消费），以及 Python 2 返回列表、Python 3 返回迭代器的历史差异。
