---
group:
  title: 【09】条件分支
  order: 9
order: 9
title: 成员与身份运算符在条件中
nav:
  title: Python基础
  order: 1
---

# 成员与身份运算符在条件中

## 1. 介绍

### 1.1 什么是成员与身份运算符

条件判断里的"情况"不只有大小关系和相等关系两类。还有一种很常见的判断："这个值在不在这个集合里"、"用户名在不在已注册名单里"、"某字符在不在字符串里"——这类"是否属于/包含"的判断，由**成员运算符** `in` 和 `not in` 负责。另外还有一类关于"是不是同一个对象"的判断：两个变量是否指向内存里的同一个东西——这类**身份判断**由 `is` 和 `is not` 负责。

这四个运算符分两组：`in`/`not in` 是成员运算符，判断元素与容器的包含关系；`is`/`is not` 是身份运算符，判断两个对象是否是同一个对象（同一性）。它们和比较运算符一起构成 `if` 条件的"判断原料"，但侧重点不同——比较运算符比"值的关系"，成员运算符比"包含关系"，身份运算符比"是不是同一个对象"。

四个运算符都返回 `True`/`False`，可以直接放进条件里。其中 `is` 和 `==` 是最容易混的一组：很多人以为它们等价，实际上 `is` 比"是不是同一对象"，`==` 比"值相不相等"，行为差异很大，用错会埋下难复现的 bug。

**一句话定位**：成员运算符 `in`/`not in` 判断元素与容器的包含关系，身份运算符 `is`/`is not` 判断两个对象是不是同一个对象；后者最典型的用途是判断 `None`。

### 1.2 最简示例

先用一个最小例子看清这两组运算符在条件里怎么用。

**成员判断 `in`**：判断水果在不在列表里。

```python
fruits = ["apple", "banana", "pear"]

if "apple" in fruits:            # apple 在列表里 → True
    print("有苹果")
else:
    print("没苹果")
```

**运行结果**：

```text
有苹果
```

**身份判断 `is`**：判断变量是不是 `None`。

```python
result = None

if result is None:              # result 确实是 None 这个单例 → True
    print("没有结果")
else:
    print("有结果")
```

**运行结果**：

```text
没有结果
```

`"apple" in fruits` 判断"apple"是不是 `fruits` 容器里的一个元素，`result is None` 判断 `result` 是否指向 `None` 这个单例对象。前者问"包含不包含"，后者问"是不是同一个对象"——这是两组运算符的本质区别。

### 1.3 四个运算符速览

四个运算符整体如下，先建个总印象，后面逐个展开：

| 运算符 | 类别 | 含义 | 典型场景 |
|--------|------|------|---------|
| `in` | 成员 | 元素在容器中 → `True` | 判断值在不在集合、子串在不在字符串 |
| `not in` | 成员 | 元素不在容器中 → `True` | 排除非法值、判断没出现过 |
| `is` | 身份 | 两个对象是同一个 → `True` | 判断 `None`、判断是不是同一可变对象 |
| `is not` | 身份 | 两个对象不是同一个 → `True` | 判断不是 `None`、判断两对象不同 |

几个要点先记在心里，后面逐一展开：

- `in` 对**不同容器行为不同**：`dict`/`set` 是高效查询，`list`/`tuple` 是遍历；`dict` 默认查键，`str` 查的是子串。
- `is` 比"是不是同一个对象"（内存地址相同），`==` 比"值相不相等"——两者经常结果一样，但含义不同，用错会出 bug。
- 判断 `None` 用 `is None` 是 Python 的约定，既快又不会被自定义 `__eq__` 误判。
- 小整数缓存（`-5`~`256`）会让 `is` 在整数上"碰巧"为 `True`，但这不可依赖——比数值相等一律用 `==`。
- 四个运算符都返回 `True`/`False`，可直接当条件，也能存变量复用。

## 2. 核心内容

### 2.1 in：判断元素是否在容器中

`in` 判断左边元素是否出现在右边容器中，在则返回 `True`，不在返回 `False`。它是最常用的"包含判断"工具。

**列表成员判断**：

```python
fruits = ["apple", "banana", "pear"]

print("apple" in fruits)        # True，在列表里
print("grape" in fruits)        # False，不在
```

**运行结果**：

```text
True
False
```

