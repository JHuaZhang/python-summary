---
group:
  title: 【12】函数参数介绍
  order: 12
order: 9
title: 仅位置参数与仅关键字参数
nav:
  title: Python基础
  order: 1
---

# 仅位置参数与仅关键字参数

## 1. 介绍

### 1.1 什么是参数类型约束

Python 3.8 引入了 `/`（斜杠）分隔符，它和已经存在的 `*` 分隔符一起，构成了**参数传递方式约束**的完整机制。它们让你可以精确控制每个形参的传递方式——只能通过位置、只能通过关键字、还是两者皆可。

| 分隔符 | 位置 | 作用 | 引入版本 |
|--------|------|------|---------|
| `/` | 形参列表中 | 之前的参数只能通过位置传递 | Python 3.8 |
| `*` | 形参列表中 | 之后的参数只能通过关键字传递 | Python 3.0 |

两者可以同时使用，将形参列表划分为三个区域：

```text
def func(   a, b     , /,    c, d     , *,    e, f    ):
           仅位置     │    位置/关键字     │    仅关键字
```

```python
def greet(name, /, greeting="你好"):
    """name 只能是位置参数"""
    return f"{greeting}，{name}！"


print(greet("小明"))           # ✅ 位置传参
# print(greet(name="小明"))    # ❌ TypeError: name 不能用关键字
```

### 1.2 在 Python 知识体系中的位置

`/` 和 `*` 是参数体系的"最后一块拼图"。在学习了位置参数、关键字参数、默认参数、`*args` 和 `**kwargs` 之后，`/` 和 `*` 让你从"被动接受"变成"主动约束"——你不再只是定义参数，你可以精确控制它们的使用方式。

### 1.3 最简示例

```python
# / 之前：只能位置
# * 之后：只能关键字
# 中间：两者皆可
def transfer(from_account, to_account, /, amount, *, force=False):
    """转账——账号必须位置传，金额可位置或关键字，force 必须关键字"""
    return f"从 {from_account} 转账 ¥{amount} → {to_account}，强制：{force}"


print(transfer("621700001", "621700002", 5000, force=True))
```

---

## 2. 核心内容

### 2.1 `/` 分隔符：仅位置参数

#### 2.1.1 基本语法

`/` 在形参列表中单独出现，它**之前**的所有形参都是仅位置参数（positional-only）：

```python
def func(a, b, /, c):
    """a, b 仅位置；c 位置或关键字皆可"""
    pass


func(1, 2, 3)       # ✅
func(1, 2, c=3)     # ✅
# func(a=1, b=2, c=3)  # ❌ TypeError: a 和 b 不能用关键字
```

多个仅位置参数同样适用：

```python
def calculate(x, y, /, operation="add"):
    if operation == "add":
        return x + y
    return x * y


print(calculate(3, 5))          # 8
print(calculate(3, 5, "mult"))  # 15
# calculate(x=3, y=5)           # ❌ TypeError
```

错误信息会明确指出哪些参数被错误地通过关键字传递了：

```text
TypeError: calculate() got some positional-only arguments 
           passed as keyword arguments: 'x, y'
```

#### 2.1.2 Python 3.8+ 允许仅位置参数有默认值

```python
def add(a=0, b=0, /):
    """仅位置参数 + 默认值——Python 3.8+ 支持"""
    return a + b


print(add())        # 0
print(add(5))       # 5  → a=5
print(add(5, 3))    # 8  → a=5, b=3
```

#### 2.1.3 为什么需要 `/`？

**原因一：参数名是内部实现细节，不应暴露给调用者**

对于 `pow(x, y)`、`len(obj)` 这样的函数，参数名 `x`、`y`、`obj` 本身不具备额外的语义价值。将它们设为仅位置参数，调用者就不需要知道这些名字。

**原因二：允许库作者自由改名而不破坏调用者代码**

```python
# 库函数——参数名 x, y 是内部实现
def multiply(x, y, /):
    return x * y

# 调用者只用位置传参——库作者改名为 a, b 也不影响
multiply(3, 5)
```

**原因三：与 C 语言实现的 Python 内置函数行为一致**

CPython 中许多 C 实现的函数（如 `len()`、`abs()`）天然不接受关键字参数。`/` 让纯 Python 函数可以表现出相同的行为。

### 2.2 `*` 分隔符：仅关键字参数

#### 2.2.1 基本语法回顾

`*` 在形参列表中单独出现，它**之后**的所有形参变为仅关键字参数（keyword-only）：

