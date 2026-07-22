---
group:
  title: 【10】异常处理完整体系
  order: 10
order: 2
title: 捕获多个异常
nav:
  title: Python
  order: 1
---

---

## 1. 介绍

### 1.1 什么是捕获多个异常

在实际编程中，一段代码可能抛出多种不同类型的异常。比如读取文件时可能遇到 `FileNotFoundError`（文件不存在）、`PermissionError`（权限不足）、`IsADirectoryError`（路径是目录而非文件），调用外部 API 时可能遇到 `ConnectionError`（网络不通）、`TimeoutError`（超时）、`JSONDecodeError`（返回格式错误）。如果只用单个 `except` 子句捕获所有异常，会丢失区分度——读者不知道是什么异常，处理代码也只能给出通用补救。但如果对每种异常都写一个 `try-except` 单独处理，又会导致大量重复的 try 嵌套，代码可读性差。

Python 提供了两种捕获多个异常的手段：

1. **多个 `except` 分支**：同一个 `try` 块后跟多个 `except`，每个分支捕获一种（或一类）异常，各自有独立的处理代码。
2. **`except` 元组形式**：在一个 `except` 子句中列出多个异常类型，当这些异常的处理逻辑相同时共享一段处理代码。

此外，Python 3.11 引入了 **`ExceptionGroup` 和 `except*`**，用于处理"一组同时发生的异常"这一更复杂的场景（如 asyncio 并发任务各自抛出的异常）。

理解捕获多个异常的核心在于三点：**如何用分支区分不同异常**、**异常匹配的规则**（顺序、继承、优先级）、**什么时候该合并处理、什么时候该分别处理**。本篇将逐一展开，覆盖从基础语法到高级用法的完整图景。

```python
# 捕获多个异常的最基本形式：多个 except 分支
def safe_divide(a, b):
    """安全除法，分别处理除零和类型错误"""
    try:
        result = a / b
    except ZeroDivisionError:
        print("错误：除数不能为零")
        return None
    except TypeError:
        print("错误：操作数类型不支持除法")
        return None
    return result

# 测试
print(safe_divide(10, 2))       # 5.0
print(safe_divide(10, 0))       # 错误：除数不能为零  None
print(safe_divide("abc", 2))    # 错误：操作数类型不支持除法  None
```

运行结果说明：`safe_divide` 使用两个 `except` 分支分别处理 `ZeroDivisionError`和 `TypeError`。除零和类型错误各自得到不同的提示信息，调用者能清晰地知道发生了什么问题。如果只用 `except Exception` 统一捕获，就只能给出通用提示，失去了区分度。

### 1.2 捕获多个异常的基本语法

多个 `except` 分支的基本结构如下：

```python
try:
    # 可能抛出多种异常的代码
    pass
except SomeError:
    # 处理 SomeError
    pass
except AnotherError:
    # 处理 AnotherError
    pass
except YetAnotherError:
    pass
```

元组形式的语法：

```python
try:
    pass
except (SomeError, AnotherError):
    # 用同一段代码处理两种异常
    pass
```

两种形式可以混合使用：

```python
try:
    pass
except (ValueError, TypeError):
    # 这两种异常的处理逻辑相同
    pass
except ZeroDivisionError:
    # 除以零单独处理
    pass
```

```python
# 混合使用多分支和元组形式
def process_value(value):
    """处理用户输入的值，不同类型异常不同策略"""
    try:
        num = int(value)
        result = 100 / num
    except (ValueError, TypeError):
        # ValueError：int() 转换失败（如 "abc"）
        # TypeError：value 类型无法参与转换（如 None）
        print(f"输入类型无效：{type(value).__name__}")
        return -1
    except ZeroDivisionError:
        # 除以零需要单独提示
        print("输入不能为零")
        return -2
    except OverflowError:
        # 数值溢出（int 在 Python 3 几乎不会溢出，但作为演示）
        print("数值溢出")
        return -3
    return result

# 测试
print(process_value("42"))       # 2.38...
print(process_value("abc"))      # 输入类型无效：str  -1
print(process_value("0"))        # 输入不能为零  -2
print(process_value(None))       # 输入类型无效：NoneType  -1
```

运行结果说明：`ValueError` 和 `TypeError` 用元组合并处理（都是"输入格式不对"），`ZeroDivisionError` 单独处理（需要给出"不能为零"的明确提示）。这就是混合使用的典型场景：**处理逻辑相同的异常合并捕获，处理逻辑不同的异常分开捕获**。

---

## 2. 核心内容

### 2.1 多个 `except` 分支：一一对应，各自处理

多个 `except` 分支是最直观的捕获多个异常的方式。每个分支对应一种（或一类）异常，按顺序从上到下依次检查。一旦某个分支匹配成功，就执行该分支内的代码，然后跳过整个 `try-except` 结构。

**适用场景**：不同异常需要不同的处理逻辑——比如某些异常需要重试、某些需要记录日志后返回默认值、某些需要提示用户输入格式错误。

```python
def parse_config(file_path):
    """解析配置文件，不同异常不同处理策略"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        config = eval(content, {"__builtins__": {}}, {})
        return config
    except FileNotFoundError:
        # 策略一：文件不存在，使用默认配置
        print(f"配置文件 {file_path} 不存在，使用默认配置")
        return {"debug": False, "timeout": 30}
    except PermissionError:
        # 策略二：权限不足，记录日志并向用户报告
        print("权限不足，无法读取配置文件")
        raise  # 权限问题通常是严重的，重新抛出
    except SyntaxError:
        # 策略三：配置语法错误，返回空配置
        print("配置语法错误，返回空配置")
        return {}
    except Exception as e:
        # 策略四：其他未知错误，记录日志并安全返回
        print(f"读取配置时发生未知错误：{type(e).__name__}: {e}")
        return {}

# 测试
print("=== 文件不存在 ===")
cfg = parse_config("/tmp/nonexistent.conf")
print(f"配置：{cfg}\n")

print("=== 语法错误 ===")
cfg2 = parse_config("/tmp/bad_config.conf")
# 假设已创建 /tmp/bad_config.conf 内容为乱写
```

运行结果说明：每个 `except` 分支实现了不同的处理策略——`FileNotFoundError` 返回默认值（可恢复的错误），`PermissionError` 重新抛出（中断执行的严重错误），`SyntaxError` 返回空配置（数据格式问题但不致命），通用的 `Exception` 作为兜底。四种策略的区分使代码在遇到不同错误时能采取最合适的行动。

### 2.2 元组形式 `except (TypeError, ValueError):`：合并捕获

当多个异常的处理逻辑完全相同时，可以用元组将它们合并到一个 `except` 子句中。语法是 `except (ExceptionType1, ExceptionType2, ...):`，括号内列出多个异常类型，用逗号分隔。异常类型之间是"或"的关系——只要抛出的异常是元组中任一类型的实例，就匹配成功。

**适用场景**：多个异常属于"同一类错误"，需要采取相同补救措施。比如输入验证时 `ValueError` 和 `TypeError` 都属于"输入格式不对"，可以合并处理。

```python
def robust_input(prompt, default="0"):
    """安全获取用户数字输入，合并处理输入格式类异常"""
    try:
        value = input(prompt)
        return int(value)
    except (ValueError, TypeError) as e:
        # ValueError: int("abc") 转换失败
        # TypeError: int(None)  None 无法转换
        print(f"输入无效（{type(e).__name__}），使用默认值 {default}")
        return int(default)

# 模拟测试（不实际调用 input，用函数替代）
def test_robust_input():
    test_cases = ["42", "abc", None]
    for case in test_cases:
        try:
            value = int(case) if case is not None else None
        except (ValueError, TypeError) as e:
            print(f"输入 {case!r} 无效（{type(e).__name__}）：{e}，使用默认值")
            value = 0
        else:
            print(f"输入 {case!r} 有效：{value}")

test_robust_input()
# 输出：
# 输入 '42' 有效：42
# 输入 'abc' 无效（ValueError）：invalid literal for int() with base 10: 'abc'，使用默认值
# 输入 None 无效（TypeError）：int() argument must be a string, a bytes-like object or a real number, not 'NoneType'，使用默认值
```

运行结果说明：`ValueError` 和 `TypeError` 用元组 `(ValueError, TypeError)` 合并捕获，两者都按"输入无效，使用默认值"的策略处理。如果分开写两个分支，代码会完全重复——元组形式消除了这种重复。

```python
# 元组形式可以包含任意数量、任意继承关系的异常类型
def network_request():
    """模拟网络请求，多个错误条件归为一类重试"""
    import random
    err = random.choice(["timeout", "connection", "data", "ok"])
    if err == "timeout":
        raise TimeoutError("请求超时")
    elif err == "connection":
        raise ConnectionError("连接失败")
    elif err == "data":
        raise ValueError("数据格式错误")
    return {"status": "ok"}

# 捕获多个网络相关异常元组
retries = 3
for attempt in range(retries):
    try:
        result = network_request()
        print("请求成功")
        break
    except (TimeoutError, ConnectionError) as e:
        # TimeoutError 和 ConnectionError 都是"可重试"的网络错误
        print(f"网络错误（{type(e).__name__}），第 {attempt + 1} 次重试...")
        if attempt == retries - 1:
            print("重试耗尽，放弃")
    except ValueError as e:
        # ValueError 是"不可重试"的数据错误，直接失败
        print(f"数据错误（{type(e).__name__}），不重试")
        break
```

运行结果说明：元组 `(TimeoutError, ConnectionError)` 合并了"可重试的网络错误"——这两种错误的处理逻辑都是"等会儿再试一次"。`ValueError` 则单独处理，因为数据格式错误重试也没用。元组形式不仅节省代码量，更重要的是表达了**业务分类**：这些异常属于"同一类问题"。

### 2.3 异常捕获的匹配顺序与优先级

Python 的 `try-except` 按**从上到下、先匹配先捕获**的顺序检查每个 `except` 分支。一旦某个分支匹配成功，就执行该分支代码，**后续所有 `except` 分支都被跳过**（无论它们是否能匹配同一异常）。

