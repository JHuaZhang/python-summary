---
group:
  title: 【19】标准库精讲
  order: 19
order: 4
title: json 序列化与反序列化
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 JSON 与 json 标准库

JSON（JavaScript Object Notation）是一种轻量级的数据交换文本格式。它脱胎于 JavaScript 的对象字面量语法，但本身是语言无关的纯文本规范——任何语言都能读写 JSON 文本。一份合法的 JSON 通常是这个样子：

```json
{"name": "张三", "age": 28, "skills": ["Python", "SQL"], "active": true}
```

它只定义了六种结构：对象（键值对集合）、数组（有序列表）、字符串、数字、布尔（`true`/`false`）和 `null`。这六种结构通过嵌套就能表达相当复杂的数据——配置文件、API 报文、数据库字段、日志记录都常用 JSON 承载。

Python 标准库 `json` 模块负责 Python 对象与 JSON 文本之间的双向转换：

- **序列化（serialization）**：把 Python 对象转成 JSON 字符串或写入文件，对应 `json.dumps` / `json.dump`。这里的 "s" 代表 string，"dumps" 可以记成 "dump to string"。
- **反序列化（deserialization）**：把 JSON 字符串或文件解析回 Python 对象，对应 `json.loads` / `json.load`。"loads" 即 "load from string"。

四个函数两两配对，记忆口诀：带 `s` 的操作字符串，不带 `s` 的操作文件。

```python
# 最小用法：Python dict <-> JSON 字符串往返
import json

person = {"name": "张三", "age": 28}
text = json.dumps(person)          # 序列化：对象 -> JSON 字符串
back = json.loads(text)            # 反序列化：JSON 字符串 -> 对象
print(text)
# 输出：{"name": "张三", "age": 28}
print(back)
# 输出：{'name': '张三', 'age': 28}
print(back == person)
# 输出：True
```

注意输出的第一行：中文字符 "张三" 被转成了 `张三` 这种 `\uXXXX` 形式。这是 `dumps` 的默认行为，第 2 章会讲如何用 `ensure_ascii=False` 保留原样中文。

### 1.2 基本语法与最小用法

先把四个核心函数的签名摆出来，建立全局印象：

```python
json.dumps(obj, *, skipkeys=False, ensure_ascii=True, check_circular=True,
           allow_nan=True, cls=None, indent=None, separators=None,
           default=None, sort_keys=False, **kw)

json.dump(obj, fp, *, skipkeys=False, ensure_ascii=True, check_circular=True,
          allow_nan=True, cls=None, indent=None, separators=None,
          default=None, sort_keys=False, **kw)

json.loads(s, *, cls=None, object_hook=None, parse_float=None,
           parse_int=None, parse_constant=None, object_pairs_hook=None, **kw)

json.load(fp, *, cls=None, object_hook=None, parse_float=None,
          parse_int=None, parse_constant=None, object_pairs_hook=None, **kw)
```

不用被这一长串参数吓到，日常 80% 的场景只需要：

- `dumps(obj)`：把对象变字符串
- `loads(s)`：把字符串变对象
- `dump(obj, fp)`：把对象写入文件 `fp`
- `load(fp)`：从文件 `fp` 读出对象

最小可运行示例——保存与读取一份配置：

```python
import json

config = {
    "host": "127.0.0.1",
    "port": 5432,
    "debug": True,
    "tags": ["db", "primary"],
}

# 序列化为字符串
text = json.dumps(config)
print(text)
# 输出：{"host": "127.0.0.1", "port": 5432, "debug": true, "tags": ["db", "primary"]}

# 反序列化回对象
cfg = json.loads(text)
print(cfg["port"], cfg["tags"])
# 输出：5432 ['db', 'primary']
```

留意一个细节：Python 的 `True` 在 JSON 文本里变成了小写 `true`，这是 JSON 规范要求的——JSON 的布尔值就是小写 `true`/`false`，`null` 对应 Python 的 `None`。第 2 章会给出完整的类型对照表。

## 2. 核心内容

### 2.1 json.dumps：Python 对象转 JSON 字符串

`json.dumps(obj)` 是最常用的序列化入口，它递归遍历传入的 Python 对象，按类型生成对应的 JSON 文本片段并拼接返回。

**作用**：把 Python 对象序列化为 JSON 格式的字符串。  
**何时用**：需要把内存中的对象通过网络发送、缓存到字符串、打印给外部系统时。  
**签名**：`json.dumps(obj, *, ensure_ascii=True, indent=None, sort_keys=False, separators=None, default=None, skipkeys=False, allow_nan=True, check_circular=True, cls=None)`。

几个高频参数先一句话概括，后面分小节展开：

- `ensure_ascii`：是否把非 ASCII 字符转义成 `\uXXXX`，默认 `True`（转义）。
- `indent`：缩进空格数，用于美化输出，默认 `None`（最紧凑）。
- `sort_keys`：是否按 key 字典序排序输出，默认 `False`。
- `separators`：自定义元素分隔符和键值分隔符。
- `default`：遇到无法序列化的类型时的回调函数。
- `skipkeys`：跳过非字符串类型的 dict key，默认 `False`（会报错）。
- `allow_nan`：是否允许 `NaN`/`Infinity`，默认 `True`（非标准 JSON）。

**基础序列化**——各种原生类型的表现：

```python
import json

data = {
    "string": "hello",
    "int": 42,
    "float": 3.14,
    "bool": True,
    "none": None,
    "list": [1, 2, 3],
    "nested": {"a": [True, False, None]},
}

print(json.dumps(data))
# 输出：{"string": "hello", "int": 42, "float": 3.14, "bool": true, "none": null, "list": [1, 2, 3], "nested": {"a": [true, false, null]}}
```

可以看到，`True → true`、`False → false`、`None → null`，数字和字符串原样输出。嵌套结构被递归处理，整个 dict 被压成一行紧凑文本。