```python
def register(name, email, *, role="user", notify=True):
    return f"{name} <{email}>，角色={role}"


register("张三", "zhang@ex.com", role="admin", notify=False)  # ✅
# register("张三", "zhang@ex.com", "admin", True)             # ❌ TypeError
```

#### 2.2.2 仅关键字参数的三种形式

| 形式 | 示例 | 说明 |
|------|------|------|
| 有默认值 | `*, debug=False` | 可选——调用者可传可不传 |
| 无默认值 | `*, name` | 必选——调用者必须通过关键字传 |
| `*args` 之后自动成为 | `def f(a, *args, c)` | `c` 在 `*args` 之后，自动仅关键字 |

```python
def demo(a, *args, c, d=10):
    """c 和 d 都在 *args 之后——自动仅关键字"""
    print(f"a={a}, args={args}, c={c}, d={d}")


demo(1, 2, 3, c=100)  # ✅ c 通过关键字
# demo(1, 2, 3, 4)    # ❌ 没有关键字传 c
```

#### 2.2.3 为什么需要 `*`？

**原因一：强制 bool 参数通过关键字传递，消除调用歧义**

```python
def create_file(name, *, overwrite=False, backup=True):
    """overwrite 和 backup 必须通过关键字——True/False 不能裸传"""
    ...

create_file("data.txt", overwrite=True)  # ✅ 意图清晰
# 如果没有 *：create_file("data.txt", True, False)  # True、False 代表什么？
```

**原因二：API 向后兼容——新增参数不破坏旧调用**

```python
# v1: def search(query, *, limit=10)
# v2: def search(query, *, sort_by="relevance", limit=10)

# 旧调用 search("Python", limit=20) 不受影响
# 新调用 search("Python", sort_by="date", limit=20) 可以使用新参数
```

### 2.3 同时使用 `/` 和 `*`：完整三区划分

```python
def func(a, b, /, c, d, *, e, f=10):
    """
    a, b   → /  之前  → 仅位置参数
    c, d   → / * 之间 → 位置或关键字皆可
    e, f   → *  之后  → 仅关键字参数
    """
    ...


func(1, 2, 3, 4, e=5, f=6)      # ✅
func(1, 2, c=3, d=4, e=5)        # ✅ c,d 用关键字
func(1, 2, 3, d=4, e=5)          # ✅ 混合
# func(1, 2, 3, 4, e=5, f=6)     # ❌ f 不能用位置
# func(a=1, b=2, c=3, d=4, e=5)  # ❌ a,b 不能用关键字
```

**三区域的行为对比**：

| 区域 | 位置传参 | 关键字传参 | 典型用途 |
|------|---------|-----------|---------|
| `/` 之前 | ✅ | ❌ | 参数名不重要、与 C 内置函数一致 |
| `/` 和 `*` 之间 | ✅ | ✅ | 常规参数（默认行为） |
| `*` 之后 | ❌ | ✅ | bool 标志、向后兼容新增参数 |

**加入 `*args` 和 `**kwargs` 的完整签名**：

```python
def full(a, b, /, c, d, *args, e, f=10, **kwargs):
    pass


            / → 仅位置     *args → 仅关键字    **kwargs
         a, b       c, d    [收集位置]    e, f     [收集关键字]
```

### 2.4 Python 内置函数中的实际应用

Python 3.8+ 中，内置函数的签名已经使用 `/` 和 `*` 来明确参数约束。用 `help()` 查看任意内置函数，你会看到这些分隔符：

| 内置函数 | 签名（简化） | `/` 和 `*` 的含义 |
|---------|-------------|-----------------|
| `abs(x, /)` | x 仅位置 | 参数名没有语义价值 |
| `len(obj, /)` | obj 仅位置 | 同上 |
| `pow(x, y, z=None, /)` | 全部仅位置 | 数学函数，位置最自然 |
| `print(*objects, sep=' ', end='\n', file, flush)` | *objects 收集，后面自动仅关键字 | sep/end/file 不应位置传 |
| `sorted(iterable, /, *, key=None, reverse=False)` | iterable 仅位置，key/reverse 仅关键字 | 可选参数必须关键字 |
| `sum(iterable, /, start=0)` | iterable 仅位置 | 首个参数语义清晰，位置最合适 |
| `max(iterable, /, *, default, key)` 等 | 复杂模式 | 单参数时位置，关键字参数强制关键字 |