```python
def check_order(a, b):
    """演示 except 的匹配顺序：先匹配先捕获"""
    try:
        result = a / b
        print(f"结果：{result}")
    except ZeroDivisionError:
        print("1. 除零错误")
    except ArithmeticError:
        # ArithmeticError 是 ZeroDivisionError 的父类
        # 但 ZeroDivisionError 在前面，所以先匹配
        print("2. 算术错误（这一行永远不会对 ZeroDivisionError 执行）")
    except Exception:
        print("3. 通用错误")

check_order(10, 0)   # 输出：1. 除零错误
```

运行结果说明：`ZeroDivisionError` 写在第一个 `except`，所以它先匹配。即使 `ArithmeticError` 也能匹配 `ZeroDivisionError`（因为继承关系），但由于顺序靠后，永远不会被执行到。匹配是"先到先得"不是"最精确优先"。

```python
# 错误的顺序：父类在前，子类在后 —— 子类分支永远无法匹配
def bad_order():
    """演示错误的分支排列：父类在前会屏蔽子类"""
    try:
        result = 10 / 0
    except ArithmeticError:
        # 父类在前，先匹配 ZeroDivisionError
        print("算术错误")        # 总是输出这个
    except ZeroDivisionError:
        # 子类在后，永远不会被执行！
        print("除零错误（永远不会输出）")

bad_order()   # 输出：算术错误

# 对比：正确的顺序——子类在前，父类在后
def good_order():
    try:
        result = 10 / 0
    except ZeroDivisionError:
        print("除零错误（优先匹配）")
    except ArithmeticError:
        print("算术错误（兜底）")

good_order()  # 输出：除零错误（优先匹配）
```

运行结果说明：第一个例子中 `ArithmeticError`（父类）写在 `ZeroDivisionError`（子类）前面，导致 `ZeroDivisionError` 分支永远不可达——因为 `ZeroDivisionError` 是 `ArithmeticError` 的子类，会被父类分支先截获。Python 解释器甚至不会报语法错误，但逻辑上子类分支是死代码。第二个例子采用正确的顺序：子类在前、父类在后。

**匹配顺序的完整规则**：

1. 从上到下依次检查每个 `except` 分支。
2. 对每个分支，使用 `isinstance(raised_exception, ExceptionClass)` 判断是否匹配。
3. 第一个返回 `True` 的分支被执行。
4. 执行完后跳过整个 `try-except` 结构。
5. 如果所有 `except` 都不匹配，异常继续向上传播。
6. 多个 `except` 分支之间不能用 `if-elif` 的"互斥"来理解——它们的关系是"先到先得"，而非"最匹配"。

```python
# 匹配顺序的深入演示：不同的 except 分支可以捕获同一异常的不同"视角"
def demonstrate_matching_order():
    """用多种异常测试匹配顺序"""
    test_exceptions = [
        ZeroDivisionError("除零"),
        ValueError("无效值"),
        TypeError("类型错误"),
        RuntimeError("运行时错误"),
    ]
    
    for exc in test_exceptions:
        print(f"\n抛出 {type(exc).__name__}：", end="")
        try:
            raise exc
        except ZeroDivisionError:
            print("被 ZeroDivisionError 分支捕获")
        except ArithmeticError:
            print("被 ArithmeticError 分支捕获")
        except ValueError:
            print("被 ValueError 分支捕获")
        except (TypeError, RuntimeError):
            print("被 (TypeError, RuntimeError) 元组分分支捕获")
        except Exception:
            print("被 Exception 兜底分支捕获")

demonstrate_matching_order()
# 输出：
# 抛出 ZeroDivisionError：被 ZeroDivisionError 分支捕获
# 抛出 ValueError：被 ValueError 分支捕获
# 抛出 TypeError：被 (TypeError, RuntimeError) 元组分分支捕获
# 抛出 RuntimeError：被 (TypeError, RuntimeError) 元组分分支捕获
```

运行结果说明：每种异常被第一个匹配的分支捕获。注意 `RuntimeError` 不被 `TypeError` 或 `ValueError` 匹配，但被元组 `(TypeError, RuntimeError)` 匹配。匹配顺序、异常类型、元组形式三者共同决定了哪个分支被执行。理解"先匹配先捕获"是写出正确异常处理代码的基础。

### 2.4 异常类的继承层次与匹配规则

Python 的异常类是一个**继承层次结构**，所有内置异常都继承自 `BaseException`。理解这个层次结构对正确捕获多个异常至关重要——因为 `except` 匹配是基于 `isinstance` 的，一个异常实例可以被它的父类分支捕获。

**异常类核心继承层次**：

```
BaseException                      # 所有异常基类（不要直接捕获！）
├── SystemExit                     # sys.exit()
├── KeyboardInterrupt              # Ctrl+C
├── GeneratorExit                  # 生成器关闭
└── Exception                      # 所有常规异常的基类（通常的兜底）
    ├── StopIteration              # 迭代结束
    ├── ArithmeticError            # 算术错误基类
    │   ├── ZeroDivisionError      # 除零
    │   ├── FloatingPointError     # 浮点错误
    │   └── OverflowError          # 溢出
    ├── LookupError                # 查找错误基类
    │   ├── IndexError             # 索引越界
    │   └── KeyError               # 键不存在
    ├── ValueError                 # 值错误
    ├── TypeError                  # 类型错误
    ├── OSError                    # 操作系统错误基类
    │   ├── FileNotFoundError      # 文件不存在
    │   ├── PermissionError        # 权限不足
    │   ├── IsADirectoryError      # 是目录
    │   └── ...
    ├── RuntimeError               # 运行时错误基类
    ├── AttributeError             # 属性不存在
    ├── NameError                  # 名称未定义
    ├── ImportError                # 导入错误
    │   └── ModuleNotFoundError    # 模块不存在
    ├── ConnectionError            # 连接错误基类
    │   ├── ConnectionRefusedError
    │   ├── ConnectionAbortedError
    │   └── ...
    └── ...
```

```python
# 基于继承层次的匹配演示
def catch_by_hierarchy(exception_instance):
    """演示异常匹配的继承层次规则"""
    print(f"\n抛出 {type(exception_instance).__name__}：", end="")
    try:
        raise exception_instance
    except ZeroDivisionError:
        print("ZeroDivisionError")
    except ValueError:
        print("ValueError")
    except Exception:
        # Exception 是所有 ArithmeticError/ValueError/TypeError/... 的祖父类
        # 但前面的具体分支先匹配了，所以这里只作为兜底
        print("Exception（兜底）")

catch_by_hierarchy(ZeroDivisionError("除零"))
catch_by_hierarchy(ValueError("无效值"))
catch_by_hierarchy(RuntimeError("未知"))
# 输出：
# 抛出 ZeroDivisionError：ZeroDivisionError
# 抛出 ValueError：ValueError
# 抛出 RuntimeError：Exception（兜底）
```

运行结果说明：`RuntimeError` 没有被前两个分支匹配到，最终被 `Exception` 捕获。因为 `RuntimeError` 继承自 `Exception`（实际上是 `RuntimeError` -> `Exception` -> `BaseException`），`isinstance(RuntimeError(), Exception)` 返回 `True`。

```python
# 关键规则：except Exception 能捕获哪些异常？
# 答案：所有 Exception 的子类实例（即几乎所有编程中遇到的异常）
# 但不会捕获 BaseException 的非 Exception 子类（如 SystemExit、KeyboardInterrupt）

try:
    result = 10 / 0          # ZeroDivisionError -> ArithmeticError -> Exception
    data = {}["missing"]     # KeyError -> LookupError -> Exception
    value = int("abc")       # ValueError -> Exception
    obj = None
    obj.method()             # AttributeError -> Exception
except Exception:
    # 以上所有异常都会被这里捕获
    print("捕获到了 Exception")

# 专门捕获 KeyboardInterrupt 和 SystemExit 的写法（通常不需要）
try:
    import sys
    sys.exit(0)
except SystemExit:
    print("遇到 SystemExit")
except BaseException:
    print("BaseException 兜底（不推荐）")
```

运行结果说明：`except Exception` 能捕获绝大多数编程异常，它排除了 `SystemExit`、`KeyboardInterrupt`、`GeneratorExit` 这些不应该被随意捕获的系统级异常。

```python
# 继承层次的匹配边界：BaseException 的"系统级"排除
# 一般情况下不应该捕获 BaseException——这会吞掉 Ctrl+C 和 sys.exit()

def dangerous_catch():
    """危险示例：捕获 BaseException 会吞掉 KeyboardInterrupt 和 SystemExit"""
    try:
        import time
        while True:
            time.sleep(1)
    except BaseException:
        # 即使用户按 Ctrl+C（KeyboardInterrupt），也被这里吞掉
        # 程序无法正常退出！
        print("BaseException 捕获了一切，包括 Ctrl+C！")

# 正确做法：只捕获 Exception（常规异常的基类）
def safe_catch():
    try:
        result = 10 / 0
    except Exception:
        print("只捕获常规异常，不干扰系统级异常")
```

运行结果说明：`except BaseException` 是危险的——它会捕获 `KeyboardInterrupt`（`Ctrl+C`）和 `SystemExit`（`sys.exit()`），导致程序无法正常退出。Python 的异常处理设计目标就是 `Exception` 作为编程异常的兜底，`BaseException` 给系统级异常保留通道。

**异常匹配的关键规则总结**：

| 规则 | 说明 | 示例 |
|------|------|------|
| `isinstance` 匹配 | `except ExcType` 等价 `isinstance(raised, ExcType)` | `ZeroDivisionError` 匹配 `ArithmeticError` |
| 父类匹配子类 | 父类 `except` 能捕获所有子孙类 | `except Exception` 捕获所有常规异常 |
| 先匹配先捕获 | 第一个匹配的分支执行，后续跳过 | 具体放前，通用放后 |
| 元组是"或"关系 | `except (A, B)` 匹配 A 或 B 任一 | `(ValueError, TypeError)` 匹配两者 |
| SystemExit/KeyboardInterrupt 不属 Exception | `except Exception` 不捕获它们 | 需显式捕获 `BaseException` |

### 2.5 `except` 分支的排列策略：从具体到通用

基于匹配顺序的规则，合理的 `except` 分支排列策略是**从最具体到最通用**：