**无法序列化的类型会报 TypeError**——这是默认行为，也是 JSON 格式限制的直接体现：

```python
import json

# set 没有 JSON 对应类型
try:
    json.dumps({1, 2, 3})
except TypeError as e:
    print(e)
# 输出：Object of type set is not JSON serializable
```

`set`、`datetime`、自定义类实例等都没有对应的 JSON 类型，默认都会抛 `TypeError`。解决办法是用 `default` 回调（见 2.7）或自定义 `JSONEncoder`（见 2.8）。

### 2.2 json.loads：JSON 字符串转 Python 对象

`json.loads(s)` 是 `dumps` 的逆运算，把一段 JSON 文本解析回 Python 对象。

**作用**：把 JSON 字符串反序列化为 Python 对象。  
**何时用**：从网络、文件、缓存读取到 JSON 文本，需要转成可操作的对象时。  
**签名**：`json.loads(s, *, cls=None, object_hook=None, parse_float=None, parse_int=None, parse_constant=None, object_pairs_hook=None)`。

**基础反序列化**：

```python
import json

text = '{"name": "张三", "age": 28, "scores": [90, 85, 95], "active": true}'
obj = json.loads(text)

print(obj)
# 输出：{'name': '张三', 'age': 28, 'scores': [90, 85, 95], 'active': True}
print(type(obj))
# 输出：<class 'dict'>
```

解析完成后，JSON 的 `true` 变回 Python 的 `True`，`null` 变回 `None`，数组变回 `list`，对象变回 `dict`。

**JSON 语法严格要求双引号**——这是初学者最常踩的坑：

```python
import json

# 用了单引号，不是合法 JSON
try:
    json.loads("{'name': '张三'}")
except json.JSONDecodeError as e:
    print(e)
# 输出：Expecting property name enclosed in double quotes: line 1 column 2 (char 1)
```

Python 字面量允许单引号字符串，但 JSON 规范只认双引号。`json.loads` 解析的是 JSON 规范文本，不是 Python 字面量，所以单引号会直接报 `JSONDecodeError`。

**解析错误统一抛 JSONDecodeError**——这是一个明确的异常类型，可以捕获：

```python
import json

bad_inputs = [
    "",                          # 空字符串
    "{",                         # 不完整的对象
    '{"a": 1,}',                 # 尾随逗号
    '{"a": }',                   # 缺值
    "[1, 2, ]",                  # 数组尾随逗号
    "undefined",                 # JSON 没有 undefined
    "{'a': 1}",                  # 单引号
]

for s in bad_inputs:
    try:
        json.loads(s)
        print(f"合法: {s!r}")
    except json.JSONDecodeError as e:
        print(f"非法 {s!r:20} -> {e.msg} (char {e.pos})")
# 输出：
# 非法 ''                   -> Expecting value (char 0)
# 非法 '{'                  -> Expecting property name enclosed in double quotes (char 1)
# 非法 '{"a": 1,}'          -> Expecting property name enclosed in double quotes (char 8)
# 非法 '{"a": }'            -> Expecting value (char 7)
# 非法 '[1, 2, ]'           -> Expecting value (char 8)
# 非法 'undefined'          -> Expecting value (char 0)
# 非法 "{'a': 1}"           -> Expecting property name enclosed in double quotes (char 1)
```

`JSONDecodeError` 携带 `msg`（错误描述）、`pos`（字符偏移）、`lineno`（行号）、`colno`（列号），定位错误非常方便。

### 2.3 json.dump 与 json.load：文件读写

当数据量较大或需要持久化到磁盘时，直接用文件版本 `dump`/`load`，避免中间多一次字符串拼装。

**json.dump(obj, fp)**：把 `obj` 序列化后写入文件对象 `fp`。`fp` 必须是以文本模式（`"w"`/`"a"`，编码一般用 utf-8）打开的文件。参数与 `dumps` 相同，多了第一个位置参数 `fp`。

**json.load(fp)**：从文件对象 `fp` 读取并反序列化。`fp` 必须是文本模式（`"r"`）打开。

**场景：保存应用配置到文件，再读回来**：

```python
import json

config = {
    "host": "localhost",
    "port": 8080,
    "users": [
        {"name": "张三", "role": "admin"},
        {"name": "李四", "role": "guest"},
    ],
    "features": {"cache": True, "logging": False},
}

# 写入：以 utf-8 文本模式打开
with open("config.json", "w", encoding="utf-8") as f:
    json.dump(config, f, ensure_ascii=False, indent=2)

# 读取：同样 utf-8
with open("config.json", "r", encoding="utf-8") as f:
    loaded = json.load(f)

print(loaded == config)
# 输出：True
print(loaded["users"][0]["name"])
# 输出：张三
```

**为什么强调 encoding="utf-8"**：JSON 规范要求文件用 UTF-8 编码（RFC 8259）。Windows 下默认编码可能是 GBK，不指定 `encoding` 时写入中文再用默认编码读取，极易出现 `UnicodeDecodeError` 或乱码。养成"读写 JSON 文件一律显式 `encoding='utf-8'`"的习惯能省掉大量排查时间。

**不要用文本模式读写二进制**——`dump`/`load` 只接受文本文件对象：

```python
import json

# 错误：二进制模式
try:
    with open("bad.json", "wb") as f:
        json.dump({"a": 1}, f)
except TypeError as e:
    print(e)
# 输出：the JSON object must be str, bytes or bytearray, not int
# （具体报错信息因实现版本略有差异，本质是写入类型不匹配）
```

文件版本与字符串版本的选择标准：数据要落盘或跨进程传递用文件版本；只在内存里转一下给接口返回用字符串版本。

### 2.4 类型对照表：Python 与 JSON 的映射

理解序列化/反序列化的关键是搞清两种类型系统的对应关系。下表是默认映射：

