---
group:
  title: 【12】函数参数介绍
  order: 12
order: 6
title: 可变位置参数 *args
nav:
  title: Python基础
  order: 1
---

# 可变位置参数 *args

## 1. 介绍

### 1.1 什么是 *args

`*args` 是 Python 中用于接收**任意数量位置参数**的语法。在函数定义时，形参列表中写 `*args`，调用时所有超出普通形参数量的位置实参，都会被收集到一个元组中。

```python
def print_all(*args):
    for item in args:
        print(item)


print_all("苹果", "香蕉", "橘子")
```

运行结果：

```text
苹果
香蕉
橘子
```

无论传入 0 个、3 个还是 100 个参数，`*args` 都能接收——它消除了"函数必须提前知道参数个数"的限制。`args` 本身是一个**元组**，支持所有元组操作（索引、切片、迭代、`len()` 等）。

### 1.2 在 Python 知识体系中的位置

`*args` 是 Python 参数体系中的"弹性机制"。标准的位置参数和关键字参数解决了"已知参数列表"的场景，`*args` 解决了"参数数量可变"的场景。它与 `**kwargs`（可变关键字参数）一起，构成了 Python 处理任意函数签名的基础设施。

`*args` 出现的位置决定了它在参数体系中的角色：

```text
def func(a, b, *args, c, d=10):
    pass

    ↑     ↑       ↑        ↑        ↑
   普通位置参数  *args收集剩余位置  仅关键字参数(在*args之后自动成为)
```

### 1.3 最简示例

```python
def my_sum(*numbers):
    return sum(numbers)


print(my_sum(1, 2, 3))        # 6
print(my_sum(10, 20, 30, 40)) # 100
print(my_sum())               # 0
```

同一个 `my_sum` 可以接收 0 个、3 个、4 个参数——这就是 `*args` 的核心价值：**让接口适应变化的数据量**。

---

## 2. 核心内容

### 2.1 *args 的基本语法与本质

#### 2.1.1 语法规则

`*args` 由三部分组成：

| 部分 | 含义 |
|------|------|
| `*` | 前缀符号，表示"收集剩余位置参数" |
| `args` | 变量名——约定俗成叫 `args`，但可以使用任何合法变量名 |
| 整体 | 接收所有超出普通形参数的位置实参，打包进一个元组 |

`args` 的本质就是一个**元组**——支持索引、切片、迭代、`len()`、`in` 等所有元组操作：

```python
def check_args(*args):
    print(f"类型：{type(args)}")         # <class 'tuple'>
    if args:
        print(f"第一个：{args[0]}")       # 索引
        print(f"前两个：{args[:2]}")      # 切片
    print(f"包含 42：{42 in args}")      # in 判断
    print(f"元素数：{len(args)}")         # 长度


check_args(10, 20, 30, 42)
```

运行结果：

```text
类型：<class 'tuple'>
第一个：10
前两个：(10, 20)
包含 42：True
元素数：4
```

#### 2.1.2 可以接收 0 个参数

`*args` 不强制要求调用者提供额外参数——传 0 个参数时，`args` 就是一个空元组 `()`：

```python
def show(*args):
    print(f"收到 {len(args)} 个参数：{args}")


show()            # 收到 0 个参数：()
show("hello")     # 收到 1 个参数：('hello',)
show(1, 2, 3)     # 收到 3 个参数：(1, 2, 3)
```

#### 2.1.3 参数类型不受限

`*args` 不限制传入参数的类型——可以混入字符串、数字、布尔值、列表等任何对象：

```python
def collect(*args):
    return list(args)


result = collect(42, "hello", 3.14, True, [1, 2, 3], {"key": "val"})
print(result)  
# [42, 'hello', 3.14, True, [1, 2, 3], {'key': 'val'}]
```

### 2.2 *args 与普通参数的混合使用

#### 2.2.1 绑定规则：普通参数先拿，剩余全给 *args

当形参列表中同时有普通参数和 `*args` 时，Python 按**先到先得**的规则绑定：先满足固定参数，剩下的全部进入 `*args`：

```python
def demo(a, b, *args):
    print(f"a={a}, b={b}, args={args}")


demo(1, 2)           # a=1, b=2, args=()
demo(1, 2, 3)        # a=1, b=2, args=(3,)
demo(1, 2, 3, 4, 5)  # a=1, b=2, args=(3, 4, 5)
```