1. **最具体的异常**（子类）在最前面，它们需要最特定的处理。
2. **较通用的异常**（父类）在中间，作为同一类异常的兜底。
3. **最通用的 `Exception`** 在最后，作为所有异常的兜底。

```python
def process_data(data):
    """处理数据，演示 from-具体-to-通用 的分支排列"""
    try:
        # 尝试解析数据
        if isinstance(data, dict):
            value = data["key"]
        elif isinstance(data, list):
            value = data[0]
        else:
            value = int(data)
        return value
    except KeyError:
        # 最具体：字典键不存在
        print("KeyError：键不存在")
        return -1
    except IndexError:
        # 最具体：列表索引越界
        print("IndexError：索引越界")
        return -2
    except (ValueError, TypeError):
        # 较具体：值或类型错误
        print("ValueError/TypeError：数据格式错误")
        return -3
    except LookupError:
        # 父类：KeyError 和 IndexError 的父类
        # 这里只捕获其他 LookupError 子类（如 EnvironmentError 等）
        print("LookupError：其他查找错误")
        return -4
    except Exception as e:
        # 兜底：所有未预见的异常
        print(f"未知错误：{type(e).__name__}: {e}")
        return -5

# 测试
print(process_data({"key": 42}))      # 42 —— 正常路径
print(process_data({"other": 1}))     # KeyError => -1
print(process_data([1, 2, 3]))        # 1 —— 正常路径
print(process_data([]))               # IndexError => -2
print(process_data("abc"))            # ValueError => -3
print(process_data(None))             # TypeError => -3
print(process_data(complex(1, 2)))    # 如果 int(complex) 报 TypeError => -3
# 其他无法预料的异常会被 Exception 兜底
```

运行结果说明：分支从 `KeyError`（最具体）到 `LookupError`（父类）到 `Exception`（最通用），形成"分级捕获"的防护网。特定异常有特定提示和返回值，未知异常由 `Exception` 兜底返回一个安全的默认值。

**分支排列是不满足"排列策略"会发生什么？**

```python
# 反例：父类放在前面屏蔽子类
def bad_except_order():
    try:
        data = {"a": 1}
        value = data["missing"]
    except Exception:
        print("Exception 先匹配")             # 总是输出这一行
    except KeyError:
        print("KeyError（永远不会执行）")      # 死代码！

bad_except_order()   # 输出：Exception 先匹配

# 正确的：子类 Exception 不冲突，但 Exception 能匹配所有异常
def good_except_order():
    try:
        data = {"a": 1}
        value = data["missing"]
    except KeyError:
        print("KeyError 优先匹配")
    except Exception:
        print("Exception 兜底")

good_except_order()  # 输出：KeyError 优先匹配（如果抛出 KeyError）
```

运行结果说明：第一个例子里 `except Exception` 在前，`except KeyError` 在后——`KeyError` 是 `Exception` 的子类，永远被 `Exception` 分支截获。Python 解释器通常不会给出警告，这是一个难以排查的静默 bug。

### 2.6 未捕获到的异常向上传播

当 `try` 块抛出的异常不在任何 `except` 分支的匹配范围内时，异常会**穿透当前的 `try-except` 结构，向外层传播**。这个行为与没有 `try` 时一样——异常沿调用栈向上寻找匹配的 `except`，如果直到顶层都没找到，Python 解释器会终止程序并打印回溯信息。

**向上传播的规则**：

1. 异常在当前 `try` 的所有 `except` 分支中检查。
2. 如果所有分支都不匹配，异常跳出当前 `try`。
3. 如果当前函数没有 `try-except` 包裹，异常传播到调用者。
4. 以此类推，直到被某个外层的 `except` 捕获，或到达程序顶层导致崩溃。

```python
def level3():
    """最内层函数，可能抛出未匹配的异常"""
    try:
        value = int("abc")   # ValueError
    except ZeroDivisionError:
        # ZeroDivisionError 不匹配 ValueError
        print("level3: 除零错误")
    except KeyError:
        # KeyError 也不匹配
        print("level3: 键错误")
    # ValueError 没有被任何分支匹配
    # 异常向上传播到 level2
    print("level3: 执行完毕（不会到达这里）")

def level2():
    """中间层函数，也不匹配 ValueError"""
    try:
        level3()
    except TypeError:
        # TypeError 不匹配 ValueError
        print("level2: 类型错误")
    # ValueError 继续向上传播到 level1
    print("level2: 执行完毕（不会到达这里）")

def level1():
    """最外层函数，捕获 ValueError"""
    try:
        level2()
    except ValueError as e:
        print(f"level1: 捕获到 ValueError: {e}")
    print("level1: 异常已处理，继续执行")

level1()
# 输出：
# level1: 捕获到 ValueError: invalid literal for int() with base 10: 'abc'
# level1: 异常已处理，继续执行
```

运行结果说明：`level3` 的 `ValueError` 未被任何分支匹配，传播到 `level2`；`level2` 的 `except TypeError` 也不匹配，继续传播到 `level1`；`level1` 的 `except ValueError` 最终捕获。异常在整个传播链上**只被捕获一次**，且捕获后**不会回溯到之前跳过的地方**执行——`level3` 和 `level2` 中 `try-except` 之后的代码不会执行。

```python
# 演示异常向上传播时的"连续跳过"现象
def intermediate_function():
    """中间函数，没有 try-except"""
    print("intermediate_function: 开始")
    raise ValueError("来自中间函数的错误")
    print("intermediate_function: 结束（不会执行）")

def caller_function():
    """调用者，捕获异常"""
    try:
        intermediate_function()
    except ValueError as e:
        print(f"caller_function: 捕获到异常: {e}")
    print("caller_function: 异常处理后继续")

caller_function()
# 输出：
# intermediate_function: 开始
# caller_function: 捕获到异常: 来自中间函数的错误
# caller_function: 异常处理后继续
```

运行结果说明：`intermediate_function` 没有 `try-except`，异常直接传播到 `caller_function`。`caller_function` 的 `except ValueError` 捕获后，执行 continue 代码。异常的传播路径是整个调用栈，Python 会在回溯信息中显示完整的调用链。

```python
# 异常向上传播时的回溯（traceback）信息
import traceback

def inner():
    raise RuntimeError("内部错误")

def middle():
    inner()

def outer():
    try:
        middle()
    except RuntimeError as e:
        print("捕获到异常，回溯信息：")
        traceback.print_exc()

outer()
# 输出会显示完整的调用栈：
# inner -> middle -> outer
# 这有助于定位异常的真实来源
```

运行结果说明：`traceback.print_exc()` 打印的异常回溯信息包含完整的调用栈——从异常抛出点（`inner`）到捕获点（`outer`）之间的所有函数调用。这使得异常传播是透明的：即使异常跨越多个函数，也能找到根因。

**未捕获异常在不同场景下的传播行为**：

| 场景 | 行为 | 示例 |
|------|------|------|
| 无外层 try | 程序终止，打印 traceback | 顶层代码未捕获的任何异常 |
| 外层有匹配 except | 外层捕获，继续执行 | 函数调用链上的异常传播 |
| 外层有不匹配 except | 继续向上传播 | 外层只捕获 TypeError，内层抛 ValueError |
| finally 块中再次抛异常 | 传播新异常，覆盖原异常 | finally 中的操作可能覆盖原始异常 |
| 生成器/协程中 | 传播到迭代器/事件循环 | 生成器中未捕获异常导致迭代终止 |

### 2.7 使用 `sys.exc_info()` 获取当前异常信息

`sys.exc_info()` 是 Python 的标准库函数，返回当前线程正在处理的异常信息。它返回一个三元组 `(type, value, traceback)`，分别对应异常类型、异常实例、回溯对象。在 `except` 块中调用时，它返回当前捕获的异常信息；在 `except` 块之外调用，返回 `(None, None, None)`。

**适用场景**：

- 不确定 `except` 子句中会把异常绑定到哪个名字（`as e`）时，可以从 `sys.exc_info()` 获取。
- 需要在 `except` 块中同时访问异常类型、异常值和回溯信息。
- 在某些动态回调或自定义异常处理框架中，异常可能不是通过标准的 `except ... as e` 获取的。
- 保存异常信息用于后续异步日志记录。

```python
import sys
import traceback

def handle_error_with_exc_info():
    """使用 sys.exc_info() 获取异常信息"""
    try:
        1 / 0
    except ZeroDivisionError:
        # 使用 sys.exc_info() 获取信息
        exc_type, exc_value, exc_tb = sys.exc_info()
        print(f"异常类型：{exc_type.__name__}")
        print(f"异常值：{exc_value}")
        print(f"回溯对象类型：{type(exc_tb).__name__}")   # traceback 模块的回溯对象
        print(f"异常文件名：{exc_tb.tb_frame.f_code.co_filename}")
        print(f"异常行号：{exc_tb.tb_lineno}")
        # 清理：避免引用循环（Python 3.4+ 中会隐式做，但显式更安全）
        del exc_tb

handle_error_with_exc_info()
# 输出：
# 异常类型：ZeroDivisionError
# 异常值：division by zero
# 回溯对象类型：traceback
# 异常文件名：<当前文件路径>
# 异常行号：<当前行数>
```

运行结果说明：`sys.exc_info()` 在三元组中返回异常的类型、实例和回溯对象。回溯对象是一个 `traceback` 对象，可以访问 `tb_frame`（栈帧）、`tb_lineno`（行号）等属性。注意，回溯对象会形成引用循环（异常 -> 栈帧 -> traceback -> 异常），需要在不再需要时显式清除（`del exc_tb`），Python 3.4+ 的垃圾回收器可以处理，但作为最佳实践仍推荐清除。

```python
# sys.exc_info() 在 except 块之外返回 (None, None, None)
def check_exc_info_outside():
    exc_info = sys.exc_info()
    print(f"exc_info 外部：{exc_info}")   # (None, None, None)
    
    try:
        raise ValueError("测试")
    except ValueError:
        exc_type, exc_value, exc_tb = sys.exc_info()
        print(f"exc_info 内部：{exc_type.__name__}: {exc_value}")
        # 在 except 块内，sys.exc_info() 有值
        del exc_tb  # 清理

check_exc_info_outside()
```