`in` 会遍历列表逐个比对，找到就返回 `True`。这不是高效的查找方式（列表是 O(n)），但对小列表足够用。

**字符串成员判断（子串包含）**：

```python
text = "hello python"

print("python" in text)        # True，'python' 是子串
print("world" not in text)      # True，'world' 不在
```

**运行结果**：

```text
True
True
```

字符串的 `in` 判断的是**子串包含**——左边的字符串是不是右边的连续子串。`"python" in text` 为 `True`，因为 "python" 是 "hello python" 的一段。注意它不是"逐字符判断"，而是"子串匹配"。

**字典成员判断（默认查键）**：

```python
user = {"name": "张三", "age": 18}

print("name" in user)           # True，'name' 是键
print("age" in user)            # True，'age' 是键
print(18 in user)               # False！18 是值不是键
print(18 in user.values())      # True，查值要用 .values()
```

**运行结果**：

```text
True
True
False
True
```

字典的 `in` 默认查的是**键**，不是值。`18 in user` 为 `False`，因为 18 是值不是键。要查值必须显式用 `user.values()`，要查键值对用 `user.items()`。这是字典 `in` 最容易踩的坑，务必记住"dict 的 in 查键"。

**集合成员判断**：

```python
tags = {"vip", "active"}

print("vip" in tags)           # True
```

**运行结果**：

```text
True
```

集合的 `in` 是高效的 O(1) 查询，比列表快得多。需要频繁"判断某值在不在一大堆值里"时，把容器从列表换成集合，性能会有质的提升。

### 2.2 not in：判断元素不在容器中

`not in` 是 `in` 的反面：元素不在容器中返回 `True`，在则返回 `False`。它和 `in` 一样常用，常用于"排除"和"没出现过"的判断。

```python
fruits = ["apple", "banana", "pear"]

print("grape" in fruits)            # False
print("grape" not in fruits)        # True，不在
print("apple" not in fruits)        # False，在
```

**运行结果**：

```text
False
True
False
```

`not in` 就是 `not (x in container)` 的简写，语义更直接：`"grape" not in fruits` 读起来就是"grape 不在 fruits 里"。在条件里做"排除非法值"的判断时，`not in` 比 `in` 配 `else` 更自然。

**典型用法：排除非法值集合**：

```python
allowed = {"expand", "save", "load"}
action = "delete"

if action not in allowed:           # 删除不在允许操作里
    print(f"非法操作：{action}")
else:
    print("执行操作")
```

**运行结果**：

```text
非法操作：delete
```

把"允许的操作"放进一个集合，用 `not in` 一行就能判断某个动作是否越界。这比写一长串 `if action != "expand" and action != "save" ...` 清晰得多。

### 2.3 in 在不同容器上的行为

`in` 对不同容器有不同行为，既表现查的是"键"还是"值"，也表现查询效率。把这些差异梳理清楚，才能用对 `in`。

**dict 查键、查值、查键值对**：

```python
user = {"name": "张三", "age": 18}

print("name" in user)                       # True，查键
print("张三" in user)                       # False，'张三' 是值不是键
print("张三" in user.values())              # True，查值
print(("name", "张三") in user.items())     # True，查键值对
```

**运行结果**：

```text
True
False
True
True
```

记住 dict 的 `in` 三种用法：默认查键、`.values()` 查值、`.items()` 查键值对元组。需要哪一个就调对应方法。

**str 查的是子串而非成员元素**：

```python
text = "abc"

print("ab" in text)         # True，'ab' 是连续子串
print("ac" in text)         # False，'ac' 不是连续子串
```

**运行结果**：

```text
True
False
```

字符串的 `in` 比"子串"，不是"成员字符"——`"ab" in "abc"` 为 `True`（连续子串），但 `"ac" in "abc"` 为 `False`（不连续）。要判断"某字符是不是字符串的字符之一"，写 `set("abc")` 转集合再用 `in` 更准确，但绝大多数需求都是判子串，直接用 `in` 即可。

**list vs set 的查询效率**：

```python
big_list = list(range(100000))
big_set = set(big_list)
target = 99999

print(target in big_set)    # True，set 是 O(1)，秒查
print(target in big_list)   # True，list 是 O(n)，要遍历到末尾
```

**运行结果**：

```text
True
True
```