| Python（序列化 →） | JSON | （← 反序列化）Python |
|---|---|---|
| `dict` | object `{}` | `dict` |
| `list`, `tuple` | array `[]` | `list` |
| `str` | string `"..."` | `str` |
| `int`, `float` | number | `int` / `float` |
| `True` / `False` | `true` / `false` | `True` / `False` |
| `None` | `null` | `None` |

几个要点：

- **`tuple` 序列化后变成 JSON 数组，反序列化回来变 `list`**——因为 JSON 没有元组概念。如果代码依赖类型是 `tuple`，往返后会丢失类型信息。
- **dict 的 key 必须是字符串**：JSON 对象的 key 规范上就是字符串。Python 的 `{1: "a"}` 序列化时 key 会被转成 `"1"`，反序列化回来 key 是 `"1"`（字符串），不是 `1`（整数）。
- **`float` 的特殊值**：`NaN`、`Infinity`、`-Infinity` 默认会序列化为 `NaN`/`Infinity`/`-Infinity`，但这不是标准 JSON（标准 JSON 不允许），某些解析器会拒绝。`allow_nan=False` 可强制报错。

```python
import json

# tuple 往返后变 list
t = (1, 2, 3)
print(json.dumps(t))
# 输出：[1, 2, 3]
print(type(json.loads(json.dumps(t))))
# 输出：<class 'list'>

# int key 往返后变 str key
d = {1: "a", 2: "b"}
print(json.dumps(d))
# 输出：{"1": "a", "2": "b"}
print(json.loads(json.dumps(d)))
# 输出：{'1': 'a', '2': 'b'}

# float 特殊值
print(json.dumps([float("nan"), float("inf"), float("-inf")]))
# 输出：[NaN, Infinity, -Infinity]
```

**skipkeys 处理非字符串 key**：如果 dict 的 key 是 `float` 或更怪的类型（不是 `str`/`int`/`float`/`bool`/`None`），默认会报 `TypeError`。`skipkeys=True` 则直接跳过这些 key：

```python
import json

# 用 frozenset 当 key 不会被序列化
weird = {"normal": 1, frozenset({1, 2}): 2}
print(json.dumps(weird, skipkeys=True))
# 输出：{"normal": 1}
```

### 2.5 ensure_ascii：控制非 ASCII 字符转义

`ensure_ascii` 是 `dumps`/`dump` 的参数，默认 `True`，作用是把所有非 ASCII 字符（码点 ≥ 128）转义成 `\uXXXX` 形式。

**ensure_ascii=True（默认）**：输出纯 ASCII 文本，跨系统传输最安全，但中文可读性差。

```python
import json

data = {"city": "北京", "msg": "你好，世界"}
print(json.dumps(data))
# 输出：{"city": "北京", "msg": "你好，世界"}
```

**ensure_ascii=False**：保留原始 Unicode 字符，中文直接显示，调试和人类可读场景必用。

```python
import json

print(json.dumps({"city": "北京"}, ensure_ascii=False))
# 输出：{"city": "北京"}
```

**为何默认是 True**：历史原因。早期很多系统的编码处理不完善，纯 ASCII 文本能避免编码问题。现在 UTF-8 已普及，大多数场景用 `ensure_ascii=False` 即可，但默认值为了向后兼容仍保持 `True`。

**字符数 vs 字节数的误解**：`北` 看起来像 6 个字符，但它只代表 1 个字符"北"。`json.loads` 解析时会还原成原字符，所以 `ensure_ascii` 只影响文本表示，不影响数据语义：

```python
import json

text_escaped = json.dumps({"city": "北京"})
text_plain = json.dumps({"city": "北京"}, ensure_ascii=False)

print(text_escaped)
# 输出：{"city": "北京"}
print(text_plain)
# 输出：{"city": "北京"}
# 两者反序列化结果完全相同
print(json.loads(text_escaped) == json.loads(text_plain))
# 输出：True
```

**推荐做法**：内部传输、日志、配置文件用 `ensure_ascii=False`（可读性好）；需要严格 ASCII 通道（某些旧系统、邮件、受限协议）时用默认 `True`。

### 2.6 indent：缩进美化输出

`indent` 控制输出的缩进空格数，用于生成人类可读的多行 JSON。默认 `None`，输出最紧凑的单行文本。

**indent=N**：每个层级缩进 N 个空格，键值对换行：

```python
import json

data = {
    "name": "张三",
    "skills": ["Python", "Go"],
    "address": {"city": "北京", "zip": "100000"},
}

print(json.dumps(data, indent=2, ensure_ascii=False))
# 输出：
# {
#   "name": "张三",
#   "skills": [
#     "Python",
#     "Go"
#   ],
#   "address": {
#     "city": "北京",
#     "zip": "100000"
#   }
# }
```

`indent=0` 也会换行但不缩进（仅插入换行符）。`indent` 也可以传字符串，如 `indent="\t"` 用制表符缩进。

**用途取舍**：`indent` 美化的输出体积更大（多了大量空白字符），适合给人看或写配置文件；程序间传输或缓存优先用紧凑格式（省带宽、省空间）。

```python
import json

data = {"a": 1, "b": [2, 3]}

# 紧凑（程序交换）
compact = json.dumps(data)
# 美化（人看）
pretty = json.dumps(data, indent=2)

print(len(compact), len(pretty))
# 输出：18 29
```

配合 `sort_keys=True`，生成的配置文件 key 顺序稳定，便于 diff 和版本管理：

```python
import json

cfg = {"zoom": 1, "apple": 2, "mango": 3}
print(json.dumps(cfg, indent=2, sort_keys=True, ensure_ascii=False))
# 输出：
# {
#   "apple": 2,
#   "mango": 3,
#   "zoom": 1
# }
```

### 2.7 separators：自定义分隔符