```python
# 使用 sys.exc_info() 实现通用异常日志记录
import sys
import logging

logging.basicConfig(level=logging.ERROR, format="%(asctime)s %(levelname)s: %(message)s")

def log_exception():
    """在 except 块中自动记录异常信息"""
    exc_type, exc_value, exc_tb = sys.exc_info()
    # exc_tb 在 except 块外可能为 None
    if exc_type is not None:
        # 从回溯中提取帧信息
        tb_list = traceback.extract_tb(exc_tb)
        if tb_list:
            last_frame = tb_list[-1]
            logging.error(
                f"{exc_type.__name__}: {exc_value} "
                f"(at {last_frame.filename}:{last_frame.lineno})"
            )
        del exc_tb  # 清理

def compute_with_logging(a, b):
    """计算并记录异常"""
    try:
        return a / b
    except ZeroDivisionError:
        log_exception()
        return None
    except TypeError:
        log_exception()
        return None

print(compute_with_logging(10, 0))       # 会记录 ERROR 日志
print(compute_with_logging("abc", 2))    # 会记录 ERROR 日志
```

运行结果说明：`sys.exc_info()` 配合日志模块实现了通用的异常日志记录函数。在 `except` 块中调用，可以获取异常的类型、值和回溯信息，而不需要在每个 `except` 子句中单独写日志代码——这在高层次异常处理框架中很有用。

**`sys.exc_info()` 的注意事项**：

```python
# 1. 在 except 块结束后，sys.exc_info() 会被重置
def after_except():
    try:
        raise ValueError("测试")
    except ValueError:
        pass  # 在这里可以访问
    # 在 except 块之后，sys.exc_info() 已重置
    print(sys.exc_info())   # (None, None, None)

after_except()

# 2. 在嵌套 except 中，内层 except 会覆盖外层的 exc_info
def nested_exc_info():
    try:
        try:
            raise ValueError("内层错误")
        except ValueError:
            print("内层 exc_info:", sys.exc_info()[1])  # 内层异常
            raise RuntimeError("外层错误")
    except RuntimeError:
        print("外层 exc_info:", sys.exc_info()[1])      # 外层异常

nested_exc_info()

# 3. 保存 exc_info 供 except 块外使用
def save_exc_info():
    saved_info = None
    try:
        1 / 0
    except ZeroDivisionError:
        saved_info = sys.exc_info()   # 保存元组供后面使用
    # 在 except 块外读取保存的 info
    if saved_info:
        print(f"保存的异常：{saved_info[0].__name__}: {saved_info[1]}")

save_exc_info()
```

运行结果说明：`sys.exc_info()` 的状态是与当前异常处理上下文绑定的——`except` 块结束后重置、内层 `except` 会覆盖外层。如果需要在 `except` 块之后继续使用异常信息，需要显式保存。

### 2.8 Python 3.11+ 的 `except*` 与 `ExceptionGroup`

从 Python 3.11 开始，Python 引入了 **`ExceptionGroup`** 和 **`except*`**，用于处理"一组同时发生的异常"的场景。这与传统的 `try-except` 捕获"第一个匹配的异常"不同——`except*` 可以同时匹配 `ExceptionGroup` 中的多个异常，并根据类型分组处理。

**为什么需要 `ExceptionGroup`？**

传统 `try-except` 每次只处理**一个**异常（第一个匹配的）。但在以下几种场景中，可能同时发生多个异常：

- **`asyncio.gather(return_exceptions=True)`**：多个协程并行执行，每个都可能抛异常。
- **`ExceptionGroup` 嵌套**：一个复杂操作的多个子步骤各自失败。
- **`TaskGroup`** 中的多个任务同时失败。

`ExceptionGroup` 包装了一组异常的集合，`except*` 可以从这个集合中提取出与指定类型匹配的异常并处理，剩余不匹配的异常继续留在新的 `ExceptionGroup` 中。

```python
# 基本用法：ExceptionGroup 和 except*
def basic_exception_group():
    """基本的 ExceptionGroup 示例"""
    # 创建一个 ExceptionGroup，包含多个不同类型的异常
    errors = ExceptionGroup(
        "多个错误",          # 分组描述信息
        [
            ValueError("无效的值"),
            TypeError("无效的类型"),
            ValueError("另一个无效值"),
        ]
    )
    
    try:
        raise errors
    except* ValueError as e:
        # except* 使用通配符 *，表示"匹配 ExceptionGroup 中所有 ValueError 子异常"
        print(f"处理 ValueError 组：")
        for exc in e.exceptions:
            print(f"  - {exc}")
    except* TypeError as e:
        print(f"处理 TypeError 组：")
        for exc in e.exceptions:
            print(f"  - {exc}")

basic_exception_group()
# 输出：
# 处理 ValueError 组：
#   - 无效的值
#   - 另一个无效值
# 处理 TypeError 组：
#   - 无效的类型
```

运行结果说明：`ExceptionGroup` 包含了三个异常。`except* ValueError` 匹配并处理了其中两个 `ValueError`，`except* TypeError` 匹配了剩下的 `TypeError`。每个 `except*` 分支只处理与指定类型匹配的那些异常，不匹配的保留在组中。

**`ExceptionGroup` 匹配规则**：

1. `except*` 只能用在 `try-except*` 结构中（`try` + 一个或多个 `except*`）。
2. `except*` 匹配的是 `ExceptionGroup` 中的**子异常**，而非组本身。
3. `except*` 处理后，匹配的异常从组中被移除，不匹配的异常包装成新的 `ExceptionGroup` 继续匹配或传播。
4. 如果 `except*` 处理了组中所有异常，try 块正常完成。
5. 如果 `except*` 处理后还有剩余异常，它们会被包装成新的 `ExceptionGroup` 继续向上传播。

```python
# except* 的分支顺序与传播
def except_star_propagation():
    """except* 的分支顺序和未匹配异常的传播"""
    errors = ExceptionGroup(
        "接口错误",
        [
            ConnectionError("连接超时"),
            ValueError("数据格式错误"),
            TimeoutError("读取超时"),
        ]
    )
    
    try:
        raise errors
    except* (ConnectionError, TimeoutError) as e:
        # 元组形式在 except* 中也支持
        print(f"处理网络错误组（共 {len(e.exceptions)} 个）：")
        for exc in e.exceptions:
            print(f"  - {type(exc).__name__}: {exc}")
    except* ValueError as e:
        # 处理剩余的 ValueError
        print(f"处理数据错误组：{e.exceptions[0]}")
    # 所有异常都被处理了，整个 try-except* 正常完成

except_star_propagation()
# 输出：
# 处理网络错误组（共 2 个）：
#   - ConnectionError: 连接超时
#   - TimeoutError: 读取超时
# 处理数据错误组：数据格式错误
```

```python
# 未匹配的 ExceptionGroup 继续传播
def unhandled_exceptions():
    """except* 未匹配的异常继续向上传播"""
    try:
        try:
            raise ExceptionGroup("内部错误", [
                ValueError("错误1"),
                TypeError("错误2"),
                ValueError("错误3"),
            ])
        except* ValueError as e:
            print(f"处理了 {len(e.exceptions)} 个 ValueError")
            # TypeError 未被处理，继续传播
    except TypeError as e:
        # 注意：这里用传统的 except，不是 except*
        # TypeError 被包装成新的 ExceptionGroup 传播上来
        print(f"外部捕获：{type(e).__name__}: {e}")
        # 实际输出会发现是一个 ExceptionGroup 包含 TypeError

unhandled_exceptions()
```

运行结果说明：内层 `except* ValueError` 处理了两个 `ValueError`，但 `TypeError` 未被匹配。这剩余的 `TypeError` 被包装成新的 `ExceptionGroup`（包含单个 `TypeError`）传播到外层。外层用传统 `except TypeError` 无法直接捕获它——因为它是包裹在 `ExceptionGroup` 中的。需要在外层再用 `except*` 或在 `except ExceptionGroup` 中处理。

```python
# except* 不能与常规 except 混用在同一个 try 块中
def mixed_except_error():
    """except* 和 except 不能混用"""
    try:
        pass
    # 以下会导致语法错误：
    # except ValueError:
    #     pass
    # except* TypeError:
    #     pass
    # SyntaxError: cannot have both except and except* in the same try
    except (ValueError, TypeError):
        # 只能用其中一种
        pass

# 正确做法：分开处理
def proper_separation():
    """分别用不同的 try 处理普通异常和异常组"""
    # 普通异常用 except
    try:
        1 / 0
    except ZeroDivisionError as e:
        print(f"普通 except 捕获：{e}")
    
    # 异常组用 except*
    try:
        raise ExceptionGroup("组", [ValueError("v1"), TypeError("t1")])
    except* ValueError as ve:
        for exc in ve.exceptions:
            print(f"except* 处理 ValueError：{exc}")
    except* TypeError as te:
        for exc in te.exceptions:
            print(f"except* 处理 TypeError：{exc}")

proper_separation()
```

运行结果说明：`except` 和 `except*` 不能出现在同一个 `try` 块中——它们有不同的匹配机制。需要分开写在不同 `try` 块中。

**`ExceptionGroup` 的实际应用场景**：

```python
import asyncio
import time

# asyncio.TaskGroup 中的多异常处理（Python 3.11+）
async def task_with_error(name, should_fail=False):
    """模拟异步任务"""
    await asyncio.sleep(0.1)
    if should_fail:
        if name == "task1":
            raise ValueError(f"{name} 失败")
        else:
            raise RuntimeError(f"{name} 失败")
    return f"{name} 成功"

async def run_tasks():
    """运行多个并发任务，收集所有异常"""
    tasks = [
        task_with_error("task1", should_fail=True),
        task_with_error("task2", should_fail=True),
        task_with_error("task3", should_fail=False),
    ]
    
    try:
        # asyncio.gather 的 return_exceptions=True 模式
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 检查是否有异常
        exceptions = [r for r in results if isinstance(r, Exception)]
        if exceptions:
            print(f"共 {len(exceptions)} 个任务失败：")
            for exc in exceptions:
                print(f"  - {type(exc).__name__}: {exc}")
            # 可以收集所有异常并用 ExceptionGroup 抛出
            raise ExceptionGroup("并发任务异常", exceptions)
        print("全部成功")
    except* ValueError as ve:
        print(f"处理 ValueError 组（{len(ve.exceptions)} 个）")
    except* RuntimeError as re:
        print(f"处理 RuntimeError 组（{len(re.exceptions)} 个）")

# 运行
# asyncio.run(run_tasks())
# 输出：
# 共 2 个任务失败：
#   - ValueError: task1 失败
#   - RuntimeError: task2 失败
# 处理 ValueError 组（1 个）
# 处理 RuntimeError 组（1 个）
```