两者结果都为 `True`，但性能天差地别：`set` 是 O(1) 哈希查询，无论集合多大都能秒查；`list` 是 O(n) 遍历，目标在末尾时要扫遍全表。**当容器主要用于"判断元素在不在"且数据量大时，优先用 `set`**——把 `big_list` 换成 `big_set`，同一段查找从"扫十万个元素"变成"一次哈希定位"。

把 `in` 在各容器上的行为汇总成一张表：

| 容器 | `in` 查的是什么 | 时间复杂度 | 备注 |
|------|----------------|-----------|------|
| `list`/`tuple` | 元素 | O(n) 遍历 | 大集合慢 |
| `str` | 子串 | O(n) 子串匹配 | 是子串不是字符 |
| `dict` | 键 | O(1) | 查值用 `.values()` |
| `set` | 元素 | O(1) | 大集合首选 |

### 2.4 is：判断两个对象是否同一

`is` 判断两个变量是否指向**同一个对象**——不是"值相等"，而是"内存里是不是同一份东西"。它的本质是比较对象的身份标识（`id()`），地址相同才算同一。

**is 与 == 的根本区别**：

```python
a = [1, 2, 3]
b = [1, 2, 3]

print(a == b)          # True，两个列表内容相同，值相等
print(a is b)          # False，但它们是两个不同的列表对象
print(id(a) == id(b))  # False，内存地址不同
print(a is a)          # True，自己和自己当然是同一对象
```

**运行结果**：

```text
True
False
False
True
```

这是理解 `is` 的关键例子：`a` 和 `b` 是两个独立的列表，内容碰巧一样，所以 `==` 为 `True`（值相等），但 `is` 为 `False`（不是同一个对象）。`id(a)` 和 `id(b)` 不同，正说明它们在内存里是两份独立的数据。

**赋值后是同一对象**：

```python
a = [1, 2, 3]
c = a            # c 和 a 指向同一个列表
print(c is a)    # True，同一对象，改 c 就是改 a
```

**运行结果**：

```text
True
```

把 `a` 赋值给 `c`，`c` 并不是复制了一份列表，而是指向了同一个对象——`c is a` 为 `True`。这时候改 `c` 就等于改 `a`，因为它们本来就是一份东西。这正是"同一性"的含义：`is` 关注"是不是同一份"，而非"内容像不像"。

### 2.5 is not：判断两个对象不同一

`is not` 是 `is` 的反面：两个变量不是同一个对象时返回 `True`，是同一对象返回 `False`。它最常用的是 `is not None`——判断"不是 None"。

```python
result = 0

print(result is not None)     # True，0 是一个真实对象，不是 None
```

**运行结果**：

```text
True
```

`is not None` 是 Python 里判断"变量不是 None"的事实标准写法。`result = 0` 时它为 `True`，因为 0 是一个真实的整数对象，和 `None` 这个单例不是同一对象。注意它正确区分了"0（有值且为 0）"和"`None`（没有值）"——这正是判断 `None` 用 `is` 而非 `==` 的好处之一。

### 2.6 is 与 == 的根本区别

`is` 和 `==` 是最容易混的一组运算符。区别只有一句话：**`is` 比"是不是同一个对象"，`==` 比"值相不相等"**。但这句话背后藏着不少坑，得掰开揉碎讲清楚。

**值相等不一定同一**：上面 `a = [1,2,3]`、`b = [1,2,3]` 的例子已经说明——`==` 为 `True` 但 `is` 为 `False`。两个独立创建的列表，内容一样但不是同一对象。

**同一一定值相等**（大多数情况）：如果两个变量指向同一对象，它们的值自然相等，所以 `is` 为 `True` 时 `==` 一般也为 `True`。但有例外——自定义类若把 `__eq__` 重写成总返回 `False`，那同一对象的 `==` 也可能为 `False`。这种极端情况罕见，但说明 `is` 和 `==` 是两套独立机制。

**小整数的特殊情况**：对于整数，很多时候 `is` 和 `==` 结果一样，让人误以为它们等价：

```python
x = 256
y = 256
print(x is y)      # True，小整数被缓存，x 和 y 是同一对象

x = 257
y = 257
print(x is y)      # 缓存外，结果实现相关，不应依赖
print(x == y)      # 比相等永远用 ==
```

**运行结果**：

```text
True
True
True
```