`separators` 是一个二元组 `(item_sep, key_sep)`，分别控制元素之间和键值之间的分隔符。

默认值会随 `indent` 变化：

- `indent=None`（紧凑）时默认 `(', ', ': ')`——元素用 `, ` 分隔，键值用 `: ` 分隔。
- `indent` 非 None（美化）时默认 `(',', ': ')`——元素用 `,`（无空格，因为已换行缩进）。

**最紧凑输出**：传 `separators=(',', ':')` 去掉所有多余空格，体积最小：

```python
import json

data = {"a": 1, "b": [2, 3]}

default_compact = json.dumps(data)
most_compact = json.dumps(data, separators=(',', ':'))

print(default_compact)
# 输出：{"a": 1, "b": [2, 3]}
print(most_compact)
# 输出：{"a":1,"b":[2,3]}
print(len(default_compact), len(most_compact))
# 输出：18 15
```

在大量小对象序列化（如缓存 thousands 条记录）时，去掉空格能显著减小体积。

### 2.8 sort_keys：按键排序

`sort_keys=True` 让 dict 的 key 按字典序输出。这在需要稳定输出顺序的场景很有用：

- **单元测试快照**：dict 的 key 顺序在不同 Python 版本间不保证一致（虽然 3.7+ 保持插入序），排序后输出稳定，便于对比。
- **版本管理**：配置文件 key 排序后 diff 噪声更小。
- **缓存键一致性**：把 dict 序列化成字符串当缓存 key 时，排序保证相同内容生成相同字符串。

```python
import json

data = {"zebra": 1, "apple": 2, "mango": 3}

# 默认按插入序
print(json.dumps(data))
# 输出：{"zebra": 1, "apple": 2, "mango": 3}

# 排序后
print(json.dumps(data, sort_keys=True))
# 输出：{"apple": 2, "mango": 3, "zebra": 1}
```

```python
import json

# 用排序后的 JSON 文本做缓存键
def cache_key(payload):
    return json.dumps(payload, sort_keys=True, separators=(',', ':'))

print(cache_key({"b": 2, "a": 1}) == cache_key({"a": 1, "b": 2}))
# 输出：True
```

### 2.9 default 回调：序列化自定义类型

`default` 是 `dumps`/`dump` 的关键扩展点。当序列化遇到无法识别的类型时，会调用 `default(obj)`，期望它返回一个可序列化的对象（通常是 dict/str/数字），或抛 `TypeError`。

**典型场景一：datetime 序列化**

`datetime.datetime` 默认无法序列化：

```python
import json
from datetime import datetime

event = {"name": "启动", "time": datetime(2025, 7, 23, 10, 30)}

try:
    json.dumps(event)
except TypeError as e:
    print(e)
# 输出：Object of type datetime is not JSON serializable
```

用 `default` 回调把它转成 ISO 格式字符串：

```python
import json
from datetime import datetime, date

def default(obj):
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    # 其他未知类型，抛异常交还 json 处理
    raise TypeError(f"无法序列化 {type(obj)}")

event = {"name": "启动", "time": datetime(2025, 7, 23, 10, 30)}
text = json.dumps(event, default=default, ensure_ascii=False)
print(text)
# 输出：{"name": "启动", "time": "2025-07-23T10:30:00"}
```

**回调用调用链**：`default` 只在遇到未知类型时被调用一次。如果返回值里仍然包含未知类型，`json` 会再次对返回值递归序列化，过程中若又遇到未知类型，会**再次调用 `default`**。利用这个机制可以处理嵌套的自定义结构。

**典型场景二：自定义类实例**

```python
import json

class User:
    def __init__(self, name, age):
        self.name = name
        self.age = age

def default(obj):
    if isinstance(obj, User):
        return {"type": "User", "name": obj.name, "age": obj.age}
    raise TypeError(f"无法序列化 {type(obj)}")

team = {"leader": User("张三", 28), "count": 1}
print(json.dumps(team, default=default, ensure_ascii=False))
# 输出：{"leader": {"type": "User", "name": "张三", "age": 28}, "count": 1}
```

**default 的局限**：`default` 只在序列化时起作用。反序列化时，`{"type": "User", ...}` 会变回普通 `dict`，不会自动重建 `User` 实例。要双向还原自定义类，需要配合 `object_hook`（见 2.10）。

### 2.10 自定义 JSONEncoder 子类

如果项目里大量用到某类自定义类型的序列化，每处都传 `default` 很繁琐。更优雅的方式是继承 `json.JSONEncoder`，重写 `default` 方法，通过 `cls` 参数传入：

```python
import json
from datetime import datetime, date

class ComplexEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        # 交给父类，最终会抛 TypeError
        return super().default(obj)

event = {"time": datetime(2025, 7, 23, 10, 30), "title": "上线"}
print(json.dumps(event, cls=ComplexEncoder, ensure_ascii=False))
# 输出：{"time": "2025-07-23T10:30:00", "title": "上线"}
```

`JSONEncoder` 还有个 `item_separator`/`key_separator` 等初始化参数，可以全局定制分隔符，但实际项目里重写 `default` 已覆盖绝大多数需求。

### 2.11 object_hook：反序列化自定义

`object_hook` 是 `loads`/`load` 的扩展点，作用与 `default` 相反。每解析完一个 JSON 对象（即将变成 `dict`），会把它传给 `object_hook`，函数的返回值作为该层级的最终结果。

**场景：把日期字符串还原为 datetime**