**`ExceptionGroup` 与 `except*` 的总结对照表**：

| 特性 | 传统 `except` | `except*` |
|------|---------------|-----------|
| 匹配对象 | 单个异常实例 | `ExceptionGroup` 中符合条件的子异常 |
| 匹配数量 | 最多一个分支执行 | 多个分支可分别匹配不同子异常 |
| 剩余异常 | 匹配后异常已处理，不再传播 | 不匹配的子异常保留在组中继续传播 |
| 与 ExceptionGroup | 不能直接处理 ExceptionGroup 内部 | 专门为 ExceptionGroup 设计 |
| 混合使用 | 不能与 except* 同 try | 不能与 except 同 try |
| 引入版本 | 始终存在 | Python 3.11+ |

### 2.9 多重 `except` vs 多个 `try-except` 的取舍

在实际编码中，经常面临一个选择：**是把多个可能抛异常的步骤放在同一个 `try` 块中（多个 `except` 分支），还是各自包一层 `try-except`（多个 `try` 块）？**

两种方式各有适用场景，没有绝对的好坏。核心取舍点在于：**异常处理的粒度**——你是否需要区分"哪个步骤"出了错。

```python
# 一个 try + 多个 except：多个步骤共享一个 try 块
def process_file_one_try(file_path):
    """一个 try 块包含所有步骤，多个 except 分支"""
    try:
        # 步骤 1：打开文件
        f = open(file_path, 'r', encoding='utf-8')
        # 步骤 2：读取内容
        content = f.read()
        # 步骤 3：解析内容
        config = eval(content)
        # 步骤 4：关闭文件
        f.close()
        return config
    except FileNotFoundError:
        print("文件不存在")
        return {}
    except PermissionError:
        print("无权限")
        return {}
    except SyntaxError:
        print("配置语法错误")
        return {}
    except Exception as e:
        print(f"未知错误：{e}")
        return {}

# 多个 try-except：每个步骤独立包裹
def process_file_multi_try(file_path):
    """每个步骤各自有独立的 try-except"""
    try:
        f = open(file_path, 'r', encoding='utf-8')
    except FileNotFoundError:
        print("文件不存在")
        return {}
    except PermissionError:
        print("无权限")
        return {}
    
    try:
        content = f.read()
    except UnicodeDecodeError:
        print("编码错误")
        f.close()
        return {}
    
    try:
        config = eval(content)
    except SyntaxError:
        print("配置语法错误")
        f.close()
        return {}
    except Exception as e:
        print(f"解析未知错误：{e}")
        f.close()
        return {}
    
    f.close()
    return config
```

运行结果说明：一个 `try` 块的写法更简洁，但多个 `try-except` 的写法提供了更细的粒度——它可以精确处理"某个特定步骤"的异常（比如 `UnicodeDecodeError` 只可能发生在 `f.read()` 步骤）。在资源清理（如 `f.close()`）方面，多个 `try-except` 需要更小心地管理资源（两个方法都没有用 `with` 或 `finally`，只是演示），这也是为什么推荐 `with` 语句。

**选择决策框架**：

```python
# 场景 1：不同步骤的同类异常需要不同处理 -> 多个 try-except
def multi_try_scenario():
    """多个步骤的同类异常需要不同处理策略"""
    # 步骤 1：从数据库读取用户信息
    try:
        user = database_read_user(user_id)
    except ConnectionError:
        # 数据库连接失败 -> 重试
        print("数据库连接失败，重试...")
        user = None
    except NotFoundError:
        # 用户不存在 -> 走新建流程
        print("用户不存在，初始化新用户")
        user = {"id": user_id, "points": 0}
    
    if user is None:
        return None
    
    # 步骤 2：更新用户积分
    try:
        user["points"] += earned_points
        database_update_user(user)
    except ConnectionError:
        # 同样的 ConnectionError，但这里策略不同 -> 记录日志，不中断
        print("更新失败，积分变化已丢失")
        log_error("update_failed", user_id, earned_points)
    
    return user

# 场景 2：不同步骤的异常处理逻辑相同 -> 一个 try + 多个 except
def single_try_scenario():
    """多个步骤的异常处理逻辑相同——合并到一个 try 块"""
    try:
        data = read_input()
        processed = transform(data)
        result = validate(processed)
    except ValueError:
        # 无论哪个步骤抛 ValueError，处理策略相同
        print("数据格式错误")
        return None
    except TypeError:
        # 同理
        print("类型错误")
        return None
    except Exception as e:
        print(f"处理失败：{e}")
        return None
    return result

# 为了演示，定义这些虚拟函数
def read_input():       return {"value": 42}
def transform(d):       return d["value"]
def validate(v):        return v if v > 0 else ValueError()
```

**决策矩阵**：

| 场景 | 推荐方式 | 原因 |
|------|----------|------|
| 多个步骤抛同类异常，处理策略相同 | 一个 try + 多个 except | 代码简洁，异常类型决定处理 |
| 不同步骤的同类异常需不同处理 | 多个 try-except | 需要按"哪个步骤失败"来区分 |
| 步骤之间存在依赖关系 | 一个 try + 多个 except | 一步失败后续无法继续，统一退出 |
| 每个步骤独立，可各自恢复 | 多个 try-except | 部分失败不影响其他步骤 |
| 简单脚本，不需要细粒度处理 | 一个 try + 多个 except | 简洁优先 |
| 生产级健壮代码 | 多个 try-except | 更可控，更易调试 |

```python
# 混合策略：结合多个 try 和多个 except
def hybrid_strategy(files):
    """混合使用多个 try 块和多个 except 分支"""
    results = []
    for file_path in files:
        # 每个文件独立处理（多个 try-except 的 "外部循环" 模式）
        try:
            # 读取文件可能抛出的异常
            with open(file_path, 'r') as f:
                content = f.read()
        except FileNotFoundError:
            print(f"文件 {file_path} 不存在，跳过")
            continue
        except PermissionError:
            print(f"文件 {file_path} 无权限，跳过")
            continue
        
        # 处理步骤使用一个 try 块（多个 except 分支）
        try:
            lines = content.strip().split('\n')
            numbers = [int(line.strip()) for line in lines if line.strip()]
            processed = [n * 2 for n in numbers]
            results.append(processed)
        except ValueError as e:
            print(f"文件 {file_path} 包含非数字行: {e}")
        except MemoryError:
            print(f"文件 {file_path} 过大，无法处理")
        except Exception as e:
            print(f"处理文件 {file_path} 时未知错误: {type(e).__name__}: {e}")
    
    return results

# 测试
test_files = ["valid.txt", "missing.txt", "invalid.txt"]
# 准备测试文件
with open("/tmp/valid.txt", "w") as f: f.write("1\n2\n3\n")
with open("/tmp/invalid.txt", "w") as f: f.write("a\nb\nc\n")  # 非数字内容
results = hybrid_strategy(test_files)
print(f"结果：{results}")   # [[2, 4, 6]]
```

运行结果说明：`hybrid_strategy` 采用了混合策略——外层按"每个文件"循环，每个文件的操作被一个 `try-except` 包裹（防止一个文件的错误影响全局）；内层处理步骤使用一个 `try` 块配合多个 `except` 分支（按异常类型区分处理）。这种"外层按粒度独立、内层按类型区分"的混合策略是最灵活、最健壮的。

### 2.10 不同类型异常的不同处理策略

捕获多个异常的核心在于：**不同的异常类型应该有不同的处理策略**。不是所有异常都需要`raise`重新抛出，也不是所有异常都应该默默吞掉。合理的异常处理应该根据异常的"严重程度"和"可恢复性"选择不同策略。

**异常处理的五种常见策略**：

| 策略 | 含义 | 适用场景 | 示例代码 |
|------|------|----------|----------|
| 记录日志+继续 | 记录错误信息，不影响后续执行 | 非关键路径的异常 | `logging.error(...)` |
| 返回默认值 | 用安全的默认值替代 | 配置读取、可选操作失败 | `return None / {} / 0` |
| 重试 | 等一会儿再试 | 网络请求、临时资源不可用 | `for _ in range(3):` |
| 重新抛出 | 保留异常继续传播 | 本层无法处理、严重的错误 | `raise` |
| 转换异常 | 将底层异常转为上层异常 | 封装库 API、用户友好错误 | `raise UserVisibleError(...) from e` |

```python
import logging
import time
import random

logging.basicConfig(level=logging.WARNING, format="%(levelname)s: %(message)s")

class APIError(Exception):
    """自定义 API 错误"""
    pass

def call_external_api(url, retries=3):
    """调用外部 API，根据异常类型采用不同策略"""
    for attempt in range(retries):
        try:
            # 模拟 API 调用，不同场景抛不同异常
            scenario = random.choices(
                ["success", "timeout", "connection", "bad_data", "auth"],
                weights=[50, 20, 10, 15, 5],
                k=1
            )[0]
            
            if scenario == "success":
                return {"status": "ok", "data": [1, 2, 3]}
            elif scenario == "timeout":
                raise TimeoutError("请求超时")
            elif scenario == "connection":
                raise ConnectionError("连接被重置")
            elif scenario == "bad_data":
                raise ValueError("无效的 JSON 响应")
            elif scenario == "auth":
                raise PermissionError("认证失败")
        
        except (TimeoutError, ConnectionError) as e:
            # 策略 1：重试——网络问题可恢复
            if attempt < retries - 1:
                wait = 2 ** attempt  # 指数退避：1s, 2s, 4s
                logging.warning(
                    f"网络错误（{type(e).__name__}），第 {attempt+1}/{retries} 次重试，等待 {wait} 秒..."
                )
                time.sleep(wait)
            else:
                logging.error(f"重试耗尽，放弃请求: {e}")
                raise APIError(f"外部 API 不可用: {e}") from e
        
        except ValueError as e:
            # 策略 2：数据格式错误，不可重试，记录日志并返回 None
            logging.error(f"数据格式错误: {e}")
            return None
        
        except PermissionError as e:
            # 策略 3：认证失败，不可重试，立刻报错
            logging.error(f"认证失败: {e}")
            raise APIError("API 认证失败，请检查配置") from e
        
        except Exception as e:
            # 策略 4：未知异常，记录日志并重新抛出
            logging.critical(f"未预料的错误: {type(e).__name__}: {e}")
            raise  # 保持原始异常传播
    
    return None  # 重试耗尽

# 调用测试（多次运行观察不同路径）
for i in range(10):
    try:
        print(f"\n--- 第 {i+1} 次调用 ---")
        result = call_external_api("https://api.example.com/data")
        if result is not None:
            print(f"成功: {result}")
    except APIError as e:
        print(f"API 错误: {e}")
    except Exception as e:
        print(f"未预料的错误: {type(e).__name__}: {e}")
    time.sleep(0.1)  # 避免连续执行完全随机导致的可读性问题
```