`256` 在 CPython 的小整数缓存范围（`-5`~`256`）内，`x` 和 `y` 指向同一对象，`is` 为 `True`。但 `257` 超出缓存范围，`is` 的结果**实现相关**——这里碰巧因常量折叠为 `True`，换别的构造方式可能就是 `False`。正因为不可靠，**比数值相等永远用 `==`，不能用 `is`**。把下面这条规则刻在脑子里：`is` 只用来判断身份（如 `None`、哨兵值、是不是同一可变对象），数值/字符串/列表的"相等"判断一律用 `==`。

**可变容器 is 永远分隔**：每次创建可变容器（列表、字典、集合）都是新对象，所以两个字面量列表 `is` 永远为 `False`：

```python
l1 = [1, 2]
l2 = [1, 2]
print(l1 == l2)     # True，内容相同
print(l1 is l2)     # False，两个不同对象
```

**运行结果**：

```text
True
False
```

### 2.7 is None / is not None 惯用法

判断 `None` 用 `is` 而非 `==`，是 Python 社区的约定，PEP 8 也明确推荐这么做。原因有三：`None` 是单例、`is` 比 `==` 快、且不受自定义 `__eq__` 误判。

**基本用法**：

```python
result = None
print(result is None)        # True
print(result is not None)    # False

result = 0
print(result is None)        # False，0 不是 None
```

**运行结果**：

```text
True
False
False
```

**哨兵默认值判断**：当函数参数用 `None` 当默认值表示"用户没传"时，必须用 `is None` 来区分"没传"和"传了 0/空串"：

```python
def greet(name=None):
    if name is None:            # 只有真的没传参数时才用默认
        return "你好，匿名"
    return f"你好，{name}"

print(greet())              # 没传参数 → 用默认
print(greet("张三"))         # 传了 → 用真实值
```

**运行结果**：

```text
你好，匿名
你好，张三
```

如果这里用 `== None` 或 `if not name` 来判断，`greet(0)` 或 `greet("")` 这种合法但"假值"的输入会被误判成"没传参数"——`is None` 精确区分了"None（没传）"和"0/空串（传了且为假值）"，这是它最不可替代的价值。

**为什么不用 `== None`**：自定义类若重写了 `__eq__`，`== None` 可能意外命中或报错，而 `is None` 永远只看身份，不受影响：

```python
class Weird:
    def __eq__(self, other):
        return True              # 重写后和谁都"相等"

w = Weird()
print(w == None)        # True，被 __eq__ 误判为相等
print(w is None)        # False，is 看身份，不受 __eq__ 影响
```

**运行结果**：

```text
True
False
```

`w == None` 为 `True` 是个严重 bug——明明不是 `None` 却被当成 `None`。`w is None` 为 `False` 才是正确判断。所以只要判断"是不是 None"，就用 `is None`，别用 `== None`。

### 2.8 典型应用场景

成员与身份运算符的应用模式可以照搬到很多业务场景。

#### 2.8.1 集合包含判断

判断一个值在不在一组允许值里，用 `in` 配集合：

```python
allowed_status = {"paid", "shipped", "delivered"}
order_status = "cancelled"

if order_status in allowed_status:
    print("有效状态")
else:
    print("无效状态")
```

**运行结果**：

```text
无效状态
```

把允许的值放进集合，用 `in` 一次判断；想新增允许值只需改集合，不用动判断逻辑。这比写 `if s == "paid" or s == "shipped" or ...` 清晰太多。

#### 2.8.2 字符串包含子串

判断一段文本是否包含关键词，用 `in`：

```python
email = "user@example.com"

if "@" in email:
    print("格式中含 @，可能是邮箱")
else:
    print("不像邮箱")
```

**运行结果**：

```text
格式中含 @，可能是邮箱
```

字符串 `in` 比子串，做关键词过滤、格式初判都很顺手。需要精确匹配邮箱格式时还得用正则，但"快速排雷" `in` 最方便。

#### 2.8.3 字典键存在判断

判断字典里有没有某个键，用 `in`（注意它查键不查值）：

```python
config = {"host": "localhost", "port": 8080}

if "port" in config:
    print(f"使用配置端口：{config['port']}")
else:
    print("未配置端口，用默认")
```

**运行结果**：

```text
使用配置端口：8080
```

`"port" in config` 先确认键存在，再安全地取 `config["port"]`，避免 `KeyError`。这是处理可选配置键的标准写法。