```python
import json
from datetime import datetime

def default(obj):
    if isinstance(obj, datetime):
        return {"_iso": obj.isoformat()}
    raise TypeError(f"无法序列化 {type(obj)}")

def object_hook(dct):
    if "_iso" in dct:
        return datetime.fromisoformat(dct["_iso"])
    return dct

event = {"name": "启动", "time": datetime(2025, 7, 23, 10, 30)}

# 往返：datetime -> JSON -> datetime
text = json.dumps(event, default=default, ensure_ascii=False)
back = json.loads(text, object_hook=object_hook)

print(text)
# 输出：{"name": "启动", "time": {"_iso": "2025-07-23T10:30:00"}}
print(back)
# 输出：{'name': '启动', 'time': datetime.datetime(2025, 7, 23, 10, 30)}
print(type(back["time"]))
# 输出：<class 'datetime.datetime'>
```

这里用了一个带 `_iso` 标记的 dict 作为"信封"——序列化时把 datetime 包成 `{"_iso": "..."}`，反序列化时 `object_hook` 看到这个标记就还原成 `datetime`。这是实现自定义类型往返的常用套路。

**object_hook 的调用顺序**：从最内层对象开始，逐层向外调用。例如解析 `{"a": {"b": 1}}` 时，先对 `{"b": 1}` 调用，再对 `{"a": <上一步结果>}` 调用。

**object_pairs_hook**：如果你需要控制 key 顺序或检测重复 key，用 `object_pairs_hook` 代替 `object_hook`。它接收的是 `[("k1", v1), ("k2", v2)]` 这种键值对列表，返回值作为该层对象。`json.loads` 默认遇到重复 key 会用后者覆盖前者，用 `object_pairs_hook` 可以检测并报错：

```python
import json

def reject_dupes(pairs):
    keys = [k for k, _ in pairs]
    if len(keys) != len(set(keys)):
        raise ValueError(f"重复的 key: {keys}")
    return dict(pairs)

try:
    json.loads('{"a":1,"a":2}', object_pairs_hook=reject_dupes)
except ValueError as e:
    print(e)
# 输出：重复的 key: ['a', 'a']
```

### 2.12 parse_float / parse_int / parse_constant：精细控制数值解析

`loads` 的这三个参数可以改变默认的数值解析行为：

- `parse_float(float_str)`：默认是 `float`，可改成 `Decimal` 避免浮点精度损失。
- `parse_int(int_str)`：默认是 `int`，可改成自定义函数。
- `parse_constant(const_str)`：处理 `NaN`/`Infinity`/-Infinity`，默认是 `float`。

**金额场景：用 Decimal 代替 float 反序列化**——金融数据绝对不能用 float，`{"price": 0.1}` 直接 `json.loads` 得到的 `0.1` 在浮点下无法精确表示：

```python
import json
from decimal import Decimal

text = '{"price": 0.1, "qty": 3}'

# 默认用 float
default_obj = json.loads(text)
print(default_obj["price"], default_obj["price"] * 3)
# 输出：0.1 0.30000000000000004

# 用 Decimal
decimal_obj = json.loads(text, parse_float=Decimal)
print(decimal_obj["price"], decimal_obj["price"] * 3)
# 输出：0.1 0.3
```

这里 `parse_float=Decimal` 让所有浮点数字面量经过 `Decimal("0.1")` 构造，保留了精确十进制表示。配合 `default=lambda o: str(o) if isinstance(o, Decimal) else ...` 可以把 `Decimal` 序列化为字符串，避免 JSON 数字精度丢失。

### 2.13 JSON 与 Python 字面量的关键区别

初学者经常把 JSON 当 Python 字面量写，结果报错。两者的区别：

| 区别点 | Python 字面量 | JSON |
|---|---|---|
| 布尔值 | `True` / `False` | `true` / `false` |
| 空值 | `None` | `null` |
| 字符串引号 | 单引号 `'...'` 或双引号 `"..."` | 仅双引号 `"..."` |
| 字符串内引号转义 | `\'` `/`\"` | `\"`（单引号无需转义） |
| 尾随逗号 | 允许 `[1,2,]` | 不允许 |
| 注释 | `# ...` | 不支持 |
| key 引号 | dict key 可不加引号 `{1: 'a'}` | 必须双引号 `{"1": "a"}` |
| 单一顶层值 | 任意表达式 | 必须是 object 或 array（宽松解析器也接受裸值，但规范要求对象/数组） |
| 数字 | 支持 `1_000`、复数 `1j` | 仅十进制数字，不支持复数 |

```python
import json

# 这些都不是合法 JSON
not_json = [
    "{'a': 1}",        # 单引号
    '{a: 1}',           # key 无引号
    '[1, 2, 3, ]',      # 尾随逗号
    'True',             # 大写 True
    'None',             # None 而非 null
    '{"a": 1} // 注释', # 注释
]

for s in not_json:
    try:
        json.loads(s)
        print(f"OK: {s!r}")
    except json.JSONDecodeError:
        print(f"非法: {s!r}")
# 输出：
# 非法: "{'a': 1}"
# 非法: '{a: 1}'
# 非法: '[1, 2, 3, ]'
# OK: 'True'
# OK: 'None'
# 非法: '{"a": 1} // 注释'
```

注意 `True` 和 `None` 在宽松解析下被 `json.loads` 接受并解析为 `True`/`None`——这是因为它把裸标识符当作常量解析。但 `true`/`null` 才是规范写法，写 JSON 文件时应坚持用小写。

### 2.14 中文与编码注意事项

**JSON 文件编码就是 UTF-8**。RFC 8259 明确规定 JSON 文本用 UTF-8 编码。读写文件时显式指定 `encoding="utf-8"` 是最稳妥做法：

```python
import json

# 写：ensure_ascii=False + utf-8 文件，得到人类可读的中文 JSON 文件
data = {"提示": "操作成功", "code": 0}
with open("msg.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# 读：utf-8
with open("msg.json", encoding="utf-8") as f:
    print(json.load(f))
# 输出：{'提示': '操作成功', 'code': 0}
```