运行结果说明：`call_external_api` 对不同异常采用了四种不同策略——网络错误重试（指数退避等待）、数据错误直接返回（重试无效）、认证错误立刻报错并转换为自定义异常）、未知异常记录日志后保持原样传播。这种"**按异常类型选择策略**"的方式是生产级代码的标准做法。

```python
# 不同策略的代码组织模式
def process_data_with_strategies(data):
    """为不同类型的异常定义不同处理策略"""
    try:
        # 1. 验证数据
        validate_input(data)
        # 2. 执行业务逻辑
        result = business_logic(data)
        # 3. 持久化结果
        save_result(result)
        return "成功"
    except InputValidationError as e:
        # 策略：提示前端，不记录错误日志（输入错误不是程序 bug）
        print(f"输入校验失败: {e}")
        return f"无效输入: {e}"
    except BusinessLogicError as e:
        # 策略：记录业务日志，便于排查
        logging.warning(f"业务逻辑异常: {e}")
        return f"处理失败: {e}"
    except PersistenceError as e:
        # 策略：记录错误日志，可能需要告警
        logging.error(f"持久化失败: {e}")
        return "系统错误，请稍后重试"
    except Exception as e:
        # 策略：记录完整错误信息（含 traceback）
        logging.exception(f"未预料的系统错误")
        return "系统内部错误"
```

**处理策略对比表**：

```python
# 伪代码展示不同策略的典型实现模式
"""
# 1. 记录日志 + 继续（不中断主流程）
try:
    send_analytics_event(event)
except Exception:
    logging.warning("发送分析事件失败", exc_info=True)
# 程序继续执行，不影响用户体验

# 2. 返回默认值（让调用者能安全使用结果）
try:
    config = parse_config_file(path)
except (FileNotFoundError, ParseError):
    config = DEFAULT_CONFIG  # 安全默认值
return process_with_config(config)

# 3. 转换异常（将底层异常封装为上层可理解的类型）
try:
    user = db.query_user(user_id)
except DatabaseError as e:
    raise UserServiceError(f"获取用户失败: {e}") from e

# 4. 重新抛出（本层无法处理）
try:
    result = dangerous_operation()
except NetworkError:
    raise  # 保持原样传播，触发上层重试机制
    
# 5. 重试（临时错误的自动恢复机制）
for attempt in range(MAX_RETRIES):
    try:
        return fetch_data()
    except TemporaryError:
        if attempt == MAX_RETRIES - 1:
            raise  # 重试耗尽，传播异常
        time.sleep(WAIT * (attempt + 1))  # 递增等待
"""
```

运行结果说明：五种处理策略覆盖了从"恢复"到"保底"的不同梯度。生产代码中，选择哪种策略取决于**异常的语义**和**业务的可恢复性**：

- 可恢复的临时错误 -> 重试
- 不可恢复的输入错误 -> 返回默认值或提示用户
- 严重的系统错误 -> 重新抛出或转换为自定义异常
- 非关键路径错误 -> 记录日志即可

---

## 3. 最佳实践

### 3.1 始终从具体到通用排列 except 分支

```python
# 推荐：具体在前，通用在后
try:
    result = divisible_by_zero()
except ZeroDivisionError:
    print("除零错误")
except ArithmeticError:
    print("其他算术错误")
except Exception:
    print("其他错误")

# 不推荐：通用在前屏蔽具体
# try:
#     result = divisible_by_zero()
# except Exception:            # 通用在前，会捕获一切
#     print("错误")
# except ZeroDivisionError:    # 永远无法匹配，死代码
#     print("除零错误")
```

子类在前、父类在第、`Exception` 兜底在最后。这个顺序确保最精确的分支优先处理。

### 3.2 处理逻辑相同的异常用元组合并

```python
# 推荐：合并处理逻辑相同的异常
def safe_convert(value, default=0):
    try:
        return int(value)
    except (ValueError, TypeError) as e:
        # 两种异常都是"输入格式不合法"，合并处理
        print(f"转换失败（{type(e).__name__}），使用默认值 {default}")
        return default

# 不推荐：重复代码
# def safe_convert(value, default=0):
#     try:
#         return int(value)
#     except ValueError:
#         print(f"值错误，使用默认值 {default}")
#         return default
#     except TypeError:
#         print(f"类型错误，使用默认值 {default}")
#         return default
```

元组形式减少了重复的 `except` 块和重复的处理代码，更清晰地表达了"这些异常是同一类错误"。

### 3.3 不要用裸 `except:` 捕获所有异常

```python
# 不推荐：裸 except 会捕获 SystemExit 和 KeyboardInterrupt
try:
    result = dangerous_operation()
except:                     # 等价 except BaseException:
    print("出错啦")         # 用户按 Ctrl+C 也无法退出！

# 推荐：至少用 except Exception
try:
    result = dangerous_operation()
except Exception:
    print("出错啦")         # 允许 Ctrl+C 正常退出程序

# 更推荐：明确列出预期异常
try:
    result = dangerous_operation()
except (ValueError, TypeError, RuntimeError) as e:
    print(f"预期错误: {e}")
except Exception as e:
    print(f"未预料的错误: {e}")
```

裸 `except:` 等价 `except BaseException:`，它会捕获包括 `SystemExit`、`KeyboardInterrupt`、`GeneratorExit` 在内的所有异常。一个好的异常处理框架应该让系统级异常不受干扰地传播。

### 3.4 只在真正能处理异常的地方捕获

```python
# 不推荐：捕获了却不做处理（"沉默吞掉"反模式）
try:
    result = fetch_data()
except Exception:
    pass  # 什么也不做？调用者得不到任何反馈

# 推荐：要么真正处理，要么让异常传播
try:
    result = fetch_data()
except (TimeoutError, ConnectionError) as e:
    # 确实能处理：记录日志，返回重试建议
    logging.warning(f"网络异常: {e}")
    return RETRY_LATER
```

捕获多个异常不等于要捕获所有异常。在函数中，只捕获你能"真正处理"的异常——能被恢复的、能提供替代方案的、能给出合理反馈的。其他异常留给上层处理。

### 3.5 使用 `as e` 获取异常对象进行精细化处理

```python
# 推荐：通过异常对象获取额外信息
def connect_to_database(config):
    try:
        return create_connection(config)
    except (ConnectionError, TimeoutError) as e:
        # 从异常对象获取详细信息
        print(f"连接失败: type={type(e).__name__}, args={e.args}")
        # 有些异常还携带更多属性
        if hasattr(e, 'errno'):
            print(f"错误码: {e.errno}")
        return None
    except AuthenticationError as e:
        # 自定义异常可携带字段
        print(f"认证失败: user={e.username}")
        return None

# 异常对象绑定的变量 `e` 仅在 except 块内可见
# 在 except 块外访问它会导致 UnboundLocalError（Python 3.12+ 行为变化）
```

通过 `as e` 绑定异常实例，可以访问异常的详细属性（如 `args`、`errno`、自定义字段等）。这在调试和日志记录中极其有用。

### 3.6 `ExceptionGroup` 与 `except*` 只在需要时使用

```python
# 推荐：只在处理并发/多异常场景时使用 ExceptionGroup
try:
    async with asyncio.TaskGroup() as tg:
        tg.create_task(task1())
        tg.create_task(task2())
except* ValueError as ve:
    handle_value_errors(ve.exceptions)
except* RuntimeError as re:
    handle_runtime_errors(re.exceptions)

# 不推荐：把 ExceptionGroup 当作异常处理的通用模式
# try:
#     process_single_task()
# except* ValueError:     # 不需要！单个异常用传统 except 即可
#     pass
```

`ExceptionGroup` 是为多异常并发场景设计的，在传统单异常场景中使用它只会增加复杂度。Python 3.11+ 项目中，只有当确定需要处理"多个同时发生的异常"时才使用 `except*`。

### 3.7 在 `except` 中谨慎使用 `raise` 和 `return`

```python
# 在 except 块中混合 raise 和 return 时要清晰
def process_robustly(data):
    try:
        validate(data)
    except ValueError:
        # 返回默认值——异常被认为是"可以容忍的"
        return DEFAULT_VALUE
    except RuntimeError:
        # raise 重新抛出——异常被认为是"严重的"
        raise
    # 没有 except Exception 兜底——其他异常会自然传播
    return do_work(data)
```

`except` 块中的 `raise` 和 `return` 表达了不同的意图——`return` 意味着"异常已处理，可以恢复"，`raise` 意味着"异常严重，需要上层处理"。两者不应在同一个 `except` 块中混用（否则读者无法确定预期行为）。

### 3.8 元组中的异常类型不应有继承关系

```python
# 不推荐：元组中包含有继承关系的异常
try:
    result = 10 / 0
except (ArithmeticError, ZeroDivisionError) as e:
    # ZeroDivisionError 是 ArithmeticError 的子类
    # 元组去重后实际只保留了 ArithmeticError
    print("算术错误")
# 这种写法虽然不会报错，但没有信息增益，容易误导读者

# 推荐：只需保留父类型
try:
    result = 10 / 0
except ArithmeticError:
    print("算术错误")

# 只有在不同继承线的异常才适合放元组
try:
    read_file()
except (FileNotFoundError, PermissionError) as e:
    # FileNotFoundError 和 PermissionError 都是 OSError 的子类
    # 但它们代表不同类型的失败，放在元组中表示"文件操作失败"
    print(f"文件操作失败: {type(e).__name__}")
```