#### 2.8.4 判断 None / 哨兵值

用一个特殊对象当"没传"的哨兵，用 `is` 精确区分：

```python
_MISSING = object()

def query(key, default=_MISSING):
    if default is _MISSING:        # 没传 default → 必须有 key
        return f"必填参数 {key}"
    return f"{key}={default}"

print(query("host"))
print(query("host", 8080))
print(query("host", None))         # 显式传 None，和没传要分开
```

**运行结果**：

```text
必填参数 host
host=8080
host=None
```

用 `object()` 造一个唯一哨兵，`is _MISSING` 精确区分"没传 default"和"传了 `None`"——`query("host", None)` 显式传了 `None`，不会被误判成没传。这种"哨兵 + `is`"是处理可空参数的惯用法。

#### 2.8.5 排除非法值集合

用 `not in` 把非法值挡在门外：

```python
banned_words = {"spam", "scam", "abuse"}
comment = "这个网站真是 scam"

if any(w in comment for w in banned_words):
    print("评论含违禁词，已屏蔽")
else:
    print("评论通过")
```

**运行结果**：

```text
评论含违禁词，已屏蔽
```

`not in` 配合 `any`/`for` 能一行判断"文本里有没有任何一个违禁词"。这种"排除非法集合"的写法比逐个 `if ... or ...` 紧凑得多。

## 3. 最佳实践

### 3.1 判 None 用 is 而非 ==

判断"是不是 `None`"是 `is` 最不可替代的用途，PEP 8 也明确推荐用 `is None`/`is not None`，而不是 `== None`/`!= None`。

```python
value = None

# ❌ 不推荐：用 == 判 None 易被自定义 __eq__ 误判，且语义上 None 该比身份
if value == None:
    print("是 None")

# ✅ 推荐：is None 既快又精确，是 Python 社区约定
if value is None:
    print("是 None")
```

**运行结果**：

```text
是 None
```

`is None` 比 `== None` 快（不用调用 `__eq__`，直接比内存地址），也更安全（自定义类重写 `__eq__` 不会干扰判断）。把这条当成铁律：**判断 `None`，一律 `is None`**。

### 3.2 判值相等用 == 而非 is

`is` 只该用于"身份"判断（`None`、哨兵、是不是同一可变对象）。数值、字符串、列表的"内容相等"判断必须用 `==`，用 `is` 会踩小整数缓存/字符串驻留的坑，写出难复现的 bug。

```python
# ❌ 不推荐：用 is 比较数值，依赖缓存出 bug
a = 300
b = 300
if a is b:          # 缓存外，结果实现相关，可能 True 也可能 False
    print("相等")

# ✅ 推荐：比相等永远用 ==
a = 300
b = 300
if a == b:
    print("相等")
```

**运行结果**：

```text
相等
```

`is` 比较数值时结果可能因"是不是缓存内"而变，这种"在缓存内碰巧对、超出缓存就错"的 bug 极难发现。用 `==` 永远按值比，结果稳定可预期。记住：**比相等用 `==`，比身份用 `is`，各司其职**。

### 3.3 判集合包含用 in 而非自己遍历

判断"元素在不在容器里"，直接用 `in`，别自己写 `for` 循环逐个比。`in` 既简洁又可能更高效（对 `set`/`dict` 是 O(1)）。

```python
fruits = ["apple", "banana", "pear"]
target = "banana"

# ❌ 不推荐：自己写 for 循环，啰嗦且 list 上是 O(n)
found = False
for f in fruits:
    if f == target:
        found = True
        break
print(found)

# ✅ 推荐：一行 in 搞定
print(target in fruits)
```

**运行结果**：

```text
True
True
```

`in` 把"遍历+比较"封装成一句，可读性高，还能让容器类型自己优化查询（`set`/`dict` 的 `in` 直接走哈希 O(1)）。手写循环既慢又容易写错 break 条件。

**数据量大时换成集合**：当容器主要服务于"判断在不在"且数据量大时，把 `list` 换成 `set`：

```python
# ❌ 不推荐：用大列表做频繁 in 判断，每次 O(n)
users = ["alice", "bob", "carol", "..."]  # 一万个用户
if name in users:        # 每次都要遍历

# ✅ 推荐：用集合，每次 O(1)
users = {"alice", "bob", "carol", "..."}  # 转成 set
if name in users:        # 一次哈希定位
```