用流程图表示绑定过程：

```text
调用 demo(1, 2, 3, 4, 5)
  ↓
实参队列：[1, 2, 3, 4, 5]
  ↓
形参 a  ← 拿走 1（队列剩下 [2, 3, 4, 5]）
形参 b  ← 拿走 2（队列剩下 [3, 4, 5]）
*args   ← 拿走全部剩余 [3, 4, 5] → 元组 (3, 4, 5)
  ↓
结果：a=1, b=2, args=(3, 4, 5)
```

#### 2.2.2 形参列表中 *args 的位置限制

`*args` 在形参列表中只能出现一次，且必须排在所有普通位置参数之后：

```python
# ✅ 正确：普通参数 → *args → 仅关键字参数
def func(a, b, *args, c, d=10):
    pass

# ❌ 错误：*args 不能放在普通参数前面
# def func(*args, a):     # SyntaxError
#     pass
```

一个重要的副作用：**`*args` 后面的所有形参自动成为仅关键字参数**：

```python
def demo(a, *args, c, d=10):
    print(f"a={a}, args={args}, c={c}, d={d}")


demo(1, 2, 3, c=100)       # args=(2, 3), c=100
# demo(1, 2, 3, 100, 200)  # ❌ TypeError: c 和 d 不能用位置传参！
```

### 2.3 *args 的核心应用场景

#### 2.3.1 灵活的函数接口——汇总/聚合操作

当函数需要处理"任意多个值"时，`*args` 是最自然的设计：

```python
def my_max(*values):
    """接收任意数量的值，返回最大值"""
    if not values:
        return None
    result = values[0]
    for v in values[1:]:
        if v > result:
            result = v
    return result


print(my_max(3, 7, 2, 9, 5))  # 9
print(my_max(42))              # 42
print(my_max())                # None
```

Python 的内置函数 `max()`、`min()` 就是采用了这种设计——它们既可以接收多个位置参数，也可以接收单个可迭代对象。

#### 2.3.2 参数转发——包装函数

`*args` 最常见的用途是**转发参数**：写一个包装函数，它不关心被包装函数的签名，只是把所有参数原封不动地传递过去：

```python
def logged_api(*args):
    """为底层 API 添加日志——不修改原始 API 的签名"""
    print(f"[LOG] 调用参数：{args}")
    result = original_api(*args)   # 解包转发
    print(f"[LOG] 返回结果：{result}")
    return result
```

这种模式在装饰器、代理函数、中间件中大量使用。`*args` 让包装函数无需知道被包装函数的参数细节。

#### 2.3.3 装饰器——通用函数包装

装饰器借助 `*args` 可以适配**任意函数签名**：

```python
def timer(func):
    import time
    def wrapper(*args):
        start = time.time()
        result = func(*args)
        print(f"[{func.__name__}] 耗时：{time.time() - start:.4f}s")
        return result
    return wrapper


@timer
def add(a, b):
    return a + b

@timer
def many_sum(*numbers):
    return sum(numbers)


print(add(3, 5))           # [add] 耗时：0.0000s → 8
print(many_sum(1,2,3,4,5)) # [many_sum] 耗时：0.0000s → 15
```

同一个 `timer` 装饰器，`add` 用到了 `wrapper(*args)` 的"收集"能力，`many_sum` 则展示了双重 `*`（外层收集 + 内层解包）。

### 2.4 定义侧的 *args vs 调用侧的 *

这是 `*` 符号最容易混淆的地方——同一个 `*` 在定义侧和调用侧含义不同：

| 位置 | 语法 | 含义 | 方向 |
|------|------|------|------|
| **定义侧** | `def func(*args):` | **收集**：多个独立实参 → 一个元组 | 分散 → 聚合 |
| **调用侧** | `func(*iterable)` | **解包**：一个可迭代对象 → 多个独立实参 | 聚合 → 分散 |

```python
# 定义侧 *args：收集（多→一）
def collect(*args):
    print(args)

collect(1, 2, 3)           # 3 个独立实参 → (1, 2, 3) 一个元组

# 调用侧 *：解包（一→多）
data = [1, 2, 3]
collect(*data)             # [1, 2, 3] 一个列表 → 1, 2, 3 三个独立实参
```