元组合并同一继承线上的异常没有意义——父类分支已经能捕获所有子类分支。合并的恰当场景是**不同继承线的异常**在处理逻辑上相同。

### 3.9 在 except 块间共享代码用辅助函数而非继承

```python
# 推荐：用辅助函数共享异常处理逻辑
def log_exception(e):
    """通用的异常日志记录"""
    logging.error(f"{type(e).__name__}: {e}", exc_info=True)

def process_data(data):
    try:
        safe_divide(data, 0)
    except ZeroDivisionError as e:
        log_exception(e)
        return -1
    except ValueError as e:
        log_exception(e)
        return -2
    return 0

# 不推荐：在 except 块中重复日志代码
# def process_data(data):
#     try:
#         safe_divide(data, 0)
#     except ZeroDivisionError as e:
#         logging.error(f"ZeroDivisionError: {e}", exc_info=True)
#         return -1
#     except ValueError as e:
#         logging.error(f"ValueError: {e}", exc_info=True)
#         return -2
#     return 0
```

当多个 `except` 分支有相同的代码片段（如统一记录日志）时，把这段代码抽取为辅助函数而非在每个分支重复。这不仅减少了代码量，也便于统一修改异常处理行为。

### 3.10 善用 `logging.exception()` 自动记录异常信息

```python
import logging
logging.basicConfig(level=logging.ERROR)

def process_with_logging():
    try:
        1 / 0
    except ZeroDivisionError:
        # logging.exception() 会自动记录当前异常的 traceback
        logging.exception("除零错误")
    except ValueError:
        logging.exception("值错误")
    # 输出会包含完整的 traceback 信息
    # ERROR:root:除零错误
    # Traceback (most recent call last):
    #   ...
```

`logging.exception()` 是 Python 日志模块专为异常处理设计的便捷方法——它会自动记录当前异常的 traceback。在 `except` 块中使用它比手动 `format_exc()` 更简洁。

### 3.11 正确处理 `finally` 中的异常传播

```python
# 注意：finally 块中如果抛异常，会覆盖原始的异常
def finally_exception_order():
    try:
        try:
            raise ValueError("原始错误")
        finally:
            # finally 中抛异常会覆盖原始错误
            raise RuntimeError("finally 中的错误")
        # 外层捕获到的是 RuntimeError, ValueError 被覆盖
    except RuntimeError as e:
        print(f"捕获到: {e}")   # 原始 ValueError 丢失！

# 修正：检查是否需要保留原始上下文
def safe_finally():
    try:
        try:
            raise ValueError("原始错误")
        except ValueError:
            raise  # 在 except 中重新抛出，确保 finally 不覆盖
        finally:
            # finally 中避免抛出会屏蔽原异常的错误
            try:
                cleanup()
            except Exception:
                logging.warning("清理过程出错")
    except ValueError:
        print("依然捕获到原始错误")

def cleanup():
    """模拟可能导致错误的清理操作"""
    raise RuntimeError("清理失败")
```

`finally` 块中如果抛出异常，它会覆盖原始异常（如果原始异常正在传播）。这是一个必须注意的行为——在 `finally` 中执行清理操作时，要么用 `try-except` 包裹清理代码防止异常传播，要么使用 Python 3.11+ 的 `ExceptionGroup` 来同时保留原始异常和清理异常。

---

## 4. 原理

### 4.1 `try-except` 匹配机制的底层实现

Python 的异常匹配机制在 C 层面（CPython）通过栈帧中的异常处理表（`co_exceptiontable`）实现。当 `try` 块中抛出异常时，Python 解释器执行以下步骤：

1. **异常创建**：`raise` 语句生成一个异常实例，如果是隐式异常（如 `1/0`），Python 在检测到错误时自动创建对应的异常实例。
2. **栈帧回溯**：解释器在当前栈帧中查找最近的活动 `try` 块。
3. **匹配检查**：对该 `try` 块的每个 `except` 子句，调用 `PyErr_GivenExceptionMatches(raised_exc, except_type)` 函数进行匹配检查。这个函数的核心逻辑等价 Python 中的 `isinstance(raised_exception, except_type)`。
4. **找到匹配**：如果找到匹配分支，解释器将异常实例绑定到 `as e` 指定的变量（如果有），执行 `except` 块中的代码。
5. **找不到匹配**：如果所有分支都不匹配，异常沿调用栈向上传播到外层 `try` 或全局异常处理。

```python
# isinstance 匹配的等价行为演示
def exception_matches(raised_exc, except_type):
    """模拟 Python 的异常匹配逻辑"""
    # except 分支匹配等价于 isinstance(raised_exc, except_type)
    return isinstance(raised_exc, except_type)

# 测试继承关系匹配
print(exception_matches(ZeroDivisionError(), ArithmeticError))   # True
print(exception_matches(ZeroDivisionError(), Exception))         # True
print(exception_matches(ZeroDivisionError(), ValueError))        # False
print(exception_matches(ZeroDivisionError(), BaseException))     # True

# except 分支的元组形式：遍历元组每个元素做 isinstance 检查
def exception_matches_tuple(raised_exc, except_types):
    """模拟 except (Type1, Type2) 的匹配逻辑"""
    return any(isinstance(raised_exc, et) for et in except_types)

print(exception_matches_tuple(ValueError(), (TypeError, ValueError)))   # True
print(exception_matches_tuple(ZeroDivisionError(), (TypeError, ValueError)))  # False
```

**`co_exceptiontable` 机制（Python 3.11+）**：

从 Python 3.11 开始，CPython 引入了**零成本异常处理**（zero-cost exception handling）。`try-except` 的元数据不再存储在运行时栈上，而是编译到字节码的 `co_exceptiontable` 中。在正常执行路径上（不抛异常时）完全不消耗性能，只有异常抛出时才查询该表格找到跳转目标。这意味着：

- `try` 块本身在正常路径上几乎无开销（对比 Python 3.10 及之前）。
- 异常抛出时的查找更高效（二分查找 vs 线性扫描）。

```python
# 查看字节码中的异常处理表信息（Python 3.11+）
import dis

def example_with_try():
    try:
        1 / 0
    except ZeroDivisionError:
        print("除零")
    except ValueError:
        print("值错误")

# dis.dis(example_with_try)
# 输出会显示异常处理表条目，显示 try 块范围和 except 跳转目标
```

### 4.2 `sys.exc_info()` 的三元组机制

`sys.exc_info()` 返回一个三元组 `(type, value, traceback)`，这三个元素分别对应：

1. **type**：当前异常的类对象（如 `<class 'ZeroDivisionError'>`）。
2. **value**：当前异常的实例（如 `ZeroDivisionError('division by zero')`）。
3. **traceback**：一个 `traceback` 对象，封装了异常抛出点的完整调用栈信息。

```python
import sys

def inspect_exc_info():
    """深入查看 exc_info 返回的对象结构"""
    try:
        1 / 0
    except ZeroDivisionError:
        exc_type, exc_value, exc_tb = sys.exc_info()
        
        # 1. type：异常类
        print(f"type 对象：{exc_type}")
        print(f"type 的 MRO：{exc_type.__mro__}")
        
        # 2. value：异常实例
        print(f"\nvalue 对象：{exc_value}")
        print(f"value.args：{exc_value.args}")
        print(f"str(value)：{str(exc_value)}")
        
        # 3. traceback：回溯对象
        print(f"\ntb 对象：{exc_tb}")      # <traceback object at 0x...>
        print(f"tb_frame：{exc_tb.tb_frame}")  # <frame at 0x..., line ...>
        print(f"tb_lineno：{exc_tb.tb_lineno}")  # 抛出异常的行号
        print(f"tb_next：{exc_tb.tb_next}")  # 外层调用栈的回溯（如果嵌套）
        
        # 遍历整个回溯链
        tb = exc_tb
        depth = 0
        while tb:
            print(f"  [{depth}] {tb.tb_frame.f_code.co_filename}:{tb.tb_lineno}")
            tb = tb.tb_next
            depth += 1
        
        del exc_tb  # 清理回溯引用

inspect_exc_info()
```

**`exc_info` 的线程安全与作用域**：

`sys.exc_info()` 返回的是**当前线程**的异常信息（CPython 使用线程局部存储存储）。这意味着在多线程程序中，每个线程独立维护自己的异常状态，`sys.exc_info()` 在线程间不会相互干扰。

```python
import sys
import threading

def thread_worker(name):
    """子线程查看自己的 exc_info"""
    try:
        raise RuntimeError(f"{name} 的错误")
    except RuntimeError:
        exc_type, exc_value, exc_tb = sys.exc_info()
        print(f"线程 {name}：{exc_type.__name__}: {exc_value}")
        del exc_tb

# 启动多个线程，每个独立处理自己的异常
threads = []
for i in range(3):
    t = threading.Thread(target=thread_worker, args=(f"thread-{i}",))
    threads.append(t)
    t.start()

for t in threads:
    t.join()
# 输出（顺序可能不同）：
# 线程 thread-0：RuntimeError: thread-0 的错误
# 线程 thread-1：RuntimeError: thread-1 的错误
# 线程 thread-2：RuntimeError: thread-2 的错误
```

### 4.3 `ExceptionGroup` 的内部结构

`ExceptionGroup` 是 Python 3.11 新增的异常类，继承自 `BaseException`。它的内部结构类似于一棵树——每个节点包含一个或多个子异常，子异常本身也可以是 `ExceptionGroup`（即嵌套分组）。