**以 `sorted()` 为例分析设计意图**：

```python
# sorted 的完整签名
def sorted(iterable, /, *, key=None, reverse=False):
    """iterable 只能位置传——这是唯一需要排序的数据源
       key 和 reverse 只能关键字传——它们是可选配置"""
    ...

# ✅ 正确的调用方式
sorted([3, 1, 2])                    # iterable 位置
sorted([3, 1, 2], reverse=True)      # reverse 关键字
sorted([3, 1, 2], key=abs)           # key 关键字

# ❌ 被 / 和 * 阻止的错误写法
# sorted(iterable=[3, 1, 2])  # iterable 不能关键字传
# sorted([3, 1, 2], None, True)  # key 和 reverse 不能位置传
```

`key=None` 和 `reverse=False` 的顺序如果搞反了会非常隐蔽——用关键字参数彻底消除了这个风险。

**以 `pow()` 为例分析**：Python 的 `pow(x, y, z=None, /)` 全部参数仅位置，因为它是纯数学函数——`pow(2, 10)` 比 `pow(x=2, y=10)` 更自然。第三个参数 `z` 是取模参数（计算 `(x**y) % z`），使用频率低，但位置传参并不影响可读性。

### 2.5 参数约束的实际设计案例

#### 2.5.1 案例一：文件操作函数

```python
def copy_file(source, destination, /, *, overwrite=False, chunk_size=8192):
    """复制文件

    source, destination — 仅位置：源和目标路径不需要参数名
    overwrite, chunk_size — 仅关键字：配置项需要关键字表明意图
    """
    action = "覆盖" if overwrite else "跳过"
    print(f"复制 {source} → {destination}（{action}，块大小={chunk_size}）")


# 正确调用方式
copy_file("/tmp/a.txt", "/data/a.txt")                    # 默认行为
copy_file("/tmp/a.txt", "/data/a.txt", overwrite=True)     # 覆盖
copy_file("/tmp/a.txt", "/data/a.txt", chunk_size=4096, overwrite=False)
```

#### 2.5.2 案例二：转账函数——金融场景的安全设计

```python
def transfer(from_account, to_account, /, amount, *, force=False):
    """转账——from/to 仅位置防止写反后静默错误

    from_account 和 to_account 都是字符串，如果允许关键字传参，
    调用者可能写出 from_account=xxx, to_account=xxx，
    虽然不会错，但 / 强制位置传参减少了释放参数的可能性。

    force 必须关键字——调用者必须明确表态是否强制执行
    """
    return f"从 {from_account} 转账 ¥{amount} → {to_account}，强制：{force}"


transfer("621700001", "621700002", 5000, force=False)
# transfer(from_account="621700001", to_account="621700002", 5000)
# ❌ 被 / 阻止——强制用位置，减少出错可能
```

#### 2.5.3 案例三：API 请求函数

```python
def request(method, url, /, *, headers=None, timeout=30,
            retries=0, verify_ssl=True):
    """HTTP 请求——核心参数仅位置，配置参数仅关键字

    method 和 url 是每次请求必须指定且没有歧义的核心参数。
    headers、timeout 等是可选配置——关键字传参一目了然。
    """
    parts = [f"{method} {url}"]
    parts.append(f"超时={timeout}s，重试={retries}次")
    parts.append(f"SSL={'验证' if verify_ssl else '跳过'}")
    return " | ".join(parts)


print(request("GET", "https://api.com/users"))
print(request("POST", "https://api.com/users",
              headers={"Auth": "xxx"}, retries=3))
```

### 2.6 参数约束与类型提示的结合

Python 3.8+ 中，`/` 和 `*` 可以与类型提示一起使用，形成完整的函数契约：

```python
def connect(
    host: str,
    port: int,
    /,                    # host, port 仅位置
    *,
    user: str = "root",
    password: str = "",
    database: str | None = None,
    timeout: int = 30,
) -> str:
    """
    参数分区 + 类型提示 = 完整的函数契约：
    - host, port: 仅位置，必选
    - user, password, database, timeout: 仅关键字，有默认值
    """
    ...
```

这提供了三层信息：
1. **参数传递方式**（仅位置 / 仅关键字）
2. **参数类型**（类型提示）
3. **是否可选**（有无默认值）

三者在函数签名中一目了然，是 Python API 设计的最佳实践。

---

## 3. 最佳实践

### 3.1 推荐 vs 不推荐写法对比