集合的 `in` 是 O(1)，列表的 `in` 是 O(n)，数据量大时性能差几个数量级。容器用途是"成员判断"时，优先 `set`。

### 3.4 不要依赖小整数缓存做 is 比较

CPython 缓存了 `-5`~`256` 的小整数，让这个范围内的 `is` 总为 `True`；超出范围则结果实现相关。**绝不能依赖这个缓存写代码**——同一份代码换个 Python 实现或换个数值就可能变。

```python
# ❌ 不推荐：用 is 比较整数，碰巧对就以为总对
flag = 200
if flag is 200:        # 缓存内，碰巧 True
    print("是 200")

# ✅ 推荐：比数值相等一律用 ==，与缓存无关
flag = 200
if flag == 200:        # 永远正确
    print("是 200")
```

**运行结果**：

```text
是 200
```

小整数缓存是 CPython 的实现细节，不是语言保证——PyPy、Jython 等其他实现缓存范围可能不同。依赖它写 `is` 比较，在缓存内"碰巧对"会给你虚假的安全感，一旦数值超出缓存或换实现就崩。把它当成"别踩的坑"，永远用 `==` 比数值。

### 3.5 常见错误模式速查表

把成员与身份运算符里高频踩的坑汇总成一张速查表，写代码时可以对照检查：

| 错误模式 | 错误示例 | 后果 | 正确做法 |
|---------|---------|------|---------|
| 判 None 用 `==` | `if x == None:` | 被自定义 `__eq__` 误判 | 用 `if x is None:` |
| 判值相等用 `is` | `if a is b:`（比数值/字符串） | 依赖缓存，难复现 bug | 用 `==` 比相等 |
| dict 的 in 查值 | `18 in user`（想查 18 在不在值里） | 返回 `False`，查的是键 | 用 `user.values()` 查值 |
| 把 str 的 in 当成字符判断 | `'ac' in 'abc'` 期望 `True` | 取的是子串，非连续返回 False | 想判字符用 `set(text)` 转 |
| 大列表频繁 in 判断 | `name in big_list` | O(n)，慢 | 换成 `set`，O(1) |
| 依赖小整数缓存 | `if x is 200:` | 超出缓存或换实现就错 | 用 `==` 比数值 |
| 用 is 比较可变容器 | `[1,2] is [1,2]` 期望 True | 每次新建对象，永远 False | 用 `==` 比内容 |
| 把 in 顺序写反 | `fruits in 'apple'` | 容器在左元素在右，反了 | `in 左边是元素，右边是容器` |

## 4. 原理

### 4.1 in 的底层：__contains__ 与遍历

`in` 运算符背后对应的是容器的 `__contains__` 方法。当写下 `x in container` 时，Python 实际上调用 `container.__contains__(x)`——容器类型自己决定怎么判断"在不在"，这正是不同容器 `in` 行为和性能差异的根源。

```python
print([1, 2, 3].__contains__(2))     # True，list 实现了遍历式 __contains__
print({"a": 1}.__contains__("a"))    # True，dict 的 __contains__ 查键
print("abc".__contains__("ab"))      # True，str 的 __contains__ 查子串
```

**运行结果**：

```text
True
True
True
```

每种容器的 `__contains__` 实现不同：

- **`list`/`tuple`**：遍历式匹配，从左到右逐个比对，O(n)。
- **`dict`/`set`**：基于哈希表，直接按哈希定位，O(1)。
- **`str`**：子串匹配，算法是 O(n) 量级但优化过，比的是"子串"而非"成员字符"。

所以"把 `list` 换成 `set` 提升 `in` 性能"，本质是换了 `__contains__` 的实现——从遍历算法换成哈希查表。自定义类想让自己的对象支持 `in`，实现 `__contains__` 即可；没实现的话，`in` 会退回到遍历（用 `__iter__`）或抛 `TypeError`。

### 4.2 is 的底层：比较 id() 内存地址

`is` 运算符的本质是**比较两个对象的身份标识**，也就是 `id()` 返回的内存地址。`a is b` 等价于 `id(a) == id(b)`——地址相同才算"同一对象"。

```python
a = [1, 2]
b = a
print(id(a))              # 两者的内存地址一样
print(id(b))
print(id(a) == id(b))     # True，和 a is b 等价
print(a is b)             # True
```

**运行结果**：