```python
def examine_exception_group():
    """分析 ExceptionGroup 的内部结构"""
    inner_group = ExceptionGroup("内部组", [
        ValueError("v1"),
        ValueError("v2"),
    ])
    
    outer_group = ExceptionGroup("外部组", [
        inner_group,
        TypeError("t1"),
        RuntimeError("r1"),
    ])
    
    print(f"外部组消息：{outer_group.message}")
    print(f"外部组异常数量：{len(outer_group.exceptions)}")
    print(f"外部组异常类型列表：{[type(e).__name__ for e in outer_group.exceptions]}")
    
    # 递归遍历
    def walk_group(eg, depth=0):
        indent = "  " * depth
        print(f"{indent}ExceptionGroup({eg.message!r})")
        for exc in eg.exceptions:
            if isinstance(exc, ExceptionGroup):
                walk_group(exc, depth + 1)
            else:
                print(f"{indent}  - {type(exc).__name__}: {exc}")
    
    walk_group(outer_group)
    # 输出：
    # ExceptionGroup('外部组')
    #   ExceptionGroup('内部组')
    #     - ValueError: v1
    #     - ValueError: v2
    #   - TypeError: t1
    #   - RuntimeError: r1

examine_exception_group()
```

**`except*` 的拆分逻辑**：

当 `try` 块抛出 `ExceptionGroup` 时，`except*` 使用以下算法拆分和匹配：

1. 遍历 `ExceptionGroup` 中的所有子异常。
2. 对每个子异常，检查它或其子树是否与 `except*` 指定的类型匹配（基于 `isinstance`）。
3. 将所有匹配的异常收集到一个新的 `ExceptionGroup` 中，交给当前 `except*` 分支处理。
4. 所有不匹配的异常，组成另一个新的 `ExceptionGroup`，继续与下一个 `except*` 分支匹配。
5. 如果处理完所有 `except*` 分支后还有剩余不匹配的异常，它们被包装成 `ExceptionGroup` 向上传播。

```python
def except_star_split_demo():
    """手动模拟 except* 的拆分逻辑"""
    group = ExceptionGroup("原始组", [
        ValueError("v1"),
        TypeError("t1"),
        ValueError("v2"),
        RuntimeError("r1"),
    ])
    
    # 模拟 except* ValueError 的分支：
    value_errors = []
    rest = []
    for exc in group.exceptions:
        if isinstance(exc, ValueError):
            value_errors.append(exc)
        else:
            rest.append(exc)
    
    if value_errors:
        print(f"处理 ValueError 组：{[str(e) for e in value_errors]}")
        # 模拟 except* 处理后的"已删除"行为
    
    # 剩余异常继续匹配下一个 except*
    type_errors = []
    rest2 = []
    for exc in rest:
        if isinstance(exc, TypeError):
            type_errors.append(exc)
        else:
            rest2.append(exc)
    
    if type_errors:
        print(f"处理 TypeError 组：{[str(e) for e in type_errors]}")
    
    # 还有剩余异常，向上传播
    if rest2:
        remaining = ExceptionGroup("未匹配", rest2)
        print(f"未匹配异常：{remaining}")

except_star_split_demo()
```

### 4.4 Python 异常匹配的 `isinstance` 与短路机制

Python 异常匹配的核心算法等价于以下伪代码：

```python
def match_exception(raised_exception, except_clauses):
    """
    模拟 Python 的异常匹配流程
    
    except_clauses: 按顺序排列的 (exception_types, handler_code) 列表
    exception_types 可以是单个异常类或元组
    """
    for exc_types, handler in except_clauses:
        # 如果是元组，逐个检查
        if isinstance(exc_types, tuple):
            if any(isinstance(raised_exception, t) for t in exc_types):
                handler(raised_exception)
                return  # 匹配后立即终止
        else:
            if isinstance(raised_exception, exc_types):
                handler(raised_exception)
                return
    # 所有 except 都不匹配，异常继续传播
    raise raised_exception
```

**短路检查的顺序**：Python 在两个层面实现了短路——

1. **分支级短路**：一旦某个 `except` 分支匹配，后续所有分支都不检查。
2. **异常类型元组级短路**：`except (A, B, C) as e` 中，只要找到第一个匹配的类型就停止检查元组中的后续类型（不过这通常不重要，因为 `isinstance` 很快）。

```python
# 短路检查的副作用
def signal_side_effect():
    """某种类型检查函数可能需要的 IO"""
    pass  # 只是演示短路

# 分支短路意味着永远不会检查后面的类型
try:
    raise ValueError("错误")
except ValueError:
    print("ValueError 被匹配")
    # 这一行不会检查：
    # except TypeError:
    #     pass  # 不可能执行
```

### 4.5 `raise` 不带参数时的栈帧状态

当在 `except` 块中使用 `raise` 不带参数时，Python 使用 `current_exception()` 机制（Python 3.11+）或帧级异常状态（Python 3.10-）来"重新激发"当前正在处理的异常。这个机制的本质是：

1. Python 的每个栈帧（`frame` 对象）维护一个"当前异常"状态。
2. `except` 块开始时，当前异常被设置到帧状态中。
3. 不带参数的 `raise` 读取帧状态的异常并重新抛出。
4. `except` 块结束后（离开 `except` 域），帧状态的异常被清除。

```python
import sys

def raise_without_arg_mechanism():
    """演示 raise 不带参数时如何复用当前异常"""
    try:
        1 / 0
    except ZeroDivisionError as e:
        # 此时 sys.exc_info() 返回当前异常
        exc_type, exc_value, exc_tb = sys.exc_info()
        print(f"当前异常：{exc_type.__name__}: {exc_value}")
        
        # raise 不带参数 ＝＞ raise sys.exc_info()[:2] 激活的异常
        raise
    
    print("不会执行到这里")

# raise_without_arg_mechanism()
# 会打印：当前异常：ZeroDivisionError: division by zero
# 然后抛出 ZeroDivisionError
```

**`raise` 不带参数在 `except` 块外的行为**：如果在 `except` 块外使用不带参数的 `raise`，Python 无法找到"当前异常"，会抛出一个 `RuntimeError: No active exception to reraise`。

```python
def raise_outside_except():
    """在 except 块外 raise 无参数"""
    try:
        result = function_that_handles_error()
    except RuntimeError as e:
        print(f"捕获到 RuntimeError: {e}")

def function_that_handles_error():
    try:
        try:
            1 / 0
        except ZeroDivisionError:
            # 还在 except 块内
            pass
        # 以下 raise 在 except 块外
        raise  # RuntimeError: No active exception to reraise
    except RuntimeError as e:
        raise  # 现在在 except 块内，安全
```

---

## 5. 总结

### 5.1 本文内容回顾

- **捕获多个异常的基本形式**：
  - 多个 `except` 分支：每个分支捕获一个（或一类）异常，各自有独立处理代码。
  - `except (Type1, Type2):` 元组形式：处理逻辑相同的异常合并捕获，节省重复代码。
  - 混合形式：同时使用多个 `except` 分支和元组形式。

- **匹配顺序与优先级**：
  - `try-except` 按从上到下的顺序检查每个分支，"先匹配先捕获"。
  - 匹配基于 `isinstance(raised_exception, ExceptionType)`，因此父类分支能捕获子类异常。
  - 子类分支应该放在父类分支前面，否则子类分支无法被执行。

- **异常类的继承层次**：
  - `BaseException`：所有异常基类（包含 `SystemExit`、`KeyboardInterrupt`）。
  - `Exception`：所有常规异常的基类，一般用 `except Exception` 兜底。
  - 继承层次结构使 `except Exception` 能捕获绝大多数编程异常。
  - `except BaseException` 是危险的（会吞掉 `Ctrl+C`）。

- **未匹配异常的向上传播**：
  - 如果所有 `except` 分支都不匹配，异常沿调用栈传播。

- **`sys.exc_info()`**：
  - 返回三元组 `(type, value, traceback)`。
  - 只在 `except` 块中有值，在 `except` 块外返回 `(None, None, None)`。
  - 线程安全的，每个线程维护独立的异常状态。

- **Python 3.11+ 的 `ExceptionGroup` 与 `except*`**：
  - `ExceptionGroup` 包装一组同时发生的异常。
  - `except*` 从 `ExceptionGroup` 中按类型提取异常并分组处理。
  - 不能与传统的 `except` 混用在同一个 `try` 块中。
  - 适用于 asyncio 并发和 `TaskGroup` 等多异常场景。

- **多重 `except` vs 多个 `try-except`**：
  - 异常类型决定处理策略 -> 一个 `try` + 多个 `except`。
  - 异常来源（哪个步骤）决定处理策略 -> 多个 `try-except`。
  - 混合策略：外层按粒度独立、内层按类型区分。

- **不同异常的不同处理策略**：
  - 记录日志 + 继续、返回默认值、重试、重新抛出、转换异常。
  - 策略取决于异常的"可恢复性"和"严重程度"。

### 5.2 读完本文你应能掌握

- 在 Python 中用多个 `except` 分支捕获不同类型的异常，每条分支给出特定的处理代码。
- 用 `except (TypeA, TypeB):` 元组形式合并捕获处理逻辑相同的多个异常，减少重复。
- 正确排列 `except` 分支的顺序（从具体到通用），避免父类分支屏蔽子类分支。
- 基于 Python 异常的继承层次，判断某个 `except` 分支是否能捕获特定异常。
- 说明 `except Exception` 能捕获哪些异常、不能捕获哪些（如 `SystemExit`）。
- 知道当不存在匹配的 `except` 分支时异常会沿调用栈向上传播。
- 使用 `sys.exc_info()` 获取异常类型、值和回溯信息用于调试和日志。
- 使用 Python 3.11+ 的 `ExceptionGroup` 和 `except*` 处理一组同时发生的异常。
- 在"一个 try 多个 except" 与"多个 try-except" 之间做出合理选择。
- 为不同类型的异常设计不同的处理策略（重试、降级、报告）。

### 5.3 延伸方向

- **自定义异常**：为业务场景定义特定的异常类、建立异常层次结构的基础（见配套笔记）。
- **异常链（`raise ... from`）**：如何保留异常上下文、构建异常链和处理链（见《异常链 raise from》）。
- **`else` 子句**：try-except-else 结构中 else 子句的作用（见《else 子句》）。
- **`finally` 子句**：无论是否发生异常都会执行的清理逻辑（见《finally 子句》）。
- **`with` 语句与上下文管理器**：通过 `__enter__`/`__exit__` 自动管理资源和异常（见《with 与上下文管理器协议》）。