#### 3.1.1 参数名不重要时用 `/`

**不推荐**：

```python
def square(number):
    return number * number

square(number=5)  # 画蛇添足——number 这个参数名毫无额外信息
```

**推荐**：

```python
def square(x, /):
    return x * x

square(5)  # ✅ 简洁，不允许 square(x=5)
```

#### 3.1.2 bool 标志用 `*`

**不推荐**：

```python
def open_file(path, binary, encoding="utf-8"):
    ...

open_file("data.txt", True)  # True 是 binary？还是什么？
```

**推荐**：

```python
def open_file(path, *, binary=False, encoding="utf-8"):
    ...

open_file("data.txt", binary=True)  # ✅ 意图清晰
```

#### 3.1.3 需要向后兼容加参数时用 `*`

**不推荐**：新增参数破坏旧调用

```python
# v2 在中间插入新参数 → 所有 v1 的位置调用全部崩溃
def search(query, sort_by="relevance", limit=10):
    ...
```

**推荐**：新增参数放在 `*` 之后

```python
# v2 新增 sort_by 在 * 之后 → v1 的调用不受影响
def search(query, *, sort_by="relevance", limit=10):
    ...
```

### 3.2 常见错误模式及修正

**错误一：`/` 放在 `*` 之后**

```python
# ❌ 语法错误——/ 必须在 * 之前
# def func(*, a, /):  # SyntaxError
#     pass
```

**错误二：使用 `/` 但 Python 版本 < 3.8**

`/` 分隔符是 Python 3.8 引入的特性，在更低版本中使用会报 SyntaxError。检查运行环境的 Python 版本。

**错误三：用 `/` 或 `*` 过度约束参数**

不是所有参数都需要约束——`/` 和 `*` 之间的自由区是故意留的。以下场景不需要强制约束：

```python
# 过度约束：x, y 用位置很自然，但用关键字也不会出错
def distance(*, x1, y1, x2, y2):  # ❌ 过度——全强制关键字
    return ((x2 - x1)**2 + (y2 - y1)**2)**0.5

# 适度约束：保持默认行为
def distance(x1, y1, x2, y2):     # ✅ 位置和关键字都可以
    return ((x2 - x1)**2 + (y2 - y1)**2)**0.5
```

**错误四：把有语义价值的参数放在 `/` 之前**

```python
# ❌ host 参数名本身有语义——但被 / 隐藏了
def connect(host, /, *, timeout=30):
    ...
# connect(host="localhost")  # TypeError——这不合理

# ✅ host 的参数名有传达信息的作用，不应仅位置
def connect(host, *, timeout=30):
    ...
connect(host="localhost")  # ✅
```

**错误五：重复使用 `*` 分隔符**

```python
# ❌ 语法错误——只能有一个独立的 *
# def func(*, a, *, b):  # SyntaxError
#     pass

# ✅ 如果 *args 存在，它后面的参数自动成为仅关键字
def func(a, *args, b, c=10):  # b 和 c 自动仅关键字
    pass
```

### 3.3 参数类型约束的设计检查清单

1. **参数名有意义吗？** → 有意义就允许关键字；无意义就用 `/` 仅位置
2. **参数是 bool？** → 强制放到 `*` 之后
3. **需要向旧 API 新增参数？** → 放到 `*` 之后，保持向下兼容
4. **函数有 C 实现版本？** → `/` 之前的参数保持与 C 版本行为一致
5. **`/` 和 `*` 之间的参数是自由区** → 调用者可以选择位置或关键字
6. **是否过度约束？** → 不是所有参数都需要强制约束，自由区是最自然的选择

### 3.4 从松散到严格——一个函数的演化过程

通过一个函数签名逐步收紧的过程，体会参数约束的实际价值：

**阶段一：最松散——所有参数都是位置或关键字皆可**

```python
def connect(host, port, user, password, database, timeout, ssl):
    # 调用时 7 个参数，顺序极易搞错
    ...
connect("db.com", 3306, "admin", "secret", "myapp", 30, True)
# True 是什么？30 是什么？不查文档完全看不懂
```

**阶段二：加默认值——减少必选项**

```python
def connect(host, port=3306, user="root", password="", database=None,
            timeout=30, ssl=True):
    ...
connect("db.com")  # 最简调用，其余用默认
# 但想改 ssl 为 False，必须把前面所有参数都传一遍
```

**阶段三：用 `*` 强制可达关键字**