```text
140234567890240
140234567890240
True
True
```

（地址是虚拟的，实际值每次运行会变，但 `id(a) == id(b)` 恒为 `True`。）

`id()` 返回的是对象在内存中的唯一标识，CPython 里就是对象的内存地址。两个变量 `is` 为 `True`，意味着它们指向同一块内存；`is` 为 `False`，意味着它们是两块各自独立的内存，哪怕内容一模一样。这和 `==` 形成鲜明对比：`==` 调用对象的 `__eq__` 比"值相不相等"，是逻辑层面的相等；`is` 比"地址一不一样"，是物理层面的同一。所以 `is` 比 `==` 快——不用调任何方法，直接比一个整数。

### 4.3 小整数缓存与字符串驻留

`is` 比较整数时"碰巧为 True"的现象，根源在 CPython 的**小整数缓存**和**字符串驻留**机制。

**小整数缓存**：CPython 在启动时预先创建了 `-5`~`256` 这 262 个整数对象，并缓存起来。所有用到这些整数的代码，拿到的都是同一批缓存对象——所以 `a = 256; b = 256` 时 `a is b` 为 `True`，因为它们指向同一份缓存。这个设计是为了让小整数（最高频使用的整数）反复使用时不必反复创建对象。

**字符串驻留**：CPython 也会把一些"看起来像标识符"的短字符串缓存起来，相同内容的字符串字面量指向同一对象。所以 `'hello' is 'hello'` 往往为 `True`。但驻留规则比小整数缓存复杂得多——含空格、特殊字符的字符串不一定被驻留，所以字符串的 `is` 结果不可靠。

```python
# 小整数缓存：缓存内 is 必为 True
print(10 is 10)          # True
print(256 is 256)        # True
print(-5 is -5)          # True

# 字符串驻留：短字符串常被驻留
s1 = "hello"
s2 = "hello"
print(s1 is s2)          # True，常被驻留
```

**运行结果**：

```text
True
True
True
True
```

理解这两条机制的意义在于**知道哪里会有坑**：小整数和短字符串的 `is` 看起来"和 `==` 一样"，会让人误以为 `is` 能比相等。但缓存范围有限、规则实现相关，一旦数值超出缓存或字符串不被驻留，`is` 就会"突变"为 `False`，埋下难复现的 bug。所以记住一条总原则：**小整数缓存和字符串驻留是实现细节，不是用来简化比较的——比相等永远用 `==`，`is` 只留给身份判断**。

## 5. 总结

本文围绕成员与身份运算符在条件中的应用展开，主要介绍了以下内容：

- 成员与身份运算符是什么：`in`/`not in` 判断元素与容器的包含关系，`is`/`is not` 判断两个对象是不是同一个对象，都返回 `True`/`False`
- 四个运算符速览：`in` 在容器中、`not in` 不在、`is` 是同一对象、`is not` 不是同一对象
- `in` 成员判断：可用于 list/tuple/str/dict/set，对不同容器行为不同
- `not in`：`in` 的反面，常用于排除非法值、判断没出现过
- `in` 在不同容器上的行为：dict 默认查键、str 查子串、set/dict 是 O(1)、list/tuple 是 O(n)；查值用 `.values()`、查键值对用 `.items()`
- `is` 身份判断：比"是不是同一对象"（内存地址相同），不是"值相等"
- `is not`：判断不同一，最常用 `is not None` 判非 None
- `is` 与 `==` 的根本区别：`is` 比身份、`==` 比值相等；值相等不一定同一，同一一般值相等
- `is None`/`is not None` 惯用法：判 `None` 用 `is` 是约定，既快又安全、不被自定义 `__eq__` 误判，能精确区分"None"和"0/空串"等假值
- 典型场景：集合包含判断、字符串包含子串、字典键存在判断、None/哨兵值判断、排除非法值集合，都有可照搬写法
- 最佳实践：判 None 用 `is`、判值相等用 `==`、判包含用 `in` 而非手写循环、大集合成员判断优先用 `set`、别依赖小整数缓存做 `is`
- 原理：`in` 底层调用容器 `__contains__`，不同容器实现不同导致行为与性能差异；`is` 底层比较 `id()` 内存地址，比 `==` 更快；小整数缓存与字符串驻留是 `is` 看似等价 `==` 的原因，也是"别用 `is` 比相等"的根本依据