`collect(*data)` 等价于 `collect(1, 2, 3)`——`*data` 把列表"拆"成了三个独立参数。两者可以配合使用，形成"解包→收集"的往返。

**解包可以与其他位置参数混合使用**：

```python
def process(*args):
    print(f"收到 {len(args)} 个参数：{args}")


# 混合：先固定值，再解包可迭代对象
data = [10, 20, 30]
process(1, 2, *data)    # 1, 2 在前，然后 10, 20, 30 → 共 5 个参数
process(*data, -1, -2)  # 10, 20, 30 在前，然后 -1, -2 → 共 5 个参数
```

运行结果：

```text
收到 5 个参数：(1, 2, 10, 20, 30)
收到 5 个参数：(10, 20, 30, -1, -2)
```

解包的参数可以和普通参数、关键字参数自由组合，遵循"所有位置参数必须排在关键字参数之前"的规则。

**常见误区：解包一个字符串**

```python
def show(*args):
    print(args)


show(*"ABC")   # 输出：('A', 'B', 'C')
```

字符串是可迭代对象，`*"ABC"` 会把每个字符解包为一个独立参数。如果你想把 `"ABC"` 作为单个字符串传入，去掉 `*` 即可：`show("ABC")`  → `('ABC',)`。

**可解包的对象类型**：

| 对象类型 | 示例 | 解包结果 |
|---------|------|---------|
| list | `*[1, 2, 3]` | `1, 2, 3` |
| tuple | `*(4, 5, 6)` | `4, 5, 6` |
| str | `*"hi"` | `'h', 'i'` |
| range | `*range(3)` | `0, 1, 2` |
| 生成器 | `*(x*2 for x in range(3))` | `0, 2, 4` |
| set | `*{7, 8}` | `8, 7`（无序） |
| dict | `*{"a": 1}` | `'a'`（key 作为参数） |

注意 set 和 dict 解包时元素/键的顺序不确定——这在某些场景下可能产生 bug。

**任何可迭代对象都可以在调用侧使用 `*` 解包**：

```python
def collect(*args):
    return list(args)


print(collect(*(1, 2, 3)))              # 解包元组
print(collect(*[4, 5, 6]))              # 解包列表
print(collect(*"ABC"))                  # 解包字符串 → 'A', 'B', 'C'
print(collect(*range(3)))               # 解包 range → 0, 1, 2
print(collect(*(x*2 for x in range(3)))) # 解包生成器 → 0, 2, 4
```

### 2.5 *args 与可变默认参数的关系

`*args` 本身不涉及可变默认值陷阱——`args` 的默认"值"是空元组 `()`，而元组是不可变的。但要注意，`*args` 中的元素如果是可变对象（如列表），这些元素本身仍然可以在函数体内被修改：

```python
def append_all(*lists):
    """每个 lists 元素是一个列表，可以各自修改"""
    result = []
    for lst in lists:
        result.extend(lst)
    return result


print(append_all([1, 2], [3, 4], [5]))  # [1, 2, 3, 4, 5]
# 注意：这里传的每个列表本身是可变的，但 args 元组本身不会被意外修改
```

---

## 3. 最佳实践

### 3.1 推荐 vs 不推荐写法对比

#### 3.1.1 用 *args 保持接口灵活性

**不推荐**：绑定固定数量的参数

```python
# 只能接收 3 个数——如果用户想算 5 个数就不行
def average_3(a, b, c):
    return (a + b + c) / 3
```

**推荐**：用 *args 适配任意数量

```python
def average(*numbers):
    """支持任意数量的参数"""
    if not numbers:
        return 0
    return sum(numbers) / len(numbers)


print(average(90, 85, 88))              # 3 个
print(average(90, 85, 88, 92, 95, 78))  # 6 个——同一个函数
```

#### 3.1.2 用 *args 转发而不是重写签名

**不推荐**：包装函数重新声明被包装函数的签名

```python
# 底层 API 签名变了，log_and_call 也要同步改——脆弱！
def log_and_call(a, b):
    print(f"调用 add({a}, {b})")
    return add(a, b)
```

**推荐**：用 *args 自动适配