如果既用了 `ensure_ascii=True`（默认）又用非 UTF-8 编码打开文件，那 `\uXXXX` 都是 ASCII 字符，编码问题不至于破坏数据——这是默认值带来的一层"保险"。但当代码里写 `ensure_ascii=False` 时，必须配套 `encoding="utf-8"`，否则容易在 Windows 上踩坑。

**bytes 输入**：`json.loads` 从 Python 3.6 起支持 `bytes`/`bytearray` 输入，会自动按 UTF-8 解码：

```python
import json

raw = b'{"name": "\xe5\xbc\xa0\xe4\xb8\x89"}'   # "张三" 的 UTF-8 字节
print(json.loads(raw))
# 输出：{'name': '张三'}
```

这在处理网络响应（`requests.post(...).content` 返回 bytes）时方便，不必先 `.decode()`。

## 3. 最佳实践

**写文件一律指定 encoding="utf-8"**

JSON 规范就是 UTF-8。Windows 默认编码可能是 GBK，macOS/Linux 默认 UTF-8。不指定编码的代码在不同机器上行为不一致。

```python
# 推荐
with open("data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False)

# 不推荐（依赖系统默认编码）
with open("data.json", "w") as f:
    json.dump(data, f, ensure_ascii=False)
```

**有中文用 ensure_ascii=False**

默认 `ensure_ascii=True` 会让中文变成 `\uXXXX`，可读性极差，排错时看不懂。内部系统、配置文件、日志一律用 `False`。只在受限 ASCII 通道下用默认值。

**金融数值用 Decimal，不要用 float**

JSON 数字本身没有类型标注，`0.1` 在 JSON 文本里是精确的十进制，但 `json.loads` 默认用 `float` 解析，精度立马丢失。涉及金额、利率、数量等敏感数据，用 `parse_float=Decimal`，序列化时把 `Decimal` 用 `default` 转成字符串（避免再次变 float）。

```python
import json
from decimal import Decimal

def to_json(obj):
    return json.dumps(obj, default=lambda o: str(o) if isinstance(o, Decimal) else ..., ensure_ascii=False)

def from_json(s):
    return json.loads(s, parse_float=Decimal)

amount = {"price": Decimal("19.99")}
text = to_json(amount)
print(text)
# 输出：{"price": "19.99"}
print(from_json(text))
# 输出：{'price': Decimal('19.99')}
```

**不要用 eval/json.loads 混淆——json 是安全的**

`pickle` 反序列化会执行任意代码，绝对不要从不可信来源 `pickle.loads`。`json.loads` 只解析数据，不执行代码，是安全的。处理外部输入用 JSON。

**自定义类型双向往返用 default + object_hook 配对**

单独 `default` 只能正向，反序列化会失去类型。要双向还原，约定一个"信封"结构（如 `{"_type": "User", ...}`），序列化端用 `default` 包装，反序列化端用 `object_hook` 识别并还原。

```python
import json

class User:
    def __init__(self, name):
        self.name = name
    def __eq__(self, other):
        return isinstance(other, User) and self.name == other.name

def default(obj):
    if isinstance(obj, User):
        return {"_type": "User", "name": obj.name}
    raise TypeError

def object_hook(dct):
    if dct.get("_type") == "User":
        return User(dct["name"])
    return dct

u = User("张三")
text = json.dumps({"admin": u}, default=default, ensure_ascii=False)
back = json.loads(text, object_hook=object_hook)
print(back)
# 输出：{'admin': <__main__.User object at 0x...>}
print(back["admin"] == u)
# 输出：True
```

**大文件用流式或增量解析**

`json.load` 一次性把整个文件读入内存并构建对象树，几百 MB 的 JSON 会吃掉数 GB 内存。超大文件可考虑 `ijson` 第三方库做流式解析，或按行存 JSON Lines 格式（每行一个独立 JSON 对象），逐行 `json.loads`。

```python
import json

# JSON Lines 格式：每行一个对象，适合大数据流
with open("events.jsonl", "w", encoding="utf-8") as f:
    for i in range(3):
        json.dump({"id": i, "msg": f"事件{i}"}, f, ensure_ascii=False)
        f.write("\n")

# 逐行读
with open("events.jsonl", encoding="utf-8") as f:
    for line in f:
        print(json.loads(line))
# 输出：
# {'id': 0, 'msg': '事件0'}
# {'id': 1, 'msg': '事件1'}
# {'id': 2, 'msg': '事件2'}
```

**缓存键用 sort_keys + 紧凑 separators**

把 dict 序列化成字符串当缓存键时，不同 key 顺序会产生不同字符串，导致缓存失效。固定用 `sort_keys=True, separators=(',', ':')` 保证稳定。

```python
import json

key = json.dumps(payload, sort_keys=True, separators=(',', ':'))
```

**重复 key 默认会静默覆盖**

`json.loads('{"a":1,"a":2}')` 默认返回 `{'a': 2}`，不会报错。如果业务上 key 必须唯一，用 `object_pairs_hook` 检测（见 2.11）。

## 4. 原理

### 4.1 JSON 文本格式的语法结构

要理解 `dumps`/`loads` 如何工作，先要看清 JSON 文本的语法。RFC 8259 用一组产生式规则定义 JSON，简化后的语法树大致是：

```
value   = object | array | string | number | true | false | null
object  = "{" [ member *( "," member ) ] "}"
member  = string ":" value
array   = "[" [ value *( "," value ) ] "]"
string  = '"' *( char ) '"'
char    = unescaped | escape
escape  = "\" ( '"' | "\" | "/" | "b" | "f" | "n" | "r" | "t" | "u" hex4 )
number  = [ "-" ] int [ frac ] [ exp ]
```

几个关键点：