```python
def connect(host, port=3306, *, user="root", password="", database=None,
            timeout=30, ssl=True):
    ...
connect("db.com")                          # 最简
connect("db.com", user="admin", ssl=False)  # 只改两个
# host 和 port 用位置，其余关键字——已经相当清晰了
```

**阶段四：加 `/` 防止滥用关键字**

```python
def connect(host, port=3306, /, *, user="root", password="", database=None,
            timeout=30, ssl=True):
    ...
connect("db.com")  # ✅
connect("db.com", 5432, user="admin", ssl=False)  # ✅
# connect(host="db.com")  # ❌ 被 / 阻止——host 就是位置参数
```

最终版本既保证了简洁的调用路径，又防止了不合理的参数传递方式——这就是参数约束的终极形态。

### 3.5 参数约束的"不要过度约束"原则

`/` 和 `*` 是强大的工具，但不必在所有函数中都使用。以下场景保持默认行为更好：

- 只有 1-2 个参数的简单函数
- 参数有明确语义且名称本身就是文档
- 内部使用的私有函数（而非公开 API）
- 团队刚开始引入参数约束，逐步推广

**核心原则**：参数约束是为调用者服务的。如果约束让调用变得更清晰，就加；如果约束只是增加了"看起来更专业"的感觉但没改变调用体验，就不加。

---

## 4. 原理

### 4.1 参数分类在函数对象中的存储

函数对象的 `__code__` 属性记录了各区域参数的数量：

```python
def demo(a, b, /, c, d, *, e, f=10):
    pass

print(f"位置参数数（含 / 之前）：{demo.__code__.co_argcount}")         # 4 (a,b,c,d)
print(f"仅关键字参数数（* 之后）：{demo.__code__.co_kwonlyargcount}")  # 2 (e,f)
print(f"所有变量名：{demo.__code__.co_varnames}")                    # ('a','b','c','d','e','f')
```

`co_posonlyargcount`（Python 3.8+）单独记录仅位置参数的数量：

```python
print(f"仅位置参数数：{demo.__code__.co_posonlyargcount}")  # 2 (a,b)
```

### 4.2 调用时的参数分区匹配流程

```text
调用 func(1, 2, c=3, d=4, e=5)，其中 func(a, b, /, c, d, *, e, f=10)
  ↓
1. 绑定仅位置参数：a=1, b=2（从位置实参队列取前 2 个）
2. 绑定中间区参数：c=3（位置），d=4（关键字）
3. 绑定仅关键字参数：e=5（关键字），f 用默认值 10
4. 安全检查：
   - 仅位置参数没有通过关键字传入 ✅
   - 仅关键字参数没有通过位置传入 ✅
   - 所有必选参数已赋值 ✅
```

违反约束时的具体错误信息：

```python
def demo(a, b, /, c, *, d):
    pass

# demo(c=3, a=1, b=2, d=4)
# TypeError: demo() got some positional-only arguments passed as keyword arguments: 'a, b'

# demo(1, 2, 3, 4)
# TypeError: demo() takes 3 positional arguments but 4 were given
# (第4个位置参数想传给 d，但 d 只接受关键字)
```

Python 能够精确指出哪些参数违反了哪种约束，这让调试参数传递错误时非常直接。

这个流程展示了 `/` 和 `*` 如何分别在步骤 1 和步骤 3 施加约束——违反约束时直接抛出 TypeError。

---

## 5. 总结

本文围绕 Python 的参数类型约束展开，主要介绍了以下内容：

- `/` 分隔符（Python 3.8+）标记仅位置参数——之前的参数只能位置传递
- `*` 分隔符标记仅关键字参数——之后的参数只能关键字传递
- 两者组合划分形参列表为三个区域：仅位置区 `/`、自由区 `*`、仅关键字区，配合 `*args` 和 `**kwargs` 形成完整的参数类型体系
- `/` 用于隐藏无意义的参数名、允许库作者改名、与 C 内置函数行为一致
- `*` 用于强制 bool 参数用关键字消除歧义、新增参数时保持向后兼容
- Python 3.8+ 内置函数已全面采用这些分隔符，`sorted(iterable, /, *, key, reverse)` 是最佳范例
- 参数约束让函数签名从"定义参数"升级为"定义参数的传递契约"——这是 Python API 设计精细化的关键一步
- 关键的学习方法是阅读 Python 标准库的签名：`help(len)`、`help(sorted)`、`help(sum)` 中都能看到 `/` 和 `*` 的实际应用