```python
def log_and_call(func, *args):
    print(f"调用 {func.__name__}，参数：{args}")
    return func(*args)
# 无论 func 的签名怎么变，log_and_call 都不需要改
```

#### 3.1.3 命名优先使用 args 约定

**推荐**：在通用场景中使用 `*args`

```python
def wrapper(*args):  # 全社区约定——一看就知道是可变位置参数
    ...
```

**可接受**：特定领域中使用更有语义的名字

```python
def sum_all(*numbers):   # numbers 比 args 更直观
    return sum(numbers)

def join_names(*names):  # names 更准确
    return ", ".join(names)
```

**原则**：通用函数（装饰器、代理、转发）用 `*args`；特定领域函数且名字能显著增加可读性时，可以用更有语义的名字。

### 3.2 常见错误模式及修正

**错误一：混淆 `show(data)` 和 `show(*data)`**

```python
def show(*args):
    print(args)


data = [1, 2, 3]

show(data)    # 输出：([1, 2, 3],)  ← 整个列表作为一个参数！
show(*data)   # 输出：(1, 2, 3)      ← 列表的每个元素作为独立参数
```

记忆诀窍：`show(data)` 传了 1 个参数（列表对象），`show(*data)` 传了 3 个参数（列表的三个元素）。从 `*args` 的视角看——`show(data)` 中 `args` 是 `([1, 2, 3],)`（元组里包了一个列表），`show(*data)` 中 `args` 是 `(1, 2, 3)`（三个元素展开在元组里）。

**错误二：认为 *args 能接收关键字参数**

`*args` 只接收**位置**参数——关键字参数由 `**kwargs` 接收：

```python
def func(*args):
    print(args)

# func(a=1, b=2)  # ❌ TypeError: func() got an unexpected keyword argument 'a'
```

如果调用 `func(a=1)`，Python 在形参中找不到名为 `a` 的参数，直接报 `TypeError`。`*args` 处理的是"多出来的位置实参"，不涉及关键字匹配。

**错误三：同时用 `*args` 和 `**kwargs` 时搞混**

```python
def process(*args, **kwargs):
    print(f"位置参数：{args}")
    print(f"关键字参数：{kwargs}")


process(1, 2, 3, name="alice", age=25)
# 位置参数：(1, 2, 3)
# 关键字参数：{'name': 'alice', 'age': 25}

process()  # args=(), kwargs={}——两者都可以为空
```

**错误四：在 *args 后面放普通位置参数**

```python
# ❌ 语法错误——*args 之后不能再有普通位置参数
# def broken(*args, regular):  # SyntaxError
#    pass
```

但 `*args` 之后可以有仅关键字参数——因为关键字参数通过名字匹配，不依赖位置：

```python
# ✅ *args 之后可以放仅关键字参数
def valid(*args, required_kw):
    """required_kw 必须通过关键字传递"""
    print(f"args={args}, required_kw={required_kw}")

valid(1, 2, 3, required_kw="hello")  
# valid(1, 2, 3, "hello")  # ❌ TypeError: 缺少 required_kw
```

**错误五：在 *args 内部使用 `*args` 做运算时不检查空元组**

```python
def average(*numbers):
    # ❌ 没有检查空元组——numbers[0] 会 IndexError
    total = sum(numbers) / len(numbers)  # 0/0 → ZeroDivisionError
    return total
```

修正：先检查 `if not numbers: return 0` 或返回 `None`。

### 3.3 Python 内置函数中的 *args 实例

Python 标准库和内置函数中有大量 `*args` 的使用案例，学习它们是理解这个模式的最好教材：

| 内置函数 | 签名 | *args 的作用 |
|---------|------|-------------|
| `print()` | `print(*objects, sep, end, file, flush)` | 接收任意数量的打印对象 |
| `max()` | `max(iterable, *, ...)` 或 `max(*args, ...)` | 接收任意数量的值 |
| `min()` | `min(iterable, *, ...)` 或 `min(*args, ...)` | 同上 |
| `zip()` | `zip(*iterables)` | 接收任意数量的可迭代对象 |
| `map()` | `map(func, *iterables)` | 接收任意数量的可迭代对象 |

以 `print()` 为例——你能写 `print("a", "b", "c")` 就是因为它的第一个参数是 `*objects`。`max()` 同样支持两种调用方式：