- 整个 JSON 文本本质就是一棵 `value` 树。`object` 和 `array` 是容器节点，其它是叶子。
- `object` 由零或多个 `member` 组成，`member` 一定是 `string : value`——这就是为什么 JSON 的 key 必须是双引号字符串。
- `string` 必须用双引号包裹，内部用反斜杠转义。`\uXXXX` 是任意 Unicode 码点的转义写法。
- `number` 是十进制数字，可带负号、小数部分、指数部分。JSON 没有区分整数和浮点，统一是 number——Python 这边对应 `int`/`float` 是实现选择。

这棵语法树是 `dumps` 的生成目标和 `loads` 的解析依据。

### 4.2 dumps 的递归生成过程

`json.dumps` 的核心是一个按 Python 对象类型分发的递归生成器。简化伪代码：

```python
def encode(obj):
    if obj is None:
        return "null"
    if obj is True:
        return "true"
    if obj is False:
        return "false"
    if isinstance(obj, str):
        return encode_string(obj)
    if isinstance(obj, (int, float)):
        return encode_number(obj)
    if isinstance(obj, (list, tuple)):
        return "[" + ",".join(encode(item) for item in obj) + "]"
    if isinstance(obj, dict):
        items = []
        for key, value in obj.items():
            if not isinstance(key, str):
                key = str(key)      # int/float/bool/None key 转字符串
            items.append(encode_string(key) + ":" + encode(value))
        return "{" + ",".join(items) + "}"
    # 未知类型：调用 default(obj)，用其返回值再递归 encode
    return encode(default(obj))
```

**类型分发**：每遇到一个对象，先判断它属于哪种 JSON 可表示类型，生成对应的 token 序列。容器类型递归调用 `encode` 处理子元素。

**key 强制字符串化**：Python 允许 `{1: "a", True: "b"}`，但 JSON object 的 key 必须是 string。`dumps` 把 `int` key `1` 转成 `"1"`，把 `True` key 转成 `"true"`（注意这与 value 的 `True → true` 一致，但作为 key 它是字符串 `"true"`）。这也是为什么 `{1: "a"}` 往返后 key 变成字符串 `"1"`。

**default 的调用位置**：当 `encode` 走完所有已知类型分支都没命中（如 `datetime`、`set`、自定义类），才会调用 `default(obj)`。`default` 返回一个新对象，`encode` 对这个新对象继续递归——如果新对象里还有未知类型，会再次触发 `default`，直到全部变成可序列化类型或抛 `TypeError`。这就是 2.9 里"嵌套自定义结构也能处理"的原理。

**circular reference 检测**：默认 `check_circular=True`，`dumps` 内部维护一个已访问容器对象的 `id` 集合。每进入一个 dict/list 前，检查它的 `id` 是否已在集合中——在就抛 `ValueError("Circular reference detected")`。这防止了 `a = []; a.append(a); json.dumps(a)` 这种自引用导致无限递归。

```python
import json

a = []
a.append(a)
try:
    json.dumps(a)
except ValueError as e:
    print(e)
# 输出：Circular reference detected
```

### 4.3 loads 的递归下降解析

`json.loads` 内部用一个递归下降解析器（长期由 C 实现的 `_json` 模块加速）逐字符扫描文本，按 4.1 的语法规则构建 Python 对象。

工作过程简化描述：

1. 跳过前导空白（空格、制表、换行、回车）。
2. 看下一个非空白字符，确定要解析哪种 value：
   - `{` → 解析 object
   - `[` → 解析 array
   - `"` → 解析 string
   - `t` → 匹配 `true`
   - `f` → 匹配 `false`
   - `n` → 匹配 `null`
   - 数字字符或 `-` → 解析 number
3. 解析 object：读 `{`，重复"解析 string → 读 `:` → 解析 value → 读 `,` 或 `}`"，直到 `}`。把每个 `member` 存入 `dict`。
4. 解析 array：读 `[`，重复"解析 value → 读 `,` 或 `]`"，直到 `]`。把每个 value append 到 `list`。
5. 解析 string：从 `"` 开始扫描到结束 `"`，处理 `\` 转义（包括 `\uXXXX` 解码回 Unicode 字符）。
6. 解析 number：扫描数字字符，构造 `int` 或 `float`。默认构造器是内置 `int`/`float`，可被 `parse_int`/`parse_float` 替换。

**object_hook 的调用时机**：每当解析器构造好一个 `dict`（即读到了闭合的 `}`），就把它传给 `object_hook`，用返回值替换这个 `dict`。因为解析是"由内向外"完成的（最内层 object 先闭合），所以 `object_hook` 也是从最内层 dict 开始调用，逐层向外——这与 2.11 描述的调用顺序一致。

**解析器不接受 Python 字面量扩展**：JSON 语法严格只认双引号，所以 `'a'`、`# 注释`、尾随逗号、`NaN`（除非 `allow_nan`，仅 `loads` 默认接受）都会成为语法错误。CPython 的 C 加速扫描器对每个 token 的首字符做精确匹配，不符即抛 `JSONDecodeError`，附带出错字符位置。

**JSONDecodeError 的精确定位**：解析器在失败时记录当前扫描位置 `pos`，再换算成 `lineno`/`colno`，构造 `JSONDecodeError(msg, doc, pos)`。这就是 2.2 里那些 `char N` 错误的来源。

### 4.4 为何 set/datetime 默认报错：类型系统不对齐

JSON 的六种结构与 Python 的六种可序列化类型一一对应：`dict`/`list`/`str`/`int`/`float`/`bool`/`None`。超出这个集合的类型没有 JSON 表示。