```python
print(max(3, 7, 2, 9))          # *args 方式：多个位置参数
print(max([3, 7, 2, 9]))        # 单可迭代对象方式
```

### 3.4 一个完整的实际应用：命令行参数解析器

用 `*args` 构建一个简单的 CLI 命令解析器，展示它在实际项目中如何工作：

```python
def run_command(command, *args):
    """模拟 CLI 命令执行——命令 + 任意参数"""
    commands = {
        "create": lambda name: f"创建项目 {name}",
        "deploy": lambda env: f"部署到 {env} 环境",
        "list": lambda *filters: f"列出项目（过滤: {filters}）",
    }

    if command not in commands:
        return f"未知命令：{command}"

    try:
        return commands[command](*args)
    except TypeError as e:
        return f"参数错误：{e}"


# 模拟用户输入
print(run_command("create", "my-app"))
print(run_command("deploy", "production"))
print(run_command("list", "active", "python", "web"))

# ❌ 错误命令
print(run_command("delete"))
```

运行结果：

```text
创建项目 my-app
部署到 production 环境
列出项目（过滤: ('active', 'python', 'web')）
未知命令：delete
```

`*args` 让这个函数可以适配任意命令的参数需求——`create` 需要 1 个参数、`deploy` 需要 1 个参数、`list` 需要 0 到任意多个过滤条件。它们共享同一个 `run_command` 入口。

### 3.3 *args 设计检查清单

1. **参数数量不固定？** → 用 `*args` 收集
2. **在写装饰器或包装函数？** → 几乎一定需要 `*args`
3. **`*args` 的名字能提供额外语义？** → 如 `*numbers`、`*names` 可以考虑，否则用 `args`
4. **调用方需要解包可迭代对象？** → 用 `func(*iterable)` 调用侧解包
5. **数据量过大会导致内存压力？** → 考虑接收一个迭代器而非 `*args` 全部装入内存

---

## 4. 原理

### 4.1 *args 在函数对象中的存储

Python 通过函数对象的 `__code__` 属性在底层记录参数信息。`*args` 的存在会影响这些属性：

```python
def demo(a, b, *args, c):
    pass

print(f"普通参数个数：{demo.__code__.co_argcount}")     # 2 (a, b)
print(f"仅关键字参数：{demo.__code__.co_kwonlyargcount}") # 1 (c)
# co_flags 中有一个标志位表示该函数使用了 *args
print(f"flags：{demo.__code__.co_flags & 0x04 != 0}")  # True → 有 *args
```

`co_argcount` = 2 表示 `*args` 之前有 2 个普通参数。`*args` 本身不会增加 `co_argcount`——它的参数个数是不确定的。

### 4.2 调用时的 *args 收集流程

```text
调用 demo(1, 2, 3, 4, 5, c=100)
  ↓
1. 解析实参：位置 = [1, 2, 3, 4, 5]，关键字 = {c: 100}
2. 绑定普通位置参数：a=1, b=2（位置队列剩余：[3, 4, 5]）
3. 检测到 *args → 收集剩余所有位置实参：
   args = (3, 4, 5)（剩余位置实参被打包成元组）
4. 绑定仅关键字参数：c=100
5. 检查所有必选参数都有值 → 执行函数体
```

这个过程保证了两点：`*args` 之前的所有普通参数都优先满足了；如果调用者没有提供足够的位置参数满足普通参数，`*args` 会变成空元组，而不是拿不到值导致报错。

---

## 5. 总结

本文围绕 Python 可变位置参数 `*args` 展开，主要介绍了以下内容：

- `*args` 收集任意数量的位置实参到一个元组中，本质就是 `tuple`，支持所有元组操作
- 普通参数优先匹配，剩余的全部进入 `*args`；`*args` 后跟的形参自动成为仅关键字参数
- 定义侧的 `*args`（收集，分散→聚合）和调用侧的 `*`（解包，聚合→分散）是互逆操作
- 核心应用场景：灵活函数接口、参数转发（包装函数）、装饰器、格式化函数
- 命名约定：通用场景用 `args`，特定领域可以用更语义化的名字如 `*numbers`、`*names`
- 常见错误：混淆 `show(data)` vs `show(*data)`、误以为 `*args` 接收关键字参数