- `set`：JSON 没有无序集合概念。`{1, 2, 3}` 在 JSON 里甚至不是合法语法（`{` 开始一个 object，但 `1` 不是字符串 key）。所以 `dumps({1,2,3})` 在类型分发阶段就找不到匹配分支，转而调用 `default`，没 `default` 就抛 `TypeError`。
- `datetime`：JSON 没有日期类型。虽然可以约定用字符串表示，但默认 `dumps` 不会自动做这种约定（避免猜测格式），而是抛 `TypeError` 让开发者显式选择格式（`isoformat()`、`strftime`、时间戳等）。
- `Decimal`：JSON number 没有精度信息，`dumps` 默认不处理 `Decimal`，避免静默转换丢失精度。需要开发者用 `default=str` 显式转字符串。
- 自定义类：JSON object 只有键值对，没有"类"概念。`dumps` 不会自动 `__dict__` 化，因为有些对象的 `__dict__` 不可序列化（含弱引用、属性是文件句柄等）。显式 `default` 回调让开发者决定暴露哪些字段。

这种"默认拒绝、显式 opt-in"的设计是 `json` 模块的核心取舍：宁可报错，也不悄悄丢失语义。`default` 就是 opt-in 的统一入口。

### 4.5 ensure_ascii 的转义实现

`ensure_ascii=True` 时，字符串编码环节会对每个字符检查码点：

- 码点 < 128（ASCII）：原样输出。
- 码点 ≥ 128：转成 `\uXXXX`（基本多文平面，码点 ≤ 0xFFFF）或 `\uXXXX\uXXXX`（辅助平面，需要 surrogate pair。

例如 "北" 的码点是 0x5317，转成 `北`。"😀"（U+1F600）在辅助平面，转成代理对 `😀`。

```python
import json

print(json.dumps("北"))
# 输出："北"
print(json.dumps("😀"))
# 输出："😀"
print(json.loads(json.dumps("😀")))
# 输出：😀
```

`ensure_ascii=False` 时，字符串里的非 ASCII 字符直接写入输出（Python 字符串本身就是 Unicode，`dumps` 返回 `str`，不存在编码问题；写文件时由文件对象的 `encoding` 负责落地字节）。这是为什么 2.5 强调：写到文件时 `ensure_ascii=False` 必须配 `encoding="utf-8"`，否则非 ASCII 字符在编码阶段会炸。

### 4.6 json 相对 pickle 的安全本质

`pickle` 和 `json` 都能序列化，但安全性天差地别，根源在于两者描述数据的抽象层级不同。

**pickle 是操作码序列**：pickle 协议把对象序列化成一串字节码，里面包含 `GLOBAL`（导入模块）、`REDUCE`（调用可调用对象）、`BUILD`（调用 `__setstate__`）等操作码。`pickle.loads` 实际上是在解释执行这串字节码，会触发任意模块导入和函数调用。一个精心构造的 pickle 可以在 `loads` 时执行 `os.system("rm -rf /")`。所以"绝不要 pickle.loads 不可信数据"是 Python 安全铁律。

**json 是数据描述**：JSON 文本只描述数据结构（对象、数组、字符串、数字、布尔、null），`json.loads` 的工作纯粹是"把文本翻译成等价的 Python 数据树"。解析过程中不会导入模块、不会调用任意函数、不会执行代码。最坏情况是遇到 `NaN`/`Infinity`（非标准）或巨大数字导致解析异常，但不会产生代码执行。因此 `json.loads` 不可信外部输入是安全的——这也是为什么 Web API、配置、跨语言数据交换都用 JSON。

这条安全边界也解释了 `json` 为何对自定义类型"保守"：它不会自动调用对象的 `__reduce__` 或 `__setstate__`（那是 pickle 的机制），而只认内置那几种类型 + `default` 回调。`default` 由开发者显式提供，只会返回数据（不会执行代码），不会引入任意执行风险。

**类型表达力的代价**：正因为只描述数据、不执行代码，JSON 无法直接表达 `set`、`datetime`、自定义类等需要"构造逻辑"的类型。这是安全性的必然代价——用 `default`/`object_hook` 在应用层补上这层转换，既保了安全，又留了扩展空间。

## 5. 总结

- `json` 标准库提供四个核心函数：`dumps`/`loads` 操作字符串，`dump`/`load` 操作文件。记忆口诀：带 `s` 操作 string，不带 `s` 操作文件。
- Python 与 JSON 的类型映射：`dict → object`、`list/tuple → array`、`str → string`、`int/float → number`、`True/False → true/false`、`None → null`。`tuple` 往返变 `list`，`int` key 往返变 `str` key。
- `ensure_ascii=False` 让中文不转义，配合 `encoding="utf-8"` 文件读写是人类可读 JSON 的标配。
- `indent` 美化输出，`sort_keys` 稳定 key 顺序，`separators=(',', ':')` 最紧凑——三者按场景搭配。
- `default` 回调处理序列化时的自定义类型（`datetime`、`Decimal`、自定义类），`object_hook` 处理反序列化时的自定义还原，两者配对可实现类型往返。
- JSON 语法严格：双引号字符串、无尾随逗号、无注释、布尔小写。`JSONDecodeError` 携带精确定位信息。
- `parse_float=Decimal` 用于金额等精度敏感场景。
- 安全性：`json.loads` 只解析数据不执行代码，适合处理不可信输入；`pickle` 能执行任意代码，不可用于不可信数据。

读完本文你应能：

- 正确选用 `dumps`/`loads`/`dump`/`load` 四个函数，并说明带 `s` 与不带 `s` 的区别。
- 说出 Python 与 JSON 的完整类型对照表，并解释 `tuple` 往返、`int` key 往返为何会"变形"。
- 用 `ensure_ascii=False` + `indent` + `sort_keys` 生成人类可读且 diff 友好的配置文件。
- 用 `default` 回调序列化 `datetime`、`Decimal`、自定义类；用 `object_hook` 配对实现双向往返。
- 解释 `set`/`datetime` 默认报错的原因（JSON 类型系统不对齐），并给出解决思路。
- 说出 JSON 与 Python 字面量的关键区别（引号、布尔大小写、尾随逗号、注释）。
- 说明 `json.loads` 相对 `pickle.loads` 的安全本质（数据描述 vs 操作码执行），并据此选择外部输入的反序列化方案。